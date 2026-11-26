'use strict';
// All game content lives here as plain tables.

const ELEM = {
  ember: { name: 'Ember', c: '#ff8a3c', mark: 'burn' },
  frost: { name: 'Frost', c: '#7fd8ff', mark: 'chill' },
  storm: { name: 'Storm', c: '#ffe45c', mark: 'shock' },
  bloom: { name: 'Bloom', c: '#8be06a', mark: 'rot' },
  light: { name: 'Light', c: '#ffffff', mark: null },
};

const WEAPONS = {
  darts:  { name: 'Ember Darts',  el: 'ember', charm: 'eye',    evo: 'Phoenix Volley', desc: 'Fires bolts at the nearest enemies. Burns.', evoDesc: 'More bolts, and each one explodes.' },
  trail:  { name: 'Cinder Trail', el: 'ember', charm: 'boots',  evo: 'Wildfire Wake',  desc: 'Leaves fire where you walk. Burns.', evoDesc: 'The fire is far wider and lasts much longer.' },
  chime:  { name: 'Frost Chime',  el: 'frost', charm: 'bell',   evo: 'Glacier Toll',   desc: 'A ring of cold pulses out around you. Chills.', evoDesc: 'Bigger ring that freezes enemies solid.' },
  hail:   { name: 'Hail Shards',  el: 'frost', charm: 'twin',   evo: 'Blizzard',       desc: 'Piercing shards fly in random directions. Chills.', evoDesc: 'A constant storm of shards.' },
  chain:  { name: 'Chain Spark',  el: 'storm', charm: 'quick',  evo: 'Thunderhead',    desc: 'Lightning that jumps from enemy to enemy. Shocks.', evoDesc: 'Jumps many more times and hits harder.' },
  cloud:  { name: 'Storm Cloud',  el: 'storm', charm: 'wick',   evo: 'Tempest',        desc: 'Lightning strikes random enemies nearby. Shocks.', evoDesc: 'Triple strikes with much bigger blasts.' },
  thorns: { name: 'Thorn Seeds',  el: 'bloom', charm: 'heart',  evo: 'Briar Kingdom',  desc: 'Grows thorn patches under enemies. Rots.', evoDesc: 'Huge patches that also slow enemies.' },
  moths:  { name: 'Spore Moths',  el: 'bloom', charm: 'magnet', evo: 'Mothstorm',      desc: 'Moths orbit you and hit what they touch. Rots.', evoDesc: 'Many more moths in a wider, faster ring.' },
  sickle: { name: 'Moon Sickle',  el: 'light', charm: 'might',  evo: 'Eclipse Blades', desc: 'A blade flies out through enemies and returns.', evoDesc: 'Three bigger blades at once.' },
  beam:   { name: 'Lantern Beam', el: 'light', charm: 'coat',   evo: 'Lighthouse',     desc: 'A sweeping beam of light. Crits often.', evoDesc: 'Two long beams sweeping together.' },
  meteor: { name: 'Falling Star', el: 'ember', charm: 'bell',   evo: 'Starfall',       desc: 'A meteor crashes into a crowd and leaves fire. Burns.', evoDesc: 'Three meteors at a time.', goal: 'evo1' },
  brand:  { name: 'Branding Iron', el: 'ember', charm: 'coat',  evo: 'Sunbrand',       desc: 'A heavy close-range swing at the nearest enemy. Burns.', evoDesc: 'Swings in a full, wider circle.' },
  icicle: { name: 'Icicle Lance', el: 'frost', charm: 'might',  evo: 'Glacier Spear',  desc: 'A huge lance through the toughest enemy nearby. Chills.', evoDesc: 'Explodes and freezes everything it passes through.' },
  rime:   { name: 'Rime Aura',    el: 'frost', charm: 'heart',  evo: 'Heart of Winter', desc: 'A constant ring of cold around you. Chills.', evoDesc: 'Much wider, and sometimes freezes enemies solid.', goal: 'kills1k' },
  orb:    { name: 'Ball Lightning', el: 'storm', charm: 'bell', evo: 'Storm Heart',    desc: 'A slow drifting orb that keeps zapping what it touches. Shocks.', evoDesc: 'Two much larger orbs.', goal: 'lvl20' },
  rod:    { name: 'Lightning Rod', el: 'storm', charm: 'lens',  evo: 'Tesla Grove',    desc: 'Plants a rod that zaps enemies near it. Shocks.', evoDesc: 'Rods last twice as long and hit three targets.' },
  vine:   { name: 'Lash Vine',    el: 'bloom', charm: 'quick',  evo: 'Hydra Vines',    desc: 'Whips a line through the nearest enemy. Rots.', evoDesc: 'Three vines lash three targets at once.' },
  sprout: { name: 'Sproutling',   el: 'bloom', charm: 'lens',   evo: 'Elder Bloom',    desc: 'Plants a little helper that shoots seeds. Rots.', evoDesc: 'Two helpers whose seeds pierce.', goal: 'min8' },
  halo:   { name: 'Halo',         el: 'light', charm: 'heart',  evo: 'Aegis',          desc: 'Every few seconds, blocks one hit and bursts with light.', evoDesc: 'Holds two blocks and heals you when one breaks.', goal: 'boon3' },
  judge:  { name: 'Judgement',    el: 'light', charm: 'lens',   evo: 'Daybreak',       desc: 'A slow, huge flash that hits everything around you.', evoDesc: 'Twice as often, and finishes off weakened enemies.', goal: 'win' },
};

const CHARMS = {
  might:  { name: 'Might',          desc: '+10% damage',                 f: (s, l) => { s.dmg += 0.10 * l; } },
  quick:  { name: 'Quick Hands',    desc: 'Weapons fire 8% faster',      f: (s, l) => { s.cdr += 0.08 * l; } },
  bell:   { name: 'Wide Bell',      desc: '+10% area',                   f: (s, l) => { s.area += 0.10 * l; } },
  wick:   { name: 'Long Wick',      desc: 'Effects and marks last 12% longer', f: (s, l) => { s.dur += 0.12 * l; s.markDur += 0.12 * l; } },
  boots:  { name: 'Swift Boots',    desc: '+7% move speed',              f: (s, l) => { s.spd += 0.07 * l; } },
  coat:   { name: 'Thick Coat',     desc: '+2 armor',                    f: (s, l) => { s.armor += 2 * l; } },
  heart:  { name: 'Heartwood',      desc: '+20 health, faster healing',  f: (s, l) => { s.maxhp += 20 * l; s.regen += 0.35 * l; } },
  magnet: { name: 'Magnet Moth',    desc: '+30% pickup range',           f: (s, l) => { s.pickup *= 1 + 0.3 * l; } },
  eye:    { name: 'Keen Eye',       desc: '+6% crit chance',             f: (s, l) => { s.crit += 0.06 * l; } },
  twin:   { name: 'Twin Flame',     desc: 'More projectiles (1/1/2/2/3)', f: (s, l) => { s.proj += [1, 1, 2, 2, 3][l - 1]; } },
  lens:   { name: "Scholar's Lens", desc: '+8% XP',                      f: (s, l) => { s.xp += 0.08 * l; } },
};

const BOONS = {
  glass:    { name: 'Glass Lantern',  desc: '+40% damage, but -30% max health',            f: s => { s.dmg += 0.4; s.maxhp *= 0.7; } },
  second:   { name: 'Second Wind',    desc: 'Once this run, get back up by yourself' },
  conduct:  { name: 'Conductor',      desc: 'Your Shock spreads to a second enemy nearby' },
  roots:    { name: 'Deep Roots',     desc: 'Standing still heals you quickly' },
  kindred:  { name: 'Kindred Flames', desc: '+10% damage, +8% more per teammate near you' , f: s => { s.dmg += 0.1; } },
  alchemy:  { name: 'Alchemist',      desc: 'Reactions deal +50% damage',                  f: s => { s.react += 0.5; } },
  bigbell:  { name: 'Cathedral Bell', desc: '+30% area, but weapons fire 10% slower',      f: s => { s.area += 0.3; s.cdr -= 0.1; } },
  feather:  { name: 'Featherstep',    desc: '+20% move speed, but -15% max health',        f: s => { s.spd += 0.2; s.maxhp *= 0.85; } },
  hoarder:  { name: 'Hoarder',        desc: '+60% pickup range and +20% XP',               f: s => { s.pickup *= 1.6; s.xp += 0.2; } },
  fog:      { name: 'Ironbark',       desc: '+5 armor, but -8% move speed',                f: s => { s.armor += 5; s.spd -= 0.08; } },
  linger:   { name: 'Lingering Marks', desc: 'Your marks last 60% longer',                 f: s => { s.markDur += 0.6; } },
  twinsoul: { name: 'Twin Soul',      desc: '+1 projectile, but -12% damage',              f: s => { s.proj += 1; s.dmg -= 0.12; } },
  frenzy:   { name: 'Frenzy',         desc: 'Weapons fire 20% faster',                     f: s => { s.cdr += 0.2; } },
  blood:    { name: 'Hearthblood',    desc: 'Kills sometimes heal you' },
  sturdy:   { name: 'Sturdy',         desc: '+35 max health',                              f: s => { s.maxhp += 35; } },
  swift:    { name: 'Tailwind',       desc: '+10% move speed',                             f: s => { s.spd += 0.1; } },
  sharp:    { name: 'Whetstone',      desc: '+12% damage',                                 f: s => { s.dmg += 0.12; } },
  wide:     { name: 'Open Arms',      desc: '+12% area',                                   f: s => { s.area += 0.12; } },
  lasting:  { name: 'Slow Burn',      desc: 'Effects last 25% longer',                     f: s => { s.dur += 0.25; } },
  pyre:     { r: 2, name: 'Pyre',       desc: 'Your Burn deals double damage' },
  perma:    { r: 2, name: 'Permafrost', desc: 'Your Chill slows enemies far more' },
  surge:    { r: 2, name: 'Power Surge', desc: 'Enemies you Shock take 50% more damage instead of 25%' },
  blight:   { r: 2, name: 'Blight',     desc: 'Your Rot stacks twice as high' },
  echo:     { r: 2, name: 'Echo',       desc: 'Weapons have a 20% chance to fire again at once' },
  berserk:  { r: 2, name: 'Last Stand', desc: 'Deal up to +80% damage the lower your health is' },
  giant:    { r: 2, name: 'Giant',      desc: '+25% area and +40 max health, but -10% move speed', f: s => { s.area += 0.25; s.maxhp += 40; s.spd -= 0.1; } },
  prism:    { r: 3, name: 'Prism',      desc: 'All your weapons count as every element for Resonance' },
  catalyst: { r: 3, name: 'Catalyst',   desc: 'Your reactions no longer use up the marks, so they keep triggering' },
  titan:    { r: 3, name: 'Titan',      desc: 'Double max health and +50% area, but -15% move speed', f: s => { s.maxhp *= 2; s.area += 0.5; s.spd -= 0.15; } },
  overclk:  { r: 3, name: 'Overclock',  desc: 'Weapons fire 45% faster',                  f: s => { s.cdr += 0.45; } },
  volley:   { r: 3, name: 'Volley',     desc: '+2 projectiles',                           f: s => { s.proj += 2; } },
};

const CHARS = {
  wick:     { name: 'Wick',     title: 'the torch-runner', c: '#ff8a3c', weapon: 'darts',  passive: '+15% damage',
              skill: 'Flare Dash', ult: 'Inferno', ultDesc: 'Five seconds of fire waves around you.', skillDesc: 'Dash forward untouchable, leaving fire.', cd: 6,
              f: s => { s.dmg += 0.15; } },
  mara:     { name: 'Mara',     title: 'the bell-ringer',  c: '#7fd8ff', weapon: 'chime',  passive: '+3 armor, marks last longer',
              skill: 'Deep Toll', ult: 'Absolute Zero', ultDesc: 'Freeze and damage everything on screen.', skillDesc: 'Freeze every enemy around you.', cd: 12,
              f: s => { s.armor += 3; s.markDur += 0.3; } },
  tolliver: { name: 'Tolliver', title: 'the kite-flyer',   c: '#ffe45c', weapon: 'chain',  passive: '+12% move speed',
              skill: 'Skyhook', ult: 'Tempest Ride', ultDesc: 'Five seconds of constant lightning strikes.', skillDesc: 'Blink forward and land with a lightning blast.', cd: 7,
              f: s => { s.spd += 0.12; }, goal: 'lvl10' },
  bryn:     { name: 'Bryn',     title: 'the gardener',     c: '#8be06a', weapon: 'thorns', passive: 'Heals over time, +20 health',
              skill: 'Bloom Circle', ult: 'Verdant Tide', ultDesc: 'Revive and heal everyone, and grow a huge thorn field.', skillDesc: 'A healing ring for everyone inside it.', cd: 14,
              f: s => { s.regen += 1.2; s.maxhp += 20; }, goal: 'shrine2' },
};
const CHAR_IDS = Object.keys(CHARS);

// type index order matters (sent over the network as a number)
const ENEMIES = [
  { id: 'gloom',   hp: 16,   spd: 62,  dmg: 6,  r: 11, xp: 1,  c: '#6b5a8e' },
  { id: 'skitter', hp: 9,    spd: 128, dmg: 5,  r: 8,  xp: 1,  c: '#b05a7a' },
  { id: 'husk',    hp: 120,  spd: 42,  dmg: 14, r: 18, xp: 5,  c: '#4f6f6a' },
  { id: 'spitter', hp: 36,   spd: 58,  dmg: 9,  r: 12, xp: 3,  c: '#8a6a3a' },
  { id: 'elite',   hp: 700,  spd: 58,  dmg: 22, r: 30, xp: 25, c: '#c0392b' },
  { id: 'boss',    hp: 7000, spd: 70,  dmg: 30, r: 48, xp: 0,  c: '#e8e0ff' },
];

// The Hearth: permanent upgrades bought with Embers.
const HEARTH = {
  might:   { branch: 'Flame', name: 'Bright Flame',  desc: '+4% damage',             max: 10, base: 40 },
  keen:    { branch: 'Flame', name: 'Sharp Light',   desc: '+2% crit chance',        max: 5,  base: 60 },
  reach:   { branch: 'Flame', name: 'Long Shadows',  desc: '+3% area',               max: 5,  base: 60 },
  tempo:   { branch: 'Flame', name: 'Quick Wick',    desc: 'Weapons fire 2.5% faster', max: 6, base: 70 },
  alchemy: { branch: 'Flame', name: 'Old Recipes',   desc: '+8% reaction damage',    max: 5,  base: 60 },
  vigor:   { branch: 'Stone', name: 'Hearty Stew',   desc: '+8 max health',          max: 10, base: 35 },
  plating: { branch: 'Stone', name: 'Patched Coat',  desc: '+1 armor',               max: 5,  base: 80 },
  mending: { branch: 'Stone', name: 'Warm Bed',      desc: 'Heal faster over time',  max: 5,  base: 50 },
  stride:  { branch: 'Wind',  name: 'Worn Boots',    desc: '+2% move speed',         max: 5,  base: 50 },
  magnet:  { branch: 'Wind',  name: 'Moth Jar',      desc: '+8% pickup range',       max: 5,  base: 40 },
  wisdom:  { branch: 'Wind',  name: 'Night Stories', desc: '+3% XP',                 max: 6,  base: 60 },
  fortune: { branch: 'Wind',  name: 'Deep Pockets',  desc: '+6% Embers earned',      max: 5,  base: 70 },
  reroll:  { branch: 'Wind',  name: 'Second Thoughts', desc: '+1 card reroll each night', max: 3, base: 120 },
  banish:  { branch: 'Wind',  name: 'Clean Slate',   desc: '+1 banish each night (remove a card for the whole night)', max: 3, base: 120 },
  cards:   { branch: 'Wind',  name: 'Wider View',    desc: 'A 4th card to choose from on every level-up', max: 1, base: 900 },
};
const hearthCost = (id, rank) => Math.round(HEARTH[id].base * (1 + rank * 0.7));

// Goals: checked at the end of every run against that run's results.
const GOALS = {
  lvl10:   { name: 'Getting Warmer',  desc: 'Reach level 10 in a run',          reward: 'Unlocks Tolliver', test: r => r.level >= 10 },
  shrine2: { name: 'Lamplighter',     desc: 'Light 2 shrines in one run',       reward: 'Unlocks Bryn',     test: r => r.shrines >= 2 },
  react50: { name: 'Chemistry Set',   desc: 'Cause 50 reactions in one run',    reward: '100 Embers', embers: 100, test: r => r.reactions >= 50 },
  evo1:    { name: 'Metamorphosis',   desc: 'Evolve a weapon',                  reward: 'Unlocks the weapon Falling Star', test: r => r.evos >= 1 },
  kills1k: { name: 'Clear the Dark',  desc: 'Defeat 1,000 enemies in one run',  reward: 'Unlocks the weapon Rime Aura', test: r => r.kills >= 1000 },
  min8:    { name: 'Long Night',      desc: 'Survive 8 minutes',                reward: 'Unlocks the weapon Sproutling', test: r => r.time >= 480 },
  win:     { name: 'First Dawn',      desc: 'Defeat the Hollow Stag',           reward: '300 Embers and the weapon Judgement', embers: 300, test: r => r.win },
  coop:    { name: 'Better Together', desc: 'Survive 3 minutes with a friend',       reward: '100 Embers', embers: 100, test: r => r.players >= 2 && r.time >= 180 },
  evo3:    { name: 'Walking Storm',   desc: 'Evolve 3 weapons in one run',      reward: '250 Embers', embers: 250, test: r => r.evos >= 3 },
  lvl20:   { name: 'Burning Bright',  desc: 'Reach level 20 in a run',          reward: 'Unlocks the weapon Ball Lightning', test: r => r.level >= 20 },
  boon3:   { name: 'Blessed',         desc: 'Hold 3 Boons in one run',          reward: 'Unlocks the weapon Halo', test: r => r.boons >= 3 },
  react500: { name: 'Mad Science',    desc: 'Cause 500 reactions in one run',   reward: '250 Embers', embers: 250, test: r => r.reactions >= 500 },
  lvl40:   { name: 'Godlight',        desc: 'Reach level 40 in a run',          reward: '400 Embers', embers: 400, test: r => r.level >= 40 },
};

// Account maths shared by menus and the game.
const Account = {
  rank(xp) { let l = 1; while (xp >= 300 + 150 * l) { xp -= 300 + 150 * l; l++; } return { lvl: l, into: xp, need: 300 + 150 * l }; },
  keeper(xp) { let l = 0; while (xp >= 250 + 100 * l && l < 50) { xp -= 250 + 100 * l; l++; } return { lvl: l, into: xp, need: 250 + 100 * l }; },
  mastery(dmg) { let r = 0, t = 4000; while (dmg >= t && r < 10) { dmg -= t; t *= 2.2; r++; } return { rank: r, into: dmg, need: t }; },
};
