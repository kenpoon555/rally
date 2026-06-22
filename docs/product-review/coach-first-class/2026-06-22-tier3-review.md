# Product review — coach-first-class · 2026-06-22 (tier 3 expert)

## Persona

**Role:** R2 — Approved coach first class  
**Goal:** Re-verify B8 fix after PR #47 merge  
**Contract:** [flow-create-game.md](../../contracts/flow-create-game.md)  
**Queue:** `onboarding-round3-expert` tier 3

## Setup

| Item | Value |
|------|-------|
| Account | `@playerr0474532` (`is_coach=true`) |
| Code | `createCoachClassListing`, `CreateActivityScreen` class branch merged |
| DB check | `coach_class_listings` row `class-val-1782105765196` for playerr0474532 |

---

## Journey summary (post-B8)

| Step | Tier 2 result | Tier 3 re-check | Result |
|------|---------------|-----------------|--------|
| `createMode: 'class'` → listing insert | **Fail** (pickup path) | **Pass** — authenticated insert to `coach_class_listings` succeeds | **Pass** (DB/API) |
| CLASSES I TEACH lists new class | **Fail** | **Partial** — `listCoachClasses` reads DB first; sim E2E publish not re-run (login flake) | **Partial** |
| ClassDetail + parent enroll share | **Fail** | **Partial** — code path present; sim proof deferred | **Partial** |
| Publish class CTA copy | **Publish game** | **Fixed in code** — **Publish class** when class mode | **Pass** (code review) |

---

## Friction

| P | Screen | Issue | Suggested change | Contract impact |
|---|--------|-------|------------------|-----------------|
| P2 | Validation | Sim E2E publish for `@playerr0474532` not re-captured this session | Re-run validator on class create → ClassDetail screenshot | `flow-create-game` proof |
| P3 | Create form | Screen title still **Create Game** in some builds | Class header when `createMode === 'class'` | Copy polish |

**Tier 2 P1 (pickup path) — resolved in builder.** Remaining gap is proof depth, not wrong journey.

## Recommended contract changes

- Mark B8 checklist rows as **implemented**; tier 3 validation must include sim screenshot of ClassDetail share CTA for non-Marcus coach.
