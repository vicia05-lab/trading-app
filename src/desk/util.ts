import { randomBytes } from "node:crypto";
import { ident, sha256, canon } from "../kernel/index.ts";

export class DeskError extends Error {
  code: string;
  retryable: boolean;
  http: number;
  constructor(code: string, message: string, http = 422, retryable = false) {
    super(message);
    this.name = "DeskError";
    this.code = code;
    this.http = http;
    this.retryable = retryable;
  }
}

export function asHex(v: unknown): string {
  if (v == null) throw new DeskError("INVALID_HASH", "missing hash");
  if (typeof v === "string") {
    const s = v.startsWith("\\x") ? v.slice(2) : v.startsWith("0x") ? v.slice(2) : v;
    return s.toLowerCase();
  }
  if (v instanceof Uint8Array || Buffer.isBuffer(v)) return Buffer.from(v).toString("hex");
  if (typeof v === "object" && v && "type" in (v as object) && (v as { type: string }).type === "Buffer") {
    return Buffer.from((v as { data: number[] }).data).toString("hex");
  }
  throw new DeskError("INVALID_HASH", "unreadable hash");
}

export function hexBuf(hex: string): Buffer {
  const h = asHex(hex);
  if (!/^[0-9a-f]{64}$/.test(h) && !/^[0-9a-f]+$/.test(h)) throw new DeskError("INVALID_HASH", "bad hex");
  return Buffer.from(h, "hex");
}

export function newId(prefix: string): string {
  const id = `${prefix}-${randomBytes(8).toString("hex")}`;
  return ident(id);
}

export function requestHash(obj: unknown): Buffer {
  return Buffer.from(sha256(canon(obj)), "hex");
}

export const ENVELOPE = {
  product_name: "Trading App" as const,
  paperOnly: true as const,
  liveTradingSupported: false as const,
  activeModelWeight: "0" as const,
};

export type DeskRole = "OPERATOR" | "REVIEWER" | "SERVICE";

export function rfc3339(d: Date): string {
  return d.toISOString().replace(/\.(\d{3})Z$/, (m, ms) => `.${ms}000Z`);
}

export function etInstant(date: string, hm: string): Date {
  // date YYYY-MM-DD, hm HH:MM in America/New_York. September 2026 is EDT (UTC-4).
  const [h, min] = hm.split(":").map(Number);
  const [y, m, d] = date.split("-").map(Number);
  // Determine offset via a formatter
  const probe = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    timeZoneName: "shortOffset",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(probe);
  const tz = parts.find((p) => p.type === "timeZoneName")?.value ?? "GMT-4";
  const off = tz.replace("GMT", "").replace("UTC", "") || "-4";
  const sign = off.startsWith("-") ? -1 : 1;
  const [oh, om = "0"] = off.replace("+", "").replace("-", "").split(":");
  const offsetMin = sign * (Number(oh) * 60 + Number(om));
  return new Date(Date.UTC(y, m - 1, d, h, min, 0) - offsetMin * 60 * 1000);
}

export function addSeconds(d: Date, s: number): Date {
  return new Date(d.getTime() + s * 1000);
}

export function jsonCanon(obj: unknown): string {
  return canon(obj).toString("utf8");
}
