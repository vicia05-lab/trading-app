import { readFileSync } from "node:fs";
import { join } from "node:path";
import { masterKeyFromBase64 } from "./alpaca-data-secrets";
import { SecretError } from "./alpaca-data-secrets";

const FILE = join(process.cwd(), ".grok", "alpaca-master.key");

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

/**
 * Server-only wrap key. Fail closed.
 * Env `ALPACA_CREDENTIALS_MASTER_KEY` wins. Else an already-provisioned
 * gitignored file. Never create /tmp or process-memory keys.
 */
export function loadMasterKey(): Buffer {
  const fromEnv = process.env.ALPACA_CREDENTIALS_MASTER_KEY?.trim();
  if (fromEnv) {
    const parsed = parse(fromEnv);
    if (!parsed) throw new SecretError("SECRET_STORAGE_NOT_READY");
    return parsed;
  }
  const fromFile = readFile(FILE);
  if (fromFile) return fromFile;
  throw new SecretError("SECRET_STORAGE_NOT_READY");
}

/** True when a stable server-managed key is available. Does not create one. */
export function masterKeyConfigured(): boolean {
  try {
    const key = loadMasterKey();
    key.fill(0);
    return true;
  } catch {
    return false;
  }
}

/** @deprecated use loadMasterKey — creation fallbacks are removed. */
export function loadOrCreateMasterKey(): Buffer {
  return loadMasterKey();
}
