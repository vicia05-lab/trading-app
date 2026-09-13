import { getSql } from "@/lib/db";
import {
  evaluate,
  inputHash,
  magnitudeBand,
  manifestHash,
  observationHash,
  outputHash,
  ruleAstHash,
  snapshotHash,
} from "@/kernel/index";
import { asHex, DeskError, jsonCanon, newId } from "./util";
import type { TypedCard } from "./features";

const MARGIN = 3;

export type VerifyFreezeResult = {
  freeze_id: string;
  decision: string;
  direction: string | null;
  input_hash: string;
  output_hash: string;
  admission_outcome: string | null;
  position_id: string | null;
  duplicate: true;
  verification_level: "BYTE_VERIFIED";
};

async function ensureAudit(): Promise<void> {
  const sql = await getSql();
  await sql.query(`
    CREATE TABLE IF NOT EXISTS freeze_verify_audit (
      audit_id text PRIMARY KEY,
      freeze_id text NOT NULL,
      manifest_id text NOT NULL,
      permanent_security_id text NOT NULL,
      result text NOT NULL CHECK (result IN ('BYTE_VERIFIED', 'HASH_ONLY', 'ATTESTED', 'UNVERIFIABLE')),
      detail text NOT NULL,
      checked_at timestamptz NOT NULL DEFAULT NOW()
    )`);
}

async function recordOutcome(args: {
  freezeId: string;
  manifestId: string;
  securityId: string;
  result: "BYTE_VERIFIED" | "UNVERIFIABLE";
  detail: string;
}): Promise<void> {
  await ensureAudit();
  const sql = await getSql();
  await sql.query(
    `INSERT INTO freeze_verify_audit (audit_id, freeze_id, manifest_id, permanent_security_id, result, detail, checked_at)
     VALUES ($1,$2,$3,$4,$5,$6,NOW())`,
    [newId("vfy"), args.freezeId, args.manifestId, args.securityId, args.result, args.detail],
  );
  if (args.result === "UNVERIFIABLE") {
    const existing = await sql.query<{ alarm_id: string }>(
      `SELECT alarm_id FROM ops_alarm WHERE code = 'FREEZE_ARTIFACT_MISMATCH' AND status <> 'RESOLVED'`,
    );
    if (existing.length) {
      await sql.query(`UPDATE ops_alarm SET last_seen = NOW(), safe_details = $1::jsonb WHERE alarm_id = $2`, [
        JSON.stringify({ freeze_id: args.freezeId, detail: args.detail }),
        existing[0].alarm_id,
      ]);
    } else {
      await sql.query(
        `INSERT INTO ops_alarm (
           alarm_id, code, component, first_seen, last_seen, related_ids, blocks_new_admission, status, safe_details, opened_event_seq
         ) VALUES ($1,'FREEZE_ARTIFACT_MISMATCH','freeze',NOW(),NOW(),'[]'::jsonb,TRUE,'OPEN',$2::jsonb,NULL)`,
        [newId("alm"), JSON.stringify({ freeze_id: args.freezeId, detail: args.detail })],
      );
    }
  }
}

async function fail(args: { freezeId: string; manifestId: string; securityId: string; detail: string }): Promise<never> {
  await recordOutcome({ ...args, result: "UNVERIFIABLE" });
  throw new DeskError("FREEZE_ARTIFACT_MISMATCH", args.detail, 503);
}

function evalCard(card: TypedCard) {
  return {
    timing_quality: card.timing_quality,
    card_complete: card.card_complete,
    options_valid: card.options_valid,
    implied_move: card.implied_move,
    benchmark_relative_5d: card.benchmark_relative_5d,
    benchmark_relative_63d: card.benchmark_relative_63d,
  };
}

function decisionPayload(
  ev: { status: string; decision: string; direction: string | null; reasons: string[] },
  card: TypedCard,
) {
  const band =
    ev.decision === "PREDICT" && card.implied_move
      ? magnitudeBand(card.implied_move)
      : { low: null as string | null, high: null as string | null };
  return {
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
}

function sameCanon(a: unknown, b: unknown): boolean {
  try {
    return jsonCanon(a) === jsonCanon(b);
  } catch {
    return false;
  }
}

/** Read-only replay. Never creates a freeze. Diagnostics commit even when verification fails. */
export async function verifyFreezeArtifact(manifestId: string, securityId: string): Promise<VerifyFreezeResult> {
  const sql = await getSql();
  const fr = await sql.query<{
    freeze_id: string;
    input_hash: Buffer;
    output_hash: Buffer;
    decision: string;
    direction: string | null;
    output_payload: unknown;
    pin_count: number;
  }>(
    `SELECT freeze_id, input_hash, output_hash, decision, direction, output_payload, pin_count
     FROM "freeze" WHERE manifest_id = $1 AND permanent_security_id = $2`,
    [manifestId, securityId],
  );
  if (!fr.length) throw new DeskError("NOT_FOUND", "no freeze to verify", 404);
  const freezeId = fr[0].freeze_id;
  const reject = (detail: string) => fail({ freezeId, manifestId, securityId, detail });

  const man = await sql.query<{
    manifest_hash: Buffer;
    rule_ast_hash: Buffer;
    evaluator_artifact_hash: Buffer;
    cost_model_hash: Buffer;
    rule_id: string;
    rule_version: string;
    session_date: string;
    canonical_content: unknown;
  }>(
    `SELECT manifest_hash, rule_ast_hash, evaluator_artifact_hash, cost_model_hash, rule_id, rule_version,
            session_date::text, canonical_content
     FROM manifest WHERE manifest_id = $1`,
    [manifestId],
  );
  if (!man.length) throw new DeskError("NOT_FOUND", "manifest missing", 404);

  const rebuiltManifest = manifestHash(man[0].canonical_content);
  if (rebuiltManifest !== asHex(man[0].manifest_hash)) {
    await reject("manifest content does not match the stored manifest hash");
  }

  const member = await sql.query<{ snapshot_hash: Buffer; event_key: string }>(
    `SELECT snapshot_hash, event_key FROM manifest_member WHERE manifest_id = $1 AND permanent_security_id = $2`,
    [manifestId, securityId],
  );
  if (!member.length) throw new DeskError("NOT_FOUND", "member not sealed", 404);

  const sealed = await sql.query<{ card: TypedCard; pin_count: number }>(
    `SELECT card, pin_count FROM sealed_input WHERE manifest_id = $1 AND permanent_security_id = $2`,
    [manifestId, securityId],
  );
  if (!sealed.length) throw new DeskError("NOT_FOUND", "sealed inputs missing", 404);

  const sealedPins = await sql.query<{ observation_id: string; observation_hash: Buffer; pin_index: number }>(
    `SELECT observation_id, observation_hash, pin_index FROM sealed_input_pin
     WHERE manifest_id = $1 AND permanent_security_id = $2 ORDER BY pin_index`,
    [manifestId, securityId],
  );
  const freezePins = await sql.query<{ observation_id: string; observation_hash: Buffer; pin_index: number }>(
    `SELECT observation_id, observation_hash, pin_index FROM freeze_pin WHERE freeze_id = $1 ORDER BY pin_index`,
    [freezeId],
  );
  if (sealedPins.length !== freezePins.length || sealedPins.length !== Number(fr[0].pin_count) || sealedPins.length !== Number(sealed[0].pin_count)) {
    await reject("pin count disagrees across freeze, sealed inputs, and pin rows");
  }
  for (let i = 0; i < sealedPins.length; i += 1) {
    const s = sealedPins[i];
    const f = freezePins[i];
    if (!f || s.observation_id !== f.observation_id || asHex(s.observation_hash) !== asHex(f.observation_hash) || s.pin_index !== f.pin_index || s.pin_index !== i) {
      await reject("pin membership or pin index disagrees with the sealed set");
    }
  }

  for (const pin of sealedPins) {
    const obs = await sql.query<{ observation_hash: Buffer; envelope: unknown; tombstoned: boolean }>(
      `SELECT observation_hash, envelope, tombstoned FROM observation WHERE observation_id = $1`,
      [pin.observation_id],
    );
    if (!obs.length) {
      await reject("pinned observation is missing");
    }
    if (obs[0].tombstoned) {
      await reject("pinned observation is tombstoned without a surviving attestation");
    }
    const recomputed = observationHash(obs[0].envelope);
    if (recomputed !== asHex(obs[0].observation_hash) || recomputed !== asHex(pin.observation_hash)) {
      await reject("observation content does not match the sealed pin hash");
    }
  }

  const pinList = sealedPins
    .map((p) => ({ id: p.observation_id, hash: asHex(p.observation_hash) }))
    .sort((a, b) => (a.id < b.id ? -1 : 1));
  const rebuiltSnap = snapshotHash({
    permanent_security_id: securityId,
    event_key: member[0].event_key,
    session_date: man[0].session_date,
    card: sealed[0].card,
    pins: pinList,
  });
  if (rebuiltSnap !== asHex(member[0].snapshot_hash)) {
    await reject("sealed card and pins do not match the stored snapshot hash");
  }

  const pinTuples: [string, string][] = sealedPins.map((p) => [p.observation_id, asHex(p.observation_hash)]);
  const inHash = inputHash({
    manifestId,
    securityId,
    manifestHash: rebuiltManifest,
    snapshotHash: rebuiltSnap,
    ruleHash: asHex(man[0].rule_ast_hash),
    engineHash: asHex(man[0].evaluator_artifact_hash),
    costHash: asHex(man[0].cost_model_hash),
    margin: MARGIN,
    pins: pinTuples,
  });
  if (inHash !== asHex(fr[0].input_hash)) {
    await reject("recomputed input hash does not match the freeze artifact");
  }

  const ruleRows = await sql.query<{ ast_content: unknown }>(
    `SELECT ast_content FROM rule_card WHERE rule_id = $1 AND rule_version = $2`,
    [man[0].rule_id, man[0].rule_version],
  );
  const ast = ruleRows[0]?.ast_content;
  if (ast == null) throw new DeskError("RULE_UNAVAILABLE", "sealed rule is missing", 503);
  if (ruleAstHash(ast) !== asHex(man[0].rule_ast_hash)) {
    throw new DeskError("RULE_MISMATCH", "loaded rule does not match the sealed digest", 503);
  }

  const card = sealed[0].card;
  const ev = evaluate(ast, evalCard(card));
  if (ev.status === "INVALID_RULE") {
    await reject("registered rule invalid");
  }
  const replayed = decisionPayload(ev, card);
  const persisted = fr[0].output_payload;
  let persistedHash: string;
  try {
    persistedHash = outputHash(inHash, persisted);
  } catch {
    await reject("stored output payload is not canonical");
  }
  if (persistedHash! !== asHex(fr[0].output_hash)) {
    await reject("stored output payload does not hash to the freeze output hash");
  }
  const replayedHash = outputHash(inHash, replayed);
  if (replayedHash !== asHex(fr[0].output_hash) || !sameCanon(persisted, replayed)) {
    await reject("replayed decision does not match the freeze artifact");
  }
  if (fr[0].decision !== ev.decision || (fr[0].direction ?? null) !== (ev.direction ?? null)) {
    await reject("stored decision fields do not match the replay");
  }

  const adm = await sql.query<{ outcome: string; position_id: string | null }>(
    `SELECT outcome, position_id FROM execution_admission WHERE freeze_id = $1`,
    [freezeId],
  );
  await recordOutcome({ freezeId, manifestId, securityId, result: "BYTE_VERIFIED", detail: "replay matched sealed contents" });
  return {
    freeze_id: freezeId,
    decision: ev.decision,
    direction: ev.direction ?? null,
    input_hash: inHash,
    output_hash: replayedHash,
    admission_outcome: adm[0]?.outcome ?? null,
    position_id: adm[0]?.position_id ?? null,
    duplicate: true,
    verification_level: "BYTE_VERIFIED",
  };
}
