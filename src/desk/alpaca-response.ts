/** Pure wire-format adapters. Missing data stays missing; IEX is not NBBO. */
function record(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown> : {};
}
function decimal(value: unknown): string | null {
  if (typeof value !== "string" && typeof value !== "number") return null;
  const text = String(value);
  return /^(?:0|[1-9][0-9]*)(?:\.[0-9]+)?$/.test(text) && Number.isFinite(Number(text))
    ? text : null;
}
export function parseStockSnapshot(symbol: string, value: unknown) {
  const snapshot = record(value);
  const daily = record(snapshot.dailyBar);
  const quote = record(snapshot.latestQuote);
  const last = decimal(record(snapshot.latestTrade).p) ?? decimal(daily.c);
  const previous = decimal(record(snapshot.prevDailyBar).c);
  const change_pct = last !== null && previous !== null && Number(previous) > 0
    ? ((Number(last) / Number(previous) - 1) * 100).toFixed(2) : null;
  return {
    symbol, last, bid: decimal(quote.bp), ask: decimal(quote.ap), change_pct,
    vwap: decimal(daily.vw),
  };
}
export type StockSnapshot = ReturnType<typeof parseStockSnapshot>;

export function parseCancelAllResponse(value: unknown) {
  if (!Array.isArray(value)) throw new Error("Invalid Alpaca bulk cancellation response");
  const results = value.map((item: unknown) => {
    const row = record(item);
    if (typeof row.id !== "string" || !row.id) throw new Error("Missing cancellation order id");
    const status = typeof row.status === "number" ? row.status
      : typeof row.status === "string" && /^[0-9]{3}$/.test(row.status) ? Number(row.status) : NaN;
    if (!Number.isInteger(status) || status < 100 || status > 599) throw new Error("Invalid cancellation status");
    return { order_id: row.id, status, accepted: status >= 200 && status < 300 };
  });
  const accepted = results.filter((r) => r.accepted).length;
  return { requested: results.length, accepted, failed: results.length - accepted, results };
}
