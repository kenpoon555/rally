# Rally docs index

**Start here.** 122 files in `docs/` — you only need a few. Agents search this file by topic.

**Human read (15 min total):**

| Read | When |
|------|------|
| [launch-roadmap-jun-2026.md](./launch-roadmap-jun-2026.md) | **Start here** — store review, beta groups, P0/P1/P2, monetization gates |
| [coach-parent-student/README.md](./coach-parent-student/README.md) | Parent/student/coach safety — **separate track** v1.2+ |
| [develop-process-and-costs.md](./develop-process-and-costs.md) | Branching, costs, validation progress, known agent issues |
| [agent-development-layers.md](./agent-development-layers.md) | Once — how everything fits |
| [contracts/VALIDATION-RUNBOOK.md](./contracts/VALIDATION-RUNBOOK.md) | When validating — one line per contract |
| [post-v1-roadmap-contracts.md](./post-v1-roadmap-contracts.md) | Contract index + GTM gates |
| [store-review-test-accounts.md](./store-review-test-accounts.md) | Demo login for sim |

Everything else: look up by topic below (or tell Agent: *"read DOCS-INDEX topic Layer 3"*).

---

## How workflows run (not automatic)

| Thing | Runs by itself? |
|-------|-----------------|
| **Validation hook** (`contract-validation-chain.py`) | **Yes** — after each Agent turn, if `.validation-session.json` has `chain_enabled` |
| **Workflows** (`.cursor/workflows/*.md`) | **No** — Agent **reads** them when you ask or when `rally-workflows.mdc` points there |
| **Skills** (`.cursor/skills/*/SKILL.md`) | **No** — loaded when task matches or you name the skill |
| **You** | One line per contract / persona to start each session |

Cursor does not execute workflows like CI. Workflows are **instructions the Agent loads**.

---

## By layer (agent + human)

### Layer 1 — Product review (*should we build it?*)

| Doc | Role |
|-----|------|
| [agent-development-layers.md](./agent-development-layers.md) | Map |
| [product-review/personas.md](./product-review/personas.md) | 12 persona ids |
| `.cursor/skills/product-review/SKILL.md` | Persona review agent |
| `.cursor/skills/product-review-consolidator/SKILL.md` | Merge reviews → contracts |
| `.cursor/workflows/product-review.md` | Steps |
| `.cursor/workflows/consolidate-product-reviews.md` | Consolidator steps |
| `docs/product-review/{persona-id}/*-review.md` | Outputs |
| `docs/product-review/consolidated/*-synthesis.md` | Outputs |

**Start:** `Product review: persona badminton-casual per docs/product-review/personas.md …`

### Layer 2 — Author contract (*what must ship?*)

| Doc | Role |
|-----|------|
| `.cursor/skills/write-contract/SKILL.md` | Write/update contracts |
| `.cursor/workflows/author-contract.md` | Checklist |
| [post-v1-roadmap-contracts.md](./post-v1-roadmap-contracts.md) | Index + ship status |
| [contracts/README.md](./contracts/README.md) | Contract catalog |
| `docs/contracts/*.md` | Specs (source of truth) |

**Start:** Edit contract → docs PR → merge `dev`

### Layer 3 — Proof (*does it match contract?*)

| Doc | Role |
|-----|------|
| [contracts/VALIDATION-RUNBOOK.md](./contracts/VALIDATION-RUNBOOK.md) | **Human pick-up guide** |
| [contracts/validation-queue.md](./contracts/validation-queue.md) | Sprint order |
| `.cursor/workflows/validate-contract.md` | Validator/Fixer/Builder roles |
| `.cursor/hooks/README.md` | Hook chain |
| [store-review-test-accounts.md](./store-review-test-accounts.md) | Demo accounts |
| `docs/contracts/screenshots/` | Proof artifacts |

**Start (one contract):** `Run ./.cursor/hooks/validation-loop-start.sh {contract-id} and complete Validator this turn.`

**Start (baseline queue, Items 2–5):** `Run ./.cursor/hooks/validation-loop-start.sh --queue baseline --from flow-rally-session and complete Validator this turn.`

### Layer 4 — Ship (*release*)

| Doc | Role |
|-----|------|
| `.cursor/workflows/promote-branch.md` | dev → preview → main |
| `.cursor/workflows/ship-feature.md` | Feature PR pattern |
| `.cursor/workflows/deploy-supabase.md` | Migrations |
| [beta-testflight-play-internal.md](./beta-testflight-play-internal.md) | Store builds |
| [APP_STORE_PLAY_STORE_PREP.md](./APP_STORE_PLAY_STORE_PREP.md) | Store metadata |
| [play-console-app-content-checklist.md](./play-console-app-content-checklist.md) | Play forms |

---

## By task (search keywords for Agent)

| Task | Read |
|------|------|
| **validate / Loop A / Loop B / fixer** | VALIDATION-RUNBOOK, validate-contract.md, contract file |
| **next contract to validate** | validation-queue.md, post-v1-roadmap-contracts.md |
| **write contract / spec** | write-contract skill, flow-invite-to-rally.md (template) |
| **persona review / UX feedback** | product-review/personas.md, product-review skill |
| **consolidate reviews** | product-review-consolidator skill |
| **demo login / seed** | store-review-test-accounts.md, contract demo setup |
| **push notifications** | PUSH_NOTIFICATIONS.md, add-push-notification workflow |
| **design / neon UI** | design-review/DESIGN_REVIEW_v2.md, rally-mobile-ui skill |
| **vision / strategy** | launch-roadmap-jun-2026.md, vision.md |
| **beta / launch / store review** | launch-roadmap-jun-2026.md, APP_STORE_PLAY_STORE_PREP |
| **monetization / coach / organizer** | launch-roadmap-jun-2026.md § monetization, vision.md |
| **weekly scorecard / metrics** | launch-roadmap-jun-2026.md, module-analytics-events.md |
| **cost / budget** | write-contract skill § cost, google-cloud-budget.md |
| **advisory / handoff** | advisory-handoff-jun-2026.md, **advisory-handoff-contracts-jun-2026.md** (full contract catalog) |
| **launch / beta / GTM** | launch-roadmap-jun-2026.md |
| **parent / student / coach / minors / COPPA** | coach-parent-student/README.md, parent-student-coach-ui-ideas.md |
| **env / keys** | env-and-api-keys.md |

---

## Ignore unless needed

| Folder | Why |
|--------|-----|
| `docs/archive/` | Historical — do not load for daily work |
| `docs/design-review/` | Design refs — only for UI tasks |
| `docs/market_*`, handoffs | Point-in-time |

---

## Validation sprint order (Layer 3 checklist)

**GTM context:** [launch-roadmap-jun-2026.md](./launch-roadmap-jun-2026.md) — finish launch gate before broad feature expansion.

Copy to your notes; check off as you go.

- [x] **Items 2–5** — `--queue baseline` ✅
- [x] **phase1a** ✅ · **phase1b** ✅ · **phase1c** 🔄 (validate when test groups need rotation/tourney)
- [x] **phase2-recap** ✅
- [ ] **phase2-game-card** — detail + venue (optional before first beta if not blocking)
- [ ] **Device launch gate** — real iPhone + Android invite loop (GTM 1)
- [ ] **Layer 1 product review** — after first **real group** test (GTM 2), not only sim personas

---

## One pinned Agent chat per layer

| Chat | Use |
|------|-----|
| **Validation** | Layer 3 — all `validation-loop-start.sh` contracts |
| **Product review** | Layer 1 — one persona per session (can reuse) |
| **Consolidator** | Layer 1 — after ≥3 reviews |
| **Build/Fix** | Only if hook paused or explicit Builder |

---

## Related

- [agent-development-layers.md](./agent-development-layers.md) — full layer detail
- `.cursor/workflows/README.md` — workflow file list
