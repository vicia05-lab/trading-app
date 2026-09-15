import { getOrCreatePrincipal } from "./queries";
import { withWriter, appendEvent, loadExistingCommand } from "./writer";
import type { WriterCtx } from "./writer";
import { volumeFixture, volumeFixtureEntry } from "./volume-fixtures.ts";
import { buildVolumeCapture } from "./volume-capture.ts";
import type { VolumeCapture } from "./volume-capture.ts";
import { simulateVolumeExit } from "../kernel/volume-replay.ts";
import {
  ExistingVolumeReceipt,
  registerVolumeLedger,
  appendVolumeCapture,
} from "./volume-ledger.ts";
import type { VolumeLedgerContext, VolumeLedgerReceipt } from "./volume-ledger.ts";
export type VolumeScenario =
  | "qualifying"
  | "capacity_full"
  | "missing_data"
  | "low_liquidity"
  | "same_bar_entry"
  | "missing_exit";
function context(ctx: WriterCtx): VolumeLedgerContext {
  return {
    actor: ctx.actor,
    seq: ctx.seq,
    now: ctx.now,
    find: (id) => loadExistingCommand<VolumeLedgerReceipt>(ctx.sql, id),
    append: async (commandId, type, payload, receipt) => {
      await appendEvent(ctx, { commandId, type, payload, receipt });
    },
  };
}
async function operator(userId: string) {
  const p = await getOrCreatePrincipal(userId, null);
  if (p.role !== "OPERATOR") throw new Error("FORBIDDEN");
  return p.principal_id;
}
/** Internal pipeline entrypoints, not client-callable RPCs. No automatic activation or scheduler. */
export async function registerVolumeResearchPolicy(userId: string, commandId: string) {
  const actor = await operator(userId);
  try {
    return await withWriter(actor, (ctx) => registerVolumeLedger(context(ctx), commandId));
  } catch (e) {
    if (e instanceof ExistingVolumeReceipt) return e.receipt;
    throw e;
  }
}
export async function recordVolumeResearchCapture(
  userId: string,
  commandId: string,
  registryCommandId: string,
  capture: VolumeCapture,
) {
  const actor = await operator(userId);
  try {
    return await withWriter(actor, (ctx) =>
      appendVolumeCapture(context(ctx), commandId, registryCommandId, capture),
    );
  } catch (e) {
    if (e instanceof ExistingVolumeReceipt) return e.receipt;
    throw e;
  }
}
/** Authenticated fictional examples are read-only; neither role can submit market data here. */
export async function runVolumeExample(userId: string, scenario: VolumeScenario) {
  const principal = await getOrCreatePrincipal(userId, null);
  if (principal.role !== "OPERATOR" && principal.role !== "REVIEWER") throw new Error("FORBIDDEN");
  const frame = volumeFixture(),
    entry = volumeFixtureEntry(frame);
  if (scenario === "missing_data") frame.sourceState = "NOT_CHECKED";
  if (scenario === "low_liquidity") frame.entryMinuteDollarVolume.value = "60000.0000";
  if (scenario === "capacity_full")
    entry.risk.commitments = ["PENDING", "OPEN", "IMPAIRED"].map((state, i) => ({
      securityId: "OTHER" + i,
      state: state as "PENDING" | "OPEN" | "IMPAIRED",
      notional: "1000.0000",
      risk: "10.0000",
    }));
  const capture = buildVolumeCapture([frame], entry.risk, {
    [frame.securityId]: scenario === "same_bar_entry" ? frame.quote : entry.quote,
  });
  const position = capture.portfolioLedger[0];
  const exit =
    scenario === "missing_exit" && position?.status === "SIMULATED_ADMISSION"
      ? simulateVolumeExit(
          position,
          {
            coverage: "VERIFIED",
            fromAt: position.entryAt!,
            throughAt: position.exitDueAt!,
            quotes: [],
          },
          position.exitDueAt!,
        )
      : null;
  return { evidenceScope: "SYNTHETIC_EXAMPLE" as const, capture, exit };
}
