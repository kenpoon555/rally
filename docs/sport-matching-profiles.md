# Sport matching profiles (product lock)

Last updated: 2026-05-28

## Pickleball MVP (locked)

**Decision:** Rally’s MVP is **pickleball-only** with **fixed games as the default** and **flexible matching as a secondary option**.

### Default path: `fastFixed`

- Host picks a **court** and publishes a **fixed start time** (`scheduling_mode: fixed`, `match_status: open`).
- Discover shows open pickleball games nearby; players **join** via request flow.
- User-facing label: **game** (internal tables still use `activities`).

### Secondary path: flexible matching (`partnerFlex` behavior)

- On Create Game, user selects **“I’m flexible on time”**.
- Same backend as before: time window, candidate courts, participant preferences, `finalize_activity_best_slot` RPC.
- Lifecycle: `match_status`: `collecting` → `finalized`.

### Launch-enabled sports

| Sport      | Profile     | Default scheduling | `launchEnabled` |
| ---------- | ----------- | ------------------ | --------------- |
| Pickleball | `fastFixed` | fixed              | yes             |

**Not launch-enabled:** Tennis, Badminton, Basketball, Running, Hiking — legacy rows may still display in feeds.

### Source of truth

- [`src/constants/sports.ts`](../src/constants/sports.ts) — `SPORT_METADATA`, `MVP_DEFAULT_SCHEDULING_MODE`
- [`src/hooks/useSportsCatalog.ts`](../src/hooks/useSportsCatalog.ts) — launch sports for Create / geofence modal
- Validation notes: [pickleball-mvp-validation-notes.md](pickleball-mvp-validation-notes.md)

### Related docs

- [HANDOFF-sport-matching.md](HANDOFF-sport-matching.md)
- [phase2-fast-fixed-matching.md](phase2-fast-fixed-matching.md)
- [ROADMAP.md](../ROADMAP.md)
