/** Offline artifacts only. Does not create an application mutation clock or touch broker state. */
import { open, mkdir, stat, writeFile, readFile, copyFile } from "node:fs/promises";
import { createReadStream, constants } from "node:fs";
import { createInterface } from "node:readline";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { canon, sha256, parseCj1 } from "../kernel/index.ts";
import { VOLUME_POLICY } from "./volume-policy.ts";
import { volumePolicyHash, volumeResearchHash } from "../kernel/volume-research.ts";
import { buildVolumeCapture } from "./volume-capture.ts";
export async function runVolumeCensus(inputFile: string, outputDirectory: string) {
  const input = resolve(inputFile),
    output = resolve(outputDirectory),
    info = await stat(input);
  if (!info.isFile() || info.size < 1 || info.size > 256 * 1024 * 1024)
    throw new Error("CENSUS_INPUT_SIZE_INVALID");
  await mkdir(output, { recursive: false }); // Existing run directories can never be reused/overwritten.
  const sourceNames = [
    "../kernel/index.ts",
    "../kernel/volume-research.ts",
    "../kernel/volume-replay.ts",
    "../kernel/volume-statistics.ts",
    "./volume-policy.ts",
    "./volume-capture.ts",
    "./volume-census.ts",
  ];
  const sources = await Promise.all(
    sourceNames.map(async (name) => ({
      path: name,
      sha256: sha256(await readFile(fileURLToPath(new URL(name, import.meta.url)))),
    })),
  );
  const registry = {
    schema: "2.1",
    registeredAt: new Date().toISOString(),
    policy: VOLUME_POLICY,
    policyHash: volumePolicyHash(),
    sources,
    scope: "OFFLINE_RESEARCH_ARTIFACT_NOT_PRODUCTION_STATE",
    trialHistoryComplete: false,
    oosClaim: false,
  };
  const registryHash = volumeResearchHash("registry", registry);
  await writeFile(resolve(output, "registry.json"), canon({ ...registry, registryHash }), {
    flag: "wx",
  });
  const candidateFile = await open(resolve(output, "candidates.ndjson"), "wx"),
    portfolioFile = await open(resolve(output, "portfolio.ndjson"), "wx");
  let batches = 0,
    candidates = 0,
    qualifying = 0,
    admissions = 0;
  const sessions = new Set<string>(),
    modes = new Set<string>(),
    observations = new Set<string>();
  const retained = resolve(output, "input.ndjson");
  try {
    await copyFile(input, retained, constants.COPYFILE_EXCL);
    const inputHash = sha256(await readFile(retained));
    const lines = createInterface({
      input: createReadStream(retained, { encoding: "utf8" }),
      crlfDelay: Infinity,
    });
    for await (const line of lines) {
      if (!line.trim()) continue;
      if (line.length > 20 * 1024 * 1024 || ++batches > 10000)
        throw new Error("CENSUS_BATCH_LIMIT_EXCEEDED");
      const row = parseCj1(Buffer.from(line, "utf8")) as {
        frames: unknown[];
        risk: Parameters<typeof buildVolumeCapture>[1];
        quotes: Array<{
          securityId: string;
          quote: Parameters<typeof buildVolumeCapture>[2][string];
        }>;
      };
      if (
        !row ||
        typeof row !== "object" ||
        Object.keys(row).sort().join(" ") !== "frames quotes risk" ||
        !Array.isArray(row.frames) ||
        !Array.isArray(row.quotes)
      )
        throw new Error("INVALID_CENSUS_ROW");
      if (
        row.quotes.some((q) => !q || typeof q.securityId !== "string") ||
        new Set(row.quotes.map((q) => q.securityId)).size !== row.quotes.length
      )
        throw new Error("INVALID_QUOTE_IDENTITIES");
      const capture = buildVolumeCapture(
        row.frames,
        row.risk,
        Object.fromEntries(row.quotes.map((q) => [q.securityId, q.quote])),
      );
      for (const c of capture.candidateLedger) {
        if (observations.has(c.candidateId)) throw new Error("DUPLICATE_CANDIDATE_OBSERVATION");
        observations.add(c.candidateId);
      }
      for (const c of capture.candidateLedger) {
        await candidateFile.write(
          canon({ registryHash, captureHash: capture.captureHash, ...c }).toString() + "\n",
        );
        sessions.add(c.sessionDate);
        modes.add(c.evidenceScope);
      }
      for (const p of capture.portfolioLedger)
        await portfolioFile.write(
          canon({ registryHash, captureHash: capture.captureHash, ...p }).toString() + "\n",
        );
      candidates += Number(capture.candidateCount);
      qualifying += Number(capture.qualifyingCount);
      admissions += Number(capture.simulatedAdmissionCount);
    }
    if (batches === 0) throw new Error("EMPTY_CENSUS");
    await candidateFile.sync();
    await portfolioFile.sync();
    const artifacts = await Promise.all(
      ["input.ndjson", "candidates.ndjson", "portfolio.ndjson"].map(async (name) => ({
        name,
        sha256: sha256(await readFile(resolve(output, name))),
      })),
    );
    if (artifacts[0].sha256 !== inputHash) throw new Error("RETAINED_INPUT_CHANGED");
    const summary = {
      status: "COMPLETED",
      registryHash,
      inputHash,
      artifacts,
      batches: String(batches),
      sessions: String(sessions.size),
      candidateObservations: String(candidates),
      qualifyingObservations: String(qualifying),
      snapshotSimulatedAdmissions: String(admissions),
      modes: [...modes].sort(),
      portfolioReplayStatus: "SNAPSHOT_ADMISSIONS_ONLY_NOT_CONTINUOUS_BACKTEST",
      oosClaim: false,
      executionEnabled: false,
      pnlStatus: "ESTIMATED",
      profitability: "NOT_EVALUATED",
      finishedAt: new Date().toISOString(),
    };
    await writeFile(resolve(output, "complete.json"), canon(summary), { flag: "wx" });
    return summary;
  } catch (e) {
    await writeFile(
      resolve(output, "failed.json"),
      canon({
        status: "FAILED_PARTIAL_ARTIFACTS_NOT_GRADABLE",
        batches: String(batches),
        error: e instanceof Error ? e.message : "CENSUS_FAILED",
      }),
      { flag: "wx" },
    );
    throw e;
  } finally {
    await candidateFile.close();
    await portfolioFile.close();
  }
}
