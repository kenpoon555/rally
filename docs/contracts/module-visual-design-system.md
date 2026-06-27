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

- [x] Welcome **Get Started** uses `onPrimary` on lime fill
- [x] Play **+ Host** / **Host a game** uses `onPrimary` on lime fill
- [x] Auth signup/login primary submit uses `onPrimary` on lime fill
- [x] Game room poll **Create game from winner** uses `onPrimary` on lime fill
- [x] Hub **Create game** uses `onPrimary` on lime fill
- [x] No lime-filled button uses white (`textInverse`) label in production screens

### Empty states (P1 — 3/8 personas)

- [x] Play Games empty: sport icon + title + **single** primary CTA
- [x] Inbox per-filter empty: branded icon (not emoji) + filter-specific title
- [ ] Players empty: text-only acceptable; document in empty matrix
- [x] Empty title promotes filter/sport name (not generic “Nothing here yet” alone)

### Play sport strip (P1)

- [x] Idle chips: neutral ring; selected: primary ring only
- [ ] Segment subtitle does not duplicate section header copy (Players segment)
- [ ] More sheet opens sport picker (not scroll-only)

### List / card truncation (P1)

- [x] Today NEXT UP venue: no mid-word ellipsis at 393pt (2-line allowed)
- [x] Spots badge: full label (“2 left” or “2 spots”) — no “2 spots l…”
- [ ] Inbox filter chips: 4-across not cramped; Classes badge readable (H2 pending)

### Brand fidelity (P1)

- [x] Roster meter / spot glyphs match activity sport (not wrong sport icon)
- [ ] Welcome: per-slide illustration OR documented single-hero policy (H1 pending)

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

## Theming (exploration gate)

The app ships one palette (`constants/theme.ts` "Neon"). Theme exploration is run by the `theme-reviewer` persona per [theme-exploration-plan.md](../redesign/theme-exploration-plan.md). **This contract is the accessibility gate:** before any proposed palette is implemented as a real theme variant, the validator must confirm it against the **Required tokens** above —

- [ ] Body/secondary text passes WCAG AA contrast on `background` and `surface`.
- [ ] Every fill uses the palette's `onPrimary` / `onAccent` (no white label on light lime/yellow).
- [ ] Status colors (`success`/`warning`/`error`/`info`) stay legible on the theme's surfaces.
- [ ] Theme rounds change **palette only** — no spacing/type/structure changes.

## Out of scope

- New features or navigation changes
- Dark mode shipping (Theme C "Night Court" is an *exploration* render, not a shipped dark mode this cycle)
- iPad layouts

## Open issues

| ID | Priority | Issue |
|----|----------|-------|
| V1 | P1 | `onPrimary` audit across all lime buttons |
| V2 | P1 | Empty icon system — replace Inbox emoji |
| V3 | P1 | Sport strip idle yellow rings |
| V4 | P1 | Game card truncation + sport meter glyphs |

## Validator report

**Run:** 2026-06-24 · builder branch `fix/visual-tier5-builder` · iPhone 16 sim (393×852, light) · account `marcus@rally-mvrhoops.demo`
**Scope:** Builder minimum B1–B7. P2 items (B8–B12) and H-gates deferred — not in this branch.

| # | Checklist row | Result | Notes |
|---|---------------|--------|-------|
| 1 | Welcome Get Started `onPrimary` | Pass (code) | `WelcomeScreen` cta now `colors.primary` fill + `onPrimary` text; sim logged-in, verified in source |
| 2 | Play +Host / Host a game `onPrimary` | Pass | `+ Host` and empty-state `Host a game` render dark label on lime (screenshot 02) |
| 3 | Auth submit `onPrimary` | Pass (code) | `Button` primary variant + signup checkmark now `onPrimary` |
| 4 | Poll Create-from-winner `onPrimary` | Pass (code) | Uses shared `Button` primary — already `onPrimary` |
| 5 | Hub Create game `onPrimary` | Pass (code) | Uses shared `Button` primary — already `onPrimary` |
| 6 | No lime button uses white label | Pass | Audited all `textInverse` usages; lime/accent fills migrated to `onPrimary`/`onAccent` |
| 7 | Inbox per-filter empty: branded icon + filter title | Pass | Friends→people glyph "No friend messages yet"; Games→calendar glyph "No game chats yet" (screenshots 04/05) |
| 8 | Empty title promotes filter (not generic) | Pass | Per-filter titles replace "Nothing here yet" |
| 9 | Play Games empty: sport icon + title + single CTA | Pass | Branded basketball ring, single Host CTA (screenshot 02) |
| 10 | Sport strip: idle neutral, selected primary only | Pass | Strip icons plain/neutral; no yellow idle rings; More chip ring neutralized (screenshot 02) |
| 11 | List venue no mid-word ellipsis (2-line allowed) | Pass (code) | `GameListCard` court line `numberOfLines={2}`; no seeded games for marcus to capture live |
| 12 | Spots badge full label (no "2 spots l…") | Pass (code) | Label shortened to "N left" + trailing column 84pt |
| 13 | Roster meter glyph matches sport | Pass (code) | `RosterSeatBar` binds `getSportIconName(activity.sport_type)`; all call sites pass correct sport |
| 14 | Inbox filter chips 4-across readable | Deferred (H2) | Chips render 4-across (screenshot 04); full layout pending H2 human pick |
| 15 | Chat outbound primary + onPrimary | Not run | No seeded threads for marcus this cycle; bubble tokens unchanged from prior pass |
| 16 | Profile display name not raw email | Deferred (P2) | Demo account `display_name` == email (seed data); header shows `@marcus` correctly |
| 17 | Dev banner hidden in production | Deferred (P2 · B11) | Not in builder B1–B7 scope |

**Failed rows:** none (P0/P1 builder scope all pass).
**Deferred (not failures):** filter-chip layout (H2), profile display-name seed data (P2), chat bubble live check (no seed), dev banner (B11 P2).
**Screenshots:** `docs/contracts/screenshots/module-visual-design-system/` (02 play strip+empty, 04 inbox friends empty, 05 inbox games empty, 06 profile top).
**Verdict:** PASS for builder minimum B1–B7.

### Validator report — taste-tier6 · 2026-06-26

> Run: 2026-06-26 · branch `fix/taste-tier6-builder` @ `048f2ef` · code audit

| # | Item | Result | Notes |
|---|------|--------|-------|
| T1 | Join Loop status banner tokens | **Pass** | `JoinStatusBanner` uses `colors.primary`/`onPrimary`, `successSoft`, `onPrimary` on CTA |
| T2 | Banner motion (J9) | **Deferred** | P2 delight — static banner only |

**Verdict:** PASS (J9 motion deferred per backlog).
