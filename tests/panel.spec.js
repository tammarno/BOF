// ชุดทดสอบ 0.6: บั๊กล็อบบี้ว่าง + หน้าต่างจัดเด็ค/คลังการ์ด/Mulligan + ปุ่ม + เมนู (node tests/panel.spec.js [คำกรอง])
const { chromium } = require('playwright');
const path = require('path');
const URL = 'file://' + path.resolve(__dirname, '..') + '/index.html';
const tests = []; const test = (n, f) => tests.push({ n, f });
const assert = (c, m) => { if (!c) throw new Error(m); };

async function openPage(b, opts = {}) {
  const ctx = await b.newContext({ viewport: { width: 1316, height: 620 }, deviceScaleFactor: 1.25, reducedMotion: opts.reduced ? 'reduce' : 'no-preference' });
  if (!opts.fresh) await ctx.addInitScript(() => { try { sessionStorage.setItem('lm-seen', '1'); } catch (e) {} });
  const p = await ctx.newPage(); p.setDefaultTimeout(8000);
  p.errors = []; p.on('pageerror', e => p.errors.push(e.message));
  p.dialogs = 0; p.on('dialog', d => { p.dialogs++; d.dismiss(); });
  await p.goto(URL); await p.waitForTimeout(opts.wait != null ? opts.wait : 1500);
  return p;
}
const shown = (p, sel) => p.evaluate(s => { const e = document.querySelector(s); return !!e && getComputedStyle(e).display !== 'none'; }, sel);
const opacity = (p, sel) => p.evaluate(s => +getComputedStyle(document.querySelector(s)).opacity, sel);
// ความทึบต่ำสุดที่เห็นในทุกเฟรมช่วง ms แรก (วัดในหน้าเว็บ ไม่พึ่งจังหวะของ Node)
const minOpacity = (p, sel, ms) => p.evaluate(([s, ms]) => new Promise(res => { let m = 1; const t0 = performance.now(); const f = () => { const e = document.querySelector(s); if (e) m = Math.min(m, +getComputedStyle(e).opacity); if (performance.now() - t0 < ms) requestAnimationFrame(f); else res(m); }; f(); }), [sel, ms]);
// บันทึกในหน้าเว็บทุกเฟรม: ระยะเลื่อนสูงสุดของกล่อง + เห็นม่านจางไหม (หน้าต่างการ์ดเยอะไม่ใช้ opacity ของกล่อง)
const recordOpen = (p, sel) => p.evaluate(s => { window._rec = { y: 0, curtain: false }; const t0 = performance.now(); const f = () => { const e = document.querySelector(s); if (e) { window._rec.y = Math.max(window._rec.y, Math.abs(gsap.getProperty(e, 'y'))); if (e.querySelector(':scope > .pm-curtain')) window._rec.curtain = true; } if (performance.now() - t0 < 1500) requestAnimationFrame(f); }; requestAnimationFrame(f); }, sel);
const scale = (p, sel) => p.evaluate(s => gsap.getProperty(document.querySelector(s), 'scale'), sel);
// ล็อบบี้ "มองเห็นได้" = ชื่อเกม เมนู ปุ่ม กล่องเมนู ทึบ และไม่มีแถบเลื่อนแนวนอน
const lobbyOk = p => p.evaluate(() => {
  const op = s => +getComputedStyle(document.querySelector(s)).opacity;
  const vis = s => getComputedStyle(document.querySelector(s)).visibility;
  return { title: op('.lb-logo'), nav: vis('.lb-menu'), btn: op('#lb-play'), card: op('#lb-leader img'), wide: document.documentElement.scrollWidth > innerWidth + 1 };
});
const assertLobby = (v, when) => {
  assert(v.title > .99 && v.btn > .99 && v.card > .99 && v.nav === 'visible', `lobby blank ${when}: ${JSON.stringify(v)}`);
  assert(!v.wide, `horizontal scroll ${when}`);
};

// ---------- บั๊ก 0.6: ปิดหน้าต่างแล้วล็อบบี้ว่าง ----------
test('B1 lobby visible after closing PvP window', async b => {
  const p = await openPage(b);
  await p.click('#lb-play'); await p.click('#btn-lobby-pvp'); await p.waitForTimeout(500);
  await p.click('#btn-close-pvp-modal');
  for (const t of [300, 600, 1500]) { await p.waitForTimeout(t === 300 ? 300 : t - 300); assertLobby(await lobbyOk(p), t + 'ms after close'); }
});
test('B2 lobby visible after Deck Builder save', async b => {
  const p = await openPage(b);
  await p.click('#nav-deck'); await p.waitForTimeout(700);
  await p.evaluate(() => { currentDeckConfig.mainDeck = [...DEFAULT_DECK_LIST]; renderDeckBuilder(); });
  await p.click('#btn-save-start'); await p.waitForTimeout(700);
  assert(!(await shown(p, '#deck-builder-modal')), 'deck builder did not close');
  assertLobby(await lobbyOk(p), 'after save');
});
test('B3 lobby visible after Card List close', async b => {
  const p = await openPage(b);
  await p.click('#nav-cards'); await p.waitForTimeout(700);
  await p.click('#btn-close-zone-viewer'); await p.waitForTimeout(700);
  assert(!(await shown(p, '#zone-viewer-modal')), 'card list did not close');
  assertLobby(await lobbyOk(p), 'after card list');
});
test('B4 window opened during intro then closed', async b => {
  const p = await openPage(b, { fresh: true, wait: 300 });
  await p.click('#nav-cards', { force: true }); await p.waitForTimeout(800); // กล่องเมนูกดได้ระหว่างฉากเปิด (เมนูบนยังล่องหน)
  await p.click('#btn-close-zone-viewer'); await p.waitForTimeout(800);
  assertLobby(await lobbyOk(p), 'after intro-time open/close');
});
test('B5 idle loops resume after close', async b => {
  const p = await openPage(b, { wait: 2600 });
  await p.click('#lb-play'); await p.click('#btn-lobby-pvp'); await p.waitForTimeout(500);
  await p.click('#btn-close-pvp-modal'); await p.waitForTimeout(500);
  const r1 = await p.evaluate(() => LobbyMotion._particlePos().y); await p.waitForTimeout(600);
  const r2 = await p.evaluate(() => LobbyMotion._particlePos().y);
  assert(r1 !== r2 && await p.evaluate(() => LobbyMotion._particlesActive()), 'hero stars stopped after close');
});

// ---------- หน้าต่าง ----------
test('P1 deck builder opens with animation', async b => {
  const p = await openPage(b); await recordOpen(p, '.deck-builder-box');
  await p.click('#nav-deck'); await p.waitForTimeout(900);
  const r = await p.evaluate(() => window._rec);
  assert(r.y > 5 && r.curtain, 'no open animation ' + JSON.stringify(r));
  assert(await p.evaluate(() => !document.querySelector('.pm-curtain')), 'curtain left behind');
  assert(await opacity(p, '.deck-builder-box') > .99, 'not settled');
  const tiles = await p.evaluate(() => [...document.querySelectorAll('#main-pool-list > .pool-item')].slice(0, 20).every(e => +getComputedStyle(e).opacity > .99));
  assert(tiles, 'card tiles left transparent');
});
test('P2 card list opens and closes with animation', async b => {
  const p = await openPage(b); await p.click('#nav-cards'); await p.waitForTimeout(600); // สร้างหน้าต่างครั้งแรก
  await p.click('#btn-close-zone-viewer'); await p.waitForTimeout(500);
  await recordOpen(p, '#zone-viewer-modal .modal-box'); await p.click('#nav-cards'); await p.waitForTimeout(900);
  const r = await p.evaluate(() => window._rec); assert(r.y > 5 && r.curtain, 'no open animation ' + JSON.stringify(r));
  await p.click('#btn-close-zone-viewer'); await p.waitForTimeout(60);
  assert(await shown(p, '#zone-viewer-modal'), 'closed instantly');
  await p.waitForTimeout(400); assert(!(await shown(p, '#zone-viewer-modal')), 'did not close');
  await p.click('#nav-cards'); await p.waitForTimeout(600);
  assert(await opacity(p, '#zone-viewer-modal .modal-box') > .99, 'reopened box transparent');
});
test('P3 double-click close closes once, reopen stays open', async b => {
  const p = await openPage(b); await p.click('#nav-cards'); await p.waitForTimeout(600);
  await p.dblclick('#btn-close-zone-viewer'); await p.waitForTimeout(80);
  await p.waitForTimeout(400); assert(!(await shown(p, '#zone-viewer-modal')), 'did not close');
  await p.click('#nav-cards'); await p.waitForTimeout(700);
  assert(await shown(p, '#zone-viewer-modal'), 'reopened window closed itself');
});
test('P4 save with incomplete deck: no animation, stays open', async b => {
  const p = await openPage(b); await p.click('#nav-deck'); await p.waitForTimeout(600);
  await p.click('#btn-reset-deck'); await p.waitForTimeout(100);
  assert(await p.evaluate(() => document.getElementById('btn-save-start').disabled), 'save not disabled');
  assert(await opacity(p, '.deck-builder-box') > .99, 'box faded on reset');
});
test('P5 mulligan cards dealt in', async b => {
  const p = await openPage(b); await p.click('#lb-play'); await p.click('#btn-lobby-bot'); await p.waitForTimeout(450);
  await p.click('#btn-start-ai-match'); await p.waitForTimeout(120);
  const mid = await p.evaluate(() => [...document.querySelectorAll('#mulligan-card-list > .card')].map(e => +getComputedStyle(e).opacity));
  assert(mid.some(o => o < .99), 'cards not animating');
  await p.waitForTimeout(1200);
  const end = await p.evaluate(() => [...document.querySelectorAll('#mulligan-card-list > .card')].map(e => ({ o: +getComputedStyle(e).opacity, tr: e.style.transition })));
  assert(end.every(e => e.o > .99 && e.tr === ''), 'cards stuck: ' + JSON.stringify(end));
});

// ---------- ปุ่ม / เมนู / การ์ด ----------
test('S1 old buttons themed', async b => {
  const p = await openPage(b); await p.click('#nav-deck'); await p.waitForTimeout(500);
  const v = await p.evaluate(() => ['btn-save-start', 'btn-default-deck', 'btn-reset-deck'].map(id => document.getElementById(id).className));
  assert(v[0].includes('pm-btn-primary') && v[1].includes('pm-btn-ice') && v[2].includes('pm-btn-ghost'), v.join('|'));
  await p.click('#btn-save-start').catch(() => {}); await p.waitForTimeout(500);
  await p.click('#nav-cards'); await p.waitForTimeout(500);
  assert(await p.evaluate(() => document.getElementById('btn-close-zone-viewer').classList.contains('pm-btn-danger')), 'close not themed');
});
test('S2 deck builder button hover + press', async b => {
  const p = await openPage(b); await p.click('#nav-deck'); await p.waitForTimeout(600);
  await p.hover('#btn-default-deck'); await p.waitForTimeout(250);
  assert(await scale(p, '#btn-default-deck') > 1.02, 'no hover lift');
  await p.mouse.down(); await p.waitForTimeout(90);
  assert(await scale(p, '#btn-default-deck') < 1, 'no press'); await p.mouse.up();
});
test('S3 nav link press + underline', async b => {
  const p = await openPage(b); await p.hover('#nav-deck'); await p.waitForTimeout(300);
  const ul = await p.evaluate(() => getComputedStyle(document.getElementById('nav-deck'), '::after').transform);
  assert(ul !== 'none' && !/matrix\(0,/.test(ul), 'underline not shown: ' + ul);
  await p.mouse.down(); await p.waitForTimeout(80);
  assert(await scale(p, '#nav-deck') < 1, 'no press'); await p.mouse.up();
});
test('S4 deck tile add / remove / full feedback', async b => {
  const p = await openPage(b); await p.click('#nav-deck'); await p.waitForTimeout(700);
  await p.click('#btn-reset-deck'); await p.waitForTimeout(100);
  await p.click('#main-pool-list > .pool-item:nth-child(1) .card'); await p.waitForTimeout(30);
  assert(await p.evaluate(() => !!document.querySelector('#main-pool-list > .pool-item:nth-child(1) .pm-flash-add')), 'no add flash');
  assert(await scale(p, '#main-pool-list > .pool-item:nth-child(1)') > 1.01, 'no add pop');
  await p.waitForTimeout(600);
  await p.click('#main-pool-list > .pool-item:nth-child(1) .card'); await p.waitForTimeout(600); // 2/2
  await p.click('#main-pool-list > .pool-item:nth-child(1) .card'); await p.waitForTimeout(30);  // เอาออก
  assert(await p.evaluate(() => !!document.querySelector('#main-pool-list > .pool-item:nth-child(1) .pm-flash-remove')), 'no remove flash');
  await p.waitForTimeout(700);
  assert(await p.evaluate(() => !document.querySelector('.pm-flash')), 'flash not cleaned up');
  await p.evaluate(() => { currentDeckConfig.mainDeck = [...DEFAULT_DECK_LIST]; renderDeckBuilder(); });
  const free = await p.evaluate(() => CARD_DATABASE.filter(c => c.type !== 'Leader').findIndex(c => !currentDeckConfig.mainDeck.includes(c.id)));
  await p.click(`#main-pool-list > .pool-item:nth-child(${free + 1}) .card`); await p.waitForTimeout(30);
  assert(await p.evaluate(i => !!document.querySelector(`#main-pool-list > .pool-item:nth-child(${i}) .pm-flash-deny`), free + 1), 'no deny shake when full');
});
test('S5 save button breathes only when deck complete', async b => {
  const p = await openPage(b); await p.click('#nav-deck'); await p.waitForTimeout(500);
  await p.evaluate(() => { currentDeckConfig.mainDeck = [...DEFAULT_DECK_LIST]; renderDeckBuilder(); }); await p.waitForTimeout(50);
  assert(await p.evaluate(() => document.getElementById('btn-save-start').classList.contains('lm-breathe')), 'not breathing at 20/20');
  await p.click('#btn-reset-deck'); await p.waitForTimeout(50);
  assert(!(await p.evaluate(() => document.getElementById('btn-save-start').classList.contains('lm-breathe'))), 'breathing when incomplete');
});
test('S6 reduced motion: themed, opens instantly, no errors', async b => {
  const p = await openPage(b, { reduced: true }); await p.click('#nav-deck'); await p.waitForTimeout(40);
  assert(await opacity(p, '.deck-builder-box') > .99, 'animated under reduced motion');
  assert(await p.evaluate(() => document.getElementById('btn-save-start').classList.contains('pm-btn-primary')), 'not themed');
  assert(!p.errors.length, p.errors.join('|'));
});
test('S7 deck builder open is smooth', async b => {
  const p = await openPage(b); await p.click('#nav-deck');
  const p95 = await p.evaluate(() => new Promise(res => { const d = []; let last = performance.now(); const t0 = last; const f = t => { d.push(t - last); last = t; if (t - t0 < 700) requestAnimationFrame(f); else { d.splice(0, 2); d.sort((a, b) => a - b); res(d[Math.floor(d.length * .95)]); } }; requestAnimationFrame(f); }));
  assert(p95 < 40, 'p95 frame ' + p95.toFixed(1) + 'ms');
  assert(!p.errors.length, p.errors.join('|'));
});

(async () => {
  const f = process.argv[2] || ''; const b = await chromium.launch({ args: ['--disable-dev-shm-usage'] }); let ok = 0, bad = 0;
  for (const t of tests) {
    if (f && !t.n.includes(f)) continue;
    try { await t.f(b); ok++; console.log('PASS', t.n); } catch (e) { bad++; console.log('FAIL', t.n, '-', e.message.split('\n')[0]); }
    for (const c of b.contexts()) await c.close();
  }
  await b.close(); console.log(`${ok}/${ok + bad} passed`); process.exit(bad ? 1 : 0);
})();
