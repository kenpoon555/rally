#!/usr/bin/env bash
# Print next chain step (primary recovery when hook misses OR agent self-chain bootstrap).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"
chmod +x .cursor/hooks/validation-chain-next.py 2>/dev/null || true
python3 .cursor/hooks/validation-chain-next.py "$@"
