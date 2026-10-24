// ชุดทดสอบ motion ล็อบบี้ (รันในเครื่องพัฒนา: node tests/lobby.spec.js [คำกรอง])
const { chromium } = require('playwright');
const path = require('path');
const { execSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const URL = 'file://' + ROOT + '/index.html';
const tests = [];
const test = (name, fn) => tests.push({ name, fn });
const assert = (c, m) => { if (!c) throw new Error(m); };

async function openPage(browser, opts = {}) {
  const ctx = await browser.newContext({
    viewport: opts.viewport || { width: 1316, height: 620 }, deviceScaleFactor: 1.25,
    reducedMotion: opts.reduced ? 'reduce' : 'no-preference', hasTouch: !!opts.touch,
  });
  if (opts.seen) await ctx.addInitScript(() => { try { sessionStorage.setItem('lm-seen', '1'); } catch (e) {} });
  // เตรียม localStorage ครั้งเดียวตอนเปิดหน้าแรก (reload แล้วไม่ทับค่าที่หน้าเขียนเอง)
  if (opts.savedDeck || opts.lobbyDeck) await ctx.addInitScript(([deck, lobby]) => {
    if (sessionStorage.getItem('__seeded')) return; sessionStorage.setItem('__seeded', '1');
    if (deck) localStorage.setItem('my_card_game_deck', deck);
    if (lobby) localStorage.setItem('bof_lobby_deck', lobby);
  }, [opts.savedDeck ? JSON.stringify(opts.savedDeck) : '', opts.lobbyDeck || '']);
  const page = await ctx.newPage(); page.setDefaultTimeout(8000);
  page.errors = []; page.on('pageerror', e => page.errors.push(e.message));
  if (opts.blockGsap) await page.route('**/gsap.min.js', r => r.abort());
  if (opts.blockThumbs) await page.route('**/thumbs/**', r => r.abort());
  await page.goto(URL);
  return page;
}
const frameStats = (page, ms) => page.evaluate(ms => new Promise(res => {
  const d = []; let last = performance.now(); const t0 = last;
  const f = t => { d.push(t - last); last = t; if (t - t0 < ms) requestAnimationFrame(f); else { d.splice(0, 2); d.sort((a, b) => a - b); res({ avg: d.reduce((a, b) => a + b, 0) / d.length, p95: d[Math.floor(d.length * .95)] }); } };
  requestAnimationFrame(f);
}), ms);
const opacityAll = (page, sel) => page.evaluate(sel => [...document.querySelectorAll(sel)].map(e => +getComputedStyle(e).opacity), sel);
const rss = () => { try { return Math.max(...execSync("ps -eo rss,args | grep chrome-headless | grep -- '--type=renderer' | grep -v grep | awk '{print $1}'").toString().trim().split('\n').map(Number)) / 1024; } catch (e) { return -1; } };

// ---------------- Lobby redesign: data ----------------
test('D1 rarity counts match database', async b => {
  const p = await openPage(b, { seen: true });
  const c = await p.evaluate(() => LobbyData.rarityCounts());
  assert(c.Legend === 5 && c.SR === 12 && c.R === 17 && c.N === 5 && c.total === 39, JSON.stringify(c));
});
test('D2 deck info per leader', async b => {
  const p = await openPage(b, { seen: true });
  const d = await p.evaluate(() => ['L01', 'L02', 'L03'].map(id => { const i = LobbyData.deckInfo(id); return [i.leader.id, i.cards.length, i.total, i.hp]; }));
  assert(JSON.stringify(d) === JSON.stringify([['L01', 10, 21, 6], ['L02', 10, 21, 6], ['L03', 16, 21, 6]]), JSON.stringify(d));
});
test('D3 room code normalize', async b => {
  const p = await openPage(b, { seen: true });
  const r = await p.evaluate(() => [' 4829 ', '๔๘๒๙', '48a9', '', '12345'].map(LobbyData.normalizeRoomCode));
  assert(JSON.stringify(r) === JSON.stringify(['4829', '4829', null, null, null]), JSON.stringify(r));
});

test('D4 thumbOf maps png to webp in thumbs', async b => {
  const p = await openPage(b, { seen: true });
  const v = await p.evaluate(() => LobbyData.thumbOf({ image: 'images/เด็คจิต/3.png' }));
  assert(v === 'images/thumbs/เด็คจิต/3.webp', v);
});
test('D5 every card has a thumbnail file', async b => {
  const p = await openPage(b, { seen: true });
  const paths = await p.evaluate(() => CARD_DATABASE.map(c => LobbyData.thumbOf(c)));
  const missing = paths.filter(x => !require('fs').existsSync(path.join(ROOT, x)));
  assert(missing.length === 0, missing.slice(0, 3).join(', '));
});
test('D6 legend count per deck', async b => {
  const p = await openPage(b, { seen: true });
  const v = await p.evaluate(() => ['L01', 'L02', 'L03'].map(LobbyData.legendCount));
  assert(JSON.stringify(v) === '[2,1,2]', JSON.stringify(v));
});
test('D7 cardsOfDeck returns leader plus unique cards', async b => {
  const p = await openPage(b, { seen: true, savedDeck: { leaderId: 'L02', mainDeck: [...Array(10).fill('NM01'), ...Array(10).fill('NM02')] } });
  const v = await p.evaluate(() => ['L01', 'L03', 'mine'].map(k => LobbyData.cardsOfDeck(k).map(c => c.id)));
  assert(v[0].length === 11 && v[0][0] === 'L01' && v[1].length === 17 && JSON.stringify(v[2]) === '["L02","NM01","NM02"]', JSON.stringify(v.map(x => x.length)) + JSON.stringify(v[2]));
});

// ---------------- Lobby redesign: join form ----------------
test('J1 empty or bad code shows error, no join', async b => {
  const p = await openPage(b, { seen: true });
  await p.evaluate(() => { window.__joined = null; window.joinPvpRoomAsGuest = c => { window.__joined = c; }; });
  for (const code of ['', '48a9']) {
    await p.fill('#lb-join-code', code); await p.click('#lb-join button[type=submit]');
    const v = await p.evaluate(() => ({ err: document.getElementById('lb-join-error').textContent.trim(), joined: window.__joined, url: location.href }));
    assert(v.err.length > 0 && v.joined === null && !v.url.includes('?'), 'code ' + JSON.stringify(code) + ': ' + JSON.stringify(v));
  }
});
test('J2 valid code joins directly', async b => {
  const p = await openPage(b, { seen: true });
  await p.evaluate(() => { window.__joined = null; window.joinPvpRoomAsGuest = c => { window.__joined = c; }; });
  await p.fill('#lb-join-code', '๔๘๒๙'); await p.press('#lb-join-code', 'Enter'); await p.waitForTimeout(100);
  const v = await p.evaluate(() => ({ joined: window.__joined, modal: document.getElementById('pvp-room-modal').style.display, err: document.getElementById('lb-join-error').textContent }));
  assert(v.joined === '4829' && v.modal !== 'flex' && v.err === '', JSON.stringify(v));
});

test('J3 pasted code with spaces joins', async b => {
  const p = await openPage(b, { seen: true });
  await p.evaluate(() => { window.__joined = null; window.joinPvpRoomAsGuest = c => { window.__joined = c; }; });
  await p.focus('#lb-join-code'); await p.keyboard.insertText(' 4829 '); await p.press('#lb-join-code', 'Enter');
  const v = await p.evaluate(() => ({ joined: window.__joined, value: document.getElementById('lb-join-code').value }));
  assert(v.joined === '4829', JSON.stringify(v));
});
// ---------------- Game lobby v0.8: layout ----------------
test('L1 no scroll and no spill', async b => {
  for (const [width, height] of [[1440, 900], [1316, 620], [390, 844], [320, 640]]) {
    const p = await openPage(b, { seen: true, viewport: { width, height } }); await p.waitForTimeout(1700);
    const v = await p.evaluate(() => ({ scroll: document.documentElement.scrollHeight > innerHeight + 1 || document.documentElement.scrollWidth > innerWidth + 1,
      spill: [...document.querySelectorAll('#lobby-screen *')].filter(e => !e.closest('#lb-wall, dialog, #lm-particles') && e.getClientRects().length)
        .filter(e => { const r = e.getBoundingClientRect(); return r.right > innerWidth + 1 || r.bottom > innerHeight + 1 || r.left < -1 || r.top < -1; }).map(e => e.id || e.className).slice(0, 4) }));
    assert(!v.scroll && v.spill.length === 0, `${width}x${height} ` + JSON.stringify(v));
  }
});
test('L2 play opens mode dialog; bot reaches AI setup in two clicks', async b => {
  const p = await openPage(b, { seen: true });
  await p.click('#lb-play'); await p.click('#btn-lobby-bot'); await p.waitForTimeout(400);
  assert(await p.evaluate(() => { const m = document.getElementById('ai-setup-modal'); return !!m && getComputedStyle(m).display !== 'none'; }), 'ai setup not open');
});
test('L3 howto dialog shows steps and real counts', async b => {
  const p = await openPage(b, { seen: true });
  await p.click('#nav-howto');
  const t = await p.evaluate(() => document.getElementById('lb-howto-dialog').open ? document.getElementById('lb-howto-dialog').innerText : '');
  assert(/39/.test(t) && /Legend 5/.test(t) && /SR 12/.test(t) && /R 17/.test(t) && /N 5/.test(t) && /ก่อนอื่น/.test(t) && /จากนั้น/.test(t) && /สุดท้าย/.test(t), t.slice(0, 160));
});
test('L4 wall shows only the selected deck', async b => {
  const p = await openPage(b, { seen: true });
  const v = await p.evaluate(() => { const ids = new Set(LobbyData.cardsOfDeck('L01').map(c => c.id));
    const shown = [...document.querySelectorAll('#lb-wall .lb-tile')].map(t => t.dataset.cardId); return { n: shown.length, bad: shown.filter(id => !ids.has(id)) }; });
  assert(v.n === 60 && v.bad.length === 0, JSON.stringify(v));
});
test('L5 mine thumb only when a deck is saved', async b => {
  let p = await openPage(b, { seen: true });
  assert(!(await p.$('.lb-deck[data-deck="mine"]')), 'mine shown without saved deck');
  p = await openPage(b, { seen: true, savedDeck: { leaderId: 'L02', mainDeck: Array(20).fill('NM01') } });
  assert(!!(await p.$('.lb-deck[data-deck="mine"]')), 'mine missing with saved deck');
});
test('L6 missing thumb falls back to full image', async b => {
  const p = await openPage(b, { seen: true, blockThumbs: true }); await p.waitForTimeout(1500);
  const v = await p.evaluate(() => [...document.querySelectorAll('#lb-decks img')].map(i => i.complete && i.naturalWidth > 0 && /\.png$/.test(i.src)));
  assert(v.length >= 3 && v.every(Boolean), JSON.stringify(v));
});
test('L7 leader card has no glow or ring', async b => {
  const p = await openPage(b, { seen: true });
  const v = await p.evaluate(() => ({ ring: !!document.querySelector('#lobby-screen .lb-ring, #lobby-screen .lb-glow'),
    shadow: getComputedStyle(document.querySelector('#lb-leader img')).boxShadow }));
  assert(!v.ring && !/rgb\((62, 224, 143|240, 163, 71|95, 208, 255)/.test(v.shadow), JSON.stringify(v));
});
test('L8 wall and deck thumbs use webp thumbnails; leader uses full art', async b => {
  const p = await openPage(b, { seen: true });
  const v = await p.evaluate(() => ({ wall: [...document.querySelectorAll('#lb-wall img.front')].every(i => /\/thumbs\/.*\.webp$/.test(decodeURI(i.src))),
    decks: [...document.querySelectorAll('#lb-decks img')].every(i => /\.webp$/.test(i.src)), leader: /\.png$/.test(document.querySelector('#lb-leader img').src) }));
  assert(v.wall && v.decks && v.leader, JSON.stringify(v));
});
test('L9 info shows deck name, leader, HP, 21 cards and real legend count', async b => {
  const p = await openPage(b, { seen: true, viewport: { width: 1440, height: 900 } });
  const t = await p.evaluate(() => document.querySelector('.lb-info').innerText);
  assert(/เด็คจิต/.test(t) && /มายฮีโร่ เดจิต/.test(t) && /HP 6/.test(t) && /21 ใบ/.test(t) && /Legend 2/.test(t), t);
});
test('L10 touch targets are at least 44px', async b => {
  for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
    const p = await openPage(b, { seen: true, viewport }); await p.waitForTimeout(1700);
    const small = await p.evaluate(() => [...document.querySelectorAll('#lobby-screen button, #lobby-screen a, #lobby-screen input')]
      .filter(e => !e.closest('dialog') && e.getClientRects().length).filter(e => { const r = e.getBoundingClientRect(); return r.width < 44 || r.height < 44; })
      .map(e => e.id || e.className || e.textContent.trim()).slice(0, 5));
    assert(small.length === 0, viewport.width + ': ' + JSON.stringify(small));
  }
});
test('L11 no console errors', async b => {
  const p = await openPage(b, { seen: true }); await p.waitForTimeout(600);
  assert(p.errors.length === 0, p.errors.join('\n'));
});

(async () => {
  const filter = process.argv[2] || '';
  const browser = await chromium.launch({ args: ['--disable-dev-shm-usage'] });
  let pass = 0, fail = 0;
  for (const t of tests.filter(t => t.name.includes(filter))) {
    try { await t.fn(browser); console.log('PASS', t.name); pass++; }
    catch (e) { console.log('FAIL', t.name, '-', e.message.split('\n')[0]); fail++; }
    for (const c of browser.contexts()) await c.close();
  }
  await browser.close();
  console.log(`${pass}/${pass + fail} passed`);
  process.exit(fail ? 1 : 0);
})();
