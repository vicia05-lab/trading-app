import { getSql } from "@/lib/db";
import { DeskError } from "./util";
import {
  closePosition,
  getClock,
  getDailyBars,
  getSnapshots,
  publicStatus,
  submitOrder,
} from "./alpaca";

const TICKET_DOLLARS = "5000.00";
const MAX_SLOTS = 3;
const FIXTURE_TICKERS = new Set(["ALFA", "BRAV", "CHRL", "DELT", "ECHO", "FOXT", "GOLF", "HOTL"]);

function venueTicker(raw: string): string | null {
  const s = raw.trim().toUpperCase().replace(/[^A-Z.]/g, "");
  if (!s || FIXTURE_TICKERS.has(s) || s.startsWith("SEC-")) return null;
  if (!/^[A-Z][A-Z.]{0,9}$/.test(s)) return null;
  return s;
}

export type AutoFill = {
  position_id: string;
  symbol: string;
  side: string;
  notional: string | null;
  status: string;
  alpaca_order_id: string | null;
  last_error: string | null;
  submitted_at: string | null;
};

async function ensureFillTable(): Promise<void> {
  const sql = await getSql();
  await sql.query(`
    CREATE TABLE IF NOT EXISTS alpaca_desk_fill (
      position_id text PRIMARY KEY,
      symbol text NOT NULL,
      side text NOT NULL,
      notional text,
      status text NOT NULL,
      client_order_id text,
      alpaca_order_id text,
      last_error text,
      submitted_at timestamptz,
      closed_at timestamptz
    )`);
  await sql.query(`
    CREATE TABLE IF NOT EXISTS alpaca_auto_cycle (
      singleton_key boolean PRIMARY KEY CHECK (singleton_key),
      last_run_at timestamptz,
      last_summary text
    )`);
  await sql.query(`INSERT INTO alpaca_auto_cycle (singleton_key) VALUES (TRUE) ON CONFLICT DO NOTHING`);
}

async function upsertFill(row: {
  positionId: string;
  symbol: string;
  side: string;
  notional?: string;
  status: string;
  orderId?: string | null;
  error?: string | null;
}): Promise<void> {
  const sql = await getSql();
  await sql.query(
    `INSERT INTO alpaca_desk_fill (position_id, symbol, side, notional, status, alpaca_order_id, last_error, submitted_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,NOW())
     ON CONFLICT (position_id) DO UPDATE SET
       symbol = EXCLUDED.symbol,
       side = EXCLUDED.side,
       notional = COALESCE(EXCLUDED.notional, alpaca_desk_fill.notional),
       status = EXCLUDED.status,
       alpaca_order_id = COALESCE(EXCLUDED.alpaca_order_id, alpaca_desk_fill.alpaca_order_id),
       last_error = EXCLUDED.last_error,
       submitted_at = COALESCE(alpaca_desk_fill.submitted_at, NOW())`,
    [row.positionId, row.symbol, row.side, row.notional ?? null, row.status, row.orderId ?? null, row.error ?? null],
  );
}

export async function sendEntry(args: { positionId: string; ticker: string; actor: string }): Promise<void> {
  await ensureFillTable();
  const status = await publicStatus();
  if (!status.connected) {
    await upsertFill({ positionId: args.positionId, symbol: args.ticker, side: "buy", status: "SKIPPED", error: "Alpaca not connected" });
    return;
  }
  if (status.mode === "LIVE") {
    await upsertFill({
      positionId: args.positionId,
      symbol: args.ticker,
      side: "buy",
      status: "BLOCKED_LIVE",
      error: "Auto-execution is paper-only",
    });
    return;
  }
  const sql = await getSql();
  const existing = await sql.query<{ status: string }>(
    `SELECT status FROM alpaca_desk_fill WHERE position_id = $1`,
    [args.positionId],
  );
  if (existing[0] && ["SUBMITTED", "FILLED", "CLOSED"].includes(existing[0].status)) return;

  const symbol = venueTicker(args.ticker);
  if (!symbol) {
    await upsertFill({
      positionId: args.positionId,
      symbol: args.ticker,
      side: "buy",
      status: "SKIPPED",
      error: "Fixture ticker is not an Alpaca symbol",
    });
    return;
  }

  try {
    const clock = await getClock();
    const open = clock.is_open === true || clock.is_open === "true";
    let rec: Record<string, string | boolean | null>;
    if (open) {
      rec = await submitOrder({
        symbol,
        side: "buy",
        type: "market",
        timeInForce: "day",
        notional: TICKET_DOLLARS,
        actor: args.actor,
      });
    } else {
      const snaps = await getSnapshots([symbol]);
      const last = snaps[0]?.last ?? snaps[0]?.ask ?? snaps[0]?.bid;
      if (!last) throw new DeskError("NO_QUOTE", "No last price to stage an off-hours entry", 422);
      rec = await submitOrder({
        symbol,
        side: "buy",
        type: "limit",
        timeInForce: "day",
        qty: qtyFromNotional(TICKET_DOLLARS, last),
        limitPrice: last,
        extendedHours: true,
        actor: args.actor,
      });
    }
    await upsertFill({
      positionId: args.positionId,
      symbol,
      side: "buy",
      notional: TICKET_DOLLARS,
      status: String(rec.status ?? "SUBMITTED").toUpperCase() === "FILLED" ? "FILLED" : "SUBMITTED",
      orderId: typeof rec.id === "string" ? rec.id : null,
    });
  } catch (e) {
    await upsertFill({
      positionId: args.positionId,
      symbol,
      side: "buy",
      notional: TICKET_DOLLARS,
      status: "ERROR",
      error: e instanceof Error ? e.message : "Alpaca entry failed",
    });
  }
}

export async function sendExit(args: { positionId: string; ticker: string; actor: string }): Promise<void> {
  await ensureFillTable();
  const status = await publicStatus();
  if (!status.connected || status.mode === "LIVE") return;
  const symbol = venueTicker(args.ticker);
  if (!symbol) return;
  try {
    const rec = await closePosition(symbol);
    const sql = await getSql();
    await sql.query(
      `UPDATE alpaca_desk_fill SET status = 'CLOSED', closed_at = NOW(), last_error = NULL,
        alpaca_order_id = COALESCE($2, alpaca_order_id)
       WHERE position_id = $1`,
      [args.positionId, typeof rec.id === "string" ? rec.id : null],
    );
  } catch (e) {
    await upsertFill({
      positionId: args.positionId,
      symbol,
      side: "sell",
      status: "EXIT_ERROR",
      error: e instanceof Error ? e.message : "Alpaca exit failed",
    });
  }
}

function qtyFromNotional(dollars: string, last: string): string {
  const d = Number(dollars);
  const p = Number(last);
  if (!(d > 0) || !(p > 0)) throw new DeskError("INVALID_SIZE", "Cannot size off-hours order", 422);
  const q = Math.floor((d / p) * 10000) / 10000;
  if (q < 0.0001) throw new DeskError("INVALID_SIZE", "Notional too small for last price", 422);
  return q.toFixed(4);
}

export async function listFills(): Promise<AutoFill[]> {
  await ensureFillTable();
  const sql = await getSql();
  return sql.query<AutoFill>(
    `SELECT position_id, symbol, side, notional, status, alpaca_order_id, last_error, submitted_at::text
     FROM alpaca_desk_fill ORDER BY submitted_at DESC NULLS LAST LIMIT 40`,
  );
}

async function setJob(name: string, status: "IDLE" | "RUNNING" | "FAILED", err?: string): Promise<void> {
  try {
    const sql = await getSql();
    if (status === "RUNNING") {
      await sql.query(
        `UPDATE job_state SET status = 'RUNNING', last_started_at = NOW(), safe_error_code = NULL WHERE job_name = $1`,
        [name],
      );
    } else {
      await sql.query(
        `UPDATE job_state SET status = $2, last_completed_at = NOW(), safe_error_code = $3 WHERE job_name = $1`,
        [name, status, err ?? null],
      );
    }
  } catch {
    /* job_state is observational */
  }
}

function ret(bars: Array<{ c: number }>, days: number): number | null {
  if (bars.length < days + 1) return null;
  const now = bars[bars.length - 1].c;
  const then = bars[bars.length - 1 - days].c;
  if (!(now > 0) || !(then > 0)) return null;
  return now / then - 1;
}

function rangeFrac(bars: Array<{ h: number; l: number; c: number }>, days: number): number | null {
  const slice = bars.slice(-days);
  if (slice.length < 5) return null;
  let hi = -Infinity;
  let lo = Infinity;
  for (const b of slice) {
    if (b.h > hi) hi = b.h;
    if (b.l < lo) lo = b.l;
  }
  const last = slice[slice.length - 1].c;
  if (!(last > 0) || !(hi > 0) || !(lo > 0)) return null;
  return (hi - lo) / last;
}

/** Live paper sleeve: pullback vs SPY on a 63-day uptrend, 4–25% 20-day range, $5+ last. Max 3 × $5,000. */
async function liveWatchlistCycle(actor: string): Promise<{ scanned: number; admitted: string[]; skipped: string[] }> {
  const st = await publicStatus();
  const universe = (st.watchlist.length ? st.watchlist : ["SPY", "QQQ", "NVDA", "AAPL", "MSFT"]).filter(
    (s) => venueTicker(s) && s !== "SPY",
  );
  const scanned = universe.length;
  const admitted: string[] = [];
  const skipped: string[] = [];
  if (!universe.length) return { scanned, admitted, skipped };

  const sql = await getSql();
  const open = await sql.query<{ c: number }>(
    `SELECT COUNT(*)::int AS c FROM alpaca_desk_fill WHERE status IN ('SUBMITTED','FILLED')`,
  );
  let slots = Math.max(0, MAX_SLOTS - (open[0]?.c ?? 0));
  if (slots <= 0) {
    skipped.push("capacity");
    return { scanned, admitted, skipped };
  }

  const symbols = [...new Set([...universe, "SPY"])];
  const snaps = await getSnapshots(symbols);
  const bars = await getDailyBars(symbols, 70);
  const spyBars = bars.SPY ?? [];
  const spy5 = ret(spyBars, 5);
  const spy63 = ret(spyBars, 63);
  const { loadActiveThresholds } = await import("./learn");
  const band = await loadActiveThresholds();
  const minMove = Number(band.implied_move_gte);
  const maxMove = Number(band.implied_move_lte);
  const rel5Need = Number(band.rel5_lt);
  const rel63Need = Number(band.rel63_gt);

  for (const symbol of universe) {
    if (slots <= 0) break;
    const existing = await sql.query<{ status: string }>(
      `SELECT status FROM alpaca_desk_fill WHERE position_id = $1`,
      [`live:${symbol}`],
    );
    if (existing[0] && ["SUBMITTED", "FILLED"].includes(existing[0].status)) {
      skipped.push(`${symbol}:already`);
      continue;
    }
    const snap = snaps.find((s) => s.symbol === symbol);
    const last = Number(snap?.last ?? 0);
    const bid = Number(snap?.bid ?? 0);
    const ask = Number(snap?.ask ?? 0);
    if (!(last >= 5)) {
      skipped.push(`${symbol}:price`);
      continue;
    }
    if (bid > 0 && ask > 0 && (ask - bid) / ((ask + bid) / 2) > 0.01) {
      skipped.push(`${symbol}:spread`);
      continue;
    }
    const series = bars[symbol] ?? [];
    const r5 = ret(series, 5);
    const r63 = ret(series, 63);
    const rng = rangeFrac(series, 20);
    if (r5 == null || r63 == null || spy5 == null || spy63 == null || rng == null) {
      skipped.push(`${symbol}:bars`);
      continue;
    }
    const rel5 = r5 - spy5;
    const rel63 = r63 - spy63;
    if (!(rel5 < rel5Need && rel63 > rel63Need && rng >= minMove && rng <= maxMove)) {
      skipped.push(`${symbol}:stand-down`);
      continue;
    }
    await sendEntry({ positionId: `live:${symbol}`, ticker: symbol, actor });
    admitted.push(symbol);
    slots -= 1;
  }
  return { scanned, admitted, skipped };
}

export async function syncBook(actor: string): Promise<{ entries: number; exits: number; errors: string[] }> {
  await ensureFillTable();
  const sql = await getSql();
  const errors: string[] = [];
  let entries = 0;
  let exits = 0;

  const openPos = await sql.query<{ position_id: string; display_ticker: string; state: string }>(
    `SELECT position_id, display_ticker, state FROM "position"
     WHERE state IN ('COMMITTED_IRREVOCABLE','FILLED','IMPAIRED_EXIT')`,
  );
  for (const p of openPos) {
    const fill = await sql.query<{ status: string }>(`SELECT status FROM alpaca_desk_fill WHERE position_id = $1`, [
      p.position_id,
    ]);
    if (!fill[0] || ["ERROR", "SKIPPED", "BLOCKED_LIVE"].includes(fill[0].status)) {
      await sendEntry({ positionId: p.position_id, ticker: p.display_ticker, actor });
      entries += 1;
    }
  }

  const done = await sql.query<{ position_id: string; display_ticker: string }>(
    `SELECT p.position_id, p.display_ticker FROM "position" p
     JOIN alpaca_desk_fill f ON f.position_id = p.position_id
     WHERE p.state IN ('FLAT','CLOSED','NO_FILL') AND f.status IN ('SUBMITTED','FILLED','EXIT_ERROR')`,
  );
  for (const p of done) {
    await sendExit({ positionId: p.position_id, ticker: p.display_ticker, actor });
    exits += 1;
  }

  return { entries, exits, errors };
}

export async function runAutoCycle(actor: string): Promise<{
  connected: boolean;
  mode: string | null;
  frozen: number;
  entries: number;
  exits: number;
  summary: string;
  fills: AutoFill[];
}> {
  await ensureFillTable();
  const st = await publicStatus();
  if (!st.connected) {
    const summary = "No Alpaca keys. Paste them on Admin first.";
    await recordCycle(summary);
    return { connected: false, mode: null, frozen: 0, entries: 0, exits: 0, summary, fills: await listFills() };
  }
  if (st.mode === "LIVE") {
    const summary = "Live mode is connected. Auto-execution stays off — paper only.";
    await recordCycle(summary);
    return { connected: true, mode: "LIVE", frozen: 0, entries: 0, exits: 0, summary, fills: await listFills() };
  }

  await setJob("capture-cycle", "RUNNING");
  await setJob("ordered-freeze", "RUNNING");
  let liveAdmitted: string[] = [];
  let liveSkipped = 0;
  try {
    const live = await liveWatchlistCycle(actor);
    liveAdmitted = live.admitted;
    liveSkipped = live.skipped.length;
    await setJob("capture-cycle", "IDLE");
    await setJob("ordered-freeze", "IDLE");
  } catch (e) {
    await setJob("capture-cycle", "FAILED", e instanceof Error ? e.message.slice(0, 80) : "capture failed");
    await setJob("ordered-freeze", "FAILED");
  }

  await setJob("due-deadlines", "RUNNING");
  try {
    const { applyDueDeadlines } = await import("./lifecycle");
    await applyDueDeadlines(actor);
    await setJob("due-deadlines", "IDLE");
  } catch (e) {
    await setJob("due-deadlines", "FAILED", e instanceof Error ? e.message.slice(0, 80) : "deadlines failed");
  }

  const book = await syncBook(actor);
  const summary = liveAdmitted.length
    ? `Paper auto-run: bought ${liveAdmitted.join(", ")} ($5,000 each). ${liveSkipped} watchlist names stood down. Book sync entries ${book.entries}, exits ${book.exits}.`
    : `Paper auto-run: no new tickets (${liveSkipped} watchlist names stood down). Book sync entries ${book.entries}, exits ${book.exits}.`;
  await recordCycle(summary);
  return {
    connected: true,
    mode: "PAPER",
    frozen: liveAdmitted.length,
    entries: book.entries + liveAdmitted.length,
    exits: book.exits,
    summary,
    fills: await listFills(),
  };
}

async function recordCycle(summary: string): Promise<void> {
  const sql = await getSql();
  await sql.query(`UPDATE alpaca_auto_cycle SET last_run_at = NOW(), last_summary = $1 WHERE singleton_key = TRUE`, [
    summary,
  ]);
}

export async function autoStatus(): Promise<{
  connected: boolean;
  mode: string | null;
  last_run_at: string | null;
  last_summary: string | null;
  fills: AutoFill[];
}> {
  await ensureFillTable();
  const st = await publicStatus();
  const sql = await getSql();
  const cyc = await sql.query<{ last_run_at: string | null; last_summary: string | null }>(
    `SELECT last_run_at::text, last_summary FROM alpaca_auto_cycle WHERE singleton_key = TRUE`,
  );
  return {
    connected: st.connected,
    mode: st.mode,
    last_run_at: cyc[0]?.last_run_at ?? null,
    last_summary: cyc[0]?.last_summary ?? null,
    fills: await listFills(),
  };
}
