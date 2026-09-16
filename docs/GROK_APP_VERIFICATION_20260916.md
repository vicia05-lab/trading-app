# Grok GitHub app: order-readiness repair, 2026-09-16

## Identity and scope

Repository: **vicia05-lab/trading-app**. Project ID: **grok-github-trading-app**.
Base commit: **2cf499b75f70bd6d86734e0ba46ff36c72d41f28**.
This repair is not the separate PC-hosted Trading App. No PC-app source, database,
configuration, credentials, running service, or deployment was changed.
Testing used a new isolated checkout; generated fixtures were not production data.

## Implemented

- Trade displays the repository identity, an explicit refresh action, authenticated
  scheduler controls, last-run results, errors, and auto-book entry/exit receipts.
  Reading the panel never enables or executes automation.
- Saving paper credentials refreshes the parent Trade desk immediately.
- Manual tickets retain a request ID on retry. Automatic requests use stable,
  account-scoped strategy IDs. Changed payloads cannot silently reuse an ID.
- The durable order intent is committed before the broker POST. A failed intent
  write prevents submission. A lost HTTP response or receipt write is reconciled
  by the original client order ID, not a second POST. Replayed receipts are not
  counted as newly submitted orders.
- Manual and automated buys share one database-serialized admission check:
  three symbols, USD 5,000 per ticket and USD 15,000 gross preflight capacity.
  Existing holdings, pending orders and unresolved local intents are considered.
  This is an application admission limit, not a guarantee against market-price
  changes or orders independently placed outside this application.
- Positive quantities/prices are validated; exact arithmetic sizes limit-buy
  reservations. Market buys use dollar notional rather than an unbounded
  share-quantity ticket. Broker quantities support nine fractional digits.
- Exit submission is not called CLOSED. Original entry and exit IDs are separate;
  pending exits are polled and only complete fill evidence records a confirmed exit.
  An uncertain close without a receipt is held for operator reconciliation, never
  blindly repeated. Pending exits retain capacity in the auto book.
- HTTP broker calls have a bounded timeout. LIVE routing remains disabled.
- The Node/Vite launcher works without relying on Windows .cmd executable lookup.
- The auth check requires an explicit target and the Grok service identity before
  comparing flags; it no longer implicitly probes an unrelated localhost app.

## Observed verification in the isolated checkout

| Check | Result |
| --- | --- |
| Project identity | Passed |
| TypeScript typecheck | Passed |
| Application tests | 214 passed, 0 failed |
| Script tests | 205 passed, 0 failed, 2 skipped |
| Portable Node production build | Passed on Windows |
| Real SQL + actual broker adapter with fake broker | Passed, including concurrent admission and lost-response cases |
| Local interactive browser verification | Not passed: browser launch failed; no click-through success claimed |
| Real Alpaca order/fill | Not performed; no production orders were placed by this verification |

The two skipped script checks require Grok-injected reference documents that are
not in this GitHub repository. The broker integration harness uses ephemeral
PGlite and replaces all broker traffic; it does not read actual broker credentials.
GitHub CI and deployment results must be checked separately against the final SHA.

## Activation and remaining evidence

Use a dedicated Alpaca PAPER account for this app, separate from the PC app.
Do not copy the PC app's keys or state. New API keys for a shared account do not
isolate its holdings or orders. This pass did not confirm whether the deployed
credential singleton has been configured, and it did not change its credentials.

Before declaring unattended operation verified, complete an authenticated Trade
workflow using this app's own paper account: enable/disable, submit one deliberate
small paper ticket, observe the broker receipt and fill, then confirm the exit
receipt and fill. A healthy web server is not proof that this workflow completed.
Uncertain legacy orders or an unknown close outcome require reconciliation.
No predictive accuracy, profitability, or learning-performance claim is made here.
