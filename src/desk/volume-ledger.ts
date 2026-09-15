/** Research receipts use the application's existing writer transaction and event sequence. */
import { ident } from "../kernel/index.ts";
import { VOLUME_POLICY } from "./volume-policy.ts";
import { volumePolicyHash, volumeResearchHash } from "../kernel/volume-research.ts";
import type { VolumeCapture } from "./volume-capture.ts";
export type VolumeLedgerReceipt = {
  kind: "REGISTRY" | "CAPTURE";
  owner: string;
  eventSeq: string;
  policyHash: string;
  contentHash: string;
  registeredAt: string;
  registryCommandId: string | null;
  executionEnabled: false;
};
export type VolumeLedgerContext = {
  actor: string;
  seq: number;
  now: Date;
  find: (commandId: string) => Promise<VolumeLedgerReceipt | null>;
  append: (
    commandId: string,
    type: string,
    payload: unknown,
    receipt: VolumeLedgerReceipt,
  ) => Promise<void>;
};
export class ExistingVolumeReceipt extends Error {
  receipt: VolumeLedgerReceipt;
  constructor(receipt: VolumeLedgerReceipt) {
    super("IDEMPOTENT_VOLUME_RECEIPT");
    this.receipt = receipt;
  }
}
function checkExisting(
  existing: VolumeLedgerReceipt | null,
  owner: string,
  kind: VolumeLedgerReceipt["kind"],
  hash: string,
) {
  if (!existing) return;
  if (existing.owner !== owner || existing.kind !== kind || existing.contentHash !== hash)
    throw new Error("VOLUME_IDEMPOTENCY_CONFLICT");
  throw new ExistingVolumeReceipt(existing);
}
export async function registerVolumeLedger(
  ctx: VolumeLedgerContext,
  commandId: string,
): Promise<VolumeLedgerReceipt> {
  ident(commandId);
  ident(ctx.actor);
  const policyHash = volumePolicyHash();
  checkExisting(await ctx.find(commandId), ctx.actor, "REGISTRY", policyHash);
  const receipt: VolumeLedgerReceipt = {
    kind: "REGISTRY",
    owner: ctx.actor,
    eventSeq: String(ctx.seq),
    policyHash,
    contentHash: policyHash,
    registeredAt: ctx.now.toISOString(),
    registryCommandId: null,
    executionEnabled: false,
  };
  await ctx.append(
    commandId,
    "VOLUME_RESEARCH_REGISTRY",
    {
      schema: "2.1",
      policy: VOLUME_POLICY,
      owner: ctx.actor,
      trialHistoryComplete: false,
      oosClaim: false,
    },
    receipt,
  );
  return receipt;
}
export async function appendVolumeCapture(
  ctx: VolumeLedgerContext,
  commandId: string,
  registryCommandId: string,
  capture: VolumeCapture,
): Promise<VolumeLedgerReceipt> {
  ident(commandId);
  ident(registryCommandId);
  ident(ctx.actor);
  const { captureHash, ...payload } = capture;
  if (
    captureHash !== volumeResearchHash("capture", payload) ||
    capture.policyHash !== volumePolicyHash()
  )
    throw new Error("VOLUME_CAPTURE_HASH_MISMATCH");
  const requestHash = volumeResearchHash("capture-command", { registryCommandId, captureHash });
  checkExisting(await ctx.find(commandId), ctx.actor, "CAPTURE", requestHash);
  const registry = await ctx.find(registryCommandId);
  if (
    !registry ||
    registry.kind !== "REGISTRY" ||
    registry.owner !== ctx.actor ||
    registry.policyHash !== capture.policyHash ||
    Date.parse(registry.registeredAt) > ctx.now.getTime()
  )
    throw new Error("VOLUME_REGISTRY_REQUIRED");
  if (
    capture.candidateLedger.some(
      (c) =>
        !Number.isFinite(Date.parse(c.decisionAt)) || Date.parse(c.decisionAt) > ctx.now.getTime(),
    )
  )
    throw new Error("VOLUME_CAPTURE_AFTER_WRITER_CLOCK");
  const receipt: VolumeLedgerReceipt = {
    kind: "CAPTURE",
    owner: ctx.actor,
    eventSeq: String(ctx.seq),
    policyHash: capture.policyHash,
    contentHash: requestHash,
    registeredAt: registry.registeredAt,
    registryCommandId,
    executionEnabled: false,
  };
  await ctx.append(
    commandId,
    "VOLUME_RESEARCH_CAPTURE",
    {
      ...capture,
      owner: ctx.actor,
      registryCommandId,
      oosClaim: false,
      inputVerification: "HASH_ONLY_REQUIRES_RETAINED_INPUT_ARTIFACT",
    },
    receipt,
  );
  return receipt;
}
