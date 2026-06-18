# Push notifications registry

Background push uses Supabase Edge Function **`send-push`** + FCM. Foreground-only alerts use Supabase Realtime hooks in `src/hooks/`.

**When adding a user-facing event:** update this table in the same PR.

Deploy after edge function changes:

```bash
supabase functions deploy send-push --project-ref casljueycxsqexpkdiuq
```

Requires secret `FIREBASE_SERVER_KEY` on the Supabase project.

---

## FCM push types (background / killed app)

| Event | `type` | Recipient | Trigger (service) | Deep link (`navigationRef`) | Status |
|-------|--------|-----------|-------------------|----------------------------|--------|
| Player requests join | `join_request` | Host | `createJoinRequest` → `notifyHostOfJoinRequest` | Activity detail | ✅ |
| Host approves join | `join_request_approved` | Player | `approveJoinRequest` → `notifyPlayerOfJoinApproval` | Activity detail | ✅ |
| Host declines join | `join_request_rejected` | Player | `rejectJoinRequest` → `notifyPlayerOfJoinRejection` | Activity detail | ✅ |
| Host locks roster | `game_finalized` | Approved players | `finalizeGameCommitment` → `notifyGameFinalized` | Activity detail | ✅ |
| Host nudges roster | `roster_nudge` | Approved, not ready | `nudgeSessionRoster` → `notifyRosterNudge` | Activity detail | ✅ |
| Crew dormancy nudge | `crew_dormancy_nudge` | Rally host (14d idle) | `process-crew-dormancy-nudges` cron or `devTestCrewDormancyNudge` | Rally hub Play tab | ✅ |
| Host invites free agent | `free_agent_invite` | Target user | `inviteFreeAgent` → `notifyFreeAgentInvite` | Activity detail | ✅ |
| Host invites fill-in | `fill_in_invite` | Target user | `inviteFillIn` → `notifyFillInInvite` | Activity detail | ✅ |
| New chat message | `chat_message` | Conversation members | `sendConversationMessage` → `notifyConversationMessage` | Chat thread | ✅ |
| Post-game review prompt | `review_prompt` | Players | *(not wired)* | Activity detail | ⏳ Planned |

---

## Foreground-only (Realtime — app open)

| Event | Hook | Notes |
|-------|------|-------|
| Host: new join request | `useJoinRequestNotifications` | Alert + optional navigate |
| Player: approved / rejected | `useJoinRequestNotifications` | Duplicate with FCM when background |
| Game finalized | `useGameLifecycleNotifications` | Duplicate with FCM when background |

---

## Planned (not implemented)

| Event | Suggested `type` | Priority |
|-------|------------------|----------|
| Friend request received | `friend_request` | P1 |
| Friend request accepted | `friend_request_accepted` | P1 |
| Rally friend invite | `rally_friend_invite` | P1 |
| Need Players request | `need_player_request` | P1 |
| Waitlist promoted | `waitlist_promoted` | P2 |
| Host transfer | `host_transfer` | P2 |
| Removed from roster | `roster_removed` | P2 |
| Poll created | `poll_created` | P2 |

---

## Adding a new push type (checklist)

1. Add `type` to `PushBody` in `supabase/functions/send-push/index.ts`
2. Implement handler (auth, quiet hours, suspended check, rate limit inherited)
3. Add `notifyX()` in `src/services/pushDispatchService.ts`
4. Call from the **service** after DB success (never from components)
5. Add case in `navigateFromNotificationData()` in `src/navigation/navigationRef.ts`
6. Update this registry
7. Deploy `send-push` and test on **physical** iOS + Android (background + killed)

---

## Client wiring

| File | Role |
|------|------|
| `src/services/pushDispatchService.ts` | Invoke `send-push` |
| `src/services/notificationService.ts` | FCM token registration |
| `src/navigation/navigationRef.ts` | Tap → screen |
| `App.tsx` | Foreground alert + open handler |
| `index.js` | Background message handler |

---

## Related

- [phase-4-secrets-setup.md](./archive/phase-4-secrets-setup.md)
- [github-actions-production.md](./github-actions-production.md)
