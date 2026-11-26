'use strict';
// Menus, saving, and the glue between the game rules, the drawing and the room codes.
(() => {
  const $ = id => document.getElementById(id);
  const SAVE_KEY = 'lastlanterns.save.v1';
  const blank = () => ({ name: '', embers: 0, xp: 0, hearth: {}, keeper: {}, mastery: {}, goals: {}, char: 'wick', map: 'fields', runs: 0, wins: 0, heir: [], equip: [], glimmer: 0, talents: {}, maxDiff: 0, diff: 0, curses: [] });
  let save = blank();
  try { const s = JSON.parse(localStorage.getItem(SAVE_KEY)); if (s) save = Object.assign(blank(), s); } catch (e) { /* no save yet */ }
  const persist = () => { try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (e) { /* storage blocked */ } };
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  let role = 'solo', myId = 0, party = [], inGame = false, nextPid = 1, tick = 0, netEv = [];
  let picked = true, curCards = null, skLatch = false, dashT = 0, lastFrame = 0;
  const keys = {};
  const bossTime = +(new URLSearchParams(location.search).get('boss')) || 0;

  const unlocked = c => !CHARS[c].goal || save.goals[CHARS[c].goal];
  const myName = () => (save.name || 'Keeper').slice(0, 14);
  const myMeta = () => { const m = {}; for (const w in WEAPONS) m[w] = Account.mastery(save.mastery[w] || 0).rank; return { h: save.hearth, kl: Account.keeper(save.keeper[save.char] || 0).lvl, m, lock: Object.keys(WEAPONS).filter(w => WEAPONS[w].goal && !save.goals[WEAPONS[w].goal]), ...Meta.bonus(save, save.char) }; };
  const me = () => ({ id: myId, name: myName(), char: save.char, meta: myMeta() });
  const say = t => { $('msg').textContent = t || ''; };

  // ---------- camp screen ----------
  function renderCamp() {
    if (!unlocked(save.char)) save.char = 'wick';
    const r = Account.rank(save.xp);
    $('name').value = save.name;
    $('account').innerHTML = `<div class="stat"><span>Keeper Rank <b>${r.lvl}</b></span><span class="embers">${save.embers} Embers</span></div>
      <div class="bar"><i style="width:${r.into / r.need * 100}%"></i></div><small>${Math.floor(r.into)} / ${r.need} to the next rank (each rank pays 50 Embers) &middot; ${save.runs} nights, ${save.wins} dawns</small>`;
    $('chars').innerHTML = CHAR_IDS.map(c => { const C = CHARS[c], ok = unlocked(c), k = Account.keeper(save.keeper[c] || 0);
      return `<div class="char ${c === save.char ? 'sel' : ''} ${ok ? '' : 'locked'}" data-c="${c}" style="color:${C.c}"><div class="dot"></div><b style="color:#fff">${C.name}</b><br><small>${ok ? 'Level ' + k.lvl : 'Locked'}</small></div>`; }).join('');
    const C = CHARS[save.char], k = Account.keeper(save.keeper[save.char] || 0), W = WEAPONS[C.weapon];
    let locks = CHAR_IDS.filter(c => !unlocked(c)).map(c => `<br><small>${CHARS[c].name} unlocks with the goal: ${GOALS[CHARS[c].goal].desc}.</small>`).join('');
    $('charInfo').innerHTML = `<b>${C.name}</b>, ${C.title}. Keeper level ${k.lvl} <small>(+${k.lvl}% damage, +${k.lvl * 2} health)</small>
      <div class="bar"><i style="width:${k.into / k.need * 100}%"></i></div>
      Starts with <b style="color:${ELEM[W.el].c}">${W.name}</b>: ${W.desc}<br>Trait: ${C.passive}.<br>Skill (Space): <b>${C.skill}</b>. ${C.skillDesc}<br>Ultimate (Q, from team level 6): <b>${C.ult}</b>. ${C.ultDesc}${locks}`;
    renderParty();
  }
  function renderParty() {
    let h = '';
    if (role === 'solo') h = `<div class="row"><button id="hostBtn">Host a game for friends</button></div>
      <div class="row" style="margin-top:8px"><input id="code" maxlength="4" placeholder="CODE"><button id="joinBtn">Join with a room code</button></div>
      <small>Or just press Start to play alone.</small>`;
    else {
      h = `<small>${role === 'host' ? 'Tell your friends this room code:' : 'You are in room:'}</small><div class="codebox">${Net.code}</div><div class="plist">` +
        party.map(p => `<div><span><b style="color:${CHARS[p.char].c}">&#9679;</b> ${esc(p.name)}${p.id === myId ? ' (you)' : ''}</span><span>${CHARS[p.char].name}</span></div>`).join('') +
        `</div><div class="row" style="margin-top:8px"><button id="leaveBtn">Leave room</button></div>`;
    }
    $('party').innerHTML = h; renderDiff();
    if (!MAPS[save.map] || (MAPS[save.map].goal && !save.goals[MAPS[save.map].goal])) save.map = 'fields';
    $('maps').innerHTML = role === 'client' ? '<small>The host chooses the map.</small>' : Object.keys(MAPS).map(m => { const M = MAPS[m], ok = !M.goal || save.goals[M.goal];
      return `<button data-map="${m}" class="${m === save.map ? 'sel' : ''}" ${ok ? '' : 'disabled'}><b>${M.name}</b>${ok ? M.desc : 'Locked: ' + GOALS[M.goal].desc.toLowerCase() + ' first.'}</button>`; }).join('');
    const st = $('start'); st.disabled = role === 'client'; st.textContent = role === 'client' ? 'Waiting for the host to start' : role === 'host' ? `Start the Night (${party.length} player${party.length > 1 ? 's' : ''})` : 'Start the Night';
    if ($('hostBtn')) $('hostBtn').onclick = hostRoom;
    if ($('joinBtn')) $('joinBtn').onclick = joinRoom;
    if ($('leaveBtn')) $('leaveBtn').onclick = leaveRoom;
  }
  function renderDiff() {
    if (role === 'client') { $('diff').innerHTML = ''; return; }
    save.diff = Math.max(0, Math.min(save.diff, save.maxDiff)); const D = diffOf(save.diff), rank = Account.rank(save.xp).lvl;
    $('diff').innerHTML = `<div class="row" style="margin-top:10px"><button data-d="-1" ${save.diff <= 0 ? 'disabled' : ''}>&#9664;</button><div style="flex:1;text-align:center"><b>${D.name}</b><br><small>enemy health x${D.hp.toFixed(1)}, damage x${D.dmg.toFixed(1)}</small></div><button data-d="1" ${save.diff >= save.maxDiff ? 'disabled' : ''}>&#9654;</button></div>
      <small>${save.diff >= save.maxDiff ? 'Win on ' + D.name + ' to unlock ' + diffOf(save.maxDiff + 1).name + '.' : ''}</small>` +
      (rank >= 3 ? `<div class="curses">${Object.keys(CURSES).map(c => `<label title="${CURSES[c].desc}"><input type="checkbox" data-cz="${c}" ${save.curses.indexOf(c) >= 0 ? 'checked' : ''}> ${CURSES[c].name} <small>${CURSES[c].desc} (+${Math.round(CURSES[c].rew * 100)}%)</small></label>`).join('')}</div>` : '<br><small>Curses (optional challenges for more rewards) unlock at Keeper Rank 3.</small>') +
      `<div class="embers" style="margin-top:6px">Rewards x${rewardMult(save.diff, save.curses).toFixed(2)}</div>`;
  }
  $('diff').onclick = e => { const d = e.target.dataset; if (d.d) { save.diff += +d.d; persist(); renderDiff(); } };
  $('diff').onchange = e => { const c = e.target.dataset.cz; if (!c) return; save.curses = save.curses.filter(x => x !== c); if (e.target.checked) save.curses.push(c); persist(); renderDiff(); };
  $('maps').onclick = e => { const b = e.target.closest('[data-map]'); if (!b || b.disabled) return; save.map = b.dataset.map; persist(); renderParty(); };
  $('name').oninput =e => { save.name = e.target.value; persist(); announce(); };
  $('chars').onclick = e => { const el = e.target.closest('.char'); if (!el || el.classList.contains('locked')) return; save.char = el.dataset.c; persist(); renderCamp(); announce(); };
  function announce() { // tell the room who we are
    if (role === 'client') Net.toHost(Object.assign({ t: 'h' }, me()));
    else if (role === 'host') { const p = party.find(p => p.id === myId); if (p) Object.assign(p, me()); sendLobby(); renderParty(); }
  }

  // ---------- rooms ----------
  function hostRoom() {
    say('Opening a room...');
    Net.host((err, code) => {
      if (err) return say(err);
      role = 'host'; myId = 0; nextPid = 1; party = [me()]; say('Room open. Share the code, then press Start when everyone is in.'); renderParty();
    });
  }
  function joinRoom() {
    const code = $('code').value.trim().toUpperCase();
    if (code.length !== 4) return say('Type the 4-letter room code first.');
    say('Joining...');
    Net.join(code, err => { if (err) { Net.close(); return say(err); } role = 'client'; party = []; say('Joined. Waiting for the host to start.'); announce(); renderParty(); });
  }
  function leaveRoom() { Net.close(); role = 'solo'; myId = 0; party = []; say(''); renderParty(); }
  const sendLobby = () => { for (const c of Net.conns) Net.send(c, { t: 'l', you: c.pid, players: party.map(p => ({ id: p.id, name: p.name, char: p.char })) }); };
  Net.onJoin = c => {
    if (inGame || party.length >= 4) { Net.send(c, { t: 'x', msg: inGame ? 'That room is in the middle of a night. Try again when it ends.' : 'That room is full.' }); setTimeout(() => c.close(), 500); return; }
    c.pid = nextPid++; party.push({ id: c.pid, name: 'Friend', char: 'wick', meta: {} }); sendLobby(); renderParty();
  };
  Net.onLeave = c => { if (c.pid == null) return; party = party.filter(p => p.id !== c.pid); if (inGame) Sim.removePlayer(c.pid); sendLobby(); renderParty(); };
  Net.onHostLost = () => { if (inGame) { inGame = false; showCamp(); } role = 'solo'; party = []; Net.close(); say('The host left, so the room closed.'); renderParty(); };
  Net.onData = (d, c) => {
    if (!d || typeof d !== 'object') return;
    if (role === 'host') {
      if (c.pid == null) return;
      if (d.t === 'h') { const p = party.find(p => p.id === c.pid); if (p && !inGame && CHARS[d.char]) { p.name = String(d.name || 'Friend').slice(0, 14); p.char = d.char; p.meta = d.meta || {}; sendLobby(); renderParty(); } }
      else if (d.t === 'i' && inGame) Sim.input(c.pid, d);
      else if (d.t === 'p' && inGame) Sim.pick(c.pid, d.i | 0);
      else if (d.t === 'rr' && inGame) Sim.redeal(c.pid);
      else if (d.t === 'bn' && inGame) Sim.redeal(c.pid, d.i | 0);
    } else if (role === 'client') {
      if (d.t === 'l') { myId = d.you; party = d.players; renderParty(); }
      else if (d.t === 's') { if (inGame) onSnap(d); }
      else if (d.t === 'b') onBuilds(d.B);
      else if (d.t === 'c') showCards(d);
      else if (d.t === 'go') enterGame();
      else if (d.t === 'end') onEnd(d.R);
      else if (d.t === 'x') { say(d.msg); leaveRoom(); say(d.msg); }
    }
  };

  // ---------- running a night ----------
  $('start').onclick = () => {
    if (role === 'client') return;
    if (role === 'solo') { myId = 0; party = [me()]; } else { Object.assign(party.find(p => p.id === myId), me()); }
    Sim.newGame(party.map(p => ({ id: p.id, name: p.name, char: p.char, meta: p.meta })), { bossTime, map: save.map, diff: Math.min(save.diff, save.maxDiff), curses: save.curses });
    tick = 0; netEv = [];
    Net.broadcast({ t: 'go' });
    enterGame();
  };
  function enterGame() {
    inGame = true; picked = true; curCards = null; skLatch = false; dashT = 0;
    View.reset(); $('camp').classList.add('hidden'); $('end').classList.add('hidden'); $('cards').classList.add('hidden'); $('build').classList.remove('hidden'); $('build').innerHTML = '';
  }
  function showCamp() { $('camp').classList.remove('hidden'); $('build').classList.add('hidden'); $('cards').classList.add('hidden'); renderCamp(); }
  const localInput = () => { const m = View.me, o = { t: 'i', x: Math.round(m.x), y: Math.round(m.y), fx: m.fx, fy: m.fy, sk: skLatch | 0 }; skLatch = 0; return o; };

  function hostTick() {
    if (!inGame || role === 'client') return;
    const G = Sim.G;
    if (View.cur) Sim.input(myId, localInput());
    Sim.step();
    const s = Sim.snap();
    for (const e of s.ev) netEv.push(e);
    onSnap(s);
    if (G.dirty) { G.dirty = false; const B = Sim.builds(); onBuilds(B); Net.broadcast({ t: 'b', B }); }
    if (G.pause) {

      for (const id in G.pause.picks) { const k = G.pause.picks[id]; if (!k.fresh) continue; k.fresh = false; const m = { t: 'c', kind: G.pause.kind, cards: k.cards, rr: k.rr, bn: k.bn }; if (+id === myId) showCards(m); else Net.send(Net.conns.find(c => c.pid === +id), m); }
    }
    if (++tick % 3 === 0 && Net.conns.length) { Net.broadcast(Object.assign({}, s, { ev: netEv })); netEv = []; } else if (!Net.conns.length) netEv = [];
    if (G.over) { const R = Sim.results(); Net.broadcast({ t: 'end', R }); onEnd(R); }
  }
  // a Worker timer keeps the host's game running even when their tab is in the background
  let lastW = 0;
  try { const w = new Worker(URL.createObjectURL(new Blob(['setInterval(()=>postMessage(0),33.33)']))); w.onmessage = () => { lastW = performance.now(); hostTick(); }; } catch (e) { /* fall back to the timer below */ }
  setInterval(() => { if (performance.now() - lastW > 120) hostTick(); }, 33.33); // fallback if the Worker is not allowed
  setInterval(() => { if (inGame && role === 'client' && View.cur) Net.toHost(localInput()); }, 50);

  function onSnap(s) {
    View.apply(s, myId);
    if (!s.pz && !$('cards').classList.contains('hidden')) $('cards').classList.add('hidden');
    else if (s.pz && curCards && !picked) $('cardsSub').textContent = `Press 1, 2 or 3, or click. Auto-picks in ${s.pz}s.`;
  }
  function onBuilds(B) {
    View.builds = B;
    const b = B.find(x => x.id === myId); if (!b) return;
    const pips = (l, evo) => evo ? ' &#9733; EVOLVED' : ' <span class="pip">' + '&#9679;'.repeat(l) + '&#9675;'.repeat(5 - l) + '</span>';
    let h = b.w.map(w => `<div style="color:${ELEM[WEAPONS[w[0]].el].c}">${w[2] ? WEAPONS[w[0]].evo : WEAPONS[w[0]].name}${pips(w[1], w[2])}</div>`).join('');
    h += b.c.map(c => `<div style="color:#cfc8ea">${CHARMS[c[0]].name}${pips(c[1])}</div>`).join('');
    h += Object.keys(b.res).filter(e => b.res[e] >= 2).map(e => `<span class="res" style="color:${ELEM[e].c}">${ELEM[e].name} x${b.res[e]} +${b.res[e] >= 3 ? 45 : 20}%</span>`).join('');
    h += b.b.map(x => `<div class="boon">&#10022; ${BOONS[x].name}</div>`).join('');
    $('build').innerHTML = h;
  }

  // ---------- upgrade cards ----------
  function cardHtml(c, i) {
    const b = View.builds.find(x => x.id === myId) || { w: [], c: [] };
    let tag = '', title = '', desc = '', col = '#b9a8ff', hint = '', cls = '';
    if (c.k === 'w' || c.k === 'evo') {
      const W = WEAPONS[c.id], E = ELEM[W.el]; col = E.c;
      const hasCharm = b.c.some(x => x[0] === W.charm);
      if (c.k === 'evo') { cls = 'evo'; tag = 'Evolution'; title = W.evo; desc = W.evoDesc; }
      else { tag = (c.lvl === 1 ? 'New weapon' : 'Weapon level ' + c.lvl) + ' &middot; ' + E.name; title = W.name; desc = W.desc; hint = `Evolves at level 5 with the charm ${CHARMS[W.charm].name}${hasCharm ? ' (you have it)' : ''}.`; if (E.mark && c.lvl === 1) hint += ` Two different marks on one enemy cause a reaction.`; }
    } else if (c.k === 'c') {
      const C = CHARMS[c.id]; tag = c.lvl === 1 ? 'New charm' : 'Charm level ' + c.lvl; title = C.name; desc = C.desc + ' per level.';
      const mine = Object.keys(WEAPONS).filter(w => WEAPONS[w].charm === c.id && b.w.some(x => x[0] === w));
      if (mine.length) hint = `Lets your ${mine.map(w => WEAPONS[w].name).join(' and ')} evolve at level 5.`;
    } else if (c.k === 'boon') { const B = BOONS[c.id], r = B.r || 1; tag = ['', 'Boon', 'Rare Boon', 'Legendary Boon'][r]; col = ['', '#ffd27a', '#6bb8ff', '#ff7ad9'][r]; if (r === 3) cls = 'evo'; title = B.name; desc = B.desc + '.'; hint = 'Lasts for the rest of this night.'; }
    else if (c.k === 'asc') { const A = { dmg: ['Ascend: Might', '+6% damage'], area: ['Ascend: Reach', '+5% area'], cdr: ['Ascend: Tempo', 'Weapons fire 5% faster'], hp: ['Ascend: Vigor', '+15 max health'], crit: ['Ascend: Edge', '+3% crit chance'] }[c.id]; tag = 'Ascension'; col = '#ff7ad9'; title = A[0]; desc = A[1] + '. Stacks forever.'; hint = `You have taken this ${(b.asc && b.asc[c.id]) || 0} time(s).`; }
    else if (c.k === 'heal') { tag = 'Rest'; title = 'Catch your breath'; desc = 'Heal 30% of your health.'; }
    else { tag = 'Spoils'; title = 'Pocket the Embers'; desc = '+25 Embers for the team.'; }
    const ban = curBn > 0 && curKind !== 'boon' && (c.k === 'w' || c.k === 'c') && c.lvl === 1 ? `<div class="ban" data-ban="${i}">Banish this for the night</div>` : '';
    return `<div class="card ${cls}" data-i="${i}" style="border-color:${cls ? '' : col + '66'}"><span class="key">${i + 1}</span><div class="tag" style="color:${col}">${tag}</div><h3>${title}</h3><p>${desc}</p>${hint ? `<div class="hint">${hint}</div>` : ''}${ban}</div>`;
  }
  let curRr = 0, curBn = 0, curKind = '';
  function showCards(m) {
    curCards = m.cards; picked = false; curRr = m.rr || 0; curBn = m.bn || 0; curKind = m.kind;
    $('cardsTitle').textContent = m.kind === 'boon' ? 'The shrine is lit: choose a Boon' : m.kind === 'chest' ? 'Elite chest: a free upgrade' : 'Level up! Choose one';
    $('cardsSub').textContent = 'Press 1, 2 or 3, or click.';
    $('cardList').innerHTML = m.cards.map(cardHtml).join('') + `<div class="rr"><button id="rrBtn" ${curRr > 0 ? '' : 'disabled'}>Reroll (R) &middot; ${curRr} left</button>${curBn > 0 ? ` <small>${curBn} banish left</small>` : ''}</div>`;
    $('cards').classList.remove('hidden');
  }
  function reroll() { if (picked || !curCards || curRr <= 0) return; curRr = 0; if (role === 'client') Net.toHost({ t: 'rr' }); else Sim.redeal(myId); }
  function pickCard(i) {
    if (picked || !curCards || i >= curCards.length) return;
    picked = true; $('cardList').innerHTML = ''; $('cardsTitle').textContent = 'Waiting for the others...'; $('cardsSub').textContent = '';
    if (role === 'client') Net.toHost({ t: 'p', i }); else Sim.pick(myId, i);
  }
  $('cardList').onclick = e => {
    if (e.target.id === 'rrBtn') return reroll();
    if (e.target.dataset.ban != null) { if (picked) return; const i = +e.target.dataset.ban; curBn = 0; if (role === 'client') Net.toHost({ t: 'bn', i }); else Sim.redeal(myId, i); return; }
    const el = e.target.closest('.card'); if (el) pickCard(+el.dataset.i);
  };
  function tryUlt() { const c = View.cur, p = c && c.P.get(myId); if (!p || p.ul !== 0 || (p.fl & 1) || c.s.pz) return; skLatch |= 2; }

  // ---------- end of a night: pay out lasting progress ----------
  function onEnd(R) {
    if (!inGame) return; inGame = false;
    const mine = R.per[myId] || { kills: 0, dmgBy: {}, char: save.char }, gains = [];
    const rank0 = Account.rank(save.xp).lvl, k0 = Account.keeper(save.keeper[mine.char] || 0).lvl;
    const xp = Math.floor((R.time + R.kills * 0.2 + (R.win ? 300 : 0)) * R.mult);
    let embers = Math.round(R.embers * (1 + 0.06 * (save.hearth.fortune || 0)));
    save.xp += xp; save.keeper[mine.char] = (save.keeper[mine.char] || 0) + xp; save.runs++; if (R.win) save.wins++;
    gains.push(`<b>+${embers} Embers</b> from the night`, `+${xp} account XP and ${CHARS[mine.char].name} XP`);
    const rank1 = Account.rank(save.xp).lvl, k1 = Account.keeper(save.keeper[mine.char]).lvl;
    if (rank1 > rank0) { embers += 50 * (rank1 - rank0); gains.push(`<b>Keeper Rank ${rank1}!</b> +${50 * (rank1 - rank0)} Embers`); }
    if (k1 > k0) gains.push(`<b>${CHARS[mine.char].name} reached level ${k1}</b> (permanent +1% damage and +2 health per level)`);
    for (const w in mine.dmgBy) if (WEAPONS[w]) { const a = Account.mastery(save.mastery[w] || 0).rank; save.mastery[w] = (save.mastery[w] || 0) + Math.round(mine.dmgBy[w]); const b = Account.mastery(save.mastery[w]).rank; if (b > a) gains.push(`<b>${WEAPONS[w].name} mastery rank ${b}</b> (+${b * 3}% damage with it, forever)`); }
    for (const g in GOALS) if (!save.goals[g] && GOALS[g].test(R)) { save.goals[g] = 1; embers += GOALS[g].embers || 0; gains.push(`<b>Goal complete: ${GOALS[g].name}</b>. ${GOALS[g].reward}`); }
    if (R.mult > 1) gains.push(`Rewards x${R.mult.toFixed(2)} for ${diffOf(R.diff).name}${R.curses.length ? ' with ' + R.curses.length + ' Curse' + (R.curses.length > 1 ? 's' : '') : ''}`);
    if (R.win && R.diff >= save.maxDiff) { save.maxDiff = R.diff + 1; gains.push(`<b>New difficulty unlocked: ${diffOf(save.maxDiff).name}</b>`); }
    // Heirlooms: one roll each for Wardens, Bargains and a long night, two for a win
    let rolls = Math.min(5, R.wardens + R.bargains + (R.time >= 300 ? 1 : 0) + (R.win ? 2 : 0));
    for (; rolls > 0; rolls--) { const h = Meta.roll(R.diff); if (save.heir.length >= 30) { save.glimmer += Meta.salvage(h); gains.push(`Bag full: ${esc(h.n)} was salvaged for Glimmer`); } else { save.heir.push(h); gains.push(`<b style="color:${RARITY[h.r].c}">Heirloom found: ${esc(h.n)}</b> (${RARITY[h.r].name}: ${h.lines.map(l => Meta.lineText(h, l)).join(', ')})`); } }
    if (R.win) { const g = Math.round(30 * R.mult); save.glimmer += g; gains.push(`+${g} Glimmer from the boss`); }
    save.embers += embers; persist();
    const t = `${Math.floor(R.time / 60)}:${String(R.time % 60).padStart(2, '0')}`;
    $('endBody').innerHTML = `<h1 style="font-size:34px">${R.win ? 'Dawn breaks!' : 'The lights went out'}</h1>
      <p class="sub">${R.win ? (MAPS[R.map] || MAPS.fields).boss + ' is defeated.' : 'The Gloom took this one. Everything below is yours to keep.'}</p>
      <p>Survived <b>${t}</b> &middot; Team level <b>${R.level}</b> &middot; <b>${R.kills}</b> defeated (you: ${mine.kills}) &middot; <b>${R.reactions}</b> reactions &middot; <b>${R.evos}</b> evolutions</p>
      <h2>What you earned</h2><ul class="gain">${gains.map(g => `<li>${g}</li>`).join('')}</ul><p class="embers">You now have ${save.embers} Embers to spend at the Hearth.</p>`;
    $('cards').classList.add('hidden'); $('end').classList.remove('hidden');
  }
  $('endBtn').onclick = () => { $('end').classList.add('hidden'); showCamp(); announce(); };

  // ---------- camp pages ----------
  const PAGES = {
    hearth() {
      let h = `<h1 style="font-size:30px">The Hearth</h1><p class="sub">Permanent upgrades for every Lanternkeeper you play. <span class="embers">${save.embers} Embers</span></p><table>`, br = '';
      for (const id in HEARTH) { const U = HEARTH[id], r = save.hearth[id] || 0, cost = hearthCost(id, r), max = r >= U.max;
        const need = U.rank && Account.rank(save.xp).lvl < U.rank;
        if (U.branch !== br) { br = U.branch; h += `<tr><td colspan="3" class="branch">${br} &middot; ${{ Flame: 'offence', Stone: 'survival', Wind: 'utility', Keystone: 'big one-off upgrades' }[br]}</td></tr>`; }
        h += `<tr><td><b>${U.name}</b><br><small>${U.desc}${U.max > 1 ? ' per rank' : ''}</small></td><td>${r} / ${U.max}</td><td style="text-align:right">${max ? '<span class="done">Complete</span>' : need ? `<small>Needs Keeper Rank ${U.rank}</small>` : `<button data-buy="${id}" ${save.embers < cost ? 'disabled' : ''}>Buy: ${cost}</button>`}</td></tr>`; }
      return h + '</table>';
    },
    heir() {
      const rank = Account.rank(save.xp).lvl, slots = Meta.slots(rank), nextAt = [4, 8, 14].find(r => r > rank);
      const row = (h, eq) => `<tr><td><b style="color:${RARITY[h.r].c}">${esc(h.n)}</b> <small>${RARITY[h.r].name}${h.lvl ? ' +' + h.lvl : ''}</small><br><small>${h.lines.map(l => Meta.lineText(h, l)).join(' &middot; ')}</small></td>
        <td style="text-align:right;white-space:nowrap"><button data-h="${eq ? 'off' : 'on'}:${h.id}" ${!eq && save.equip.length >= slots ? 'disabled' : ''}>${eq ? 'Take off' : 'Equip'}</button>
        <button data-h="up:${h.id}" ${h.lvl >= 5 || save.glimmer < Meta.upCost(h) ? 'disabled' : ''}>${h.lvl >= 5 ? 'Max' : 'Upgrade: ' + Meta.upCost(h)}</button>
        ${eq ? '' : `<button data-h="sal:${h.id}">Salvage: +${Meta.salvage(h)}</button>`}</td></tr>`;
      const eq = save.heir.filter(h => save.equip.indexOf(h.id) >= 0), bag = save.heir.filter(h => save.equip.indexOf(h.id) < 0).sort((a, b) => b.r - a.r);
      return `<h1 style="font-size:30px">Heirlooms</h1><p class="sub">Found at the end of a night: from Wardens, Dark Bargains, long nights and bosses. Harder difficulties find rarer ones. <span style="color:#c58bff;font-weight:700">${save.glimmer} Glimmer</span></p>
        <h2>Wearing ${eq.length} of ${slots}${nextAt ? ` <small>(next slot at Keeper Rank ${nextAt})</small>` : ''}</h2><table>${eq.map(h => row(h, true)).join('') || '<tr><td>Nothing equipped yet.</td></tr>'}</table>
        <h2>In your bag (${bag.length} of 30)</h2><table>${bag.map(h => row(h, false)).join('') || '<tr><td>Empty. Play a night to find some.</td></tr>'}</table>
        <p><small>Upgrading costs Glimmer and makes every line 20% stronger, up to +5. Salvaging destroys an Heirloom for Glimmer.</small></p>`;
    },
    talents() {
      const c = save.char, C = CHARS[c], t = save.talents[c] || {}, pts = Meta.talentPoints(save, c), free = pts.total - pts.used;
      return `<h1 style="font-size:30px">${C.name}'s Talents</h1><p class="sub">Each level ${C.name} gains gives one point. Pick a different keeper on the camp screen to see theirs. <b style="color:#ffd27a">${free} point${free === 1 ? '' : 's'} to spend</b> (${pts.total} earned)</p><table>` +
        Object.keys(TALENTS).map(id => { const T = TALENTS[id], r = t[id] || 0, cost = T.cost || 1, locked = T.need && pts.used < T.need && !r;
          return `<tr><td><b>${T.name}</b><br><small>${T.desc}${T.max > 1 ? ' per rank' : ''}${cost > 1 ? ` (costs ${cost} points)` : ''}</small></td><td>${r} / ${T.max}</td><td style="text-align:right">${r >= T.max ? '<span class="done">Complete</span>' : locked ? `<small>Spend ${T.need} points first</small>` : `<button data-t="${id}" ${free < cost ? 'disabled' : ''}>Learn</button>`}</td></tr>`; }).join('') +
        `</table><button data-t="reset" style="margin-top:12px">Reset ${C.name}'s talents (free)</button>`;
    },
    savefile() {
      return `<h1 style="font-size:30px">Save file</h1><p class="sub">Your progress lives in this browser. Copy the text below somewhere safe to back it up, or paste a saved text and press Load to bring progress to another browser or computer.</p>
        <textarea id="saveText" style="width:100%;height:150px;background:#0e0c1b;color:#cfc8ea;border:1px solid #4a3f7a;border-radius:8px;padding:8px">${btoa(unescape(encodeURIComponent(JSON.stringify(save))))}</textarea>
        <div class="row" style="margin-top:8px"><button data-s="copy">Copy to clipboard</button><button data-s="load">Load the text in the box (replaces current progress)</button></div><p id="saveMsg" class="msg"></p>`;
    },
    goals() {
      return `<h1 style="font-size:30px">Goal Book</h1><p class="sub">Finish goals during a night to unlock new things.</p><table>` + Object.keys(GOALS).map(g => `<tr><td><b>${GOALS[g].name}</b><br><small>${GOALS[g].desc}</small></td><td>${GOALS[g].reward}</td><td class="${save.goals[g] ? 'done' : ''}">${save.goals[g] ? 'Done' : 'Not yet'}</td></tr>`).join('') + '</table>';
    },
    mastery() {
      return `<h1 style="font-size:30px">Weapon Mastery</h1><p class="sub">Every point of damage you deal with a weapon counts forever. Each rank is +3% damage with that weapon.</p><table>` + Object.keys(WEAPONS).map(w => { const m = Account.mastery(save.mastery[w] || 0); return `<tr><td><b style="color:${ELEM[WEAPONS[w].el].c}">${WEAPONS[w].name}</b>${WEAPONS[w].goal && !save.goals[WEAPONS[w].goal] ? ' <small>(locked: ' + GOALS[WEAPONS[w].goal].desc + ')</small>' : ''}<br><small>${ELEM[WEAPONS[w].el].name} &middot; evolves with ${CHARMS[WEAPONS[w].charm].name} into ${WEAPONS[w].evo}</small></td><td style="width:40%">Rank ${m.rank}${m.rank >= 10 ? ' (max)' : ''}<div class="bar"><i style="width:${m.rank >= 10 ? 100 : m.into / m.need * 100}%"></i></div></td></tr>`; }).join('') + '</table>';
    },
    help() {
      return `<h1 style="font-size:30px">How to play</h1><ul class="gain">
        <li><b>WASD</b> (or arrow keys) to move. Your weapons fire by themselves.</li><li><b>Space</b> uses your keeper's skill. <b>Q</b> uses their ultimate once the team reaches level 6.</li><li><b>R</b> rerolls your cards (limited). More rerolls and banishes are sold at the Hearth.</li>
        <li>Collect the sparks enemies drop. The whole team shares one level bar; on a level-up everyone picks one card (keys <b>1 2 3</b>).</li>
        <li>Weapons leave marks: <b style="color:#ff8a3c">Burn</b>, <b style="color:#7fd8ff">Chill</b>, <b style="color:#ffe45c">Shock</b>, <b style="color:#8be06a">Rot</b>. Two different marks on one enemy cause a <b>reaction</b>. Your friends' marks count too.</li>
        <li>Two or more weapons of the same element make that element stronger.</li>
        <li>A level 5 weapon <b>evolves</b> if you also hold its partner charm (each card tells you which).</li>
        <li>Stand in a glowing <b>shrine</b> circle to earn a Boon. Defeat red <b>elites</b> for a chest.</li>
        <li>If a friend goes down, stand in their circle to revive them. If everyone is down, the night ends.</li>
        <li>Watch for red flashing rings (an enemy about to charge or explode), blue rings (a Warder is shielding that enemy: kill the Warder first) and purple Dark Bargain circles (optional: a harder 45 seconds for a big reward).</li><li>Survive 12 minutes, then defeat the boss. Win or lose, you keep Embers and experience.</li></ul>`;
    },
  };
  let page = null;
  const openPage = p => { page = p; $('modalBody').innerHTML = PAGES[p](); $('modal').classList.remove('hidden'); };
  document.querySelectorAll('[data-modal]').forEach(b => b.onclick = () => openPage(b.dataset.modal));
  $('modalClose').onclick = () => { $('modal').classList.add('hidden'); renderCamp(); announce(); };
  $('modalBody').onclick = e => {
    const d = e.target.dataset || {};
    if (d.buy) { const id = d.buy, U = HEARTH[id], r = save.hearth[id] || 0, cost = hearthCost(id, r); if (r >= U.max || save.embers < cost || (U.rank && Account.rank(save.xp).lvl < U.rank)) return; save.embers -= cost; save.hearth[id] = r + 1; persist(); openPage('hearth'); }
    else if (d.h) {
      const [act, id] = d.h.split(':'), h = save.heir.find(x => x.id === id); if (!h) return;
      if (act === 'on') { if (save.equip.length < Meta.slots(Account.rank(save.xp).lvl)) save.equip.push(id); }
      else if (act === 'off') save.equip = save.equip.filter(x => x !== id);
      else if (act === 'up') { const c = Meta.upCost(h); if (h.lvl < 5 && save.glimmer >= c) { save.glimmer -= c; h.lvl++; } }
      else if (act === 'sal' && save.equip.indexOf(id) < 0) { save.glimmer += Meta.salvage(h); save.heir = save.heir.filter(x => x !== h); }
      persist(); openPage('heir');
    } else if (d.t) {
      const c = save.char;
      if (d.t === 'reset') save.talents[c] = {};
      else { const T = TALENTS[d.t], t = save.talents[c] = save.talents[c] || {}, pts = Meta.talentPoints(save, c), cost = T.cost || 1; if ((t[d.t] || 0) < T.max && pts.total - pts.used >= cost && !(T.need && pts.used < T.need)) t[d.t] = (t[d.t] || 0) + 1; }
      persist(); openPage('talents');
    } else if (d.s === 'copy') { const ta = $('saveText'); ta.select(); try { navigator.clipboard.writeText(ta.value); $('saveMsg').textContent = 'Copied.'; } catch (err) { $('saveMsg').textContent = 'Select the text and copy it yourself (Ctrl+C).'; } }
    else if (d.s === 'load') {
      try { const s = JSON.parse(decodeURIComponent(escape(atob($('saveText').value.trim())))); if (!s || typeof s !== 'object' || !('embers' in s)) throw 0; save = Object.assign(blank(), s); persist(); openPage('savefile'); $('saveMsg').textContent = 'Loaded.'; }
      catch (err) { $('saveMsg').textContent = 'That text is not a valid save.'; }
    }
  };

  // ---------- keyboard and the draw loop ----------
  const KEYMAP = { KeyW: 'u', ArrowUp: 'u', KeyS: 'd', ArrowDown: 'd', KeyA: 'l', ArrowLeft: 'l', KeyD: 'r', ArrowRight: 'r' };
  addEventListener('keydown', e => {
    if (e.target.tagName === 'INPUT') return;
    if (KEYMAP[e.code]) { keys[KEYMAP[e.code]] = true; if (inGame) e.preventDefault(); }
    if (!inGame) return;
    if (e.code === 'Digit1' || e.code === 'Digit2' || e.code === 'Digit3' || e.code === 'Digit4') pickCard(+e.code.slice(5) - 1);
    if (e.code === 'KeyR') reroll();
    if (e.code === 'KeyQ' && !e.repeat) tryUlt();
    if (e.code === 'Space') { e.preventDefault(); if (!e.repeat) trySkill(); }
  });
  addEventListener('keyup', e => { if (KEYMAP[e.code]) keys[KEYMAP[e.code]] = false; });
  addEventListener('blur', () => { for (const k in keys) keys[k] = false; });
  function trySkill() {
    const c = View.cur, p = c && c.P.get(myId); if (!p || p.sk || (p.fl & 1) || c.s.pz) return;
    const b = View.builds.find(x => x.id === myId); if (!b) return;
    skLatch |= 1;
    if (b.char === 'wick') dashT = 0.28;
    else if (b.char === 'tolliver') { View.me.x += View.me.fx * 190; View.me.y += View.me.fy * 190; clampMe(); }
  }
  const clampMe = () => { const W = Sim.WORLD, m = View.me; m.x = Math.max(-W, Math.min(W, m.x)); m.y = Math.max(-W, Math.min(W, m.y)); };
  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - lastFrame) / 1000); lastFrame = now;
    if (!View.cur) return;
    const c = View.cur, p = c.P.get(myId), m = View.me;
    if (inGame && p) {
      if (p.fl & 1) { m.x = p.x; m.y = p.y; }
      else if (!c.s.pz) {
        let dx = (keys.r ? 1 : 0) - (keys.l ? 1 : 0), dy = (keys.d ? 1 : 0) - (keys.u ? 1 : 0);
        if (dx || dy) { const l = Math.hypot(dx, dy); m.fx = dx / l; m.fy = dy / l; }
        const b = View.builds.find(x => x.id === myId), spd = b ? b.spd : 190;
        if (dashT > 0) { dashT -= dt; m.x += m.fx * spd * 4.2 * dt; m.y += m.fy * spd * 4.2 * dt; }
        else if (dx || dy) { m.x += m.fx * spd * dt; m.y += m.fy * spd * dt; }
        clampMe();
      }
    }
    Render.draw(myId);
  }

  Render.init($('cv'));
  renderCamp();
  requestAnimationFrame(frame);
  if (!Net.available()) say('Online play is unavailable right now (no internet?). You can still play alone.');
  window.__game = { save: () => save, Sim, View }; // handy for quick checks in the browser console
})();
