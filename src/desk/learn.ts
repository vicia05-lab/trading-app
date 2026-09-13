import { getSql } from "@/lib/db";
import { INITIAL_AST, ruleAstHash, ruleTextHash } from "../kernel/index.ts";
import { appendEvent, withWriter } from "./writer";
import { hexBuf, jsonCanon, newId } from "./util";
import type { DeskRole } from "./util";
import {
  astFromThresholds,
  defaultThresholds,
  humanRuleText,
  humanRuleBullets,
  proposeThresholds,
  thresholdsFromAst,
  type Thresholds,
} from "./learn-policy";

export type { Thresholds } from "./learn-policy";
export {
  astFromThresholds,
  defaultThresholds,
  humanRuleBullets,
  humanRuleText,
  proposeThresholds,
  thresholdsFromAst,
} from "./learn-policy";

export type RuleRevisionRow = {
  revision_id: string;
  parent_rule_version: string;
  new_rule_version: string | null;
  vintage_manifest_id: string | null;
  evidence_n: number;
  direction_hits: number;
  adopted: boolean;
  reason_human: string;
  implied_move_gte: string;
  implied_move_lte: string;
  rel5_lt: string;
  rel63_gt: string;
  created_at: string;
};

export async function ensureLearnTables(): Promise<void> {
  const sql = await getSql();
  await sql.query(`
    CREATE TABLE IF NOT EXISTS rule_revision (
      revision_id text PRIMARY KEY,
      parent_rule_id text NOT NULL,
      parent_rule_version text NOT NULL,
      new_rule_version text,
      vintage_manifest_id text,
      evidence_n int NOT NULL,
      direction_hits int NOT NULL,
      direction_misses int NOT NULL,
      band_hits int NOT NULL,
      implied_move_gte text NOT NULL,
      implied_move_lte text NOT NULL,
      rel5_lt text NOT NULL,
      rel63_gt text NOT NULL,
      adopted boolean NOT NULL,
      reason_human text NOT NULL,
      ast_hash text,
      created_at timestamptz NOT NULL DEFAULT NOW(),
      created_event_seq bigint
    )`);
  await sql.query(`INSERT INTO job_state (job_name, status) VALUES ('learn-revise', 'IDLE') ON CONFLICT DO NOTHING`);
}

export async function loadActiveAst(): Promise<unknown> {
  await ensureLearnTables();
  const sql = await getSql();
  const rows = await sql.query<{ ast_content: unknown }>(
    `SELECT r.ast_content
     FROM evaluation_window w
     JOIN rule_card r ON r.rule_id = w.rule_id AND r.rule_version = w.rule_version
     WHERE w.ended_early_at IS NULL
     ORDER BY w.starts_at DESC
     LIMIT 1`,
  );
  return rows[0]?.ast_content ?? INITIAL_AST;
}

export async function loadActiveThresholds(): Promise<Thresholds> {
  try {
    return thresholdsFromAst(await loadActiveAst());
  } catch {
    return defaultThresholds();
  }
}

export async function astForManifest(manifestId: string): Promise<unknown> {
  const sql = await getSql();
  const rows = await sql.query<{ ast_content: unknown }>(
    `SELECT r.ast_content
     FROM manifest m
     JOIN rule_card r ON r.rule_id = m.rule_id AND r.rule_version = m.rule_version
     WHERE m.manifest_id = $1`,
    [manifestId],
  );
  return rows[0]?.ast_content ?? INITIAL_AST;
}

export async function maybeReviseRule(manifestId: string, actor: string): Promise<RuleRevisionRow | null> {
  await ensureLearnTables();
  const sql = await getSql();
  const existing = await sql.query<RuleRevisionRow>(
    `SELECT revision_id, parent_rule_version, new_rule_version, vintage_manifest_id, evidence_n, direction_hits,
            adopted, reason_human, implied_move_gte, implied_move_lte, rel5_lt, rel63_gt, created_at::text
     FROM rule_revision WHERE vintage_manifest_id = $1`,
    [manifestId],
  );
  if (existing.length) return existing[0];

  const man = await sql.query<{ rule_id: string; rule_version: string; window_id: string }>(
    `SELECT rule_id, rule_version, window_id FROM manifest WHERE manifest_id = $1`,
    [manifestId],
  );
  if (!man.length) return null;

  const grades = await sql.query<{
    direction_hit: boolean | null;
    band_hit: boolean | null;
  }>(
    `SELECT (g.values->>'direction_hit')::boolean AS direction_hit,
            (g.values->>'band_hit')::boolean AS band_hit
     FROM grade g
     JOIN "freeze" f ON f.freeze_id = g.freeze_id
     JOIN manifest m ON m.manifest_id = g.manifest_id
     WHERE g.vintage = 0 AND g.in_evidence_set = TRUE AND g.outcome = 'GRADED'
       AND f.decision = 'PREDICT'
       AND m.rule_id = $1 AND m.rule_version = $2`,
    [man[0].rule_id, man[0].rule_version],
  );
  const n = grades.length;
  const hits = grades.filter((g) => g.direction_hit === true).length;
  const misses = grades.filter((g) => g.direction_hit === false).length;
  const bandHits = grades.filter((g) => g.band_hit === true).length;

  const card = await sql.query<{ ast_content: unknown }>(
    `SELECT ast_content FROM rule_card WHERE rule_id = $1 AND rule_version = $2`,
    [man[0].rule_id, man[0].rule_version],
  );
  const current = thresholdsFromAst(card[0]?.ast_content ?? INITIAL_AST);
  const proposal = proposeThresholds(current, n, hits);

  await sql.query(`UPDATE job_state SET status = 'RUNNING', last_started_at = NOW(), safe_error_code = NULL WHERE job_name = 'learn-revise'`);

  if (!proposal.adopted) {
    const revisionId = newId("rev");
    await sql.query(
      `INSERT INTO rule_revision (
        revision_id, parent_rule_id, parent_rule_version, new_rule_version, vintage_manifest_id,
        evidence_n, direction_hits, direction_misses, band_hits,
        implied_move_gte, implied_move_lte, rel5_lt, rel63_gt,
        adopted, reason_human
      ) VALUES ($1,$2,$3,NULL,$4,$5,$6,$7,$8,$9,$10,$11,$12,FALSE,$13)`,
      [
        revisionId,
        man[0].rule_id,
        man[0].rule_version,
        manifestId,
        n,
        hits,
        misses,
        bandHits,
        proposal.next.implied_move_gte,
        proposal.next.implied_move_lte,
        proposal.next.rel5_lt,
        proposal.next.rel63_gt,
        proposal.reason,
      ],
    );
    await sql.query(
      `UPDATE job_state SET status = 'IDLE', last_completed_at = NOW() WHERE job_name = 'learn-revise'`,
    );
    return {
      revision_id: revisionId,
      parent_rule_version: man[0].rule_version,
      new_rule_version: null,
      vintage_manifest_id: manifestId,
      evidence_n: n,
      direction_hits: hits,
      adopted: false,
      reason_human: proposal.reason,
      implied_move_gte: proposal.next.implied_move_gte,
      implied_move_lte: proposal.next.implied_move_lte,
      rel5_lt: proposal.next.rel5_lt,
      rel63_gt: proposal.next.rel63_gt,
      created_at: new Date().toISOString(),
    };
  }

  const versions = await sql.query<{ rule_version: string }>(
    `SELECT rule_version FROM rule_card WHERE rule_id = $1`,
    [man[0].rule_id],
  );
  const nextN = versions.length + 1;
  const newVersion = `v${nextN}`;
  const ast = astFromThresholds(proposal.next);
  const astHash = ruleAstHash(ast);
  const text = humanRuleText(proposal.next);
  const windowId = newId("win");

  return withWriter(actor, async (ctx) => {
    const { eventSeq } = await appendEvent(ctx, {
      commandId: newId("cmd"),
      type: "REGISTER_RULE",
      payload: {
        parent_rule_version: man[0].rule_version,
        new_rule_version: newVersion,
        vintage_manifest_id: manifestId,
        evidence_n: String(n),
        direction_hits: String(hits),
      },
      receipt: { rule_version: newVersion, adopted: true },
    });
    await ctx.sql.query(
      `INSERT INTO rule_card (
        rule_id, rule_version, rule_text, rule_text_hash, ast_content, canonical_ast, ast_hash, evaluator_id, policy_id,
        expected_predict_rate_min, expected_predict_rate_max, magnitude_definition, registered_event_seq
      ) VALUES ($1,$2,$3,$4,$5::jsonb,$6,$7,'eval-v1','pol-v1',0.10,0.25,$8::jsonb,$9)`,
      [
        man[0].rule_id,
        newVersion,
        text,
        hexBuf(ruleTextHash(text)),
        JSON.stringify(ast),
        jsonCanon(ast),
        hexBuf(astHash),
        JSON.stringify({ low: "0.5*implied_move", high: "2.0*implied_move" }),
        eventSeq,
      ],
    );
    await ctx.sql.query(
      `UPDATE evaluation_window SET ended_early_at = $1, early_end_event_seq = $2, early_end_reason = 'SUPERSEDED_BY_LEARNED_RULE'
       WHERE window_id = $3 AND ended_early_at IS NULL`,
      [ctx.now.toISOString(), eventSeq, man[0].window_id],
    );
    const oldWin = await ctx.sql.query<{ ends_at: string }>(`SELECT ends_at::text FROM evaluation_window WHERE window_id = $1`, [
      man[0].window_id,
    ]);
    const endsAt = oldWin[0]?.ends_at ?? new Date(ctx.now.getTime() + 90 * 24 * 3600 * 1000).toISOString();
    await ctx.sql.query(
      `INSERT INTO evaluation_window (
        window_id, starts_at, ends_at, rule_id, rule_version, policy_id, cost_model_id, evaluator_id, universe_version,
        hypothesis_claim, prior_contaminated, contamination_source, release_event_seq
      ) VALUES (
        $1, $2, $3, $4, $5, 'pol-v1', 'cost-v1', 'eval-v1', 'uni-fix-1',
        $6, TRUE, 'PRIOR_RULE_LABELS', $7
      )`,
      [windowId, ctx.now.toISOString(), endsAt, man[0].rule_id, newVersion, proposal.reason, eventSeq],
    );
    const revisionId = newId("rev");
    await ctx.sql.query(
      `INSERT INTO rule_revision (
        revision_id, parent_rule_id, parent_rule_version, new_rule_version, vintage_manifest_id,
        evidence_n, direction_hits, direction_misses, band_hits,
        implied_move_gte, implied_move_lte, rel5_lt, rel63_gt,
        adopted, reason_human, ast_hash, created_event_seq
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,TRUE,$14,$15,$16)`,
      [
        revisionId,
        man[0].rule_id,
        man[0].rule_version,
        newVersion,
        manifestId,
        n,
        hits,
        misses,
        bandHits,
        proposal.next.implied_move_gte,
        proposal.next.implied_move_lte,
        proposal.next.rel5_lt,
        proposal.next.rel63_gt,
        proposal.reason,
        astHash,
        eventSeq,
      ],
    );
    await ctx.sql.query(
      `UPDATE job_state SET status = 'IDLE', last_completed_at = NOW(), safe_error_code = NULL WHERE job_name = 'learn-revise'`,
    );
    return {
      revision_id: revisionId,
      parent_rule_version: man[0].rule_version,
      new_rule_version: newVersion,
      vintage_manifest_id: manifestId,
      evidence_n: n,
      direction_hits: hits,
      adopted: true,
      reason_human: proposal.reason,
      implied_move_gte: proposal.next.implied_move_gte,
      implied_move_lte: proposal.next.implied_move_lte,
      rel5_lt: proposal.next.rel5_lt,
      rel63_gt: proposal.next.rel63_gt,
      created_at: ctx.now.toISOString(),
    };
  });
}

export async function reviseClosedManifests(actor: string): Promise<number> {
  await ensureLearnTables();
  const sql = await getSql();
  const rows = await sql.query<{ manifest_id: string }>(
    `SELECT m.manifest_id FROM manifest m
     JOIN report_snapshot rs ON rs.manifest_id = m.manifest_id
     WHERE NOT EXISTS (SELECT 1 FROM rule_revision r WHERE r.vintage_manifest_id = m.manifest_id)
     ORDER BY m.session_date`,
  );
  let n = 0;
  for (const row of rows) {
    try {
      await maybeReviseRule(row.manifest_id, actor);
      n += 1;
    } catch {
      /* observational; freeze path must not fail */
    }
  }
  return n;
}

export async function learningSummary(role: DeskRole): Promise<{
  rule_version: string;
  bullets: string[];
  last: {
    adopted: boolean;
    reason: string;
    evidence_n: number | null;
    direction_hits: number | null;
    created_at: string;
  } | null;
  history: Array<{
    adopted: boolean;
    reason: string;
    rule_version: string | null;
    created_at: string;
    evidence_n: number | null;
    direction_hits: number | null;
  }>;
}> {
  await ensureLearnTables();
  const sql = await getSql();
  const win = await sql.query<{ rule_version: string; ast_content: unknown }>(
    `SELECT w.rule_version, r.ast_content
     FROM evaluation_window w
     JOIN rule_card r ON r.rule_id = w.rule_id AND r.rule_version = w.rule_version
     WHERE w.ended_early_at IS NULL
     ORDER BY w.starts_at DESC LIMIT 1`,
  );
  const t = thresholdsFromAst(win[0]?.ast_content ?? INITIAL_AST);
  const hist = await sql.query<RuleRevisionRow>(
    `SELECT revision_id, parent_rule_version, new_rule_version, vintage_manifest_id, evidence_n, direction_hits,
            adopted, reason_human, implied_move_gte, implied_move_lte, rel5_lt, rel63_gt, created_at::text
     FROM rule_revision ORDER BY created_at DESC LIMIT 8`,
  );
  const operator = role === "OPERATOR";
  const hide = (row: RuleRevisionRow) =>
    operator
      ? {
          adopted: row.adopted,
          reason: row.adopted
            ? "The next lock will use an updated checklist. Recorded decisions are unchanged."
            : "The checklist was reviewed. No change this round.",
          evidence_n: null,
          direction_hits: null,
          created_at: row.created_at,
          rule_version: row.new_rule_version,
        }
      : {
          adopted: row.adopted,
          reason: row.reason_human,
          evidence_n: row.evidence_n,
          direction_hits: row.direction_hits,
          created_at: row.created_at,
          rule_version: row.new_rule_version,
        };
  const last = hist[0] ? hide(hist[0]) : null;
  return {
    rule_version: win[0]?.rule_version ?? "v1",
    bullets: humanRuleBullets(t),
    last,
    history: hist.map(hide),
  };
}
