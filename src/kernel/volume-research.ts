/** Trading App Volume v2.1: pure research kernel. No broker, DB, clock or browser math. */
import { z } from "zod";
import { add, sub, mul, div, cmp, dec, decToCanonical, canon, h } from "./index.ts";
import type { Dec } from "./index.ts";
import { VOLUME_POLICY as P } from "../desk/volume-policy.ts";
const px = z.string().regex(/^(?:0|[1-9]\d{0,6})\.\d{1,6}$/);
const nonnegative = z.string().regex(/^(?:0|[1-9]\d{0,12})(?:\.\d{1,12})?$/);
const integer = z.string().regex(/^(?:0|[1-9]\d{0,11})$/);
const id = z.string().regex(/^[A-Za-z0-9][A-Za-z0-9:._-]{0,63}$/);
export const timestamp = z
  .string()
  .refine(
    (s) =>
      /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(s) &&
      Number.isFinite(Date.parse(s)) &&
      new Date(s).toISOString() === s,
    "INVALID_UTC_TIMESTAMP",
  );
const day = z
  .string()
  .refine(
    (s) =>
      /^\d{4}-\d\d-\d\d$/.test(s) &&
      Number.isFinite(Date.parse(s + "T00:00:00.000Z")) &&
      new Date(s + "T00:00:00.000Z").toISOString().slice(0, 10) === s,
    "INVALID_SESSION",
  );
const barSchema = z
  .object({
    id,
    startAt: timestamp,
    availableAt: timestamp,
    open: px,
    high: px,
    low: px,
    close: px,
    volume: integer,
    tradeVwap: px,
    buyVolume: integer.nullable(),
    sellVolume: integer.nullable(),
    signedAvailableAt: timestamp.nullable(),
  })
  .strict();
const historySchema = z
  .object({
    sessionDate: day,
    availableAt: timestamp,
    qualifying: z.boolean(),
    exclusionReason: z.string().max(80),
    // Exactly 78 regular-session five-minute buckets. Trusted adapter supplies exchange dates.
    volumes: z.array(integer).length(78),
    closes: z.array(px).length(78),
  })
  .strict();
export const volumeFrameSchema = z
  .object({
    schema: z.literal("2.1"),
    securityId: id,
    sessionDate: day,
    mode: z.enum(["FIXTURE", "HISTORICAL", "PROSPECTIVE"]),
    feed: z.enum(["FIXTURE", "SIP", "IEX"]),
    sourceState: z.enum(["VERIFIED", "NOT_CHECKED"]),
    calendarState: z.enum(["VERIFIED", "NOT_CHECKED"]),
    securityState: z.enum(["US_COMMON_VERIFIED", "NOT_CHECKED"]),
    haltState: z.enum(["CLEAR", "HALTED", "UNKNOWN"]),
    corporateActionState: z.enum(["CLEAR", "EVENT", "UNKNOWN"]),
    universeSnapshotId: id,
    universeComplete: z.boolean(),
    universeExpectedCount: integer,
    openAt: timestamp,
    closeAt: timestamp,
    decisionAt: timestamp,
    atr: z.object({ value: px, availableAt: timestamp }).strict(),
    context: z
      .object({ marketSectorAligned: z.boolean().nullable(), availableAt: timestamp })
      .strict(),
    history: z.array(historySchema).max(120),
    bars: z.array(barSchema).min(1).max(78),
    quote: z.object({ bid: px, ask: px, observedAt: timestamp, availableAt: timestamp }).strict(),
    entryMinuteDollarVolume: z.object({ value: nonnegative, availableAt: timestamp }).strict(),
  })
  .strict();
export type VolumeFrame = z.infer<typeof volumeFrameSchema>;
export type VolumeBar = VolumeFrame["bars"][number];
export type VolumeStatus = "LONG_CANDIDATE" | "NO_SETUP" | "BLOCKED" | "INVALID_INPUT";
export type VolumeCandidate = {
  schema: "2.1";
  securityId: string;
  sessionDate: string;
  decisionAt: string;
  status: VolumeStatus;
  reasons: string[];
  prism: string | null;
  rank: string | null;
  rvolCumulative: string | null;
  rvolWindow30: string | null;
  rvolBar: string | null;
  signedImbalance: string | null;
  vwap: string | null;
  ema9: string | null;
  referencePrice: string | null;
  structuralStop: string | null;
  atr: string | null;
  inputHash: string | null;
  policyHash: string;
  candidateId: string;
  evidenceScope: string;
  paperOnly: true;
  liveTradingSupported: false;
  executionEnabled: false;
  isOrder: false;
  capitalReserved: "0.0000";
  pnlStatus: "ESTIMATED";
};
const D = (s: string) => dec(s, 12);
const F = (d: Dec) => decToCanonical(d, 12);
const Z = () => D("0");
const total = (xs: Dec[]) => xs.reduce(add, Z());
const mean = (xs: Dec[]) => div(total(xs), D(String(xs.length)), 12);
const low = (a: Dec, b: Dec) => (cmp(a, b) < 0 ? a : b);
const high = (a: Dec, b: Dec) => (cmp(a, b) > 0 ? a : b);
function median(xs: Dec[]): Dec {
  if (!xs.length) throw new Error("MISSING_BASELINE");
  const ordered = [...xs].sort(cmp),
    i = Math.floor(ordered.length / 2);
  return ordered.length % 2 ? ordered[i] : div(add(ordered[i - 1], ordered[i]), D("2"), 12);
}
function positive(s: string) {
  if (cmp(D(s), Z()) <= 0) throw new Error("NONPOSITIVE_VALUE");
}
export const volumePolicyHash = () => h("Trading App|volume-research-policy|2.1", canon(P));
export function volumeResearchHash(domain: string, value: unknown): string {
  return h("Trading App|volume-research-" + domain + "|2.1", canon(value));
}
function result(f: Partial<VolumeFrame>, patch: Partial<VolumeCandidate>): VolumeCandidate {
  const out: Omit<VolumeCandidate, "candidateId"> = {
    schema: "2.1",
    securityId: f.securityId ?? "UNKNOWN",
    sessionDate: f.sessionDate ?? "UNKNOWN",
    decisionAt: f.decisionAt ?? "UNKNOWN",
    status: "BLOCKED",
    reasons: [],
    prism: null,
    rank: null,
    rvolCumulative: null,
    rvolWindow30: null,
    rvolBar: null,
    signedImbalance: null,
    vwap: null,
    ema9: null,
    referencePrice: null,
    structuralStop: null,
    atr: null,
    inputHash: null,
    policyHash: volumePolicyHash(),
    evidenceScope: f.mode ?? "UNKNOWN",
    paperOnly: true,
    liveTradingSupported: false,
    executionEnabled: false,
    isOrder: false,
    capitalReserved: "0.0000",
    pnlStatus: "ESTIMATED",
    ...patch,
  };
  return { ...out, candidateId: volumeResearchHash("candidate", out) };
}
function validFrame(f: VolumeFrame): void {
  const open = Date.parse(f.openAt),
    close = Date.parse(f.closeAt),
    now = Date.parse(f.decisionAt);
  if (
    close - open !== 390 * 60000 ||
    f.openAt.slice(0, 10) !== f.sessionDate ||
    f.closeAt.slice(0, 10) !== f.sessionDate ||
    now < open ||
    now >= close
  )
    throw new Error("UNSUPPORTED_SESSION");
  positive(f.atr.value);
  if (
    Date.parse(f.atr.availableAt) >= open ||
    Date.parse(f.context.availableAt) > now ||
    Date.parse(f.entryMinuteDollarVolume.availableAt) > now
  )
    throw new Error("FUTURE_FEATURE");
  const seen = new Set<string>();
  for (const [i, b] of f.bars.entries()) {
    const end = open + (i + 1) * 300000;
    if (
      Date.parse(b.startAt) !== open + i * 300000 ||
      Date.parse(b.availableAt) < end ||
      Date.parse(b.availableAt) > now ||
      end > now
    )
      throw new Error("UNAVAILABLE_OR_NONCONTIGUOUS_BAR");
    if (seen.has(b.id)) throw new Error("DUPLICATE_BAR");
    seen.add(b.id);
    for (const s of [b.open, b.high, b.low, b.close, b.tradeVwap]) positive(s);
    if (
      cmp(D(b.low), low(D(b.open), D(b.close))) > 0 ||
      cmp(D(b.high), high(D(b.open), D(b.close))) < 0 ||
      cmp(D(b.low), D(b.high)) > 0 ||
      cmp(D(b.tradeVwap), D(b.low)) < 0 ||
      cmp(D(b.tradeVwap), D(b.high)) > 0
    )
      throw new Error("INVALID_OHLC_OR_VWAP");
    if (
      b.buyVolume !== null &&
      b.sellVolume !== null &&
      cmp(add(D(b.buyVolume), D(b.sellVolume)), D(b.volume)) > 0
    )
      throw new Error("SIGNED_VOLUME_EXCEEDS_TOTAL");
    if (
      b.signedAvailableAt !== null &&
      (Date.parse(b.signedAvailableAt) < end || Date.parse(b.signedAvailableAt) > now)
    )
      throw new Error("FUTURE_SIGNED_VOLUME");
  }
  const end = open + f.bars.length * 300000;
  if (now - end > 300000) throw new Error("STALE_BARS");
  if (
    Date.parse(f.quote.observedAt) > Date.parse(f.quote.availableAt) ||
    Date.parse(f.quote.availableAt) > now ||
    Date.parse(f.quote.observedAt) < end ||
    now - Date.parse(f.quote.observedAt) > Number(P.executionModel.maxQuoteAgeMs)
  )
    throw new Error("STALE_OR_FUTURE_QUOTE");
  positive(f.quote.bid);
  positive(f.quote.ask);
  if (cmp(D(f.quote.ask), D(f.quote.bid)) <= 0) throw new Error("CROSSED_OR_LOCKED_QUOTE");
  let previous = "";
  for (const session of f.history) {
    if (
      session.sessionDate <= previous ||
      session.sessionDate >= f.sessionDate ||
      Date.parse(session.availableAt) >= open ||
      Date.parse(session.availableAt) < Date.parse(session.sessionDate + "T00:00:00.000Z")
    )
      throw new Error("INVALID_HISTORY_TIME");
    if (session.qualifying === Boolean(session.exclusionReason))
      throw new Error("INVALID_EXCLUSION_RECEIPT");
    previous = session.sessionDate;
    session.closes.forEach(positive);
  }
}
type Features = {
  cumulative: Dec;
  window: Dec | null;
  bar: Dec;
  vwap: Dec;
  vwaps: Dec[];
  ema: Dec;
  previousEma: Dec;
  barRatios: Dec[];
  imbalance: Dec;
};
function features(f: VolumeFrame): Features {
  const recent = f.history.slice(-20).filter((x) => x.qualifying);
  const long = f.history.filter((x) => x.qualifying).slice(-60);
  if (f.history.length < 20 || recent.length < Number(P.baseline.minimumRecent) || long.length < 60)
    throw new Error("BASELINE_COVERAGE_MISSING");
  const n = f.bars.length;
  const aggregate = (from: number, through: number, rows = recent) =>
    median(rows.map((s) => total(s.volumes.slice(from, through).map(D))));
  const base = aggregate(0, n),
    barBase = aggregate(n - 1, n);
  if (cmp(base, Z()) <= 0 || cmp(barBase, Z()) <= 0) throw new Error("ZERO_BASELINE");
  const short10 = aggregate(0, 6),
    long10 = aggregate(0, 6, long);
  if (cmp(long10, Z()) <= 0) throw new Error("ZERO_LONG_BASELINE");
  const difference = sub(short10, long10),
    absolute = cmp(difference, Z()) < 0 ? sub(Z(), difference) : difference;
  if (cmp(absolute, mul(long10, D(P.baseline.shiftRatio))) > 0)
    throw new Error("LIQUIDITY_REGIME_SHIFT");
  const vs = f.bars.map((b) => D(b.volume)),
    sumVolume = total(vs);
  if (cmp(sumVolume, Z()) <= 0) throw new Error("ZERO_SESSION_VOLUME");
  let weighted = Z(),
    cumulativeVolume = Z();
  const vwaps = f.bars.map((b) => {
    weighted = add(weighted, mul(D(b.tradeVwap), D(b.volume)));
    cumulativeVolume = add(cumulativeVolume, D(b.volume));
    if (cmp(cumulativeVolume, Z()) <= 0) throw new Error("ZERO_PREFIX_VOLUME");
    return div(weighted, cumulativeVolume, 12);
  });
  const last = f.bars[n - 1];
  if (last.buyVolume === null || last.sellVolume === null || last.signedAvailableAt === null)
    throw new Error("SIGNED_TRADE_EVIDENCE_MISSING");
  const signed = add(D(last.buyVolume), D(last.sellVolume));
  if (
    cmp(signed, Z()) <= 0 ||
    cmp(signed, mul(D(last.volume), D(P.signal.minimumSignedCoverage))) < 0
  )
    throw new Error("SIGNED_TRADE_COVERAGE_LOW");
  let ema = D(f.history.at(-1)!.closes[0]);
  for (const c of f.history.at(-1)!.closes.slice(1))
    ema = add(mul(D("0.2"), D(c)), mul(D("0.8"), ema));
  let previousEma = ema;
  for (const b of f.bars) {
    previousEma = ema;
    ema = add(mul(D("0.2"), D(b.close)), mul(D("0.8"), ema));
  }
  return {
    cumulative: div(sumVolume, base, 12),
    window: n < 6 ? null : div(total(vs.slice(-6)), aggregate(n - 6, n), 12),
    bar: div(D(last.volume), barBase, 12),
    vwap: vwaps[n - 1],
    vwaps,
    ema,
    previousEma,
    barRatios: f.bars.map((b, i) => {
      const v = aggregate(i, i + 1);
      if (cmp(v, Z()) <= 0) throw new Error("ZERO_BAR_BASELINE");
      return div(D(b.volume), v, 12);
    }),
    imbalance: div(sub(D(last.buyVolume), D(last.sellVolume)), signed, 12),
  };
}
function signal(
  f: VolumeFrame,
  x: Features,
): { prism: string | null; stop: Dec | null; reason: string } {
  const n = f.bars.length,
    bars = f.bars,
    last = bars[n - 1],
    c = D(last.close),
    minutes = n * 5;
  if (!f.context.marketSectorAligned)
    return { prism: null, stop: null, reason: "MARKET_SECTOR_NOT_ALIGNED" };
  if (cmp(c, x.vwap) <= 0 || cmp(c, x.ema) <= 0 || cmp(x.ema, x.previousEma) <= 0)
    return { prism: null, stop: null, reason: "VWAP_EMA_NOT_ALIGNED" };
  if (cmp(x.imbalance, D(P.signal.imbalanceFloor)) < 0)
    return { prism: null, stop: null, reason: "SIGNED_IMBALANCE_NOT_CONFIRMED" };
  if (cmp(sub(c, x.vwap), mul(D(f.atr.value), D(P.signal.maxVwapDistanceAtr))) > 0)
    return { prism: null, stop: null, reason: "EXTENDED_FROM_VWAP" };
  if (minutes >= 20 && minutes <= 60) {
    const openingHigh = bars
      .slice(0, 3)
      .map((b) => D(b.high))
      .reduce(high);
    if (
      cmp(c, openingHigh) > 0 &&
      cmp(D(bars[n - 2].close), openingHigh) <= 0 &&
      cmp(x.bar, D(P.signal.breakoutBarRvol)) >= 0
    ) {
      const openingLow = bars
        .slice(0, 3)
        .map((b) => D(b.low))
        .reduce(low);
      return {
        prism: "ORB15_CONTINUATION",
        stop: sub(openingLow, mul(D(f.atr.value), D(P.risk.stopBufferAtr))),
        reason: "CLOSED_BAR_BREAKOUT",
      };
    }
  }
  if (
    minutes >= 30 &&
    minutes <= 300 &&
    n >= 5 &&
    x.window !== null &&
    cmp(x.window, D("1")) >= 0
  ) {
    // Confirmation is excluded from the impulse/pullback intensity windows.
    const prior = bars.slice(0, -1);
    let anchor = -1;
    for (let i = 1; i < prior.length; i++)
      if (cmp(D(prior[i].close), x.vwaps[i]) > 0 && cmp(D(prior[i - 1].close), x.vwaps[i - 1]) <= 0)
        anchor = i;
    if (anchor >= 0) {
      let peak = anchor;
      for (let i = anchor + 1; i < prior.length; i++)
        if (cmp(D(prior[i].high), D(prior[peak].high)) >= 0) peak = i;
      const impulse = peak - anchor + 1,
        pullback = prior.length - peak - 1;
      if (impulse >= 3 && impulse <= 12 && pullback >= 1 && pullback <= 6 && pullback <= impulse) {
        const impulseIntensity = mean(x.barRatios.slice(anchor, peak + 1));
        const pullbackIntensity = mean(x.barRatios.slice(peak + 1, n - 1));
        const holds = prior
          .slice(peak + 1)
          .every((b, k) => cmp(D(b.low), x.vwaps[peak + 1 + k]) >= 0);
        if (
          holds &&
          cmp(pullbackIntensity, mul(impulseIntensity, D(P.signal.pullbackRatio))) <= 0 &&
          cmp(c, D(prior.at(-1)!.high)) > 0 &&
          cmp(x.bar, D(P.signal.pullbackBarRvol)) >= 0
        ) {
          const stop = sub(
            prior
              .slice(peak + 1)
              .map((b) => D(b.low))
              .reduce(low),
            mul(D(f.atr.value), D(P.risk.stopBufferAtr)),
          );
          return { prism: "VWAP_PULLBACK", stop, reason: "CAUSAL_PULLBACK_RECLAIM" };
        }
      }
    }
  }
  return { prism: null, stop: null, reason: "NO_QUALIFYING_SETUP" };
}
/** Every supplied name receives a disposition; never silently drops blocked candidates. */
export function evaluateVolumeCohort(raw: unknown[]): VolumeCandidate[] {
  if (!Array.isArray(raw) || raw.length < 1 || raw.length > 500)
    throw new Error("COHORT_SIZE_INVALID");
  const rows = raw.map((input) => {
    const parsed = volumeFrameSchema.safeParse(input);
    if (!parsed.success)
      return {
        f: null,
        x: null,
        error: result({}, { status: "INVALID_INPUT", reasons: ["INVALID_FRAME_SCHEMA"] }),
      };
    const f = parsed.data;
    try {
      validFrame(f);
      if (
        f.sourceState !== "VERIFIED" ||
        f.calendarState !== "VERIFIED" ||
        f.securityState !== "US_COMMON_VERIFIED" ||
        (f.mode !== "FIXTURE" && f.feed !== "SIP") ||
        (f.mode === "FIXTURE" && f.feed !== "FIXTURE") ||
        f.haltState !== "CLEAR" ||
        f.corporateActionState !== "CLEAR" ||
        f.context.marketSectorAligned === null
      )
        throw new Error("REQUIRED_EVIDENCE_UNVERIFIED");
      return { f, x: features(f), error: null };
    } catch (e) {
      return {
        f,
        x: null,
        error: result(f, {
          reasons: [e instanceof Error ? e.message : "INVALID_EVIDENCE"],
          inputHash: volumeResearchHash("frame", f),
        }),
      };
    }
  });
  const valid = rows.filter((r) => r.f !== null),
    seen = new Set<string>();
  const first = valid[0]?.f;
  const incomplete =
    rows.some((r) => !r.f || !r.x) ||
    valid.some((r) => {
      const f = r.f!;
      const duplicate = seen.has(f.securityId);
      seen.add(f.securityId);
      return (
        duplicate ||
        !f.universeComplete ||
        Number(f.universeExpectedCount) !== rows.length ||
        f.decisionAt !== first?.decisionAt ||
        f.sessionDate !== first?.sessionDate ||
        f.universeSnapshotId !== first?.universeSnapshotId ||
        f.mode !== first?.mode ||
        f.openAt !== first?.openAt ||
        f.closeAt !== first?.closeAt
      );
    });
  const ranked = rows
    .filter((r) => r.x && r.f)
    .sort(
      (a, b) =>
        cmp(b.x!.cumulative, a.x!.cumulative) ||
        Buffer.compare(Buffer.from(a.f!.securityId), Buffer.from(b.f!.securityId)),
    );
  return rows.map((r) => {
    if (r.error) return r.error;
    const f = r.f!,
      x = r.x!,
      rank = ranked.indexOf(r) + 1;
    const base: Partial<VolumeCandidate> = {
      rank: String(rank),
      rvolCumulative: F(x.cumulative),
      rvolWindow30: x.window === null ? null : F(x.window),
      rvolBar: F(x.bar),
      signedImbalance: F(x.imbalance),
      vwap: F(x.vwap),
      ema9: F(x.ema),
      referencePrice: f.bars.at(-1)!.close,
      atr: f.atr.value,
      inputHash: volumeResearchHash("frame", f),
    };
    if (incomplete) return result(f, { ...base, reasons: ["UNIVERSE_RANK_UNVERIFIED"] });
    if (rank > Number(P.selection.topK))
      return result(f, { ...base, status: "NO_SETUP", reasons: ["OUTSIDE_TOP_K"] });
    if (
      cmp(D(f.quote.ask), D(P.selection.minimumPrice)) < 0 ||
      cmp(D(f.bars.at(-1)!.close), D(P.selection.minimumPrice)) < 0
    )
      return result(f, { ...base, status: "NO_SETUP", reasons: ["PRICE_BELOW_MINIMUM"] });
    const s = signal(f, x);
    if (!s.stop) return result(f, { ...base, status: "NO_SETUP", reasons: [s.reason] });
    const distance = sub(D(f.quote.ask), s.stop),
      spread = sub(D(f.quote.ask), D(f.quote.bid));
    const mid = div(add(D(f.quote.ask), D(f.quote.bid)), D("2"), 12);
    if (
      cmp(s.stop, Z()) <= 0 ||
      cmp(distance, Z()) <= 0 ||
      cmp(distance, mul(D(f.atr.value), D(P.risk.maxStopAtr))) > 0 ||
      cmp(spread, mul(distance, D(P.risk.maxSpreadRiskFraction))) > 0 ||
      cmp(mul(spread, D("10000")), mul(mid, D(P.risk.maxSpreadBps))) > 0
    )
      return result(f, {
        ...base,
        status: "NO_SETUP",
        reasons: ["STRUCTURAL_STOP_OR_SPREAD_INFEASIBLE"],
      });
    return result(f, {
      ...base,
      status: "LONG_CANDIDATE",
      prism: s.prism,
      structuralStop: F(s.stop),
      reasons: [s.reason],
    });
  });
}
