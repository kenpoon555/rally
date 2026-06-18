# Flow — Coach class operations (cancel / defer / reassign)

**Contract id:** `flow-coach-class-operations`  
**Status:** Implemented — v1.4 validated 2026-06-17  
**Track:** Paid wedge · [release-track.md](../coach-parent-student/release-track.md)

## Purpose

Coach (solo) can **cancel** or **defer** class sessions — with **parent notification** for minor classes.

North-star: **Coach defers Monday class → parents notified → roster kept → session card updated.**

**v1.4 scope:** defer, cancel, notify parents. **Substitute coach** and **consolidate** are v1.5+ (not in this build).

## Demo setup

```bash
supabase db query --linked -f supabase/scripts/seed_parent_student_validation.sql
supabase db query --linked -f supabase/scripts/seed_coach_ops_validation.sql
```

Login: `marcus@rally-mvrhoops.demo` → **Beginner Badminton** → **Manage session**

## Operations matrix (v1.4)

| Operation | Solo coach | In app |
|-----------|------------|--------|
| Cancel session | Yes | Yes |
| Defer to next week | Yes | Yes |
| Notify parents | Yes | Yes (enrolled guardians only) |
| Duplicate session | — | Out of scope |
| Assign substitute coach | — | v1.5+ |
| Consolidate two classes | — | v1.5+ |
| Reassign enrolled students | — | v1.5+ |

## Example flows

### Defer

```text
Coach unavailable → Defer to next Monday
  [Defer to next week] [Notify parents] [Keep roster]
```

## Pass/fail checklist

- [x] Defer updates session time; roster unchanged
- [x] Cancel shows clear status on parent + coach views
- [x] Notify parents sends to guardians of **enrolled** students only
- [ ] Substitute coach sees roster only for assigned session — v1.5+
- [ ] Consolidate moves enrollments without duplicate profiles — v1.5+
- [x] Audit log for each operation
- [x] Adult pickup games unaffected (scope guard)

## Screenshots required

`docs/contracts/screenshots/flow-coach-class-operations/`

1. `01-class-ops-sheet.png`
2. `02-session-deferred-coach.png`
3. `03-parent-inbox-notification.png`
4. `04-session-cancelled-parent.png`

## Out of scope

- Substitute coach, consolidate (v1.5+)
- Automatic refunds (payments v2.0)
- Weather integration

## Related

- [flow-host-nudges.md](./flow-host-nudges.md) — adult host nudges
- [launch-roadmap-jun-2026.md](../launch-roadmap-jun-2026.md) — Founding Coach pricing
