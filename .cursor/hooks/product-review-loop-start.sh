#!/usr/bin/env bash
# Start a product-review persona queue (Layer 1 loop).
#
#   ./.cursor/hooks/product-review-loop-start.sh --queue onboarding-round1
#   ./.cursor/hooks/product-review-loop-start.sh --queue pickup-round1 --from parent-first-child
#
# One persona per Agent chat (or one human reviewer). After each review.md,
# run product-review-chain-next.py to advance.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

QUEUES_FILE="docs/product-review/review-queues.json"
SESSION_FILE="docs/product-review/.product-review-session.json"
QUEUE_NAME=""
FROM_PERSONA=""
MODE="agent"
CHAIN_ENABLED="true"
ASSIGN_MODE="agent"

usage() {
  cat <<EOF
Usage:
  $0 --queue <name> [--from <persona-id>] [--chain | --no-chain] [--human-assign] [--status] [--quiet]

  --chain        Agent self-chains personas → consolidator (default: on)
  --no-chain     One persona per chat/human (multi-reviewer mode)
  --human-assign Same as --no-chain

Queues (see ${QUEUES_FILE}):
  onboarding-round1     Tier 1 — 6 role personas → cps-onboarding
  pickup-round1         Tier 1 — 6 pickup personas → gtm2 validation
  onboarding-round2-picky Tier 2 — stricter onboarding
  pickup-round2-picky   Tier 2 — stricter pickup/host
  onboarding-round3-expert Tier 3 — expert / edge cases

After each persona review, agent updates ${SESSION_FILE} and runs:
  python3 .cursor/hooks/product-review-chain-next.py

Human assigns one persona per reviewer — not all 6 to one person.
EOF
  exit 1
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --queue) QUEUE_NAME="${2:-}"; shift 2 ;;
    --from) FROM_PERSONA="${2:-}"; shift 2 ;;
    --chain) CHAIN_ENABLED="true"; ASSIGN_MODE="agent"; shift ;;
    --no-chain|--human-assign) CHAIN_ENABLED="false"; ASSIGN_MODE="human"; shift ;;
    --status) MODE="status"; shift ;;
    --quiet) MODE="quiet"; shift ;;
    -h|--help) usage ;;
    *) usage ;;
  esac
done

[[ -n "$QUEUE_NAME" ]] || usage

eval "$(python3 - <<PY
import json, sys
from pathlib import Path

queues = json.loads(Path("${QUEUES_FILE}").read_text())
name = "${QUEUE_NAME}"
chain = "${CHAIN_ENABLED}" == "true"
assign = "${ASSIGN_MODE}"
if name not in queues:
    print(f'echo "Unknown queue: {name}" >&2; exit 1', file=sys.stderr)
    sys.exit(1)
q = queues[name]
personas = q["personas"]
from_id = "${FROM_PERSONA}"
if from_id:
    if from_id not in personas:
        print(f'echo "--from {from_id} not in queue" >&2; exit 1', file=sys.stderr)
        sys.exit(1)
    idx = personas.index(from_id)
else:
    idx = 0
    from_id = personas[0]

session = {
    "queue_name": name,
    "tier": q.get("tier", 1),
    "personas": personas,
    "persona_index": idx,
    "current_persona_id": from_id,
    "reviews_completed": [],
    "min_reviews_before_consolidate": q.get("min_reviews_before_consolidate", len(personas)),
    "consolidator_tag": q.get("consolidator_tag", name),
    "validation_queue": q.get("validation_queue", "baseline"),
    "contract_focus": q.get("contract_focus", []),
    "requires_prior_queue": q.get("requires_prior_queue"),
    "chain_enabled": chain,
    "assign_mode": assign,
    "phase": "persona_pending",
    "status": "running",
    "synthesis_path": None,
    "pre_approve_review_enabled": chain,
    "auto_pass_enabled": chain,
    "pre_approve_verdict": None,
    "pre_approve_review_path": None,
    "auto_passed": False,
    "layer_2_status": None,
    "layer_2_pr": None,
    "contract_pr_branch": f"docs/{q.get('consolidator_tag', name)}-contracts-product-review",
}
Path("${SESSION_FILE}").write_text(json.dumps(session, indent=2) + "\\n")
print(f'PERSONA_ID="{from_id}"')
print(f'QUEUE_LEN="{len(personas)}"')
print(f'QUEUE_POS="{idx + 1}"')
print(f'TIER="{q.get("tier", 1)}"')
PY
)"

chmod +x .cursor/hooks/product-review-chain-next.py 2>/dev/null || true

if [[ "$MODE" == "status" ]]; then
  python3 .cursor/hooks/product-review-chain-next.py 2>/dev/null | head -5
  exit 0
fi

if [[ "$MODE" == "quiet" ]]; then
  echo "product-review-session-ready queue=${QUEUE_NAME} persona=${PERSONA_ID} tier=${TIER}"
  exit 0
fi

python3 .cursor/hooks/product-review-chain-next.py

cat <<EOF

---
$(if [[ "$CHAIN_ENABLED" == "true" ]]; then echo "Agent self-chain ON — complete personas → consolidator in ONE turn when sim-only."; else echo "Human assign mode — one persona per reviewer."; fi)
Progress: ${SESSION_FILE}
Master loop: docs/product-review/MASTER-LOOP.md
EOF
