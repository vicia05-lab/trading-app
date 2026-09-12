# Trading App

Paper-modeled AMC earnings research desk with an Alpaca paper/live venue for quotes and orders.

**Earnings book is paper-only.** Alpaca is a separate venue. Insert keys on `/keys`. Operator can trade; Reviewer cannot.

## Run

```bash
npm install
npm run typecheck
npm test
python3 trading_app_kernel_audit.py
npm run dev
```

Dev server binds `0.0.0.0:8080`. First visit: **Open desk and insert keys**, paste Alpaca paper key ID + secret, then use **Trade**.

Auth is on (Google, X, email). Preview OAuth often fails in an iframe — use the one-tap desk open or email.

## Layout

| Path | Role |
|---|---|
| `src/kernel/` | Pure hash / Decimal / AST kernel (authoritative math) |
| `src/desk/` | Writer, freeze/admission, queries, Alpaca client |
| `src/routes/` | Keys, Trade, Desk, Earnings, Predictions, Results, Admin |
| `migrations/` | Auth, desk schema, Alpaca credential tables |
| `python/trading_app_kernel.py` | Python reference kernel |
| `trading_app_kernel_audit.py` | Standalone golden + adversarial tests |

## Contracts another AI should attack

- Domain-separated SHA-256: `"Trading App\|input\|2"`
- CJ1 canonical JSON: numbers are **strings**
- `Decimal` ROUND_HALF_UP, modeled fill `constant_penalty 0.000500`
- Golden H01 input hash `bac8f1353582276f85608c618ad44f104f5480fea76d03ce0dbcad4955522726`
- Capacity: 3 slots / $15k / 2-per-event / $5k ticket
- `NO_FREEZE` ≠ `STAND_DOWN`; `IMPAIRED` ≠ `FLAT`
- Browser must not compute labels, fills, risk, or hashes
- Secrets: AES-256-GCM; never returned to the client
- Alpaca paper host `paper-api.alpaca.markets`; live is gated

See `AUDIT_FOR_AI.md` for the critique brief.
