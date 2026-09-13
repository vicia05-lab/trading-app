import { getSql, dbSource } from "@/lib/db";
import { asHex, rfc3339, type DeskRole } from "./util";
import { ensureBootstrapped } from "./bootstrap";
import { publicStatus } from "./alpaca";
import { cap, type Capability } from "@/ui/capability";

export type Envelope<T> = {
  product_name: "Trading App";
  paperOnly: true;
  liveTradingSupported: false;
  activeModelWeight: "0";
  data_mode: "FIXTURE";
  request_id: string;
  as_of: string;
  data: T;
  warnings: string[];
};

export function wrap<T>(requestId: string, asOf: string, data: T, warnings: string[] = []): Envelope<T> {
  return {
    product_name: "Trading App",
    paperOnly: true,
    liveTradingSupported: false,
    activeModelWeight: "0",
    data_mode: "FIXTURE",
    request_id: requestId,
    as_of: asOf,
    data,
    warnings,
  };
}

async function asOf(): Promise<string> {
  const sql = await getSql();
  const r = await sql.query<{ now_utc: string }>(`SELECT now_utc::text FROM fixture_clock WHERE singleton_key = TRUE`);
  return rfc3339(new Date(r[0]?.now_utc ?? Date.now()));
}

function rate(num: number, den: number): { value: string | null; reason: string | null } {
  if (den === 0) return { value: null, reason: "NO_DENOMINATOR" };
  return { value: (num / den).toFixed(12), reason: null };
}

export async function homePayload(role: DeskRole, sessionDate?: string) {
  await ensureBootstrapped();
  const sql = await getSql();
  const clock = await asOf();
  const sessions = await sql.query<{
    manifest_id: string;
    session_date: string;
    freeze_resolution: string;
    sealed_member_count: number;
    freeze_cutoff_at: string;
    seal_at: string;
    mark_wait_at: string;
    report_finalize_at: string;
    admission_closed_event_seq: number | null;
    research_closed_event_seq: number | null;
  }>(
    `SELECT manifest_id, session_date::text, freeze_resolution, sealed_member_count,
            freeze_cutoff_at::text, seal_at::text, mark_wait_at::text, report_finalize_at::text,
            admission_closed_event_seq, research_closed_event_seq
     FROM manifest ORDER BY session_date DESC`,
  );
  const latest =
    (sessionDate ? sessions.find((s) => s.session_date === sessionDate) : null) ?? sessions[0] ?? null;
  const frozen = latest
    ? await sql.query<{ c: number }>(`SELECT COUNT(*)::int AS c FROM "freeze" WHERE manifest_id = $1`, [latest.manifest_id])
    : [{ c: 0 }];
  const complete = latest
    ? await sql.query<{ c: number }>(
        `SELECT COUNT(*)::int AS c FROM "freeze" WHERE manifest_id = $1 AND card_complete = TRUE`,
        [latest.manifest_id],
      )
    : [{ c: 0 }];
  const risk = await sql.query<{ reserved_count: number; reserved_notional: string }>(
    `SELECT reserved_count, reserved_notional::text FROM desk_risk_state WHERE sleeve = 'EARNINGS'`,
  );
  const impaired = await sql.query<{ c: number }>(
    `SELECT COUNT(*)::int AS c FROM "position" WHERE state IN ('IMPAIRED_ENTRY','IMPAIRED_EXIT')`,
  );
  const nonclosed = await sql.query<{ c: number }>(`SELECT COUNT(*)::int AS c FROM "position" WHERE state <> 'CLOSED'`);
  const ctrl = await sql.query<{ admission_paused: boolean; pause_reason: string | null }>(
    `SELECT admission_paused, pause_reason FROM operator_control WHERE sleeve = 'EARNINGS'`,
  );
  const due = await sql.query<{ c: number }>(
    `SELECT COUNT(*)::int AS c FROM deadline d, fixture_clock c WHERE d.applied_event_seq IS NULL AND d.scheduled_at <= c.now_utc`,
  );
  const snap = latest
    ? await sql.query<{ snapshot_id: string; created_at: string }>(
        `SELECT snapshot_id, created_at::text FROM report_snapshot WHERE manifest_id = $1 ORDER BY created_at DESC LIMIT 1`,
        [latest.manifest_id],
      )
    : [];
  const book = role === "OPERATOR"
    ? null
    : await sql.query<{ pnl: string | null; priced: number }>(
        `SELECT COALESCE(SUM((values->>'paper_pnl')::numeric),0)::text AS pnl,
                COUNT(*) FILTER (WHERE status = 'PRICED')::int AS priced
         FROM book_vintage bv
         JOIN (SELECT position_id, MAX(vintage) AS v FROM book_vintage GROUP BY position_id) t
           ON t.position_id = bv.position_id AND t.v = bv.vintage`,
      );
  const openPos = await sql.query<{
    position_id: string;
    ticker: string;
    name: string;
    session_date: string;
    notional: string;
    state: string;
  }>(
    `SELECT p.position_id, p.display_ticker AS ticker, COALESCE(s.display_name, p.display_ticker) AS name,
            p.intended_event_session::text AS session_date, p.original_reserved_notional::text AS notional, p.state
     FROM "position" p
     LEFT JOIN security s ON s.permanent_security_id = p.permanent_security_id
     WHERE p.state <> 'CLOSED'
     ORDER BY p.display_ticker`,
  );
  const { learningSummary } = await import("./learn");
  const learning = await learningSummary(role);
  const predictCount = latest
    ? await sql.query<{ c: number }>(
        `SELECT COUNT(*)::int AS c FROM "freeze" WHERE manifest_id = $1 AND decision = 'PREDICT'`,
        [latest.manifest_id],
      )
    : [{ c: 0 }];
  return wrap("home-1", clock, {
    role,
    data_mode: "FIXTURE",
    window_id: "win-2026q3",
    policy_id: "pol-v1",
    rule_id: "rule-v1",
    latest_session: latest
      ? {
          manifest_id: latest.manifest_id,
          session_date: latest.session_date,
          freeze_resolution: latest.freeze_resolution,
          sealed_member_count: String(latest.sealed_member_count),
          frozen_count: String(frozen[0].c),
          complete_frozen_cards: String(complete[0].c),
          seal_at: latest.seal_at,
          freeze_cutoff_at: latest.freeze_cutoff_at,
          mark_wait_at: latest.mark_wait_at,
          report_finalize_at: latest.report_finalize_at,
          research_closed: latest.research_closed_event_seq != null,
        }
      : null,
    sessions: sessions.map((s) => ({
      manifest_id: s.manifest_id,
      session_date: s.session_date,
      freeze_resolution: s.freeze_resolution,
      sealed_member_count: String(s.sealed_member_count),
    })),
    reserved_count: String(risk[0]?.reserved_count ?? 0),
    reserved_notional: risk[0]?.reserved_notional ?? "0.0000",
    nonclosed_positions: String(nonclosed[0].c),
    impaired_count: String(impaired[0].c),
    admission_paused: ctrl[0]?.admission_paused ?? false,
    pause_reason: ctrl[0]?.pause_reason ?? null,
    overdue_deadlines: String(due[0].c),
    report_snapshot_id: snap[0]?.snapshot_id ?? null,
    report_as_of: snap[0]?.created_at ?? null,
    reviewer_book: book ? { latest_paper_pnl: book[0].pnl, priced_vintages: String(book[0].priced) } : null,
    research_complete_does_not_imply_book_clear: true,
    predict_count: String(predictCount[0].c),
    open_positions: openPos,
    alpaca: await publicStatus(),
    learning,
  });
}

export async function earningsPayload(role: DeskRole, sessionDate?: string) {
  await ensureBootstrapped();
  const sql = await getSql();
  const clock = await asOf();
  const sessions = await sql.query<{ manifest_id: string; session_date: string }>(
    `SELECT manifest_id, session_date::text FROM manifest ORDER BY session_date`,
  );
  const man = await sql.query<{ manifest_id: string; session_date: string }>(
    sessionDate
      ? `SELECT manifest_id, session_date::text FROM manifest WHERE session_date = $1`
      : `SELECT manifest_id, session_date::text FROM manifest ORDER BY session_date DESC LIMIT 1`,
    sessionDate ? [sessionDate] : [],
  );
  if (!man.length) return wrap("earn-1", clock, {
    role,
    manifest_id: "",
    session_date: sessionDate ?? "",
    sessions,
    members: [],
    exclusions: [],
  });
  const members = await sql.query<{
    permanent_security_id: string;
    display_ticker: string;
    event_key: string;
    timing_quality: string;
    shuffle_order_index: number;
    card: Record<string, unknown>;
    card_complete: boolean;
    options_valid: boolean | null;
    pin_count: number;
    display_name: string | null;
    decision: string | null;
    output_payload: { reasons?: string[] } | null;
  }>(
    `SELECT m.permanent_security_id, m.display_ticker, m.event_key, m.timing_quality, m.shuffle_order_index,
            s.card, s.card_complete, s.options_valid, s.pin_count, sec.display_name, f.decision, f.output_payload
     FROM manifest_member m JOIN sealed_input s
       ON s.manifest_id = m.manifest_id AND s.permanent_security_id = m.permanent_security_id
     LEFT JOIN security sec ON sec.permanent_security_id = m.permanent_security_id
     LEFT JOIN "freeze" f ON f.manifest_id = m.manifest_id AND f.permanent_security_id = m.permanent_security_id
     WHERE m.manifest_id = $1
     ORDER BY m.display_ticker`,
    [man[0].manifest_id],
  );
  const exclusions = await sql.query<{
    permanent_security_id: string;
    status: string;
    reason_codes: string[];
  }>(
    `SELECT permanent_security_id, status, reason_codes FROM candidate_eligibility WHERE manifest_id = $1 AND status <> 'INCLUDED'`,
    [man[0].manifest_id],
  );
  const tickers = await sql.query<{ permanent_security_id: string; ticker: string }>(`SELECT permanent_security_id, ticker FROM security_ticker`);
  const tmap = Object.fromEntries(tickers.map((t) => [t.permanent_security_id, t.ticker]));
  return wrap("earn-1", clock, {
    role,
    manifest_id: man[0].manifest_id,
    session_date: man[0].session_date,
    sessions,
    members: members.map((m) => ({
      permanent_security_id: m.permanent_security_id,
      ticker: m.display_ticker,
      name: m.display_name ?? m.display_ticker,
      event_key: m.event_key,
      timing_quality: m.timing_quality,
      card_complete: m.card_complete,
      options_valid: m.options_valid,
      pin_count: String(m.pin_count),
      implied_move: typeof m.card.implied_move === "string" ? m.card.implied_move : null,
      benchmark_relative_5d: typeof m.card.benchmark_relative_5d === "string" ? m.card.benchmark_relative_5d : null,
      benchmark_relative_63d: typeof m.card.benchmark_relative_63d === "string" ? m.card.benchmark_relative_63d : null,
      decision: m.decision,
      reasons: m.output_payload?.reasons ?? [],
      shuffle_order_index: role === "OPERATOR" ? null : String(m.shuffle_order_index),
    })),
    exclusions: exclusions.map((e) => ({
      permanent_security_id: e.permanent_security_id,
      ticker: tmap[e.permanent_security_id] ?? e.permanent_security_id,
      status: e.status,
      reason_codes: e.reason_codes,
    })),
  });
}

export async function predictionsPayload(role: DeskRole, manifestId?: string, sessionDate?: string) {
  await ensureBootstrapped();
  const sql = await getSql();
  const clock = await asOf();
  const sessions = await sql.query<{ manifest_id: string; session_date: string; freeze_resolution: string }>(
    `SELECT manifest_id, session_date::text, freeze_resolution FROM manifest ORDER BY session_date`,
  );
  const man = await sql.query<{ manifest_id: string; session_date: string; freeze_resolution: string }>(
    manifestId
      ? `SELECT manifest_id, session_date::text, freeze_resolution FROM manifest WHERE manifest_id = $1`
      : sessionDate
        ? `SELECT manifest_id, session_date::text, freeze_resolution FROM manifest WHERE session_date = $1`
        : `SELECT manifest_id, session_date::text, freeze_resolution FROM manifest ORDER BY session_date DESC LIMIT 1`,
    manifestId ? [manifestId] : sessionDate ? [sessionDate] : [],
  );
  if (!man.length) return wrap("pred-1", clock, {
    role,
    manifest_id: "",
    session_date: sessionDate ?? "",
    freeze_resolution: "EMPTY",
    sessions: sessions.map((s) => ({
      manifest_id: s.manifest_id,
      session_date: s.session_date,
      freeze_resolution: s.freeze_resolution,
    })),
    rows: [],
  });
  const rows = await sql.query<{
    permanent_security_id: string;
    display_ticker: string;
    freeze_id: string | null;
    decision: string | null;
    direction: string | null;
    input_hash: Buffer | null;
    output_hash: Buffer | null;
    verification_level: string | null;
    admission_outcome: string | null;
    position_id: string | null;
    output_payload: { magnitude_low?: string | null; magnitude_high?: string | null; reasons?: string[] } | null;
    shuffle_order_index: number;
  }>(
    `SELECT mm.permanent_security_id, mm.display_ticker, mm.shuffle_order_index,
            f.freeze_id, f.decision, f.direction, f.input_hash, f.output_hash, f.verification_level, f.output_payload,
            a.outcome AS admission_outcome, a.position_id
     FROM manifest_member mm
     LEFT JOIN "freeze" f ON f.manifest_id = mm.manifest_id AND f.permanent_security_id = mm.permanent_security_id
     LEFT JOIN execution_admission a ON a.freeze_id = f.freeze_id
     WHERE mm.manifest_id = $1
     ORDER BY mm.display_ticker`,
    [man[0].manifest_id],
  );
  const operator = role === "OPERATOR";
  return wrap("pred-1", clock, {
    role,
    manifest_id: man[0].manifest_id,
    session_date: man[0].session_date,
    freeze_resolution: man[0].freeze_resolution,
    sessions: sessions.map((s) => ({
      manifest_id: s.manifest_id,
      session_date: s.session_date,
      freeze_resolution: s.freeze_resolution,
    })),
    rows: rows.map((r) => ({
      permanent_security_id: r.permanent_security_id,
      ticker: r.display_ticker,
      name: r.display_ticker,
      status: r.freeze_id ? r.decision : "NO_FREEZE",
      direction: r.decision === "PREDICT" ? r.direction : null,
      execution:
        r.admission_outcome === "ADMITTED"
          ? "PAPER_COMMITTED"
          : r.decision === "PREDICT"
            ? "NOT_TRADED"
            : r.admission_outcome ?? "NONE",
      input_hash: r.input_hash ? asHex(r.input_hash) : null,
      output_hash: r.output_hash ? asHex(r.output_hash) : null,
      verification_level: r.verification_level,
      reasons: r.output_payload?.reasons ?? [],
      magnitude_low: operator ? null : (r.output_payload?.magnitude_low ?? null),
      magnitude_high: operator ? null : (r.output_payload?.magnitude_high ?? null),
      position_id: r.position_id,
      shuffle_order_index: operator ? null : String(r.shuffle_order_index),
    })),
  });
}

export async function resultsPayload(role: DeskRole) {
  await ensureBootstrapped();
  const sql = await getSql();
  const clock = await asOf();
  const sealed = await sql.query<{ c: number }>(`SELECT COUNT(*)::int AS c FROM manifest_member`);
  const frozen = await sql.query<{ c: number }>(`SELECT COUNT(*)::int AS c FROM "freeze"`);
  const byDecision = await sql.query<{ decision: string; c: number }>(
    `SELECT decision, COUNT(*)::int AS c FROM "freeze" GROUP BY decision`,
  );
  const noFreeze = await sql.query<{ c: number }>(`SELECT COUNT(*)::int AS c FROM grade WHERE outcome = 'NO_FREEZE' AND vintage = 0`);
  const outcomes = await sql.query<{ outcome: string; c: number }>(
    `SELECT outcome, COUNT(*)::int AS c FROM grade WHERE vintage = 0 GROUP BY outcome`,
  );
  const complete = await sql.query<{ c: number }>(`SELECT COUNT(*)::int AS c FROM "freeze" WHERE card_complete = TRUE`);
  const predict = byDecision.find((d) => d.decision === "PREDICT")?.c ?? 0;
  const stand = byDecision.find((d) => d.decision === "STAND_DOWN")?.c ?? 0;
  const nSealed = sealed[0].c;
  const nFrozen = frozen[0].c;
  const manifests = await sql.query<{ freeze_resolution: string; c: number }>(
    `SELECT freeze_resolution, COUNT(*)::int AS c FROM manifest GROUP BY freeze_resolution`,
  );
  const nonempty = manifests.filter((m) => m.freeze_resolution !== "EMPTY").reduce((a, b) => a + b.c, 0);
  const partial = manifests.find((m) => m.freeze_resolution === "PARTIAL")?.c ?? 0;

  const grades = await sql.query<{
    ticker: string;
    permanent_security_id: string;
    decision: string | null;
    outcome: string;
    in_evidence_set: boolean;
    values: {
      direction_hit?: boolean | null;
      band_hit?: boolean | null;
      raw_gap?: string | null;
      entry_price?: string;
      exit_price?: string;
    };
    reasons: string[];
    session_date: string;
  }>(
    `SELECT mm.display_ticker AS ticker, g.permanent_security_id, f.decision, g.outcome, g.in_evidence_set, g.values, g.reason_codes AS reasons, man.session_date::text
     FROM grade g
     JOIN manifest_member mm ON mm.manifest_id = g.manifest_id AND mm.permanent_security_id = g.permanent_security_id
     JOIN manifest man ON man.manifest_id = g.manifest_id
     LEFT JOIN "freeze" f ON f.freeze_id = g.freeze_id
     WHERE g.vintage = 0
     ORDER BY man.session_date, mm.display_ticker`,
  );
  const books = await sql.query<{
    ticker: string;
    state: string;
    pnl: string | null;
    basis: string | null;
    eligible: boolean | null;
    notional: string;
    vintage: number | null;
  }>(
    `SELECT p.display_ticker AS ticker, p.state, p.original_reserved_notional::text AS notional,
            bv.values->>'paper_pnl' AS pnl, bv.basis, bv.strategy_pnl_eligible AS eligible, bv.vintage
     FROM "position" p
     LEFT JOIN book_vintage bv ON bv.book_vintage_id = p.last_book_vintage_id
     ORDER BY p.display_ticker`,
  );

  const cleanPredict = grades.filter((g) => g.decision === "PREDICT" && g.in_evidence_set);
  const hits = cleanPredict.filter((g) => g.values.direction_hit === true).length;
  const C = cleanPredict.length;
  const U = grades.filter((g) => g.decision === "PREDICT" && !g.in_evidence_set && g.outcome !== "NO_EVENT").length;
  const lower = rate(hits, C + U);
  const upper = rate(hits + U, C + U);
  const suppress = lower.value && Number(lower.value) <= 0.5 && Number(upper.value) >= 0.5;

  const operator = role === "OPERATOR";
  const { learningSummary } = await import("./learn");
  const learning = await learningSummary(role);
  return wrap("res-1", clock, {
    role,
    banner:
      "Operational research report. The current checklist was selected after prior observation. Small-sample hit rate does not establish a trading edge. Paper P&L is ESTIMATED under a conservative stress haircut, not live-fill evidence. Unresolved prices and excluded labels are disclosed separately.",
    process: {
      sealed: String(nSealed),
      frozen: String(nFrozen),
      no_freeze: String(noFreeze[0].c),
      stand_down: String(stand),
      predict: String(predict),
      complete_frozen_cards: String(complete[0].c),
      outcomes: Object.fromEntries(outcomes.map((o) => [o.outcome, String(o.c)])),
      freeze_rate: rate(nFrozen, nSealed),
      stand_down_rate: rate(stand, nFrozen),
      predict_rate_complete: rate(predict, complete[0].c),
      no_freeze_rate: rate(noFreeze[0].c, nSealed),
      partial_manifest_rate: rate(partial, nonempty),
    },
    research: operator
      ? { restricted: true, message: "Direction hits, bands, marks, and P&L are withheld from OPERATOR until window release." }
      : {
          restricted: false,
          clean_predict_n: String(C),
          direction_hits: String(hits),
          hit_rate: suppress ? null : rate(hits, C),
          attrition_lower: lower,
          attrition_upper: upper,
          interval_label: "missingness sensitivity interval, not a confidence interval",
          point_estimate_suppressed: Boolean(suppress),
          grades: grades.map((g) => ({
            ticker: g.ticker,
            id: g.permanent_security_id,
            session_date: g.session_date,
            decision: g.decision,
            outcome: g.outcome,
            in_evidence_set: g.in_evidence_set,
            direction_hit: g.values.direction_hit ?? null,
            band_hit: g.values.band_hit ?? null,
            raw_gap: g.values.raw_gap ?? null,
            entry_price: g.values.entry_price ?? null,
            exit_price: g.values.exit_price ?? null,
            reasons: g.reasons,
          })),
        },
    book: operator
      ? { restricted: true }
      : {
          positions: books.map((b) => ({
            ticker: b.ticker,
            state: b.state,
            original_reserved_notional: b.notional,
            paper_pnl: b.pnl,
            basis: b.basis,
            strategy_pnl_eligible: b.eligible,
            vintage: b.vintage == null ? null : String(b.vintage),
          })),
        },
    learning,
  });
}

export async function adminPayload(role: DeskRole) {
  await ensureBootstrapped();
  const sql = await getSql();
  const clock = await asOf();
  const jobs = await sql.query<{ job_name: string; status: string; last_completed_at: string | null; safe_error_code: string | null }>(
    `SELECT job_name, status, last_completed_at::text, safe_error_code FROM job_state ORDER BY job_name`,
  );
  const deadlines = await sql.query<{
    kind: string;
    scheduled_at: string;
    applied_at: string | null;
    manifest_id: string | null;
    permanent_security_id: string | null;
  }>(
    `SELECT kind, scheduled_at::text, applied_at::text, manifest_id, permanent_security_id FROM deadline ORDER BY scheduled_at`,
  );
  const alarms = await sql.query<{
    code: string;
    component: string;
    status: string;
    blocks_new_admission: boolean;
    safe_details: Record<string, string | number | boolean | null> | null;
    last_seen: string;
  }>(`SELECT code, component, status, blocks_new_admission, safe_details, last_seen::text FROM ops_alarm ORDER BY last_seen DESC`);
  const ctrl = await sql.query<{ admission_paused: boolean; pause_reason: string | null }>(
    `SELECT admission_paused, pause_reason FROM operator_control WHERE sleeve = 'EARNINGS'`,
  );
  const notes = await sql.query<{ hypothesis: string; note: string }>(
    `SELECT hypothesis, note FROM fire_rate_note ORDER BY event_seq DESC LIMIT 10`,
  );
  const positions = await sql.query<{ position_id: string; display_ticker: string; state: string; cas_token: string }>(
    `SELECT position_id, display_ticker, state, cas_token::text FROM "position" ORDER BY display_ticker`,
  );
  const alpaca = await publicStatus();
  const checked = clock;
  const failedJobs = jobs.filter((j) => j.status === "FAILED");
  const runningJobs = jobs.filter((j) => j.status === "RUNNING");
  const completedJobs = jobs.filter((j) => j.last_completed_at);
  const capabilities: Capability[] = [
    cap({
      id: "auth",
      label: "Authentication",
      state: "ready",
      last_checked: checked,
      reason: "This page required a signed-in session.",
    }),
    cap({
      id: "database",
      label: "Persistent database",
      state: dbSource === "neon" ? "ready" : "sample",
      last_checked: checked,
      reason:
        dbSource === "neon"
          ? "A configured Postgres connection answered this request."
          : "This preview uses an embedded sample database. It is not a durable production store.",
    }),
    cap({
      id: "jobs",
      label: "Durable jobs",
      state: failedJobs.length ? "failed" : jobs.length === 0 ? "not_configured" : completedJobs.length ? "sample" : "not_checked",
      last_checked: completedJobs[0]?.last_completed_at ?? null,
      reason: failedJobs.length
        ? `${failedJobs.length} scheduled job(s) last failed.`
        : jobs.length === 0
          ? "No scheduled-job records were returned."
          : "Fixture scheduled jobs are recorded here. This is not proof of a durable production worker.",
    }),
    cap({
      id: "secret_storage",
      label: "Secret storage",
      state: alpaca.connected ? "ready" : "not_configured",
      last_checked: alpaca.last_ok_at ?? null,
      reason: alpaca.connected
        ? "A saved key record exists for this account."
        : "No trading keys are saved. Missing storage is not treated as ready.",
    }),
    cap({
      id: "alpaca_test",
      label: "Limited Alpaca check",
      state: alpaca.last_error ? "failed" : alpaca.last_ok_at ? "ready" : alpaca.connected ? "not_checked" : "not_configured",
      last_checked: alpaca.last_ok_at ?? null,
      reason: alpaca.last_error
        ? "The last limited account check did not succeed."
        : alpaca.last_ok_at
          ? "A limited account check succeeded. This is not official-auction coverage."
          : alpaca.connected
            ? "Keys are saved. A limited account check has not been recorded."
            : "Save keys, then run the limited check. A loaded page is not a passing test.",
    }),
    cap({
      id: "official_marks",
      label: "Official auction coverage",
      state: "sample",
      last_checked: checked,
      reason: "Official open/close marks in this workspace are fixture records, not live auction coverage.",
    }),
    cap({
      id: "running_jobs",
      label: "Running jobs",
      state: runningJobs.length ? "checking" : jobs.length ? "sample" : "not_configured",
      last_checked: checked,
      reason: runningJobs.length
        ? `${runningJobs.length} job(s) currently marked running.`
        : jobs.length
          ? "No job is marked running. Idle fixture jobs are not a live worker heartbeat."
          : "No job records were returned.",
    }),
  ];
  return wrap("adm-1", clock, {
    role,
    can_mutate: role === "OPERATOR",
    jobs,
    deadlines: deadlines.map((d) => ({
      kind: d.kind,
      scheduled_at: d.scheduled_at,
      applied_at: d.applied_at,
      overdue: d.applied_at == null && new Date(d.scheduled_at) <= new Date(clock),
      target: d.permanent_security_id ?? d.manifest_id,
    })),
    alarms,
    admission_paused: ctrl[0]?.admission_paused ?? false,
    pause_reason: ctrl[0]?.pause_reason ?? null,
    fire_rate_notes: notes,
    positions,
    alpaca,
    capabilities,
    ports: {
      security_master: "FIXTURE",
      calendar: "FIXTURE",
      earnings: "FIXTURE",
      quotes: alpaca.connected ? "ALPACA" : "FIXTURE",
      official_marks: "FIXTURE",
      live_broker: alpaca.connected ? (alpaca.mode === "LIVE" ? "ALPACA_LIVE" : "ALPACA_PAPER") : "UNSUPPORTED",
      real_data_credentials: alpaca.connected ? "PRESENT" : "ABSENT",
    },
  });
}

export async function getOrCreatePrincipal(userId: string, email: string | null): Promise<{ principal_id: string; role: DeskRole | null }> {
  const sql = await getSql();
  const rows = await sql.query<{ principal_id: string; role: DeskRole }>(
    `SELECT principal_id, role FROM desk_principal WHERE user_id = $1`,
    [userId],
  );
  if (rows.length) return rows[0];
  return { principal_id: userId, role: null };
}

export async function claimRole(userId: string, email: string | null, role: "OPERATOR" | "REVIEWER") {
  const sql = await getSql();
  const existing = await sql.query<{ role: DeskRole }>(`SELECT role FROM desk_principal WHERE user_id = $1`, [userId]);
  if (existing.length) return { role: existing[0].role, already: true };
  const id = userId.replace(/[^A-Za-z0-9:._-]/g, "").slice(0, 48) || "user";
  const pid = `usr-${id}`.slice(0, 64);
  await sql.query(
    `INSERT INTO desk_principal (principal_id, user_id, login_name, role, active, label_exposure_declared, created_at)
     VALUES ($1,$2,$3,$4,TRUE,$5,NOW())`,
    [pid, userId, email ?? userId, role, role === "REVIEWER"],
  );
  return { role, already: false };
}

export async function noticesPayload(role: DeskRole) {
  await ensureBootstrapped();
  const sql = await getSql();
  const clock = await asOf();
  const alarms = await sql.query<{
    code: string;
    status: string;
    last_seen: string;
    blocks_new_admission: boolean;
  }>(`SELECT code, status, last_seen::text, blocks_new_admission FROM ops_alarm WHERE status <> 'CLEARED' ORDER BY last_seen DESC LIMIT 12`);
  const overdue = await sql.query<{ c: number }>(
    `SELECT COUNT(*)::int AS c FROM deadline d, fixture_clock c WHERE d.applied_event_seq IS NULL AND d.scheduled_at <= c.now_utc`,
  );
  const { alarmLabel } = await import("@/ui/labels");
  const items: Array<{
    id: string;
    severity: "info" | "warn" | "danger";
    title: string;
    detail: string;
    at: string;
    href: string;
  }> = alarms.map((a) => {
    const copy = alarmLabel(a.code);
    return {
      id: a.code + a.last_seen,
      severity: (a.blocks_new_admission ? "danger" : "warn") as "danger" | "warn",
      title: copy.title,
      detail: copy.detail,
      at: a.last_seen,
      href: "/admin#status",
    };
  });
  if ((overdue[0]?.c ?? 0) > 0) {
    items.unshift({
      id: "overdue-deadlines",
      severity: "warn",
      title: "Scheduled work is overdue",
      detail: `${overdue[0].c} deadline(s) are past due on the fixture clock.`,
      at: clock,
      href: "/admin#status",
    });
  }
  void role;
  return wrap("notice-1", clock, { items });
}
