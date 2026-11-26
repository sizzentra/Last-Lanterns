# Design: Last Lanterns (working title)

An original online co-op swarm-survival game for 1 to 4 friends in the browser. Built on the lessons in [RESEARCH.md](RESEARCH.md). Inspired by the genre's mechanics only: the world, characters, enemies, weapons and look are its own.

Items tagged **[v1]** are in the first playable build. Everything else is planned and listed in build order at the end.

---

## 1. The idea in a few lines

The sun has gone out. A creeping dark called **the Gloom** is swallowing the land, and things live in it. You and your friends are **Lanternkeepers**: you carry the last lights into the dark, survive the night, and bring embers home to rebuild the **Hearth**.

- **Look:** a dark world where everything that matters glows. Simple bold shapes, bright colours on near-black, drawn by the game itself (no image files). Each element has its own colour, so a build is readable at a glance.
- **Feel:** start as one small light being hunted; end as a god of light, filling the screen, with three friends doing the same. Feeling godlike by the end of a run, and more so as the account grows, is a stated goal (the user asked for it): numbers and effects should get visibly, absurdly big, and harder nights exist so that power always has something worth using it on.
- **What makes it its own:** the **element reaction system**. Weapons mark enemies with Burn, Chill, Shock or Rot, and two different marks on one enemy set off a reaction. Marks from different players react too, so a team's builds combine into something none of them has alone.

## 2. Controls

| Action | Keys |
|---|---|
| Move | **WASD** (arrow keys also work) **[v1]** |
| Weapons | Fire by themselves **[v1]** |
| Character skill | **Space** **[v1]** |
| Ultimate | **Q** (from level 6) |
| Pick an upgrade card | **1 / 2 / 3** or click **[v1]** |
| Revive a friend | Stand in their circle **[v1]** |

## 3. How a run goes

- A run is one **Night**: survive **12 minutes**, then defeat the boss. The clock stops while people pick cards. **[v1: one map, one boss]**
- Minute by minute: thin trickle (0-2), first packs and first shrine (2-4), elites and ranged enemies (4-8), heavy swarms (8-12), boss.
- The boss grows angrier the longer the fight lasts, so it cannot be dragged out.
- Win or lose, everyone goes home with **Embers** (the between-run currency).

### Levelling **[v1]**
- Enemies drop **sparks** (XP). **XP is shared**: any spark anyone collects fills one team bar, and everyone levels at the same moment.
- On a level-up the game pauses and **each player picks 1 of 3 cards for their own build**. There is a 15-second timer; if it runs out a card is picked for you. Keys 1/2/3 make it fast.
- Each player has **5 weapon slots** and **5 charm slots**. Weapons and charms go to **level 5**.
- Later: **reroll**, **banish** (remove a card for the rest of the run) and **hold** (save a card for later), bought in limited numbers at the Hearth.

## 4. Options and synergy (the heart of the game)

There are five layers. Each is simple by itself; the depth is in how they multiply.

### Layer 1: Elements and reactions **[v1]**
Every weapon belongs to one element, and most leave a **mark** on what they hit.

| Element | Colour | Mark | What the mark does |
|---|---|---|---|
| Ember | orange | **Burn** | damage over time |
| Frost | ice blue | **Chill** | slows the enemy |
| Storm | yellow | **Shock** | enemy takes more damage from everything |
| Bloom | green | **Rot** | damage over time that stacks up |
| Light | white | none | hits hardest, crits more |

Two different marks on the same enemy trigger a **reaction** and are used up:

| Marks | Reaction | Effect |
|---|---|---|
| Burn + Chill | **Steam Burst** | explosion damaging everything nearby **[v1]** |
| Chill + Shock | **Shatter** | huge single hit, freezes it solid briefly **[v1]** |
| Burn + Rot | **Wildfire** | the burn jumps to nearby enemies **[v1]** |
| Shock + Rot | **Sporestorm** | lightning arcs to several nearby enemies **[v1]** |
| Burn + Shock | **Overload** | knocks enemies back and stuns them |
| Chill + Rot | **Frostbite** | enemy takes heavy damage over time and drops extra sparks |

Why this matters in co-op: a Frost player and a Storm player standing together cause Shatters neither could cause alone. Talking about who brings which element is the team strategy.

### Layer 2: Resonance (set bonuses) **[v1]**
Owning several weapons of one element makes that element stronger: **2 weapons: +20% damage** for that element, **3 or more: +45% and its mark lasts longer**. This pulls against Layer 1 (which wants variety), so every build is a real choice between going deep and going wide.

### Layer 3: Weapons and evolutions
Each weapon has a shape and a job. At max level, if you also own its partner charm, it can **evolve** into a far stronger form. **[v1: 10 weapons, all with evolutions]**

| Weapon | Element | What it does | Partner charm | Evolves into |
|---|---|---|---|---|
| Ember Darts | Ember | bolts at the nearest enemy | Keen Eye | Phoenix Volley (bolts explode) |
| Cinder Trail | Ember | fire where you walk | Swift Boots | Wildfire Wake (wide, lasting) |
| Frost Chime | Frost | ring pulse around you | Wide Bell | Glacier Toll (freezes solid) |
| Hail Shards | Frost | piercing shards in random directions | Twin Flame | Blizzard (constant spray) |
| Chain Spark | Storm | lightning that jumps between enemies | Quick Hands | Thunderhead (many more jumps) |
| Storm Cloud | Storm | a cloud that strikes random enemies | Long Wick | Tempest (two clouds, bigger blasts) |
| Thorn Seeds | Bloom | thorn patches on the ground | Heartwood | Briar Kingdom (huge patches that slow) |
| Spore Moths | Bloom | moths that orbit you | Magnet Moth | Mothstorm (more, wider, faster) |
| Moon Sickle | Light | a blade that flies out and returns | Might | Eclipse Blades (three at once) |
| Lantern Beam | Light | a sweeping beam of light | Thick Coat | Lighthouse (two full-length beams) |

Planned next: about 10 more weapons including summons (a lantern-fish that hunts elites), defensive ones (a ward that blocks one hit and bursts), a rare long-cooldown screen clear, and **fusions** (two evolved weapons of different elements merge into one that carries both marks).

### Layer 4: Charms (passive stats) **[v1]**
Might (damage), Quick Hands (weapons fire faster), Wide Bell (area), Long Wick (effects last longer), Swift Boots (move speed), Thick Coat (armor), Heartwood (health and regeneration), Magnet Moth (pickup range), Keen Eye (crit), Twin Flame (+1 projectile), Scholar's Lens (XP gain).

Each weapon benefits from some charms much more than others, and each charm is also the key to one evolution, so charm choice is never just "more damage".

### Layer 5: Boons (run-long rule changers) **[v1: 12 boons]**
Earned from shrines (below). Everyone picks 1 of 3. Many have a price:
- **Glass Lantern:** +40% damage, -30% max health.
- **Second Wind:** once per run, get back up by yourself.
- **Conductor:** Shock spreads to one nearby enemy.
- **Deep Roots:** standing still heals you and widens your area; moving loses it.
- **Kindred Flames:** +8% damage for each teammate near you.
- **Alchemist:** reactions deal +50% damage.
- ...and more. Planned: around 40, in three rarities, some unlocked by goals.

### Characters (Lanternkeepers)
Each has a signature weapon, a passive that bends a rule, and a Space skill with a use for the team.

| Keeper | Signature | Passive | Space skill | |
|---|---|---|---|---|
| **Wick**, the torch-runner | Ember Darts | +15% damage | Flare Dash: dash, leaving fire | **[v1]** |
| **Mara**, the bell-ringer | Frost Chime | +3 armor; Chill lasts longer | Deep Toll: big freeze around her | **[v1]** |
| **Tolliver**, the kite-flyer | Chain Spark | +12% move speed | Skyhook: blink forward with a lightning blast | **[v1]** |
| **Bryn**, the gardener | Thorn Seeds | regenerates health | Bloom Circle: healing ring for everyone inside | **[v1]** |
| **Oda**, the moth-keeper | Spore Moths | +1 to all orbiting things | Swarm Call: moths rush outward and back | unlock |
| **Sable**, the lamplighter | Lantern Beam | crits make a flash that crits again | Beacon: plant a light; allies near it deal more damage | unlock |
| **Pip**, the tinker | random each run | 4 cards per level-up instead of 3 | Jury-Rig: instantly reset all weapon cooldowns | unlock |
| **Gran Hollow**, the old keeper | Moon Sickle | starts with a random Boon; less health | Last Light: revive all downed allies (long cooldown) | unlock |

Ultimates (Q, from level 6) come in a later stage.

## 5. Things to do besides fight

- **Lantern Shrines [v1]:** a circle appears somewhere nearby. Stand in it to light it; it fills faster with more keepers inside. Reward: a **Boon** choice for everyone. Shrines are where the team regroups.
- **Elites [v1]:** large glowing enemies. They drop a **chest**: a free upgrade for everyone, and the surest way to trigger an evolution.
- **Pickups [v1]:** heart (heals the team), magnet (pulls in every spark), ember coins.
- **Planned:** **Dark Bargains** (accept a curse for a few minutes for a big payout), **escort the Firefly Cart**, **rescue a lost keeper** who then fights beside you, and map machines (a bell that stuns the screen).

## 6. Enemies

Enemies are designed to behave differently, not just have more health.

| Enemy | Behaviour | |
|---|---|---|
| Gloomling | walks at you; the crowd | **[v1]** |
| Skitter | fast, fragile, comes in packs | **[v1]** |
| Husk | slow, tough, hits hard | **[v1]** |
| Spitter | keeps its distance and shoots | **[v1]** |
| Elite | large, tough, drops a chest | **[v1]** |
| **The Hollow Stag** (boss) | charges, rings of shots, summons packs | **[v1]** |
| Planned | splitters, shield-bearers that protect others, burrowers, wisps that snuff your light, mini-bosses, 3 more bosses | |

## 7. Co-op rules **[v1]**

- 1 to 4 players. One player **hosts** and gets a 4-letter **room code**; friends type it in to join. Browsers connect directly; no paid server.
- **Shared XP and shared Embers.** Nobody falls behind, nobody fights over drops.
- **Down and revive:** at zero health you are downed. A teammate standing in your circle for about 3 seconds revives you at half health with a moment of invulnerability. With nobody near, you get back up after a wait that grows each time. **Everyone down at once ends the run.**
- **Scaling:** more players means more enemies and tougher elites and bosses.
- **Clutter control:** your own effects are drawn at full brightness, teammates' fainter, and enemy attacks always on top in red.

## 8. Progress between runs

The user asked for this to be a main pillar, not a side dish: **a lasting account that keeps growing**, with as much depth outside the runs as inside them. Every run, won or lost, moves several long-term bars forward at once.

All progress is saved in your own browser, and each player keeps their own account. (Clearing the browser's site data erases it; an export/import save button is planned.)

**How it stays fun instead of trivial:** the research showed Swarm's permanent upgrades eventually made the game too easy. Here the account can grow very strong, and the game grows with it: higher difficulties and Curses are built to need that power. Getting stronger opens harder nights with better rewards.

### The lasting layers

1. **Account level (Keeper Rank) [v1]:** every run gives account XP. Each rank pays out Embers, and milestone ranks open new systems (the Hearth's later branches, Heirloom slots, Curses). There is no cap.
2. **The Hearth (permanent upgrade tree) [v1: 12 upgrades, many ranks each]:** spend Embers on lasting upgrades in three branches:
   - **Flame** (offence): damage, crit, area, weapon speed, reaction damage.
   - **Stone** (survival): health, armor, regeneration, revive speed, an extra life.
   - **Wind** (utility): move speed, pickup range, XP gain, Ember gain, rerolls, banishes, a 4th card on level-ups.
   Later branches hold big one-off **keystones** that change rules (for example "start every run with a random charm", "your first evolution needs no partner charm").
3. **Keeper levels and talents [v1: levels; talents later]:** each keeper earns their own XP when you play them. Every level gives that keeper a small permanent stat bonus. Later, levels also give **talent points** for that keeper's own small tree: branches that change their skill, their passive and their signature weapon, so two players' Wicks can be built differently.
4. **Weapon mastery [v1]:** every weapon tracks the damage you have ever dealt with it. Mastery ranks give that weapon lasting bonus damage, and at set ranks unlock **alternate evolutions** and cosmetic colours. Rewards using everything, not one favourite.
5. **Heirlooms (equipment):** items that drop from bosses, elites and events, in rarities, with random bonus lines. You equip a few before a run (slots open with account rank). Spare ones can be broken down into **Glimmer** and used to upgrade the ones you keep. This is the loot chase.
6. **The Goal Book [v1: first goals]:** dozens of goals ("win a Night", "cause 200 reactions in one run", "evolve a weapon"). Each unlocks something new to try: a keeper, a weapon, a charm, a boon. This is the steady drip of new things.
7. **Difficulty: Dusk, Midnight, Eclipse,** then numbered **Depths** beyond that with no end. Each is tougher and pays more.
8. **Curses (stackable challenge switches):** "enemies are faster", "no healing pickups", "elites come in pairs". Each one adds to your rewards.
9. **Rebuilding the camp:** the menu is a small camp that visibly fills in as you progress: the Hearth burns brighter, rescued keepers appear, a forge for Heirlooms and a library for the Codex are built with resources from runs.
10. **The Codex:** a collection page of every weapon, evolution, reaction, boon, enemy and Heirloom you have discovered, with completion rewards.

### Currencies
- **Embers:** from every run; spent at the Hearth.
- **Glimmer:** from breaking down Heirlooms and from bosses; spent on upgrading Heirlooms.
- **Keeper XP / account XP / weapon mastery:** earned just by playing.

## 9. How it is built

- Plain browser technology: one web page, JavaScript, drawing on a canvas. No build tools, no installs, no paid services.
- Online play uses the free open-source **PeerJS** library and its free public introduction server. The host's browser runs the real game; the others send controls and receive the game state.
- Sound: simple generated beeps and chimes at first; original music later.
- Files: `index.html`, `css/style.css`, and `js/` (`data.js` content tables, `sim.js` game rules, `render.js` drawing, `net.js` room codes, `main.js` menus and glue).

## 10. Build order

1. **First playable [v1]:** everything tagged above. *Done.*
2. **Depth pass:** *Done so far:* all 6 reactions, 10 more weapons (20 total, 4 per element, 6 of them unlocked by goals), a 4-weapon Resonance tier (+75%), ultimates on Q for all four keepers, rerolls and banish, 17 more Boons in three rarities (31 total), endless Ascension upgrades once everything is maxed, screen shake, and 3 new Hearth upgrades. *Still to do:* weapon fusions, "hold a card", alternate evolutions.
3. **World pass:** *Done so far:* 5 new enemy types (Bloat splits, Warder shields its neighbours, Ram charges, Wisp explodes, Mite), Gloom Warden mini-bosses every 4 minutes, swarm surges that encircle the team, the Dark Bargain event, and a second map (the Sunken Mire) with its own boss, the Drowned Bell. Bosses, mini-bosses and elites were given much more health. *Still to do:* 2 more maps and bosses, escort and rescue events, map machines.
4. **Long-game pass:** *Done so far:* difficulties (Dusk, Midnight, Eclipse, then endless Depths), 7 stackable Curses, Heirloom equipment with rarities, Glimmer upgrades and salvage, a talent page for each keeper, 3 Hearth keystones (including a 6th weapon slot), and save export/import. *Still to do:* the 4 unlockable keepers, deeper per-keeper talent branches, camp rebuilding, the Codex, more goals.
5. **Polish pass:** *Done so far:* generated sound effects and a music loop that speeds up for the boss (M mutes), the four unlockable keepers (Oda, Sable, Pip, Gran Hollow) with skills and ultimates, a level-up flash, a lantern glow that grows with level, an evolution burst, screen shake, and the single share link. *Still to do:* touch controls, drawing teammates' effects fainter, original composed music.
