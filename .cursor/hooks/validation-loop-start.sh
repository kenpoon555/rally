#!/usr/bin/env bash
# Start automated Validator → Fixer → Validator chain (one or many contracts).
#
# Single contract:
#   ./.cursor/hooks/validation-loop-start.sh flow-rally-session
#
# Full baseline queue (5 contracts, one Agent chat):
#   ./.cursor/hooks/validation-loop-start.sh --queue baseline --from flow-rally-session
#
# Agent one-liner:
#   Run ./.cursor/hooks/validation-loop-start.sh --queue baseline --from flow-rally-session
#   and complete Validator this turn.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

QUEUES_FILE="docs/contracts/validation-queues.json"
SESSION_FILE="docs/contracts/.validation-session.json"
AUTO_BUILDER="false"
MODE="agent"
QUEUE_NAME=""
FROM_ID=""
CONTRACT_ID=""

usage() {
  cat <<EOF
Usage:
  $0 <contract-id> [--builder] [--paste | --quiet]
  $0 --queue <name> [--from <contract-id>] [--builder] [--paste | --quiet]

Queues (see ${QUEUES_FILE}):
  baseline   Loop A/B + hub + inbox + play-screen (5)
  phase1a    attendance, host-nudges, analytics (3)
  phase1b    availability-poll (1)
  phase1c    rotation, tourney, leaderboard (3)

Agent:
  Run $0 --queue baseline --from flow-rally-session and complete Validator this turn.
EOF
  exit 1
}

ARGS=("$@")
i=0
while [[ $i -lt ${#ARGS[@]} ]]; do
  arg="${ARGS[$i]}"
  case "$arg" in
    --queue)
      i=$((i + 1))
      QUEUE_NAME="${ARGS[$i]:-}"
      ;;
    --from)
      i=$((i + 1))
      FROM_ID="${ARGS[$i]:-}"
      ;;
    --builder) AUTO_BUILDER="true" ;;
    --paste) MODE="paste" ;;
    --quiet) MODE="quiet" ;;
    --help|-h) usage ;;
    *)
      if [[ -z "$CONTRACT_ID" && -z "$QUEUE_NAME" ]]; then
        CONTRACT_ID="$arg"
      fi
      ;;
  esac
  i=$((i + 1))
done

if [[ -n "$QUEUE_NAME" ]]; then
  eval "$(python3 - <<PY
import json, sys
from pathlib import Path

queues = json.loads(Path("${QUEUES_FILE}").read_text())
name = "${QUEUE_NAME}"
if name not in queues:
    print(f'echo "Unknown queue: {name}" >&2; exit 1', file=sys.stderr)
    sys.exit(1)
full = queues[name]["contracts"]
from_id = "${FROM_ID}"
if from_id:
    if from_id not in full:
        print(f'echo "--from {from_id} not in queue" >&2; exit 1', file=sys.stderr)
        sys.exit(1)
    idx = full.index(from_id)
else:
    idx = 0
    from_id = full[0]

auto = "${AUTO_BUILDER}" == "true"
session = {
    "contract_id": from_id,
    "contract_path": f"docs/contracts/{from_id}.md",
    "phase": "started",
    "status": "running",
    "failed_rows": [],
    "fixer_round": 0,
    "max_fixer_rounds": 3,
    "chain_enabled": True,
    "auto_builder": auto,
    "queue_name": name,
    "queue": full,
    "queue_index": idx,
}
Path("${SESSION_FILE}").write_text(json.dumps(session, indent=2) + "\\n")
print(f'CONTRACT_ID="{from_id}"')
print(f'QUEUE_LEN="{len(full)}"')
print(f'QUEUE_POS="{idx + 1}"')
PY
)"
elif [[ -n "$CONTRACT_ID" ]]; then
  CONTRACT_PATH="docs/contracts/${CONTRACT_ID}.md"
  if [[ ! -f "$CONTRACT_PATH" ]]; then
    echo "Missing contract: $CONTRACT_PATH"
    exit 1
  fi
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
else
  usage
fi

CONTRACT_PATH="docs/contracts/${CONTRACT_ID}.md"
chmod +x .cursor/hooks/contract-validation-chain.py 2>/dev/null || true

if [[ "$MODE" == "quiet" ]]; then
  if [[ -n "$QUEUE_NAME" ]]; then
    echo "validation-session-ready queue=${QUEUE_NAME} contract_id=${CONTRACT_ID} chain_enabled=true"
  else
    echo "validation-session-ready contract_id=${CONTRACT_ID} chain_enabled=true"
  fi
  exit 0
fi

if [[ "$MODE" == "paste" ]]; then
  echo "Chain started: ${CONTRACT_ID}${QUEUE_NAME:+ (queue ${QUEUE_NAME})}"
  exit 0
fi

cat <<EOF
validation-chain-started contract_id=${CONTRACT_ID} session=${SESSION_FILE}${QUEUE_NAME:+ queue=${QUEUE_NAME} position=${QUEUE_POS:-1}/${QUEUE_LEN:-1}}

Continue in THIS Agent turn as Validator:

1. Read ${CONTRACT_PATH}, .cursor/workflows/validate-contract.md, docs/store-review-test-accounts.md
2. Validate on iOS simulator. Do not fix app code.
3. Screenshots → docs/contracts/screenshots/${CONTRACT_ID}/
4. Write ${SESSION_FILE} — preserve queue_name, queue, queue_index if present

On pass: ${QUEUE_NAME:+auto-advance to next contract in queue · }same chat
On fail: Fixer → Validator (max 3 Fixer rounds per contract)

Stop: ./.cursor/hooks/validation-loop-stop.sh
EOF
