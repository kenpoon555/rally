# Module contract — Visual design system (tier 5)

**Contract id:** `module-visual-design-system`  
**Scope:** Cross-surface art direction — tokens, CTAs, empty states, chips, chat bubbles, screenshot bar  
**Status:** Draft — from `visual-tier5-round1` product review (8/8 personas, 2026-06-24)  
**Related:** [flow-play-screen.md](./flow-play-screen.md) · [flow-inbox.md](./flow-inbox.md) · [module-game-card.md](./module-game-card.md) · [flow-auth-onboarding.md](./flow-auth-onboarding.md) · [flow-profile.md](./flow-profile.md)

## Purpose

Ship-quality Rally surfaces share one visual language: readable hierarchy, consistent lime primary fills with **`onPrimary` text**, branded empty states (no emoji heroes), and App Store–ready screenshots at 393pt width.

## Demo setup

- Account: `marcus@rally-mvrhoops.demo` (session inject) or `@kunyu`
- Device: iPhone 16 sim · light mode · 393×852
- Screenshots: `docs/product-review/visual-*/2026-06-24/`

## Required tokens

| Token | Value / rule | Must not |
|-------|----------------|----------|
| **Primary fill** | `colors.primary` (lime) | Black text on lime without `onPrimary` |
| **On-primary text** | `colors.onPrimary` (#141916) | `textInverse` (white) on lime buttons |
| **Sport chip idle ring** | `borderSubtle` / neutral | `colors.accent` (yellow) on every idle chip |
| **Sport chip selected** | `primary` 3px ring + `primaryDark` label | Yellow ring when selected |
| **Empty state icon** | Sport SVG / branded glyph | Emoji (💬 etc.) in ship screens |
| **Unread badge** | `accent` yellow | — |

## Pass/fail checklist

### Primary CTAs (P0 visual — 6/8 tier-5 personas)

- [ ] Welcome **Get Started** uses `onPrimary` on lime fill
- [ ] Play **+ Host** / **Host a game** uses `onPrimary` on lime fill
- [ ] Auth signup/login primary submit uses `onPrimary` on lime fill
- [ ] Game room poll **Create game from winner** uses `onPrimary` on lime fill
- [ ] Hub **Create game** uses `onPrimary` on lime fill
- [ ] No lime-filled button uses white (`textInverse`) label in production screens

### Empty states (P1 — 3/8 personas)

- [ ] Play Games empty: sport icon + title + **single** primary CTA
- [ ] Inbox per-filter empty: branded icon (not emoji) + filter-specific title
- [ ] Players empty: text-only acceptable; document in empty matrix
- [ ] Empty title promotes filter/sport name (not generic “Nothing here yet” alone)

### Play sport strip (P1)

- [ ] Idle chips: neutral ring; selected: primary ring only
- [ ] Segment subtitle does not duplicate section header copy (Players segment)
- [ ] More sheet opens sport picker (not scroll-only)

### List / card truncation (P1)

- [ ] Today NEXT UP venue: no mid-word ellipsis at 393pt (2-line allowed)
- [ ] Spots badge: full label (“2 left” or “2 spots”) — no “2 spots l…”
- [ ] Inbox filter chips: 4-across not cramped; Classes badge readable

### Brand fidelity (P1)

- [ ] Roster meter / spot glyphs match activity sport (not wrong sport icon)
- [ ] Welcome: per-slide illustration OR documented single-hero policy

### Chat (P2)

- [ ] Outbound bubble: `primary` fill + `onPrimary` text
- [ ] Inbound bubble: `surface` + border — readable on chat background
- [ ] System messages: centered pill, `textSecondary`
- [ ] Dev-only banners (`Test dormancy nudge`) hidden in production builds

### Profile (P2)

- [ ] Display name field shows display name — not raw email for demo accounts
- [ ] Delete account row: destructive color; Sign out visually distinct below settings

## Screenshots required

| Frame | Path |
|-------|------|
| Welcome CTA | `visual-welcome-carousel/2026-06-24/03-slide-find-crew-cta.png` |
| Play strip + empty | `visual-play-strip/2026-06-24/01-play-strip-tennis-empty.png` |
| Today game card | `visual-game-card/2026-06-24/01-today-game-cards.png` |
| Inbox empty | `visual-inbox-rows/2026-06-24/01-inbox-friends-empty.png` |
| Chat bubbles | `visual-chat-bubbles/2026-06-24/01-rally-chat-bubbles.png` |
| Profile Me | `visual-profile-sections/2026-06-24/01-profile-top.png` |

## Human decision gates

| ID | Question | Options |
|----|----------|---------|
| H1 | Welcome carousel art | A) Three distinct illustrations B) Single hero, drop pager C) Keep one art + motion |
| H2 | Inbox filter layout at 393pt | A) Scrollable chips B) 3 + More C) Shorten “Classes” label |
| H3 | Map on list cards | A) Detail-only “Open in Maps” B) 48×48 thumbnail on list rows |

## Out of scope

- New features or navigation changes
- Dark mode (light mode bar only this cycle)
- iPad layouts

## Open issues

| ID | Priority | Issue |
|----|----------|-------|
| V1 | P1 | `onPrimary` audit across all lime buttons |
| V2 | P1 | Empty icon system — replace Inbox emoji |
| V3 | P1 | Sport strip idle yellow rings |
| V4 | P1 | Game card truncation + sport meter glyphs |

## Validator report

_TBD — validation queue `visual-tier5`_
