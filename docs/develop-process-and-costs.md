# Develop process, branching & monthly costs

**Last updated:** 2026-06-15  
**Index:** [DOCS-INDEX.md](./DOCS-INDEX.md) · [agent-development-layers.md](./agent-development-layers.md)

Single reference for how we build, branch, validate, ship, and what it costs at current scale.

---

## Validation progress (Layer 3)

| Queue | Contracts | Status |
|-------|-----------|--------|
| **baseline** | invite, session, hub, inbox, play-screen | ✅ Done |
| **phase1a** | attendance, host-nudges, analytics | ✅ Done |
| **phase1b** | availability-poll | ✅ Done |
| **phase1c** | rotation, mini-tournament, leaderboard | 🔄 In progress / next |
| **phase2** | post-game-recap, game-card venue | ⬜ After 1c |
| **ops** | crew-dormancy-nudge | ⬜ Not built |

After **phase1c** green → optional **Layer 1 product review** (personas → consolidator) before big contract changes for v1.1 store build.

```bash
./.cursor/hooks/validation-loop-start.sh --queue phase1c --builder
```

---

## Four layers (how work flows)

```
Product review → Contract PR → Validate (queue) → Promote branches → EAS / stores
   Layer 1          Layer 2        Layer 3            Layer 4
```

| Layer | Human gate | Agent/automation |
|-------|------------|------------------|
| 1 Product review | Approve synthesis | Persona + consolidator skills |
| 2 Contract | Merge docs PR to `dev` | write-contract skill |
| 3 Proof | `continue.sh` if chain stalls | validation-loop-start + self-chain |
| 4 Ship | PR merge to production | GitHub Actions + EAS |

**Rule:** Feature code merges to `dev` only after contract exists; production only after affected contracts green.

---

## Branching strategy

```text
feature/*  →  PR  →  dev          (daily work + contract validation)
dev        →  PR  →  preview      (integration; manual preview EAS when needed)
preview    →  PR  →  main         (CI only — npm verify)
main       →  PR  →  production   (production EAS build + auto-submit TestFlight / Play internal)
```

| Branch | CI | EAS build | Supabase |
|--------|-----|-----------|----------|
| `dev` | PR checks if configured | Local sim / dev client | Linked preview project (`casljueycxsqexpkdiuq`) |
| `preview` | PR → `ci.yml` | **Manual** — Actions → Deploy preview | Same linked project |
| `main` | Push + PR | None | Same |
| `production` | `deploy-production.yml` | **Auto** on merge | Production EAS env vars |

**Supabase branching (optional, ~$25/mo Pro):** ephemeral DB per git branch for safe migrations — use when migration risk is high; not required at 50 MAU on single preview DB.

Workflow: [.cursor/workflows/promote-branch.md](../.cursor/workflows/promote-branch.md)

### Typical release (after 1c validated on `dev`)

1. Merge contract/docs + code PRs → `dev`
2. `gh pr create --base preview --head dev` → merge when CI green
3. **Optional:** Actions → **Deploy preview (EAS)** — iOS/Android for testers
4. `preview` → `main` → `production` when ready for TestFlight / Play

Loop A + B should re-validate on every `dev → preview` PR.

---

## Agent / validation setup — known issues

| Issue | Impact | Mitigation |
|-------|--------|------------|
| **Self-chain stalls** | Agent ends turn; you run `continue.sh` per contract | One-liner: `Run ./.cursor/hooks/validation-loop-continue.sh and self-chain` |
| **Cursor stop hook unreliable** | Fixer/Validator not auto-sent | `validation-chain-next.py` + `.validation-next.md` (backup) |
| **Sim automation flakes** | False fails on lock/attendance taps | Free Validator retry for sim-only rows; testIDs on buttons |
| **Long Agent context** | Slower / forgets rules | Fresh chat per **queue** (baseline, 1a, 1b, 1c) — OK |
| **Agent asks you to seed** | Wasted turns | Rules: Validator runs `supabase db query --linked -f …` itself |

**Not a blocker for shipping** — manual `continue.sh` is acceptable overhead (~1 tap per contract).

---

## Monthly cost estimate (~50 MAU, solo founder)

| Service | Typical cost | Notes |
|---------|--------------|--------|
| **Domain** | ~**$1/mo** ($10/yr) | Your domain |
| **Supabase** | **$0** | Free tier on linked preview; **$25/mo** if you need Pro branching or exceed limits |
| **Expo EAS** | **$0–19/mo** | Free tier + **manual preview builds** to save credits; Starter ~$19 if you build often |
| **GitHub Actions** | **$0** | `npm run verify` only — within free minutes for private repo |
| **Google Cloud (Maps/Places)** | **$0** | Quotas + $200/mo Maps credit; see [google-cloud-budget.md](./google-cloud-budget.md) |
| **Firebase (FCM push)** | **$0** | Free at this scale |
| **Apple Developer** | **~$8/mo** amortized | **$99/year** — required for App Store / TestFlight |
| **Google Play Console** | **~$2/mo** amortized | **$25 one-time** — already paid |
| **Cursor / agents** | **$0–20/mo** | Your plan; validation burns tokens during sprints |
| **App Store / Play listing** | **$0** | No per-MAU store fee |

### Totals

| Scenario | ~Monthly |
|----------|----------|
| **Lean (current)** — free Supabase, manual EAS, domain | **~$10–15/mo** + Cursor if paid |
| **Pro dev** — Supabase Pro + EAS Starter | **~$45–55/mo** |
| **At 200 MAU** | Add **~$0–10/mo** variable (Supabase egress, slightly more push) |

**Per-MAU infra (excluding Apple):** roughly **$0.01–0.05/MAU** at small scale.

### Cost controls already in place

- Preview EAS: **workflow_dispatch only** (not every merge)
- PR CI: tests/lint only — no cloud build
- Places: daily quotas + in-app limiter + seeded courts
- Production EAS: only on `production` merge

---

## New features (phase 1c + beyond)

| Feature | Contract | Build status | Validate with |
|---------|----------|--------------|---------------|
| Rotation / pairing | `flow-rotation-pairing` | Backend + partial UI | phase1c |
| Mini tournament | `flow-mini-tournament` | Partial | phase1c |
| Leaderboard | `module-rally-leaderboard` | Partial | phase1c |
| Post-game recap | `flow-post-game-recap` | Partial | phase2 (after 1c) |
| Venue block on card | `module-game-card` | Partial | phase2 |
| Crew dormancy nudge | `flow-crew-dormancy-nudge` | **Not built** | ops — needs cron/edge |

Index: [post-v1-roadmap-contracts.md](./post-v1-roadmap-contracts.md)

---

## What to do after phase1c

1. **Validate phase2** (or add to `validation-queues.json`):
   ```bash
   ./.cursor/hooks/validation-loop-start.sh --queue phase2 --builder
   ```
2. **Layer 1 product review** — 6 personas → consolidator → contract PRs for v1.1 polish
3. **Merge `docs/post-v1-contracts` PR** to `dev` if not merged (contracts + hooks + this doc)
4. **Promote** `dev → preview` when ready for tester build
5. **Store:** waiting on Apple public review; Google closed testing — no extra infra cost

---

## Quick commands

```bash
# Validate
./.cursor/hooks/validation-loop-start.sh --queue phase1c --builder
./.cursor/hooks/validation-loop-continue.sh

# Ship
npm run verify
gh pr create --base preview --head dev

# Preview build (manual, saves EAS credits)
# GitHub → Actions → Deploy preview (EAS)

# Production
gh pr create --base production --head main
```
