// BrawlNite: rules shared by the game and the server (specs/14-online-and-high-scores.md).
// The build inlines this into the game; the Cloudflare Worker imports it.
// To block more words, add them to STRONG or WEAK below (lowercase, letters only).

// Blocked anywhere inside a name (after cleaning up tricks like f.u.c.k, 5h1t, fuuuck).
const STRONG = [
  'fuck', 'fuk', 'fck', 'phuck', 'shit', 'bitch', 'biatch', 'cunt', 'dick', 'cock', 'pussy', 'penis', 'vagina',
  'porn', 'sex', 'slut', 'whore', 'rape', 'rapist', 'nazi', 'hitler', 'boob', 'tits', 'nipple', 'dildo', 'horny',
  'bastard', 'wank', 'jizz', 'semen', 'sperm', 'orgasm', 'pedo', 'pedophile', 'molest', 'nigg', 'nigga', 'faggot',
  'fagot', 'retard', 'tranny', 'kike', 'chink', 'spic', 'wetback', 'nude', 'naked', 'blowjob', 'handjob',
  'testicle', 'scrotum', 'erection', 'stripper', 'hooker', 'kkk', 'killyourself', 'suicide', 'bollock',
  'twat', 'prick', 'douche', 'motherf', 'stfu', 'wtf', 'milf', 'thot', 'xxx', 'butthole', 'arse',
];
// Blocked as a whole word, or at the start/end of a name (they hide inside innocent words).
const WEAK = ['ass', 'tit', 'cum', 'anal', 'anus', 'hoe', 'fag', 'coon', 'paki', 'damn', 'hell', 'crap', 'piss', 'butt', 'sexy', 'gay', 'kys'];
// Innocent names that contain a blocked piece.
const ALLOW = [
  'cassidy', 'cassie', 'class', 'classy', 'bass', 'grass', 'glass', 'pass', 'assassin', 'assist', 'massive', 'titan',
  'titanic', 'title', 'titus', 'essex', 'sussex', 'middlesex', 'dickens', 'hancock', 'peacock', 'cocktail', 'shitake',
  'scunthorpe', 'cumulus', 'hello', 'shell', 'michelle', 'hellboy', 'hoeman', 'analog', 'butter', 'butters', 'button',
  'raccoon', 'tycoon', 'cocoon', 'pakistan', 'spice', 'spicy', 'prickly', 'nudel', 'grape', 'drape', 'therapist',
  'scrape', 'arsenal', 'parse', 'sparse', 'harsh', 'torpedo', 'hitchcock', 'janus', 'manus', 'skys'
];

const LEET = { 0: 'o', 1: 'i', 2: 'z', 3: 'e', 4: 'a', 5: 's', 6: 'g', 7: 't', 8: 'b', 9: 'g', '@': 'a', $: 's', '!': 'i', '|': 'i', '+': 't', '€': 'e' };
const squash = (s) => [...s.toLowerCase()].map((c) => LEET[c] || c).join('').replace(/[^a-z]/g, '');
const collapse = (s) => s.replace(/(.)\1+/g, '$1');      // fuuuck -> fuck
const collapse2 = (s) => s.replace(/(.)\1{2,}/g, '$1$1'); // boooob -> boob, asss -> ass

// Returns { ok: true, name } with the tidied name, or { ok: false, reason: 'invalid' | 'bad_word' }.
export function checkName(raw) {
  const name = String(raw || '').replace(/[^A-Za-z0-9 _-]/g, '').replace(/\s+/g, ' ').trim().slice(0, 12);
  if (name.length < 2 || !/[A-Za-z]/.test(name)) return { ok: false, reason: 'invalid' };
  const flat = squash(String(raw).slice(0, 40)); // before symbols are stripped, so sh!t and $hit are caught
  let safe = flat;
  for (const a of ALLOW) safe = safe.split(a).join('_');
  const forms = [safe, collapse2(safe)];
  for (const w of STRONG) {
    // words without double letters also match fully collapsed names (fuuuck); "boob"/"kkk" must not collapse to "bob"/"k"
    if (forms.some((f) => f.includes(w)) || (collapse(w) === w && collapse(safe).includes(w))) return { ok: false, reason: 'bad_word' };
  }
  const tokens = name.toLowerCase().split(/[\s_-]+/).map((t) => collapse2(squash(t)));
  const isAllowed = ALLOW.some((a) => flat.includes(a));
  const flat2 = collapse2(flat);
  for (const w of WEAK) {
    if (tokens.includes(w)) return { ok: false, reason: 'bad_word' };
    if (!isAllowed && (flat2.startsWith(w) || flat2.endsWith(w))) return { ok: false, reason: 'bad_word' };
  }
  return { ok: true, name };
}

// Match score: win +100, +25 per elimination, +5 per place above last (1st = +50).
export function matchScore(place, elims) {
  return (place === 1 ? 100 : 0) + elims * 25 + (11 - place) * 5;
}
