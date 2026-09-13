import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { test } from "node:test";
import { inputHash, modeledFill } from "../kernel/index.ts";

test("no parallel vicia/engine package", () => {
  assert.equal(existsSync(new URL("../../vicia", import.meta.url)), false);
});

test("input hash stays domain-prefixed and matches H01", () => {
  const src = readFileSync(new URL("../kernel/index.ts", import.meta.url), "utf8");
  assert.match(src, /Trading App\|input\|2/);
  const got = inputHash({
    manifestId: "manifest-20260914",
    securityId: "SEC-A",
    manifestHash: "1111111111111111111111111111111111111111111111111111111111111111",
    snapshotHash: "2222222222222222222222222222222222222222222222222222222222222222",
    ruleHash: "3333333333333333333333333333333333333333333333333333333333333333",
    engineHash: "4444444444444444444444444444444444444444444444444444444444444444",
    costHash: "5555555555555555555555555555555555555555555555555555555555555555",
    margin: 3,
    pins: [
      ["obs-z", "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"],
      ["obs-a", "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"],
    ],
  });
  assert.equal(got, "bac8f1353582276f85608c618ad44f104f5480fea76d03ce0dbcad4955522726");
});

test("modeled fill is decimal text, not float arithmetic", () => {
  const got = modeledFill("123.456789");
  assert.match(got, /^\d+\.\d{12}$/);
  assert.notEqual(got, String(123.456789 * 1.0005));
});

test("operator barrier copy is not a time gate", () => {
  const src = readFileSync(new URL("./queries.ts", import.meta.url), "utf8");
  assert.doesNotMatch(src, /until window release/);
  assert.match(src, /information barrier/);
});
