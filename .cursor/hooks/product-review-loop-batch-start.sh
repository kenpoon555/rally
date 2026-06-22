#!/usr/bin/env bash
# Overnight / batch mode: one branch, chain validation queues, ONE PR at end.
#
#   ./.cursor/hooks/product-review-loop-batch-start.sh --loop overnight-batch-jun-2026
#
# Skips mid-loop contract PR and per-queue src PR unless batch_pr_split_reason is set.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

LOOP_NAME=""
BRANCH=""
FROM_DEV=1
QUEUES_ARGS=()
ALREADY_ARGS=()

usage() {
  cat <<'EOF'
Usage:
  ./.cursor/hooks/product-review-loop-batch-start.sh --loop overnight-batch-jun-2026
  ./.cursor/hooks/product-review-loop-batch-start.sh --branch fix/my-batch --queue baseline

Batch PR: contracts + src on one branch → chain validation → ONE gh pr create at end.
EOF
  exit 1
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --loop) LOOP_NAME="${2:-}"; shift 2 ;;
    --branch) BRANCH="${2:-}"; shift 2 ;;
    --queue) QUEUES_ARGS+=("${2:-}"); shift 2 ;;
    --already-green) ALREADY_ARGS+=("${2:-}"); shift 2 ;;
    --no-checkout) FROM_DEV=0; shift ;;
    -h|--help) usage ;;
    *) usage ;;
  esac
done

[[ -n "$LOOP_NAME" || ( -n "$BRANCH" && ${#QUEUES_ARGS[@]} -gt 0 ) ]] || usage

export QUEUES_CLI="${QUEUES_ARGS[*]+${QUEUES_ARGS[*]}}"
export ALREADY_CLI="${ALREADY_ARGS[*]+${ALREADY_ARGS[*]}}"

read -r BRANCH_OUT FIRST_QUEUE QUEUES_JSON ALREADY_JSON < <(
  LOOP_NAME="$LOOP_NAME" BRANCH_IN="$BRANCH" QUEUES_CLI="${QUEUES_ARGS[*]+${QUEUES_ARGS[*]}}" ALREADY_CLI="${ALREADY_ARGS[*]+${ALREADY_ARGS[*]}}" python3 - <<'PY'
import json, os
from datetime import datetime, timezone
from pathlib import Path
import sys

loop_name = os.environ.get("LOOP_NAME", "")
branch = os.environ.get("BRANCH_IN", "")
queues = [q for q in os.environ.get("QUEUES_CLI", "").split() if q]
already = [q for q in os.environ.get("ALREADY_CLI", "").split() if q]

if loop_name:
    L = json.loads(Path("docs/release-loops.json").read_text())[loop_name]
    branch = branch or L.get("builder_branch", "fix/overnight-batch")
    if not queues:
        queues = L.get("validation_queues") or []
    if not already:
        already = L.get("already_green_validation_queues") or []

if not branch or not queues:
    sys.exit("Need --loop or --branch + --queue")

session = {
    "queue_name": loop_name or "batch",
    "consolidator_tag": loop_name or "batch",
    "batch_pr": True,
    "batch_validation_queues": queues,
    "batch_validation_completed": already,
    "batch_pr_split_on": ["conflict", "needs_human", "blocked_external", "max_fixer_rounds"],
    "builder_branch": branch,
    "validation_queue": queues[0],
    "chain_enabled": True,
    "assign_mode": "agent",
    "phase": "validation_spawned",
    "status": "running",
    "layer_2_status": "local",
    "layer_3_status": None,
    "layer_2_builder_status": "local_ready",
    "updated_at": datetime.now(timezone.utc).isoformat(),
}
Path("docs/product-review/.product-review-session.json").write_text(json.dumps(session, indent=2) + "\n")
print(branch, queues[0], json.dumps(queues), json.dumps(already))
PY
)

BRANCH="$BRANCH_OUT"

if [[ "$FROM_DEV" == "1" ]]; then
  git fetch origin dev 2>/dev/null || true
  if git show-ref --verify --quiet "refs/heads/$BRANCH"; then
    git checkout "$BRANCH"
  else
    git checkout dev
    git pull origin dev 2>/dev/null || true
    git checkout -b "$BRANCH"
  fi
fi

chmod +x .cursor/hooks/validation-loop-start.sh 2>/dev/null || true

echo "batch_pr ON · branch=$BRANCH · queues=$QUEUES_JSON · already_green=$ALREADY_JSON"
echo ""
echo "Next: ./.cursor/hooks/validation-loop-start.sh --queue ${FIRST_QUEUE} --builder"
echo "      (agent self-chains; ONE PR at batch_pr_ready)"
echo ""
python3 .cursor/hooks/product-review-chain-next.py
