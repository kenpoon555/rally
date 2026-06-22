# Builder backlog — App Store Build 10 · 2026-06-22

**Source:** Apple rejection Build 9 (2026-06-22) · contracts `module-production-surface`, `module-ugc-moderation`, `flow-auth-onboarding`  
**Branch:** `fix/app-store-build-10`  
**Validation queue:** `app-store-build-10`

## P0 — App Store blockers

| ID | Priority | Item | Contract | Likely files |
|----|----------|------|----------|--------------|
| B1 | P0 | Remove/rebrand all user-visible “Beta” / founding-tester UI | `module-production-surface` | `betaCopy.ts`, `BetaMarketBanner`, `ProfileScreen`, `WelcomeScreen`, `AuthScreenLayout`, `OnboardingModal`, `DiscoverEmptyState`, `productCopy.ts`, `BetaFeedbackScreen` |
| B2 | P0 | Community standards + zero-tolerance terms on Signup + Login | `module-ugc-moderation` | `legal.ts`, `SignupScreen`, `LoginScreen`, `TosAcceptanceGate` |
| B3 | P0 | Block user also submits developer report | `module-ugc-moderation` | `safetyService.ts`, `SafetyActionsSheet.tsx` |
| B4 | P0 | Flag content in group chat (long-press message → Report) | `module-ugc-moderation` | `ChatMessageBubble.tsx`, `ChatThreadScreen.tsx` |
| B5 | P0 | Legal gate Continue shows error + retry (no silent no-op) | `flow-auth-onboarding` | `TosAcceptanceGate.tsx`, `userService.ts` |

## P1 — Resubmission assets (human)

| ID | Priority | Item | Owner |
|----|----------|------|-------|
| B6 | P1 | Physical device screen recording per contract script | Human |
| B7 | P1 | App Store Connect reply + Notes field upload | Human |
| B8 | P1 | EAS production Build 10+ | Human |

## Validation

```bash
cd RallyApp
./.cursor/hooks/validation-loop-start.sh --queue app-store-build-10 --from module-production-surface --builder
```

Order: `module-production-surface` → `module-ugc-moderation` → `flow-auth-onboarding` (legal gate row only).
