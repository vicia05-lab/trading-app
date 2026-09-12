import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Empty, Err, Panel } from "@/components/desk-shell";
import { fetchAlpacaStatus, postAlpacaCredentials, postAlpacaDisconnect } from "@/desk/server-fns";
import type { AlpacaPublicStatus } from "@/desk/alpaca-types";

function failMsg(e: unknown, fallback: string): string {
  if (e instanceof Error && e.message) return e.message;
  if (typeof e === "object" && e && "message" in e && typeof (e as { message: unknown }).message === "string") {
    return (e as { message: string }).message;
  }
  return fallback;
}

const EMPTY_STATUS: AlpacaPublicStatus = {
  connected: false,
  mode: null,
  api_key_masked: null,
  account_number_last4: null,
  account_status: null,
  last_ok_at: null,
  last_error: null,
  watchlist: [],
  trading_host: null,
};

/** Standalone key insertion — does not wait on the rest of Admin. */
export function AlpacaKeyInsert() {
  const [status, setStatus] = useState<AlpacaPublicStatus>(EMPTY_STATUS);
  const [canMutate, setCanMutate] = useState(true);
  const [ready, setReady] = useState(false);
  const [loadErr, setLoadErr] = useState<string | null>(null);

  async function reload() {
    const r = await fetchAlpacaStatus();
    setStatus(r.status);
    setCanMutate(r.can_mutate);
    setReady(true);
  }

  useEffect(() => {
    void reload().catch((e) => {
      setLoadErr(failMsg(e, "Could not load Alpaca status"));
      setReady(true);
    });
  }, []);

  return (
    <AlpacaKeysForm
      status={status}
      canMutate={canMutate}
      ready={ready}
      loadErr={loadErr}
      onChanged={reload}
    />
  );
}

export function AlpacaKeysForm({
  status,
  canMutate,
  ready = true,
  loadErr,
  onChanged,
}: {
  status: AlpacaPublicStatus;
  canMutate: boolean;
  ready?: boolean;
  loadErr?: string | null;
  onChanged: () => Promise<void>;
}) {
  const [keyId, setKeyId] = useState("");
  const [secret, setSecret] = useState("");
  const [mode, setMode] = useState<"PAPER" | "LIVE">("PAPER");
  const [confirmLive, setConfirmLive] = useState(false);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function save() {
    const apiKeyId = keyId.trim();
    const apiSecret = secret.trim();
    if (apiKeyId.length < 8 || apiSecret.length < 8) {
      setErr("Paste both the key ID and the secret (each at least 8 characters).");
      return;
    }
    if (mode === "LIVE" && !confirmLive) {
      setErr("Live mode needs the confirmation checkbox.");
      return;
    }
    setBusy(true);
    setErr(null);
    setNote(null);
    try {
      await postAlpacaCredentials({
        data: { apiKeyId, apiSecret, mode, confirmLive },
      });
      setSecret("");
      setKeyId("");
      setConfirmLive(false);
      setNote(mode === "LIVE" ? "Live keys stored and verified." : "Paper keys stored and verified.");
    } catch (e) {
      setErr(failMsg(e, "Could not store keys"));
    } finally {
      try {
        await onChanged();
      } catch {
        /* status refresh is secondary to the save result */
      }
      setBusy(false);
    }
  }

  async function drop() {
    setBusy(true);
    setErr(null);
    try {
      await postAlpacaDisconnect();
      setNote("Alpaca keys removed from this desk.");
      await onChanged();
    } catch (e) {
      setErr(failMsg(e, "Disconnect failed"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Panel title="Insert Alpaca keys" aside={status.connected ? (status.mode === "LIVE" ? "LIVE" : "PAPER") : "empty"}>
      <p className="mb-3 text-sm leading-relaxed text-muted">
        Paste the key ID and secret from app.alpaca.markets. They are encrypted on the server. The secret is never
        sent back to this phone. Paper is the default.
      </p>
      {loadErr ? (
        <div className="mb-3">
          <Err>{loadErr}</Err>
        </div>
      ) : null}
      {status.connected ? (
        <dl className="mb-4 grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
          <div>
            <dt className="text-[11px] uppercase tracking-wider text-muted">Stored key</dt>
            <dd className="mt-1 font-mono text-xs">{status.api_key_masked}</dd>
          </div>
          <div>
            <dt className="text-[11px] uppercase tracking-wider text-muted">Account</dt>
            <dd className="mt-1 font-mono text-xs">
              {status.account_number_last4 ? `…${status.account_number_last4}` : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-[11px] uppercase tracking-wider text-muted">Status</dt>
            <dd className="mt-1 font-mono text-xs">{status.account_status ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-[11px] uppercase tracking-wider text-muted">Last ok</dt>
            <dd className="mt-1 font-mono text-xs">{status.last_ok_at ? status.last_ok_at.slice(0, 19) : "—"}</dd>
          </div>
        </dl>
      ) : (
        <Empty>Nothing stored yet. Paste both fields below and tap Insert keys.</Empty>
      )}
      {status.last_error ? (
        <div className="mb-3">
          <Err>{status.last_error}</Err>
        </div>
      ) : null}
      {err ? (
        <div className="mb-3">
          <Err>{err}</Err>
        </div>
      ) : null}
      {note ? <p className="mb-3 text-sm text-muted">{note}</p> : null}
      {!ready ? <p className="text-sm text-muted">Loading key slot…</p> : null}
      {(
        <form
          className="grid gap-3"
          autoComplete="off"
          onSubmit={(e) => {
            e.preventDefault();
            void save();
          }}
        >
          <label className="grid gap-1 text-sm">
            <span className="text-[11px] uppercase tracking-wider text-muted">API key ID</span>
            <input
              value={keyId}
              onChange={(e) => setKeyId(e.target.value)}
              autoComplete="off"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              inputMode="text"
              enterKeyHint="next"
              name="alpaca_api_key_id"
              className="min-h-12 rounded-md border border-border bg-sunken px-3 font-mono text-base"
              placeholder="PK…"
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-[11px] uppercase tracking-wider text-muted">Secret key</span>
            <textarea
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              autoComplete="off"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              name="alpaca_api_secret"
              rows={3}
              className="rounded-md border border-border bg-sunken px-3 py-2 font-mono text-base"
              placeholder="Paste the secret here"
            />
          </label>
          <button
            type="submit"
            disabled={busy}
            className="min-h-12 rounded-md bg-primary px-4 text-sm font-medium text-primary-fg disabled:opacity-40"
          >
            {busy ? "Saving…" : status.connected ? "Replace keys" : "Insert keys"}
          </button>
          <fieldset className="grid gap-2">
            <legend className="text-[11px] uppercase tracking-wider text-muted">Venue</legend>
            <div className="flex flex-col gap-2 sm:flex-row">
              <label className="flex min-h-11 flex-1 items-center gap-2 rounded-md border border-border px-3 text-sm">
                <input
                  type="radio"
                  name="alpaca-insert-mode"
                  checked={mode === "PAPER"}
                  onChange={() => {
                    setMode("PAPER");
                    setConfirmLive(false);
                  }}
                />
                Paper
              </label>
              <label className="flex min-h-11 flex-1 items-center gap-2 rounded-md border border-danger/40 px-3 text-sm">
                <input
                  type="radio"
                  name="alpaca-insert-mode"
                  checked={mode === "LIVE"}
                  onChange={() => setMode("LIVE")}
                />
                Live (real capital)
              </label>
            </div>
          </fieldset>
          {mode === "LIVE" ? (
            <label className="flex items-start gap-2 text-sm text-danger">
              <input
                type="checkbox"
                className="mt-1"
                checked={confirmLive}
                onChange={(e) => setConfirmLive(e.target.checked)}
              />
              <span>I understand these live keys will send real orders against real money.</span>
            </label>
          ) : null}
          <div className="flex flex-col gap-2 sm:flex-row">
            {status.connected ? (
              <button
                type="button"
                disabled={busy}
                className="min-h-11 rounded-md border border-border px-4 text-sm"
                onClick={() => void drop()}
              >
                Disconnect
              </button>
            ) : null}
            <Link to="/trade" className="flex min-h-11 items-center justify-center rounded-md border border-border px-4 text-sm">
              Open trade desk
            </Link>
          </div>
        </form>
      )}
    </Panel>
  );
}
