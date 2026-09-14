import { DeskError } from "./util.ts";

const FIXTURE_TICKERS = new Set(["ALFA", "BRAV", "CHRL", "DELT", "ECHO", "FOXT", "GOLF", "HOTL"]);

/** Positive qty, no leading zeros. Fractional names like 0.5 are allowed; 0 and 0.000 are not. */
export const QTY_RE = /^(?:0\.(?!0+$)[0-9]{1,9}|[1-9][0-9]*(?:\.[0-9]{1,9})?)$/;
export const NOTIONAL_RE = /^(?:0\.(?!0+$)[0-9]{1,2}|[1-9][0-9]*(?:\.[0-9]{1,2})?)$/;
export const LIMIT_RE = /^(?:0\.(?!0+$)[0-9]{1,4}|[1-9][0-9]*(?:\.[0-9]{1,4})?)$/;
export const SYMBOL_RE = /^[A-Z][A-Z.]{0,9}$/;

export function assertVenueMode(mode: "PAPER" | "LIVE"): "PAPER" {
  if (mode === "LIVE") {
    throw new DeskError("LIVE_DISABLED", "This workspace is paper-only. Live Alpaca orders are not available.", 422);
  }
  return "PAPER";
}

/** Reject-then-normalize. Do not strip hyphens or digits — a repaired symbol is not sent. */
export function venueTicker(raw: string): string | null {
  const s = raw.trim().toUpperCase();
  if (s.startsWith("SEC-")) return null;
  if (FIXTURE_TICKERS.has(s)) return null;
  if (!SYMBOL_RE.test(s)) return null;
  return s;
}

/** Floor(dollars / last) to 4 decimal places using integer cents/micros. No IEEE Number(). */
export function qtyFromNotional(dollars: string, last: string): string {
  if (!NOTIONAL_RE.test(dollars)) {
    throw new DeskError("INVALID_SIZE", "Cannot size off-hours order", 422);
  }
  if (!/^[0-9]+(?:\.[0-9]{1,6})?$/.test(last) || last === "0" || /^0\.0+$/.test(last)) {
    throw new DeskError("INVALID_SIZE", "Cannot size off-hours order", 422);
  }
  const [dw, df = ""] = dollars.split(".");
  const [lw, lf = ""] = last.split(".");
  const d2 = BigInt(dw + df.padEnd(2, "0"));
  const l6 = BigInt(lw + lf.padEnd(6, "0"));
  if (d2 <= 0n || l6 <= 0n) throw new DeskError("INVALID_SIZE", "Cannot size off-hours order", 422);
  const q4 = (d2 * 100_000_000n) / l6;
  if (q4 < 1n) throw new DeskError("INVALID_SIZE", "Notional too small for last price", 422);
  const whole = q4 / 10000n;
  const frac = (q4 % 10000n).toString().padStart(4, "0");
  return `${whole.toString()}.${frac}`;
}
