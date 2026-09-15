import test from "node:test";
import assert from "node:assert/strict";
import { evaluateVolumeCohort, volumeResearchHash, volumePolicyHash } from "./volume-research.ts";
import type { VolumeFrame } from "./volume-research.ts";
import {
  simulateVolumeAdmission,
  simulateVolumeExit,
  inspectPaperProtection,
} from "./volume-replay.ts";
import { volumeFixture, volumeFixtureEntry } from "../desk/volume-fixtures.ts";
import { buildVolumeCapture } from "../desk/volume-capture.ts";
import { VOLUME_POLICY } from "../desk/volume-policy.ts";
const evaluate = (f = volumeFixture()) => evaluateVolumeCohort([f])[0];
const admission = () => {
  const f = volumeFixture(),
    c = evaluate(f),
    e = volumeFixtureEntry(f);
  return { f, c, e, a: simulateVolumeAdmission(f, c, e.risk, e.quote) };
};
test("fictional ORB satisfies gates without a weighted score", () => {
  const r = evaluate();
  assert.equal(r.status, "LONG_CANDIDATE");
  assert.equal(r.prism, "ORB15_CONTINUATION");
  assert.equal(r.rvolCumulative, "1.250000000000");
  assert.equal(r.rvolBar, "2.000000000000");
  assert.equal(r.rvolWindow30, null);
  assert.equal(r.executionEnabled, false);
  assert.equal(r.capitalReserved, "0.0000");
  assert.ok(!("score" in r));
});
test("policy deeply frozen and canonically hashed", () => {
  assert.equal(volumePolicyHash().length, 64);
  assert.throws(() => {
    (VOLUME_POLICY.risk as { maxConcurrent: string }).maxConcurrent = "6";
  });
  assert.equal(VOLUME_POLICY.risk.maxConcurrent, "3");
});
test("cohort size bounded", () => {
  assert.throws(() => evaluateVolumeCohort([]));
  assert.throws(() => evaluateVolumeCohort(Array(501).fill({})));
});
const cases: Array<[string, (f: VolumeFrame) => void, string]> = [
  [
    "missing source",
    (f) => {
      f.sourceState = "NOT_CHECKED";
    },
    "REQUIRED_EVIDENCE_UNVERIFIED",
  ],
  [
    "missing calendar",
    (f) => {
      f.calendarState = "NOT_CHECKED";
    },
    "REQUIRED_EVIDENCE_UNVERIFIED",
  ],
  [
    "unknown security",
    (f) => {
      f.securityState = "NOT_CHECKED";
    },
    "REQUIRED_EVIDENCE_UNVERIFIED",
  ],
  [
    "IEX historical",
    (f) => {
      f.mode = "HISTORICAL";
      f.feed = "IEX";
    },
    "REQUIRED_EVIDENCE_UNVERIFIED",
  ],
  [
    "unknown halt",
    (f) => {
      f.haltState = "UNKNOWN";
    },
    "REQUIRED_EVIDENCE_UNVERIFIED",
  ],
  [
    "corporate action",
    (f) => {
      f.corporateActionState = "EVENT";
    },
    "REQUIRED_EVIDENCE_UNVERIFIED",
  ],
  [
    "unknown market",
    (f) => {
      f.context.marketSectorAligned = null;
    },
    "REQUIRED_EVIDENCE_UNVERIFIED",
  ],
  [
    "future context",
    (f) => {
      f.context.availableAt = new Date(Date.parse(f.decisionAt) + 1).toISOString();
    },
    "FUTURE_FEATURE",
  ],
  [
    "future ATR",
    (f) => {
      f.atr.availableAt = f.decisionAt;
    },
    "FUTURE_FEATURE",
  ],
  [
    "future liquidity",
    (f) => {
      f.entryMinuteDollarVolume.availableAt = new Date(Date.parse(f.decisionAt) + 1).toISOString();
    },
    "FUTURE_FEATURE",
  ],
  [
    "future bar",
    (f) => {
      f.bars[3].availableAt = new Date(Date.parse(f.decisionAt) + 1).toISOString();
    },
    "UNAVAILABLE_OR_NONCONTIGUOUS_BAR",
  ],
  [
    "bar before close",
    (f) => {
      f.bars[3].availableAt = f.bars[3].startAt;
    },
    "UNAVAILABLE_OR_NONCONTIGUOUS_BAR",
  ],
  [
    "missing bar",
    (f) => {
      f.bars.splice(1, 1);
    },
    "UNAVAILABLE_OR_NONCONTIGUOUS_BAR",
  ],
  [
    "duplicate bar",
    (f) => {
      f.bars[1].id = f.bars[0].id;
    },
    "DUPLICATE_BAR",
  ],
  [
    "future signing",
    (f) => {
      f.bars[3].signedAvailableAt = new Date(Date.parse(f.decisionAt) + 1).toISOString();
    },
    "FUTURE_SIGNED_VOLUME",
  ],
  [
    "missing signing",
    (f) => {
      f.bars[3].buyVolume = null;
    },
    "SIGNED_TRADE_EVIDENCE_MISSING",
  ],
  [
    "low signing coverage",
    (f) => {
      f.bars[3].buyVolume = "100";
      f.bars[3].sellVolume = "100";
    },
    "SIGNED_TRADE_COVERAGE_LOW",
  ],
  [
    "too much signed volume",
    (f) => {
      f.bars[3].buyVolume = "999999";
    },
    "SIGNED_VOLUME_EXCEEDS_TOTAL",
  ],
  [
    "locked quote",
    (f) => {
      f.quote.bid = f.quote.ask;
    },
    "CROSSED_OR_LOCKED_QUOTE",
  ],
  [
    "crossed quote",
    (f) => {
      f.quote.bid = "101.000000";
    },
    "CROSSED_OR_LOCKED_QUOTE",
  ],
  [
    "stale quote",
    (f) => {
      f.quote.observedAt = f.bars[3].startAt;
    },
    "STALE_OR_FUTURE_QUOTE",
  ],
  [
    "future quote",
    (f) => {
      f.quote.availableAt = new Date(Date.parse(f.decisionAt) + 1).toISOString();
    },
    "STALE_OR_FUTURE_QUOTE",
  ],
  [
    "future history",
    (f) => {
      f.history[0].availableAt = f.decisionAt;
    },
    "INVALID_HISTORY_TIME",
  ],
  [
    "duplicate history",
    (f) => {
      f.history[1].sessionDate = f.history[0].sessionDate;
    },
    "INVALID_HISTORY_TIME",
  ],
  [
    "short long baseline",
    (f) => {
      f.history = f.history.slice(-59);
    },
    "BASELINE_COVERAGE_MISSING",
  ],
  [
    "recent exclusions",
    (f) => {
      f.history.slice(-6).forEach((h) => {
        h.qualifying = false;
        h.exclusionReason = "HALT";
      });
    },
    "BASELINE_COVERAGE_MISSING",
  ],
  [
    "missing exclusion reason",
    (f) => {
      f.history[0].qualifying = false;
    },
    "INVALID_EXCLUSION_RECEIPT",
  ],
  [
    "liquidity regime shift",
    (f) => {
      f.history.slice(-20).forEach((h) => {
        h.volumes.fill("20000");
      });
    },
    "LIQUIDITY_REGIME_SHIFT",
  ],
  [
    "zero baseline",
    (f) => {
      f.history.forEach((h) => h.volumes.fill("0"));
    },
    "ZERO_BASELINE",
  ],
  [
    "incomplete universe",
    (f) => {
      f.universeComplete = false;
    },
    "UNIVERSE_RANK_UNVERIFIED",
  ],
  [
    "wrong universe count",
    (f) => {
      f.universeExpectedCount = "2";
    },
    "UNIVERSE_RANK_UNVERIFIED",
  ],
  [
    "early close",
    (f) => {
      f.closeAt = "2024-06-03T17:00:00.000Z";
    },
    "UNSUPPORTED_SESSION",
  ],
];
for (const [name, change, reason] of cases)
  test(name + " fails closed", () => {
    const f = volumeFixture();
    change(f);
    const r = evaluate(f);
    assert.equal(r.status, "BLOCKED");
    assert.equal(r.reasons[0], reason);
  });
test("invalid schema and untrusted extra field cannot enter kernel", () => {
  assert.equal(
    evaluateVolumeCohort([{ ...volumeFixture(), apiKey: "not-accepted" }])[0].status,
    "INVALID_INPUT",
  );
});
test("market misalignment is a no-setup rather than missing data", () => {
  const f = volumeFixture();
  f.context.marketSectorAligned = false;
  assert.equal(evaluate(f).status, "NO_SETUP");
});
test("negative imbalance does not produce a long", () => {
  const f = volumeFixture();
  [f.bars[3].buyVolume, f.bars[3].sellVolume] = ["6000", "14000"];
  assert.equal(evaluate(f).reasons[0], "SIGNED_IMBALANCE_NOT_CONFIRMED");
});
test("duplicate identities block rank rather than double count", () => {
  const f = volumeFixture();
  f.universeExpectedCount = "2";
  assert.ok(evaluateVolumeCohort([f, structuredClone(f)]).every((r) => r.status === "BLOCKED"));
});
test("rank ties use permanent identity not caller order", () => {
  const a = volumeFixture("Z"),
    b = volumeFixture("A");
  a.universeExpectedCount = b.universeExpectedCount = "2";
  assert.equal(evaluateVolumeCohort([a, b])[1].rank, "1");
});
test("top K is per checkpoint, excludes rank 21", () => {
  const f = Array.from({ length: 21 }, (_, i) => {
    const x = volumeFixture("S" + String(i).padStart(2, "0"));
    x.universeExpectedCount = "21";
    return x;
  });
  assert.equal(evaluateVolumeCohort(f).at(-1)!.reasons[0], "OUTSIDE_TOP_K");
});
test("result is immutable with respect to later source mutation", () => {
  const f = volumeFixture(),
    before = evaluate(f),
    saved = JSON.stringify(before);
  f.bars[3].close = "100.310000";
  assert.equal(JSON.stringify(before), saved);
  assert.notEqual(evaluate(f).inputHash, before.inputHash);
});
test("same input replays byte-identically", () => assert.deepEqual(evaluate(), evaluate()));
test("next eligible quote creates estimate only", () => {
  const { a } = admission();
  assert.equal(a.status, "SIMULATED_ADMISSION");
  assert.equal(a.shares, "49");
  assert.equal(a.entryPrice, "100.310000000000");
  assert.equal(a.executionEnabled, false);
  assert.equal(a.isOrder, false);
  assert.equal(a.capitalReserved, "0.0000");
});
test("signal close cannot be used as entry quote", () => {
  const { f, c, e } = admission();
  assert.equal(
    simulateVolumeAdmission(f, c, e.risk, f.quote).reason,
    "NEXT_ELIGIBLE_QUOTE_REQUIRED",
  );
});
test("entry cannot chase a higher ask", () => {
  const { f, c, e } = admission();
  e.quote.ask = "100.320000";
  assert.equal(
    simulateVolumeAdmission(f, c, e.risk, e.quote).reason,
    "LIMIT_NOT_MARKETABLE_NO_FILL",
  );
});
test("tampered candidate rejected", () => {
  const { f, c, e } = admission();
  c.structuralStop = "100.290000000000";
  assert.equal(simulateVolumeAdmission(f, c, e.risk, e.quote).reason, "CANDIDATE_RECEIPT_MISMATCH");
});
test("altered input cannot reuse a sealed candidate", () => {
  const { f, c, e } = admission();
  f.atr.value = "10.000000";
  assert.equal(simulateVolumeAdmission(f, c, e.risk, e.quote).reason, "CANDIDATE_RECEIPT_MISMATCH");
});
test("unknown shared risk is not free capacity", () => {
  const { f, c, e } = admission();
  e.risk.verified = false;
  assert.equal(simulateVolumeAdmission(f, c, e.risk, e.quote).reason, "SHARED_RISK_UNVERIFIED");
});
test("IMPAIRED and pending commitments consume slots", () => {
  const { f, c, e } = admission();
  e.risk.commitments = ["PENDING", "OPEN", "IMPAIRED"].map((state, i) => ({
    securityId: "OTHER" + i,
    state: state as "OPEN",
    notional: "1000.0000",
    risk: "10.0000",
  }));
  assert.equal(simulateVolumeAdmission(f, c, e.risk, e.quote).reason, "CONCURRENT_CAPACITY_FULL");
});
test("closed confirmed positions do not consume a concurrent slot", () => {
  const { f, c, e } = admission();
  e.risk.commitments = Array.from({ length: 12 }, (_, i) => ({
    securityId: "OTHER" + i,
    state: "CLOSED_CONFIRMED" as const,
    notional: "1000.0000",
    risk: "10.0000",
  }));
  assert.equal(simulateVolumeAdmission(f, c, e.risk, e.quote).status, "SIMULATED_ADMISSION");
});
test("concurrent cap is not a three-entry daily cap", () => {
  assert.equal(VOLUME_POLICY.risk.maxEntriesPerSession, null);
  const { f, c, e } = admission();
  e.risk.usedSecurities = ["PRIOR1", "PRIOR2", "PRIOR3", "PRIOR4"];
  assert.equal(simulateVolumeAdmission(f, c, e.risk, e.quote).status, "SIMULATED_ADMISSION");
});
test("same security cannot be admitted twice", () => {
  const { f, c, e } = admission();
  e.risk.usedSecurities.push(f.securityId);
  assert.equal(
    simulateVolumeAdmission(f, c, e.risk, e.quote).reason,
    "SECURITY_ALREADY_OWNED_OR_ATTEMPTED",
  );
});
test("daily risk budget includes open committed risk", () => {
  const { f, c, e } = admission();
  e.risk.realizedLoss = "440.0000";
  e.risk.commitments = [{ securityId: "OTHER", state: "OPEN", notional: "1000", risk: "10" }];
  assert.equal(
    simulateVolumeAdmission(f, c, e.risk, e.quote).reason,
    "DAILY_RISK_BUDGET_EXHAUSTED",
  );
});
test("account drawdown halt uses dollars not heterogeneous trade R", () => {
  const { f, c, e } = admission();
  e.risk.accountDrawdown = "2250.0000";
  assert.equal(simulateVolumeAdmission(f, c, e.risk, e.quote).reason, "ACCOUNT_DRAWDOWN_HALT");
});
test("liquidity sizes down rather than requiring a full $5000 clip", () => {
  const f = volumeFixture();
  f.entryMinuteDollarVolume.value = "60000.0000";
  const c = evaluate(f),
    e = volumeFixtureEntry(f),
    a = simulateVolumeAdmission(f, c, e.risk, e.quote);
  assert.equal(a.status, "SIMULATED_ADMISSION");
  assert.equal(a.shares, "5");
});
test("quantity is integer and cannot exceed any notional cap", () => {
  const { f, c, e } = admission();
  for (const dollars of ["10100.0000", "33333.3333", "499999.9999"]) {
    f.entryMinuteDollarVolume.value = dollars;
    const candidate = evaluate(f),
      a = simulateVolumeAdmission(f, candidate, e.risk, e.quote);
    assert.ok(Number(a.simulatedNotional) <= Math.min(5000, Number(dollars) * 0.01));
  }
});
test("spread is checked against actual stop, not only ATR", () => {
  const { f, c, e } = admission();
  c.structuralStop = "100.280000000000";
  const { candidateId, ...raw } = c;
  c.candidateId = volumeResearchHash("candidate", raw);
  e.quote.bid = "100.270000";
  assert.equal(
    simulateVolumeAdmission(f, c, e.risk, e.quote).reason,
    "ENTRY_STOP_OR_SPREAD_INFEASIBLE",
  );
});
test("missing exit quote never invents flat or releases capacity", () => {
  const { a } = admission();
  const r = simulateVolumeExit(
    a,
    { coverage: "VERIFIED", fromAt: a.entryAt!, throughAt: a.exitDueAt!, quotes: [] },
    a.exitDueAt!,
  );
  assert.equal(r.status, "UNRESOLVED_EXIT");
  assert.equal(r.capacityReleased, false);
  assert.equal(r.netPnl, null);
});
test("unknown exit coverage remains unresolved", () => {
  const { a } = admission();
  assert.equal(
    simulateVolumeExit(
      a,
      { coverage: "UNKNOWN", fromAt: a.entryAt!, throughAt: a.exitDueAt!, quotes: [] },
      a.exitDueAt!,
    ).status,
    "UNRESOLVED_EXIT",
  );
});
test("time exit uses later bid less costs, not candle close", () => {
  const { a } = admission();
  const at = a.exitDueAt!,
    q = { bid: "100.500000", ask: "100.510000", observedAt: at, availableAt: at };
  const r = simulateVolumeExit(
    a,
    { coverage: "VERIFIED", fromAt: a.entryAt!, throughAt: at, quotes: [q] },
    at,
  );
  assert.equal(r.status, "SIMULATED_EXIT");
  assert.equal(r.exitPrice, "100.490000000000");
  assert.equal(r.netPnl, "8.820000000000");
});
test("gap through stop can lose more than initial planned R", () => {
  const { a } = admission();
  const at = new Date(Date.parse(a.entryAt!) + 1000).toISOString(),
    q = { bid: "98.000000", ask: "98.010000", observedAt: at, availableAt: at };
  const r = simulateVolumeExit(
    a,
    { coverage: "VERIFIED", fromAt: a.entryAt!, throughAt: at, quotes: [q] },
    at,
  );
  assert.equal(r.status, "SIMULATED_EXIT");
  assert.ok(Number(r.rMultiple) < -1);
});
test("future exit data cannot affect an earlier replay", () => {
  const { a } = admission();
  const at = a.exitDueAt!,
    q = {
      bid: "100.500000",
      ask: "100.510000",
      observedAt: at,
      availableAt: new Date(Date.parse(at) + 1).toISOString(),
    };
  assert.equal(
    simulateVolumeExit(
      a,
      { coverage: "VERIFIED", fromAt: a.entryAt!, throughAt: at, quotes: [q] },
      at,
    ).status,
    "UNRESOLVED_EXIT",
  );
});
test("partial fill is unprotected without resting stop quantity", () =>
  assert.equal(
    inspectPaperProtection({
      filledShares: "7",
      restingStopShares: "0",
      stopAcknowledged: false,
      entryComplete: false,
    }),
    "UNPROTECTED_FILLED_EXPOSURE",
  ));
test("acknowledged stop must cover all filled shares", () =>
  assert.equal(
    inspectPaperProtection({
      filledShares: "7",
      restingStopShares: "6",
      stopAcknowledged: true,
      entryComplete: true,
    }),
    "UNPROTECTED_FILLED_EXPOSURE",
  ));
test("adequate protection still carries no fill guarantee", () =>
  assert.equal(
    inspectPaperProtection({
      filledShares: "7",
      restingStopShares: "7",
      stopAcknowledged: true,
      entryComplete: false,
    }),
    "PROTECTION_ACKNOWLEDGED_NOT_GUARANTEED",
  ));
test("candidate and constrained portfolio ledgers stay separate", () => {
  const frames = Array.from({ length: 4 }, (_, i) => {
    const f = volumeFixture("S" + i);
    f.universeExpectedCount = "4";
    return f;
  });
  const entry = volumeFixtureEntry(frames[0]),
    saved = JSON.stringify(entry.risk),
    quotes = Object.fromEntries(frames.map((f) => [f.securityId, entry.quote]));
  const capture = buildVolumeCapture(frames, entry.risk, quotes);
  assert.equal(capture.qualifyingCount, "4");
  assert.equal(capture.simulatedAdmissionCount, "3");
  assert.equal(capture.portfolioLedger[3].reason, "CONCURRENT_CAPACITY_FULL");
  assert.equal(JSON.stringify(entry.risk), saved);
});
test("candidate-only census does not invent risk evidence", () => {
  const c = buildVolumeCapture([volumeFixture()], null, {});
  assert.equal(c.qualifyingCount, "1");
  assert.equal(c.simulatedAdmissionCount, "0");
});

test("candidate from a different policy vintage cannot use current execution assumptions", () => {
  const x = admission();
  x.c.policyHash = "0".repeat(64);
  const { candidateId, ...content } = x.c;
  x.c.candidateId = volumeResearchHash("candidate", content);
  assert.equal(
    simulateVolumeAdmission(x.f, x.c, x.e.risk, x.e.quote).reason,
    "POLICY_RECEIPT_MISMATCH",
  );
});
test("candidate metadata must match its pinned frame identity", () => {
  const x = admission();
  x.c.securityId = "WRONG_SECURITY";
  const { candidateId, ...content } = x.c;
  x.c.candidateId = volumeResearchHash("candidate", content);
  assert.equal(
    simulateVolumeAdmission(x.f, x.c, x.e.risk, x.e.quote).reason,
    "CANDIDATE_IDENTITY_MISMATCH",
  );
});
test("exit replay cannot mix policy and cost vintages", () => {
  const x = admission();
  x.a.policyHash = "0".repeat(64);
  const exit = simulateVolumeExit(
    x.a,
    { coverage: "VERIFIED", fromAt: x.a.entryAt!, throughAt: x.a.exitDueAt!, quotes: [] },
    x.a.exitDueAt!,
  );
  assert.equal(exit.reason, "POLICY_RECEIPT_MISMATCH");
  assert.equal(exit.capacityReleased, false);
});
