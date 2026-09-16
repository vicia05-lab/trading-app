import { randomUUID } from "node:crypto";
import { createSerialScheduler } from "./sleeve-scheduler-core";
import { DeskError } from "./util";
import { getSql } from "@/lib/db";
import { getClock, publicStatus } from "./alpaca";
import { runIntelligentPaperCycle } from "./paper-intellect";
import { runAutoCycle } from "./auto-trade";

const INTERVAL_MS = 5 * 60 * 1000;
const LEASE_SECONDS = 10 * 60;
const ACTOR = "svc-sleeve-scheduler";
const INSTANCE_ID = `sched-${randomUUID()}`;
const DEFAULT_ENABLED = process.env.SLEEVE_SCHEDULER_DEFAULT_ON === "1";

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
      last_summary text,
      lease_owner text,
      lease_until timestamptz
    )`);
  await sql.query(`ALTER TABLE sleeve_scheduler ADD COLUMN IF NOT EXISTS lease_owner text`);
  await sql.query(`ALTER TABLE sleeve_scheduler ADD COLUMN IF NOT EXISTS lease_until timestamptz`);
  await sql.query(
    `INSERT INTO sleeve_scheduler (singleton_key, enabled, interval_sec)
     VALUES (TRUE, $1, 300) ON CONFLICT (singleton_key) DO NOTHING`,
    [DEFAULT_ENABLED],
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
    enabled: r?.enabled ?? DEFAULT_ENABLED,
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

export async function restoreSleeveScheduler(): Promise<SchedulerStatus> {
  const status = await schedulerStatus();
  if (status.enabled) startSleeveScheduler();
  else stopSleeveScheduler();
  return schedulerStatus();
}

async function acquireLease(): Promise<boolean> {
  await ensureTable();
  const sql = await getSql();
  const rows = await sql.query<{ singleton_key: boolean }>(
    `UPDATE sleeve_scheduler
        SET lease_owner = $1,
            lease_until = NOW() + ($2 * INTERVAL '1 second')
      WHERE singleton_key = TRUE
        AND enabled = TRUE
        AND (lease_until IS NULL OR lease_until < NOW() OR lease_owner = $1)
      RETURNING singleton_key`,
    [INSTANCE_ID, LEASE_SECONDS],
  );
  return rows.length === 1;
}

async function releaseLease(): Promise<void> {
  const sql = await getSql();
  await sql.query(
    `UPDATE sleeve_scheduler
        SET lease_owner = NULL, lease_until = NULL
      WHERE singleton_key = TRUE AND lease_owner = $1`,
    [INSTANCE_ID],
  );
}

async function tick(): Promise<void> {
  const st = await schedulerStatus();
  if (!st.enabled) return;
  if (!(await acquireLease())) {
    await note("Scheduler idle: another app instance owns this cycle.");
    return;
  }
  try {
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
  } finally {
    await releaseLease();
  }
}

async function note(summary: string): Promise<void> {
  const sql = await getSql();
  await sql.query(
    `UPDATE sleeve_scheduler SET last_run_at = NOW(), last_summary = $1 WHERE singleton_key = TRUE`,
    [summary.slice(0, 400)],
  );
}

const shared = globalThis as typeof globalThis & {
  __grokSleeveSchedulerV3?: ReturnType<typeof createSerialScheduler>;
};
function worker() {
  return shared.__grokSleeveSchedulerV3 ??= createSerialScheduler({
    intervalMs: INTERVAL_MS,
    run: tick,
    reportError: async (error) => {
      const code = error instanceof DeskError ? error.code : "UNEXPECTED_ERROR";
      console.error(`[Trading App] Sleeve scheduler failed: ${code}`);
      await note(`Scheduler failed: ${code}. No success recorded for this run.`);
      try {
        await releaseLease();
      } catch {
        console.error("[Trading App] Scheduler lease cleanup failed.");
      }
    },
  });
}
export function startSleeveScheduler(): void { worker().start(); }
export function stopSleeveScheduler(): void { worker().stop(); }
