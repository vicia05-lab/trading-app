import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useState } from "react";
import { GROK_PROVIDERS, authClient, authEnabled, signIn } from "@/lib/auth/client";
import { SignedIn } from "@/lib/auth/gates";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign in | Trading App" }] }),
  component: Login,
});

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onEmail(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setErr(null);
    try {
      const { error } = await authClient.signIn.email({ email, password });
      if (error) {
        const created = await authClient.signUp.email({
          email,
          password,
          name: email.split("@")[0] ?? "desk",
        });
        if (created.error) throw new Error("We could not sign you in. Check the email and password.");
      }
      window.location.href = "/";
    } catch {
      setErr("We could not sign you in. Check the email and password.");
      setPassword("");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-canvas px-4 py-10">
      <SignedIn>
        <Navigate to="/" />
      </SignedIn>
      <div className="w-full max-w-[420px] rounded-lg border border-border bg-surface p-6 md:p-8">
        <p className="text-sm font-semibold">Trading App</p>
        <h1 className="mt-3 text-[26px] font-semibold leading-8">Sign in</h1>
        <p className="mt-2 text-base text-muted">A simulated earnings research workspace. No live orders.</p>
        {authEnabled ? (
          <form onSubmit={onEmail} className="mt-6 grid gap-3">
            {err ? (
              <div className="rounded-md bg-danger-bg px-3 py-2 text-sm text-danger" role="alert" tabIndex={-1}>
                {err}
              </div>
            ) : null}
            <label className="grid gap-1 text-sm font-medium">
              Email
              <input
                type="email"
                required
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="min-h-12 rounded-sm border border-control bg-surface px-3 text-base"
              />
            </label>
            <label className="grid gap-1 text-sm font-medium">
              Password
              <input
                type={show ? "text" : "password"}
                required
                minLength={8}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="min-h-12 rounded-sm border border-control bg-surface px-3 text-base"
              />
            </label>
            <label className="flex min-h-11 items-center gap-2 text-sm">
              <input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} />
              Show password
            </label>
            <button
              type="submit"
              disabled={busy}
              className="min-h-11 rounded-sm bg-primary px-4 text-sm font-medium text-primary-fg disabled:opacity-60"
            >
              {busy ? "Signing in…" : "Sign in"}
            </button>
            {GROK_PROVIDERS.length ? (
              <div className="grid gap-2 pt-2">
                {GROK_PROVIDERS.map((p) => (
                  <button
                    key={p.providerId}
                    type="button"
                    onClick={() => void signIn(p.providerId, { callbackURL: "/" })}
                    className="min-h-11 rounded-sm border border-control px-4 text-sm"
                  >
                    Continue with {p.label}
                  </button>
                ))}
              </div>
            ) : null}
          </form>
        ) : (
          <p className="mt-6 text-sm text-muted">Sign-in is disabled in this workspace.</p>
        )}
      </div>
    </main>
  );
}
