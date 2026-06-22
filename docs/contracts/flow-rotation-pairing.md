# Flow — Session rotation / pairing

**Contract id:** `flow-rotation-pairing`  
**Status:** Draft — backend shipped; UI validation pending  
**Phase:** 1.3  
**Screens:** Locked session → rotation panel (Rally hub or game detail)  
**Related code:** `src/services/sessionRotationService.ts`, RPCs `generate_session_rotation`, `get_session_rotation_state`

## Purpose

Generate fair pairings / court assignments for doubles-style sessions (badminton, pickleball) after roster is locked.

North-star: **Host on locked session → generate rotation → members see round list.**

## Demo setup

1. Complete Loop B through **roster locked** on a Rally session with ≥4 ready players (seed or test accounts).
2. Host opens rotation UI from session card or game detail.

## Required states

| State | Must show |
|-------|-----------|
| **No rotation** | Host-only **Generate rotation** (or equivalent) when roster locked |
| **Rotation generated** | Round list with player/team pairings per court |
| **Regenerate** | Host can regenerate; members see updated rounds (if product allows) |
| **Non-host** | Read-only rotation view |

## Pass/fail checklist

- [ ] Generate disabled until roster locked (or policy met)
- [ ] `generate_session_rotation` succeeds for seeded demo
- [ ] Rotation visible after app refresh (`get_session_rotation_state`)
- [ ] `rotation_generated` analytics event fires
- [ ] Wrong activity id cannot generate rotation for another session
- [ ] Empty roster / insufficient players shows clear error — no crash

## Screenshots required

`docs/contracts/screenshots/flow-rotation-pairing/` — pre-generate, generated rounds, member read-only.

## Out of scope

- Auto-rotation every week without host action
- Singles sports rotation (optional future)

## Depends on

- [flow-rally-session.md](./flow-rally-session.md) — locked roster prerequisite

## Open issues

| Date | Blocker | Owner |
|------|---------|-------|
| — | Not validated yet | — |

## Validator report

> Run: 2026-06-22 · pickleball seed `f2000001-…000006` · `generate_session_rotation`

| # | Checklist item | Pass | Notes |
|---|----------------|------|-------|
| 1 | Generate on locked roster | ✅ | RPC returned rotation id `96db2075-…` |
| 2 | State after refresh | ✅ | `get_session_rotation_state` returns courts + players |
| 3 | `rotation_generated` event | ✅ | Fired in `sessionRotationService.ts` |
| 4 | UI panel on sim | N/T | Pickleball crew `…000102` — detail rotation panel not screenshot |

**Last validated:** 2026-06-22 — backend + RPC green
