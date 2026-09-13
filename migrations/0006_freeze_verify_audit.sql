CREATE TABLE IF NOT EXISTS freeze_verify_audit (
  audit_id text PRIMARY KEY,
  freeze_id text NOT NULL,
  manifest_id text NOT NULL,
  permanent_security_id text NOT NULL,
  result text NOT NULL CHECK (result IN ('BYTE_VERIFIED', 'HASH_ONLY', 'ATTESTED', 'UNVERIFIABLE')),
  detail text NOT NULL,
  checked_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS freeze_verify_audit_freeze_idx ON freeze_verify_audit (freeze_id, checked_at DESC);
