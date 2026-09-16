import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
const expected = "vicia05-lab/trading-app";
const identity = JSON.parse(readFileSync(new URL("../PROJECT_IDENTITY.json", import.meta.url), "utf8"));
if (identity.repository !== expected || identity.project_id !== "grok-github-trading-app") throw new Error("Wrong project identity");
if (process.env.GITHUB_REPOSITORY && process.env.GITHUB_REPOSITORY !== expected) throw new Error("Wrong GitHub repository");
let origin = "";
try { origin = execFileSync("git", ["remote", "get-url", "origin"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim(); } catch { /* A local source archive need not have a remote. */ }
if (origin && !/^https:\/\/github\.com\/vicia05-lab\/trading-app(?:\.git)?\/?$/.test(origin) && !/^git@github\.com:vicia05-lab\/trading-app(?:\.git)?$/.test(origin)) throw new Error("Repository remote does not match Grok's app");
console.log(`Verified project: ${identity.project_id} (${expected}). PC application is out of scope.`);
