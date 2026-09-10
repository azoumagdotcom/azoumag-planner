#!/usr/bin/env python3
"""AZOUMAG Planner — mint license keys.

Format: AZOUMAG-PRO-<8-char-id>-<12-hex-hmac>
Signature: first 12 hex chars of HMAC-SHA256(SECRET, "PRO:<id>")

Usage:
    python tools/gen-license.py                # random ID
    python tools/gen-license.py CUST0001       # explicit ID (A-Z0-9, 8 chars)
    python tools/gen-license.py --count 10     # bulk
    python tools/gen-license.py --verify KEY   # check a key
"""
import argparse
import hmac
import hashlib
import re
import secrets
import string
import sys

SECRET = b'azoumag-planner-v1-2026-secret'  # keep in sync with js/license.js
ID_ALPHABET = string.ascii_uppercase + string.digits
KEY_RE = re.compile(r'^AZOUMAG-PRO-([A-Z0-9]{8})-([A-F0-9]{12})$', re.IGNORECASE)


def sign(cust_id: str) -> str:
    return hmac.new(SECRET, f'PRO:{cust_id}'.encode(), hashlib.sha256).hexdigest()[:12]


def mint(cust_id: str | None = None) -> str:
    cid = (cust_id or ''.join(secrets.choice(ID_ALPHABET) for _ in range(8))).upper()
    if not re.fullmatch(r'[A-Z0-9]{8}', cid):
        raise ValueError(f'ID must be 8 chars A-Z0-9, got {cid!r}')
    return f'AZOUMAG-PRO-{cid}-{sign(cid)}'


def verify(key: str) -> bool:
    m = KEY_RE.match(key.strip())
    if not m:
        return False
    cid, sig = m.group(1).upper(), m.group(2).lower()
    return sig == sign(cid)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument('id', nargs='?', help='explicit customer ID (8 chars A-Z0-9)')
    ap.add_argument('--count', type=int, default=1, help='bulk count')
    ap.add_argument('--verify', metavar='KEY', help='verify a key and exit')
    args = ap.parse_args()

    if args.verify:
        ok = verify(args.verify)
        print('valid' if ok else 'invalid')
        return 0 if ok else 1

    for _ in range(args.count):
        print(mint(args.id))
        if args.id:  # explicit ID → single output
            break
    return 0


if __name__ == '__main__':
    sys.exit(main())


def _selfcheck():
    """ponytail: minimal check — mint then verify a key round-trips."""
    k = mint('TESTID01')
    assert k == f'AZOUMAG-PRO-TESTID01-{sign("TESTID01")}', k
    assert verify(k), 'freshly minted key must verify'
    assert not verify('AZOUMAG-PRO-TESTID01-000000000000'), 'bad sig must fail'
    assert not verify('garbage'), 'garbage must fail'
    print('selfcheck ok:', k)
