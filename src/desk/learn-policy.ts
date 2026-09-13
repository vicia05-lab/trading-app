import { dec, decToCanonical, quantizeHalfUp, validateAst } from "../kernel/index.ts";

export type Thresholds = {
  implied_move_gte: string;
  implied_move_lte: string;
  rel5_lt: string;
  rel63_gt: string;
};

const MIN_N = 3;

function canonDec(n: number): string {
  const clamped = Number.isFinite(n) ? n : 0;
  return decToCanonical(quantizeHalfUp(dec(clamped.toFixed(12), 12, "-1000000", "1000000"), 12), 12);
}

export function defaultThresholds(): Thresholds {
  return {
    implied_move_gte: "0.040000000000",
    implied_move_lte: "0.150000000000",
    rel5_lt: "0.000000000000",
    rel63_gt: "0.000000000000",
  };
}

export function thresholdsFromAst(ast: unknown): Thresholds {
  const t = defaultThresholds();
  if (!ast || typeof ast !== "object" || !("all" in ast) || !Array.isArray((ast as { all: unknown }).all)) return t;
  for (const raw of (ast as { all: Array<{ field?: string; op?: string; value?: unknown }> }).all) {
    if (!raw || typeof raw.value !== "string") continue;
    if (raw.field === "implied_move" && raw.op === "GTE") t.implied_move_gte = raw.value;
    if (raw.field === "implied_move" && raw.op === "LTE") t.implied_move_lte = raw.value;
    if (raw.field === "benchmark_relative_5d" && raw.op === "LT") t.rel5_lt = raw.value;
    if (raw.field === "benchmark_relative_63d" && raw.op === "GT") t.rel63_gt = raw.value;
  }
  return t;
}

export function astFromThresholds(t: Thresholds): unknown {
  const ast = {
    schema: "1",
    decision: "PREDICT",
    direction: "LONG",
    otherwise: "STAND_DOWN",
    all: [
      { field: "timing_quality", op: "EQ", value: "ISSUER_CONFIRMED" },
      { field: "card_complete", op: "EQ", value: true },
      { field: "options_valid", op: "EQ", value: true },
      { field: "implied_move", op: "GTE", value: t.implied_move_gte },
      { field: "implied_move", op: "LTE", value: t.implied_move_lte },
      { field: "benchmark_relative_5d", op: "LT", value: t.rel5_lt },
      { field: "benchmark_relative_63d", op: "GT", value: t.rel63_gt },
    ],
  };
  validateAst(ast);
  return ast;
}

function pct(v: string): string {
  return (Number(v) * 100).toFixed(1).replace(/\.0$/, "");
}

export function humanRuleText(t: Thresholds): string {
  return (
    `Predict LONG when issuer-confirmed AMC, complete card, valid options, ` +
    `implied move in [${pct(t.implied_move_gte)}%, ${pct(t.implied_move_lte)}%], ` +
    `5d relative < ${t.rel5_lt}, 63d relative > ${t.rel63_gt}.`
  );
}

export function humanRuleBullets(t: Thresholds): string[] {
  return [
    "After close, issuer confirmed",
    `Expected move ${pct(t.implied_move_gte)}% to ${pct(t.implied_move_lte)}%`,
    Number(t.rel5_lt) < 0
      ? `Five-day return at least ${pct(t.rel5_lt)}% below the market`
      : "Five-day return below the market",
    Number(t.rel63_gt) > 0
      ? `Sixty-three-day return at least ${pct(t.rel63_gt)}% above the market`
      : "Sixty-three-day return above the market",
  ];
}

export function proposeThresholds(current: Thresholds, n: number, hits: number): {
  next: Thresholds;
  changed: boolean;
  adopted: boolean;
  reason: string;
} {
  if (n < MIN_N) {
    return {
      next: current,
      changed: false,
      adopted: false,
      reason: `Not enough clean labels to change the rule (${n} usable; ${MIN_N} required). Past decisions stay as recorded.`,
    };
  }
  let gte = Number(current.implied_move_gte);
  let lte = Number(current.implied_move_lte);
  let rel5 = Number(current.rel5_lt);
  const rel63 = Number(current.rel63_gt);
  const rate = hits / n;
  let reason: string;
  if (rate < 0.5) {
    gte = Math.min(0.08, gte + 0.01);
    lte = Math.max(gte + 0.04, Math.max(0.1, lte - 0.01));
    rel5 = Math.max(-0.02, rel5 - 0.005);
    reason = `Direction was correct on ${hits} of ${n} clean labels. Next lock uses a tighter expected-move band and a deeper 5-day pullback. Already-recorded decisions are not rewritten.`;
  } else if (rate >= 0.6 && n >= 6) {
    gte = Math.max(0.03, gte - 0.005);
    reason = `Direction was correct on ${hits} of ${n} clean labels. Next lock allows a slightly wider expected-move band. Already-recorded decisions are not rewritten.`;
  } else {
    reason = `Direction was correct on ${hits} of ${n} clean labels. Thresholds held. Already-recorded decisions are not rewritten.`;
  }
  if (lte - gte < 0.04) lte = gte + 0.04;
  const next: Thresholds = {
    implied_move_gte: canonDec(gte),
    implied_move_lte: canonDec(lte),
    rel5_lt: canonDec(rel5),
    rel63_gt: canonDec(rel63),
  };
  const changed =
    next.implied_move_gte !== current.implied_move_gte ||
    next.implied_move_lte !== current.implied_move_lte ||
    next.rel5_lt !== current.rel5_lt ||
    next.rel63_gt !== current.rel63_gt;
  return { next, changed, adopted: changed, reason };
}
