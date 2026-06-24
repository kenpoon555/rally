# Product review synthesis — 2026-06-22 · play-discover-ux

**Queue:** `play-discover-round3-ux` tier 3 · **Tag:** `play-discover-ux` · **Validation queue:** `play-discover-matrix`  
**Consolidator:** product-review-consolidator · **Reviews:** 4/4 complete

## Reviews included

| persona-id | date | file |
|------------|------|------|
| `play-ux-personalization-auditor` | 2026-06-22 | [../play-ux-personalization-auditor/2026-06-22-review.md](../play-ux-personalization-auditor/2026-06-22-review.md) |
| `multi-sport-power-host` | 2026-06-22 | [../multi-sport-power-host/2026-06-22-tier3-review.md](../multi-sport-power-host/2026-06-22-tier3-review.md) |
| `badminton-casual` | 2026-06-22 | [../badminton-casual/2026-06-22-tier3-review.md](../badminton-casual/2026-06-22-tier3-review.md) |
| `play-discover-minimalist` | 2026-06-22 | [../play-discover-minimalist/2026-06-22-tier3-review.md](../play-discover-minimalist/2026-06-22-tier3-review.md) |

## Executive summary

**Unanimous tier 3 FAIL on strip personalization** — 4/4 personas. Tier 2 matrix (cross-sport, B7 slot-3 visibility) still holds; **no segment regressions** on minimalist R0 check.

**Root cause:** B7 fixed *visibility* (off-strip sport in slot 3) but strip source remains global `PLAY_TAB_SPORT_ORDER` head + single eviction slot. `@kunyu` profile shows sports played; Play strip ignores MRU and attendance.

**Builder required:** B16–B18 (P0/P1) before closing `play-discover-jun-2026` UX loop. B19–B20 P2 same release if cheap.

---

## Top pain themes (ranked)

| Rank | Theme | Personas (n) | Severity | Example |
|------|-------|--------------|----------|---------|
| 1 | **Strip not personalized** — slots 1–2 always PB/BB | 4/4 | **P0** | Badminton selected; PB/BB still first |
| 2 | **One eviction slot** — prior off-strip picks vanish | 3/4 | **P0** | Running → Soccer evicts Running |
| 3 | **Hard cap 3+More** — no strip growth | 4/4 | **P1** | Power host needs 4–5 recent sports |
| 4 | **Profile vs Play mismatch** | 3/4 | **P1** | `@kunyu` card lists sports; strip doesn't |
| 5 | **More sheet flat grid** — no Recent | 2/4 | **P2** | minimalist + power host |
| 6 | **Free-agent recency subtitle** | 1/4 | **P2** | badminton-casual carry |
| 7 | **R0 segment gate** | 1/4 | **Pass** | minimalist — Games \| Players only |

---

## Recommended contract changes

| Priority | Contract file | Change type | Proposed diff summary |
|----------|---------------|-------------|----------------------|
| P0 | `flow-play-screen.md` | Replace B7-only strip spec | Personalized strip: MRU + attended; max 5 visible; More overflow |
| P0 | `flow-play-screen.md` | New checklist rows | 3+ More picks stay on strip; `personalized-strip-after-mru.png` |
| P1 | `flow-play-screen.md` | MRU persistence | `preferred_sports` stores up to 5 MRU names |
| P2 | `flow-play-screen.md` | More sheet | Recent section (defer B19) |

---

## Builder backlog (Layer 2)

See [2026-06-22-play-discover-ux-builder-backlog.md](./2026-06-22-play-discover-ux-builder-backlog.md) — **B16 P0**, B17–B18 P1, B19–B20 P2.

**Branch:** `fix/play-discover-ux-strip`

---

## Validation handoff (Layer 3)

| Order | Contract id | Why |
|-------|-------------|-----|
| 1 | `flow-play-screen` | B16–B18 strip + MRU |
| 2 | `module-sport-icon` | Regression on empty hero |

**Start:** `./.cursor/hooks/validation-loop-start.sh --queue play-discover-matrix --from flow-play-screen --builder`

---

## Human decisions needed (H gates)

| ID | Question | Options |
|----|----------|---------|
| H1 | New user with zero history — default strip size? | **A)** 5 catalog sports · **B)** 3 until first More pick |
| H2 | B19 Recent in More sheet — same release? | **A)** Defer · **B)** Ship with B16 |

**Recommendation:** H1=A, H2=A (defer B19).

---

## Out of scope

- Invite deep-link P0 (`flow-invite-to-rally`)
- Coach/parent v1.1 Classes segment
- App Store device recording queue
