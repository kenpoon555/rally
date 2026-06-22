# Product review personas

**Use with:** `.cursor/skills/product-review/SKILL.md`  
**Folder:** `docs/product-review/{persona-id}/YYYY-MM-DD-review.md`  
**Onboarding contracts:** [ONBOARDING-CONTRACT-INDEX.md](../contracts/ONBOARDING-CONTRACT-INDEX.md)

Pick **one persona per Agent session** (or one human reviewer). Run consolidator after the queue's minimum reviews (see [review-queues.json](./review-queues.json) · [PRODUCT-REVIEW-LOOP.md](./PRODUCT-REVIEW-LOOP.md)).

## Commitment levels (pickup / Rally)

| Level | Code | Description |
|-------|------|-------------|
| **L1 — First-timer** | `first-timer` | Invited once; may not have account |
| **L2 — Casual** | `casual` | 1–2× / month; low app tolerance |
| **L3 — Regular** | `regular` | Weekly player; knows the crew |
| **L4 — Host** | `host` | Runs sessions; lock roster, nudges |
| **L5 — Power host** | `power-host` | Multiple Rallies; polls, leaderboard |

## Role levels (coach / parent / teen)

| Level | Code | Description |
|-------|------|-------------|
| **R0 — Player only** | `player` | No Coach Tools, no Family |
| **R1 — Coach candidate** | `coach-candidate` | Wants to teach; not approved yet |
| **R2 — Approved coach** | `coach` | Coach Tools + create class |
| **R3 — Parent** | `parent` | Manages child profiles |
| **R4 — Dual role** | `coach-parent` | Coach Tools + Family |
| **R5 — Teen** | `teen` | 13–17 restricted account |
| **R6 — Org admin** | `org-admin` | Multi-coach academy (v2 — gaps only) |

---

## Persona catalog A — pickup / Rally (12 · 10 sports)

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

---

## Persona catalog C — Play discover / surface coherence (3)

**Focus:** Sport strip × Games \| Players \| Classes; role clutter; cross-sport leaks.  
**Contracts:** [module-role-surfaces.md](../contracts/module-role-surfaces.md) · [flow-play-screen.md](../contracts/flow-play-screen.md)

| persona-id | Sport / role | Level | One-line goal |
|------------|--------------|-------|---------------|
| `play-discover-minimalist` | Basketball (default strip) | R0 · L2 | Only see Games + Players — no Classes tab, no coach noise |
| `play-sport-matrix-auditor` | Multi-sport strip | L3 · meta | Walk strip sports × segments; log every wrong-sport row or hidden tab mistake |
| `meetup-play-browser` | Running | L3 | Running strip → Games/Players never show court-sport rows |

### Account hints (catalog C)

| persona-id | Suggested login | Setup |
|------------|-----------------|-------|
| `play-discover-minimalist` | `@kunyu` | CPS flags on — confirm **no** Classes segment |
| `play-sport-matrix-auditor` | `@kunyu` + switch sports on strip | Screenshot each sport × Players |
| `meetup-play-browser` | `@kunyu` | Select **Running** on Play strip |
| `coach-parent-dual` | `marcus@rally-mvrhoops.demo` | Classes segment **should** appear when flag on |

---

## Persona catalog B — onboarding / roles (8)

**Flags:** `EXPO_PUBLIC_ENABLE_COACH_FOUNDATION` · `EXPO_PUBLIC_ENABLE_PARENT_STUDENT_CORE` — restart Metro after change.

**No pre-seed** on accounts testing unlock flows (do not run coach/parent validation seeds on reviewer logins).

| persona-id | Role | Level | One-line goal | Primary contract |
|------------|------|-------|---------------|------------------|
| `player-no-coach-tools` | Player | R0 | Regular adult — confirm Coach Tools & Family hidden | [flow-coach-onboarding-org.md](../contracts/flow-coach-onboarding-org.md) |
| `coach-approved-manual` | Coach | R1→R2 | Not a coach → founder approves → Coach Tools appear | [flow-become-a-coach.md](../contracts/flow-become-a-coach.md) |
| `coach-first-class` | Coach | R2 | Approved coach → Create Class → share parent invite | [flow-create-game.md](../contracts/flow-create-game.md) |
| `parent-first-child` | Parent | R3 | 18+ → Profile Family → Add Child (no Alex/Mia seed) | [flow-parent-family-onboarding.md](../contracts/flow-parent-family-onboarding.md) |
| `parent-via-class-invite` | Parent | R3 | Zero children → coach link → inline add child | [flow-student-class-enrollment.md](../contracts/flow-student-class-enrollment.md) |
| `coach-parent-dual` | Dual | R4 | Coach Tools + Family both usable without confusion | [module-coach-parent-navigation.md](../contracts/module-coach-parent-navigation.md) |
| `teen-restricted-account` | Teen | R5 | 13–17 signup → no Family / Coach / Add Child | [flow-teen-account-onboarding.md](../contracts/flow-teen-account-onboarding.md) |
| `academy-head-coach` | Org admin | R6 | **v2 gap review** — document missing reassign/substitute UX | [flow-organization-coaches.md](../contracts/flow-organization-coaches.md) |

### Account hints (sim / TestFlight)

| persona-id | Suggested login | Setup |
|------------|-----------------|-------|
| `player-no-coach-tools` | `@kunyu` or fresh 18+ signup | No coach/parent seeds |
| `coach-approved-manual` | Fresh adult email | Simulate approval: `update profiles set is_coach=true where email=…` |
| `parent-first-child` | Fresh 18+ signup | No `seed_parent_student_validation.sql` |
| `parent-via-class-invite` | Fresh parent + coach shares enroll link | Coach = Marcus or approved coach account |
| `coach-parent-dual` | `marcus@rally-mvrhoops.demo` | Optional full seed for dual-role depth |
| `teen-restricted-account` | Fresh signup, age **13–17** | CPS flags on |

---

## Sim note

Monrovia demo seed is **basketball**. For non-basketball personas:

- Evaluate **generic** flows (invite, Today, hub, lock) — primary signal
- Note **sport-specific** gaps in report (icons, copy, court fields) — contract backlog
- Do not fail generic UX because seed sport label says basketball

For **role personas**, note legal blockers (guardian consent) as friction — do not treat as app bug unless contract says otherwise.

---

## Journey focus

### Pickup (catalog A)

| Level | Primary paths |
|-------|----------------|
| L1–L2 | Invite → auth → Today → I'm in |
| L3 | Today → hub Play → session card state |
| L4 | Hub → create/lock → members → nudges |
| L5 | Inbox → multi-Rally switch → poll → leaderboard |

### Onboarding (catalog B)

| persona-id | Primary paths |
|------------|---------------|
| `player-no-coach-tools` | Profile → Play create — confirm absent coach/parent surfaces |
| `coach-approved-manual` | Before/after `is_coach` flip — Profile Coach Tools |
| `coach-first-class` | Coach Tools → Create Class → invite share |
| `parent-first-child` | Profile Family → Add Child → consent |
| `parent-via-class-invite` | Deep link → picker → add inline |
| `coach-parent-dual` | Profile both sections → class + child flows |
| `teen-restricted-account` | Signup age gate → Profile restrictions |
| `academy-head-coach` | Walk app — log every promised-but-missing org feature |

### Play discover (catalog C)

| persona-id | Primary paths |
|------------|---------------|
| `play-discover-minimalist` | Play strip → Games / Players only — Profile has no coach blocks |
| `play-sport-matrix-auditor` | Each strip sport → all visible segments → note cross-sport rows |
| `meetup-play-browser` | Running → Players empty or Running-only; Games meetup cards |

---

## One-line Agent prompts

Replace `{persona-id}` from either catalog.

```
Product review: persona {persona-id} per docs/product-review/personas.md and .cursor/skills/product-review/SKILL.md.
Read linked contract from persona table. iOS sim. Screenshots under docs/product-review/{persona-id}/. Write YYYY-MM-DD-review.md.
No code. No Validator.
```

**Role persona example:**

```
Product review: persona parent-first-child per docs/product-review/personas.md and .cursor/skills/product-review/SKILL.md.
Fresh 18+ account — no parent seed. EXPO_PUBLIC_ENABLE_PARENT_STUDENT_CORE=true.
```

---

## Batch suggestions (Layer 1)

### Pickup sprint (minimum 6 before consolidator)

1. `basketball-first-timer`
2. `badminton-casual`
3. `badminton-host`
4. `pickleball-first-timer`
5. `volleyball-host`
6. `multi-sport-power-host`

### Onboarding / role sprint (minimum 6)

1. `player-no-coach-tools`
2. `coach-approved-manual`
3. `parent-first-child`
4. `parent-via-class-invite`
5. `coach-parent-dual`
6. `teen-restricted-account`

Add `academy-head-coach` when planning v2 org work. Run **separate consolidator pass** or tag synthesis sections `pickup` vs `onboarding`.

### Play discover sprint (minimum 6 before consolidator)

1. `play-discover-minimalist`
2. `running-regular`
3. `badminton-casual`
4. `basketball-first-timer`
5. `player-no-coach-tools`
6. `coach-parent-dual`

```bash
./.cursor/hooks/product-review-loop-start.sh --queue play-discover-round1
```

---

## Review tiers (queues)

Used by [review-queues.json](./review-queues.json) and [PRODUCT-REVIEW-LOOP.md](./PRODUCT-REVIEW-LOOP.md).

| Tier | Queue suffix | Reviewer mindset |
|------|--------------|------------------|
| **1 — Discovery** | `round1` | Note friction P1–P3; blocked journeys OK if documented |
| **2 — Picky** | `round2-picky` | Complete full journey; no silent failures; stricter P0 bar |
| **3 — Expert** | `round3-expert` | Edge cases, regressions vs prior tier, org/academy gaps |

Start tier 2 only after tier 1 consolidator + Builder/Validator pass on P0 items.

---

## Start a review queue (terminal)

```bash
cd RallyApp
./.cursor/hooks/product-review-loop-start.sh --queue onboarding-round1
```

Assign **one persona per person** from the queue — see PRODUCT-REVIEW-LOOP.md for the full cycle → consolidator → Builder backlog → validation queue.
