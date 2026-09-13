import { getSql, dbSource } from "@/lib/db";
import { createSecretService, SecretError } from "./alpaca-data-secrets";
import type { SecretCode, SecretStatus, SecretSql } from "./alpaca-data-secrets";
import { decryptPair } from "./alpaca-data-secrets";
import { loadMasterKey } from "./alpaca-master-key.server";

export type SecretReply =
  | { ok: true; can_manage: boolean; status: SecretStatus }
  | { ok: false; code: SecretCode };

async function ensureSchema(db: SecretSql): Promise<void> {
  await db.query(`
    CREATE TABLE IF NOT EXISTS alpaca_data_secret (
      owner_user_id text PRIMARY KEY CHECK (length(owner_user_id) BETWEEN 1 AND 256),
      version uuid NOT NULL,
      envelope jsonb NOT NULL CHECK (jsonb_typeof(envelope) = 'object'),
      key_last4 text NOT NULL CHECK (length(key_last4) = 4),
      updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
      checked_at timestamptz,
      last_test_started_at timestamptz,
      test_result text NOT NULL DEFAULT 'NOT_TESTED' CHECK (test_result IN (
        'NOT_TESTED','VERIFIED','INVALID_CREDENTIALS','AUTH_OR_PERMISSION_DENIED',
        'RATE_LIMITED','PROVIDER_UNAVAILABLE'
      ))
    )`);
  await db.query(`
    CREATE TABLE IF NOT EXISTS alpaca_data_secret_audit (
      audit_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      owner_user_id text NOT NULL,
      version uuid NOT NULL,
      action text NOT NULL CHECK (action IN ('SAVE','REMOVE','TEST')),
      result text NOT NULL CHECK (result IN (
        'SAVED','REMOVED','VERIFIED','INVALID_CREDENTIALS','AUTH_OR_PERMISSION_DENIED',
        'RATE_LIMITED','PROVIDER_UNAVAILABLE'
      )),
      occurred_at timestamptz NOT NULL DEFAULT clock_timestamp()
    )`);
}

export async function execute(
  userId: string,
  mutation: boolean,
  action: (service: ReturnType<typeof createSecretService>) => Promise<SecretStatus>,
): Promise<SecretReply> {
  try {
    if (!userId) throw new SecretError("FORBIDDEN");
    const db = await getSql();
    await ensureSchema(db);
    const principals = await db.query<{ role: string }>(`SELECT role FROM desk_principal WHERE user_id = $1`, [userId]);
    const canManage = principals[0]?.role === "OPERATOR";
    if (mutation && !canManage) throw new SecretError("FORBIDDEN");
    const durableStorage = dbSource === "neon";
    const service = createSecretService({
      db,
      durableStorage,
      masterKey: () => loadMasterKey(),
    });
    return { ok: true, can_manage: canManage && durableStorage, status: await action(service) };
  } catch (error) {
    return { ok: false, code: error instanceof SecretError ? error.code : "STORAGE_UNAVAILABLE" };
  }
}

/** Decrypt the owner’s saved market-data pair for server-side data calls. Never send to the browser. */
export async function loadDataPair(userId: string): Promise<{ apiKeyId: string; apiSecret: string } | null> {
  if (!userId) return null;
  const db = await getSql();
  await ensureSchema(db);
  const rows = await db.query<{ version: string; envelope: { format: string; iv: string; tag: string; ciphertext: string } }>(
    `SELECT version::text, envelope FROM alpaca_data_secret WHERE owner_user_id = $1`,
    [userId],
  );
  if (!rows.length) return null;
  const key = loadMasterKey();
  try {
    return decryptPair(key, userId, rows[0].version, rows[0].envelope as Parameters<typeof decryptPair>[3]);
  } finally {
    key.fill(0);
  }
}
