import assert from "node:assert/strict";
import { test } from "node:test";
import { paperCapacity } from "./paper-capacity.ts";

test("capacity counts existing holdings, pending orders and local reservations", () => {
  const c = paperCapacity([{ symbol: "AAPL", market_value: "5000.00" }], [{ symbol: "MSFT", side: "buy", notional: "5000.00" }]);
  assert.match(c.reason("AAPL", "5000.00")!, /Existing/);
  assert.match(c.reason("MSFT", "5000.00")!, /Existing/);
  assert.equal(c.reason("NVDA", "5000.00"), null);
  c.reserve("NVDA", "5000.00");
  assert.match(c.reason("GOOG", "5000.00")!, /slot cap/);
});
test("dollar cap is enforced even below three symbols", () => {
  const c = paperCapacity([{ symbol: "AAPL", market_value: "10000.01" }], []);
  assert.match(c.reason("MSFT", "5000.00")!, /gross cap/);
});
test("short exposure is absolute and pending sells do not free capacity", () => {
  const short = paperCapacity([{ symbol: "AAPL", market_value: "-11000" }], []);
  assert.match(short.reason("MSFT", "5000.00")!, /gross cap/);
  const long = paperCapacity([{ symbol: "AAPL", market_value: "11000", qty: "10" }], [{ symbol: "AAPL", side: "sell", qty: "1" }]);
  assert.match(long.reason("MSFT", "5000.00")!, /gross cap/);
});
test("quantity limit orders reserve conservative exposure", () => {
  const c = paperCapacity([], [{ symbol: "AAPL", side: "buy", qty: "10", limit_price: "1000.001" }]);
  assert.match(c.reason("MSFT", "5000.00")!, /gross cap/);
});
test("incomplete, truncated and unpriceable broker data fail closed", () => {
  assert.throws(() => paperCapacity([{ symbol: "AAPL", market_value: null }], []));
  assert.throws(() => paperCapacity([], [{ symbol: "AAPL", side: "buy", qty: "2", limit_price: null }]));
  assert.throws(() => paperCapacity([], [{ symbol: "AAPL", side: "sell" }]));
  assert.throws(() => paperCapacity([], Array(500).fill({ symbol: "AAPL", side: "buy", notional: "1" })));
});
test("invalid and oversized tickets cannot be reserved", () => {
  const c = paperCapacity([], []);
  for (const value of ["0", "-1", "5000.01"]) assert.throws(() => c.reserve("AAPL", value));
  for (const value of ["NaN", "", "1e3"]) assert.throws(() => c.reason("AAPL", value));
});

test("sell orders must be fully covered by verified remaining long quantities", () => {
  const positions = [{ symbol: "AAPL", market_value: "1000", qty: "10" }];
  assert.throws(() => paperCapacity(positions, [{ symbol: "AAPL", side: "sell", qty: "11" }]));
  assert.throws(() => paperCapacity(positions, [
    { symbol: "AAPL", side: "sell", qty: "6" }, { symbol: "AAPL", side: "sell", qty: "5" },
  ]));
  assert.throws(() => paperCapacity([{ symbol: "AAPL", market_value: "1000" }], [{ symbol: "AAPL", side: "sell", qty: "1" }]));
  assert.throws(() => paperCapacity([{ symbol: "AAPL", market_value: "-1000", qty: "-10" }], [{ symbol: "AAPL", side: "sell", qty: "1" }]));
});
