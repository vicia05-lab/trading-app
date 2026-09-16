import assert from "node:assert/strict";
import { test } from "node:test";
import { createSerialScheduler } from "./sleeve-scheduler-core.ts";

function fixture(run: () => Promise<void>, reportError: (error: unknown) => Promise<void> = async () => {}) {
  const callbacks = new Map<number, () => void>();
  let nextId = 0;
  const scheduler = createSerialScheduler({
    run, reportError, intervalMs: 300000,
    setTimer: (fn) => { const id = ++nextId; callbacks.set(id, fn); return id as unknown as ReturnType<typeof setTimeout>; },
    clearTimer: (id) => { callbacks.delete(id as unknown as number); },
  });
  return { scheduler, callbacks, fire() {
    const next = callbacks.entries().next().value;
    assert.ok(next, "no scheduled callback");
    callbacks.delete(next[0]); next[1]();
  } };
}

test("scheduler starts once and schedules only after the previous run finishes", async () => {
  let calls = 0;
  let release!: () => void;
  const pending = new Promise<void>((resolve) => { release = resolve; });
  const f = fixture(async () => { calls++; await pending; });
  f.scheduler.start(); f.scheduler.start();
  await Promise.resolve();
  assert.equal(calls, 1);
  assert.equal(f.scheduler.status().executing, true);
  assert.equal(f.callbacks.size, 0);
  release(); await f.scheduler.settled();
  assert.equal(f.callbacks.size, 1);
  assert.equal(f.scheduler.status().executing, false);
  f.fire(); await f.scheduler.settled();
  assert.equal(calls, 2);
  f.scheduler.stop();
});

test("stopping removes the timer and reports stopped", async () => {
  const f = fixture(async () => {});
  f.scheduler.start(); await f.scheduler.settled();
  f.scheduler.stop();
  assert.equal(f.callbacks.size, 0);
  assert.equal(f.scheduler.status().running, false);
});

test("stop during a run does not pretend to cancel it or schedule another run", async () => {
  let release!: () => void;
  const pending = new Promise<void>((resolve) => { release = resolve; });
  const f = fixture(async () => pending);
  f.scheduler.start(); await Promise.resolve(); f.scheduler.stop();
  assert.deepEqual(f.scheduler.status(), { running: false, executing: true, last_error: null });
  release(); await f.scheduler.settled();
  assert.equal(f.callbacks.size, 0);
});

test("stop then restart during a slow run never overlaps", async () => {
  let release!: () => void;
  let calls = 0;
  const pending = new Promise<void>((resolve) => { release = resolve; });
  const f = fixture(async () => { calls++; await pending; });
  f.scheduler.start(); await Promise.resolve(); f.scheduler.stop(); f.scheduler.start();
  assert.equal(calls, 1);
  release(); await f.scheduler.settled();
  assert.equal(f.callbacks.size, 1);
  f.scheduler.stop();
});

test("run failures are recorded, not swallowed", async () => {
  const error = new Error("test failure");
  const errors: unknown[] = [];
  const f = fixture(async () => { throw error; }, async (e) => { errors.push(e); });
  f.scheduler.start(); await f.scheduler.settled();
  assert.deepEqual(errors, [error]);
  assert.equal(f.scheduler.status().last_error, "Error");
  assert.equal(f.callbacks.size, 1);
  f.scheduler.stop();
});

test("invalid intervals are rejected", () => {
  for (const intervalMs of [0, -1, NaN, Infinity]) {
    assert.throws(() => createSerialScheduler({ run: async () => {}, reportError: async () => {}, intervalMs }));
  }
});
