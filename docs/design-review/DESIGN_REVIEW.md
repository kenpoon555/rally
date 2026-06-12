# Rally Design Review — Designer mockup vs Court Fresh concepts

**Date:** 2026-06-06  
**Designer source:** `../Image 6-6-2026 at 2.27 AM.jpg` (cropped per screen below)  
**Concept mocks:** `05_*` through `08_*` in this folder

---

## Files in this folder

| File | What it is |
|------|------------|
| `logo/01_designer_logo.jpg` | Designer splash / logo |
| `02_designer_get_started.jpg` | Designer onboarding |
| `03_designer_home_today.jpg` | Designer Home (→ our **Today**) |
| `04_designer_discover_play.jpg` | Designer Discover (→ our **Play**) |
| `05_concept_today_cream.png` | AI concept: Today + cream + map hero |
| `06_concept_play_discover_cream.png` | AI concept: Play tab |
| `07_concept_tab_bar_4tab_options.png` | 3 bottom-bar options for 4 tabs |
| `logo/08_concept_logo_onboarding_cream.png` | AI concept: splash + onboarding on cream |

---

## Recommendation (short)

**Keep the designer's layout instincts. Shift the palette to Court Fresh cream + deep green. Adapt the center FAB for 4 tabs via Option B (floating Host button on Today, not in tab bar).**

---

## Screen-by-screen review

### 1. Logo / Splash (`logo/01_designer_logo.jpg`)

| Criterion | Designer | Verdict |
|-----------|----------|---------|
| **Color** | Gray bg + neon lime logo | Strong mark, but gray splash feels cold; neon lime ≠ current `#0B7A5E` Court Fresh |
| **User-friendly** | Simple, clear | ✅ Works — one logo, one wordmark |
| **Function fit** | Brand only | ✅ Fine for splash |
| **Bottom bar** | N/A | N/A |

**Take:** Keep the orbital logo concept. Swap gray → cream `#F5F4F0`, lime → court green `#0B7A5E`. See `logo/08_concept_logo_onboarding_cream.png`. All candidates: [logo/](./logo/) · [assets/branding/logo/](../assets/branding/logo/).

---

### 2. Get Started (`02_designer_get_started.jpg`)

| Criterion | Designer | Verdict |
|-----------|----------|---------|
| **Color** | White + lime CTA + yellow avatar circles | Energetic; yellow+lime is loud together |
| **User-friendly** | ✅ Clear headline, one CTA, pagination dots | Best screen in the set |
| **Function fit** | ✅ "Play together" + fill slots = Rally's liquidity story | Copy is on-strategy |
| **Bottom bar** | N/A | N/A |

**Take:** Keep structure. Update copy to include **replay with your crew** (not just meet strangers). Cream bg, green CTA, softer yellow accents.

---

### 3. Home / Today (`03_designer_home_today.jpg`)

| Criterion | Designer | Current Rally | Verdict |
|-----------|----------|---------------|---------|
| **Color** | Cool gray + lime cards | Cream `#F5F4F0` + green | Designer cards pop more; Rally feels warmer but flatter |
| **User-friendly** | ✅ NEXT GAME / UPCOMING sections, filter pills, spots bar | NextUpCard + crews + invites — richer but noisier | Designer wins **scanability** |
| **Function fit** | ⚠️ "Home" = my schedule only | **Today** = schedule + crews + game rooms + invites | Designer misses Rally/crew layer |
| **Bottom bar** | 4 tabs + center medal FAB | 4 tabs, no FAB | See tab bar section |

**Designer wins:** Section hierarchy, filter pills (All/Joined/Host), spots progress bar, large title + subtitle.

**Rally wins:** Crew replays, game room entry, host lock readiness, rally invites.

**Hybrid (see `05_concept_today_cream.png`):**
- Cream background + warm card shadow
- **NEXT UP** hero with map (designer's card layout + our map idea)
- **YOUR CREWS** horizontal strip (designer doesn't have this)
- Filter pills: All / Joined / Hosting
- Dot notches for spots (●●●●○○) instead of battery bar

---

### 4. Play / Discover (`04_designer_discover_play.jpg`)

| Criterion | Designer | Current Rally | Verdict |
|-----------|----------|---------------|---------|
| **Color** | Same lime system | Green + orange urgency | Designer more consistent; Rally has more semantic color |
| **User-friendly** | ✅ Search + sport circles + game cards | Sport chips + 3 modes (games/need/free) + coaches | Designer simpler; Rally more powerful but dense |
| **Function fit** | ⚠️ Only open games list | Need Players, Free Agents, partners, intro nights | Designer under-ships what we built |
| **Bottom bar** | Discover active + center FAB | Play tab, no FAB | — |

**Designer wins:** Sport category circles, search bar, clean card repetition.

**Rally wins:** Liquidity boards, partner filter, intro sessions, deep link from game room.

**Hybrid (see `06_concept_play_discover_cream.png`):**
- Keep designer's sport circles + search
- Add segmented control: **Open Games | Need Players | Free Agents**
- Orange left stripe on "Tonight" urgent cards
- Section eyebrows from polish review

---

## Bottom bar — 4 tabs + the "pop up" button

Designer mockup: **Home · Discover · [FAB medal] · Chat · Profile** = 5 touch targets.

We have: **Today · Play · Inbox · You** (4 tabs, no FAB).

### Three options (`07_concept_tab_bar_4tab_options.png`)

| Option | What | Pros | Cons |
|--------|------|------|------|
| **A — Designer 5-slot** | 2 tabs + FAB + 2 tabs | FAB is iconic; Host always visible | Needs 5 slots; medal icon unclear (rewards? host?) |
| **B — Floating Host** | 4 tabs + green **+** overlapping bar (right of center) | Keeps 4 tabs; Create always reachable | Slightly crowded on small phones |
| **C — Court Fresh 4-tab** | 4 equal tabs, no FAB | Cleanest; matches current code | Host action buried in Today/Play |

**Recommendation: Option B or a variant of A**

- Use **+** icon (not medal) — medal reads as achievements/leagues (deferred scope).
- FAB action = **Host a game** → `CreateActivityScreen`.
- Tab labels: keep **Today / Play / Inbox / You** (more specific than Home/Discover/Chat/Profile).
- Active state: designer's filled green icon **or** our green pill behind icon — both work; pill is subtler on cream.

If FAB feels too tight with 4 tabs, put a large **Host a game** button at top of **Today** (Option C) and skip FAB entirely.

---

## Color comparison

| Token | Designer | Rally Court Fresh | Recommendation |
|-------|----------|-------------------|----------------|
| Background | Cool gray ~#E8E8E8 | Cream `#F5F4F0` | **Keep cream** — warmer, LA outdoor, less "template app" |
| Primary | Neon lime ~#B8F000 | Court green `#0B7A5E` | **Keep green** — more mature; lime is trendy but ages fast |
| Accent | Yellow-green FAB | Orange `#E8622A` | **Orange for urgency/hosting**; don't use lime+yellow+green all at once |
| Cards | White + gray shadow | White + hairline border | **Warm shadow** (see theme polish) |
| Text | Pure black | `#141916` warm black | Keep Rally text tokens |

**Best of both:** Designer's **layout energy** + Rally's **warm palette and semantic orange**.

---

## What to decide together

1. **Palette:** Court Fresh cream+green, or bring back designer lime on cream?
2. **Tab bar:** FAB Host (B) vs no FAB (C)?
3. **Today layout:** Designer card list vs map-hero Next Up (`05_concept_today_cream.png`)?
4. **Play:** Add designer search bar + sport circles on top of our 3-mode discover?

---

*Concept images are AI-generated direction mocks — use for discussion with designer, not final spec.*
