# Flow — Create game

**Contract id:** `flow-create-game`  
**Status:** Draft — sprint prep  
**Screens:** `CreateActivityScreen`  
**Related code:** `src/pages/Activity/CreateActivityScreen.tsx`, `src/services/activityService.ts`, `src/services/inviteLinkService.ts`

## Purpose

Host creates a pickup or Rally session with valid schedule, court, roster size, and shareable host invite on success.

North-star: **Host completes form → game exists → host invite share works (Loop A game path).**

## Demo setup

1. Log in as `marcus@rally-mvrhoops.demo`.
2. Navigate: Host tab or Rally hub → Create game.
3. Use Monrovia demo court when testing basketball.

## Required states

| State | How to reach | Must show |
|-------|--------------|-----------|
| **Empty form** | Open create | Sport, time, court pickers; no crash |
| **Validation errors** | Submit incomplete | Inline or alert errors — no silent fail |
| **Pickup create success** | Public pickup flow | Lands on detail or share prompt |
| **Rally session create** | From RegularsCrew | Tied to `regular_group_id`; appears on Play tab |
| **Share after create** | Post-create CTA | Host invite URL via `shareGameInvite(..., { asHost: true })` |

## Pass/fail checklist

- [ ] Schedule picker respects timezone / duration
- [ ] Court search returns seeded locations
- [ ] Roster min/max saved correctly
- [ ] Created activity has `invite_token`
- [ ] Share sheet message uses `inviteLinkService` (no inline URLs)
- [ ] Android keyboard does not hide primary CTA

## Screenshots required

`docs/contracts/screenshots/flow-create-game/` — form, validation, success, share sheet.

## Out of scope

- Recurring series / season templates
- Payment collection

## Open issues

| Date | Blocker | Owner |
|------|---------|-------|
| — | Not validated yet | — |
