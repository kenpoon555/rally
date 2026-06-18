# Launch roadmap — Jun 2026 (canonical)

**Last updated:** 2026-06-15  
**Status:** Active — supersedes ad-hoc “what’s next” for go-to-market decisions  
**Related:** [vision.md](./vision.md) (long-term product) · [post-v1-roadmap-contracts.md](./post-v1-roadmap-contracts.md) (contract index) · [develop-process-and-costs.md](./develop-process-and-costs.md) (branching + validation)

---

## Verdict

Rally is moving in the right direction: core Rally coordination, invite/session flow, validation contracts, store release process, and a clear monetization path through hosts, organizers, coaches, and venues.

**The next risk is not lack of features.** It is polishing and expanding before real groups prove repeat use.

> **North star for this quarter:** real groups complete  
> `invite → install → join Rally → I'm in → lock roster → play → attendance → recap → schedule next`  
> without founder help.

---

## Go-to-market phases (not contract sprint names)

| GTM phase | Goal | When |
|-----------|------|------|
| **GTM 1 — Launch readiness** | Anyone can tap a Rally link and join the correct Rally/game | Now — app in review |
| **GTM 2 — Real group validation** | Prove one game is easier than chat for 3–5 groups | After store approval + launch gate |
| **GTM 3 — Retention + monetization wedge** | Build only from evidence; Founding Organizer/Coach | After 2+ groups schedule a second session |

**Contract validation sprints** (`baseline`, `phase1a`, `phase2-recap`, etc.) are Layer 3 proof work — see [validation-queue.md](./contracts/validation-queue.md). Finish launch-critical validation in GTM 1; defer expansion features until GTM 2 feedback.

---

## App Store / Play review guidance

| Store | Typical review | Plan for |
|-------|----------------|----------|
| Apple App Store | 24–48h common; new apps longer | **1–3 days**, buffer up to **1 week** |
| Google Play | Hours to several days | Same |
| TestFlight external | Often faster, not guaranteed | Same |

### If a build is already in review

**Let it finish** unless there is a P0 blocker (crash, broken invite/login/join, wrong metadata, incomplete core flow).

Replacing a build in review can reset timing or cause store confusion.

### When to submit the next release

Submit only if:

- P0 crash or broken core flow
- Store review requests a fix
- Wrong metadata

Otherwise:

1. Let current version approve
2. Launch to a **small** beta (1 group first)
3. Observe real problems
4. Ship a **small** next release from findings

**Good next release:** invite fixes, onboarding copy, crashes, session card clarity, attendance/recap fixes, empty states.  
**Bad next release:** Coach Pro, in-app payments, Teams/Leagues, broad discovery, full academy model.

---

## Launch gate (before broad invites)

Verify on **real iPhone + Android** (not sim only):

| Flow | Required result |
|------|-----------------|
| Universal invite link | Opens app if installed |
| Missing app | Install instructions / App Store / Play link |
| After install | User can return to invite |
| Auth | Login/signup works |
| Join Rally | Lands in correct Rally |
| Session card | Shows upcoming game |
| Join / I'm in | State persists after refresh |
| Host lock roster | Works without crash |
| Attendance | Saves after game |
| Recap | **P0:** card loads after attendance (no crash). **P1:** share + `recap_shared` |
| P0 crashes | Zero |

Contracts: [flow-invite-to-rally.md](./contracts/flow-invite-to-rally.md), [flow-rally-session.md](./contracts/flow-rally-session.md), [flow-post-game-attendance.md](./contracts/flow-post-game-attendance.md), [flow-post-game-recap.md](./contracts/flow-post-game-recap.md).

---

## First real-user goal

Do **not** ask friends to replace group chat yet.

Ask: **Can we use Rally for one real game only?**

| Target | Success |
|--------|---------|
| Groups tested | 3–5 |
| Second session scheduled | 2+ groups |
| P0 crashes | 0 |
| Host feedback | Clear, recorded |

### Test group matrix (GTM 2)

| Group | Sport | Focus |
|-------|-------|-------|
| 1 | Badminton | Invite, session card, roster, optional rotation |
| 2 | Pickleball | Venue, roster, recap |
| 3 | Basketball | Roster size, lock, attendance |
| 4 | Larger-roster sport | Need Players / open spots |
| 5 | Casual friends | Onboarding, reliability |

**Measure:** invite opened → install → signup → joined Rally → I'm in → roster locked → attendance → recap seen → second session scheduled. See [weekly scorecard](#weekly-scorecard) and [module-analytics-events.md](./contracts/module-analytics-events.md).

---

## GTM 1 — Launch readiness (work now)

**Goal:** Anyone can tap a Rally link and join without founder help.

| Work | Status / contract |
|------|-------------------|
| Invite-link validation | [flow-invite-to-rally.md](./contracts/flow-invite-to-rally.md) — baseline ✅; re-test on device |
| Rally/session validation | [flow-rally-session.md](./contracts/flow-rally-session.md) — baseline ✅ |
| Attendance + recap | phase1a ✅ · phase2-recap ✅ |
| App Store / Play install paths | [APP_STORE_PLAY_STORE_PREP.md](./APP_STORE_PLAY_STORE_PREP.md) |
| Stable production build | Let review finish |
| Host onboarding messages | Prepare copy (below) |

**Do not in GTM 1:**

- More discovery surfaces
- Teams / Leagues / in-app payments
- Coach Pro / academy model
- Broad new features before launch gate

---

## GTM 2 — Real group validation

**Goal:** One game easier to coordinate than chat.

1. Send to **one group first** after approval
2. Watch host schedule / lock / attendance
3. Ask players where they got confused
4. Expand to 3–5 groups
5. **Layer 1 product review** (personas → consolidator) — use real feedback, not only sim personas
6. Next release = painful issues only

---

## GTM 3 — Retention + monetization wedge

Build **only from evidence**. Likely order (after GTM 2 data):

1. Schedule next / duplicate session
2. Host nudge — [flow-host-nudges.md](./contracts/flow-host-nudges.md) (shipped)
3. Dormant Rally reminder — [flow-crew-dormancy-nudge.md](./contracts/flow-crew-dormancy-nudge.md) (not built)
4. Attendance history / reliability
5. Recap polish — [flow-post-game-recap.md](./contracts/flow-post-game-recap.md)
6. Captain program (relationships, not code first)
7. Coach / Organizer Pro foundation

---

## Priority stack (P0 / P1 / P2)

### P0 — Now

- [ ] Let app review continue unless P0 on current build
- [ ] Validate invite link on real iPhone + Android
- [ ] Verify missing-app install fallback
- [ ] Prepare beta invite + host onboarding copy
- [ ] List 3–5 test groups + 3 coaches to interview

### P1 — This week

- [ ] Captain/host pipeline list
- [ ] Coach pipeline list
- [ ] Beta scorecard events in analytics — see [module-analytics-events.md](./contracts/module-analytics-events.md)
- [ ] First real group test (one game)

### P2 — After first group feedback

- [ ] Fix only painful issues
- [ ] Hide empty/advanced surfaces if confusing
- [ ] Onboarding copy improvements
- [ ] Small release from real findings — not feature expansion

---

## Monetization (do not charge players first)

**Keep free:** join games, join Rallies, basic chat, session card, I'm in, basic attendance.

**Monetize:** heavy hosts, captains, coaches, venue admins.

### Founding Organizer — $99/year

Organizer badge, early Pro tools, priority support, locked founder pricing, direct feedback line.

### Founding Coach — $199/year

Coach profile, recurring sessions, attendance history, roster export, external payment link, priority support, locked founder pricing.

**Billing:** manual first (invoice / Venmo / etc.). Stripe only after **5+ people say yes and pay manually**.

**Coach / parent / student (minors):** Separate track — [coach-parent-student/README.md](./coach-parent-student/README.md). **Do not build during GTM 1–2.** v1.2+ after lawyer review.

Full product direction: [vision.md](./vision.md) § coach / organizer.

---

## Coach / organizer direction (product rules)

- **Same app** — extra tools unlocked by role. No separate coach app.
- **Multi-tag roles:** `player`, `host`, `captain`, `coach`, `venue_admin`, `admin` — not mutually exclusive.
- **Organization optional** — solo coach (`Coach Amy → Beginner Badminton Rally`) and academy (`SGV Badminton Academy → coaches → classes`) both supported later.
- **Ship solo coach V1 before academy V1.**

| Capability | Solo coach V1 | Academy V1 (later) |
|------------|---------------|---------------------|
| Class Rally + recurring sessions | Yes | Yes |
| Attendance | Yes | Yes |
| Cancel / defer session | Yes | Yes |
| Notify all players | Yes | Yes |
| Reassign substitute coach | Limited | Yes |
| Consolidate classes | Limited | Yes |
| Payment note / external link | Yes | Yes |
| In-app payments | Later | Later |

**Coach day-off flow (future):** defer → cancel → reassign substitute → consolidate → notify.

**No contract until GTM 3 evidence** — do not Builder Coach Pro before real coach interviews.

---

## Weekly scorecard

Copy every week — this drives the roadmap more than feature ideas.

```text
Real groups tested:
Real users onboarded:
Invite links opened:
Users installed:
Users joined Rally:
Users tapped I'm in:
Games created:
Games locked:
Attendance submitted:
Recap seen/shared:
Second sessions scheduled:
Replay within 14 days:
Top 3 user complaints:
Top 3 host complaints:
P0 crashes:
```

Query helpers: `analytics_crew_lifecycle`, `analytics_crew_funnel_30d` — [module-analytics-events.md](./contracts/module-analytics-events.md).

---

## Immediate checklist

### Today

- [ ] Let app review continue unless P0
- [ ] Device test: invite link + install fallback
- [ ] Prepare invite copy
- [ ] List 3–5 groups + 3 coaches

### This week

- [ ] First group — one real game
- [ ] Watch host create / schedule / lock
- [ ] Record invite → I'm in conversion
- [ ] Decide next release from problems found

### After approval

- [ ] **One group first** — then 3–5
- [ ] Fix urgent issues
- [ ] Coach conversations — not Coach Pro build yet

---

## How this maps to agent layers

| Human priority | Agent layer | Doc |
|----------------|-------------|-----|
| Launch gate / device testing | Layer 3 + human | This doc + VALIDATION-RUNBOOK |
| Real group feedback | Layer 1 product review | personas.md — after GTM 2 |
| Contract changes from feedback | Layer 2 | write-contract skill |
| Small fix release | Layer 3 → 4 | validate affected contract → promote |
| Coach Pro / payments | **Blocked** until GTM 3 | vision.md — contract when scoped |

**Rule:** Finish GTM 1 launch gate before Layer 1 consolidator drives large contract changes. Sim personas supplement — they do not replace real group tests.

---

## Final recommendation

Let store review finish if the build is acceptable. Use the approved build for the real loop. Only then expand Coach / Organizer foundation.

**Next milestone:** real groups and coaches using Rally enough that the next feature becomes obvious — not a bigger app.
