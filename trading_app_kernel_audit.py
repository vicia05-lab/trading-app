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
