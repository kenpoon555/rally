# QA build handoff — collective test run

**Date:** 2026-06-02  
**Branch:** preview (apply migration before testing)

## Before you QA

1. **Migration 032** — **Applied 2026-06-02** to linked project `casljueycxsqexpkdiuq`:
   ```bash
   cd RallyApp && supabase db query -f supabase/migrations/032_advisor_implementation.sql --linked --yes
   ```
   (`supabase db push` not used — remote uses timestamp migration IDs; SQL applied directly.)

2. **Rebuild the app** (iOS runbook: `docs/current-setup-app-guide.md` §12).

3. **Script:** `docs/QA_BETA_CREW_CHECKLIST.md` (advisor §8).

## Built in this track (ready to verify)

| Area | What to test |
|------|----------------|
| **Copy (A1)** | Rallys naming, glossary sheet on Dynamic Home |
| **Home (B2–B3)** | Next up, needs I'm in, host summary, games near you, Bring Rally CTA |
| **Session note (A4)** | Host edits on Activity Detail; shows on `CrewGameSessionCard` |
| **Join / I'm in / lock (A3)** | Join, I'm in, lock roster; host long-press remove pre-lock |
| **Waitlist (C2)** | Full Rally game → waitlist alert (chat + crew profile + game room) |
| **Post-game (C3)** | After game end + lock → "Record who showed up" → attendance screen |
| **Reliability (A5)** | Profile reliability line; trust line on player preview (needs locked games + attendance submit) |
| **Create (CREATE-01)** | Public game default; link to schedule via Rally profile |
| **Profile TZ** | Time zone picker under Schedule |
| **Inbox legacy (A6)** | Old per-activity crew chats hidden for Rally games (032 backfill) |

## Deferred (do not file as bugs yet)

| Item | Notes |
|------|--------|
| **A7** | Public game = ephemeral Rally — ADR only |
| **A2 Guests** | Guest-scoped chat / `is_guest` — not built |
| **A3-2** | `request_roster_confirmation` push — skipped |
| **A6-4** | Drop `activity_rsvps` table — not done |
| **TOUR / Teams / Leagues** | Phase 5 |

## Quick smoke paths

1. **Public game:** Discover → join → host approves → I'm in → lock → (after end) attendance.
2. **Rally game:** Rally chat → join / waitlist → I'm in → lock → session note visible on card.
3. **Home:** Explorer vs regular subtitles; glossary; host card if hosting.

## Known fixes (2026-06-02)

- **Rally profile load error** (`more than one relationship… activities and profiles`) — fixed FK hints in `regularGroupService` / `chatService`; reload Metro.
- **Home “Ready to lock” with only host** — UI now shows need players until at least one approved joiner.

## If something fails

Note: screen, steps, preview vs local, and whether **032** was applied. RPC errors often mean migration not run.
