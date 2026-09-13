import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { getSql, withTransaction } from "@/lib/db";
import {
  COST_MODEL_CONTENT,
  ENGINE_VERSION,
  INITIAL_AST,
  costModelHash,
  evaluatorArtifactHash,
  observationHash,
  payloadHash,
  policyHash,
  ruleAstHash,
  ruleTextHash,
  canon,
  ident,
} from "@/kernel/index";
import { freezeMember, sealSession } from "./commands";
import {
  advanceClock,
  applyDueDeadlines,
  applyEntryCorrection,
  recordPrintKnowledge,
} from "./lifecycle";
import { appendEvent, withWriter } from "./writer";
import { DeskError, etInstant, hexBuf, jsonCanon, newId } from "./util";

const SERVICE = "svc-desk-writer";
const RULE_TEXT = "Predict LONG when issuer-confirmed AMC, complete card, valid options, implied move in [4%, 15%], 5d relative < 0, 63d relative > 0.";

const NAMES: Array<{ id: string; ticker: string; venue: "XNYS" | "XNAS"; name: string }> = [
  { id: "SEC-ALPHA", ticker: "ALFA", venue: "XNYS", name: "Alpha Fixture Corp" },
  { id: "SEC-BRAVO", ticker: "BRAV", venue: "XNAS", name: "Bravo Fixture Inc" },
  { id: "SEC-CHARLIE", ticker: "CHRL", venue: "XNYS", name: "Charlie Fixture Co" },
  { id: "SEC-DELTA", ticker: "DELT", venue: "XNAS", name: "Delta Fixture PLC" },
  { id: "SEC-ECHO", ticker: "ECHO", venue: "XNYS", name: "Echo Fixture Ltd" },
  { id: "SEC-FOXTROT", ticker: "FOXT", venue: "XNAS", name: "Foxtrot Fixture NV" },
  { id: "SEC-GOLF", ticker: "GOLF", venue: "XNYS", name: "Golf Fixture SA" },
  { id: "SEC-HOTEL", ticker: "HOTL", venue: "XNAS", name: "Hotel Fixture LLC" },
  { id: "SEC-SPY", ticker: "SPY", venue: "XNYS", name: "Reference Benchmark SPY" },
];

function openDates(): string[] {
  const out: string[] = [];
  const d = new Date(Date.UTC(2026, 5, 1));
  const end = new Date(Date.UTC(2026, 8, 18));
  while (d <= end) {
    const iso = d.toISOString().slice(0, 10);
    const dow = d.getUTCDay();
    const closed = dow === 0 || dow === 6 || iso === "2026-09-07";
    if (!closed) out.push(iso);
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return out;
}

async function insertObs(
  sql: import("@/lib/db").Sql,
  seq: number,
  row: {
    id: string;
    sec: string;
    session: string;
    type: string;
    payload: Record<string, unknown>;
    sourceClass?: string;
    receivedAt: string;
    eventKey?: string;
  },
) {
  const payloadH = payloadHash(row.payload);
  const envelope = {
    observation_id: row.id,
    permanent_security_id: row.sec,
    event_key: row.eventKey ?? null,
    session_date: row.session,
    snapshot_type: row.type,
    provider_id: "fixture",
    provider_record_id: row.id,
    provider_revision: "1",
    payload_hash: payloadH,
    payload_schema_version: "1",
    source_class: row.sourceClass ?? "AUTHORITATIVE",
    adjustment_basis: row.type.startsWith("MARK") || row.type === "QUOTE" || row.type === "BAR_DAILY" ? "UNADJUSTED" : "NOT_PRICE",
    payload: row.payload,
  };
  const obsH = observationHash(envelope);
  await sql.query(
    `INSERT INTO observation (
      observation_id, event_seq, permanent_security_id, event_key, session_date, snapshot_type, provider_id,
      provider_record_id, provider_revision, received_at, source_event_at, source_class, adjustment_basis,
      payload_schema_id, payload_hash, observation_hash, envelope, is_partial, partition, tombstoned
    ) VALUES ($1,$2,$3,$4,$5,$6,'fixture',$1,'1',$7,$7,$8,$9,'1',$10,$11,$12::jsonb,FALSE,'RESEARCH',FALSE)`,
    [
      row.id,
      seq,
      row.sec,
      row.eventKey ?? null,
      row.session,
      row.type,
      row.receivedAt,
      envelope.source_class,
      envelope.adjustment_basis,
      hexBuf(payloadH),
      hexBuf(obsH),
      JSON.stringify(envelope),
    ],
  );
}

let bootChain: Promise<{ ok: boolean; note: string }> | null = null;

export async function ensureBootstrapped(): Promise<{ ok: boolean; note: string }> {
  if (bootChain) return bootChain;
  bootChain = (async () => {
    const sql = await getSql();
    const st = await sql.query<{ completed: boolean }>(`SELECT completed FROM bootstrap_state WHERE singleton_key = TRUE`);
    if (st[0]?.completed) {
      void import("./learn")
        .then((m) => m.reviseClosedManifests(SERVICE))
        .catch(() => {
          /* observational — do not block sign-in or home */
        });
      return { ok: true, note: "already-seeded" };
    }
    await seedWorld();
    return { ok: true, note: "seeded" };
  })()
    .then((r) => {
      console.info("[trading-app] bootstrap", r.note);
      return r;
    })
    .catch((err) => {
      bootChain = null;
      console.error("[trading-app] bootstrap failed", err);
      throw err;
    });
  return bootChain;
}

async function clockIso(): Promise<string> {
  const sql = await getSql();
  const r = await sql.query<{ now_utc: string }>(`SELECT now_utc::text FROM fixture_clock WHERE singleton_key = TRUE`);
  return r[0].now_utc;
}

async function ensureClock(iso: string) {
  const cur = new Date(await clockIso());
  const next = new Date(iso);
  if (next > cur) await advanceClock(iso, SERVICE);
}

async function runSession(opts: {
  commandSeal: string;
  sessionDate: string;
  skip: Set<string>;
  freezePrefix: string;
  echoLast?: boolean;
  beforeSeal?: () => Promise<void>;
}) {
  const sql = await getSql();
  let man = await sql.query<{ manifest_id: string }>(`SELECT manifest_id FROM manifest WHERE session_date = $1`, [
    opts.sessionDate,
  ]);
  if (!man.length) {
    await ensureClock(etInstant(opts.sessionDate, "15:45").toISOString());
    if (opts.beforeSeal) await opts.beforeSeal();
    await sealSession(opts.commandSeal, opts.sessionDate, SERVICE);
    man = await sql.query<{ manifest_id: string }>(`SELECT manifest_id FROM manifest WHERE session_date = $1`, [
      opts.sessionDate,
    ]);
  }
  const members = await sql.query<{ permanent_security_id: string; shuffle_order_index: number }>(
    `SELECT permanent_security_id, shuffle_order_index FROM manifest_member WHERE manifest_id = $1 ORDER BY shuffle_order_index`,
    [man[0].manifest_id],
  );
  await ensureClock(etInstant(opts.sessionDate, "15:46").toISOString());
  const ordered = opts.echoLast
    ? [
        ...members.filter((m) => m.permanent_security_id !== "SEC-ECHO"),
        ...members.filter((m) => m.permanent_security_id === "SEC-ECHO"),
      ]
    : members;
  for (const m of ordered) {
    if (opts.skip.has(m.permanent_security_id)) continue;
    const frozen = await sql.query(
      `SELECT 1 FROM "freeze" WHERE manifest_id = $1 AND permanent_security_id = $2`,
      [man[0].manifest_id, m.permanent_security_id],
    );
    if (frozen.length) continue;
    await refreshQuote(m.permanent_security_id, opts.sessionDate);
    try {
      await freezeMember(
        `cmd-frz-${opts.freezePrefix}-${m.permanent_security_id}`,
        man[0].manifest_id,
        m.permanent_security_id,
        SERVICE,
      );
    } catch (err) {
      if (err instanceof DeskError && err.code === "OFF_DESIGN_EARLY_RELEASE") continue;
      throw err;
    }
  }
  await ensureClock(etInstant(opts.sessionDate, "15:47").toISOString());
  await applyDueDeadlines(SERVICE);
}

async function seedWorld() {
  const sql = await getSql();
  const t0 = etInstant("2026-06-01", "09:30").toISOString();
  const alreadyPolicy = await sql.query(`SELECT 1 FROM policy_bundle LIMIT 1`);
  const alreadyObs = await sql.query(`SELECT 1 FROM observation LIMIT 1`);

  await withTransaction(async (tx) => {
    const gates = await tx.query(`SELECT 1 FROM writer_gate`);
    if (gates.length) return;
    const eventId = ident("evt-init00000001");
    const payload = { type: "INIT" };
    await tx.query(
      `INSERT INTO event_log (
        event_seq, event_id, command_id, request_hash, event_type, actor_principal_id,
        occurred_at, semantic_payload, canonical_payload, result_receipt, event_hash
      ) VALUES (1,$1,'cmd-init00000001',$2,'INIT',$3,$4,$5::jsonb,$6,$7::jsonb,$2)`,
      [eventId, hexBuf("00".repeat(32)), SERVICE, t0, JSON.stringify(payload), jsonCanon(payload), JSON.stringify({ ok: true })],
    );
    await tx.query(
      `INSERT INTO writer_gate (singleton_key, next_event_seq, last_authoritative_time, clock_trusted) VALUES (TRUE, 2, $1, TRUE)`,
      [t0],
    );
    await tx.query(
      `INSERT INTO fixture_clock (singleton_key, now_utc, trusted, source) VALUES (TRUE, $1, TRUE, 'FIXTURE')`,
      [t0],
    );
    await tx.query(
      `INSERT INTO desk_risk_state (sleeve, reserved_count, reserved_notional, updated_event_seq) VALUES ('EARNINGS', 0, 0, 1)`,
    );
    await tx.query(
      `INSERT INTO operator_control (sleeve, admission_paused, pause_reason, updated_event_seq) VALUES ('EARNINGS', FALSE, NULL, 1)`,
    );
    await tx.query(
      `INSERT INTO desk_principal (principal_id, user_id, login_name, role, active, label_exposure_declared, created_at)
       VALUES ('svc-desk-writer', 'svc-desk-writer', 'service-writer', 'SERVICE', TRUE, TRUE, $1)
       ON CONFLICT DO NOTHING`,
      [t0],
    );
    const jobs = ["premarket-check", "capture-cycle", "seal-session", "ordered-freeze", "due-deadlines", "mark-ingest", "grade-apply", "report-finalize", "learn-revise"];
    for (const j of jobs) {
      await tx.query(`INSERT INTO job_state (job_name, status) VALUES ($1, 'IDLE') ON CONFLICT DO NOTHING`, [j]);
    }
  });

  let kernelSrc = ENGINE_VERSION;
  try {
    kernelSrc = readFileSync(new URL("../kernel/index.ts", import.meta.url), "utf8");
  } catch {
    kernelSrc = ENGINE_VERSION;
  }
  const kernelSha = createHash("sha256").update(kernelSrc).digest("hex");
  const artifactManifest = {
    engine_version: ENGINE_VERSION,
    interpreter: "nodejs-22",
    files: [{ name: "src/kernel/index.ts", sha256: kernelSha }],
    dependency_lock_hash: createHash("sha256").update("node:crypto+bigint-decimal").digest("hex"),
  };
  const artHash = evaluatorArtifactHash(artifactManifest);
  const pol = {
    sleeve: "EARNINGS",
    admission_min_price: "5.000000",
    ticket: "5000.0000",
    capacity_count: "3",
    capacity_notional: "15000.0000",
    per_event_limit: "2",
    broker_margin_minutes: "3",
    seal_lead_seconds: "120",
    venues: ["XNYS", "XNAS"],
    source_priority: ["fixture"],
    field_registry: ["timing_quality", "card_complete", "options_valid", "implied_move", "benchmark_relative_5d", "benchmark_relative_63d"],
    label_target: "unadjusted_d_close_to_d1_open",
    data_mode: "FIXTURE",
  };
  const polHash = policyHash(pol);
  const astHash = ruleAstHash(INITIAL_AST);
  const costHash = costModelHash(COST_MODEL_CONTENT);
  const uniMembers = NAMES.filter((n) => n.id !== "SEC-SPY").map((n) => n.id);
  const uniHash = createHash("sha256").update(uniMembers.join(",")).digest("hex");

  if (!alreadyPolicy.length) {
    await withWriter(SERVICE, async (ctx) => {
      const { eventSeq } = await appendEvent(ctx, {
        commandId: "cmd-register-policy",
        type: "REGISTER_POLICY",
        payload: { policy_id: "pol-v1" },
        receipt: { ok: true },
      });
      await ctx.sql.query(
        `INSERT INTO policy_bundle (policy_id, policy_version, policy_content, canonical_content, policy_hash, registered_event_seq)
         VALUES ('pol-v1','v1',$1::jsonb,$2,$3,$4)`,
        [JSON.stringify(pol), jsonCanon(pol), hexBuf(polHash), eventSeq],
      );
      await ctx.sql.query(
        `INSERT INTO cost_model (
          cost_model_id, version, basis, constant_penalty, imbalance_coefficient, imbalance_term, commission_per_fill,
          canonical_content, content_hash, registered_event_seq
        ) VALUES ('cost-v1','1','CONSERVATIVE_STRESS_HAIRCUT',0.000500,0,0,0,$1,$2,$3)`,
        [jsonCanon(COST_MODEL_CONTENT), hexBuf(costHash), eventSeq],
      );
      await ctx.sql.query(
        `INSERT INTO evaluator_artifact (evaluator_id, engine_version, artifact_manifest, canonical_content, artifact_hash, supported_ast_schema, registered_event_seq)
         VALUES ('eval-v1',$1,$2::jsonb,$3,$4,'1',$5)`,
        [ENGINE_VERSION, JSON.stringify(artifactManifest), jsonCanon(artifactManifest), hexBuf(artHash), eventSeq],
      );
      await ctx.sql.query(
        `INSERT INTO rule_card (
          rule_id, rule_version, rule_text, rule_text_hash, ast_content, canonical_ast, ast_hash, evaluator_id, policy_id,
          expected_predict_rate_min, expected_predict_rate_max, magnitude_definition, registered_event_seq
        ) VALUES ('rule-v1','v1',$1,$2,$3::jsonb,$4,$5,'eval-v1','pol-v1',0.10,0.25,$6::jsonb,$7)`,
        [
          RULE_TEXT,
          hexBuf(ruleTextHash(RULE_TEXT)),
          JSON.stringify(INITIAL_AST),
          jsonCanon(INITIAL_AST),
          hexBuf(astHash),
          JSON.stringify({ low: "0.5*implied_move", high: "2.0*implied_move" }),
          eventSeq,
        ],
      );
      for (const n of NAMES) {
        await ctx.sql.query(
          `INSERT INTO security (permanent_security_id, instrument_type, currency, display_name) VALUES ($1,$2,'USD',$3)`,
          [n.id, n.id === "SEC-SPY" ? "REFERENCE_ETF" : "US_COMMON", n.name],
        );
        await ctx.sql.query(
          `INSERT INTO security_ticker (mapping_id, permanent_security_id, provider_id, ticker, valid_from, registered_event_seq)
           VALUES ($1,$2,'fixture',$3,$4,$5)`,
          [newId("tkr"), n.id, n.ticker, t0, eventSeq],
        );
      }
      await ctx.sql.query(
        `INSERT INTO universe_version (universe_version, effective_from, content_hash, registered_event_seq, data_mode)
         VALUES ('uni-fix-1','2026-06-01',$1,$2,'FIXTURE')`,
        [hexBuf(uniHash), eventSeq],
      );
      for (const n of NAMES.filter((x) => x.id !== "SEC-SPY")) {
        await ctx.sql.query(
          `INSERT INTO universe_member (universe_version, permanent_security_id, included, listing_exchange, liquidity_snapshot, sector, market_cap_bucket)
           VALUES ('uni-fix-1',$1,TRUE,$2,$3::jsonb,'TECH','LARGE')`,
          [n.id, n.venue, JSON.stringify({ mean_dollar_volume: "50000000" })],
        );
      }
      await ctx.sql.query(
        `INSERT INTO evaluation_window (
          window_id, starts_at, ends_at, rule_id, rule_version, policy_id, cost_model_id, evaluator_id, universe_version,
          hypothesis_claim, prior_contaminated, contamination_source
        ) VALUES (
          'win-2026q3', '2026-07-01T04:00:00.000Z', '2026-10-01T04:00:00.000Z',
          'rule-v1','v1','pol-v1','cost-v1','eval-v1','uni-fix-1',
          'Initial handwritten conjunction after prior observation.', TRUE, 'PRIOR_RULE_LABELS'
        )`,
      );
      const dates = openDates();
      for (const venue of ["XNYS", "XNAS"] as const) {
        for (const day of dates) {
          const open = etInstant(day, "09:30");
          const close = etInstant(day, "16:00");
          const moc = etInstant(day, venue === "XNYS" ? "15:50" : "15:55");
          const content = { venue, day, open: open.toISOString(), close: close.toISOString(), moc: moc.toISOString() };
          const ch = createHash("sha256").update(canon(content)).digest();
          await ctx.sql.query(
            `INSERT INTO calendar_session (
              calendar_version, listing_exchange, session_date, is_open, open_at, close_at, moc_entry_cutoff_at,
              effective_rule_id, source_reference, verified_at, content_hash
            ) VALUES ('cal-2026',$1,$2,TRUE,$3,$4,$5,$6,'fixture-calendar',$7,$8)`,
            [venue, day, open.toISOString(), close.toISOString(), moc.toISOString(), venue === "XNYS" ? "NYSE-AUCTIONS" : "NASDAQ-4702", t0, ch],
          );
        }
        const labor = createHash("sha256").update("closed-2026-09-07" + venue).digest();
        await ctx.sql.query(
          `INSERT INTO calendar_session (
            calendar_version, listing_exchange, session_date, is_open, effective_rule_id, source_reference, verified_at, content_hash
          ) VALUES ('cal-2026',$1,'2026-09-07',FALSE,'holiday','Labor Day',$2,$3)
          ON CONFLICT DO NOTHING`,
          [venue, t0, labor],
        );
      }
    });
  }

  if (!alreadyObs.length) {
    await withWriter(SERVICE, async (ctx) => {
      const { eventSeq } = await appendEvent(ctx, {
        commandId: "cmd-ingest-seed",
        type: "INGEST",
        payload: { batch: "fixture-seed" },
        receipt: { ok: true },
      });
      for (const n of NAMES) {
        if (n.id === "SEC-SPY") continue;
        await insertObs(ctx.sql, eventSeq, {
          id: ident(`obs-tape-${n.ticker}-seed`),
          sec: n.id,
          session: "2026-09-04",
          type: "TAPE_RELATIVE",
          payload: {
            rel5: "-0.014925174253",
            rel63: "0.042000000000",
            method: "product_of_factors_minus_benchmark",
            horizon_end: "D-1",
          },
          receivedAt: etInstant("2026-09-03", "16:05").toISOString(),
        });
        await insertObs(ctx.sql, eventSeq, {
          id: ident(`obs-tape-${n.ticker}-0911`),
          sec: n.id,
          session: "2026-09-11",
          type: "TAPE_RELATIVE",
          payload: {
            rel5: "-0.014925174253",
            rel63: "0.042000000000",
            method: "product_of_factors_minus_benchmark",
            horizon_end: "D-1",
          },
          receivedAt: etInstant("2026-09-10", "16:05").toISOString(),
        });
      }
      const sessions: Array<{ day: string; members: string[] }> = [
        { day: "2026-09-04", members: ["SEC-HOTEL", "SEC-FOXTROT"] },
        { day: "2026-09-11", members: ["SEC-ALPHA", "SEC-BRAVO", "SEC-CHARLIE", "SEC-DELTA", "SEC-ECHO", "SEC-GOLF"] },
      ];
      for (const s of sessions) {
        for (const sec of s.members) {
          const meta = NAMES.find((n) => n.id === sec)!;
          const recv = etInstant(s.day, "15:44").toISOString();
          await insertObs(ctx.sql, eventSeq, {
            id: ident(`obs-evt-${meta.ticker}-${s.day.replace(/-/g, "")}`),
            sec,
            session: s.day,
            type: "EARNINGS_EVENT",
            eventKey: ident(`ev-${meta.ticker}-${s.day.replace(/-/g, "")}`),
            payload: { timing: "AMC", quality: "ISSUER_CONFIRMED", period: "Q3-2026" },
            receivedAt: recv,
          });
          await ctx.sql.query(
            `INSERT INTO earnings_event (event_observation_id, event_key, permanent_security_id, intended_session, timing, quality, source_observation_id)
             VALUES ($1,$2,$3,$4,'AMC','ISSUER_CONFIRMED',$1)`,
            [ident(`obs-evt-${meta.ticker}-${s.day.replace(/-/g, "")}`), ident(`ev-${meta.ticker}-${s.day.replace(/-/g, "")}`), sec, s.day],
          );
          await insertObs(ctx.sql, eventSeq, {
            id: ident(`obs-q-${meta.ticker}-${s.day.replace(/-/g, "")}`),
            sec,
            session: s.day,
            type: "QUOTE",
            payload: { bid: "99.960000", ask: "100.040000", last: "100.000000", mid: "100.000000" },
            receivedAt: recv,
          });
          if (sec !== "SEC-BRAVO") {
            for (const right of ["C", "P"] as const) {
              await insertObs(ctx.sql, eventSeq, {
                id: ident(`obs-opt-${meta.ticker}-${right}-${s.day.replace(/-/g, "")}`),
                sec,
                session: s.day,
                type: "OPTION_LEG",
                payload: {
                  right,
                  strike: "100.000000",
                  expiry: "2026-10-16",
                  bid: "3.900000",
                  ask: "4.100000",
                  oi: "500",
                  volume: "80",
                  multiplier: "100",
                },
                receivedAt: recv,
              });
            }
          }
        }
      }
      await insertObs(ctx.sql, eventSeq, {
        id: "obs-mk-HOTL-entry",
        sec: "SEC-HOTEL",
        session: "2026-09-04",
        type: "MARK_ENTRY_CLOSE",
        payload: { price: "100.000000", state: "OFFICIAL", venue: "XNAS" },
        receivedAt: etInstant("2026-09-04", "16:01").toISOString(),
      });
      await insertObs(ctx.sql, eventSeq, {
        id: "obs-mk-HOTL-exit",
        sec: "SEC-HOTEL",
        session: "2026-09-08",
        type: "MARK_EXIT_OPEN",
        payload: { price: "105.000000", state: "OFFICIAL", venue: "XNAS" },
        receivedAt: etInstant("2026-09-08", "09:35").toISOString(),
      });
      await insertObs(ctx.sql, eventSeq, {
        id: "obs-mk-FOXT-entry",
        sec: "SEC-FOXTROT",
        session: "2026-09-04",
        type: "MARK_ENTRY_CLOSE",
        payload: { price: "100.000000", state: "OFFICIAL", venue: "XNAS" },
        receivedAt: etInstant("2026-09-04", "16:01").toISOString(),
      });
      await insertObs(ctx.sql, eventSeq, {
        id: "obs-mk-FOXT-exit",
        sec: "SEC-FOXTROT",
        session: "2026-09-08",
        type: "MARK_EXIT_OPEN",
        payload: { price: "50.000000", state: "OFFICIAL", venue: "XNAS" },
        receivedAt: etInstant("2026-09-08", "09:35").toISOString(),
      });
      await insertObs(ctx.sql, eventSeq, {
        id: "obs-ca-FOXT",
        sec: "SEC-FOXTROT",
        session: "2026-09-04",
        type: "CORPORATE_ACTION",
        payload: { kind: "SPLIT", split_multiplier: "2", distribution: "0.000000", effective: "D_CLOSE_TO_D1_OPEN" },
        receivedAt: etInstant("2026-09-08", "08:00").toISOString(),
      });
      for (const [sec, ticker, exitPx, hasExit] of [
        ["SEC-ALPHA", "ALFA", "105.000000", true],
        ["SEC-BRAVO", "BRAV", "101.000000", true],
        ["SEC-CHARLIE", "CHRL", null, false],
        ["SEC-ECHO", "ECHO", "110.000000", true],
      ] as Array<[string, string, string | null, boolean]>) {
        await insertObs(ctx.sql, eventSeq, {
          id: ident(`obs-mk-${ticker}-entry`),
          sec,
          session: "2026-09-11",
          type: "MARK_ENTRY_CLOSE",
          payload: { price: "100.000000", state: "OFFICIAL", venue: "XNYS" },
          receivedAt: etInstant("2026-09-11", "16:01").toISOString(),
        });
        if (hasExit && exitPx) {
          await insertObs(ctx.sql, eventSeq, {
            id: ident(`obs-mk-${ticker}-exit`),
            sec,
            session: "2026-09-14",
            type: "MARK_EXIT_OPEN",
            payload: { price: exitPx, state: "OFFICIAL", venue: "XNYS" },
            receivedAt: etInstant("2026-09-14", "09:35").toISOString(),
          });
        }
      }
    });
  }

  await runSession({
    commandSeal: "cmd-seal-20260904",
    sessionDate: "2026-09-04",
    skip: new Set(),
    freezePrefix: "0904",
  });
  await ensureClock(etInstant("2026-09-08", "16:00").toISOString());
  await applyDueDeadlines(SERVICE);
  await ensureClock(etInstant("2026-09-09", "16:00").toISOString());
  await applyDueDeadlines(SERVICE);

  await runSession({
    commandSeal: "cmd-seal-20260911",
    sessionDate: "2026-09-11",
    skip: new Set(["SEC-DELTA"]),
    freezePrefix: "0911",
    echoLast: true,
    beforeSeal: async () => {
      await recordPrintKnowledge(
        "cmd-pk-golf",
        {
          eventKey: "ev-GOLF-20260911",
          securityId: "SEC-GOLF",
          reason: "Issuer results posted before the information horizon.",
        },
        SERVICE,
      );
    },
  });
  await ensureClock(etInstant("2026-09-14", "16:00").toISOString());
  await applyDueDeadlines(SERVICE);
  await ensureClock(etInstant("2026-09-15", "16:00").toISOString());
  await applyDueDeadlines(SERVICE);

  try {
    const { reviseClosedManifests } = await import("./learn");
    await reviseClosedManifests(SERVICE);
  } catch {
    /* first-boot learning is observational */
  }

  const sql2 = await getSql();
  const hotelPos = await sql2.query<{ position_id: string }>(
    `SELECT p.position_id FROM "position" p JOIN "freeze" f ON f.freeze_id = p.freeze_id WHERE f.permanent_security_id = 'SEC-HOTEL'`,
  );
  if (hotelPos.length) {
    await applyEntryCorrection("cmd-corr-hotel", hotelPos[0].position_id, "99.800000", SERVICE);
  }

  await sql2.query(`UPDATE bootstrap_state SET completed = TRUE, completed_at = NOW(), note = 'fixture v1.2 seeded' WHERE singleton_key = TRUE`);
}

async function refreshQuote(sec: string, session: string) {
  await withWriter(SERVICE, async (ctx) => {
    const { eventSeq } = await appendEvent(ctx, {
      commandId: newId("cmd"),
      type: "INGEST",
      payload: { type: "QUOTE", sec, session },
      receipt: { ok: true },
    });
    const meta = NAMES.find((n) => n.id === sec)!;
    await insertObs(ctx.sql, eventSeq, {
      id: ident(`obs-qx-${meta.ticker}-${session.replace(/-/g, "")}-${eventSeq}`),
      sec,
      session,
      type: "QUOTE",
      payload: { bid: "99.960000", ask: "100.040000", last: "100.000000", mid: "100.000000" },
      receivedAt: ctx.now.toISOString(),
    });
  });
}

