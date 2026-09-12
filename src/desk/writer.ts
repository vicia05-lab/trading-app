import { createHash } from "node:crypto";
import type { Sql } from "@/lib/db";
import { withTransaction } from "@/lib/db";
import { field, sha256 } from "@/kernel/index";
import { asHex, DeskError, hexBuf, jsonCanon, newId, requestHash } from "./util";

export type Gate = {
  next_event_seq: number;
  last_authoritative_time: string;
  clock_trusted: boolean;
};

export type WriterCtx = {
  sql: Sql;
  now: Date;
  seq: number;
  actor: string;
};

export async function withWriter<T>(
  actor: string,
  fn: (ctx: WriterCtx) => Promise<T>,
): Promise<T> {
  return withTransaction(async (sql) => {
    const gates = await sql.query<Gate>(
      `SELECT next_event_seq, last_authoritative_time::text, clock_trusted FROM writer_gate WHERE singleton_key = TRUE FOR UPDATE`,
    );
    if (gates.length !== 1) throw new DeskError("WRITER_GATE_MISSING", "writer gate missing or duplicated", 503);
    const clock = await sql.query<{ now_utc: string; trusted: boolean; source: string }>(
      `SELECT now_utc::text, trusted, source FROM fixture_clock WHERE singleton_key = TRUE FOR UPDATE`,
    );
    if (clock.length !== 1) throw new DeskError("CLOCK_UNTRUSTED", "fixture clock missing", 503, false);
    const now = new Date(clock[0].now_utc);
    const last = new Date(gates[0].last_authoritative_time);
    if (!clock[0].trusted || !gates[0].clock_trusted) {
      throw new DeskError("CLOCK_UNTRUSTED", "trusted clock unavailable", 503);
    }
    if (now < last) {
      await sql.query(`UPDATE writer_gate SET clock_trusted = FALSE WHERE singleton_key = TRUE`);
      throw new DeskError("CLOCK_UNTRUSTED", "clock moved backward", 503);
    }
    const seq = Number(gates[0].next_event_seq);
    await sql.query(`UPDATE writer_gate SET next_event_seq = $1, last_authoritative_time = $2 WHERE singleton_key = TRUE`, [
      seq + 1,
      now.toISOString(),
    ]);
    return fn({ sql, now, seq, actor });
  });
}

export async function appendEvent(
  ctx: WriterCtx,
  args: {
    commandId: string;
    type: string;
    payload: unknown;
    receipt: unknown;
    request?: unknown;
  },
): Promise<{ eventSeq: number; eventId: string }> {
  const eventId = newId("evt");
  const req = requestHash(args.request ?? args.payload);
  const canonical = jsonCanon(args.payload);
  const preimage = Buffer.concat([
    field(Buffer.from("Trading App|event|1", "ascii")),
    field(Buffer.from(String(ctx.seq), "utf8")),
    field(Buffer.from(args.commandId, "utf8")),
    field(Buffer.from(ctx.actor, "utf8")),
    field(Buffer.from(ctx.now.toISOString(), "utf8")),
    field(req),
    field(Buffer.from(canonical, "utf8")),
  ]);
  const eventHash = createHash("sha256").update(preimage).digest();
  try {
    await ctx.sql.query(
      `INSERT INTO event_log (
        event_seq, event_id, command_id, request_hash, event_type, actor_principal_id,
        occurred_at, semantic_payload, canonical_payload, result_receipt, event_hash
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9,$10::jsonb,$11)`,
      [
        ctx.seq,
        eventId,
        args.commandId,
        req,
        args.type,
        ctx.actor,
        ctx.now.toISOString(),
        JSON.stringify(args.payload),
        canonical,
        JSON.stringify(args.receipt),
        eventHash,
      ],
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (/event_log_command_id|command_id/i.test(msg) || /unique/i.test(msg)) {
      throw new DeskError("IDEMPOTENCY_CONFLICT", "command_id already used", 409);
    }
    throw err;
  }
  return { eventSeq: ctx.seq, eventId };
}

export async function loadExistingCommand<T>(sql: Sql, commandId: string): Promise<T | null> {
  const rows = await sql.query<{ result_receipt: T; event_type: string }>(
    `SELECT result_receipt, event_type FROM event_log WHERE command_id = $1`,
    [commandId],
  );
  if (!rows.length) return null;
  return rows[0].result_receipt;
}

export async function raiseAlarm(
  ctx: WriterCtx,
  code: string,
  component: string,
  details: unknown,
  blocks = false,
): Promise<void> {
  const existing = await ctx.sql.query<{ alarm_id: string }>(
    `SELECT alarm_id FROM ops_alarm WHERE code = $1 AND status <> 'RESOLVED'`,
    [code],
  );
  if (existing.length) {
    await ctx.sql.query(`UPDATE ops_alarm SET last_seen = $1, safe_details = $2::jsonb WHERE alarm_id = $3`, [
      ctx.now.toISOString(),
      JSON.stringify(details),
      existing[0].alarm_id,
    ]);
    return;
  }
  const id = newId("alm");
  await ctx.sql.query(
    `INSERT INTO ops_alarm (
      alarm_id, code, component, first_seen, last_seen, related_ids, blocks_new_admission, status, safe_details, opened_event_seq
    ) VALUES ($1,$2,$3,$4,$4,$5::jsonb,$6,'OPEN',$7::jsonb,$8)`,
    [id, code, component, ctx.now.toISOString(), JSON.stringify([]), blocks, JSON.stringify(details), ctx.seq],
  );
}

export async function recomputeRisk(sql: Sql): Promise<{ count: number; notional: string }> {
  const rows = await sql.query<{ c: number; n: string | null }>(
    `SELECT COUNT(*)::int AS c, COALESCE(SUM(original_reserved_notional),0)::text AS n
     FROM "position" WHERE state <> 'CLOSED'`,
  );
  return { count: Number(rows[0]?.c ?? 0), notional: rows[0]?.n ?? "0.0000" };
}

export async function lockRisk(sql: Sql): Promise<{ reserved_count: number; reserved_notional: string }> {
  const rows = await sql.query<{ reserved_count: number; reserved_notional: string }>(
    `SELECT reserved_count, reserved_notional::text FROM desk_risk_state WHERE sleeve = 'EARNINGS' FOR UPDATE`,
  );
  if (rows.length !== 1) throw new DeskError("RISK_STATE_MISSING", "risk singleton missing", 503);
  return rows[0];
}

export async function assertRiskMatches(sql: Sql): Promise<void> {
  const cached = await lockRisk(sql);
  const actual = await recomputeRisk(sql);
  const cachedN = Number(cached.reserved_notional);
  const actualN = Number(actual.notional);
  if (cached.reserved_count !== actual.count || Math.abs(cachedN - actualN) > 0.00005) {
    throw new DeskError("RISK_STATE_MISMATCH", "cached risk disagrees with positions", 503);
  }
}

export function digest32(hex: string): Buffer {
  return hexBuf(hex);
}

void asHex;
void sha256;
