import { AsyncLocalStorage } from "node:async_hooks";
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { getSql } from "@/lib/db";
import { DeskError, newId } from "./util";
import type { AlpacaMode, AlpacaPublicStatus } from "./alpaca-types";

export type { AlpacaMode, AlpacaPublicStatus } from "./alpaca-types";

const WRAP_ID = "kr-alpaca-wrap";
const DEFAULT_WATCH = ["SPY", "QQQ", "NVDA", "AAPL", "MSFT", "AMZN", "META", "GOOGL", "TSLA", "AMD"];

type StoredCred = {
  api_key_id: string;
  secret: string;
  mode: AlpacaMode;
  watchlist: string[];
};

function tradingHost(mode: AlpacaMode): string {
  if (mode === "LIVE") {
    throw new DeskError("LIVE_DISABLED", "This workspace is paper-only. Live Alpaca orders are not available.", 422);
  }
  return "https://paper-api.alpaca.markets";
}

function asBuf(v: unknown): Buffer {
  if (Buffer.isBuffer(v)) return v;
  if (v instanceof Uint8Array) return Buffer.from(v);
  if (typeof v === "string") {
    const s = v.startsWith("\\x") ? v.slice(2) : v;
    if (/^[0-9a-fA-F]+$/.test(s) && s.length % 2 === 0) return Buffer.from(s, "hex");
  }
  throw new DeskError("KEYRING", "unreadable key material", 500);
}

function maskKey(id: string): string {
  if (id.length <= 8) return `${id.slice(0, 2)}…${id.slice(-2)}`;
  return `${id.slice(0, 4)}…${id.slice(-4)}`;
}

function safeActor(raw: string): string {
  const cleaned = raw.replace(/[^A-Za-z0-9:._-]/g, "").slice(0, 56);
  const id = (cleaned.startsWith("usr-") ? cleaned : `usr-${cleaned || "operator"}`).slice(0, 64);
  return id;
}

function watchlistLiteral(list: string[]): string {
  return `{${list.join(",")}}`;
}

let schemaReady = false;
async function ensureAlpacaSchema(): Promise<void> {
  if (schemaReady) return;
  const sql = await getSql();
  await sql.query(`
    CREATE TABLE IF NOT EXISTS alpaca_credential (
      singleton_key boolean PRIMARY KEY CHECK (singleton_key),
      api_key_id text NOT NULL CHECK (char_length(api_key_id) BETWEEN 8 AND 80),
      secret_ciphertext bytea NOT NULL,
      secret_nonce bytea NOT NULL,
      secret_tag bytea NOT NULL,
      mode text NOT NULL CHECK (mode IN ('PAPER', 'LIVE')),
      watchlist text[] NOT NULL,
      connected_at timestamptz NOT NULL,
      connected_by text NOT NULL,
      last_ok_at timestamptz,
      last_error text,
      account_number_last4 text,
      account_status text
    )`);
  await sql.query(`
    CREATE TABLE IF NOT EXISTS alpaca_order_log (
      local_id text PRIMARY KEY,
      alpaca_order_id text,
      client_order_id text NOT NULL UNIQUE,
      symbol text NOT NULL,
      side text NOT NULL,
      order_type text NOT NULL,
      time_in_force text NOT NULL,
      qty text,
      notional text,
      limit_price text,
      status text NOT NULL,
      mode text NOT NULL,
      submitted_at timestamptz NOT NULL,
      submitted_by text NOT NULL,
      raw_receipt jsonb NOT NULL
    )`);
  schemaReady = true;
}

async function wrapKey(): Promise<Buffer> {
  const sql = await getSql();
  const existing = await sql.query<{ key_bytes: unknown }>(
    `SELECT key_bytes FROM app_keyring WHERE key_id = $1`,
    [WRAP_ID],
  );
  if (existing.length) return asBuf(existing[0].key_bytes);
  const bytes = randomBytes(32);
  await sql.query(
    `INSERT INTO app_keyring (key_id, purpose, key_bytes, created_at)
     VALUES ($1, 'alpaca_wrap', $2, NOW())
     ON CONFLICT (key_id) DO NOTHING`,
    [WRAP_ID, bytes],
  );
  const again = await sql.query<{ key_bytes: unknown }>(
    `SELECT key_bytes FROM app_keyring WHERE key_id = $1`,
    [WRAP_ID],
  );
  if (!again.length) throw new DeskError("KEYRING", "failed to persist wrap key", 500);
  return asBuf(again[0].key_bytes);
}

function encryptSecret(key: Buffer, plain: string): { ciphertext: Buffer; nonce: Buffer; tag: Buffer } {
  const nonce = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, nonce);
  const ciphertext = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return { ciphertext, nonce, tag: cipher.getAuthTag() };
}

function decryptSecret(key: Buffer, ciphertext: Buffer, nonce: Buffer, tag: Buffer): string {
  const decipher = createDecipheriv("aes-256-gcm", key, nonce);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
}

export function normalizeSymbol(raw: string): string {
  const s = raw.trim().toUpperCase();
  if (!/^[A-Z][A-Z.]{0,9}$/.test(s)) throw new DeskError("INVALID_SYMBOL", "Ticker must be letters (optional dot), max 10", 422);
  return s;
}

export function normalizeWatchlist(list: string[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const item of list) {
    const s = normalizeSymbol(item);
    if (seen.has(s)) continue;
    seen.add(s);
    out.push(s);
    if (out.length >= 24) break;
  }
  if (!out.length) throw new DeskError("INVALID_WATCHLIST", "Watchlist needs at least one ticker", 422);
  return out;
}

export async function publicStatus(): Promise<AlpacaPublicStatus> {
  try {
    await ensureAlpacaSchema();
  } catch {
    return {
      connected: false,
      mode: null,
      api_key_masked: null,
      account_number_last4: null,
      account_status: null,
      last_ok_at: null,
      last_error: null,
      watchlist: DEFAULT_WATCH,
      trading_host: null,
    };
  }
  const sql = await getSql();
  try {
    const rows = await sql.query<{
      api_key_id: string;
      mode: AlpacaMode;
      watchlist: string[] | string;
      last_ok_at: string | null;
      last_error: string | null;
      account_number_last4: string | null;
      account_status: string | null;
    }>(
      `SELECT api_key_id, mode, watchlist, last_ok_at::text, last_error, account_number_last4, account_status
       FROM alpaca_credential WHERE singleton_key = TRUE`,
    );
    if (!rows.length) {
      return {
        connected: false,
        mode: null,
        api_key_masked: null,
        account_number_last4: null,
        account_status: null,
        last_ok_at: null,
        last_error: null,
        watchlist: DEFAULT_WATCH,
        trading_host: null,
      };
    }
    const r = rows[0];
    const watch = Array.isArray(r.watchlist)
      ? r.watchlist
      : String(r.watchlist ?? "")
          .replace(/[{}]/g, "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
    return {
      connected: true,
      mode: r.mode,
      api_key_masked: maskKey(r.api_key_id),
      account_number_last4: r.account_number_last4,
      account_status: r.account_status,
      last_ok_at: r.last_ok_at,
      last_error: r.last_error,
      watchlist: watch.length ? watch : DEFAULT_WATCH,
      trading_host: tradingHost(r.mode),
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg.includes("alpaca_credential") || msg.includes("does not exist")) {
      schemaReady = false;
      return {
        connected: false,
        mode: null,
        api_key_masked: null,
        account_number_last4: null,
        account_status: null,
        last_ok_at: null,
        last_error: null,
        watchlist: DEFAULT_WATCH,
        trading_host: null,
      };
    }
    throw e;
  }
}

async function loadStored(): Promise<StoredCred> {
  await ensureAlpacaSchema();
  const sql = await getSql();
  const rows = await sql.query<{
    api_key_id: string;
    secret_ciphertext: unknown;
    secret_nonce: unknown;
    secret_tag: unknown;
    mode: AlpacaMode;
    watchlist: string[] | string;
  }>(
    `SELECT api_key_id, secret_ciphertext, secret_nonce, secret_tag, mode, watchlist
     FROM alpaca_credential WHERE singleton_key = TRUE`,
  );
  if (!rows.length) throw new DeskError("ALPACA_NOT_CONNECTED", "Paste Alpaca keys on Trade or Admin first", 409);
  const r = rows[0];
  const key = await wrapKey();
  const secret = decryptSecret(key, asBuf(r.secret_ciphertext), asBuf(r.secret_nonce), asBuf(r.secret_tag));
  const watch = Array.isArray(r.watchlist)
    ? r.watchlist
    : String(r.watchlist ?? "")
        .replace(/[{}]/g, "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
  return { api_key_id: r.api_key_id, secret, mode: r.mode, watchlist: watch.length ? watch : DEFAULT_WATCH };
}

type Creds = StoredCred;
const credStore = new AsyncLocalStorage<Creds>();

async function resolveCreds(userId?: string): Promise<Creds> {
  try {
    const stored = await loadStored();
    if (stored.mode === "LIVE") {
      throw new DeskError("LIVE_DISABLED", "This workspace is paper-only. Live Alpaca orders are not available.", 422);
    }
    return stored;
  } catch (first) {
    if (userId) {
      try {
        const { loadDataPair } = await import("./alpaca-data-service.server");
        const pair = await loadDataPair(userId);
        if (pair) {
          return { api_key_id: pair.apiKeyId, secret: pair.apiSecret, mode: "PAPER", watchlist: DEFAULT_WATCH };
        }
      } catch {
        /* fall through to original error */
      }
    }
    throw first;
  }
}

async function withCreds<T>(creds: Creds, fn: () => Promise<T>): Promise<T> {
  if (creds.mode === "LIVE") {
    throw new DeskError("LIVE_DISABLED", "This workspace is paper-only. Live Alpaca orders are not available.", 422);
  }
  return credStore.run(creds, fn);
}

type AlpacaJson = Record<string, unknown> | unknown[];

async function alpacaFetch(path: string, init: RequestInit & { host?: "trade" | "data" } = {}): Promise<AlpacaJson> {
  const creds = credStore.getStore() ?? (await loadStored());
  if (creds.mode === "LIVE") {
    throw new DeskError("LIVE_DISABLED", "This workspace is paper-only. Live Alpaca orders are not available.", 422);
  }
  const host = init.host === "data" ? "https://data.alpaca.markets" : tradingHost(creds.mode);
  const headers = new Headers(init.headers);
  headers.set("APCA-API-KEY-ID", creds.api_key_id);
  headers.set("APCA-API-SECRET-KEY", creds.secret);
  headers.set("Accept", "application/json");
  if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  let res: Response;
  try {
    res = await fetch(`${host}${path}`, { ...init, headers });
  } catch (e) {
    throw new DeskError(
      "ALPACA_UNREACHABLE",
      e instanceof Error ? `Alpaca unreachable: ${e.message}` : "Alpaca unreachable",
      503,
      true,
    );
  }
  const text = await res.text();
  let body: AlpacaJson | null = null;
  const looksHtml = /^\s*</.test(text);
  if (text && !looksHtml) {
    try {
      body = JSON.parse(text) as AlpacaJson;
    } catch {
      body = { message: text.slice(0, 180) };
    }
  }
  if (!res.ok) {
    const jsonMsg =
      body && !Array.isArray(body) && typeof body.message === "string" ? body.message : null;
    const msg =
      jsonMsg && !jsonMsg.includes("<")
        ? jsonMsg
        : res.status === 401 || res.status === 403
          ? "Alpaca rejected these keys. Use paper keys for Paper, live keys for Live, and paste the full secret."
          : `Alpaca HTTP ${res.status}`;
    const code = res.status === 401 || res.status === 403 ? "ALPACA_AUTH" : "ALPACA_HTTP";
    throw new DeskError(code, msg, res.status === 401 ? 401 : 422);
  }
  return body ?? {};
}

async function markOk(accountNumber?: string, status?: string): Promise<void> {
  const sql = await getSql();
  const last4 = accountNumber ? accountNumber.slice(-4) : null;
  await sql.query(
    `UPDATE alpaca_credential
     SET last_ok_at = NOW(), last_error = NULL, account_number_last4 = COALESCE($1, account_number_last4),
         account_status = COALESCE($2, account_status)
     WHERE singleton_key = TRUE`,
    [last4, status ?? null],
  );
}

async function markErr(message: string): Promise<void> {
  const sql = await getSql();
  await sql.query(`UPDATE alpaca_credential SET last_error = $1 WHERE singleton_key = TRUE`, [message.slice(0, 400)]);
}

export async function saveCredentials(args: {
  apiKeyId: string;
  apiSecret: string;
  mode: AlpacaMode;
  confirmLive?: boolean;
  actor: string;
}): Promise<AlpacaPublicStatus> {
  await ensureAlpacaSchema();
  const apiKeyId = args.apiKeyId.trim();
  const apiSecret = args.apiSecret.trim();
  if (apiKeyId.length < 8 || apiSecret.length < 8) {
    throw new DeskError("INVALID_KEYS", "Key id and secret must be at least 8 characters", 422);
  }
  if (args.mode === "LIVE") {
    throw new DeskError("LIVE_DISABLED", "This workspace is paper-only. Live Alpaca trading is not available.", 422);
  }
  const key = await wrapKey();
  const enc = encryptSecret(key, apiSecret);
  const sql = await getSql();
  const actor = safeActor(args.actor);
  await sql.query(
    `INSERT INTO alpaca_credential (
       singleton_key, api_key_id, secret_ciphertext, secret_nonce, secret_tag, mode, watchlist,
       connected_at, connected_by, last_ok_at, last_error, account_number_last4, account_status
     ) VALUES (TRUE,$1,$2,$3,$4,$5,$6::text[],NOW(),$7,NULL,NULL,NULL,NULL)
     ON CONFLICT (singleton_key) DO UPDATE SET
       api_key_id = EXCLUDED.api_key_id,
       secret_ciphertext = EXCLUDED.secret_ciphertext,
       secret_nonce = EXCLUDED.secret_nonce,
       secret_tag = EXCLUDED.secret_tag,
       mode = EXCLUDED.mode,
       connected_at = NOW(),
       connected_by = EXCLUDED.connected_by,
       last_ok_at = NULL,
       last_error = NULL,
       account_number_last4 = NULL,
       account_status = NULL`,
    [apiKeyId, enc.ciphertext, enc.nonce, enc.tag, args.mode, watchlistLiteral(DEFAULT_WATCH), actor],
  );
  try {
    await probeAccount();
  } catch (e) {
    const msg = e instanceof DeskError ? e.message : "Connection test failed";
    await markErr(msg);
    // Keys are stored. Surface the test failure so the operator can correct paper/live mixups.
    throw new DeskError(
      e instanceof DeskError ? e.code : "ALPACA_TEST",
      `Keys were saved, but Alpaca rejected the test: ${msg}`,
      e instanceof DeskError ? e.http : 422,
    );
  }
  return publicStatus();
}

export async function disconnect(): Promise<AlpacaPublicStatus> {
  await ensureAlpacaSchema();
  const sql = await getSql();
  await sql.query(`DELETE FROM alpaca_credential WHERE singleton_key = TRUE`);
  return publicStatus();
}

export async function saveWatchlist(list: string[]): Promise<AlpacaPublicStatus> {
  const watch = normalizeWatchlist(list);
  const sql = await getSql();
  const n = await sql.query(
    `UPDATE alpaca_credential SET watchlist = $1::text[] WHERE singleton_key = TRUE RETURNING api_key_id`,
    [watchlistLiteral(watch)],
  );
  if (!n.length) throw new DeskError("ALPACA_NOT_CONNECTED", "Paste Alpaca keys on Admin first", 409);
  return publicStatus();
}

function asRecord(v: AlpacaJson): Record<string, string | boolean | null> {
  if (!v || Array.isArray(v) || typeof v !== "object") return {};
  const out: Record<string, string | boolean | null> = {};
  for (const [k, val] of Object.entries(v)) {
    if (typeof val === "string" || typeof val === "boolean") out[k] = val;
    else if (val == null) out[k] = null;
    else if (typeof val === "number") out[k] = String(val);
  }
  return out;
}

function asList(v: AlpacaJson): Array<Record<string, string | boolean | null>> {
  if (!Array.isArray(v)) return [];
  return v.map((item) => asRecord(item as AlpacaJson));
}

async function probeAccount(): Promise<void> {
  const rec = asRecord(await alpacaFetch("/v2/account"));
  await markOk(
    typeof rec.account_number === "string" ? rec.account_number : undefined,
    typeof rec.status === "string" ? rec.status : undefined,
  );
}

export async function getAccount(): Promise<Record<string, string | boolean | null>> {
  const rec = asRecord(await alpacaFetch("/v2/account"));
  await markOk(
    typeof rec.account_number === "string" ? rec.account_number : undefined,
    typeof rec.status === "string" ? rec.status : undefined,
  );
  return rec;
}

export async function getClock(): Promise<Record<string, string | boolean | null>> {
  return asRecord(await alpacaFetch("/v2/clock"));
}

export async function getPositions(): Promise<Array<Record<string, string | boolean | null>>> {
  return asList(await alpacaFetch("/v2/positions"));
}

export async function getOrders(
  status: "open" | "closed" | "all" = "open",
): Promise<Array<Record<string, string | boolean | null>>> {
  return asList(await alpacaFetch(`/v2/orders?status=${encodeURIComponent(status)}&limit=50&direction=desc`));
}

function strField(obj: unknown, key: string): string | null {
  if (!obj || typeof obj !== "object") return null;
  const v = (obj as Record<string, unknown>)[key];
  if (typeof v === "string" && v) return v;
  return null;
}

function numField(obj: unknown, key: string): string | null {
  if (!obj || typeof obj !== "object") return null;
  const v = (obj as Record<string, unknown>)[key];
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  if (typeof v === "string" && v) return v;
  return null;
}

export async function getSnapshots(
  symbols: string[],
): Promise<Array<{ symbol: string; last: string | null; bid: string | null; ask: string | null; vwap: string | null; change_pct: string | null }>> {
  const list = normalizeWatchlist(symbols);
  const body = await alpacaFetch(
    `/v2/stocks/snapshots?symbols=${encodeURIComponent(list.join(","))}&feed=iex`,
    { host: "data" },
  );
  const bag = body && !Array.isArray(body) ? body : {};
  return list.map((symbol) => {
    const snap = (bag as Record<string, unknown>)[symbol];
    const rec = snap && typeof snap === "object" ? (snap as Record<string, unknown>) : {};
    const last = numField(rec.latestTrade, "p") ?? numField(rec.dailyBar, "c");
    const bid = numField(rec.latestQuote, "bp");
    const ask = numField(rec.latestQuote, "ap");
    const prev = numField(rec.prevDailyBar, "c");
    let change_pct: string | null = null;
    if (last && prev && Number(prev) !== 0) {
      change_pct = (((Number(last) - Number(prev)) / Number(prev)) * 100).toFixed(2);
    }
    return { symbol, last, bid, ask, vwap: numField(rec.dailyBar, "vw"), change_pct };
  });
}

export async function getDailyBars(
  symbols: string[],
  limit = 70,
): Promise<Record<string, Array<{ t: string; o: number; h: number; l: number; c: number }>>> {
  return getStockBars(symbols, "1Day", limit, isoDaysAgo(Math.max(limit + 20, 90)));
}

function parseBars(body: AlpacaJson): Record<string, TapeBar[]> {
  const root = body && typeof body === "object" && !Array.isArray(body) ? (body as Record<string, unknown>) : {};
  const bag = (root.bars ?? root) as unknown;
  const out: Record<string, TapeBar[]> = {};
  if (Array.isArray(bag)) {
    out._ = bag.map(rowToBar).filter((x): x is TapeBar => x !== null);
    return out;
  }
  if (!bag || typeof bag !== "object") return out;
  for (const [sym, rows] of Object.entries(bag as Record<string, unknown>)) {
    if (!Array.isArray(rows)) continue;
    out[sym.toUpperCase()] = rows.map(rowToBar).filter((x): x is TapeBar => x !== null);
  }
  return out;
}

function rowToBar(row: unknown): TapeBar | null {
  if (!row || typeof row !== "object") return null;
  const r = row as Record<string, unknown>;
  const c = Number(r.c);
  const h = Number(r.h);
  const l = Number(r.l);
  const o = Number(r.o);
  const v = Number(r.v ?? 0);
  if (![c, h, l, o].every((n) => Number.isFinite(n) && n > 0)) return null;
  return { t: String(r.t ?? ""), o, h, l, c, v: Number.isFinite(v) ? v : 0 };
}

function pageToken(body: AlpacaJson): string | null {
  if (!body || Array.isArray(body) || typeof body !== "object") return null;
  const t = (body as Record<string, unknown>).next_page_token;
  return typeof t === "string" && t ? t : null;
}

export async function getStockBars(
  symbols: string[],
  timeframe: "5Min" | "15Min" | "1Hour" | "1Day",
  limit = 200,
  start?: string,
): Promise<Record<string, TapeBar[]>> {
  const list = normalizeWatchlist(symbols);
  if (!list.length) return {};
  const merged: Record<string, TapeBar[]> = {};
  let token: string | undefined;
  const cap = Math.min(Math.max(limit, 5), 10000);
  for (let page = 0; page < 8; page++) {
    const params = new URLSearchParams({
      symbols: list.join(","),
      timeframe,
      limit: String(cap),
      feed: "iex",
      adjustment: "raw",
      sort: "asc",
    });
    if (start) params.set("start", start);
    if (token) params.set("page_token", token);
    let body: AlpacaJson;
    try {
      body = await alpacaFetch(`/v2/stocks/bars?${params.toString()}`, { host: "data" });
    } catch {
      params.delete("adjustment");
      try {
        body = await alpacaFetch(`/v2/stocks/bars?${params.toString()}`, { host: "data" });
      } catch {
        break;
      }
    }
    const part = parseBars(body);
    for (const [k, rows] of Object.entries(part)) {
      const key = k === "_" ? list[0] : k;
      merged[key] = (merged[key] ?? []).concat(rows);
    }
    const next = pageToken(body);
    if (!next) break;
    token = next;
    const have = list.reduce((n, s) => n + (merged[s]?.length ?? 0), 0);
    if (have >= cap) break;
  }
  return merged;
}

type TapeBar = { t: string; o: number; h: number; l: number; c: number; v: number };

function isoDaysAgo(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().replace(/\.\d{3}Z$/, "Z");
}

function barFromSnap(obj: unknown, fallbackT: string): TapeBar | null {
  if (!obj || typeof obj !== "object") return null;
  const o = asNum(numField(obj, "o"));
  const h = asNum(numField(obj, "h"));
  const l = asNum(numField(obj, "l"));
  const c = asNum(numField(obj, "c"));
  if (o == null || h == null || l == null || c == null) return null;
  const v = asNum(numField(obj, "v")) ?? 0;
  return { t: strField(obj, "t") ?? fallbackT, o, h, l, c, v };
}

function fmtPx(n: number | null): string | null {
  if (n == null || !Number.isFinite(n)) return null;
  if (n >= 100) return n.toFixed(2);
  if (n >= 1) return n.toFixed(3);
  return n.toFixed(4);
}

function asNum(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v) {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

const FIXTURE_TICKERS = new Set(["ALFA", "BRAV", "CHRL", "DELT", "ECHO", "FOXT", "GOLF", "HOTL"]);

function synthBars(last: number, count: number, stepMs: number, end = Date.now()): TapeBar[] {
  const out: TapeBar[] = [];
  for (let i = 0; i < count; i++) {
    const t = end - (count - 1 - i) * stepMs;
    const wave = Math.sin(i / 8) * last * 0.006 + Math.cos(i / 3.2) * last * 0.003;
    const c = last * (0.97 + (0.03 * i) / Math.max(count - 1, 1)) + wave;
    const o = c - last * 0.0015;
    const h = Math.max(o, c) + last * 0.002;
    const l = Math.min(o, c) - last * 0.002;
    out.push({ t: new Date(t).toISOString(), o, h, l, c, v: 120_000 + i * 850 });
  }
  if (out.length) out[out.length - 1].c = last;
  return out;
}

async function fixtureDetail(symbol: string): Promise<import("./alpaca-types").TickerDetail | null> {
  const sql = await getSql();
  const map = await sql.query<{ ticker: string; name: string | null; permanent_security_id: string }>(
    `SELECT st.ticker, s.display_name AS name, st.permanent_security_id
     FROM security_ticker st JOIN security s ON s.permanent_security_id = st.permanent_security_id
     WHERE st.ticker = $1
     LIMIT 1`,
    [symbol],
  );
  if (!map.length) return null;
  const quotes = await sql.query<{ envelope: { payload?: Record<string, unknown> } }>(
    `SELECT envelope FROM observation
     WHERE permanent_security_id = $1 AND snapshot_type = 'QUOTE' AND tombstoned = FALSE
     ORDER BY received_at DESC LIMIT 1`,
    [map[0].permanent_security_id],
  );
  const p = quotes[0]?.envelope?.payload ?? {};
  const last = asNum(p.last) ?? asNum(p.mid) ?? 100;
  const bid = asNum(p.bid);
  const ask = asNum(p.ask);
  const daily = synthBars(last, 80, 24 * 60 * 60 * 1000);
  const intra = synthBars(last, 78, 5 * 60 * 1000);
  const prev = daily.length > 1 ? daily[daily.length - 2].c : last;
  const change = last - prev;
  return {
    symbol,
    name: map[0].name,
    exchange: "SAMPLE",
    tradable: false,
    last: fmtPx(last),
    bid: bid != null ? fmtPx(bid) : null,
    ask: ask != null ? fmtPx(ask) : null,
    bid_size: null,
    ask_size: null,
    change: fmtPx(change),
    change_pct: prev ? ((change / prev) * 100).toFixed(2) : null,
    open: fmtPx(intra[0]?.o ?? last),
    high: fmtPx(Math.max(...intra.map((b) => b.h))),
    low: fmtPx(Math.min(...intra.map((b) => b.l))),
    prev_close: fmtPx(prev),
    volume: String(intra.reduce((s, b) => s + b.v, 0)),
    vwap: fmtPx(last),
    week52_high: fmtPx(Math.max(...daily.map((b) => b.h))),
    week52_low: fmtPx(Math.min(...daily.map((b) => b.l))),
    trade_at: intra.at(-1)?.t ?? null,
    quote_at: intra.at(-1)?.t ?? null,
    bars_intraday: intra,
    bars_daily: daily,
    news: [
      {
        id: `sample-${symbol}`,
        headline: `${map[0].name ?? symbol} is a sample research name. Live IEX quotes need a listed ticker such as AAPL.`,
        source: "Trading App",
        created_at: new Date().toISOString(),
        url: null,
        summary: null,
      },
    ],
    feed: "sample",
    notice: "Sample session prices. Open a listed ticker (AAPL, NVDA, SPY) for a live IEX feed.",
  };
}

export async function getTickerDetail(rawSymbol: string, userId?: string): Promise<import("./alpaca-types").TickerDetail> {
  const symbol = normalizeSymbol(rawSymbol);
  if (FIXTURE_TICKERS.has(symbol)) {
    const sample = await fixtureDetail(symbol);
    if (sample) return sample;
  }
  try {
    const creds = await resolveCreds(userId);
    return await withCreds(creds, () => liveTickerDetail(symbol));
  } catch (err) {
    const sample = await fixtureDetail(symbol);
    if (sample) return sample;
    throw err;
  }
}

async function liveTickerDetail(symbol: string): Promise<import("./alpaca-types").TickerDetail> {
  const startIntra = isoDaysAgo(8);
  const startHour = isoDaysAgo(12);
  const startDaily = isoDaysAgo(400);
  const [assetRaw, snapBody, intra, hourly, daily, newsRaw] = await Promise.all([
    alpacaFetch(`/v2/assets/${encodeURIComponent(symbol)}`).catch(() => ({})),
    alpacaFetch(`/v2/stocks/snapshots?symbols=${encodeURIComponent(symbol)}&feed=iex`, { host: "data" }).catch(() => ({})),
    getStockBars([symbol], "5Min", 2000, startIntra).catch(() => ({}) as Record<string, TapeBar[]>),
    getStockBars([symbol], "1Hour", 400, startHour).catch(() => ({}) as Record<string, TapeBar[]>),
    getStockBars([symbol], "1Day", 400, startDaily).catch(() => ({}) as Record<string, TapeBar[]>),
    alpacaFetch(`/v1beta1/news?symbols=${encodeURIComponent(symbol)}&limit=8&include_content=false`, { host: "data" }).catch(
      () => ({}),
    ),
  ]);

  const asset = asRecord(assetRaw);
  const snapBag = snapBody && typeof snapBody === "object" && !Array.isArray(snapBody) ? (snapBody as Record<string, unknown>) : {};
  const snap =
    (snapBag[symbol] && typeof snapBag[symbol] === "object"
      ? (snapBag[symbol] as Record<string, unknown>)
      : snapBag.snapshots && typeof snapBag.snapshots === "object"
        ? ((snapBag.snapshots as Record<string, unknown>)[symbol] as Record<string, unknown> | undefined)
        : undefined) ?? {};

  const last = asNum(numField(snap.latestTrade, "p")) ?? asNum(numField(snap.dailyBar, "c"));
  const prev = asNum(numField(snap.prevDailyBar, "c"));
  const change = last != null && prev != null ? last - prev : null;
  const changePct = change != null && prev ? (change / prev) * 100 : null;
  let dailyBars = daily[symbol] ?? [];
  const hourBars = hourly[symbol] ?? [];
  let intraBars = intra[symbol] ?? [];
  if (intraBars.length < 2 && hourBars.length) intraBars = hourBars;
  if (dailyBars.length < 2) {
    const seeded = [barFromSnap(snap.prevDailyBar, isoDaysAgo(1)), barFromSnap(snap.dailyBar, new Date().toISOString())].filter(
      (x): x is TapeBar => x !== null,
    );
    if (seeded.length) dailyBars = seeded;
  }
  let w52h: number | null = null;
  let w52l: number | null = null;
  for (const b of dailyBars) {
    if (w52h == null || b.h > w52h) w52h = b.h;
    if (w52l == null || b.l < w52l) w52l = b.l;
  }
  if (w52h == null) w52h = asNum(numField(snap.dailyBar, "h"));
  if (w52l == null) w52l = asNum(numField(snap.dailyBar, "l"));

  const newsList = (() => {
    const bag = newsRaw && typeof newsRaw === "object" && !Array.isArray(newsRaw) ? (newsRaw as Record<string, unknown>) : {};
    const rows = Array.isArray(bag.news) ? bag.news : Array.isArray(newsRaw) ? newsRaw : [];
    return rows
      .map((item) => {
        if (!item || typeof item !== "object") return null;
        const n = item as Record<string, unknown>;
        const headline = typeof n.headline === "string" ? n.headline : null;
        if (!headline) return null;
        return {
          id: String(n.id ?? headline),
          headline,
          source: typeof n.source === "string" ? n.source : typeof n.author === "string" ? n.author : null,
          created_at: typeof n.created_at === "string" ? n.created_at : "",
          url: typeof n.url === "string" ? n.url : null,
          summary: typeof n.summary === "string" ? n.summary : null,
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null)
      .slice(0, 8);
  })();

  return {
    symbol,
    name: typeof asset.name === "string" ? asset.name : null,
    exchange: typeof asset.exchange === "string" ? asset.exchange : null,
    tradable: asset.tradable === true || asset.tradable === "true",
    last: fmtPx(last),
    bid: fmtPx(asNum(numField(snap.latestQuote, "bp"))),
    ask: fmtPx(asNum(numField(snap.latestQuote, "ap"))),
    bid_size: numField(snap.latestQuote, "bs"),
    ask_size: numField(snap.latestQuote, "as"),
    change: change == null ? null : fmtPx(change),
    change_pct: changePct == null ? null : changePct.toFixed(2),
    open: fmtPx(asNum(numField(snap.dailyBar, "o"))),
    high: fmtPx(asNum(numField(snap.dailyBar, "h"))),
    low: fmtPx(asNum(numField(snap.dailyBar, "l"))),
    prev_close: fmtPx(asNum(numField(snap.prevDailyBar, "c"))),
    volume: numField(snap.dailyBar, "v"),
    vwap: fmtPx(asNum(numField(snap.dailyBar, "vw"))),
    week52_high: fmtPx(w52h),
    week52_low: fmtPx(w52l),
    trade_at: strField(snap.latestTrade, "t"),
    quote_at: strField(snap.latestQuote, "t"),
    bars_intraday: intraBars,
    bars_daily: dailyBars,
    news: newsList,
    feed: "live",
    notice: null,
  };
}

export async function submitOrder(args: {
  symbol: string;
  side: "buy" | "sell";
  type: "market" | "limit";
  timeInForce: "day" | "gtc" | "ioc";
  qty?: string;
  notional?: string;
  limitPrice?: string;
  extendedHours?: boolean;
  confirmLive?: boolean;
  actor: string;
}): Promise<Record<string, string | boolean | null>> {
  const creds = await loadStored();
  if (creds.mode === "LIVE") {
    throw new DeskError("LIVE_DISABLED", "This workspace is paper-only. Live Alpaca orders are not available.", 422);
  }
  const symbol = normalizeSymbol(args.symbol);
  const qty = args.qty?.trim() || undefined;
  const notional = args.notional?.trim() || undefined;
  if ((qty && notional) || (!qty && !notional)) {
    throw new DeskError("INVALID_SIZE", "Provide either share quantity or dollar notional, not both", 422);
  }
  if (qty && !/^[0-9]+(?:\.[0-9]{1,9})?$/.test(qty)) {
    throw new DeskError("INVALID_SIZE", "Quantity must be a positive decimal", 422);
  }
  if (notional && !/^[0-9]+(?:\.[0-9]{1,2})?$/.test(notional)) {
    throw new DeskError("INVALID_SIZE", "Notional must be dollars with at most 2 decimal places", 422);
  }
  if (args.type === "limit") {
    const px = args.limitPrice?.trim();
    if (!px || !/^[0-9]+(?:\.[0-9]{1,4})?$/.test(px)) {
      throw new DeskError("INVALID_LIMIT", "Limit orders need a limit price", 422);
    }
  }
  const clientOrderId = newId("clid");
  const payload: Record<string, unknown> = {
    symbol,
    side: args.side,
    type: args.type,
    time_in_force: args.timeInForce,
    client_order_id: clientOrderId,
  };
  if (qty) payload.qty = qty;
  if (notional) payload.notional = notional;
  if (args.type === "limit") payload.limit_price = args.limitPrice!.trim();
  if (args.extendedHours) payload.extended_hours = true;
  const raw = await alpacaFetch("/v2/orders", { method: "POST", body: JSON.stringify(payload) });
  const rec = asRecord(raw);
  const sql = await getSql();
  try {
    await sql.query(
      `INSERT INTO alpaca_order_log (
         local_id, alpaca_order_id, client_order_id, symbol, side, order_type, time_in_force,
         qty, notional, limit_price, status, mode, submitted_at, submitted_by, raw_receipt
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,NOW(),$13,$14::jsonb)`,
      [
        newId("aord"),
        rec.id ?? null,
        clientOrderId,
        symbol,
        args.side,
        args.type,
        args.timeInForce,
        qty ?? null,
        notional ?? null,
        args.type === "limit" ? args.limitPrice!.trim() : null,
        rec.status ?? "submitted",
        creds.mode,
        safeActor(args.actor),
        JSON.stringify(raw),
      ],
    );
  } catch {
    /* local audit must not block a live/paper fill */
  }
  return rec;
}

export async function cancelOrder(orderId: string): Promise<Record<string, string | boolean | null>> {
  if (!/^[A-Za-z0-9-]+$/.test(orderId) || orderId.length > 64) {
    throw new DeskError("INVALID_ORDER", "Bad order id", 422);
  }
  const raw = await alpacaFetch(`/v2/orders/${encodeURIComponent(orderId)}`, { method: "DELETE" });
  return asRecord(raw);
}

export async function closePosition(symbol: string): Promise<Record<string, string | boolean | null>> {
  const s = normalizeSymbol(symbol);
  const raw = await alpacaFetch(`/v2/positions/${encodeURIComponent(s)}`, { method: "DELETE" });
  return asRecord(raw);
}

