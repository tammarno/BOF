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
  if (opts.blockGsap) await page.route('**/gsap.min.js', r => r.abort());
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
  const p = await openPage(b, { seen: true, viewport: { width: 390, height: 844 } }); await p.waitForTimeout(900); // รอฉากเปิดแบบสั้นจบ
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
  const open = await p.evaluate(() => document.getElementById('lb-mode-dialog').open);
  await p.click('#lb-mode-bot'); await p.waitForTimeout(300);
  const v = await p.evaluate(() => ({ leader: currentDeckConfig.leaderId, n: currentDeckConfig.mainDeck.length,
    saved: localStorage.getItem('my_card_game_deck') }));
  assert(v.leader === 'L03' && v.n === 20 && v.saved === before && open, JSON.stringify({ ...v, open }));
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

// ---------------- Lobby redesign: motion (ย้ายจากชุด v0.3 + ของใหม่) ----------------
const INTRO_PARTS = '.lb-line > span, .lb-lead, .lb-folder, #btn-lobby-pvp, #btn-lobby-bot';
const lobbyTweens = p => p.evaluate(() => gsap.globalTimeline.getChildren(true, true, false)
  .filter(t => (t.isActive() || t.repeat() === -1) && t.targets().some(e => e.closest && e.closest('#lobby-screen'))).length);

test('T1 loads gsap and LobbyMotion', async b => {
  const p = await openPage(b);
  assert(await p.evaluate(() => typeof gsap === 'object' && typeof LobbyMotion === 'object' && typeof LobbyMotion.start === 'function'), 'gsap/LobbyMotion missing');
  assert(p.errors.length === 0, 'page errors: ' + p.errors.join(' | '));
});
test('T2 stops when leaving lobby', async b => {
  const p = await openPage(b); await p.waitForTimeout(2200);
  await p.click('#btn-lobby-bot'); await p.click('#btn-start-ai-match'); await p.waitForTimeout(600);
  const s = await p.evaluate(() => LobbyMotion.isRunning());
  assert(s === false, 'still running'); const k = await lobbyTweens(p); assert(k === 0, 'active tweens left: ' + k);
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
  const p = await openPage(b); await p.waitForTimeout(2200);
  await p.click('#btn-lobby-bot'); await p.waitForTimeout(300);
  assert(await p.evaluate(() => LobbyMotion.isPaused()), 'not paused under modal');
  await p.click('#btn-cancel-ai-setup'); await p.waitForTimeout(650);
  assert(await p.evaluate(() => !LobbyMotion.isPaused() && LobbyMotion.isRunning()), 'not resumed');
});
test('T2 pauses under mode dialog', async b => {
  const p = await openPage(b, { seen: true }); await p.waitForTimeout(900);
  await p.click('#lb-play-deck'); await p.waitForTimeout(300);
  assert(await p.evaluate(() => LobbyMotion.isPaused()), 'not paused under dialog');
  await p.click('#lb-mode-close'); await p.waitForTimeout(400);
  assert(await p.evaluate(() => !LobbyMotion.isPaused()), 'not resumed after dialog');
});
test('T3 intro finishes by 2s', async b => {
  const p = await openPage(b); await p.waitForTimeout(2100);
  const o = await opacityAll(p, INTRO_PARTS);
  assert(o.every(x => x > .99), 'not all visible: ' + o);
});
test('T3 intro hides parts at start', async b => {
  const p = await openPage(b); await p.waitForTimeout(150);
  const y = await p.evaluate(() => [...document.querySelectorAll('.lb-line > span')].map(e => gsap.getProperty(e, 'yPercent')));
  assert(y.some(v => v > 20), 'headline lines already in place at 150ms: ' + y);
});
test('T3 skip on click', async b => {
  const p = await openPage(b); await p.waitForTimeout(300);
  await p.mouse.click(5, 300); await p.waitForTimeout(100);
  const o = await opacityAll(p, INTRO_PARTS);
  const y = await p.evaluate(() => [...document.querySelectorAll('.lb-line > span')].map(e => gsap.getProperty(e, 'yPercent')));
  assert(o.every(x => x > .99) && y.every(v => Math.abs(v) < 1), 'not skipped: ' + o + ' / ' + y);
});
test('T3 bot button single click during intro', async b => {
  const p = await openPage(b); await p.waitForTimeout(300);
  await p.click('#btn-lobby-bot', { force: true }); await p.waitForTimeout(300);
  assert(await p.evaluate(() => { const m = document.getElementById('ai-setup-modal'); return m && getComputedStyle(m).display !== 'none'; }), 'bot modal not opened');
});
test('T3 short on return', async b => {
  const p = await openPage(b, { seen: true }); await p.waitForTimeout(800);
  const o = await opacityAll(p, INTRO_PARTS);
  assert(o.every(x => x > .99), 'short intro not done by 0.8s: ' + o);
});
test('T3 reduced motion', async b => {
  const p = await openPage(b, { reduced: true }); await p.waitForTimeout(100);
  const o = await opacityAll(p, INTRO_PARTS + ', #lobby-screen h2');
  assert(o.every(x => x > .99), 'hidden under reduced motion: ' + o);
  assert(await p.evaluate(() => !LobbyMotion._particlesActive()), 'stars moving under reduced motion');
});
test('T3 intro smooth', async b => {
  const p = await openPage(b); const s = await frameStats(p, 1800);
  assert(s.p95 <= 17.5, 'intro p95 ' + s.p95.toFixed(1));
});
const ALLOWED = new Set(['x', 'y', 'xPercent', 'yPercent', 'rotation', 'rotationX', 'rotationY', 'rotate', 'scale', 'scaleX', 'scaleY', 'opacity', 'autoAlpha', 'transformOrigin', 'z', 'skewX', 'skewY', 'transformPerspective', 'visibility', 'display', 'clearProps', 'immediateRender', 'force3D', '--stage', '--stage-hi']);
test('T4 only transform/opacity', async b => {
  const p = await openPage(b); await p.waitForTimeout(600);
  await p.click('.lb-deck-btn[data-leader="L02"]'); await p.waitForTimeout(150);
  const keys = await p.evaluate(() => { const s = new Set(); gsap.globalTimeline.getChildren(true, true, false).forEach(t => Object.keys(t.vars).forEach(k => s.add(k))); return [...s]; });
  const meta = new Set(['duration', 'ease', 'repeat', 'yoyo', 'delay', 'repeatDelay', 'stagger', 'onComplete', 'onStart', 'onUpdate', 'overwrite', 'id', 'paused', 'keyframes', 'repeatRefresh', 'callbackScope', 'data', 'onRepeat', 'startAt', 'runBackwards', 'parent', 'lazy', 'onReverseComplete', 'inherit', 'defaults', 'smoothChildTiming', 'autoRemoveChildren', 'onInterrupt', 'yoyoEase']);
  const bad = keys.filter(k => !ALLOWED.has(k) && !meta.has(k));
  assert(bad.length === 0, 'non-compositor props: ' + bad);
});
test('T4 idle is smooth', async b => {
  const p = await openPage(b); await p.waitForTimeout(2600);
  const s = await frameStats(p, 3000); assert(s.p95 <= 17.5, 'idle p95 ' + s.p95.toFixed(1));
});
const scaleOf = (p, sel) => p.evaluate(sel => gsap.getProperty(document.querySelector(sel), 'scaleX'), sel);
test('T5 button press is fast', async b => {
  const p = await openPage(b, { seen: true }); await p.waitForTimeout(900);
  await p.locator('#btn-lobby-pvp').scrollIntoViewIfNeeded();
  const bb = await p.locator('#btn-lobby-pvp').boundingBox();
  await p.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2); await p.waitForTimeout(200);
  await p.mouse.down(); await p.waitForTimeout(80);
  const s = await scaleOf(p, '#btn-lobby-pvp'); await p.mouse.up();
  assert(s <= .97, 'scale after 80ms press = ' + s);
});
test('T5 buttons still work', async b => {
  const p = await openPage(b, { seen: true }); await p.waitForTimeout(900);
  await p.click('#btn-lobby-pvp');
  assert(await p.evaluate(() => getComputedStyle(document.getElementById('pvp-room-modal')).display !== 'none'), 'pvp modal not shown');
  await p.click('#btn-close-pvp-modal'); await p.waitForTimeout(200);
  await p.click('#nav-cards'); await p.waitForTimeout(300);
  assert(await p.evaluate(() => { const m = document.getElementById('zone-viewer-modal'); return m && getComputedStyle(m).display !== 'none'; }), 'card list not opened');
});
test('T5 touch has no tilt', async b => {
  const p = await openPage(b, { seen: true, touch: true }); await p.waitForTimeout(900);
  const card = p.locator('.lb-leaders .lb-card').nth(1); await card.scrollIntoViewIfNeeded();
  const bb = await card.boundingBox();
  await p.touchscreen.tap(bb.x + bb.width * .9, bb.y + bb.height / 2); await p.waitForTimeout(500);
  assert(await p.evaluate(() => document.querySelectorAll('.lb-leaders .lb-card')[1].style.getPropertyValue('--ry') === ''), 'touch tilted');
});
const particleCount = p => p.evaluate(() => LobbyMotion._particleCount());
test('T6 particle count desktop', async b => {
  const p = await openPage(b); await p.waitForTimeout(2600);
  const n = await particleCount(p); assert(n > 0 && n <= 30, 'count ' + n);
});
test('T6 particle count small screen', async b => {
  const p = await openPage(b, { viewport: { width: 600, height: 800 } }); await p.waitForTimeout(2600);
  const n = await particleCount(p); assert(n > 0 && n <= 15, 'count ' + n);
});
test('T6 canvas covers hero only', async b => {
  const p = await openPage(b); await p.waitForTimeout(800);
  await p.setViewportSize({ width: 1000, height: 700 }); await p.waitForTimeout(400);
  const v = await p.evaluate(() => { const c = document.getElementById('lm-particles'), h = document.getElementById('lb-hero');
    return { inHero: c.parentElement === h, w: c.width, want: Math.round(h.clientWidth * Math.min(devicePixelRatio, 2)) }; });
  assert(v.inHero && Math.abs(v.w - v.want) <= 1, JSON.stringify(v));
});
test('T6 particles stop in game', async b => {
  const p = await openPage(b); await p.waitForTimeout(2600);
  await p.click('#btn-lobby-bot'); await p.click('#btn-start-ai-match'); await p.waitForTimeout(500);
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
    await p.waitForTimeout(i === 0 ? 2200 : 900);
    await p.click('#btn-lobby-bot'); await p.click('#btn-start-ai-match'); await p.waitForTimeout(400);
    const n = await p.evaluate(() => gsap.globalTimeline.getChildren(true, true, true).filter(t => t.repeat() === -1).length);
    assert(n === 0, `round ${i}: ${n} loops alive in game`);
    await p.evaluate(() => returnToLobbyScreen()); await p.waitForTimeout(300);
    assert(await p.evaluate(() => LobbyMotion.isRunning()), `round ${i}: not restarted in lobby`);
  }
  assert(p.errors.length === 0, 'errors: ' + p.errors.join(' | '));
});
test('F1 no flash on return to lobby', async b => {
  const p = await openPage(b); await p.waitForTimeout(2200);
  await p.click('#btn-lobby-bot'); await p.click('#btn-start-ai-match'); await p.waitForTimeout(400);
  const o = await p.evaluate(() => new Promise(r => { returnToLobbyScreen(); requestAnimationFrame(() => r(+getComputedStyle(document.querySelector('.lb-folder-front')).opacity)); }));
  assert(o < .5, 'lobby painted fully before intro (opacity ' + o + ')');
});
test('F4 particles keep position across modal', async b => {
  const p = await openPage(b); await p.waitForTimeout(2300);
  const a = await p.evaluate(() => LobbyMotion._particlePos());
  await p.click('#btn-lobby-bot'); await p.waitForTimeout(300); await p.click('#btn-cancel-ai-setup'); await p.waitForTimeout(250);
  const c = await p.evaluate(() => LobbyMotion._particlePos());
  assert(Math.abs(a.x - c.x) < 40, `particle jumped ${a.x.toFixed(0)} -> ${c.x.toFixed(0)}`);
});
test('M1 sections reveal once on scroll', async b => {
  const p = await openPage(b, { seen: true }); await p.waitForTimeout(800);
  const before = await opacityAll(p, '#lb-how h2');
  await p.locator('#lb-how').scrollIntoViewIfNeeded(); await p.waitForTimeout(1000);
  const o = await opacityAll(p, '#lb-how h2, #lb-how .lb-seg');
  assert(before[0] < .5 && o.every(x => x > .99), 'before ' + before + ' after ' + o);
});
test('M2 content visible without gsap', async b => {
  const p = await openPage(b, { seen: true, blockGsap: true }); await p.waitForTimeout(600);
  const o = await opacityAll(p, '#lobby-screen h1, #lobby-screen h2, #btn-lobby-pvp');
  const vis = await p.evaluate(() => getComputedStyle(document.getElementById('lobby-screen')).visibility);
  assert(o.every(x => x > .99) && vis === 'visible', JSON.stringify({ o, vis }));
});
test('M3 deck kept after return', async b => {
  const p = await openPage(b, { seen: true }); await p.waitForTimeout(600);
  await p.click('.lb-deck-btn[data-leader="L02"]'); await p.click('#btn-lobby-bot'); await p.click('#btn-start-ai-match'); await p.waitForTimeout(500);
  await p.evaluate(() => returnToLobbyScreen()); await p.waitForTimeout(800);
  assert(await p.evaluate(() => LobbyView.selectedDeck() === 'L02' && LobbyMotion.isRunning()), 'deck or motion lost');
});
test('M4 deck switch animates new cards in', async b => {
  const p = await openPage(b, { seen: true }); await p.waitForTimeout(600);
  await p.click('.lb-deck-btn[data-leader="L03"]'); await p.waitForTimeout(60);
  const mid = await p.evaluate(() => gsap.isTweening(document.querySelector('.lb-stage-cards .lb-card')));
  await p.waitForTimeout(1200);
  const o = await opacityAll(p, '.lb-stage-cards .lb-card');
  assert(mid && o.every(x => x > .99), JSON.stringify({ mid, min: Math.min(...o) }));
});

// ---------------- Final review fixes (0.7) ----------------
test('R1 nothing spills past the screen edge at 320 and 390', async b => {
  for (const width of [320, 390]) {
    const p = await openPage(b, { seen: true, viewport: { width, height: 800 } }); await p.waitForTimeout(900);
    const bad = await p.evaluate(() => [...document.querySelectorAll('#lobby-screen *')]
      .filter(e => !e.closest('.lb-deck-list, .lb-stage-cards, .lb-tab, #lm-particles') && e.getClientRects().length)
      .filter(e => e.getBoundingClientRect().right > innerWidth + 1).map(e => (e.id || e.className || e.tagName)).slice(0, 5));
    assert(bad.length === 0, `at ${width}: ` + JSON.stringify(bad));
  }
});
test('R2 pasted code with spaces joins', async b => {
  const p = await openPage(b, { seen: true });
  await p.evaluate(() => { window.__joined = null; window.joinPvpRoomAsGuest = c => { window.__joined = c; }; });
  await p.focus('#lb-join-code'); await p.keyboard.insertText(' 4829 '); await p.press('#lb-join-code', 'Enter');
  const v = await p.evaluate(() => ({ joined: window.__joined, value: document.getElementById('lb-join-code').value }));
  assert(v.joined === '4829', JSON.stringify(v));
});
test('R3 focus ring visible on gold folder and dialog', async b => {
  const p = await openPage(b, { seen: true }); await p.waitForTimeout(900);
  // ใช้คีย์บอร์ดล้วน เพื่อให้ :focus-visible ทำงานเหมือนผู้ใช้จริงที่กด Tab
  const ring = () => p.evaluate(() => { const s = getComputedStyle(document.activeElement); return s.outlineStyle + ' ' + s.outlineColor; });
  await p.focus('#btn-lobby-bot'); const a = await ring();
  await p.focus('#lb-play-deck'); await p.keyboard.press('Enter'); await p.waitForTimeout(100); const c = await ring();
  const dark = 'solid rgb(18, 20, 42)';
  assert(a === dark && c === dark, JSON.stringify({ a, c }));
});
test('R4 cancelling the mode dialog keeps the previous deck', async b => {
  const p = await openPage(b, { seen: true });
  const before = await p.evaluate(() => JSON.stringify(currentDeckConfig));
  await p.click('.lb-deck-btn[data-leader="L03"]'); await p.click('#lb-play-deck'); await p.click('#lb-mode-close');
  const afterCancel = await p.evaluate(() => JSON.stringify(currentDeckConfig));
  await p.click('#lb-play-deck'); await p.keyboard.press('Escape'); await p.waitForTimeout(100);
  const afterEsc = await p.evaluate(() => JSON.stringify(currentDeckConfig));
  await p.click('#lb-play-deck'); await p.click('#lb-mode-bot'); await p.waitForTimeout(200);
  const chosen = await p.evaluate(() => currentDeckConfig.leaderId);
  assert(afterCancel === before && afterEsc === before && chosen === 'L03', JSON.stringify({ same1: afterCancel === before, same2: afterEsc === before, chosen }));
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
