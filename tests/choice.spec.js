// ชุดทดสอบหน้าต่างเลือก (ยืนยันการ์ด / ยอมแพ้ / ชนะ-แพ้) — node tests/choice.spec.js [คำกรอง]
const { chromium } = require('playwright');
const path = require('path');
const URL = 'file://' + path.resolve(__dirname, '..') + '/index.html';
const tests = []; const test = (n, f) => tests.push({ n, f });
const assert = (c, m) => { if (!c) throw new Error(m); };
async function openPage(b, opts = {}) {
  const ctx = await b.newContext({ viewport: { width: 1316, height: 620 }, deviceScaleFactor: 1.25, reducedMotion: opts.reduced ? 'reduce' : 'no-preference' });
  await ctx.addInitScript(() => { try { sessionStorage.setItem('lm-seen', '1'); } catch (e) {} });
  const p = await ctx.newPage(); p.setDefaultTimeout(8000);
  p.errors = []; p.on('pageerror', e => p.errors.push(e.message));
  await p.goto(URL); await p.waitForTimeout(800);
  await p.click('#lb-play'); await p.click('#btn-lobby-bot'); await p.waitForTimeout(400); await p.click('#btn-start-ai-match');
  await p.waitForTimeout(1300); const m = await p.$('#btn-confirm-mulligan'); if (m && await m.isVisible()) await m.click();
  await p.waitForTimeout(1200);
  return p;
}
const M = '#custom-choice-modal';
const shown = p => p.evaluate(s => { const e = document.querySelector(s); return !!e && getComputedStyle(e).display !== 'none'; }, M);
const btnClasses = p => p.evaluate(s => [...document.querySelectorAll(s + ' #choice-modal-buttons .btn')].map(b => ({ c: b.className, bg: b.style.background, t: b.textContent })), M);
const frameP95 = (p, ms) => p.evaluate(ms => new Promise(res => { const d = []; let last = performance.now(); const t0 = last; const f = t => { d.push(t - last); last = t; if (t - t0 < ms) requestAnimationFrame(f); else { d.splice(0, 2); d.sort((a, b) => a - b); res(d[Math.floor(d.length * .95)]); } }; requestAnimationFrame(f); }), ms);
const surrender = async p => { await p.click('#btn-surrender-match'); await p.waitForTimeout(400); };

test('C1 card confirm shows card art + ability box + themed buttons', async b => {
  const p = await openPage(b);
  const name = await p.evaluate(() => { const c = gameState.player.hand[0]; askCardUseConfirmation(c, 'ทดสอบ', () => {}); return c.name; });
  await p.waitForTimeout(400);
  const v = await p.evaluate(s => { const m = document.querySelector(s); const img = m.querySelector('.um-card-row img'); return { img: img && img.getAttribute('src'), ab: (m.querySelector('.um-ability') || {}).textContent || '', desc: m.querySelector('#choice-modal-desc').textContent }; }, M);
  const expected = await p.evaluate(n => CARD_DATABASE.find(c => c.name === n).image, name);
  assert(v.img === expected, 'card image ' + v.img + ' != ' + expected);
  assert(v.ab.length > 3 && !/ความสามารถ:/.test(v.desc), 'ability not split out');
  const bs = await btnClasses(p);
  assert(/um-btn-primary/.test(bs[0].c) && /um-btn-ghost/.test(bs[1].c), JSON.stringify(bs));
  assert(bs.every(x => !x.bg), 'inline background not cleared');
});
test('C2 surrender confirm: big icon ring + danger button', async b => {
  const p = await openPage(b); await surrender(p);
  const v = await p.evaluate(s => { const m = document.querySelector(s); const i = m.querySelector('.um-choice-icon'); return { ico: i && i.textContent, title: m.querySelector('#choice-modal-title').textContent }; }, M);
  assert(v.ico && v.ico.includes('🏳'), 'no icon ring: ' + JSON.stringify(v)); assert(!v.title.includes('🏳'), 'emoji still in title');
  const bs = await btnClasses(p); assert(/um-btn-danger/.test(bs[0].c) && /um-btn-ghost/.test(bs[1].c), JSON.stringify(bs));
});
test('C3 defeat screen after surrender', async b => {
  const p = await openPage(b); await surrender(p);
  await p.click(M + ' #choice-modal-buttons .btn >> nth=0'); await p.waitForTimeout(900);
  const v = await p.evaluate(s => { const m = document.querySelector(s); return { cls: m.className, word: (m.querySelector('.um-end-word') || {}).textContent }; }, M);
  assert(/um-defeat/.test(v.cls) && v.word === 'DEFEAT', JSON.stringify(v));
  const bs = await btnClasses(p); assert(/um-btn-primary/.test(bs[0].c) && /um-btn-ice/.test(bs[1].c), JSON.stringify(bs));
});
test('C4 victory screen with sparks that clean up', async b => {
  const p = await openPage(b);
  await p.evaluate(() => { gameState.ai.leader.hp = 0; checkGameOver(); }); await p.waitForTimeout(800);
  const v = await p.evaluate(s => { const m = document.querySelector(s); return { cls: m.className, word: (m.querySelector('.um-end-word') || {}).textContent, sparks: document.querySelectorAll('.um-spark').length }; }, M);
  assert(/um-victory/.test(v.cls) && v.word === 'VICTORY', JSON.stringify(v)); assert(v.sparks > 0, 'no sparks');
  await p.waitForTimeout(2500); assert(await p.evaluate(() => document.querySelectorAll('.um-spark').length === 0), 'sparks not cleaned');
});
test('C5 restart from end screen works and resets mode', async b => {
  const p = await openPage(b); await p.evaluate(() => { gameState.ai.leader.hp = 0; checkGameOver(); }); await p.waitForTimeout(900);
  await p.click(M + ' #choice-modal-buttons .btn >> nth=0'); await p.waitForTimeout(800);
  assert(await p.evaluate(() => gameState.ai.leader.hp === gameState.ai.leader.maxHp && !gameState.gameOver), 'game not restarted');
  await p.evaluate(() => showChoiceModal('⚡ ทดสอบ', 'x', [{ label: 'a', color: '#7c3aed' }])); await p.waitForTimeout(300);
  assert(await p.evaluate(s => !/um-end/.test(document.querySelector(s).className), M), 'end mode leaked into next modal');
  const bs = await btnClasses(p); assert(/um-btn-arcane/.test(bs[0].c), JSON.stringify(bs));
});
test('C6 back to lobby from end screen', async b => {
  const p = await openPage(b); await p.evaluate(() => { gameState.player.leader.hp = 0; checkGameOver(); }); await p.waitForTimeout(900);
  await p.click(M + ' #choice-modal-buttons .btn >> nth=1'); await p.waitForTimeout(500);
  assert(await p.evaluate(() => getComputedStyle(document.getElementById('lobby-screen')).display !== 'none'), 'not back in lobby');
  assert(await p.evaluate(() => !document.querySelector('.um-vignette') || getComputedStyle(document.querySelector('.um-vignette')).display === 'none' || !document.querySelector('#custom-choice-modal').classList.contains('um-end') || getComputedStyle(document.querySelector('#custom-choice-modal')).display === 'none'), 'defeat overlay left behind');
});
test('C7 icon loop stops when closed', async b => {
  const p = await openPage(b); await surrender(p);
  const a = await p.evaluate(s => gsap.getTweensOf(document.querySelector(s + ' .um-choice-icon')).some(t => t.isActive()), M); assert(a, 'icon not animating');
  await p.click(M + ' #choice-modal-buttons .btn >> nth=1'); await p.waitForTimeout(400);
  const c = await p.evaluate(s => { const i = document.querySelector(s + ' .um-choice-icon'); return !!i && gsap.getTweensOf(i).some(t => t.isActive()); }, M);
  assert(!c, 'icon loop still running after close');
});
test('C8 victory animation smooth', async b => {
  const p = await openPage(b); const fp = frameP95(p, 1600);
  await p.evaluate(() => { gameState.ai.leader.hp = 0; checkGameOver(); });
  const v = await fp; assert(v <= 17.5, 'p95 ' + v.toFixed(1)); assert(!p.errors.length, p.errors.join('|'));
});
test('C9 reduced motion: styled, no sparks', async b => {
  const p = await openPage(b, { reduced: true }); await p.evaluate(() => { gameState.ai.leader.hp = 0; checkGameOver(); }); await p.waitForTimeout(800);
  const v = await p.evaluate(s => ({ cls: document.querySelector(s).className, sparks: document.querySelectorAll('.um-spark').length }), M);
  assert(/um-victory/.test(v.cls) && v.sparks === 0, JSON.stringify(v));
});

(async () => {
  const f = process.argv[2] || ''; const b = await chromium.launch({ args: ['--disable-dev-shm-usage'] }); let ok = 0, bad = 0;
  for (const t of tests.filter(t => t.n.includes(f))) { try { await t.f(b); console.log('PASS', t.n); ok++; } catch (e) { console.log('FAIL', t.n, '-', e.message.split('\n')[0]); bad++; } for (const c of b.contexts()) await c.close(); }
  await b.close(); console.log(`${ok}/${ok + bad} passed`); process.exit(bad ? 1 : 0);
})();
