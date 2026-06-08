# Google Cloud budget (Maps / Places)

Project for Maps/Places keys: **`rally-485403`** (project number `961839018577`).

## What is configured

### Billing alerts (not hard stops)

| Budget name | Billing account | Amount | Scope |
|-------------|-----------------|--------|--------|
| **Rally Maps monthly** | My Maps Billing Account (`017C25-458147-D932DD`) | $25 USD | Entire Maps billing account |
| **Rally app GCP monthly** | Rally_PV (`015239-72EFFC-170BB1`) | Project `rally-485403` | $25 USD |

Alerts at **50%, 90%, and 100%** — email only. Usage can still exceed $25.

Verify: [Billing → Budgets](https://console.cloud.google.com/billing/budgets)

### Daily API quotas (hard stops)

Applied on **`rally-485403`** via Service Usage consumer overrides:

| Service | Metric | Limit | Notes |
|---------|--------|-------|--------|
| Places API (legacy) | `billable_default` | **500/day** | Text Search + Place Details |
| Places API (legacy) | `billable_default` | **60/min** | Burst protection |
| Maps SDK iOS | `map_load_requests` | **3,000/day** | Create Game map |
| Maps SDK Android | `map_load_requests` | **3,000/day** | Create Game map |

When exceeded, Google returns `OVER_QUERY_LIMIT` — the app shows a friendly message.

Re-apply or update quotas:

```bash
cd RallyApp
chmod +x scripts/set-google-places-quotas.sh
./scripts/set-google-places-quotas.sh
```

Or manually in [Places API quotas](https://console.cloud.google.com/apis/api/places-backend.googleapis.com/quotas?project=rally-485403).

### API keys (`rally-485403`)

| Key | Platform | Restriction |
|-----|----------|-------------|
| `Rally iOS` | iOS | Bundle **`com.rallyapp`** + Places + Maps iOS |
| `Rally Android` | Android | Package **`com.rallyapp`** + debug SHA-1 + Places + Maps Android |

**Fixed (2026-06-08):** iOS key previously allowed `org.reactjs.native.example.RallyApp` — caused `REQUEST_DENIED` on simulator/device.

Keys are loaded from `.env`:

- `GOOGLE_PLACES_API_KEY_IOS`
- `GOOGLE_PLACES_API_KEY_ANDROID`

Rebuild the app after changing `.env`.

### Client-side throttling (app)

In addition to GCP quotas, the app limits Places calls per session:

| Config | Default | Purpose |
|--------|---------|---------|
| `GOOGLE_PLACES_MIN_INTERVAL_MS` | 2000 | Min gap between requests |
| `GOOGLE_PLACES_SESSION_MAX_REQUESTS` | 12 | Max calls per app session |
| `GOOGLE_PLACES_CACHE_TTL_MS` | 300000 | Cache nearby results 5 min |

Implementation: `src/services/api/googlePlacesLimiter.ts`

## Enabled APIs

On `rally-485403`:

- Places API (`places-backend.googleapis.com`)
- Places API (New) (`places.googleapis.com`)
- Maps SDK for iOS / Android
- Geocoding API

## CLI reference

```bash
gcloud config set project rally-485403

# List keys
gcloud services api-keys list --project=rally-485403

# Check effective daily Places quota
TOKEN=$(gcloud auth print-access-token)
curl -H "Authorization: Bearer $TOKEN" \
  "https://serviceusage.googleapis.com/v1beta1/projects/961839018577/services/places-backend.googleapis.com/consumerQuotaMetrics/places-backend.googleapis.com%2Fbillable_default/limits/%2Fd%2Fproject"
```

## Also recommended

- Keep seeding LA courts (`scripts/seed-la-courts.mjs`) so most hosts never hit Places.
- `$200/month` Maps Platform credit still applies on top of quotas.
