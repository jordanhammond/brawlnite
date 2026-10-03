-- BrawlNite high scores (specs/14-online-and-high-scores.md)
CREATE TABLE IF NOT EXISTS players (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  name_key    TEXT NOT NULL UNIQUE,   -- lowercase, no spaces: "Leo" and "l eo" are the same name
  token_hash  TEXT NOT NULL,          -- sha256 of the secret only that player's browser holds
  wins        INTEGER NOT NULL DEFAULT 0,
  games       INTEGER NOT NULL DEFAULT 0,
  elims       INTEGER NOT NULL DEFAULT 0,
  best_score  INTEGER NOT NULL DEFAULT 0,
  best_hero   TEXT,
  last_match  INTEGER NOT NULL DEFAULT 0,
  created     INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_players_wins ON players (wins DESC);
CREATE INDEX IF NOT EXISTS idx_players_best ON players (best_score DESC);

-- new-name rate limit (network address stored only as a hash)
CREATE TABLE IF NOT EXISTS registrations (
  ip_hash TEXT NOT NULL,
  ts      INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_registrations ON registrations (ip_hash, ts);
