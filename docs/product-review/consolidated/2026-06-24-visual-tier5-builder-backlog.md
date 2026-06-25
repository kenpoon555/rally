# Builder backlog — visual-tier5 · 2026-06-24

**Source:** [2026-06-24-visual-tier5-synthesis.md](./2026-06-24-visual-tier5-synthesis.md)  
**Branch:** `fix/visual-tier5-builder` · **No src/ until contract PR merged**

| ID | Priority | Item | Contract | Likely files |
|----|----------|------|----------|--------------|
| B1 | P1 | **onPrimary audit** — all lime buttons (Welcome, Host, auth, polls, hub) | `module-visual-design-system` | `WelcomeScreen`, `Button`, `HomeScreen`, `ChatThreadScreen`, auth screens |
| B2 | P1 | Replace Inbox empty **emoji** with branded icon | `module-visual-design-system` | `InboxScreen`, empty state component |
| B3 | P1 | Sport strip **idle ring** → neutral; selected → primary only | `module-visual-design-system` | `DiscoverSportFilters.tsx` |
| B4 | P1 | Game list **venue 2-line** + spots badge min width | `module-game-card` | `GameListCard.tsx` |
| B5 | P1 | Roster meter **sport icon binding** | `module-game-card` | `RosterSeatBar.tsx`, `SportIconForSurface` |
| B6 | P1 | Inbox **filter chip** layout (H2) | `flow-inbox` | Inbox filter segment |
| B7 | P1 | Signup **legal stack** + spacing | `flow-auth-onboarding` | `SignupScreen.tsx` |
| B8 | P2 | Players segment **duplicate copy** trim | `flow-play-screen` | `HomeScreen.tsx`, `productCopy.ts` |
| B9 | P2 | Welcome **illustration variants** (H1) | `module-visual-design-system` | Welcome slides |
| B10 | P2 | Profile **rate queue** session grouping | `flow-profile` | `ProfileScreen.tsx` |
| B11 | P2 | Hide **dev dormancy** banner in production | `flow-crew-dormancy-nudge` | Hub chat |
| B12 | P2 | Game room **closed poll collapse** | `flow-game-room` | Poll message component |

**Suggested order:** B1 → B3 → B2 → B4 → B5 → B6 → B7 → remainder.

**Note:** Defer builder until iOS App Review completes unless Apple requests changes.
