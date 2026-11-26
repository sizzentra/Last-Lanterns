# Last Lanterns (working title)

An online co-op swarm-survival game for 1 to 4 friends, played in the browser.

- Research behind it: [docs/RESEARCH.md](docs/RESEARCH.md)
- Full design and build order: [docs/DESIGN.md](docs/DESIGN.md)

## Play online

**https://sizzentra.github.io/Last-Lanterns/**

Open that link in a browser. Send the same link to friends. Nothing to install.

## How to open the copy on this computer

1. Open the `NewGame` folder.
2. Double-click **Play.bat**. A small black window opens (leave it open) and the game appears in your browser.
3. Type a name, pick a Lanternkeeper, press **Start the Night**.

When you are done, close the black window.

## Controls

- **WASD** (or arrow keys): move. Weapons fire by themselves.
- **Space**: your keeper's skill.
- **1 / 2 / 3** or click: pick an upgrade card.

## Playing with a friend

Everyone needs the game open in their own browser, and an internet connection.

1. One person presses **Host a game for friends**. A 4-letter room code appears.
2. Tell your friends the code (voice chat, text, anything).
3. Each friend types the code into the box and presses **Join with a room code**.
4. When everyone shows in the list, the host presses **Start the Night**.

To try it by yourself: open the game in two browser tabs, host in one and join from the other.

**Getting the game to your friends.** Send them the link above. Progress is saved separately for the online link and for the copy on this computer, so pick one and stick with it (the link is the one to use with friends).

**If joining fails.** A small share of networks (some school, work or mobile networks) block direct connections between browsers. Trying a different network usually fixes it.

## Your progress

Embers, Keeper Rank, keeper levels, weapon mastery, Hearth upgrades and goals are saved in your browser on this computer. Clearing the browser's site data for the game erases them.

## For testing

Add `?boss=60` to the address (for example `http://localhost:8123/?boss=60`) to make the boss arrive after 60 seconds instead of 12 minutes.
