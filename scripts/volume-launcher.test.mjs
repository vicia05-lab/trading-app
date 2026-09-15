import test from "node:test";
import assert from "node:assert/strict";
import { join } from "node:path";
import { commandInvocation } from "./with-app-env.mjs";
test("Vite launches via Node with an absolute CLI path, without a shell", () => {
  const x = commandInvocation("vite", ["build", "--mode", "development"], "C:/path with spaces");
  assert.equal(x.command, process.execPath);
  assert.deepEqual(x.args, [
    join("C:/path with spaces", "node_modules", "vite", "bin", "vite.js"),
    "build",
    "--mode",
    "development",
  ]);
});
test("non-Vite invocations remain argument arrays, not command strings", () => {
  const args = ["value; not a shell command"];
  const x = commandInvocation(process.execPath, args);
  assert.equal(x.command, process.execPath);
  assert.deepEqual(x.args, args);
  assert.notEqual(x.args, args);
});
