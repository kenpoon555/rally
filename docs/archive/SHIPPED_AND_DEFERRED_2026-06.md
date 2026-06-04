# Shipped & deferred — frozen snapshot (2026-06)

**Purpose:** Archive completed Track A / advisor items so active planning lives in one place: [PRODUCT_DIRECTION.md](../PRODUCT_DIRECTION.md).

Do not add new work here — append to ROADMAP or FOUNDER_WEEK2_CHECKLIST instead.

---

## Shipped (engineering — Track A + Week 2)

### Product / copy
- A1 Rallys → **Rallies** naming (`productCopy.ts`)
- Glossary sheet (Join, I'm in, Lock roster)
- LA beta banner → Profile; sports include basketball
- Tab nav: **Today · Play · Inbox · You**
- Friends UX: search, profile tap, row → chat / avatar → profile
- Play: removed “Join nearest”; browse-first Discover
- Inbox: Games · Rallies · Friends; archived game rooms drop after 48h; My Games → Past → activity archived chat

### Core loop
- Dynamic Home (Next Up, host lock CTA, needs I'm in, Your Rallies)
- Join → I'm in → lock roster; undo I'm in + leave before lock
- Post-game attendance + reliability v1 on Profile
- Waitlist UX (join waitlist, badges, sections)
- Session `session_note`; host transfer + exit game room
- Beta feedback module + admin list
- Host schedule next game from Rally chat / crew profile
- Legacy `activity_group` hide for Rally games (migration 032)
- Migrations **030 / 031 / 032 / 033** on preview Supabase

### Stage 1 (listing + reviews)
- Migration **034** `listing_title`, `play_intent` on activities
- Host create: listing title, intent chips, session note on publish
- Discover `GameCard`: headline, intent badge, session + cost notes
- Reviews: hide form after submit; section gone when all targets rated

### UX polish (local / preview)
- `ScreenHeader` safe area
- Sport badges on cards
- Friend search fix (`userService.searchUsers`)

---

## Shipped (checklist IDs — advisor plan)

| ID | Item |
|----|------|
| A1 | Rally / Rallies naming |
| A3 (partial) | I'm in, lock, post-lock chat policy |
| A4 | Session note |
| A5 | Attendance + reliability |
| B1–B3 | Rally copy, Home cards |
| HOME-01–03 | Dynamic Home |
| WAIT-UX-01 | Waitlist UX |
| FRIENDS-UX-01 | Add friends entry points |
| FEEDBACK-01 | Beta feedback |

---

## Deferred (explicit — do not file as bugs)

| ID | What | Gate |
|----|------|------|
| A2 Phase 3 | Guest invite, `is_guest`, inbox | After member loop QA + replay |
| A3-2 | Roster confirmation push | Optional v1 |
| A6-3 | Merge legacy chat into crew | Risky |
| A6-4 | Drop `activity_rsvps` | Post-analytics |
| A7 | Public game = ephemeral Rally | ADR deferred |
| DISC-01 | Discover filter polish | Post-QA |
| CREW-01 | Rally profile reliability all members | Partial |
| TOUR-01 | Mini tournament polish | After replay |
| Rallys multi-sport | One group, many sports | P2 deferred |
| Full Teams / Leagues | Stage 6–7 | `analytics_crew_lifecycle.retained` |
| Payments / Stripe | Organizer Pro | Retention + WTP |
| Public feed / global stories | — | [PRODUCT_DIRECTION.md](../PRODUCT_DIRECTION.md) |
| Group calls / unlimited media | — | VISION defer |
| Multi-city floodgate | — | LA density first |

---

## Open (ops — as of archive date)

- P0 collective QA on preview (two devices)
- P0 EAS preview rebuild for testers
- Query `analytics_crew_lifecycle.retained`
- Recruit 5–10 LA hosts
- Pick **one** P2: Guests **or** Discover polish

See [FOUNDER_WEEK2_CHECKLIST.md](../FOUNDER_WEEK2_CHECKLIST.md).
