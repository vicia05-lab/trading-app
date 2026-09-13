import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { randomBytes } from "node:crypto";
import { masterKeyFromBase64 } from "./alpaca-data-secrets";

const FILE = join(process.cwd(), ".grok", "alpaca-master.key");
const TMP = join("/tmp", "trading-app-alpaca-master.key");
let memory: Buffer | null = null;

function parse(value: string): Buffer | null {
  try {
    return masterKeyFromBase64(value.trim());
  } catch {
    return null;
  }
}

function readFile(path: string): Buffer | null {
  try {
    return parse(readFileSync(path, "utf8"));
  } catch {
    return null;
  }
}

function writeFile(path: string, value: string): boolean {
  try {
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, `${value}\n`, { mode: 0o600 });
    return true;
  } catch {
    return false;
  }
}

/**
 * Server-only wrap key. Env wins. Otherwise a gitignored file is created once.
 * Never put this in VITE_ or a client bundle.
 */
export function loadOrCreateMasterKey(): Buffer {
  const fromEnv = process.env.ALPACA_CREDENTIALS_MASTER_KEY?.trim();
  if (fromEnv) {
    const parsed = parse(fromEnv);
    if (parsed) return parsed;
  }
  const fromFile = readFile(FILE) ?? readFile(TMP);
  if (fromFile) return fromFile;
  if (memory) return Buffer.from(memory);
  const value = randomBytes(32).toString("base64");
  const key = masterKeyFromBase64(value);
  writeFile(FILE, value) || writeFile(TMP, value);
  memory = Buffer.from(key);
  return key;
}
