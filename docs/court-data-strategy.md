# Court data — how it stays fresh

Last updated: 2026-05-31

## Problem

`activity_locations` started as **manual seed scripts**. **Closed beta is LA-only** — run `scripts/seed-la-courts.mjs` for all 10 launch sports. Legacy Bay Area pickleball seeds remain for old dev notes only.

## Current model (after migration `027`)

| Layer | What it does |
|-------|----------------|
| **Seed scripts** | Bootstrap LA beta — 97 curated courts across 10 sports / 7 regions (Westside, South Bay, SGV, SFV, DTLA/Central, Eastside, Long Beach/SE). Court list is the single source of truth in `scripts/la-courts-data.mjs`; legacy `seed-bay-area-*` archived |
| **Google Places add** | Host searches on Create Game → saved as `source='places'`, shared for everyone |
| **Community reports** | Host/player taps **Report court issue** on Activity Details |
| **Auto-hide** | 2 distinct **closed** reports → `is_active = false` (hidden from picker) |
| **Nearby RPC** | `get_nearby_locations` returns only `is_active = true` courts |

### Seeding LA courts

```bash
cd RallyApp

# Edit / add courts in one place:
#   scripts/la-courts-data.mjs   (name, sport_type, google_place_id, region, [lng, lat])

# Option A — service role (inserts directly):
node scripts/seed-la-courts.mjs            # needs SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY

# Option B — SQL (no service role; runs on linked project):
node scripts/gen-la-courts-sql.mjs         # regenerate supabase/scripts/seed_la_courts.sql
supabase db query --linked -f supabase/scripts/seed_la_courts.sql
```

Both paths are idempotent (guarded by `google_place_id`) and use **static lat/lng — no Google Places calls, $0 to seed**. After editing the court list, always regenerate the SQL so the two stay in sync.

Columns on `activity_locations`:

- `is_active` — false = hidden from Create Game search
- `source` — `seed` \| `places` \| `user`
- `last_verified_at` — bumped when re-added via Places dedupe
- `updated_at` — last report or edit

Reports live in `court_reports` (`closed`, `wrong_sport`, `wrong_location`, `duplicate`, `other`).

## Host flow when no courts nearby

1. Create Game shows empty state + **Add a court near you**
2. Host searches park / rec center name (Google Places)
3. First result saved to Supabase → immediately selectable
4. Host publishes game — **exact address details stay in chat** (cost note, "meet at north gate", etc.)

This matches the product bet: **fixed time + host coordinates in chat**, not Rally owning perfect venue data on day one.

## What we do *not* do yet

- Automated Google sync / nightly refresh (cost + complexity)
- Admin dashboard for report triage (query `court_reports` in SQL editor for now)
- Per-sport court verification team
- Map tab court discovery (Map hidden for beta)

## Ops queries (Supabase SQL editor)

```sql
-- Courts flagged inactive
select id, name, sport_type, source, updated_at
from activity_locations
where is_active = false
order by updated_at desc;

-- Recent community reports
select cr.*, al.name
from court_reports cr
join activity_locations al on al.id = cr.location_id
order by cr.created_at desc
limit 50;

-- Stale seeds (never verified, older than 180 days)
select id, name, sport_type, created_at, last_verified_at
from activity_locations
where source = 'seed'
  and coalesce(last_verified_at, created_at) < now() - interval '180 days'
order by created_at;
```

## Future (post-retention)

- **Verified** badge when admin or N successful games at venue
- Re-verify prompt after 6 months without hosted games
- Partner venue API (gyms that opt in)
- Bulk import for league cities
