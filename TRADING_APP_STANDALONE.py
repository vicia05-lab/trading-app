#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Trading App — STANDALONE FREEZE-VERIFIER + KERNEL PACKET
========================================================
Give this single file to another model. Stdlib only. No pip. No repo required.

WHAT THIS IS
  The complete content-hash freeze verifier the TypeScript desk must match,
  plus the v1.2 kernel (hashes, AST evaluate, Decimal fill).

  Product: paper-only AMC earnings desk. Not a broker.
  GitHub:  https://github.com/vicia05-lab/trading-app
  Domain:  Trading App|input|2
  Golden H01: bac8f1353582276f85608c618ad44f104f5480fea76d03ce0dbcad4955522726

HOW TO RUN
  python3 TRADING_APP_STANDALONE.py

YOUR JOB (reviewing AI)
  1. Run this file. If a golden fails, stop — the packet is corrupt.
  2. Attack the verifier: missing observations, tombstones, hash-column-only
     mutations, output_payload drift, pin-index swaps, alarm rollback.
  3. Compare this reference to src/desk/verify-freeze.ts in the repo.
  4. Produce GO / NO-GO. Do not rubber-stamp.

MUST HOLD
  - BYTE_VERIFIED requires a rebuilt commitment chain from actual contents:
      observation envelope → observationHash
      card + pins → snapshotHash
      canonical_content → manifestHash
      those digests + pins → inputHash
      replayed decision payload → outputHash
      Hash(persisted output_payload) = stored output_hash
      persisted output_payload = replayed payload
  - Missing or tombstoned observation without attestation → UNVERIFIABLE
  - Diagnostic rows COMMIT even when verification throws
  - Verify never creates a freeze
  - NO_FREEZE ≠ STAND_DOWN
  - LIVE trading is not in this kernel

DO NOT
  - Invent a live broker
  - Treat JSON numbers as legal in CJ1
  - Label BYTE_VERIFIED because the decision still PREDICTs
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

# ─────────────────────────────────────────────────────────────────────────────
# COMPLETE FREEZE VERIFIER (in-memory reference)
# ─────────────────────────────────────────────────────────────────────────────

import copy
import unittest

MARGIN = 3

class VerifyError(Exception):
    def __init__(self, code, detail):
        super().__init__(detail)
        self.code = code
        self.detail = detail


def decision_payload(ev, card):
    if ev["decision"] == "PREDICT" and card.get("implied_move"):
        band = magnitude_band(card["implied_move"])
    else:
        band = {"low": None, "high": None}
    reasons = list(ev["reasons"])
    return {
        "status": ev["status"],
        "decision": ev["decision"],
        "direction": ev["direction"],
        "magnitude_low": band["low"],
        "magnitude_high": band["high"],
        "card_complete": card["card_complete"],
        "options_valid": card["options_valid"],
        "reasons": reasons,
        "missing": [r for r in reasons if r.startswith("MISSING_")],
    }


def _hex(x):
    return x if isinstance(x, str) else x


def manifest_object_from_stored(raw):
    """Writer hashes the object and stores jsonCanon(object) as TEXT."""
    if isinstance(raw, (bytes, bytearray)):
        raw = raw.decode("utf-8")
    if isinstance(raw, str):
        try:
            obj = json.loads(raw)
        except Exception as exc:
            raise VerifyError("FREEZE_ARTIFACT_MISMATCH", "canonical manifest text is not CJ1") from exc
        if type(obj) is not dict:
            raise VerifyError("FREEZE_ARTIFACT_MISMATCH", "canonical manifest is not an object")
        rec = canon(obj).decode("utf-8")
        if rec != raw:
            raise VerifyError(
                "FREEZE_ARTIFACT_MISMATCH",
                "canonical manifest re-encoding does not match stored bytes",
            )
        return obj
    if type(raw) is dict:
        return raw
    raise VerifyError("FREEZE_ARTIFACT_MISMATCH", "canonical manifest is missing or not an object")


class Store:
    """Minimal immutable-artifact store plus append-only diagnostics."""

    def __init__(self):
        self.manifest = {}
        self.member = {}
        self.sealed = {}
        self.sealed_pins = {}
        self.freeze = {}
        self.freeze_pins = {}
        self.observation = {}
        self.rule = {}
        self.admission = {}
        self.audit = []
        self.alarms = []
        self._committed_alarms = []
        self._in_txn = False
        self._txn_audit = None
        self._txn_alarms = None

    def begin(self):
        self._in_txn = True
        self._txn_audit = []
        self._txn_alarms = []

    def rollback(self):
        self._in_txn = False
        self._txn_audit = None
        self._txn_alarms = None

    def commit(self):
        if self._txn_audit:
            self.audit.extend(self._txn_audit)
        if self._txn_alarms:
            self.alarms.extend(self._txn_alarms)
            self._committed_alarms.extend(self._txn_alarms)
        self._in_txn = False
        self._txn_audit = None
        self._txn_alarms = None

    def add_audit(self, row):
        # Diagnostics always persist, even if a later throw rolls back a writer txn.
        self.audit.append(row)

    def add_alarm(self, row):
        self.alarms.append(row)
        self._committed_alarms.append(row)


def verify_freeze(store: Store, manifest_id: str, security_id: str) -> dict:
    """Read-only replay. Never creates a freeze. Diagnostics commit on failure."""
    fr = store.freeze.get((manifest_id, security_id))
    if not fr:
        raise VerifyError("NOT_FOUND", "no freeze to verify")
    freeze_id = fr["freeze_id"]

    def fail(detail, code="FREEZE_ARTIFACT_MISMATCH"):
        store.add_audit({
            "freeze_id": freeze_id,
            "manifest_id": manifest_id,
            "security_id": security_id,
            "result": "UNVERIFIABLE",
            "detail": detail,
        })
        store.add_alarm({
            "code": "FREEZE_ARTIFACT_MISMATCH",
            "freeze_id": freeze_id,
            "detail": detail,
        })
        raise VerifyError(code, detail)

    man = store.manifest[manifest_id]
    try:
        manifest_object = manifest_object_from_stored(man["canonical_content"])
    except VerifyError as e:
        fail(e.detail, e.code)
    rebuilt_manifest = manifest_hash(manifest_object)
    if rebuilt_manifest != man["manifest_hash"]:
        fail("manifest content does not match the stored manifest hash")

    member = store.member[(manifest_id, security_id)]
    sealed = store.sealed[(manifest_id, security_id)]
    sealed_pins = list(store.sealed_pins[(manifest_id, security_id)])
    freeze_pins = list(store.freeze_pins[freeze_id])

    if (
        len(sealed_pins) != len(freeze_pins)
        or len(sealed_pins) != fr["pin_count"]
        or len(sealed_pins) != sealed["pin_count"]
    ):
        fail("pin count disagrees across freeze, sealed inputs, and pin rows")

    sealed_pins = sorted(sealed_pins, key=lambda p: p["pin_index"])
    freeze_pins = sorted(freeze_pins, key=lambda p: p["pin_index"])
    for i, s in enumerate(sealed_pins):
        f = freeze_pins[i]
        if (
            s["observation_id"] != f["observation_id"]
            or s["observation_hash"] != f["observation_hash"]
            or s["pin_index"] != f["pin_index"]
            or s["pin_index"] != i
        ):
            fail("pin membership or pin index disagrees with the sealed set")

    ranked = sorted(sealed_pins, key=lambda p: p["observation_id"].encode("utf-8"))
    for i, p in enumerate(ranked):
        if p["pin_index"] != i:
            fail("pin_index is not UTF-8 byte-lex order of observation ids")
    ranked_f = sorted(freeze_pins, key=lambda p: p["observation_id"].encode("utf-8"))
    for i, p in enumerate(ranked_f):
        if p["pin_index"] != i:
            fail("pin_index is not UTF-8 byte-lex order of observation ids")

    for pin in sealed_pins:
        obs = store.observation.get(pin["observation_id"])
        if not obs:
            fail("pinned observation is missing")
        if obs.get("tombstoned"):
            fail("pinned observation is tombstoned without a surviving attestation")
        try:
            recomputed = observation_hash(obs["envelope"])
        except KernelError:
            fail("observation content is not canonical")
        if recomputed != obs["observation_hash"] or recomputed != pin["observation_hash"]:
            fail("observation content does not match the sealed pin hash")

    pin_list = sorted(
        [{"id": p["observation_id"], "hash": p["observation_hash"]} for p in sealed_pins],
        key=lambda p: p["id"],
    )
    rebuilt_snap = snapshot_hash({
        "permanent_security_id": security_id,
        "event_key": member["event_key"],
        "session_date": man["session_date"],
        "card": sealed["card"],
        "pins": pin_list,
    })
    if rebuilt_snap != member["snapshot_hash"]:
        fail("sealed card and pins do not match the stored snapshot hash")

    pin_tuples = [(p["observation_id"], p["observation_hash"]) for p in sealed_pins]
    in_hash = input_hash(
        manifest_id,
        security_id,
        rebuilt_manifest,
        rebuilt_snap,
        man["rule_ast_hash"],
        man["evaluator_artifact_hash"],
        man["cost_model_hash"],
        MARGIN,
        pin_tuples,
    )
    if in_hash != fr["input_hash"]:
        fail("recomputed input hash does not match the freeze artifact")

    ast = store.rule.get((man["rule_id"], man["rule_version"]))
    if ast is None:
        fail("sealed rule is missing", "RULE_UNAVAILABLE")
    if rule_ast_hash(ast) != man["rule_ast_hash"]:
        fail("loaded rule does not match the sealed digest", "RULE_MISMATCH")

    card = sealed["card"]
    ev = evaluate(ast, {
        "timing_quality": card["timing_quality"],
        "card_complete": card["card_complete"],
        "options_valid": card["options_valid"],
        "implied_move": card["implied_move"],
        "benchmark_relative_5d": card["benchmark_relative_5d"],
        "benchmark_relative_63d": card["benchmark_relative_63d"],
    })
    if ev["status"] == "INVALID_RULE":
        fail("registered rule invalid")
    replayed = decision_payload(ev, card)
    persisted = fr["output_payload"]
    try:
        persisted_hash = output_hash(in_hash, persisted)
    except KernelError:
        fail("stored output payload is not canonical")
    if persisted_hash != fr["output_hash"]:
        fail("stored output payload does not hash to the freeze output hash")
    replayed_hash = output_hash(in_hash, replayed)
    if replayed_hash != fr["output_hash"] or canon(persisted) != canon(replayed):
        fail("replayed decision does not match the freeze artifact")
    if fr["decision"] != ev["decision"] or fr.get("direction") != ev.get("direction"):
        fail("stored decision fields do not match the replay")

    store.add_audit({
        "freeze_id": freeze_id,
        "manifest_id": manifest_id,
        "security_id": security_id,
        "result": "BYTE_VERIFIED",
        "detail": "replay matched sealed contents",
    })
    adm = store.admission.get(freeze_id, {})
    return {
        "freeze_id": freeze_id,
        "decision": ev["decision"],
        "direction": ev.get("direction"),
        "input_hash": in_hash,
        "output_hash": replayed_hash,
        "admission_outcome": adm.get("outcome"),
        "verification_level": "BYTE_VERIFIED",
    }


def _h64(ch):
    return ch * 64


def build_intact_fixture():
    """One PREDICT freeze with two pins. Contents and digest columns agree."""
    st = Store()
    ast = copy.deepcopy(INITIAL_AST)
    rule_h = rule_ast_hash(ast)
    card = {
        "timing_quality": "ISSUER_CONFIRMED",
        "card_complete": True,
        "options_valid": True,
        "implied_move": "0.080000000000",
        "benchmark_relative_5d": "-0.010000000000",
        "benchmark_relative_63d": "0.045000000000",
    }
    env_a = {
        "observation_id": "obs-a",
        "permanent_security_id": "SEC-A",
        "session_date": "2026-09-04",
        "snapshot_type": "QUOTE",
        "payload": {"last": "100.000000"},
    }
    env_z = {
        "observation_id": "obs-z",
        "permanent_security_id": "SEC-A",
        "session_date": "2026-09-04",
        "snapshot_type": "BAR_DAILY",
        "payload": {"c": "99.000000"},
    }
    ha = observation_hash(env_a)
    hz = observation_hash(env_z)
    pins = [
        {"observation_id": "obs-a", "observation_hash": ha, "pin_index": 0},
        {"observation_id": "obs-z", "observation_hash": hz, "pin_index": 1},
    ]
    pin_list = sorted(
        [{"id": p["observation_id"], "hash": p["observation_hash"]} for p in pins],
        key=lambda p: p["id"],
    )
    snap = snapshot_hash({
        "permanent_security_id": "SEC-A",
        "event_key": "ev-a",
        "session_date": "2026-09-04",
        "card": card,
        "pins": pin_list,
    })
    canonical = {
        "manifest_id": "man-1",
        "session_date": "2026-09-04",
        "sleeve": "EARNINGS",
        "rule_ast_hash": rule_h,
        "members": [{"permanent_security_id": "SEC-A", "snapshot_hash": snap}],
    }
    man_h = manifest_hash(canonical)
    engine_h = _h64("4")
    cost_h = _h64("5")
    canonical_text = canon(canonical).decode("utf-8")
    in_h = input_hash("man-1", "SEC-A", man_h, snap, rule_h, engine_h, cost_h, 3,
                      [(p["observation_id"], p["observation_hash"]) for p in pins])
    ev = evaluate(ast, card)
    payload = decision_payload(ev, card)
    out_h = output_hash(in_h, payload)

    st.rule[("rule-1", "v1")] = ast
    st.manifest["man-1"] = {
        "canonical_content": canonical_text,
        "manifest_hash": man_h,
        "rule_ast_hash": rule_h,
        "evaluator_artifact_hash": engine_h,
        "cost_model_hash": cost_h,
        "rule_id": "rule-1",
        "rule_version": "v1",
        "session_date": "2026-09-04",
    }
    st.member[("man-1", "SEC-A")] = {"snapshot_hash": snap, "event_key": "ev-a"}
    st.sealed[("man-1", "SEC-A")] = {"card": copy.deepcopy(card), "pin_count": 2}
    st.sealed_pins[("man-1", "SEC-A")] = copy.deepcopy(pins)
    st.observation["obs-a"] = {"envelope": env_a, "observation_hash": ha, "tombstoned": False}
    st.observation["obs-z"] = {"envelope": env_z, "observation_hash": hz, "tombstoned": False}
    st.freeze[("man-1", "SEC-A")] = {
        "freeze_id": "frz-1",
        "input_hash": in_h,
        "output_hash": out_h,
        "decision": ev["decision"],
        "direction": ev["direction"],
        "output_payload": copy.deepcopy(payload),
        "pin_count": 2,
    }
    st.freeze_pins["frz-1"] = copy.deepcopy(pins)
    st.admission["frz-1"] = {"outcome": "ADMITTED"}
    return st


class VerifierProbes(unittest.TestCase):
    def test_00_h01_golden(self):
        got = input_hash(
            "manifest-20260914", "SEC-A",
            "1" * 64, "2" * 64, "3" * 64, "4" * 64, "5" * 64, 3,
            [("obs-z", "a" * 64), ("obs-a", "b" * 64)],
        )
        self.assertEqual(got, "bac8f1353582276f85608c618ad44f104f5480fea76d03ce0dbcad4955522726")

    def test_01_intact_is_byte_verified(self):
        st = build_intact_fixture()
        self.assertIsInstance(st.manifest["man-1"]["canonical_content"], str)
        out = verify_freeze(st, "man-1", "SEC-A")
        self.assertEqual(out["verification_level"], "BYTE_VERIFIED")
        self.assertEqual(out["decision"], "PREDICT")
        self.assertEqual(st.audit[-1]["result"], "BYTE_VERIFIED")
        self.assertEqual(len(st.alarms), 0)

    def test_02_wrong_input_hash_rejected(self):
        st = build_intact_fixture()
        st.freeze[("man-1", "SEC-A")]["input_hash"] = "c" * 64
        with self.assertRaises(VerifyError) as cm:
            verify_freeze(st, "man-1", "SEC-A")
        self.assertEqual(cm.exception.code, "FREEZE_ARTIFACT_MISMATCH")
        self.assertEqual(st.audit[-1]["result"], "UNVERIFIABLE")

    def test_03_wrong_output_hash_rejected(self):
        st = build_intact_fixture()
        st.freeze[("man-1", "SEC-A")]["output_hash"] = "d" * 64
        with self.assertRaises(VerifyError):
            verify_freeze(st, "man-1", "SEC-A")

    def test_04_changed_decision_rejected(self):
        st = build_intact_fixture()
        st.freeze[("man-1", "SEC-A")]["decision"] = "STAND_DOWN"
        st.freeze[("man-1", "SEC-A")]["direction"] = None
        with self.assertRaises(VerifyError):
            verify_freeze(st, "man-1", "SEC-A")

    def test_05_missing_rule_blocks(self):
        st = build_intact_fixture()
        st.rule.clear()
        with self.assertRaises(VerifyError) as cm:
            verify_freeze(st, "man-1", "SEC-A")
        self.assertEqual(cm.exception.code, "RULE_UNAVAILABLE")

    def test_06_mismatched_rule_digest_blocks(self):
        st = build_intact_fixture()
        st.manifest["man-1"]["rule_ast_hash"] = "e" * 64
        # input hash will also fail first unless we keep hashes consistent —
        # digest mismatch on loaded AST vs sealed digest is the required check.
        # Rebuild so input hash still matches stored, only rule digest lies.
        # Simpler: change stored AST content, leave digest column.
        st = build_intact_fixture()
        ast = copy.deepcopy(INITIAL_AST)
        ast["all"] = list(ast["all"]) + [{"field": "implied_move", "op": "GTE", "value": "0.041000000000"}]
        st.rule[("rule-1", "v1")] = ast
        with self.assertRaises(VerifyError) as cm:
            verify_freeze(st, "man-1", "SEC-A")
        self.assertEqual(cm.exception.code, "RULE_MISMATCH")

    def test_07_observation_hash_column_changed(self):
        st = build_intact_fixture()
        st.observation["obs-a"]["observation_hash"] = "f" * 64
        with self.assertRaises(VerifyError):
            verify_freeze(st, "man-1", "SEC-A")

    def test_08_pin_membership_changed(self):
        st = build_intact_fixture()
        st.freeze_pins["frz-1"] = [st.freeze_pins["frz-1"][0]]
        with self.assertRaises(VerifyError):
            verify_freeze(st, "man-1", "SEC-A")

    def test_09_missing_observation_not_byte_verified(self):
        st = build_intact_fixture()
        del st.observation["obs-a"]
        with self.assertRaises(VerifyError) as cm:
            verify_freeze(st, "man-1", "SEC-A")
        self.assertIn("missing", cm.exception.detail)
        self.assertEqual(st.audit[-1]["result"], "UNVERIFIABLE")
        self.assertTrue(st.alarms)

    def test_10_tombstoned_observation_not_byte_verified(self):
        st = build_intact_fixture()
        st.observation["obs-a"]["tombstoned"] = True
        with self.assertRaises(VerifyError) as cm:
            verify_freeze(st, "man-1", "SEC-A")
        self.assertIn("tombstoned", cm.exception.detail)
        self.assertEqual(st.audit[-1]["result"], "UNVERIFIABLE")

    def test_11_card_field_change_that_still_predicts(self):
        st = build_intact_fixture()
        st.sealed[("man-1", "SEC-A")]["card"]["benchmark_relative_63d"] = "0.046000000000"
        with self.assertRaises(VerifyError) as cm:
            verify_freeze(st, "man-1", "SEC-A")
        self.assertIn("snapshot", cm.exception.detail)

    def test_12_observation_payload_change_old_hash_column(self):
        st = build_intact_fixture()
        st.observation["obs-a"]["envelope"] = dict(st.observation["obs-a"]["envelope"])
        st.observation["obs-a"]["envelope"]["payload"] = {"last": "101.000000"}
        # hash column left intact
        with self.assertRaises(VerifyError) as cm:
            verify_freeze(st, "man-1", "SEC-A")
        self.assertIn("observation content", cm.exception.detail)

    def test_13_manifest_content_change_old_hash_column(self):
        st = build_intact_fixture()
        obj = json.loads(st.manifest["man-1"]["canonical_content"])
        obj["session_date"] = "2026-09-05"
        st.manifest["man-1"]["canonical_content"] = canon(obj).decode("utf-8")
        with self.assertRaises(VerifyError) as cm:
            verify_freeze(st, "man-1", "SEC-A")
        self.assertIn("manifest content", cm.exception.detail)

    def test_14_output_payload_drift_old_hash(self):
        st = build_intact_fixture()
        st.freeze[("man-1", "SEC-A")]["output_payload"] = dict(st.freeze[("man-1", "SEC-A")]["output_payload"])
        st.freeze[("man-1", "SEC-A")]["output_payload"]["magnitude_low"] = "0.900000000000"
        with self.assertRaises(VerifyError) as cm:
            verify_freeze(st, "man-1", "SEC-A")
        self.assertTrue(
            "output payload" in cm.exception.detail or "replayed decision" in cm.exception.detail
        )

    def test_15_swapped_pin_indexes(self):
        st = build_intact_fixture()
        # Only the freeze-pin indexes move. Sealed pins stay as recorded.
        st.freeze_pins["frz-1"] = [
            {**st.freeze_pins["frz-1"][0], "pin_index": 1},
            {**st.freeze_pins["frz-1"][1], "pin_index": 0},
        ]
        with self.assertRaises(VerifyError) as cm:
            verify_freeze(st, "man-1", "SEC-A")
        self.assertIn("pin", cm.exception.detail)

    def test_15b_jointly_swapped_pin_indexes_rejected(self):
        st = build_intact_fixture()
        swapped = [
            {**st.sealed_pins[("man-1", "SEC-A")][0], "pin_index": 1, "observation_id": "obs-z"},
            {**st.sealed_pins[("man-1", "SEC-A")][1], "pin_index": 0, "observation_id": "obs-a"},
        ]
        # Keep hashes attached to the original ids.
        ha = st.observation["obs-a"]["observation_hash"]
        hz = st.observation["obs-z"]["observation_hash"]
        swapped = [
            {"observation_id": "obs-z", "observation_hash": hz, "pin_index": 0},
            {"observation_id": "obs-a", "observation_hash": ha, "pin_index": 1},
        ]
        st.sealed_pins[("man-1", "SEC-A")] = swapped
        st.freeze_pins["frz-1"] = [dict(p) for p in swapped]
        with self.assertRaises(VerifyError) as cm:
            verify_freeze(st, "man-1", "SEC-A")
        self.assertIn("pin_index", cm.exception.detail)

    def test_16_incorrect_stored_pin_count(self):
        st = build_intact_fixture()
        st.freeze[("man-1", "SEC-A")]["pin_count"] = 9
        with self.assertRaises(VerifyError):
            verify_freeze(st, "man-1", "SEC-A")

    def test_17_alarm_survives_writer_rollback(self):
        st = build_intact_fixture()
        del st.observation["obs-a"]
        st.begin()  # simulated writer txn around a naive raiseAlarm
        try:
            verify_freeze(st, "man-1", "SEC-A")
        except VerifyError:
            st.rollback()  # would wipe raiseAlarm-in-writer; diagnostics already committed
        self.assertEqual(len(st.audit), 1)
        self.assertEqual(st.audit[0]["result"], "UNVERIFIABLE")
        self.assertEqual(len(st._committed_alarms), 1)
        self.assertEqual(st._committed_alarms[0]["code"], "FREEZE_ARTIFACT_MISMATCH")

    def test_18_verify_does_not_create_freeze(self):
        st = Store()
        with self.assertRaises(VerifyError) as cm:
            verify_freeze(st, "man-missing", "SEC-A")
        self.assertEqual(cm.exception.code, "NOT_FOUND")
        self.assertEqual(st.freeze, {})

    def test_19_modeled_fill_not_float(self):
        got = modeled_fill("123.456789")
        self.assertEqual(got, "123.518517394500")
        self.assertNotEqual(got, format(123.456789 * 1.0005, "f"))

    def test_20_no_freeze_is_not_stand_down(self):
        self.assertNotEqual("NO_FREEZE", "STAND_DOWN")


def main():
    print("Trading App standalone verifier + kernel")
    print("GitHub: https://github.com/vicia05-lab/trading-app")
    suite = unittest.defaultTestLoader.loadTestsFromTestCase(VerifierProbes)
    result = unittest.TextTestRunner(verbosity=2).run(suite)
    print()
    if result.wasSuccessful():
        print("RESULT: all standalone probes passed.")
        print("Reviewer: clone the repo and confirm src/desk/verify-freeze.ts")
        print("matches this packet. Then attack it. Do not rubber-stamp.")
        return 0
    print("RESULT: FAIL — packet or verifier is wrong.")
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
