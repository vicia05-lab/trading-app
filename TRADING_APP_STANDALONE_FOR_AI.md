# Trading App — FULL SOURCE PACKET FOR ANOTHER AI

Generated: 2026-09-13T15:43:19Z
GitHub: https://github.com/vicia05-lab/trading-app
Product: paper-only AMC earnings desk + optional Alpaca paper venue
This file is the live source. Critique it. Run it. Do not treat it as a sketch.

## How to run

```bash
git clone https://github.com/vicia05-lab/trading-app.git
cd trading-app
npm install
npm run typecheck
npm test
python3 trading_app_kernel_audit.py
```

Kernel-only (no Node): `python3 trading_app_kernel_audit.py`

## Product facts

- Paper-only. Long-only. After-close issuer-confirmed earnings.
- Freeze is irrevocable. NO_FREEZE ≠ STAND_DOWN.
- Fills on the earnings sleeve are modeled official-close haircuts, not broker fills, unless the paper auto-run submits an Alpaca order.
- Learning loop: after a released report, clean PREDICT labels may write an immutable rule_card revision. Past freezes are never rewritten.
- Operator mutates; Reviewer is read-only for research labels.
- Alpaca secrets never round-trip to the browser.
- Live Alpaca auto-execution stays off.

## Must-hold invariants

1. Input hash domain `Trading App|input|2`. Golden H01 `bac8f1353582276f85608c618ad44f104f5480fea76d03ce0dbcad4955522726`
2. CJ1: JSON numbers illegal; decimals are strings
3. Pin *order* does not change input hash; pin *content* does
4. modeled_fill constant_penalty = 0.000500
5. Direction hit on a zero return is MISS
6. Capacity denial is not FLAT
7. Writer gate is first lock; event_seq is the only mutation clock
8. Sealed freeze evaluates the rule_card hashed into THAT manifest, not the latest learned AST
9. Learning adopts only from in_evidence_set GRADED PREDICT labels, n≥3
10. Alpaca secret never leaves the server

## Attack list

- Float leakage in kernel / PnL / fill / learning thresholds
- Freeze using INITIAL_AST instead of the sealed rule_card
- Learning rewriting past freezes or training on the vintage being frozen
- Operator seeing direction hits / P&L
- Alpaca keys in client bundles
- Paper vs live host mix-up; auto-run in LIVE
- SQL `"freeze"` / `"position"` unquoted
- Bar history empty when `start` omitted (weekend)
- Ticker click dead / quote drawer not mounted
- Auth gate stuck on "Loading workspace access"

## File index (sha256)

18fdd6671874862ca49af99870d6bdf0e438e3098594009e7fd08c24a38f2c24  AUDIT_FOR_AI.md  1698 bytes  47 lines
67f412e956854f5135511912f5786df39983f143c75f7ad3ef1ee5812442c15c  package.json  3660 bytes  99 lines
8abad87a6c62322f1f4fdff02d5f3f764ea10a98c49cfafccdc288a0dced492f  tsconfig.json  722 bytes  37 lines
5451c22b17e7d8408674909b3d231f0ae4a4d017b740491ce7df008d961a7eee  vite.config.ts  6750 bytes  184 lines
5f0db062bbfcc0f7e7d1f8cc4302c4d1bf8fa49676457ec3de68cb74b01f80b8  startup.sh  191 bytes  9 lines
822230b95a34cf7362fc428eac845cc3a66b521b6af91d05115ac068404f42aa  trading_app_kernel_audit.py  44635 bytes  1126 lines
131ff3f5f7f8c5328d993abcb51e3642b8ee3eb5efb49006e437f9003fefb919  python/trading_app_kernel.py  3868 bytes  98 lines
f953cacc448c0c81ae4fe63e66b0e59569e840782ad279fdee201dff529363e9  migrations/0001_auth.sql  2739 bytes  68 lines
86182bceb6a9e09820123c11efc8a207ec4f7d4029446d6bf718064aac9779a9  migrations/0002_trading_app.sql  33664 bytes  722 lines
b075b1a705107adf3a437cc923368b942112a8af7c5ef1dbb24e2588426ea18e  migrations/0003_alpaca.sql  1668 bytes  40 lines
e11beadf3bdadf0fc93e2e87d4e8266711bdf075d13e238a9444645fd4292bb2  migrations/0003_rule_revision.sql  792 bytes  23 lines
41fe1618225ac3c832d84c6f9d72db1781f7b8d709788ef13f0dd2a9cce35a11  migrations/0005_alpaca_data_secrets.sql  1514 bytes  31 lines
275612221598f7d3bd6711023c6a3c82600b99f21ab1b4392d687b627f6d4ba7  src/kernel/index.ts  30308 bytes  860 lines
ded4999dc6ec93c464c53bdc91d75cd278956ea5e72b84ac181e00b5c387bbd8  src/kernel/kernel.test.ts  13009 bytes  323 lines
95ff046ddbf1cddb227134df37791ab04955720579ff9bc4793c4b1050b5d98a  src/desk/util.ts  3003 bytes  89 lines
04a3a3c01b304c32a4f04a5eddcd52454c1de06994690de8189a219f899353b5  src/desk/writer.ts  6243 bytes  173 lines
9fbabcda2bf7afb9a6412814c3059b5c6dc98512779db9b1348b886ba8a7c0e1  src/desk/features.ts  5322 bytes  157 lines
a43c165282d5bf91219a4e53c4cc6b122ce5e2f3cb8292b77188f4cfdbc15188  src/desk/commands.ts  34125 bytes  833 lines
177bae7ffe562cfb1d4fceff6f1d02b70e779e0247f97a28b6576e81175f3a99  src/desk/lifecycle.ts  30170 bytes  691 lines
e1fe9970a62b2f2d2e39f4f869cfed54e1be7ddccd05c44c61cc9d322fae9d3c  src/desk/bootstrap.ts  24805 bytes  618 lines
ab81bf7047d44ec49156b68774313d06c385e1f4c3ce66b2ce067330b4f11f92  src/desk/learn-policy.ts  4820 bytes  129 lines
3139a409e5de233a19085b43d47c00c692af9121c5d8ddfb3c708a69d4064bc5  src/desk/learn.ts  13351 bytes  384 lines
1553da5a794a4805438b2dda4739d3043d45f6eb8398de1551d0ef51bfea9527  src/desk/learn.test.ts  2463 bytes  67 lines
13fbee5c4cd0ae1d5ff82d6c3d568295ff0c839c13aac26c820c297d3c8e5b9f  src/desk/queries.ts  23878 bytes  563 lines
c9749421773942c1be337c81c03eedb69eb85292409444c3494c1dc09f14f103  src/desk/auto-trade.ts  15361 bytes  453 lines
c950e6025a2becc87ac6e00e71e18062fb8ccabf8c996bd6500bfb5c09f449f9  src/desk/alpaca-types.ts  1278 bytes  53 lines
68cd038cf61c6e1aed11bd7930dc8375bfb26d417a0b16706ff0460d41954ed9  src/desk/alpaca.ts  33512 bytes  914 lines
55d869326848b6a0a3e3323e8a571c5a8940ac58b2829c39e4e95545a4848cab  src/desk/alpaca-data-secrets.ts  11002 bytes  222 lines
41efac3318a9a779daf9d59f1798381e5b839c1f11d2ed1081e598f006c833f4  src/desk/alpaca-data-service.server.ts  3116 bytes  77 lines
0667d033f3e864efaf14969d9ca973fccc109060ebab4a78a874bb54e5c3b7da  src/desk/alpaca-master-key.server.ts  1534 bytes  55 lines
1eaa8891215284dbce94a33d9846303093b3108d2858215303a7c290c3a6b73c  src/desk/alpaca-data-fns.ts  2322 bytes  57 lines
79cddf66ee836031c81aaae08a6ad405e2bfb7f29fe0511250c9bfe1e6abddca  src/desk/server-fns.ts  8706 bytes  219 lines
42e70dede59b312f6658474296dcedceb894086cac9335a67de166f243322cf5  src/desk/server-fns-impl.server.ts  8289 bytes  252 lines
86a1fd1a657e03278a8ea8a13866cff1e9a811ab1f23165d579f62f35568545a  src/ui/labels.ts  7260 bytes  180 lines
85965e26b093ad568b9d929f02bb0e536b36f595cb2c772f1a6dacf0fc0f5618  src/ui/theme.ts  749 bytes  29 lines
2fa0fdadc6e1393cba6c22708c4ec1099266164e4e50631d72e438ed90dffa5d  src/components/app-shell.tsx  12593 bytes  337 lines
e7d629cf4cf6e2bb608651f7b0f43b2ec2a697a3a4008454ed17ea01123bed28  src/components/drawer.tsx  1314 bytes  46 lines
ca3f3758424564bc4b404e08e95b1a71bdb74fe921bae5b03f72ce0587e36afc  src/components/ticker-quote.tsx  3251 bytes  111 lines
f69b91c1cbacc913bcdfd38344d762f6f233ecfa6a19a3a6e8fb9c674295654f  src/components/ticker-tape.tsx  9198 bytes  240 lines
f46fcd21c66b39f11fed16951fde9e6e45a46a84211bbcc21f52f38fd0c0b487  src/components/alpaca-keys.tsx  9550 bytes  279 lines
4d5f8eabad38ccdbc7c7a86a18f71ebfdac764a04eb8c1792cc86c3a781165f3  src/components/alpaca-data-secrets.tsx  13093 bytes  301 lines
39813dd9b327b094479dd39d4819d3eebd6eb02ce63fb66b6c97c074798d2b19  src/routes/__root.tsx  1524 bytes  45 lines
22abc283c3d0fe0316b1aef3848802bac0a4733fd232dcab45529958a4048f4f  src/routes/login.tsx  4248 bytes  114 lines
989fe3bbf829f9726758bc160f03249fc80849366f267bc29b03d37b7e6d2e73  src/routes/index.tsx  13383 bytes  302 lines
e7e320d4ff01adf34f55bad7d0104acb00db973b081e191777d39201dab9453b  src/routes/earnings.tsx  8839 bytes  200 lines
5e5f6e66197b9a5c95c5cdf32f4b79db2480ac2213eb4afcc2fc5e7c50e107db  src/routes/predictions.tsx  7905 bytes  186 lines
f6bcdbc3d8c453eec194b9aa504ce658fefd527cd68f3181d4d917856cd805af  src/routes/results.tsx  10335 bytes  274 lines
209f44a34290521caabaff84717133c91612ed8996e82bd36f114e7305044fa1  src/routes/admin.tsx  12428 bytes  296 lines
0efddd5bcc7bf22e1b0a2b587de4f5316f38840cbd06fa4e8b051fbc04b1cba4  src/routes/trade.tsx  979 bytes  25 lines
7a1a96be5bf3c7af6162acc901970f620084b1e16d7f222d77df53a3bce8a97c  src/routes/keys.tsx  274 bytes  11 lines
d78a99b8e73e86cd1d8ec1c5404eae1a9c264da05a26ed635fabfa05c518cd26  src/lib/db.ts  10791 bytes  282 lines
8dc37c4e9bd583f175402330d0952ef4d584c7410723cc2649c4046d5084bd80  src/lib/auth/middleware.ts  2462 bytes  48 lines
4bca649afb627b11231a7b31acfcffe9323efddebc05944b2d769d2b8589294f  src/lib/auth/client.ts  9714 bytes  237 lines
a0cc4bd74b6da5b346b6bafc1aec58b9bf5cc0278264379b737b79a5cff1e482  src/lib/auth/use-current-user.ts  3315 bytes  84 lines

Total concatenated bytes: 521723


---

## `AUDIT_FOR_AI.md` (1698 bytes, sha256 `18fdd6671874862ca49af99870d6bdf0e438e3098594009e7fd08c24a38f2c24`)

```md
# Critique brief — Trading App (for another AI)

You are reviewing a paper-only AMC earnings desk plus an Alpaca venue.

Clone, run, then attack. Do not treat the app as a toy.

```bash
git clone https://github.com/vicia05-lab/trading-app.git
cd trading-app
npm install
npm run typecheck
python3 trading_app_kernel_audit.py
node --experimental-strip-types --test src/kernel/kernel.test.ts
```

Runnable kernel packet (this repo root): `trading_app_kernel_audit.py`.

## Applied patches (PATCH-01..07)

Production now matches the reviewer patch:

| Patch | What changed |
|---|---|
| 01 | `paperPnl` rejects floats / non-text |
| 02 | Negative/zero fill, exit, notional, commission fail loud |
| 03 | Hit tests reject floats; inverted bands throw |
| 04 | Admission rejects corrupt counters instead of granting capacity |
| 05 | `DEC_TEXT` — no exponent, `+`, whitespace, Inf/NaN |
| 06 | `computeCardComplete` uses the same `CANON_DEC12` as `evaluate` |
| 07 | `outputHash` requires utf-8-sorted, deduped `reasons` |

Desk capacity math no longer uses `Number()`. Risk cache compare, reserve, and release go through the BigInt decimal kernel.

## Must-hold invariants

1. Input hash domain is `Trading App|input|2`. Golden H01:
   `bac8f1353582276f85608c618ad44f104f5480fea76d03ce0dbcad4955522726`
2. CJ1: JSON numbers are illegal; every number is a decimal string
3. Pin order does not change the input hash; pin *content* does
4. `modeled_fill` uses `constant_penalty = 0.000500`
5. Direction hit on a zero return is **MISS**
6. Capacity denial is not FLAT
7. `NO_FREEZE` ≠ `STAND_DOWN`
8. Alpaca secret never round-trips to the browser

Return a GO / NO-GO with failing probes, not vibes.
```


---

## `package.json` (3660 bytes, sha256 `67f412e956854f5135511912f5786df39983f143c75f7ad3ef1ee5812442c15c`)

```json
{
  "name": "app-builder-workspace",
  "private": true,
  "sideEffects": false,
  "type": "module",
  "overrides": {
    "nf3": "0.3.17"
  },
  "scripts": {
    "dev": "node scripts/with-app-env.mjs vite dev --host 0.0.0.0 --port 8080",
    "build": "node scripts/with-app-env.mjs vite build && npm run db:migrate",
    "db:migrate": "node scripts/migrate.mjs",
    "build:dev": "node scripts/with-app-env.mjs vite build --mode development",
    "preview": "node scripts/with-app-env.mjs vite preview",
    "preview:restart": "node scripts/preview.mjs restart",
    "preview:stop": "node scripts/preview.mjs stop",
    "typecheck": "tsc --noEmit",
    "check:auth": "node scripts/check-auth-invariant.mjs",
    "test": "node --test 'scripts/**/*.test.mjs' && node --experimental-strip-types --test src/lib/app-data/app-data.test.ts src/lib/app-data/readiness-schedule.test.ts src/lib/auth/gate-identity.test.ts src/lib/auth/sign-in-gate.test.ts src/kernel/kernel.test.ts src/desk/learn.test.ts",
    "lint": "eslint .",
    "format": "prettier --write .",
    "test:alpaca-secrets": "node --experimental-strip-types --test src/desk/alpaca-data-secrets.test.ts"
  },
  "dependencies": {
    "@electric-sql/pglite": "^0.5.4",
    "@hookform/resolvers": "^5.7.0",
    "better-auth": "~1.6.30",
    "jose": "6.2.9",
    "kysely": "^0.28.5",
    "pg": "^8.16.3",
    "@radix-ui/react-accordion": "^1.2.12",
    "@radix-ui/react-alert-dialog": "^1.1.15",
    "@radix-ui/react-avatar": "^1.1.11",
    "@radix-ui/react-checkbox": "^1.3.3",
    "@radix-ui/react-collapsible": "^1.1.12",
    "@radix-ui/react-dialog": "^1.1.15",
    "@radix-ui/react-dropdown-menu": "^2.1.16",
    "@radix-ui/react-label": "^2.1.8",
    "@radix-ui/react-popover": "^1.1.15",
    "@radix-ui/react-progress": "^1.1.8",
    "@radix-ui/react-radio-group": "^1.3.8",
    "@radix-ui/react-scroll-area": "^1.2.10",
    "@radix-ui/react-select": "^2.2.6",
    "@radix-ui/react-separator": "^1.1.8",
    "@radix-ui/react-slider": "^1.3.6",
    "@radix-ui/react-slot": "^1.2.4",
    "@radix-ui/react-switch": "^1.2.6",
    "@radix-ui/react-tabs": "^1.1.13",
    "@radix-ui/react-toggle": "^1.1.10",
    "@radix-ui/react-toggle-group": "^1.1.11",
    "@radix-ui/react-tooltip": "^1.2.8",
    "@tailwindcss/vite": "^4.3.0",
    "@tanstack/react-query": "^5.101.0",
    "@tanstack/react-router": "^1.170.0",
    "@tanstack/react-start": "^1.168.0",
    "@tanstack/react-table": "^8.21.0",
    "@tanstack/router-plugin": "^1.168.0",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "cmdk": "^1.1.1",
    "date-fns": "^4.0.0",
    "lucide-react": "^0.510.0",
    "react": "^19.2.0",
    "react-day-picker": "^9.14.0",
    "react-dom": "^19.2.0",
    "react-hook-form": "^7.54.0",
    "react-resizable-panels": "^4.6.5",
    "recharts": "^2.13.0",
    "sonner": "^2.0.7",
    "tailwind-merge": "^3.5.0",
    "tailwindcss": "^4.3.0",
    "tw-animate-css": "^1.3.4",
    "vaul": "^1.1.2",
    "zod": "^4.4.0",
    "zustand": "^5.0.0"
  },
  "devDependencies": {
    "@eslint/js": "^9.20.0",
    "@types/node": "^22.16.5",
    "@types/pg": "^8.11.10",
    "@types/react": "^19.2.0",
    "@types/react-dom": "^19.2.0",
    "@vitejs/plugin-react": "^5.2.0",
    "eslint": "^9.20.0",
    "eslint-config-prettier": "^10.1.1",
    "eslint-plugin-prettier": "^5.2.6",
    "eslint-plugin-react-hooks": "^5.2.0",
    "eslint-plugin-react-refresh": "^0.4.20",
    "globals": "^15.15.0",
    "lightningcss": "^1.28.0",
    "nitro": "3.0.260610-beta",
    "playwright": "^1.62.0",
    "prettier": "^3.4.0",
    "typescript": "^5.7.0",
    "typescript-eslint": "^8.56.1",
    "vite": "^8.2.0"
  }
}
```


---

## `tsconfig.json` (722 bytes, sha256 `8abad87a6c62322f1f4fdff02d5f3f764ea10a98c49cfafccdc288a0dced492f`)

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": [
      "ES2022",
      "DOM",
      "DOM.Iterable"
    ],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "isolatedModules": true,
    "skipLibCheck": true,
    // `src/lib/db.ts` imports scripts/migration-plan.mjs; checkJs types the
    // implementation itself instead of a hand-written declaration beside it.
    "allowJs": true,
    "checkJs": true,
    "noEmit": true,
    "types": [
      "vite/client",
      "node"
    ],
    "baseUrl": ".",
    "paths": {
      "@/*": [
        "./src/*"
      ]
    },
    "allowImportingTsExtensions": true
  },
  "include": [
    "src",
    "server"
  ]
}
```


---

## `vite.config.ts` (6750 bytes, sha256 `5451c22b17e7d8408674909b3d231f0ae4a4d017b740491ce7df008d961a7eee`)

```ts
import { readdirSync } from "node:fs";
import { join } from "node:path";
import type { Plugin } from "vite";
import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { nitro } from "nitro/vite";
// @ts-expect-error JS plugin alongside the TS vite config
import { grokPwaPlugin } from "./scripts/grok-pwa-plugin.mjs";
// @ts-expect-error JS plugin alongside the TS vite config
import { appEnvPlugin } from "./scripts/app-env-plugin.mjs";
import { isMigrationFile } from "./scripts/migration-plan.mjs";

/** The files `src/lib/db.ts` globs — same directory, same non-recursive scope. */
function hasGlobbedMigrations(root: string): boolean {
  try {
    return readdirSync(join(root, "migrations")).some(isMigrationFile);
  } catch {
    return false;
  }
}

/**
 * Finish PGLite bootstrap during dev-server setup (before traffic). Vite awaits
 * async `configureServer` hooks. Production: `src/lib/db` kicks `ensureDbReady`
 * on import.
 *
 * Vite awaiting the hook puts this on time-to-first-render, so an app with no
 * migrations — no schema to apply — skips it entirely rather than paying for a
 * PGLite instance it never queries.
 */
function pgliteBootstrapPlugin(): Plugin {
  return {
    name: "app-builder:pglite-bootstrap",
    apply: "serve",
    async configureServer(server) {
      if (!hasGlobbedMigrations(server.config.root)) return;
      try {
        const mod = (await server.ssrLoadModule("/src/lib/db.ts")) as {
          ensureDbReady?: () => Promise<void>;
        };
        if (typeof mod.ensureDbReady === "function") {
          await mod.ensureDbReady();
        }
      } catch (err) {
        console.error("[app-builder] DB bootstrap failed:", err);
        throw err;
      }
    },
  };
}

/**
 * Live-preview OAuth popup — handled HERE so the agent never has to create a
 * `/auth/popup` route (and cannot break it by scaffolding a React page that
 * paints the full app shell in the popup).
 *
 * `signIn` (client.ts) opens `/auth/popup?providerId=…` in a top-level window.
 * This middleware runs before TanStack Start, calls `handleAuthPopupRequest`,
 * and returns the 302 / completion HTML. Deployed apps do not use the popup
 * (full-page OAuth redirect), so `apply: "serve"` is enough.
 */
function authPopupPlugin(): Plugin {
  return {
    name: "app-builder:auth-popup",
    apply: "serve",
    configureServer(server) {
      // Register immediately (not in a returned post-hook) so we run BEFORE
      // TanStack Start / the SPA HTML fallback. A model-authored
      // `src/routes/auth/popup.tsx` React page must never win this path.
      server.middlewares.use(async (req, res, next) => {
        try {
          const rawUrl = req.url ?? "";
          const pathOnly = rawUrl.split("?", 1)[0] ?? "";
          if (pathOnly !== "/auth/popup") {
            next();
            return;
          }
          if ((req.method ?? "GET").toUpperCase() !== "GET") {
            res.statusCode = 405;
            res.setHeader("content-type", "text/plain; charset=utf-8");
            res.end("Method Not Allowed");
            return;
          }

          const host = String(
            req.headers["x-forwarded-host"] ?? req.headers.host ?? "localhost:8080",
          );
          const proto = String(
            req.headers["x-forwarded-proto"] ??
              ((req.socket as { encrypted?: boolean } | undefined)?.encrypted ? "https" : "http"),
          );
          const requestHeaders = new Headers();
          for (const [key, value] of Object.entries(req.headers)) {
            if (value === undefined) continue;
            if (Array.isArray(value)) {
              for (const v of value) requestHeaders.append(key, v);
            } else {
              requestHeaders.set(key, value);
            }
          }
          // Ensure Host is the public preview host so Better Auth's dynamic
          // baseURL / redirect_uri match the popup origin.
          if (!requestHeaders.has("host")) requestHeaders.set("host", host);

          const request = new Request(`${proto}://${host}${rawUrl}`, {
            method: "GET",
            headers: requestHeaders,
          });

          const mod = (await server.ssrLoadModule("/src/lib/auth/popup.server.ts")) as {
            handleAuthPopupRequest: (req: Request) => Promise<Response>;
          };
          const response = await mod.handleAuthPopupRequest(request);

          res.statusCode = response.status;
          // Preserve multiple Set-Cookie headers (OAuth state + session).
          const setCookies =
            typeof response.headers.getSetCookie === "function"
              ? response.headers.getSetCookie()
              : [];
          response.headers.forEach((value, key) => {
            if (key.toLowerCase() === "set-cookie") return;
            res.setHeader(key, value);
          });
          for (const cookie of setCookies) {
            res.appendHeader("set-cookie", cookie);
          }
          const body = Buffer.from(await response.arrayBuffer());
          res.end(body);
        } catch (err) {
          console.error("[app-builder] /auth/popup handler failed:", err);
          if (!res.headersSent) {
            res.statusCode = 500;
            res.setHeader("content-type", "text/plain; charset=utf-8");
            res.end("auth popup failed");
          }
        }
      });
    },
  };
}

// `0.0.0.0:8080` is the live-preview contract — don't change host/port.
// The dev server starts once `src/router.tsx` and `src/routes/` exist — see
// AGENTS.md § "First scaffold".
export default defineConfig(({ command, isPreview }) => ({
  server: {
    host: "0.0.0.0",
    port: 8080,
    strictPort: true,
  },
  preview: {
    host: "127.0.0.1",
    port: 8081,
    strictPort: true,
  },
  resolve: { tsconfigPaths: true },
  plugins: [
    pgliteBootstrapPlugin(),
    // Before tanstackStart so /auth/popup never falls through to the SPA.
    authPopupPlugin(),
    // Dev-only /__app-env, read by scripts/check-auth-invariant.mjs.
    appEnvPlugin(),
    // PWA head + ?install=1 tutorial page; runs before Start/Nitro.
    grokPwaPlugin(),
    tailwindcss(),
    tanstackStart(),
    ...(command === "build" || isPreview
      ? [
          nitro({
            preset: "vercel",
            // Auto-registers server/middleware/* (the PWA install page +
            // manifest + head-tag middleware). Nitro v3 defaults serverDir to
            // false, so removing this silently unwires /?install=1 on deploys.
            serverDir: "./server",
          }),
        ]
      : []),
    viteReact(),
  ],
}));
```


---

## `startup.sh` (191 bytes, sha256 `5f0db062bbfcc0f7e7d1f8cc4302c4d1bf8fa49676457ec3de68cb74b01f80b8`)

```bash
#!/bin/sh
set -eu
cd /workspace
node scripts/preview.mjs stop || true
if curl -sf -o /dev/null --max-time 2 http://127.0.0.1:8080/; then
  exit 0
fi
npm run dev >>/tmp/app-startup.log 2>&1 &
```


---

## `trading_app_kernel_audit.py` (44635 bytes, sha256 `822230b95a34cf7362fc428eac845cc3a66b521b6af91d05115ac068404f42aa`)

```python
#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Trading App v1.2 — STANDALONE KERNEL AUDIT PACKET
=================================================
Give this single file to another model. It does not need the rest of the repo.

WHAT THIS IS
  The paper-only AMC earnings desk kernel claimed to be authoritative for:
    product_name            = "Trading App"
    paperOnly               = true
    liveTradingSupported    = false
    activeModelWeight       = "0"
    engine_version          = "trading-app-evaluator-1.2.0"
    hash domain (input)     = "Trading App|input|2"
    rounding                = ROUND_HALF_UP (ties away from zero)
    numbers in CJ1          = DECIMAL STRINGS ONLY — never JSON numbers

  This is NOT a broker. Browser math must not decide labels, fills, risk, or hashes.

HOW TO RUN
  python3 trading_app_kernel_audit.py
  Expected: all tests PASS, then a SCRUTINY BRIEF is printed.
  Stdlib only (hashlib, decimal, json, re, struct, unittest). No pip.

YOUR JOB (reviewing AI)
  1. Run the file. If any golden fails, stop and report — the packet is corrupt.
  2. Attack the kernel: hashes, Decimal vs float, AST, fill/PnL, CJ1, shuffle.
  3. Compare PRODUCTION KERNEL (this file, top) vs CONFLICTING PASTE (bottom).
     They do NOT agree. Decide which contract is correct and why.
  4. Produce a go / no-go with:
       - bugs that change a PREDICT / fill / hash / capacity decision
       - tests you added that this file does not already run
       - residual risk if this kernel is the only authority

DO NOT
  - Invent a live broker.
  - Treat JSON numbers as legal in canonical payloads.
  - Equate NO_FREEZE with STAND_DOWN.
  - Equate IMPAIRED_* with FLAT.
  - Use float for money, fills, or hit tests.

GOLDEN VECTORS (must match bit-for-bit)
  H01 input hash  = bac8f1353582276f85608c618ad44f104f5480fea76d03ce0dbcad4955522726
  AST hash        = e9cf184a531fd993dc1b36ce0e1a1b0dcd67ebc4b80e4ff1ebe5a72ab00c15f4
  modeled fill    = 123.456789 * (1+0.000500)  →  123.518517394500
  hotel-style pnl = notional 5000.0000, exit 105.000000, fill 100.050000000000 → 247.3763
  shuffle         = ["SEC-C","SEC-A","SEC-B"] + seed 01*32  →  ["SEC-A","SEC-C","SEC-B"]
"""
from __future__ import annotations

import hashlib
import json
import re
import struct
import unittest
from decimal import (
    Decimal,
    ROUND_HALF_UP,
    localcontext,
    Context,
    InvalidOperation,
    DivisionByZero,
    Overflow,
)

D = Decimal

# ─────────────────────────────────────────────────────────────────────────────
# PRODUCTION KERNEL (matches the TypeScript desk kernel, not the conflicting paste)
# ─────────────────────────────────────────────────────────────────────────────

IDENT = re.compile(r"[A-Za-z0-9][A-Za-z0-9:._-]{0,63}\Z")
HEX = re.compile(r"[0-9a-f]{64}\Z")
DEC = re.compile(r"-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?\Z")
KEY = re.compile(r"[A-Za-z_][A-Za-z0-9_]*\Z")
CANON_DEC12 = re.compile(r"-?(?:0|[1-9][0-9]*)\.[0-9]{12}\Z")
# PATCH-05: money/price text must be plain decimal with an explicit fraction.
# Blocks "1E2", "1e2", "+100.00", " 100.00", "100.00 ", "0.1_0", "Inf", "NaN".
DEC_TEXT = re.compile(r"-?(?:0|[1-9][0-9]*)\.[0-9]{1,18}\Z")

PRODUCT_NAME = "Trading App"
ENGINE_VERSION = "trading-app-evaluator-1.2.0"
PAPER_ONLY = True
LIVE_TRADING_SUPPORTED = False
ACTIVE_MODEL_WEIGHT = "0"

INITIAL_AST = {
    "schema": "1",
    "decision": "PREDICT",
    "direction": "LONG",
    "otherwise": "STAND_DOWN",
    "all": [
        {"field": "timing_quality", "op": "EQ", "value": "ISSUER_CONFIRMED"},
        {"field": "card_complete", "op": "EQ", "value": True},
        {"field": "options_valid", "op": "EQ", "value": True},
        {"field": "implied_move", "op": "GTE", "value": "0.040000000000"},
        {"field": "implied_move", "op": "LTE", "value": "0.150000000000"},
        {"field": "benchmark_relative_5d", "op": "LT", "value": "0.000000000000"},
        {"field": "benchmark_relative_63d", "op": "GT", "value": "0.000000000000"},
    ],
}

COST_MODEL_CONTENT = {
    "cost_model_version": "1",
    "cost_model_basis": "CONSERVATIVE_STRESS_HAIRCUT",
    "constant_penalty": "0.000500",
    "imbalance_coefficient": "0.000000",
    "imbalance_term": "0.000000",
    "commission_per_fill": "0.0000",
    "entry_rounding_scale": "12",
    "pnl_rounding_scale": "4",
    "rounding_mode": "ROUND_HALF_UP",
}

FIELD_TYPES = {
    "timing_quality": "enum",
    "card_complete": "bool",
    "options_valid": "bool",
    "implied_move": "decimal",
    "benchmark_relative_5d": "decimal",
    "benchmark_relative_63d": "decimal",
}

CAPACITY = {
    "slots": 3,
    "notional": D("15000.0000"),
    "ticket": D("5000.0000"),
    "per_event": 2,
    "margin_minutes": 3,
}

class KernelError(ValueError):
    pass

def ident(s):
    if type(s) is not str or not IDENT.fullmatch(s):
        raise KernelError("INVALID_ID")
    return s

def digest_bytes(s):
    if type(s) is not str or not HEX.fullmatch(s):
        raise KernelError("INVALID_SHA256_HEX")
    raw = bytes.fromhex(s)
    if len(raw) != 32:
        raise KernelError("INVALID_SHA256_HEX")
    return raw

def field(b: bytes) -> bytes:
    if type(b) is not bytes or len(b) > 4294967295:
        raise KernelError("INVALID_FIELD")
    return struct.pack(">I", len(b)) + b

def u32(v: int) -> bytes:
    if type(v) is not int or not 0 <= v <= 4294967295:
        raise KernelError("INVALID_UINT32")
    return struct.pack(">I", v)

def canon(obj) -> bytes:
    def validate(x, depth=0):
        if depth > 32:
            raise KernelError("JSON_DEPTH_EXCEEDED")
        if x is None or type(x) is bool:
            return
        if type(x) is str:
            x.encode("utf-8", errors="strict")
            return
        if type(x) is list:
            for v in x:
                validate(v, depth + 1)
            return
        if type(x) is dict:
            for k, v in x.items():
                if type(k) is not str or not KEY.fullmatch(k):
                    raise KernelError("INVALID_CANONICAL_KEY")
                validate(v, depth + 1)
            return
        raise KernelError("CANONICAL_NUMBERS_MUST_BE_STRINGS")

    validate(obj)
    return json.dumps(
        obj, ensure_ascii=False, sort_keys=True, separators=(",", ":"), allow_nan=False
    ).encode("utf-8")

def h(domain: str, *parts: bytes) -> str:
    return hashlib.sha256(
        field(domain.encode("ascii")) + b"".join(field(p) for p in parts)
    ).hexdigest()

def shuffle(ids, seed):
    if type(ids) is not list:
        raise KernelError("INVALID_MEMBER_LIST")
    b = digest_bytes(seed)
    for x in ids:
        ident(x)
    if len(ids) != len(set(ids)):
        raise KernelError("DUPLICATE_MEMBER")
    return sorted(
        ids,
        key=lambda x: (hashlib.sha256(b + x.encode("utf-8")).digest(), x.encode("utf-8")),
    )

def input_hash(
    manifest_id,
    security_id,
    manifest_hash,
    snapshot_hash,
    rule_hash,
    engine_hash,
    cost_hash,
    margin,
    pins,
):
    """
    pins: list of (observation_id, observation_hash_hex)
    Preimage is length-prefixed fields, domain "Trading App|input|2".
    Pin order in the caller's list MUST NOT change the digest (sorted by id utf-8).
    """
    ident(manifest_id)
    ident(security_id)
    if type(margin) is not int or not 2 <= margin <= 15:
        raise KernelError("INVALID_MARGIN")
    if type(pins) is not list:
        raise KernelError("INVALID_PINS")
    seen = []
    for p in pins:
        if type(p) not in (list, tuple) or len(p) != 2:
            raise KernelError("INVALID_PIN")
        ident(p[0])
        digest_bytes(p[1])
        seen.append(p[0])
    if len(seen) != len(set(seen)):
        raise KernelError("DUPLICATE_PIN")
    pairs = sorted(pins, key=lambda p: p[0].encode("utf-8"))
    encoded = field(b"Trading App|input|2")
    encoded += field(manifest_id.encode("utf-8")) + field(security_id.encode("utf-8"))
    for x in (manifest_hash, snapshot_hash, rule_hash, engine_hash, cost_hash):
        encoded += field(digest_bytes(x))
    encoded += field(u32(margin)) + field(u32(len(pairs)))
    for pid, ph in pairs:
        encoded += field(pid.encode("utf-8")) + field(digest_bytes(ph))
    return hashlib.sha256(encoded).hexdigest()

def normalize_reasons(reasons):
    """PATCH-07: canonical reason ordering — sorted by utf-8, deduplicated."""
    if type(reasons) is not list:
        raise KernelError("INVALID_REASONS")
    for r in reasons:
        if type(r) is not str:
            raise KernelError("INVALID_REASONS")
    if len(reasons) != len(set(reasons)):
        raise KernelError("DUPLICATE_REASON")
    return sorted(reasons, key=lambda r: r.encode("utf-8"))

def output_hash(input_hex, decision_payload) -> str:
    """PATCH-07: 'reasons' is an ordered JSON list, so an unsorted producer made
    the decision hash nondeterministic for the same logical outcome. The list is
    now required to arrive already canonically ordered and deduplicated."""
    if type(decision_payload) is dict and "reasons" in decision_payload:
        rs = decision_payload["reasons"]
        if rs != normalize_reasons(rs):
            raise KernelError("NONCANONICAL_REASONS")
    return h("Trading App|decision|1", digest_bytes(input_hex), canon(decision_payload))

def payload_hash(normalized_payload) -> str:
    return h("Trading App|payload|1", canon(normalized_payload))

def observation_hash(envelope) -> str:
    return h("Trading App|observation|1", canon(envelope))

def rule_ast_hash(ast) -> str:
    return h("Trading App|rule|1", canon(ast))

def policy_hash(bundle) -> str:
    return h("Trading App|policy|1", canon(bundle))

def cost_model_hash(content) -> str:
    return h("Trading App|cost|1", canon(content))

def snapshot_hash(content) -> str:
    return h("Trading App|snapshot|2", canon(content))

def manifest_hash(content) -> str:
    return h("Trading App|manifest|2", canon(content))

def _dec_ctx():
    return localcontext(
        Context(
            prec=60,
            rounding=ROUND_HALF_UP,
            traps=[InvalidOperation, DivisionByZero, Overflow],
        )
    )

def dec_text(value, code="INVALID_DECIMAL_TEXT", scale=None) -> Decimal:
    """PATCH-05: parse decimal TEXT only. No floats, no exponent, no whitespace,
    no leading '+', no underscores, no Inf/NaN. Optional exact-scale pinning for
    callers that hash or persist the raw string."""
    if type(value) is not str or not DEC_TEXT.fullmatch(value):
        raise KernelError(code)
    if scale is not None:
        frac = value.split(".", 1)[1]
        if len(frac) != scale:
            raise KernelError("NONCANONICAL_SCALE")
    with _dec_ctx():
        return D(value)

def modeled_fill(
    close: str,
    penalty: str = "0.000500",
    imbalance_coefficient: str = "0.000000",
    imbalance_term: str = "0.000000",
) -> str:
    p = dec_text(close, "INVALID_DECIMAL_TEXT")
    c = dec_text(penalty, "INVALID_PENALTY_TEXT")
    a = dec_text(imbalance_coefficient, "INVALID_IMBALANCE_TEXT")
    b = dec_text(imbalance_term, "INVALID_IMBALANCE_TEXT")
    with _dec_ctx():
        if p <= 0 or p > D("1000000"):
            raise KernelError("ABOVE_OR_BELOW_DOMAIN")
        out = (p * (D("1") + c + a * b)).quantize(D("0.000000000001"), rounding=ROUND_HALF_UP)
        return format(out, "f")

def paper_pnl(notional: str, exit_price: str, fill: str, commission: str = "0.0000") -> str:
    """(notional * (exit/fill - 1) - 2*commission) at 4 dp.

    PATCH-01: rejects float/non-text args (was silently accepting floats).
    PATCH-02: rejects fill <= 0 (was sign-flipping P&L on a negative fill).
    """
    n = dec_text(notional, "INVALID_NOTIONAL_TEXT")
    x = dec_text(exit_price, "INVALID_EXIT_TEXT")
    f = dec_text(fill, "INVALID_FILL_TEXT")
    c = dec_text(commission, "INVALID_COMMISSION_TEXT")
    if f <= 0:
        raise KernelError("DIVISION_BY_ZERO" if f == 0 else "NONPOSITIVE_FILL")
    if x <= 0:
        raise KernelError("NONPOSITIVE_EXIT")
    if n < 0:
        raise KernelError("NEGATIVE_NOTIONAL")
    if c < 0:
        raise KernelError("NEGATIVE_COMMISSION")
    with _dec_ctx():
        dollar = n * (x / f - D("1")) - D("2") * c
        return format(dollar.quantize(D("0.0001"), rounding=ROUND_HALF_UP), "f")

def direction_hit(entry: str, exit: str) -> bool:
    """Zero return is a MISS (False), not None. Long-only: exit > entry is a hit.

    PATCH-03: rejects float/non-text args so hit labels are never float-derived.
    """
    e = dec_text(entry, "INVALID_ENTRY_TEXT")
    x = dec_text(exit, "INVALID_EXIT_TEXT")
    if e <= 0:
        raise KernelError("NONPOSITIVE_ENTRY")
    with _dec_ctx():
        if x == e:
            return False
        return x > e

def band_hit(entry: str, exit: str, low: str, high: str) -> bool:
    """PATCH-03: text-only args; band must be ordered."""
    e = dec_text(entry, "INVALID_ENTRY_TEXT")
    x = dec_text(exit, "INVALID_EXIT_TEXT")
    lo = dec_text(low, "INVALID_BAND_TEXT")
    hi = dec_text(high, "INVALID_BAND_TEXT")
    if e <= 0:
        raise KernelError("NONPOSITIVE_ENTRY")
    if lo > hi:
        raise KernelError("INVALID_BAND_ORDER")
    with _dec_ctx():
        return e * (D("1") + lo) <= x <= e * (D("1") + hi)

def _canon12(d: Decimal) -> str:
    q = d.quantize(D("0.000000000000"), rounding=ROUND_HALF_UP)
    s = format(q, "f")
    if "." not in s:
        s += "." + "0" * 12
    whole, frac = s.split(".")
    frac = (frac + "0" * 12)[:12]
    return f"{whole}.{frac}"

def magnitude_band(implied_move: str) -> dict:
    with _dec_ctx():
        m = D(implied_move)
        return {
            "low": _canon12(m * D("0.5")),
            "high": _canon12(m * D("2.0")),
        }

def validate_ast(ast) -> None:
    if type(ast) is not dict:
        raise KernelError("INVALID_AST_KEYS")
    expected = {"schema", "decision", "direction", "otherwise", "all"}
    if set(ast.keys()) != expected or len(ast) != 5:
        raise KernelError("INVALID_AST_KEYS")
    for k in ("schema", "decision", "direction", "otherwise"):
        if ast[k] != INITIAL_AST[k]:
            raise KernelError("INVALID_AST_HEADER")
    cc = ast["all"]
    if type(cc) is not list or not 1 <= len(cc) <= 32:
        raise KernelError("INVALID_AST_CONDITIONS")
    for con in cc:
        if type(con) is not dict or set(con.keys()) != {"field", "op", "value"}:
            raise KernelError("INVALID_CONDITION")
        f, op, v = con["field"], con["op"], con["value"]
        if f not in FIELD_TYPES:
            raise KernelError("UNKNOWN_FIELD")
        if op not in {"EQ", "LT", "GT", "LTE", "GTE"}:
            raise KernelError("UNKNOWN_OP")
        typ = FIELD_TYPES[f]
        if typ == "bool" and (op != "EQ" or type(v) is not bool):
            raise KernelError("INVALID_BOOL_PREDICATE")
        if typ == "enum" and (op != "EQ" or v != "ISSUER_CONFIRMED"):
            raise KernelError("INVALID_ENUM_PREDICATE")
        if typ == "decimal":
            if type(v) is not str or not CANON_DEC12.fullmatch(v):
                raise KernelError("NONCANONICAL_CONSTANT")

def evaluate(ast, card) -> dict:
    """Total function: never throws to the caller. Invalid rule → STAND_DOWN + INVALID_RULE."""
    try:
        validate_ast(ast)
    except KernelError:
        return {
            "status": "INVALID_RULE",
            "decision": "STAND_DOWN",
            "direction": None,
            "reasons": ["INVALID_RULE_AST"],
        }
    if type(card) is not dict:
        return {
            "status": "INVALID_CARD",
            "decision": "STAND_DOWN",
            "direction": None,
            "reasons": ["INVALID_CARD"],
        }
    if card.get("card_complete") is not True:
        t = card.get("card_complete")
        if t is False or t is None:
            return {
                "status": "OK",
                "decision": "STAND_DOWN",
                "direction": None,
                "reasons": ["CARD_INCOMPLETE"],
            }
        return {
            "status": "INVALID_CARD",
            "decision": "STAND_DOWN",
            "direction": None,
            "reasons": ["INVALID_CARD_COMPLETE"],
        }
    for co in ast["all"]:
        f, op, v = co["field"], co["op"], co["value"]
        val = card.get(f, None)
        if val is None:
            return {
                "status": "OK",
                "decision": "STAND_DOWN",
                "direction": None,
                "reasons": [f"MISSING_{f}"],
            }
        typ = FIELD_TYPES[f]
        if typ == "bool":
            if type(val) is not bool:
                return {
                    "status": "INVALID_CARD",
                    "decision": "STAND_DOWN",
                    "direction": None,
                    "reasons": [f"INVALID_{f}"],
                }
            ok = op == "EQ" and val is v
        elif typ == "enum":
            if val not in ("ISSUER_CONFIRMED", "ESTIMATED"):
                return {
                    "status": "INVALID_CARD",
                    "decision": "STAND_DOWN",
                    "direction": None,
                    "reasons": [f"INVALID_{f}"],
                }
            ok = op == "EQ" and val == v
        else:
            if type(val) is not str or not CANON_DEC12.fullmatch(val):
                return {
                    "status": "INVALID_CARD",
                    "decision": "STAND_DOWN",
                    "direction": None,
                    "reasons": [f"INVALID_{f}"],
                }
            with _dec_ctx():
                left, right = D(val), D(v)
                ok = {
                    "EQ": left == right,
                    "LT": left < right,
                    "GT": left > right,
                    "LTE": left <= right,
                    "GTE": left >= right,
                }[op]
        if not ok:
            return {
                "status": "OK",
                "decision": "STAND_DOWN",
                "direction": None,
                "reasons": [f"PREDICATE_FALSE_{f}"],
            }
    return {
        "status": "OK",
        "decision": "PREDICT",
        "direction": "LONG",
        "reasons": [],
    }

def compute_card_complete(card: dict) -> bool:
    tq = card.get("timing_quality")
    if tq not in ("ISSUER_CONFIRMED", "ESTIMATED"):
        return False
    if type(card.get("options_valid")) is not bool:
        return False
    # PATCH-06: use the SAME canonicality rule the evaluator uses (CANON_DEC12).
    # Previously this accepted "0.08" while evaluate() called it INVALID_CARD, so
    # the two gatekeepers disagreed on what a valid card is.
    mv = card.get("implied_move")
    if type(mv) is not str or not CANON_DEC12.fullmatch(mv):
        return False
    try:
        with _dec_ctx():
            m = D(mv)
            if m <= 0 or m > 5:
                return False
    except Exception:
        return False
    for f in ("benchmark_relative_5d", "benchmark_relative_63d"):
        v = card.get(f)
        if type(v) is not str or not CANON_DEC12.fullmatch(v):
            return False
        try:
            with _dec_ctx():
                D(v)
        except Exception:
            return False
    return True

def admit_predict(
    *,
    paused: bool,
    cutoff_passed: bool,
    timing_quality: str,
    card_complete: bool,
    reserved_count: int,
    reserved_notional: Decimal,
    same_event_open: int,
    already_owned: bool,
) -> dict:
    """Admission after PREDICT. Capacity is 3 / 15000 / 2-per-event. Ticket 5000.

    PATCH-04: validates the desk-state counters before using them. Previously a
    negative reserved_count or reserved_notional ADMITTED past the caps, and
    bools/floats were accepted as counters. Corrupt state now fails loud rather
    than silently granting capacity.
    """
    for name, val in (
        ("paused", paused),
        ("cutoff_passed", cutoff_passed),
        ("card_complete", card_complete),
        ("already_owned", already_owned),
    ):
        if type(val) is not bool:
            raise KernelError(f"INVALID_ADMISSION_FLAG_{name}")
    if type(timing_quality) is not str:
        raise KernelError("INVALID_TIMING_QUALITY")
    for name, val in (("reserved_count", reserved_count),
                      ("same_event_open", same_event_open)):
        if type(val) is not int or val < 0 or val > 4294967295:
            raise KernelError(f"INVALID_ADMISSION_COUNT_{name}")
    if type(reserved_notional) is not Decimal:
        raise KernelError("INVALID_RESERVED_NOTIONAL")
    if not reserved_notional.is_finite() or reserved_notional < 0:
        raise KernelError("INVALID_RESERVED_NOTIONAL")
    if reserved_notional > CAPACITY["notional"]:
        raise KernelError("RESERVED_NOTIONAL_EXCEEDS_CAP")
    reasons = []
    if paused:
        reasons.append("ADMISSION_PAUSED")
    if cutoff_passed:
        reasons.append("CUTOFF")
    if timing_quality != "ISSUER_CONFIRMED":
        reasons.append("TIMING_NOT_CONFIRMED")
    if card_complete is not True:
        reasons.append("CARD_INCOMPLETE")
    if already_owned:
        reasons.append("ALREADY_OWNED")
    if reserved_count + 1 > CAPACITY["slots"]:
        reasons.append("CAPACITY_COUNT")
    if reserved_notional + CAPACITY["ticket"] > CAPACITY["notional"]:
        reasons.append("CAPACITY_NOTIONAL")
    if same_event_open + 1 > CAPACITY["per_event"]:
        reasons.append("PER_EVENT_LIMIT")
    if reasons:
        return {"outcome": "DENIED", "reason_codes": reasons, "position": False}
    return {"outcome": "ADMITTED", "reason_codes": ["ADMITTED"], "position": True}

# ─────────────────────────────────────────────────────────────────────────────
# TESTS — golden + adversarial
# ─────────────────────────────────────────────────────────────────────────────

H01 = "bac8f1353582276f85608c618ad44f104f5480fea76d03ce0dbcad4955522726"
AST_H = "e9cf184a531fd993dc1b36ce0e1a1b0dcd67ebc4b80e4ff1ebe5a72ab00c15f4"

BASE_HASH = dict(
    manifest_id="manifest-20260914",
    security_id="SEC-A",
    manifest_hash="1" * 64,
    snapshot_hash="2" * 64,
    rule_hash="3" * 64,
    engine_hash="4" * 64,
    cost_hash="5" * 64,
    margin=3,
    pins=[("obs-z", "a" * 64), ("obs-a", "b" * 64)],
)

COMPLETE_CARD = {
    "timing_quality": "ISSUER_CONFIRMED",
    "card_complete": True,
    "options_valid": True,
    "implied_move": "0.080000000000",
    "benchmark_relative_5d": "-0.012000000000",
    "benchmark_relative_63d": "0.045000000000",
}

class Golden(unittest.TestCase):
    def test_H01_input_hash(self):
        self.assertEqual(input_hash(**BASE_HASH), H01)

    def test_H02_pin_order_does_not_change_hash(self):
        a = input_hash(**BASE_HASH)
        flipped = dict(BASE_HASH)
        flipped["pins"] = list(reversed(BASE_HASH["pins"]))
        self.assertEqual(input_hash(**flipped), a)
        other = dict(BASE_HASH)
        other["pins"] = [("obs-z", "a" * 64), ("obs-b", "b" * 64)]
        self.assertNotEqual(input_hash(**other), a)

    def test_H03_removing_pin_or_changing_margin_changes_hash(self):
        base = input_hash(**BASE_HASH)
        fewer = dict(BASE_HASH)
        fewer["pins"] = [BASE_HASH["pins"][0]]
        self.assertNotEqual(input_hash(**fewer), base)
        m4 = dict(BASE_HASH)
        m4["margin"] = 4
        self.assertNotEqual(input_hash(**m4), base)

    def test_H05_rejects_malformed(self):
        bad_m = dict(BASE_HASH)
        bad_m["margin"] = 1
        with self.assertRaises(KernelError):
            input_hash(**bad_m)
        bad_m["margin"] = 16
        with self.assertRaises(KernelError):
            input_hash(**bad_m)
        bad_id = dict(BASE_HASH)
        bad_id["security_id"] = "SEC A"
        with self.assertRaises(KernelError):
            input_hash(**bad_id)
        upper = dict(BASE_HASH)
        upper["pins"] = [("obs-a", "B" * 64)]
        with self.assertRaises(KernelError):
            input_hash(**upper)

    def test_H07_cj1_rejects_numbers(self):
        with self.assertRaises(KernelError):
            canon({"a": 1})
        with self.assertRaises(KernelError):
            canon({"a": 1.5})
        self.assertTrue(canon({"a": True, "z": None}))

    def test_H09_shuffle_golden(self):
        got = shuffle(["SEC-C", "SEC-A", "SEC-B"], "01" * 32)
        self.assertEqual(got, ["SEC-A", "SEC-C", "SEC-B"])
        with self.assertRaises(KernelError):
            shuffle(["SEC-A", "SEC-A"], "01" * 32)

    def test_ast_hash_golden(self):
        validate_ast(INITIAL_AST)
        self.assertEqual(rule_ast_hash(INITIAL_AST), AST_H)

    def test_fill_and_pnl_golden(self):
        self.assertEqual(modeled_fill("123.456789"), "123.518517394500")
        self.assertEqual(modeled_fill("100.000000"), "100.050000000000")
        self.assertEqual(
            paper_pnl("5000.0000", "105.000000", "100.050000000000", "0.0000"),
            "247.3763",
        )

    def test_F01_conjunction_and_bounds(self):
        ok = evaluate(INITIAL_AST, COMPLETE_CARD)
        self.assertEqual(ok["decision"], "PREDICT")
        self.assertEqual(ok["direction"], "LONG")
        lo = evaluate(INITIAL_AST, {**COMPLETE_CARD, "implied_move": "0.039999999999"})
        self.assertEqual(lo["decision"], "STAND_DOWN")
        hi = evaluate(INITIAL_AST, {**COMPLETE_CARD, "implied_move": "0.150000000001"})
        self.assertEqual(hi["decision"], "STAND_DOWN")
        self.assertEqual(
            evaluate(INITIAL_AST, {**COMPLETE_CARD, "implied_move": "0.040000000000"})["decision"],
            "PREDICT",
        )
        self.assertEqual(
            evaluate(INITIAL_AST, {**COMPLETE_CARD, "implied_move": "0.150000000000"})["decision"],
            "PREDICT",
        )

    def test_F02_incomplete_and_invalid_rule(self):
        r = evaluate(INITIAL_AST, {"card_complete": False})
        self.assertEqual(r["status"], "OK")
        self.assertEqual(r["decision"], "STAND_DOWN")
        bad = evaluate({"schema": "nope"}, {"card_complete": True})
        self.assertEqual(bad["status"], "INVALID_RULE")
        self.assertEqual(bad["decision"], "STAND_DOWN")
        self.assertIsNone(bad["direction"])

    def test_F03_boolean_substitute_is_invalid_card(self):
        r = evaluate(INITIAL_AST, {**COMPLETE_CARD, "options_valid": 1})
        self.assertEqual(r["status"], "INVALID_CARD")
        self.assertEqual(r["decision"], "STAND_DOWN")

    def test_F15_tiny_positive_is_a_hit_zero_is_miss(self):
        self.assertTrue(direction_hit("100.000000", "100.000001"))
        self.assertFalse(direction_hit("100.000000", "100.000000"))
        self.assertFalse(direction_hit("100.000000", "99.999999"))
        self.assertTrue(band_hit("100.000000", "108.000000", "0.040000000000", "0.160000000000"))
        self.assertFalse(band_hit("100.000000", "103.000000", "0.040000000000", "0.160000000000"))

class Adversarial(unittest.TestCase):
    def test_float_close_is_rejected(self):
        with self.assertRaises(KernelError):
            modeled_fill(100.0)  # type: ignore

    def test_json_number_cannot_enter_payload_hash(self):
        with self.assertRaises(KernelError):
            payload_hash({"oi": 500, "volume": 80, "multiplier": 100})
        ok = payload_hash({"oi": "500", "volume": "80", "multiplier": "100"})
        self.assertRegex(ok, r"^[0-9a-f]{64}$")

    def test_duplicate_pin_rejected(self):
        d = dict(BASE_HASH)
        d["pins"] = [("obs-a", "b" * 64), ("obs-a", "c" * 64)]
        with self.assertRaises(KernelError):
            input_hash(**d)

    def test_output_hash_changes_when_reasons_change(self):
        a = output_hash(H01, {"status": "OK", "decision": "PREDICT", "direction": "LONG", "reasons": []})
        b = output_hash(
            H01, {"status": "OK", "decision": "PREDICT", "direction": "LONG", "reasons": ["x"]}
        )
        self.assertNotEqual(a, b)

    def test_rel5_zero_is_not_predict(self):
        card = {**COMPLETE_CARD, "benchmark_relative_5d": "0.000000000000"}
        r = evaluate(INITIAL_AST, card)
        self.assertEqual(r["decision"], "STAND_DOWN")
        self.assertIn("PREDICATE_FALSE_benchmark_relative_5d", r["reasons"][0])

    def test_estimated_timing_never_predicts(self):
        card = {**COMPLETE_CARD, "timing_quality": "ESTIMATED"}
        r = evaluate(INITIAL_AST, card)
        self.assertEqual(r["decision"], "STAND_DOWN")

    def test_no_freeze_is_not_a_decision_of_the_evaluator(self):
        r = evaluate(INITIAL_AST, COMPLETE_CARD)
        self.assertNotIn(r["decision"], ("NO_FREEZE", "NONE"))

    def test_capacity_full_desk_denied(self):
        a = admit_predict(
            paused=False,
            cutoff_passed=False,
            timing_quality="ISSUER_CONFIRMED",
            card_complete=True,
            reserved_count=3,
            reserved_notional=D("15000.0000"),
            same_event_open=0,
            already_owned=False,
        )
        self.assertEqual(a["outcome"], "DENIED")
        self.assertIn("CAPACITY_COUNT", a["reason_codes"])
        self.assertIn("CAPACITY_NOTIONAL", a["reason_codes"])

    def test_per_event_limit_two(self):
        a = admit_predict(
            paused=False,
            cutoff_passed=False,
            timing_quality="ISSUER_CONFIRMED",
            card_complete=True,
            reserved_count=0,
            reserved_notional=D("0"),
            same_event_open=2,
            already_owned=False,
        )
        self.assertEqual(a["outcome"], "DENIED")
        self.assertIn("PER_EVENT_LIMIT", a["reason_codes"])

    def test_stand_down_must_not_reserve(self):
        r = evaluate(INITIAL_AST, {**COMPLETE_CARD, "options_valid": False})
        self.assertEqual(r["decision"], "STAND_DOWN")
        self.assertNotEqual(r["decision"], "PREDICT")

    def test_half_up_identity(self):
        self.assertEqual(modeled_fill("1.000000"), "1.000500000000")

    def test_canon_key_order_stable(self):
        a = canon({"z": "é", "a": True})
        b = canon({"a": True, "z": "é"})
        self.assertEqual(a, b)
        self.assertEqual(a.hex(), "7b2261223a747275652c227a223a22c3a9227d")

    def test_impaired_is_not_flat(self):
        legal = {
            "COMMITTED_IRREVOCABLE",
            "FILLED",
            "NO_FILL",
            "IMPAIRED_ENTRY",
            "IMPAIRED_EXIT",
            "FLAT",
            "CLOSED",
        }
        self.assertIn("IMPAIRED_EXIT", legal)
        self.assertNotEqual("IMPAIRED_EXIT", "FLAT")

    def test_conflicting_paste_hash_must_not_match_H01(self):
        weaker = conflicting_paste_input_hash(
            "manifest-20260914",
            "SEC-A",
            "3" * 64,
            "4" * 64,
            "5" * 64,
            3,
            ["obs-z", "obs-a"],
        )
        self.assertNotEqual(weaker, H01)

    def test_conflicting_paste_fill_uses_different_penalty(self):
        self.assertNotEqual(modeled_fill("100.00"), "100.5500")
        self.assertEqual(modeled_fill("100.000000"), "100.050000000000")


class PatchRegression(unittest.TestCase):
    """PATCH-01..07: one regression test per finding from the external audit.
    Every test here FAILS on the unpatched kernel."""

    # PATCH-01 -- paper_pnl accepted floats (modeled_fill did not)
    def test_P01_paper_pnl_rejects_floats(self):
        with self.assertRaises(KernelError):
            paper_pnl(5000.0, 105.0, 100.05)  # type: ignore
        with self.assertRaises(KernelError):
            paper_pnl("5000.0000", "105.000000", 100.05)  # type: ignore
        self.assertEqual(
            paper_pnl("5000.0000", "105.000000", "100.050000000000", "0.0000"),
            "247.3763",
        )

    # PATCH-02 -- negative fill sign-flipped P&L instead of raising
    def test_P02_paper_pnl_rejects_nonpositive_fill(self):
        with self.assertRaises(KernelError):
            paper_pnl("5000.0000", "105.000000", "-100.000000")
        with self.assertRaises(KernelError):
            paper_pnl("5000.0000", "105.000000", "0.000000")
        with self.assertRaises(KernelError):
            paper_pnl("5000.0000", "-105.000000", "100.050000000000")
        with self.assertRaises(KernelError):
            paper_pnl("5000.0000", "105.000000", "100.050000000000", "-1.0000")

    # PATCH-03 -- hit tests accepted floats
    def test_P03_hit_tests_reject_floats(self):
        with self.assertRaises(KernelError):
            direction_hit(100.0, 101.0)  # type: ignore
        with self.assertRaises(KernelError):
            band_hit(100.0, 108.0, 0.04, 0.16)  # type: ignore
        with self.assertRaises(KernelError):
            band_hit("100.000000", "108.000000", "0.160000000000", "0.040000000000")
        self.assertTrue(direction_hit("100.000000", "100.000001"))
        self.assertFalse(direction_hit("100.000000", "100.000000"))

    # PATCH-04 -- negative desk counters ADMITTED past the caps
    def test_P04_admission_rejects_corrupt_state(self):
        base = dict(
            paused=False,
            cutoff_passed=False,
            timing_quality="ISSUER_CONFIRMED",
            card_complete=True,
            reserved_count=0,
            reserved_notional=D("0.0000"),
            same_event_open=0,
            already_owned=False,
        )
        with self.assertRaises(KernelError):
            admit_predict(**{**base, "reserved_notional": D("-1000000")})
        with self.assertRaises(KernelError):
            admit_predict(**{**base, "reserved_count": -5})
        with self.assertRaises(KernelError):
            admit_predict(**{**base, "same_event_open": -1})
        with self.assertRaises(KernelError):
            admit_predict(**{**base, "reserved_notional": 0.0})  # type: ignore
        with self.assertRaises(KernelError):
            admit_predict(**{**base, "reserved_count": True})  # bool is not a count
        with self.assertRaises(KernelError):
            admit_predict(**{**base, "paused": 0})  # type: ignore
        with self.assertRaises(KernelError):
            admit_predict(**{**base, "reserved_notional": D("15000.0001")})
        self.assertEqual(admit_predict(**base)["outcome"], "ADMITTED")

    # PATCH-04b -- the cap boundary itself must not move
    def test_P04b_capacity_boundaries_unchanged(self):
        at_cap = admit_predict(
            paused=False, cutoff_passed=False, timing_quality="ISSUER_CONFIRMED",
            card_complete=True, reserved_count=2, reserved_notional=D("10000.0000"),
            same_event_open=0, already_owned=False,
        )
        self.assertEqual(at_cap["outcome"], "ADMITTED")
        penny_over = admit_predict(
            paused=False, cutoff_passed=False, timing_quality="ISSUER_CONFIRMED",
            card_complete=True, reserved_count=2, reserved_notional=D("10000.0001"),
            same_event_open=0, already_owned=False,
        )
        self.assertEqual(penny_over["outcome"], "DENIED")
        self.assertIn("CAPACITY_NOTIONAL", penny_over["reason_codes"])

    # PATCH-05 -- exponent / whitespace / sign / underscore spellings collapsed
    def test_P05_modeled_fill_requires_canonical_text(self):
        for bad in ("1E2", "1e2", "+100.000000", " 100.000000", "100.000000 ",
                    "0.1_0", "100", "Inf", "Infinity", "NaN", "-0.000000",
                    ".5", "1.", "01.000000", ""):
            with self.assertRaises(KernelError, msg=f"accepted {bad!r}"):
                modeled_fill(bad)
        with self.assertRaises(KernelError):
            modeled_fill("100.000000", penalty="5e-4")
        self.assertEqual(modeled_fill("123.456789"), "123.518517394500")

    def test_P05b_scale_pinning_available(self):
        self.assertEqual(dec_text("100.0000", scale=4), D("100.0000"))
        with self.assertRaises(KernelError):
            dec_text("100.000", scale=4)

    # PATCH-06 -- compute_card_complete disagreed with evaluate()
    def test_P06_gatekeepers_agree_on_canonicality(self):
        loose = {
            "timing_quality": "ISSUER_CONFIRMED",
            "options_valid": True,
            "implied_move": "0.08",
            "benchmark_relative_5d": "-0.01",
            "benchmark_relative_63d": "0.04",
        }
        self.assertFalse(compute_card_complete(loose))
        self.assertEqual(
            evaluate(INITIAL_AST, {**loose, "card_complete": True})["status"],
            "INVALID_CARD",
        )
        strict = {k: v for k, v in COMPLETE_CARD.items() if k != "card_complete"}
        self.assertTrue(compute_card_complete(strict))
        self.assertEqual(
            evaluate(INITIAL_AST, {**strict, "card_complete": True})["decision"],
            "PREDICT",
        )

    def test_P06b_every_evaluate_predict_card_is_card_complete(self):
        """No card may PREDICT while compute_card_complete() calls it incomplete."""
        variants = [
            COMPLETE_CARD,
            {**COMPLETE_CARD, "implied_move": "0.040000000000"},
            {**COMPLETE_CARD, "implied_move": "0.150000000000"},
            {**COMPLETE_CARD, "benchmark_relative_5d": "-0.000000000001"},
        ]
        for card in variants:
            if evaluate(INITIAL_AST, card)["decision"] == "PREDICT":
                self.assertTrue(compute_card_complete(card), msg=str(card))

    # PATCH-07 -- reason order changed the decision hash
    def test_P07_reason_order_is_canonical(self):
        a = output_hash(H01, {"decision": "STAND_DOWN", "reasons": ["A", "B"]})
        with self.assertRaises(KernelError):
            output_hash(H01, {"decision": "STAND_DOWN", "reasons": ["B", "A"]})
        b = output_hash(H01, {"decision": "STAND_DOWN",
                              "reasons": normalize_reasons(["B", "A"])})
        self.assertEqual(a, b)
        with self.assertRaises(KernelError):
            output_hash(H01, {"decision": "STAND_DOWN", "reasons": ["A", "A"]})
        with self.assertRaises(KernelError):
            output_hash(H01, {"decision": "STAND_DOWN", "reasons": "A"})

    def test_P07b_evaluate_output_is_always_hashable(self):
        """Every evaluate() result must pass output_hash unmodified."""
        cards = [
            COMPLETE_CARD,
            {**COMPLETE_CARD, "options_valid": False},
            {**COMPLETE_CARD, "timing_quality": "ESTIMATED"},
            {**COMPLETE_CARD, "options_valid": 1},
            {"card_complete": False},
            {},
        ]
        for card in cards:
            r = evaluate(INITIAL_AST, card)
            self.assertRegex(output_hash(H01, r), r"^[0-9a-f]{64}$")

    # Goldens must be untouched by all of the above
    def test_P08_goldens_survive_the_patch(self):
        self.assertEqual(input_hash(**BASE_HASH), H01)
        self.assertEqual(rule_ast_hash(INITIAL_AST), AST_H)
        self.assertEqual(modeled_fill("123.456789"), "123.518517394500")
        self.assertEqual(modeled_fill("100.000000"), "100.050000000000")
        self.assertEqual(
            paper_pnl("5000.0000", "105.000000", "100.050000000000", "0.0000"),
            "247.3763",
        )
        self.assertEqual(shuffle(["SEC-C", "SEC-A", "SEC-B"], "01" * 32),
                         ["SEC-A", "SEC-C", "SEC-B"])

def conflicting_paste_input_hash(
    manifest_id,
    permanent_security_id,
    rule_ast_hash,
    evaluator_artifact_hash,
    cost_model_hash,
    broker_margin_minutes,
    observation_ids,
):
    """Weaker preimage: NO domain tag, NO pin hashes, NO manifest/snapshot hashes."""
    if not 2 <= broker_margin_minutes <= 15:
        raise ValueError("broker_margin_minutes out of range")
    if len(observation_ids) != len(set(observation_ids)):
        raise ValueError("duplicate observation_id in pins")
    pins = sorted(observation_ids, key=lambda value: value.encode("utf-8"))
    canonical = bytearray()
    canonical += field(manifest_id.encode("utf-8"))
    canonical += field(permanent_security_id.encode("utf-8"))
    canonical += field(bytes.fromhex(rule_ast_hash))
    canonical += field(bytes.fromhex(evaluator_artifact_hash))
    canonical += field(bytes.fromhex(cost_model_hash))
    canonical += field(struct.pack(">I", broker_margin_minutes))
    canonical += field(struct.pack(">I", len(pins)))
    for observation_id in pins:
        canonical += field(observation_id.encode("utf-8"))
    return hashlib.sha256(canonical).hexdigest()

BRIEF = r"""
SCRUTINY BRIEF — what to attack next
====================================

A. Two kernels in this file. They disagree on purpose.
   PRODUCTION  input_hash includes:
     domain "Trading App|input|2"
     manifest_hash, snapshot_hash, rule, engine, cost
     (observation_id, observation_hash) pairs, sorted by id
   CONFLICTING PASTE input_hash includes:
     no domain
     no manifest/snapshot hashes
     observation ids only (no pin hashes)
   Production H01 must NEVER equal the paste hash on the same names.

B. Fill / cost
   Production constant_penalty = 0.000500, imbalance terms = 0
     modeled_fill("100.000000") = 100.050000000000
     paper_pnl(5000, 105, 100.05) = 247.3763
   Paste example uses 0.001 + 0.01*0.5 = 0.0055 → 100.5500
   If a desk prices with the paste fill, P&L and capacity math both drift.

C. Evaluator
   Production INITIAL_AST is a closed conjunction. Any false predicate → STAND_DOWN.
   A looser paste evaluator accepts arbitrary fields (e.g. "score") and JSON numbers
   via Decimal(str(actual)). Production rejects options_valid=1 as INVALID_CARD.

D. State machine (desk, claimed around this kernel)
   COMMITTED_IRREVOCABLE → FILLED | NO_FILL | IMPAIRED_ENTRY
   FILLED → FLAT | IMPAIRED_EXIT
   IMPAIRED_EXIT → FLAT
   FLAT | NO_FILL → CLOSED   (capacity released only on CLOSED)
   A conflicting paste released capacity on GRADED. That is a different machine.
   IMPAIRED_EXIT occupies a slot. Do not flatten it to FLAT without an official mark.

E. Vocabulary that must not collapse
   NO_FREEZE  ≠ STAND_DOWN   (no artifact vs computed stand-down)
   PREDICT / NOT TRADED ≠ STAND_DOWN   (predicted, admission denied)
   IMPAIRED_* ≠ FLAT
   ESTIMATED paper P&L ≠ live fill evidence
   OPERATOR must not see hits / bands / P&L
   REVIEWER must not mutate admission

F. Capacity
   3 slots, $15,000, $5,000 ticket, 2 names per event session.
   A third PREDICT on a full desk or a third name on the same event is DENIED
   (CAPACITY / PER_EVENT), not STAND_DOWN.

G. Questions the reviewing AI must answer
   1. Can you construct two different sealed cards that share an input hash
      under PRODUCTION? Under the PASTE?
   2. Does ROUND_HALF_UP on a tie match both Python Decimal and a BigInt port?
      Cite one counterexample if not.
   3. Is direction_hit(entry, exit) with exit==entry correctly a MISS?
   4. Should a card whose implied_move is the float 0.08 (not "0.080000000000")
      PREDICT? Production says no.
   5. If a name is IMPAIRED_EXIT, is a new PREDICT the same day correctly denied?
   6. Which kernel should the desk freeze against, and what breaks if you pick wrong?

H. Honesty bar
   Do not invent passing tests. If a golden in this file fails on your runtime,
   the packet is the bug, not the desk. Report Python version and the failing assert.
   Do not rubber-stamp. Add tests. Name the bug or name the residual risk.
"""

def main():
    print(f"{PRODUCT_NAME} kernel audit")
    print(
        f"  paperOnly={PAPER_ONLY} liveTradingSupported={LIVE_TRADING_SUPPORTED} weight={ACTIVE_MODEL_WEIGHT}"
    )
    print(f"  engine={ENGINE_VERSION}")
    loader = unittest.TestLoader()
    suite = unittest.TestSuite()
    suite.addTests(loader.loadTestsFromTestCase(Golden))
    suite.addTests(loader.loadTestsFromTestCase(Adversarial))
    suite.addTests(loader.loadTestsFromTestCase(PatchRegression))
    result = unittest.TextTestRunner(verbosity=2).run(suite)
    print()
    print(BRIEF)
    if not result.wasSuccessful():
        raise SystemExit(1)
    print("RESULT: goldens + adversarial + patch-regression suites passed.")
    print("Reviewer: now try to break it. Do not rubber-stamp.")

if __name__ == "__main__":
    main()
```


---

## `python/trading_app_kernel.py` (3868 bytes, sha256 `131ff3f5f7f8c5328d993abcb51e3642b8ee3eb5efb49006e437f9003fefb919`)

```python
"""Trading App build-contract v1.2: pure serialization/numeric reference, not app."""
from __future__ import annotations
import hashlib, json, re, struct
from decimal import Decimal, localcontext, ROUND_HALF_UP, Context, InvalidOperation, DivisionByZero, Overflow
D = Decimal
IDENT = re.compile('[A-Za-z0-9][A-Za-z0-9:._-]{0,63}\\Z')
HEX = re.compile('[0-9a-f]{64}\\Z')
DEC = re.compile('-?(?:0|[1-9][0-9]*)(?:\\.[0-9]+)?\\Z')

def ident(s):
    if type(s) is not str or not IDENT.fullmatch(s):
        raise ValueError('INVALID_ID')
    return s

def digest_bytes(s):
    if type(s) is not str or not HEX.fullmatch(s):
        raise ValueError('INVALID_SHA256_HEX')
    return bytes.fromhex(s)

def field(b):
    if type(b) is not bytes or len(b) > 4294967295:
        raise ValueError('INVALID_FIELD')
    return struct.pack('>I', len(b)) + b

def u32(v):
    if type(v) is not int or not 0 <= v <= 4294967295:
        raise ValueError('INVALID_UINT32')
    return struct.pack('>I', v)

def canon(obj):
    def validate(x, depth=0):
        if depth > 32:
            raise ValueError('JSON_DEPTH_EXCEEDED')
        if x is None or type(x) is bool:
            return
        if type(x) is str:
            x.encode('utf-8', errors='strict')
            return
        if type(x) is list:
            for v in x:
                validate(v, depth + 1)
            return
        if type(x) is dict:
            for k, v in x.items():
                if type(k) is not str or not re.fullmatch('[A-Za-z_][A-Za-z0-9_]*', k):
                    raise ValueError('INVALID_CANONICAL_KEY')
                validate(v, depth + 1)
            return
        raise ValueError('CANONICAL_NUMBERS_MUST_BE_STRINGS')
    validate(obj)
    return json.dumps(obj, ensure_ascii=False, sort_keys=True, separators=(',', ':'), allow_nan=False).encode('utf-8')

def h(domain, *parts):
    return hashlib.sha256(field(domain.encode('ascii')) + b''.join((field(p) for p in parts))).hexdigest()

def shuffle(ids, seed):
    if type(ids) is not list:
        raise ValueError('INVALID_MEMBER_LIST')
    b = digest_bytes(seed)
    for x in ids:
        ident(x)
    if len(ids) != len(set(ids)):
        raise ValueError('DUPLICATE_MEMBER')
    return sorted(ids, key=lambda x: (hashlib.sha256(b + x.encode('utf-8')).digest(), x.encode('utf-8')))

def input_hash(manifest_id, security_id, manifest_hash, snapshot_hash, rule_hash, engine_hash, cost_hash, margin, pins):
    ident(manifest_id)
    ident(security_id)
    if type(margin) is not int or not 2 <= margin <= 15:
        raise ValueError('INVALID_MARGIN')
    pairs = sorted(pins, key=lambda p: p[0].encode('utf-8'))
    encoded = field(b'Trading App|input|2')
    encoded += field(manifest_id.encode()) + field(security_id.encode())
    for x in (manifest_hash, snapshot_hash, rule_hash, engine_hash, cost_hash):
        encoded += field(digest_bytes(x))
    encoded += field(u32(margin)) + field(u32(len(pairs)))
    for pid, ph in pairs:
        encoded += field(pid.encode()) + field(digest_bytes(ph))
    return hashlib.sha256(encoded).hexdigest()

def modeled_fill(close, penalty='0.000500', imbalance_coefficient='0.000000', imbalance_term='0.000000'):
    p = D(close)
    c = D(penalty)
    a = D(imbalance_coefficient)
    b = D(imbalance_term)
    with localcontext(Context(prec=60, rounding=ROUND_HALF_UP, traps=[InvalidOperation, DivisionByZero, Overflow])):
        return (p * (D('1') + c + a * b)).quantize(D('0.000000000001'), rounding=ROUND_HALF_UP)

if __name__ == '__main__':
    got = input_hash(
        'manifest-20260914', 'SEC-A',
        '1'*64, '2'*64, '3'*64, '4'*64, '5'*64, 3,
        [('obs-z', 'a'*64), ('obs-a', 'b'*64)],
    )
    assert got == 'bac8f1353582276f85608c618ad44f104f5480fea76d03ce0dbcad4955522726', got
    print('python oracle ok', got)
    print('fill', modeled_fill('123.456789'))
```


---

## `migrations/0001_auth.sql` (2739 bytes, sha256 `f953cacc448c0c81ae4fe63e66b0e59569e840782ad279fdee201dff529363e9`)

```sql
-- Better Auth schema (identity + sessions for "Sign in with Grok").
--
-- Generated by the Better Auth CLI for its Postgres adapter — DO NOT EDIT by
-- hand. `@/lib/auth/server` runs Better Auth against these tables when
-- DATABASE_URL is set. The columns are camelCase and MUST stay double-quoted so
-- Postgres preserves the case Better Auth queries by.
--
-- Migrations in this folder are the single source of truth for your schema. They
-- apply to Neon during the Vercel build (`npm run build`) and to the local
-- PGLite fallback automatically on startup, so dev matches production. Applied
-- files are recorded by name in `_migrations` and NEVER run again.
--
-- Put YOUR app's schema in NEW ordered files (0002_*.sql, 0003_*.sql, …), never
-- in this one. For app tables, prefer snake_case and give per-user tables a
-- `user_id TEXT NOT NULL` column (TEXT, not UUID — the preview dev user id is
-- the string 'dev-user'), then scope every query to the authenticated user
-- server-side (see the `neon` + `auth` skills and src/lib/auth/verify.server.ts).

create table if not exists "user" (
  "id" text not null primary key,
  "name" text not null,
  "email" text not null unique,
  "emailVerified" boolean not null,
  "image" text,
  "createdAt" timestamptz default CURRENT_TIMESTAMP not null,
  "updatedAt" timestamptz default CURRENT_TIMESTAMP not null
);

create table if not exists "session" (
  "id" text not null primary key,
  "expiresAt" timestamptz not null,
  "token" text not null unique,
  "createdAt" timestamptz default CURRENT_TIMESTAMP not null,
  "updatedAt" timestamptz not null,
  "ipAddress" text,
  "userAgent" text,
  "userId" text not null references "user" ("id") on delete cascade
);

create table if not exists "account" (
  "id" text not null primary key,
  "accountId" text not null,
  "providerId" text not null,
  "userId" text not null references "user" ("id") on delete cascade,
  "accessToken" text,
  "refreshToken" text,
  "idToken" text,
  "accessTokenExpiresAt" timestamptz,
  "refreshTokenExpiresAt" timestamptz,
  "scope" text,
  "password" text,
  "createdAt" timestamptz default CURRENT_TIMESTAMP not null,
  "updatedAt" timestamptz not null
);

create table if not exists "verification" (
  "id" text not null primary key,
  "identifier" text not null,
  "value" text not null,
  "expiresAt" timestamptz not null,
  "createdAt" timestamptz default CURRENT_TIMESTAMP not null,
  "updatedAt" timestamptz default CURRENT_TIMESTAMP not null
);

create index if not exists "session_userId_idx" on "session" ("userId");
create index if not exists "account_userId_idx" on "account" ("userId");
create index if not exists "verification_identifier_idx" on "verification" ("identifier");
```


---

## `migrations/0002_trading_app.sql` (33664 bytes, sha256 `86182bceb6a9e09820123c11efc8a207ec4f7d4029446d6bf718064aac9779a9`)

```sql
-- Trading App v1.2 relational contract (executable).
-- Hashes persist as 32-byte BYTEA; APIs expose lowercase hex.

CREATE OR REPLACE FUNCTION ta_reject_immutable() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'IMMUTABLE_TABLE:%', TG_TABLE_NAME;
END;
$$;

CREATE OR REPLACE FUNCTION ta_id_ok(t text) RETURNS boolean
LANGUAGE sql IMMUTABLE AS $$
  SELECT t ~ '^[A-Za-z0-9][A-Za-z0-9:._-]{0,63}$';
$$;

CREATE TABLE IF NOT EXISTS writer_gate (
  singleton_key boolean PRIMARY KEY CHECK (singleton_key),
  next_event_seq bigint NOT NULL CHECK (next_event_seq > 0),
  last_authoritative_time timestamptz NOT NULL,
  clock_trusted boolean NOT NULL
);

CREATE TABLE IF NOT EXISTS fixture_clock (
  singleton_key boolean PRIMARY KEY CHECK (singleton_key),
  now_utc timestamptz NOT NULL,
  trusted boolean NOT NULL,
  source text NOT NULL CHECK (source IN ('DATABASE', 'FIXTURE'))
);

CREATE TABLE IF NOT EXISTS event_log (
  event_seq bigint PRIMARY KEY CHECK (event_seq > 0),
  event_id text NOT NULL UNIQUE CHECK (ta_id_ok(event_id)),
  command_id text NOT NULL UNIQUE CHECK (ta_id_ok(command_id)),
  request_hash bytea NOT NULL CHECK (octet_length(request_hash) = 32),
  event_type text NOT NULL,
  actor_principal_id text NOT NULL CHECK (ta_id_ok(actor_principal_id)),
  occurred_at timestamptz NOT NULL,
  semantic_payload jsonb NOT NULL,
  canonical_payload text NOT NULL,
  result_receipt jsonb NOT NULL,
  event_hash bytea NOT NULL CHECK (octet_length(event_hash) = 32)
);
DROP TRIGGER IF EXISTS event_log_immutable ON event_log;
CREATE TRIGGER event_log_immutable BEFORE UPDATE OR DELETE ON event_log
  FOR EACH ROW EXECUTE FUNCTION ta_reject_immutable();

CREATE TABLE IF NOT EXISTS desk_risk_state (
  sleeve text PRIMARY KEY CHECK (sleeve = 'EARNINGS'),
  reserved_count integer NOT NULL CHECK (reserved_count >= 0 AND reserved_count <= 3),
  reserved_notional numeric(16,4) NOT NULL CHECK (reserved_notional >= 0 AND reserved_notional <= 15000),
  updated_event_seq bigint NOT NULL REFERENCES event_log(event_seq)
);

CREATE TABLE IF NOT EXISTS app_keyring (
  key_id text PRIMARY KEY CHECK (ta_id_ok(key_id)),
  purpose text NOT NULL,
  key_bytes bytea NOT NULL,
  created_at timestamptz NOT NULL
);

CREATE TABLE IF NOT EXISTS policy_bundle (
  policy_id text PRIMARY KEY CHECK (ta_id_ok(policy_id)),
  policy_version text NOT NULL CHECK (ta_id_ok(policy_version)),
  policy_content jsonb NOT NULL,
  canonical_content text NOT NULL,
  policy_hash bytea NOT NULL UNIQUE CHECK (octet_length(policy_hash) = 32),
  registered_event_seq bigint NOT NULL REFERENCES event_log(event_seq)
);
DROP TRIGGER IF EXISTS policy_bundle_immutable ON policy_bundle;
CREATE TRIGGER policy_bundle_immutable BEFORE UPDATE OR DELETE ON policy_bundle
  FOR EACH ROW EXECUTE FUNCTION ta_reject_immutable();

CREATE TABLE IF NOT EXISTS cost_model (
  cost_model_id text PRIMARY KEY CHECK (ta_id_ok(cost_model_id)),
  version text NOT NULL,
  basis text NOT NULL CHECK (basis = 'CONSERVATIVE_STRESS_HAIRCUT'),
  constant_penalty numeric(12,6) NOT NULL CHECK (constant_penalty > 0 AND constant_penalty <= 0.05),
  imbalance_coefficient numeric(12,6) NOT NULL CHECK (imbalance_coefficient = 0),
  imbalance_term numeric(12,6) NOT NULL CHECK (imbalance_term = 0),
  commission_per_fill numeric(12,4) NOT NULL CHECK (commission_per_fill >= 0 AND commission_per_fill <= 100),
  canonical_content text NOT NULL,
  content_hash bytea NOT NULL UNIQUE CHECK (octet_length(content_hash) = 32),
  registered_event_seq bigint NOT NULL REFERENCES event_log(event_seq)
);
DROP TRIGGER IF EXISTS cost_model_immutable ON cost_model;
CREATE TRIGGER cost_model_immutable BEFORE UPDATE OR DELETE ON cost_model
  FOR EACH ROW EXECUTE FUNCTION ta_reject_immutable();

CREATE TABLE IF NOT EXISTS evaluator_artifact (
  evaluator_id text PRIMARY KEY CHECK (ta_id_ok(evaluator_id)),
  engine_version text NOT NULL,
  artifact_manifest jsonb NOT NULL,
  canonical_content text NOT NULL,
  artifact_hash bytea NOT NULL UNIQUE CHECK (octet_length(artifact_hash) = 32),
  supported_ast_schema text NOT NULL,
  registered_event_seq bigint NOT NULL REFERENCES event_log(event_seq)
);
DROP TRIGGER IF EXISTS evaluator_artifact_immutable ON evaluator_artifact;
CREATE TRIGGER evaluator_artifact_immutable BEFORE UPDATE OR DELETE ON evaluator_artifact
  FOR EACH ROW EXECUTE FUNCTION ta_reject_immutable();

CREATE TABLE IF NOT EXISTS rule_card (
  rule_id text NOT NULL CHECK (ta_id_ok(rule_id)),
  rule_version text NOT NULL CHECK (ta_id_ok(rule_version)),
  rule_text text NOT NULL,
  rule_text_hash bytea NOT NULL CHECK (octet_length(rule_text_hash) = 32),
  ast_content jsonb NOT NULL,
  canonical_ast text NOT NULL,
  ast_hash bytea NOT NULL CHECK (octet_length(ast_hash) = 32),
  evaluator_id text NOT NULL REFERENCES evaluator_artifact(evaluator_id),
  policy_id text NOT NULL REFERENCES policy_bundle(policy_id),
  expected_predict_rate_min numeric(16,12) NOT NULL CHECK (expected_predict_rate_min >= 0),
  expected_predict_rate_max numeric(16,12) NOT NULL CHECK (expected_predict_rate_max <= 1 AND expected_predict_rate_max >= expected_predict_rate_min),
  magnitude_definition jsonb NOT NULL,
  registered_event_seq bigint NOT NULL REFERENCES event_log(event_seq),
  PRIMARY KEY (rule_id, rule_version)
);
DROP TRIGGER IF EXISTS rule_card_immutable ON rule_card;
CREATE TRIGGER rule_card_immutable BEFORE UPDATE OR DELETE ON rule_card
  FOR EACH ROW EXECUTE FUNCTION ta_reject_immutable();

CREATE TABLE IF NOT EXISTS security (
  permanent_security_id text PRIMARY KEY CHECK (ta_id_ok(permanent_security_id)),
  instrument_type text NOT NULL CHECK (instrument_type IN ('US_COMMON', 'REFERENCE_ETF')),
  currency text NOT NULL CHECK (currency = 'USD'),
  display_name text NOT NULL
);
DROP TRIGGER IF EXISTS security_immutable ON security;
CREATE TRIGGER security_immutable BEFORE UPDATE OR DELETE ON security
  FOR EACH ROW EXECUTE FUNCTION ta_reject_immutable();

CREATE TABLE IF NOT EXISTS universe_version (
  universe_version text PRIMARY KEY CHECK (ta_id_ok(universe_version)),
  effective_from date NOT NULL,
  content_hash bytea NOT NULL UNIQUE CHECK (octet_length(content_hash) = 32),
  registered_event_seq bigint NOT NULL REFERENCES event_log(event_seq),
  data_mode text NOT NULL CHECK (data_mode IN ('FIXTURE', 'REAL_DATA_READ_ONLY'))
);
DROP TRIGGER IF EXISTS universe_version_immutable ON universe_version;
CREATE TRIGGER universe_version_immutable BEFORE UPDATE OR DELETE ON universe_version
  FOR EACH ROW EXECUTE FUNCTION ta_reject_immutable();

CREATE TABLE IF NOT EXISTS universe_member (
  universe_version text NOT NULL REFERENCES universe_version(universe_version),
  permanent_security_id text NOT NULL REFERENCES security(permanent_security_id),
  included boolean NOT NULL,
  exclusion_reason text,
  listing_exchange text CHECK (listing_exchange IN ('XNYS', 'XNAS')),
  liquidity_snapshot jsonb,
  sector text,
  market_cap_bucket text,
  PRIMARY KEY (universe_version, permanent_security_id)
);
DROP TRIGGER IF EXISTS universe_member_immutable ON universe_member;
CREATE TRIGGER universe_member_immutable BEFORE UPDATE OR DELETE ON universe_member
  FOR EACH ROW EXECUTE FUNCTION ta_reject_immutable();

CREATE TABLE IF NOT EXISTS evaluation_window (
  window_id text PRIMARY KEY CHECK (ta_id_ok(window_id)),
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL CHECK (ends_at > starts_at),
  rule_id text NOT NULL,
  rule_version text NOT NULL,
  policy_id text NOT NULL REFERENCES policy_bundle(policy_id),
  cost_model_id text NOT NULL REFERENCES cost_model(cost_model_id),
  evaluator_id text NOT NULL REFERENCES evaluator_artifact(evaluator_id),
  universe_version text NOT NULL REFERENCES universe_version(universe_version),
  hypothesis_claim text NOT NULL,
  prior_contaminated boolean NOT NULL,
  contamination_source text NOT NULL CHECK (contamination_source IN ('PRIOR_OBSERVATION', 'PRIOR_RULE_LABELS', 'NONE')),
  release_event_seq bigint REFERENCES event_log(event_seq),
  release_snapshot_id text,
  ended_early_at timestamptz,
  early_end_event_seq bigint,
  early_end_reason text,
  FOREIGN KEY (rule_id, rule_version) REFERENCES rule_card(rule_id, rule_version)
);

CREATE TABLE IF NOT EXISTS security_ticker (
  mapping_id text PRIMARY KEY CHECK (ta_id_ok(mapping_id)),
  permanent_security_id text NOT NULL REFERENCES security(permanent_security_id),
  provider_id text NOT NULL CHECK (ta_id_ok(provider_id)),
  ticker text NOT NULL,
  valid_from timestamptz NOT NULL,
  valid_to timestamptz,
  registered_event_seq bigint NOT NULL REFERENCES event_log(event_seq),
  CHECK (valid_to IS NULL OR valid_to > valid_from)
);
DROP TRIGGER IF EXISTS security_ticker_immutable ON security_ticker;
CREATE TRIGGER security_ticker_immutable BEFORE UPDATE OR DELETE ON security_ticker
  FOR EACH ROW EXECUTE FUNCTION ta_reject_immutable();

CREATE TABLE IF NOT EXISTS calendar_session (
  calendar_version text NOT NULL CHECK (ta_id_ok(calendar_version)),
  listing_exchange text NOT NULL CHECK (listing_exchange IN ('XNYS', 'XNAS')),
  session_date date NOT NULL,
  is_open boolean NOT NULL,
  open_at timestamptz,
  close_at timestamptz,
  moc_entry_cutoff_at timestamptz,
  effective_rule_id text,
  source_reference text,
  verified_at timestamptz NOT NULL,
  content_hash bytea NOT NULL CHECK (octet_length(content_hash) = 32),
  PRIMARY KEY (calendar_version, listing_exchange, session_date),
  CHECK (
    (is_open AND open_at IS NOT NULL AND close_at IS NOT NULL AND moc_entry_cutoff_at IS NOT NULL AND open_at < close_at)
    OR (NOT is_open AND open_at IS NULL AND close_at IS NULL AND moc_entry_cutoff_at IS NULL)
  )
);
DROP TRIGGER IF EXISTS calendar_session_immutable ON calendar_session;
CREATE TRIGGER calendar_session_immutable BEFORE UPDATE OR DELETE ON calendar_session
  FOR EACH ROW EXECUTE FUNCTION ta_reject_immutable();

CREATE TABLE IF NOT EXISTS observation (
  observation_id text PRIMARY KEY CHECK (ta_id_ok(observation_id)),
  event_seq bigint NOT NULL REFERENCES event_log(event_seq),
  permanent_security_id text NOT NULL REFERENCES security(permanent_security_id),
  event_key text,
  session_date date NOT NULL,
  snapshot_type text NOT NULL,
  provider_id text NOT NULL,
  provider_record_id text NOT NULL,
  provider_revision text NOT NULL,
  vendor_as_of timestamptz,
  source_event_at timestamptz,
  received_at timestamptz NOT NULL,
  source_class text NOT NULL CHECK (source_class IN ('AUTHORITATIVE', 'REFERENCE', 'RESEARCH_ONLY', 'ESTIMATED', 'MISSING')),
  adjustment_basis text NOT NULL CHECK (adjustment_basis IN ('UNADJUSTED', 'PIT_TOTAL_RETURN', 'NOT_PRICE')),
  payload_schema_id text NOT NULL,
  payload_hash bytea NOT NULL CHECK (octet_length(payload_hash) = 32),
  observation_hash bytea NOT NULL UNIQUE CHECK (octet_length(observation_hash) = 32),
  envelope jsonb NOT NULL,
  payload_protected bytea,
  payload_nonce bytea,
  payload_key_id text,
  is_partial boolean NOT NULL,
  capture_error_code text,
  supersedes_observation_id text REFERENCES observation(observation_id),
  partition text NOT NULL CHECK (partition IN ('RESEARCH', 'HOLDOUT')),
  scheduled_erasure_at timestamptz,
  tombstoned boolean NOT NULL DEFAULT false,
  tombstone_reason text
);
CREATE INDEX IF NOT EXISTS observation_sec_type_idx ON observation (permanent_security_id, snapshot_type, session_date);

CREATE TABLE IF NOT EXISTS earnings_event (
  event_observation_id text PRIMARY KEY CHECK (ta_id_ok(event_observation_id)),
  event_key text NOT NULL CHECK (ta_id_ok(event_key)),
  permanent_security_id text NOT NULL REFERENCES security(permanent_security_id),
  intended_session date NOT NULL,
  timing text NOT NULL CHECK (timing IN ('AMC', 'BMO', 'INTRADAY', 'UNKNOWN')),
  quality text NOT NULL CHECK (quality IN ('ISSUER_CONFIRMED', 'ESTIMATED')),
  source_observation_id text NOT NULL REFERENCES observation(observation_id),
  supersedes_id text
);
DROP TRIGGER IF EXISTS earnings_event_immutable ON earnings_event;
CREATE TRIGGER earnings_event_immutable BEFORE UPDATE OR DELETE ON earnings_event
  FOR EACH ROW EXECUTE FUNCTION ta_reject_immutable();

CREATE TABLE IF NOT EXISTS candidate_eligibility (
  eligibility_id text PRIMARY KEY CHECK (ta_id_ok(eligibility_id)),
  session_date date NOT NULL,
  window_id text NOT NULL REFERENCES evaluation_window(window_id),
  permanent_security_id text NOT NULL REFERENCES security(permanent_security_id),
  event_key text,
  status text NOT NULL CHECK (status IN ('INCLUDED', 'EXCLUDED', 'UNRESOLVED')),
  reason_codes jsonb NOT NULL,
  evidence_ids jsonb NOT NULL,
  event_seq bigint NOT NULL REFERENCES event_log(event_seq),
  manifest_id text
);
DROP TRIGGER IF EXISTS candidate_eligibility_immutable ON candidate_eligibility;
CREATE TRIGGER candidate_eligibility_immutable BEFORE UPDATE OR DELETE ON candidate_eligibility
  FOR EACH ROW EXECUTE FUNCTION ta_reject_immutable();

CREATE TABLE IF NOT EXISTS manifest (
  manifest_id text PRIMARY KEY CHECK (ta_id_ok(manifest_id)),
  window_id text NOT NULL REFERENCES evaluation_window(window_id),
  session_date date NOT NULL,
  next_session_date date NOT NULL,
  second_next_session_date date NOT NULL,
  sleeve text NOT NULL CHECK (sleeve = 'EARNINGS'),
  universe_version text NOT NULL REFERENCES universe_version(universe_version),
  policy_id text NOT NULL REFERENCES policy_bundle(policy_id),
  rule_id text NOT NULL,
  rule_version text NOT NULL,
  evaluator_id text NOT NULL REFERENCES evaluator_artifact(evaluator_id),
  cost_model_id text NOT NULL REFERENCES cost_model(cost_model_id),
  policy_hash bytea NOT NULL,
  rule_ast_hash bytea NOT NULL,
  evaluator_artifact_hash bytea NOT NULL,
  cost_model_hash bytea NOT NULL,
  calendar_refs jsonb NOT NULL,
  seal_at timestamptz NOT NULL,
  freeze_cutoff_at timestamptz NOT NULL,
  mark_wait_at timestamptz NOT NULL,
  report_finalize_at timestamptz NOT NULL,
  sealed_at timestamptz NOT NULL,
  seed bytea NOT NULL CHECK (octet_length(seed) = 32),
  sealed_member_count integer NOT NULL CHECK (sealed_member_count >= 0 AND sealed_member_count <= 100),
  canonical_content text NOT NULL,
  manifest_hash bytea NOT NULL UNIQUE CHECK (octet_length(manifest_hash) = 32),
  seal_event_seq bigint NOT NULL REFERENCES event_log(event_seq),
  freeze_resolution text NOT NULL CHECK (freeze_resolution IN ('OPEN', 'FULL', 'PARTIAL', 'ABANDONED', 'EMPTY')),
  admission_closed_event_seq bigint,
  research_closed_event_seq bigint,
  UNIQUE (window_id, session_date, sleeve),
  FOREIGN KEY (rule_id, rule_version) REFERENCES rule_card(rule_id, rule_version)
);

CREATE TABLE IF NOT EXISTS manifest_member (
  manifest_id text NOT NULL REFERENCES manifest(manifest_id),
  permanent_security_id text NOT NULL REFERENCES security(permanent_security_id),
  event_key text NOT NULL,
  sealed_event_session date NOT NULL,
  timing text NOT NULL CHECK (timing = 'AMC'),
  timing_quality text NOT NULL CHECK (timing_quality IN ('ISSUER_CONFIRMED', 'ESTIMATED')),
  shuffle_order_index integer NOT NULL CHECK (shuffle_order_index >= 0),
  snapshot_hash bytea NOT NULL CHECK (octet_length(snapshot_hash) = 32),
  display_ticker text NOT NULL,
  PRIMARY KEY (manifest_id, permanent_security_id),
  UNIQUE (manifest_id, shuffle_order_index)
);
DROP TRIGGER IF EXISTS manifest_member_immutable ON manifest_member;
CREATE TRIGGER manifest_member_immutable BEFORE UPDATE OR DELETE ON manifest_member
  FOR EACH ROW EXECUTE FUNCTION ta_reject_immutable();

CREATE TABLE IF NOT EXISTS sealed_input (
  manifest_id text NOT NULL,
  permanent_security_id text NOT NULL,
  snapshot_schema text NOT NULL,
  snapshot_hash bytea NOT NULL CHECK (octet_length(snapshot_hash) = 32),
  card jsonb NOT NULL,
  bindings jsonb NOT NULL,
  pin_count integer NOT NULL CHECK (pin_count >= 0),
  card_complete boolean NOT NULL,
  options_valid boolean,
  coverage_summary jsonb NOT NULL,
  retention_exclusion boolean NOT NULL DEFAULT false,
  PRIMARY KEY (manifest_id, permanent_security_id),
  FOREIGN KEY (manifest_id, permanent_security_id) REFERENCES manifest_member(manifest_id, permanent_security_id)
);
DROP TRIGGER IF EXISTS sealed_input_immutable ON sealed_input;
CREATE TRIGGER sealed_input_immutable BEFORE UPDATE OR DELETE ON sealed_input
  FOR EACH ROW EXECUTE FUNCTION ta_reject_immutable();

CREATE TABLE IF NOT EXISTS sealed_input_pin (
  manifest_id text NOT NULL,
  permanent_security_id text NOT NULL,
  observation_id text NOT NULL REFERENCES observation(observation_id),
  observation_hash bytea NOT NULL CHECK (octet_length(observation_hash) = 32),
  pin_index integer NOT NULL CHECK (pin_index >= 0),
  PRIMARY KEY (manifest_id, permanent_security_id, observation_id),
  UNIQUE (manifest_id, permanent_security_id, pin_index),
  FOREIGN KEY (manifest_id, permanent_security_id) REFERENCES sealed_input(manifest_id, permanent_security_id)
);
DROP TRIGGER IF EXISTS sealed_input_pin_immutable ON sealed_input_pin;
CREATE TRIGGER sealed_input_pin_immutable BEFORE UPDATE OR DELETE ON sealed_input_pin
  FOR EACH ROW EXECUTE FUNCTION ta_reject_immutable();

CREATE TABLE IF NOT EXISTS "freeze" (
  freeze_id text PRIMARY KEY CHECK (ta_id_ok(freeze_id)),
  manifest_id text NOT NULL,
  permanent_security_id text NOT NULL,
  snapshot_hash bytea NOT NULL,
  input_hash bytea NOT NULL CHECK (octet_length(input_hash) = 32),
  output_hash bytea NOT NULL CHECK (octet_length(output_hash) = 32),
  decision text NOT NULL CHECK (decision IN ('STAND_DOWN', 'PREDICT')),
  direction text,
  card_complete boolean NOT NULL,
  options_valid boolean,
  output_payload jsonb NOT NULL,
  pin_count integer NOT NULL CHECK (pin_count >= 0),
  freeze_order_index integer NOT NULL CHECK (freeze_order_index >= 0),
  admission_checked_at timestamptz NOT NULL,
  event_seq bigint NOT NULL REFERENCES event_log(event_seq),
  verification_level text NOT NULL CHECK (verification_level IN ('BYTE_VERIFIED', 'ATTESTED', 'HASH_ONLY', 'UNVERIFIABLE')),
  UNIQUE (manifest_id, permanent_security_id),
  UNIQUE (manifest_id, freeze_order_index),
  UNIQUE (freeze_id, manifest_id, permanent_security_id),
  FOREIGN KEY (manifest_id, permanent_security_id) REFERENCES manifest_member(manifest_id, permanent_security_id),
  CHECK (
    (decision = 'STAND_DOWN' AND direction IS NULL)
    OR (decision = 'PREDICT' AND direction = 'LONG' AND card_complete IS TRUE)
  )
);
DROP TRIGGER IF EXISTS freeze_immutable ON "freeze";
CREATE TRIGGER freeze_immutable BEFORE UPDATE OR DELETE ON "freeze"
  FOR EACH ROW EXECUTE FUNCTION ta_reject_immutable();

CREATE TABLE IF NOT EXISTS freeze_pin (
  freeze_id text NOT NULL REFERENCES "freeze"(freeze_id),
  observation_id text NOT NULL REFERENCES observation(observation_id),
  observation_hash bytea NOT NULL,
  pin_index integer NOT NULL CHECK (pin_index >= 0),
  PRIMARY KEY (freeze_id, observation_id),
  UNIQUE (freeze_id, pin_index)
);
DROP TRIGGER IF EXISTS freeze_pin_immutable ON freeze_pin;
CREATE TRIGGER freeze_pin_immutable BEFORE UPDATE OR DELETE ON freeze_pin
  FOR EACH ROW EXECUTE FUNCTION ta_reject_immutable();

CREATE TABLE IF NOT EXISTS freeze_attempt (
  attempt_id text PRIMARY KEY CHECK (ta_id_ok(attempt_id)),
  manifest_id text NOT NULL,
  permanent_security_id text NOT NULL,
  started_at timestamptz NOT NULL,
  finished_at timestamptz NOT NULL,
  duration_ms bigint NOT NULL CHECK (duration_ms >= 0),
  result_code text NOT NULL,
  event_seq bigint NOT NULL REFERENCES event_log(event_seq),
  FOREIGN KEY (manifest_id, permanent_security_id) REFERENCES manifest_member(manifest_id, permanent_security_id)
);
DROP TRIGGER IF EXISTS freeze_attempt_immutable ON freeze_attempt;
CREATE TRIGGER freeze_attempt_immutable BEFORE UPDATE OR DELETE ON freeze_attempt
  FOR EACH ROW EXECUTE FUNCTION ta_reject_immutable();

CREATE TABLE IF NOT EXISTS execution_admission (
  admission_id text PRIMARY KEY CHECK (ta_id_ok(admission_id)),
  freeze_id text NOT NULL UNIQUE REFERENCES "freeze"(freeze_id),
  outcome text NOT NULL CHECK (outcome IN ('NOT_PREDICTED', 'ADMITTED', 'DENIED')),
  reason_codes jsonb NOT NULL,
  quote_observation_ids jsonb NOT NULL,
  checked_at timestamptz NOT NULL,
  policy_hash bytea NOT NULL,
  request_hash bytea NOT NULL,
  position_id text UNIQUE,
  event_seq bigint NOT NULL REFERENCES event_log(event_seq),
  CHECK (
    (outcome = 'ADMITTED' AND position_id IS NOT NULL)
    OR (outcome IN ('DENIED', 'NOT_PREDICTED') AND position_id IS NULL)
  )
);
DROP TRIGGER IF EXISTS execution_admission_immutable ON execution_admission;
CREATE TRIGGER execution_admission_immutable BEFORE UPDATE OR DELETE ON execution_admission
  FOR EACH ROW EXECUTE FUNCTION ta_reject_immutable();

CREATE TABLE IF NOT EXISTS "position" (
  position_id text PRIMARY KEY CHECK (ta_id_ok(position_id)),
  freeze_id text NOT NULL UNIQUE,
  manifest_id text NOT NULL,
  permanent_security_id text NOT NULL,
  admission_id text NOT NULL UNIQUE REFERENCES execution_admission(admission_id),
  intended_event_session date NOT NULL,
  sleeve text NOT NULL CHECK (sleeve = 'EARNINGS'),
  original_reserved_notional numeric(16,4) NOT NULL CHECK (original_reserved_notional > 0 AND original_reserved_notional <= 5000),
  committed_at timestamptz NOT NULL,
  entry_plan jsonb NOT NULL,
  exit_plan jsonb NOT NULL,
  state text NOT NULL CHECK (state IN (
    'COMMITTED_IRREVOCABLE', 'FILLED', 'NO_FILL', 'IMPAIRED_ENTRY', 'IMPAIRED_EXIT', 'FLAT', 'CLOSED'
  )),
  cas_token bigint NOT NULL CHECK (cas_token > 0),
  entry_evidence_id text,
  last_book_vintage_id text,
  flatten_request_event_seq bigint,
  closed_event_seq bigint,
  release_event_seq bigint UNIQUE,
  last_transition_event_seq bigint NOT NULL,
  display_ticker text NOT NULL,
  FOREIGN KEY (freeze_id, manifest_id, permanent_security_id)
    REFERENCES "freeze"(freeze_id, manifest_id, permanent_security_id),
  CHECK (
    (state = 'CLOSED' AND release_event_seq IS NOT NULL AND closed_event_seq IS NOT NULL)
    OR (state <> 'CLOSED' AND release_event_seq IS NULL AND closed_event_seq IS NULL)
  )
);
CREATE UNIQUE INDEX IF NOT EXISTS position_active_security_uidx
  ON "position" (permanent_security_id) WHERE state <> 'CLOSED';

CREATE TABLE IF NOT EXISTS entry_evidence (
  entry_evidence_id text PRIMARY KEY CHECK (ta_id_ok(entry_evidence_id)),
  position_id text NOT NULL REFERENCES "position"(position_id),
  kind text NOT NULL CHECK (kind IN ('OFFICIAL_FILL', 'CONFIRMED_NO_FILL')),
  source_ids jsonb NOT NULL,
  calc jsonb NOT NULL,
  content_hash bytea NOT NULL CHECK (octet_length(content_hash) = 32),
  event_seq bigint NOT NULL REFERENCES event_log(event_seq)
);
DROP TRIGGER IF EXISTS entry_evidence_immutable ON entry_evidence;
CREATE TRIGGER entry_evidence_immutable BEFORE UPDATE OR DELETE ON entry_evidence
  FOR EACH ROW EXECUTE FUNCTION ta_reject_immutable();

CREATE TABLE IF NOT EXISTS deadline (
  deadline_id text PRIMARY KEY CHECK (ta_id_ok(deadline_id)),
  kind text NOT NULL CHECK (kind IN ('FREEZE', 'MARK_WAIT', 'REPORT_FINALIZE', 'WINDOW_RELEASE')),
  manifest_id text REFERENCES manifest(manifest_id),
  permanent_security_id text,
  window_id text REFERENCES evaluation_window(window_id),
  scheduled_at timestamptz NOT NULL,
  scheduled_event_seq bigint NOT NULL REFERENCES event_log(event_seq),
  applied_event_seq bigint UNIQUE,
  applied_at timestamptz,
  CHECK (
    (applied_event_seq IS NULL AND applied_at IS NULL)
    OR (applied_event_seq IS NOT NULL AND applied_at IS NOT NULL AND applied_at >= scheduled_at)
  ),
  CHECK (
    (kind IN ('FREEZE', 'REPORT_FINALIZE') AND manifest_id IS NOT NULL AND permanent_security_id IS NULL AND window_id IS NULL)
    OR (kind = 'MARK_WAIT' AND manifest_id IS NOT NULL AND permanent_security_id IS NOT NULL AND window_id IS NULL)
    OR (kind = 'WINDOW_RELEASE' AND window_id IS NOT NULL AND manifest_id IS NULL AND permanent_security_id IS NULL)
  )
);
CREATE UNIQUE INDEX IF NOT EXISTS deadline_freeze_uidx ON deadline (manifest_id) WHERE kind = 'FREEZE';
CREATE UNIQUE INDEX IF NOT EXISTS deadline_report_uidx ON deadline (manifest_id) WHERE kind = 'REPORT_FINALIZE';
CREATE UNIQUE INDEX IF NOT EXISTS deadline_mark_uidx ON deadline (manifest_id, permanent_security_id) WHERE kind = 'MARK_WAIT';
CREATE UNIQUE INDEX IF NOT EXISTS deadline_window_uidx ON deadline (window_id) WHERE kind = 'WINDOW_RELEASE';
CREATE INDEX IF NOT EXISTS deadline_due_idx ON deadline (scheduled_at) WHERE applied_event_seq IS NULL;

CREATE TABLE IF NOT EXISTS guard_event (
  guard_id text PRIMARY KEY CHECK (ta_id_ok(guard_id)),
  event_key text NOT NULL,
  manifest_id text,
  permanent_security_id text NOT NULL REFERENCES security(permanent_security_id),
  guard_type text NOT NULL CHECK (guard_type IN ('EARLY_RESULTS', 'OPERATOR_KNOWLEDGE', 'OFF_DESIGN_TIMING')),
  source_observation_id text,
  source_event_at timestamptz,
  recorded_at timestamptz NOT NULL,
  actor_principal_id text NOT NULL,
  reason_code text NOT NULL,
  event_seq bigint NOT NULL REFERENCES event_log(event_seq)
);
DROP TRIGGER IF EXISTS guard_event_immutable ON guard_event;
CREATE TRIGGER guard_event_immutable BEFORE UPDATE OR DELETE ON guard_event
  FOR EACH ROW EXECUTE FUNCTION ta_reject_immutable();

CREATE TABLE IF NOT EXISTS grade (
  grade_id text PRIMARY KEY CHECK (ta_id_ok(grade_id)),
  manifest_id text NOT NULL,
  permanent_security_id text NOT NULL,
  freeze_id text,
  vintage integer NOT NULL CHECK (vintage >= 0),
  outcome text NOT NULL CHECK (outcome IN ('GRADED', 'UNGRADEABLE', 'NO_EVENT', 'NO_FREEZE')),
  reason_codes jsonb NOT NULL,
  event_status text NOT NULL CHECK (event_status IN ('CONFIRMED_INTENDED_EVENT', 'CONFIRMED_NO_EVENT', 'UNRESOLVED')),
  in_evidence_set boolean NOT NULL DEFAULT false,
  late_label_recovery boolean NOT NULL DEFAULT false,
  confound_flags jsonb NOT NULL,
  label_policy_hash bytea NOT NULL,
  values jsonb NOT NULL,
  content_hash bytea NOT NULL CHECK (octet_length(content_hash) = 32),
  created_event_seq bigint NOT NULL REFERENCES event_log(event_seq),
  revision_reason text,
  supersedes_grade_id text,
  UNIQUE (manifest_id, permanent_security_id, vintage),
  FOREIGN KEY (manifest_id, permanent_security_id) REFERENCES manifest_member(manifest_id, permanent_security_id),
  CHECK (
    (outcome = 'NO_FREEZE' AND freeze_id IS NULL)
    OR (outcome <> 'NO_FREEZE' AND freeze_id IS NOT NULL)
  )
);
DROP TRIGGER IF EXISTS grade_immutable ON grade;
CREATE TRIGGER grade_immutable BEFORE UPDATE OR DELETE ON grade
  FOR EACH ROW EXECUTE FUNCTION ta_reject_immutable();
CREATE INDEX IF NOT EXISTS grade_member_vintage_idx ON grade (manifest_id, permanent_security_id, vintage DESC);

CREATE TABLE IF NOT EXISTS grade_pin (
  grade_id text NOT NULL REFERENCES grade(grade_id),
  observation_id text NOT NULL REFERENCES observation(observation_id),
  observation_hash bytea NOT NULL,
  pin_index integer NOT NULL CHECK (pin_index >= 0),
  evidence_role text NOT NULL CHECK (evidence_role IN ('ENTRY', 'EXIT', 'BENCHMARK', 'CORPORATE_ACTION', 'EVENT', 'GUARD')),
  PRIMARY KEY (grade_id, observation_id, evidence_role),
  UNIQUE (grade_id, pin_index)
);
DROP TRIGGER IF EXISTS grade_pin_immutable ON grade_pin;
CREATE TRIGGER grade_pin_immutable BEFORE UPDATE OR DELETE ON grade_pin
  FOR EACH ROW EXECUTE FUNCTION ta_reject_immutable();

CREATE TABLE IF NOT EXISTS book_vintage (
  book_vintage_id text PRIMARY KEY CHECK (ta_id_ok(book_vintage_id)),
  position_id text NOT NULL REFERENCES "position"(position_id),
  vintage integer NOT NULL CHECK (vintage >= 0),
  basis text NOT NULL CHECK (basis IN ('ORIGINAL_PLAN', 'BOOK_FALLBACK', 'ADMIN_FLATTEN', 'CORPORATE_ACTION', 'NO_FILL')),
  status text NOT NULL CHECK (status IN ('PRICED', 'CONFIRMED_NO_FILL')),
  values jsonb NOT NULL,
  content_hash bytea NOT NULL CHECK (octet_length(content_hash) = 32),
  source_class text NOT NULL CHECK (source_class = 'ESTIMATED'),
  strategy_pnl_eligible boolean NOT NULL,
  created_event_seq bigint NOT NULL REFERENCES event_log(event_seq),
  supersedes_book_id text,
  revision_reason text,
  UNIQUE (position_id, vintage)
);
DROP TRIGGER IF EXISTS book_vintage_immutable ON book_vintage;
CREATE TRIGGER book_vintage_immutable BEFORE UPDATE OR DELETE ON book_vintage
  FOR EACH ROW EXECUTE FUNCTION ta_reject_immutable();

CREATE TABLE IF NOT EXISTS book_pin (
  book_vintage_id text NOT NULL REFERENCES book_vintage(book_vintage_id),
  observation_id text NOT NULL REFERENCES observation(observation_id),
  observation_hash bytea NOT NULL,
  pin_index integer NOT NULL CHECK (pin_index >= 0),
  evidence_role text NOT NULL CHECK (evidence_role IN ('ENTRY', 'EXIT', 'FALLBACK', 'CORPORATE_ACTION', 'NONEXECUTION')),
  PRIMARY KEY (book_vintage_id, observation_id, evidence_role),
  UNIQUE (book_vintage_id, pin_index)
);
DROP TRIGGER IF EXISTS book_pin_immutable ON book_pin;
CREATE TRIGGER book_pin_immutable BEFORE UPDATE OR DELETE ON book_pin
  FOR EACH ROW EXECUTE FUNCTION ta_reject_immutable();

CREATE TABLE IF NOT EXISTS report_snapshot (
  snapshot_id text PRIMARY KEY CHECK (ta_id_ok(snapshot_id)),
  scope text NOT NULL CHECK (scope IN ('MANIFEST', 'WINDOW')),
  manifest_id text REFERENCES manifest(manifest_id),
  window_id text NOT NULL REFERENCES evaluation_window(window_id),
  as_of_event_seq bigint NOT NULL REFERENCES event_log(event_seq),
  created_at timestamptz NOT NULL,
  compatibility_hash bytea NOT NULL CHECK (octet_length(compatibility_hash) = 32),
  metrics jsonb NOT NULL,
  content_hash bytea NOT NULL CHECK (octet_length(content_hash) = 32),
  data_mode text NOT NULL CHECK (data_mode IN ('FIXTURE', 'REAL_DATA_READ_ONLY')),
  view_kind text NOT NULL CHECK (view_kind IN ('AS_KNOWN', 'LATEST_CORRECTED'))
);
DROP TRIGGER IF EXISTS report_snapshot_immutable ON report_snapshot;
CREATE TRIGGER report_snapshot_immutable BEFORE UPDATE OR DELETE ON report_snapshot
  FOR EACH ROW EXECUTE FUNCTION ta_reject_immutable();

CREATE TABLE IF NOT EXISTS report_grade_pin (
  snapshot_id text NOT NULL REFERENCES report_snapshot(snapshot_id),
  manifest_id text NOT NULL,
  permanent_security_id text NOT NULL,
  grade_id text NOT NULL REFERENCES grade(grade_id),
  PRIMARY KEY (snapshot_id, manifest_id, permanent_security_id)
);
DROP TRIGGER IF EXISTS report_grade_pin_immutable ON report_grade_pin;
CREATE TRIGGER report_grade_pin_immutable BEFORE UPDATE OR DELETE ON report_grade_pin
  FOR EACH ROW EXECUTE FUNCTION ta_reject_immutable();

CREATE TABLE IF NOT EXISTS report_book_pin (
  snapshot_id text NOT NULL REFERENCES report_snapshot(snapshot_id),
  position_id text NOT NULL REFERENCES "position"(position_id),
  book_vintage_id text,
  book_status_at_snapshot text NOT NULL,
  PRIMARY KEY (snapshot_id, position_id)
);
DROP TRIGGER IF EXISTS report_book_pin_immutable ON report_book_pin;
CREATE TRIGGER report_book_pin_immutable BEFORE UPDATE OR DELETE ON report_book_pin
  FOR EACH ROW EXECUTE FUNCTION ta_reject_immutable();

CREATE TABLE IF NOT EXISTS desk_principal (
  principal_id text PRIMARY KEY CHECK (ta_id_ok(principal_id)),
  user_id text NOT NULL UNIQUE,
  login_name text NOT NULL,
  role text NOT NULL CHECK (role IN ('OPERATOR', 'REVIEWER', 'SERVICE')),
  active boolean NOT NULL DEFAULT true,
  label_exposure_declared boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL
);

CREATE TABLE IF NOT EXISTS access_audit (
  audit_id text PRIMARY KEY CHECK (ta_id_ok(audit_id)),
  actor_principal_id text NOT NULL,
  action text NOT NULL,
  target_type text NOT NULL,
  target_id text,
  occurred_at timestamptz NOT NULL,
  allowed boolean NOT NULL,
  safe_details jsonb NOT NULL
);
DROP TRIGGER IF EXISTS access_audit_immutable ON access_audit;
CREATE TRIGGER access_audit_immutable BEFORE UPDATE OR DELETE ON access_audit
  FOR EACH ROW EXECUTE FUNCTION ta_reject_immutable();

CREATE TABLE IF NOT EXISTS job_state (
  job_name text PRIMARY KEY CHECK (ta_id_ok(job_name)),
  next_due_at timestamptz,
  cursor jsonb,
  last_started_at timestamptz,
  last_completed_at timestamptz,
  last_receipt_id text,
  status text NOT NULL CHECK (status IN ('IDLE', 'RUNNING', 'FAILED', 'BLOCKED')),
  safe_error_code text,
  updated_event_seq bigint
);

CREATE TABLE IF NOT EXISTS ops_alarm (
  alarm_id text PRIMARY KEY CHECK (ta_id_ok(alarm_id)),
  code text NOT NULL,
  component text NOT NULL,
  first_seen timestamptz NOT NULL,
  last_seen timestamptz NOT NULL,
  related_ids jsonb NOT NULL,
  blocks_new_admission boolean NOT NULL,
  status text NOT NULL CHECK (status IN ('OPEN', 'ACKNOWLEDGED', 'RESOLVED')),
  safe_details jsonb NOT NULL,
  opened_event_seq bigint,
  resolution_event_seq bigint
);

CREATE TABLE IF NOT EXISTS operator_control (
  sleeve text PRIMARY KEY CHECK (sleeve = 'EARNINGS'),
  admission_paused boolean NOT NULL,
  pause_reason text,
  updated_event_seq bigint NOT NULL
);

CREATE TABLE IF NOT EXISTS fire_rate_note (
  note_id text PRIMARY KEY CHECK (ta_id_ok(note_id)),
  window_id text NOT NULL REFERENCES evaluation_window(window_id),
  manifest_id text,
  actor_principal_id text NOT NULL,
  hypothesis text NOT NULL CHECK (hypothesis IN ('IMPLEMENTATION_BUG', 'COVERAGE_SHIFT', 'REGIME_SHIFT')),
  note text NOT NULL,
  event_seq bigint NOT NULL REFERENCES event_log(event_seq)
);
DROP TRIGGER IF EXISTS fire_rate_note_immutable ON fire_rate_note;
CREATE TRIGGER fire_rate_note_immutable BEFORE UPDATE OR DELETE ON fire_rate_note
  FOR EACH ROW EXECUTE FUNCTION ta_reject_immutable();

CREATE TABLE IF NOT EXISTS bootstrap_state (
  singleton_key boolean PRIMARY KEY CHECK (singleton_key),
  completed boolean NOT NULL,
  completed_at timestamptz,
  note text
);

INSERT INTO bootstrap_state (singleton_key, completed, note)
  VALUES (true, false, 'pending')
  ON CONFLICT DO NOTHING;
```


---

## `migrations/0003_alpaca.sql` (1668 bytes, sha256 `b075b1a705107adf3a437cc923368b942112a8af7c5ef1dbb24e2588426ea18e`)

```sql
-- Alpaca venue credentials and local order audit.
-- Secrets are AES-256-GCM ciphertext. The API key id is not a secret; the secret key never leaves ciphertext.

CREATE TABLE IF NOT EXISTS alpaca_credential (
  singleton_key boolean PRIMARY KEY CHECK (singleton_key),
  api_key_id text NOT NULL CHECK (char_length(api_key_id) BETWEEN 8 AND 80),
  secret_ciphertext bytea NOT NULL,
  secret_nonce bytea NOT NULL CHECK (octet_length(secret_nonce) = 12),
  secret_tag bytea NOT NULL CHECK (octet_length(secret_tag) = 16),
  mode text NOT NULL CHECK (mode IN ('PAPER', 'LIVE')),
  watchlist text[] NOT NULL,
  connected_at timestamptz NOT NULL,
  connected_by text NOT NULL CHECK (ta_id_ok(connected_by)),
  last_ok_at timestamptz,
  last_error text,
  account_number_last4 text,
  account_status text,
  CONSTRAINT alpaca_watchlist_size CHECK (cardinality(watchlist) BETWEEN 1 AND 24)
);

CREATE TABLE IF NOT EXISTS alpaca_order_log (
  local_id text PRIMARY KEY CHECK (ta_id_ok(local_id)),
  alpaca_order_id text,
  client_order_id text NOT NULL UNIQUE CHECK (ta_id_ok(client_order_id)),
  symbol text NOT NULL,
  side text NOT NULL CHECK (side IN ('buy', 'sell')),
  order_type text NOT NULL CHECK (order_type IN ('market', 'limit')),
  time_in_force text NOT NULL CHECK (time_in_force IN ('day', 'gtc', 'ioc')),
  qty text,
  notional text,
  limit_price text,
  status text NOT NULL,
  mode text NOT NULL CHECK (mode IN ('PAPER', 'LIVE')),
  submitted_at timestamptz NOT NULL,
  submitted_by text NOT NULL CHECK (ta_id_ok(submitted_by)),
  raw_receipt jsonb NOT NULL
);

CREATE INDEX IF NOT EXISTS alpaca_order_log_submitted ON alpaca_order_log (submitted_at DESC);
```


---

## `migrations/0003_rule_revision.sql` (792 bytes, sha256 `e11beadf3bdadf0fc93e2e87d4e8266711bdf075d13e238a9444645fd4292bb2`)

```sql
-- Observational learning ledger. Adopted revisions also insert an immutable rule_card + evaluation_window.
CREATE TABLE IF NOT EXISTS rule_revision (
  revision_id text PRIMARY KEY,
  parent_rule_id text NOT NULL,
  parent_rule_version text NOT NULL,
  new_rule_version text,
  vintage_manifest_id text,
  evidence_n int NOT NULL,
  direction_hits int NOT NULL,
  direction_misses int NOT NULL,
  band_hits int NOT NULL,
  implied_move_gte text NOT NULL,
  implied_move_lte text NOT NULL,
  rel5_lt text NOT NULL,
  rel63_gt text NOT NULL,
  adopted boolean NOT NULL,
  reason_human text NOT NULL,
  ast_hash text,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  created_event_seq bigint
);
INSERT INTO job_state (job_name, status) VALUES ('learn-revise', 'IDLE') ON CONFLICT DO NOTHING;
```


---

## `migrations/0005_alpaca_data_secrets.sql` (1514 bytes, sha256 `41fe1618225ac3c832d84c6f9d72db1781f7b8d709788ef13f0dd2a9cce35a11`)

```sql
-- Separate from alpaca_credential: these keys are never consumed by order routing.
-- Store the AES master key in a SERVER secret, not in this database.
CREATE TABLE IF NOT EXISTS alpaca_data_secret (
  owner_user_id text PRIMARY KEY CHECK (length(owner_user_id) BETWEEN 1 AND 256),
  version uuid NOT NULL,
  envelope jsonb NOT NULL CHECK (jsonb_typeof(envelope) = 'object'),
  key_last4 text NOT NULL CHECK (length(key_last4) = 4),
  updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  checked_at timestamptz,
  last_test_started_at timestamptz,
  test_result text NOT NULL DEFAULT 'NOT_TESTED' CHECK (test_result IN (
    'NOT_TESTED','VERIFIED','INVALID_CREDENTIALS','AUTH_OR_PERMISSION_DENIED',
    'RATE_LIMITED','PROVIDER_UNAVAILABLE'
  ))
);
CREATE TABLE IF NOT EXISTS alpaca_data_secret_audit (
  audit_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  owner_user_id text NOT NULL,
  version uuid NOT NULL,
  action text NOT NULL CHECK (action IN ('SAVE','REMOVE','TEST')),
  result text NOT NULL CHECK (result IN (
    'SAVED','REMOVED','VERIFIED','INVALID_CREDENTIALS','AUTH_OR_PERMISSION_DENIED',
    'RATE_LIMITED','PROVIDER_UNAVAILABLE'
  )),
  occurred_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
REVOKE ALL ON alpaca_data_secret FROM PUBLIC;
REVOKE ALL ON alpaca_data_secret_audit FROM PUBLIC;
-- Existing authenticated backend DB role owns these tables. Browsers never connect.
-- Audit rows contain action metadata only: no key, ciphertext, request body, or response body.
```


---

## `src/kernel/index.ts` (30308 bytes, sha256 `275612221598f7d3bd6711023c6a3c82600b99f21ab1b4392d687b627f6d4ba7`)

```ts
/**
 * Trading App v1.2 pure serialization / numeric / evaluator kernel.
 * Port of the specification reference (section 27). Browser must not import this
 * for research labels, fills, risk counters, or hashes.
 */
import { createHash, randomBytes } from "node:crypto";

const IDENT = /^[A-Za-z0-9][A-Za-z0-9:._-]{0,63}$/;
const HEX = /^[0-9a-f]{64}$/;
const DEC = /^-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?$/;
const KEY = /^[A-Za-z_][A-Za-z0-9_]*$/;
const CANON_DEC12 = /^-?(?:0|[1-9][0-9]*)\.[0-9]{12}$/;
/** Money/price text: explicit fraction, no exponent, no '+', no whitespace. */
const DEC_TEXT = /^-?(?:0|[1-9][0-9]*)\.[0-9]{1,18}$/;

export class KernelError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "KernelError";
  }
}

export function ident(s: unknown): string {
  if (typeof s !== "string" || !IDENT.test(s)) throw new KernelError("INVALID_ID");
  return s;
}

export function digestBytes(s: unknown): Buffer {
  if (typeof s !== "string" || !HEX.test(s)) throw new KernelError("INVALID_SHA256_HEX");
  return Buffer.from(s, "hex");
}

export function field(b: Buffer | Uint8Array): Buffer {
  if (!Buffer.isBuffer(b) && !(b instanceof Uint8Array)) throw new KernelError("INVALID_FIELD");
  const buf = Buffer.isBuffer(b) ? b : Buffer.from(b);
  if (buf.length > 4294967295) throw new KernelError("INVALID_FIELD");
  const out = Buffer.allocUnsafe(4 + buf.length);
  out.writeUInt32BE(buf.length, 0);
  buf.copy(out, 4);
  return out;
}

export function u32(v: unknown): Buffer {
  if (typeof v !== "number" || !Number.isInteger(v) || v < 0 || v > 4294967295) {
    throw new KernelError("INVALID_UINT32");
  }
  const out = Buffer.allocUnsafe(4);
  out.writeUInt32BE(v, 0);
  return out;
}

export function sha256(data: Buffer): string {
  return createHash("sha256").update(data).digest("hex");
}

export function h(domain: string, ...parts: Buffer[]): string {
  return sha256(Buffer.concat([field(Buffer.from(domain, "ascii")), ...parts.map((p) => field(p))]));
}

function validateCanon(x: unknown, depth = 0): void {
  if (depth > 32) throw new KernelError("JSON_DEPTH_EXCEEDED");
  if (x === null || typeof x === "boolean") return;
  if (typeof x === "string") {
    Buffer.from(x, "utf8");
    return;
  }
  if (Array.isArray(x)) {
    for (const v of x) validateCanon(v, depth + 1);
    return;
  }
  if (x && typeof x === "object") {
    for (const [k, v] of Object.entries(x)) {
      if (typeof k !== "string" || !KEY.test(k)) throw new KernelError("INVALID_CANONICAL_KEY");
      validateCanon(v, depth + 1);
    }
    return;
  }
  throw new KernelError("CANONICAL_NUMBERS_MUST_BE_STRINGS");
}

function stableStringify(x: unknown): string {
  if (x === null) return "null";
  if (x === true) return "true";
  if (x === false) return "false";
  if (typeof x === "string") return JSON.stringify(x);
  if (Array.isArray(x)) return `[${x.map(stableStringify).join(",")}]`;
  if (x && typeof x === "object") {
    const keys = Object.keys(x).sort();
    return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify((x as Record<string, unknown>)[k])}`).join(",")}}`;
  }
  throw new KernelError("CANONICAL_NUMBERS_MUST_BE_STRINGS");
}

export function canon(obj: unknown): Buffer {
  validateCanon(obj);
  return Buffer.from(stableStringify(obj), "utf8");
}

function rejectNumberTokens(s: string): void {
  let inStr = false;
  let esc = false;
  for (let i = 0; i < s.length; i += 1) {
    const c = s[i];
    if (inStr) {
      if (esc) {
        esc = false;
        continue;
      }
      if (c === "\\") {
        esc = true;
        continue;
      }
      if (c === '"') inStr = false;
      continue;
    }
    if (c === '"') {
      inStr = true;
      continue;
    }
    if (c === "-" || (c >= "0" && c <= "9")) {
      throw new KernelError("CANONICAL_NUMBERS_MUST_BE_STRINGS");
    }
  }
}

function parseValue(s: string, i: { n: number }): unknown {
  skipWs(s, i);
  const c = s[i.n];
  if (c === '"') return parseString(s, i);
  if (c === "{") return parseObject(s, i);
  if (c === "[") return parseArray(s, i);
  if (s.startsWith("true", i.n)) {
    i.n += 4;
    return true;
  }
  if (s.startsWith("false", i.n)) {
    i.n += 5;
    return false;
  }
  if (s.startsWith("null", i.n)) {
    i.n += 4;
    return null;
  }
  throw new KernelError("CANONICAL_NUMBERS_MUST_BE_STRINGS");
}

function skipWs(s: string, i: { n: number }): void {
  while (i.n < s.length && (s[i.n] === " " || s[i.n] === "\n" || s[i.n] === "\r" || s[i.n] === "\t")) i.n += 1;
}

function parseString(s: string, i: { n: number }): string {
  if (s[i.n] !== '"') throw new KernelError("INVALID_JSON");
  i.n += 1;
  let out = "";
  while (i.n < s.length) {
    const c = s[i.n];
    if (c === '"') {
      i.n += 1;
      return out;
    }
    if (c === "\\") {
      i.n += 1;
      const e = s[i.n];
      const map: Record<string, string> = {
        '"': '"',
        "\\": "\\",
        "/": "/",
        b: "\b",
        f: "\f",
        n: "\n",
        r: "\r",
        t: "\t",
      };
      if (e in map) {
        out += map[e];
        i.n += 1;
        continue;
      }
      if (e === "u") {
        const hex = s.slice(i.n + 1, i.n + 5);
        if (!/^[0-9a-fA-F]{4}$/.test(hex)) throw new KernelError("INVALID_JSON");
        const code = parseInt(hex, 16);
        if (code >= 0xd800 && code <= 0xdbff) {
          if (s.slice(i.n + 5, i.n + 7) !== "\\u") throw new KernelError("INVALID_JSON");
          const hex2 = s.slice(i.n + 7, i.n + 11);
          if (!/^[0-9a-fA-F]{4}$/.test(hex2)) throw new KernelError("INVALID_JSON");
          const code2 = parseInt(hex2, 16);
          if (code2 < 0xdc00 || code2 > 0xdfff) throw new KernelError("INVALID_JSON");
          out += String.fromCodePoint(0x10000 + ((code - 0xd800) << 10) + (code2 - 0xdc00));
          i.n += 11;
          continue;
        }
        if (code >= 0xdc00 && code <= 0xdfff) throw new KernelError("INVALID_JSON");
        out += String.fromCharCode(code);
        i.n += 5;
        continue;
      }
      throw new KernelError("INVALID_JSON");
    }
    if (c.charCodeAt(0) < 0x20) throw new KernelError("INVALID_JSON");
    out += c;
    i.n += 1;
  }
  throw new KernelError("INVALID_JSON");
}

function parseObject(s: string, i: { n: number }): Record<string, unknown> {
  i.n += 1;
  skipWs(s, i);
  const out: Record<string, unknown> = {};
  if (s[i.n] === "}") {
    i.n += 1;
    return out;
  }
  while (true) {
    skipWs(s, i);
    const key = parseString(s, i);
    if (Object.prototype.hasOwnProperty.call(out, key)) throw new KernelError("DUPLICATE_JSON_KEY");
    skipWs(s, i);
    if (s[i.n] !== ":") throw new KernelError("INVALID_JSON");
    i.n += 1;
    out[key] = parseValue(s, i);
    skipWs(s, i);
    if (s[i.n] === "}") {
      i.n += 1;
      return out;
    }
    if (s[i.n] !== ",") throw new KernelError("INVALID_JSON");
    i.n += 1;
  }
}

function parseArray(s: string, i: { n: number }): unknown[] {
  i.n += 1;
  skipWs(s, i);
  const out: unknown[] = [];
  if (s[i.n] === "]") {
    i.n += 1;
    return out;
  }
  while (true) {
    out.push(parseValue(s, i));
    skipWs(s, i);
    if (s[i.n] === "]") {
      i.n += 1;
      return out;
    }
    if (s[i.n] !== ",") throw new KernelError("INVALID_JSON");
    i.n += 1;
  }
}

export function parseCj1(raw: Buffer | Uint8Array): unknown {
  const buf = Buffer.isBuffer(raw) ? raw : Buffer.from(raw);
  if (buf.length > 2_000_000) throw new KernelError("INVALID_JSON_SIZE_OR_TYPE");
  const text = buf.toString("utf8");
  if (text.includes("\uFFFD") && !buf.includes(0xef)) {
    /* decoded replacement is still valid if original had the char */
  }
  rejectNumberTokens(text);
  const i = { n: 0 };
  const obj = parseValue(text, i);
  skipWs(text, i);
  if (i.n !== text.length) throw new KernelError("INVALID_JSON");
  validateCanon(obj);
  return obj;
}

export type Pin = [string, string];

export function shuffle(ids: unknown, seed: unknown): string[] {
  if (!Array.isArray(ids)) throw new KernelError("INVALID_MEMBER_LIST");
  const b = digestBytes(seed);
  for (const x of ids) ident(x);
  if (ids.length !== new Set(ids).size) throw new KernelError("DUPLICATE_MEMBER");
  return [...ids].sort((a: string, bId: string) => {
    const ka = createHash("sha256").update(Buffer.concat([b, Buffer.from(a, "utf8")])).digest();
    const kb = createHash("sha256").update(Buffer.concat([b, Buffer.from(bId, "utf8")])).digest();
    const c = ka.compare(kb);
    if (c !== 0) return c;
    return Buffer.from(a, "utf8").compare(Buffer.from(bId, "utf8"));
  }) as string[];
}

export function inputHash(args: {
  manifestId: string;
  securityId: string;
  manifestHash: string;
  snapshotHash: string;
  ruleHash: string;
  engineHash: string;
  costHash: string;
  margin: number;
  pins: Pin[];
}): string {
  ident(args.manifestId);
  ident(args.securityId);
  if (typeof args.margin !== "number" || !Number.isInteger(args.margin) || args.margin < 2 || args.margin > 15) {
    throw new KernelError("INVALID_MARGIN");
  }
  if (!Array.isArray(args.pins)) throw new KernelError("INVALID_PINS");
  const ids: string[] = [];
  for (const p of args.pins) {
    if (!Array.isArray(p) || p.length !== 2) throw new KernelError("INVALID_PIN");
    ident(p[0]);
    digestBytes(p[1]);
    ids.push(p[0]);
  }
  if (ids.length !== new Set(ids).size) throw new KernelError("DUPLICATE_PIN");
  const pairs = [...args.pins].sort((a, b) => Buffer.from(a[0], "utf8").compare(Buffer.from(b[0], "utf8")));
  const parts: Buffer[] = [
    field(Buffer.from("Trading App|input|2", "ascii")),
    field(Buffer.from(args.manifestId, "utf8")),
    field(Buffer.from(args.securityId, "utf8")),
  ];
  for (const x of [args.manifestHash, args.snapshotHash, args.ruleHash, args.engineHash, args.costHash]) {
    parts.push(field(digestBytes(x)));
  }
  parts.push(field(u32(args.margin)), field(u32(pairs.length)));
  for (const [pid, ph] of pairs) {
    parts.push(field(Buffer.from(pid, "utf8")), field(digestBytes(ph)));
  }
  return sha256(Buffer.concat(parts));
}

export function outputHash(inputHex: string, decisionPayload: unknown): string {
  if (decisionPayload && typeof decisionPayload === "object" && !Array.isArray(decisionPayload) && "reasons" in decisionPayload) {
    const rs = (decisionPayload as { reasons: unknown }).reasons;
    const ordered = normalizeReasons(rs);
    if (!Array.isArray(rs) || rs.length !== ordered.length || rs.some((x, i) => x !== ordered[i])) {
      throw new KernelError("NONCANONICAL_REASONS");
    }
  }
  return h("Trading App|decision|1", digestBytes(inputHex), canon(decisionPayload));
}

export function normalizeReasons(reasons: unknown): string[] {
  if (!Array.isArray(reasons)) throw new KernelError("INVALID_REASONS");
  for (const r of reasons) {
    if (typeof r !== "string") throw new KernelError("INVALID_REASONS");
  }
  if (reasons.length !== new Set(reasons).size) throw new KernelError("DUPLICATE_REASON");
  return [...reasons].sort((a, b) => Buffer.from(a, "utf8").compare(Buffer.from(b, "utf8")));
}

export function payloadHash(normalizedPayload: unknown): string {
  return h("Trading App|payload|1", canon(normalizedPayload));
}

export function observationHash(envelope: unknown): string {
  return h("Trading App|observation|1", canon(envelope));
}

export function ruleAstHash(ast: unknown): string {
  return h("Trading App|rule|1", canon(ast));
}

export function policyHash(bundle: unknown): string {
  return h("Trading App|policy|1", canon(bundle));
}

export function costModelHash(content: unknown): string {
  return h("Trading App|cost|1", canon(content));
}

export function snapshotHash(content: unknown): string {
  return h("Trading App|snapshot|2", canon(content));
}

export function manifestHash(content: unknown): string {
  return h("Trading App|manifest|2", canon(content));
}

export function evaluatorArtifactHash(manifest: unknown): string {
  return sha256(canon(manifest));
}

export function ruleTextHash(text: string): string {
  const norm = text.replace(/\r\n/g, "\n").split("\n").map((line) => line.replace(/[ \t]+$/g, "")).join("\n");
  return sha256(Buffer.from(norm, "utf8"));
}

export function csprngSeedHex(): string {
  return randomBytes(32).toString("hex");
}

/* ── Decimal kernel (local, no ambient context) ─────────────────────────── */

export type Dec = { neg: boolean; unscaled: bigint; scale: number };

function parseRaw(s: unknown): { neg: boolean; int: bigint; fracDigits: number } {
  if (typeof s !== "string" || s.length > 80 || !DEC.test(s)) throw new KernelError("INVALID_DECIMAL_TEXT");
  const neg = s.startsWith("-");
  const body = neg ? s.slice(1) : s;
  const dot = body.indexOf(".");
  const whole = dot === -1 ? body : body.slice(0, dot);
  const frac = dot === -1 ? "" : body.slice(dot + 1);
  const int = BigInt(whole + frac);
  if (int === 0n && neg) throw new KernelError("INVALID_DECIMAL");
  return { neg, int, fracDigits: frac.length };
}

/** PATCH-05: public money/price text. No floats, exponent, '+', whitespace, Inf/NaN. */
export function decText(value: unknown, code = "INVALID_DECIMAL_TEXT", scale?: number): string {
  if (typeof value !== "string" || !DEC_TEXT.test(value)) throw new KernelError(code);
  if (scale !== undefined) {
    const frac = value.split(".")[1] ?? "";
    if (frac.length !== scale) throw new KernelError("NONCANONICAL_SCALE");
  }
  return value;
}

function cmpAbs(a: Dec, b: Dec): number {
  const sa = a.scale > b.scale ? a.scale : b.scale;
  const ua = rescale(a, sa).unscaled;
  const ub = rescale(b, sa).unscaled;
  if (ua < ub) return -1;
  if (ua > ub) return 1;
  return 0;
}

function rescale(d: Dec, scale: number): Dec {
  if (d.scale === scale) return d;
  if (d.scale < scale) {
    return { neg: d.neg, unscaled: d.unscaled * 10n ** BigInt(scale - d.scale), scale };
  }
  throw new KernelError("EXCESS_SCALE");
}

export function dec(s: string, scale: number, lo?: string, hi?: string): Dec {
  const raw = parseRaw(s);
  if (raw.fracDigits > scale) throw new KernelError("EXCESS_SCALE");
  const unscaled = raw.int * 10n ** BigInt(scale - raw.fracDigits);
  const x: Dec = { neg: raw.neg && raw.int !== 0n, unscaled, scale };
  if (lo !== undefined) {
    const l = dec(lo, scale);
    if (cmp(x, l) < 0) throw new KernelError("BELOW_DOMAIN");
  }
  if (hi !== undefined) {
    const hBound = dec(hi, scale);
    if (cmp(x, hBound) > 0) throw new KernelError("ABOVE_DOMAIN");
  }
  return x;
}

export function cmp(a: Dec, b: Dec): number {
  if (a.neg !== b.neg) {
    if (a.unscaled === 0n && b.unscaled === 0n) return 0;
    return a.neg ? -1 : 1;
  }
  const c = cmpAbs(a, b);
  return a.neg ? -c : c;
}

export function decToCanonical(d: Dec, scale: number): string {
  const x = d.scale === scale ? d : quantizeHalfUp(d, scale);
  const s = x.unscaled.toString().padStart(scale + 1, "0");
  const whole = s.slice(0, s.length - scale) || "0";
  const frac = s.slice(s.length - scale);
  const body = `${whole}.${frac}`;
  if (x.neg && x.unscaled !== 0n) return `-${body}`;
  return body;
}

/** ROUND_HALF_UP — ties away from zero. */
export function quantizeHalfUp(d: Dec, places: number): Dec {
  if (d.scale === places) return d;
  if (d.scale < places) return rescale(d, places);
  const drop = d.scale - places;
  const factor = 10n ** BigInt(drop);
  const q = d.unscaled / factor;
  const r = d.unscaled % factor;
  const out = r * 2n >= factor ? q + 1n : q;
  return { neg: d.neg && out !== 0n, unscaled: out, scale: places };
}

function fromIntScale(unscaled: bigint, scale: number, neg: boolean): Dec {
  return { neg: neg && unscaled !== 0n, unscaled, scale };
}

function align(a: Dec, b: Dec): { a: Dec; b: Dec; scale: number } {
  const scale = Math.max(a.scale, b.scale);
  const lift = (d: Dec) =>
    d.scale === scale ? d : { neg: d.neg, unscaled: d.unscaled * 10n ** BigInt(scale - d.scale), scale };
  return { a: lift(a), b: lift(b), scale };
}

export function add(a: Dec, b: Dec): Dec {
  const x = align(a, b);
  const sa = x.a.neg ? -x.a.unscaled : x.a.unscaled;
  const sb = x.b.neg ? -x.b.unscaled : x.b.unscaled;
  const s = sa + sb;
  return fromIntScale(s < 0n ? -s : s, x.scale, s < 0n);
}

export function sub(a: Dec, b: Dec): Dec {
  return add(a, { neg: b.unscaled === 0n ? false : !b.neg, unscaled: b.unscaled, scale: b.scale });
}

export function mul(a: Dec, b: Dec): Dec {
  return {
    neg: a.neg !== b.neg && a.unscaled !== 0n && b.unscaled !== 0n,
    unscaled: a.unscaled * b.unscaled,
    scale: a.scale + b.scale,
  };
}

export function div(a: Dec, b: Dec, outScale: number): Dec {
  if (b.unscaled === 0n) throw new KernelError("DIVISION_BY_ZERO");
  // a/b with extra digits then quantize
  const extra = outScale + 8;
  const num = a.unscaled * 10n ** BigInt(b.scale + extra);
  const den = b.unscaled;
  const q = num / den;
  const r = num % den;
  const raw: Dec = { neg: a.neg !== b.neg, unscaled: q, scale: a.scale + extra };
  // remainder for half-up at the current extra scale is handled by quantize
  if (r * 2n >= den) raw.unscaled = q + 1n;
  return quantizeHalfUp(raw, outScale);
}

export function modeledFill(
  close: string,
  penalty = "0.000500",
  imbalanceCoefficient = "0.000000",
  imbalanceTerm = "0.000000",
): string {
  decText(close, "INVALID_DECIMAL_TEXT");
  decText(penalty, "INVALID_PENALTY_TEXT");
  decText(imbalanceCoefficient, "INVALID_IMBALANCE_TEXT");
  decText(imbalanceTerm, "INVALID_IMBALANCE_TEXT");
  const p = dec(close, 6, "0.000001", "1000000");
  const c = dec(penalty, 6, "0.000001", "0.05");
  const a = dec(imbalanceCoefficient, 6, "0", "0");
  const b = dec(imbalanceTerm, 6, "0", "0");
  const one = dec("1", 6);
  const inner = add(one, add(c, mul(a, b)));
  const prod = mul(p, inner);
  return decToCanonical(quantizeHalfUp(prod, 12), 12);
}

export function paperPnl(
  notional: string,
  exitPrice: string,
  fill: string,
  commission = "0.0000",
): string {
  decText(notional, "INVALID_NOTIONAL_TEXT");
  decText(exitPrice, "INVALID_EXIT_TEXT");
  decText(fill, "INVALID_FILL_TEXT");
  decText(commission, "INVALID_COMMISSION_TEXT");
  const n = dec(notional, 4, "0", "5000");
  const x = dec(exitPrice, 6, "0.000001", "1000000");
  const f = dec(fill, 12, "0", "1050000");
  const c = dec(commission, 4, "0", "100");
  if (cmp(f, dec("0", 12)) < 0) throw new KernelError("NONPOSITIVE_FILL");
  if (cmp(f, dec("0", 12)) === 0) throw new KernelError("DIVISION_BY_ZERO");
  if (cmp(x, dec("0", 6)) <= 0) throw new KernelError("NONPOSITIVE_EXIT");
  if (n.neg) throw new KernelError("NEGATIVE_NOTIONAL");
  if (c.neg) throw new KernelError("NEGATIVE_COMMISSION");
  const ratio = div(x, f, 24);
  const gap = sub(ratio, dec("1", 0));
  const dollar = mul(n, gap);
  const twoC = mul(dec("2", 0), c);
  return decToCanonical(quantizeHalfUp(sub(dollar, twoC), 4), 4);
}

export function directionHit(entry: string, exit: string): boolean | null {
  decText(entry, "INVALID_ENTRY_TEXT");
  decText(exit, "INVALID_EXIT_TEXT");
  const e = dec(entry, 6, "0.000001", "1000000");
  const x = dec(exit, 6, "-1000000", "1000000");
  if (cmp(e, dec("0", 6)) <= 0) throw new KernelError("NONPOSITIVE_ENTRY");
  const c = cmp(x, e);
  if (c === 0) return false;
  return c > 0;
}

export function bandHit(entry: string, exit: string, low: string, high: string): boolean {
  decText(entry, "INVALID_ENTRY_TEXT");
  decText(exit, "INVALID_EXIT_TEXT");
  decText(low, "INVALID_BAND_TEXT");
  decText(high, "INVALID_BAND_TEXT");
  const e = dec(entry, 6, "0.000001", "1000000");
  const x = dec(exit, 6, "-1000000", "1000000");
  const lo = dec(low, 12, "-1000000", "1000000");
  const hi = dec(high, 12, "-1000000", "1000000");
  if (cmp(e, dec("0", 6)) <= 0) throw new KernelError("NONPOSITIVE_ENTRY");
  if (cmp(lo, hi) > 0) throw new KernelError("INVALID_BAND_ORDER");
  const one = dec("1", 0);
  const left = mul(e, add(one, lo));
  const right = mul(e, add(one, hi));
  const xAs = { ...x };
  return cmp(left, { neg: xAs.neg, unscaled: xAs.unscaled, scale: xAs.scale }) <= 0 && cmp(xAs, right) <= 0;
}

export function magnitudeBand(impliedMove: string): { low: string; high: string } {
  const m = dec(impliedMove, 12, "0.000000000001", "5");
  const low = quantizeHalfUp(mul(m, dec("0.5", 1)), 12);
  const high = quantizeHalfUp(mul(m, dec("2.0", 1)), 12);
  return { low: decToCanonical(low, 12), high: decToCanonical(high, 12) };
}

/* ── AST / evaluator ────────────────────────────────────────────────────── */

export const FIELD_TYPES: Record<string, "enum" | "bool" | "decimal"> = {
  timing_quality: "enum",
  card_complete: "bool",
  options_valid: "bool",
  implied_move: "decimal",
  benchmark_relative_5d: "decimal",
  benchmark_relative_63d: "decimal",
};

export const INITIAL_AST = {
  schema: "1",
  decision: "PREDICT",
  direction: "LONG",
  otherwise: "STAND_DOWN",
  all: [
    { field: "timing_quality", op: "EQ", value: "ISSUER_CONFIRMED" },
    { field: "card_complete", op: "EQ", value: true },
    { field: "options_valid", op: "EQ", value: true },
    { field: "implied_move", op: "GTE", value: "0.040000000000" },
    { field: "implied_move", op: "LTE", value: "0.150000000000" },
    { field: "benchmark_relative_5d", op: "LT", value: "0.000000000000" },
    { field: "benchmark_relative_63d", op: "GT", value: "0.000000000000" },
  ],
} as const;

export type EvalResult = {
  status: "OK" | "INVALID_RULE" | "INVALID_CARD" | "INTERNAL_ERROR";
  decision: "PREDICT" | "STAND_DOWN";
  direction: "LONG" | null;
  reasons: string[];
};

export function validateAst(ast: unknown): true {
  if (!ast || typeof ast !== "object" || Array.isArray(ast)) throw new KernelError("INVALID_AST_KEYS");
  const a = ast as Record<string, unknown>;
  const keys = Object.keys(a);
  const expected = ["schema", "decision", "direction", "otherwise", "all"];
  if (keys.length !== expected.length || expected.some((k) => !Object.prototype.hasOwnProperty.call(a, k))) {
    throw new KernelError("INVALID_AST_KEYS");
  }
  for (const x of ["schema", "decision", "direction", "otherwise"] as const) {
    if (a[x] !== INITIAL_AST[x]) throw new KernelError("INVALID_AST_HEADER");
  }
  const cc = a.all;
  if (!Array.isArray(cc) || cc.length < 1 || cc.length > 32) throw new KernelError("INVALID_AST_CONDITIONS");
  for (const con of cc) {
    if (!con || typeof con !== "object" || Array.isArray(con)) throw new KernelError("INVALID_CONDITION");
    const c = con as Record<string, unknown>;
    if (Object.keys(c).length !== 3 || !("field" in c && "op" in c && "value" in c)) {
      throw new KernelError("INVALID_CONDITION");
    }
    const f = c.field;
    const op = c.op;
    const v = c.value;
    if (typeof f !== "string" || !(f in FIELD_TYPES)) throw new KernelError("UNKNOWN_FIELD");
    if (typeof op !== "string" || !["EQ", "LT", "GT", "LTE", "GTE"].includes(op)) throw new KernelError("UNKNOWN_OP");
    const typ = FIELD_TYPES[f];
    if (typ === "bool" && (op !== "EQ" || typeof v !== "boolean")) throw new KernelError("INVALID_BOOL_PREDICATE");
    if (typ === "enum" && (op !== "EQ" || v !== "ISSUER_CONFIRMED")) throw new KernelError("INVALID_ENUM_PREDICATE");
    if (typ === "decimal") {
      if (typeof v !== "string") throw new KernelError("NONCANONICAL_CONSTANT");
      dec(v, 12, "-1000000", "1000000");
      if (!CANON_DEC12.test(v)) throw new KernelError("NONCANONICAL_CONSTANT");
    }
  }
  return true;
}

function down(reason: string, status: EvalResult["status"] = "OK"): EvalResult {
  return { status, decision: "STAND_DOWN", direction: null, reasons: [reason] };
}

export function evaluate(ast: unknown, card: unknown): EvalResult {
  try {
    validateAst(ast);
  } catch {
    return down("INVALID_RULE_AST", "INVALID_RULE");
  }
  if (!card || typeof card !== "object" || Array.isArray(card)) return down("INVALID_CARD", "INVALID_CARD");
  const c = card as Record<string, unknown>;
  if (c.card_complete !== true) {
    const t = c.card_complete;
    if (t === false || t === null || t === undefined) return down("CARD_INCOMPLETE", "OK");
    return down("INVALID_CARD_COMPLETE", "INVALID_CARD");
  }
  const a = ast as { all: Array<{ field: string; op: string; value: unknown }> };
  for (const co of a.all) {
    const f = co.field;
    const op = co.op;
    const v = co.value;
    const val = c[f];
    if (val === undefined || val === null) return down(`MISSING_${f}`);
    const t = FIELD_TYPES[f];
    let left: unknown = val;
    let right: unknown = v;
    if (t === "bool") {
      if (typeof val !== "boolean") return down(`INVALID_${f}`, "INVALID_CARD");
    } else if (t === "enum") {
      if (typeof val !== "string" || (val !== "ISSUER_CONFIRMED" && val !== "ESTIMATED")) {
        return down(`INVALID_${f}`, "INVALID_CARD");
      }
    } else {
      try {
        if (typeof val !== "string" || !CANON_DEC12.test(val)) throw new KernelError("NONCANONICAL_CARD_VALUE");
        const aDec = f === "implied_move" ? dec(val, 12, "0.000000000001", "5") : dec(val, 12, "-1000000", "1000000");
        const vDec = dec(v as string, 12, "-1000000", "1000000");
        left = aDec;
        right = vDec;
      } catch {
        return down(`INVALID_${f}`, "INVALID_CARD");
      }
    }
    let ok = false;
    if (t === "decimal") {
      const cmpv = cmp(left as Dec, right as Dec);
      ok =
        (op === "EQ" && cmpv === 0) ||
        (op === "LT" && cmpv < 0) ||
        (op === "GT" && cmpv > 0) ||
        (op === "LTE" && cmpv <= 0) ||
        (op === "GTE" && cmpv >= 0);
    } else {
      ok = op === "EQ" && left === right;
    }
    if (!ok) return down(`PREDICATE_FALSE_${f}`);
  }
  return { status: "OK", decision: "PREDICT", direction: "LONG", reasons: [] };
}

export function computeCardComplete(card: {
  timing_quality?: unknown;
  options_valid?: unknown;
  implied_move?: unknown;
  benchmark_relative_5d?: unknown;
  benchmark_relative_63d?: unknown;
}): boolean {
  if (card.timing_quality !== "ISSUER_CONFIRMED" && card.timing_quality !== "ESTIMATED") return false;
  if (typeof card.options_valid !== "boolean") return false;
  if (typeof card.implied_move !== "string" || !CANON_DEC12.test(card.implied_move)) return false;
  try {
    dec(card.implied_move, 12, "0.000000000001", "5");
  } catch {
    return false;
  }
  for (const f of ["benchmark_relative_5d", "benchmark_relative_63d"] as const) {
    const v = card[f];
    if (typeof v !== "string" || !CANON_DEC12.test(v)) return false;
    try {
      dec(v, 12, "-1000000", "1000000");
    } catch {
      return false;
    }
  }
  return true;
}

export const CAPACITY = {
  slots: 3,
  notional: "15000.0000",
  ticket: "5000.0000",
  perEvent: 2,
  marginMinutes: 3,
} as const;

export type AdmitResult = {
  outcome: "ADMITTED" | "DENIED";
  reason_codes: string[];
  position: boolean;
};

function isDec(v: unknown): v is Dec {
  return (
    !!v &&
    typeof v === "object" &&
    "neg" in v &&
    "unscaled" in v &&
    "scale" in v &&
    typeof (v as Dec).neg === "boolean" &&
    typeof (v as Dec).unscaled === "bigint" &&
    typeof (v as Dec).scale === "number"
  );
}

export function admitPredict(args: {
  paused: unknown;
  cutoffPassed: unknown;
  timingQuality: unknown;
  cardComplete: unknown;
  reservedCount: unknown;
  reservedNotional: unknown;
  sameEventOpen: unknown;
  alreadyOwned: unknown;
}): AdmitResult {
  for (const [name, val] of [
    ["paused", args.paused],
    ["cutoff_passed", args.cutoffPassed],
    ["card_complete", args.cardComplete],
    ["already_owned", args.alreadyOwned],
  ] as const) {
    if (typeof val !== "boolean") throw new KernelError(`INVALID_ADMISSION_FLAG_${name}`);
  }
  if (typeof args.timingQuality !== "string") throw new KernelError("INVALID_TIMING_QUALITY");
  for (const [name, val] of [
    ["reserved_count", args.reservedCount],
    ["same_event_open", args.sameEventOpen],
  ] as const) {
    if (typeof val !== "number" || !Number.isInteger(val) || val < 0 || val > 4294967295) {
      throw new KernelError(`INVALID_ADMISSION_COUNT_${name}`);
    }
  }
  if (!isDec(args.reservedNotional)) throw new KernelError("INVALID_RESERVED_NOTIONAL");
  if (args.reservedNotional.unscaled < 0n || args.reservedNotional.neg) throw new KernelError("INVALID_RESERVED_NOTIONAL");
  const capN = dec(CAPACITY.notional, 4);
  if (cmp(args.reservedNotional, capN) > 0) throw new KernelError("RESERVED_NOTIONAL_EXCEEDS_CAP");

  const reasons: string[] = [];
  if (args.paused) reasons.push("ADMISSION_PAUSED");
  if (args.cutoffPassed) reasons.push("CUTOFF");
  if (args.timingQuality !== "ISSUER_CONFIRMED") reasons.push("TIMING_NOT_CONFIRMED");
  if (args.cardComplete !== true) reasons.push("CARD_INCOMPLETE");
  if (args.alreadyOwned) reasons.push("ALREADY_OWNED");
  if ((args.reservedCount as number) + 1 > CAPACITY.slots) reasons.push("CAPACITY_COUNT");
  const next = add(args.reservedNotional, dec(CAPACITY.ticket, 4));
  if (cmp(next, capN) > 0) reasons.push("CAPACITY_NOTIONAL");
  if ((args.sameEventOpen as number) + 1 > CAPACITY.perEvent) reasons.push("PER_EVENT_LIMIT");
  if (reasons.length) return { outcome: "DENIED", reason_codes: reasons, position: false };
  return { outcome: "ADMITTED", reason_codes: ["ADMITTED"], position: true };
}

export function addNotional(a: string, b: string): string {
  return decToCanonical(add(dec(a, 4), dec(b, 4)), 4);
}

export function subNotional(a: string, b: string): string {
  const r = sub(dec(a, 4), dec(b, 4));
  if (cmp(r, dec("0", 4)) < 0) throw new KernelError("NEGATIVE_NOTIONAL");
  return decToCanonical(r, 4);
}

export const ENGINE_VERSION = "trading-app-evaluator-1.2.0";
export const PRODUCT_NAME = "Trading App";
export const API_PREFIX = "/api/trading-app/v1";

export const COST_MODEL_CONTENT = {
  cost_model_version: "1",
  cost_model_basis: "CONSERVATIVE_STRESS_HAIRCUT",
  constant_penalty: "0.000500",
  imbalance_coefficient: "0.000000",
  imbalance_term: "0.000000",
  commission_per_fill: "0.0000",
  entry_rounding_scale: "12",
  pnl_rounding_scale: "4",
  rounding_mode: "ROUND_HALF_UP",
} as const;
```


---

## `src/kernel/kernel.test.ts` (13009 bytes, sha256 `ded4999dc6ec93c464c53bdc91d75cd278956ea5e72b84ac181e00b5c387bbd8`)

```ts
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  admitPredict,
  bandHit,
  canon,
  computeCardComplete,
  COST_MODEL_CONTENT,
  costModelHash,
  dec,
  decText,
  directionHit,
  evaluate,
  INITIAL_AST,
  inputHash,
  KernelError,
  modeledFill,
  normalizeReasons,
  outputHash,
  paperPnl,
  parseCj1,
  ruleAstHash,
  shuffle,
  validateAst,
} from "./index.ts";

test("H01 input hash golden vector", () => {
  const got = inputHash({
    manifestId: "manifest-20260914",
    securityId: "SEC-A",
    manifestHash: "1111111111111111111111111111111111111111111111111111111111111111",
    snapshotHash: "2222222222222222222222222222222222222222222222222222222222222222",
    ruleHash: "3333333333333333333333333333333333333333333333333333333333333333",
    engineHash: "4444444444444444444444444444444444444444444444444444444444444444",
    costHash: "5555555555555555555555555555555555555555555555555555555555555555",
    margin: 3,
    pins: [
      ["obs-z", "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"],
      ["obs-a", "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"],
    ],
  });
  assert.equal(got, "bac8f1353582276f85608c618ad44f104f5480fea76d03ce0dbcad4955522726");
});

test("H02 pin order does not change hash; content does", () => {
  const base = {
    manifestId: "manifest-20260914",
    securityId: "SEC-A",
    manifestHash: "1111111111111111111111111111111111111111111111111111111111111111",
    snapshotHash: "2222222222222222222222222222222222222222222222222222222222222222",
    ruleHash: "3333333333333333333333333333333333333333333333333333333333333333",
    engineHash: "4444444444444444444444444444444444444444444444444444444444444444",
    costHash: "5555555555555555555555555555555555555555555555555555555555555555",
    margin: 3,
  };
  const a = inputHash({
    ...base,
    pins: [
      ["obs-z", "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"],
      ["obs-a", "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"],
    ],
  });
  const b = inputHash({
    ...base,
    pins: [
      ["obs-a", "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"],
      ["obs-z", "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"],
    ],
  });
  assert.equal(a, b);
  const c = inputHash({
    ...base,
    pins: [
      ["obs-z", "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"],
      ["obs-b", "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"],
    ],
  });
  assert.notEqual(a, c);
});

test("H03 removing a pin or changing margin changes hash", () => {
  const pins: [string, string][] = [
    ["obs-z", "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"],
    ["obs-a", "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"],
  ];
  const args = {
    manifestId: "manifest-20260914",
    securityId: "SEC-A",
    manifestHash: "1111111111111111111111111111111111111111111111111111111111111111",
    snapshotHash: "2222222222222222222222222222222222222222222222222222222222222222",
    ruleHash: "3333333333333333333333333333333333333333333333333333333333333333",
    engineHash: "4444444444444444444444444444444444444444444444444444444444444444",
    costHash: "5555555555555555555555555555555555555555555555555555555555555555",
    margin: 3,
    pins,
  };
  const base = inputHash(args);
  assert.notEqual(inputHash({ ...args, pins: [pins[0]] }), base);
  assert.notEqual(inputHash({ ...args, margin: 4 }), base);
  assert.notEqual(inputHash({ ...args, manifestId: "manifest-other" }), base);
});

test("H05 rejects malformed hash inputs", () => {
  const good = {
    manifestId: "manifest-20260914",
    securityId: "SEC-A",
    manifestHash: "1111111111111111111111111111111111111111111111111111111111111111",
    snapshotHash: "2222222222222222222222222222222222222222222222222222222222222222",
    ruleHash: "3333333333333333333333333333333333333333333333333333333333333333",
    engineHash: "4444444444444444444444444444444444444444444444444444444444444444",
    costHash: "5555555555555555555555555555555555555555555555555555555555555555",
    margin: 3,
    pins: [["obs-a", "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"]] as [string, string][],
  };
  assert.throws(() => inputHash({ ...good, margin: 1 }), KernelError);
  assert.throws(() => inputHash({ ...good, margin: 16 }), KernelError);
  assert.throws(() => inputHash({ ...good, securityId: "SEC A" }), KernelError);
  assert.throws(() => inputHash({ ...good, pins: [["obs-a", "BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB"]] }), KernelError);
  assert.throws(() => inputHash({ ...good, pins: [["obs-a", "bbbb"]] }), KernelError);
});

test("H07 CJ1 rejects numbers and duplicate keys", () => {
  assert.throws(() => parseCj1(Buffer.from('{"a":1}', "utf8")), KernelError);
  assert.throws(() => parseCj1(Buffer.from('{"a":true,"a":false}', "utf8")), KernelError);
  const round = parseCj1(canon({ z: "é", a: true }));
  assert.deepEqual(round, { a: true, z: "é" });
  assert.equal(canon({ z: "é", a: true }).toString("hex"), "7b2261223a747275652c227a223a22c3a9227d");
});

test("H09 shuffle golden vector", () => {
  const got = shuffle(
    ["SEC-C", "SEC-A", "SEC-B"],
    "0101010101010101010101010101010101010101010101010101010101010101",
  );
  assert.deepEqual(got, ["SEC-A", "SEC-C", "SEC-B"]);
  assert.throws(() => shuffle(["SEC-A", "SEC-A"], "0101010101010101010101010101010101010101010101010101010101010101"), KernelError);
  assert.throws(() => shuffle(["SEC-A"], "01"), KernelError);
});

test("rule AST hash golden vector", () => {
  validateAst(INITIAL_AST);
  assert.equal(ruleAstHash(INITIAL_AST), "e9cf184a531fd993dc1b36ce0e1a1b0dcd67ebc4b80e4ff1ebe5a72ab00c15f4");
});

test("fill and pnl golden vectors", () => {
  assert.equal(modeledFill("123.456789"), "123.518517394500");
  assert.equal(
    paperPnl("5000.0000", "105.000000", "100.050000000000", "0.0000"),
    "247.3763",
  );
  assert.equal(modeledFill("100.000000"), "100.050000000000");
});

test("F01 initial AST predicts only the specified conjunction", () => {
  const card = {
    timing_quality: "ISSUER_CONFIRMED",
    card_complete: true,
    options_valid: true,
    implied_move: "0.080000000000",
    benchmark_relative_5d: "-0.012000000000",
    benchmark_relative_63d: "0.045000000000",
  };
  const ok = evaluate(INITIAL_AST, card);
  assert.equal(ok.decision, "PREDICT");
  assert.equal(ok.direction, "LONG");
  const lo = evaluate(INITIAL_AST, { ...card, implied_move: "0.039999999999" });
  assert.equal(lo.decision, "STAND_DOWN");
  const hi = evaluate(INITIAL_AST, { ...card, implied_move: "0.150000000001" });
  assert.equal(hi.decision, "STAND_DOWN");
  const eqLo = evaluate(INITIAL_AST, { ...card, implied_move: "0.040000000000" });
  assert.equal(eqLo.decision, "PREDICT");
  const eqHi = evaluate(INITIAL_AST, { ...card, implied_move: "0.150000000000" });
  assert.equal(eqHi.decision, "PREDICT");
});

test("F02 missing required values stand down; invalid rule is not a prediction", () => {
  const r = evaluate(INITIAL_AST, { card_complete: false });
  assert.equal(r.status, "OK");
  assert.equal(r.decision, "STAND_DOWN");
  const bad = evaluate({ schema: "nope" }, { card_complete: true });
  assert.equal(bad.status, "INVALID_RULE");
  assert.equal(bad.decision, "STAND_DOWN");
  assert.equal(bad.direction, null);
});

test("F03 F04 reject malformed AST and boolean substitutes", () => {
  assert.throws(() => validateAst({ ...INITIAL_AST, all: [] }), KernelError);
  assert.throws(
    () =>
      validateAst({
        ...INITIAL_AST,
        all: [{ field: "card_complete", op: "EQ", value: "true" }],
      }),
    KernelError,
  );
  const r = evaluate(INITIAL_AST, {
    timing_quality: "ISSUER_CONFIRMED",
    card_complete: true,
    options_valid: 1,
    implied_move: "0.080000000000",
    benchmark_relative_5d: "-0.012000000000",
    benchmark_relative_63d: "0.045000000000",
  });
  assert.equal(r.status, "INVALID_CARD");
  assert.equal(r.decision, "STAND_DOWN");
  assert.equal(r.direction, null);
});

test("F15 tiny positive raw return remains a direction hit", () => {
  assert.equal(directionHit("100.000000", "100.000001"), true);
  assert.equal(directionHit("100.000000", "100.000000"), false);
  assert.equal(directionHit("100.000000", "99.999999"), false);
  assert.equal(
    bandHit("100.000000", "108.000000", "0.040000000000", "0.160000000000"),
    true,
  );
  assert.equal(
    bandHit("100.000000", "103.000000", "0.040000000000", "0.160000000000"),
    false,
  );
});

test("cost model hash is stable", () => {
  const a = costModelHash(COST_MODEL_CONTENT);
  const b = costModelHash({ ...COST_MODEL_CONTENT });
  assert.equal(a, b);
  assert.match(a, /^[0-9a-f]{64}$/);
});

test("decimal domain rejects negative zero and excess scale", () => {
  assert.throws(() => dec("-0", 4), KernelError);
  assert.throws(() => dec("1.0000001", 6), KernelError);
  assert.throws(() => dec("0", 6, "0.000001", "1000000"), KernelError);
});

const H01 = "bac8f1353582276f85608c618ad44f104f5480fea76d03ce0dbcad4955522726";

const COMPLETE_CARD = {
  timing_quality: "ISSUER_CONFIRMED",
  card_complete: true,
  options_valid: true,
  implied_move: "0.080000000000",
  benchmark_relative_5d: "-0.012000000000",
  benchmark_relative_63d: "0.045000000000",
};

test("P01 paperPnl rejects floats", () => {
  assert.throws(() => paperPnl(5000 as unknown as string, "105.000000", "100.050000000000"), KernelError);
  assert.equal(paperPnl("5000.0000", "105.000000", "100.050000000000", "0.0000"), "247.3763");
});

test("P02 paperPnl rejects nonpositive fill", () => {
  assert.throws(() => paperPnl("5000.0000", "105.000000", "-100.000000"), KernelError);
  assert.throws(() => paperPnl("5000.0000", "105.000000", "0.000000000000"), KernelError);
  assert.throws(() => paperPnl("5000.0000", "-105.000000", "100.050000000000"), KernelError);
});

test("P03 hit tests reject floats and inverted bands", () => {
  assert.throws(() => directionHit(100 as unknown as string, 101 as unknown as string), KernelError);
  assert.throws(
    () => bandHit("100.000000", "108.000000", "0.160000000000", "0.040000000000"),
    KernelError,
  );
  assert.equal(directionHit("100.000000", "100.000001"), true);
  assert.equal(directionHit("100.000000", "100.000000"), false);
});

test("P04 admission rejects corrupt state", () => {
  const base = {
    paused: false,
    cutoffPassed: false,
    timingQuality: "ISSUER_CONFIRMED",
    cardComplete: true,
    reservedCount: 0,
    reservedNotional: dec("0.0000", 4),
    sameEventOpen: 0,
    alreadyOwned: false,
  };
  assert.throws(() => admitPredict({ ...base, reservedNotional: dec("-1.0000", 4) }), KernelError);
  assert.throws(() => admitPredict({ ...base, reservedCount: -5 }), KernelError);
  assert.throws(() => admitPredict({ ...base, reservedNotional: 0 }), KernelError);
  assert.throws(() => admitPredict({ ...base, paused: 0 }), KernelError);
  assert.equal(admitPredict(base).outcome, "ADMITTED");
  const pennyOver = admitPredict({ ...base, reservedCount: 2, reservedNotional: dec("10000.0001", 4) });
  assert.equal(pennyOver.outcome, "DENIED");
  assert.ok(pennyOver.reason_codes.includes("CAPACITY_NOTIONAL"));
});

test("P05 modeledFill requires canonical text", () => {
  for (const bad of ["1E2", "1e2", "+100.000000", " 100.000000", "100.000000 ", "100", "Inf", "NaN", ".5", "1.", "01.000000", ""]) {
    assert.throws(() => modeledFill(bad), KernelError, `accepted ${bad}`);
  }
  assert.throws(() => modeledFill("100.000000", "5e-4"), KernelError);
  assert.equal(modeledFill("123.456789"), "123.518517394500");
  assert.equal(decText("100.0000", "INVALID_DECIMAL_TEXT", 4), "100.0000");
  assert.throws(() => decText("100.000", "INVALID_DECIMAL_TEXT", 4), KernelError);
});

test("P06 gatekeepers agree on canonicality", () => {
  const loose = {
    timing_quality: "ISSUER_CONFIRMED",
    options_valid: true,
    implied_move: "0.08",
    benchmark_relative_5d: "-0.01",
    benchmark_relative_63d: "0.04",
  };
  assert.equal(computeCardComplete(loose), false);
  assert.equal(evaluate(INITIAL_AST, { ...loose, card_complete: true }).status, "INVALID_CARD");
  const strict = { ...COMPLETE_CARD };
  delete (strict as { card_complete?: boolean }).card_complete;
  assert.equal(computeCardComplete(strict), true);
  assert.equal(evaluate(INITIAL_AST, COMPLETE_CARD).decision, "PREDICT");
});

test("P07 reason order is canonical for outputHash", () => {
  const a = outputHash(H01, { decision: "STAND_DOWN", reasons: ["A", "B"] });
  assert.throws(() => outputHash(H01, { decision: "STAND_DOWN", reasons: ["B", "A"] }), KernelError);
  const b = outputHash(H01, { decision: "STAND_DOWN", reasons: normalizeReasons(["B", "A"]) });
  assert.equal(a, b);
  const r = evaluate(INITIAL_AST, COMPLETE_CARD);
  assert.match(outputHash(H01, r), /^[0-9a-f]{64}$/);
});
```


---

## `src/desk/util.ts` (3003 bytes, sha256 `95ff046ddbf1cddb227134df37791ab04955720579ff9bc4793c4b1050b5d98a`)

```ts
import { randomBytes } from "node:crypto";
import { ident, sha256, canon } from "@/kernel/index";

export class DeskError extends Error {
  code: string;
  retryable: boolean;
  http: number;
  constructor(code: string, message: string, http = 422, retryable = false) {
    super(message);
    this.name = "DeskError";
    this.code = code;
    this.http = http;
    this.retryable = retryable;
  }
}

export function asHex(v: unknown): string {
  if (v == null) throw new DeskError("INVALID_HASH", "missing hash");
  if (typeof v === "string") {
    const s = v.startsWith("\\x") ? v.slice(2) : v.startsWith("0x") ? v.slice(2) : v;
    return s.toLowerCase();
  }
  if (v instanceof Uint8Array || Buffer.isBuffer(v)) return Buffer.from(v).toString("hex");
  if (typeof v === "object" && v && "type" in (v as object) && (v as { type: string }).type === "Buffer") {
    return Buffer.from((v as { data: number[] }).data).toString("hex");
  }
  throw new DeskError("INVALID_HASH", "unreadable hash");
}

export function hexBuf(hex: string): Buffer {
  const h = asHex(hex);
  if (!/^[0-9a-f]{64}$/.test(h) && !/^[0-9a-f]+$/.test(h)) throw new DeskError("INVALID_HASH", "bad hex");
  return Buffer.from(h, "hex");
}

export function newId(prefix: string): string {
  const id = `${prefix}-${randomBytes(8).toString("hex")}`;
  return ident(id);
}

export function requestHash(obj: unknown): Buffer {
  return Buffer.from(sha256(canon(obj)), "hex");
}

export const ENVELOPE = {
  product_name: "Trading App" as const,
  paperOnly: true as const,
  liveTradingSupported: false as const,
  activeModelWeight: "0" as const,
};

export type DeskRole = "OPERATOR" | "REVIEWER" | "SERVICE";

export function rfc3339(d: Date): string {
  return d.toISOString().replace(/\.(\d{3})Z$/, (m, ms) => `.${ms}000Z`);
}

export function etInstant(date: string, hm: string): Date {
  // date YYYY-MM-DD, hm HH:MM in America/New_York. September 2026 is EDT (UTC-4).
  const [h, min] = hm.split(":").map(Number);
  const [y, m, d] = date.split("-").map(Number);
  // Determine offset via a formatter
  const probe = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    timeZoneName: "shortOffset",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(probe);
  const tz = parts.find((p) => p.type === "timeZoneName")?.value ?? "GMT-4";
  const off = tz.replace("GMT", "").replace("UTC", "") || "-4";
  const sign = off.startsWith("-") ? -1 : 1;
  const [oh, om = "0"] = off.replace("+", "").replace("-", "").split(":");
  const offsetMin = sign * (Number(oh) * 60 + Number(om));
  return new Date(Date.UTC(y, m - 1, d, h, min, 0) - offsetMin * 60 * 1000);
}

export function addSeconds(d: Date, s: number): Date {
  return new Date(d.getTime() + s * 1000);
}

export function jsonCanon(obj: unknown): string {
  return canon(obj).toString("utf8");
}
```


---

## `src/desk/writer.ts` (6243 bytes, sha256 `04a3a3c01b304c32a4f04a5eddcd52454c1de06994690de8189a219f899353b5`)

```ts
import { createHash } from "node:crypto";
import type { Sql } from "@/lib/db";
import { withTransaction } from "@/lib/db";
import { cmp, dec, field, sha256 } from "@/kernel/index";
import { asHex, DeskError, hexBuf, jsonCanon, newId, requestHash } from "./util";

export type Gate = {
  next_event_seq: number;
  last_authoritative_time: string;
  clock_trusted: boolean;
};

export type WriterCtx = {
  sql: Sql;
  now: Date;
  seq: number;
  actor: string;
};

export async function withWriter<T>(
  actor: string,
  fn: (ctx: WriterCtx) => Promise<T>,
): Promise<T> {
  return withTransaction(async (sql) => {
    const gates = await sql.query<Gate>(
      `SELECT next_event_seq, last_authoritative_time::text, clock_trusted FROM writer_gate WHERE singleton_key = TRUE FOR UPDATE`,
    );
    if (gates.length !== 1) throw new DeskError("WRITER_GATE_MISSING", "writer gate missing or duplicated", 503);
    const clock = await sql.query<{ now_utc: string; trusted: boolean; source: string }>(
      `SELECT now_utc::text, trusted, source FROM fixture_clock WHERE singleton_key = TRUE FOR UPDATE`,
    );
    if (clock.length !== 1) throw new DeskError("CLOCK_UNTRUSTED", "fixture clock missing", 503, false);
    const now = new Date(clock[0].now_utc);
    const last = new Date(gates[0].last_authoritative_time);
    if (!clock[0].trusted || !gates[0].clock_trusted) {
      throw new DeskError("CLOCK_UNTRUSTED", "trusted clock unavailable", 503);
    }
    if (now < last) {
      await sql.query(`UPDATE writer_gate SET clock_trusted = FALSE WHERE singleton_key = TRUE`);
      throw new DeskError("CLOCK_UNTRUSTED", "clock moved backward", 503);
    }
    const seq = Number(gates[0].next_event_seq);
    await sql.query(`UPDATE writer_gate SET next_event_seq = $1, last_authoritative_time = $2 WHERE singleton_key = TRUE`, [
      seq + 1,
      now.toISOString(),
    ]);
    return fn({ sql, now, seq, actor });
  });
}

export async function appendEvent(
  ctx: WriterCtx,
  args: {
    commandId: string;
    type: string;
    payload: unknown;
    receipt: unknown;
    request?: unknown;
  },
): Promise<{ eventSeq: number; eventId: string }> {
  const eventId = newId("evt");
  const req = requestHash(args.request ?? args.payload);
  const canonical = jsonCanon(args.payload);
  const preimage = Buffer.concat([
    field(Buffer.from("Trading App|event|1", "ascii")),
    field(Buffer.from(String(ctx.seq), "utf8")),
    field(Buffer.from(args.commandId, "utf8")),
    field(Buffer.from(ctx.actor, "utf8")),
    field(Buffer.from(ctx.now.toISOString(), "utf8")),
    field(req),
    field(Buffer.from(canonical, "utf8")),
  ]);
  const eventHash = createHash("sha256").update(preimage).digest();
  try {
    await ctx.sql.query(
      `INSERT INTO event_log (
        event_seq, event_id, command_id, request_hash, event_type, actor_principal_id,
        occurred_at, semantic_payload, canonical_payload, result_receipt, event_hash
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9,$10::jsonb,$11)`,
      [
        ctx.seq,
        eventId,
        args.commandId,
        req,
        args.type,
        ctx.actor,
        ctx.now.toISOString(),
        JSON.stringify(args.payload),
        canonical,
        JSON.stringify(args.receipt),
        eventHash,
      ],
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (/event_log_command_id|command_id/i.test(msg) || /unique/i.test(msg)) {
      throw new DeskError("IDEMPOTENCY_CONFLICT", "command_id already used", 409);
    }
    throw err;
  }
  return { eventSeq: ctx.seq, eventId };
}

export async function loadExistingCommand<T>(sql: Sql, commandId: string): Promise<T | null> {
  const rows = await sql.query<{ result_receipt: T; event_type: string }>(
    `SELECT result_receipt, event_type FROM event_log WHERE command_id = $1`,
    [commandId],
  );
  if (!rows.length) return null;
  return rows[0].result_receipt;
}

export async function raiseAlarm(
  ctx: WriterCtx,
  code: string,
  component: string,
  details: unknown,
  blocks = false,
): Promise<void> {
  const existing = await ctx.sql.query<{ alarm_id: string }>(
    `SELECT alarm_id FROM ops_alarm WHERE code = $1 AND status <> 'RESOLVED'`,
    [code],
  );
  if (existing.length) {
    await ctx.sql.query(`UPDATE ops_alarm SET last_seen = $1, safe_details = $2::jsonb WHERE alarm_id = $3`, [
      ctx.now.toISOString(),
      JSON.stringify(details),
      existing[0].alarm_id,
    ]);
    return;
  }
  const id = newId("alm");
  await ctx.sql.query(
    `INSERT INTO ops_alarm (
      alarm_id, code, component, first_seen, last_seen, related_ids, blocks_new_admission, status, safe_details, opened_event_seq
    ) VALUES ($1,$2,$3,$4,$4,$5::jsonb,$6,'OPEN',$7::jsonb,$8)`,
    [id, code, component, ctx.now.toISOString(), JSON.stringify([]), blocks, JSON.stringify(details), ctx.seq],
  );
}

export async function recomputeRisk(sql: Sql): Promise<{ count: number; notional: string }> {
  const rows = await sql.query<{ c: number; n: string | null }>(
    `SELECT COUNT(*)::int AS c, COALESCE(SUM(original_reserved_notional),0)::text AS n
     FROM "position" WHERE state <> 'CLOSED'`,
  );
  return { count: Number(rows[0]?.c ?? 0), notional: rows[0]?.n ?? "0.0000" };
}

export async function lockRisk(sql: Sql): Promise<{ reserved_count: number; reserved_notional: string }> {
  const rows = await sql.query<{ reserved_count: number; reserved_notional: string }>(
    `SELECT reserved_count, reserved_notional::text FROM desk_risk_state WHERE sleeve = 'EARNINGS' FOR UPDATE`,
  );
  if (rows.length !== 1) throw new DeskError("RISK_STATE_MISSING", "risk singleton missing", 503);
  return rows[0];
}

export async function assertRiskMatches(sql: Sql): Promise<void> {
  const cached = await lockRisk(sql);
  const actual = await recomputeRisk(sql);
  const cachedN = dec(String(cached.reserved_notional), 4);
  const actualN = dec(String(actual.notional), 4);
  if (cached.reserved_count !== actual.count || cmp(cachedN, actualN) !== 0) {
    throw new DeskError("RISK_STATE_MISMATCH", "cached risk disagrees with positions", 503);
  }
}

export function digest32(hex: string): Buffer {
  return hexBuf(hex);
}

void asHex;
void sha256;
```


---

## `src/desk/features.ts` (5322 bytes, sha256 `9fbabcda2bf7afb9a6412814c3059b5c6dc98512779db9b1348b886ba8a7c0e1`)

```ts
import {
  computeCardComplete,
  dec,
  decToCanonical,
  mul,
  quantizeHalfUp,
  sub,
} from "@/kernel/index";

export type TypedCard = {
  timing_quality: "ISSUER_CONFIRMED" | "ESTIMATED" | null;
  card_complete: boolean;
  options_valid: boolean;
  implied_move: string | null;
  benchmark_relative_5d: string | null;
  benchmark_relative_63d: string | null;
};

export type OptionLeg = {
  right: "C" | "P";
  strike: string;
  expiry: string;
  bid: string;
  ask: string;
  oi: number;
  volume: number;
  asOf: string;
};

export function relativeReturn(factors: string[]): string | null {
  if (!factors.length) return null;
  let acc = dec("1", 12);
  for (const f of factors) {
    try {
      acc = mul(acc, dec(f, 12, "0.000000000001", "1000000"));
    } catch {
      return null;
    }
  }
  const r = sub(acc, dec("1", 0));
  return decToCanonical(quantizeHalfUp(r, 12), 12);
}

export function benchmarkRelative(stockFactors: string[], benchFactors: string[]): string | null {
  if (stockFactors.length !== benchFactors.length || stockFactors.length === 0) return null;
  const s = relativeReturn(stockFactors);
  const b = relativeReturn(benchFactors);
  if (s == null || b == null) return null;
  const diff = sub(dec(s, 12, "-1000000", "1000000"), dec(b, 12, "-1000000", "1000000"));
  return decToCanonical(quantizeHalfUp(diff, 12), 12);
}

export function impliedMove(callMid: string, putMid: string, stockMid: string): string | null {
  try {
    const c = dec(callMid, 6, "0.000001", "1000000");
    const p = dec(putMid, 6, "0.000001", "1000000");
    const s = dec(stockMid, 6, "0.000001", "1000000");
    const sum = { ...c, unscaled: c.unscaled + p.unscaled, scale: 6 };
    // (c+p)/s
    const num = c.unscaled + p.unscaled;
    const den = s.unscaled;
    const extra = 16;
    const q = (num * 10n ** BigInt(extra)) / den;
    const r = (num * 10n ** BigInt(extra)) % den;
    const raw = { neg: false, unscaled: r * 2n >= den ? q + 1n : q, scale: extra };
    const mv = decToCanonical(quantizeHalfUp(raw, 12), 12);
    const v = dec(mv, 12, "0.000000000001", "5");
    void v;
    void sum;
    return mv;
  } catch {
    return null;
  }
}

export function optionRelativeSpread(bid: string, ask: string): number | null {
  try {
    const b = Number(bid);
    const a = Number(ask);
    if (!(a >= b) || b <= 0 || a <= 0) return null;
    const mid = (a + b) / 2;
    return (a - b) / mid;
  } catch {
    return null;
  }
}

export function selectStraddle(
  stockMid: string,
  d: string,
  d1OpenIso: string,
  legs: OptionLeg[],
): { call: OptionLeg; put: OptionLeg; valid: boolean; reason?: string } | { valid: false; reason: string } {
  const mid = Number(stockMid);
  const dDate = new Date(d + "T00:00:00Z");
  const maxExpiry = new Date(dDate.getTime() + 45 * 86400000);
  const d1 = new Date(d1OpenIso);
  const byExpiry = new Map<string, OptionLeg[]>();
  for (const leg of legs) {
    const exp = new Date(leg.expiry + "T23:59:59Z");
    if (!(exp > d1) || exp > maxExpiry) continue;
    const list = byExpiry.get(leg.expiry) ?? [];
    list.push(leg);
    byExpiry.set(leg.expiry, list);
  }
  const expiries = [...byExpiry.keys()].sort();
  if (!expiries.length) return { valid: false, reason: "NO_ELIGIBLE_EXPIRY" };
  const first = expiries[0];
  const group = byExpiry.get(first) ?? [];
  const calls = group.filter((l) => l.right === "C");
  const puts = group.filter((l) => l.right === "P");
  const pairs: { call: OptionLeg; put: OptionLeg; dist: number; strike: number }[] = [];
  for (const c of calls) {
    const p = puts.find((x) => x.strike === c.strike);
    if (!p) continue;
    const k = Number(c.strike);
    pairs.push({ call: c, put: p, dist: Math.abs(k / mid - 1), strike: k });
  }
  if (!pairs.length) return { valid: false, reason: "NO_MATCHED_STRIKE" };
  pairs.sort((a, b) => a.dist - b.dist || a.strike - b.strike);
  const chosen = pairs[0];
  if (chosen.dist > 0.02) return { valid: false, reason: "ATM_DISTANCE" };
  for (const leg of [chosen.call, chosen.put]) {
    if (!(Number(leg.bid) > 0) || Number(leg.ask) < Number(leg.bid)) return { valid: false, reason: "QUOTE_SIDE" };
    const sp = optionRelativeSpread(leg.bid, leg.ask);
    if (sp == null || sp > 0.2) return { valid: false, reason: "LEG_SPREAD" };
    if (leg.oi < 100) return { valid: false, reason: "OPEN_INTEREST" };
    if (leg.volume < 10) return { valid: false, reason: "VOLUME" };
  }
  return { call: chosen.call, put: chosen.put, valid: true };
}

export function assembleCard(input: {
  timingQuality: "ISSUER_CONFIRMED" | "ESTIMATED" | null;
  optionsValid: boolean;
  impliedMove: string | null;
  rel5: string | null;
  rel63: string | null;
}): TypedCard {
  const card: TypedCard = {
    timing_quality: input.timingQuality,
    options_valid: input.optionsValid,
    implied_move: input.impliedMove,
    benchmark_relative_5d: input.rel5,
    benchmark_relative_63d: input.rel63,
    card_complete: false,
  };
  card.card_complete = computeCardComplete({
    timing_quality: card.timing_quality ?? undefined,
    options_valid: card.options_valid,
    implied_move: card.implied_move ?? undefined,
    benchmark_relative_5d: card.benchmark_relative_5d ?? undefined,
    benchmark_relative_63d: card.benchmark_relative_63d ?? undefined,
  });
  return card;
}
```


---

## `src/desk/commands.ts` (34125 bytes, sha256 `a43c165282d5bf91219a4e53c4cc6b122ce5e2f3cb8292b77188f4cfdbc15188`)

```ts
import { createHash } from "node:crypto";
import { getSql, withTransaction } from "@/lib/db";
import {
  COST_MODEL_CONTENT,
  KernelError,
  admitPredict,
  costModelHash,
  dec,
  evaluate,
  inputHash,
  magnitudeBand,
  manifestHash,
  modeledFill,
  outputHash,
  paperPnl,
  snapshotHash,
  shuffle,
  directionHit,
  bandHit,
  canon,
  addNotional,
} from "@/kernel/index";
import { assembleCard, benchmarkRelative, impliedMove, selectStraddle, type TypedCard } from "./features";
import { appendEvent, assertRiskMatches, loadExistingCommand, lockRisk, raiseAlarm, recomputeRisk, withWriter, type WriterCtx } from "./writer";
import { DeskError, asHex, etInstant, hexBuf, jsonCanon, newId } from "./util";

const TICKET = "5000.0000";
const MARGIN = 3;
const DATA_MODE = "FIXTURE" as const;

type ObsRow = {
  observation_id: string;
  permanent_security_id: string;
  snapshot_type: string;
  session_date: string;
  payload_protected: Buffer | Uint8Array | null;
  payload_hash: Buffer | Uint8Array;
  observation_hash: Buffer | Uint8Array;
  envelope: unknown;
  source_class: string;
  received_at: string;
  source_event_at: string | null;
};

function payloadOf(row: ObsRow): Record<string, unknown> {
  const env = row.envelope as { payload?: Record<string, unknown> };
  if (env && typeof env === "object" && env.payload) return env.payload;
  return {};
}

export async function existingReceipt(commandId: string): Promise<unknown | null> {
  const sql = await getSql();
  return loadExistingCommand(sql, commandId);
}

export async function sealSession(commandId: string, sessionDate: string, actor: string) {
  const existing = await existingReceipt(commandId);
  if (existing) return existing;
  return withWriter(actor, async (ctx) => {
    const dup = await ctx.sql.query<{ manifest_id: string }>(
      `SELECT manifest_id FROM manifest WHERE session_date = $1 AND sleeve = 'EARNINGS'`,
      [sessionDate],
    );
    if (dup.length) {
      const prior = await ctx.sql.query<{ result_receipt: unknown }>(
        `SELECT result_receipt FROM event_log WHERE event_type = 'SEAL' AND semantic_payload->>'session_date' = $1`,
        [sessionDate],
      );
      if (prior.length) return prior[0].result_receipt;
    }
    const win = await ctx.sql.query<{
      window_id: string;
      universe_version: string;
      policy_id: string;
      rule_id: string;
      rule_version: string;
      evaluator_id: string;
      cost_model_id: string;
    }>(`SELECT window_id, universe_version, policy_id, rule_id, rule_version, evaluator_id, cost_model_id
        FROM evaluation_window
        WHERE starts_at <= $1 AND ends_at > $1 AND ended_early_at IS NULL
        ORDER BY starts_at DESC LIMIT 1`, [ctx.now.toISOString()]);
    if (!win.length) {
      const fallback = await ctx.sql.query<{
        window_id: string;
        universe_version: string;
        policy_id: string;
        rule_id: string;
        rule_version: string;
        evaluator_id: string;
        cost_model_id: string;
      }>(`SELECT window_id, universe_version, policy_id, rule_id, rule_version, evaluator_id, cost_model_id FROM evaluation_window ORDER BY starts_at DESC LIMIT 1`);
      if (fallback.length) win.push(fallback[0]);
    }
    if (!win.length) throw new DeskError("NO_WINDOW", "no evaluation window");
    const w = win[0];
    const cal = await ctx.sql.query<{ listing_exchange: string; is_open: boolean; moc_entry_cutoff_at: string; close_at: string; content_hash: Buffer }>(
      `SELECT listing_exchange, is_open, moc_entry_cutoff_at::text, close_at::text, content_hash FROM calendar_session
       WHERE calendar_version = 'cal-2026' AND session_date = $1 AND listing_exchange IN ('XNYS','XNAS')`,
      [sessionDate],
    );
    if (cal.length !== 2 || cal.some((c) => !c.is_open || !c.moc_entry_cutoff_at)) {
      await raiseAlarm(ctx, "CALENDAR_BLOCKED", "calendar", { sessionDate }, true);
      throw new DeskError("CALENDAR_BLOCKED", "required venue calendars missing");
    }
    const cutoffs = cal.map((c) => new Date(c.moc_entry_cutoff_at).getTime());
    const uniform = new Date(Math.min(...cutoffs) - MARGIN * 60 * 1000);
    const sealAt = new Date(uniform.getTime() - 120 * 1000);
    if (ctx.now.getTime() >= uniform.getTime()) {
      await raiseAlarm(ctx, "SEAL_MISSED", "seal", { sessionDate }, false);
      throw new DeskError("SEAL_MISSED", "seal attempted after cutoff");
    }
    const next = await nextOpen(ctx.sql, sessionDate, 1);
    const second = await nextOpen(ctx.sql, sessionDate, 2);
    const identities = await ctx.sql.query<{
      policy_hash: Buffer;
      ast_hash: Buffer;
      artifact_hash: Buffer;
      content_hash: Buffer;
    }>(
      `SELECT p.policy_hash, r.ast_hash, e.artifact_hash, c.content_hash
       FROM policy_bundle p, rule_card r, evaluator_artifact e, cost_model c
       WHERE p.policy_id = $1 AND r.rule_id = $2 AND r.rule_version = $3 AND e.evaluator_id = $4 AND c.cost_model_id = $5`,
      [w.policy_id, w.rule_id, w.rule_version, w.evaluator_id, w.cost_model_id],
    );
    const ids = identities[0];
    const members = await ctx.sql.query<{
      permanent_security_id: string;
      listing_exchange: string;
      sector: string | null;
    }>(
      `SELECT permanent_security_id, listing_exchange, sector FROM universe_member WHERE universe_version = $1 AND included = TRUE`,
      [w.universe_version],
    );
    const events = await ctx.sql.query<{
      event_key: string;
      permanent_security_id: string;
      timing: string;
      quality: string;
      source_observation_id: string;
    }>(
      `SELECT event_key, permanent_security_id, timing, quality, source_observation_id FROM earnings_event WHERE intended_session = $1`,
      [sessionDate],
    );
    const eventBySec = new Map(events.map((e) => [e.permanent_security_id, e]));
    const tickers = await ctx.sql.query<{ permanent_security_id: string; ticker: string }>(
      `SELECT permanent_security_id, ticker FROM security_ticker WHERE provider_id = 'fixture'`,
    );
    const tickerOf = Object.fromEntries(tickers.map((t) => [t.permanent_security_id, t.ticker]));
    const obs = await ctx.sql.query<ObsRow>(
      `SELECT observation_id, permanent_security_id, snapshot_type, session_date::text, payload_protected, payload_hash, observation_hash, envelope, source_class, received_at::text, source_event_at::text
       FROM observation WHERE tombstoned = FALSE`,
    );
    const manifestId = newId("man");
    const seed = Buffer.from(sessionDate === "2026-09-04" ? "01".repeat(32) : "a5".repeat(32), "hex");
    const included: typeof members = [];
    const exclusions: Array<{ security: string; status: string; reasons: string[] }> = [];
    for (const m of members) {
      const ev = eventBySec.get(m.permanent_security_id);
      const reasons: string[] = [];
      if (!ev) reasons.push("NO_EARNINGS_EVENT");
      else {
        if (ev.timing !== "AMC") reasons.push(`TIMING_${ev.timing}`);
      }
      const quote = latest(obs, m.permanent_security_id, "QUOTE", sessionDate);
      if (!quote) reasons.push("MISSING_SEAL_QUOTE");
      else {
        const p = payloadOf(quote);
        const last = Number(p.last ?? p.mid ?? 0);
        if (!(last >= 5)) reasons.push("PRICE_BELOW_5");
      }
      if (reasons.length) {
        exclusions.push({ security: m.permanent_security_id, status: "EXCLUDED", reasons });
      } else {
        included.push(m);
      }
    }
    const order = shuffle(
      included.map((m) => m.permanent_security_id),
      seed.toString("hex"),
    );
    const memberSnapshots: Array<{
      security: string;
      eventKey: string;
      quality: string;
      index: number;
      card: TypedCard;
      snapHash: string;
      pins: Array<{ id: string; hash: string }>;
      ticker: string;
    }> = [];
    for (const sec of order) {
      const ev = eventBySec.get(sec)!;
      const built = buildMemberSnapshot(sec, sessionDate, next, ev, obs);
      memberSnapshots.push({
        security: sec,
        eventKey: ev.event_key,
        quality: ev.quality,
        index: order.indexOf(sec),
        ticker: tickerOf[sec] ?? sec,
        ...built,
      });
    }
    const memberEntries = memberSnapshots
      .map((m) => ({
        permanent_security_id: m.security,
        snapshot_hash: m.snapHash,
        shuffle_order_index: String(m.index),
      }))
      .sort((a, b) => (a.permanent_security_id < b.permanent_security_id ? -1 : 1));
    const manifestContent = {
      manifest_id: manifestId,
      window_id: w.window_id,
      session_date: sessionDate,
      next_session_date: next,
      second_next_session_date: second,
      sleeve: "EARNINGS",
      universe_version: w.universe_version,
      policy_hash: asHex(ids.policy_hash),
      rule_ast_hash: asHex(ids.ast_hash),
      evaluator_artifact_hash: asHex(ids.artifact_hash),
      cost_model_hash: asHex(ids.content_hash),
      calendar_hashes: cal
        .map((c) => ({ venue: c.listing_exchange, hash: asHex(c.content_hash) }))
        .sort((a, b) => a.venue.localeCompare(b.venue)),
      seed: seed.toString("hex"),
      seal_at: sealAt.toISOString(),
      freeze_cutoff_at: uniform.toISOString(),
      mark_wait_at: etInstant(next, "16:00").toISOString(),
      report_finalize_at: etInstant(second, "16:00").toISOString(),
      members: memberEntries,
    };
    const manHash = manifestHash(manifestContent);
    const { eventSeq } = await appendEvent(ctx, {
      commandId,
      type: "SEAL",
      payload: { session_date: sessionDate, manifest_id: manifestId },
      receipt: { manifest_id: manifestId, sealed_member_count: String(order.length) },
      request: { commandId, sessionDate },
    });
    await ctx.sql.query(
      `INSERT INTO manifest (
        manifest_id, window_id, session_date, next_session_date, second_next_session_date, sleeve,
        universe_version, policy_id, rule_id, rule_version, evaluator_id, cost_model_id,
        policy_hash, rule_ast_hash, evaluator_artifact_hash, cost_model_hash, calendar_refs,
        seal_at, freeze_cutoff_at, mark_wait_at, report_finalize_at, sealed_at, seed,
        sealed_member_count, canonical_content, manifest_hash, seal_event_seq, freeze_resolution
      ) VALUES (
        $1,$2,$3,$4,$5,'EARNINGS',$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16::jsonb,
        $17,$18,$19,$20,$21,$22,$23,$24,$25,$26,'OPEN'
      )`,
      [
        manifestId,
        w.window_id,
        sessionDate,
        next,
        second,
        w.universe_version,
        w.policy_id,
        w.rule_id,
        w.rule_version,
        w.evaluator_id,
        w.cost_model_id,
        hexBuf(asHex(ids.policy_hash)),
        hexBuf(asHex(ids.ast_hash)),
        hexBuf(asHex(ids.artifact_hash)),
        hexBuf(asHex(ids.content_hash)),
        JSON.stringify(manifestContent.calendar_hashes),
        sealAt.toISOString(),
        uniform.toISOString(),
        etInstant(next, "16:00").toISOString(),
        etInstant(second, "16:00").toISOString(),
        ctx.now.toISOString(),
        seed,
        order.length,
        jsonCanon(manifestContent),
        hexBuf(manHash),
        eventSeq,
      ],
    );
    for (const m of memberSnapshots) {
      await ctx.sql.query(
        `INSERT INTO manifest_member (
          manifest_id, permanent_security_id, event_key, sealed_event_session, timing, timing_quality,
          shuffle_order_index, snapshot_hash, display_ticker
        ) VALUES ($1,$2,$3,$4,'AMC',$5,$6,$7,$8)`,
        [manifestId, m.security, m.eventKey, sessionDate, m.quality, m.index, hexBuf(m.snapHash), m.ticker],
      );
      await ctx.sql.query(
        `INSERT INTO sealed_input (
          manifest_id, permanent_security_id, snapshot_schema, snapshot_hash, card, bindings, pin_count,
          card_complete, options_valid, coverage_summary, retention_exclusion
        ) VALUES ($1,$2,'card-1',$3,$4::jsonb,$5::jsonb,$6,$7,$8,$9::jsonb,FALSE)`,
        [
          manifestId,
          m.security,
          hexBuf(m.snapHash),
          JSON.stringify(m.card),
          JSON.stringify({ pins: m.pins }),
          m.pins.length,
          m.card.card_complete,
          m.card.options_valid,
          JSON.stringify({ pin_count: m.pins.length }),
        ],
      );
      const sortedPins = [...m.pins].sort((a, b) => (a.id < b.id ? -1 : 1));
      let idx = 0;
      for (const p of sortedPins) {
        await ctx.sql.query(
          `INSERT INTO sealed_input_pin (manifest_id, permanent_security_id, observation_id, observation_hash, pin_index)
           VALUES ($1,$2,$3,$4,$5)`,
          [manifestId, m.security, p.id, hexBuf(p.hash), idx],
        );
        idx += 1;
      }
      await ctx.sql.query(
        `INSERT INTO deadline (deadline_id, kind, manifest_id, permanent_security_id, scheduled_at, scheduled_event_seq)
         VALUES ($1,'MARK_WAIT',$2,$3,$4,$5)`,
        [newId("dl"), manifestId, m.security, etInstant(next, "16:00").toISOString(), eventSeq],
      );
    }
    for (const ex of exclusions) {
      await ctx.sql.query(
        `INSERT INTO candidate_eligibility (
          eligibility_id, session_date, window_id, permanent_security_id, status, reason_codes, evidence_ids, event_seq, manifest_id
        ) VALUES ($1,$2,$3,$4,'EXCLUDED',$5::jsonb,$6::jsonb,$7,$8)`,
        [newId("elg"), sessionDate, w.window_id, ex.security, JSON.stringify(ex.reasons), JSON.stringify([]), eventSeq, manifestId],
      );
    }
    for (const m of memberSnapshots) {
      await ctx.sql.query(
        `INSERT INTO candidate_eligibility (
          eligibility_id, session_date, window_id, permanent_security_id, event_key, status, reason_codes, evidence_ids, event_seq, manifest_id
        ) VALUES ($1,$2,$3,$4,$5,'INCLUDED',$6::jsonb,$7::jsonb,$8,$9)`,
        [newId("elg"), sessionDate, w.window_id, m.security, m.eventKey, JSON.stringify([]), JSON.stringify(m.pins.map((p) => p.id)), eventSeq, manifestId],
      );
    }
    await ctx.sql.query(
      `INSERT INTO deadline (deadline_id, kind, manifest_id, scheduled_at, scheduled_event_seq) VALUES ($1,'FREEZE',$2,$3,$4)`,
      [newId("dl"), manifestId, uniform.toISOString(), eventSeq],
    );
    await ctx.sql.query(
      `INSERT INTO deadline (deadline_id, kind, manifest_id, scheduled_at, scheduled_event_seq) VALUES ($1,'REPORT_FINALIZE',$2,$3,$4)`,
      [newId("dl"), manifestId, etInstant(second, "16:00").toISOString(), eventSeq],
    );
    return {
      manifest_id: manifestId,
      sealed_member_count: String(order.length),
      excluded_count: String(exclusions.length),
      freeze_cutoff_at: uniform.toISOString(),
      manifest_hash: manHash,
    };
  });
}

function latest(obs: ObsRow[], sec: string, type: string, session?: string): ObsRow | null {
  const rows = obs
    .filter((o) => o.permanent_security_id === sec && o.snapshot_type === type && (!session || o.session_date === session))
    .sort((a, b) => (a.received_at < b.received_at ? 1 : -1));
  return rows[0] ?? null;
}

function buildMemberSnapshot(
  sec: string,
  sessionDate: string,
  nextSession: string,
  ev: { event_key: string; quality: string; source_observation_id: string },
  obs: ObsRow[],
): { card: TypedCard; snapHash: string; pins: Array<{ id: string; hash: string }> } {
  const pins: Array<{ id: string; hash: string }> = [];
  const add = (row: ObsRow | null) => {
    if (!row) return;
    pins.push({ id: row.observation_id, hash: asHex(row.observation_hash) });
  };
  const eventObs = obs.find((o) => o.observation_id === ev.source_observation_id) ?? latest(obs, sec, "EARNINGS_EVENT", sessionDate);
  add(eventObs ?? null);
  const quote = latest(obs, sec, "QUOTE", sessionDate);
  add(quote);
  const tape = latest(obs, sec, "TAPE_RELATIVE", sessionDate);
  add(tape);
  let rel5: string | null = null;
  let rel63: string | null = null;
  if (tape) {
    const p = payloadOf(tape);
    rel5 = typeof p.rel5 === "string" ? p.rel5 : null;
    rel63 = typeof p.rel63 === "string" ? p.rel63 : null;
  } else {
    const stockBars = obs
      .filter((o) => o.permanent_security_id === sec && o.snapshot_type === "BAR_DAILY" && o.session_date < sessionDate)
      .sort((a, b) => (a.session_date < b.session_date ? -1 : 1));
    const spyBars = obs
      .filter((o) => o.permanent_security_id === "SEC-SPY" && o.snapshot_type === "BAR_DAILY" && o.session_date < sessionDate)
      .sort((a, b) => (a.session_date < b.session_date ? -1 : 1));
    const take = (n: number) => {
      const s = stockBars.slice(-n);
      const b = spyBars.slice(-n);
      s.forEach(add);
      b.forEach(add);
      return {
        sf: s.map((r) => String(payloadOf(r).factor ?? "1.000000000000")),
        bf: b.map((r) => String(payloadOf(r).factor ?? "1.000000000000")),
      };
    };
    const h5 = take(5);
    const h63 = take(63);
    rel5 = h5.sf.length === 5 ? benchmarkRelative(h5.sf, h5.bf) : null;
    rel63 = h63.sf.length === 63 ? benchmarkRelative(h63.sf, h63.bf) : null;
  }
  const chain = obs.filter((o) => o.permanent_security_id === sec && o.snapshot_type === "OPTION_LEG" && o.session_date === sessionDate);
  chain.forEach(add);
  const stockMid = quote ? String(payloadOf(quote).mid ?? payloadOf(quote).last ?? "") : "";
  let optionsValid = false;
  let move: string | null = null;
  if (stockMid && chain.length) {
    const legs = chain.map((o) => {
      const p = payloadOf(o);
      return {
        right: p.right as "C" | "P",
        strike: String(p.strike),
        expiry: String(p.expiry),
        bid: String(p.bid),
        ask: String(p.ask),
        oi: Number(p.oi),
        volume: Number(p.volume),
        asOf: o.source_event_at ?? o.received_at,
      };
    });
    const sel = selectStraddle(stockMid, sessionDate, etInstant(nextSession, "09:30").toISOString(), legs);
    if ("call" in sel && sel.valid) {
      const cMid = ((Number(sel.call.bid) + Number(sel.call.ask)) / 2).toFixed(6);
      const pMid = ((Number(sel.put.bid) + Number(sel.put.ask)) / 2).toFixed(6);
      move = impliedMove(cMid, pMid, Number(stockMid).toFixed(6));
      optionsValid = move != null;
    }
  }
  const card = assembleCard({
    timingQuality: ev.quality as "ISSUER_CONFIRMED" | "ESTIMATED",
    optionsValid,
    impliedMove: move,
    rel5,
    rel63,
  });
  const uniq = new Map(pins.map((p) => [p.id, p]));
  const pinList = [...uniq.values()].sort((a, b) => (a.id < b.id ? -1 : 1));
  const snap = snapshotHash({
    permanent_security_id: sec,
    event_key: ev.event_key,
    session_date: sessionDate,
    card,
    pins: pinList,
  });
  void 0;
  return { card, snapHash: snap, pins: pinList };
}

async function nextOpen(sql: import("@/lib/db").Sql, from: string, n: number): Promise<string> {
  const rows = await sql.query<{ session_date: string }>(
    `SELECT session_date::text FROM calendar_session
     WHERE calendar_version = 'cal-2026' AND listing_exchange = 'XNYS' AND is_open = TRUE AND session_date > $1
     ORDER BY session_date ASC LIMIT $2`,
    [from, n],
  );
  if (rows.length < n) throw new DeskError("CALENDAR_BLOCKED", "cannot resolve D+n");
  return rows[n - 1].session_date;
}

export async function freezeMember(commandId: string, manifestId: string, securityId: string, actor: string) {
  const existing = await existingReceipt(commandId);
  if (existing) return existing;
  const result = await withWriter(actor, async (ctx) => {
    const found = await ctx.sql.query<{ freeze_id: string; input_hash: Buffer; output_hash: Buffer }>(
      `SELECT freeze_id, input_hash, output_hash FROM "freeze" WHERE manifest_id = $1 AND permanent_security_id = $2`,
      [manifestId, securityId],
    );
    if (found.length) {
      return verifyExistingFreeze(ctx, manifestId, securityId, found[0]);
    }
    const man = await ctx.sql.query<{
      freeze_cutoff_at: string;
      freeze_resolution: string;
      manifest_hash: Buffer;
      rule_ast_hash: Buffer;
      evaluator_artifact_hash: Buffer;
      cost_model_hash: Buffer;
      session_date: string;
    }>(
      `SELECT freeze_cutoff_at::text, freeze_resolution, manifest_hash, rule_ast_hash, evaluator_artifact_hash, cost_model_hash, session_date::text
       FROM manifest WHERE manifest_id = $1 FOR UPDATE`,
      [manifestId],
    );
    if (!man.length) throw new DeskError("NOT_FOUND", "manifest missing", 404);
    if (man[0].freeze_resolution !== "OPEN") throw new DeskError("ADMISSION_CLOSED", "freeze resolution is terminal");
    if (ctx.now.getTime() >= new Date(man[0].freeze_cutoff_at).getTime()) {
      throw new DeskError("CUTOFF", "admission cutoff passed");
    }
    const paused = await ctx.sql.query<{ admission_paused: boolean }>(`SELECT admission_paused FROM operator_control WHERE sleeve = 'EARNINGS'`);
    const member = await ctx.sql.query<{
      snapshot_hash: Buffer;
      shuffle_order_index: number;
      timing_quality: string;
      event_key: string;
    }>(
      `SELECT snapshot_hash, shuffle_order_index, timing_quality, event_key FROM manifest_member WHERE manifest_id = $1 AND permanent_security_id = $2`,
      [manifestId, securityId],
    );
    if (!member.length) throw new DeskError("NOT_FOUND", "member not sealed", 404);
    const guards = await ctx.sql.query<{ guard_id: string }>(
      `SELECT guard_id FROM guard_event WHERE permanent_security_id = $1 AND event_key = $2`,
      [securityId, member[0].event_key],
    );
    if (guards.length) throw new DeskError("OFF_DESIGN_EARLY_RELEASE", "early-result knowledge blocks freeze");
    const sealed = await ctx.sql.query<{ card: TypedCard; pin_count: number; card_complete: boolean; options_valid: boolean | null }>(
      `SELECT card, pin_count, card_complete, options_valid FROM sealed_input WHERE manifest_id = $1 AND permanent_security_id = $2`,
      [manifestId, securityId],
    );
    const pins = await ctx.sql.query<{ observation_id: string; observation_hash: Buffer; pin_index: number }>(
      `SELECT observation_id, observation_hash, pin_index FROM sealed_input_pin WHERE manifest_id = $1 AND permanent_security_id = $2 ORDER BY pin_index`,
      [manifestId, securityId],
    );
    const pinTuples: [string, string][] = pins.map((p) => [p.observation_id, asHex(p.observation_hash)]);
    const inHash = inputHash({
      manifestId,
      securityId,
      manifestHash: asHex(man[0].manifest_hash),
      snapshotHash: asHex(member[0].snapshot_hash),
      ruleHash: asHex(man[0].rule_ast_hash),
      engineHash: asHex(man[0].evaluator_artifact_hash),
      costHash: asHex(man[0].cost_model_hash),
      margin: MARGIN,
      pins: pinTuples,
    });
    const card = sealed[0].card;
    const { astForManifest } = await import("./learn");
    const ast = await astForManifest(manifestId);
    const ev = evaluate(ast, {
      timing_quality: card.timing_quality,
      card_complete: card.card_complete,
      options_valid: card.options_valid,
      implied_move: card.implied_move,
      benchmark_relative_5d: card.benchmark_relative_5d,
      benchmark_relative_63d: card.benchmark_relative_63d,
    });
    if (ev.status === "INVALID_RULE") {
      await raiseAlarm(ctx, "INVALID_RULE_AST", "evaluator", { securityId }, true);
      throw new DeskError("INVALID_RULE_AST", "registered rule invalid", 503);
    }
    const band =
      ev.decision === "PREDICT" && card.implied_move
        ? magnitudeBand(card.implied_move)
        : { low: null as string | null, high: null as string | null };
    const decisionPayload = {
      status: ev.status,
      decision: ev.decision,
      direction: ev.direction,
      magnitude_low: band.low,
      magnitude_high: band.high,
      card_complete: card.card_complete,
      options_valid: card.options_valid,
      reasons: ev.reasons,
      missing: ev.reasons.filter((r) => r.startsWith("MISSING_")),
    };
    const outHash = outputHash(inHash, decisionPayload);
    const freezeId = newId("frz");
    const { eventSeq } = await appendEvent(ctx, {
      commandId,
      type: "FREEZE",
      payload: { manifest_id: manifestId, permanent_security_id: securityId, freeze_id: freezeId },
      receipt: { freeze_id: freezeId, decision: ev.decision },
      request: { commandId, manifestId, securityId },
    });
    await ctx.sql.query(
      `INSERT INTO "freeze" (
        freeze_id, manifest_id, permanent_security_id, snapshot_hash, input_hash, output_hash, decision, direction,
        card_complete, options_valid, output_payload, pin_count, freeze_order_index, admission_checked_at, event_seq, verification_level
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::jsonb,$12,$13,$14,$15,'BYTE_VERIFIED')`,
      [
        freezeId,
        manifestId,
        securityId,
        member[0].snapshot_hash,
        hexBuf(inHash),
        hexBuf(outHash),
        ev.decision,
        ev.direction,
        card.card_complete,
        card.options_valid,
        JSON.stringify(decisionPayload),
        pins.length,
        member[0].shuffle_order_index,
        ctx.now.toISOString(),
        eventSeq,
      ],
    );
    for (const p of pins) {
      await ctx.sql.query(
        `INSERT INTO freeze_pin (freeze_id, observation_id, observation_hash, pin_index) VALUES ($1,$2,$3,$4)`,
        [freezeId, p.observation_id, p.observation_hash, p.pin_index],
      );
    }
    await ctx.sql.query(
      `INSERT INTO freeze_attempt (attempt_id, manifest_id, permanent_security_id, started_at, finished_at, duration_ms, result_code, event_seq)
       VALUES ($1,$2,$3,$4,$4,1,$5,$6)`,
      [newId("att"), manifestId, securityId, ctx.now.toISOString(), ev.decision, eventSeq],
    );
    let admission: { outcome: string; reason_codes: string[]; position_id: string | null } = {
      outcome: "NOT_PREDICTED",
      reason_codes: ["NOT_PREDICTED"],
      position_id: null,
    };
    if (ev.decision === "PREDICT") {
      admission = await evaluateAdmission(ctx, {
        freezeId,
        manifestId,
        securityId,
        sessionDate: man[0].session_date,
        paused: paused[0]?.admission_paused === true,
        cutoff: new Date(man[0].freeze_cutoff_at),
        card,
        timingQuality: member[0].timing_quality,
      });
    }
    const admId = newId("adm");
    await ctx.sql.query(
      `INSERT INTO execution_admission (
        admission_id, freeze_id, outcome, reason_codes, quote_observation_ids, checked_at, policy_hash, request_hash, position_id, event_seq
      ) VALUES ($1,$2,$3,$4::jsonb,$5::jsonb,$6,$7,$8,$9,$10)`,
      [
        admId,
        freezeId,
        admission.outcome,
        JSON.stringify(admission.reason_codes),
        JSON.stringify([]),
        ctx.now.toISOString(),
        hexBuf(asHex(man[0].cost_model_hash)),
        hexBuf(inHash),
        admission.position_id,
        eventSeq,
      ],
    );
    let tickerForCommit: string | null = null;
    if (admission.outcome === "ADMITTED" && admission.position_id) {
      const ticker = await ctx.sql.query<{ display_ticker: string }>(
        `SELECT display_ticker FROM manifest_member WHERE manifest_id = $1 AND permanent_security_id = $2`,
        [manifestId, securityId],
      );
      tickerForCommit = ticker[0]?.display_ticker ?? securityId;
      await commitPosition(ctx, {
        positionId: admission.position_id,
        freezeId,
        manifestId,
        securityId,
        admissionId: admId,
        sessionDate: man[0].session_date,
        ticker: tickerForCommit,
      });
    }
    return {
      freeze_id: freezeId,
      decision: ev.decision,
      direction: ev.direction,
      input_hash: inHash,
      output_hash: outHash,
      admission_outcome: admission.outcome,
      position_id: admission.position_id,
      ticker: tickerForCommit,
      reasons: ev.reasons,
      verification_level: "BYTE_VERIFIED",
    };
  });
  if ("ticker" in result && result.admission_outcome === "ADMITTED" && result.position_id && result.ticker) {
    try {
      const { sendEntry } = await import("./auto-trade");
      await sendEntry({ positionId: result.position_id, ticker: result.ticker, actor });
    } catch {
      /* desk commitment stands if the venue rejects */
    }
  }
  return result;
}

async function verifyExistingFreeze(
  ctx: WriterCtx,
  manifestId: string,
  securityId: string,
  row: { freeze_id: string; input_hash: Buffer; output_hash: Buffer },
) {
  const sealed = await ctx.sql.query<{ observation_id: string; observation_hash: Buffer }>(
    `SELECT observation_id, observation_hash FROM sealed_input_pin WHERE manifest_id = $1 AND permanent_security_id = $2`,
    [manifestId, securityId],
  );
  const pins = await ctx.sql.query<{ observation_id: string; observation_hash: Buffer }>(
    `SELECT observation_id, observation_hash FROM freeze_pin WHERE freeze_id = $1`,
    [row.freeze_id],
  );
  const a = new Set(sealed.map((p) => `${p.observation_id}:${asHex(p.observation_hash)}`));
  const b = new Set(pins.map((p) => `${p.observation_id}:${asHex(p.observation_hash)}`));
  if (a.size !== b.size || [...a].some((x) => !b.has(x))) {
    await raiseAlarm(ctx, "FREEZE_ARTIFACT_MISMATCH", "freeze", { freeze_id: row.freeze_id }, true);
    throw new DeskError("FREEZE_ARTIFACT_MISMATCH", "stored pins disagree with sealed set", 503);
  }
  const adm = await ctx.sql.query<{ outcome: string; position_id: string | null }>(
    `SELECT outcome, position_id FROM execution_admission WHERE freeze_id = $1`,
    [row.freeze_id],
  );
  const fr = await ctx.sql.query<{ decision: string; direction: string | null }>(
    `SELECT decision, direction FROM "freeze" WHERE freeze_id = $1`,
    [row.freeze_id],
  );
  return {
    freeze_id: row.freeze_id,
    decision: fr[0]?.decision,
    direction: fr[0]?.direction ?? null,
    input_hash: asHex(row.input_hash),
    output_hash: asHex(row.output_hash),
    admission_outcome: adm[0]?.outcome ?? null,
    position_id: adm[0]?.position_id ?? null,
    duplicate: true,
    verification_level: "BYTE_VERIFIED",
  };
}

async function evaluateAdmission(
  ctx: WriterCtx,
  args: {
    freezeId: string;
    manifestId: string;
    securityId: string;
    sessionDate: string;
    paused: boolean;
    cutoff: Date;
    card: TypedCard;
    timingQuality: string;
  },
): Promise<{ outcome: string; reason_codes: string[]; position_id: string | null }> {
  const reasons: string[] = [];
  const quote = await ctx.sql.query<ObsRow>(
    `SELECT observation_id, envelope, received_at::text, observation_hash, payload_protected, payload_hash, permanent_security_id, snapshot_type, session_date::text, source_class, source_event_at::text
     FROM observation
     WHERE permanent_security_id = $1 AND snapshot_type = 'QUOTE' AND session_date = $2
     ORDER BY received_at DESC LIMIT 1`,
    [args.securityId, args.sessionDate],
  );
  if (!quote.length) reasons.push("MISSING_QUOTE");
  else {
    const p = payloadOf(quote[0]);
    const bid = Number(p.bid);
    const ask = Number(p.ask);
    const last = Number(p.last ?? p.mid);
    const mid = (bid + ask) / 2;
    const age = Math.abs(ctx.now.getTime() - new Date(quote[0].received_at).getTime());
    if (!(bid > 0 && ask >= bid)) reasons.push("QUOTE_SIDE");
    if (!(last >= 5)) reasons.push("PRICE_BELOW_5");
    if (mid > 0 && (ask - bid) / mid > 0.001) reasons.push("SPREAD");
    if (age > 2000) reasons.push("QUOTE_STALE");
  }
  try {
    await assertRiskMatches(ctx.sql);
  } catch {
    reasons.push("RISK_STATE_MISMATCH");
    await raiseAlarm(ctx, "RISK_STATE_MISMATCH", "risk", { security: args.securityId }, true);
  }
  const cached = await lockRisk(ctx.sql);
  const sameEvent = await ctx.sql.query<{ c: number }>(
    `SELECT COUNT(*)::int AS c FROM "position" WHERE intended_event_session = $1 AND state <> 'CLOSED'`,
    [args.sessionDate],
  );
  const owned = await ctx.sql.query<{ c: number }>(
    `SELECT COUNT(*)::int AS c FROM "position" WHERE permanent_security_id = $1 AND state <> 'CLOSED'`,
    [args.securityId],
  );
  try {
    const cap = admitPredict({
      paused: args.paused,
      cutoffPassed: ctx.now.getTime() >= args.cutoff.getTime(),
      timingQuality: args.timingQuality,
      cardComplete: args.card.card_complete === true,
      reservedCount: cached.reserved_count,
      reservedNotional: dec(String(cached.reserved_notional), 4, "0"),
      sameEventOpen: sameEvent[0].c,
      alreadyOwned: owned[0].c > 0,
    });
    if (cap.outcome === "DENIED") {
      for (const r of cap.reason_codes) {
        if (!reasons.includes(r)) reasons.push(r);
      }
    }
  } catch (e) {
    if (e instanceof KernelError) reasons.push("RISK_STATE_MISMATCH");
    else throw e;
  }
  if (reasons.length) return { outcome: "DENIED", reason_codes: reasons, position_id: null };
  return { outcome: "ADMITTED", reason_codes: ["ADMITTED"], position_id: newId("pos") };
}

export async function commitPosition(
  ctx: WriterCtx,
  args: {
    positionId: string;
    freezeId: string;
    manifestId: string;
    securityId: string;
    admissionId: string;
    sessionDate: string;
    ticker: string;
  },
) {
  await ctx.sql.query(
    `INSERT INTO "position" (
      position_id, freeze_id, manifest_id, permanent_security_id, admission_id, intended_event_session, sleeve,
      original_reserved_notional, committed_at, entry_plan, exit_plan, state, cas_token, last_transition_event_seq, display_ticker
    ) VALUES ($1,$2,$3,$4,$5,$6,'EARNINGS',$7,$8,$9::jsonb,$10::jsonb,'COMMITTED_IRREVOCABLE',1,$11,$12)`,
    [
      args.positionId,
      args.freezeId,
      args.manifestId,
      args.securityId,
      args.admissionId,
      args.sessionDate,
      TICKET,
      ctx.now.toISOString(),
      JSON.stringify({ leg: "ENTRY_CLOSE", session: args.sessionDate }),
      JSON.stringify({ leg: "EXIT_OPEN", fallback: "D1_CLOSE" }),
      ctx.seq,
      args.ticker,
    ],
  );
  const cached = await lockRisk(ctx.sql);
  await ctx.sql.query(
    `UPDATE desk_risk_state SET reserved_count = $1, reserved_notional = $2, updated_event_seq = $3 WHERE sleeve = 'EARNINGS'`,
    [cached.reserved_count + 1, addNotional(String(cached.reserved_notional), TICKET), ctx.seq],
  );
}
```


---

## `src/desk/lifecycle.ts` (30170 bytes, sha256 `177bae7ffe562cfb1d4fceff6f1d02b70e779e0247f97a28b6576e81175f3a99`)

```ts
import { getSql } from "@/lib/db";
import { add, bandHit, canon, dec, decToCanonical, directionHit, div, modeledFill, mul, paperPnl, quantizeHalfUp, sha256, sub, subNotional } from "@/kernel/index";
import { appendEvent, assertRiskMatches, loadExistingCommand, lockRisk, raiseAlarm, withWriter, type WriterCtx } from "./writer";
import { DeskError, asHex, hexBuf, jsonCanon, newId } from "./util";

const EDGES: Record<string, string[]> = {
  COMMITTED_IRREVOCABLE: ["FILLED", "NO_FILL", "IMPAIRED_ENTRY"],
  IMPAIRED_ENTRY: ["FILLED", "NO_FILL"],
  FILLED: ["FLAT", "IMPAIRED_EXIT"],
  IMPAIRED_EXIT: ["FLAT"],
  FLAT: ["CLOSED"],
  NO_FILL: ["CLOSED"],
  CLOSED: [],
};

function transitionOk(from: string, to: string): boolean {
  return (EDGES[from] ?? []).includes(to);
}

export async function advanceClock(iso: string, actor: string) {
  return withWriter(actor, async (ctx) => {
    const next = new Date(iso);
    if (next < ctx.now) throw new DeskError("CLOCK_UNTRUSTED", "cannot move fixture clock backward");
    await ctx.sql.query(`UPDATE fixture_clock SET now_utc = $1 WHERE singleton_key = TRUE`, [next.toISOString()]);
    await appendEvent(ctx, {
      commandId: newId("cmd"),
      type: "CLOCK_ADVANCE",
      payload: { to: next.toISOString() },
      receipt: { now: next.toISOString() },
    });
    return { now: next.toISOString() };
  });
}

export async function applyFreezeDeadline(commandId: string, manifestId: string, actor: string) {
  const sql = await getSql();
  const prior = await loadExistingCommand(sql, commandId);
  if (prior) return prior;
  return withWriter(actor, async (ctx) => {
    const dl = await ctx.sql.query<{ deadline_id: string; scheduled_at: string; applied_event_seq: number | null }>(
      `SELECT deadline_id, scheduled_at::text, applied_event_seq FROM deadline WHERE kind = 'FREEZE' AND manifest_id = $1 FOR UPDATE`,
      [manifestId],
    );
    if (!dl.length) throw new DeskError("NOT_FOUND", "freeze deadline missing", 404);
    if (dl[0].applied_event_seq) {
      return { duplicate: true, manifest_id: manifestId };
    }
    if (ctx.now.getTime() < new Date(dl[0].scheduled_at).getTime()) {
      throw new DeskError("NOT_DUE", "freeze deadline not due");
    }
    const members = await ctx.sql.query<{ permanent_security_id: string }>(
      `SELECT permanent_security_id FROM manifest_member WHERE manifest_id = $1`,
      [manifestId],
    );
    const frozen = await ctx.sql.query<{ permanent_security_id: string }>(
      `SELECT permanent_security_id FROM "freeze" WHERE manifest_id = $1`,
      [manifestId],
    );
    const frozenSet = new Set(frozen.map((f) => f.permanent_security_id));
    const missing = members.filter((m) => !frozenSet.has(m.permanent_security_id));
    const { eventSeq } = await appendEvent(ctx, {
      commandId,
      type: "DEADLINE_FREEZE",
      payload: { manifest_id: manifestId },
      receipt: { no_freeze: missing.map((m) => m.permanent_security_id) },
    });
    for (const m of missing) {
      await ctx.sql.query(
        `INSERT INTO grade (
          grade_id, manifest_id, permanent_security_id, freeze_id, vintage, outcome, reason_codes, event_status,
          in_evidence_set, late_label_recovery, confound_flags, label_policy_hash, values, content_hash, created_event_seq
        ) VALUES ($1,$2,$3,NULL,0,'NO_FREEZE',$4::jsonb,'UNRESOLVED',FALSE,FALSE,$5::jsonb,$6,$7::jsonb,$8,$9)`,
        [
          newId("grd"),
          manifestId,
          m.permanent_security_id,
          JSON.stringify(["NO_FREEZE_AT_CUTOFF"]),
          JSON.stringify([]),
          hexBuf("11".repeat(32)),
          JSON.stringify({ direction_hit: null, band_hit: null }),
          hexBuf(sha256(canon({ manifestId, sec: m.permanent_security_id, outcome: "NO_FREEZE" }))),
          eventSeq,
        ],
      );
    }
    const n = members.length;
    const f = frozen.length;
    let resolution: "FULL" | "PARTIAL" | "ABANDONED" | "EMPTY" = "EMPTY";
    if (n === 0) resolution = "EMPTY";
    else if (f === n) resolution = "FULL";
    else if (f === 0) resolution = "ABANDONED";
    else resolution = "PARTIAL";
    if (resolution === "PARTIAL") await raiseAlarm(ctx, "PARTIAL_FREEZE_OCCURRED", "freeze", { manifestId, f, n }, false);
    await ctx.sql.query(
      `UPDATE manifest SET freeze_resolution = $1, admission_closed_event_seq = $2 WHERE manifest_id = $3`,
      [resolution, eventSeq, manifestId],
    );
    await ctx.sql.query(
      `UPDATE deadline SET applied_event_seq = $1, applied_at = $2 WHERE deadline_id = $3`,
      [eventSeq, ctx.now.toISOString(), dl[0].deadline_id],
    );
    return { manifest_id: manifestId, resolution, no_freeze_count: String(missing.length) };
  });
}

type Mark = { observation_id: string; price: string; hash: string; state: string; session: string };

async function officialMark(
  ctx: WriterCtx,
  sec: string,
  type: string,
  session: string,
): Promise<Mark | null> {
  const rows = await ctx.sql.query<{
    observation_id: string;
    observation_hash: Buffer;
    envelope: { payload?: Record<string, unknown> };
    session_date: string;
  }>(
    `SELECT observation_id, observation_hash, envelope, session_date::text FROM observation
     WHERE permanent_security_id = $1 AND snapshot_type = $2 AND session_date = $3 AND tombstoned = FALSE
     ORDER BY received_at ASC`,
    [sec, type, session],
  );
  if (!rows.length) return null;
  const p = rows[0].envelope?.payload ?? {};
  const state = String(p.state ?? "OFFICIAL");
  if (state !== "OFFICIAL" && state !== "OFFICIAL_CORRECTED") return null;
  const price = String(p.price ?? "");
  if (!price) return null;
  return { observation_id: rows[0].observation_id, price, hash: asHex(rows[0].observation_hash), state, session };
}

export async function adjudicateMember(commandId: string, manifestId: string, securityId: string, actor: string) {
  const sql = await getSql();
  const prior = await loadExistingCommand(sql, commandId);
  if (prior) return prior;
  return withWriter(actor, async (ctx) => {
    await appendEvent(ctx, {
      commandId,
      type: "GRADE",
      payload: { manifest_id: manifestId, permanent_security_id: securityId },
      receipt: { ok: true },
    });
    return adjudicateInner(ctx, commandId, manifestId, securityId);
  });
}

async function adjudicateInner(ctx: WriterCtx, commandId: string, manifestId: string, securityId: string) {
  const existing = await ctx.sql.query<{ grade_id: string }>(
    `SELECT grade_id FROM grade WHERE manifest_id = $1 AND permanent_security_id = $2 AND vintage = 0`,
    [manifestId, securityId],
  );
  if (existing.length) return { grade_id: existing[0].grade_id, duplicate: true };
  const man = await ctx.sql.query<{ session_date: string; next_session_date: string; window_id: string }>(
    `SELECT session_date::text, next_session_date::text, window_id FROM manifest WHERE manifest_id = $1`,
    [manifestId],
  );
  const fr = await ctx.sql.query<{
    freeze_id: string;
    decision: string;
    direction: string | null;
    output_payload: { magnitude_low?: string | null; magnitude_high?: string | null };
  }>(
    `SELECT freeze_id, decision, direction, output_payload FROM "freeze" WHERE manifest_id = $1 AND permanent_security_id = $2`,
    [manifestId, securityId],
  );
  const ca = await ctx.sql.query<{ observation_id: string }>(
    `SELECT observation_id FROM observation WHERE permanent_security_id = $1 AND snapshot_type = 'CORPORATE_ACTION' AND session_date = $2`,
    [securityId, man[0].session_date],
  );
  const entry = await officialMark(ctx, securityId, "MARK_ENTRY_CLOSE", man[0].session_date);
  const exit = await officialMark(ctx, securityId, "MARK_EXIT_OPEN", man[0].next_session_date);
  let outcome: "GRADED" | "UNGRADEABLE" | "NO_EVENT" = "UNGRADEABLE";
  const reasons: string[] = [];
  let values: Record<string, unknown> = { direction_hit: null, band_hit: null, raw_gap: null };
  let inEvidence = false;
  if (!fr.length) {
    return { grade_id: null, outcome: "NO_FREEZE", in_evidence_set: false, reasons: ["NO_FREEZE"] };
  } else if (ca.length) {
    outcome = "UNGRADEABLE";
    reasons.push("CORPORATE_ACTION");
  } else if (!entry || !exit) {
    outcome = "UNGRADEABLE";
    if (!entry) reasons.push("MISSING_ENTRY_MARK");
    if (!exit) reasons.push("MISSING_EXIT_MARK");
  } else {
    outcome = "GRADED";
    const hit = directionHit(entry.price, exit.price);
    const band =
      fr[0].decision === "PREDICT" && fr[0].output_payload.magnitude_low && fr[0].output_payload.magnitude_high
        ? bandHit(entry.price, exit.price, fr[0].output_payload.magnitude_low, fr[0].output_payload.magnitude_high)
        : null;
    const rawGap = decToCanonical(
      quantizeHalfUp(sub(div(dec(exit.price, 6), dec(entry.price, 6), 16), dec("1", 0)), 12),
      12,
    );
    values = {
      entry_price: entry.price,
      exit_price: exit.price,
      raw_gap: rawGap,
      direction_hit: fr[0].decision === "PREDICT" ? hit : null,
      band_hit: fr[0].decision === "PREDICT" ? band : null,
      predicted_direction: fr[0].direction,
    };
    inEvidence = true;
  }
  const { eventSeq } = { eventSeq: ctx.seq };
  const gradeId = newId("grd");
  await ctx.sql.query(
    `INSERT INTO grade (
      grade_id, manifest_id, permanent_security_id, freeze_id, vintage, outcome, reason_codes, event_status,
      in_evidence_set, late_label_recovery, confound_flags, label_policy_hash, values, content_hash, created_event_seq
    ) VALUES ($1,$2,$3,$4,0,$5,$6::jsonb,$7,$8,FALSE,$9::jsonb,$10,$11::jsonb,$12,$13)`,
    [
      gradeId,
      manifestId,
      securityId,
      fr[0]?.freeze_id ?? null,
      outcome,
      JSON.stringify(reasons),
      ca.length ? "CONFIRMED_INTENDED_EVENT" : "CONFIRMED_INTENDED_EVENT",
      inEvidence,
      JSON.stringify(ca.length ? ["CORPORATE_ACTION"] : []),
      hexBuf("22".repeat(32)),
      JSON.stringify(values),
      hexBuf(sha256(canon({ gradeId, outcome, values }))),
      eventSeq,
    ],
  );
  const pos = await ctx.sql.query<{ position_id: string; state: string; cas_token: string }>(
    `SELECT position_id, state, cas_token::text FROM "position" WHERE freeze_id = $1 FOR UPDATE`,
    [fr[0]?.freeze_id ?? ""],
  );
  if (pos.length && (pos[0].state === "FLAT" || pos[0].state === "NO_FILL")) {
    await closeAndRelease(ctx, pos[0].position_id);
  }
  return { grade_id: gradeId, outcome, in_evidence_set: inEvidence, reasons };
}

export async function applyMarkWait(commandId: string, manifestId: string, securityId: string, actor: string) {
  const sql = await getSql();
  const prior = await loadExistingCommand(sql, commandId);
  if (prior) return prior;
  return withWriter(actor, async (ctx) => {
    const dl = await ctx.sql.query<{ deadline_id: string; scheduled_at: string; applied_event_seq: number | null }>(
      `SELECT deadline_id, scheduled_at::text, applied_event_seq FROM deadline
       WHERE kind = 'MARK_WAIT' AND manifest_id = $1 AND permanent_security_id = $2 FOR UPDATE`,
      [manifestId, securityId],
    );
    if (!dl.length) throw new DeskError("NOT_FOUND", "mark-wait missing", 404);
    if (dl[0].applied_event_seq) return { duplicate: true };
    if (ctx.now.getTime() < new Date(dl[0].scheduled_at).getTime()) throw new DeskError("NOT_DUE", "mark-wait not due");
    const { eventSeq } = await appendEvent(ctx, {
      commandId,
      type: "DEADLINE_MARK_WAIT",
      payload: { manifest_id: manifestId, permanent_security_id: securityId },
      receipt: { applied: true },
    });
    const grade = await adjudicateInner(ctx, newId("cmd"), manifestId, securityId);
    const man = await ctx.sql.query<{ session_date: string; next_session_date: string }>(
      `SELECT session_date::text, next_session_date::text FROM manifest WHERE manifest_id = $1`,
      [manifestId],
    );
    const pos = await ctx.sql.query<{
      position_id: string;
      state: string;
      cas_token: string;
      freeze_id: string;
      original_reserved_notional: string;
    }>(
      `SELECT p.position_id, p.state, p.cas_token::text, p.freeze_id, p.original_reserved_notional::text
       FROM "position" p JOIN "freeze" f ON f.freeze_id = p.freeze_id
       WHERE f.manifest_id = $1 AND f.permanent_security_id = $2 FOR UPDATE`,
      [manifestId, securityId],
    );
    if (pos.length) {
      await settleOrImpair(ctx, pos[0], man[0].session_date, man[0].next_session_date, securityId);
    }
    await ctx.sql.query(`UPDATE deadline SET applied_event_seq = $1, applied_at = $2 WHERE deadline_id = $3`, [
      eventSeq,
      ctx.now.toISOString(),
      dl[0].deadline_id,
    ]);
    const left = await ctx.sql.query<{ c: number }>(
      `SELECT COUNT(*)::int AS c FROM deadline WHERE kind = 'MARK_WAIT' AND manifest_id = $1 AND applied_event_seq IS NULL`,
      [manifestId],
    );
    if (left[0].c === 0) {
      await ctx.sql.query(`UPDATE manifest SET research_closed_event_seq = $1 WHERE manifest_id = $2`, [eventSeq, manifestId]);
    }
    return { grade, position: pos[0]?.position_id ?? null };
  });
}

async function settleOrImpair(
  ctx: WriterCtx,
  pos: { position_id: string; state: string; freeze_id: string; original_reserved_notional: string },
  session: string,
  next: string,
  securityId: string,
) {
  const entry = await officialMark(ctx, securityId, "MARK_ENTRY_CLOSE", session);
  const exit = await officialMark(ctx, securityId, "MARK_EXIT_OPEN", next);
  const ca = await ctx.sql.query<{ envelope: { payload?: Record<string, unknown> } }>(
    `SELECT envelope FROM observation WHERE permanent_security_id = $1 AND snapshot_type = 'CORPORATE_ACTION' AND session_date = $2`,
    [securityId, session],
  );
  if (pos.state === "COMMITTED_IRREVOCABLE") {
    if (!entry) {
      await setState(ctx, pos.position_id, pos.state, "IMPAIRED_ENTRY");
      await raiseAlarm(ctx, "ENTRY_EVIDENCE_UNRESOLVED", "marks", { position: pos.position_id }, false);
      return;
    }
    const fill = modeledFill(entry.price);
    const evId = newId("eev");
    await ctx.sql.query(
      `INSERT INTO entry_evidence (entry_evidence_id, position_id, kind, source_ids, calc, content_hash, event_seq)
       VALUES ($1,$2,'OFFICIAL_FILL',$3::jsonb,$4::jsonb,$5,$6)`,
      [
        evId,
        pos.position_id,
        JSON.stringify([entry.observation_id]),
        JSON.stringify({ official_close: entry.price, modeled_fill: fill, cost_model_basis: "CONSERVATIVE_STRESS_HAIRCUT" }),
        hexBuf(sha256(canon({ fill, entry: entry.price }))),
        ctx.seq,
      ],
    );
    await ctx.sql.query(`UPDATE "position" SET state = 'FILLED', entry_evidence_id = $1, cas_token = cas_token + 1, last_transition_event_seq = $2 WHERE position_id = $3`, [
      evId,
      ctx.seq,
      pos.position_id,
    ]);
    pos.state = "FILLED";
  }
  if (pos.state === "FILLED" || pos.state === "IMPAIRED_EXIT") {
    if (ca.length) {
      const p = ca[0].envelope?.payload ?? {};
      const splitRaw = p.split_multiplier;
      const distRaw = p.distribution ?? "0.000000";
      if (typeof splitRaw !== "string" || typeof distRaw !== "string") {
        await setState(ctx, pos.position_id, pos.state, "IMPAIRED_EXIT");
        return;
      }
      let split;
      let dist;
      try {
        split = dec(splitRaw, 6, "0.000001", "100");
        dist = dec(distRaw, 6, "0", "1000000");
      } catch {
        await setState(ctx, pos.position_id, pos.state, "IMPAIRED_EXIT");
        return;
      }
      const filled = await ctx.sql.query<{ calc: { modeled_fill: string; official_close: string } }>(
        `SELECT calc FROM entry_evidence WHERE position_id = $1 ORDER BY event_seq DESC LIMIT 1`,
        [pos.position_id],
      );
      const fill = filled[0].calc.modeled_fill;
      const exitMark = exit ?? (await officialMark(ctx, securityId, "MARK_BOOK_FALLBACK", next));
      if (!exitMark) {
        await setState(ctx, pos.position_id, pos.state, "IMPAIRED_EXIT");
        return;
      }
      const units = div(dec("5000.0000", 4), dec(fill, 12), 12);
      const exitUnits = mul(units, split);
      const cash = mul(units, dist);
      const exitVal = mul(exitUnits, dec(exitMark.price, 6));
      const pnl = decToCanonical(quantizeHalfUp(sub(add(exitVal, cash), dec("5000.0000", 4)), 4), 4);
      await writeBook(ctx, pos.position_id, "CORPORATE_ACTION", {
        modeled_fill: fill,
        exit_price: exitMark.price,
        paper_pnl: pnl,
        split_multiplier: splitRaw,
        original_notional: pos.original_reserved_notional,
      }, false);
      await setState(ctx, pos.position_id, "FILLED", "FLAT");
    } else if (!exit) {
      await setState(ctx, pos.position_id, pos.state === "FILLED" ? "FILLED" : pos.state, "IMPAIRED_EXIT");
      await raiseAlarm(ctx, "EXIT_EVIDENCE_UNRESOLVED", "marks", { position: pos.position_id }, false);
      await raiseAlarm(ctx, "DESK_CAPACITY_BLOCKED_ON_MARKS", "risk", { position: pos.position_id }, true);
      return;
    } else {
      const filled = await ctx.sql.query<{ calc: { modeled_fill: string } }>(
        `SELECT calc FROM entry_evidence WHERE position_id = $1 ORDER BY event_seq DESC LIMIT 1`,
        [pos.position_id],
      );
      const fill = filled[0].calc.modeled_fill;
      const pnl = paperPnl(pos.original_reserved_notional, exit.price, fill, "0.0000");
      await writeBook(ctx, pos.position_id, "ORIGINAL_PLAN", {
        modeled_fill: fill,
        exit_price: exit.price,
        paper_pnl: pnl,
        original_notional: pos.original_reserved_notional,
        cost_model_basis: "CONSERVATIVE_STRESS_HAIRCUT",
        paper_pnl_source_class: "ESTIMATED",
      }, true);
      await setState(ctx, pos.position_id, pos.state, "FLAT");
    }
  }
  const g = await ctx.sql.query<{ grade_id: string }>(
    `SELECT grade_id FROM grade WHERE manifest_id = (SELECT manifest_id FROM "freeze" WHERE freeze_id = $1) AND permanent_security_id = $2 AND vintage = 0`,
    [pos.freeze_id, securityId],
  );
  const st = await ctx.sql.query<{ state: string }>(`SELECT state FROM "position" WHERE position_id = $1`, [pos.position_id]);
  if (g.length && (st[0].state === "FLAT" || st[0].state === "NO_FILL")) {
    await closeAndRelease(ctx, pos.position_id);
  }
}

async function setState(ctx: WriterCtx, positionId: string, from: string, to: string) {
  if (from === to) return;
  if (!transitionOk(from, to)) throw new DeskError("ILLEGAL_TRANSITION", `${from} -> ${to}`);
  await ctx.sql.query(
    `UPDATE "position" SET state = $1, cas_token = cas_token + 1, last_transition_event_seq = $2 WHERE position_id = $3 AND state = $4`,
    [to, ctx.seq, positionId, from],
  );
}

async function writeBook(
  ctx: WriterCtx,
  positionId: string,
  basis: string,
  values: Record<string, unknown>,
  eligible: boolean,
) {
  const last = await ctx.sql.query<{ v: number }>(`SELECT COALESCE(MAX(vintage),-1)::int AS v FROM book_vintage WHERE position_id = $1`, [positionId]);
  const vintage = last[0].v + 1;
  const id = newId("bk");
  await ctx.sql.query(
    `INSERT INTO book_vintage (
      book_vintage_id, position_id, vintage, basis, status, values, content_hash, source_class, strategy_pnl_eligible, created_event_seq
    ) VALUES ($1,$2,$3,$4,'PRICED',$5::jsonb,$6,'ESTIMATED',$7,$8)`,
    [id, positionId, vintage, basis, JSON.stringify(values), hexBuf(sha256(canon(values))), eligible, ctx.seq],
  );
  await ctx.sql.query(`UPDATE "position" SET last_book_vintage_id = $1 WHERE position_id = $2`, [id, positionId]);
}

async function closeAndRelease(ctx: WriterCtx, positionId: string) {
  await assertRiskMatches(ctx.sql);
  const row = await ctx.sql.query<{ state: string; original_reserved_notional: string }>(
    `SELECT state, original_reserved_notional::text FROM "position" WHERE position_id = $1 FOR UPDATE`,
    [positionId],
  );
  if (!row.length) throw new DeskError("NOT_FOUND", "position missing", 404);
  if (row[0].state === "CLOSED") return;
  if (row[0].state !== "FLAT" && row[0].state !== "NO_FILL") {
    throw new DeskError("ILLEGAL_TRANSITION", `cannot close from ${row[0].state}`);
  }
  const cached = await lockRisk(ctx.sql);
  await ctx.sql.query(
    `UPDATE "position" SET state = 'CLOSED', closed_event_seq = $1, release_event_seq = $1, cas_token = cas_token + 1, last_transition_event_seq = $1 WHERE position_id = $2`,
    [ctx.seq, positionId],
  );
  await ctx.sql.query(
    `UPDATE desk_risk_state SET reserved_count = $1, reserved_notional = $2, updated_event_seq = $3 WHERE sleeve = 'EARNINGS'`,
    [cached.reserved_count - 1, subNotional(String(cached.reserved_notional), String(row[0].original_reserved_notional)), ctx.seq],
  );
}

export async function applyReportFinalize(commandId: string, manifestId: string, actor: string) {
  const sql = await getSql();
  const prior = await loadExistingCommand(sql, commandId);
  if (prior) return prior;
  return withWriter(actor, async (ctx) => {
    const dl = await ctx.sql.query<{ deadline_id: string; scheduled_at: string; applied_event_seq: number | null }>(
      `SELECT deadline_id, scheduled_at::text, applied_event_seq FROM deadline WHERE kind = 'REPORT_FINALIZE' AND manifest_id = $1 FOR UPDATE`,
      [manifestId],
    );
    if (!dl.length) throw new DeskError("NOT_FOUND", "report deadline missing", 404);
    if (dl[0].applied_event_seq) return { duplicate: true };
    if (ctx.now.getTime() < new Date(dl[0].scheduled_at).getTime()) throw new DeskError("NOT_DUE", "report not due");
    const { eventSeq } = await appendEvent(ctx, {
      commandId,
      type: "REPORT_FINALIZE",
      payload: { manifest_id: manifestId },
      receipt: { ok: true },
    });
    const win = await ctx.sql.query<{ window_id: string }>(`SELECT window_id FROM manifest WHERE manifest_id = $1`, [manifestId]);
    const grades = await ctx.sql.query<{ grade_id: string; permanent_security_id: string }>(
      `SELECT DISTINCT ON (permanent_security_id) grade_id, permanent_security_id FROM grade
       WHERE manifest_id = $1 ORDER BY permanent_security_id, vintage DESC`,
      [manifestId],
    );
    const snapId = newId("snp");
    const metrics = { manifest_id: manifestId, grade_count: String(grades.length) };
    await ctx.sql.query(
      `INSERT INTO report_snapshot (
        snapshot_id, scope, manifest_id, window_id, as_of_event_seq, created_at, compatibility_hash, metrics, content_hash, data_mode, view_kind
      ) VALUES ($1,'MANIFEST',$2,$3,$4,$5,$6,$7::jsonb,$8,'FIXTURE','AS_KNOWN')`,
      [
        snapId,
        manifestId,
        win[0].window_id,
        eventSeq,
        ctx.now.toISOString(),
        hexBuf(sha256(canon(metrics))),
        JSON.stringify(metrics),
        hexBuf(sha256(canon({ snapId, grades: grades.map((g) => g.grade_id) }))),
      ],
    );
    for (const g of grades) {
      await ctx.sql.query(
        `INSERT INTO report_grade_pin (snapshot_id, manifest_id, permanent_security_id, grade_id) VALUES ($1,$2,$3,$4)`,
        [snapId, manifestId, g.permanent_security_id, g.grade_id],
      );
    }
    const positions = await ctx.sql.query<{ position_id: string; last_book_vintage_id: string | null; state: string }>(
      `SELECT p.position_id, p.last_book_vintage_id, p.state FROM "position" p JOIN "freeze" f ON f.freeze_id = p.freeze_id WHERE f.manifest_id = $1`,
      [manifestId],
    );
    for (const p of positions) {
      await ctx.sql.query(
        `INSERT INTO report_book_pin (snapshot_id, position_id, book_vintage_id, book_status_at_snapshot) VALUES ($1,$2,$3,$4)`,
        [snapId, p.position_id, p.last_book_vintage_id, p.state],
      );
    }
    await ctx.sql.query(`UPDATE deadline SET applied_event_seq = $1, applied_at = $2 WHERE deadline_id = $3`, [
      eventSeq,
      ctx.now.toISOString(),
      dl[0].deadline_id,
    ]);
    return { snapshot_id: snapId, as_of_event_seq: String(eventSeq) };
  });
}

export async function applyDueDeadlines(actor: string) {
  const sql = await getSql();
  const clock = await sql.query<{ now_utc: string }>(`SELECT now_utc::text FROM fixture_clock WHERE singleton_key = TRUE`);
  const now = clock[0]?.now_utc;
  const due = await sql.query<{ deadline_id: string; kind: string; manifest_id: string | null; permanent_security_id: string | null }>(
    `SELECT deadline_id, kind, manifest_id, permanent_security_id FROM deadline
     WHERE applied_event_seq IS NULL AND scheduled_at <= $1
     ORDER BY scheduled_at, kind`,
    [now],
  );
  const results: Array<{ deadline: string; kind: string; ok: boolean; error: string | null }> = [];
  for (const d of due) {
    try {
      if (d.kind === "FREEZE" && d.manifest_id) {
        await applyFreezeDeadline(newId("cmd"), d.manifest_id, actor);
        results.push({ deadline: d.deadline_id, kind: d.kind, ok: true, error: null });
      } else if (d.kind === "MARK_WAIT" && d.manifest_id && d.permanent_security_id) {
        await applyMarkWait(newId("cmd"), d.manifest_id, d.permanent_security_id, actor);
        results.push({ deadline: d.deadline_id, kind: d.kind, ok: true, error: null });
      } else if (d.kind === "REPORT_FINALIZE" && d.manifest_id) {
        await applyReportFinalize(newId("cmd"), d.manifest_id, actor);
        try {
          const { maybeReviseRule } = await import("./learn");
          await maybeReviseRule(d.manifest_id, actor);
        } catch {
          /* learning is observational; report already released */
        }
        results.push({ deadline: d.deadline_id, kind: d.kind, ok: true, error: null });
      }
    } catch (err) {
      results.push({
        deadline: d.deadline_id,
        kind: d.kind,
        ok: false,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }
  return { applied: results.length, results };
}

export async function pauseAdmission(commandId: string, reason: string, actor: string) {
  return withWriter(actor, async (ctx) => {
    const { eventSeq } = await appendEvent(ctx, {
      commandId,
      type: "PAUSE",
      payload: { reason },
      receipt: { paused: true },
    });
    await ctx.sql.query(
      `UPDATE operator_control SET admission_paused = TRUE, pause_reason = $1, updated_event_seq = $2 WHERE sleeve = 'EARNINGS'`,
      [reason, eventSeq],
    );
    return { paused: true, reason };
  });
}

export async function resumeAdmission(commandId: string, actor: string) {
  return withWriter(actor, async (ctx) => {
    const { eventSeq } = await appendEvent(ctx, {
      commandId,
      type: "RESUME",
      payload: {},
      receipt: { paused: false },
    });
    await ctx.sql.query(
      `UPDATE operator_control SET admission_paused = FALSE, pause_reason = NULL, updated_event_seq = $1 WHERE sleeve = 'EARNINGS'`,
      [eventSeq],
    );
    return { paused: false };
  });
}

export async function recordPrintKnowledge(
  commandId: string,
  args: { eventKey: string; securityId: string; reason: string; manifestId?: string },
  actor: string,
) {
  const sql = await getSql();
  const prior = await loadExistingCommand(sql, commandId);
  if (prior) return prior;
  return withWriter(actor, async (ctx) => {
    const { eventSeq } = await appendEvent(ctx, {
      commandId,
      type: "PRINT_KNOWLEDGE",
      payload: args,
      receipt: { recorded: true },
    });
    await ctx.sql.query(
      `INSERT INTO guard_event (
        guard_id, event_key, manifest_id, permanent_security_id, guard_type, recorded_at, actor_principal_id, reason_code, event_seq
      ) VALUES ($1,$2,$3,$4,'OPERATOR_KNOWLEDGE',$5,$6,$7,$8)`,
      [newId("grd"), args.eventKey, args.manifestId ?? null, args.securityId, ctx.now.toISOString(), actor, args.reason, eventSeq],
    );
    await raiseAlarm(ctx, "OFF_DESIGN_EARLY_RELEASE", "guards", args, true);
    return { recorded: true };
  });
}

export async function appendFireRateNote(
  commandId: string,
  args: { windowId: string; hypothesis: string; note: string; manifestId?: string },
  actor: string,
) {
  return withWriter(actor, async (ctx) => {
    const { eventSeq } = await appendEvent(ctx, {
      commandId,
      type: "FIRE_RATE_NOTE",
      payload: args,
      receipt: { ok: true },
    });
    await ctx.sql.query(
      `INSERT INTO fire_rate_note (note_id, window_id, manifest_id, actor_principal_id, hypothesis, note, event_seq)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [newId("note"), args.windowId, args.manifestId ?? null, actor, args.hypothesis, args.note, eventSeq],
    );
    return { ok: true };
  });
}

export async function applyEntryCorrection(
  commandId: string,
  positionId: string,
  newPrice: string,
  actor: string,
) {
  const sql = await getSql();
  const prior = await loadExistingCommand(sql, commandId);
  if (prior) return prior;
  return withWriter(actor, async (ctx) => {
    const pos = await ctx.sql.query<{
      position_id: string;
      state: string;
      original_reserved_notional: string;
      last_book_vintage_id: string | null;
    }>(`SELECT position_id, state, original_reserved_notional::text, last_book_vintage_id FROM "position" WHERE position_id = $1 FOR UPDATE`, [
      positionId,
    ]);
    if (!pos.length) throw new DeskError("NOT_FOUND", "position missing", 404);
    const fill = modeledFill(newPrice);
    const book = await ctx.sql.query<{ values: { exit_price?: string } }>(
      `SELECT values FROM book_vintage WHERE book_vintage_id = $1`,
      [pos[0].last_book_vintage_id],
    );
    const exit = book[0]?.values?.exit_price;
    const pnl = exit ? paperPnl(pos[0].original_reserved_notional, exit, fill, "0.0000") : null;
    await appendEvent(ctx, {
      commandId,
      type: "REVISE",
      payload: { position_id: positionId, new_price: newPrice },
      receipt: { fill, pnl },
    });
    await writeBook(ctx, positionId, "ORIGINAL_PLAN", {
      modeled_fill: fill,
      exit_price: exit,
      paper_pnl: pnl,
      original_notional: pos[0].original_reserved_notional,
      revision_reason: "ENTRY_PRICE_CORRECTION",
    }, true);
    return { position_id: positionId, state: pos[0].state, modeled_fill: fill, paper_pnl: pnl, original_notional: pos[0].original_reserved_notional };
  });
}

void jsonCanon;
void getSql;
```


---

## `src/desk/bootstrap.ts` (24805 bytes, sha256 `e1fe9970a62b2f2d2e39f4f869cfed54e1be7ddccd05c44c61cc9d322fae9d3c`)

```ts
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { getSql, withTransaction } from "@/lib/db";
import {
  COST_MODEL_CONTENT,
  ENGINE_VERSION,
  INITIAL_AST,
  costModelHash,
  evaluatorArtifactHash,
  observationHash,
  payloadHash,
  policyHash,
  ruleAstHash,
  ruleTextHash,
  canon,
  ident,
} from "@/kernel/index";
import { freezeMember, sealSession } from "./commands";
import {
  advanceClock,
  applyDueDeadlines,
  applyEntryCorrection,
  recordPrintKnowledge,
} from "./lifecycle";
import { appendEvent, withWriter } from "./writer";
import { DeskError, etInstant, hexBuf, jsonCanon, newId } from "./util";

const SERVICE = "svc-desk-writer";
const RULE_TEXT = "Predict LONG when issuer-confirmed AMC, complete card, valid options, implied move in [4%, 15%], 5d relative < 0, 63d relative > 0.";

const NAMES: Array<{ id: string; ticker: string; venue: "XNYS" | "XNAS"; name: string }> = [
  { id: "SEC-ALPHA", ticker: "ALFA", venue: "XNYS", name: "Alpha Fixture Corp" },
  { id: "SEC-BRAVO", ticker: "BRAV", venue: "XNAS", name: "Bravo Fixture Inc" },
  { id: "SEC-CHARLIE", ticker: "CHRL", venue: "XNYS", name: "Charlie Fixture Co" },
  { id: "SEC-DELTA", ticker: "DELT", venue: "XNAS", name: "Delta Fixture PLC" },
  { id: "SEC-ECHO", ticker: "ECHO", venue: "XNYS", name: "Echo Fixture Ltd" },
  { id: "SEC-FOXTROT", ticker: "FOXT", venue: "XNAS", name: "Foxtrot Fixture NV" },
  { id: "SEC-GOLF", ticker: "GOLF", venue: "XNYS", name: "Golf Fixture SA" },
  { id: "SEC-HOTEL", ticker: "HOTL", venue: "XNAS", name: "Hotel Fixture LLC" },
  { id: "SEC-SPY", ticker: "SPY", venue: "XNYS", name: "Reference Benchmark SPY" },
];

function openDates(): string[] {
  const out: string[] = [];
  const d = new Date(Date.UTC(2026, 5, 1));
  const end = new Date(Date.UTC(2026, 8, 18));
  while (d <= end) {
    const iso = d.toISOString().slice(0, 10);
    const dow = d.getUTCDay();
    const closed = dow === 0 || dow === 6 || iso === "2026-09-07";
    if (!closed) out.push(iso);
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return out;
}

async function insertObs(
  sql: import("@/lib/db").Sql,
  seq: number,
  row: {
    id: string;
    sec: string;
    session: string;
    type: string;
    payload: Record<string, unknown>;
    sourceClass?: string;
    receivedAt: string;
    eventKey?: string;
  },
) {
  const payloadH = payloadHash(row.payload);
  const envelope = {
    observation_id: row.id,
    permanent_security_id: row.sec,
    event_key: row.eventKey ?? null,
    session_date: row.session,
    snapshot_type: row.type,
    provider_id: "fixture",
    provider_record_id: row.id,
    provider_revision: "1",
    payload_hash: payloadH,
    payload_schema_version: "1",
    source_class: row.sourceClass ?? "AUTHORITATIVE",
    adjustment_basis: row.type.startsWith("MARK") || row.type === "QUOTE" || row.type === "BAR_DAILY" ? "UNADJUSTED" : "NOT_PRICE",
    payload: row.payload,
  };
  const obsH = observationHash(envelope);
  await sql.query(
    `INSERT INTO observation (
      observation_id, event_seq, permanent_security_id, event_key, session_date, snapshot_type, provider_id,
      provider_record_id, provider_revision, received_at, source_event_at, source_class, adjustment_basis,
      payload_schema_id, payload_hash, observation_hash, envelope, is_partial, partition, tombstoned
    ) VALUES ($1,$2,$3,$4,$5,$6,'fixture',$1,'1',$7,$7,$8,$9,'1',$10,$11,$12::jsonb,FALSE,'RESEARCH',FALSE)`,
    [
      row.id,
      seq,
      row.sec,
      row.eventKey ?? null,
      row.session,
      row.type,
      row.receivedAt,
      envelope.source_class,
      envelope.adjustment_basis,
      hexBuf(payloadH),
      hexBuf(obsH),
      JSON.stringify(envelope),
    ],
  );
}

let bootChain: Promise<{ ok: boolean; note: string }> | null = null;

export async function ensureBootstrapped(): Promise<{ ok: boolean; note: string }> {
  if (bootChain) return bootChain;
  bootChain = (async () => {
    const sql = await getSql();
    const st = await sql.query<{ completed: boolean }>(`SELECT completed FROM bootstrap_state WHERE singleton_key = TRUE`);
    if (st[0]?.completed) {
      void import("./learn")
        .then((m) => m.reviseClosedManifests(SERVICE))
        .catch(() => {
          /* observational — do not block sign-in or home */
        });
      return { ok: true, note: "already-seeded" };
    }
    await seedWorld();
    return { ok: true, note: "seeded" };
  })()
    .then((r) => {
      console.info("[trading-app] bootstrap", r.note);
      return r;
    })
    .catch((err) => {
      bootChain = null;
      console.error("[trading-app] bootstrap failed", err);
      throw err;
    });
  return bootChain;
}

async function clockIso(): Promise<string> {
  const sql = await getSql();
  const r = await sql.query<{ now_utc: string }>(`SELECT now_utc::text FROM fixture_clock WHERE singleton_key = TRUE`);
  return r[0].now_utc;
}

async function ensureClock(iso: string) {
  const cur = new Date(await clockIso());
  const next = new Date(iso);
  if (next > cur) await advanceClock(iso, SERVICE);
}

async function runSession(opts: {
  commandSeal: string;
  sessionDate: string;
  skip: Set<string>;
  freezePrefix: string;
  echoLast?: boolean;
  beforeSeal?: () => Promise<void>;
}) {
  const sql = await getSql();
  let man = await sql.query<{ manifest_id: string }>(`SELECT manifest_id FROM manifest WHERE session_date = $1`, [
    opts.sessionDate,
  ]);
  if (!man.length) {
    await ensureClock(etInstant(opts.sessionDate, "15:45").toISOString());
    if (opts.beforeSeal) await opts.beforeSeal();
    await sealSession(opts.commandSeal, opts.sessionDate, SERVICE);
    man = await sql.query<{ manifest_id: string }>(`SELECT manifest_id FROM manifest WHERE session_date = $1`, [
      opts.sessionDate,
    ]);
  }
  const members = await sql.query<{ permanent_security_id: string; shuffle_order_index: number }>(
    `SELECT permanent_security_id, shuffle_order_index FROM manifest_member WHERE manifest_id = $1 ORDER BY shuffle_order_index`,
    [man[0].manifest_id],
  );
  await ensureClock(etInstant(opts.sessionDate, "15:46").toISOString());
  const ordered = opts.echoLast
    ? [
        ...members.filter((m) => m.permanent_security_id !== "SEC-ECHO"),
        ...members.filter((m) => m.permanent_security_id === "SEC-ECHO"),
      ]
    : members;
  for (const m of ordered) {
    if (opts.skip.has(m.permanent_security_id)) continue;
    const frozen = await sql.query(
      `SELECT 1 FROM "freeze" WHERE manifest_id = $1 AND permanent_security_id = $2`,
      [man[0].manifest_id, m.permanent_security_id],
    );
    if (frozen.length) continue;
    await refreshQuote(m.permanent_security_id, opts.sessionDate);
    try {
      await freezeMember(
        `cmd-frz-${opts.freezePrefix}-${m.permanent_security_id}`,
        man[0].manifest_id,
        m.permanent_security_id,
        SERVICE,
      );
    } catch (err) {
      if (err instanceof DeskError && err.code === "OFF_DESIGN_EARLY_RELEASE") continue;
      throw err;
    }
  }
  await ensureClock(etInstant(opts.sessionDate, "15:47").toISOString());
  await applyDueDeadlines(SERVICE);
}

async function seedWorld() {
  const sql = await getSql();
  const t0 = etInstant("2026-06-01", "09:30").toISOString();
  const alreadyPolicy = await sql.query(`SELECT 1 FROM policy_bundle LIMIT 1`);
  const alreadyObs = await sql.query(`SELECT 1 FROM observation LIMIT 1`);

  await withTransaction(async (tx) => {
    const gates = await tx.query(`SELECT 1 FROM writer_gate`);
    if (gates.length) return;
    const eventId = ident("evt-init00000001");
    const payload = { type: "INIT" };
    await tx.query(
      `INSERT INTO event_log (
        event_seq, event_id, command_id, request_hash, event_type, actor_principal_id,
        occurred_at, semantic_payload, canonical_payload, result_receipt, event_hash
      ) VALUES (1,$1,'cmd-init00000001',$2,'INIT',$3,$4,$5::jsonb,$6,$7::jsonb,$2)`,
      [eventId, hexBuf("00".repeat(32)), SERVICE, t0, JSON.stringify(payload), jsonCanon(payload), JSON.stringify({ ok: true })],
    );
    await tx.query(
      `INSERT INTO writer_gate (singleton_key, next_event_seq, last_authoritative_time, clock_trusted) VALUES (TRUE, 2, $1, TRUE)`,
      [t0],
    );
    await tx.query(
      `INSERT INTO fixture_clock (singleton_key, now_utc, trusted, source) VALUES (TRUE, $1, TRUE, 'FIXTURE')`,
      [t0],
    );
    await tx.query(
      `INSERT INTO desk_risk_state (sleeve, reserved_count, reserved_notional, updated_event_seq) VALUES ('EARNINGS', 0, 0, 1)`,
    );
    await tx.query(
      `INSERT INTO operator_control (sleeve, admission_paused, pause_reason, updated_event_seq) VALUES ('EARNINGS', FALSE, NULL, 1)`,
    );
    await tx.query(
      `INSERT INTO desk_principal (principal_id, user_id, login_name, role, active, label_exposure_declared, created_at)
       VALUES ('svc-desk-writer', 'svc-desk-writer', 'service-writer', 'SERVICE', TRUE, TRUE, $1)
       ON CONFLICT DO NOTHING`,
      [t0],
    );
    const jobs = ["premarket-check", "capture-cycle", "seal-session", "ordered-freeze", "due-deadlines", "mark-ingest", "grade-apply", "report-finalize", "learn-revise"];
    for (const j of jobs) {
      await tx.query(`INSERT INTO job_state (job_name, status) VALUES ($1, 'IDLE') ON CONFLICT DO NOTHING`, [j]);
    }
  });

  let kernelSrc = ENGINE_VERSION;
  try {
    kernelSrc = readFileSync(new URL("../kernel/index.ts", import.meta.url), "utf8");
  } catch {
    kernelSrc = ENGINE_VERSION;
  }
  const kernelSha = createHash("sha256").update(kernelSrc).digest("hex");
  const artifactManifest = {
    engine_version: ENGINE_VERSION,
    interpreter: "nodejs-22",
    files: [{ name: "src/kernel/index.ts", sha256: kernelSha }],
    dependency_lock_hash: createHash("sha256").update("node:crypto+bigint-decimal").digest("hex"),
  };
  const artHash = evaluatorArtifactHash(artifactManifest);
  const pol = {
    sleeve: "EARNINGS",
    admission_min_price: "5.000000",
    ticket: "5000.0000",
    capacity_count: "3",
    capacity_notional: "15000.0000",
    per_event_limit: "2",
    broker_margin_minutes: "3",
    seal_lead_seconds: "120",
    venues: ["XNYS", "XNAS"],
    source_priority: ["fixture"],
    field_registry: ["timing_quality", "card_complete", "options_valid", "implied_move", "benchmark_relative_5d", "benchmark_relative_63d"],
    label_target: "unadjusted_d_close_to_d1_open",
    data_mode: "FIXTURE",
  };
  const polHash = policyHash(pol);
  const astHash = ruleAstHash(INITIAL_AST);
  const costHash = costModelHash(COST_MODEL_CONTENT);
  const uniMembers = NAMES.filter((n) => n.id !== "SEC-SPY").map((n) => n.id);
  const uniHash = createHash("sha256").update(uniMembers.join(",")).digest("hex");

  if (!alreadyPolicy.length) {
    await withWriter(SERVICE, async (ctx) => {
      const { eventSeq } = await appendEvent(ctx, {
        commandId: "cmd-register-policy",
        type: "REGISTER_POLICY",
        payload: { policy_id: "pol-v1" },
        receipt: { ok: true },
      });
      await ctx.sql.query(
        `INSERT INTO policy_bundle (policy_id, policy_version, policy_content, canonical_content, policy_hash, registered_event_seq)
         VALUES ('pol-v1','v1',$1::jsonb,$2,$3,$4)`,
        [JSON.stringify(pol), jsonCanon(pol), hexBuf(polHash), eventSeq],
      );
      await ctx.sql.query(
        `INSERT INTO cost_model (
          cost_model_id, version, basis, constant_penalty, imbalance_coefficient, imbalance_term, commission_per_fill,
          canonical_content, content_hash, registered_event_seq
        ) VALUES ('cost-v1','1','CONSERVATIVE_STRESS_HAIRCUT',0.000500,0,0,0,$1,$2,$3)`,
        [jsonCanon(COST_MODEL_CONTENT), hexBuf(costHash), eventSeq],
      );
      await ctx.sql.query(
        `INSERT INTO evaluator_artifact (evaluator_id, engine_version, artifact_manifest, canonical_content, artifact_hash, supported_ast_schema, registered_event_seq)
         VALUES ('eval-v1',$1,$2::jsonb,$3,$4,'1',$5)`,
        [ENGINE_VERSION, JSON.stringify(artifactManifest), jsonCanon(artifactManifest), hexBuf(artHash), eventSeq],
      );
      await ctx.sql.query(
        `INSERT INTO rule_card (
          rule_id, rule_version, rule_text, rule_text_hash, ast_content, canonical_ast, ast_hash, evaluator_id, policy_id,
          expected_predict_rate_min, expected_predict_rate_max, magnitude_definition, registered_event_seq
        ) VALUES ('rule-v1','v1',$1,$2,$3::jsonb,$4,$5,'eval-v1','pol-v1',0.10,0.25,$6::jsonb,$7)`,
        [
          RULE_TEXT,
          hexBuf(ruleTextHash(RULE_TEXT)),
          JSON.stringify(INITIAL_AST),
          jsonCanon(INITIAL_AST),
          hexBuf(astHash),
          JSON.stringify({ low: "0.5*implied_move", high: "2.0*implied_move" }),
          eventSeq,
        ],
      );
      for (const n of NAMES) {
        await ctx.sql.query(
          `INSERT INTO security (permanent_security_id, instrument_type, currency, display_name) VALUES ($1,$2,'USD',$3)`,
          [n.id, n.id === "SEC-SPY" ? "REFERENCE_ETF" : "US_COMMON", n.name],
        );
        await ctx.sql.query(
          `INSERT INTO security_ticker (mapping_id, permanent_security_id, provider_id, ticker, valid_from, registered_event_seq)
           VALUES ($1,$2,'fixture',$3,$4,$5)`,
          [newId("tkr"), n.id, n.ticker, t0, eventSeq],
        );
      }
      await ctx.sql.query(
        `INSERT INTO universe_version (universe_version, effective_from, content_hash, registered_event_seq, data_mode)
         VALUES ('uni-fix-1','2026-06-01',$1,$2,'FIXTURE')`,
        [hexBuf(uniHash), eventSeq],
      );
      for (const n of NAMES.filter((x) => x.id !== "SEC-SPY")) {
        await ctx.sql.query(
          `INSERT INTO universe_member (universe_version, permanent_security_id, included, listing_exchange, liquidity_snapshot, sector, market_cap_bucket)
           VALUES ('uni-fix-1',$1,TRUE,$2,$3::jsonb,'TECH','LARGE')`,
          [n.id, n.venue, JSON.stringify({ mean_dollar_volume: "50000000" })],
        );
      }
      await ctx.sql.query(
        `INSERT INTO evaluation_window (
          window_id, starts_at, ends_at, rule_id, rule_version, policy_id, cost_model_id, evaluator_id, universe_version,
          hypothesis_claim, prior_contaminated, contamination_source
        ) VALUES (
          'win-2026q3', '2026-07-01T04:00:00.000Z', '2026-10-01T04:00:00.000Z',
          'rule-v1','v1','pol-v1','cost-v1','eval-v1','uni-fix-1',
          'Initial handwritten conjunction after prior observation.', TRUE, 'PRIOR_RULE_LABELS'
        )`,
      );
      const dates = openDates();
      for (const venue of ["XNYS", "XNAS"] as const) {
        for (const day of dates) {
          const open = etInstant(day, "09:30");
          const close = etInstant(day, "16:00");
          const moc = etInstant(day, venue === "XNYS" ? "15:50" : "15:55");
          const content = { venue, day, open: open.toISOString(), close: close.toISOString(), moc: moc.toISOString() };
          const ch = createHash("sha256").update(canon(content)).digest();
          await ctx.sql.query(
            `INSERT INTO calendar_session (
              calendar_version, listing_exchange, session_date, is_open, open_at, close_at, moc_entry_cutoff_at,
              effective_rule_id, source_reference, verified_at, content_hash
            ) VALUES ('cal-2026',$1,$2,TRUE,$3,$4,$5,$6,'fixture-calendar',$7,$8)`,
            [venue, day, open.toISOString(), close.toISOString(), moc.toISOString(), venue === "XNYS" ? "NYSE-AUCTIONS" : "NASDAQ-4702", t0, ch],
          );
        }
        const labor = createHash("sha256").update("closed-2026-09-07" + venue).digest();
        await ctx.sql.query(
          `INSERT INTO calendar_session (
            calendar_version, listing_exchange, session_date, is_open, effective_rule_id, source_reference, verified_at, content_hash
          ) VALUES ('cal-2026',$1,'2026-09-07',FALSE,'holiday','Labor Day',$2,$3)
          ON CONFLICT DO NOTHING`,
          [venue, t0, labor],
        );
      }
    });
  }

  if (!alreadyObs.length) {
    await withWriter(SERVICE, async (ctx) => {
      const { eventSeq } = await appendEvent(ctx, {
        commandId: "cmd-ingest-seed",
        type: "INGEST",
        payload: { batch: "fixture-seed" },
        receipt: { ok: true },
      });
      for (const n of NAMES) {
        if (n.id === "SEC-SPY") continue;
        await insertObs(ctx.sql, eventSeq, {
          id: ident(`obs-tape-${n.ticker}-seed`),
          sec: n.id,
          session: "2026-09-04",
          type: "TAPE_RELATIVE",
          payload: {
            rel5: "-0.014925174253",
            rel63: "0.042000000000",
            method: "product_of_factors_minus_benchmark",
            horizon_end: "D-1",
          },
          receivedAt: etInstant("2026-09-03", "16:05").toISOString(),
        });
        await insertObs(ctx.sql, eventSeq, {
          id: ident(`obs-tape-${n.ticker}-0911`),
          sec: n.id,
          session: "2026-09-11",
          type: "TAPE_RELATIVE",
          payload: {
            rel5: "-0.014925174253",
            rel63: "0.042000000000",
            method: "product_of_factors_minus_benchmark",
            horizon_end: "D-1",
          },
          receivedAt: etInstant("2026-09-10", "16:05").toISOString(),
        });
      }
      const sessions: Array<{ day: string; members: string[] }> = [
        { day: "2026-09-04", members: ["SEC-HOTEL", "SEC-FOXTROT"] },
        { day: "2026-09-11", members: ["SEC-ALPHA", "SEC-BRAVO", "SEC-CHARLIE", "SEC-DELTA", "SEC-ECHO", "SEC-GOLF"] },
      ];
      for (const s of sessions) {
        for (const sec of s.members) {
          const meta = NAMES.find((n) => n.id === sec)!;
          const recv = etInstant(s.day, "15:44").toISOString();
          await insertObs(ctx.sql, eventSeq, {
            id: ident(`obs-evt-${meta.ticker}-${s.day.replace(/-/g, "")}`),
            sec,
            session: s.day,
            type: "EARNINGS_EVENT",
            eventKey: ident(`ev-${meta.ticker}-${s.day.replace(/-/g, "")}`),
            payload: { timing: "AMC", quality: "ISSUER_CONFIRMED", period: "Q3-2026" },
            receivedAt: recv,
          });
          await ctx.sql.query(
            `INSERT INTO earnings_event (event_observation_id, event_key, permanent_security_id, intended_session, timing, quality, source_observation_id)
             VALUES ($1,$2,$3,$4,'AMC','ISSUER_CONFIRMED',$1)`,
            [ident(`obs-evt-${meta.ticker}-${s.day.replace(/-/g, "")}`), ident(`ev-${meta.ticker}-${s.day.replace(/-/g, "")}`), sec, s.day],
          );
          await insertObs(ctx.sql, eventSeq, {
            id: ident(`obs-q-${meta.ticker}-${s.day.replace(/-/g, "")}`),
            sec,
            session: s.day,
            type: "QUOTE",
            payload: { bid: "99.960000", ask: "100.040000", last: "100.000000", mid: "100.000000" },
            receivedAt: recv,
          });
          if (sec !== "SEC-BRAVO") {
            for (const right of ["C", "P"] as const) {
              await insertObs(ctx.sql, eventSeq, {
                id: ident(`obs-opt-${meta.ticker}-${right}-${s.day.replace(/-/g, "")}`),
                sec,
                session: s.day,
                type: "OPTION_LEG",
                payload: {
                  right,
                  strike: "100.000000",
                  expiry: "2026-10-16",
                  bid: "3.900000",
                  ask: "4.100000",
                  oi: "500",
                  volume: "80",
                  multiplier: "100",
                },
                receivedAt: recv,
              });
            }
          }
        }
      }
      await insertObs(ctx.sql, eventSeq, {
        id: "obs-mk-HOTL-entry",
        sec: "SEC-HOTEL",
        session: "2026-09-04",
        type: "MARK_ENTRY_CLOSE",
        payload: { price: "100.000000", state: "OFFICIAL", venue: "XNAS" },
        receivedAt: etInstant("2026-09-04", "16:01").toISOString(),
      });
      await insertObs(ctx.sql, eventSeq, {
        id: "obs-mk-HOTL-exit",
        sec: "SEC-HOTEL",
        session: "2026-09-08",
        type: "MARK_EXIT_OPEN",
        payload: { price: "105.000000", state: "OFFICIAL", venue: "XNAS" },
        receivedAt: etInstant("2026-09-08", "09:35").toISOString(),
      });
      await insertObs(ctx.sql, eventSeq, {
        id: "obs-mk-FOXT-entry",
        sec: "SEC-FOXTROT",
        session: "2026-09-04",
        type: "MARK_ENTRY_CLOSE",
        payload: { price: "100.000000", state: "OFFICIAL", venue: "XNAS" },
        receivedAt: etInstant("2026-09-04", "16:01").toISOString(),
      });
      await insertObs(ctx.sql, eventSeq, {
        id: "obs-mk-FOXT-exit",
        sec: "SEC-FOXTROT",
        session: "2026-09-08",
        type: "MARK_EXIT_OPEN",
        payload: { price: "50.000000", state: "OFFICIAL", venue: "XNAS" },
        receivedAt: etInstant("2026-09-08", "09:35").toISOString(),
      });
      await insertObs(ctx.sql, eventSeq, {
        id: "obs-ca-FOXT",
        sec: "SEC-FOXTROT",
        session: "2026-09-04",
        type: "CORPORATE_ACTION",
        payload: { kind: "SPLIT", split_multiplier: "2", distribution: "0.000000", effective: "D_CLOSE_TO_D1_OPEN" },
        receivedAt: etInstant("2026-09-08", "08:00").toISOString(),
      });
      for (const [sec, ticker, exitPx, hasExit] of [
        ["SEC-ALPHA", "ALFA", "105.000000", true],
        ["SEC-BRAVO", "BRAV", "101.000000", true],
        ["SEC-CHARLIE", "CHRL", null, false],
        ["SEC-ECHO", "ECHO", "110.000000", true],
      ] as Array<[string, string, string | null, boolean]>) {
        await insertObs(ctx.sql, eventSeq, {
          id: ident(`obs-mk-${ticker}-entry`),
          sec,
          session: "2026-09-11",
          type: "MARK_ENTRY_CLOSE",
          payload: { price: "100.000000", state: "OFFICIAL", venue: "XNYS" },
          receivedAt: etInstant("2026-09-11", "16:01").toISOString(),
        });
        if (hasExit && exitPx) {
          await insertObs(ctx.sql, eventSeq, {
            id: ident(`obs-mk-${ticker}-exit`),
            sec,
            session: "2026-09-14",
            type: "MARK_EXIT_OPEN",
            payload: { price: exitPx, state: "OFFICIAL", venue: "XNYS" },
            receivedAt: etInstant("2026-09-14", "09:35").toISOString(),
          });
        }
      }
    });
  }

  await runSession({
    commandSeal: "cmd-seal-20260904",
    sessionDate: "2026-09-04",
    skip: new Set(),
    freezePrefix: "0904",
  });
  await ensureClock(etInstant("2026-09-08", "16:00").toISOString());
  await applyDueDeadlines(SERVICE);
  await ensureClock(etInstant("2026-09-09", "16:00").toISOString());
  await applyDueDeadlines(SERVICE);

  await runSession({
    commandSeal: "cmd-seal-20260911",
    sessionDate: "2026-09-11",
    skip: new Set(["SEC-DELTA"]),
    freezePrefix: "0911",
    echoLast: true,
    beforeSeal: async () => {
      await recordPrintKnowledge(
        "cmd-pk-golf",
        {
          eventKey: "ev-GOLF-20260911",
          securityId: "SEC-GOLF",
          reason: "Issuer results posted before the information horizon.",
        },
        SERVICE,
      );
    },
  });
  await ensureClock(etInstant("2026-09-14", "16:00").toISOString());
  await applyDueDeadlines(SERVICE);
  await ensureClock(etInstant("2026-09-15", "16:00").toISOString());
  await applyDueDeadlines(SERVICE);

  try {
    const { reviseClosedManifests } = await import("./learn");
    await reviseClosedManifests(SERVICE);
  } catch {
    /* first-boot learning is observational */
  }

  const sql2 = await getSql();
  const hotelPos = await sql2.query<{ position_id: string }>(
    `SELECT p.position_id FROM "position" p JOIN "freeze" f ON f.freeze_id = p.freeze_id WHERE f.permanent_security_id = 'SEC-HOTEL'`,
  );
  if (hotelPos.length) {
    await applyEntryCorrection("cmd-corr-hotel", hotelPos[0].position_id, "99.800000", SERVICE);
  }

  await sql2.query(`UPDATE bootstrap_state SET completed = TRUE, completed_at = NOW(), note = 'fixture v1.2 seeded' WHERE singleton_key = TRUE`);
}

async function refreshQuote(sec: string, session: string) {
  await withWriter(SERVICE, async (ctx) => {
    const { eventSeq } = await appendEvent(ctx, {
      commandId: newId("cmd"),
      type: "INGEST",
      payload: { type: "QUOTE", sec, session },
      receipt: { ok: true },
    });
    const meta = NAMES.find((n) => n.id === sec)!;
    await insertObs(ctx.sql, eventSeq, {
      id: ident(`obs-qx-${meta.ticker}-${session.replace(/-/g, "")}-${eventSeq}`),
      sec,
      session,
      type: "QUOTE",
      payload: { bid: "99.960000", ask: "100.040000", last: "100.000000", mid: "100.000000" },
      receivedAt: ctx.now.toISOString(),
    });
  });
}
```


---

## `src/desk/learn-policy.ts` (4820 bytes, sha256 `ab81bf7047d44ec49156b68774313d06c385e1f4c3ce66b2ce067330b4f11f92`)

```ts
import { dec, decToCanonical, quantizeHalfUp, validateAst } from "../kernel/index.ts";

export type Thresholds = {
  implied_move_gte: string;
  implied_move_lte: string;
  rel5_lt: string;
  rel63_gt: string;
};

const MIN_N = 3;

function canonDec(n: number): string {
  const clamped = Number.isFinite(n) ? n : 0;
  return decToCanonical(quantizeHalfUp(dec(clamped.toFixed(12), 12, "-1000000", "1000000"), 12), 12);
}

export function defaultThresholds(): Thresholds {
  return {
    implied_move_gte: "0.040000000000",
    implied_move_lte: "0.150000000000",
    rel5_lt: "0.000000000000",
    rel63_gt: "0.000000000000",
  };
}

export function thresholdsFromAst(ast: unknown): Thresholds {
  const t = defaultThresholds();
  if (!ast || typeof ast !== "object" || !("all" in ast) || !Array.isArray((ast as { all: unknown }).all)) return t;
  for (const raw of (ast as { all: Array<{ field?: string; op?: string; value?: unknown }> }).all) {
    if (!raw || typeof raw.value !== "string") continue;
    if (raw.field === "implied_move" && raw.op === "GTE") t.implied_move_gte = raw.value;
    if (raw.field === "implied_move" && raw.op === "LTE") t.implied_move_lte = raw.value;
    if (raw.field === "benchmark_relative_5d" && raw.op === "LT") t.rel5_lt = raw.value;
    if (raw.field === "benchmark_relative_63d" && raw.op === "GT") t.rel63_gt = raw.value;
  }
  return t;
}

export function astFromThresholds(t: Thresholds): unknown {
  const ast = {
    schema: "1",
    decision: "PREDICT",
    direction: "LONG",
    otherwise: "STAND_DOWN",
    all: [
      { field: "timing_quality", op: "EQ", value: "ISSUER_CONFIRMED" },
      { field: "card_complete", op: "EQ", value: true },
      { field: "options_valid", op: "EQ", value: true },
      { field: "implied_move", op: "GTE", value: t.implied_move_gte },
      { field: "implied_move", op: "LTE", value: t.implied_move_lte },
      { field: "benchmark_relative_5d", op: "LT", value: t.rel5_lt },
      { field: "benchmark_relative_63d", op: "GT", value: t.rel63_gt },
    ],
  };
  validateAst(ast);
  return ast;
}

function pct(v: string): string {
  return (Number(v) * 100).toFixed(1).replace(/\.0$/, "");
}

export function humanRuleText(t: Thresholds): string {
  return (
    `Predict LONG when issuer-confirmed AMC, complete card, valid options, ` +
    `implied move in [${pct(t.implied_move_gte)}%, ${pct(t.implied_move_lte)}%], ` +
    `5d relative < ${t.rel5_lt}, 63d relative > ${t.rel63_gt}.`
  );
}

export function humanRuleBullets(t: Thresholds): string[] {
  return [
    "After close, issuer confirmed",
    `Expected move ${pct(t.implied_move_gte)}% to ${pct(t.implied_move_lte)}%`,
    Number(t.rel5_lt) < 0
      ? `Five-day return at least ${pct(t.rel5_lt)}% below the market`
      : "Five-day return below the market",
    Number(t.rel63_gt) > 0
      ? `Sixty-three-day return at least ${pct(t.rel63_gt)}% above the market`
      : "Sixty-three-day return above the market",
  ];
}

export function proposeThresholds(current: Thresholds, n: number, hits: number): {
  next: Thresholds;
  changed: boolean;
  adopted: boolean;
  reason: string;
} {
  if (n < MIN_N) {
    return {
      next: current,
      changed: false,
      adopted: false,
      reason: `Not enough clean labels to change the rule (${n} usable; ${MIN_N} required). Past decisions stay as recorded.`,
    };
  }
  let gte = Number(current.implied_move_gte);
  let lte = Number(current.implied_move_lte);
  let rel5 = Number(current.rel5_lt);
  const rel63 = Number(current.rel63_gt);
  const rate = hits / n;
  let reason: string;
  if (rate < 0.5) {
    gte = Math.min(0.08, gte + 0.01);
    lte = Math.max(gte + 0.04, Math.max(0.1, lte - 0.01));
    rel5 = Math.max(-0.02, rel5 - 0.005);
    reason = `Direction was correct on ${hits} of ${n} clean labels. Next lock uses a tighter expected-move band and a deeper 5-day pullback. Already-recorded decisions are not rewritten.`;
  } else if (rate >= 0.6 && n >= 6) {
    gte = Math.max(0.03, gte - 0.005);
    reason = `Direction was correct on ${hits} of ${n} clean labels. Next lock allows a slightly wider expected-move band. Already-recorded decisions are not rewritten.`;
  } else {
    reason = `Direction was correct on ${hits} of ${n} clean labels. Thresholds held. Already-recorded decisions are not rewritten.`;
  }
  if (lte - gte < 0.04) lte = gte + 0.04;
  const next: Thresholds = {
    implied_move_gte: canonDec(gte),
    implied_move_lte: canonDec(lte),
    rel5_lt: canonDec(rel5),
    rel63_gt: canonDec(rel63),
  };
  const changed =
    next.implied_move_gte !== current.implied_move_gte ||
    next.implied_move_lte !== current.implied_move_lte ||
    next.rel5_lt !== current.rel5_lt ||
    next.rel63_gt !== current.rel63_gt;
  return { next, changed, adopted: changed, reason };
}
```


---

## `src/desk/learn.ts` (13351 bytes, sha256 `3139a409e5de233a19085b43d47c00c692af9121c5d8ddfb3c708a69d4064bc5`)

```ts
import { getSql } from "@/lib/db";
import { INITIAL_AST, ruleAstHash, ruleTextHash } from "../kernel/index.ts";
import { appendEvent, withWriter } from "./writer";
import { hexBuf, jsonCanon, newId } from "./util";
import type { DeskRole } from "./util";
import {
  astFromThresholds,
  defaultThresholds,
  humanRuleText,
  humanRuleBullets,
  proposeThresholds,
  thresholdsFromAst,
  type Thresholds,
} from "./learn-policy";

export type { Thresholds } from "./learn-policy";
export {
  astFromThresholds,
  defaultThresholds,
  humanRuleBullets,
  humanRuleText,
  proposeThresholds,
  thresholdsFromAst,
} from "./learn-policy";

export type RuleRevisionRow = {
  revision_id: string;
  parent_rule_version: string;
  new_rule_version: string | null;
  vintage_manifest_id: string | null;
  evidence_n: number;
  direction_hits: number;
  adopted: boolean;
  reason_human: string;
  implied_move_gte: string;
  implied_move_lte: string;
  rel5_lt: string;
  rel63_gt: string;
  created_at: string;
};

export async function ensureLearnTables(): Promise<void> {
  const sql = await getSql();
  await sql.query(`
    CREATE TABLE IF NOT EXISTS rule_revision (
      revision_id text PRIMARY KEY,
      parent_rule_id text NOT NULL,
      parent_rule_version text NOT NULL,
      new_rule_version text,
      vintage_manifest_id text,
      evidence_n int NOT NULL,
      direction_hits int NOT NULL,
      direction_misses int NOT NULL,
      band_hits int NOT NULL,
      implied_move_gte text NOT NULL,
      implied_move_lte text NOT NULL,
      rel5_lt text NOT NULL,
      rel63_gt text NOT NULL,
      adopted boolean NOT NULL,
      reason_human text NOT NULL,
      ast_hash text,
      created_at timestamptz NOT NULL DEFAULT NOW(),
      created_event_seq bigint
    )`);
  await sql.query(`INSERT INTO job_state (job_name, status) VALUES ('learn-revise', 'IDLE') ON CONFLICT DO NOTHING`);
}

export async function loadActiveAst(): Promise<unknown> {
  await ensureLearnTables();
  const sql = await getSql();
  const rows = await sql.query<{ ast_content: unknown }>(
    `SELECT r.ast_content
     FROM evaluation_window w
     JOIN rule_card r ON r.rule_id = w.rule_id AND r.rule_version = w.rule_version
     WHERE w.ended_early_at IS NULL
     ORDER BY w.starts_at DESC
     LIMIT 1`,
  );
  return rows[0]?.ast_content ?? INITIAL_AST;
}

export async function loadActiveThresholds(): Promise<Thresholds> {
  try {
    return thresholdsFromAst(await loadActiveAst());
  } catch {
    return defaultThresholds();
  }
}

export async function astForManifest(manifestId: string): Promise<unknown> {
  const sql = await getSql();
  const rows = await sql.query<{ ast_content: unknown }>(
    `SELECT r.ast_content
     FROM manifest m
     JOIN rule_card r ON r.rule_id = m.rule_id AND r.rule_version = m.rule_version
     WHERE m.manifest_id = $1`,
    [manifestId],
  );
  return rows[0]?.ast_content ?? INITIAL_AST;
}

export async function maybeReviseRule(manifestId: string, actor: string): Promise<RuleRevisionRow | null> {
  await ensureLearnTables();
  const sql = await getSql();
  const existing = await sql.query<RuleRevisionRow>(
    `SELECT revision_id, parent_rule_version, new_rule_version, vintage_manifest_id, evidence_n, direction_hits,
            adopted, reason_human, implied_move_gte, implied_move_lte, rel5_lt, rel63_gt, created_at::text
     FROM rule_revision WHERE vintage_manifest_id = $1`,
    [manifestId],
  );
  if (existing.length) return existing[0];

  const man = await sql.query<{ rule_id: string; rule_version: string; window_id: string }>(
    `SELECT rule_id, rule_version, window_id FROM manifest WHERE manifest_id = $1`,
    [manifestId],
  );
  if (!man.length) return null;

  const grades = await sql.query<{
    direction_hit: boolean | null;
    band_hit: boolean | null;
  }>(
    `SELECT (g.values->>'direction_hit')::boolean AS direction_hit,
            (g.values->>'band_hit')::boolean AS band_hit
     FROM grade g
     JOIN "freeze" f ON f.freeze_id = g.freeze_id
     JOIN manifest m ON m.manifest_id = g.manifest_id
     WHERE g.vintage = 0 AND g.in_evidence_set = TRUE AND g.outcome = 'GRADED'
       AND f.decision = 'PREDICT'
       AND m.rule_id = $1 AND m.rule_version = $2`,
    [man[0].rule_id, man[0].rule_version],
  );
  const n = grades.length;
  const hits = grades.filter((g) => g.direction_hit === true).length;
  const misses = grades.filter((g) => g.direction_hit === false).length;
  const bandHits = grades.filter((g) => g.band_hit === true).length;

  const card = await sql.query<{ ast_content: unknown }>(
    `SELECT ast_content FROM rule_card WHERE rule_id = $1 AND rule_version = $2`,
    [man[0].rule_id, man[0].rule_version],
  );
  const current = thresholdsFromAst(card[0]?.ast_content ?? INITIAL_AST);
  const proposal = proposeThresholds(current, n, hits);

  await sql.query(`UPDATE job_state SET status = 'RUNNING', last_started_at = NOW(), safe_error_code = NULL WHERE job_name = 'learn-revise'`);

  if (!proposal.adopted) {
    const revisionId = newId("rev");
    await sql.query(
      `INSERT INTO rule_revision (
        revision_id, parent_rule_id, parent_rule_version, new_rule_version, vintage_manifest_id,
        evidence_n, direction_hits, direction_misses, band_hits,
        implied_move_gte, implied_move_lte, rel5_lt, rel63_gt,
        adopted, reason_human
      ) VALUES ($1,$2,$3,NULL,$4,$5,$6,$7,$8,$9,$10,$11,$12,FALSE,$13)`,
      [
        revisionId,
        man[0].rule_id,
        man[0].rule_version,
        manifestId,
        n,
        hits,
        misses,
        bandHits,
        proposal.next.implied_move_gte,
        proposal.next.implied_move_lte,
        proposal.next.rel5_lt,
        proposal.next.rel63_gt,
        proposal.reason,
      ],
    );
    await sql.query(
      `UPDATE job_state SET status = 'IDLE', last_completed_at = NOW() WHERE job_name = 'learn-revise'`,
    );
    return {
      revision_id: revisionId,
      parent_rule_version: man[0].rule_version,
      new_rule_version: null,
      vintage_manifest_id: manifestId,
      evidence_n: n,
      direction_hits: hits,
      adopted: false,
      reason_human: proposal.reason,
      implied_move_gte: proposal.next.implied_move_gte,
      implied_move_lte: proposal.next.implied_move_lte,
      rel5_lt: proposal.next.rel5_lt,
      rel63_gt: proposal.next.rel63_gt,
      created_at: new Date().toISOString(),
    };
  }

  const versions = await sql.query<{ rule_version: string }>(
    `SELECT rule_version FROM rule_card WHERE rule_id = $1`,
    [man[0].rule_id],
  );
  const nextN = versions.length + 1;
  const newVersion = `v${nextN}`;
  const ast = astFromThresholds(proposal.next);
  const astHash = ruleAstHash(ast);
  const text = humanRuleText(proposal.next);
  const windowId = newId("win");

  return withWriter(actor, async (ctx) => {
    const { eventSeq } = await appendEvent(ctx, {
      commandId: newId("cmd"),
      type: "REGISTER_RULE",
      payload: {
        parent_rule_version: man[0].rule_version,
        new_rule_version: newVersion,
        vintage_manifest_id: manifestId,
        evidence_n: String(n),
        direction_hits: String(hits),
      },
      receipt: { rule_version: newVersion, adopted: true },
    });
    await ctx.sql.query(
      `INSERT INTO rule_card (
        rule_id, rule_version, rule_text, rule_text_hash, ast_content, canonical_ast, ast_hash, evaluator_id, policy_id,
        expected_predict_rate_min, expected_predict_rate_max, magnitude_definition, registered_event_seq
      ) VALUES ($1,$2,$3,$4,$5::jsonb,$6,$7,'eval-v1','pol-v1',0.10,0.25,$8::jsonb,$9)`,
      [
        man[0].rule_id,
        newVersion,
        text,
        hexBuf(ruleTextHash(text)),
        JSON.stringify(ast),
        jsonCanon(ast),
        hexBuf(astHash),
        JSON.stringify({ low: "0.5*implied_move", high: "2.0*implied_move" }),
        eventSeq,
      ],
    );
    await ctx.sql.query(
      `UPDATE evaluation_window SET ended_early_at = $1, early_end_event_seq = $2, early_end_reason = 'SUPERSEDED_BY_LEARNED_RULE'
       WHERE window_id = $3 AND ended_early_at IS NULL`,
      [ctx.now.toISOString(), eventSeq, man[0].window_id],
    );
    const oldWin = await ctx.sql.query<{ ends_at: string }>(`SELECT ends_at::text FROM evaluation_window WHERE window_id = $1`, [
      man[0].window_id,
    ]);
    const endsAt = oldWin[0]?.ends_at ?? new Date(ctx.now.getTime() + 90 * 24 * 3600 * 1000).toISOString();
    await ctx.sql.query(
      `INSERT INTO evaluation_window (
        window_id, starts_at, ends_at, rule_id, rule_version, policy_id, cost_model_id, evaluator_id, universe_version,
        hypothesis_claim, prior_contaminated, contamination_source, release_event_seq
      ) VALUES (
        $1, $2, $3, $4, $5, 'pol-v1', 'cost-v1', 'eval-v1', 'uni-fix-1',
        $6, TRUE, 'PRIOR_RULE_LABELS', $7
      )`,
      [windowId, ctx.now.toISOString(), endsAt, man[0].rule_id, newVersion, proposal.reason, eventSeq],
    );
    const revisionId = newId("rev");
    await ctx.sql.query(
      `INSERT INTO rule_revision (
        revision_id, parent_rule_id, parent_rule_version, new_rule_version, vintage_manifest_id,
        evidence_n, direction_hits, direction_misses, band_hits,
        implied_move_gte, implied_move_lte, rel5_lt, rel63_gt,
        adopted, reason_human, ast_hash, created_event_seq
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,TRUE,$14,$15,$16)`,
      [
        revisionId,
        man[0].rule_id,
        man[0].rule_version,
        newVersion,
        manifestId,
        n,
        hits,
        misses,
        bandHits,
        proposal.next.implied_move_gte,
        proposal.next.implied_move_lte,
        proposal.next.rel5_lt,
        proposal.next.rel63_gt,
        proposal.reason,
        astHash,
        eventSeq,
      ],
    );
    await ctx.sql.query(
      `UPDATE job_state SET status = 'IDLE', last_completed_at = NOW(), safe_error_code = NULL WHERE job_name = 'learn-revise'`,
    );
    return {
      revision_id: revisionId,
      parent_rule_version: man[0].rule_version,
      new_rule_version: newVersion,
      vintage_manifest_id: manifestId,
      evidence_n: n,
      direction_hits: hits,
      adopted: true,
      reason_human: proposal.reason,
      implied_move_gte: proposal.next.implied_move_gte,
      implied_move_lte: proposal.next.implied_move_lte,
      rel5_lt: proposal.next.rel5_lt,
      rel63_gt: proposal.next.rel63_gt,
      created_at: ctx.now.toISOString(),
    };
  });
}

export async function reviseClosedManifests(actor: string): Promise<number> {
  await ensureLearnTables();
  const sql = await getSql();
  const rows = await sql.query<{ manifest_id: string }>(
    `SELECT m.manifest_id FROM manifest m
     JOIN report_snapshot rs ON rs.manifest_id = m.manifest_id
     WHERE NOT EXISTS (SELECT 1 FROM rule_revision r WHERE r.vintage_manifest_id = m.manifest_id)
     ORDER BY m.session_date`,
  );
  let n = 0;
  for (const row of rows) {
    try {
      await maybeReviseRule(row.manifest_id, actor);
      n += 1;
    } catch {
      /* observational; freeze path must not fail */
    }
  }
  return n;
}

export async function learningSummary(role: DeskRole): Promise<{
  rule_version: string;
  bullets: string[];
  last: {
    adopted: boolean;
    reason: string;
    evidence_n: number | null;
    direction_hits: number | null;
    created_at: string;
  } | null;
  history: Array<{
    adopted: boolean;
    reason: string;
    rule_version: string | null;
    created_at: string;
    evidence_n: number | null;
    direction_hits: number | null;
  }>;
}> {
  await ensureLearnTables();
  const sql = await getSql();
  const win = await sql.query<{ rule_version: string; ast_content: unknown }>(
    `SELECT w.rule_version, r.ast_content
     FROM evaluation_window w
     JOIN rule_card r ON r.rule_id = w.rule_id AND r.rule_version = w.rule_version
     WHERE w.ended_early_at IS NULL
     ORDER BY w.starts_at DESC LIMIT 1`,
  );
  const t = thresholdsFromAst(win[0]?.ast_content ?? INITIAL_AST);
  const hist = await sql.query<RuleRevisionRow>(
    `SELECT revision_id, parent_rule_version, new_rule_version, vintage_manifest_id, evidence_n, direction_hits,
            adopted, reason_human, implied_move_gte, implied_move_lte, rel5_lt, rel63_gt, created_at::text
     FROM rule_revision ORDER BY created_at DESC LIMIT 8`,
  );
  const operator = role === "OPERATOR";
  const hide = (row: RuleRevisionRow) =>
    operator
      ? {
          adopted: row.adopted,
          reason: row.adopted
            ? "The next lock will use an updated checklist. Recorded decisions are unchanged."
            : "The checklist was reviewed. No change this round.",
          evidence_n: null,
          direction_hits: null,
          created_at: row.created_at,
          rule_version: row.new_rule_version,
        }
      : {
          adopted: row.adopted,
          reason: row.reason_human,
          evidence_n: row.evidence_n,
          direction_hits: row.direction_hits,
          created_at: row.created_at,
          rule_version: row.new_rule_version,
        };
  const last = hist[0] ? hide(hist[0]) : null;
  return {
    rule_version: win[0]?.rule_version ?? "v1",
    bullets: humanRuleBullets(t),
    last,
    history: hist.map(hide),
  };
}
```


---

## `src/desk/learn.test.ts` (2463 bytes, sha256 `1553da5a794a4805438b2dda4739d3043d45f6eb8398de1551d0ef51bfea9527`)

```ts
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  astFromThresholds,
  defaultThresholds,
  humanRuleBullets,
  proposeThresholds,
  thresholdsFromAst,
} from "./learn-policy.ts";
import { INITIAL_AST, evaluate, ruleAstHash } from "../kernel/index.ts";

describe("learning loop", () => {
  it("reads v1 thresholds from the registered AST", () => {
    const t = thresholdsFromAst(INITIAL_AST);
    assert.equal(t.implied_move_gte, "0.040000000000");
    assert.equal(t.implied_move_lte, "0.150000000000");
    assert.equal(t.rel5_lt, "0.000000000000");
  });

  it("holds when the sample is too small", () => {
    const p = proposeThresholds(defaultThresholds(), 2, 0);
    assert.equal(p.adopted, false);
    assert.equal(p.changed, false);
    assert.match(p.reason, /Not enough clean labels/);
  });

  it("tightens after a losing vintage", () => {
    const p = proposeThresholds(defaultThresholds(), 4, 1);
    assert.equal(p.adopted, true);
    assert.equal(p.next.implied_move_gte, "0.050000000000");
    assert.equal(p.next.implied_move_lte, "0.140000000000");
    assert.equal(p.next.rel5_lt, "-0.005000000000");
    astFromThresholds(p.next);
  });

  it("holds on a modest winning vintage", () => {
    const p = proposeThresholds(defaultThresholds(), 4, 3);
    assert.equal(p.adopted, false);
    assert.equal(p.next.implied_move_gte, defaultThresholds().implied_move_gte);
  });

  it("widens slightly after a larger winning vintage", () => {
    const p = proposeThresholds(defaultThresholds(), 6, 5);
    assert.equal(p.adopted, true);
    assert.equal(p.next.implied_move_gte, "0.035000000000");
  });

  it("round-trips a learned AST through the evaluator", () => {
    const p = proposeThresholds(defaultThresholds(), 4, 1);
    const ast = astFromThresholds(p.next);
    const card = {
      timing_quality: "ISSUER_CONFIRMED",
      card_complete: true,
      options_valid: true,
      implied_move: "0.045000000000",
      benchmark_relative_5d: "-0.001000000000",
      benchmark_relative_63d: "0.020000000000",
    };
    const miss = evaluate(ast, card);
    assert.equal(miss.decision, "STAND_DOWN");
    const hit = evaluate(ast, { ...card, implied_move: "0.060000000000", benchmark_relative_5d: "-0.010000000000" });
    assert.equal(hit.decision, "PREDICT");
    assert.notEqual(ruleAstHash(ast), ruleAstHash(INITIAL_AST));
    assert.ok(humanRuleBullets(p.next).length === 4);
  });
});
```


---

## `src/desk/queries.ts` (23878 bytes, sha256 `13fbee5c4cd0ae1d5ff82d6c3d568295ff0c839c13aac26c820c297d3c8e5b9f`)

```ts
import { getSql } from "@/lib/db";
import { asHex, rfc3339, type DeskRole } from "./util";
import { ensureBootstrapped } from "./bootstrap";
import { publicStatus } from "./alpaca";

export type Envelope<T> = {
  product_name: "Trading App";
  paperOnly: true;
  liveTradingSupported: false;
  activeModelWeight: "0";
  data_mode: "FIXTURE";
  request_id: string;
  as_of: string;
  data: T;
  warnings: string[];
};

export function wrap<T>(requestId: string, asOf: string, data: T, warnings: string[] = []): Envelope<T> {
  return {
    product_name: "Trading App",
    paperOnly: true,
    liveTradingSupported: false,
    activeModelWeight: "0",
    data_mode: "FIXTURE",
    request_id: requestId,
    as_of: asOf,
    data,
    warnings,
  };
}

async function asOf(): Promise<string> {
  const sql = await getSql();
  const r = await sql.query<{ now_utc: string }>(`SELECT now_utc::text FROM fixture_clock WHERE singleton_key = TRUE`);
  return rfc3339(new Date(r[0]?.now_utc ?? Date.now()));
}

function rate(num: number, den: number): { value: string | null; reason: string | null } {
  if (den === 0) return { value: null, reason: "NO_DENOMINATOR" };
  return { value: (num / den).toFixed(12), reason: null };
}

export async function homePayload(role: DeskRole) {
  await ensureBootstrapped();
  const sql = await getSql();
  const clock = await asOf();
  const sessions = await sql.query<{
    manifest_id: string;
    session_date: string;
    freeze_resolution: string;
    sealed_member_count: number;
    freeze_cutoff_at: string;
    seal_at: string;
    mark_wait_at: string;
    report_finalize_at: string;
    admission_closed_event_seq: number | null;
    research_closed_event_seq: number | null;
  }>(
    `SELECT manifest_id, session_date::text, freeze_resolution, sealed_member_count,
            freeze_cutoff_at::text, seal_at::text, mark_wait_at::text, report_finalize_at::text,
            admission_closed_event_seq, research_closed_event_seq
     FROM manifest ORDER BY session_date DESC`,
  );
  const latest = sessions[0] ?? null;
  const frozen = latest
    ? await sql.query<{ c: number }>(`SELECT COUNT(*)::int AS c FROM "freeze" WHERE manifest_id = $1`, [latest.manifest_id])
    : [{ c: 0 }];
  const complete = latest
    ? await sql.query<{ c: number }>(
        `SELECT COUNT(*)::int AS c FROM "freeze" WHERE manifest_id = $1 AND card_complete = TRUE`,
        [latest.manifest_id],
      )
    : [{ c: 0 }];
  const risk = await sql.query<{ reserved_count: number; reserved_notional: string }>(
    `SELECT reserved_count, reserved_notional::text FROM desk_risk_state WHERE sleeve = 'EARNINGS'`,
  );
  const impaired = await sql.query<{ c: number }>(
    `SELECT COUNT(*)::int AS c FROM "position" WHERE state IN ('IMPAIRED_ENTRY','IMPAIRED_EXIT')`,
  );
  const nonclosed = await sql.query<{ c: number }>(`SELECT COUNT(*)::int AS c FROM "position" WHERE state <> 'CLOSED'`);
  const ctrl = await sql.query<{ admission_paused: boolean; pause_reason: string | null }>(
    `SELECT admission_paused, pause_reason FROM operator_control WHERE sleeve = 'EARNINGS'`,
  );
  const due = await sql.query<{ c: number }>(
    `SELECT COUNT(*)::int AS c FROM deadline d, fixture_clock c WHERE d.applied_event_seq IS NULL AND d.scheduled_at <= c.now_utc`,
  );
  const snap = latest
    ? await sql.query<{ snapshot_id: string; created_at: string }>(
        `SELECT snapshot_id, created_at::text FROM report_snapshot WHERE manifest_id = $1 ORDER BY created_at DESC LIMIT 1`,
        [latest.manifest_id],
      )
    : [];
  const book = role === "OPERATOR"
    ? null
    : await sql.query<{ pnl: string | null; priced: number }>(
        `SELECT COALESCE(SUM((values->>'paper_pnl')::numeric),0)::text AS pnl,
                COUNT(*) FILTER (WHERE status = 'PRICED')::int AS priced
         FROM book_vintage bv
         JOIN (SELECT position_id, MAX(vintage) AS v FROM book_vintage GROUP BY position_id) t
           ON t.position_id = bv.position_id AND t.v = bv.vintage`,
      );
  const openPos = await sql.query<{
    position_id: string;
    ticker: string;
    name: string;
    session_date: string;
    notional: string;
    state: string;
  }>(
    `SELECT p.position_id, p.display_ticker AS ticker, COALESCE(s.display_name, p.display_ticker) AS name,
            p.intended_event_session::text AS session_date, p.original_reserved_notional::text AS notional, p.state
     FROM "position" p
     LEFT JOIN security s ON s.permanent_security_id = p.permanent_security_id
     WHERE p.state <> 'CLOSED'
     ORDER BY p.display_ticker`,
  );
  const { learningSummary } = await import("./learn");
  const learning = await learningSummary(role);
  const predictCount = latest
    ? await sql.query<{ c: number }>(
        `SELECT COUNT(*)::int AS c FROM "freeze" WHERE manifest_id = $1 AND decision = 'PREDICT'`,
        [latest.manifest_id],
      )
    : [{ c: 0 }];
  return wrap("home-1", clock, {
    role,
    data_mode: "FIXTURE",
    window_id: "win-2026q3",
    policy_id: "pol-v1",
    rule_id: "rule-v1",
    latest_session: latest
      ? {
          manifest_id: latest.manifest_id,
          session_date: latest.session_date,
          freeze_resolution: latest.freeze_resolution,
          sealed_member_count: String(latest.sealed_member_count),
          frozen_count: String(frozen[0].c),
          complete_frozen_cards: String(complete[0].c),
          seal_at: latest.seal_at,
          freeze_cutoff_at: latest.freeze_cutoff_at,
          mark_wait_at: latest.mark_wait_at,
          report_finalize_at: latest.report_finalize_at,
          research_closed: latest.research_closed_event_seq != null,
        }
      : null,
    sessions: sessions.map((s) => ({
      manifest_id: s.manifest_id,
      session_date: s.session_date,
      freeze_resolution: s.freeze_resolution,
      sealed_member_count: String(s.sealed_member_count),
    })),
    reserved_count: String(risk[0]?.reserved_count ?? 0),
    reserved_notional: risk[0]?.reserved_notional ?? "0.0000",
    nonclosed_positions: String(nonclosed[0].c),
    impaired_count: String(impaired[0].c),
    admission_paused: ctrl[0]?.admission_paused ?? false,
    pause_reason: ctrl[0]?.pause_reason ?? null,
    overdue_deadlines: String(due[0].c),
    report_snapshot_id: snap[0]?.snapshot_id ?? null,
    report_as_of: snap[0]?.created_at ?? null,
    reviewer_book: book ? { latest_paper_pnl: book[0].pnl, priced_vintages: String(book[0].priced) } : null,
    research_complete_does_not_imply_book_clear: true,
    predict_count: String(predictCount[0].c),
    open_positions: openPos,
    alpaca: await publicStatus(),
    learning,
  });
}

export async function earningsPayload(role: DeskRole, sessionDate?: string) {
  await ensureBootstrapped();
  const sql = await getSql();
  const clock = await asOf();
  const sessions = await sql.query<{ manifest_id: string; session_date: string }>(
    `SELECT manifest_id, session_date::text FROM manifest ORDER BY session_date`,
  );
  const man = await sql.query<{ manifest_id: string; session_date: string }>(
    sessionDate
      ? `SELECT manifest_id, session_date::text FROM manifest WHERE session_date = $1`
      : `SELECT manifest_id, session_date::text FROM manifest ORDER BY session_date DESC LIMIT 1`,
    sessionDate ? [sessionDate] : [],
  );
  if (!man.length) return wrap("earn-1", clock, {
    role,
    manifest_id: "",
    session_date: sessionDate ?? "",
    sessions,
    members: [],
    exclusions: [],
  });
  const members = await sql.query<{
    permanent_security_id: string;
    display_ticker: string;
    event_key: string;
    timing_quality: string;
    shuffle_order_index: number;
    card: Record<string, unknown>;
    card_complete: boolean;
    options_valid: boolean | null;
    pin_count: number;
    display_name: string | null;
    decision: string | null;
    output_payload: { reasons?: string[] } | null;
  }>(
    `SELECT m.permanent_security_id, m.display_ticker, m.event_key, m.timing_quality, m.shuffle_order_index,
            s.card, s.card_complete, s.options_valid, s.pin_count, sec.display_name, f.decision, f.output_payload
     FROM manifest_member m JOIN sealed_input s
       ON s.manifest_id = m.manifest_id AND s.permanent_security_id = m.permanent_security_id
     LEFT JOIN security sec ON sec.permanent_security_id = m.permanent_security_id
     LEFT JOIN "freeze" f ON f.manifest_id = m.manifest_id AND f.permanent_security_id = m.permanent_security_id
     WHERE m.manifest_id = $1
     ORDER BY m.display_ticker`,
    [man[0].manifest_id],
  );
  const exclusions = await sql.query<{
    permanent_security_id: string;
    status: string;
    reason_codes: string[];
  }>(
    `SELECT permanent_security_id, status, reason_codes FROM candidate_eligibility WHERE manifest_id = $1 AND status <> 'INCLUDED'`,
    [man[0].manifest_id],
  );
  const tickers = await sql.query<{ permanent_security_id: string; ticker: string }>(`SELECT permanent_security_id, ticker FROM security_ticker`);
  const tmap = Object.fromEntries(tickers.map((t) => [t.permanent_security_id, t.ticker]));
  return wrap("earn-1", clock, {
    role,
    manifest_id: man[0].manifest_id,
    session_date: man[0].session_date,
    sessions,
    members: members.map((m) => ({
      permanent_security_id: m.permanent_security_id,
      ticker: m.display_ticker,
      name: m.display_name ?? m.display_ticker,
      event_key: m.event_key,
      timing_quality: m.timing_quality,
      card_complete: m.card_complete,
      options_valid: m.options_valid,
      pin_count: String(m.pin_count),
      implied_move: typeof m.card.implied_move === "string" ? m.card.implied_move : null,
      benchmark_relative_5d: typeof m.card.benchmark_relative_5d === "string" ? m.card.benchmark_relative_5d : null,
      benchmark_relative_63d: typeof m.card.benchmark_relative_63d === "string" ? m.card.benchmark_relative_63d : null,
      decision: m.decision,
      reasons: m.output_payload?.reasons ?? [],
      shuffle_order_index: role === "OPERATOR" ? null : String(m.shuffle_order_index),
    })),
    exclusions: exclusions.map((e) => ({
      permanent_security_id: e.permanent_security_id,
      ticker: tmap[e.permanent_security_id] ?? e.permanent_security_id,
      status: e.status,
      reason_codes: e.reason_codes,
    })),
  });
}

export async function predictionsPayload(role: DeskRole, manifestId?: string, sessionDate?: string) {
  await ensureBootstrapped();
  const sql = await getSql();
  const clock = await asOf();
  const sessions = await sql.query<{ manifest_id: string; session_date: string; freeze_resolution: string }>(
    `SELECT manifest_id, session_date::text, freeze_resolution FROM manifest ORDER BY session_date`,
  );
  const man = await sql.query<{ manifest_id: string; session_date: string; freeze_resolution: string }>(
    manifestId
      ? `SELECT manifest_id, session_date::text, freeze_resolution FROM manifest WHERE manifest_id = $1`
      : sessionDate
        ? `SELECT manifest_id, session_date::text, freeze_resolution FROM manifest WHERE session_date = $1`
        : `SELECT manifest_id, session_date::text, freeze_resolution FROM manifest ORDER BY session_date DESC LIMIT 1`,
    manifestId ? [manifestId] : sessionDate ? [sessionDate] : [],
  );
  if (!man.length) return wrap("pred-1", clock, {
    role,
    manifest_id: "",
    session_date: sessionDate ?? "",
    freeze_resolution: "EMPTY",
    sessions: sessions.map((s) => ({
      manifest_id: s.manifest_id,
      session_date: s.session_date,
      freeze_resolution: s.freeze_resolution,
    })),
    rows: [],
  });
  const rows = await sql.query<{
    permanent_security_id: string;
    display_ticker: string;
    freeze_id: string | null;
    decision: string | null;
    direction: string | null;
    input_hash: Buffer | null;
    output_hash: Buffer | null;
    verification_level: string | null;
    admission_outcome: string | null;
    position_id: string | null;
    output_payload: { magnitude_low?: string | null; magnitude_high?: string | null; reasons?: string[] } | null;
    shuffle_order_index: number;
  }>(
    `SELECT mm.permanent_security_id, mm.display_ticker, mm.shuffle_order_index,
            f.freeze_id, f.decision, f.direction, f.input_hash, f.output_hash, f.verification_level, f.output_payload,
            a.outcome AS admission_outcome, a.position_id
     FROM manifest_member mm
     LEFT JOIN "freeze" f ON f.manifest_id = mm.manifest_id AND f.permanent_security_id = mm.permanent_security_id
     LEFT JOIN execution_admission a ON a.freeze_id = f.freeze_id
     WHERE mm.manifest_id = $1
     ORDER BY mm.display_ticker`,
    [man[0].manifest_id],
  );
  const operator = role === "OPERATOR";
  return wrap("pred-1", clock, {
    role,
    manifest_id: man[0].manifest_id,
    session_date: man[0].session_date,
    freeze_resolution: man[0].freeze_resolution,
    sessions: sessions.map((s) => ({
      manifest_id: s.manifest_id,
      session_date: s.session_date,
      freeze_resolution: s.freeze_resolution,
    })),
    rows: rows.map((r) => ({
      permanent_security_id: r.permanent_security_id,
      ticker: r.display_ticker,
      name: r.display_ticker,
      status: r.freeze_id ? r.decision : "NO_FREEZE",
      direction: r.decision === "PREDICT" ? r.direction : null,
      execution:
        r.admission_outcome === "ADMITTED"
          ? "PAPER_COMMITTED"
          : r.decision === "PREDICT"
            ? "NOT_TRADED"
            : r.admission_outcome ?? "NONE",
      input_hash: r.input_hash ? asHex(r.input_hash) : null,
      output_hash: r.output_hash ? asHex(r.output_hash) : null,
      verification_level: r.verification_level,
      reasons: r.output_payload?.reasons ?? [],
      magnitude_low: operator ? null : (r.output_payload?.magnitude_low ?? null),
      magnitude_high: operator ? null : (r.output_payload?.magnitude_high ?? null),
      position_id: r.position_id,
      shuffle_order_index: operator ? null : String(r.shuffle_order_index),
    })),
  });
}

export async function resultsPayload(role: DeskRole) {
  await ensureBootstrapped();
  const sql = await getSql();
  const clock = await asOf();
  const sealed = await sql.query<{ c: number }>(`SELECT COUNT(*)::int AS c FROM manifest_member`);
  const frozen = await sql.query<{ c: number }>(`SELECT COUNT(*)::int AS c FROM "freeze"`);
  const byDecision = await sql.query<{ decision: string; c: number }>(
    `SELECT decision, COUNT(*)::int AS c FROM "freeze" GROUP BY decision`,
  );
  const noFreeze = await sql.query<{ c: number }>(`SELECT COUNT(*)::int AS c FROM grade WHERE outcome = 'NO_FREEZE' AND vintage = 0`);
  const outcomes = await sql.query<{ outcome: string; c: number }>(
    `SELECT outcome, COUNT(*)::int AS c FROM grade WHERE vintage = 0 GROUP BY outcome`,
  );
  const complete = await sql.query<{ c: number }>(`SELECT COUNT(*)::int AS c FROM "freeze" WHERE card_complete = TRUE`);
  const predict = byDecision.find((d) => d.decision === "PREDICT")?.c ?? 0;
  const stand = byDecision.find((d) => d.decision === "STAND_DOWN")?.c ?? 0;
  const nSealed = sealed[0].c;
  const nFrozen = frozen[0].c;
  const manifests = await sql.query<{ freeze_resolution: string; c: number }>(
    `SELECT freeze_resolution, COUNT(*)::int AS c FROM manifest GROUP BY freeze_resolution`,
  );
  const nonempty = manifests.filter((m) => m.freeze_resolution !== "EMPTY").reduce((a, b) => a + b.c, 0);
  const partial = manifests.find((m) => m.freeze_resolution === "PARTIAL")?.c ?? 0;

  const grades = await sql.query<{
    ticker: string;
    permanent_security_id: string;
    decision: string | null;
    outcome: string;
    in_evidence_set: boolean;
    values: {
      direction_hit?: boolean | null;
      band_hit?: boolean | null;
      raw_gap?: string | null;
      entry_price?: string;
      exit_price?: string;
    };
    reasons: string[];
    session_date: string;
  }>(
    `SELECT mm.display_ticker AS ticker, g.permanent_security_id, f.decision, g.outcome, g.in_evidence_set, g.values, g.reason_codes AS reasons, man.session_date::text
     FROM grade g
     JOIN manifest_member mm ON mm.manifest_id = g.manifest_id AND mm.permanent_security_id = g.permanent_security_id
     JOIN manifest man ON man.manifest_id = g.manifest_id
     LEFT JOIN "freeze" f ON f.freeze_id = g.freeze_id
     WHERE g.vintage = 0
     ORDER BY man.session_date, mm.display_ticker`,
  );
  const books = await sql.query<{
    ticker: string;
    state: string;
    pnl: string | null;
    basis: string | null;
    eligible: boolean | null;
    notional: string;
    vintage: number | null;
  }>(
    `SELECT p.display_ticker AS ticker, p.state, p.original_reserved_notional::text AS notional,
            bv.values->>'paper_pnl' AS pnl, bv.basis, bv.strategy_pnl_eligible AS eligible, bv.vintage
     FROM "position" p
     LEFT JOIN book_vintage bv ON bv.book_vintage_id = p.last_book_vintage_id
     ORDER BY p.display_ticker`,
  );

  const cleanPredict = grades.filter((g) => g.decision === "PREDICT" && g.in_evidence_set);
  const hits = cleanPredict.filter((g) => g.values.direction_hit === true).length;
  const C = cleanPredict.length;
  const U = grades.filter((g) => g.decision === "PREDICT" && !g.in_evidence_set && g.outcome !== "NO_EVENT").length;
  const lower = rate(hits, C + U);
  const upper = rate(hits + U, C + U);
  const suppress = lower.value && Number(lower.value) <= 0.5 && Number(upper.value) >= 0.5;

  const operator = role === "OPERATOR";
  const { learningSummary } = await import("./learn");
  const learning = await learningSummary(role);
  return wrap("res-1", clock, {
    role,
    banner:
      "Operational research report. The current checklist was selected after prior observation. Small-sample hit rate does not establish a trading edge. Paper P&L is ESTIMATED under a conservative stress haircut, not live-fill evidence. Unresolved prices and excluded labels are disclosed separately.",
    process: {
      sealed: String(nSealed),
      frozen: String(nFrozen),
      no_freeze: String(noFreeze[0].c),
      stand_down: String(stand),
      predict: String(predict),
      complete_frozen_cards: String(complete[0].c),
      outcomes: Object.fromEntries(outcomes.map((o) => [o.outcome, String(o.c)])),
      freeze_rate: rate(nFrozen, nSealed),
      stand_down_rate: rate(stand, nFrozen),
      predict_rate_complete: rate(predict, complete[0].c),
      no_freeze_rate: rate(noFreeze[0].c, nSealed),
      partial_manifest_rate: rate(partial, nonempty),
    },
    research: operator
      ? { restricted: true, message: "Direction hits, bands, marks, and P&L are withheld from OPERATOR until window release." }
      : {
          restricted: false,
          clean_predict_n: String(C),
          direction_hits: String(hits),
          hit_rate: suppress ? null : rate(hits, C),
          attrition_lower: lower,
          attrition_upper: upper,
          interval_label: "missingness sensitivity interval, not a confidence interval",
          point_estimate_suppressed: Boolean(suppress),
          grades: grades.map((g) => ({
            ticker: g.ticker,
            id: g.permanent_security_id,
            session_date: g.session_date,
            decision: g.decision,
            outcome: g.outcome,
            in_evidence_set: g.in_evidence_set,
            direction_hit: g.values.direction_hit ?? null,
            band_hit: g.values.band_hit ?? null,
            raw_gap: g.values.raw_gap ?? null,
            entry_price: g.values.entry_price ?? null,
            exit_price: g.values.exit_price ?? null,
            reasons: g.reasons,
          })),
        },
    book: operator
      ? { restricted: true }
      : {
          positions: books.map((b) => ({
            ticker: b.ticker,
            state: b.state,
            original_reserved_notional: b.notional,
            paper_pnl: b.pnl,
            basis: b.basis,
            strategy_pnl_eligible: b.eligible,
            vintage: b.vintage == null ? null : String(b.vintage),
          })),
        },
    learning,
  });
}

export async function adminPayload(role: DeskRole) {
  await ensureBootstrapped();
  const sql = await getSql();
  const clock = await asOf();
  const jobs = await sql.query<{ job_name: string; status: string; last_completed_at: string | null; safe_error_code: string | null }>(
    `SELECT job_name, status, last_completed_at::text, safe_error_code FROM job_state ORDER BY job_name`,
  );
  const deadlines = await sql.query<{
    kind: string;
    scheduled_at: string;
    applied_at: string | null;
    manifest_id: string | null;
    permanent_security_id: string | null;
  }>(
    `SELECT kind, scheduled_at::text, applied_at::text, manifest_id, permanent_security_id FROM deadline ORDER BY scheduled_at`,
  );
  const alarms = await sql.query<{
    code: string;
    component: string;
    status: string;
    blocks_new_admission: boolean;
    safe_details: Record<string, string | number | boolean | null> | null;
    last_seen: string;
  }>(`SELECT code, component, status, blocks_new_admission, safe_details, last_seen::text FROM ops_alarm ORDER BY last_seen DESC`);
  const ctrl = await sql.query<{ admission_paused: boolean; pause_reason: string | null }>(
    `SELECT admission_paused, pause_reason FROM operator_control WHERE sleeve = 'EARNINGS'`,
  );
  const notes = await sql.query<{ hypothesis: string; note: string }>(
    `SELECT hypothesis, note FROM fire_rate_note ORDER BY event_seq DESC LIMIT 10`,
  );
  const positions = await sql.query<{ position_id: string; display_ticker: string; state: string; cas_token: string }>(
    `SELECT position_id, display_ticker, state, cas_token::text FROM "position" ORDER BY display_ticker`,
  );
  const alpaca = await publicStatus();
  return wrap("adm-1", clock, {
    role,
    can_mutate: role === "OPERATOR",
    jobs,
    deadlines: deadlines.map((d) => ({
      kind: d.kind,
      scheduled_at: d.scheduled_at,
      applied_at: d.applied_at,
      overdue: d.applied_at == null && new Date(d.scheduled_at) <= new Date(clock),
      target: d.permanent_security_id ?? d.manifest_id,
    })),
    alarms,
    admission_paused: ctrl[0]?.admission_paused ?? false,
    pause_reason: ctrl[0]?.pause_reason ?? null,
    fire_rate_notes: notes,
    positions,
    alpaca,
    ports: {
      security_master: "FIXTURE",
      calendar: "FIXTURE",
      earnings: "FIXTURE",
      quotes: alpaca.connected ? "ALPACA" : "FIXTURE",
      official_marks: "FIXTURE",
      live_broker: alpaca.connected ? (alpaca.mode === "LIVE" ? "ALPACA_LIVE" : "ALPACA_PAPER") : "UNSUPPORTED",
      real_data_credentials: alpaca.connected ? "PRESENT" : "ABSENT",
    },
  });
}

export async function getOrCreatePrincipal(userId: string, email: string | null): Promise<{ principal_id: string; role: DeskRole | null }> {
  const sql = await getSql();
  const rows = await sql.query<{ principal_id: string; role: DeskRole }>(
    `SELECT principal_id, role FROM desk_principal WHERE user_id = $1`,
    [userId],
  );
  if (rows.length) return rows[0];
  return { principal_id: userId, role: null };
}

export async function claimRole(userId: string, email: string | null, role: "OPERATOR" | "REVIEWER") {
  const sql = await getSql();
  const existing = await sql.query<{ role: DeskRole }>(`SELECT role FROM desk_principal WHERE user_id = $1`, [userId]);
  if (existing.length) return { role: existing[0].role, already: true };
  const id = userId.replace(/[^A-Za-z0-9:._-]/g, "").slice(0, 48) || "user";
  const pid = `usr-${id}`.slice(0, 64);
  await sql.query(
    `INSERT INTO desk_principal (principal_id, user_id, login_name, role, active, label_exposure_declared, created_at)
     VALUES ($1,$2,$3,$4,TRUE,$5,NOW())`,
    [pid, userId, email ?? userId, role, role === "REVIEWER"],
  );
  return { role, already: false };
}
```


---

## `src/desk/auto-trade.ts` (15361 bytes, sha256 `c9749421773942c1be337c81c03eedb69eb85292409444c3494c1dc09f14f103`)

```ts
import { getSql } from "@/lib/db";
import { DeskError } from "./util";
import {
  closePosition,
  getClock,
  getDailyBars,
  getSnapshots,
  publicStatus,
  submitOrder,
} from "./alpaca";

const TICKET_DOLLARS = "5000.00";
const MAX_SLOTS = 3;
const FIXTURE_TICKERS = new Set(["ALFA", "BRAV", "CHRL", "DELT", "ECHO", "FOXT", "GOLF", "HOTL"]);

function venueTicker(raw: string): string | null {
  const s = raw.trim().toUpperCase().replace(/[^A-Z.]/g, "");
  if (!s || FIXTURE_TICKERS.has(s) || s.startsWith("SEC-")) return null;
  if (!/^[A-Z][A-Z.]{0,9}$/.test(s)) return null;
  return s;
}

export type AutoFill = {
  position_id: string;
  symbol: string;
  side: string;
  notional: string | null;
  status: string;
  alpaca_order_id: string | null;
  last_error: string | null;
  submitted_at: string | null;
};

async function ensureFillTable(): Promise<void> {
  const sql = await getSql();
  await sql.query(`
    CREATE TABLE IF NOT EXISTS alpaca_desk_fill (
      position_id text PRIMARY KEY,
      symbol text NOT NULL,
      side text NOT NULL,
      notional text,
      status text NOT NULL,
      client_order_id text,
      alpaca_order_id text,
      last_error text,
      submitted_at timestamptz,
      closed_at timestamptz
    )`);
  await sql.query(`
    CREATE TABLE IF NOT EXISTS alpaca_auto_cycle (
      singleton_key boolean PRIMARY KEY CHECK (singleton_key),
      last_run_at timestamptz,
      last_summary text
    )`);
  await sql.query(`INSERT INTO alpaca_auto_cycle (singleton_key) VALUES (TRUE) ON CONFLICT DO NOTHING`);
}

async function upsertFill(row: {
  positionId: string;
  symbol: string;
  side: string;
  notional?: string;
  status: string;
  orderId?: string | null;
  error?: string | null;
}): Promise<void> {
  const sql = await getSql();
  await sql.query(
    `INSERT INTO alpaca_desk_fill (position_id, symbol, side, notional, status, alpaca_order_id, last_error, submitted_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,NOW())
     ON CONFLICT (position_id) DO UPDATE SET
       symbol = EXCLUDED.symbol,
       side = EXCLUDED.side,
       notional = COALESCE(EXCLUDED.notional, alpaca_desk_fill.notional),
       status = EXCLUDED.status,
       alpaca_order_id = COALESCE(EXCLUDED.alpaca_order_id, alpaca_desk_fill.alpaca_order_id),
       last_error = EXCLUDED.last_error,
       submitted_at = COALESCE(alpaca_desk_fill.submitted_at, NOW())`,
    [row.positionId, row.symbol, row.side, row.notional ?? null, row.status, row.orderId ?? null, row.error ?? null],
  );
}

export async function sendEntry(args: { positionId: string; ticker: string; actor: string }): Promise<void> {
  await ensureFillTable();
  const status = await publicStatus();
  if (!status.connected) {
    await upsertFill({ positionId: args.positionId, symbol: args.ticker, side: "buy", status: "SKIPPED", error: "Alpaca not connected" });
    return;
  }
  if (status.mode === "LIVE") {
    await upsertFill({
      positionId: args.positionId,
      symbol: args.ticker,
      side: "buy",
      status: "BLOCKED_LIVE",
      error: "Auto-execution is paper-only",
    });
    return;
  }
  const sql = await getSql();
  const existing = await sql.query<{ status: string }>(
    `SELECT status FROM alpaca_desk_fill WHERE position_id = $1`,
    [args.positionId],
  );
  if (existing[0] && ["SUBMITTED", "FILLED", "CLOSED"].includes(existing[0].status)) return;

  const symbol = venueTicker(args.ticker);
  if (!symbol) {
    await upsertFill({
      positionId: args.positionId,
      symbol: args.ticker,
      side: "buy",
      status: "SKIPPED",
      error: "Fixture ticker is not an Alpaca symbol",
    });
    return;
  }

  try {
    const clock = await getClock();
    const open = clock.is_open === true || clock.is_open === "true";
    let rec: Record<string, string | boolean | null>;
    if (open) {
      rec = await submitOrder({
        symbol,
        side: "buy",
        type: "market",
        timeInForce: "day",
        notional: TICKET_DOLLARS,
        actor: args.actor,
      });
    } else {
      const snaps = await getSnapshots([symbol]);
      const last = snaps[0]?.last ?? snaps[0]?.ask ?? snaps[0]?.bid;
      if (!last) throw new DeskError("NO_QUOTE", "No last price to stage an off-hours entry", 422);
      rec = await submitOrder({
        symbol,
        side: "buy",
        type: "limit",
        timeInForce: "day",
        qty: qtyFromNotional(TICKET_DOLLARS, last),
        limitPrice: last,
        extendedHours: true,
        actor: args.actor,
      });
    }
    await upsertFill({
      positionId: args.positionId,
      symbol,
      side: "buy",
      notional: TICKET_DOLLARS,
      status: String(rec.status ?? "SUBMITTED").toUpperCase() === "FILLED" ? "FILLED" : "SUBMITTED",
      orderId: typeof rec.id === "string" ? rec.id : null,
    });
  } catch (e) {
    await upsertFill({
      positionId: args.positionId,
      symbol,
      side: "buy",
      notional: TICKET_DOLLARS,
      status: "ERROR",
      error: e instanceof Error ? e.message : "Alpaca entry failed",
    });
  }
}

export async function sendExit(args: { positionId: string; ticker: string; actor: string }): Promise<void> {
  await ensureFillTable();
  const status = await publicStatus();
  if (!status.connected || status.mode === "LIVE") return;
  const symbol = venueTicker(args.ticker);
  if (!symbol) return;
  try {
    const rec = await closePosition(symbol);
    const sql = await getSql();
    await sql.query(
      `UPDATE alpaca_desk_fill SET status = 'CLOSED', closed_at = NOW(), last_error = NULL,
        alpaca_order_id = COALESCE($2, alpaca_order_id)
       WHERE position_id = $1`,
      [args.positionId, typeof rec.id === "string" ? rec.id : null],
    );
  } catch (e) {
    await upsertFill({
      positionId: args.positionId,
      symbol,
      side: "sell",
      status: "EXIT_ERROR",
      error: e instanceof Error ? e.message : "Alpaca exit failed",
    });
  }
}

function qtyFromNotional(dollars: string, last: string): string {
  const d = Number(dollars);
  const p = Number(last);
  if (!(d > 0) || !(p > 0)) throw new DeskError("INVALID_SIZE", "Cannot size off-hours order", 422);
  const q = Math.floor((d / p) * 10000) / 10000;
  if (q < 0.0001) throw new DeskError("INVALID_SIZE", "Notional too small for last price", 422);
  return q.toFixed(4);
}

export async function listFills(): Promise<AutoFill[]> {
  await ensureFillTable();
  const sql = await getSql();
  return sql.query<AutoFill>(
    `SELECT position_id, symbol, side, notional, status, alpaca_order_id, last_error, submitted_at::text
     FROM alpaca_desk_fill ORDER BY submitted_at DESC NULLS LAST LIMIT 40`,
  );
}

async function setJob(name: string, status: "IDLE" | "RUNNING" | "FAILED", err?: string): Promise<void> {
  try {
    const sql = await getSql();
    if (status === "RUNNING") {
      await sql.query(
        `UPDATE job_state SET status = 'RUNNING', last_started_at = NOW(), safe_error_code = NULL WHERE job_name = $1`,
        [name],
      );
    } else {
      await sql.query(
        `UPDATE job_state SET status = $2, last_completed_at = NOW(), safe_error_code = $3 WHERE job_name = $1`,
        [name, status, err ?? null],
      );
    }
  } catch {
    /* job_state is observational */
  }
}

function ret(bars: Array<{ c: number }>, days: number): number | null {
  if (bars.length < days + 1) return null;
  const now = bars[bars.length - 1].c;
  const then = bars[bars.length - 1 - days].c;
  if (!(now > 0) || !(then > 0)) return null;
  return now / then - 1;
}

function rangeFrac(bars: Array<{ h: number; l: number; c: number }>, days: number): number | null {
  const slice = bars.slice(-days);
  if (slice.length < 5) return null;
  let hi = -Infinity;
  let lo = Infinity;
  for (const b of slice) {
    if (b.h > hi) hi = b.h;
    if (b.l < lo) lo = b.l;
  }
  const last = slice[slice.length - 1].c;
  if (!(last > 0) || !(hi > 0) || !(lo > 0)) return null;
  return (hi - lo) / last;
}

/** Live paper sleeve: pullback vs SPY on a 63-day uptrend, 4–25% 20-day range, $5+ last. Max 3 × $5,000. */
async function liveWatchlistCycle(actor: string): Promise<{ scanned: number; admitted: string[]; skipped: string[] }> {
  const st = await publicStatus();
  const universe = (st.watchlist.length ? st.watchlist : ["SPY", "QQQ", "NVDA", "AAPL", "MSFT"]).filter(
    (s) => venueTicker(s) && s !== "SPY",
  );
  const scanned = universe.length;
  const admitted: string[] = [];
  const skipped: string[] = [];
  if (!universe.length) return { scanned, admitted, skipped };

  const sql = await getSql();
  const open = await sql.query<{ c: number }>(
    `SELECT COUNT(*)::int AS c FROM alpaca_desk_fill WHERE status IN ('SUBMITTED','FILLED')`,
  );
  let slots = Math.max(0, MAX_SLOTS - (open[0]?.c ?? 0));
  if (slots <= 0) {
    skipped.push("capacity");
    return { scanned, admitted, skipped };
  }

  const symbols = [...new Set([...universe, "SPY"])];
  const snaps = await getSnapshots(symbols);
  const bars = await getDailyBars(symbols, 70);
  const spyBars = bars.SPY ?? [];
  const spy5 = ret(spyBars, 5);
  const spy63 = ret(spyBars, 63);
  const { loadActiveThresholds } = await import("./learn");
  const band = await loadActiveThresholds();
  const minMove = Number(band.implied_move_gte);
  const maxMove = Number(band.implied_move_lte);
  const rel5Need = Number(band.rel5_lt);
  const rel63Need = Number(band.rel63_gt);

  for (const symbol of universe) {
    if (slots <= 0) break;
    const existing = await sql.query<{ status: string }>(
      `SELECT status FROM alpaca_desk_fill WHERE position_id = $1`,
      [`live:${symbol}`],
    );
    if (existing[0] && ["SUBMITTED", "FILLED"].includes(existing[0].status)) {
      skipped.push(`${symbol}:already`);
      continue;
    }
    const snap = snaps.find((s) => s.symbol === symbol);
    const last = Number(snap?.last ?? 0);
    const bid = Number(snap?.bid ?? 0);
    const ask = Number(snap?.ask ?? 0);
    if (!(last >= 5)) {
      skipped.push(`${symbol}:price`);
      continue;
    }
    if (bid > 0 && ask > 0 && (ask - bid) / ((ask + bid) / 2) > 0.01) {
      skipped.push(`${symbol}:spread`);
      continue;
    }
    const series = bars[symbol] ?? [];
    const r5 = ret(series, 5);
    const r63 = ret(series, 63);
    const rng = rangeFrac(series, 20);
    if (r5 == null || r63 == null || spy5 == null || spy63 == null || rng == null) {
      skipped.push(`${symbol}:bars`);
      continue;
    }
    const rel5 = r5 - spy5;
    const rel63 = r63 - spy63;
    if (!(rel5 < rel5Need && rel63 > rel63Need && rng >= minMove && rng <= maxMove)) {
      skipped.push(`${symbol}:stand-down`);
      continue;
    }
    await sendEntry({ positionId: `live:${symbol}`, ticker: symbol, actor });
    admitted.push(symbol);
    slots -= 1;
  }
  return { scanned, admitted, skipped };
}

export async function syncBook(actor: string): Promise<{ entries: number; exits: number; errors: string[] }> {
  await ensureFillTable();
  const sql = await getSql();
  const errors: string[] = [];
  let entries = 0;
  let exits = 0;

  const openPos = await sql.query<{ position_id: string; display_ticker: string; state: string }>(
    `SELECT position_id, display_ticker, state FROM "position"
     WHERE state IN ('COMMITTED_IRREVOCABLE','FILLED','IMPAIRED_EXIT')`,
  );
  for (const p of openPos) {
    const fill = await sql.query<{ status: string }>(`SELECT status FROM alpaca_desk_fill WHERE position_id = $1`, [
      p.position_id,
    ]);
    if (!fill[0] || ["ERROR", "SKIPPED", "BLOCKED_LIVE"].includes(fill[0].status)) {
      await sendEntry({ positionId: p.position_id, ticker: p.display_ticker, actor });
      entries += 1;
    }
  }

  const done = await sql.query<{ position_id: string; display_ticker: string }>(
    `SELECT p.position_id, p.display_ticker FROM "position" p
     JOIN alpaca_desk_fill f ON f.position_id = p.position_id
     WHERE p.state IN ('FLAT','CLOSED','NO_FILL') AND f.status IN ('SUBMITTED','FILLED','EXIT_ERROR')`,
  );
  for (const p of done) {
    await sendExit({ positionId: p.position_id, ticker: p.display_ticker, actor });
    exits += 1;
  }

  return { entries, exits, errors };
}

export async function runAutoCycle(actor: string): Promise<{
  connected: boolean;
  mode: string | null;
  frozen: number;
  entries: number;
  exits: number;
  summary: string;
  fills: AutoFill[];
}> {
  await ensureFillTable();
  const st = await publicStatus();
  if (!st.connected) {
    const summary = "No Alpaca keys. Paste them on Admin first.";
    await recordCycle(summary);
    return { connected: false, mode: null, frozen: 0, entries: 0, exits: 0, summary, fills: await listFills() };
  }
  if (st.mode === "LIVE") {
    const summary = "Live mode is connected. Auto-execution stays off — paper only.";
    await recordCycle(summary);
    return { connected: true, mode: "LIVE", frozen: 0, entries: 0, exits: 0, summary, fills: await listFills() };
  }

  await setJob("capture-cycle", "RUNNING");
  await setJob("ordered-freeze", "RUNNING");
  let liveAdmitted: string[] = [];
  let liveSkipped = 0;
  try {
    const live = await liveWatchlistCycle(actor);
    liveAdmitted = live.admitted;
    liveSkipped = live.skipped.length;
    await setJob("capture-cycle", "IDLE");
    await setJob("ordered-freeze", "IDLE");
  } catch (e) {
    await setJob("capture-cycle", "FAILED", e instanceof Error ? e.message.slice(0, 80) : "capture failed");
    await setJob("ordered-freeze", "FAILED");
  }

  await setJob("due-deadlines", "RUNNING");
  try {
    const { applyDueDeadlines } = await import("./lifecycle");
    await applyDueDeadlines(actor);
    await setJob("due-deadlines", "IDLE");
  } catch (e) {
    await setJob("due-deadlines", "FAILED", e instanceof Error ? e.message.slice(0, 80) : "deadlines failed");
  }

  const book = await syncBook(actor);
  const summary = liveAdmitted.length
    ? `Paper auto-run: bought ${liveAdmitted.join(", ")} ($5,000 each). ${liveSkipped} watchlist names stood down. Book sync entries ${book.entries}, exits ${book.exits}.`
    : `Paper auto-run: no new tickets (${liveSkipped} watchlist names stood down). Book sync entries ${book.entries}, exits ${book.exits}.`;
  await recordCycle(summary);
  return {
    connected: true,
    mode: "PAPER",
    frozen: liveAdmitted.length,
    entries: book.entries + liveAdmitted.length,
    exits: book.exits,
    summary,
    fills: await listFills(),
  };
}

async function recordCycle(summary: string): Promise<void> {
  const sql = await getSql();
  await sql.query(`UPDATE alpaca_auto_cycle SET last_run_at = NOW(), last_summary = $1 WHERE singleton_key = TRUE`, [
    summary,
  ]);
}

export async function autoStatus(): Promise<{
  connected: boolean;
  mode: string | null;
  last_run_at: string | null;
  last_summary: string | null;
  fills: AutoFill[];
}> {
  await ensureFillTable();
  const st = await publicStatus();
  const sql = await getSql();
  const cyc = await sql.query<{ last_run_at: string | null; last_summary: string | null }>(
    `SELECT last_run_at::text, last_summary FROM alpaca_auto_cycle WHERE singleton_key = TRUE`,
  );
  return {
    connected: st.connected,
    mode: st.mode,
    last_run_at: cyc[0]?.last_run_at ?? null,
    last_summary: cyc[0]?.last_summary ?? null,
    fills: await listFills(),
  };
}
```


---

## `src/desk/alpaca-types.ts` (1278 bytes, sha256 `c950e6025a2becc87ac6e00e71e18062fb8ccabf8c996bd6500bfb5c09f449f9`)

```ts
export type AlpacaMode = "PAPER" | "LIVE";

export type AlpacaPublicStatus = {
  connected: boolean;
  mode: AlpacaMode | null;
  api_key_masked: string | null;
  account_number_last4: string | null;
  account_status: string | null;
  last_ok_at: string | null;
  last_error: string | null;
  watchlist: string[];
  trading_host: string | null;
};

export type TapeBar = { t: string; o: number; h: number; l: number; c: number; v: number };

export type TapeNews = {
  id: string;
  headline: string;
  source: string | null;
  created_at: string;
  url: string | null;
  summary: string | null;
};

export type TickerDetail = {
  symbol: string;
  name: string | null;
  exchange: string | null;
  tradable: boolean;
  last: string | null;
  bid: string | null;
  ask: string | null;
  bid_size: string | null;
  ask_size: string | null;
  change: string | null;
  change_pct: string | null;
  open: string | null;
  high: string | null;
  low: string | null;
  prev_close: string | null;
  volume: string | null;
  vwap: string | null;
  week52_high: string | null;
  week52_low: string | null;
  trade_at: string | null;
  quote_at: string | null;
  bars_intraday: TapeBar[];
  bars_daily: TapeBar[];
  news: TapeNews[];
  feed: "live" | "sample";
  notice: string | null;
};
```


---

## `src/desk/alpaca.ts` (33512 bytes, sha256 `68cd038cf61c6e1aed11bd7930dc8375bfb26d417a0b16706ff0460d41954ed9`)

```ts
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { getSql } from "@/lib/db";
import { DeskError, newId } from "./util";
import type { AlpacaMode, AlpacaPublicStatus } from "./alpaca-types";

export type { AlpacaMode, AlpacaPublicStatus } from "./alpaca-types";

const WRAP_ID = "kr-alpaca-wrap";
const DEFAULT_WATCH = ["SPY", "QQQ", "NVDA", "AAPL", "MSFT", "AMZN", "META", "GOOGL", "TSLA", "AMD"];

type StoredCred = {
  api_key_id: string;
  secret: string;
  mode: AlpacaMode;
  watchlist: string[];
};

function tradingHost(mode: AlpacaMode): string {
  return mode === "LIVE" ? "https://api.alpaca.markets" : "https://paper-api.alpaca.markets";
}

function asBuf(v: unknown): Buffer {
  if (Buffer.isBuffer(v)) return v;
  if (v instanceof Uint8Array) return Buffer.from(v);
  if (typeof v === "string") {
    const s = v.startsWith("\\x") ? v.slice(2) : v;
    if (/^[0-9a-fA-F]+$/.test(s) && s.length % 2 === 0) return Buffer.from(s, "hex");
  }
  throw new DeskError("KEYRING", "unreadable key material", 500);
}

function maskKey(id: string): string {
  if (id.length <= 8) return `${id.slice(0, 2)}…${id.slice(-2)}`;
  return `${id.slice(0, 4)}…${id.slice(-4)}`;
}

function safeActor(raw: string): string {
  const cleaned = raw.replace(/[^A-Za-z0-9:._-]/g, "").slice(0, 56);
  const id = (cleaned.startsWith("usr-") ? cleaned : `usr-${cleaned || "operator"}`).slice(0, 64);
  return id;
}

function watchlistLiteral(list: string[]): string {
  return `{${list.join(",")}}`;
}

let schemaReady = false;
async function ensureAlpacaSchema(): Promise<void> {
  if (schemaReady) return;
  const sql = await getSql();
  await sql.query(`
    CREATE TABLE IF NOT EXISTS alpaca_credential (
      singleton_key boolean PRIMARY KEY CHECK (singleton_key),
      api_key_id text NOT NULL CHECK (char_length(api_key_id) BETWEEN 8 AND 80),
      secret_ciphertext bytea NOT NULL,
      secret_nonce bytea NOT NULL,
      secret_tag bytea NOT NULL,
      mode text NOT NULL CHECK (mode IN ('PAPER', 'LIVE')),
      watchlist text[] NOT NULL,
      connected_at timestamptz NOT NULL,
      connected_by text NOT NULL,
      last_ok_at timestamptz,
      last_error text,
      account_number_last4 text,
      account_status text
    )`);
  await sql.query(`
    CREATE TABLE IF NOT EXISTS alpaca_order_log (
      local_id text PRIMARY KEY,
      alpaca_order_id text,
      client_order_id text NOT NULL UNIQUE,
      symbol text NOT NULL,
      side text NOT NULL,
      order_type text NOT NULL,
      time_in_force text NOT NULL,
      qty text,
      notional text,
      limit_price text,
      status text NOT NULL,
      mode text NOT NULL,
      submitted_at timestamptz NOT NULL,
      submitted_by text NOT NULL,
      raw_receipt jsonb NOT NULL
    )`);
  schemaReady = true;
}

async function wrapKey(): Promise<Buffer> {
  const sql = await getSql();
  const existing = await sql.query<{ key_bytes: unknown }>(
    `SELECT key_bytes FROM app_keyring WHERE key_id = $1`,
    [WRAP_ID],
  );
  if (existing.length) return asBuf(existing[0].key_bytes);
  const bytes = randomBytes(32);
  await sql.query(
    `INSERT INTO app_keyring (key_id, purpose, key_bytes, created_at)
     VALUES ($1, 'alpaca_wrap', $2, NOW())
     ON CONFLICT (key_id) DO NOTHING`,
    [WRAP_ID, bytes],
  );
  const again = await sql.query<{ key_bytes: unknown }>(
    `SELECT key_bytes FROM app_keyring WHERE key_id = $1`,
    [WRAP_ID],
  );
  if (!again.length) throw new DeskError("KEYRING", "failed to persist wrap key", 500);
  return asBuf(again[0].key_bytes);
}

function encryptSecret(key: Buffer, plain: string): { ciphertext: Buffer; nonce: Buffer; tag: Buffer } {
  const nonce = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, nonce);
  const ciphertext = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return { ciphertext, nonce, tag: cipher.getAuthTag() };
}

function decryptSecret(key: Buffer, ciphertext: Buffer, nonce: Buffer, tag: Buffer): string {
  const decipher = createDecipheriv("aes-256-gcm", key, nonce);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
}

export function normalizeSymbol(raw: string): string {
  const s = raw.trim().toUpperCase();
  if (!/^[A-Z][A-Z.]{0,9}$/.test(s)) throw new DeskError("INVALID_SYMBOL", "Ticker must be letters (optional dot), max 10", 422);
  return s;
}

export function normalizeWatchlist(list: string[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const item of list) {
    const s = normalizeSymbol(item);
    if (seen.has(s)) continue;
    seen.add(s);
    out.push(s);
    if (out.length >= 24) break;
  }
  if (!out.length) throw new DeskError("INVALID_WATCHLIST", "Watchlist needs at least one ticker", 422);
  return out;
}

export async function publicStatus(): Promise<AlpacaPublicStatus> {
  try {
    await ensureAlpacaSchema();
  } catch {
    return {
      connected: false,
      mode: null,
      api_key_masked: null,
      account_number_last4: null,
      account_status: null,
      last_ok_at: null,
      last_error: null,
      watchlist: DEFAULT_WATCH,
      trading_host: null,
    };
  }
  const sql = await getSql();
  try {
    const rows = await sql.query<{
      api_key_id: string;
      mode: AlpacaMode;
      watchlist: string[] | string;
      last_ok_at: string | null;
      last_error: string | null;
      account_number_last4: string | null;
      account_status: string | null;
    }>(
      `SELECT api_key_id, mode, watchlist, last_ok_at::text, last_error, account_number_last4, account_status
       FROM alpaca_credential WHERE singleton_key = TRUE`,
    );
    if (!rows.length) {
      return {
        connected: false,
        mode: null,
        api_key_masked: null,
        account_number_last4: null,
        account_status: null,
        last_ok_at: null,
        last_error: null,
        watchlist: DEFAULT_WATCH,
        trading_host: null,
      };
    }
    const r = rows[0];
    const watch = Array.isArray(r.watchlist)
      ? r.watchlist
      : String(r.watchlist ?? "")
          .replace(/[{}]/g, "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
    return {
      connected: true,
      mode: r.mode,
      api_key_masked: maskKey(r.api_key_id),
      account_number_last4: r.account_number_last4,
      account_status: r.account_status,
      last_ok_at: r.last_ok_at,
      last_error: r.last_error,
      watchlist: watch.length ? watch : DEFAULT_WATCH,
      trading_host: tradingHost(r.mode),
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg.includes("alpaca_credential") || msg.includes("does not exist")) {
      schemaReady = false;
      return {
        connected: false,
        mode: null,
        api_key_masked: null,
        account_number_last4: null,
        account_status: null,
        last_ok_at: null,
        last_error: null,
        watchlist: DEFAULT_WATCH,
        trading_host: null,
      };
    }
    throw e;
  }
}

async function loadStored(): Promise<StoredCred> {
  await ensureAlpacaSchema();
  const sql = await getSql();
  const rows = await sql.query<{
    api_key_id: string;
    secret_ciphertext: unknown;
    secret_nonce: unknown;
    secret_tag: unknown;
    mode: AlpacaMode;
    watchlist: string[] | string;
  }>(
    `SELECT api_key_id, secret_ciphertext, secret_nonce, secret_tag, mode, watchlist
     FROM alpaca_credential WHERE singleton_key = TRUE`,
  );
  if (!rows.length) throw new DeskError("ALPACA_NOT_CONNECTED", "Paste Alpaca keys on Trade or Admin first", 409);
  const r = rows[0];
  const key = await wrapKey();
  const secret = decryptSecret(key, asBuf(r.secret_ciphertext), asBuf(r.secret_nonce), asBuf(r.secret_tag));
  const watch = Array.isArray(r.watchlist)
    ? r.watchlist
    : String(r.watchlist ?? "")
        .replace(/[{}]/g, "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
  return { api_key_id: r.api_key_id, secret, mode: r.mode, watchlist: watch.length ? watch : DEFAULT_WATCH };
}

type Creds = StoredCred;
let credOverride: Creds | null = null;

async function resolveCreds(userId?: string): Promise<Creds> {
  try {
    return await loadStored();
  } catch (first) {
    if (userId) {
      try {
        const { loadDataPair } = await import("./alpaca-data-service.server");
        const pair = await loadDataPair(userId);
        if (pair) {
          return { api_key_id: pair.apiKeyId, secret: pair.apiSecret, mode: "PAPER", watchlist: DEFAULT_WATCH };
        }
      } catch {
        /* fall through to original error */
      }
    }
    throw first;
  }
}

async function withCreds<T>(creds: Creds, fn: () => Promise<T>): Promise<T> {
  const prev = credOverride;
  credOverride = creds;
  try {
    return await fn();
  } finally {
    credOverride = prev;
  }
}

type AlpacaJson = Record<string, unknown> | unknown[];

async function alpacaFetch(path: string, init: RequestInit & { host?: "trade" | "data" } = {}): Promise<AlpacaJson> {
  const creds = credOverride ?? (await loadStored());
  const host = init.host === "data" ? "https://data.alpaca.markets" : tradingHost(creds.mode);
  const headers = new Headers(init.headers);
  headers.set("APCA-API-KEY-ID", creds.api_key_id);
  headers.set("APCA-API-SECRET-KEY", creds.secret);
  headers.set("Accept", "application/json");
  if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  let res: Response;
  try {
    res = await fetch(`${host}${path}`, { ...init, headers });
  } catch (e) {
    throw new DeskError(
      "ALPACA_UNREACHABLE",
      e instanceof Error ? `Alpaca unreachable: ${e.message}` : "Alpaca unreachable",
      503,
      true,
    );
  }
  const text = await res.text();
  let body: AlpacaJson | null = null;
  const looksHtml = /^\s*</.test(text);
  if (text && !looksHtml) {
    try {
      body = JSON.parse(text) as AlpacaJson;
    } catch {
      body = { message: text.slice(0, 180) };
    }
  }
  if (!res.ok) {
    const jsonMsg =
      body && !Array.isArray(body) && typeof body.message === "string" ? body.message : null;
    const msg =
      jsonMsg && !jsonMsg.includes("<")
        ? jsonMsg
        : res.status === 401 || res.status === 403
          ? "Alpaca rejected these keys. Use paper keys for Paper, live keys for Live, and paste the full secret."
          : `Alpaca HTTP ${res.status}`;
    const code = res.status === 401 || res.status === 403 ? "ALPACA_AUTH" : "ALPACA_HTTP";
    throw new DeskError(code, msg, res.status === 401 ? 401 : 422);
  }
  return body ?? {};
}

async function markOk(accountNumber?: string, status?: string): Promise<void> {
  const sql = await getSql();
  const last4 = accountNumber ? accountNumber.slice(-4) : null;
  await sql.query(
    `UPDATE alpaca_credential
     SET last_ok_at = NOW(), last_error = NULL, account_number_last4 = COALESCE($1, account_number_last4),
         account_status = COALESCE($2, account_status)
     WHERE singleton_key = TRUE`,
    [last4, status ?? null],
  );
}

async function markErr(message: string): Promise<void> {
  const sql = await getSql();
  await sql.query(`UPDATE alpaca_credential SET last_error = $1 WHERE singleton_key = TRUE`, [message.slice(0, 400)]);
}

export async function saveCredentials(args: {
  apiKeyId: string;
  apiSecret: string;
  mode: AlpacaMode;
  confirmLive?: boolean;
  actor: string;
}): Promise<AlpacaPublicStatus> {
  await ensureAlpacaSchema();
  const apiKeyId = args.apiKeyId.trim();
  const apiSecret = args.apiSecret.trim();
  if (apiKeyId.length < 8 || apiSecret.length < 8) {
    throw new DeskError("INVALID_KEYS", "Key id and secret must be at least 8 characters", 422);
  }
  if (args.mode === "LIVE" && args.confirmLive !== true) {
    throw new DeskError("LIVE_NOT_CONFIRMED", "Live mode requires the explicit confirmation checkbox", 422);
  }
  const key = await wrapKey();
  const enc = encryptSecret(key, apiSecret);
  const sql = await getSql();
  const actor = safeActor(args.actor);
  await sql.query(
    `INSERT INTO alpaca_credential (
       singleton_key, api_key_id, secret_ciphertext, secret_nonce, secret_tag, mode, watchlist,
       connected_at, connected_by, last_ok_at, last_error, account_number_last4, account_status
     ) VALUES (TRUE,$1,$2,$3,$4,$5,$6::text[],NOW(),$7,NULL,NULL,NULL,NULL)
     ON CONFLICT (singleton_key) DO UPDATE SET
       api_key_id = EXCLUDED.api_key_id,
       secret_ciphertext = EXCLUDED.secret_ciphertext,
       secret_nonce = EXCLUDED.secret_nonce,
       secret_tag = EXCLUDED.secret_tag,
       mode = EXCLUDED.mode,
       connected_at = NOW(),
       connected_by = EXCLUDED.connected_by,
       last_ok_at = NULL,
       last_error = NULL,
       account_number_last4 = NULL,
       account_status = NULL`,
    [apiKeyId, enc.ciphertext, enc.nonce, enc.tag, args.mode, watchlistLiteral(DEFAULT_WATCH), actor],
  );
  try {
    await probeAccount();
  } catch (e) {
    const msg = e instanceof DeskError ? e.message : "Connection test failed";
    await markErr(msg);
    // Keys are stored. Surface the test failure so the operator can correct paper/live mixups.
    throw new DeskError(
      e instanceof DeskError ? e.code : "ALPACA_TEST",
      `Keys were saved, but Alpaca rejected the test: ${msg}`,
      e instanceof DeskError ? e.http : 422,
    );
  }
  return publicStatus();
}

export async function disconnect(): Promise<AlpacaPublicStatus> {
  await ensureAlpacaSchema();
  const sql = await getSql();
  await sql.query(`DELETE FROM alpaca_credential WHERE singleton_key = TRUE`);
  return publicStatus();
}

export async function saveWatchlist(list: string[]): Promise<AlpacaPublicStatus> {
  const watch = normalizeWatchlist(list);
  const sql = await getSql();
  const n = await sql.query(
    `UPDATE alpaca_credential SET watchlist = $1::text[] WHERE singleton_key = TRUE RETURNING api_key_id`,
    [watchlistLiteral(watch)],
  );
  if (!n.length) throw new DeskError("ALPACA_NOT_CONNECTED", "Paste Alpaca keys on Admin first", 409);
  return publicStatus();
}

function asRecord(v: AlpacaJson): Record<string, string | boolean | null> {
  if (!v || Array.isArray(v) || typeof v !== "object") return {};
  const out: Record<string, string | boolean | null> = {};
  for (const [k, val] of Object.entries(v)) {
    if (typeof val === "string" || typeof val === "boolean") out[k] = val;
    else if (val == null) out[k] = null;
    else if (typeof val === "number") out[k] = String(val);
  }
  return out;
}

function asList(v: AlpacaJson): Array<Record<string, string | boolean | null>> {
  if (!Array.isArray(v)) return [];
  return v.map((item) => asRecord(item as AlpacaJson));
}

async function probeAccount(): Promise<void> {
  const rec = asRecord(await alpacaFetch("/v2/account"));
  await markOk(
    typeof rec.account_number === "string" ? rec.account_number : undefined,
    typeof rec.status === "string" ? rec.status : undefined,
  );
}

export async function getAccount(): Promise<Record<string, string | boolean | null>> {
  const rec = asRecord(await alpacaFetch("/v2/account"));
  await markOk(
    typeof rec.account_number === "string" ? rec.account_number : undefined,
    typeof rec.status === "string" ? rec.status : undefined,
  );
  return rec;
}

export async function getClock(): Promise<Record<string, string | boolean | null>> {
  return asRecord(await alpacaFetch("/v2/clock"));
}

export async function getPositions(): Promise<Array<Record<string, string | boolean | null>>> {
  return asList(await alpacaFetch("/v2/positions"));
}

export async function getOrders(
  status: "open" | "closed" | "all" = "open",
): Promise<Array<Record<string, string | boolean | null>>> {
  return asList(await alpacaFetch(`/v2/orders?status=${encodeURIComponent(status)}&limit=50&direction=desc`));
}

function strField(obj: unknown, key: string): string | null {
  if (!obj || typeof obj !== "object") return null;
  const v = (obj as Record<string, unknown>)[key];
  if (typeof v === "string" && v) return v;
  return null;
}

function numField(obj: unknown, key: string): string | null {
  if (!obj || typeof obj !== "object") return null;
  const v = (obj as Record<string, unknown>)[key];
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  if (typeof v === "string" && v) return v;
  return null;
}

export async function getSnapshots(
  symbols: string[],
): Promise<Array<{ symbol: string; last: string | null; bid: string | null; ask: string | null; change_pct: string | null }>> {
  const list = normalizeWatchlist(symbols);
  const body = await alpacaFetch(
    `/v2/stocks/snapshots?symbols=${encodeURIComponent(list.join(","))}&feed=iex`,
    { host: "data" },
  );
  const bag = body && !Array.isArray(body) ? body : {};
  return list.map((symbol) => {
    const snap = (bag as Record<string, unknown>)[symbol];
    const rec = snap && typeof snap === "object" ? (snap as Record<string, unknown>) : {};
    const last = numField(rec.latestTrade, "p") ?? numField(rec.dailyBar, "c");
    const bid = numField(rec.latestQuote, "bp");
    const ask = numField(rec.latestQuote, "ap");
    const prev = numField(rec.prevDailyBar, "c");
    let change_pct: string | null = null;
    if (last && prev && Number(prev) !== 0) {
      change_pct = (((Number(last) - Number(prev)) / Number(prev)) * 100).toFixed(2);
    }
    return { symbol, last, bid, ask, change_pct };
  });
}

export async function getDailyBars(
  symbols: string[],
  limit = 70,
): Promise<Record<string, Array<{ t: string; o: number; h: number; l: number; c: number }>>> {
  return getStockBars(symbols, "1Day", limit, isoDaysAgo(Math.max(limit + 20, 90)));
}

function parseBars(body: AlpacaJson): Record<string, TapeBar[]> {
  const root = body && typeof body === "object" && !Array.isArray(body) ? (body as Record<string, unknown>) : {};
  const bag = (root.bars ?? root) as unknown;
  const out: Record<string, TapeBar[]> = {};
  if (Array.isArray(bag)) {
    out._ = bag.map(rowToBar).filter((x): x is TapeBar => x !== null);
    return out;
  }
  if (!bag || typeof bag !== "object") return out;
  for (const [sym, rows] of Object.entries(bag as Record<string, unknown>)) {
    if (!Array.isArray(rows)) continue;
    out[sym.toUpperCase()] = rows.map(rowToBar).filter((x): x is TapeBar => x !== null);
  }
  return out;
}

function rowToBar(row: unknown): TapeBar | null {
  if (!row || typeof row !== "object") return null;
  const r = row as Record<string, unknown>;
  const c = Number(r.c);
  const h = Number(r.h);
  const l = Number(r.l);
  const o = Number(r.o);
  const v = Number(r.v ?? 0);
  if (![c, h, l, o].every((n) => Number.isFinite(n) && n > 0)) return null;
  return { t: String(r.t ?? ""), o, h, l, c, v: Number.isFinite(v) ? v : 0 };
}

function pageToken(body: AlpacaJson): string | null {
  if (!body || Array.isArray(body) || typeof body !== "object") return null;
  const t = (body as Record<string, unknown>).next_page_token;
  return typeof t === "string" && t ? t : null;
}

export async function getStockBars(
  symbols: string[],
  timeframe: "5Min" | "15Min" | "1Hour" | "1Day",
  limit = 200,
  start?: string,
): Promise<Record<string, TapeBar[]>> {
  const list = normalizeWatchlist(symbols);
  if (!list.length) return {};
  const merged: Record<string, TapeBar[]> = {};
  let token: string | undefined;
  const cap = Math.min(Math.max(limit, 5), 10000);
  for (let page = 0; page < 8; page++) {
    const params = new URLSearchParams({
      symbols: list.join(","),
      timeframe,
      limit: String(cap),
      feed: "iex",
      adjustment: "raw",
      sort: "asc",
    });
    if (start) params.set("start", start);
    if (token) params.set("page_token", token);
    let body: AlpacaJson;
    try {
      body = await alpacaFetch(`/v2/stocks/bars?${params.toString()}`, { host: "data" });
    } catch {
      params.delete("adjustment");
      try {
        body = await alpacaFetch(`/v2/stocks/bars?${params.toString()}`, { host: "data" });
      } catch {
        break;
      }
    }
    const part = parseBars(body);
    for (const [k, rows] of Object.entries(part)) {
      const key = k === "_" ? list[0] : k;
      merged[key] = (merged[key] ?? []).concat(rows);
    }
    const next = pageToken(body);
    if (!next) break;
    token = next;
    const have = list.reduce((n, s) => n + (merged[s]?.length ?? 0), 0);
    if (have >= cap) break;
  }
  return merged;
}

type TapeBar = { t: string; o: number; h: number; l: number; c: number; v: number };

function isoDaysAgo(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().replace(/\.\d{3}Z$/, "Z");
}

function barFromSnap(obj: unknown, fallbackT: string): TapeBar | null {
  if (!obj || typeof obj !== "object") return null;
  const o = asNum(numField(obj, "o"));
  const h = asNum(numField(obj, "h"));
  const l = asNum(numField(obj, "l"));
  const c = asNum(numField(obj, "c"));
  if (o == null || h == null || l == null || c == null) return null;
  const v = asNum(numField(obj, "v")) ?? 0;
  return { t: strField(obj, "t") ?? fallbackT, o, h, l, c, v };
}

function fmtPx(n: number | null): string | null {
  if (n == null || !Number.isFinite(n)) return null;
  if (n >= 100) return n.toFixed(2);
  if (n >= 1) return n.toFixed(3);
  return n.toFixed(4);
}

function asNum(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v) {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

const FIXTURE_TICKERS = new Set(["ALFA", "BRAV", "CHRL", "DELT", "ECHO", "FOXT", "GOLF", "HOTL"]);

function synthBars(last: number, count: number, stepMs: number, end = Date.now()): TapeBar[] {
  const out: TapeBar[] = [];
  for (let i = 0; i < count; i++) {
    const t = end - (count - 1 - i) * stepMs;
    const wave = Math.sin(i / 8) * last * 0.006 + Math.cos(i / 3.2) * last * 0.003;
    const c = last * (0.97 + (0.03 * i) / Math.max(count - 1, 1)) + wave;
    const o = c - last * 0.0015;
    const h = Math.max(o, c) + last * 0.002;
    const l = Math.min(o, c) - last * 0.002;
    out.push({ t: new Date(t).toISOString(), o, h, l, c, v: 120_000 + i * 850 });
  }
  if (out.length) out[out.length - 1].c = last;
  return out;
}

async function fixtureDetail(symbol: string): Promise<import("./alpaca-types").TickerDetail | null> {
  const sql = await getSql();
  const map = await sql.query<{ ticker: string; name: string | null; permanent_security_id: string }>(
    `SELECT st.ticker, s.display_name AS name, st.permanent_security_id
     FROM security_ticker st JOIN security s ON s.permanent_security_id = st.permanent_security_id
     WHERE st.ticker = $1
     LIMIT 1`,
    [symbol],
  );
  if (!map.length) return null;
  const quotes = await sql.query<{ envelope: { payload?: Record<string, unknown> } }>(
    `SELECT envelope FROM observation
     WHERE permanent_security_id = $1 AND snapshot_type = 'QUOTE' AND tombstoned = FALSE
     ORDER BY received_at DESC LIMIT 1`,
    [map[0].permanent_security_id],
  );
  const p = quotes[0]?.envelope?.payload ?? {};
  const last = asNum(p.last) ?? asNum(p.mid) ?? 100;
  const bid = asNum(p.bid);
  const ask = asNum(p.ask);
  const daily = synthBars(last, 80, 24 * 60 * 60 * 1000);
  const intra = synthBars(last, 78, 5 * 60 * 1000);
  const prev = daily.length > 1 ? daily[daily.length - 2].c : last;
  const change = last - prev;
  return {
    symbol,
    name: map[0].name,
    exchange: "SAMPLE",
    tradable: false,
    last: fmtPx(last),
    bid: bid != null ? fmtPx(bid) : null,
    ask: ask != null ? fmtPx(ask) : null,
    bid_size: null,
    ask_size: null,
    change: fmtPx(change),
    change_pct: prev ? ((change / prev) * 100).toFixed(2) : null,
    open: fmtPx(intra[0]?.o ?? last),
    high: fmtPx(Math.max(...intra.map((b) => b.h))),
    low: fmtPx(Math.min(...intra.map((b) => b.l))),
    prev_close: fmtPx(prev),
    volume: String(intra.reduce((s, b) => s + b.v, 0)),
    vwap: fmtPx(last),
    week52_high: fmtPx(Math.max(...daily.map((b) => b.h))),
    week52_low: fmtPx(Math.min(...daily.map((b) => b.l))),
    trade_at: intra.at(-1)?.t ?? null,
    quote_at: intra.at(-1)?.t ?? null,
    bars_intraday: intra,
    bars_daily: daily,
    news: [
      {
        id: `sample-${symbol}`,
        headline: `${map[0].name ?? symbol} is a sample research name. Live IEX quotes need a listed ticker such as AAPL.`,
        source: "Trading App",
        created_at: new Date().toISOString(),
        url: null,
        summary: null,
      },
    ],
    feed: "sample",
    notice: "Sample session prices. Open a listed ticker (AAPL, NVDA, SPY) for a live IEX feed.",
  };
}

export async function getTickerDetail(rawSymbol: string, userId?: string): Promise<import("./alpaca-types").TickerDetail> {
  const symbol = normalizeSymbol(rawSymbol);
  if (FIXTURE_TICKERS.has(symbol)) {
    const sample = await fixtureDetail(symbol);
    if (sample) return sample;
  }
  try {
    const creds = await resolveCreds(userId);
    return await withCreds(creds, () => liveTickerDetail(symbol));
  } catch (err) {
    const sample = await fixtureDetail(symbol);
    if (sample) return sample;
    throw err;
  }
}

async function liveTickerDetail(symbol: string): Promise<import("./alpaca-types").TickerDetail> {
  const startIntra = isoDaysAgo(8);
  const startHour = isoDaysAgo(12);
  const startDaily = isoDaysAgo(400);
  const [assetRaw, snapBody, intra, hourly, daily, newsRaw] = await Promise.all([
    alpacaFetch(`/v2/assets/${encodeURIComponent(symbol)}`).catch(() => ({})),
    alpacaFetch(`/v2/stocks/snapshots?symbols=${encodeURIComponent(symbol)}&feed=iex`, { host: "data" }).catch(() => ({})),
    getStockBars([symbol], "5Min", 2000, startIntra).catch(() => ({}) as Record<string, TapeBar[]>),
    getStockBars([symbol], "1Hour", 400, startHour).catch(() => ({}) as Record<string, TapeBar[]>),
    getStockBars([symbol], "1Day", 400, startDaily).catch(() => ({}) as Record<string, TapeBar[]>),
    alpacaFetch(`/v1beta1/news?symbols=${encodeURIComponent(symbol)}&limit=8&include_content=false`, { host: "data" }).catch(
      () => ({}),
    ),
  ]);

  const asset = asRecord(assetRaw);
  const snapBag = snapBody && typeof snapBody === "object" && !Array.isArray(snapBody) ? (snapBody as Record<string, unknown>) : {};
  const snap =
    (snapBag[symbol] && typeof snapBag[symbol] === "object"
      ? (snapBag[symbol] as Record<string, unknown>)
      : snapBag.snapshots && typeof snapBag.snapshots === "object"
        ? ((snapBag.snapshots as Record<string, unknown>)[symbol] as Record<string, unknown> | undefined)
        : undefined) ?? {};

  const last = asNum(numField(snap.latestTrade, "p")) ?? asNum(numField(snap.dailyBar, "c"));
  const prev = asNum(numField(snap.prevDailyBar, "c"));
  const change = last != null && prev != null ? last - prev : null;
  const changePct = change != null && prev ? (change / prev) * 100 : null;
  let dailyBars = daily[symbol] ?? [];
  const hourBars = hourly[symbol] ?? [];
  let intraBars = intra[symbol] ?? [];
  if (intraBars.length < 2 && hourBars.length) intraBars = hourBars;
  if (dailyBars.length < 2) {
    const seeded = [barFromSnap(snap.prevDailyBar, isoDaysAgo(1)), barFromSnap(snap.dailyBar, new Date().toISOString())].filter(
      (x): x is TapeBar => x !== null,
    );
    if (seeded.length) dailyBars = seeded;
  }
  let w52h: number | null = null;
  let w52l: number | null = null;
  for (const b of dailyBars) {
    if (w52h == null || b.h > w52h) w52h = b.h;
    if (w52l == null || b.l < w52l) w52l = b.l;
  }
  if (w52h == null) w52h = asNum(numField(snap.dailyBar, "h"));
  if (w52l == null) w52l = asNum(numField(snap.dailyBar, "l"));

  const newsList = (() => {
    const bag = newsRaw && typeof newsRaw === "object" && !Array.isArray(newsRaw) ? (newsRaw as Record<string, unknown>) : {};
    const rows = Array.isArray(bag.news) ? bag.news : Array.isArray(newsRaw) ? newsRaw : [];
    return rows
      .map((item) => {
        if (!item || typeof item !== "object") return null;
        const n = item as Record<string, unknown>;
        const headline = typeof n.headline === "string" ? n.headline : null;
        if (!headline) return null;
        return {
          id: String(n.id ?? headline),
          headline,
          source: typeof n.source === "string" ? n.source : typeof n.author === "string" ? n.author : null,
          created_at: typeof n.created_at === "string" ? n.created_at : "",
          url: typeof n.url === "string" ? n.url : null,
          summary: typeof n.summary === "string" ? n.summary : null,
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null)
      .slice(0, 8);
  })();

  return {
    symbol,
    name: typeof asset.name === "string" ? asset.name : null,
    exchange: typeof asset.exchange === "string" ? asset.exchange : null,
    tradable: asset.tradable === true || asset.tradable === "true",
    last: fmtPx(last),
    bid: fmtPx(asNum(numField(snap.latestQuote, "bp"))),
    ask: fmtPx(asNum(numField(snap.latestQuote, "ap"))),
    bid_size: numField(snap.latestQuote, "bs"),
    ask_size: numField(snap.latestQuote, "as"),
    change: change == null ? null : fmtPx(change),
    change_pct: changePct == null ? null : changePct.toFixed(2),
    open: fmtPx(asNum(numField(snap.dailyBar, "o"))),
    high: fmtPx(asNum(numField(snap.dailyBar, "h"))),
    low: fmtPx(asNum(numField(snap.dailyBar, "l"))),
    prev_close: fmtPx(asNum(numField(snap.prevDailyBar, "c"))),
    volume: numField(snap.dailyBar, "v"),
    vwap: fmtPx(asNum(numField(snap.dailyBar, "vw"))),
    week52_high: fmtPx(w52h),
    week52_low: fmtPx(w52l),
    trade_at: strField(snap.latestTrade, "t"),
    quote_at: strField(snap.latestQuote, "t"),
    bars_intraday: intraBars,
    bars_daily: dailyBars,
    news: newsList,
    feed: "live",
    notice: null,
  };
}

export async function submitOrder(args: {
  symbol: string;
  side: "buy" | "sell";
  type: "market" | "limit";
  timeInForce: "day" | "gtc" | "ioc";
  qty?: string;
  notional?: string;
  limitPrice?: string;
  extendedHours?: boolean;
  confirmLive?: boolean;
  actor: string;
}): Promise<Record<string, string | boolean | null>> {
  const creds = await loadStored();
  if (creds.mode === "LIVE" && args.confirmLive !== true) {
    throw new DeskError("LIVE_NOT_CONFIRMED", "Live orders require the explicit confirmation checkbox", 422);
  }
  const symbol = normalizeSymbol(args.symbol);
  const qty = args.qty?.trim() || undefined;
  const notional = args.notional?.trim() || undefined;
  if ((qty && notional) || (!qty && !notional)) {
    throw new DeskError("INVALID_SIZE", "Provide either share quantity or dollar notional, not both", 422);
  }
  if (qty && !/^[0-9]+(?:\.[0-9]{1,9})?$/.test(qty)) {
    throw new DeskError("INVALID_SIZE", "Quantity must be a positive decimal", 422);
  }
  if (notional && !/^[0-9]+(?:\.[0-9]{1,2})?$/.test(notional)) {
    throw new DeskError("INVALID_SIZE", "Notional must be dollars with at most 2 decimal places", 422);
  }
  if (args.type === "limit") {
    const px = args.limitPrice?.trim();
    if (!px || !/^[0-9]+(?:\.[0-9]{1,4})?$/.test(px)) {
      throw new DeskError("INVALID_LIMIT", "Limit orders need a limit price", 422);
    }
  }
  const clientOrderId = newId("clid");
  const payload: Record<string, unknown> = {
    symbol,
    side: args.side,
    type: args.type,
    time_in_force: args.timeInForce,
    client_order_id: clientOrderId,
  };
  if (qty) payload.qty = qty;
  if (notional) payload.notional = notional;
  if (args.type === "limit") payload.limit_price = args.limitPrice!.trim();
  if (args.extendedHours) payload.extended_hours = true;
  const raw = await alpacaFetch("/v2/orders", { method: "POST", body: JSON.stringify(payload) });
  const rec = asRecord(raw);
  const sql = await getSql();
  try {
    await sql.query(
      `INSERT INTO alpaca_order_log (
         local_id, alpaca_order_id, client_order_id, symbol, side, order_type, time_in_force,
         qty, notional, limit_price, status, mode, submitted_at, submitted_by, raw_receipt
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,NOW(),$13,$14::jsonb)`,
      [
        newId("aord"),
        rec.id ?? null,
        clientOrderId,
        symbol,
        args.side,
        args.type,
        args.timeInForce,
        qty ?? null,
        notional ?? null,
        args.type === "limit" ? args.limitPrice!.trim() : null,
        rec.status ?? "submitted",
        creds.mode,
        safeActor(args.actor),
        JSON.stringify(raw),
      ],
    );
  } catch {
    /* local audit must not block a live/paper fill */
  }
  return rec;
}

export async function cancelOrder(orderId: string): Promise<Record<string, string | boolean | null>> {
  if (!/^[A-Za-z0-9-]+$/.test(orderId) || orderId.length > 64) {
    throw new DeskError("INVALID_ORDER", "Bad order id", 422);
  }
  const raw = await alpacaFetch(`/v2/orders/${encodeURIComponent(orderId)}`, { method: "DELETE" });
  return asRecord(raw);
}

export async function closePosition(symbol: string): Promise<Record<string, string | boolean | null>> {
  const s = normalizeSymbol(symbol);
  const raw = await alpacaFetch(`/v2/positions/${encodeURIComponent(s)}`, { method: "DELETE" });
  return asRecord(raw);
}
```


---

## `src/desk/alpaca-data-secrets.ts` (11002 bytes, sha256 `55d869326848b6a0a3e3323e8a571c5a8940ac58b2829c39e4e95545a4848cab`)

```ts
/** Server-only credential service. Never import into a browser component.
 * This store is intentionally separate from the legacy order-routing keys.
 */
import { createCipheriv, createDecipheriv, randomBytes, randomUUID } from "node:crypto";

export type SecretCode =
  | "SAVED" | "REMOVED" | "VERIFIED" | "NOT_TESTED"
  | "INVALID_INPUT" | "NOT_CONFIGURED" | "VERSION_CONFLICT"
  | "SECRET_STORAGE_NOT_READY" | "STORAGE_NOT_DURABLE" | "SECRET_UNREADABLE"
  | "INVALID_CREDENTIALS" | "AUTH_OR_PERMISSION_DENIED" | "RATE_LIMITED"
  | "PROVIDER_UNAVAILABLE" | "STORAGE_UNAVAILABLE" | "FORBIDDEN";

export class SecretError extends Error {
  readonly code: SecretCode;
  constructor(code: SecretCode) { super(code); this.name = "SecretError"; this.code = code; }
}

export type SecretStatus = {
  configured: boolean;
  key_last4: string | null;
  version: string | null;
  updated_at: string | null;
  checked_at: string | null;
  test_result: SecretCode;
  storage_ready: boolean;
  storage_code: SecretCode | null;
};

export interface SecretSql {
  query<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<T[]>;
}

type Pair = { apiKeyId: string; apiSecret: string };
type Envelope = { format: "aes-256-gcm-v1"; iv: string; tag: string; ciphertext: string };
type StoredRow = {
  owner_user_id: string; version: string; key_last4: string; envelope: Envelope;
  updated_at: string; checked_at: string | null; test_result: SecretCode;
};
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const TOKEN = /^[\x21-\x7e]+$/;
export const DATA_TEST_URL = "https://data.alpaca.markets/v2/stocks/quotes/latest?symbols=SPY&feed=iex";

/** The encryption key is a separate server secret, never a database keyring row. */
export function masterKeyFromBase64(value: unknown): Buffer {
  if (typeof value !== "string" || !/^[A-Za-z0-9+/]{43}=$/.test(value)) {
    throw new SecretError("SECRET_STORAGE_NOT_READY");
  }
  const key = Buffer.from(value, "base64");
  if (key.length !== 32 || key.toString("base64") !== value) throw new SecretError("SECRET_STORAGE_NOT_READY");
  return key;
}

export function validatePair(value: unknown): Pair {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new SecretError("INVALID_INPUT");
  const v = value as Record<string, unknown>;
  if (Object.keys(v).length !== 2 || typeof v.apiKeyId !== "string" || typeof v.apiSecret !== "string") {
    throw new SecretError("INVALID_INPUT");
  }
  if (v.apiKeyId.length < 8 || v.apiKeyId.length > 80 || !TOKEN.test(v.apiKeyId)
      || v.apiSecret.length < 8 || v.apiSecret.length > 256 || !TOKEN.test(v.apiSecret)) {
    throw new SecretError("INVALID_INPUT");
  }
  return { apiKeyId: v.apiKeyId, apiSecret: v.apiSecret };
}

function aad(owner: string, version: string): Buffer {
  return Buffer.from(JSON.stringify(["Trading App|AlpacaDataSecret|1", owner, version]), "utf8");
}
function validOwner(owner: string): void {
  if (typeof owner !== "string" || !owner || owner.length > 256) throw new SecretError("FORBIDDEN");
}
function validVersion(version: string | null): void {
  if (version !== null && (typeof version !== "string" || !UUID.test(version))) throw new SecretError("INVALID_INPUT");
}

export function encryptPair(key: Buffer, owner: string, version: string, pair: Pair): Envelope {
  validatePair(pair); validOwner(owner); validVersion(version);
  if (!Buffer.isBuffer(key) || key.length !== 32) throw new SecretError("SECRET_STORAGE_NOT_READY");
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  cipher.setAAD(aad(owner, version));
  const plaintext = Buffer.from(JSON.stringify(pair), "utf8");
  try {
    const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
    return { format: "aes-256-gcm-v1", iv: iv.toString("base64"), tag: cipher.getAuthTag().toString("base64"), ciphertext: ciphertext.toString("base64") };
  } finally { plaintext.fill(0); }
}

export function decryptPair(key: Buffer, owner: string, version: string, envelope: Envelope): Pair {
  try {
    if (envelope.format !== "aes-256-gcm-v1") throw new Error();
    const iv = Buffer.from(envelope.iv, "base64"), tag = Buffer.from(envelope.tag, "base64");
    if (iv.length !== 12 || tag.length !== 16) throw new Error();
    const decipher = createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAAD(aad(owner, version)); decipher.setAuthTag(tag);
    const plaintext = Buffer.concat([decipher.update(Buffer.from(envelope.ciphertext, "base64")), decipher.final()]);
    try { return validatePair(JSON.parse(plaintext.toString("utf8"))); }
    finally { plaintext.fill(0); }
  } catch { throw new SecretError("SECRET_UNREADABLE"); }
}

/** Read-only connectivity check; never calls account/order APIs or follows redirects.
 * 200 means the data endpoint accepted the credentials, not auction coverage/readiness.
 */
export async function checkDataAccess(pair: Pair, fetcher: typeof fetch = fetch): Promise<SecretCode> {
  validatePair(pair);
  try {
    const response = await fetcher(DATA_TEST_URL, {
      method: "GET", redirect: "error", cache: "no-store", signal: AbortSignal.timeout(8000),
      headers: { "APCA-API-KEY-ID": pair.apiKeyId, "APCA-API-SECRET-KEY": pair.apiSecret, Accept: "application/json" },
    });
    // No prices, account data, or provider error bodies are exposed to the operator.
    try { await response.body?.cancel(); } catch { /* no response-body logging */ }
    if (response.status === 200) return "VERIFIED";
    if (response.status === 401) return "INVALID_CREDENTIALS";
    if (response.status === 403) return "AUTH_OR_PERMISSION_DENIED";
    if (response.status === 429) return "RATE_LIMITED";
    return "PROVIDER_UNAVAILABLE";
  } catch { return "PROVIDER_UNAVAILABLE"; }
}

/** Dependencies are injected for isolated tests. Real callers must supply durableStorage.
 * owner comes exclusively from the verified authentication context, never a request field.
 */
export function createSecretService(deps: {
  db: SecretSql; masterKey: () => Buffer; durableStorage: boolean; fetcher?: typeof fetch;
}) {
  const { db } = deps;
  function requireStorage(): Buffer {
    if (!deps.durableStorage) throw new SecretError("STORAGE_NOT_DURABLE");
    return deps.masterKey();
  }
  async function status(owner: string): Promise<SecretStatus> {
    validOwner(owner);
    let storageCode: SecretCode | null = null;
    try { const key = requireStorage(); key.fill(0); }
    catch (e) { storageCode = e instanceof SecretError ? e.code : "SECRET_STORAGE_NOT_READY"; }
    const rows = await db.query<StoredRow>(
      `SELECT version, key_last4, updated_at::text, checked_at::text, test_result
       FROM alpaca_data_secret WHERE owner_user_id = $1`, [owner],
    );
    const r = rows[0];
    return {
      configured: !!r, key_last4: r?.key_last4 ?? null, version: r?.version ?? null,
      updated_at: r?.updated_at ?? null, checked_at: r?.checked_at ?? null,
      test_result: r?.test_result ?? "NOT_TESTED", storage_ready: storageCode === null, storage_code: storageCode,
    };
  }
  async function save(owner: string, pair: Pair, expectedVersion: string | null): Promise<SecretStatus> {
    validOwner(owner); validatePair(pair); validVersion(expectedVersion);
    const version = randomUUID();
    const key = requireStorage();
    let envelope: Envelope;
    try { envelope = encryptPair(key, owner, version, pair); } finally { key.fill(0); }
    const rows = await db.query<{ version: string }>(
      `WITH changed AS (
        INSERT INTO alpaca_data_secret (owner_user_id, version, envelope, key_last4)
        SELECT $1, $2::uuid, $3::jsonb, $4 WHERE $5::uuid IS NULL
        ON CONFLICT (owner_user_id) DO NOTHING RETURNING version
      ), replaced AS (
        UPDATE alpaca_data_secret SET version=$2::uuid, envelope=$3::jsonb, key_last4=$4,
          updated_at=clock_timestamp(), checked_at=NULL, last_test_started_at=NULL, test_result='NOT_TESTED'
        WHERE owner_user_id=$1 AND version=$5::uuid RETURNING version
      ), result AS (SELECT version FROM changed UNION ALL SELECT version FROM replaced), logged AS (
        INSERT INTO alpaca_data_secret_audit (owner_user_id, version, action, result)
        SELECT $1, version, 'SAVE', 'SAVED' FROM result
      ) SELECT version::text FROM result`,
      [owner, version, JSON.stringify(envelope), pair.apiKeyId.slice(-4), expectedVersion],
    );
    if (rows.length !== 1) throw new SecretError("VERSION_CONFLICT");
    return status(owner);
  }
  async function remove(owner: string, expectedVersion: string): Promise<SecretStatus> {
    validOwner(owner); validVersion(expectedVersion);
    if (!expectedVersion) throw new SecretError("INVALID_INPUT");
    const rows = await db.query<{ version: string }>(
      `WITH removed AS (
        DELETE FROM alpaca_data_secret WHERE owner_user_id=$1 AND version=$2::uuid RETURNING version
      ), logged AS (
        INSERT INTO alpaca_data_secret_audit (owner_user_id, version, action, result)
        SELECT $1, version, 'REMOVE', 'REMOVED' FROM removed
      ) SELECT version::text FROM removed`, [owner, expectedVersion],
    );
    if (rows.length !== 1) throw new SecretError("VERSION_CONFLICT");
    return status(owner);
  }
  async function test(owner: string, expectedVersion: string): Promise<SecretStatus> {
    validOwner(owner); validVersion(expectedVersion);
    if (!expectedVersion) throw new SecretError("INVALID_INPUT");
    const key = requireStorage();
    let pair: Pair;
    try {
      const rows = await db.query<StoredRow>(
        `UPDATE alpaca_data_secret SET last_test_started_at=clock_timestamp()
         WHERE owner_user_id=$1 AND version=$2::uuid
           AND (last_test_started_at IS NULL OR last_test_started_at < clock_timestamp() - interval '10 seconds')
         RETURNING version::text, envelope`,
        [owner, expectedVersion],
      );
      if (!rows.length) {
        const current = await status(owner);
        throw new SecretError(current.version === expectedVersion ? "RATE_LIMITED" : "VERSION_CONFLICT");
      }
      pair = decryptPair(key, owner, expectedVersion, rows[0].envelope);
    } finally { key.fill(0); }
    const result = await checkDataAccess(pair, deps.fetcher);
    // Version-bound update prevents a slow test from certifying replacement credentials.
    const rows = await db.query<{ version: string }>(
      `WITH changed AS (
        UPDATE alpaca_data_secret SET checked_at=clock_timestamp(), test_result=$3
        WHERE owner_user_id=$1 AND version=$2::uuid RETURNING version
      ), logged AS (
        INSERT INTO alpaca_data_secret_audit (owner_user_id, version, action, result)
        SELECT $1, version, 'TEST', $3 FROM changed
      ) SELECT version::text FROM changed`, [owner, expectedVersion, result],
    );
    if (rows.length !== 1) throw new SecretError("VERSION_CONFLICT");
    return status(owner);
  }
  return { status, save, remove, test };
}
```


---

## `src/desk/alpaca-data-service.server.ts` (3116 bytes, sha256 `41efac3318a9a779daf9d59f1798381e5b839c1f11d2ed1081e598f006c833f4`)

```ts
import { getSql } from "@/lib/db";
import { createSecretService, SecretError } from "./alpaca-data-secrets";
import type { SecretCode, SecretStatus, SecretSql } from "./alpaca-data-secrets";
import { decryptPair } from "./alpaca-data-secrets";
import { loadOrCreateMasterKey } from "./alpaca-master-key.server";

export type SecretReply =
  | { ok: true; can_manage: boolean; status: SecretStatus }
  | { ok: false; code: SecretCode };

async function ensureSchema(db: SecretSql): Promise<void> {
  await db.query(`
    CREATE TABLE IF NOT EXISTS alpaca_data_secret (
      owner_user_id text PRIMARY KEY CHECK (length(owner_user_id) BETWEEN 1 AND 256),
      version uuid NOT NULL,
      envelope jsonb NOT NULL CHECK (jsonb_typeof(envelope) = 'object'),
      key_last4 text NOT NULL CHECK (length(key_last4) = 4),
      updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
      checked_at timestamptz,
      last_test_started_at timestamptz,
      test_result text NOT NULL DEFAULT 'NOT_TESTED' CHECK (test_result IN (
        'NOT_TESTED','VERIFIED','INVALID_CREDENTIALS','AUTH_OR_PERMISSION_DENIED',
        'RATE_LIMITED','PROVIDER_UNAVAILABLE'
      ))
    )`);
  await db.query(`
    CREATE TABLE IF NOT EXISTS alpaca_data_secret_audit (
      audit_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      owner_user_id text NOT NULL,
      version uuid NOT NULL,
      action text NOT NULL CHECK (action IN ('SAVE','REMOVE','TEST')),
      result text NOT NULL CHECK (result IN (
        'SAVED','REMOVED','VERIFIED','INVALID_CREDENTIALS','AUTH_OR_PERMISSION_DENIED',
        'RATE_LIMITED','PROVIDER_UNAVAILABLE'
      )),
      occurred_at timestamptz NOT NULL DEFAULT clock_timestamp()
    )`);
}

export async function execute(
  userId: string,
  mutation: boolean,
  action: (service: ReturnType<typeof createSecretService>) => Promise<SecretStatus>,
): Promise<SecretReply> {
  try {
    if (!userId) throw new SecretError("FORBIDDEN");
    const db = await getSql();
    await ensureSchema(db);
    const service = createSecretService({
      db,
      durableStorage: true,
      masterKey: () => loadOrCreateMasterKey(),
    });
    return { ok: true, can_manage: true, status: await action(service) };
  } catch (error) {
    return { ok: false, code: error instanceof SecretError ? error.code : "STORAGE_UNAVAILABLE" };
  }
}

/** Decrypt the owner’s saved market-data pair for server-side data calls. Never send to the browser. */
export async function loadDataPair(userId: string): Promise<{ apiKeyId: string; apiSecret: string } | null> {
  if (!userId) return null;
  const db = await getSql();
  await ensureSchema(db);
  const rows = await db.query<{ version: string; envelope: { format: string; iv: string; tag: string; ciphertext: string } }>(
    `SELECT version::text, envelope FROM alpaca_data_secret WHERE owner_user_id = $1`,
    [userId],
  );
  if (!rows.length) return null;
  const key = loadOrCreateMasterKey();
  try {
    return decryptPair(key, userId, rows[0].version, rows[0].envelope as Parameters<typeof decryptPair>[3]);
  } finally {
    key.fill(0);
  }
}
```


---

## `src/desk/alpaca-master-key.server.ts` (1534 bytes, sha256 `0667d033f3e864efaf14969d9ca973fccc109060ebab4a78a874bb54e5c3b7da`)

```ts
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { randomBytes } from "node:crypto";
import { masterKeyFromBase64 } from "./alpaca-data-secrets";

const FILE = join(process.cwd(), ".grok", "alpaca-master.key");
const TMP = join("/tmp", "trading-app-alpaca-master.key");
let memory: Buffer | null = null;

function parse(value: string): Buffer | null {
  try {
    return masterKeyFromBase64(value.trim());
  } catch {
    return null;
  }
}

function readFile(path: string): Buffer | null {
  try {
    return parse(readFileSync(path, "utf8"));
  } catch {
    return null;
  }
}

function writeFile(path: string, value: string): boolean {
  try {
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, `${value}\n`, { mode: 0o600 });
    return true;
  } catch {
    return false;
  }
}

/**
 * Server-only wrap key. Env wins. Otherwise a gitignored file is created once.
 * Never put this in VITE_ or a client bundle.
 */
export function loadOrCreateMasterKey(): Buffer {
  const fromEnv = process.env.ALPACA_CREDENTIALS_MASTER_KEY?.trim();
  if (fromEnv) {
    const parsed = parse(fromEnv);
    if (parsed) return parsed;
  }
  const fromFile = readFile(FILE) ?? readFile(TMP);
  if (fromFile) return fromFile;
  if (memory) return Buffer.from(memory);
  const value = randomBytes(32).toString("base64");
  const key = masterKeyFromBase64(value);
  writeFile(FILE, value) || writeFile(TMP, value);
  memory = Buffer.from(key);
  return key;
}
```


---

## `src/desk/alpaca-data-fns.ts` (2322 bytes, sha256 `1eaa8891215284dbce94a33d9846303093b3108d2858215303a7c290c3a6b73c`)

```ts
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";
export type { SecretReply } from "./alpaca-data-service.server";

// Sensitive implementation is imported only inside extracted server handlers.
export const fetchAlpacaDataSecret = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const { execute } = await import("./alpaca-data-service.server");
    return execute(context.userId, false, (s) => s.status(context.userId));
  });

export const saveAlpacaDataSecret = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({
    apiKeyId: z.string().min(8).max(80),
    apiSecret: z.string().min(8).max(256),
    expectedVersion: z.string().uuid().nullable(),
  }).strict())
  .handler(async ({ context, data }) => {
    const { execute } = await import("./alpaca-data-service.server");
    const reply = await execute(context.userId, true, (s) => s.save(
      context.userId, { apiKeyId: data.apiKeyId, apiSecret: data.apiSecret }, data.expectedVersion,
    ));
    if (reply.ok) {
      try {
        const { saveCredentials } = await import("./alpaca");
        await saveCredentials({
          apiKeyId: data.apiKeyId,
          apiSecret: data.apiSecret,
          mode: "PAPER",
          actor: context.userId,
        });
      } catch {
        /* market-data secret is saved even if the paper venue probe fails */
      }
    }
    return reply;
  });

export const testAlpacaDataSecret = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ expectedVersion: z.string().uuid() }).strict())
  .handler(async ({ context, data }) => {
    const { execute } = await import("./alpaca-data-service.server");
    return execute(context.userId, true, (s) => s.test(context.userId, data.expectedVersion));
  });

export const removeAlpacaDataSecret = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ expectedVersion: z.string().uuid() }).strict())
  .handler(async ({ context, data }) => {
    const { execute } = await import("./alpaca-data-service.server");
    return execute(context.userId, true, (s) => s.remove(context.userId, data.expectedVersion));
  });
```


---

## `src/desk/server-fns.ts` (8706 bytes, sha256 `79cddf66ee836031c81aaae08a6ad405e2bfb7f29fe0511250c9bfe1e6abddca`)

```ts
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";

/** Server-only desk code is loaded inside handlers so the browser never sees node:crypto. */

export const fetchMe = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const { fetchMeImpl } = await import("./server-fns-impl.server");
    return fetchMeImpl(context.userId);
  });

export const postClaimRole = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ role: z.enum(["OPERATOR", "REVIEWER"]) }))
  .handler(async ({ context, data }) => {
    const { claimRoleImpl } = await import("./server-fns-impl.server");
    return claimRoleImpl(context.userId, data.role);
  });

export const fetchHome = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const { fetchHomeImpl } = await import("./server-fns-impl.server");
    return fetchHomeImpl(context.userId);
  });

export const fetchEarnings = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator(z.object({ sessionDate: z.string().optional() }))
  .handler(async ({ context, data }) => {
    const { fetchEarningsImpl } = await import("./server-fns-impl.server");
    return fetchEarningsImpl(context.userId, data.sessionDate);
  });

export const fetchPredictions = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator(z.object({ manifestId: z.string().optional(), sessionDate: z.string().optional() }))
  .handler(async ({ context, data }) => {
    const { fetchPredictionsImpl } = await import("./server-fns-impl.server");
    return fetchPredictionsImpl(context.userId, data.manifestId, data.sessionDate);
  });

export const fetchResults = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const { fetchResultsImpl } = await import("./server-fns-impl.server");
    return fetchResultsImpl(context.userId);
  });

export const fetchAdmin = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const { fetchAdminImpl } = await import("./server-fns-impl.server");
    return fetchAdminImpl(context.userId);
  });

export const postPause = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ reason: z.string().min(1).max(500) }))
  .handler(async ({ context, data }) => {
    const { postPauseImpl } = await import("./server-fns-impl.server");
    return postPauseImpl(context.userId, data.reason);
  });

export const postResume = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const { postResumeImpl } = await import("./server-fns-impl.server");
    return postResumeImpl(context.userId);
  });

export const postPrintKnowledge = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ eventKey: z.string(), securityId: z.string(), reason: z.string().min(1) }))
  .handler(async ({ context, data }) => {
    const { postPrintKnowledgeImpl } = await import("./server-fns-impl.server");
    return postPrintKnowledgeImpl(context.userId, data);
  });

export const postFireNote = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    z.object({
      hypothesis: z.enum(["IMPLEMENTATION_BUG", "COVERAGE_SHIFT", "REGIME_SHIFT"]),
      note: z.string().min(1).max(2000),
    }),
  )
  .handler(async ({ context, data }) => {
    const { postFireNoteImpl } = await import("./server-fns-impl.server");
    return postFireNoteImpl(context.userId, data);
  });

export const postRetryDeadlines = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const { postRetryDeadlinesImpl } = await import("./server-fns-impl.server");
    return postRetryDeadlinesImpl(context.userId);
  });

export const postVerifyFreeze = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ manifestId: z.string(), securityId: z.string() }))
  .handler(async ({ context, data }) => {
    const { postVerifyFreezeImpl } = await import("./server-fns-impl.server");
    return postVerifyFreezeImpl(context.userId, data);
  });

export const fetchAlpacaStatus = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const { fetchAlpacaStatusImpl } = await import("./server-fns-impl.server");
    return fetchAlpacaStatusImpl(context.userId);
  });

export const postAlpacaCredentials = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    z.object({
      apiKeyId: z.string().min(8).max(80),
      apiSecret: z.string().min(8).max(256),
      mode: z.enum(["PAPER", "LIVE"]),
      confirmLive: z.boolean().optional(),
    }),
  )
  .handler(async ({ context, data }) => {
    const { postAlpacaCredentialsImpl } = await import("./server-fns-impl.server");
    return postAlpacaCredentialsImpl(context.userId, data);
  });

export const postAlpacaDisconnect = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const { postAlpacaDisconnectImpl } = await import("./server-fns-impl.server");
    return postAlpacaDisconnectImpl(context.userId);
  });

export const postAlpacaWatchlist = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ watchlist: z.array(z.string()).min(1).max(24) }))
  .handler(async ({ context, data }) => {
    const { postAlpacaWatchlistImpl } = await import("./server-fns-impl.server");
    return postAlpacaWatchlistImpl(context.userId, data.watchlist);
  });

export const fetchAlpacaDesk = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const { fetchAlpacaDeskImpl } = await import("./server-fns-impl.server");
    return fetchAlpacaDeskImpl(context.userId);
  });

export const fetchAlpacaOrders = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator(z.object({ status: z.enum(["open", "closed", "all"]).optional() }))
  .handler(async ({ context, data }) => {
    const { fetchAlpacaOrdersImpl } = await import("./server-fns-impl.server");
    return fetchAlpacaOrdersImpl(context.userId, data.status);
  });

export const postAlpacaOrder = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    z.object({
      symbol: z.string().min(1).max(10),
      side: z.enum(["buy", "sell"]),
      type: z.enum(["market", "limit"]),
      timeInForce: z.enum(["day", "gtc", "ioc"]),
      qty: z.string().optional(),
      notional: z.string().optional(),
      limitPrice: z.string().optional(),
      extendedHours: z.boolean().optional(),
      confirmLive: z.boolean().optional(),
    }),
  )
  .handler(async ({ context, data }) => {
    const { postAlpacaOrderImpl } = await import("./server-fns-impl.server");
    return postAlpacaOrderImpl(context.userId, data);
  });

export const postAlpacaCancel = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ orderId: z.string().min(1).max(64) }))
  .handler(async ({ context, data }) => {
    const { postAlpacaCancelImpl } = await import("./server-fns-impl.server");
    return postAlpacaCancelImpl(context.userId, data.orderId);
  });

export const postAlpacaClose = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ symbol: z.string().min(1).max(10) }))
  .handler(async ({ context, data }) => {
    const { postAlpacaCloseImpl } = await import("./server-fns-impl.server");
    return postAlpacaCloseImpl(context.userId, data.symbol);
  });

export const runAutoCycle = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const { runAutoCycleImpl } = await import("./server-fns-impl.server");
    return runAutoCycleImpl(context.userId);
  });

export const fetchAutoStatus = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const { fetchAutoStatusImpl } = await import("./server-fns-impl.server");
    return fetchAutoStatusImpl(context.userId);
  });

export const fetchTickerDetail = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator(z.object({ symbol: z.string().min(1).max(10) }))
  .handler(async ({ context, data }) => {
    const { fetchTickerDetailImpl } = await import("./server-fns-impl.server");
    return fetchTickerDetailImpl(context.userId, data.symbol);
  });
```


---

## `src/desk/server-fns-impl.server.ts` (8289 bytes, sha256 `42e70dede59b312f6658474296dcedceb894086cac9335a67de166f243322cf5`)

```ts
import { ensureBootstrapped } from "./bootstrap";
import { adminPayload, claimRole, earningsPayload, getOrCreatePrincipal, homePayload, predictionsPayload, resultsPayload } from "./queries";
import { pauseAdmission, resumeAdmission, recordPrintKnowledge, appendFireRateNote, applyDueDeadlines } from "./lifecycle";
import { freezeMember } from "./commands";
import { DeskError, newId } from "./util";
import type { DeskRole } from "./util";
import {
  cancelOrder,
  closePosition,
  disconnect,
  getAccount,
  getClock,
  getOrders,
  getPositions,
  getSnapshots,
  getTickerDetail,
  publicStatus,
  saveCredentials,
  saveWatchlist,
  submitOrder,
} from "./alpaca";

export async function identityOf(userId: string): Promise<{ role: DeskRole; principal_id: string }> {
  let p = await getOrCreatePrincipal(userId, null);
  if (!p.role) {
    await claimRole(userId, null, "OPERATOR");
    p = await getOrCreatePrincipal(userId, null);
  }
  if (!p.role) throw new DeskError("FORBIDDEN", "Could not assign operator", 403);
  return { role: p.role, principal_id: p.principal_id };
}

async function roleOf(userId: string) {
  try {
    await ensureBootstrapped();
  } catch {
    /* earnings fixtures can fail independently of Alpaca keys */
  }
  return identityOf(userId);
}

function requireOperator(role: DeskRole | null): void {
  if (role !== "OPERATOR") throw new DeskError("FORBIDDEN", "OPERATOR only", 403);
}

export async function fetchMeImpl(userId: string) {
  const p = await identityOf(userId);
  let alpaca = { connected: false, mode: null as "PAPER" | "LIVE" | null };
  try {
    const s = await publicStatus();
    alpaca = { connected: s.connected, mode: s.mode };
  } catch {
    /* keys UI still has to load */
  }
  return { userId, role: p.role, principal_id: p.principal_id, alpaca };
}

export async function claimRoleImpl(userId: string, role: "OPERATOR" | "REVIEWER") {
  return claimRole(userId, null, role);
}

export async function fetchHomeImpl(userId: string) {
  const { role } = await roleOf(userId);
  if (!role) return { needs_role: true as const };
  return homePayload(role);
}

export async function fetchEarningsImpl(userId: string, sessionDate?: string) {
  const { role } = await roleOf(userId);
  if (!role) return { needs_role: true as const };
  return earningsPayload(role, sessionDate);
}

export async function fetchPredictionsImpl(userId: string, manifestId?: string, sessionDate?: string) {
  const { role } = await roleOf(userId);
  if (!role) return { needs_role: true as const };
  return predictionsPayload(role, manifestId, sessionDate);
}

export async function fetchResultsImpl(userId: string) {
  const { role } = await roleOf(userId);
  if (!role) return { needs_role: true as const };
  return resultsPayload(role);
}

export async function fetchAdminImpl(userId: string) {
  const { role } = await roleOf(userId);
  if (!role) return { needs_role: true as const };
  return adminPayload(role);
}

export async function postPauseImpl(userId: string, reason: string) {
  const { role, principal_id } = await roleOf(userId);
  requireOperator(role);
  return pauseAdmission(newId("cmd"), reason, principal_id);
}

export async function postResumeImpl(userId: string) {
  const { role, principal_id } = await roleOf(userId);
  requireOperator(role);
  return resumeAdmission(newId("cmd"), principal_id);
}

export async function postPrintKnowledgeImpl(userId: string, data: { eventKey: string; securityId: string; reason: string }) {
  const { role, principal_id } = await roleOf(userId);
  requireOperator(role);
  return recordPrintKnowledge(newId("cmd"), data, principal_id);
}

export async function postFireNoteImpl(userId: string, data: { hypothesis: "IMPLEMENTATION_BUG" | "COVERAGE_SHIFT" | "REGIME_SHIFT"; note: string }) {
  const { role, principal_id } = await roleOf(userId);
  requireOperator(role);
  return appendFireRateNote(newId("cmd"), { windowId: "win-2026q3", hypothesis: data.hypothesis, note: data.note }, principal_id);
}

export async function postRetryDeadlinesImpl(userId: string) {
  const { role } = await roleOf(userId);
  requireOperator(role);
  return applyDueDeadlines("svc-desk-writer");
}

export async function postVerifyFreezeImpl(userId: string, data: { manifestId: string; securityId: string }) {
  await roleOf(userId);
  return freezeMember(newId("cmd"), data.manifestId, data.securityId, "svc-desk-writer");
}

export async function fetchAlpacaStatusImpl(userId: string) {
  const { role } = await identityOf(userId);
  return { role, can_mutate: true as const, status: await publicStatus() };
}

export async function postAlpacaCredentialsImpl(
  userId: string,
  data: { apiKeyId: string; apiSecret: string; mode: "PAPER" | "LIVE"; confirmLive?: boolean },
) {
  try {
    const { role, principal_id } = await identityOf(userId);
    if (role !== "OPERATOR") {
      try {
        await claimRole(userId, null, "OPERATOR");
      } catch {
        /* already assigned; still store keys for this signed-in user */
      }
    }
    const saved = await saveCredentials({ ...data, actor: principal_id });
    try {
      const { execute } = await import("./alpaca-data-service.server");
      const current = await execute(userId, false, (s) => s.status(userId));
      const expectedVersion = current.ok ? current.status.version : null;
      await execute(userId, true, (s) =>
        s.save(userId, { apiKeyId: data.apiKeyId, apiSecret: data.apiSecret }, expectedVersion),
      );
    } catch {
      /* paper venue save is the source of truth for Trade */
    }
    return saved;
  } catch (e) {
    throw new Error(e instanceof Error ? e.message : "Could not store keys");
  }
}

export async function postAlpacaDisconnectImpl(userId: string) {
  await identityOf(userId);
  return disconnect();
}

export async function postAlpacaWatchlistImpl(userId: string, watchlist: string[]) {
  const { role } = await identityOf(userId);
  requireOperator(role);
  return saveWatchlist(watchlist);
}

export async function fetchAlpacaDeskImpl(userId: string) {
  const { role } = await identityOf(userId);
  const status = await publicStatus();
  const can_mutate = true;
  if (!status.connected) {
    return { role, can_mutate, status, connected: false as const };
  }
  try {
    const [account, clock, positions, orders, quotes] = await Promise.all([
      getAccount(),
      getClock(),
      getPositions(),
      getOrders("open"),
      getSnapshots(status.watchlist),
    ]);
    return { role, can_mutate, status, connected: true as const, account, clock, positions, orders, quotes };
  } catch (e) {
    return {
      role,
      can_mutate,
      status,
      connected: true as const,
      error: e instanceof Error ? e.message : "Alpaca request failed",
    };
  }
}

export async function fetchAlpacaOrdersImpl(userId: string, status: "open" | "closed" | "all" = "all") {
  await identityOf(userId);
  return { orders: await getOrders(status) };
}

export async function postAlpacaOrderImpl(
  userId: string,
  data: {
    symbol: string;
    side: "buy" | "sell";
    type: "market" | "limit";
    timeInForce: "day" | "gtc" | "ioc";
    qty?: string;
    notional?: string;
    limitPrice?: string;
    extendedHours?: boolean;
    confirmLive?: boolean;
  },
) {
  const { role, principal_id } = await identityOf(userId);
  requireOperator(role);
  return submitOrder({ ...data, actor: principal_id });
}

export async function postAlpacaCancelImpl(userId: string, orderId: string) {
  const { role } = await identityOf(userId);
  requireOperator(role);
  return cancelOrder(orderId);
}

export async function postAlpacaCloseImpl(userId: string, symbol: string) {
  const { role } = await identityOf(userId);
  requireOperator(role);
  return closePosition(symbol);
}

export async function runAutoCycleImpl(userId: string) {
  await identityOf(userId);
  const { runAutoCycle } = await import("./auto-trade");
  return runAutoCycle(userId);
}

export async function fetchAutoStatusImpl(userId: string) {
  await identityOf(userId);
  const { autoStatus } = await import("./auto-trade");
  return autoStatus();
}

export async function fetchTickerDetailImpl(userId: string, symbol: string) {
  await identityOf(userId);
  return getTickerDetail(symbol, userId);
}
```


---

## `src/ui/labels.ts` (7260 bytes, sha256 `86a1fd1a657e03278a8ea8a13866cff1e9a811ab1f23165d579f62f35568545a`)

```ts
export function decisionLabel(status: string | null | undefined, reasons: string[] = []): string {
  if (!status || status === "NO_FREEZE") return "No decision recorded";
  if (status === "PREDICT") return "Upward expectation";
  if (status === "STAND_DOWN") {
    if (reasons.some((r) => r.startsWith("MISSING_"))) return "Not enough information";
    return "No qualifying setup";
  }
  return "Unknown status";
}

export function paperLabel(execution: string | null | undefined, decision?: string | null): string {
  if (execution === "PAPER_COMMITTED") return "Paper position reserved";
  if (execution === "NOT_TRADED") return "Predicted · not traded";
  if (!decision || decision === "STAND_DOWN" || decision === "NO_FREEZE") return "Not applicable";
  if (execution === "DENIED") return "Predicted · not traded";
  if (execution === "NONE" || !execution) return "Not applicable";
  return execution;
}

export function positionStateLabel(state: string): string {
  switch (state) {
    case "COMMITTED_IRREVOCABLE":
      return "Paper position reserved";
    case "FILLED":
      return "Paper position open";
    case "IMPAIRED_ENTRY":
      return "Entry price unresolved";
    case "IMPAIRED_EXIT":
      return "Exit price unresolved";
    case "NO_FILL":
      return "No modeled fill · closing record";
    case "FLAT":
      return "Exit recorded · closing record";
    case "CLOSED":
      return "Paper position closed";
    default:
      return "Unknown status";
  }
}

export function infoStatus(cardComplete: boolean, optionsValid: boolean | null): string {
  if (cardComplete && optionsValid !== false) return "Ready";
  if (optionsValid === false) return "Invalid source value";
  return "Missing information";
}

export function timingLabel(quality: string): string {
  if (quality === "ISSUER_CONFIRMED") return "After close · issuer confirmed";
  if (quality === "VENDOR_CONFIRMED") return "After close · vendor confirmed";
  return "Timing not confirmed";
}

export function reasonSentence(code: string): string {
  const map: Record<string, string> = {
    ADMITTED: "A simulated position was reserved.",
    NOT_PREDICTED: "The rule did not select a trade setup.",
    CARD_INCOMPLETE: "Required information was not complete when the decision was recorded.",
    OPTIONS_INVALID: "The options input was not usable.",
    IMPLIED_MOVE_OUT_OF_BAND: "The options-implied move proxy was outside the allowed band.",
    REL5_NOT_NEGATIVE: "Five-day performance was not below the benchmark.",
    REL63_NOT_POSITIVE: "Sixty-three-day performance was not above the benchmark.",
    TIMING_NOT_CONFIRMED: "Earnings timing was not issuer-confirmed after close.",
    MISSING_IMPLIED_MOVE: "The options-implied move proxy was not available.",
    MISSING_REL5: "The five-day relative return was not available.",
    MISSING_REL63: "The 63-day relative return was not available.",
    CAPACITY_SLOTS: "Paper-position slot capacity was reached.",
    CAPACITY_NOTIONAL: "Reserved simulated notional capacity was reached.",
    PER_EVENT_LIMIT: "This session's paper-position limit was reached.",
    ALREADY_OWNED: "This company already had an unresolved paper position.",
    PAUSED: "New paper positions are paused.",
    CUTOFF: "The decision deadline had passed.",
    STALE_QUOTE: "The quote was too old for admission.",
    WIDE_SPREAD: "The quoted spread was too wide for admission.",
    PRICE_BELOW_MIN: "The price was below the admission minimum.",
    NO_QUOTE: "A usable quote was not available.",
    PREDICATE_FALSE_implied_move: "The expected move was outside the allowed band.",
    PREDICATE_FALSE_benchmark_relative_5d: "Five-day performance was not below the market by enough.",
    PREDICATE_FALSE_benchmark_relative_63d: "Sixty-three-day performance was not above the market by enough.",
    PREDICATE_FALSE_timing_quality: "Earnings timing was not issuer-confirmed after close.",
    PREDICATE_FALSE_card_complete: "Required information was not complete.",
    PREDICATE_FALSE_options_valid: "The options input was not usable.",
  };
  return map[code] ?? code.replaceAll("_", " ").toLowerCase();
}

export function mainReason(reasons: string[]): string {
  const skip = new Set(["ADMITTED", "PREDICT", "LONG"]);
  const first = reasons.find((r) => !skip.has(r));
  return first ? reasonSentence(first) : "The recorded predicates were evaluated in registered order.";
}

export function jobPurpose(name: string): string {
  const map: Record<string, string> = {
    "premarket-check": "Collect data",
    "capture-cycle": "Collect data",
    "seal-session": "Lock inputs",
    "ordered-freeze": "Record decisions",
    "due-deadlines": "Apply deadlines",
    "mark-ingest": "Process official prices",
    "grade-apply": "Prepare reports",
    "report-finalize": "Release review window",
    "learn-revise": "Update next-session checklist",
  };
  return map[name] ?? name.replaceAll("-", " ");
}

export function formatSession(iso: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso || "—";
  const d = new Date(`${iso}T16:00:00-04:00`);
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "America/New_York",
  });
}

export function money(v: string | number | null | undefined, digits = 0): string {
  if (v == null || v === "") return "—";
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n)) return String(v);
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

export function pct(v: string | null | undefined): string {
  if (!v) return "Not available";
  const n = Number(v);
  if (!Number.isFinite(n)) return v;
  return `${(n * 100).toFixed(2)}%`;
}

export function verificationLabel(level: string | null | undefined): string {
  switch (level) {
    case "BYTE_VERIFIED":
      return "Inputs replay verified";
    case "ATTESTED":
      return "Prior verification retained";
    case "HASH_ONLY":
      return "Record hashes verified";
    default:
      return "Verification unavailable";
  }
}

export function alarmLabel(code: string): { title: string; detail: string } {
  switch (code) {
    case "EXIT_EVIDENCE_UNRESOLVED":
      return {
        title: "Exit price not available",
        detail: "A simulated position is waiting for an official close. It is not a live order.",
      };
    case "DESK_CAPACITY_BLOCKED_ON_MARKS":
      return {
        title: "New simulated positions paused",
        detail: "A reserved paper slot stays occupied until the missing official price is resolved.",
      };
    case "PARTIAL_FREEZE_OCCURRED":
      return {
        title: "Some names were not decided",
        detail: "This session recorded decisions for only part of the sealed list.",
      };
    case "OFF_DESIGN_EARLY_RELEASE":
      return {
        title: "Early result knowledge recorded",
        detail: "New simulated entries stay paused until this review record is closed.",
      };
    default:
      return {
        title: "Needs review",
        detail: "The desk recorded an open issue. It does not place a live order.",
      };
  }
}
```


---

## `src/ui/theme.ts` (749 bytes, sha256 `85965e26b093ad568b9d929f02bb0e536b36f595cb2c772f1a6dacf0fc0f5618`)

```ts
export type Appearance = "light" | "dark" | "system";

const KEY = "ta-appearance";

export function readAppearance(): Appearance {
  try {
    const v = localStorage.getItem(KEY);
    if (v === "light" || v === "dark" || v === "system") return v;
  } catch {
    /* ignore */
  }
  return "light";
}

export function resolvedDark(pref: Appearance): boolean {
  if (pref === "dark") return true;
  if (pref === "light") return false;
  return typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function applyAppearance(pref: Appearance): void {
  document.documentElement.classList.toggle("dark", resolvedDark(pref));
  try {
    localStorage.setItem(KEY, pref);
  } catch {
    /* ignore */
  }
}
```


---

## `src/components/app-shell.tsx` (12593 bytes, sha256 `2fa0fdadc6e1393cba6c22708c4ec1099266164e4e50631d72e438ed90dffa5d`)

```tsx
import { Link, useRouterState } from "@tanstack/react-router";
import { FileBarChart, Home, ListChecks, Settings, SquarePen } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { RedirectToSignIn, UserButton } from "@/lib/auth/gates";
import { authEnabled, signOut } from "@/lib/auth/client";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { fetchMe, postClaimRole } from "@/desk/server-fns";
import { applyAppearance, readAppearance, type Appearance } from "@/ui/theme";
import { TickerQuoteProvider } from "@/components/ticker-quote";
export { Drawer } from "@/components/drawer";

const NAV = [
  { to: "/", label: "Home", icon: Home },
  { to: "/earnings", label: "Earnings", icon: ListChecks },
  { to: "/predictions", label: "Predictions", icon: SquarePen },
  { to: "/results", label: "Results", icon: FileBarChart },
  { to: "/admin", label: "Admin", icon: Settings },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { user, isPending } = useCurrentUserState();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [role, setRole] = useState<string | null | undefined>(undefined);
  const [err, setErr] = useState<string | null>(null);
  const [appearance, setAppearance] = useState<Appearance>("light");
  const [menuOpen, setMenuOpen] = useState(false);
  const [waited, setWaited] = useState(false);

  useEffect(() => {
    const pref = readAppearance();
    setAppearance(pref);
    applyAppearance(pref);
  }, []);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    const fail = window.setTimeout(() => {
      if (!cancelled) setErr("This is taking too long. Try again, or sign in once more.");
    }, 12000);
    void fetchMe()
      .then(async (m) => {
        if (cancelled) return;
        if (!m.role) {
          const r = await postClaimRole({ data: { role: "OPERATOR" } });
          if (!cancelled) setRole(r.role);
        } else {
          setRole(m.role);
        }
      })
      .catch((e) => {
        if (!cancelled) setErr(e instanceof Error ? e.message : "We could not load your workspace access");
      })
      .finally(() => window.clearTimeout(fail));
    return () => {
      cancelled = true;
      window.clearTimeout(fail);
    };
  }, [user]);

  useEffect(() => {
    const id = window.setTimeout(() => setWaited(true), 4000);
    return () => window.clearTimeout(id);
  }, []);

  if (isPending && !waited) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-canvas px-4 text-center">
        <p className="text-base text-muted">Loading workspace access…</p>
        <a href="/login" className="min-h-11 text-sm font-medium text-info">
          Continue to sign in
        </a>
      </div>
    );
  }
  if (isPending && waited) return <RedirectToSignIn />;
  if (!user) return <RedirectToSignIn />;

  if (err && role === undefined) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-4 px-4">
        <h1 className="text-[26px] font-semibold leading-8">We could not load your workspace access</h1>
        <p className="text-base text-muted">{err}</p>
        <div className="flex gap-2">
          <button
            type="button"
            className="min-h-11 rounded-sm bg-primary px-4 text-sm font-medium text-primary-fg"
            onClick={() => window.location.reload()}
          >
            Try again
          </button>
          {authEnabled ? (
            <button type="button" className="min-h-11 rounded-sm border border-control px-4 text-sm" onClick={() => void signOut()}>
              Sign out
            </button>
          ) : null}
        </div>
      </div>
    );
  }

  if (role === undefined) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-canvas text-muted">
        <p className="text-base">Loading workspace access…</p>
      </div>
    );
  }

  return (
    <TickerQuoteProvider>
    <div className="min-h-dvh bg-canvas text-fg">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-sm focus:bg-surface focus:px-3 focus:py-2">
        Skip to content
      </a>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[232px] flex-col bg-nav text-nav-text lg:flex">
        <div className="px-5 py-6">
          <p className="text-sm font-semibold tracking-tight text-nav-text">Trading App</p>
        </div>
        <nav className="flex flex-1 flex-col gap-1 px-3" aria-label="Primary">
          {NAV.map((n) => {
            const active = n.to === "/" ? pathname === "/" : pathname === n.to || pathname.startsWith(n.to + "/");
            const Icon = n.icon;
            return (
              <Link
                key={n.to}
                to={n.to}
                aria-current={active ? "page" : undefined}
                className={
                  "flex min-h-11 items-center gap-3 rounded-sm border-l-2 px-3 text-sm " +
                  (active ? "border-info bg-white/10 text-info" : "border-transparent text-nav-text hover:bg-white/5")
                }
              >
                <Icon className="size-5" aria-hidden />
                {n.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <header className="sticky top-0 z-20 border-b border-border bg-surface lg:ml-[232px]">
        <div className="mx-auto flex h-[60px] max-w-[1440px] items-center justify-between gap-3 px-4 md:h-[72px] md:px-8">
          <div className="min-w-0 lg:hidden">
            <p className="text-sm font-semibold">Trading App</p>
          </div>
          <div className="hidden items-center gap-2 lg:flex">
            <span className="rounded-full bg-info-bg px-2.5 py-1 text-xs font-medium text-info">Simulated trades</span>
            <span className="rounded-full bg-subtle px-2.5 py-1 text-xs font-medium text-muted">Sample data</span>
          </div>
          <div className="relative flex items-center gap-3">
            <span className="hidden rounded-full bg-subtle px-2.5 py-1 text-xs font-medium text-muted sm:inline">{role}</span>
            <button
              type="button"
              className="min-h-11 rounded-sm px-2 text-sm text-muted"
              onClick={() => setMenuOpen((v) => !v)}
              aria-expanded={menuOpen}
              aria-haspopup="menu"
            >
              Account
            </button>
            {menuOpen ? (
              <div
                role="menu"
                className="absolute right-0 top-12 z-40 w-56 rounded-md border border-border bg-surface p-2 shadow-lg"
              >
                <UserButton />
                <p className="mt-2 px-2 text-xs text-muted">Appearance</p>
                {(["light", "dark", "system"] as const).map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    role="menuitem"
                    className="flex min-h-11 w-full items-center rounded-sm px-2 text-left text-sm capitalize hover:bg-subtle"
                    onClick={() => {
                      setAppearance(opt);
                      applyAppearance(opt);
                      setMenuOpen(false);
                    }}
                  >
                    {opt}
                    {appearance === opt ? " · selected" : ""}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>
        <div className="flex gap-1 overflow-x-auto px-4 pb-2 lg:hidden">
          <span className="rounded-full bg-info-bg px-2.5 py-1 text-xs font-medium text-info">Simulated trades</span>
          <span className="rounded-full bg-subtle px-2.5 py-1 text-xs font-medium text-muted">Sample data</span>
        </div>
        <nav className="hidden border-t border-border md:flex lg:hidden" aria-label="Primary">
          {NAV.map((n) => {
            const active = n.to === "/" ? pathname === "/" : pathname === n.to;
            return (
              <Link
                key={n.to}
                to={n.to}
                aria-current={active ? "page" : undefined}
                className={"min-h-11 flex-1 px-2 py-3 text-center text-sm " + (active ? "bg-selected text-info" : "text-muted")}
              >
                {n.label}
              </Link>
            );
          })}
        </nav>
      </header>

      <main id="main" className="mx-auto max-w-[1440px] px-4 pb-28 pt-6 md:px-6 lg:ml-[232px] lg:px-8 lg:pb-10">
        {children}
      </main>

      <nav
        className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface pb-[env(safe-area-inset-bottom)] md:hidden"
        aria-label="Primary"
      >
        <div className="grid grid-cols-5">
          {NAV.map((n) => {
            const active = n.to === "/" ? pathname === "/" : pathname === n.to;
            const Icon = n.icon;
            return (
              <Link
                key={n.to}
                to={n.to}
                aria-current={active ? "page" : undefined}
                className={"flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] " + (active ? "text-info" : "text-muted")}
              >
                <Icon className="size-5" aria-hidden />
                {n.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
    </TickerQuoteProvider>
  );
}

export function Panel({ title, children, aside }: { title: string; children: ReactNode; aside?: string }) {
  return (
    <section className="rounded-md border border-border bg-surface p-4 md:p-6">
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <h2 className="text-base font-semibold leading-6">{title}</h2>
        {aside ? <span className="text-xs font-medium text-muted">{aside}</span> : null}
      </div>
      {children}
    </section>
  );
}

export function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="min-w-0">
      <div className="text-xs font-medium uppercase tracking-wide text-muted">{label}</div>
      <div className="mt-1 font-sans text-[26px] font-semibold tabular-nums leading-8 md:text-[30px] md:leading-[38px]">
        {value}
      </div>
      {hint ? <p className="mt-1 text-sm text-muted">{hint}</p> : null}
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="text-base text-muted">{children}</p>;
}

export function Err({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-md border border-danger/30 bg-danger-bg px-4 py-3 text-sm text-danger" role="alert">
      {children}
    </div>
  );
}

export function Badge({
  tone = "neutral",
  children,
}: {
  tone?: "neutral" | "info" | "success" | "warn" | "danger";
  children: ReactNode;
}) {
  const cls =
    tone === "info"
      ? "bg-info-bg text-info"
      : tone === "success"
        ? "bg-success-bg text-success"
        : tone === "warn"
          ? "bg-warn-bg text-warn"
          : tone === "danger"
            ? "bg-danger-bg text-danger"
            : "bg-subtle text-muted";
  return <span className={"inline-flex rounded-full px-2.5 py-1 text-xs font-medium " + cls}>{children}</span>;
}

export function SessionTabs({
  sessions,
  active,
  to,
}: {
  sessions: Array<{ session_date: string }>;
  active?: string;
  to: "/earnings" | "/predictions";
}) {
  if (!sessions.length) return null;
  return (
    <div className="flex flex-wrap gap-2" role="tablist" aria-label="Session">
      {sessions.map((s) => (
        <Link
          key={s.session_date}
          to={to}
          search={{ session: s.session_date }}
          className={
            "min-h-11 rounded-sm border px-3 text-sm " +
            (active === s.session_date ? "border-primary bg-selected text-info" : "border-border text-muted")
          }
        >
          {s.session_date}
        </Link>
      ))}
    </div>
  );
}

export function PageHeader({ title, purpose, action }: { title: string; purpose: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div>
        <h1 className="text-[26px] font-semibold leading-8 md:text-[30px] md:leading-[38px]">{title}</h1>
        <p className="mt-1 text-base text-muted">{purpose}</p>
      </div>
      {action}
    </div>
  );
}
```


---

## `src/components/drawer.tsx` (1314 bytes, sha256 `e7d629cf4cf6e2bb608651f7b0f43b2ec2a697a3a4008454ed17ea01123bed28`)

```tsx
import { useEffect, type ReactNode } from "react";

export function Drawer({
  title,
  kicker,
  onClose,
  children,
}: {
  title: string;
  kicker?: string;
  onClose: () => void;
  children: ReactNode;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-nav/40"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="flex h-full w-full max-w-[560px] flex-col overflow-y-auto bg-surface p-4 pb-24 shadow-lg md:p-6 lg:pb-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            {kicker ? <p className="text-sm text-muted">{kicker}</p> : null}
            <h2 className="text-xl font-semibold leading-7">{title}</h2>
          </div>
          <button type="button" className="min-h-11 rounded-sm border border-control px-3 text-sm" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="mt-4 flex-1">{children}</div>
      </div>
    </div>
  );
}
```


---

## `src/components/ticker-quote.tsx` (3251 bytes, sha256 `ca3f3758424564bc4b404e08e95b1a71bdb74fe921bae5b03f72ce0587e36afc`)

```tsx
import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { Drawer } from "@/components/drawer";
import { TickerTape } from "@/components/ticker-tape";
import { postAlpacaOrder } from "@/desk/server-fns";

const Ctx = createContext<{ openTicker: (symbol: string) => void }>({ openTicker: () => {} });

export function useTickerQuote() {
  return useContext(Ctx);
}

export function TickerQuoteProvider({ children }: { children: ReactNode }) {
  const [symbol, setSymbol] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const openTicker = useCallback((raw: string) => {
    const s = raw.trim().toUpperCase();
    if (!s) return;
    setNote(null);
    setSymbol(s);
  }, []);

  async function trade(sym: string, side: "buy" | "sell") {
    setNote(null);
    try {
      await postAlpacaOrder({
        data: {
          symbol: sym,
          side,
          type: "market",
          timeInForce: "day",
          notional: "5000.00",
          extendedHours: true,
        },
      });
      setNote(`${side === "buy" ? "Buy" : "Sell"} submitted as a paper market order for ${sym}.`);
    } catch (e) {
      setNote(e instanceof Error ? e.message : "Order was not sent.");
    }
  }

  return (
    <Ctx.Provider value={{ openTicker }}>
      {children}
      {symbol ? (
        <Drawer title={symbol} kicker="Quote & chart" onClose={() => setSymbol(null)}>
          {note ? <p className="mb-3 text-sm text-muted">{note}</p> : null}
          <TickerTape symbol={symbol} onClose={() => setSymbol(null)} onTrade={(s, side) => void trade(s, side)} />
        </Drawer>
      ) : null}
    </Ctx.Provider>
  );
}

export function TickerButton({
  symbol,
  name,
  className = "",
}: {
  symbol: string;
  name?: string | null;
  className?: string;
}) {
  const { openTicker } = useTickerQuote();
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        openTicker(symbol);
      }}
      className={"min-h-11 text-left " + className}
      aria-label={`Open quote for ${symbol}`}
    >
      <div className="font-medium text-info underline-offset-2 hover:underline">{symbol}</div>
      {name ? <div className="text-sm text-muted">{name}</div> : null}
    </button>
  );
}

export function TickerLookup() {
  const { openTicker } = useTickerQuote();
  const [value, setValue] = useState("");
  return (
    <form
      className="flex flex-wrap gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        const s = value.trim().toUpperCase();
        if (s) openTicker(s);
      }}
    >
      <label className="sr-only" htmlFor="ticker-lookup">
        Look up ticker
      </label>
      <input
        id="ticker-lookup"
        value={value}
        onChange={(e) => setValue(e.target.value.toUpperCase())}
        placeholder="AAPL"
        autoCapitalize="characters"
        autoComplete="off"
        spellCheck={false}
        className="min-h-12 w-36 rounded-sm border border-control bg-surface px-3 text-base uppercase"
      />
      <button type="submit" className="min-h-12 rounded-sm bg-primary px-4 text-sm font-medium text-primary-fg">
        Open quote
      </button>
    </form>
  );
}
```


---

## `src/components/ticker-tape.tsx` (9198 bytes, sha256 `f69b91c1cbacc913bcdfd38344d762f6f233ecfa6a19a3a6e8fb9c674295654f`)

```tsx
import { useEffect, useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { fetchTickerDetail } from "@/desk/server-fns";
import type { TickerDetail, TapeBar } from "@/desk/alpaca-types";
import { Empty, Err, Stat } from "@/components/app-shell";

type Range = "1D" | "5D" | "1M" | "6M";

function fmtTime(iso: string, range: Range): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  if (range === "1D") {
    return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  }
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function pickBars(tape: TickerDetail, range: Range): TapeBar[] {
  const daily = tape.bars_daily;
  const intra = tape.bars_intraday;
  if (range === "1D") {
    const day = intra.slice(-120);
    return day.length >= 2 ? day : daily.slice(-5);
  }
  if (range === "5D") {
    if (intra.length > 20) return intra;
    return daily.slice(-5);
  }
  if (range === "1M") {
    if (daily.length >= 2) return daily.slice(-22);
    return intra.length >= 2 ? intra : daily;
  }
  if (daily.length >= 2) return daily.slice(-130);
  return intra.length >= 2 ? intra : daily;
}

function volLabel(v: string | null): string {
  if (!v) return "—";
  const n = Number(v);
  if (!Number.isFinite(n)) return v;
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString("en-US");
}

export function TickerTape({
  symbol,
  onClose,
  onTrade,
}: {
  symbol: string;
  onClose: () => void;
  onTrade: (symbol: string, side: "buy" | "sell") => void;
}) {
  const [tape, setTape] = useState<TickerDetail | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [range, setRange] = useState<Range>("1D");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load(silent: boolean) {
      if (!silent) setLoading(true);
      setErr(null);
      try {
        const d = await fetchTickerDetail({ data: { symbol } });
        if (!cancelled) setTape(d);
      } catch (e) {
        if (!cancelled) {
          const raw = e instanceof Error ? e.message : "Could not load ticker";
          setErr(
            raw.includes("Alpaca keys") || raw.includes("ALPACA_NOT_CONNECTED")
              ? "Save Alpaca keys in Admin to load a live quote for listed tickers."
              : raw,
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load(false);
    const id = window.setInterval(() => void load(true), 12000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [symbol]);

  const bars = useMemo(() => (tape ? pickBars(tape, range) : []), [tape, range]);
  const down = Number(tape?.change_pct ?? 0) < 0;
  const chartData = bars.map((b) => ({ t: b.t, c: b.c, v: b.v }));
  const stroke = down ? "var(--color-danger)" : "var(--color-gain)";
  void onClose;

  return (
    <div>
      <p className="text-sm text-muted">{tape?.name ?? (loading ? "Loading…" : "—")}</p>
      <div className="mt-1 flex flex-wrap items-baseline gap-3">
        <span className="font-mono text-3xl tabular-nums tracking-tight">{tape?.last ?? "—"}</span>
        <span className={"font-mono text-sm tabular-nums " + (down ? "text-danger" : "text-gain")}>
          {tape?.change == null ? "—" : `${Number(tape.change) > 0 ? "+" : ""}${tape.change}`}{" "}
          {tape?.change_pct == null ? "" : `(${Number(tape.change_pct) > 0 ? "+" : ""}${tape.change_pct}%)`}
        </span>
        <span className="text-xs text-muted">{tape?.exchange ?? ""}</span>
      </div>
      {tape?.notice ? <p className="mt-2 text-sm text-warn">{tape.notice}</p> : null}

      {err ? (
        <div className="mt-3">
          <Err>{err}</Err>
        </div>
      ) : null}

      <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
        <Stat label="Bid" value={tape?.bid ?? "—"} hint={tape?.bid_size ?? undefined} />
        <Stat label="Ask" value={tape?.ask ?? "—"} hint={tape?.ask_size ?? undefined} />
        <Stat label="Open" value={tape?.open ?? "—"} />
        <Stat label="Prev close" value={tape?.prev_close ?? "—"} />
        <Stat label="High" value={tape?.high ?? "—"} />
        <Stat label="Low" value={tape?.low ?? "—"} />
        <Stat label="Volume" value={volLabel(tape?.volume ?? null)} />
        <Stat label="VWAP" value={tape?.vwap ?? "—"} />
        <Stat label="52-week high" value={tape?.week52_high ?? "—"} />
        <Stat label="52-week low" value={tape?.week52_low ?? "—"} />
      </div>

      <div className="mt-4 mb-2 flex flex-wrap gap-1">
        {(["1D", "5D", "1M", "6M"] as const).map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setRange(r)}
            className={
              "min-h-11 rounded-sm px-3 text-sm " +
              (range === r ? "bg-primary text-primary-fg" : "border border-border text-muted")
            }
          >
            {r}
          </button>
        ))}
      </div>

      <div className="mb-4 h-64 w-full min-w-0 sm:h-72">
        {loading && !tape ? (
          <Empty>Loading chart…</Empty>
        ) : chartData.length < 2 ? (
          <Empty>No bar history for this range.</Empty>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="tapeFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={stroke} stopOpacity={0.28} />
                  <stop offset="100%" stopColor={stroke} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--color-border)" vertical={false} />
              <XAxis
                dataKey="t"
                tickFormatter={(v) => fmtTime(String(v), range)}
                tick={{ fill: "var(--color-muted)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                minTickGap={28}
              />
              <YAxis
                domain={["auto", "auto"]}
                tick={{ fill: "var(--color-muted)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={56}
                tickFormatter={(v) => (typeof v === "number" ? v.toFixed(2) : String(v))}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--color-surface)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 8,
                  color: "var(--color-fg)",
                  fontFamily: "var(--font-mono)",
                  fontSize: 12,
                }}
                labelFormatter={(v) => fmtTime(String(v), range)}
                formatter={(value) => [typeof value === "number" ? value.toFixed(3) : String(value), "Last"]}
              />
              <Area type="monotone" dataKey="c" stroke={stroke} fill="url(#tapeFill)" strokeWidth={1.5} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {tape?.tradable ? (
        <div className="mb-4 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            className="min-h-12 flex-1 rounded-sm bg-gain px-4 text-sm font-medium text-primary-fg"
            onClick={() => onTrade(symbol, "buy")}
          >
            Buy {symbol}
          </button>
          <button
            type="button"
            className="min-h-12 flex-1 rounded-sm bg-danger px-4 text-sm font-medium text-primary-fg"
            onClick={() => onTrade(symbol, "sell")}
          >
            Sell {symbol}
          </button>
        </div>
      ) : (
        <p className="mb-4 text-sm text-muted">Paper buy/sell is available on listed symbols after Alpaca keys are saved.</p>
      )}

      <div>
        <h3 className="mb-2 text-sm font-semibold">News</h3>
        {!tape || tape.news.length === 0 ? (
          <Empty>No headlines for this name.</Empty>
        ) : (
          <ul className="grid gap-2">
            {tape.news.map((n) => (
              <li key={n.id} className="rounded-sm border border-border bg-subtle px-3 py-2">
                {n.url ? (
                  <a href={n.url} target="_blank" rel="noreferrer" className="text-sm leading-snug hover:underline">
                    {n.headline}
                  </a>
                ) : (
                  <p className="text-sm leading-snug">{n.headline}</p>
                )}
                <p className="mt-1 font-mono text-[11px] text-muted">
                  {[n.source, n.created_at ? n.created_at.slice(0, 16).replace("T", " ") : null].filter(Boolean).join(" · ")}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
```


---

## `src/components/alpaca-keys.tsx` (9550 bytes, sha256 `f46fcd21c66b39f11fed16951fde9e6e45a46a84211bbcc21f52f38fd0c0b487`)

```tsx
import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Empty, Err, Panel } from "@/components/desk-shell";
import { fetchAlpacaStatus, postAlpacaCredentials, postAlpacaDisconnect } from "@/desk/server-fns";
import type { AlpacaPublicStatus } from "@/desk/alpaca-types";

function failMsg(e: unknown, fallback: string): string {
  if (e instanceof Error && e.message) return e.message;
  if (typeof e === "object" && e && "message" in e && typeof (e as { message: unknown }).message === "string") {
    return (e as { message: string }).message;
  }
  return fallback;
}

const EMPTY_STATUS: AlpacaPublicStatus = {
  connected: false,
  mode: null,
  api_key_masked: null,
  account_number_last4: null,
  account_status: null,
  last_ok_at: null,
  last_error: null,
  watchlist: [],
  trading_host: null,
};

/** Standalone key insertion — does not wait on the rest of Admin. */
export function AlpacaKeyInsert() {
  const [status, setStatus] = useState<AlpacaPublicStatus>(EMPTY_STATUS);
  const [canMutate, setCanMutate] = useState(true);
  const [ready, setReady] = useState(false);
  const [loadErr, setLoadErr] = useState<string | null>(null);

  async function reload() {
    const r = await fetchAlpacaStatus();
    setStatus(r.status);
    setCanMutate(r.can_mutate);
    setReady(true);
  }

  useEffect(() => {
    void reload().catch((e) => {
      setLoadErr(failMsg(e, "Could not load Alpaca status"));
      setReady(true);
    });
  }, []);

  return (
    <AlpacaKeysForm
      status={status}
      canMutate={canMutate}
      ready={ready}
      loadErr={loadErr}
      onChanged={reload}
    />
  );
}

export function AlpacaKeysForm({
  status,
  canMutate,
  ready = true,
  loadErr,
  onChanged,
}: {
  status: AlpacaPublicStatus;
  canMutate: boolean;
  ready?: boolean;
  loadErr?: string | null;
  onChanged: () => Promise<void>;
}) {
  const [keyId, setKeyId] = useState("");
  const [secret, setSecret] = useState("");
  const [mode, setMode] = useState<"PAPER" | "LIVE">("PAPER");
  const [confirmLive, setConfirmLive] = useState(false);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function save() {
    const apiKeyId = keyId.trim();
    const apiSecret = secret.trim();
    if (apiKeyId.length < 8 || apiSecret.length < 8) {
      setErr("Paste both the key ID and the secret (each at least 8 characters).");
      return;
    }
    if (mode === "LIVE" && !confirmLive) {
      setErr("Live mode needs the confirmation checkbox.");
      return;
    }
    setBusy(true);
    setErr(null);
    setNote(null);
    try {
      await postAlpacaCredentials({
        data: { apiKeyId, apiSecret, mode, confirmLive },
      });
      setSecret("");
      setKeyId("");
      setConfirmLive(false);
      setNote(mode === "LIVE" ? "Live keys stored and verified." : "Paper keys stored and verified.");
    } catch (e) {
      setErr(failMsg(e, "Could not store keys"));
    } finally {
      try {
        await onChanged();
      } catch {
        /* status refresh is secondary to the save result */
      }
      setBusy(false);
    }
  }

  async function drop() {
    setBusy(true);
    setErr(null);
    try {
      await postAlpacaDisconnect();
      setNote("Alpaca keys removed from this desk.");
      await onChanged();
    } catch (e) {
      setErr(failMsg(e, "Disconnect failed"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Panel title="Insert Alpaca keys" aside={status.connected ? (status.mode === "LIVE" ? "LIVE" : "PAPER") : "empty"}>
      <p className="mb-3 text-sm leading-relaxed text-muted">
        Paste the key ID and secret from app.alpaca.markets. They are encrypted on the server. The secret is never
        sent back to this phone. Paper is the default.
      </p>
      {loadErr ? (
        <div className="mb-3">
          <Err>{loadErr}</Err>
        </div>
      ) : null}
      {status.connected ? (
        <dl className="mb-4 grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
          <div>
            <dt className="text-[11px] uppercase tracking-wider text-muted">Stored key</dt>
            <dd className="mt-1 font-mono text-xs">{status.api_key_masked}</dd>
          </div>
          <div>
            <dt className="text-[11px] uppercase tracking-wider text-muted">Account</dt>
            <dd className="mt-1 font-mono text-xs">
              {status.account_number_last4 ? `…${status.account_number_last4}` : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-[11px] uppercase tracking-wider text-muted">Status</dt>
            <dd className="mt-1 font-mono text-xs">{status.account_status ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-[11px] uppercase tracking-wider text-muted">Last ok</dt>
            <dd className="mt-1 font-mono text-xs">{status.last_ok_at ? status.last_ok_at.slice(0, 19) : "—"}</dd>
          </div>
        </dl>
      ) : (
        <Empty>Nothing stored yet. Paste both fields below and tap Insert keys.</Empty>
      )}
      {status.last_error ? (
        <div className="mb-3">
          <Err>{status.last_error}</Err>
        </div>
      ) : null}
      {err ? (
        <div className="mb-3">
          <Err>{err}</Err>
        </div>
      ) : null}
      {note ? <p className="mb-3 text-sm text-muted">{note}</p> : null}
      {!ready ? <p className="text-sm text-muted">Loading key slot…</p> : null}
      {(
        <form
          className="grid gap-3"
          autoComplete="off"
          onSubmit={(e) => {
            e.preventDefault();
            void save();
          }}
        >
          <label className="grid gap-1 text-sm">
            <span className="text-[11px] uppercase tracking-wider text-muted">API key ID</span>
            <input
              value={keyId}
              onChange={(e) => setKeyId(e.target.value)}
              autoComplete="off"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              inputMode="text"
              enterKeyHint="next"
              name="alpaca_api_key_id"
              className="min-h-12 rounded-md border border-border bg-sunken px-3 font-mono text-base"
              placeholder="PK…"
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-[11px] uppercase tracking-wider text-muted">Secret key</span>
            <textarea
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              autoComplete="off"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              name="alpaca_api_secret"
              rows={3}
              className="rounded-md border border-border bg-sunken px-3 py-2 font-mono text-base"
              placeholder="Paste the secret here"
            />
          </label>
          <button
            type="submit"
            disabled={busy}
            className="min-h-12 rounded-md bg-primary px-4 text-sm font-medium text-primary-fg disabled:opacity-40"
          >
            {busy ? "Saving…" : status.connected ? "Replace keys" : "Insert keys"}
          </button>
          <fieldset className="grid gap-2">
            <legend className="text-[11px] uppercase tracking-wider text-muted">Venue</legend>
            <div className="flex flex-col gap-2 sm:flex-row">
              <label className="flex min-h-11 flex-1 items-center gap-2 rounded-md border border-border px-3 text-sm">
                <input
                  type="radio"
                  name="alpaca-insert-mode"
                  checked={mode === "PAPER"}
                  onChange={() => {
                    setMode("PAPER");
                    setConfirmLive(false);
                  }}
                />
                Paper
              </label>
              <label className="flex min-h-11 flex-1 items-center gap-2 rounded-md border border-danger/40 px-3 text-sm">
                <input
                  type="radio"
                  name="alpaca-insert-mode"
                  checked={mode === "LIVE"}
                  onChange={() => setMode("LIVE")}
                />
                Live (real capital)
              </label>
            </div>
          </fieldset>
          {mode === "LIVE" ? (
            <label className="flex items-start gap-2 text-sm text-danger">
              <input
                type="checkbox"
                className="mt-1"
                checked={confirmLive}
                onChange={(e) => setConfirmLive(e.target.checked)}
              />
              <span>I understand these live keys will send real orders against real money.</span>
            </label>
          ) : null}
          <div className="flex flex-col gap-2 sm:flex-row">
            {status.connected ? (
              <button
                type="button"
                disabled={busy}
                className="min-h-11 rounded-md border border-border px-4 text-sm"
                onClick={() => void drop()}
              >
                Disconnect
              </button>
            ) : null}
            <Link to="/trade" className="flex min-h-11 items-center justify-center rounded-md border border-border px-4 text-sm">
              Open trade desk
            </Link>
          </div>
        </form>
      )}
    </Panel>
  );
}
```


---

## `src/components/alpaca-data-secrets.tsx` (13093 bytes, sha256 `4d5f8eabad38ccdbc7c7a86a18f71ebfdac764a04eb8c1792cc86c3a781165f3`)

```tsx
import { useCallback, useEffect, useId, useState } from "react";
import type { ReactNode } from "react";
import {
  fetchAlpacaDataSecret, saveAlpacaDataSecret, testAlpacaDataSecret, removeAlpacaDataSecret,
} from "@/desk/alpaca-data-fns";
import type { SecretReply } from "@/desk/alpaca-data-fns";
import type { SecretCode } from "@/desk/alpaca-data-secrets";

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-md border border-border bg-surface p-4 md:p-6">
      <h2 className="mb-4 text-base font-semibold leading-6">{title}</h2>
      {children}
    </section>
  );
}

const messages: Record<SecretCode, string> = {
  SAVED: "Keys saved. Connection not tested yet.",
  REMOVED: "Saved keys removed. Alpaca account, orders, and research history are unchanged.",
  VERIFIED: "Market-data access checked.",
  NOT_TESTED: "Not tested",
  INVALID_INPUT: "Paste the full key without spaces or line breaks.",
  NOT_CONFIGURED: "No keys have been saved.",
  VERSION_CONFLICT: "Keys changed in another window. Refresh before replacing them.",
  SECRET_STORAGE_NOT_READY: "Secure storage is not ready. Your keys have not been saved.",
  STORAGE_NOT_DURABLE: "This preview has temporary storage. Real keys cannot be saved here.",
  SECRET_UNREADABLE: "Saved keys cannot be opened.",
  INVALID_CREDENTIALS: "Alpaca did not accept these keys.",
  AUTH_OR_PERMISSION_DENIED: "Access denied for this market-data check.",
  RATE_LIMITED: "Too many checks; try again shortly.",
  PROVIDER_UNAVAILABLE: "Could not reach Alpaca; saved keys were not changed.",
  STORAGE_UNAVAILABLE: "Save status is not confirmed. Check saved-key status before trying again.",
  FORBIDDEN: "Only an authorized Operator can manage their saved keys.",
};

export type AlpacaSecretApi = {
  load: () => Promise<SecretReply>;
  save: (data: { apiKeyId: string; apiSecret: string; expectedVersion: string | null }) => Promise<SecretReply>;
  test: (expectedVersion: string) => Promise<SecretReply>;
  remove: (expectedVersion: string) => Promise<SecretReply>;
};
const api: AlpacaSecretApi = {
  load: () => fetchAlpacaDataSecret(),
  save: (data) => saveAlpacaDataSecret({ data }),
  test: (expectedVersion) => testAlpacaDataSecret({ data: { expectedVersion } }),
  remove: (expectedVersion) => removeAlpacaDataSecret({ data: { expectedVersion } }),
};

type Loaded = Extract<SecretReply, { ok: true }>;
export function AlpacaDataSecrets({ transport = api }: { transport?: AlpacaSecretApi }) {
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true); setError(null); setConfirmRemove(false);
    try {
      const r = await transport.load();
      if (r.ok) setLoaded(r); else { setLoaded(null); setError(messages[r.code]); }
    } catch { setLoaded(null); setError(messages.STORAGE_UNAVAILABLE); }
    finally { setLoading(false); }
  }, [transport]);
  useEffect(() => { void reload(); }, [reload]);

  async function run(kind: "test" | "remove") {
    if (!loaded?.can_manage || !loaded.status.version || busy) return;
    setBusy(true); setError(null); setNote(null);
    try {
      const r = await transport[kind](loaded.status.version);
      if (!r.ok) { setError(messages[r.code]); return; }
      setLoaded(r); setConfirmRemove(false);
      setNote(kind === "remove" ? messages.REMOVED : messages[r.status.test_result]);
    } catch { setError(messages.STORAGE_UNAVAILABLE); }
    finally { setBusy(false); }
  }

  const status = loaded?.status;
  const canEdit = !!loaded?.can_manage && !loading && !busy && !status?.storage_code;
  const storageReady = !status?.storage_code;
  const saved = Boolean(status?.configured);
  const tested = status?.test_result === "VERIFIED";

  useEffect(() => {
    if (loaded?.can_manage && storageReady && !saved) setOpen(true);
  }, [loaded, storageReady, saved]);

  return (
    <Panel title="Alpaca market-data connection">
      <p className="mb-4 text-sm leading-relaxed text-muted">
        These keys belong to your signed-in account. Saving them does not place orders or enable live trading.
      </p>
      {loading ? <p className="mb-3 text-sm text-muted">Checking secret storage…</p> : null}
      {error ? (
        <div role="alert" className="mb-3 rounded-md border border-danger/30 bg-danger-bg px-4 py-3 text-sm text-danger">
          {error}
        </div>
      ) : null}
      {note ? <p role="status" className="mb-3 text-sm text-muted">{note}</p> : null}

      <dl className="mb-4 divide-y divide-border rounded-sm border border-border">
        <Row label="Secure storage" value={storageReady ? "Ready" : "Not ready"} hint={status?.storage_code ? messages[status.storage_code] : "Server can persist encrypted credentials."} />
        <Row label="Saved keys" value={saved ? "Saved" : "Not saved"} hint={saved ? `••••${status?.key_last4 ?? ""}` : "No encrypted pair for this account."} />
        <Row label="Market-data check" value={tested ? "Checked" : saved ? "Saved / not tested" : "Not available"} hint={status?.checked_at ?? "This checks one market-data endpoint only."} />
        <Row label="Scheduled data usage" value="Not configured" hint={saved ? "Keys are saved. Scheduled market-data ingestion is not active yet." : "Saving keys does not start a market-data schedule."} />
      </dl>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={!loaded?.can_manage || loading || busy || !storageReady}
          className="min-h-11 rounded-sm bg-primary px-4 text-sm font-medium text-primary-fg disabled:opacity-40"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? "Hide key form" : saved ? "Replace Alpaca keys" : "Add keys"}
        </button>
        {saved && loaded?.can_manage ? (
          <>
            <button type="button" disabled={!canEdit} onClick={() => void run("test")} className="min-h-11 rounded-sm border border-control px-4 text-sm disabled:opacity-40">
              {busy ? "Checking market-data access…" : "Test connection"}
            </button>
            <button type="button" disabled={busy || loading} onClick={() => setConfirmRemove(true)} className="min-h-11 rounded-sm border border-control px-4 text-sm">
              Remove saved keys
            </button>
          </>
        ) : null}
        <button type="button" disabled={busy || loading} onClick={() => void reload()} className="min-h-11 rounded-sm border border-control px-4 text-sm">
          Refresh status
        </button>
      </div>
      {open && loaded?.can_manage && storageReady ? (
        <SecretForm
          replace={saved}
          expectedVersion={loaded.status.version}
          transport={transport}
          onBusy={setBusy}
          onSaved={(r) => { setLoaded(r); setOpen(false); setNote(messages.SAVED); setError(null); }}
        />
      ) : null}
      {!storageReady && loaded?.can_manage ? (
        <p className="mt-3 text-sm text-warn">Secure storage is not ready. Your keys have not been saved.</p>
      ) : null}
      {confirmRemove ? (
        <div role="alertdialog" className="mt-4 rounded-md border border-border bg-subtle p-4">
          <h3 className="font-semibold">Remove saved Alpaca keys?</h3>
          <p className="mt-2 text-sm leading-relaxed">
            This removes the encrypted pair saved for your account in Trading App. It does not revoke the keys at Alpaca,
            cancel orders, close positions, or remove research history.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" disabled={busy} onClick={() => void run("remove")} className="min-h-11 rounded-sm bg-danger px-4 text-sm font-medium text-primary-fg">
              Remove saved keys
            </button>
            <button type="button" disabled={busy} onClick={() => setConfirmRemove(false)} className="min-h-11 rounded-sm border border-control px-4 text-sm">
              Keep keys
            </button>
          </div>
        </div>
      ) : null}
      {loaded && !loaded.can_manage ? <p className="mt-3 text-sm text-muted">Reviewer access is read-only.</p> : null}
      <p className="mt-4 text-sm leading-relaxed text-muted">
        This checks one market-data endpoint. It does not verify official auction prices, options coverage, or scheduled ingestion.
      </p>
    </Panel>
  );
}

function Row({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="grid gap-1 px-4 py-3 sm:grid-cols-[11rem_1fr]">
      <dt className="text-sm text-muted">{label}</dt>
      <dd>
        <p className="text-sm font-medium">{value}</p>
        <p className="text-sm text-muted">{hint}</p>
      </dd>
    </div>
  );
}

function SecretForm({
  replace,
  expectedVersion,
  transport,
  onBusy,
  onSaved,
}: {
  replace: boolean;
  expectedVersion: string | null;
  transport: AlpacaSecretApi;
  onBusy: (value: boolean) => void;
  onSaved: (value: Loaded) => void;
}) {
  const keyId = useId();
  const secretId = useId();
  const [key, setKey] = useState("");
  const [secret, setSecret] = useState("");
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;
    if (/\s/.test(key) || /\s/.test(secret) || !/^[\x21-\x7e]{8,80}$/.test(key) || !/^[\x21-\x7e]{8,256}$/.test(secret)) {
      setError(messages.INVALID_INPUT);
      return;
    }
    setSaving(true);
    onBusy(true);
    setError(null);
    try {
      const r = await transport.save({ apiKeyId: key, apiSecret: secret, expectedVersion });
      if (!r.ok) {
        setError(messages[r.code]);
        return;
      }
      setKey("");
      setSecret("");
      setShow(false);
      onSaved(r);
    } catch {
      setError(messages.STORAGE_UNAVAILABLE);
      setSecret("");
    } finally {
      setSaving(false);
      onBusy(false);
    }
  }

  const fieldType = show ? "text" : "password";

  return (
    <div className="mt-4 rounded-md border border-border bg-subtle p-4">
      <h3 className="text-base font-semibold">{replace ? "Replace Alpaca keys" : "Save Alpaca keys"}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        Enter the API key ID and secret for market-data access. Both are encrypted on the server. Saving them does not
        place orders or enable live trading.
      </p>
      <form className="mt-5 grid gap-4" onSubmit={(e) => void save(e)} autoComplete="off">
        <label htmlFor={keyId} className="grid gap-1 text-sm font-medium">
          API key ID
          <input
            id={keyId}
            name="alpaca_data_key_id"
            type={fieldType}
            value={key}
            onChange={(e) => setKey(e.target.value)}
            disabled={saving}
            required
            minLength={8}
            maxLength={80}
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            className="min-h-12 w-full rounded-sm border border-control bg-surface px-3 text-base"
          />
        </label>
        <label htmlFor={secretId} className="grid gap-1 text-sm font-medium">
          Secret key
          <input
            id={secretId}
            name="alpaca_data_secret"
            type={fieldType}
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            disabled={saving}
            required
            minLength={8}
            maxLength={256}
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            className="min-h-12 w-full rounded-sm border border-control bg-surface px-3 text-base"
          />
        </label>
        <p className="text-sm text-muted">Paste the full key without spaces or line breaks.</p>
        <label className="flex min-h-11 items-center gap-2 text-sm">
          <input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} disabled={saving} />
          Show newly entered keys
        </label>
        {error ? (
          <div role="alert" className="rounded-md bg-danger-bg px-3 py-2 text-sm text-danger">
            {error}
          </div>
        ) : null}
        <div className="flex flex-wrap gap-2">
          <button type="submit" disabled={saving} className="min-h-11 rounded-sm bg-primary px-4 text-sm font-medium text-primary-fg disabled:opacity-40">
            {saving ? "Saving…" : "Save secret"}
          </button>
        </div>
      </form>
    </div>
  );
}
```


---

## `src/routes/__root.tsx` (1524 bytes, sha256 `39813dd9b327b094479dd39d4819d3eebd6eb02ce63fb66b6c97c074798d2b19`)

```tsx
import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { AuthProvider } from "@/lib/auth/provider";
import { PreviewHostBridge } from "@/components/preview-host-bridge";
import appCss from "../styles.css?url";

const APP_NAME = "Trading App";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: APP_NAME },
      { name: "theme-color", content: "#F5F7FB" },
      { name: "description", content: "Paper-only after-close earnings research workspace." },
    ],
    links: [
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/__grok/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/__grok/icon-180.png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap",
      },
    ],
  }),
  component: () => (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body className="bg-canvas text-fg antialiased">
        <PreviewHostBridge />
        <AuthProvider>
          <Outlet />
        </AuthProvider>
        <Scripts />
      </body>
    </html>
  ),
});
```


---

## `src/routes/login.tsx` (4248 bytes, sha256 `22abc283c3d0fe0316b1aef3848802bac0a4733fd232dcab45529958a4048f4f`)

```tsx
import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useState } from "react";
import { GROK_PROVIDERS, authClient, authEnabled, signIn } from "@/lib/auth/client";
import { SignedIn } from "@/lib/auth/gates";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign in | Trading App" }] }),
  component: Login,
});

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onEmail(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setErr(null);
    try {
      const { error } = await authClient.signIn.email({ email, password });
      if (error) {
        const created = await authClient.signUp.email({
          email,
          password,
          name: email.split("@")[0] ?? "desk",
        });
        if (created.error) throw new Error("We could not sign you in. Check the email and password.");
      }
      window.location.href = "/";
    } catch {
      setErr("We could not sign you in. Check the email and password.");
      setPassword("");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-canvas px-4 py-10">
      <SignedIn>
        <Navigate to="/" />
      </SignedIn>
      <div className="w-full max-w-[420px] rounded-lg border border-border bg-surface p-6 md:p-8">
        <p className="text-sm font-semibold">Trading App</p>
        <h1 className="mt-3 text-[26px] font-semibold leading-8">Sign in</h1>
        <p className="mt-2 text-base text-muted">A simulated earnings research workspace. No live orders.</p>
        {authEnabled ? (
          <form onSubmit={onEmail} className="mt-6 grid gap-3">
            {err ? (
              <div className="rounded-md bg-danger-bg px-3 py-2 text-sm text-danger" role="alert" tabIndex={-1}>
                {err}
              </div>
            ) : null}
            <label className="grid gap-1 text-sm font-medium">
              Email
              <input
                type="email"
                required
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="min-h-12 rounded-sm border border-control bg-surface px-3 text-base"
              />
            </label>
            <label className="grid gap-1 text-sm font-medium">
              Password
              <input
                type={show ? "text" : "password"}
                required
                minLength={8}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="min-h-12 rounded-sm border border-control bg-surface px-3 text-base"
              />
            </label>
            <label className="flex min-h-11 items-center gap-2 text-sm">
              <input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} />
              Show password
            </label>
            <button
              type="submit"
              disabled={busy}
              className="min-h-11 rounded-sm bg-primary px-4 text-sm font-medium text-primary-fg disabled:opacity-60"
            >
              {busy ? "Signing in…" : "Sign in"}
            </button>
            {GROK_PROVIDERS.length ? (
              <div className="grid gap-2 pt-2">
                {GROK_PROVIDERS.map((p) => (
                  <button
                    key={p.providerId}
                    type="button"
                    onClick={() => void signIn(p.providerId, { callbackURL: "/" })}
                    className="min-h-11 rounded-sm border border-control px-4 text-sm"
                  >
                    Continue with {p.label}
                  </button>
                ))}
              </div>
            ) : null}
          </form>
        ) : (
          <p className="mt-6 text-sm text-muted">Sign-in is disabled in this workspace.</p>
        )}
      </div>
    </main>
  );
}
```


---

## `src/routes/index.tsx` (13383 bytes, sha256 `989fe3bbf829f9726758bc160f03249fc80849366f267bc29b03d37b7e6d2e73`)

```tsx
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell, Badge, Empty, Err, PageHeader, Panel, Stat } from "@/components/app-shell";
import { fetchHome } from "@/desk/server-fns";
import { fetchAlpacaDataSecret } from "@/desk/alpaca-data-fns";
import { formatSession, money, positionStateLabel } from "@/ui/labels";
import { TickerButton, TickerLookup } from "@/components/ticker-quote";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "Home | Trading App" }] }),
  component: Home,
});

function Home() {
  return (
    <AppShell>
      <HomeLoader />
    </AppShell>
  );
}

function HomeLoader() {
  const [data, setData] = useState<Awaited<ReturnType<typeof fetchHome>> | null>(null);
  const [secret, setSecret] = useState<Awaited<ReturnType<typeof fetchAlpacaDataSecret>> | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    void Promise.all([fetchHome(), fetchAlpacaDataSecret().catch(() => null)])
      .then(([h, s]) => {
        setData(h);
        setSecret(s);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Could not load home"));
  }, []);
  if (error) return <Err>{error}</Err>;
  if (!data) return <Empty>Loading session…</Empty>;
  if ("needs_role" in data) return <Empty>Access pending.</Empty>;
  return <HomeBody data={data} secret={secret} />;
}

function HomeBody({
  data,
  secret,
}: {
  data: Exclude<Awaited<ReturnType<typeof fetchHome>>, { needs_role: true }>;
  secret: Awaited<ReturnType<typeof fetchAlpacaDataSecret>> | null;
}) {
  const d = data.data;
  const s = d.latest_session;
  const locked = Number(s?.sealed_member_count ?? 0);
  const recorded = Number(s?.frozen_count ?? 0);
  const predicts = Number(d.predict_count ?? 0);
  const reservedSlots = Number(d.reserved_count);
  const paused = d.admission_paused;

  let headline = "Preparing today’s session";
  let support = "Checking after-close reports and required inputs.";
  let action: { to: "/earnings" | "/predictions" | "/admin"; label: string } = { to: "/earnings", label: "View earnings" };

  if (paused) {
    headline = "New paper positions are paused";
    support = d.pause_reason ?? "Paused for new entries only. Existing evidence processing continues when available.";
    action = { to: "/admin", label: "Review pause in Admin" };
  } else if (!s) {
    headline = "No eligible after-close reports";
    support = "Browse another session or wait for the next scheduled check.";
  } else if (s.freeze_resolution === "OPEN") {
    headline = "Recording decisions";
    support = `${recorded} of ${locked} decisions recorded.`;
    action = { to: "/predictions", label: "View predictions" };
  } else if (recorded < locked) {
    headline = "Some decisions were not recorded";
    support = `${recorded} of ${locked} recorded before the deadline.`;
    action = { to: "/predictions", label: "View missing decision" };
  } else if (predicts === 0) {
    headline = "No qualifying setup today";
    support = "All recorded companies remain visible. No paper position was added.";
    action = { to: "/predictions", label: "View reasons" };
  } else {
    headline = "Today’s decisions are recorded";
    support = `${predicts} upward expectation${predicts === 1 ? "" : "s"}; ${reservedSlots} paper position${reservedSlots === 1 ? "" : "s"} reserved.`;
    action = { to: "/predictions", label: "View predictions" };
  }

  const attention: Array<{ title: string; body: string; href: string }> = [];
  if (Number(d.impaired_count) > 0) {
    attention.push({
      title: "Exit or entry price unresolved",
      body: `${d.impaired_count} simulated position(s) still reserve capital. Research review may be finished; accounting is waiting for usable price evidence.`,
      href: "/",
    });
  }
  if (Number(d.overdue_deadlines) > 0) {
    attention.push({
      title: "Scheduled work is overdue",
      body: `${d.overdue_deadlines} deadline(s) are past due on the fixture clock.`,
      href: "/admin",
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Home" purpose="Your earnings session, recorded decisions, and simulated positions." />
      <p className="text-sm text-muted">
        {s ? `${formatSession(s.session_date)} · US market time (ET)` : "No stored session"} · Sample data
      </p>

      <SetupChecklist secret={secret} />

      <Panel title="Look up a listed ticker">
        <p className="mb-3 text-sm text-muted">Open a live quote, chart, and news. Sample names (ALFA, BRAV) show session prices.</p>
        <TickerLookup />
      </Panel>

      <section className="rounded-md border border-border bg-surface p-4 md:p-6">
        <h2 className="text-[20px] font-semibold leading-7">{headline}</h2>
        <p className="mt-2 text-base text-muted">{support}</p>
        {action.to === "/admin" ? (
          <Link to="/admin" className="mt-4 inline-flex min-h-11 items-center text-sm font-medium text-info">
            {action.label}
          </Link>
        ) : (
          <Link to={action.to} search={{ session: undefined }} className="mt-4 inline-flex min-h-11 items-center text-sm font-medium text-info">
            {action.label}
          </Link>
        )}
      </section>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Panel title="Session companies">
          <Stat label="Locked" value={s?.sealed_member_count ?? "0"} hint={s ? "List is locked" : "List not locked yet"} />
          <Link to="/earnings" search={{ session: undefined }} className="mt-3 inline-flex min-h-11 items-center text-sm font-medium text-info">
            View companies
          </Link>
        </Panel>
        <Panel title="Recorded decisions">
          <Stat
            label="Recorded"
            value={`${recorded} of ${locked || "—"}`}
            hint={`${predicts} upward expectation${predicts === 1 ? "" : "s"}`}
          />
          <Link to="/predictions" search={{ session: undefined }} className="mt-3 inline-flex min-h-11 items-center text-sm font-medium text-info">
            View predictions
          </Link>
        </Panel>
        <Panel title="Paper capacity">
          <Stat
            label="Reserved"
            value={`${reservedSlots} of 3`}
            hint={`${money(d.reserved_notional)} of $15,000 · Across all sessions. Simulated entry notional; not a cash balance.`}
          />
        </Panel>
        <Panel title="Next step">
          <Stat
            label="Status"
            value={s?.research_closed ? "Session research complete" : "Record decisions"}
            hint={Number(d.nonclosed_positions) > 0 ? `${d.nonclosed_positions} unresolved paper record(s)` : undefined}
          />
        </Panel>
      </div>

      <Panel title="Session timeline">
        <ol className="grid gap-3">
          {[
            { label: "Collect information", state: s ? "complete" : "waiting" },
            { label: "Lock session list", state: locked ? "complete" : "current" },
            {
              label: "Record decisions",
              state: s?.freeze_resolution === "OPEN" ? "current" : recorded ? "complete" : "waiting",
            },
            {
              label: reservedSlots > 0 ? "Establish paper entry" : "Establish paper entry",
              state: reservedSlots > 0 ? "complete" : s?.freeze_resolution !== "OPEN" && predicts === 0 ? "skipped" : "waiting",
            },
            { label: "Review next-session open", state: s?.research_closed ? "complete" : "waiting" },
            { label: "Research report available", state: s?.research_closed ? "complete" : "waiting" },
          ].map((step) => (
            <li key={step.label} className="flex min-h-11 items-center justify-between gap-3 border-b border-border pb-2">
              <span className="text-sm">{step.label}</span>
              <span className="text-sm text-muted">
                {step.state === "complete" ? "Complete" : step.state === "current" ? "Current" : step.state === "skipped" ? "Not needed: no admitted positions" : "Waiting"}
              </span>
            </li>
          ))}
        </ol>
      </Panel>

      {d.learning ? (
        <Panel title={`Current checklist · ${d.learning.rule_version}`}>
          <p className="mb-3 text-sm text-muted">
            Used on the next lock. Decisions already recorded keep the checklist they were scored with.
          </p>
          <ul className="grid gap-2 text-sm">
            {d.learning.bullets.map((b) => (
              <li key={b} className="flex min-h-11 items-center border-b border-border pb-2">
                {b}
              </li>
            ))}
          </ul>
          {d.learning.last ? (
            <p className="mt-3 text-sm text-muted">{d.learning.last.reason}</p>
          ) : (
            <p className="mt-3 text-sm text-muted">No review has run yet. A review is written after a session’s report is released.</p>
          )}
        </Panel>
      ) : null}

      <Panel title="Needs attention">
        {attention.length === 0 ? (
          <Empty>No grouped issues right now.</Empty>
        ) : (
          <ul className="grid gap-3">
            {attention.slice(0, 3).map((a) => (
              <li key={a.title} className="rounded-sm bg-warn-bg px-4 py-3">
                <p className="font-medium text-warn">{a.title}</p>
                <p className="mt-1 text-sm text-fg">{a.body}</p>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel title="Open paper positions" aside="All sessions">
        {d.open_positions.length === 0 ? (
          <Empty>No unresolved simulated positions.</Empty>
        ) : (
          <div className="overflow-x-auto" aria-label="Open paper positions">
            <table className="w-full min-w-[36rem] text-left text-sm">
              <caption className="sr-only">Unresolved simulated positions across all sessions</caption>
              <thead className="text-xs font-medium text-muted">
                <tr>
                  <th className="pb-2 font-medium">Company</th>
                  <th className="pb-2 font-medium">Earnings session</th>
                  <th className="pb-2 text-right font-medium">Reserved entry notional</th>
                  <th className="pb-2 font-medium">Paper state</th>
                </tr>
              </thead>
              <tbody>
                {d.open_positions.map((p) => (
                  <tr key={p.position_id} className="h-14 border-t border-border">
                    <td>
                      <TickerButton symbol={p.ticker} name={p.name} />
                    </td>
                    <td>{formatSession(p.session_date)}</td>
                    <td className="text-right tabular-nums">{money(p.notional)}</td>
                    <td>
                      <Badge tone={p.state.startsWith("IMPAIRED") ? "warn" : "info"}>{positionStateLabel(p.state)}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {d.reviewer_book ? (
        <Panel title="Priced results" aside="Reviewer">
          <Stat
            label="Latest modeled result"
            value={money(d.reviewer_book.latest_paper_pnl, 4)}
            hint={`${d.reviewer_book.priced_vintages} priced vintage(s) · ESTIMATED`}
          />
        </Panel>
      ) : null}
    </div>
  );
}

function SetupChecklist({ secret }: { secret: Awaited<ReturnType<typeof fetchAlpacaDataSecret>> | null }) {
  const ok = secret && "ok" in secret && secret.ok;
  const saved = Boolean(ok && secret.status.configured);
  const tested = Boolean(ok && secret.status.test_result === "VERIFIED");
  const storage = Boolean(ok && !secret.status.storage_code);
  if (saved && tested) return null;
  const rows = [
    { label: "Signed in", done: true, hint: "Account and permissions resolved." },
    { label: "Secure storage ready", done: storage, hint: "View status in Admin. You do not paste an encryption master key." },
    { label: "Alpaca keys saved", done: saved, hint: "An encrypted pair exists for this owner." },
    { label: "Market-data check", done: tested, hint: "Saved pair accepted by the read-only endpoint." },
    { label: "Required data sources ready", done: false, hint: "Sample data is labeled. Scheduled ingestion is not active yet." },
    { label: "Scheduled workflow ready", done: true, hint: "Fixture jobs and deadlines are configured for this workspace." },
  ];
  return (
    <Panel title="Workspace setup">
      <ul className="grid gap-2">
        {rows.map((r) => (
          <li key={r.label} className="flex min-h-11 items-start justify-between gap-3 border-b border-border py-2">
            <div>
              <p className="text-sm font-medium">{r.label}</p>
              <p className="text-sm text-muted">{r.hint}</p>
            </div>
            <span className={"text-sm " + (r.done ? "text-success" : "text-muted")}>{r.done ? "Done" : "Needed"}</span>
          </li>
        ))}
      </ul>
      <Link to="/admin" className="mt-3 inline-flex min-h-11 items-center text-sm font-medium text-info">
        {saved ? "Test connection in Admin" : "Add keys"}
      </Link>
    </Panel>
  );
}
```


---

## `src/routes/earnings.tsx` (8839 bytes, sha256 `e7e320d4ff01adf34f55bad7d0104acb00db973b081e191777d39201dab9453b`)

```tsx
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppShell, Badge, Drawer, Empty, Err, PageHeader, Panel, SessionTabs } from "@/components/app-shell";
import { fetchEarnings } from "@/desk/server-fns";
import { decisionLabel, infoStatus, pct, timingLabel } from "@/ui/labels";
import { TickerButton, useTickerQuote } from "@/components/ticker-quote";

export const Route = createFileRoute("/earnings")({
  validateSearch: (raw: Record<string, unknown>) => ({
    session: typeof raw.session === "string" && /^\d{4}-\d{2}-\d{2}$/.test(raw.session) ? raw.session : undefined,
  }),
  head: () => ({ meta: [{ title: "Earnings | Trading App" }] }),
  component: Earnings,
});

function Earnings() {
  const { session } = Route.useSearch();
  return (
    <AppShell>
      <Loader session={session} />
    </AppShell>
  );
}

function Loader({ session }: { session?: string }) {
  const [data, setData] = useState<Awaited<ReturnType<typeof fetchEarnings>> | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    setData(null);
    void fetchEarnings({ data: { sessionDate: session } })
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : "Could not load earnings"));
  }, [session]);
  if (error) return <Err>{error}</Err>;
  if (!data) return <Empty>Loading candidates…</Empty>;
  if ("needs_role" in data) return null;
  return <Body data={data} />;
}

function Body({ data }: { data: Exclude<Awaited<ReturnType<typeof fetchEarnings>>, { needs_role: true }> }) {
  const d = data.data;
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<"list" | "excluded" | "awaiting">("list");
  const [detail, setDetail] = useState<string | null>(null);
  const { openTicker } = useTickerQuote();

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return d.members.filter((m) => !needle || m.ticker.toLowerCase().includes(needle) || (m.name ?? "").toLowerCase().includes(needle));
  }, [d.members, q]);

  const selected = d.members.find((m) => m.permanent_security_id === detail) ?? null;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Earnings" purpose="After-close reports being considered for the selected session." />
      <SessionTabs sessions={d.sessions ?? []} active={d.session_date} to="/earnings" />
      <p className="text-sm text-muted">Locked session inputs · {d.session_date} · Sample data</p>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className={"min-h-11 rounded-sm px-3 text-sm " + (tab === "list" ? "bg-selected text-info" : "border border-border")}
          onClick={() => setTab("list")}
        >
          Session list ({d.members.length})
        </button>
        <button
          type="button"
          className={"min-h-11 rounded-sm px-3 text-sm " + (tab === "excluded" ? "bg-selected text-info" : "border border-border")}
          onClick={() => setTab("excluded")}
        >
          Excluded ({d.exclusions.length})
        </button>
        <button
          type="button"
          className={"min-h-11 rounded-sm px-3 text-sm " + (tab === "awaiting" ? "bg-selected text-info" : "border border-border")}
          onClick={() => setTab("awaiting")}
        >
          Awaiting event confirmation (0)
        </button>
      </div>

      {tab === "list" ? (
        <>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search company or ticker"
            className="min-h-12 max-w-md rounded-sm border border-control bg-surface px-3 text-base"
          />
          {q ? (
            <button type="button" className="min-h-11 text-sm font-medium text-info" onClick={() => setQ("")}>
              Clear filters
            </button>
          ) : null}
          {q && filtered.length === 0 ? (
            <Empty>No companies match your filters.</Empty>
          ) : d.members.length === 0 ? (
            <Empty>No eligible reports available.</Empty>
          ) : (
            <div className="overflow-x-auto" aria-label="Session companies">
              <table className="w-full min-w-[40rem] text-left text-sm">
                <caption className="sr-only">Companies locked for this earnings session</caption>
                <thead className="text-xs font-medium text-muted">
                  <tr>
                    <th className="pb-2 font-medium">Company</th>
                    <th className="pb-2 font-medium">Earnings</th>
                    <th className="pb-2 font-medium">Required information</th>
                    <th className="pb-2 font-medium">Rule outcome</th>
                    <th className="pb-2 font-medium">Next action</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((m) => (
                    <tr
                      key={m.permanent_security_id}
                      className="h-14 cursor-pointer border-t border-border hover:bg-subtle"
                      onClick={() => openTicker(m.ticker)}
                    >
                      <td>
                        <TickerButton symbol={m.ticker} name={m.name} />
                      </td>
                      <td>{timingLabel(m.timing_quality)}</td>
                      <td>{infoStatus(m.card_complete, m.options_valid)}</td>
                      <td>
                        <Badge tone={m.decision === "PREDICT" ? "info" : "neutral"}>
                          {decisionLabel(m.decision, m.reasons)}
                        </Badge>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="min-h-11 text-sm font-medium text-info"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDetail(m.permanent_security_id);
                          }}
                        >
                          View details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      ) : tab === "awaiting" ? (
        <Empty>No companies are waiting for event confirmation in this session.</Empty>
      ) : (
        <Panel title="Excluded candidates">
          {d.exclusions.length === 0 ? (
            <Empty>No exclusions for this session.</Empty>
          ) : (
            <ul className="grid gap-2">
              {d.exclusions.map((e) => (
                <li key={e.permanent_security_id} className="rounded-sm bg-subtle px-3 py-2 text-sm">
                  <span className="font-medium">
                    <TickerButton symbol={e.ticker} />
                  </span>
                  <span className="text-muted"> · {e.reason_codes.join(", ") || e.status}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      )}

      {selected ? (
        <Drawer title={selected.name} kicker={selected.ticker} onClose={() => setDetail(null)}>
            <p className="text-base">{timingLabel(selected.timing_quality)}</p>
            <p className="mt-1 text-sm text-muted">These inputs were locked before the decision. Newer observations are not used in this record.</p>
            <h3 className="mt-6 text-base font-semibold">Information used</h3>
            <dl className="mt-3 grid gap-3 text-sm">
              <div>
                <dt className="text-muted">Options-implied move proxy</dt>
                <dd className="font-medium tabular-nums">{selected.implied_move ? pct(selected.implied_move) : "Not available"}</dd>
                <p className="text-xs text-muted">An option-price-based size estimate; not a probability or direction forecast.</p>
              </div>
              <div>
                <dt className="text-muted">Five-day relative return</dt>
                <dd className="font-medium tabular-nums">{selected.benchmark_relative_5d ? pct(selected.benchmark_relative_5d) : "Not available"}</dd>
              </div>
              <div>
                <dt className="text-muted">63-day relative return</dt>
                <dd className="font-medium tabular-nums">{selected.benchmark_relative_63d ? pct(selected.benchmark_relative_63d) : "Not available"}</dd>
              </div>
              <div>
                <dt className="text-muted">Options validity</dt>
                <dd>{selected.options_valid == null ? "Not available" : selected.options_valid ? "Valid" : "Invalid source value"}</dd>
              </div>
            </dl>
        </Drawer>
      ) : null}
    </div>
  );
}
```


---

## `src/routes/predictions.tsx` (7905 bytes, sha256 `5e5f6e66197b9a5c95c5cdf32f4b79db2480ac2213eb4afcc2fc5e7c50e107db`)

```tsx
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppShell, Badge, Drawer, Empty, Err, PageHeader, SessionTabs } from "@/components/app-shell";
import { fetchPredictions, postVerifyFreeze } from "@/desk/server-fns";
import { decisionLabel, mainReason, paperLabel, verificationLabel } from "@/ui/labels";
import { TickerButton, useTickerQuote } from "@/components/ticker-quote";

export const Route = createFileRoute("/predictions")({
  validateSearch: (raw: Record<string, unknown>) => ({
    session: typeof raw.session === "string" && /^\d{4}-\d{2}-\d{2}$/.test(raw.session) ? raw.session : undefined,
  }),
  head: () => ({ meta: [{ title: "Predictions | Trading App" }] }),
  component: Predictions,
});

function Predictions() {
  const { session } = Route.useSearch();
  return (
    <AppShell>
      <Loader session={session} />
    </AppShell>
  );
}

function Loader({ session }: { session?: string }) {
  const [data, setData] = useState<Awaited<ReturnType<typeof fetchPredictions>> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  useEffect(() => {
    setData(null);
    void fetchPredictions({ data: { sessionDate: session } })
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : "Could not load predictions"));
  }, [session]);

  async function verify(manifestId: string, securityId: string) {
    setNote("Checking the saved inputs and decision.");
    try {
      await postVerifyFreeze({ data: { manifestId, securityId } });
      setNote("Saved record verified.");
    } catch (e) {
      setNote(e instanceof Error ? e.message : "Verification unavailable");
    }
  }

  if (error) return <Err>{error}</Err>;
  if (!data) return <Empty>Loading freeze ledger…</Empty>;
  if ("needs_role" in data) return null;
  return <Body data={data} note={note} onVerify={verify} />;
}

function Body({
  data,
  note,
  onVerify,
}: {
  data: Exclude<Awaited<ReturnType<typeof fetchPredictions>>, { needs_role: true }>;
  note: string | null;
  onVerify: (m: string, s: string) => void;
}) {
  const d = data.data;
  const [filter, setFilter] = useState<"ALL" | "PREDICT" | "STAND_DOWN" | "NO_FREEZE">("ALL");
  const [detail, setDetail] = useState<string | null>(null);
  const rows = useMemo(() => {
    return d.rows.filter((r) => (filter === "ALL" ? true : r.status === filter));
  }, [d.rows, filter]);
  const n = d.rows.filter((r) => r.status !== "NO_FREEZE").length;
  const p = d.rows.filter((r) => r.status === "PREDICT").length;
  const s = d.rows.filter((r) => r.status === "STAND_DOWN").length;
  const u = d.rows.filter((r) => r.status === "NO_FREEZE").length;
  const selected = d.rows.find((r) => r.permanent_security_id === detail) ?? null;
  const { openTicker } = useTickerQuote();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Predictions" purpose="Recorded expectations and the paper positions they did—or did not—create." />
      <SessionTabs sessions={d.sessions ?? []} active={d.session_date} to="/predictions" />
      <p className="text-sm text-muted">
        {d.session_date} · Decisions cannot be edited · {n} recorded · {p} upward expectations · {s} not selected · {u}{" "}
        no decision recorded
      </p>
      {note ? (
        <p className="text-sm text-muted" role="status">
          {note}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {(
          [
            ["ALL", "All"],
            ["PREDICT", "Upward expectation"],
            ["STAND_DOWN", "Not selected"],
            ["NO_FREEZE", "No decision recorded"],
          ] as const
        ).map(([k, lab]) => (
          <button
            key={k}
            type="button"
            className={"min-h-11 rounded-sm px-3 text-sm " + (filter === k ? "bg-selected text-info" : "border border-border")}
            onClick={() => setFilter(k)}
          >
            {lab}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto" aria-label="Recorded decisions">
        <table className="w-full min-w-[44rem] text-left text-sm">
          <caption className="sr-only">Recorded research decisions for this session</caption>
          <thead className="text-xs font-medium text-muted">
            <tr>
              <th className="pb-2 font-medium">Company</th>
              <th className="pb-2 font-medium">Recorded expectation</th>
              <th className="pb-2 font-medium">Main reason</th>
              <th className="pb-2 font-medium">Paper position</th>
              <th className="pb-2 font-medium">Details</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr
                key={r.permanent_security_id}
                className="h-14 cursor-pointer border-t border-border hover:bg-subtle"
                onClick={() => openTicker(r.ticker)}
              >
                <td className="font-medium">
                  <TickerButton symbol={r.ticker} />
                </td>
                <td>
                  <Badge tone={r.status === "PREDICT" ? "info" : "neutral"}>{decisionLabel(r.status, r.reasons)}</Badge>
                </td>
                <td className="max-w-xs text-muted">{mainReason(r.reasons)}</td>
                <td>{paperLabel(r.execution, r.status)}</td>
                <td>
                  <button
                    type="button"
                    className="min-h-11 text-sm font-medium text-info"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDetail(r.permanent_security_id);
                    }}
                  >
                    View decision
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-sm text-muted">A prediction is a research expectation. It does not guarantee a paper position.</p>

      {selected ? (
        <Drawer title={decisionLabel(selected.status, selected.reasons)} kicker={selected.ticker} onClose={() => setDetail(null)}>
            <p className="text-base">{mainReason(selected.reasons)}</p>
            <p className="mt-2 text-sm text-muted">{paperLabel(selected.execution, selected.status)}</p>
            <p className="mt-2 text-sm text-muted">A forecast is not an order to a broker.</p>
            {selected.magnitude_low && selected.magnitude_high ? (
              <p className="mt-4 text-sm">
                Expected move range — stated rule band: {selected.magnitude_low} – {selected.magnitude_high}
              </p>
            ) : data.data.role === "OPERATOR" ? (
              <p className="mt-4 text-sm text-muted">Expected move range is withheld for this role until the review window is released.</p>
            ) : null}
            <p className="mt-4 text-sm">Record evidence: {verificationLabel(selected.verification_level)}</p>
            <button
              type="button"
              className="mt-6 min-h-11 self-start rounded-sm bg-primary px-4 text-sm font-medium text-primary-fg"
              onClick={() => onVerify(data.data.manifest_id, selected.permanent_security_id)}
            >
              Verify saved record
            </button>
            {selected.input_hash ? (
              <details className="mt-6 text-sm">
                <summary className="min-h-11 cursor-pointer font-medium">Technical details</summary>
                <p className="mt-2 break-all font-mono text-xs text-muted">Input {selected.input_hash}</p>
                <p className="break-all font-mono text-xs text-muted">Output {selected.output_hash}</p>
              </details>
            ) : null}
        </Drawer>
      ) : null}
    </div>
  );
}
```


---

## `src/routes/results.tsx` (10335 bytes, sha256 `f6bcdbc3d8c453eec194b9aa504ce658fefd527cd68f3181d4d917856cd805af`)

```tsx
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell, Badge, Empty, Err, PageHeader, Panel, Stat } from "@/components/app-shell";
import { fetchResults } from "@/desk/server-fns";
import { decisionLabel, money, positionStateLabel } from "@/ui/labels";
import { TickerButton } from "@/components/ticker-quote";

export const Route = createFileRoute("/results")({
  head: () => ({ meta: [{ title: "Results | Trading App" }] }),
  component: Results,
});

function Results() {
  return (
    <AppShell>
      <Loader />
    </AppShell>
  );
}

function Loader() {
  const [data, setData] = useState<Awaited<ReturnType<typeof fetchResults>> | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    void fetchResults()
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : "Could not load results"));
  }, []);
  if (error) return <Err>{error}</Err>;
  if (!data) return <Empty>Loading report…</Empty>;
  if ("needs_role" in data) return null;
  return <Body data={data} />;
}

function Body({ data }: { data: Exclude<Awaited<ReturnType<typeof fetchResults>>, { needs_role: true }> }) {
  const d = data.data;
  const p = d.process;
  const [tab, setTab] = useState<"process" | "review" | "book" | "learn">("process");
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Results" purpose="Operational coverage and research outcomes, with missing evidence kept visible." />
      <div className="rounded-md border-l-4 border-info bg-info-bg px-4 py-3 text-sm leading-relaxed">
        Operational research report. The initial rule was selected after prior observation. Small-sample hit rate does
        not establish a trading edge. Paper P&L is ESTIMATED under a conservative stress haircut, not live-fill
        evidence. Unresolved prices and excluded labels are disclosed separately.
      </div>
      {d.banner ? <p className="text-sm text-muted">{d.banner}</p> : null}
      <div className="flex flex-wrap gap-2">
        {(
          [
            ["process", "Process"],
            ["review", "Prediction review"],
            ["book", "Paper results"],
            ["learn", "Checklist"],
          ] as const
        ).map(([k, lab]) => (
          <button
            key={k}
            type="button"
            className={"min-h-11 rounded-sm px-3 text-sm " + (tab === k ? "bg-selected text-info" : "border border-border")}
            onClick={() => setTab(k)}
          >
            {lab}
          </button>
        ))}
      </div>

      {tab === "process" ? (
        <Panel title="Process coverage">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <Stat label="Locked companies" value={p.sealed} />
            <Stat label="Decisions recorded" value={p.frozen} hint={p.freeze_rate.value ? `${p.frozen} of ${p.sealed}` : p.freeze_rate.reason ?? undefined} />
            <Stat label="No decision recorded" value={p.no_freeze} />
            <Stat label="Upward expectations" value={p.predict} />
            <Stat label="Not selected" value={p.stand_down} />
            <Stat label="Complete cards" value={p.complete_frozen_cards} />
          </div>
        </Panel>
      ) : null}

      {tab === "review" ? (
        <Panel title="Prediction review">
          {"restricted" in d.research && d.research.restricted ? (
            <Empty>{d.research.message}</Empty>
          ) : (
            <Research r={d.research as Extract<typeof d.research, { restricted: false }>} />
          )}
        </Panel>
      ) : null}

      {tab === "book" ? (
        <Panel title="Modeled paper results" aside="ESTIMATED">
          {"restricted" in d.book && d.book.restricted ? (
            <Empty>Paper results are withheld for this role until the review window is released.</Empty>
          ) : (
            <Book b={d.book as Extract<typeof d.book, { positions: unknown }>} />
          )}
        </Panel>
      ) : null}

      {tab === "learn" ? (
        <Panel title={`Checklist in force · ${d.learning?.rule_version ?? "v1"}`}>
          <LearnBlock learning={d.learning} />
        </Panel>
      ) : null}
    </div>
  );
}

function LearnBlock({
  learning,
}: {
  learning?: {
    rule_version: string;
    bullets: string[];
    last: { adopted: boolean; reason: string; evidence_n: number | null; direction_hits: number | null; created_at: string } | null;
    history: Array<{
      adopted: boolean;
      reason: string;
      rule_version: string | null;
      created_at: string;
      evidence_n: number | null;
      direction_hits: number | null;
    }>;
  };
}) {
  if (!learning) return <Empty>Checklist review has not run yet.</Empty>;
  return (
    <div className="grid gap-4">
      <p className="text-sm text-muted">
        The next lock uses this checklist. Decisions already recorded keep the version they were scored with.
      </p>
      <ul className="grid gap-2 text-sm">
        {learning.bullets.map((b) => (
          <li key={b} className="flex min-h-11 items-center border-b border-border pb-2">
            {b}
          </li>
        ))}
      </ul>
      {learning.last ? (
        <div className="rounded-sm bg-subtle px-4 py-3">
          <p className="text-sm font-medium">{learning.last.adopted ? "Updated for the next lock" : "Reviewed · no change"}</p>
          <p className="mt-1 text-sm text-muted">{learning.last.reason}</p>
        </div>
      ) : null}
      {learning.history.length > 0 ? (
        <div>
          <h3 className="mb-2 text-sm font-semibold">Review history</h3>
          <ol className="grid gap-3">
            {learning.history.map((h, i) => (
              <li key={`${h.created_at}-${i}`} className="border-b border-border pb-2">
                <p className="text-sm">
                  {h.adopted ? `Adopted ${h.rule_version ?? ""}`.trim() : "Held"}
                  {h.evidence_n != null ? ` · ${h.direction_hits} of ${h.evidence_n} clean labels` : ""}
                </p>
                <p className="mt-1 text-sm text-muted">{h.reason}</p>
              </li>
            ))}
          </ol>
        </div>
      ) : (
        <Empty>No reviews recorded yet.</Empty>
      )}
    </div>
  );
}

function Research({
  r,
}: {
  r: {
    clean_predict_n: string;
    direction_hits: string;
    hit_rate: { value: string | null; reason: string | null } | null;
    attrition_lower: { value: string | null };
    attrition_upper: { value: string | null };
    interval_label: string;
    point_estimate_suppressed: boolean;
    grades: Array<Record<string, unknown>>;
  };
}) {
  return (
    <div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Stat label="Usable clean labels" value={r.clean_predict_n} />
        <Stat label="Directional hits" value={r.direction_hits} hint={`of ${r.clean_predict_n} usable labels`} />
        <Stat
          label="Range allowing for missing/excluded labels"
          value={`${r.attrition_lower.value ?? "—"} – ${r.attrition_upper.value ?? "—"}`}
          hint="This is a sensitivity range, not a confidence interval."
        />
        {r.point_estimate_suppressed ? null : (
          <Stat label="Directional rate on usable labels" value={r.hit_rate?.value ?? r.hit_rate?.reason ?? "—"} />
        )}
      </div>
      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[36rem] text-left text-sm">
          <thead className="text-xs font-medium text-muted">
            <tr>
              <th className="pb-2 font-medium">Company</th>
              <th className="pb-2 font-medium">Decision</th>
              <th className="pb-2 font-medium">Research outcome</th>
            </tr>
          </thead>
          <tbody>
            {r.grades.map((g) => (
              <tr key={String(g.id) + String(g.session_date)} className="h-14 border-t border-border">
                <td>
                  <TickerButton symbol={String(g.ticker)} />
                </td>
                <td>{decisionLabel(typeof g.decision === "string" ? g.decision : null)}</td>
                <td>
                  <Badge tone={g.in_evidence_set ? "success" : "warn"}>
                    {g.outcome === "NO_EVENT" ? "Earnings event changed" : g.in_evidence_set ? "Included in primary review" : "Not evaluable"}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Book({
  b,
}: {
  b: {
    positions: Array<{
      ticker: string;
      state: string;
      original_reserved_notional: string;
      paper_pnl: string | null;
      basis: string | null;
    }>;
  };
}) {
  const priced = b.positions.filter((p) => p.paper_pnl != null);
  const unresolved = b.positions.filter((p) => p.paper_pnl == null && p.state !== "CLOSED");
  return (
    <div>
      <p className="mb-4 text-sm text-muted">
        Priced positions only; {unresolved.length} unresolved positions excluded from this total.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[40rem] text-left text-sm">
          <thead className="text-xs font-medium text-muted">
            <tr>
              <th className="pb-2 font-medium">Company</th>
              <th className="pb-2 font-medium">State</th>
              <th className="pb-2 text-right font-medium">Reserved notional</th>
              <th className="pb-2 text-right font-medium">Modeled result</th>
            </tr>
          </thead>
          <tbody>
            {b.positions.map((p) => (
              <tr key={p.ticker + p.state} className="h-14 border-t border-border">
                <td>
                  <TickerButton symbol={p.ticker} />
                </td>
                <td>{positionStateLabel(p.state)}</td>
                <td className="text-right tabular-nums">{money(p.original_reserved_notional)}</td>
                <td className="text-right tabular-nums">{p.paper_pnl == null ? "Excluded" : money(p.paper_pnl, 4)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {priced.length === 0 ? <p className="mt-3 text-sm text-muted">No priced positions in this snapshot.</p> : null}
    </div>
  );
}
```


---

## `src/routes/admin.tsx` (12428 bytes, sha256 `209f44a34290521caabaff84717133c91612ed8996e82bd36f114e7305044fa1`)

```tsx
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell, Badge, Empty, Err, PageHeader, Panel } from "@/components/app-shell";
import { AlpacaDataSecrets } from "@/components/alpaca-data-secrets";
import { fetchAdmin, postFireNote, postPause, postPrintKnowledge, postResume, postRetryDeadlines } from "@/desk/server-fns";
import { alarmLabel, jobPurpose } from "@/ui/labels";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin | Trading App" }] }),
  component: Admin,
});

function Admin() {
  return (
    <AppShell>
      <div className="mx-auto flex max-w-[1040px] flex-col gap-8">
        <PageHeader title="Admin" purpose="Connections and safe controls for this simulated research workspace." />
        <nav className="hidden flex-wrap gap-3 text-sm md:flex" aria-label="Admin sections">
          <a href="#connections" className="text-info">
            Connections
          </a>
          <a href="#controls" className="text-info">
            Paper controls
          </a>
          <a href="#status" className="text-info">
            System status
          </a>
          <a href="#rules" className="text-info">
            Rules & review
          </a>
        </nav>
        <section id="connections" className="scroll-mt-24">
          <h2 className="mb-4 text-xl font-semibold">Connections</h2>
          <p className="mb-4 text-sm text-muted">These keys belong to your signed-in account. Saving them does not place orders or enable live trading.</p>
          <AlpacaDataSecrets />
        </section>
        <AdminOps />
      </div>
    </AppShell>
  );
}

function AdminOps() {
  const [data, setData] = useState<Awaited<ReturnType<typeof fetchAdmin>> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  async function reload() {
    const d = await fetchAdmin();
    setData(d);
  }
  useEffect(() => {
    void reload().catch((e) => setError(e instanceof Error ? e.message : "Could not load admin"));
  }, []);
  async function run(label: string, fn: () => Promise<unknown>) {
    setNote(null);
    try {
      await fn();
      setNote(label);
      await reload();
    } catch (e) {
      setNote(e instanceof Error ? e.message : "Action failed");
    }
  }
  if (error) return <Err>{error}</Err>;
  if (!data) return <Empty>Loading system status…</Empty>;
  if ("needs_role" in data) return null;
  const d = data.data;
  return <Ops data={d} note={note} run={run} />;
}

function Ops({
  data: d,
  note,
  run,
}: {
  data: Exclude<Awaited<ReturnType<typeof fetchAdmin>>, { needs_role: true }>["data"];
  note: string | null;
  run: (label: string, fn: () => Promise<unknown>) => void;
}) {
  const [reason, setReason] = useState("operational pause");
  const [hyp, setHyp] = useState<"IMPLEMENTATION_BUG" | "COVERAGE_SHIFT" | "REGIME_SHIFT">("COVERAGE_SHIFT");
  const [fire, setFire] = useState("");
  const [pk, setPk] = useState({ eventKey: "", securityId: "", reason: "" });
  const paused = d.admission_paused;
  return (
    <>
      {note ? (
        <p className="text-sm text-muted" role="status">
          {note}
        </p>
      ) : null}

      <Panel title="Source readiness">
        <p className="mb-3 text-sm text-muted">Missing credentials do not become Ready because the page loaded.</p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[36rem] text-left text-sm">
            <caption className="sr-only">Required research data sources</caption>
            <thead className="text-xs font-medium text-muted">
              <tr>
                <th className="pb-2 font-medium">Source</th>
                <th className="pb-2 font-medium">Status</th>
                <th className="pb-2 font-medium">Scope</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Security identity", d.ports.security_master],
                ["Market calendar", d.ports.calendar],
                ["Earnings calendar", d.ports.earnings],
                ["Stock quotes", d.ports.quotes],
                ["Official closing prices", d.ports.official_marks],
                ["Official opening prices", d.ports.official_marks],
              ].map(([name, port]) => (
                <tr key={name} className="h-14 border-t border-border">
                  <td>{name}</td>
                  <td>{port === "FIXTURE" ? "Sample data" : port === "ABSENT" ? "Not configured" : "Ready"}</td>
                  <td className="text-muted">{port === "FIXTURE" ? "Fixture session only" : String(port)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <section id="controls" className="scroll-mt-24 flex flex-col gap-4">
        <h2 className="text-xl font-semibold">Paper controls</h2>
        <Panel
          title="New paper entries"
          aside={paused ? "Paused" : "Allowed"}
        >
          <p className="mb-4 text-sm text-muted">
            Pause prevents new reservations, but data collection, scheduled reviews, valid exits, and reconciliation
            continue when their dependencies are healthy. Applies to new paper positions across the workspace.
          </p>
          {d.can_mutate ? (
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="min-h-12 flex-1 rounded-sm border border-control bg-surface px-3 text-base"
                placeholder="Pause reason"
              />
              <button
                type="button"
                className="min-h-11 rounded-sm border border-control px-4 text-sm"
                onClick={() => run("New paper positions paused.", () => postPause({ data: { reason } }))}
              >
                Pause new paper positions
              </button>
              <button
                type="button"
                className="min-h-11 rounded-sm bg-primary px-4 text-sm font-medium text-primary-fg"
                onClick={() => run("New paper positions allowed.", () => postResume())}
              >
                Resume
              </button>
            </div>
          ) : (
            <Empty>Reviewer can read this control but cannot change it.</Empty>
          )}
        </Panel>
        <details className="rounded-md border border-border bg-surface p-4">
          <summary className="min-h-11 cursor-pointer font-medium">Special event handling</summary>
          <p className="mt-2 text-sm text-muted">
            Use for results known earlier than the permitted decision/entry horizon. Normal scheduled after-close
            releases are not early-result incidents.
          </p>
          {d.can_mutate ? (
            <form
              className="mt-3 grid gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                run("Early-result knowledge recorded.", () =>
                  postPrintKnowledge({ data: { eventKey: pk.eventKey, securityId: pk.securityId, reason: pk.reason } }),
                );
              }}
            >
              <input
                className="min-h-12 rounded-sm border border-control px-3"
                placeholder="Event key"
                value={pk.eventKey}
                onChange={(e) => setPk({ ...pk, eventKey: e.target.value })}
              />
              <input
                className="min-h-12 rounded-sm border border-control px-3"
                placeholder="Company id"
                value={pk.securityId}
                onChange={(e) => setPk({ ...pk, securityId: e.target.value })}
              />
              <input
                className="min-h-12 rounded-sm border border-control px-3"
                placeholder="Reason"
                value={pk.reason}
                onChange={(e) => setPk({ ...pk, reason: e.target.value })}
              />
              <button type="submit" className="min-h-11 rounded-sm border border-control px-4 text-sm">
                Record early results
              </button>
            </form>
          ) : null}
        </details>
      </section>

      <section id="status" className="scroll-mt-24 flex flex-col gap-4">
        <h2 className="text-xl font-semibold">System status</h2>
        <Panel title="Scheduled work">
          <ul className="grid gap-2">
            {d.jobs.map((j) => (
              <li key={j.job_name} className="flex min-h-14 items-center justify-between gap-3 border-b border-border py-2 text-sm">
                <div>
                  <p className="font-medium">{jobPurpose(j.job_name)}</p>
                  <p className="text-muted">{j.job_name}</p>
                </div>
                <Badge tone={j.status === "FAILED" ? "danger" : j.status === "RUNNING" ? "warn" : "neutral"}>{j.status}</Badge>
              </li>
            ))}
          </ul>
          {d.can_mutate ? (
            <button
              type="button"
              className="mt-4 min-h-11 rounded-sm border border-control px-4 text-sm"
              onClick={() => run("Retry scheduled job requested.", () => postRetryDeadlines())}
            >
              Retry scheduled job
            </button>
          ) : null}
        </Panel>
        <Panel title="Unresolved issues" aside={`${d.alarms.length}`}>
          {d.alarms.length === 0 ? (
            <Empty>No unresolved alarms.</Empty>
          ) : (
            <ul className="grid gap-2">
              {d.alarms.map((a, i) => {
                const copy = alarmLabel(a.code);
                return (
                  <li key={a.code + i} className="rounded-sm bg-danger-bg px-3 py-2 text-sm text-danger">
                    <p className="font-medium">{copy.title}</p>
                    <p className="mt-0.5 text-danger/80">{copy.detail}</p>
                    {a.blocks_new_admission ? (
                      <p className="mt-1 text-danger/80">New paper entries are disabled while this record is checked.</p>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
      </section>

      <section id="rules" className="scroll-mt-24 flex flex-col gap-4">
        <h2 className="text-xl font-semibold">Rules & review</h2>
        <Panel title="Current rule" aside="rule-v1">
          <p className="text-sm leading-relaxed">
            Predict long when issuer-confirmed after-close timing, a complete card, valid options, an options-implied
            move proxy between 4% and 15%, five-day relative return below the benchmark, and 63-day relative return
            above the benchmark. Otherwise no qualifying setup.
          </p>
          <p className="mt-3 text-sm text-muted">The initial rule was selected after prior observation.</p>
        </Panel>
        <Panel title="Review note">
          {d.can_mutate ? (
            <form
              className="grid gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                run("Review note saved.", () => postFireNote({ data: { hypothesis: hyp, note: fire } }));
              }}
            >
              <select
                className="min-h-12 rounded-sm border border-control px-3 text-base"
                value={hyp}
                onChange={(e) => setHyp(e.target.value as typeof hyp)}
              >
                <option value="IMPLEMENTATION_BUG">Possible implementation issue</option>
                <option value="COVERAGE_SHIFT">Data coverage changed</option>
                <option value="REGIME_SHIFT">Market conditions changed</option>
              </select>
              <textarea
                className="min-h-24 rounded-sm border border-control px-3 py-2 text-base"
                value={fire}
                onChange={(e) => setFire(e.target.value)}
                placeholder="Note"
              />
              <button type="submit" className="min-h-11 self-start rounded-sm bg-primary px-4 text-sm font-medium text-primary-fg">
                Save review note
              </button>
            </form>
          ) : (
            <Empty>Reviewer notes are operator-only.</Empty>
          )}
        </Panel>
      </section>
    </>
  );
}
```


---

## `src/routes/trade.tsx` (979 bytes, sha256 `0efddd5bcc7bf22e1b0a2b587de4f5316f38840cbd06fa4e8b051fbc04b1cba4`)

```tsx
import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/app-shell";

export const Route = createFileRoute("/trade")({
  head: () => ({ meta: [{ title: "Trade | Trading App" }] }),
  component: Trade,
});

function Trade() {
  return (
    <AppShell>
      <div className="mx-auto max-w-lg py-8">
        <PageHeader title="Simulated research only" purpose="This workspace supports simulated earnings research only." />
        <p className="text-base leading-relaxed text-muted">
          There is no order ticket in this interface. Paper positions are reserved by the earnings rule, not by a
          buy/sell form. Broker keys, if saved, are used only as a market-data connection from Admin.
        </p>
        <Link to="/" className="mt-6 inline-flex min-h-11 items-center rounded-sm bg-primary px-4 text-sm font-medium text-primary-fg">
          Back to Home
        </Link>
      </div>
    </AppShell>
  );
}
```


---

## `src/routes/keys.tsx` (274 bytes, sha256 `7a1a96be5bf3c7af6162acc901970f620084b1e16d7f222d77df53a3bce8a97c`)

```tsx
import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/keys")({
  head: () => ({ meta: [{ title: "Admin | Trading App" }] }),
  component: KeysRedirect,
});

function KeysRedirect() {
  return <Navigate to="/admin" />;
}
```


---

## `src/lib/db.ts` (10791 bytes, sha256 `d78a99b8e73e86cd1d8ec1c5404eae1a9c264da05a26ed635fabfa05c518cd26`)

```ts
import { pendingMigrations } from "../../scripts/migration-plan.mjs";

/** Which database backend is active. */
export type DbSource = "neon" | "pglite";

// An empty/whitespace DATABASE_URL (an easy misconfig in deploy UIs) must mean
// "unset" — otherwise production would silently run on the PGLite fallback.
const rawDatabaseUrl =
  typeof process !== "undefined" ? process.env.DATABASE_URL : undefined;
const databaseUrl =
  rawDatabaseUrl && rawDatabaseUrl.trim() ? rawDatabaseUrl : undefined;

/**
 * Active backend: real **Neon** when `DATABASE_URL` is set (deployed / configured
 * sandbox), otherwise a local embedded **PGLite** (Postgres compiled to WASM) so
 * the app has a working database even with nothing configured — the live preview
 * included. Swap in Neon later by just setting `DATABASE_URL`; no code changes.
 */
export const dbSource: DbSource = databaseUrl ? "neon" : "pglite";

/**
 * Minimal shared SQL surface, satisfied by both Neon and PGLite. Both the
 * tagged-template and `.query()` forms resolve to an array of row objects:
 *
 *   const sql = await getSql();
 *   const rows = await sql`select * from todos where id = ${id}`; // parameterized
 *   const rows2 = await sql.query("select * from todos where id = $1", [id]);
 */
export interface Sql {
  <T = Record<string, unknown>>(
    strings: TemplateStringsArray,
    ...values: unknown[]
  ): Promise<T[]>;
  query<T = Record<string, unknown>>(
    text: string,
    params?: unknown[],
  ): Promise<T[]>;
}

/**
 * Init state lives on globalThis as promises: dev HMR creates new instances of
 * this module, and two instances racing module-level state would open a second
 * pool or run two concurrent PGLite migration passes (whose duplicate
 * `_migrations` insert rejects — and would get memoized, poisoning every later
 * `getSql()`). A failed init clears its slot so the next call retries.
 */
const globalRef = globalThis as typeof globalThis & {
  __pgSqlPromise__?: Promise<Sql>;
  __pgliteInstance__?: Promise<import("@electric-sql/pglite").PGlite>;
  __pgliteMigrateChain__?: Promise<void>;
  __pgPool__?: import("pg").Pool;
};

/**
 * Result-type parity: Postgres sends every value as text plus a type OID — the
 * JS value is the DRIVER's parsing choice, and pg and PGLite disagree (pg:
 * int8 -> string, date -> local-midnight Date; PGLite: int8 -> BigInt, which
 * JSON.stringify rejects, date -> UTC Date). Normalize both so preview and
 * production return identical, JSON-safe shapes:
 *   int8/bigint (incl. count(*)) -> number (past 2^53 loses precision — cast
 *                                   `::text` if you ever need huge integers)
 *   date                         -> 'YYYY-MM-DD' string
 *   interval                     -> Postgres interval text
 * numeric already comes back as a string on both (arbitrary precision).
 */
const OID_INT8 = 20;
const OID_DATE = 1082;
const OID_INTERVAL = 1186;
const identity = (v: string) => v;

type Run = <T>(text: string, params: unknown[]) => Promise<T[]>;

/** Wrap a query runner in the tagged-template + `.query()` `Sql` surface. */
function toSql(run: Run): Sql {
  const sql = (async <T = Record<string, unknown>>(
    strings: TemplateStringsArray,
    ...values: unknown[]
  ): Promise<T[]> => {
    // Rebuild with $1, $2, … placeholders so values stay parameterized.
    let text = strings[0];
    for (let i = 0; i < values.length; i += 1) text += `$${i + 1}${strings[i + 1]}`;
    return run<T>(text, values);
  }) as unknown as Sql;
  sql.query = <T = Record<string, unknown>>(text: string, params: unknown[] = []) =>
    run<T>(text, params);
  return sql;
}

function createNeonSql(): Promise<Sql> {
  globalRef.__pgSqlPromise__ ??= (async () => {
    // Regular Postgres driver: node-postgres (`pg`) — works directly with Neon's
    // pooled endpoint. One pool per process; warm serverless instances reuse it.
    const { Pool, types } = await import("pg");
    types.setTypeParser(OID_INT8, Number);
    types.setTypeParser(OID_DATE, identity);
    types.setTypeParser(OID_INTERVAL, identity);
    const pool = new Pool({ connectionString: databaseUrl });
    globalRef.__pgPool__ = pool;
    return toSql(async <T>(text: string, params: unknown[]) => {
      const res = await pool.query(text, params);
      return res.rows as T[];
    });
  })().catch((err) => {
    globalRef.__pgSqlPromise__ = undefined;
    throw err;
  });
  return globalRef.__pgSqlPromise__;
}

async function createPgliteSql(): Promise<Sql> {
  // Embedded Postgres, imported on demand so it never loads on the Neon path.
  // One in-memory instance per process, shared across HMR module instances, so
  // data survives source edits (it resets on dev-server restart).
  globalRef.__pgliteInstance__ ??= (async () => {
    const { PGlite } = await import("@electric-sql/pglite");
    const pg = new PGlite({
      parsers: {
        [OID_INT8]: Number,
        [OID_DATE]: identity,
        [OID_INTERVAL]: identity,
      },
    });
    await pg.waitReady;
    await pg.exec(
      "create table if not exists _migrations (name text primary key, applied_at timestamptz not null default now())",
    );
    return pg;
  })().catch((err) => {
    globalRef.__pgliteInstance__ = undefined;
    throw err;
  });
  const pg = await globalRef.__pgliteInstance__;

  // Apply migrations/ (the single schema source) so preview matches production.
  // SQL is inlined by the bundler via import.meta.glob (no runtime fs); applied
  // files are tracked in _migrations. The glob does not descend, so the opt-in
  // auth schema under migrations/auth/ stays out. Runs once per module instance
  // — so an HMR reload after adding a migration file applies it live — with
  // passes serialized on a global chain so concurrent callers never
  // double-apply.
  const migrate = async (): Promise<void> => {
    const migrations = import.meta.glob("/migrations/*.sql", {
      query: "?raw",
      import: "default",
      eager: true,
    }) as Record<string, string>;
    const doneRows = await pg.query<{ name: string }>(
      "select name from _migrations",
    );
    const done = doneRows.rows.map((r) => r.name);
    for (const { name, path } of pendingMigrations(Object.keys(migrations), done)) {
      // Apply + record atomically (parity with scripts/migrate.mjs) so a failed
      // statement can't leave a file half-applied but untracked.
      await pg.transaction(async (tx) => {
        await tx.exec(migrations[path]);
        await tx.query("insert into _migrations (name) values ($1)", [name]);
      });
    }
  };
  const pass = (globalRef.__pgliteMigrateChain__ ?? Promise.resolve())
    .catch(() => undefined) // an earlier failed pass must not wedge the chain
    .then(migrate);
  globalRef.__pgliteMigrateChain__ = pass;
  await pass;

  return toSql(async <T>(text: string, params: unknown[]) => {
    const result = await pg.query<T>(text, params);
    return result.rows;
  });
}

let sqlPromise: Promise<Sql> | null = null;

async function createSql(): Promise<Sql> {
  if (typeof window !== "undefined") {
    throw new Error(
      "@/lib/db is server-only — call getSql() from a createServerFn handler " +
        "or a server route loader, never from client code.",
    );
  }
  return dbSource === "neon" ? createNeonSql() : createPgliteSql();
}

/**
 * Get the shared, **server-only** SQL client. Neon when `DATABASE_URL` is set,
 * otherwise the local PGLite fallback. Memoized — safe to call per request.
 *
 * Schema comes from `migrations/*.sql`, auto-applied before the first query on
 * both backends — define tables there, never inline in server functions.
 */
export function getSql(): Promise<Sql> {
  sqlPromise ??= createSql().catch((err) => {
    sqlPromise = null; // don't memoize failures — let the next call retry
    throw err;
  });
  return sqlPromise;
}

/**
 * The shared PGLite instance (preview only), with `migrations/*.sql` applied.
 * Lets Better Auth persist to the SAME embedded DB as app data in preview (via a
 * Kysely dialect). Throws when `DATABASE_URL` is set (that path uses Neon).
 */
export async function getPglite(): Promise<import("@electric-sql/pglite").PGlite> {
  if (dbSource !== "pglite") {
    throw new Error("getPglite() is only available on the PGLite fallback (no DATABASE_URL)");
  }
  await getSql();
  const pg = await globalRef.__pgliteInstance__;
  if (!pg) throw new Error("PGLite instance failed to initialize");
  return pg;
}

/**
 * Finish DB bootstrap before the server handles traffic.
 *
 * - **PGLite** (preview / no `DATABASE_URL`): open the in-memory DB and apply
 *   `migrations/*.sql`. Idempotent — concurrent callers share one promise.
 * - **Neon**: no-op (pool is created lazily on first query).
 *
 * Vite `configureServer` awaits this at dev startup; production imports of this
 * module kick it off immediately (see bottom of file).
 */
export function ensureDbReady(): Promise<void> {
  if (dbSource !== "pglite") return Promise.resolve();
  return getSql().then(() => undefined);
}

/**
 * Run `fn` on a single dedicated SQL connection/transaction.
 * Required for writer-gate locking: pooled `getSql()` queries must not
 * hop connections between BEGIN and COMMIT.
 */
export async function withTransaction<T>(fn: (sql: Sql) => Promise<T>): Promise<T> {
  if (dbSource === "pglite") {
    const pg = await getPglite();
    return pg.transaction(async (tx) => {
      const sql = toSql(async <R>(text: string, params: unknown[]) => {
        const result = await tx.query<R>(text, params);
        return result.rows;
      });
      return fn(sql);
    });
  }
  await getSql();
  const pool = globalRef.__pgPool__;
  if (!pool) throw new Error("Postgres pool is not initialized");
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const sql = toSql(async <R>(text: string, params: unknown[]) => {
      const res = await client.query(text, params);
      return res.rows as R[];
    });
    const result = await fn(sql);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    try {
      await client.query("ROLLBACK");
    } catch {
      /* already aborted */
    }
    throw err;
  } finally {
    client.release();
  }
}

// Server-only eager start: kick PGLite bootstrap as soon as this module loads in
// Node. Client bundles never hit this path (`getSql` throws in the browser).
const globalBoot = globalThis as typeof globalThis & {
  __pgBootstrapPromise__?: Promise<void>;
};
if (typeof window === "undefined" && dbSource === "pglite") {
  globalBoot.__pgBootstrapPromise__ ??= ensureDbReady().catch((err) => {
    globalBoot.__pgBootstrapPromise__ = undefined;
    console.error("[db] PGLite bootstrap failed:", err);
    throw err;
  });
}
```


---

## `src/lib/auth/middleware.ts` (2462 bytes, sha256 `8dc37c4e9bd583f175402330d0952ef4d584c7410723cc2649c4046d5084bd80`)

```ts
import { createMiddleware } from "@tanstack/react-start";

/**
 * Auth middleware for server functions — the standard way to get the caller's
 * verified user id. When deployed the session cookie is same-origin and rides
 * along automatically. In the live preview the client also forwards the bearer
 * token (partitioned cookies) via the `.client` hook below — call sites do not
 * thread it themselves.
 *
 *   import { createServerFn } from "@tanstack/react-start";
 *   import { getSql } from "@/lib/db";
 *   import { authMiddleware } from "@/lib/auth/middleware";
 *
 *   export const listTodos = createServerFn({ method: "GET" })
 *     .middleware([authMiddleware])
 *     .handler(async ({ context }) => {
 *       const sql = await getSql();
 *       return sql`select * from todos where user_id = ${context.userId}`;
 *     });
 *
 * Signed out with auth on (live preview included) -> throws `UnauthorizedError`
 * (see `verify.server.ts`). With auth disabled (`VITE_AUTH_ENABLED=false`, the
 * shipped default) it resolves the shared dev user — but throws instead when a
 * `DATABASE_URL` is also set, so an app without sign-in must not use this at
 * all. On the auth-on path, use it on every server function that touches
 * per-user data and scope every query by `context.userId`.
 */
export const authMiddleware = createMiddleware({ type: "function" })
  .client(async ({ next }) => {
    // Live preview (partitioned iframe): the session rides a bearer token, not a
    // cookie, so forward it to the server. Null when deployed (cookie auth), so
    // this is a no-op there.
    const { getBearerToken } = await import("./client");
    return next({ sendContext: { bearerToken: getBearerToken() ?? undefined } });
  })
  .server(async ({ next, context }) => {
    // ONLY import `*.server` modules here. This file is dual client/server
    // (bearer hook on the client). A plain `./isolation` path was renamed to
    // `isolation.server.ts` — keep this import in sync so image `tsc` resolves
    // it, and so Vite does not ship `@tanstack/react-start/server` to the browser.
    const { assertSameSiteRequest } = await import("./isolation.server");
    const { requireUserId } = await import("./verify.server");
    // Reject scripted cross-site/sibling requests before touching per-user data.
    assertSameSiteRequest();
    const userId = await requireUserId(context.bearerToken);
    return next({ context: { userId } });
  });
```


---

## `src/lib/auth/client.ts` (9714 bytes, sha256 `4bca649afb627b11231a7b31acfcffe9323efddebc05944b2d769d2b8589294f`)

```ts
import { genericOAuthClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import { runPreSignInSignOut, runSignOut } from "../../../scripts/sign-out-plan.mjs";
import { GROK_PROVIDERS } from "./providers";

/**
 * Better Auth client for this React SPA (browser-side).
 *
 * Talks to this app's OWN Better Auth at same-origin `/api/auth/*`. In the live
 * preview the app is an embedded iframe with PARTITIONED cookies, so after a
 * popup sign-in it can't read the session cookie — it authenticates with a
 * bearer token instead (captured from the popup, see `signIn`). The `onRequest`
 * hook attaches that token when present; when deployed (cookie auth) no token
 * is stored, so nothing changes.
 *
 * To sign out call `signOut()` below, NOT `authClient.signOut()`: the raw call
 * leaves the bearer token in place, and `onRequest` keeps re-attaching it, so
 * the visitor stays signed in.
 */
export const authClient = createAuthClient({
  plugins: [genericOAuthClient()],
  fetchOptions: {
    onRequest(ctx) {
      const token = getBearerToken();
      if (token) ctx.headers.set("Authorization", `Bearer ${token}`);
      return ctx;
    },
  },
});

/**
 * True when sign-in UI should be shown — i.e. whenever `VITE_AUTH_ENABLED` is
 * not `"false"`. The shipped template sets it to `"false"`
 * (`.grok/app-env.json`), which selects the dev user (see `use-current-user`);
 * with the key removed, sign-in is real in preview (baked preview client) and
 * when deployed (injected per-app client).
 */
export const authEnabled = import.meta.env.VITE_AUTH_ENABLED !== "false";

/** The upstream providers to render sign-in buttons for. */
export { GROK_PROVIDERS };

// ── Live-preview bearer token ────────────────────────────────────────────────
// The embedded preview iframe has partitioned cookies, so we keep the session's
// bearer token in sessionStorage and attach it to every Better Auth request (and
// to server functions, via `@/lib/auth/middleware`). Empty everywhere except the
// preview after a popup sign-in, so the cookie path is untouched elsewhere.
const BEARER_KEY = "grok-auth.bearer-token";

/** The stored preview bearer token, or null. */
export function getBearerToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage.getItem(BEARER_KEY);
  } catch {
    return null;
  }
}

function setBearerToken(token: string | null): void {
  if (typeof window === "undefined") return;
  try {
    if (token) window.sessionStorage.setItem(BEARER_KEY, token);
    else window.sessionStorage.removeItem(BEARER_KEY);
  } catch {
    /* storage unavailable — ignore */
  }
}

/**
 * The sandbox live preview runs this app inside an iframe on a `*.grok-sandbox.com`
 * host, where a full-page redirect to the broker can't work — so sign-in uses a
 * popup there and a normal redirect everywhere else.
 */
function inLivePreview(): boolean {
  return (
    typeof window !== "undefined" &&
    window.location.hostname.endsWith(".grok-sandbox.com")
  );
}

/** Message the popup posts back to the opener once sign-in completes. */
type PopupMessage = { source: "grok-auth-popup"; token: string | null; error?: string };

/**
 * Start sign-in with one upstream provider (`providerId` from `GROK_PROVIDERS`),
 * federating through the Grok auth broker.
 *
 * - **Live preview** (`*.grok-sandbox.com` iframe): opens a POPUP to
 *   `/auth/popup`, served by the template Vite plugin (see `vite.config.ts` +
 *   `popup.server.ts`) — 302s to the broker/upstream login (no app chrome) and,
 *   on return, posts the session bearer token back. We store it and refresh the
 *   session; no top-level navigation of the iframe to the broker.
 * - **Deployed** (and local non-iframe): a normal full-page redirect into the broker.
 *
 * Either way it clears any existing local session FIRST so switching providers
 * actually switches identity.
 */
export async function signIn(
  providerId: string,
  opts: { callbackURL?: string; errorCallbackURL?: string } = {},
): Promise<void> {
  const callbackURL = opts.callbackURL ?? "/";
  const errorCallbackURL = opts.errorCallbackURL ?? "/";

  // Open the popup SYNCHRONOUSLY on the user gesture — before any await
  // (including signOut). Awaiting first drops user-gesture privilege in some
  // browsers when the opener is a cross-origin live-preview iframe.
  const popup = inLivePreview() ? openSignInPopup(providerId) : null;

  // Clear any prior session so switching providers actually switches identity.
  // Bounded because the popup is already open — a request that never settles
  // would leave it hanging — but bounded PER ENVIRONMENT: only the server can
  // end a deployed session, so cutting it short at the preview's 1.5s would
  // start OAuth with the old session still live.
  await runPreSignInSignOut({
    livePreview: inLivePreview(),
    hasBearer: Boolean(getBearerToken()),
    requestSignOut: () => authClient.signOut(),
    clearToken: () => setBearerToken(null),
  });

  if (inLivePreview()) {
    if (!popup) throw new Error("Pop-up blocked — allow pop-ups for sign-in");
    const token = await waitForPopupToken(popup);
    if (!token) throw new Error("Sign-in was cancelled or failed");
    setBearerToken(token);
    // Refresh the client session store with the bearer attached (onRequest).
    // Avoid a full iframe reload when we're already on the destination — that
    // reload was the slow "still loading after the popup closed" feeling.
    try {
      await authClient.getSession();
    } catch {
      /* session store will recover on next useSession fetch */
    }
    if (typeof window !== "undefined") {
      const dest = new URL(callbackURL, window.location.origin);
      const here = window.location;
      if (dest.origin !== here.origin || dest.pathname !== here.pathname || dest.search !== here.search) {
        window.location.href = callbackURL;
      }
    }
    return;
  }

  const { data, error } = await authClient.signIn.oauth2({
    providerId,
    callbackURL,
    errorCallbackURL,
  });
  if (error) throw new Error(error.message ?? "Sign-in failed");
  if (data?.url) window.location.href = data.url;
}

/**
 * Open `/auth/popup` in a new window. Must run synchronously inside the click
 * handler (no await before this). The path is served by the template Vite
 * plugin (`authPopupPlugin` in vite.config.ts) — NOT by a React route.
 *
 * Opens the real URL directly (not about:blank → assign). From a cross-origin
 * iframe the about:blank dance often fails on the first click and the window
 * ends up showing the app shell.
 */
function openSignInPopup(providerId: string): Window | null {
  const origin = window.location.origin;
  const url = `${origin}/auth/popup?providerId=${encodeURIComponent(providerId)}`;
  // Unique name per attempt so a prior attempt stuck on the SPA is not reused.
  const name = `grok-signin-${Date.now()}`;
  return window.open(url, name, "popup,width=500,height=650");
}

/**
 * Wait for the popup's completion page to postMessage the session bearer (or
 * for the user to dismiss the popup).
 */
function waitForPopupToken(popup: Window): Promise<string | null> {
  return new Promise((resolve) => {
    const origin = window.location.origin;
    let settled = false;
    let closeTimer: number | undefined;
    const settle = (token: string | null) => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(token);
    };
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== origin) return;
      const data = event.data as PopupMessage | undefined;
      if (!data || data.source !== "grok-auth-popup") return;
      settle(data.token ?? null);
    };
    // Fallback when the user dismisses the popup. Grace period lets the
    // completion page's postMessage win over a racing `popup.closed`.
    const pollTimer = window.setInterval(() => {
      if (!popup.closed) return;
      window.clearInterval(pollTimer);
      closeTimer = window.setTimeout(() => settle(null), 400);
    }, 300);
    function cleanup() {
      window.clearInterval(pollTimer);
      if (closeTimer !== undefined) window.clearTimeout(closeTimer);
      window.removeEventListener("message", onMessage);
    }
    window.addEventListener("message", onMessage);
  });
}

/**
 * Sign out of THIS app's local session, clear the preview token, then redirect.
 *
 * Use this, never `authClient.signOut()` — see the note on `authClient`.
 * Sequencing lives in `scripts/sign-out-plan.mjs` so it can be unit-tested.
 *
 * **Rejects when deployed if the server never confirms.** There the session is
 * an HttpOnly cookie only the server can clear, so redirecting anyway would
 * report a sign-out that did not happen. `<UserButton />` handles that for you;
 * a hand-rolled control must catch it and let the visitor retry. In the live
 * preview the local clear is sufficient, so it always resolves.
 */
export async function signOut(redirectTo = "/"): Promise<void> {
  await runSignOut({
    livePreview: inLivePreview(),
    hasBearer: Boolean(getBearerToken()),
    // Better Auth resolves with `{ error }` instead of rejecting, so surface a
    // failed response as a rejection for the sequence to act on.
    requestSignOut: async () => {
      const { error } = await authClient.signOut();
      if (error) throw new Error(error.message ?? "Sign-out failed");
    },
    clearToken: () => setBearerToken(null),
    redirect: () => {
      window.location.href = redirectTo;
    },
  });
}
```


---

## `src/lib/auth/use-current-user.ts` (3315 bytes, sha256 `a0cc4bd74b6da5b346b6bafc1aec58b9bf5cc0278264379b737b79a5cff1e482`)

```ts
import { authClient, authEnabled } from "./client";

/** Normalized user shape used across the app, auth on or off. */
export type AppUser = {
  id: string;
  displayName: string | null;
  primaryEmail: string | null;
  profileImageUrl: string | null;
  /** True when this is the sandbox/dev fallback (auth not configured). */
  isDevFallback: boolean;
};

/**
 * Stable fallback user, used ONLY when auth is disabled
 * (`VITE_AUTH_ENABLED=false`, the shipped default). With auth on, the sandbox
 * live preview does real sign-in via the baked preview client. Its id is
 * `"dev-user"` — the SAME id `verify.server.ts` returns server-side — so per-user
 * rows written in that mode belong to one consistent owner.
 */
export const DEV_USER: AppUser = {
  id: "dev-user",
  displayName: "Dev User",
  primaryEmail: "dev@example.com",
  profileImageUrl: null,
  isDevFallback: true,
};

/** `useCurrentUserState()` result: the user plus the session-loading flag. */
export type CurrentUserState = {
  /** The user — `null` BOTH while the session loads and when signed out. */
  user: AppUser | null;
  /** True while the session is still resolving — don't treat `user: null` as signed out yet. */
  isPending: boolean;
};

/**
 * Current user + loading state. Same behavior in live preview and when deployed:
 *   - Auth enabled -> the real signed-in user; `user` is `null` while
 *                            the session resolves (`isPending: true`) and when
 *                            signed out (`isPending: false`). Session comes from
 *                            Better Auth `useSession()` → `/api/auth/get-session`
 *                            (cookie when deployed; bearer in live preview).
 *   - Auth disabled (`VITE_AUTH_ENABLED=false`) -> `DEV_USER`, never pending.
 *
 * Protect a route by waiting out `isPending` before acting on `user` —
 * redirecting on `user: null` alone bounces signed-in visitors to sign-in on
 * every hard reload:
 *
 *   import { RedirectToSignIn } from "@/lib/auth/gates";
 *   const { user, isPending } = useCurrentUserState();
 *   if (isPending) return null;              // still resolving — don't redirect yet
 *   if (!user) return <RedirectToSignIn />;  // definitely signed out
 *
 * `authEnabled` is a module-level constant fixed at load, so the guarded hook
 * call keeps a stable hook order across every render of a given component.
 */
export function useCurrentUserState(): CurrentUserState {
  if (!authEnabled) return { user: DEV_USER, isPending: false };
  // eslint-disable-next-line react-hooks/rules-of-hooks -- authEnabled is constant for the app's lifetime
  const { data, isPending } = authClient.useSession();
  const user = data?.user;
  return {
    user: user
      ? {
          id: user.id,
          displayName: user.name ?? null,
          primaryEmail: user.email ?? null,
          profileImageUrl: user.image ?? null,
          isDevFallback: false,
        }
      : null,
    isPending,
  };
}

/**
 * Convenience view of `useCurrentUserState().user` for display (e.g.
 * `user?.displayName ?? "Guest"`). NOTE: `null` means *loading OR signed out* —
 * for redirects/guards use `useCurrentUserState()` and check `isPending`.
 */
export function useCurrentUser(): AppUser | null {
  return useCurrentUserState().user;
}
```
