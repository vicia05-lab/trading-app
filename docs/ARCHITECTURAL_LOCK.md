# Architectural lock — TypeScript kernel only

Decision date: 2026-09-13
Status: accepted

A parallel Python package (`vicia/engine/**`) was proposed as
`[PATCH v1.1.4] Architectural lock: sequencing, hashing, vintages, and access controls`.
It is **rejected**. It would split the mutation clock and break Golden H01.

Any future sequencing, hashing, vintage, fill, or access tightening is
implemented only in `src/kernel/` and `src/desk/`.

## Rejected split-brain

Do not add `vicia/`, a second sequencer, a second input hash, a float fill,
HMAC-secret vintages, an `ADMIN` role, or a time-gated Operator label view.

## Locked alignments

| Concern | Authority |
|---|---|
| Mutation clock | `writer_gate` + `event_seq` inside one writer transaction |
| Input hash | Domain `Trading App\|input\|2` plus manifest, snapshot, rule, engine, cost, margin, pin **hashes**. Golden H01 must match. |
| Canonical JSON | CJ1 — numbers are strings |
| Missing freeze | `NO_FREEZE`. Not `STAND_DOWN`. |
| Stand-down | Evaluator decision on a complete card |
| Fill | Decimal `modeledFill`, penalty `"0.000500"`, `quantizeHalfUp` to 12 places |
| Operator labels | Permanently redacted. Not a `window_end_seq` time gate. No `ADMIN` role. |
| Vintages | Append-only rows + content hashes. Replay is byte-verified, not HMAC. |

## Probes that must keep failing a Python fork

1. `inputHash` without the domain prefix ≠ H01.
2. `close * 1.0005` as IEEE float ≠ `modeledFill("123.456789")`.
3. Missing names at cutoff must grade `NO_FREEZE`, not `STAND_DOWN`.
4. Operator `results` payload has `research.restricted === true` and no `hit_rate`.
5. `event_log.event_seq` is contiguous; a Postgres `nextval` beside it is not the clock.
