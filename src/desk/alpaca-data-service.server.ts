import { dbSource, getSql } from "@/lib/db";
import { getOrCreatePrincipal } from "./queries";
import { createSecretService, masterKeyFromBase64, SecretError } from "./alpaca-data-secrets";
import type { SecretCode, SecretStatus } from "./alpaca-data-secrets";

export type SecretReply =
  | { ok: true; can_manage: boolean; status: SecretStatus }
  | { ok: false; code: SecretCode };

export async function execute(
  userId: string,
  mutation: boolean,
  action: (service: ReturnType<typeof createSecretService>) => Promise<SecretStatus>,
): Promise<SecretReply> {
  try {
    // Do not auto-promote a newly signed-in account to OPERATOR here.
    const principal = await getOrCreatePrincipal(userId, null);
    const canManage = principal.role === "OPERATOR";
    if (mutation && !canManage) throw new SecretError("FORBIDDEN");
    const service = createSecretService({
      db: await getSql(),
      durableStorage: dbSource === "neon",
      masterKey: () => masterKeyFromBase64(process.env.ALPACA_CREDENTIALS_MASTER_KEY),
    });
    return { ok: true, can_manage: canManage, status: await action(service) };
  } catch (error) {
    // Never forward exception messages, submitted bodies, provider responses or keys.
    return { ok: false, code: error instanceof SecretError ? error.code : "STORAGE_UNAVAILABLE" };
  }
}
