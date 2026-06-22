#!/usr/bin/env bash
# After Layer 2 contract PR merges to dev — advance to Builder spawn.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"
python3 - <<'PY'
import json
from pathlib import Path
from datetime import datetime, timezone

p = Path("docs/product-review/.product-review-session.json")
s = json.loads(p.read_text())
if s.get("phase") not in ("contract_pr_open", "contract_pr_pending", "approved"):
    print(f"Note: phase={s.get('phase')} — continuing anyway", flush=True)
s["phase"] = "contract_merged"
s["status"] = "running"
s["layer_2_status"] = "merged"
s["updated_at"] = datetime.now(timezone.utc).isoformat()
p.write_text(json.dumps(s, indent=2) + "\n")
print("Layer 2 contract PR marked merged — run product-review-chain-next.py for Builder spawn")
PY
python3 .cursor/hooks/product-review-chain-next.py
