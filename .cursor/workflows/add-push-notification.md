# Workflow: Add push notification

Full registry: **`docs/PUSH_NOTIFICATIONS.md`**

Deep skill: **`.cursor/skills/push-notifications/SKILL.md`**

1. Add `type` to `PushBody` in `supabase/functions/send-push/index.ts`
2. Implement handler (auth, quiet hours, suspended)
3. Add `notifyX()` in `src/services/pushDispatchService.ts`
4. Call from service after DB success (not from components)
5. Add type to `navigationRef.ts` (`ACTIVITY_PUSH_TYPES` or chat branch)
6. Update `docs/PUSH_NOTIFICATIONS.md` row
7. Deploy: `supabase functions deploy send-push --project-ref casljueycxsqexpkdiuq`
8. Test iOS + Android physical devices (background + killed)
