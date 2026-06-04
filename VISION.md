# RallyApp Vision

Last updated: 2026-06-01

## North star

> I want to play this week, and Rally is the easiest way to make that happen with reliable people.

Everything else supports that sentence. Build the **weekly sports habit** first.

## Mission

Help people find sports partners faster, reduce friction to start playing, and grow into **repeat crews** through chat-first coordination.

## Core problem

People want to play sports but often stop because:

- They cannot quickly find a partner or fill a roster.
- Coordination is slow (time, location, skill level mismatch).
- One-off games don't turn into weekly habits.
- Large group chats (e.g. 50-person badminton crews) cannot handle **limited court spots**, attendance, or recurring schedules.

## Product bet (near-term wedge)

Existing 50-person badminton/pickleball group chats already work for **communication**. Rally must give those groups what chat cannot do well:

- RSVP into **limited court spots** (Regulars crew games only).
- Schedule **recurring games** with host-picked date/time.
- Track **attendance and reliability** (flakes, reviews, trust preview).
- Run **mini tournaments** inside a crew (Phase 2.5 — not built yet).
- Rotate partners fairly and keep score history (later).
- Make the group more fun and competitive without replacing WhatsApp.

**Do not** jump to full Teams, Leagues, payments, or multi-city expansion until the weekly play loop is proven in one market.

## Product principles

1. **Chat-first coordination** — game lobbies are the hub; Discover fills empty slots.
2. **Hosts create supply** — prioritize invite links, fill spots, schedule next game, attendance, reliability insight.
3. **Regulars are the retention product** — success = *did a game produce another game with the same crew?*
4. **Action first:** join → Game Room → play → replay with crew.
5. **Local and relevant:** one city/region at a time; LA badminton + pickleball for closed beta.
6. **Community and trust drive retention:** reviews, flakes, safety — reliability shown carefully (positive public signals; harsh penalties private first).
7. **Connection stays free; coordination monetizes later** — no payments, fee-split, or expensive chat/media until revenue justifies it.

## What we are NOT building yet

| Deferred | Why |
|----------|-----|
| Full **Teams** | Regulars crews cover scheduling + chat; formal teams come with **Leagues** (Stage 6). |
| Full **Leagues** | Need repeating crews and local demand first. |
| **Payments / fee split** | Stripe, disputes, App Store rules — use **cost note** + settle in person for now. |
| **Multi-city expansion** | Prove LA loop first; add "Bring Rally to your city" interest CTA only. |
| **Anonymous identity in lobby** | Deferred (2026-05-31) — show real usernames in game threads like Instagram/LinkedIn DMs. |
| Audio/video chat, unlimited media | Text-only free tier; compressed photos; rate limits. |

## Beta positioning (LA closed beta)

Use clear expectation-setting in app and welcome copy:

```text
Rally Beta is currently focused on LA badminton and pickleball.

Want to host games, test Rally with your group, or bring Rally to your city?
Contact us.
```

Launch constraint: **1 region · 2 primary sports · 5–10 organizers · 50–200 early players · weekly repeat games.** Expand only after the loop works.

## Founder benefits (careful language)

Do **not** promise "Plus for life" broadly. Use:

```text
Active beta testers, hosts, and city partners may receive Founding Member benefits after launch.
Benefits may include extended Plus access, founder badges, host perks, or discounted organizer tools.
```

Reserve stronger lifetime benefits for verified hosts or city partners who materially help growth.

## North star experience

In under 3 minutes, a user can:

1. Open app and see **what matters now** (Dynamic Home — *planned*: Next Up, active Game Rooms, host CTAs).
2. Join or host via Discover / invite link / Regulars crew.
3. Coordinate in **Game Room** (chat + roster + Ready/Finalize + cost note + pinned announcement).
4. Host schedules the **next game** or grows a **Regulars group** (multi-sport crews supported).

## Tab structure

**Current (5 tabs):** Chats → My Games → Discover → Friends → Profile.

**Target simplification (future UX):** `Home | Discover | Host | Chats | Profile` — **Dynamic Home** replaces scattered empty states with Next Up, RSVP, active rooms, and host CTAs. Do not rush a tab rename until Home screen ships.

## Version strategy

### V1 — Partner finding + coordination (now)

- Game Room as primary surface; Activity Details = settings/history modal.
- Recurring games, invite links, Regulars groups, unified crew invite.
- **Group RSVP** for Regulars/recurring games only (not one-off Discover games).
- Cost note + pinned Game Room announcements.
- LA court seeds; 10 launch sports in catalog; beta copy focuses badminton + pickleball.

### V2 — Match optimization + trust

- Flexible scheduling (advanced Create Game path).
- Rate Players reviews, flake scores, trust preview on join requests.
- Player Plus filters when liquidity supports monetization.

### V2.5 — Regulars mini tournaments (before full Teams)

- Private round-robin / doubles mini-bracket **inside a Regulars group**.
- Manual score entry, simple leaderboard — badminton/pickleball doubles first.

### V3 — Community + organizer power

- Organizer Pro tools (waitlist, blast, attendance dashboard).
- Promote strong Regulars into registered teams when **Leagues** launch.

### V4 — Leagues + competitive ecosystem

- Hosted leagues, standings, playoffs, public pages, optional Stripe Connect.

## Success metrics

### Activation

- Time from signup to first joined or hosted game.
- First Game Room message sent.

### Retention (primary beta gate)

- **`analytics_crew_lifecycle.retained`** — % of Regulars groups with ≥1 replay within 14 days.
- Same crew plays twice; weekly active hosts with recurring series.
- 20%+ of completed games lead to another scheduled game (Phase 2 exit target).

### Trust

- Review completion after games; flake rate trending down for repeat players.

### Liquidity (Phase 1 beta)

- 20–50 active users; 5+ hosted games; 3+ games filled through Rally; 3+ host/partner interest submissions.

## Related docs

| Doc | Role |
|-----|------|
| [docs/PRODUCT_DIRECTION.md](./docs/PRODUCT_DIRECTION.md) | **Living product direction** — 3 pillars, engagement philosophy, long-term bets |
| [ROADMAP.md](./ROADMAP.md) | Engineering phases, shipped status, build backlog |
| [../open_items.md](../open_items.md) | Business model, Stages 0–7, monetization gates |
| [docs/archive/SHIPPED_AND_DEFERRED_2026-06.md](./docs/archive/SHIPPED_AND_DEFERRED_2026-06.md) | Frozen shipped/deferred checklist |
| [docs/FOUNDER_WEEK2_CHECKLIST.md](./docs/FOUNDER_WEEK2_CHECKLIST.md) | Current week ops |
