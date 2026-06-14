#!/usr/bin/env bash
# Start an automated Validator → Fixer → Validator chain for one contract.
#
# Recommended (one Agent chat forever):
#   Tell Agent: "Run ./.cursor/hooks/validation-loop-start.sh flow-rally-session
#   and complete Validator in this same turn."
#
# Usage:
#   ./.cursor/hooks/validation-loop-start.sh flow-rally-session
#   ./.cursor/hooks/validation-loop-start.sh flow-availability-poll --builder
#   ./.cursor/hooks/validation-loop-start.sh flow-rally-session --paste   # full prompt for copy/paste
#   ./.cursor/hooks/validation-loop-start.sh flow-rally-session --quiet   # session file only

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

CONTRACT_ID="${1:-}"
AUTO_BUILDER="false"
MODE="agent"

if [[ -z "$CONTRACT_ID" ]]; then
  echo "Usage: $0 <contract-id> [--builder] [--paste | --quiet]"
  echo "Example: $0 flow-rally-session"
  echo "Contract ids match docs/contracts/<id>.md (no .md suffix)."
  echo ""
  echo "Recommended: stay in one Agent chat and say:"
  echo "  Run ./.cursor/hooks/validation-loop-start.sh <contract-id> and complete Validator this turn."
  exit 1
fi

shift || true
for arg in "$@"; do
  case "$arg" in
    --builder) AUTO_BUILDER="true" ;;
    --paste) MODE="paste" ;;
    --quiet) MODE="quiet" ;;
  esac
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

if [[ "$MODE" == "quiet" ]]; then
  echo "validation-session-ready contract_id=${CONTRACT_ID} path=${CONTRACT_PATH} chain_enabled=true"
  exit 0
fi

if [[ "$MODE" == "paste" ]]; then
  cat <<EOF

Chain started: ${CONTRACT_ID}
Paste into Agent (only if not running the script from Agent):

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

EOF
  exit 0
fi

# Default: agent mode — Agent ran this script or user forwards one line to Agent
cat <<EOF
validation-chain-started contract_id=${CONTRACT_ID} session=${SESSION_FILE}

Continue in THIS Agent turn as Validator (do not wait for another user message):

1. Read ${CONTRACT_PATH}, .cursor/workflows/validate-contract.md, docs/store-review-test-accounts.md
2. Validate on iOS simulator (Monrovia demo). Do not fix app code unless a later hook message says Fixer.
3. Screenshots → docs/contracts/screenshots/${CONTRACT_ID}/
4. Return pass/fail table + failed rows only
5. Write ${SESSION_FILE} with phase "validator_done", status "pass"|"fail"|"needs_builder", failed_rows, fixer_round 0, chain_enabled true

Hook behavior after you stop (same chat):
  pass → VALIDATION_GREEN, chain stops
  fail → Fixer auto-followup, then Validator again (max 3 Fixer rounds)
  needs_builder → pauses${AUTO_BUILDER:+ (auto_builder enabled — Builder will chain)}

Stop chain: ./.cursor/hooks/validation-loop-stop.sh
Next contract when green: ./.cursor/hooks/validation-loop-start.sh <next-id>
EOF
