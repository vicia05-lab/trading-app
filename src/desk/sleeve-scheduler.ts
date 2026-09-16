import { getSql } from "@/lib/db";
import { getClock, publicStatus } from "./alpaca";
import { runIntelligentPaperCycle } from "./paper-intellect";
import { runAutoCycle } from "./auto-trade";

const INTERVAL_MS = 5 * 60 * 1000;
const ACTOR = "svc-sleeve-scheduler";

export type SchedulerStatus = {
  enabled: boolean;
  interval_sec: number;
  last_run_at: string | null;
  last_summary: string | null;
  running: boolean;
};

async function ensureTable(): Promise<void> {
  const sql = await getSql();
  await sql.query(`
    CREATE TABLE IF NOT EXISTS sleeve_scheduler (
      singleton_key boolean PRIMARY KEY DEFAULT TRUE,
      enabled boolean NOT NULL DEFAULT FALSE,
      interval_sec integer NOT NULL DEFAULT 300,
      last_run_at timestamptz,
      last_summary text
    )`);
  await sql.query(
    `INSERT INTO sleeve_scheduler (singleton_key, enabled, interval_sec)
     VALUES (TRUE, FALSE, 300) ON CONFLICT (singleton_key) DO NOTHING`,
  );
}

export async function schedulerStatus(): Promise<SchedulerStatus> {
  await ensureTable();
  const sql = await getSql();
  const rows = await sql.query<{
    enabled: boolean;
    interval_sec: number;
    last_run_at: string | null;
    last_summary: string | null;
  }>(`SELECT enabled, interval_sec, last_run_at::text, last_summary FROM sleeve_scheduler WHERE singleton_key = TRUE`);
  const r = rows[0];
  return {
    enabled: r?.enabled ?? false,
    interval_sec: r?.interval_sec ?? 300,
    last_run_at: r?.last_run_at ?? null,
    last_summary: r?.last_summary ?? null,
    running: ticking,
  };
}

export async function setSchedulerEnabled(on: boolean): Promise<SchedulerStatus> {
  await ensureTable();
  const sql = await getSql();
  await sql.query(`UPDATE sleeve_scheduler SET enabled = $1 WHERE singleton_key = TRUE`, [on]);
  if (on) startSleeveScheduler();
  return schedulerStatus();
}

async function tick(): Promise<void> {
  const st = await schedulerStatus();
  if (!st.enabled) return;
  const venue = await publicStatus();
  if (!venue.connected || venue.mode === "LIVE") {
    await note("Scheduler idle: paper keys missing or LIVE blocked.");
    return;
  }
  const clock = await getClock();
  const open = clock.is_open === true || clock.is_open === "true";
  if (!open) {
    await note("Scheduler idle: venue clock closed. App stays up; no market orders.");
    return;
  }
  const intel = await runIntelligentPaperCycle({ symbols: venue.watchlist, actor: ACTOR });
  try {
    const auto = await runAutoCycle(ACTOR);
    await note(`${intel.summary} Auto: ${auto.summary}`);
  } catch (e) {
    await note(`${intel.summary} Auto failed: ${e instanceof Error ? e.message : "auto error"}`);
  }
}

async function note(summary: string): Promise<void> {
  const sql = await getSql();
  await sql.query(
    `UPDATE sleeve_scheduler SET last_run_at = NOW(), last_summary = $1 WHERE singleton_key = TRUE`,
    [summary.slice(0, 400)],
  );
}

let ticking = false;
let handle: ReturnType<typeof setInterval> | null = null;

export function startSleeveScheduler(): void {
  if (handle) return;
  ticking = true;
  handle = setInterval(() => {
    void tick().catch(() => undefined);
  }, INTERVAL_MS);
  void tick().catch(() => undefined);
}
