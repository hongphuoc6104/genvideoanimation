#!/usr/bin/env python3
"""Read-only verifier for this frozen plan. Never regenerates checksums."""
from pathlib import Path
import hashlib
import sys

root = Path(__file__).resolve().parent
manifest = root / 'SHA256SUMS'
if not manifest.is_file():
    sys.exit('FAIL: missing SHA256SUMS')
expected = {}
for line in manifest.read_text(encoding='utf-8').splitlines():
    digest, relative = line.split('  ', 1)
    rel = Path(relative)
    if rel.is_absolute() or '..' in rel.parts or relative in expected:
        sys.exit('FAIL: invalid/duplicate manifest path')
    expected[relative] = digest
errors = []
actual = set()
for path in root.rglob('*'):
    relative = path.relative_to(root).as_posix()
    if path.is_symlink():
        errors.append(f'symlink: {relative}')
    elif path.is_file() and relative != 'SHA256SUMS':
        actual.add(relative)
for relative, digest in expected.items():
    path = root / relative
    if path.is_symlink() or not path.is_file():
        errors.append(f'missing/nonregular: {relative}')
    elif hashlib.sha256(path.read_bytes()).hexdigest() != digest:
        errors.append(f'changed: {relative}')
for relative in sorted(actual - expected.keys()):
    errors.append(f'unexpected: {relative}')
if errors:
    print('\n'.join(errors))
    sys.exit(1)
print(f'OK: {len(expected)} files match; no unexpected files; read-only verification.')
print('Manifest SHA-256:', hashlib.sha256(manifest.read_bytes()).hexdigest())
