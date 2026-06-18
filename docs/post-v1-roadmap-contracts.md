# Post-v1 roadmap — contract index

**Last updated:** 2026-06-15  
**Go-to-market gates:** [launch-roadmap-jun-2026.md](./launch-roadmap-jun-2026.md) — **read before adding contracts**  
**Workflow:** [.cursor/workflows/validate-contract.md](../.cursor/workflows/validate-contract.md)  
**Strategy:** [vision.md](./vision.md) (long-term) · [launch-roadmap-jun-2026.md](./launch-roadmap-jun-2026.md) (this quarter)

## Rule

**No Builder work on a new feature without its contract.** Bug fixes → run the affected contract's Validator before merge to `production`.

**GTM gate (Jun 2026):** Do not add contracts for Coach Pro, in-app payments, Teams/Leagues, or broad discovery until [launch-roadmap-jun-2026.md](./launch-roadmap-jun-2026.md) GTM 2 passes (2+ groups schedule a second session). Small fixes and launch-gate flows are always allowed.

## Build order vs validation

| Priority | What | Contracts |
|----------|------|-----------|
| **GTM 1 — Launch** | Device invite loop, attendance, recap | Loop A/B, attendance, recap — mostly ✅ |
| **GTM 2 — Real groups** | Fix pain from 3–5 test groups | Affected flow contracts only |
| **GTM 3 — Retention wedge** | Schedule next, dormancy, coach foundation | When evidenced — see launch roadmap |
| **Backlog** | phase1c polish (rotation, tourney, leaderboard) | Validate when group tests need them — not before launch gate |

## Master table

| # | Item | Phase | Ship status | Contract | When to validate |
|---|------|-------|-------------|----------|------------------|
| — | Bug fixes | — | Ongoing | Affected flow below | Every fix PR |
| A | Invite → Rally | 0 | Shipped | [flow-invite-to-rally.md](./contracts/flow-invite-to-rally.md) | **Loop A** — every `dev→preview` + **device** before broad invite |
| B | Session → I'm in → lock | 0 | Shipped | [flow-rally-session.md](./contracts/flow-rally-session.md) | **Loop B** — every `dev→preview` |
| — | Game card module | 0 | Shipped | [module-game-card.md](./contracts/module-game-card.md) | phase2-game-card (detail + venue) |
| — | Sport icons | 0 | Shipped | [module-sport-icon.md](./contracts/module-sport-icon.md) | Icon PRs |
| — | Invite links | 0 | Shipped | [module-invite-link.md](./contracts/module-invite-link.md) | Invite PRs |
| — | Rally hub tabs | 0 | Shipped | [module-rally-hub.md](./contracts/module-rally-hub.md) | Hub refactors |
| — | Game room | 0 | Shipped | [flow-game-room.md](./contracts/flow-game-room.md) | Before `production` |
| — | Create game | 0 | Shipped | [flow-create-game.md](./contracts/flow-create-game.md) | Before `production` |
| — | Play / Today | 0 | Shipped | [flow-play-screen.md](./contracts/flow-play-screen.md) | Before `production` |
| — | Inbox | 0 | Shipped | [flow-inbox.md](./contracts/flow-inbox.md) | Before `production` |
| — | Profile | 0 | Shipped | [flow-profile.md](./contracts/flow-profile.md) | Before `production` |
| — | Auth / onboarding | 0 | Shipped | [flow-auth-onboarding.md](./contracts/flow-auth-onboarding.md) | Before `production` |
| — | Post-game attendance | 0 | Shipped | [flow-post-game-attendance.md](./contracts/flow-post-game-attendance.md) | GTM 1 launch gate |
| — | Host nudges | 3 | Shipped | [flow-host-nudges.md](./contracts/flow-host-nudges.md) | GTM 3 — after real group data |
| — | Analytics events | 0 | Partial | [module-analytics-events.md](./contracts/module-analytics-events.md) | **P1** — beta scorecard events |
| 1.1 | Session card polish | 1 | Partial | [module-game-card.md](./contracts/module-game-card.md) | phase2-game-card |
| 1.2 | Availability poll | 1 | Shipped | [flow-availability-poll.md](./contracts/flow-availability-poll.md) | ✅ phase1b |
| 1.3 | Rotation / pairing | 1 | Backend shipped | [flow-rotation-pairing.md](./contracts/flow-rotation-pairing.md) | When test group needs it |
| 1.4 | Mini tournament | 1 | Partial | [flow-mini-tournament.md](./contracts/flow-mini-tournament.md) | When test group needs it |
| 1.5 | In-group leaderboard | 1 | Partial | [module-rally-leaderboard.md](./contracts/module-rally-leaderboard.md) | When test group needs it |
| 2.1 | Post-game recap | 2 | Shipped | [flow-post-game-recap.md](./contracts/flow-post-game-recap.md) | ✅ GTM 1 |
| 2.2 | Venue / cost block | 2 | Partial | [module-game-card.md](./contracts/module-game-card.md) | phase2-game-card |
| Ops | Today empty state | 0 | Partial | [flow-play-screen.md](./contracts/flow-play-screen.md) | P2 if groups confused |
| Ops | Crew dormancy push | Ops | **Not built** | [flow-crew-dormancy-nudge.md](./contracts/flow-crew-dormancy-nudge.md) | GTM 3 — after replay data |
| — | Founding Organizer / Coach | GTM 3 | **Not built** | Contract when scoped | Manual billing first — [launch-roadmap-jun-2026.md](./launch-roadmap-jun-2026.md) |
| **CPS** | Parent / student / coach safety track | v1.2–v2.0 | **Design only** | [coach-parent-student/README.md](./coach-parent-student/README.md) | **Separate from GTM 1–2** — see release track |
| — | Payments / leagues | 5+ | **Deferred** | Contract when scoped | — |

## Suggested validation order (promote draft → active)

1. **GTM 1:** Device re-test Loop A + launch gate flows (attendance, recap)  
2. **GTM 2:** Validate only contracts tied to real group pain  
3. **Per feature sprint:** Validator on that feature's contract before merge to `dev`  
4. **Layer 1 product review:** After first real group tests — not before launch gate  

## Agent roles

| Role | Contract input | Output |
|------|----------------|--------|
| **Builder** | One contract file | Code + checklist items addressed |
| **Validator** | Same contract | Pass/fail table + screenshots |
| **Fixer** | Failed rows only | Surgical fix |

Prompts: [validate-contract.md](../.cursor/workflows/validate-contract.md)

## Deferred (no contract until scoped)

- Organizer Pro / in-app payments / Stripe — GTM 3, 5+ manual yeses first  
- Teams / leagues  
- Need Players / Free Agent boards — after GTM 2  
- **Parent/student/coach minors track** — [coach-parent-student/README.md](./coach-parent-student/README.md) — v1.2+ after lawyer  
- Coach academy org model — v2.0  
- Rich chat (image / audio / calls)  

### Coach / parent / student track (draft contracts — no Builder yet)

| Contract | Release |
|----------|---------|
| [flow-age-gate-onboarding.md](./contracts/flow-age-gate-onboarding.md) | v1.2 |
| [module-student-profile.md](./contracts/module-student-profile.md) | v1.2 |
| [module-student-visibility.md](./contracts/module-student-visibility.md) | v1.2 |
| [flow-parent-guardian-consent.md](./contracts/flow-parent-guardian-consent.md) | v1.2 (lawyer H*) |
| [flow-student-class-enrollment.md](./contracts/flow-student-class-enrollment.md) | v1.3 pilot |
| [flow-coach-minor-class-roster.md](./contracts/flow-coach-minor-class-roster.md) | v1.3 pilot |
| [flow-coach-class-operations.md](./contracts/flow-coach-class-operations.md) | v1.4 |
| [module-coach-parent-navigation.md](./contracts/module-coach-parent-navigation.md) | v1.1 UI entrances |
