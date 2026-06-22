# Flow — Host roster nudges

**Contract id:** `flow-host-nudges`  
**Status:** Draft — shipped; validation pending  
**Phase:** 3.2  
**Screens:** `CrewGameSessionCard`, `GameRoomActionBar`, session actions  
**Related code:** `src/services/gameCardSessionActions.ts` (`nudgeGameRoster`), `nudgeSessionRoster` RPC, push edge function

## Purpose

Host prompts non-ready members to tap **I'm in** before lock — reduces WhatsApp chasing.

North-star: **Host taps Nudge → eligible members get in-app alert and/or push → ready count increases.**

## Demo setup

1. Rally session with member on roster but `ready_at` null.
2. Host account on same session.

## Required states

| State | Must show |
|-------|-----------|
| **Host, pre-lock** | Nudge action visible when policy allows |
| **After nudge** | Confirmation with count of nudged users |
| **Member** | In-app notification and/or push (physical device for push) |
| **Post-lock** | Nudge hidden or disabled |

## Pass/fail checklist

- [ ] Non-host cannot nudge
- [ ] Nudge disabled after roster locked
- [ ] Already-ready members not nudged (or RPC returns accurate count)
- [ ] Rate limit respected — repeated nudge doesn't spam (backend or UI cooldown)
- [ ] Android + iOS action bar / session card both use `gameCardSessionActions` — no duplicate handlers
- [ ] Push path tested on **physical device** (optional row in Validator report)

## Screenshots required

`docs/contracts/screenshots/flow-host-nudges/` — host nudge button, confirmation toast.

## Related

- [module-game-card.md](./module-game-card.md)
- [flow-rally-session.md](./flow-rally-session.md)
- [flow-game-room.md](./flow-game-room.md)

## Open issues

| Date | Blocker | Owner |
|------|---------|-------|
| — | Push requires physical device | — |

## Validator report

> Run: 2026-06-22 · `marcus@rally-mvrhoops.demo` · upcoming `Morning pickup run`

| # | Checklist item | Pass | Notes |
|---|----------------|------|-------|
| 1 | Host can nudge pre-lock | ✅ | `nudge_session_roster` returned `1` (riley not ready) |
| 2 | Nudge disabled post-lock | ✅ | Covered in `flow-rally-session` lock row |
| 3 | Non-host cannot nudge | N/T | RPC auth assumed; not UI-tested |
| 4 | Rate limit / cooldown | N/T | Not exercised |
| 5 | Push delivery | N/T | Device only |
| 6 | Chat system message | ✅ | Rally chat shows nudge copy after RPC |

**Last validated:** 2026-06-22
