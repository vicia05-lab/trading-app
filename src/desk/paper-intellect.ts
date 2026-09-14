import { getSnapshots, publicStatus, submitOrder } from "./alpaca";
import { NOTIONAL_RE, venueTicker } from "./venue-size";
import { INTELLECT_MAX_SLOTS, INTELLECT_TICKET, evaluateStrategy, type IntellectDecision } from "./paper-intellect-rules";

export { evaluateStrategy, INTELLECT_TICKET, INTELLECT_MAX_SLOTS } from "./paper-intellect-rules";
export type { IntellectAction, IntellectDecision } from "./paper-intellect-rules";

export type IntellectCycleRow = {
  symbol: string;
  decision: IntellectDecision;
  orderId?: string;
};

export async function runIntelligentPaperCycle(args: {
  symbols: string[];
  actor: string;
}): Promise<{
  connected: boolean;
  mode: string | null;
  results: IntellectCycleRow[];
  summary: string;
}> {
  const st = await publicStatus();
  if (!st.connected) {
    return { connected: false, mode: null, results: [], summary: "No venue keys. Paste paper keys on Trade." };
  }
  if (st.mode === "LIVE") {
    return { connected: true, mode: "LIVE", results: [], summary: "Live keys are connected. Intelligent sleeve stays off." };
  }

  const symbols = [...new Set(args.symbols.map((s) => venueTicker(s)).filter((s): s is string => Boolean(s)))];
  if (!symbols.length) {
    return { connected: true, mode: "PAPER", results: [], summary: "No listed tickers after venue filter." };
  }

  const snaps = await getSnapshots(symbols);
  const results: IntellectCycleRow[] = [];
  let bought = 0;
  for (const symbol of symbols) {
    if (bought >= INTELLECT_MAX_SLOTS) {
      results.push({ symbol, decision: { action: "HOLD", reason: "Slot cap (3 × $5,000)" } });
      continue;
    }
    const snap = snaps.find((s) => s.symbol === symbol);
    const decision = evaluateStrategy({
      last: snap?.last ?? null,
      vwap: snap?.vwap ?? snap?.last ?? null,
      change_pct: snap?.change_pct ?? null,
    });
    if (decision.action !== "BUY" || !decision.notional || !NOTIONAL_RE.test(decision.notional)) {
      results.push({ symbol, decision });
      continue;
    }
    try {
      const rec = await submitOrder({
        symbol,
        side: "buy",
        type: "market",
        timeInForce: "day",
        notional: decision.notional,
        actor: args.actor,
      });
      bought += 1;
      results.push({ symbol, decision, orderId: typeof rec.id === "string" ? rec.id : undefined });
    } catch (e) {
      results.push({
        symbol,
        decision: { action: "HOLD", reason: e instanceof Error ? e.message : "Order failed" },
      });
    }
  }
  const boughtNames = results.filter((r) => r.orderId).map((r) => r.symbol);
  const summary = boughtNames.length
    ? `Paper intellect bought ${boughtNames.join(", ")} at $${INTELLECT_TICKET} each.`
    : "Paper intellect: no new tickets.";
  return { connected: true, mode: "PAPER", results, summary };
}
