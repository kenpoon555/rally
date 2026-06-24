# Flow — Post-game player review

**Contract id:** `flow-post-game-review`  
**Status:** Draft — product review tier 4 (2026-06-24)  
**Screens:** `ProfileScreen`, `ActivityDetailScreen`, Today (`DynamicHomeScreen`)  
**Related code:** `PlayerReviewForm.tsx`, `ProfileScreen.tsx`, `coachParentService` / review prompts RPC  
**Product review:** [2026-06-24-cross-surface-tier4-synthesis.md](../product-review/consolidated/2026-06-24-cross-surface-tier4-synthesis.md)

## Purpose

After a locked pickup session, participants rate co-players so trust signals stay current — without duplicate nagging.

North-star: **Game ends → prompt within ~2h → stars + submit → prompt removed from queue.**

**Human gate H2 (locked R2=A):** Primary entry = **Today card** after lock (not Profile-only bury).

## Demo setup

1. `@kunyu` with at least one **past locked** game and unrated co-players (demo seed).
2. Metro + iOS sim; flags off for pickup path.

## Required states

| State | Must show |
|-------|-----------|
| **Pending reviews** | User has ≥1 rateable player for a past session |
| **Today entry (H2)** | Card on Today when `rateablePromptCount > 0` — CTA opens next review |
| **Profile fallback** | **Rate Players (n)** section — expanded when `n > 0` |
| **Review form** | Friendly / Intensity / Overall + optional comment + Submit |
| **After submit** | Success confirmation; rated player **removed** from pending list immediately |
| **Already rated** | Same player+activity cannot re-prompt (upsert / idempotent) |
| **You tab badge** | Optional P2: dot when pending > 0 |

## Pass/fail checklist

### Discoverability (P1)
- [ ] **Today card** visible within ~2h of session lock when pending reviews exist (H2)
- [ ] Profile **Rate Players** auto-expanded when `count > 0` (not collapsed by default)
- [ ] Pending section visible without scrolling past display-name field (P2 placement)

### Submit path
- [ ] Player chips when multiple co-players on same activity
- [ ] Submit CTA reachable without excessive scroll (sticky footer or collapsed hero — P2)
- [ ] Submit writes review; success alert shown
- [ ] **Queue count decrements** and rated row disappears without manual refresh (P1)
- [ ] Default stars unset OR submit requires explicit change (P3 — avoid accidental 3/5)

### Accessibility
- [ ] Star rows have `accessibilityLabel` per star
- [ ] Submit button in accessibility tree (`accessibilityRole="button"`)

### Wrong role / edge
- [ ] Cannot rate self
- [ ] Non-participants do not see prompts for that activity

## Performance requirements

| ID | Metric | Budget |
|----|--------|--------|
| P1 | Profile queue refresh after submit | < 1s until row removed |

## Screenshots required

`docs/contracts/screenshots/flow-post-game-review/`

| File | State |
|------|-------|
| `01-today-review-card.png` | Today CTA when pending |
| `02-profile-rate-players-expanded.png` | Profile queue |
| `03-review-form.png` | Activity detail form |
| `04-post-submit-queue.png` | Count decremented |

## Related

- [flow-post-game-attendance.md](./flow-post-game-attendance.md) — host marks showed first
- [flow-profile.md](./flow-profile.md) — trust line / review count
- [flow-inbox.md](./flow-inbox.md) — separate from class announcements

## Open issues

| Date | Blocker | Owner |
|------|---------|-------|
| 2026-06-24 | Stale queue after submit (Profile still shows rated row) | Fixer |
| 2026-06-24 | No Today card — Profile-only path | Builder (H2) |

## Product review source

Persona: `post-game-reviewer` · `docs/product-review/post-game-reviewer/2026-06-24-review.md`
