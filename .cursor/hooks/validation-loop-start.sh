#!/usr/bin/env bash
# Start an automated Validator → Fixer → Validator chain for one contract.
# Usage:
#   ./.cursor/hooks/validation-loop-start.sh flow-rally-session
#   ./.cursor/hooks/validation-loop-start.sh flow-availability-poll --builder

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

CONTRACT_ID="${1:-}"
AUTO_BUILDER="false"

if [[ -z "$CONTRACT_ID" ]]; then
  echo "Usage: $0 <contract-id> [--builder]"
  echo "Example: $0 flow-rally-session"
  echo "Contract ids match docs/contracts/<id>.md (no .md suffix)."
  exit 1
fi

shift || true
for arg in "$@"; do
  if [[ "$arg" == "--builder" ]]; then
    AUTO_BUILDER="true"
  fi
done

CONTRACT_PATH="docs/contracts/${CONTRACT_ID}.md"
if [[ ! -f "$CONTRACT_PATH" ]]; then
  echo "Missing contract: $CONTRACT_PATH"
  exit 1
fi

SESSION_FILE="docs/contracts/.validation-session.json"
mkdir -p docs/contracts

python3 - <<PY
import json
from pathlib import Path

auto_builder = "${AUTO_BUILDER}" == "true"
session = {
    "contract_id": "${CONTRACT_ID}",
    "contract_path": "${CONTRACT_PATH}",
    "phase": "started",
    "status": "running",
    "failed_rows": [],
    "fixer_round": 0,
    "max_fixer_rounds": 3,
    "chain_enabled": True,
    "auto_builder": auto_builder,
}
Path("${SESSION_FILE}").write_text(json.dumps(session, indent=2) + "\\n")
PY

chmod +x .cursor/hooks/contract-validation-chain.py 2>/dev/null || true

cat <<EOF

══════════════════════════════════════════════════════════════
 Rally validation chain STARTED: ${CONTRACT_ID}
══════════════════════════════════════════════════════════════

 ONE chat only — paste the prompt below into Cursor Agent.
 The stop hook will auto-submit Fixer / re-Validator in the SAME chat.

 Prerequisites:
   • hooks.json uses contract-validation-chain.py (see .cursor/hooks/README.md)
   • Metro + iOS sim running

 Stop chain anytime:
   ./.cursor/hooks/validation-loop-stop.sh

──────────────────────────────────────────────────────────────
 COPY FROM HERE → Cursor Agent (single chat)
──────────────────────────────────────────────────────────────

You are the Validator agent for Rally contract validation.

Read:
- RallyApp/${CONTRACT_PATH}
- RallyApp/.cursor/workflows/validate-contract.md
- RallyApp/docs/store-review-test-accounts.md

Validate on iOS simulator (Monrovia demo seed). Do not fix app code.

Steps:
1. npm start + iOS sim booted
2. Seed if needed: node scripts/seed-monrovia-basketball-rally-demo.mjs
3. Run every checklist row in the contract
4. Save screenshots to docs/contracts/screenshots/${CONTRACT_ID}/
5. Return full pass/fail markdown table + failed rows only

When finished, write RallyApp/docs/contracts/.validation-session.json with:
- contract_id: "${CONTRACT_ID}"
- contract_path: "${CONTRACT_PATH}"
- phase: "validator_done"
- status: "pass" OR "fail" OR "needs_builder"
- failed_rows: array of failed checklist lines (empty if pass)
- fixer_round: 0
- max_fixer_rounds: 3
- chain_enabled: true

──────────────────────────────────────────────────────────────

After you paste once:
  • Fail → hook submits Fixer in same chat → then Validator again (up to 3 Fixer rounds)
  • Pass → hook replies VALIDATION_GREEN and stops
  • needs_builder → chain pauses (use --builder on start to auto-chain Builder)

Next contract when green:
  ./.cursor/hooks/validation-loop-start.sh <next-contract-id>

EOF
