import { useEffect, useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { fetchTickerDetail } from "@/desk/server-fns";
import type { TickerDetail, TapeBar } from "@/desk/alpaca-types";
import { Empty, Err, Stat } from "@/components/app-shell";

type Range = "1D" | "5D" | "1M" | "6M";

function fmtTime(iso: string, range: Range): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  if (range === "1D") {
    return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  }
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function pickBars(tape: TickerDetail, range: Range): TapeBar[] {
  if (range === "1D") {
    const day = tape.bars_intraday.slice(-120);
    return day.length ? day : tape.bars_daily.slice(-2);
  }
  if (range === "5D") {
    const intra = tape.bars_intraday;
    return intra.length > 20 ? intra : tape.bars_daily.slice(-5);
  }
  if (range === "1M") return tape.bars_daily.slice(-22);
  return tape.bars_daily.slice(-130);
}

function volLabel(v: string | null): string {
  if (!v) return "—";
  const n = Number(v);
  if (!Number.isFinite(n)) return v;
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString("en-US");
}

export function TickerTape({
  symbol,
  onClose,
  onTrade,
}: {
  symbol: string;
  onClose: () => void;
  onTrade: (symbol: string, side: "buy" | "sell") => void;
}) {
  const [tape, setTape] = useState<TickerDetail | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [range, setRange] = useState<Range>("1D");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load(silent: boolean) {
      if (!silent) setLoading(true);
      setErr(null);
      try {
        const d = await fetchTickerDetail({ data: { symbol } });
        if (!cancelled) setTape(d);
      } catch (e) {
        if (!cancelled) {
          const raw = e instanceof Error ? e.message : "Could not load ticker";
          setErr(
            raw.includes("Alpaca keys") || raw.includes("ALPACA_NOT_CONNECTED")
              ? "Save Alpaca keys in Admin to load a live quote for listed tickers."
              : raw,
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load(false);
    const id = window.setInterval(() => void load(true), 12000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [symbol]);

  const bars = useMemo(() => (tape ? pickBars(tape, range) : []), [tape, range]);
  const down = Number(tape?.change_pct ?? 0) < 0;
  const chartData = bars.map((b) => ({ t: b.t, c: b.c, v: b.v }));
  const stroke = down ? "var(--color-danger)" : "var(--color-gain)";
  void onClose;

  return (
    <div>
      <p className="text-sm text-muted">{tape?.name ?? (loading ? "Loading…" : "—")}</p>
      <div className="mt-1 flex flex-wrap items-baseline gap-3">
        <span className="font-mono text-3xl tabular-nums tracking-tight">{tape?.last ?? "—"}</span>
        <span className={"font-mono text-sm tabular-nums " + (down ? "text-danger" : "text-gain")}>
          {tape?.change == null ? "—" : `${Number(tape.change) > 0 ? "+" : ""}${tape.change}`}{" "}
          {tape?.change_pct == null ? "" : `(${Number(tape.change_pct) > 0 ? "+" : ""}${tape.change_pct}%)`}
        </span>
        <span className="text-xs text-muted">{tape?.exchange ?? ""}</span>
      </div>
      {tape?.notice ? <p className="mt-2 text-sm text-warn">{tape.notice}</p> : null}

      {err ? (
        <div className="mt-3">
          <Err>{err}</Err>
        </div>
      ) : null}

      <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
        <Stat label="Bid" value={tape?.bid ?? "—"} hint={tape?.bid_size ?? undefined} />
        <Stat label="Ask" value={tape?.ask ?? "—"} hint={tape?.ask_size ?? undefined} />
        <Stat label="Open" value={tape?.open ?? "—"} />
        <Stat label="Prev close" value={tape?.prev_close ?? "—"} />
        <Stat label="High" value={tape?.high ?? "—"} />
        <Stat label="Low" value={tape?.low ?? "—"} />
        <Stat label="Volume" value={volLabel(tape?.volume ?? null)} />
        <Stat label="VWAP" value={tape?.vwap ?? "—"} />
        <Stat label="52-week high" value={tape?.week52_high ?? "—"} />
        <Stat label="52-week low" value={tape?.week52_low ?? "—"} />
      </div>

      <div className="mt-4 mb-2 flex flex-wrap gap-1">
        {(["1D", "5D", "1M", "6M"] as const).map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setRange(r)}
            className={
              "min-h-11 rounded-sm px-3 text-sm " +
              (range === r ? "bg-primary text-primary-fg" : "border border-border text-muted")
            }
          >
            {r}
          </button>
        ))}
      </div>

      <div className="mb-4 h-56 w-full sm:h-72">
        {loading && !tape ? (
          <Empty>Loading chart…</Empty>
        ) : chartData.length < 2 ? (
          <Empty>No bar history for this range.</Empty>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="tapeFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={stroke} stopOpacity={0.28} />
                  <stop offset="100%" stopColor={stroke} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--color-border)" vertical={false} />
              <XAxis
                dataKey="t"
                tickFormatter={(v) => fmtTime(String(v), range)}
                tick={{ fill: "var(--color-muted)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                minTickGap={28}
              />
              <YAxis
                domain={["auto", "auto"]}
                tick={{ fill: "var(--color-muted)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={56}
                tickFormatter={(v) => (typeof v === "number" ? v.toFixed(2) : String(v))}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--color-surface)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 8,
                  color: "var(--color-fg)",
                  fontFamily: "var(--font-mono)",
                  fontSize: 12,
                }}
                labelFormatter={(v) => fmtTime(String(v), range)}
                formatter={(value) => [typeof value === "number" ? value.toFixed(3) : String(value), "Last"]}
              />
              <Area type="monotone" dataKey="c" stroke={stroke} fill="url(#tapeFill)" strokeWidth={1.5} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {tape?.tradable ? (
        <div className="mb-4 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            className="min-h-12 flex-1 rounded-sm bg-gain px-4 text-sm font-medium text-primary-fg"
            onClick={() => onTrade(symbol, "buy")}
          >
            Buy {symbol}
          </button>
          <button
            type="button"
            className="min-h-12 flex-1 rounded-sm bg-danger px-4 text-sm font-medium text-primary-fg"
            onClick={() => onTrade(symbol, "sell")}
          >
            Sell {symbol}
          </button>
        </div>
      ) : (
        <p className="mb-4 text-sm text-muted">Paper buy/sell is available on listed symbols after Alpaca keys are saved.</p>
      )}

      <div>
        <h3 className="mb-2 text-sm font-semibold">News</h3>
        {!tape || tape.news.length === 0 ? (
          <Empty>No headlines for this name.</Empty>
        ) : (
          <ul className="grid gap-2">
            {tape.news.map((n) => (
              <li key={n.id} className="rounded-sm border border-border bg-subtle px-3 py-2">
                {n.url ? (
                  <a href={n.url} target="_blank" rel="noreferrer" className="text-sm leading-snug hover:underline">
                    {n.headline}
                  </a>
                ) : (
                  <p className="text-sm leading-snug">{n.headline}</p>
                )}
                <p className="mt-1 font-mono text-[11px] text-muted">
                  {[n.source, n.created_at ? n.created_at.slice(0, 16).replace("T", " ") : null].filter(Boolean).join(" · ")}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
