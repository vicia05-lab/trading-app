import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useState } from "react";
import { GROK_PROVIDERS, authClient, authEnabled, signIn } from "@/lib/auth/client";
import { SignedIn } from "@/lib/auth/gates";

export const Route = createFileRoute("/login")({ component: Login });

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"in" | "up">("up");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function openDesk() {
    setBusy(true);
    setErr(null);
    try {
      const stamp = crypto.randomUUID().replace(/-/g, "").slice(0, 10);
      const guestEmail = `op-${stamp}@example.com`;
      const guestPass = `${crypto.randomUUID()}Aa1!`;
      const { error } = await authClient.signUp.email({
        email: guestEmail,
        password: guestPass,
        name: "Operator",
      });
      if (error) throw new Error(error.message);
      window.location.href = "/keys";
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Could not open the desk");
    } finally {
      setBusy(false);
    }
  }

  async function onEmail(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      if (mode === "up") {
        const { error } = await authClient.signUp.email({ email, password, name: email.split("@")[0] ?? "desk" });
        if (error) throw new Error(error.message);
      } else {
        const { error } = await authClient.signIn.email({ email, password });
        if (error) throw new Error(error.message);
      }
      window.location.href = "/keys";
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Sign-in failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-6 px-5 py-10">
      <SignedIn>
        <Navigate to="/keys" />
      </SignedIn>
      <div>
        <p className="text-xs font-medium tracking-[0.18em] text-muted">TRADING APP</p>
        <h1 className="mt-2 text-2xl font-medium tracking-tight">Insert Alpaca keys</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Open the desk, then paste your paper key ID and secret. Google/X often fail inside this preview — use the
          button below.
        </p>
      </div>
      {authEnabled ? (
        <div className="flex flex-col gap-3">
          <button
            type="button"
            disabled={busy}
            onClick={() => void openDesk()}
            className="min-h-12 rounded-md bg-primary px-4 text-sm font-medium text-primary-fg disabled:opacity-60"
          >
            {busy ? "Opening…" : "Open desk and insert keys"}
          </button>
          {err ? <p className="text-sm text-danger">{err}</p> : null}
          <div className="my-1 flex items-center gap-3 text-[11px] uppercase tracking-wider text-faint">
            <span className="h-px flex-1 bg-border" />
            or
            <span className="h-px flex-1 bg-border" />
          </div>
          {GROK_PROVIDERS.map((p) => (
            <button
              key={p.providerId}
              type="button"
              onClick={() => void signIn(p.providerId, { callbackURL: "/keys" })}
              className="min-h-11 w-full rounded-md border border-border bg-surface px-4 text-sm hover:border-primary"
            >
              Continue with {p.label}
            </button>
          ))}
          <form onSubmit={onEmail} className="mt-2 flex flex-col gap-2">
            <label htmlFor="email" className="text-xs text-muted">
              Email
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 min-h-11 w-full rounded-md border border-border bg-sunken px-3 text-sm text-fg outline-none focus:border-primary"
              />
            </label>
            <label htmlFor="password" className="text-xs text-muted">
              Password
              <input
                id="password"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 min-h-11 w-full rounded-md border border-border bg-sunken px-3 text-sm text-fg outline-none focus:border-primary"
              />
            </label>
            <button
              type="submit"
              disabled={busy}
              className="min-h-11 rounded-md border border-border text-sm disabled:opacity-60"
            >
              {busy ? "Working…" : mode === "up" ? "Create account" : "Sign in with email"}
            </button>
            <button
              type="button"
              className="text-xs text-muted underline-offset-4 hover:underline"
              onClick={() => setMode(mode === "up" ? "in" : "up")}
            >
              {mode === "up" ? "Have an account? Sign in" : "Need an account? Create one"}
            </button>
          </form>
        </div>
      ) : (
        <p className="text-sm text-muted">Sign-in is disabled.</p>
      )}
    </main>
  );
}
