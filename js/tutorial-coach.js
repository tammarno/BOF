/* ============================================================================
   TUTORIAL COACH: โมชั่น + การหลบเป้า ของแถบโค้ชโหมดฝึก (#bof-tutorial-coach-bar ที่ game.js สร้าง)
   - หลบเป้า: ถ้าสิ่งที่ต้องกด (.bof-guided-highlight) อยู่ใต้แถบ แถบจะเลื่อนลงไปอยู่เหนือแถบควบคุมด้านล่าง
   - ปุ่มย่อ/ขยาย: มือถือแตะตรงไหนของแถบก็ได้ (เริ่มแบบย่อ) · PC กดปุ่มลูกศร (เริ่มแบบกาง) · จบครบจะกางให้เอง
   - เป้าหมายใหม่: ประกายทองเล็กๆ ที่เป้า
   - เปลี่ยนขั้น: หัวข้อไหลเข้า + ป้ายเด้ง + ประกายทอง · จบครบ: กระดาษสีจากแถบ
   ไม่แตะตรรกะเกม · reduced motion = ไม่มีโมชั่น (แต่การหลบเป้ายังทำงาน)
   ============================================================================ */
(function () {
  const reduce = typeof gsap === 'undefined' || matchMedia('(prefers-reduced-motion: reduce)').matches;
  const E = (window.BOFFX && BOFFX.ease) || { lift: 'power2.out', settle: 'back.out(2.4)' };
  const mobile = () => typeof window.isMobileUI === 'function' && window.isMobileUI();
  const GAP = 8;
  let bar = null, lastStep = null, collapsed = true, timer = 0, lastTarget = '';

  function setup(b) {
    bar = b;
    new MutationObserver(onRender).observe(bar, { childList: true });
    // มือถือ: แตะตรงไหนของแถบก็ย่อ/ขยาย · PC: กดปุ่มลูกศร · ปุ่มเริ่มใหม่/ออก ทำงานตามปกติ
    bar.addEventListener('click', e => {
      if (e.target.closest('.bof-coach-actions')) return;
      if (!mobile() && !e.target.closest('.bof-coach-toggle')) return;
      toggle();
    });
    onRender();
  }

  // ย่อ/ขยายแบบยืดความสูงลื่นๆ แล้วเนื้อหาที่โผล่ใหม่ค่อยไหลเข้า
  function toggle() {
    const h0 = bar.offsetHeight;
    collapsed = !collapsed;
    applyCollapse();
    if (!reduce) {
      const h1 = bar.offsetHeight;
      gsap.fromTo(bar, { height: h0, overflow: 'hidden' }, { height: h1, duration: .32, ease: E.lift, clearProps: 'height,overflow', onUpdate: dodge });
      if (!collapsed) gsap.fromTo(bar.querySelectorAll('.bof-coach-desc, .bof-coach-actions'), { opacity: 0, y: -6 }, { opacity: 1, y: 0, duration: .3, delay: .08, stagger: .05, ease: E.lift, clearProps: 'opacity,transform' });
    }
    dodge();
  }

  function applyCollapse() {
    // จบครบ / แมตช์จบ (โหมดฝึกไม่มีหน้าต่างผล) → กางให้เห็นปุ่มเริ่มใหม่/ออกเสมอ
    const over = bar.classList.contains('is-complete') || (typeof gameState !== 'undefined' && gameState.gameOver);
    const c = collapsed && !over;
    bar.classList.toggle('is-collapsed', c);
    const t = bar.querySelector('.bof-coach-toggle');
    if (t) t.setAttribute('aria-expanded', String(!c));
  }

  function onRender() {
    if (!bar) return;
    applyCollapse();
    clearInterval(timer);
    if (bar.style.display !== 'none') timer = setInterval(dodge, 250);
    const step = bar.dataset.step;
    if (step === lastStep) return;
    const first = lastStep === null || step === '0';
    lastStep = step;
    // เริ่มบทใหม่: มือถือย่อไว้ก่อน (จอเล็ก) · PC กางไว้ (อ่านคำอธิบายได้เลย)
    if (first) collapsed = mobile(), applyCollapse();
    if (reduce) return;
    const title = bar.querySelector('.bof-coach-title'), desc = bar.querySelector('.bof-coach-desc'), badge = bar.querySelector('.bof-coach-step-badge');
    gsap.fromTo([title, desc].filter(Boolean), { opacity: 0, x: 14 }, { opacity: 1, x: 0, duration: .4, ease: E.lift, stagger: .06, clearProps: 'opacity,transform' });
    if (badge) gsap.fromTo(badge, { scale: .7 }, { scale: 1, duration: .45, ease: E.settle, clearProps: 'transform' });
    if (first) {
      // แถบเองมี transform: translateX(-50%) จาก CSS จึงขยับเฉพาะเนื้อในแทน
      gsap.fromTo(bar, { opacity: 0 }, { opacity: 1, duration: .35, clearProps: 'opacity' });
      gsap.fromTo(bar.children, { y: -14 }, { y: 0, duration: .45, ease: E.lift, stagger: .05, clearProps: 'transform' });
      return;
    }
    requestAnimationFrame(() => {
      if (window.BOFFX && badge) BOFFX.sparks(badge, { count: 14, speed: 180, rings: 1 });
      if (bar.classList.contains('is-complete') && window.BOFParticles) {
        const r = bar.getBoundingClientRect();
        BOFParticles.confetti(document.body, r.left + r.width / 2, r.bottom, { angle: Math.PI / 2, spread: 2.4, speed: 420, count: 50, stagger: .15 });
      }
    });
  }

  // แถบบังเป้าหมาย → ย้ายไปอยู่ล่าง (เหนือแถบควบคุม) · ไม่บังแล้ว → กลับขึ้นบน
  function dodge() {
    if (!bar || bar.style.display === 'none') { clearInterval(timer); return; }
    applyCollapse();
    const t = document.querySelector('.bof-guided-highlight');
    const h = bar.offsetHeight;
    // เป้าหมายใหม่ (ตำแหน่งเปลี่ยน) → ประกายทองเล็กๆ ที่เป้า ให้ตาวิ่งไปหา
    if (t && !t.closest('#custom-choice-modal')) {
      // จำเป้าจากตัวตน (ไม่ใช่พิกัด) ไม่งั้นกระดานขยับนิดเดียวก็ยิงประกายซ้ำ
      const r = t.getBoundingClientRect(), key = (t.id || '') + '|' + (t.textContent || '').trim().slice(0, 24) + '|' + bar.dataset.step;
      if (key !== lastTarget) {
        lastTarget = key;
        if (!reduce && window.BOFFX && r.width) BOFFX.sparks(t, { count: 10, speed: 150, size: 10, rings: 1 });
      }
    }
    let bottom = false;
    if (t && !t.closest('#custom-choice-modal')) {
      const r = t.getBoundingClientRect();
      bottom = r.top < GAP + h + 6 && r.bottom > 0;
    }
    const ctrl = document.getElementById('btn-pass-turn-inline');
    // มือถือแถบควบคุมอยู่ล่างจอ: วางเหนือแถบนั้น · PC แถบควบคุมอยู่กลางจอ: ใช้ขอบล่างจอ
    const ctrlTop = ctrl && ctrl.offsetParent ? ctrl.parentElement.getBoundingClientRect().top : innerHeight;
    const floor = ctrlTop > innerHeight * .6 ? ctrlTop : innerHeight;
    const top = bottom ? Math.max(GAP, floor - h - GAP) : GAP;
    if (bar.style.top !== top + 'px') bar.style.top = top + 'px';
    bar.classList.toggle('is-docked-bottom', bottom);
  }

  const find = () => {
    const b = document.getElementById('bof-tutorial-coach-bar');
    if (b && b !== bar) setup(b);
  };
  new MutationObserver(find).observe(document.body, { childList: true });
  document.addEventListener('bof:guide-target', () => requestAnimationFrame(dodge));
  find();
})();
