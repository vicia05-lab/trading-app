type Row = Record<string, string | boolean | null>;
const SCALE = 1_000_000_000n;
function amount(value: unknown): bigint | null {
  if (typeof value !== "string" || !/^[0-9]+(?:\.[0-9]{1,9})?$/.test(value)) return null;
  const [whole, fraction = ""] = value.split(".");
  return BigInt(whole) * SCALE + BigInt(fraction.padEnd(9, "0"));
}

/** Market buys use dollar notional so a stale quote cannot understate the ticket. */
export function buyReservationNotional(args: { type: "market" | "limit"; notional?: string; qty?: string; limitPrice?: string }): string {
  if (args.notional) return args.notional;
  if (args.type !== "limit") throw new Error("PAPER_SIZE_REQUIRED: market buys must use dollar notional; share buys require a limit price.");
  const quantity = amount(args.qty), price = amount(args.limitPrice);
  if (quantity === null || price === null || quantity <= 0n || price <= 0n) throw new Error("Invalid paper reservation size");
  const divisor = SCALE * SCALE / 100n;
  const cents = (quantity * price + divisor - 1n) / divisor;
  return (cents / 100n).toString() + "." + (cents % 100n).toString().padStart(2, "0");
}

/** Release a local reservation only after terminal broker evidence is reflected in holdings. */
export function reservationSettled(receipt: Row, positions: Row[]): boolean {
  const status = String(receipt.status ?? "").toLowerCase();
  if (!["filled", "canceled", "expired", "rejected"].includes(status)) return false;
  const filled = amount(receipt.filled_qty);
  if (filled === null) return false;
  if (filled === 0n) return status !== "filled";
  const position = positions.find((p) => p.symbol === receipt.symbol);
  const held = amount(position?.qty);
  return held !== null && held >= filled;
}
