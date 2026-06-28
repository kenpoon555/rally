# Flow contract — Class session response (student / parent)

**Contract id:** `flow-class-session-response`
**Scope:** Student/parent responding to the **next class session** — confirm, "Can't make it", and "Message coach" — from the Next Class surface.
**Status:** Draft — from founder decision 2026-06-26 ([core-loop-redesign-spec.md](../redesign/core-loop-redesign-spec.md) decision log)
**Related:** [module-coach-parent-navigation.md](./module-coach-parent-navigation.md) · [flow-student-class-enrollment.md](./flow-student-class-enrollment.md)

## Purpose

A student/parent can respond to their upcoming class in **≤2 taps** and reach the coach without hunting through chat. The data already supports the response states; this contract covers the **affordance** and the **message-coach entry point** that are currently missing.

## Current state (verified 2026-06-27 · class-response-round1)

**Review verdict:** FAIL — implementation not started. Personas `student-cant-make-next-class`, `student-message-coach` (static audit on `dev`).

- `TodayMyClassesCard.tsx` — status display only; row tap → `ClassDetail` overview. **No Confirm / Can't make it / Message coach.**
- `studentEnrollmentService.ts` — reads `response_status`; **no parent write helper.**
- `ClassDetailScreen.tsx` — coach `groupedRoster` by status ✅; chat tab exists but not ≤2 taps from Today card.

Builder backlog: `docs/product-review/consolidated/2026-06-27-class-response-builder-backlog.md` (CR1–CR6).

## Current state (verified 2026-06-26)

- `ParentClassEnrollment.response_status` exists: `confirmed | cant_make_it | not_responded`.
- `components/coachParent/TodayMyClassesCard.tsx` **displays** the status string but exposes **no action** — tapping the row only navigates to `ClassDetail` overview.
- Coach side already groups roster by status in `pages/CoachParent/ClassDetailScreen.tsx` (`STATUS_LABEL` / `groupedRoster`), so a student response just needs to write `response_status`.

## Required behavior

### Next Class card (`TodayMyClassesCard.tsx`)
- [ ] When `response_status === 'not_responded'` and session is upcoming, show two inline actions on the row: **Confirm** and **Can't make it**.
- [ ] Tapping **Can't make it** sets `response_status = 'cant_make_it'`, updates the status line immediately (optimistic), and surfaces a lightweight undo / change.
- [ ] Tapping **Confirm** sets `response_status = 'confirmed'`.
- [ ] A **Message coach** affordance is present on the card (or the class detail it opens) that lands in the **correct class chat thread** — not a generic DM.
- [ ] Actions are **≤2 taps** from Today / Next Class.

### Reach-through
- [ ] **Message coach** opens the class conversation thread for that enrollment's class (reuse existing class chat; do not create a parallel thread).
- [ ] Cancelled/deferred sessions show their state and **disable** Confirm / Can't make it (no responding to a dead session).

### Coach visibility
- [ ] A student's `cant_make_it` / `confirmed` appears in the coach's `groupedRoster` on `ClassDetailScreen` without a manual refresh round-trip beyond normal load.

## Pass/fail checklist

- [ ] From Today, a parent with a `not_responded` upcoming session can mark **Can't make it** in ≤2 taps and see the row flip to "Can't make it".
- [ ] **Message coach** from the card lands in the right class thread with the coach as recipient.
- [ ] Coach opening the class roster sees the updated status grouping.
- [ ] No response actions render for `cancelled` / `deferred` sessions.
- [ ] Copy contains **no beta/test language** (guard: `__tests__/noBetaSurfaces.test.ts`).

## Out of scope

- Pickup/Rally RSVP (separate `flow-rally-session`).
- Bulk multi-child response (one enrollment row at a time for now).
- Coach-initiated session changes (covered by class operations).
