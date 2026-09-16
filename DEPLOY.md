# 24/7 paper desk

The app must stay as one Node process. The sleeve ticks every 5 minutes inside that process.
Market orders still require an open Alpaca clock and paper keys.

## Grok preview

https://forge-spring-delta-vivid.grok.me

Rebuild from main after pull. Sign in as operator. Paste paper keys on /trade.
Scheduler defaults ON. Disable on /trade if you want click-only.

Preview is not a guaranteed always-on worker. If the box sleeps, ticks stop.

## Always-on host

Need: Node 22, persistent disk or Postgres, HTTPS.

```
npm ci
npm run build
PORT=8080 npm run preview -- --host 0.0.0.0 --port 8080
