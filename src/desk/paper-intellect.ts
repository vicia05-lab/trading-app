import { getClock, getSnapshots, publicStatus, submitOrder } from "./alpaca";
import { NOTIONAL_RE, venueTicker } from "./venue-size";
import { getSql } from "@/lib/db";
import {
  INTELLECT_MAX_SLOTS,
  INTELLECT_TICKET,
  evaluateStrategy,
  lastInsideQuote,
  quotesReady,
  spyAllows,
  spreadTooWide,
  type IntellectDecision,
} from "./paper-intellect-rules";

export { evaluateStrategy, INTELLECT_TICKET, INTELLECT_MAX_SLOTS } from "./paper-intellect-rules";
export type { IntellectAction, IntellectDecision } from "./paper-intellect-rules";

export type IntellectCycleRow = {
  symbol: string;
  decision: IntellectDecision;
  orderId?: string;
};

async function frozenTickers(): Promise<Set<string>> {
  const sql = await getSql();
  const rows = await sql.query<{ t: string }>(
    `SELECT DISTINCT upper(display_ticker) AS t FROM "position"
     WHERE state IN ('COMMITTED_IRREVOCABLE','FILLED','IMPAIRED_ENTRY','IMPAIRED_EXIT')
       AND display_ticker IS NOT NULL
     UNION
     SELECT DISTINCT upper(mm.display_ticker) AS t
     FROM "freeze" f
     JOIN manifest_member mm
       ON mm.manifest_id = f.manifest_id
      AND mm.permanent_security_id = f.permanent_security_id
     JOIN manifest m ON m.manifest_id = f.manifest_id
     WHERE m.session_date = CURRENT_DATE
       AND mm.display_ticker IS NOT NULL`,
  );
  return new Set(rows.map((r) => r.t));
}

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

  const clock = await getClock();
  const open = clock.is_open === true || clock.is_open === "true";
  if (!open) {
    return {
      connected: true,
      mode: "PAPER",
      results: [],
      summary: "Venue clock is closed. Market orders stay off.",
    };
  }

  const symbols = [...new Set(args.symbols.map((s) => venueTicker(s)).filter((s): s is string => Boolean(s)))];
  if (!symbols.length) {
    return { connected: true, mode: "PAPER", results: [], summary: "No listed tickers after venue filter." };
  }

  let frozen = new Set<string>();
  try {
    frozen = await frozenTickers();
  } catch {
    return {
      connected: true,
      mode: "PAPER",
      results: [],
      summary: "Kernel freeze lookup failed. Sleeve stands down.",
    };
  }

  const snaps = await getSnapshots([...new Set([...symbols, "SPY"])]);
  const spy = snaps.find((s) => s.symbol === "SPY");
  const results: IntellectCycleRow[] = [];
  let bought = 0;
  for (const symbol of symbols) {
    if (bought >= INTELLECT_MAX_SLOTS) {
      results.push({ symbol, decision: { action: "HOLD", reason: "Slot cap (3 × $5,000)" } });
      continue;
    }
    if (frozen.has(symbol)) {
      results.push({ symbol, decision: { action: "HOLD", reason: "Kernel freeze/commit window" } });
      continue;
    }
    const snap = snaps.find((s) => s.symbol === symbol);
    const bid = snap?.bid ?? null;
    const ask = snap?.ask ?? null;
    const last = snap?.last ?? null;
    if (!quotesReady(bid, ask) || !lastInsideQuote(last, bid, ask)) {
      results.push({ symbol, decision: { action: "HOLD", reason: "No usable NBBO-style quote" } });
      continue;
    }
    if (spreadTooWide(bid, ask)) {
      results.push({ symbol, decision: { action: "HOLD", reason: "Bid/ask spread wider than 1%" } });
      continue;
    }
    const decision = evaluateStrategy({
      last,
      vwap: snap?.vwap ?? last,
      change_pct: snap?.change_pct ?? null,
    });
    if (decision.action !== "BUY" || !decision.kind || !decision.notional || !NOTIONAL_RE.test(decision.notional)) {
      results.push({ symbol, decision });
      continue;
    }
    if (!spyAllows(decision.kind, spy?.change_pct ?? null)) {
      results.push({
        symbol,
        decision: { action: "HOLD", reason: `SPY filter blocked ${decision.kind.toLowerCase()}` },
      });
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
