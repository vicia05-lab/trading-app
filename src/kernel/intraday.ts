/** Server-side intraday RESEARCH extension. No orders, reservations, P&L or new sequencer.
 * Reuses the existing TypeScript numeric/hash kernel; does not modify earnings semantics.
 * All input provenance still requires a trusted data adapter. Structural checks are not authentication.
 */
import {
  add,
  sub,
  mul,
  div,
  cmp,
  dec,
  decToCanonical,
  canon,
  field,
  sha256,
  ident,
} from "./index.ts";
import type { IntradayStrategyId } from "../desk/intraday-catalog.ts";

export type IntradayBar = {
  id: string;
  startAt: string;
  availableAt: string;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
  tradeVwap: string;
};
export type IntradayHistory = {
  sessionDate: string;
  availableAt: string;
  open: string;
  high: string;
  low: string;
  close: string;
  previousClose: string;
  volume: string;
  openingVolume: string;
  sameMinute: string;
  sameMinuteClose: string;
};
export type IntradayFrame = {
  schema: "1";
  strategyId: IntradayStrategyId;
  securityId: string;
  instrument: "US_COMMON" | "SPY_ETF";
  sessionDate: string;
  mode: "FIXTURE" | "HISTORICAL" | "PROSPECTIVE";
  feed: "FIXTURE" | "SIP" | "IEX" | "DELAYED_SIP";
  openAt: string;
  closeAt: string;
  asOfAt: string;
  calendarState: "VERIFIED" | "NOT_CHECKED";
  sourceState: "VERIFIED" | "NOT_CHECKED";
  haltState: "CLEAR" | "HALTED" | "UNKNOWN";
  corporateActionState: "CLEAR" | "EVENT" | "UNKNOWN";
  universeSnapshotId: string;
  openingRank: string | null;
  rankAvailableAt: string | null;
  bars: IntradayBar[];
  history: IntradayHistory[];
  quote: { bid: string; ask: string; observedAt: string; availableAt: string };
};
export type IntradayResult = {
  strategyId: string;
  status: "LONG_SETUP" | "NO_SETUP" | "WAIT" | "BLOCKED" | "INVALID_INPUT";
  direction: "LONG" | null;
  reasons: string[];
  referencePrice: string | null;
  invalidationPrice: string | null;
  exitDueAt: string | null;
  metrics: Record<string, string>;
  inputHash: string | null;
  resultHash: string | null;
  dataMode: string;
  paperOnly: true;
  liveTradingSupported: false;
  executionEnabled: false;
  isOrder: false;
  capitalReserved: "0.0000";
};
class InputError extends Error {}
const ids = ["ORB5_RVOL_LONG", "SPY_NOISE_VWAP_LONG", "SPY_LATE_MOM_LONG"];
const FRAME =
  "schema strategyId securityId instrument sessionDate mode feed openAt closeAt asOfAt calendarState sourceState haltState corporateActionState universeSnapshotId openingRank rankAvailableAt bars history quote";
const BAR = "id startAt availableAt open high low close volume tradeVwap";
const HIST =
  "sessionDate availableAt open high low close previousClose volume openingVolume sameMinute sameMinuteClose";
function exact(raw: unknown, keys: string): asserts raw is Record<string, unknown> {
  if (
    !raw ||
    typeof raw !== "object" ||
    Array.isArray(raw) ||
    Object.getPrototypeOf(raw) !== Object.prototype
  )
    throw new InputError("INVALID_OBJECT");
  const k = Object.keys(raw).sort().join(" ");
  if (k !== keys.split(" ").sort().join(" ")) throw new InputError("INVALID_FIELDS");
}
function utc(s: unknown): number {
  if (typeof s !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(s))
    throw new InputError("INVALID_TIME");
  const n = Date.parse(s);
  if (!Number.isFinite(n) || new Date(n).toISOString() !== s) throw new InputError("INVALID_TIME");
  return n;
}
function day(s: unknown): string {
  if (typeof s !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(s))
    throw new InputError("INVALID_SESSION");
  utc(s + "T00:00:00.000Z");
  return s;
}
function price(s: unknown) {
  if (typeof s !== "string" || s.length > 20 || !/^(0|[1-9][0-9]*)\.[0-9]{6}$/.test(s))
    throw new InputError("INVALID_PRICE");
  return dec(s, 6, "0.000001", "1000000");
}
function volume(s: unknown) {
  if (typeof s !== "string" || !/^(0|[1-9][0-9]{0,11})$/.test(s))
    throw new InputError("INVALID_VOLUME");
  return dec(s, 0, "0", "999999999999");
}
const zero = () => dec("0", 12);
const num = (s: string) => dec(s, 12);
const fmt = (x: ReturnType<typeof dec>) => decToCanonical(x, 12);
const max = (a: ReturnType<typeof dec>, b: ReturnType<typeof dec>) => (cmp(a, b) >= 0 ? a : b);
const min = (a: ReturnType<typeof dec>, b: ReturnType<typeof dec>) => (cmp(a, b) <= 0 ? a : b);
const abs = (x: ReturnType<typeof dec>) => (cmp(x, zero()) < 0 ? sub(zero(), x) : x);
const sum = (xs: ReturnType<typeof dec>[]) => xs.reduce(add, zero());
function ohlc(b: { open: string; high: string; low: string; close: string }) {
  const o = price(b.open),
    h = price(b.high),
    l = price(b.low),
    c = price(b.close);
  if (cmp(h, max(o, c)) < 0 || cmp(l, min(o, c)) > 0 || cmp(h, l) < 0)
    throw new InputError("INVALID_OHLC");
}
function enumIn(v: unknown, allowed: string[]) {
  if (typeof v !== "string" || !allowed.includes(v)) throw new InputError("INVALID_ENUM");
}
function validate(raw: unknown): IntradayFrame {
  exact(raw, FRAME);
  const f = raw as unknown as IntradayFrame;
  if (f.schema !== "1") throw new InputError("INVALID_SCHEMA");
  enumIn(f.strategyId, ids);
  ident(f.securityId);
  ident(f.universeSnapshotId);
  day(f.sessionDate);
  enumIn(f.instrument, ["US_COMMON", "SPY_ETF"]);
  enumIn(f.mode, ["FIXTURE", "HISTORICAL", "PROSPECTIVE"]);
  enumIn(f.feed, ["FIXTURE", "SIP", "IEX", "DELAYED_SIP"]);
  enumIn(f.calendarState, ["VERIFIED", "NOT_CHECKED"]);
  enumIn(f.sourceState, ["VERIFIED", "NOT_CHECKED"]);
  enumIn(f.haltState, ["CLEAR", "HALTED", "UNKNOWN"]);
  enumIn(f.corporateActionState, ["CLEAR", "EVENT", "UNKNOWN"]);
  const o = utc(f.openAt),
    c = utc(f.closeAt),
    t = utc(f.asOfAt);
  if (
    c <= o ||
    ![210, 390].includes((c - o) / 60000) ||
    f.openAt.slice(0, 10) !== f.sessionDate ||
    f.closeAt.slice(0, 10) !== f.sessionDate
  )
    throw new InputError("INVALID_SESSION_WINDOW");
  if (t < o || t >= c) throw new InputError("OUTSIDE_SESSION");
  if (!Array.isArray(f.bars) || f.bars.length < 1 || f.bars.length > 390)
    throw new InputError("INVALID_BARS");
  const seen = new Set<string>();
  for (let i = 0; i < f.bars.length; i++) {
    const b = f.bars[i];
    exact(b, BAR);
    ident(b.id);
    if (seen.has(b.id)) throw new InputError("DUPLICATE_BAR");
    seen.add(b.id);
    const start = utc(b.startAt),
      available = utc(b.availableAt),
      end = start + 60000;
    if (start !== o + i * 60000 || end > c) throw new InputError("NONCONTIGUOUS_BARS");
    if (available < end || available > t || end > t) throw new InputError("UNAVAILABLE_BAR");
    ohlc(b);
    const v = volume(b.volume),
      w = price(b.tradeVwap);
    if (cmp(v, zero()) <= 0 || cmp(w, price(b.low)) < 0 || cmp(w, price(b.high)) > 0)
      throw new InputError("INVALID_BAR_VOLUME_OR_VWAP");
  }
  const lastEnd = o + f.bars.length * 60000;
  if (t - lastEnd > 60000) throw new InputError("STALE_BARS");
  if (!Array.isArray(f.history) || f.history.length !== 14)
    throw new InputError("HISTORY_REQUIRES_14_SESSIONS");
  let previous = "";
  for (const h of f.history) {
    exact(h, HIST);
    day(h.sessionDate);
    if (
      h.sessionDate <= previous ||
      h.sessionDate >= f.sessionDate ||
      utc(h.availableAt) >= o ||
      utc(h.availableAt) < utc(h.sessionDate + "T00:00:00.000Z")
    )
      throw new InputError("INVALID_HISTORY_TIME");
    previous = h.sessionDate;
    ohlc(h);
    price(h.previousClose);
    const same = price(h.sameMinuteClose);
    if (cmp(same, price(h.low)) < 0 || cmp(same, price(h.high)) > 0)
      throw new InputError("INVALID_HISTORY_PRICE");
    if (h.sameMinute !== String(f.bars.length)) throw new InputError("WRONG_HISTORY_HORIZON");
    if (
      cmp(volume(h.volume), zero()) <= 0 ||
      cmp(volume(h.openingVolume), zero()) <= 0 ||
      cmp(volume(h.openingVolume), volume(h.volume)) > 0
    )
      throw new InputError("INVALID_HISTORY_VOLUME");
  }
  exact(f.quote, "bid ask observedAt availableAt");
  if (cmp(price(f.quote.ask), price(f.quote.bid)) < 0) throw new InputError("CROSSED_QUOTE");
  const qt = utc(f.quote.observedAt),
    qa = utc(f.quote.availableAt);
  if (qt > qa || qa > t || t - qt > 2000 || qt < lastEnd)
    throw new InputError("STALE_OR_FUTURE_QUOTE");
  if (
    f.openingRank !== null &&
    (typeof f.openingRank !== "string" || !/^[1-9][0-9]{0,4}$/.test(f.openingRank))
  )
    throw new InputError("INVALID_RANK");
  if (f.rankAvailableAt !== null) utc(f.rankAvailableAt);
  return f;
}

/** Research signals only. No browser-computed fills, no broker import, no DB writes. */
export function evaluateIntraday(raw: unknown): IntradayResult {
  let f: IntradayFrame;
  const base: IntradayResult = {
    strategyId: "UNKNOWN",
    status: "INVALID_INPUT",
    direction: null,
    reasons: [],
    referencePrice: null,
    invalidationPrice: null,
    exitDueAt: null,
    metrics: {},
    inputHash: null,
    resultHash: null,
    dataMode: "UNKNOWN",
    paperOnly: true,
    liveTradingSupported: false,
    executionEnabled: false,
    isOrder: false,
    capitalReserved: "0.0000",
  };
  try {
    f = validate(raw);
  } catch (e) {
    return { ...base, reasons: [e instanceof InputError ? e.message : "INVALID_INPUT"] };
  }
  const input = sha256(
    Buffer.concat([field(Buffer.from("Trading App|intraday-input|1")), field(canon(f))]),
  );
  const done = (
    status: IntradayResult["status"],
    reason: string,
    metrics: Record<string, string> = {},
    stop: string | null = null,
  ): IntradayResult => {
    const out = {
      ...base,
      strategyId: f.strategyId,
      status,
      direction: status === "LONG_SETUP" ? ("LONG" as const) : null,
      reasons: [reason],
      metrics,
      invalidationPrice: stop,
      referencePrice: f.bars.at(-1)!.close,
      exitDueAt: new Date(utc(f.closeAt) - 5 * 60000).toISOString(),
      dataMode: f.mode,
      inputHash: input,
    };
    return {
      ...out,
      resultHash: sha256(
        Buffer.concat([field(Buffer.from("Trading App|intraday-result|1")), field(canon(out))]),
      ),
    };
  };
  if (f.calendarState !== "VERIFIED" || f.sourceState !== "VERIFIED")
    return done("BLOCKED", "READINESS_NOT_VERIFIED");
  if ((f.mode === "FIXTURE") !== (f.feed === "FIXTURE"))
    return done("BLOCKED", "DATA_MODE_MISMATCH");
  if (f.mode !== "FIXTURE" && f.feed !== "SIP")
    return done("BLOCKED", "CONSOLIDATED_DATA_REQUIRED");
  if (f.haltState !== "CLEAR" || f.corporateActionState !== "CLEAR")
    return done("BLOCKED", "HALT_OR_CORPORATE_ACTION_UNRESOLVED");
  const open = utc(f.openAt),
    closeTime = utc(f.closeAt),
    now = utc(f.asOfAt),
    minute = f.bars.length;
  if (now >= closeTime - 15 * 60000) return done("WAIT", "ENTRY_CUTOFF");
  if (cmp(price(f.bars[0].open), num("5")) <= 0 || cmp(price(f.bars.at(-1)!.close), num("5")) < 0)
    return done("BLOCKED", "PRICE_BELOW_POLICY");
  const bid = price(f.quote.bid),
    ask = price(f.quote.ask);
  // exact inequality: (ask-bid)/mid > .001, no rounded division at the gate.
  if (cmp(mul(sub(ask, bid), num("2")), mul(add(ask, bid), num("0.001"))) > 0)
    return done("BLOCKED", "SPREAD_TOO_WIDE");
  const last = price(f.bars.at(-1)!.close);
  if (f.strategyId === "ORB5_RVOL_LONG") {
    if (f.instrument !== "US_COMMON") return done("NO_SETUP", "COMMON_STOCK_ONLY");
    if (minute < 6) return done("WAIT", "WAIT_FOR_POST_RANGE_CLOSED_BAR");
    if (f.openingRank === null || f.rankAvailableAt === null)
      return done("BLOCKED", "MISSING_0935_UNIVERSE_RANK");
    if (
      utc(f.rankAvailableAt) < open + 5 * 60000 ||
      utc(f.rankAvailableAt) > open + 6 * 60000 ||
      utc(f.rankAvailableAt) > now
    )
      return done("BLOCKED", "RANK_NOT_FROZEN_AT_OPENING_WINDOW");
    const totalVol = sum(f.history.map((h) => volume(h.volume)));
    const atr = div(
      sum(
        f.history.map((h) =>
          max(
            sub(price(h.high), price(h.low)),
            max(
              abs(sub(price(h.high), price(h.previousClose))),
              abs(sub(price(h.low), price(h.previousClose))),
            ),
          ),
        ),
      ),
      num("14"),
      12,
    );
    const openingVol = sum(f.bars.slice(0, 5).map((b) => volume(b.volume)));
    const oldOpenVol = sum(f.history.map((h) => volume(h.openingVolume)));
    const rv = div(mul(openingVol, num("14")), oldOpenVol, 12);
    const high = f.bars
      .slice(0, 5)
      .map((b) => price(b.high))
      .reduce(max);
    const metrics = {
      openingHigh: fmt(high),
      openingRvol: fmt(rv),
      priorAtr: fmt(atr),
      rank: f.openingRank,
    };
    if (
      cmp(totalVol, num("14000000")) < 0 ||
      cmp(atr, num("0.5")) <= 0 ||
      cmp(mul(openingVol, num("14")), oldOpenVol) < 0 ||
      Number(f.openingRank) > 20
    )
      return done("NO_SETUP", "STOCK_NOT_IN_PLAY", metrics);
    if (cmp(price(f.bars[4].close), price(f.bars[0].open)) <= 0)
      return done("NO_SETUP", "OPENING_CANDLE_NOT_BULLISH", metrics);
    if (cmp(last, high) <= 0 || cmp(price(f.bars.at(-2)!.close), high) > 0)
      return done("NO_SETUP", "NO_NEW_CLOSED_BAR_BREAKOUT", metrics);
    const stop = sub(last, mul(atr, num("0.1")));
    if (cmp(stop, zero()) <= 0) return done("BLOCKED", "INVALID_STOP_REFERENCE", metrics);
    return done("LONG_SETUP", "OPENING_RANGE_BREAKOUT", metrics, fmt(stop));
  }
  if (f.instrument !== "SPY_ETF") return done("NO_SETUP", "SPY_IDENTITY_REQUIRED");
  if (f.strategyId === "SPY_LATE_MOM_LONG") {
    if (closeTime - open !== 390 * 60000) return done("WAIT", "EARLY_CLOSE_VARIANT_NOT_VALIDATED");
    if (minute !== 360) return done("WAIT", "WAIT_FOR_1530_CHECKPOINT");
    const morning = price(f.bars[29].close),
      previous = price(f.history[13].close);
    const metrics = { priorClose: fmt(previous), tenAmPrice: fmt(morning) };
    return done(
      cmp(morning, previous) > 0 ? "LONG_SETUP" : "NO_SETUP",
      cmp(morning, previous) > 0 ? "POSITIVE_MORNING_RETURN" : "MORNING_RETURN_NOT_POSITIVE",
      metrics,
    );
  }
  if (minute < 30 || minute % 30 !== 0) return done("WAIT", "WAIT_FOR_30_MINUTE_CHECKPOINT");
  const moves = f.history.map((h) =>
    abs(sub(div(price(h.sameMinuteClose), price(h.open), 12), num("1"))),
  );
  // Each historical move and its mean are explicitly rounded to 12 places in policy v1.
  const sigma = div(sum(moves), num("14"), 12);
  const upper = mul(max(price(f.bars[0].open), price(f.history[13].close)), add(num("1"), sigma));
  const vwap = div(
    sum(f.bars.map((b) => mul(price(b.tradeVwap), volume(b.volume)))),
    sum(f.bars.map((b) => volume(b.volume))),
    12,
  );
  const boundary = max(upper, vwap),
    metrics = { meanAbsoluteMove: fmt(sigma), upperBand: fmt(upper), sessionVwap: fmt(vwap) };
  if (cmp(last, boundary) <= 0) return done("NO_SETUP", "WITHIN_NOISE_OR_BELOW_VWAP", metrics);
  return done("LONG_SETUP", "ABOVE_NOISE_BAND_AND_VWAP", metrics, fmt(boundary));
}
