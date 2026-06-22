#!/usr/bin/env bash
# After cps-onboarding (or configured queue) is green locally — allow src PR.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"
python3 - <<'PY'
import json
from pathlib import Path
from datetime import datetime, timezone

p = Path("docs/product-review/.product-review-session.json")
if not p.is_file():
    print("No product-review session", file=__import__("sys").stderr)
    raise SystemExit(1)
s = json.loads(p.read_text())
s["phase"] = "validation_green"
s["status"] = "running"
s["layer_3_status"] = "green"
s["updated_at"] = datetime.now(timezone.utc).isoformat()
p.write_text(json.dumps(s, indent=2) + "\n")
print("Validation green — src PR may open/merge (proof recorded locally)")
PY
python3 .cursor/hooks/product-review-chain-next.py
