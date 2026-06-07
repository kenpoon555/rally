# Workflow: Ship a feature

1. **Scope** — one feature/fix; match existing patterns in surrounding code
2. **Service layer** — `src/services/*.ts`, types in `src/types/`
3. **Migration** (if DB/RPC) — `supabase/migrations/NNN_*.sql` → apply via [deploy-supabase.md](./deploy-supabase.md)
4. **Push** (if another user should know offline) — [add-push-notification.md](./add-push-notification.md) + update `docs/PUSH_NOTIFICATIONS.md`
5. **UI** — components under `src/`; copy in `productCopy.ts`
6. **Verify** — `npm run verify`
7. **PR** — [promote-branch.md](./promote-branch.md) starting at `dev`

Use CLI for git/gh/npm/supabase — see `cli-first` skill.
