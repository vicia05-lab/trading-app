import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell, Badge, Empty, Err, PageHeader, Panel } from "@/components/app-shell";
import { AlpacaDataSecrets } from "@/components/alpaca-data-secrets";
import { fetchAdmin, postFireNote, postPause, postPrintKnowledge, postResume, postRetryDeadlines } from "@/desk/server-fns";
import { alarmLabel, jobPurpose } from "@/ui/labels";
import { capabilityLabel, capabilityTone, type Capability } from "@/ui/capability";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin | Trading App" }] }),
  component: Admin,
});

function Admin() {
  return (
    <AppShell>
      <div className="mx-auto flex max-w-[1040px] flex-col gap-8">
        <PageHeader title="Admin" purpose="Connections and safe controls for this simulated research workspace." />
        <nav className="hidden flex-wrap gap-3 text-sm md:flex" aria-label="Admin sections">
          <a href="#connections" className="text-info">
            Connections
          </a>
          <a href="#controls" className="text-info">
            Paper controls
          </a>
          <a href="#status" className="text-info">
            System status
          </a>
          <a href="#rules" className="text-info">
            Rules & review
          </a>
        </nav>
        <section id="connections" className="scroll-mt-24">
          <h2 className="mb-4 text-xl font-semibold">Connections</h2>
          <p className="mb-4 text-sm text-muted">These keys belong to your signed-in account. Saving them does not place orders or enable live trading.</p>
          <AlpacaDataSecrets />
        </section>
        <AdminOps />
      </div>
    </AppShell>
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
  if (!data) return <Empty>Loading system status…</Empty>;
  if ("needs_role" in data) return null;
  const d = data.data;
  return <Ops data={d} note={note} run={run} />;
}

function Ops({
  data: d,
  note,
  run,
}: {
  data: Exclude<Awaited<ReturnType<typeof fetchAdmin>>, { needs_role: true }>["data"];
  note: string | null;
  run: (label: string, fn: () => Promise<unknown>) => void;
}) {
  const [reason, setReason] = useState("operational pause");
  const [hyp, setHyp] = useState<"IMPLEMENTATION_BUG" | "COVERAGE_SHIFT" | "REGIME_SHIFT">("COVERAGE_SHIFT");
  const [fire, setFire] = useState("");
  const [pk, setPk] = useState({ eventKey: "", securityId: "", reason: "" });
  const paused = d.admission_paused;
  return (
    <>
      {note ? (
        <p className="text-sm text-muted" role="status">
          {note}
        </p>
      ) : null}

      <Panel title="Workspace readiness">
        <p className="mb-3 text-sm text-muted">
          Each row is a recorded check. A missing result is Not checked — never Ready just because this page loaded.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[36rem] text-left text-sm">
            <caption className="sr-only">Workspace capability checks</caption>
            <thead className="text-xs font-medium text-muted">
              <tr>
                <th className="pb-2 font-medium">Check</th>
                <th className="pb-2 font-medium">Status</th>
                <th className="pb-2 font-medium">Last checked</th>
                <th className="pb-2 font-medium">Reason</th>
              </tr>
            </thead>
            <tbody>
              {(d.capabilities ?? []).map((c: Capability) => (
                <tr key={c.id} className="h-14 border-t border-border">
                  <td>{c.label}</td>
                  <td>
                    <Badge tone={capabilityTone(c.state)}>{capabilityLabel(c.state)}</Badge>
                  </td>
                  <td className="font-mono text-xs text-muted">{c.last_checked ? c.last_checked.slice(0, 19).replace("T", " ") : "—"}</td>
                  <td className="text-muted">{c.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel title="Source readiness">
        <p className="mb-3 text-sm text-muted">Research inputs for the earnings sleeve. Sample data is not live coverage.</p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[36rem] text-left text-sm">
            <caption className="sr-only">Required research data sources</caption>
            <thead className="text-xs font-medium text-muted">
              <tr>
                <th className="pb-2 font-medium">Source</th>
                <th className="pb-2 font-medium">Status</th>
                <th className="pb-2 font-medium">Scope</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Security identity", d.ports.security_master],
                ["Market calendar", d.ports.calendar],
                ["Earnings calendar", d.ports.earnings],
                ["Stock quotes", d.ports.quotes],
                ["Official closing prices", d.ports.official_marks],
                ["Official opening prices", d.ports.official_marks],
              ].map(([name, port]) => {
                const state =
                  !port
                    ? "not_checked"
                    : port === "FIXTURE"
                      ? "sample"
                      : port === "ABSENT" || port === "UNSUPPORTED"
                        ? "not_configured"
                        : port === "ALPACA_LIVE"
                          ? "unavailable"
                          : port === "ALPACA" || port === "ALPACA_PAPER" || port === "PRESENT"
                            ? "ready"
                            : "not_checked";
                return (
                <tr key={name} className="h-14 border-t border-border">
                  <td>{name}</td>
                  <td>
                    <Badge tone={capabilityTone(state)}>{capabilityLabel(state)}</Badge>
                  </td>
                  <td className="text-muted">{port === "FIXTURE" ? "Fixture session only" : port ? String(port) : "No result returned"}</td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>

      <section id="controls" className="scroll-mt-24 flex flex-col gap-4">
        <h2 className="text-xl font-semibold">Paper controls</h2>
        <Panel
          title="New paper entries"
          aside={paused ? "Paused" : "Allowed"}
        >
          <p className="mb-4 text-sm text-muted">
            Pause prevents new reservations, but data collection, scheduled reviews, valid exits, and reconciliation
            continue when their dependencies are healthy. Applies to new paper positions across the workspace.
          </p>
          {d.can_mutate ? (
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="min-h-12 flex-1 rounded-sm border border-control bg-surface px-3 text-base"
                placeholder="Pause reason"
              />
              <button
                type="button"
                className="min-h-11 rounded-sm border border-control px-4 text-sm"
                onClick={() => run("New paper positions paused.", () => postPause({ data: { reason } }))}
              >
                Pause new paper positions
              </button>
              <button
                type="button"
                className="min-h-11 rounded-sm bg-primary px-4 text-sm font-medium text-primary-fg"
                onClick={() => run("New paper positions allowed.", () => postResume())}
              >
                Resume
              </button>
            </div>
          ) : (
            <Empty>Reviewer can read this control but cannot change it.</Empty>
          )}
        </Panel>
        <details className="rounded-md border border-border bg-surface p-4">
          <summary className="min-h-11 cursor-pointer font-medium">Special event handling</summary>
          <p className="mt-2 text-sm text-muted">
            Use for results known earlier than the permitted decision/entry horizon. Normal scheduled after-close
            releases are not early-result incidents.
          </p>
          {d.can_mutate ? (
            <form
              className="mt-3 grid gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                run("Early-result knowledge recorded.", () =>
                  postPrintKnowledge({ data: { eventKey: pk.eventKey, securityId: pk.securityId, reason: pk.reason } }),
                );
              }}
            >
              <input
                className="min-h-12 rounded-sm border border-control px-3"
                placeholder="Event key"
                value={pk.eventKey}
                onChange={(e) => setPk({ ...pk, eventKey: e.target.value })}
              />
              <input
                className="min-h-12 rounded-sm border border-control px-3"
                placeholder="Company id"
                value={pk.securityId}
                onChange={(e) => setPk({ ...pk, securityId: e.target.value })}
              />
              <input
                className="min-h-12 rounded-sm border border-control px-3"
                placeholder="Reason"
                value={pk.reason}
                onChange={(e) => setPk({ ...pk, reason: e.target.value })}
              />
              <button type="submit" className="min-h-11 rounded-sm border border-control px-4 text-sm">
                Record early results
              </button>
            </form>
          ) : null}
        </details>
      </section>

      <section id="status" className="scroll-mt-24 flex flex-col gap-4">
        <h2 className="text-xl font-semibold">System status</h2>
        <Panel title="Scheduled work">
          <ul className="grid gap-2">
            {d.jobs.map((j) => (
              <li key={j.job_name} className="flex min-h-14 items-center justify-between gap-3 border-b border-border py-2 text-sm">
                <div>
                  <p className="font-medium">{jobPurpose(j.job_name)}</p>
                  <p className="text-muted">{j.job_name}</p>
                </div>
                <Badge tone={j.status === "FAILED" ? "danger" : j.status === "RUNNING" ? "warn" : "neutral"}>{j.status}</Badge>
              </li>
            ))}
          </ul>
          {d.can_mutate ? (
            <button
              type="button"
              className="mt-4 min-h-11 rounded-sm border border-control px-4 text-sm"
              onClick={() => run("Retry scheduled job requested.", () => postRetryDeadlines())}
            >
              Retry scheduled job
            </button>
          ) : null}
        </Panel>
        <Panel title="Unresolved issues" aside={`${d.alarms.length}`}>
          {d.alarms.length === 0 ? (
            <Empty>No unresolved alarms.</Empty>
          ) : (
            <ul className="grid gap-2">
              {d.alarms.map((a, i) => {
                const copy = alarmLabel(a.code);
                return (
                  <li key={a.code + i} className="rounded-sm bg-danger-bg px-3 py-2 text-sm text-danger">
                    <p className="font-medium">{copy.title}</p>
                    <p className="mt-0.5 text-danger/80">{copy.detail}</p>
                    {a.blocks_new_admission ? (
                      <p className="mt-1 text-danger/80">New paper entries are disabled while this record is checked.</p>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
      </section>

      <section id="rules" className="scroll-mt-24 flex flex-col gap-4">
        <h2 className="text-xl font-semibold">Rules & review</h2>
        <Panel title="Current rule">
          <p className="text-sm leading-relaxed">
            Predict long when issuer-confirmed after-close timing, a complete card, valid options, an options-implied
            move proxy between 4% and 15%, five-day relative return below the benchmark, and 63-day relative return
            above the benchmark. Otherwise no qualifying setup.
          </p>
          <p className="mt-3 text-sm text-muted">The initial rule was selected after prior observation. Sealed decisions keep the checklist they were scored with.</p>
          <button type="button" disabled className="mt-4 min-h-11 cursor-not-allowed rounded-sm border border-control px-4 text-sm text-muted">
            Register future rule
          </button>
          <p className="mt-2 text-sm text-muted">
            Registration stays disabled until the approved backend workflow is available. Active and sealed rules cannot
            be edited, and historical outcomes cannot be chosen by hand.
          </p>
        </Panel>
        <Panel title="Review note">
          {d.can_mutate ? (
            <form
              className="grid gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                run("Review note saved.", () => postFireNote({ data: { hypothesis: hyp, note: fire } }));
              }}
            >
              <select
                className="min-h-12 rounded-sm border border-control px-3 text-base"
                value={hyp}
                onChange={(e) => setHyp(e.target.value as typeof hyp)}
              >
                <option value="IMPLEMENTATION_BUG">Possible implementation issue</option>
                <option value="COVERAGE_SHIFT">Data coverage changed</option>
                <option value="REGIME_SHIFT">Market conditions changed</option>
              </select>
              <textarea
                className="min-h-24 rounded-sm border border-control px-3 py-2 text-base"
                value={fire}
                onChange={(e) => setFire(e.target.value)}
                placeholder="Note"
              />
              <button type="submit" className="min-h-11 self-start rounded-sm bg-primary px-4 text-sm font-medium text-primary-fg">
                Save review note
              </button>
            </form>
          ) : (
            <Empty>Reviewer notes are operator-only.</Empty>
          )}
        </Panel>
      </section>
    </>
  );
}
