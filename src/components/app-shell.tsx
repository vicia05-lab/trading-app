import { Link, useRouterState } from "@tanstack/react-router";
import { Bell, FileBarChart, HelpCircle, Home, ListChecks, Settings, SquarePen } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { RedirectToSignIn, UserButton } from "@/lib/auth/gates";
import { authEnabled, signOut } from "@/lib/auth/client";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { fetchMe, fetchNotices, postClaimRole } from "@/desk/server-fns";
import { applyAppearance, readAppearance, type Appearance } from "@/ui/theme";
import { TickerQuoteProvider } from "@/components/ticker-quote";
export { Drawer } from "@/components/drawer";

const NAV = [
  { to: "/", label: "Home", icon: Home },
  { to: "/earnings", label: "Earnings", icon: ListChecks },
  { to: "/predictions", label: "Predictions", icon: SquarePen },
  { to: "/results", label: "Results", icon: FileBarChart },
  { to: "/admin", label: "Admin", icon: Settings },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { user, isPending } = useCurrentUserState();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [role, setRole] = useState<string | null | undefined>(undefined);
  const [err, setErr] = useState<string | null>(null);
  const [appearance, setAppearance] = useState<Appearance>("light");
  const [menuOpen, setMenuOpen] = useState(false);
  const [waited, setWaited] = useState(false);
  const [noticesOpen, setNoticesOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [notices, setNotices] = useState<Array<{
    id: string;
    severity: "info" | "warn" | "danger";
    title: string;
    detail: string;
    at: string;
    href: string;
  }>>([]);

  useEffect(() => {
    const pref = readAppearance();
    setAppearance(pref);
    applyAppearance(pref);
  }, []);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    const fail = window.setTimeout(() => {
      if (!cancelled) setErr("This is taking too long. Try again, or sign in once more.");
    }, 12000);
    void fetchMe()
      .then(async (m) => {
        if (cancelled) return;
        if (!m.role) {
          const r = await postClaimRole({ data: { role: "OPERATOR" } });
          if (!cancelled) setRole(r.role);
        } else {
          setRole(m.role);
        }
      })
      .catch((e) => {
        if (!cancelled) setErr(e instanceof Error ? e.message : "We could not load your workspace access");
      })
      .finally(() => window.clearTimeout(fail));
    return () => {
      cancelled = true;
      window.clearTimeout(fail);
    };
  }, [user]);

  useEffect(() => {
    if (!user) return;
    void fetchNotices()
      .then((n) => {
        if (n && "data" in n && Array.isArray(n.data.items)) setNotices(n.data.items);
      })
      .catch(() => setNotices([]));
  }, [user]);

  useEffect(() => {
    const id = window.setTimeout(() => setWaited(true), 4000);
    return () => window.clearTimeout(id);
  }, []);

  if (isPending && !waited) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-canvas px-4 text-center">
        <p className="text-base text-muted">Loading workspace access…</p>
        <a href="/login" className="min-h-11 text-sm font-medium text-info">
          Continue to sign in
        </a>
      </div>
    );
  }
  if (isPending && waited) return <RedirectToSignIn />;
  if (!user) return <RedirectToSignIn />;

  if (err && role === undefined) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-4 px-4">
        <h1 className="text-[26px] font-semibold leading-8">We could not load your workspace access</h1>
        <p className="text-base text-muted">{err}</p>
        <div className="flex gap-2">
          <button
            type="button"
            className="min-h-11 rounded-sm bg-primary px-4 text-sm font-medium text-primary-fg"
            onClick={() => window.location.reload()}
          >
            Try again
          </button>
          {authEnabled ? (
            <button type="button" className="min-h-11 rounded-sm border border-control px-4 text-sm" onClick={() => void signOut()}>
              Sign out
            </button>
          ) : null}
        </div>
      </div>
    );
  }

  if (role === undefined) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-canvas text-muted">
        <p className="text-base">Loading workspace access…</p>
      </div>
    );
  }

  return (
    <TickerQuoteProvider>
    <div className="min-h-dvh bg-canvas text-fg">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-sm focus:bg-surface focus:px-3 focus:py-2">
        Skip to content
      </a>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[232px] flex-col bg-nav text-nav-text lg:flex">
        <div className="px-5 py-6">
          <p className="text-sm font-semibold tracking-tight text-nav-text">Trading App</p>
        </div>
        <nav className="flex flex-1 flex-col gap-1 px-3" aria-label="Primary">
          {NAV.map((n) => {
            const active = n.to === "/" ? pathname === "/" : pathname === n.to || pathname.startsWith(n.to + "/");
            const Icon = n.icon;
            return (
              <Link
                key={n.to}
                to={n.to}
                aria-current={active ? "page" : undefined}
                className={
                  "flex min-h-11 items-center gap-3 rounded-sm border-l-2 px-3 text-sm " +
                  (active ? "border-info bg-white/10 text-info" : "border-transparent text-nav-text hover:bg-white/5")
                }
              >
                <Icon className="size-5" aria-hidden />
                {n.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <header className="sticky top-0 z-20 border-b border-border bg-surface lg:ml-[232px]">
        <div className="mx-auto flex h-[60px] max-w-[1440px] items-center justify-between gap-3 px-4 md:h-[72px] md:px-8">
          <div className="min-w-0 lg:hidden">
            <p className="text-sm font-semibold">Trading App</p>
          </div>
          <div className="hidden items-center gap-2 lg:flex">
            <span className="rounded-full bg-info-bg px-2.5 py-1 text-xs font-medium text-info">Simulated trades</span>
            <span className="rounded-full bg-subtle px-2.5 py-1 text-xs font-medium text-muted">Sample data</span>
          </div>
          <div className="relative flex items-center gap-1 sm:gap-3">
            <span className="hidden rounded-full bg-subtle px-2.5 py-1 text-xs font-medium text-muted sm:inline">{role}</span>
            <button
              type="button"
              className="relative min-h-11 min-w-11 rounded-sm px-2 text-sm text-muted"
              aria-label="Notifications"
              aria-expanded={noticesOpen}
              onClick={() => {
                setNoticesOpen((v) => !v);
                setHelpOpen(false);
                setMenuOpen(false);
              }}
            >
              <Bell className="size-5" aria-hidden />
              {notices.length > 0 ? (
                <span className="absolute right-1 top-2 size-2 rounded-full bg-danger" aria-hidden />
              ) : null}
            </button>
            <button
              type="button"
              className="min-h-11 min-w-11 rounded-sm px-2 text-sm text-muted"
              aria-label="Help"
              aria-expanded={helpOpen}
              onClick={() => {
                setHelpOpen((v) => !v);
                setNoticesOpen(false);
                setMenuOpen(false);
              }}
            >
              <HelpCircle className="size-5" aria-hidden />
            </button>
            <button
              type="button"
              className="min-h-11 rounded-sm px-2 text-sm text-muted"
              onClick={() => {
                setMenuOpen((v) => !v);
                setNoticesOpen(false);
                setHelpOpen(false);
              }}
              aria-expanded={menuOpen}
              aria-haspopup="menu"
              aria-label="Account"
            >
              Account
            </button>
            {menuOpen ? (
              <div
                role="menu"
                className="absolute right-0 top-12 z-40 w-56 rounded-md border border-border bg-surface p-2 shadow-lg"
              >
                <UserButton />
                <p className="mt-2 px-2 text-xs text-muted">Appearance</p>
                {(["light", "dark", "system"] as const).map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    role="menuitem"
                    className="flex min-h-11 w-full items-center rounded-sm px-2 text-left text-sm capitalize hover:bg-subtle"
                    onClick={() => {
                      setAppearance(opt);
                      applyAppearance(opt);
                      setMenuOpen(false);
                    }}
                  >
                    {opt}
                    {appearance === opt ? " · selected" : ""}
                  </button>
                ))}
              </div>
            ) : null}
            {noticesOpen ? (
              <div
                role="dialog"
                aria-label="Notifications"
                className="absolute right-0 top-12 z-40 w-[min(24rem,calc(100vw-2rem))] rounded-md border border-border bg-surface p-3 shadow-lg"
              >
                <p className="px-1 text-sm font-semibold">Operational notices</p>
                {notices.length === 0 ? (
                  <p className="mt-2 px-1 text-sm text-muted">No operational notices.</p>
                ) : (
                  <ul className="mt-2 grid gap-2">
                    {notices.map((n) => (
                      <li key={n.id} className="rounded-sm bg-subtle px-3 py-2">
                        <p className="text-sm font-medium">{n.title}</p>
                        <p className="mt-1 text-sm text-muted">{n.detail}</p>
                        <p className="mt-1 font-mono text-[11px] text-muted">{n.at.slice(0, 16).replace("T", " ")}</p>
                        <Link to="/admin" className="mt-2 inline-flex min-h-11 items-center text-sm font-medium text-info" onClick={() => setNoticesOpen(false)}>
                          View issue
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : null}
            {helpOpen ? (
              <div
                role="dialog"
                aria-labelledby="about-desk-title"
                className="absolute right-0 top-12 z-40 w-[min(24rem,calc(100vw-2rem))] rounded-md border border-border bg-surface p-4 shadow-lg"
              >
                <h2 id="about-desk-title" className="text-sm font-semibold">
                  About this desk
                </h2>
                <p className="mt-2 text-sm text-muted">
                  Paper-only after-close earnings research. No live orders. Saved keys stay on the server. Direction
                  hits and paper P&L stay on Results for the reviewer role.
                </p>
                <button type="button" className="mt-3 min-h-11 text-sm font-medium text-info" onClick={() => setHelpOpen(false)}>
                  Close
                </button>
              </div>
            ) : null}
          </div>
        </div>
        <div className="flex gap-1 overflow-x-auto px-4 pb-2 lg:hidden">
          <span className="rounded-full bg-info-bg px-2.5 py-1 text-xs font-medium text-info">Simulated trades</span>
          <span className="rounded-full bg-subtle px-2.5 py-1 text-xs font-medium text-muted">Sample data</span>
        </div>
        <nav className="hidden border-t border-border md:flex lg:hidden" aria-label="Primary">
          {NAV.map((n) => {
            const active = n.to === "/" ? pathname === "/" : pathname === n.to;
            return (
              <Link
                key={n.to}
                to={n.to}
                aria-current={active ? "page" : undefined}
                className={"min-h-11 flex-1 px-2 py-3 text-center text-sm " + (active ? "bg-selected text-info" : "text-muted")}
              >
                {n.label}
              </Link>
            );
          })}
        </nav>
      </header>

      <main id="main" className="mx-auto max-w-[1440px] px-4 pb-28 pt-6 md:px-6 lg:ml-[232px] lg:px-8 lg:pb-10">
        {children}
      </main>

      <nav
        className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface pb-[env(safe-area-inset-bottom)] md:hidden"
        aria-label="Primary"
      >
        <div className="grid grid-cols-5">
          {NAV.map((n) => {
            const active = n.to === "/" ? pathname === "/" : pathname === n.to;
            const Icon = n.icon;
            return (
              <Link
                key={n.to}
                to={n.to}
                aria-current={active ? "page" : undefined}
                className={"flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] " + (active ? "text-info" : "text-muted")}
              >
                <Icon className="size-5" aria-hidden />
                {n.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
    </TickerQuoteProvider>
  );
}

export function Panel({ title, children, aside }: { title: string; children: ReactNode; aside?: string }) {
  return (
    <section className="rounded-md border border-border bg-surface p-4 md:p-6">
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <h2 className="text-base font-semibold leading-6">{title}</h2>
        {aside ? <span className="text-xs font-medium text-muted">{aside}</span> : null}
      </div>
      {children}
    </section>
  );
}

export function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="min-w-0">
      <div className="text-xs font-medium uppercase tracking-wide text-muted">{label}</div>
      <div className="mt-1 font-sans text-[26px] font-semibold tabular-nums leading-8 md:text-[30px] md:leading-[38px]">
        {value}
      </div>
      {hint ? <p className="mt-1 text-sm text-muted">{hint}</p> : null}
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="text-base text-muted">{children}</p>;
}

export function Err({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-md border border-danger/30 bg-danger-bg px-4 py-3 text-sm text-danger" role="alert">
      {children}
    </div>
  );
}

export function Badge({
  tone = "neutral",
  children,
}: {
  tone?: "neutral" | "info" | "success" | "warn" | "danger";
  children: ReactNode;
}) {
  const cls =
    tone === "info"
      ? "bg-info-bg text-info"
      : tone === "success"
        ? "bg-success-bg text-success"
        : tone === "warn"
          ? "bg-warn-bg text-warn"
          : tone === "danger"
            ? "bg-danger-bg text-danger"
            : "bg-subtle text-muted";
  return <span className={"inline-flex rounded-full px-2.5 py-1 text-xs font-medium " + cls}>{children}</span>;
}

export function SessionTabs({
  sessions,
  active,
  to,
}: {
  sessions: Array<{ session_date: string }>;
  active?: string;
  to: "/" | "/earnings" | "/predictions";
}) {
  if (!sessions.length) return null;
  return (
    <div className="flex flex-wrap gap-2" role="tablist" aria-label="Session">
      {sessions.map((s) => (
        <Link
          key={s.session_date}
          to={to}
          search={{ session: s.session_date }}
          className={
            "min-h-11 rounded-sm border px-3 text-sm " +
            (active === s.session_date ? "border-primary bg-selected text-info" : "border-border text-muted")
          }
        >
          {s.session_date}
        </Link>
      ))}
    </div>
  );
}

export function PageHeader({ title, purpose, action }: { title: string; purpose: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div>
        <h1 className="text-[26px] font-semibold leading-8 md:text-[30px] md:leading-[38px]">{title}</h1>
        <p className="mt-1 text-base text-muted">{purpose}</p>
      </div>
      {action}
    </div>
  );
}
