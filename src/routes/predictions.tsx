import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppShell, Badge, Empty, Err, PageHeader, SessionTabs } from "@/components/app-shell";
import { fetchPredictions, postVerifyFreeze } from "@/desk/server-fns";
import { decisionLabel, mainReason, paperLabel, verificationLabel } from "@/ui/labels";

export const Route = createFileRoute("/predictions")({
  validateSearch: (raw: Record<string, unknown>) => ({
    session: typeof raw.session === "string" && /^\d{4}-\d{2}-\d{2}$/.test(raw.session) ? raw.session : undefined,
  }),
  head: () => ({ meta: [{ title: "Predictions | Trading App" }] }),
  component: Predictions,
});

function Predictions() {
  const { session } = Route.useSearch();
  return (
    <AppShell>
      <Loader session={session} />
    </AppShell>
  );
}

function Loader({ session }: { session?: string }) {
  const [data, setData] = useState<Awaited<ReturnType<typeof fetchPredictions>> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  useEffect(() => {
    setData(null);
    void fetchPredictions({ data: { sessionDate: session } })
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : "Could not load predictions"));
  }, [session]);

  async function verify(manifestId: string, securityId: string) {
    setNote("Checking the saved inputs and decision.");
    try {
      await postVerifyFreeze({ data: { manifestId, securityId } });
      setNote("Saved record verified.");
    } catch (e) {
      setNote(e instanceof Error ? e.message : "Verification unavailable");
    }
  }

  if (error) return <Err>{error}</Err>;
  if (!data) return <Empty>Loading freeze ledger…</Empty>;
  if ("needs_role" in data) return null;
  return <Body data={data} note={note} onVerify={verify} />;
}

function Body({
  data,
  note,
  onVerify,
}: {
  data: Exclude<Awaited<ReturnType<typeof fetchPredictions>>, { needs_role: true }>;
  note: string | null;
  onVerify: (m: string, s: string) => void;
}) {
  const d = data.data;
  const [filter, setFilter] = useState<"ALL" | "PREDICT" | "STAND_DOWN" | "NO_FREEZE">("ALL");
  const [detail, setDetail] = useState<string | null>(null);
  const rows = useMemo(() => {
    return d.rows.filter((r) => (filter === "ALL" ? true : r.status === filter));
  }, [d.rows, filter]);
  const n = d.rows.filter((r) => r.status !== "NO_FREEZE").length;
  const p = d.rows.filter((r) => r.status === "PREDICT").length;
  const s = d.rows.filter((r) => r.status === "STAND_DOWN").length;
  const u = d.rows.filter((r) => r.status === "NO_FREEZE").length;
  const selected = d.rows.find((r) => r.permanent_security_id === detail) ?? null;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Predictions" purpose="Recorded expectations and the paper positions they did—or did not—create." />
      <SessionTabs sessions={d.sessions ?? []} active={d.session_date} to="/predictions" />
      <p className="text-sm text-muted">
        {d.session_date} · Decisions cannot be edited · {n} recorded · {p} upward expectations · {s} not selected · {u}{" "}
        no decision recorded
      </p>
      {note ? (
        <p className="text-sm text-muted" role="status">
          {note}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {(
          [
            ["ALL", "All"],
            ["PREDICT", "Upward expectation"],
            ["STAND_DOWN", "Not selected"],
            ["NO_FREEZE", "No decision recorded"],
          ] as const
        ).map(([k, lab]) => (
          <button
            key={k}
            type="button"
            className={"min-h-11 rounded-sm px-3 text-sm " + (filter === k ? "bg-selected text-info" : "border border-border")}
            onClick={() => setFilter(k)}
          >
            {lab}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto" aria-label="Recorded decisions">
        <table className="w-full min-w-[44rem] text-left text-sm">
          <caption className="sr-only">Recorded research decisions for this session</caption>
          <thead className="text-xs font-medium text-muted">
            <tr>
              <th className="pb-2 font-medium">Company</th>
              <th className="pb-2 font-medium">Recorded expectation</th>
              <th className="pb-2 font-medium">Main reason</th>
              <th className="pb-2 font-medium">Paper position</th>
              <th className="pb-2 font-medium">Details</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.permanent_security_id} className="h-14 border-t border-border">
                <td className="font-medium">{r.ticker}</td>
                <td>
                  <Badge tone={r.status === "PREDICT" ? "info" : "neutral"}>{decisionLabel(r.status, r.reasons)}</Badge>
                </td>
                <td className="max-w-xs text-muted">{mainReason(r.reasons)}</td>
                <td>{paperLabel(r.execution, r.status)}</td>
                <td>
                  <button type="button" className="min-h-11 text-sm font-medium text-info" onClick={() => setDetail(r.permanent_security_id)}>
                    View decision
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-sm text-muted">A prediction is a research expectation. It does not guarantee a paper position.</p>

      {selected ? (
        <div className="fixed inset-0 z-40 flex justify-end bg-nav/40" role="dialog" aria-modal="true">
          <div className="flex h-full w-full max-w-[560px] flex-col overflow-y-auto bg-surface p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm text-muted">{selected.ticker}</p>
                <h2 className="text-xl font-semibold">{decisionLabel(selected.status, selected.reasons)}</h2>
              </div>
              <button type="button" className="min-h-11 rounded-sm border border-border px-3 text-sm" onClick={() => setDetail(null)}>
                Close
              </button>
            </div>
            <p className="mt-3 text-base">{mainReason(selected.reasons)}</p>
            <p className="mt-2 text-sm text-muted">{paperLabel(selected.execution, selected.status)}</p>
            <p className="mt-2 text-sm text-muted">A forecast is not an order to a broker.</p>
            {selected.magnitude_low && selected.magnitude_high ? (
              <p className="mt-4 text-sm">
                Expected move range — stated rule band: {selected.magnitude_low} – {selected.magnitude_high}
              </p>
            ) : data.data.role === "OPERATOR" ? (
              <p className="mt-4 text-sm text-muted">Expected move range is withheld for this role until the review window is released.</p>
            ) : null}
            <p className="mt-4 text-sm">Record evidence: {verificationLabel(selected.verification_level)}</p>
            <button
              type="button"
              className="mt-6 min-h-11 self-start rounded-sm bg-primary px-4 text-sm font-medium text-primary-fg"
              onClick={() => onVerify(data.data.manifest_id, selected.permanent_security_id)}
            >
              Verify saved record
            </button>
            {selected.input_hash ? (
              <details className="mt-6 text-sm">
                <summary className="min-h-11 cursor-pointer font-medium">Technical details</summary>
                <p className="mt-2 break-all font-mono text-xs text-muted">Input {selected.input_hash}</p>
                <p className="break-all font-mono text-xs text-muted">Output {selected.output_hash}</p>
              </details>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
