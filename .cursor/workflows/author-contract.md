# Workflow: Author or update a contract

Load skill: `.cursor/skills/write-contract/SKILL.md`

## Steps

1. **Scope** — one flow or module; link related contracts
2. **Draft** — use `flow-invite-to-rally.md` as template; include performance + external deps + human gates if applicable
3. **Index** — update `docs/contracts/README.md` and `docs/post-v1-roadmap-contracts.md`
4. **PR** — docs-only to `dev`; no Builder until merged
5. **Validate** — `./.cursor/hooks/validation-loop-start.sh {contract-id}` in Agent chat

## Stop conditions (before validation)

- [ ] Every checklist row is observable on sim
- [ ] Performance table has budgets + measure method
- [ ] External deps list what to do when Supabase/seed/device missing
- [ ] Undecided product choices are `H*` gates — not left implicit

## Related

- [product-review.md](./product-review.md) — persona feedback → contract input
- [validate-contract.md](./validate-contract.md) — proof loop after contract exists
