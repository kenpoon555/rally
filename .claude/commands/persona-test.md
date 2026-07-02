Run a Rally persona walkthrough of a specific flow and produce a friction report.

## Input

The user provides:
- A **persona** name (new-user, pickup-player, host, captain, coach) — or "all" to run all
- A **flow** to test (e.g. "join a game", "lock the roster", "send an announcement", "onboarding")
- Optionally: specific screens or files to focus on

## Steps

1. **Load the persona** from `.claude/agents/rally-persona-<name>.md`. Read it fully — internalize the background, mental model, friction triggers, and success criteria.

2. **Identify the relevant source files** for the flow. Look in:
   - `src/pages/` — find the screens involved in the flow
   - `src/components/` — find key components used
   - `src/constants/productCopy.ts` — check all user-facing copy in the flow

3. **Walk through the flow AS the persona.** For each screen/step:
   - What does the persona see and think?
   - Is the copy clear to someone with their mental model?
   - How many taps to complete the step?
   - Any friction triggers hit?

4. **Produce a friction report** in this format:

   ```
   ## Persona: <Name> — Flow: <Flow>

   ### ✅ What works
   - (things that match the persona's expectations)

   ### 🚨 Friction points
   - **[Screen/Component]** Description of friction — why it's a problem for this persona
   - ...

   ### 💡 Suggestions
   - Specific, actionable copy or UX changes (reference file:line where relevant)

   ### Tap count
   Goal: <what success looks like>
   Actual: <N taps / screens> — <Pass/Fail vs. persona's success criteria>
   ```

5. If the user passed "all" as the persona, run each persona in sequence and combine into one report, sectioned by persona.

## Notes
- Stay in persona — judge everything from their mental model, not as a developer
- Reference actual copy from `productCopy.ts` when flagging language issues
- Suggest concrete copy fixes inline, not just "improve this"
- Keep suggestions tied to the persona's specific friction triggers, not general UX opinions
