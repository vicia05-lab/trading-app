/** Process-local serial timer. This is not a durable/distributed scheduler. */
export function createSerialScheduler(options: {
  run: () => Promise<void>;
  reportError: (error: unknown) => Promise<void>;
  intervalMs: number;
  setTimer?: (callback: () => void, milliseconds: number) => ReturnType<typeof setTimeout>;
  clearTimer?: (timer: ReturnType<typeof setTimeout>) => void;
}) {
  if (!Number.isFinite(options.intervalMs) || options.intervalMs < 1) throw new Error("Invalid scheduler interval");
  const setTimer = options.setTimer ?? setTimeout;
  const clearTimer = options.clearTimer ?? clearTimeout;
  let active = false;
  let inFlight: Promise<void> | null = null;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let lastError: string | null = null;

  async function runOnce(): Promise<void> {
    if (inFlight) return inFlight;
    // Queue the body so inFlight is assigned even if the callback throws synchronously.
    inFlight = Promise.resolve().then(options.run).catch(async (error: unknown) => {
      lastError = error instanceof Error ? error.name : "SchedulerError";
      try {
        await options.reportError(error);
      } catch {
        lastError = "SchedulerErrorReportingFailed";
        console.error("[Trading App] Scheduler failed and could not persist the failure.");
      }
    }).finally(() => {
      inFlight = null;
      if (active) {
        timer = setTimer(() => {
          timer = null;
          if (active) void runOnce();
        }, options.intervalMs);
        timer.unref?.();
      }
    });
    return inFlight;
  }

  return {
    status: () => ({ running: active, executing: inFlight !== null, last_error: lastError }),
    start() {
      if (active) return;
      active = true;
      lastError = null;
      void runOnce();
    },
    stop() {
      active = false;
      if (timer !== null) clearTimer(timer);
      timer = null;
      // Already-submitted orders are irrevocable here; stopping prevents future ticks.
    },
    async settled() { await inFlight; },
  };
}
