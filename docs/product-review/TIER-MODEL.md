# Product review tier model (T0–T6)

**Purpose:** Define what each tier optimizes for, minimum persona count, and how queues chain into contracts + validation.

**Related:** [personas.md](./personas.md) · [review-queues.json](./review-queues.json) · [release-loops.json](../release-loops.json) · [MASTER-LOOP.md](./MASTER-LOOP.md)

---

## Tier ladder

| Tier | Name | Bar | Personas (min) | Scope |
|------|------|-----|----------------|--------|
| **0** | **Dogfood / build-truth triage** | **“I just used the *real* build — is each thing correct, needed, or confusing?”** | **1–2** (founder / dogfood) | The **just-built** feature on a real sim/device. **Classify & route**, don't optimize. The router that feeds every other tier + contracts. |
| **1** | Coverage | “Does the journey work?” | **6** | One release theme (onboarding, pickup, Play discover) |
| **2** | Picky | “Zero silent failures / wrong surface” | **4–6** | Same theme, stricter rubric; matrix audits |
| **3** | Expert / deep UX | “Repeat-user excellence in **one** hotspot” | **4** | Narrow (e.g. Play strip MRU) — **not** full-app |
| **4** | Cross-surface picky | “Every major tab, weird users, behavioral depth” | **8** | Inbox, chat, reviews, attendance, trust, classes, notifications |
| **5** | Visual / design | “Art direction, hierarchy, beauty, empty states” | **8** | Screen-by-screen design QA — designer bar |
| **6** | **Taste / authoring** | **“Would I *want* to use this? Is it the right thing — and does it delight?”** | **8 taste personas** (≥3 / screen) | **Per screen**, one loop at a time — judgment & scope, not bugs. Theme exploration (`theme-reviewer`) runs here too. |

**Layer 3 (validation)** in MASTER-LOOP is separate: sim + contract proof after builder. It is **not** the same as product-review tier 3.

### Why Tier 0 exists (the gap T1–T6 cannot close)

Tiers 1–6 all run on **either the existing app or pre-build judgment/mockups** (T6 authors *before* code; the Validator proves code *matches a contract*, often by audit). **None of them sits a human in front of the freshly-built feature and asks "wait — does this actually behave right?"** That is why two defects shipped past validation on the class-response / join-loop build (Jun 2026):

1. **Self-contradiction** — a discover card showed **"5 left"** (trailing badge, from server `missing_players`) next to **"9 spots left"** (urgency hook, from a client roster calc on unloaded list rows). Both "passed" because each was individually contract-legal.
2. **Wrong-viewer action** — a **non-member** viewing a public game saw **"Open Game Room"** (a member surface) *and* "Request to Join", because `canOpenActivityChat` reports *chat liveness*, not *viewer membership*.

Neither contract said *"spot counts have one source"* or *"which actions show per viewer-state"* — so neither could be flagged as a bug. **Tier 0's job is to catch these by use, then route them:** the contradiction → `bug` + a contract `needs-more-detail` rule; the leak → `bug` + a viewer-state action matrix the contract was missing.

**Tier 0 is the router, not the apex.** Its output is not a quality score — it is a classified, routed worklist that *feeds* the right tier / builder / contract.

### Why Tier 6 exists (the gap tiers 1–5 cannot close)

Tiers 1–5 are **optimizers** — they make what already exists more correct (1–2), deeper (3–4), and more beautiful (5). **None of them is allowed to question whether the screen should exist, whether the scope is right, or whether it sparks any joy.** That is an *authoring* judgment, and its absence is why a competent app can still feel "assembled" rather than "authored."

**Tier 6 is the only tier allowed to recommend: cut this, merge this, change the scope, or "this is correct but joyless — redo it."** It runs **per screen** (not per journey), one core loop at a time, and feeds the [redesign spec](../../redesign/core-loop-redesign-spec.md).

---

## What we learned (Jun 2026)

- **Play-discover tier 3** closed strip personalization — 4 personas, **one area**. That was intentional scope, not full-app quality.
- Gaps tier 3 did **not** cover:
  - Heavy chatters (Inbox Friends / Games / Rallies)
  - Post-game reviewers & attendance raters
  - Class inbox vs Play Classes **visibility mismatch**
  - UGC report/block device paths
  - Visual polish (spacing, typography, empty states)
- **Tier 4 + 5** exist to cover **component breadth** and **design** without diluting tier 1–3 ship gates.

---

## Component → tier map

Each tier-4 queue should touch **at least 6 of 8** component contracts before consolidator.

| Component | Primary contract | Tier-4 personas (examples) |
|-----------|------------------|----------------------------|
| Inbox & filters | `flow-inbox` (TBD) | `inbox-heavy-chatter`, `inbox-empty-state-hawk` |
| DM / group chat | `flow-chat-ugc` | `inbox-heavy-chatter`, `block-report-skeptic` |
| Post-game review | `flow-post-game-review` (TBD) | `post-game-reviewer`, `attendance-rater` |
| Play discover | `flow-play-screen` | `play-strip-edge-tapper` |
| Profile / settings | `flow-profile` | `settings-depth-diver` |
| Classes / coach-parent | `module-coach-parent-navigation` | `class-parent-inbox`, `coach-announcement-sender` |
| Trust / safety | `module-ugc-moderation` | `block-report-skeptic` |
| Today / home | `flow-today-home` (TBD) | `notification-hunter` |

Tier **5** re-walks the same surfaces with **design rubric only** (no new features) — see [personas.md](./personas.md) catalog F.

---

## Queue chaining (recommended order)

```text
[Feature loop T1] → T2 picky → T3 expert (optional, narrow)
  → cross-surface-tier4-round1 (8 personas)
  → visual-tier5-round1 (8 personas)
  → taste-tier6-<loop> (8 taste personas, ≥3 / screen) → redesign spec → builder
  → theme-explore (theme-reviewer, generative) → founder pick → validator contrast gate
  → validation queues per contract handoff
  → ┌─ T0 dogfood triage (real build, after validator-green / before src PR merge) ─┐
    │   bug → builder + contract regression row                                     │
    │   needs-more-detail → contract PR                                             │
    │   simplify / necessary / makes-sense → Tier 6 / cut                           │
    └──────────────────────────────────────────────────────────────────────────────┘
```

**T0 is a loop, not a one-shot stage.** It runs after *any* build lands on a real device — it has no fixed position in the ladder because its whole point is to be the continuous "use the real thing" check that re-routes work back into the right tier or contract.

Tier 6 may also run **first**, standalone, to *author* a redesign before any feature loop — that is its highest-leverage use (see the Join Loop spec).

| Release loop id | Starts at | Ends at |
|-----------------|-----------|---------|
| `play-discover-jun-2026` | `play-discover-round1` | `play-discover-round3-ux` ✅ done |
| `cross-surface-tier4-jun-2026` | `cross-surface-tier4-round1` | consolidator → contracts → builder |
| `visual-tier5-jun-2026` | `visual-tier5-round1` | requires tier4 contract merge (or parallel docs-only) |

Start tier 4 **after** App Store Build 12 ship, or run **docs-only** tier-4 reviews in parallel (no src PR) to build backlog.

---

## Tier 0 rubric — dogfood / build-truth triage

Run on the **actually-built feature** (real sim/device, real data — not mockups, not a code audit), against its **merged contract**. Walk it like a skeptical user, and for **every observation** assign **exactly one** bucket, then route it. Speed over coverage — this is the founder sniff test, not an 8-persona sweep.

| # | Bucket | The question | Example (Jun 2026) | Route to |
|---|--------|--------------|--------------------|----------|
| 1 | **Makes sense?** | Does this behave the way a real user would expect — coherent intent, no surprise? | Card pulls you toward the next step | If **no** → Tier 6 / redesign spec |
| 2 | **Necessary?** | Is every element / action / screen earning its place, or is it over-build / noise? | Two competing CTAs on one card | If **no** → Tier 6 `taste-scope-skeptic` / `taste-one-job` (cut) |
| 3 | **Bug?** | Does it contradict the contract, **itself**, or reality? | "5 left" vs "9 spots left"; non-member sees "Open Game Room" | **Builder backlog** + add a regression row to the contract |
| 4 | **Needs more detail?** | Is the contract **silent / ambiguous**, so you *can't tell* intended vs bug? | No rule said spot counts share one source; no per-viewer-state action matrix | **Contract PR** — add the missing rule / matrix |
| 5 | **Can simplify?** | Redundant info, duplicated number, too many taps/steps? | Spot count printed twice on one card | Tier 6 authoring, or builder if mechanical |

**Output:** a single **triage table** per surface — `observation → bucket → route → contract section to touch`. No fixes in this pass; Tier 0 only classifies and routes. A finding can be both a `bug` *and* expose a `needs-more-detail` contract gap (today's two defects were exactly that) — log both rows.

**When it runs:** continuously / opportunistically — every time you (or anyone) actually uses a freshly-built feature. Especially right after a Validator marks a queue green, **before** the src PR merges, since validation-by-audit cannot feel a self-contradiction. It is the cheapest tier and the first line of defense.

**Tier 0 vs the rest:** T1–T6 *optimize* (work → correct → deep → broad → beautiful → right+delightful). **T0 *classifies*** what the real build is actually doing and points each finding at the tier/contract/builder that should own it.

---

## Tier 4 rubric (every persona)

Each review must score **PASS / FAIL / DEFER** per section:

1. **First 30s** — Can I orient without reading docs?
2. **Happy path** — Core job completes in ≤N taps (persona-specific)?
3. **Empty / error** — Copy honest? Recovery obvious?
4. **Weird path** — Back button, kill app, filter switch, zero rows
5. **Wrong role** — Surfaces that should be hidden for this user
6. **Regression** — Anything worse than last tier?

**FAIL** if any P0 wrong-surface, dead end, or trust/safety gap.

---

## Tier 5 rubric (every persona)

Design-only — **no** functional bugs unless they block comprehension:

1. **Hierarchy** — One clear primary action per screen
2. **Typography** — Title / body / caption distinct; no orphan lines
3. **Spacing** — Consistent section rhythm; no accidental double gaps
4. **Color** — Accent used with purpose; states readable
5. **Empty states** — Illustration + copy + CTA feel intentional
6. **Motion** — Transitions not jarring (if applicable)
7. **Brand** — Feels like Rally, not generic template
8. **Screenshot test** — Would you ship this frame in App Store shots?

---

## Tier 6 rubric (every screen, every taste lens)

Score **KEEP / CHANGE / CUT** per screen (not PASS/FAIL — Tier 6 makes *authoring* calls). At least one **CHANGE or CUT** recommendation per screen is expected; "all KEEP" usually means the lens wasn't applied honestly.

1. **Want** — Would I personally *choose* to open and use this screen? (gut check, 1–5)
2. **One job** — Is there exactly **one** primary action? What competes with it, and what can be cut?
3. **First 3 seconds** — Emotional first impression: calm / confident / delightful — or busy / anxious / generic?
4. **Best-in-class** — Versus the best app doing *this exact job*, where does this lose? Name the gap.
5. **One moment of joy** — Is there a single delightful detail (copy, motion, reward, micro-interaction)? If none, invent one.
6. **Scope** — Should this screen exist at all? Could it be merged, deferred, or deleted?
7. **Authored vs assembled** — Does it feel designed by one hand with a point of view, or stitched from features?
8. **Ship-proud** — Would I demo this exact frame proudly, unprompted?

**Output:** a short per-screen verdict + the single highest-leverage authoring change. Feeds the [redesign spec](../../redesign/core-loop-redesign-spec.md) backlog — **not** a builder bug list.

**Tier 5 vs Tier 6 (do not conflate):** Tier 5 asks *"is this well-made?"* (craft). Tier 6 asks *"is this the right thing, and does it delight?"* (taste). A screen can pass Tier 5 and fail Tier 6 — that is the exact situation this ladder was missing.

---

## Persona minimum rule

| Tier | `min_reviews_before_consolidate` |
|------|----------------------------------|
| **0** | **1** (founder/dogfood pass; no consolidator — routes findings directly) |
| 1 | 6 |
| 2 | 4–6 |
| 3 | 4 |
| **4** | **8** |
| **5** | **8** |
| **6** | **8 taste personas** (catalog G; ≥3 / screen) + `theme-reviewer` (catalog H) — consolidate per *loop*, not per journey |

Do not run consolidator until the queue minimum is met.

---

## Inbox Classes — role gating (Build 12)

**Fixed:** Inbox **Classes** uses `shouldShowInboxClassesFilter` — same bar as Play. `marcus@…` (R0 player) does **not** see Classes; coaches and enrolled parents do.

Coach foundation flags stay **on** in production EAS. Ship **role gates**, not global flag-off.

---

## How to start tier 4

```bash
cd RallyApp
./.cursor/hooks/product-review-loop-start.sh --queue cross-surface-tier4-round1
```

One Agent chat per persona in [review-queues.json](./review-queues.json). Then consolidator → pre-approve → contract PR.
