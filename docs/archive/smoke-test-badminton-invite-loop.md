# Smoke test: badminton invite + recurring loop (two devices)

Last updated: 2026-06-01

~20 minutes. Validates Stage 3 + 3.5b for a friend-group wedge (not Discover strangers).

## Preconditions

- Two **physical** phones (or one phone + one simulator) on preview/EAS build or dev client.
- Supabase courts seeded: `node scripts/seed-la-badminton-courts.mjs`
- Accounts: **Host (A)**, **Guest (B)** (+ optional C, D for roster).

## Host (A)

| Step | Action | Expected |
|------|--------|----------|
| 1 | Profile → set default sport **Badminton** | Discover filter shows Badminton |
| 2 | Discover → **Create Game** → pick seeded badminton court → publish | Activity detail opens |
| 3 | Approve B’s join request (or share invite link first — step 5) | B in roster |
| 4 | **Mark Ready** (B too) → **Finalize roster** | Status Finalized |
| 5 | **Share invite link** → send to B via Messages | Link `rallyapp://invite/...` |
| 6 | **Make weekly recurring** | “Part of a weekly recurring series” on detail |
| 7 | **Schedule next game** | New invite-only activity ~1 week out; B auto on roster |

## Guest (B)

| Step | Action | Expected |
|------|--------|----------|
| 1 | Tap invite link (or open app logged in) | Joins game; lands on activity detail |
| 2 | **My Games → Upcoming** | Game listed |
| 3 | Chats → game row → **Game Room** | Chat works |
| 4 | RSVP → **Going** | Count updates for host |
| 5 | After play window | Post-game chat open 72h; then read-only |

## Pass criteria

- [ ] Invite link joins without Discover
- [ ] Second occurrence created with same roster
- [ ] RSVP visible to host
- [ ] Push or in-app alert on join (physical device only for push)

Record results in `docs/phase-3-validation-results.md`.
