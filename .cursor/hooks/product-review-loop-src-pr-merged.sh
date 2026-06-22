#!/usr/bin/env bash
# After src PR merges to dev — mark onboarding round complete.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"
python3 - <<'PY'
import json
from pathlib import Path
from datetime import datetime, timezone

p = Path("docs/product-review/.product-review-session.json")
s = json.loads(p.read_text())
s["phase"] = "src_pr_merged"
s["status"] = "complete"
s["layer_2_builder_status"] = "merged"
s["updated_at"] = datetime.now(timezone.utc).isoformat()
p.write_text(json.dumps(s, indent=2) + "\n")
print("Src PR merged — round complete")
PY
python3 .cursor/hooks/product-review-chain-next.py
