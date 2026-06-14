# Screen & flow contracts

Written pass/fail targets for agent validation loops. See [advisoragent.md](../../../advisoragent.md) for the workflow (Builder → Validator → Fixer).

**Master index (status + when to validate):** [post-v1-roadmap-contracts.md](../post-v1-roadmap-contracts.md)

**Rule:** No Builder on a new feature without its contract. Bug fixes → Validator on affected contract before `production`.

**Author contracts:** `.cursor/skills/write-contract/SKILL.md` · [author-contract.md](../.cursor/workflows/author-contract.md)

**Persona product review:** `.cursor/skills/product-review/SKILL.md` · [product-review.md](../.cursor/workflows/product-review.md)

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

## Shipped flows (validate before production)

| Contract | Focus |
|----------|--------|
| [flow-game-room.md](./flow-game-room.md) | Game chat + roster actions |
| [flow-create-game.md](./flow-create-game.md) | Create activity + share |
| [flow-play-screen.md](./flow-play-screen.md) | Discover / Today + empty states |
| [flow-inbox.md](./flow-inbox.md) | Inbox filters + navigation |
| [flow-profile.md](./flow-profile.md) | Profile + player modal |
| [flow-auth-onboarding.md](./flow-auth-onboarding.md) | Auth, legal gate, deep links |
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

## Deferred (no contract until scoped)

Payments, Teams, Leagues, Need Players / Free Agent boards, rich chat media.
