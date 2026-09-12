-- Trading App v1.2 relational contract (executable).
-- Hashes persist as 32-byte BYTEA; APIs expose lowercase hex.

CREATE OR REPLACE FUNCTION ta_reject_immutable() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'IMMUTABLE_TABLE:%', TG_TABLE_NAME;
END;
$$;

CREATE OR REPLACE FUNCTION ta_id_ok(t text) RETURNS boolean
LANGUAGE sql IMMUTABLE AS $$
  SELECT t ~ '^[A-Za-z0-9][A-Za-z0-9:._-]{0,63}$';
$$;

CREATE TABLE IF NOT EXISTS writer_gate (
  singleton_key boolean PRIMARY KEY CHECK (singleton_key),
  next_event_seq bigint NOT NULL CHECK (next_event_seq > 0),
  last_authoritative_time timestamptz NOT NULL,
  clock_trusted boolean NOT NULL
);

CREATE TABLE IF NOT EXISTS fixture_clock (
  singleton_key boolean PRIMARY KEY CHECK (singleton_key),
  now_utc timestamptz NOT NULL,
  trusted boolean NOT NULL,
  source text NOT NULL CHECK (source IN ('DATABASE', 'FIXTURE'))
);

CREATE TABLE IF NOT EXISTS event_log (
  event_seq bigint PRIMARY KEY CHECK (event_seq > 0),
  event_id text NOT NULL UNIQUE CHECK (ta_id_ok(event_id)),
  command_id text NOT NULL UNIQUE CHECK (ta_id_ok(command_id)),
  request_hash bytea NOT NULL CHECK (octet_length(request_hash) = 32),
  event_type text NOT NULL,
  actor_principal_id text NOT NULL CHECK (ta_id_ok(actor_principal_id)),
  occurred_at timestamptz NOT NULL,
  semantic_payload jsonb NOT NULL,
  canonical_payload text NOT NULL,
  result_receipt jsonb NOT NULL,
  event_hash bytea NOT NULL CHECK (octet_length(event_hash) = 32)
);
DROP TRIGGER IF EXISTS event_log_immutable ON event_log;
CREATE TRIGGER event_log_immutable BEFORE UPDATE OR DELETE ON event_log
  FOR EACH ROW EXECUTE FUNCTION ta_reject_immutable();

CREATE TABLE IF NOT EXISTS desk_risk_state (
  sleeve text PRIMARY KEY CHECK (sleeve = 'EARNINGS'),
  reserved_count integer NOT NULL CHECK (reserved_count >= 0 AND reserved_count <= 3),
  reserved_notional numeric(16,4) NOT NULL CHECK (reserved_notional >= 0 AND reserved_notional <= 15000),
  updated_event_seq bigint NOT NULL REFERENCES event_log(event_seq)
);

CREATE TABLE IF NOT EXISTS app_keyring (
  key_id text PRIMARY KEY CHECK (ta_id_ok(key_id)),
  purpose text NOT NULL,
  key_bytes bytea NOT NULL,
  created_at timestamptz NOT NULL
);

CREATE TABLE IF NOT EXISTS policy_bundle (
  policy_id text PRIMARY KEY CHECK (ta_id_ok(policy_id)),
  policy_version text NOT NULL CHECK (ta_id_ok(policy_version)),
  policy_content jsonb NOT NULL,
  canonical_content text NOT NULL,
  policy_hash bytea NOT NULL UNIQUE CHECK (octet_length(policy_hash) = 32),
  registered_event_seq bigint NOT NULL REFERENCES event_log(event_seq)
);
DROP TRIGGER IF EXISTS policy_bundle_immutable ON policy_bundle;
CREATE TRIGGER policy_bundle_immutable BEFORE UPDATE OR DELETE ON policy_bundle
  FOR EACH ROW EXECUTE FUNCTION ta_reject_immutable();

CREATE TABLE IF NOT EXISTS cost_model (
  cost_model_id text PRIMARY KEY CHECK (ta_id_ok(cost_model_id)),
  version text NOT NULL,
  basis text NOT NULL CHECK (basis = 'CONSERVATIVE_STRESS_HAIRCUT'),
  constant_penalty numeric(12,6) NOT NULL CHECK (constant_penalty > 0 AND constant_penalty <= 0.05),
  imbalance_coefficient numeric(12,6) NOT NULL CHECK (imbalance_coefficient = 0),
  imbalance_term numeric(12,6) NOT NULL CHECK (imbalance_term = 0),
  commission_per_fill numeric(12,4) NOT NULL CHECK (commission_per_fill >= 0 AND commission_per_fill <= 100),
  canonical_content text NOT NULL,
  content_hash bytea NOT NULL UNIQUE CHECK (octet_length(content_hash) = 32),
  registered_event_seq bigint NOT NULL REFERENCES event_log(event_seq)
);
DROP TRIGGER IF EXISTS cost_model_immutable ON cost_model;
CREATE TRIGGER cost_model_immutable BEFORE UPDATE OR DELETE ON cost_model
  FOR EACH ROW EXECUTE FUNCTION ta_reject_immutable();

CREATE TABLE IF NOT EXISTS evaluator_artifact (
  evaluator_id text PRIMARY KEY CHECK (ta_id_ok(evaluator_id)),
  engine_version text NOT NULL,
  artifact_manifest jsonb NOT NULL,
  canonical_content text NOT NULL,
  artifact_hash bytea NOT NULL UNIQUE CHECK (octet_length(artifact_hash) = 32),
  supported_ast_schema text NOT NULL,
  registered_event_seq bigint NOT NULL REFERENCES event_log(event_seq)
);
DROP TRIGGER IF EXISTS evaluator_artifact_immutable ON evaluator_artifact;
CREATE TRIGGER evaluator_artifact_immutable BEFORE UPDATE OR DELETE ON evaluator_artifact
  FOR EACH ROW EXECUTE FUNCTION ta_reject_immutable();

CREATE TABLE IF NOT EXISTS rule_card (
  rule_id text NOT NULL CHECK (ta_id_ok(rule_id)),
  rule_version text NOT NULL CHECK (ta_id_ok(rule_version)),
  rule_text text NOT NULL,
  rule_text_hash bytea NOT NULL CHECK (octet_length(rule_text_hash) = 32),
  ast_content jsonb NOT NULL,
  canonical_ast text NOT NULL,
  ast_hash bytea NOT NULL CHECK (octet_length(ast_hash) = 32),
  evaluator_id text NOT NULL REFERENCES evaluator_artifact(evaluator_id),
  policy_id text NOT NULL REFERENCES policy_bundle(policy_id),
  expected_predict_rate_min numeric(16,12) NOT NULL CHECK (expected_predict_rate_min >= 0),
  expected_predict_rate_max numeric(16,12) NOT NULL CHECK (expected_predict_rate_max <= 1 AND expected_predict_rate_max >= expected_predict_rate_min),
  magnitude_definition jsonb NOT NULL,
  registered_event_seq bigint NOT NULL REFERENCES event_log(event_seq),
  PRIMARY KEY (rule_id, rule_version)
);
DROP TRIGGER IF EXISTS rule_card_immutable ON rule_card;
CREATE TRIGGER rule_card_immutable BEFORE UPDATE OR DELETE ON rule_card
  FOR EACH ROW EXECUTE FUNCTION ta_reject_immutable();

CREATE TABLE IF NOT EXISTS security (
  permanent_security_id text PRIMARY KEY CHECK (ta_id_ok(permanent_security_id)),
  instrument_type text NOT NULL CHECK (instrument_type IN ('US_COMMON', 'REFERENCE_ETF')),
  currency text NOT NULL CHECK (currency = 'USD'),
  display_name text NOT NULL
);
DROP TRIGGER IF EXISTS security_immutable ON security;
CREATE TRIGGER security_immutable BEFORE UPDATE OR DELETE ON security
  FOR EACH ROW EXECUTE FUNCTION ta_reject_immutable();

CREATE TABLE IF NOT EXISTS universe_version (
  universe_version text PRIMARY KEY CHECK (ta_id_ok(universe_version)),
  effective_from date NOT NULL,
  content_hash bytea NOT NULL UNIQUE CHECK (octet_length(content_hash) = 32),
  registered_event_seq bigint NOT NULL REFERENCES event_log(event_seq),
  data_mode text NOT NULL CHECK (data_mode IN ('FIXTURE', 'REAL_DATA_READ_ONLY'))
);
DROP TRIGGER IF EXISTS universe_version_immutable ON universe_version;
CREATE TRIGGER universe_version_immutable BEFORE UPDATE OR DELETE ON universe_version
  FOR EACH ROW EXECUTE FUNCTION ta_reject_immutable();

CREATE TABLE IF NOT EXISTS universe_member (
  universe_version text NOT NULL REFERENCES universe_version(universe_version),
  permanent_security_id text NOT NULL REFERENCES security(permanent_security_id),
  included boolean NOT NULL,
  exclusion_reason text,
  listing_exchange text CHECK (listing_exchange IN ('XNYS', 'XNAS')),
  liquidity_snapshot jsonb,
  sector text,
  market_cap_bucket text,
  PRIMARY KEY (universe_version, permanent_security_id)
);
DROP TRIGGER IF EXISTS universe_member_immutable ON universe_member;
CREATE TRIGGER universe_member_immutable BEFORE UPDATE OR DELETE ON universe_member
  FOR EACH ROW EXECUTE FUNCTION ta_reject_immutable();

CREATE TABLE IF NOT EXISTS evaluation_window (
  window_id text PRIMARY KEY CHECK (ta_id_ok(window_id)),
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL CHECK (ends_at > starts_at),
  rule_id text NOT NULL,
  rule_version text NOT NULL,
  policy_id text NOT NULL REFERENCES policy_bundle(policy_id),
  cost_model_id text NOT NULL REFERENCES cost_model(cost_model_id),
  evaluator_id text NOT NULL REFERENCES evaluator_artifact(evaluator_id),
  universe_version text NOT NULL REFERENCES universe_version(universe_version),
  hypothesis_claim text NOT NULL,
  prior_contaminated boolean NOT NULL,
  contamination_source text NOT NULL CHECK (contamination_source IN ('PRIOR_OBSERVATION', 'PRIOR_RULE_LABELS', 'NONE')),
  release_event_seq bigint REFERENCES event_log(event_seq),
  release_snapshot_id text,
  ended_early_at timestamptz,
  early_end_event_seq bigint,
  early_end_reason text,
  FOREIGN KEY (rule_id, rule_version) REFERENCES rule_card(rule_id, rule_version)
);

CREATE TABLE IF NOT EXISTS security_ticker (
  mapping_id text PRIMARY KEY CHECK (ta_id_ok(mapping_id)),
  permanent_security_id text NOT NULL REFERENCES security(permanent_security_id),
  provider_id text NOT NULL CHECK (ta_id_ok(provider_id)),
  ticker text NOT NULL,
  valid_from timestamptz NOT NULL,
  valid_to timestamptz,
  registered_event_seq bigint NOT NULL REFERENCES event_log(event_seq),
  CHECK (valid_to IS NULL OR valid_to > valid_from)
);
DROP TRIGGER IF EXISTS security_ticker_immutable ON security_ticker;
CREATE TRIGGER security_ticker_immutable BEFORE UPDATE OR DELETE ON security_ticker
  FOR EACH ROW EXECUTE FUNCTION ta_reject_immutable();

CREATE TABLE IF NOT EXISTS calendar_session (
  calendar_version text NOT NULL CHECK (ta_id_ok(calendar_version)),
  listing_exchange text NOT NULL CHECK (listing_exchange IN ('XNYS', 'XNAS')),
  session_date date NOT NULL,
  is_open boolean NOT NULL,
  open_at timestamptz,
  close_at timestamptz,
  moc_entry_cutoff_at timestamptz,
  effective_rule_id text,
  source_reference text,
  verified_at timestamptz NOT NULL,
  content_hash bytea NOT NULL CHECK (octet_length(content_hash) = 32),
  PRIMARY KEY (calendar_version, listing_exchange, session_date),
  CHECK (
    (is_open AND open_at IS NOT NULL AND close_at IS NOT NULL AND moc_entry_cutoff_at IS NOT NULL AND open_at < close_at)
    OR (NOT is_open AND open_at IS NULL AND close_at IS NULL AND moc_entry_cutoff_at IS NULL)
  )
);
DROP TRIGGER IF EXISTS calendar_session_immutable ON calendar_session;
CREATE TRIGGER calendar_session_immutable BEFORE UPDATE OR DELETE ON calendar_session
  FOR EACH ROW EXECUTE FUNCTION ta_reject_immutable();

CREATE TABLE IF NOT EXISTS observation (
  observation_id text PRIMARY KEY CHECK (ta_id_ok(observation_id)),
  event_seq bigint NOT NULL REFERENCES event_log(event_seq),
  permanent_security_id text NOT NULL REFERENCES security(permanent_security_id),
  event_key text,
  session_date date NOT NULL,
  snapshot_type text NOT NULL,
  provider_id text NOT NULL,
  provider_record_id text NOT NULL,
  provider_revision text NOT NULL,
  vendor_as_of timestamptz,
  source_event_at timestamptz,
  received_at timestamptz NOT NULL,
  source_class text NOT NULL CHECK (source_class IN ('AUTHORITATIVE', 'REFERENCE', 'RESEARCH_ONLY', 'ESTIMATED', 'MISSING')),
  adjustment_basis text NOT NULL CHECK (adjustment_basis IN ('UNADJUSTED', 'PIT_TOTAL_RETURN', 'NOT_PRICE')),
  payload_schema_id text NOT NULL,
  payload_hash bytea NOT NULL CHECK (octet_length(payload_hash) = 32),
  observation_hash bytea NOT NULL UNIQUE CHECK (octet_length(observation_hash) = 32),
  envelope jsonb NOT NULL,
  payload_protected bytea,
  payload_nonce bytea,
  payload_key_id text,
  is_partial boolean NOT NULL,
  capture_error_code text,
  supersedes_observation_id text REFERENCES observation(observation_id),
  partition text NOT NULL CHECK (partition IN ('RESEARCH', 'HOLDOUT')),
  scheduled_erasure_at timestamptz,
  tombstoned boolean NOT NULL DEFAULT false,
  tombstone_reason text
);
CREATE INDEX IF NOT EXISTS observation_sec_type_idx ON observation (permanent_security_id, snapshot_type, session_date);

CREATE TABLE IF NOT EXISTS earnings_event (
  event_observation_id text PRIMARY KEY CHECK (ta_id_ok(event_observation_id)),
  event_key text NOT NULL CHECK (ta_id_ok(event_key)),
  permanent_security_id text NOT NULL REFERENCES security(permanent_security_id),
  intended_session date NOT NULL,
  timing text NOT NULL CHECK (timing IN ('AMC', 'BMO', 'INTRADAY', 'UNKNOWN')),
  quality text NOT NULL CHECK (quality IN ('ISSUER_CONFIRMED', 'ESTIMATED')),
  source_observation_id text NOT NULL REFERENCES observation(observation_id),
  supersedes_id text
);
DROP TRIGGER IF EXISTS earnings_event_immutable ON earnings_event;
CREATE TRIGGER earnings_event_immutable BEFORE UPDATE OR DELETE ON earnings_event
  FOR EACH ROW EXECUTE FUNCTION ta_reject_immutable();

CREATE TABLE IF NOT EXISTS candidate_eligibility (
  eligibility_id text PRIMARY KEY CHECK (ta_id_ok(eligibility_id)),
  session_date date NOT NULL,
  window_id text NOT NULL REFERENCES evaluation_window(window_id),
  permanent_security_id text NOT NULL REFERENCES security(permanent_security_id),
  event_key text,
  status text NOT NULL CHECK (status IN ('INCLUDED', 'EXCLUDED', 'UNRESOLVED')),
  reason_codes jsonb NOT NULL,
  evidence_ids jsonb NOT NULL,
  event_seq bigint NOT NULL REFERENCES event_log(event_seq),
  manifest_id text
);
DROP TRIGGER IF EXISTS candidate_eligibility_immutable ON candidate_eligibility;
CREATE TRIGGER candidate_eligibility_immutable BEFORE UPDATE OR DELETE ON candidate_eligibility
  FOR EACH ROW EXECUTE FUNCTION ta_reject_immutable();

CREATE TABLE IF NOT EXISTS manifest (
  manifest_id text PRIMARY KEY CHECK (ta_id_ok(manifest_id)),
  window_id text NOT NULL REFERENCES evaluation_window(window_id),
  session_date date NOT NULL,
  next_session_date date NOT NULL,
  second_next_session_date date NOT NULL,
  sleeve text NOT NULL CHECK (sleeve = 'EARNINGS'),
  universe_version text NOT NULL REFERENCES universe_version(universe_version),
  policy_id text NOT NULL REFERENCES policy_bundle(policy_id),
  rule_id text NOT NULL,
  rule_version text NOT NULL,
  evaluator_id text NOT NULL REFERENCES evaluator_artifact(evaluator_id),
  cost_model_id text NOT NULL REFERENCES cost_model(cost_model_id),
  policy_hash bytea NOT NULL,
  rule_ast_hash bytea NOT NULL,
  evaluator_artifact_hash bytea NOT NULL,
  cost_model_hash bytea NOT NULL,
  calendar_refs jsonb NOT NULL,
  seal_at timestamptz NOT NULL,
  freeze_cutoff_at timestamptz NOT NULL,
  mark_wait_at timestamptz NOT NULL,
  report_finalize_at timestamptz NOT NULL,
  sealed_at timestamptz NOT NULL,
  seed bytea NOT NULL CHECK (octet_length(seed) = 32),
  sealed_member_count integer NOT NULL CHECK (sealed_member_count >= 0 AND sealed_member_count <= 100),
  canonical_content text NOT NULL,
  manifest_hash bytea NOT NULL UNIQUE CHECK (octet_length(manifest_hash) = 32),
  seal_event_seq bigint NOT NULL REFERENCES event_log(event_seq),
  freeze_resolution text NOT NULL CHECK (freeze_resolution IN ('OPEN', 'FULL', 'PARTIAL', 'ABANDONED', 'EMPTY')),
  admission_closed_event_seq bigint,
  research_closed_event_seq bigint,
  UNIQUE (window_id, session_date, sleeve),
  FOREIGN KEY (rule_id, rule_version) REFERENCES rule_card(rule_id, rule_version)
);

CREATE TABLE IF NOT EXISTS manifest_member (
  manifest_id text NOT NULL REFERENCES manifest(manifest_id),
  permanent_security_id text NOT NULL REFERENCES security(permanent_security_id),
  event_key text NOT NULL,
  sealed_event_session date NOT NULL,
  timing text NOT NULL CHECK (timing = 'AMC'),
  timing_quality text NOT NULL CHECK (timing_quality IN ('ISSUER_CONFIRMED', 'ESTIMATED')),
  shuffle_order_index integer NOT NULL CHECK (shuffle_order_index >= 0),
  snapshot_hash bytea NOT NULL CHECK (octet_length(snapshot_hash) = 32),
  display_ticker text NOT NULL,
  PRIMARY KEY (manifest_id, permanent_security_id),
  UNIQUE (manifest_id, shuffle_order_index)
);
DROP TRIGGER IF EXISTS manifest_member_immutable ON manifest_member;
CREATE TRIGGER manifest_member_immutable BEFORE UPDATE OR DELETE ON manifest_member
  FOR EACH ROW EXECUTE FUNCTION ta_reject_immutable();

CREATE TABLE IF NOT EXISTS sealed_input (
  manifest_id text NOT NULL,
  permanent_security_id text NOT NULL,
  snapshot_schema text NOT NULL,
  snapshot_hash bytea NOT NULL CHECK (octet_length(snapshot_hash) = 32),
  card jsonb NOT NULL,
  bindings jsonb NOT NULL,
  pin_count integer NOT NULL CHECK (pin_count >= 0),
  card_complete boolean NOT NULL,
  options_valid boolean,
  coverage_summary jsonb NOT NULL,
  retention_exclusion boolean NOT NULL DEFAULT false,
  PRIMARY KEY (manifest_id, permanent_security_id),
  FOREIGN KEY (manifest_id, permanent_security_id) REFERENCES manifest_member(manifest_id, permanent_security_id)
);
DROP TRIGGER IF EXISTS sealed_input_immutable ON sealed_input;
CREATE TRIGGER sealed_input_immutable BEFORE UPDATE OR DELETE ON sealed_input
  FOR EACH ROW EXECUTE FUNCTION ta_reject_immutable();

CREATE TABLE IF NOT EXISTS sealed_input_pin (
  manifest_id text NOT NULL,
  permanent_security_id text NOT NULL,
  observation_id text NOT NULL REFERENCES observation(observation_id),
  observation_hash bytea NOT NULL CHECK (octet_length(observation_hash) = 32),
  pin_index integer NOT NULL CHECK (pin_index >= 0),
  PRIMARY KEY (manifest_id, permanent_security_id, observation_id),
  UNIQUE (manifest_id, permanent_security_id, pin_index),
  FOREIGN KEY (manifest_id, permanent_security_id) REFERENCES sealed_input(manifest_id, permanent_security_id)
);
DROP TRIGGER IF EXISTS sealed_input_pin_immutable ON sealed_input_pin;
CREATE TRIGGER sealed_input_pin_immutable BEFORE UPDATE OR DELETE ON sealed_input_pin
  FOR EACH ROW EXECUTE FUNCTION ta_reject_immutable();

CREATE TABLE IF NOT EXISTS "freeze" (
  freeze_id text PRIMARY KEY CHECK (ta_id_ok(freeze_id)),
  manifest_id text NOT NULL,
  permanent_security_id text NOT NULL,
  snapshot_hash bytea NOT NULL,
  input_hash bytea NOT NULL CHECK (octet_length(input_hash) = 32),
  output_hash bytea NOT NULL CHECK (octet_length(output_hash) = 32),
  decision text NOT NULL CHECK (decision IN ('STAND_DOWN', 'PREDICT')),
  direction text,
  card_complete boolean NOT NULL,
  options_valid boolean,
  output_payload jsonb NOT NULL,
  pin_count integer NOT NULL CHECK (pin_count >= 0),
  freeze_order_index integer NOT NULL CHECK (freeze_order_index >= 0),
  admission_checked_at timestamptz NOT NULL,
  event_seq bigint NOT NULL REFERENCES event_log(event_seq),
  verification_level text NOT NULL CHECK (verification_level IN ('BYTE_VERIFIED', 'ATTESTED', 'HASH_ONLY', 'UNVERIFIABLE')),
  UNIQUE (manifest_id, permanent_security_id),
  UNIQUE (manifest_id, freeze_order_index),
  UNIQUE (freeze_id, manifest_id, permanent_security_id),
  FOREIGN KEY (manifest_id, permanent_security_id) REFERENCES manifest_member(manifest_id, permanent_security_id),
  CHECK (
    (decision = 'STAND_DOWN' AND direction IS NULL)
    OR (decision = 'PREDICT' AND direction = 'LONG' AND card_complete IS TRUE)
  )
);
DROP TRIGGER IF EXISTS freeze_immutable ON "freeze";
CREATE TRIGGER freeze_immutable BEFORE UPDATE OR DELETE ON "freeze"
  FOR EACH ROW EXECUTE FUNCTION ta_reject_immutable();

CREATE TABLE IF NOT EXISTS freeze_pin (
  freeze_id text NOT NULL REFERENCES "freeze"(freeze_id),
  observation_id text NOT NULL REFERENCES observation(observation_id),
  observation_hash bytea NOT NULL,
  pin_index integer NOT NULL CHECK (pin_index >= 0),
  PRIMARY KEY (freeze_id, observation_id),
  UNIQUE (freeze_id, pin_index)
);
DROP TRIGGER IF EXISTS freeze_pin_immutable ON freeze_pin;
CREATE TRIGGER freeze_pin_immutable BEFORE UPDATE OR DELETE ON freeze_pin
  FOR EACH ROW EXECUTE FUNCTION ta_reject_immutable();

CREATE TABLE IF NOT EXISTS freeze_attempt (
  attempt_id text PRIMARY KEY CHECK (ta_id_ok(attempt_id)),
  manifest_id text NOT NULL,
  permanent_security_id text NOT NULL,
  started_at timestamptz NOT NULL,
  finished_at timestamptz NOT NULL,
  duration_ms bigint NOT NULL CHECK (duration_ms >= 0),
  result_code text NOT NULL,
  event_seq bigint NOT NULL REFERENCES event_log(event_seq),
  FOREIGN KEY (manifest_id, permanent_security_id) REFERENCES manifest_member(manifest_id, permanent_security_id)
);
DROP TRIGGER IF EXISTS freeze_attempt_immutable ON freeze_attempt;
CREATE TRIGGER freeze_attempt_immutable BEFORE UPDATE OR DELETE ON freeze_attempt
  FOR EACH ROW EXECUTE FUNCTION ta_reject_immutable();

CREATE TABLE IF NOT EXISTS execution_admission (
  admission_id text PRIMARY KEY CHECK (ta_id_ok(admission_id)),
  freeze_id text NOT NULL UNIQUE REFERENCES "freeze"(freeze_id),
  outcome text NOT NULL CHECK (outcome IN ('NOT_PREDICTED', 'ADMITTED', 'DENIED')),
  reason_codes jsonb NOT NULL,
  quote_observation_ids jsonb NOT NULL,
  checked_at timestamptz NOT NULL,
  policy_hash bytea NOT NULL,
  request_hash bytea NOT NULL,
  position_id text UNIQUE,
  event_seq bigint NOT NULL REFERENCES event_log(event_seq),
  CHECK (
    (outcome = 'ADMITTED' AND position_id IS NOT NULL)
    OR (outcome IN ('DENIED', 'NOT_PREDICTED') AND position_id IS NULL)
  )
);
DROP TRIGGER IF EXISTS execution_admission_immutable ON execution_admission;
CREATE TRIGGER execution_admission_immutable BEFORE UPDATE OR DELETE ON execution_admission
  FOR EACH ROW EXECUTE FUNCTION ta_reject_immutable();

CREATE TABLE IF NOT EXISTS "position" (
  position_id text PRIMARY KEY CHECK (ta_id_ok(position_id)),
  freeze_id text NOT NULL UNIQUE,
  manifest_id text NOT NULL,
  permanent_security_id text NOT NULL,
  admission_id text NOT NULL UNIQUE REFERENCES execution_admission(admission_id),
  intended_event_session date NOT NULL,
  sleeve text NOT NULL CHECK (sleeve = 'EARNINGS'),
  original_reserved_notional numeric(16,4) NOT NULL CHECK (original_reserved_notional > 0 AND original_reserved_notional <= 5000),
  committed_at timestamptz NOT NULL,
  entry_plan jsonb NOT NULL,
  exit_plan jsonb NOT NULL,
  state text NOT NULL CHECK (state IN (
    'COMMITTED_IRREVOCABLE', 'FILLED', 'NO_FILL', 'IMPAIRED_ENTRY', 'IMPAIRED_EXIT', 'FLAT', 'CLOSED'
  )),
  cas_token bigint NOT NULL CHECK (cas_token > 0),
  entry_evidence_id text,
  last_book_vintage_id text,
  flatten_request_event_seq bigint,
  closed_event_seq bigint,
  release_event_seq bigint UNIQUE,
  last_transition_event_seq bigint NOT NULL,
  display_ticker text NOT NULL,
  FOREIGN KEY (freeze_id, manifest_id, permanent_security_id)
    REFERENCES "freeze"(freeze_id, manifest_id, permanent_security_id),
  CHECK (
    (state = 'CLOSED' AND release_event_seq IS NOT NULL AND closed_event_seq IS NOT NULL)
    OR (state <> 'CLOSED' AND release_event_seq IS NULL AND closed_event_seq IS NULL)
  )
);
CREATE UNIQUE INDEX IF NOT EXISTS position_active_security_uidx
  ON "position" (permanent_security_id) WHERE state <> 'CLOSED';

CREATE TABLE IF NOT EXISTS entry_evidence (
  entry_evidence_id text PRIMARY KEY CHECK (ta_id_ok(entry_evidence_id)),
  position_id text NOT NULL REFERENCES "position"(position_id),
  kind text NOT NULL CHECK (kind IN ('OFFICIAL_FILL', 'CONFIRMED_NO_FILL')),
  source_ids jsonb NOT NULL,
  calc jsonb NOT NULL,
  content_hash bytea NOT NULL CHECK (octet_length(content_hash) = 32),
  event_seq bigint NOT NULL REFERENCES event_log(event_seq)
);
DROP TRIGGER IF EXISTS entry_evidence_immutable ON entry_evidence;
CREATE TRIGGER entry_evidence_immutable BEFORE UPDATE OR DELETE ON entry_evidence
  FOR EACH ROW EXECUTE FUNCTION ta_reject_immutable();

CREATE TABLE IF NOT EXISTS deadline (
  deadline_id text PRIMARY KEY CHECK (ta_id_ok(deadline_id)),
  kind text NOT NULL CHECK (kind IN ('FREEZE', 'MARK_WAIT', 'REPORT_FINALIZE', 'WINDOW_RELEASE')),
  manifest_id text REFERENCES manifest(manifest_id),
  permanent_security_id text,
  window_id text REFERENCES evaluation_window(window_id),
  scheduled_at timestamptz NOT NULL,
  scheduled_event_seq bigint NOT NULL REFERENCES event_log(event_seq),
  applied_event_seq bigint UNIQUE,
  applied_at timestamptz,
  CHECK (
    (applied_event_seq IS NULL AND applied_at IS NULL)
    OR (applied_event_seq IS NOT NULL AND applied_at IS NOT NULL AND applied_at >= scheduled_at)
  ),
  CHECK (
    (kind IN ('FREEZE', 'REPORT_FINALIZE') AND manifest_id IS NOT NULL AND permanent_security_id IS NULL AND window_id IS NULL)
    OR (kind = 'MARK_WAIT' AND manifest_id IS NOT NULL AND permanent_security_id IS NOT NULL AND window_id IS NULL)
    OR (kind = 'WINDOW_RELEASE' AND window_id IS NOT NULL AND manifest_id IS NULL AND permanent_security_id IS NULL)
  )
);
CREATE UNIQUE INDEX IF NOT EXISTS deadline_freeze_uidx ON deadline (manifest_id) WHERE kind = 'FREEZE';
CREATE UNIQUE INDEX IF NOT EXISTS deadline_report_uidx ON deadline (manifest_id) WHERE kind = 'REPORT_FINALIZE';
CREATE UNIQUE INDEX IF NOT EXISTS deadline_mark_uidx ON deadline (manifest_id, permanent_security_id) WHERE kind = 'MARK_WAIT';
CREATE UNIQUE INDEX IF NOT EXISTS deadline_window_uidx ON deadline (window_id) WHERE kind = 'WINDOW_RELEASE';
CREATE INDEX IF NOT EXISTS deadline_due_idx ON deadline (scheduled_at) WHERE applied_event_seq IS NULL;

CREATE TABLE IF NOT EXISTS guard_event (
  guard_id text PRIMARY KEY CHECK (ta_id_ok(guard_id)),
  event_key text NOT NULL,
  manifest_id text,
  permanent_security_id text NOT NULL REFERENCES security(permanent_security_id),
  guard_type text NOT NULL CHECK (guard_type IN ('EARLY_RESULTS', 'OPERATOR_KNOWLEDGE', 'OFF_DESIGN_TIMING')),
  source_observation_id text,
  source_event_at timestamptz,
  recorded_at timestamptz NOT NULL,
  actor_principal_id text NOT NULL,
  reason_code text NOT NULL,
  event_seq bigint NOT NULL REFERENCES event_log(event_seq)
);
DROP TRIGGER IF EXISTS guard_event_immutable ON guard_event;
CREATE TRIGGER guard_event_immutable BEFORE UPDATE OR DELETE ON guard_event
  FOR EACH ROW EXECUTE FUNCTION ta_reject_immutable();

CREATE TABLE IF NOT EXISTS grade (
  grade_id text PRIMARY KEY CHECK (ta_id_ok(grade_id)),
  manifest_id text NOT NULL,
  permanent_security_id text NOT NULL,
  freeze_id text,
  vintage integer NOT NULL CHECK (vintage >= 0),
  outcome text NOT NULL CHECK (outcome IN ('GRADED', 'UNGRADEABLE', 'NO_EVENT', 'NO_FREEZE')),
  reason_codes jsonb NOT NULL,
  event_status text NOT NULL CHECK (event_status IN ('CONFIRMED_INTENDED_EVENT', 'CONFIRMED_NO_EVENT', 'UNRESOLVED')),
  in_evidence_set boolean NOT NULL DEFAULT false,
  late_label_recovery boolean NOT NULL DEFAULT false,
  confound_flags jsonb NOT NULL,
  label_policy_hash bytea NOT NULL,
  values jsonb NOT NULL,
  content_hash bytea NOT NULL CHECK (octet_length(content_hash) = 32),
  created_event_seq bigint NOT NULL REFERENCES event_log(event_seq),
  revision_reason text,
  supersedes_grade_id text,
  UNIQUE (manifest_id, permanent_security_id, vintage),
  FOREIGN KEY (manifest_id, permanent_security_id) REFERENCES manifest_member(manifest_id, permanent_security_id),
  CHECK (
    (outcome = 'NO_FREEZE' AND freeze_id IS NULL)
    OR (outcome <> 'NO_FREEZE' AND freeze_id IS NOT NULL)
  )
);
DROP TRIGGER IF EXISTS grade_immutable ON grade;
CREATE TRIGGER grade_immutable BEFORE UPDATE OR DELETE ON grade
  FOR EACH ROW EXECUTE FUNCTION ta_reject_immutable();
CREATE INDEX IF NOT EXISTS grade_member_vintage_idx ON grade (manifest_id, permanent_security_id, vintage DESC);

CREATE TABLE IF NOT EXISTS grade_pin (
  grade_id text NOT NULL REFERENCES grade(grade_id),
  observation_id text NOT NULL REFERENCES observation(observation_id),
  observation_hash bytea NOT NULL,
  pin_index integer NOT NULL CHECK (pin_index >= 0),
  evidence_role text NOT NULL CHECK (evidence_role IN ('ENTRY', 'EXIT', 'BENCHMARK', 'CORPORATE_ACTION', 'EVENT', 'GUARD')),
  PRIMARY KEY (grade_id, observation_id, evidence_role),
  UNIQUE (grade_id, pin_index)
);
DROP TRIGGER IF EXISTS grade_pin_immutable ON grade_pin;
CREATE TRIGGER grade_pin_immutable BEFORE UPDATE OR DELETE ON grade_pin
  FOR EACH ROW EXECUTE FUNCTION ta_reject_immutable();

CREATE TABLE IF NOT EXISTS book_vintage (
  book_vintage_id text PRIMARY KEY CHECK (ta_id_ok(book_vintage_id)),
  position_id text NOT NULL REFERENCES "position"(position_id),
  vintage integer NOT NULL CHECK (vintage >= 0),
  basis text NOT NULL CHECK (basis IN ('ORIGINAL_PLAN', 'BOOK_FALLBACK', 'ADMIN_FLATTEN', 'CORPORATE_ACTION', 'NO_FILL')),
  status text NOT NULL CHECK (status IN ('PRICED', 'CONFIRMED_NO_FILL')),
  values jsonb NOT NULL,
  content_hash bytea NOT NULL CHECK (octet_length(content_hash) = 32),
  source_class text NOT NULL CHECK (source_class = 'ESTIMATED'),
  strategy_pnl_eligible boolean NOT NULL,
  created_event_seq bigint NOT NULL REFERENCES event_log(event_seq),
  supersedes_book_id text,
  revision_reason text,
  UNIQUE (position_id, vintage)
);
DROP TRIGGER IF EXISTS book_vintage_immutable ON book_vintage;
CREATE TRIGGER book_vintage_immutable BEFORE UPDATE OR DELETE ON book_vintage
  FOR EACH ROW EXECUTE FUNCTION ta_reject_immutable();

CREATE TABLE IF NOT EXISTS book_pin (
  book_vintage_id text NOT NULL REFERENCES book_vintage(book_vintage_id),
  observation_id text NOT NULL REFERENCES observation(observation_id),
  observation_hash bytea NOT NULL,
  pin_index integer NOT NULL CHECK (pin_index >= 0),
  evidence_role text NOT NULL CHECK (evidence_role IN ('ENTRY', 'EXIT', 'FALLBACK', 'CORPORATE_ACTION', 'NONEXECUTION')),
  PRIMARY KEY (book_vintage_id, observation_id, evidence_role),
  UNIQUE (book_vintage_id, pin_index)
);
DROP TRIGGER IF EXISTS book_pin_immutable ON book_pin;
CREATE TRIGGER book_pin_immutable BEFORE UPDATE OR DELETE ON book_pin
  FOR EACH ROW EXECUTE FUNCTION ta_reject_immutable();

CREATE TABLE IF NOT EXISTS report_snapshot (
  snapshot_id text PRIMARY KEY CHECK (ta_id_ok(snapshot_id)),
  scope text NOT NULL CHECK (scope IN ('MANIFEST', 'WINDOW')),
  manifest_id text REFERENCES manifest(manifest_id),
  window_id text NOT NULL REFERENCES evaluation_window(window_id),
  as_of_event_seq bigint NOT NULL REFERENCES event_log(event_seq),
  created_at timestamptz NOT NULL,
  compatibility_hash bytea NOT NULL CHECK (octet_length(compatibility_hash) = 32),
  metrics jsonb NOT NULL,
  content_hash bytea NOT NULL CHECK (octet_length(content_hash) = 32),
  data_mode text NOT NULL CHECK (data_mode IN ('FIXTURE', 'REAL_DATA_READ_ONLY')),
  view_kind text NOT NULL CHECK (view_kind IN ('AS_KNOWN', 'LATEST_CORRECTED'))
);
DROP TRIGGER IF EXISTS report_snapshot_immutable ON report_snapshot;
CREATE TRIGGER report_snapshot_immutable BEFORE UPDATE OR DELETE ON report_snapshot
  FOR EACH ROW EXECUTE FUNCTION ta_reject_immutable();

CREATE TABLE IF NOT EXISTS report_grade_pin (
  snapshot_id text NOT NULL REFERENCES report_snapshot(snapshot_id),
  manifest_id text NOT NULL,
  permanent_security_id text NOT NULL,
  grade_id text NOT NULL REFERENCES grade(grade_id),
  PRIMARY KEY (snapshot_id, manifest_id, permanent_security_id)
);
DROP TRIGGER IF EXISTS report_grade_pin_immutable ON report_grade_pin;
CREATE TRIGGER report_grade_pin_immutable BEFORE UPDATE OR DELETE ON report_grade_pin
  FOR EACH ROW EXECUTE FUNCTION ta_reject_immutable();

CREATE TABLE IF NOT EXISTS report_book_pin (
  snapshot_id text NOT NULL REFERENCES report_snapshot(snapshot_id),
  position_id text NOT NULL REFERENCES "position"(position_id),
  book_vintage_id text,
  book_status_at_snapshot text NOT NULL,
  PRIMARY KEY (snapshot_id, position_id)
);
DROP TRIGGER IF EXISTS report_book_pin_immutable ON report_book_pin;
CREATE TRIGGER report_book_pin_immutable BEFORE UPDATE OR DELETE ON report_book_pin
  FOR EACH ROW EXECUTE FUNCTION ta_reject_immutable();

CREATE TABLE IF NOT EXISTS desk_principal (
  principal_id text PRIMARY KEY CHECK (ta_id_ok(principal_id)),
  user_id text NOT NULL UNIQUE,
  login_name text NOT NULL,
  role text NOT NULL CHECK (role IN ('OPERATOR', 'REVIEWER', 'SERVICE')),
  active boolean NOT NULL DEFAULT true,
  label_exposure_declared boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL
);

CREATE TABLE IF NOT EXISTS access_audit (
  audit_id text PRIMARY KEY CHECK (ta_id_ok(audit_id)),
  actor_principal_id text NOT NULL,
  action text NOT NULL,
  target_type text NOT NULL,
  target_id text,
  occurred_at timestamptz NOT NULL,
  allowed boolean NOT NULL,
  safe_details jsonb NOT NULL
);
DROP TRIGGER IF EXISTS access_audit_immutable ON access_audit;
CREATE TRIGGER access_audit_immutable BEFORE UPDATE OR DELETE ON access_audit
  FOR EACH ROW EXECUTE FUNCTION ta_reject_immutable();

CREATE TABLE IF NOT EXISTS job_state (
  job_name text PRIMARY KEY CHECK (ta_id_ok(job_name)),
  next_due_at timestamptz,
  cursor jsonb,
  last_started_at timestamptz,
  last_completed_at timestamptz,
  last_receipt_id text,
  status text NOT NULL CHECK (status IN ('IDLE', 'RUNNING', 'FAILED', 'BLOCKED')),
  safe_error_code text,
  updated_event_seq bigint
);

CREATE TABLE IF NOT EXISTS ops_alarm (
  alarm_id text PRIMARY KEY CHECK (ta_id_ok(alarm_id)),
  code text NOT NULL,
  component text NOT NULL,
  first_seen timestamptz NOT NULL,
  last_seen timestamptz NOT NULL,
  related_ids jsonb NOT NULL,
  blocks_new_admission boolean NOT NULL,
  status text NOT NULL CHECK (status IN ('OPEN', 'ACKNOWLEDGED', 'RESOLVED')),
  safe_details jsonb NOT NULL,
  opened_event_seq bigint,
  resolution_event_seq bigint
);

CREATE TABLE IF NOT EXISTS operator_control (
  sleeve text PRIMARY KEY CHECK (sleeve = 'EARNINGS'),
  admission_paused boolean NOT NULL,
  pause_reason text,
  updated_event_seq bigint NOT NULL
);

CREATE TABLE IF NOT EXISTS fire_rate_note (
  note_id text PRIMARY KEY CHECK (ta_id_ok(note_id)),
  window_id text NOT NULL REFERENCES evaluation_window(window_id),
  manifest_id text,
  actor_principal_id text NOT NULL,
  hypothesis text NOT NULL CHECK (hypothesis IN ('IMPLEMENTATION_BUG', 'COVERAGE_SHIFT', 'REGIME_SHIFT')),
  note text NOT NULL,
  event_seq bigint NOT NULL REFERENCES event_log(event_seq)
);
DROP TRIGGER IF EXISTS fire_rate_note_immutable ON fire_rate_note;
CREATE TRIGGER fire_rate_note_immutable BEFORE UPDATE OR DELETE ON fire_rate_note
  FOR EACH ROW EXECUTE FUNCTION ta_reject_immutable();

CREATE TABLE IF NOT EXISTS bootstrap_state (
  singleton_key boolean PRIMARY KEY CHECK (singleton_key),
  completed boolean NOT NULL,
  completed_at timestamptz,
  note text
);

INSERT INTO bootstrap_state (singleton_key, completed, note)
  VALUES (true, false, 'pending')
  ON CONFLICT DO NOTHING;
