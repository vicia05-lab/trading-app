/** Estimated research admissions and exits, not broker orders or live reservations. */
import { z } from "zod";
import { volumePolicyHash } from "./volume-research.ts";
import { add, sub, mul, div, cmp, dec, decToCanonical } from "./index.ts";
import type { Dec } from "./index.ts";
import { VOLUME_POLICY as P } from "../desk/volume-policy.ts";
import { timestamp, volumeFrameSchema, volumeResearchHash } from "./volume-research.ts";
import type { VolumeCandidate, VolumeFrame } from "./volume-research.ts";
const amount = z.string().regex(/^(?:0|[1-9]\d{0,12})(?:\.\d{1,12})?$/);
const D = (s: string) => dec(s, 12),
  F = (d: Dec) => decToCanonical(d, 12),
  Z = () => D("0");
const min = (a: Dec, b: Dec) => (cmp(a, b) < 0 ? a : b);
const sum = (xs: Dec[]) => xs.reduce(add, Z());
const floorRatio = (a: Dec, b: Dec) => {
  if (a.neg || b.neg || b.unscaled === 0n) throw new Error("INVALID_QUANTITY_RATIO");
  return (a.unscaled * 10n ** BigInt(b.scale)) / (b.unscaled * 10n ** BigInt(a.scale));
};
const quoteSchema = volumeFrameSchema.shape.quote;
const riskSchema = z
  .object({
    sessionDate: z.string(),
    observedAt: timestamp,
    availableAt: timestamp,
    verified: z.boolean(),
    realizedLoss: amount,
    accountDrawdown: amount,
    usedSecurities: z.array(z.string()).max(10000),
    commitments: z
      .array(
        z
          .object({
            securityId: z.string(),
            state: z.enum(["PENDING", "OPEN", "IMPAIRED", "CLOSED_CONFIRMED"]),
            notional: amount,
            risk: amount,
          })
          .strict(),
      )
      .max(1000),
  })
  .strict();
export type VolumeRiskSnapshot = z.infer<typeof riskSchema>;
export type ResearchQuote = z.infer<typeof quoteSchema>;
export type VolumeAdmission = {
  policyHash: string;
  status: "SIMULATED_ADMISSION" | "REJECTED";
  reason: string;
  securityId: string;
  candidateId: string;
  sessionDate: string;
  entryAt: string | null;
  entryPrice: string | null;
  shares: string;
  structuralStop: string | null;
  exitDueAt: string | null;
  simulatedNotional: string;
  simulatedRisk: string;
  capitalReserved: "0.0000";
  isOrder: false;
  executionEnabled: false;
  paperOnly: true;
  liveTradingSupported: false;
  pnlStatus: "ESTIMATED";
  costStatus: string;
};
function rejected(c: VolumeCandidate, reason: string): VolumeAdmission {
  return {
    policyHash: c.policyHash,
    status: "REJECTED",
    reason,
    securityId: c.securityId,
    candidateId: c.candidateId,
    sessionDate: c.sessionDate,
    entryAt: null,
    entryPrice: null,
    shares: "0",
    structuralStop: null,
    exitDueAt: null,
    simulatedNotional: "0.0000",
    simulatedRisk: "0.0000",
    capitalReserved: "0.0000",
    isOrder: false,
    executionEnabled: false,
    paperOnly: true,
    liveTradingSupported: false,
    pnlStatus: "ESTIMATED",
    costStatus: P.executionModel.costStatus,
  };
}
/** Caller supplies a fresh shared-account snapshot. This never acquires a real broker lock. */
export function simulateVolumeAdmission(
  frame: VolumeFrame,
  candidate: VolumeCandidate,
  rawRisk: unknown,
  rawQuote: unknown,
): VolumeAdmission {
  const no = (reason: string) => rejected(candidate, reason);
  const f = volumeFrameSchema.safeParse(frame),
    r = riskSchema.safeParse(rawRisk),
    q = quoteSchema.safeParse(rawQuote);
  if (!f.success || !r.success || !q.success) return no("INVALID_ADMISSION_EVIDENCE");
  if (candidate.policyHash !== volumePolicyHash()) return no("POLICY_RECEIPT_MISMATCH");
  if (
    candidate.securityId !== f.data.securityId ||
    candidate.sessionDate !== f.data.sessionDate ||
    candidate.decisionAt !== f.data.decisionAt
  )
    return no("CANDIDATE_IDENTITY_MISMATCH");
  const { candidateId, ...content } = candidate;
  if (
    candidateId !== volumeResearchHash("candidate", content) ||
    candidate.inputHash !== volumeResearchHash("frame", f.data)
  )
    return no("CANDIDATE_RECEIPT_MISMATCH");
  if (candidate.status !== "LONG_CANDIDATE" || !candidate.structuralStop)
    return no("NOT_A_CANDIDATE");
  const risk = r.data,
    quote = q.data,
    observed = Date.parse(quote.observedAt),
    available = Date.parse(quote.availableAt),
    decision = Date.parse(frame.decisionAt);
  if (
    available < observed ||
    available - observed > Number(P.executionModel.maxQuoteAgeMs) ||
    observed < decision + Number(P.executionModel.latencyMs)
  )
    return no("NEXT_ELIGIBLE_QUOTE_REQUIRED");
  if (available >= decision + Number(P.executionModel.cancelAfterMs))
    return no("ENTRY_EXPIRED_NO_FILL");
  if (available >= Date.parse(frame.closeAt) - 15 * 60000) return no("ENTRY_WINDOW_CLOSED");
  if (
    !risk.verified ||
    risk.sessionDate !== frame.sessionDate ||
    Date.parse(risk.availableAt) > available ||
    Date.parse(risk.observedAt) > Date.parse(risk.availableAt) ||
    available - Date.parse(risk.observedAt) > Number(P.executionModel.maxQuoteAgeMs)
  )
    return no("SHARED_RISK_UNVERIFIED");
  if (cmp(D(risk.accountDrawdown), D(P.risk.accountDrawdownHalt)) >= 0)
    return no("ACCOUNT_DRAWDOWN_HALT");
  const active = risk.commitments.filter((p) => p.state !== "CLOSED_CONFIRMED");
  if (new Set(active.map((x) => x.securityId)).size !== active.length)
    return no("SHARED_RISK_DUPLICATE_SECURITY");
  if (active.some((x) => cmp(D(x.notional), Z()) <= 0 || cmp(D(x.risk), Z()) <= 0))
    return no("INVALID_COMMITTED_RISK");
  if (
    active.some((p) => p.securityId === frame.securityId) ||
    risk.usedSecurities.includes(frame.securityId)
  )
    return no("SECURITY_ALREADY_OWNED_OR_ATTEMPTED");
  if (active.length >= Number(P.risk.maxConcurrent)) return no("CONCURRENT_CAPACITY_FULL");
  const gross = sum(active.map((p) => D(p.notional))),
    openRisk = sum(active.map((p) => D(p.risk)));
  const notionalBudget = min(D(P.risk.maxPositionNotional), sub(D(P.risk.maxGrossNotional), gross));
  const riskBudget = min(
    D(P.risk.perTradeRisk),
    sub(sub(D(P.risk.dailyLossBudget), D(risk.realizedLoss)), openRisk),
  );
  if (cmp(notionalBudget, Z()) <= 0) return no("GROSS_CAPACITY_FULL");
  if (cmp(riskBudget, Z()) <= 0) return no("DAILY_RISK_BUDGET_EXHAUSTED");
  const bid = D(quote.bid),
    ask = D(quote.ask),
    spread = sub(ask, bid),
    stop = D(candidate.structuralStop);
  if (cmp(bid, Z()) <= 0 || cmp(spread, Z()) <= 0) return no("CROSSED_OR_LOCKED_ENTRY_QUOTE");
  // Limit is fixed from the signal quote, not increased to chase a later ask.
  const limit = add(D(frame.quote.ask), D(P.executionModel.entrySlippagePerShare));
  const entry = add(ask, D(P.executionModel.entrySlippagePerShare));
  if (cmp(entry, limit) > 0) return no("LIMIT_NOT_MARKETABLE_NO_FILL");
  const stopDistance = sub(limit, stop),
    riskPerShare = add(
      add(stopDistance, D(P.executionModel.exitSlippagePerShare)),
      D(P.executionModel.roundTripFeePerShare),
    );
  const mid = div(add(ask, bid), D("2"), 12);
  if (
    cmp(stop, Z()) <= 0 ||
    cmp(stopDistance, Z()) <= 0 ||
    cmp(stopDistance, mul(D(frame.atr.value), D(P.risk.maxStopAtr))) > 0 ||
    cmp(spread, mul(sub(entry, stop), D(P.risk.maxSpreadRiskFraction))) > 0 ||
    cmp(mul(spread, D("10000")), mul(mid, D(P.risk.maxSpreadBps))) > 0
  )
    return no("ENTRY_STOP_OR_SPREAD_INFEASIBLE");
  const liquidityBudget = mul(
    D(frame.entryMinuteDollarVolume.value),
    D(P.risk.participationFraction),
  );
  const quantities = [
    floorRatio(notionalBudget, limit),
    floorRatio(riskBudget, riskPerShare),
    floorRatio(liquidityBudget, limit),
  ];
  const qty = quantities.reduce((a, b) => (a < b ? a : b));
  if (qty < 1n) return no("LIQUIDITY_OR_RISK_BELOW_ONE_SHARE");
  const qd = D(qty.toString()),
    exitDue = Math.min(
      available + Number(P.executionModel.maxHoldMs),
      Date.parse(frame.closeAt) - Number(P.executionModel.flattenBeforeCloseMs),
    );
  return {
    ...no("ESTIMATED_NEXT_QUOTE_ADMISSION"),
    status: "SIMULATED_ADMISSION",
    entryAt: quote.availableAt,
    entryPrice: F(entry),
    shares: qty.toString(),
    structuralStop: candidate.structuralStop,
    exitDueAt: new Date(exitDue).toISOString(),
    simulatedNotional: F(mul(limit, qd)),
    simulatedRisk: F(mul(riskPerShare, qd)),
  };
}
export type ExitTape = {
  coverage: "VERIFIED" | "UNKNOWN";
  fromAt: string;
  throughAt: string;
  quotes: ResearchQuote[];
};
export type VolumeExit = {
  status: "SIMULATED_EXIT" | "OPEN" | "UNRESOLVED_EXIT";
  reason: string;
  exitAt: string | null;
  exitPrice: string | null;
  netPnl: string | null;
  rMultiple: string | null;
  capacityReleased: boolean;
  pnlStatus: "ESTIMATED";
  isOrder: false;
};
/** No OHLC fills, no invented closing quote, and no capacity release on missing evidence. */
export function simulateVolumeExit(
  position: VolumeAdmission,
  tape: ExitTape,
  asOfAt: string,
): VolumeExit {
  const output = (status: VolumeExit["status"], reason: string): VolumeExit => ({
    status,
    reason,
    exitAt: null,
    exitPrice: null,
    netPnl: null,
    rMultiple: null,
    capacityReleased: false,
    pnlStatus: "ESTIMATED",
    isOrder: false,
  });
  if (
    position.status !== "SIMULATED_ADMISSION" ||
    !position.entryAt ||
    !position.exitDueAt ||
    !position.entryPrice ||
    !position.structuralStop
  )
    return output("UNRESOLVED_EXIT", "INVALID_SIMULATED_POSITION");
  if (
    !timestamp.safeParse(asOfAt).success ||
    !timestamp.safeParse(tape.fromAt).success ||
    !timestamp.safeParse(tape.throughAt).success ||
    !Array.isArray(tape.quotes) ||
    tape.quotes.length > 100000
  )
    return output("UNRESOLVED_EXIT", "INVALID_EXIT_TAPE");
  if (position.policyHash !== volumePolicyHash())
    return output("UNRESOLVED_EXIT", "POLICY_RECEIPT_MISMATCH");
  const now = Date.parse(asOfAt),
    entered = Date.parse(position.entryAt),
    due = Date.parse(position.exitDueAt);
  if (
    tape.coverage !== "VERIFIED" ||
    Date.parse(tape.fromAt) !== entered ||
    Date.parse(tape.throughAt) !== now ||
    now < entered
  )
    return output("UNRESOLVED_EXIT", "EXIT_COVERAGE_UNVERIFIED");
  let previousObserved = entered,
    previousAvailable = entered;
  // Validate the complete prefix before returning a simulated exit. Future tape is rejected.
  for (const raw of tape.quotes) {
    const parsed = quoteSchema.safeParse(raw);
    if (!parsed.success) return output("UNRESOLVED_EXIT", "INVALID_EXIT_QUOTE");
    const q = parsed.data,
      observed = Date.parse(q.observedAt),
      available = Date.parse(q.availableAt);
    if (
      observed <= previousObserved ||
      available < previousAvailable ||
      available < observed ||
      available > now ||
      available - observed > Number(P.executionModel.maxQuoteAgeMs) ||
      cmp(D(q.bid), Z()) <= 0 ||
      cmp(D(q.ask), D(q.bid)) <= 0
    )
      return output("UNRESOLVED_EXIT", "UNORDERED_OR_INVALID_EXIT_TAPE");
    previousObserved = observed;
    previousAvailable = available;
  }
  for (const q of tape.quotes) {
    const stopHit = cmp(D(q.bid), D(position.structuralStop)) <= 0,
      deadline = Date.parse(q.observedAt) >= due;
    if (!stopHit && !deadline) continue;
    const exit = sub(D(q.bid), D(P.executionModel.exitSlippagePerShare));
    if (cmp(exit, Z()) <= 0) return output("UNRESOLVED_EXIT", "INVALID_MODELED_EXIT_PRICE");
    const pnl = mul(
      sub(sub(exit, D(position.entryPrice)), D(P.executionModel.roundTripFeePerShare)),
      D(position.shares),
    );
    const risk = D(position.simulatedRisk);
    if (cmp(risk, Z()) <= 0) return output("UNRESOLVED_EXIT", "INVALID_R_DENOMINATOR");
    return {
      ...output(
        "SIMULATED_EXIT",
        stopHit ? "STOP_TRIGGER_NEXT_BID_ESTIMATE" : "TIME_EXIT_NEXT_BID_ESTIMATE",
      ),
      exitAt: q.availableAt,
      exitPrice: F(exit),
      netPnl: F(pnl),
      rMultiple: F(div(pnl, risk, 12)),
      capacityReleased: true,
    };
  }
  return now >= due
    ? output("UNRESOLVED_EXIT", "EXIT_DUE_WITHOUT_ELIGIBLE_QUOTE")
    : output("OPEN", "NO_EXIT_TRIGGER");
}
/** Partial entry fills require protection too. A bracket submission alone is not proof. */
export function inspectPaperProtection(input: {
  filledShares: string;
  restingStopShares: string;
  stopAcknowledged: boolean;
  entryComplete: boolean;
}): string {
  if (!/^\d+$/.test(input.filledShares) || !/^\d+$/.test(input.restingStopShares))
    return "UNKNOWN_PROTECTION";
  const filled = BigInt(input.filledShares),
    protectedQty = BigInt(input.restingStopShares);
  if (filled === 0n) return "NO_FILLED_EXPOSURE";
  return input.stopAcknowledged && protectedQty >= filled
    ? "PROTECTION_ACKNOWLEDGED_NOT_GUARANTEED"
    : "UNPROTECTED_FILLED_EXPOSURE";
}
