import test from "node:test";
import assert from "node:assert/strict";
import {
  registerVolumeLedger,
  appendVolumeCapture,
  ExistingVolumeReceipt,
} from "./volume-ledger.ts";
import type { VolumeLedgerContext, VolumeLedgerReceipt } from "./volume-ledger.ts";
import { buildVolumeCapture } from "./volume-capture.ts";
import { volumeFixture } from "./volume-fixtures.ts";
function harness() {
  const receipts = new Map<string, VolumeLedgerReceipt>(),
    events: unknown[] = [];
  const ctx: VolumeLedgerContext = {
    actor: "operator_fixture",
    seq: 41,
    now: new Date("2024-06-03T21:00:00.000Z"),
    find: async (id) => receipts.get(id) ?? null,
    append: async (id, type, payload, receipt) => {
      events.push({ id, type, payload, receipt });
      receipts.set(id, receipt);
    },
  };
  return { ctx, events, receipts };
}
test("registry uses supplied global event sequence", async () => {
  const h = harness(),
    r = await registerVolumeLedger(h.ctx, "reg_1");
  assert.equal(r.eventSeq, "41");
  assert.equal(h.events.length, 1);
  assert.equal(r.executionEnabled, false);
});
test("duplicate registry throws to roll back allocated writer sequence", async () => {
  const h = harness();
  await registerVolumeLedger(h.ctx, "reg_1");
  await assert.rejects(() => registerVolumeLedger(h.ctx, "reg_1"), ExistingVolumeReceipt);
  assert.equal(h.events.length, 1);
});
test("capture without registry rejected", async () => {
  const h = harness(),
    c = buildVolumeCapture([volumeFixture()], null, {});
  await assert.rejects(
    () => appendVolumeCapture(h.ctx, "cap_1", "missing", c),
    /REGISTRY_REQUIRED/,
  );
  assert.equal(h.events.length, 0);
});
test("registry and capture remain separate append-only events", async () => {
  const h = harness();
  await registerVolumeLedger(h.ctx, "reg_1");
  h.ctx.seq = 42;
  const c = buildVolumeCapture([volumeFixture()], null, {});
  const r = await appendVolumeCapture(h.ctx, "cap_1", "reg_1", c);
  assert.equal(r.eventSeq, "42");
  assert.equal(h.events.length, 2);
});
test("capture cannot use another principal registry", async () => {
  const h = harness();
  await registerVolumeLedger(h.ctx, "reg_1");
  h.ctx.actor = "other_operator";
  await assert.rejects(
    () =>
      appendVolumeCapture(h.ctx, "cap_1", "reg_1", buildVolumeCapture([volumeFixture()], null, {})),
    /REGISTRY_REQUIRED/,
  );
});
test("receipt tampering rejected before append", async () => {
  const h = harness();
  await registerVolumeLedger(h.ctx, "reg_1");
  const c = buildVolumeCapture([volumeFixture()], null, {});
  c.qualifyingCount = "999";
  await assert.rejects(() => appendVolumeCapture(h.ctx, "cap_1", "reg_1", c), /HASH_MISMATCH/);
});
test("future capture does not advance mutation clock", async () => {
  const h = harness();
  await registerVolumeLedger(h.ctx, "reg_1");
  h.ctx.now = new Date("2024-06-03T12:00:00.000Z");
  await assert.rejects(() =>
    appendVolumeCapture(h.ctx, "cap_1", "reg_1", buildVolumeCapture([volumeFixture()], null, {})),
  );
  assert.equal(h.events.length, 1);
});
test("duplicate capture rejected idempotently before append", async () => {
  const h = harness();
  await registerVolumeLedger(h.ctx, "reg_1");
  const c = buildVolumeCapture([volumeFixture()], null, {});
  await appendVolumeCapture(h.ctx, "cap_1", "reg_1", c);
  await assert.rejects(
    () => appendVolumeCapture(h.ctx, "cap_1", "reg_1", c),
    ExistingVolumeReceipt,
  );
  assert.equal(h.events.length, 2);
});
