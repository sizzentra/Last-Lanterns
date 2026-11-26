'use strict';
// The long game: difficulties, Curses, Heirlooms, talents and Hearth keystones.

const DIFFS = [
  { name: 'Dusk',     hp: 1,   dmg: 1,   rew: 1 },
  { name: 'Midnight', hp: 2,   dmg: 1.4, rew: 1.6 },
  { name: 'Eclipse',  hp: 3.5, dmg: 1.8, rew: 2.4 },
];
// beyond Eclipse the Depths go on forever
const diffOf = d => d < 3 ? DIFFS[Math.max(0, d)] : { name: 'Depth ' + (d - 2), hp: 3.5 * Math.pow(1.5, d - 2), dmg: 1.8 * Math.pow(1.2, d - 2), rew: 2.4 + 0.6 * (d - 2) };

const CURSES = {
  swift:  { name: 'Quickened',   desc: 'Enemies move 25% faster',               rew: 0.15 },
  frail:  { name: 'Frail',       desc: 'Everyone has 30% less max health',      rew: 0.15 },
  famine: { name: 'Famine',      desc: 'No healing hearts, and you heal half as fast', rew: 0.15 },
  horde:  { name: 'Horde',       desc: '40% more enemies',                      rew: 0.2 },
  twins:  { name: 'Twins',       desc: 'Elites and Wardens come in pairs',      rew: 0.2 },
  dim:    { name: 'Dim Lantern', desc: 'Pickup range is halved',                rew: 0.1 },
  enrage: { name: 'Wrath',       desc: 'The boss starts the fight enraged',     rew: 0.15 },
};
const rewardMult = (d, curses) => diffOf(d).rew * (1 + (curses || []).reduce((a, c) => a + (CURSES[c] ? CURSES[c].rew : 0), 0));

// Keystones: big one-off Hearth upgrades that need a Keeper Rank
Object.assign(HEARTH, {
  kcharm: { branch: 'Keystone', name: 'Packed Bag',  desc: 'Start every night with a random charm',       max: 1, base: 600,  rank: 3 },
  kboon:  { branch: 'Keystone', name: 'Old Blessing', desc: 'Start every night with a random common Boon', max: 1, base: 900,  rank: 6 },
  kslot:  { branch: 'Keystone', name: 'Sixth Hand',  desc: 'Carry a 6th weapon',                          max: 1, base: 1500, rank: 10 },
});

// Talents: each keeper level gives one point for that keeper.
const TALENTS = {
  edge:   { name: 'Honed',        desc: '+3% damage',                 max: 5, stat: ['dmg', 0.03] },
  hide:   { name: 'Weathered',    desc: '+10 max health',             max: 5, stat: ['maxhp', 10] },
  fleet:  { name: 'Light Feet',   desc: '+1.5% move speed',           max: 5, stat: ['spd', 0.015] },
  focus:  { name: 'Practised',    desc: 'Skill recharges 6% faster',  max: 5 },
  surge:  { name: 'Inner Fire',   desc: 'Ultimate recharges 6% faster', max: 5 },
  attune: { name: 'Attuned',      desc: "+6% damage with this keeper's own element", max: 3, need: 5 },
  gift:   { name: 'Family Weapon', desc: 'Your starting weapon begins at level 2', max: 1, cost: 3, need: 5 },
};

// Heirlooms: equipment found at the end of a night.
const HSTATS = { // stat: [label, base value, display multiplier]
  dmg: ['% damage', 0.03, 100], maxhp: [' max health', 10, 1], cdr: ['% weapon speed', 0.025, 100], area: ['% area', 0.03, 100],
  crit: ['% crit chance', 0.015, 100], spd: ['% move speed', 0.015, 100], xp: ['% XP', 0.03, 100], armor: [' armor', 1, 1],
  regen: [' health per second', 0.3, 1], react: ['% reaction damage', 0.05, 100], pickupP: ['% pickup range', 0.08, 100],
};
const RARITY = [null, { name: 'Common', c: '#cfc8ea', m: 1 }, { name: 'Rare', c: '#6bb8ff', m: 1.6 }, { name: 'Epic', c: '#c58bff', m: 2.4 }, { name: 'Legendary', c: '#ffb347', m: 3.5 }];
const H_ADJ = ['Tarnished', 'Moth-eaten', 'Old', 'Lucky', 'Singed', 'Frosted', 'Humming', 'Mossy', 'Gleaming', "Keeper's", 'Borrowed', 'Forgotten'];
const H_NOUN = ['Bell', 'Scarf', 'Flint', 'Ring', 'Compass', 'Whistle', 'Locket', 'Candle', 'Thimble', 'Feather', 'Key', 'Lens'];

const Meta = {
  slots: rank => 1 + (rank >= 4 ? 1 : 0) + (rank >= 8 ? 1 : 0) + (rank >= 14 ? 1 : 0),
  roll(diff) {
    const w = [0, Math.max(20, 60 - diff * 10), 28, 10 + diff * 4, 2 + diff * 2];
    let r = Math.random() * (w[1] + w[2] + w[3] + w[4]), rar = 1; while (rar < 4 && (r -= w[rar]) > 0) rar++;
    const keys = Object.keys(HSTATS), lines = [];
    for (let i = 0; i < rar; i++) { const k = keys.splice(Math.random() * keys.length | 0, 1)[0]; lines.push([k, HSTATS[k][1] * RARITY[rar].m * (0.8 + Math.random() * 0.4)]); }
    return { id: Date.now().toString(36) + (Math.random() * 1e6 | 0).toString(36), n: H_ADJ[Math.random() * H_ADJ.length | 0] + ' ' + H_NOUN[Math.random() * H_NOUN.length | 0], r: rar, lines, lvl: 0 };
  },
  lineText(h, l) { const S = HSTATS[l[0]], v = l[1] * (1 + 0.2 * h.lvl) * S[2]; return '+' + (v >= 10 ? Math.round(v) : v.toFixed(1)) + S[0]; },
  upCost: h => 20 * (h.lvl + 1) * h.r,
  salvage: h => 10 * h.r * (1 + h.lvl),
  talentPoints(save, c) { const t = save.talents[c] || {}; let used = 0; for (const id in t) used += t[id] * (TALENTS[id].cost || 1); return { total: Account.keeper(save.keeper[c] || 0).lvl, used }; },
  // everything the account adds to a keeper, sent to the host at the start of a night
  bonus(save, c) {
    const x = {}, el = {}, f = {}, add = (k, v) => { x[k] = (x[k] || 0) + v; };
    for (const h of save.heir) if (save.equip.indexOf(h.id) >= 0) for (const l of h.lines) add(l[0], l[1] * (1 + 0.2 * h.lvl));
    const t = save.talents[c] || {};
    for (const id in t) { const T = TALENTS[id]; if (T && T.stat) add(T.stat[0], T.stat[1] * t[id]); }
    if (t.focus) f.skillCd = 1 - 0.06 * t.focus;
    if (t.surge) f.ultCd = 1 - 0.06 * t.surge;
    if (t.gift) f.startLvl = 1;
    if (t.attune) el[WEAPONS[CHARS[c].weapon].el] = 0.06 * t.attune;
    return { x, el, f };
  },
};
