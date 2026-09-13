import { getSql } from "@/lib/db";
import { add, bandHit, canon, dec, decToCanonical, directionHit, div, modeledFill, mul, paperPnl, quantizeHalfUp, sha256, sub, subNotional } from "@/kernel/index";
import { appendEvent, assertRiskMatches, loadExistingCommand, lockRisk, raiseAlarm, withWriter, type WriterCtx } from "./writer";
import { DeskError, asHex, hexBuf, jsonCanon, newId } from "./util";

const EDGES: Record<string, string[]> = {
  COMMITTED_IRREVOCABLE: ["FILLED", "NO_FILL", "IMPAIRED_ENTRY"],
  IMPAIRED_ENTRY: ["FILLED", "NO_FILL"],
  FILLED: ["FLAT", "IMPAIRED_EXIT"],
  IMPAIRED_EXIT: ["FLAT"],
  FLAT: ["CLOSED"],
  NO_FILL: ["CLOSED"],
  CLOSED: [],
};

function transitionOk(from: string, to: string): boolean {
  return (EDGES[from] ?? []).includes(to);
}

export async function advanceClock(iso: string, actor: string) {
  return withWriter(actor, async (ctx) => {
    const next = new Date(iso);
    if (next < ctx.now) throw new DeskError("CLOCK_UNTRUSTED", "cannot move fixture clock backward");
    await ctx.sql.query(`UPDATE fixture_clock SET now_utc = $1 WHERE singleton_key = TRUE`, [next.toISOString()]);
    await appendEvent(ctx, {
      commandId: newId("cmd"),
      type: "CLOCK_ADVANCE",
      payload: { to: next.toISOString() },
      receipt: { now: next.toISOString() },
    });
    return { now: next.toISOString() };
  });
}

export async function applyFreezeDeadline(commandId: string, manifestId: string, actor: string) {
  const sql = await getSql();
  const prior = await loadExistingCommand(sql, commandId);
  if (prior) return prior;
  return withWriter(actor, async (ctx) => {
    const dl = await ctx.sql.query<{ deadline_id: string; scheduled_at: string; applied_event_seq: number | null }>(
      `SELECT deadline_id, scheduled_at::text, applied_event_seq FROM deadline WHERE kind = 'FREEZE' AND manifest_id = $1 FOR UPDATE`,
      [manifestId],
    );
    if (!dl.length) throw new DeskError("NOT_FOUND", "freeze deadline missing", 404);
    if (dl[0].applied_event_seq) {
      return { duplicate: true, manifest_id: manifestId };
    }
    if (ctx.now.getTime() < new Date(dl[0].scheduled_at).getTime()) {
      throw new DeskError("NOT_DUE", "freeze deadline not due");
    }
    const members = await ctx.sql.query<{ permanent_security_id: string }>(
      `SELECT permanent_security_id FROM manifest_member WHERE manifest_id = $1`,
      [manifestId],
    );
    const frozen = await ctx.sql.query<{ permanent_security_id: string }>(
      `SELECT permanent_security_id FROM "freeze" WHERE manifest_id = $1`,
      [manifestId],
    );
    const frozenSet = new Set(frozen.map((f) => f.permanent_security_id));
    const missing = members.filter((m) => !frozenSet.has(m.permanent_security_id));
    const { eventSeq } = await appendEvent(ctx, {
      commandId,
      type: "DEADLINE_FREEZE",
      payload: { manifest_id: manifestId },
      receipt: { no_freeze: missing.map((m) => m.permanent_security_id) },
    });
    for (const m of missing) {
      await ctx.sql.query(
        `INSERT INTO grade (
          grade_id, manifest_id, permanent_security_id, freeze_id, vintage, outcome, reason_codes, event_status,
          in_evidence_set, late_label_recovery, confound_flags, label_policy_hash, values, content_hash, created_event_seq
        ) VALUES ($1,$2,$3,NULL,0,'NO_FREEZE',$4::jsonb,'UNRESOLVED',FALSE,FALSE,$5::jsonb,$6,$7::jsonb,$8,$9)`,
        [
          newId("grd"),
          manifestId,
          m.permanent_security_id,
          JSON.stringify(["NO_FREEZE_AT_CUTOFF"]),
          JSON.stringify([]),
          hexBuf("11".repeat(32)),
          JSON.stringify({ direction_hit: null, band_hit: null }),
          hexBuf(sha256(canon({ manifestId, sec: m.permanent_security_id, outcome: "NO_FREEZE" }))),
          eventSeq,
        ],
      );
    }
    const n = members.length;
    const f = frozen.length;
    let resolution: "FULL" | "PARTIAL" | "ABANDONED" | "EMPTY" = "EMPTY";
    if (n === 0) resolution = "EMPTY";
    else if (f === n) resolution = "FULL";
    else if (f === 0) resolution = "ABANDONED";
    else resolution = "PARTIAL";
    if (resolution === "PARTIAL") await raiseAlarm(ctx, "PARTIAL_FREEZE_OCCURRED", "freeze", { manifestId, f, n }, false);
    await ctx.sql.query(
      `UPDATE manifest SET freeze_resolution = $1, admission_closed_event_seq = $2 WHERE manifest_id = $3`,
      [resolution, eventSeq, manifestId],
    );
    await ctx.sql.query(
      `UPDATE deadline SET applied_event_seq = $1, applied_at = $2 WHERE deadline_id = $3`,
      [eventSeq, ctx.now.toISOString(), dl[0].deadline_id],
    );
    return { manifest_id: manifestId, resolution, no_freeze_count: String(missing.length) };
  });
}

type Mark = { observation_id: string; price: string; hash: string; state: string; session: string };

async function officialMark(
  ctx: WriterCtx,
  sec: string,
  type: string,
  session: string,
): Promise<Mark | null> {
  const rows = await ctx.sql.query<{
    observation_id: string;
    observation_hash: Buffer;
    envelope: { payload?: Record<string, unknown> };
    session_date: string;
  }>(
    `SELECT observation_id, observation_hash, envelope, session_date::text FROM observation
     WHERE permanent_security_id = $1 AND snapshot_type = $2 AND session_date = $3 AND tombstoned = FALSE
     ORDER BY received_at ASC`,
    [sec, type, session],
  );
  if (!rows.length) return null;
  const p = rows[0].envelope?.payload ?? {};
  const stateRaw = p.state;
  if (typeof stateRaw !== "string") return null;
  if (stateRaw !== "OFFICIAL" && stateRaw !== "OFFICIAL_CORRECTED") return null;
  const price = typeof p.price === "string" ? p.price : "";
  if (!price) return null;
  return { observation_id: rows[0].observation_id, price, hash: asHex(rows[0].observation_hash), state: stateRaw, session };
}

export async function adjudicateMember(commandId: string, manifestId: string, securityId: string, actor: string) {
  const sql = await getSql();
  const prior = await loadExistingCommand(sql, commandId);
  if (prior) return prior;
  return withWriter(actor, async (ctx) => {
    await appendEvent(ctx, {
      commandId,
      type: "GRADE",
      payload: { manifest_id: manifestId, permanent_security_id: securityId },
      receipt: { ok: true },
    });
    return adjudicateInner(ctx, commandId, manifestId, securityId);
  });
}

async function adjudicateInner(ctx: WriterCtx, commandId: string, manifestId: string, securityId: string) {
  const existing = await ctx.sql.query<{ grade_id: string }>(
    `SELECT grade_id FROM grade WHERE manifest_id = $1 AND permanent_security_id = $2 AND vintage = 0`,
    [manifestId, securityId],
  );
  if (existing.length) return { grade_id: existing[0].grade_id, duplicate: true };
  const man = await ctx.sql.query<{ session_date: string; next_session_date: string; window_id: string }>(
    `SELECT session_date::text, next_session_date::text, window_id FROM manifest WHERE manifest_id = $1`,
    [manifestId],
  );
  const fr = await ctx.sql.query<{
    freeze_id: string;
    decision: string;
    direction: string | null;
    output_payload: { magnitude_low?: string | null; magnitude_high?: string | null };
  }>(
    `SELECT freeze_id, decision, direction, output_payload FROM "freeze" WHERE manifest_id = $1 AND permanent_security_id = $2`,
    [manifestId, securityId],
  );
  const ca = await ctx.sql.query<{ observation_id: string }>(
    `SELECT observation_id FROM observation WHERE permanent_security_id = $1 AND snapshot_type = 'CORPORATE_ACTION' AND session_date = $2`,
    [securityId, man[0].session_date],
  );
  const entry = await officialMark(ctx, securityId, "MARK_ENTRY_CLOSE", man[0].session_date);
  const exit = await officialMark(ctx, securityId, "MARK_EXIT_OPEN", man[0].next_session_date);
  let outcome: "GRADED" | "UNGRADEABLE" | "NO_EVENT" = "UNGRADEABLE";
  const reasons: string[] = [];
  let values: Record<string, unknown> = { direction_hit: null, band_hit: null, raw_gap: null };
  let inEvidence = false;
  if (!fr.length) {
    return { grade_id: null, outcome: "NO_FREEZE", in_evidence_set: false, reasons: ["NO_FREEZE"] };
  } else if (ca.length) {
    outcome = "UNGRADEABLE";
    reasons.push("CORPORATE_ACTION");
  } else if (!entry || !exit) {
    outcome = "UNGRADEABLE";
    if (!entry) reasons.push("MISSING_ENTRY_MARK");
    if (!exit) reasons.push("MISSING_EXIT_MARK");
  } else {
    outcome = "GRADED";
    const hit = directionHit(entry.price, exit.price);
    const band =
      fr[0].decision === "PREDICT" && fr[0].output_payload.magnitude_low && fr[0].output_payload.magnitude_high
        ? bandHit(entry.price, exit.price, fr[0].output_payload.magnitude_low, fr[0].output_payload.magnitude_high)
        : null;
    const rawGap = decToCanonical(
      quantizeHalfUp(sub(div(dec(exit.price, 6), dec(entry.price, 6), 16), dec("1", 0)), 12),
      12,
    );
    values = {
      entry_price: entry.price,
      exit_price: exit.price,
      raw_gap: rawGap,
      direction_hit: fr[0].decision === "PREDICT" ? hit : null,
      band_hit: fr[0].decision === "PREDICT" ? band : null,
      predicted_direction: fr[0].direction,
    };
    inEvidence = true;
  }
  const { eventSeq } = { eventSeq: ctx.seq };
  const gradeId = newId("grd");
  await ctx.sql.query(
    `INSERT INTO grade (
      grade_id, manifest_id, permanent_security_id, freeze_id, vintage, outcome, reason_codes, event_status,
      in_evidence_set, late_label_recovery, confound_flags, label_policy_hash, values, content_hash, created_event_seq
    ) VALUES ($1,$2,$3,$4,0,$5,$6::jsonb,$7,$8,FALSE,$9::jsonb,$10,$11::jsonb,$12,$13)`,
    [
      gradeId,
      manifestId,
      securityId,
      fr[0]?.freeze_id ?? null,
      outcome,
      JSON.stringify(reasons),
      ca.length ? "CONFIRMED_INTENDED_EVENT" : "CONFIRMED_INTENDED_EVENT",
      inEvidence,
      JSON.stringify(ca.length ? ["CORPORATE_ACTION"] : []),
      hexBuf("22".repeat(32)),
      JSON.stringify(values),
      hexBuf(sha256(canon({ gradeId, outcome, values }))),
      eventSeq,
    ],
  );
  const pos = await ctx.sql.query<{ position_id: string; state: string; cas_token: string }>(
    `SELECT position_id, state, cas_token::text FROM "position" WHERE freeze_id = $1 FOR UPDATE`,
    [fr[0]?.freeze_id ?? ""],
  );
  if (pos.length && (pos[0].state === "FLAT" || pos[0].state === "NO_FILL")) {
    await closeAndRelease(ctx, pos[0].position_id);
  }
  return { grade_id: gradeId, outcome, in_evidence_set: inEvidence, reasons };
}

export async function applyMarkWait(commandId: string, manifestId: string, securityId: string, actor: string) {
  const sql = await getSql();
  const prior = await loadExistingCommand(sql, commandId);
  if (prior) return prior;
  return withWriter(actor, async (ctx) => {
    const dl = await ctx.sql.query<{ deadline_id: string; scheduled_at: string; applied_event_seq: number | null }>(
      `SELECT deadline_id, scheduled_at::text, applied_event_seq FROM deadline
       WHERE kind = 'MARK_WAIT' AND manifest_id = $1 AND permanent_security_id = $2 FOR UPDATE`,
      [manifestId, securityId],
    );
    if (!dl.length) throw new DeskError("NOT_FOUND", "mark-wait missing", 404);
    if (dl[0].applied_event_seq) return { duplicate: true };
    if (ctx.now.getTime() < new Date(dl[0].scheduled_at).getTime()) throw new DeskError("NOT_DUE", "mark-wait not due");
    const { eventSeq } = await appendEvent(ctx, {
      commandId,
      type: "DEADLINE_MARK_WAIT",
      payload: { manifest_id: manifestId, permanent_security_id: securityId },
      receipt: { applied: true },
    });
    const grade = await adjudicateInner(ctx, newId("cmd"), manifestId, securityId);
    const man = await ctx.sql.query<{ session_date: string; next_session_date: string }>(
      `SELECT session_date::text, next_session_date::text FROM manifest WHERE manifest_id = $1`,
      [manifestId],
    );
    const pos = await ctx.sql.query<{
      position_id: string;
      state: string;
      cas_token: string;
      freeze_id: string;
      original_reserved_notional: string;
    }>(
      `SELECT p.position_id, p.state, p.cas_token::text, p.freeze_id, p.original_reserved_notional::text
       FROM "position" p JOIN "freeze" f ON f.freeze_id = p.freeze_id
       WHERE f.manifest_id = $1 AND f.permanent_security_id = $2 FOR UPDATE`,
      [manifestId, securityId],
    );
    if (pos.length) {
      await settleOrImpair(ctx, pos[0], man[0].session_date, man[0].next_session_date, securityId);
    }
    await ctx.sql.query(`UPDATE deadline SET applied_event_seq = $1, applied_at = $2 WHERE deadline_id = $3`, [
      eventSeq,
      ctx.now.toISOString(),
      dl[0].deadline_id,
    ]);
    const left = await ctx.sql.query<{ c: number }>(
      `SELECT COUNT(*)::int AS c FROM deadline WHERE kind = 'MARK_WAIT' AND manifest_id = $1 AND applied_event_seq IS NULL`,
      [manifestId],
    );
    if (left[0].c === 0) {
      await ctx.sql.query(`UPDATE manifest SET research_closed_event_seq = $1 WHERE manifest_id = $2`, [eventSeq, manifestId]);
    }
    return { grade, position: pos[0]?.position_id ?? null };
  });
}

async function settleOrImpair(
  ctx: WriterCtx,
  pos: { position_id: string; state: string; freeze_id: string; original_reserved_notional: string },
  session: string,
  next: string,
  securityId: string,
) {
  const entry = await officialMark(ctx, securityId, "MARK_ENTRY_CLOSE", session);
  const exit = await officialMark(ctx, securityId, "MARK_EXIT_OPEN", next);
  const ca = await ctx.sql.query<{ envelope: { payload?: Record<string, unknown> } }>(
    `SELECT envelope FROM observation WHERE permanent_security_id = $1 AND snapshot_type = 'CORPORATE_ACTION' AND session_date = $2`,
    [securityId, session],
  );
  if (pos.state === "COMMITTED_IRREVOCABLE") {
    if (!entry) {
      await setState(ctx, pos.position_id, pos.state, "IMPAIRED_ENTRY");
      await raiseAlarm(ctx, "ENTRY_EVIDENCE_UNRESOLVED", "marks", { position: pos.position_id }, false);
      return;
    }
    const fill = modeledFill(entry.price);
    const evId = newId("eev");
    await ctx.sql.query(
      `INSERT INTO entry_evidence (entry_evidence_id, position_id, kind, source_ids, calc, content_hash, event_seq)
       VALUES ($1,$2,'OFFICIAL_FILL',$3::jsonb,$4::jsonb,$5,$6)`,
      [
        evId,
        pos.position_id,
        JSON.stringify([entry.observation_id]),
        JSON.stringify({ official_close: entry.price, modeled_fill: fill, cost_model_basis: "CONSERVATIVE_STRESS_HAIRCUT" }),
        hexBuf(sha256(canon({ fill, entry: entry.price }))),
        ctx.seq,
      ],
    );
    await ctx.sql.query(`UPDATE "position" SET state = 'FILLED', entry_evidence_id = $1, cas_token = cas_token + 1, last_transition_event_seq = $2 WHERE position_id = $3`, [
      evId,
      ctx.seq,
      pos.position_id,
    ]);
    pos.state = "FILLED";
  }
  if (pos.state === "FILLED" || pos.state === "IMPAIRED_EXIT") {
    if (ca.length) {
      const p = ca[0].envelope?.payload ?? {};
      const splitRaw = p.split_multiplier;
      const distRaw = p.distribution ?? "0.000000";
      if (typeof splitRaw !== "string" || typeof distRaw !== "string") {
        await setState(ctx, pos.position_id, pos.state, "IMPAIRED_EXIT");
        return;
      }
      let split;
      let dist;
      try {
        split = dec(splitRaw, 6, "0.000001", "100");
        dist = dec(distRaw, 6, "0", "1000000");
      } catch {
        await setState(ctx, pos.position_id, pos.state, "IMPAIRED_EXIT");
        return;
      }
      const filled = await ctx.sql.query<{ calc: { modeled_fill: string; official_close: string } }>(
        `SELECT calc FROM entry_evidence WHERE position_id = $1 ORDER BY event_seq DESC LIMIT 1`,
        [pos.position_id],
      );
      const fill = filled[0].calc.modeled_fill;
      const exitMark = exit ?? (await officialMark(ctx, securityId, "MARK_BOOK_FALLBACK", next));
      if (!exitMark) {
        await setState(ctx, pos.position_id, pos.state, "IMPAIRED_EXIT");
        return;
      }
      const units = div(dec("5000.0000", 4), dec(fill, 12), 12);
      const exitUnits = mul(units, split);
      const cash = mul(units, dist);
      const exitVal = mul(exitUnits, dec(exitMark.price, 6));
      const pnl = decToCanonical(quantizeHalfUp(sub(add(exitVal, cash), dec("5000.0000", 4)), 4), 4);
      await writeBook(ctx, pos.position_id, "CORPORATE_ACTION", {
        modeled_fill: fill,
        exit_price: exitMark.price,
        paper_pnl: pnl,
        split_multiplier: splitRaw,
        original_notional: pos.original_reserved_notional,
      }, false);
      await setState(ctx, pos.position_id, "FILLED", "FLAT");
    } else if (!exit) {
      await setState(ctx, pos.position_id, pos.state === "FILLED" ? "FILLED" : pos.state, "IMPAIRED_EXIT");
      await raiseAlarm(ctx, "EXIT_EVIDENCE_UNRESOLVED", "marks", { position: pos.position_id }, false);
      await raiseAlarm(ctx, "DESK_CAPACITY_BLOCKED_ON_MARKS", "risk", { position: pos.position_id }, true);
      return;
    } else {
      const filled = await ctx.sql.query<{ calc: { modeled_fill: string } }>(
        `SELECT calc FROM entry_evidence WHERE position_id = $1 ORDER BY event_seq DESC LIMIT 1`,
        [pos.position_id],
      );
      const fill = filled[0].calc.modeled_fill;
      const pnl = paperPnl(pos.original_reserved_notional, exit.price, fill, "0.0000");
      await writeBook(ctx, pos.position_id, "ORIGINAL_PLAN", {
        modeled_fill: fill,
        exit_price: exit.price,
        paper_pnl: pnl,
        original_notional: pos.original_reserved_notional,
        cost_model_basis: "CONSERVATIVE_STRESS_HAIRCUT",
        paper_pnl_source_class: "ESTIMATED",
      }, true);
      await setState(ctx, pos.position_id, pos.state, "FLAT");
    }
  }
  const g = await ctx.sql.query<{ grade_id: string }>(
    `SELECT grade_id FROM grade WHERE manifest_id = (SELECT manifest_id FROM "freeze" WHERE freeze_id = $1) AND permanent_security_id = $2 AND vintage = 0`,
    [pos.freeze_id, securityId],
  );
  const st = await ctx.sql.query<{ state: string }>(`SELECT state FROM "position" WHERE position_id = $1`, [pos.position_id]);
  if (g.length && (st[0].state === "FLAT" || st[0].state === "NO_FILL")) {
    await closeAndRelease(ctx, pos.position_id);
  }
}

async function setState(ctx: WriterCtx, positionId: string, from: string, to: string) {
  if (from === to) return;
  if (!transitionOk(from, to)) throw new DeskError("ILLEGAL_TRANSITION", `${from} -> ${to}`);
  await ctx.sql.query(
    `UPDATE "position" SET state = $1, cas_token = cas_token + 1, last_transition_event_seq = $2 WHERE position_id = $3 AND state = $4`,
    [to, ctx.seq, positionId, from],
  );
}

async function writeBook(
  ctx: WriterCtx,
  positionId: string,
  basis: string,
  values: Record<string, unknown>,
  eligible: boolean,
) {
  const last = await ctx.sql.query<{ v: number }>(`SELECT COALESCE(MAX(vintage),-1)::int AS v FROM book_vintage WHERE position_id = $1`, [positionId]);
  const vintage = last[0].v + 1;
  const id = newId("bk");
  await ctx.sql.query(
    `INSERT INTO book_vintage (
      book_vintage_id, position_id, vintage, basis, status, values, content_hash, source_class, strategy_pnl_eligible, created_event_seq
    ) VALUES ($1,$2,$3,$4,'PRICED',$5::jsonb,$6,'ESTIMATED',$7,$8)`,
    [id, positionId, vintage, basis, JSON.stringify(values), hexBuf(sha256(canon(values))), eligible, ctx.seq],
  );
  await ctx.sql.query(`UPDATE "position" SET last_book_vintage_id = $1 WHERE position_id = $2`, [id, positionId]);
}

async function closeAndRelease(ctx: WriterCtx, positionId: string) {
  await assertRiskMatches(ctx.sql);
  const row = await ctx.sql.query<{ state: string; original_reserved_notional: string }>(
    `SELECT state, original_reserved_notional::text FROM "position" WHERE position_id = $1 FOR UPDATE`,
    [positionId],
  );
  if (!row.length) throw new DeskError("NOT_FOUND", "position missing", 404);
  if (row[0].state === "CLOSED") return;
  if (row[0].state !== "FLAT" && row[0].state !== "NO_FILL") {
    throw new DeskError("ILLEGAL_TRANSITION", `cannot close from ${row[0].state}`);
  }
  const cached = await lockRisk(ctx.sql);
  await ctx.sql.query(
    `UPDATE "position" SET state = 'CLOSED', closed_event_seq = $1, release_event_seq = $1, cas_token = cas_token + 1, last_transition_event_seq = $1 WHERE position_id = $2`,
    [ctx.seq, positionId],
  );
  await ctx.sql.query(
    `UPDATE desk_risk_state SET reserved_count = $1, reserved_notional = $2, updated_event_seq = $3 WHERE sleeve = 'EARNINGS'`,
    [cached.reserved_count - 1, subNotional(String(cached.reserved_notional), String(row[0].original_reserved_notional)), ctx.seq],
  );
}

export async function applyReportFinalize(commandId: string, manifestId: string, actor: string) {
  const sql = await getSql();
  const prior = await loadExistingCommand(sql, commandId);
  if (prior) return prior;
  return withWriter(actor, async (ctx) => {
    const dl = await ctx.sql.query<{ deadline_id: string; scheduled_at: string; applied_event_seq: number | null }>(
      `SELECT deadline_id, scheduled_at::text, applied_event_seq FROM deadline WHERE kind = 'REPORT_FINALIZE' AND manifest_id = $1 FOR UPDATE`,
      [manifestId],
    );
    if (!dl.length) throw new DeskError("NOT_FOUND", "report deadline missing", 404);
    if (dl[0].applied_event_seq) return { duplicate: true };
    if (ctx.now.getTime() < new Date(dl[0].scheduled_at).getTime()) throw new DeskError("NOT_DUE", "report not due");
    const { eventSeq } = await appendEvent(ctx, {
      commandId,
      type: "REPORT_FINALIZE",
      payload: { manifest_id: manifestId },
      receipt: { ok: true },
    });
    const win = await ctx.sql.query<{ window_id: string }>(`SELECT window_id FROM manifest WHERE manifest_id = $1`, [manifestId]);
    const grades = await ctx.sql.query<{ grade_id: string; permanent_security_id: string }>(
      `SELECT DISTINCT ON (permanent_security_id) grade_id, permanent_security_id FROM grade
       WHERE manifest_id = $1 ORDER BY permanent_security_id, vintage DESC`,
      [manifestId],
    );
    const snapId = newId("snp");
    const metrics = { manifest_id: manifestId, grade_count: String(grades.length) };
    await ctx.sql.query(
      `INSERT INTO report_snapshot (
        snapshot_id, scope, manifest_id, window_id, as_of_event_seq, created_at, compatibility_hash, metrics, content_hash, data_mode, view_kind
      ) VALUES ($1,'MANIFEST',$2,$3,$4,$5,$6,$7::jsonb,$8,'FIXTURE','AS_KNOWN')`,
      [
        snapId,
        manifestId,
        win[0].window_id,
        eventSeq,
        ctx.now.toISOString(),
        hexBuf(sha256(canon(metrics))),
        JSON.stringify(metrics),
        hexBuf(sha256(canon({ snapId, grades: grades.map((g) => g.grade_id) }))),
      ],
    );
    for (const g of grades) {
      await ctx.sql.query(
        `INSERT INTO report_grade_pin (snapshot_id, manifest_id, permanent_security_id, grade_id) VALUES ($1,$2,$3,$4)`,
        [snapId, manifestId, g.permanent_security_id, g.grade_id],
      );
    }
    const positions = await ctx.sql.query<{ position_id: string; last_book_vintage_id: string | null; state: string }>(
      `SELECT p.position_id, p.last_book_vintage_id, p.state FROM "position" p JOIN "freeze" f ON f.freeze_id = p.freeze_id WHERE f.manifest_id = $1`,
      [manifestId],
    );
    for (const p of positions) {
      await ctx.sql.query(
        `INSERT INTO report_book_pin (snapshot_id, position_id, book_vintage_id, book_status_at_snapshot) VALUES ($1,$2,$3,$4)`,
        [snapId, p.position_id, p.last_book_vintage_id, p.state],
      );
    }
    await ctx.sql.query(`UPDATE deadline SET applied_event_seq = $1, applied_at = $2 WHERE deadline_id = $3`, [
      eventSeq,
      ctx.now.toISOString(),
      dl[0].deadline_id,
    ]);
    return { snapshot_id: snapId, as_of_event_seq: String(eventSeq) };
  });
}

export async function applyDueDeadlines(actor: string) {
  const sql = await getSql();
  const clock = await sql.query<{ now_utc: string }>(`SELECT now_utc::text FROM fixture_clock WHERE singleton_key = TRUE`);
  const now = clock[0]?.now_utc;
  const due = await sql.query<{ deadline_id: string; kind: string; manifest_id: string | null; permanent_security_id: string | null }>(
    `SELECT deadline_id, kind, manifest_id, permanent_security_id FROM deadline
     WHERE applied_event_seq IS NULL AND scheduled_at <= $1
     ORDER BY scheduled_at, kind`,
    [now],
  );
  const results: Array<{ deadline: string; kind: string; ok: boolean; error: string | null }> = [];
  for (const d of due) {
    try {
      if (d.kind === "FREEZE" && d.manifest_id) {
        await applyFreezeDeadline(newId("cmd"), d.manifest_id, actor);
        results.push({ deadline: d.deadline_id, kind: d.kind, ok: true, error: null });
      } else if (d.kind === "MARK_WAIT" && d.manifest_id && d.permanent_security_id) {
        await applyMarkWait(newId("cmd"), d.manifest_id, d.permanent_security_id, actor);
        results.push({ deadline: d.deadline_id, kind: d.kind, ok: true, error: null });
      } else if (d.kind === "REPORT_FINALIZE" && d.manifest_id) {
        await applyReportFinalize(newId("cmd"), d.manifest_id, actor);
        try {
          const { maybeReviseRule } = await import("./learn");
          await maybeReviseRule(d.manifest_id, actor);
        } catch {
          /* learning is observational; report already released */
        }
        results.push({ deadline: d.deadline_id, kind: d.kind, ok: true, error: null });
      }
    } catch (err) {
      results.push({
        deadline: d.deadline_id,
        kind: d.kind,
        ok: false,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }
  return { applied: results.length, results };
}

export async function pauseAdmission(commandId: string, reason: string, actor: string) {
  return withWriter(actor, async (ctx) => {
    const { eventSeq } = await appendEvent(ctx, {
      commandId,
      type: "PAUSE",
      payload: { reason },
      receipt: { paused: true },
    });
    await ctx.sql.query(
      `UPDATE operator_control SET admission_paused = TRUE, pause_reason = $1, updated_event_seq = $2 WHERE sleeve = 'EARNINGS'`,
      [reason, eventSeq],
    );
    return { paused: true, reason };
  });
}

export async function resumeAdmission(commandId: string, actor: string) {
  return withWriter(actor, async (ctx) => {
    const { eventSeq } = await appendEvent(ctx, {
      commandId,
      type: "RESUME",
      payload: {},
      receipt: { paused: false },
    });
    await ctx.sql.query(
      `UPDATE operator_control SET admission_paused = FALSE, pause_reason = NULL, updated_event_seq = $1 WHERE sleeve = 'EARNINGS'`,
      [eventSeq],
    );
    return { paused: false };
  });
}

export async function recordPrintKnowledge(
  commandId: string,
  args: { eventKey: string; securityId: string; reason: string; manifestId?: string },
  actor: string,
) {
  const sql = await getSql();
  const prior = await loadExistingCommand(sql, commandId);
  if (prior) return prior;
  return withWriter(actor, async (ctx) => {
    const { eventSeq } = await appendEvent(ctx, {
      commandId,
      type: "PRINT_KNOWLEDGE",
      payload: args,
      receipt: { recorded: true },
    });
    await ctx.sql.query(
      `INSERT INTO guard_event (
        guard_id, event_key, manifest_id, permanent_security_id, guard_type, recorded_at, actor_principal_id, reason_code, event_seq
      ) VALUES ($1,$2,$3,$4,'OPERATOR_KNOWLEDGE',$5,$6,$7,$8)`,
      [newId("grd"), args.eventKey, args.manifestId ?? null, args.securityId, ctx.now.toISOString(), actor, args.reason, eventSeq],
    );
    await raiseAlarm(ctx, "OFF_DESIGN_EARLY_RELEASE", "guards", args, true);
    return { recorded: true };
  });
}

export async function appendFireRateNote(
  commandId: string,
  args: { windowId: string; hypothesis: string; note: string; manifestId?: string },
  actor: string,
) {
  return withWriter(actor, async (ctx) => {
    const { eventSeq } = await appendEvent(ctx, {
      commandId,
      type: "FIRE_RATE_NOTE",
      payload: args,
      receipt: { ok: true },
    });
    await ctx.sql.query(
      `INSERT INTO fire_rate_note (note_id, window_id, manifest_id, actor_principal_id, hypothesis, note, event_seq)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [newId("note"), args.windowId, args.manifestId ?? null, actor, args.hypothesis, args.note, eventSeq],
    );
    return { ok: true };
  });
}

export async function applyEntryCorrection(
  commandId: string,
  positionId: string,
  newPrice: string,
  actor: string,
) {
  const sql = await getSql();
  const prior = await loadExistingCommand(sql, commandId);
  if (prior) return prior;
  return withWriter(actor, async (ctx) => {
    const pos = await ctx.sql.query<{
      position_id: string;
      state: string;
      original_reserved_notional: string;
      last_book_vintage_id: string | null;
    }>(`SELECT position_id, state, original_reserved_notional::text, last_book_vintage_id FROM "position" WHERE position_id = $1 FOR UPDATE`, [
      positionId,
    ]);
    if (!pos.length) throw new DeskError("NOT_FOUND", "position missing", 404);
    const fill = modeledFill(newPrice);
    const book = await ctx.sql.query<{ values: { exit_price?: string } }>(
      `SELECT values FROM book_vintage WHERE book_vintage_id = $1`,
      [pos[0].last_book_vintage_id],
    );
    const exit = book[0]?.values?.exit_price;
    const pnl = exit ? paperPnl(pos[0].original_reserved_notional, exit, fill, "0.0000") : null;
    await appendEvent(ctx, {
      commandId,
      type: "REVISE",
      payload: { position_id: positionId, new_price: newPrice },
      receipt: { fill, pnl },
    });
    await writeBook(ctx, positionId, "ORIGINAL_PLAN", {
      modeled_fill: fill,
      exit_price: exit,
      paper_pnl: pnl,
      original_notional: pos[0].original_reserved_notional,
      revision_reason: "ENTRY_PRICE_CORRECTION",
    }, true);
    return { position_id: positionId, state: pos[0].state, modeled_fill: fill, paper_pnl: pnl, original_notional: pos[0].original_reserved_notional };
  });
}

void jsonCanon;
void getSql;
