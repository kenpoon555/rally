# Rally agent workflows

Step-by-step playbooks for recurring multi-step tasks. **Read the matching workflow file when the user asks to ship, promote, deploy, or add push.**

## Skills vs rules vs workflows vs hooks

| Layer | Location | When it applies |
|-------|----------|-----------------|
| **Rules** | `.cursor/rules/*.mdc` | Always (or when matching files are open) — constraints, stack, conventions |
| **Skills** | `.cursor/skills/*/SKILL.md` | Domain playbooks the agent loads when a task matches the skill description |
| | `write-contract` | Author contracts (performance, deps, human gates) |
| | `product-review` | Persona UX review → contract input |
| **Workflows** | `.cursor/workflows/*.md` | Ordered checklists for multi-step procedures (this folder) |
| **Hooks** | `.cursor/hooks.json` | Automated scripts on agent events (optional, not set up yet) |
| **GitHub Actions** | `.github/workflows/` | CI/CD on push — not read by the agent unless asked |

**Workflows ≠ skills:** A skill teaches *how* (patterns, files, pitfalls). A workflow lists *steps in order* (what to do first, second, third). Use both: workflow for the checklist, skill for depth.

**Prefer CLI:** See skill `.cursor/skills/cli-first/SKILL.md` — run `gh`, `supabase`, `eas`, `git`, `npm` directly instead of asking the user or using slower paths when a CLI exists.

## Workflows

| Workflow | Use when |
|----------|----------|
| [author-contract.md](./author-contract.md) | **Write/update** a contract — performance, deps, human gates |
| [product-review.md](./product-review.md) | **Persona UX review** — sim walkthrough → feedback → contract |
| [validate-contract.md](./validate-contract.md) | **Proof loop** — Validator → Fixer against `docs/contracts/` |
| [promote-branch.md](./promote-branch.md) | Push dev → PR preview → main → production |
| [ship-feature.md](./ship-feature.md) | New feature / bugfix with service + optional migration + push |
| [deploy-supabase.md](./deploy-supabase.md) | Migrations + edge functions |
| [add-push-notification.md](./add-push-notification.md) | New FCM notify event |
