# Pre–v1.0 business analysis & build priorities

**Last updated:** 2026-06-03  
**Context:** No live users yet; UI designer engaged; closed LA beta; confident in core loop; **do not open floodgates** until v1.0 design + product are ready.

**Related:** [open_items.md](../../open_items.md) · [VISION.md](../VISION.md) · [ADVISOR_REVIEW_MERGED_2026-06-03.md](./ADVISOR_REVIEW_MERGED_2026-06-03.md) · [ROSTER_COMMITMENT_POLICY.md](./ROSTER_COMMITMENT_POLICY.md)

---

## Executive summary

| Question | Answer |
|----------|--------|
| **Should you build payments, Teams, Leagues, Redis, API server now?** | **No** — retention gate first. |
| **What can you do in advance without slowing v1.0?** | **Scaffold + instrument + admin read paths** — not full products. |
| **Where to start this month?** | Finish **P1** (QA delegated, preview build) → query **replay %** → **one** P2 product slice (Guests *or* Discover polish), not five platforms at once. |
| **Punishment / abuse automation?** | **Investigate manually** via SQL + thin admin; automate **after** you have patterns and written policy. |

---

## Your stage (honest)

```text
[Design in progress] → [Closed beta QA] → [Replay metric] → [v1.0 launch criteria] → [Monetization / scale]
         ↑ YOU ARE HERE (engineering ahead of users)
```

**Strengths:** Core loop built (Discover, Rally chat, I'm in, lock, attendance, waitlist, reliability v1). Rules live in Postgres RPCs — correct architecture.

**Risks if you jump ahead:** (1) designer rework on half-built paywalls, (2) ops burden before liquidity, (3) distraction from **proving crew replay** — the only gate that unlocks Teams/Leagues/payments in [open_items.md](../../open_items.md).

---

## v1.0 gate (suggested — align with designer)

Do **not** open public App Store / broad marketing until:

| Gate | Owner |
|------|--------|
| Designer sign-off on Home, Discover, Game Room, Rally chat, Profile | Design |
| Collective QA P0 clear on preview (two devices) | QA |
| `analytics_crew_lifecycle.retained` queried with real host cohort | Product |
| No P0 crashes on join → lock → attendance path | Eng |
| Copy/glossary stable (Rallys, I'm in, lock) | Product |

**Optional for v1.0:** Guests (A2), Google login, custom profile avatar upload, punishment automation.

---

## What NOT to build now (defer)

| Area | Why wait |
|------|----------|
| **Stripe / payments / fee split** | No WTP signal; Organizer Pro is first paid wedge *after* replay |
| **Full Teams + Leagues** | Zero leagues → Teams is just Rallys + chat (already shipped) |
| **Dedicated API server + Redis** | Supabase + RPCs + Edge Functions cover beta; adds deploy/ops surface |
| **Search warehouse / Kafka** | No volume |
| **Automated punishment / bans** | Need policy + data; false positives hurt empty network |
| **Open city expansion** | LA density first |
| **Public floodgate marketing** | Designer + v1.0 gate above |

---

## What TO do in advance (high leverage, low scope)

Ordered by **ROI / least distraction**:

### Tier 0 — This week (engineering)

| Item | Effort | Notes |
|------|--------|-------|
| Commit P1 (waitlist UX, friends entry) | Done locally | Preview build for QA |
| **Unready + leave before lock** | Small | Shipped — `set_game_ready(false)`, copy aligned with A3 |
| **EAS preview rebuild** | Small | Testers need installable build |
| Query `analytics_crew_lifecycle` | 1 SQL | North star |

### Tier 1 — Scaffold only (no UI polish)

| Item | Exists? | Advance work |
|------|---------|--------------|
| **Entitlements / feature flags** | ✅ `user_entitlements`, `app_feature_flags` | Add rows for `organizer_pro`, `player_plus` — **no paywall UI** |
| **Product analytics events** | ✅ `trackProductEvent`, crew funnel views | Add 2–3 events you’ll need for abuse (e.g. `roster_left_before_lock`, `attendance_submitted`) |
| **Admin report queue** | ✅ `AdminScreen`, `listAdminReportQueue` | Use for beta; extend later |
| **Feedback** | Partial (beta mailto) | **One table** `product_feedback` + Edge Function email — **no in-app module UI** until design |
| **Trust stats** | ✅ flakes (legacy table), attendance reliability | Read-only dashboards via SQL |

### Tier 2 — After replay metric OK (repo “P2”)

Pick **one** product track per sprint:

| P2 ID | Build when | Size |
|-------|------------|------|
| **DISC-01** | Designer hands Discover spec | S |
| **CREW-01** | Reliability on Rally member rows | S |
| **A2 Guests** | Groups ask for non-member invites | M |
| **WAIT-UX-02** | Waitlist pain without push | M |
| **TOUR-01** | Groups ask for brackets | M |

**Do not start all P2 in parallel.**

### Tier 3 — After v1.0 + retention

| Item | Sequence |
|------|----------|
| Google / Apple social login | Supabase Auth providers — **when signup friction blocks hosts** |
| Profile photo polish | Design + storage compression (Stage 2 in open_items) |
| **host_release_roster_spot** after lock | See [ROSTER_COMMITMENT_POLICY.md](./ROSTER_COMMITMENT_POLICY.md) v1.1 |
| Organizer Pro (payments) | Entitlements already scaffolded |
| Teams/Leagues schema | Stage 6 — **only with league demand** |

### Tier 4 — Scale (100+ DAU)

Redis, dedicated API, read replicas, inbox RPC at scale — see advisor stack table in [ADVISOR_REVIEW_MERGED_2026-06-03.md](./ADVISOR_REVIEW_MERGED_2026-06-03.md).

---

## Module-by-module (your list)

### Payments module

- **Now:** None. Keep `user_entitlements` + `hasEntitlement()` hooks.
- **Prep:** Document SKUs in open_items; Stripe Connect **design doc only** (1-pager: host payout vs platform fee).
- **Build:** First dollar = **Organizer Pro** (host tools), not Player Plus.

### Feedback module

- **Now:** `buildBetaContactMailto` + advisor “Quick feedback” in wireframes.
- **Prep (1 day):** Table `product_feedback (user_id, category, body, screen, created_at)` + RLS insert-own + admin read policy.
- **Later:** In-app form when designer specifies placement (Profile vs post-game).

### Admin — centralized metrics & abuse

- **Now:** `AdminScreen` — report triage, suspend user.
- **Prep (SQL views, no new app tab):**
  - `admin_user_trust_summary` — reliability %, flake_count, no_show_count, reports
  - `admin_activity_churn` — leave before lock count per user (from join_requests audit if added)
  - `admin_game_room_flags` — games with &gt;3 reports, host cancel rate
- **Process:** Weekly 30-min founder review of SQL export — **write punishment policy doc** before any auto-ban.
- **Later:** Retool / internal web dashboard when &gt;50 active users.

### Punishment module

- **Now:** Manual suspend + post-game attendance + (legacy) flake table — **do not expand automation**.
- **Policy first:** [ROSTER_COMMITMENT_POLICY.md](./ROSTER_COMMITMENT_POLICY.md) + written tiers (warn → restrict join → suspend).
- **Build automation when:** ≥20 incidents logged and categories stable.

### Profile icon / avatar

- **Now:** `profile_photo_url` exists.
- **With designer:** Default avatars, upload crop, compression — **not blocking beta**.
- **Google login:** Supabase dashboard enable Google provider + button on login — **~1 day eng** when you want lower signup friction; independent of avatar.

### Teams and Leagues

- **Business:** Deferred until `analytics_crew_lifecycle.retained` proves replay ([open_items.md](../../open_items.md)).
- **Technical:** Rallys (`regular_groups`) **are** your pre-team primitive; don’t duplicate.

### Own database / Redis / APIs

| Layer | Beta | When to add |
|-------|------|-------------|
| **Postgres (Supabase)** | ✅ SoT | Keep |
| **Edge Functions** | ✅ push | More jobs when scheduled tasks appear |
| **Separate Node API** | ❌ | Multi-region or non-Postgres logic |
| **Redis** | ❌ | Rate limits at edge; session cache at 10k+ DAU |
| **Mobile → RPC direct** | ✅ | Correct for now |

---

## Recommended “where to start” matrix

```text
                    IMPACT ON RETENTION
                    low ────────────────── high
              ┌─────────────────────────────────┐
    low       │ Google login    │ DISC-01 polish │
    EFFORT    │ Feedback table  │ CREW-01 trust  │
              │ SQL admin views │ Guests A2      │
              ├─────────────────────────────────┤
    high      │ Redis/API       │ Payments       │
    EFFORT    │ Punishment bot  │ Teams/Leagues  │
              └─────────────────────────────────┘
```

**Start top-right only after replay query.** Until then: **bottom-left scaffolds** (feedback table, SQL views, preview build).

---

## P2 roadmap (repo definition) — how to “do P2”

From [ADVISOR_REVIEW_MERGED_2026-06-03.md](./ADVISOR_REVIEW_MERGED_2026-06-03.md) §6:

| ID | Item | Recommendation |
|----|------|----------------|
| A2 | Guests | **First product P2** if beta groups need outsiders |
| DISC-01 | Discover polish | **First P2** if designer delivers Discover first |
| CREW-01 | Reliability on member rows | Quick win alongside either |
| TOUR-01 | Mini tournament | Only if hosts ask |
| A3-2 | Roster confirmation push | After WAIT-UX-02 |
| A6-3/4 | Chat merge / drop RSVPs | Risky — last |

**Not P2:** Payments, Teams, Leagues, Redis, API server, punishment automation.

---

## Suggested 4-week plan (solo founder + designer)

| Week | Product | Engineering |
|------|---------|-------------|
| 1 | Lock v1.0 screen list with designer | P1 commit, preview build, unready/leave QA |
| 2 | QA sign-off | SQL: replay + trust export; feedback table migration |
| 3 | Choose **one** P2 (Guests *or* Discover) | Implement chosen P2 only |
| 4 | Host recruitment (5–10 LA) | CREW-01 or DISC-01 finish; **no payments** |

---

## Decision log (for advisor / cofounder)

1. **Closed beta until v1.0 design gate** — agree.  
2. **Advance work = scaffold + SQL admin, not feature flood.**  
3. **Post-lock dropout = chat + attendance v1; host release spot = v1.1.**  
4. **Punishment = policy + manual review before code.**  
5. **Monetization sequence unchanged:** replay → Organizer Pro → Player Plus → Leagues.

---

## One-line answer to “so many things we can do”

**Instrument and scaffold the ops layer (feedback row, SQL trust views, entitlements rows); prove replay with real LA hosts; let the designer finish v1.0 UI; then pick a single P2 slice (Guests or Discover) — not payments, not Redis, not leagues yet.**
