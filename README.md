# BrawlNite 🌋

A battle royale game for the browser, designed by the boys. Roblox-style heroes, Brawl Stars abilities, Fortnite gameplay.

## Play
- Open `dist/BrawlNite.html` in Chrome. It needs no internet and no install.
- To play on the Chromebook, copy that one file over (Google Drive or USB), then open it in Chrome.

## Controls
WASD move · Mouse aim (or ← →) · Click attack · E super · Space jump · Esc pause

## Make changes
- Edit `src/index.html` (screens and HUD) or `src/game.js` (the game)
- Run `python3 build.py` to rebuild `dist/BrawlNite.html`
- The design lives in `specs/`, and reference art goes in `art/`

## Live site
https://brawlnite.mattlucas.live (Cloudflare Worker `brawlnite` + D1 database `brawlnite`). The custom domain is set in `wrangler.toml`. Also still reachable at https://brawlnite.run-with-it-account.workers.dev

## Put it online (Cloudflare, free)
One-time setup, run in this folder:
1. Make a free account at https://dash.cloudflare.com/sign-up
2. `npx wrangler login`: a browser opens; click **Allow**
3. `npx wrangler d1 create brawlnite`: copy the `database_id` it prints into `wrangler.toml`
4. `npm run db:init`: creates the high score tables
5. `npm run deploy`: prints your web address, e.g. `https://brawlnite.<your-name>.workers.dev`

After any change to the game, just run `npm run deploy` again.

## Auto-deploy (GitHub Actions)
Every push to `main` builds the game and deploys it to Cloudflare (`.github/workflows/deploy.yml`). Watch it in the repo's **Actions** tab.

It needs two repo secrets (GitHub → Settings → Secrets and variables → Actions):
- `CLOUDFLARE_ACCOUNT_ID`: shown by `npx wrangler whoami`
- `CLOUDFLARE_API_TOKEN`: Cloudflare dashboard → My Profile → API Tokens → Create Token → **Edit Cloudflare Workers** template. Under Zone Resources pick `mattlucas.live`, and add **Zone · DNS · Edit** so it can manage the custom domain.

## Remove a player (rude name that slipped through, or a cheater)
```
npx wrangler d1 execute brawlnite --remote --command "DELETE FROM players WHERE name_key = 'badname'"
```
`name_key` is the name in lowercase with spaces, `-` and `_` removed. To see everyone:
```
npx wrangler d1 execute brawlnite --remote --command "SELECT name, name_key, wins, best_score FROM players ORDER BY wins DESC"
```
To block more words, add them to `shared/rules.js`, then run `npm run deploy`.

## Test the online version on this computer
`npm run db:init:local && npm run dev`, then open http://localhost:8787
