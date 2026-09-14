import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { evaluateStrategy } from "./paper-intellect-rules.ts";

describe("evaluateStrategy", () => {
  it("buys a VWAP breakout with 0.5–4% day change", () => {
    const d = evaluateStrategy({ last: "101.00", vwap: "100.00", change_pct: "1.20" });
    assert.equal(d.action, "BUY");
    assert.equal(d.notional, "5000.00");
  });
  it("holds when day change is too hot", () => {
    const d = evaluateStrategy({ last: "101.00", vwap: "100.00", change_pct: "5.00" });
    assert.equal(d.action, "HOLD");
  });
  it("buys a >2% dip under 98% of VWAP", () => {
    const d = evaluateStrategy({ last: "96.00", vwap: "100.00", change_pct: "-2.50" });
    assert.equal(d.action, "BUY");
  });
  it("holds a shallow dip", () => {
    const d = evaluateStrategy({ last: "99.50", vwap: "100.00", change_pct: "-0.40" });
    assert.equal(d.action, "HOLD");
  });
  it("holds when prints are missing", () => {
    const d = evaluateStrategy({ last: null, vwap: "100.00", change_pct: "1.00" });
    assert.equal(d.action, "HOLD");
  });
});
