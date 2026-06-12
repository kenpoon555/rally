# Workflow: Deploy Supabase

Project ref: **`casljueycxsqexpkdiuq`** (preview; adjust if prod differs)

## Migrations

```bash
cd RallyApp
supabase db push --linked
# or for a single file:
supabase db query -f supabase/migrations/NNN_name.sql --linked
```

## Edge functions

```bash
supabase functions deploy send-push --project-ref casljueycxsqexpkdiuq
supabase functions deploy sport-landing --project-ref casljueycxsqexpkdiuq
supabase functions deploy game-invite --project-ref casljueycxsqexpkdiuq --no-verify-jwt
```

## Secrets (one-time / rotate)

```bash
supabase secrets list --project-ref casljueycxsqexpkdiuq
supabase secrets set FIREBASE_SERVER_KEY="..." --project-ref casljueycxsqexpkdiuq
# Invite landing install buttons (run scripts/fetch-beta-install-urls.mjs to print current URLs):
supabase secrets set IOS_INSTALL_URL="https://testflight.apple.com/join/gBcW7gA2" ANDROID_INSTALL_URL="https://play.google.com/store/apps/details?id=app.rally.sports" --project-ref casljueycxsqexpkdiuq
```

## After deploy

- Update `docs/PUSH_NOTIFICATIONS.md` if push types changed
- Smoke-test on physical device if push or auth changed
