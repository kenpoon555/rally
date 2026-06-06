# Tab navigation design — Rally · Play · Inbox · You

**Last updated:** 2026-06-03  
**Graphic:** [design/rally-tab-bar-mockup-play-active.png](./design/rally-tab-bar-mockup-play-active.png) (Play tab active)  
**UX depth:** [HOME_NAV_UX_REVIEW.md](./HOME_NAV_UX_REVIEW.md)

---

## Naming scorecard

| Tab | Label | Fit (1–5) | Notes |
|-----|-------|-----------|--------|
| Hub | **Rally** | 3.5 | Brand-strong, but clashes with **Rallys** (groups) and app name. Users may expect “my Rallys list.” |
| Hub | **Today** | 4.5 | Clearest for “what now” (Next Up, I’m in). Best if Home shows schedule-first. |
| Hub | **Home** | 4 | Safest; boring but zero ambiguity. |
| Discover | **Play** | 5 | Perfect for LA badminton/pickleball — find + host games. |
| Chats | **Inbox** | 5 | Universal; supports games + Rally + DMs. |
| Profile | **You** | 4.5 | Friendly; clearer than “Profile” for beta. |

**Recommendation:** **Today · Play · Inbox · You** (or **Home · Play · Inbox · You**). Use **Rally** only as **app name**, not tab label, until Rallys have a dedicated surface inside Play or Inbox.

---

## What each tab owns (v1.0)

```text
┌──────────┬──────────┬──────────┬──────────┐
│  Today   │   Play   │  Inbox   │   You    │
│  (hub)   │ (discover│ (all     │ (account │
│          │ + host)  │  chats)  │ + friends│
└──────────┴──────────┴──────────┴──────────┘
```

| Tab | Screen | Remove from elsewhere |
|-----|--------|------------------------|
| **Today** | Next Up hero, Needs I’m in (≤2), Your Rallys (≤3), one **Host** CTA, link “Browse games →” | Duplicate Host/Discover rows; Active Game Rooms list |
| **Play** | Discover feed, sport filter, **+ Host** FAB | “Games near you” on Today (or 1 card max) |
| **Inbox** | Threads, filters All/Games/Rallys/Friends, unread badges | Game rooms duplicated on Today |
| **You** | Profile, Friends, My games, feedback, legal | Third “Add friends” on Today |

---

## Icons (Ionicons — already in app)

| Tab | Icon (inactive / active) |
|-----|--------------------------|
| Today / Home | `home-outline` / `home` |
| Play | `search-outline` or `tennisball-outline` / `search` |
| Inbox | `chatbubbles-outline` / `chatbubbles` |
| You | `person-outline` / `person` |

---

## For your designer (handoff)

1. **Tab bar** — 4 items, badge on Inbox only for v1.  
2. **Play** — primary FAB “Host game” (green `#0B7A5E`).  
3. **Today** — single-column scroll; one primary button.  
4. **Empty Today** — illustration + “Host or browse Play →”.  
5. **Do not** use “Rally” tab if Rallys list stays on Today (naming collision).

---

## What engineering can do vs designer

| Asset | Agent | Designer |
|-------|-------|----------|
| Tab labels + IA doc | ✅ | Refine |
| ASCII / markdown wireframes | ✅ | Figma |
| Tab bar PNG mockup | ✅ (reference) | Final pixels |
| App Store screenshots | ❌ | ✅ |
| Illustration / empty states | ❌ | ✅ |
| Design system in Figma | ❌ | ✅ |

---

## Implementation status

- [x] `AppNavigator.tsx` — tab labels **Today · Play · Inbox · You** + Ionicons per table above; Inbox badge only (no count in label).  
- [x] `SportBadge` — hybrid icon + label on Play feed (`GameCard`), Play sport filters, Today “Games near you”.  
- [ ] `DynamicHomeScreen` — trim duplicate Host/Discover sections (follow-up PR).  
- DB / glossary unchanged (“Rallys” stays for groups).
