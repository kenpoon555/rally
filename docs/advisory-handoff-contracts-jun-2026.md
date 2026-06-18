# Advisory handoff — full contract review (Jun 2026)

**Last updated:** 2026-06-16  
**Advisory contract fixes:** 2026-06-16 — see §7 risks table  
**Purpose:** Review **every** Rally contract — scope, ordering, human gates, and gaps  
**Companion:** [advisory-handoff-jun-2026.md](./advisory-handoff-jun-2026.md) (validation loop system + agent layers)

**Start here:** [DOCS-INDEX.md](./DOCS-INDEX.md) · [post-v1-roadmap-contracts.md](./post-v1-roadmap-contracts.md)

---

## 1. Executive summary

Rally uses **written contracts** as the source of truth between product, Builder, Validator, and Fixer agents. Each contract is a pass/fail spec with demo setup, checklist, screenshots, and optional P*/C*/H* blocks.

**Where we are (Jun 16, 2026):**

| Area | Status |
|------|--------|
| **Validation queues** | `baseline` · `phase1a` · `phase1b` · `phase2-recap` · `gtm1-launch-gate` — reported green |
| **App Store** | Rally LA v1.0.0 Build 6 — **Waiting for Review** since Jun 13 (normal for first submission) |
| **Next human step** | **GTM 2** — 1 small real group beta after store approval |
| **CPS track** | 8 contracts drafted; much code **flag-gated** — lawyer blocker on consent copy |
| **Optional validation** | `phase1c`, `phase2-game-card` |
| **Contract fixes** | Advisory review applied 2026-06-16 — invite device rows, recap P0/P1, attendance, visibility, flag-off CPS |

**Core product bet (this quarter):**

```text
invite → install → join Rally → I'm in → lock roster → play → attendance → recap → schedule next
```

Coach/parent/student is a **separate track** — do not mix into GTM 1–2 friend-group beta.

---

## 2. What to review

Please read contracts in this order:

1. **Gold template** — [flow-invite-to-rally.md](./contracts/flow-invite-to-rally.md) (structure quality)
2. **Launch-critical** — Loop B, attendance, recap, play-screen, inbox
3. **Retention backlog** — poll, rotation, tourney, leaderboard, dormancy nudge
4. **CPS track** — navigation → age gate → profile/visibility/consent → enrollment/roster → coach ops
5. **Cross-cutting modules** — game-card, invite-link, sport-icon, analytics

**Review lens:**

- Is each contract **observable** on sim/device (checklist rows are testable)?
- Is **granularity** right (flow vs module split)?
- Are **H* human gates** flagged before Builder ships blocked copy?
- Is **queue order** right vs [launch-roadmap-jun-2026.md](./launch-roadmap-jun-2026.md)?
- What should be **deferred**, **merged**, or **split**?

---

## 3. Validation queue order (machine-readable)

Source: [validation-queues.json](./contracts/validation-queues.json) · runbook: [validation-queue.md](./contracts/validation-queue.md)

| Queue | Contracts | When |
|-------|-----------|------|
| `baseline` | invite, rally-session, rally-hub, inbox, play-screen | ✅ Sprint 0 |
| `phase1a` | attendance, host-nudges, analytics | ✅ |
| `phase1b` | availability-poll | ✅ |
| `phase1c` | rotation, mini-tournament, leaderboard | Optional pre-beta |
| `phase2-recap` | post-game-recap | ✅ |
| `phase2-game-card` | module-game-card | Optional |
| `gtm1-launch-gate` | invite, rally-session, attendance, recap (**real device**) | ✅ reported |
| `ops` | crew-dormancy-nudge | GTM 3 / when retention evidenced |
| `v1.1-coach-foundation` | module-coach-parent-navigation | After GTM 2 |
| `v1.2-parent-student-core` | age-gate, student-profile, visibility, guardian-consent | After P0 + lawyer |
| `v1.3-parent-pilot` | student-class-enrollment, coach-minor-class-roster | Pilot |
| `v1.4-coach-ops` | coach-class-operations | Coach Pro wedge |

**GTM phases (business, not queue names):**

| GTM | Goal |
|-----|------|
| GTM 1 | Launch readiness — device invite loop works |
| GTM 2 | 3–5 real groups prove repeat use |
| GTM 3 | Retention wedge + coach foundation when evidenced |

---

## 4. Full contract catalog

**Paths:** all under `RallyApp/docs/contracts/` unless noted.

### 4.1 Core loops — validate every preview PR

| ID | File | Purpose (north-star) | Status | Queue |
|----|------|----------------------|--------|-------|
| `flow-invite-to-rally` | [flow-invite-to-rally.md](./contracts/flow-invite-to-rally.md) | Tap link → auth → joined Rally visible | Active — **Loop A** | baseline, gtm1 |
| `flow-rally-session` | [flow-rally-session.md](./contracts/flow-rally-session.md) | Session card → I'm in → host locks roster | Active — **Loop B** | baseline, gtm1 |

### 4.2 Baseline screens & hubs

| ID | File | Purpose | Status | Queue |
|----|------|---------|--------|-------|
| `module-rally-hub` | [module-rally-hub.md](./contracts/module-rally-hub.md) | Rally = Chat / Play / Members hub | Draft | baseline |
| `flow-inbox` | [flow-inbox.md](./contracts/flow-inbox.md) | Inbox filters → game chat / Rally hub | Draft — sprint prep | baseline |
| `flow-play-screen` | [flow-play-screen.md](./contracts/flow-play-screen.md) | Discover + Today cards; Classes segment (v1.1+) | Draft — sprint prep | baseline |

### 4.3 Shipped flows — validate before production

| ID | File | Purpose | Status | Queue / when |
|----|------|---------|--------|--------------|
| `flow-game-room` | [flow-game-room.md](./contracts/flow-game-room.md) | Game chat + roster actions (I'm in, lock, nudge) | Draft — not in loop yet | Before production |
| `flow-create-game` | [flow-create-game.md](./contracts/flow-create-game.md) | Create pickup/Rally session + host invite | Draft — sprint prep | Before production |
| `flow-profile` | [flow-profile.md](./contracts/flow-profile.md) | Profile edit, scorecard, sign out | Draft — sprint prep | Before production |
| `flow-auth-onboarding` | [flow-auth-onboarding.md](./contracts/flow-auth-onboarding.md) | Auth + pending deep link replay | Draft — sprint prep | Before production |
| `flow-post-game-attendance` | [flow-post-game-attendance.md](./contracts/flow-post-game-attendance.md) | Host marks attendance after locked session | Draft — shipped | phase1a, gtm1 |
| `flow-host-nudges` | [flow-host-nudges.md](./contracts/flow-host-nudges.md) | Host nudges non-ready members | Draft — shipped | phase1a |
| `flow-post-game-recap` | [flow-post-game-recap.md](./contracts/flow-post-game-recap.md) | Shareable recap after attendance | Draft — partial | phase2-recap, gtm1 |

### 4.4 Cross-cutting modules

| ID | File | Purpose | Status | When to validate |
|----|------|---------|--------|------------------|
| `module-game-card` | [module-game-card.md](./contracts/module-game-card.md) | Preset-driven cards; **narrow sprint** = detail hero + venue + wiring audit | Draft — narrowed | phase2-game-card |
| `module-invite-link` | [module-invite-link.md](./contracts/module-invite-link.md) | Game/Rally URLs, landing pages, deep link matrix | Active module | Invite PRs |
| `module-sport-icon` | [module-sport-icon.md](./contracts/module-sport-icon.md) | Plain glyph sport icons per surface | Active module | Icon PRs |
| `module-analytics-events` | [module-analytics-events.md](./contracts/module-analytics-events.md) | Event name registry + retention SQL | Draft | phase1a; GTM 2 scorecard |

### 4.5 Phase 1 retention (group stickiness)

| ID | File | Purpose | Status | Queue |
|----|------|---------|--------|-------|
| `flow-availability-poll` | [flow-availability-poll.md](./contracts/flow-availability-poll.md) | Poll in Rally chat → vote → close | Backend shipped | phase1b ✅ |
| `flow-rotation-pairing` | [flow-rotation-pairing.md](./contracts/flow-rotation-pairing.md) | Fair pairings after roster lock | Backend shipped | phase1c |
| `flow-mini-tournament` | [flow-mini-tournament.md](./contracts/flow-mini-tournament.md) | Private round-robin inside Rally | Partial | phase1c |
| `module-rally-leaderboard` | [module-rally-leaderboard.md](./contracts/module-rally-leaderboard.md) | In-group standings on Members tab | UI shipped | phase1c |

### 4.6 Ops / retention automation

| ID | File | Purpose | Status | Queue |
|----|------|---------|--------|-------|
| `flow-crew-dormancy-nudge` | [flow-crew-dormancy-nudge.md](./contracts/flow-crew-dormancy-nudge.md) | Push captain when Rally idle 14d | Implemented | ops |

### 4.7 Coach / parent / student track (CPS)

**Design hub:** [coach-parent-student/README.md](./coach-parent-student/README.md)  
**UI concept:** [parent-student-coach-ui-ideas.md](./coach-parent-student/parent-student-coach-ui-ideas.md)  
**Safety model:** [parent-student-coach-safety-design.md](./coach-parent-student/parent-student-coach-safety-design.md)

**Navigation principle (agreed):** no 5th tab — Family + Coach Tools as **Profile sections**; Play = Classes discover; Today/hub = ongoing classes; Inbox = announcements.

| ID | File | Purpose | Status | Release / queue |
|----|------|---------|--------|-----------------|
| `module-coach-parent-navigation` | [module-coach-parent-navigation.md](./contracts/module-coach-parent-navigation.md) | Tab map + Profile sections + Play Classes | Implemented | v1.1 · `v1.1-coach-foundation` |
| `flow-age-gate-onboarding` | [flow-age-gate-onboarding.md](./contracts/flow-age-gate-onboarding.md) | Age category at signup; block under-13 self-service | Implemented (flag-gated) | v1.2 · `v1.2-parent-student-core` |
| `module-student-profile` | [module-student-profile.md](./contracts/module-student-profile.md) | Parent-owned reusable student profiles | Implemented (flag-gated) | v1.2 |
| `module-student-visibility` | [module-student-visibility.md](./contracts/module-student-visibility.md) | RLS + no minors on public surfaces | Implemented | v1.2 |
| `flow-parent-guardian-consent` | [flow-parent-guardian-consent.md](./contracts/flow-parent-guardian-consent.md) | Guardian attestation before student profile | Implemented — **copy blocked** | v1.2 — lawyer H* |
| `flow-student-class-enrollment` | [flow-student-class-enrollment.md](./contracts/flow-student-class-enrollment.md) | Coach invite → parent picks child → enroll | Implemented | v1.3 · `v1.3-parent-pilot` |
| `flow-coach-minor-class-roster` | [flow-coach-minor-class-roster.md](./contracts/flow-coach-minor-class-roster.md) | Coach roster + attendance for enrolled minors | Implemented | v1.3 |
| `flow-coach-class-operations` | [flow-coach-class-operations.md](./contracts/flow-coach-class-operations.md) | Cancel / defer + notify parents | Implemented | v1.4 · `v1.4-coach-ops` |

**CPS rule:** No broad Builder on minors until GTM 2 passes + P0 legal + `lawyer_copy_approved` on consent contract.

---

## 5. Human decision gates (H*) — rollup

Resolve before shipping blocked areas. Full detail in each contract.

### Launch / core

| Contract | Gate | Question | Owner |
|----------|------|----------|-------|
| `flow-age-gate-onboarding` | H3 | App Store / Play declared audience age matches behavior | Founder + lawyer |
| `module-game-card` | — | `mapTeaser` preset still unwired on MapScreen | Builder when scoped |

### CPS — legal (blockers)

| Contract | Gate | Question | Owner |
|----------|------|----------|-------|
| `flow-parent-guardian-consent` | H1 | COPPA verifiable consent mechanism | Lawyer |
| `flow-parent-guardian-consent` | H2 | Data retention after delete | Lawyer |
| `flow-parent-guardian-consent` | H3 | Regional variants (CA, EU minors) | Lawyer |
| `flow-parent-guardian-consent` | H4 | Photo/media consent separate checkbox? | Product + lawyer |
| `flow-parent-guardian-consent` | — | **`lawyer_copy_approved: false`** — app shows blocker until true | Lawyer |

### CPS — product (resolved or TBD)

| Contract | Gate | Decision / question |
|----------|------|---------------------|
| `module-coach-parent-navigation` | H4 | **No 5th tab** ✅ |
| `module-coach-parent-navigation` | H2 | Classes sport filter **required** ✅ |
| `module-coach-parent-navigation` | H3 | Profile labels **Family** · **Coach Tools** ✅ |
| `module-student-profile` | H1 | Birth year vs age band on student profile |
| `module-student-profile` | H3 | Claim-at-18 migration |
| `module-student-visibility` | H1 | First name only on coach roster? |
| `module-student-visibility` | H2 | Photos on roster in pilot? |
| `flow-coach-minor-class-roster` | H1 | Parent sees attendance in-app vs email? |
| `flow-coach-minor-class-roster` | H2 | Show parent contact on coach roster? |
| `flow-age-gate-onboarding` | H1 | **Category only** (not DOB) ✅ |
| `flow-age-gate-onboarding` | H2 | Re-prompt existing users without age category? |

---

## 6. Contract quality checklist (advisor rubric)

Use when reviewing any contract file:

| Criterion | Good | Flag if missing |
|-----------|------|-----------------|
| **Observable rows** | Every checklist row = action + expected UI | Vague "works well" rows |
| **Demo setup** | Exact seed, accounts, deep links | "Use demo data" only |
| **Screenshots** | Named files in `screenshots/{id}/` | No proof plan |
| **Out of scope** | Explicit deferrals | Scope creep |
| **H* gates** | Blocked copy/features labeled | Lawyer text in app without approval flag |
| **Dependencies** | Links to related contracts | Orphan flows |
| **North-star** | One sentence testable outcome | Marketing prose only |

**Gold reference:** [flow-invite-to-rally.md](./contracts/flow-invite-to-rally.md)

---

## 7. Known gaps & risks (for advisor)

| Risk | Detail | Status (2026-06-16) |
|------|--------|------------------------|
| **CPS ahead of GTM** | Much CPS code exists flag-gated — risk of shipping minors surface before adult beta proves | **Mitigated:** flag-off checklist in `module-coach-parent-navigation` |
| **Consent blocker** | Guardian attestation infrastructure built; **copy not lawyer-approved** | Unchanged — hard stop |
| **Invite device vs sim** | Contract excluded HTTPS/install; contradicted launch gate | **Fixed:** GTM 1 device rows in `flow-invite-to-rally` |
| **Recap P0 vs P1** | Partial ship in gtm1 queue | **Fixed:** P0 = card load; P1 = share |
| **game-card scope** | Intentionally narrowed | No change needed |
| **game-room gap** | Inbox chat path not in gtm1 | **Documented** in `flow-rally-session` + `flow-game-room` |
| **Analytics scorecard** | GTM 2 depends on events | **Promoted** to GTM 2 blocker in `validation-queue.md` |
| **Student visibility H1/H2** | Unresolved roster display | **Resolved:** nickname only, no photos (pilot) |

---

## 8. Questions for advisory review

1. **Contract count** — 27 flow/module specs: too many for solo founder, or right granularity?
2. **CPS sequencing** — v1.1 navigation before lawyer on v1.2 consent — correct?
3. **Profile as CPS home** — Family + Coach Tools sections vs dedicated coach hub at scale?
4. **phase2-game-card** — Worth validating before GTM 2, or pure distraction?
5. **H* rollup** — Which lawyer gates are P0 before any TestFlight with coach class pilot?
6. **Deferred contracts** — Payments, leagues, academy org correctly absent?
7. **Store review** — Age gate + sports/social UGC: any contract gaps for App Review rejection risk?

---

## 9. Related docs

| Doc | Purpose |
|-----|---------|
| [advisory-handoff-jun-2026.md](./advisory-handoff-jun-2026.md) | Agent layers + validation loop portable guide |
| [launch-roadmap-jun-2026.md](./launch-roadmap-jun-2026.md) | GTM 1–3, launch gate, store guidance |
| [post-v1-roadmap-contracts.md](./post-v1-roadmap-contracts.md) | Master index + build order |
| [contracts/README.md](./contracts/README.md) | Contract folder index |
| [contracts/VALIDATION-RUNBOOK.md](./contracts/VALIDATION-RUNBOOK.md) | Per-item Validator prompts |
| [coach-parent-student/validation-readiness.md](./coach-parent-student/validation-readiness.md) | CPS validate-when-ready matrix |
| [store-review-test-accounts.md](./store-review-test-accounts.md) | Demo logins for Validator + App Review |

---

## 10. Prompt for advisory agent

Copy into a fresh Agent chat:

```
You are an advisory reviewer for Rally (sports coordination app, React Native / Expo / Supabase).

Read in order:
1. RallyApp/docs/advisory-handoff-contracts-jun-2026.md (this handoff — full catalog)
2. RallyApp/docs/advisory-handoff-jun-2026.md (validation loop system)
3. RallyApp/docs/launch-roadmap-jun-2026.md (GTM gates)
4. RallyApp/docs/contracts/flow-invite-to-rally.md (gold contract template)
5. RallyApp/docs/contracts/module-coach-parent-navigation.md (CPS navigation)
6. RallyApp/docs/coach-parent-student/parent-student-coach-safety-design.md (minors safety)

Then spot-check these contracts for gaps:
- flow-rally-session.md
- flow-post-game-attendance.md
- flow-post-game-recap.md
- flow-parent-guardian-consent.md
- module-student-visibility.md
- module-game-card.md

Review goals:
1. Contract granularity — right split of flow vs module?
2. Queue order vs GTM 1–3 — anything validating too early or too late?
3. H* human gates — which are P0 blockers before beta / coach pilot?
4. CPS track separation from adult friend-group beta — sufficient?
5. App Store review risk — missing contracts or checklist rows?
6. What to defer, merge, or simplify at 50–200 MAU solo-founder scale?

Output format:
- Executive verdict (3–5 sentences)
- P0 / P1 / P2 recommendations (actionable, not a system rewrite)
- Per-contract notes only where you found material gaps (table: contract id | issue | suggested fix)
- Open questions for founder (numbered, max 5)
```

---

## 11. Quick file list (all contracts)

For bulk review — open each file under `RallyApp/docs/contracts/`:

```
flow-invite-to-rally.md
flow-rally-session.md
module-rally-hub.md
flow-inbox.md
flow-play-screen.md
flow-game-room.md
flow-create-game.md
flow-profile.md
flow-auth-onboarding.md
flow-post-game-attendance.md
flow-host-nudges.md
flow-post-game-recap.md
module-game-card.md
module-invite-link.md
module-sport-icon.md
module-analytics-events.md
flow-availability-poll.md
flow-rotation-pairing.md
flow-mini-tournament.md
module-rally-leaderboard.md
flow-crew-dormancy-nudge.md
module-coach-parent-navigation.md
flow-age-gate-onboarding.md
module-student-profile.md
module-student-visibility.md
flow-parent-guardian-consent.md
flow-student-class-enrollment.md
flow-coach-minor-class-roster.md
flow-coach-class-operations.md
```

**Supporting (not contracts):** `validation-queues.json`, `validation-queue.md`, `VALIDATION-RUNBOOK.md`, `MANUAL-RUN-loop-a.md`
