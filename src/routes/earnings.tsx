import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppShell, Badge, Empty, Err, PageHeader, Panel, SessionTabs } from "@/components/app-shell";
import { fetchEarnings } from "@/desk/server-fns";
import { decisionLabel, infoStatus, pct, timingLabel } from "@/ui/labels";

export const Route = createFileRoute("/earnings")({
  validateSearch: (raw: Record<string, unknown>) => ({
    session: typeof raw.session === "string" && /^\d{4}-\d{2}-\d{2}$/.test(raw.session) ? raw.session : undefined,
  }),
  head: () => ({ meta: [{ title: "Earnings | Trading App" }] }),
  component: Earnings,
});

function Earnings() {
  const { session } = Route.useSearch();
  return (
    <AppShell>
      <Loader session={session} />
    </AppShell>
  );
}

function Loader({ session }: { session?: string }) {
  const [data, setData] = useState<Awaited<ReturnType<typeof fetchEarnings>> | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    setData(null);
    void fetchEarnings({ data: { sessionDate: session } })
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : "Could not load earnings"));
  }, [session]);
  if (error) return <Err>{error}</Err>;
  if (!data) return <Empty>Loading candidates…</Empty>;
  if ("needs_role" in data) return null;
  return <Body data={data} />;
}

function Body({ data }: { data: Exclude<Awaited<ReturnType<typeof fetchEarnings>>, { needs_role: true }> }) {
  const d = data.data;
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<"list" | "excluded">("list");
  const [detail, setDetail] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return d.members.filter((m) => !needle || m.ticker.toLowerCase().includes(needle) || (m.name ?? "").toLowerCase().includes(needle));
  }, [d.members, q]);

  const selected = d.members.find((m) => m.permanent_security_id === detail) ?? null;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Earnings" purpose="After-close reports being considered for the selected session." />
      <SessionTabs sessions={d.sessions ?? []} active={d.session_date} to="/earnings" />
      <p className="text-sm text-muted">Locked session inputs · {d.session_date} · Sample data</p>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className={"min-h-11 rounded-sm px-3 text-sm " + (tab === "list" ? "bg-selected text-info" : "border border-border")}
          onClick={() => setTab("list")}
        >
          Session list ({d.members.length})
        </button>
        <button
          type="button"
          className={"min-h-11 rounded-sm px-3 text-sm " + (tab === "excluded" ? "bg-selected text-info" : "border border-border")}
          onClick={() => setTab("excluded")}
        >
          Excluded ({d.exclusions.length})
        </button>
      </div>

      {tab === "list" ? (
        <>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search company or ticker"
            className="min-h-12 max-w-md rounded-sm border border-control bg-surface px-3 text-base"
          />
          {q && filtered.length === 0 ? (
            <Empty>No companies match your filters.</Empty>
          ) : d.members.length === 0 ? (
            <Empty>No eligible reports available.</Empty>
          ) : (
            <div className="overflow-x-auto" aria-label="Session companies">
              <table className="w-full min-w-[40rem] text-left text-sm">
                <caption className="sr-only">Companies locked for this earnings session</caption>
                <thead className="text-xs font-medium text-muted">
                  <tr>
                    <th className="pb-2 font-medium">Company</th>
                    <th className="pb-2 font-medium">Earnings</th>
                    <th className="pb-2 font-medium">Required information</th>
                    <th className="pb-2 font-medium">Rule outcome</th>
                    <th className="pb-2 font-medium">Next action</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((m) => (
                    <tr key={m.permanent_security_id} className="h-14 border-t border-border">
                      <td>
                        <div className="font-medium">{m.ticker}</div>
                        <div className="text-sm text-muted">{m.name}</div>
                      </td>
                      <td>{timingLabel(m.timing_quality)}</td>
                      <td>{infoStatus(m.card_complete, m.options_valid)}</td>
                      <td>
                        <Badge tone={m.decision === "PREDICT" ? "info" : "neutral"}>
                          {decisionLabel(m.decision, m.reasons)}
                        </Badge>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="min-h-11 text-sm font-medium text-info"
                          onClick={() => setDetail(m.permanent_security_id)}
                        >
                          View details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      ) : (
        <Panel title="Excluded candidates">
          {d.exclusions.length === 0 ? (
            <Empty>No exclusions for this session.</Empty>
          ) : (
            <ul className="grid gap-2">
              {d.exclusions.map((e) => (
                <li key={e.permanent_security_id} className="rounded-sm bg-subtle px-3 py-2 text-sm">
                  <span className="font-medium">{e.ticker}</span>
                  <span className="text-muted"> · {e.reason_codes.join(", ") || e.status}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      )}

      {selected ? (
        <div className="fixed inset-0 z-40 flex justify-end bg-nav/40" role="dialog" aria-modal="true" aria-labelledby="earn-detail">
          <div className="flex h-full w-full max-w-[560px] flex-col overflow-y-auto bg-surface p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm text-muted">{selected.ticker}</p>
                <h2 id="earn-detail" className="text-xl font-semibold">
                  {selected.name}
                </h2>
              </div>
              <button type="button" className="min-h-11 rounded-sm border border-border px-3 text-sm" onClick={() => setDetail(null)}>
                Close
              </button>
            </div>
            <p className="mt-3 text-base">{timingLabel(selected.timing_quality)}</p>
            <p className="mt-1 text-sm text-muted">These inputs were locked before the decision. Newer observations are not used in this record.</p>
            <h3 className="mt-6 text-base font-semibold">Information used</h3>
            <dl className="mt-3 grid gap-3 text-sm">
              <div>
                <dt className="text-muted">Options-implied move proxy</dt>
                <dd className="font-medium tabular-nums">{selected.implied_move ? pct(selected.implied_move) : "Not available"}</dd>
                <p className="text-xs text-muted">An option-price-based size estimate; not a probability or direction forecast.</p>
              </div>
              <div>
                <dt className="text-muted">Five-day relative return</dt>
                <dd className="font-medium tabular-nums">{selected.benchmark_relative_5d ? pct(selected.benchmark_relative_5d) : "Not available"}</dd>
              </div>
              <div>
                <dt className="text-muted">63-day relative return</dt>
                <dd className="font-medium tabular-nums">{selected.benchmark_relative_63d ? pct(selected.benchmark_relative_63d) : "Not available"}</dd>
              </div>
              <div>
                <dt className="text-muted">Options validity</dt>
                <dd>{selected.options_valid == null ? "Not available" : selected.options_valid ? "Valid" : "Invalid source value"}</dd>
              </div>
            </dl>
          </div>
        </div>
      ) : null}
    </div>
  );
}
