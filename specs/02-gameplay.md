# 02 · Gameplay

## Match flow
1. **Menu:** pick a hero and a bot difficulty, then press Play
2. **Spawn:** all 10 heroes start spread around the edge of the island (radius ~60). 🔧
3. **Landing (10 sec) 🔧:** bots don't attack yet, so you have time to grab pickups. The HUD counts down.
4. **Fight:** explore, grab pickups, and battle
5. **Storm** shrinks in phases and pushes everyone together (see 06-storm)
6. **End:**
   - The player is eliminated → "Eliminated! You placed #N"
   - The player is the last one alive → "🏆 YOU WON! Last one standing!" ✅

## Health and elimination
- ✅ Every hero has HP. At 0 HP the hero is eliminated.
- 🔧 There are no respawns. One life per match.
- 🔧 An eliminated bot drops a 🩹 Health pickup where it fell.
- 🔧 The kill feed shows "Zippy-Bot eliminated Sir Pickles".

## Damage sources
| Source | Damage | Notes |
|---|---|---|
| Hero attacks and supers | see 03-heroes | |
| Lava | 🔧 30 HP/sec | while standing in a lava pool |
| Storm | 🔧 4 → 8 → 15 → 25 HP/sec | gets worse each phase |

## Super charge (Brawl Stars style)
- ✅ Each hero has a super meter from 0 to 100%
- 🔧 It fills mainly by **dealing damage** with the main attack
- 🔧 It also fills slowly on its own (+2% per second)
- 🔧 Damage dealt by a super does **not** charge the super
- 🔧 Press **E** when the meter is full. It resets to 0 after use.
- 🔧 A full meter glows and pulses on the HUD

## Feedback
- 🔧 Damage numbers pop up over a hero when you hit them
- 🔧 A hero flashes white when hit
- 🔧 The screen edges flash red when the player takes damage
- 🔧 The game warns "You're in the storm!" and "You're in lava!"

## Match length target
- 🔧 About 2–4 minutes. The storm forces the end by about 3 minutes.
