import assert from "node:assert/strict";
import { test } from "node:test";
import { PGlite } from "@electric-sql/pglite";
import {
  INITIAL_AST,
  evaluate,
  inputHash,
  manifestHash,
  observationHash,
  outputHash,
  ruleAstHash,
  snapshotHash,
  magnitudeBand,
} from "../kernel/index.ts";
import type { Sql } from "../lib/db.ts";
import { DeskError, jsonCanon } from "./util.ts";
import { assertCanonicalPinOrder, manifestObjectFromStored } from "./verify-decode.ts";
import { verifyFreezeArtifact } from "./verify-freeze.ts";

test("T01 stored TEXT canonical_content hashes as the object, not as a JSON string", () => {
  const obj = {
    manifest_id: "man-1",
    session_date: "2026-09-04",
    sleeve: "EARNINGS",
    members: [{ permanent_security_id: "SEC-A", snapshot_hash: "aa".repeat(32) }],
  };
  const text = jsonCanon(obj);
  const written = manifestHash(obj);
  const hashedAsString = manifestHash(text);
  assert.notEqual(hashedAsString, written, "hashing the TEXT string must not equal hashing the object");
  const decoded = manifestObjectFromStored(text);
  assert.equal(manifestHash(decoded), written);
  assert.equal(jsonCanon(decoded), text);
});

test("non-object or non-CJ1 TEXT is rejected", () => {
  assert.throws(() => manifestObjectFromStored("[]"), DeskError);
  assert.throws(() => manifestObjectFromStored("not-json"), DeskError);
  assert.throws(() => manifestObjectFromStored('{"n":1}'), DeskError);
});

test("T13 pin_index must match UTF-8 byte-lex rank even if both maps agree", () => {
  assert.doesNotThrow(() =>
    assertCanonicalPinOrder([
      { observation_id: "obs-a", pin_index: 0 },
      { observation_id: "obs-z", pin_index: 1 },
    ]),
  );
  assert.throws(
    () =>
      assertCanonicalPinOrder([
        { observation_id: "obs-z", pin_index: 0 },
        { observation_id: "obs-a", pin_index: 1 },
      ]),
    DeskError,
  );
});

const SCHEMA = `
CREATE TABLE manifest (
  manifest_id text PRIMARY KEY,
  manifest_hash bytea NOT NULL,
  rule_ast_hash bytea NOT NULL,
  evaluator_artifact_hash bytea NOT NULL,
  cost_model_hash bytea NOT NULL,
  rule_id text NOT NULL,
  rule_version text NOT NULL,
  session_date date NOT NULL,
  canonical_content text NOT NULL
);
CREATE TABLE manifest_member (
  manifest_id text NOT NULL,
  permanent_security_id text NOT NULL,
  snapshot_hash bytea NOT NULL,
  event_key text NOT NULL,
  PRIMARY KEY (manifest_id, permanent_security_id)
);
CREATE TABLE sealed_input (
  manifest_id text NOT NULL,
  permanent_security_id text NOT NULL,
  card jsonb NOT NULL,
  pin_count int NOT NULL,
  PRIMARY KEY (manifest_id, permanent_security_id)
);
CREATE TABLE sealed_input_pin (
  manifest_id text NOT NULL,
  permanent_security_id text NOT NULL,
  observation_id text NOT NULL,
  observation_hash bytea NOT NULL,
  pin_index int NOT NULL
);
CREATE TABLE "freeze" (
  freeze_id text PRIMARY KEY,
  manifest_id text NOT NULL,
  permanent_security_id text NOT NULL,
  input_hash bytea NOT NULL,
  output_hash bytea NOT NULL,
  decision text NOT NULL,
  direction text,
  output_payload jsonb NOT NULL,
  pin_count int NOT NULL
);
CREATE TABLE freeze_pin (
  freeze_id text NOT NULL,
  observation_id text NOT NULL,
  observation_hash bytea NOT NULL,
  pin_index int NOT NULL
);
CREATE TABLE observation (
  observation_id text PRIMARY KEY,
  observation_hash bytea NOT NULL,
  envelope jsonb NOT NULL,
  tombstoned boolean NOT NULL DEFAULT false
);
CREATE TABLE rule_card (
  rule_id text NOT NULL,
  rule_version text NOT NULL,
  ast_content jsonb NOT NULL,
  PRIMARY KEY (rule_id, rule_version)
);
CREATE TABLE execution_admission (
  freeze_id text PRIMARY KEY,
  outcome text,
  position_id text
);
CREATE TABLE ops_alarm (
  alarm_id text PRIMARY KEY,
  code text NOT NULL,
  component text,
  first_seen timestamptz,
  last_seen timestamptz,
  related_ids jsonb,
  blocks_new_admission boolean,
  status text,
  safe_details jsonb,
  opened_event_seq bigint
);
`;

function asSql(pg: PGlite): Sql {
  const query = async <T>(text: string, params: unknown[] = []) => (await pg.query<T>(text, params)).rows;
  const tagged = async () => {
    throw new Error("tagged template not used in verifier tests");
  };
  return Object.assign(tagged, { query }) as Sql;
}

function hexBuf(hex: string) {
  return Buffer.from(hex, "hex");
}

async function seedIntact(pg: PGlite) {
  await pg.exec(SCHEMA);
  const ast = JSON.parse(JSON.stringify(INITIAL_AST));
  const card = {
    timing_quality: "ISSUER_CONFIRMED",
    card_complete: true,
    options_valid: true,
    implied_move: "0.080000000000",
    benchmark_relative_5d: "-0.010000000000",
    benchmark_relative_63d: "0.045000000000",
  };
  const envA = {
    observation_id: "obs-a",
    permanent_security_id: "SEC-A",
    session_date: "2026-09-04",
    snapshot_type: "QUOTE",
    payload: { last: "100.000000" },
  };
  const envZ = {
    observation_id: "obs-z",
    permanent_security_id: "SEC-A",
    session_date: "2026-09-04",
    snapshot_type: "BAR_DAILY",
    payload: { c: "99.000000" },
  };
  const ha = observationHash(envA);
  const hz = observationHash(envZ);
  const pinList = [
    { id: "obs-a", hash: ha },
    { id: "obs-z", hash: hz },
  ].sort((a, b) => Buffer.from(a.id, "utf8").compare(Buffer.from(b.id, "utf8")));
  const snap = snapshotHash({
    permanent_security_id: "SEC-A",
    event_key: "ev-a",
    session_date: "2026-09-04",
    card,
    pins: pinList,
  });
  const ruleH = ruleAstHash(ast);
  const canonical = {
    manifest_id: "man-1",
    session_date: "2026-09-04",
    sleeve: "EARNINGS",
    rule_ast_hash: ruleH,
    members: [{ permanent_security_id: "SEC-A", snapshot_hash: snap }],
  };
  const manH = manifestHash(canonical);
  const engineH = "4".repeat(64);
  const costH = "5".repeat(64);
  const inH = inputHash({
    manifestId: "man-1",
    securityId: "SEC-A",
    manifestHash: manH,
    snapshotHash: snap,
    ruleHash: ruleH,
    engineHash: engineH,
    costHash: costH,
    margin: 3,
    pins: [
      ["obs-a", ha],
      ["obs-z", hz],
    ],
  });
  const ev = evaluate(ast, card);
  const band = magnitudeBand(card.implied_move);
  const payload = {
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
  const outH = outputHash(inH, payload);
  const sql = asSql(pg);
  await sql.query(
    `INSERT INTO rule_card (rule_id, rule_version, ast_content) VALUES ($1,$2,$3::jsonb)`,
    ["rule-1", "v1", JSON.stringify(ast)],
  );
  await sql.query(
    `INSERT INTO manifest (manifest_id, manifest_hash, rule_ast_hash, evaluator_artifact_hash, cost_model_hash,
       rule_id, rule_version, session_date, canonical_content)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
    ["man-1", hexBuf(manH), hexBuf(ruleH), hexBuf(engineH), hexBuf(costH), "rule-1", "v1", "2026-09-04", jsonCanon(canonical)],
  );
  await sql.query(
    `INSERT INTO manifest_member (manifest_id, permanent_security_id, snapshot_hash, event_key) VALUES ($1,$2,$3,$4)`,
    ["man-1", "SEC-A", hexBuf(snap), "ev-a"],
  );
  await sql.query(
    `INSERT INTO sealed_input (manifest_id, permanent_security_id, card, pin_count) VALUES ($1,$2,$3::jsonb,$4)`,
    ["man-1", "SEC-A", JSON.stringify(card), 2],
  );
  await sql.query(
    `INSERT INTO sealed_input_pin (manifest_id, permanent_security_id, observation_id, observation_hash, pin_index)
     VALUES ($1,$2,$3,$4,$5), ($1,$2,$6,$7,$8)`,
    ["man-1", "SEC-A", "obs-a", hexBuf(ha), 0, "obs-z", hexBuf(hz), 1],
  );
  await sql.query(
    `INSERT INTO observation (observation_id, observation_hash, envelope, tombstoned) VALUES ($1,$2,$3::jsonb,false), ($4,$5,$6::jsonb,false)`,
    ["obs-a", hexBuf(ha), JSON.stringify(envA), "obs-z", hexBuf(hz), JSON.stringify(envZ)],
  );
  await sql.query(
    `INSERT INTO "freeze" (freeze_id, manifest_id, permanent_security_id, input_hash, output_hash, decision, direction, output_payload, pin_count)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9)`,
    ["frz-1", "man-1", "SEC-A", hexBuf(inH), hexBuf(outH), ev.decision, ev.direction, JSON.stringify(payload), 2],
  );
  await sql.query(
    `INSERT INTO freeze_pin (freeze_id, observation_id, observation_hash, pin_index) VALUES ($1,$2,$3,$4), ($1,$5,$6,$7)`,
    ["frz-1", "obs-a", hexBuf(ha), 0, "obs-z", hexBuf(hz), 1],
  );
  await sql.query(`INSERT INTO execution_admission (freeze_id, outcome, position_id) VALUES ($1,$2,$3)`, [
    "frz-1",
    "ADMITTED",
    null,
  ]);
  return sql;
}

async function unverifiable(sql: Sql) {
  try {
    await verifyFreezeArtifact("man-1", "SEC-A", sql);
    assert.fail("expected verification to reject");
  } catch (e) {
    assert.ok(e instanceof DeskError, String(e));
    assert.notEqual(e.code, "BYTE_VERIFIED");
  }
  const audit = await sql.query<{ result: string }>(`SELECT result FROM freeze_verify_audit`);
  assert.equal(audit.length, 1);
  assert.equal(audit[0].result, "UNVERIFIABLE");
  const alarms = await sql.query<{ code: string }>(`SELECT code FROM ops_alarm WHERE status <> 'RESOLVED'`);
  assert.equal(alarms.length, 1);
  assert.equal(alarms[0].code, "FREEZE_ARTIFACT_MISMATCH");
}

test("intact TEXT fixture is BYTE_VERIFIED", async () => {
  const pg = new PGlite();
  const sql = await seedIntact(pg);
  const out = await verifyFreezeArtifact("man-1", "SEC-A", sql);
  assert.equal(out.verification_level, "BYTE_VERIFIED");
  const audit = await sql.query<{ result: string }>(`SELECT result FROM freeze_verify_audit`);
  assert.equal(audit[0].result, "BYTE_VERIFIED");
});

test("T16 noncanonical sealed card records UNVERIFIABLE and an alarm", async () => {
  const pg = new PGlite();
  const sql = await seedIntact(pg);
  await sql.query(`UPDATE sealed_input SET card = jsonb_set(card, '{benchmark_relative_63d}', '1')`);
  await unverifiable(sql);
});

test("T17 noncanonical rule AST records UNVERIFIABLE and an alarm", async () => {
  const pg = new PGlite();
  const sql = await seedIntact(pg);
  await sql.query(`UPDATE rule_card SET ast_content = jsonb_set(ast_content, '{all,3,value}', '0.05')`);
  await unverifiable(sql);
});
