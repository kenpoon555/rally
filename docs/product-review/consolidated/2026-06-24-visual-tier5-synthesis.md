# Product review synthesis — 2026-06-24 · visual-tier5

## Reviews included

| persona-id | date | file |
|------------|------|------|
| visual-welcome-carousel | 2026-06-24 | `visual-welcome-carousel/2026-06-24-review.md` |
| visual-auth-forms | 2026-06-24 | `visual-auth-forms/2026-06-24-review.md` |
| visual-inbox-rows | 2026-06-24 | `visual-inbox-rows/2026-06-24-review.md` |
| visual-play-strip | 2026-06-24 | `visual-play-strip/2026-06-24-review.md` |
| visual-game-card | 2026-06-24 | `visual-game-card/2026-06-24-review.md` |
| visual-chat-bubbles | 2026-06-24 | `visual-chat-bubbles/2026-06-24-review.md` |
| visual-profile-sections | 2026-06-24 | `visual-profile-sections/2026-06-24-review.md` |
| visual-empty-states | 2026-06-24 | `visual-empty-states/2026-06-24-review.md` |

**Queue:** `visual-tier5-round1` · tier 5 · **8/8 FAIL** (polish backlog — no functional P0 blockers)

## Top pain themes (ranked)

| Rank | Theme | Personas (n) | Severity | Example |
|------|-------|--------------|----------|---------|
| 1 | **Lime CTA uses wrong text color** (`textInverse` / black inconsistent vs `onPrimary`) | 6 | P1 | Welcome Get Started, + Host, poll CTAs |
| 2 | **Empty state icon inconsistency** (emoji Inbox vs sport icons Play) | 3 | P1 | Inbox 💬 vs Play tennis icon |
| 3 | **Text truncation at 393pt** | 2 | P1 | “Basketba…”, “2 spots l…”, filter chips |
| 4 | **Play sport strip idle yellow rings** | 1 | P1 | Every chip has accent border when idle |
| 5 | **Wrong sport glyphs in roster meter** | 1 | P1 | Tennis balls on basketball detail |
| 6 | **Inbox filter chip density** (4 equal chips) | 1 | P1 | Classes + badge cramped |
| 7 | **Auth signup visual stack** (legal + brand block) | 1 | P1 | Triple legal on signup |
| 8 | **Profile rate queue density** | 1 | P1 | 39 duplicate-looking rows |
| 9 | **Welcome same illustration all slides** | 1 | P2 | Carousel feels static |
| 10 | **Chat game room poll-heavy** | 1 | P2 | Poll cards dominate scroll |

## Recommended contract changes

| Priority | Contract file | Change type | Summary |
|----------|---------------|-------------|---------|
| P1 | `module-visual-design-system.md` | **New** | CTA tokens, empty icons, strip chips, screenshot bar |
| P1 | `flow-auth-onboarding.md` | Checklist | Signup card rhythm, `onPrimary` on submit |
| P1 | `flow-inbox.md` | Checklist | Filter chip layout, row truncation, empty icon |
| P1 | `flow-play-screen.md` | Checklist | Strip states, segment copy, empty height |
| P1 | `module-game-card.md` | Checklist | List truncation, sport meter binding |
| P2 | `flow-profile.md` | Checklist | Identity fields, rate queue grouping |
| P2 | `flow-game-room.md` | Checklist | Poll collapse, CTA color |

## Human decisions needed (H gates)

| ID | Question | Options |
|----|----------|---------|
| H1 | Welcome illustration | 3 arts / 1 hero / motion on single |
| H2 | Inbox filters at 393pt | Scroll / 3+More / shorten Classes |
| H3 | Map on list cards | Detail-only vs thumbnail |

## Out of scope (this cycle)

- Dark mode polish
- New Play discover features
- iOS Build 13 resubmit during App Review

## Next layer

- **Contract PR:** `docs/visual-tier5-contracts-product-review`
- **Builder:** `fix/visual-tier5-builder` (after contract merge + human approve)
- **Validation queue:** `visual-tier5` · first contract `module-visual-design-system`
