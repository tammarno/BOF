/* ============================================================================
   PANEL MOTION (BOF v0.6) — โหลดหลัง choice-ui.js (ไฟล์สุดท้าย)
   งานที่ยังเป็น UI เก่า: หน้าต่างจัดเด็ค / คลังการ์ด / Mulligan / Intercept / ลูกเต๋า
   - เปิด: กล่องเด้งเข้า + เนื้อหาไหลตามกัน · ปิด (ที่ผู้เล่นกดเอง): หดหายก่อนปิดจริง
   - ปุ่มจัดเด็ค: ชี้ยก / กดยุบ-เด้ง · เมนูบนล็อบบี้: เส้นใต้ + กดยุบ
   - การ์ดในหน้าจัดเด็ค: ใส่ = เด้ง+แสงเขียว · เอาออก = ยุบ+แสงเทา · เต็ม = สั่น
   ไม่แก้ game.js: อ่านสถานะจากภายนอก (MutationObserver + ฟัง click)
   กฎ: transform/opacity เท่านั้น · ไม่ขยับตัวปุ่มตอนเปิดหน้าต่าง (ปุ่มมีเอฟเฟกต์ชี้เมาส์อยู่แล้ว)
   ============================================================================ */
(function () {
  const hasGsap = typeof gsap !== 'undefined';
  const reduce = !hasGsap || matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = s => document.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const visible = el => !!el && el.style.display !== 'none' && getComputedStyle(el).display !== 'none';

  // หน้าต่างที่ดูแล: id → { box, list (ลูกที่ไหลเข้าทีละใบ), tone }
  const PANELS = {
    // heavy: มีการ์ด holo หลายสิบใบ — การจางทั้งกล่อง (opacity ของแม่) บังคับให้วาดการ์ดทุกใบรวมใหม่ทุกเฟรม (วัดแล้ว 33–50 ms/เฟรม)
    // → ขยับกล่องด้วย transform อย่างเดียว แล้วจางด้วย "ม่าน" สีเดียวกับกล่องที่ค่อย ๆ โปร่งออก (ชั้นเดียว เบามาก)
    'deck-builder-modal': { box: '.deck-builder-box', heavy: true },
    'zone-viewer-modal': { box: '.modal-box', heavy: true },
    'mulligan-modal': { box: '.modal-box', list: '#mulligan-card-list > *', deal: true },
    'intercept-modal': { box: '.modal-box', list: '#intercept-card-list > *' },
    'dice-modal': { box: '.dice-box' },
  };
  const MAX_STAGGER = 14; // ไหลเข้าเฉพาะการ์ดแถวแรก ๆ ที่เห็นบนจอ ที่เหลือแสดงทันที (ประหยัดเฟรม)

  // ---------- ปุ่มเก่า → ชุดสีของธีม ----------
  const SKIN = {
    'btn-save-start': 'pm-btn-primary',
    'btn-default-deck': 'pm-btn-ice',
    'btn-reset-deck': 'pm-btn-ghost',
    'btn-close-zone-viewer': 'pm-btn-danger',
    'btn-skip-intercept': 'pm-btn-danger',
  };
  function skinButtons() {
    for (const [id, cls] of Object.entries(SKIN)) {
      const b = document.getElementById(id);
      if (b && !b.classList.contains(cls)) b.classList.add('pm-btn', cls);
    }
  }

  // เฟรมแรกหลังเปิดหน้าต่าง/วาดการ์ดใหม่หนักมาก (การ์ด holo 30 ใบ) — ถ้าเริ่มนับเวลาตอนนี้ GSAP จะกระโดดข้ามแอนิเมชันเกือบทั้งหมด
  // → วางท่าเริ่มทันที (immediateRender) แล้วค่อยเล่นหลังเบราว์เซอร์วาดเฟรมหนักเสร็จ (2 rAF)
  function playSoon(anim) {
    anim.pause();
    requestAnimationFrame(() => requestAnimationFrame(() => { if (anim.paused() && anim.progress() < 1 && !anim._pmKilled) anim.play(); }));
    return anim;
  }

  // ---------- เปิดหน้าต่าง ----------
  const shown = new Map();
  function onOpen(modal, cfg) {
    skinButtons();
    modal.classList.add('pm-panel');
    if (reduce) return;
    const box = modal.querySelector(cfg.box); if (!box) return;
    // เนื้อหาที่ไหลตาม: ลูกโดยตรงของกล่อง ยกเว้นปุ่ม (ปุ่มขยับตามกล่อง ไม่ขยับเอง)
    const parts = [...box.children].filter(c => !c.matches('.btn') && !c.classList.contains('um-x'));
    const items = cfg.list ? $$(cfg.list, modal).slice(0, MAX_STAGGER) : [];
    gsap.killTweensOf([box, ...parts, ...items]);
    const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });
    if (cfg.heavy) {
      box.querySelectorAll(':scope > .pm-curtain').forEach(n => n.remove());
      const cur = document.createElement('i'); cur.className = 'pm-curtain'; cur.setAttribute('aria-hidden', 'true');
      box.appendChild(cur);
      tl.fromTo(box, { y: 28 }, { y: 0, duration: .36, ease: 'back.out(1.3)', clearProps: 'transform' }, 0)
        .fromTo(cur, { opacity: 1 }, { opacity: 0, duration: .32, ease: 'power1.out', onComplete: () => cur.remove(), onInterrupt: () => cur.remove() }, .04);
      modal._pmTl = playSoon(tl);
      return;
    }
    tl.fromTo(box, { scale: .92, opacity: 0, y: 14 }, { scale: 1, opacity: 1, y: 0, duration: .32, ease: 'back.out(1.5)', clearProps: 'transform,opacity' }, 0);
    if (parts.length) tl.fromTo(parts, { y: 12, opacity: 0 }, { y: 0, opacity: 1, duration: .28, stagger: .045, clearProps: 'transform,opacity' }, .06);
    if (items.length) {
      const restore = noTransition(items);
      tl.eventCallback('onComplete', restore); tl.eventCallback('onInterrupt', restore);
      tl.fromTo(items, cfg.deal ? { y: 60, rotation: i => (i - items.length / 2) * 4, opacity: 0 } : { y: 18, scale: .94, opacity: 0 },
        { y: 0, rotation: 0, scale: 1, opacity: 1, duration: cfg.deal ? .45 : .3, stagger: cfg.deal ? .07 : .025, ease: cfg.deal ? 'back.out(1.6)' : 'power2.out', clearProps: 'transform,opacity' }, .14);
    }
    modal._pmTl = playSoon(tl);
  }
  function onClose(modal) {
    if (modal._pmTl) { modal._pmTl._pmKilled = true; modal._pmTl.progress(1).kill(); modal._pmTl = null; }
    modal.querySelectorAll('.pm-curtain').forEach(n => n.remove());
    modal._pmClosing = false;
  }
  function checkPanels() {
    for (const [id, cfg] of Object.entries(PANELS)) {
      const m = document.getElementById(id); if (!m) continue;
      const v = visible(m), was = shown.get(m) || false;
      if (v && !was) onOpen(m, cfg); else if (!v && was) onClose(m);
      shown.set(m, v);
    }
  }
  // เฝ้า style ของแต่ละหน้าต่าง (หน้าต่างคลังการ์ดถูกสร้างทีหลัง จึงเฝ้า body ด้วย)
  const watched = new WeakSet();
  const panelMo = new MutationObserver(checkPanels);
  function watchPanels() {
    Object.keys(PANELS).forEach(id => {
      const m = document.getElementById(id);
      if (m && !watched.has(m)) { watched.add(m); panelMo.observe(m, { attributes: true, attributeFilter: ['style'] }); }
    });
    skinButtons();
  }
  new MutationObserver(() => { watchPanels(); checkPanels(); }).observe(document.body, { childList: true });
  watchPanels(); checkPanels();

  // ---------- ปิดหน้าต่าง (ปุ่มที่ผู้เล่นกดเอง): หดก่อน แล้วค่อยส่งคลิกต่อให้ game.js ----------
  const CLOSERS = [
    { btn: '#btn-close-zone-viewer', modal: '#zone-viewer-modal', box: '.modal-box' },
    // บันทึกเด็ค: เกมปิดเฉพาะตอนครบ 20 ใบ — ไม่ครบให้ผ่านไปตามเดิม
    { btn: '#btn-save-start', modal: '#deck-builder-modal', box: '.deck-builder-box',
      when: () => typeof currentDeckConfig !== 'undefined' && currentDeckConfig.mainDeck.length === 20 },
  ];
  document.addEventListener('click', e => {
    if (reduce) return;
    for (const c of CLOSERS) {
      const btn = e.target.closest(c.btn); if (!btn) continue;
      if (btn._pmPass || btn.disabled || (c.when && !c.when())) return;
      const modal = $(c.modal), box = modal && modal.querySelector(c.box);
      if (!box) return;
      e.stopImmediatePropagation(); e.preventDefault();
      if (modal._pmClosing) return; // ดับเบิลคลิก: ปิดครั้งเดียว
      modal._pmClosing = true;
      if (modal._pmTl) { modal._pmTl._pmKilled = true; modal._pmTl.progress(1).kill(); modal._pmTl = null; }
      const finish = () => {
        btn._pmPass = true; btn.click(); btn._pmPass = false;
        gsap.set(box, { clearProps: 'transform,opacity' });
        modal.querySelectorAll('.pm-curtain').forEach(n => n.remove());
        modal._pmClosing = false;
      };
      // หน้าต่างการ์ดเยอะ: เลื่อนลง + ม่านปิด (ไม่ย่อ/จางทั้งกล่อง เหตุผลเดียวกับตอนเปิด)
      const cur = document.createElement('i'); cur.className = 'pm-curtain'; cur.setAttribute('aria-hidden', 'true'); box.appendChild(cur);
      gsap.timeline({ onComplete: finish })
        .to(box, { y: 18, duration: .18, ease: 'power2.in' }, 0)
        .fromTo(cur, { opacity: 0 }, { opacity: 1, duration: .16, ease: 'power1.in' }, 0);
      return;
    }
  }, true);

  // ---------- ปุ่มในหน้าจัดเด็ค: ชี้ยก / กดยุบ-เด้ง (ปุ่มในหน้าต่างอื่นใช้ของ ui-motion.js อยู่แล้ว) ----------
  const BTN = '.deck-builder-box .btn';
  if (!reduce) {
    document.addEventListener('pointerover', e => {
      const b = e.target.closest(BTN); if (!b || b.disabled || e.pointerType !== 'mouse' || b.contains(e.relatedTarget)) return;
      gsap.to(b, { y: -2, scale: 1.04, duration: .12, ease: 'power2.out', overwrite: 'auto' });
    });
    document.addEventListener('pointerout', e => {
      const b = e.target.closest(BTN); if (!b || b.contains(e.relatedTarget)) return;
      gsap.to(b, { y: 0, scale: 1, duration: .2, ease: 'power2.out', overwrite: 'auto' });
    });
    document.addEventListener('pointerdown', e => {
      const b = e.target.closest(BTN); if (!b || b.disabled) return;
      gsap.to(b, { scale: .95, duration: .06, ease: 'power1.out', overwrite: 'auto' });
    });
    document.addEventListener('pointerup', e => {
      const b = e.target.closest(BTN); if (!b) return;
      gsap.to(b, { scale: b.matches(':hover') ? 1.04 : 1, duration: .35, ease: 'back.out(3)', overwrite: 'auto' });
    });
  }

  // ---------- เมนูล็อบบี้ (จัดเด็ค / คลังการ์ด / วิธีเล่น) ----------
  $$('.lb-menu .lb-menu-item').forEach(a => {
    a.classList.add('pm-nav');
    if (reduce) return;
    a.addEventListener('pointerdown', () => gsap.to(a, { scale: .92, duration: .06, ease: 'power1.out', overwrite: 'auto' }));
    const up = () => gsap.to(a, { scale: 1, duration: .35, ease: 'back.out(3)', overwrite: 'auto' });
    a.addEventListener('pointerup', up); a.addEventListener('pointerleave', up);
  });

  // ---------- การ์ดในหน้าจัดเด็ค + Mulligan: ตอบสนองตอนคลิก ----------
  // game.js วาดการ์ดใหม่ทั้งชุดทุกครั้งที่คลิก → จำ "ช่องที่" กับจำนวนก่อนคลิก แล้วเล่นแอนิเมชันกับการ์ดชุดใหม่ช่องเดียวกัน
  // (ฟังที่ document แบบ bubble = ทำงานหลัง onclick ของการ์ด ซึ่งวาดใหม่เสร็จแล้ว)
  let pending = null;
  const deckCount = id => currentDeckConfig.mainDeck.filter(x => x === id).length;
  document.addEventListener('click', e => {
    pending = null;
    const item = e.target.closest('#main-pool-list > .pool-item, #leader-pool-list > .pool-item, #mulligan-card-list > .card');
    if (!item || typeof currentDeckConfig === 'undefined') return;
    const list = item.parentElement, idx = [...list.children].indexOf(item);
    if (list.id === 'main-pool-list') {
      const card = CARD_DATABASE.filter(c => c.type !== 'Leader')[idx];
      if (card) pending = { list: list.id, idx, id: card.id, before: deckCount(card.id), total: currentDeckConfig.mainDeck.length };
    } else if (list.id === 'leader-pool-list') {
      pending = { list: list.id, idx, leader: currentDeckConfig.leaderId };
    } else {
      pending = { list: list.id, idx, sel: typeof gameState !== 'undefined' ? gameState.mulliganSelected.length : 0 };
    }
  }, true);
  document.addEventListener('click', () => {
    const p = pending; pending = null; if (!p || reduce) return;
    const list = document.getElementById(p.list); if (!list) return;
    const el = list.children[p.idx]; if (!el) return;
    if (p.list === 'main-pool-list') {
      const after = deckCount(p.id);
      if (after > p.before) tileFx(el, 'add');
      else if (after < p.before) tileFx(el, 'remove');
      else tileFx(el, 'deny'); // เด็คเต็ม 20 ใบ: เกมแจ้งเตือนแล้ว การ์ดสั่นบอกด้วย
      bumpStatus(p.total !== currentDeckConfig.mainDeck.length);
    } else if (p.list === 'leader-pool-list') {
      if (currentDeckConfig.leaderId !== p.leader) tileFx(el, 'leader');
    } else {
      const now = typeof gameState !== 'undefined' ? gameState.mulliganSelected.length : 0;
      tileFx(el, now > p.sel ? 'add' : now < p.sel ? 'remove' : 'deny');
    }
  });
  // .card ใน style.css มี transition: transform → ปิดชั่วคราวระหว่างที่ GSAP คุม ไม่ให้ไล่ตามกันจนหน่วง
  function noTransition(els) {
    els.forEach(e => { if (e.classList.contains('card')) e.style.transition = 'none'; });
    return () => els.forEach(e => { if (e.classList.contains('card')) e.style.transition = ''; });
  }
  function tileFx(el, kind) {
    const restore = noTransition([el]);
    const flash = document.createElement('i'); flash.className = 'pm-flash pm-flash-' + kind; flash.setAttribute('aria-hidden', 'true');
    el.classList.add('pm-tile'); el.appendChild(flash);
    playSoon(gsap.fromTo(flash, { opacity: .95 }, { opacity: 0, duration: .55, ease: 'power2.out', onComplete: () => flash.remove(), onInterrupt: () => flash.remove() }));
    const done = { clearProps: 'transform', onComplete: restore, onInterrupt: restore };
    if (kind === 'add' || kind === 'leader') playSoon(gsap.fromTo(el, { scale: 1.1 }, { scale: 1, duration: .45, ease: 'back.out(3)', ...done }));
    else if (kind === 'remove') playSoon(gsap.fromTo(el, { scale: .9 }, { scale: 1, duration: .35, ease: 'power2.out', ...done }));
    else playSoon(gsap.fromTo(el, { x: 0 }, { keyframes: { x: [-6, 6, -4, 4, -2, 0] }, duration: .35, ease: 'none', ...done }));
    const badge = el.querySelector('.count-badge');
    if (badge && kind !== 'deny') playSoon(gsap.fromTo(badge, { scale: 1.25 }, { scale: 1, duration: .4, ease: 'back.out(3)', clearProps: 'transform' }));
  }
  function bumpStatus(changed) {
    const s = $('#deck-status-text'); if (!s || !changed) return;
    playSoon(gsap.fromTo(s, { scale: 1.12 }, { scale: 1, duration: .35, ease: 'back.out(3)', clearProps: 'transform' }));
  }

  // เด็คครบ 20 ใบ: ปุ่มบันทึกหายใจเรียกให้กด (ใช้ class เดียวกับปุ่ม Phase ใน ui-motion.css)
  function syncSaveReady() {
    const b = $('#btn-save-start'); if (!b) return;
    b.classList.toggle('lm-breathe', !b.disabled && visible($('#deck-builder-modal')));
  }
  const saveBtn = $('#btn-save-start');
  if (saveBtn) new MutationObserver(syncSaveReady).observe(saveBtn, { attributes: true, attributeFilter: ['disabled'] });
  const dbm = $('#deck-builder-modal');
  if (dbm) new MutationObserver(syncSaveReady).observe(dbm, { attributes: true, attributeFilter: ['style'] });

  window.PanelMotion = { ready: hasGsap, _check: checkPanels };
})();
