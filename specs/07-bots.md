# 07 · Bots

✅ Version 1 is one player vs. bots. Bots fight **each other too**, not just the player.

## Brain (re-checked about every 0.3 sec) 🔧
Bots pick what to do in this order of priority:
1. **Outside or near the storm edge** → run toward the safe zone
2. **An enemy is visible within ~35 units** → fight:
   - Keep a preferred distance based on its hero (Zippy and Barf close, Boomer far)
   - Strafe side to side, switching direction every 1–2 seconds
   - Attack when the enemy is in range
   - Use the super when it's charged and the enemy is in super range
3. **Low on health, or a pickup is within ~25 units** → go grab it
4. **Otherwise** → wander toward a random spot inside the safe zone

## Rules 🔧
- Bots steer around rocks, the volcano, and lava pools
- Bots ignore invisible heroes
- Bots aim with a little random error, based on difficulty

## Difficulty 🔧

| Setting | Aim error | Reaction delay | Bot damage |
|---|---|---|---|
| 😊 Easy | big | slow (0.8 s) | 55% |
| 😎 Normal | medium | 0.35 s | 100% |
| 😈 Hard | small | fast (0.15 s) | 115% |
