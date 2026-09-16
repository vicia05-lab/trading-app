/** Floating-point descriptive research statistics only; never money/fills/risk admission. */
export type ResearchSession = {
  date: string;
  portfolioReturn: number;
  equity: number;
  tradeR: number[];
};
const mean = (x: number[]) => x.reduce((a, b) => a + b, 0) / x.length;
function finite(x: number[]): void {
  if (!x.length || !x.every(Number.isFinite)) throw new Error("FINITE_NONEMPTY_SAMPLE_REQUIRED");
}
export function maxDrawdownFromPnl(pnl: number[]): number {
  finite(pnl);
  let equity = 0,
    peak = 0,
    mdd = 0;
  for (const p of pnl) {
    equity += p;
    peak = Math.max(peak, equity);
    mdd = Math.max(mdd, peak - equity);
  }
  return mdd;
}
export function maxDrawdownFromEquity(initialEquity: number, equity: number[]): number {
  finite([initialEquity, ...equity]);
  if (initialEquity <= 0) throw new Error("INVALID_INITIAL_EQUITY");
  let peak = initialEquity,
    mdd = 0;
  for (const e of equity) {
    peak = Math.max(peak, e);
    mdd = Math.max(mdd, peak - e);
  }
  return mdd;
}
export function profitFactor(r: number[]): number | null {
  finite(r);
  let win = 0,
    loss = 0;
  for (const v of r) {
    win += Math.max(0, v);
    loss += Math.max(0, -v);
  }
  return loss > 0 ? win / loss : null;
}
export function sharpe(x: number[]): number | null {
  finite(x);
  if (x.length < 2) return null;
  const m = mean(x),
    v = x.reduce((a, b) => a + (b - m) ** 2, 0) / (x.length - 1);
  return v > 0 ? m / Math.sqrt(v) : null;
}
export function conditionalConcentration(
  paths: number[][],
  threshold = 0.1,
): { eligible: number; probability: number | null } {
  if (!Number.isFinite(threshold) || threshold < 0) throw new Error("INVALID_THRESHOLD");
  let eligible = 0,
    hits = 0;
  for (const days of paths) {
    finite(days);
    const total = days.reduce((a, b) => a + b, 0);
    if (total <= 0) continue;
    eligible++;
    if (Math.max(...days) / total > threshold) hits++;
  }
  return { eligible, probability: eligible ? hits / eligible : null };
}
/** Acklam rational normal-quantile approximation; errors fail closed at endpoints. */
export function normalQuantile(p: number): number {
  if (!(p > 0 && p < 1)) throw new Error("QUANTILE_REQUIRES_OPEN_UNIT_INTERVAL");
  const a = [
    -39.69683028665376, 220.9460984245205, -275.9285104469687, 138.357751867269, -30.66479806614716,
    2.506628277459239,
  ];
  const b = [
    -54.47609879822406, 161.5858368580409, -155.6989798598866, 66.80131188771972,
    -13.28068155288572,
  ];
  const c = [
    -0.007784894002430293, -0.3223964580411365, -2.400758277161838, -2.549732539343734,
    4.374664141464968, 2.938163982698783,
  ];
  const d = [0.007784695709041462, 0.3224671290700398, 2.445134137142996, 3.754408661907416];
  const tail = (q: number) =>
    (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
    ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  if (p < 0.02425) return tail(Math.sqrt(-2 * Math.log(p)));
  if (p > 1 - 0.02425) return -tail(Math.sqrt(-2 * Math.log(1 - p)));
  const q = p - 0.5,
    r = q * q;
  return (
    ((((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q) /
    (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1)
  );
}
export function expectedMaximumZ(independentTrials: number): number {
  if (!Number.isInteger(independentTrials) || independentTrials < 1 || independentTrials > 1000000)
    throw new Error("INVALID_INDEPENDENT_TRIAL_COUNT");
  if (independentTrials === 1) return 0;
  const gamma = 0.5772156649015329;
  return (
    (1 - gamma) * normalQuantile(1 - 1 / independentTrials) +
    gamma * normalQuantile(1 - 1 / (independentTrials * Math.E))
  );
}
function rng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function stationarySessionIndices(n: number, meanBlock: number, seed: number): number[] {
  if (
    !Number.isInteger(n) ||
    n < 2 ||
    n > 100000 ||
    !Number.isFinite(meanBlock) ||
    meanBlock < 1 ||
    meanBlock > n ||
    !Number.isInteger(seed)
  )
    throw new Error("INVALID_BOOTSTRAP_PARAMETERS");
  const random = rng(seed),
    out: number[] = [];
  let at = Math.floor(random() * n);
  for (let i = 0; i < n; i++) {
    if (i > 0) at = random() < 1 / meanBlock ? Math.floor(random() * n) : (at + 1) % n;
    out.push(at);
  }
  return out;
}
const quantile = (x: number[], p: number) => {
  const a = [...x].sort((a, b) => a - b);
  const index = (a.length - 1) * p,
    i = Math.floor(index);
  return a[i] + (a[Math.min(i + 1, a.length - 1)] - a[i]) * (index - i);
};
export function researchStatistics(
  sessions: ResearchSession[],
  initialEquity: number,
  options = { draws: 2000, meanBlock: 5, seed: 20260915 },
) {
  if (
    !sessions.length ||
    sessions.length > 10000 ||
    !Number.isInteger(options.draws) ||
    options.draws < 100 ||
    options.draws > 20000
  )
    throw new Error("INVALID_RESEARCH_SAMPLE");
  let previous = "";
  for (const s of sessions) {
    if (
      !/^\d{4}-\d\d-\d\d$/.test(s.date) ||
      s.date <= previous ||
      new Date(s.date + "T00:00:00.000Z").toISOString().slice(0, 10) !== s.date
    )
      throw new Error("UNORDERED_SESSION_CALENDAR");
    finite([s.portfolioReturn, s.equity, ...s.tradeR]);
    previous = s.date;
  }
  const trades = sessions.flatMap((s) => s.tradeR),
    daily = sessions.map((s) => s.portfolioReturn);
  const basic = {
    sampleStatus:
      sessions.length >= 250 && trades.length >= 600
        ? "MINIMUM_COUNTS_MET_NOT_PROOF"
        : "INSUFFICIENT_SAMPLE",
    sessions: sessions.length,
    trades: trades.length,
    dailySharpe: sharpe(daily),
    tradeSharpe: trades.length ? sharpe(trades) : null,
    meanTradeR: trades.length ? mean(trades) : null,
    profitFactor: trades.length ? profitFactor(trades) : null,
    accountMaxDrawdown: maxDrawdownFromEquity(
      initialEquity,
      sessions.map((s) => s.equity),
    ),
    effectiveTrialCount: null,
    dsr: null,
    pbo: null,
    cpcv: null,
    promotion: "INCONCLUSIVE",
    executionEnabled: false,
    intervalMethod: "ONE_SIDED_95_PERCENT_STATIONARY_SESSION_PERCENTILE_NOT_BCA",
    meanRLower95: null as number | null,
    profitFactorLower95: null as number | null,
  };
  if (sessions.length < Math.max(10, options.meanBlock * 2) || !trades.length) return basic;
  const means: number[] = [],
    pfs: number[] = [];
  let undefinedPf = 0;
  for (let i = 0; i < options.draws; i++) {
    const rows = stationarySessionIndices(
      sessions.length,
      options.meanBlock,
      options.seed + i,
    ).flatMap((j) => sessions[j].tradeR);
    if (!rows.length) continue;
    means.push(mean(rows));
    const pf = profitFactor(rows);
    if (pf === null) undefinedPf++;
    else pfs.push(pf);
  }
  return {
    ...basic,
    meanRLower95: means.length === options.draws ? quantile(means, 0.05) : null,
    profitFactorLower95:
      undefinedPf === 0 && pfs.length === options.draws ? quantile(pfs, 0.05) : null,
  };
}
