# Builder backlog — 2026-06-27 · tier0-join-loop

Tier 0 router output. **CR-T0-A/B are already implemented this cycle** (on `fix/class-response-builder`); listed for traceability. CR-T0-1..4 are new, routed from the two persona reviews. **No src/ in the consolidator step** — builder implements after approval.

| ID | Priority | Item | Contract | Likely files | Notes / status |
|----|----------|------|----------|--------------|----------------|
| **CR-T0-A** | P1 | Discover card shows one spot number; urgency hook = time-to-start only | `module-game-card` | `src/components/game/GameListCard.tsx` | ✅ Done — verified live ("5 left" + "Starts in 9h") |
| **CR-T0-B** | P1 | Game Room entry gated on membership (`isGameMember`), not chat liveness | `flow-game-room` | `src/pages/Activity/ActivityDetailScreen.tsx` | ✅ Done — verified live (non-member: Request to Join only) |
| **CR-T0-1** | P2 | Ready-count copy must read same roster as WHO'S GOING / dots ("1 of 1 marked ready" bug) | `flow-rally-session` | `ActivityDetailScreen` ready row + `getActivityRosterSummary` consumers | Open. Pending **H2** (what is M). Likely a display-mapping fix, not data |
| **CR-T0-2** | P2 | Resolve discover "left" vs detail "open" label meaning | `module-game-card` | `activityHelpers.ts` label helpers | Open. **Blocked on H1** — do not implement until label decision |
| **CR-T0-3** | P3 | Single time source for Today Next Up header vs card (4:50 vs 5:00) | `flow-today-home` (TBD) | `HomeScreen` header subtitle + `NextUpCard` | Open. Likely header reads a different field/rounding than card |
| **CR-T0-4** | P3 | 3-viewer test fixture (host / approved member / non-member) for live state-matrix runs | `flow-game-room` demo setup | seed script | Open. Enables live verification of host/pending/finalized rows |

## Sequencing
- **H gates first** (H1, H2) — CR-T0-1 and CR-T0-2 are blocked until founder decides labels/semantics.
- CR-T0-3, CR-T0-4 are independent and low-risk; can batch anytime.
- CR-T0-A/B require no further builder work — only validation proof.
