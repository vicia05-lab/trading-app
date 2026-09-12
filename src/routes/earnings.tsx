import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { DeskShell, Empty, Err, Panel, SessionTabs } from "@/components/desk-shell";
import { fetchEarnings } from "@/desk/server-fns";

export const Route = createFileRoute("/earnings")({
  validateSearch: (raw: Record<string, unknown>) => ({
    session: typeof raw.session === "string" && /^\d{4}-\d{2}-\d{2}$/.test(raw.session) ? raw.session : undefined,
  }),
  component: Earnings,
});

function Earnings() {
  const { session } = Route.useSearch();
  return (
    <DeskShell>
      <EarningsLoader session={session} />
    </DeskShell>
  );
}

function EarningsLoader({ session }: { session?: string }) {
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
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-medium tracking-tight">Earnings</h1>
        <p className="mt-1 text-sm text-muted">
          Session {d.session_date} · sealed snapshot only · post-seal quotes are not used for the card
        </p>
      </div>
      <SessionTabs sessions={d.sessions ?? []} active={d.session_date} to="/earnings" />
      <div className="grid gap-3 md:grid-cols-2">
        {d.members.map((m) => (
          <article key={m.permanent_security_id} className="rounded-xl border border-border bg-surface p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="text-sm font-medium" title={m.permanent_security_id}>
                  {m.ticker}
                </h2>
                <p className="font-mono text-[11px] text-muted">{m.permanent_security_id}</p>
              </div>
              <span className="rounded-full border border-border px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted">
                {m.timing_quality === "ISSUER_CONFIRMED" ? "issuer AMC" : m.timing_quality}
              </span>
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div>
                <dt className="text-muted">Card</dt>
                <dd className="font-mono">{m.card_complete ? "complete" : "incomplete"}</dd>
              </div>
              <div>
                <dt className="text-muted">Options</dt>
                <dd className="font-mono">{m.options_valid ? "valid" : "missing / invalid"}</dd>
              </div>
              <div>
                <dt className="text-muted">Implied move</dt>
                <dd className="font-mono">{m.implied_move ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-muted">Pins</dt>
                <dd className="font-mono">{m.pin_count}</dd>
              </div>
              <div>
                <dt className="text-muted">Rel 5d</dt>
                <dd className="font-mono">{m.benchmark_relative_5d ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-muted">Rel 63d</dt>
                <dd className="font-mono">{m.benchmark_relative_63d ?? "—"}</dd>
              </div>
            </dl>
          </article>
        ))}
      </div>
      <Panel title="Exclusions">
        {d.exclusions.length === 0 ? (
          <Empty>No excluded candidates on this sealed session.</Empty>
        ) : (
          <ul className="space-y-2 text-sm">
            {d.exclusions.map((e) => (
              <li key={e.permanent_security_id} className="flex justify-between gap-3 border-b border-border py-2">
                <span>
                  {e.ticker} <span className="font-mono text-[11px] text-muted">{e.permanent_security_id}</span>
                </span>
                <span className="font-mono text-xs text-muted">{e.reason_codes.join(", ")}</span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
