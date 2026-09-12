import assert from "node:assert/strict";
import { test } from "node:test";
import { randomBytes, randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import {
  SecretError, masterKeyFromBase64, validatePair, encryptPair, decryptPair,
  checkDataAccess, createSecretService, DATA_TEST_URL,
} from "./alpaca-data-secrets.ts";

const PAIR = { apiKeyId: "TEST_ONLY_KEY_1234", apiSecret: "TEST_ONLY_SECRET_NOT_A_REAL_ALPACA_KEY" };
const OWNER = "test-owner";
const isCode = (code: string) => (e: unknown) => e instanceof SecretError && e.code === code;
const migration = new URL("../../migrations/0005_alpaca_data_secrets.sql", import.meta.url);
async function fixture(fetcher?: typeof fetch) {
  const pg = new PGlite();
  await pg.exec(await readFile(migration, "utf8"));
  const root = randomBytes(32);
  const db = { query: async <T>(text: string, params: unknown[] = []) => (await pg.query<T>(text, params)).rows };
  const deps = { db, masterKey: () => Buffer.from(root), durableStorage: true, fetcher };
  return { pg, db, root, deps, service: createSecretService(deps) };
}

test("master key must be canonical 32-byte base64; never default to a DB key", () => {
  const b = randomBytes(32);
  assert.deepEqual(masterKeyFromBase64(b.toString("base64")), b);
  for (const value of [undefined, "", "test", randomBytes(31).toString("base64"), "A".repeat(43) + "!"]) {
    assert.throws(() => masterKeyFromBase64(value), isCode("SECRET_STORAGE_NOT_READY"));
  }
});

test("credential validation rejects whitespace, header injection, overlong tokens and unknown fields", () => {
  assert.deepEqual(validatePair(PAIR), PAIR);
  for (const value of [null, [], {}, { ...PAIR, owner: "someone-else" }, { ...PAIR, apiKeyId: "short" },
    { ...PAIR, apiSecret: "x".repeat(257) }, { ...PAIR, apiSecret: "line\r\nInjected: value" },
    { ...PAIR, apiKeyId: " key_with_space " }, { ...PAIR, apiSecret: 123456789 }]) {
    assert.throws(() => validatePair(value), isCode("INVALID_INPUT"));
  }
});

test("both key ID and secret are encrypted; nonce differs on every encryption", () => {
  const key = randomBytes(32), version = randomUUID();
  const a = encryptPair(key, OWNER, version, PAIR), b = encryptPair(key, OWNER, version, PAIR);
  assert.deepEqual(decryptPair(key, OWNER, version, a), PAIR);
  assert.notEqual(a.iv, b.iv);
  assert.ok(!JSON.stringify(a).includes(PAIR.apiSecret));
  assert.ok(!JSON.stringify(a).includes(PAIR.apiKeyId));
});

test("ciphertext is bound to owner and version; tampering or wrong master key fails", () => {
  const key = randomBytes(32), version = randomUUID();
  const envelope = encryptPair(key, OWNER, version, PAIR);
  for (const fn of [
    () => decryptPair(key, "other-owner", version, envelope),
    () => decryptPair(key, OWNER, randomUUID(), envelope),
    () => decryptPair(randomBytes(32), OWNER, version, envelope),
    () => decryptPair(key, OWNER, version, { ...envelope, tag: randomBytes(16).toString("base64") }),
  ]) assert.throws(fn, isCode("SECRET_UNREADABLE"));
});

for (const [http, code] of [[200, "VERIFIED"], [401, "INVALID_CREDENTIALS"], [403, "AUTH_OR_PERMISSION_DENIED"], [429, "RATE_LIMITED"], [500, "PROVIDER_UNAVAILABLE"]] as const) {
  test(`data test maps HTTP ${http} to ${code}, never leaks provider body`, async () => {
    const fetcher: typeof fetch = async (url, init) => {
      assert.equal(url, DATA_TEST_URL);
      assert.equal(init?.method, "GET"); assert.equal(init?.redirect, "error");
      assert.equal(new Headers(init?.headers).get("APCA-API-SECRET-KEY"), PAIR.apiSecret);
      assert.ok(init?.signal);
      return new Response(JSON.stringify({ message: PAIR.apiSecret, quote: { bp: 100 } }), { status: http });
    };
    assert.equal(await checkDataAccess(PAIR, fetcher), code);
  });
}

test("transport exceptions are sanitized", async () => {
  const fetcher: typeof fetch = async () => { throw new Error(PAIR.apiSecret); };
  assert.equal(await checkDataAccess(PAIR, fetcher), "PROVIDER_UNAVAILABLE");
});

test("save persists only encrypted pair and redacted metadata; service recreation reads status", async () => {
  const f = await fixture();
  try {
    const s = await f.service.save(OWNER, PAIR, null);
    assert.equal(s.configured, true); assert.equal(s.key_last4, "1234"); assert.equal(s.test_result, "NOT_TESTED");
    assert.ok(!JSON.stringify(s).includes(PAIR.apiKeyId)); assert.ok(!JSON.stringify(s).includes(PAIR.apiSecret));
    const row = (await f.db.query<{ version: string; envelope: Parameters<typeof decryptPair>[3] }>("SELECT * FROM alpaca_data_secret"))[0];
    assert.deepEqual(decryptPair(f.root, OWNER, row.version, row.envelope), PAIR);
    assert.deepEqual(await createSecretService(f.deps).status(OWNER), s);
    const audit = await f.db.query("SELECT * FROM alpaca_data_secret_audit");
    assert.equal(audit.length, 1); assert.ok(!JSON.stringify(audit).includes(PAIR.apiSecret));
  } finally { await f.pg.close(); }
});

test("credentials and status are isolated between signed-in owners", async () => {
  const f = await fixture();
  try {
    const own = await f.service.save(OWNER, PAIR, null);
    assert.equal((await f.service.status("other")).configured, false);
    await assert.rejects(f.service.remove("other", own.version!), isCode("VERSION_CONFLICT"));
    assert.equal((await f.service.status(OWNER)).configured, true);
  } finally { await f.pg.close(); }
});

test("first-save conflict and stale replacement cannot overwrite keys", async () => {
  const f = await fixture();
  try {
    const first = await f.service.save(OWNER, PAIR, null);
    await assert.rejects(f.service.save(OWNER, { ...PAIR, apiSecret: "OTHER_FAKE_SECRET" }, null), isCode("VERSION_CONFLICT"));
    const second = await f.service.save(OWNER, { ...PAIR, apiSecret: "NEW_FAKE_SECRET" }, first.version);
    assert.notEqual(first.version, second.version);
    await assert.rejects(f.service.save(OWNER, PAIR, first.version), isCode("VERSION_CONFLICT"));
    assert.equal((await f.service.status(OWNER)).version, second.version);
  } finally { await f.pg.close(); }
});

test("removal is version-bound; audit retains no secret bytes", async () => {
  const f = await fixture();
  try {
    const saved = await f.service.save(OWNER, PAIR, null);
    assert.equal((await f.service.remove(OWNER, saved.version!)).configured, false);
    assert.equal((await f.db.query("SELECT * FROM alpaca_data_secret")).length, 0);
    const audit = await f.db.query("SELECT * FROM alpaca_data_secret_audit");
    assert.equal(audit.length, 2); assert.ok(!JSON.stringify(audit).includes(PAIR.apiSecret));
  } finally { await f.pg.close(); }
});

test("save fails closed without separate master key or durable storage", async () => {
  const f = await fixture();
  try {
    const noKey = createSecretService({ ...f.deps, masterKey: () => masterKeyFromBase64(undefined) });
    assert.equal((await noKey.status(OWNER)).storage_ready, false);
    await assert.rejects(noKey.save(OWNER, PAIR, null), isCode("SECRET_STORAGE_NOT_READY"));
    const temporary = createSecretService({ ...f.deps, durableStorage: false });
    await assert.rejects(temporary.save(OWNER, PAIR, null), isCode("STORAGE_NOT_DURABLE"));
    assert.equal((await f.db.query("SELECT * FROM alpaca_data_secret")).length, 0);
  } finally { await f.pg.close(); }
});

test("data check stores only sanitized outcome, rate limits repeats, never changes ciphertext", async () => {
  const fetcher: typeof fetch = async () => new Response(PAIR.apiSecret, { status: 401 });
  const f = await fixture(fetcher);
  try {
    const saved = await f.service.save(OWNER, PAIR, null);
    const before = await f.db.query("SELECT envelope FROM alpaca_data_secret");
    const tested = await f.service.test(OWNER, saved.version!);
    assert.equal(tested.test_result, "INVALID_CREDENTIALS");
    assert.ok(tested.checked_at);
    assert.deepEqual(await f.db.query("SELECT envelope FROM alpaca_data_secret"), before);
    await assert.rejects(f.service.test(OWNER, saved.version!), isCode("RATE_LIMITED"));
  } finally { await f.pg.close(); }
});

test("slow old-version test cannot certify newly replaced credentials", async () => {
  let release!: (r: Response) => void;
  let started!: () => void;
  const start = new Promise<void>((resolve) => { started = resolve; });
  const fetcher: typeof fetch = async () => { started(); return new Promise<Response>((resolve) => { release = resolve; }); };
  const f = await fixture(fetcher);
  try {
    const first = await f.service.save(OWNER, PAIR, null);
    const pending = f.service.test(OWNER, first.version!);
    await start;
    const second = await f.service.save(OWNER, { ...PAIR, apiSecret: "REPLACEMENT_TEST_SECRET" }, first.version);
    release(new Response("{}", { status: 200 }));
    await assert.rejects(pending, isCode("VERSION_CONFLICT"));
    assert.equal((await f.service.status(OWNER)).version, second.version);
    assert.equal((await f.service.status(OWNER)).test_result, "NOT_TESTED");
  } finally { await f.pg.close(); }
});

test("audit failure rolls the save back atomically", async () => {
  const f = await fixture();
  try {
    await f.pg.exec("ALTER TABLE alpaca_data_secret_audit ADD CONSTRAINT test_audit_failure CHECK (action <> 'SAVE')");
    await assert.rejects(f.service.save(OWNER, PAIR, null));
    assert.equal((await f.db.query("SELECT * FROM alpaca_data_secret")).length, 0);
  } finally { await f.pg.close(); }
});
