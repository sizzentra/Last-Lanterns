'use strict';
// View: the latest game state as received (from the host, or from our own Sim when hosting/solo).
// Render: draws the View onto the canvas.
const View = {
  cur: null, prev: null, curT: 0, gap: 33, gems: new Map(), fx: [], builds: [], me: { x: 0, y: 0, fx: 1, fy: 0 },
  reset() { this.cur = this.prev = null; this.gems.clear(); this.fx = []; this.builds = []; this.me = { x: 0, y: 0, fx: 1, fy: 0 }; },
  apply(s, myId) {
    const now = performance.now(), c = { s, P: new Map(), E: new Map(), S: new Map() };
    for (const p of s.P) c.P.set(p[0], { id: p[0], x: p[1], y: p[2], hp: p[3], max: p[4], fl: p[5], rev: p[6], sk: p[7], ul: p[8] });
    for (let i = 0; i < s.E.length; i += 6) c.E.set(s.E[i], { type: s.E[i + 1], x: s.E[i + 2], y: s.E[i + 3], hp: s.E[i + 4], st: s.E[i + 5] });
    for (let i = 0; i < s.S.length; i += 6) c.S.set(s.S[i], { k: s.S[i + 1], x: s.S[i + 2], y: s.S[i + 3], r: s.S[i + 4], o: s.S[i + 5] });
    if (s.sd && this.seed !== s.sd) { this.seed = s.sd; this.world = World.gen(s.sd); }
    this.prev = this.cur; this.cur = c; this.gap = Math.max(20, Math.min(250, now - this.curT)); this.curT = now;
    if (!this.prev) { const m = c.P.get(myId); if (m) { this.me.x = m.x; this.me.y = m.y; } }
    for (const e of s.ev) {
      if (e[0] === 'g+') this.gems.set(e[1], { x: e[2], y: e[3], v: e[4] });
      else if (e[0] === 'g-') this.gems.delete(e[1]);
      else if (this.fx.length < 260) {
        this.fx.push({ e, t: now });
        if ((e[0] === 'x' && e[3] >= 95) || (e[0] === 'r' && e[3] >= 240)) this.shake = Math.min(14, (this.shake || 0) + 5); // big hits shake the screen
      }
    }
  },
};

const Render = (() => {
  let cv, ctx, W = 0, H = 0, scale = 1;
  const glows = {};
  const MARKC = ['#ff8a3c', '#7fd8ff', '#ffe45c', '#8be06a'];
  function glow(col, r) {
    const k = col + r; if (glows[k]) return glows[k];
    const c = document.createElement('canvas'); c.width = c.height = r * 2;
    const g = c.getContext('2d'), gr = g.createRadialGradient(r, r, 0, r, r, r);
    gr.addColorStop(0, col); gr.addColorStop(0.25, col + '88'); gr.addColorStop(1, col + '00');
    g.fillStyle = gr; g.fillRect(0, 0, r * 2, r * 2); return glows[k] = c;
  }
  const gl = (col, x, y, r) => ctx.drawImage(glow(col, 64), x - r, y - r, r * 2, r * 2);
  function init(canvas) { cv = canvas; ctx = cv.getContext('2d'); resize(); addEventListener('resize', resize); }
  function resize() { W = cv.width = innerWidth; H = cv.height = innerHeight; scale = Math.max(0.55, Math.min(W / 1500, H / 860)); }
  const circ = (x, y, r) => { ctx.moveTo(x + r, y); ctx.arc(x, y, r, 0, 6.2832); };

  function draw(myId) {
    const V = View, c = V.cur; if (!c) return;
    const now = performance.now(), a = V.prev ? Math.min(1, (now - V.curT) / V.gap) : 1, s = c.s;
    const lerp = (map, id, o) => { const p = V.prev && map.get(id); return p ? [p.x + (o.x - p.x) * a, p.y + (o.y - p.y) * a] : [o.x, o.y]; };
    const meS = c.P.get(myId), down = meS && (meS.fl & 1);
    const cx = meS ? V.me.x : 0, cy = meS ? V.me.y : 0;
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
    const MP = MAPS[s.mp] || MAPS.fields; ctx.fillStyle = MP.bg; ctx.fillRect(0, 0, W, H);
    const shk = V.shake > 0.3 ? V.shake : 0; V.shake *= 0.86;
    ctx.setTransform(scale, 0, 0, scale, W / 2 - cx * scale + (Math.random() - 0.5) * shk, H / 2 - cy * scale + (Math.random() - 0.5) * shk);
    const vw = W / scale / 2 + 60, vh = H / scale / 2 + 60, vis = (x, y) => Math.abs(x - cx) < vw && Math.abs(y - cy) < vh;

    // ground specks so movement is visible
    ctx.fillStyle = MP.speck;
    const G0 = 110;
    for (let gx = Math.floor((cx - vw) / G0); gx <= (cx + vw) / G0; gx++) for (let gy = Math.floor((cy - vh) / G0); gy <= (cy + vh) / G0; gy++) {
      const h = Math.abs(Math.sin(gx * 127.1 + gy * 311.7) * 43758.5) % 1;
      ctx.fillRect(gx * G0 + h * 90, gy * G0 + ((h * 7) % 1) * 90, 3 + h * 5, 3 + h * 5);
    }
    ctx.strokeStyle = '#3a2f66'; ctx.lineWidth = 6; ctx.strokeRect(-Sim.WORLD, -Sim.WORLD, Sim.WORLD * 2, Sim.WORLD * 2);

    // zones
    const Z = s.Z, zc = ['#ff7a2a', '#5fbf45', '#9dffb0', '#7fd8ff', 0, 0, '#ffe9a0', '#8be06a'];
    // your own damaging effects are drawn at full strength, teammates' much fainter, so you can read the fight
    for (const mine of [false, true]) for (const k of [0, 1, 2, 3, 6, 7]) {
      const team = k === 2 || k === 6; // healing rings and beacons matter to everyone
      if (team && !mine) continue;
      ctx.fillStyle = zc[k]; ctx.globalAlpha = (k === 2 ? 0.16 + 0.05 * Math.sin(now / 150) : k === 3 || k === 7 ? 0.13 : 0.2) * (mine ? 1 : 0.4); ctx.beginPath();
      for (let i = 0; i < Z.length; i += 5) if (Z[i] === k && (team || (Z[i + 4] === myId) === mine) && vis(Z[i + 1], Z[i + 2])) circ(Z[i + 1], Z[i + 2], Z[i + 3]);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    // planted things: lightning rods and sproutlings
    for (let i = 0; i < Z.length; i += 5) {
      if ((Z[i] !== 4 && Z[i] !== 5) || !vis(Z[i + 1], Z[i + 2])) continue;
      const x = Z[i + 1], y = Z[i + 2], rod = Z[i] === 4;
      gl(rod ? '#ffe45c' : '#8be06a', x, y, 34);
      ctx.fillStyle = rod ? '#ffe45c' : '#8be06a';
      if (rod) ctx.fillRect(x - 3, y - 24, 6, 28); else { ctx.beginPath(); circ(x, y, 9); ctx.fill(); ctx.fillStyle = '#eaffd0'; ctx.beginPath(); circ(x, y - 4, 4); ctx.fill(); }
    }
    // rocks
    if (V.world) {
      ctx.fillStyle = '#17142a'; ctx.beginPath(); for (const k of V.world.rocks) if (Math.abs(k.x - cx) < vw + k.r && Math.abs(k.y - cy) < vh + k.r) circ(k.x, k.y, k.r); ctx.fill();
      ctx.strokeStyle = '#342e55'; ctx.lineWidth = 3; ctx.beginPath(); for (const k of V.world.rocks) if (Math.abs(k.x - cx) < vw + k.r && Math.abs(k.y - cy) < vh + k.r) circ(k.x, k.y, k.r - 2); ctx.stroke();
      // landmarks
      ctx.textAlign = 'center';
      V.world.sites.forEach((t, i) => {
        if (!vis(t.x, t.y)) return;
        const S = World.SITES[t.k], st = s.si ? s.si[i] : 0, ready = st === 0;
        ctx.globalAlpha = ready ? 1 : 0.35; gl(S.c, t.x, t.y, ready ? 80 + 8 * Math.sin(now / 300) : 40);
        ctx.fillStyle = S.c; ctx.beginPath();
        if (t.k === 0) ctx.rect(t.x - 14, t.y - 11, 28, 22); else if (t.k === 1) circ(t.x, t.y, 16); else { ctx.moveTo(t.x, t.y - 20); ctx.lineTo(t.x + 16, t.y + 12); ctx.lineTo(t.x - 16, t.y + 12); }
        ctx.fill();
        ctx.font = 'bold 13px system-ui'; ctx.fillText(S.name + (st < 0 ? ' (opened)' : st > 0 ? ' (' + st + 's)' : ''), t.x, t.y - 30);
        ctx.globalAlpha = 1;
      });
    }
    if (s.ca) { // Firefly Cart and where it is going
      const [x, y, tx, ty, life] = s.ca;
      ctx.strokeStyle = '#ffe45c55'; ctx.lineWidth = 3; ctx.setLineDash([10, 12]); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(tx, ty); ctx.stroke(); ctx.setLineDash([]);
      ctx.strokeStyle = '#ffe45c'; ctx.beginPath(); circ(tx, ty, 26); ctx.stroke();
      gl('#ffe45c', x, y, 70); ctx.strokeStyle = '#ffe45c33'; ctx.beginPath(); circ(x, y, 180); ctx.stroke();
      ctx.fillStyle = '#5a3d1a'; ctx.fillRect(x - 16, y - 9, 32, 18); ctx.fillStyle = '#ffe45c'; ctx.beginPath(); circ(x, y - 12, 7); ctx.fill();
      ctx.font = 'bold 13px system-ui'; ctx.textAlign = 'center'; ctx.fillText('Firefly Cart: walk with it (' + life + 's)', x, y - 28);
    }
    // shrine
    if (s.sh) {
      const [x, y, r, pr] = s.sh;
      gl('#ffd27a', x, y, r * 1.3);
      ctx.strokeStyle = '#ffd27a55'; ctx.lineWidth = 3; ctx.beginPath(); circ(x, y, r); ctx.stroke();
      ctx.strokeStyle = '#ffd27a'; ctx.lineWidth = 7; ctx.beginPath(); ctx.arc(x, y, r, -1.57, -1.57 + pr / 100 * 6.2832); ctx.stroke();
      ctx.fillStyle = '#ffd27a'; ctx.font = 'bold 15px system-ui'; ctx.textAlign = 'center'; ctx.fillText('Shrine: stand here together', x, y - r - 12);
    }
    if (s.al) { // Dark Bargain altar
      const [x, y, r, pr] = s.al;
      gl('#b070ff', x, y, r * 1.4);
      ctx.strokeStyle = '#b070ff66'; ctx.lineWidth = 3; ctx.beginPath(); circ(x, y, r); ctx.stroke();
      ctx.strokeStyle = '#d0a8ff'; ctx.lineWidth = 7; ctx.beginPath(); ctx.arc(x, y, r, -1.57, -1.57 + pr / 100 * 6.2832); ctx.stroke();
      ctx.fillStyle = '#d0a8ff'; ctx.font = 'bold 15px system-ui'; ctx.textAlign = 'center';
      ctx.fillText('Dark Bargain: stand here to accept', x, y - r - 28); ctx.font = '13px system-ui'; ctx.fillText('45 seconds of a much bigger swarm, then a big reward', x, y - r - 10);
    }
    // sparks (xp)
    for (const g of V.gems.values()) { if (!vis(g.x, g.y)) continue; ctx.fillStyle = g.v >= 20 ? '#ff9de0' : g.v >= 5 ? '#9df0ff' : '#ffe9a0'; const z = g.v >= 20 ? 5 : g.v >= 5 ? 4 : 3; ctx.fillRect(g.x - z, g.y - z, z * 2, z * 2); }
    // pickups
    const K = s.K, kc = ['#ff6b8a', '#6bb8ff', '#ffb347', '#ffd700'], kl = ['+', 'M', '', '?'];
    ctx.textAlign = 'center'; ctx.font = 'bold 14px system-ui';
    for (let i = 0; i < K.length; i += 4) {
      const x = K[i + 2], y = K[i + 3], k = K[i + 1]; gl(kc[k], x, y, k === 3 ? 44 : 26);
      ctx.fillStyle = kc[k]; ctx.beginPath(); if (k === 3) ctx.rect(x - 12, y - 10, 24, 20); else circ(x, y, k === 2 ? 6 : 10); ctx.fill();
      ctx.fillStyle = '#111'; ctx.fillText(kl[k], x, y + 5);
    }

    // enemies, batched by type
    const byT = ENEMIES.map(() => []);
    for (const [id, e] of c.E) { const p = lerp(V.prev && V.prev.E, id, e); if (vis(p[0], p[1])) byT[e.type].push(e, p[0], p[1]); }
    for (let t = 0; t < ENEMIES.length; t++) {
      const L = byT[t], T = ENEMIES[t]; if (!L.length) continue;
      if (T.big) for (let i = 0; i < L.length; i += 3) gl(t === 5 ? '#b9a8ff' : t === 11 ? '#b070ff' : '#ff5a4a', L[i + 1], L[i + 2], T.r * 2.6);
      const SZ = e => e.st & 128 ? 1.7 : e.st & 256 ? 0.6 : 1;
      ctx.fillStyle = T.c; ctx.beginPath(); for (let i = 0; i < L.length; i += 3) circ(L[i + 1], L[i + 2], T.r * SZ(L[i])); ctx.fill();
      ctx.fillStyle = t === 5 ? '#200030' : '#ffdf8a'; ctx.beginPath();
      for (let i = 0; i < L.length; i += 3) { const q = T.r * 0.38 * SZ(L[i]); circ(L[i + 1] - q, L[i + 2] - q * 0.4, T.r * 0.16 + 1); circ(L[i + 1] + q, L[i + 2] - q * 0.4, T.r * 0.16 + 1); }
      ctx.fill();
      ctx.lineWidth = 2.5;
      for (let i = 0; i < L.length; i += 3) {
        const e = L[i], x = L[i + 1], y = L[i + 2];
        if (e.st & 16) { ctx.fillStyle = '#cfefffaa'; ctx.beginPath(); circ(x, y, T.r + 2); ctx.fill(); }
        else if (e.st & 15) { ctx.strokeStyle = MARKC[e.st & 1 ? 0 : e.st & 2 ? 1 : e.st & 4 ? 2 : 3]; ctx.beginPath(); circ(x, y, T.r + 2); ctx.stroke(); }
        if (e.st & 64) { ctx.strokeStyle = '#6bb8ff'; ctx.beginPath(); circ(x, y, T.r + 5); ctx.stroke(); }
        if (e.st & 32) { ctx.strokeStyle = '#ff3030'; ctx.lineWidth = 5; ctx.beginPath(); circ(x, y, T.r + 14 + 8 * Math.sin(now / 50)); ctx.stroke(); ctx.lineWidth = 2.5; }
        if (T.big && t !== 5) { ctx.fillStyle = '#400'; ctx.fillRect(x - 28, y - T.r - 12, 56, 5); ctx.fillStyle = '#ff5a4a'; ctx.fillRect(x - 28, y - T.r - 12, 56 * e.hp / 100, 5); }
      }
    }

    // glowing things
    ctx.globalCompositeOperation = 'lighter';
    const O = s.O; for (let i = 0; i < O.length; i += 3) { ctx.globalAlpha = O[i + 2] === myId ? 1 : 0.4; gl('#a8ff7a', O[i], O[i + 1], 20); }
    ctx.globalAlpha = 1;
    const B = s.B; ctx.lineCap = 'round';
    for (let i = 0; i < B.length; i += 5) {
      ctx.globalAlpha = B[i + 4] === myId ? 1 : 0.35; const ang = B[i + 2] / 100, x = B[i], y = B[i + 1], x2 = x + Math.cos(ang) * B[i + 3], y2 = y + Math.sin(ang) * B[i + 3];
      ctx.strokeStyle = '#fff6c822'; ctx.lineWidth = 30; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x2, y2); ctx.stroke();
      ctx.strokeStyle = '#fffbe6'; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x2, y2); ctx.stroke();
    }
    const sc = ['#ff8a3c', '#7fd8ff', '#ffffff', '', '#ffe45c', '#8be06a'];
    const late = [];
    for (const [id, o] of c.S) {
      const p = lerp(V.prev && V.prev.S, id, o); if (!vis(p[0], p[1])) continue;
      if (o.k === 3) { late.push(p); continue; }
      ctx.globalAlpha = o.o === myId ? 1 : 0.4;
      gl(sc[o.k], p[0], p[1], o.k === 2 || o.k === 4 ? o.r * 2.2 : 10 + o.r);
      if (o.k === 2) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(p[0], p[1], o.r, now / 60, now / 60 + 3.6); ctx.stroke(); }
    }
    ctx.globalAlpha = 1;
    // effects
    V.fx = V.fx.filter(f => now - f.t < 900);
    for (const f of V.fx) {
      const e = f.e, k = e[0], age = (now - f.t) / 1000;
      if (k === 'r' && age < 0.4) { ctx.globalAlpha = 1 - age / 0.4; ctx.strokeStyle = e[4]; ctx.lineWidth = 8; ctx.beginPath(); circ(e[1], e[2], e[3] * (0.3 + 0.7 * age / 0.4)); ctx.stroke(); }
      else if (k === 'x' && age < 0.3) { ctx.globalAlpha = 0.6 * (1 - age / 0.3); ctx.fillStyle = e[4]; ctx.beginPath(); circ(e[1], e[2], e[3] * (0.5 + 0.5 * age / 0.3)); ctx.fill(); }
      else if (k === 'b' && age < 0.16) { ctx.globalAlpha = 1 - age / 0.16; ctx.strokeStyle = e[5]; ctx.lineWidth = 3.5; ctx.beginPath(); ctx.moveTo(e[1], e[2]); const mx = (e[1] + e[3]) / 2 + ((f.t * 7) % 30 - 15), my = (e[2] + e[4]) / 2 + ((f.t * 13) % 30 - 15); ctx.lineTo(mx, my); ctx.lineTo(e[3], e[4]); ctx.stroke(); }
      else if (k === 'z' && age < 0.25) { ctx.globalAlpha = 1 - age / 0.25; ctx.strokeStyle = '#fff7b0'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(e[1] + 30, e[2] - 420); ctx.lineTo(e[1] - 14, e[2] - 200); ctx.lineTo(e[1] + 10, e[2] - 110); ctx.lineTo(e[1], e[2]); ctx.stroke(); ctx.fillStyle = '#ffe45c'; ctx.globalAlpha *= 0.5; ctx.beginPath(); circ(e[1], e[2], e[3]); ctx.fill(); }
      else if (k === 'k' && age < 0.22) { ctx.globalAlpha = 0.5 * (1 - age / 0.22); ctx.fillStyle = '#c9b8ff'; ctx.beginPath(); circ(e[1], e[2], ENEMIES[e[3]].r * (1 + age * 5)); ctx.fill(); }
    }
    ctx.globalAlpha = 1;

    // players
    for (const [id, p] of c.P) {
      const b = V.builds.find(x => x.id === id) || { char: 'wick', name: '' }, C = CHARS[b.char];
      const pos = id === myId && !(p.fl & 1) ? [V.me.x, V.me.y] : lerp(V.prev && V.prev.P, id, p), x = pos[0], y = pos[1];
      if (p.fl & 1) {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = '#ffffff55'; ctx.lineWidth = 2; ctx.beginPath(); circ(x, y, 75); ctx.stroke();
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(x, y, 75, -1.57, -1.57 + p.rev / 100 * 6.2832); ctx.stroke();
        ctx.fillStyle = '#555'; ctx.beginPath(); circ(x, y, 12); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.font = 'bold 13px system-ui'; ctx.fillText((b.name || '') + ' is down: stand here', x, y - 84);
        continue;
      }
      ctx.globalCompositeOperation = 'lighter';
      gl(C.c, x, y, p.fl & 16 ? 250 + 20 * Math.sin(now / 70) : 120 + Math.min(110, s.lv * 2.2)); if (p.fl & 2) gl('#ffffff', x, y, 60 + 10 * Math.sin(now / 60));
      ctx.globalCompositeOperation = 'source-over';
      if (p.fl & 8) { ctx.strokeStyle = '#fffbe6'; ctx.lineWidth = 3; ctx.beginPath(); circ(x, y, 21); ctx.stroke(); }
      ctx.fillStyle = '#1b1830'; ctx.beginPath(); circ(x, y, 14); ctx.fill();
      ctx.fillStyle = C.c; ctx.beginPath(); circ(x, y, 10); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.beginPath(); circ(x, y, 4.5); ctx.fill();
      ctx.fillStyle = '#300'; ctx.fillRect(x - 22, y + 21, 44, 5); ctx.fillStyle = p.hp / p.max > 0.35 ? '#6be06a' : '#ff5a4a'; ctx.fillRect(x - 22, y + 21, 44 * Math.max(0, p.hp / p.max), 5);
      if (id !== myId) { ctx.fillStyle = '#ddd'; ctx.font = '12px system-ui'; ctx.fillText(b.name || '', x, y - 22); }
    }
    ctx.globalCompositeOperation = 'source-over';
    // enemy shots always on top, in warning red
    for (const p of late) { ctx.fillStyle = '#ff2d2d'; ctx.beginPath(); circ(p[0], p[1], 8); ctx.fill(); ctx.fillStyle = '#ffd0d0'; ctx.beginPath(); circ(p[0], p[1], 3.5); ctx.fill(); }
    // floating words
    ctx.font = 'bold 15px system-ui';
    for (const f of V.fx) { const e = f.e; if (e[0] !== 't') continue; const age = (now - f.t) / 900; ctx.globalAlpha = 1 - age; ctx.fillStyle = e[4]; ctx.fillText(e[3], e[1], e[2] - age * 34); }
    ctx.globalAlpha = 1;

    // ---------- screen-space HUD ----------
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const vg = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.3, W / 2, H / 2, Math.max(W, H) * 0.72);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.72)'); ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
    if (s.fz & 1) { ctx.fillStyle = 'hsla(' + ((now / 6) % 360) + ',100%,55%,0.13)'; ctx.fillRect(0, 0, W, H); } // Disco Inferno
    if (V.banner && now - V.banner.t < 4200) { // big announcements slam in, then fade
      const age = (now - V.banner.t) / 4200, pop = Math.min(1, age * 14), y = H * 0.24;
      ctx.globalAlpha = age > 0.8 ? (1 - age) * 5 : 1; ctx.textAlign = 'center';
      ctx.save(); ctx.translate(W / 2, y); ctx.rotate((1 - pop) * -0.12 + Math.sin(now / 90) * 0.012); ctx.scale(0.5 + pop * 0.5 + Math.sin(now / 110) * 0.02, 0.5 + pop * 0.5);
      ctx.font = '900 ' + Math.min(64, W / 13) + 'px system-ui'; ctx.lineWidth = 8; ctx.strokeStyle = '#1a0f2a'; ctx.strokeText(V.banner.a.toUpperCase(), 0, 0);
      ctx.fillStyle = 'hsl(' + ((now / 8) % 360) + ',100%,68%)'; ctx.fillText(V.banner.a.toUpperCase(), 0, 0);
      ctx.restore();
      ctx.font = 'bold 20px system-ui'; ctx.lineWidth = 5; ctx.strokeStyle = '#1a0f2a'; ctx.strokeText(V.banner.b, W / 2, y + 40); ctx.fillStyle = '#fff'; ctx.fillText(V.banner.b, W / 2, y + 40);
      ctx.globalAlpha = 1;
    }
    if (V.sub && now - V.sub.t < 4500) { // what the announcer just said
      ctx.globalAlpha = Math.min(1, (4500 - (now - V.sub.t)) / 600); ctx.textAlign = 'center'; ctx.font = 'italic 17px system-ui';
      const w = ctx.measureText(V.sub.a).width + 28; ctx.fillStyle = 'rgba(10,8,22,0.7)'; ctx.fillRect(W / 2 - w / 2, H - 128, w, 30);
      ctx.fillStyle = '#ffe9a0'; ctx.fillText('"' + V.sub.a + '"', W / 2, H - 107); ctx.globalAlpha = 1;
    }
    if (V.flash > 0.02) { ctx.fillStyle = 'rgba(255,225,160,' + (V.flash * 0.35) + ')'; ctx.fillRect(0, 0, W, H); V.flash *= 0.9; }
    ctx.fillStyle = '#1a1730'; ctx.fillRect(0, 0, W, 14); ctx.fillStyle = '#ffd27a'; ctx.fillRect(0, 0, W * Math.min(1, s.xp / s.xn), 14);
    ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.font = 'bold 22px system-ui';
    const tm = Math.floor(s.tm); ctx.fillText(Math.floor(tm / 60) + ':' + String(tm % 60).padStart(2, '0'), W / 2, 44);
    ctx.font = 'bold 15px system-ui'; ctx.textAlign = 'left'; ctx.fillText('Level ' + s.lv, 14, 36);
    ctx.textAlign = 'right'; ctx.fillText(s.k + ' defeated', W - 14, 36); ctx.textAlign = 'center';
    if (s.bo) { const bw = Math.min(620, W * 0.6); ctx.fillStyle = '#2a0f3a'; ctx.fillRect(W / 2 - bw / 2, 58, bw, 14); ctx.fillStyle = '#c9a8ff'; ctx.fillRect(W / 2 - bw / 2, 58, bw * s.bo / 1000, 14); ctx.fillStyle = '#fff'; ctx.font = 'bold 13px system-ui'; ctx.fillText(MP.boss, W / 2, 88); }
    if (meS) {
      const rdy = !meS.sk, b = V.builds.find(x => x.id === myId), C = b && CHARS[b.char];
      if (C) { ctx.fillStyle = rdy ? C.c : '#444'; ctx.beginPath(); circ(W / 2 - 60, H - 46, 22); ctx.fill(); ctx.fillStyle = rdy ? '#111' : '#bbb'; ctx.font = 'bold 13px system-ui'; ctx.fillText(rdy ? 'SPACE' : (meS.sk / 10).toFixed(0), W / 2 - 60, H - 41); ctx.fillStyle = '#ccc'; ctx.fillText(C.skill, W / 2 - 60, H - 10);
        const ur = meS.ul === 0, ux = W / 2 + 60;
        ctx.fillStyle = ur ? '#ffd27a' : '#333'; ctx.beginPath(); circ(ux, H - 46, 22); ctx.fill();
        if (ur) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 2 + Math.sin(now / 120); ctx.beginPath(); circ(ux, H - 46, 25); ctx.stroke(); }
        ctx.fillStyle = ur ? '#111' : '#999'; ctx.fillText(meS.ul < 0 ? 'Lv 6' : ur ? 'Q' : meS.ul, ux, H - 41); ctx.fillStyle = '#ccc'; ctx.fillText(C.ult, ux, H - 10); }
      if (down) { ctx.fillStyle = '#fff'; ctx.font = 'bold 26px system-ui'; ctx.fillText('You are down. A friend can revive you.', W / 2, H / 2 - 110); }
    }
    if (V.world) { // minimap, bottom left
      const M = 150, mx = 12, my = H - M - 12, sc2 = M / (Sim.WORLD * 2), px = x => mx + (x + Sim.WORLD) * sc2, py = y => my + (y + Sim.WORLD) * sc2;
      const dot = (x, y, col, r) => { ctx.fillStyle = col; ctx.beginPath(); circ(px(x), py(y), r); ctx.fill(); };
      ctx.fillStyle = 'rgba(10,8,22,0.72)'; ctx.fillRect(mx, my, M, M); ctx.strokeStyle = '#3a2f66'; ctx.lineWidth = 1.5; ctx.strokeRect(mx, my, M, M);
      ctx.fillStyle = '#262240'; for (const k of V.world.rocks) ctx.fillRect(px(k.x) - 1.5, py(k.y) - 1.5, 3, 3);
      V.world.sites.forEach((t, i) => { const st = s.si ? s.si[i] : 0; if (st >= 0) { ctx.globalAlpha = st === 0 ? 1 : 0.35; dot(t.x, t.y, World.SITES[t.k].c, 3.5); ctx.globalAlpha = 1; } });
      if (s.sh) dot(s.sh[0], s.sh[1], '#ffd27a', 5);
      if (s.al) dot(s.al[0], s.al[1], '#b070ff', 5);
      if (s.ca) { dot(s.ca[0], s.ca[1], '#ffe45c', 4); ctx.strokeStyle = '#ffe45c'; ctx.beginPath(); circ(px(s.ca[2]), py(s.ca[3]), 4); ctx.stroke(); }
      if (s.bo) for (const e of c.E.values()) if (e.type === 5) dot(e.x, e.y, '#ff4a4a', 5);
      for (const [id, p] of c.P) { const b = V.builds.find(x => x.id === id); dot(id === myId ? V.me.x : p.x, id === myId ? V.me.y : p.y, b ? CHARS[b.char].c : '#fff', id === myId ? 4 : 3); if (id === myId) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.beginPath(); circ(px(V.me.x), py(V.me.y), 6); ctx.stroke(); } }
    }
    if (s.cu) { ctx.fillStyle = '#d0a8ff'; ctx.font = 'bold 18px system-ui'; ctx.fillText('Dark Bargain: survive ' + s.cu + 's', W / 2, s.bo ? 112 : 72); }
    if (s.sh) { // arrow to the shrine when it is off screen
      const dx = s.sh[0] - cx, dy = s.sh[1] - cy;
      if (Math.abs(dx) * scale > W / 2 - 40 || Math.abs(dy) * scale > H / 2 - 40) {
        const an = Math.atan2(dy, dx), r = Math.min(W, H) / 2 - 70, x = W / 2 + Math.cos(an) * r, y = H / 2 + Math.sin(an) * r;
        ctx.save(); ctx.translate(x, y); ctx.rotate(an); ctx.fillStyle = '#ffd27a'; ctx.beginPath(); ctx.moveTo(18, 0); ctx.lineTo(-10, -11); ctx.lineTo(-10, 11); ctx.fill(); ctx.restore();
        ctx.fillStyle = '#ffd27a'; ctx.font = 'bold 12px system-ui'; ctx.fillText('Shrine', x, y + 26);
      }
    }
  }
  return { init, draw };
})();
