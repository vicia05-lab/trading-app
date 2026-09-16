import { createSerialScheduler } from "./sleeve-scheduler-core";
import { DeskError } from "./util";
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
  executing: boolean;
  last_error: string | null;
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
    ...worker().status(),
  };
}

export async function setSchedulerEnabled(on: boolean): Promise<SchedulerStatus> {
  await ensureTable();
  const sql = await getSql();
  await sql.query(`UPDATE sleeve_scheduler SET enabled = $1 WHERE singleton_key = TRUE`, [on]);
  if (on) startSleeveScheduler();
  else stopSleeveScheduler();
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

// One timer per process even when Vite hot-reloads the module. This does not
// claim cross-process locking or survival of serverless suspension/restarts.
const shared = globalThis as typeof globalThis & {
  __grokSleeveSchedulerV2?: ReturnType<typeof createSerialScheduler>;
};
function worker() {
  return shared.__grokSleeveSchedulerV2 ??= createSerialScheduler({
    intervalMs: INTERVAL_MS,
    run: tick,
    reportError: async (error) => {
      const code = error instanceof DeskError ? error.code : "UNEXPECTED_ERROR";
      console.error(`[Trading App] Sleeve scheduler failed: ${code}`);
      await note(`Scheduler failed: ${code}. No success recorded for this run.`);
    },
  });
}
export function startSleeveScheduler(): void { worker().start(); }
export function stopSleeveScheduler(): void { worker().stop(); }
