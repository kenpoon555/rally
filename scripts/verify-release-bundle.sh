#!/usr/bin/env bash
# Automated release bundle checks (CI-friendly). Does not replace device QA.
set -euo pipefail
cd "$(dirname "$0")/.."

echo "== npm test =="
npm test -- --watch=false

echo "== npm run lint =="
npm run lint

echo "== tsc: type check (non-blocking) =="
npx tsc --noEmit 2>&1 | tee /tmp/tsc-errors.txt || true
TSC_ERRORS=$(grep -c "error TS" /tmp/tsc-errors.txt || true)
echo "TypeScript errors: ${TSC_ERRORS} (fix before making this blocking)"

echo "== optional: EAS preview env (when EXPO_TOKEN is set) =="
bash ./scripts/check-eas-preview-env.sh || true

echo "== OK: automated bundle passed =="
