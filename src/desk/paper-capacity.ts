type BrokerRow = Record<string, string | boolean | null>;
const SCALE = 1_000_000n;
function decimal(value: unknown): bigint {
  if (typeof value !== "string" || !/^-?[0-9]+(?:\.[0-9]{1,6})?$/.test(value)) {
    throw new Error("Paper capacity unavailable: invalid broker amount");
  }
  const negative = value.startsWith("-");
  const [whole, fraction = ""] = value.replace(/^-/, "").split(".");
  const result = BigInt(whole) * SCALE + BigInt(fraction.padEnd(6, "0"));
  return negative ? -result : result;
}
function symbolOf(row: BrokerRow): string {
  if (typeof row.symbol !== "string" || !/^[A-Z][A-Z.]{0,9}$/.test(row.symbol)) {
    throw new Error("Paper capacity unavailable: unsupported broker symbol");
  }
  return row.symbol;
}
/** Conservative preflight only: broker snapshots are not an atomic order reservation. */
export function paperCapacity(positions: BrokerRow[], orders: BrokerRow[], maxSlots = 3, maxGross = "15000.00") {
  if (orders.length >= 500) throw new Error("Paper capacity unavailable: order list may be truncated");
  const symbols = new Set<string>();
  const held = new Map<string, unknown>();
  const remainingLong = new Map<string, bigint>();
  let gross = 0n;
  const limit = decimal(maxGross);
  for (const row of positions) {
    const symbol = symbolOf(row);
    const value = decimal(row.market_value);
    if (value === 0n) throw new Error("Paper capacity unavailable: zero-valued position");
    gross += value < 0n ? -value : value;
    symbols.add(symbol); held.set(symbol, row.qty);
  }
  for (const row of orders) {
    const symbol = symbolOf(row);
    symbols.add(symbol);
    if (row.side === "sell") {
      if (!held.has(symbol)) throw new Error("Paper capacity unavailable: uncovered sell order");
      const quantity = decimal(row.qty);
      const available = remainingLong.get(symbol) ?? decimal(held.get(symbol));
      if (quantity <= 0n || available < quantity) throw new Error("Paper capacity unavailable: uncovered sell quantity");
      remainingLong.set(symbol, available - quantity);
      continue; // A covered, unfilled sell still does not release gross exposure.
    }
    if (row.side !== "buy") throw new Error("Paper capacity unavailable: unknown order side");
    let reserved: bigint;
    if (typeof row.notional === "string" && row.notional !== "") reserved = decimal(row.notional);
    else {
      const quantity = decimal(row.qty);
      const price = decimal(row.limit_price);
      if (quantity <= 0n || price <= 0n) throw new Error("Paper capacity unavailable: unsized open order");
      reserved = (quantity * price + SCALE - 1n) / SCALE;
    }
    if (reserved <= 0n) throw new Error("Paper capacity unavailable: nonpositive open order");
    gross += reserved; // Full size is conservative for partially filled orders.
  }
  return {
    reason(symbol: string, notional: string): string | null {
      const amount = decimal(notional);
      if (amount <= 0n || amount > 5000n * SCALE) return "Paper ticket cap ($5,000)";
      if (symbols.has(symbol)) return "Existing position or pending order";
      if (symbols.size >= maxSlots) return "Paper account slot cap (3)";
      if (gross + amount > limit) return "Paper account gross cap ($15,000)";
      return null;
    },
    reserve(symbol: string, notional: string) {
      const reason = this.reason(symbol, notional);
      if (reason) throw new Error(reason);
      symbols.add(symbol); gross += decimal(notional);
    },
  };
}
