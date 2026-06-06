# Punishment & trust (beta policy)

**Last updated:** 2026-06-04  
**Code:** `activity_game_flakes`, `game_attendance`, `get_profile_trust_stats`, `admin_set_user_suspended`, Admin dashboard

---

## What exists today (no automation bot)

| Layer | Behavior |
|-------|----------|
| **Leave before lock** | Approved player leaves → row in `activity_game_flakes` (was I'm in?, hours before start). Visible on trust line. |
| **Post-game attendance** | Host marks who attended on **Game card** (see below) → `game_attendance` → **joiner** show-up % on Profile. |
| **No-show (peer)** | Host (or anyone with Safety open) can **Record no-show** on a player profile for that game → `activity_no_shows` → `no_show_count` on trust line. |
| **Reviews** | 1–5 after real sessions (Discover trust preview). |
| **Reports** | Users report from chat/profile/game → Admin queue. |
| **Admin suspend** | `Suspend & close` — sets `is_suspended`, blocks join/create. |

---

## What we do **not** do yet (by design)

- Auto-ban from flake count alone  
- Shadow-hide listings without human review  
- Public shame feed or global leaderboard of flakes  

---

## Recommended beta playbook (manual + light product)

### Tier 0 — Signal only (now)

- Admin **Metrics** tab: DAU, games, chat, reports.  
- On reports: read trust stats in Supabase (`get_profile_trust_stats`) before acting.  
- Founder SQL in [FOUNDER_WEEK2_CHECKLIST.md](./FOUNDER_WEEK2_CHECKLIST.md).

### Tier 1 — Soft consequences (next, low eng)

| Action | When | Implementation |
|--------|------|----------------|
| **Warning copy** | 1st flake or 1 no-show | Host message template in game room (copy only) |
| **Join friction** | 2+ flakes in 30d | Show trust line “2 late exits” on Discover (already partial) |
| **Host decline** | Repeat no-show on their games | Host uses Decline + optional report (no new code) |

### Tier 2 — Platform consequences (use Admin today)

| Action | When |
|--------|------|
| **Suspend** | Harassment, scam, repeated no-shows after reports |
| **Restore** | Mistake or resolved dispute |

### Tier 3 — After v1.0 + volume (defer)

- Auto-flag users for admin queue (SQL job, not client)  
- Cooldown: cannot join public games for 7d after 3 flakes  
- Stripe / paid host tools unrelated to punishment  

---

## Post-game attendance — how it works (and why you might not see it)

### Where the host marks attendance

1. **Lock roster** on the game (Game room or Game card).
2. Wait until **game end time** has passed (start + duration).
3. Open **Game card** (modal from game room — **not** only game room chat).
4. Tap **Record who showed up** → check everyone who played → **Submit attendance**.

There is **no** attendance button in game room chat or My Games today — only on Game card after finalize + end time.

### What gets stored

- Host submits a list of **user IDs who attended** (`submit_game_attendance`).
- Anyone **not** checked is treated as **did not attend** for reliability math (no row in `game_attendance`).
- Host can include themselves via **You (host)** on the attendance screen.

### Profile “show-up rate” (joiners only)

`get_user_attendance_stats` counts:

| Term | Meaning |
|------|---------|
| **Committed** | You were **approved**, tapped **I'm in** (`ready_at`), and the game was **roster locked** (`finalized`). |
| **Attended** | Host later submitted attendance with **you checked**. |
| **Reliability %** | `attended / committed` (shows on **Profile** after ≥1 committed game). |

Until that chain happens, Profile shows: *“New player — reliability builds after locked rosters.”*

**Hosts** do not get this % from games they host — only from games where they joined as a **player** with I'm in.

### Host no-show (today)

| Who no-showed | What exists now | Gap |
|---------------|-----------------|-----|
| **Player** | Host opens player profile (game room) → **Report or block** → **Record no-show for this game** (host only). Also: host **unchecks** them on attendance. | Joiners cannot record host no-show from profile (UI is host-only). |
| **Host** | No dedicated “host no-show” in attendance. Joiners can **Report** host; no automatic reliability hit on host from `game_attendance`. | Product gap: player-reported host no-show or post-game “host didn’t show” (not built). |

**Recommended beta (manual):** If host no-shows, players **Report** in Safety; founder notes in Admin. After volume, add player → host no-show on Game card post-game.

---

## Leave game (player exit)

- **Before lock:** `leave_game` removes pending / approved / **waitlisted** join row; restores open spot if was approved; records flake if was approved.  
- **After lock:** cannot leave — coordinate in chat; host marks attendance after game.  
- **Host:** cannot leave — pass host or cancel game.

---

## One-line policy for users

> Show up when you tap **I'm in**. Leave before lock only if you must — it may count on your reliability. Hosts mark attendance after the game.

---

## Related

- [ROSTER_COMMITMENT_POLICY.md](./ROSTER_COMMITMENT_POLICY.md)  
- [vision.md](./vision.md)  
- [archive/PRE_V1_BUSINESS_AND_BUILD_PRIORITIES.md](./archive/PRE_V1_BUSINESS_AND_BUILD_PRIORITIES.md)
