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
