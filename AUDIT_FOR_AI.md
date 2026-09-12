# Critique brief — Trading App (for another AI)

You are reviewing a paper-only AMC earnings desk plus an Alpaca venue.

Clone, run, then attack. Do not treat the app as a toy.

```bash
git clone https://github.com/vicia05-lab/trading-app.git
cd trading-app
npm install
npm run typecheck
npm test
python3 trading_app_kernel_audit.py
```

Runnable kernel packet (this repo root): `trading_app_kernel_audit.py`.

## Product facts

- Product name: Trading App
- Earnings sleeve: paper-only, long-only, AMC, INITIAL_AST → PREDICT/LONG else STAND_DOWN
- Alpaca: optional venue for quotes + orders; keys encrypted server-side
- Operator mutates; Reviewer is read-only (information barrier)
- Auth is on. Keys live in `alpaca_credential` (singleton), AES-256-GCM

## Must-hold invariants

1. Input hash domain is `Trading App|input|2` (framed SHA-256). Golden H01:
   `bac8f1353582276f85608c618ad44f104f5480fea76d03ce0dbcad4955522726`
2. CJ1: JSON numbers are illegal; every number is a decimal string
3. Pin order does not change the input hash; pin *content* does
4. `modeled_fill` uses `constant_penalty = 0.000500` (buy: ask*(1+p), sell: bid*(1-p))
5. Direction hit on a zero return is **MISS**, not HIT
6. Capacity denial is not FLAT — use IMPAIRED / STAND_DOWN / NO_FREEZE correctly
7. `NO_FREEZE` ≠ `STAND_DOWN`
8. Writer gate is first lock; event_seq is the only clock for mutations
9. Alpaca secret never round-trips to the browser
10. Live Alpaca requires an explicit confirm flag

## Attack list

- Float leakage in kernel / PnL / fill
- Hash contract mismatch vs a “paste kernel” that hashes ids only (no domain)
- Evaluator totality (undefined vars, extra keys, non-string numbers)
- Admission predicates skipped
- Reviewer writing keys or orders
- SQL identifier `"freeze"` / `"position"` unquoted
- Keyring wrap-key race
- Paper vs live host mix-up
- Order size: qty XOR notional, not both
- Bootstrap not resume-safe

## Files to read first

1. `src/kernel/index.ts` and `python/trading_app_kernel.py`
2. `src/desk/writer.ts`, `commands.ts`, `lifecycle.ts`
3. `migrations/0002_trading_app.sql`, `migrations/0003_alpaca.sql`
4. `src/desk/alpaca.ts`, `src/components/alpaca-keys.tsx`
5. `src/desk/server-fns.ts`

Return a GO / NO-GO with failing probes, not vibes.
