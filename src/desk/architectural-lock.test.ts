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

test("live Alpaca host and LIVE saves are rejected in source", () => {
  const alpaca = readFileSync(new URL("./alpaca.ts", import.meta.url), "utf8");
  assert.match(alpaca, /LIVE_DISABLED/);
  assert.doesNotMatch(alpaca, /https:\/\/api\.alpaca\.markets/);
  assert.match(alpaca, /AsyncLocalStorage/);
  const wrap = readFileSync(new URL("./alpaca-data-service.server.ts", import.meta.url), "utf8");
  assert.match(wrap, /canManage/);
  assert.doesNotMatch(wrap, /durableStorage: true/);
  const keys = readFileSync(new URL("./alpaca-master-key.server.ts", import.meta.url), "utf8");
  assert.doesNotMatch(keys, /trading-app-alpaca-master\.key/);
  const cmds = readFileSync(new URL("./commands.ts", import.meta.url), "utf8");
  assert.match(cmds, /RULE_MISMATCH/);
  assert.match(cmds, /RULE_UNAVAILABLE/);
  assert.match(cmds, /recomputed input hash does not match the freeze artifact/);
  assert.match(cmds, /replayed decision does not match the freeze artifact/);
});
