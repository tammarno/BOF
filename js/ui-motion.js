/* ============================================================================
   UI MOTION (BOF v0.4) — โหลดหลัง vendor/gsap.min.js และ game.js
   หน้าต่างดวล/ตั้งค่าบอท: เปิด-ปิด, ตัวเลือก, ช่องรหัส, ลูปไอคอน
   ปุ่ม: กดแล้วยุบทันที · กระดาน: เข้าเกม, ป้ายเทิร์น, ปุ่ม Phase, HP, ช่องว่าง, ตัวเลขเด้ง
   ไม่แก้ game.js: อ่านสถานะจากภายนอก (MutationObserver + ตรวจทุก 150 ms)
   ============================================================================ */
(function () {
  if (typeof gsap === 'undefined') { window.UIMotion = { ready: false }; return; }
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = s => document.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const visible = el => !!el && el.style.display !== 'none' && getComputedStyle(el).display !== 'none';
  const MODALS = ['#pvp-room-modal', '#ai-setup-modal'];
  const iconLoops = new Map(); // modal → loop tween

  // ---------- เตรียมหน้าต่าง ----------
  function wrapTitleIcon(modal) {
    const h2 = modal.querySelector('.modal-box h2');
    if (!h2 || h2.querySelector('.lm-h-ico')) return;
    const t = h2.firstChild; if (!t || t.nodeType !== 3) return;
    const m = t.textContent.match(/^(\s*)(\p{Extended_Pictographic}️?)\s*/u); if (!m) return;
    const ico = document.createElement('span'); ico.className = 'lm-h-ico'; ico.textContent = m[2];
    t.textContent = t.textContent.slice(m[0].length);
    // ไล่สีเฉพาะส่วนข้อความ: ไอคอนต้องอยู่นอกส่วนที่ใช้ background-clip:text
    // (ถ้าอยู่ข้างใน Chromium จะวาดเศษสามเหลี่ยมขาวที่มุมกล่อง)
    const txt = document.createElement('span'); txt.className = 'lm-h-text';
    while (t.nextSibling) txt.appendChild(t.nextSibling);
    txt.insertBefore(t, txt.firstChild);
    h2.appendChild(ico); h2.appendChild(txt);
  }
  function syncOptions(modal) {
    if (typeof aiConfig === 'undefined') return;
    $$('.ai-diff-btn', modal).forEach(b => b.classList.toggle('is-selected', b.dataset.diff === aiConfig.difficulty));
    $$('.ai-deck-btn', modal).forEach(b => b.classList.toggle('is-selected', b.dataset.deck === aiConfig.deckChoice));
  }
  function prepModal(modal) {
    if (modal.dataset.um) return; modal.dataset.um = '1';
    wrapTitleIcon(modal);
    if (modal.id === 'ai-setup-modal') {
      syncOptions(modal);
      modal.addEventListener('click', e => {
        const opt = e.target.closest('.ai-diff-btn, .ai-deck-btn'); if (!opt) return;
        // game.js เปลี่ยน aiConfig ใน onclick ของปุ่ม (ทำงานก่อน listener นี้ที่ bubble ขึ้นมา)
        syncOptions(modal);
        if (!reduce) gsap.fromTo(opt, { scale: .96 }, { scale: 1.03, duration: .35, ease: 'back.out(3)' });
      });
    }
  }

  // ---------- เปิด/ปิดหน้าต่าง ----------
  const lastShown = new WeakMap();
  function onModalShow(modal) {
    prepModal(modal);
    if (modal.id === 'ai-setup-modal') syncOptions(modal);
    if (reduce) return;
    const box = modal.querySelector('.modal-box');
    gsap.killTweensOf([modal, box, ...box.children]);
    // ไม่จางพื้นหลังทั้งจอพร้อมกับขยายกล่อง: วัดแล้วทำให้เฟรมช้า 33 ms หลายเฟรม
    gsap.fromTo(box, { scale: .92, opacity: 0, y: 10 }, { scale: 1, opacity: 1, y: 0, duration: .3, ease: 'back.out(1.6)' });
    gsap.fromTo(box.children, { y: 12, opacity: 0 }, { y: 0, opacity: 1, duration: .28, stagger: .05, delay: .06, ease: 'power2.out', clearProps: 'transform,opacity' });
    startIconLoop(modal);
  }
  function onModalHide(modal) {
    const loop = iconLoops.get(modal);
    if (loop) { loop.revert(); iconLoops.delete(modal); }
  }
  function startIconLoop(modal) {
    onModalHide(modal);
    const ico = modal.querySelector('.lm-h-ico'); if (!ico) return;
    const loop = modal.id === 'pvp-room-modal'
      ? gsap.to(ico, { rotation: 360, duration: 8, ease: 'none', repeat: -1 })
      : gsap.timeline({ repeat: -1, repeatDelay: 3.6, delay: .8 }).to(ico, { scaleY: .15, duration: .07, yoyo: true, repeat: 1, ease: 'power1.inOut' });
    iconLoops.set(modal, loop);
  }
  // ปุ่มปิด: เล่นแอนิเมชันหด 0.18 วิ ก่อน แล้วค่อยส่งคลิกต่อให้ game.js ปิดจริง
  const CLOSERS = { '#btn-close-pvp-modal': '#pvp-room-modal', '#btn-cancel-ai-setup': '#ai-setup-modal' };
  document.addEventListener('click', e => {
    if (reduce) return;
    for (const [btnSel, modalSel] of Object.entries(CLOSERS)) {
      const btn = e.target.closest(btnSel); if (!btn) continue;
      if (btn._umPass) return;
      e.stopImmediatePropagation(); e.preventDefault();
      const modal = $(modalSel), box = modal.querySelector('.modal-box');
      gsap.to(box, { scale: .95, opacity: 0, duration: .18, ease: 'power2.in', onComplete: () => {
        btn._umPass = true; btn.click(); btn._umPass = false;
        gsap.set([modal, box], { clearProps: 'opacity,transform' });
      } });
      return;
    }
  }, true);

  // กด "เข้าร่วม" ตอนช่องว่าง: ช่องสั่นแทนกล่องแจ้งเตือน
  document.addEventListener('click', e => {
    if (!e.target.closest('#btn-join-room')) return;
    const input = $('#input-join-code');
    if (!input || input.value.trim()) return;
    e.stopImmediatePropagation(); e.preventDefault();
    input.classList.add('um-invalid'); input.focus();
    if (!reduce) gsap.fromTo(input, { x: 0 }, { keyframes: { x: [-8, 8, -6, 6, -3, 0] }, duration: .35, ease: 'none' });
    setTimeout(() => input.classList.remove('um-invalid'), 900);
  }, true);

  // ---------- ปุ่มกด (ทุกปุ่มในหน้าต่างและกระดาน ใช้ delegation เพราะกระดานถูกวาดใหม่บ่อย) ----------
  const BTN = '.modal-box .btn, .game-container .btn';
  if (!reduce) {
    document.addEventListener('pointerover', e => {
      const b = e.target.closest(BTN); if (!b || b.disabled || e.pointerType !== 'mouse' || b.contains(e.relatedTarget)) return;
      gsap.to(b, { y: -2, scale: 1.03, duration: .12, ease: 'power2.out', overwrite: 'auto' });
    });
    document.addEventListener('pointerout', e => {
      const b = e.target.closest(BTN); if (!b || b.contains(e.relatedTarget)) return;
      gsap.to(b, { y: 0, scale: 1, duration: .2, ease: 'power2.out', overwrite: 'auto' });
    });
    document.addEventListener('pointerdown', e => {
      const b = e.target.closest(BTN); if (!b || b.disabled) return;
      gsap.to(b, { scale: .96, duration: .06, ease: 'power1.out', overwrite: 'auto' });
    });
    document.addEventListener('pointerup', e => {
      const b = e.target.closest(BTN); if (!b) return;
      gsap.to(b, { scale: b.matches(':hover') ? 1.03 : 1, duration: .35, ease: 'back.out(3)', overwrite: 'auto' });
    });
  }

  // ---------- กระดาน ----------
  const board = $('.game-container');
  const BUMP_IDS = ['ai-deck-count', 'ai-grave-count', 'player-deck-count', 'player-grave-count', 'ai-hand-count', 'ai-dark-count', 'player-dark-count'];
  let gameShown = false, last = {};
  function boardIntro() {
    if (reduce) return;
    gsap.fromTo('.ai-side-zone', { y: -40, opacity: 0 }, { y: 0, opacity: 1, duration: .55, ease: 'power3.out', clearProps: 'opacity' });
    gsap.fromTo('.player-side-zone', { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: .55, delay: .1, ease: 'power3.out', clearProps: 'opacity' });
    gsap.fromTo('.center-bar', { scaleX: .6, opacity: 0 }, { scaleX: 1, opacity: 1, duration: .45, delay: .3, ease: 'back.out(1.6)', clearProps: 'opacity' });
    gsap.fromTo('.action-log-container', { opacity: 0 }, { opacity: 1, duration: .4, delay: .55, clearProps: 'opacity' });
  }
  let banner = null;
  function showTurnBanner(who) {
    if (!banner) {
      banner = document.createElement('div'); banner.id = 'lm-turn-banner'; banner.setAttribute('aria-hidden', 'true');
      banner.innerHTML = '<div class="um-band"></div>'; document.body.appendChild(banner);
    }
    banner.classList.toggle('is-ai', who !== 'player');
    banner.firstChild.textContent = who === 'player' ? '⚔️ เทิร์นของคุณ' : '🤖 เทิร์นฝ่ายตรงข้าม';
    gsap.killTweensOf([banner, banner.firstChild]);
    if (reduce) { gsap.set(banner, { opacity: 1 }); gsap.to(banner, { opacity: 0, duration: .01, delay: .8 }); return; }
    gsap.timeline()
      .fromTo(banner, { opacity: 0 }, { opacity: 1, duration: .15 }, 0)
      .fromTo(banner.firstChild, { xPercent: -60, scaleY: .6 }, { xPercent: 0, scaleY: 1, duration: .25, ease: 'power3.out' }, 0)
      .to(banner.firstChild, { xPercent: 60, duration: .25, ease: 'power2.in' }, .55)
      .to(banner, { opacity: 0, duration: .2 }, .6);
  }
  function wrapHearts() {
    $$('.game-container .hp-badge').forEach(b => {
      if (b.querySelector('.um-heart')) return;
      const t = [...b.childNodes].find(n => n.nodeType === 3 && /❤/.test(n.textContent)); if (!t) return;
      const h = document.createElement('span'); h.className = 'um-heart'; h.textContent = '❤️';
      t.textContent = t.textContent.replace(/❤️?/, ''); b.insertBefore(h, t);
    });
    ['#ai-leader-box', '#player-leader-box'].forEach(s => { const el = $(s); if (el && !el.querySelector('.um-hit')) el.insertAdjacentHTML('beforeend', '<i class="um-hit" aria-hidden="true"></i>'); });
  }
  function hit(boxSel) {
    const box = $(boxSel); if (!box || reduce) return;
    gsap.fromTo(box, { x: 0 }, { keyframes: { x: [-7, 7, -5, 5, -2, 0] }, duration: .4, ease: 'none' });
    const f = box.querySelector('.um-hit'); if (f) gsap.fromTo(f, { opacity: .9 }, { opacity: 0, duration: .5, ease: 'power2.out' });
  }
  function bump(el) { if (el && !reduce) gsap.fromTo(el, { scale: 1.35 }, { scale: 1, duration: .4, ease: 'back.out(3)' }); }

  function readGame() {
    const gs = typeof gameState !== 'undefined' ? gameState : null; if (!gs) return null;
    const v = { turn: gs.activeTurn, phase: gs.phase, sel: gs.selectedHandIndex, over: gs.gameOver,
      aiHp: gs.ai && gs.ai.leader ? gs.ai.leader.hp : null, plHp: gs.player && gs.player.leader ? gs.player.leader.hp : null };
    BUMP_IDS.forEach(id => { const e = document.getElementById(id); v[id] = e ? e.textContent : null; });
    return v;
  }
  function checkBoard() {
    const show = visible(board);
    if (show && !gameShown) { gameShown = true; wrapHearts(); boardIntro(); last = readGame() || {}; last.turn = null; return; }
    if (!show) { gameShown = false; return; }
    const v = readGame(); if (!v) return;
    const mulligan = visible($('#mulligan-modal'));
    if (!mulligan && v.turn && v.turn !== last.turn && !v.over) showTurnBanner(v.turn);
    if (last.aiHp != null && v.aiHp < last.aiHp) hit('#ai-leader-box');
    if (last.plHp != null && v.plHp < last.plHp) hit('#player-leader-box');
    BUMP_IDS.forEach(id => { if (last[id] != null && v[id] != null && v[id] !== last[id]) bump(document.getElementById(id)); });
    const pb = $('#player-board'); if (pb) pb.classList.toggle('lm-placing', v.sel != null && v.turn === 'player');
    const phaseBtn = $('#btn-pass-turn-inline');
    if (phaseBtn) phaseBtn.classList.toggle('lm-breathe', v.turn === 'player' && !phaseBtn.disabled && !v.over);
    if (mulligan) v.turn = null; // ป้ายเทิร์นแรกแสดงหลังเลือก Mulligan เสร็จ
    last = v;
  }

  // ---------- ตัวเฝ้า ----------
  function checkModals() {
    MODALS.forEach(sel => {
      const m = $(sel); if (!m) return;
      const v = visible(m), was = lastShown.get(m) || false;
      if (v && !was) onModalShow(m); else if (!v && was) onModalHide(m);
      lastShown.set(m, v);
    });
  }
  // เฝ้า style ของหน้าต่างแต่ละอันโดยตรง (ทำงานก่อนวาดเฟรมถัดไป = ไม่เห็นหน้าต่างแวบก่อนแอนิเมชัน)
  // ไม่เฝ้าทั้งหน้า เพราะกระดานเปลี่ยน style ตลอดเวลา
  const watched = new WeakSet();
  const modalMo = new MutationObserver(checkModals);
  function watchModals() {
    MODALS.forEach(sel => { const m = $(sel); if (m && !watched.has(m)) { watched.add(m); modalMo.observe(m, { attributes: true, attributeFilter: ['style'] }); } });
  }
  new MutationObserver(() => { watchModals(); checkModals(); }).observe(document.body, { childList: true });
  watchModals();
  setInterval(() => { checkModals(); checkBoard(); }, 150);
  document.addEventListener('click', () => requestAnimationFrame(checkBoard), true);

  window.UIMotion = { ready: true, showTurnBanner, _check: () => { checkModals(); checkBoard(); } };
})();
