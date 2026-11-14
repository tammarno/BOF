/* ============================================================================
   BOF ลูกศรเล็ง + พรีวิวผลการต่อสู้ (หน้าตาเท่านั้น: อ่าน gameState อย่างเดียว ไม่แก้สถานะเกม)
   เมื่อเลือกยูนิตโจมตีใน Battle Phase:
   - ป้าย "2:3 แพ้" (พลังเรา:พลังเขา) ใต้ยูนิตศัตรูทุกใบ + "-1 HP" ที่ Leader (มือถือก็เห็น ไม่ต้อง hover)
   - ขอบแดงเตือนยูนิตที่จะถูกทำลาย (ชี้เป้าที่แพ้/เสมอ = ยูนิตเราขึ้นด้วย)
   - ลูกศรโค้ง (เฉพาะเมาส์): ลำแสงไล่สี + ลูกศรเล็กไหลไปหาเป้า + หัวลูกศร + วงพัลส์ที่ผู้โจมตี
     หัวลูกศรตามเมาส์แบบนุ่ม (lerp) · ชี้เป้า = กรอบล็อกเป้าหมุนเข้าที่ + สีตามผล · กดโจมตี = ลำแสงวาบแล้วจาง
   AimFx.refresh() ถูกเรียกท้าย renderGame()
   ============================================================================ */
(function () {
  const NS = 'http://www.w3.org/2000/svg';
  const WORD = { win: 'ชนะ', lose: 'แพ้', tie: 'เสมอ', hit: '' };
  const FLOW = 6; // จำนวนลูกศรเล็กที่ไหลบนเส้น
  const TARGETS = '#ai-board .slot, #ai-leader-box';
  const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

  let svg, el = {}, lock, attackerEl = null, results = new Map();
  let mouse = null, head = null, raf = 0, phase = 0, lockedOn = null;

  function aiming() {
    const g = typeof gameState !== 'undefined' ? gameState : null; // const ใน game.js ไม่อยู่บน window
    return !!(g && g.player && !g.gameOver && g.activeTurn === 'player' && g.phase === 'Battle Phase' &&
      g.selectedAttackerSlot !== null && !g.pendingAction);
  }

  function svgEl(tag, attrs, parent) {
    const n = document.createElementNS(NS, tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }

  function build() {
    if (svg) return;
    svg = svgEl('svg', { class: 'aim-arrow', 'aria-hidden': 'true' });
    svg.innerHTML =
      '<defs><filter id="aim-blur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="5"/></filter>' +
      '<linearGradient id="aim-grad" gradientUnits="userSpaceOnUse"><stop offset="0" class="g0"/><stop offset=".55" class="g1"/><stop offset="1" class="g2"/></linearGradient></defs>';
    el.grad = svg.querySelector('#aim-grad');
    el.glow = svgEl('path', { class: 'a-glow' }, svg);
    el.core = svgEl('path', { class: 'a-core' }, svg);
    el.edge = svgEl('path', { class: 'a-edge' }, svg);
    el.flow = svgEl('g', { class: 'a-flow' }, svg);
    el.chev = [];
    for (let i = 0; i < FLOW; i++) el.chev.push(svgEl('path', { d: 'M-5 -6 L4 0 L-5 6 L-2.5 0 Z' }, el.flow));
    el.origin = svgEl('g', { class: 'a-origin' }, svg);
    svgEl('circle', { class: 'o-pulse', r: 12 }, el.origin);
    svgEl('circle', { class: 'o-dot', r: 5 }, el.origin);
    el.head = svgEl('g', { class: 'a-head' }, svg);
    svgEl('path', { d: 'M-18 -14 L10 0 L-18 14 L-11 0 Z' }, el.head);
    svgEl('path', { class: 'h-in', d: 'M-9 -5 L3 0 L-9 5 L-6 0 Z' }, el.head);
    document.body.appendChild(svg);

    lock = document.createElement('div');
    lock.className = 'aim-lock';
    lock.innerHTML = '<i></i><i></i><i></i><i></i>';
    document.body.appendChild(lock);
  }

  function clearMarks() {
    document.querySelectorAll('.aim-chip').forEach(c => c.remove());
    document.querySelectorAll('.aim-doomed').forEach(c => c.classList.remove('aim-doomed'));
    results.clear();
  }

  function chip(host, html, res) {
    const c = document.createElement('div');
    c.className = 'aim-chip is-' + res;
    c.innerHTML = html;
    host.appendChild(c);
  }

  function hide() {
    if (svg) svg.classList.remove('is-on');
    setLock(null);
    head = null;
  }

  function refresh() {
    clearMarks();
    if (!aiming()) { attackerEl = null; hide(); return; }
    const { player, ai } = gameState, me = player.board[gameState.selectedAttackerSlot];
    if (!me || typeof getEffectivePower !== 'function') return;
    attackerEl = document.querySelector('#player-board .card.selected-attacker');
    // shortcut: เทียบแค่ getEffectivePower ไม่รวมสกิลที่ทำงานตอนปะทะ (ลูซิเฟอร์ -1, เบลเซบับชนะตอนเสมอ, intercept)
    // ถ้าต้องตรง 100% ให้แยกการคำนวณออกจาก compareAndDestroyMonsters มาใช้ร่วมกัน
    const a = getEffectivePower(me, player);
    document.querySelectorAll('#ai-board .slot').forEach((slot, i) => {
      const m = ai.board[i], card = slot.querySelector('.card');
      if (!m || !card) return;
      const b = getEffectivePower(m, ai);
      const res = a > b ? 'win' : a < b ? 'lose' : 'tie';
      results.set(slot, res);
      chip(slot, `${a}:${b} <i>${WORD[res]}</i>`, res);
      if (res !== 'lose') card.classList.add('aim-doomed');
    });
    const lb = document.getElementById('ai-leader-box');
    if (lb) { results.set(lb, 'hit'); chip(lb, '-1 HP', 'hit'); }
    lockedOn = null; // DOM ถูกวาดใหม่: ให้ loop หาเป้าใหม่จากตำแหน่งเมาส์
    if (mouse) start();
  }

  function setLock(target, res) {
    if (!lock) return;
    if (!target) { lock.classList.remove('is-on'); document.querySelectorAll('.aim-chip.is-focus').forEach(c => c.classList.remove('is-focus')); return; }
    const r = target.getBoundingClientRect(), pad = 6;
    Object.assign(lock.style, { left: r.left - pad + 'px', top: r.top - pad + 'px', width: r.width + pad * 2 + 'px', height: r.height + pad * 2 + 'px' });
    lock.className = 'aim-lock is-' + res;
    void lock.offsetWidth; // เล่นแอนิเมชันล็อกเป้าใหม่ทุกครั้งที่เปลี่ยนเป้า
    lock.classList.add('is-on');
    document.querySelectorAll('.aim-chip.is-focus').forEach(c => c.classList.remove('is-focus'));
    const c = target.querySelector(':scope > .aim-chip');
    if (c) c.classList.add('is-focus');
  }

  const bez = (p0, c, p1, t) => { const u = 1 - t; return { x: u * u * p0.x + 2 * u * t * c.x + t * t * p1.x, y: u * u * p0.y + 2 * u * t * c.y + t * t * p1.y }; };
  const tan = (p0, c, p1, t) => Math.atan2(2 * (1 - t) * (c.y - p0.y) + 2 * t * (p1.y - c.y), 2 * (1 - t) * (c.x - p0.x) + 2 * t * (p1.x - c.x)) * 180 / Math.PI;

  function frame() {
    raf = 0;
    if (!mouse || !attackerEl || !attackerEl.isConnected || !aiming()) { hide(); return; }
    build();

    // หาเป้าจากตำแหน่งเมาส์ทุกเฟรม (ไม่พึ่ง event target ที่อาจถูกวาดทับไปแล้ว)
    const under = document.elementFromPoint(mouse.x, mouse.y);
    const target = under && under.closest(TARGETS);
    const res = target ? results.get(target) : null;
    const locked = res ? target : null;
    if (locked !== lockedOn) { lockedOn = locked; setLock(locked, res); }
    attackerEl.classList.toggle('aim-doomed', res === 'lose' || res === 'tie');

    const ra = attackerEl.getBoundingClientRect();
    const p0 = { x: ra.left + ra.width / 2, y: ra.top + ra.height / 2 };
    let goal = { x: mouse.x, y: mouse.y };
    if (locked) { const r = locked.getBoundingClientRect(); goal = { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }
    // หัวลูกศรไล่ตามเป้าแบบนุ่ม (reduced motion = กระโดดตรง)
    head = !head || reduce() ? goal : { x: head.x + (goal.x - head.x) * .32, y: head.y + (goal.y - head.y) * .32 };

    const dx = head.x - p0.x, dy = head.y - p0.y, len = Math.hypot(dx, dy);
    if (len < 40) { svg.classList.remove('is-on'); raf = requestAnimationFrame(frame); return; }
    // จุดควบคุม: ดันออกตั้งฉากกับเส้น โค้งมากขึ้นเมื่อไกล แต่ไม่ต่ำกว่า 64px: เป้าที่อยู่ตรงหน้าจะอ้อมเข้าทางข้าง ไม่ใช่เหลือแค่หัวลูกศร
    const bend = Math.max(64, Math.min(150, len * .32)), s = dx >= 0 ? -1 : 1;
    const c = { x: (p0.x + head.x) / 2 - dy / len * bend * s, y: (p0.y + head.y) / 2 + dx / len * bend * s };
    // ตัดปลายให้หยุดที่ขอบเป้า ไม่ทับรูปการ์ด/ป้าย · ตัดต้นให้เริ่มที่ขอบการ์ดเรา
    // (เผื่อ 14px ให้พ้นป้ายผลที่ห้อยใต้ขอบเป้า)
    const endTrim = locked ? edgeDist(locked.getBoundingClientRect(), head, c) + 14 : 0;
    const p1 = trim(head, c, endTrim), s0 = trim(p0, c, edgeDist(ra, p0, c) + 2);

    const d = `M${s0.x} ${s0.y} Q${c.x} ${c.y} ${p1.x} ${p1.y}`;
    el.glow.setAttribute('d', d); el.core.setAttribute('d', d); el.edge.setAttribute('d', d);
    el.grad.setAttribute('x1', s0.x); el.grad.setAttribute('y1', s0.y); el.grad.setAttribute('x2', p1.x); el.grad.setAttribute('y2', p1.y);
    el.head.setAttribute('transform', `translate(${p1.x} ${p1.y}) rotate(${tan(s0, c, p1, 1)})`);
    el.origin.setAttribute('transform', `translate(${s0.x} ${s0.y})`);

    // ลูกศรเล็กไหลจากผู้โจมตีไปหาเป้า: ใหญ่และชัดขึ้นเมื่อใกล้หัว จางที่ปลายทั้งสองข้าง
    if (!reduce()) phase = (phase + .012) % 1;
    el.chev.forEach((ch, i) => {
      const t = (phase + i / FLOW) % 1, tt = .08 + t * .8, p = bez(s0, c, p1, tt);
      const fade = Math.min(1, t / .15, (1 - t) / .15);
      ch.setAttribute('transform', `translate(${p.x} ${p.y}) rotate(${tan(s0, c, p1, tt)}) scale(${.7 + t * .7})`);
      ch.setAttribute('opacity', fade.toFixed(2));
    });

    const cls = 'aim-arrow is-on' + (res ? ' is-' + res : '');
    if (svg.getAttribute('class') !== cls) svg.setAttribute('class', cls);
    raf = requestAnimationFrame(frame);
  }

  // จุดบนเส้นตรงจาก c ไปหา p ที่ถอยจาก p เข้ามา dist px (ปลายเส้นโค้งสัมผัสทิศนี้พอดี)
  function trim(p, c, dist) {
    const vx = p.x - c.x, vy = p.y - c.y, l = Math.hypot(vx, vy) || 1;
    return { x: p.x - vx / l * dist, y: p.y - vy / l * dist };
  }

  // ระยะจากจุดกลางกล่อง r ถึงขอบกล่อง ตามทิศจาก c มาหา p (การ์ดตั้ง: เข้าจากล่าง = ครึ่งความสูง เข้าจากข้าง = ครึ่งความกว้าง)
  function edgeDist(r, p, c) {
    const vx = Math.abs(p.x - c.x), vy = Math.abs(p.y - c.y), l = Math.hypot(vx, vy) || 1;
    return Math.min(vx ? r.width / 2 / (vx / l) : Infinity, vy ? r.height / 2 / (vy / l) : Infinity);
  }

  function start() { if (!raf) raf = requestAnimationFrame(frame); }

  document.addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse') return;
    mouse = { x: e.clientX, y: e.clientY };
    if (attackerEl) start();
  }, { passive: true });
  document.addEventListener('mouseleave', () => { mouse = null; });

  // หลังคลิก (handler ของเกมทำงานก่อน เพราะนี่คือ bubble ที่ document)
  // ถ้าเพิ่งยิงใส่เป้าที่ล็อกอยู่ → ลำแสงวาบแล้วจาง · แล้วล้างป้ายทันที ไม่รอ renderGame
  document.addEventListener('click', () => {
    if (!attackerEl || aiming()) return;
    const fired = lockedOn && svg && svg.classList.contains('is-on');
    if (raf) { cancelAnimationFrame(raf); raf = 0; }
    clearMarks(); setLock(null); attackerEl = null; lockedOn = null; head = null;
    if (fired && !reduce()) {
      svg.classList.add('is-fire');
      setTimeout(() => { svg.setAttribute('class', 'aim-arrow'); }, 300);
    } else if (svg) svg.setAttribute('class', 'aim-arrow');
  });

  window.AimFx = { refresh };
})();
