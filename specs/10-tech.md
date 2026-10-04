# 10 · Tech

## Stack 🔧
- **HTML + JavaScript**, no framework
- **Three.js r149** for 3D. It's the last version with a classic `three.min.js` build, so it works when the file is opened with a double-click (`file://`).
- **Web Audio API** for sounds

## Files
```
bloknite/
  specs/          ← these docs
  art/            ← reference images for styling (not used by the game directly)
  src/
    index.html    ← page, styles, HUD and menus
    game.js       ← all game code
  vendor/
    three.min.js  ← Three.js (offline copy)
  shared/
    rules.js      ← name filter + match score (used by the game AND the server)
  worker/
    index.js      ← Cloudflare Worker: serves the game + /api (see 14)
    schema.sql    ← high score database tables
  wrangler.toml   ← Cloudflare settings
  package.json    ← npm scripts: build, dev, deploy, db:init
  build.py        ← inlines everything into one file
  dist/
    BrawlNite.html ← the single file to play
```

## Build 🔧
- `python3 build.py` writes `dist/BrawlNite.html` with Three.js and the game inlined
- The result is one self-contained file of about 700 KB that needs no internet

## Getting it onto the Chromebook 🔧
- Copy `dist/BrawlNite.html` over (Google Drive, USB stick, or email), then open it in Chrome
- Or publish it as a private web link and open it on the Chromebook

## Performance budget (Chromebook Plus) 🔧
- Low-poly meshes, flat colours, and a few canvas-drawn textures
- No real-time shadows. Each hero gets a cheap dark "blob" shadow instead.
- Particles come from a reused pool, capped at about 700
- Frame time is capped (dt ≤ 0.05 s) so a lag spike doesn't break the physics

### Fewer draw calls (GitHub issue #1: stutters on the Chromebook) 🔧
Measured 2026-10-03: game code takes under 1 ms a frame, but the graphics chip was asked to draw 400–850 separate pieces a frame (about 1,600 in the scene). That's what causes the stutters in busy fights.
- **Map scenery is merged** after it's built: all rocks, towers, crates, torches, mountains and clouds that share a material become one mesh (about 450 pieces → about 25)
- **Particles are drawn as one batch** (an instanced mesh for cubes and one for leaves) instead of up to 700 separate pieces
- **Each hero's body parts are merged** per limb (parts that move together become one piece, with each part's colour stored in the shape), keeping animation, hit flash and invisibility working
- **Auto quality:** if frames are slow for a couple of seconds, the game lowers its drawing resolution a step (down to 70%). It goes back up when there's room again.
- ✅ Result (headless test, same match): pieces in the scene 1,586 → 262; draw calls per frame median 395 → 162, busiest frame 855 → 210

## Code structure (game.js) 🔧
- `HEROES`: data for the 4 heroes (stats, colours, attack and super settings)
- `WORLDS` + `setWorld()`: each world (`buildLava()`, `buildCandy()`) is built into its own group the first time it's needed, with a fixed seed so every player gets the same map
- `Hero`: model, movement, collision, attack, super, effects
- `Projectile` types: bolt, zap, bomb, rocket
- `Pickups`, `Storm`, `Particles`, `Audio`
- `botThink()`: AI
- `HUD`: DOM updates and minimap
- Main loop: input → bots → heroes → projectiles → storm/lava → pickups → camera → render → HUD

## Test hooks 🔧
- `BrawlNite.html?auto=<hero>` starts a match straight away (hero = brickster, zippy, boomer, or barf). Add `&world=candy` for Candy Land.
- `window.__bloknite` exposes `heroes`, `player`, `storm`, `simulate(dt)`, `attack`, and `useSuper` for headless tests
- Simulated full match: lasts about 2:45, and the storm closes at about 2:25 as designed
