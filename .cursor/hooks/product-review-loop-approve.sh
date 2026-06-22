#!/usr/bin/env bash
# Mark consolidator output approved → Layer 2 contract PR (not validation).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"
SESSION="docs/product-review/.product-review-session.json"
python3 - <<'PY'
import json
import sys
from pathlib import Path

sys.path.insert(0, ".cursor/hooks")
from product_review_auto_pass import evaluate
from product_review_chain_lib import mark_manual_approved, load_session, save_session

p = Path("docs/product-review/.product-review-session.json")
s = load_session()
if not s:
    print("No session", file=sys.stderr)
    sys.exit(1)

verdict = (s.get("pre_approve_verdict") or "").lower()
if s.get("pre_approve_review_enabled") and verdict in ("revise_consolidator", "block"):
    print(f"Refusing approve: pre_approve_verdict={verdict}", file=sys.stderr)
    print(f"Read: {s.get('pre_approve_review_path', 'docs/product-review/consolidated/*-pre-approve-review.md')}", file=sys.stderr)
    sys.exit(1)
if s.get("pre_approve_review_enabled") and not s.get("pre_approve_review_path"):
    print("Warning: no pre-approve review on file — run pre-approve reviewer first.", file=sys.stderr)
    print("Continue only if you intentionally skipped Layer 1.5.", file=sys.stderr)

# Optional: warn if auto-pass would have blocked (human override)
if s.get("auto_pass_enabled", True):
    ev = evaluate(s)
    if not ev.get("eligible"):
        print("Note: auto-pass would block — human override approve", file=sys.stderr)
        for r in ev.get("stop_reasons") or []:
            print(f"  - {r}", file=sys.stderr)

mark_manual_approved(s)
print("Product review approved — Layer 2 contract PR next")
if verdict:
    print(f"pre_approve_verdict={verdict}")
PY
python3 .cursor/hooks/product-review-chain-next.py
