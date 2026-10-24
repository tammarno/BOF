/* ============================================================================
   LOBBY MOTION (BOF v0.7) — โหลดหลัง vendor/gsap.min.js
   ท่าเด่น: หัวข้อลอยขึ้นจากหลังเส้นฐาน → แฟ้มเลื่อนขึ้นซ้อนกัน
   รอบหน้า: ส่วนต่างๆ ทยอยขึ้นเมื่อเลื่อนถึง · การ์ดในเวทีเข้าทีละใบเมื่อสลับเด็ค · ปุ่มยุบเมื่อกด · ดาวใน Hero
   กฎ: transform/opacity เท่านั้น · reduced motion = สถานะสุดท้ายทันที · ไม่มี JS ก็ยังเห็นทุกอย่าง
   สเปก: docs/specs/2026-10-24-lobby-redesign-design.md §6
   ============================================================================ */
(function () {
  const root = document.documentElement;
  const unhide = () => root.classList.remove('lm-pre');
  const revealedEarly = !root.classList.contains('lm-pre'); // ตัวกันค้าง 1.5 วิ ใน <head> เปิดล็อบบี้ไปก่อนแล้ว
  const noop = () => {};
  if (typeof gsap === 'undefined') {
    unhide();
    window.LobbyMotion = { start: noop, stop: noop, isRunning: () => false, isPaused: () => false, _particleCount: () => 0, _particlesActive: () => false, _particlePos: () => ({ x: 0, y: 0 }) };
    return;
  }

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canHover = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const lobby = $('#lobby-screen');
  const hero = $('#lb-hero');
  if (!lobby || !hero) { unhide(); return; }

  const seen = () => { try { return sessionStorage.getItem('lm-seen') === '1'; } catch (e) { return false; } };
  const markSeen = () => { try { sessionStorage.setItem('lm-seen', '1'); } catch (e) {} };

  let ctx = null, running = false, paused = false, intro = null, io = null, heldTweens = [];

  // ---------- ฉากเปิด ----------
  // แฟ้มใช้ opacity (ไม่ใช่ autoAlpha) เพื่อให้ปุ่มในแฟ้มหน้าสุดยังกดได้ระหว่างฉากเปิด
  function buildIntro(short) {
    const lines = $$('.lb-line > span'), lead = $('.lb-lead'), folders = $$('.lb-folder');
    const tl = gsap.timeline();
    if (short) {
      tl.from(lines, { yPercent: 110, duration: .5, ease: 'power4.out', stagger: .06 })
        .from(lead, { opacity: 0, y: 12, duration: .3, ease: 'power2.out' }, .15)
        .from(folders, { opacity: 0, y: 40, duration: .35, ease: 'power3.out', stagger: .04 }, .2);
    } else {
      tl.from(lines, { yPercent: 110, duration: .9, ease: 'power4.out', stagger: .11 })
        .from(lead, { opacity: 0, y: 16, duration: .5, ease: 'power2.out' }, .55)
        .from(folders, { opacity: 0, y: 80, duration: .6, ease: 'power3.out', stagger: .07 }, .7);
    }
    return tl;
  }
  // กดปุ่ม/ลิงก์ระหว่างฉากเปิด: ไม่ข้ามฉาก เพราะแฟ้มจะกระโดดหนีจากใต้นิ้วก่อนปล่อย ทำให้คลิกหาย
  function skipIntro(e) {
    if (e.type === 'pointerdown' && e.target.closest && e.target.closest('button, a, input, label')) return;
    if (intro && intro.progress() < 1) intro.progress(1);
  }

  // ---------- ส่วนต่างๆ ทยอยขึ้นเมื่อเลื่อนถึง (ครั้งเดียวต่อการเปิดหน้า) ----------
  // ไม่ซ่อนปุ่ม/ช่องกรอก/ลิงก์ (ซ่อนแค่ของข้างใน) เพื่อให้กดได้เสมอ และไม่แตะการ์ดในเวที (เวทีมีแอนิเมชันสลับเด็คของตัวเอง)
  const REVEAL = {
    '#lb-stats': 'h2, .lb-note, .lb-total, .lb-total-note, .lb-receipt',
    '#lb-decks': 'h2, .lb-stage-meta > p',
    '#lb-gallery': '.lb-tile-head h2, .lb-tile-word > span, .lb-tile-card .lb-card, .lb-tile-cap',
    '#lb-how': 'h2, .lb-seg',
    '#lb-footer': '.lb-foot-top',
  };
  const revealed = new Set();
  function setupReveal() {
    const pending = Object.keys(REVEAL).filter(sel => !revealed.has(sel) && $(sel));
    if (!pending.length) return;
    io = new IntersectionObserver(entries => entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const sel = '#' + entry.target.id;
      io.unobserve(entry.target); revealed.add(sel);
      inCtx(() => gsap.to(entry.target.querySelectorAll(REVEAL[sel]), { autoAlpha: 1, y: 0, duration: .6, ease: 'power3.out', stagger: .08, overwrite: 'auto' }));
    }), { threshold: .2 });
    pending.forEach(sel => {
      gsap.set($(sel).querySelectorAll(REVEAL[sel]), { autoAlpha: 0, y: 24 });
      io.observe($(sel));
    });
  }
  const inCtx = fn => (ctx ? ctx.add(fn) : fn());

  // ---------- สลับเด็ค: การ์ดชุดใหม่เข้าทีละใบ (สีเวทีเปลี่ยนด้วย CSS transition) ----------
  $('#lb-decks')?.addEventListener('lobby:deck', () => {
    if (!running || reduce) return;
    inCtx(() => gsap.fromTo($$('.lb-stage-cards .lb-card'), { opacity: 0, y: 40 },
      { opacity: 1, y: 0, duration: .45, ease: 'power3.out', stagger: .05, overwrite: 'auto' }));
  });

  // ---------- ปุ่ม: ยุบเมื่อกด · ยกขึ้นเมื่อชี้ ----------
  const PRESSABLE = '.lb-btn, .lb-deck-btn, .lb-cta, .lb-tile-card, .lb-tab';
  if (!reduce) {
    lobby.addEventListener('pointerdown', e => {
      const el = e.target.closest(PRESSABLE); if (!el) return;
      gsap.to(el, { scale: .97, duration: .06, ease: 'power1.out', overwrite: 'auto' });
    });
    const release = e => {
      const el = e.target.closest && e.target.closest(PRESSABLE); if (!el) return;
      gsap.to(el, { scale: 1, duration: .3, ease: 'back.out(2)', overwrite: 'auto' });
    };
    lobby.addEventListener('pointerup', release);
    lobby.addEventListener('pointerout', release);
    if (canHover) {
      lobby.addEventListener('pointerover', e => {
        const el = e.target.closest('.lb-btn'); if (!el || el.contains(e.relatedTarget)) return;
        gsap.to(el, { y: -3, duration: .2, ease: 'power2.out', overwrite: 'auto' });
      });
      lobby.addEventListener('pointerout', e => {
        const el = e.target.closest('.lb-btn'); if (!el || el.contains(e.relatedTarget)) return;
        gsap.to(el, { y: 0, duration: .25, ease: 'power2.out', overwrite: 'auto' });
      });
    }
  }

  // ---------- ดาวใน Hero ----------
  const P = { cv: null, g: null, list: [], sprite: null, on: false, dpr: 1 };
  function makeSprite() {
    const s = document.createElement('canvas'); s.width = s.height = 32; const g = s.getContext('2d');
    const grd = g.createRadialGradient(16, 16, 0, 16, 16, 16);
    grd.addColorStop(0, 'rgba(255,240,200,1)'); grd.addColorStop(.35, 'rgba(243,201,105,.45)'); grd.addColorStop(1, 'rgba(243,201,105,0)');
    g.fillStyle = grd; g.fillRect(0, 0, 32, 32); return s;
  }
  function ensureCanvas() {
    if (P.cv) return;
    P.cv = document.createElement('canvas'); P.cv.id = 'lm-particles'; P.cv.setAttribute('aria-hidden', 'true');
    hero.prepend(P.cv);
    P.g = P.cv.getContext('2d'); P.sprite = makeSprite();
  }
  function sizeCanvas() {
    if (!P.cv) return;
    P.dpr = Math.min(devicePixelRatio || 1, 2);
    P.cv.width = Math.round(hero.clientWidth * P.dpr); P.cv.height = Math.round(hero.clientHeight * P.dpr);
  }
  const wanted = () => (innerWidth < 768 ? 15 : 30);
  function spawn(p, anywhere) {
    p.x = Math.random() * P.cv.width;
    p.y = anywhere ? Math.random() * P.cv.height : P.cv.height + 20 * P.dpr;
    p.s = (8 + Math.random() * 16) * P.dpr; p.vy = (.15 + Math.random() * .35) * P.dpr;
    p.a = .12 + Math.random() * .35; p.ph = Math.random() * 6.28;
    return p;
  }
  function drawParticles() {
    const { g, cv, list, sprite } = P; g.clearRect(0, 0, cv.width, cv.height);
    for (const p of list) {
      p.y -= p.vy; p.ph += .01; if (p.y < -30 * P.dpr) spawn(p, false);
      g.globalAlpha = p.a * (.7 + .3 * Math.sin(p.ph * 2));
      g.drawImage(sprite, p.x + Math.sin(p.ph) * 12 * P.dpr - p.s / 2, p.y - p.s / 2, p.s, p.s);
    }
    g.globalAlpha = 1;
  }
  function startParticles() {
    ensureCanvas(); sizeCanvas();
    if (P.list.length !== wanted()) P.list = Array.from({ length: wanted() }, () => spawn({}, true)); // เล่นต่อจากเดิม ไม่กระโดด
    if (!P.on) { gsap.ticker.add(drawParticles); P.on = true; }
  }
  function stopParticles() {
    if (P.on) { gsap.ticker.remove(drawParticles); P.on = false; }
    if (P.g && P.cv) P.g.clearRect(0, 0, P.cv.width, P.cv.height);
  }
  addEventListener('resize', () => {
    if (!running) return;
    sizeCanvas();
    P.list.length = Math.min(P.list.length, wanted());
    while (P.list.length < wanted()) P.list.push(spawn({}, true));
  });

  // ---------- เปิด/ปิด ----------
  function start(opts = {}) {
    stop();
    unhide();
    if (reduce) return; // สถานะนิ่งตามสเปก
    running = true; paused = false;
    const short = opts.short != null ? opts.short : (seen() || revealedEarly);
    markSeen();
    ctx = gsap.context(() => {
      intro = buildIntro(short);
      setupReveal();
    });
    startParticles();
  }
  function stop() {
    P.list = []; // ออกจากล็อบบี้จริง: รอบหน้าค่อยสุ่มใหม่
    if (io) { io.disconnect(); io = null; }
    if (ctx) { ctx.revert(); ctx = null; }
    intro = null; heldTweens = [];
    stopParticles();
    paused = false; running = false;
  }
  function setPaused(v) {
    if (!running || v === paused) return;
    paused = v;
    if (v && intro && intro.progress() < 1) intro.progress(1);
    // ข้าม tween "จุดเริ่ม" ของ .from() (ยาว 0 วิ) — ถ้าสั่ง resume ตัวนี้ จะวาดค่าโปร่งใสทับล็อบบี้ (บั๊ก v0.6)
    if (v) {
      heldTweens = (ctx ? ctx.getTweens() : []).filter(t => t.data !== 'isStart' && t.totalDuration() > 0 && !t.paused());
      heldTweens.forEach(t => t.pause()); stopParticles();
    } else {
      heldTweens.forEach(t => t.resume()); heldTweens = []; startParticles();
    }
  }

  // ตรวจสถานะ: ล็อบบี้แสดงไหม · มีหน้าต่างทับไหม · แท็บซ่อนไหม (ไม่ต้องแก้ game.js)
  const visible = el => el && el.style.display !== 'none' && getComputedStyle(el).display !== 'none';
  const covered = () => $$('.modal-overlay').some(visible) || !!$('#lb-mode-dialog')?.open || document.body.classList.contains('holo-inspecting');
  function check() {
    const show = visible(lobby);
    if (show && !running && !reduce) start();
    else if (!show && running) stop();
    if (running) setPaused(document.hidden || covered());
  }

  document.addEventListener('pointerdown', skipIntro, true);
  document.addEventListener('keydown', skipIntro, true);
  document.addEventListener('visibilitychange', check);

  window.LobbyMotion = {
    start, stop,
    isRunning: () => running,
    isPaused: () => paused,
    _particleCount: () => (P.on ? P.list.length : 0),
    _particlesActive: () => P.on,
    _particlePos: () => (P.list[0] ? { x: P.list[0].x, y: P.list[0].y } : { x: 0, y: 0 }),
  };

  if (visible(lobby)) start(); else unhide();
  // MutationObserver ทำงานก่อนเบราว์เซอร์วาดเฟรมถัดไป: กลับมาล็อบบี้แล้วไม่เห็นภาพนิ่งแวบก่อนฉากเปิด
  new MutationObserver(check).observe(lobby, { attributes: true, attributeFilter: ['style', 'class'] });
  setInterval(check, 200); // สำรองสำหรับหน้าต่าง modal, dialog และแท็บ
})();
