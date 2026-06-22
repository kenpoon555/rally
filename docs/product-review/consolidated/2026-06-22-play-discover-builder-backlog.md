# Builder backlog — play-discover · 2026-06-22

**Source:** [2026-06-22-play-discover-synthesis.md](./2026-06-22-play-discover-synthesis.md)  
**Branch:** `fix/play-discover-builder` · **No src/ until validation plan approved**

| ID | Priority | Item | Contract | Likely files | Status |
|----|----------|------|----------|--------------|--------|
| B1 | P1 | Games empty title uses **sport name** (Running vs "active") | `flow-play-screen` | `DiscoverEmptyState.tsx`, `productCopy.ts` | Open |
| B2 | P1 | Players section: recency filter **or** subtitle fix (H1) | `flow-play-screen` | `HomeScreen.tsx`, `freeAgentService.ts` RPC | Open |
| B3 | P1 | R0 Classes segment hidden when no class context | `module-role-surfaces` | `surfaceVisibility.ts`, `HomeScreen.tsx` | **Shipped** — validate |
| B4 | P1 | Sport-scoped Players RPC (no null filter) | `module-role-surfaces` | `surfaceVisibility.ts`, `HomeScreen.tsx` | **Shipped** — validate |
| B5 | P1 | First-timer empty: *"Have an invite?"* secondary CTA | `flow-play-screen` | `DiscoverEmptyState.tsx` | **Shipped** — validate |
| B6 | P2 | Meetup empty copy (Running) — no "court" steps | `module-sport-meetup-sports` | `DiscoverEmptyState.tsx` | **Shipped** — validate |
| B7 | **P1** | **Off-strip sport visible in strip slot 3** (swap like Create Game; last selected persists via `preferred_sports`) | `flow-play-screen` | `HomeScreen.tsx`, `DiscoverSportFilters.tsx` | **Open** — contract rows #15–16 |
| B8 | P2 | Free-agent row tap → profile/DM for non-host | `flow-play-screen` | `CompactFreeAgentRow.tsx` | Open |
| B9 | P2 | Next Up card → session detail not chat | `flow-rally-session` | `DynamicHomeScreen.tsx` | Open |
| B10 | P2 | Seed 1+ open badminton discover game | `flow-play-screen` | `seed_monrovia_*.sql` | Ops |
| B11 | **P1** | Discover empty-state hero icon — plain or 56px circle; no square tile | `module-sport-icon` | `DiscoverEmptyState.tsx`, `sportIconPresets.ts` | **Open** — contract fail 2026-06-22 |

**Suggested Builder order (post–round 1):** B7 → B11 → B8–B9.

**Validation:** `./.cursor/hooks/validation-loop-start.sh --queue play-discover-matrix --from flow-play-screen --builder`
