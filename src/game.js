/* BrawlNite: game code. Uses the global THREE (r149). See specs/ for the design. */
(() => {
'use strict';

// ===================================================================
// Helpers
// ===================================================================
const $ = (id) => document.getElementById(id);
const TAU = Math.PI * 2;
const rand = (a, b) => a + Math.random() * (b - a);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const dist = (ax, az, bx, bz) => Math.hypot(ax - bx, az - bz);
const angDiff = (a, b) => { let d = (b - a) % TAU; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU; return d; };
const shuffle = (arr) => { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; };
function mulberry32(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const r2 = (v) => Math.round(v * 100) / 100;
const fmtTime = (s) => { s = Math.max(0, Math.ceil(s)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };

// ===================================================================
// Data (specs/03-heroes.md, 07-bots.md)
// ===================================================================
const HEROES = {
  brickster: {
    name: 'Brickster', emoji: '🧱', role: 'Tank', hp: 200, speed: 6, radius: 1.1, scale: 1.15,
    range: 26, prefRange: 15, superRange: 14, chargeRate: 0.9, attackCd: 0.45,
    attackText: '<b>Blaster:</b> fires flaming bricks', superText: '<b>Brick Fort:</b> brick walls pop up and block ALL damage for 4s',
    bars: { hp: 1, speed: 0.45, range: 0.85 },
  },
  zippy: {
    name: 'Zippy', emoji: '⚡', role: 'Speedster', hp: 100, speed: 10, radius: 0.9, scale: 0.95,
    range: 13, prefRange: 7, superRange: 12, chargeRate: 0.7, attackCd: 0.5,
    attackText: '<b>Zap Burst:</b> 3 lightning zaps from his fists', superText: '<b>Dash:</b> zooms forward and knocks enemies flying',
    bars: { hp: 0.5, speed: 1, range: 0.45 },
  },
  boomer: {
    name: 'Boomer', emoji: '🎯', role: 'Long range', hp: 130, speed: 7.5, radius: 0.95, scale: 1,
    range: 18, prefRange: 14, superRange: 30, chargeRate: 0.8, attackCd: 0.9,
    attackText: '<b>Bouncing Bomb:</b> lobs bombs over rocks (look up/down to aim distance)', superText: '<b>Big Rocket:</b> a huge explosion',
    bars: { hp: 0.65, speed: 0.7, range: 1 },
  },
  barf: {
    name: 'Barf Bush', emoji: '🍃', role: 'Leaf monster', hp: 180, speed: 9, radius: 1.0, scale: 1.05, unlockAt: 4,
    range: 14, prefRange: 8, superRange: 18, chargeRate: 1.0, attackCd: 0.6,
    attackText: '<b>Leaf Barf:</b> sprays a cone of leaves 🤮', superText: '<b>Leaf Laser:</b> a giant leaf beam from the eyes for 5s',
    bars: { hp: 0.85, speed: 0.9, range: 0.5 },
  },
  // unlockables (specs/12-wins-and-unlocks.md)
  shadow: {
    name: 'Shadow Sam', emoji: '🥷', role: 'Sneaky', hp: 110, speed: 9.5, radius: 0.9, scale: 0.95, unlockAt: 1,
    range: 18, prefRange: 12, superRange: 18, chargeRate: 0.8, attackCd: 0.55,
    attackText: '<b>Ninja Stars:</b> throws 2 spinning stars', superText: '<b>Smoke Bomb:</b> invisible for 4s, next hit does DOUBLE damage',
    bars: { hp: 0.55, speed: 0.95, range: 0.7 },
  },
  frosty: {
    name: 'Frosty', emoji: '🧊', role: 'Freezer', hp: 130, speed: 7.5, radius: 0.95, scale: 1, unlockAt: 2,
    range: 20, prefRange: 13, superRange: 6.5, chargeRate: 1.1, attackCd: 0.6,
    attackText: '<b>Snowball:</b> hits slow enemies down', superText: '<b>Ice Blast:</b> freezes everyone nearby for 2s',
    bars: { hp: 0.65, speed: 0.7, range: 0.8 },
  },
  chomp: {
    name: 'Chomp', emoji: '🦖', role: 'Dino brawler', hp: 230, speed: 5.5, radius: 1.2, scale: 1.2, unlockAt: 3,
    range: 4.5, prefRange: 2.5, superRange: 8, chargeRate: 0.9, attackCd: 0.8,
    attackText: '<b>Tail Swipe:</b> hits everyone around him', superText: '<b>ROAR:</b> knocks everyone back and grows HUGE for 5s',
    bars: { hp: 1, speed: 0.35, range: 0.2 },
  },
  pete: {
    name: 'Pizza Pete', emoji: '🍕', role: 'Trickster', hp: 150, speed: 8, radius: 1.0, scale: 1,
    range: 22, prefRange: 14, superRange: 8, chargeRate: 1.1, attackCd: 0.55,
    attackText: '<b>Pizza Fling:</b> slices bounce off rocks', superText: '<b>Giant Pizza:</b> heals you, enemies get stuck in cheese',
    bars: { hp: 0.75, speed: 0.75, range: 0.9 },
  },
  // secret heroes: hidden until all 8 above are unlocked (reveal: wins needed to see them)
  boo: {
    name: 'Boo', emoji: '👻', role: 'Ghost', hp: 100, speed: 8.5, radius: 0.95, scale: 1, unlockAt: 5, reveal: 4,
    range: 16, prefRange: 11, superRange: 9, chargeRate: 1.0, attackCd: 0.5,
    attackText: '<b>Spooky Orb:</b> flies through rocks', superText: '<b>SCREAM:</b> enemies run away scared for 3s',
    bars: { hp: 0.5, speed: 0.85, range: 0.65 },
  },
  inky: {
    name: 'Inky', emoji: '🐙', role: 'Octopus', hp: 160, speed: 6.5, radius: 1.1, scale: 1.1, unlockAt: 6, reveal: 4,
    range: 18, prefRange: 11, superRange: 7, chargeRate: 1.0, attackCd: 0.6,
    attackText: '<b>Ink Blob:</b> splats ink on their screen', superText: '<b>Tentacle Spin:</b> hits everyone around and pulls them in',
    bars: { hp: 0.8, speed: 0.5, range: 0.75 },
  },
  twister: {
    name: 'Twister', emoji: '🌪️', role: 'Wind kid', hp: 120, speed: 9.5, radius: 0.95, scale: 1, unlockAt: 7, reveal: 4,
    range: 15, prefRange: 9, superRange: 14, chargeRate: 1.6, attackCd: 0.5,
    attackText: '<b>Wind Gust:</b> pushes enemies back (even into lava!)', superText: '<b>Tornado:</b> chases enemies and carries them away for 5s',
    bars: { hp: 0.6, speed: 0.95, range: 0.6 },
  },
  glaxo: {
    name: 'Glaxo', emoji: '🌌', role: 'Space hero', hp: 140, speed: 8, radius: 1.0, scale: 1, unlockAt: 8, reveal: 4,
    range: 24, prefRange: 14, superRange: 10, chargeRate: 0.8, attackCd: 0.45,
    attackText: '<b>Space Stars:</b> fast glowing stars', superText: '<b>Black Hole:</b> anyone who steps in is GONE',
    bars: { hp: 0.7, speed: 0.75, range: 0.95 },
  },
  // candy heroes: hidden until Candy Land unlocks at 8 wins, then one per win (the last 4 are Claude's ideas)
  fart: {
    name: 'Fart Master', emoji: '💨', role: 'Gas cloud', hp: 150, speed: 8, radius: 1.0, scale: 1.05, unlockAt: 9, reveal: 8,
    range: 14, prefRange: 9, superRange: 16, chargeRate: 1.0, attackCd: 0.55,
    attackText: '<b>Fart Cloud:</b> a big stinky puff 💨', superText: '<b>Toxic Fart Bomb:</b> leaves a poison cloud for 5s',
    bars: { hp: 0.75, speed: 0.75, range: 0.5 },
  },
  bruno: {
    name: 'Bruno', emoji: '❤️', role: 'Heart boxer', hp: 170, speed: 8.5, radius: 1.0, scale: 1.05, unlockAt: 10, reveal: 8,
    range: 9, prefRange: 5, superRange: 30, chargeRate: 1.0, attackCd: 0.4,
    attackText: '<b>Punches:</b> fast flying fists', superText: '<b>Mega Heart:</b> throws a massive heart far and fast',
    bars: { hp: 0.85, speed: 0.8, range: 0.35 },
  },
  electro: {
    name: 'Electro', emoji: '🌩️', role: 'Electric', hp: 120, speed: 8.5, radius: 0.95, scale: 1, unlockAt: 11, reveal: 8,
    range: 20, prefRange: 13, superRange: 16, chargeRate: 0.9, attackCd: 0.5,
    attackText: '<b>Lightning Bolt:</b> zaps jump to a 2nd enemy', superText: '<b>Sky Strike:</b> a giant lightning bolt from the sky',
    bars: { hp: 0.6, speed: 0.8, range: 0.8 },
  },
  marshy: {
    name: 'Marshy', emoji: '🍡', role: 'Squishy tank', hp: 210, speed: 6.5, radius: 1.1, scale: 1.1, unlockAt: 12, reveal: 8,
    range: 15, prefRange: 9, superRange: 8, chargeRate: 1.0, attackCd: 0.6,
    attackText: '<b>Mini Mallows:</b> 3 little marshmallows', superText: '<b>Giant Marshy:</b> grows HUGE for 6s and bounces enemies away',
    bars: { hp: 0.95, speed: 0.5, range: 0.6 },
  },
  gummo: {
    name: 'Gummo', emoji: '🧸', role: 'Gummy bear', hp: 140, speed: 8, radius: 0.95, scale: 1, unlockAt: 13, reveal: 8,
    range: 18, prefRange: 12, superRange: 22, chargeRate: 0.9, attackCd: 0.5,
    attackText: '<b>Gummy Blob:</b> bouncy gummy shots', superText: '<b>Gummy Army:</b> 3 mini gummy bears chase enemies and go SPLAT',
    bars: { hp: 0.7, speed: 0.75, range: 0.75 },
  },
  kernel: {
    name: 'Kernel', emoji: '🍿', role: 'Jumper', hp: 130, speed: 8.5, radius: 0.95, scale: 1, unlockAt: 14, reveal: 8,
    range: 16, prefRange: 11, superRange: 14, chargeRate: 1.0, attackCd: 0.6,
    attackText: '<b>Popping Kernels:</b> pop into 3 bits at the end', superText: '<b>Butter Slam:</b> jumps high and slams down',
    bars: { hp: 0.65, speed: 0.8, range: 0.7 },
  },
  rocky: {
    name: 'Rocky', emoji: '💎', role: 'Sniper', hp: 110, speed: 7.5, radius: 0.95, scale: 1, unlockAt: 15, reveal: 8,
    range: 34, prefRange: 22, superRange: 40, chargeRate: 0.7, attackCd: 1.1,
    attackText: '<b>Crystal Shot:</b> slow but powerful, longest range', superText: '<b>Crystal Pierce:</b> flies through EVERY enemy in a line',
    bars: { hp: 0.55, speed: 0.7, range: 1 },
  },
  fluff: {
    name: 'Fluff', emoji: '☁️', role: 'Wall builder', hp: 150, speed: 8, radius: 1.0, scale: 1, unlockAt: 16, reveal: 8,
    range: 19, prefRange: 12, superRange: 12, chargeRate: 1.0, attackCd: 0.55,
    attackText: '<b>Fluff Ball:</b> sticky, slows enemies', superText: '<b>Fluff Wall:</b> a cotton candy wall that blocks shots for 6s',
    bars: { hp: 0.75, speed: 0.75, range: 0.8 },
  },
};
const HERO_KEYS = Object.keys(HEROES);
// menu order: starters first, then in unlock order (specs/12-wins-and-unlocks.md)
const MENU_KEYS = [...HERO_KEYS].sort((a, b) => (HEROES[a].unlockAt || 0) - (HEROES[b].unlockAt || 0));

const DIFFS = {
  easy:   { aim: 0.4,  react: 0.8,  dmg: 0.55, sight: 22 },
  normal: { aim: 0.14, react: 0.35, dmg: 1.0,  sight: 35 },
  hard:   { aim: 0.06, react: 0.15, dmg: 1.15, sight: 42 },
};

const BOT_NAMES = ['LavaLlama', 'NoobMaster', 'CubeKid', 'BlockyBob', 'Sir Pickles', 'TurboTaco', 'PixelPete',
  'BananaBoss', 'SneakySam', 'CaptainCrumb', 'WobbleTop', 'MegaMuffin'];

const STORM_PHASES = [
  { wait: 25, shrink: 25, r: 55, dmg: 4 },
  { wait: 20, shrink: 20, r: 30, dmg: 8 },
  { wait: 15, shrink: 15, r: 12, dmg: 15 },
  { wait: 10, shrink: 15, r: 0,  dmg: 25 },
];

const PICKUP_TYPES = {
  strength: { label: '💪 STRENGTH!', ring: 0xff4d4d },
  speed:    { label: '⚡ SPEED!',    ring: 0xffd23f },
  health:   { label: '🩹 +60 HEALTH', ring: 0x4cd964 },
  invis:    { label: '🧥 INVISIBLE!', ring: 0xa66bff },
};

const ISLAND_R = 90;
const GRACE = 10; // seconds after landing before bots start fighting
const LEAF_COLORS = [0x2e8b2e, 0x3fa33f, 0x57c13a, 0x7ed957, 0x1f6e2a];

// ===================================================================
// Renderer, scene, camera
// ===================================================================
const renderer = new THREE.WebGLRenderer({ antialias: true });
const BASE_RATIO = Math.min(window.devicePixelRatio || 1, 1.5);
renderer.setPixelRatio(BASE_RATIO);
renderer.setSize(window.innerWidth, window.innerHeight);
$('game').appendChild(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 900);
window.addEventListener('resize', () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
});

const hemi = new THREE.HemisphereLight(0xcfe2ff, 0x8a3a1a, 0.85);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff0dd, 0.75);
sun.position.set(40, 80, 30);
scene.add(sun);

// ===================================================================
// Canvas textures
// ===================================================================
function canvasTex(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  return new THREE.CanvasTexture(c);
}

// sky: top to horizon, colours at 0, 0.55, 0.8 and 1
const skyTex = (cols) => canvasTex(4, 256, (g, w, h) => {
  const gr = g.createLinearGradient(0, 0, 0, h);
  [0, 0.55, 0.8, 1].forEach((at, i) => gr.addColorStop(at, cols[i]));
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
});
scene.fog = new THREE.Fog(0xe9b08c, 110, 380);

const groundTex = canvasTex(512, 512, (g, w, h) => {
  const r = mulberry32(7);
  g.fillStyle = '#4a3f4e'; g.fillRect(0, 0, w, h);
  const cols = ['#5f5366', '#564a5c', '#695c6e', '#4f4455', '#62566a'];
  const n = 4, s = w / n;
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    g.fillStyle = cols[Math.floor(r() * cols.length)];
    const jx = r() * 8, jy = r() * 8;
    g.fillRect(i * s + 4 + jx * 0.3, j * s + 4 + jy * 0.3, s - 8, s - 8);
    g.strokeStyle = 'rgba(30,20,35,0.6)'; g.lineWidth = 2;
    g.beginPath(); let x = i * s + r() * s, y = j * s + r() * s; g.moveTo(x, y);
    for (let k = 0; k < 4; k++) { x += (r() - 0.5) * 50; y += (r() - 0.5) * 50; g.lineTo(x, y); }
    g.stroke();
  }
});
groundTex.wrapS = groundTex.wrapT = THREE.RepeatWrapping;
groundTex.repeat.set(16, 16);

function lavaCanvas(seed) {
  return canvasTex(256, 256, (g, w, h) => {
    const r = mulberry32(seed);
    g.fillStyle = '#ff6a00'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 70; i++) {
      const x = r() * w, y = r() * h, rad = 8 + r() * 30;
      const hot = r() > 0.4;
      for (const ox of [-w, 0, w]) for (const oy of [-h, 0, h]) {
        const gr = g.createRadialGradient(x + ox, y + oy, 0, x + ox, y + oy, rad);
        gr.addColorStop(0, hot ? 'rgba(255,230,80,0.9)' : 'rgba(190,40,0,0.8)');
        gr.addColorStop(1, 'rgba(255,120,0,0)');
        g.fillStyle = gr; g.fillRect(x + ox - rad, y + oy - rad, rad * 2, rad * 2);
      }
    }
  });
}
const lavaTex = lavaCanvas(3);
lavaTex.wrapS = lavaTex.wrapT = THREE.RepeatWrapping;
lavaTex.repeat.set(2, 2);
const seaTex = lavaCanvas(11);
seaTex.wrapS = seaTex.wrapT = THREE.RepeatWrapping;
seaTex.repeat.set(70, 70);

const crateTex = canvasTex(128, 128, (g, w, h) => {
  g.fillStyle = '#b07434'; g.fillRect(0, 0, w, h);
  g.strokeStyle = '#7a4a1e'; g.lineWidth = 3;
  for (let y = 16; y < h; y += 24) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
  g.strokeStyle = '#6b3f17'; g.lineWidth = 14; g.strokeRect(7, 7, w - 14, h - 14);
  g.beginPath(); g.moveTo(10, 10); g.lineTo(w - 10, h - 10); g.moveTo(w - 10, 10); g.lineTo(10, h - 10); g.stroke();
  g.fillStyle = '#8a8f99';
  for (const [x, y] of [[0, 0], [w - 22, 0], [0, h - 22], [w - 22, h - 22]]) g.fillRect(x, y, 22, 22);
});

const chevronTex = canvasTex(256, 64, (g, w, h) => {
  g.fillStyle = '#ffcc00'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#1a1a1a';
  for (let x = 20; x < w; x += 64) {
    g.beginPath(); g.moveTo(x, 8); g.lineTo(x + 26, 8); g.lineTo(x + 50, 32); g.lineTo(x + 26, 56); g.lineTo(x, 56); g.lineTo(x + 24, 32); g.closePath(); g.fill();
  }
});

const bannerTex = canvasTex(128, 192, (g, w, h) => {
  g.fillStyle = '#b3202a';
  g.beginPath(); g.moveTo(0, 0); g.lineTo(w, 0); g.lineTo(w, h); g.lineTo(w / 2, h - 30); g.lineTo(0, h); g.closePath(); g.fill();
  g.fillStyle = '#fff';
  g.beginPath(); g.arc(w / 2, 78, 30, 0, TAU); g.fill();
  g.fillRect(w / 2 - 18, 96, 36, 22);
  for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU; g.beginPath(); g.moveTo(w / 2 + Math.cos(a) * 28, 78 + Math.sin(a) * 28); g.lineTo(w / 2 + Math.cos(a) * 44, 78 + Math.sin(a) * 44); g.lineWidth = 7; g.strokeStyle = '#fff'; g.stroke(); }
  g.fillStyle = '#b3202a';
  g.beginPath(); g.arc(w / 2 - 12, 76, 8, 0, TAU); g.arc(w / 2 + 12, 76, 8, 0, TAU); g.fill();
  g.fillRect(w / 2 - 2, 104, 4, 14); g.fillRect(w / 2 - 12, 104, 4, 14); g.fillRect(w / 2 + 8, 104, 4, 14);
});

const EMOJI_FONT = '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
const pickupTex = {
  strength: canvasTex(128, 128, (g) => { g.font = `92px ${EMOJI_FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('💪', 64, 70); }),
  speed: canvasTex(128, 128, (g) => {
    g.fillStyle = '#ffd23f'; g.strokeStyle = '#a35a00'; g.lineWidth = 6;
    g.beginPath(); g.moveTo(76, 6); g.lineTo(28, 72); g.lineTo(60, 72); g.lineTo(46, 122); g.lineTo(102, 50); g.lineTo(68, 50); g.lineTo(88, 6); g.closePath(); g.fill(); g.stroke();
  }),
  health: canvasTex(128, 128, (g) => {
    g.fillStyle = '#ffffff'; g.strokeStyle = '#8a8f99'; g.lineWidth = 5;
    g.beginPath(); g.roundRect ? g.roundRect(12, 30, 104, 82, 14) : g.rect(12, 30, 104, 82); g.fill(); g.stroke();
    g.strokeRect(46, 16, 36, 16);
    g.fillStyle = '#e8262b'; g.fillRect(54, 44, 20, 54); g.fillRect(37, 61, 54, 20);
  }),
  invis: canvasTex(128, 128, (g) => {
    g.fillStyle = '#7b45e0'; g.strokeStyle = '#3b1a80'; g.lineWidth = 5;
    g.beginPath(); g.moveTo(64, 6); g.quadraticCurveTo(100, 14, 98, 52); g.lineTo(118, 122); g.quadraticCurveTo(64, 108, 10, 122); g.lineTo(30, 52); g.quadraticCurveTo(28, 14, 64, 6); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = '#1c0b3d'; g.beginPath(); g.ellipse(64, 46, 20, 24, 0, 0, TAU); g.fill();
    g.fillStyle = '#ffffff'; g.fillRect(52, 42, 8, 6); g.fillRect(68, 42, 8, 6);
  }),
};

// ===================================================================
// Map (specs/05-map-lava-volcano.md): built once, with a fixed seed
// ===================================================================
const colliders = [];  // circles that block movement and straight shots: {x, z, r}
const lavaPools = [];  // {x, z, r}
let mrand = mulberry32(1337); // each world resets this to its own seed, so every player builds the same map
const mr = (a, b) => a + mrand() * (b - a);

function isFree(x, z, clear) {
  for (const c of colliders) if (dist(x, z, c.x, c.z) < c.r + clear) return false;
  for (const l of lavaPools) if (dist(x, z, l.x, l.z) < l.r + clear) return false;
  for (const p of pads) if (dist(x, z, p.x, p.z) < PAD_R + 1 + clear) return false;
  return true;
}
function freeSpot(minR, maxR, clear, rng = Math.random, cx = 0, cz = 0) {
  let x = 0, z = 0;
  for (let i = 0; i < 300; i++) {
    const a = rng() * TAU, r = Math.sqrt(minR * minR + rng() * (maxR * maxR - minR * minR));
    x = cx + Math.cos(a) * r; z = cz + Math.sin(a) * r;
    if (Math.hypot(x, z) < ISLAND_R - 4 && isFree(x, z, clear)) return { x, z };
  }
  return { x, z };
}

const lambert = (color, extra) => new THREE.MeshLambertMaterial(Object.assign({ color }, extra || {}));
const basic = (color, extra) => new THREE.MeshBasicMaterial(Object.assign({ color }, extra || {}));
const lavaMat = basic(0xffffff, { map: lavaTex });

function buildLava(W) {
  // island
  const islandMats = [lambert(0x3e3340), lambert(0xffffff, { map: groundTex }), lambert(0x2a2228)];
  const island = new THREE.Mesh(new THREE.CylinderGeometry(ISLAND_R + 2, ISLAND_R + 8, 8, 72), islandMats);
  island.position.y = -4;
  W.add(island);

  // lava sea
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(1600, 1600), basic(0xffffff, { map: seaTex }));
  sea.rotation.x = -Math.PI / 2; sea.position.y = -2.5;
  W.add(sea);

  // distant mountains
  const mtnMat = lambert(0x6a5560, { flatShading: true });
  for (let i = 0; i < 46; i++) {
    const a = (i / 46) * TAU + mr(-0.05, 0.05), r = mr(230, 330), h = mr(40, 110);
    const m = new THREE.Mesh(new THREE.ConeGeometry(mr(25, 55), h, 6), mtnMat);
    m.position.set(Math.cos(a) * r, h / 2 - 4, Math.sin(a) * r); m.rotation.y = mr(0, TAU);
    W.add(m);
  }

  // clouds
  const cloudMat = lambert(0xffffff, { fog: false });
  for (let i = 0; i < 12; i++) {
    const g = new THREE.Group(), a = mr(0, TAU), r = mr(160, 300);
    g.position.set(Math.cos(a) * r, mr(110, 150), Math.sin(a) * r);
    for (let k = 0; k < 4; k++) {
      const s = new THREE.Mesh(new THREE.IcosahedronGeometry(mr(8, 14), 1), cloudMat);
      s.position.set(k * 10 - 15, mr(-2, 3), mr(-4, 4)); s.scale.y = 0.55; g.add(s);
    }
    W.add(g);
  }

  // volcano
  const vGeo = new THREE.CylinderGeometry(4.5, 16, 24, 18, 6);
  const pos = vGeo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    const rr = Math.hypot(x, z); if (rr < 0.01) continue;
    const n = (Math.sin(x * 0.9) * Math.cos(z * 1.1) + Math.sin(y * 0.7 + x * 0.3)) * 0.6;
    pos.setXYZ(i, x * (1 + n / rr), y, z * (1 + n / rr));
  }
  vGeo.computeVertexNormals();
  const volcano = new THREE.Mesh(vGeo, lambert(0x4e3c48, { flatShading: true }));
  volcano.position.y = 12; W.add(volcano);
  const crater = new THREE.Mesh(new THREE.CircleGeometry(4.6, 18), lavaMat);
  crater.rotation.x = -Math.PI / 2; crater.position.y = 24.1; W.add(crater);
  const streakMat = basic(0xff8a1a);
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * TAU + mr(-0.3, 0.3);
    const top = new THREE.Vector3(Math.cos(a) * 5.4, 23.5, Math.sin(a) * 5.4);
    const yb = mr(3, 10), rb = 16 - 11.5 * (yb / 24) + 1.0;
    const bot = new THREE.Vector3(Math.cos(a) * rb, yb, Math.sin(a) * rb);
    const d = bot.clone().sub(top), len = d.length();
    const s = new THREE.Mesh(new THREE.BoxGeometry(mr(0.7, 1.3), len, 0.9), streakMat);
    s.position.copy(top).addScaledVector(d, 0.5);
    s.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
    W.add(s);
  }
  colliders.push({ x: 0, z: 0, r: 16, kind: 'center' });

  // boulders and rock pillars
  const rockMats = [0x6b5d6e, 0x5a4d5c, 0x7a6b78].map((c) => lambert(c, { flatShading: true }));
  for (let i = 0; i < 30; i++) {
    const r = mr(1.6, 3.4);
    const p = freeSpot(22, ISLAND_R - 6, r + 3, mrand);
    const m = new THREE.Mesh(new THREE.DodecahedronGeometry(r, 0), rockMats[i % 3]);
    m.position.set(p.x, r * 0.5, p.z); m.scale.y = mr(0.8, 1.4); m.rotation.set(mr(0, 1), mr(0, TAU), 0);
    W.add(m);
    colliders.push({ x: p.x, z: p.z, r: r * 0.95 });
  }
  for (let i = 0; i < 6; i++) {
    const p = freeSpot(25, ISLAND_R - 8, 5, mrand);
    const g = new THREE.Group(); g.position.set(p.x, 0, p.z); g.rotation.y = mr(0, TAU);
    let y = 0;
    for (let k = 0; k < 3; k++) {
      const s = 2.6 - k * 0.5, hh = mr(2, 3.5);
      const b = new THREE.Mesh(new THREE.BoxGeometry(s, hh, s), rockMats[k % 3]);
      b.position.set(mr(-0.2, 0.2), y + hh / 2, mr(-0.2, 0.2)); b.rotation.y = mr(-0.3, 0.3); g.add(b); y += hh;
    }
    W.add(g);
    colliders.push({ x: p.x, z: p.z, r: 1.7 });
  }

  // watchtowers with skull banners
  const woodMat = lambert(0x7a4a22), darkWood = lambert(0x5a3416), bannerMat = lambert(0xffffff, { map: bannerTex, side: THREE.DoubleSide });
  for (let i = 0; i < 5; i++) {
    const p = freeSpot(28, ISLAND_R - 10, 6, mrand);
    const g = new THREE.Group(); g.position.set(p.x, 0, p.z); g.rotation.y = mr(0, TAU);
    for (const [x, z] of [[-1.6, -1.6], [1.6, -1.6], [-1.6, 1.6], [1.6, 1.6]]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.45, 8, 0.45), woodMat); leg.position.set(x, 4, z); g.add(leg);
    }
    for (const y of [2.5, 5]) {
      const b1 = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.25, 0.25), darkWood); b1.position.set(0, y, 1.6); b1.rotation.z = 0.5; g.add(b1);
      const b2 = b1.clone(); b2.position.z = -1.6; b2.rotation.z = -0.5; g.add(b2);
    }
    const plat = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.4, 4.4), darkWood); plat.position.y = 8; g.add(plat);
    for (const [x, z, w, d] of [[0, 2.1, 4.4, 0.2], [0, -2.1, 4.4, 0.2], [2.1, 0, 0.2, 4.4], [-2.1, 0, 0.2, 4.4]]) {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(w, 0.9, d), woodMat); rail.position.set(x, 8.65, z); g.add(rail);
    }
    const roof = new THREE.Mesh(new THREE.ConeGeometry(3.6, 2, 4), darkWood); roof.position.y = 11; roof.rotation.y = Math.PI / 4; g.add(roof);
    for (const [x, z] of [[-1.6, -1.6], [1.6, -1.6], [-1.6, 1.6], [1.6, 1.6]]) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.25, 2, 0.25), woodMat); post.position.set(x, 9.5, z); g.add(post);
    }
    const banner = new THREE.Mesh(new THREE.PlaneGeometry(2, 3), bannerMat); banner.position.set(0, 6.3, 2.25); g.add(banner);
    const banner2 = banner.clone(); banner2.position.z = -2.25; banner2.rotation.y = Math.PI; g.add(banner2);
    W.add(g);
    colliders.push({ x: p.x, z: p.z, r: 2.6 });
  }

  // crates
  const crateMat = lambert(0xffffff, { map: crateTex });
  const crateGeo = new THREE.BoxGeometry(1.6, 1.6, 1.6);
  for (let i = 0; i < 14; i++) {
    const p = freeSpot(22, ISLAND_R - 6, 3, mrand);
    const g = new THREE.Group(); g.position.set(p.x, 0, p.z); g.rotation.y = mr(0, TAU);
    const n = 1 + Math.floor(mrand() * 3);
    const spots = [[0, 0.8, 0], [1.65, 0.8, 0.1], [0.8, 2.4, 0.05]];
    for (let k = 0; k < n; k++) { const c = new THREE.Mesh(crateGeo, crateMat); c.position.set(...spots[k]); c.rotation.y = mr(-0.15, 0.15); g.add(c); }
    W.add(g);
    colliders.push({ x: p.x, z: p.z, r: n > 1 ? 1.9 : 1.2 });
    if (n > 1) { const a = g.rotation.y; colliders.push({ x: p.x + Math.cos(a) * 1.65, z: p.z - Math.sin(a) * 1.65, r: 1.2 }); }
  }

  // chevron barriers
  const chevMats = [lambert(0x2a2a2a), lambert(0x2a2a2a), lambert(0x2a2a2a), lambert(0x2a2a2a), lambert(0xffffff, { map: chevronTex }), lambert(0xffffff, { map: chevronTex })];
  for (let i = 0; i < 8; i++) {
    const p = freeSpot(22, ISLAND_R - 6, 3.5, mrand);
    const a = mr(0, TAU);
    const b = new THREE.Mesh(new THREE.BoxGeometry(4, 1.4, 0.6), chevMats);
    b.position.set(p.x, 0.7, p.z); b.rotation.y = a; W.add(b);
    for (const s of [-1, 1]) colliders.push({ x: p.x + Math.cos(a) * s * 1.1, z: p.z - Math.sin(a) * s * 1.1, r: 1.0 });
  }

  // lava pools
  const rimMat = basic(0x8a2a0a);
  for (let i = 0; i < 10; i++) {
    const r = mr(3, 7);
    const p = freeSpot(24, ISLAND_R - r - 4, r + 3, mrand);
    const pool = new THREE.Mesh(new THREE.CircleGeometry(r, 32), lavaMat);
    pool.rotation.x = -Math.PI / 2; pool.position.set(p.x, 0.04, p.z); W.add(pool);
    const rim = new THREE.Mesh(new THREE.RingGeometry(r, r + 0.7, 32), rimMat);
    rim.rotation.x = -Math.PI / 2; rim.position.set(p.x, 0.03, p.z); W.add(rim);
    lavaPools.push({ x: p.x, z: p.z, r });
  }

  // torches
  const flameMat = basic(0xffb020);
  for (let i = 0; i < 12; i++) {
    const p = freeSpot(20, ISLAND_R - 4, 2, mrand);
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.25, 2.4, 0.25), woodMat); post.position.set(p.x, 1.2, p.z); W.add(post);
    const bowl = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.3, 0.6), darkWood); bowl.position.set(p.x, 2.5, p.z); W.add(bowl);
    const flame = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.6, 0.4), flameMat); flame.position.set(p.x, 2.95, p.z); flame.rotation.y = 0.7; W.add(flame);
    torches.push(flame);
  }

  addPads(W, padBaseMat, padTopMat, 0x5ff6ff);
  mergeMap(W, new Set([...pads.map((p) => p.ring.parent), ...torches]));
  buildSmoke(W);
  buildFloaters(W, [0xffa040], 0.3, 1);
}
const torches = [];
const pads = [];  // {x, z, ring, top}
const PAD_R = 1.8;
const padBaseGeo = new THREE.CylinderGeometry(2.1, 2.3, 0.3, 24);
const padBaseMat = lambert(0x3a3f4a);
const padTopGeo = new THREE.CircleGeometry(1.8, 24);
const padTopMat = basic(0xffffff, { map: canvasTex(128, 128, (g, w) => {
  const c = w / 2;
  g.fillStyle = '#19d3ff'; g.beginPath(); g.arc(c, c, c, 0, TAU); g.fill();
  g.fillStyle = '#8ff3ff'; g.beginPath(); g.arc(c, c, c * 0.8, 0, TAU); g.fill();
  g.fillStyle = '#ffffff'; g.beginPath();
  g.moveTo(c, 18); g.lineTo(c + 34, c + 2); g.lineTo(c + 14, c + 2); g.lineTo(c + 14, w - 22);
  g.lineTo(c - 14, w - 22); g.lineTo(c - 14, c + 2); g.lineTo(c - 34, c + 2); g.closePath(); g.fill();
}) });
const padRingGeo = new THREE.RingGeometry(1.6, 2.0, 32);
// launch pads (specs/05-map-lava-volcano.md): 3 in a ring near the middle, 3 out on the island
function addPads(W, baseMat, topMat, ringColor) {
  for (const [minR, maxR] of [[20, 28], [20, 28], [20, 28], [45, 72], [45, 72], [45, 72]]) {
    let p;
    for (let k = 0; k < 40; k++) { p = freeSpot(minR, maxR, 3, mrand); if (pads.every((o) => dist(p.x, p.z, o.x, o.z) > 18) && torches.every((f) => dist(p.x, p.z, f.position.x, f.position.z) > 3.5)) break; }
    const g = new THREE.Group(); g.position.set(p.x, 0, p.z); W.add(g);
    const base = new THREE.Mesh(padBaseGeo, baseMat); base.position.y = 0.15; g.add(base);
    const top = new THREE.Mesh(padTopGeo, topMat); top.rotation.x = -Math.PI / 2; top.position.y = 0.32; g.add(top);
    const ring = new THREE.Mesh(padRingGeo, basic(ringColor, { transparent: true, opacity: 0.8, depthWrite: false, side: THREE.DoubleSide }));
    ring.rotation.x = -Math.PI / 2; g.add(ring);
    pads.push({ x: p.x, z: p.z, ring, top });
  }
}
function updatePadFx(now) {
  for (const [i, p] of pads.entries()) {
    const t = ((now * 0.0012) + i * 0.37) % 1;
    p.ring.position.y = 0.35 + t * 2.5; p.ring.scale.setScalar(1 - t * 0.35); p.ring.material.opacity = 0.8 * (1 - t);
    if (world.spinPads) p.top.rotation.z = now * 0.0015 + i;
  }
}
function padFx(p, h) {
  burst(p.x, 0.5, p.z, 22, world.padColors, 9, 0.3, 0.5, 4);
  sfx('boing', p.x, p.z);
  if (h.isPlayer) shake = Math.max(shake, 0.3);
}
function updatePads(h) {
  if (!h.alive || h.y > 0 || h.vy > 0 || h.dance || h.padCd > T) return;
  for (const p of pads) {
    if (dist(h.x, h.z, p.x, p.z) > PAD_R) continue;
    h.vy = 24; h.lvx = Math.sin(h.yaw) * 17; h.lvz = Math.cos(h.yaw) * 17;
    h.launched = true; h.padCd = T + 1;
    padFx(p, h);
    emit(['l', h.id, pads.indexOf(p)]);
    return;
  }
}

// smoke plume rising from the volcano
const smoke = [];
const smokeGeo = new THREE.IcosahedronGeometry(1, 0);
function buildSmoke(W) {
  for (let i = 0; i < 28; i++) {
    const m = new THREE.Mesh(smokeGeo, lambert(i % 3 ? 0x3a3236 : 0x55494f, { flatShading: true }));
    W.add(m);
    smoke.push({ m, t: i / 28 });
  }
}
function updateSmoke(dt) {
  for (const s of smoke) {
    s.t += dt * 0.05; if (s.t > 1) s.t -= 1;
    const t = s.t;
    s.m.position.set(Math.sin(t * 9 + s.m.id) * (2 + t * 12) + t * 25, 25 + t * 90, Math.cos(t * 7 + s.m.id) * (2 + t * 10));
    s.m.scale.setScalar(2.5 + t * 14);
    s.m.rotation.y += dt * 0.2;
  }
}

// floating bits in the air: embers on the volcano, sprinkles in Candy Land
function buildFloaters(W, colors, size, rise) {
  const n = 260, arr = new Float32Array(n * 3), col = new Float32Array(n * 3), c = new THREE.Color();
  for (let i = 0; i < n; i++) {
    const a = Math.random() * TAU, r = Math.sqrt(Math.random()) * ISLAND_R;
    arr[i * 3] = Math.cos(a) * r; arr[i * 3 + 1] = Math.random() * 25; arr[i * 3 + 2] = Math.sin(a) * r;
    c.setHex(colors[i % colors.length]); col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(arr, 3));
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const pts = new THREE.Points(g, new THREE.PointsMaterial({ size, vertexColors: true }));
  pts.userData.rise = rise;
  W.add(pts);
  building.floaters = pts;
}
function updateFloaters(pts, dt) {
  const p = pts.geometry.attributes.position, rise = pts.userData.rise;
  for (let i = 0; i < p.count; i++) {
    let y = p.getY(i) + dt * (1 + (i % 5) * 0.3) * rise;
    if (y > 25) y = 0; else if (y < 0) y = 25;
    p.setY(i, y);
  }
  p.needsUpdate = true;
}

// ===================================================================
// Candy Land (specs/16-map-candy-land.md): a giant candy tree, big sweets to hide behind,
// hot chocolate instead of lava, and peppermint launch pads
// ===================================================================
const CANDY_COLS = [0xff2e4d, 0xff7ac8, 0x3ccf6e, 0xffd23f, 0x9b5cff, 0x2fb8ff, 0xff8a1a];
const repeatTex = (t, x, y) => { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(x, y); return t; };
function sprinkles(g, w, h, n, rng, cols) {
  for (let i = 0; i < n; i++) {
    g.save(); g.translate(rng() * w, rng() * h); g.rotate(rng() * TAU);
    g.fillStyle = cols[Math.floor(rng() * cols.length)]; g.fillRect(-4, -1.5, 8, 3);
    g.restore();
  }
}
const SPRINKLE_CSS = ['#ff2e4d', '#ffd23f', '#3ccf6e', '#2fb8ff', '#ffffff', '#9b5cff', '#ff8a1a'];
// red and white (or any two colours) candy-cane stripes
const stripeTex = (c1, c2, rx, ry) => repeatTex(canvasTex(64, 64, (g, w, h) => {
  g.fillStyle = c2; g.fillRect(0, 0, w, h); g.fillStyle = c1;
  for (let k = -2; k < 3; k++) { g.beginPath(); g.moveTo(k * 32, 0); g.lineTo(k * 32 + 14, 0); g.lineTo(k * 32 + 78, h); g.lineTo(k * 32 + 64, h); g.closePath(); g.fill(); }
}), rx, ry);
// peppermint swirl, for lollipops and the launch pads
const swirlTex = (cols, arms = 8) => canvasTex(128, 128, (g, w) => {
  const c = w / 2;
  for (let r = c; r > 0; r -= 2) for (let k = 0; k < arms; k++) {
    const a = (k / arms) * TAU + r * 0.05;
    g.fillStyle = cols[k % cols.length];
    g.beginPath(); g.moveTo(c, c); g.arc(c, c, r, a, a + TAU / arms + 0.02); g.closePath(); g.fill();
  }
  g.strokeStyle = 'rgba(255,255,255,0.9)'; g.lineWidth = 5; g.beginPath(); g.arc(c, c, c - 3, 0, TAU); g.stroke();
  g.fillStyle = 'rgba(255,255,255,0.35)'; g.beginPath(); g.ellipse(c - 22, c - 26, 18, 9, -0.6, 0, TAU); g.fill();
});
const frostingTex = repeatTex(canvasTex(256, 256, (g, w, h) => {
  const r = mulberry32(21);
  g.fillStyle = '#e57aa6'; g.fillRect(0, 0, w, h);
  g.strokeStyle = 'rgba(244,150,190,0.8)'; g.lineWidth = 6;
  for (let i = 0; i < 9; i++) { g.beginPath(); g.arc(r() * w, r() * h, 10 + r() * 30, r() * TAU, r() * TAU + 2.5); g.stroke(); }
  sprinkles(g, w, h, 45, r, SPRINKLE_CSS);
}), 16, 16);
const cakeSideTex = repeatTex(canvasTex(128, 64, (g, w, h) => {
  g.fillStyle = '#5a2e17'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#f7a3c6'; g.fillRect(0, 0, w, 14);
  for (let x = 4; x < w; x += 16) { const len = 10 + ((x * 7) % 19); g.fillRect(x, 0, 9, len); g.beginPath(); g.arc(x + 4.5, len, 4.5, 0, TAU); g.fill(); }
  g.fillStyle = '#f2e3c8'; g.fillRect(0, 40, w, 5);
}), 24, 1);
function chocCanvas(seed) {
  return canvasTex(256, 256, (g, w, h) => {
    const r = mulberry32(seed);
    g.fillStyle = '#7a4322'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 60; i++) {
      const x = r() * w, y = r() * h, rad = 10 + r() * 34, light = r() > 0.5;
      for (const ox of [-w, 0, w]) for (const oy of [-h, 0, h]) {
        const gr = g.createRadialGradient(x + ox, y + oy, 0, x + ox, y + oy, rad);
        gr.addColorStop(0, light ? 'rgba(176,112,66,0.8)' : 'rgba(70,34,14,0.8)'); gr.addColorStop(1, 'rgba(122,67,34,0)');
        g.fillStyle = gr; g.fillRect(x + ox - rad, y + oy - rad, rad * 2, rad * 2);
      }
    }
    g.strokeStyle = 'rgba(245,225,200,0.55)'; g.lineWidth = 3; // creamy swirls
    for (let i = 0; i < 10; i++) { const x = r() * w, y = r() * h; g.beginPath(); g.arc(x, y, 8 + r() * 16, r() * TAU, r() * TAU + 3.5); g.stroke(); }
  });
}
const chocTex = repeatTex(chocCanvas(5), 2, 2);
const chocSeaTex = repeatTex(chocCanvas(17), 70, 70);
const sugarTex = canvasTex(128, 128, (g, w, h) => {
  const r = mulberry32(9);
  g.fillStyle = '#e8e8e8'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 900; i++) { g.fillStyle = r() > 0.5 ? '#ffffff' : '#c4c4c4'; g.fillRect(r() * w, r() * h, 2, 2); }
});
const truffleTex = canvasTex(128, 128, (g, w, h) => { g.fillStyle = '#4a2614'; g.fillRect(0, 0, w, h); sprinkles(g, w, h, 60, mulberry32(4), SPRINKLE_CSS); });
const dripTex = repeatTex(canvasTex(128, 64, (g, w, h) => {
  g.fillStyle = '#5a2e17'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#fff3e6'; g.fillRect(0, 0, w, 8);
  for (let x = 6; x < w; x += 20) { const len = 14 + ((x * 13) % 22); g.fillRect(x, 0, 8, len); g.beginPath(); g.arc(x + 4, len, 4, 0, TAU); g.fill(); }
}), 3, 1);
const drizzleTex = canvasTex(128, 128, (g, w) => {
  g.fillStyle = '#5a2e17'; g.fillRect(0, 0, w, w);
  g.strokeStyle = '#fff3e6'; g.lineWidth = 5; g.lineJoin = 'round';
  g.beginPath(); for (let i = 0; i <= 10; i++) g.lineTo(10 + i * 10.8, i % 2 ? 22 : 106); g.stroke();
});

function buildCandy(W) {
  const add = (geo, mat, x, y, z, parent = W) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); parent.add(m); return m; };
  // island: pink frosting on a chocolate cake
  const island = add(new THREE.CylinderGeometry(ISLAND_R + 2, ISLAND_R + 8, 8, 72),
    [lambert(0xffffff, { map: cakeSideTex }), lambert(0xffffff, { map: frostingTex }), lambert(0x3a1d0e)], 0, -4, 0);
  island.rotation.y = 0.1;
  const sea = add(new THREE.PlaneGeometry(1600, 1600), basic(0xffffff, { map: chocSeaTex }), 0, -2.5, 0);
  sea.rotation.x = -Math.PI / 2;

  // frosted candy mountains on the horizon
  const mtnMats = [0xf59ac4, 0xc9a0f0, 0xffb38a, 0xff8fb1].map((c) => lambert(c, { flatShading: true }));
  const capMat = lambert(0xfffafc, { flatShading: true });
  for (let i = 0; i < 46; i++) {
    const a = (i / 46) * TAU + mr(-0.05, 0.05), r = mr(230, 330), h = mr(40, 110), rad = mr(25, 55), rot = mr(0, TAU);
    const m = add(new THREE.ConeGeometry(rad, h, 7), mtnMats[i % 4], Math.cos(a) * r, h / 2 - 4, Math.sin(a) * r);
    m.rotation.y = rot;
    const cap = add(new THREE.ConeGeometry(rad * 0.4, h * 0.4, 7), capMat, m.position.x, h - 4 - h * 0.2 + 0.5, m.position.z);
    cap.rotation.y = rot; cap.scale.set(1.06, 1, 1.06);
  }
  // cotton-candy clouds
  const cloudMats = [lambert(0xffffff, { fog: false }), lambert(0xffd1ea, { fog: false })];
  for (let i = 0; i < 12; i++) {
    const g = new THREE.Group(), a = mr(0, TAU), r = mr(160, 300);
    g.position.set(Math.cos(a) * r, mr(110, 150), Math.sin(a) * r);
    for (let k = 0; k < 4; k++) {
      const s = add(new THREE.IcosahedronGeometry(mr(8, 14), 1), cloudMats[(i + k) % 2], k * 10 - 15, mr(-2, 3), mr(-4, 4), g);
      s.scale.y = 0.55;
    }
    W.add(g);
  }

  // the giant candy tree: a twisted trunk of candy-cane strands, topped with gumballs and lollipops
  const strands = [['#ff2e4d', '#ffffff'], ['#ff7ac8', '#ffffff'], ['#3ccf6e', '#ffffff'], ['#ff8a1a', '#ffd23f'], ['#9b5cff', '#7fe3ff'], ['#ff2e4d', '#ffd23f']];
  strands.forEach(([c1, c2], s) => {
    const geo = new THREE.CylinderGeometry(2.0, 2.8, 30, 10, 16), pos = geo.attributes.position, a0 = (s / strands.length) * TAU;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), y = pos.getY(i) + 15, z = pos.getZ(i);
      const tw = a0 + y * 0.09, off = 3.3 + Math.max(0, y - 21) * 0.55, c = Math.cos(tw), sn = Math.sin(tw);
      pos.setXYZ(i, Math.cos(tw) * off + x * c - z * sn, y, Math.sin(tw) * off + x * sn + z * c);
    }
    geo.computeVertexNormals();
    add(geo, lambert(0xffffff, { map: stripeTex(c1, c2, 2, 8) }), 0, 0, 0);
  });
  // melted chocolate around the roots, with a pile of sweets
  add(new THREE.CylinderGeometry(7.5, 10, 2.2, 28), lambert(0xffffff, { map: drizzleTex }), 0, 1.1, 0);
  const ballGeo = new THREE.IcosahedronGeometry(1, 2);
  const candyMats = CANDY_COLS.map((c) => lambert(c));
  for (let i = 0; i < 34; i++) {
    const a = mr(0, TAU), r = mr(6.5, 9.4), s = mr(0.6, 1.2);
    add(ballGeo, candyMats[i % candyMats.length], Math.cos(a) * r, 2.0 + s * 0.4, Math.sin(a) * r).scale.setScalar(s);
  }
  // canopy of giant gumballs
  for (let i = 0; i < 75; i++) {
    const a = mr(0, TAU), u = mr(-0.7, 1), k = mr(0.7, 1), q = Math.sqrt(1 - u * u);
    add(ballGeo, candyMats[i % candyMats.length], Math.cos(a) * q * 20 * k, 37 + u * 10 * k, Math.sin(a) * q * 20 * k).scale.setScalar(mr(3, 5.5));
  }
  // swirly lollipops poking out of the canopy
  const discGeo = new THREE.CylinderGeometry(1, 1, 0.2, 28), capGeo = new THREE.CircleGeometry(1, 28), white = lambert(0xffffff);
  const swirlMats = [['#ff2e4d', '#ffffff'], ['#3ccf6e', '#ffffff'], ['#9b5cff', '#ffffff'], ['#ff2e4d', '#ffd23f', '#3ccf6e', '#2fb8ff'], ['#ff7ac8', '#ffffff']]
    .map((cols) => lambert(0xffffff, { map: swirlTex(cols) }));
  const lolly = (x, y, z, R, yaw, mat, parent = W) => {
    const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = yaw; parent.add(g);
    add(discGeo, white, 0, 0, 0, g).scale.set(R, R * 3, R); // the disc's edge
    g.children[0].rotation.x = Math.PI / 2;
    for (const side of [1, -1]) { const c = add(capGeo, mat, 0, 0, side * 0.31 * R, g); c.scale.setScalar(R); if (side < 0) c.rotation.y = Math.PI; }
    return g;
  };
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * TAU + mr(-0.2, 0.2);
    lolly(Math.cos(a) * 19, mr(34, 46), Math.sin(a) * 19, mr(3.4, 4.6), -a + Math.PI / 2, swirlMats[i % swirlMats.length]);
  }
  colliders.push({ x: 0, z: 0, r: 10, kind: 'center' });

  // big peppermint lollipops (cover)
  const stickMat = lambert(0xffffff, { map: stripeTex('#ff2e4d', '#ffffff', 1, 4) }), stickGeo = new THREE.CylinderGeometry(0.28, 0.28, 1, 8);
  const lollyBase = new THREE.CylinderGeometry(1.0, 1.2, 0.5, 16), baseMat = lambert(0xe0203d);
  for (let i = 0; i < 14; i++) {
    const R = mr(1.9, 2.6), H = mr(3.4, 4.6), p = freeSpot(22, ISLAND_R - 6, R + 2.5, mrand);
    add(lollyBase, baseMat, p.x, 0.25, p.z);
    add(stickGeo, stickMat, p.x, H / 2, p.z).scale.y = H;
    lolly(p.x, H, p.z, R, mr(0, TAU), swirlMats[i % swirlMats.length]);
    colliders.push({ x: p.x, z: p.z, r: R * 0.8 });
  }
  // sugary gumdrops (the "boulders")
  const domeGeo = new THREE.SphereGeometry(1, 16, 8, 0, TAU, 0, Math.PI / 2);
  const gumMats = CANDY_COLS.map((c) => lambert(c, { map: sugarTex }));
  for (let i = 0; i < 24; i++) {
    const r = mr(1.6, 3.0), p = freeSpot(22, ISLAND_R - 6, r + 3, mrand);
    add(domeGeo, gumMats[i % gumMats.length], p.x, 0, p.z).scale.set(r, r * 1.2, r);
    colliders.push({ x: p.x, z: p.z, r: r * 0.95 });
  }
  // chocolate truffles with sprinkles
  const truffleMat = lambert(0xffffff, { map: truffleTex });
  for (let i = 0; i < 7; i++) {
    const r = mr(2.0, 2.8), p = freeSpot(22, ISLAND_R - 6, r + 3, mrand);
    add(domeGeo, truffleMat, p.x, 0, p.z).scale.set(r, r * 0.95, r);
    colliders.push({ x: p.x, z: p.z, r: r * 0.95 });
  }
  // chocolate cakes with icing drips (one or two layers)
  const cakeSide = new THREE.CylinderGeometry(1, 1, 1, 24, 1, true), cakeTop = new THREE.CircleGeometry(1, 24);
  const dripMat = lambert(0xffffff, { map: dripTex }), topMat = lambert(0xffffff, { map: drizzleTex });
  for (let i = 0; i < 12; i++) {
    const r = mr(2.0, 3.0), p = freeSpot(22, ISLAND_R - 6, r + 3, mrand), tiers = mrand() < 0.4 ? 2 : 1;
    let y = 0;
    for (let k = 0; k < tiers; k++) {
      const rr = r * (1 - k * 0.35), hh = mr(1.2, 1.8);
      add(cakeSide, dripMat, p.x, y + hh / 2, p.z).scale.set(rr, hh, rr);
      const top = add(cakeTop, topMat, p.x, y + hh, p.z); top.scale.setScalar(rr); top.rotation.x = -Math.PI / 2;
      y += hh;
    }
    colliders.push({ x: p.x, z: p.z, r });
  }
  // giant candy canes
  const caneMat = lambert(0xffffff, { map: stripeTex('#ff2e4d', '#ffffff', 1, 6) });
  const caneGeo = new THREE.CylinderGeometry(0.45, 0.45, 7, 10), hookGeo = new THREE.TorusGeometry(1.2, 0.45, 8, 14, Math.PI);
  for (let i = 0; i < 8; i++) {
    const p = freeSpot(24, ISLAND_R - 8, 3, mrand);
    const g = new THREE.Group(); g.position.set(p.x, 0, p.z); g.rotation.y = mr(0, TAU); W.add(g);
    add(caneGeo, caneMat, 0, 3.5, 0, g);
    add(hookGeo, caneMat, 1.2, 7, 0, g);
    colliders.push({ x: p.x, z: p.z, r: 1.0 });
  }

  // hot chocolate pools, with a whipped-cream rim
  const chocMat = basic(0xffffff, { map: chocTex }), creamMat = lambert(0xfff6ea);
  for (let i = 0; i < 10; i++) {
    const r = mr(3, 7), p = freeSpot(24, ISLAND_R - r - 4, r + 3, mrand);
    const pool = add(new THREE.CircleGeometry(r, 32), chocMat, p.x, 0.04, p.z); pool.rotation.x = -Math.PI / 2;
    const rim = add(new THREE.TorusGeometry(r + 0.25, 0.35, 6, 40), creamMat, p.x, 0.1, p.z); rim.rotation.x = -Math.PI / 2;
    lavaPools.push({ x: p.x, z: p.z, r });
  }

  // biscuit-stick fence round the edge
  const postGeo = new THREE.BoxGeometry(0.35, 1.8, 0.35), railGeo = new THREE.BoxGeometry(1, 0.25, 0.2), biscuit = lambert(0xd99a52);
  const N = 90, fr = ISLAND_R + 0.6, seg = (TAU / N) * fr;
  for (let i = 0; i < N; i++) {
    const a = (i / N) * TAU, x = Math.cos(a) * fr, z = Math.sin(a) * fr;
    add(postGeo, biscuit, x, 0.9, z).rotation.y = -a;
    const am = a + Math.PI / N;
    for (const y of [0.6, 1.3]) { const rail = add(railGeo, biscuit, Math.cos(am) * fr, y, Math.sin(am) * fr); rail.rotation.y = -am + Math.PI / 2; rail.scale.x = seg; }
  }

  // peppermint launch pads
  addPads(W, lambert(0xffffff), basic(0xffffff, { map: swirlTex(['#e8102f', '#ffffff'], 10) }), 0xff4d6d);
  mergeMap(W, new Set(pads.map((p) => p.ring.parent)));
  buildFloaters(W, [0xff2e4d, 0xffd23f, 0x3ccf6e, 0x2fb8ff, 0xffffff, 0x9b5cff], 0.35, -0.4);
}

// ===================================================================
// Worlds: each is built the first time it's needed, then kept (hidden) for next time
// ===================================================================
const WORLDS = {
  lava: {
    name: 'Lava Volcano', emoji: '🌋', seed: 1337, build: buildLava,
    sky: ['#2c69d4', '#86b9f0', '#f3c39a', '#e89a6e'], fog: 0xe9b08c, hemi: [0xcfe2ff, 0x8a3a1a],
    padColors: [0x5ff6ff, 0xffffff, 0x19d3ff], poolFx: [0xff6a00, 0xffd23f],
    mm: { ground: '#5a4d5c', pool: '#ff7a1a', center: '#2a2228', dot: '#ff9a1a', pad: '#5ff6ff' },
    poolWarn: "🌋 You're in lava!", poolElim: 'melted in the lava 🌋',
    tick(dt, now) {
      lavaTex.offset.x += dt * 0.03; lavaTex.offset.y += dt * 0.015;
      seaTex.offset.x += dt * 0.004; seaTex.offset.y -= dt * 0.002;
      for (const f of torches) f.scale.y = 1 + Math.sin(now * 0.02 + f.id) * 0.2;
      updateSmoke(dt);
    },
  },
  candy: {
    name: 'Candy Land', emoji: '🍭', seed: 4242, unlockAt: 8, build: buildCandy, spinPads: true,
    sky: ['#3d8ff0', '#9fd2ff', '#ffd0ea', '#ffb0d5'], fog: 0xffc9e3, hemi: [0xfff0ff, 0xd98aa8],
    padColors: [0xff2e4d, 0xffffff, 0xff9ab0], poolFx: [0x5a2e17, 0xa0643a, 0xfff3e0],
    mm: { ground: '#f39ac0', pool: '#7a4322', center: '#c8326a', dot: '#ffd23f', pad: '#ff2e4d' },
    poolWarn: "☕ You're in hot chocolate!", poolElim: 'melted in the hot chocolate ☕',
    tick(dt) {
      chocTex.offset.x += dt * 0.02; chocTex.offset.y += dt * 0.01;
      chocSeaTex.offset.x += dt * 0.003; chocSeaTex.offset.y -= dt * 0.0015;
      if (!simulating()) return;
      for (const l of lavaPools) if (Math.random() < dt * l.r * 0.5) { // steam
        const a = rand(0, TAU), r = Math.sqrt(Math.random()) * l.r;
        spawnP(l.x + Math.cos(a) * r, 0.3, l.z + Math.sin(a) * r, rand(-0.3, 0.3), rand(1.2, 2.2), rand(-0.3, 0.3), 0xfff3ea, rand(0.25, 0.45), 1.3);
      }
    },
  },
};
const WORLD_KEYS = Object.keys(WORLDS);
let world = WORLDS.lava;
let building = null; // the world being built right now
function setWorld(key) {
  const w = WORLDS[key] || WORLDS.lava;
  if (w === world && w.group) return;
  if (world.group) world.group.visible = false;
  if (!w.group) {
    colliders.length = lavaPools.length = pads.length = torches.length = 0;
    building = w; mrand = mulberry32(w.seed);
    w.group = new THREE.Group(); scene.add(w.group);
    w.build(w.group);
    w.saved = { colliders: [...colliders], pools: [...lavaPools], pads: [...pads], torches: [...torches] };
    w.skyTex = skyTex(w.sky);
    building = null;
  }
  const refill = (arr, from) => { arr.length = 0; arr.push(...from); };
  refill(colliders, w.saved.colliders); refill(lavaPools, w.saved.pools); refill(pads, w.saved.pads); refill(torches, w.saved.torches);
  w.group.visible = true;
  world = w;
  scene.background = w.skyTex; scene.fog.color.setHex(w.fog);
  hemi.color.setHex(w.hemi[0]); hemi.groundColor.setHex(w.hemi[1]);
}

const inLava = (x, z) => lavaPools.some((l) => dist(x, z, l.x, l.z) < l.r - 0.3);

// ===================================================================
// Particles (one reused pool)
// ===================================================================
// particles are drawn in two batches (cubes and leaves), not one draw call each (specs/10-tech.md)
const PMAX = 700;
const pGeo = new THREE.BoxGeometry(1, 1, 1);
const leafGeo = new THREE.BoxGeometry(1, 0.18, 0.6);
const HIDDEN = new THREE.Matrix4().makeScale(0, 0, 0);
const pColor = new THREE.Color(), pObj = new THREE.Object3D();
function particleBatch(geo) {
  const m = new THREE.InstancedMesh(geo, basic(0xffffff), PMAX);
  m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  m.frustumCulled = false;
  for (let i = 0; i < PMAX; i++) { m.setMatrixAt(i, HIDDEN); m.setColorAt(i, pColor.setHex(0xffffff)); }
  scene.add(m);
  return m;
}
const pBox = particleBatch(pGeo), pLeaf = particleBatch(leafGeo);
const particles = Array.from({ length: PMAX }, () => ({ life: 0, mesh: pBox }));
let pIdx = 0;
function placeP(i, p) {
  pObj.position.set(p.x, p.y, p.z); pObj.rotation.set(p.rx, p.ry, p.rz);
  pObj.scale.setScalar(p.size * Math.sqrt(p.life / p.max));
  pObj.updateMatrix();
  p.mesh.setMatrixAt(i, pObj.matrix);
  p.mesh.instanceMatrix.needsUpdate = true;
}
function spawnP(x, y, z, vx, vy, vz, color, size, life, grav = 0, leaf = false) {
  const i = pIdx, p = particles[i]; pIdx = (pIdx + 1) % PMAX;
  const mesh = leaf ? pLeaf : pBox;
  if (p.life > 0 && p.mesh !== mesh) p.mesh.setMatrixAt(i, HIDDEN);
  p.mesh = mesh;
  mesh.setColorAt(i, pColor.setHex(color)); mesh.instanceColor.needsUpdate = true;
  p.x = x; p.y = y; p.z = z; p.rx = Math.random() * TAU; p.ry = Math.random() * TAU; p.rz = 0;
  p.vx = vx; p.vy = vy; p.vz = vz; p.life = p.max = life; p.grav = grav; p.size = size; p.spin = rand(-8, 8);
  placeP(i, p);
}
function burst(x, y, z, n, colors, speed, size, life, grav = 10, leaf = false) {
  for (let i = 0; i < n; i++) {
    const a = rand(0, TAU), u = rand(-0.3, 1), s = rand(0.3, 1) * speed;
    spawnP(x, y, z, Math.cos(a) * s * Math.sqrt(1 - u * u), u * s + speed * 0.3, Math.sin(a) * s * Math.sqrt(1 - u * u), pick(colors), size * rand(0.6, 1.2), life * rand(0.6, 1.2), grav, leaf);
  }
}
function updateParticles(dt) {
  for (let i = 0; i < PMAX; i++) {
    const p = particles[i];
    if (p.life <= 0) continue;
    p.life -= dt;
    if (p.life <= 0) { p.mesh.setMatrixAt(i, HIDDEN); p.mesh.instanceMatrix.needsUpdate = true; continue; }
    p.vy -= p.grav * dt;
    p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
    if (p.y < 0.05 && p.grav > 0) { p.y = 0.05; p.vy = 0; p.vx *= 0.85; p.vz *= 0.85; }
    p.rx += p.spin * dt; p.rz += p.spin * 0.5 * dt;
    placeP(i, p);
  }
}
function clearParticles() {
  particles.forEach((p, i) => { if (p.life > 0) p.mesh.setMatrixAt(i, HIDDEN); p.life = 0; });
  pBox.instanceMatrix.needsUpdate = pLeaf.instanceMatrix.needsUpdate = true;
}

// Merge meshes into one, so the graphics chip draws them in one go. Each item is { mesh, matrix }:
// the matrix places the mesh's geometry in the merged mesh's space. With `colors`, each part's
// material colour is stored in the geometry, so parts of different colours can share one material.
function mergeGeometry(items, colors) {
  const parts = items.map((it) => (it.mesh.geometry.index ? it.mesh.geometry.toNonIndexed() : it.mesh.geometry.clone()).applyMatrix4(it.matrix));
  const count = parts.reduce((n, g) => n + g.attributes.position.count, 0);
  const geo = new THREE.BufferGeometry();
  for (const [name, size] of [['position', 3], ['normal', 3], ['uv', 2]]) {
    const arr = new Float32Array(count * size);
    let off = 0;
    for (const g of parts) { arr.set(g.attributes[name].array, off); off += g.attributes[name].array.length; }
    geo.setAttribute(name, new THREE.BufferAttribute(arr, size));
  }
  if (colors) {
    const arr = new Float32Array(count * 3);
    let off = 0;
    parts.forEach((g, i) => {
      const c = items[i].mesh.material.color;
      for (let k = 0; k < g.attributes.position.count; k++) { arr[off++] = c.r; arr[off++] = c.g; arr[off++] = c.b; }
    });
    geo.setAttribute('color', new THREE.BufferAttribute(arr, 3));
  }
  geo.computeBoundingSphere();
  for (const it of items) it.mesh.parent.remove(it.mesh);
  return geo;
}
const mergeable = (m) => m.isMesh && !Array.isArray(m.material) && m.geometry.attributes.normal && m.geometry.attributes.uv;
function mergeByMaterial(items) {
  const byMat = new Map();
  for (const it of items) {
    if (!mergeable(it.mesh)) continue;
    if (!byMat.has(it.mesh.material)) byMat.set(it.mesh.material, []);
    byMat.get(it.mesh.material).push(it);
  }
  const out = [];
  for (const [mat, list] of byMat) if (list.length > 1) out.push(new THREE.Mesh(mergeGeometry(list), mat));
  return out;
}
// map scenery never moves: merge it all (except the launch pads, flames and smoke, which animate)
function mergeMap(W, keep) {
  W.updateMatrixWorld(true);
  const objects = [...W.children], items = [];
  for (const o of objects) {
    if (keep.has(o)) continue;
    o.traverse((m) => { if (m.isMesh) items.push({ mesh: m, matrix: m.matrixWorld.clone() }); });
  }
  for (const m of mergeByMaterial(items)) W.add(m);
  for (const o of objects) {
    let left = false;
    o.traverse((m) => { if (m.isMesh) left = true; });
    if (!left && o.parent) o.parent.remove(o);
  }
}
// a hero's parts that move together (same limb) become one mesh: one lit and one unlit (eyes, glows)
function mergeHero(h, skip) {
  const groups = [];
  h.root.traverse((o) => { if (o.isGroup) groups.push(o); });
  const mats = {};
  const mat = (unlit) => mats[unlit] || (mats[unlit] = heroMat(h, 0xffffff, unlit, true));
  for (const g of groups) {
    const items = g.children.filter((c) => mergeable(c) && !c.children.length && !skip.includes(c)).map((c) => { c.updateMatrix(); return { mesh: c, matrix: c.matrix }; });
    for (const unlit of [false, true]) {
      const list = items.filter((it) => !!it.mesh.material.isMeshBasicMaterial === unlit);
      if (list.length > 1) g.add(new THREE.Mesh(mergeGeometry(list, true), mat(unlit)));
    }
  }
}

// expanding blast spheres
const blasts = [];
const blastGeo = new THREE.IcosahedronGeometry(1, 2);
function blastFx(x, y, z, radius, color) {
  const m = new THREE.Mesh(blastGeo, basic(color, { transparent: true, opacity: 0.85, depthWrite: false }));
  m.position.set(x, y, z); scene.add(m);
  blasts.push({ m, t: 0, dur: 0.4, radius });
}
function updateBlasts(dt) {
  for (let i = blasts.length - 1; i >= 0; i--) {
    const b = blasts[i]; b.t += dt; const k = b.t / b.dur;
    b.m.scale.setScalar(b.radius * (0.2 + 0.8 * Math.sqrt(k)));
    b.m.material.opacity = 0.85 * (1 - k);
    if (k >= 1) { scene.remove(b.m); b.m.material.dispose(); blasts.splice(i, 1); }
  }
}

// ===================================================================
// Audio: tiny synth sounds (specs/09-screens-and-audio.md)
// ===================================================================
let actx = null, noiseBuf = null;
function audio() {
  if (!actx) {
    try {
      actx = new (window.AudioContext || window.webkitAudioContext)();
      noiseBuf = actx.createBuffer(1, actx.sampleRate, actx.sampleRate);
      const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    } catch (e) { actx = null; }
  }
  return actx;
}
function tone(freq, dur, type, vol, slideTo, delay = 0) {
  const a = audio(); if (!a) return;
  const t = a.currentTime + delay, o = a.createOscillator(), g = a.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(a.destination); o.start(t); o.stop(t + dur + 0.02);
}
function noise(dur, vol, freq) {
  const a = audio(); if (!a) return;
  const t = a.currentTime, s = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain();
  s.buffer = noiseBuf; f.type = 'lowpass'; f.frequency.value = freq;
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(f).connect(g).connect(a.destination); s.start(t); s.stop(t + dur);
}
const SFX = {
  brick: (v) => tone(260, 0.1, 'square', 0.05 * v, 120),
  zap: (v) => tone(1200, 0.06, 'sawtooth', 0.03 * v, 2400),
  bomb: (v) => tone(180, 0.15, 'triangle', 0.08 * v, 90),
  boom: (v) => { noise(0.5, 0.3 * v, 700); tone(90, 0.4, 'sine', 0.15 * v, 40); },
  barf: (v) => { noise(0.3, 0.12 * v, 1400); tone(140, 0.25, 'sawtooth', 0.04 * v, 70); },
  laser: (v) => tone(320, 0.28, 'sawtooth', 0.025 * v, 360),
  hit: (v) => tone(700, 0.05, 'square', 0.03 * v, 500),
  shield: (v) => { tone(200, 0.15, 'square', 0.06 * v, 400); tone(400, 0.2, 'square', 0.05 * v, 600, 0.1); },
  dash: (v) => tone(400, 0.3, 'sawtooth', 0.05 * v, 1600),
  pickup: (v) => { tone(660, 0.08, 'sine', 0.1 * v); tone(990, 0.14, 'sine', 0.1 * v, null, 0.08); },
  elim: (v) => { tone(500, 0.12, 'square', 0.05 * v, 250); tone(250, 0.25, 'square', 0.05 * v, 100, 0.1); },
  chomp: (v) => { noise(0.2, 0.15 * v, 500); tone(120, 0.2, 'square', 0.05 * v, 60); },
  roar: (v) => { tone(160, 0.7, 'sawtooth', 0.12 * v, 50); noise(0.7, 0.2 * v, 400); },
  freeze: (v) => { tone(1800, 0.4, 'sine', 0.06 * v, 600); noise(0.4, 0.1 * v, 4000); },
  scream: (v) => { tone(900, 0.6, 'sawtooth', 0.06 * v, 1600); tone(700, 0.6, 'square', 0.04 * v, 300); },
  gust: (v) => noise(0.3, 0.12 * v, 2500),
  hole: (v) => { tone(300, 1.0, 'sine', 0.15 * v, 40); noise(0.8, 0.1 * v, 300); },
  splat: () => noise(0.25, 0.15, 600),
  win: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.3, 'square', 0.06, null, i * 0.15)),
  lose: () => [392, 330, 262, 196].forEach((f, i) => tone(f, 0.35, 'triangle', 0.08, null, i * 0.18)),
  boing: (v) => { tone(180, 0.35, 'sine', 0.14 * v, 900); noise(0.35, 0.08 * v, 3000); },
  fart: (v) => { noise(0.5, 0.25 * v, 260); tone(95, 0.45, 'sawtooth', 0.06 * v, 45); },
  punch: (v) => { noise(0.08, 0.12 * v, 1200); tone(220, 0.08, 'square', 0.04 * v, 110); },
  thunder: (v) => { noise(1.0, 0.3 * v, 900); tone(70, 0.7, 'sawtooth', 0.1 * v, 30); },
  pop: (v) => tone(900, 0.05, 'square', 0.04 * v, 1800),
  squish: (v) => { tone(200, 0.3, 'sine', 0.12 * v, 500); noise(0.2, 0.08 * v, 800); },
  alert: () => [880, 880, 1175].forEach((f, i) => tone(f, 0.14, 'square', 0.05, null, i * 0.13)),
};
function sfx(name, x, z) {
  let v = 1;
  if (x !== undefined && player) { const d = dist(x, z, player.x, player.z); if (d > 45) return; v = 1 - d / 50; }
  SFX[name](v);
}

// ===================================================================
// Hero models (specs/03-heroes.md, art/heroes/)
// ===================================================================
function heroMat(h, color, isBasic, vertexColors = false) {
  const key = color + (isBasic ? 'b' : 'l') + (vertexColors ? 'v' : '');
  if (!h.matCache[key]) { const o = { vertexColors }; const m = isBasic ? basic(color, o) : lambert(color, o); h.matCache[key] = m; h.mats.push(m); }
  return h.matCache[key];
}
function addBox(h, parent, w, ht, d, color, x, y, z, o = {}) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, ht, d), heroMat(h, color, o.basic));
  m.position.set(x, y, z);
  if (o.rx) m.rotation.x = o.rx; if (o.ry) m.rotation.y = o.ry; if (o.rz) m.rotation.z = o.rz;
  parent.add(m); return m;
}
function addCyl(h, parent, r, len, color, x, y, z, o = {}) {
  const geo = new THREE.CylinderGeometry(r, o.r2 || r, len, o.seg || 10);
  geo.rotateX(Math.PI / 2); // lie along z
  const m = new THREE.Mesh(geo, heroMat(h, color, o.basic)); m.position.set(x, y, z); parent.add(m); return m;
}
function addBall(h, parent, r, color, x, y, z) {
  const m = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 1), heroMat(h, color)); m.position.set(x, y, z); parent.add(m); return m;
}
function leafClump(h, parent, x, y, z, s) {
  return addBox(h, parent, s, s, s, pick(LEAF_COLORS), x, y, z, { rx: rand(0, 1), ry: rand(0, 1), rz: rand(0, 1) });
}

// skeleton shared by every hero: hips 0.95, torso to 1.9, head centre 2.42 (front face at z=0.53)
function buildRig(h, c) {
  const body = new THREE.Group(); h.root.add(body);
  const legL = new THREE.Group(), legR = new THREE.Group();
  legL.position.set(-0.28, 0.95, 0); legR.position.set(0.28, 0.95, 0); body.add(legL, legR);
  for (const leg of [legL, legR]) {
    addBox(h, leg, 0.48, 0.7, 0.52, c.pants, 0, -0.35, 0);
    addBox(h, leg, 0.56, 0.3, 0.7, c.boots, 0, -0.8, 0.06);
  }
  const torso = addBox(h, body, 1.15, 0.95, 0.7, c.torso, 0, 1.42, 0);
  const armL = new THREE.Group(), armR = new THREE.Group();
  armL.position.set(-0.8, 1.82, 0); armR.position.set(0.8, 1.82, 0); body.add(armL, armR);
  for (const arm of [armL, armR]) {
    addBox(h, arm, 0.4, 0.62, 0.44, c.arm, 0, -0.3, 0);
    addBox(h, arm, 0.48, 0.34, 0.5, c.glove, 0, -0.75, 0);
  }
  const head = new THREE.Group(); head.position.set(0, 2.42, 0); body.add(head);
  return { body, legL, legR, armL, armR, head, torso };
}
// big white angry eyes (Brawl Stars style)
function addEyes(h, head, browColor, y = 0) {
  for (const s of [-1, 1]) {
    addBox(h, head, 0.25, 0.27, 0.04, 0xffffff, s * 0.2, y - 0.02, 0.55, { basic: true });
    addBox(h, head, 0.11, 0.15, 0.04, 0x111111, s * 0.15, y - 0.05, 0.575, { basic: true });
    addBox(h, head, 0.32, 0.08, 0.05, browColor, s * 0.2, y + 0.15, 0.58, { rz: s * 0.38 });
  }
}

const MODELS = {
  brickster(h) {
    const r = buildRig(h, { pants: 0x3b3b46, boots: 0x6b3e1e, torso: 0xf2b705, arm: 0xe8731c, glove: 0x7a4a22 });
    addBox(h, r.head, 1.05, 1.0, 1.05, 0x1b1b24, 0, 0, 0);
    addEyes(h, r.head, 0x5a3a1a);
    addBox(h, r.head, 1.22, 0.42, 1.22, 0xffcc00, 0, 0.55, 0);           // hard hat
    addBox(h, r.head, 1.42, 0.1, 1.45, 0xffcc00, 0, 0.36, 0.06);         // brim
    for (const [x, y] of [[-0.12, 0.5], [0.12, 0.5], [0, 0.62]]) addBox(h, r.head, 0.21, 0.1, 0.04, 0xd02a1a, x, y, 0.62); // brick logo
    for (const arm of [r.armL, r.armR]) addBox(h, arm, 0.54, 0.26, 0.54, 0x9aa0a8, 0, 0.02, 0); // shoulder pads
    addBox(h, r.body, 1.2, 0.18, 0.74, 0x6b3e1e, 0, 1.0, 0);              // belt
    addBox(h, r.body, 0.12, 0.4, 0.08, 0x9aa0a8, -0.45, 0.95, 0.38);     // wrench
    const cols = [0xc8361e, 0xe8731c, 0x8a8f99, 0xc8361e, 0x3b3b46, 0xe8731c];
    let k = 0;
    for (let y = 0; y < 3; y++) for (let x = 0; x < 2; x++) addBox(h, r.body, 0.56, 0.36, 0.42, cols[k++], (x - 0.5) * 0.6 + (y % 2) * 0.1, 1.2 + y * 0.38, -0.6);
    const gun = new THREE.Group(); gun.position.set(-0.3, 1.5, 0.8); r.body.add(gun);
    addBox(h, gun, 0.5, 0.5, 0.95, 0xffcc00, 0, 0, 0);
    addBox(h, gun, 0.3, 0.25, 0.5, 0xe8731c, 0, 0.35, -0.1);
    addCyl(h, gun, 0.16, 0.6, 0x5a5f69, 0, 0.02, 0.75);
    r.gun = gun; r.gunPose = true;
    return r;
  },
  zippy(h) {
    const r = buildRig(h, { pants: 0x1d4fd8, boots: 0xffcc00, torso: 0x1d4fd8, arm: 0xffcc00, glove: 0x2f7bff });
    addBox(h, r.head, 1.1, 1.05, 1.1, 0xffcc00, 0, 0.02, 0);              // helmet
    addBox(h, r.head, 0.9, 0.6, 0.05, 0x14141c, 0, -0.1, 0.55);           // dark face
    addEyes(h, r.head, 0x0a0a10, -0.1);
    addBox(h, r.head, 1.16, 0.18, 1.16, 0x1d4fd8, 0, 0.32, 0);            // goggle strap
    for (const s of [-1, 1]) {
      addCyl(h, r.head, 0.2, 0.12, 0x1d4fd8, s * 0.24, 0.32, 0.6);
      addCyl(h, r.head, 0.14, 0.14, 0x5ff6ff, s * 0.24, 0.32, 0.62, { basic: true });
    }
    addBox(h, r.head, 0.16, 0.5, 0.3, 0xffe14d, 0.62, 0.45, 0, { rz: -0.5 }); // lightning fin
    addBox(h, r.head, 0.16, 0.5, 0.3, 0xffe14d, 0.72, 0.85, -0.05, { rz: 0.5 });
    addBox(h, r.head, 0.16, 0.45, 0.3, 0xffe14d, 0.66, 1.2, -0.1, { rz: -0.5 });
    addBox(h, r.body, 1.17, 0.24, 0.72, 0xffcc00, 0, 1.15, 0);            // yellow band
    addBox(h, r.body, 0.12, 0.32, 0.04, 0xffe14d, 0.05, 1.58, 0.37, { rz: 0.6 }); // chest bolt
    addBox(h, r.body, 0.12, 0.32, 0.04, 0xffe14d, -0.05, 1.36, 0.37, { rz: 0.6 });
    addBox(h, r.body, 0.85, 0.2, 0.85, 0xffcc00, 0, 1.92, 0);             // scarf
    r.scarf = addBox(h, r.body, 0.32, 0.08, 1.1, 0xffd23f, 0.25, 1.92, -0.85);
    return r;
  },
  boomer(h) {
    const r = buildRig(h, { pants: 0x55702a, boots: 0x6b3e1e, torso: 0x5f8a2e, arm: 0x5f8a2e, glove: 0x7a4a22 });
    addBox(h, r.head, 1.05, 1.0, 1.05, 0x14141c, 0, 0, 0);
    addEyes(h, r.head, 0x0a0a10);
    addBox(h, r.head, 1.2, 0.5, 1.2, 0x6a8f2a, 0, 0.45, -0.02);           // helmet
    addBox(h, r.head, 1.3, 0.1, 1.35, 0x6a8f2a, 0, 0.22, 0.04);
    addBox(h, r.head, 0.26, 0.26, 0.05, 0xd02a1a, -0.42, 0.5, 0.6, { rz: 0.78 }); // star badge
    addBox(h, r.head, 0.13, 0.13, 0.05, 0xffcc00, -0.42, 0.5, 0.63, { rz: 0.78 });
    addBox(h, r.head, 1.24, 0.14, 1.24, 0x3a2a1a, 0, 0.55, 0);           // goggle strap
    for (const s of [-1, 1]) {
      addCyl(h, r.head, 0.2, 0.12, 0x3a3a3a, s * 0.22 + 0.1, 0.55, 0.62);
      addCyl(h, r.head, 0.14, 0.14, 0xffb020, s * 0.22 + 0.1, 0.55, 0.64, { basic: true });
    }
    addBox(h, r.head, 1.12, 0.34, 1.12, 0xff7a1a, 0, -0.38, 0);           // orange scarf
    r.scarf = addBox(h, r.body, 0.3, 0.08, 0.9, 0xff7a1a, -0.3, 1.95, -0.75);
    for (const arm of [r.armL, r.armR]) addBox(h, arm, 0.46, 0.14, 0.5, 0xffa21a, 0, -0.55, 0);
    for (const leg of [r.legL, r.legR]) addBox(h, leg, 0.52, 0.12, 0.56, 0xffcc00, 0, -0.5, 0);
    addBox(h, r.body, 1.2, 0.16, 0.74, 0x6b3e1e, 0, 1.0, 0);              // belt
    for (const [x, y] of [[-0.32, 1.5], [0.32, 1.5], [0, 2.05], [0, 1.1]]) {
      addBall(h, r.body, 0.36, 0x1a1a22, x, y, -0.62);
      addBox(h, r.body, 0.08, 0.18, 0.08, 0xffa020, x + 0.1, y + 0.38, -0.62, { basic: true });
    }
    const zook = new THREE.Group(); zook.position.set(-0.62, 2.05, 0.2); r.body.add(zook);
    addCyl(h, zook, 0.27, 2.3, 0x4f7a26, 0, 0, 0.2);
    addCyl(h, zook, 0.31, 0.18, 0xffcc00, 0, 0, 1.25);
    addCyl(h, zook, 0.31, 0.18, 0xffcc00, 0, 0, -0.85);
    addCyl(h, zook, 0.2, 0.06, 0x111111, 0, 0, 1.36);
    addBox(h, zook, 0.05, 0.3, 0.3, 0xffcc00, -0.28, 0, 0.4, { rx: 0.78 });
    r.gun = zook; r.gunPose = true;
    return r;
  },
  shadow(h) {
    const r = buildRig(h, { pants: 0x1c1c26, boots: 0x111118, torso: 0x22222e, arm: 0x22222e, glove: 0x111118 });
    addBox(h, r.head, 1.05, 1.0, 1.05, 0x1c1c26, 0, 0, 0);                 // hood
    addBox(h, r.head, 0.9, 0.36, 0.04, 0x08080c, 0, 0.0, 0.53);             // mask slit
    addEyes(h, r.head, 0x7b3fe0);
    addBox(h, r.head, 1.1, 0.16, 1.1, 0x7b3fe0, 0, 0.32, 0);               // headband
    r.scarf = addBox(h, r.head, 0.1, 0.12, 0.9, 0x7b3fe0, 0.15, 0.3, -0.9);
    addBox(h, r.head, 0.1, 0.12, 0.7, 0x7b3fe0, -0.1, 0.25, -0.8, { ry: 0.3 });
    addBox(h, r.body, 1.2, 0.18, 0.74, 0x7b3fe0, 0, 1.0, 0);                // belt
    addBox(h, r.body, 0.35, 0.3, 0.2, 0x3a2a4a, -0.4, 1.0, 0.4);            // star pouch
    addBox(h, r.body, 0.9, 0.12, 0.08, 0x9aa0a8, 0, 1.5, -0.4, { rz: 0.78 }); // stars on the back
    addBox(h, r.body, 0.9, 0.12, 0.08, 0x9aa0a8, 0, 1.5, -0.4, { rz: -0.78 });
    return r;
  },
  frosty(h) {
    const r = buildRig(h, { pants: 0x1f5fbf, boots: 0xe8f6ff, torso: 0x2f9cf0, arm: 0x2f9cf0, glove: 0xe8f6ff });
    addBox(h, r.head, 1.05, 1.0, 1.05, 0x14141c, 0, 0, 0);
    addEyes(h, r.head, 0x0a0a10);
    addBox(h, r.head, 1.3, 0.3, 1.25, 0xffffff, 0, 0.58, -0.02);           // fur hood
    addBox(h, r.head, 0.2, 1.1, 1.25, 0xffffff, 0.62, 0, -0.02);
    addBox(h, r.head, 0.2, 1.1, 1.25, 0xffffff, -0.62, 0, -0.02);
    addBox(h, r.head, 1.3, 1.1, 0.2, 0x2f9cf0, 0, 0, -0.6);
    addBox(h, r.head, 1.3, 0.2, 1.25, 0xffffff, 0, -0.56, -0.02);
    addBox(h, r.head, 0.3, 0.8, 0.3, 0xbff4ff, 0, 1.05, 0, { basic: true, rz: 0.25 }); // ice crystals
    addBox(h, r.head, 0.2, 0.5, 0.2, 0xdffaff, 0.3, 0.9, 0, { basic: true, rz: -0.5 });
    addBox(h, r.body, 1.3, 0.3, 0.85, 0x5ab8ff, 0, 1.2, 0);                // puffy parka rolls
    addBox(h, r.body, 1.3, 0.3, 0.85, 0x5ab8ff, 0, 1.62, 0);
    return r;
  },
  chomp(h) {
    const r = buildRig(h, { pants: 0x3f9a3a, boots: 0x2d6e2a, torso: 0x3f9a3a, arm: 0x3f9a3a, glove: 0x2d6e2a });
    addBox(h, r.body, 0.8, 0.75, 0.05, 0xb8e986, 0, 1.4, 0.37);            // belly
    addBox(h, r.head, 0.95, 0.9, 0.95, 0x14141c, 0, -0.05, 0);              // kid's face inside
    addEyes(h, r.head, 0x0a0a10, -0.08);
    addBox(h, r.head, 1.25, 0.45, 1.3, 0x3f9a3a, 0, 0.55, 0);              // dino hood: top of head
    addBox(h, r.head, 1.1, 0.38, 0.55, 0x3f9a3a, 0, 0.5, 0.8);             // snout
    addBox(h, r.head, 1.25, 1.0, 0.2, 0x3f9a3a, 0, 0.05, -0.62);
    for (const s of [-1, 1]) {
      addBox(h, r.head, 0.18, 0.95, 1.2, 0x3f9a3a, s * 0.62, 0.05, 0);
      addBox(h, r.head, 0.2, 0.2, 0.1, 0xffffff, s * 0.32, 0.8, 0.62, { basic: true }); // dino eyes
      addBox(h, r.head, 0.1, 0.12, 0.1, 0x111111, s * 0.32, 0.8, 0.68, { basic: true });
    }
    for (let i = 0; i < 5; i++) addBox(h, r.head, 0.14, 0.18, 0.14, 0xffffff, -0.4 + i * 0.2, 0.24, 1.0, { basic: true }); // teeth
    addBox(h, r.head, 1.1, 0.18, 0.45, 0x3f9a3a, 0, -0.58, 0.55);          // lower jaw
    for (let i = 0; i < 4; i++) addBox(h, r.head, 0.12, 0.14, 0.12, 0xffffff, -0.3 + i * 0.2, -0.44, 0.7, { basic: true });
    for (let i = 0; i < 4; i++) addBox(h, r.body, 0.32, 0.32, 0.32, 0xff8a1a, 0, 1.2 + i * 0.45, -0.42, { rx: 0.78 }); // back spikes
    for (let i = 0; i < 3; i++) addBox(h, r.head, 0.3, 0.3, 0.3, 0xff8a1a, 0, 0.85 - i * 0.05, -0.2 - i * 0.35, { rx: 0.78 });
    const tail = new THREE.Group(); tail.position.set(0, 1.0, -0.35); r.body.add(tail);
    addBox(h, tail, 0.65, 0.55, 0.7, 0x3f9a3a, 0, 0, -0.35);
    addBox(h, tail, 0.48, 0.42, 0.6, 0x3f9a3a, 0, -0.15, -0.95);
    addBox(h, tail, 0.32, 0.3, 0.5, 0x3f9a3a, 0, -0.3, -1.45);
    addBox(h, tail, 0.22, 0.22, 0.22, 0xff8a1a, 0, 0.3, -0.6, { rx: 0.78 });
    r.tail = tail;
    return r;
  },
  pete(h) {
    const r = buildRig(h, { pants: 0x2a2a35, boots: 0x3a2a1a, torso: 0xffffff, arm: 0xffffff, glove: 0xffffff });
    addBox(h, r.head, 1.05, 1.0, 1.05, 0x14141c, 0, 0, 0);
    addEyes(h, r.head, 0x0a0a10, 0.05);
    addBox(h, r.head, 0.36, 0.14, 0.1, 0x6b3a18, -0.17, -0.22, 0.58, { rz: -0.25 }); // big mustache
    addBox(h, r.head, 0.36, 0.14, 0.1, 0x6b3a18, 0.17, -0.22, 0.58, { rz: 0.25 });
    addBox(h, r.head, 1.0, 0.25, 1.0, 0xffffff, 0, 0.6, 0);                // chef hat band
    addBox(h, r.head, 1.2, 0.65, 1.2, 0xffffff, 0, 1.05, 0);               // puffy top
    addBox(h, r.body, 0.95, 0.85, 0.05, 0xd8262b, 0, 1.3, 0.37);           // red apron
    for (const [x, y] of [[-0.24, 1.5], [0.24, 1.5], [0, 1.3], [-0.24, 1.1], [0.24, 1.1]]) addBox(h, r.body, 0.2, 0.2, 0.04, 0xffffff, x, y, 0.4);
    addBox(h, r.body, 0.85, 0.15, 0.85, 0xd8262b, 0, 1.92, 0);             // neckerchief
    addBox(h, r.body, 1.05, 1.05, 0.25, 0xd9a066, 0, 1.45, -0.5);          // pizza box backpack
    addBox(h, r.body, 0.4, 0.4, 0.04, 0xd8262b, 0, 1.45, -0.64);
    return r;
  },
  boo(h) {
    const W = 0xf4f4ff;
    const r = buildRig(h, { pants: W, boots: W, torso: W, arm: W, glove: W });
    r.legL.visible = r.legR.visible = false; r.float = true;
    addBox(h, r.body, 1.3, 0.55, 0.95, W, 0, 0.75, 0);                     // sheet
    for (let i = 0; i < 4; i++) addBox(h, r.body, 0.3, 0.3, 0.95, W, -0.48 + i * 0.32, 0.38 + (i % 2) * 0.1, 0); // wavy hem
    addBox(h, r.head, 1.12, 1.05, 1.05, W, 0, 0.02, 0);
    addBox(h, r.head, 0.86, 0.6, 0.04, 0x14141c, 0, -0.06, 0.53);
    addEyes(h, r.head, 0x0a0a10);
    addBox(h, r.head, 0.5, 0.25, 0.4, W, 0, 0.6, -0.1);
    return r;
  },
  inky(h) {
    const r = buildRig(h, { pants: 0x8e44ad, boots: 0x8e44ad, torso: 0x9b59b6, arm: 0x9b59b6, glove: 0xc39bd3 });
    r.legL.visible = r.legR.visible = false;
    r.tentacles = [];
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * TAU + 0.5;
      const g = new THREE.Group(); g.position.set(0, 0.95, 0); g.rotation.y = a; r.body.add(g);
      const arm = new THREE.Group(); g.add(arm);
      addBox(h, arm, 0.32, 0.32, 1.1, 0x8e44ad, 0, -0.45, 0.35, { rx: 0.9 });
      addBox(h, arm, 0.16, 0.06, 0.16, 0xf5b7e8, 0, -0.8, 0.55, { basic: true });
      r.tentacles.push(arm);
    }
    addBox(h, r.head, 1.35, 1.35, 1.05, 0x9b59b6, 0, 0.15, -0.02);         // big round head
    addBox(h, r.head, 0.92, 0.6, 0.04, 0x14141c, 0, -0.1, 0.53);
    addEyes(h, r.head, 0x0a0a10, -0.08);
    for (const [x, y, z] of [[-0.35, 0.7, 0.2], [0.3, 0.8, -0.1], [0.05, 0.85, 0.35], [-0.5, 0.4, -0.3], [0.55, 0.45, 0.1]]) addBox(h, r.head, 0.22, 0.06, 0.22, 0xd2a8e8, x, y, z);
    return r;
  },
  twister(h) {
    const r = buildRig(h, { pants: 0x2c3e50, boots: 0xecf0f1, torso: 0x1abc9c, arm: 0x1abc9c, glove: 0xecf0f1 });
    addBox(h, r.head, 1.05, 1.0, 1.05, 0x14141c, 0, 0, 0);
    addEyes(h, r.head, 0x0a0a10, -0.08);
    addBox(h, r.head, 1.2, 1.15, 0.25, 0x1abc9c, 0, 0.02, -0.5);             // hood
    addBox(h, r.head, 1.2, 0.25, 1.15, 0x1abc9c, 0, 0.55, 0);
    addBox(h, r.head, 1.14, 0.14, 1.14, 0xecf0f1, 0, 0.3, 0);               // goggle strap
    for (const sx of [-1, 1]) addCyl(h, r.head, 0.15, 0.12, 0x9ff3ff, sx * 0.24, 0.3, 0.58, { basic: true });
    for (let i = 0; i < 4; i++) addBox(h, r.head, 0.6 - i * 0.12, 0.14, 0.18, 0xffffff, 0, 0.75 + i * 0.13, 0, { ry: i * 0.8 }); // swirly hair
    for (let i = 0; i < 4; i++) { const a = i * 1.2; addBox(h, r.body, 0.12, 0.12, 0.04, 0xffffff, Math.cos(a) * 0.15 * (1 + i * 0.3), 1.45 + Math.sin(a) * 0.15 * (1 + i * 0.3), 0.37); }
    return r;
  },
  glaxo(h) {
    const r = buildRig(h, { pants: 0x3b1f6e, boots: 0xc0c6d0, torso: 0x5b2fa0, arm: 0x5b2fa0, glove: 0xc0c6d0 });
    addBox(h, r.head, 1.15, 1.1, 1.05, 0xc0c6d0, 0, 0.02, 0);              // silver helmet
    addBox(h, r.head, 0.95, 0.72, 0.03, 0x0d0b2a, 0, -0.02, 0.54);          // starry visor
    for (let i = 0; i < 9; i++) addBox(h, r.head, 0.05, 0.05, 0.02, 0xffffff, rand(-0.42, 0.42), rand(-0.32, 0.3), 0.56, { basic: true });
    addEyes(h, r.head, 0x7b3fe0);
    addBox(h, r.head, 0.06, 0.55, 0.06, 0xc0c6d0, 0.35, 0.8, 0);            // antenna
    addBox(h, r.head, 0.2, 0.2, 0.06, 0xffe14d, 0.35, 1.12, 0, { basic: true, rz: 0.78 });
    addBox(h, r.head, 0.2, 0.2, 0.06, 0xffe14d, 0.35, 1.12, 0, { basic: true });
    addBox(h, r.body, 0.3, 0.3, 0.04, 0xffe14d, 0, 1.5, 0.37, { basic: true, rz: 0.78 }); // chest star
    addBox(h, r.body, 0.3, 0.3, 0.04, 0xffe14d, 0, 1.5, 0.37, { basic: true });
    addBox(h, r.body, 1.2, 0.16, 0.74, 0xc0c6d0, 0, 1.0, 0);                // belt
    for (const sx of [-1, 1]) { addCyl(h, r.body, 0.22, 0.25, 0xc0c6d0, sx * 0.28, 1.5, -0.5, { seg: 10 }); addBox(h, r.body, 0.4, 0.8, 0.4, 0xc0c6d0, sx * 0.28, 1.45, -0.55); }
    return r;
  },
  // ----- candy heroes (specs/03-heroes.md) -----
  fart(h) {
    const G = [0x9bbf3a, 0x86a832, 0xb5d65a, 0x7a9a2c];
    const r = buildRig(h, { pants: 0x86a832, boots: 0x6f8a26, torso: 0x9bbf3a, arm: 0x9bbf3a, glove: 0xb5d65a });
    for (let i = 0; i < 14; i++) {                                         // puffy gas body
      const a = rand(0, TAU), s = rand(0.4, 0.6);
      addBox(h, r.body, s, s, s, pick(G), Math.cos(a) * 0.55, rand(1.0, 1.9), Math.sin(a) * 0.4, { rx: rand(0, 1), ry: rand(0, 1) });
    }
    for (const arm of [r.armL, r.armR]) addBox(h, arm, 0.5, 0.45, 0.5, pick(G), 0, -0.2, 0, { ry: 0.5 });
    addBox(h, r.head, 1.12, 1.05, 1.05, 0x9bbf3a, 0, 0.02, 0);             // gassy head
    addBox(h, r.head, 0.86, 0.6, 0.04, 0x14141c, 0, -0.06, 0.53);
    addEyes(h, r.head, 0x0a0a10, -0.06);
    for (let i = 0; i < 6; i++) addBox(h, r.head, rand(0.4, 0.55), 0.4, rand(0.4, 0.55), pick(G), rand(-0.4, 0.4), 0.6, rand(-0.4, 0.2), { ry: rand(0, 1) });
    for (let i = 0; i < 3; i++) addBox(h, r.body, 0.12, 0.5, 0.12, 0xd4f07a, -0.3 + i * 0.3, 1.4 + (i % 2) * 0.3, -0.75, { basic: true, rz: 0.4 }); // stink lines
    return r;
  },
  bruno(h) {
    const R = 0xe8243c;
    const r = buildRig(h, { pants: 0x2a2a35, boots: 0x111118, torso: R, arm: R, glove: 0xffffff });
    addBox(h, r.head, 0.8, 0.8, 1.05, R, 0, -0.12, 0, { rz: 0.785 });     // heart: a point at the bottom...
    for (const s of [-1, 1]) addCyl(h, r.head, 0.42, 1.05, R, s * 0.3, 0.24, 0, { seg: 14 }); // ...and two round tops
    addEyes(h, r.head, 0x6a0a14, 0.12);
    addBox(h, r.head, 0.4, 0.1, 0.05, 0x6a0a14, 0, -0.22, 0.55);          // grin
    for (const arm of [r.armL, r.armR]) addBox(h, arm, 0.64, 0.56, 0.66, 0xffffff, 0, -0.78, 0.05); // big boxing gloves
    addBox(h, r.body, 1.22, 0.24, 0.74, 0x111118, 0, 1.0, 0);             // boxing belt
    addBox(h, r.body, 0.36, 0.3, 0.06, 0xffcc00, 0, 1.0, 0.38);
    return r;
  },
  electro(h) {
    const r = buildRig(h, { pants: 0x3b1f6e, boots: 0xffd23f, torso: 0x5b2fa0, arm: 0x5b2fa0, glove: 0xffd23f });
    addBox(h, r.head, 1.05, 1.0, 1.05, 0x14141c, 0, 0, 0);
    addEyes(h, r.head, 0xffe14d);
    for (let i = 0; i < 7; i++) addBox(h, r.head, 0.22, rand(0.5, 0.8), 0.22, i % 2 ? 0xffe14d : 0xfff6a0, -0.45 + i * 0.15, 0.72, rand(-0.3, 0.3), { basic: true, rz: rand(-0.5, 0.5) }); // spiky glowing hair
    addBox(h, r.body, 0.14, 0.4, 0.04, 0xffe14d, 0.06, 1.6, 0.37, { basic: true, rz: 0.6 }); // chest bolt
    addBox(h, r.body, 0.14, 0.4, 0.04, 0xffe14d, -0.06, 1.3, 0.37, { basic: true, rz: 0.6 });
    for (const leg of [r.legL, r.legR]) addBox(h, leg, 0.5, 0.08, 0.54, 0x9ff3ff, 0, -0.3, 0, { basic: true });
    for (const arm of [r.armL, r.armR]) for (let i = 0; i < 3; i++) addBox(h, arm, 0.08, 0.08, 0.3, 0x9ff3ff, rand(-0.3, 0.3), -0.95 - i * 0.08, rand(-0.2, 0.2), { basic: true, ry: rand(0, 3) }); // sparks
    return r;
  },
  marshy(h) {
    const W = 0xfaf6ef;
    const r = buildRig(h, { pants: W, boots: 0xe8dcc8, torso: W, arm: W, glove: W });
    addBox(h, r.body, 1.4, 1.15, 1.0, W, 0, 1.45, 0);                     // squishy body
    addBox(h, r.head, 1.3, 1.1, 1.05, W, 0, 0.05, 0);
    addBox(h, r.head, 1.32, 0.16, 1.07, 0xe0a86a, 0, 0.56, 0);            // toasted top
    addEyes(h, r.head, 0x3a2a1a, 0.08);
    for (const s of [-1, 1]) addBox(h, r.head, 0.22, 0.12, 0.04, 0xffaac4, s * 0.42, -0.2, 0.54, { basic: true }); // rosy cheeks
    addBox(h, r.head, 0.24, 0.1, 0.04, 0x3a2a1a, 0, -0.28, 0.54);
    return r;
  },
  gummo(h) {
    const R = 0xff3a4d, L = 0xff7a88;
    const r = buildRig(h, { pants: R, boots: R, torso: R, arm: R, glove: R });
    addBox(h, r.body, 1.3, 1.1, 0.9, R, 0, 1.4, 0);                       // round tummy
    addBox(h, r.body, 0.8, 0.7, 0.05, L, 0, 1.35, 0.46);                   // light belly
    addBox(h, r.head, 1.15, 1.0, 1.05, R, 0, 0, 0);
    addEyes(h, r.head, 0x8a0a1a, 0.14);
    addBox(h, r.head, 0.5, 0.34, 0.3, L, 0, -0.26, 0.6);                   // snout
    addBox(h, r.head, 0.2, 0.12, 0.05, 0x2a0a10, 0, -0.16, 0.76, { basic: true });
    for (const s of [-1, 1]) addBox(h, r.head, 0.36, 0.36, 0.3, R, s * 0.45, 0.6, -0.05); // ears
    addBox(h, r.head, 0.18, 0.1, 0.04, 0xffffff, -0.35, 0.38, 0.53, { basic: true }); // gummy shine
    return r;
  },
  kernel(h) {
    const r = buildRig(h, { pants: 0x2a2a35, boots: 0xd8262b, torso: 0xffffff, arm: 0xfff3c4, glove: 0xfff3c4 });
    for (let i = 0; i < 6; i++) addBox(h, r.body, 0.22, 1.05, 0.8, i % 2 ? 0xffffff : 0xd8262b, -0.55 + i * 0.22, 1.42, 0); // striped bucket
    for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU; addBox(h, r.body, 0.3, 0.3, 0.3, pick([0xfff6d6, 0xffffff, 0xffe9a0]), Math.cos(a) * 0.5, 1.98, Math.sin(a) * 0.32, { rx: rand(0, 1), ry: rand(0, 1) }); }
    addBox(h, r.head, 1.05, 1.0, 1.05, 0x14141c, 0, 0, 0);
    addEyes(h, r.head, 0x0a0a10);
    for (let i = 0; i < 13; i++) {                                         // popcorn hair
      const a = rand(0, TAU), s = rand(0.3, 0.45);
      addBox(h, r.head, s, s, s, pick([0xfff6d6, 0xffffff, 0xffe9a0]), Math.cos(a) * 0.4, rand(0.5, 0.8), Math.sin(a) * 0.4 - 0.05, { rx: rand(0, 1), rz: rand(0, 1) });
    }
    return r;
  },
  rocky(h) {
    const C = [0x7fe3ff, 0xff9ad5, 0xc9a0ff, 0xb9fff0];
    const r = buildRig(h, { pants: 0x5b6b8a, boots: 0x3a4560, torso: 0x8fd8f0, arm: 0x8fd8f0, glove: 0xc9a0ff });
    addBox(h, r.head, 1.05, 1.0, 1.05, 0x14141c, 0, 0, 0);
    addEyes(h, r.head, 0x0a0a10);
    for (let i = 0; i < 4; i++) addBox(h, r.head, 0.26, rand(0.5, 0.8), 0.26, C[i], -0.33 + i * 0.22, 0.65, rand(-0.25, 0.15), { rx: 0.4, rz: rand(-0.4, 0.4) }); // crystal spikes
    for (const arm of [r.armL, r.armR]) addBox(h, arm, 0.45, 0.45, 0.45, pick(C), 0, 0.05, 0, { rx: 0.78, rz: 0.78 });
    for (let i = 0; i < 5; i++) addBox(h, r.body, 0.32, rand(0.45, 0.7), 0.32, C[i % 4], rand(-0.4, 0.4), rand(1.2, 1.9), -0.45, { rx: -0.4, rz: rand(-0.5, 0.5) });
    const gun = new THREE.Group(); gun.position.set(-0.3, 1.55, 0.8); r.body.add(gun); // candy-cane rifle
    for (let i = 0; i < 6; i++) addCyl(h, gun, 0.13, 0.3, i % 2 ? 0xffffff : 0xe8243c, 0, 0, -0.3 + i * 0.3);
    addBox(h, gun, 0.3, 0.42, 0.5, 0x5b6b8a, 0, -0.12, -0.4);
    addBox(h, gun, 0.18, 0.18, 0.32, 0x7fe3ff, 0, 0.22, 0.25, { basic: true });
    r.gun = gun; r.gunPose = true;
    return r;
  },
  fluff(h) {
    const r = buildRig(h, { pants: 0xf2e6c8, boots: 0xd9c49a, torso: 0xfff6e0, arm: 0xffb3d9, glove: 0xb3e0ff });
    const cone = new THREE.Mesh(new THREE.ConeGeometry(0.72, 1.3, 10), heroMat(h, 0xfff3d6)); // paper cone body
    cone.rotation.x = Math.PI; cone.position.set(0, 1.4, 0); r.body.add(cone);
    addBox(h, r.head, 0.95, 0.9, 1.0, 0x14141c, 0, -0.05, 0);
    addEyes(h, r.head, 0x0a0a10, -0.06);
    for (let i = 0; i < 18; i++) {                                         // cotton candy puff
      const a = rand(0, TAU), y = rand(0, 0.75);
      let z = Math.sin(a) * 0.55; if (z > 0.25 && y < 0.4) z = -z;
      addBall(h, r.head, rand(0.3, 0.45), i % 3 ? 0xffb3d9 : 0xb3e0ff, Math.cos(a) * 0.6, y, z);
    }
    return r;
  },
  barf(h) {
    const r = buildRig(h, { pants: 0x6b4423, boots: 0x2f8f2f, torso: 0x2f7d32, arm: 0x6b4423, glove: 0x3fa33f });
    for (let i = 0; i < 18; i++) {                                         // leafy bush body
      const a = rand(0, TAU), y = rand(1.0, 1.9);
      leafClump(h, r.body, Math.cos(a) * 0.62, y, Math.sin(a) * 0.45, rand(0.35, 0.55));
    }
    for (const leg of [r.legL, r.legR]) leafClump(h, leg, 0, -0.85, 0.1, 0.55);
    for (const arm of [r.armL, r.armR]) { leafClump(h, arm, 0, -0.1, 0, 0.5); leafClump(h, arm, 0, -0.75, 0.05, 0.6); }
    addBox(h, r.head, 1.0, 0.95, 1.0, 0x8a5a2b, 0, -0.02, 0);              // wooden face
    addEyes(h, r.head, 0x3d2412, 0.08);
    r.mouth = addBox(h, r.head, 0.52, 0.28, 0.05, 0x2a0a0a, 0, -0.27, 0.52);
    addBox(h, r.head, 0.11, 0.11, 0.06, 0xfff4d6, -0.1, -0.17, 0.54, { basic: true });
    addBox(h, r.head, 0.11, 0.11, 0.06, 0xfff4d6, 0.1, -0.17, 0.54, { basic: true });
    addBox(h, r.head, 0.1, 0.1, 0.06, 0xfff4d6, 0.14, -0.37, 0.54, { basic: true });
    for (let i = 0; i < 20; i++) {                                         // leaves on top/sides/back of the head
      const a = rand(0, TAU), up = rand(0, 1);
      let x = Math.cos(a) * 0.55, z = Math.sin(a) * 0.55, y = up * 0.6;
      if (z > 0.3 && y < 0.38) { z = -z; }
      leafClump(h, r.head, x, y + 0.1, z, rand(0.32, 0.5));
    }
    for (let i = 0; i < 6; i++) leafClump(h, r.head, rand(-0.4, 0.4), 0.55, rand(-0.4, 0.3), rand(0.35, 0.5));
    for (const s of [-1, 1]) {                                             // twig horns
      addBox(h, r.head, 0.12, 0.75, 0.12, 0x6b4423, s * 0.45, 0.85, -0.05, { rz: -s * 0.55 });
      leafClump(h, r.head, s * 0.68, 1.15, -0.05, 0.25);
    }
    return r;
  },
};

// ===================================================================
// Heroes
// ===================================================================
let T = 0;                // match clock
let heroes = [];
let player = null;
let diff = DIFFS.normal;
// multiplayer (specs/15-multiplayer.md): `net` is the room connection; `auth` is false on a guest,
// whose browser only shows the match the host runs (it never decides damage, eliminations or pickups)
let net = null;
let auth = true;
const blobGeo = new THREE.CircleGeometry(1, 20);
const blobMat = basic(0x000000, { transparent: true, opacity: 0.3, depthWrite: false });

class Hero {
  constructor(key, isPlayer, name, o = {}) {
    this.key = key; this.def = HEROES[key]; this.isPlayer = isPlayer; this.name = name;
    this.id = o.id || 0; this.pid = o.pid ?? null; this.human = this.pid !== null;
    this.remote = this.human && !isPlayer; // a friend playing on another device
    this.puppet = !!o.puppet;               // on a guest: moved by the host's snapshots, not simulated here
    this.label = this.human ? name : `${this.def.emoji} ${name}`;
    this.mats = []; this.matCache = {};
    this.root = new THREE.Group(); scene.add(this.root);
    this.rig = MODELS[key](this);
    mergeHero(this, [this.rig.mouth, this.rig.scarf]);
    this.rig.body.scale.setScalar(this.def.scale);
    this.blob = new THREE.Mesh(blobGeo, blobMat); this.blob.rotation.x = -Math.PI / 2; this.blob.position.y = 0.06;
    this.blob.scale.setScalar(this.def.radius * 1.1); this.root.add(this.blob);
    this.x = 0; this.z = 0; this.y = 0; this.vy = 0; this.yaw = 0;
    this.hp = this.maxHp = this.def.hp; this.superCharge = 0; this.cd = 0;
    this.alive = true; this.kills = 0; this.deadT = 0;
    this.fx = { strength: 0, speed: 0, invis: 0, slow: 0 };
    this.fearUntil = 0; this.fearX = 0; this.fearZ = 0; this.inkUntil = 0;
    this.frozenUntil = 0; this.stuckUntil = 0; this.growUntil = 0; this.size = 1; this.doubleNext = false; this.spinT = 0;
    this.shieldUntil = 0; this.laserUntil = 0; this.dashUntil = 0; this.dashDir = null; this.dashHit = null;
    this.barfUntil = 0; this.burst = 0; this.burstT = 0; this.burstYaw = 0; this.punchT = 0; this.recoil = 0;
    this.kbx = 0; this.kbz = 0; this.flashT = 0; this.flashOn = false; this.ghost = false; this.walk = 0;
    this.numAcc = 0; this.numT = 0; this.laserSfxT = 0;
    this.mx = 0; this.mz = 0; this.dance = null; this.danceT = 0;
    this.lvx = 0; this.lvz = 0; this.launched = false; this.padCd = 0;
    this.ai = this.human ? null : { target: null, think: 0, strafe: 1, strafeT: 0, wander: null, goal: null, react: 0, stuckT: 0, lx: 0, lz: 0 };
    if (key === 'brickster') this.shieldMesh = makeShield(this);
    if (key === 'barf') this.beam = makeBeam();
    this.tag = null;
    if (!isPlayer) {
      this.tag = document.createElement('div'); this.tag.className = this.human ? 'tag human' : 'tag';
      this.tag.innerHTML = '<div></div><div class="hb"><i></i></div>';
      this.tag.firstChild.textContent = this.label;
      this.tagFill = this.tag.querySelector('i');
      $('tags').appendChild(this.tag);
    }
  }
  get radius() { return this.def.radius * this.size; }
  get frozen() { return this.frozenUntil > T; }
  get grown() { return this.growUntil > T; }
  has(effect) { return this.fx[effect] > T; }
  get invisible() { return this.fx.invis > T; }
  get shielded() { return this.shieldUntil > T; }
  get lasering() { return this.laserUntil > T; }
  get dashing() { return this.dashUntil > T; }
  get headY() { return this.y + 2.42 * this.def.scale * this.size; }
  dispose() {
    scene.remove(this.root);
    if (this.beam) scene.remove(this.beam);
    if (this.tag) this.tag.remove();
    for (const m of this.mats) m.dispose();
  }
}

function makeShield(h) {
  const g = new THREE.Group(); g.visible = false; h.root.add(g);
  const mats = [lambert(0xc8361e), lambert(0x8a8f99), lambert(0xe8731c)];
  const geo = new THREE.BoxGeometry(1.05, 0.75, 0.55);
  g.bricks = [];
  for (let layer = 0; layer < 3; layer++) for (let i = 0; i < 10; i++) {
    const a = ((i + (layer % 2) * 0.5) / 10) * TAU;
    const b = new THREE.Mesh(geo, mats[(i + layer) % 3]);
    b.position.set(Math.cos(a) * 2.1, 0.38 + layer * 0.76, Math.sin(a) * 2.1);
    b.rotation.y = -a - Math.PI / 2;
    b.delay = layer * 0.07 + i * 0.01;
    g.add(b); g.bricks.push(b);
  }
  return g;
}

function makeBeam() {
  const g = new THREE.Group(); g.visible = false;
  g.add(new THREE.Mesh(new THREE.BoxGeometry(2.0, 2.0, 1), basic(0x5cff3a, { transparent: true, opacity: 0.5, depthWrite: false })));
  g.add(new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 1), basic(0xeaffb0)));
  scene.add(g);
  return g;
}

// ===================================================================
// Combat
// ===================================================================
const projectiles = [];
const PROJ = {
  brickGeo: new THREE.BoxGeometry(0.55, 0.32, 0.75), brickMat: lambert(0xd0381e, { emissive: 0x7a1800 }),
  zapGeo: new THREE.BoxGeometry(0.16, 0.16, 1.1), zapMat: basic(0x8ff0ff),
  bombGeo: new THREE.IcosahedronGeometry(0.42, 1), bombMat: lambert(0x1a1a22), fuseMat: basic(0xffa020), starMat: basic(0xd02a1a),
  rocketGeo: new THREE.CylinderGeometry(0.32, 0.32, 1.5, 10).rotateX(Math.PI / 2), rocketMat: lambert(0xd02a1a),
  noseGeo: new THREE.ConeGeometry(0.32, 0.6, 10).rotateX(Math.PI / 2), finGeo: new THREE.BoxGeometry(1.2, 0.08, 0.4),
  greyMat: lambert(0x8a8f99), yellowMat: basic(0xffcc00),
};
PROJ.starGeo = new THREE.BoxGeometry(0.7, 0.08, 0.16); PROJ.starMat = lambert(0xc8ccd4, { emissive: 0x333333 });
PROJ.snowGeo = new THREE.IcosahedronGeometry(0.34, 1); PROJ.snowMat = lambert(0xffffff, { emissive: 0x6688aa });
PROJ.sliceGeo = new THREE.CylinderGeometry(0.7, 0.7, 0.1, 3); PROJ.sliceMat = lambert(0xf5c242, { emissive: 0x553300 }); PROJ.pepMat = basic(0xc0261a);
PROJ.orbGeo = new THREE.IcosahedronGeometry(0.4, 1); PROJ.orbMat = basic(0xe8f0ff, { transparent: true, opacity: 0.85 });
PROJ.inkGeo = new THREE.IcosahedronGeometry(0.38, 1); PROJ.inkMat = lambert(0x2a1040, { emissive: 0x220833 });
PROJ.gustGeo = new THREE.BoxGeometry(2.2, 0.9, 0.5); PROJ.gustMat = basic(0xe0fff8, { transparent: true, opacity: 0.45, depthWrite: false });
PROJ.sstarMat = basic(0xffe14d);
// candy heroes
PROJ.gasGeo = new THREE.IcosahedronGeometry(0.8, 1); PROJ.gasMat = basic(0xa8d64a, { transparent: true, opacity: 0.6, depthWrite: false });
PROJ.fartBombMat = lambert(0x7a9a2c); PROJ.fistMat = lambert(0xffffff, { emissive: 0x333333 }); PROJ.cuffMat = lambert(0xe8243c);
PROJ.heartMat = lambert(0xff2e55, { emissive: 0x991133 }); PROJ.boltMat = basic(0xffe14d);
PROJ.mallowGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.36, 10); PROJ.mallowMat = lambert(0xfaf6ef, { emissive: 0x444444 });
PROJ.gummyGeo = new THREE.IcosahedronGeometry(0.38, 1); PROJ.gummyMats = [0xff3a4d, 0x3ccf6e, 0xffd23f, 0xff8a1a].map((c) => lambert(c, { emissive: 0x331111 }));
PROJ.kernelGeo = new THREE.IcosahedronGeometry(0.3, 0); PROJ.kernelMat = lambert(0xffd86a, { emissive: 0x553300 }); PROJ.popMat = lambert(0xfffbe8, { emissive: 0x555544 });
PROJ.crystalGeo = new THREE.OctahedronGeometry(0.35, 0); PROJ.crystalMat = basic(0x9ff3ff); PROJ.bigCrystalMat = basic(0xc9a0ff);
PROJ.fluffMat = lambert(0xffb3d9, { emissive: 0x442233 });
function heartGroup(mat) {
  const g = new THREE.Group();
  const d = new THREE.Mesh(pGeo, mat); d.scale.set(0.5, 0.5, 0.3); d.rotation.z = 0.785; d.position.y = -0.08; g.add(d);
  for (const s of [-1, 1]) { const m = new THREE.Mesh(pGeo, mat); m.scale.set(0.38, 0.36, 0.3); m.position.set(s * 0.18, 0.2, 0); g.add(m); }
  return g;
}
function projMesh(type) {
  if (type === 'gas') return new THREE.Mesh(PROJ.gasGeo, PROJ.gasMat);
  if (type === 'fartbomb') {
    const g = new THREE.Group(); g.add(new THREE.Mesh(PROJ.bombGeo, PROJ.fartBombMat));
    const f = new THREE.Mesh(pGeo, PROJ.gasMat); f.scale.setScalar(0.5); f.position.y = 0.5; g.add(f);
    g.scale.setScalar(1.3); return g;
  }
  if (type === 'fist') {
    const g = new THREE.Group(), f = new THREE.Mesh(pGeo, PROJ.fistMat); f.scale.set(0.5, 0.45, 0.5); g.add(f);
    const c = new THREE.Mesh(pGeo, PROJ.cuffMat); c.scale.set(0.42, 0.38, 0.2); c.position.z = -0.32; g.add(c);
    return g;
  }
  if (type === 'heart') { const g = heartGroup(PROJ.heartMat); g.scale.setScalar(3.2); return g; }
  if (type === 'bolt') {
    const g = new THREE.Group();
    for (const [x, z, ry] of [[0.08, 0.35, 0.5], [-0.08, 0, -0.5], [0.08, -0.35, 0.5]]) { const m = new THREE.Mesh(pGeo, PROJ.boltMat); m.scale.set(0.14, 0.14, 0.45); m.position.set(x, 0, z); m.rotation.y = ry; g.add(m); }
    return g;
  }
  if (type === 'mallow') { const m = new THREE.Mesh(PROJ.mallowGeo, PROJ.mallowMat); m.rotation.x = Math.PI / 2; const g = new THREE.Group(); g.add(m); return g; }
  if (type === 'gummy') return new THREE.Mesh(PROJ.gummyGeo, pick(PROJ.gummyMats));
  if (type === 'kernel') return new THREE.Mesh(PROJ.kernelGeo, PROJ.kernelMat);
  if (type === 'popcorn') return new THREE.Mesh(PROJ.kernelGeo, PROJ.popMat);
  if (type === 'crystal' || type === 'bigcrystal') {
    const m = new THREE.Mesh(PROJ.crystalGeo, type === 'crystal' ? PROJ.crystalMat : PROJ.bigCrystalMat);
    m.scale.set(1, 1, 2.4); if (type === 'bigcrystal') m.scale.multiplyScalar(3);
    return m;
  }
  if (type === 'fluffball') return new THREE.Mesh(PROJ.gasGeo, PROJ.fluffMat);
  if (type === 'orb') return new THREE.Mesh(PROJ.orbGeo, PROJ.orbMat);
  if (type === 'ink') return new THREE.Mesh(PROJ.inkGeo, PROJ.inkMat);
  if (type === 'gust') return new THREE.Mesh(PROJ.gustGeo, PROJ.gustMat);
  if (type === 'spacestar') {
    const g = new THREE.Group();
    for (const rz of [0, 0.78]) { const m = new THREE.Mesh(pGeo, PROJ.sstarMat); m.scale.set(0.5, 0.5, 0.1); m.rotation.z = rz; g.add(m); }
    return g;
  }
  if (type === 'star') {
    const g = new THREE.Group();
    for (const ry of [0, Math.PI / 2]) { const m = new THREE.Mesh(PROJ.starGeo, PROJ.starMat); m.rotation.y = ry + 0.78; g.add(m); }
    return g;
  }
  if (type === 'snow') return new THREE.Mesh(PROJ.snowGeo, PROJ.snowMat);
  if (type === 'pizza') {
    const g = new THREE.Group(); g.add(new THREE.Mesh(PROJ.sliceGeo, PROJ.sliceMat));
    for (const [x, z] of [[0.15, 0.1], [-0.2, 0.05], [0, -0.25]]) { const m = new THREE.Mesh(pGeo, PROJ.pepMat); m.scale.set(0.18, 0.06, 0.18); m.position.set(x, 0.07, z); g.add(m); }
    return g;
  }
  if (type === 'brick') return new THREE.Mesh(PROJ.brickGeo, PROJ.brickMat);
  if (type === 'zap') return new THREE.Mesh(PROJ.zapGeo, PROJ.zapMat);
  if (type === 'bomb') {
    const g = new THREE.Group(); g.add(new THREE.Mesh(PROJ.bombGeo, PROJ.bombMat));
    const f = new THREE.Mesh(pGeo, PROJ.fuseMat); f.scale.set(0.12, 0.25, 0.12); f.position.y = 0.48; g.add(f);
    const s = new THREE.Mesh(pGeo, PROJ.starMat); s.scale.set(0.3, 0.3, 0.05); s.position.z = 0.4; s.rotation.z = 0.78; g.add(s);
    return g;
  }
  const g = new THREE.Group();
  g.add(new THREE.Mesh(PROJ.rocketGeo, PROJ.rocketMat));
  const nose = new THREE.Mesh(PROJ.noseGeo, PROJ.rocketMat); nose.position.z = 1.05; g.add(nose);
  const band = new THREE.Mesh(pGeo, PROJ.greyMat); band.scale.set(0.7, 0.7, 0.15); band.position.z = 0.3; g.add(band);
  const star = new THREE.Mesh(pGeo, PROJ.yellowMat); star.scale.set(0.3, 0.3, 0.05); star.position.set(0, 0.33, -0.2); star.rotation.set(Math.PI / 2, 0, 0.78); g.add(star);
  for (const rz of [0, Math.PI / 2]) { const f = new THREE.Mesh(PROJ.finGeo, PROJ.greyMat); f.position.z = -0.65; f.rotation.z = rz; g.add(f); }
  g.scale.setScalar(1.3);
  return g;
}

function fireStraight(h, type, yaw, o = {}) {
  const fx = Math.sin(yaw), fz = Math.cos(yaw), s = h.def.scale;
  const side = o.side || 0;
  addProj(h, type, h.x + fx * (h.radius + 0.4) - fz * side, h.y + (o.y || 1.55) * s, h.z + fz * (h.radius + 0.4) + fx * side, yaw, o);
}
function addProj(h, type, x, y, z, yaw, o) {
  const p = {
    type, owner: h, isSuper: !!o.isSuper, x, y, z, y0: y, yaw,
    vx: Math.sin(yaw) * o.speed, vz: Math.cos(yaw) * o.speed, speed: o.speed, travelled: 0, range: o.range, dmg: o.dmg, bounces: o.bounces || 0, ghost: !!o.ghost, hitR: o.hitR || 0.3, kb: o.kb || 0,
    pierce: o.pierce ? new Set() : null, mesh: projMesh(type),
  };
  if (type === 'fluffball') p.mesh.scale.setScalar(0.55);
  p.mesh.position.set(p.x, p.y, p.z); p.mesh.rotation.y = yaw;
  scene.add(p.mesh); projectiles.push(p);
}

function lobBomb(h, yaw, total, type = 'bomb') {
  total = clamp(total, 4, 18);
  const bounces = type === 'bomb' ? 1 : 0;
  const fx = Math.sin(yaw), fz = Math.cos(yaw), first = bounces ? Math.max(2, total - 2.5) : total;
  const sx = h.x + fx * 0.8, sz = h.z + fz * 0.8;
  const p = {
    type, lob: true, owner: h, isSuper: type !== 'bomb', dmg: 30, fx, fz, bounces,
    ax: sx, az: sz, ay: h.y + 2.3 * h.def.scale, bx: sx + fx * first, bz: sz + fz * first, H: 4.5, t: 0, dur: 0.35 + first / 28,
    x: sx, y: h.y + 2.3, z: sz, mesh: projMesh(type),
  };
  scene.add(p.mesh); projectiles.push(p);
}

function explode(x, z, radius, dmg, owner, isSuper) {
  blastFx(x, 1, z, radius, 0xff9a1a);
  burst(x, 0.8, z, isSuper ? 50 : 26, [0xff6a00, 0xffd23f, 0xff3b00, 0x4a4040], isSuper ? 16 : 10, 0.45, 0.8, 14);
  sfx('boom', x, z);
  if (player) shake = Math.max(shake, (isSuper ? 0.8 : 0.4) * Math.max(0, 1 - dist(x, z, player.x, player.z) / 40));
  for (const e of heroes) {
    if (e === owner || !e.alive) continue;
    if (dist(x, z, e.x, e.z) < radius + e.radius) damage(e, dmg, owner, { isSuper });
  }
}

// `force`: a guest replaying an attack the host already allowed
function attack(h, yaw, aimDist = 15, force = false) {
  if (!force && (h.cd > 0 || !h.alive || h.lasering || h.dashing || h.frozen)) return false;
  h.cd = h.def.attackCd;
  emit(['a', h.id, r2(yaw), r2(aimDist)]);
  h.yaw = yaw;
  switch (h.key) {
    case 'brickster':
      fireStraight(h, 'brick', yaw, { speed: 40, range: 26, dmg: 22, side: 0.35, y: 1.5 });
      h.recoil = 1; sfx('brick', h.x, h.z);
      break;
    case 'zippy':
      h.burst = 3; h.burstT = 0; h.burstYaw = yaw;
      break;
    case 'boomer':
      lobBomb(h, yaw, aimDist); h.recoil = 1; sfx('bomb', h.x, h.z);
      break;
    case 'shadow':
      for (const sp of [-0.07, 0.07]) fireStraight(h, 'star', yaw + sp, { speed: 42, range: 18, dmg: 16, side: sp * 6, y: 1.6 });
      h.punchT = 0.15; h.punchSide = 1; sfx('zap', h.x, h.z);
      break;
    case 'frosty':
      fireStraight(h, 'snow', yaw, { speed: 34, range: 20, dmg: 20, side: 0.6, y: 1.7 });
      h.punchT = 0.15; h.punchSide = 1; sfx('bomb', h.x, h.z);
      break;
    case 'chomp': {
      h.spinT = 0.3;
      const R = h.def.range * h.size;
      for (const e of heroes) if (e !== h && e.alive && dist(h.x, h.z, e.x, e.z) < R + e.radius) damage(e, 32, h);
      for (let i = 0; i < 24; i++) { const a = (i / 24) * TAU; spawnP(h.x + Math.sin(a) * R * 0.8, 0.8, h.z + Math.cos(a) * R * 0.8, Math.sin(a) * 4, 1, Math.cos(a) * 4, pick([0x3f9a3a, 0xb8e986, 0xffffff]), 0.3, 0.35); }
      sfx('chomp', h.x, h.z);
      break;
    }
    case 'boo':
      fireStraight(h, 'orb', yaw, { speed: 26, range: 16, dmg: 22, side: 0.5, y: 1.6, ghost: true });
      h.punchT = 0.15; h.punchSide = 1; sfx('zap', h.x, h.z);
      break;
    case 'inky':
      fireStraight(h, 'ink', yaw, { speed: 28, range: 18, dmg: 22, y: 2.0 });
      sfx('bomb', h.x, h.z);
      break;
    case 'twister':
      fireStraight(h, 'gust', yaw, { speed: 36, range: 15, dmg: 12, y: 1.4, hitR: 1.1, kb: 14 });
      h.punchT = 0.15; h.punchSide = 1; sfx('gust', h.x, h.z);
      break;
    case 'glaxo':
      fireStraight(h, 'spacestar', yaw, { speed: 45, range: 24, dmg: 18, side: 0.6, y: 1.6 });
      h.punchT = 0.12; h.punchSide = 1; sfx('zap', h.x, h.z);
      break;
    case 'pete':
      fireStraight(h, 'pizza', yaw, { speed: 30, range: 22, dmg: 20, side: 0.6, y: 1.6, bounces: 2 });
      h.punchT = 0.15; h.punchSide = 1; sfx('brick', h.x, h.z);
      break;
    case 'fart':
      fireStraight(h, 'gas', yaw, { speed: 20, range: 14, dmg: 24, y: 1.1, hitR: 1.0 });
      sfx('fart', h.x, h.z);
      break;
    case 'bruno': {
      h.punchSide = h.punchSide > 0 ? -1 : 1; h.punchT = 0.15;
      fireStraight(h, 'fist', yaw, { speed: 38, range: 9, dmg: 20, side: h.punchSide * 0.6, y: 1.3, hitR: 0.5 });
      sfx('punch', h.x, h.z);
      break;
    }
    case 'electro':
      fireStraight(h, 'bolt', yaw, { speed: 60, range: 20, dmg: 20, side: 0.6, y: 1.5 });
      h.punchT = 0.12; h.punchSide = 1; sfx('zap', h.x, h.z);
      break;
    case 'marshy':
      for (const sp of [-0.14, 0, 0.14]) fireStraight(h, 'mallow', yaw + sp, { speed: 30, range: 15, dmg: 11, y: 1.5 });
      h.punchT = 0.15; h.punchSide = 1; sfx('pop', h.x, h.z);
      break;
    case 'gummo':
      fireStraight(h, 'gummy', yaw, { speed: 30, range: 18, dmg: 22, side: 0.5, y: 1.4, hitR: 0.45 });
      h.punchT = 0.15; h.punchSide = 1; sfx('squish', h.x, h.z);
      break;
    case 'kernel':
      fireStraight(h, 'kernel', yaw, { speed: 32, range: 16, dmg: 18, side: 0.5, y: 1.6 });
      h.punchT = 0.15; h.punchSide = 1; sfx('pop', h.x, h.z);
      break;
    case 'rocky':
      fireStraight(h, 'crystal', yaw, { speed: 70, range: 34, dmg: 34, side: 0.3, y: 1.55 });
      h.recoil = 1; sfx('zap', h.x, h.z);
      break;
    case 'fluff':
      fireStraight(h, 'fluffball', yaw, { speed: 28, range: 19, dmg: 20, side: 0.6, y: 1.6, hitR: 0.45 });
      h.punchT = 0.15; h.punchSide = 1; sfx('squish', h.x, h.z);
      break;
    case 'barf':
      h.barfUntil = T + 0.35;
      for (const e of heroes) {
        if (e === h || !e.alive) continue;
        const dx = e.x - h.x, dz = e.z - h.z, d = Math.hypot(dx, dz);
        if (d > h.def.range + e.radius) continue;
        if (Math.abs(angDiff(yaw, Math.atan2(dx, dz))) < 0.31 + Math.atan(e.radius / Math.max(d, 0.1))) damage(e, 26, h);
      }
      sfx('barf', h.x, h.z);
      break;
  }
  return true;
}

function useSuper(h, yaw, force = false, holeDist) {
  if (!force && (h.superCharge < 100 || !h.alive || h.lasering || h.dashing || h.frozen)) return false;
  h.superCharge = 0;
  h.yaw = yaw;
  // supers that land on a spot: a bot aims at its target, a player at a set distance; guests get the host's distance
  const aimAt = (d, lo, hi) => {
    const t = h.ai && h.ai.target;
    holeDist = r2(holeDist ?? (t ? clamp(dist(h.x, h.z, t.x, t.z), lo, hi) : d));
    return holeDist;
  };
  switch (h.key) {
    case 'brickster':
      h.shieldUntil = T + 4; h.shieldMesh.visible = true; h.shieldT = 0;
      burst(h.x, 3.5, h.z, 14, [0xffd23f, 0xffffff], 8, 0.25, 0.6, 10);
      sfx('shield', h.x, h.z);
      break;
    case 'zippy':
      h.dashUntil = T + 0.35; h.dashDir = { x: Math.sin(yaw), z: Math.cos(yaw) }; h.dashHit = new Set();
      sfx('dash', h.x, h.z);
      break;
    case 'boomer':
      fireStraight(h, 'rocket', yaw, { speed: 32, range: 35, dmg: 70, isSuper: true, y: 2.05, side: 0.62 });
      h.recoil = 1; sfx('bomb', h.x, h.z);
      break;
    case 'barf':
      h.laserUntil = T + 5; h.beam.visible = true;
      break;
    case 'shadow':
      h.fx.invis = T + 4; h.doubleNext = true;
      burst(h.x, 1.5, h.z, 40, [0x777777, 0x999999, 0x555555, 0xbbbbbb], 6, 0.7, 1.0, -1);
      sfx('boom', h.x, h.z);
      break;
    case 'frosty':
      blastFx(h.x, 1, h.z, 7, 0x9fe8ff);
      burst(h.x, 1, h.z, 50, [0x9fe8ff, 0xffffff, 0xbff4ff], 14, 0.4, 0.7, 8);
      for (const e of heroes) {
        if (e === h || !e.alive || dist(h.x, h.z, e.x, e.z) > 7 + e.radius) continue;
        damage(e, 30, h, { isSuper: true });
        if (e.alive) freeze(e, 2);
      }
      sfx('freeze', h.x, h.z);
      break;
    case 'chomp':
      h.growUntil = T + 5;
      blastFx(h.x, 1.5, h.z, 9, 0xb8e986);
      for (const e of heroes) {
        if (e === h || !e.alive) continue;
        const dx = e.x - h.x, dz = e.z - h.z, d = Math.hypot(dx, dz) || 1;
        if (d > 9 + e.radius) continue;
        damage(e, 20, h, { isSuper: true });
        e.kbx += dx / d * 20; e.kbz += dz / d * 20; e.vy = 7;
      }
      if (player) shake = Math.max(shake, 0.6 * Math.max(0, 1 - dist(h.x, h.z, player.x, player.z) / 30));
      sfx('roar', h.x, h.z);
      break;
    case 'boo':
      blastFx(h.x, 1.5, h.z, 9, 0xeef0ff);
      for (const e of heroes) {
        if (e === h || !e.alive || dist(h.x, h.z, e.x, e.z) > 9 + e.radius) continue;
        damage(e, 15, h, { isSuper: true });
        e.fearUntil = T + 3; e.fearX = h.x; e.fearZ = h.z;
        notify(e, 'p', '😱 SCARED!');
      }
      sfx('scream', h.x, h.z);
      break;
    case 'inky':
      h.spinT = 0.3;
      blastFx(h.x, 1, h.z, 7, 0x9b59b6);
      for (const e of heroes) {
        if (e === h || !e.alive) continue;
        const dx = h.x - e.x, dz = h.z - e.z, d = Math.hypot(dx, dz) || 1;
        if (d > 7 + e.radius) continue;
        damage(e, 40, h, { isSuper: true });
        e.kbx += dx / d * Math.min(14, d * 3); e.kbz += dz / d * Math.min(14, d * 3);
      }
      sfx('chomp', h.x, h.z);
      break;
    case 'twister':
      spawnTornado(h, yaw);
      sfx('gust', h.x, h.z);
      break;
    case 'glaxo': {
      const d = aimAt(6, 3, 10);
      spawnHole(h, h.x + Math.sin(yaw) * d, h.z + Math.cos(yaw) * d);
      sfx('hole', h.x, h.z);
      break;
    }
    case 'fart':
      lobBomb(h, yaw, aimAt(12, 4, 16), 'fartbomb');
      sfx('fart', h.x, h.z);
      break;
    case 'bruno':
      fireStraight(h, 'heart', yaw, { speed: 55, range: 40, dmg: 65, isSuper: true, y: 1.8, hitR: 1.4, kb: 20 });
      h.punchT = 0.25; h.punchSide = 1; sfx('dash', h.x, h.z);
      break;
    case 'electro': {
      const d = aimAt(12, 4, 18);
      spawnStrike(h, h.x + Math.sin(yaw) * d, h.z + Math.cos(yaw) * d);
      break;
    }
    case 'marshy':
      h.growUntil = T + 6;
      blastFx(h.x, 1.5, h.z, 5, 0xfaf6ef);
      sfx('squish', h.x, h.z);
      break;
    case 'gummo':
      spawnGummies(h, yaw);
      sfx('squish', h.x, h.z);
      break;
    case 'kernel': // Butter Slam: jump high and forward, then slam down (see moveHero)
      h.vy = 19; h.y = Math.max(h.y, 0.01); h.lvx = Math.sin(yaw) * 9; h.lvz = Math.cos(yaw) * 9; h.launched = true; h.slam = true;
      burst(h.x, 0.5, h.z, 20, [0xffd86a, 0xfffbe8], 7, 0.3, 0.5, 8);
      sfx('boing', h.x, h.z);
      break;
    case 'rocky':
      fireStraight(h, 'bigcrystal', yaw, { speed: 55, range: 50, dmg: 60, isSuper: true, y: 1.6, hitR: 1.0, ghost: true, pierce: true });
      h.recoil = 1; sfx('freeze', h.x, h.z);
      break;
    case 'fluff':
      spawnWall(h, yaw);
      sfx('squish', h.x, h.z);
      break;
    case 'pete':
      dropPizza(h);
      sfx('pickup', h.x, h.z);
      break;
  }
  notify(h, 'p', '⭐ SUPER!');
  emit(['s', h.id, r2(yaw), holeDist ?? 0]);
  return true;
}

function damage(t, amt, src, o = {}) {
  if (!auth || !t.alive || amt <= 0 || t.dance) return;
  if (t.shielded) {
    if (src && src.human && T - (t.blockT || 0) > 0.5) { t.blockT = T; notify(src, 'b', t.id); }
    return;
  }
  if (src) {
    if (src.has('strength')) amt *= 1.5;
    if (src.doubleNext && !o.isSuper) { amt *= 2; src.doubleNext = false; notify(src, 'p', '🥷 DOUBLE DAMAGE!'); }
    if (!src.human) amt *= diff.dmg;
    if (!o.isSuper) src.superCharge = Math.min(100, src.superCharge + amt * src.def.chargeRate);
    t.flashT = 0.12; t.lastHitBy = src; t.lastHitT = T;
    if (src.isPlayer) { t.numAcc += amt; if (!o.quiet) sfx('hit'); }
    else if (src.remote) netHit(src, t, amt, o.quiet);
  }
  if (t.grown) amt *= 0.6;
  if (t.isPlayer) hurt = Math.min(1, hurt + amt / 40);
  t.hp -= amt;
  if (t.hp <= 0) {
    const killer = src || (t.lastHitBy && T - t.lastHitT < 4 ? t.lastHitBy : null);
    eliminate(t, killer, o.cause);
  }
}

function eliminate(h, killer, cause) {
  if (!auth || !h.alive) return;
  const place = heroes.filter((e) => e.alive).length;
  if (killer && killer !== h) killer.kills++;
  showElim(h, killer, cause);
  if (!h.human) spawnPickup('health', h.x, h.z, true);
  if (killer && killer.human && killer !== h) notify(killer, 'p', `💥 Nice one, ${killer.name}!`);
  emit(['e', h.id, killer ? killer.id : -1, cause || '', place, h.kills]);
  checkEnd(h, place);
}
// the part of an elimination everyone sees (guests run only this, when the host tells them)
function showElim(h, killer, cause) {
  h.alive = false; h.hp = 0; h.deadT = 0;
  h.laserUntil = 0; h.shieldUntil = 0; h.burst = 0;
  if (h.beam) h.beam.visible = false;
  if (h.shieldMesh) h.shieldMesh.visible = false;
  if (h.tag) h.tag.style.display = 'none';
  if (killer && killer !== h) {
    feed(cause === 'blackhole' ? `${killer.label} sucked ${h.label} into a black hole 🌌` : `${killer.label} eliminated ${h.label}`);
  } else {
    feed(`${h.label} ${cause === 'lava' ? world.poolElim : cause === 'quit' ? 'left the match 👋' : 'was lost in the storm 🌀'}`);
  }
  if (cause === 'blackhole') { h.root.visible = false; h.deadT = 99; }
  if (h === player && net) watch = killer && killer.alive ? killer : null;
  sfx('elim', h.x, h.z);
  leftBanner();
}

const iceGeo = new THREE.BoxGeometry(2.4, 3.4, 2.4);
const iceMat = basic(0x9fe8ff, { transparent: true, opacity: 0.45, depthWrite: false });
function freeze(e, secs) {
  if (!auth) return;
  e.frozenUntil = T + secs; e.mx = e.mz = 0;
}
function iceFx(h) {
  if (h.frozen && !h.iceMesh) { h.iceMesh = new THREE.Mesh(iceGeo, iceMat); h.iceMesh.position.y = 1.6; h.root.add(h.iceMesh); }
  if (!h.iceMesh) return;
  h.iceMesh.visible = h.frozen;
  if (h.frozen) h.iceMesh.scale.setScalar(h.def.scale * h.size);
}

const pizzaTex = canvasTex(256, 256, (g, w) => {
  const c = w / 2;
  g.fillStyle = '#c98a3e'; g.beginPath(); g.arc(c, c, c, 0, TAU); g.fill();
  g.fillStyle = '#ffd34d'; g.beginPath(); g.arc(c, c, c * 0.86, 0, TAU); g.fill();
  g.fillStyle = '#ffe98a';
  for (let i = 0; i < 20; i++) { g.beginPath(); g.arc(c + (Math.random() - 0.5) * 160, c + (Math.random() - 0.5) * 160, 10 + Math.random() * 14, 0, TAU); g.fill(); }
  g.fillStyle = '#c0261a';
  for (let i = 0; i < 11; i++) { const a = Math.random() * TAU, r = Math.random() * c * 0.7; g.beginPath(); g.arc(c + Math.cos(a) * r, c + Math.sin(a) * r, 14, 0, TAU); g.fill(); }
  g.strokeStyle = 'rgba(150,90,30,0.6)'; g.lineWidth = 3;
  for (let i = 0; i < 4; i++) { const a = (i / 8) * TAU; g.beginPath(); g.moveTo(c - Math.cos(a) * c, c - Math.sin(a) * c); g.lineTo(c + Math.cos(a) * c, c + Math.sin(a) * c); g.stroke(); }
});
const pizzaMats = [lambert(0xc98a3e), lambert(0xffffff, { map: pizzaTex }), lambert(0xc98a3e)];
const pizzaGeo = new THREE.CylinderGeometry(4, 4, 0.18, 32);
let zones = [];
function dropPizza(h) {
  const mesh = new THREE.Mesh(pizzaGeo, pizzaMats);
  mesh.position.set(h.x, 0.1, h.z); mesh.scale.setScalar(0.01); scene.add(mesh);
  zones.push({ x: h.x, z: h.z, r: 4, owner: h, until: T + 6, mesh, t: 0 });
  burst(h.x, 1, h.z, 24, [0xffd34d, 0xc0261a, 0xffffff], 8, 0.3, 0.6, 10);
}
// Fart Master's toxic cloud: hurts enemies inside it for 5s
const gasMats = [0xa8d64a, 0x86a832, 0xd4f07a].map((c) => basic(c, { transparent: true, opacity: 0.45, depthWrite: false }));
function gasCloud(h, x, z) {
  const g = new THREE.Group();
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * TAU, r = i ? rand(1.5, 3.8) : 0;
    const m = new THREE.Mesh(PROJ.gasGeo, gasMats[i % 3]); m.position.set(Math.cos(a) * r, rand(0.8, 2.2), Math.sin(a) * r); m.scale.setScalar(rand(1.8, 2.8)); g.add(m);
  }
  g.position.set(x, 0, z); g.scale.setScalar(0.01); scene.add(g);
  zones.push({ kind: 'gas', x, z, r: 5, owner: h, until: T + 5, mesh: g, t: 0 });
  burst(x, 1, z, 30, [0xa8d64a, 0xd4f07a, 0x7a9a2c], 8, 0.4, 0.8, 2);
  sfx('fart', x, z);
}
function updateZones(dt) {
  for (let i = zones.length - 1; i >= 0; i--) {
    const z = zones[i]; z.t += dt;
    z.mesh.scale.setScalar(Math.min(1, z.t / 0.2) * (T > z.until - 0.4 ? Math.max(0.01, (z.until - T) / 0.4) : 1));
    z.mesh.rotation.y += dt * 0.3;
    if (T > z.until) { scene.remove(z.mesh); zones.splice(i, 1); continue; }
    if (z.kind === 'gas') {
      if (Math.random() < 0.5) { const a = rand(0, TAU), r = rand(0, z.r); spawnP(z.x + Math.cos(a) * r, rand(0.3, 2), z.z + Math.sin(a) * r, 0, 0.8, 0, pick([0xa8d64a, 0xd4f07a]), 0.3, 0.8); }
      for (const h of heroes) if (h !== z.owner && h.alive && dist(h.x, h.z, z.x, z.z) < z.r + h.radius * 0.5) damage(h, 18 * dt, z.owner, { isSuper: true, quiet: true });
      continue;
    }
    for (const h of heroes) {
      if (!h.alive || dist(h.x, h.z, z.x, z.z) > z.r) continue;
      if (h === z.owner) {
        if (auth) h.hp = Math.min(h.maxHp, h.hp + 25 * dt);
        if (Math.random() < 0.2) spawnP(h.x + rand(-0.6, 0.6), h.y + 0.5, h.z + rand(-0.6, 0.6), 0, 2.5, 0, 0x4cd964, 0.25, 0.6);
      } else {
        h.stuckUntil = T + 0.15;
        damage(h, 8 * dt, z.owner, { isSuper: true, quiet: true });
        if (Math.random() < 0.15) spawnP(h.x, 0.3, h.z, 0, 0.5, 0, 0xffe98a, 0.3, 0.5);
      }
    }
  }
}

// Twister's tornado: chases the nearest enemy and carries them around
let tornados = [];
const tornadoMat = basic(0xd8dde6, { transparent: true, opacity: 0.55, side: THREE.DoubleSide, depthWrite: false });
function spawnTornado(h, yaw) {
  const g = new THREE.Group();
  for (let i = 0; i < 6; i++) {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(0.9 + i * 0.45, 0.6 + i * 0.45, 1.2, 12, 1, true), tornadoMat);
    m.position.y = 0.6 + i * 1.1; g.add(m);
  }
  const x = h.x + Math.sin(yaw) * 3, z = h.z + Math.cos(yaw) * 3;
  g.position.set(x, 0, z); scene.add(g);
  tornados.push({ x, z, owner: h, until: T + 5, mesh: g, carried: new Set() });
}
function updateTornados(dt) {
  for (let i = tornados.length - 1; i >= 0; i--) {
    const t = tornados[i];
    let best = null, bd = 30;
    for (const e of heroes) {
      if (e === t.owner || !e.alive || t.carried.has(e)) continue;
      const d = dist(t.x, t.z, e.x, e.z); if (d < bd) { bd = d; best = e; }
    }
    if (best) { const d = bd || 1; t.x += (best.x - t.x) / d * 7 * dt; t.z += (best.z - t.z) / d * 7 * dt; }
    const r0 = Math.hypot(t.x, t.z); if (r0 > ISLAND_R - 2) { t.x *= (ISLAND_R - 2) / r0; t.z *= (ISLAND_R - 2) / r0; }
    t.mesh.position.set(t.x, 0, t.z);
    t.mesh.children.forEach((m, k) => { m.rotation.y += dt * (8 + k); m.position.x = Math.sin(T * 5 + k) * 0.25 * k; });
    if (Math.random() < 0.8) spawnP(t.x + rand(-2, 2), rand(0, 6), t.z + rand(-2, 2), rand(-3, 3), 3, rand(-3, 3), pick([0xffffff, 0xb0b8c4, 0x8a7a6a]), 0.25, 0.5);
    if (auth) for (const e of heroes) if (e !== t.owner && e.alive && !t.carried.has(e) && dist(t.x, t.z, e.x, e.z) < 3.5 + e.radius) t.carried.add(e);
    let k = 0;
    for (const e of t.carried) {
      if (!e.alive) { t.carried.delete(e); continue; }
      const a = T * 6 + k++ * 2;
      e.x = t.x + Math.cos(a) * 1.4; e.z = t.z + Math.sin(a) * 1.4; e.y = 2 + Math.sin(T * 4 + k) * 0.6; e.vy = 0;
      damage(e, 20 * dt, t.owner, { isSuper: true, quiet: true });
    }
    if (T > t.until) {
      for (const e of t.carried) e.vy = 5;
      scene.remove(t.mesh); tornados.splice(i, 1);
    }
  }
}

// Electro's Sky Strike: a warning ring, then a giant lightning bolt from the sky
let strikes = [];
const strikeRingMat = basic(0xffe14d, { transparent: true, opacity: 0.7, side: THREE.DoubleSide, depthWrite: false });
const STRIKE_R = 5;
function spawnStrike(h, x, z) {
  const ring = new THREE.Mesh(new THREE.RingGeometry(STRIKE_R - 0.4, STRIKE_R, 40), strikeRingMat);
  ring.rotation.x = -Math.PI / 2; ring.position.set(x, 0.12, z); scene.add(ring);
  strikes.push({ x, z, owner: h, at: T + 0.7, ring, bolt: null });
  sfx('zap', x, z);
}
function updateStrikes() {
  for (let i = strikes.length - 1; i >= 0; i--) {
    const k = strikes[i];
    if (!k.bolt) {
      k.ring.scale.setScalar(1 + Math.sin(T * 30) * 0.05);
      if (T < k.at) continue;
      k.bolt = new THREE.Group();
      let x = 0, z = 0;
      for (let y = 40; y > 0; y -= 4) { // a jagged bolt down to the ground
        const nx = y > 4 ? rand(-1.5, 1.5) : 0, nz = y > 4 ? rand(-1.5, 1.5) : 0;
        const a = new THREE.Vector3(x, y, z), b = new THREE.Vector3(nx, y - 4, nz), d = b.clone().sub(a);
        const m = new THREE.Mesh(pGeo, PROJ.boltMat); m.scale.set(0.7, d.length(), 0.7);
        m.position.copy(a).addScaledVector(d, 0.5); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
        k.bolt.add(m); x = nx; z = nz;
      }
      k.bolt.position.set(k.x, 0, k.z); scene.add(k.bolt);
      blastFx(k.x, 1, k.z, STRIKE_R, 0xffe14d);
      burst(k.x, 0.5, k.z, 50, [0xffe14d, 0x9ff3ff, 0xffffff], 14, 0.4, 0.7, 10);
      sfx('thunder', k.x, k.z);
      if (player) shake = Math.max(shake, 0.7 * Math.max(0, 1 - dist(k.x, k.z, player.x, player.z) / 35));
      for (const e of heroes) if (e !== k.owner && e.alive && dist(k.x, k.z, e.x, e.z) < STRIKE_R + e.radius) damage(e, 75, k.owner, { isSuper: true });
    }
    k.bolt.visible = Math.random() > 0.3; // flicker
    if (T > k.at + 0.4) { scene.remove(k.ring, k.bolt); strikes.splice(i, 1); }
  }
}

// Gummo's Gummy Army: 3 mini bears chase the nearest enemies and go SPLAT
let gummies = [];
const gumBodyGeo = new THREE.BoxGeometry(0.7, 0.7, 0.55), gumHeadGeo = new THREE.BoxGeometry(0.6, 0.55, 0.55), gumEarGeo = new THREE.BoxGeometry(0.2, 0.2, 0.15);
const gumMats = [0xff3a4d, 0x3ccf6e, 0xffd23f].map((c) => lambert(c, { transparent: true, opacity: 0.9 }));
function spawnGummies(h, yaw) {
  for (let i = 0; i < 3; i++) {
    const a = yaw + (i - 1) * 0.6, mat = gumMats[i];
    const g = new THREE.Group();
    const b = new THREE.Mesh(gumBodyGeo, mat); b.position.y = 0.4; g.add(b);
    const hd = new THREE.Mesh(gumHeadGeo, mat); hd.position.y = 1.0; g.add(hd);
    for (const s of [-1, 1]) { const e = new THREE.Mesh(gumEarGeo, mat); e.position.set(s * 0.22, 1.32, 0); g.add(e); }
    const x = h.x + Math.sin(a) * 1.8, z = h.z + Math.cos(a) * 1.8;
    g.position.set(x, 0, z); scene.add(g);
    gummies.push({ x, z, owner: h, until: T + 8, mesh: g, hop: rand(0, TAU) });
  }
}
function updateGummies(dt) {
  for (let i = gummies.length - 1; i >= 0; i--) {
    const g = gummies[i];
    let best = null, bd = 40;
    for (const e of heroes) {
      if (e === g.owner || !e.alive || e.invisible) continue;
      const d = dist(g.x, g.z, e.x, e.z); if (d < bd) { bd = d; best = e; }
    }
    let pop = T > g.until;
    if (best) {
      const d = bd || 1;
      g.x += (best.x - g.x) / d * 10 * dt; g.z += (best.z - g.z) / d * 10 * dt;
      g.mesh.rotation.y = Math.atan2(best.x - g.x, best.z - g.z);
      if (d < best.radius + 0.8) { pop = true; damage(best, 30, g.owner, { isSuper: true }); }
    }
    g.hop += dt * 12;
    g.mesh.position.set(g.x, Math.abs(Math.sin(g.hop)) * 0.8, g.z);
    if (pop) {
      burst(g.x, 0.8, g.z, 22, [g.mesh.children[0].material.color.getHex(), 0xffffff], 8, 0.3, 0.5, 10);
      sfx('squish', g.x, g.z);
      scene.remove(g.mesh); gummies.splice(i, 1);
    }
  }
}

// Fluff's Fluff Wall: a row of cotton candy that blocks heroes and shots for 6s
let walls = [];
const fluffWallMats = [lambert(0xffb3d9), lambert(0xb3e0ff)], fluffGeo = new THREE.IcosahedronGeometry(1, 1);
function spawnWall(h, yaw) {
  const fx = Math.sin(yaw), fz = Math.cos(yaw), cx = h.x + fx * 4, cz = h.z + fz * 4;
  const g = new THREE.Group(), cols = [];
  for (let i = -2; i <= 2; i++) {
    const x = cx + fz * i * 1.7, z = cz - fx * i * 1.7;
    for (const [y, s] of [[1.0, 1.25], [2.4, 1.05], [3.5, 0.75]]) {
      const m = new THREE.Mesh(fluffGeo, fluffWallMats[(i + 2 + (y > 2 ? 1 : 0)) % 2]); m.position.set(x, y, z); m.scale.setScalar(s); g.add(m);
    }
    cols.push({ x, z, r: 1.1, kind: 'wall' });
  }
  g.scale.set(1, 0.01, 1); scene.add(g);
  colliders.push(...cols);
  walls.push({ owner: h, until: T + 6, mesh: g, cols, t: 0 });
  burst(cx, 1.5, cz, 30, [0xffb3d9, 0xb3e0ff, 0xffffff], 8, 0.4, 0.6, 6);
}
function removeWall(w) {
  scene.remove(w.mesh);
  for (const c of w.cols) { const k = colliders.indexOf(c); if (k >= 0) colliders.splice(k, 1); }
}
function updateWalls(dt) {
  for (let i = walls.length - 1; i >= 0; i--) {
    const w = walls[i]; w.t += dt;
    w.mesh.scale.y = Math.min(1, w.t / 0.25) * (T > w.until - 0.3 ? Math.max(0.01, (w.until - T) / 0.3) : 1);
    if (T > w.until) { burst(w.cols[2].x, 1.5, w.cols[2].z, 24, [0xffb3d9, 0xb3e0ff], 6, 0.35, 0.6, 6); removeWall(w); walls.splice(i, 1); }
  }
}

// Kernel's Butter Slam: the shockwave when he lands
function slamFx(x, z) {
  blastFx(x, 0.8, z, 6.5, 0xffd86a);
  burst(x, 0.5, z, 45, [0xffd86a, 0xfffbe8, 0xffe9a0], 13, 0.35, 0.7, 10);
  sfx('boom', x, z);
  if (player) shake = Math.max(shake, 0.6 * Math.max(0, 1 - dist(x, z, player.x, player.z) / 30));
}
function butterSlam(h) {
  slamFx(h.x, h.z);
  if (!auth) return;
  emit(['x', h.id, r2(h.x), r2(h.z)]);
  for (const e of heroes) {
    if (e === h || !e.alive) continue;
    const dx = e.x - h.x, dz = e.z - h.z, d = Math.hypot(dx, dz) || 1;
    if (d > 6.5 + e.radius) continue;
    damage(e, 50, h, { isSuper: true });
    e.kbx += dx / d * 14; e.kbz += dz / d * 14; e.vy = 6;
  }
}

// Glaxo's black hole: anyone who steps in is eliminated instantly
let holes = [];
const holeCoreMat = basic(0x000000);
const holeRingMat = basic(0x8a4dff, { transparent: true, opacity: 0.75, side: THREE.DoubleSide, depthWrite: false });
function spawnHole(h, x, z) {
  const g = new THREE.Group();
  const core = new THREE.Mesh(new THREE.IcosahedronGeometry(1.2, 2), holeCoreMat); core.position.y = 0.4; g.add(core);
  const ring = new THREE.Mesh(new THREE.RingGeometry(1.3, 2.6, 32), holeRingMat); ring.rotation.x = -Math.PI / 2; ring.position.y = 0.08; g.add(ring);
  g.position.set(x, 0, z); g.scale.setScalar(0.01); scene.add(g);
  holes.push({ x, z, owner: h, until: T + 3, mesh: g, ring, t: 0 });
}
function updateHoles(dt) {
  for (let i = holes.length - 1; i >= 0; i--) {
    const o = holes[i]; o.t += dt;
    o.mesh.scale.setScalar(Math.min(1, o.t / 0.25) * (T > o.until - 0.3 ? Math.max(0.01, (o.until - T) / 0.3) : 1));
    o.ring.rotation.z += dt * 4;
    for (let k = 0; k < 3; k++) { const a = rand(0, TAU); spawnP(o.x + Math.cos(a) * 4, 0.4, o.z + Math.sin(a) * 4, -Math.cos(a) * 8, 0, -Math.sin(a) * 8, pick([0x8a4dff, 0xffffff, 0x3b1f6e]), 0.15, 0.45); }
    for (const e of heroes) {
      if (e === o.owner || !e.alive) continue;
      const dx = o.x - e.x, dz = o.z - e.z, d = Math.hypot(dx, dz) || 0.01;
      if (d < 1.4 + e.radius * 0.5 && !e.shielded && auth) {
        burst(o.x, 1, o.z, 30, [0x8a4dff, 0xffffff, 0x000000], 6, 0.35, 0.6, 0);
        eliminate(e, o.owner, 'blackhole');
      } else if (d < 5 && !e.shielded && auth) { e.x += dx / d * 4 * dt; e.z += dz / d * 4 * dt; }
    }
    if (T > o.until) { scene.remove(o.mesh); holes.splice(i, 1); }
  }
}

// ===================================================================
// Hero update (movement, effects, supers, animation)
// ===================================================================
function collide(h) {
  let hit = false;
  for (const c of colliders) {
    if (h.y > 4 && c.kind !== 'center') continue; // launched high over rocks, crates and towers
    const dx = h.x - c.x, dz = h.z - c.z, d = Math.hypot(dx, dz), min = c.r + h.radius;
    if (d < min && d > 0.0001) { h.x = c.x + dx / d * min; h.z = c.z + dz / d * min; hit = true; }
  }
  for (const o of heroes) {
    if (o === h || !o.alive) continue;
    const dx = h.x - o.x, dz = h.z - o.z, d = Math.hypot(dx, dz), min = h.radius + o.radius;
    if (d < min && d > 0.0001) { const push = (min - d) / 2; h.x += dx / d * push; h.z += dz / d * push; }
  }
  const r = Math.hypot(h.x, h.z);
  if (r > ISLAND_R - 1) { h.x *= (ISLAND_R - 1) / r; h.z *= (ISLAND_R - 1) / r; }
  return hit;
}

function updateHero(h, dt) {
  if (!h.alive) { updateDead(h, dt); return; }
  if (!h.lasering) h.superCharge = Math.min(100, h.superCharge + 2 * dt);
  h.cd -= dt;

  // Zippy burst: 3 zaps from alternating fists
  if (h.burst > 0) {
    h.burstT -= dt;
    if (h.burstT <= 0) {
      const side = h.burst % 2 ? 0.75 : -0.75;
      fireStraight(h, 'zap', h.burstYaw + rand(-0.06, 0.06), { speed: 50, range: 13, dmg: 12, side, y: 1.3 });
      h.punchT = 0.12; h.punchSide = side; h.burst--; h.burstT = 0.08;
      sfx('zap', h.x, h.z);
    }
  }

  // movement
  const lava = h.y < 0.3 && inLava(h.x, h.z);
  let speed = h.def.speed * (h.has('speed') ? 1.6 : 1) * (h.lasering ? 0.5 : 1) * (lava ? 0.75 : 1)
    * (h.has('slow') ? 0.6 : 1) * (h.stuckUntil > T ? 0.25 : 1) * (h.frozen ? 0 : 1);
  if (h.puppet || h.carried) { // a guest's view of someone else: the host's snapshots move them
    if (h.dashing) for (let i = 0; i < 3; i++) spawnP(h.x + rand(-0.5, 0.5), h.y + rand(0.5, 2.5), h.z + rand(-0.5, 0.5), 0, 0, 0, pick([0x5ff6ff, 0x2f7bff, 0xffffff]), rand(0.15, 0.35), 0.35);
  } else moveHero(h, dt, speed);

  // environment damage
  if (lava) {
    damage(h, 30 * dt, null, { cause: 'lava' });
    if (Math.random() < 0.3) spawnP(h.x + rand(-0.6, 0.6), 0.3, h.z + rand(-0.6, 0.6), 0, rand(2, 4), 0, pick(world.poolFx), 0.25, 0.5, 2);
  }
  if (h.alive && outsideStorm(h.x, h.z)) damage(h, stormDamage() * dt, null, { cause: 'storm' });
  if (!h.alive) return;
  updateHeroFx(h, dt, speed);
}

function moveHero(h, dt, speed) {
  if (h.dashing) {
    const step = 42 * dt;
    h.x += h.dashDir.x * step; h.z += h.dashDir.z * step;
    for (let i = 0; i < 3; i++) spawnP(h.x + rand(-0.5, 0.5), h.y + rand(0.5, 2.5), h.z + rand(-0.5, 0.5), 0, 0, 0, pick([0x5ff6ff, 0x2f7bff, 0xffffff]), rand(0.15, 0.35), 0.35);
    for (const e of heroes) {
      if (e === h || !e.alive || h.dashHit.has(e)) continue;
      if (dist(h.x, h.z, e.x, e.z) < h.radius + e.radius + 0.6) {
        h.dashHit.add(e);
        damage(e, 35, h, { isSuper: true });
        e.kbx += h.dashDir.x * 18; e.kbz += h.dashDir.z * 18; e.vy = 6;
        burst(e.x, 1.5, e.z, 12, [0x5ff6ff, 0xffffff], 8, 0.3, 0.4, 5);
      }
    }
  } else {
    h.x += h.mx * speed * dt; h.z += h.mz * speed * dt;
  }
  h.x += h.kbx * dt; h.z += h.kbz * dt;
  const k = Math.exp(-5 * dt); h.kbx *= k; h.kbz *= k;
  if (h.launched) {
    h.x += h.lvx * dt; h.z += h.lvz * dt;
    if (Math.random() < 0.6) spawnP(h.x + rand(-0.4, 0.4), h.y + rand(0.5, 2), h.z + rand(-0.4, 0.4), 0, 0, 0, pick([0x5ff6ff, 0xffffff]), rand(0.15, 0.3), 0.4);
  }
  if (collide(h) && h.dashing) h.dashUntil = 0;

  // jump / gravity
  if (h.y > 0 || h.vy > 0) {
    h.vy -= 28 * dt; h.y += h.vy * dt;
    if (h.y <= 0) {
      h.y = 0; h.vy = 0;
      if (h.launched) { h.launched = false; h.lvx = h.lvz = 0; burst(h.x, 0.3, h.z, 14, [0x8a7f8c, 0xb8aebb], 5, 0.35, 0.5, 6); }
      if (h.slam) { h.slam = false; butterSlam(h); }
    }
  }
  updatePads(h);
}

function updateHeroFx(h, dt, speed) {
  const s = h.def.scale;
  // Barf Bush: leaf barf stream
  if (h.barfUntil > T) {
    const fx = Math.sin(h.yaw), fz = Math.cos(h.yaw);
    for (let i = 0; i < 7; i++) {
      const a = h.yaw + rand(-0.3, 0.3), sp = rand(24, 34);
      spawnP(h.x + fx * 0.7 * s, h.y + 2.15 * s, h.z + fz * 0.7 * s, Math.sin(a) * sp, rand(-1, 3), Math.cos(a) * sp, pick(LEAF_COLORS), rand(0.35, 0.55), rand(0.4, 0.5), 4, true);
    }
  }
  // Barf Bush: leaf laser
  if (h.beam) {
    if (h.lasering) updateLaser(h, dt);
    else if (h.beam.visible) { h.beam.visible = false; }
  }
  // Brickster: brick fort shield
  if (h.shieldMesh) {
    if (h.shielded) {
      h.shieldT += dt;
      for (const b of h.shieldMesh.bricks) b.scale.y = clamp((h.shieldT - b.delay) / 0.15, 0.01, 1);
    } else if (h.shieldMesh.visible) {
      h.shieldMesh.visible = false;
      burst(h.x, 1.2, h.z, 30, [0xc8361e, 0x8a8f99, 0xe8731c], 9, 0.4, 0.9, 16);
    }
  }
  // Frosty's slow / freeze, Chomp's grow
  if (h.has('slow') && Math.random() < 0.3) spawnP(h.x + rand(-0.6, 0.6), h.y + rand(0.3, 2.5), h.z + rand(-0.6, 0.6), 0, -1, 0, 0xdffaff, 0.18, 0.5);
  iceFx(h);
  h.size = lerp(h.size, h.grown ? (h.key === 'marshy' ? 2 : 1.5) : 1, 1 - Math.exp(-8 * dt));
  if (h.key === 'marshy' && h.grown) { // Giant Marshy bounces enemies off his squishy body
    for (const e of heroes) {
      if (e === h || !e.alive || (e.bounceT || 0) > T) continue;
      const dx = e.x - h.x, dz = e.z - h.z, d = Math.hypot(dx, dz) || 1;
      if (d > h.radius + e.radius + 0.3) continue;
      e.bounceT = T + 0.6;
      damage(e, 10, h, { isSuper: true });
      if (auth || !e.puppet) { e.kbx += dx / d * 18; e.kbz += dz / d * 18; e.vy = 7; }
      burst(e.x, 1.5, e.z, 12, [0xfaf6ef, 0xffffff, 0xe0a86a], 6, 0.3, 0.4, 8);
      sfx('squish', e.x, e.z);
    }
  }
  h.rig.body.scale.setScalar(h.def.scale * h.size);
  h.blob.scale.setScalar(h.radius * 1.1);
  // effect sparkles
  if (h.has('speed') && Math.random() < 0.4 && !h.invisible) spawnP(h.x, h.y + 0.3, h.z, 0, 1, 0, 0xffd23f, 0.2, 0.4);
  if (h.has('strength') && Math.random() < 0.3 && !h.invisible) spawnP(h.x + rand(-0.6, 0.6), h.y + rand(0.5, 2.5), h.z + rand(-0.6, 0.6), 0, 2, 0, 0xff4d4d, 0.2, 0.5);

  // damage numbers (grouped so the laser doesn't spam)
  h.numT -= dt;
  if (h.numAcc > 0 && h.numT <= 0) { floatNum(h, Math.round(h.numAcc), h.lasering ? '#b6ff8a' : '#ffffff'); h.numAcc = 0; h.numT = 0.25; }

  animateHero(h, dt, speed);
}

function updateLaser(h, dt) {
  const L = 25, fx = Math.sin(h.yaw), fz = Math.cos(h.yaw), s = h.def.scale;
  const ox = h.x + fx * 0.6 * s, oy = h.headY + 0.05, oz = h.z + fz * 0.6 * s;
  const pulse = 1 + Math.sin(T * 30) * 0.15;
  h.beam.position.set(ox + fx * L / 2, oy, oz + fz * L / 2);
  h.beam.rotation.y = h.yaw;
  h.beam.scale.set(pulse, pulse, L);
  h.beam.visible = !h.invisible || h.isPlayer;
  for (const e of heroes) {
    if (e === h || !e.alive) continue;
    const dx = e.x - ox, dz = e.z - oz, along = dx * fx + dz * fz;
    if (along < 0 || along > L) continue;
    if (Math.abs(dx * fz - dz * fx) < 1.1 + e.radius) damage(e, 60 * dt, h, { isSuper: true, quiet: true });
  }
  for (let i = 0; i < 4; i++) {
    const t = rand(1, L), sp = rand(2, 6), a = rand(0, TAU);
    spawnP(ox + fx * t, oy + rand(-0.8, 0.8), oz + fz * t, Math.cos(a) * sp + fx * 8, rand(-2, 2), Math.sin(a) * sp + fz * 8, pick(LEAF_COLORS), rand(0.35, 0.6), 0.4, 3, true);
  }
  h.laserSfxT -= dt;
  if (h.laserSfxT <= 0) { h.laserSfxT = 0.25; sfx('laser', h.x, h.z); }
}

function animateHero(h, dt, speed) {
  const r = h.rig;
  const moving = h.mx * h.mx + h.mz * h.mz > 0.01 || h.dashing;
  if (moving) h.walk += dt * (h.dashing ? 25 : 1.4 * speed);
  const sw = moving ? Math.sin(h.walk) * 0.75 : 0;
  const ease = 1 - Math.exp(-15 * dt);
  const air = h.y > 0.05;
  r.legL.rotation.x = lerp(r.legL.rotation.x, air ? -0.5 : sw, ease);
  r.legR.rotation.x = lerp(r.legR.rotation.x, air ? 0.3 : -sw, ease);
  h.recoil = Math.max(0, h.recoil - dt * 6);
  h.punchT = Math.max(0, h.punchT - dt);
  if (r.gunPose) {
    r.armR.rotation.x = -1.35 + h.recoil * 0.3;
    r.armL.rotation.x = -1.25 + h.recoil * 0.3;
    r.armL.rotation.y = 0.4;
    r.gun.position.z = (h.key === 'boomer' ? 0.2 : 0.8) - h.recoil * 0.15;
  } else {
    let ra = sw * 0.8, la = -sw * 0.8;
    if (h.punchT > 0) { if (h.punchSide > 0) ra = -1.6; else la = -1.6; }
    if (h.barfUntil > T || h.lasering) { ra = -0.9; la = -0.9; }
    if (h.dashing) { ra = -2.8; la = 0.8; }
    r.armR.rotation.x = lerp(r.armR.rotation.x, ra, h.punchT > 0 ? 1 : ease);
    r.armL.rotation.x = lerp(r.armL.rotation.x, la, h.punchT > 0 ? 1 : ease);
  }
  r.body.position.y = moving && !air ? Math.abs(Math.sin(h.walk)) * 0.08 : 0;
  if (r.float) r.body.position.y = 0.45 + Math.sin(T * 3 + h.z) * 0.15;
  if (r.tentacles) r.tentacles.forEach((t, i) => { t.rotation.x = Math.sin(T * (moving ? 10 : 4) + i * 1.3) * 0.25; });
  if (h.fearUntil > T && Math.random() < 0.2) spawnP(h.x, h.headY + 1.2, h.z, 0, 1, 0, 0xeef0ff, 0.2, 0.4);
  r.body.rotation.x = lerp(r.body.rotation.x, h.dashing ? 0.7 : 0, ease);
  h.spinT = Math.max(0, h.spinT - dt);
  r.body.rotation.y = h.spinT > 0 ? (1 - h.spinT / 0.3) * TAU : 0;
  if (r.tail) r.tail.rotation.y = Math.sin(T * 3 + h.x) * 0.25;
  if (r.mouth) r.mouth.scale.y = (h.barfUntil > T) ? 1.8 : 1;
  if (r.scarf) r.scarf.rotation.x = Math.sin(T * 12 + h.x) * 0.15 + (moving ? 0.25 : 0);
  if (h.lasering) r.head.rotation.x = Math.sin(T * 40) * 0.03;
  if (h.dance) danceHero(h, dt);

  h.root.position.set(h.x, h.y, h.z);
  h.root.rotation.y = h.yaw;
  h.blob.position.y = 0.06 - h.y;

  // hit flash
  h.flashT -= dt;
  const flash = h.flashT > 0;
  if (flash !== h.flashOn) {
    h.flashOn = flash;
    for (const m of h.mats) if (m.emissive) m.emissive.setRGB(flash ? 0.7 : 0, flash ? 0.7 : 0, flash ? 0.7 : 0);
  }
  // invisibility: bots vanish; the player sees a see-through ghost of themselves
  const inv = h.invisible;
  if (h.isPlayer) {
    if (inv !== h.ghost) {
      h.ghost = inv;
      for (const m of h.mats) { m.transparent = inv; m.opacity = inv ? 0.3 : 1; m.needsUpdate = true; }
    }
  } else {
    h.root.visible = !inv;
  }
}

// victory dance (specs/09-screens-and-audio.md)
const DANCES = ['flap', 'spin', 'sway'];
const CONFETTI = [0xffd23f, 0xff9f1a, 0xffffff, 0xff4d8d, 0x5ff6ff];
function danceHero(h, dt) {
  const r = h.rig, t = (h.danceT += dt), e = 1 - Math.exp(-12 * dt);
  const base = r.float ? 0.45 : 0;
  let armX = 0, armZ = 0, armXL = null, legX = 0, bodyY = base, spin = 0, tilt = 0;
  if (h.dance === 'flap') {
    armZ = 1.3 + Math.sin(t * 14) * 0.9;
    bodyY = base + Math.abs(Math.sin(t * 7)) * 0.5;
    legX = Math.sin(t * 7) * 0.3;
  } else if (h.dance === 'spin') {
    armZ = 1.5; spin = t * 9;
    bodyY = base + Math.abs(Math.sin(t * 9)) * 0.15;
  } else {
    armX = -2.7 + Math.sin(t * 10) * 0.35; armXL = -2.7 - Math.sin(t * 10) * 0.35;
    tilt = Math.sin(t * 5) * 0.25;
    legX = Math.max(0, Math.sin(t * 5)) * -0.9;
    bodyY = base + Math.abs(Math.sin(t * 10)) * 0.12;
  }
  r.armR.rotation.x = lerp(r.armR.rotation.x, armX, e);
  r.armL.rotation.x = lerp(r.armL.rotation.x, armXL ?? armX, e);
  r.armR.rotation.z = lerp(r.armR.rotation.z, armZ, e);
  r.armL.rotation.z = lerp(r.armL.rotation.z, -armZ, e);
  r.armL.rotation.y = 0;
  r.legL.rotation.x = legX; r.legR.rotation.x = h.dance === 'sway' ? 0 : -legX;
  r.body.position.y = bodyY;
  r.body.rotation.y = spin;
  r.body.rotation.z = tilt;
  r.head.rotation.z = Math.sin(t * 6) * 0.15;
  h.danceSpark = (h.danceSpark || 0) - dt;
  if (h.danceSpark <= 0) {
    h.danceSpark = 0.12;
    const a = rand(0, TAU), d = rand(0.5, 3);
    spawnP(h.x + Math.cos(a) * d, h.y + 5 * h.def.scale, h.z + Math.sin(a) * d, rand(-1, 1), rand(0, 2), rand(-1, 1), pick(CONFETTI), rand(0.15, 0.3), 2.2, 3);
  }
}
function startDance(h) {
  h.dance = pick(DANCES); h.danceT = 0;
  h.mx = h.mz = 0; h.laserUntil = 0; h.barfUntil = 0; h.dashUntil = 0;
  if (h.beam) h.beam.visible = false;
  burst(h.x, h.y + 2.5 * h.def.scale, h.z, 60, CONFETTI, 12, 0.3, 1.6, 6);
  $('hud').classList.add('dancing');
}

function updateDead(h, dt) {
  if (!h.root.visible && h.deadT > 0) return;
  h.deadT += dt;
  h.root.visible = true;
  h.rig.body.rotation.x = lerp(h.rig.body.rotation.x, -Math.PI / 2, 1 - Math.exp(-8 * dt));
  if (h.deadT > 1.0) {
    burst(h.x, 0.8, h.z, 30, [0xffffff, 0xdddddd, 0xffd23f], 8, 0.4, 0.7, 6);
    h.root.visible = false;
  }
}

// ===================================================================
// Projectiles
// ===================================================================
function colliderAt(x, z) {
  for (const c of colliders) if (dist(x, z, c.x, c.z) < c.r) return c;
  return null;
}
function blockedAt(x, z) {
  for (const c of colliders) if (dist(x, z, c.x, c.z) < c.r) return true;
  return Math.hypot(x, z) > ISLAND_R + 6;
}
function updateProjectiles(dt) {
  for (let i = projectiles.length - 1; i >= 0; i--) {
    const p = projectiles[i];
    let dead = false;
    if (p.lob) {
      p.t += dt; const k = Math.min(1, p.t / p.dur);
      p.x = lerp(p.ax, p.bx, k); p.z = lerp(p.az, p.bz, k);
      p.y = lerp(p.ay, 0.42, k) + 4 * p.H * k * (1 - k);
      p.mesh.position.set(p.x, p.y, p.z); p.mesh.rotation.x += dt * 8;
      if (Math.random() < 0.6) spawnP(p.x, p.y + 0.5, p.z, 0, 0.5, 0, pick(p.type === 'bomb' ? [0xffa020, 0x777777] : [0xa8d64a, 0xd4f07a]), 0.15, 0.3);
      if (k >= 1) {
        if (p.bounces > 0) {
          p.bounces--; p.t = 0; p.ax = p.x; p.az = p.z; p.ay = 0.42; p.bx = p.x + p.fx * 2.5; p.bz = p.z + p.fz * 2.5; p.H = 1.1; p.dur = 0.28;
          burst(p.x, 0.3, p.z, 6, [0xffd23f, 0xff8a1a], 4, 0.2, 0.3, 8);
        } else if (p.type === 'fartbomb') { gasCloud(p.owner, p.x, p.z); dead = true; }
        else { explode(p.x, p.z, 3.5, p.dmg, p.owner, false); dead = true; }
      }
    } else {
      const steps = Math.max(1, Math.ceil(p.speed * dt / 0.5));
      const sdt = dt / steps;
      for (let s = 0; s < steps && !dead; s++) {
        p.x += p.vx * sdt; p.z += p.vz * sdt; p.travelled += p.speed * sdt;
        if (!p.ghost && blockedAt(p.x, p.z)) {
          const c = p.bounces > 0 && colliderAt(p.x, p.z);
          if (c) { // Pizza Pete: bounce off the rock
            const nx = p.x - c.x, nz = p.z - c.z, nl = Math.hypot(nx, nz) || 1, ux = nx / nl, uz = nz / nl, vn = p.vx * ux + p.vz * uz;
            p.vx -= 2 * vn * ux; p.vz -= 2 * vn * uz; p.x = c.x + ux * (c.r + 0.05); p.z = c.z + uz * (c.r + 0.05);
            p.bounces--; burst(p.x, p.y, p.z, 5, [0xf5c242, 0xc0261a], 4, 0.15, 0.3, 8);
            continue;
          }
          dead = true; hitWall(p); break;
        }
        for (const e of heroes) {
          if (e === p.owner || !e.alive || (p.pierce && p.pierce.has(e))) continue;
          if (dist(p.x, p.z, e.x, e.z) < e.radius + p.hitR && p.y > e.y - 0.3 && p.y < e.y + 3.2 * e.def.scale) {
            if (p.pierce) { p.pierce.add(e); hitHero(p, e); continue; } // Rocky's crystal flies on through
            dead = true; hitHero(p, e); break;
          }
        }
        if (!dead && p.travelled > p.range) { dead = true; p.ended = true; hitWall(p); }
      }
      p.mesh.position.set(p.x, p.y, p.z);
      if (p.type === 'brick' && Math.random() < 0.8) spawnP(p.x, p.y, p.z, rand(-1, 1), rand(0, 1), rand(-1, 1), pick([0xff8a1a, 0xffd23f]), 0.2, 0.25);
      if (p.type === 'rocket') for (let k = 0; k < 2; k++) spawnP(p.x - p.vx * 0.03, p.y, p.z - p.vz * 0.03, rand(-1, 1), rand(0, 2), rand(-1, 1), pick([0xff8a1a, 0xffd23f, 0xbbbbbb]), rand(0.25, 0.5), 0.4);
      if (p.type === 'zap') p.mesh.rotation.z += dt * 30;
      if (p.type === 'star' || p.type === 'pizza') p.mesh.rotation.y += dt * 25;
      if (p.type === 'spacestar') { p.mesh.rotation.z += dt * 20; if (Math.random() < 0.6) spawnP(p.x, p.y, p.z, 0, 0, 0, pick([0xffe14d, 0xb388ff]), 0.15, 0.3); }
      if (p.type === 'orb' && Math.random() < 0.5) spawnP(p.x, p.y, p.z, 0, 0.5, 0, 0xe8f0ff, 0.2, 0.4);
      if (p.type === 'gust') { p.mesh.scale.x = 1 + p.travelled / 15; if (Math.random() < 0.6) spawnP(p.x + rand(-1, 1), p.y + rand(-0.4, 0.4), p.z + rand(-1, 1), p.vx * 0.2, 0, p.vz * 0.2, 0xffffff, 0.12, 0.3); }
      if (p.type === 'snow' && Math.random() < 0.5) spawnP(p.x, p.y, p.z, 0, -1, 0, 0xdffaff, 0.15, 0.3);
      if (p.type === 'gas') { p.mesh.scale.setScalar(0.7 + p.travelled / p.range * 0.8); p.mesh.rotation.y += dt * 3; if (Math.random() < 0.6) spawnP(p.x + rand(-0.5, 0.5), p.y + rand(-0.4, 0.4), p.z + rand(-0.5, 0.5), 0, 0.6, 0, pick([0xa8d64a, 0xd4f07a, 0x7a9a2c]), 0.3, 0.5); }
      if (p.type === 'heart' && Math.random() < 0.8) spawnP(p.x + rand(-1, 1), p.y + rand(-1, 1), p.z + rand(-1, 1), 0, 0.5, 0, pick([0xff2e55, 0xff9ab0, 0xffffff]), 0.3, 0.4);
      if (p.type === 'bolt') { p.mesh.rotation.z = rand(-0.5, 0.5); if (Math.random() < 0.5) spawnP(p.x, p.y, p.z, rand(-2, 2), rand(-2, 2), rand(-2, 2), pick([0xffe14d, 0x9ff3ff]), 0.12, 0.2); }
      if (p.type === 'mallow' || p.type === 'kernel' || p.type === 'popcorn') { p.mesh.rotation.x += dt * 12; p.mesh.rotation.z += dt * 7; }
      if (p.type === 'gummy') { p.y = p.y0 + Math.abs(Math.sin(p.travelled * 0.45)) * 1.1 - 0.4; p.mesh.position.y = p.y; p.mesh.scale.y = 0.8 + Math.abs(Math.cos(p.travelled * 0.45)) * 0.4; }
      if ((p.type === 'crystal' || p.type === 'bigcrystal') && Math.random() < (p.type === 'crystal' ? 0.5 : 1)) spawnP(p.x, p.y, p.z, 0, 0, 0, pick([0x9ff3ff, 0xff9ad5, 0xffffff]), p.type === 'crystal' ? 0.12 : 0.4, 0.4);
      if (p.type === 'fluffball' && Math.random() < 0.4) spawnP(p.x, p.y, p.z, 0, -0.5, 0, pick([0xffb3d9, 0xb3e0ff]), 0.18, 0.4);
    }
    if (dead) { scene.remove(p.mesh); projectiles.splice(i, 1); }
  }
}
const IMPACT = {
  brick: [0xc8361e, 0xff8a1a, 0x8a8f99], zap: [0x8ff0ff, 0xffffff], star: [0xc8ccd4, 0x7b3fe0],
  snow: [0xffffff, 0xdffaff, 0x9fe8ff], pizza: [0xf5c242, 0xc0261a, 0xffe08a],
  orb: [0xe8f0ff, 0xb0c4ff], ink: [0x2a1040, 0x111111, 0x5b2fa0], gust: [0xffffff, 0xe0fff8], spacestar: [0xffe14d, 0xb388ff, 0xffffff],
  gas: [0xa8d64a, 0xd4f07a, 0x7a9a2c], fist: [0xffffff, 0xe8243c], heart: [0xff2e55, 0xff9ab0, 0xffffff], bolt: [0xffe14d, 0x9ff3ff, 0xffffff],
  mallow: [0xfaf6ef, 0xffffff], gummy: [0xff3a4d, 0x3ccf6e, 0xffd23f], kernel: [0xffd86a, 0xfffbe8], popcorn: [0xfffbe8, 0xffd86a],
  crystal: [0x9ff3ff, 0xff9ad5, 0xffffff], bigcrystal: [0xc9a0ff, 0x9ff3ff, 0xffffff], fluffball: [0xffb3d9, 0xb3e0ff, 0xffffff],
};
function hitWall(p) {
  if (p.type === 'rocket') explode(p.x, p.z, 6, p.dmg, p.owner, true);
  else burst(p.x, p.y, p.z, 6, IMPACT[p.type], 5, 0.2, 0.4, 12);
  if (p.type === 'kernel' && p.ended) { // Kernel: pops into 3 bits of popcorn
    for (const sp of [-0.5, 0, 0.5]) addProj(p.owner, 'popcorn', p.x, p.y, p.z, p.yaw + sp, { speed: 26, range: 6, dmg: 14 });
    sfx('pop', p.x, p.z);
  }
}
function hitHero(p, e) {
  if (p.type === 'rocket') { explode(p.x, p.z, 6, p.dmg, p.owner, true); return; }
  damage(e, p.dmg, p.owner, { isSuper: p.isSuper });
  burst(p.x, p.y, p.z, p.type === 'heart' ? 30 : 8, IMPACT[p.type], 5, 0.22, 0.4, 12);
  if (p.type === 'bolt') chainZap(p.owner, e);
  if (p.kb && (auth || !e.puppet)) { e.kbx += p.vx / p.speed * p.kb; e.kbz += p.vz / p.speed * p.kb; if (p.type === 'heart') e.vy = 7; }
  if (!auth) return;
  if (p.type === 'snow') e.fx.slow = T + 2;
  if (p.type === 'fluffball') e.fx.slow = T + 1.5;
  if (p.type === 'ink') { e.inkUntil = T + 2; notify(e, 'i'); }
}
// Electro: a bolt that hits jumps to the nearest other enemy for half damage
function chainZap(owner, from) {
  let best = null, bd = 7;
  for (const e of heroes) {
    if (e === owner || e === from || !e.alive) continue;
    const d = dist(from.x, from.z, e.x, e.z); if (d < bd) { bd = d; best = e; }
  }
  if (!best) return;
  damage(best, 10, owner);
  for (let i = 0; i <= 10; i++) {
    const k = i / 10;
    spawnP(lerp(from.x, best.x, k) + rand(-0.3, 0.3), from.y + 1.5 + rand(-0.4, 0.4), lerp(from.z, best.z, k) + rand(-0.3, 0.3), 0, 0, 0, pick([0xffe14d, 0x9ff3ff, 0xffffff]), 0.22, 0.25);
  }
}

// ===================================================================
// Pickups (specs/04-pickups.md)
// ===================================================================
let pickups = [];
let pickupsDirty = false; // the host sends the pickup list to guests when it changes
const ringGeo = new THREE.RingGeometry(0.9, 1.25, 24);
const ringMats = {};
for (const t in PICKUP_TYPES) ringMats[t] = basic(PICKUP_TYPES[t].ring, { transparent: true, opacity: 0.7, depthWrite: false, side: THREE.DoubleSide });
const spriteMats = {};
for (const t in pickupTex) spriteMats[t] = new THREE.SpriteMaterial({ map: pickupTex[t] });

function spawnPickup(type, x, z, temp) {
  const sprite = new THREE.Sprite(spriteMats[type]); sprite.scale.set(1.7, 1.7, 1);
  const ring = new THREE.Mesh(ringGeo, ringMats[type]); ring.rotation.x = -Math.PI / 2;
  const p = { type, x, z, sprite, ring, active: true, temp, respawnAt: 0, phase: rand(0, TAU) };
  placePickup(p, x, z);
  scene.add(sprite, ring);
  pickups.push(p);
}
function placePickup(p, x, z) {
  p.x = x; p.z = z;
  p.sprite.position.set(x, 1.4, z); p.ring.position.set(x, 0.08, z);
  p.sprite.visible = p.ring.visible = true; p.active = true;
  pickupsDirty = true;
}
function updatePickups(dt) {
  for (let i = pickups.length - 1; i >= 0; i--) {
    const p = pickups[i];
    if (!p.active) {
      if (auth && !p.temp && T > p.respawnAt) { const s = freeSpot(5, ISLAND_R - 6, 1.5); placePickup(p, s.x, s.z); }
      continue;
    }
    p.sprite.position.y = 1.4 + Math.sin(T * 3 + p.phase) * 0.25;
    p.sprite.material.rotation = Math.sin(T * 2 + p.phase) * 0.2;
    p.ring.scale.setScalar(1 + Math.sin(T * 4 + p.phase) * 0.1);
    if (!auth) continue;
    for (const h of heroes) {
      if (!h.alive || dist(h.x, h.z, p.x, p.z) > h.radius + 0.8) continue;
      applyPickup(h, p.type);
      p.active = false; p.sprite.visible = p.ring.visible = false;
      if (p.temp) { scene.remove(p.sprite, p.ring); pickups.splice(i, 1); }
      else p.respawnAt = T + 25;
      pickupsDirty = true;
      break;
    }
  }
}
function applyPickup(h, type) {
  if (type === 'health') h.hp = Math.min(h.maxHp, h.hp + 60);
  else h.fx[type] = T + ({ strength: 10, speed: 8, invis: 5 })[type];
  burst(h.x, 1.5, h.z, 14, [PICKUP_TYPES[type].ring, 0xffffff], 5, 0.25, 0.6, 2);
  notify(h, 'pk', PICKUP_TYPES[type].label);
}

// ===================================================================
// Storm (specs/06-storm.md)
// ===================================================================
const storm = { i: 0, t: 0, shrinking: false, cur: { x: 0, z: 0, r: 95 }, circles: [] };
const stormMesh = new THREE.Mesh(
  new THREE.CylinderGeometry(1, 1, 70, 72, 1, true),
  basic(0x9b4dff, { transparent: true, opacity: 0.28, side: THREE.DoubleSide, depthWrite: false }),
);
stormMesh.position.y = 30;
scene.add(stormMesh);

function resetStorm() {
  let fin;
  for (let i = 0; i < 50; i++) { fin = freeSpot(25, 40, 4); if (dist(fin.x, fin.z, 0, 0) > 22) break; }
  storm.circles = [{ x: 0, z: 0, r: 95 }];
  let prev = storm.circles[0];
  for (const ph of STORM_PHASES) {
    const maxMove = prev.r - ph.r;
    let dx = fin.x - prev.x, dz = fin.z - prev.z; const d = Math.hypot(dx, dz);
    if (d > maxMove) { dx *= maxMove / d; dz *= maxMove / d; }
    const c = { x: prev.x + dx, z: prev.z + dz, r: ph.r };
    storm.circles.push(c); prev = c;
  }
  storm.i = 0; storm.t = 0; storm.shrinking = false; storm.cur = { ...storm.circles[0] };
}
function updateStorm(dt) {
  storm.t += dt;
  if (storm.i < STORM_PHASES.length) {
    const ph = STORM_PHASES[storm.i];
    if (!storm.shrinking) {
      if (storm.t >= ph.wait) { storm.shrinking = true; storm.t = 0; }
    } else {
      const a = storm.circles[storm.i], b = storm.circles[storm.i + 1], k = Math.min(1, storm.t / ph.shrink);
      storm.cur.x = lerp(a.x, b.x, k); storm.cur.z = lerp(a.z, b.z, k); storm.cur.r = lerp(a.r, b.r, k);
      if (k >= 1) { storm.i++; storm.shrinking = false; storm.t = 0; }
    }
  }
  stormMesh.visible = storm.cur.r > 0.3;
  stormMesh.position.x = storm.cur.x; stormMesh.position.z = storm.cur.z;
  stormMesh.scale.set(Math.max(0.3, storm.cur.r), 1, Math.max(0.3, storm.cur.r));
}
const outsideStorm = (x, z) => dist(x, z, storm.cur.x, storm.cur.z) > storm.cur.r;
const stormDamage = () => STORM_PHASES[clamp(storm.shrinking ? storm.i : storm.i - 1, 0, STORM_PHASES.length - 1)].dmg;
const nextCircle = () => storm.circles[Math.min(storm.i + 1, storm.circles.length - 1)];
function stormText() {
  if (storm.i >= STORM_PHASES.length) return '🌀 Storm closed!';
  if (storm.shrinking) return '🌀 Storm shrinking!';
  return `🌀 Storm shrinks in ${fmtTime(STORM_PHASES[storm.i].wait - storm.t)}`;
}

// ===================================================================
// Bots (specs/07-bots.md)
// ===================================================================
function losBlocked(ax, az, bx, bz) {
  const dx = bx - ax, dz = bz - az, L2 = dx * dx + dz * dz || 1;
  for (const c of colliders) {
    const t = clamp(((c.x - ax) * dx + (c.z - az) * dz) / L2, 0, 1);
    if (dist(ax + dx * t, az + dz * t, c.x, c.z) < c.r * 0.9) return true;
  }
  return false;
}
function steer(b, dx, dz) {
  const len = Math.hypot(dx, dz);
  if (len < 0.01) { b.mx = b.mz = 0; return; }
  dx /= len; dz /= len;
  let ax = dx, az = dz;
  const avoid = (ox, oz, or) => {
    const vx = b.x - ox, vz = b.z - oz, d = Math.hypot(vx, vz) || 0.01, clear = or + b.radius + 1.2;
    if (d > clear + 3) return;
    if (-(vx * dx + vz * dz) / d < -0.2) return; // already moving away
    const w = clamp((clear + 3 - d) / 3, 0, 1.5);
    let tx = -vz / d, tz = vx / d;
    if (tx * dx + tz * dz < 0) { tx = -tx; tz = -tz; }
    ax += (vx / d) * w * 0.6 + tx * w * 1.2; az += (vz / d) * w * 0.6 + tz * w * 1.2;
  };
  for (const c of colliders) avoid(c.x, c.z, c.r);
  for (const l of lavaPools) avoid(l.x, l.z, l.r);
  for (const o of holes) if (o.owner !== b) avoid(o.x, o.z, 2.5);
  const r0 = Math.hypot(b.x, b.z);
  if (r0 > ISLAND_R - 8) { ax -= b.x / r0 * 1.5; az -= b.z / r0 * 1.5; }
  const l2 = Math.hypot(ax, az) || 1;
  b.mx = ax / l2; b.mz = az / l2;
}
function botThink(b, dt) {
  const ai = b.ai;
  ai.think -= dt;
  if (ai.think <= 0) {
    ai.think = rand(0.25, 0.4);
    let best = null, bd = T < GRACE ? 0 : diff.sight;
    for (const e of heroes) {
      if (e === b || !e.alive || e.invisible) continue;
      const d = dist(b.x, b.z, e.x, e.z);
      if (d < bd) { bd = d; best = e; }
    }
    if (best !== ai.target) { ai.target = best; ai.react = T + diff.react; }
    ai.goal = null;
    if (!best || b.hp < b.maxHp * 0.4) {
      let pd = 25;
      for (const p of pickups) {
        if (!p.active) continue;
        const d = dist(b.x, b.z, p.x, p.z) - (p.type === 'health' && b.hp < b.maxHp * 0.6 ? 10 : 0);
        if (d < pd) { pd = d; ai.goal = p; }
      }
    }
    // stuck? pick somewhere new
    if (dist(b.x, b.z, ai.lx, ai.lz) < 0.3 && (b.mx || b.mz)) { ai.stuckT += 0.3; if (ai.stuckT > 1) { ai.wander = null; ai.strafe *= -1; ai.stuckT = 0; } }
    else ai.stuckT = 0;
    ai.lx = b.x; ai.lz = b.z;
  }
  const t = ai.target && ai.target.alive && !ai.target.invisible ? ai.target : null;
  if (!t) ai.target = null;

  let dx = 0, dz = 0;
  const sc = storm.cur, nc = nextCircle();
  const stormEdge = dist(b.x, b.z, sc.x, sc.z) > sc.r - 4;
  if (b.fearUntil > T) {
    dx = b.x - b.fearX; dz = b.z - b.fearZ;
  } else if (stormEdge) {
    dx = nc.x - b.x; dz = nc.z - b.z;
  } else if (t) {
    const ex = t.x - b.x, ez = t.z - b.z, d = Math.hypot(ex, ez) || 1, pref = b.def.prefRange;
    const ux = ex / d, uz = ez / d;
    const want = d > pref + 1.5 ? 1 : d < pref - 1.5 ? -1 : 0;
    ai.strafeT -= dt;
    if (ai.strafeT <= 0) { ai.strafe *= -1; ai.strafeT = rand(0.8, 2); }
    dx = ux * want + uz * ai.strafe * 0.8; dz = uz * want - ux * ai.strafe * 0.8;
  } else if (ai.goal && ai.goal.active) {
    dx = ai.goal.x - b.x; dz = ai.goal.z - b.z;
  } else {
    if (!ai.wander || dist(b.x, b.z, ai.wander.x, ai.wander.z) < 3 || dist(ai.wander.x, ai.wander.z, nc.x, nc.z) > nc.r) {
      ai.wander = freeSpot(0, Math.max(4, nc.r * 0.8), 2, Math.random, nc.x, nc.z);
    }
    dx = ai.wander.x - b.x; dz = ai.wander.z - b.z;
  }
  steer(b, dx, dz);

  // facing
  let want = b.yaw;
  if (t) want = Math.atan2(t.x - b.x, t.z - b.z);
  else if (b.mx || b.mz) want = Math.atan2(b.mx, b.mz);
  const turn = (b.lasering ? 1.4 : 9) * dt;
  b.yaw += clamp(angDiff(b.yaw, want), -turn, turn);

  // attack / super (no fighting during the landing grace period)
  if (b.key === 'pete' && b.superCharge >= 100 && b.hp < b.maxHp * 0.5 && T > GRACE) useSuper(b, b.yaw);
  if (b.key === 'fluff' && t && b.superCharge >= 100 && b.hp < b.maxHp * 0.5 && T > GRACE) useSuper(b, want); // hide behind a wall
  if (t && T > GRACE && T > ai.react && !b.dashing && !b.frozen && b.fearUntil <= T) {
    const d = dist(b.x, b.z, t.x, t.z);
    const los = ['boomer', 'barf', 'chomp', 'boo', 'inky', 'twister'].includes(b.key) || !losBlocked(b.x, b.z, t.x, t.z);
    const aimed = Math.abs(angDiff(b.yaw, want)) < 0.5;
    if (los && aimed && b.superCharge >= 100 && d <= b.def.superRange && b.key !== 'fluff' && (b.key !== 'boomer' || !losBlocked(b.x, b.z, t.x, t.z))) {
      useSuper(b, want + rand(-1, 1) * diff.aim * 0.5);
    } else if (los && aimed && d <= b.def.range * 0.95 + t.radius) {
      attack(b, want + rand(-1, 1) * (diff.aim + (b.inkUntil > T ? 0.5 : 0)), d);
    }
  }
}

// ===================================================================
// Input & camera (specs/08-controls-and-hud.md)
// ===================================================================
const keys = {};
let mouseDown = false, camPitch = 0.22, shake = 0, hurt = 0;
let state = 'menu';   // menu | play | paused | ending | end
let locked = false;

const canvas = renderer.domElement;
const requestLock = () => { if (touchMode) return; try { const r = canvas.requestPointerLock(); if (r && r.catch) r.catch(() => {}); } catch (e) { /* not supported */ } };
document.addEventListener('pointerlockchange', () => {
  locked = document.pointerLockElement === canvas;
  if (!locked && state === 'play' && !touchMode) pause();
});
window.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT') return; // typing a name
  setTouchMode(false);
  keys[e.code] = true;
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
  if (state !== 'play' || !player || !player.alive) return;
  if (e.code === 'KeyE') doSuper();
  if (e.code === 'Space') doJump();
  if (e.code === 'Escape' && !locked) pause();
});
function doSuper() { // a guest shows its own super straight away; the host makes it count
  if (useSuper(player, player.yaw) && !auth) player.supLock = T + 0.6;
  if (net && !net.host) { net.su++; sendInput(); }
}
function doJump() {
  if (player.y !== 0) return;
  player.vy = 9;
  if (net && !net.host) { net.ju++; sendInput(); }
}
window.addEventListener('keyup', (e) => { keys[e.code] = false; });
window.addEventListener('blur', () => { for (const k in keys) keys[k] = false; mouseDown = false; });
document.addEventListener('mousemove', (e) => {
  if (state !== 'play' || !locked || !player) return;
  player.yaw -= e.movementX * 0.0025;
  camPitch = clamp(camPitch + e.movementY * 0.002, -0.05, 0.6);
});
canvas.addEventListener('mousedown', (e) => {
  if (e.button !== 0 || touchMode) return;
  mouseDown = true;
  if (state === 'play' && !locked) requestLock();
});
window.addEventListener('mouseup', (e) => { if (e.button === 0) mouseDown = false; });

// ===================================================================
// Touch controls for phones and tablets (specs/08-controls-and-hud.md)
// ===================================================================
let touchMode = false;
const stick = { id: null, ox: 0, oy: 0, f: 0, s: 0 };   // left thumb joystick
const aims = new Map();                                 // fingers turning the hero: pointerId -> last x, y
let fireId = null;
const STICK_R = 60;

function setTouchMode(on) {
  if (on === touchMode) return;
  touchMode = on;
  document.body.classList.toggle('touch', on);
  if (on && document.pointerLockElement) document.exitPointerLock();
  if (!on) releaseTouches();
  $('resume').textContent = on ? '▶ Tap to resume' : '▶ Click to resume';
  checkOrientation();
}
function releaseTouches() {
  stick.id = null; stick.f = stick.s = 0;
  aims.clear();
  if (fireId !== null) { fireId = null; mouseDown = false; }
  $('stick').classList.remove('held');
  for (const b of document.querySelectorAll('.tbtn')) b.classList.remove('down');
}
// the first touch anywhere switches touch controls on; moving a real mouse switches them off
window.addEventListener('pointerdown', (e) => {
  if (e.pointerType !== 'touch' || touchMode) return;
  setTouchMode(true);
  if (state === 'play') padDown(e); // the touch pad wasn't showing yet, so pass this first touch on to it
}, true);
window.addEventListener('pointermove', (e) => { if (e.pointerType === 'mouse' && (e.movementX || e.movementY)) setTouchMode(false); });

function moveStick(x, y) {
  let dx = x - stick.ox, dy = y - stick.oy;
  const d = Math.hypot(dx, dy);
  if (d > STICK_R) { dx *= STICK_R / d; dy *= STICK_R / d; }
  $('knob').style.transform = `translate(${dx}px, ${dy}px)`;
  const m = Math.min(1, d / (STICK_R * 0.85));                 // full speed near the edge
  const a = d > STICK_R * 0.15 ? m / (d || 1) : 0;             // small dead zone in the middle
  stick.s = (x - stick.ox) * a; stick.f = -(y - stick.oy) * a;
}
function turnBy(dx, dy) {
  if (!player || state !== 'play') return;
  player.yaw -= dx * 0.006;
  camPitch = clamp(camPitch + dy * 0.004, -0.05, 0.6);
}

function padDown(e) {
  e.preventDefault();
  if (state !== 'play' || !player) return;
  const btn = e.target.closest('.tbtn');
  if (btn) {
    btn.classList.add('down');
    if (btn.id === 'tpause') { releaseTouches(); pause(); return; }
    if (!player.alive) return;
    if (btn.id === 'tsuper') doSuper();
    if (btn.id === 'tjump') doJump();
    if (btn.id === 'tfire') { fireId = e.pointerId; mouseDown = true; aims.set(e.pointerId, [e.clientX, e.clientY]); }
    try { btn.setPointerCapture(e.pointerId); } catch (err) { /* old browser */ }
    return;
  }
  if (e.clientX < window.innerWidth / 2) {
    if (stick.id !== null) return;
    stick.id = e.pointerId; stick.ox = e.clientX; stick.oy = e.clientY; stick.f = stick.s = 0;
    const el = $('stick');
    el.style.left = `${e.clientX}px`; el.style.top = `${e.clientY}px`; el.style.bottom = 'auto';
    el.classList.add('held');
    $('knob').style.transform = '';
  } else aims.set(e.pointerId, [e.clientX, e.clientY]);
  try { $('touch').setPointerCapture(e.pointerId); } catch (err) { /* old browser */ }
}
function buildTouch() {
  const pad = $('touch');
  pad.addEventListener('contextmenu', (e) => e.preventDefault());
  pad.addEventListener('pointerdown', padDown);
  const move = (e) => {
    if (e.pointerId === stick.id) { moveStick(e.clientX, e.clientY); return; }
    const last = aims.get(e.pointerId);
    if (!last) return;
    turnBy(e.clientX - last[0], e.clientY - last[1]);
    last[0] = e.clientX; last[1] = e.clientY;
  };
  const up = (e) => {
    const btn = e.target.closest && e.target.closest('.tbtn');
    if (btn) btn.classList.remove('down');
    if (e.pointerId === stick.id) {
      stick.id = null; stick.f = stick.s = 0;
      const el = $('stick');
      el.classList.remove('held'); el.style.left = el.style.top = el.style.bottom = '';
      $('knob').style.transform = '';
    }
    if (e.pointerId === fireId) { fireId = null; mouseDown = false; $('tfire').classList.remove('down'); }
    aims.delete(e.pointerId);
  };
  // on the window, so a finger is still followed if it slides off the pad
  window.addEventListener('pointermove', move);
  window.addEventListener('pointerup', up);
  window.addEventListener('pointercancel', up);
}

// phones and tablets play sideways only
function checkOrientation() {
  const upright = touchMode && window.innerHeight > window.innerWidth;
  $('rotate').classList.toggle('hidden', !upright);
  if (upright && state === 'play') { releaseTouches(); pause(); }
}
window.addEventListener('resize', checkOrientation);
// at the start of a touch match: go fullscreen and lock sideways where the browser allows it (iPhones don't)
function goFullscreen() {
  if (!touchMode) return;
  try {
    const el = document.documentElement;
    const p = !document.fullscreenElement && el.requestFullscreen && el.requestFullscreen({ navigationUI: 'hide' });
    Promise.resolve(p).then(() => screen.orientation && screen.orientation.lock && screen.orientation.lock('landscape')).catch(() => {});
  } catch (e) { /* not supported */ }
}

const boomerAimDist = () => clamp(18 - (camPitch - 0.05) * 25, 5, 18);

function playerInput(dt) {
  const h = player;
  if (!h.alive) { h.mx = h.mz = 0; return; }
  if (keys.ArrowLeft) h.yaw += 2.6 * dt;
  if (keys.ArrowRight) h.yaw -= 2.6 * dt;
  let f = 0, s = 0;
  if (keys.KeyW || keys.ArrowUp) f += 1;
  if (keys.KeyS || keys.ArrowDown) f -= 1;
  if (keys.KeyD) s += 1;
  if (keys.KeyA) s -= 1;
  if (stick.id !== null) { f += stick.f; s += stick.s; }
  const fx = Math.sin(h.yaw), fz = Math.cos(h.yaw), rx = -fz, rz = fx;
  let mx = fx * f + rx * s, mz = fz * f + rz * s;
  const l = Math.hypot(mx, mz), k = l > 1 ? 1 / l : 1; // the joystick can go slower than full speed
  h.mx = mx * k; h.mz = mz * k;
  if (h.fearUntil > T) { // scared by Boo: run away, no attacking
    const dx = h.x - h.fearX, dz = h.z - h.fearZ, d = Math.hypot(dx, dz) || 1;
    h.mx = dx / d; h.mz = dz / d;
    return;
  }
  if (mouseDown) attack(h, h.yaw, boomerAimDist());
}

const aimRing = new THREE.Mesh(new THREE.RingGeometry(3.1, 3.5, 32), basic(0xffd23f, { transparent: true, opacity: 0.6, depthWrite: false }));
aimRing.rotation.x = -Math.PI / 2; aimRing.visible = false; scene.add(aimRing);

const camTarget = new THREE.Vector3(), camLook = new THREE.Vector3();
function updateCamera(dt) {
  if (!player) {
    const a = performance.now() * 0.00005;
    camera.position.set(Math.cos(a) * 75, 32, Math.sin(a) * 75);
    camera.lookAt(0, 10, 0);
    return;
  }
  const h = viewHero(), s = h.def.scale;
  if (h.dance) {
    // swing round to the front of the dancing hero and sway gently
    const a = h.yaw + Math.sin(h.danceT * 0.5) * 0.5, d = 6.5 * s;
    camTarget.set(h.x + Math.sin(a) * d, h.y + 2.6 * s, h.z + Math.cos(a) * d);
    camera.position.lerp(camTarget, 1 - Math.exp(-4 * dt));
    camera.lookAt(h.x, h.y + 0.9 * s, h.z);
    aimRing.visible = false;
    return;
  }
  const fx = Math.sin(h.yaw), fz = Math.cos(h.yaw), rx = -fz, rz = fx;
  const d = 7.5 * s, p = camPitch;
  camTarget.set(h.x - fx * d * Math.cos(p) + rx * 1.1, h.y + 2.4 * s + d * Math.sin(p) + 0.6, h.z - fz * d * Math.cos(p) + rz * 1.1);
  camera.position.lerp(camTarget, 1 - Math.exp(-14 * dt));
  camLook.set(h.x + fx * 8 + rx * 1.1, h.y + 2.2 * s, h.z + fz * 8 + rz * 1.1);
  if (shake > 0) {
    camera.position.x += rand(-1, 1) * shake * 0.5; camera.position.y += rand(-1, 1) * shake * 0.5;
    shake = Math.max(0, shake - dt * 2);
  }
  camera.lookAt(camLook);

  aimRing.visible = h === player && h.key === 'boomer' && h.alive && state === 'play';
  if (aimRing.visible) { const ad = boomerAimDist() + 0.8; aimRing.position.set(h.x + fx * ad, 0.1, h.z + fz * ad); }
}

// ===================================================================
// HUD
// ===================================================================
const setText = (el, v) => { if (el._v !== v) { el._v = v; el.textContent = v; } };
const tmpV = new THREE.Vector3();
const floats = [];
function floatNum(h, text, color) {
  const el = document.createElement('div'); el.className = 'dmg'; el.textContent = text; el.style.color = color;
  $('tags').appendChild(el);
  floats.push({ el, x: h.x + rand(-0.5, 0.5), y: h.headY + 1.2, z: h.z + rand(-0.5, 0.5), t: 0 });
}
let popupT = 0, inkT = 0;
function inkSplat() {
  let html = '';
  for (let i = 0; i < 7; i++) {
    const sz = rand(120, 300);
    html += `<div class="blob" style="left:${rand(-5, 85)}%;top:${rand(-5, 75)}%;width:${sz}px;height:${sz * rand(0.7, 1.1)}px"></div>`;
  }
  $('ink').innerHTML = html; inkT = 2; sfx('splat');
}
// "heroes left" banner (specs/08-controls-and-hud.md)
const BANNER_AT = [5, 3, 2];
let bannerShown = new Set();
function leftBanner() {
  if (state !== 'play' || !player || !player.alive) return;
  const n = heroes.filter((e) => e.alive).length;
  if (n < 2 || !BANNER_AT.some((t) => n <= t && !bannerShown.has(t))) return;
  for (const t of BANNER_AT) if (n <= t) bannerShown.add(t);
  const el = $('banner');
  el.textContent = n === 2 ? '⚔️ FINAL 2!' : n === 3 ? '⚠️ 3 LEFT!' : `🔥 ${n} LEFT!`;
  el.classList.remove('show'); void el.offsetWidth; el.classList.add('show');
  SFX.alert();
}
function popup(text) { const el = $('popup'); el.textContent = text; el.style.opacity = 1; popupT = 1.4; }
function feed(text) {
  const el = document.createElement('div'); el.textContent = text; $('feed').prepend(el);
  while ($('feed').children.length > 5) $('feed').lastChild.remove();
  setTimeout(() => el.remove(), 6000);
}
function project(x, y, z) {
  tmpV.set(x, y, z).project(camera);
  return { x: (tmpV.x + 1) / 2 * window.innerWidth, y: (1 - tmpV.y) / 2 * window.innerHeight, on: tmpV.z < 1 };
}

const mm = $('minimap').getContext('2d');
function drawMinimap() {
  const S = 80 / 96, c = 80, X = (x) => c - x * S, Y = (z) => c - z * S;
  mm.clearRect(0, 0, 160, 160);
  const col = world.mm;
  mm.fillStyle = col.ground; mm.beginPath(); mm.arc(c, c, ISLAND_R * S, 0, TAU); mm.fill();
  mm.fillStyle = col.pool;
  for (const l of lavaPools) { mm.beginPath(); mm.arc(X(l.x), Y(l.z), l.r * S, 0, TAU); mm.fill(); }
  mm.fillStyle = col.center; mm.beginPath(); mm.arc(c, c, colliders.find((o) => o.kind === 'center').r * S, 0, TAU); mm.fill();
  mm.fillStyle = col.pad;
  for (const p of pads) { mm.beginPath(); mm.arc(X(p.x), Y(p.z), 3, 0, TAU); mm.fill(); }
  mm.fillStyle = col.dot; mm.beginPath(); mm.arc(c, c, 4 * S, 0, TAU); mm.fill();
  // storm: purple outside the circle
  mm.save();
  mm.beginPath(); mm.rect(0, 0, 160, 160); mm.arc(X(storm.cur.x), Y(storm.cur.z), Math.max(0, storm.cur.r) * S, 0, TAU, true);
  mm.fillStyle = 'rgba(155,77,255,0.45)'; mm.fill('evenodd');
  mm.restore();
  const nc = nextCircle();
  if (storm.i < STORM_PHASES.length) { mm.strokeStyle = '#ffffff'; mm.lineWidth = 1.5; mm.beginPath(); mm.arc(X(nc.x), Y(nc.z), Math.max(0.5, nc.r * S), 0, TAU); mm.stroke(); }
  // player arrow
  const h = viewHero(), px = X(h.x), py = Y(h.z), dx = -Math.sin(h.yaw), dy = -Math.cos(h.yaw);
  mm.fillStyle = '#ffd23f'; mm.strokeStyle = '#000'; mm.lineWidth = 1.5;
  mm.beginPath(); mm.moveTo(px + dx * 8, py + dy * 8); mm.lineTo(px - dx * 5 + dy * 5, py - dy * 5 - dx * 5); mm.lineTo(px - dx * 5 - dy * 5, py - dy * 5 + dx * 5); mm.closePath(); mm.fill(); mm.stroke();
}

function updateHUD(dt) {
  const h = player;
  $('hud').classList.toggle('watching', viewHero() !== player);
  $('hpfill').style.transform = `scaleX(${Math.max(0, h.hp / h.maxHp)})`;
  setText($('hptxt'), `${Math.ceil(Math.max(0, h.hp))} / ${h.maxHp}`);
  $('superfill').style.transform = `scaleX(${h.superCharge / 100})`;
  const ready = h.superCharge >= 100;
  setText($('supertxt'), h.lasering ? '🍃 LEAF LASER!' : h.shielded ? '🧱 BRICK FORT!' : h.key === 'marshy' && h.grown ? '🍡 GIANT MARSHY!' : ready ? (touchMode ? '⭐ SUPER READY: tap ⭐' : '⭐ SUPER READY: press E') : `Super ${Math.floor(h.superCharge)}%`);
  $('superbar').classList.toggle('ready', ready);
  $('tsuper').classList.toggle('ready', ready && h.alive);
  setText($('heroname'), `${playerName} · ${h.def.emoji} ${h.def.name}`);
  const fx = [['strength', '💪'], ['speed', '⚡'], ['invis', '🧥']].filter(([k]) => h.has(k)).map(([k, ic]) => `<span class="fx">${ic} ${Math.ceil(h.fx[k] - T)}</span>`).join('');
  if ($('effects')._v !== fx) { $('effects')._v = fx; $('effects').innerHTML = fx; }
  setText($('alive'), `🧍 ${heroes.filter((e) => e.alive).length} left`);
  setText($('stormtxt'), T < GRACE ? `🪂 Landing… fighting starts in ${Math.ceil(GRACE - T)}` : stormText());
  const inStorm = h.alive && outsideStorm(h.x, h.z), lava = h.alive && h.y < 0.3 && inLava(h.x, h.z);
  setText($('warn'), inStorm ? '🌀 You\'re in the storm! Get to the safe zone!' : lava ? world.poolWarn : '');
  $('stormfx').style.opacity = inStorm ? 1 : 0;
  hurt = Math.max(0, hurt - dt * 2.5);
  $('redflash').style.boxShadow = `inset 0 0 140px rgba(255,0,0,${(hurt * 0.8).toFixed(2)})`;
  inkT = Math.max(0, inkT - dt);
  $('ink').style.opacity = Math.min(1, inkT / 0.8);
  if (popupT > 0) { popupT -= dt; if (popupT <= 0) $('popup').style.opacity = 0; }
  drawMinimap();

  // name tags over bots
  for (const e of heroes) {
    if (!e.tag) continue;
    const show = e.alive && !e.invisible && dist(e.x, e.z, camera.position.x, camera.position.z) < 55;
    if (!show) { e.tag.style.display = 'none'; continue; }
    const p = project(e.x, e.headY + 1.1 * e.def.scale, e.z);
    if (!p.on) { e.tag.style.display = 'none'; continue; }
    e.tag.style.display = '';
    e.tag.style.left = `${p.x}px`; e.tag.style.top = `${p.y}px`;
    e.tagFill.style.width = `${Math.max(0, e.hp / e.maxHp) * 100}%`;
  }
  // floating damage numbers
  for (let i = floats.length - 1; i >= 0; i--) {
    const f = floats[i]; f.t += dt; f.y += dt * 1.5;
    const p = project(f.x, f.y, f.z);
    f.el.style.left = `${p.x}px`; f.el.style.top = `${p.y}px`;
    f.el.style.opacity = Math.max(0, 1 - f.t / 0.9); f.el.style.display = p.on ? '' : 'none';
    if (f.t > 0.9) { f.el.remove(); floats.splice(i, 1); }
  }
}

// ===================================================================
// Match flow & screens (specs/02-gameplay.md, 09-screens-and-audio.md)
// ===================================================================
let chosenHero = 'brickster';
let chosenDiff = 'normal';
let chosenWorld = 'lava';

// players & their wins/unlocks (specs/12-wins-and-unlocks.md, 13-players.md), saved in this browser
const PROFILES_KEY = 'bloknite.profiles.v1'; // old name kept so saved players aren't lost
const LEGACY_KEY = 'bloknite.save.v1'; // shared wins from before profiles existed
const newRecord = () => ({ wins: 0, games: 0, elims: 0 });
const profiles = { current: null, players: {} };
try { Object.assign(profiles, JSON.parse(localStorage.getItem(PROFILES_KEY) || '{}')); } catch (e) { /* storage blocked */ }
let playerName = profiles.players[profiles.current] ? profiles.current : null;
let save = playerName ? profiles.players[playerName] : newRecord();
function storeSave() { try { localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles)); } catch (e) { /* storage blocked */ } }
// online high scores (specs/14-online-and-high-scores.md): only when served from a web address
const ONLINE = location.protocol === 'http:' || location.protocol === 'https:';
async function api(path, body) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000);
  try {
    const res = await fetch(path, body
      ? { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body), signal: ctrl.signal }
      : { signal: ctrl.signal });
    const data = await res.json().catch(() => ({}));
    return res.ok ? data : { error: data.error || 'server_error' };
  } catch (e) {
    return { error: 'offline' };
  } finally { clearTimeout(timer); }
}
const NAME_ERRORS = {
  invalid: 'Names need 2–12 letters or numbers.',
  bad_word: "Let's pick a different name 🙂",
  taken: 'That name is taken online. Try another, like {name}7',
  too_many: 'Too many new names right now. Try again later.',
};
// joins the online high score list; returns '' when fine (or offline), or a message to show
async function registerOnline(rec, name) {
  if (!ONLINE || rec.id) return '';
  const r = await api('/api/register', { name });
  if (r.id) { rec.id = r.id; rec.token = r.token; rec.onlineError = ''; storeSave(); return ''; }
  if (r.error === 'offline' || r.error === 'server_error') return '';
  rec.onlineError = r.error; storeSave();
  return (NAME_ERRORS[r.error] || 'Something went wrong. Try again.').replace('{name}', name);
}
let loggingIn = false;
// ?room=LAVA-42 joins that room straight away (specs/15-multiplayer.md)
let pendingRoom = ONLINE ? new URLSearchParams(location.search).get('room') : null;
async function login(raw) {
  if (loggingIn) return false;
  const check = checkName(raw);
  if (!check.ok) { nameMsg(NAME_ERRORS[check.reason]); return false; }
  let name = check.name;
  const existing = Object.keys(profiles.players).find((k) => k.toLowerCase() === name.toLowerCase());
  if (existing) name = existing;
  else if (ONLINE) { // a new name must be free online before we keep it
    loggingIn = true; nameMsg('Checking name…', true);
    const rec = newRecord();
    const msg = await registerOnline(rec, name);
    loggingIn = false;
    if (msg) { nameMsg(msg); return false; }
    profiles.players[name] = rec;
  }
  if (!profiles.players[name]) {
    const first = Object.keys(profiles.players).length === 0;
    profiles.players[name] = newRecord();
    if (first) { // the first player inherits any wins saved before profiles existed
      try {
        const old = JSON.parse(localStorage.getItem(LEGACY_KEY) || 'null');
        if (old) { Object.assign(profiles.players[name], { wins: old.wins || 0, games: old.games || 0, elims: old.elims || 0 }); localStorage.removeItem(LEGACY_KEY); }
      } catch (e) { /* storage blocked */ }
    }
  }
  profiles.current = name; playerName = name; save = profiles.players[name];
  storeSave();
  showMenu();
  if (ONLINE && !save.id && !save.onlineError) registerOnline(save, name).then(() => { if (state === 'menu') renderCards(); }); // older local profile
  if (pendingRoom) { const code = pendingRoom; pendingRoom = null; showJoin(code); joinRoom(code); }
  return true;
}
function nameMsg(text, calm) { const el = $('namemsg'); el.textContent = text || ''; el.classList.toggle('calm', !!calm); }
if (playerName && new URLSearchParams(location.search).has('resetwins')) { Object.assign(save, newRecord()); storeSave(); }
const isUnlocked = (k) => save.wins >= (HEROES[k].unlockAt || 0);
const isRevealed = (k) => save.wins >= (HEROES[k].reveal || 0);
const REVEAL_MSG = { 4: '🤫 4 SECRET HEROES REVEALED!', 8: '🍬 8 CANDY HEROES REVEALED!' };
const isWorldOpen = (k) => save.wins >= (WORLDS[k].unlockAt || 0);

function clearMatch() {
  for (const h of heroes) h.dispose();
  heroes = []; player = null;
  for (const p of projectiles) scene.remove(p.mesh);
  projectiles.length = 0;
  for (const p of pickups) scene.remove(p.sprite, p.ring);
  pickups = [];
  for (const z of zones) scene.remove(z.mesh);
  zones = [];
  for (const t of tornados) scene.remove(t.mesh);
  tornados = [];
  for (const o of holes) scene.remove(o.mesh);
  holes = [];
  for (const k of strikes) scene.remove(k.ring, k.bolt);
  strikes = [];
  for (const g of gummies) scene.remove(g.mesh);
  gummies = [];
  for (const w of walls) removeWall(w);
  walls = [];
  inkT = 0; $('ink').style.opacity = 0;
  bannerShown = new Set(); $('banner').classList.remove('show'); $('hud').classList.remove('dancing');
  clearParticles();
  for (const f of floats) f.el.remove();
  floats.length = 0;
  $('tags').innerHTML = ''; $('feed').innerHTML = '';
  watch = null; $('hud').classList.remove('watching');
  if (net) Object.assign(net, { snaps: [], evq: [], hist: [], corr: null, events: [], notes: {} });
}

// solo, or the host of an online match: real players first, then bots fill up to 10 heroes
function startMatch() {
  if (net && !net.host) return;
  const humans = net ? net.roster.map((p) => ({ key: HEROES[p.hero] ? p.hero : 'brickster', name: p.name, pid: p.pid }))
    : [{ key: chosenHero, name: playerName, pid: 0 }];
  const pool = HERO_KEYS.filter(isRevealed);
  const botKeys = shuffle([...pool, ...pool, ...pool]).slice(0, Math.max(0, 10 - humans.length));
  const taken = humans.map((p) => p.name.toLowerCase());
  const names = shuffle(BOT_NAMES.filter((n) => !taken.includes(n.toLowerCase())));
  const list = [...humans, ...botKeys.map((k, i) => ({ key: k, name: names[i], pid: null }))];

  if (!isWorldOpen(chosenWorld) && !auto) chosenWorld = 'lava';
  setWorld(chosenWorld);
  const off = rand(0, TAU);
  const pos = list.map((_, i) => {
    const a = off + (i / list.length) * TAU;
    let x = Math.cos(a) * 60, z = Math.sin(a) * 60;
    if (!isFree(x, z, 2)) { const s = freeSpot(0, 6, 2, Math.random, x, z); x = s.x; z = s.z; }
    return [r2(x), r2(z)];
  });
  resetStorm();
  const pk = [];
  for (let i = 0; i < 24; i++) { const s = freeSpot(20, ISLAND_R - 6, 1.5); pk.push([i % 4, r2(s.x), r2(s.z), 1, 0]); }

  const setup = { heroes: list, pos, storm: storm.circles, pk, diff: chosenDiff, world: chosenWorld };
  if (net) netSend({ t: 'start', ...setup });
  beginMatch(setup);
}
// everyone (solo, host and guests) builds the match from the same setup
function beginMatch(setup) {
  clearMatch();
  setWorld(setup.world);
  const a = audio(); if (a && a.state === 'suspended') a.resume();
  T = 0; shake = 0; hurt = 0; camPitch = 0.22;
  diff = DIFFS[setup.diff] || DIFFS.normal;
  auth = !net || net.host;
  storm.circles = setup.storm.map((c) => ({ ...c }));
  storm.i = 0; storm.t = 0; storm.shrinking = false; storm.cur = { ...storm.circles[0] };
  const me = net ? net.pid : 0;
  setup.heroes.forEach((d, i) => {
    const mine = d.pid === me;
    const h = new Hero(d.key, mine, d.name, { id: i, pid: d.pid, puppet: !auth && !mine });
    const [x, z] = setup.pos[i];
    h.x = x; h.z = z; h.yaw = Math.atan2(-x, -z);
    h.root.position.set(x, 0, z);
    heroes.push(h);
    if (mine) player = h;
  });
  syncPickups(setup.pk);
  updateStorm(0);
  if (net) Object.assign(net, { live: true, over: false, su: 0, ju: 0, snapT: 0, hitT: 0, inT: 0 });

  camera.position.set(player.x, 10, player.z);
  for (const id of ['menu', 'end', 'pause', 'lobby', 'join', 'notice']) $(id).classList.add('hidden');
  $('hud').classList.remove('hidden');
  state = 'play';
  requestLock();
  goFullscreen();
  checkOrientation();
  popup(auth || touchMode ? `${world.emoji} Good luck, ${playerName}!` : `${world.emoji} Good luck, ${playerName}! Click to aim`);
}
const PICKUP_KEYS = Object.keys(PICKUP_TYPES);
const pickupList = () => pickups.map((p) => [PICKUP_KEYS.indexOf(p.type), r2(p.x), r2(p.z), p.active ? 1 : 0, p.temp ? 1 : 0]);
function syncPickups(list) {
  while (pickups.length > list.length) { const p = pickups.pop(); scene.remove(p.sprite, p.ring); }
  list.forEach(([ti, x, z, active, temp], i) => {
    const type = PICKUP_KEYS[ti] || 'health';
    let p = pickups[i];
    if (!p) { spawnPickup(type, x, z, !!temp); p = pickups[i]; }
    else if (p.type !== type) { p.type = type; p.sprite.material = spriteMats[type]; p.ring.material = ringMats[type]; }
    p.temp = !!temp;
    placePickup(p, x, z);
    if (!active) { p.active = false; p.sprite.visible = p.ring.visible = false; }
  });
  pickupsDirty = false;
}

function pause() {
  if (state !== 'play') return;
  state = 'paused'; mouseDown = false;
  releaseTouches();
  // online there's no pausing: the match keeps going behind this menu
  $('pause').classList.toggle('online', !!net);
  $('pausetitle').textContent = net ? 'MENU' : 'PAUSED';
  $('pausesub').textContent = net ? 'The match keeps going! Your hero is standing still.' : `Take a break, ${playerName}`;
  $('quit').textContent = net ? 'Leave match' : 'Quit to menu';
  $('pause').classList.remove('hidden');
}
function resume() {
  if (touchMode && window.innerHeight > window.innerWidth) return; // turn sideways first
  $('pause').classList.add('hidden');
  state = 'play';
  requestLock();
  goFullscreen();
}
function showLogin() {
  showMenu();
  $('menu').classList.add('hidden');
  const list = $('players');
  list.innerHTML = '';
  for (const n of Object.keys(profiles.players)) {
    const b = document.createElement('button');
    b.className = 'pill player-btn';
    b.textContent = `👤 ${n} · 🏆 ${profiles.players[n].wins}`;
    b.addEventListener('click', () => login(n));
    list.appendChild(b);
  }
  $('pickhint').classList.toggle('hidden', !list.children.length);
  $('nameinput').value = ''; nameMsg('');
  $('login').classList.remove('hidden');
  setTimeout(() => $('nameinput').focus(), 50);
}
function showMenu() {
  leaveRoom();
  for (const id of ['login', 'scores', 'lobby', 'join', 'notice']) $(id).classList.add('hidden');
  clearMatch();
  if (!isWorldOpen(chosenWorld)) chosenWorld = 'lava';
  setWorld(chosenWorld);
  renderCards();
  state = 'menu';
  if (document.pointerLockElement) document.exitPointerLock();
  $('hud').classList.add('hidden'); $('end').classList.add('hidden'); $('pause').classList.add('hidden');
  $('menu').classList.remove('hidden');
}

function checkEnd(dead, place) {
  const alive = heroes.filter((h) => h.alive);
  if (!net) {
    if (state !== 'play' && state !== 'paused') return;
    if (!player.alive) endMatch(false, alive.length + 1);
    else if (alive.length === 1) endMatch(true, 1);
    return;
  }
  // online host: you can be out while the match goes on for everyone else
  if (dead === player) endMatch(false, place);
  if (alive.length <= 1 && net.live) {
    const w = alive[0];
    emit(['w', w ? w.id : -1, w ? w.kills : 0]);
    sendSnapshot();
    if (w === player) endMatch(true, 1);
    matchOver(w);
  }
}
function endMatch(won, place) {
  if (state !== 'play' && state !== 'paused') return;
  state = 'ending'; mouseDown = false;
  releaseTouches();
  if (won) startDance(player);
  save.games++; save.elims += player.kills;
  if (won) save.wins++;
  storeSave();
  if (ONLINE && save.id) postResult(won ? 1 : place, player.kills, player.key);
  else $('scoremsg').textContent = '';
  const unlockedNow = won ? HERO_KEYS.find((k) => HEROES[k].unlockAt === save.wins) : null;
  const next = MENU_KEYS.find((k) => !isUnlocked(k) && isRevealed(k));
  const left = next ? HEROES[next].unlockAt - save.wins : 0;
  $('unlockmsg').innerHTML = unlockedNow
    ? `🎉 ${playerName} unlocked ${HEROES[unlockedNow].emoji} ${HEROES[unlockedNow].name}!`
    : next ? `🏆 Wins: ${save.wins} · next hero in ${left} win${left === 1 ? '' : 's'}!` : `🏆 Total wins: ${save.wins}`;
  if (won && REVEAL_MSG[save.wins]) $('unlockmsg').innerHTML += `<br>${REVEAL_MSG[save.wins]}`;
  const newWorld = won ? WORLD_KEYS.find((k) => WORLDS[k].unlockAt === save.wins) : null;
  if (newWorld) $('unlockmsg').innerHTML += `<br>${WORLDS[newWorld].emoji} NEW WORLD UNLOCKED: ${WORLDS[newWorld].name.toUpperCase()}!`;
  $('unlockmsg').classList.toggle('big', !!(unlockedNow || newWorld));
  setTimeout(() => {
    if (state !== 'ending') return;
    state = 'end';
    if (document.pointerLockElement) document.exitPointerLock();
    $('pause').classList.add('hidden');
    $('popup').style.opacity = 0; popupT = 0;
    $('end').classList.toggle('win', won || !!net); // online: see-through, so you can watch the match
    renderEndButtons();
    $('endtitle').textContent = won ? '🏆 YOU WON!' : 'ELIMINATED';
    const k = player.kills;
    $('endsub').textContent = won
      ? `Great job, ${playerName}! Last one standing with ${k} elimination${k === 1 ? '' : 's'} as ${player.def.name}.`
      : `${playerName} placed #${place} · ${k} elimination${k === 1 ? '' : 's'}`;
    $('end').classList.remove('hidden');
    renderCards();
    SFX[won ? 'win' : 'lose']();
  }, won ? 2500 : 1800);
}

async function postResult(place, elims, hero) {
  const el = $('scoremsg');
  el.textContent = '⭐ Sending score…';
  const r = await api('/api/match', { id: save.id, token: save.token, place, elims, hero });
  if (r.error) { el.textContent = r.error === 'offline' ? '⚠️ Could not reach the high score server' : ''; return; }
  el.textContent = `⭐ Match score ${r.score}${r.newBest ? ' · 🎉 NEW BEST!' : ` · Your best ${r.best}`} · #${r.rankWins} in wins · #${r.rankBest} in best match`;
}

// high score lists (two tabs)
let scoreTab = 'wins';
async function showScores() {
  $('menu').classList.add('hidden'); $('scores').classList.remove('hidden');
  $('scorelist').innerHTML = '<p class="sub">Loading…</p>';
  const r = await api('/api/leaderboard');
  if (r.error) { $('scorelist').innerHTML = '<p class="sub">⚠️ Could not reach the high score server.</p>'; return; }
  renderScores(r);
}
function renderScores(data) {
  $('scores')._data = data;
  document.querySelectorAll('[data-tab]').forEach((b) => b.classList.toggle('sel', b.dataset.tab === scoreTab));
  const rows = data[scoreTab] || [];
  const list = $('scorelist');
  list.innerHTML = '';
  if (!rows.length) { list.innerHTML = '<p class="sub">No scores yet. Go win one! 🏆</p>'; return; }
  rows.forEach((row, i) => {
    const div = document.createElement('div');
    div.className = 'scorerow' + (playerName && row.name.toLowerCase() === playerName.toLowerCase() ? ' me' : '');
    const medal = ['🥇', '🥈', '🥉'][i] || `#${i + 1}`;
    const hero = HEROES[row.hero] ? ` ${HEROES[row.hero].emoji}` : '';
    const value = scoreTab === 'wins' ? `${row.wins} win${row.wins === 1 ? '' : 's'}` : `${row.score}${hero}`;
    for (const [cls, text] of [['rank', medal], ['who', row.name], ['val', value]]) {
      const span = document.createElement('span'); span.className = cls; span.textContent = text; div.appendChild(span);
    }
    list.appendChild(div);
  });
}

// menu: hero cards + difficulty
function renderCards(wrapId = 'cards') {
  const wrap = $(wrapId);
  wrap.innerHTML = '';
  if (!isUnlocked(chosenHero)) chosenHero = 'brickster';
  const bar = (label, v) => `<div class="stat"><span>${label}</span><div class="bar"><i style="width:${v * 100}%"></i></div></div>`;
  for (const k of MENU_KEYS.filter(isRevealed)) {
    const d = HEROES[k], open = isUnlocked(k);
    const card = document.createElement('div');
    card.className = 'card' + (k === chosenHero ? ' sel' : '') + (open ? '' : ' locked');
    card.dataset.hero = k;
    card.innerHTML = `<div class="face">${d.emoji}</div><h3>${d.name}</h3>
      ${bar('Health', d.bars.hp)}${bar('Speed', d.bars.speed)}${bar('Range', d.bars.range)}
      <p>${d.attackText}</p><p>${d.superText}</p>
      ${open ? '' : `<div class="lock">🔒 Win ${d.unlockAt} match${d.unlockAt === 1 ? '' : 'es'} to unlock (${save.wins}/${d.unlockAt})</div>`}`;
    if (open) card.addEventListener('click', () => {
      chosenHero = k;
      wrap.querySelectorAll('.card').forEach((c) => c.classList.toggle('sel', c.dataset.hero === k));
      if (state === 'lobby') netSend({ t: 'hero', hero: k });
    });
    wrap.appendChild(card);
  }
  renderWorlds();
  $('record').textContent = `👋 Hi, ${playerName}! · 🏆 Wins: ${save.wins} · Games: ${save.games} · Eliminations: ${save.elims}`;
  $('showscores').classList.toggle('hidden', !ONLINE);
  $('onlinerow').classList.toggle('hidden', !ONLINE);
  $('onlinewarn').textContent = ONLINE && save.onlineError === 'taken' ? `⚠️ "${playerName}" is taken online, so your scores aren't on the high score list. Change player to pick another name.`
    : ONLINE && save.onlineError === 'bad_word' ? '⚠️ This name can\'t go on the high score list. Change player to pick another name.' : '';
}
// world picker (specs/16-map-candy-land.md): on the menu, and for the host in the waiting room
function renderWorlds() {
  setText($('tagline'), `${WORLDS[chosenWorld].emoji} ${WORLDS[chosenWorld].name} · 10 heroes drop in · last one standing wins`);
  for (const id of ['worlds', 'lobbyworlds']) {
    const wrap = $(id);
    wrap.innerHTML = '';
    for (const k of WORLD_KEYS) {
      const w = WORLDS[k], open = isWorldOpen(k);
      const b = document.createElement('button');
      b.className = 'pill' + (k === chosenWorld ? ' sel' : '') + (open ? '' : ' locked');
      b.textContent = open ? `${w.emoji} ${w.name}` : `🔒 ${w.name}: win ${w.unlockAt} (${save.wins}/${w.unlockAt})`;
      b.disabled = !open;
      b.addEventListener('click', () => pickWorld(k));
      wrap.appendChild(b);
    }
  }
}
function pickWorld(k) {
  chosenWorld = k;
  setWorld(k);
  renderWorlds();
  if (state === 'lobby' && net && net.host) { netSend({ t: 'world', world: k }); renderLobby(); }
}
function buildMenu() {
  renderCards();
  document.querySelectorAll('[data-diff]').forEach((b) => b.addEventListener('click', () => {
    chosenDiff = b.dataset.diff;
    document.querySelectorAll('[data-diff]').forEach((x) => x.classList.toggle('sel', x === b));
  }));
  $('play').addEventListener('click', startMatch);
  $('again').addEventListener('click', () => (net ? backToLobby() : startMatch()));
  $('hostbtn').addEventListener('click', hostGame);
  $('joinmenu').addEventListener('click', () => showJoin());
  $('joinbtn').addEventListener('click', () => joinRoom($('codeinput').value));
  $('codeinput').addEventListener('keydown', (e) => { if (e.key === 'Enter') joinRoom($('codeinput').value); });
  $('codeinput').addEventListener('input', () => { $('joinmsg').textContent = ''; });
  $('joinback').addEventListener('click', showMenu);
  $('lobbystart').addEventListener('click', startMatch);
  $('lobbyleave').addEventListener('click', showMenu);
  $('noticeok').addEventListener('click', showMenu);
  $('watchnext').addEventListener('click', () => nextWatch(1));
  $('tomenu').addEventListener('click', showMenu);
  $('resume').addEventListener('click', resume);
  $('quit').addEventListener('click', showMenu);
  $('switchuser').addEventListener('click', showLogin);
  const go = async () => { if (!(await login($('nameinput').value))) { $('nameinput').focus(); $('nameinput').classList.add('shake'); setTimeout(() => $('nameinput').classList.remove('shake'), 400); } };
  $('nameinput').addEventListener('input', () => nameMsg(''));
  $('showscores').addEventListener('click', showScores);
  $('scoresback').addEventListener('click', () => { $('scores').classList.add('hidden'); $('menu').classList.remove('hidden'); });
  document.querySelectorAll('[data-tab]').forEach((b) => b.addEventListener('click', () => { scoreTab = b.dataset.tab; if ($('scores')._data) renderScores($('scores')._data); }));
  $('letsgo').addEventListener('click', go);
  $('nameinput').addEventListener('keydown', (e) => { if (e.key === 'Enter') go(); });
}

// ===================================================================
// Multiplayer (specs/15-multiplayer.md)
// The host's browser runs the match. Guests send their keys and aim, and the host sends back
// snapshots (positions, health, effects) plus events (attacks, supers, eliminations) to replay.
// ===================================================================
const SNAP_EVERY = 0.05;   // host → guests, 20 a second
const INPUT_EVERY = 0.05;  // guest → host, 20 a second
const INTERP = 0.1;        // guests draw other heroes this far in the past and slide between snapshots
const GONE_AFTER = 10;     // a disconnected friend's hero stands still this long, then is eliminated
const ROOM_ERRORS = {
  not_found: "Can't find that room. Check the code 🙂",
  started: 'That match already started. Ask for a new code!',
  full: 'That room is full (10 players).',
  same_name: 'Someone in that room already has your name.',
  name: "That name can't be used online.",
};
let watch = null; // who you're watching after you're out

const netSend = (msg) => { if (net && net.ws.readyState === 1) net.ws.send(JSON.stringify(msg)); };
// host only: things guests should replay, sent with the next snapshot
function emit(ev) { if (net && net.host && net.live) net.events.push(ev); }
// feedback for one hero's player: shown here if it's you, sent to their device if it's a friend
function notify(h, kind, ...args) {
  if (!auth) return;
  if (h.isPlayer) note([kind, ...args]);
  else if (h.remote && net) (net.notes[h.pid] || (net.notes[h.pid] = [])).push([kind, ...args]);
}
function note([kind, a, b, c, d]) {
  if (kind === 'p') popup(a);
  else if (kind === 'pk') { popup(a); sfx('pickup'); }
  else if (kind === 'i') inkSplat();
  else if (kind === 'b') { if (heroes[a]) floatNum(heroes[a], 'BLOCKED', '#9fd3ff'); }
  else if (kind === 'n') { if (heroes[a]) floatNum(heroes[a], b, c); if (d) sfx('hit'); }
}
// damage numbers for a friend's hits, grouped like the player's own
function netHit(src, t, amt, quiet) {
  const m = src.netHits || (src.netHits = {});
  const e = m[t.id] || (m[t.id] = { v: 0, s: 0 });
  e.v += amt; if (!quiet) e.s = 1;
}
function flushHits() {
  for (const h of heroes) {
    if (!h.netHits) continue;
    for (const id in h.netHits) {
      const e = h.netHits[id];
      notify(h, 'n', +id, Math.round(e.v), h.lasering ? '#b6ff8a' : '#ffffff', e.s);
    }
    h.netHits = null;
  }
}

// ----- room connection -----
function normCode(raw) {
  const m = String(raw || '').toUpperCase().replace(/[^A-Z0-9]/g, '').match(/^([A-Z]{2,8})(\d{2})$/);
  return m ? `${m[1]}-${m[2]}` : null;
}
function connect(code, host) {
  leaveRoom();
  const q = new URLSearchParams({ host: host ? '1' : '0', name: playerName, hero: chosenHero });
  const ws = new WebSocket(`${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/api/room/${encodeURIComponent(code)}/ws?${q}`);
  const me = net = {
    ws, code, host, pid: 0, roster: [], live: false, over: false, events: [], notes: {}, su: 0, ju: 0, seq: 0,
    snaps: [], evq: [], sent: {}, hist: [], corr: null, hostT: 0, hostAt: 0, snapT: 0, hitT: 0, inT: 0,
  };
  ws.onmessage = (e) => {
    if (net !== me || e.data === 'pong') return;
    let msg; try { msg = JSON.parse(e.data); } catch (err) { return; }
    onNet(msg);
  };
  ws.onclose = () => { if (net === me) showNotice('😢 Lost connection', 'The connection to the room dropped.'); };
  me.ping = setInterval(() => { if (ws.readyState === 1) ws.send('ping'); }, 20000);
  if (host) startTicker();
}
function leaveRoom() {
  if (!net) return;
  const n = net;
  net = null; auth = true;
  clearInterval(n.ping);
  try { n.ws.close(1000); } catch (e) { /* already closed */ }
  stopTicker();
}
const hostName = () => (net && (net.roster.find((p) => p.host) || {}).name) || 'the host';

function onNet(m) {
  switch (m.t) {
    case 'welcome': net.pid = m.pid; showLobby(); break;
    case 'roster':
      net.roster = m.players;
      if (net.host) netSend({ t: 'world', world: chosenWorld }); // so new friends see it too
      if (state === 'lobby') renderLobby();
      break;
    case 'world': if (!net.host && WORLDS[m.world]) { net.world = m.world; setWorld(m.world); if (state === 'lobby') renderLobby(); } break;
    case 'error': {
      const msg = ROOM_ERRORS[m.reason] || 'Something went wrong. Try again.';
      leaveRoom();
      if (state === 'join') { $('joinmsg').textContent = msg; $('joinbtn').disabled = false; } else showNotice('😢 Oops', msg);
      break;
    }
    case 'hostleft': showNotice('😢 Host left', `${hostName()} left, so the game is over.`); break;
    case 'expired': showNotice('⏰ Room closed', 'The waiting room closed after 30 minutes. Make a new one!'); break;
    case 'left': if (net.host) playerLeft(m.pid); break;
    case 'start': if (!net.host) beginMatch(m); break;
    case 'lobby': if (!net.host) showLobby(); break;
    case 's': if (!net.host && net.live) onSnapshot(m); break;
    case 'n': if (!net.host) m.n.forEach(note); break;
    case 'in': if (net.host) onInput(m); break;
  }
}

// ----- screens: host, join, waiting room -----
async function hostGame() {
  $('hostbtn').disabled = true;
  const r = await api('/api/room', {});
  $('hostbtn').disabled = false;
  if (!r.code) { showNotice('😢 Oops', r.error === 'offline' ? "Couldn't reach the server. Check the internet." : 'Could not make a room. Try again.'); return; }
  connect(r.code, true);
}
function showJoin(prefill) {
  showMenu();
  $('menu').classList.add('hidden');
  state = 'join';
  $('codeinput').value = prefill || ''; $('joinmsg').textContent = ''; $('joinbtn').disabled = false;
  $('join').classList.remove('hidden');
  setTimeout(() => $('codeinput').focus(), 50);
}
function joinRoom(raw) {
  const code = normCode(raw);
  if (!code) { $('joinmsg').textContent = 'Codes look like LAVA-42'; return; }
  $('joinmsg').textContent = 'Joining…'; $('joinbtn').disabled = true;
  connect(code, false);
}
function showLobby() {
  clearMatch();
  state = 'lobby';
  if (document.pointerLockElement) document.exitPointerLock();
  for (const id of ['menu', 'join', 'end', 'pause', 'hud', 'notice']) $(id).classList.add('hidden');
  $('lobby').classList.remove('hidden');
  renderLobby();
  renderCards('lobbycards');
}
function renderLobby() {
  $('lobbycode').textContent = net.code;
  const list = $('lobbylist');
  list.innerHTML = '';
  for (const p of net.roster) {
    const d = HEROES[p.hero] || HEROES.brickster;
    const el = document.createElement('div');
    el.className = 'pill lobbyp' + (p.pid === net.pid ? ' sel' : '');
    el.textContent = `${p.host ? '👑 ' : ''}${p.name} · ${d.emoji} ${d.name}`;
    list.appendChild(el);
  }
  const n = net.roster.length;
  const w = WORLDS[net.host ? chosenWorld : net.world || 'lava'];
  $('lobbyinfo').textContent = `${w.emoji} ${w.name} · ${n} / 10 player${n === 1 ? '' : 's'} · bots fill the empty places`
    + (net.host ? ` · Bots: ${({ easy: '😊 Easy', normal: '😎 Normal', hard: '😈 Hard' })[chosenDiff]}` : '');
  $('lobbyworldrow').classList.toggle('hidden', !net.host);
  $('lobbystart').classList.toggle('hidden', !net.host);
  $('lobbywait').textContent = net.host ? (n === 1 ? 'Tell your friends the code! You can also start on your own.' : '') : `Waiting for ${hostName()} to start…`;
}
function showNotice(title, text) {
  showMenu();
  $('menu').classList.add('hidden');
  $('noticetitle').textContent = title; $('noticetext').textContent = text;
  $('notice').classList.remove('hidden');
}
// host: "Play again together" sends everyone still here back to the waiting room
function backToLobby() {
  if (!net || !net.host) return;
  netSend({ t: 'lobby' });
  showLobby();
}
function matchOver(w) {
  if (!net) return;
  net.live = false; net.over = true;
  if (w && w !== player) feed(`🏆 ${w.label} wins!`);
  renderEndButtons();
}
function renderEndButtons() {
  const on = !!net, out = on && player && !player.alive;
  $('again').textContent = on ? '▶ Play again together' : '▶ Play again';
  $('again').classList.toggle('hidden', on && !(net.host && net.over));
  $('tomenu').textContent = !on ? 'Change hero' : net.host ? 'Leave (ends the game for everyone)' : 'Leave';
  $('watchnext').classList.toggle('hidden', !out || net.over);
  $('waitmsg').textContent = !on ? '' : net.over ? (net.host ? '' : `Waiting for ${hostName()} to play again…`)
    : out && watch ? `👀 Watching ${watch.name}` : '';
}

// ----- watching after you're out -----
const viewHero = () => (net && player && !player.alive && watch ? watch : player);
function nextWatch(step) {
  const alive = heroes.filter((h) => h.alive && h !== player);
  if (!alive.length) return;
  const i = alive.indexOf(watch);
  watch = alive[(i + step + alive.length) % alive.length];
  renderEndButtons();
}
function updateWatch() {
  if (!player || player.alive || (watch && watch.alive)) return;
  if (heroes.some((h) => h.alive && h !== player)) nextWatch(1);
}

// ----- host side -----
const num = (v, d = 0) => (Number.isFinite(v) ? v : d);
function onInput(m) {
  const h = heroes.find((e) => e.remote && e.pid === m.p);
  if (!h || !net.live) return;
  h.inp = { q: num(m.q), mx: clamp(num(m.mx), -1, 1), mz: clamp(num(m.mz), -1, 1), y: num(m.y, h.yaw), a: !!m.a, d: clamp(num(m.d, 15), 5, 18), su: num(m.su), ju: num(m.ju) };
  h.inAt = T;
}
// a friend's hero, driven by the keys they press on their own device (like playerInput)
function remoteInput(h) {
  const inp = h.inp;
  if (!h.alive) return;
  if (!inp || h.goneAt) { h.mx = h.mz = 0; return; }
  h.yaw = inp.y;
  const l = Math.hypot(inp.mx, inp.mz);
  h.mx = l > 1 ? inp.mx / l : inp.mx; h.mz = l > 1 ? inp.mz / l : inp.mz;
  if (inp.su > (h.suSeen || 0)) { h.suSeen = inp.su; useSuper(h, h.yaw); }
  if (inp.ju > (h.juSeen || 0)) { h.juSeen = inp.ju; if (h.y === 0) h.vy = 9; }
  if (h.fearUntil > T) {
    const dx = h.x - h.fearX, dz = h.z - h.fearZ, d = Math.hypot(dx, dz) || 1;
    h.mx = dx / d; h.mz = dz / d;
    return;
  }
  if (inp.a) attack(h, h.yaw, inp.d);
}
function playerLeft(pid) {
  const h = heroes.find((e) => e.remote && e.pid === pid);
  if (!h || !net.live || !h.alive || h.goneAt) return;
  h.goneAt = T; h.inp = null;
  feed(`${h.name} disconnected`);
  emit(['d', h.id]);
}
function heroState(h) {
  const st = {};
  const add = (k, v) => { if (v > T) st[k] = r2(v); };
  add('fz', h.frozenUntil); add('sh', h.shieldUntil); add('la', h.laserUntil); add('gr', h.growUntil);
  add('su', h.stuckUntil); add('da', h.dashUntil); add('ink', h.inkUntil);
  for (const k in h.fx) add(k, h.fx[k]);
  if (h.fearUntil > T) st.fe = [r2(h.fearUntil), r2(h.fearX), r2(h.fearZ)];
  if (tornados.some((t) => t.carried.has(h))) st.ca = 1;
  return [r2(h.x), r2(h.z), r2(h.y), r2(h.yaw), r2(Math.max(0, h.hp)), Math.floor(h.superCharge), h.mx || h.mz ? 1 : 0, h.kills,
    h.inp ? h.inp.q : 0, h.inp ? r2(T - h.inAt) : 0, Object.keys(st).length ? st : 0];
}
function sendSnapshot() {
  const msg = { t: 's', T: Math.round(T * 1000) / 1000, st: [storm.i, r2(storm.t), storm.shrinking ? 1 : 0], h: heroes.map(heroState), ev: net.events };
  if (pickupsDirty) { msg.pk = pickupList(); pickupsDirty = false; }
  net.events = [];
  // on a slow connection skip a plain snapshot rather than let them pile up
  if (net.ws.bufferedAmount < 256e3 || msg.ev.length || msg.pk) netSend(msg);
  for (const pid in net.notes) netSend({ t: 'n', to: +pid, n: net.notes[pid] });
  net.notes = {};
}

// ----- guest side -----
function onSnapshot(m) {
  if (!heroes.length || !Array.isArray(m.h)) return;
  net.snaps.push(m);
  net.hostT = m.T; net.hostAt = performance.now() / 1000;
  if (Math.abs(T - m.T) > 1) T = m.T; // first snapshot, or after a long hiccup
  storm.i = m.st[0]; storm.t = m.st[1]; storm.shrinking = !!m.st[2];
  if (!storm.shrinking && storm.circles[storm.i]) storm.cur = { ...storm.circles[storm.i] };
  if (m.pk) syncPickups(m.pk);
  for (const ev of m.ev || []) net.evq.push({ T: m.T, ev });
  m.h.forEach((s, i) => { if (heroes[i]) applyHeroState(heroes[i], s); });
}
function applyHeroState(h, s) {
  const [x, z, y, , hp, sc, , kills, q, age, st] = s;
  if (hp < h.hp - 0.5) { h.flashT = 0.12; if (h.isPlayer) hurt = Math.min(1, hurt + (h.hp - hp) / 40); }
  h.hp = hp; h.kills = kills;
  const own = h.isPlayer, justUsedSuper = own && T < (h.supLock || 0);
  if (justUsedSuper) return; // keep showing your own super until the host catches up
  h.superCharge = sc;
  const g = (k) => (st && st[k]) || 0;
  h.frozenUntil = g('fz'); h.shieldUntil = g('sh'); h.laserUntil = g('la'); h.growUntil = g('gr');
  h.stuckUntil = g('su'); h.inkUntil = g('ink');
  for (const k in h.fx) h.fx[k] = g(k);
  const fe = st && st.fe;
  h.fearUntil = fe ? fe[0] : 0;
  if (fe) { h.fearX = fe[1]; h.fearZ = fe[2]; }
  if (h.shieldMesh && h.shielded && !h.shieldMesh.visible) { h.shieldMesh.visible = true; h.shieldT = 0; }
  h.carried = !!g('ca'); // spun round by a tornado: follow the host exactly
  if (own && h.carried) { h.x = x; h.z = z; h.y = y; h.vy = 0; net.corr = null; }
  else if (own) reconcile(h, x, z, y, q, age);
  else h.dashUntil = g('da');
}
// your own hero moves straight away on your screen; when the host's position differs, ease towards it
function reconcile(h, x, z, y, q, age) {
  if (!h.alive || net.sent[q] === undefined) return;
  const p = histAt(net.sent[q] + age);
  if (!p) return;
  const ex = x - p.x, ez = z - p.z, ey = y - p.y;
  if (Math.hypot(ex, ez) > 6 || Math.abs(ey) > 4) { // way off (carried by a tornado, a long lag spike): jump there
    h.x += ex; h.z += ez; h.y += ey; shiftHist(ex, ey, ez); net.corr = null;
  } else net.corr = { x: ex, z: ez };
}
function histAt(t) {
  const H = net.hist;
  if (!H.length || t < H[0].t) return null;
  for (let i = H.length - 1; i >= 0; i--) {
    if (H[i].t > t) continue;
    const a = H[i], b = H[i + 1];
    if (!b) return a;
    const k = (t - a.t) / (b.t - a.t || 1);
    return { x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k), z: lerp(a.z, b.z, k) };
  }
  return null;
}
function shiftHist(dx, dy, dz) { for (const p of net.hist) { p.x += dx; p.y += dy; p.z += dz; } }

// runs at the start of each guest frame
function guestFrame(dt) {
  const now = performance.now() / 1000;
  if (net.hostAt) T += clamp((net.hostT + (now - net.hostAt)) - T, -1, 1) * 0.1; // stay in step with the host's clock
  const rt = T - INTERP, S = net.snaps;
  if (S.length) {
    while (S.length > 2 && S[1].T <= rt) S.shift();
    const a = S[0], b = S[1] || a;
    const k = b.T > a.T ? clamp((rt - a.T) / (b.T - a.T), 0, 1) : 0;
    heroes.forEach((h, i) => {
      if (!h.puppet || !a.h[i] || !b.h[i]) return;
      const p = a.h[i], n = b.h[i];
      h.x = lerp(p[0], n[0], k); h.z = lerp(p[1], n[1], k); h.y = lerp(p[2], n[2], k);
      h.yaw = p[3] + angDiff(p[3], n[3]) * k;
      h.mx = n[6]; h.mz = 0;
    });
  }
  while (net.evq.length && net.evq[0].T <= rt + 0.001) runEvent(net.evq.shift().ev);
  if (net.corr && player && player.alive) {
    const k = 1 - Math.exp(-8 * dt), dx = net.corr.x * k, dz = net.corr.z * k;
    player.x += dx; player.z += dz; net.corr.x -= dx; net.corr.z -= dz;
    shiftHist(dx, 0, dz);
  }
}
function runEvent(ev) {
  if (!net) return;
  const h = heroes[ev[1]];
  switch (ev[0]) {
    case 'a': if (h && !h.isPlayer && h.alive) attack(h, ev[2], ev[3], true); break;
    case 's': if (h && !h.isPlayer && h.alive) useSuper(h, ev[2], true, ev[3] || undefined); break;
    case 'l': if (h && !h.isPlayer && pads[ev[2]]) padFx(pads[ev[2]], h); break;
    case 'x': if (h && !h.isPlayer) slamFx(ev[2], ev[3]); break;
    case 'd': if (h) feed(`${h.name} disconnected`); break;
    case 'e':
      if (!h || !h.alive) break;
      h.kills = ev[5];
      showElim(h, heroes[ev[2]], ev[3]);
      if (h === player) endMatch(false, ev[4]);
      break;
    case 'w':
      if (h && h === player) { h.kills = ev[2]; endMatch(true, 1); }
      matchOver(h);
      break;
  }
}
function sendInput() {
  if (!net || net.host || !net.live || !player || !player.alive) return;
  const h = player, q = ++net.seq;
  net.sent[q] = performance.now() / 1000; delete net.sent[q - 200];
  netSend({ t: 'in', q, mx: r2(h.mx), mz: r2(h.mz), y: r2(h.yaw), a: state === 'play' && mouseDown ? 1 : 0, d: r2(boomerAimDist()), su: net.su, ju: net.ju });
  net.inT = 0;
}

// runs at the end of each frame while the match is live
function netTick(dt) {
  if (!net.live) return;
  if (net.host) {
    for (const h of heroes) if (h.goneAt && h.alive && T - h.goneAt > GONE_AFTER) eliminate(h, null, 'quit');
    if (!net.live) return;
    net.hitT += dt; if (net.hitT >= 0.25) { net.hitT = 0; flushHits(); }
    net.snapT += dt; if (net.snapT >= SNAP_EVERY) { net.snapT = 0; sendSnapshot(); }
  } else {
    if (player.alive) {
      const now = performance.now() / 1000;
      net.hist.push({ t: now, x: player.x, y: player.y, z: player.z });
      while (net.hist.length && net.hist[0].t < now - 2) net.hist.shift();
    }
    net.inT += dt; if (net.inT >= INPUT_EVERY) sendInput();
  }
}

// The browser stops drawing frames when the host's tab is hidden. A tiny worker keeps the match ticking.
let ticker = null, lastFrameAt = 0, lastTickAt = 0;
function startTicker() {
  if (ticker) return;
  try {
    ticker = new Worker(URL.createObjectURL(new Blob(['setInterval(() => postMessage(0), 50)'], { type: 'text/javascript' })));
    ticker.onmessage = () => {
      const now = performance.now();
      if (!net || !net.host || now - lastFrameAt < 250) { lastTickAt = now; return; }
      let dt = Math.min((now - lastTickAt) / 1000, 0.5);
      lastTickAt = now;
      while (dt > 0.001 && simulating()) { const step = Math.min(dt, 0.05); dt -= step; simulate(step); }
    };
  } catch (e) { ticker = null; }
}
function stopTicker() { if (ticker) { ticker.terminate(); ticker = null; } }

// ===================================================================
// Main loop
// ===================================================================
const simulating = () => state === 'play' || state === 'ending' || (!!net && net.live && (state === 'paused' || state === 'end'));
function simulate(dt) {
  T += dt;
  if (!auth) guestFrame(dt);
  if (state === 'play') playerInput(dt);
  else if (player && player.alive && !player.dance) player.mx = player.mz = 0;
  if (auth) {
    for (const h of heroes) if (h.remote) remoteInput(h);
    for (const h of heroes) if (!h.human && h.alive) botThink(h, dt);
  }
  for (const h of heroes) updateHero(h, dt);
  updateProjectiles(dt);
  updatePickups(dt);
  updateStorm(dt);
  updateParticles(dt);
  updateBlasts(dt);
  updateZones(dt);
  updateTornados(dt);
  updateHoles(dt);
  updateStrikes();
  updateGummies(dt);
  updateWalls(dt);
  if (net) { netTick(dt); updateWatch(); }
}

// auto quality (specs/10-tech.md): draw at a lower resolution while frames are slow, back up when there's room
let quality = 1, frameAvg = 1 / 60, qualityCd = 3;
function autoQuality(realDt) {
  if (document.hidden || realDt > 0.25) return; // tab switches aren't slow frames
  frameAvg = lerp(frameAvg, realDt, 0.05);
  qualityCd -= realDt;
  if (qualityCd > 0) return;
  let q = quality;
  if (frameAvg > 1 / 42 && quality > 0.7) q = quality - 0.1;
  else if (frameAvg < 1 / 57 && quality < 1) q = quality + 0.1;
  if (q === quality) return;
  qualityCd = q < quality ? 3 : 8; // be slow to go back up, so it doesn't flip back and forth
  quality = Math.round(q * 10) / 10;
  renderer.setPixelRatio(BASE_RATIO * quality);
  frameAvg = 1 / 60;
}

let last = performance.now();
function frame(now) {
  requestAnimationFrame(frame);
  const dt = clamp((now - last) / 1000, 0, 0.05);
  autoQuality((now - last) / 1000);
  last = now; lastFrameAt = now;

  world.tick(dt, now);
  updateFloaters(world.floaters, dt);
  updatePadFx(now);

  if (simulating()) {
    simulate(dt);
    updateHUD(dt);
  } else if (state === 'paused' || state === 'end') {
    updateHUD(0);
    if (state === 'end' && player && player.dance) { T += dt; animateHero(player, dt, 0); updateParticles(dt); }
  }
  updateCamera(dt);
  renderer.render(scene, camera);
}

setWorld('lava');
buildMenu();
buildTouch();
updateStorm(0);
requestAnimationFrame(frame);

// test hook: ?auto=<hero> starts a match straight away (used for screenshots)
// (add &world=candy to test Candy Land)
const query = new URLSearchParams(location.search), auto = query.get('auto');
if (auto && HEROES[auto]) { if (!playerName) playerName = 'Tester'; chosenHero = auto; chosenWorld = WORLDS[query.get('world')] ? query.get('world') : 'lava'; startMatch(); }
else if (!playerName) showLogin();
else if (pendingRoom) { const code = pendingRoom; pendingRoom = null; showJoin(code); joinRoom(code); }
window.__bloknite = { get heroes() { return heroes; }, get player() { return player; }, get state() { return state; }, useSuper, attack, damage, storm, simulate, get T() { return T; }, pads, get net() { return net; }, get quality() { return quality; }, get watch() { return watch; }, setWorld, get world() { return world; }, colliders, lavaPools };
})();
