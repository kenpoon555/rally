# Manual run — Loop A (invite → Rally)

**Contract:** [flow-invite-to-rally.md](./flow-invite-to-rally.md)  
**Tier:** Simulator (no App Store)

## 1. Start the app

```bash
cd RallyApp
npm start          # Metro on :8081 — leave running
npm run ios        # in another terminal, if sim not open
```

Or reload if already running: **Cmd+R** in simulator.

## 2. Seed demo data (once per preview DB)

```bash
cd RallyApp
node scripts/seed-monrovia-basketball-rally-demo.mjs
supabase db query --linked -f supabase/scripts/seed_monrovia_basketball_rally_demo.sql
```

## 3. Get invite tokens from DB

```bash
# Rally group invite
supabase db query --linked \
  "select name, invite_token from regular_groups where name ilike '%Julian%' limit 1;"

# Pickup game invite
supabase db query --linked \
  "select listing_title, invite_token from activities where invite_token is not null and status='active' limit 3;"
```

Example tokens (preview — yours may differ):

| Type | Token |
|------|-------|
| Julian Fisher Park Regulars | `a1000001-0001-4001-8001-000000000301` |
| Pickup run · full court | `400a8e6b-9648-4716-8f35-f04ad0f08610` |

## 4. Open deep links on iOS simulator

**Tip:** Bring Rally to foreground first (tap app icon), then run `openurl`. If iOS shows **“Open in Rally?”** on the home screen, tap **Open**.

```bash
# Rally group invite (join crew)
xcrun simctl openurl booted \
  "rallyapp://group-invite/a1000001-0001-4001-8001-000000000301"

# Pickup game invite
xcrun simctl openurl booted \
  "rallyapp://invite/400a8e6b-9648-4716-8f35-f04ad0f08610"

# Invalid token (should alert, not crash)
xcrun simctl openurl booted \
  "rallyapp://group-invite/00000000-0000-0000-0000-000000000000"
```

## 5. Test signed-out path

1. In app: **You** tab → sign out  
2. Run group-invite URL again  
3. Expect: **Sign in required** alert (not redbox)

## 6. Test Today invite card (in-app)

1. Log in as host (`marcus@rally-mvrhoops.demo`)  
2. Rally hub → invite friend (or seed pending invite for tester)  
3. Log in as `@kunyu` on simulator  
4. **Today** tab → `RallyInviteCard` → Accept / Decline

## 7. Screenshot each state

```bash
mkdir -p docs/contracts/screenshots/flow-invite-to-rally

xcrun simctl io booted screenshot \
  docs/contracts/screenshots/flow-invite-to-rally/04-group-invite-url-success.png
```

Filenames: see contract **Screenshots required** section.

## 8. Fill pass/fail table

Copy the **Validator report template** from [flow-invite-to-rally.md](./flow-invite-to-rally.md) into the contract or a PR comment.

## 9. Agent loop (Builder → Validator → Fixer)

Full workflow with copy-paste prompts: [.cursor/workflows/validate-contract.md](../../.cursor/workflows/validate-contract.md)

**Quick start — Validator only** (new Cursor chat):

```
You are the Validator agent. Read RallyApp/.cursor/workflows/validate-contract.md
and RallyApp/docs/contracts/flow-invite-to-rally.md. Validate Loop A on iOS sim.
Return pass/fail table; do not fix code.
```

Recurring check: `/loop 20m` + Validator prompt from the workflow file.

## Android (optional)

```bash
adb shell am start -a android.intent.action.VIEW \
  -d "rallyapp://group-invite/YOUR-TOKEN-HERE"
```

## TestFlight friend (tier 2)

1. Friend installs from TestFlight link (not App Store)  
2. Host shares `rallyapp://group-invite/...` via iMessage or Notes  
3. Friend taps link → Rally opens → join flow

Two steps: **install beta app**, then **open invite link**.
