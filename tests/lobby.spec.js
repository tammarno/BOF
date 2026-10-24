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
  const page = await ctx.newPage(); page.setDefaultTimeout(8000);
  page.errors = []; page.on('pageerror', e => page.errors.push(e.message));
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

// ---------------- Lobby redesign: structure ----------------
test('S1 one h1 and every section titled', async b => {
  const p = await openPage(b, { seen: true });
  const v = await p.evaluate(() => ({ h1: document.querySelectorAll('#lobby-screen h1').length,
    untitled: ['#lb-stats', '#lb-decks', '#lb-gallery', '#lb-how'].filter(s => !document.querySelector(s + ' h2')) }));
  assert(v.h1 === 1 && v.untitled.length === 0, JSON.stringify(v));
});
test('S2 receipt sums to 39', async b => {
  const p = await openPage(b, { seen: true });
  const v = await p.evaluate(() => [...document.querySelectorAll('.lb-receipt tbody td.num')].map(t => +t.textContent));
  assert(v.reduce((a, x) => a + x, 0) === 39 && v.length === 4, JSON.stringify(v));
});
test('S3 no horizontal scroll at 320 and 390', async b => {
  for (const width of [320, 390]) {
    const p = await openPage(b, { seen: true, viewport: { width, height: 800 } });
    assert(!(await p.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)), 'scroll at ' + width);
  }
});
test('S4 gallery images sized and labelled', async b => {
  const p = await openPage(b, { seen: true });
  const v = await p.evaluate(() => { const imgs = [...document.querySelectorAll('#lb-gallery img')];
    return { n: imgs.length, bad: imgs.filter(i => !i.getAttribute('width') || !i.getAttribute('height') || !i.alt).length }; });
  assert(v.n >= 5 && v.bad === 0, JSON.stringify(v));
});
test('S5 house rules in lobby', async b => {
  const p = await openPage(b, { seen: true });
  const v = await p.evaluate(() => [...document.querySelectorAll('#lobby-screen *')].filter(e => !e.closest('.lb-card') && e.tagName !== 'CANVAS').filter(e => {
    const s = getComputedStyle(e);
    const text = [...e.childNodes].filter(n => n.nodeType === 3).map(n => n.nodeValue).join('');
    return s.backgroundImage.includes('gradient') || s.backdropFilter !== 'none' || /\p{Extended_Pictographic}/u.test(text);
  }).map(e => e.tagName + '.' + e.className));
  assert(v.length === 0, JSON.stringify(v.slice(0, 5)));
});
test('S7 sections contain their own content at 390', async b => {
  const p = await openPage(b, { seen: true, viewport: { width: 390, height: 844 } });
  const bad = await p.evaluate(() => ['#lb-hero', '#lb-stats', '#lb-decks', '#lb-how'].filter(s => {
    const sec = document.querySelector(s), r = sec.getBoundingClientRect();
    return [...sec.querySelectorAll('button, input, h2, .lb-leaders')].some(e => e.getBoundingClientRect().bottom > r.bottom + 1);
  }));
  assert(bad.length === 0, 'content spills out of ' + bad.join(', '));
});
test('S6 no console errors', async b => {
  const p = await openPage(b, { seen: true }); await p.waitForTimeout(500);
  assert(p.errors.length === 0, p.errors.join('\n'));
});

// ---------------- Lobby redesign: deck picker ----------------
test('K1 deck switch updates stage', async b => {
  const p = await openPage(b, { seen: true });
  await p.click('.lb-deck-btn[data-leader="L02"]'); await p.waitForTimeout(600);
  const v = await p.evaluate(() => ({ pressed: [...document.querySelectorAll('.lb-deck-btn')].map(x => x.getAttribute('aria-pressed')),
    stage: getComputedStyle(document.querySelector('.lb-stage')).getPropertyValue('--stage').trim(),
    n: document.querySelectorAll('.lb-stage-cards .lb-card').length, sel: LobbyView.selectedDeck() }));
  assert(JSON.stringify(v.pressed) === '["false","true","false"]' && v.stage === '#6b2430' && v.n === 11 && v.sel === 'L02', JSON.stringify(v));
});
test('K2 deck rapid switch ends on last', async b => {
  const p = await openPage(b, { seen: true });
  for (const id of ['L02', 'L03', 'L01', 'L03']) await p.click(`.lb-deck-btn[data-leader="${id}"]`);
  await p.waitForTimeout(900);
  const n = await p.evaluate(() => document.querySelectorAll('.lb-stage-cards .lb-card').length);
  assert(n === 17, 'cards on stage: ' + n);
});
test('K3 play this deck sets config without saving', async b => {
  const p = await openPage(b, { seen: true });
  const before = await p.evaluate(() => localStorage.getItem('my_card_game_deck'));
  await p.click('.lb-deck-btn[data-leader="L03"]'); await p.click('#lb-play-deck'); await p.waitForTimeout(300);
  const v = await p.evaluate(() => ({ leader: currentDeckConfig.leaderId, n: currentDeckConfig.mainDeck.length,
    saved: localStorage.getItem('my_card_game_deck'), open: document.getElementById('lb-mode-dialog').open }));
  assert(v.leader === 'L03' && v.n === 20 && v.saved === before && v.open, JSON.stringify(v));
});
test('K4 mode dialog routes to bot setup', async b => {
  const p = await openPage(b, { seen: true });
  await p.click('#lb-play-deck'); await p.click('#lb-mode-bot'); await p.waitForTimeout(400);
  const v = await p.evaluate(() => { const m = document.getElementById('ai-setup-modal');
    return { ai: !!m && getComputedStyle(m).display !== 'none', dialog: document.getElementById('lb-mode-dialog').open }; });
  assert(v.ai && !v.dialog, JSON.stringify(v));
});
test('K5 deck-all link opens viewer with that deck', async b => {
  const p = await openPage(b, { seen: true });
  await p.click('.lb-deck-btn[data-leader="L02"]'); await p.click('#lb-deck-all'); await p.waitForTimeout(500);
  assert(await p.evaluate(() => getComputedStyle(document.getElementById('zone-viewer-modal')).display !== 'none'), 'viewer not open');
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

// ---------------- Lobby redesign: wiring ----------------
test('W1 old menu cards gone, nav still opens tools', async b => {
  const p = await openPage(b, { seen: true });
  assert(await p.evaluate(() => !document.querySelector('[id^="card-menu-"]')), 'old menu cards still in DOM');
  await p.click('#nav-cards'); await p.waitForTimeout(500);
  assert(await p.evaluate(() => getComputedStyle(document.getElementById('zone-viewer-modal')).display !== 'none'), 'card list did not open');
});
test('W2 footer CTA opens pvp', async b => {
  const p = await openPage(b, { seen: true });
  await p.click('#lb-footer-cta'); await p.waitForTimeout(400);
  assert(await p.evaluate(() => document.getElementById('pvp-room-modal').style.display === 'flex'), 'pvp not open');
});
test('W3 leader cards tilt on mouse', async b => {
  const p = await openPage(b, { seen: true }); const card = p.locator('.lb-leaders .lb-card').nth(1);
  await card.scrollIntoViewIfNeeded(); const bb = await card.boundingBox();
  await p.mouse.move(bb.x + bb.width * .5, bb.y + bb.height * .3); await p.mouse.move(bb.x + bb.width * .7, bb.y + bb.height * .2, { steps: 3 }); await p.waitForTimeout(150);
  assert(await p.evaluate(() => document.querySelectorAll('.lb-leaders .lb-card')[1].style.getPropertyValue('--ry') !== ''), 'no tilt');
});
test('W4 gallery card opens detail and wide link opens list', async b => {
  const p = await openPage(b, { seen: true });
  await p.click('.lb-tile-card'); await p.waitForTimeout(600);
  assert(await p.evaluate(() => { const o = document.querySelector('.holo-inspect'); return !!o && !o.hidden; }), 'card detail did not open');
  await p.keyboard.press('Escape'); await p.waitForTimeout(500);
  await p.click('#lb-gallery-all'); await p.waitForTimeout(500);
  assert(await p.evaluate(() => getComputedStyle(document.getElementById('zone-viewer-modal')).display !== 'none'), 'card list did not open');
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
