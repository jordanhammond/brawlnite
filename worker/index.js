// BrawlNite server: serves the game and the high score API (specs/14-online-and-high-scores.md).
import { checkName, matchScore } from '../shared/rules.js';

const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
});
async function sha256(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}
const nameKey = (name) => name.toLowerCase().replace(/[\s_-]+/g, '');
const HERO_RE = /^[a-z]{2,12}$/;
const MIN_MATCH_GAP = 15000;     // ms between results from one player
const REG_PER_HOUR = 10;         // new names per network per hour

async function readBody(req) {
  try { return await req.json(); } catch (e) { return {}; }
}

async function register(req, env) {
  const body = await readBody(req);
  const check = checkName(body.name);
  if (!check.ok) return json({ error: check.reason }, 400);
  const ipHash = await sha256('bloknite:' + (req.headers.get('CF-Connecting-IP') || 'unknown'));
  const now = Date.now();
  const recent = await env.DB.prepare('SELECT COUNT(*) AS n FROM registrations WHERE ip_hash = ? AND ts > ?').bind(ipHash, now - 3600e3).first();
  if (recent.n >= REG_PER_HOUR) return json({ error: 'too_many' }, 429);
  const id = crypto.randomUUID();
  const token = crypto.randomUUID() + crypto.randomUUID();
  try {
    await env.DB.prepare('INSERT INTO players (id, name, name_key, token_hash, created) VALUES (?, ?, ?, ?, ?)')
      .bind(id, check.name, nameKey(check.name), await sha256(token), now).run();
  } catch (e) {
    if (String(e).includes('UNIQUE')) return json({ error: 'taken' }, 409);
    throw e;
  }
  await env.DB.batch([
    env.DB.prepare('INSERT INTO registrations (ip_hash, ts) VALUES (?, ?)').bind(ipHash, now),
    env.DB.prepare('DELETE FROM registrations WHERE ts < ?').bind(now - 86400e3),
  ]);
  return json({ id, token, name: check.name });
}

async function postMatch(req, env) {
  const body = await readBody(req);
  const p = await env.DB.prepare('SELECT * FROM players WHERE id = ?').bind(String(body.id || '')).first();
  if (!p || p.token_hash !== await sha256(String(body.token || ''))) return json({ error: 'unauthorized' }, 401);
  const place = Number(body.place), elims = Number(body.elims);
  if (!Number.isInteger(place) || place < 1 || place > 10 || !Number.isInteger(elims) || elims < 0 || elims > 9) return json({ error: 'invalid' }, 400);
  const now = Date.now();
  if (now - p.last_match < MIN_MATCH_GAP) return json({ error: 'too_fast' }, 429);
  const hero = HERO_RE.test(body.hero) ? body.hero : null;
  const score = matchScore(place, elims);
  const won = place === 1 ? 1 : 0;
  // SQLite evaluates every SET expression against the old row, so both CASEs compare with the previous best
  await env.DB.prepare(`UPDATE players SET games = games + 1, wins = wins + ?, elims = elims + ?, last_match = ?,
      best_hero = CASE WHEN ? > best_score THEN ? ELSE best_hero END,
      best_score = CASE WHEN ? > best_score THEN ? ELSE best_score END
    WHERE id = ?`).bind(won, elims, now, score, hero, score, score, p.id).run();
  const me = await env.DB.prepare('SELECT wins, best_score FROM players WHERE id = ?').bind(p.id).first();
  const rankWins = await env.DB.prepare('SELECT COUNT(*) + 1 AS r FROM players WHERE wins > ?').bind(me.wins).first();
  const rankBest = await env.DB.prepare('SELECT COUNT(*) + 1 AS r FROM players WHERE best_score > ?').bind(me.best_score).first();
  return json({ score, best: me.best_score, newBest: score > p.best_score, wins: me.wins, rankWins: rankWins.r, rankBest: rankBest.r });
}

async function leaderboard(env) {
  const [wins, best] = await env.DB.batch([
    env.DB.prepare('SELECT name, wins, games FROM players WHERE wins > 0 ORDER BY wins DESC, games ASC LIMIT 20'),
    env.DB.prepare('SELECT name, best_score AS score, best_hero AS hero FROM players WHERE best_score > 0 ORDER BY best_score DESC, created ASC LIMIT 20'),
  ]);
  return json({ wins: wins.results, best: best.results });
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (!url.pathname.startsWith('/api/')) return env.ASSETS.fetch(req);
    try {
      if (req.method === 'GET' && url.pathname === '/api/leaderboard') return await leaderboard(env);
      if (req.method === 'POST' && url.pathname === '/api/register') return await register(req, env);
      if (req.method === 'POST' && url.pathname === '/api/match') return await postMatch(req, env);
      return json({ error: 'not_found' }, 404);
    } catch (e) {
      console.error(e);
      return json({ error: 'server_error' }, 500);
    }
  },
};
