# Builder backlog — 2026-06-22 · pickup

**Source:** [2026-06-22-pickup-synthesis.md](./2026-06-22-pickup-synthesis.md)  
**Queue:** `pickup-round1` tier 1

---

## P0 — Ship blockers

### B1 · Deep link routing (`group-invite` + `invite/`)

| Field | Value |
|-------|-------|
| **Contract** | `flow-invite-to-rally` |
| **Personas** | 6/6 |
| **Symptom** | URL delivered to native scene; `AuthContext.handleAuthDeepLink` no navigation/alert |
| **Likely files** | `AuthContext.tsx`, `deepLinking.ts`, iOS `AppDelegate` / scene URL bridge |
| **Acceptance** | Signed-in `group-invite` → Rally hub or confirmation; `invite/` → ActivityDetail; invalid token → alert |

### B2 · iOS schedule spinner visible on Create

| Field | Value |
|-------|-------|
| **Contract** | `flow-create-game` |
| **Personas** | `badminton-host`, `volleyball-host` |
| **Symptom** | Spinner rolls; date/time labels not readable |
| **Likely files** | `ScheduleDateTimePicker.tsx`, `CreateActivityScreen.tsx` |
| **Acceptance** | Selected datetime visible in `fieldMeta` below picker |

---

## P1 — Invite polish

### B3 · Signed-out invite auth prompt

| Field | Value |
|-------|-------|
| **Contract** | `flow-invite-to-rally` |
| **Acceptance** | Cold `group-invite` while signed out → Sign in required (not silent welcome) |

---

## P2 — Discover copy

### B4 · Sport-specific empty Discover states

| Field | Value |
|-------|-------|
| **Contract** | `flow-play-screen` |
| **Personas** | `pickleball-first-timer` |

---

## Validation note

`flow-push-notifications-device` remains **physical device** proof — document in validation handoff, not sim P0 fail.
