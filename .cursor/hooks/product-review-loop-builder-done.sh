#!/usr/bin/env bash
# After Builder completes B1–B6 — advance to validation spawn.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"
python3 - <<'PY'
import json
from pathlib import Path
from datetime import datetime, timezone

p = Path("docs/product-review/.product-review-session.json")
s = json.loads(p.read_text())
s["phase"] = "builder_done"
s["status"] = "running"
s["layer_2_builder_status"] = "done"
s["updated_at"] = datetime.now(timezone.utc).isoformat()
p.write_text(json.dumps(s, indent=2) + "\n")
print("Builder marked done — run product-review-chain-next.py for validation spawn")
PY
python3 .cursor/hooks/product-review-chain-next.py
