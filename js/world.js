'use strict';
// The map layout for one night: rocks that block the way and landmarks worth walking to.
// It is built from a single seed number, so every player's browser builds the same map.
const World = {
  SITES: [
    { name: 'Ember Cache', c: '#ffb347' },  // 0: open once for Embers and XP
    { name: 'Healing Well', c: '#6be0c0' }, // 1: heals the team, then recharges
    { name: 'Old Bell', c: '#fff2b0' },     // 2: stuns and hurts every enemy around, then recharges
  ],
  gen(seed) {
    let s = seed >>> 0; const r = () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
    const W = 1700, rocks = [], sites = [];
    for (let i = 0; i < 52; i++) { const x = (r() * 2 - 1) * (W - 90), y = (r() * 2 - 1) * (W - 90), rad = 26 + r() * 50; if (x * x + y * y > 250 * 250) rocks.push({ x, y, r: rad }); }
    const place = k => {
      for (let t = 0; t < 60; t++) {
        const x = (r() * 2 - 1) * (W - 260), y = (r() * 2 - 1) * (W - 260);
        if (x * x + y * y < 450 * 450) continue;
        if (sites.some(o => (o.x - x) ** 2 + (o.y - y) ** 2 < 420 * 420)) continue;
        if (rocks.some(o => (o.x - x) ** 2 + (o.y - y) ** 2 < (o.r + 100) ** 2)) continue;
        sites.push({ k, x, y }); return;
      }
    };
    for (const k of [0, 0, 0, 0, 1, 1, 2]) place(k);
    return { rocks, sites };
  },
  // push a circle (a player or an enemy) out of any rock it overlaps
  collide(world, o, rad) {
    if (!world) return;
    for (const k of world.rocks) {
      const dx = o.x - k.x, dy = o.y - k.y, rr = k.r + rad, q = dx * dx + dy * dy;
      if (q < rr * rr && q > 0.0001) { const d = Math.sqrt(q); o.x = k.x + dx / d * rr; o.y = k.y + dy / d * rr; }
    }
  },
};
