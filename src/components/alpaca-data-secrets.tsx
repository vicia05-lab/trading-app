import { useCallback, useEffect, useId, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import type { ReactNode } from "react";
import {
  fetchAlpacaDataSecret, saveAlpacaDataSecret, testAlpacaDataSecret, removeAlpacaDataSecret,
} from "@/desk/alpaca-data-fns";
import type { SecretReply } from "@/desk/alpaca-data-fns";
import type { SecretCode } from "@/desk/alpaca-data-secrets";

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-md border border-border bg-surface p-4 md:p-6">
      <h2 className="mb-4 text-base font-semibold leading-6">{title}</h2>
      {children}
    </section>
  );
}

const messages: Record<SecretCode, string> = {
  SAVED: "Keys saved. Connection not tested yet.",
  REMOVED: "Saved keys removed. Alpaca account, orders, and research history are unchanged.",
  VERIFIED: "Market-data access checked.",
  NOT_TESTED: "Not tested",
  INVALID_INPUT: "Paste the full key without spaces or line breaks.",
  NOT_CONFIGURED: "No keys have been saved.",
  VERSION_CONFLICT: "Keys changed in another window. Refresh before replacing them.",
  SECRET_STORAGE_NOT_READY: "Secure storage is not ready. Your keys have not been saved.",
  STORAGE_NOT_DURABLE: "This preview has temporary storage. Real keys cannot be saved here.",
  SECRET_UNREADABLE: "Saved keys cannot be opened.",
  INVALID_CREDENTIALS: "Alpaca did not accept these keys.",
  AUTH_OR_PERMISSION_DENIED: "Access denied for this market-data check.",
  RATE_LIMITED: "Too many checks; try again shortly.",
  PROVIDER_UNAVAILABLE: "Could not reach Alpaca; saved keys were not changed.",
  STORAGE_UNAVAILABLE: "Save status is not confirmed. Check saved-key status before trying again.",
  FORBIDDEN: "Only an authorized Operator can manage their saved keys.",
};

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
  const canEdit = !!loaded?.can_manage && !loading && !busy && !status?.storage_code;
  const storageReady = !status?.storage_code;
  const saved = Boolean(status?.configured);
  const tested = status?.test_result === "VERIFIED";

  return (
    <Panel title="Alpaca market-data connection">
      <p className="mb-4 text-sm leading-relaxed text-muted">
        These keys belong to your signed-in account. Saving them does not place orders or enable live trading.
      </p>
      {loading ? <p className="mb-3 text-sm text-muted">Checking secret storage…</p> : null}
      {error ? (
        <div role="alert" className="mb-3 rounded-md border border-danger/30 bg-danger-bg px-4 py-3 text-sm text-danger">
          {error}
        </div>
      ) : null}
      {note ? <p role="status" className="mb-3 text-sm text-muted">{note}</p> : null}

      <dl className="mb-4 divide-y divide-border rounded-sm border border-border">
        <Row label="Secure storage" value={storageReady ? "Ready" : "Not ready"} hint={status?.storage_code ? messages[status.storage_code] : "Server can persist encrypted credentials."} />
        <Row label="Saved keys" value={saved ? "Saved" : "Not saved"} hint={saved ? `••••${status?.key_last4 ?? ""}` : "No encrypted pair for this account."} />
        <Row label="Market-data check" value={tested ? "Checked" : saved ? "Saved / not tested" : "Not available"} hint={status?.checked_at ?? "This checks one market-data endpoint only."} />
        <Row label="Scheduled data usage" value="Not configured" hint={saved ? "Keys are saved. Scheduled market-data ingestion is not active yet." : "Saving keys does not start a market-data schedule."} />
      </dl>

      <div className="flex flex-wrap gap-2">
        <Dialog.Root open={open} onOpenChange={(value) => { if (!busy) setOpen(value); }}>
          <Dialog.Trigger asChild>
            <button
              type="button"
              disabled={!loaded?.can_manage || loading || busy || !storageReady}
              className="min-h-11 rounded-sm bg-primary px-4 text-sm font-medium text-primary-fg disabled:opacity-40"
            >
              {saved ? "Replace Alpaca keys" : "Add keys"}
            </button>
          </Dialog.Trigger>
          {open && loaded ? (
            <SecretForm
              replace={saved}
              expectedVersion={loaded.status.version}
              transport={transport}
              onBusy={setBusy}
              onSaved={(r) => { setLoaded(r); setOpen(false); setNote(messages.SAVED); setError(null); }}
            />
          ) : null}
        </Dialog.Root>
        {saved && loaded?.can_manage ? (
          <>
            <button type="button" disabled={!canEdit} onClick={() => void run("test")} className="min-h-11 rounded-sm border border-control px-4 text-sm disabled:opacity-40">
              {busy ? "Checking market-data access…" : "Test connection"}
            </button>
            <button type="button" disabled={busy || loading} onClick={() => setConfirmRemove(true)} className="min-h-11 rounded-sm border border-control px-4 text-sm">
              Remove saved keys
            </button>
          </>
        ) : null}
        <button type="button" disabled={busy || loading} onClick={() => void reload()} className="min-h-11 rounded-sm border border-control px-4 text-sm">
          Refresh status
        </button>
      </div>
      {!storageReady && loaded?.can_manage ? (
        <p className="mt-3 text-sm text-warn">Secure storage is not ready. Your keys have not been saved.</p>
      ) : null}
      {confirmRemove ? (
        <div role="alertdialog" className="mt-4 rounded-md border border-border bg-subtle p-4">
          <h3 className="font-semibold">Remove saved Alpaca keys?</h3>
          <p className="mt-2 text-sm leading-relaxed">
            This removes the encrypted pair saved for your account in Trading App. It does not revoke the keys at Alpaca,
            cancel orders, close positions, or remove research history.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" disabled={busy} onClick={() => void run("remove")} className="min-h-11 rounded-sm bg-danger px-4 text-sm font-medium text-primary-fg">
              Remove saved keys
            </button>
            <button type="button" disabled={busy} onClick={() => setConfirmRemove(false)} className="min-h-11 rounded-sm border border-control px-4 text-sm">
              Keep keys
            </button>
          </div>
        </div>
      ) : null}
      {loaded && !loaded.can_manage ? <p className="mt-3 text-sm text-muted">Reviewer access is read-only.</p> : null}
      <p className="mt-4 text-sm leading-relaxed text-muted">
        This checks one market-data endpoint. It does not verify official auction prices, options coverage, or scheduled ingestion.
      </p>
    </Panel>
  );
}

function Row({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="grid gap-1 px-4 py-3 sm:grid-cols-[11rem_1fr]">
      <dt className="text-sm text-muted">{label}</dt>
      <dd>
        <p className="text-sm font-medium">{value}</p>
        <p className="text-sm text-muted">{hint}</p>
      </dd>
    </div>
  );
}

function SecretForm({
  replace,
  expectedVersion,
  transport,
  onBusy,
  onSaved,
}: {
  replace: boolean;
  expectedVersion: string | null;
  transport: AlpacaSecretApi;
  onBusy: (value: boolean) => void;
  onSaved: (value: Loaded) => void;
}) {
  const keyId = useId();
  const secretId = useId();
  const [key, setKey] = useState("");
  const [secret, setSecret] = useState("");
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;
    if (/\s/.test(key) || /\s/.test(secret) || !/^[\x21-\x7e]{8,80}$/.test(key) || !/^[\x21-\x7e]{8,256}$/.test(secret)) {
      setError(messages.INVALID_INPUT);
      return;
    }
    setSaving(true);
    onBusy(true);
    setError(null);
    try {
      const r = await transport.save({ apiKeyId: key, apiSecret: secret, expectedVersion });
      if (!r.ok) {
        setError(messages[r.code]);
        return;
      }
      setKey("");
      setSecret("");
      setShow(false);
      onSaved(r);
    } catch {
      setError(messages.STORAGE_UNAVAILABLE);
      setSecret("");
    } finally {
      setSaving(false);
      onBusy(false);
    }
  }

  const fieldType = show ? "text" : "password";

  return (
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-40 bg-nav/50" />
      <Dialog.Content
        onEscapeKeyDown={(e) => {
          if (saving) e.preventDefault();
        }}
        onInteractOutside={(e) => {
          if (saving) e.preventDefault();
        }}
        className="fixed left-1/2 top-6 z-50 max-h-[calc(100dvh-32px)] w-[calc(100%-32px)] max-w-[480px] -translate-x-1/2 overflow-y-auto rounded-lg border border-border bg-surface p-6 shadow-lg md:top-1/2 md:-translate-y-1/2"
      >
        <Dialog.Title className="text-xl font-semibold">{replace ? "Replace Alpaca keys" : "Save Alpaca keys"}</Dialog.Title>
        <Dialog.Description className="mt-2 text-base leading-6 text-muted">
          Enter the API key ID and secret for market-data access. Both are encrypted on the server. Saving them does not
          place orders or enable live trading.
        </Dialog.Description>
        <form className="mt-5 grid gap-4" onSubmit={(e) => void save(e)} autoComplete="off">
          <label htmlFor={keyId} className="grid gap-1 text-sm font-medium">
            API key ID
            <input
              id={keyId}
              name="alpaca_data_key_id"
              type={fieldType}
              value={key}
              onChange={(e) => setKey(e.target.value)}
              disabled={saving}
              required
              minLength={8}
              maxLength={80}
              autoComplete="off"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              className="min-h-12 w-full rounded-sm border border-control bg-surface px-3 text-base"
            />
          </label>
          <label htmlFor={secretId} className="grid gap-1 text-sm font-medium">
            Secret key
            <input
              id={secretId}
              name="alpaca_data_secret"
              type={fieldType}
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              disabled={saving}
              required
              minLength={8}
              maxLength={256}
              autoComplete="off"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              className="min-h-12 w-full rounded-sm border border-control bg-surface px-3 text-base"
            />
          </label>
          <p className="text-sm text-muted">Paste the full key without spaces or line breaks.</p>
          <label className="flex min-h-11 items-center gap-2 text-sm">
            <input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} disabled={saving} />
            Show newly entered keys
          </label>
          {error ? (
            <div role="alert" className="rounded-md bg-danger-bg px-3 py-2 text-sm text-danger">
              {error}
            </div>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <button type="submit" disabled={saving} className="min-h-11 rounded-sm bg-primary px-4 text-sm font-medium text-primary-fg disabled:opacity-40">
              {saving ? "Saving…" : "Save secret"}
            </button>
            <Dialog.Close asChild>
              <button type="button" disabled={saving} className="min-h-11 rounded-sm border border-control px-4 text-sm">
                Cancel
              </button>
            </Dialog.Close>
          </div>
        </form>
      </Dialog.Content>
    </Dialog.Portal>
  );
}
