# Stage 3.5 — Beta Polish + Regulars Foundation

Last updated: 2026-06-01

Bridges **Stage 3 (partial)** and **Stage 4 (Team Plan)**. Three product bets from the June 2026 review, ordered by ship date.

## Overview

| Track | Idea | Roadmap slot | Status |
|-------|------|--------------|--------|
| **A** | Hide Map tab; courts from Discover | Stage 3.5a | **Shipped** |
| **B** | Badminton host invite loop (beta wedge) | Stage 3.5b | **Seeded** — device QA |
| **C** | Regulars / Groups identity | Stage 3.5c → Stage 4 | **Shipped** (schema + host CTA) |

```mermaid
flowchart TB
  subgraph shipped [Shipped]
    S3[Stage 3: recurring RSVP invites My Games]
    S35a[3.5a: Map off tab bar]
  end
  subgraph beta [Beta wedge]
    S35b[3.5b: Badminton courts + invite loop QA]
  end
  subgraph next [Next build]
    S35c[3.5c: groups schema]
    S4[Stage 4: Team Plan monetization]
  end
  S3 --> S35a --> S35b --> S35c --> S4
```

---

## 3.5a — Map hidden for beta (shipped)

**Problem:** Map duplicated Discover, fuzzed pins, and added little value for beta users.

**Solution:**
- Remove Map from bottom tabs and stack navigation.
- Court selection stays on **Create Game** (inline map + list).
- Re-enable dedicated map when it adds unique value (V2 presence, court-first browse).

---

## 3.5b — Badminton host invite loop (beta wedge)

**Problem:** Badminton is launch-enabled but LA has no seeded courts; sister’s friend group needs a **repeat play** path, not Discover strangers.

**Solution (ops + QA, minimal code):**

1. Run `node scripts/seed-la-badminton-courts.mjs` (service role).
2. Host flow (one account):
   - Profile → default sport **Badminton**
   - Create Game → pick seeded court → **Need players tonight** optional
   - After game day → **Make weekly recurring** → **Schedule next game**
   - **Share invite link** in iMessage/WhatsApp
3. Guest flow (second device): open `rallyapp://invite/{token}` → auto-join → Game Room → RSVP **Going**

**Success metric:** Same 4+ players play twice within 14 days without using Discover.

**Doc:** [smoke-test-badminton-invite-loop.md](./smoke-test-badminton-invite-loop.md)

**Later (Stage 3 remainder):** In-app “Host your first weekly game” coach marks on Create + share sheet.

---

## 3.5c — Regulars / Groups (shipped foundation)

**Problem:** Recurring series is **per-game UUID**; users think in **“our Tuesday crew”**, not activity rows.

**Shipped (migration `021`):**

| Entity | Purpose |
|--------|---------|
| `regular_groups` | Name, sport, default court, host, series link, invite token |
| `regular_group_members` | Roster (`host`, `member`, `captain`) |
| `activities.regular_group_id` | Links games to a crew |
| RPC `create_regular_group_from_activity` | Host saves roster from a game |
| RPC `join_regular_group_via_invite` | `rallyapp://group-invite/{token}` |

**Client:** Activity detail → **Save as Regulars group** → **Share group invite link**.

**Still to build (Stage 4 prep):**
1. Chats tab: group row above game threads
2. Invite link joins **group + next occurrence** in one tap
3. Stage 4: paid organizer dashboard on group (`teams` extends this)

---

## Where this sits in ROADMAP phases

| Phase | Includes |
|-------|----------|
| Stage 3 (partial) | Recurring, RSVP, invites, My Games, tonight, badminton sport flag |
| **Stage 3.5** | Map deferral, badminton beta loop, groups design |
| Stage 3 (remainder) | Teams schema, game-time blast, sub board, auto-spawn cron |
| Stage 4 | Monetize groups/teams |

---

## Physical device beta

See [physical-device-beta-test.md](./physical-device-beta-test.md).
