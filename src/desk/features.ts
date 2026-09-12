import {
  computeCardComplete,
  dec,
  decToCanonical,
  mul,
  quantizeHalfUp,
  sub,
} from "@/kernel/index";

export type TypedCard = {
  timing_quality: "ISSUER_CONFIRMED" | "ESTIMATED" | null;
  card_complete: boolean;
  options_valid: boolean;
  implied_move: string | null;
  benchmark_relative_5d: string | null;
  benchmark_relative_63d: string | null;
};

export type OptionLeg = {
  right: "C" | "P";
  strike: string;
  expiry: string;
  bid: string;
  ask: string;
  oi: number;
  volume: number;
  asOf: string;
};

export function relativeReturn(factors: string[]): string | null {
  if (!factors.length) return null;
  let acc = dec("1", 12);
  for (const f of factors) {
    try {
      acc = mul(acc, dec(f, 12, "0.000000000001", "1000000"));
    } catch {
      return null;
    }
  }
  const r = sub(acc, dec("1", 0));
  return decToCanonical(quantizeHalfUp(r, 12), 12);
}

export function benchmarkRelative(stockFactors: string[], benchFactors: string[]): string | null {
  if (stockFactors.length !== benchFactors.length || stockFactors.length === 0) return null;
  const s = relativeReturn(stockFactors);
  const b = relativeReturn(benchFactors);
  if (s == null || b == null) return null;
  const diff = sub(dec(s, 12, "-1000000", "1000000"), dec(b, 12, "-1000000", "1000000"));
  return decToCanonical(quantizeHalfUp(diff, 12), 12);
}

export function impliedMove(callMid: string, putMid: string, stockMid: string): string | null {
  try {
    const c = dec(callMid, 6, "0.000001", "1000000");
    const p = dec(putMid, 6, "0.000001", "1000000");
    const s = dec(stockMid, 6, "0.000001", "1000000");
    const sum = { ...c, unscaled: c.unscaled + p.unscaled, scale: 6 };
    // (c+p)/s
    const num = c.unscaled + p.unscaled;
    const den = s.unscaled;
    const extra = 16;
    const q = (num * 10n ** BigInt(extra)) / den;
    const r = (num * 10n ** BigInt(extra)) % den;
    const raw = { neg: false, unscaled: r * 2n >= den ? q + 1n : q, scale: extra };
    const mv = decToCanonical(quantizeHalfUp(raw, 12), 12);
    const v = dec(mv, 12, "0.000000000001", "5");
    void v;
    void sum;
    return mv;
  } catch {
    return null;
  }
}

export function optionRelativeSpread(bid: string, ask: string): number | null {
  try {
    const b = Number(bid);
    const a = Number(ask);
    if (!(a >= b) || b <= 0 || a <= 0) return null;
    const mid = (a + b) / 2;
    return (a - b) / mid;
  } catch {
    return null;
  }
}

export function selectStraddle(
  stockMid: string,
  d: string,
  d1OpenIso: string,
  legs: OptionLeg[],
): { call: OptionLeg; put: OptionLeg; valid: boolean; reason?: string } | { valid: false; reason: string } {
  const mid = Number(stockMid);
  const dDate = new Date(d + "T00:00:00Z");
  const maxExpiry = new Date(dDate.getTime() + 45 * 86400000);
  const d1 = new Date(d1OpenIso);
  const byExpiry = new Map<string, OptionLeg[]>();
  for (const leg of legs) {
    const exp = new Date(leg.expiry + "T23:59:59Z");
    if (!(exp > d1) || exp > maxExpiry) continue;
    const list = byExpiry.get(leg.expiry) ?? [];
    list.push(leg);
    byExpiry.set(leg.expiry, list);
  }
  const expiries = [...byExpiry.keys()].sort();
  if (!expiries.length) return { valid: false, reason: "NO_ELIGIBLE_EXPIRY" };
  const first = expiries[0];
  const group = byExpiry.get(first) ?? [];
  const calls = group.filter((l) => l.right === "C");
  const puts = group.filter((l) => l.right === "P");
  const pairs: { call: OptionLeg; put: OptionLeg; dist: number; strike: number }[] = [];
  for (const c of calls) {
    const p = puts.find((x) => x.strike === c.strike);
    if (!p) continue;
    const k = Number(c.strike);
    pairs.push({ call: c, put: p, dist: Math.abs(k / mid - 1), strike: k });
  }
  if (!pairs.length) return { valid: false, reason: "NO_MATCHED_STRIKE" };
  pairs.sort((a, b) => a.dist - b.dist || a.strike - b.strike);
  const chosen = pairs[0];
  if (chosen.dist > 0.02) return { valid: false, reason: "ATM_DISTANCE" };
  for (const leg of [chosen.call, chosen.put]) {
    if (!(Number(leg.bid) > 0) || Number(leg.ask) < Number(leg.bid)) return { valid: false, reason: "QUOTE_SIDE" };
    const sp = optionRelativeSpread(leg.bid, leg.ask);
    if (sp == null || sp > 0.2) return { valid: false, reason: "LEG_SPREAD" };
    if (leg.oi < 100) return { valid: false, reason: "OPEN_INTEREST" };
    if (leg.volume < 10) return { valid: false, reason: "VOLUME" };
  }
  return { call: chosen.call, put: chosen.put, valid: true };
}

export function assembleCard(input: {
  timingQuality: "ISSUER_CONFIRMED" | "ESTIMATED" | null;
  optionsValid: boolean;
  impliedMove: string | null;
  rel5: string | null;
  rel63: string | null;
}): TypedCard {
  const card: TypedCard = {
    timing_quality: input.timingQuality,
    options_valid: input.optionsValid,
    implied_move: input.impliedMove,
    benchmark_relative_5d: input.rel5,
    benchmark_relative_63d: input.rel63,
    card_complete: false,
  };
  card.card_complete = computeCardComplete({
    timing_quality: card.timing_quality ?? undefined,
    options_valid: card.options_valid,
    implied_move: card.implied_move ?? undefined,
    benchmark_relative_5d: card.benchmark_relative_5d ?? undefined,
    benchmark_relative_63d: card.benchmark_relative_63d ?? undefined,
  });
  return card;
}
