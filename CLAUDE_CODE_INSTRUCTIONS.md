# Project: DIE HARD — The Dice Game

## What You're Building

A complete, polished, single-page browser game themed around the movie Die Hard. Solo dice-climbing roguelike. The player (John McClane) ascends Nakatomi Plaza floor by floor, fighting "Chance" Gruber's henchmen with dice rolls, optionally looting after each fight, then faces Gruber himself in a poker-style dice showdown called "Nakatomi Roll'em." If your dice pool ever hits 0, you're dead.

**Tech stack:** React 19 + TypeScript + Vite. All styling is hand-written CSS (no Tailwind, no component libraries). Sound effects via Web Audio API (synthesized, no audio files needed).

---

## Theme & World

This is a Die Hard fan game. Lean into it hard — the tone should be fun, reverent, and quotable.

- **The Building:** Nakatomi Plaza — Christmas Eve, 1988
- **The Player:** John McClane — NYPD cop, barefoot, bad day
- **The Boss:** "Chance" Gruber — the mastermind on the rooftop, always calculating the odds
- **Tone references:** "Welcome to the party, pal." / "Now I have a machine gun. Ho ho ho." / "Come out to the coast, we'll get together, have a few laughs." Sprinkle Die Hard quotes and references into flavor text, floor transitions, victory/defeat screens, and helper text where they fit naturally. Don't force it — a well-placed quote lands harder than spamming them.

**Character images already exist** in `die_hard_images/`. Assign them as follows:
- Floor 1 henchman: `dolph.png` — **Rolph Dungreen** (the muscle, all brawn and no brains, blocks the lobby)
- Floor 2 henchman: `hackie.png` — **Hackie Chan** (fast hands, faster mouth — runs security systems on the lower floors)
- Floor 3 henchman: `leslie.png` — **Leslie Sniper** (dead-eye marksman, controls the mid-tower with precision)
- Floor 4 henchman: `sly.png` — **Sylvestor Alone** (grizzled veteran mercenary, the last wall before the boss)
- Final boss ("Chance" Gruber): `chance.png`

Each henchman should have a short flavor blurb (1 sentence, in-character or descriptive) that appears on their floor. Examples: Rolph → "He doesn't think much. He doesn't have to." Hackie → "You won't see him coming — but you'll hear him bragging about it." Leslie → "One shot. That's all he needs." Sylvestor → "He's survived worse than you. Probably."

---

## Core Mechanics (MUST implement exactly)

### The Dice Pool
The player has a single dice pool (starting size depends on difficulty). Dice are spent, risked, and won throughout the game. **The pool is everything** — health, ammo, and currency. Hit 0 = dead.

### Game Structure
4 henchman floors → 1 boss finale. That's it.

### Each Henchman Floor Has Two Phases:

#### Phase 1: DEFEAT (mandatory)
- The henchman has a **Health** number (e.g., 8, 12, 16, 20 across floors).
- The player chooses how many dice (1 to current pool) to commit to a Defeat roll.
- Roll those dice, sum them.
- If sum ≥ Health → henchman defeated, proceed to Phase 2 choice.
- If sum < Health → **lose 1 die from your pool** as a penalty, then try again (still on the same floor). The player can adjust how many dice to commit on the retry.
- Key: dice committed to the Defeat roll are NOT consumed on success — they just determined the roll. The 1-die penalty only happens on failure.

#### Phase 2: LOOT (optional, only after defeating the henchman)
After winning Defeat, the player chooses: **CLIMB** (skip loot, go to next floor) or **LOOT** (gamble for +1 die).

Loot is a single round of **Nakatomi Roll'em** (the poker-with-dice system described below):
- **Critical rule:** The player can only use dice they did NOT commit to the Defeat roll. So if you have 10 dice and used 7 for Defeat, you loot with 3. This is THE central strategic tension of the game.
- The henchman rolls their own Loot Dice (a number visible in the enemy panel **from the very start of the floor** — shown next to Health so players factor it into their Defeat dice decision).
- Both sides find their best 5-dice poker hand from whatever they rolled.
- Better hand wins. **Ties go against the player.**
- Win loot: **+1 die**. Lose loot: **-1 die**.

#### The Big Decision
This is what makes the game interesting and needs to be communicated clearly to the player:
> "Rolling more dice for Defeat is safer — but leaves fewer dice for Loot. Rolling fewer is risky — but if you win, you'll have more dice to gamble with. Every floor is a bet on yourself."

### The Finale: Nakatomi Roll'em vs. "Chance" Gruber

Once all 4 henchmen are down, McClane reaches the rooftop. The finale is a multi-round poker-style dice duel:

1. **Ante:** Both sides put 1 die from their pool into the pot (pot starts at 2).
2. **Roll:** Both sides roll **ALL of their remaining dice** (their full pool). The engine automatically finds the best 5-dice poker hand from each full roll.
3. **Player sees their own hand** and knows how many dice Gruber rolled (but NOT Gruber's hand or dice values — his dice are shown face-down during this phase).
4. **Player decides:** CHECK (go to showdown at current pot) or RAISE (add 1 more die to pot — Gruber must respond).
5. **Gruber responds to a Raise:** either CALL (match the raise, showdown happens) or FOLD (Gruber forfeits his ante; loses 1 die).
6. **Showdown:** Both hands revealed. Loser forfeits their committed pot dice. Ties go against the player.
7. Repeat rounds until one side hits 0 dice.

**Gruber's AI for fold/call decisions:** Gruber should be somewhat predictable but not trivially so. Implement a system where Gruber evaluates his own hand strength on a rough scale and folds weak hands when raised, calls strong hands, and has a ~20-30% bluff/hero-call rate on medium hands. The player should be able to develop a read on him over multiple rounds. Make his fold/call threshold slightly difficulty-dependent. He's Gruber — he should feel calculating, not random.

### Hand Rankings (Nakatomi Roll'em)
From best to worst:
1. **Five of a Kind** (e.g., 4-4-4-4-4)
2. **Four of a Kind** (e.g., 3-3-3-3-6)
3. **Full House** (three of one + pair of another, e.g., 5-5-5-2-2)
4. **Straight** (5 consecutive: 1-2-3-4-5 or 2-3-4-5-6)
5. **Three of a Kind** (e.g., 6-6-6-2-4)
6. **Two Pair** (e.g., 3-3-5-5-1)
7. **One Pair** (e.g., 2-2-4-5-6)
8. **High Card** (nothing else; ranked by highest die, then next, etc.)

When a player or henchman rolls more than 5 dice, the engine must automatically find the **best possible 5-dice hand** from all dice rolled. This is the "best 5-of-N" selection.

Within the same hand rank, break ties by the relevant values (e.g., Four 5s beats Four 3s; a Full House of 6-6-6-2-2 beats 5-5-5-3-3). For High Card, compare highest die descending.

### Difficulty Levels
Three difficulties: **Easy, Medium, Hard**. Affects:
- Player starting dice and Gruber starting dice (tuned values below)
- Henchman health values scale slightly
- Gruber's fold threshold in the finale (harder = Gruber folds less often)

**Tuned difficulty config** (derived from `src/engine/simulate.ts`, 10,000 games per difficulty):

| Difficulty | Player Dice | Gruber Dice | Floor Health        | Gruber Fold Threshold |
|------------|-------------|-------------|---------------------|-----------------------|
| Easy       | 8           | 6           | [8, 11, 15, 19]     | 0.45                  |
| Medium     | 6           | 5           | [6, 9, 12, 16]      | 0.52                  |
| Hard       | 6           | 7           | [8, 11, 15, 20]     | 0.68                  |

Base loot dice per floor: `[3, 4, 4, 5]` (randomized ±1 per run).

### Balance Targets
- Easy: **~75%** win rate
- Medium: **~50%** win rate
- Hard: **~25%** win rate — you need good decisions AND lucky rolls

A simulation script (`src/engine/simulate.ts`) plays automated games using a heuristic AI player. Run it with `npx tsx src/engine/simulate.ts` to verify balance. Tune `config.ts` until the ±7% target bands are met.

---

## Design & Aesthetic

### The Vibe: 1980s Arcade Cabinet
Not pixel art. Not retro-cute. Think the attract screens and cabinet art of **Galaga, Punch-Out!!, and Contra** — bold, loud, confident, slightly dangerous. A CRT in a dark room.

### Visual Direction

**Color palette:**
- Background: near-black (#0a0a0f or similar deep blue-black)
- Primary accent: hot amber/orange (#ff9900 → #ffcc00 range) — this is the "phosphor" color for text, borders, highlights
- Secondary accent: electric cyan (#00e5ff) — for player-side highlights, pool indicators
- Danger/enemy: hot red/crimson (#ff2244) — for enemy elements, damage, warnings
- Success: bright green (#33ff66) — for wins, loot gains
- UI chrome: dark grays with subtle amber borders — panels should feel like inset CRT bezels

**Typography:**
- Use a monospace font for the main game UI (`'Courier New', 'Consolas', monospace` is fine, or import `Press Start 2P` or `VT323` from Google Fonts if you want a more authentic CRT look)
- Title/headings can be bigger and bolder but same family
- ALL CAPS for labels, buttons, section headers. Mixed case for body text and flavor text.

**CRT / Arcade Effects (CSS only, no canvas):**
- Scanline overlay: subtle horizontal lines across the entire viewport (CSS repeating-linear-gradient on a fixed pseudo-element, pointer-events: none, low opacity like 0.03–0.06). Should be barely noticeable — felt, not seen.
- Subtle text-shadow glow on key elements (amber glow on text: `text-shadow: 0 0 8px rgba(255, 153, 0, 0.6)`)
- Panel borders should have a faint glow (box-shadow with spread)
- Optional: a very subtle CRT curvature vignette on the outer edges of the viewport (radial-gradient overlay)
- NO gratuitous animations or particles. The dice roll animation is the main motion. Everything else is crisp and immediate — arcade games don't have easing curves and fade-ins.

**Layout:**
- Centered single column, max-width ~700px
- Generous vertical spacing between sections
- Panels are the primary container — dark inset rectangles with glowing borders
- The status bar (player dice, floor info, enemy info) should be persistent at the top, always visible
- Mobile-friendly — this should work well on a phone screen

### Dice Rendering
- Dice should be rendered as **styled divs**, not images or canvas
- Each die face is a square with rounded corners, showing the number in large monospace text
- Settled dice have a subtle glow matching the panel color
- In hand breakdowns (showing which 5 dice were selected as the best hand), **highlight the selected dice** with a brighter border/glow to distinguish them from unselected dice

### Dice Rolling Experience — THIS IS CRITICAL

The dice roll is the emotional heartbeat of the game. It must feel **physical, tense, and satisfying**. The player should feel anticipation building as each die lands. This is not a spreadsheet — it's a casino.

**Sequential rolling (one die at a time):**
- Dice roll one at a time, left to right, with a stagger between each
- Each individual die goes through a "tumble" phase: the displayed number rapidly cycles through random values (1-6) for ~300-500ms, visually shuffling. The cycling should start fast (~40ms interval) and decelerate slightly toward the end before snapping to the final value. This mimics a physical die bouncing and settling.
- While tumbling, the die should have a visual treatment — a subtle shake/jitter (CSS transform with small random rotations like ±3-5 degrees, toggling rapidly), a brighter glow, maybe a slight scale pulse. It should look alive and unsettled.
- When the die "lands" on its final value: the jitter stops, the number locks in with a crisp snap. A brief scale pop (scale to 1.1 then back to 1.0 over ~100ms) gives it a satisfying weight. The glow settles to the resting color.
- **The pause between dice matters.** After one die settles, wait ~80-150ms (randomized slightly) before the next one starts tumbling. This gap creates rhythm and lets each result breathe. The player watches each number land and reacts before the next one starts.
- For defeat rolls (summing dice vs. health), consider showing a **running total** that updates as each die lands. The player watches the sum climb toward the target — this is where the tension lives. "I need 12... first die: 4... second die: 3... that's 7, I need 5 more... third die..." 

**Timing guidance:**
- Tumble duration per die: 300-500ms (randomize slightly per die for organic feel)
- Settle pause between dice: 80-150ms  
- Total roll of 5 dice should take roughly 2-3 seconds
- Total roll of 10 dice should take roughly 4-5 seconds
- These should feel brisk but not rushed — every die matters

**Sound integration with rolling:**
- Each tumble phase gets a rapid clicking/rattling sound (short noise bursts synced to the number changes)
- Each settle gets a distinct "thunk" — slightly different pitch per die for variety
- The combination should sound like dice clattering on a table and coming to rest one by one

**DO NOT:**
- Roll all dice simultaneously (boring, no tension)
- Show final values instantly with no animation (defeats the purpose)
- Make the animation too slow (>6 seconds for 5 dice kills pacing)
- Use identical timing for every die (feels robotic — randomize slightly)

### Roll Presentation by Context

Different roll types should have slightly different presentations to match their stakes:

**Defeat rolls:** Show dice rolling sequentially with a **running sum counter** below. The counter ticks up as each die lands. Color-code it: amber while below the target health, green the moment it meets/exceeds it. If all dice land and the sum is still red/below target, flash it briefly — the player needs to immediately feel "I missed."

**Loot rolls (Nakatomi Roll'em):** Roll the player's dice first (sequentially), pause ~400ms, then roll the henchman's dice (sequentially). After both are done, pause ~300ms, then **reveal the hand evaluation**: highlight the best-5 selected dice with a glow/border, and display the hand name with a brief slide-in or pop animation. Then show the winner. The two-phase reveal (your hand → their hand → result) builds a "drumroll" moment.

**Finale rolls (vs. Gruber):** Same two-phase approach but with extra weight. Player's dice roll first (full pool, values visible, best-5 highlighted). Then Gruber's dice roll — but **shown face-down throughout the rolling animation** (styled `?` dice, never showing actual pip values). The player sees only the count of dice Gruber rolled, not their values. After betting resolves (Check/Raise), the showdown phase finally flips Gruber's dice to reveal his actual hand. Gruber's dice could animate slightly slower than the player's — he's deliberate, calculating.

### Character Portraits
- Display the character portrait images prominently on each floor and the finale
- Frame them in an arcade-style border (think a character select screen — beveled frame, maybe a name plate underneath)
- Portraits should be roughly 120-160px wide, with the image cropped/covered to fit a consistent aspect ratio

### Sound Design (Web Audio API, synthesized)
Generate simple retro sound effects — no audio files needed:
- **Dice roll:** short burst of noise/clicks during the cycling animation
- **Dice settle:** a satisfying low "thunk" or "click" when each die locks in
- **Win:** ascending arpeggio (3-4 quick ascending tones)
- **Lose:** descending tone (buzzer feel)
- **Defeat success:** punchy impact sound
- **Floor advance:** short fanfare or ascending sweep
- **Button press:** subtle click
- Include a sound ON/OFF toggle in the UI. Default to ON.

---

## UX & Helper Text — THIS IS CRITICAL

The original version of this game had poor onboarding and confusing helper text. **Fix this.** The player should always understand what's happening, what their options are, and what the consequences of their choices will be.

### Welcome Screen / Rules
Do NOT dump all rules as a wall of text. Instead:

**Show a short punchy intro** (2-3 sentences max setting the scene — Christmas Eve, Nakatomi Plaza, things have gone sideways), then teach the rules through a **visual, step-by-step guide** with small illustrations or diagrams:

1. **"Your Dice Pool"** — show a visual of dice with a short sentence: "These are your life. Spend them wisely. Hit zero and you're done."
2. **"The Climb"** — simple tower diagram showing 4 floors + rooftop. "Fight your way up Nakatomi Plaza. Each floor has one of Gruber's men."
3. **"Fighting"** — "Choose how many dice to roll. Beat the henchman's Health number. Miss? Lose a die and try again."
4. **"The Gamble"** — "After a fight, you can LOOT: risk your leftover dice in a poker showdown. Win = +1 die. Lose = -1 die. Or play it safe and CLIMB."
5. **"The Tradeoff"** — THIS is the key insight. Highlight it visually. "Use more dice to fight safely, but you'll have fewer to loot with. Use fewer to fight, and you might fail — but if you win, you can gamble big." Maybe show a simple diagram: [FIGHT DICE ←→ LOOT DICE] with a slider-like visual.
6. **"The Rooftop"** — "Survive the tower and face "Chance" Gruber in Nakatomi Roll'em — poker with dice. Bet, bluff, and outlast him."

Each step should be a compact card or section — not a paragraph. Use icons or small visuals where possible. The whole thing should be scrollable and quick to read (under 60 seconds).

Include a "GOT IT — DEAL ME IN" button at the bottom.

### In-Game Contextual Help

During gameplay, **always show a short helper line** near the action area that explains the current situation. Examples:

- On a floor, before rolling: `"Roll ≥ 12 to beat [Henchman Name]. Using more dice is safer but leaves less for looting."`
- After a failed Defeat roll: `"Missed by 3. You lose 1 die. Adjust and try again."`
- After defeating a henchman: `"[Name] is down. CLIMB to the next floor, or LOOT with your remaining [X] dice for a chance at +1 (risk: -1)."`
- During Loot: `"Your best hand: Three of a Kind (5s). Waiting for [Henchman]'s roll..."`
- Finale ante: `"Round 3. You both ante 1 die. Pot: 2. Roll the bones..."`
- Finale player decision: `"Your hand: Two Pair (6s and 3s). Gruber rolled 5 dice. CHECK to showdown, or RAISE to pressure him (costs 1 more die)."`
- After Gruber folds: `"Gruber folds. You take his ante. +1 die swing in your favor."`

These should be **concise, specific, and always reference the actual numbers**. No generic "Good luck!" filler. The player should never have to do mental math or guess what's at stake.

### Hand Rankings Reference
Include a small collapsible "Hand Rankings" reference panel that's accessible during any Nakatomi Roll'em round (loot or finale). It should show the 8 hand types in order with a tiny example each, in a compact format. Always available, never in the way.

---

## Project Structure

```
/
├── die_hard_images/          # existing character portraits
│   ├── chance.png
│   ├── leslie.png
│   ├── sly.png
│   ├── hackie.png
│   └── dolph.png
├── src/
│   ├── main.tsx              # entry point
│   ├── App.tsx               # top-level game component, state machine
│   ├── App.css               # all styles (single CSS file is fine)
│   ├── engine/
│   │   ├── index.ts          # re-exports
│   │   ├── hands.ts          # hand evaluation, best-5-of-N selection, hand comparison
│   │   ├── combat.ts         # defeat roll resolution, loot resolution
│   │   ├── finale.ts         # Nakatomi Roll'em round logic, Gruber AI
│   │   ├── config.ts         # difficulty configs, floor definitions, balance numbers
│   │   └── types.ts          # all TypeScript types/interfaces
│   ├── ui/
│   │   ├── Die.tsx            # single die component (rolling animation, highlight state)
│   │   ├── DiceRoll.tsx       # row of dice with sequential roll animation
│   │   ├── StatusBar.tsx      # persistent top bar (player dice, floor, enemy info)
│   │   ├── FloorPanel.tsx     # henchman floor UI (portrait, defeat controls, loot choice)
│   │   ├── FinalePanel.tsx    # boss fight UI
│   │   ├── HandDisplay.tsx    # shows a resolved hand with highlighted best-5
│   │   ├── HandRankings.tsx   # collapsible hand rankings reference
│   │   ├── WelcomeScreen.tsx  # title screen, visual rules, difficulty select, start
│   │   ├── GameOverScreen.tsx # victory / defeat end screens
│   │   └── SoundToggle.tsx    # sound on/off
│   ├── audio/
│   │   └── sounds.ts         # Web Audio API synthesized sound effects
│   └── data/
│       └── characters.ts     # henchman/boss names, portraits, flavor text
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.app.json
└── vite.config.ts
```

## Implementation Notes

- **State management:** Use React useState + useReducer. No external state libraries. The game state should be a single well-typed object (phase, playerDice, floor, etc.) managed by a reducer.
- **No localStorage or sessionStorage.** All state lives in memory.
- **The engine (`src/engine/`) must be pure functions with no React dependencies.** It should be fully testable in isolation. Feed it inputs, get outputs. No side effects, no randomness baked in (pass random values in, or use a deterministic roll function for testing).
- **Animations:** CSS transitions/animations only for dice rolling. Use `requestAnimationFrame` or `setInterval` for the dice number cycling. Everything else is instant state changes — no fade-ins, no slide-ups, no spring physics. Arcade games snap.
- **The `die_hard_images/` folder is in the project root.** Configure Vite's `publicDir` or reference them correctly so they're served. The images should be referenced from the components by their path.
- **Mobile responsive:** Test at 375px width. The game should be fully playable on mobile with no horizontal scrolling. Buttons should be large enough to tap (minimum 44px touch targets).
- Write unit tests for the hand evaluation engine using Vitest (the project already has it as a devDependency target). At minimum test: each hand type is correctly identified, best-5-of-N selection works, hand comparison/ranking works, edge cases (ties, multiple valid hands from same roll).

## Final Checklist
- [ ] `npm run dev` starts the game with no errors
- [ ] Welcome screen teaches the game visually in under 60 seconds of reading
- [ ] Difficulty selector works (Easy / Medium / Hard)
- [ ] 4 henchman floors with character portraits, names, flavor text
- [ ] Defeat mechanic: choose dice count, roll, sum vs health, fail = lose 1 die
- [ ] Loot mechanic: optional post-defeat gamble, uses only non-Defeat dice, best-5 poker hand comparison
- [ ] Helper text is always specific and contextual (references actual numbers, names, stakes)
- [ ] Finale: multi-round Nakatomi Roll'em vs Gruber with ante, check/raise, fold/call, showdown
- [ ] Finale: both sides roll their full remaining dice pool (not capped at 5); best-5-of-N selection applied
- [ ] Finale: Gruber's dice shown face-down during roll animation and betting phase — only revealed at showdown
- [ ] Floor enemy panel shows both Health AND Loot Dice count from the start of the floor
- [ ] Gruber AI makes semi-intelligent fold/call decisions
- [ ] Hand rankings reference available during all poker rounds
- [ ] Dice roll animation (sequential, satisfying)
- [ ] Synthesized sound effects with toggle
- [ ] CRT/arcade aesthetic (scanlines, glow, dark theme, monospace)
- [ ] Mobile responsive
- [ ] Victory and defeat screens
- [ ] Engine unit tests pass
