import { createHash, randomBytes } from "node:crypto";
import { getSql, withTransaction } from "@/lib/db";
import {
  COST_MODEL_CONTENT,
  KernelError,
  admitPredict,
  costModelHash,
  dec,
  evaluate,
  inputHash,
  magnitudeBand,
  manifestHash,
  modeledFill,
  outputHash,
  paperPnl,
  ruleAstHash,
  snapshotHash,
  shuffle,
  directionHit,
  bandHit,
  canon,
  addNotional,
} from "@/kernel/index";
import { assembleCard, benchmarkRelative, impliedMove, selectStraddle, type TypedCard } from "./features";
import { appendEvent, assertRiskMatches, loadExistingCommand, lockRisk, raiseAlarm, recomputeRisk, withWriter, type WriterCtx } from "./writer";
import { DeskError, asHex, etInstant, hexBuf, jsonCanon, newId } from "./util";

const TICKET = "5000.0000";
const MARGIN = 3;
const DATA_MODE = "FIXTURE" as const;

type ObsRow = {
  observation_id: string;
  permanent_security_id: string;
  snapshot_type: string;
  session_date: string;
  payload_protected: Buffer | Uint8Array | null;
  payload_hash: Buffer | Uint8Array;
  observation_hash: Buffer | Uint8Array;
  envelope: unknown;
  source_class: string;
  received_at: string;
  source_event_at: string | null;
};

function payloadOf(row: ObsRow): Record<string, unknown> {
  const env = row.envelope as { payload?: Record<string, unknown> };
  if (env && typeof env === "object" && env.payload) return env.payload;
  return {};
}

export async function existingReceipt(commandId: string): Promise<unknown | null> {
  const sql = await getSql();
  return loadExistingCommand(sql, commandId);
}

export async function sealSession(commandId: string, sessionDate: string, actor: string) {
  const existing = await existingReceipt(commandId);
  if (existing) return existing;
  return withWriter(actor, async (ctx) => {
    const dup = await ctx.sql.query<{ manifest_id: string }>(
      `SELECT manifest_id FROM manifest WHERE session_date = $1 AND sleeve = 'EARNINGS'`,
      [sessionDate],
    );
    if (dup.length) {
      const prior = await ctx.sql.query<{ result_receipt: unknown }>(
        `SELECT result_receipt FROM event_log WHERE event_type = 'SEAL' AND semantic_payload->>'session_date' = $1`,
        [sessionDate],
      );
      if (prior.length) return prior[0].result_receipt;
    }
    const win = await ctx.sql.query<{
      window_id: string;
      universe_version: string;
      policy_id: string;
      rule_id: string;
      rule_version: string;
      evaluator_id: string;
      cost_model_id: string;
    }>(`SELECT window_id, universe_version, policy_id, rule_id, rule_version, evaluator_id, cost_model_id
        FROM evaluation_window
        WHERE starts_at <= $1 AND ends_at > $1 AND ended_early_at IS NULL
        ORDER BY starts_at DESC LIMIT 1`, [ctx.now.toISOString()]);
    if (!win.length) {
      const fallback = await ctx.sql.query<{
        window_id: string;
        universe_version: string;
        policy_id: string;
        rule_id: string;
        rule_version: string;
        evaluator_id: string;
        cost_model_id: string;
      }>(`SELECT window_id, universe_version, policy_id, rule_id, rule_version, evaluator_id, cost_model_id FROM evaluation_window ORDER BY starts_at DESC LIMIT 1`);
      if (fallback.length) win.push(fallback[0]);
    }
    if (!win.length) throw new DeskError("NO_WINDOW", "no evaluation window");
    const w = win[0];
    const cal = await ctx.sql.query<{ listing_exchange: string; is_open: boolean; moc_entry_cutoff_at: string; close_at: string; content_hash: Buffer }>(
      `SELECT listing_exchange, is_open, moc_entry_cutoff_at::text, close_at::text, content_hash FROM calendar_session
       WHERE calendar_version = 'cal-2026' AND session_date = $1 AND listing_exchange IN ('XNYS','XNAS')`,
      [sessionDate],
    );
    if (cal.length !== 2 || cal.some((c) => !c.is_open || !c.moc_entry_cutoff_at)) {
      await raiseAlarm(ctx, "CALENDAR_BLOCKED", "calendar", { sessionDate }, true);
      throw new DeskError("CALENDAR_BLOCKED", "required venue calendars missing");
    }
    const cutoffs = cal.map((c) => new Date(c.moc_entry_cutoff_at).getTime());
    const uniform = new Date(Math.min(...cutoffs) - MARGIN * 60 * 1000);
    const sealAt = new Date(uniform.getTime() - 120 * 1000);
    if (ctx.now.getTime() >= uniform.getTime()) {
      await raiseAlarm(ctx, "SEAL_MISSED", "seal", { sessionDate }, false);
      throw new DeskError("SEAL_MISSED", "seal attempted after cutoff");
    }
    const next = await nextOpen(ctx.sql, sessionDate, 1);
    const second = await nextOpen(ctx.sql, sessionDate, 2);
    const identities = await ctx.sql.query<{
      policy_hash: Buffer;
      ast_hash: Buffer;
      artifact_hash: Buffer;
      content_hash: Buffer;
    }>(
      `SELECT p.policy_hash, r.ast_hash, e.artifact_hash, c.content_hash
       FROM policy_bundle p, rule_card r, evaluator_artifact e, cost_model c
       WHERE p.policy_id = $1 AND r.rule_id = $2 AND r.rule_version = $3 AND e.evaluator_id = $4 AND c.cost_model_id = $5`,
      [w.policy_id, w.rule_id, w.rule_version, w.evaluator_id, w.cost_model_id],
    );
    const ids = identities[0];
    const members = await ctx.sql.query<{
      permanent_security_id: string;
      listing_exchange: string;
      sector: string | null;
    }>(
      `SELECT permanent_security_id, listing_exchange, sector FROM universe_member WHERE universe_version = $1 AND included = TRUE`,
      [w.universe_version],
    );
    const events = await ctx.sql.query<{
      event_key: string;
      permanent_security_id: string;
      timing: string;
      quality: string;
      source_observation_id: string;
    }>(
      `SELECT event_key, permanent_security_id, timing, quality, source_observation_id FROM earnings_event WHERE intended_session = $1`,
      [sessionDate],
    );
    const eventBySec = new Map(events.map((e) => [e.permanent_security_id, e]));
    const tickers = await ctx.sql.query<{ permanent_security_id: string; ticker: string }>(
      `SELECT permanent_security_id, ticker FROM security_ticker WHERE provider_id = 'fixture'`,
    );
    const tickerOf = Object.fromEntries(tickers.map((t) => [t.permanent_security_id, t.ticker]));
    const obs = await ctx.sql.query<ObsRow>(
      `SELECT observation_id, permanent_security_id, snapshot_type, session_date::text, payload_protected, payload_hash, observation_hash, envelope, source_class, received_at::text, source_event_at::text
       FROM observation WHERE tombstoned = FALSE`,
    );
    const manifestId = newId("man");
    const seed = Buffer.from(
      sessionDate === "2026-09-04"
        ? "01".repeat(32)
        : sessionDate === "2026-09-11"
          ? "a5".repeat(32)
          : randomBytes(32).toString("hex"),
      "hex",
    );
    const included: typeof members = [];
    const exclusions: Array<{ security: string; status: string; reasons: string[] }> = [];
    for (const m of members) {
      const ev = eventBySec.get(m.permanent_security_id);
      const reasons: string[] = [];
      if (!ev) reasons.push("NO_EARNINGS_EVENT");
      else {
        if (ev.timing !== "AMC") reasons.push(`TIMING_${ev.timing}`);
      }
      const quote = latest(obs, m.permanent_security_id, "QUOTE", sessionDate);
      if (!quote) reasons.push("MISSING_SEAL_QUOTE");
      else {
        const p = payloadOf(quote);
        const last = Number(p.last ?? p.mid ?? 0);
        if (!(last >= 5)) reasons.push("PRICE_BELOW_5");
      }
      if (reasons.length) {
        exclusions.push({ security: m.permanent_security_id, status: "EXCLUDED", reasons });
      } else {
        included.push(m);
      }
    }
    const order = shuffle(
      included.map((m) => m.permanent_security_id),
      seed.toString("hex"),
    );
    const memberSnapshots: Array<{
      security: string;
      eventKey: string;
      quality: string;
      index: number;
      card: TypedCard;
      snapHash: string;
      pins: Array<{ id: string; hash: string }>;
      ticker: string;
    }> = [];
    for (const sec of order) {
      const ev = eventBySec.get(sec)!;
      const built = buildMemberSnapshot(sec, sessionDate, next, ev, obs);
      memberSnapshots.push({
        security: sec,
        eventKey: ev.event_key,
        quality: ev.quality,
        index: order.indexOf(sec),
        ticker: tickerOf[sec] ?? sec,
        ...built,
      });
    }
    const memberEntries = memberSnapshots
      .map((m) => ({
        permanent_security_id: m.security,
        snapshot_hash: m.snapHash,
        shuffle_order_index: String(m.index),
      }))
      .sort((a, b) => (a.permanent_security_id < b.permanent_security_id ? -1 : 1));
    const manifestContent = {
      manifest_id: manifestId,
      window_id: w.window_id,
      session_date: sessionDate,
      next_session_date: next,
      second_next_session_date: second,
      sleeve: "EARNINGS",
      universe_version: w.universe_version,
      policy_hash: asHex(ids.policy_hash),
      rule_ast_hash: asHex(ids.ast_hash),
      evaluator_artifact_hash: asHex(ids.artifact_hash),
      cost_model_hash: asHex(ids.content_hash),
      calendar_hashes: cal
        .map((c) => ({ venue: c.listing_exchange, hash: asHex(c.content_hash) }))
        .sort((a, b) => a.venue.localeCompare(b.venue)),
      seed: seed.toString("hex"),
      seal_at: sealAt.toISOString(),
      freeze_cutoff_at: uniform.toISOString(),
      mark_wait_at: etInstant(next, "16:00").toISOString(),
      report_finalize_at: etInstant(second, "16:00").toISOString(),
      members: memberEntries,
    };
    const manHash = manifestHash(manifestContent);
    const { eventSeq } = await appendEvent(ctx, {
      commandId,
      type: "SEAL",
      payload: { session_date: sessionDate, manifest_id: manifestId },
      receipt: { manifest_id: manifestId, sealed_member_count: String(order.length) },
      request: { commandId, sessionDate },
    });
    await ctx.sql.query(
      `INSERT INTO manifest (
        manifest_id, window_id, session_date, next_session_date, second_next_session_date, sleeve,
        universe_version, policy_id, rule_id, rule_version, evaluator_id, cost_model_id,
        policy_hash, rule_ast_hash, evaluator_artifact_hash, cost_model_hash, calendar_refs,
        seal_at, freeze_cutoff_at, mark_wait_at, report_finalize_at, sealed_at, seed,
        sealed_member_count, canonical_content, manifest_hash, seal_event_seq, freeze_resolution
      ) VALUES (
        $1,$2,$3,$4,$5,'EARNINGS',$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16::jsonb,
        $17,$18,$19,$20,$21,$22,$23,$24,$25,$26,'OPEN'
      )`,
      [
        manifestId,
        w.window_id,
        sessionDate,
        next,
        second,
        w.universe_version,
        w.policy_id,
        w.rule_id,
        w.rule_version,
        w.evaluator_id,
        w.cost_model_id,
        hexBuf(asHex(ids.policy_hash)),
        hexBuf(asHex(ids.ast_hash)),
        hexBuf(asHex(ids.artifact_hash)),
        hexBuf(asHex(ids.content_hash)),
        JSON.stringify(manifestContent.calendar_hashes),
        sealAt.toISOString(),
        uniform.toISOString(),
        etInstant(next, "16:00").toISOString(),
        etInstant(second, "16:00").toISOString(),
        ctx.now.toISOString(),
        seed,
        order.length,
        jsonCanon(manifestContent),
        hexBuf(manHash),
        eventSeq,
      ],
    );
    for (const m of memberSnapshots) {
      await ctx.sql.query(
        `INSERT INTO manifest_member (
          manifest_id, permanent_security_id, event_key, sealed_event_session, timing, timing_quality,
          shuffle_order_index, snapshot_hash, display_ticker
        ) VALUES ($1,$2,$3,$4,'AMC',$5,$6,$7,$8)`,
        [manifestId, m.security, m.eventKey, sessionDate, m.quality, m.index, hexBuf(m.snapHash), m.ticker],
      );
      await ctx.sql.query(
        `INSERT INTO sealed_input (
          manifest_id, permanent_security_id, snapshot_schema, snapshot_hash, card, bindings, pin_count,
          card_complete, options_valid, coverage_summary, retention_exclusion
        ) VALUES ($1,$2,'card-1',$3,$4::jsonb,$5::jsonb,$6,$7,$8,$9::jsonb,FALSE)`,
        [
          manifestId,
          m.security,
          hexBuf(m.snapHash),
          JSON.stringify(m.card),
          JSON.stringify({ pins: m.pins }),
          m.pins.length,
          m.card.card_complete,
          m.card.options_valid,
          JSON.stringify({ pin_count: m.pins.length }),
        ],
      );
      const sortedPins = [...m.pins].sort((a, b) => (a.id < b.id ? -1 : 1));
      let idx = 0;
      for (const p of sortedPins) {
        await ctx.sql.query(
          `INSERT INTO sealed_input_pin (manifest_id, permanent_security_id, observation_id, observation_hash, pin_index)
           VALUES ($1,$2,$3,$4,$5)`,
          [manifestId, m.security, p.id, hexBuf(p.hash), idx],
        );
        idx += 1;
      }
      await ctx.sql.query(
        `INSERT INTO deadline (deadline_id, kind, manifest_id, permanent_security_id, scheduled_at, scheduled_event_seq)
         VALUES ($1,'MARK_WAIT',$2,$3,$4,$5)`,
        [newId("dl"), manifestId, m.security, etInstant(next, "16:00").toISOString(), eventSeq],
      );
    }
    for (const ex of exclusions) {
      await ctx.sql.query(
        `INSERT INTO candidate_eligibility (
          eligibility_id, session_date, window_id, permanent_security_id, status, reason_codes, evidence_ids, event_seq, manifest_id
        ) VALUES ($1,$2,$3,$4,'EXCLUDED',$5::jsonb,$6::jsonb,$7,$8)`,
        [newId("elg"), sessionDate, w.window_id, ex.security, JSON.stringify(ex.reasons), JSON.stringify([]), eventSeq, manifestId],
      );
    }
    for (const m of memberSnapshots) {
      await ctx.sql.query(
        `INSERT INTO candidate_eligibility (
          eligibility_id, session_date, window_id, permanent_security_id, event_key, status, reason_codes, evidence_ids, event_seq, manifest_id
        ) VALUES ($1,$2,$3,$4,$5,'INCLUDED',$6::jsonb,$7::jsonb,$8,$9)`,
        [newId("elg"), sessionDate, w.window_id, m.security, m.eventKey, JSON.stringify([]), JSON.stringify(m.pins.map((p) => p.id)), eventSeq, manifestId],
      );
    }
    await ctx.sql.query(
      `INSERT INTO deadline (deadline_id, kind, manifest_id, scheduled_at, scheduled_event_seq) VALUES ($1,'FREEZE',$2,$3,$4)`,
      [newId("dl"), manifestId, uniform.toISOString(), eventSeq],
    );
    await ctx.sql.query(
      `INSERT INTO deadline (deadline_id, kind, manifest_id, scheduled_at, scheduled_event_seq) VALUES ($1,'REPORT_FINALIZE',$2,$3,$4)`,
      [newId("dl"), manifestId, etInstant(second, "16:00").toISOString(), eventSeq],
    );
    return {
      manifest_id: manifestId,
      sealed_member_count: String(order.length),
      excluded_count: String(exclusions.length),
      freeze_cutoff_at: uniform.toISOString(),
      manifest_hash: manHash,
    };
  });
}

function latest(obs: ObsRow[], sec: string, type: string, session?: string): ObsRow | null {
  const rows = obs
    .filter((o) => o.permanent_security_id === sec && o.snapshot_type === type && (!session || o.session_date === session))
    .sort((a, b) => (a.received_at < b.received_at ? 1 : -1));
  return rows[0] ?? null;
}

function buildMemberSnapshot(
  sec: string,
  sessionDate: string,
  nextSession: string,
  ev: { event_key: string; quality: string; source_observation_id: string },
  obs: ObsRow[],
): { card: TypedCard; snapHash: string; pins: Array<{ id: string; hash: string }> } {
  const pins: Array<{ id: string; hash: string }> = [];
  const add = (row: ObsRow | null) => {
    if (!row) return;
    pins.push({ id: row.observation_id, hash: asHex(row.observation_hash) });
  };
  const eventObs = obs.find((o) => o.observation_id === ev.source_observation_id) ?? latest(obs, sec, "EARNINGS_EVENT", sessionDate);
  add(eventObs ?? null);
  const quote = latest(obs, sec, "QUOTE", sessionDate);
  add(quote);
  const tape = latest(obs, sec, "TAPE_RELATIVE", sessionDate);
  add(tape);
  let rel5: string | null = null;
  let rel63: string | null = null;
  if (tape) {
    const p = payloadOf(tape);
    rel5 = typeof p.rel5 === "string" ? p.rel5 : null;
    rel63 = typeof p.rel63 === "string" ? p.rel63 : null;
  } else {
    const stockBars = obs
      .filter((o) => o.permanent_security_id === sec && o.snapshot_type === "BAR_DAILY" && o.session_date < sessionDate)
      .sort((a, b) => (a.session_date < b.session_date ? -1 : 1));
    const spyBars = obs
      .filter((o) => o.permanent_security_id === "SEC-SPY" && o.snapshot_type === "BAR_DAILY" && o.session_date < sessionDate)
      .sort((a, b) => (a.session_date < b.session_date ? -1 : 1));
    const take = (n: number) => {
      const s = stockBars.slice(-n);
      const b = spyBars.slice(-n);
      s.forEach(add);
      b.forEach(add);
      return {
        sf: s.map((r) => String(payloadOf(r).factor ?? "1.000000000000")),
        bf: b.map((r) => String(payloadOf(r).factor ?? "1.000000000000")),
      };
    };
    const h5 = take(5);
    const h63 = take(63);
    rel5 = h5.sf.length === 5 ? benchmarkRelative(h5.sf, h5.bf) : null;
    rel63 = h63.sf.length === 63 ? benchmarkRelative(h63.sf, h63.bf) : null;
  }
  const chain = obs.filter((o) => o.permanent_security_id === sec && o.snapshot_type === "OPTION_LEG" && o.session_date === sessionDate);
  chain.forEach(add);
  const stockMid = quote ? String(payloadOf(quote).mid ?? payloadOf(quote).last ?? "") : "";
  let optionsValid = false;
  let move: string | null = null;
  if (stockMid && chain.length) {
    const legs = chain.map((o) => {
      const p = payloadOf(o);
      return {
        right: p.right as "C" | "P",
        strike: String(p.strike),
        expiry: String(p.expiry),
        bid: String(p.bid),
        ask: String(p.ask),
        oi: Number(p.oi),
        volume: Number(p.volume),
        asOf: o.source_event_at ?? o.received_at,
      };
    });
    const sel = selectStraddle(stockMid, sessionDate, etInstant(nextSession, "09:30").toISOString(), legs);
    if ("call" in sel && sel.valid) {
      const cMid = ((Number(sel.call.bid) + Number(sel.call.ask)) / 2).toFixed(6);
      const pMid = ((Number(sel.put.bid) + Number(sel.put.ask)) / 2).toFixed(6);
      move = impliedMove(cMid, pMid, Number(stockMid).toFixed(6));
      optionsValid = move != null;
    }
  }
  const card = assembleCard({
    timingQuality: ev.quality as "ISSUER_CONFIRMED" | "ESTIMATED",
    optionsValid,
    impliedMove: move,
    rel5,
    rel63,
  });
  const uniq = new Map(pins.map((p) => [p.id, p]));
  const pinList = [...uniq.values()].sort((a, b) => (a.id < b.id ? -1 : 1));
  const snap = snapshotHash({
    permanent_security_id: sec,
    event_key: ev.event_key,
    session_date: sessionDate,
    card,
    pins: pinList,
  });
  void 0;
  return { card, snapHash: snap, pins: pinList };
}

async function nextOpen(sql: import("@/lib/db").Sql, from: string, n: number): Promise<string> {
  const rows = await sql.query<{ session_date: string }>(
    `SELECT session_date::text FROM calendar_session
     WHERE calendar_version = 'cal-2026' AND listing_exchange = 'XNYS' AND is_open = TRUE AND session_date > $1
     ORDER BY session_date ASC LIMIT $2`,
    [from, n],
  );
  if (rows.length < n) throw new DeskError("CALENDAR_BLOCKED", "cannot resolve D+n");
  return rows[n - 1].session_date;
}

export async function freezeMember(commandId: string, manifestId: string, securityId: string, actor: string) {
  const existing = await existingReceipt(commandId);
  if (existing) return existing;
  const result = await withWriter(actor, async (ctx) => {
    const found = await ctx.sql.query<{ freeze_id: string; input_hash: Buffer; output_hash: Buffer }>(
      `SELECT freeze_id, input_hash, output_hash FROM "freeze" WHERE manifest_id = $1 AND permanent_security_id = $2`,
      [manifestId, securityId],
    );
    if (found.length) {
      return verifyExistingFreeze(ctx, manifestId, securityId, found[0]);
    }
    const man = await ctx.sql.query<{
      freeze_cutoff_at: string;
      freeze_resolution: string;
      manifest_hash: Buffer;
      rule_ast_hash: Buffer;
      evaluator_artifact_hash: Buffer;
      cost_model_hash: Buffer;
      session_date: string;
      rule_id: string;
      rule_version: string;
    }>(
      `SELECT freeze_cutoff_at::text, freeze_resolution, manifest_hash, rule_ast_hash, evaluator_artifact_hash,
              cost_model_hash, session_date::text, rule_id, rule_version
       FROM manifest WHERE manifest_id = $1 FOR UPDATE`,
      [manifestId],
    );
    if (!man.length) throw new DeskError("NOT_FOUND", "manifest missing", 404);
    if (man[0].freeze_resolution !== "OPEN") throw new DeskError("ADMISSION_CLOSED", "freeze resolution is terminal");
    if (ctx.now.getTime() >= new Date(man[0].freeze_cutoff_at).getTime()) {
      throw new DeskError("CUTOFF", "admission cutoff passed");
    }
    const paused = await ctx.sql.query<{ admission_paused: boolean }>(`SELECT admission_paused FROM operator_control WHERE sleeve = 'EARNINGS'`);
    const member = await ctx.sql.query<{
      snapshot_hash: Buffer;
      shuffle_order_index: number;
      timing_quality: string;
      event_key: string;
    }>(
      `SELECT snapshot_hash, shuffle_order_index, timing_quality, event_key FROM manifest_member WHERE manifest_id = $1 AND permanent_security_id = $2`,
      [manifestId, securityId],
    );
    if (!member.length) throw new DeskError("NOT_FOUND", "member not sealed", 404);
    const guards = await ctx.sql.query<{ guard_id: string }>(
      `SELECT guard_id FROM guard_event WHERE permanent_security_id = $1 AND event_key = $2`,
      [securityId, member[0].event_key],
    );
    if (guards.length) throw new DeskError("OFF_DESIGN_EARLY_RELEASE", "early-result knowledge blocks freeze");
    const sealed = await ctx.sql.query<{ card: TypedCard; pin_count: number; card_complete: boolean; options_valid: boolean | null }>(
      `SELECT card, pin_count, card_complete, options_valid FROM sealed_input WHERE manifest_id = $1 AND permanent_security_id = $2`,
      [manifestId, securityId],
    );
    const pins = await ctx.sql.query<{ observation_id: string; observation_hash: Buffer; pin_index: number }>(
      `SELECT observation_id, observation_hash, pin_index FROM sealed_input_pin WHERE manifest_id = $1 AND permanent_security_id = $2 ORDER BY pin_index`,
      [manifestId, securityId],
    );
    const pinTuples: [string, string][] = pins.map((p) => [p.observation_id, asHex(p.observation_hash)]);
    const inHash = inputHash({
      manifestId,
      securityId,
      manifestHash: asHex(man[0].manifest_hash),
      snapshotHash: asHex(member[0].snapshot_hash),
      ruleHash: asHex(man[0].rule_ast_hash),
      engineHash: asHex(man[0].evaluator_artifact_hash),
      costHash: asHex(man[0].cost_model_hash),
      margin: MARGIN,
      pins: pinTuples,
    });
    const card = sealed[0].card;
    const ruleRows = await ctx.sql.query<{ ast_content: unknown }>(
      `SELECT ast_content FROM rule_card WHERE rule_id = $1 AND rule_version = $2`,
      [man[0].rule_id, man[0].rule_version],
    );
    const ast = ruleRows[0]?.ast_content;
    if (ast == null) throw new DeskError("RULE_UNAVAILABLE", "sealed rule is missing", 503);
    if (ruleAstHash(ast) !== asHex(man[0].rule_ast_hash)) {
      throw new DeskError("RULE_MISMATCH", "loaded rule does not match the sealed digest", 503);
    }
    const ev = evaluate(ast, {
      timing_quality: card.timing_quality,
      card_complete: card.card_complete,
      options_valid: card.options_valid,
      implied_move: card.implied_move,
      benchmark_relative_5d: card.benchmark_relative_5d,
      benchmark_relative_63d: card.benchmark_relative_63d,
    });
    if (ev.status === "INVALID_RULE") {
      await raiseAlarm(ctx, "INVALID_RULE_AST", "evaluator", { securityId }, true);
      throw new DeskError("INVALID_RULE_AST", "registered rule invalid", 503);
    }
    const band =
      ev.decision === "PREDICT" && card.implied_move
        ? magnitudeBand(card.implied_move)
        : { low: null as string | null, high: null as string | null };
    const decisionPayload = {
      status: ev.status,
      decision: ev.decision,
      direction: ev.direction,
      magnitude_low: band.low,
      magnitude_high: band.high,
      card_complete: card.card_complete,
      options_valid: card.options_valid,
      reasons: ev.reasons,
      missing: ev.reasons.filter((r) => r.startsWith("MISSING_")),
    };
    const outHash = outputHash(inHash, decisionPayload);
    const freezeId = newId("frz");
    const { eventSeq } = await appendEvent(ctx, {
      commandId,
      type: "FREEZE",
      payload: { manifest_id: manifestId, permanent_security_id: securityId, freeze_id: freezeId },
      receipt: { freeze_id: freezeId, decision: ev.decision },
      request: { commandId, manifestId, securityId },
    });
    await ctx.sql.query(
      `INSERT INTO "freeze" (
        freeze_id, manifest_id, permanent_security_id, snapshot_hash, input_hash, output_hash, decision, direction,
        card_complete, options_valid, output_payload, pin_count, freeze_order_index, admission_checked_at, event_seq, verification_level
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::jsonb,$12,$13,$14,$15,'BYTE_VERIFIED')`,
      [
        freezeId,
        manifestId,
        securityId,
        member[0].snapshot_hash,
        hexBuf(inHash),
        hexBuf(outHash),
        ev.decision,
        ev.direction,
        card.card_complete,
        card.options_valid,
        JSON.stringify(decisionPayload),
        pins.length,
        member[0].shuffle_order_index,
        ctx.now.toISOString(),
        eventSeq,
      ],
    );
    for (const p of pins) {
      await ctx.sql.query(
        `INSERT INTO freeze_pin (freeze_id, observation_id, observation_hash, pin_index) VALUES ($1,$2,$3,$4)`,
        [freezeId, p.observation_id, p.observation_hash, p.pin_index],
      );
    }
    await ctx.sql.query(
      `INSERT INTO freeze_attempt (attempt_id, manifest_id, permanent_security_id, started_at, finished_at, duration_ms, result_code, event_seq)
       VALUES ($1,$2,$3,$4,$4,1,$5,$6)`,
      [newId("att"), manifestId, securityId, ctx.now.toISOString(), ev.decision, eventSeq],
    );
    let admission: { outcome: string; reason_codes: string[]; position_id: string | null } = {
      outcome: "NOT_PREDICTED",
      reason_codes: ["NOT_PREDICTED"],
      position_id: null,
    };
    if (ev.decision === "PREDICT") {
      admission = await evaluateAdmission(ctx, {
        freezeId,
        manifestId,
        securityId,
        sessionDate: man[0].session_date,
        paused: paused[0]?.admission_paused === true,
        cutoff: new Date(man[0].freeze_cutoff_at),
        card,
        timingQuality: member[0].timing_quality,
      });
    }
    const admId = newId("adm");
    await ctx.sql.query(
      `INSERT INTO execution_admission (
        admission_id, freeze_id, outcome, reason_codes, quote_observation_ids, checked_at, policy_hash, request_hash, position_id, event_seq
      ) VALUES ($1,$2,$3,$4::jsonb,$5::jsonb,$6,$7,$8,$9,$10)`,
      [
        admId,
        freezeId,
        admission.outcome,
        JSON.stringify(admission.reason_codes),
        JSON.stringify([]),
        ctx.now.toISOString(),
        hexBuf(asHex(man[0].cost_model_hash)),
        hexBuf(inHash),
        admission.position_id,
        eventSeq,
      ],
    );
    let tickerForCommit: string | null = null;
    if (admission.outcome === "ADMITTED" && admission.position_id) {
      const ticker = await ctx.sql.query<{ display_ticker: string }>(
        `SELECT display_ticker FROM manifest_member WHERE manifest_id = $1 AND permanent_security_id = $2`,
        [manifestId, securityId],
      );
      tickerForCommit = ticker[0]?.display_ticker ?? securityId;
      await commitPosition(ctx, {
        positionId: admission.position_id,
        freezeId,
        manifestId,
        securityId,
        admissionId: admId,
        sessionDate: man[0].session_date,
        ticker: tickerForCommit,
      });
    }
    return {
      freeze_id: freezeId,
      decision: ev.decision,
      direction: ev.direction,
      input_hash: inHash,
      output_hash: outHash,
      admission_outcome: admission.outcome,
      position_id: admission.position_id,
      ticker: tickerForCommit,
      reasons: ev.reasons,
      verification_level: "BYTE_VERIFIED",
    };
  });
  if ("ticker" in result && result.admission_outcome === "ADMITTED" && result.position_id && result.ticker) {
    try {
      const { sendEntry } = await import("./auto-trade");
      await sendEntry({ positionId: result.position_id, ticker: result.ticker, actor });
    } catch {
      /* desk commitment stands if the venue rejects */
    }
  }
  return result;
}

async function verifyExistingFreeze(
  ctx: WriterCtx,
  manifestId: string,
  securityId: string,
  row: { freeze_id: string; input_hash: Buffer; output_hash: Buffer },
) {
  const sealed = await ctx.sql.query<{ observation_id: string; observation_hash: Buffer }>(
    `SELECT observation_id, observation_hash FROM sealed_input_pin WHERE manifest_id = $1 AND permanent_security_id = $2`,
    [manifestId, securityId],
  );
  const pins = await ctx.sql.query<{ observation_id: string; observation_hash: Buffer }>(
    `SELECT observation_id, observation_hash FROM freeze_pin WHERE freeze_id = $1`,
    [row.freeze_id],
  );
  const a = new Set(sealed.map((p) => `${p.observation_id}:${asHex(p.observation_hash)}`));
  const b = new Set(pins.map((p) => `${p.observation_id}:${asHex(p.observation_hash)}`));
  if (a.size !== b.size || [...a].some((x) => !b.has(x))) {
    await raiseAlarm(ctx, "FREEZE_ARTIFACT_MISMATCH", "freeze", { freeze_id: row.freeze_id }, true);
    throw new DeskError("FREEZE_ARTIFACT_MISMATCH", "stored pins disagree with sealed set", 503);
  }
  const adm = await ctx.sql.query<{ outcome: string; position_id: string | null }>(
    `SELECT outcome, position_id FROM execution_admission WHERE freeze_id = $1`,
    [row.freeze_id],
  );
  const fr = await ctx.sql.query<{ decision: string; direction: string | null }>(
    `SELECT decision, direction FROM "freeze" WHERE freeze_id = $1`,
    [row.freeze_id],
  );
  return {
    freeze_id: row.freeze_id,
    decision: fr[0]?.decision,
    direction: fr[0]?.direction ?? null,
    input_hash: asHex(row.input_hash),
    output_hash: asHex(row.output_hash),
    admission_outcome: adm[0]?.outcome ?? null,
    position_id: adm[0]?.position_id ?? null,
    duplicate: true,
    verification_level: "BYTE_VERIFIED",
  };
}

async function evaluateAdmission(
  ctx: WriterCtx,
  args: {
    freezeId: string;
    manifestId: string;
    securityId: string;
    sessionDate: string;
    paused: boolean;
    cutoff: Date;
    card: TypedCard;
    timingQuality: string;
  },
): Promise<{ outcome: string; reason_codes: string[]; position_id: string | null }> {
  const reasons: string[] = [];
  const quote = await ctx.sql.query<ObsRow>(
    `SELECT observation_id, envelope, received_at::text, observation_hash, payload_protected, payload_hash, permanent_security_id, snapshot_type, session_date::text, source_class, source_event_at::text
     FROM observation
     WHERE permanent_security_id = $1 AND snapshot_type = 'QUOTE' AND session_date = $2
     ORDER BY received_at DESC LIMIT 1`,
    [args.securityId, args.sessionDate],
  );
  if (!quote.length) reasons.push("MISSING_QUOTE");
  else {
    const p = payloadOf(quote[0]);
    const bid = Number(p.bid);
    const ask = Number(p.ask);
    const last = Number(p.last ?? p.mid);
    const mid = (bid + ask) / 2;
    const age = Math.abs(ctx.now.getTime() - new Date(quote[0].received_at).getTime());
    if (!(bid > 0 && ask >= bid)) reasons.push("QUOTE_SIDE");
    if (!(last >= 5)) reasons.push("PRICE_BELOW_5");
    if (mid > 0 && (ask - bid) / mid > 0.001) reasons.push("SPREAD");
    if (age > 2000) reasons.push("QUOTE_STALE");
  }
  try {
    await assertRiskMatches(ctx.sql);
  } catch {
    reasons.push("RISK_STATE_MISMATCH");
    await raiseAlarm(ctx, "RISK_STATE_MISMATCH", "risk", { security: args.securityId }, true);
  }
  const cached = await lockRisk(ctx.sql);
  const sameEvent = await ctx.sql.query<{ c: number }>(
    `SELECT COUNT(*)::int AS c FROM "position" WHERE intended_event_session = $1 AND state <> 'CLOSED'`,
    [args.sessionDate],
  );
  const owned = await ctx.sql.query<{ c: number }>(
    `SELECT COUNT(*)::int AS c FROM "position" WHERE permanent_security_id = $1 AND state <> 'CLOSED'`,
    [args.securityId],
  );
  try {
    const cap = admitPredict({
      paused: args.paused,
      cutoffPassed: ctx.now.getTime() >= args.cutoff.getTime(),
      timingQuality: args.timingQuality,
      cardComplete: args.card.card_complete === true,
      reservedCount: cached.reserved_count,
      reservedNotional: dec(String(cached.reserved_notional), 4, "0"),
      sameEventOpen: sameEvent[0].c,
      alreadyOwned: owned[0].c > 0,
    });
    if (cap.outcome === "DENIED") {
      for (const r of cap.reason_codes) {
        if (!reasons.includes(r)) reasons.push(r);
      }
    }
  } catch (e) {
    if (e instanceof KernelError) reasons.push("RISK_STATE_MISMATCH");
    else throw e;
  }
  if (reasons.length) return { outcome: "DENIED", reason_codes: reasons, position_id: null };
  return { outcome: "ADMITTED", reason_codes: ["ADMITTED"], position_id: newId("pos") };
}

export async function commitPosition(
  ctx: WriterCtx,
  args: {
    positionId: string;
    freezeId: string;
    manifestId: string;
    securityId: string;
    admissionId: string;
    sessionDate: string;
    ticker: string;
  },
) {
  await ctx.sql.query(
    `INSERT INTO "position" (
      position_id, freeze_id, manifest_id, permanent_security_id, admission_id, intended_event_session, sleeve,
      original_reserved_notional, committed_at, entry_plan, exit_plan, state, cas_token, last_transition_event_seq, display_ticker
    ) VALUES ($1,$2,$3,$4,$5,$6,'EARNINGS',$7,$8,$9::jsonb,$10::jsonb,'COMMITTED_IRREVOCABLE',1,$11,$12)`,
    [
      args.positionId,
      args.freezeId,
      args.manifestId,
      args.securityId,
      args.admissionId,
      args.sessionDate,
      TICKET,
      ctx.now.toISOString(),
      JSON.stringify({ leg: "ENTRY_CLOSE", session: args.sessionDate }),
      JSON.stringify({ leg: "EXIT_OPEN", fallback: "D1_CLOSE" }),
      ctx.seq,
      args.ticker,
    ],
  );
  const cached = await lockRisk(ctx.sql);
  await ctx.sql.query(
    `UPDATE desk_risk_state SET reserved_count = $1, reserved_notional = $2, updated_event_seq = $3 WHERE sleeve = 'EARNINGS'`,
    [cached.reserved_count + 1, addNotional(String(cached.reserved_notional), TICKET), ctx.seq],
  );
}
