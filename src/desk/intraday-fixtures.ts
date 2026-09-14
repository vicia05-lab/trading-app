/** Synthetic normalized market observations only; not historical market results. */
import type { IntradayFrame } from "../kernel/intraday.ts";
import type { IntradayStrategyId } from "./intraday-catalog.ts";
export function intradayFixture(strategyId: IntradayStrategyId): IntradayFrame {
  const minute =
    strategyId === "ORB5_RVOL_LONG" ? 6 : strategyId === "SPY_NOISE_VWAP_LONG" ? 30 : 360;
  const opened = Date.parse("2026-09-14T13:30:00.000Z");
  const at = (m: number, ms = 0) => new Date(opened + m * 60000 + ms).toISOString();
  // Fixture construction only: no sampled prices are submitted to any provider or broker.
  const historyDates = [
    "2026-08-24",
    "2026-08-25",
    "2026-08-26",
    "2026-08-27",
    "2026-08-28",
    "2026-08-31",
    "2026-09-01",
    "2026-09-02",
    "2026-09-03",
    "2026-09-04",
    "2026-09-08",
    "2026-09-09",
    "2026-09-10",
    "2026-09-11",
  ];
  return {
    schema: "1",
    strategyId,
    securityId: strategyId === "ORB5_RVOL_LONG" ? "FIXTURE-COMMON" : "FIXTURE-SPY",
    instrument: strategyId === "ORB5_RVOL_LONG" ? "US_COMMON" : "SPY_ETF",
    sessionDate: "2026-09-14",
    mode: "FIXTURE",
    feed: "FIXTURE",
    openAt: at(0),
    closeAt: at(390),
    asOfAt: at(minute, 500),
    calendarState: "VERIFIED",
    sourceState: "VERIFIED",
    haltState: "CLEAR",
    corporateActionState: "CLEAR",
    universeSnapshotId: "fixture-opening-universe",
    openingRank: "1",
    rankAvailableAt: at(5, 100),
    bars: Array.from({ length: minute }, (_, i) => ({
      id: `fixture-bar-${i}`,
      startAt: at(i),
      availableAt: at(i + 1, 100),
      open: "100.000000",
      high: i < 5 ? "100.400000" : "101.400000",
      low: "99.900000",
      close: i < 5 ? "100.200000" : i === minute - 1 ? "101.200000" : "100.800000",
      volume: "10000",
      tradeVwap: i < 5 ? "100.100000" : "100.400000",
    })),
    history: historyDates.map((sessionDate) => ({
      sessionDate,
      availableAt: sessionDate + "T20:01:00.000Z",
      open: "100.000000",
      high: "102.000000",
      low: "98.000000",
      close: "100.000000",
      previousClose: "100.000000",
      volume: "2000000",
      openingVolume: "25000",
      sameMinute: String(minute),
      sameMinuteClose: "100.500000",
    })),
    quote: {
      bid: "101.190000",
      ask: "101.210000",
      observedAt: at(minute, 300),
      availableAt: at(minute, 400),
    },
  };
}
