import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { qtyFromNotional, venueTicker } from "./venue-size.ts";

describe("venueTicker", () => {
  it("accepts listed names", () => {
    assert.equal(venueTicker("nvda"), "NVDA");
    assert.equal(venueTicker("BRK.B"), "BRK.B");
  });
  it("rejects fixtures", () => {
    assert.equal(venueTicker("ALFA"), null);
  });
  it("rejects SEC- before strip", () => {
    assert.equal(venueTicker("SEC-001"), null);
    assert.equal(venueTicker("sec-abc"), null);
  });
});

describe("qtyFromNotional", () => {
  it("sizes 5000 at 100 to 50 shares", () => {
    assert.equal(qtyFromNotional("5000.00", "100"), "50.0000");
  });
  it("floors fractional shares to 4 dp", () => {
    assert.equal(qtyFromNotional("5000.00", "333.33"), "15.0001");
  });
  it("rejects zero last", () => {
    assert.throws(() => qtyFromNotional("5000.00", "0"));
  });
});
