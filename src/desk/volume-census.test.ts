import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, writeFile, readFile, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { canon } from "../kernel/index.ts";
import { runVolumeCensus } from "./volume-census.ts";
import { volumeFixture, volumeFixtureEntry } from "./volume-fixtures.ts";
async function setup() {
  const dir = await mkdtemp(join(tmpdir(), "volume-v21-test-")),
    input = join(dir, "input.ndjson"),
    output = join(dir, "new-run"),
    frame = volumeFixture(),
    e = volumeFixtureEntry(frame);
  await writeFile(
    input,
    canon({
      frames: [frame],
      risk: e.risk,
      quotes: [{ securityId: frame.securityId, quote: e.quote }],
    }).toString() + "\n",
  );
  return { dir, input, output };
}
test("census creates separate artifacts without modifying input", async () => {
  const x = await setup();
  try {
    const before = await readFile(x.input),
      r = await runVolumeCensus(x.input, x.output);
    assert.equal(r.candidateObservations, "1");
    assert.equal(r.snapshotSimulatedAdmissions, "1");
    assert.equal(r.oosClaim, false);
    assert.equal(r.profitability, "NOT_EVALUATED");
    assert.deepEqual(await readFile(x.input), before);
    assert.ok((await stat(join(x.output, "registry.json"))).size > 0);
    assert.ok(
      (await readFile(join(x.output, "candidates.ndjson"), "utf8")).includes("LONG_CANDIDATE"),
    );
    assert.ok(
      (await readFile(join(x.output, "portfolio.ndjson"), "utf8")).includes("SIMULATED_ADMISSION"),
    );
  } finally {
    await rm(x.dir, { recursive: true, force: true });
  }
});
test("existing census run cannot be overwritten", async () => {
  const x = await setup();
  try {
    await runVolumeCensus(x.input, x.output);
    await assert.rejects(() => runVolumeCensus(x.input, x.output), /EEXIST/);
  } finally {
    await rm(x.dir, { recursive: true, force: true });
  }
});
test("malformed census produces failed attestation, not success", async () => {
  const x = await setup();
  try {
    await writeFile(x.input, "{bad-json}\n");
    await assert.rejects(() => runVolumeCensus(x.input, x.output));
    assert.ok((await readFile(join(x.output, "failed.json"), "utf8")).includes("NOT_GRADABLE"));
    await assert.rejects(() => stat(join(x.output, "complete.json")));
  } finally {
    await rm(x.dir, { recursive: true, force: true });
  }
});

test("retained inputs and both ledgers have verified completion hashes", async () => {
  const x = await setup();
  try {
    const { sha256 } = await import("../kernel/index.ts");
    const r = await runVolumeCensus(x.input, x.output);
    assert.deepEqual(await readFile(join(x.output, "input.ndjson")), await readFile(x.input));
    for (const a of r.artifacts)
      assert.equal(sha256(await readFile(join(x.output, a.name))), a.sha256);
    assert.equal(r.inputHash, r.artifacts[0].sha256);
  } finally {
    await rm(x.dir, { recursive: true, force: true });
  }
});
test("repeating a candidate observation fails instead of inflating the census", async () => {
  const x = await setup();
  try {
    const text = await readFile(x.input, "utf8");
    await writeFile(x.input, text + text);
    await assert.rejects(
      () => runVolumeCensus(x.input, x.output),
      /DUPLICATE_CANDIDATE_OBSERVATION/,
    );
    await assert.rejects(() => stat(join(x.output, "complete.json")));
    assert.ok((await readFile(join(x.output, "failed.json"), "utf8")).includes("NOT_GRADABLE"));
  } finally {
    await rm(x.dir, { recursive: true, force: true });
  }
});
