export type IntellectAction = "BUY" | "HOLD";
export type IntellectKind = "BREAKOUT" | "DIP";

export type IntellectDecision = {
  action: IntellectAction;
  kind?: IntellectKind;
  notional?: string;
  reason: string;
};

const TICKET = "5000.00";

/** Unsigned price only. Negatives, signs, and letters fail closed. */
function unscaled6(raw: string): bigint | null {
  if (!/^[0-9]+(?:\.[0-9]{1,6})?$/.test(raw)) return null;
  const [w, f = ""] = raw.split(".");
  return BigInt(w + f.padEnd(6, "0"));
}

/** Day-change in basis points. "1.20" → 120. Invalid → null. */
export function changeBp(raw: string | null): number | null {
  if (raw == null || !/^-?[0-9]+(?:\.[0-9]+)?$/.test(raw)) return null;
  const neg = raw.startsWith("-");
  const body = neg ? raw.slice(1) : raw;
  const [w, f = ""] = body.split(".");
  const bp = Number(w) * 100 + Number((f + "00").slice(0, 2));
  if (!Number.isFinite(bp)) return null;
  return neg ? -bp : bp;
}

/** Bid and ask must both exist, be positive, and not crossed. Missing quotes fail closed. */
export function quotesReady(bid: string | null, ask: string | null): boolean {
  const b = bid != null ? unscaled6(bid) : null;
  const a = ask != null ? unscaled6(ask) : null;
  return b != null && a != null && b > 0n && a > 0n && a >= b;
}

export function lastInsideQuote(last: string | null, bid: string | null, ask: string | null): boolean {
  const L = last != null ? unscaled6(last) : null;
  const b = bid != null ? unscaled6(bid) : null;
  const a = ask != null ? unscaled6(ask) : null;
  if (L == null || b == null || a == null) return false;
  return b <= L && L <= a;
}

/** True when quotes exist and (ask-bid)/mid > 1%. Call only after quotesReady. */
export function spreadTooWide(bid: string | null, ask: string | null): boolean {
  if (!quotesReady(bid, ask)) return true;
  const b = unscaled6(bid as string)!;
  const a = unscaled6(ask as string)!;
  if (a === b) return false;
  return 200n * (a - b) > a + b;
}

/** Breakout needs SPY bp > 0. Dip needs SPY bp > −150. Missing SPY fails closed. */
export function spyAllows(kind: IntellectKind, spyChangePct: string | null): boolean {
  const bp = changeBp(spyChangePct);
  if (bp == null) return false;
  if (kind === "BREAKOUT") return bp > 0;
  return bp > -150;
}

/**
 * Paper sleeve only. BUY on VWAP breakout with 50–400 bp day change,
 * or a dip under 98% of VWAP with bp < −200. Never sizes above $5,000.
 */
export function evaluateStrategy(input: {
  last: string | null;
  vwap: string | null;
  change_pct: string | null;
}): IntellectDecision {
  const last = input.last != null ? unscaled6(input.last) : null;
  const vwap = input.vwap != null ? unscaled6(input.vwap) : null;
  const bp = changeBp(input.change_pct);
  if (last == null || vwap == null || last === 0n || vwap === 0n || bp == null) {
    return { action: "HOLD", reason: "Missing, zero, negative, or non-finite print" };
  }
  if (last > vwap && bp > 50 && bp < 400) {
    return {
      action: "BUY",
      kind: "BREAKOUT",
      notional: TICKET,
      reason: `Price above VWAP with day change ${input.change_pct}%`,
    };
  }
  if (last * 100n < vwap * 98n && bp < -200) {
    return {
      action: "BUY",
      kind: "DIP",
      notional: TICKET,
      reason: `Price more than 2% under VWAP with day change ${input.change_pct}%`,
    };
  }
  return {
    action: "HOLD",
    reason: `Neutral. last=${input.last} vwap=${input.vwap} change=${input.change_pct}%`,
  };
}

export const INTELLECT_TICKET = TICKET;
export const INTELLECT_MAX_SLOTS = 3;
