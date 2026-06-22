# Product review synthesis — 2026-06-22 · play-discover

**Queue:** `play-discover-round1` tier 1 · **Tag:** `play-discover` · **Validation queue:** `role-surface-audit`  
**Consolidator:** product-review-consolidator · **Reviews:** 6/6 complete

## Reviews included

| persona-id | date | file |
|------------|------|------|
| `play-discover-minimalist` | 2026-06-22 | [../play-discover-minimalist/2026-06-22-review.md](../play-discover-minimalist/2026-06-22-review.md) |
| `running-regular` | 2026-06-22 | [../running-regular/2026-06-22-review.md](../running-regular/2026-06-22-review.md) |
| `badminton-casual` | 2026-06-22 | [../badminton-casual/2026-06-22-review.md](../badminton-casual/2026-06-22-review.md) |
| `basketball-first-timer` | 2026-06-22 | [../basketball-first-timer/2026-06-22-review.md](../basketball-first-timer/2026-06-22-review.md) |
| `player-no-coach-tools` | 2026-06-22 | [../player-no-coach-tools/2026-06-22-review.md](../player-no-coach-tools/2026-06-22-review.md) |
| `coach-parent-dual` | 2026-06-22 | [../coach-parent-dual/2026-06-22-play-discover-review.md](../coach-parent-dual/2026-06-22-play-discover-review.md) (+ [tier 3](../coach-parent-dual/2026-06-22-review.md)) |

## Executive summary

Round 1 **play-discover** reviews confirm the **sport × Players filter fix** (no cross-sport leak when Running/Basketball selected). Remaining pain is **copy clarity**, **discover content gaps**, and **R0 Classes-segment proof** still blocked on `@kunyu` login.

**Passes:** Sport-scoped Players list · sport-specific empty copy · dual-role Classes segment + parent confirm card (Marcus) · Badminton strip one-tap.

**Open P1:** Ambiguous *"running"* in Games empty title · Players *"next few hours"* vs 10d-old posts · first-timer empty discover has no invite hint · R0 Classes segment needs fresh-account re-proof after `surfaceVisibility.ts`.

**Builder note:** B3 (Classes gate + sport filter) largely **shipped** on local branch — validation queue `role-surface-audit` is the proof step.

---

## Top pain themes (ranked)

| Rank | Theme | Personas (n) | Severity | Example |
|------|-------|--------------|----------|---------|
| 1 | **Ambiguous "running" in Games empty** — reads as active games not Running sport | 2/6 (`play-discover-minimalist`, `running-regular`) | **P1** | *"No running games nearby"* + runner icon |
| 2 | **Players section recency mismatch** — "next few hours" vs 10d-old free-agent row | 2/6 (`badminton-casual`, `play-discover-minimalist`) | **P1** | @kunyu · Badminton · 10d ago |
| 3 | **R0 Classes segment proof gap** — builder fix not sim-proven on non-coach account | 2/6 (`play-discover-minimalist`, `player-no-coach-tools`) | **P1** | Marcus shows Classes (expected); `@kunyu` password unavailable |
| 4 | **Discover empty for beta sports** — casual/first-timer can't browse into a game | 2/6 (`badminton-casual`, `basketball-first-timer`) | **P2** | No badminton/basketball open games on Play |
| 5 | **First-timer join path missing on empty Discover** | 1/6 (`basketball-first-timer`) | **P1** | No "have an invite?" CTA |
| 6 | **Off-strip sport (More → Running) not obvious** | 2/6 (`running-regular`, `play-discover-minimalist`) | **P2** | Only More ring highlighted |
| 7 | **Free-agent rows not actionable for non-host** | 1/6 (`badminton-casual`) | **P2** | Browse-only row |
| 8 | **Today Next Up → Rally chat** instead of session/I'm in | 1/6 (`basketball-first-timer`) | **P2** | Tap card opens polls |
| 9 | **Sport × Players filter fix** | 3/6 (implicit pass) | **Fixed** | Running → no Badminton rows |
| 10 | **Dual-role Play Classes** | 1/6 (`coach-parent-dual`) | **Pass** | Alex confirm card on Classes |

---

## Recommended contract changes

| Priority | Contract file | Change type | Proposed diff summary |
|----------|---------------|-------------|----------------------|
| P1 | `flow-play-screen.md` | Checklist | Games empty uses sport name (not ambiguous "running"); Players recency or honest subtitle; first-timer invite hint on empty |
| P1 | `module-role-surfaces.md` | Checklist + demo | R0 proof account = fresh signup when `@kunyu` unavailable; Marcus = Classes shown |
| P2 | `module-sport-meetup-sports.md` | Empty copy | Meetup-specific empty steps on Play (not court-only) |
| P2 | `flow-rally-session.md` | Checklist | Next Up tap → session detail / I'm in when poll closed |
| P2 | `flow-play-screen.md` | Checklist | Non-host interaction on free-agent rows (browse vs DM) |

**Contract files touched this consolidator pass:** `flow-play-screen.md`, `module-role-surfaces.md`

---

## Human decisions needed (H gates)

| ID | Question | Options |
|----|----------|---------|
| H1 | Players recency — filter old posts or change subtitle? | **A)** Hide posts >48h · **B)** Change subtitle to *"Players posting availability"* |
| H2 | First-timer empty Discover — invite CTA priority? | **A)** P1 for GTM 2 · **B)** Defer to invite-only launch |

---

## Out of scope (this cycle)

- Demo seed density (open badminton games) — ops/seed script, not contract block
- `@kunyu` test password in repo — device-only doc update
- Full `flow-rally-session` rework
