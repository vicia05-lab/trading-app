/** Server-only credential service. Never import into a browser component.
 * This store is intentionally separate from the legacy order-routing keys.
 */
import { createCipheriv, createDecipheriv, randomBytes, randomUUID } from "node:crypto";

export type SecretCode =
  | "SAVED" | "REMOVED" | "VERIFIED" | "NOT_TESTED"
  | "INVALID_INPUT" | "NOT_CONFIGURED" | "VERSION_CONFLICT"
  | "SECRET_STORAGE_NOT_READY" | "STORAGE_NOT_DURABLE" | "SECRET_UNREADABLE"
  | "INVALID_CREDENTIALS" | "AUTH_OR_PERMISSION_DENIED" | "RATE_LIMITED"
  | "PROVIDER_UNAVAILABLE" | "STORAGE_UNAVAILABLE" | "FORBIDDEN";

export class SecretError extends Error {
  readonly code: SecretCode;
  constructor(code: SecretCode) { super(code); this.name = "SecretError"; this.code = code; }
}

export type SecretStatus = {
  configured: boolean;
  key_last4: string | null;
  version: string | null;
  updated_at: string | null;
  checked_at: string | null;
  test_result: SecretCode;
  storage_ready: boolean;
  storage_code: SecretCode | null;
};

export interface SecretSql {
  query<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<T[]>;
}

type Pair = { apiKeyId: string; apiSecret: string };
type Envelope = { format: "aes-256-gcm-v1"; iv: string; tag: string; ciphertext: string };
type StoredRow = {
  owner_user_id: string; version: string; key_last4: string; envelope: Envelope;
  updated_at: string; checked_at: string | null; test_result: SecretCode;
};
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const TOKEN = /^[\x21-\x7e]+$/;
export const DATA_TEST_URL = "https://data.alpaca.markets/v2/stocks/quotes/latest?symbols=SPY&feed=iex";

/** The encryption key is a separate server secret, never a database keyring row. */
export function masterKeyFromBase64(value: unknown): Buffer {
  if (typeof value !== "string" || !/^[A-Za-z0-9+/]{43}=$/.test(value)) {
    throw new SecretError("SECRET_STORAGE_NOT_READY");
  }
  const key = Buffer.from(value, "base64");
  if (key.length !== 32 || key.toString("base64") !== value) throw new SecretError("SECRET_STORAGE_NOT_READY");
  return key;
}

export function validatePair(value: unknown): Pair {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new SecretError("INVALID_INPUT");
  const v = value as Record<string, unknown>;
  if (Object.keys(v).length !== 2 || typeof v.apiKeyId !== "string" || typeof v.apiSecret !== "string") {
    throw new SecretError("INVALID_INPUT");
  }
  if (v.apiKeyId.length < 8 || v.apiKeyId.length > 80 || !TOKEN.test(v.apiKeyId)
      || v.apiSecret.length < 8 || v.apiSecret.length > 256 || !TOKEN.test(v.apiSecret)) {
    throw new SecretError("INVALID_INPUT");
  }
  return { apiKeyId: v.apiKeyId, apiSecret: v.apiSecret };
}

function aad(owner: string, version: string): Buffer {
  return Buffer.from(JSON.stringify(["Trading App|AlpacaDataSecret|1", owner, version]), "utf8");
}
function validOwner(owner: string): void {
  if (typeof owner !== "string" || !owner || owner.length > 256) throw new SecretError("FORBIDDEN");
}
function validVersion(version: string | null): void {
  if (version !== null && (typeof version !== "string" || !UUID.test(version))) throw new SecretError("INVALID_INPUT");
}

export function encryptPair(key: Buffer, owner: string, version: string, pair: Pair): Envelope {
  validatePair(pair); validOwner(owner); validVersion(version);
  if (!Buffer.isBuffer(key) || key.length !== 32) throw new SecretError("SECRET_STORAGE_NOT_READY");
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  cipher.setAAD(aad(owner, version));
  const plaintext = Buffer.from(JSON.stringify(pair), "utf8");
  try {
    const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
    return { format: "aes-256-gcm-v1", iv: iv.toString("base64"), tag: cipher.getAuthTag().toString("base64"), ciphertext: ciphertext.toString("base64") };
  } finally { plaintext.fill(0); }
}

export function decryptPair(key: Buffer, owner: string, version: string, envelope: Envelope): Pair {
  try {
    if (envelope.format !== "aes-256-gcm-v1") throw new Error();
    const iv = Buffer.from(envelope.iv, "base64"), tag = Buffer.from(envelope.tag, "base64");
    if (iv.length !== 12 || tag.length !== 16) throw new Error();
    const decipher = createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAAD(aad(owner, version)); decipher.setAuthTag(tag);
    const plaintext = Buffer.concat([decipher.update(Buffer.from(envelope.ciphertext, "base64")), decipher.final()]);
    try { return validatePair(JSON.parse(plaintext.toString("utf8"))); }
    finally { plaintext.fill(0); }
  } catch { throw new SecretError("SECRET_UNREADABLE"); }
}

/** Read-only connectivity check; never calls account/order APIs or follows redirects.
 * 200 means the data endpoint accepted the credentials, not auction coverage/readiness.
 */
export async function checkDataAccess(pair: Pair, fetcher: typeof fetch = fetch): Promise<SecretCode> {
  validatePair(pair);
  try {
    const response = await fetcher(DATA_TEST_URL, {
      method: "GET", redirect: "error", cache: "no-store", signal: AbortSignal.timeout(8000),
      headers: { "APCA-API-KEY-ID": pair.apiKeyId, "APCA-API-SECRET-KEY": pair.apiSecret, Accept: "application/json" },
    });
    // No prices, account data, or provider error bodies are exposed to the operator.
    try { await response.body?.cancel(); } catch { /* no response-body logging */ }
    if (response.status === 200) return "VERIFIED";
    if (response.status === 401) return "INVALID_CREDENTIALS";
    if (response.status === 403) return "AUTH_OR_PERMISSION_DENIED";
    if (response.status === 429) return "RATE_LIMITED";
    return "PROVIDER_UNAVAILABLE";
  } catch { return "PROVIDER_UNAVAILABLE"; }
}

/** Dependencies are injected for isolated tests. Real callers must supply durableStorage.
 * owner comes exclusively from the verified authentication context, never a request field.
 */
export function createSecretService(deps: {
  db: SecretSql; masterKey: () => Buffer; durableStorage: boolean; fetcher?: typeof fetch;
}) {
  const { db } = deps;
  function requireStorage(): Buffer {
    if (!deps.durableStorage) throw new SecretError("STORAGE_NOT_DURABLE");
    return deps.masterKey();
  }
  async function status(owner: string): Promise<SecretStatus> {
    validOwner(owner);
    let storageCode: SecretCode | null = null;
    try { const key = requireStorage(); key.fill(0); }
    catch (e) { storageCode = e instanceof SecretError ? e.code : "SECRET_STORAGE_NOT_READY"; }
    const rows = await db.query<StoredRow>(
      `SELECT version, key_last4, updated_at::text, checked_at::text, test_result
       FROM alpaca_data_secret WHERE owner_user_id = $1`, [owner],
    );
    const r = rows[0];
    return {
      configured: !!r, key_last4: r?.key_last4 ?? null, version: r?.version ?? null,
      updated_at: r?.updated_at ?? null, checked_at: r?.checked_at ?? null,
      test_result: r?.test_result ?? "NOT_TESTED", storage_ready: storageCode === null, storage_code: storageCode,
    };
  }
  async function save(owner: string, pair: Pair, expectedVersion: string | null): Promise<SecretStatus> {
    validOwner(owner); validatePair(pair); validVersion(expectedVersion);
    const version = randomUUID();
    const key = requireStorage();
    let envelope: Envelope;
    try { envelope = encryptPair(key, owner, version, pair); } finally { key.fill(0); }
    const rows = await db.query<{ version: string }>(
      `WITH changed AS (
        INSERT INTO alpaca_data_secret (owner_user_id, version, envelope, key_last4)
        SELECT $1, $2::uuid, $3::jsonb, $4 WHERE $5::uuid IS NULL
        ON CONFLICT (owner_user_id) DO NOTHING RETURNING version
      ), replaced AS (
        UPDATE alpaca_data_secret SET version=$2::uuid, envelope=$3::jsonb, key_last4=$4,
          updated_at=clock_timestamp(), checked_at=NULL, last_test_started_at=NULL, test_result='NOT_TESTED'
        WHERE owner_user_id=$1 AND version=$5::uuid RETURNING version
      ), result AS (SELECT version FROM changed UNION ALL SELECT version FROM replaced), logged AS (
        INSERT INTO alpaca_data_secret_audit (owner_user_id, version, action, result)
        SELECT $1, version, 'SAVE', 'SAVED' FROM result
      ) SELECT version::text FROM result`,
      [owner, version, JSON.stringify(envelope), pair.apiKeyId.slice(-4), expectedVersion],
    );
    if (rows.length !== 1) throw new SecretError("VERSION_CONFLICT");
    return status(owner);
  }
  async function remove(owner: string, expectedVersion: string): Promise<SecretStatus> {
    validOwner(owner); validVersion(expectedVersion);
    if (!expectedVersion) throw new SecretError("INVALID_INPUT");
    const rows = await db.query<{ version: string }>(
      `WITH removed AS (
        DELETE FROM alpaca_data_secret WHERE owner_user_id=$1 AND version=$2::uuid RETURNING version
      ), logged AS (
        INSERT INTO alpaca_data_secret_audit (owner_user_id, version, action, result)
        SELECT $1, version, 'REMOVE', 'REMOVED' FROM removed
      ) SELECT version::text FROM removed`, [owner, expectedVersion],
    );
    if (rows.length !== 1) throw new SecretError("VERSION_CONFLICT");
    return status(owner);
  }
  async function test(owner: string, expectedVersion: string): Promise<SecretStatus> {
    validOwner(owner); validVersion(expectedVersion);
    if (!expectedVersion) throw new SecretError("INVALID_INPUT");
    const key = requireStorage();
    let pair: Pair;
    try {
      const rows = await db.query<StoredRow>(
        `UPDATE alpaca_data_secret SET last_test_started_at=clock_timestamp()
         WHERE owner_user_id=$1 AND version=$2::uuid
           AND (last_test_started_at IS NULL OR last_test_started_at < clock_timestamp() - interval '10 seconds')
         RETURNING version::text, envelope`,
        [owner, expectedVersion],
      );
      if (!rows.length) {
        const current = await status(owner);
        throw new SecretError(current.version === expectedVersion ? "RATE_LIMITED" : "VERSION_CONFLICT");
      }
      pair = decryptPair(key, owner, expectedVersion, rows[0].envelope);
    } finally { key.fill(0); }
    const result = await checkDataAccess(pair, deps.fetcher);
    // Version-bound update prevents a slow test from certifying replacement credentials.
    const rows = await db.query<{ version: string }>(
      `WITH changed AS (
        UPDATE alpaca_data_secret SET checked_at=clock_timestamp(), test_result=$3
        WHERE owner_user_id=$1 AND version=$2::uuid RETURNING version
      ), logged AS (
        INSERT INTO alpaca_data_secret_audit (owner_user_id, version, action, result)
        SELECT $1, version, 'TEST', $3 FROM changed
      ) SELECT version::text FROM changed`, [owner, expectedVersion, result],
    );
    if (rows.length !== 1) throw new SecretError("VERSION_CONFLICT");
    return status(owner);
  }
  return { status, save, remove, test };
}
