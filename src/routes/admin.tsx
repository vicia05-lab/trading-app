import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { DeskShell, Empty, Err, Panel } from "@/components/desk-shell";
import { AlpacaKeyInsert } from "@/components/alpaca-keys";
import { fetchAdmin, postFireNote, postPause, postPrintKnowledge, postResume, postRetryDeadlines } from "@/desk/server-fns";

export const Route = createFileRoute("/admin")({ component: Admin });

function Admin() {
  return (
    <DeskShell>
      <div className="flex flex-col gap-8">
        <div>
          <h1 className="text-xl font-medium tracking-tight">Admin</h1>
          <p className="mt-1 text-sm text-muted">Insert Alpaca keys here. Desk operations sit below and are separate.</p>
        </div>
        <AlpacaKeyInsert />
        <AdminOps />
      </div>
    </DeskShell>
  );
}

function AdminOps() {
  const [data, setData] = useState<Awaited<ReturnType<typeof fetchAdmin>> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  async function reload() {
    const d = await fetchAdmin();
    setData(d);
  }
  useEffect(() => {
    void reload().catch((e) => setError(e instanceof Error ? e.message : "Could not load admin"));
  }, []);

  async function run(label: string, fn: () => Promise<unknown>) {
    setNote(null);
    try {
      await fn();
      setNote(label);
      await reload();
    } catch (e) {
      setNote(e instanceof Error ? e.message : "Action failed");
    }
  }

  if (error) return <Err>{error}</Err>;
  if (!data) return <Empty>Loading desk operations…</Empty>;
  if ("needs_role" in data) return null;
  return (
    <div className="flex flex-col gap-4">
      {note ? <p className="text-sm text-muted">{note}</p> : null}
      <OpsBody data={data} run={run} />
    </div>
  );
}

function OpsBody({
  data,
  run,
}: {
  data: Exclude<Awaited<ReturnType<typeof fetchAdmin>>, { needs_role: true }>;
  run: (label: string, fn: () => Promise<unknown>) => void;
}) {
  const d = data.data;
  const [reason, setReason] = useState("operational pause");
  const [hyp, setHyp] = useState<"IMPLEMENTATION_BUG" | "COVERAGE_SHIFT" | "REGIME_SHIFT">("COVERAGE_SHIFT");
  const [fire, setFire] = useState("");
  const [pk, setPk] = useState({ eventKey: "", securityId: "", reason: "" });
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-sm font-medium tracking-tight text-muted">Desk operations</h2>
      <Panel title="Admission gate" aside={d.admission_paused ? "PAUSED" : "open"}>
        {d.can_mutate ? (
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="min-h-11 flex-1 rounded-md border border-border bg-sunken px-3 text-sm"
              placeholder="Pause reason"
            />
            <button
              type="button"
              className="min-h-11 rounded-md border border-border px-4 text-sm"
              onClick={() => run("Paused", () => postPause({ data: { reason } }))}
            >
              Pause
            </button>
            <button
              type="button"
              className="min-h-11 rounded-md bg-primary px-4 text-sm text-primary-fg"
              onClick={() => run("Resumed", () => postResume())}
            >
              Resume
            </button>
          </div>
        ) : (
          <Empty>Reviewer cannot mutate admission.</Empty>
        )}
        {d.pause_reason ? <p className="mt-2 text-xs text-muted">{d.pause_reason}</p> : null}
      </Panel>
      <Panel title="Jobs">
        <ul className="divide-y divide-border text-sm">
          {d.jobs.map((j) => (
            <li key={j.job_name} className="flex justify-between py-2 font-mono text-xs">
              <span>{j.job_name}</span>
              <span className="text-muted">{j.status}</span>
            </li>
          ))}
        </ul>
        {d.can_mutate ? (
          <button
            type="button"
            className="mt-3 min-h-11 rounded-md border border-border px-4 text-sm"
            onClick={() => run("Deadlines retried", () => postRetryDeadlines())}
          >
            Retry due deadlines
          </button>
        ) : null}
      </Panel>
      <Panel title="Deadlines">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[28rem] text-left text-xs">
            <thead className="text-[11px] uppercase tracking-wider text-muted">
              <tr>
                <th className="pb-2 font-medium">Kind</th>
                <th className="pb-2 font-medium">Scheduled</th>
                <th className="pb-2 font-medium">Applied</th>
              </tr>
            </thead>
            <tbody className="font-mono">
              {d.deadlines.map((x, i) => (
                <tr key={i} className="border-t border-border">
                  <td className="py-2">{x.kind}</td>
                  <td className="py-2">{x.scheduled_at}</td>
                  <td className="py-2">{x.applied_at ?? (x.overdue ? "OVERDUE" : "pending")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
      <Panel title="Alarms">
        {d.alarms.length === 0 ? (
          <Empty>No open operational alarms.</Empty>
        ) : (
          <ul className="space-y-2 text-sm">
            {d.alarms.map((a, i) => (
              <li key={i} className="rounded-md border border-border px-3 py-2">
                <div className="flex justify-between gap-2">
                  <span className="font-mono text-xs">{a.code}</span>
                  <span className="text-[11px] text-muted">{a.status}</span>
                </div>
                <p className="mt-1 text-xs text-muted">
                  {a.component}
                  {a.blocks_new_admission ? " · blocks new admission" : ""}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Panel>
      <Panel title="Early-result knowledge">
        {d.can_mutate ? (
          <div className="grid gap-2">
            <input className="min-h-11 rounded-md border border-border bg-sunken px-3 text-sm" placeholder="Event key" value={pk.eventKey} onChange={(e) => setPk({ ...pk, eventKey: e.target.value })} />
            <input className="min-h-11 rounded-md border border-border bg-sunken px-3 text-sm" placeholder="Permanent security id" value={pk.securityId} onChange={(e) => setPk({ ...pk, securityId: e.target.value })} />
            <input className="min-h-11 rounded-md border border-border bg-sunken px-3 text-sm" placeholder="Reason" value={pk.reason} onChange={(e) => setPk({ ...pk, reason: e.target.value })} />
            <button
              type="button"
              className="min-h-11 rounded-md border border-border text-sm"
              onClick={() => run("Knowledge recorded", () => postPrintKnowledge({ data: pk }))}
            >
              Append knowledge
            </button>
          </div>
        ) : (
          <Empty>Operator only.</Empty>
        )}
      </Panel>
      <Panel title="Fire-rate note">
        {d.can_mutate ? (
          <div className="grid gap-2">
            <select
              className="min-h-11 rounded-md border border-border bg-sunken px-3 text-sm"
              value={hyp}
              onChange={(e) => setHyp(e.target.value as typeof hyp)}
            >
              <option value="IMPLEMENTATION_BUG">IMPLEMENTATION_BUG</option>
              <option value="COVERAGE_SHIFT">COVERAGE_SHIFT</option>
              <option value="REGIME_SHIFT">REGIME_SHIFT</option>
            </select>
            <textarea className="rounded-md border border-border bg-sunken px-3 py-2 text-sm" rows={3} value={fire} onChange={(e) => setFire(e.target.value)} />
            <button
              type="button"
              className="min-h-11 rounded-md border border-border text-sm"
              onClick={() => run("Note stored", () => postFireNote({ data: { hypothesis: hyp, note: fire } }))}
            >
              Append note
            </button>
          </div>
        ) : (
          <Empty>Operator only.</Empty>
        )}
        <ul className="mt-3 space-y-1 text-xs text-muted">
          {d.fire_rate_notes.map((n, i) => (
            <li key={i}>
              <span className="font-mono">{n.hypothesis}</span> — {n.note}
            </li>
          ))}
        </ul>
      </Panel>
      <Panel title="Data ports">
        <dl className="grid grid-cols-2 gap-2 text-xs md:grid-cols-3">
          {Object.entries(d.ports).map(([k, v]) => (
            <div key={k}>
              <dt className="text-muted">{k}</dt>
              <dd className="font-mono">{v}</dd>
            </div>
          ))}
        </dl>
      </Panel>
    </div>
  );
}
