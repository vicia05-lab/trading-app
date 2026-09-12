import { i as TSS_SERVER_FUNCTION, r as createServerFn } from "./ssr.mjs";
import { t as authMiddleware } from "./middleware-BdsHrOyG.mjs";
import { Dt as boolean, Et as array, Ft as string, Mt as object, wt as _enum } from "../_libs/@better-auth/core+[...].mjs";
import { a as ensureBootstrapped, d as pauseAdmission, f as recordPrintKnowledge, i as asHex, l as getSql, m as rfc3339, n as appendFireRateNote, p as resumeAdmission, r as applyDueDeadlines, s as freezeMember, t as DeskError, u as newId } from "./bootstrap-DdU3Axev.mjs";
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
//#region node_modules/.nitro/vite/services/ssr/assets/server-fns-DDqY4gqm.js
var createServerRpc = (serverFnMeta, splitImportFn) => {
	const url = "/_serverFn/" + serverFnMeta.id;
	return Object.assign(splitImportFn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
var WRAP_ID = "kr-alpaca-wrap";
var DEFAULT_WATCH = [
	"SPY",
	"QQQ",
	"NVDA",
	"AAPL",
	"MSFT",
	"AMZN",
	"META",
	"GOOGL",
	"TSLA",
	"AMD"
];
function tradingHost(mode) {
	return mode === "LIVE" ? "https://api.alpaca.markets" : "https://paper-api.alpaca.markets";
}
function asBuf(v) {
	if (Buffer.isBuffer(v)) return v;
	if (v instanceof Uint8Array) return Buffer.from(v);
	if (typeof v === "string") {
		const s = v.startsWith("\\x") ? v.slice(2) : v;
		if (/^[0-9a-fA-F]+$/.test(s) && s.length % 2 === 0) return Buffer.from(s, "hex");
	}
	throw new DeskError("KEYRING", "unreadable key material", 500);
}
function maskKey(id) {
	if (id.length <= 8) return `${id.slice(0, 2)}…${id.slice(-2)}`;
	return `${id.slice(0, 4)}…${id.slice(-4)}`;
}
async function wrapKey() {
	const sql = await getSql();
	const existing = await sql.query(`SELECT key_bytes FROM app_keyring WHERE key_id = $1`, [WRAP_ID]);
	if (existing.length) return asBuf(existing[0].key_bytes);
	const bytes = randomBytes(32);
	await sql.query(`INSERT INTO app_keyring (key_id, purpose, key_bytes, created_at)
     VALUES ($1, 'alpaca_wrap', $2, NOW())
     ON CONFLICT (key_id) DO NOTHING`, [WRAP_ID, bytes]);
	const again = await sql.query(`SELECT key_bytes FROM app_keyring WHERE key_id = $1`, [WRAP_ID]);
	if (!again.length) throw new DeskError("KEYRING", "failed to persist wrap key", 500);
	return asBuf(again[0].key_bytes);
}
function encryptSecret(key, plain) {
	const nonce = randomBytes(12);
	const cipher = createCipheriv("aes-256-gcm", key, nonce);
	return {
		ciphertext: Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]),
		nonce,
		tag: cipher.getAuthTag()
	};
}
function decryptSecret(key, ciphertext, nonce, tag) {
	const decipher = createDecipheriv("aes-256-gcm", key, nonce);
	decipher.setAuthTag(tag);
	return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
}
function normalizeSymbol(raw) {
	const s = raw.trim().toUpperCase();
	if (!/^[A-Z][A-Z.]{0,9}$/.test(s)) throw new DeskError("INVALID_SYMBOL", "Ticker must be letters (optional dot), max 10", 422);
	return s;
}
function normalizeWatchlist(list) {
	const out = [];
	const seen = /* @__PURE__ */ new Set();
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
async function publicStatus() {
	const sql = await getSql();
	try {
		const rows = await sql.query(`SELECT api_key_id, mode, watchlist, last_ok_at::text, last_error, account_number_last4, account_status
       FROM alpaca_credential WHERE singleton_key = TRUE`);
		if (!rows.length) return {
			connected: false,
			mode: null,
			api_key_masked: null,
			account_number_last4: null,
			account_status: null,
			last_ok_at: null,
			last_error: null,
			watchlist: DEFAULT_WATCH,
			trading_host: null
		};
		const r = rows[0];
		const watch = Array.isArray(r.watchlist) ? r.watchlist : String(r.watchlist ?? "").replace(/[{}]/g, "").split(",").map((s) => s.trim()).filter(Boolean);
		return {
			connected: true,
			mode: r.mode,
			api_key_masked: maskKey(r.api_key_id),
			account_number_last4: r.account_number_last4,
			account_status: r.account_status,
			last_ok_at: r.last_ok_at,
			last_error: r.last_error,
			watchlist: watch.length ? watch : DEFAULT_WATCH,
			trading_host: tradingHost(r.mode)
		};
	} catch (e) {
		const msg = e instanceof Error ? e.message : "";
		if (msg.includes("alpaca_credential") || msg.includes("does not exist")) return {
			connected: false,
			mode: null,
			api_key_masked: null,
			account_number_last4: null,
			account_status: null,
			last_ok_at: null,
			last_error: null,
			watchlist: DEFAULT_WATCH,
			trading_host: null
		};
		throw e;
	}
}
async function loadStored() {
	const rows = await (await getSql()).query(`SELECT api_key_id, secret_ciphertext, secret_nonce, secret_tag, mode, watchlist
     FROM alpaca_credential WHERE singleton_key = TRUE`);
	if (!rows.length) throw new DeskError("ALPACA_NOT_CONNECTED", "Insert Alpaca keys on Admin first", 409);
	const r = rows[0];
	const secret = decryptSecret(await wrapKey(), asBuf(r.secret_ciphertext), asBuf(r.secret_nonce), asBuf(r.secret_tag));
	const watch = Array.isArray(r.watchlist) ? r.watchlist : String(r.watchlist ?? "").replace(/[{}]/g, "").split(",").map((s) => s.trim()).filter(Boolean);
	return {
		api_key_id: r.api_key_id,
		secret,
		mode: r.mode,
		watchlist: watch.length ? watch : DEFAULT_WATCH
	};
}
async function alpacaFetch(path, init = {}) {
	const creds = await loadStored();
	const host = init.host === "data" ? "https://data.alpaca.markets" : tradingHost(creds.mode);
	const headers = new Headers(init.headers);
	headers.set("APCA-API-KEY-ID", creds.api_key_id);
	headers.set("APCA-API-SECRET-KEY", creds.secret);
	headers.set("Accept", "application/json");
	if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
	let res;
	try {
		res = await fetch(`${host}${path}`, {
			...init,
			headers
		});
	} catch (e) {
		throw new DeskError("ALPACA_UNREACHABLE", e instanceof Error ? `Alpaca unreachable: ${e.message}` : "Alpaca unreachable", 503, true);
	}
	const text = await res.text();
	let body = null;
	const looksHtml = /^\s*</.test(text);
	if (text && !looksHtml) try {
		body = JSON.parse(text);
	} catch {
		body = { message: text.slice(0, 180) };
	}
	if (!res.ok) {
		const jsonMsg = body && !Array.isArray(body) && typeof body.message === "string" ? body.message : null;
		const msg = jsonMsg && !jsonMsg.includes("<") ? jsonMsg : res.status === 401 || res.status === 403 ? "Alpaca rejected these keys. Use paper keys for Paper, live keys for Live, and paste the full secret." : `Alpaca HTTP ${res.status}`;
		const code = res.status === 401 || res.status === 403 ? "ALPACA_AUTH" : "ALPACA_HTTP";
		throw new DeskError(code, msg, res.status === 401 ? 401 : 422);
	}
	return body ?? {};
}
async function markOk(accountNumber, status) {
	const sql = await getSql();
	const last4 = accountNumber ? accountNumber.slice(-4) : null;
	await sql.query(`UPDATE alpaca_credential
     SET last_ok_at = NOW(), last_error = NULL, account_number_last4 = COALESCE($1, account_number_last4),
         account_status = COALESCE($2, account_status)
     WHERE singleton_key = TRUE`, [last4, status ?? null]);
}
async function markErr(message) {
	await (await getSql()).query(`UPDATE alpaca_credential SET last_error = $1 WHERE singleton_key = TRUE`, [message.slice(0, 400)]);
}
async function saveCredentials(args) {
	const apiKeyId = args.apiKeyId.trim();
	const apiSecret = args.apiSecret.trim();
	if (apiKeyId.length < 8 || apiSecret.length < 8) throw new DeskError("INVALID_KEYS", "Key id and secret must be at least 8 characters", 422);
	if (args.mode === "LIVE" && args.confirmLive !== true) throw new DeskError("LIVE_NOT_CONFIRMED", "Live mode requires the explicit confirmation checkbox", 422);
	const enc = encryptSecret(await wrapKey(), apiSecret);
	await (await getSql()).query(`INSERT INTO alpaca_credential (
       singleton_key, api_key_id, secret_ciphertext, secret_nonce, secret_tag, mode, watchlist,
       connected_at, connected_by, last_ok_at, last_error, account_number_last4, account_status
     ) VALUES (TRUE,$1,$2,$3,$4,$5,$6,NOW(),$7,NULL,NULL,NULL,NULL)
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
       account_status = NULL`, [
		apiKeyId,
		enc.ciphertext,
		enc.nonce,
		enc.tag,
		args.mode,
		DEFAULT_WATCH,
		args.actor
	]);
	try {
		await probeAccount();
	} catch (e) {
		await markErr(e instanceof DeskError ? e.message : "Connection test failed");
		throw e;
	}
	return publicStatus();
}
async function disconnect() {
	await (await getSql()).query(`DELETE FROM alpaca_credential WHERE singleton_key = TRUE`);
	return publicStatus();
}
async function saveWatchlist(list) {
	const watch = normalizeWatchlist(list);
	if (!(await (await getSql()).query(`UPDATE alpaca_credential SET watchlist = $1 WHERE singleton_key = TRUE RETURNING api_key_id`, [watch])).length) throw new DeskError("ALPACA_NOT_CONNECTED", "Insert Alpaca keys on Admin first", 409);
	return publicStatus();
}
async function probeAccount() {
	const body = await alpacaFetch("/v2/account");
	await markOk(typeof body.account_number === "string" ? body.account_number : void 0, typeof body.status === "string" ? body.status : void 0);
	return body;
}
function pick(obj, keys) {
	const out = {};
	for (const k of keys) {
		const v = obj[k];
		if (typeof v === "string" || typeof v === "boolean") out[k] = v;
		else if (typeof v === "number") out[k] = String(v);
		else out[k] = v == null ? null : String(v);
	}
	return out;
}
async function getAccount() {
	const picked = pick(await probeAccount(), [
		"id",
		"account_number",
		"status",
		"currency",
		"cash",
		"buying_power",
		"regt_buying_power",
		"daytrading_buying_power",
		"equity",
		"portfolio_value",
		"last_equity",
		"multiplier",
		"pattern_day_trader",
		"trading_blocked",
		"transfers_blocked",
		"account_blocked",
		"shorting_enabled",
		"long_market_value",
		"short_market_value",
		"initial_margin",
		"maintenance_margin",
		"sma",
		"daytrade_count"
	]);
	if (typeof picked.account_number === "string") picked.account_number = maskKey(picked.account_number);
	if (typeof picked.id === "string") picked.id = maskKey(picked.id);
	return picked;
}
async function getClock() {
	return pick(await alpacaFetch("/v2/clock"), [
		"timestamp",
		"is_open",
		"next_open",
		"next_close"
	]);
}
async function getPositions() {
	const body = await alpacaFetch("/v2/positions");
	return (Array.isArray(body) ? body : []).map((row) => {
		return pick(row, [
			"symbol",
			"qty",
			"qty_available",
			"avg_entry_price",
			"market_value",
			"cost_basis",
			"unrealized_pl",
			"unrealized_plpc",
			"current_price",
			"lastday_price",
			"change_today",
			"side",
			"asset_class"
		]);
	});
}
async function getOrders(status = "open") {
	const body = await alpacaFetch(`/v2/orders?${new URLSearchParams({
		status,
		direction: "desc",
		limit: "50"
	}).toString()}`);
	return (Array.isArray(body) ? body : []).map((row) => {
		return pick(row, [
			"id",
			"client_order_id",
			"created_at",
			"updated_at",
			"submitted_at",
			"filled_at",
			"expired_at",
			"canceled_at",
			"symbol",
			"qty",
			"filled_qty",
			"filled_avg_price",
			"notional",
			"type",
			"side",
			"time_in_force",
			"limit_price",
			"status",
			"extended_hours"
		]);
	});
}
function num(v) {
	if (typeof v === "number" && Number.isFinite(v)) return v;
	if (typeof v === "string" && v !== "" && Number.isFinite(Number(v))) return Number(v);
	return null;
}
async function getSnapshots(symbols) {
	const list = normalizeWatchlist(symbols);
	const q = new URLSearchParams({
		symbols: list.join(","),
		feed: "iex"
	});
	let body;
	try {
		body = await alpacaFetch(`/v2/stocks/snapshots?${q.toString()}`, { host: "data" });
	} catch (e) {
		if (e instanceof DeskError && e.code === "ALPACA_AUTH") body = await alpacaFetch(`/v2/stocks/snapshots?${new URLSearchParams({ symbols: list.join(",") }).toString()}`, { host: "data" });
		else throw e;
	}
	const map = body && !Array.isArray(body) ? body : {};
	return list.map((symbol) => {
		const snap = map[symbol] ?? map[symbol.toLowerCase()] ?? {};
		const quote = snap.latestQuote ?? {};
		const trade = snap.latestTrade ?? {};
		const daily = snap.dailyBar ?? {};
		const prev = snap.prevDailyBar ?? {};
		const last = num(trade.p) ?? num(quote.ap) ?? num(quote.bp);
		const prevClose = num(prev.c);
		let change = null;
		if (last != null && prevClose && prevClose !== 0) change = ((last - prevClose) / prevClose * 100).toFixed(2);
		return {
			symbol,
			bid: quote.bp == null ? null : String(quote.bp),
			ask: quote.ap == null ? null : String(quote.ap),
			last: last == null ? null : String(last),
			daily_open: daily.o == null ? null : String(daily.o),
			daily_high: daily.h == null ? null : String(daily.h),
			daily_low: daily.l == null ? null : String(daily.l),
			daily_close: daily.c == null ? null : String(daily.c),
			daily_volume: daily.v == null ? null : String(daily.v),
			change_pct: change
		};
	});
}
async function submitOrder(args) {
	const creds = await loadStored();
	if (creds.mode === "LIVE" && args.confirmLive !== true) throw new DeskError("LIVE_NOT_CONFIRMED", "Live orders require the explicit confirmation checkbox", 422);
	const symbol = normalizeSymbol(args.symbol);
	const qty = args.qty?.trim() || void 0;
	const notional = args.notional?.trim() || void 0;
	if (qty && notional || !qty && !notional) throw new DeskError("INVALID_SIZE", "Provide either share quantity or dollar notional, not both", 422);
	if (qty && !/^[0-9]+(?:\.[0-9]{1,9})?$/.test(qty)) throw new DeskError("INVALID_SIZE", "Quantity must be a positive decimal", 422);
	if (notional && !/^[0-9]+(?:\.[0-9]{1,2})?$/.test(notional)) throw new DeskError("INVALID_SIZE", "Notional must be dollars with at most 2 decimal places", 422);
	if (args.type === "limit") {
		if (!args.limitPrice || !/^[0-9]+(?:\.[0-9]{1,4})?$/.test(args.limitPrice.trim())) throw new DeskError("INVALID_LIMIT", "Limit orders need a limit price", 422);
	}
	const clientOrderId = newId("aco");
	const payload = {
		symbol,
		side: args.side,
		type: args.type,
		time_in_force: args.timeInForce,
		client_order_id: clientOrderId
	};
	if (qty) payload.qty = qty;
	if (notional) payload.notional = notional;
	if (args.type === "limit") payload.limit_price = args.limitPrice.trim();
	if (args.extendedHours) payload.extended_hours = true;
	const body = await alpacaFetch("/v2/orders", {
		method: "POST",
		body: JSON.stringify(payload)
	});
	const sql = await getSql();
	const localId = newId("aor");
	await sql.query(`INSERT INTO alpaca_order_log (
       local_id, alpaca_order_id, client_order_id, symbol, side, order_type, time_in_force,
       qty, notional, limit_price, status, mode, submitted_at, submitted_by, raw_receipt
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,NOW(),$13,$14::jsonb)`, [
		localId,
		typeof body.id === "string" ? body.id : null,
		clientOrderId,
		symbol,
		args.side,
		args.type,
		args.timeInForce,
		qty ?? null,
		notional ?? null,
		args.limitPrice?.trim() ?? null,
		typeof body.status === "string" ? body.status : "submitted",
		creds.mode,
		args.actor,
		JSON.stringify(body)
	]);
	return pick(body, [
		"id",
		"client_order_id",
		"symbol",
		"qty",
		"notional",
		"filled_qty",
		"filled_avg_price",
		"type",
		"side",
		"time_in_force",
		"limit_price",
		"status",
		"submitted_at"
	]);
}
async function cancelOrder(orderId) {
	if (!/^[A-Za-z0-9-]+$/.test(orderId) || orderId.length > 64) throw new DeskError("INVALID_ORDER", "Bad order id", 422);
	await alpacaFetch(`/v2/orders/${orderId}`, { method: "DELETE" });
	await (await getSql()).query(`UPDATE alpaca_order_log SET status = 'canceled' WHERE alpaca_order_id = $1`, [orderId]);
	return { canceled: orderId };
}
async function closePosition(symbol) {
	const s = normalizeSymbol(symbol);
	return pick(await alpacaFetch(`/v2/positions/${encodeURIComponent(s)}`, { method: "DELETE" }), [
		"id",
		"symbol",
		"qty",
		"side",
		"type",
		"status",
		"submitted_at"
	]);
}
function wrap(requestId, asOf, data, warnings = []) {
	return {
		product_name: "Trading App",
		paperOnly: true,
		liveTradingSupported: false,
		activeModelWeight: "0",
		data_mode: "FIXTURE",
		request_id: requestId,
		as_of: asOf,
		data,
		warnings
	};
}
async function asOf() {
	const r = await (await getSql()).query(`SELECT now_utc::text FROM fixture_clock WHERE singleton_key = TRUE`);
	return rfc3339(new Date(r[0]?.now_utc ?? Date.now()));
}
function rate(num, den) {
	if (den === 0) return {
		value: null,
		reason: "NO_DENOMINATOR"
	};
	return {
		value: (num / den).toFixed(12),
		reason: null
	};
}
async function homePayload(role) {
	await ensureBootstrapped();
	const sql = await getSql();
	const clock = await asOf();
	const sessions = await sql.query(`SELECT manifest_id, session_date::text, freeze_resolution, sealed_member_count,
            freeze_cutoff_at::text, seal_at::text, mark_wait_at::text, report_finalize_at::text,
            admission_closed_event_seq, research_closed_event_seq
     FROM manifest ORDER BY session_date DESC`);
	const latest = sessions[0] ?? null;
	const frozen = latest ? await sql.query(`SELECT COUNT(*)::int AS c FROM "freeze" WHERE manifest_id = $1`, [latest.manifest_id]) : [{ c: 0 }];
	const complete = latest ? await sql.query(`SELECT COUNT(*)::int AS c FROM "freeze" WHERE manifest_id = $1 AND card_complete = TRUE`, [latest.manifest_id]) : [{ c: 0 }];
	const risk = await sql.query(`SELECT reserved_count, reserved_notional::text FROM desk_risk_state WHERE sleeve = 'EARNINGS'`);
	const impaired = await sql.query(`SELECT COUNT(*)::int AS c FROM "position" WHERE state IN ('IMPAIRED_ENTRY','IMPAIRED_EXIT')`);
	const nonclosed = await sql.query(`SELECT COUNT(*)::int AS c FROM "position" WHERE state <> 'CLOSED'`);
	const ctrl = await sql.query(`SELECT admission_paused, pause_reason FROM operator_control WHERE sleeve = 'EARNINGS'`);
	const due = await sql.query(`SELECT COUNT(*)::int AS c FROM deadline d, fixture_clock c WHERE d.applied_event_seq IS NULL AND d.scheduled_at <= c.now_utc`);
	const snap = latest ? await sql.query(`SELECT snapshot_id, created_at::text FROM report_snapshot WHERE manifest_id = $1 ORDER BY created_at DESC LIMIT 1`, [latest.manifest_id]) : [];
	const book = role === "OPERATOR" ? null : await sql.query(`SELECT COALESCE(SUM((values->>'paper_pnl')::numeric),0)::text AS pnl,
                COUNT(*) FILTER (WHERE status = 'PRICED')::int AS priced
         FROM book_vintage bv
         JOIN (SELECT position_id, MAX(vintage) AS v FROM book_vintage GROUP BY position_id) t
           ON t.position_id = bv.position_id AND t.v = bv.vintage`);
	return wrap("home-1", clock, {
		role,
		data_mode: "FIXTURE",
		window_id: "win-2026q3",
		policy_id: "pol-v1",
		rule_id: "rule-v1",
		latest_session: latest ? {
			manifest_id: latest.manifest_id,
			session_date: latest.session_date,
			freeze_resolution: latest.freeze_resolution,
			sealed_member_count: String(latest.sealed_member_count),
			frozen_count: String(frozen[0].c),
			complete_frozen_cards: String(complete[0].c),
			seal_at: latest.seal_at,
			freeze_cutoff_at: latest.freeze_cutoff_at,
			mark_wait_at: latest.mark_wait_at,
			report_finalize_at: latest.report_finalize_at,
			research_closed: latest.research_closed_event_seq != null
		} : null,
		sessions: sessions.map((s) => ({
			manifest_id: s.manifest_id,
			session_date: s.session_date,
			freeze_resolution: s.freeze_resolution,
			sealed_member_count: String(s.sealed_member_count)
		})),
		reserved_count: String(risk[0]?.reserved_count ?? 0),
		reserved_notional: risk[0]?.reserved_notional ?? "0.0000",
		nonclosed_positions: String(nonclosed[0].c),
		impaired_count: String(impaired[0].c),
		admission_paused: ctrl[0]?.admission_paused ?? false,
		pause_reason: ctrl[0]?.pause_reason ?? null,
		overdue_deadlines: String(due[0].c),
		report_snapshot_id: snap[0]?.snapshot_id ?? null,
		report_as_of: snap[0]?.created_at ?? null,
		reviewer_book: book ? {
			latest_paper_pnl: book[0].pnl,
			priced_vintages: String(book[0].priced)
		} : null,
		research_complete_does_not_imply_book_clear: true,
		alpaca: await publicStatus()
	});
}
async function earningsPayload(role, sessionDate) {
	await ensureBootstrapped();
	const sql = await getSql();
	const clock = await asOf();
	const sessions = await sql.query(`SELECT manifest_id, session_date::text FROM manifest ORDER BY session_date`);
	const man = await sql.query(sessionDate ? `SELECT manifest_id, session_date::text FROM manifest WHERE session_date = $1` : `SELECT manifest_id, session_date::text FROM manifest ORDER BY session_date DESC LIMIT 1`, sessionDate ? [sessionDate] : []);
	if (!man.length) return wrap("earn-1", clock, {
		role,
		manifest_id: "",
		session_date: sessionDate ?? "",
		sessions,
		members: [],
		exclusions: []
	});
	const members = await sql.query(`SELECT m.permanent_security_id, m.display_ticker, m.event_key, m.timing_quality, m.shuffle_order_index,
            s.card, s.card_complete, s.options_valid, s.pin_count
     FROM manifest_member m JOIN sealed_input s
       ON s.manifest_id = m.manifest_id AND s.permanent_security_id = m.permanent_security_id
     WHERE m.manifest_id = $1
     ORDER BY m.display_ticker`, [man[0].manifest_id]);
	const exclusions = await sql.query(`SELECT permanent_security_id, status, reason_codes FROM candidate_eligibility WHERE manifest_id = $1 AND status <> 'INCLUDED'`, [man[0].manifest_id]);
	const tickers = await sql.query(`SELECT permanent_security_id, ticker FROM security_ticker`);
	const tmap = Object.fromEntries(tickers.map((t) => [t.permanent_security_id, t.ticker]));
	return wrap("earn-1", clock, {
		role,
		manifest_id: man[0].manifest_id,
		session_date: man[0].session_date,
		sessions,
		members: members.map((m) => ({
			permanent_security_id: m.permanent_security_id,
			ticker: m.display_ticker,
			event_key: m.event_key,
			timing_quality: m.timing_quality,
			card_complete: m.card_complete,
			options_valid: m.options_valid,
			pin_count: String(m.pin_count),
			implied_move: typeof m.card.implied_move === "string" ? m.card.implied_move : null,
			benchmark_relative_5d: typeof m.card.benchmark_relative_5d === "string" ? m.card.benchmark_relative_5d : null,
			benchmark_relative_63d: typeof m.card.benchmark_relative_63d === "string" ? m.card.benchmark_relative_63d : null,
			shuffle_order_index: role === "OPERATOR" ? null : String(m.shuffle_order_index)
		})),
		exclusions: exclusions.map((e) => ({
			permanent_security_id: e.permanent_security_id,
			ticker: tmap[e.permanent_security_id] ?? e.permanent_security_id,
			status: e.status,
			reason_codes: e.reason_codes
		}))
	});
}
async function predictionsPayload(role, manifestId, sessionDate) {
	await ensureBootstrapped();
	const sql = await getSql();
	const clock = await asOf();
	const sessions = await sql.query(`SELECT manifest_id, session_date::text, freeze_resolution FROM manifest ORDER BY session_date`);
	const man = await sql.query(manifestId ? `SELECT manifest_id, session_date::text, freeze_resolution FROM manifest WHERE manifest_id = $1` : sessionDate ? `SELECT manifest_id, session_date::text, freeze_resolution FROM manifest WHERE session_date = $1` : `SELECT manifest_id, session_date::text, freeze_resolution FROM manifest ORDER BY session_date DESC LIMIT 1`, manifestId ? [manifestId] : sessionDate ? [sessionDate] : []);
	if (!man.length) return wrap("pred-1", clock, {
		role,
		manifest_id: "",
		session_date: sessionDate ?? "",
		freeze_resolution: "EMPTY",
		sessions: sessions.map((s) => ({
			manifest_id: s.manifest_id,
			session_date: s.session_date,
			freeze_resolution: s.freeze_resolution
		})),
		rows: []
	});
	const rows = await sql.query(`SELECT mm.permanent_security_id, mm.display_ticker, mm.shuffle_order_index,
            f.freeze_id, f.decision, f.direction, f.input_hash, f.output_hash, f.verification_level, f.output_payload,
            a.outcome AS admission_outcome, a.position_id
     FROM manifest_member mm
     LEFT JOIN "freeze" f ON f.manifest_id = mm.manifest_id AND f.permanent_security_id = mm.permanent_security_id
     LEFT JOIN execution_admission a ON a.freeze_id = f.freeze_id
     WHERE mm.manifest_id = $1
     ORDER BY mm.display_ticker`, [man[0].manifest_id]);
	const operator = role === "OPERATOR";
	return wrap("pred-1", clock, {
		role,
		manifest_id: man[0].manifest_id,
		session_date: man[0].session_date,
		freeze_resolution: man[0].freeze_resolution,
		sessions: sessions.map((s) => ({
			manifest_id: s.manifest_id,
			session_date: s.session_date,
			freeze_resolution: s.freeze_resolution
		})),
		rows: rows.map((r) => ({
			permanent_security_id: r.permanent_security_id,
			ticker: r.display_ticker,
			status: r.freeze_id ? r.decision : "NO_FREEZE",
			direction: r.decision === "PREDICT" ? r.direction : null,
			execution: r.admission_outcome === "ADMITTED" ? "PAPER_COMMITTED" : r.decision === "PREDICT" ? "NOT_TRADED" : r.admission_outcome ?? "NONE",
			input_hash: r.input_hash ? asHex(r.input_hash) : null,
			output_hash: r.output_hash ? asHex(r.output_hash) : null,
			verification_level: r.verification_level,
			reasons: r.output_payload?.reasons ?? [],
			magnitude_low: operator ? null : r.output_payload?.magnitude_low ?? null,
			magnitude_high: operator ? null : r.output_payload?.magnitude_high ?? null,
			position_id: r.position_id,
			shuffle_order_index: operator ? null : String(r.shuffle_order_index)
		}))
	});
}
async function resultsPayload(role) {
	await ensureBootstrapped();
	const sql = await getSql();
	const clock = await asOf();
	const sealed = await sql.query(`SELECT COUNT(*)::int AS c FROM manifest_member`);
	const frozen = await sql.query(`SELECT COUNT(*)::int AS c FROM "freeze"`);
	const byDecision = await sql.query(`SELECT decision, COUNT(*)::int AS c FROM "freeze" GROUP BY decision`);
	const noFreeze = await sql.query(`SELECT COUNT(*)::int AS c FROM grade WHERE outcome = 'NO_FREEZE' AND vintage = 0`);
	const outcomes = await sql.query(`SELECT outcome, COUNT(*)::int AS c FROM grade WHERE vintage = 0 GROUP BY outcome`);
	const complete = await sql.query(`SELECT COUNT(*)::int AS c FROM "freeze" WHERE card_complete = TRUE`);
	const predict = byDecision.find((d) => d.decision === "PREDICT")?.c ?? 0;
	const stand = byDecision.find((d) => d.decision === "STAND_DOWN")?.c ?? 0;
	const nSealed = sealed[0].c;
	const nFrozen = frozen[0].c;
	const manifests = await sql.query(`SELECT freeze_resolution, COUNT(*)::int AS c FROM manifest GROUP BY freeze_resolution`);
	const nonempty = manifests.filter((m) => m.freeze_resolution !== "EMPTY").reduce((a, b) => a + b.c, 0);
	const partial = manifests.find((m) => m.freeze_resolution === "PARTIAL")?.c ?? 0;
	const grades = await sql.query(`SELECT mm.display_ticker AS ticker, g.permanent_security_id, f.decision, g.outcome, g.in_evidence_set, g.values, g.reason_codes AS reasons, man.session_date::text
     FROM grade g
     JOIN manifest_member mm ON mm.manifest_id = g.manifest_id AND mm.permanent_security_id = g.permanent_security_id
     JOIN manifest man ON man.manifest_id = g.manifest_id
     LEFT JOIN "freeze" f ON f.freeze_id = g.freeze_id
     WHERE g.vintage = 0
     ORDER BY man.session_date, mm.display_ticker`);
	const books = await sql.query(`SELECT p.display_ticker AS ticker, p.state, p.original_reserved_notional::text AS notional,
            bv.values->>'paper_pnl' AS pnl, bv.basis, bv.strategy_pnl_eligible AS eligible, bv.vintage
     FROM "position" p
     LEFT JOIN book_vintage bv ON bv.book_vintage_id = p.last_book_vintage_id
     ORDER BY p.display_ticker`);
	const cleanPredict = grades.filter((g) => g.decision === "PREDICT" && g.in_evidence_set);
	const hits = cleanPredict.filter((g) => g.values.direction_hit === true).length;
	const C = cleanPredict.length;
	const U = grades.filter((g) => g.decision === "PREDICT" && !g.in_evidence_set && g.outcome !== "NO_EVENT").length;
	const lower = rate(hits, C + U);
	const upper = rate(hits + U, C + U);
	const suppress = lower.value && Number(lower.value) <= .5 && Number(upper.value) >= .5;
	const operator = role === "OPERATOR";
	return wrap("res-1", clock, {
		role,
		banner: "Operational research report. Rule v1 was selected after prior observation. Small-sample hit rate does not establish a trading edge. Paper P&L is ESTIMATED under a conservative stress haircut, not live-fill evidence. Unresolved prices and excluded labels are disclosed separately.",
		process: {
			sealed: String(nSealed),
			frozen: String(nFrozen),
			no_freeze: String(noFreeze[0].c),
			stand_down: String(stand),
			predict: String(predict),
			complete_frozen_cards: String(complete[0].c),
			outcomes: Object.fromEntries(outcomes.map((o) => [o.outcome, String(o.c)])),
			freeze_rate: rate(nFrozen, nSealed),
			stand_down_rate: rate(stand, nFrozen),
			predict_rate_complete: rate(predict, complete[0].c),
			no_freeze_rate: rate(noFreeze[0].c, nSealed),
			partial_manifest_rate: rate(partial, nonempty)
		},
		research: operator ? {
			restricted: true,
			message: "Direction hits, bands, marks, and P&L are withheld from OPERATOR until window release."
		} : {
			restricted: false,
			clean_predict_n: String(C),
			direction_hits: String(hits),
			hit_rate: suppress ? null : rate(hits, C),
			attrition_lower: lower,
			attrition_upper: upper,
			interval_label: "missingness sensitivity interval, not a confidence interval",
			point_estimate_suppressed: Boolean(suppress),
			grades: grades.map((g) => ({
				ticker: g.ticker,
				id: g.permanent_security_id,
				session_date: g.session_date,
				decision: g.decision,
				outcome: g.outcome,
				in_evidence_set: g.in_evidence_set,
				direction_hit: g.values.direction_hit ?? null,
				band_hit: g.values.band_hit ?? null,
				raw_gap: g.values.raw_gap ?? null,
				entry_price: g.values.entry_price ?? null,
				exit_price: g.values.exit_price ?? null,
				reasons: g.reasons
			}))
		},
		book: operator ? { restricted: true } : { positions: books.map((b) => ({
			ticker: b.ticker,
			state: b.state,
			original_reserved_notional: b.notional,
			paper_pnl: b.pnl,
			basis: b.basis,
			strategy_pnl_eligible: b.eligible,
			vintage: b.vintage == null ? null : String(b.vintage)
		})) }
	});
}
async function adminPayload(role) {
	await ensureBootstrapped();
	const sql = await getSql();
	const clock = await asOf();
	const jobs = await sql.query(`SELECT job_name, status, last_completed_at::text, safe_error_code FROM job_state ORDER BY job_name`);
	const deadlines = await sql.query(`SELECT kind, scheduled_at::text, applied_at::text, manifest_id, permanent_security_id FROM deadline ORDER BY scheduled_at`);
	const alarms = await sql.query(`SELECT code, component, status, blocks_new_admission, safe_details, last_seen::text FROM ops_alarm ORDER BY last_seen DESC`);
	const ctrl = await sql.query(`SELECT admission_paused, pause_reason FROM operator_control WHERE sleeve = 'EARNINGS'`);
	const notes = await sql.query(`SELECT hypothesis, note FROM fire_rate_note ORDER BY event_seq DESC LIMIT 10`);
	const positions = await sql.query(`SELECT position_id, display_ticker, state, cas_token::text FROM "position" ORDER BY display_ticker`);
	const alpaca = await publicStatus();
	return wrap("adm-1", clock, {
		role,
		can_mutate: role === "OPERATOR",
		jobs,
		deadlines: deadlines.map((d) => ({
			kind: d.kind,
			scheduled_at: d.scheduled_at,
			applied_at: d.applied_at,
			overdue: d.applied_at == null && new Date(d.scheduled_at) <= new Date(clock),
			target: d.permanent_security_id ?? d.manifest_id
		})),
		alarms,
		admission_paused: ctrl[0]?.admission_paused ?? false,
		pause_reason: ctrl[0]?.pause_reason ?? null,
		fire_rate_notes: notes,
		positions,
		alpaca,
		ports: {
			security_master: "FIXTURE",
			calendar: "FIXTURE",
			earnings: "FIXTURE",
			quotes: alpaca.connected ? "ALPACA" : "FIXTURE",
			official_marks: "FIXTURE",
			live_broker: alpaca.connected ? alpaca.mode === "LIVE" ? "ALPACA_LIVE" : "ALPACA_PAPER" : "UNSUPPORTED",
			real_data_credentials: alpaca.connected ? "PRESENT" : "ABSENT"
		}
	});
}
async function getOrCreatePrincipal(userId, email) {
	const rows = await (await getSql()).query(`SELECT principal_id, role FROM desk_principal WHERE user_id = $1`, [userId]);
	if (rows.length) return rows[0];
	return {
		principal_id: userId,
		role: null
	};
}
async function claimRole(userId, email, role) {
	const sql = await getSql();
	const existing = await sql.query(`SELECT role FROM desk_principal WHERE user_id = $1`, [userId]);
	if (existing.length) return {
		role: existing[0].role,
		already: true
	};
	const pid = `usr-${userId.replace(/[^A-Za-z0-9:._-]/g, "").slice(0, 48) || "user"}`.slice(0, 64);
	await sql.query(`INSERT INTO desk_principal (principal_id, user_id, login_name, role, active, label_exposure_declared, created_at)
     VALUES ($1,$2,$3,$4,TRUE,$5,NOW())`, [
		pid,
		userId,
		email ?? userId,
		role,
		role === "REVIEWER"
	]);
	return {
		role,
		already: false
	};
}
async function roleOf(userId) {
	await ensureBootstrapped();
	const p = await getOrCreatePrincipal(userId, null);
	return {
		role: p.role,
		principal_id: p.principal_id
	};
}
function requireOperator(role) {
	if (role !== "OPERATOR") throw new DeskError("FORBIDDEN", "OPERATOR only", 403);
}
function requireRole(role) {
	if (!role) throw new DeskError("FORBIDDEN", "Assign a desk role first", 403);
}
var fetchMe_createServerFn_handler = createServerRpc({
	id: "fd703b3fa8cfa6fd331bd0f98a51caa9881d161381a9f593dd9bd2bdd7d5a8d2",
	name: "fetchMe",
	filename: "src/desk/server-fns.ts"
}, (opts) => fetchMe.__executeServer(opts));
var fetchMe = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(fetchMe_createServerFn_handler, async ({ context }) => {
	await ensureBootstrapped();
	const p = await getOrCreatePrincipal(context.userId, null);
	const alpaca = await publicStatus();
	return {
		userId: context.userId,
		role: p.role,
		principal_id: p.principal_id,
		alpaca: {
			connected: alpaca.connected,
			mode: alpaca.mode
		}
	};
});
var postClaimRole_createServerFn_handler = createServerRpc({
	id: "02050c1717afefe0bad01b26799797ed0386e01ff7cf0834d16272610d426438",
	name: "postClaimRole",
	filename: "src/desk/server-fns.ts"
}, (opts) => postClaimRole.__executeServer(opts));
var postClaimRole = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator(object({ role: _enum(["OPERATOR", "REVIEWER"]) })).handler(postClaimRole_createServerFn_handler, async ({ context, data }) => {
	return claimRole(context.userId, null, data.role);
});
var fetchHome_createServerFn_handler = createServerRpc({
	id: "8548084dff2eaed866b8bd8f5597815b4b141335ec3f8565d87dbd0b940274f7",
	name: "fetchHome",
	filename: "src/desk/server-fns.ts"
}, (opts) => fetchHome.__executeServer(opts));
var fetchHome = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(fetchHome_createServerFn_handler, async ({ context }) => {
	const { role } = await roleOf(context.userId);
	if (!role) return { needs_role: true };
	return homePayload(role);
});
var fetchEarnings_createServerFn_handler = createServerRpc({
	id: "302cd21071d07675a9fe2f991121a6bd7505d2187f2de3bd5b7e2d9c10aec98c",
	name: "fetchEarnings",
	filename: "src/desk/server-fns.ts"
}, (opts) => fetchEarnings.__executeServer(opts));
var fetchEarnings = createServerFn({ method: "GET" }).middleware([authMiddleware]).validator(object({ sessionDate: string().optional() })).handler(fetchEarnings_createServerFn_handler, async ({ context, data }) => {
	const { role } = await roleOf(context.userId);
	if (!role) return { needs_role: true };
	return earningsPayload(role, data.sessionDate);
});
var fetchPredictions_createServerFn_handler = createServerRpc({
	id: "e89f96a1aaf470a008ac1343d75c55829b73307e7963faab0a8abfefb69a2f68",
	name: "fetchPredictions",
	filename: "src/desk/server-fns.ts"
}, (opts) => fetchPredictions.__executeServer(opts));
var fetchPredictions = createServerFn({ method: "GET" }).middleware([authMiddleware]).validator(object({
	manifestId: string().optional(),
	sessionDate: string().optional()
})).handler(fetchPredictions_createServerFn_handler, async ({ context, data }) => {
	const { role } = await roleOf(context.userId);
	if (!role) return { needs_role: true };
	return predictionsPayload(role, data.manifestId, data.sessionDate);
});
var fetchResults_createServerFn_handler = createServerRpc({
	id: "46d21774d2022ef6e8ba437a49e034ea9ef9b8ddbf9cab590a419d7a37129b25",
	name: "fetchResults",
	filename: "src/desk/server-fns.ts"
}, (opts) => fetchResults.__executeServer(opts));
var fetchResults = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(fetchResults_createServerFn_handler, async ({ context }) => {
	const { role } = await roleOf(context.userId);
	if (!role) return { needs_role: true };
	return resultsPayload(role);
});
var fetchAdmin_createServerFn_handler = createServerRpc({
	id: "7bdda91b43a11abaa640ec18e32af75ce6ed700094a3e0b1c969f8e8a734f28c",
	name: "fetchAdmin",
	filename: "src/desk/server-fns.ts"
}, (opts) => fetchAdmin.__executeServer(opts));
var fetchAdmin = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(fetchAdmin_createServerFn_handler, async ({ context }) => {
	const { role } = await roleOf(context.userId);
	if (!role) return { needs_role: true };
	return adminPayload(role);
});
var postPause_createServerFn_handler = createServerRpc({
	id: "66edc67661ea9b37590dc086486fb98a675d106f07ce01e1c733f0f22b1115a1",
	name: "postPause",
	filename: "src/desk/server-fns.ts"
}, (opts) => postPause.__executeServer(opts));
var postPause = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator(object({ reason: string().min(1).max(500) })).handler(postPause_createServerFn_handler, async ({ context, data }) => {
	const { role, principal_id } = await roleOf(context.userId);
	requireOperator(role);
	return pauseAdmission(newId("cmd"), data.reason, principal_id);
});
var postResume_createServerFn_handler = createServerRpc({
	id: "4c38890dc6c7e11c8e2d3af02ae66fef0a9e00d3496bd2c84cb40165e6841225",
	name: "postResume",
	filename: "src/desk/server-fns.ts"
}, (opts) => postResume.__executeServer(opts));
var postResume = createServerFn({ method: "POST" }).middleware([authMiddleware]).handler(postResume_createServerFn_handler, async ({ context }) => {
	const { role, principal_id } = await roleOf(context.userId);
	requireOperator(role);
	return resumeAdmission(newId("cmd"), principal_id);
});
var postPrintKnowledge_createServerFn_handler = createServerRpc({
	id: "e8088e70f1bc8126bd1ed26ce4a1ef7bf42dc4a4a8c82dca1906c68fdd1d3901",
	name: "postPrintKnowledge",
	filename: "src/desk/server-fns.ts"
}, (opts) => postPrintKnowledge.__executeServer(opts));
var postPrintKnowledge = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator(object({
	eventKey: string(),
	securityId: string(),
	reason: string().min(1)
})).handler(postPrintKnowledge_createServerFn_handler, async ({ context, data }) => {
	const { role, principal_id } = await roleOf(context.userId);
	requireOperator(role);
	return recordPrintKnowledge(newId("cmd"), data, principal_id);
});
var postFireNote_createServerFn_handler = createServerRpc({
	id: "0778f55c3b44a03b07976243c027b7f33d87b071df3994f46757a30128059372",
	name: "postFireNote",
	filename: "src/desk/server-fns.ts"
}, (opts) => postFireNote.__executeServer(opts));
var postFireNote = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator(object({
	hypothesis: _enum([
		"IMPLEMENTATION_BUG",
		"COVERAGE_SHIFT",
		"REGIME_SHIFT"
	]),
	note: string().min(1).max(2e3)
})).handler(postFireNote_createServerFn_handler, async ({ context, data }) => {
	const { role, principal_id } = await roleOf(context.userId);
	requireOperator(role);
	return appendFireRateNote(newId("cmd"), {
		windowId: "win-2026q3",
		hypothesis: data.hypothesis,
		note: data.note
	}, principal_id);
});
var postRetryDeadlines_createServerFn_handler = createServerRpc({
	id: "c8865f430d4b6a90c408d2a4b37c869237574ade65061d953b1a991acf504f5f",
	name: "postRetryDeadlines",
	filename: "src/desk/server-fns.ts"
}, (opts) => postRetryDeadlines.__executeServer(opts));
var postRetryDeadlines = createServerFn({ method: "POST" }).middleware([authMiddleware]).handler(postRetryDeadlines_createServerFn_handler, async ({ context }) => {
	const { role } = await roleOf(context.userId);
	requireOperator(role);
	return applyDueDeadlines("svc-desk-writer");
});
var postVerifyFreeze_createServerFn_handler = createServerRpc({
	id: "100bcb74c9d60bb0150f88d982f760ac0d5ebc9d3eb3331322a7e0976da45bbd",
	name: "postVerifyFreeze",
	filename: "src/desk/server-fns.ts"
}, (opts) => postVerifyFreeze.__executeServer(opts));
var postVerifyFreeze = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator(object({
	manifestId: string(),
	securityId: string()
})).handler(postVerifyFreeze_createServerFn_handler, async ({ context, data }) => {
	await roleOf(context.userId);
	return freezeMember(newId("cmd"), data.manifestId, data.securityId, "svc-desk-writer");
});
var fetchAlpacaStatus_createServerFn_handler = createServerRpc({
	id: "e4d977053c3c1c28b27350892e9567f8e5001698c9329b1bcf251cfeca864e9b",
	name: "fetchAlpacaStatus",
	filename: "src/desk/server-fns.ts"
}, (opts) => fetchAlpacaStatus.__executeServer(opts));
var fetchAlpacaStatus = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(fetchAlpacaStatus_createServerFn_handler, async ({ context }) => {
	const { role } = await roleOf(context.userId);
	requireRole(role);
	return {
		role,
		can_mutate: role === "OPERATOR",
		status: await publicStatus()
	};
});
var postAlpacaCredentials_createServerFn_handler = createServerRpc({
	id: "ec552bd05083dfbf805065d74e812c1e37ea0ff091c9f3da49bda56f6e2cadc2",
	name: "postAlpacaCredentials",
	filename: "src/desk/server-fns.ts"
}, (opts) => postAlpacaCredentials.__executeServer(opts));
var postAlpacaCredentials = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator(object({
	apiKeyId: string().min(8).max(80),
	apiSecret: string().min(8).max(120),
	mode: _enum(["PAPER", "LIVE"]),
	confirmLive: boolean().optional()
})).handler(postAlpacaCredentials_createServerFn_handler, async ({ context, data }) => {
	const { role, principal_id } = await roleOf(context.userId);
	requireOperator(role);
	return saveCredentials({
		...data,
		actor: principal_id
	});
});
var postAlpacaDisconnect_createServerFn_handler = createServerRpc({
	id: "1749478d9901533f82125cfd7330b3c3e4965bc78e0eafb0f1f1e14e77bf8d84",
	name: "postAlpacaDisconnect",
	filename: "src/desk/server-fns.ts"
}, (opts) => postAlpacaDisconnect.__executeServer(opts));
var postAlpacaDisconnect = createServerFn({ method: "POST" }).middleware([authMiddleware]).handler(postAlpacaDisconnect_createServerFn_handler, async ({ context }) => {
	const { role } = await roleOf(context.userId);
	requireOperator(role);
	return disconnect();
});
var postAlpacaWatchlist_createServerFn_handler = createServerRpc({
	id: "5a6335b77a3f3a526ef924528aa843e0863950bf7425998027995179960f6ba3",
	name: "postAlpacaWatchlist",
	filename: "src/desk/server-fns.ts"
}, (opts) => postAlpacaWatchlist.__executeServer(opts));
var postAlpacaWatchlist = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator(object({ watchlist: array(string()).min(1).max(24) })).handler(postAlpacaWatchlist_createServerFn_handler, async ({ context, data }) => {
	const { role } = await roleOf(context.userId);
	requireOperator(role);
	return saveWatchlist(data.watchlist);
});
var fetchAlpacaDesk_createServerFn_handler = createServerRpc({
	id: "9b44e62414bb9b40b4225e82a5b9b7c3ff5ce72fd3125baecb07856c8c4603c1",
	name: "fetchAlpacaDesk",
	filename: "src/desk/server-fns.ts"
}, (opts) => fetchAlpacaDesk.__executeServer(opts));
var fetchAlpacaDesk = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(fetchAlpacaDesk_createServerFn_handler, async ({ context }) => {
	const { role } = await roleOf(context.userId);
	requireRole(role);
	const status = await publicStatus();
	if (!status.connected) return {
		role,
		can_mutate: role === "OPERATOR",
		status,
		connected: false
	};
	try {
		const [account, clock, positions, orders, quotes] = await Promise.all([
			getAccount(),
			getClock(),
			getPositions(),
			getOrders("open"),
			getSnapshots(status.watchlist)
		]);
		return {
			role,
			can_mutate: role === "OPERATOR",
			status,
			connected: true,
			account,
			clock,
			positions,
			orders,
			quotes
		};
	} catch (e) {
		return {
			role,
			can_mutate: role === "OPERATOR",
			status,
			connected: true,
			error: e instanceof Error ? e.message : "Alpaca request failed"
		};
	}
});
var fetchAlpacaOrders_createServerFn_handler = createServerRpc({
	id: "db16db049bd8330e8950c291bfa61bf46c50023c8949f953ea3f481eeaabb5c5",
	name: "fetchAlpacaOrders",
	filename: "src/desk/server-fns.ts"
}, (opts) => fetchAlpacaOrders.__executeServer(opts));
var fetchAlpacaOrders = createServerFn({ method: "GET" }).middleware([authMiddleware]).validator(object({ status: _enum([
	"open",
	"closed",
	"all"
]).optional() })).handler(fetchAlpacaOrders_createServerFn_handler, async ({ context, data }) => {
	const { role } = await roleOf(context.userId);
	requireRole(role);
	return { orders: await getOrders(data.status ?? "all") };
});
var postAlpacaOrder_createServerFn_handler = createServerRpc({
	id: "52a4069c010716827c8d0c774f15b2f9488d16e612ef4c025bd6ed9ea8f98bfd",
	name: "postAlpacaOrder",
	filename: "src/desk/server-fns.ts"
}, (opts) => postAlpacaOrder.__executeServer(opts));
var postAlpacaOrder = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator(object({
	symbol: string().min(1).max(10),
	side: _enum(["buy", "sell"]),
	type: _enum(["market", "limit"]),
	timeInForce: _enum([
		"day",
		"gtc",
		"ioc"
	]),
	qty: string().optional(),
	notional: string().optional(),
	limitPrice: string().optional(),
	extendedHours: boolean().optional(),
	confirmLive: boolean().optional()
})).handler(postAlpacaOrder_createServerFn_handler, async ({ context, data }) => {
	const { role, principal_id } = await roleOf(context.userId);
	requireOperator(role);
	return submitOrder({
		...data,
		actor: principal_id
	});
});
var postAlpacaCancel_createServerFn_handler = createServerRpc({
	id: "0ebfaa6dae895189bfd671bfa68b5e3ba4343720ce295d59205debdd7eafefca",
	name: "postAlpacaCancel",
	filename: "src/desk/server-fns.ts"
}, (opts) => postAlpacaCancel.__executeServer(opts));
var postAlpacaCancel = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator(object({ orderId: string().min(1).max(64) })).handler(postAlpacaCancel_createServerFn_handler, async ({ context, data }) => {
	const { role } = await roleOf(context.userId);
	requireOperator(role);
	return cancelOrder(data.orderId);
});
var postAlpacaClose_createServerFn_handler = createServerRpc({
	id: "6799f3fcc558d276aa66e54ff472f3ff931ea1a212855c44c5645b8dc34a9c6f",
	name: "postAlpacaClose",
	filename: "src/desk/server-fns.ts"
}, (opts) => postAlpacaClose.__executeServer(opts));
var postAlpacaClose = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator(object({ symbol: string().min(1).max(10) })).handler(postAlpacaClose_createServerFn_handler, async ({ context, data }) => {
	const { role } = await roleOf(context.userId);
	requireOperator(role);
	return closePosition(data.symbol);
});
//#endregion
export { fetchAdmin_createServerFn_handler, fetchAlpacaDesk_createServerFn_handler, fetchAlpacaOrders_createServerFn_handler, fetchAlpacaStatus_createServerFn_handler, fetchEarnings_createServerFn_handler, fetchHome_createServerFn_handler, fetchMe_createServerFn_handler, fetchPredictions_createServerFn_handler, fetchResults_createServerFn_handler, postAlpacaCancel_createServerFn_handler, postAlpacaClose_createServerFn_handler, postAlpacaCredentials_createServerFn_handler, postAlpacaDisconnect_createServerFn_handler, postAlpacaOrder_createServerFn_handler, postAlpacaWatchlist_createServerFn_handler, postClaimRole_createServerFn_handler, postFireNote_createServerFn_handler, postPause_createServerFn_handler, postPrintKnowledge_createServerFn_handler, postResume_createServerFn_handler, postRetryDeadlines_createServerFn_handler, postVerifyFreeze_createServerFn_handler };
