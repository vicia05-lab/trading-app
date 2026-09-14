import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { LIMIT_RE, NOTIONAL_RE, QTY_RE, assertVenueMode, qtyFromNotional, venueTicker } from "./venue-size.ts";

describe("venueTicker", () => {
  it("accepts listed names", () => {
    assert.equal(venueTicker("nvda"), "NVDA");
    assert.equal(venueTicker("BRK.B"), "BRK.B");
  });
  it("rejects fixtures", () => {
    assert.equal(venueTicker("ALFA"), null);
  });
  it("rejects internal ids without coercing them into tickers", () => {
    assert.equal(venueTicker("SEC-001"), null);
    assert.equal(venueTicker("SEC-A"), null);
    assert.equal(venueTicker("SEC-NVDA"), null);
    assert.equal(venueTicker("sec-abc"), null);
  });
  it("does not strip hyphens into a new symbol", () => {
    assert.equal(venueTicker("BRK-B"), null);
  });
});

describe("size patterns", () => {
  it("rejects zero and leading-zero qty", () => {
    assert.equal(QTY_RE.test("0"), false);
    assert.equal(QTY_RE.test("0.000000000"), false);
    assert.equal(QTY_RE.test("007"), false);
    assert.equal(QTY_RE.test("10"), true);
    assert.equal(QTY_RE.test("0.5"), true);
  });
  it("rejects zero notional and zero limit", () => {
    assert.equal(NOTIONAL_RE.test("0.00"), false);
    assert.equal(NOTIONAL_RE.test("5000.00"), true);
    assert.equal(LIMIT_RE.test("0.0000"), false);
    assert.equal(LIMIT_RE.test("12.5"), true);
  });
});

describe("assertVenueMode", () => {
  it("throws LIVE_DISABLED even when a data-secret pair would exist", () => {
    const hasDataPair = true;
    assert.throws(() => {
      assertVenueMode("LIVE");
      if (hasDataPair) throw new Error("fallback must not run");
    }, (e: unknown) => e instanceof Error && (e as { code?: string }).code === "LIVE_DISABLED");
  });
  it("allows PAPER", () => {
    assert.equal(assertVenueMode("PAPER"), "PAPER");
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
