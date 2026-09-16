import { spawnSync } from "node:child_process";

const env = { ...process.env, NITRO_PRESET: "node-server" };
const result = spawnSync(process.execPath, ["scripts/with-app-env.mjs", "vite", "build"], {
  stdio: "inherit",
  env,
});
if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status ?? 1);
