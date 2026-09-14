import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { evaluateIntraday } from "./intraday.ts";
import { intradayFixture } from "../desk/intraday-fixtures.ts";
import { INTRADAY_STRATEGIES } from "../desk/intraday-catalog.ts";
import type { IntradayFrame } from "./intraday.ts";

for (const s of INTRADAY_STRATEGIES) {
  test(`${s.id}: synthetic qualifying inputs produce a research setup, never an order`, () => {
    const f = intradayFixture(s.id),
      before = JSON.stringify(f),
      r = evaluateIntraday(f);
    assert.equal(r.status, "LONG_SETUP");
    assert.equal(r.direction, "LONG");
    assert.equal(r.executionEnabled, false);
    assert.equal(r.isOrder, false);
    assert.equal(r.capitalReserved, "0.0000");
    assert.equal(r.exitDueAt, "2026-09-14T19:55:00.000Z");
    assert.match(r.inputHash!, /^[a-f0-9]{64}$/);
    assert.deepEqual(evaluateIntraday(f), r);
    assert.equal(JSON.stringify(f), before);
  });
}
function probe(
  name: string,
  change: (f: IntradayFrame) => void,
  expected: string,
  strategy: IntradayFrame["strategyId"] = "ORB5_RVOL_LONG",
) {
  test(name, () => {
    const f = intradayFixture(strategy);
    change(f);
    assert.equal(evaluateIntraday(f).status, expected);
  });
}
probe(
  "unknown readiness is blocked",
  (f) => {
    f.sourceState = "NOT_CHECKED";
  },
  "BLOCKED",
);
probe(
  "calendar must be verified",
  (f) => {
    f.calendarState = "NOT_CHECKED";
  },
  "BLOCKED",
);
probe(
  "IEX must not masquerade as consolidated research",
  (f) => {
    f.mode = "HISTORICAL";
    f.feed = "IEX";
  },
  "BLOCKED",
);
probe(
  "delayed live feed rejected",
  (f) => {
    f.mode = "PROSPECTIVE";
    f.feed = "DELAYED_SIP";
  },
  "BLOCKED",
);
probe(
  "fixture feed cannot mix with prospective mode",
  (f) => {
    f.mode = "PROSPECTIVE";
  },
  "BLOCKED",
);
probe(
  "halt unknown blocks",
  (f) => {
    f.haltState = "UNKNOWN";
  },
  "BLOCKED",
);
probe(
  "halt blocks",
  (f) => {
    f.haltState = "HALTED";
  },
  "BLOCKED",
);
probe(
  "corporate action needs reconciliation",
  (f) => {
    f.corporateActionState = "EVENT";
  },
  "BLOCKED",
);
probe(
  "14 prior sessions required",
  (f) => {
    f.history.pop();
  },
  "INVALID_INPUT",
);
probe(
  "current session excluded from history",
  (f) => {
    f.history[13].sessionDate = f.sessionDate;
  },
  "INVALID_INPUT",
);
probe(
  "duplicate prior sessions rejected",
  (f) => {
    f.history[1].sessionDate = f.history[0].sessionDate;
  },
  "INVALID_INPUT",
);
probe(
  "history known only after opening rejected",
  (f) => {
    f.history[13].availableAt = f.asOfAt;
  },
  "INVALID_INPUT",
);
probe(
  "wrong same-time horizon rejected",
  (f) => {
    f.history[0].sameMinute = "390";
  },
  "INVALID_INPUT",
);
probe(
  "unclosed future bar rejected",
  (f) => {
    f.asOfAt = f.bars.at(-1)!.startAt;
  },
  "INVALID_INPUT",
);
probe(
  "late revised input not available as of decision",
  (f) => {
    f.bars[0].availableAt = f.closeAt;
  },
  "INVALID_INPUT",
);
probe(
  "missing minute not silently bridged",
  (f) => {
    f.bars.splice(2, 1);
  },
  "INVALID_INPUT",
);
probe(
  "duplicate bar id rejected",
  (f) => {
    f.bars[1].id = f.bars[0].id;
  },
  "INVALID_INPUT",
);
probe(
  "float price rejected",
  (f) => {
    f.bars[0].open = 100 as unknown as string;
  },
  "INVALID_INPUT",
);
probe(
  "infinite price rejected",
  (f) => {
    f.quote.ask = "Infinity";
  },
  "INVALID_INPUT",
);
probe(
  "noncanonical exponent price rejected",
  (f) => {
    f.quote.ask = "1.01e2";
  },
  "INVALID_INPUT",
);
probe(
  "invalid OHLC rejected",
  (f) => {
    f.bars[0].high = "98.000000";
  },
  "INVALID_INPUT",
);
probe(
  "zero-volume minute not fabricated",
  (f) => {
    f.bars[2].volume = "0";
  },
  "INVALID_INPUT",
);
probe(
  "negative volume rejected",
  (f) => {
    f.bars[2].volume = "-10";
  },
  "INVALID_INPUT",
);
probe(
  "invalid trade VWAP rejected",
  (f) => {
    f.bars[2].tradeVwap = "200.000000";
  },
  "INVALID_INPUT",
);
probe(
  "future quote rejected",
  (f) => {
    f.quote.observedAt = f.closeAt;
  },
  "INVALID_INPUT",
);
probe(
  "stale quote rejected",
  (f) => {
    f.quote.observedAt = f.openAt;
  },
  "INVALID_INPUT",
);
probe(
  "wide spread blocks",
  (f) => {
    f.quote.ask = "102.000000";
  },
  "BLOCKED",
);
probe(
  "crossed quote rejected",
  (f) => {
    f.quote.bid = "102.000000";
  },
  "INVALID_INPUT",
);
probe(
  "rank missing blocks instead of assuming top 20",
  (f) => {
    f.openingRank = null;
  },
  "BLOCKED",
);
probe(
  "rank outside top20 rejects setup",
  (f) => {
    f.openingRank = "21";
  },
  "NO_SETUP",
);
probe(
  "late universe ranking cannot backdate 09:35 knowledge",
  (f) => {
    f.rankAvailableAt = f.asOfAt;
  },
  "BLOCKED",
);
probe(
  "full-day volume not substituted for opening relative volume",
  (f) => {
    f.history.forEach((h) => (h.openingVolume = "100000"));
  },
  "NO_SETUP",
);
probe(
  "bearish opening does not become short order",
  (f) => {
    f.bars[4].close = "99.950000";
  },
  "NO_SETUP",
);
probe(
  "doji opening stands aside",
  (f) => {
    f.bars[4].close = "100.000000";
  },
  "NO_SETUP",
);
probe(
  "breakout requires close not intrabar high",
  (f) => {
    f.bars[5].close = "100.300000";
  },
  "NO_SETUP",
);
probe(
  "repeat beyond-high close is not a new crossing",
  (f) => {
    f.bars[5].close = "100.600000";
    f.bars.push({
      ...f.bars[5],
      id: "b7",
      startAt: "2026-09-14T13:36:00.000Z",
      availableAt: "2026-09-14T13:37:00.100Z",
    });
    f.asOfAt = "2026-09-14T13:37:00.500Z";
    f.history.forEach((h) => (h.sameMinute = "7"));
    f.quote.observedAt = "2026-09-14T13:37:00.300Z";
    f.quote.availableAt = "2026-09-14T13:37:00.400Z";
  },
  "NO_SETUP",
);
probe(
  "SPY family rejects generic common stocks",
  (f) => {
    f.instrument = "US_COMMON";
  },
  "NO_SETUP",
  "SPY_NOISE_VWAP_LONG",
);
probe(
  "noise band includes overnight gap",
  (f) => {
    f.history[13].close = "102.000000";
  },
  "NO_SETUP",
  "SPY_NOISE_VWAP_LONG",
);
probe(
  "high historical same-time movement widens band",
  (f) => {
    f.history.forEach((h) => {
      h.sameMinuteClose = "103.000000";
      h.high = "104.000000";
    });
  },
  "NO_SETUP",
  "SPY_NOISE_VWAP_LONG",
);
probe(
  "late signal includes prior close to first half hour",
  (f) => {
    f.history[13].close = "101.000000";
  },
  "NO_SETUP",
  "SPY_LATE_MOM_LONG",
);
probe(
  "zero morning return stands aside",
  (f) => {
    f.history[13].close = f.bars[29].close;
  },
  "NO_SETUP",
  "SPY_LATE_MOM_LONG",
);

test("noise/VWAP golden references use known previous sessions", () => {
  const r = evaluateIntraday(intradayFixture("SPY_NOISE_VWAP_LONG"));
  assert.equal(r.metrics.upperBand, "100.500000000000");
  assert.equal(r.metrics.sessionVwap, "100.350000000000");
  assert.equal(r.invalidationPrice, "100.500000000000");
});
test("ORB golden references", () => {
  const r = evaluateIntraday(intradayFixture("ORB5_RVOL_LONG"));
  assert.equal(r.metrics.openingHigh, "100.400000000000");
  assert.equal(r.metrics.openingRvol, "2.000000000000");
  assert.equal(r.metrics.priorAtr, "4.000000000000");
  assert.equal(r.invalidationPrice, "100.800000000000");
});
test("changing evidence changes the probe hash even when direction remains same", () => {
  const f = intradayFixture("ORB5_RVOL_LONG"),
    a = evaluateIntraday(f);
  f.history[0].volume = "2000001";
  const b = evaluateIntraday(f);
  assert.equal(b.status, "LONG_SETUP");
  assert.notEqual(a.inputHash, b.inputHash);
});
test("strict shape is total on malformed JSON-shaped inputs", () => {
  for (const value of [
    null,
    undefined,
    [],
    {},
    1,
    true,
    "x",
    { ...intradayFixture("ORB5_RVOL_LONG"), injected: "extra" },
  ])
    assert.equal(evaluateIntraday(value).status, "INVALID_INPUT");
});
test("extension cannot route orders or mutate earnings", () => {
  const source = readFileSync(new URL("./intraday.ts", import.meta.url), "utf8");
  assert.doesNotMatch(source, /from ["'][^"']*(?:alpaca|writer|commands|lifecycle)/);
  assert.doesNotMatch(source, /\b(?:fetch|submitOrder|reservePosition|freezeMember)\s*\(/);
});
