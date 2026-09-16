-- Additive broker receipt state only. No change to the kernel sequencer or research ledger.
CREATE TABLE IF NOT EXISTS alpaca_desk_fill (
  position_id text PRIMARY KEY,
  symbol text NOT NULL,
  side text NOT NULL,
  notional text,
  status text NOT NULL,
  client_order_id text,
  alpaca_order_id text,
  last_error text,
  submitted_at timestamptz,
  closed_at timestamptz
);
ALTER TABLE alpaca_desk_fill ADD COLUMN IF NOT EXISTS exit_order_id text;

-- Admission mutex only; this is not a mutation clock or an alternative sequencer.
CREATE TABLE IF NOT EXISTS paper_order_gate (singleton_key boolean PRIMARY KEY CHECK (singleton_key));
INSERT INTO paper_order_gate (singleton_key) VALUES (TRUE) ON CONFLICT DO NOTHING;
