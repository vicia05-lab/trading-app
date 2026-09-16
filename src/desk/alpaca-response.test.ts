import assert from "node:assert/strict";
import { test } from "node:test";
import { parseStockSnapshot, parseCancelAllResponse } from "./alpaca-response.ts";

test("snapshot exposes the actual daily VWAP rather than the last price", () => {
  const row = parseStockSnapshot("AAPL", { latestTrade: { p: 102 }, latestQuote: { bp: 101.99, ap: 102.01 }, dailyBar: { c: 102, vw: 100 }, prevDailyBar: { c: 100 } });
  assert.deepEqual(row, { symbol: "AAPL", last: "102", bid: "101.99", ask: "102.01", vwap: "100", change_pct: "2.00" });
});
test("a missing or malformed VWAP never falls back to last", () => {
  for (const value of [undefined, null, -1, NaN, Infinity, {}, "NaN", ""]) {
    assert.equal(parseStockSnapshot("AAPL", { latestTrade: { p: 102 }, dailyBar: { vw: value } }).vwap, null);
  }
});
test("empty snapshot and zero previous close are explicit missing data", () => {
  assert.equal(parseStockSnapshot("AAPL", null).last, null);
  assert.equal(parseStockSnapshot("AAPL", { latestTrade: { p: 10 }, prevDailyBar: { c: 0 } }).change_pct, null);
});
test("bulk cancellation reports partial failures rather than claiming all canceled", () => {
  const result = parseCancelAllResponse([{ id: "a", status: 200 }, { id: "b", status: 500 }, { id: "c", status: "204" }]);
  assert.equal(result.requested, 3); assert.equal(result.accepted, 2); assert.equal(result.failed, 1);
  assert.equal(result.results[1].accepted, false);
});
test("malformed cancellation receipts fail closed; empty list is valid", () => {
  assert.deepEqual(parseCancelAllResponse([]), { requested: 0, accepted: 0, failed: 0, results: [] });
  for (const value of [null, {}, [{ id: "a" }], [{ status: 200 }], [{ id: "a", status: true }]]) assert.throws(() => parseCancelAllResponse(value));
});
