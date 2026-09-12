import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { randomBytes } from "node:crypto";
import { masterKeyFromBase64 } from "./alpaca-data-secrets";

const FILE = join(process.cwd(), ".grok", "alpaca-master.key");

/**
 * Server-only wrap key. Env wins. Otherwise a gitignored file is created once.
 * Never put this in VITE_ or a client bundle.
 */
export function loadOrCreateMasterKey(): Buffer {
  const fromEnv = process.env.ALPACA_CREDENTIALS_MASTER_KEY?.trim();
  if (fromEnv) return masterKeyFromBase64(fromEnv);
  try {
    const raw = readFileSync(FILE, "utf8").trim();
    return masterKeyFromBase64(raw);
  } catch {
    const value = randomBytes(32).toString("base64");
    mkdirSync(dirname(FILE), { recursive: true });
    writeFileSync(FILE, `${value}\n`, { mode: 0o600 });
    return masterKeyFromBase64(value);
  }
}
