import { useEffect, useRef, useState } from "react";
import { Badge, Err, Panel } from "@/components/app-shell";
import { fetchAutoStatus, fetchSleeveScheduler, postSleeveScheduler, runAutoCycle, runIntelligentCycle } from "@/desk/server-fns";

type Scheduler = Awaited<ReturnType<typeof fetchSleeveScheduler>>;
type Auto = Awaited<ReturnType<typeof fetchAutoStatus>>;

/** Viewing this panel only reads status. Execution always requires an Operator action. */
export function PaperAutomation({ canMutate, paperReady, onChanged }: {
  canMutate: boolean;
  paperReady: boolean;
  onChanged: () => Promise<void>;
}) {
  const [scheduler, setScheduler] = useState<Scheduler | null>(null);
  const [auto, setAuto] = useState<Auto | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const mounted = useRef(true);
  const actionPending = useRef(false);

  useEffect(() => {
    mounted.current = true;
    let disposed = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const poll = async () => {
      try {
        if (!actionPending.current) {
          const [next, book] = await Promise.all([fetchSleeveScheduler(), fetchAutoStatus()]);
          if (!disposed && !actionPending.current) { setScheduler(next); setAuto(book); }
        }
      } catch (e) {
        if (!disposed) setError(e instanceof Error ? e.message : "Could not load automation status");
      } finally {
        if (!disposed) timer = setTimeout(() => { void poll(); }, 15000);
      }
    };
    void poll();
    return () => { disposed = true; mounted.current = false; if (timer) clearTimeout(timer); };
  }, []);

  async function act(kind: "toggle" | "intelligent" | "auto") {
    if (!canMutate || actionPending.current) return;
    const disabling = kind === "toggle" && scheduler?.enabled === true;
    if (!disabling && !paperReady) return;
    actionPending.current = true;
    setBusy(true); setError(null); setNotice(null);
    try {
      if (kind === "toggle") {
        const next = await postSleeveScheduler({ data: { enabled: !scheduler?.enabled } });
        if (mounted.current) setScheduler(next);
      } else {
        const result = kind === "intelligent" ? await runIntelligentCycle() : await runAutoCycle();
        if (mounted.current) setNotice(result.summary);
      }
      const [next, book] = await Promise.all([fetchSleeveScheduler(), fetchAutoStatus()]);
      if (mounted.current) { setScheduler(next); setAuto(book); }
      await onChanged();
    } catch (e) {
      if (mounted.current) setError(e instanceof Error ? e.message : "Automation action failed");
    } finally {
      actionPending.current = false;
      if (mounted.current) setBusy(false);
    }
  }

  const button = "min-h-11 rounded-sm border border-border px-3 text-sm disabled:opacity-50";
  return (
    <Panel title="Paper automation" aside="Grok GitHub app only">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={scheduler?.enabled ? "success" : "warn"}>{!scheduler ? "Loading status" : scheduler.enabled ? "Scheduler enabled" : "Scheduler disabled"}</Badge>
        <span className="text-sm text-muted">Every {scheduler ? Math.round(scheduler.interval_sec / 60) : 5} minutes while the host is running.</span>
        {scheduler?.executing ? <Badge tone="warn">Cycle in progress</Badge> : null}
      </div>
      {!paperReady ? <p className="mt-3 text-sm text-muted">Connect and verify Alpaca PAPER keys on this Trade page before enabling execution. Market-data-only keys are not order credentials.</p> : null}
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" className={button} disabled={!canMutate || busy || !scheduler || (!scheduler.enabled && !paperReady)} onClick={() => void act("toggle")}>
          {scheduler?.enabled ? "Disable scheduler" : "Enable paper scheduler"}
        </button>
        <button type="button" className={button} disabled={!canMutate || busy || !paperReady || Boolean(scheduler?.executing)} onClick={() => void act("intelligent")}>Run intelligent paper cycle</button>
        <button type="button" className={button} disabled={!canMutate || busy || !paperReady || Boolean(scheduler?.executing)} onClick={() => void act("auto")}>Run auto / reconcile book</button>
      </div>
      <p className="mt-3 text-xs text-muted">Disabling stops future scheduled cycles; an in-progress cycle and existing broker orders may still finish. A submitted order is not a confirmed fill.</p>
      <div className="mt-4 space-y-2 text-sm" aria-live="polite">
        <p>Last scheduled check: <span className="font-mono">{scheduler?.last_run_at ?? "No run recorded"}</span></p>
        <p>{scheduler?.last_summary ?? "No scheduler result recorded."}</p>
        {scheduler?.last_error ? <Err>{scheduler.last_error}</Err> : null}
        {notice ? <p>{notice}</p> : null}
        {error ? <Err>{error}</Err> : null}
      </div>
      {auto?.fills.length ? (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[32rem] text-left text-sm">
            <caption className="mb-2 text-left text-muted">Latest auto-book receipts</caption>
            <thead><tr><th className="py-2">Symbol</th><th>Status</th><th>Entry / exit order</th><th>Attention</th></tr></thead>
            <tbody>{auto.fills.slice(0, 10).map((fill) => <tr key={fill.position_id} className="border-t border-border">
              <td className="py-2 font-mono">{fill.symbol}</td><td>{fill.status}</td>
              <td className="max-w-48 break-all font-mono text-xs">{fill.alpaca_order_id ?? "No entry receipt"}{fill.exit_order_id ? <><br />Exit: {fill.exit_order_id}</> : null}</td>
              <td className="max-w-60 break-words text-xs">{fill.last_error ?? "None recorded"}</td>
            </tr>)}</tbody>
          </table>
        </div>
      ) : null}
    </Panel>
  );
}
