/** Public research metadata only. No credentials, outcomes, or broker capability. */
export const INTRADAY_CATALOG_VERSION = "intraday-research-1";
export const INTRADAY_STRATEGIES = [
  {
    id: "ORB5_RVOL_LONG",
    name: "Opening-range breakout",
    subtitle: "Unusually active stocks · first five minutes",
    evidence: "Published working-paper backtest",
    priority: "First candidate",
    sourceTitle:
      "Zarattini, Barbon & Aziz — A Profitable Day Trading Strategy for the U.S. Equity Market (2024; revised 2025)",
    sourceUrl: "https://papers.ssrn.com/sol3/papers.cfm?abstract_id=4729284",
    evidenceSummary:
      "Study of more than 7,000 U.S. stocks, 2016–2023. Results depended strongly on opening-volume selection; the basic unfiltered ORB was much weaker.",
    rules: [
      "Opening price above $5; prior 14-session average volume at least 1 million; prior ATR above $0.50.",
      "Opening volume at least its own prior 14-session average, and ranked within the top 20 eligible names at 09:35.",
      "The first five-minute candle must be green. A later completed one-minute close crosses above its high.",
      "Reference invalidation is 10% of prior daily ATR below the signal price; this is not a guaranteed fill or loss limit.",
    ],
    differences:
      "Long-only and completed-bar confirmation, not the paper's long/short stop-entry portfolio. No published return is attributed to this adaptation.",
    failureMode: "Opening whipsaws, news halts, spread expansion, and unrealistic same-bar fills.",
  },
  {
    id: "SPY_NOISE_VWAP_LONG",
    name: "SPY intraday trend",
    subtitle: "Time-of-day noise band + session VWAP",
    evidence: "Published working-paper backtest",
    priority: "Second candidate",
    sourceTitle: "Zarattini, Aziz & Barbon — Beat the Market (2024), SFI paper 24-97",
    sourceUrl: "https://papers.ssrn.com/sol3/papers.cfm?abstract_id=4824172",
    evidenceSummary:
      "Historical SPY study, 2007–early 2024. Uses a 14-session time-of-day noise band and VWAP exits. The headline result includes variable exposure and leverage.",
    rules: [
      "SPY identity verified by the security master; use only complete regular-session bars.",
      "At completed 30-minute checkpoints, compare price with the average absolute open-to-same-time move over 14 earlier sessions.",
      "Long candidate only above both the gap-aware upper band and trade-volume-weighted session VWAP.",
      "Reference exit boundary is the higher of the upper band and VWAP. No short or leveraged exposure is implemented.",
    ],
    differences:
      "Long-only, no leverage/volatility-target sizing, and proposed close-minus-five-minute exit. This is an unvalidated adaptation, not a replication.",
    failureMode:
      "Range-bound sessions, repeated whipsaws, feed-dependent VWAP, and correlated market exposure.",
  },
  {
    id: "SPY_LATE_MOM_LONG",
    name: "SPY late-session momentum",
    subtitle: "Morning information · last half-hour",
    evidence: "Peer-reviewed historical evidence",
    priority: "Comparison candidate",
    sourceTitle:
      "Gao, Han, Li & Zhou — Market intraday momentum, Journal of Financial Economics (2018)",
    sourceUrl: "https://doi.org/10.1016/j.jfineco.2018.05.009",
    evidenceSummary:
      "SPY data from 1993–2013 showed the prior-close-to-10:00 return predicting the final half-hour. Related evidence exists in other markets, but is not universal.",
    rules: [
      "SPY only, normal 390-minute session; evaluate once at the completed 15:30 checkpoint.",
      "Measure the first half-hour return from the prior session's close, not from today's open.",
      "Positive first-half-hour return produces a long research candidate; nonpositive returns produce no setup.",
      "Time-based hypothesis only. An execution-grade risk/exit policy must be separately approved and tested.",
    ],
    differences:
      "Long-only with an earlier proposed exit, not the full long/short academic strategy. No stop or profitability claim is inferred from the paper.",
    failureMode:
      "Late reversals, changed regimes, a small effect consumed by spread, and correlation with the other SPY candidate.",
  },
] as const;
export type IntradayStrategyId = (typeof INTRADAY_STRATEGIES)[number]["id"];
export const EXPERIMENTAL_IDEAS = [
  "VWAP pullback / VWAP mean reversion: keep experimental until a precise rule and independent cost-aware test exist.",
  "Engulfing candles / EMA combinations: familiar patterns are not proof of a durable net edge; do not promote on popularity.",
];
