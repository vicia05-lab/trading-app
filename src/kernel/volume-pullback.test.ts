import test from "node:test";
import assert from "node:assert/strict";
import { volumeFixture } from "../desk/volume-fixtures.ts";
import { evaluateVolumeCohort } from "./volume-research.ts";
function pullback() {
  const f = volumeFixture(),
    open = Date.parse(f.openAt);
  const rows = [
    ["100", "100.1", "99.8", "99.9", "100", "10000"],
    ["99.9", "100.3", "99.85", "100.2", "100.15", "20000"],
    ["100.2", "100.5", "100.15", "100.4", "100.35", "20000"],
    ["100.4", "100.8", "100.35", "100.7", "100.6", "20000"],
    ["100.65", "100.7", "100.5", "100.55", "100.6", "5000"],
    ["100.55", "100.6", "100.48", "100.52", "100.53", "5000"],
    ["100.52", "100.75", "100.5", "100.72", "100.65", "20000"],
  ];
  f.bars = rows.map((r, i) => {
    const at = new Date(open + (i + 1) * 300000 + 50).toISOString();
    return {
      id: "pb_" + i,
      startAt: new Date(open + i * 300000).toISOString(),
      availableAt: at,
      open: Number(r[0]).toFixed(6),
      high: Number(r[1]).toFixed(6),
      low: Number(r[2]).toFixed(6),
      close: Number(r[3]).toFixed(6),
      tradeVwap: Number(r[4]).toFixed(6),
      volume: r[5],
      buyVolume: String(Number(r[5]) * 0.7),
      sellVolume: String(Number(r[5]) * 0.3),
      signedAvailableAt: at,
    };
  });
  f.decisionAt = new Date(open + 2100100).toISOString();
  f.context.availableAt = f.decisionAt;
  f.entryMinuteDollarVolume.availableAt = f.decisionAt;
  f.quote = {
    bid: "100.710000",
    ask: "100.720000",
    observedAt: f.decisionAt,
    availableAt: f.decisionAt,
  };
  return f;
}
test("causal pullback qualifies with confirmation excluded from low-volume window", () => {
  const c = evaluateVolumeCohort([pullback()])[0];
  assert.equal(c.status, "LONG_CANDIDATE");
  assert.equal(c.prism, "VWAP_PULLBACK");
  assert.equal(c.structuralStop, "100.380000000000");
  assert.ok(c.rvolWindow30);
});
test("heavy-volume pullback does not qualify", () => {
  const f = pullback();
  for (const b of f.bars.slice(4, 6)) {
    b.volume = "30000";
    b.buyVolume = "21000";
    b.sellVolume = "9000";
  }
  assert.notEqual(evaluateVolumeCohort([f])[0].status, "LONG_CANDIDATE");
});
test("pullback below VWAP cannot qualify", () => {
  const f = pullback();
  f.bars[4].low = "100.000000";
  assert.notEqual(evaluateVolumeCohort([f])[0].status, "LONG_CANDIDATE");
});
test("future confirmation bar is rejected rather than moving an earlier signal", () => {
  const f = pullback();
  f.bars[6].availableAt = new Date(Date.parse(f.decisionAt) + 1).toISOString();
  assert.equal(evaluateVolumeCohort([f])[0].status, "BLOCKED");
});
test("price floor rejects sub-five-dollar names even with valid momentum", () => {
  const f = volumeFixture();
  for (const b of f.bars) {
    for (const k of ["open", "high", "low", "close", "tradeVwap"] as const)
      b[k] = (Number(b[k]) / 100).toFixed(6);
  }
  for (const h of f.history) h.closes = h.closes.map((c) => (Number(c) / 100).toFixed(6));
  f.atr.value = "0.020000";
  f.quote.bid = "1.002900";
  f.quote.ask = "1.003000";
  assert.equal(evaluateVolumeCohort([f])[0].reasons[0], "PRICE_BELOW_MINIMUM");
});
