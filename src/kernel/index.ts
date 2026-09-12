/**
 * Trading App v1.2 pure serialization / numeric / evaluator kernel.
 * Port of the specification reference (section 27). Browser must not import this
 * for research labels, fills, risk counters, or hashes.
 */
import { createHash, randomBytes } from "node:crypto";

const IDENT = /^[A-Za-z0-9][A-Za-z0-9:._-]{0,63}$/;
const HEX = /^[0-9a-f]{64}$/;
const DEC = /^-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?$/;
const KEY = /^[A-Za-z_][A-Za-z0-9_]*$/;
const CANON_DEC12 = /^-?(?:0|[1-9][0-9]*)\.[0-9]{12}$/;

export class KernelError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "KernelError";
  }
}

export function ident(s: unknown): string {
  if (typeof s !== "string" || !IDENT.test(s)) throw new KernelError("INVALID_ID");
  return s;
}

export function digestBytes(s: unknown): Buffer {
  if (typeof s !== "string" || !HEX.test(s)) throw new KernelError("INVALID_SHA256_HEX");
  return Buffer.from(s, "hex");
}

export function field(b: Buffer | Uint8Array): Buffer {
  if (!Buffer.isBuffer(b) && !(b instanceof Uint8Array)) throw new KernelError("INVALID_FIELD");
  const buf = Buffer.isBuffer(b) ? b : Buffer.from(b);
  if (buf.length > 4294967295) throw new KernelError("INVALID_FIELD");
  const out = Buffer.allocUnsafe(4 + buf.length);
  out.writeUInt32BE(buf.length, 0);
  buf.copy(out, 4);
  return out;
}

export function u32(v: unknown): Buffer {
  if (typeof v !== "number" || !Number.isInteger(v) || v < 0 || v > 4294967295) {
    throw new KernelError("INVALID_UINT32");
  }
  const out = Buffer.allocUnsafe(4);
  out.writeUInt32BE(v, 0);
  return out;
}

export function sha256(data: Buffer): string {
  return createHash("sha256").update(data).digest("hex");
}

export function h(domain: string, ...parts: Buffer[]): string {
  return sha256(Buffer.concat([field(Buffer.from(domain, "ascii")), ...parts.map((p) => field(p))]));
}

function validateCanon(x: unknown, depth = 0): void {
  if (depth > 32) throw new KernelError("JSON_DEPTH_EXCEEDED");
  if (x === null || typeof x === "boolean") return;
  if (typeof x === "string") {
    Buffer.from(x, "utf8");
    return;
  }
  if (Array.isArray(x)) {
    for (const v of x) validateCanon(v, depth + 1);
    return;
  }
  if (x && typeof x === "object") {
    for (const [k, v] of Object.entries(x)) {
      if (typeof k !== "string" || !KEY.test(k)) throw new KernelError("INVALID_CANONICAL_KEY");
      validateCanon(v, depth + 1);
    }
    return;
  }
  throw new KernelError("CANONICAL_NUMBERS_MUST_BE_STRINGS");
}

function stableStringify(x: unknown): string {
  if (x === null) return "null";
  if (x === true) return "true";
  if (x === false) return "false";
  if (typeof x === "string") return JSON.stringify(x);
  if (Array.isArray(x)) return `[${x.map(stableStringify).join(",")}]`;
  if (x && typeof x === "object") {
    const keys = Object.keys(x).sort();
    return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify((x as Record<string, unknown>)[k])}`).join(",")}}`;
  }
  throw new KernelError("CANONICAL_NUMBERS_MUST_BE_STRINGS");
}

export function canon(obj: unknown): Buffer {
  validateCanon(obj);
  return Buffer.from(stableStringify(obj), "utf8");
}

function rejectNumberTokens(s: string): void {
  let inStr = false;
  let esc = false;
  for (let i = 0; i < s.length; i += 1) {
    const c = s[i];
    if (inStr) {
      if (esc) {
        esc = false;
        continue;
      }
      if (c === "\\") {
        esc = true;
        continue;
      }
      if (c === '"') inStr = false;
      continue;
    }
    if (c === '"') {
      inStr = true;
      continue;
    }
    if (c === "-" || (c >= "0" && c <= "9")) {
      throw new KernelError("CANONICAL_NUMBERS_MUST_BE_STRINGS");
    }
  }
}

function parseValue(s: string, i: { n: number }): unknown {
  skipWs(s, i);
  const c = s[i.n];
  if (c === '"') return parseString(s, i);
  if (c === "{") return parseObject(s, i);
  if (c === "[") return parseArray(s, i);
  if (s.startsWith("true", i.n)) {
    i.n += 4;
    return true;
  }
  if (s.startsWith("false", i.n)) {
    i.n += 5;
    return false;
  }
  if (s.startsWith("null", i.n)) {
    i.n += 4;
    return null;
  }
  throw new KernelError("CANONICAL_NUMBERS_MUST_BE_STRINGS");
}

function skipWs(s: string, i: { n: number }): void {
  while (i.n < s.length && (s[i.n] === " " || s[i.n] === "\n" || s[i.n] === "\r" || s[i.n] === "\t")) i.n += 1;
}

function parseString(s: string, i: { n: number }): string {
  if (s[i.n] !== '"') throw new KernelError("INVALID_JSON");
  i.n += 1;
  let out = "";
  while (i.n < s.length) {
    const c = s[i.n];
    if (c === '"') {
      i.n += 1;
      return out;
    }
    if (c === "\\") {
      i.n += 1;
      const e = s[i.n];
      const map: Record<string, string> = {
        '"': '"',
        "\\": "\\",
        "/": "/",
        b: "\b",
        f: "\f",
        n: "\n",
        r: "\r",
        t: "\t",
      };
      if (e in map) {
        out += map[e];
        i.n += 1;
        continue;
      }
      if (e === "u") {
        const hex = s.slice(i.n + 1, i.n + 5);
        if (!/^[0-9a-fA-F]{4}$/.test(hex)) throw new KernelError("INVALID_JSON");
        const code = parseInt(hex, 16);
        if (code >= 0xd800 && code <= 0xdbff) {
          if (s.slice(i.n + 5, i.n + 7) !== "\\u") throw new KernelError("INVALID_JSON");
          const hex2 = s.slice(i.n + 7, i.n + 11);
          if (!/^[0-9a-fA-F]{4}$/.test(hex2)) throw new KernelError("INVALID_JSON");
          const code2 = parseInt(hex2, 16);
          if (code2 < 0xdc00 || code2 > 0xdfff) throw new KernelError("INVALID_JSON");
          out += String.fromCodePoint(0x10000 + ((code - 0xd800) << 10) + (code2 - 0xdc00));
          i.n += 11;
          continue;
        }
        if (code >= 0xdc00 && code <= 0xdfff) throw new KernelError("INVALID_JSON");
        out += String.fromCharCode(code);
        i.n += 5;
        continue;
      }
      throw new KernelError("INVALID_JSON");
    }
    if (c.charCodeAt(0) < 0x20) throw new KernelError("INVALID_JSON");
    out += c;
    i.n += 1;
  }
  throw new KernelError("INVALID_JSON");
}

function parseObject(s: string, i: { n: number }): Record<string, unknown> {
  i.n += 1;
  skipWs(s, i);
  const out: Record<string, unknown> = {};
  if (s[i.n] === "}") {
    i.n += 1;
    return out;
  }
  while (true) {
    skipWs(s, i);
    const key = parseString(s, i);
    if (Object.prototype.hasOwnProperty.call(out, key)) throw new KernelError("DUPLICATE_JSON_KEY");
    skipWs(s, i);
    if (s[i.n] !== ":") throw new KernelError("INVALID_JSON");
    i.n += 1;
    out[key] = parseValue(s, i);
    skipWs(s, i);
    if (s[i.n] === "}") {
      i.n += 1;
      return out;
    }
    if (s[i.n] !== ",") throw new KernelError("INVALID_JSON");
    i.n += 1;
  }
}

function parseArray(s: string, i: { n: number }): unknown[] {
  i.n += 1;
  skipWs(s, i);
  const out: unknown[] = [];
  if (s[i.n] === "]") {
    i.n += 1;
    return out;
  }
  while (true) {
    out.push(parseValue(s, i));
    skipWs(s, i);
    if (s[i.n] === "]") {
      i.n += 1;
      return out;
    }
    if (s[i.n] !== ",") throw new KernelError("INVALID_JSON");
    i.n += 1;
  }
}

export function parseCj1(raw: Buffer | Uint8Array): unknown {
  const buf = Buffer.isBuffer(raw) ? raw : Buffer.from(raw);
  if (buf.length > 2_000_000) throw new KernelError("INVALID_JSON_SIZE_OR_TYPE");
  const text = buf.toString("utf8");
  if (text.includes("\uFFFD") && !buf.includes(0xef)) {
    /* decoded replacement is still valid if original had the char */
  }
  rejectNumberTokens(text);
  const i = { n: 0 };
  const obj = parseValue(text, i);
  skipWs(text, i);
  if (i.n !== text.length) throw new KernelError("INVALID_JSON");
  validateCanon(obj);
  return obj;
}

export type Pin = [string, string];

export function shuffle(ids: unknown, seed: unknown): string[] {
  if (!Array.isArray(ids)) throw new KernelError("INVALID_MEMBER_LIST");
  const b = digestBytes(seed);
  for (const x of ids) ident(x);
  if (ids.length !== new Set(ids).size) throw new KernelError("DUPLICATE_MEMBER");
  return [...ids].sort((a: string, bId: string) => {
    const ka = createHash("sha256").update(Buffer.concat([b, Buffer.from(a, "utf8")])).digest();
    const kb = createHash("sha256").update(Buffer.concat([b, Buffer.from(bId, "utf8")])).digest();
    const c = ka.compare(kb);
    if (c !== 0) return c;
    return Buffer.from(a, "utf8").compare(Buffer.from(bId, "utf8"));
  }) as string[];
}

export function inputHash(args: {
  manifestId: string;
  securityId: string;
  manifestHash: string;
  snapshotHash: string;
  ruleHash: string;
  engineHash: string;
  costHash: string;
  margin: number;
  pins: Pin[];
}): string {
  ident(args.manifestId);
  ident(args.securityId);
  if (typeof args.margin !== "number" || !Number.isInteger(args.margin) || args.margin < 2 || args.margin > 15) {
    throw new KernelError("INVALID_MARGIN");
  }
  if (!Array.isArray(args.pins)) throw new KernelError("INVALID_PINS");
  const ids: string[] = [];
  for (const p of args.pins) {
    if (!Array.isArray(p) || p.length !== 2) throw new KernelError("INVALID_PIN");
    ident(p[0]);
    digestBytes(p[1]);
    ids.push(p[0]);
  }
  if (ids.length !== new Set(ids).size) throw new KernelError("DUPLICATE_PIN");
  const pairs = [...args.pins].sort((a, b) => Buffer.from(a[0], "utf8").compare(Buffer.from(b[0], "utf8")));
  const parts: Buffer[] = [
    field(Buffer.from("Trading App|input|2", "ascii")),
    field(Buffer.from(args.manifestId, "utf8")),
    field(Buffer.from(args.securityId, "utf8")),
  ];
  for (const x of [args.manifestHash, args.snapshotHash, args.ruleHash, args.engineHash, args.costHash]) {
    parts.push(field(digestBytes(x)));
  }
  parts.push(field(u32(args.margin)), field(u32(pairs.length)));
  for (const [pid, ph] of pairs) {
    parts.push(field(Buffer.from(pid, "utf8")), field(digestBytes(ph)));
  }
  return sha256(Buffer.concat(parts));
}

export function outputHash(inputHex: string, decisionPayload: unknown): string {
  return h("Trading App|decision|1", digestBytes(inputHex), canon(decisionPayload));
}

export function payloadHash(normalizedPayload: unknown): string {
  return h("Trading App|payload|1", canon(normalizedPayload));
}

export function observationHash(envelope: unknown): string {
  return h("Trading App|observation|1", canon(envelope));
}

export function ruleAstHash(ast: unknown): string {
  return h("Trading App|rule|1", canon(ast));
}

export function policyHash(bundle: unknown): string {
  return h("Trading App|policy|1", canon(bundle));
}

export function costModelHash(content: unknown): string {
  return h("Trading App|cost|1", canon(content));
}

export function snapshotHash(content: unknown): string {
  return h("Trading App|snapshot|2", canon(content));
}

export function manifestHash(content: unknown): string {
  return h("Trading App|manifest|2", canon(content));
}

export function evaluatorArtifactHash(manifest: unknown): string {
  return sha256(canon(manifest));
}

export function ruleTextHash(text: string): string {
  const norm = text.replace(/\r\n/g, "\n").split("\n").map((line) => line.replace(/[ \t]+$/g, "")).join("\n");
  return sha256(Buffer.from(norm, "utf8"));
}

export function csprngSeedHex(): string {
  return randomBytes(32).toString("hex");
}

/* ── Decimal kernel (local, no ambient context) ─────────────────────────── */

export type Dec = { neg: boolean; unscaled: bigint; scale: number };

function parseRaw(s: unknown): { neg: boolean; int: bigint; fracDigits: number } {
  if (typeof s !== "string" || s.length > 80 || !DEC.test(s)) throw new KernelError("INVALID_DECIMAL_TEXT");
  const neg = s.startsWith("-");
  const body = neg ? s.slice(1) : s;
  const dot = body.indexOf(".");
  const whole = dot === -1 ? body : body.slice(0, dot);
  const frac = dot === -1 ? "" : body.slice(dot + 1);
  const int = BigInt(whole + frac);
  if (int === 0n && neg) throw new KernelError("INVALID_DECIMAL");
  return { neg, int, fracDigits: frac.length };
}

function cmpAbs(a: Dec, b: Dec): number {
  const sa = a.scale > b.scale ? a.scale : b.scale;
  const ua = rescale(a, sa).unscaled;
  const ub = rescale(b, sa).unscaled;
  if (ua < ub) return -1;
  if (ua > ub) return 1;
  return 0;
}

function rescale(d: Dec, scale: number): Dec {
  if (d.scale === scale) return d;
  if (d.scale < scale) {
    return { neg: d.neg, unscaled: d.unscaled * 10n ** BigInt(scale - d.scale), scale };
  }
  throw new KernelError("EXCESS_SCALE");
}

export function dec(s: string, scale: number, lo?: string, hi?: string): Dec {
  const raw = parseRaw(s);
  if (raw.fracDigits > scale) throw new KernelError("EXCESS_SCALE");
  const unscaled = raw.int * 10n ** BigInt(scale - raw.fracDigits);
  const x: Dec = { neg: raw.neg && raw.int !== 0n, unscaled, scale };
  if (lo !== undefined) {
    const l = dec(lo, scale);
    if (cmp(x, l) < 0) throw new KernelError("BELOW_DOMAIN");
  }
  if (hi !== undefined) {
    const hBound = dec(hi, scale);
    if (cmp(x, hBound) > 0) throw new KernelError("ABOVE_DOMAIN");
  }
  return x;
}

export function cmp(a: Dec, b: Dec): number {
  if (a.neg !== b.neg) {
    if (a.unscaled === 0n && b.unscaled === 0n) return 0;
    return a.neg ? -1 : 1;
  }
  const c = cmpAbs(a, b);
  return a.neg ? -c : c;
}

export function decToCanonical(d: Dec, scale: number): string {
  const x = d.scale === scale ? d : quantizeHalfUp(d, scale);
  const s = x.unscaled.toString().padStart(scale + 1, "0");
  const whole = s.slice(0, s.length - scale) || "0";
  const frac = s.slice(s.length - scale);
  const body = `${whole}.${frac}`;
  if (x.neg && x.unscaled !== 0n) return `-${body}`;
  return body;
}

/** ROUND_HALF_UP — ties away from zero. */
export function quantizeHalfUp(d: Dec, places: number): Dec {
  if (d.scale === places) return d;
  if (d.scale < places) return rescale(d, places);
  const drop = d.scale - places;
  const factor = 10n ** BigInt(drop);
  const q = d.unscaled / factor;
  const r = d.unscaled % factor;
  const out = r * 2n >= factor ? q + 1n : q;
  return { neg: d.neg && out !== 0n, unscaled: out, scale: places };
}

function fromIntScale(unscaled: bigint, scale: number, neg: boolean): Dec {
  return { neg: neg && unscaled !== 0n, unscaled, scale };
}

function align(a: Dec, b: Dec): { a: Dec; b: Dec; scale: number } {
  const scale = Math.max(a.scale, b.scale);
  const lift = (d: Dec) =>
    d.scale === scale ? d : { neg: d.neg, unscaled: d.unscaled * 10n ** BigInt(scale - d.scale), scale };
  return { a: lift(a), b: lift(b), scale };
}

export function add(a: Dec, b: Dec): Dec {
  const x = align(a, b);
  const sa = x.a.neg ? -x.a.unscaled : x.a.unscaled;
  const sb = x.b.neg ? -x.b.unscaled : x.b.unscaled;
  const s = sa + sb;
  return fromIntScale(s < 0n ? -s : s, x.scale, s < 0n);
}

export function sub(a: Dec, b: Dec): Dec {
  return add(a, { neg: b.unscaled === 0n ? false : !b.neg, unscaled: b.unscaled, scale: b.scale });
}

export function mul(a: Dec, b: Dec): Dec {
  return {
    neg: a.neg !== b.neg && a.unscaled !== 0n && b.unscaled !== 0n,
    unscaled: a.unscaled * b.unscaled,
    scale: a.scale + b.scale,
  };
}

export function div(a: Dec, b: Dec, outScale: number): Dec {
  if (b.unscaled === 0n) throw new KernelError("DIVISION_BY_ZERO");
  // a/b with extra digits then quantize
  const extra = outScale + 8;
  const num = a.unscaled * 10n ** BigInt(b.scale + extra);
  const den = b.unscaled;
  const q = num / den;
  const r = num % den;
  const raw: Dec = { neg: a.neg !== b.neg, unscaled: q, scale: a.scale + extra };
  // remainder for half-up at the current extra scale is handled by quantize
  if (r * 2n >= den) raw.unscaled = q + 1n;
  return quantizeHalfUp(raw, outScale);
}

export function modeledFill(
  close: string,
  penalty = "0.000500",
  imbalanceCoefficient = "0.000000",
  imbalanceTerm = "0.000000",
): string {
  const p = dec(close, 6, "0.000001", "1000000");
  const c = dec(penalty, 6, "0.000001", "0.05");
  const a = dec(imbalanceCoefficient, 6, "0", "0");
  const b = dec(imbalanceTerm, 6, "0", "0");
  const one = dec("1", 6);
  const inner = add(one, add(c, mul(a, b))); // a*b scale 12, add to c scale 6 — align in add
  const prod = mul(p, inner);
  return decToCanonical(quantizeHalfUp(prod, 12), 12);
}

export function paperPnl(
  notional: string,
  exitPrice: string,
  fill: string,
  commission = "0.0000",
): string {
  const n = dec(notional, 4, "0.0001", "5000");
  const x = dec(exitPrice, 6, "0.000001", "1000000");
  const f = dec(fill, 12, "0.000000000001", "1050000");
  const c = dec(commission, 4, "0", "100");
  const ratio = div(x, f, 24);
  const gap = sub(ratio, dec("1", 0));
  const dollar = mul(n, gap);
  const twoC = mul(dec("2", 0), c);
  return decToCanonical(quantizeHalfUp(sub(dollar, twoC), 4), 4);
}

export function directionHit(entry: string, exit: string): boolean | null {
  const e = dec(entry, 6, "0.000001", "1000000");
  const x = dec(exit, 6, "0.000001", "1000000");
  const c = cmp(x, e);
  if (c === 0) return false; // zero return = MISS
  return c > 0;
}

export function bandHit(entry: string, exit: string, low: string, high: string): boolean {
  // entry * (1+low) <= exit <= entry * (1+high)  using cross multiplication
  const e = dec(entry, 6, "0.000001", "1000000");
  const x = dec(exit, 6, "0.000001", "1000000");
  const lo = dec(low, 12, "-1000000", "1000000");
  const hi = dec(high, 12, "-1000000", "1000000");
  const one = dec("1", 0);
  const left = mul(e, add(one, lo));
  const right = mul(e, add(one, hi));
  // compare left <= x <= right at aligned scale
  const xAs = { ...x };
  return cmp(left, { neg: xAs.neg, unscaled: xAs.unscaled, scale: xAs.scale }) <= 0 && cmp(xAs, right) <= 0;
}

export function magnitudeBand(impliedMove: string): { low: string; high: string } {
  const m = dec(impliedMove, 12, "0.000000000001", "5");
  const low = quantizeHalfUp(mul(m, dec("0.5", 1)), 12);
  const high = quantizeHalfUp(mul(m, dec("2.0", 1)), 12);
  return { low: decToCanonical(low, 12), high: decToCanonical(high, 12) };
}

/* ── AST / evaluator ────────────────────────────────────────────────────── */

export const FIELD_TYPES: Record<string, "enum" | "bool" | "decimal"> = {
  timing_quality: "enum",
  card_complete: "bool",
  options_valid: "bool",
  implied_move: "decimal",
  benchmark_relative_5d: "decimal",
  benchmark_relative_63d: "decimal",
};

export const INITIAL_AST = {
  schema: "1",
  decision: "PREDICT",
  direction: "LONG",
  otherwise: "STAND_DOWN",
  all: [
    { field: "timing_quality", op: "EQ", value: "ISSUER_CONFIRMED" },
    { field: "card_complete", op: "EQ", value: true },
    { field: "options_valid", op: "EQ", value: true },
    { field: "implied_move", op: "GTE", value: "0.040000000000" },
    { field: "implied_move", op: "LTE", value: "0.150000000000" },
    { field: "benchmark_relative_5d", op: "LT", value: "0.000000000000" },
    { field: "benchmark_relative_63d", op: "GT", value: "0.000000000000" },
  ],
} as const;

export type EvalResult = {
  status: "OK" | "INVALID_RULE" | "INVALID_CARD" | "INTERNAL_ERROR";
  decision: "PREDICT" | "STAND_DOWN";
  direction: "LONG" | null;
  reasons: string[];
};

export function validateAst(ast: unknown): true {
  if (!ast || typeof ast !== "object" || Array.isArray(ast)) throw new KernelError("INVALID_AST_KEYS");
  const a = ast as Record<string, unknown>;
  const keys = Object.keys(a);
  const expected = ["schema", "decision", "direction", "otherwise", "all"];
  if (keys.length !== expected.length || expected.some((k) => !Object.prototype.hasOwnProperty.call(a, k))) {
    throw new KernelError("INVALID_AST_KEYS");
  }
  for (const x of ["schema", "decision", "direction", "otherwise"] as const) {
    if (a[x] !== INITIAL_AST[x]) throw new KernelError("INVALID_AST_HEADER");
  }
  const cc = a.all;
  if (!Array.isArray(cc) || cc.length < 1 || cc.length > 32) throw new KernelError("INVALID_AST_CONDITIONS");
  for (const con of cc) {
    if (!con || typeof con !== "object" || Array.isArray(con)) throw new KernelError("INVALID_CONDITION");
    const c = con as Record<string, unknown>;
    if (Object.keys(c).length !== 3 || !("field" in c && "op" in c && "value" in c)) {
      throw new KernelError("INVALID_CONDITION");
    }
    const f = c.field;
    const op = c.op;
    const v = c.value;
    if (typeof f !== "string" || !(f in FIELD_TYPES)) throw new KernelError("UNKNOWN_FIELD");
    if (typeof op !== "string" || !["EQ", "LT", "GT", "LTE", "GTE"].includes(op)) throw new KernelError("UNKNOWN_OP");
    const typ = FIELD_TYPES[f];
    if (typ === "bool" && (op !== "EQ" || typeof v !== "boolean")) throw new KernelError("INVALID_BOOL_PREDICATE");
    if (typ === "enum" && (op !== "EQ" || v !== "ISSUER_CONFIRMED")) throw new KernelError("INVALID_ENUM_PREDICATE");
    if (typ === "decimal") {
      if (typeof v !== "string") throw new KernelError("NONCANONICAL_CONSTANT");
      dec(v, 12, "-1000000", "1000000");
      if (!CANON_DEC12.test(v)) throw new KernelError("NONCANONICAL_CONSTANT");
    }
  }
  return true;
}

function down(reason: string, status: EvalResult["status"] = "OK"): EvalResult {
  return { status, decision: "STAND_DOWN", direction: null, reasons: [reason] };
}

export function evaluate(ast: unknown, card: unknown): EvalResult {
  try {
    validateAst(ast);
  } catch {
    return down("INVALID_RULE_AST", "INVALID_RULE");
  }
  if (!card || typeof card !== "object" || Array.isArray(card)) return down("INVALID_CARD", "INVALID_CARD");
  const c = card as Record<string, unknown>;
  if (c.card_complete !== true) {
    const t = c.card_complete;
    if (t === false || t === null || t === undefined) return down("CARD_INCOMPLETE", "OK");
    return down("INVALID_CARD_COMPLETE", "INVALID_CARD");
  }
  const a = ast as { all: Array<{ field: string; op: string; value: unknown }> };
  for (const co of a.all) {
    const f = co.field;
    const op = co.op;
    const v = co.value;
    const val = c[f];
    if (val === undefined || val === null) return down(`MISSING_${f}`);
    const t = FIELD_TYPES[f];
    let left: unknown = val;
    let right: unknown = v;
    if (t === "bool") {
      if (typeof val !== "boolean") return down(`INVALID_${f}`, "INVALID_CARD");
    } else if (t === "enum") {
      if (typeof val !== "string" || (val !== "ISSUER_CONFIRMED" && val !== "ESTIMATED")) {
        return down(`INVALID_${f}`, "INVALID_CARD");
      }
    } else {
      try {
        if (typeof val !== "string" || !CANON_DEC12.test(val)) throw new KernelError("NONCANONICAL_CARD_VALUE");
        const aDec = f === "implied_move" ? dec(val, 12, "0.000000000001", "5") : dec(val, 12, "-1000000", "1000000");
        const vDec = dec(v as string, 12, "-1000000", "1000000");
        left = aDec;
        right = vDec;
      } catch {
        return down(`INVALID_${f}`, "INVALID_CARD");
      }
    }
    let ok = false;
    if (t === "decimal") {
      const cmpv = cmp(left as Dec, right as Dec);
      ok =
        (op === "EQ" && cmpv === 0) ||
        (op === "LT" && cmpv < 0) ||
        (op === "GT" && cmpv > 0) ||
        (op === "LTE" && cmpv <= 0) ||
        (op === "GTE" && cmpv >= 0);
    } else {
      ok = op === "EQ" && left === right;
    }
    if (!ok) return down(`PREDICATE_FALSE_${f}`);
  }
  return { status: "OK", decision: "PREDICT", direction: "LONG", reasons: [] };
}

export function computeCardComplete(card: {
  timing_quality?: unknown;
  options_valid?: unknown;
  implied_move?: unknown;
  benchmark_relative_5d?: unknown;
  benchmark_relative_63d?: unknown;
}): boolean {
  if (card.timing_quality !== "ISSUER_CONFIRMED" && card.timing_quality !== "ESTIMATED") return false;
  if (typeof card.options_valid !== "boolean") return false;
  if (typeof card.implied_move !== "string") return false;
  try {
    dec(card.implied_move, 12, "0.000000000001", "5");
  } catch {
    return false;
  }
  for (const f of ["benchmark_relative_5d", "benchmark_relative_63d"] as const) {
    const v = card[f];
    if (typeof v !== "string") return false;
    try {
      dec(v, 12, "-1000000", "1000000");
    } catch {
      return false;
    }
  }
  return true;
}

export const ENGINE_VERSION = "trading-app-evaluator-1.2.0";
export const PRODUCT_NAME = "Trading App";
export const API_PREFIX = "/api/trading-app/v1";

export const COST_MODEL_CONTENT = {
  cost_model_version: "1",
  cost_model_basis: "CONSERVATIVE_STRESS_HAIRCUT",
  constant_penalty: "0.000500",
  imbalance_coefficient: "0.000000",
  imbalance_term: "0.000000",
  commission_per_fill: "0.0000",
  entry_rounding_scale: "12",
  pnl_rounding_scale: "4",
  rounding_mode: "ROUND_HALF_UP",
} as const;
