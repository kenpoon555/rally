# Product review personas

**Use with:** `.cursor/skills/product-review/SKILL.md`  
**Folder:** `docs/product-review/{persona-id}/YYYY-MM-DD-review.md`

Pick **one persona per Agent session**. Run consolidator after several reviews (see `product-review-consolidator` skill).

## Commitment levels

| Level | Code | Description |
|-------|------|-------------|
| **L1 — First-timer** | `first-timer` | Invited once; may not have account |
| **L2 — Casual** | `casual` | 1–2× / month; low app tolerance |
| **L3 — Regular** | `regular` | Weekly player; knows the crew |
| **L4 — Host** | `host` | Runs sessions; lock roster, nudges |
| **L5 — Power host** | `power-host` | Multiple Rallies; polls, leaderboard |

## Persona catalog (12 — 10 sports)

| persona-id | Sport | Level | One-line goal |
|------------|-------|-------|---------------|
| `basketball-first-timer` | Basketball | L1 | Friend's pickup link → join without jargon |
| `badminton-casual` | Badminton | L2 | Sunday social → I'm in in under 2 min |
| `badminton-host` | Badminton | L4 | Weekly shutter court → full roster + lock |
| `soccer-regular` | Soccer / futsal | L3 | Weekly kickabout → know time/place/headcount |
| `tennis-casual` | Tennis | L2 | Doubles invite → accept court + partner clarity |
| `volleyball-host` | Volleyball | L4 | Gym rental slot → fill 12, subs when short |
| `pickleball-first-timer` | Pickleball | L1 | Retiree group invite → simple accept path |
| `running-regular` | Running | L3 | Saturday group run → pace + meet point |
| `golf-social-host` | Golf | L4 | Monthly tee time → who's confirmed |
| `table-tennis-regular` | Table tennis | L3 | Club night → session card + chat |
| `softball-casual` | Softball | L2 | Company league → game detail + location |
| `multi-sport-power-host` | Multi-sport | L5 | 3+ Rallies → inbox, polls, no silos |

## Sim note

Monrovia demo seed is **basketball**. For non-basketball personas:

- Evaluate **generic** flows (invite, Today, hub, lock) — primary signal
- Note **sport-specific** gaps in report (icons, copy, court fields) — contract backlog
- Do not fail generic UX because seed sport label says basketball

## Journey focus by level

| Level | Primary paths |
|-------|----------------|
| L1–L2 | Invite → auth → Today → I'm in |
| L3 | Today → hub Play → session card state |
| L4 | Hub → create/lock → members → nudges |
| L5 | Inbox → multi-Rally switch → poll → leaderboard |

## One-line Agent prompts

Replace `{persona-id}` from table above.

```
Product review: persona {persona-id} per docs/product-review/personas.md and .cursor/skills/product-review/SKILL.md.
iOS sim + Monrovia demo. Screenshots under docs/product-review/{persona-id}/. Write YYYY-MM-DD-review.md.
No code. No Validator.
```

## Batch suggestion (Layer 1 sprint)

Minimum set before consolidator:

1. `basketball-first-timer`
2. `badminton-casual`
3. `badminton-host`
4. `pickleball-first-timer`
5. `volleyball-host`
6. `multi-sport-power-host`

Add remaining personas when validating sport-specific contract rows.
