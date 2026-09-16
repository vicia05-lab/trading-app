/** Explicitly fictional inputs. Calendar flags here do NOT attest to a real venue calendar. */
import type { VolumeFrame } from "../kernel/volume-research.ts";
import type { VolumeRiskSnapshot, ResearchQuote } from "../kernel/volume-replay.ts";
export function volumeFixture(securityId = "FIXTURE_A"): VolumeFrame {
  const openAt = "2024-06-03T13:30:00.000Z",
    open = Date.parse(openAt),
    decisionAt = new Date(open + 1200100).toISOString();
  const dates: string[] = [];
  let d = Date.parse("2024-05-31T00:00:00.000Z");
  while (dates.length < 80) {
    const date = new Date(d);
    if (date.getUTCDay() !== 0 && date.getUTCDay() !== 6)
      dates.unshift(date.toISOString().slice(0, 10));
    d -= 86400000;
  }
  const history = dates.map((sessionDate) => ({
    sessionDate,
    availableAt: sessionDate + "T21:00:00.000Z",
    qualifying: true,
    exclusionReason: "",
    volumes: Array(78).fill("10000") as string[],
    closes: Array(78).fill("100.000000") as string[],
  }));
  const bars = Array.from({ length: 4 }, (_, i) => ({
    id: "bar_" + i,
    startAt: new Date(open + i * 300000).toISOString(),
    availableAt: new Date(open + (i + 1) * 300000 + 50).toISOString(),
    open: "100.050000",
    high: i === 3 ? "100.350000" : "100.100000",
    low: "100.000000",
    close: i === 3 ? "100.300000" : "100.050000",
    volume: i === 3 ? "20000" : "10000",
    tradeVwap: i === 3 ? "100.200000" : "100.030000",
    buyVolume: i === 3 ? "14000" : "6000",
    sellVolume: i === 3 ? "6000" : "4000",
    signedAvailableAt: new Date(open + (i + 1) * 300000 + 50).toISOString(),
  }));
  return {
    schema: "2.1",
    securityId,
    sessionDate: "2024-06-03",
    mode: "FIXTURE",
    feed: "FIXTURE",
    sourceState: "VERIFIED",
    calendarState: "VERIFIED",
    securityState: "US_COMMON_VERIFIED",
    haltState: "CLEAR",
    corporateActionState: "CLEAR",
    universeSnapshotId: "fixture_universe",
    universeComplete: true,
    universeExpectedCount: "1",
    openAt,
    closeAt: "2024-06-03T20:00:00.000Z",
    decisionAt,
    atr: { value: "2.000000", availableAt: "2024-05-31T21:00:00.000Z" },
    context: { marketSectorAligned: true, availableAt: decisionAt },
    history,
    bars,
    quote: {
      bid: "100.290000",
      ask: "100.300000",
      observedAt: decisionAt,
      availableAt: decisionAt,
    },
    entryMinuteDollarVolume: { value: "500000.0000", availableAt: decisionAt },
  };
}
export function volumeFixtureEntry(frame = volumeFixture()): {
  risk: VolumeRiskSnapshot;
  quote: ResearchQuote;
} {
  const at = new Date(Date.parse(frame.decisionAt) + 500).toISOString();
  return {
    risk: {
      sessionDate: frame.sessionDate,
      observedAt: at,
      availableAt: at,
      verified: true,
      realizedLoss: "0.0000",
      accountDrawdown: "0.0000",
      usedSecurities: [],
      commitments: [],
    },
    quote: { bid: frame.quote.bid, ask: frame.quote.ask, observedAt: at, availableAt: at },
  };
}
