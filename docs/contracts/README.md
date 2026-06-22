# Screen & flow contracts

Written pass/fail targets for agent validation loops. See [advisoragent.md](../../../advisoragent.md) for the workflow (Builder → Validator → Fixer).

**Master index (status + when to validate):** [post-v1-roadmap-contracts.md](../post-v1-roadmap-contracts.md)  
**Advisor review (all contracts):** [advisory-handoff-contracts-jun-2026.md](../advisory-handoff-contracts-jun-2026.md)  
**Go-to-market plan (Jun 2026):** [launch-roadmap-jun-2026.md](../launch-roadmap-jun-2026.md)

**Rule:** No Builder on a new feature without its contract. Bug fixes → Validator on affected contract before `production`.

**Master map (Layers 1–4):** [agent-development-layers.md](./agent-development-layers.md)

**Author contracts:** `.cursor/skills/write-contract/SKILL.md` · [author-contract.md](../.cursor/workflows/author-contract.md)

**Persona product review:** [personas.md](./product-review/personas.md) · `.cursor/skills/product-review/SKILL.md` · [consolidate-product-reviews.md](../.cursor/workflows/consolidate-product-reviews.md)

## Active loops (run every preview PR)

| Contract | Loop | North-star |
|----------|------|------------|
| [flow-invite-to-rally.md](./flow-invite-to-rally.md) | **A** | Friend taps link → signs in → lands in Rally |
| [flow-rally-session.md](./flow-rally-session.md) | **B** | Session card → I'm in → host locks roster |

## Core modules (run when touched)

| Contract | Focus |
|----------|--------|
| [module-game-card.md](./module-game-card.md) | Presets, shells, session actions |
| [module-invite-link.md](./module-invite-link.md) | URLs, landing, deep links |
| [module-sport-icon.md](./module-sport-icon.md) | Icon surfaces |
| [module-rally-hub.md](./module-rally-hub.md) | Chat / Play / Members tabs |
| [module-analytics-events.md](./module-analytics-events.md) | Event names + retention SQL |
| [module-sport-game-modes.md](./module-sport-game-modes.md) | Sport × pickup/tournament/class matrix |

## Coach / parent track

| Contract | Focus |
|----------|--------|
| [ONBOARDING-CONTRACT-INDEX.md](./ONBOARDING-CONTRACT-INDEX.md) | **All role-unlock journeys** (existing + stubs) |
| [module-coach-parent-navigation.md](./module-coach-parent-navigation.md) | Family + Coach Tools entrances |
| [module-role-surfaces.md](./module-role-surfaces.md) | Role × tab surface matrix · Play sport×segment |
| [flow-coach-onboarding-org.md](./flow-coach-onboarding-org.md) | Who is a coach; solo vs academy v2 |
| [flow-become-a-coach.md](./flow-become-a-coach.md) | Manual approval → Coach Tools (stub) |
| [flow-parent-family-onboarding.md](./flow-parent-family-onboarding.md) | First child without seed (stub) |
| [flow-teen-account-onboarding.md](./flow-teen-account-onboarding.md) | 13–17 restrictions (stub) |
| [flow-organization-coaches.md](./flow-organization-coaches.md) | Multi-coach org v2 (stub) |
| [flow-coach-class-operations.md](./flow-coach-class-operations.md) | Defer / cancel / notify |

## Shipped flows (validate before production)

| Contract | Focus |
|----------|--------|
| [flow-game-room.md](./flow-game-room.md) | Game chat + roster actions |
| [flow-create-game.md](./flow-create-game.md) | Create activity + share |
| [flow-play-screen.md](./flow-play-screen.md) | Discover / Today + empty states |
| [flow-inbox.md](./flow-inbox.md) | Inbox filters + navigation |
| [flow-profile.md](./flow-profile.md) | Profile + player modal |
| [flow-auth-onboarding.md](./flow-auth-onboarding.md) | Auth, legal gate, deep links |
| [flow-push-notifications-device.md](./flow-push-notifications-device.md) | Physical device push (FCM + token) |
| [flow-post-game-attendance.md](./flow-post-game-attendance.md) | Host marks attendance |
| [flow-host-nudges.md](./flow-host-nudges.md) | Roster nudge + push |

## Phase 1+ features (validate before feature merge)

| Contract | Phase | Build status |
|----------|-------|--------------|
| [flow-availability-poll.md](./flow-availability-poll.md) | 1.2 | Backend shipped |
| [flow-rotation-pairing.md](./flow-rotation-pairing.md) | 1.3 | Backend shipped |
| [flow-mini-tournament.md](./flow-mini-tournament.md) | 1.4 | Partial |
| [module-rally-leaderboard.md](./module-rally-leaderboard.md) | 1.5 | Partial |
| [flow-post-game-recap.md](./flow-post-game-recap.md) | 2.1 | Partial |
| [flow-crew-dormancy-nudge.md](./flow-crew-dormancy-nudge.md) | Ops | **Not built** |

Loop A/B rules: `rally-flow-invite.mdc`, `rally-flow-rally-session.mdc`. Sprint prep rules: `rally-*.mdc` per flow in table above.

## How to validate

**Workflow (copy-paste prompts):** [.cursor/workflows/validate-contract.md](../../.cursor/workflows/validate-contract.md)

1. **Builder** — Read the contract. Fix only what fails the checklist.
2. **Validator** — Run iOS simulator (Android for keyboard/push). Screenshots + pass/fail table. **No code changes.**
3. **Fixer** — Fix only failed rows. Max **2–3** rounds then log blocker.

Open **three Cursor chats** (or phases in order): Validator first, Fixer if needed, Builder only if flow missing.

### Stop conditions

- All checklist items pass, **or**
- Same failure after **2–3** fix attempts → log in contract **Open issues** and stop.

### Demo data (linked preview)

| Role | Account |
|------|---------|
| Host | `marcus@rally-mvrhoops.demo` |
| Member | `@kunyu` |
| Seeds | `scripts/seed-monrovia-basketball-rally-demo.mjs` + `supabase/scripts/seed_monrovia_basketball_rally_demo.sql` |

See [store-review-test-accounts.md](../store-review-test-accounts.md) · [MANUAL-RUN-loop-a.md](./MANUAL-RUN-loop-a.md)

### Screenshot output

`docs/contracts/screenshots/{contract-id}/` — filenames from each contract's **Screenshots required** section.

## Contract template

See bottom of previous README revision — use for any new `flow-*.md` or `module-*.md`.

## Related docs

- [post-v1-roadmap-contracts.md](../post-v1-roadmap-contracts.md)
- [vision.md](../vision.md)
- [QA_BETA_CREW_CHECKLIST.md](../QA_BETA_CREW_CHECKLIST.md)

## Coach / parent / student

**Track:** [coach-parent-student/README.md](../coach-parent-student/README.md) · [ONBOARDING-CONTRACT-INDEX.md](./ONBOARDING-CONTRACT-INDEX.md)

| Contract | Release |
|----------|---------|
| [flow-become-a-coach.md](./flow-become-a-coach.md) | v1.1 stub |
| [flow-parent-family-onboarding.md](./flow-parent-family-onboarding.md) | v1.2 stub |
| [flow-teen-account-onboarding.md](./flow-teen-account-onboarding.md) | v1.2 stub |
| [flow-organization-coaches.md](./flow-organization-coaches.md) | v2.0 stub |
| [flow-age-gate-onboarding.md](./flow-age-gate-onboarding.md) | v1.2 |
| [module-student-profile.md](./module-student-profile.md) | v1.2 |
| [module-student-visibility.md](./module-student-visibility.md) | v1.2 |
| [flow-parent-guardian-consent.md](./flow-parent-guardian-consent.md) | v1.2 — lawyer H* |
| [flow-student-class-enrollment.md](./flow-student-class-enrollment.md) | v1.3 pilot |
| [flow-coach-minor-class-roster.md](./flow-coach-minor-class-roster.md) | v1.3 pilot |
| [flow-coach-class-operations.md](./flow-coach-class-operations.md) | v1.4 |

**Validation queue:** `cps-onboarding` in [validation-queues.json](./validation-queues.json)

## Deferred (no contract until scoped)

Payments, Teams, Leagues, Need Players / Free Agent boards, rich chat media.
