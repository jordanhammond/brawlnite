# 15 · Multiplayer (play with friends) 🔧

The boys fight **each other and the bots** in the same match, each on their own device, even from different houses.

## The big decisions ✅
- ✅ Real players and bots all fight in the same match
- ✅ Friends join with a **room code**, so strangers can't get in
- ✅ It works from **different houses** (over the internet, not just the same Wi-Fi)
- ✅ If the host leaves, **the match ends for everyone**
- ✅ Online matches **count toward the high score lists**

## Only when online 🔧
- Multiplayer needs the web address (brawlnite.mattlucas.live)
- Opened as a local file, the multiplayer buttons are hidden and solo play works as before

## Hosting and joining 🔧
- The main menu gets two new buttons: **👥 Host game** and **🔑 Join game**
- **Host game:**
  - Creates a room and shows a code, like **`LAVA-42`**: a fun word plus 2 digits that's easy to read out over the phone
  - The host's bot difficulty setting is used for the match
- **Join game:** type the code (capitals don't matter) and press **▶ JOIN**
  - Wrong code: "Can't find that room. Check the code 🙂"
  - Room full or already started: "That match already started. Ask for a new code!"
- Codes expire when the match starts or after 30 minutes of nothing happening

## Waiting room (lobby) 🔧
- Everyone sees the room code and a list of who's in: "👑 Leo · 🍃 Barf Bush", "Max · ⚡ Zippy"
- Each player picks **their own hero** from **their own unlocked heroes**, and can change it until the match starts
- Two players can pick the same hero
- **Only the host** has the **▶ START** button. It works with just the host, too.
- Anyone can tap **Leave**. If the host leaves, everyone sees "Host left 😢" and goes back to the menu.
- Up to **10 players**. Bots fill the empty places so there are always 10 heroes.

## In the match 🔧
- It plays exactly like solo: same map, storm, pickups, launch pads, supers
- Bots attack real players and each other like normal (see 07)
- Real players get a **gold name tag**, and bots keep their normal tag, so you can spot your friends
- The kill feed uses real names: "Leo eliminated Max"
- **No pausing** online. Esc shows a see-through menu with **Click to resume** and **Leave match**, and the game keeps running behind it (your hero stands still).
- When you're eliminated, you **watch the rest of the match** (the camera follows whoever beat you, and you can switch to another hero), or tap **Back to menu**
- The end screen is the same as solo, plus a **Play again together** button that sends everyone back to the same waiting room

## When things go wrong 🔧
| What happens | What players see |
|---|---|
| Host's internet drops | "Host left 😢" → back to the menu |
| A guest's internet drops | Their hero stands still for 10 sec, then is eliminated. Others see "Max disconnected". |
| A guest closes the tab | Same as above |
| Lag spike | Your own hero keeps moving smoothly. Others may jump a little to catch up. |

## High scores 🔧
- Every real player in the match gets their result posted, the same as solo (see 14)
- Wins against friends count as normal wins
- **Unlocks** (see 12) work the same as solo

## How it works (tech) 🔧
- **Host-runs-the-game:** the host's browser runs the match (bots, storm, damage) using the existing game code
- **Guests** send their keys and mouse aim to the host 20 times a second
- The **host** sends everyone a snapshot (positions, health, effects) 20 times a second, plus events (attacks, supers, eliminations) that guests replay so shots and effects look the same
- A **Cloudflare Durable Object** (one per room) passes messages between them over WebSockets. It doesn't run the game.
- **Smoothing (for different houses):**
  - Your own hero moves instantly on your screen (prediction), then gently corrects to what the host says
  - Other heroes are drawn slightly in the past and slid smoothly between snapshots (interpolation)
- Guests still show their own effects (particles, sounds) locally, so the game feels the same
- If the host switches to another tab, a background timer keeps the match running (browsers stop drawing hidden tabs)
- Sending results: the host reports the match places and eliminations for everyone. Each guest's browser posts its own score with its own secret key (see 14).

## Anti-cheat (light) 🔧
- The host's browser decides who wins, so a host with dev tools could cheat. The fix is the same as 14: the parent delete command.
- The server limits rooms to 10 players, and the code only works until the match starts

## Testing 🔧
- `?room=LAVA-42` in the address joins that room straight away
- Two browser windows on one computer can play together, to test without a second device
- Locally: `npm run dev`, then open http://localhost:8787 in two windows
