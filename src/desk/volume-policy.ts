/** Versioned research hypothesis. These values are NOT a calibrated trading edge. */
function freeze<T>(value: T): Readonly<T> {
  if (value && typeof value === "object") {
    for (const x of Object.values(value)) freeze(x);
    Object.freeze(value);
  }
  return value;
}
export const VOLUME_POLICY = freeze({
  schema: "2.1",
  trialId: "volume-v21-exploratory-0001",
  classification: "EXPLORATORY_NOT_PREREGISTERED_OOS",
  paperOnly: true,
  liveTradingSupported: false,
  executionEnabled: false,
  directions: ["LONG"],
  prisms: ["ORB15_CONTINUATION", "VWAP_PULLBACK"],
  selection: {
    minimumPrice: "5.000000",
    topK: "20",
    rankMethod: "RAW_TIME_MATCHED_RVOL",
    betaResidualModel: false,
  },
  baseline: {
    recentSessions: "20",
    minimumRecent: "15",
    longSessions: "60",
    maxLookback: "120",
    shiftRatio: "0.40",
  },
  signal: {
    breakoutBarRvol: "1.50",
    pullbackBarRvol: "1.30",
    imbalanceFloor: "0.15",
    minimumSignedCoverage: "0.80",
    pullbackRatio: "0.70",
    maxVwapDistanceAtr: "0.75",
  },
  risk: {
    maxConcurrent: "3",
    maxEntriesPerSession: null,
    maxEntriesPerSecurity: "1",
    maxPositionNotional: "5000.0000",
    maxGrossNotional: "15000.0000",
    perTradeRisk: "150.0000",
    dailyLossBudget: "450.0000",
    accountDrawdownHalt: "2250.0000",
    maxStopAtr: "0.35",
    stopBufferAtr: "0.05",
    maxSpreadRiskFraction: "0.10",
    maxSpreadBps: "10",
    participationFraction: "0.01",
  },
  executionModel: {
    latencyMs: "250",
    maxQuoteAgeMs: "2000",
    cancelAfterMs: "300000",
    maxHoldMs: "2700000",
    flattenBeforeCloseMs: "300000",
    entrySlippagePerShare: "0.010000",
    exitSlippagePerShare: "0.010000",
    roundTripFeePerShare: "0.000000",
    costStatus: "ASSUMPTION_NOT_REALIZED_EXECUTION",
    profitExit: "FIXED_STOP_OR_45_MINUTES_OR_CLOSE_MINUS_5_MINUTES",
    trailStop: false,
    profitTarget: null,
  },
  validation: {
    minimumTrades: "600",
    preferredTrades: "1000",
    minimumSessions: "250",
    unit: "SYNCHRONOUS_DAILY_PORTFOLIO_RETURNS",
    confidence: "ONE_SIDED_95_PERCENT",
    bootstrap: "STATIONARY_SESSION_BLOCKS",
    meanBlockSessions: "5",
    bootstrapDraws: "2000",
    seed: "20260915",
    dsrRole: "DIAGNOSTIC_NOT_ACTIVATION",
    uncomputedChecks: ["PBO", "CPCV", "EFFECTIVE_TRIAL_COUNT", "LIVE_EXECUTION_COSTS"],
  },
});
