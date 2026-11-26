'use strict';
// Room codes. Browsers connect directly to each other; the free public PeerJS
// service is only used to introduce them the first time.
const Net = (() => {
  const PREFIX = 'lastlanterns-v1-';
  const LETTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const N = { peer: null, conns: [], isHost: false, hostConn: null, code: '', onData: null, onJoin: null, onLeave: null, onHostLost: null };
  const ok = () => typeof Peer !== 'undefined';

  N.available = ok;
  N.host = cb => {
    if (!ok()) return cb('The online library could not be loaded. Check your internet connection.');
    N.close();
    let code = ''; for (let i = 0; i < 4; i++) code += LETTERS[Math.random() * LETTERS.length | 0];
    const peer = N.peer = new Peer(PREFIX + code);
    peer.on('open', () => { N.isHost = true; N.code = code; cb(null, code); });
    peer.on('error', e => { if (e.type === 'unavailable-id') N.host(cb); else if (!N.code) cb('Could not open a room (' + e.type + ').'); });
    peer.on('connection', c => {
      c.on('open', () => { N.conns.push(c); N.onJoin && N.onJoin(c); });
      c.on('data', d => N.onData && N.onData(d, c));
      c.on('close', () => { N.conns = N.conns.filter(x => x !== c); N.onLeave && N.onLeave(c); });
    });
  };
  N.join = (code, cb) => {
    if (!ok()) return cb('The online library could not be loaded. Check your internet connection.');
    N.close();
    let done = false; const fin = e => { if (!done) { done = true; cb(e); } };
    const peer = N.peer = new Peer();
    peer.on('open', () => {
      const c = peer.connect(PREFIX + code, { reliable: true, serialization: 'json' });
      c.on('open', () => { N.hostConn = c; N.code = code; fin(null); });
      c.on('data', d => N.onData && N.onData(d, c));
      c.on('close', () => { if (N.hostConn === c) { N.hostConn = null; N.onHostLost && N.onHostLost(); } });
    });
    peer.on('error', e => fin(e.type === 'peer-unavailable' ? 'No room with that code. Check the letters with your friend.' : 'Could not connect (' + e.type + ').'));
    setTimeout(() => fin('Could not reach that room. Your network or theirs may be blocking direct connections.'), 15000);
  };
  N.send = (c, m) => { try { if (c && c.open) c.send(m); } catch (e) { /* connection closing */ } };
  N.broadcast = m => { for (const c of N.conns) N.send(c, m); };
  N.toHost = m => N.send(N.hostConn, m);
  N.close = () => { if (N.peer) { try { N.peer.destroy(); } catch (e) { /* ignore */ } } N.peer = null; N.conns = []; N.hostConn = null; N.isHost = false; N.code = ''; };
  return N;
})();
