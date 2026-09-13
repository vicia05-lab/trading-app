import assert from "node:assert/strict";
import { test } from "node:test";
import { manifestHash } from "../kernel/index.ts";
import { DeskError, jsonCanon } from "./util.ts";
import { assertCanonicalPinOrder, manifestObjectFromStored } from "./verify-decode.ts";

test("T01 stored TEXT canonical_content hashes as the object, not as a JSON string", () => {
  const obj = {
    manifest_id: "man-1",
    session_date: "2026-09-04",
    sleeve: "EARNINGS",
    members: [{ permanent_security_id: "SEC-A", snapshot_hash: "aa".repeat(32) }],
  };
  const text = jsonCanon(obj);
  const written = manifestHash(obj);
  const hashedAsString = manifestHash(text);
  assert.notEqual(hashedAsString, written, "hashing the TEXT string must not equal hashing the object");
  const decoded = manifestObjectFromStored(text);
  assert.equal(manifestHash(decoded), written);
  assert.equal(jsonCanon(decoded), text);
});

test("non-object or non-CJ1 TEXT is rejected", () => {
  assert.throws(() => manifestObjectFromStored("[]"), DeskError);
  assert.throws(() => manifestObjectFromStored("not-json"), DeskError);
  assert.throws(() => manifestObjectFromStored('{"n":1}'), DeskError);
});

test("T13 pin_index must match UTF-8 byte-lex rank even if both maps agree", () => {
  assert.doesNotThrow(() =>
    assertCanonicalPinOrder([
      { observation_id: "obs-a", pin_index: 0 },
      { observation_id: "obs-z", pin_index: 1 },
    ]),
  );
  assert.throws(
    () =>
      assertCanonicalPinOrder([
        { observation_id: "obs-z", pin_index: 0 },
        { observation_id: "obs-a", pin_index: 1 },
      ]),
    DeskError,
  );
});
