# Product review tier model (T1–T5)

**Purpose:** Define what each tier optimizes for, minimum persona count, and how queues chain into contracts + validation.

**Related:** [personas.md](./personas.md) · [review-queues.json](./review-queues.json) · [release-loops.json](../release-loops.json) · [MASTER-LOOP.md](./MASTER-LOOP.md)

---

## Tier ladder

| Tier | Name | Bar | Personas (min) | Scope |
|------|------|-----|----------------|--------|
| **1** | Coverage | “Does the journey work?” | **6** | One release theme (onboarding, pickup, Play discover) |
| **2** | Picky | “Zero silent failures / wrong surface” | **4–6** | Same theme, stricter rubric; matrix audits |
| **3** | Expert / deep UX | “Repeat-user excellence in **one** hotspot” | **4** | Narrow (e.g. Play strip MRU) — **not** full-app |
| **4** | Cross-surface picky | “Every major tab, weird users, behavioral depth” | **8** | Inbox, chat, reviews, attendance, trust, classes, notifications |
| **5** | Visual / design | “Art direction, hierarchy, beauty, empty states” | **8** | Screen-by-screen design QA — designer bar |

**Layer 3 (validation)** in MASTER-LOOP is separate: sim + contract proof after builder. It is **not** the same as product-review tier 3.

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
  → validation queues per contract handoff
```

| Release loop id | Starts at | Ends at |
|-----------------|-----------|---------|
| `play-discover-jun-2026` | `play-discover-round1` | `play-discover-round3-ux` ✅ done |
| `cross-surface-tier4-jun-2026` | `cross-surface-tier4-round1` | consolidator → contracts → builder |
| `visual-tier5-jun-2026` | `visual-tier5-round1` | requires tier4 contract merge (or parallel docs-only) |

Start tier 4 **after** App Store Build 12 ship, or run **docs-only** tier-4 reviews in parallel (no src PR) to build backlog.

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

## Persona minimum rule

| Tier | `min_reviews_before_consolidate` |
|------|----------------------------------|
| 1 | 6 |
| 2 | 4–6 |
| 3 | 4 |
| **4** | **8** |
| **5** | **8** |

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
