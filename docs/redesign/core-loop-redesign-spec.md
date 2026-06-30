# Core Loop Redesign Spec — "The Join Loop"

**Status:** Draft v1 · 2026-06-26
**Owner:** Ken (solo)
**Trigger:** External design reference (coaching flow) felt dramatically cleaner than current pickup UX. Root-cause review concluded the gap is *authoring* (one hand, one job per screen), not craft.
**Companion process:** [Tier 6 "Taste" loop](../product-review/TIER-MODEL.md) + [persona catalog G](../product-review/personas.md)

---

## Decision log

**2026-06-26 — founder review of §3 "steal list":**
- **NOT adopting** the pickup-loop steal backlog (S1–S8 / R1–R9) right now. The pickup Join Loop **stays as-is**; §3–§4 are kept below as a parked reference, not an active backlog.
- **One concrete product change approved instead:** on the **student/parent Next Class** surface, add **"Can't make it"** and **"Message coach"** actions. Data already supports it (`response_status: confirmed | cant_make_it | not_responded` in `ParentClassEnrollment`); only the affordance + a message-coach entry point are missing. Contract: [flow-class-session-response.md](../contracts/flow-class-session-response.md).
- **Process additions approved:** 2 student personas, **8** Tier-6 taste personas, and a **theme-reviewer** persona + theme-exploration loop ([theme-exploration-plan.md](./theme-exploration-plan.md)).

> §3 "steal list" and §4 backlog below are **parked** (not scheduled). Kept for future reference only.

---

## 0. The one insight (read this first)

**The better design already exists inside Rally — in the coaching vertical.**

| Mockup frame | Already built as | Core pickup loop equivalent |
|--------------|------------------|------------------------------|
| "Who is joining?" | `pages/CoachParent/EnrollmentConfirmationScreen.tsx` | ❌ no clean confirm-who step |
| Parent class detail ("Alex is enrolled" + Confirm / Can't make) | `pages/CoachParent/ClassDetailScreen.tsx` | ⚠️ `ActivityDetailScreen` has the data, not the shape |
| Coach roster (Confirmed / Not responded / Can't make + counts) | `ClassDetailScreen` `renderRosterGroup()` + status labels | ❌ pickup roster is not status-grouped |
| Status pill card | `components/coachParent/TodayMyClassesCard.tsx` | ⚠️ `NextUpCard` is close, not status-first |

So this is **a port, not an invention.** We lift patterns (and ideally components) that already ship in the coaching surface onto the pickup loop. Low novelty risk; high perceived-quality payoff.

---

## 1. The ONE core loop

> **The Join Loop:** *See a real game near me → decide in one screen → commit in one tap → know I'm in and coordinate → show up → get pulled into the next one.*

Everything else (crews/Rallies, free agents, classes, polls, leaderboards, trust deep-dives) is **supporting cast**. We make *only this loop* sing first.

### The five steps (each = one screen, one job, one primary action)

| # | Step | Screen (file) | The one job | The one primary action |
|---|------|---------------|-------------|------------------------|
| 1 | **Discover** | Play tab (`GameListCard` feed) | "Is there a game for me right now?" | Tap a game |
| 2 | **Decide** | `ActivityDetailScreen` | "Time, place, who, spots — am I in?" | **Join / I'm in** |
| 3 | **Commit** | `ActivityDetailScreen` (post-join state) | "Confirm I'm coming" | **Confirm** (secondary: Can't make it) |
| 4 | **Coordinate** | `GameRoomActionBar` + roster | "Who's in, what changed, where do I go" | **Message / day-of card** |
| 5 | **Close → reopen** | `PostGameAttendanceScreen` → Today | "That was fun — when's the next?" | **Rejoin / next game** |

### North-star + guardrail metrics

- **North star:** weekly games *attended* per active user.
- **Activation:** time-to-first-join (new user → joined a game) and % of new users who join in their first session.
- **Loop health (the funnel that must not leak):**
  - join → confirmed rate
  - confirmed → showed-up rate
  - showed-up → rejoin within 14 days
- If a redesign change doesn't move one of these, it's polish, not progress.

### The five "make it sing" laws (apply to every screen in the loop)

1. **One job, one primary action.** Exactly one full-lime `onPrimary` button. Everything else is secondary (outline) or tertiary (text). If two things look equally important, the screen has failed.
2. **Status first.** Tell me *where I stand* before *what to do* — a banner/state line at the top ("You're in — Mon 7PM" / "4 spots left").
3. **Group by state, not by raw list.** Rosters and lists segment by status (Confirmed / Not responded / Can't make) with a counts header — never one undifferentiated list.
4. **Plain language, one decision.** Binary, human choices ("Confirm" / "Can't make it"), not jargon ("ready", "collecting", "finalized") in the user's face.
5. **Always open the next loop.** Every terminal screen ends by pointing at the next game (close one loop by starting another).

---

## 2. The five screens: current → target (the delta)

### Step 1 — Discover (Play feed)
- **Current:** `components/game/GameListCard.tsx` in the Play feed; sport strip + "Open games near you"; card shows title, venue (2-line), time, distance, "N left" badge. Solid after tier-5.
- **Mockup principle:** scannable rows, status legible at a glance, one obvious tap target.
- **Target / add:**
  - A one-line **"why this game" hook** per card (e.g. "4 spots · starts in 3h · 1.2mi"). Lead with *urgency + fit*, not metadata.
  - **Personal state chips** when relevant: "You're in", "On waitlist", "Hosted by you" — so the feed reflects *me*.
  - Empty state already branded (tier-5) — keep; ensure single CTA = **Host a game**.

### Step 2 — Decide (`ActivityDetailScreen`)
- **Current:** rich detail with roster data, finalize banner ("Roster locked — game is finalized"), host vs player branches; multiple CTAs depending on state.
- **Mockup principle (Frame 3):** status banner first → one **Next** card (time/place/cost) → single primary action + secondary + "Message".
- **Target / add:**
  - **Status banner at top** ("4 spots left" / "You're in" / "Waitlisted #2"), mirroring `ClassDetailScreen`'s "Alex is enrolled" banner.
  - Collapse competing CTAs to **one primary** (Join / Confirm / Message depending on state), everything else secondary.
  - A single **"Next" card**: date · time · venue · cost note — the parent-class card shape.

### Step 3 — Commit (post-join RSVP)
- **Current:** join → `approved` / `ready` / `waitlisted`; "I'm in" / undo ("Can't make it" exists in `productCopy.undoImIn`). The *concept* of confirm exists but isn't presented as the clean binary the mockup shows.
- **Mockup principle (Frame 3):** big **Confirm**, quiet **Can't make it**, plus **Message Coach/Host**.
- **Target / add:**
  - Present commitment as a **Confirm / Can't make it** pair with a persistent **"You're confirmed — see you {day} {time}"** banner.
  - Map existing statuses → human labels (Law 4): `ready`→Confirmed, no-response→Not responded, declined→Can't make it. **Reuse `ClassDetailScreen` STATUS labels.**

### Step 4 — Coordinate (`GameRoomActionBar` + roster)
- **Current:** `GameRoomActionBar.tsx` host actions, finalized strip ("Roster locked — see you on court!"); roster via `RosterSeatBar`; **not status-grouped** the way the coach roster is.
- **Mockup principle (Frame 4):** counts header ("12 enrolled · 2 not responded · 2 can't make") + **status-grouped roster** + host action row (Message / Nudge / Mark attendance / Cancel).
- **Target / add:**
  - **Port `ClassDetailScreen.renderRosterGroup()`** to the pickup roster: Confirmed / Not responded / Can't make, with a counts header.
  - **Pinned announcement / "what changed" line** ("Moved to Court 4") on the detail + game room — mockup's Announcements block. (Today/Home already surfaces some of this; make it first-class.)
  - Host action row consistency: Message all · Nudge · Mark attendance · Cancel/defer (you already have nudge + attendance; group them like the mockup).

### Step 5 — Close → reopen (`PostGameAttendanceScreen` → Today)
- **Current:** `PostGameAttendanceScreen.tsx` (host marks showed/no-show); post-game review prompts exist.
- **Mockup principle:** every terminal state offers the obvious next step.
- **Target / add:**
  - After attendance/recap, end with **"Play again?"** → next nearby game or "Rehost next week" (one tap). This is the loop-closing law.

---

## 3. Steal list — delta table

| # | Pattern in reference design | Rally pickup loop today | Action |
|---|------------------------------|--------------------------|--------|
| S1 | Personal **status banner** ("Alex is enrolled") | data exists, not surfaced as banner | **Add** banner to `ActivityDetailScreen` (reuse coach pattern) |
| S2 | **Status-grouped roster** + counts header | flat roster (`RosterSeatBar`) | **Port** `renderRosterGroup()` from `ClassDetailScreen` |
| S3 | Binary **Confirm / Can't make it** | statuses exist (`ready`/undo) but jargon-y | **Reframe** as human binary + STATUS label reuse |
| S4 | **One primary action** per screen | multiple competing CTAs by state | **Demote** secondaries to outline/text |
| S5 | **Next card** (time/place/cost, single decision) | info spread across detail | **Consolidate** into one card |
| S6 | **Announcements / "what changed"** | lives in chat only | **Pin** host announcement on detail + room |
| S7 | **Plain-language summary rows** in create | `CreateActivityScreen` form | **Tighten** to labeled rows + one summary line |
| S8 | **Loop-closing CTA** ("Play again?") | review/attendance ends flat | **Add** next-game CTA at terminal |

---

## 4. Recommended backlog (prioritized, with breakage risk)

Effort: S ≤ half-day · M ~1–2 days · L ~3+ days. Risk = chance of breaking existing flows.

| ID | Item | Screen(s) | Steal | Effort | Risk | Notes |
|----|------|-----------|-------|--------|------|-------|
| **R1** | Personal status banner | `ActivityDetailScreen` | S1 | S | Low | Pure presentation; data already loaded |
| **R2** | Collapse to one primary action | `ActivityDetailScreen` | S4 | S | Low | Restyle CTAs; no logic change |
| **R3** | Status-grouped pickup roster | `ActivityDetailScreen` / `GameRoomActionBar` | S2 | M | Med | Reuse coach `renderRosterGroup`; map `join_requests` status → group |
| **R4** | Confirm / Can't-make binary + human labels | detail + roster | S3 | M | Med | Wraps existing `ready`/undo; keep DB semantics, change surface |
| **R5** | "Next" card consolidation | `ActivityDetailScreen` | S5 | S | Low | Layout regroup |
| **R6** | Pinned announcement / "what changed" | detail + game room | S6 | M | Med | New field or derived from host system message |
| **R7** | Discover card "why this game" hook + personal chips | `GameListCard` | — | S | Low | Compose from existing fields (spots, start delta, distance, my status) |
| **R8** | Loop-closing "Play again?" CTA | `PostGameAttendanceScreen` → Today | S8 | S | Low | Link to discover/rehost |
| **R9** | Create flow tighten to labeled rows + summary | `CreateActivityScreen` | S7 | M | Med | Cosmetic + copy; validate no field regressions |

**Suggested first slice (1 sitting, high signal, low risk):** R1 + R2 + R7 — banner, single primary, smarter cards. Visible "feels better" with near-zero breakage. Then R3/R4 (the roster + RSVP port) as the second slice.

> **Parked** — not scheduled per founder decision 2026-06-26. See **§4b** for the active Tier 6 backlog.

### §4b — Tier 6 consolidated backlog (ACTIVE · 2026-06-26)

From `taste-tier6-join-loop` (8/8 personas). Builder implements J1–J7; validator queue `taste-tier6`.

| ID | Item | Screen | Priority | Builder ref |
|----|------|--------|----------|-------------|
| J1 | Post-join status banner — **Confirm / Can't make it** | `ActivityDetailScreen` | P0 | Replaces separate "commit" step |
| J2 | Status-grouped roster + counts | detail + game room | P0 | Port `ClassDetailScreen` pattern |
| J3 | One primary CTA pre-join; demote reviews/tournaments/regulars | `ActivityDetailScreen` | P0 | Below fold until joined |
| J4 | Personal-state chip on discover rows ("You're in") | `GameListCard` | P0 | `flow-play-screen` |
| J5 | Player game room — roster + Message only | `GameRoomActionBar` | P1 | Host ops → sheet |
| J6 | Post-game player path — next game card | `PostGameAttendanceScreen` | P1 | Host keeps attendance |
| J7 | Urgency hook on card ("4 spots · starts in 3h") | `GameListCard` | P1 | Compose existing fields |

**Synthesis:** [2026-06-26-taste-tier6-synthesis.md](../product-review/consolidated/2026-06-26-taste-tier6-synthesis.md)

---

## 5. What NOT to lose (Rally's moat the mockup lacks)

The reference design is a *bounded* problem (known roster, fixed time, recurring). Rally's hard, differentiated value is the opposite — **don't sand these off while chasing calm:**

- **Discovery of strangers / public nearby games** (the acquisition engine).
- **Geo + distance** ("1.2mi away") — the reason pickup works.
- **Sport breadth** (10 sports) and the sport strip.
- **Finalize / lock roster**, trust/ratings, no-show accountability.
- **Crews / Rallies** (the recurring retention loop) and **free agents**.

The goal is **the mockup's clarity applied to Rally's harder problem**, not shrinking Rally into the mockup.

---

## 6. Rollout — make change cheap and safe (your real speed lever)

Your fear ("changing it will break a lot") is a coupling signal. Neutralize it:

1. **Reuse, don't rebuild.** R1–R4 lift live coaching components (`renderRosterGroup`, status labels, `TodayMyClassesCard` pill, `EnrollmentConfirmationScreen`). Extract them into shared `components/roster/` + `components/ui/StatusBanner.tsx` so coach + pickup share one implementation.
2. **Token-only restyle first.** R2/R5/R7 are `Button` variant + layout + token changes (`colors.primary`/`onPrimary`, `spacing`, `typography`) — no logic. These are reversible.
3. **One screen per PR, behind the existing CI + tier gates.** Each slice = its own PR through dev→preview→main; no big-bang.
4. **Keep DB semantics, change only the surface.** R3/R4 re-present `join_requests` statuses; they do not migrate data.

---

## 7. Risk / breakage map

| Change | Could break | Mitigation |
|--------|-------------|------------|
| Roster regroup (R3) | host finalize/lock, waitlist promotion | Group is presentational over existing status; add unit test for status→group mapping |
| Confirm/Can't-make (R4) | "I'm in"/undo, ready-state nudges | Keep underlying calls; only relabel + reshape; snapshot test the state machine |
| One-primary CTA (R2) | host vs player branches | Enumerate states in a table; one primary per state, asserted in test |
| Announcement pin (R6) | chat system messages | Derive from existing host system message; no new write path if possible |

---

## 8. Process hook — Tier 6 "Taste"

This spec is the *output* of authoring. To keep authoring in the loop (not just polish), every core-loop screen now also runs a **Tier 6 taste pass** — see [TIER-MODEL.md](../product-review/TIER-MODEL.md) and [persona catalog G](../product-review/personas.md). Tier 6 is the only tier allowed to say *"cut this / merge this / this shouldn't exist."*

---

## Appendix — answering the founder questions

- **Is the reference design better?** Yes, at *authoring* (one job per screen, status-first, grouped state). No, it's not solving a harder problem than you — it's solving an easier one cleanly. Your craft (tier 5) is already there; your *authoring* gate (tier 6) was missing.
- **Design or process?** Process. Tiers 1–5 optimize what exists; none authors. Tier 6 fixes that.
- **Why did we never design this way?** You did — on the coaching side. The pickup loop grew bottom-up and never inherited it. This spec ports it across.
- **Execution speed vs product?** Speed of *learning* on the one loop > speed of shipping more surfaces. Reuse + token restyle + one-screen PRs is how you get speed *and* the freedom to make it enjoyable.
