# Flow — Availability poll (Rally scheduling)

**Contract id:** `flow-availability-poll`  
**Status:** Draft — backend shipped; UI validation pending  
**Phase:** 1.2  
**Screens:** Rally Chat tab, poll composer + vote UI  
**Related code:** `src/services/availabilityPollService.ts`, Rally chat panels, RPCs `create_availability_poll`, `vote_availability_poll`, `close_availability_poll`

## Purpose

Replace long "when can we play?" threads with a structured vote inside Rally chat.

North-star: **Host creates poll in Rally chat → members vote → host closes poll → winning slot visible.**

## Demo setup

1. Monrovia seed — host `marcus@rally-mvrhoops.demo`, member `@kunyu`.
2. Open `Julian Fisher Park Regulars` → Chat tab.
3. Host creates poll with 2–4 time options.

## Required states

| State | Role | Must show |
|-------|------|-----------|
| **No poll** | Any | No poll card; host can start poll |
| **Open poll** | Member | Options tappable; vote count updates |
| **Voted** | Member | Selected option highlighted; can change vote if product allows |
| **Open poll** | Host | Close poll + optional pick winner |
| **Closed poll** | Both | Winning option or final tallies; read-only |

## Pass/fail checklist

- [ ] Host can create poll with ≥2 options
- [ ] Member vote persists after refresh (`vote_availability_poll`)
- [ ] Vote counts visible to all members (realtime or refresh)
- [ ] Host can close poll; non-host cannot close
- [ ] `poll_created` and `poll_voted` events fire (see `module-analytics-events.md`)
- [ ] Poll UI does not break chat composer / keyboard
- [ ] Invalid option / network error shows user-visible message — no redbox

## Screenshots required

`docs/contracts/screenshots/flow-availability-poll/` — create, member vote, closed, error state.

## Out of scope

- Auto-create activity from winning slot (future host tool)
- Public Discover polls

## Open issues

| Date | Blocker | Owner |
|------|---------|-------|
| — | UI entry point may vary by screen — document in Validator notes | — |
