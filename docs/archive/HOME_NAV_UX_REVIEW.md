# Home & tab navigation — UX review (2026-06-03)

**Audience:** Founder + designer before v1.0. **Not implemented** — ideas only.

---

## Current map (why it feels redundant)

| Tab | What it does today | Overlaps with |
|-----|-------------------|---------------|
| **Home** | Next Up, Active Game Rooms, Host + Discover buttons, Add friends, Your Rallys, glossary | Discover, Chats, Profile |
| **Discover** | Public games list/map, sport filter, join | Home “Games near you”, Create |
| **Chats** | Inbox (games + Rally + DMs), filters | Home “Active rooms”, Profile My games |
| **Profile** | Friends, My games, Rallys, settings, feedback | Home quick actions, Chats |

Users see **Host / Discover** twice, **games** in three places, **friends** on Home + Profile.

---

## Principle for v1.0

**One primary job per tab:**

| Tab | Job |
|-----|-----|
| **Home** | “What should I do *right now*?” |
| **Play** (rename Discover) | “Find or create a game.” |
| **Inbox** (rename Chats) | “All conversations.” |
| **You** (rename Profile) | “Account, friends list, history.” |

---

## Recommended Home (single scroll)

```text
┌─────────────────────────────┐
│ Next Up (one hero card)      │  ← only if user has upcoming game/Rally
├─────────────────────────────┤
│ Needs I'm in (if any)        │  ← max 1–2 rows
├─────────────────────────────┤
│ Your Rallys (max 3)          │  ← tap → Rally chat
├─────────────────────────────┤
│ [ Host a game ]  (primary)   │  ← ONE create CTA
│ Discover games →             │  ← text link, not second big button row
└─────────────────────────────┘
```

**Remove from Home:** duplicate “Quick actions” Host/Discover row, second “Get started” block, “Active Game Rooms” (move to Inbox → Games filter only).

---

## Recommended Inbox (Chats)

- Default sort: unread + next game time.
- Filters: **All | Games | Rallys | Friends** (keep).
- **Active Game Rooms** = filtered view of same list, not a separate Home section.

---

## Create game pattern

- **Floating +** on Play tab (Discover), not repeated on Home.
- Home link: “Host a game” only.

---

## Friends discovery

- **One entry:** Profile → Friends (list + Add search).
- Optional Home shortcut: single “Add friends” ghost link (keep one, not three).

---

## Beta vs v1.0

| Change | Beta (now) | v1.0 |
|--------|------------|------|
| Tab labels | Keep Home/Discover/Chats/Profile | Rename optional |
| Remove duplicate CTAs | Can trim Home copy-only | Designer polish |
| FAB create | Skip if risky | Add on Discover |

---

## Metrics to validate redesign

- Time to open **next game chat** from cold start
- % users who tap Discover from Home vs tab bar
- Friend request completion (search → add)
