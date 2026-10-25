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
  const f = t => { d.push(t - last); last = t; if (t - t0 < ms) requestAnimationFrame(f); else { d.splice(0, 2); d.sort((a, b) => a - b); res({ avg: d.reduce((a, b) => a + b, 0) / d.length, p90: d[Math.floor(d.length * .9)], p95: d[Math.floor(d.length * .95)] }); } };
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
test('L12 dialogs open centred', async b => {
  for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
    const p = await openPage(b, { seen: true, viewport }); await p.waitForTimeout(900);
    for (const [btn, id] of [['#lb-play', 'lb-mode-dialog'], ['#nav-howto', 'lb-howto-dialog']]) {
      await p.click(btn); await p.waitForTimeout(150);
      const off = await p.evaluate(id => { const r = document.getElementById(id).getBoundingClientRect();
        return [Math.round(r.left + r.width / 2 - innerWidth / 2), Math.round(r.top + r.height / 2 - innerHeight / 2)]; }, id);
      assert(Math.abs(off[0]) <= 2 && Math.abs(off[1]) <= 2, `${viewport.width} ${id} off-centre by ${off}`);
      await p.keyboard.press('Escape'); await p.waitForTimeout(100);
    }
  }
});
test('L11 no console errors', async b => {
  const p = await openPage(b, { seen: true }); await p.waitForTimeout(600);
  assert(p.errors.length === 0, p.errors.join('\n'));
});

// ---------------- Game lobby v0.8: selected deck ----------------
const SAVED = { leaderId: 'L02', mainDeck: Array(20).fill('NM01') };
test('G1 selected deck is used and saved deck untouched', async b => {
  const p = await openPage(b, { seen: true, savedDeck: SAVED });
  await p.click('.lb-deck[data-deck="L03"]'); await p.click('#lb-play'); await p.click('#btn-lobby-bot'); await p.waitForTimeout(200);
  const v = await p.evaluate(() => ({ leader: currentDeckConfig.leaderId, n: currentDeckConfig.mainDeck.length, saved: JSON.parse(localStorage.my_card_game_deck).leaderId }));
  assert(v.leader === 'L03' && v.n === 20 && v.saved === 'L02', JSON.stringify(v));
});
test('G2 last deck remembered across reload', async b => {
  const p = await openPage(b, { seen: true });
  await p.click('.lb-deck[data-deck="L02"]'); await p.reload(); await p.waitForTimeout(300);
  assert(await p.evaluate(() => LobbyView.selectedDeck() === 'L02' && document.querySelector('.lb-deck[data-deck="L02"]').getAttribute('aria-pressed') === 'true'), 'not remembered');
});
test('G3 mine fallback when saved deck missing', async b => {
  const p = await openPage(b, { seen: true, lobbyDeck: 'mine' });
  assert(await p.evaluate(() => LobbyView.selectedDeck() === 'L01') && p.errors.length === 0, 'no fallback: ' + p.errors.join('|'));
});
test('G4 mine is default and used when a deck is saved', async b => {
  const p = await openPage(b, { seen: true, savedDeck: SAVED });
  await p.click('#lb-play'); await p.click('#btn-lobby-bot'); await p.waitForTimeout(200);
  const v = await p.evaluate(() => ({ sel: LobbyView.selectedDeck(), leader: currentDeckConfig.leaderId, first: currentDeckConfig.mainDeck[0] }));
  assert(v.sel === 'mine' && v.leader === 'L02' && v.first === 'NM01', JSON.stringify(v));
});
test('G5 saving in deck builder selects mine', async b => {
  const p = await openPage(b, { seen: true });
  await p.click('#nav-deck'); await p.waitForTimeout(600);
  await p.evaluate(() => { currentDeckConfig.leaderId = 'L03'; currentDeckConfig.mainDeck = [...DEFAULT_DOOMSDAY_DECK_LIST]; renderDeckBuilder(); });
  await p.click('#btn-save-start'); await p.waitForTimeout(400);
  assert(await p.evaluate(() => LobbyView.selectedDeck() === 'mine' && !!document.querySelector('.lb-deck[data-deck="mine"]') && document.querySelector('.lb-deck-name').textContent === 'เด็คของฉัน'), 'mine not selected');
});
test('G6 join applies selected deck', async b => {
  const p = await openPage(b, { seen: true });
  await p.evaluate(() => { window.joinPvpRoomAsGuest = () => { window.__leader = currentDeckConfig.leaderId; }; });
  await p.click('.lb-deck[data-deck="L02"]'); await p.fill('#lb-join-code', '4829'); await p.press('#lb-join-code', 'Enter');
  assert(await p.evaluate(() => window.__leader === 'L02'), 'deck not applied before join');
});
test('G7 cancel keeps current deck config', async b => {
  const p = await openPage(b, { seen: true });
  const before = await p.evaluate(() => JSON.stringify(currentDeckConfig));
  await p.click('.lb-deck[data-deck="L03"]'); await p.click('#lb-play'); await p.click('#lb-mode-close');
  await p.click('#lb-play'); await p.keyboard.press('Escape'); await p.waitForTimeout(100);
  assert(await p.evaluate(b => JSON.stringify(currentDeckConfig) === b, before), 'changed on cancel');
});
test('G8 switching deck updates info, leader and wall', async b => {
  const p = await openPage(b, { seen: true });
  await p.click('.lb-deck[data-deck="L03"]'); await p.waitForTimeout(1500);
  const v = await p.evaluate(() => { const ids = new Set(LobbyData.cardsOfDeck('L03').map(c => c.id));
    return { name: document.querySelector('.lb-deck-name').textContent, leader: /วันสิ้นโลก/.test(decodeURI(document.querySelector('#lb-leader img').src)),
      bad: [...document.querySelectorAll('#lb-wall .lb-tile')].filter(t => !ids.has(t.dataset.cardId)).length,
      pressed: document.querySelector('.lb-deck[data-deck="L03"]').getAttribute('aria-pressed') }; });
  assert(v.name === 'เด็ควันสิ้นโลก' && v.leader && v.bad === 0 && v.pressed === 'true', JSON.stringify(v));
});

// ---------------- Game lobby v0.8: motion (ย้ายจากชุดเดิม + ของใหม่) ----------------
const INTRO_PARTS = '#lb-leader, .lb-info, .lb-menu, #lb-decks, #lb-play';
const startBotGame = async p => { await p.click('#lb-play'); await p.click('#btn-lobby-bot'); await p.click('#btn-start-ai-match'); };
const lobbyTweens = p => p.evaluate(() => gsap.globalTimeline.getChildren(true, true, false)
  .filter(t => (t.isActive() || t.repeat() === -1) && t.targets().some(e => e.closest && e.closest('#lobby-screen'))).length);
const wallBad = (p, key) => p.evaluate(key => { const ids = new Set(LobbyData.cardsOfDeck(key).map(c => c.id));
  return [...document.querySelectorAll('#lb-wall .lb-tile')].filter(t => !ids.has(t.dataset.cardId)).length; }, key);

test('T1 loads gsap and LobbyMotion', async b => {
  const p = await openPage(b);
  assert(await p.evaluate(() => typeof gsap === 'object' && typeof LobbyMotion.start === 'function'), 'gsap/LobbyMotion missing');
  assert(p.errors.length === 0, 'page errors: ' + p.errors.join(' | '));
});
test('T2 stops when leaving lobby', async b => {
  const p = await openPage(b); await p.waitForTimeout(1800);
  await startBotGame(p); await p.waitForTimeout(600);
  assert(await p.evaluate(() => LobbyMotion.isRunning()) === false, 'still running');
  const k = await lobbyTweens(p); assert(k === 0, 'active tweens left: ' + k);
});
test('T2 restarts on return', async b => {
  const p = await openPage(b); await p.waitForTimeout(300);
  assert(await p.evaluate(() => LobbyMotion.isRunning()), 'not running on load');
});
test('T2 no stacking on double start', async b => {
  const p = await openPage(b, { seen: true }); await p.waitForTimeout(1500);
  const n1 = await p.evaluate(() => gsap.globalTimeline.getChildren(true, true, true).length);
  const n2 = await p.evaluate(() => { LobbyMotion.start({ short: true }); LobbyMotion.start({ short: true }); return new Promise(r => setTimeout(() => r(gsap.globalTimeline.getChildren(true, true, true).length), 1500)); });
  assert(Math.abs(n2 - n1) <= 2, `tween count grew ${n1} -> ${n2}`);
});
test('T2 pauses under modal and resumes', async b => {
  const p = await openPage(b); await p.waitForTimeout(1800);
  await p.click('#lb-play'); await p.click('#btn-lobby-bot'); await p.waitForTimeout(300);
  assert(await p.evaluate(() => LobbyMotion.isPaused()), 'not paused under modal');
  await p.click('#btn-cancel-ai-setup'); await p.waitForTimeout(650);
  assert(await p.evaluate(() => !LobbyMotion.isPaused() && LobbyMotion.isRunning()), 'not resumed');
});
test('T2 pauses under mode dialog', async b => {
  const p = await openPage(b, { seen: true }); await p.waitForTimeout(900);
  await p.click('#lb-play'); await p.waitForTimeout(300);
  assert(await p.evaluate(() => LobbyMotion.isPaused()), 'not paused under dialog');
  await p.click('#lb-mode-close'); await p.waitForTimeout(400);
  assert(await p.evaluate(() => !LobbyMotion.isPaused()), 'not resumed after dialog');
});
test('T3 intro finishes by 1.7s', async b => {
  const p = await openPage(b); await p.waitForTimeout(1700);
  const o = await opacityAll(p, INTRO_PARTS); assert(o.every(x => x > .99), 'not all visible: ' + o);
});
test('T3 intro hides parts at start', async b => {
  const p = await openPage(b); await p.waitForTimeout(150);
  const o = await opacityAll(p, '#lb-leader'); assert(o[0] < .5, 'leader already visible at 150ms: ' + o);
});
test('T3 skip on click', async b => {
  const p = await openPage(b); await p.waitForTimeout(300);
  await p.mouse.click(5, 300); await p.waitForTimeout(100);
  const o = await opacityAll(p, INTRO_PARTS); assert(o.every(x => x > .99), 'not skipped: ' + o);
});
test('T3 play button single click during intro', async b => {
  const p = await openPage(b); await p.waitForTimeout(300);
  await p.click('#lb-play', { force: true }); await p.waitForTimeout(300);
  assert(await p.evaluate(() => document.getElementById('lb-mode-dialog').open), 'dialog not opened');
});
test('T3 short on return', async b => {
  const p = await openPage(b, { seen: true }); await p.waitForTimeout(800);
  const o = await opacityAll(p, INTRO_PARTS); assert(o.every(x => x > .99), 'short intro not done by 0.8s: ' + o);
});
test('T3 reduced motion', async b => {
  const p = await openPage(b, { reduced: true }); await p.waitForTimeout(100);
  const o = await opacityAll(p, INTRO_PARTS); assert(o.every(x => x > .99), 'hidden under reduced motion: ' + o);
  assert(await p.evaluate(() => !LobbyMotion._particlesActive()), 'stars moving under reduced motion');
});
test('T3 intro smooth', async b => {
  const p = await openPage(b); const s = await frameStats(p, 1800);
  assert(s.p95 <= 17.5, 'intro p95 ' + s.p95.toFixed(1));
});
const ALLOWED = new Set(['x', 'y', 'xPercent', 'yPercent', 'rotation', 'rotationX', 'rotationY', 'rotate', 'scale', 'scaleX', 'scaleY', 'opacity', 'autoAlpha', 'transformOrigin', 'z', 'skewX', 'skewY', 'transformPerspective', 'visibility', 'display', 'clearProps', 'immediateRender', 'force3D']);
test('T4 only transform/opacity', async b => {
  const p = await openPage(b); await p.waitForTimeout(1800);
  await p.click('.lb-deck[data-deck="L02"]'); await p.waitForTimeout(150);
  const keys = await p.evaluate(() => { const s = new Set(); gsap.globalTimeline.getChildren(true, true, false).forEach(t => Object.keys(t.vars).forEach(k => s.add(k))); return [...s]; });
  const meta = new Set(['duration', 'ease', 'repeat', 'yoyo', 'delay', 'repeatDelay', 'stagger', 'onComplete', 'onStart', 'onUpdate', 'overwrite', 'id', 'paused', 'keyframes', 'repeatRefresh', 'callbackScope', 'data', 'onRepeat', 'startAt', 'runBackwards', 'parent', 'lazy', 'onReverseComplete', 'inherit', 'defaults', 'smoothChildTiming', 'autoRemoveChildren', 'onInterrupt', 'yoyoEase', 'onCompleteParams', 'onReverseCompleteParams']);
  const bad = keys.filter(k => !ALLOWED.has(k) && !meta.has(k)); assert(bad.length === 0, 'non-compositor props: ' + bad);
});
test('T4 idle is smooth', async b => {
  const p = await openPage(b); await p.waitForTimeout(2000);
  const s = await frameStats(p, 3000); assert(s.p95 <= 17.5, 'idle p95 ' + s.p95.toFixed(1));
});
const scaleOf = (p, sel) => p.evaluate(sel => gsap.getProperty(document.querySelector(sel), 'scaleX'), sel);
test('T5 play press is fast', async b => {
  const p = await openPage(b, { seen: true }); await p.waitForTimeout(900);
  const bb = await p.locator('#lb-play').boundingBox();
  await p.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2); await p.waitForTimeout(200);
  await p.mouse.down(); await p.waitForTimeout(80);
  const s = await scaleOf(p, '#lb-play'); await p.mouse.up();
  assert(s <= .97, 'scale after 80ms press = ' + s);
});
test('T5 leader tilts on mouse', async b => {
  const p = await openPage(b, { seen: true }); await p.waitForTimeout(900);
  const bb = await p.locator('#lb-leader').boundingBox();
  await p.mouse.move(bb.x + bb.width * .5, bb.y + bb.height * .4); await p.mouse.move(bb.x + bb.width * .8, bb.y + bb.height * .2, { steps: 3 }); await p.waitForTimeout(150);
  assert(await p.evaluate(() => document.getElementById('lb-leader').style.getPropertyValue('--ry') !== ''), 'no tilt');
});
test('T5 touch has no tilt', async b => {
  const p = await openPage(b, { seen: true, touch: true }); await p.waitForTimeout(900);
  const bb = await p.locator('#lb-leader').boundingBox();
  await p.touchscreen.tap(bb.x + bb.width * .9, bb.y + bb.height / 2); await p.waitForTimeout(500);
  assert(await p.evaluate(() => document.getElementById('lb-leader').style.getPropertyValue('--ry') === ''), 'touch tilted');
});
const particleCount = p => p.evaluate(() => LobbyMotion._particleCount());
test('T6 particle count desktop', async b => {
  const p = await openPage(b); await p.waitForTimeout(2000);
  const n = await particleCount(p); assert(n > 0 && n <= 30, 'count ' + n);
});
test('T6 particle count small screen', async b => {
  const p = await openPage(b, { viewport: { width: 600, height: 800 } }); await p.waitForTimeout(2000);
  const n = await particleCount(p); assert(n > 0 && n <= 15, 'count ' + n);
});
test('T6 canvas sits in the lobby and resizes', async b => {
  const p = await openPage(b); await p.waitForTimeout(800);
  await p.setViewportSize({ width: 1000, height: 700 }); await p.waitForTimeout(400);
  const v = await p.evaluate(() => { const c = document.getElementById('lm-particles'), l = document.getElementById('lobby-screen');
    return { inLobby: c.parentElement === l, w: c.width, want: Math.round(l.clientWidth * Math.min(devicePixelRatio, 2)) }; });
  assert(v.inLobby && Math.abs(v.w - v.want) <= 1, JSON.stringify(v));
});
test('T6 particles stop in game', async b => {
  const p = await openPage(b); await p.waitForTimeout(2000);
  await startBotGame(p); await p.waitForTimeout(500);
  assert(await p.evaluate(() => LobbyMotion._particlesActive() === false), 'particles still ticking');
});
test('T7 memory stable 30s', async b => {
  const p = await openPage(b); await p.waitForTimeout(3000);
  const a = rss(); await p.waitForTimeout(30000); const c = rss();
  assert(c - a < 50, `rss ${a.toFixed(0)} -> ${c.toFixed(0)} MB`);
});
test('T7 round trips', async b => {
  const p = await openPage(b);
  for (let i = 0; i < 5; i++) {
    await p.waitForTimeout(i === 0 ? 1800 : 900);
    await startBotGame(p); await p.waitForTimeout(400);
    const n = await p.evaluate(() => gsap.globalTimeline.getChildren(true, true, true).filter(t => t.repeat() === -1).length);
    assert(n === 0, `round ${i}: ${n} loops alive in game`);
    await p.evaluate(() => returnToLobbyScreen()); await p.waitForTimeout(300);
    assert(await p.evaluate(() => LobbyMotion.isRunning()), `round ${i}: not restarted in lobby`);
  }
  assert(p.errors.length === 0, 'errors: ' + p.errors.join(' | '));
});
test('F1 no flash on return to lobby', async b => {
  const p = await openPage(b); await p.waitForTimeout(1800);
  await startBotGame(p); await p.waitForTimeout(400);
  const o = await p.evaluate(() => new Promise(r => { returnToLobbyScreen(); requestAnimationFrame(() => r(+getComputedStyle(document.getElementById('lb-leader')).opacity)); }));
  assert(o < .5, 'lobby painted fully before intro (opacity ' + o + ')');
});
test('F4 particles keep position across modal', async b => {
  const p = await openPage(b); await p.waitForTimeout(2000);
  const a = await p.evaluate(() => LobbyMotion._particlePos());
  await p.click('#lb-play'); await p.click('#btn-lobby-bot'); await p.waitForTimeout(300); await p.click('#btn-cancel-ai-setup'); await p.waitForTimeout(250);
  const c = await p.evaluate(() => LobbyMotion._particlePos());
  assert(Math.abs(a.x - c.x) < 40, `particle jumped ${a.x.toFixed(0)} -> ${c.x.toFixed(0)}`);
});
test('M1 deck switch flips the wall as a wave', async b => {
  const p = await openPage(b, { seen: true }); await p.waitForTimeout(1000);
  await p.click('.lb-deck[data-deck="L02"]'); await p.waitForTimeout(120);
  const v = await p.evaluate(() => { const t = [...document.querySelectorAll('#lb-wall .lb-tile')]; return { flipping: t.filter(x => x.classList.contains('flipping')).length, n: t.length }; });
  assert(v.flipping > 0 && v.flipping < v.n, JSON.stringify(v));
});
test('M2 idle flips stay within the selected deck', async b => {
  const p = await openPage(b, { seen: true, lobbyDeck: 'L03' }); await p.waitForTimeout(800);
  await p.evaluate(() => { window.__flips = 0; new MutationObserver(m => m.forEach(r => { if (r.target.classList.contains('flipping')) window.__flips++; })).observe(document.getElementById('lb-wall'), { subtree: true, attributes: true, attributeFilter: ['class'] }); });
  await p.waitForTimeout(6000);
  const flipped = await p.evaluate(() => window.__flips);
  const bad = await wallBad(p, 'L03'); assert(flipped > 0 && bad === 0, JSON.stringify({ flipped, bad }));
});
test('M3 wall settles on last deck after rapid switching', async b => {
  const p = await openPage(b, { seen: true }); await p.waitForTimeout(1000);
  for (const k of ['L02', 'L03', 'L01', 'L02', 'L03']) await p.click(`.lb-deck[data-deck="${k}"]`);
  await p.waitForTimeout(2500);
  const v = await p.evaluate(() => ({ leader: document.querySelectorAll('#lb-leader img').length, name: document.querySelector('.lb-deck-name').textContent }));
  const bad = await wallBad(p, 'L03'); assert(bad === 0 && v.leader === 1 && v.name === 'เด็ควันสิ้นโลก', JSON.stringify({ ...v, bad }));
});
test('M7 wall at rest shows each card on an unrotated front face', async b => {
  const p = await openPage(b, { seen: true }); await p.waitForTimeout(1000);
  await p.click('.lb-deck[data-deck="L02"]'); await p.waitForTimeout(1800);
  const v = await p.evaluate(() => [...document.querySelectorAll('#lb-wall .lb-tile:not(.flipping)')].map(t => {
    const front = t.querySelector('img.front'), card = CARD_DATABASE.find(c => c.id === t.dataset.cardId);
    return !t.classList.contains('flip') && getComputedStyle(front).visibility === 'visible' && decodeURI(front.src).endsWith(LobbyData.thumbOf(card));
  }));
  assert(v.length > 40 && v.every(Boolean), `${v.filter(x => !x).length} of ${v.length} tiles not settled on front`);
});
test('M4 deck switch is smooth', async b => {
  const p = await openPage(b, { seen: true }); await p.waitForTimeout(1000);
  // สลับเด็คเป็นการกดครั้งเดียว: ยอมเฟรมตกได้ไม่เกิน 10% ของ 1.5 วิ (คลื่นพลิกไพ่บนจอ raster หนักในเบราว์เซอร์ซอฟต์แวร์)
  const fs = frameStats(p, 1500); await p.click('.lb-deck[data-deck="L02"]');
  const s = await fs; assert(s.p90 <= 17.5, 'switch p90 ' + s.p90.toFixed(1));
});
test('M5 reduced motion swaps deck instantly without flips', async b => {
  const p = await openPage(b, { seen: true, reduced: true });
  await p.click('.lb-deck[data-deck="L02"]'); await p.waitForTimeout(50);
  const bad = await wallBad(p, 'L02');
  assert(bad === 0 && await p.evaluate(() => !LobbyMotion._particlesActive() && !document.querySelector('#lb-wall .flipping')), 'not instant under reduced motion: ' + bad);
});
test('M6 content visible without gsap', async b => {
  const p = await openPage(b, { seen: true, blockGsap: true }); await p.waitForTimeout(600);
  const o = await opacityAll(p, '#lb-leader img, #lb-play, .lb-deck-name, #lb-decks');
  const vis = await p.evaluate(() => getComputedStyle(document.getElementById('lobby-screen')).visibility);
  assert(o.every(x => x > .99) && vis === 'visible', JSON.stringify({ o, vis }));
});

// ---------------- Final review fixes (0.8) ----------------
const spillOf = p => p.evaluate(() => [...document.querySelectorAll('#lobby-screen *')].filter(e => !e.closest('#lb-wall, dialog, #lm-particles') && e.getClientRects().length)
  .filter(e => { const r = e.getBoundingClientRect(); return r.right > innerWidth + 1 || r.bottom > innerHeight + 1 || r.left < -1 || r.top < -1; }).map(e => e.id || e.className).slice(0, 4));
const overlap = p => p.evaluate(() => { const r = s => document.querySelector(s).getBoundingClientRect();
  const a = r('#lb-play'), boxes = ['.lb-menu', '#lb-decks'].map(r);
  return boxes.some(b => b.left < a.right && a.left < b.right && b.top < a.bottom && a.top < b.bottom); });
test('X1 mobile lobby intact after returning from a game', async b => {
  const p = await openPage(b, { seen: true, viewport: { width: 390, height: 844 } }); await p.waitForTimeout(900);
  await startBotGame(p); await p.waitForTimeout(400);
  await p.evaluate(() => returnToLobbyScreen()); await p.waitForTimeout(1200);
  const s = await spillOf(p); assert(s.length === 0, JSON.stringify(s));
});
test('X2 no lobby dialog stays modal once the lobby is hidden', async b => {
  const p = await openPage(b, { seen: true, viewport: { width: 390, height: 844 } }); await p.waitForTimeout(900);
  await p.evaluate(() => { window.joinPvpRoomAsGuest = () => { document.getElementById('lobby-screen').style.display = 'none'; document.querySelector('.game-container').style.display = 'flex'; }; });
  await p.click('#nav-join'); await p.fill('#lb-join-code', '4829'); await p.press('#lb-join-code', 'Enter'); await p.waitForTimeout(300);
  const v = await p.evaluate(() => ({ modal: [...document.querySelectorAll('dialog')].some(d => d.matches(':modal')), form: document.querySelectorAll('#lb-join').length }));
  assert(!v.modal && v.form === 1, JSON.stringify(v));
});
test('X3 saved deck with unknown leader does not break the lobby', async b => {
  const p = await openPage(b, { seen: true, savedDeck: { leaderId: 'L99', mainDeck: Array(20).fill('M01') }, lobbyDeck: 'mine' }); await p.waitForTimeout(400);
  const v = await p.evaluate(() => ({ decks: document.querySelectorAll('.lb-deck').length, tiles: document.querySelectorAll('#lb-wall .lb-tile').length, sel: LobbyView.selectedDeck() }));
  await p.click('#lb-play'); const open = await p.evaluate(() => document.getElementById('lb-mode-dialog').open);
  assert(p.errors.length === 0 && v.decks === 3 && v.tiles > 0 && v.sel === 'L01' && open, JSON.stringify({ ...v, open, err: p.errors }));
});
test('X4 rotating between landscape and portrait keeps the layout', async b => {
  for (const [from, to] of [[{ width: 844, height: 390 }, { width: 390, height: 844 }], [{ width: 390, height: 844 }, { width: 844, height: 390 }]]) {
    const p = await openPage(b, { seen: true, viewport: from }); await p.waitForTimeout(1200);
    await p.setViewportSize(to); await p.waitForTimeout(600);
    const v = { spill: await spillOf(p), overlap: await overlap(p), cols: await p.evaluate(() => getComputedStyle(document.querySelector('.lb-wall-inner')).gridTemplateColumns.split(' ').length) };
    assert(v.spill.length === 0 && !v.overlap && v.cols === (to.width < 768 ? 6 : 12), `${from.width}->${to.width} ` + JSON.stringify(v));
  }
});
test('X5 tablet sizes do not overflow', async b => {
  for (const viewport of [{ width: 768, height: 1024 }, { width: 768, height: 600 }, { width: 900, height: 700 }, { width: 820, height: 1180 }]) {
    const p = await openPage(b, { seen: true, viewport }); await p.waitForTimeout(1200);
    const v = await p.evaluate(() => ({ scroll: document.documentElement.scrollWidth > innerWidth + 1, info: document.querySelector('.lb-info').getBoundingClientRect().right }));
    const s = await spillOf(p);
    assert(!v.scroll && v.info <= viewport.width && s.length === 0, viewport.width + 'x' + viewport.height + ' ' + JSON.stringify({ ...v, s }));
  }
});
test('X6 selected deck stays lifted after a mouse click', async b => {
  const p = await openPage(b, { seen: true }); await p.waitForTimeout(1000);
  await p.click('.lb-deck[data-deck="L02"]'); await p.mouse.move(5, 5); await p.waitForTimeout(600);
  const ty = await p.evaluate(() => new DOMMatrix(getComputedStyle(document.querySelector('.lb-deck[data-deck="L02"]')).transform).m42);
  assert(ty <= -5, 'translateY = ' + ty);
});
test('X7 idle flips do not pile up tweens', async b => {
  const p = await openPage(b, { seen: true }); await p.waitForTimeout(2000);
  const count = () => p.evaluate(() => LobbyMotion._ctxTweens());
  const a = await count(); await p.waitForTimeout(9000); const c = await count();
  assert(c - a <= 6, `tweens ${a} -> ${c}`);
});
test('X8 deck builder opens on the saved deck, not the last played one', async b => {
  const p = await openPage(b, { seen: true, savedDeck: { leaderId: 'L02', mainDeck: Array(20).fill('NM01') } });
  await p.click('.lb-deck[data-deck="L03"]'); await startBotGame(p); await p.waitForTimeout(300);
  await p.evaluate(() => returnToLobbyScreen()); await p.waitForTimeout(900);
  await p.click('#nav-deck'); await p.waitForTimeout(400);
  assert(await p.evaluate(() => currentDeckConfig.leaderId === 'L02' && currentDeckConfig.mainDeck[0] === 'NM01'), 'deck builder shows the last played deck');
});
test('X9 keyboard focus on an unselected deck is fully visible', async b => {
  const p = await openPage(b, { seen: true }); await p.waitForTimeout(1000);
  await p.focus('.lb-deck[data-deck="L01"]'); await p.keyboard.press('Tab'); // ใช้คีย์บอร์ดจริงให้ :focus-visible ทำงาน
  assert(await p.evaluate(() => document.activeElement.dataset.deck === 'L02'), 'tab did not reach L02'); await p.waitForTimeout(300);
  const v = await p.evaluate(() => { const s = getComputedStyle(document.querySelector('.lb-deck[data-deck="L02"]')); return { o: +s.opacity, ring: s.outlineStyle }; });
  assert(v.o > .99 && v.ring === 'solid', JSON.stringify(v));
});

// ---------------- Mode dialog v0.8.1: การ์ดโหมด ----------------
const openMode = async p => { await p.click('#lb-play'); await p.waitForTimeout(900); };
test('N1 mode dialog shows the selected deck', async b => {
  const p = await openPage(b, { seen: true, savedDeck: { leaderId: 'L02', mainDeck: Array(20).fill('NM01') } }); await p.waitForTimeout(800);
  const chip = () => p.evaluate(() => { const c = document.querySelector('#lb-mode-dialog .lb-mode-deck'); return { text: c.textContent, img: decodeURI(c.querySelector('img').src) }; });
  await p.click('.lb-deck[data-deck="L03"]'); await openMode(p); const a = await chip(); await p.click('#lb-mode-close');
  await p.click('.lb-deck[data-deck="mine"]'); await openMode(p); const c = await chip();
  assert(/เด็ควันสิ้นโลก/.test(a.text) && /วันสิ้นโลก\/1\.webp$/.test(a.img) && /เด็คของฉัน/.test(c.text) && /เด็คเหนือ\/1\.webp$/.test(c.img), JSON.stringify({ a, c }));
});
test('N2 two mode cards with title, description and icon', async b => {
  const p = await openPage(b, { seen: true }); await openMode(p);
  const v = await p.evaluate(() => ['#btn-lobby-bot', '#btn-lobby-pvp'].map(id => { const e = document.querySelector(id), r = e.getBoundingClientRect();
    return { cls: e.classList.contains('lb-mode'), title: e.querySelector('.lb-mode-title')?.textContent, desc: !!e.querySelector('.lb-mode-desc')?.textContent, icon: !!e.querySelector('svg'), w: r.width, h: r.height }; }));
  assert(v.every(x => x.cls && x.desc && x.icon && x.w >= 120 && x.h >= 88) && v[0].title === 'เล่นกับบอท' && v[1].title === 'ดวลกับเพื่อน', JSON.stringify(v));
});
test('N3 mode dialog opens with motion; cards end fully visible', async b => {
  const p = await openPage(b, { seen: true }); await p.waitForTimeout(900);
  await p.click('#lb-play'); await p.waitForTimeout(60);
  const early = await opacityAll(p, '#lb-mode-dialog .lb-mode');
  await p.waitForTimeout(900); const late = await opacityAll(p, '#lb-mode-dialog .lb-mode');
  assert(early.some(x => x < .9) && late.every(x => x > .99), JSON.stringify({ early, late }));
});
test('N4 reduced motion opens the mode dialog instantly', async b => {
  const p = await openPage(b, { seen: true, reduced: true });
  await p.click('#lb-play'); await p.waitForTimeout(30);
  const o = await opacityAll(p, '#lb-mode-dialog .lb-mode, #lb-mode-dialog .lb-mode-deck');
  assert(o.every(x => x > .99), JSON.stringify(o));
});
test('N5 mode dialog fits a phone with cards stacked', async b => {
  for (const viewport of [{ width: 390, height: 844 }, { width: 320, height: 640 }]) {
    const p = await openPage(b, { seen: true, viewport }); await openMode(p);
    const v = await p.evaluate(() => { const d = document.getElementById('lb-mode-dialog').getBoundingClientRect();
      const [a, c] = ['#btn-lobby-bot', '#btn-lobby-pvp'].map(s => document.querySelector(s).getBoundingClientRect());
      return { inside: d.left >= 0 && d.right <= innerWidth && d.top >= 0 && d.bottom <= innerHeight, stacked: c.top >= a.bottom - 1 }; });
    assert(v.inside && v.stacked, viewport.width + ' ' + JSON.stringify(v));
  }
});
test('N6 mode card press and burst use transform/opacity only', async b => {
  const p = await openPage(b, { seen: true }); await openMode(p);
  const bb = await p.locator('#btn-lobby-pvp').boundingBox();
  await p.evaluate(() => { document.getElementById('btn-lobby-pvp').addEventListener('click', e => e.stopImmediatePropagation(), true); });
  await p.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2); await p.mouse.down(); await p.waitForTimeout(40); await p.mouse.up(); await p.waitForTimeout(60);
  const keys = await p.evaluate(() => { const s = new Set(); gsap.globalTimeline.getChildren(true, true, false).forEach(t => Object.keys(t.vars).forEach(k => s.add(k))); return [...s]; });
  const bad = keys.filter(k => /shadow|color|width|height|top|left|background|filter/i.test(k));
  assert(bad.length === 0, 'non-compositor props: ' + bad);
});
test('N7 keyboard focus on a mode card shows a gold ring', async b => {
  const p = await openPage(b, { seen: true }); await p.waitForTimeout(900);
  await p.focus('#lb-play'); await p.keyboard.press('Enter'); await p.waitForTimeout(900);
  const v = await p.evaluate(() => { const s = getComputedStyle(document.activeElement); return { id: document.activeElement.id, style: s.outlineStyle, color: s.outlineColor }; });
  assert(v.id === 'btn-lobby-bot' && v.style === 'solid' && v.color === 'rgb(243, 201, 105)', JSON.stringify(v));
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
