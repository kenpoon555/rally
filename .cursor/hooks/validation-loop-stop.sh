#!/usr/bin/env bash
# Disable automated validation chain.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

SESSION_FILE="docs/contracts/.validation-session.json"

if [[ ! -f "$SESSION_FILE" ]]; then
  echo "No active session ($SESSION_FILE)."
  exit 0
fi

python3 - <<'PY'
import json
from pathlib import Path

path = Path("docs/contracts/.validation-session.json")
session = json.loads(path.read_text())
session["chain_enabled"] = False
session["phase"] = "stopped"
session["status"] = "stopped_by_user"
path.write_text(json.dumps(session, indent=2) + "\n")
print("Chain disabled. Existing chat follow-ups will not run.")
PY
