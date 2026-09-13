-- Observational learning ledger. Adopted revisions also insert an immutable rule_card + evaluation_window.
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
);
INSERT INTO job_state (job_name, status) VALUES ('learn-revise', 'IDLE') ON CONFLICT DO NOTHING;
