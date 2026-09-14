# Trading App — Day Trading Research

Research-only extension, September 14, 2026. Baseline f37a3ef3c16a3b7924a0b850da1adac6a38a77ae. This is an explicit research-scope extension, not an overwrite of the AMC specification or an additional execution engine.

## User interface

Predictions has Earnings ledger (default) and Day trading research tabs. The research tab explains three rule families, original sources, failure modes and differences from the papers. Each has synthetic qualifying, no-setup and missing-source examples. The existing TypeScript numeric/hash kernel computes the result server-side. No browser math, real market outcomes, positions or profits are invented. Both assigned roles can view fictional examples. The authenticated endpoint accepts only strategy/scenario identifiers and never caller credentials, quotes, hostnames or owner IDs.

## Research sources and limits

Opening-range breakout: Zarattini, Barbon and Aziz, SFI 24-98, first version 2024, SSRN revision April 2025. More than 7,000 stocks in 2016–2023; unusual first-five-minute volume selection was central. The paper uses long and short stop entries, ATR-related exits, and sizing/leverage assumptions. Our long-only completed-bar version is NOT that backtest. [1]

SPY noise-band/VWAP trend: Zarattini, Aziz and Barbon, SFI 24-97 (2024). Main historical study covers 2007–early 2024, with dynamic time-of-day bands and VWAP-related exits. Variable exposure/leverage contributes to the headline variant. Our long-only unleveraged entry filter and proposed earlier exit are adaptations, not replication. [2]

Late-session momentum: Gao, Han, Li and Zhou, Journal of Financial Economics 129(2), 394–414 (2018). Peer-reviewed evidence links prior-close-to-10:00 return to the final half-hour in 1993–2013 SPY data. This does not establish a modern cost-aware trading system. [3]

Published historical evidence is not proof of future net profits. The first two papers share researchers; the three momentum candidates are not independent votes. Engulfing/EMA patterns and generic VWAP reversal remain experimental. No historical study return is shown as an application result.

## Implemented adaptations

- ORB5_RVOL_LONG: common stocks, opening price >$5, prior 14-session average volume >=1 million, simple-average 14-session true range >$0.50, first-five-minute RVOL >=1 and frozen opening rank <=20. Rank available during open+5 through open+6 minutes. Opening candle must be bullish; a later completed minute crosses above its high. Reference invalidation is close minus 10% ATR, NOT an order or guaranteed loss bound. Stateless recross signals still require deduplication before any future admission.
- SPY_NOISE_VWAP_LONG: verified SPY identity, completed 30-minute checkpoints, 14 earlier same-time absolute open returns. Upper band = max(today open, previous close) times (1+mean movement). Price must exceed both upper band and trade-volume-weighted session VWAP. VWAP-at-entry is an explicit stricter adaptation. No leveraged sizing, order or implemented exit.
- SPY_LATE_MOM_LONG: verified SPY identity, normal 390-minute sessions only, once at minute 360. First-30-minute close above prior-session close gives a long reference setup. Early-close variants are not supported.

All strategies require explicit verified source/calendar status, consolidated SIP for nonfixture data, no unresolved halt/corporate action, continuous fully completed bars, exactly 14 earlier-session records, bounded canonical decimal/integer strings, and a two-sided quote <=2 seconds old. Spread cap is 10bp, compared without rounded division. Unknown readiness blocks. The trusted adapter must prove security identity, the actual previous trading sessions, and universe ranks: a supplied flag is not authentication.

No new entries during the final 15 minutes; proposed exit deadline is close-minus-five minutes. These are research parameters only. The late-session adaptation thus differs from the full final half-hour paper. Outputs always say executionEnabled=false, isOrder=false, capitalReserved=0.0000. Frame/result hashes are separate intraday research domains using existing primitives, not changed earnings hashes or provider authenticity claims.

## Before real-data shadow or paper execution

Verify consolidated timestamps/trade conditions, raw evidence, ranks, identity and corrections. Pin policy and executable artifact identity on persisted research receipts. Use the same TypeScript functions in a historical replay; prevent look-ahead and require the next eligible quote after signal availability. Include spread, latency, fees and conservative handling of ambiguous within-bar stop/target paths. Use chronological validation, clustered session comparisons, all tried variants, net expectancy and tail loss, not only hit rate.

Prospective shadow capture must precede any independently approved paper activation. Do not release capacity on IMPAIRED_* or invent an end-of-day fill. Any later admission must share the existing three-slot/$15k total and $5k position caps, reconcile overlapping SPY ideas and existing earnings exposures, and keep AMC per-event limits. Define versioned intraday loss/attempt/exit policies before activation, not ad hoc in the UI. Read-only verification must never create trades. AI can propose future rules but cannot adopt thresholds after a few outcomes.

Alpaca says its paper simulator omits impact, information leakage, latency slippage and order queue effects [4]. FINRA warns of substantial day-trading loss risk [5]. This patch sends no orders and does not provide account-specific margin/legal guidance.

## Verification boundaries

49 intraday unit tests initially passed, and the full application run passed 161 tests, including those 49. Final runs and browser results are recorded separately. Fourteen isolated component-browser checks cover desktop/mobile rendering, three strategies, qualifying/no-setup/missing-source results, disclosure, safe source links, keyboard control, error/retry and timeout. The browser used injected synthetic transport; it was not a hosted authenticated run. Screenshots were visually inspected. No provider request, real key, backtest, scheduled job or public deployment occurred. No migrations are needed for this research-only feature.

## Primary references (checked September 14, 2026)

[1] https://papers.ssrn.com/sol3/papers.cfm?abstract_id=4729284
Author paper: https://concretumgroup.com/wp-content/uploads/2026/02/A-Profitable-Day-Trading-Strategy-For-The-U.S.-Equity-Market.pdf
[2] https://papers.ssrn.com/sol3/papers.cfm?abstract_id=4824172
Author paper: https://concretumgroup.com/wp-content/uploads/2026/02/Beat-the-Market.pdf
The SSRN page for [2] denied retrieval in this session; the author's full paper was available.
[3] https://doi.org/10.1016/j.jfineco.2018.05.009
Author university record: https://profiles.wustl.edu/en/publications/market-intraday-momentum/
[4] https://docs.alpaca.markets/us/v1.4.2/docs/paper-trading
[5] https://www.finra.org/investors/investing/investment-products/stocks/day-trading
