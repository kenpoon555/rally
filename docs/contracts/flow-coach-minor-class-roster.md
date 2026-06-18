# Flow — Coach minor class roster

**Contract id:** `flow-coach-minor-class-roster`  
**Status:** Implemented — v1.3 pilot validated 2026-06-17  
**Screens:** Coach class view, attendance for enrolled students  
**Depends on:** `flow-student-class-enrollment`, `module-student-visibility`

**UI:** [parent-student-coach-ui-ideas.md](../coach-parent-student/parent-student-coach-ui-ideas.md) § Coach roster

## Purpose

Coach sees **only** students enrolled in their assigned classes. Mark attendance for minors. No access after enrollment ends.

North-star: **Coach opens Monday clinic → roster lists enrolled students → attendance saved → parent-visible history (H*).**

## Required states

| State | Must show |
|-------|-----------|
| **Roster groups** | Confirmed · Not responded · Can't make it |
| **Roster row** | First name/nickname only — no DOB, address, photos |
| **Actions** | Message Parents · Nudge not responded · Mark attendance |
| **From hub** | Class detail **Roster** tab or Coach today card |
| **Empty** | No students — prompt to share parent invite |
| **Attendance** | Per-session present/absent; coach-only write |
| **Ended enrollment** | Student drops off roster for coach |
| **Substitute coach** | Temporary roster access for one session (v1.4+) |
| **No public export** | Roster not shareable to non-class viewers |

## Pass/fail checklist

- [x] Roster row shows nickname/first name only — no photos ([module-student-visibility.md](./module-student-visibility.md) pilot defaults)
- [x] Coach cannot see students not enrolled in their class
- [x] Coach cannot see student profiles from other coaches' classes
- [ ] Attendance save persists; parent can view (H* — parent UI contract TBD)
- [x] No student roster on public game card / Discover
- [ ] Audit log: attendance marked, roster viewed
- [ ] Report/remove enrollment works

## Demo setup

```bash
supabase db query --linked -f supabase/scripts/seed_parent_student_validation.sql
```

Log in as `marcus@rally-mvrhoops.demo`, open **Beginner Badminton** → **Roster** tab for grouped roster validation.

## Screenshots required

`docs/contracts/screenshots/flow-coach-minor-class-roster/`

1. `01-coach-roster-enrolled.png` — all three groups (Confirmed / Not responded / Can't make it)
2. `02-attendance-marked.png`
3. `03-empty-invite-cta.png`
4. `04-no-child-dm.png` — Chat tab shows announcements only

## Human decision gates (H*)

| ID | Question | Decision |
|----|----------|----------|
| H1 | Parent sees attendance in app v1.3 or email only? | TBD |
| H2 | Show parent contact on coach roster? | TBD — default **no** in pilot |
| — | Roster name/photo display | See [module-student-visibility.md](./module-student-visibility.md) H1/H2 |

## Out of scope

- Public leaderboard with minor names
- In-app parent–coach DM thread (announcements only v1.3)

## Related

- [flow-post-game-attendance.md](./flow-post-game-attendance.md) — adult game attendance (separate flow)
