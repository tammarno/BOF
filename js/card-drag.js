// ลากการ์ดจากมือลงสนาม: ลูกศรเล็ง → การ์ดพุ่งโค้งลงช่อง → เรียกตัวจัดการคลิกช่องเดิมของ game.js
(function () {
  'use strict';

  const CardDrag = {};
  // การ์ดที่มีเมนูของตัวเองตอนกดจากมือ → ใช้การคลิกเหมือนเดิม
  const MENU_IDS = ['DM07', 'NM01', 'NM02', 'NM03'];
  const C = {
    threshold: 8, hitPad: 10, lerpHot: 0.35, lerpFree: 0.6, arc: 70,
    flyFrames: 14, flyMs: 360, flyScale: 0.28, flyArc: 90, swallowMs: 400,
    color: '#38bdf8', colorHot: '#f59e0b',
  };
  const NS = 'http://www.w3.org/2000/svg';

  let busy = false;
  CardDrag.isBusy = function () { return busy; };

  // 'board' = ลงช่องฝั่งเรา, 'spy' = ลงช่องว่างฝั่งศัตรู, null = ลากไม่ได้ (ใช้คลิก)
  CardDrag.canDrag = function (card, gs) {
    if (gs === undefined && typeof gameState !== 'undefined') gs = gameState;
    if (!card || !gs) return null;
    if (gs.activeTurn !== 'player' || gs.phase !== 'Main Phase' || gs.pendingAction || gs.gameOver || gs.isRollingDice) return null;
    if (window.HandShuffle && HandShuffle.isBusy()) return null;
    if (typeof isChoiceModalOpen === 'function' && isChoiceModalOpen()) return null;
    if (card.type !== 'Monster' || card.id === 'M04' || card.cannotNormalSummon || card.futureBaseId || MENU_IDS.includes(card.id)) return null;
    if (card.id === 'NM05' || card.isSpy) return 'spy';
    return 'board';
  };

  const reducedMotion = () => !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const lerp = (a, b, t) => a + (b - a) * t;
  const handEls = () => Array.from(document.querySelectorAll('#player-hand > .card'));
  const slotsOf = kind => Array.from(document.querySelectorAll(kind === 'spy' ? '#ai-board .slot' : '#player-board .slot'));
  const center = el => { const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width, h: r.height, top: r.top }; };

  // กลืนคลิกที่ตามหลังการลาก ไม่ให้ไปเปิดหน้ายืนยันของการคลิก
  let swallowUntil = 0;
  document.addEventListener('click', e => {
    if (performance.now() < swallowUntil && !e.target.closest('#custom-choice-modal')) { e.stopPropagation(); e.preventDefault(); }
  }, true);

  let press = null; // { card, x, y, id } ก่อนเกินเกณฑ์
  let aim = null;   // สถานะตั้งแต่เริ่มเล็งจนวางเสร็จ; phase: 'aim' → 'confirm' (ถามวางทับ) → 'fly'

  function onDown(e) {
    if (busy || press || (e.pointerType === 'mouse' && e.button !== 0)) return;
    const el = e.target.closest('#player-hand > .card');
    if (!el || e.target.closest('.holo-info-btn')) return;
    const card = typeof gameState !== 'undefined' && gameState.player ? gameState.player.hand[handEls().indexOf(el)] : null;
    if (!card) return;
    press = { card, x: e.clientX, y: e.clientY, id: e.pointerId };
  }

  function onMove(e) {
    if (aim) { if (e.pointerId === aim.id) { aim.px = e.clientX; aim.py = e.clientY; } return; }
    if (!press || e.pointerId !== press.id) return;
    const dx = e.clientX - press.x, dy = e.clientY - press.y;
    if (Math.hypot(dx, dy) <= C.threshold) return;
    const p = press; press = null;
    // ทางซ้าย-ขวา = เลื่อนแถวมือ, ลงล่าง = ไม่ใช่การลาก
    if (Math.abs(dx) > Math.abs(dy) || dy >= 0) return;
    const kind = CardDrag.canDrag(p.card);
    if (!kind) return;
    startAim(p, kind, e.clientX, e.clientY);
  }

  function onUp(e) {
    if (press && e.pointerId === press.id) press = null;
    if (!aim || aim.phase !== 'aim' || e.pointerId !== aim.id) return;
    release(e.type === 'pointercancel' ? null : aim.hot);
  }

  function sourceEl() {
    const i = gameState.player.hand.indexOf(aim.card);
    return i < 0 ? null : handEls()[i] || null;
  }

  function startAim(p, kind, x, y) {
    busy = true;
    swallowUntil = Infinity;
    const slots = slotsOf(kind);
    const targets = kind === 'spy' ? slots.filter((s, i) => !gameState.ai.board[i]) : slots;
    targets.forEach(s => s.classList.add('cd-droppable'));
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('class', 'cd-aim');
    svg.innerHTML = '<defs><marker id="cd-head" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="currentColor"/></marker></defs>'
      + '<circle class="cd-reticle" r="0"/><path class="cd-path" marker-end="url(#cd-head)"/>';
    document.body.appendChild(svg);
    document.body.classList.add('cd-dragging');
    aim = { phase: 'aim', card: p.card, kind, id: p.id, px: x, py: y, ex: x, ey: y, slots, targets, hot: null, svg, el: null, raf: 0 };
    tick();
  }

  function tick() {
    const el = sourceEl();
    if (!el) { cancel(); return; }
    if (el !== aim.el) { if (aim.el) aim.el.classList.remove('cd-aiming'); el.classList.add('cd-aiming'); aim.el = el; }
    // ปลายลูกศรอยู่ในช่องไหน (ขยายขอบรับ)
    let hot = null;
    for (const s of aim.targets) {
      const r = s.getBoundingClientRect();
      if (aim.px > r.left - C.hitPad && aim.px < r.right + C.hitPad && aim.py > r.top - C.hitPad && aim.py < r.bottom + C.hitPad) { hot = s; break; }
    }
    if (hot !== aim.hot) {
      if (aim.hot) aim.hot.classList.remove('cd-hot');
      if (hot) hot.classList.add('cd-hot');
      aim.hot = hot;
    }
    const t = hot ? center(hot) : { x: aim.px, y: aim.py };
    const k = hot ? C.lerpHot : C.lerpFree;
    aim.ex = lerp(aim.ex, t.x, k); aim.ey = lerp(aim.ey, t.y, k);
    const s = center(el), x0 = s.x, y0 = s.top - 12;
    aim.svg.style.color = hot ? C.colorHot : C.color;
    aim.svg.querySelector('.cd-path').setAttribute('d', `M${x0},${y0} Q${(x0 + aim.ex) / 2},${Math.min(y0, aim.ey) - C.arc} ${aim.ex},${aim.ey}`);
    const ret = aim.svg.querySelector('.cd-reticle');
    if (hot) { ret.setAttribute('cx', t.x); ret.setAttribute('cy', t.y); ret.setAttribute('r', Math.hypot(t.w, t.h) / 2 + 4); } else ret.setAttribute('r', 0);
    aim.raf = requestAnimationFrame(tick);
  }

  // ลบลูกศรและไฮไลต์ (ยังไม่ปลด busy)
  function clearAim() {
    if (!aim) return;
    cancelAnimationFrame(aim.raf);
    aim.svg.remove();
    aim.slots.forEach(s => s.classList.remove('cd-droppable', 'cd-hot'));
    document.body.classList.remove('cd-dragging');
  }

  function finish() {
    clearAim();
    handEls().forEach(e => e.classList.remove('cd-aiming', 'cd-away'));
    aim = null; busy = false;
    swallowUntil = performance.now() + C.swallowMs;
  }

  function cancel() { if (aim) finish(); }
  CardDrag.cancel = cancel;

  function release(hotSlot) {
    cancelAnimationFrame(aim.raf);
    if (!hotSlot) { cancel(); return; }
    const kind = CardDrag.canDrag(aim.card);
    if (kind !== aim.kind) { cancel(); return; }
    const slotIndex = aim.slots.indexOf(hotSlot);
    clearAim();
    const occupant = kind === 'board' ? gameState.player.board[slotIndex] : null;
    if (occupant) {
      aim.phase = 'confirm';
      showChoiceModal(`วางทับ "${occupant.name}"?`, 'ตัวเดิมจะถูกส่งลงนรก (ไม่ถือว่าถูกทำลาย)', [
        { label: '✅ วางทับ', color: '#16a34a', onSelect: () => fly(hotSlot, slotIndex) },
        { label: '❌ ยกเลิก', color: '#475569', onSelect: () => { finish(); renderGame(); } },
      ]);
      return;
    }
    fly(hotSlot, slotIndex);
  }

  function fly(slotEl, slotIndex) {
    if (!aim) return;
    aim.phase = 'fly';
    const el = sourceEl();
    if (!el || reducedMotion()) { place(slotIndex); return; }
    const a = center(el), b = center(slotEl);
    const clone = el.cloneNode(true);
    clone.classList.remove('cd-aiming');
    clone.classList.add('cd-fly');
    clone.style.width = a.w + 'px'; clone.style.height = a.h + 'px';
    document.body.appendChild(clone);
    el.classList.remove('cd-aiming'); el.classList.add('cd-away');
    const x0 = a.x, y0 = a.y - 16, cx = (x0 + b.x) / 2, cy = Math.min(y0, b.y) - C.flyArc;
    const frames = [];
    for (let i = 0; i <= C.flyFrames; i++) {
      const t = i / C.flyFrames, u = 1 - t, arc = Math.sin(t * Math.PI);
      const x = u * u * x0 + 2 * u * t * cx + t * t * b.x, y = u * u * y0 + 2 * u * t * cy + t * t * b.y;
      frames.push({ transform: `translate(${x - a.w / 2}px, ${y - a.h / 2}px) rotate(${arc * -10}deg) scale(${1 + arc * C.flyScale})` });
    }
    const an = clone.animate(frames, { duration: C.flyMs, easing: 'cubic-bezier(.4,0,.8,.6)', fill: 'forwards' });
    an.onfinish = () => { clone.remove(); place(slotIndex); };
  }

  // ส่งต่อให้ตัวจัดการคลิกช่องเดิม (กฎ วางทับ ON_SUMMON ทั้งหมดอยู่ที่นั่น)
  function place(slotIndex) {
    if (!aim) return;
    const card = aim.card, kind = aim.kind;
    finish();
    const idx = gameState.player.hand.indexOf(card);
    if (idx < 0) { renderGame(); return; }
    gameState.selectedAttackerSlot = null;
    gameState.selectedHandIndex = idx;
    if (kind === 'spy') handleAISlotClick(slotIndex); else handlePlayerSlotClick(slotIndex);
    // ตัวจัดการปฏิเสธ → อย่าทิ้งการ์ดค้างในสถานะเลือก
    const still = gameState.player.hand.indexOf(card);
    if (still >= 0 && gameState.selectedHandIndex === still) { gameState.selectedHandIndex = null; renderGame(); }
  }

  const hand = document.getElementById('player-hand');
  if (hand) {
    hand.addEventListener('pointerdown', onDown);
    // รูปการ์ดเป็น <img>: การลากรูปแบบเบราว์เซอร์จะยิง pointercancel แย่งการลากของเรา
    hand.addEventListener('dragstart', e => e.preventDefault());
  }
  window.addEventListener('pointermove', onMove);
  window.addEventListener('pointerup', onUp);
  window.addEventListener('pointercancel', onUp);
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && aim && aim.phase === 'aim') cancel(); });

  window.CardDrag = CardDrag;
})();
