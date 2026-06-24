# Product review — multi-sport-power-host · tier 3 · 2026-06-22

## Persona

**Sport:** Multi-sport · **Level:** L5 power host  
**Goal:** Switch between 4+ sports daily without reopening More every time — strip should remember my crews' sports.  
**Contracts:** [flow-play-screen.md](../../contracts/flow-play-screen.md)  
**Queue:** `play-discover-round3-ux` tier 3 · **Rubric:** user personalization (not matrix QA)

## Setup

| Item | Value |
|------|-------|
| Device | iPhone 16 sim `06244EDD-C6DC-4A80-92A2-ADC1D73B9382` |
| Account | `@kunyu` (logged in) |
| Journey | More → Racquetball → More → Running → More → Soccer (sequential off-strip picks) |

## Journey — power-host strip stress test

| Step | Strip after pick | Expected (L5) | Actual |
|------|------------------|-----------------|--------|
| Start (Badminton) | PB · BB · **Badminton** · More | Badminton prominent if primary | Slot 3 only; PB/BB fixed |
| More → Racquetball | PB · BB · **Racquetball** · More | Racquetball + Badminton both visible | **Badminton evicted** |
| More → Running | PB · BB · **Running** · More | Running + Racquetball + Badminton on strip | **Only Running in slot 3** |
| More → Soccer | PB · BB · **Soccer** · More | 4–5 recent sports visible | **Running evicted**; still 3+More |

**AX proof:** After Running pick, accessibility tree shows `Pickleball filter`, `Basketball filter`, `Running filter`, `More` — never more than one off-strip sport at a time.

## What worked

- Each pick **does** filter list/empty copy correctly (Running → *meet point* steps; Soccer → court steps).
- B7: active off-strip sport has its own chip (not More-only highlight).
- Filter persists via `preferred_sports` on profile sync.

## Friction (prioritized — user lens)

| P | Screen | Issue | User impact | Suggested change | Backlog |
|---|--------|-------|-------------|------------------|---------|
| **P0** | Play strip | **One eviction slot** — power host with badminton + running + soccer crews must reopen More constantly | Feels like a catalog browser, not a command center | MRU strip: keep last 4–5 sports visible | B16, B17 |
| **P0** | Play strip | Slots 1–2 **never change** (Pickleball, Basketball) | Host's actual sports buried behind LA defaults | `orderSportsAttended` + profile sports on strip | B16 |
| **P1** | More sheet | Flat 12-sport grid — no **Recent** for power user | Extra scroll every context switch | Recent section at top | B19 |
| **P1** | Inbox / multi-Rally | Not re-tested this pass (Play-only tier 3) | — | — | pickup carry |
| **P2** | Create Game | Same 3+swap pattern as Play | Inconsistent when hosting alternate sport | Shared strip builder | B20 |

## Sport-specific

- `@kunyu` profile card lists Pickleball, Basketball, Badminton played — strip should mirror that ordering, not global `PLAY_TAB_SPORT_ORDER` head.

## Screenshots

| File | Capture |
|------|---------|
| `2026-06-22/01-tier3-more-sheet.png` | All sports sheet |
| `2026-06-22/03-tier3-running-evicts-prior.png` | PB · BB · Running — Badminton/Racquetball gone |
| `2026-06-22/05-tier3-soccer-evicts-running.png` | PB · BB · Soccer — Running evicted |

## Recommended contract changes

- [ ] `flow-play-screen`: Fail if 3+ off-strip picks in one session do not all remain visible on strip (tier 3).
- [ ] Document power-host journey in validation queue.

## Verdict

**Tier 3 UX personalization: FAIL** — functional filters, strip not built for multi-sport power hosts. Blocks tier 3 close until B16–B17.
