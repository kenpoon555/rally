# Sport matching profiles (product lock)

Last updated: 2026-05-31

## Beta model (locked)

**Fixed time + Game Room chat.** Host sets time and rough place; exact logistics (cost split, which gate, format) happen in chat. Flexible matching remains in code but is de-emphasized in Create Game.

User-facing label: **game** (internal: `activities`).

### Default path: `fastFixed`

- Host picks **court/field** (or adds via Google Places) and publishes a **fixed start time**.
- Discover shows open games; players **join** → **Mark Ready** → host **Finalizes**.
- Coordination lives in **Game Room** chat.

### Launch-enabled sports (10)

| Sport | Profile | Default total | Open spots | Partner-dependent |
| ----- | ------- | ------------- | ---------- | ----------------- |
| Pickleball | `fastFixed` | 4 | 3 | |
| Basketball | `fastFixed` | 8 | 7 | |
| Badminton | `fastFixed` | 4 | 3 | |
| Tennis | `fastFixed` | 4 | 3 | |
| Volleyball | `fastFixed` | 12 | 11 | |
| Soccer | `fastFixed` | 10 | 9 | |
| Squash | `fastFixed` | 2 | 1 | yes |
| Racquetball | `fastFixed` | 2 | 1 | yes |
| Table Tennis | `fastFixed` | 4 | 3 | yes |
| Ultimate Frisbee | `groupDiscuss` | 14 | 13 | yes |

**Not launch-enabled (yet):** Running, Hiking, Workout — enable via [module-sport-meetup-sports.md](../contracts/module-sport-meetup-sports.md) when meetup create path ships (ballpark area, not court-gated).

### Source of truth

- [`src/constants/sports.ts`](../src/constants/sports.ts) — `SPORT_METADATA`, `launchEnabled`, `defaultMissingPlayers`, `partnerDependent`
- [`src/hooks/useSportsCatalog.ts`](../src/hooks/useSportsCatalog.ts) — launch sports for Create / Discover / geofence
- [`src/components/SportIcon.tsx`](../src/components/SportIcon.tsx) — icons per sport

### Related docs

- [product-review-multi-sport.md](product-review-multi-sport.md)
- [beta-welcome-message.md](beta-welcome-message.md)
- [ROADMAP.md](../ROADMAP.md)
