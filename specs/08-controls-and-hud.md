# 08 · Controls and HUD

## Controls ✅ 🔧
| Action | Key |
|---|---|
| Move | **W A S D** |
| Turn / aim | **Mouse** (locked to the game), or **← →** arrow keys |
| Attack | **Left click** (hold to keep firing) |
| Super | **E** |
| Jump | **Space** |
| Pause | **Esc** |

- 🔧 Works with a Chromebook touchpad. The arrow keys help when there's no mouse.
- 🔧 The mouse also tilts the camera up and down a little, but attacks always fire flat and straight ahead.

## Camera ✅
- Third person, behind and slightly above the hero, like in Fortnite
- 🔧 Slight over-the-shoulder offset with a crosshair in the middle

## HUD 🔧
- **Bottom centre:** hero name, health bar (green), and super bar (yellow, pulses when ready, "Press E")
- **Above the health bar:** active pickup effects with timers
- **Top centre:** "🧍 7 left" plus the storm timer
- **Top left:** kill feed (last 5)
- **Top right:** round minimap showing the island, volcano, lava, storm circles, and the player as an arrow (no enemies, like Fortnite)
- **Over bots:** name and a small health bar (hidden while they're invisible)
- **Damage numbers** pop up where hits land

## "Heroes left" banner ✅
A big banner flashes in the middle of the screen as the match closes in (the boys' request, 2026-10-03).
- 🔧 Shown when **5**, **3** and **2** heroes are left:
  - 5 → "🔥 5 LEFT!"
  - 3 → "⚠️ 3 LEFT!"
  - 2 → "⚔️ FINAL 2!"
- 🔧 If several heroes go out at once, the banner shows the real number left (for example 6 → 4 shows "🔥 4 LEFT!")
- 🔧 It pops in, stays about 2 sec, then fades, with a short alert sound
- 🔧 Only shown while the player is still alive

## Touch controls (phones and tablets) 🔧
For [GitHub issue #2](https://github.com/jordanhammond/brawlnite/issues/2): more people can play on more devices. Fortnite-mobile style.

### When they show
- 🔧 Only on touch devices (the first touch switches them on). Desktop and Chromebook stay exactly as they are.
- 🔧 If a keyboard or mouse gets used, the touch buttons hide again.

### Landscape only
- 🔧 Holding the device upright shows a full-screen **"🔄 Turn your device sideways"** message. A match in progress pauses behind it.
- 🔧 Try to lock the screen to landscape when a match starts (works on Android, but iPhones ignore it, so the message is the backup).

### Layout
| Action | Touch |
|---|---|
| Move | **Joystick** on the left thumb |
| Turn / aim | **Drag** anywhere on the right half of the screen |
| Attack | **🔥 Attack** button, bottom right (hold to keep firing) |
| Super | **⭐ Super** button above Attack. Greyed out until the super bar is full, then it glows |
| Jump | **⬆ Jump** button to the left of Attack |
| Pause | **⏸** button, top centre under the "left" counter |

- 🔧 **Joystick:** it appears wherever the left thumb lands, so it works for any hand size. Push further to go faster, and it's full speed near the edge.
- 🔧 **Aim drag:** left/right turns the hero, up/down tilts the camera a little, the same as the mouse. Boomer's aim ring still moves with the tilt.
- 🔧 **You can aim while you attack.** Sliding your thumb off the Attack button turns the hero too, like Fortnite's fire button.
- 🔧 Action buttons are big (72 px, Attack 96 px) and see-through, so they don't hide the action. Pause is a little smaller (52 px).
- 🔧 Tablets get slightly bigger buttons, spaced further apart.

### HUD changes on touch
- 🔧 "Press E" under the super bar becomes "Tap ⭐".
- 🔧 The minimap gets a bit smaller on phones, so the Pause button and kill feed fit.
- 🔧 The crosshair stays in the middle.

### Stop the browser getting in the way
- 🔧 No pinch-zoom, double-tap zoom, pull-to-refresh, text selection or long-press menus during a match.
- 🔧 Touch devices skip the mouse lock, so losing the mouse lock never pauses the game there.
- 🔧 Fullscreen when a match starts, where the browser allows it.

### Menus
- 🔧 Menus and the waiting room already work with taps. Typing a name or room code uses the device's own keyboard.
- 🔧 Hero cards and buttons are big enough to tap on a phone.

### Speed
- 🔧 Phones use the same low-draw-call setup as the Chromebook. If it's still slow, lower the resolution on small screens first.
