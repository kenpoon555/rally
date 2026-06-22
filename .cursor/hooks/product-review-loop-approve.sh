#!/usr/bin/env bash
# Mark consolidator output approved → print validation handoff.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"
SESSION="docs/product-review/.product-review-session.json"
python3 - <<'PY'
import json
import sys
from pathlib import Path
p = Path("docs/product-review/.product-review-session.json")
s = json.loads(p.read_text())
verdict = s.get("pre_approve_verdict")
if s.get("pre_approve_review_enabled") and verdict in ("revise_consolidator", "block"):
    print(f"Refusing approve: pre_approve_verdict={verdict}", file=sys.stderr)
    print(f"Read: {s.get('pre_approve_review_path', 'docs/product-review/consolidated/*-pre-approve-review.md')}", file=sys.stderr)
    sys.exit(1)
if s.get("pre_approve_review_enabled") and not s.get("pre_approve_review_path"):
    print("Warning: no pre-approve review on file — run pre-approve reviewer first.", file=sys.stderr)
    print("Continue only if you intentionally skipped Layer 1.5.", file=sys.stderr)
s["phase"] = "approved"
s["status"] = "approved"
p.write_text(json.dumps(s, indent=2) + "\n")
print("Product review approved — run product-review-chain-next.py for validation handoff")
if verdict:
    print(f"pre_approve_verdict={verdict}")
PY
python3 .cursor/hooks/product-review-chain-next.py
