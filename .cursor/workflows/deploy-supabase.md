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
```

## Secrets (one-time / rotate)

```bash
supabase secrets list --project-ref casljueycxsqexpkdiuq
supabase secrets set FIREBASE_SERVER_KEY="..." --project-ref casljueycxsqexpkdiuq
```

## After deploy

- Update `docs/PUSH_NOTIFICATIONS.md` if push types changed
- Smoke-test on physical device if push or auth changed
