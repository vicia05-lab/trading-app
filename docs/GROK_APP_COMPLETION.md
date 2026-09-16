# Grok GitHub application — repair boundary and acceptance record

## Project boundary

Only `vicia05-lab/trading-app` is in scope. Project ID: `grok-github-trading-app`.
The user's PC-hosted Trading App is a separate application. Do not copy source or
credentials between them, restart the PC app, use its data as evidence for this
repository, or treat similarly named older Grok repositories as this project.
This change does not authorize a deployment, database reset, order, or merge.
Keep the existing TypeScript kernel and architectural lock intact.

## Repairs in this change

- Restore the four missing authenticated server implementations: bulk paper-order
  cancellation, intelligent cycle, scheduler status, and scheduler enable/disable.
  Mutations retain the OPERATOR gate. Reading status never activates execution.
- Use Alpaca's real daily-bar VWAP, not a last-price substitute. Identify IEX quotes
  accurately. Parse bulk cancellation's per-order statuses; acceptance is not a
  confirmed cancellation and order submission is not a confirmed fill.
- Replace overlapping interval callbacks with serial completion-based scheduling.
  Stop removes the timer, and in-progress work is reported separately. Persist
  scheduler error codes rather than swallowing failures. New installs start
  disabled; an existing saved setting is preserved. The timer is process-local.
- Check the intelligent sleeve's account positions, open orders, slot count and
  gross notional before submissions. Reserve budget before each network call;
  stop the current run on an ambiguous/error response. This is a conservative
  preflight, NOT an atomic cross-process broker reservation.
- Fix the typed Earnings link, repair the npm lockfile, and restore install icons
  derived from the existing favicon (without replacing Grok platform chrome).
- Make template tests use isolated fixtures rather than requiring production
  auth to be off or migrations to be empty. Two documentation-only tests skip
  explicitly when Grok-injected skill files are absent; application tests do not.
- Add project identity, facade/authorization contract, data adapter, scheduler,
  and capacity regression coverage. CI propagates pipeline failures, installs the
  committed lockfile, and builds without migration or deployment.

## Release gates still requiring evidence

Do not treat passing unit tests or a rendered sign-in page as proof of trading.
Keep this change unmerged until the applicable release gates are resolved:

1. Durable cross-worker coordination, idempotent broker submission, and recovery
   of uncertain order outcomes. The process-local timer and account preflight
   cannot guarantee those properties across replicas or restarts.
2. Shared exposure reservations across the intelligent sleeve, the older auto
   sleeve and manual orders. The older auto sleeve still reads its own fill table.
   Its attempted-entry/exit counts and exit reconciliation need broker evidence.
3. Explicit scheduler lifecycle/startup integration and an authenticated UI flow
   for the new controls. The current Trade UI does not expose those new facades.
4. Authenticated end-to-end testing with isolated paper credentials: run, cancel,
   disable, restart, confirm broker receipts, reconcile fills and report results.
   No such credentials were read or used during this repair.

The recorded GitHub Actions artifacts identify the exact checked commit. They
are code/build/test evidence, not evidence of successful deployment or trading.


## 2026-09-16 order-readiness repair

See [the order-readiness verification record](GROK_APP_VERIFICATION_20260916.md) for the subsequent durable-intent, shared buy-admission, exit-reconciliation, Trade-controls and Windows-launcher changes. That record separates tested implementation from unverified real broker fills; earlier release gates must not be read as proof of production execution.
