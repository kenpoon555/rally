# Post-v1 roadmap — contract index

**Last updated:** 2026-06-14  
**Workflow:** [.cursor/workflows/validate-contract.md](../.cursor/workflows/validate-contract.md)  
**Strategy:** [vision.md](./vision.md) · [open_items.md](../../open_items.md)

## Rule

**No Builder work on a new feature without its contract.** Bug fixes → run the affected contract's Validator before merge to `production`.

## Master table

| # | Item | Phase | Ship status | Contract | When to validate |
|---|------|-------|-------------|----------|------------------|
| — | Bug fixes | — | Ongoing | Affected flow below | Every fix PR |
| A | Invite → Rally | 0 | Shipped | [flow-invite-to-rally.md](./contracts/flow-invite-to-rally.md) | **Loop A** — every `dev→preview` |
| B | Session → I'm in → lock | 0 | Shipped | [flow-rally-session.md](./contracts/flow-rally-session.md) | **Loop B** — every `dev→preview` |
| — | Game card module | 0 | Shipped | [module-game-card.md](./contracts/module-game-card.md) | Any card PR |
| — | Sport icons | 0 | Shipped | [module-sport-icon.md](./contracts/module-sport-icon.md) | Icon PRs |
| — | Invite links | 0 | Shipped | [module-invite-link.md](./contracts/module-invite-link.md) | Invite PRs |
| — | Rally hub tabs | 0 | Shipped | [module-rally-hub.md](./contracts/module-rally-hub.md) | Hub refactors |
| — | Game room | 0 | Shipped | [flow-game-room.md](./contracts/flow-game-room.md) | Before `production` |
| — | Create game | 0 | Shipped | [flow-create-game.md](./contracts/flow-create-game.md) | Before `production` |
| — | Play / Today | 0 | Shipped | [flow-play-screen.md](./contracts/flow-play-screen.md) | Before `production` |
| — | Inbox | 0 | Shipped | [flow-inbox.md](./contracts/flow-inbox.md) | Before `production` |
| — | Profile | 0 | Shipped | [flow-profile.md](./contracts/flow-profile.md) | Before `production` |
| — | Auth / onboarding | 0 | Shipped | [flow-auth-onboarding.md](./contracts/flow-auth-onboarding.md) | Before `production` |
| — | Post-game attendance | 0 | Shipped | [flow-post-game-attendance.md](./contracts/flow-post-game-attendance.md) | After Loop B |
| — | Host nudges | 3 | Shipped | [flow-host-nudges.md](./contracts/flow-host-nudges.md) | Session / push PRs |
| — | Analytics events | 0 | Partial | [module-analytics-events.md](./contracts/module-analytics-events.md) | Retention PRs |
| 1.1 | Session card polish | 1 | Partial | [module-game-card.md](./contracts/module-game-card.md) + [flow-rally-session.md](./contracts/flow-rally-session.md) | Polish sprint |
| 1.2 | Availability poll | 1 | Backend shipped | [flow-availability-poll.md](./contracts/flow-availability-poll.md) | Before poll UI merge |
| 1.3 | Rotation / pairing | 1 | Backend shipped | [flow-rotation-pairing.md](./contracts/flow-rotation-pairing.md) | Before rotation UI merge |
| 1.4 | Mini tournament | 1 | Partial | [flow-mini-tournament.md](./contracts/flow-mini-tournament.md) | Tourney sprint |
| 1.5 | In-group leaderboard | 1 | Partial | [module-rally-leaderboard.md](./contracts/module-rally-leaderboard.md) | Leaderboard PRs |
| 2.1 | Post-game recap | 2 | Partial | [flow-post-game-recap.md](./contracts/flow-post-game-recap.md) | After attendance |
| 2.2 | Venue / cost block | 2 | Partial | [module-game-card.md](./contracts/module-game-card.md) | Venue PRs |
| Ops | Today empty state | 0 | Partial | [flow-play-screen.md](./contracts/flow-play-screen.md) | Empty-state PR |
| Ops | Crew dormancy push | Ops | **Not built** | [flow-crew-dormancy-nudge.md](./contracts/flow-crew-dormancy-nudge.md) | Before cron ship |
| — | Payments / leagues | 5+ | Deferred | Contract when scoped | — |

## Suggested validation order (promote draft → active)

1. **Now:** Loop A + B on every preview PR  
2. **Before v1.1 store build:** Promote core drafts — inbox, game-room, play-screen, profile, auth, module-rally-hub  
3. **Per feature sprint:** Validator on that feature's contract before merge to `dev`  

## Agent roles

| Role | Contract input | Output |
|------|----------------|--------|
| **Builder** | One contract file | Code + checklist items addressed |
| **Validator** | Same contract | Pass/fail table + screenshots |
| **Fixer** | Failed rows only | Surgical fix |

Prompts: [validate-contract.md](../.cursor/workflows/validate-contract.md)

## Deferred (no contract until scoped)

- Organizer Pro / payments  
- Teams / leagues  
- Need Players / Free Agent boards  
- Rich chat (image / audio / calls)  
