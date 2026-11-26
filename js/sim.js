'use strict';
// The game rules. Runs only in the host's browser (or in solo play).
const Sim = (() => {
  const DT = 1 / 30, WORLD = 1700;
  let G = null, uid = 1;
  const rnd = (a, b) => a + Math.random() * (b - a);
  const need = l => Math.floor(4 + 3 * l + 0.22 * l * l);
  const SHOT = { dart: 0, hail: 1, sickle: 2, spit: 3, orb: 4, seed: 5 };
  const ZONE = { fire: 0, thorn: 1, heal: 2, aura: 3, rod: 4, sprout: 5, beacon: 6 };
  const PAIRS = [['burn', 'chill', 'steam'], ['chill', 'shock', 'shatter'], ['burn', 'rot', 'wildfire'], ['shock', 'rot', 'spore'], ['burn', 'shock', 'overload'], ['chill', 'rot', 'frostbite']];
  const ASC = ['dmg', 'area', 'cdr', 'hp', 'crit'];
  const PICK = { heart: 0, magnet: 1, coin: 2, chest: 3 };

  function newGame(defs, opts = {}) {
    uid = 1;
    G = { t: 0, players: [], enemies: [], shots: [], zones: [], gems: new Map(), pickups: [], ev: [], beams: [], orbs: [], auras: [],
      level: 1, xp: 0, xpNeed: need(1), pause: null, pendLv: 0, pendChest: 0, pendBoon: 0,
      shrine: null, nextShrine: 70, nextElite: 110, boss: null, bossTime: opts.bossTime || 720, over: null,
      acc: 0, coins: 0, kills: 0, shrines: 0, reactions: 0, evos: 0, dirty: true, dotT: 0, txt: 0, n: defs.length,
      map: MAPS[opts.map] ? opts.map : 'fields', nextWarden: 240, nextSurge: 330, nextAltar: 170, altar: null, curse: 0, bargains: 0, wardens: 0,
      diff: opts.diff | 0, dm: diffOf(opts.diff | 0), cz: {} };
    for (const c of opts.curses || []) if (CURSES[c]) G.cz[c] = 1;
    defs.forEach((d, i) => {
      const a = i / defs.length * 6.283, off = defs.length > 1 ? 50 : 0;
      const p = { id: d.id, name: d.name, char: d.char, meta: d.meta || {}, x: Math.cos(a) * off, y: Math.sin(a) * off, fx: 1, fy: 0,
        hp: 1, weapons: [], charms: [], boons: [], down: false, downT: 0, rev: 0, deaths: 0, inv: 0, skillT: 0, dashT: 0,
        still: 0, kin: 1, kills: 0, reacts: 0, dmgBy: {}, usedSecond: false, mv: false,
        ward: 0, ultT: 0, ultCd: 0, ultAcc: 0, asc: {}, banned: {} };
      p.rerolls = 1 + ((p.meta.h || {}).reroll || 0); p.banishes = (p.meta.h || {}).banish || 0;
      const mh = p.meta.h || {}, mf = p.meta.f || {};
      p.wslots = mh.kslot ? 6 : 5;
      let sw = CHARS[p.char].weapon; if (CHARS[p.char].rand) { const ok = Object.keys(WEAPONS).filter(w => (p.meta.lock || []).indexOf(w) < 0); sw = ok[Math.random() * ok.length | 0]; }
      addWeapon(p, sw); if (mf.startLvl) p.weapons[0].lvl = 2;
      if (mh.kcharm) { const ids = Object.keys(CHARMS); p.charms.push({ id: ids[Math.random() * ids.length | 0], lvl: 1 }); }
      for (let i = (mh.kboon ? 1 : 0) + (p.char === 'gran' ? 1 : 0); i > 0; i--) { const ids = Object.keys(BOONS).filter(b => !BOONS[b].r && b !== 'kindred' && b !== 'second' && p.boons.indexOf(b) < 0); p.boons.push(ids[Math.random() * ids.length | 0]); }
      recompute(p); p.hp = p.st.maxhp; G.players.push(p);
    });
    return G;
  }
  const addWeapon = (p, id) => p.weapons.push({ id, lvl: 1, evo: false, t: 0.6, a: 0, acc: 0, hits: new Map() });
  const hasBoon = (p, b) => p.boons.indexOf(b) >= 0;
  const player = id => G.players.find(p => p.id === id);

  function recompute(p) {
    const m = p.meta, h = m.h || {}, kl = m.kl || 0;
    const s = { dmg: 1, cdr: 1, area: 1, dur: 1, spd: 1, armor: 0, maxhp: 120, regen: 0.5, pickup: 85, crit: 0.05, proj: 0, xp: 1, react: 1, markDur: 1, cards: 3 };
    s.dmg += 0.04 * (h.might || 0) + 0.01 * kl; s.crit += 0.02 * (h.keen || 0); s.area += 0.03 * (h.reach || 0);
    s.cdr += 0.025 * (h.tempo || 0); s.react += 0.08 * (h.alchemy || 0); s.maxhp += 8 * (h.vigor || 0) + 2 * kl;
    s.armor += h.plating || 0; s.regen += 0.2 * (h.mending || 0); s.spd += 0.02 * (h.stride || 0);
    s.pickup *= 1 + 0.08 * (h.magnet || 0); s.xp += 0.03 * (h.wisdom || 0);
    const x = m.x || {}; for (const k in x) { if (k === 'pickupP') s.pickup *= 1 + x[k]; else if (k in s) s[k] += x[k]; } // Heirlooms and talents
    CHARS[p.char].f(s);
    for (const c of p.charms) CHARMS[c.id].f(s, c.lvl);
    for (const b of p.boons) if (BOONS[b].f) BOONS[b].f(s);
    const a = p.asc; s.dmg += 0.06 * (a.dmg || 0); s.area += 0.05 * (a.area || 0); s.cdr += 0.05 * (a.cdr || 0); s.maxhp += 15 * (a.hp || 0); s.crit += 0.03 * (a.crit || 0);
    s.cards += h.cards || 0;
    if (G.cz.frail) s.maxhp *= 0.7; if (G.cz.famine) s.regen *= 0.5; if (G.cz.dim) s.pickup *= 0.5;
    s.maxhp = Math.round(s.maxhp); s.cdr = Math.max(0.3, s.cdr);
    const old = p.st ? p.st.maxhp : s.maxhp;
    if (s.maxhp > old) p.hp += s.maxhp - old;
    p.st = s; p.hp = Math.min(p.hp, s.maxhp);
    p.res = {}; for (const w of p.weapons) { const el = WEAPONS[w.id].el; p.res[el] = (p.res[el] || 0) + 1; }
    G.dirty = true;
  }
  const resN = (p, el) => hasBoon(p, 'prism') ? p.weapons.length : (p.res[el] || 0);
  const resMul = (p, el) => { const c = resN(p, el); return c >= 4 ? 1.75 : c >= 3 ? 1.45 : c >= 2 ? 1.2 : 1; };
  const wd = (p, w, base) => base * p.st.dmg * resMul(p, WEAPONS[w.id].el) * (1 + 0.03 * ((p.meta.m || {})[w.id] || 0)) * (1 + ((p.meta.el || {})[WEAPONS[w.id].el] || 0)) * (1 + 0.2 * (w.aw || 0)) * p.kin;

  // ---------- helpers ----------
  function near(x, y, maxR, skip) {
    let b = null, bd = maxR * maxR;
    for (const e of G.enemies) { if (e.dead || (skip && skip.has(e))) continue; const dx = e.x - x, dy = e.y - y, d = dx * dx + dy * dy; if (d < bd) { bd = d; b = e; } }
    return b;
  }
  function inR(x, y, r, fn) {
    const L = G.enemies, n = L.length;
    for (let i = 0; i < n; i++) { const e = L[i]; if (e.dead) continue; const dx = e.x - x, dy = e.y - y, rr = r + e.r; if (dx * dx + dy * dy < rr * rr) fn(e); }
  }
  const fx = (...a) => { if (G.ev.length < 90) G.ev.push(a); };
  const text = (x, y, s, c) => { if (G.txt < 10) { G.txt++; G.ev.push(['t', x | 0, y | 0, s, c]); } };

  function hit(e, dmg, p, wid, el, flags) { // flags: 1 = cannot crit, 2 = leaves no mark
    if (e.dead) return;
    let crit = false;
    if (p && !(flags & 1) && Math.random() < p.st.crit + (wid === 'beam' ? 0.15 : 0)) { dmg *= 2; crit = true; }
    if (e.shT > 0 && e.type !== 8) dmg *= 0.5; // protected by a Warder
    if (e.shock > 0) dmg *= e.src && hasBoon(e.src, 'surge') ? 1.5 : 1.25;
    e.hp -= dmg;
    if (p) p.dmgBy[wid] = (p.dmgBy[wid] || 0) + dmg;
    if (crit || dmg > 60) text(e.x, e.y - e.r, Math.round(dmg) + (crit ? '!' : ''), crit ? '#fff' : '#ffd9a0');
    if (el && !(flags & 2)) mark(e, ELEM[el].mark, p, el);
    if (e.hp <= 0 && !e.dead) kill(e, p);
  }
  function mark(e, m, p, el) {
    if (!m || e.dead) return;
    if (e.rc <= 0) for (const [a, b, kind] of PAIRS) {
      if (!((m === a && e[b] > 0) || (m === b && e[a] > 0))) continue;
      e.rc = 0.35;
      if (!(p && hasBoon(p, 'catalyst'))) { // Catalyst: reactions do not use up the marks
        if (kind === 'wildfire') { e.rot = 0; e.rotN = 0; e.burn = 4; e.src = p; }
        else { e[a] = 0; e[b] = 0; if (a === 'rot' || b === 'rot') e.rotN = 0; }
      }
      return react(e, kind, p);
    }
    const d = 3 * (p ? p.st.markDur * (resN(p, el) >= 3 ? 1.4 : 1) : 1);
    if (e[m] < d) e[m] = d;
    e.src = p;
    if (m === 'rot') e.rotN = Math.min(p && hasBoon(p, 'blight') ? 16 : 8, (e.rotN || 0) + 1);
    if (m === 'shock' && p && hasBoon(p, 'conduct')) { const o = near(e.x, e.y, 130, new Set([e])); if (o && o.shock < d) o.shock = d; }
  }
  function react(e, kind, p) {
    const base = (1 + G.level * 0.12) * (p ? p.st.react * p.st.dmg : 1);
    G.reactions++; if (p) p.reacts++;
    if (kind === 'steam') {
      fx('x', e.x | 0, e.y | 0, 100, '#e8f4ff'); text(e.x, e.y - 24, 'Steam Burst', '#cfe9ff');
      inR(e.x, e.y, 100, o => hit(o, 32 * base, p, 'react', null, 3));
    } else if (kind === 'shatter') {
      fx('x', e.x | 0, e.y | 0, 46, '#9fe6ff'); text(e.x, e.y - 24, 'Shatter', '#9fe6ff');
      e.frozen = Math.max(e.frozen, 1.5); hit(e, 100 * base, p, 'react', null, 3);
    } else if (kind === 'wildfire') {
      fx('x', e.x | 0, e.y | 0, 125, '#ff7a2a'); text(e.x, e.y - 24, 'Wildfire', '#ff9d5c');
      inR(e.x, e.y, 125, o => { if (o.burn < 4) o.burn = 4; o.src = p; hit(o, 12 * base, p, 'react', null, 3); });
    } else if (kind === 'overload') {
      fx('x', e.x | 0, e.y | 0, 85, '#ffc04a'); text(e.x, e.y - 24, 'Overload', '#ffc04a');
      inR(e.x, e.y, 85, o => { o.frozen = Math.max(o.frozen, 1); hit(o, 24 * base, p, 'react', null, 3); });
    } else if (kind === 'frostbite') {
      fx('x', e.x | 0, e.y | 0, 40, '#8fe0c0'); text(e.x, e.y - 24, 'Frostbite', '#8fe0c0');
      e.slow = 3; hit(e, 70 * base, p, 'react', null, 3);
      if (e.dead && !e.big) dropGem(e.x, e.y, 2);
    } else {
      text(e.x, e.y - 24, 'Sporestorm', '#d6f56b');
      const used = new Set([e]); let from = e;
      hit(e, 36 * base, p, 'react', null, 3);
      for (let i = 0; i < 5; i++) { const o = near(from.x, from.y, 180, used); if (!o) break; used.add(o); fx('b', from.x | 0, from.y | 0, o.x | 0, o.y | 0, '#d6f56b'); hit(o, 36 * base, p, 'react', null, 3); from = o; }
    }
  }
  function kill(e, p) {
    e.dead = true; G.kills++; if (p) p.kills++;
    fx('k', e.x | 0, e.y | 0, e.type);
    const T = ENEMIES[e.type];
    if (e.type === 5) { G.over = { win: true }; return; }
    if (T.xp) dropGem(e.x, e.y, T.xp);
    if (e.type === 6) for (let i = 0; i < 3; i++) spawn(7, e.x + rnd(-14, 14), e.y + rnd(-14, 14));
    if (e.type === 11) { G.wardens++; drop(PICK.heart, { x: e.x + 30, y: e.y }); text(e.x, e.y - 50, 'Warden down!', '#c9a8ff'); }
    if (T.chest) G.pickups.push({ id: uid++, k: PICK.chest, x: e.x, y: e.y });
    else { const r = Math.random(); if (r < 0.004) { if (!G.cz.famine) drop(PICK.heart, e); } else if (r < 0.0055) drop(PICK.magnet, e); else if (r < 0.03) drop(PICK.coin, e); }
    if (p && hasBoon(p, 'blood') && Math.random() < 0.06) p.hp = Math.min(p.st.maxhp, p.hp + 3);
  }
  const drop = (k, e) => G.pickups.push({ id: uid++, k, x: e.x, y: e.y });
  function dropGem(x, y, v) {
    if (G.gems.size > 380) { for (const g of G.gems.values()) { g.v += v; break; } return; }
    const g = { id: uid++, x: x + rnd(-6, 6), y: y + rnd(-6, 6), v }; G.gems.set(g.id, g); G.ev.push(['g+', g.id, g.x | 0, g.y | 0, v]);
  }
  function addXp(v, p) {
    G.xp += v * (p ? p.st.xp : 1);
    while (G.xp >= G.xpNeed) { G.xp -= G.xpNeed; G.level++; G.xpNeed = need(G.level) * (0.7 + 0.3 * G.n); G.pendLv++; }
  }

  // ---------- weapons ----------
  function shot(p, w, k, a, spd, dmg, o) {
    if (G.shots.length > 420) return;
    G.shots.push({ id: uid++, k, x: o.x != null ? o.x : p.x, y: o.y != null ? o.y : p.y, vx: Math.cos(a) * spd, vy: Math.sin(a) * spd, r: o.r || 6, dmg, p, wid: w.id, el: WEAPONS[w.id].el,
      pierce: o.pierce || 0, boom: o.boom || 0, life: o.life || 1, t: 0, hit: new Set(), ret: !!o.ret, rehit: o.rehit || 0, rt: 0, frz: !!o.frz });
  }
  function zone(k, x, y, r, life, dmg, p, wid, slow) {
    if (G.zones.length > 160) G.zones.shift();
    const z = { k, x, y, r, life, dmg, p, wid, el: wid ? WEAPONS[wid].el : null, tt: 0, slow };
    G.zones.push(z); return z;
  }
  function lineHit(p, a, len, wdt, fn) {
    const cx = Math.cos(a), cy = Math.sin(a);
    for (const e of G.enemies) { if (e.dead) continue; const dx = e.x - p.x, dy = e.y - p.y, t = dx * cx + dy * cy; if (t > 0 && t < len + e.r && Math.abs(dx * cy - dy * cx) < wdt + e.r) fn(e); }
  }
  const FIRE = {
    darts(p, w) {
      const n = 1 + (w.lvl >> 1) + p.st.proj + (w.evo ? 2 : 0), used = new Set(), tg = [];
      for (let i = 0; i < n; i++) { const e = near(p.x, p.y, 540, used); if (!e) break; used.add(e); tg.push(e); }
      if (!tg.length) return 0;
      for (let i = 0; i < n; i++) { const e = tg[i % tg.length]; shot(p, w, SHOT.dart, Math.atan2(e.y - p.y, e.x - p.x) + (i >= tg.length ? rnd(-0.2, 0.2) : 0), 560, wd(p, w, 12 + 5 * w.lvl), { pierce: w.evo ? 1 : 0, boom: w.evo ? 62 * p.st.area : 0, life: 1.1 }); }
      return 0.9;
    },
    chime(p, w) {
      const r = (105 + 12 * w.lvl) * p.st.area * (w.evo ? 1.4 : 1), d = wd(p, w, 11 + 6 * w.lvl);
      fx('r', p.x | 0, p.y | 0, r | 0, '#7fd8ff');
      inR(p.x, p.y, r, e => { if (w.evo) e.frozen = Math.max(e.frozen, 1.2); hit(e, d, p, w.id, 'frost'); });
      return 2.6;
    },
    hail(p, w) {
      const n = 2 + w.lvl + p.st.proj, d = wd(p, w, 9 + 4 * w.lvl);
      for (let i = 0; i < n; i++) shot(p, w, SHOT.hail, rnd(0, 6.283), 430, d, { pierce: w.evo ? 4 : 2, life: 1 });
      return w.evo ? 0.45 : 1.4;
    },
    chain(p, w) {
      let e = near(p.x, p.y, 470); if (!e) return 0;
      const used = new Set(), d = wd(p, w, 13 + 5 * w.lvl) * (w.evo ? 1.4 : 1); let lx = p.x, ly = p.y;
      for (let i = 2 + w.lvl + (w.evo ? 8 : 0) + p.st.proj; i > 0 && e; i--) { used.add(e); fx('b', lx | 0, ly | 0, e.x | 0, e.y | 0, '#ffe45c'); lx = e.x; ly = e.y; hit(e, d, p, w.id, 'storm'); e = near(lx, ly, 190, used); }
      return 1.5;
    },
    cloud(p, w) {
      const c = []; inR(p.x, p.y, 420, e => c.push(e)); if (!c.length) return 0;
      const r = 46 * (w.evo ? 1.7 : 1) * p.st.area, d = wd(p, w, 18 + 7 * w.lvl);
      for (let i = (w.evo ? 3 : 1) + (p.st.proj >> 1); i > 0; i--) { const e = c[Math.random() * c.length | 0]; fx('z', e.x | 0, e.y | 0, r | 0); inR(e.x, e.y, r, o => hit(o, d, p, w.id, 'storm')); }
      return 1.15;
    },
    thorns(p, w) {
      const c = []; inR(p.x, p.y, 380, e => c.push(e));
      const r = (46 + 6 * w.lvl) * p.st.area * (w.evo ? 1.7 : 1), d = wd(p, w, 5 + 3 * w.lvl);
      for (let i = 1 + (p.st.proj > 0 ? 1 : 0); i > 0; i--) { const e = c.length ? c[Math.random() * c.length | 0] : { x: p.x + rnd(-60, 60), y: p.y + rnd(-60, 60) }; zone(ZONE.thorn, e.x, e.y, r, 4 * p.st.dur, d, p, w.id, w.evo); }
      return 2.2;
    },
    sickle(p, w) {
      const e = near(p.x, p.y, 520), a = e ? Math.atan2(e.y - p.y, e.x - p.x) : Math.atan2(p.fy, p.fx), n = (w.evo ? 3 : 1) + (p.st.proj >> 1);
      for (let i = 0; i < n; i++) shot(p, w, SHOT.sickle, a + (i - (n - 1) / 2) * 0.5, 640 * Math.sqrt(p.st.area), wd(p, w, 20 + 8 * w.lvl), { pierce: 1e9, life: 1.3, r: 17 * (w.evo ? 1.4 : 1), ret: true });
      return 1.8;
    },
    meteor(p, w) {
      const c = []; inR(p.x, p.y, 430, e => c.push(e)); if (!c.length) return 0;
      const r = (80 + 6 * w.lvl) * p.st.area, d = wd(p, w, 40 + 14 * w.lvl);
      for (let i = (w.evo ? 3 : 1) + (p.st.proj >> 1); i > 0; i--) { const e = c[Math.random() * c.length | 0], x = e.x, y = e.y; fx('x', x | 0, y | 0, r | 0, '#ff7a2a'); inR(x, y, r, o => hit(o, d, p, w.id, 'ember')); zone(ZONE.fire, x, y, r * 0.6, 2 * p.st.dur, d * 0.15, p, w.id); }
      return 3;
    },
    brand(p, w) {
      const r = (105 + 8 * w.lvl) * p.st.area * (w.evo ? 1.35 : 1), d = wd(p, w, 22 + 8 * w.lvl), e = near(p.x, p.y, r + 50);
      if (!e) return 0;
      const a = Math.atan2(e.y - p.y, e.x - p.x);
      fx('r', p.x | 0, p.y | 0, r | 0, '#ff8a3c');
      inR(p.x, p.y, r, o => { let da = Math.abs(Math.atan2(o.y - p.y, o.x - p.x) - a); if (da > Math.PI) da = 6.283 - da; if (w.evo || da < 1.1) hit(o, d, p, w.id, 'ember'); });
      return 1.2;
    },
    icicle(p, w) {
      let e = null; inR(p.x, p.y, 520, o => { if (!e || o.hp > e.hp) e = o; }); if (!e) return 0;
      const a = Math.atan2(e.y - p.y, e.x - p.x), n = 1 + (p.st.proj >> 1);
      for (let i = 0; i < n; i++) shot(p, w, SHOT.hail, a + (i - (n - 1) / 2) * 0.25, 540, wd(p, w, 45 + 18 * w.lvl), { pierce: 1e9, life: 1.2, r: 11, boom: w.evo ? 70 * p.st.area : 0, frz: w.evo });
      return 2.4;
    },
    orb(p, w) {
      const e = near(p.x, p.y, 520), a0 = e ? Math.atan2(e.y - p.y, e.x - p.x) : rnd(0, 6.283), n = (w.evo ? 2 : 1) + (p.st.proj >> 1);
      for (let i = 0; i < n; i++) shot(p, w, SHOT.orb, a0 + i * 6.283 / n, 130, wd(p, w, 10 + 4 * w.lvl), { pierce: 1e9, life: 4 * p.st.dur, r: (22 + 2 * w.lvl) * Math.sqrt(p.st.area) * (w.evo ? 1.4 : 1), rehit: 0.4 });
      return 3.2;
    },
    rod(p, w) {
      const z = zone(ZONE.rod, p.x, p.y, 16, 6 * (w.evo ? 2 : 1) * p.st.dur, wd(p, w, 12 + 5 * w.lvl), p, w.id);
      z.n = (w.evo ? 3 : 1) + (w.lvl >= 3 ? 1 : 0); z.range = 220 * p.st.area;
      return 5;
    },
    vine(p, w) {
      const used = new Set(), len = (230 + 10 * w.lvl) * p.st.area, d = wd(p, w, 16 + 6 * w.lvl);
      for (let i = (w.evo ? 3 : 1) + (p.st.proj >> 1); i > 0; i--) {
        const e = near(p.x, p.y, len + 30, used); if (!e) break; used.add(e);
        const a = Math.atan2(e.y - p.y, e.x - p.x);
        fx('b', p.x | 0, p.y | 0, p.x + Math.cos(a) * len | 0, p.y + Math.sin(a) * len | 0, '#8be06a');
        lineHit(p, a, len, 22, o => hit(o, d, p, w.id, 'bloom'));
      }
      return used.size ? 1.1 : 0;
    },
    sprout(p, w) {
      const mine = G.zones.filter(z => z.k === ZONE.sprout && z.p === p && z.life > 0), max = (w.evo ? 2 : 1) + (p.st.proj > 0 ? 1 : 0);
      if (mine.length >= max) mine[0].life = 0;
      const z = zone(ZONE.sprout, p.x + rnd(-30, 30), p.y + rnd(-30, 30), 14, 9 * p.st.dur, wd(p, w, 9 + 4 * w.lvl), p, w.id);
      z.evo = w.evo; z.w = w;
      return 4.5;
    },
    judge(p, w) {
      const r = 430 * p.st.area, d = wd(p, w, 30 + 15 * w.lvl); if (!near(p.x, p.y, r)) return 0;
      fx('r', p.x | 0, p.y | 0, r | 0, '#ffffff'); fx('x', p.x | 0, p.y | 0, r * 0.5 | 0, '#fffbe6');
      inR(p.x, p.y, r, e => { if (w.evo && !e.big && e.hp < e.maxhp * 0.3) hit(e, e.hp + 1, p, w.id, null, 3); else hit(e, d, p, w.id, 'light'); });
      return w.evo ? 5 : 9;
    },
  };
  function weapons(p) {
    for (const w of p.weapons) {
      const f = FIRE[w.id];
      if (f) { w.t -= DT; if (w.t <= 0) { const cd = f(p, w); w.t = cd ? cd / (p.st.cdr * (p.rigT > 0 ? 2 : 1) * (p.ultT > 0 && p.char === 'pip' ? 3 : 1)) : 0.25; if (cd && hasBoon(p, 'echo') && Math.random() < 0.2) w.t = 0.12; } continue; }
      if (w.id === 'rime') {
        w.acc += DT;
        const r = (90 + 8 * w.lvl) * p.st.area * (w.evo ? 1.5 : 1);
        G.auras.push(ZONE.aura, p.x | 0, p.y | 0, r | 0);
        if (w.acc >= 0.5) { w.acc = 0; const d = wd(p, w, 4 + 2 * w.lvl); inR(p.x, p.y, r, e => { if (w.evo && Math.random() < 0.15) e.frozen = Math.max(e.frozen, 0.8); hit(e, d, p, w.id, 'frost'); }); }
      } else if (w.id === 'halo') {
        const max = w.evo ? 2 : 1;
        if (p.ward < max) { w.acc += DT; if (w.acc >= 6 / p.st.cdr) { w.acc = 0; p.ward++; } }
      } else if (w.id === 'trail') {
        w.acc += DT;
        if (p.mv && w.acc >= 0.22) { w.acc = 0; zone(ZONE.fire, p.x, p.y, 24 * (w.evo ? 1.8 : 1) * p.st.area, 2.2 * (w.evo ? 2 : 1) * p.st.dur, wd(p, w, 5 + 3 * w.lvl), p, w.id); }
      } else if (w.id === 'moths') {
        w.a += DT * (w.evo ? 4.2 : 3);
        const n = 2 + (w.lvl >> 1) + p.st.proj + (w.evo ? 3 : 0), R = 72 * (w.evo ? 1.5 : 1) * p.st.area, d = wd(p, w, 8 + 4 * w.lvl);
        if (w.hits.size > 700) w.hits.clear();
        for (let i = 0; i < n; i++) {
          const a = w.a + i / n * 6.283, ox = p.x + Math.cos(a) * R, oy = p.y + Math.sin(a) * R;
          G.orbs.push(ox | 0, oy | 0);
          inR(ox, oy, 13, e => { if ((w.hits.get(e.id) || 0) < G.t) { w.hits.set(e.id, G.t + 0.45); hit(e, d, p, w.id, 'bloom'); } });
        }
      } else if (w.id === 'beam') {
        w.a += DT * 2.2; w.acc += DT;
        const len = (150 + 22 * w.lvl) * p.st.area * (w.evo ? 1.6 : 1), tick = w.acc >= 0.2, d = wd(p, w, 6 + 3 * w.lvl);
        if (tick) w.acc = 0;
        for (let b = 0; b < (w.evo ? 2 : 1); b++) {
          const a = w.a + b * Math.PI, cx = Math.cos(a), cy = Math.sin(a);
          G.beams.push(p.x | 0, p.y | 0, Math.round(a * 100), len | 0);
          if (tick) for (const e of G.enemies) {
            if (e.dead) continue;
            const dx = e.x - p.x, dy = e.y - p.y, t = dx * cx + dy * cy;
            if (t > 0 && t < len + e.r && Math.abs(dx * cy - dy * cx) < 15 + e.r) hit(e, d, p, w.id, 'light');
          }
        }
      }
    }
  }
  function skill(p) {
    if (p.down || p.skillT > 0) return;
    const lv = 1 + G.level * 0.1, c = p.char;
    p.skillT = CHARS[c].cd / Math.min(1.6, p.st.cdr) * ((p.meta.f || {}).skillCd || 1);
    if (c === 'wick') p.dashT = 0.28;
    else if (c === 'mara') { const r = 230 * p.st.area; fx('r', p.x | 0, p.y | 0, r | 0, '#bfeeff'); inR(p.x, p.y, r, e => { e.frozen = Math.max(e.frozen, 2.2); hit(e, 30 * lv * p.st.dmg, p, 'skill', 'frost'); }); }
    else if (c === 'tolliver') { const r = 140 * p.st.area; fx('z', p.x | 0, p.y | 0, r | 0); inR(p.x, p.y, r, e => hit(e, 45 * lv * p.st.dmg, p, 'skill', 'storm')); }
    else if (c === 'bryn') zone(ZONE.heal, p.x, p.y, 150 * p.st.area, 4.5, 0, p, null);
    else if (c === 'oda') { const r = 200 * p.st.area; fx('r', p.x | 0, p.y | 0, r | 0, '#d0a8ff'); inR(p.x, p.y, r, e => { hit(e, 25 * lv * p.st.dmg, p, 'skill', 'bloom'); mark(e, 'rot', p, 'bloom'); mark(e, 'rot', p, 'bloom'); }); }
    else if (c === 'sable') zone(ZONE.beacon, p.x, p.y, 170 * p.st.area, 6, 0, p, null);
    else if (c === 'pip') { for (const w of p.weapons) w.t = 0; p.rigT = 3; }
    else if (c === 'gran') { const r = 260 * p.st.area; fx('r', p.x | 0, p.y | 0, r | 0, '#ffffff'); inR(p.x, p.y, r, e => { e.frozen = Math.max(e.frozen, 2); hit(e, 20 * lv * p.st.dmg, p, 'skill', 'light'); }); }
  }
  function ult(p) {
    if (p.down || p.ultCd > 0 || G.level < 6) return;
    const lv = (1 + G.level * 0.1) * p.st.dmg, c = p.char;
    p.ultCd = 45 / Math.min(1.6, p.st.cdr) * ((p.meta.f || {}).ultCd || 1);
    text(p.x, p.y - 44, CHARS[c].ult + '!', CHARS[c].c);
    if (c === 'wick' || c === 'tolliver') { p.ultT = 5; p.ultAcc = 1; }
    else if (c === 'oda') { p.ultT = 4; p.inv = 4; }
    else if (c === 'sable') { p.ultT = 1.6; p.ultAcc = 1; }
    else if (c === 'pip') p.ultT = 6;
    else if (c === 'gran') { for (const q of G.players) { if (q.down) { q.down = false; fx('r', q.x | 0, q.y | 0, 120, '#fff'); q.hp = q.st.maxhp * 0.5; } else q.hp = Math.min(q.st.maxhp, q.hp + q.st.maxhp * 0.3); q.inv = 4; } fx('r', p.x | 0, p.y | 0, 400, '#ffffff'); }
    else if (c === 'mara') { fx('r', p.x | 0, p.y | 0, 620, '#bfeeff'); fx('x', p.x | 0, p.y | 0, 300, '#bfeeff'); inR(p.x, p.y, 620, e => { e.frozen = Math.max(e.frozen, 4); e.chill = 6; hit(e, 60 * lv, p, 'ult', 'frost'); }); }
    else {
      for (const q of G.players) { if (q.down) { q.down = false; q.inv = 3; q.hp = q.st.maxhp * 0.6; fx('r', q.x | 0, q.y | 0, 120, '#9dffb0'); } else q.hp = Math.min(q.st.maxhp, q.hp + q.st.maxhp * 0.5); }
      fx('r', p.x | 0, p.y | 0, 300, '#8be06a');
      zone(ZONE.thorn, p.x, p.y, 300 * p.st.area, 7, 12 * lv, p, 'thorns', true);
    }
  }
  function ultTick(p) {
    p.ultT -= DT; p.ultAcc += DT;
    if (p.char === 'oda' && p.ultT <= 0) { const r = 360 * p.st.area; fx('r', p.x | 0, p.y | 0, r | 0, '#d0a8ff'); fx('x', p.x | 0, p.y | 0, r | 0, '#8be06a'); inR(p.x, p.y, r, e => { hit(e, 120 * (1 + G.level * 0.1) * p.st.dmg, p, 'ult', 'bloom'); mark(e, 'rot', p, 'bloom'); mark(e, 'rot', p, 'bloom'); }); }
    if (p.char === 'sable' && p.ultAcc >= 0.5) { p.ultAcc = 0; const r = 540 * p.st.area; fx('r', p.x | 0, p.y | 0, r | 0, '#fff2b0'); inR(p.x, p.y, r, e => hit(e, 45 * (1 + G.level * 0.1) * p.st.dmg, p, 'ult', 'light')); }
    const lv = (1 + G.level * 0.1) * p.st.dmg;
    if (p.char === 'wick' && p.ultAcc >= 0.5) { p.ultAcc = 0; const r = 250 * p.st.area; fx('r', p.x | 0, p.y | 0, r | 0, '#ff7a2a'); inR(p.x, p.y, r, e => hit(e, 28 * lv, p, 'ult', 'ember')); }
    else if (p.char === 'tolliver' && p.ultAcc >= 0.15) { p.ultAcc = 0; const c = []; inR(p.x, p.y, 520, e => c.push(e)); if (c.length) { const e = c[Math.random() * c.length | 0]; fx('z', e.x | 0, e.y | 0, 60); inR(e.x, e.y, 60, o => hit(o, 40 * lv, p, 'ult', 'storm')); } }
  }

  // ---------- players ----------
  function hurt(p, d) {
    if (p.down || p.inv > 0 || p.dashT > 0) return;
    if (p.ward > 0) { // Halo: block the hit and burst
      p.ward--; p.inv = 0.6;
      const w = p.weapons.find(w => w.id === 'halo'), r = 135 * p.st.area;
      fx('r', p.x | 0, p.y | 0, r | 0, '#ffffff');
      if (w) { const dm = wd(p, w, 50 + 20 * w.lvl); inR(p.x, p.y, r, e => hit(e, dm, p, 'halo', 'light')); if (w.evo) p.hp = Math.min(p.st.maxhp, p.hp + p.st.maxhp * 0.08); }
      return;
    }
    p.hp -= Math.max(1, d - p.st.armor); p.inv = 0.3; // brief grace so a crowd cannot delete you in one instant
    if (p.hp > 0) return;
    if (hasBoon(p, 'second') && !p.usedSecond) { p.usedSecond = true; p.hp = p.st.maxhp * 0.5; p.inv = 3; text(p.x, p.y - 30, 'Second Wind!', '#fff'); fx('r', p.x | 0, p.y | 0, 150, '#fff'); return; }
    p.hp = 0; p.down = true; p.deaths++; p.rev = 0; p.downT = Math.min(40, 12 + 6 * (p.deaths - 1));
    if (G.players.every(q => q.down)) G.over = { win: false };
  }
  function players() {
    for (const p of G.players) {
      if (p.inv > 0) p.inv -= DT;
      if (p.skillT > 0) p.skillT -= DT;
      if (p.ultCd > 0) p.ultCd -= DT;
      if (p.down) {
        let mates = 0; for (const q of G.players) if (!q.down && (q.x - p.x) ** 2 + (q.y - p.y) ** 2 < 75 * 75) mates++;
        p.rev = mates ? p.rev + DT / 3 * (0.5 + 0.5 * mates) : Math.max(0, p.rev - DT * 0.5);
        p.downT -= DT;
        if (p.rev >= 1 || p.downT <= 0) { p.down = false; p.hp = p.st.maxhp * 0.5; p.inv = 3; fx('r', p.x | 0, p.y | 0, 120, '#fff'); }
        continue;
      }
      p.still = p.mv ? 0 : p.still + DT;
      p.hp = Math.min(p.st.maxhp, p.hp + (p.st.regen + (hasBoon(p, 'roots') && p.still > 0.5 ? p.st.maxhp * 0.04 : 0)) * DT);
      p.kin = 1;
      if (hasBoon(p, 'kindred')) { let m = 0; for (const q of G.players) if (q !== p && !q.down && (q.x - p.x) ** 2 + (q.y - p.y) ** 2 < 260 * 260) m++; p.kin = 1 + 0.08 * m; }
      if (hasBoon(p, 'berserk')) p.kin *= 1 + (1 - p.hp / p.st.maxhp) * 0.8;
      if (p.ultT > 0) ultTick(p);
      if (p.rigT > 0) p.rigT -= DT;
      if (p.beaconT > 0) { p.beaconT -= DT; p.kin *= 1.25; }
      if (p.dashT > 0) { p.dashT -= DT; zone(ZONE.fire, p.x, p.y, 34 * p.st.area, 2.5 * p.st.dur, (10 + 2 * G.level) * p.st.dmg, p, 'darts'); }
      weapons(p);
      const pr = p.st.pickup * p.st.pickup;
      for (const g of G.gems.values()) { const dx = g.x - p.x, dy = g.y - p.y; if (dx * dx + dy * dy < pr) { G.gems.delete(g.id); G.ev.push(['g-', g.id, p.id]); addXp(g.v, p); } }
      for (const k of G.pickups) {
        if (k.dead || (k.x - p.x) ** 2 + (k.y - p.y) ** 2 > 36 * 36) continue;
        k.dead = true;
        if (k.k === PICK.heart) { for (const q of G.players) if (!q.down) q.hp = Math.min(q.st.maxhp, q.hp + q.st.maxhp * 0.25); text(p.x, p.y - 30, 'Healed', '#ff8fa3'); }
        else if (k.k === PICK.magnet) { for (const g of G.gems.values()) { G.ev.push(['g-', g.id, p.id]); addXp(g.v, p); } G.gems.clear(); }
        else if (k.k === PICK.coin) G.coins += 5;
        else G.pendChest++;
      }
      p.mv = false;
    }
    G.pickups = G.pickups.filter(k => !k.dead);
  }
  function input(pid, m) {
    const p = player(pid); if (!p || !G || G.pause || G.over) return;
    if (!p.down) {
      const nx = Math.max(-WORLD, Math.min(WORLD, m.x)), ny = Math.max(-WORLD, Math.min(WORLD, m.y));
      if (Math.abs(nx - p.x) + Math.abs(ny - p.y) > 0.5) p.mv = true;
      p.x = nx; p.y = ny; if (m.fx || m.fy) { p.fx = m.fx; p.fy = m.fy; }
    }
    if (m.sk & 1) skill(p);
    if (m.sk & 2) ult(p);
  }

  // ---------- enemies ----------
  function spawn(type, x, y, hpMul) {
    const T = ENEMIES[type], hs = 1 + (G.t / 60) * 0.3 + (G.t / 60) ** 2 * 0.022;
    const hp = T.hp * hs * (hpMul || 1) * G.dm.hp;
    const e = { id: uid++, type, x: Math.max(-WORLD - 80, Math.min(WORLD + 80, x)), y: Math.max(-WORLD - 80, Math.min(WORLD + 80, y)), hp, maxhp: hp, spd: T.spd * rnd(0.9, 1.1) * (G.curse > 0 ? 1.25 : 1) * (G.cz.swift ? 1.25 : 1), dmg: T.dmg * (1 + G.t / 600) * G.dm.dmg, r: T.r,
      burn: 0, chill: 0, shock: 0, rot: 0, rotN: 0, frozen: 0, slow: 0, hc: 0, rc: 0, shT: 0, st: null, bt: 0, big: !!T.big, at: rnd(1, 3), src: null, dead: false };
    G.enemies.push(e); return e;
  }
  function spawner() {
    const alive = G.players.filter(p => !p.down); if (!alive.length) return;
    const n = G.n, tm = G.t / 60, around = (d0, d1) => { const p = alive[Math.random() * alive.length | 0], a = rnd(0, 6.283), d = rnd(d0, d1); return [p.x + Math.cos(a) * d, p.y + Math.sin(a) * d]; };
    const rate = (0.8 + tm * 0.95 + tm * tm * 0.06) * (0.55 + 0.45 * n) * (G.boss ? 0.45 : 1) * (G.curse > 0 ? 1.8 : 1) * (G.cz.horde ? 1.4 : 1);
    const cap = Math.min(330, 30 + G.t * 0.5 * (0.6 + 0.4 * n));
    G.acc += rate * DT;
    while (G.acc >= 1) {
      G.acc--; if (G.enemies.length >= cap) continue;
      const [x, y] = around(640, 780), r = Math.random() * 22, mire = G.map === 'mire';
      if (G.t > 70 && r < 4) { for (let i = 0; i < 4; i++) spawn(1, x + rnd(-30, 30), y + rnd(-30, 30)); }
      else if (G.t > 170 && r < 5.5) spawn(2, x, y);
      else if (G.t > 260 && r < (mire ? 8 : 7)) spawn(3, x, y);
      else if (G.t > 210 && r < 9.2) spawn(6, x, y);
      else if (G.t > 300 && r < 10.4) spawn(9, x, y);
      else if (G.t > 390 && r < 11 && G.enemies.filter(e => e.type === 8).length < 4) spawn(8, x, y);
      else if (G.t > (mire ? 150 : 450) && r < (mire ? 13.5 : 12.2)) spawn(10, x, y);
      else spawn(0, x, y);
    }
    // mini-bosses, surges and the Dark Bargain
    if (!G.boss && G.t >= G.nextWarden) { G.nextWarden += 240; const [x, y] = around(620, 680); spawn(11, x, y, 0.5 + 0.5 * n); if (G.cz.twins) spawn(11, x + 90, y, 0.5 + 0.5 * n); text(alive[0].x, alive[0].y - 60, 'A Gloom Warden has found you', '#c9a8ff'); }
    if (!G.boss && G.t >= G.nextSurge) {
      G.nextSurge += 200; const p = alive[Math.random() * alive.length | 0], c = 26 + 10 * n;
      for (let i = 0; i < c; i++) spawn(0, p.x + Math.cos(i / c * 6.283) * 540, p.y + Math.sin(i / c * 6.283) * 540);
      text(p.x, p.y - 60, 'The Gloom closes in!', '#ff6b5c');
    }
    if (!G.altar && G.curse <= 0 && !G.boss && G.t >= G.nextAltar) { const [x, y] = around(260, 400); G.altar = { x: Math.max(-WORLD + 150, Math.min(WORLD - 150, x)), y: Math.max(-WORLD + 150, Math.min(WORLD - 150, y)), r: 85, prog: 0, life: 45 }; }
    if (G.altar) {
      const a = G.altar; let c = 0; for (const p of alive) if ((p.x - a.x) ** 2 + (p.y - a.y) ** 2 < a.r * a.r) c++;
      a.prog = c ? a.prog + DT * 0.3 : Math.max(0, a.prog - DT * 0.3); a.life -= DT;
      if (a.prog >= 1) { G.curse = 45; G.altar = null; fx('r', a.x | 0, a.y | 0, 500, '#b070ff'); text(a.x, a.y - 40, 'Bargain struck: survive!', '#c9a8ff'); }
      else if (a.life <= 0) { G.altar = null; G.nextAltar = G.t + 150; }
    }
    if (G.curse > 0) {
      G.curse -= DT;
      if (G.curse <= 0) { G.bargains++; G.nextAltar = G.t + 170; G.coins += 40; G.pendChest++; addXp(G.xpNeed * 1.5, null); text(alive[0].x, alive[0].y - 60, 'Bargain kept: reward!', '#ffd27a'); }
    }
    if (!G.boss && G.t >= G.nextElite) { G.nextElite += 80; const [x, y] = around(640, 700); spawn(4, x, y, 0.5 + 0.5 * n); if (G.cz.twins) spawn(4, x + 70, y, 0.5 + 0.5 * n); text(alive[0].x, alive[0].y - 60, 'An elite approaches', '#ff6b5c'); }
    if (!G.shrine && G.t >= G.nextShrine && !G.boss) { const [x, y] = around(280, 430); G.shrine = { x: Math.max(-WORLD + 150, Math.min(WORLD - 150, x)), y: Math.max(-WORLD + 150, Math.min(WORLD - 150, y)), r: 105, prog: 0 }; }
    if (!G.boss && G.t >= G.bossTime) { const [x, y] = around(560, 600); G.boss = spawn(5, x, y, (0.5 + 0.5 * n) / (1 + (G.t / 60) * 0.3 + (G.t / 60) ** 2 * 0.022) * (1 + G.level * 0.06)); G.boss.st = 'idle'; G.boss.bt = 2; G.boss.born = G.t; G.boss.seq = 0; fx('r', x | 0, y | 0, 300, '#e8e0ff'); }
    if (G.shrine) {
      const s = G.shrine; let c = 0; for (const p of alive) if ((p.x - s.x) ** 2 + (p.y - s.y) ** 2 < s.r * s.r) c++;
      if (c) s.prog += DT * 0.13 * (0.6 + 0.4 * c);
      if (s.prog >= 1) { fx('r', s.x | 0, s.y | 0, 400, '#ffd27a'); inR(s.x, s.y, 400, e => hit(e, 80 * (1 + G.level * 0.2), null, 'shrine', null, 3)); G.shrine = null; G.shrines++; G.nextShrine = G.t + 110; G.pendBoon++; }
    }
  }
  function eshot(e, a, spd, dmg) { G.shots.push({ id: uid++, k: SHOT.spit, x: e.x, y: e.y, vx: Math.cos(a) * spd, vy: Math.sin(a) * spd, r: 7, dmg, enemy: true, life: 5, t: 0 }); }
  function bossAI(e, tp, d, dx, dy) {
    const enr = G.cz.enrage || G.t - e.born > 100; e.bt -= DT;
    if (e.st === 'idle') {
      e.x += dx / d * e.spd * DT; e.y += dy / d * e.spd * DT;
      if (e.bt <= 0) {
        const k = e.seq++ % 3;
        if (k === 0) { e.st = 'wind'; e.bt = 0.8; e.cx = dx / d; e.cy = dy / d; }
        else if (k === 1) { for (let r = 0; r < (enr ? 2 : 1); r++) for (let i = 0; i < 18; i++) eshot(e, i / 18 * 6.283 + r * 0.17, 170 + r * 60, e.dmg * 0.6); e.bt = enr ? 1 : 1.8; }
        else { for (let i = 0; i < 5 + 2 * G.n; i++) spawn(1, e.x + rnd(-90, 90), e.y + rnd(-90, 90)); e.bt = enr ? 1 : 1.8; }
      }
    } else if (e.st === 'wind') { if (e.bt <= 0) { e.st = 'dash'; e.bt = 0.75; } }
    else { e.x += e.cx * 580 * DT; e.y += e.cy * 580 * DT; if (e.bt <= 0) { e.st = 'idle'; e.bt = enr ? 0.9 : 1.7; } }
    if (d < e.r + 14 && e.hc <= 0) { hurt(tp, e.dmg * (e.st === 'dash' ? 1.5 : 1) * (enr ? 1.5 : 1)); e.hc = 0.7; }
  }
  function bellAI(e, tp, d, dx, dy) { // The Drowned Bell: spirals of shots, a tolling shockwave, and wisps
    const enr = G.cz.enrage || G.t - e.born > 100; e.bt -= DT;
    if (e.st !== 'wind') { e.x += dx / d * e.spd * 0.6 * DT; e.y += dy / d * e.spd * 0.6 * DT; }
    if (e.st === 'spiral') { e.sa += DT * 2.4; e.sc += DT; if (e.sc >= 0.09) { e.sc = 0; eshot(e, e.sa, 190, e.dmg * 0.5); eshot(e, e.sa + Math.PI, 190, e.dmg * 0.5); if (enr) eshot(e, e.sa + 1.57, 190, e.dmg * 0.5); } if (e.bt <= 0) { e.st = 'idle'; e.bt = enr ? 0.8 : 1.5; } }
    else if (e.st === 'wind') { if (e.bt <= 0) { const r = enr ? 380 : 320; fx('r', e.x | 0, e.y | 0, r, '#7fe0d0'); fx('x', e.x | 0, e.y | 0, r, '#2f8f80'); for (const p of G.players) if (!p.down && (p.x - e.x) ** 2 + (p.y - e.y) ** 2 < r * r) hurt(p, e.dmg * 1.6); e.st = 'idle'; e.bt = enr ? 0.8 : 1.5; } }
    else if (e.bt <= 0) {
      const k = e.seq++ % 3;
      if (k === 0) { e.st = 'spiral'; e.bt = 2.4; e.sa = Math.atan2(dy, dx); e.sc = 0; }
      else if (k === 1) { e.st = 'wind'; e.bt = 1.1; text(e.x, e.y - 70, 'The bell tolls: get clear!', '#7fe0d0'); }
      else { for (let i = 0; i < 3 + 2 * G.n; i++) spawn(10, e.x + rnd(-120, 120), e.y + rnd(-120, 120)); e.bt = enr ? 1 : 1.8; }
    }
    if (d < e.r + 14 && e.hc <= 0) { hurt(tp, e.dmg * (enr ? 1.5 : 1)); e.hc = 0.7; }
  }
  function enemies() {
    const dot = (G.dotT += DT) >= 0.5; if (dot) G.dotT = 0;
    const alive = G.players.filter(p => !p.down);
    const L = G.enemies;
    for (let i = 0; i < L.length; i++) {
      const e = L[i]; if (e.dead) continue;
      if (e.burn > 0) e.burn -= DT; if (e.chill > 0) e.chill -= DT; if (e.shock > 0) e.shock -= DT;
      if (e.rot > 0) { e.rot -= DT; if (e.rot <= 0) e.rotN = 0; }
      if (e.frozen > 0) e.frozen -= DT; if (e.slow > 0) e.slow -= DT; if (e.hc > 0) e.hc -= DT; if (e.rc > 0) e.rc -= DT; if (e.shT > 0) e.shT -= DT;
      if (dot) {
        const sd = e.src ? e.src.st.dmg : 1, lv = 1 + G.level * 0.08;
        if (e.burn > 0) hit(e, 5 * lv * sd * (e.src && hasBoon(e.src, 'pyre') ? 2 : 1), e.src, 'dot', null, 3);
        if (e.rot > 0 && !e.dead) hit(e, 2.2 * e.rotN * lv * sd, e.src, 'dot', null, 3);
        if (e.dead) continue;
      }
      let tp = null, bd = 1e12;
      for (const p of alive) { const q = (p.x - e.x) ** 2 + (p.y - e.y) ** 2; if (q < bd) { bd = q; tp = p; } }
      if (!tp) continue;
      const dx = tp.x - e.x, dy = tp.y - e.y, d = Math.sqrt(bd) || 1, big = e.big;
      if (e.type === 5) { (G.map === 'mire' ? bellAI : bossAI)(e, tp, d, dx, dy); continue; }
      if (d > 1500) { e.dead = true; continue; } // left far behind: quietly remove
      const sp = e.spd * (e.frozen > 0 && !big ? 0 : 1) * (e.chill > 0 ? (big ? 0.85 : e.src && hasBoon(e.src, 'perma') ? 0.35 : 0.6) : 1) * (e.slow > 0 ? 0.65 : 1) * DT;
      if (e.type === 3) {
        const dir = d < 220 ? -0.7 : d > 300 ? 1 : 0;
        e.x += (dx / d * dir - dy / d * (dir ? 0 : 0.5)) * sp; e.y += (dy / d * dir + dx / d * (dir ? 0 : 0.5)) * sp;
        e.at -= DT; if (e.at <= 0 && d < 540 && e.frozen <= 0) { e.at = 2.6; eshot(e, Math.atan2(dy, dx), 190, e.dmg); }
      } else if (e.type === 9) { // Ram: wind up, then charge in a straight line
        if (e.st === 'dash') { if (e.frozen <= 0) { e.x += e.cx * 520 * DT; e.y += e.cy * 520 * DT; } e.bt -= DT; if (e.bt <= 0) { e.st = null; e.at = 2.5; } }
        else if (e.st === 'wind') { e.bt -= DT; if (e.bt <= 0) { e.st = 'dash'; e.bt = 0.55; } }
        else { e.x += dx / d * sp; e.y += dy / d * sp; e.at -= DT; if (d < 290 && e.at <= 0 && e.frozen <= 0) { e.st = 'wind'; e.bt = 0.6; e.cx = dx / d; e.cy = dy / d; } }
      } else if (e.type === 10) { // Wisp: rush in, flash, explode
        if (e.st === 'wind') { e.bt -= DT; if (e.bt <= 0) { fx('x', e.x | 0, e.y | 0, 85, '#ff5a2a'); for (const p of alive) if ((p.x - e.x) ** 2 + (p.y - e.y) ** 2 < 85 * 85) hurt(p, e.dmg); e.dead = true; continue; } }
        else { e.x += dx / d * sp; e.y += dy / d * sp; if (d < 46) { e.st = 'wind'; e.bt = 0.55; } }
      } else { e.x += dx / d * sp; e.y += dy / d * sp; }
      if (e.type === 8 && dot) inR(e.x, e.y, 125, o => { o.shT = 0.7; }); // Warder: halves damage to enemies near it
      if (e.type === 11) { e.at -= DT; if (e.at <= 0 && e.frozen <= 0) { e.at = 3; for (let i = 0; i < 12; i++) eshot(e, i / 12 * 6.283 + G.t, 160, e.dmg * 0.5); if (Math.random() < 0.5) for (let i = 0; i < 4; i++) spawn(7, e.x + rnd(-50, 50), e.y + rnd(-50, 50)); } }
      if (e.type !== 10 && d < e.r + 13 && e.hc <= 0) { hurt(tp, e.dmg * (e.st === 'dash' ? 1.5 : 1)); e.hc = 0.7; }
    }
    // keep enemies from stacking on one spot
    const grid = new Map(), C = 44;
    for (const e of L) { if (e.dead) continue; const k = ((e.x / C | 0) + 500) * 2048 + (e.y / C | 0) + 500; const c = grid.get(k); if (c) c.push(e); else grid.set(k, [e]); }
    const push = (a, b) => { const dx = b.x - a.x, dy = b.y - a.y, rr = a.r + b.r, q = dx * dx + dy * dy; if (q < rr * rr && q > 0.01) { const d = Math.sqrt(q), o = (rr - d) / d * 0.25, wa = b.big ? 2 : 1, wb = a.big ? 2 : 1; if (a.type !== 5) { a.x -= dx * o * wa; a.y -= dy * o * wa; } if (b.type !== 5) { b.x += dx * o * wb; b.y += dy * o * wb; } } };
    for (const [k, c] of grid) {
      for (let i = 0; i < c.length; i++) for (let j = i + 1; j < c.length; j++) push(c[i], c[j]);
      for (const nk of [k + 1, k + 2048, k + 2049, k + 2047]) { const o = grid.get(nk); if (o) for (const a of c) for (const b of o) push(a, b); }
    }
  }
  function shotsAndZones() {
    for (const s of G.shots) {
      s.t += DT; if (s.t >= s.life) { s.dead = true; continue; }
      let f = 1;
      if (s.ret) { f = 1 - 2 * s.t / s.life; if (f < 0 && !s.turned) { s.turned = true; s.hit.clear(); } }
      s.x += s.vx * f * DT; s.y += s.vy * f * DT;
      if (s.rehit && (s.rt += DT) >= s.rehit) { s.rt = 0; s.hit.clear(); }
      if (s.enemy) { for (const p of G.players) if (!p.down && (p.x - s.x) ** 2 + (p.y - s.y) ** 2 < (s.r + 13) ** 2) { hurt(p, s.dmg); s.dead = true; break; } continue; }
      const L = G.enemies;
      for (let i = 0; i < L.length; i++) {
        const e = L[i]; if (e.dead) continue;
        const dx = e.x - s.x, dy = e.y - s.y, rr = e.r + s.r;
        if (dx * dx + dy * dy > rr * rr || s.hit.has(e)) continue;
        s.hit.add(e); if (s.frz) e.frozen = Math.max(e.frozen, 1); hit(e, s.dmg, s.p, s.wid, s.el);
        if (s.boom) { fx('x', s.x | 0, s.y | 0, s.boom | 0, s.k === SHOT.hail ? '#7fd8ff' : '#ff8a3c'); inR(s.x, s.y, s.boom, o => { if (o !== e) hit(o, s.dmg * 0.6, s.p, s.wid, s.el); }); }
        if (--s.pierce < 0) { s.dead = true; break; }
      }
    }
    G.shots = G.shots.filter(s => !s.dead);
    for (const z of G.zones) {
      z.life -= DT; z.tt -= DT; if (z.tt > 0) continue;
      z.tt = 0.45;
      if (z.k === ZONE.rod) {
        const used = new Set();
        for (let i = 0; i < z.n; i++) { const e = near(z.x, z.y, z.range, used); if (!e) break; used.add(e); fx('b', z.x | 0, z.y - 20 | 0, e.x | 0, e.y | 0, '#ffe45c'); hit(e, z.dmg, z.p, z.wid, z.el); }
      } else if (z.k === ZONE.sprout) {
        const e = near(z.x, z.y, 420);
        if (e) shot(z.p, z.w, SHOT.seed, Math.atan2(e.y - z.y, e.x - z.x), 480, z.dmg, { x: z.x, y: z.y, pierce: z.evo ? 3 : 0, life: 1, r: 7 });
      } else if (z.k === ZONE.beacon) { for (const q of G.players) if (!q.down && (q.x - z.x) ** 2 + (q.y - z.y) ** 2 < z.r * z.r) q.beaconT = 0.6;
      } else if (z.k === ZONE.heal) { for (const p of G.players) if (!p.down && (p.x - z.x) ** 2 + (p.y - z.y) ** 2 < z.r * z.r) p.hp = Math.min(p.st.maxhp, p.hp + p.st.maxhp * 0.035); }
      else inR(z.x, z.y, z.r, e => { if (z.slow) e.slow = 0.8; hit(e, z.dmg, z.p, z.wid, z.el); });
    }
    G.zones = G.zones.filter(z => z.life > 0);
  }

  // ---------- upgrade cards ----------
  function sample(pool, n, out) {
    while (out.length < n && pool.length) {
      let tot = 0; for (const c of pool) tot += c.wt;
      let r = Math.random() * tot, i = 0; while (i < pool.length - 1 && (r -= pool[i].wt) > 0) i++;
      const c = pool.splice(i, 1)[0]; delete c.wt; out.push(c);
    }
    return out;
  }
  function cards(p, chest) {
    const out = [], pool = [], n = p.st.cards, own = id => p.charms.some(c => c.id === id);
    for (const w of p.weapons) { if (w.lvl >= 5 && !w.evo && (chest || own(WEAPONS[w.id].charm))) out.push({ k: 'evo', id: w.id, free: !own(WEAPONS[w.id].charm) }); else if (w.evo) pool.push({ k: 'aw', id: w.id, n: (w.aw || 0) + 1, wt: 1.6 }); else if (w.lvl < 5) pool.push({ k: 'w', id: w.id, lvl: w.lvl + 1, wt: 3 }); }
    const lock = p.meta.lock || [];
    if (p.weapons.length < p.wslots) for (const id in WEAPONS) if (!p.weapons.some(w => w.id === id) && lock.indexOf(id) < 0 && !p.banned['w' + id]) pool.push({ k: 'w', id, lvl: 1, wt: p.res[WEAPONS[id].el] ? 2.6 : 2 });
    for (const c of p.charms) if (c.lvl < 5) pool.push({ k: 'c', id: c.id, lvl: c.lvl + 1, wt: 3 });
    if (p.charms.length < 6) for (const id in CHARMS) if (!own(id) && !p.banned['c' + id]) pool.push({ k: 'c', id, lvl: 1, wt: p.weapons.some(w => WEAPONS[w.id].charm === id) ? 4 : 1.5 });
    sample(pool, n, out);
    // nothing left to level: endless Ascension upgrades that stack forever
    const asc = ASC.slice();
    while (out.length < n && asc.length) out.push({ k: 'asc', id: asc.splice(Math.random() * asc.length | 0, 1)[0] });
    return out.slice(0, Math.max(n, 1));
  }
  function boonCards(p) {
    const pool = []; for (const id in BOONS) if (!hasBoon(p, id) && !(id === 'kindred' && G.n < 2)) pool.push({ k: 'boon', id, wt: [0, 6, 3, 1.2][BOONS[id].r || 1] });
    const out = sample(pool, 3, []); return out.length ? out : [{ k: 'heal' }];
  }
  function redeal(pid, banIdx) { // reroll (banIdx undefined) or banish one new card for the rest of the night
    const z = G && G.pause, p = player(pid); if (!z || !p) return;
    const k = z.picks[pid]; if (!k || k.done) return;
    if (banIdx == null) { if (p.rerolls <= 0) return; p.rerolls--; }
    else { const c = k.cards[banIdx]; if (!c || (c.k !== 'w' && c.k !== 'c') || c.lvl !== 1 || p.banishes <= 0 || z.kind === 'boon') return; p.banishes--; p.banned[c.k + c.id] = 1; }
    k.cards = z.kind === 'boon' ? boonCards(p) : cards(p, z.kind === 'chest'); k.rr = p.rerolls; k.bn = p.banishes; k.fresh = true;
  }
  function applyCard(p, c) {
    if (c.k === 'w') { const w = p.weapons.find(w => w.id === c.id); if (w) w.lvl = Math.min(5, w.lvl + 1); else addWeapon(p, c.id); }
    else if (c.k === 'c') { const o = p.charms.find(x => x.id === c.id); if (o) o.lvl = Math.min(5, o.lvl + 1); else p.charms.push({ id: c.id, lvl: 1 }); }
    else if (c.k === 'evo') { const w = p.weapons.find(w => w.id === c.id); if (w && !w.evo) { w.evo = true; G.evos++; fx('r', p.x | 0, p.y | 0, 320, '#ffd27a'); fx('x', p.x | 0, p.y | 0, 160, '#ffd27a'); G.ev.push(['t', p.x | 0, p.y - 50 | 0, 'EVOLVED: ' + WEAPONS[w.id].evo, '#ffd27a']); } }
    else if (c.k === 'boon') p.boons.push(c.id);
    else if (c.k === 'aw') { const w = p.weapons.find(w => w.id === c.id); if (w) w.aw = (w.aw || 0) + 1; }
    else if (c.k === 'asc') p.asc[c.id] = (p.asc[c.id] || 0) + 1;
    else if (c.k === 'heal') p.hp = Math.min(p.st.maxhp, p.hp + p.st.maxhp * 0.3);
    else G.coins += 25;
    recompute(p);
  }
  function startPause(kind) {
    const picks = {};
    for (const p of G.players) picks[p.id] = { cards: kind === 'boon' ? boonCards(p) : cards(p, kind === 'chest'), done: false, fresh: true, rr: p.rerolls, bn: p.banishes };
    G.pause = { kind, picks, t: kind === 'boon' ? 25 : 18 };
  }
  function pick(pid, i) {
    const z = G && G.pause; if (!z) return;
    const k = z.picks[pid], p = player(pid); if (!k || k.done || !p) return;
    applyCard(p, k.cards[i] || k.cards[0]); k.done = true;
    if (Object.values(z.picks).every(x => x.done)) G.pause = null;
  }
  function removePlayer(pid) {
    if (!G) return;
    G.players = G.players.filter(p => p.id !== pid);
    if (G.pause) { delete G.pause.picks[pid]; if (Object.values(G.pause.picks).every(x => x.done)) G.pause = null; }
    if (!G.players.length || G.players.every(p => p.down)) G.over = G.over || { win: false };
  }

  // ---------- main step ----------
  function step() {
    if (!G || G.over) return;
    if (G.pause) { G.pause.t -= DT; if (G.pause.t <= 0) for (const id in G.pause.picks) pick(+id, 0); return; }
    G.t += DT; G.txt = 0; G.beams = []; G.orbs = []; G.auras = [];
    if (((G.t * 30) | 0) % 60 === 0) G.dirty = true; // refresh everyone's stats panel every 2 seconds
    players(); spawner(); enemies(); shotsAndZones();
    G.enemies = G.enemies.filter(e => !e.dead);
    if (G.over) return;
    if (G.pendChest > 0) { G.pendChest--; startPause('chest'); }
    else if (G.pendBoon > 0) { G.pendBoon--; startPause('boon'); }
    else if (G.pendLv > 0) { G.pendLv--; startPause('level'); }
  }
  function snap() {
    const s = { t: 's', tm: Math.round(G.t * 10) / 10, lv: G.level, xp: Math.round(G.xp), xn: Math.round(G.xpNeed), k: G.kills, pz: G.pause ? Math.ceil(G.pause.t) : 0,
      P: [], E: [], S: [], Z: [], K: [], B: G.beams, O: G.orbs, ev: G.ev, sh: 0, bo: 0, mp: G.map, cu: G.curse > 0 ? Math.ceil(G.curse) : 0, al: G.altar ? [G.altar.x | 0, G.altar.y | 0, G.altar.r, Math.round(G.altar.prog * 100)] : 0 };
    G.ev = [];
    for (const p of G.players) s.P.push([p.id, Math.round(p.x), Math.round(p.y), Math.ceil(p.hp), p.st.maxhp, (p.down ? 1 : 0) | (p.inv > 0 ? 2 : 0) | (p.dashT > 0 ? 4 : 0) | (p.ward > 0 ? 8 : 0) | (p.ultT > 0 ? 16 : 0), Math.round(p.rev * 100), p.skillT > 0 ? Math.ceil(p.skillT * 10) : 0, G.level < 6 ? -1 : Math.ceil(Math.max(0, p.ultCd))]);
    for (const e of G.enemies) s.E.push(e.id, e.type, Math.round(e.x), Math.round(e.y), Math.max(1, Math.round(e.hp / e.maxhp * 100)), (e.burn > 0 ? 1 : 0) | (e.chill > 0 ? 2 : 0) | (e.shock > 0 ? 4 : 0) | (e.rot > 0 ? 8 : 0) | (e.frozen > 0 ? 16 : 0) | (e.st === 'wind' ? 32 : 0) | (e.shT > 0 && e.type !== 8 ? 64 : 0));
    for (const o of G.shots) s.S.push(o.id, o.k, Math.round(o.x), Math.round(o.y), Math.round(o.r));
    for (const z of G.zones) s.Z.push(z.k, Math.round(z.x), Math.round(z.y), Math.round(z.r));
    for (const a of G.auras) s.Z.push(a);
    for (const k of G.pickups) s.K.push(k.id, k.k, Math.round(k.x), Math.round(k.y));
    if (G.shrine) s.sh = [G.shrine.x | 0, G.shrine.y | 0, G.shrine.r, Math.round(G.shrine.prog * 100)];
    if (G.boss && !G.boss.dead) s.bo = Math.max(0, Math.round(G.boss.hp / G.boss.maxhp * 1000));
    return s;
  }
  function builds() {
    return G.players.map(p => ({ id: p.id, name: p.name, char: p.char, spd: 190 * p.st.spd, w: p.weapons.map(w => [w.id, w.lvl, w.evo ? 1 : 0]), c: p.charms.map(c => [c.id, c.lvl]), b: p.boons, asc: p.asc, full: p.st, dmgBy: p.dmgBy, kills: p.kills, aw: p.weapons.map(w => w.aw || 0), res: hasBoon(p, 'prism') ? Object.fromEntries(Object.keys(p.res).map(e => [e, p.weapons.length])) : p.res, st: { dmg: p.st.dmg, area: p.st.area, cdr: p.st.cdr, crit: p.st.crit, armor: p.st.armor } }));
  }
  function results() {
    const per = {}; for (const p of G.players) per[p.id] = { kills: p.kills, reacts: p.reacts, dmgBy: p.dmgBy, char: p.char };
    const mult = rewardMult(G.diff, Object.keys(G.cz));
    return { win: !!(G.over && G.over.win), diff: G.diff, curses: Object.keys(G.cz), mult, time: Math.floor(G.t), level: G.level, kills: G.kills, shrines: G.shrines, boons: Math.max(0, ...G.players.map(p => p.boons.length)), reactions: G.reactions, evos: G.evos, players: G.n, map: G.map, bargains: G.bargains, wardens: G.wardens,
      embers: Math.floor((G.t * 0.3 + G.kills * 0.05 + G.coins + (G.over && G.over.win ? 150 : 0)) * mult), per };
  }
  return { DT, WORLD, newGame, step, snap, builds, results, input, pick, redeal, removePlayer, get G() { return G; } };
})();
