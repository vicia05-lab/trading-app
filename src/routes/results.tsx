import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell, Badge, Empty, Err, PageHeader, Panel, Stat } from "@/components/app-shell";
import { fetchResults } from "@/desk/server-fns";
import { decisionLabel, money, positionStateLabel } from "@/ui/labels";

export const Route = createFileRoute("/results")({
  head: () => ({ meta: [{ title: "Results | Trading App" }] }),
  component: Results,
});

function Results() {
  return (
    <AppShell>
      <Loader />
    </AppShell>
  );
}

function Loader() {
  const [data, setData] = useState<Awaited<ReturnType<typeof fetchResults>> | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    void fetchResults()
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : "Could not load results"));
  }, []);
  if (error) return <Err>{error}</Err>;
  if (!data) return <Empty>Loading report…</Empty>;
  if ("needs_role" in data) return null;
  return <Body data={data} />;
}

function Body({ data }: { data: Exclude<Awaited<ReturnType<typeof fetchResults>>, { needs_role: true }> }) {
  const d = data.data;
  const p = d.process;
  const [tab, setTab] = useState<"process" | "review" | "book">("process");
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Results" purpose="Operational coverage and research outcomes, with missing evidence kept visible." />
      <div className="rounded-md border-l-4 border-info bg-info-bg px-4 py-3 text-sm leading-relaxed">
        Operational research report. The initial rule was selected after prior observation. Small-sample hit rate does
        not establish a trading edge. Paper P&L is ESTIMATED under a conservative stress haircut, not live-fill
        evidence. Unresolved prices and excluded labels are disclosed separately.
      </div>
      {d.banner ? <p className="text-sm text-muted">{d.banner}</p> : null}
      <div className="flex flex-wrap gap-2">
        {(
          [
            ["process", "Process"],
            ["review", "Prediction review"],
            ["book", "Paper results"],
          ] as const
        ).map(([k, lab]) => (
          <button
            key={k}
            type="button"
            className={"min-h-11 rounded-sm px-3 text-sm " + (tab === k ? "bg-selected text-info" : "border border-border")}
            onClick={() => setTab(k)}
          >
            {lab}
          </button>
        ))}
      </div>

      {tab === "process" ? (
        <Panel title="Process coverage">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <Stat label="Locked companies" value={p.sealed} />
            <Stat label="Decisions recorded" value={p.frozen} hint={p.freeze_rate.value ? `${p.frozen} of ${p.sealed}` : p.freeze_rate.reason ?? undefined} />
            <Stat label="No decision recorded" value={p.no_freeze} />
            <Stat label="Upward expectations" value={p.predict} />
            <Stat label="Not selected" value={p.stand_down} />
            <Stat label="Complete cards" value={p.complete_frozen_cards} />
          </div>
        </Panel>
      ) : null}

      {tab === "review" ? (
        <Panel title="Prediction review">
          {"restricted" in d.research && d.research.restricted ? (
            <Empty>{d.research.message}</Empty>
          ) : (
            <Research r={d.research as Extract<typeof d.research, { restricted: false }>} />
          )}
        </Panel>
      ) : null}

      {tab === "book" ? (
        <Panel title="Modeled paper results" aside="ESTIMATED">
          {"restricted" in d.book && d.book.restricted ? (
            <Empty>Paper results are withheld for this role until the review window is released.</Empty>
          ) : (
            <Book b={d.book as Extract<typeof d.book, { positions: unknown }>} />
          )}
        </Panel>
      ) : null}
    </div>
  );
}

function Research({
  r,
}: {
  r: {
    clean_predict_n: string;
    direction_hits: string;
    hit_rate: { value: string | null; reason: string | null } | null;
    attrition_lower: { value: string | null };
    attrition_upper: { value: string | null };
    interval_label: string;
    point_estimate_suppressed: boolean;
    grades: Array<Record<string, unknown>>;
  };
}) {
  return (
    <div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Stat label="Usable clean labels" value={r.clean_predict_n} />
        <Stat label="Directional hits" value={r.direction_hits} hint={`of ${r.clean_predict_n} usable labels`} />
        <Stat
          label="Range allowing for missing/excluded labels"
          value={`${r.attrition_lower.value ?? "—"} – ${r.attrition_upper.value ?? "—"}`}
          hint="This is a sensitivity range, not a confidence interval."
        />
        {r.point_estimate_suppressed ? null : (
          <Stat label="Directional rate on usable labels" value={r.hit_rate?.value ?? r.hit_rate?.reason ?? "—"} />
        )}
      </div>
      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[36rem] text-left text-sm">
          <thead className="text-xs font-medium text-muted">
            <tr>
              <th className="pb-2 font-medium">Company</th>
              <th className="pb-2 font-medium">Decision</th>
              <th className="pb-2 font-medium">Research outcome</th>
            </tr>
          </thead>
          <tbody>
            {r.grades.map((g) => (
              <tr key={String(g.id) + String(g.session_date)} className="h-14 border-t border-border">
                <td>{String(g.ticker)}</td>
                <td>{decisionLabel(typeof g.decision === "string" ? g.decision : null)}</td>
                <td>
                  <Badge tone={g.in_evidence_set ? "success" : "warn"}>
                    {g.outcome === "NO_EVENT" ? "Earnings event changed" : g.in_evidence_set ? "Included in primary review" : "Not evaluable"}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Book({
  b,
}: {
  b: {
    positions: Array<{
      ticker: string;
      state: string;
      original_reserved_notional: string;
      paper_pnl: string | null;
      basis: string | null;
    }>;
  };
}) {
  const priced = b.positions.filter((p) => p.paper_pnl != null);
  const unresolved = b.positions.filter((p) => p.paper_pnl == null && p.state !== "CLOSED");
  return (
    <div>
      <p className="mb-4 text-sm text-muted">
        Priced positions only; {unresolved.length} unresolved positions excluded from this total.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[40rem] text-left text-sm">
          <thead className="text-xs font-medium text-muted">
            <tr>
              <th className="pb-2 font-medium">Company</th>
              <th className="pb-2 font-medium">State</th>
              <th className="pb-2 text-right font-medium">Reserved notional</th>
              <th className="pb-2 text-right font-medium">Modeled result</th>
            </tr>
          </thead>
          <tbody>
            {b.positions.map((p) => (
              <tr key={p.ticker + p.state} className="h-14 border-t border-border">
                <td>{p.ticker}</td>
                <td>{positionStateLabel(p.state)}</td>
                <td className="text-right tabular-nums">{money(p.original_reserved_notional)}</td>
                <td className="text-right tabular-nums">{p.paper_pnl == null ? "Excluded" : money(p.paper_pnl, 4)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {priced.length === 0 ? <p className="mt-3 text-sm text-muted">No priced positions in this snapshot.</p> : null}
    </div>
  );
}
