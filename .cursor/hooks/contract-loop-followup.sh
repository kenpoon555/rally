#!/usr/bin/env bash
# Opt-in hook: after agent stop, optionally submit a follow-up prompt for contract validation.
# Enable by copying hooks.json.example → hooks.json (see README.md).

set -euo pipefail

input=$(cat)

# Set to a contract id under docs/contracts/ (without .md), or leave empty to disable.
RALLY_CONTRACT="${RALLY_CONTRACT:-}"

if [[ -z "$RALLY_CONTRACT" ]]; then
  echo '{}'
  exit 0
fi

contract_path="docs/contracts/${RALLY_CONTRACT}.md"
if [[ ! -f "$contract_path" ]]; then
  echo '{}'
  exit 0
fi

# Only chain when the user explicitly enabled a contract loop for this session.
if [[ "${RALLY_CONTRACT_LOOP:-}" != "1" ]]; then
  echo '{}'
  exit 0
fi

cat <<EOF
{
  "followup_message": "Continue contract validation for ${RALLY_CONTRACT}. Read ${contract_path} and .cursor/workflows/validate-contract.md. You are the Validator — return an updated pass/fail table only; do not fix code unless a row is marked Fixer-required."
}
EOF
