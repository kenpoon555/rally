#!/usr/bin/env bash
# Automated release bundle checks (CI-friendly). Does not replace device QA.
set -euo pipefail
cd "$(dirname "$0")/.."

echo "== npm test =="
npm test -- --watch=false

echo "== npm run lint =="
npm run lint

echo "== optional: EAS preview env (when EXPO_TOKEN is set) =="
bash ./scripts/check-eas-preview-env.sh || true

echo "== OK: automated bundle passed =="
