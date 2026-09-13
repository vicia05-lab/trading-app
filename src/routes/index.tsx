import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell, Badge, Empty, Err, PageHeader, Panel, Stat } from "@/components/app-shell";
import { fetchHome } from "@/desk/server-fns";
import { fetchAlpacaDataSecret } from "@/desk/alpaca-data-fns";
import { formatSession, money, positionStateLabel } from "@/ui/labels";
import { TickerButton, TickerLookup } from "@/components/ticker-quote";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "Home | Trading App" }] }),
  component: Home,
});

function Home() {
  return (
    <AppShell>
      <HomeLoader />
    </AppShell>
  );
}

function HomeLoader() {
  const [data, setData] = useState<Awaited<ReturnType<typeof fetchHome>> | null>(null);
  const [secret, setSecret] = useState<Awaited<ReturnType<typeof fetchAlpacaDataSecret>> | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    void Promise.all([fetchHome(), fetchAlpacaDataSecret().catch(() => null)])
      .then(([h, s]) => {
        setData(h);
        setSecret(s);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Could not load home"));
  }, []);
  if (error) return <Err>{error}</Err>;
  if (!data) return <Empty>Loading session…</Empty>;
  if ("needs_role" in data) return <Empty>Access pending.</Empty>;
  return <HomeBody data={data} secret={secret} />;
}

function HomeBody({
  data,
  secret,
}: {
  data: Exclude<Awaited<ReturnType<typeof fetchHome>>, { needs_role: true }>;
  secret: Awaited<ReturnType<typeof fetchAlpacaDataSecret>> | null;
}) {
  const d = data.data;
  const s = d.latest_session;
  const locked = Number(s?.sealed_member_count ?? 0);
  const recorded = Number(s?.frozen_count ?? 0);
  const predicts = Number(d.predict_count ?? 0);
  const reservedSlots = Number(d.reserved_count);
  const paused = d.admission_paused;

  let headline = "Preparing today’s session";
  let support = "Checking after-close reports and required inputs.";
  let action: { to: "/earnings" | "/predictions" | "/admin"; label: string } = { to: "/earnings", label: "View earnings" };

  if (paused) {
    headline = "New paper positions are paused";
    support = d.pause_reason ?? "Paused for new entries only. Existing evidence processing continues when available.";
    action = { to: "/admin", label: "Review pause in Admin" };
  } else if (!s) {
    headline = "No eligible after-close reports";
    support = "Browse another session or wait for the next scheduled check.";
  } else if (s.freeze_resolution === "OPEN") {
    headline = "Recording decisions";
    support = `${recorded} of ${locked} decisions recorded.`;
    action = { to: "/predictions", label: "View predictions" };
  } else if (recorded < locked) {
    headline = "Some decisions were not recorded";
    support = `${recorded} of ${locked} recorded before the deadline.`;
    action = { to: "/predictions", label: "View missing decision" };
  } else if (predicts === 0) {
    headline = "No qualifying setup today";
    support = "All recorded companies remain visible. No paper position was added.";
    action = { to: "/predictions", label: "View reasons" };
  } else {
    headline = "Today’s decisions are recorded";
    support = `${predicts} upward expectation${predicts === 1 ? "" : "s"}; ${reservedSlots} paper position${reservedSlots === 1 ? "" : "s"} reserved.`;
    action = { to: "/predictions", label: "View predictions" };
  }

  const attention: Array<{ title: string; body: string; href: string }> = [];
  if (Number(d.impaired_count) > 0) {
    attention.push({
      title: "Exit or entry price unresolved",
      body: `${d.impaired_count} simulated position(s) still reserve capital. Research review may be finished; accounting is waiting for usable price evidence.`,
      href: "/",
    });
  }
  if (Number(d.overdue_deadlines) > 0) {
    attention.push({
      title: "Scheduled work is overdue",
      body: `${d.overdue_deadlines} deadline(s) are past due on the fixture clock.`,
      href: "/admin",
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Home" purpose="Your earnings session, recorded decisions, and simulated positions." />
      <p className="text-sm text-muted">
        {s ? `${formatSession(s.session_date)} · US market time (ET)` : "No stored session"} · Sample data
      </p>

      <SetupChecklist secret={secret} />

      <Panel title="Look up a listed ticker">
        <p className="mb-3 text-sm text-muted">Open a live quote, chart, and news. Sample names (ALFA, BRAV) show session prices.</p>
        <TickerLookup />
      </Panel>

      <section className="rounded-md border border-border bg-surface p-4 md:p-6">
        <h2 className="text-[20px] font-semibold leading-7">{headline}</h2>
        <p className="mt-2 text-base text-muted">{support}</p>
        {action.to === "/admin" ? (
          <Link to="/admin" className="mt-4 inline-flex min-h-11 items-center text-sm font-medium text-info">
            {action.label}
          </Link>
        ) : (
          <Link to={action.to} search={{ session: undefined }} className="mt-4 inline-flex min-h-11 items-center text-sm font-medium text-info">
            {action.label}
          </Link>
        )}
      </section>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Panel title="Session companies">
          <Stat label="Locked" value={s?.sealed_member_count ?? "0"} hint={s ? "List is locked" : "List not locked yet"} />
          <Link to="/earnings" search={{ session: undefined }} className="mt-3 inline-flex min-h-11 items-center text-sm font-medium text-info">
            View companies
          </Link>
        </Panel>
        <Panel title="Recorded decisions">
          <Stat
            label="Recorded"
            value={`${recorded} of ${locked || "—"}`}
            hint={`${predicts} upward expectation${predicts === 1 ? "" : "s"}`}
          />
          <Link to="/predictions" search={{ session: undefined }} className="mt-3 inline-flex min-h-11 items-center text-sm font-medium text-info">
            View predictions
          </Link>
        </Panel>
        <Panel title="Paper capacity">
          <Stat
            label="Reserved"
            value={`${reservedSlots} of 3`}
            hint={`${money(d.reserved_notional)} of $15,000 · Across all sessions. Simulated entry notional; not a cash balance.`}
          />
        </Panel>
        <Panel title="Next step">
          <Stat
            label="Status"
            value={s?.research_closed ? "Session research complete" : "Record decisions"}
            hint={Number(d.nonclosed_positions) > 0 ? `${d.nonclosed_positions} unresolved paper record(s)` : undefined}
          />
        </Panel>
      </div>

      <Panel title="Session timeline">
        <ol className="grid gap-3">
          {[
            { label: "Collect information", state: s ? "complete" : "waiting" },
            { label: "Lock session list", state: locked ? "complete" : "current" },
            {
              label: "Record decisions",
              state: s?.freeze_resolution === "OPEN" ? "current" : recorded ? "complete" : "waiting",
            },
            {
              label: reservedSlots > 0 ? "Establish paper entry" : "Establish paper entry",
              state: reservedSlots > 0 ? "complete" : s?.freeze_resolution !== "OPEN" && predicts === 0 ? "skipped" : "waiting",
            },
            { label: "Review next-session open", state: s?.research_closed ? "complete" : "waiting" },
            { label: "Research report available", state: s?.research_closed ? "complete" : "waiting" },
          ].map((step) => (
            <li key={step.label} className="flex min-h-11 items-center justify-between gap-3 border-b border-border pb-2">
              <span className="text-sm">{step.label}</span>
              <span className="text-sm text-muted">
                {step.state === "complete" ? "Complete" : step.state === "current" ? "Current" : step.state === "skipped" ? "Not needed: no admitted positions" : "Waiting"}
              </span>
            </li>
          ))}
        </ol>
      </Panel>

      <Panel title="Needs attention">
        {attention.length === 0 ? (
          <Empty>No grouped issues right now.</Empty>
        ) : (
          <ul className="grid gap-3">
            {attention.slice(0, 3).map((a) => (
              <li key={a.title} className="rounded-sm bg-warn-bg px-4 py-3">
                <p className="font-medium text-warn">{a.title}</p>
                <p className="mt-1 text-sm text-fg">{a.body}</p>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel title="Open paper positions" aside="All sessions">
        {d.open_positions.length === 0 ? (
          <Empty>No unresolved simulated positions.</Empty>
        ) : (
          <div className="overflow-x-auto" aria-label="Open paper positions">
            <table className="w-full min-w-[36rem] text-left text-sm">
              <caption className="sr-only">Unresolved simulated positions across all sessions</caption>
              <thead className="text-xs font-medium text-muted">
                <tr>
                  <th className="pb-2 font-medium">Company</th>
                  <th className="pb-2 font-medium">Earnings session</th>
                  <th className="pb-2 text-right font-medium">Reserved entry notional</th>
                  <th className="pb-2 font-medium">Paper state</th>
                </tr>
              </thead>
              <tbody>
                {d.open_positions.map((p) => (
                  <tr key={p.position_id} className="h-14 border-t border-border">
                    <td>
                      <TickerButton symbol={p.ticker} name={p.name} />
                    </td>
                    <td>{formatSession(p.session_date)}</td>
                    <td className="text-right tabular-nums">{money(p.notional)}</td>
                    <td>
                      <Badge tone={p.state.startsWith("IMPAIRED") ? "warn" : "info"}>{positionStateLabel(p.state)}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {d.reviewer_book ? (
        <Panel title="Priced results" aside="Reviewer">
          <Stat
            label="Latest modeled result"
            value={money(d.reviewer_book.latest_paper_pnl, 4)}
            hint={`${d.reviewer_book.priced_vintages} priced vintage(s) · ESTIMATED`}
          />
        </Panel>
      ) : null}
    </div>
  );
}

function SetupChecklist({ secret }: { secret: Awaited<ReturnType<typeof fetchAlpacaDataSecret>> | null }) {
  const ok = secret && "ok" in secret && secret.ok;
  const saved = Boolean(ok && secret.status.configured);
  const tested = Boolean(ok && secret.status.test_result === "VERIFIED");
  const storage = Boolean(ok && !secret.status.storage_code);
  if (saved && tested) return null;
  const rows = [
    { label: "Signed in", done: true, hint: "Account and permissions resolved." },
    { label: "Secure storage ready", done: storage, hint: "View status in Admin. You do not paste an encryption master key." },
    { label: "Alpaca keys saved", done: saved, hint: "An encrypted pair exists for this owner." },
    { label: "Market-data check", done: tested, hint: "Saved pair accepted by the read-only endpoint." },
    { label: "Required data sources ready", done: false, hint: "Sample data is labeled. Scheduled ingestion is not active yet." },
    { label: "Scheduled workflow ready", done: true, hint: "Fixture jobs and deadlines are configured for this workspace." },
  ];
  return (
    <Panel title="Workspace setup">
      <ul className="grid gap-2">
        {rows.map((r) => (
          <li key={r.label} className="flex min-h-11 items-start justify-between gap-3 border-b border-border py-2">
            <div>
              <p className="text-sm font-medium">{r.label}</p>
              <p className="text-sm text-muted">{r.hint}</p>
            </div>
            <span className={"text-sm " + (r.done ? "text-success" : "text-muted")}>{r.done ? "Done" : "Needed"}</span>
          </li>
        ))}
      </ul>
      <Link to="/admin" className="mt-3 inline-flex min-h-11 items-center text-sm font-medium text-info">
        {saved ? "Test connection in Admin" : "Add keys"}
      </Link>
    </Panel>
  );
}
