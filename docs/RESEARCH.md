# Research: co-op swarm-survival games

Written 26 November 2026, before any design or code. It covers League of Legends' Swarm mode (the inspiration) and the wider "survivors" genre, and ends with the lessons the design takes from them.

**How sure each part is.** Most Swarm facts come from the League of Legends wiki page and launch-era articles (July 2024). Several guide sites refused automated reading, so a few details (marked *from memory*) are my own recollection and not re-checked. Numbers are from 2024 and are only used as reference points, never copied.

---

## 1. League of Legends: Swarm

### What it is
- A limited-time co-op mode (17 July to 19 August 2024), 1 to 4 players, in the style of Vampire Survivors. It became the most-played League mode outside the main map.
- You move with WASD, your weapons fire by themselves, enemies pour in from all sides, and you pick upgrades as you level.

### How a run flows
- Four maps, each ending in a boss. Finishing a map unlocks the next.
- **Win condition:** survive to 15:00 on the clock, then beat the boss. A real run takes 20 to 25 minutes because the clock stops during choices.
- The boss **enrages** 5 minutes after it appears (more damage, then a wipe), so fights cannot drag on forever.
- Mini-bosses and elite enemies appear on the way and drop **Access Cards**: a bonus upgrade for the whole team, with a chance at a weapon evolution.
- Breakable pods along walls drop gold, a heal for everyone, a "vacuum" that pulls in all XP, or a bomb.
- The first run is the hardest: no permanent upgrades and no evolutions yet.

### Characters
- Nine playable characters, two available at the start, the rest unlocked by goals (for example "get this weapon to level 2", "finish this map", "defeat 25 elites on Hard").
- Each has: a **signature weapon** that fires automatically, two **abilities you trigger yourself** (a basic one early, an ultimate at level 6), and a **passive** trait. Abilities do not take skill points; they grow from the same stats as weapons.
- Characters have clear co-op roles: one shields everyone nearby, one is a tank, others are pure damage.

### Weapons and evolutions
- **5 weapon slots** (signature + 4), **up to 6 passive slots** (3 at first; more unlocked by goals). Weapons go to **level 5**.
- **Evolution rule:** weapon at max level + at least one level of its matching passive stat. The evolution is then offered as a choice and gives the weapon a big new effect.
- About 20 weapons, each tied to one stat. Their *shapes* are the useful part: orbiting blades, returning boomerangs, a ring of mines, bouncing projectiles, chain lightning, a damaging aura, a poison trail behind you, pets and drones, a cone of bullets, random-direction arrows, orbital strikes, and a rare screen-clearing bomb on a long cooldown.

### Passive stats
Ability haste (cooldowns), area size, armor, crit chance, damage, duration, XP gain, health regen, max health, move speed, pickup radius, projectile count. Each weapon cares about some of these and not others, which is where builds come from.

### Map events (the mid-run variety)
All are captured by **standing inside a circle**, which naturally pulls a co-op team together:
- **Boon spire:** a short, strong team buff (about 15 seconds): speed, shields, bigger area, heal on kill, gold on kill, brief invulnerability.
- **Quest spire:** a mini-game (survive in a zone, kill a number of enemies). Reward: a permanent **Augment** for the team for that run. Most augments have a drawback ("+40% damage, -30% max health"; "every 20 seconds your cooldowns swing between much better and much worse"; "+3% move speed per level-up but start slower").
- **Trial spire:** makes things harder for a while (extra waves, penalties) and then pays out a huge XP orb, gold and several Access Cards. A risk-for-reward choice.
- **Map machines:** a healing fountain, a laser cannon, a freeze bomb.

### Co-op rules
- Up to 4. **Gold is shared**: everyone gets whatever anyone picks up. XP is shared too, so the team levels together and the game pauses while everyone picks (up to 30 seconds).
- **Revive:** a downed player can be revived by a teammate standing in their circle. Revived players come back at half health with a few seconds of invulnerability. If nobody reaches them they respawn on a timer that grows with each death (15 seconds, +9 per death, capped at 60). Everyone down at once = defeat.
- More players = more enemies and more enemy attacks.

### Progression between runs
- **Gold** earned in runs (win or lose) buys **permanent stat upgrades**: 14 stats with 2 to 8 ranks each, plus a very long final sink (100 small ranks).
- **Objectives** unlock nearly everything else: maps, characters, weapons, passives, passive slots, augments.
- **Three difficulties** (Story, Hard, Extreme). Hard and Extreme multiply enemy health by 3 and 7 and pay 1.5x and 2.25x gold. Each unlocks by finishing the previous one.
- A final bragging-rights goal: beat the last boss on Extreme with every character.

### What players praised
- Reviewers called it some of the best content Riot had made and "practically its own game".
- Characters that feel different to play, evolving weapons, the flood of enemies, and how easy it is to drop in with friends.
- The steady drip of unlocks: almost every run finished some goal.

### What players criticised (*partly from memory*)
- **Permanent upgrades did too much.** Early runs felt underpowered and late runs trivial; the mode was partly "grind gold until you win" instead of "play better".
- **Builds converged.** Each character had one clearly best set of weapons, so variety was lower than the number of weapons suggested.
- **Screen clutter** in 4-player games: so many effects that players lost their own character and could not see boss attacks.
- **The final boss on Extreme** was a wall that mostly asked for more grinding.
- **Frequent pauses** in co-op while four people picked upgrades.
- It was temporary, and there was little left to do once everything was unlocked.

---

## 2. The wider survivors genre

### Vampire Survivors (the template)
- 30-minute runs, 6 weapons + 6 passives, evolutions from weapon + passive pairs, a cheap and enormous unlock list, and many hidden secrets.
- The core loop is a **power fantasy on a curve**: weak at minute 1, a screen-filling storm by minute 20. Chests and evolutions are staged like slot-machine wins.
- Critique (Jeff Vogel, "The Fast Life and Fiery Death of..."): many weapons are "just traps" next to a few must-haves, most characters do not differ much, and it is "twenty minutes of the same foes, in the same order". His suggested cure: enemies with real, designed behaviour.

### Brotato
- Short waves (20 to 90 seconds) with a **shop between waves**: 4 offers, cheap rerolls, lock an item for later.
- Dozens of characters that each **bend the rules** ("can only use one weapon", "gains damage from max health"), which is why it is praised for characters that "play very differently".
- Items usually give one stat and take a little of another, so every pick is a trade. Stacking one stat hard is rewarded.
- Weapons belong to **classes**, and owning several of one class gives a set bonus.

### Halls of Torment
- Slower and more deliberate. Runs have **quests** that unlock gear, and gear found in a run can be **brought home** and equipped in later runs: a second progression layer beside plain stat upgrades.
- On level-up you pick **traits** that shape one weapon in a direction.
- Gold is kept even if you die, so no run is wasted.

### Deep Rock Galactic: Survivor
- Every weapon carries **tags** (damage type such as fire, cold, electric, acid; shape such as projectile, beam, turret, ground zone, drone). **Tag upgrades only show up once you own two weapons with that tag**, which pulls a build together around a theme.
- **Weapon milestones:** at weapon levels 6, 12 and 18 you choose an **overclock** that changes how the weapon behaves (the level-18 ones are wild, with a downside). About 118 of them.
- Upgrade cards come in **five rarities** with bigger numbers at each.
- The run has things to do besides fight: mine minerals, do side objectives, kill the elite quickly for a better crate. Reroll costs climb each time.
- Between runs, six mined minerals feed a permanent upgrade tree, and **mastery challenges** (for example "win using only this weapon") give lasting bonuses.

### 20 Minutes Till Dawn
- You aim and shoot yourself, which keeps your hands busy.
- Upgrades sit in small **trees**, and owning two particular upgrades unlocks a named **synergy** with its own bonus. Players like finding these; the complaint is that it gets repetitive quickly because enemies and maps barely vary.

### Co-op in the genre
- Vogel's article calls survivors games "PERFECT for couch co-op and party play" and notes most clones do not offer it. It is an under-served spot, and online co-op even more so.
- What co-op games in the genre generally do: shared XP so nobody falls behind, more enemies per player, revives that force the team to regroup, and events that need people to stand together.

---

## 3. What makes these games deep and replayable

1. **The power curve is the game.** Start fragile, end absurd. The run must have several clear "I just got much stronger" moments (first evolution, a rare card, a boss chest).
2. **Choices that interact.** Depth comes from options that change each other's value, not from long lists. The proven tools:
   - weapon + passive **evolutions**;
   - **tags and set bonuses** that reward committing to a theme;
   - **named synergies** between two specific picks;
   - upgrades with **drawbacks** that are only good in the right build;
   - **characters that bend the rules**.
3. **Something to do besides circle.** Events, objectives, elites and risk-for-reward choices break up the kiting.
4. **Enemies with behaviour.** Chargers, shooters, splitters, shielders and bosses with readable attacks keep minute 12 from feeling like minute 2.
5. **A drip of unlocks.** Nearly every run should finish a goal and unlock something new to try in the next one.
6. **Meta-progression that widens options more than it inflates numbers.** New characters, weapons and rule-changers keep people playing; raw stat upgrades are welcome but are also what made Swarm trivial late.
7. **Difficulty you opt into.** Tiers and stackable modifiers with better rewards give experts somewhere to go.
8. **Tools against bad luck.** Rerolls, banishing a card for the rest of the run, and visible "you are one step from this evolution" hints.

### Failure modes to avoid
| Problem | Seen in | Plan |
|---|---|---|
| A few must-pick weapons, the rest "traps" | Vampire Survivors, Swarm | Every weapon has a job (crowd, single target, defence, utility) and at least two builds that want it |
| Characters that feel the same | Vampire Survivors | Each character has a rule-bending passive and an active skill with a team use |
| Same enemies in the same order | 20 Minutes Till Dawn, Vampire Survivors | Enemy types with distinct behaviour; random events each run |
| Permanent upgrades decide everything | Swarm | Modest stat ceilings; most unlocks add options; difficulty tiers scale to match |
| Cannot see anything in 4-player | Swarm | Teammates' effects drawn fainter than your own; enemy attacks always drawn on top in one warning colour |
| Constant pauses in co-op | Swarm | Short timer on choices, pick with keys 1/2/3, auto-pick if you run out of time |
| Nothing left after unlocking everything | Swarm | Stackable difficulty modifiers, per-character mastery, a goals book |

---

## 4. Playing together in a browser with no paid server

- Browsers can connect **directly to each other** (a built-in technology called WebRTC). Game data then travels friend-to-friend.
- They still need a tiny "introduction" service to find each other the first time. **PeerJS** is a free, open-source library with a free public introduction server. Its FAQ confirms it handles introductions for free and that game data goes directly between players.
- **Known limits:** the FAQ says a small share of home or school networks (strict ones) cannot connect directly at all. The free server publishes no uptime promise. Each browser comfortably handles roughly 5 to 10 direct connections, so 4 players is fine.
- **Chosen approach:** one player (the host) runs the real game; the others send their controls and receive the game state several times a second. This is the simplest reliable design for 2 to 4 friends.
- **Getting the game to friends:** each friend's browser needs the game page. Either send them the folder, or put it on a free static host (GitHub Pages, Netlify and itch.io all have free plans) so there is one link to share. That step needs an account and is the user's choice.

---

## Sources

- [Swarm - League of Legends Wiki](https://wiki.leagueoflegends.com/en-us/Swarm)
- [LoL's Swarm mode is a glorious return to form for Riot's LTMs - Dexerto](https://dexerto.com/league-of-legends/lols-swarm-mode-is-a-glorious-return-to-form-for-riots-ltms-2830141)
- [League players applaud Swarm mode - Dexerto](https://dexerto.com/league-of-legends/league-players-applaud-swarm-mode-as-freakin-awesome-2829694)
- [LoL Swarm becomes most-played mode outside Summoner's Rift - Inven Global](https://www.invenglobal.com/articles/23757/lol-swarm-becomes-most-played-mode-outside-of-summoners-rift)
- [LoL Swarm: all augments - Mein-MMO](https://mein-mmo.de/en/lol-swarm-all-augments-and-their-advantages-in-english,1154982)
- [LoL Swarm game mode explained - GameLeap](https://gameleap.com/articles/lol-swarm-game-mode-explained)
- [5 things you should know when playing Swarm - GosuGamers](https://www.gosugamers.net/lol/news/72206-5-things-you-should-know-when-playing-swarm-league-of-legends-new-pve-mode)
- [The Fast Life and Fiery Death of... - Jeff Vogel, Bottom Feeder](https://bottomfeeder.substack.com/p/the-fast-life-and-fiery-death-of)
- [Deep Rock Galactic: Survivor wiki - Overclocks](https://deeprockgalactic.wiki.gg/wiki/Survivor:Overclocks) and its Mid-dive Upgrades, Objectives and Resources pages
- [Brotato builds and synergies - ludo.guide](https://www.ludo.guide/guide/brotato/characters-builds/builds-synergies-general)
- [Halls of Torment review - God is a Geek](https://www.godisageek.com/reviews/halls-of-torment-review)
- [PeerJS FAQ](https://peerjs.com/client/faq)

Pages that could not be read (they refused automated access): the Mobalytics and esports.gg Swarm guides, the Epic Games article on Vampire Survivors, and the PC Gamer review of Deep Rock Galactic: Survivor. Vampire Survivors and 20 Minutes Till Dawn details are from general knowledge of those games.
