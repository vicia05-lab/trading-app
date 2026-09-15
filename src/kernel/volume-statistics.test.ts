import test from "node:test";
import assert from "node:assert/strict";
import {
  maxDrawdownFromPnl,
  maxDrawdownFromEquity,
  conditionalConcentration,
  expectedMaximumZ,
  normalQuantile,
  profitFactor,
  stationarySessionIndices,
  researchStatistics,
  sharpe,
} from "./volume-statistics.ts";
test("drawdown includes initial zero-equity peak", () =>
  assert.equal(maxDrawdownFromPnl([-1, -1, 1.8]), 2));
test("all winning path has zero drawdown", () => assert.equal(maxDrawdownFromPnl([1, 2, 3]), 0));
test("account drawdown uses equity, not closed R sums", () =>
  assert.equal(maxDrawdownFromEquity(100000, [99000, 102000, 98500]), 3500));
test("best day share uses positive-total denominator only", () =>
  assert.deepEqual(
    conditionalConcentration(
      [
        [1, -2],
        [3, 1],
        [1, 1],
      ],
      0.6,
    ),
    { eligible: 2, probability: 0.5 },
  ));
test("no positive paths gives null, not zero concentration", () =>
  assert.equal(conditionalConcentration([[-1], [-2]]).probability, null));
test("single trial expected maximum is zero, not negative infinity", () =>
  assert.equal(expectedMaximumZ(1), 0));
test("multiple trial expected maximum increases", () =>
  assert.ok(expectedMaximumZ(30) > expectedMaximumZ(10)));
test("expected maximum matches audit approximation", () =>
  assert.ok(Math.abs(expectedMaximumZ(2187) - 3.47) < 0.02));
test("invalid trial counts cannot silently pass", () => {
  for (const n of [0, -1, NaN, 1.5, Infinity]) assert.throws(() => expectedMaximumZ(n));
});
test("normal quantile central and tail values", () => {
  assert.ok(Math.abs(normalQuantile(0.5)) < 1e-12);
  assert.ok(Math.abs(normalQuantile(0.95) - 1.64485362695) < 1e-7);
  assert.throws(() => normalQuantile(1));
});
test("profit factor with no losses is undefined, not infinite proof", () =>
  assert.equal(profitFactor([1, 2]), null));
test("profit factor checks ratio of gross sums", () =>
  assert.equal(profitFactor([2, 2, -1, -1]), 2));
test("constant returns do not produce infinite Sharpe", () =>
  assert.equal(sharpe([1, 1, 1]), null));
test("non-finite statistics rejected", () => {
  assert.throws(() => maxDrawdownFromPnl([NaN]));
  assert.throws(() => sharpe([1, Infinity]));
});
test("session bootstrap deterministic and bounded", () => {
  const a = stationarySessionIndices(100, 5, 7);
  assert.deepEqual(a, stationarySessionIndices(100, 5, 7));
  assert.ok(a.every((i) => i >= 0 && i < 100));
  assert.ok(a.slice(1).filter((x, i) => x === (a[i] + 1) % 100).length > 50);
});
test("invalid bootstrap block rejected", () =>
  assert.throws(() => stationarySessionIndices(10, 0, 7)));
const sample = () =>
  Array.from({ length: 20 }, (_, i) => ({
    date: "2024-01-" + String(i + 1).padStart(2, "0"),
    portfolioReturn: i % 3 === 0 ? -0.001 : 0.002,
    equity: 100000 + i * 10,
    tradeR: i % 3 === 0 ? [-1] : [1.8],
  }));
test("minimum counts do not fake promotion or effective trials", () => {
  const r = researchStatistics(sample(), 100000, { draws: 100, meanBlock: 5, seed: 7 });
  assert.equal(r.sampleStatus, "INSUFFICIENT_SAMPLE");
  assert.equal(r.promotion, "INCONCLUSIVE");
  assert.equal(r.dsr, null);
  assert.equal(r.pbo, null);
  assert.equal(r.effectiveTrialCount, null);
  assert.equal(r.executionEnabled, false);
  assert.equal(r.sessions, 20);
  assert.equal(r.trades, 20);
});
test("no-trade dates retained in daily sample", () => {
  const s = sample();
  s[0].tradeR = [];
  s[0].portfolioReturn = 0;
  const r = researchStatistics(s, 100000, { draws: 100, meanBlock: 5, seed: 7 });
  assert.equal(r.sessions, 20);
  assert.equal(r.trades, 19);
});
test("duplicate session date rejected", () => {
  const s = sample();
  s[1].date = s[0].date;
  assert.throws(() => researchStatistics(s, 100000));
});
test("bootstrap output reproducible and not mislabeled BCa", () => {
  const options = { draws: 100, meanBlock: 5, seed: 7 };
  const a = researchStatistics(sample(), 100000, options);
  assert.deepEqual(a, researchStatistics(sample(), 100000, options));
  assert.equal(a.intervalMethod, "ONE_SIDED_95_PERCENT_STATIONARY_SESSION_PERCENTILE_NOT_BCA");
});
