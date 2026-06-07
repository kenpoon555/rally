# Design Review v2 — Logo, Today, Play

**Date:** 2026-06-06  
**Mocks:** `09_concept_today_v2.png`, `14_concept_today_alt_schedule.png`, `11_logo_comparison.png`, **`14_concept_play_v4_games.png`** + **`15_concept_play_v4_players.png`** (current Play direction)

---

## 1. Logo comparison

See `11_logo_comparison.png`

| | Designer (`01_designer_logo.jpg`) | Current app (`RallyMark` + `icon-1024.png`) | Concept (`08` / v2) |
|--|-----------------------------------|---------------------------------------------|---------------------|
| **Mark** | Lime circle + yellow orbital arcs + satellite dots | Photo/gradient app icon in green-tinted rounded square | Green concentric court arcs — sun-over-court |
| **Background** | Cool gray splash | Cream in-app (`primaryLight` wrap) | Warm cream `#F5F4F0` |
| **Energy** | Neon, playful, high-contrast | Generic mobile app icon | Premium, LA courtside, mature |
| **Scalability** | Strong at large sizes; busy at 24px | Works as OS icon; weak as brand story | Strong mark + wordmark system |
| **Product fit** | “Sports startup” | “Another app” | “Coordination for your court” |

### Recommendation

- **Keep designer’s orbital idea** (connection, rallying around a point) but **not the neon palette**.
- **Evolve `icon-1024.png`** toward the court-arc mark OR adopt designer arcs recolored to `#0B7A5E` / `#065F49`.
- **Tagline:** Current `APP_TAGLINE` = *"Find your crew. Fill the court. Show up."* — stronger for beta than concept’s *"PLAY MORE. TOGETHER."* Use tagline on splash only; mark stays icon-only in tab headers.

### Hybrid logo direction

```
Designer geometry (orbital arcs) + Court Fresh greens + cream splash + current tagline
```

---

## 2. Today tab v2 (`09_concept_today_v2.png`)

### Header — simplified

**Decision:** Drop contextual subtitle and filter pills. Title only: **"Today"** + optional **notification bell** (join requests, invites live in Inbox badge instead).

Rationale: Play tab already handles discovery/filtering. Today is a calm home — show what's next, not action prompts or Joined/Hosting toggles.

### Sections

1. **NEXT UP** — map hero card (unchanged from v1)
2. **RALLIES** — horizontal scroll + **See all** (not "Your Crews"; matches `PRODUCT_COPY.rallies`)
3. *(Future)* Active game room rows, rally invites — not in mock but keep in implementation

### Alternative: schedule-first (`14_concept_today_alt_schedule.png`)

Different information hierarchy — same content, different layout:

| v2 (map hero) | Alt (schedule-first) |
|---------------|----------------------|
| One map hero for next game | Week strip + vertical game cards |
| Rallies as horizontal carousel | Rallies as full-width list rows |
| Passive — tap card to enter room | Inline **I'm in** / **Join** on game cards |
| Best when user has 1 clear "next up" | Best when user has 2–3 games today |

Alt adds: day-of-week picker, **TODAY'S GAMES** stack (compact cards like Play v2), empty-state nudge to Play tab.

### Maps to current code

- `DynamicHomeScreen` + `ScreenHeader` → title + dynamic subtitle
- `NextUpCard` → map hero
- `RallyRowCard` → Rallies strip
- `PRODUCT_COPY.yourRallies` already exists

---

## 3. Play tab — v4 locked (`14` + `15`)

**Founder decision (2026-06-06):** Keep **Games | Players** toggle. Remove only the duplicate **"Looking for Players"** block from the Games view (that conflicted with the Players tab). Free agent data lives under **Players** tab only.

### Games tab (`14_concept_play_v4_games.png`)

1. Sport chips + **See all**
2. **OPEN GAMES NEAR YOU** — compact cards
3. **LOCKED · STILL WELCOMING** — `finalized` + `missing_players > 0`
4. No inline player list on this tab

### Players tab (`15_concept_play_v4_players.png`)

1. Same sport filter + See all
2. **PLAYERS NEARBY** — compact free-agent rows, Invite CTA
3. Maps to `free_agent_posts` / current Free Agent board (UI moves here, not a separate Discover mode)

### Retire (UI only)

| Remove | Keep |
|--------|------|
| "Looking for Players" section on Games view | Players tab |
| Separate Discover `free_agents` mode toggle | `listFreeAgentPosts` behind Players tab |
| Need Players as top-level Play tab (optional) | Game room deep link to need players if needed |

### Bottom bar (all screens)

Exactly **4 tabs**, labels:

| Tab | Route |
|-----|-------|
| **Today** | `DynamicHome` |
| **Play** | `Home` (Discover) |
| **Inbox** | `Chats` |
| **You** | `Profile` |

No Home / Discover / Chat / Profile / Activity / Explore naming in mocks.

---

## 3b. Play tab v2 (superseded — `10_concept_play_v2.png`)

### Current `GameCard` vs compact card

**Current card is ~350–400px tall** — includes:
- Sport badge + many status badges
- Listing headline + intent
- Time row + intensity dot
- Location row + distance
- Full progress bar + "X of Y spots filled"
- WHO'S GOING: avatars, host, trust line, session note, cost
- Join button row

**Compact card (~72px) — keep on list, move to detail:**

| Keep on card | Move to Game card / room |
|--------------|-------------------------|
| Sport icon | Full SportBadge |
| Title (listing headline) | Intent badge |
| Venue name | Intensity, session note, cost |
| Time + distance (right column) | WHO'S GOING avatars |
| Dot spots (●●●●○○) | Host + trust line |
| Tonight / Intro / Partner badge (max 1) | Full progress bar |
| Orange stripe if urgent | Join button (or swipe) |
| Chevron | Friend line (compact: "2 friends in") |

### Modes — only 2

| Tab | Maps to |
|-----|---------|
| **Games** | Open + finalized-welcoming public games |
| **Players** | Free agent posts (`free_agent_posts`) |

**Remove from top toggle:** Need Players board (stays reachable from game room "Find players" deep link).

### Sport row + See all

`Badminton · Pickleball · Basketball · See all`

"See all" opens sport picker sheet (full catalog — volleyball, tennis, etc.).

### Sections on Games mode

1. **OPEN GAMES NEAR YOU** — compact cards
2. **LOCKED · STILL WELCOMING** — `match_status = finalized` but `missing_players > 0`; badge `Finalized · N spots`
3. *(Optional)* Intro nights carousel — below fold

### Looking for Players (always visible below games)

Shows **free agents** sorted by recency + "free tonight/this afternoon":
- `@maya · Badminton · Free tonight · Culver City`
- Tap → profile or invite from game room

This is the **ASAP play** surface — players free in the next few hours.

### Finalized but welcoming?

**Yes — show them.** Roster locked ≠ court full. Host may still want fill-ins.

- Filter: `finalized && missing_players > 0`
- Badge: `Locked · 2 spots` (green soft, not alarm)
- Copy: "Roster locked — still welcoming players"

---

## Files

| File | Description |
|------|-------------|
| `09_concept_today_v2.png` | Today — clean header, RALLIES, map hero |
| `14_concept_today_alt_schedule.png` | Today alt — week strip, game cards, list rallies |
| `10_concept_play_v2.png` | Play — compact cards, Games/Players, See all, Looking for Players |
| `11_logo_comparison.png` | Logo three-way comparison |

---

## Decisions needed

1. Logo: recolor designer arcs vs new court-arc mark?
2. Today layout: map hero (`09`) vs schedule-first (`14`)?
3. Play: Join on compact card or tap-through only?
4. Finalized-welcoming section: separate or mixed in open games with badge?
