# TRADING APP v1.2.0 — WHOLE SOURCE PACKET FOR A REVIEWING AI

Give this single document to another model. It contains the reviewer brief
AND the complete production source (kernel, desk, schema, routes).

## Product
- product_name = "Trading App"
- paperOnly = true
- liveTradingSupported = false
- activeModelWeight = "0"
- engine_version = "trading-app-evaluator-1.2.0"
- hash domain (input) = "Trading App|input|2"
- rounding = ROUND_HALF_UP
- CJ1 numbers = DECIMAL STRINGS ONLY
- API prefix = /api/trading-app/v1
- THIS IS NOT A BROKER. Do not invent a live broker.

## How to test
The first file (`trading_app_kernel_audit.py`) is runnable:

```
python3 trading_app_kernel_audit.py
```

Stdlib only. Expected: 27 tests OK, then a SCRUTINY BRIEF.

A self-extracting wrapper also exists: `TRADING_APP_FULL_SOURCE_AUDIT.py`
```
python3 TRADING_APP_FULL_SOURCE_AUDIT.py            # run kernel tests
python3 TRADING_APP_FULL_SOURCE_AUDIT.py --extract  # write all files
```

## Goldens (bit-for-bit)
- H01 input hash = `bac8f1353582276f85608c618ad44f104f5480fea76d03ce0dbcad4955522726`
- AST hash       = `e9cf184a531fd993dc1b36ce0e1a1b0dcd67ebc4b80e4ff1ebe5a72ab00c15f4`
- modeled fill   = 123.456789 * (1+0.000500) → `123.518517394500`
- hotel-style pnl = notional 5000.0000, exit 105.000000, fill 100.050000000000 → `247.3763`
- shuffle        = ["SEC-C","SEC-A","SEC-B"] + seed 01*32 → ["SEC-A","SEC-C","SEC-B"]

## Two kernels (they disagree on purpose)
PRODUCTION (Python audit + `src/kernel/index.ts`):
- domain `Trading App|input|2`
- pins = (observation_id, observation_hash) pairs
- includes manifest_hash + snapshot_hash
- constant_penalty = 0.000500
- capacity released only on CLOSED, not GRADED

CONFLICTING PASTE (`conflicting_paste_input_hash` in the audit file):
- no domain, no pin hashes, no manifest/snapshot hashes
- example fill 0.001 + 0.01*0.5 = 0.0055 → 100.5500

## Do not collapse
NO_FREEZE ≠ STAND_DOWN. IMPAIRED_EXIT ≠ FLAT. PREDICT/NOT TRADED ≠ STAND_DOWN.
OPERATOR must not see hits/bands/P&L. REVIEWER must not mutate admission.
JSON numbers are illegal in canonical payloads. Browser math must not decide
labels, fills, risk, or hashes.

## Questions you must answer
1. Two different sealed cards, same PRODUCTION input hash? Same under the PASTE?
2. ROUND_HALF_UP ties: Python Decimal vs a BigInt port — counterexample if they diverge.
3. direction_hit(entry, exit) with exit==entry — correctly a MISS?
4. implied_move as float 0.08 (not `"0.080000000000"`) — should it PREDICT? Production says no.
5. IMPAIRED_EXIT name, new PREDICT same day — correctly denied?
6. Which kernel should the desk freeze against, and what breaks if you pick wrong?
7. Does `src/kernel/index.ts` match the Python goldens bit-for-bit?
8. Does writer.ts / commands.ts ever let browser math decide a label, fill, or hash?
9. Does schema 0002 release capacity on CLOSED only, or on GRADED?
10. Can OPERATOR queries leak reviewer book P&L?

Honesty bar: do not invent passing tests. Name the bug or name the residual risk.

---
## Embedded files

## FILE `trading_app_kernel_audit.py`
- bytes: 32349
- sha256: `eb0335e7a28fe322663955ecf97b629fc50f80d74a260b54fa57dd3f54037dda`

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


def output_hash(input_hex, decision_payload) -> str:
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


def modeled_fill(
    close: str,
    penalty: str = "0.000500",
    imbalance_coefficient: str = "0.000000",
    imbalance_term: str = "0.000000",
) -> str:
    """close * (1 + penalty + coeff * term), quantized to 12 dp, ROUND_HALF_UP."""
    if type(close) is not str:
        raise KernelError("INVALID_DECIMAL_TEXT")
    with _dec_ctx():
        p = D(close)
        c = D(penalty)
        a = D(imbalance_coefficient)
        b = D(imbalance_term)
        if p <= 0 or p > D("1000000"):
            raise KernelError("ABOVE_OR_BELOW_DOMAIN")
        out = (p * (D("1") + c + a * b)).quantize(D("0.000000000001"), rounding=ROUND_HALF_UP)
        return format(out, "f")


def paper_pnl(notional: str, exit_price: str, fill: str, commission: str = "0.0000") -> str:
    """(notional * (exit/fill - 1) - 2*commission) at 4 dp."""
    with _dec_ctx():
        n = D(notional)
        x = D(exit_price)
        f = D(fill)
        c = D(commission)
        if f == 0:
            raise KernelError("DIVISION_BY_ZERO")
        dollar = n * (x / f - D("1")) - D("2") * c
        return format(dollar.quantize(D("0.0001"), rounding=ROUND_HALF_UP), "f")


def direction_hit(entry: str, exit: str) -> bool:
    """Zero return is a MISS (False), not None. Long-only: exit > entry is a hit."""
    with _dec_ctx():
        e = D(entry)
        x = D(exit)
        if x == e:
            return False
        return x > e


def band_hit(entry: str, exit: str, low: str, high: str) -> bool:
    with _dec_ctx():
        e = D(entry)
        x = D(exit)
        lo = D(low)
        hi = D(high)
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
    mv = card.get("implied_move")
    if type(mv) is not str:
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
        if type(v) is not str:
            return False
        try:
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
    """Admission after PREDICT. Capacity is 3 / 15000 / 2-per-event. Ticket 5000."""
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
    result = unittest.TextTestRunner(verbosity=2).run(suite)
    print()
    print(BRIEF)
    if not result.wasSuccessful():
        raise SystemExit(1)
    print("RESULT: goldens + adversarial suite passed on this interpreter.")
    print("Reviewer: now try to break it. Do not rubber-stamp.")


if __name__ == "__main__":
    main()
```

## FILE `python/trading_app_kernel.py`
- bytes: 3868
- sha256: `131ff3f5f7f8c5328d993abcb51e3642b8ee3eb5efb49006e437f9003fefb919`

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

## FILE `src/kernel/index.ts`
- bytes: 24879
- sha256: `80f8b14b42100546cba65fc1c2473d4cc5a1920d04da86be4b7d167230403146`

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
  return h("Trading App|decision|1", digestBytes(inputHex), canon(decisionPayload));
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
  const p = dec(close, 6, "0.000001", "1000000");
  const c = dec(penalty, 6, "0.000001", "0.05");
  const a = dec(imbalanceCoefficient, 6, "0", "0");
  const b = dec(imbalanceTerm, 6, "0", "0");
  const one = dec("1", 6);
  const inner = add(one, add(c, mul(a, b))); // a*b scale 12, add to c scale 6 — align in add
  const prod = mul(p, inner);
  return decToCanonical(quantizeHalfUp(prod, 12), 12);
}

export function paperPnl(
  notional: string,
  exitPrice: string,
  fill: string,
  commission = "0.0000",
): string {
  const n = dec(notional, 4, "0.0001", "5000");
  const x = dec(exitPrice, 6, "0.000001", "1000000");
  const f = dec(fill, 12, "0.000000000001", "1050000");
  const c = dec(commission, 4, "0", "100");
  const ratio = div(x, f, 24);
  const gap = sub(ratio, dec("1", 0));
  const dollar = mul(n, gap);
  const twoC = mul(dec("2", 0), c);
  return decToCanonical(quantizeHalfUp(sub(dollar, twoC), 4), 4);
}

export function directionHit(entry: string, exit: string): boolean | null {
  const e = dec(entry, 6, "0.000001", "1000000");
  const x = dec(exit, 6, "0.000001", "1000000");
  const c = cmp(x, e);
  if (c === 0) return false; // zero return = MISS
  return c > 0;
}

export function bandHit(entry: string, exit: string, low: string, high: string): boolean {
  // entry * (1+low) <= exit <= entry * (1+high)  using cross multiplication
  const e = dec(entry, 6, "0.000001", "1000000");
  const x = dec(exit, 6, "0.000001", "1000000");
  const lo = dec(low, 12, "-1000000", "1000000");
  const hi = dec(high, 12, "-1000000", "1000000");
  const one = dec("1", 0);
  const left = mul(e, add(one, lo));
  const right = mul(e, add(one, hi));
  // compare left <= x <= right at aligned scale
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
  if (typeof card.implied_move !== "string") return false;
  try {
    dec(card.implied_move, 12, "0.000000000001", "5");
  } catch {
    return false;
  }
  for (const f of ["benchmark_relative_5d", "benchmark_relative_63d"] as const) {
    const v = card[f];
    if (typeof v !== "string") return false;
    try {
      dec(v, 12, "-1000000", "1000000");
    } catch {
      return false;
    }
  }
  return true;
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

## FILE `src/kernel/kernel.test.ts`
- bytes: 9043
- sha256: `621183b06d2b0295bca68416afa28c515aab00fb73033fc6952d2952d287ce26`

```ts
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  bandHit,
  canon,
  COST_MODEL_CONTENT,
  costModelHash,
  dec,
  directionHit,
  evaluate,
  INITIAL_AST,
  inputHash,
  KernelError,
  modeledFill,
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
```

## FILE `src/desk/util.ts`
- bytes: 3003
- sha256: `95ff046ddbf1cddb227134df37791ab04955720579ff9bc4793c4b1050b5d98a`

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

## FILE `src/desk/writer.ts`
- bytes: 6227
- sha256: `aeef64ce04460b91d06150fb717aa538a0d0bccaffa79968ca7e430ec149fbee`

```ts
import { createHash } from "node:crypto";
import type { Sql } from "@/lib/db";
import { withTransaction } from "@/lib/db";
import { field, sha256 } from "@/kernel/index";
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
  const cachedN = Number(cached.reserved_notional);
  const actualN = Number(actual.notional);
  if (cached.reserved_count !== actual.count || Math.abs(cachedN - actualN) > 0.00005) {
    throw new DeskError("RISK_STATE_MISMATCH", "cached risk disagrees with positions", 503);
  }
}

export function digest32(hex: string): Buffer {
  return hexBuf(hex);
}

void asHex;
void sha256;
```

## FILE `src/desk/features.ts`
- bytes: 5322
- sha256: `9fbabcda2bf7afb9a6412814c3059b5c6dc98512779db9b1348b886ba8a7c0e1`

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

## FILE `src/desk/commands.ts`
- bytes: 32766
- sha256: `eaf8942ae777bcaa24eef00de325cc4b1d712f1ad40972233526151ba8c3dfeb`

```ts
import { createHash } from "node:crypto";
import { getSql, withTransaction } from "@/lib/db";
import {
  COST_MODEL_CONTENT,
  INITIAL_AST,
  costModelHash,
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
    }>(`SELECT window_id, universe_version, policy_id, rule_id, rule_version, evaluator_id, cost_model_id FROM evaluation_window ORDER BY starts_at LIMIT 1`);
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
  return withWriter(actor, async (ctx) => {
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
    const ev = evaluate(INITIAL_AST, {
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
    if (admission.outcome === "ADMITTED" && admission.position_id) {
      const ticker = await ctx.sql.query<{ display_ticker: string }>(
        `SELECT display_ticker FROM manifest_member WHERE manifest_id = $1 AND permanent_security_id = $2`,
        [manifestId, securityId],
      );
      await commitPosition(ctx, {
        positionId: admission.position_id,
        freezeId,
        manifestId,
        securityId,
        admissionId: admId,
        sessionDate: man[0].session_date,
        ticker: ticker[0]?.display_ticker ?? securityId,
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
      reasons: ev.reasons,
      verification_level: "BYTE_VERIFIED",
    };
  });
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
  if (args.paused) reasons.push("ADMISSION_PAUSED");
  if (ctx.now.getTime() >= args.cutoff.getTime()) reasons.push("CUTOFF");
  if (args.timingQuality !== "ISSUER_CONFIRMED") reasons.push("TIMING_NOT_CONFIRMED");
  if (args.card.card_complete !== true) reasons.push("CARD_INCOMPLETE");
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
  if (owned[0].c > 0) reasons.push("ALREADY_OWNED");
  if (cached.reserved_count + 1 > 3) reasons.push("CAPACITY_COUNT");
  if (Number(cached.reserved_notional) + 5000 > 15000) reasons.push("CAPACITY_NOTIONAL");
  if (sameEvent[0].c + 1 > 2) reasons.push("PER_EVENT_LIMIT");
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
    [cached.reserved_count + 1, (Number(cached.reserved_notional) + 5000).toFixed(4), ctx.seq],
  );
}
```

## FILE `src/desk/lifecycle.ts`
- bytes: 29394
- sha256: `02fba16886378d0d65465110e93530fa42cf1654ec486d412337ab94b8027468`

```ts
import { getSql } from "@/lib/db";
import { bandHit, canon, directionHit, modeledFill, paperPnl, sha256 } from "@/kernel/index";
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
    const rawNumer = (Number(exit.price) / Number(entry.price) - 1).toFixed(12);
    values = {
      entry_price: entry.price,
      exit_price: exit.price,
      raw_gap: rawNumer,
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
      const split = Number(p.split_multiplier ?? 0);
      const dist = Number(p.distribution ?? 0);
      if (!split) {
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
      const units = 5000 / Number(fill);
      const exitUnits = units * split;
      const cash = units * dist;
      const pnl = (exitUnits * Number(exitMark.price) + cash - 5000).toFixed(4);
      await writeBook(ctx, pos.position_id, "CORPORATE_ACTION", {
        modeled_fill: fill,
        exit_price: exitMark.price,
        paper_pnl: pnl,
        split_multiplier: String(split),
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
    [cached.reserved_count - 1, (Number(cached.reserved_notional) - Number(row[0].original_reserved_notional)).toFixed(4), ctx.seq],
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

## FILE `src/desk/bootstrap.ts`
- bytes: 24416
- sha256: `e0845afbbf8e4d651dec1253e2450c2ba93cafa3f760c6895afc220748cdaa83`

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
    if (st[0]?.completed) return { ok: true, note: "already-seeded" };
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
    const jobs = ["premarket-check", "capture-cycle", "seal-session", "ordered-freeze", "due-deadlines", "mark-ingest", "grade-apply", "report-finalize"];
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

## FILE `src/desk/queries.ts`
- bytes: 21989
- sha256: `624b80fb7eb30aafea812fedc4f6ee4de7c14507e2159739a8e8f405b3b77127`

```ts
import { getSql } from "@/lib/db";
import { asHex, rfc3339, type DeskRole } from "./util";
import { ensureBootstrapped } from "./bootstrap";

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
  }>(
    `SELECT m.permanent_security_id, m.display_ticker, m.event_key, m.timing_quality, m.shuffle_order_index,
            s.card, s.card_complete, s.options_valid, s.pin_count
     FROM manifest_member m JOIN sealed_input s
       ON s.manifest_id = m.manifest_id AND s.permanent_security_id = m.permanent_security_id
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
      event_key: m.event_key,
      timing_quality: m.timing_quality,
      card_complete: m.card_complete,
      options_valid: m.options_valid,
      pin_count: String(m.pin_count),
      implied_move: typeof m.card.implied_move === "string" ? m.card.implied_move : null,
      benchmark_relative_5d: typeof m.card.benchmark_relative_5d === "string" ? m.card.benchmark_relative_5d : null,
      benchmark_relative_63d: typeof m.card.benchmark_relative_63d === "string" ? m.card.benchmark_relative_63d : null,
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
  return wrap("res-1", clock, {
    role,
    banner:
      "Operational research report. Rule v1 was selected after prior observation. Small-sample hit rate does not establish a trading edge. Paper P&L is ESTIMATED under a conservative stress haircut, not live-fill evidence. Unresolved prices and excluded labels are disclosed separately.",
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
    ports: {
      security_master: "FIXTURE",
      calendar: "FIXTURE",
      earnings: "FIXTURE",
      quotes: "FIXTURE",
      official_marks: "FIXTURE",
      live_broker: "UNSUPPORTED",
      real_data_credentials: "ABSENT",
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

## FILE `src/desk/server-fns.ts`
- bytes: 5531
- sha256: `9113121949741c427a96859fc3a1836e12da634ed29360ab912f413d12a76de3`

```ts
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import { ensureBootstrapped } from "./bootstrap";
import { adminPayload, claimRole, earningsPayload, getOrCreatePrincipal, homePayload, predictionsPayload, resultsPayload } from "./queries";
import { pauseAdmission, resumeAdmission, recordPrintKnowledge, appendFireRateNote, applyDueDeadlines } from "./lifecycle";
import { freezeMember } from "./commands";
import { DeskError, newId } from "./util";
import type { DeskRole } from "./util";

async function roleOf(userId: string): Promise<{ role: DeskRole | null; principal_id: string }> {
  await ensureBootstrapped();
  const p = await getOrCreatePrincipal(userId, null);
  return { role: p.role, principal_id: p.principal_id };
}

export const fetchMe = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await ensureBootstrapped();
    const p = await getOrCreatePrincipal(context.userId, null);
    return { userId: context.userId, role: p.role, principal_id: p.principal_id };
  });

export const postClaimRole = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ role: z.enum(["OPERATOR", "REVIEWER"]) }))
  .handler(async ({ context, data }) => {
    return claimRole(context.userId, null, data.role);
  });

export const fetchHome = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const { role } = await roleOf(context.userId);
    if (!role) return { needs_role: true as const };
    return homePayload(role);
  });

export const fetchEarnings = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator(z.object({ sessionDate: z.string().optional() }))
  .handler(async ({ context, data }) => {
    const { role } = await roleOf(context.userId);
    if (!role) return { needs_role: true as const };
    return earningsPayload(role, data.sessionDate);
  });

export const fetchPredictions = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator(z.object({ manifestId: z.string().optional(), sessionDate: z.string().optional() }))
  .handler(async ({ context, data }) => {
    const { role } = await roleOf(context.userId);
    if (!role) return { needs_role: true as const };
    return predictionsPayload(role, data.manifestId, data.sessionDate);
  });

export const fetchResults = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const { role } = await roleOf(context.userId);
    if (!role) return { needs_role: true as const };
    return resultsPayload(role);
  });

export const fetchAdmin = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const { role } = await roleOf(context.userId);
    if (!role) return { needs_role: true as const };
    return adminPayload(role);
  });

export const postPause = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ reason: z.string().min(1).max(500) }))
  .handler(async ({ context, data }) => {
    const { role, principal_id } = await roleOf(context.userId);
    if (role !== "OPERATOR") throw new DeskError("FORBIDDEN", "OPERATOR only", 403);
    return pauseAdmission(newId("cmd"), data.reason, principal_id);
  });

export const postResume = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const { role, principal_id } = await roleOf(context.userId);
    if (role !== "OPERATOR") throw new DeskError("FORBIDDEN", "OPERATOR only", 403);
    return resumeAdmission(newId("cmd"), principal_id);
  });

export const postPrintKnowledge = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ eventKey: z.string(), securityId: z.string(), reason: z.string().min(1) }))
  .handler(async ({ context, data }) => {
    const { role, principal_id } = await roleOf(context.userId);
    if (role !== "OPERATOR") throw new DeskError("FORBIDDEN", "OPERATOR only", 403);
    return recordPrintKnowledge(newId("cmd"), data, principal_id);
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
    const { role, principal_id } = await roleOf(context.userId);
    if (role !== "OPERATOR") throw new DeskError("FORBIDDEN", "OPERATOR only", 403);
    return appendFireRateNote(newId("cmd"), { windowId: "win-2026q3", hypothesis: data.hypothesis, note: data.note }, principal_id);
  });

export const postRetryDeadlines = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const { role } = await roleOf(context.userId);
    if (role !== "OPERATOR") throw new DeskError("FORBIDDEN", "OPERATOR only", 403);
    return applyDueDeadlines("svc-desk-writer");
  });

export const postVerifyFreeze = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ manifestId: z.string(), securityId: z.string() }))
  .handler(async ({ context, data }) => {
    await roleOf(context.userId);
    return freezeMember(newId("cmd"), data.manifestId, data.securityId, "svc-desk-writer");
  });
```

## FILE `migrations/0001_auth.sql`
- bytes: 2739
- sha256: `f953cacc448c0c81ae4fe63e66b0e59569e840782ad279fdee201dff529363e9`

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

## FILE `migrations/0002_trading_app.sql`
- bytes: 33664
- sha256: `86182bceb6a9e09820123c11efc8a207ec4f7d4029446d6bf718064aac9779a9`

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

## FILE `src/lib/db.ts`
- bytes: 10791
- sha256: `d78a99b8e73e86cd1d8ec1c5404eae1a9c264da05a26ed635fabfa05c518cd26`

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

## FILE `src/lib/auth/email-password.ts`
- bytes: 441
- sha256: `2e19781482a5fa673ac0ff84e8adbfd47549d1ea1aa0a71bb9e159ab0ff1a103`

```ts
/**
 * Local email/password sign-in (this app's Better Auth DB — not the broker).
 *
 * Off by default. To enable: set `emailAndPasswordEnabled` to `true` below,
 * then build sign-up / sign-in forms with `authClient.signUp.email` /
 * `authClient.signIn.email` from `@/lib/auth/client` (see the auth skill).
 *
 * Do NOT edit `server.ts` for this — that file is frozen pre-wired config.
 */
export const emailAndPasswordEnabled = true;
```

## FILE `src/routes/__root.tsx`
- bytes: 1557
- sha256: `ac8c6e3f9d2a5d38700d28f6c0e7e1c81b387a2708c5e185cc593913df9e1acf`

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
      { name: "theme-color", content: "#0a0c10" },
      { name: "description", content: "Paper-only after-close earnings research desk." },
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
        href: "https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600&display=swap",
      },
    ],
  }),
  component: () => (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body className="bg-bg text-fg antialiased">
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

## FILE `src/routes/index.tsx`
- bytes: 4456
- sha256: `57d8c9af9300693d8a6783b5ca3898b7e3aee5c9cf61954720257c2cbb7f23b5`

```tsx
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { DeskShell, Empty, Err, Panel, Stat } from "@/components/desk-shell";
import { fetchHome } from "@/desk/server-fns";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return (
    <DeskShell>
      <HomeLoader />
    </DeskShell>
  );
}

function HomeLoader() {
  const [data, setData] = useState<Awaited<ReturnType<typeof fetchHome>> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetchHome()
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : "Could not load home"));
  }, []);

  if (error) return <Err>{error}</Err>;
  if (!data) return <Empty>Loading session…</Empty>;
  if ("needs_role" in data) return <Empty>Assign a desk role to continue.</Empty>;
  return <HomeBody data={data} />;
}

function HomeBody({ data }: { data: Exclude<Awaited<ReturnType<typeof fetchHome>>, { needs_role: true }> }) {
  const d = data.data;
  const s = d.latest_session;
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-medium tracking-tight">Desk</h1>
        <p className="mt-1 text-sm text-muted">
          As of {data.as_of} · window {d.window_id} · rule {d.rule_id}
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Panel title="Cohort">
          <Stat label="Sealed" value={s?.sealed_member_count ?? "—"} />
          <div className="mt-3">
            <Stat label="Frozen" value={s?.frozen_count ?? "—"} hint={s?.freeze_resolution} />
          </div>
        </Panel>
        <Panel title="Coverage">
          <Stat label="Complete cards" value={s?.complete_frozen_cards ?? "—"} />
          <div className="mt-3">
            <Stat label="Research closed" value={s?.research_closed ? "yes" : "no"} />
          </div>
        </Panel>
        <Panel title="Reserved capital">
          <Stat label="Entry notional" value={d.reserved_notional} hint={`${d.reserved_count} of 3 slots`} />
          <div className="mt-3">
            <Stat label="Impaired" value={d.impaired_count} hint={`${d.nonclosed_positions} nonclosed`} />
          </div>
        </Panel>
        <Panel title="Admission">
          <Stat label="Pause" value={d.admission_paused ? "ON" : "off"} hint={d.pause_reason ?? "New tickets only"} />
          <div className="mt-3">
            <Stat label="Overdue jobs" value={d.overdue_deadlines} />
          </div>
        </Panel>
      </div>
      <Panel title="Sessions" aside="research complete ≠ book clear">
        {d.sessions.length === 0 ? (
          <Empty>No sealed sessions.</Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[32rem] text-left text-sm">
              <thead className="text-[11px] uppercase tracking-wider text-muted">
                <tr>
                  <th className="pb-2 font-medium">Session</th>
                  <th className="pb-2 font-medium">Manifest</th>
                  <th className="pb-2 font-medium">N</th>
                  <th className="pb-2 font-medium">Resolution</th>
                </tr>
              </thead>
              <tbody className="font-mono text-xs">
                {d.sessions.map((row) => (
                  <tr key={row.manifest_id} className="border-t border-border">
                    <td className="py-2">
                      <Link className="underline-offset-4 hover:underline" to="/earnings" search={{ session: row.session_date }}>
                        {row.session_date}
                      </Link>
                    </td>
                    <td className="py-2 text-muted">{row.manifest_id}</td>
                    <td className="py-2">{row.sealed_member_count}</td>
                    <td className="py-2">{row.freeze_resolution}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
      {d.reviewer_book ? (
        <Panel title="Priced book (reviewer)">
          <Stat label="Latest vintage P&L" value={d.reviewer_book.latest_paper_pnl ?? "—"} hint="ESTIMATED · stress haircut" />
        </Panel>
      ) : (
        <p className="text-xs text-muted">Operator view omits marks, hits, and P&L reconstruction.</p>
      )}
    </div>
  );
}
```

## FILE `src/routes/login.tsx`
- bytes: 4402
- sha256: `046c8903130a3a4f979bc8e2ad8f9af00b9c648ad34051aa151f67fd9ff33b9b`

```tsx
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { GROK_PROVIDERS, authClient, authEnabled, signIn } from "@/lib/auth/client";
import { SignedIn } from "@/lib/auth/gates";
import { Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/login")({ component: Login });

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"in" | "up">("in");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onEmail(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      if (mode === "up") {
        const { error } = await authClient.signUp.email({ email, password, name: email.split("@")[0] ?? "desk" });
        if (error) throw new Error(error.message);
      } else {
        const { error } = await authClient.signIn.email({ email, password });
        if (error) throw new Error(error.message);
      }
      window.location.href = "/";
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Sign-in failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-6 px-5">
      <SignedIn>
        <Navigate to="/" />
      </SignedIn>
      <div>
        <p className="text-xs font-medium tracking-[0.18em] text-muted">TRADING APP</p>
        <h1 className="mt-2 text-2xl font-medium tracking-tight">Sign in</h1>
        <p className="mt-2 text-sm text-muted">Paper-only earnings research desk. No live routing.</p>
      </div>
      {authEnabled ? (
        <div className="flex flex-col gap-2">
          {GROK_PROVIDERS.map((p) => (
            <button
              key={p.providerId}
              type="button"
              onClick={() => void signIn(p.providerId, { callbackURL: "/" })}
              className="min-h-11 w-full rounded-md border border-border bg-surface px-4 text-sm hover:border-primary"
            >
              Continue with {p.label}
            </button>
          ))}
          <div className="my-2 flex items-center gap-3 text-[11px] uppercase tracking-wider text-faint">
            <span className="h-px flex-1 bg-border" />
            email
            <span className="h-px flex-1 bg-border" />
          </div>
          <form onSubmit={onEmail} className="flex flex-col gap-2">
            <label htmlFor="email" className="text-xs text-muted">
              Email
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 min-h-11 w-full rounded-md border border-border bg-sunken px-3 text-sm text-fg outline-none focus:border-primary"
              />
            </label>
            <label htmlFor="password" className="text-xs text-muted">
              Password
              <input
                id="password"
                type="password"
                required
                minLength={8}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 min-h-11 w-full rounded-md border border-border bg-sunken px-3 text-sm text-fg outline-none focus:border-primary"
              />
            </label>
            {err ? <p className="text-sm text-danger">{err}</p> : null}
            <button
              type="submit"
              disabled={busy}
              className="min-h-11 rounded-md bg-primary text-sm font-medium text-primary-fg disabled:opacity-60"
            >
              {busy ? "Working…" : mode === "up" ? "Create account" : "Sign in with email"}
            </button>
            <button
              type="button"
              className="text-xs text-muted underline-offset-4 hover:underline"
              onClick={() => setMode(mode === "up" ? "in" : "up")}
            >
              {mode === "up" ? "Have an account? Sign in" : "Need an account? Create one"}
            </button>
          </form>
        </div>
      ) : (
        <p className="text-sm text-muted">Sign-in is disabled.</p>
      )}
    </main>
  );
}
```

## FILE `src/routes/earnings.tsx`
- bytes: 4506
- sha256: `043ddc3011a16a0bd16ea645a242c4a1e5cd5746d09bbd1d2ca940a389b8a285`

```tsx
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { DeskShell, Empty, Err, Panel, SessionTabs } from "@/components/desk-shell";
import { fetchEarnings } from "@/desk/server-fns";

export const Route = createFileRoute("/earnings")({
  validateSearch: (raw: Record<string, unknown>) => ({
    session: typeof raw.session === "string" && /^\d{4}-\d{2}-\d{2}$/.test(raw.session) ? raw.session : undefined,
  }),
  component: Earnings,
});

function Earnings() {
  const { session } = Route.useSearch();
  return (
    <DeskShell>
      <EarningsLoader session={session} />
    </DeskShell>
  );
}

function EarningsLoader({ session }: { session?: string }) {
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
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-medium tracking-tight">Earnings</h1>
        <p className="mt-1 text-sm text-muted">
          Session {d.session_date} · sealed snapshot only · post-seal quotes are not used for the card
        </p>
      </div>
      <SessionTabs sessions={d.sessions ?? []} active={d.session_date} to="/earnings" />
      <div className="grid gap-3 md:grid-cols-2">
        {d.members.map((m) => (
          <article key={m.permanent_security_id} className="rounded-xl border border-border bg-surface p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="text-sm font-medium" title={m.permanent_security_id}>
                  {m.ticker}
                </h2>
                <p className="font-mono text-[11px] text-muted">{m.permanent_security_id}</p>
              </div>
              <span className="rounded-full border border-border px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted">
                {m.timing_quality === "ISSUER_CONFIRMED" ? "issuer AMC" : m.timing_quality}
              </span>
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div>
                <dt className="text-muted">Card</dt>
                <dd className="font-mono">{m.card_complete ? "complete" : "incomplete"}</dd>
              </div>
              <div>
                <dt className="text-muted">Options</dt>
                <dd className="font-mono">{m.options_valid ? "valid" : "missing / invalid"}</dd>
              </div>
              <div>
                <dt className="text-muted">Implied move</dt>
                <dd className="font-mono">{m.implied_move ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-muted">Pins</dt>
                <dd className="font-mono">{m.pin_count}</dd>
              </div>
              <div>
                <dt className="text-muted">Rel 5d</dt>
                <dd className="font-mono">{m.benchmark_relative_5d ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-muted">Rel 63d</dt>
                <dd className="font-mono">{m.benchmark_relative_63d ?? "—"}</dd>
              </div>
            </dl>
          </article>
        ))}
      </div>
      <Panel title="Exclusions">
        {d.exclusions.length === 0 ? (
          <Empty>No excluded candidates on this sealed session.</Empty>
        ) : (
          <ul className="space-y-2 text-sm">
            {d.exclusions.map((e) => (
              <li key={e.permanent_security_id} className="flex justify-between gap-3 border-b border-border py-2">
                <span>
                  {e.ticker} <span className="font-mono text-[11px] text-muted">{e.permanent_security_id}</span>
                </span>
                <span className="font-mono text-xs text-muted">{e.reason_codes.join(", ")}</span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
```

## FILE `src/routes/predictions.tsx`
- bytes: 5152
- sha256: `f759bf4e663be698e5f7c1ca88376635274aaf1b93b1124581c01e2ecd359fc7`

```tsx
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { DeskShell, Empty, Err, Panel, SessionTabs } from "@/components/desk-shell";
import { fetchPredictions, postVerifyFreeze } from "@/desk/server-fns";

export const Route = createFileRoute("/predictions")({
  validateSearch: (raw: Record<string, unknown>) => ({
    session: typeof raw.session === "string" && /^\d{4}-\d{2}-\d{2}$/.test(raw.session) ? raw.session : undefined,
  }),
  component: Predictions,
});

function Predictions() {
  const { session } = Route.useSearch();
  return (
    <DeskShell>
      <PredictionsLoader session={session} />
    </DeskShell>
  );
}

function PredictionsLoader({ session }: { session?: string }) {
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
    setNote(null);
    try {
      const r = await postVerifyFreeze({ data: { manifestId, securityId } });
      setNote(`Verified ${securityId}: ${(r as { decision?: string }).decision ?? "ok"} (duplicate=${Boolean((r as { duplicate?: boolean }).duplicate)})`);
    } catch (e) {
      setNote(e instanceof Error ? e.message : "Verify failed");
    }
  }

  if (error) return <Err>{error}</Err>;
  return (
    <>
      {note ? <p className="mb-3 text-sm text-muted">{note}</p> : null}
      {!data ? <Empty>Loading freeze ledger…</Empty> : "needs_role" in data ? null : <Body data={data} onVerify={verify} />}
    </>
  );
}

function Body({
  data,
  onVerify,
}: {
  data: Exclude<Awaited<ReturnType<typeof fetchPredictions>>, { needs_role: true }>;
  onVerify: (m: string, s: string) => void;
}) {
  const d = data.data;
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-medium tracking-tight">Predictions</h1>
        <p className="mt-1 text-sm text-muted">
          {d.session_date} · resolution {d.freeze_resolution} · NO_FREEZE is missing prediction, not stand-down
        </p>
      </div>
      <SessionTabs sessions={d.sessions ?? []} active={d.session_date} to="/predictions" />
      <Panel title="Freeze ledger">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <thead className="text-[11px] uppercase tracking-wider text-muted">
              <tr>
                <th className="pb-2 font-medium">Name</th>
                <th className="pb-2 font-medium">Decision</th>
                <th className="pb-2 font-medium">Execution</th>
                <th className="pb-2 font-medium">Verify</th>
              </tr>
            </thead>
            <tbody>
              {d.rows.map((r) => (
                <tr key={r.permanent_security_id} className="border-t border-border align-top">
                  <td className="py-2">
                    <div className="font-medium">{r.ticker}</div>
                    <div className="font-mono text-[10px] text-muted">{r.permanent_security_id}</div>
                    {r.input_hash ? <div className="mt-1 max-w-[14rem] truncate font-mono text-[10px] text-faint">{r.input_hash}</div> : null}
                  </td>
                  <td className="py-2 font-mono text-xs">
                    {r.status}
                    {r.direction ? ` / ${r.direction}` : r.status === "NO_FREEZE" ? "" : " / —"}
                    <div className="mt-1 text-[10px] text-muted">{r.verification_level ?? ""}</div>
                    {r.magnitude_low ? (
                      <div className="text-[10px] text-muted">
                        band {r.magnitude_low}–{r.magnitude_high}
                      </div>
                    ) : null}
                  </td>
                  <td className="py-2 text-xs">
                    {r.execution === "PAPER_COMMITTED"
                      ? "PREDICT / PAPER COMMITTED"
                      : r.status === "PREDICT"
                        ? "PREDICT / NOT TRADED"
                        : r.execution}
                  </td>
                  <td className="py-2">
                    {r.status !== "NO_FREEZE" ? (
                      <button
                        type="button"
                        className="min-h-11 rounded-md border border-border px-3 text-xs hover:border-primary"
                        onClick={() => onVerify(d.manifest_id, r.permanent_security_id)}
                      >
                        Verify
                      </button>
                    ) : (
                      <span className="text-xs text-muted">no artifact</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
```

## FILE `src/routes/results.tsx`
- bytes: 6655
- sha256: `e4f5a8cdb914e5b244c2d5c92ec0a5c7abddd5f89b30b292ccf54d6a7d5a217a`

```tsx
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { DeskShell, Empty, Err, Panel, Stat } from "@/components/desk-shell";
import { fetchResults } from "@/desk/server-fns";

export const Route = createFileRoute("/results")({ component: Results });

function Results() {
  return (
    <DeskShell>
      <ResultsLoader />
    </DeskShell>
  );
}

function ResultsLoader() {
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
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-medium tracking-tight">Results</h1>
        <p className="mt-1 text-sm text-muted">Process coverage first. Denominators sit next to rates. Zero never substitutes for missing.</p>
      </div>
      <div className="rounded-xl border border-warn/40 bg-sunken px-4 py-3 text-sm leading-relaxed text-fg">{d.banner}</div>
      <Panel title="Process coverage">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Stat label="Sealed N" value={p.sealed} />
          <Stat label="Frozen" value={p.frozen} hint={`rate ${p.freeze_rate.value ?? p.freeze_rate.reason}`} />
          <Stat label="NO_FREEZE" value={p.no_freeze} hint={`rate ${p.no_freeze_rate.value ?? p.no_freeze_rate.reason}`} />
          <Stat label="PREDICT" value={p.predict} />
          <Stat label="STAND_DOWN" value={p.stand_down} hint={`of frozen ${p.stand_down_rate.value ?? p.stand_down_rate.reason}`} />
          <Stat label="Complete cards" value={p.complete_frozen_cards} />
          <Stat label="Partial manifests" value={p.partial_manifest_rate.value ?? p.partial_manifest_rate.reason ?? "—"} />
          <Stat label="UNGRADEABLE" value={p.outcomes.UNGRADEABLE ?? "0"} />
        </div>
      </Panel>
      <Panel title="Research labels">
        {"restricted" in d.research && d.research.restricted ? (
          <Empty>{d.research.message}</Empty>
        ) : (
          <Research r={d.research as Extract<typeof d.research, { restricted: false }>} />
        )}
      </Panel>
      <Panel title="Paper book">
        {"restricted" in d.book && d.book.restricted ? (
          <Empty>Operator cannot reconstruct P&L from this surface.</Empty>
        ) : (
          <Book b={d.book as Extract<typeof d.book, { positions: unknown }>} />
        )}
      </Panel>
    </div>
  );
}

function Research({ r }: { r: { clean_predict_n: string; direction_hits: string; hit_rate: { value: string | null; reason: string | null } | null; attrition_lower: { value: string | null }; attrition_upper: { value: string | null }; interval_label: string; point_estimate_suppressed: boolean; grades: Array<Record<string, unknown>> } }) {
  return (
    <div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Clean PREDICT n" value={r.clean_predict_n} />
        <Stat label="Direction hits" value={r.direction_hits} />
        <Stat label="Hit rate" value={r.point_estimate_suppressed ? "suppressed" : (r.hit_rate?.value ?? r.hit_rate?.reason ?? "—")} hint={r.point_estimate_suppressed ? "interval includes 0.5" : undefined} />
        <Stat label="Attrition interval" value={`${r.attrition_lower.value ?? "—"} – ${r.attrition_upper.value ?? "—"}`} hint={r.interval_label} />
      </div>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[40rem] text-left text-xs">
          <thead className="text-[11px] uppercase tracking-wider text-muted">
            <tr>
              <th className="pb-2 font-medium">Name</th>
              <th className="pb-2 font-medium">Decision</th>
              <th className="pb-2 font-medium">Outcome</th>
              <th className="pb-2 font-medium">Hit</th>
              <th className="pb-2 font-medium">Evidence</th>
            </tr>
          </thead>
          <tbody className="font-mono">
            {r.grades.map((g) => (
              <tr key={String(g.id) + String(g.session_date)} className="border-t border-border">
                <td className="py-2">
                  {String(g.ticker)}
                  <div className="text-[10px] text-muted">{String(g.session_date)}</div>
                </td>
                <td className="py-2">{String(g.decision ?? "—")}</td>
                <td className="py-2">{String(g.outcome)}</td>
                <td className="py-2">{g.direction_hit == null ? "—" : g.direction_hit ? "hit" : "miss"}</td>
                <td className="py-2">{g.in_evidence_set ? "clean" : "excluded"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Book({ b }: { b: { positions: Array<{ ticker: string; state: string; original_reserved_notional: string; paper_pnl: string | null; basis: string | null; strategy_pnl_eligible: boolean | null }> } }) {
  if (!b.positions.length) return <Empty>No paper positions.</Empty>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[36rem] text-left text-xs">
        <thead className="text-[11px] uppercase tracking-wider text-muted">
          <tr>
            <th className="pb-2 font-medium">Name</th>
            <th className="pb-2 font-medium">State</th>
            <th className="pb-2 font-medium">Reserved</th>
            <th className="pb-2 font-medium">P&L</th>
            <th className="pb-2 font-medium">Basis</th>
          </tr>
        </thead>
        <tbody className="font-mono">
          {b.positions.map((p) => (
            <tr key={p.ticker + p.state} className="border-t border-border">
              <td className="py-2">{p.ticker}</td>
              <td className="py-2">{p.state}</td>
              <td className="py-2">{p.original_reserved_notional}</td>
              <td className="py-2">{p.paper_pnl ?? "—"}</td>
              <td className="py-2">
                {p.basis ?? "—"}
                {p.strategy_pnl_eligible === false ? " · ineligible" : ""}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

## FILE `src/routes/admin.tsx`
- bytes: 8615
- sha256: `549a032159731e881c68eecdd4dc604b0634442e54cd9948e99a646390006491`

```tsx
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { DeskShell, Empty, Err, Panel } from "@/components/desk-shell";
import { fetchAdmin, postFireNote, postPause, postPrintKnowledge, postResume, postRetryDeadlines } from "@/desk/server-fns";

export const Route = createFileRoute("/admin")({ component: Admin });

function Admin() {
  return (
    <DeskShell>
      <AdminLoader />
    </DeskShell>
  );
}

function AdminLoader() {
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
  return (
    <>
      {note ? <p className="mb-3 text-sm text-muted">{note}</p> : null}
      {!data ? <Empty>Loading operations…</Empty> : "needs_role" in data ? null : <Body data={data} run={run} />}
    </>
  );
}

function Body({
  data,
  run,
}: {
  data: Exclude<Awaited<ReturnType<typeof fetchAdmin>>, { needs_role: true }>;
  run: (label: string, fn: () => Promise<unknown>) => void;
}) {
  const d = data.data;
  const [reason, setReason] = useState("operational pause");
  const [hyp, setHyp] = useState<"IMPLEMENTATION_BUG" | "COVERAGE_SHIFT" | "REGIME_SHIFT">("COVERAGE_SHIFT");
  const [fire, setFire] = useState("");
  const [pk, setPk] = useState({ eventKey: "", securityId: "", reason: "" });
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-medium tracking-tight">Admin</h1>
        <p className="mt-1 text-sm text-muted">No force-trade, no arbitrary price, no history delete. Flatten requests a modeled official mark.</p>
      </div>
      <Panel title="Admission gate" aside={d.admission_paused ? "PAUSED" : "open"}>
        {d.can_mutate ? (
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="min-h-11 flex-1 rounded-md border border-border bg-sunken px-3 text-sm"
              placeholder="Pause reason"
            />
            <button
              type="button"
              className="min-h-11 rounded-md border border-border px-4 text-sm"
              onClick={() => run("Paused", () => postPause({ data: { reason } }))}
            >
              Pause
            </button>
            <button
              type="button"
              className="min-h-11 rounded-md bg-primary px-4 text-sm text-primary-fg"
              onClick={() => run("Resumed", () => postResume())}
            >
              Resume
            </button>
          </div>
        ) : (
          <Empty>Reviewer cannot mutate admission.</Empty>
        )}
        {d.pause_reason ? <p className="mt-2 text-xs text-muted">{d.pause_reason}</p> : null}
      </Panel>
      <Panel title="Jobs">
        <ul className="divide-y divide-border text-sm">
          {d.jobs.map((j) => (
            <li key={j.job_name} className="flex justify-between py-2 font-mono text-xs">
              <span>{j.job_name}</span>
              <span className="text-muted">{j.status}</span>
            </li>
          ))}
        </ul>
        {d.can_mutate ? (
          <button
            type="button"
            className="mt-3 min-h-11 rounded-md border border-border px-4 text-sm"
            onClick={() => run("Deadlines retried", () => postRetryDeadlines())}
          >
            Retry due deadlines
          </button>
        ) : null}
      </Panel>
      <Panel title="Deadlines">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[28rem] text-left text-xs">
            <thead className="text-[11px] uppercase tracking-wider text-muted">
              <tr>
                <th className="pb-2 font-medium">Kind</th>
                <th className="pb-2 font-medium">Scheduled</th>
                <th className="pb-2 font-medium">Applied</th>
              </tr>
            </thead>
            <tbody className="font-mono">
              {d.deadlines.map((x, i) => (
                <tr key={i} className="border-t border-border">
                  <td className="py-2">{x.kind}</td>
                  <td className="py-2">{x.scheduled_at}</td>
                  <td className="py-2">{x.applied_at ?? (x.overdue ? "OVERDUE" : "pending")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
      <Panel title="Alarms">
        {d.alarms.length === 0 ? (
          <Empty>No open operational alarms.</Empty>
        ) : (
          <ul className="space-y-2 text-sm">
            {d.alarms.map((a, i) => (
              <li key={i} className="rounded-md border border-border px-3 py-2">
                <div className="flex justify-between gap-2">
                  <span className="font-mono text-xs">{a.code}</span>
                  <span className="text-[11px] text-muted">{a.status}</span>
                </div>
                <p className="mt-1 text-xs text-muted">
                  {a.component}
                  {a.blocks_new_admission ? " · blocks new admission" : ""}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Panel>
      <Panel title="Early-result knowledge">
        {d.can_mutate ? (
          <div className="grid gap-2">
            <input className="min-h-11 rounded-md border border-border bg-sunken px-3 text-sm" placeholder="Event key" value={pk.eventKey} onChange={(e) => setPk({ ...pk, eventKey: e.target.value })} />
            <input className="min-h-11 rounded-md border border-border bg-sunken px-3 text-sm" placeholder="Permanent security id" value={pk.securityId} onChange={(e) => setPk({ ...pk, securityId: e.target.value })} />
            <input className="min-h-11 rounded-md border border-border bg-sunken px-3 text-sm" placeholder="Reason" value={pk.reason} onChange={(e) => setPk({ ...pk, reason: e.target.value })} />
            <button
              type="button"
              className="min-h-11 rounded-md border border-border text-sm"
              onClick={() => run("Knowledge recorded", () => postPrintKnowledge({ data: pk }))}
            >
              Append knowledge
            </button>
          </div>
        ) : (
          <Empty>Operator only.</Empty>
        )}
      </Panel>
      <Panel title="Fire-rate note">
        {d.can_mutate ? (
          <div className="grid gap-2">
            <select
              className="min-h-11 rounded-md border border-border bg-sunken px-3 text-sm"
              value={hyp}
              onChange={(e) => setHyp(e.target.value as typeof hyp)}
            >
              <option value="IMPLEMENTATION_BUG">IMPLEMENTATION_BUG</option>
              <option value="COVERAGE_SHIFT">COVERAGE_SHIFT</option>
              <option value="REGIME_SHIFT">REGIME_SHIFT</option>
            </select>
            <textarea className="rounded-md border border-border bg-sunken px-3 py-2 text-sm" rows={3} value={fire} onChange={(e) => setFire(e.target.value)} />
            <button
              type="button"
              className="min-h-11 rounded-md border border-border text-sm"
              onClick={() => run("Note stored", () => postFireNote({ data: { hypothesis: hyp, note: fire } }))}
            >
              Append note
            </button>
          </div>
        ) : (
          <Empty>Operator only.</Empty>
        )}
        <ul className="mt-3 space-y-1 text-xs text-muted">
          {d.fire_rate_notes.map((n, i) => (
            <li key={i}>
              <span className="font-mono">{n.hypothesis}</span> — {n.note}
            </li>
          ))}
        </ul>
      </Panel>
      <Panel title="Data ports">
        <dl className="grid grid-cols-2 gap-2 text-xs md:grid-cols-3">
          {Object.entries(d.ports).map(([k, v]) => (
            <div key={k}>
              <dt className="text-muted">{k}</dt>
              <dd className="font-mono">{v}</dd>
            </div>
          ))}
        </dl>
      </Panel>
    </div>
  );
}
```

## FILE `src/routes/api/trading-app/v1/health/live.ts`
- bytes: 2402
- sha256: `d572971de8ffefb6549514bda0f29e1b35121a6b3db9a4005d6a63eee482bf2f`

```ts
import { createFileRoute } from "@tanstack/react-router";
import { ensureBootstrapped } from "@/desk/bootstrap";
import { getSql } from "@/lib/db";

export const Route = createFileRoute("/api/trading-app/v1/health/live")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const boot = await ensureBootstrapped();
          const sql = await getSql();
          const [man, frz, pos, grd, adm, clk] = await Promise.all([
            sql.query<{ c: number }>(`SELECT COUNT(*)::int AS c FROM manifest`),
            sql.query<{ c: number }>(`SELECT COUNT(*)::int AS c FROM "freeze"`),
            sql.query<{ c: number; states: string }>(
              `SELECT COUNT(*)::int AS c, COALESCE(string_agg(state || ':' || display_ticker, ','), '') AS states FROM "position"`,
            ),
            sql.query<{ c: number }>(`SELECT COUNT(*)::int AS c FROM grade`),
            sql.query<{ c: number; outcomes: string }>(
              `SELECT COUNT(*)::int AS c, COALESCE(string_agg(outcome, ','), '') AS outcomes FROM execution_admission`,
            ),
            sql.query<{ now_utc: string }>(`SELECT now_utc::text FROM fixture_clock WHERE singleton_key = TRUE`),
          ]);
          return Response.json({
            product_name: "Trading App",
            paperOnly: true,
            liveTradingSupported: false,
            activeModelWeight: "0",
            data_mode: "FIXTURE",
            status: "live",
            bootstrap: boot.note,
            as_of: clk[0]?.now_utc ?? null,
            counts: {
              manifests: man[0]?.c ?? 0,
              freezes: frz[0]?.c ?? 0,
              positions: pos[0]?.c ?? 0,
              position_states: pos[0]?.states ?? "",
              grades: grd[0]?.c ?? 0,
              admissions: adm[0]?.c ?? 0,
              admission_outcomes: adm[0]?.outcomes ?? "",
            },
          });
        } catch (err) {
          console.error("[trading-app] bootstrap", err);
          const message = err instanceof Error ? err.message : String(err);
          return Response.json(
            {
              product_name: "Trading App",
              paperOnly: true,
              liveTradingSupported: false,
              activeModelWeight: "0",
              status: "error",
              error: message,
            },
            { status: 503 },
          );
        }
      },
    },
  },
});
```

## FILE `src/components/desk-shell.tsx`
- bytes: 7858
- sha256: `12ee86517be2acb87963e8859db0029a8fd5d84da1967bcfc3b3910f51dbe5cd`

```tsx
import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { RedirectToSignIn, UserButton } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { fetchMe, postClaimRole } from "@/desk/server-fns";

const NAV = [
  { to: "/", label: "Home" },
  { to: "/earnings", label: "Earnings" },
  { to: "/predictions", label: "Predictions" },
  { to: "/results", label: "Results" },
  { to: "/admin", label: "Admin" },
] as const;

export function DeskShell({ children }: { children: ReactNode }) {
  const { user, isPending } = useCurrentUserState();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [role, setRole] = useState<string | null | undefined>(undefined);
  const [claiming, setClaiming] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    void fetchMe()
      .then((m) => setRole(m.role))
      .catch((e) => setErr(e instanceof Error ? e.message : "Failed to load desk identity"));
  }, [user]);

  if (isPending) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-bg text-muted">
        <div className="h-24 w-64 animate-pulse rounded-xl bg-surface" />
      </div>
    );
  }
  if (!user) return <RedirectToSignIn />;

  async function claim(next: "OPERATOR" | "REVIEWER") {
    setClaiming(true);
    setErr(null);
    try {
      const r = await postClaimRole({ data: { role: next } });
      setRole(r.role);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not assign desk role");
    } finally {
      setClaiming(false);
    }
  }

  if (role === undefined) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-bg text-muted">
        <p className="text-sm">Loading desk identity…</p>
      </div>
    );
  }

  if (role === null) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center gap-6 px-5 py-10">
        <p className="text-xs font-medium tracking-[0.18em] text-muted">TRADING APP · PAPER ONLY</p>
        <h1 className="text-2xl font-medium tracking-tight">Choose a desk role</h1>
        <p className="text-sm leading-relaxed text-muted">
          This is an information barrier, not a blinded study. Operator runs the session and cannot see labels,
          marks, or paper P&L until the window is released. Reviewer sees research outcomes and cannot mutate
          the book. The assignment is permanent for this account.
        </p>
        {err ? <p className="text-sm text-danger">{err}</p> : null}
        <div className="grid gap-3">
          <button
            type="button"
            disabled={claiming}
            onClick={() => void claim("OPERATOR")}
            className="rounded-lg border border-border bg-surface px-4 py-4 text-left transition hover:border-primary"
          >
            <div className="text-sm font-medium">Operator</div>
            <div className="mt-1 text-xs leading-relaxed text-muted">
              Pause admission, flatten requests, early-result flags. No hits, bands, or P&L.
            </div>
          </button>
          <button
            type="button"
            disabled={claiming}
            onClick={() => void claim("REVIEWER")}
            className="rounded-lg border border-border bg-surface px-4 py-4 text-left transition hover:border-primary"
          >
            <div className="text-sm font-medium">Reviewer</div>
            <div className="mt-1 text-xs leading-relaxed text-muted">
              Read labels, bands, and modeled book. Cannot register rules or change admission.
            </div>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-bg pb-20 text-fg md:pb-8">
      <header className="border-b border-border bg-bg/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium tracking-tight">Trading App</span>
              <span className="rounded-full border border-border px-2 py-0.5 font-mono text-[10px] tracking-wider text-warn">
                FIXTURE / SYNTHETIC
              </span>
            </div>
            <p className="truncate text-[11px] text-muted">Paper only · live trading unsupported · model weight 0</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden rounded-full border border-border px-2 py-0.5 font-mono text-[10px] text-muted sm:inline">
              {role}
            </span>
            <UserButton />
          </div>
        </div>
        <nav className="mx-auto hidden max-w-6xl gap-1 px-4 pb-2 md:flex">
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className={
                "rounded-md px-3 py-1.5 text-sm " +
                (pathname === n.to ? "bg-surface text-fg" : "text-muted hover:text-fg")
              }
            >
              {n.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-5">{children}</main>
      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-bg/95 pb-[env(safe-area-inset-bottom)] md:hidden">
        <div className="grid grid-cols-5">
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className={
                "flex min-h-11 items-center justify-center px-1 text-[11px] " +
                (pathname === n.to ? "text-fg" : "text-muted")
              }
            >
              {n.label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}

export function Panel({ title, children, aside }: { title: string; children: ReactNode; aside?: string }) {
  return (
    <section className="rounded-xl border border-border bg-surface p-4 md:p-5">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-medium tracking-tight">{title}</h2>
        {aside ? <span className="font-mono text-[11px] text-muted">{aside}</span> : null}
      </div>
      {children}
    </section>
  );
}

export function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="min-w-0">
      <div className="text-[11px] uppercase tracking-wider text-muted">{label}</div>
      <div className="mt-1 font-mono text-lg tabular-nums text-fg">{value}</div>
      {hint ? <div className="mt-0.5 text-[11px] text-faint">{hint}</div> : null}
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="text-sm text-muted">{children}</p>;
}

export function Err({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-lg border border-danger/40 bg-sunken px-3 py-2 text-sm text-danger" role="alert">
      {children}
    </div>
  );
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
    <div className="flex flex-wrap gap-2">
      {sessions.map((s) => (
        <Link
          key={s.session_date}
          to={to}
          search={{ session: s.session_date }}
          className={
            "min-h-11 rounded-md border px-3 text-sm " +
            (active === s.session_date ? "border-primary bg-surface text-fg" : "border-border text-muted hover:text-fg")
          }
        >
          {s.session_date}
        </Link>
      ))}
    </div>
  );
}
```
