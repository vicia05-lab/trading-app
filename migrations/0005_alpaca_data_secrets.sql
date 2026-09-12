-- Separate from alpaca_credential: these keys are never consumed by order routing.
-- Store the AES master key in a SERVER secret, not in this database.
CREATE TABLE IF NOT EXISTS alpaca_data_secret (
  owner_user_id text PRIMARY KEY CHECK (length(owner_user_id) BETWEEN 1 AND 256),
  version uuid NOT NULL,
  envelope jsonb NOT NULL CHECK (jsonb_typeof(envelope) = 'object'),
  key_last4 text NOT NULL CHECK (length(key_last4) = 4),
  updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  checked_at timestamptz,
  last_test_started_at timestamptz,
  test_result text NOT NULL DEFAULT 'NOT_TESTED' CHECK (test_result IN (
    'NOT_TESTED','VERIFIED','INVALID_CREDENTIALS','AUTH_OR_PERMISSION_DENIED',
    'RATE_LIMITED','PROVIDER_UNAVAILABLE'
  ))
);
CREATE TABLE IF NOT EXISTS alpaca_data_secret_audit (
  audit_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  owner_user_id text NOT NULL,
  version uuid NOT NULL,
  action text NOT NULL CHECK (action IN ('SAVE','REMOVE','TEST')),
  result text NOT NULL CHECK (result IN (
    'SAVED','REMOVED','VERIFIED','INVALID_CREDENTIALS','AUTH_OR_PERMISSION_DENIED',
    'RATE_LIMITED','PROVIDER_UNAVAILABLE'
  )),
  occurred_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
REVOKE ALL ON alpaca_data_secret FROM PUBLIC;
REVOKE ALL ON alpaca_data_secret_audit FROM PUBLIC;
-- Existing authenticated backend DB role owns these tables. Browsers never connect.
-- Audit rows contain action metadata only: no key, ciphertext, request body, or response body.
