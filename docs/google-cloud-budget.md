# Google Cloud budget (Maps / Places)

## What is configured (via gcloud)

Two monthly budgets were created:

| Budget name | Billing account | Amount | Scope |
|-------------|-----------------|--------|--------|
| **Rally Maps monthly** | My Maps Billing Account (`017C25-458147-D932DD`) | $25 USD | Entire Maps billing account (Places/Maps keys) |
| **Rally app GCP monthly** | Rally_PV (`015239-72EFFC-170BB1`) | $25 USD | Project `rally-485403` only |

Alerts at **50%, 90%, and 100%** — email goes to billing account admins in [Billing → Budgets](https://console.cloud.google.com/billing/budgets).

**Note:** `rally-32e72` (Firebase) currently has **billing disabled** on GCP; push/FCM still works on Spark. Maps/Places keys may live under the Maps billing account or `rally-485403` — check **APIs & Services → Credentials** for which project owns each key.

## Verify in console

1. [Google Cloud Console → Billing → Budgets](https://console.cloud.google.com/billing/budgets)
2. Confirm **Rally Maps and Places monthly** appears.

## CLI (re-create or update)

```bash
gcloud config set project rally-32e72
gcloud services enable billingbudgets.googleapis.com --project=rally-32e72

gcloud billing budgets list --billing-account=017C25-458147-D932DD

gcloud billing budgets create \
  --billing-account=017C25-458147-D932DD \
  --display-name="Rally Maps and Places monthly" \
  --budget-amount=25USD \
  --threshold-rule=percent=0.5 \
  --threshold-rule=percent=0.9 \
  --threshold-rule=percent=1.0 \
  --filter-projects=projects/rally-32e72 \
  --filter-projects=projects/rally-485403
```

If `billing budgets` fails with quota-project errors, run:

```bash
gcloud auth application-default login
gcloud auth application-default set-quota-project rally-32e72
```

## Also recommended (console)

- **APIs & Services → Credentials**: restrict Maps/Places keys to `com.rallyapp` (iOS + Android).
- Enable only: Maps SDK for iOS/Android, Places API.
- Set **daily quota** on Places in dev to avoid surprise bills.
