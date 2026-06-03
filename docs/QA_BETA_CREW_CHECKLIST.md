# Beta QA checklist (advisor §8)

**When:** Phase 1–2 on **preview** DB with migrations `030` + `031` applied.  
**Track progress:** check boxes here; file bugs against `ADVISOR_IMPLEMENTATION_PLAN.md` task IDs.

## P0 — Crew loop + Discover + DB

### §8.6 Join / I'm in / Lock roster (QA-06)

- [ ] Member joins Rally session (`join_crew_game`)
- [ ] Capacity count correct
- [ ] Member taps **I'm in**; `ready_at` persists after refresh
- [ ] Host **Lock roster**; non-host cannot lock
- [ ] Locked state visible on detail + session card
- [ ] Full session blocks join or shows waitlist (if WAIT-01 shipped)

### §8.7 Multi-session same Rally (QA-07)

- [ ] Host schedules two future sessions
- [ ] Both in same Rally chat; one inbox row
- [ ] Home Next Up picks correct session
- [ ] Session actions scoped to correct activity
- [ ] Rally pin does not bleed to wrong session (§8.8)

### §8.3 Discover one-off unchanged (QA-03)

- [ ] Create public game → appears on Discover
- [ ] Join **request** → host approve (not direct crew join)
- [ ] Per-game chat (`activity_group`) opens
- [ ] Lock roster on public game still works

### §8.13 Database / RLS (QA-08)

- [ ] Migrations through `031` on preview
- [ ] `ensure_crew_conversation` for member
- [ ] `schedule_group_next_game` links crew thread
- [ ] `join_crew_game` enforces capacity
- [ ] Non-member cannot read private Rally chat

## P1 — Rally lifecycle + Home

### §8.4 Rally creation (QA-04)

- [ ] Save as Rally from game; invite link works
- [ ] One `crew_group` conversation created

### §8.5 Schedule session (QA-05)

- [ ] Schedule next from Rally; session card in chat
- [ ] No duplicate conversation row

### §8.1 Auth (QA-01)

- [ ] Login / logout / signup
- [ ] Sport preference onboarding

### §8.2 Dynamic Home (QA-02)

- [ ] Explorer empty → Discover / Host CTAs
- [ ] Next Up card routes correctly

## P2 — Inbox, push, admin, runtime

### §8.9 Inbox (QA-09)

- [ ] Rally row once per group; public game row separate
- [ ] Preview text + unread

### §8.8 Announcements (QA-08 / A4-4)

- [ ] Host sets Rally pin; members see it
- [ ] Session note on card (when A4 shipped)

### §8.10 Push (PUSH-01)

- [ ] Physical device: join approved, chat message, tap opens screen

### §8.11 Admin (QA-10)

- [ ] Report user; admin suspend

### §8.12 Runtime (QA-11 / IOS-01)

- [ ] Android emulator + device install
- [ ] iOS clean build per `current-setup-app-guide.md` §12

---

**Sign-off:** __________ Date: __________
