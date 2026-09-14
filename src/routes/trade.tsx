import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell, Badge, Empty, Err, PageHeader, Panel, Stat } from "@/components/app-shell";
import { AlpacaKeyInsert } from "@/components/alpaca-keys";
import {
  fetchAlpacaDesk,
  postAlpacaCancel,
  postAlpacaClose,
  postAlpacaOrder,
} from "@/desk/server-fns";

export const Route = createFileRoute("/trade")({
  head: () => ({ meta: [{ title: "Trade | Trading App" }] }),
  component: Trade,
});

type Desk = Awaited<ReturnType<typeof fetchAlpacaDesk>>;

function field(row: Record<string, string | boolean | null> | undefined, key: string): string {
  if (!row) return "—";
  const v = row[key];
  if (v == null || v === "") return "—";
  return String(v);
}

function Trade() {
  const [desk, setDesk] = useState<Desk | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function reload() {
    const d = await fetchAlpacaDesk();
    setDesk(d);
  }

  useEffect(() => {
    void reload().catch((e) => setError(e instanceof Error ? e.message : "Could not load the paper desk"));
  }, []);

  return (
    <AppShell>
      <div className="mx-auto flex max-w-[1040px] flex-col gap-6">
        <PageHeader
          title="Paper trade"
          purpose="Alpaca paper venue only. Earnings research stays on its own book. Live cash is disabled."
        />
        {error ? <Err>{error}</Err> : null}
        {!desk ? <Empty>Loading paper desk…</Empty> : <DeskBody desk={desk} onChanged={reload} />}
      </div>
    </AppShell>
  );
}

function DeskBody({ desk, onChanged }: { desk: Desk; onChanged: () => Promise<void> }) {
  const mode = desk.status.mode;
  const connected = desk.status.connected;
  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={connected && mode === "PAPER" ? "success" : "warn"}>{connected ? mode ?? "CONNECTED" : "NOT CONNECTED"}</Badge>
        <span className="text-sm text-muted">
          {desk.status.trading_host ?? "No venue host until paper keys are saved on this page."}
        </span>
        {desk.can_mutate ? null : <Badge tone="warn">Reviewer — read only</Badge>}
      </div>

      {!connected ? (
        <Panel title="Connect paper keys">
          <p className="mb-4 text-sm text-muted">
            Paste Alpaca paper keys. These are stored on the venue singleton and are not the Admin market-data secret.
            Live keys are rejected.
          </p>
          <AlpacaKeyInsert />
        </Panel>
      ) : null}

      {connected && "error" in desk && desk.error ? <Err>{desk.error}</Err> : null}

      {connected && "account" in desk && desk.account ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Equity" value={field(desk.account, "equity")} />
          <Stat label="Buying power" value={field(desk.account, "buying_power")} />
          <Stat label="Cash" value={field(desk.account, "cash")} />
          <Stat
            label="Clock"
            value={
              desk.clock && (desk.clock.is_open === true || desk.clock.is_open === "true") ? "Market open" : "Market closed"
            }
            hint={field(desk.clock, "next_open")}
          />
        </div>
      ) : null}

      {connected ? (
        <Ticket canMutate={desk.can_mutate} quotes={"quotes" in desk ? desk.quotes : []} onChanged={onChanged} />
      ) : null}

      {connected && "positions" in desk ? (
        <Positions rows={desk.positions ?? []} canMutate={desk.can_mutate} onChanged={onChanged} />
      ) : null}

      {connected && "orders" in desk ? (
        <Orders rows={desk.orders ?? []} canMutate={desk.can_mutate} onChanged={onChanged} />
      ) : null}

      <p className="text-sm text-muted">
        Research freezes live on <Link to="/earnings">Earnings</Link>. This page does not write the kernel clock.
      </p>
    </>
  );
}

function Ticket({
  canMutate,
  quotes,
  onChanged,
}: {
  canMutate: boolean;
  quotes: Array<{ symbol: string; last: string | null; bid: string | null; ask: string | null }> | undefined;
  onChanged: () => Promise<void>;
}) {
  const [symbol, setSymbol] = useState("AAPL");
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [type, setType] = useState<"market" | "limit">("market");
  const [tif, setTif] = useState<"day" | "gtc" | "ioc">("day");
  const [sizeMode, setSizeMode] = useState<"notional" | "qty">("notional");
  const [notional, setNotional] = useState("5000.00");
  const [qty, setQty] = useState("");
  const [limitPrice, setLimitPrice] = useState("");
  const [extended, setExtended] = useState(false);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const quote = quotes?.find((q) => q.symbol === symbol.trim().toUpperCase());

  async function submit() {
    if (!canMutate) return;
    setBusy(true);
    setErr(null);
    setNote(null);
    try {
      const rec = await postAlpacaOrder({
        data: {
          symbol: symbol.trim(),
          side,
          type,
          timeInForce: tif,
          notional: sizeMode === "notional" ? notional.trim() : undefined,
          qty: sizeMode === "qty" ? qty.trim() : undefined,
          limitPrice: type === "limit" ? limitPrice.trim() : undefined,
          extendedHours: extended || undefined,
        },
      });
      setNote(`Submitted ${String(rec.status ?? "order")} ${String(rec.id ?? "")}`.trim());
      await onChanged();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Order rejected");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Panel title="Order ticket" aside="paper-api.alpaca.markets">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="text-sm">
          Symbol
          <input className="mt-1 w-full rounded-sm border border-border bg-bg px-2 py-2 font-mono uppercase" value={symbol} onChange={(e) => setSymbol(e.target.value)} maxLength={10} />
        </label>
        <label className="text-sm">
          Side
          <select className="mt-1 w-full rounded-sm border border-border bg-bg px-2 py-2" value={side} onChange={(e) => setSide(e.target.value as "buy" | "sell")}>
            <option value="buy">Buy</option>
            <option value="sell">Sell</option>
          </select>
        </label>
        <label className="text-sm">
          Type
          <select className="mt-1 w-full rounded-sm border border-border bg-bg px-2 py-2" value={type} onChange={(e) => setType(e.target.value as "market" | "limit")}>
            <option value="market">Market</option>
            <option value="limit">Limit</option>
          </select>
        </label>
        <label className="text-sm">
          Time in force
          <select className="mt-1 w-full rounded-sm border border-border bg-bg px-2 py-2" value={tif} onChange={(e) => setTif(e.target.value as "day" | "gtc" | "ioc")}>
            <option value="day">Day</option>
            <option value="gtc">GTC</option>
            <option value="ioc">IOC</option>
          </select>
        </label>
        <label className="text-sm">
          Size
          <select className="mt-1 w-full rounded-sm border border-border bg-bg px-2 py-2" value={sizeMode} onChange={(e) => setSizeMode(e.target.value as "notional" | "qty")}>
            <option value="notional">Dollar notional</option>
            <option value="qty">Share quantity</option>
          </select>
        </label>
        {sizeMode === "notional" ? (
          <label className="text-sm">
            Notional
            <input className="mt-1 w-full rounded-sm border border-border bg-bg px-2 py-2 font-mono" value={notional} onChange={(e) => setNotional(e.target.value)} />
          </label>
        ) : (
          <label className="text-sm">
            Quantity
            <input className="mt-1 w-full rounded-sm border border-border bg-bg px-2 py-2 font-mono" value={qty} onChange={(e) => setQty(e.target.value)} />
          </label>
        )}
        {type === "limit" ? (
          <label className="text-sm">
            Limit price
            <input className="mt-1 w-full rounded-sm border border-border bg-bg px-2 py-2 font-mono" value={limitPrice} onChange={(e) => setLimitPrice(e.target.value)} />
          </label>
        ) : null}
        <label className="flex items-end gap-2 text-sm">
          <input type="checkbox" checked={extended} onChange={(e) => setExtended(e.target.checked)} />
          Extended hours
        </label>
      </div>
      <p className="mt-3 text-xs text-muted">
        Last {quote?.last ?? "—"} · Bid {quote?.bid ?? "—"} · Ask {quote?.ask ?? "—"}
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button type="button" disabled={!canMutate || busy} onClick={() => void submit()} className="inline-flex min-h-11 items-center rounded-sm bg-primary px-4 text-sm font-medium text-primary-fg disabled:opacity-50">
          {busy ? "Submitting…" : canMutate ? `Submit ${side}` : "Reviewer cannot submit"}
        </button>
        {note ? <span className="text-sm">{note}</span> : null}
        {err ? <span className="text-sm text-danger">{err}</span> : null}
      </div>
    </Panel>
  );
}

function Positions({
  rows,
  canMutate,
  onChanged,
}: {
  rows: Array<Record<string, string | boolean | null>>;
  canMutate: boolean;
  onChanged: () => Promise<void>;
}) {
  const [err, setErr] = useState<string | null>(null);
  async function close(symbol: string) {
    setErr(null);
    try {
      await postAlpacaClose({ data: { symbol } });
      await onChanged();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Close failed");
    }
  }
  return (
    <Panel title="Positions">
      {err ? <p className="mb-2 text-sm text-danger">{err}</p> : null}
      {rows.length === 0 ? (
        <p className="text-sm text-muted">No open paper positions.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[36rem] text-left text-sm">
            <thead className="text-xs text-muted">
              <tr>
                <th className="pb-2 font-medium">Symbol</th>
                <th className="pb-2 font-medium">Qty</th>
                <th className="pb-2 font-medium">Avg</th>
                <th className="pb-2 font-medium">Mkt</th>
                <th className="pb-2 font-medium">P/L</th>
                <th className="pb-2 font-medium" />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={field(r, "symbol")} className="h-12 border-t border-border">
                  <td className="font-mono">{field(r, "symbol")}</td>
                  <td className="font-mono">{field(r, "qty")}</td>
                  <td className="font-mono">{field(r, "avg_entry_price")}</td>
                  <td className="font-mono">{field(r, "current_price")}</td>
                  <td className="font-mono">{field(r, "unrealized_pl")}</td>
                  <td>
                    {canMutate ? (
                      <button type="button" className="text-sm text-info" onClick={() => void close(field(r, "symbol"))}>
                        Close
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}

function Orders({
  rows,
  canMutate,
  onChanged,
}: {
  rows: Array<Record<string, string | boolean | null>>;
  canMutate: boolean;
  onChanged: () => Promise<void>;
}) {
  const [err, setErr] = useState<string | null>(null);
  async function cancel(orderId: string) {
    setErr(null);
    try {
      await postAlpacaCancel({ data: { orderId } });
      await onChanged();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Cancel failed");
    }
  }
  return (
    <Panel title="Open orders">
      {err ? <p className="mb-2 text-sm text-danger">{err}</p> : null}
      {rows.length === 0 ? (
        <p className="text-sm text-muted">No open paper orders.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[36rem] text-left text-sm">
            <thead className="text-xs text-muted">
              <tr>
                <th className="pb-2 font-medium">Symbol</th>
                <th className="pb-2 font-medium">Side</th>
                <th className="pb-2 font-medium">Type</th>
                <th className="pb-2 font-medium">Qty / $</th>
                <th className="pb-2 font-medium">Status</th>
                <th className="pb-2 font-medium" />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={field(r, "id")} className="h-12 border-t border-border">
                  <td className="font-mono">{field(r, "symbol")}</td>
                  <td>{field(r, "side")}</td>
                  <td>{field(r, "type")}</td>
                  <td className="font-mono">{field(r, "qty") !== "—" ? field(r, "qty") : field(r, "notional")}</td>
                  <td>{field(r, "status")}</td>
                  <td>
                    {canMutate && field(r, "id") !== "—" ? (
                      <button type="button" className="text-sm text-info" onClick={() => void cancel(field(r, "id"))}>
                        Cancel
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}
