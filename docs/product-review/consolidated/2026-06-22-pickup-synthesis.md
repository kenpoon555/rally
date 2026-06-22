# Product review synthesis — 2026-06-22 · pickup

**Queue:** `pickup-round1` tier 1 · **Tag:** `pickup` · **Validation queue:** `gtm2-feedback-jun-2026`  
**Consolidator:** product-review-consolidator · **Reviews:** 6/6 complete

## Reviews included

| persona-id | file |
|------------|------|
| `basketball-first-timer` | [../basketball-first-timer/2026-06-22-review.md](../basketball-first-timer/2026-06-22-review.md) |
| `badminton-casual` | [../badminton-casual/2026-06-22-review.md](../badminton-casual/2026-06-22-review.md) |
| `badminton-host` | [../badminton-host/2026-06-22-review.md](../badminton-host/2026-06-22-review.md) |
| `pickleball-first-timer` | [../pickleball-first-timer/2026-06-22-review.md](../pickleball-first-timer/2026-06-22-review.md) |
| `volleyball-host` | [../volleyball-host/2026-06-22-review.md](../volleyball-host/2026-06-22-review.md) |
| `multi-sport-power-host` | [../multi-sport-power-host/2026-06-22-review.md](../multi-sport-power-host/2026-06-22-review.md) |

## Executive summary

Tier 1 pickup confirms **logged-in Discover + join** works for Marcus demo paths, but **invite deep links are the P0 blocker** for all L1 first-timers and power hosts recruiting via link.

**P0:** `rallyapp://group-invite/` and `rallyapp://invite/` reach native iOS but **JS handler silent no-op** — no navigation, no error (6/6 personas cite or depend on fix).

**P0/P1:** **iOS create schedule spinner** — wheels roll but date/time not visible (host personas).

**Passes:** Play sport filter, GameCardShell discover, host share after manual create, Inbox/Rally hub for seeded Marcus.

---

## Top pain themes (ranked)

| Rank | Theme | Personas (n) | Severity |
|------|-------|--------------|----------|
| 1 | Deep link invite silent no-op | 6/6 | **P0** |
| 2 | iOS create schedule picker visibility | 2/6 hosts | **P0** |
| 3 | Signed-out invite lacks explicit auth CTA | 2/6 L1 | **P1** |
| 4 | First-timer jargon (Rally vs game) | 2/6 | **P2** |
| 5 | Empty Discover sport-specific copy | 1/6 | **P2** |

## Recommended contract changes

| Priority | Contract | Change |
|----------|----------|--------|
| P0 | `flow-invite-to-rally.md` | Escalate deep-link JS routing to ship blocker; add ready-retry checklist |
| P0 | `flow-create-game.md` | iOS schedule spinner visible — P0 for host personas |
| P1 | `flow-invite-to-rally.md` | Signed-out invite → Sign in required alert |
| P2 | `flow-play-screen.md` | First-timer empty / invite helper copy |

## Builder backlog

See [2026-06-22-pickup-builder-backlog.md](./2026-06-22-pickup-builder-backlog.md)

## Validation handoff

See [2026-06-22-pickup-validation-handoff.md](./2026-06-22-pickup-validation-handoff.md)
