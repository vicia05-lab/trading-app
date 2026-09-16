# Trading App — Volume v2.1 research implementation

Baseline: `6aafcdc45ba4e938fb11955dbc676e7bfa36b5db`. This is an isolated research extension, not activation of a trading sleeve. The earnings kernel, official grading, shared limits and historical records are not reset. No broker orders or production database mutations are performed by the examples or census.

## Implemented behavior

The server-only TypeScript kernel evaluates long ORB15 continuation and causal VWAP pullbacks using hard gates, separate cumulative/bar/trailing-30-minute RVOL, same-time medians, prior-session-seeded EMA9, signed-trade coverage and imbalance, market/sector alignment, actual structural stops, spread feasibility and a $5 minimum price. Cross-sectional ranking is ordinary RVOL rank with permanent-security-ID ties; subtracting one common market factor is not represented as a new ranking signal. Ranks are per checkpoint, not a promise of regime-independent daily trade frequency.

A missing or invalid member makes the cross-sectional rank unverified. Historical/prospective frames require SIP and explicit source/calendar/security readiness; structural flags are not provider authentication. Prior 20 trading-session rows need at least 15 qualifying rows; the long reference needs 60 qualifying rows within a maximum 120 supplied dates. Normal 390-minute sessions only. The trusted adapter must establish actual venue dates, split-adjusted volume, per-name exclusions and point-in-time availability. It is not connected in this change.

The pullback definition excludes its confirmation candle from the low-volume interval. ORB signals use completed bars from minute 20 through 60; pullbacks use minute 30 through 300. Impulses have 3–12 bars; pullbacks have 1–6 and cannot outlast their impulse. The trailing window is unavailable before six completed five-minute bars. Parameters and executable source hashes are retained rather than tuned after outcomes.

Modeled admission requires a quote observed after signal availability plus 250 ms. The fixed signal-derived limit is not chased. Integer quantity is floored exactly against notional, remaining risk and a 1% minute-liquidity allowance. A $5,000 ticket is a ceiling, not a compulsory order. Pending, open and impaired shared commitments count against three concurrent slots and $15,000 gross. One attempted security per session is separate from the concurrency limit. The model never creates a real reservation.

The complete exploratory exit policy is a fixed structural stop, a 45-minute holding limit or close-minus-five minutes, whichever triggers first. Exit estimates use eligible subsequent bid quotes minus explicit assumed costs, not the signal close or favorable OHLC fills. Missing exit coverage/quotes retain unresolved exposure. Gap-through-stop losses can exceed initial planned risk. Account drawdown is measured in dollars; its $2,250 circuit-breaker is not a statistical validation test. Slippage, latency and fees are assumptions, not calibrated exchange execution.

Partial simulated entry fills require acknowledged resting protection covering every filled share. A submitted bracket or completed entry alone is insufficient. Even acknowledged stops do not guarantee a fill or maximum loss.

## Evidence and statistics

`buildVolumeCapture` returns separate candidate and constrained-admission ledgers. The census CLI accepts CJ1 NDJSON rows with `frames`, `risk` and an array of `{securityId, quote}` objects. It creates a new run directory exclusively, registers policy/source identity before parsing, retains an input copy, rejects duplicate observations, and hashes retained inputs and both ledgers. Existing runs cannot be overwritten. Partial failures receive a FAILED receipt, never a completed/gradable one. Snapshot admissions are not a continuous portfolio backtest.

`volume-ledger.ts` plugs registry/capture receipts into the existing writer transaction and global event sequence. Duplicate receipt handling throws inside the transaction and returns the existing receipt only after rollback. These internal entrypoints are not browser RPCs. The authenticated browser RPC permits only enumerated fictional scenarios, with Operator/Reviewer role checks; it does not accept credentials, quotes, URLs or user IDs.

Statistics correct initial-peak drawdown, conditional concentration denominators and the single-trial expected-maximum edge case. The implementation preserves synchronous daily portfolio returns, uses stationary session blocks, reports a one-sided percentile interval honestly as not BCa, and distinguishes trade-R drawdown from marked account equity. Counts alone cannot promote a strategy. DSR/PBO/CPCV, effective trial count, exchange fill costs and a survivorship-safe historical universe remain unverified/uncomputed; no invented diagnostic passes are emitted.

## Explicit limits

This is exploratory, not a retroactively preregistered OOS study. Prior trial history is incomplete. No year-long real-data census, continuous backtest, 600-trade sample, 30-session paper study, signed-trade classifier, real-data scheduler, broker execution activation, live-profit claim or production promotion is included. The synthetic calendar is fictional. UI browser checks use the real component with injected synthetic transport, not a hosted authenticated end-to-end session.

The existing missing-VWAP fallback now remains null rather than substituting the last price. The snapshot type exposes the actual nullable provider VWAP. A missing earnings-link search argument and the Windows Vite launcher were repaired separately. The launcher preserves environment precedence and uses Node directly instead of a shell.
