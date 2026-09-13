import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { DeskShell, Empty, Err, Panel, Stat } from "@/components/desk-shell";
import { AlpacaKeyInsert } from "@/components/alpaca-keys";
import { fetchHome, runAutoCycle } from "@/desk/server-fns";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return (
    <DeskShell>
      <HomeLoader />
    </DeskShell>
  );
}

function HomeLoader() {
  const [data, setData] = useState<Awaited<ReturnType<typeof fetchHome>> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetchHome()
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : "Could not load home"));
  }, []);

  if (error) return <Err>{error}</Err>;
  if (!data) return <Empty>Loading session…</Empty>;
  if ("needs_role" in data) return <Empty>Assign a desk role to continue.</Empty>;
  return <HomeBody data={data} />;
}

function HomeBody({ data }: { data: Exclude<Awaited<ReturnType<typeof fetchHome>>, { needs_role: true }> }) {
  const d = data.data;
  const s = d.latest_session;
  const [autoNote, setAutoNote] = useState<string | null>(null);
  const [autoBusy, setAutoBusy] = useState(false);
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-medium tracking-tight">Desk</h1>
        <p className="mt-1 text-sm text-muted">
          As of {data.as_of} · window {d.window_id} · rule {d.rule_id}
        </p>
      </div>
      <AlpacaKeyInsert />
      <Panel title="Auto-execution" aside={d.alpaca?.connected ? (d.alpaca.mode === "LIVE" ? "LIVE OFF" : "PAPER ON") : "needs keys"}>
        <p className="mb-3 text-sm text-muted">
          Admitted PREDICT names send a $5,000 Alpaca paper ticket. This does not fire in live mode.
        </p>
        {autoNote ? <p className="mb-3 text-sm text-muted">{autoNote}</p> : null}
        <button
          type="button"
          disabled={autoBusy || !d.alpaca?.connected}
          className="min-h-11 rounded-md bg-primary px-4 text-sm text-primary-fg disabled:opacity-40"
          onClick={() => {
            setAutoBusy(true);
            void runAutoCycle()
              .then((r) => setAutoNote(r.summary))
              .catch((e) => setAutoNote(e instanceof Error ? e.message : "Auto-desk failed"))
              .finally(() => setAutoBusy(false));
          }}
        >
          {autoBusy ? "Running…" : "Run auto-desk now"}
        </button>
      </Panel>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Panel title="Cohort">
          <Stat label="Sealed" value={s?.sealed_member_count ?? "—"} />
          <div className="mt-3">
            <Stat label="Frozen" value={s?.frozen_count ?? "—"} hint={s?.freeze_resolution} />
          </div>
        </Panel>
        <Panel title="Coverage">
          <Stat label="Complete cards" value={s?.complete_frozen_cards ?? "—"} />
          <div className="mt-3">
            <Stat label="Research closed" value={s?.research_closed ? "yes" : "no"} />
          </div>
        </Panel>
        <Panel title="Reserved capital">
          <Stat label="Entry notional" value={d.reserved_notional} hint={`${d.reserved_count} of 3 slots`} />
          <div className="mt-3">
            <Stat label="Impaired" value={d.impaired_count} hint={`${d.nonclosed_positions} nonclosed`} />
          </div>
        </Panel>
        <Panel title="Admission">
          <Stat label="Pause" value={d.admission_paused ? "ON" : "off"} hint={d.pause_reason ?? "New tickets only"} />
          <div className="mt-3">
            <Stat label="Overdue jobs" value={d.overdue_deadlines} />
          </div>
        </Panel>
      </div>
      <Panel title="Sessions" aside="research complete ≠ book clear">
        {d.sessions.length === 0 ? (
          <Empty>No sealed sessions.</Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[32rem] text-left text-sm">
              <thead className="text-[11px] uppercase tracking-wider text-muted">
                <tr>
                  <th className="pb-2 font-medium">Session</th>
                  <th className="pb-2 font-medium">Manifest</th>
                  <th className="pb-2 font-medium">N</th>
                  <th className="pb-2 font-medium">Resolution</th>
                </tr>
              </thead>
              <tbody className="font-mono text-xs">
                {d.sessions.map((row) => (
                  <tr key={row.manifest_id} className="border-t border-border">
                    <td className="py-2">
                      <Link className="underline-offset-4 hover:underline" to="/earnings" search={{ session: row.session_date }}>
                        {row.session_date}
                      </Link>
                    </td>
                    <td className="py-2 text-muted">{row.manifest_id}</td>
                    <td className="py-2">{row.sealed_member_count}</td>
                    <td className="py-2">{row.freeze_resolution}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
      {d.reviewer_book ? (
        <Panel title="Priced book (reviewer)">
          <Stat label="Latest vintage P&L" value={d.reviewer_book.latest_paper_pnl ?? "—"} hint="ESTIMATED · stress haircut" />
        </Panel>
      ) : (
        <p className="text-xs text-muted">Operator view omits marks, hits, and P&L reconstruction.</p>
      )}
      <Panel title="Alpaca" aside={d.alpaca.connected ? d.alpaca.mode ?? "on" : "off"}>
        {d.alpaca.connected ? (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Stat
              label="Venue"
              value={d.alpaca.mode === "LIVE" ? "LIVE" : "PAPER"}
              hint={`${d.alpaca.api_key_masked ?? ""} · ${d.alpaca.account_status ?? "connected"}`}
            />
            <Link to="/trade" className="inline-flex min-h-11 items-center justify-center rounded-md bg-primary px-4 text-sm text-primary-fg">
              Trade desk
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Empty>No broker keys yet. Operator stores an Alpaca paper key on Admin.</Empty>
            <Link to="/admin" className="inline-flex min-h-11 items-center justify-center rounded-md border border-border px-4 text-sm">
              Add keys
            </Link>
          </div>
        )}
      </Panel>
    </div>
  );
}
