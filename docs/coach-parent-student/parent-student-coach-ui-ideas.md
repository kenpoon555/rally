# Parent, student, and coach — UI ideas

**Date:** 2026-06-16  
**Status:** UI concept — informs contracts (not final pixel spec)  
**Safety model:** [parent-student-coach-safety-design.md](./parent-student-coach-safety-design.md)  
**Contract:** [module-coach-parent-navigation.md](../contracts/module-coach-parent-navigation.md)

---

## Short verdict

Do **not** add a big new tab for parent/student/coach.

Keep bottom nav as today:

```text
Today · Play · Inbox · Profile
```

(`Rallys` in product copy = Rally groups — hub is `RegularsCrew`, reached from Today / Inbox.)

Add coach and family features as **role-based surfaces** inside existing tabs.

```text
Same Rally app
  → normal user view by default
  → parent tools if user manages child profiles
  → coach tools if user has coach role
  → venue / academy tools later
```

---

## Where the module lives

| Tab | Use for | Weight |
|-----|---------|--------|
| **Profile** | Setup: Family section, Coach Tools section, consent, payment link | **Primary** for config |
| **Today** (+ Rally hub) | My Rallys, My Classes, classes I teach, student schedules | **Primary** for ongoing |
| **Inbox** | Announcements, cancel/defer notices, enrollment requests | Communication |
| **Play** | Discovery: Games / Players / **Classes** segment; optional next-class card | Light — no admin overload |

---

## Profile UI (sections — agreed v1)

### Parent

```text
Profile
  Family                    ← section
    Family Profiles         → list screen
    Parent Settings
    Consent / Privacy
```

Family Profiles card:

```text
Manage child/student profiles for classes.
Alex · Beginner Badminton
Mia · No active class
[Add Child Profile]
```

### Coach (role-gated section)

```text
Profile
  Coach Tools               ← section (only if coach role)
    Coach Profile
    Payment Link
    Class Templates
```

### Parent + coach

Both sections visible — do not merge identities.

---

## Today / Rallys UI

**Today tab:** optional **My Classes** block (parent) or **Coach today** card (coach) — see Play light cards.

**Rally hub (`RegularsCrew`):** class Rally uses same hub pattern; class detail adds Overview · Schedule · Roster · Chat tabs.

### Parent — My Classes (Today or hub list)

```text
Alex
  Beginner Badminton · Mon 7 PM
Mia
  No upcoming classes
```

### Coach — Classes I teach

```text
Today
  Beginner Badminton · 7 PM
  8 students · 6 confirmed
  [Roster] [Message Parents] [Cancel]
```

---

## Play UI

- **Classes** segment — sport-filtered discover (adults browse clinics).
- Optional cards only when relevant:
  - Parent: *Next class · Alex · Confirm*
  - Coach: *Coach today · 2 classes · 3 not confirmed*
- No child/class admin on main Play feed for users without context.

---

## Inbox UI

- Coach → parent announcements (not child DM).
- Class moved / cancel / confirm reminders.
- Enrollment request threads.

---

## Key flows (v1 scope)

1. Age gate at signup
2. Profile → **Family** section → Family Profiles
3. Add child profile (+ consent)
4. Join class invite → child profile picker
5. Class detail (Rally pattern)
6. Class session card variant
7. Coach roster
8. Coach announcement
9. Cancel / defer sheet

**Out of v1:** public child profiles, child chat, photos, in-app payments, academy dashboard, substitute/consolidate.

---

## Design principle

Reuse Rally patterns with safer labels:

```text
Rally        → Class Rally
Game/session → Class session
Roster       → Student roster (private)
Chat         → Parent/coach announcements
Recap        → Attendance summary
```
