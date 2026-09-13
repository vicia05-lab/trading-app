import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  astFromThresholds,
  defaultThresholds,
  humanRuleBullets,
  proposeThresholds,
  thresholdsFromAst,
} from "./learn-policy.ts";
import { INITIAL_AST, evaluate, ruleAstHash } from "../kernel/index.ts";

describe("learning loop", () => {
  it("reads v1 thresholds from the registered AST", () => {
    const t = thresholdsFromAst(INITIAL_AST);
    assert.equal(t.implied_move_gte, "0.040000000000");
    assert.equal(t.implied_move_lte, "0.150000000000");
    assert.equal(t.rel5_lt, "0.000000000000");
  });

  it("holds when the sample is too small", () => {
    const p = proposeThresholds(defaultThresholds(), 2, 0);
    assert.equal(p.adopted, false);
    assert.equal(p.changed, false);
    assert.match(p.reason, /Not enough clean labels/);
  });

  it("tightens after a losing vintage", () => {
    const p = proposeThresholds(defaultThresholds(), 4, 1);
    assert.equal(p.adopted, true);
    assert.equal(p.next.implied_move_gte, "0.050000000000");
    assert.equal(p.next.implied_move_lte, "0.140000000000");
    assert.equal(p.next.rel5_lt, "-0.005000000000");
    astFromThresholds(p.next);
  });

  it("holds on a modest winning vintage", () => {
    const p = proposeThresholds(defaultThresholds(), 4, 3);
    assert.equal(p.adopted, false);
    assert.equal(p.next.implied_move_gte, defaultThresholds().implied_move_gte);
  });

  it("widens slightly after a larger winning vintage", () => {
    const p = proposeThresholds(defaultThresholds(), 6, 5);
    assert.equal(p.adopted, true);
    assert.equal(p.next.implied_move_gte, "0.035000000000");
  });

  it("round-trips a learned AST through the evaluator", () => {
    const p = proposeThresholds(defaultThresholds(), 4, 1);
    const ast = astFromThresholds(p.next);
    const card = {
      timing_quality: "ISSUER_CONFIRMED",
      card_complete: true,
      options_valid: true,
      implied_move: "0.045000000000",
      benchmark_relative_5d: "-0.001000000000",
      benchmark_relative_63d: "0.020000000000",
    };
    const miss = evaluate(ast, card);
    assert.equal(miss.decision, "STAND_DOWN");
    const hit = evaluate(ast, { ...card, implied_move: "0.060000000000", benchmark_relative_5d: "-0.010000000000" });
    assert.equal(hit.decision, "PREDICT");
    assert.notEqual(ruleAstHash(ast), ruleAstHash(INITIAL_AST));
    assert.ok(humanRuleBullets(p.next).length === 4);
  });
});
