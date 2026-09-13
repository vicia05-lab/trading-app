import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { Drawer } from "@/components/drawer";
import { TickerTape } from "@/components/ticker-tape";
import { postAlpacaOrder } from "@/desk/server-fns";

const Ctx = createContext<{ openTicker: (symbol: string) => void }>({ openTicker: () => {} });

export function useTickerQuote() {
  return useContext(Ctx);
}

export function TickerQuoteProvider({ children }: { children: ReactNode }) {
  const [symbol, setSymbol] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const openTicker = useCallback((raw: string) => {
    const s = raw.trim().toUpperCase();
    if (!s) return;
    setNote(null);
    setSymbol(s);
  }, []);

  async function trade(sym: string, side: "buy" | "sell") {
    setNote(null);
    try {
      await postAlpacaOrder({
        data: {
          symbol: sym,
          side,
          type: "market",
          timeInForce: "day",
          notional: "5000.00",
          extendedHours: true,
        },
      });
      setNote(`${side === "buy" ? "Buy" : "Sell"} submitted as a paper market order for ${sym}.`);
    } catch (e) {
      setNote(e instanceof Error ? e.message : "Order was not sent.");
    }
  }

  return (
    <Ctx.Provider value={{ openTicker }}>
      {children}
      {symbol ? (
        <Drawer title={symbol} kicker="Quote & chart" onClose={() => setSymbol(null)}>
          {note ? <p className="mb-3 text-sm text-muted">{note}</p> : null}
          <TickerTape symbol={symbol} onClose={() => setSymbol(null)} onTrade={(s, side) => void trade(s, side)} />
        </Drawer>
      ) : null}
    </Ctx.Provider>
  );
}

export function TickerButton({
  symbol,
  name,
  className = "",
}: {
  symbol: string;
  name?: string | null;
  className?: string;
}) {
  const { openTicker } = useTickerQuote();
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        openTicker(symbol);
      }}
      className={"min-h-11 text-left " + className}
      aria-label={`Open quote for ${symbol}`}
    >
      <div className="font-medium text-info underline-offset-2 hover:underline">{symbol}</div>
      {name ? <div className="text-sm text-muted">{name}</div> : null}
    </button>
  );
}

export function TickerLookup() {
  const { openTicker } = useTickerQuote();
  const [value, setValue] = useState("");
  return (
    <form
      className="flex flex-wrap gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        const s = value.trim().toUpperCase();
        if (s) openTicker(s);
      }}
    >
      <label className="sr-only" htmlFor="ticker-lookup">
        Look up ticker
      </label>
      <input
        id="ticker-lookup"
        value={value}
        onChange={(e) => setValue(e.target.value.toUpperCase())}
        placeholder="AAPL"
        autoCapitalize="characters"
        autoComplete="off"
        spellCheck={false}
        className="min-h-12 w-36 rounded-sm border border-control bg-surface px-3 text-base uppercase"
      />
      <button type="submit" className="min-h-12 rounded-sm bg-primary px-4 text-sm font-medium text-primary-fg">
        Open quote
      </button>
    </form>
  );
}
