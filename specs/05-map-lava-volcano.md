# 05 · Map: Lava Volcano ✅

✅ **Decision:** keep the simple round island layout. Borrow the **look** from `art/map/Volcanic Lava Arena Adventure.png` (the art's plateaus, rivers and bridges layout was not chosen).

🖼️ Reference images go in `art/map/`

## Layout 🔧
- A round **rock island** (radius ~90) floating in a **sea of lava**
- A **big volcano** in the centre (radius ~14, height ~22), with glowing lava in the crater and smoke rising
- **About 10 lava pools** scattered around, of different sizes
- **About 35 boulders** for cover. They block movement and shots.
- Heroes can't leave the island (there's an invisible wall at the edge)

## Lava ✅
- ✅ Touching lava hurts: 🔧 30 HP/sec
- 🔧 Lava pools glow and the surface slowly moves
- 🔧 Heroes **can** walk into lava, which hurts. Bots try to avoid it.

## Obstacles
- 🔧 Boulders and the volcano block heroes and straight shots (bolts, zaps, rockets)
- 🔧 Boomer's lobbed bombs fly **over** obstacles
- 🔧 Barf Bush's leaf barf and leaf laser pass through obstacles (keeps it simple)

## Launch pads ✅
Bounce pads that throw you high across the map (the boys' request, 2026-10-03).
- 🔧 **6 pads:** 3 in a ring near the volcano and 3 out on the island, never in lava or rocks
- 🔧 Step on one and you fly **up and forward**, in the direction you're facing, about 30 units
- 🔧 You can still steer a little and attack while in the air
- 🔧 High in the air you fly **over** boulders, crates and towers, but not the volcano
- 🔧 Good for escaping the storm or jumping into a fight. Watch out: you can land in lava!
- 🔧 Bots don't aim for pads, but they get launched if they walk onto one
- 🔧 No damage for landing
- 🔧 **Look:** a dark metal base with a glowing cyan top, a white up-arrow, and a ring that pulses upward
- 🔧 A "boing" sound and a cyan trail while flying, then a dust puff on landing
- 🔧 Shown on the minimap as cyan dots

## Look and feel ✅ (from art)
- **Blue sky** with soft clouds, and a big dark smoke plume rising from the volcano
- The volcano is erupting, with **glowing lava streaks** running down its sides
- **Purple-grey cracked stone** ground, with chunky blocky boulders and rock pillars
- Bright **orange-yellow glowing lava** with a moving surface
- Rocky mountains on the horizon, around the lava sea
- 🔧 A little warm haze near the ground, plus floating embers

## Props ✅ (from art)
Props are obstacles: they block movement and straight shots.
- **Wooden crates** with metal corners (singles and stacks)
- **Wooden watchtowers** with a **red skull banner**
- **Yellow and black chevron barriers**
- 🔧 Torches or lanterns on posts

## Spawn points 🔧
- 10 spots evenly spaced in a ring at radius ~60, nudged away from rocks and lava
