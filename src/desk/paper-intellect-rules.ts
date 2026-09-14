export type IntellectAction = "BUY" | "HOLD";

export type IntellectDecision = {
  action: IntellectAction;
  notional?: string;
  reason: string;
};

const TICKET = "5000.00";

function unscaled6(raw: string): bigint | null {
  if (!/^[0-9]+(?:\.[0-9]{1,6})?$/.test(raw)) return null;
  const [w, f = ""] = raw.split(".");
  return BigInt(w + f.padEnd(6, "0"));
}

/**
 * Paper sleeve only. BUY on VWAP breakout with 0.5–4% day change,
 * or a >2% dip under 98% of VWAP. Never sizes above $5,000.
 */
export function evaluateStrategy(input: {
  last: string | null;
  vwap: string | null;
  change_pct: string | null;
}): IntellectDecision {
  const last = input.last ? unscaled6(input.last) : null;
  const vwap = input.vwap ? unscaled6(input.vwap) : null;
  const change =
    input.change_pct != null && /^-?[0-9]+(?:\.[0-9]+)?$/.test(input.change_pct) ? Number(input.change_pct) : null;
  if (last == null || vwap == null || vwap === 0n || change == null) {
    return { action: "HOLD", reason: "Missing last, VWAP, or day change" };
  }
  if (last > vwap && change > 0.5 && change < 4) {
    return {
      action: "BUY",
      notional: TICKET,
      reason: `Price above VWAP with day change ${input.change_pct}%`,
    };
  }
  if (last * 100n < vwap * 98n && change < -2) {
    return {
      action: "BUY",
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
