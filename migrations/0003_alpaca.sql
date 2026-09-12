-- Alpaca venue credentials and local order audit.
-- Secrets are AES-256-GCM ciphertext. The API key id is not a secret; the secret key never leaves ciphertext.

CREATE TABLE IF NOT EXISTS alpaca_credential (
  singleton_key boolean PRIMARY KEY CHECK (singleton_key),
  api_key_id text NOT NULL CHECK (char_length(api_key_id) BETWEEN 8 AND 80),
  secret_ciphertext bytea NOT NULL,
  secret_nonce bytea NOT NULL CHECK (octet_length(secret_nonce) = 12),
  secret_tag bytea NOT NULL CHECK (octet_length(secret_tag) = 16),
  mode text NOT NULL CHECK (mode IN ('PAPER', 'LIVE')),
  watchlist text[] NOT NULL,
  connected_at timestamptz NOT NULL,
  connected_by text NOT NULL CHECK (ta_id_ok(connected_by)),
  last_ok_at timestamptz,
  last_error text,
  account_number_last4 text,
  account_status text,
  CONSTRAINT alpaca_watchlist_size CHECK (cardinality(watchlist) BETWEEN 1 AND 24)
);

CREATE TABLE IF NOT EXISTS alpaca_order_log (
  local_id text PRIMARY KEY CHECK (ta_id_ok(local_id)),
  alpaca_order_id text,
  client_order_id text NOT NULL UNIQUE CHECK (ta_id_ok(client_order_id)),
  symbol text NOT NULL,
  side text NOT NULL CHECK (side IN ('buy', 'sell')),
  order_type text NOT NULL CHECK (order_type IN ('market', 'limit')),
  time_in_force text NOT NULL CHECK (time_in_force IN ('day', 'gtc', 'ioc')),
  qty text,
  notional text,
  limit_price text,
  status text NOT NULL,
  mode text NOT NULL CHECK (mode IN ('PAPER', 'LIVE')),
  submitted_at timestamptz NOT NULL,
  submitted_by text NOT NULL CHECK (ta_id_ok(submitted_by)),
  raw_receipt jsonb NOT NULL
);

CREATE INDEX IF NOT EXISTS alpaca_order_log_submitted ON alpaca_order_log (submitted_at DESC);
