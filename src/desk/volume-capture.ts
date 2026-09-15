/** Single deterministic batch: candidate ledger is distinct from constrained model admissions. */
import {
  evaluateVolumeCohort,
  volumeResearchHash,
  volumePolicyHash,
  volumeFrameSchema,
} from "../kernel/volume-research.ts";
import type {
  VolumeRiskSnapshot,
  ResearchQuote,
  VolumeAdmission,
} from "../kernel/volume-replay.ts";
import { simulateVolumeAdmission } from "../kernel/volume-replay.ts";
export function buildVolumeCapture(
  frames: unknown[],
  risk: VolumeRiskSnapshot | null,
  quotes: Record<string, ResearchQuote>,
) {
  const candidateLedger = evaluateVolumeCohort(frames);
  const portfolioLedger: VolumeAdmission[] = [];
  // Clone before adding simulated commitments; caller's real snapshot is never mutated.
  const simulatedRisk = risk === null ? null : structuredClone(risk);
  const order = candidateLedger
    .map((candidate, index) => ({ candidate, index }))
    .sort(
      (a, b) =>
        Number(a.candidate.rank ?? "999999") - Number(b.candidate.rank ?? "999999") ||
        Buffer.compare(Buffer.from(a.candidate.securityId), Buffer.from(b.candidate.securityId)),
    );
  for (const { candidate, index } of order) {
    const parsed = volumeFrameSchema.safeParse(frames[index]);
    if (!parsed.success) continue;
    const admission = simulateVolumeAdmission(
      parsed.data,
      candidate,
      simulatedRisk,
      quotes[candidate.securityId] ?? null,
    );
    portfolioLedger.push(admission);
    if (admission.status === "SIMULATED_ADMISSION" && simulatedRisk) {
      simulatedRisk.commitments.push({
        securityId: candidate.securityId,
        state: "OPEN",
        notional: admission.simulatedNotional,
        risk: admission.simulatedRisk,
      });
      simulatedRisk.usedSecurities.push(candidate.securityId);
    }
  }
  const payload = {
    schema: "2.1",
    policyHash: volumePolicyHash(),
    candidateLedger,
    portfolioLedger,
    candidateCount: String(candidateLedger.length),
    qualifyingCount: String(candidateLedger.filter((x) => x.status === "LONG_CANDIDATE").length),
    simulatedAdmissionCount: String(
      portfolioLedger.filter((x) => x.status === "SIMULATED_ADMISSION").length,
    ),
    evidenceStatus: "EXPLORATORY_NOT_OOS",
    executionEnabled: false,
    isOrder: false,
    capitalReserved: "0.0000",
    pnlStatus: "ESTIMATED",
  };
  return { ...payload, captureHash: volumeResearchHash("capture", payload) };
}
export type VolumeCapture = ReturnType<typeof buildVolumeCapture>;
