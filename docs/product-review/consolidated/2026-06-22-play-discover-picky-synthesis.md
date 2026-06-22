# Product review synthesis — 2026-06-22 · play-discover-picky

**Queue:** `play-discover-round2-picky` tier 2 · **Tag:** `play-discover-picky` · **Validation queue:** `role-surface-audit`  
**Consolidator:** product-review-consolidator · **Reviews:** 4/4 complete

## Reviews included

| persona-id | date | file |
|------------|------|------|
| `play-sport-matrix-auditor` | 2026-06-22 | [../play-sport-matrix-auditor/2026-06-22-review.md](../play-sport-matrix-auditor/2026-06-22-review.md) |
| `play-discover-minimalist` | 2026-06-22 | [../play-discover-minimalist/2026-06-22-tier2-review.md](../play-discover-minimalist/2026-06-22-tier2-review.md) |
| `teen-restricted-account` | 2026-06-22 | [../teen-restricted-account/2026-06-22-tier2-review.md](../teen-restricted-account/2026-06-22-tier2-review.md) |
| `pickleball-first-timer` | 2026-06-22 | [../pickleball-first-timer/2026-06-22-tier2-review.md](../pickleball-first-timer/2026-06-22-tier2-review.md) |

## Executive summary

Tier 2 **picky** re-proof after B7 (off-strip sport in strip slot 3) and B11 (empty-state hero icon) on `fix/play-discover-tier2-ux`. **No P0/P1 Play regressions** — sport × segment matrix holds for Basketball, Running, Badminton, Racquetball on R0; teen and minimalist confirm **Games \| Players** only.

**Carry-forward (upstream):** Invite deep-link P0 from tier 1 (`pickleball-first-timer`) — blocks persona north-star but not a Play Discover regression.

**Residual friction:** P2/P3 copy (Players empty sport capitalization, stale free-agent timestamps, *Morning pickup run* host title on basketball card, invite hint prominence).

**Builder:** B7/B11 **shipped** — `play-discover-matrix` validation green 2026-06-22. No new P0/P1 builder items this round.

---

## Top pain themes (ranked)

| Rank | Theme | Personas (n) | Severity | Example |
|------|-------|--------------|----------|---------|
| 1 | **Invite path P0 (carry tier 1)** | 1/4 (`pickleball-first-timer`) | **P0 upstream** | SMS invite silent no-op before login |
| 2 | **B7/B11 tier-2 fixes verified** | 4/4 | **Pass** | Racquetball/Running in slot 3; centered empty glyph |
| 3 | **R0 Classes gate closed** | 2/4 (`play-discover-minimalist`, matrix on R0) | **Pass** | `@playerr0pd1782160073` — Games \| Players only |
| 4 | **Players empty copy parity** | 2/4 (`play-discover-minimalist`, `teen-restricted-account`) | **P3** | *No **running** players* vs *Running meetups* |
| 5 | **Stale free-agent timestamps** | 2/4 (`play-sport-matrix-auditor`, `play-discover-minimalist`) | **P2** | `@kunyu · 10d ago` on casual browse |
| 6 | **First-timer invite hint placement** | 1/4 (`pickleball-first-timer`) | **P2** | Hint below Host CTA — retiree may miss |
| 7 | **Host title vs sport** | 1/4 (`play-sport-matrix-auditor`) | **P2** | *Morning pickup run* on basketball card |
| 8 | **Sport picker a11y** | 1/4 (`play-sport-matrix-auditor`) | **P3** | More sheet grid not in AX tree |

---

## Recommended contract changes

| Priority | Contract file | Change type | Proposed diff summary |
|----------|---------------|-------------|----------------------|
| P3 | `flow-play-screen.md` | Checklist note | Players empty title capitalize `{Sport}` like Games meetup title |
| P2 | `flow-play-screen.md` | Checklist (optional) | First-timer empty — invite hint equal weight to Host CTA |
| P2 | `flow-play-screen.md` | Checklist (optional) | Free-agent recency — hide or soften stale posts |
| — | `module-role-surfaces.md` | Demo note | Document R0 matrix account `@playerr0pd1782160073` |

**No mandatory contract diff** — tier 2 picky confirms round 1 + B7/B11 acceptance.

---

## Human decisions needed (H gates)

| ID | Question | Options |
|----|----------|---------|
| H1 | Invite P0 — fix in play-discover round or upstream invite loop? | **A)** Track in `flow-invite-to-rally` only · **B)** Duplicate row in `flow-play-screen` |
| H2 | Players empty capitalization — ship copy fix? | **A)** P3 defer · **B)** Quick copy pass in next builder |

---

## Out of scope (this cycle)

- Re-validating B3/B4 coach gates (onboarding queue)
- Fresh teen signup E2E (legal consent P0 — onboarding)
- Demo seed density (B10 open badminton game — ops)
