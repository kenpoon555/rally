# Builder backlog — play-discover-picky · 2026-06-22

**Source:** [2026-06-22-play-discover-picky-synthesis.md](./2026-06-22-play-discover-picky-synthesis.md)  
**Queue:** `play-discover-round2-picky` tier 2  
**Branch:** `fix/play-discover-picky-builder` · **No new src/ required for tier-2 close**

## Shipped (verify only)

| ID | Priority | Item | Contract | Status |
|----|----------|------|----------|--------|
| B7 | P1 | Off-strip sport visible in strip slot 3 | `flow-play-screen` | **Shipped** `fix/play-discover-tier2-ux` · matrix green |
| B11 | P1 | Discover empty-state hero icon aligned | `module-sport-icon` | **Shipped** `fix/play-discover-tier2-ux` · matrix green |

## Optional (P2/P3 — defer)

| ID | Priority | Item | Contract | Likely files | Notes |
|----|----------|------|----------|--------------|-------|
| B12 | P3 | Capitalize sport in Players empty title | `flow-play-screen` | `HomeScreen.tsx` / empty copy | *No Running players posting yet* |
| B13 | P2 | Promote invite hint on empty Discover | `flow-play-screen` | `DiscoverEmptyState.tsx` | Pickleball first-timer |
| B14 | P2 | Free-agent recency filter or subtitle | `flow-play-screen` | free-agent query | H1 from round 1 |
| B15 | P2 | Host card title sanity for basketball seed | `flow-play-screen` | seed or card title | *Morning pickup run* naming |

## Upstream (not play-discover builder)

| ID | Priority | Item | Contract |
|----|----------|------|----------|
| B1 | P0 | Invite deep-link handoff | `flow-invite-to-rally` |

**Validation:** `./.cursor/hooks/validation-loop-start.sh --queue play-discover-matrix --from flow-play-screen` — **already green** 2026-06-22.
