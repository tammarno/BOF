// ชุดทดสอบหน้าต่างดวล / ตั้งค่าบอท / กระดาน (node tests/ui.spec.js [คำกรอง])
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
  p.dialogs = 0; p.on('dialog', d => { p.dialogs++; d.dismiss(); });
  await p.goto(URL); await p.waitForTimeout(900);
  return p;
}
const shown = (p, sel) => p.evaluate(s => { const e = document.querySelector(s); return !!e && getComputedStyle(e).display !== 'none'; }, sel);
const prop = (p, sel, k) => p.evaluate(([s, k]) => gsap.getProperty(document.querySelector(s), k), [sel, k]);
const active = (p, sel) => p.evaluate(s => gsap.getTweensOf(document.querySelector(s)).some(t => t.isActive()), sel);
const frameStats = (p, ms) => p.evaluate(ms => new Promise(res => { const d = []; let last = performance.now(); const t0 = last; const f = t => { d.push(t - last); last = t; if (t - t0 < ms) requestAnimationFrame(f); else { d.splice(0, 2); d.sort((a, b) => a - b); res(d[Math.floor(d.length * .95)]); } }; requestAnimationFrame(f); }), ms);
async function startGame(p) {
  await p.click('#btn-lobby-bot'); await p.waitForTimeout(450);
  await p.click('#btn-start-ai-match'); await p.waitForTimeout(150);
}
async function passMulligan(p) {
  await p.waitForTimeout(1200);
  const m = await p.$('#btn-confirm-mulligan'); if (m && await m.isVisible()) { await m.click(); }
}

// Task 1
test('U1 UIMotion loaded', async b => { const p = await openPage(b); assert(await p.evaluate(() => typeof UIMotion === 'object'), 'UIMotion missing'); assert(!p.errors.length, p.errors.join('|')); });
test('U6 modal skin', async b => {
  const p = await openPage(b); await p.click('#btn-lobby-pvp'); await p.waitForTimeout(500);
  const v = await p.evaluate(() => { const box = document.querySelector('#pvp-room-modal .modal-box'); return { bf: getComputedStyle(box).backdropFilter, ov: getComputedStyle(document.getElementById('pvp-room-modal')).backdropFilter, ico: !!box.querySelector('h2 .lm-h-ico') }; });
  assert(v.bf === 'none' && v.ov === 'none', 'backdrop-filter set'); assert(v.ico, 'title icon not wrapped');
});
// Task 2
test('U2 modal opens with animation', async b => {
  const p = await openPage(b); await p.click('#btn-lobby-pvp'); await p.waitForTimeout(40);
  const s0 = await prop(p, '#pvp-room-modal .modal-box', 'scale'); await p.waitForTimeout(500);
  const s1 = await prop(p, '#pvp-room-modal .modal-box', 'scale'); const o1 = await p.evaluate(() => +getComputedStyle(document.querySelector('#pvp-room-modal .modal-box')).opacity);
  assert(s0 < .999, 'no open animation (scale ' + s0 + ')'); assert(Math.abs(s1 - 1) < .001 && o1 > .99, 'not settled');
});
test('U3 close animates then closes', async b => {
  const p = await openPage(b); await p.click('#btn-lobby-pvp'); await p.waitForTimeout(500);
  await p.click('#btn-close-pvp-modal'); await p.waitForTimeout(40);
  assert(await shown(p, '#pvp-room-modal'), 'closed instantly (no animation)');
  await p.waitForTimeout(400); assert(!(await shown(p, '#pvp-room-modal')), 'did not close');
  await p.click('#btn-lobby-bot'); await p.waitForTimeout(500); await p.click('#btn-cancel-ai-setup'); await p.waitForTimeout(450);
  assert(!(await shown(p, '#ai-setup-modal')), 'ai modal did not close');
});
test('U3b icon loop stops when closed', async b => {
  const p = await openPage(b); await p.click('#btn-lobby-pvp'); await p.waitForTimeout(500);
  assert(await active(p, '#pvp-room-modal .lm-h-ico'), 'globe not looping');
  await p.click('#btn-close-pvp-modal'); await p.waitForTimeout(500);
  assert(!(await active(p, '#pvp-room-modal .lm-h-ico')), 'loop still running after close');
});
// Task 3
test('U4 option selected class', async b => {
  const p = await openPage(b); await p.click('#btn-lobby-bot'); await p.waitForTimeout(500);
  await p.click('.ai-diff-btn[data-diff="NORMAL"]'); await p.click('.ai-deck-btn[data-deck="L02"]'); await p.waitForTimeout(150);
  const v = await p.evaluate(() => ({ d: [...document.querySelectorAll('.ai-diff-btn.is-selected')].map(e => e.dataset.diff), k: [...document.querySelectorAll('.ai-deck-btn.is-selected')].map(e => e.dataset.deck), cfg: [aiConfig.difficulty, aiConfig.deckChoice] }));
  assert(v.d.join() === 'NORMAL' && v.k.join() === 'L02', JSON.stringify(v)); assert(v.cfg.join() === 'NORMAL,L02', 'aiConfig not updated');
});
test('U5 empty join shakes, no dialog', async b => {
  const p = await openPage(b); await p.click('#btn-lobby-pvp'); await p.waitForTimeout(500);
  await p.click('#btn-join-room'); await p.waitForTimeout(60);
  assert(await active(p, '#input-join-code'), 'input not shaking'); await p.waitForTimeout(300);
  assert(p.dialogs === 0, 'alert dialog shown');
});
// Task 4
test('U4b button press fast + still works', async b => {
  const p = await openPage(b); await p.click('#btn-lobby-bot'); await p.waitForTimeout(500);
  const bb = await p.locator('#btn-start-ai-match').boundingBox();
  await p.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2); await p.mouse.down(); await p.waitForTimeout(80);
  const s = await prop(p, '#btn-start-ai-match', 'scale'); await p.mouse.up(); await p.waitForTimeout(300);
  assert(s <= .97, 'press scale ' + s); assert(await shown(p, '.game-container'), 'start button did not start game');
});
// Task 5
test('U7 board intro', async b => {
  const p = await openPage(b); await startGame(p);
  const y0 = await prop(p, '.ai-side-zone', 'y'); await p.waitForTimeout(1300); const y1 = await prop(p, '.ai-side-zone', 'y');
  assert(y0 < -2, 'no intro (y ' + y0 + ')'); assert(Math.abs(y1) < .01, 'not settled');
});
test('U8 turn banner', async b => {
  const p = await openPage(b); await startGame(p); await passMulligan(p);
  let seen = false; for (let i = 0; i < 20 && !seen; i++) { seen = await p.evaluate(() => { const e = document.getElementById('lm-turn-banner'); return !!e && +getComputedStyle(e).opacity > .5 && /คุณ/.test(e.textContent); }); if (!seen) await p.waitForTimeout(60); }
  assert(seen, 'player turn banner not shown');
});
test('U9 HP loss shakes leader', async b => {
  const p = await openPage(b); await startGame(p); await passMulligan(p); await p.waitForTimeout(1500);
  await p.evaluate(() => { gameState.ai.leader.hp -= 1; renderGame(); }); await p.waitForTimeout(250);
  assert(await active(p, '#ai-leader-box'), 'leader not shaking');
});
test('U10 count bump', async b => {
  const p = await openPage(b); await startGame(p); await passMulligan(p); await p.waitForTimeout(1500);
  await p.evaluate(() => { gameState.player.deck.pop(); renderGame(); }); await p.waitForTimeout(220);
  assert(await active(p, '#player-deck-count'), 'deck count did not bump');
});
test('U11 empty slots glow while placing', async b => {
  const p = await openPage(b); await startGame(p); await passMulligan(p); await p.waitForTimeout(1500);
  await p.evaluate(() => { gameState.selectedHandIndex = 0; renderGame(); }); await p.waitForTimeout(250);
  assert(await p.evaluate(() => document.getElementById('player-board').classList.contains('lm-placing')), 'no placing glow');
  await p.evaluate(() => { gameState.selectedHandIndex = null; renderGame(); }); await p.waitForTimeout(250);
  assert(await p.evaluate(() => !document.getElementById('player-board').classList.contains('lm-placing')), 'glow stuck');
});
test('U13 phase button breathes on my turn', async b => {
  const p = await openPage(b); await startGame(p); await passMulligan(p); await p.waitForTimeout(1500);
  assert(await p.evaluate(() => { const e = document.getElementById('btn-pass-turn-inline'); return !!e && e.classList.contains('lm-breathe'); }), 'no breathe class');
});
// Task 6
test('U12 smooth in game and modal', async b => {
  const p = await openPage(b); await p.click('#btn-lobby-bot'); const m = await frameStats(p, 800);
  await p.click('#btn-start-ai-match'); await passMulligan(p); await p.waitForTimeout(1500); const g = await frameStats(p, 2500);
  assert(m <= 17.5 && g <= 17.5, `p95 modal ${m.toFixed(1)} game ${g.toFixed(1)}`); assert(!p.errors.length, p.errors.join('|'));
});
test('U14 reduced motion keeps skin, no anim', async b => {
  const p = await openPage(b, { reduced: true }); await p.click('#btn-lobby-pvp'); await p.waitForTimeout(40);
  const s = await prop(p, '#pvp-room-modal .modal-box', 'scale'); assert(Math.abs(s - 1) < .001, 'animated under reduced motion');
});

// Final review
test('V1 valid-target slot stays green', async b => {
  const p = await openPage(b); await startGame(p); await passMulligan(p); await p.waitForTimeout(1200);
  const c = await p.evaluate(() => { const s = document.querySelector('#player-board .slot'); s.classList.add('valid-target'); return getComputedStyle(s).borderTopColor; });
  assert(c === 'rgb(34, 197, 94)', 'valid-target border overridden: ' + c);
});
test('V2 lobby idle paused when modal opened during intro', async b => {
  const ctx = await b.newContext({ viewport: { width: 1316, height: 620 }, deviceScaleFactor: 1.25 });
  const p = await ctx.newPage(); p.setDefaultTimeout(8000); await p.goto(URL); await p.waitForTimeout(350);
  await p.click('#btn-lobby-bot', { force: true }); await p.waitForTimeout(2500);
  const n = await p.evaluate(() => gsap.globalTimeline.getChildren(true, true, false).filter(t => t.isActive() && !t.paused() && t.targets().some(e => e.closest && e.closest('#lobby-screen'))).length);
  assert(n === 0, n + ' lobby tweens still running under modal');
});
test('V3 disabled gold button looks disabled', async b => {
  const p = await openPage(b); await p.click('#btn-lobby-bot'); await p.waitForTimeout(500);
  const bg = await p.evaluate(() => { const e = document.getElementById('btn-start-ai-match'); e.disabled = true; const v = getComputedStyle(e).backgroundImage; e.disabled = false; return v; });
  assert(!/gradient/.test(bg), 'disabled button still gold');
});

(async () => {
  const f = process.argv[2] || ''; const b = await chromium.launch({ args: ['--disable-dev-shm-usage'] }); let ok = 0, bad = 0;
  for (const t of tests.filter(t => t.n.includes(f))) { try { await t.f(b); console.log('PASS', t.n); ok++; } catch (e) { console.log('FAIL', t.n, '-', e.message.split('\n')[0]); bad++; } for (const c of b.contexts()) await c.close(); }
  await b.close(); console.log(`${ok}/${ok + bad} passed`); process.exit(bad ? 1 : 0);
})();
