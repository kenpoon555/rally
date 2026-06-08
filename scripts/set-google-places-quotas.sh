#!/usr/bin/env bash
# Apply Rally Maps/Places daily quotas and verify API key restrictions on rally-485403.
set -euo pipefail

PROJECT_ID="${GOOGLE_CLOUD_PROJECT:-rally-485403}"
PROJECT_NUMBER="$(gcloud projects describe "$PROJECT_ID" --format='value(projectNumber)')"
TOKEN="$(gcloud auth print-access-token)"

set_quota() {
  local SERVICE="$1"
  local METRIC_ENC="$2"
  local LIMIT_ENC="$3"
  local VALUE="$4"
  local PATH="projects/${PROJECT_NUMBER}/services/${SERVICE}/consumerQuotaMetrics/${METRIC_ENC}/limits/${LIMIT_ENC}"

  echo "→ ${SERVICE} ${LIMIT_ENC} = ${VALUE}"
  curl -sS -X POST \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "Content-Type: application/json" \
    "https://serviceusage.googleapis.com/v1beta1/${PATH}/consumerOverrides?force=true" \
    -d "{\"overrideValue\": \"${VALUE}\"}" | python3 -c "
import json,sys
r=json.load(sys.stdin)
print(r.get('name') or r.get('error',{}).get('message','unknown'))
"
}

echo "Project: ${PROJECT_ID} (${PROJECT_NUMBER})"

gcloud services enable \
  places-backend.googleapis.com \
  places.googleapis.com \
  maps-ios-backend.googleapis.com \
  maps-android-backend.googleapis.com \
  serviceusage.googleapis.com \
  --project="${PROJECT_ID}"

echo ""
echo "Setting daily / burst quotas…"

# Legacy Places Text Search + Place Details (what Add Court uses today)
set_quota "places-backend.googleapis.com" "places-backend.googleapis.com%2Fbillable_default" "%2Fd%2Fproject" "500"
set_quota "places-backend.googleapis.com" "places-backend.googleapis.com%2Fbillable_default" "%2Fmin%2Fproject" "60"

# Map tiles on Create Game
set_quota "maps-ios-backend.googleapis.com" "maps-ios-backend.googleapis.com%2Fmap_load_requests" "%2Fd%2Fproject" "3000"
set_quota "maps-android-backend.googleapis.com" "maps-android-backend.googleapis.com%2Fmap_load_requests" "%2Fd%2Fproject" "3000"

echo ""
echo "Fixing iOS API key bundle ID (com.rallyapp)…"
gcloud services api-keys update 5bb07856-f78f-4fdc-858d-41b49a51d7e0 \
  --project="${PROJECT_ID}" \
  --display-name="Rally iOS" \
  --allowed-bundle-ids=com.rallyapp \
  --api-target=service=places-backend.googleapis.com \
  --api-target=service=places.googleapis.com \
  --api-target=service=maps-ios-backend.googleapis.com \
  --api-target=service=geocoding-backend.googleapis.com

echo ""
echo "Done. Verify quotas:"
echo "  https://console.cloud.google.com/apis/api/places-backend.googleapis.com/quotas?project=${PROJECT_ID}"
