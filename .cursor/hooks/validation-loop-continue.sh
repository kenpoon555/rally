#!/usr/bin/env bash
# Re-trigger the next validation-chain step when the stop hook did not fire
# (e.g. you messaged the Agent mid-turn, or Validator asked you to "tell Fixer" instead of stopping).
#
# Usage:
#   ./.cursor/hooks/validation-loop-continue.sh
# Agent:
#   Run ./.cursor/hooks/validation-loop-continue.sh and execute the printed role in this same turn.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

SESSION="docs/contracts/.validation-session.json"
if [[ ! -f "$SESSION" ]]; then
  echo "No session file. Start with validation-loop-start.sh"
  exit 1
fi

MSG=$(echo '{}' | .cursor/hooks/contract-validation-chain.py | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('followup_message',''))")

if [[ -z "$MSG" ]]; then
  python3 - <<'PY'
import json
from pathlib import Path
s = json.loads(Path("docs/contracts/.validation-session.json").read_text())
print(f"Chain idle. phase={s.get('phase')} status={s.get('status')} chain_enabled={s.get('chain_enabled')}")
print("If blocked: fix issue then validation-loop-start.sh --queue ... --from", s.get("contract_id"))
PY
  exit 0
fi

echo "══════════════════════════════════════════════════════════════"
echo " Next chain step (hook missed — run in Agent this turn):"
echo "══════════════════════════════════════════════════════════════"
echo ""
echo "$MSG"
