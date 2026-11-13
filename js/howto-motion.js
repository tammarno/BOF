/* ============================================================================
   HOWTO MOTION: โมชั่น + การเลื่อนของหน้าวิธีเล่น (#lb-howto-dialog) ใช้ภาษาเดียวกับ BOFFX "ตราทอง"
   - แถบเลือกเด็ค: ปุ่มลูกศรซ้าย/ขวา + ขอบจาง (โผล่เฉพาะฝั่งที่ยังเลื่อนได้) · ล้อเมาส์เลื่อนแนวนอน · ลากด้วยเมาส์
     เด็คที่เลือกเลื่อนมาอยู่กลางเสมอ · เพิ่มเด็คกี่สำรับก็ได้ ไม่ต้องแก้ไฟล์นี้
   - แถบเด็คติดใต้หัวหน้าต่างตอนเลื่อนดูคอมโบ (ความสูงหัวคำนวณจริงใส่ --howto-head)
   - เปิดหน้าต่าง: หัว/แท็บ/เนื้อหาไหลเข้าทีละชั้น · สลับแท็บ: แถบทองเลื่อนตาม + เนื้อหาใหม่ไหลเข้า
   - สลับเด็ค: ภาพรวม + การ์ดคอมโบไหลเข้า · เลื่อนลง: การ์ดคอมโบที่ยังไม่เคยเห็นค่อยลอยขึ้น
   ไม่แตะ game.js · transform/opacity เท่านั้น · reduced motion = ไม่มีโมชั่น (แต่ปุ่มเลื่อนยังทำงาน)
   ============================================================================ */
(function () {
  const dlg = document.getElementById('lb-howto-dialog');
  if (!dlg) return;
  const reduce = typeof gsap === 'undefined' || matchMedia('(prefers-reduced-motion: reduce)').matches;
  const E = (window.BOFFX && BOFFX.ease) || { lift: 'power2.out', settle: 'back.out(2.4)', fly: 'power3.inOut' };
  const $ = (s, r = dlg) => r.querySelector(s);
  const $$ = (s, r = dlg) => [...r.querySelectorAll(s)];
  const flowIn = (els, opt = {}) => {
    if (reduce || !els.length) return;
    gsap.fromTo(els, { opacity: 0, y: opt.y ?? 16 }, { opacity: 1, y: 0, duration: .45, ease: E.lift, stagger: opt.stagger ?? .06, delay: opt.delay || 0, clearProps: 'opacity,transform', overwrite: 'auto' });
  };

  // ---------- ความสูงหัว (ให้แถบเด็คติดใต้หัวพอดี) ----------
  const head = $('.lb-howto-header');
  const setHead = () => { if (head) dlg.style.setProperty('--howto-head', head.offsetHeight + 'px'); };
  if (head && 'ResizeObserver' in window) new ResizeObserver(setHead).observe(head);

  // ---------- แถบเลือกเด็ค ----------
  const tabs = document.getElementById('howto-combo-deck-tabs');
  let bar = null, prevBtn = null, nextBtn = null;
  const ARROW = d => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${d}"/></svg>`;
  function buildBar() {
    if (!tabs || bar) return;
    bar = document.createElement('div');
    bar.className = 'howto-deckbar';
    tabs.before(bar);
    prevBtn = document.createElement('button');
    nextBtn = document.createElement('button');
    prevBtn.type = nextBtn.type = 'button';
    prevBtn.className = 'howto-deck-arrow is-prev'; nextBtn.className = 'howto-deck-arrow is-next';
    prevBtn.setAttribute('aria-label', 'เด็คก่อนหน้า'); nextBtn.setAttribute('aria-label', 'เด็คถัดไป');
    prevBtn.innerHTML = ARROW('M15 5 8 12l7 7'); nextBtn.innerHTML = ARROW('m9 5 7 7-7 7');
    bar.append(prevBtn, tabs, nextBtn);
    const page = dir => scrollStrip(tabs.scrollLeft + dir * Math.max(160, tabs.clientWidth * .7), true);
    prevBtn.onclick = () => page(-1);
    nextBtn.onclick = () => page(1);
    tabs.addEventListener('scroll', syncArrows, { passive: true });
    if ('ResizeObserver' in window) new ResizeObserver(syncArrows).observe(tabs);
    // ล้อเมาส์แนวตั้ง → เลื่อนแนวนอน (เฉพาะตอนแถบเลื่อนได้ และยังไม่ชนขอบ ไม่งั้นปล่อยให้หน้าต่างเลื่อนต่อ)
    tabs.addEventListener('wheel', e => {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX) || tabs.scrollWidth <= tabs.clientWidth) return;
      const max = tabs.scrollWidth - tabs.clientWidth;
      if ((e.deltaY < 0 && tabs.scrollLeft <= 0) || (e.deltaY > 0 && tabs.scrollLeft >= max - 1)) return;
      e.preventDefault();
      if (!reduce) gsap.killTweensOf(tabs);
      tabs.scrollLeft += e.deltaY;
    }, { passive: false });
    // ลากด้วยเมาส์ (นิ้วเลื่อนเองได้อยู่แล้ว) · ลากเกิน 6px = ไม่นับเป็นการกดเลือกเด็ค
    let drag = null;
    tabs.addEventListener('pointerdown', e => { if (e.pointerType === 'mouse' && e.button === 0) drag = { x: e.clientX, left: tabs.scrollLeft, moved: false }; });
    window.addEventListener('pointermove', e => {
      if (!drag) return;
      const dx = e.clientX - drag.x;
      if (Math.abs(dx) > 6) { drag.moved = true; tabs.classList.add('is-dragging'); }
      if (drag.moved) tabs.scrollLeft = drag.left - dx;
    });
    window.addEventListener('pointerup', () => { if (drag && drag.moved) setTimeout(() => tabs.classList.remove('is-dragging'), 0); drag = null; });
    tabs.addEventListener('click', e => { if (tabs.classList.contains('is-dragging')) { e.stopPropagation(); e.preventDefault(); } }, true);
    syncArrows();
  }
  function syncArrows() {
    if (!bar) return;
    const max = tabs.scrollWidth - tabs.clientWidth;
    const atStart = tabs.scrollLeft <= 8, atEnd = tabs.scrollLeft >= max - 8;
    bar.classList.toggle('can-prev', max > 8 && !atStart);
    bar.classList.toggle('can-next', max > 8 && !atEnd);
  }
  // เลื่อนแถบด้วย GSAP (scroll-behavior: smooth บางเบราว์เซอร์ไม่ขยับเมื่อสั่งจาก JS ระหว่างเฟรมช้า)
  function scrollStrip(left, smooth) {
    left = Math.max(0, Math.min(left, tabs.scrollWidth - tabs.clientWidth));
    if (!smooth || reduce) { tabs.scrollLeft = left; syncArrows(); return; }
    gsap.to(tabs, { scrollLeft: left, duration: .45, ease: 'power2.out', overwrite: 'auto', onUpdate: syncArrows });
  }
  function centerActive(smooth) {
    const a = tabs && tabs.querySelector('.is-active');
    if (!a) return;
    scrollStrip(a.offsetLeft - (tabs.clientWidth - a.offsetWidth) / 2, smooth);
  }

  // ---------- แท็บหลัก: แถบทองเลื่อนตามแท็บที่เลือก ----------
  const tabRow = $('.lb-howto-tabs');
  let thumb = null;
  function moveThumb(instant) {
    const a = tabRow && tabRow.querySelector('.lb-howto-tab.is-active');
    if (!a || !thumb) return;
    const to = { x: a.offsetLeft, width: a.offsetWidth };
    if (reduce || instant) gsap ? gsap.set(thumb, to) : Object.assign(thumb.style, { transform: `translateX(${to.x}px)`, width: to.width + 'px' });
    else gsap.to(thumb, { ...to, duration: .4, ease: E.settle, overwrite: 'auto' });
  }
  if (tabRow && typeof gsap !== 'undefined') {
    thumb = document.createElement('i');
    thumb.className = 'howto-tab-thumb';
    tabRow.prepend(thumb);
    tabRow.classList.add('has-thumb');
    if ('ResizeObserver' in window) new ResizeObserver(() => moveThumb(true)).observe(tabRow);
    $$('.lb-howto-tab').forEach(t => t.addEventListener('click', () => requestAnimationFrame(() => {
      moveThumb();
      const pane = $$('.lb-howto-pane').find(p => p.style.display !== 'none');
      if (pane) paneIn(pane);
    })));
  }
  function paneIn(pane) {
    if (pane.id === 'howto-pane-combos') {
      requestAnimationFrame(() => { syncArrows(); centerActive(false); });
      flowIn($$('.lb-combo-deck-pill', pane), { y: 10, stagger: .04 });
      flowIn($$('#howto-combo-content > *', pane).slice(0, 2), { delay: .12 });
    } else {
      flowIn($$('.lb-steps > li, .lb-zone-guide-card, .lb-howto-tutorial-banner', pane), { stagger: .05 });
    }
  }

  // ---------- เปิดหน้าต่าง ----------
  new MutationObserver(() => {
    if (!dlg.open) return;
    setHead();
    buildBar();
    moveThumb(true);
    requestAnimationFrame(() => { syncArrows(); centerActive(false); });
    if (reduce) return;
    flowIn([head, tabRow].filter(Boolean), { y: -10, stagger: .07 });
    const pane = $$('.lb-howto-pane').find(p => p.style.display !== 'none');
    if (pane) paneIn(pane);
    gsap.fromTo($('.lb-dialog-ok'), { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: .4, delay: .25, ease: E.lift, clearProps: 'opacity,transform' });
  }).observe(dlg, { attributes: true, attributeFilter: ['open'] });

  // ---------- สลับเด็ค (game.js เขียนเนื้อหาใหม่ทั้งก้อน) ----------
  const content = document.getElementById('howto-combo-content');
  if (content) {
    let lastLeader = null;
    new MutationObserver(() => {
      const a = tabs && tabs.querySelector('.is-active');
      const leader = a && a.dataset.comboLeader;
      requestAnimationFrame(() => { syncArrows(); centerActive(true); });
      if (leader === lastLeader) return;
      const first = lastLeader === null;
      lastLeader = leader;
      if (reduce || first) return;
      if (a) gsap.fromTo(a, { scale: .9 }, { scale: 1, duration: .45, ease: E.settle, clearProps: 'transform' });
      flowIn([...content.children].slice(0, 2), { y: 18, stagger: .08 });
      // เลือกเด็คใหม่ → กลับขึ้นบนสุดเสมอ (เริ่มจากคอมโบ 1) ไม่ว่าจะเลื่อนลงไปอยู่ตรงไหน
      // dlg.scrollTo({behavior:'smooth'}) ขยับไม่ลื่นระหว่างมี animation อื่นพร้อมกัน ใช้ GSAP ทวีนแทน
      if (dlg.scrollTop > 0) gsap.to(dlg, { scrollTop: 0, duration: .5, ease: E.lift, overwrite: 'auto' });
    }).observe(content, { childList: true });
  }

  // ---------- กลับมาจากโหมดฝึก: เลื่อนไปที่คอมโบที่เพิ่งซ้อม + ไฮไลต์ทอง ----------
  // (เรียกจากปุ่ม "คอมโบอื่น" ในแถบโค้ช หลัง game.js เปิดแท็บคอมโบของเด็คนั้นแล้ว)
  function focusCombo(id) {
    const btn = id && dlg.querySelector(`[data-practice-combo="${id}"]`);
    const card = btn && btn.closest('.lb-combo-card');
    if (!card) return;
    // รอให้หน้าต่างเปิดและโมชั่นเปิดหน้าต่างเริ่มก่อน แล้วค่อยเลื่อน (ไม่งั้นตำแหน่งยังไม่นิ่ง)
    setTimeout(() => {
      const bar = dlg.querySelector('.howto-deckbar');
      const offset = (head ? head.offsetHeight : 0) + (bar ? bar.offsetHeight : 0) + 12;
      const top = Math.max(0, dlg.scrollTop + card.getBoundingClientRect().top - dlg.getBoundingClientRect().top - offset);
      const spot = () => {
        card.classList.remove('is-spotlight'); void card.offsetWidth; card.classList.add('is-spotlight');
        setTimeout(() => card.classList.remove('is-spotlight'), 2400);
        if (!reduce && window.BOFFX) BOFFX.sparks(card, { count: 22, speed: 260, rings: 2 });
      };
      if (reduce) { dlg.scrollTop = top; spot(); return; }
      gsap.to(dlg, { scrollTop: top, duration: .7, ease: E.fly || 'power3.inOut', overwrite: 'auto', onComplete: spot });
    }, 380);
  }
  window.BOFHowto = { focusCombo };

  // ---------- เลื่อนลง: การ์ดคอมโบลอยขึ้นตอนเข้ามาในจอครั้งแรก ----------
  if (!reduce && 'IntersectionObserver' in window && content) {
    const seen = new WeakSet();
    const io = new IntersectionObserver(entries => entries.forEach(en => {
      if (!en.isIntersecting || seen.has(en.target)) return;
      seen.add(en.target);
      io.unobserve(en.target);
      if (en.boundingClientRect.top < (dlg.getBoundingClientRect().top + 40)) { gsap.set(en.target, { clearProps: 'opacity,transform' }); return; }
      gsap.fromTo(en.target, { opacity: 0, y: 34, scale: .97 }, { opacity: 1, y: 0, scale: 1, duration: .55, ease: E.lift, clearProps: 'opacity,transform' });
    }), { root: dlg, threshold: .08 });
    new MutationObserver(() => $$('.lb-combo-card', content).slice(1).forEach(c => io.observe(c))).observe(content, { childList: true });
  }
})();
