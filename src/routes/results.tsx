import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { DeskShell, Empty, Err, Panel, Stat } from "@/components/desk-shell";
import { fetchResults } from "@/desk/server-fns";

export const Route = createFileRoute("/results")({ component: Results });

function Results() {
  return (
    <DeskShell>
      <ResultsLoader />
    </DeskShell>
  );
}

function ResultsLoader() {
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
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-medium tracking-tight">Results</h1>
        <p className="mt-1 text-sm text-muted">Process coverage first. Denominators sit next to rates. Zero never substitutes for missing.</p>
      </div>
      <div className="rounded-xl border border-warn/40 bg-sunken px-4 py-3 text-sm leading-relaxed text-fg">{d.banner}</div>
      <Panel title="Process coverage">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Stat label="Sealed N" value={p.sealed} />
          <Stat label="Frozen" value={p.frozen} hint={`rate ${p.freeze_rate.value ?? p.freeze_rate.reason}`} />
          <Stat label="NO_FREEZE" value={p.no_freeze} hint={`rate ${p.no_freeze_rate.value ?? p.no_freeze_rate.reason}`} />
          <Stat label="PREDICT" value={p.predict} />
          <Stat label="STAND_DOWN" value={p.stand_down} hint={`of frozen ${p.stand_down_rate.value ?? p.stand_down_rate.reason}`} />
          <Stat label="Complete cards" value={p.complete_frozen_cards} />
          <Stat label="Partial manifests" value={p.partial_manifest_rate.value ?? p.partial_manifest_rate.reason ?? "—"} />
          <Stat label="UNGRADEABLE" value={p.outcomes.UNGRADEABLE ?? "0"} />
        </div>
      </Panel>
      <Panel title="Research labels">
        {"restricted" in d.research && d.research.restricted ? (
          <Empty>{d.research.message}</Empty>
        ) : (
          <Research r={d.research as Extract<typeof d.research, { restricted: false }>} />
        )}
      </Panel>
      <Panel title="Paper book">
        {"restricted" in d.book && d.book.restricted ? (
          <Empty>Operator cannot reconstruct P&L from this surface.</Empty>
        ) : (
          <Book b={d.book as Extract<typeof d.book, { positions: unknown }>} />
        )}
      </Panel>
    </div>
  );
}

function Research({ r }: { r: { clean_predict_n: string; direction_hits: string; hit_rate: { value: string | null; reason: string | null } | null; attrition_lower: { value: string | null }; attrition_upper: { value: string | null }; interval_label: string; point_estimate_suppressed: boolean; grades: Array<Record<string, unknown>> } }) {
  return (
    <div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Clean PREDICT n" value={r.clean_predict_n} />
        <Stat label="Direction hits" value={r.direction_hits} />
        <Stat label="Hit rate" value={r.point_estimate_suppressed ? "suppressed" : (r.hit_rate?.value ?? r.hit_rate?.reason ?? "—")} hint={r.point_estimate_suppressed ? "interval includes 0.5" : undefined} />
        <Stat label="Attrition interval" value={`${r.attrition_lower.value ?? "—"} – ${r.attrition_upper.value ?? "—"}`} hint={r.interval_label} />
      </div>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[40rem] text-left text-xs">
          <thead className="text-[11px] uppercase tracking-wider text-muted">
            <tr>
              <th className="pb-2 font-medium">Name</th>
              <th className="pb-2 font-medium">Decision</th>
              <th className="pb-2 font-medium">Outcome</th>
              <th className="pb-2 font-medium">Hit</th>
              <th className="pb-2 font-medium">Evidence</th>
            </tr>
          </thead>
          <tbody className="font-mono">
            {r.grades.map((g) => (
              <tr key={String(g.id) + String(g.session_date)} className="border-t border-border">
                <td className="py-2">
                  {String(g.ticker)}
                  <div className="text-[10px] text-muted">{String(g.session_date)}</div>
                </td>
                <td className="py-2">{String(g.decision ?? "—")}</td>
                <td className="py-2">{String(g.outcome)}</td>
                <td className="py-2">{g.direction_hit == null ? "—" : g.direction_hit ? "hit" : "miss"}</td>
                <td className="py-2">{g.in_evidence_set ? "clean" : "excluded"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Book({ b }: { b: { positions: Array<{ ticker: string; state: string; original_reserved_notional: string; paper_pnl: string | null; basis: string | null; strategy_pnl_eligible: boolean | null }> } }) {
  if (!b.positions.length) return <Empty>No paper positions.</Empty>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[36rem] text-left text-xs">
        <thead className="text-[11px] uppercase tracking-wider text-muted">
          <tr>
            <th className="pb-2 font-medium">Name</th>
            <th className="pb-2 font-medium">State</th>
            <th className="pb-2 font-medium">Reserved</th>
            <th className="pb-2 font-medium">P&L</th>
            <th className="pb-2 font-medium">Basis</th>
          </tr>
        </thead>
        <tbody className="font-mono">
          {b.positions.map((p) => (
            <tr key={p.ticker + p.state} className="border-t border-border">
              <td className="py-2">{p.ticker}</td>
              <td className="py-2">{p.state}</td>
              <td className="py-2">{p.original_reserved_notional}</td>
              <td className="py-2">{p.paper_pnl ?? "—"}</td>
              <td className="py-2">
                {p.basis ?? "—"}
                {p.strategy_pnl_eligible === false ? " · ineligible" : ""}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
