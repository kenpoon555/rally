---
name: push-notifications
description: Add or fix Rally FCM push notifications (send-push edge function, pushDispatchService, deep links). Use when wiring notify events, debugging missing background push, or extending docs/PUSH_NOTIFICATIONS.md.
---

# Rally push notifications

## Registry

Always read and update **`docs/PUSH_NOTIFICATIONS.md`** in the same change.

## Files

| File | Purpose |
|------|---------|
| `supabase/functions/send-push/index.ts` | Server: FCM send, rate limits, quiet hours |
| `src/services/pushDispatchService.ts` | Client: `notifyX()` → invoke edge function |
| `src/services/notificationService.ts` | Device token registration |
| `src/navigation/navigationRef.ts` | Tap notification → screen |
| `App.tsx` | Foreground alert handler |

## Add a new push type

```typescript
// 1. pushDispatchService.ts
export async function notifySomething(activityId: string, targetUserId: string) {
  await supabase.functions.invoke('send-push', {
    body: { type: 'something', activity_id: activityId, target_user_id: targetUserId },
  });
}

// 2. Call from service after DB write succeeds
await notifySomething(activityId, userId);

// 3. navigationRef.ts — add type to ACTIVITY_PUSH_TYPES or chat branch

// 4. send-push/index.ts — validate caller, resolve recipient, send FCM
```

## Deploy

```bash
cd RallyApp
supabase functions deploy send-push --project-ref casljueycxsqexpkdiuq
```

Requires `FIREBASE_SERVER_KEY` secret on Supabase.

## Test matrix

- Physical iOS + Android (not simulator for reliable push)
- App backgrounded and force-quit
- Recipient has token in `user_device_tokens`
- Notification permission granted

## Do not

- Call Supabase `send-push` from components
- Skip `navigationRef` when adding a new `type`
- Forget to deploy edge function after changing `send-push/index.ts`
