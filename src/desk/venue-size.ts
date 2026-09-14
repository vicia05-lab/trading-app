import { DeskError } from "./util.ts";

const FIXTURE_TICKERS = new Set(["ALFA", "BRAV", "CHRL", "DELT", "ECHO", "FOXT", "GOLF", "HOTL"]);

export function venueTicker(raw: string): string | null {
  const trimmed = raw.trim().toUpperCase();
  if (trimmed.startsWith("SEC-")) return null;
  const s = trimmed.replace(/[^A-Z.]/g, "");
  if (!s || FIXTURE_TICKERS.has(s)) return null;
  if (!/^[A-Z][A-Z.]{0,9}$/.test(s)) return null;
  return s;
}

/** Floor(dollars / last) to 4 decimal places using integer cents/micros. No IEEE Number(). */
export function qtyFromNotional(dollars: string, last: string): string {
  if (!/^[0-9]+(?:\.[0-9]{1,2})?$/.test(dollars)) {
    throw new DeskError("INVALID_SIZE", "Cannot size off-hours order", 422);
  }
  if (!/^[0-9]+(?:\.[0-9]{1,6})?$/.test(last)) {
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
