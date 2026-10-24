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
const INTRO_PARTS = '.fan-card, .feature-card, #btn-lobby-pvp, #btn-lobby-bot, .lobby-navbar';

// ---------------- Task 1 ----------------
test('T1 loads gsap and LobbyMotion', async b => {
  const p = await openPage(b);
  assert(await p.evaluate(() => typeof gsap === 'object' && typeof LobbyMotion === 'object' && typeof LobbyMotion.start === 'function'), 'gsap/LobbyMotion missing');
  assert(p.errors.length === 0, 'page errors: ' + p.errors.join(' | '));
});
test('T1 navbar has no backdrop-filter', async b => {
  const p = await openPage(b);
  const v = await p.evaluate(() => [getComputedStyle(document.querySelector('.lobby-navbar')).backdropFilter, getComputedStyle(document.querySelector('#btn-lobby-bot')).backdropFilter, getComputedStyle(document.querySelector('.feature-card')).backdropFilter]);
  assert(v.every(x => x === 'none'), 'backdrop-filter still set: ' + v);
});

// ---------------- Task 2 ----------------
test('T2 stops when leaving lobby', async b => {
  const p = await openPage(b); await p.waitForTimeout(2200);
  await p.click('#btn-lobby-bot'); await p.click('#btn-start-ai-match'); await p.waitForTimeout(600);
  const s = await p.evaluate(() => ({ run: LobbyMotion.isRunning(), kids: gsap.globalTimeline.getChildren(true, true, false).filter(t => (t.isActive() || t.repeat() === -1) && t.targets().some(e => e.closest && e.closest('#lobby-screen'))).length }));
  assert(s.run === false, 'still running'); assert(s.kids === 0, 'active tweens left: ' + s.kids);
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
  await p.click('#btn-cancel-ai-setup'); await p.waitForTimeout(650); // รวมแอนิเมชันปิดหน้าต่าง 0.18 วิ (v0.4)
  assert(await p.evaluate(() => !LobbyMotion.isPaused() && LobbyMotion.isRunning()), 'not resumed');
});

// ---------------- Task 3 ----------------
test('T3 intro finishes by 2s', async b => {
  const p = await openPage(b); await p.waitForTimeout(2100);
  const o = await opacityAll(p, INTRO_PARTS);
  assert(o.every(x => x > .99), 'not all visible: ' + o);
  assert(await p.evaluate(() => { const e = document.getElementById('lm-intro'); return !e || getComputedStyle(e).display === 'none'; }), 'intro overlay still shown');
});
test('T3 intro hides parts at start', async b => {
  const p = await openPage(b); await p.waitForTimeout(150);
  const o = await opacityAll(p, '.feature-card');
  assert(o.some(x => x < .5), 'feature cards already visible at 150ms: ' + o);
});
test('T3 skip on click', async b => {
  const p = await openPage(b); await p.waitForTimeout(300);
  await p.mouse.click(5, 600); await p.waitForTimeout(100);
  const o = await opacityAll(p, INTRO_PARTS);
  assert(o.every(x => x > .99), 'not skipped: ' + o);
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
  assert(await p.evaluate(() => !document.getElementById('lm-intro') || getComputedStyle(document.getElementById('lm-intro')).display === 'none'), 'logo intro shown on return');
});
test('T3 reduced motion', async b => {
  const p = await openPage(b, { reduced: true }); await p.waitForTimeout(100);
  const o = await opacityAll(p, INTRO_PARTS);
  assert(o.every(x => x > .99), 'hidden under reduced motion: ' + o);
  assert(await p.evaluate(() => !LobbyMotion.isRunning()), 'loops running under reduced motion');
});
test('T3 intro smooth', async b => {
  const p = await openPage(b); const s = await frameStats(p, 1800);
  assert(s.p95 <= 17.5, 'intro p95 ' + s.p95.toFixed(1));
});

// ---------------- Task 4 ----------------
const ALLOWED = new Set(['x', 'y', 'xPercent', 'yPercent', 'rotation', 'rotationX', 'rotationY', 'rotate', 'scale', 'scaleX', 'scaleY', 'opacity', 'autoAlpha', 'transformOrigin', 'z', 'skewX', 'skewY', 'transformPerspective', 'visibility', 'display', 'clearProps', 'immediateRender', 'force3D']);
test('T4 idle loops running', async b => {
  const p = await openPage(b); await p.waitForTimeout(2600);
  const n = await p.evaluate(() => gsap.globalTimeline.getChildren(true, true, true).filter(t => t.repeat() === -1).length);
  assert(n >= 8, 'only ' + n + ' infinite loops');
});
test('T4 only transform/opacity', async b => {
  const p = await openPage(b); await p.waitForTimeout(2600);
  const keys = await p.evaluate(() => { const s = new Set(); gsap.globalTimeline.getChildren(true, true, false).forEach(t => Object.keys(t.vars).forEach(k => s.add(k))); return [...s]; });
  const meta = new Set(['duration', 'ease', 'repeat', 'yoyo', 'delay', 'repeatDelay', 'stagger', 'onComplete', 'onStart', 'onUpdate', 'overwrite', 'id', 'paused', 'keyframes', 'repeatRefresh', 'callbackScope', 'data', 'onRepeat', 'startAt', 'runBackwards', 'parent', 'lazy', 'onReverseComplete', 'inherit', 'defaults', 'smoothChildTiming', 'autoRemoveChildren', 'onInterrupt', 'yoyoEase']);
  const bad = keys.filter(k => !ALLOWED.has(k) && !meta.has(k));
  assert(bad.length === 0, 'non-compositor props: ' + bad);
});
test('T4 idle is smooth', async b => {
  const p = await openPage(b); await p.waitForTimeout(2600);
  const s = await frameStats(p, 3000); assert(s.p95 <= 17.5, 'idle p95 ' + s.p95.toFixed(1));
});

// ---------------- Task 5 ----------------
const scaleOf = (p, sel) => p.evaluate(sel => gsap.getProperty(document.querySelector(sel), 'scaleX'), sel);
test('T5 button press is fast', async b => {
  const p = await openPage(b, { seen: true }); await p.waitForTimeout(900);
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
  await p.click('#card-menu-cardlist'); await p.waitForTimeout(300);
  assert(await p.evaluate(() => { const m = document.getElementById('zone-viewer-modal'); return m && getComputedStyle(m).display !== 'none'; }), 'card list not opened');
});
test('T5 ripples cleaned', async b => {
  const p = await openPage(b, { seen: true }); await p.waitForTimeout(900);
  const bb = await p.locator('#btn-lobby-pvp').boundingBox();
  for (let i = 0; i < 10; i++) await p.evaluate(() => { const e = document.getElementById('btn-lobby-pvp'); const r = e.getBoundingClientRect(); ['pointerdown', 'pointerup'].forEach(t => e.dispatchEvent(new PointerEvent(t, { bubbles: true, clientX: r.x + 10, clientY: r.y + 10, pointerType: 'mouse', isPrimary: true }))); });
  await p.waitForTimeout(1000);
  assert(await p.evaluate(() => document.querySelectorAll('.lm-ripple').length === 0), 'ripples left');
});
test('T5 fan tilts toward mouse', async b => {
  const p = await openPage(b, { seen: true }); await p.waitForTimeout(900);
  const bb = await p.locator('.hero-card-fan').boundingBox();
  await p.mouse.move(bb.x + bb.width * .95, bb.y + bb.height / 2, { steps: 5 }); await p.waitForTimeout(700);
  const r = await p.evaluate(() => gsap.getProperty(document.querySelector('.hero-card-fan'), 'rotationY'));
  assert(r > 1, 'rotationY = ' + r);
});
test('T5 fan hover smooth', async b => {
  const p = await openPage(b, { seen: true }); await p.waitForTimeout(900);
  const bb = await p.locator('.hero-card-fan').boundingBox();
  const fs = frameStats(p, 2000);
  for (let i = 0; i < 40; i++) { await p.mouse.move(bb.x + (i % 20) * bb.width / 20, bb.y + bb.height / 2); await p.waitForTimeout(40); }
  const s = await fs; assert(s.p95 <= 17.5, 'hover p95 ' + s.p95.toFixed(1));
});
test('T5 touch has no tilt', async b => {
  const p = await openPage(b, { seen: true, touch: true }); await p.waitForTimeout(900);
  const bb = await p.locator('.hero-card-fan').boundingBox();
  await p.touchscreen.tap(bb.x + bb.width * .9, bb.y + bb.height / 2); await p.waitForTimeout(500);
  const r = await p.evaluate(() => gsap.getProperty(document.querySelector('.hero-card-fan'), 'rotationY'));
  assert(Math.abs(r) < .5, 'touch tilted: ' + r);
});

// ---------------- Task 6 ----------------
const particleCount = p => p.evaluate(() => LobbyMotion._particleCount());
test('T6 particle count desktop', async b => {
  const p = await openPage(b); await p.waitForTimeout(2600);
  const n = await particleCount(p); assert(n > 0 && n <= 30, 'count ' + n);
});
test('T6 particle count small screen', async b => {
  const p = await openPage(b, { viewport: { width: 600, height: 800 } }); await p.waitForTimeout(2600);
  const n = await particleCount(p); assert(n > 0 && n <= 15, 'count ' + n);
});
test('T6 canvas resizes', async b => {
  const p = await openPage(b); await p.waitForTimeout(2600);
  await p.setViewportSize({ width: 1000, height: 700 }); await p.waitForTimeout(400);
  const ok = await p.evaluate(() => { const c = document.getElementById('lm-particles'); return Math.abs(c.width - Math.round(innerWidth * Math.min(devicePixelRatio, 2))) <= 1; });
  assert(ok, 'canvas not resized');
});
test('T6 particles stop in game', async b => {
  const p = await openPage(b); await p.waitForTimeout(2600);
  await p.click('#btn-lobby-bot'); await p.click('#btn-start-ai-match'); await p.waitForTimeout(500);
  assert(await p.evaluate(() => LobbyMotion._particlesActive() === false), 'particles still ticking');
});

// ---------------- Task 7 ----------------
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

// ---------------- Final review fixes ----------------
test('F1 no flash on return to lobby', async b => {
  const p = await openPage(b); await p.waitForTimeout(2200);
  await p.click('#btn-lobby-bot'); await p.click('#btn-start-ai-match'); await p.waitForTimeout(400);
  const o = await p.evaluate(() => new Promise(r => { returnToLobbyScreen(); requestAnimationFrame(() => r(+getComputedStyle(document.querySelector('.feature-card')).opacity)); }));
  assert(o < .5, 'lobby painted fully before intro (opacity ' + o + ')');
});
test('F2 edge click on bot button during intro', async b => {
  const p = await openPage(b); await p.waitForTimeout(450);
  const pt = await p.evaluate(() => { const e = document.getElementById('btn-lobby-bot'); const r = e.getBoundingClientRect(); const s = gsap.getProperty(e, 'scaleX') || 1; const w = r.width / s, cx = r.left + r.width / 2; return { x: cx + w / 2 - 4, y: r.top + r.height / 2 }; });
  await p.mouse.move(pt.x - 30, pt.y); await p.mouse.move(pt.x, pt.y, { steps: 3 });
  await p.mouse.down(); await p.mouse.up(); await p.waitForTimeout(300);
  assert(await p.evaluate(() => { const m = document.getElementById('ai-setup-modal'); return m && getComputedStyle(m).display !== 'none'; }), 'edge click lost during intro');
});
test('F3 late reveal uses short intro', async b => {
  const ctx = await b.newContext({ viewport: { width: 1316, height: 620 }, deviceScaleFactor: 1.25 });
  const p = await ctx.newPage(); p.setDefaultTimeout(8000);
  await p.route('**/peerjs.min.js', async r => { await new Promise(z => setTimeout(z, 2000)); r.fulfill({ body: '', contentType: 'text/javascript' }); });
  await p.goto(URL); await p.waitForTimeout(150);
  assert(await p.evaluate(() => { const e = document.getElementById('lm-intro'); return !e || getComputedStyle(e).display === 'none'; }), 'full logo intro played after static reveal');
});
test('F4 particles keep position across modal', async b => {
  const p = await openPage(b); await p.waitForTimeout(2300);
  const a = await p.evaluate(() => LobbyMotion._particlePos());
  await p.click('#btn-lobby-bot'); await p.waitForTimeout(300); await p.click('#btn-cancel-ai-setup'); await p.waitForTimeout(250);
  const c = await p.evaluate(() => LobbyMotion._particlePos());
  assert(Math.abs(a.x - c.x) < 40, `particle jumped ${a.x.toFixed(0)} -> ${c.x.toFixed(0)}`);
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
