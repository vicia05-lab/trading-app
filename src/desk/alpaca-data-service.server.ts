import { getSql } from "@/lib/db";
import { createSecretService, SecretError } from "./alpaca-data-secrets";
import type { SecretCode, SecretStatus } from "./alpaca-data-secrets";
import { loadOrCreateMasterKey } from "./alpaca-master-key.server";

export type SecretReply =
  | { ok: true; can_manage: boolean; status: SecretStatus }
  | { ok: false; code: SecretCode };

export async function execute(
  userId: string,
  mutation: boolean,
  action: (service: ReturnType<typeof createSecretService>) => Promise<SecretStatus>,
): Promise<SecretReply> {
  try {
    if (!userId) throw new SecretError("FORBIDDEN");
    // Per-user store: the signed-in owner may manage their own keys.
    // Desk Operator/Reviewer is a separate earnings barrier.
    const canManage = true;
    if (mutation && !canManage) throw new SecretError("FORBIDDEN");
    const service = createSecretService({
      db: await getSql(),
      durableStorage: true,
      masterKey: () => loadOrCreateMasterKey(),
    });
    return { ok: true, can_manage: canManage, status: await action(service) };
  } catch (error) {
    return { ok: false, code: error instanceof SecretError ? error.code : "STORAGE_UNAVAILABLE" };
  }
}
