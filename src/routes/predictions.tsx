import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { DeskShell, Empty, Err, Panel, SessionTabs } from "@/components/desk-shell";
import { fetchPredictions, postVerifyFreeze } from "@/desk/server-fns";

export const Route = createFileRoute("/predictions")({
  validateSearch: (raw: Record<string, unknown>) => ({
    session: typeof raw.session === "string" && /^\d{4}-\d{2}-\d{2}$/.test(raw.session) ? raw.session : undefined,
  }),
  component: Predictions,
});

function Predictions() {
  const { session } = Route.useSearch();
  return (
    <DeskShell>
      <PredictionsLoader session={session} />
    </DeskShell>
  );
}

function PredictionsLoader({ session }: { session?: string }) {
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
    setNote(null);
    try {
      const r = await postVerifyFreeze({ data: { manifestId, securityId } });
      setNote(`Verified ${securityId}: ${(r as { decision?: string }).decision ?? "ok"} (duplicate=${Boolean((r as { duplicate?: boolean }).duplicate)})`);
    } catch (e) {
      setNote(e instanceof Error ? e.message : "Verify failed");
    }
  }

  if (error) return <Err>{error}</Err>;
  return (
    <>
      {note ? <p className="mb-3 text-sm text-muted">{note}</p> : null}
      {!data ? <Empty>Loading freeze ledger…</Empty> : "needs_role" in data ? null : <Body data={data} onVerify={verify} />}
    </>
  );
}

function Body({
  data,
  onVerify,
}: {
  data: Exclude<Awaited<ReturnType<typeof fetchPredictions>>, { needs_role: true }>;
  onVerify: (m: string, s: string) => void;
}) {
  const d = data.data;
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-medium tracking-tight">Predictions</h1>
        <p className="mt-1 text-sm text-muted">
          {d.session_date} · resolution {d.freeze_resolution} · NO_FREEZE is missing prediction, not stand-down
        </p>
      </div>
      <SessionTabs sessions={d.sessions ?? []} active={d.session_date} to="/predictions" />
      <Panel title="Freeze ledger">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <thead className="text-[11px] uppercase tracking-wider text-muted">
              <tr>
                <th className="pb-2 font-medium">Name</th>
                <th className="pb-2 font-medium">Decision</th>
                <th className="pb-2 font-medium">Execution</th>
                <th className="pb-2 font-medium">Verify</th>
              </tr>
            </thead>
            <tbody>
              {d.rows.map((r) => (
                <tr key={r.permanent_security_id} className="border-t border-border align-top">
                  <td className="py-2">
                    <div className="font-medium">{r.ticker}</div>
                    <div className="font-mono text-[10px] text-muted">{r.permanent_security_id}</div>
                    {r.input_hash ? <div className="mt-1 max-w-[14rem] truncate font-mono text-[10px] text-faint">{r.input_hash}</div> : null}
                  </td>
                  <td className="py-2 font-mono text-xs">
                    {r.status}
                    {r.direction ? ` / ${r.direction}` : r.status === "NO_FREEZE" ? "" : " / —"}
                    <div className="mt-1 text-[10px] text-muted">{r.verification_level ?? ""}</div>
                    {r.magnitude_low ? (
                      <div className="text-[10px] text-muted">
                        band {r.magnitude_low}–{r.magnitude_high}
                      </div>
                    ) : null}
                  </td>
                  <td className="py-2 text-xs">
                    {r.execution === "PAPER_COMMITTED"
                      ? "PREDICT / PAPER COMMITTED"
                      : r.status === "PREDICT"
                        ? "PREDICT / NOT TRADED"
                        : r.execution}
                  </td>
                  <td className="py-2">
                    {r.status !== "NO_FREEZE" ? (
                      <button
                        type="button"
                        className="min-h-11 rounded-md border border-border px-3 text-xs hover:border-primary"
                        onClick={() => onVerify(d.manifest_id, r.permanent_security_id)}
                      >
                        Verify
                      </button>
                    ) : (
                      <span className="text-xs text-muted">no artifact</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
