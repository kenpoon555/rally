# Neon theme rollout

Step-by-step so each pass can be reviewed in the simulator before continuing.

| Step | Scope | Status |
|------|-------|--------|
| **1** | `theme.ts` tokens + `Button` contrast (`onPrimary` / `onAccent`) | **Done** |
| **2** | Tab bar, Chip, SegmentToggle, SportFilterIconItem | **Done** |
| **3** | Welcome screen redesign (illustration + copy + carousel) | **Done** |
| ~~Logo~~ | Brand mark PNG + splash | **Skipped** |
| **4** | Today → Play → Inbox → Rally → Game card polish | **Done** |

## Step 4 — what to compare

| Screen | Check |
|--------|-------|
| **Today** | Next Up sport icon in yellow ring; Rally carousel cards yellow left stripe + ring icons |
| **Play** | Game list yellow sport rings; Players Invite pills dark-on-lime; More filter yellow ring |
| **Inbox** | Game/Rally rows yellow rings; friend rows yellow circle icon |
| **Game room** | Your chat bubbles lime with dark text; I'm in buttons dark-on-lime |
| **Rally hub** | Header sport ring; Chat/Play/Members lime underline; Play badge dark-on-yellow |
| **Game card** | Yellow sport ring beside sport name in hero |

Shared: new `SportIcon` `variant="ring"` used across list surfaces.

## Step 3 — what to compare

Sign out and open **Welcome** — carousel, illustration, Get Started + account link.

## Step 2 — what to compare

Tab bar, Play filters/chips, Inbox filter chips.

## Step 1 — what to compare

Lime primary buttons with dark text; `#EEEDEB` background.
