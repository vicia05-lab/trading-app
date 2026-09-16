// Research registry skeleton. Existing vintages are never overwritten.
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { VOLUME_POLICY } from "../src/desk/volume-policy.ts";
import { volumePolicyHash } from "../src/kernel/volume-research.ts";
const dir = fileURLToPath(new URL("../research/registry/volume-v21/", import.meta.url));
await mkdir(dir, { recursive: true });
await writeFile(
  dir + "grid.yaml",
  JSON.stringify(
    {
      schema: "2.1",
      classification: "EXPLORATORY_NOT_PREREGISTERED_OOS",
      trial_history_complete: false,
      registered_policy_hash: volumePolicyHash(),
      variants: [{ trial_id: VOLUME_POLICY.trialId, policy: VOLUME_POLICY }],
      no_automatic_optimization: true,
    },
    null,
    2,
  ) + "\n",
  { flag: "wx" },
);
await writeFile(
  dir + "abandoned.md",
  "# Prior design history is incomplete\n\nThe prior weighted score, 8R validation cap, fixed 10% net-profit concentration gate, trade-level-DSR-as-power shortcut, common-beta residual-ranking-as-new-edge claim, and paper-fill-as-real-slippage assumption are rejected in this implementation. Engulfing is omitted as an unvalidated extra condition, not proven redundant. These notes do not reconstruct a complete prior trial set or establish N_eff=1. Previous inspected history cannot become OOS through renaming a registry. Any subsequent candidate-rate or P&L-driven change needs a new version and a retained reason.\n",
  { flag: "wx" },
);
console.log("Created immutable-first-write exploratory registry skeleton.");
