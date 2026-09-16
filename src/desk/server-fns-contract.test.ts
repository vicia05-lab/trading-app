import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const facade = readFileSync(new URL("./server-fns.ts", import.meta.url), "utf8");
const implementation = readFileSync(new URL("./server-fns-impl.server.ts", import.meta.url), "utf8");
test("every server facade resolves a declared implementation", () => {
  const imports = [...facade.matchAll(/const\s*\{\s*(\w+Impl)\s*\}\s*=\s*await import\("\.\/server-fns-impl\.server"\)/g)];
  assert.ok(imports.length >= 20, "facade contract parser found unexpectedly few actions");
  for (const [, name] of imports) {
    assert.match(implementation, new RegExp(`export async function ${name}\\(`), `${name} is missing`);
  }
});
test("every server action retains authentication middleware", () => {
  const actions = facade.split(/export const /).slice(1);
  assert.ok(actions.length >= 20);
  for (const action of actions) {
    assert.match(action, /\.middleware\(\[authMiddleware\]\)/, action.split("=")[0]);
  }
});
function assertOperatorBeforeWork(body: string, name: string): void {
  assert.match(body, /await identityOf\(userId\)/);
  const gate = body.indexOf("requireOperator(role)");
  const work = body.indexOf("await import(");
  assert.ok(gate >= 0 && work > gate, `${name} lacks an operator gate before work`);
}
test("authorization contract rejects a missing or late operator gate", () => {
  const identity = "await identityOf(userId);";
  const gate = "requireOperator(role);";
  const work = 'await import("./alpaca");';
  assert.throws(() => assertOperatorBeforeWork(identity + work, "missing"));
  assert.throws(() => assertOperatorBeforeWork(identity + work + gate, "late"));
  assert.doesNotThrow(() => assertOperatorBeforeWork(identity + gate + work, "valid"));
});
test("new mutating controls require operator authorization before doing work", () => {
  for (const name of ["postAlpacaCancelAllImpl", "runIntelligentCycleImpl", "postSleeveSchedulerImpl"]) {
    const body = implementation.split(`export async function ${name}(`)[1]?.split("\nexport ")[0];
    assert.ok(body, name);
    assertOperatorBeforeWork(body, name);
  }
});
test("reading scheduler status does not start or enable trading", () => {
  const body = implementation.split("export async function fetchSleeveSchedulerImpl(")[1].split("\nexport ")[0];
  assert.doesNotMatch(body, /startSleeveScheduler|setSchedulerEnabled|runIntelligentPaperCycle/);
});
