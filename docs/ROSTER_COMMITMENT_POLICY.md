# Roster commitment policy (Join · I'm in · Lock)

**Last updated:** 2026-06-03  
**Locked semantics:** [IMPLEMENT_PLAN.md](./IMPLEMENT_PLAN.md) § A3 · **Code:** `set_game_ready`, `leave_game`, `finalize_game_commitment`, `remove_from_roster`

---

## States (player view)

| Stage | Join | I'm in | Leave / Not in | Reliability |
|-------|------|--------|----------------|-------------|
| **Before lock** | Tentative roster slot | Optional commitment | **Allowed** — undo I'm in or leave roster | **No impact** until host locks |
| **After lock** | RPC blocks new approvals | Locked in | **Self-leave blocked** | Host **post-game attendance** only |

Host can still **kick / remove** only **before** lock (`remove_from_roster`).

---

## Pre-lock (shipped UX)

- **I'm in** → `set_game_ready(true)`
- **Not in** → `set_game_ready(false)` (undo I'm in; confirmation alert)
- **Leave game** → `leave_game` (drops roster; restores open spot; clears I'm in)
- Copy states clearly: **no reliability impact until lock**

This matches founder rule: *no penalty for join-only; no automatic penalty before lock.*

---

## After lock — last-minute drop-out

**Problem:** Someone committed, host locked, then they cannot play. Group may still want a replacement.

### v1 (current — intentional)

1. Player **messages host in Rally / game chat** (cannot self-leave in app).
2. Group coordinates substitute informally (WhatsApp-style norm).
3. After the session, host opens **post-game attendance** and marks **did not attend** for no-shows.
4. **Reliability v1** (`confirmed_attended / committed_sessions`) updates from attendance — not from mid-game leave button.
5. **No in-app re-open of roster** after lock (approve/waitlist RPCs reject when `match_status = finalized`).

**Why:** Avoids gaming reliability (lock → leave → no mark). Keeps beta rules in one place: **host attendance**.

### v1.1 (recommended next — still pre-punishment-module)

| Action | Who | Effect |
|--------|-----|--------|
| **Release spot** | Host only | Opens `missing_players + 1`, optional auto-promote waitlist, **no flake** for released player if host-initiated |
| **Can't make it** (notify) | Player | Sends structured message + host ack; still no self-remove until host releases |

Build as one RPC: `host_release_roster_spot(p_activity_id, p_user_id)` after lock, gated to host, audit-logged.

### v2 (after punishment / trust module)

- Time-based rules (e.g. &gt;24h before start = soft exit; &lt;2h = reliability hit unless host waives)
- Auto-promote waitlist + push (WAIT-UX-02)
- Optional **player-initiated** exit after lock with host approval

**Do not build punishment automation until** you have 30+ days of `activity_game_flakes`, attendance marks, and report data (see [PRE_V1_BUSINESS_AND_BUILD_PRIORITIES.md](./PRE_V1_BUSINESS_AND_BUILD_PRIORITIES.md)).

---

## FAQ

**Can a player re-join after leaving before lock?**  
Yes — new join / waitlist flow; kick does not block re-join (v1).

**Does leaving before lock hurt reliability?**  
No — reliability counts only **committed** sessions (I'm in + locked roster) via post-game attendance.

**Can host add players after lock?**  
Not via approve RPC today. Use chat + v1.1 host release / manual coordination.

**What if the group is still welcoming players after lock?**  
Product intent: **lock means committed court list**, not “closed forever.” For beta, treat extra players as **chat-coordinated** or wait for **host release spot** (v1.1). Do not silently auto-penalize.

**After lock — app UX (2026-06-03):**  
- Footer says **Back to chats** (not “Exit game”) — you stay on the roster; you only leave the chat screen.  
- Hint: coordinate subs in chat; attendance after the game.  
- **Guests after lock:** not built (A2) — do not auto-open roster; v1.1 **host release spot** or A2 guest invite is the right product path.
