// Multiplayer rooms (specs/15-multiplayer.md). One Durable Object per room code.
// The host's browser runs the match; this only passes messages between the players' browsers.
import { checkName } from '../shared/rules.js';

const MAX_PLAYERS = 10;
const IDLE_MS = 30 * 60e3;   // a waiting room closes after 30 min of nothing happening
const RESERVE_MS = 2 * 60e3; // a new code is kept for its host for 2 min
const HERO_RE = /^[a-z]{2,12}$/;

const WORDS = ['LAVA', 'ROCK', 'BOOM', 'ZAP', 'PIZZA', 'NINJA', 'DINO', 'GHOST', 'STORM', 'FROST', 'BRICK', 'TACO',
  'ROBOT', 'COMET', 'TIGER', 'SHARK', 'BLAZE', 'MAGMA', 'SPIKE', 'TURBO', 'PIXEL', 'WAFFLE', 'MANGO', 'GECKO',
  'PANDA', 'LLAMA', 'YETI', 'COBRA', 'VOLT', 'NOVA', 'BLOCK', 'CHOMP', 'SNOW', 'FIRE', 'JELLY', 'BANANA'];
export const newCode = () => `${WORDS[Math.floor(Math.random() * WORDS.length)]}-${10 + Math.floor(Math.random() * 90)}`;
// "lava 42", "Lava42" and "LAVA-42" are all the same code
export function normCode(raw) {
  const m = String(raw || '').toUpperCase().replace(/[^A-Z0-9]/g, '').match(/^([A-Z]{2,8})(\d{2})$/);
  return m ? `${m[1]}-${m[2]}` : null;
}

export class Room {
  constructor(ctx) {
    this.ctx = ctx;
    // keep-alive pings are answered without waking the room up
    ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair('ping', 'pong'));
  }

  async meta() { return (await this.ctx.storage.get('meta')) || null; }
  async touch(meta) {
    meta.touched = Date.now();
    await this.ctx.storage.put('meta', meta);
    await this.ctx.storage.setAlarm(meta.touched + IDLE_MS);
  }
  sockets() { return this.ctx.getWebSockets(); }
  info(ws) { return ws.deserializeAttachment() || {}; }
  hostSocket() { return this.ctx.getWebSockets('host')[0] || null; }
  roster() {
    return this.sockets().map((w) => this.info(w)).filter((p) => p.pid).sort((a, b) => a.pid - b.pid)
      .map(({ pid, name, hero, host }) => ({ pid, name, hero, host: !!host }));
  }
  broadcast(msg, except) {
    const text = typeof msg === 'string' ? msg : JSON.stringify(msg);
    for (const w of this.sockets()) if (w !== except) { try { w.send(text); } catch (e) { /* closing */ } }
  }
  sendRoster() { this.broadcast({ t: 'roster', players: this.roster() }); }

  async fetch(req) {
    const url = new URL(req.url);
    if (url.pathname === '/create') {
      const meta = await this.meta();
      const reserved = meta && !meta.hostJoined && Date.now() - meta.created < RESERVE_MS;
      if (this.sockets().length || reserved) return new Response('in use', { status: 409 });
      await this.ctx.storage.deleteAll();
      await this.touch({ created: Date.now(), hostJoined: false, started: false, nextPid: 1 });
      return new Response('ok');
    }
    if (req.headers.get('Upgrade') !== 'websocket') return new Response('expected websocket', { status: 426 });

    const [client, server] = Object.values(new WebSocketPair());
    const fail = (reason) => {
      server.accept();
      server.send(JSON.stringify({ t: 'error', reason }));
      server.close(4000, reason);
      return new Response(null, { status: 101, webSocket: client });
    };
    const meta = await this.meta();
    const asHost = url.searchParams.get('host') === '1';
    const check = checkName(url.searchParams.get('name'));
    const hero = HERO_RE.test(url.searchParams.get('hero') || '') ? url.searchParams.get('hero') : 'brickster';
    if (!meta) return fail('not_found');
    if (!check.ok) return fail('name');
    if (asHost) {
      if (meta.hostJoined) return fail('not_found');
      meta.hostJoined = true;
    } else {
      if (!this.hostSocket()) return fail('not_found');
      if (meta.started) return fail('started');
      const players = this.roster();
      if (players.length >= MAX_PLAYERS) return fail('full');
      if (players.some((p) => p.name.toLowerCase() === check.name.toLowerCase())) return fail('same_name');
    }
    const pid = meta.nextPid++;
    await this.touch(meta);
    this.ctx.acceptWebSocket(server, [asHost ? 'host' : `p${pid}`]);
    server.serializeAttachment({ pid, name: check.name, hero, host: asHost });
    server.send(JSON.stringify({ t: 'welcome', pid, host: asHost }));
    this.sendRoster();
    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(ws, raw) {
    if (typeof raw !== 'string' || raw.length > 200000) return;
    let msg;
    try { msg = JSON.parse(raw); } catch (e) { return; }
    const me = this.info(ws);
    if (!me.pid) return;
    if (msg.t === 'hero') {
      if (!HERO_RE.test(msg.hero || '')) return;
      ws.serializeAttachment({ ...me, hero: msg.hero });
      const meta = await this.meta();
      if (meta) await this.touch(meta);
      this.sendRoster();
      return;
    }
    if (me.host) {
      if (msg.t === 'start' || msg.t === 'lobby') {
        const meta = await this.meta();
        if (!meta) return;
        meta.started = msg.t === 'start';
        await this.touch(meta);
        this.broadcast(raw, ws);
        if (msg.t === 'lobby') this.sendRoster();
      } else if (msg.to) {
        const target = this.ctx.getWebSockets(`p${msg.to}`)[0];
        if (target) { try { target.send(raw); } catch (e) { /* closing */ } }
      } else {
        this.broadcast(raw, ws); // snapshots go to every guest
      }
      return;
    }
    if (msg.t === 'in') {
      const host = this.hostSocket();
      msg.p = me.pid;
      if (host) { try { host.send(JSON.stringify(msg)); } catch (e) { /* closing */ } }
    }
  }

  async webSocketClose(ws) { await this.gone(ws); }
  async webSocketError(ws) { await this.gone(ws); }
  async gone(ws) {
    const me = this.info(ws);
    if (!me.pid) return;
    ws.serializeAttachment({});
    try { ws.close(1000, 'bye'); } catch (e) { /* already closed */ }
    if (me.host) { // the host left: the room is over for everyone
      this.broadcast({ t: 'hostleft' });
      for (const w of this.sockets()) { try { w.close(4001, 'host left'); } catch (e) { /* closing */ } }
      await this.ctx.storage.deleteAll();
      return;
    }
    this.broadcast({ t: 'left', pid: me.pid, name: me.name });
    this.sendRoster();
  }

  async alarm() {
    const meta = await this.meta();
    if (!meta) return;
    if (meta.started) { await this.ctx.storage.setAlarm(Date.now() + IDLE_MS); return; }
    if (Date.now() - meta.touched < IDLE_MS) { await this.ctx.storage.setAlarm(meta.touched + IDLE_MS); return; }
    this.broadcast({ t: 'expired' });
    for (const w of this.sockets()) { try { w.close(4002, 'expired'); } catch (e) { /* closing */ } }
    await this.ctx.storage.deleteAll();
  }
}
