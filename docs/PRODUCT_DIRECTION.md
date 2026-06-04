# Rally — product direction (living doc)

**Last updated:** 2026-06-04  
**Status:** Brainstorm + alignment — not a build list today.

**Mission (one line):** Help people play sports **this week**, with people they trust, until it becomes a **habit**.

**North star metric:** % of **Rallies** that **replay** within 14 days (`analytics_crew_lifecycle.retained`).

**Read first:** [VISION.md](../VISION.md) · **This file** (why we exist + long-term shape) · [open_items.md](../../open_items.md) (business stages / monetization gates) · [ROADMAP.md](../ROADMAP.md) (engineering phases).

**Archived shipped work:** [archive/SHIPPED_AND_DEFERRED_2026-06.md](./archive/SHIPPED_AND_DEFERRED_2026-06.md) — do not duplicate checklists here.

---

## What “addiction” means for Rally (healthy, not doom-scroll)

We do **not** optimize for time-in-app or infinite scroll. We optimize for **more real-world sessions** and **repeat crews**.

| Healthy (yes) | Unhealthy (no) |
|---------------|----------------|
| User opens app → joins or hosts → **plays IRL** | User opens app → scrolls feed → never leaves couch |
| Push: “Spot opened on Tuesday badminton” | Push: “12 people liked your post” |
| Streak = **weeks you played**, not login days | Streak = daily app open |
| Trust + roster = **show up or lose reputation** | Vanity metrics without attendance |

**Design test:** *Does this feature increase **games played** or **Rally replay** in the next 14 days?* If not, defer.

---

## Face connection first (no public feed)

Rally is a **coordination layer for IRL sport**, not a social network.

| We will | We will not (v1–v2) |
|---------|---------------------|
| Real names in game rooms (trust) | Public algorithmic feed |
| Rally chat + game room chat | Open posting to strangers |
| Discover **browse** (timing, host, who's in) | Influencer / follower graph |
| Friends DM + friend list | Global explore of people |
| Reviews & attendance after **real games** | Likes on content without play |

**Optional long-term (friends-only, not feed):** ephemeral **“moment”** shared with **friends** after a game — photo + caption, 24–48h, sport-tagged. Purpose: *“we actually went”* — not daily story performance. No public discover tab for moments.

**Calls / heavy media:** Defer. WhatsApp/iMessage already win for voice; Rally wins on **roster, lock, next game**.

---

## Three big ideas (long-term pillars)

These align mission → vision → roadmap. Build order is **bottom-up** (prove replay before layers 2–3 depth).

### 1. More connected — *“my people, not the algorithm”*

**Goal:** Users feel they belong to **crews** (Rallies), not anonymous lobbies.

| Near-term (v1) | Long-term |
|----------------|-----------|
| Rallies + Rally chat as home for a crew | Guest invites (play with crew + bring a friend) |
| Friends list + DM | “Friend playing tonight” surfacing on Play |
| Inbox: Games · Rallies · Friends (active only) | Light friend-only moments (ephemeral, no feed) |
| Trust preview on join / Discover cards | Mutual-friends-on-game hints |

**Success signal:** Same 6–12 people play twice in 14 days; chat messages between games.

---

### 2. Enjoy activities together — *“play more, stress less”*

**Goal:** Lower friction from “I want to play” → **on court**.

| Near-term (v1) | Long-term |
|----------------|-----------|
| Play = browse games (timing, spots, host) | Smarter “fits my week” (calendar-aware nudges) |
| I'm in → lock → show up | Waitlist + spot-open push |
| Host: create, invite link, schedule next from Rally chat | Organizer Pro: blast, attendance dashboard |
| Post-game attendance + reliability | Positive reinforcement (host shout-outs, crew stats) |

**Success signal:** Time signup → first game ↓; % users with 2+ games/month ↑.

**Not the wedge:** Leagues, payments, multi-city — until LA replay proves the loop.

---

### 3. Give meaning to moments — *“this game counted”*

**Goal:** Games feel **worth showing up for** — competition and memory without becoming Instagram.

| Near-term (v1) | Long-term |
|----------------|-----------|
| Lock roster + I'm in = **commitment** | Mini tournament in a Rally (bracket, simple leaderboard) |
| Post-game attendance (host marks) | Season stats inside a Rally (W/L, partners) |
| Rate Players (after real sessions) | Crew “highlights” reel (private to Rally, optional) |
| My Games → Past + archived chat | League layer on top of retained Rallies (Stage 6+) |

**Why tournaments / leaderboards fit:** They add **meaning** to a session (score, rematch, pride) → more activity and healthier rivalry **inside a known group** — not global rank anxiety.

**Success signal:** `crew_replayed` events; tournament-created → second session scheduled.

---

## How the three pillars stack

```text
        ┌─────────────────────────────────────┐
        │  3. Meaning (tournaments, memory)   │  ← Stage 2.5–6, after replay
        └─────────────────┬───────────────────┘
                          │
        ┌─────────────────▼───────────────────┐
        │  2. Enjoy together (play more IRL)   │  ← v1 core loop
        └─────────────────┬───────────────────┘
                          │
        ┌─────────────────▼───────────────────┐
        │  1. Connected (Rallies, trust, friends)│  ← v1 foundation
        └───────────────────────────────────────┘
```

---

## Three stages of players (build order)

Rally grows **liquidity first**, then **habit**, then **culture**. Do not build Stage 3 features for Stage 1 users.

| Stage | Who | What they need | Rally job |
|-------|-----|---------------|-----------|
| **1 — Desperate to play** | No crew, high intent, “I just want a game / partner / court fill” | **Get on court this week** | Discover clarity, host tools, trust to join strangers |
| **2 — Motivation mix** | Some need a push; some want **serious** games | **Come back** + optional intensity | I'm in, reliability, tournaments, skill/vibe labels |
| **3 — Already active** | Plays often; less $ incentive | **Belonging + fun between games** | Rallies, friend moments, leaderboards (no public feed) |

**North star for beta:** win Stage 1 in LA (badminton · pickleball · basketball) before optimizing Stage 2–3.

---

## Stage 1 — what to do now (no scope creep)

### Yes — host-editable **listing headline** (not chat “room name”)

Hosts need strangers to **understand the deal in one line** on Play / Discover:

- *“Morning training partner — casual shots”*
- *“Indoor court last minute — $80/hr split ~15 — need 10 more”*
- *“Middle school gym — beginners welcome”*
- *“Pickup only — not league”*

**Today:** `session_note` + `cost_note` exist but are easy to miss on Discover cards (title = court name only).

**v1.1 product (recommended):**

| Field | Purpose |
|-------|---------|
| **Listing title** (host-edited, required) | Primary line on `GameCard` + game room header |
| **Play intent** (chip, optional) | `Pickup` · `Training partner` · `Split court cost` · `Last-minute fill` · `Casual only` |
| **Cost note** (already exists) | “$80/hr · ~$5/person if 15 join” |
| **Tonight** (already exists) | Last-minute signal |

Chat thread can stay `Court name · Sport`; **listing title** is the shopping label.

### Yes — training buddy & solo-adjacent play

| Need | Stage 1 approach |
|------|------------------|
| Training partner (AM, 1–2 people) | Intent = **Training partner**; `player_count` = 2–4; title says level + time |
| Pickup / casual | Intent = **Casual pickup**; no skill gate in v1 |
| Fill discounted indoor slot | Host puts **price + headcount** in title + cost note; Rally = **headcount + join**, not payments |

**Do not build yet:** court-discount marketplace, gym API, Stripe split for hourly rent — hosts describe economics in text; players settle IRL.

### Yes — make browse the product (Play)

Stage 1 users **shop**: time · spots · host trust · **what kind of game** · who's already in. Reinforce browse (no “join nearest”).

### Yes — reduce fear of joining strangers

- Trust line on card (reviews / reliability preview)
- Real usernames in room
- Clear “casual / training / competitive” in title
- Host lock + attendance later → reputation

### Yes — supply (hosts)

- Recruit 5–10 LA hosts who post **labeled** listings weekly
- Share invite link + “last minute fill” template in host onboarding copy

### Defer for Stage 1

| Idea | Why wait |
|------|----------|
| Court discount partnerships | Ops + payments + liability; manual text in listing is enough to test demand |
| Matching algorithm for training buddy | Filters + intent chips + browse first |
| Leagues / serious ladders | Stage 2–3 |
| Friend stories / feed | Stage 3 |
| Full Teams | After Rally replay |

---

## What we build next (product, not today)

**Gate everything on:** collective QA → `analytics_crew_lifecycle.retained` on real hosts.

| Priority | Slice | Pillar |
|----------|-------|--------|
| Now | QA + preview build + replay SQL | Foundation |
| P2 (one) | Guests **or** Discover polish | 1 + 2 |
| v1.1 | **Listing title + play intent** on Create + Discover cards | Stage 1 — **shipped** |
| v1.1b | Show `session_note` / `cost_note` on `GameCard` | Stage 1 — **shipped** |
| v1.1c | Rally chat photo (rate-limited) | 1 (light glue) |
| v1.2 | Mini tournament polish (TOUR-01) | 3 |
| After replay | Organizer Pro scaffold | 2 |
| After replay | Teams → Leagues | 3 (formal) |

**Explicitly defer:** public feed, stories for everyone, group calls, full leagues product, Stripe, multi-city floodgate.

---

## Copy principles (design + eng)

- **Outcomes, not features:** “Play this week” not “Open chat.”
- **Face-forward:** show **who** is in the game before join.
- **Honest beta:** LA · badminton · pickleball · basketball — [Profile banner].
- **No guilt hooks:** no “you’ll lose your streak if you don’t open the app” — only **game-time** accountability.

---

## One question for every new idea

> *If we ship this, will more users **leave the house** to play with the **same crew** again within two weeks?*

If yes → align with a pillar and schedule.  
If no → brainstorm doc only, or friends-only experiment later.

---

## Doc hygiene

| Doc | Role |
|-----|------|
| **PRODUCT_DIRECTION.md** (this file) | Mission alignment, 3 pillars, engagement philosophy |
| [VISION.md](../VISION.md) | Principles + version strategy (update sparingly) |
| [open_items.md](../../open_items.md) | Business stages, monetization |
| [ROADMAP.md](../ROADMAP.md) | Engineering shipped / gaps |
| [archive/SHIPPED_AND_DEFERRED_2026-06.md](./archive/SHIPPED_AND_DEFERRED_2026-06.md) | Completed + deferred checklist (frozen) |
| [FOUNDER_WEEK2_CHECKLIST.md](./FOUNDER_WEEK2_CHECKLIST.md) | Current week ops only |

Older advisor merges and WHAT_NEXT checklists → **archive only**; do not maintain in parallel.
