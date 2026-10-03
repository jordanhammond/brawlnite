# 14 · Online Version and High Scores ✅

## Hosting ✅
- ✅ Hosted on **Cloudflare** (free plan): one Cloudflare **Worker** serves the game and a small API
- 🔧 Scores live in a **Cloudflare D1** database (SQLite)
- ✅ Web address: **brawlnite.mattlucas.live** (the boys' domain)
- ✅ Every push to `main` on GitHub deploys automatically (GitHub Actions)
- 🔧 Same game file everywhere:
  - opened from a web address → **online**: high scores are on
  - opened as a local file → **offline**: plays exactly as before, with no high scores
- 🔧 If the server can't be reached, the game still plays and just skips posting the score

## High score lists ✅ (two tabs)
| Tab | Ranks by | Example |
|---|---|---|
| 🏆 **Most wins** ✅ | total wins | "Leo · 12 wins" |
| ⭐ **Best match** ✅ | best single-match score | "Max · 275 · 🦖 Chomp" |

- 🔧 Top 20 on each list, and your own row is highlighted
- 🔧 Reached from a "🏆 High scores" button on the menu
- 🔧 The end screen shows "⭐ Match score 175 · Your best 210 · #3 in wins"

### Match score 🔧
- **Win:** +100
- **Each elimination:** +25
- **Placing:** +5 for each place above last (1st = +50, 10th = +5)
- Example: a win with 3 eliminations = 100 + 75 + 50 = **225**
- The **server** calculates the score; the game only reports place, eliminations, and hero

## Names online 🔧
- **Online names are unique:** "Leo" and "leo" are the same name. If it's taken: "That name's taken. Try another, like Leo7"
- The first time a name is used online, the server creates a secret key for it, and that browser keeps it. Only that browser can post scores as that name.
- Local profiles from before still work. They join the leaderboard the first time they play online, if the name is free.
- The name screen says: **"Use a nickname, not your real full name. It shows on the public high score list."**

## Name filter (no rude names) ✅
- ✅ Rude, sexual, and hateful names are **blocked**
- 🔧 Checked in **two places**:
  1. **In the game:** instant friendly message: "Let's pick a different name 🙂"
  2. **On the server** (the real guard): rejects the name even if someone bypasses the game
- 🔧 It catches tricks: different capitals, spaces and symbols (`F u_c.k`), number swaps (`5h1t`), and repeated letters (`fuuuck`)
- 🔧 Short words (`ass`, `tit`, …) are only blocked as a whole word or at the start or end of a name, with an allow-list for innocent names (`Cassidy`, `Titan`, `Assassin`, `Essex`, …)
- 🔧 The word lists live in `shared/rules.js`, so they're easy to add to
- 🔧 **Backstop:** a parent can delete any player with one command (see README "Remove a player")

## Anti-cheat (light) 🔧
- The server checks every result: place 1–10, eliminations 0–9, at most one match every 15 s per player
- New names are limited to 10 per hour from the same network
- A determined kid with browser dev-tools could still fake scores. For a friends' game, the delete command is the fix.

## Privacy 🔧
- Only the nickname, wins, games, eliminations, and best score are stored
- Network addresses are stored only as a one-way hash, and only for the new-name rate limit
