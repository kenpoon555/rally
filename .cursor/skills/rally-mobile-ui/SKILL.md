---
name: rally-mobile-ui
description: >-
  Rally React Native / Expo mobile UI patterns — neon theme tokens, game cards,
  readable CTAs, avatar rows, sheets, and screen hierarchy. Use when building or
  polishing Rally screens, components, game cards, Today/Play/Inbox, or when the
  user asks for mobile UI, design polish, or neon theme rollout.
---

# Rally Mobile UI

Rally-specific mobile frontend guidance. Pair with `react-native-skills` (performance) and `building-native-ui` (Expo Router patterns). This skill covers **Rally's visual system and product UI conventions**.

## Stack

- React Native + Expo (not Expo Router file-based routes — Rally uses React Navigation)
- Tokens: `src/constants/theme.ts`
- Copy: `src/constants/productCopy.ts`
- Design refs: `docs/design-review/` (neon concepts, DESIGN_REVIEW_v2.md)

## Neon theme tokens

| Token | Hex | Use |
|-------|-----|-----|
| `primary` | `#B1E248` | Filled buttons, avatar rings, active chips |
| `accent` | `#FCFD59` | Urgency, pending join rings, badges |
| `primaryDark` | `#6B8F1E` | **Action text on cream** — links, secondary button labels |
| `background` | `#EEEDEB` | Screen canvas |
| `surface` | `#FFFFFF` | Cards, panels |
| `onPrimary` | `#141916` | Text **on** lime/yellow fills (never white on lime) |
| `textSecondary` | `#5A635E` | Body, hints |
| `text` | `#141916` | Headlines |

## Readability rules (non-negotiable)

1. **Lime/yellow is for fills and accents, not small body text on cream.**
   - ✅ Grey body + `primaryDark` bold action: *Same crew every week? **Save as a Rally →***
   - ❌ Lime `#B1E248` at 12–14px on `#EEEDEB` / white

2. **Primary CTA:** lime fill + `onPrimary` text.

3. **Secondary CTA:** white surface + `borderStrong` + `primaryDark` text.

4. **Selected chips/pills:** `primaryDark` fill or border — not lime text alone.

5. **Links:** `textSecondary` sentence + `primaryDark` action substring (weight 600–700).

## Game card architecture

Split every game surface into layers:

```
┌─ Hero card ─────────────────────────┐
│ Type pill (Pickup / Rally) + status  │
│ Sport icon + listing title            │
│ Time + venue                          │
│ RosterSeatBar (capacity dots)       │
│ Primary join / I'm in CTA             │
└─────────────────────────────────────┘
┌─ Who's going ───────────────────────┐
│ Label + count + avatar row          │
│ Lime ring = roster, yellow = pending│
│ Tap avatar → profile (when userId)  │
└─────────────────────────────────────┘
┌─ Manage game (host only) ───────────┐
│ GameCardIconActionBar: Time | Court │
│ Copy link | Friends                 │
└─────────────────────────────────────┘
```

**Shared components:** `GameCardWhoGoing`, `GameCardIconActionBar`, `GameCardTypePill`, `GameCardSection`, `RosterSeatBar`.

**List cards** (`GameListCard` on Play + Today): compact row with status signal + spots pill. **Detail** (`ActivityDetailScreen`): full `GameCardWhoGoing` inside hero card.

## Avatar row

- Default: **spread** (no overlap), horizontal scroll if needed
- Sizes: `sm` (28px) list cards, `md` (40px) detail
- Overlap only in tight spaces (e.g. Rally carousel)
- Always pass `rosterItems` with `userId` when profile tap is supported
- Pending join requests: yellow ring + `!` badge → `JoinRequestsSheet`

## Mobile UX checklist

Before shipping UI changes:

- [ ] **Touch targets** ≥ 44pt; use `hitSlop` on small icons
- [ ] **Safe area** — `KeyboardSafeView` + `keyboardAwareScrollProps` on forms
- [ ] **Hooks** — never place `useMemo`/`useEffect` after loading early returns
- [ ] **Pressable** over `TouchableOpacity` for new code
- [ ] **Haptics** — optional light impact on join/confirm (beta: skip sounds)
- [ ] **Loading / empty** — skeleton or spinner before content; don't flash layout
- [ ] **One primary action** per card/screen region
- [ ] **Section labels** — uppercase label + count (e.g. WHO'S GOING · 3)

## Screen hierarchy (4 tabs)

| Tab | Role |
|-----|------|
| **Today** | Calm home — next up, rallies strip; no filter pills |
| **Play** | Games \| Players toggle; compact cards; sport chips + See all |
| **Inbox** | Chats, join requests, invites |
| **You** | Profile, settings |

Play Games tab: OPEN GAMES + LOCKED · STILL WELCOMING sections. No duplicate free-agent block on Games view.

## Spacing & typography

- Use `spacing.*` and `radius.*` from theme — don't magic-number unless one-off
- Section labels: `typography.label`, 10–11px, uppercase, letter-spacing 0.5
- Card padding: `spacing.lg` (16) standard; `spacing.md` compact rows
- Prefer `gap` in flex rows over chained margins

## Sheets & modals

Prefer existing Rally sheets over inline expansion:

- `ChangeGameTimeSheet`, `ChangeGameCourtSheet`
- `JoinRequestsSheet`, `InviteFriendsToGameSheet`
- `KeyboardSafeBottomSheet` for composer-style inputs

Native-feel: grabber, detents, dismiss on drag where applicable.

## Anti-patterns (Rally-specific)

- ❌ Expandable player list at bottom of game card (replaced by Who's going row)
- ❌ Lime text links on cream backgrounds
- ❌ `useMemo` after `if (loading) return` in screens
- ❌ Duplicating manage actions as full-width button rows (use icon bar)
- ❌ Overlapping avatars on detail cards (spread + scroll)
- ❌ White text on lime/yellow buttons

## When polishing UI

1. Read the screen's concept PNG in `docs/design-review/neon-theme/` if it exists
2. Match tokens in `theme.ts` — don't hardcode hex
3. Reuse shared game components before one-off markup
4. Verify contrast at smallest font size (12px links → `primaryDark` only)
5. Test on iOS simulator + one Android device (keyboard, touch targets)

## Reference files

| Area | Path |
|------|------|
| Theme | `src/constants/theme.ts` |
| Game card detail | `src/pages/Activity/ActivityDetailScreen.tsx` |
| Who's going | `src/components/game/GameCardWhoGoing.tsx` |
| Avatars | `src/components/ui/MemberAvatarStack.tsx` |
| Design direction | `docs/design-review/DESIGN_REVIEW_v2.md` |
| Neon mocks | `docs/design-review/neon-theme/` |
