# Validation runbook — pick up and go

**For you (human).** One contract at a time. Same three prompts every time — only the path and contract id change.

**Related:** [validation-queue.md](./validation-queue.md) (sprint order) · [validate-contract.md](../../.cursor/workflows/validate-contract.md) (agent rules) · [hooks README](../../.cursor/hooks/README.md) (automated chain)

---

## One Agent chat (recommended)

Cursor **cannot** start Agent from the terminal alone — hooks only fire **after** an Agent turn. So use **one pinned Agent chat** for all validation work.

Each new contract, send **one line** (no paste):

```
Run ./.cursor/hooks/validation-loop-start.sh flow-rally-session and complete the Validator phase in this same turn.
```

The Agent runs the script, validates, writes `.validation-session.json`, and stops. The hook chains **only on fail**:

| Result | Same chat |
|--------|-----------|
| **pass** | `VALIDATION_GREEN` — stops (no Fixer) |
| **fail** | Hook auto-sends **Fixer** → then **Validator** again |
| 3 Fixer rounds | Stops |

Stop: `./.cursor/hooks/validation-loop-stop.sh`

Next item (same chat):

```
Run ./.cursor/hooks/validation-loop-start.sh flow-inbox and complete the Validator phase in this same turn.
```

Fallback if you prefer terminal + paste: `./.cursor/hooks/validation-loop-start.sh flow-rally-session --paste`

---

## Manual cycle (memorize this)

```
┌─────────────┐
│  VALIDATOR  │  new chat · no code changes · pass/fail table
└──────┬──────┘
       │
       ▼
   All Pass? ──yes──► mark green · move to NEXT ITEM
       │
       no
       │
       ▼
  Feature already     Feature missing
  shipped in app?     or big gaps?
       │                    │
       yes                  yes
       │                    │
       ▼                    ▼
    FIXER               BUILDER
  (surgical)         (implement contract)
       │                    │
       └────────┬───────────┘
                ▼
         VALIDATOR again
    (same contract, fresh message)
                │
         max 3 Fixer rounds · then stop and rethink
```

| Result | What you do next |
|--------|------------------|
| **All rows Pass** | Add `Last validated: YYYY-MM-DD` to the contract. Start **next item** below. |
| **Some Fail, app exists** | **Fixer** chat → paste failed rows only → Validator again. |
| **Fail because UI/flow missing** | **Builder** chat → implement contract → Validator again. |
| **Unsure fix vs build** | If checklist row describes behavior you never built → Builder. If it broke or regressed → Fixer. |

**Rules**

- One contract per Validator chat.
- Validator never edits code.
- Fixer never touches passing rows.
- Builder never validates — you run Validator in a **new** chat after Builder finishes.

---

## Before you start (once per session)

```bash
cd RallyApp
npm start          # Metro — leave running
npm run ios        # another terminal if sim not booted
```

Demo accounts: [store-review-test-accounts.md](../store-review-test-accounts.md)

---

## Progress tracker

Copy this into a note or PR and check off as you go.

- [ ] **Item 1** — Loop A · `flow-invite-to-rally`
- [ ] **Item 2** — Loop B · `flow-rally-session`
- [ ] **Item 3** — `module-rally-hub`
- [ ] **Item 4** — `flow-inbox`
- [ ] **Item 5** — `flow-play-screen`
- [ ] **Item 6** — `flow-post-game-attendance`
- [ ] **Item 7** — `flow-host-nudges`
- [ ] **Item 8** — `module-analytics-events`
- [ ] **Item 9** — `flow-availability-poll`
- [ ] **Item 10+** — see [validation-queue.md](./validation-queue.md)

---

## Item 1 — Loop A: Invite → Rally

| Field | Value |
|-------|--------|
| Contract file | `docs/contracts/flow-invite-to-rally.md` |
| Contract id | `flow-invite-to-rally` |
| Screenshots folder | `docs/contracts/screenshots/flow-invite-to-rally/` |
| Already shipped? | **Yes** — expect Fixer, not Builder, if anything fails |

### Step 1 — Validator (new chat)

Paste this exactly:

```
You are the Validator agent for Rally contract validation.

Read:
- RallyApp/docs/contracts/flow-invite-to-rally.md
- RallyApp/.cursor/workflows/validate-contract.md
- RallyApp/docs/store-review-test-accounts.md (demo login)

Validate on iOS simulator against production-linked Supabase seed (Monrovia demo).

Steps:
1. npm start (Metro) + iOS sim booted
2. Seed if needed: node scripts/seed-monrovia-basketball-rally-demo.mjs
3. Execute contract demo setup and every checklist row
4. Save screenshots to docs/contracts/screenshots/flow-invite-to-rally/ (filenames from contract)
5. Fill pass/fail table — every row Pass or Fail with notes

Do not fix code. Return:
- Full pass/fail markdown table
- List of failed rows only (for Fixer)
- Screenshot paths saved
```

### Step 2 — After Validator

| Outcome | Action |
|---------|--------|
| All Pass | ✅ Done. Go to **Item 2**. |
| Some Fail | **Fixer** (new chat) — see Fixer block below with failed rows pasted in. |
| Whole flow missing | Unlikely for Loop A — use **Builder** only if Validator says major gaps vs contract. |

### Step 3 — Fixer (only if Item 1 had failures)

```
You are the Fixer agent for Rally contract validation.

Read:
- RallyApp/docs/contracts/flow-invite-to-rally.md
- RallyApp/.cursor/workflows/validate-contract.md

Fix ONLY these failed rows from the Validator report:

[PASTE FAILED ROWS HERE]

Rules:
- Minimal diff; no new behavior beyond the contract
- Do not fix passing items
- Do not re-run validation — tell me to run Validator again

When done: summarize diff + which rows should now pass.
```

Then run **Step 1 Validator again** (same contract). Repeat until green.

---

## Item 2 — Loop B: Session → I'm in → lock

| Field | Value |
|-------|--------|
| Contract file | `docs/contracts/flow-rally-session.md` |
| Contract id | `flow-rally-session` |
| Screenshots folder | `docs/contracts/screenshots/flow-rally-session/` |
| Prerequisite | Item 1 green (Loop A) |
| Already shipped? | **Yes** — Fixer for regressions |

### Step 1 — Validator (new chat)

```
You are the Validator agent for Rally contract validation.

Read:
- RallyApp/docs/contracts/flow-rally-session.md
- RallyApp/.cursor/workflows/validate-contract.md
- RallyApp/docs/store-review-test-accounts.md (demo login)

Validate on iOS simulator against production-linked Supabase seed (Monrovia demo).

Steps:
1. npm start (Metro) + iOS sim booted
2. Seed if needed: node scripts/seed-monrovia-basketball-rally-demo.mjs
3. Execute contract demo setup and every checklist row
4. Save screenshots to docs/contracts/screenshots/flow-rally-session/ (filenames from contract)
5. Fill pass/fail table — every row Pass or Fail with notes

Do not fix code. Return:
- Full pass/fail markdown table
- List of failed rows only (for Fixer)
- Screenshot paths saved
```

### Step 2 — After Validator

| Outcome | Action |
|---------|--------|
| All Pass | ✅ Done. Go to **Item 3**. |
| Some Fail | **Fixer** — swap contract path to `flow-rally-session.md`, paste failed rows. |
| Polish gaps only | Fixer first. Builder only if contract describes UI that does not exist at all. |

### Step 3 — Fixer (only if Item 2 had failures)

Same Fixer template as Item 1 — change both lines to `flow-rally-session.md` and paste failed rows.

Then **Validator again** for Item 2 until green.

---

## Item 3 — Rally hub tabs

| Field | Value |
|-------|--------|
| Contract file | `docs/contracts/module-rally-hub.md` |
| Contract id | `module-rally-hub` |
| Screenshots folder | `docs/contracts/screenshots/module-rally-hub/` |
| Prerequisite | Item 2 green |
| Already shipped? | **Yes** |

### Validator prompt (new chat)

Same as Item 1 — replace every `flow-invite-to-rally` with `module-rally-hub`.

### After Validator

| Outcome | Action |
|---------|--------|
| All Pass | ✅ Item 4 |
| Fail | Fixer with `module-rally-hub.md` |

---

## Item 4 — Inbox

| Field | Value |
|-------|--------|
| Contract file | `docs/contracts/flow-inbox.md` |
| Contract id | `flow-inbox` |
| Screenshots folder | `docs/contracts/screenshots/flow-inbox/` |
| Prerequisite | Item 3 green |
| Already shipped? | **Yes** (contract may be draft — failures may need Builder to align app to contract) |

### Validator prompt (new chat)

Replace path/id with `flow-inbox` / `flow-inbox.md`.

### After Validator

| Outcome | Action |
|---------|--------|
| All Pass | ✅ Item 5 |
| Fail, small bugs | Fixer |
| Fail, contract ahead of app | **Builder** — inbox draft promotion |

---

## Item 5 — Play / Today screen

| Field | Value |
|-------|--------|
| Contract file | `docs/contracts/flow-play-screen.md` |
| Contract id | `flow-play-screen` |
| Screenshots folder | `docs/contracts/screenshots/flow-play-screen/` |
| Prerequisite | Item 4 green |
| Already shipped? | **Partial** (empty state called out in contract) |

### Validator prompt (new chat)

Replace path/id with `flow-play-screen` / `flow-play-screen.md`.

### After Validator

| Outcome | Action |
|---------|--------|
| All Pass | ✅ Baseline sprint 0 done — move to Item 6 |
| Fail on empty state | **Builder** if Today empty state not built yet |
| Fail on regressions | **Fixer** |

### Builder prompt (when contract says feature is missing)

Use this when Validator reports missing UI/flow, not broken behavior:

```
You are the Builder agent for Rally.

Read:
- RallyApp/docs/contracts/flow-play-screen.md
- RallyApp/.cursor/workflows/validate-contract.md
- Related module contracts linked from flow-play-screen.md

Implement until all checklist items should pass. Match existing code patterns.

Do not run validation. When done, list files changed and checklist rows addressed.
Then I will run Validator in a separate chat.
```

Then run **Validator again** for the same contract.

---

## Item 6 — Post-game attendance

| Field | Value |
|-------|--------|
| Contract file | `docs/contracts/flow-post-game-attendance.md` |
| Contract id | `flow-post-game-attendance` |
| Screenshots folder | `docs/contracts/screenshots/flow-post-game-attendance/` |
| Prerequisite | Loop B green |
| Already shipped? | **Yes** — Fixer first |

Validator → Fixer if needed → Validator until green → Item 7.

---

## Item 7 — Host nudges

| Field | Value |
|-------|--------|
| Contract file | `docs/contracts/flow-host-nudges.md` |
| Contract id | `flow-host-nudges` |
| Screenshots folder | `docs/contracts/screenshots/flow-host-nudges/` |

Same cycle. Shipped — Fixer before Builder.

---

## Item 8 — Analytics events

| Field | Value |
|-------|--------|
| Contract file | `docs/contracts/module-analytics-events.md` |
| Contract id | `module-analytics-events` |
| Screenshots folder | `docs/contracts/screenshots/module-analytics-events/` |
| Note | Partial ship — Validator may surface **Builder** work for missing events |

---

## Item 9 — Availability poll (first big new feature)

| Field | Value |
|-------|--------|
| Contract file | `docs/contracts/flow-availability-poll.md` |
| Contract id | `flow-availability-poll` |
| Screenshots folder | `docs/contracts/screenshots/flow-availability-poll/` |
| Backend | Already exists — Validator likely finds **UI gaps → Builder** |

### Typical path for Item 9

1. **Validator** — documents what passes vs fails  
2. **Builder** — wire poll UI to existing `availabilityPollService`  
3. **Validator** — confirm green before merge to `dev`  

Do **not** skip step 1 and jump to Builder.

---

## Template for any later item

Fill in the table, then copy the Validator block and swap two strings.

| Field | You fill in |
|-------|-------------|
| Contract file | `docs/contracts/YOUR-FILE.md` |
| Contract id | `your-contract-id` (from top of contract) |
| Screenshots folder | `docs/contracts/screenshots/your-contract-id/` |

**Validator** — find/replace `CONTRACT_PATH` and `CONTRACT_ID`:

```
You are the Validator agent for Rally contract validation.

Read:
- RallyApp/docs/contracts/CONTRACT_PATH
- RallyApp/.cursor/workflows/validate-contract.md
- RallyApp/docs/store-review-test-accounts.md (demo login)

Validate on iOS simulator against production-linked Supabase seed (Monrovia demo).

Steps:
1. npm start (Metro) + iOS sim booted
2. Seed if needed: node scripts/seed-monrovia-basketball-rally-demo.mjs
3. Execute contract demo setup and every checklist row
4. Save screenshots to docs/contracts/screenshots/CONTRACT_ID/ (filenames from contract)
5. Fill pass/fail table — every row Pass or Fail with notes

Do not fix code. Return:
- Full pass/fail markdown table
- List of failed rows only (for Fixer)
- Screenshot paths saved
```

**Fixer** — same two replacements + paste failed rows.

**Builder** — same `CONTRACT_PATH` replacement when Validator says flow is missing.

---

## Optional: `/loop` for regression only

After Item 2 is green, you can pin a hourly Loop B watch:

```
/loop 1h You are the Validator agent for Rally.

Read RallyApp/docs/contracts/flow-rally-session.md and RallyApp/.cursor/workflows/validate-contract.md.

Validate Loop B on iOS simulator. Do not change code.

Return pass/fail table only. If all rows pass, reply VALIDATION_GREEN.
If any row fails, list failed rows only for the Fixer.
```

Rotate contract daily using the progress tracker order. Never use `/loop` for Builder work.

---

## Where to save results

| What | Where |
|------|--------|
| Pass/fail table | GitHub PR comment or contract **Open issues** section |
| Screenshots | `docs/contracts/screenshots/{contract-id}/` |
| Done marker | Top or bottom of contract: `Last validated: 2026-06-07 · build 6` |

When baseline (Items 1–5) is all green, you have the discipline — every later item is the same template with a new path.
