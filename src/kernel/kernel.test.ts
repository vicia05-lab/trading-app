import assert from "node:assert/strict";
import { test } from "node:test";
import {
  admitPredict,
  bandHit,
  canon,
  computeCardComplete,
  COST_MODEL_CONTENT,
  costModelHash,
  dec,
  decText,
  directionHit,
  evaluate,
  INITIAL_AST,
  inputHash,
  KernelError,
  modeledFill,
  normalizeReasons,
  outputHash,
  paperPnl,
  parseCj1,
  ruleAstHash,
  shuffle,
  validateAst,
} from "./index.ts";

test("H01 input hash golden vector", () => {
  const got = inputHash({
    manifestId: "manifest-20260914",
    securityId: "SEC-A",
    manifestHash: "1111111111111111111111111111111111111111111111111111111111111111",
    snapshotHash: "2222222222222222222222222222222222222222222222222222222222222222",
    ruleHash: "3333333333333333333333333333333333333333333333333333333333333333",
    engineHash: "4444444444444444444444444444444444444444444444444444444444444444",
    costHash: "5555555555555555555555555555555555555555555555555555555555555555",
    margin: 3,
    pins: [
      ["obs-z", "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"],
      ["obs-a", "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"],
    ],
  });
  assert.equal(got, "bac8f1353582276f85608c618ad44f104f5480fea76d03ce0dbcad4955522726");
});

test("H02 pin order does not change hash; content does", () => {
  const base = {
    manifestId: "manifest-20260914",
    securityId: "SEC-A",
    manifestHash: "1111111111111111111111111111111111111111111111111111111111111111",
    snapshotHash: "2222222222222222222222222222222222222222222222222222222222222222",
    ruleHash: "3333333333333333333333333333333333333333333333333333333333333333",
    engineHash: "4444444444444444444444444444444444444444444444444444444444444444",
    costHash: "5555555555555555555555555555555555555555555555555555555555555555",
    margin: 3,
  };
  const a = inputHash({
    ...base,
    pins: [
      ["obs-z", "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"],
      ["obs-a", "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"],
    ],
  });
  const b = inputHash({
    ...base,
    pins: [
      ["obs-a", "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"],
      ["obs-z", "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"],
    ],
  });
  assert.equal(a, b);
  const c = inputHash({
    ...base,
    pins: [
      ["obs-z", "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"],
      ["obs-b", "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"],
    ],
  });
  assert.notEqual(a, c);
});

test("H03 removing a pin or changing margin changes hash", () => {
  const pins: [string, string][] = [
    ["obs-z", "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"],
    ["obs-a", "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"],
  ];
  const args = {
    manifestId: "manifest-20260914",
    securityId: "SEC-A",
    manifestHash: "1111111111111111111111111111111111111111111111111111111111111111",
    snapshotHash: "2222222222222222222222222222222222222222222222222222222222222222",
    ruleHash: "3333333333333333333333333333333333333333333333333333333333333333",
    engineHash: "4444444444444444444444444444444444444444444444444444444444444444",
    costHash: "5555555555555555555555555555555555555555555555555555555555555555",
    margin: 3,
    pins,
  };
  const base = inputHash(args);
  assert.notEqual(inputHash({ ...args, pins: [pins[0]] }), base);
  assert.notEqual(inputHash({ ...args, margin: 4 }), base);
  assert.notEqual(inputHash({ ...args, manifestId: "manifest-other" }), base);
});

test("H05 rejects malformed hash inputs", () => {
  const good = {
    manifestId: "manifest-20260914",
    securityId: "SEC-A",
    manifestHash: "1111111111111111111111111111111111111111111111111111111111111111",
    snapshotHash: "2222222222222222222222222222222222222222222222222222222222222222",
    ruleHash: "3333333333333333333333333333333333333333333333333333333333333333",
    engineHash: "4444444444444444444444444444444444444444444444444444444444444444",
    costHash: "5555555555555555555555555555555555555555555555555555555555555555",
    margin: 3,
    pins: [["obs-a", "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"]] as [string, string][],
  };
  assert.throws(() => inputHash({ ...good, margin: 1 }), KernelError);
  assert.throws(() => inputHash({ ...good, margin: 16 }), KernelError);
  assert.throws(() => inputHash({ ...good, securityId: "SEC A" }), KernelError);
  assert.throws(() => inputHash({ ...good, pins: [["obs-a", "BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB"]] }), KernelError);
  assert.throws(() => inputHash({ ...good, pins: [["obs-a", "bbbb"]] }), KernelError);
});

test("H07 CJ1 rejects numbers and duplicate keys", () => {
  assert.throws(() => parseCj1(Buffer.from('{"a":1}', "utf8")), KernelError);
  assert.throws(() => parseCj1(Buffer.from('{"a":true,"a":false}', "utf8")), KernelError);
  const round = parseCj1(canon({ z: "é", a: true }));
  assert.deepEqual(round, { a: true, z: "é" });
  assert.equal(canon({ z: "é", a: true }).toString("hex"), "7b2261223a747275652c227a223a22c3a9227d");
});

test("H09 shuffle golden vector", () => {
  const got = shuffle(
    ["SEC-C", "SEC-A", "SEC-B"],
    "0101010101010101010101010101010101010101010101010101010101010101",
  );
  assert.deepEqual(got, ["SEC-A", "SEC-C", "SEC-B"]);
  assert.throws(() => shuffle(["SEC-A", "SEC-A"], "0101010101010101010101010101010101010101010101010101010101010101"), KernelError);
  assert.throws(() => shuffle(["SEC-A"], "01"), KernelError);
});

test("rule AST hash golden vector", () => {
  validateAst(INITIAL_AST);
  assert.equal(ruleAstHash(INITIAL_AST), "e9cf184a531fd993dc1b36ce0e1a1b0dcd67ebc4b80e4ff1ebe5a72ab00c15f4");
});

test("fill and pnl golden vectors", () => {
  assert.equal(modeledFill("123.456789"), "123.518517394500");
  assert.equal(
    paperPnl("5000.0000", "105.000000", "100.050000000000", "0.0000"),
    "247.3763",
  );
  assert.equal(modeledFill("100.000000"), "100.050000000000");
});

test("F01 initial AST predicts only the specified conjunction", () => {
  const card = {
    timing_quality: "ISSUER_CONFIRMED",
    card_complete: true,
    options_valid: true,
    implied_move: "0.080000000000",
    benchmark_relative_5d: "-0.012000000000",
    benchmark_relative_63d: "0.045000000000",
  };
  const ok = evaluate(INITIAL_AST, card);
  assert.equal(ok.decision, "PREDICT");
  assert.equal(ok.direction, "LONG");
  const lo = evaluate(INITIAL_AST, { ...card, implied_move: "0.039999999999" });
  assert.equal(lo.decision, "STAND_DOWN");
  const hi = evaluate(INITIAL_AST, { ...card, implied_move: "0.150000000001" });
  assert.equal(hi.decision, "STAND_DOWN");
  const eqLo = evaluate(INITIAL_AST, { ...card, implied_move: "0.040000000000" });
  assert.equal(eqLo.decision, "PREDICT");
  const eqHi = evaluate(INITIAL_AST, { ...card, implied_move: "0.150000000000" });
  assert.equal(eqHi.decision, "PREDICT");
});

test("F02 missing required values stand down; invalid rule is not a prediction", () => {
  const r = evaluate(INITIAL_AST, { card_complete: false });
  assert.equal(r.status, "OK");
  assert.equal(r.decision, "STAND_DOWN");
  const bad = evaluate({ schema: "nope" }, { card_complete: true });
  assert.equal(bad.status, "INVALID_RULE");
  assert.equal(bad.decision, "STAND_DOWN");
  assert.equal(bad.direction, null);
});

test("F03 F04 reject malformed AST and boolean substitutes", () => {
  assert.throws(() => validateAst({ ...INITIAL_AST, all: [] }), KernelError);
  assert.throws(
    () =>
      validateAst({
        ...INITIAL_AST,
        all: [{ field: "card_complete", op: "EQ", value: "true" }],
      }),
    KernelError,
  );
  const r = evaluate(INITIAL_AST, {
    timing_quality: "ISSUER_CONFIRMED",
    card_complete: true,
    options_valid: 1,
    implied_move: "0.080000000000",
    benchmark_relative_5d: "-0.012000000000",
    benchmark_relative_63d: "0.045000000000",
  });
  assert.equal(r.status, "INVALID_CARD");
  assert.equal(r.decision, "STAND_DOWN");
  assert.equal(r.direction, null);
});

test("F15 tiny positive raw return remains a direction hit", () => {
  assert.equal(directionHit("100.000000", "100.000001"), true);
  assert.equal(directionHit("100.000000", "100.000000"), false);
  assert.equal(directionHit("100.000000", "99.999999"), false);
  assert.equal(
    bandHit("100.000000", "108.000000", "0.040000000000", "0.160000000000"),
    true,
  );
  assert.equal(
    bandHit("100.000000", "103.000000", "0.040000000000", "0.160000000000"),
    false,
  );
});

test("cost model hash is stable", () => {
  const a = costModelHash(COST_MODEL_CONTENT);
  const b = costModelHash({ ...COST_MODEL_CONTENT });
  assert.equal(a, b);
  assert.match(a, /^[0-9a-f]{64}$/);
});

test("decimal domain rejects negative zero and excess scale", () => {
  assert.throws(() => dec("-0", 4), KernelError);
  assert.throws(() => dec("1.0000001", 6), KernelError);
  assert.throws(() => dec("0", 6, "0.000001", "1000000"), KernelError);
});

const H01 = "bac8f1353582276f85608c618ad44f104f5480fea76d03ce0dbcad4955522726";

const COMPLETE_CARD = {
  timing_quality: "ISSUER_CONFIRMED",
  card_complete: true,
  options_valid: true,
  implied_move: "0.080000000000",
  benchmark_relative_5d: "-0.012000000000",
  benchmark_relative_63d: "0.045000000000",
};

test("P01 paperPnl rejects floats", () => {
  assert.throws(() => paperPnl(5000 as unknown as string, "105.000000", "100.050000000000"), KernelError);
  assert.equal(paperPnl("5000.0000", "105.000000", "100.050000000000", "0.0000"), "247.3763");
});

test("P02 paperPnl rejects nonpositive fill", () => {
  assert.throws(() => paperPnl("5000.0000", "105.000000", "-100.000000"), KernelError);
  assert.throws(() => paperPnl("5000.0000", "105.000000", "0.000000000000"), KernelError);
  assert.throws(() => paperPnl("5000.0000", "-105.000000", "100.050000000000"), KernelError);
});

test("P03 hit tests reject floats and inverted bands", () => {
  assert.throws(() => directionHit(100 as unknown as string, 101 as unknown as string), KernelError);
  assert.throws(
    () => bandHit("100.000000", "108.000000", "0.160000000000", "0.040000000000"),
    KernelError,
  );
  assert.equal(directionHit("100.000000", "100.000001"), true);
  assert.equal(directionHit("100.000000", "100.000000"), false);
});

test("P04 admission rejects corrupt state", () => {
  const base = {
    paused: false,
    cutoffPassed: false,
    timingQuality: "ISSUER_CONFIRMED",
    cardComplete: true,
    reservedCount: 0,
    reservedNotional: dec("0.0000", 4),
    sameEventOpen: 0,
    alreadyOwned: false,
  };
  assert.throws(() => admitPredict({ ...base, reservedNotional: dec("-1.0000", 4) }), KernelError);
  assert.throws(() => admitPredict({ ...base, reservedCount: -5 }), KernelError);
  assert.throws(() => admitPredict({ ...base, reservedNotional: 0 }), KernelError);
  assert.throws(() => admitPredict({ ...base, paused: 0 }), KernelError);
  assert.equal(admitPredict(base).outcome, "ADMITTED");
  const pennyOver = admitPredict({ ...base, reservedCount: 2, reservedNotional: dec("10000.0001", 4) });
  assert.equal(pennyOver.outcome, "DENIED");
  assert.ok(pennyOver.reason_codes.includes("CAPACITY_NOTIONAL"));
});

test("P05 modeledFill requires canonical text", () => {
  for (const bad of ["1E2", "1e2", "+100.000000", " 100.000000", "100.000000 ", "100", "Inf", "NaN", ".5", "1.", "01.000000", ""]) {
    assert.throws(() => modeledFill(bad), KernelError, `accepted ${bad}`);
  }
  assert.throws(() => modeledFill("100.000000", "5e-4"), KernelError);
  assert.equal(modeledFill("123.456789"), "123.518517394500");
  assert.equal(decText("100.0000", "INVALID_DECIMAL_TEXT", 4), "100.0000");
  assert.throws(() => decText("100.000", "INVALID_DECIMAL_TEXT", 4), KernelError);
});

test("P06 gatekeepers agree on canonicality", () => {
  const loose = {
    timing_quality: "ISSUER_CONFIRMED",
    options_valid: true,
    implied_move: "0.08",
    benchmark_relative_5d: "-0.01",
    benchmark_relative_63d: "0.04",
  };
  assert.equal(computeCardComplete(loose), false);
  assert.equal(evaluate(INITIAL_AST, { ...loose, card_complete: true }).status, "INVALID_CARD");
  const strict = { ...COMPLETE_CARD };
  delete (strict as { card_complete?: boolean }).card_complete;
  assert.equal(computeCardComplete(strict), true);
  assert.equal(evaluate(INITIAL_AST, COMPLETE_CARD).decision, "PREDICT");
});

test("P07 reason order is canonical for outputHash", () => {
  const a = outputHash(H01, { decision: "STAND_DOWN", reasons: ["A", "B"] });
  assert.throws(() => outputHash(H01, { decision: "STAND_DOWN", reasons: ["B", "A"] }), KernelError);
  const b = outputHash(H01, { decision: "STAND_DOWN", reasons: normalizeReasons(["B", "A"]) });
  assert.equal(a, b);
  const r = evaluate(INITIAL_AST, COMPLETE_CARD);
  assert.match(outputHash(H01, r), /^[0-9a-f]{64}$/);
});
