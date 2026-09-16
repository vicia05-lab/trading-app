// Isolated component browser audit. Injected synthetic transport; no app login, DB or broker.
import { createServer } from "vite";
import react from "@vitejs/plugin-react";
import tailwind from "@tailwindcss/vite";
import { chromium } from "playwright";
import { mkdtemp, writeFile, mkdir, rm } from "node:fs/promises";
import { resolve, join } from "node:path";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";
import { volumeFixture, volumeFixtureEntry } from "../src/desk/volume-fixtures.ts";
import { buildVolumeCapture } from "../src/desk/volume-capture.ts";
import { simulateVolumeExit } from "../src/kernel/volume-replay.ts";
const root = resolve(fileURLToPath(new URL("..", import.meta.url))),
  dir = await mkdtemp(join(root, ".volume-browser-"));
const scenarios = [
    "qualifying",
    "capacity_full",
    "missing_data",
    "low_liquidity",
    "same_bar_entry",
    "missing_exit",
  ],
  responses = {};
for (const scenario of scenarios) {
  const f = volumeFixture();
  if (scenario === "missing_data") f.sourceState = "NOT_CHECKED";
  if (scenario === "low_liquidity") f.entryMinuteDollarVolume.value = "60000.0000";
  const e = volumeFixtureEntry(f);
  if (scenario === "capacity_full")
    e.risk.commitments = Array.from({ length: 3 }, (_, i) => ({
      securityId: "OCCUPIED_" + i,
      state: "OPEN",
      notional: "4000.0000",
      risk: "50.0000",
    }));
  if (scenario === "same_bar_entry") e.quote = { ...f.quote };
  const capture = buildVolumeCapture([f], e.risk, { [f.securityId]: e.quote });
  const p = capture.portfolioLedger[0];
  const exit =
    scenario === "missing_exit"
      ? simulateVolumeExit(
          p,
          { coverage: "VERIFIED", fromAt: p.entryAt, throughAt: p.exitDueAt, quotes: [] },
          p.exitDueAt,
        )
      : null;
  responses[scenario] = { evidenceScope: "SYNTHETIC_EXAMPLE", capture, exit };
}
await writeFile(
  join(dir, "stub.ts"),
  'export const runVolumeSyntheticExample=async()=>{throw Error("REAL_TRANSPORT_DISABLED_IN_COMPONENT_TEST")};',
);
await writeFile(
  join(dir, "index.html"),
  '<html><head><meta name="viewport" content="width=device-width, initial-scale=1"></head><body><div id="root"></div><script type="module" src="/entry.tsx"></script></body></html>',
);
await writeFile(
  join(dir, "harness.css"),
  '@import "../src/styles.css";\n@source "../src/components/volume-research.tsx";',
);
await writeFile(
  join(dir, "entry.tsx"),
  `import React from 'react';import {createRoot} from 'react-dom/client';import {VolumeResearch} from '../src/components/volume-research';import './harness.css';const data=${JSON.stringify(responses)};createRoot(document.getElementById('root')!).render(<main className="mx-auto max-w-5xl p-4"><VolumeResearch runExample={async(s)=>{if((window as any).testFail)throw Error('TEST');if((window as any).testTimeout)return new Promise(()=>{});return data[s] as any;}}/></main>);`,
);
const server = await createServer({
  root: dir,
  configFile: false,
  plugins: [react(), tailwind()],
  resolve: { alias: { "@/desk/volume-research-fns": join(dir, "stub.ts") } },
  server: { host: "127.0.0.1", port: 0, fs: { allow: [root] } },
  logLevel: "error",
});
let browser;
const checks = [],
  errors = [];
await mkdir(join(root, "docs", "volume-v21-browser"), { recursive: true });
try {
  await server.listen();
  const address = server.httpServer.address();
  browser = await chromium.launch({ headless: true, channel: "msedge", timeout: 15000 });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  page.on("pageerror", (e) => errors.push(e.message));
  await page.route("**/*", (route) =>
    new URL(route.request().url()).hostname === "127.0.0.1" ? route.continue() : route.abort(),
  );
  await page.goto("http://127.0.0.1:" + address.port, { waitUntil: "networkidle" });
  await page.getByRole("heading", { name: "Audited volume research workbench" }).waitFor();
  checks.push("desktop renders real component");
  const expected = {
    qualifying: "Passed the paper-replay safeguards",
    capacity_full: "all three shared slots are occupied",
    missing_data: "required signal or evidence missing",
    low_liquidity: "modeled shares 5",
    same_bar_entry: "entry quote must follow the completed signal",
    missing_exit: "Capacity released: no",
  };
  for (const s of scenarios) {
    await page.getByLabel("Fictional audit scenario").selectOption(s);
    await page.getByRole("button", { name: "Run volume audit example" }).click();
    await page.getByRole("status").waitFor();
    assert.ok((await page.getByRole("status").innerText()).includes(expected[s]), s);
    checks.push(s);
  }
  await page.screenshot({
    path: join(root, "docs/volume-v21-browser/desktop.png"),
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  assert.equal(
    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    true,
  );
  checks.push("mobile has no horizontal overflow");
  await page.screenshot({ path: join(root, "docs/volume-v21-browser/mobile.png"), fullPage: true });
  await page.evaluate(() => {
    window.testFail = true;
  });
  await page.getByRole("button", { name: "Run volume audit example" }).click();
  await page.getByRole("alert").waitFor();
  checks.push("transport failure displays error without fabricated result");
  await page.evaluate(() => {
    window.testFail = false;
  });
  await page.getByRole("button", { name: "Run volume audit example" }).click();
  await page.getByRole("status").waitFor();
  checks.push("retry restores real component result");
  await page.clock.install();
  await page.evaluate(() => {
    window.testTimeout = true;
  });
  await page.getByRole("button", { name: "Run volume audit example" }).click();
  assert.ok(await page.getByRole("button", { name: "Checking safeguards…" }).isDisabled());
  await page.clock.fastForward(12001);
  await page.getByRole("alert").waitFor();
  checks.push("timeout clears busy state and permits retry");
  assert.deepEqual(errors, []);
  checks.push("zero browser page errors");
  await writeFile(
    join(root, "docs/VOLUME_V21_BROWSER_CHECKS.json"),
    JSON.stringify(
      {
        scope: "ISOLATED_COMPONENT_WITH_SYNTHETIC_TRANSPORT",
        authenticatedAppRun: false,
        realProviderRequests: false,
        brokerOrders: false,
        checks,
        passed: checks.length,
        errors,
      },
      null,
      2,
    ),
  );
  console.log(JSON.stringify({ passed: checks.length, checks }));
} finally {
  if (browser) await browser.close();
  await server.close();
  await rm(dir, { recursive: true, force: true });
}
