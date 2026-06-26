# Product review synthesis — 2026-06-26 · taste-tier6

**Queue:** `taste-tier6-join-loop` · Tier 6 · Join Loop authoring
**Reviews:** 8/8 taste personas · consolidator_tag `taste-tier6`

## Reviews included

| persona-id | date | file |
|------------|------|------|
| taste-want-it | 2026-06-26 | `taste-want-it/2026-06-26-review.md` |
| taste-one-job | 2026-06-26 | `taste-one-job/2026-06-26-review.md` |
| taste-first-3s | 2026-06-26 | `taste-first-3s/2026-06-26-review.md` |
| taste-best-in-class | 2026-06-26 | `taste-best-in-class/2026-06-26-review.md` |
| taste-one-joy | 2026-06-26 | `taste-one-joy/2026-06-26-review.md` |
| taste-scope-skeptic | 2026-06-26 | `taste-scope-skeptic/2026-06-26-review.md` |
| taste-authored | 2026-06-26 | `taste-authored/2026-06-26-review.md` |
| taste-momentum | 2026-06-26 | `taste-momentum/2026-06-26-review.md` |

## Top authoring themes (ranked)

| Rank | Theme | Personas (n) | Severity | Consensus verdict |
|------|-------|--------------|----------|-------------------|
| 1 | **Status-first + coaching vocabulary** (Confirm / Can't make it, grouped roster) | 8/8 | P0 authoring | CHANGE — port `ClassDetailScreen` patterns to pickup |
| 2 | **One job per screen** — demote host ops, reviews, tournaments from join path | 7/8 | P0 | CUT/DEMOTE — overflow sheets |
| 3 | **Post-join = same screen, new banner** — not a separate "commit" mode | 6/8 | P0 | CUT separate commit step |
| 4 | **Player game room** — message + roster only | 6/8 | P1 | CUT host bar from player viewport |
| 5 | **Post-game pull-through** — next game card for players | 7/8 | P1 | CHANGE — split host attendance vs player rejoin |
| 6 | **Discover personal state** — "You're in" chips on feed rows | 5/8 | P1 | CHANGE |
| 7 | **Delight micro-moments** (join checkmark, status banner motion) | 4/8 | P2 | CHANGE — v1 can be static |

## Per-screen consolidated verdict (Join Loop)

| # | Screen | Verdict | Single highest-leverage change |
|---|--------|---------|--------------------------------|
| 1 | Discover | **CHANGE** | Personal-state chip on cards + one-line urgency hook |
| 2 | Decide | **CHANGE** | Hero + single Join CTA; defer all else below fold |
| 3 | Commit | **CUT** (as separate step) | Post-join banner on same screen: Confirm / Can't make it |
| 4 | Coordinate | **CHANGE** | Player: status-grouped roster + sticky Message |
| 5 | Close → reopen | **CHANGE** | Player: next-game card; host: attendance in overflow |

## Recommended contract changes

| Priority | Contract file | Change type | Proposed diff summary |
|----------|---------------|-------------|----------------------|
| P0 | `core-loop-redesign-spec.md` | Activate backlog | §5 Tier 6 consolidated items — replace parked steal list |
| P0 | `flow-rally-session.md` | Checklist | RSVP banner, Confirm/Can't make copy, grouped roster |
| P0 | `flow-play-screen.md` | Checklist | Viewer enrollment chip on discover rows |
| P1 | `flow-game-room.md` | Checklist | `playerDayOfCard` vs `hostOpsSheet` split |
| P1 | `flow-post-game-attendance.md` | Checklist | Role-split: host form vs player rejoin path |
| P1 | `module-game-card.md` | Checklist | Detail hero = single-column decision layout |
| P2 | `module-visual-design-system.md` | Token | Join Loop status banner component spec |

## Human decisions needed (H gates)

| ID | Question | Options | Default |
|----|----------|---------|---------|
| H-J1 | Pickup RSVP copy | A) Port coaching: Confirm / Can't make it · B) Keep I'm in / ready | **A** (8/8 taste) |
| H-J2 | Game room scope for join loop v1 | A) Hide tournaments/need-players from player path · B) Keep all | **A** |
| H-J3 | Post-game player path | A) Lightweight rate + next game · B) Same attendance screen | **A** |

## Out of scope (this cycle)

- Theme exploration (`theme-explore-round1`) — separate loop
- Class session response (`flow-class-session-response`) — separate build
- Full Play segment removal — only join-loop entry defaults to Games
