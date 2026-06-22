# Builder backlog — play-discover · 2026-06-22

**Source:** [2026-06-22-play-discover-synthesis.md](./2026-06-22-play-discover-synthesis.md)  
**Branch:** `fix/play-discover-builder` · **No src/ until validation plan approved**

| ID | Priority | Item | Contract | Likely files | Status |
|----|----------|------|----------|--------------|--------|
| B1 | P1 | Games empty title uses **sport name** (Running vs "active") | `flow-play-screen` | `DiscoverEmptyState.tsx`, `productCopy.ts` | Open |
| B2 | P1 | Players section: recency filter **or** subtitle fix (H1) | `flow-play-screen` | `HomeScreen.tsx`, `freeAgentService.ts` RPC | Open |
| B3 | P1 | R0 Classes segment hidden when no class context | `module-role-surfaces` | `surfaceVisibility.ts`, `HomeScreen.tsx` | **Shipped** — validate |
| B4 | P1 | Sport-scoped Players RPC (no null filter) | `module-role-surfaces` | `surfaceVisibility.ts`, `HomeScreen.tsx` | **Shipped** — validate |
| B5 | P1 | First-timer empty: *"Have an invite?"* secondary CTA | `flow-play-screen` | `DiscoverEmptyState.tsx` | Open |
| B6 | P2 | Meetup empty copy (Running) — no "court" steps | `module-sport-meetup-sports` | `DiscoverEmptyState.tsx` | Open |
| B7 | P2 | Show active off-strip sport label when More used | `flow-play-screen` | `HomeScreen.tsx`, `DiscoverSportFilters.tsx` | Open |
| B8 | P2 | Free-agent row tap → profile/DM for non-host | `flow-play-screen` | `CompactFreeAgentRow.tsx` | Open |
| B9 | P2 | Next Up card → session detail not chat | `flow-rally-session` | `DynamicHomeScreen.tsx` | Open |
| B10 | P2 | Seed 1+ open badminton discover game | `flow-play-screen` | `seed_monrovia_*.sql` | Ops |

**Suggested Builder order:** Validate B3/B4 → B1 → B2 → B5 → B6–B9.
