import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { RedirectToSignIn, UserButton } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { fetchMe, postClaimRole } from "@/desk/server-fns";

const NAV = [
  { to: "/keys", label: "Keys" },
  { to: "/trade", label: "Trade" },
  { to: "/", label: "Desk" },
  { to: "/earnings", label: "Earn" },
  { to: "/predictions", label: "Pred" },
  { to: "/admin", label: "Admin" },
] as const;

export function DeskShell({ children }: { children: ReactNode }) {
  const { user, isPending } = useCurrentUserState();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [role, setRole] = useState<string | null | undefined>(undefined);
  const [alpacaMode, setAlpacaMode] = useState<"PAPER" | "LIVE" | null>(null);
  const [alpacaOn, setAlpacaOn] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    void fetchMe()
      .then((m) => {
        setRole(m.role ?? "OPERATOR");
        setAlpacaOn(Boolean(m.alpaca?.connected));
        setAlpacaMode(m.alpaca?.mode ?? null);
      })
      .catch((e) => {
        setErr(e instanceof Error ? e.message : "Failed to load desk identity");
        setRole("OPERATOR");
      });
  }, [user]);

  if (isPending) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-bg text-muted">
        <div className="h-24 w-64 animate-pulse rounded-xl bg-surface" />
      </div>
    );
  }
  if (!user) return <RedirectToSignIn />;

  async function claim(next: "OPERATOR" | "REVIEWER") {
    setClaiming(true);
    setErr(null);
    try {
      const r = await postClaimRole({ data: { role: next } });
      setRole(r.role);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not assign desk role");
    } finally {
      setClaiming(false);
    }
  }

  if (role === undefined) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-bg px-5 text-muted">
        <p className="text-sm">Opening desk…</p>
        {err ? <p className="text-sm text-danger">{err}</p> : null}
      </div>
    );
  }

  if (role === null) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center gap-6 px-5 py-10">
        <p className="text-xs font-medium tracking-[0.18em] text-muted">TRADING APP</p>
        <h1 className="text-2xl font-medium tracking-tight">Open as operator</h1>
        <p className="text-sm leading-relaxed text-muted">
          Operator can insert Alpaca keys and send paper orders. Reviewer is read-only.
        </p>
        {err ? <p className="text-sm text-danger">{err}</p> : null}
        <button
          type="button"
          disabled={claiming}
          onClick={() => void claim("OPERATOR")}
          className="min-h-12 rounded-lg bg-primary px-4 text-sm font-medium text-primary-fg"
        >
          {claiming ? "Opening…" : "Continue as Operator"}
        </button>
        <button
          type="button"
          disabled={claiming}
          onClick={() => void claim("REVIEWER")}
          className="min-h-11 rounded-lg border border-border px-4 text-sm"
        >
          Continue as Reviewer
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-bg pb-20 text-fg md:pb-8">
      <header className="border-b border-border bg-bg/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium tracking-tight">Trading App</span>
              <span
                className={
                  "rounded-full border px-2 py-0.5 font-mono text-[10px] tracking-wider " +
                  (alpacaOn && alpacaMode === "LIVE"
                    ? "border-danger text-danger"
                    : alpacaOn
                      ? "border-warn text-warn"
                      : "border-border text-warn")
                }
              >
                {alpacaOn && alpacaMode === "LIVE"
                  ? "ALPACA LIVE"
                  : alpacaOn
                    ? "ALPACA PAPER"
                    : "FIXTURE / SYNTHETIC"}
              </span>
            </div>
            <p className="truncate text-[11px] text-muted">
              {alpacaOn
                ? alpacaMode === "LIVE"
                  ? "Live Alpaca — auto-execution is off"
                  : "Alpaca paper auto-execution · $5,000 tickets on the watchlist screen"
                : "Insert keys, then Trade runs the book"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden rounded-full border border-border px-2 py-0.5 font-mono text-[10px] text-muted sm:inline">
              {role}
            </span>
            <UserButton />
          </div>
        </div>
        <nav className="mx-auto hidden max-w-6xl gap-1 px-4 pb-2 md:flex">
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className={
                "rounded-md px-3 py-1.5 text-sm " +
                (pathname === n.to ? "bg-surface text-fg" : "text-muted hover:text-fg")
              }
            >
              {n.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-5">{children}</main>
      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-bg/95 pb-[env(safe-area-inset-bottom)] md:hidden">
        <div className="grid grid-cols-6">
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className={
                "flex min-h-11 items-center justify-center px-1 text-[11px] " +
                (pathname === n.to ? "text-fg" : "text-muted")
              }
            >
              {n.label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}

export function Panel({ title, children, aside }: { title: string; children: ReactNode; aside?: string }) {
  return (
    <section className="rounded-xl border border-border bg-surface p-4 md:p-5">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-medium tracking-tight">{title}</h2>
        {aside ? <span className="font-mono text-[11px] text-muted">{aside}</span> : null}
      </div>
      {children}
    </section>
  );
}

export function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="min-w-0">
      <div className="text-[11px] uppercase tracking-wider text-muted">{label}</div>
      <div className="mt-1 font-mono text-lg tabular-nums text-fg">{value}</div>
      {hint ? <div className="mt-0.5 text-[11px] text-faint">{hint}</div> : null}
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="text-sm text-muted">{children}</p>;
}

export function Err({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-lg border border-danger/40 bg-sunken px-3 py-2 text-sm text-danger" role="alert">
      {children}
    </div>
  );
}

export function SessionTabs({
  sessions,
  active,
  to,
}: {
  sessions: Array<{ session_date: string }>;
  active?: string;
  to: "/earnings" | "/predictions";
}) {
  if (!sessions.length) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {sessions.map((s) => (
        <Link
          key={s.session_date}
          to={to}
          search={{ session: s.session_date }}
          className={
            "min-h-11 rounded-md border px-3 text-sm " +
            (active === s.session_date ? "border-primary bg-surface text-fg" : "border-border text-muted hover:text-fg")
          }
        >
          {s.session_date}
        </Link>
      ))}
    </div>
  );
}
