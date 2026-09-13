import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { DeskShell, Empty, Err, Panel, Stat } from "@/components/desk-shell";
import { TickerTape } from "@/components/ticker-tape";
import {
  fetchAlpacaDesk,
  fetchAlpacaOrders,
  fetchAutoStatus,
  postAlpacaCancel,
  postAlpacaClose,
  postAlpacaOrder,
  postAlpacaWatchlist,
  runAutoCycle,
} from "@/desk/server-fns";

export const Route = createFileRoute("/trade")({ component: Trade });

function Trade() {
  return (
    <DeskShell>
      <TradeLoader />
    </DeskShell>
  );
}

function TradeLoader() {
  const [data, setData] = useState<Awaited<ReturnType<typeof fetchAlpacaDesk>> | null>(null);
  const [error, setError] = useState<string | null>(null);
  async function reload() {
    const d = await fetchAlpacaDesk();
    setData(d);
  }
  useEffect(() => {
    void reload().catch((e) => setError(e instanceof Error ? e.message : "Could not load Alpaca desk"));
  }, []);
  if (error) return <Err>{error}</Err>;
  if (!data) return <Empty>Connecting to Alpaca…</Empty>;
  return <TradeBody data={data} reload={reload} />;
}

function TradeBody({
  data,
  reload,
}: {
  data: Awaited<ReturnType<typeof fetchAlpacaDesk>>;
  reload: () => Promise<void>;
}) {
  const [note, setNote] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [history, setHistory] = useState<Array<Record<string, string | boolean | null>> | null>(null);
  const [watchText, setWatchText] = useState(data.status.watchlist.join(", "));

  const symbolDefault = data.status.watchlist[0] ?? "SPY";
  const [symbol, setSymbol] = useState(symbolDefault);
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [type, setType] = useState<"market" | "limit">("market");
  const [tif, setTif] = useState<"day" | "gtc" | "ioc">("day");
  const [sizeMode, setSizeMode] = useState<"qty" | "notional">("notional");
  const [qty, setQty] = useState("1");
  const [notional, setNotional] = useState("1000.00");
  const [limitPrice, setLimitPrice] = useState("");
  const [extended, setExtended] = useState(false);
  const [confirmLive, setConfirmLive] = useState(false);
  const [tape, setTape] = useState<string | null>(null);
  const [lookup, setLookup] = useState("");

  async function run(label: string, fn: () => Promise<unknown>) {
    setBusy(true);
    setErr(null);
    setNote(null);
    try {
      await fn();
      setNote(label);
      await reload();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Action failed");
    } finally {
      setBusy(false);
    }
  }

  if (!data.status.connected) {
    return (
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-xl font-medium tracking-tight">Trade</h1>
          <p className="mt-1 text-sm text-muted">Alpaca is the market-data and order venue. Keys go on Admin.</p>
        </div>
        <Panel title="Not connected">
          <Empty>No Alpaca keys stored. Operator pastes key id and secret on Admin, then returns here.</Empty>
          <Link to="/admin" className="mt-3 inline-flex min-h-11 items-center rounded-md bg-primary px-4 text-sm text-primary-fg">
            Open Admin
          </Link>
        </Panel>
      </div>
    );
  }

  const live = data.status.mode === "LIVE";
  const quotes = "quotes" in data && data.quotes ? data.quotes : [];
  const positions = "positions" in data && data.positions ? data.positions : [];
  const orders = "orders" in data && data.orders ? data.orders : [];
  const account = "account" in data && data.account ? data.account : null;
  const clock = "clock" in data && data.clock ? data.clock : null;
  const loadErr = "error" in data ? data.error : null;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-medium tracking-tight">Trade</h1>
        <p className="mt-1 text-sm text-muted">
          {live ? "Live Alpaca — auto-execution is off. Manual ticket only." : "Paper auto-execution is on. Watchlist names that pass the pullback/trend screen get a $5,000 ticket (max 3)."}{" "}
          Key {data.status.api_key_masked}
        </p>
      </div>
      <AutoDeskPanel />
      {live ? (
        <div className="rounded-lg border border-danger/40 bg-sunken px-3 py-2 text-sm text-danger" role="status">
          LIVE mode. A market order is not undoable. Confirm the checkbox on the ticket before sending.
        </div>
      ) : null}
      {loadErr ? <Err>{loadErr}</Err> : null}
      {err ? <Err>{err}</Err> : null}
      {note ? <p className="text-sm text-muted">{note}</p> : null}

      {tape ? (
        <TickerTape
          symbol={tape}
          onClose={() => setTape(null)}
          onTrade={(s, nextSide) => {
            setSymbol(s);
            setSide(nextSide);
          }}
        />
      ) : null}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Panel title="Clock" aside={clock?.is_open === true || clock?.is_open === "true" ? "OPEN" : "closed"}>
          <Stat label="Next open" value={fmtTs(clock?.next_open)} />
        </Panel>
        <Panel title="Equity">
          <Stat label="Portfolio" value={money(account?.portfolio_value)} hint={money(account?.equity)} />
        </Panel>
        <Panel title="Cash">
          <Stat label="Buying power" value={money(account?.buying_power)} hint={money(account?.cash)} />
        </Panel>
        <Panel title="Account" aside={String(account?.status ?? "—")}>
          <Stat
            label="Number"
            value={account?.account_number ? maskAcct(String(account.account_number)) : "—"}
            hint={live ? "LIVE" : "PAPER"}
          />
        </Panel>
      </div>

      <Panel title="Quotes" aside="Tap a name for the live tape">
        <form
          className="mb-3 flex flex-col gap-2 sm:flex-row"
          onSubmit={(e) => {
            e.preventDefault();
            const s = lookup.trim().toUpperCase();
            if (!s) return;
            setTape(s);
            setSymbol(s);
            setLookup("");
          }}
        >
          <input
            value={lookup}
            onChange={(e) => setLookup(e.target.value.toUpperCase())}
            placeholder="Look up ticker"
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
            className="min-h-11 flex-1 rounded-md border border-border bg-sunken px-3 font-mono text-sm"
          />
          <button type="submit" className="min-h-11 rounded-md border border-border px-4 text-sm">
            Open tape
          </button>
        </form>
        {quotes.length === 0 ? (
          <Empty>No snapshots. Save keys, then refresh.</Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[36rem] text-left text-sm">
              <thead className="text-[11px] uppercase tracking-wider text-muted">
                <tr>
                  <th className="pb-2 font-medium">Symbol</th>
                  <th className="pb-2 font-medium">Last</th>
                  <th className="pb-2 font-medium">Bid</th>
                  <th className="pb-2 font-medium">Ask</th>
                  <th className="pb-2 font-medium">Day %</th>
                </tr>
              </thead>
              <tbody className="font-mono text-xs">
                {quotes.map((q) => (
                  <tr
                    key={q.symbol}
                    className="cursor-pointer border-t border-border hover:bg-sunken"
                    onClick={() => {
                      setSymbol(q.symbol);
                      setTape(q.symbol);
                    }}
                  >
                    <td className="py-2 font-medium text-fg">{q.symbol}</td>
                    <td className="py-2">{q.last ?? "—"}</td>
                    <td className="py-2">{q.bid ?? "—"}</td>
                    <td className="py-2">{q.ask ?? "—"}</td>
                    <td className={"py-2 " + ((Number(q.change_pct) || 0) < 0 ? "text-danger" : "")}>
                      {q.change_pct == null ? "—" : `${q.change_pct}%`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {data.can_mutate ? (
          <form
            className="mt-3 flex flex-col gap-2 sm:flex-row"
            onSubmit={(e) => {
              e.preventDefault();
              void run("Watchlist saved", () =>
                postAlpacaWatchlist({
                  data: { watchlist: watchText.split(/[\s,]+/).filter(Boolean) },
                }),
              );
            }}
          >
            <input
              value={watchText}
              onChange={(e) => setWatchText(e.target.value)}
              className="min-h-11 flex-1 rounded-md border border-border bg-sunken px-3 font-mono text-sm"
              placeholder="SPY, QQQ, NVDA"
            />
            <button type="submit" disabled={busy} className="min-h-11 rounded-md border border-border px-4 text-sm">
              Save watchlist
            </button>
          </form>
        ) : null}
      </Panel>

      <Panel title="Order ticket" aside={data.can_mutate ? undefined : "operator only"}>
        {!data.can_mutate ? (
          <Empty>Reviewer can read the book. Operator sends orders.</Empty>
        ) : (
          <form
            className="grid gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              void run(`Order ${side} ${symbol}`, () =>
                postAlpacaOrder({
                  data: {
                    symbol,
                    side,
                    type,
                    timeInForce: tif,
                    qty: sizeMode === "qty" ? qty : undefined,
                    notional: sizeMode === "notional" ? notional : undefined,
                    limitPrice: type === "limit" ? limitPrice : undefined,
                    extendedHours: extended,
                    confirmLive,
                  },
                }),
              );
            }}
          >
            <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
              <label className="grid gap-1 text-sm">
                <span className="text-[11px] uppercase tracking-wider text-muted">Symbol</span>
                <input
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                  className="min-h-11 rounded-md border border-border bg-sunken px-3 font-mono text-sm"
                />
              </label>
              <label className="grid gap-1 text-sm">
                <span className="text-[11px] uppercase tracking-wider text-muted">Side</span>
                <select
                  value={side}
                  onChange={(e) => setSide(e.target.value as "buy" | "sell")}
                  className="min-h-11 rounded-md border border-border bg-sunken px-3 text-sm"
                >
                  <option value="buy">Buy</option>
                  <option value="sell">Sell</option>
                </select>
              </label>
              <label className="grid gap-1 text-sm">
                <span className="text-[11px] uppercase tracking-wider text-muted">Type</span>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as "market" | "limit")}
                  className="min-h-11 rounded-md border border-border bg-sunken px-3 text-sm"
                >
                  <option value="market">Market</option>
                  <option value="limit">Limit</option>
                </select>
              </label>
              <label className="grid gap-1 text-sm">
                <span className="text-[11px] uppercase tracking-wider text-muted">TIF</span>
                <select
                  value={tif}
                  onChange={(e) => setTif(e.target.value as "day" | "gtc" | "ioc")}
                  className="min-h-11 rounded-md border border-border bg-sunken px-3 text-sm"
                >
                  <option value="day">Day</option>
                  <option value="gtc">GTC</option>
                  <option value="ioc">IOC</option>
                </select>
              </label>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <label className="flex min-h-11 items-center gap-2 rounded-md border border-border px-3 text-sm">
                <input type="radio" checked={sizeMode === "notional"} onChange={() => setSizeMode("notional")} />
                Dollars
              </label>
              <label className="flex min-h-11 items-center gap-2 rounded-md border border-border px-3 text-sm">
                <input type="radio" checked={sizeMode === "qty"} onChange={() => setSizeMode("qty")} />
                Shares
              </label>
              {sizeMode === "notional" ? (
                <input
                  value={notional}
                  onChange={(e) => setNotional(e.target.value)}
                  className="min-h-11 flex-1 rounded-md border border-border bg-sunken px-3 font-mono text-sm"
                  inputMode="decimal"
                />
              ) : (
                <input
                  value={qty}
                  onChange={(e) => setQty(e.target.value)}
                  className="min-h-11 flex-1 rounded-md border border-border bg-sunken px-3 font-mono text-sm"
                  inputMode="decimal"
                />
              )}
              {type === "limit" ? (
                <input
                  value={limitPrice}
                  onChange={(e) => setLimitPrice(e.target.value)}
                  placeholder="Limit"
                  className="min-h-11 flex-1 rounded-md border border-border bg-sunken px-3 font-mono text-sm"
                  inputMode="decimal"
                />
              ) : null}
            </div>
            <label className="flex items-center gap-2 text-sm text-muted">
              <input type="checkbox" checked={extended} onChange={(e) => setExtended(e.target.checked)} />
              Extended hours (limit only on most sessions)
            </label>
            {live ? (
              <label className="flex items-start gap-2 text-sm text-danger">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={confirmLive}
                  onChange={(e) => setConfirmLive(e.target.checked)}
                />
                <span>Send this as a live order. I accept the fill risk.</span>
              </label>
            ) : null}
            <button
              type="submit"
              disabled={busy || (live && !confirmLive)}
              className={
                "min-h-11 rounded-md px-4 text-sm " +
                (side === "sell" ? "border border-danger text-danger" : "bg-primary text-primary-fg") +
                " disabled:opacity-40"
              }
            >
              {busy ? "Sending…" : `${side === "buy" ? "Buy" : "Sell"} ${symbol}`}
            </button>
          </form>
        )}
      </Panel>

      <Panel title="Positions" aside={`${positions.length} open`}>
        {positions.length === 0 ? (
          <Empty>No open Alpaca positions.</Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[40rem] text-left text-sm">
              <thead className="text-[11px] uppercase tracking-wider text-muted">
                <tr>
                  <th className="pb-2 font-medium">Symbol</th>
                  <th className="pb-2 font-medium">Qty</th>
                  <th className="pb-2 font-medium">Avg</th>
                  <th className="pb-2 font-medium">Last</th>
                  <th className="pb-2 font-medium">Mkt</th>
                  <th className="pb-2 font-medium">uP/L</th>
                  <th className="pb-2 font-medium"></th>
                </tr>
              </thead>
              <tbody className="font-mono text-xs">
                {positions.map((p, i) => (
                  <tr
                    key={String(p.symbol ?? i)}
                    className="cursor-pointer border-t border-border hover:bg-sunken"
                    onClick={() => {
                      if (typeof p.symbol === "string") {
                        setSymbol(p.symbol);
                        setTape(p.symbol);
                      }
                    }}
                  >
                    <td className="py-2 text-fg">{String(p.symbol ?? "")}</td>
                    <td className="py-2">{String(p.qty ?? "")}</td>
                    <td className="py-2">{String(p.avg_entry_price ?? "")}</td>
                    <td className="py-2">{String(p.current_price ?? "")}</td>
                    <td className="py-2">{String(p.market_value ?? "")}</td>
                    <td className={"py-2 " + ((Number(p.unrealized_pl) || 0) < 0 ? "text-danger" : "")}>
                      {String(p.unrealized_pl ?? "")}
                    </td>
                    <td className="py-2">
                      {data.can_mutate && typeof p.symbol === "string" ? (
                        <button
                          type="button"
                          disabled={busy}
                          className="min-h-11 rounded-md border border-border px-3 text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            void run(`Closed ${p.symbol}`, () => postAlpacaClose({ data: { symbol: String(p.symbol) } }));
                          }}
                        >
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

      <Panel title="Open orders" aside={`${orders.length}`}>
        {orders.length === 0 ? (
          <Empty>No working orders.</Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[36rem] text-left text-sm">
              <thead className="text-[11px] uppercase tracking-wider text-muted">
                <tr>
                  <th className="pb-2 font-medium">Symbol</th>
                  <th className="pb-2 font-medium">Side</th>
                  <th className="pb-2 font-medium">Qty</th>
                  <th className="pb-2 font-medium">Type</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium"></th>
                </tr>
              </thead>
              <tbody className="font-mono text-xs">
                {orders.map((o, i) => (
                  <tr key={String(o.id ?? o.client_order_id ?? i)} className="border-t border-border">
                    <td className="py-2">{String(o.symbol ?? "")}</td>
                    <td className="py-2">{String(o.side ?? "")}</td>
                    <td className="py-2">{String(o.qty ?? o.notional ?? "")}</td>
                    <td className="py-2">{String(o.type ?? "")}</td>
                    <td className="py-2">{String(o.status ?? "")}</td>
                    <td className="py-2">
                      {data.can_mutate && typeof o.id === "string" ? (
                        <button
                          type="button"
                          disabled={busy}
                          className="min-h-11 rounded-md border border-border px-3 text-xs"
                          onClick={() => void run("Canceled", () => postAlpacaCancel({ data: { orderId: String(o.id) } }))}
                        >
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
        <button
          type="button"
          className="mt-3 min-h-11 rounded-md border border-border px-4 text-sm"
          onClick={() =>
            void fetchAlpacaOrders({ data: { status: "all" } })
              .then((r) => setHistory(r.orders))
              .catch((e) => setErr(e instanceof Error ? e.message : "History failed"))
          }
        >
          Load recent history
        </button>
        {history ? (
          <ul className="mt-3 space-y-1 font-mono text-xs text-muted">
            {history.slice(0, 20).map((o, i) => (
              <li key={String(o.id ?? o.client_order_id ?? i)}>
                {String(o.submitted_at ?? "").slice(0, 19)} {String(o.side ?? "")} {String(o.symbol ?? "")}{" "}
                {String(o.qty ?? o.notional ?? "")} {String(o.status ?? "")}
              </li>
            ))}
          </ul>
        ) : null}
      </Panel>
    </div>
  );
}

function AutoDeskPanel() {
  const [summary, setSummary] = useState<string | null>(null);
  const [fills, setFills] = useState<Array<{
    position_id: string;
    symbol: string;
    side: string;
    notional: string | null;
    status: string;
    last_error: string | null;
    submitted_at: string | null;
  }>>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function refresh(run: boolean) {
    setErr(null);
    try {
      const r = run ? await runAutoCycle() : await fetchAutoStatus();
      const line = "summary" in r ? r.summary : r.last_summary;
      setSummary(line);
      setFills(r.fills ?? []);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Auto-desk failed");
    }
  }

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setBusy(true);
      try {
        if (!cancelled) await refresh(true);
      } finally {
        if (!cancelled) setBusy(false);
      }
    })();
    const id = window.setInterval(() => {
      void refresh(false);
    }, 20000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  return (
    <Panel title="Auto-execution" aside={busy ? "RUNNING" : "PAPER"}>
      <p className="mb-3 text-sm leading-relaxed text-muted">
        When a watchlist name is below SPY over 5 days, above SPY over 63 days, and in a 4–25% 20-day range, the desk
        sends a $5,000 paper buy (max 3). Fixture names like ALFA are never sent to Alpaca. Live keys never auto-fire.
      </p>
      {err ? <Err>{err}</Err> : null}
      {summary ? <p className="mb-3 text-sm text-muted">{summary}</p> : null}
      <button
        type="button"
        disabled={busy}
        className="mb-3 min-h-11 rounded-md bg-primary px-4 text-sm text-primary-fg disabled:opacity-40"
        onClick={() => {
          setBusy(true);
          void refresh(true).finally(() => setBusy(false));
        }}
      >
        {busy ? "Running…" : "Run auto-desk now"}
      </button>
      {fills.length === 0 ? (
        <Empty>No automatic tickets yet. Run auto-desk after keys are in.</Empty>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[32rem] text-left text-sm">
            <thead className="text-[11px] uppercase tracking-wider text-muted">
              <tr>
                <th className="pb-2 font-medium">Symbol</th>
                <th className="pb-2 font-medium">Side</th>
                <th className="pb-2 font-medium">Notional</th>
                <th className="pb-2 font-medium">Status</th>
                <th className="pb-2 font-medium">Detail</th>
              </tr>
            </thead>
            <tbody className="font-mono text-xs">
              {fills.map((f) => (
                <tr key={f.position_id} className="border-t border-border">
                  <td className="py-2">{f.symbol}</td>
                  <td className="py-2">{f.side}</td>
                  <td className="py-2">{f.notional ?? "—"}</td>
                  <td className="py-2">{f.status}</td>
                  <td className="py-2 text-muted">{f.last_error ?? (f.submitted_at ?? "").slice(0, 19)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}

function money(v: string | boolean | null | undefined): string {
  if (v == null || typeof v === "boolean") return "—";
  const n = Number(v);
  if (!Number.isFinite(n)) return v;
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function fmtTs(v: string | boolean | null | undefined): string {
  if (typeof v !== "string" || !v) return "—";
  return v.replace("T", " ").slice(0, 16);
}

function maskAcct(n: string): string {
  return n.length <= 4 ? n : `…${n.slice(-4)}`;
}
