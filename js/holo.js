/* ============================================================================
   HOLO CARD SYSTEM  (โหลดหลัง game.js)
   ห่อฟังก์ชันเดิมของ game.js โดยไม่แก้ตรรกะเกม:
   - createCardElement  → เติมเลเยอร์ประกาย + data-rarity + ปุ่ม ⓘ
   - openCardDetailModal → เปิดหน้า Inspect 3D แทนโมดอลเดิม
   - renderDeckBuilder   → ตกแต่งการ์ด Leader ที่สร้างเองในฟังก์ชันนั้น
   - renderGame          → แอนิเมชันตอนจั่วการ์ดเข้ามือ
   ============================================================================ */
(function () {
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canHover = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const STARS = { N: 0, R: 1, SR: 3, Legend: 6 };
  const STAR_TINT = { R: '#9fd0ff', SR: '#ffb3bd', Legend: '#ffe39a' };
  const TYPE_TH = { Leader: 'Leader', Monster: 'ยูนิต', NormalSpell: 'Normal Spell', ReactionSpell: 'Reaction Spell' };
  const cardOf = new WeakMap(); // element → { card, owner }

  function rarityOf(card) {
    if (!card) return 'N';
    if (card.rarity) return card.rarity;
    const base = CARD_DATABASE.find(c => c.id === card.id);
    return (base && base.rarity) || 'N';
  }

  // พื้นผิวกากเพชร สร้างครั้งเดียว
  (function makeGlitter() {
    const c = document.createElement('canvas'); c.width = c.height = 180; const g = c.getContext('2d');
    for (let i = 0; i < 260; i++) {
      const x = Math.random() * 180, y = Math.random() * 180, r = Math.random() * 1.3 + .3;
      g.fillStyle = `hsla(${Math.random() * 360}, 100%, ${70 + Math.random() * 30}%, ${.5 + Math.random() * .5})`;
      g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
      if (Math.random() < .08) { g.fillRect(x - 3, y - .4, 6, .8); g.fillRect(x - .4, y - 3, .8, 6); }
    }
    // PERF: ใส่เป็นกฎ CSS ตรง ๆ ครั้งเดียว ไม่เก็บ data URL ยาว ~19KB ไว้ใน custom property ที่ถูกคำนวณซ้ำทุกการ์ดทุกเฟรม
    const st = document.createElement('style');
    st.textContent = `.holo-sparkle > i { background-image: url(${c.toDataURL()}); }`;
    document.head.appendChild(st);
  })();

  function holoLayersHTML() {
    return '<div class="holo-layer holo-foil"><i></i></div><div class="holo-layer holo-sparkle"><i></i></div>' +
           '<div class="holo-layer holo-glare"><i></i></div><div class="holo-layer holo-sheen"></div><div class="holo-layer holo-stars"></div>';
  }

  function addStars(root, rarity) {
    const box = root.querySelector('.holo-stars'); if (!box) return;
    box.replaceChildren();
    const n = reduceMotion ? 0 : (STARS[rarity] || 0);
    for (let i = 0; i < n; i++) {
      const s = document.createElement('i'); s.className = 'holo-tw';
      s.style.left = (10 + Math.random() * 80) + '%'; s.style.top = (8 + Math.random() * 52) + '%';
      s.style.setProperty('--sz', (9 + Math.random() * 9) + '%');
      s.style.setProperty('--dur', (2.2 + Math.random() * 2) + 's');
      s.style.setProperty('--delay', (-Math.random() * 4) + 's');
      s.style.setProperty('--tc', STAR_TINT[rarity]);
      box.append(s);
    }
  }

  function decorate(el, card, owner) {
    if (!el || !card || el.dataset.rarity) return el;
    const rarity = rarityOf(card);
    el.dataset.rarity = rarity;
    cardOf.set(el, { card, owner });
    const art = el.querySelector('.card-art');
    if (art) { art.insertAdjacentHTML('beforeend', holoLayersHTML()); addStars(art, rarity); }
    return el;
  }

  function hideTooltip() { if (typeof hideCardTooltip === 'function') hideCardTooltip(); }

  // ---------- เอียงตามตำแหน่ง ----------
  function applyTilt(el, px, py, maxDeg) {
    el.style.setProperty('--ry', `${(px - .5) * 2 * maxDeg}deg`);
    el.style.setProperty('--rx', `${(.5 - py) * 2 * maxDeg}deg`);
    // --px/--py (-0.5..0.5) ใช้ใน transform ของเลเยอร์ประกายเท่านั้น จึงไม่ต้องวาดใหม่
    el.style.setProperty('--px', (px - .5).toFixed(3));
    el.style.setProperty('--py', (py - .5).toFixed(3));
    el.style.setProperty('--hyp', Math.min(1, Math.hypot(px - .5, py - .5) * 2).toFixed(3));
  }
  function resetTilt(el) {
    el.classList.remove('holo-live');
    ['--rx', '--ry', '--px', '--py', '--hyp'].forEach(p => el.style.removeProperty(p));
  }

  // เอียงการ์ดตามเมาส์ภายใน container (มือถือเว้นไว้ เพราะแถวการ์ดต้องเลื่อนด้วยนิ้ว)
  // ใช้กับการ์ดบนมือ และการ์ดในหน้าล็อบบี้ (ผ่าน window.HoloTilt.bind)
  function bindTilt(hand, maxDeg = 12, selector = '.card') {
    if (!hand || reduceMotion || !canHover) return;
    let lastEl = null, pending = null, raf = 0;
    const flush = () => {
      raf = 0; if (!pending) return;
      const { el, x, y } = pending; pending = null;
      if (!el.isConnected) return;
      const r = el.getBoundingClientRect(); // อ่านก่อน แล้วค่อยเขียน (ไม่สลับอ่าน/เขียน)
      el.classList.add('holo-live');
      applyTilt(el, (x - r.left) / r.width, (y - r.top) / r.height, maxDeg);
    };
    hand.addEventListener('pointermove', e => {
      if (e.pointerType !== 'mouse' || document.body.classList.contains('holo-inspecting')) return;
      const el = e.target.closest(selector);
      if (lastEl && lastEl !== el) resetTilt(lastEl);
      lastEl = el; if (!el) { pending = null; return; }
      pending = { el, x: e.clientX, y: e.clientY };
      if (!raf) raf = requestAnimationFrame(flush);
    });
    hand.addEventListener('pointerleave', () => { pending = null; if (lastEl) resetTilt(lastEl); lastEl = null; });
  }

  // ---------- คลิกขวา เพื่อเปิด Inspect ----------
  let suppressClickUntil = 0;
  function bindLongPress() {
    document.addEventListener('contextmenu', e => {
      const el = e.target.closest('.card');
      if (!el || !cardOf.has(el)) return;
      e.preventDefault();
      const { card, owner } = cardOf.get(el);
      hideTooltip(); window.openCardDetailModal(card, owner, el);
    });
    // กลืนคลิกที่ตามมาหลังการเปิดหน้าต่างรายละเอียด ไม่ให้ไปเลือกการ์ด/ลงสนามโดยไม่ตั้งใจ
    document.addEventListener('click', e => {
      if (performance.now() < suppressClickUntil) { e.stopPropagation(); e.preventDefault(); }
    }, true);
  }

  // จำการ์ดที่ถูกแตะล่าสุด ใช้เป็นจุดเริ่มแอนิเมชันบินขึ้น (FLIP)
  let lastTouched = null, lastTouchedAt = 0;
  document.addEventListener('pointerdown', e => {
    const el = e.target.closest('.card');
    if (el) { lastTouched = el; lastTouchedAt = performance.now(); }
  }, true);

  // ============================================================================
  // INSPECT
  // ============================================================================
  let ov, big, current, origin, idleRaf = 0, fxRaf = 0, gyroOn = false, closeSeq = 0;

  function buildOverlay() {
    ov = document.createElement('div');
    ov.className = 'holo-inspect'; ov.hidden = true;
    ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true'); ov.setAttribute('aria-labelledby', 'holo-i-name');
    ov.innerHTML = `
      <button class="holo-close" type="button" aria-label="ปิด">✕</button>
      <div class="holo-stage">
        <div class="holo-big"></div>
        <div class="holo-info">
          <div class="holo-row"><span class="holo-chip" id="holo-i-chip"></span><span class="holo-tag" id="holo-i-type"></span></div>
          <h2 id="holo-i-name"></h2>
          <div class="holo-stats" id="holo-i-stats"></div>
          <div class="holo-desc" id="holo-i-desc"></div>
        </div>
      </div>`;
    document.body.appendChild(ov);
    big = ov.querySelector('.holo-big');
    ov.querySelector('.holo-close').onclick = close;
    ov.addEventListener('click', e => { if (e.target === ov || e.target.classList.contains('holo-stage')) close(); });
    addEventListener('keydown', e => { if (e.key === 'Escape' && !ov.hidden) close(); });
  }

  function statsTextFor(card, owner) {
    // คงข้อความเดียวกับ openCardDetailModal เดิม
    if (card.type === 'Monster') {
      const effPwr = owner ? getEffectivePower(card, owner) : card.power;
      return `⚔️ พลังโจมตี: ${effPwr} (พื้นฐาน: ${card.power})\n🃏 ใส่ในเด็คได้สูงสุด: ${getCardMaxCopies(card)} ใบ`;
    }
    if (card.type === 'Leader') {
      const hp = card.hp !== undefined ? `${card.hp} / ${card.maxHp}` : card.maxHp;
      return `👑 พลังชีวิต (HP): ${hp}`;
    }
    return `✨ การ์ดเวทมนตร์ (${card.type})\n🃏 ใส่ในเด็คได้สูงสุด: ${getCardMaxCopies(card)} ใบ`;
  }

  function open(card, owner, fromEl) {
    if (!card) return;
    if (!ov) buildOverlay();
    closeSeq++; // ยกเลิกตัวจับเวลาปิดของรอบก่อน
    suppressClickUntil = performance.now() + 500; // กันคลิกที่ตามหลังการแตะค้าง
    stopIdle(); stopFx();
    if (origin) origin.style.visibility = '';
    const rarity = rarityOf(card);
    origin = fromEl || (performance.now() - lastTouchedAt < 1500 ? lastTouched : null);
    if (origin && !origin.isConnected) origin = null;

    current = document.createElement('div');
    current.className = 'holo-bigcard'; current.dataset.rarity = rarity;
    current.innerHTML = `<img src="${card.image}" alt="${card.name}" draggable="false">${holoLayersHTML()}`;
    addStars(current, rarity);
    big.replaceChildren(current);

    const chip = ov.querySelector('#holo-i-chip'); chip.className = 'holo-chip ' + rarity; chip.textContent = rarity;
    ov.querySelector('#holo-i-type').textContent = TYPE_TH[card.type] || card.type;
    ov.querySelector('#holo-i-name').textContent = card.name;
    ov.querySelector('#holo-i-stats').textContent = statsTextFor(card, owner);
    ov.querySelector('#holo-i-desc').textContent = typeof getCardDescription === 'function' ? getCardDescription(card) : (card.desc || '');

    ov.hidden = false; document.body.classList.add('holo-inspecting');
    if (origin) origin.classList.remove('holo-live');
    const seq = closeSeq, card3d = current, img = card3d.querySelector('img');
    card3d.style.opacity = '0';
    const reveal = () => {
      if (seq !== closeSeq || ov.hidden || current !== card3d) return;
      card3d.style.opacity = '';
      flipIn(card3d);
    };
    // ถอดรหัสรูป PNG ขนาดใหญ่ให้เสร็จก่อน ไม่งั้นการ์ดใบใหญ่จะว่างเปล่าระหว่างแอนิเมชัน
    (img && img.decode ? img.decode() : Promise.resolve()).catch(() => {}).then(reveal);
    requestAnimationFrame(() => ov.classList.add('open'));
    ov.querySelector('.holo-close').focus({ preventScroll: true });
    bindDrag(); startIdle(); startFx(); enableGyro();
  }

  function flipIn(card3d) {
    if (!reduceMotion && origin && origin.isConnected) {
      const to = card3d.getBoundingClientRect(), from = origin.getBoundingClientRect();
      if (!(to.width > 0 && from.width > 0)) return; // กันค่า scale เป็น Infinity/0 ทำให้การ์ดหาย
      card3d.animate([
        { transform: `translate(${from.left - to.left}px, ${from.top - to.top}px) scale(${from.width / to.width})`, transformOrigin: 'top left' },
        { transform: 'translate(0,0) scale(1) rotateY(-14deg)', transformOrigin: 'top left', offset: .7 },
        { transform: 'none', transformOrigin: 'top left' }
      ], { duration: 620, easing: 'cubic-bezier(.2,.9,.25,1)' });
      origin.style.visibility = 'hidden';
    }
  }

  function close() {
    if (!ov || ov.hidden) return;
    stopIdle(); stopFx(); disableGyro();
    ov.classList.remove('open');
    const o = origin; origin = null;
    let done = false; const seq = ++closeSeq;
    const fin = () => { if (done || seq !== closeSeq) return; done = true; ov.hidden = true; document.body.classList.remove('holo-inspecting'); if (o) o.style.visibility = ''; };
    setTimeout(fin, 600); // กันค้าง: ถึงแอนิเมชันปิดไม่จบ หน้าต่างก็ต้องปิด
    if (reduceMotion || !o || !o.isConnected) return fin();
    const to = o.getBoundingClientRect(), from = current.getBoundingClientRect();
    current.animate([{ transform: 'none', transformOrigin: 'top left' },
      { transform: `translate(${to.left - from.left}px, ${to.top - from.top}px) scale(${to.width / from.width})`, transformOrigin: 'top left' }],
      { duration: 380, easing: 'cubic-bezier(.4,0,.2,1)', fill: 'forwards' }).onfinish = fin;
  }

  function bindDrag() {
    let dragging = false, sx = 0, sy = 0;
    let raf = 0, lx = 0, ly = 0;
    big.onpointerdown = e => {
      if (reduceMotion || e.button !== 0) return;
      dragging = true; sx = e.clientX; sy = e.clientY;
      stopIdle(); current.classList.add('holo-live', 'dragging');
      big.setPointerCapture(e.pointerId);
    };
    big.onpointermove = e => {
      if (!dragging) return;
      lx = e.clientX; ly = e.clientY;
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0; if (!dragging) return;
        const w = current.offsetWidth || 1, h = current.offsetHeight || 1; // ขนาดก่อนเอียง (ไม่ต้องคำนวณ transform)
        const px = Math.max(-.4, Math.min(1.4, .5 + (lx - sx) / w));
        const py = Math.max(-.4, Math.min(1.4, .5 + (ly - sy) / h));
        applyTilt(current, px, py, 28);
      });
    };
    big.onpointerup = big.onpointercancel = () => {
      if (!dragging) return; dragging = false;
      current.classList.remove('dragging'); resetTilt(current);
      setTimeout(() => { if (!ov.hidden && !gyroOn) startIdle(); }, 500);
    };
  }

  function startIdle() {
    if (reduceMotion || gyroOn) return; stopIdle(); const t0 = performance.now();
    const tick = t => {
      const k = (t - t0) / 1000; current.classList.add('holo-live');
      applyTilt(current, .5 + Math.sin(k * .9) * .28, .5 + Math.cos(k * .7) * .2, 10);
      idleRaf = requestAnimationFrame(tick);
    };
    idleRaf = requestAnimationFrame(tick);
  }
  function stopIdle() { cancelAnimationFrame(idleRaf); }

  // ไจโร (มือถือ): iOS ต้องขอสิทธิ์จากการแตะของผู้ใช้ ถ้าไม่ได้ก็ใช้การลากนิ้วแทน
  function onOrient(e) {
    if (e.gamma == null || !current) return;
    const px = Math.max(0, Math.min(1, .5 + e.gamma / 50));
    const py = Math.max(0, Math.min(1, .5 + (e.beta - 45) / 50));
    current.classList.add('holo-live'); applyTilt(current, px, py, 18);
  }
  function enableGyro() {
    if (reduceMotion || canHover || typeof DeviceOrientationEvent === 'undefined') return;
    const go = () => { gyroOn = true; stopIdle(); addEventListener('deviceorientation', onOrient); };
    if (typeof DeviceOrientationEvent.requestPermission === 'function') {
      DeviceOrientationEvent.requestPermission().then(s => { if (s === 'granted') go(); }).catch(() => {});
    } else go();
  }
  function disableGyro() { gyroOn = false; removeEventListener('deviceorientation', onOrient); }

  // ละอองทองรอบการ์ด (Legend เท่านั้น)
  function startFx() {
    stopFx(); if (reduceMotion || !current || current.dataset.rarity !== 'Legend') return;
    const cv = document.createElement('canvas'); cv.id = 'holo-fx'; big.append(cv);
    const g = cv.getContext('2d'); const dpr = Math.min(devicePixelRatio || 1, 2);
    cv.width = cv.clientWidth * dpr; cv.height = cv.clientHeight * dpr;
    const W = cv.width, H = cv.height, ps = [];
    const spawn = () => {
      const x0 = W * .1875, x1 = W * .8125, y0 = H * .143, y1 = H * .857, side = Math.random() < .5;
      const x = side ? (Math.random() < .5 ? x0 : x1) + (Math.random() - .5) * 20 * dpr : x0 + Math.random() * (x1 - x0);
      const y = side ? y0 + Math.random() * (y1 - y0) : y1;
      ps.push({ x, y, vx: (Math.random() - .5) * .3 * dpr, vy: -(0.4 + Math.random() * .9) * dpr, r: (0.8 + Math.random() * 1.8) * dpr, life: 0, max: 90 + Math.random() * 90 });
    };
    const tick = () => {
      g.clearRect(0, 0, W, H);
      if (ps.length < 70) { spawn(); spawn(); }
      g.globalCompositeOperation = 'lighter';
      for (let i = ps.length - 1; i >= 0; i--) {
        const p = ps[i]; p.life++;
        if (p.life >= p.max) { ps.splice(i, 1); continue; }
        p.x += p.vx + Math.sin((p.life + i) * .05) * .25 * dpr; p.y += p.vy;
        const a = Math.sin(Math.PI * p.life / p.max);
        const grd = g.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 4);
        grd.addColorStop(0, `rgba(255,236,170,${a})`); grd.addColorStop(.35, `rgba(243,180,70,${a * .5})`); grd.addColorStop(1, 'rgba(243,160,60,0)');
        g.fillStyle = grd; g.beginPath(); g.arc(p.x, p.y, p.r * 4, 0, 7); g.fill();
      }
      fxRaf = requestAnimationFrame(tick);
    };
    fxRaf = requestAnimationFrame(tick);
  }
  function stopFx() { cancelAnimationFrame(fxRaf); const c = document.getElementById('holo-fx'); if (c) c.remove(); }

  // ============================================================================
  // ห่อฟังก์ชันเดิมของ game.js
  // ============================================================================
  const origCreate = window.createCardElement;
  window.createCardElement = function (card, owner = null) {
    return decorate(origCreate.apply(this, arguments), card, owner);
  };

  window.openCardDetailModal = function (card, owner = null, fromEl = null) {
    open(card, owner, fromEl);
  };

  const origDeck = window.renderDeckBuilder;
  window.renderDeckBuilder = function () {
    const r = origDeck.apply(this, arguments);
    const leaders = CARD_DATABASE.filter(c => c.type === 'Leader');
    document.querySelectorAll('#leader-pool-list .card').forEach((el, i) => decorate(el, leaders[i], null));
    return r;
  };

  // จั่วการ์ด: ใบที่เพิ่งเข้ามือได้แอนิเมชันบินเข้า
  let prevHand = null;
  const origRender = window.renderGame;
  window.renderGame = function () {
    const r = origRender.apply(this, arguments);
    const p = (typeof gameState !== 'undefined' && gameState) ? gameState.player : null;
    if (p && p.hand) {
      const ids = p.hand.map(c => c.uid);
      if (prevHand && !reduceMotion) {
        const els = document.querySelectorAll('#player-hand .card');
        ids.forEach((u, i) => { if (u !== undefined && !prevHand.has(u) && els[i]) els[i].classList.add('fx-holo-draw'); });
      }
      prevHand = new Set(ids);
    }
    return r;
  };

  bindTilt(document.getElementById('player-hand'), 12);
  bindLongPress();
  window.HoloTilt = { bind: bindTilt };
})();
