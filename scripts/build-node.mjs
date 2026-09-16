import { spawnSync } from "node:child_process";

function run(command, args, env = process.env) {
  const result = spawnSync(command, args, { stdio: "inherit", env });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

const env = { ...process.env, NITRO_PRESET: "node-server" };
run(process.execPath, ["scripts/with-app-env.mjs", "vite", "build"], env);
run(process.execPath, ["scripts/migrate.mjs"], env);
