#!/usr/bin/env bash
# Human + orchestrator: one screen for "is the loop done? what next?"
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"
python3 .cursor/hooks/loop_status_lib.py --write
echo ""
cat docs/LOOP-STATUS.md
