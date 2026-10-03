# 04 · Pickups

✅ All four were designed by the boys.

🖼️ Reference images go in `art/pickups/`

| Pickup | Icon ✅ | Effect | Duration |
|---|---|---|---|
| **Strength** | 💪 big bicep | 🔧 +50% damage | 🔧 10 sec |
| **Speed** | ⚡ lightning bolt | 🔧 +60% move speed | 🔧 8 sec |
| **Health** | 🩹 medical kit (white box, red cross) | 🔧 heals 60 HP (up to max) | instant |
| **Invisibility** | 🧥 cloak | ✅ other heroes can't see you | ✅ 5 sec |

## Behaviour
- 🔧 There are 24 pickups on the map at the start, in random spots (never in lava or rocks)
- 🔧 Each pickup floats, spins, and has a glowing ring on the ground
- 🔧 Walk into a pickup to grab it
- 🔧 A grabbed pickup respawns somewhere new after 25 seconds
- 🔧 Grabbing the same effect again resets its timer (they don't stack)
- 🔧 Bots pick them up too

## Invisibility details
- ✅ Invisible bots disappear completely for the player, name tag included
- 🔧 When the player is invisible, they see their own hero as see-through, so they know it's working
- 🔧 Bots can't target an invisible hero, and they lose track of a target that goes invisible
- 🔧 Hits still do damage, so you can be hit by accident

## HUD
- 🔧 Active effects appear above the health bar with seconds left, for example: `💪 7`  `🧥 3`
