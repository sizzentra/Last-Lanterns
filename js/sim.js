'use strict';
// The game rules. Runs only in the host's browser (or in solo play).
const Sim = (() => {
  const DT = 1 / 30, WORLD = 1700;
  let G = null, uid = 1;
  const rnd = (a, b) => a + Math.random() * (b - a);
  const need = l => Math.floor(4 + 3 * l + 0.22 * l * l);
  const SHOT = { dart: 0, hail: 1, sickle: 2, spit: 3 };
  const ZONE = { fire: 0, thorn: 1, heal: 2 };
  const PICK = { heart: 0, magnet: 1, coin: 2, chest: 3 };

  function newGame(defs, opts = {}) {
    uid = 1;
    G = { t: 0, players: [], enemies: [], shots: [], zones: [], gems: new Map(), pickups: [], ev: [], beams: [], orbs: [],
      level: 1, xp: 0, xpNeed: need(1), pause: null, pendLv: 0, pendChest: 0, pendBoon: 0,
      shrine: null, nextShrine: 70, nextElite: 110, boss: null, bossTime: opts.bossTime || 720, over: null,
      acc: 0, coins: 0, kills: 0, shrines: 0, reactions: 0, evos: 0, dirty: true, dotT: 0, txt: 0, n: defs.length };
    defs.forEach((d, i) => {
      const a = i / defs.length * 6.283, off = defs.length > 1 ? 50 : 0;
      const p = { id: d.id, name: d.name, char: d.char, meta: d.meta || {}, x: Math.cos(a) * off, y: Math.sin(a) * off, fx: 1, fy: 0,
        hp: 1, weapons: [], charms: [], boons: [], down: false, downT: 0, rev: 0, deaths: 0, inv: 0, skillT: 0, dashT: 0,
        still: 0, kin: 1, kills: 0, reacts: 0, dmgBy: {}, usedSecond: false, mv: false };
      addWeapon(p, CHARS[p.char].weapon); recompute(p); p.hp = p.st.maxhp; G.players.push(p);
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
    CHARS[p.char].f(s);
    for (const c of p.charms) CHARMS[c.id].f(s, c.lvl);
    for (const b of p.boons) if (BOONS[b].f) BOONS[b].f(s);
    s.maxhp = Math.round(s.maxhp); s.cdr = Math.max(0.3, s.cdr);
    const old = p.st ? p.st.maxhp : s.maxhp;
    if (s.maxhp > old) p.hp += s.maxhp - old;
    p.st = s; p.hp = Math.min(p.hp, s.maxhp);
    p.res = {}; for (const w of p.weapons) { const el = WEAPONS[w.id].el; p.res[el] = (p.res[el] || 0) + 1; }
    G.dirty = true;
  }
  const resMul = (p, el) => { const c = p.res[el] || 0; return c >= 3 ? 1.45 : c >= 2 ? 1.2 : 1; };
  const wd = (p, w, base) => base * p.st.dmg * resMul(p, WEAPONS[w.id].el) * (1 + 0.03 * ((p.meta.m || {})[w.id] || 0)) * p.kin;

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
    if (e.shock > 0) dmg *= 1.25;
    e.hp -= dmg;
    if (p) p.dmgBy[wid] = (p.dmgBy[wid] || 0) + dmg;
    if (crit || dmg > 60) text(e.x, e.y - e.r, Math.round(dmg) + (crit ? '!' : ''), crit ? '#fff' : '#ffd9a0');
    if (el && !(flags & 2)) mark(e, ELEM[el].mark, p, el);
    if (e.hp <= 0 && !e.dead) kill(e, p);
  }
  function mark(e, m, p, el) {
    if (!m || e.dead) return;
    const has = k => e[k] > 0;
    if ((m === 'burn' && has('chill')) || (m === 'chill' && has('burn'))) { e.burn = e.chill = 0; return react(e, 'steam', p); }
    if ((m === 'chill' && has('shock')) || (m === 'shock' && has('chill'))) { e.chill = e.shock = 0; return react(e, 'shatter', p); }
    if ((m === 'burn' && has('rot')) || (m === 'rot' && has('burn'))) { e.rot = 0; e.rotN = 0; e.burn = 4; e.src = p; return react(e, 'wildfire', p); }
    if ((m === 'shock' && has('rot')) || (m === 'rot' && has('shock'))) { e.rot = e.shock = 0; e.rotN = 0; return react(e, 'spore', p); }
    if ((m === 'burn' && has('shock')) || (m === 'shock' && has('burn'))) { e.burn = e.shock = 0; return react(e, 'overload', p); }
    if ((m === 'chill' && has('rot')) || (m === 'rot' && has('chill'))) { e.chill = e.rot = 0; e.rotN = 0; return react(e, 'frostbite', p); }
    const d = 3 * (p ? p.st.markDur * ((p.res[el] || 0) >= 3 ? 1.4 : 1) : 1);
    if (e[m] < d) e[m] = d;
    e.src = p;
    if (m === 'rot') e.rotN = Math.min(8, (e.rotN || 0) + 1);
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
      if (e.dead && e.type < 4) dropGem(e.x, e.y, 2);
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
    if (e.type === 4) G.pickups.push({ id: uid++, k: PICK.chest, x: e.x, y: e.y });
    else { const r = Math.random(); if (r < 0.004) drop(PICK.heart, e); else if (r < 0.0055) drop(PICK.magnet, e); else if (r < 0.03) drop(PICK.coin, e); }
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
    G.shots.push({ id: uid++, k, x: p.x, y: p.y, vx: Math.cos(a) * spd, vy: Math.sin(a) * spd, r: o.r || 6, dmg, p, wid: w.id, el: WEAPONS[w.id].el,
      pierce: o.pierce || 0, boom: o.boom || 0, life: o.life || 1, t: 0, hit: new Set(), ret: !!o.ret });
  }
  function zone(k, x, y, r, life, dmg, p, wid, slow) {
    if (G.zones.length > 160) G.zones.shift();
    G.zones.push({ k, x, y, r, life, dmg, p, wid, el: wid ? WEAPONS[wid].el : null, tt: 0, slow });
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
  };
  function weapons(p) {
    for (const w of p.weapons) {
      const f = FIRE[w.id];
      if (f) { w.t -= DT; if (w.t <= 0) { const cd = f(p, w); w.t = cd ? cd / p.st.cdr : 0.25; } continue; }
      if (w.id === 'trail') {
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
    p.skillT = CHARS[c].cd / Math.min(1.6, p.st.cdr);
    if (c === 'wick') p.dashT = 0.28;
    else if (c === 'mara') { const r = 230 * p.st.area; fx('r', p.x | 0, p.y | 0, r | 0, '#bfeeff'); inR(p.x, p.y, r, e => { e.frozen = Math.max(e.frozen, 2.2); hit(e, 30 * lv * p.st.dmg, p, 'skill', 'frost'); }); }
    else if (c === 'tolliver') { const r = 140 * p.st.area; fx('z', p.x | 0, p.y | 0, r | 0); inR(p.x, p.y, r, e => hit(e, 45 * lv * p.st.dmg, p, 'skill', 'storm')); }
    else if (c === 'bryn') zone(ZONE.heal, p.x, p.y, 150 * p.st.area, 4.5, 0, p, null);
  }

  // ---------- players ----------
  function hurt(p, d) {
    if (p.down || p.inv > 0 || p.dashT > 0) return;
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
      if (p.down) {
        let mates = 0; for (const q of G.players) if (!q.down && (q.x - p.x) ** 2 + (q.y - p.y) ** 2 < 75 * 75) mates++;
        p.rev = mates ? p.rev + DT / 3 * (0.5 + 0.5 * mates) : Math.max(0, p.rev - DT * 0.5);
        p.downT -= DT;
        if (p.rev >= 1 || p.downT <= 0) { p.down = false; p.hp = p.st.maxhp * 0.5; p.inv = 3; fx('r', p.x | 0, p.y | 0, 120, '#fff'); }
        continue;
      }
      p.still = p.mv ? 0 : p.still + DT;
      p.hp = Math.min(p.st.maxhp, p.hp + (p.st.regen + (hasBoon(p, 'roots') && p.still > 0.5 ? p.st.maxhp * 0.04 : 0)) * DT);
      if (hasBoon(p, 'kindred')) { let m = 0; for (const q of G.players) if (q !== p && !q.down && (q.x - p.x) ** 2 + (q.y - p.y) ** 2 < 260 * 260) m++; p.kin = 1 + 0.08 * m; }
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
    if (m.sk) skill(p);
  }

  // ---------- enemies ----------
  function spawn(type, x, y, hpMul) {
    const T = ENEMIES[type], hs = 1 + (G.t / 60) * 0.3 + (G.t / 60) ** 2 * 0.022;
    const hp = T.hp * hs * (hpMul || 1);
    const e = { id: uid++, type, x: Math.max(-WORLD - 80, Math.min(WORLD + 80, x)), y: Math.max(-WORLD - 80, Math.min(WORLD + 80, y)), hp, maxhp: hp, spd: T.spd * rnd(0.9, 1.1), dmg: T.dmg * (1 + G.t / 600), r: T.r,
      burn: 0, chill: 0, shock: 0, rot: 0, rotN: 0, frozen: 0, slow: 0, hc: 0, at: rnd(1, 3), src: null, dead: false };
    G.enemies.push(e); return e;
  }
  function spawner() {
    const alive = G.players.filter(p => !p.down); if (!alive.length) return;
    const n = G.n, tm = G.t / 60, around = (d0, d1) => { const p = alive[Math.random() * alive.length | 0], a = rnd(0, 6.283), d = rnd(d0, d1); return [p.x + Math.cos(a) * d, p.y + Math.sin(a) * d]; };
    const rate = (0.8 + tm * 0.95 + tm * tm * 0.06) * (0.55 + 0.45 * n) * (G.boss ? 0.45 : 1);
    const cap = Math.min(330, 30 + G.t * 0.5 * (0.6 + 0.4 * n));
    G.acc += rate * DT;
    while (G.acc >= 1) {
      G.acc--; if (G.enemies.length >= cap) continue;
      const [x, y] = around(640, 780), r = Math.random() * 17;
      if (G.t > 70 && r < 4) { for (let i = 0; i < 4; i++) spawn(1, x + rnd(-30, 30), y + rnd(-30, 30)); }
      else if (G.t > 170 && r < 5.5) spawn(2, x, y);
      else if (G.t > 260 && r < 7) spawn(3, x, y);
      else spawn(0, x, y);
    }
    if (!G.boss && G.t >= G.nextElite) { G.nextElite += 80; const [x, y] = around(640, 700); spawn(4, x, y, 0.5 + 0.5 * n); text(alive[0].x, alive[0].y - 60, 'An elite approaches', '#ff6b5c'); }
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
    const enr = G.t - e.born > 100; e.bt -= DT;
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
  function enemies() {
    const dot = (G.dotT += DT) >= 0.5; if (dot) G.dotT = 0;
    const alive = G.players.filter(p => !p.down);
    const L = G.enemies;
    for (let i = 0; i < L.length; i++) {
      const e = L[i]; if (e.dead) continue;
      if (e.burn > 0) e.burn -= DT; if (e.chill > 0) e.chill -= DT; if (e.shock > 0) e.shock -= DT;
      if (e.rot > 0) { e.rot -= DT; if (e.rot <= 0) e.rotN = 0; }
      if (e.frozen > 0) e.frozen -= DT; if (e.slow > 0) e.slow -= DT; if (e.hc > 0) e.hc -= DT;
      if (dot) {
        const sd = e.src ? e.src.st.dmg : 1, lv = 1 + G.level * 0.08;
        if (e.burn > 0) hit(e, 5 * lv * sd, e.src, 'dot', null, 3);
        if (e.rot > 0 && !e.dead) hit(e, 2.2 * e.rotN * lv * sd, e.src, 'dot', null, 3);
        if (e.dead) continue;
      }
      let tp = null, bd = 1e12;
      for (const p of alive) { const q = (p.x - e.x) ** 2 + (p.y - e.y) ** 2; if (q < bd) { bd = q; tp = p; } }
      if (!tp) continue;
      const dx = tp.x - e.x, dy = tp.y - e.y, d = Math.sqrt(bd) || 1, big = e.type >= 4;
      if (e.type === 5) { bossAI(e, tp, d, dx, dy); continue; }
      if (d > 1500) { e.dead = true; continue; } // left far behind: quietly remove
      const sp = e.spd * (e.frozen > 0 && !big ? 0 : 1) * (e.chill > 0 ? (big ? 0.85 : 0.6) : 1) * (e.slow > 0 ? 0.65 : 1) * DT;
      if (e.type === 3) {
        const dir = d < 220 ? -0.7 : d > 300 ? 1 : 0;
        e.x += (dx / d * dir - dy / d * (dir ? 0 : 0.5)) * sp; e.y += (dy / d * dir + dx / d * (dir ? 0 : 0.5)) * sp;
        e.at -= DT; if (e.at <= 0 && d < 540 && e.frozen <= 0) { e.at = 2.6; eshot(e, Math.atan2(dy, dx), 190, e.dmg); }
      } else { e.x += dx / d * sp; e.y += dy / d * sp; }
      if (d < e.r + 13 && e.hc <= 0) { hurt(tp, e.dmg); e.hc = 0.7; }
    }
    // keep enemies from stacking on one spot
    const grid = new Map(), C = 44;
    for (const e of L) { if (e.dead) continue; const k = ((e.x / C | 0) + 500) * 2048 + (e.y / C | 0) + 500; const c = grid.get(k); if (c) c.push(e); else grid.set(k, [e]); }
    const push = (a, b) => { const dx = b.x - a.x, dy = b.y - a.y, rr = a.r + b.r, q = dx * dx + dy * dy; if (q < rr * rr && q > 0.01) { const d = Math.sqrt(q), o = (rr - d) / d * 0.25, wa = b.type >= 4 ? 2 : 1, wb = a.type >= 4 ? 2 : 1; if (a.type < 5) { a.x -= dx * o * wa; a.y -= dy * o * wa; } if (b.type < 5) { b.x += dx * o * wb; b.y += dy * o * wb; } } };
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
      if (s.enemy) { for (const p of G.players) if (!p.down && (p.x - s.x) ** 2 + (p.y - s.y) ** 2 < (s.r + 13) ** 2) { hurt(p, s.dmg); s.dead = true; break; } continue; }
      const L = G.enemies;
      for (let i = 0; i < L.length; i++) {
        const e = L[i]; if (e.dead) continue;
        const dx = e.x - s.x, dy = e.y - s.y, rr = e.r + s.r;
        if (dx * dx + dy * dy > rr * rr || s.hit.has(e)) continue;
        s.hit.add(e); hit(e, s.dmg, s.p, s.wid, s.el);
        if (s.boom) { fx('x', s.x | 0, s.y | 0, s.boom | 0, '#ff8a3c'); inR(s.x, s.y, s.boom, o => { if (o !== e) hit(o, s.dmg * 0.6, s.p, s.wid, s.el); }); }
        if (--s.pierce < 0) { s.dead = true; break; }
      }
    }
    G.shots = G.shots.filter(s => !s.dead);
    for (const z of G.zones) {
      z.life -= DT; z.tt -= DT; if (z.tt > 0) continue;
      z.tt = 0.45;
      if (z.k === ZONE.heal) { for (const p of G.players) if (!p.down && (p.x - z.x) ** 2 + (p.y - z.y) ** 2 < z.r * z.r) p.hp = Math.min(p.st.maxhp, p.hp + p.st.maxhp * 0.035); }
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
  function cards(p) {
    const out = [], pool = [], n = p.st.cards, own = id => p.charms.some(c => c.id === id);
    for (const w of p.weapons) { if (w.lvl >= 5 && !w.evo && own(WEAPONS[w.id].charm)) out.push({ k: 'evo', id: w.id }); else if (w.lvl < 5) pool.push({ k: 'w', id: w.id, lvl: w.lvl + 1, wt: 3 }); }
    if (p.weapons.length < 5) for (const id in WEAPONS) if (!p.weapons.some(w => w.id === id)) pool.push({ k: 'w', id, lvl: 1, wt: 2 });
    for (const c of p.charms) if (c.lvl < 5) pool.push({ k: 'c', id: c.id, lvl: c.lvl + 1, wt: 3 });
    if (p.charms.length < 5) for (const id in CHARMS) if (!own(id)) pool.push({ k: 'c', id, lvl: 1, wt: p.weapons.some(w => WEAPONS[w.id].charm === id) ? 4 : 1.5 });
    sample(pool, n, out);
    if (!out.length) out.push({ k: 'heal' }, { k: 'ember' });
    return out.slice(0, Math.max(n, 1));
  }
  function boonCards(p) {
    const pool = []; for (const id in BOONS) if (!hasBoon(p, id) && !(id === 'kindred' && G.n < 2)) pool.push({ k: 'boon', id, wt: 1 });
    const out = sample(pool, 3, []); return out.length ? out : [{ k: 'heal' }];
  }
  function applyCard(p, c) {
    if (c.k === 'w') { const w = p.weapons.find(w => w.id === c.id); if (w) w.lvl = Math.min(5, w.lvl + 1); else addWeapon(p, c.id); }
    else if (c.k === 'c') { const o = p.charms.find(x => x.id === c.id); if (o) o.lvl = Math.min(5, o.lvl + 1); else p.charms.push({ id: c.id, lvl: 1 }); }
    else if (c.k === 'evo') { const w = p.weapons.find(w => w.id === c.id); if (w && !w.evo) { w.evo = true; G.evos++; } }
    else if (c.k === 'boon') p.boons.push(c.id);
    else if (c.k === 'heal') p.hp = Math.min(p.st.maxhp, p.hp + p.st.maxhp * 0.3);
    else G.coins += 25;
    recompute(p);
  }
  function startPause(kind) {
    const picks = {};
    for (const p of G.players) picks[p.id] = { cards: kind === 'boon' ? boonCards(p) : cards(p), done: false };
    G.pause = { kind, picks, t: kind === 'boon' ? 25 : 18, fresh: true };
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
    G.t += DT; G.txt = 0; G.beams = []; G.orbs = [];
    players(); spawner(); enemies(); shotsAndZones();
    G.enemies = G.enemies.filter(e => !e.dead);
    if (G.over) return;
    if (G.pendChest > 0) { G.pendChest--; startPause('chest'); }
    else if (G.pendBoon > 0) { G.pendBoon--; startPause('boon'); }
    else if (G.pendLv > 0) { G.pendLv--; startPause('level'); }
  }
  function snap() {
    const s = { t: 's', tm: Math.round(G.t * 10) / 10, lv: G.level, xp: Math.round(G.xp), xn: Math.round(G.xpNeed), k: G.kills, pz: G.pause ? Math.ceil(G.pause.t) : 0,
      P: [], E: [], S: [], Z: [], K: [], B: G.beams, O: G.orbs, ev: G.ev, sh: 0, bo: 0 };
    G.ev = [];
    for (const p of G.players) s.P.push([p.id, Math.round(p.x), Math.round(p.y), Math.ceil(p.hp), p.st.maxhp, (p.down ? 1 : 0) | (p.inv > 0 ? 2 : 0) | (p.dashT > 0 ? 4 : 0), Math.round(p.rev * 100), p.skillT > 0 ? Math.ceil(p.skillT * 10) : 0]);
    for (const e of G.enemies) s.E.push(e.id, e.type, Math.round(e.x), Math.round(e.y), Math.max(1, Math.round(e.hp / e.maxhp * 100)), (e.burn > 0 ? 1 : 0) | (e.chill > 0 ? 2 : 0) | (e.shock > 0 ? 4 : 0) | (e.rot > 0 ? 8 : 0) | (e.frozen > 0 ? 16 : 0) | (e.st === 'wind' ? 32 : 0));
    for (const o of G.shots) s.S.push(o.id, o.k, Math.round(o.x), Math.round(o.y), Math.round(o.r));
    for (const z of G.zones) s.Z.push(z.k, Math.round(z.x), Math.round(z.y), Math.round(z.r));
    for (const k of G.pickups) s.K.push(k.id, k.k, Math.round(k.x), Math.round(k.y));
    if (G.shrine) s.sh = [G.shrine.x | 0, G.shrine.y | 0, G.shrine.r, Math.round(G.shrine.prog * 100)];
    if (G.boss && !G.boss.dead) s.bo = Math.max(0, Math.round(G.boss.hp / G.boss.maxhp * 1000));
    return s;
  }
  function builds() {
    return G.players.map(p => ({ id: p.id, name: p.name, char: p.char, spd: 190 * p.st.spd, w: p.weapons.map(w => [w.id, w.lvl, w.evo ? 1 : 0]), c: p.charms.map(c => [c.id, c.lvl]), b: p.boons, res: p.res, st: { dmg: p.st.dmg, area: p.st.area, cdr: p.st.cdr, crit: p.st.crit, armor: p.st.armor } }));
  }
  function results() {
    const per = {}; for (const p of G.players) per[p.id] = { kills: p.kills, reacts: p.reacts, dmgBy: p.dmgBy, char: p.char };
    return { win: !!(G.over && G.over.win), time: Math.floor(G.t), level: G.level, kills: G.kills, shrines: G.shrines, reactions: G.reactions, evos: G.evos, players: G.n,
      embers: Math.floor(G.t * 0.3 + G.kills * 0.05 + G.coins + (G.over && G.over.win ? 150 : 0)), per };
  }
  return { DT, WORLD, newGame, step, snap, builds, results, input, pick, removePlayer, get G() { return G; } };
})();
