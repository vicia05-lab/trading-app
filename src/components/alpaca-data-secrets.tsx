import { useCallback, useEffect, useId, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import type { ReactNode } from "react";
import {
  fetchAlpacaDataSecret, saveAlpacaDataSecret, testAlpacaDataSecret, removeAlpacaDataSecret,
} from "@/desk/alpaca-data-fns";
import type { SecretReply } from "@/desk/alpaca-data-fns";
import type { SecretCode } from "@/desk/alpaca-data-secrets";

function Panel({ title, aside, children }: { title: string; aside: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-border bg-surface p-4 md:p-5">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-medium tracking-tight">{title}</h2>
        <span className="font-mono text-[11px] text-muted">{aside}</span>
      </div>
      {children}
    </section>
  );
}
function Empty({ children }: { children: ReactNode }) {
  return <p className="text-sm text-muted">{children}</p>;
}
function Err({ children }: { children: ReactNode }) {
  return (
    <div role="alert" className="rounded-lg border border-danger/40 bg-sunken px-3 py-2 text-sm text-danger">
      {children}
    </div>
  );
}

const messages: Record<SecretCode, string> = {
  SAVED: "Keys saved as an encrypted server-side secret. Connection not tested yet.",
  REMOVED: "Saved market-data keys removed. This does not revoke them at Alpaca.",
  VERIFIED: "Alpaca accepted the saved keys for the IEX market-data check.",
  NOT_TESTED: "Not tested",
  INVALID_INPUT: "Paste both full keys without spaces or line breaks.",
  NOT_CONFIGURED: "No keys have been saved.",
  VERSION_CONFLICT: "The saved keys changed in another window. Refresh before trying again.",
  SECRET_STORAGE_NOT_READY: "Secret storage is not configured on the server. Keys cannot be saved yet.",
  STORAGE_NOT_DURABLE: "This preview has temporary storage. Real keys cannot be saved here.",
  SECRET_UNREADABLE: "The saved secret cannot be opened. Ask the app owner to check secret storage.",
  INVALID_CREDENTIALS: "Alpaca rejected the saved credentials. Replace them with the full key pair.",
  AUTH_OR_PERMISSION_DENIED: "Alpaca denied access. Check the keys and market-data permissions.",
  RATE_LIMITED: "Too many connection checks. Wait briefly and try again.",
  PROVIDER_UNAVAILABLE: "Alpaca could not be reached. The saved keys have not been changed.",
  STORAGE_UNAVAILABLE: "Secret storage is unavailable. Refresh to check whether the last save completed.",
  FORBIDDEN: "Only an authorized Operator can manage their saved keys.",
};

// Only controlled test harnesses inject this transport; callers cannot supply user IDs or hosts.
export type AlpacaSecretApi = {
  load: () => Promise<SecretReply>;
  save: (data: { apiKeyId: string; apiSecret: string; expectedVersion: string | null }) => Promise<SecretReply>;
  test: (expectedVersion: string) => Promise<SecretReply>;
  remove: (expectedVersion: string) => Promise<SecretReply>;
};
const api: AlpacaSecretApi = {
  load: () => fetchAlpacaDataSecret(),
  save: (data) => saveAlpacaDataSecret({ data }),
  test: (expectedVersion) => testAlpacaDataSecret({ data: { expectedVersion } }),
  remove: (expectedVersion) => removeAlpacaDataSecret({ data: { expectedVersion } }),
};

type Loaded = Extract<SecretReply, { ok: true }>;
export function AlpacaDataSecrets({ transport = api }: { transport?: AlpacaSecretApi }) {
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true); setError(null); setConfirmRemove(false);
    try {
      const r = await transport.load();
      if (r.ok) setLoaded(r); else { setLoaded(null); setError(messages[r.code]); }
    } catch { setLoaded(null); setError(messages.STORAGE_UNAVAILABLE); }
    finally { setLoading(false); }
  }, [transport]);
  useEffect(() => { void reload(); }, [reload]);

  async function run(kind: "test" | "remove") {
    if (!loaded?.can_manage || !loaded.status.version || busy) return;
    setBusy(true); setError(null); setNote(null);
    try {
      const r = await transport[kind](loaded.status.version);
      if (!r.ok) { setError(messages[r.code]); return; }
      setLoaded(r); setConfirmRemove(false);
      setNote(kind === "remove" ? messages.REMOVED : messages[r.status.test_result]);
    } catch { setError(messages.STORAGE_UNAVAILABLE); }
    finally { setBusy(false); }
  }

  const status = loaded?.status;
  const canEdit = !!loaded?.can_manage && !loading && !busy;
  return (
    <Panel title="Alpaca market-data secrets" aside={status?.configured ? "SAVED" : "NOT SAVED"}>
      <p className="mb-3 text-sm leading-relaxed text-muted">
        Paste your Alpaca API key ID and secret. They are encrypted on the server. A save also connects paper trading on Trade.
      </p>
      {loading ? <Empty>Checking secret storage…</Empty> : null}
      {error ? <div className="mb-3"><Err>{error}</Err></div> : null}
      {note ? <p role="status" className="mb-3 text-sm text-muted">{note}</p> : null}
      {status?.storage_code ? <p className="mb-3 text-sm text-warn">{messages[status.storage_code]}</p> : null}
      {status?.configured ? (
        <dl className="mb-4 grid gap-2 text-sm sm:grid-cols-2">
          <div><dt className="text-muted">Saved key</dt><dd className="font-mono">••••{status.key_last4}</dd></div>
          <div><dt className="text-muted">Connection check</dt><dd>{messages[status.test_result]}</dd></div>
          <div><dt className="text-muted">Last saved</dt><dd>{status.updated_at ?? "—"}</dd></div>
          <div><dt className="text-muted">Last checked</dt><dd>{status.checked_at ?? "—"}</dd></div>
        </dl>
      ) : !loading ? <p className="mb-3 text-sm text-muted">No market-data keys saved for this account.</p> : null}
      <div className="flex flex-wrap gap-2">
        <Dialog.Root open={open} onOpenChange={(value) => { if (!busy) setOpen(value); }}>
          <Dialog.Trigger asChild>
            <button type="button" disabled={!canEdit} className="min-h-11 rounded-md bg-primary px-4 text-sm text-primary-fg disabled:opacity-40">
              {status?.configured ? "Replace Alpaca keys" : "Add Alpaca keys"}
            </button>
          </Dialog.Trigger>
          {open && loaded ? (
            <SecretForm expectedVersion={loaded.status.version} transport={transport}
              onBusy={setBusy} onSaved={(r) => { setLoaded(r); setOpen(false); setNote(messages.SAVED); setError(null); }} />
          ) : null}
        </Dialog.Root>
        {status?.configured && loaded?.can_manage ? <>
          <button type="button" disabled={!canEdit} onClick={() => void run("test")} className="min-h-11 rounded-md border border-border px-4 text-sm disabled:opacity-40">{busy ? "Working…" : "Test connection"}</button>
          <button type="button" disabled={busy || loading} onClick={() => setConfirmRemove(true)} className="min-h-11 rounded-md border border-border px-4 text-sm">Remove saved keys</button>
        </> : null}
        <button type="button" disabled={busy || loading} onClick={() => void reload()} className="min-h-11 rounded-md border border-border px-4 text-sm">Refresh status</button>
      </div>
      {confirmRemove ? (
        <div role="alert" className="mt-3 rounded-md border border-border p-3 text-sm">
          <p>Remove this account’s stored market-data keys? Your Alpaca account and any orders are not changed.</p>
          <div className="mt-2 flex gap-2">
            <button type="button" disabled={busy} onClick={() => void run("remove")} className="min-h-11 rounded-md border border-danger px-3 text-danger">Confirm removal</button>
            <button type="button" disabled={busy} onClick={() => setConfirmRemove(false)} className="min-h-11 rounded-md border border-border px-3">Cancel</button>
          </div>
        </div>
      ) : null}
      {loaded && !loaded.can_manage ? <p className="mt-3 text-sm text-muted">Reviewer access is read-only.</p> : null}
      <p className="mt-3 text-xs leading-relaxed text-muted">A successful IEX check confirms access to that endpoint only. Official auction marks, options access and research readiness are separate checks.</p>
    </Panel>
  );
}

function SecretForm({ expectedVersion, transport, onBusy, onSaved }: {
  expectedVersion: string | null; transport: AlpacaSecretApi;
  onBusy: (value: boolean) => void; onSaved: (value: Loaded) => void;
}) {
  const keyId = useId(), secretId = useId();
  const [key, setKey] = useState("");
  const [secret, setSecret] = useState("");
  const [show, setShow] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;
    if (!/^[\x21-\x7e]{8,80}$/.test(key) || !/^[\x21-\x7e]{8,256}$/.test(secret)) {
      setError(messages.INVALID_INPUT); return;
    }
    setSaving(true); onBusy(true); setError(null);
    try {
      const r = await transport.save({ apiKeyId: key, apiSecret: secret, expectedVersion });
      if (!r.ok) { setError(messages[r.code]); return; }
      setKey(""); setSecret(""); setShow(false); onSaved(r);
    } catch { setError(messages.STORAGE_UNAVAILABLE); }
    finally { setSaving(false); onBusy(false); }
  }
  return (
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-40 bg-black/70" />
      <Dialog.Content onEscapeKeyDown={(e) => { if (saving) e.preventDefault(); }}
        onInteractOutside={(e) => { if (saving) e.preventDefault(); }}
        className="fixed left-1/2 top-1/2 z-50 max-h-[90dvh] w-[calc(100%_-_2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border border-border bg-bg p-5 shadow-xl">
        <Dialog.Title className="text-lg font-medium">Save Alpaca keys</Dialog.Title>
        <Dialog.Description className="mt-2 text-sm leading-relaxed text-muted">
          Enter both keys below. They are encrypted on the server and are never returned to the browser.
          Only newly entered values can be revealed. No trading permissions are enabled here.
        </Dialog.Description>
        <form className="mt-4 grid gap-3" onSubmit={(e) => void save(e)} autoComplete="off">
          <label htmlFor={keyId} className="grid gap-1 text-sm">API key ID
            <input id={keyId} name="alpaca_data_key_id" type="text"
              value={key} onChange={(e) => setKey(e.target.value)} disabled={saving} required minLength={8} maxLength={80}
              autoComplete="off" autoCapitalize="off" autoCorrect="off" spellCheck={false}
              inputMode="text"
              className="min-h-12 w-full rounded-md border border-border bg-sunken px-3 font-mono text-base" />
          </label>
          <label htmlFor={secretId} className="grid gap-1 text-sm">Secret key
            <input id={secretId} name="alpaca_data_secret" type="text"
              value={secret} onChange={(e) => setSecret(e.target.value)} disabled={saving} required minLength={8} maxLength={256}
              autoComplete="off" autoCapitalize="off" autoCorrect="off" spellCheck={false}
              className="min-h-12 w-full rounded-md border border-border bg-sunken px-3 font-mono text-base" />
          </label>
          <label className="flex min-h-11 items-center gap-2 text-sm text-muted">
            <input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} disabled={saving} />Show newly entered keys
          </label>
          {error ? <Err>{error}</Err> : null}
          <div className="flex flex-wrap gap-2">
            <button type="submit" disabled={saving} className="min-h-11 flex-1 rounded-md bg-primary px-4 text-sm text-primary-fg disabled:opacity-40">{saving ? "Saving…" : "Save secret"}</button>
            <Dialog.Close asChild><button type="button" disabled={saving} className="min-h-11 rounded-md border border-border px-4 text-sm">Cancel</button></Dialog.Close>
          </div>
        </form>
      </Dialog.Content>
    </Dialog.Portal>
  );
}
