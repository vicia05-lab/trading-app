import { manifestHash, parseCj1 } from "../kernel/index.ts";
import { DeskError, jsonCanon } from "./util.ts";

/**
 * Writer hashes the object, then stores jsonCanon(object) as TEXT.
 * Driver returns that TEXT as a string. Hashing the string would quote it again.
 */
export function manifestObjectFromStored(raw: unknown): Record<string, unknown> {
  if (typeof raw === "string") {
    let parsed: unknown;
    try {
      parsed = parseCj1(Buffer.from(raw, "utf8"));
    } catch {
      throw new DeskError("FREEZE_ARTIFACT_MISMATCH", "canonical manifest text is not CJ1", 503);
    }
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new DeskError("FREEZE_ARTIFACT_MISMATCH", "canonical manifest is not an object", 503);
    }
    const reencoded = jsonCanon(parsed);
    if (reencoded !== raw) {
      throw new DeskError("FREEZE_ARTIFACT_MISMATCH", "canonical manifest re-encoding does not match stored bytes", 503);
    }
    return parsed as Record<string, unknown>;
  }
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    return raw as Record<string, unknown>;
  }
  throw new DeskError("FREEZE_ARTIFACT_MISMATCH", "canonical manifest is missing or not an object", 503);
}

export function storedManifestHash(raw: unknown): string {
  return manifestHash(manifestObjectFromStored(raw));
}

/** pin_index must be the UTF-8 byte-lex rank of observation_id, independently of set equality. */
export function assertCanonicalPinOrder(
  pins: Array<{ observation_id: string; pin_index: number }>,
): void {
  const ranked = [...pins].sort((a, b) =>
    Buffer.from(a.observation_id, "utf8").compare(Buffer.from(b.observation_id, "utf8")),
  );
  for (let i = 0; i < ranked.length; i += 1) {
    if (ranked[i].pin_index !== i) {
      throw new DeskError(
        "FREEZE_ARTIFACT_MISMATCH",
        "pin_index is not UTF-8 byte-lex order of observation ids",
        503,
      );
    }
  }
}
