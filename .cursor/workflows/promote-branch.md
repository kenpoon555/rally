# Workflow: Promote branch

## dev → preview

1. `git checkout dev && git pull`
2. `npm run verify`
3. `git push origin dev`
4. `gh pr create --base preview --head dev` (or update existing PR)
5. Wait for CI green → merge
6. Preview EAS build runs on merge (see Actions)

## preview → main

1. `git fetch origin`
2. Confirm preview CI / builds OK
3. `gh pr create --base main --head preview`
4. Merge when green (main = CI only, no EAS)

## main → production

1. `gh pr create --base production --head main` (or push `production` if branch exists)
2. Merge triggers production EAS **build + auto-submit** (Play internal + TestFlight)

## Notes

- Never force-push `main` / `production`
- Docs: `docs/github-actions-preview.md`, `docs/github-actions-production.md`
