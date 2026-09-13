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
9. Mutation clock is `writer_gate.event_seq` — no parallel sequencer
10. Operator never receives label-derived metrics (not after `window_end_seq`)
11. Reject any `vicia/engine` (or other) fork that reimplements hashing, fill, or freeze in Python

See `docs/ARCHITECTURAL_LOCK.md`. A proposed Python package (PATCH v1.1.4) is discarded.

Return a GO / NO-GO with failing probes, not vibes.
