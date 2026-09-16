import { runVolumeCensus } from "../src/desk/volume-census.ts";
const args = process.argv.slice(2);
if (args.length !== 2) {
  console.error(
    "Usage: node --experimental-strip-types scripts/volume-research-census.mjs INPUT.ndjson NEW_OUTPUT_DIRECTORY",
  );
  process.exitCode = 2;
} else {
  try {
    console.log(JSON.stringify(await runVolumeCensus(args[0], args[1]), null, 2));
  } catch (error) {
    console.error(error instanceof Error ? error.message : "CENSUS_FAILED");
    process.exitCode = 1;
  }
}
