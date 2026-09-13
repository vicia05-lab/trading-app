import { getSql } from "@/lib/db";
import { DeskError } from "./util";
import {
  closePosition,
  getClock,
  getSnapshots,
  publicStatus,
  submitOrder,
} from "./alpaca";

const TICKET_DOLLARS = "5000.00";

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

  const symbol = args.ticker.replace(/[^A-Za-z.]/g, "").toUpperCase();
  if (!symbol) {
    await upsertFill({ positionId: args.positionId, symbol: args.ticker, side: "buy", status: "ERROR", error: "No ticker" });
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
  const symbol = args.ticker.replace(/[^A-Za-z.]/g, "").toUpperCase();
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

  let frozen = 0;
  try {
    const { freezeMember } = await import("./commands");
    const { newId } = await import("./util");
    const sql = await getSql();
    const man = await sql.query<{ manifest_id: string; freeze_resolution: string }>(
      `SELECT manifest_id, freeze_resolution FROM manifest ORDER BY session_date DESC LIMIT 1`,
    );
    if (man[0]?.freeze_resolution === "OPEN") {
      const members = await sql.query<{ permanent_security_id: string }>(
        `SELECT mm.permanent_security_id FROM manifest_member mm
         LEFT JOIN "freeze" f ON f.manifest_id = mm.manifest_id AND f.permanent_security_id = mm.permanent_security_id
         WHERE mm.manifest_id = $1 AND f.freeze_id IS NULL`,
        [man[0].manifest_id],
      );
      for (const m of members) {
        try {
          await freezeMember(newId("cmd"), man[0].manifest_id, m.permanent_security_id, actor);
          frozen += 1;
        } catch {
          /* cutoff or incomplete card — keep cycling the rest */
        }
      }
    }
  } catch {
    /* freeze pass is optional when the book already has committed names */
  }

  try {
    const { applyDueDeadlines } = await import("./lifecycle");
    await applyDueDeadlines(actor);
  } catch {
    /* marks may not be due */
  }

  const book = await syncBook(actor);
  const summary = `Paper auto-run: froze ${frozen}, sent ${book.entries} entries, ${book.exits} exits.`;
  await recordCycle(summary);
  return {
    connected: true,
    mode: "PAPER",
    frozen,
    entries: book.entries,
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
