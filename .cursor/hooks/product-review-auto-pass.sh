#!/usr/bin/env bash
# Evaluate or apply auto-pass (wrapper).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"
exec python3 .cursor/hooks/product_review_auto_pass.py "$@"
