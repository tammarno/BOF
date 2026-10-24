/* ============================================================================
   LOBBY MOTION (BOF v0.3) — โหลดหลัง vendor/gsap.min.js
   ฉากเปิด → พุ่งเข้าที่ → พักหายใจ + ลูป · ปุ่มไว · การ์ดพัดตามเมาส์ · อนุภาค
   สเปก: docs/specs/2026-10-24-lobby-motion-design.md
   ============================================================================ */
(function () {
  const root = document.documentElement;
  const unhide = () => root.classList.remove('lm-pre');
  const revealedEarly = !root.classList.contains('lm-pre'); // ตัวกันค้าง 1.5 วิ ใน <head> เปิดล็อบบี้ไปก่อนแล้ว
  const noop = () => {};
  if (typeof gsap === 'undefined') {
    unhide();
    window.LobbyMotion = { start: noop, stop: noop, isRunning: () => false, isPaused: () => false, _particleCount: () => 0, _particlesActive: () => false };
    return;
  }

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canHover = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const lobby = $('#lobby-screen');
  // ตำแหน่งพัดเดิมจาก style.css (.fan-1 … .fan-4)
  const FAN = [{ x: -60, y: 0, r: -18 }, { x: -18, y: -10, r: -6 }, { x: 22, y: -8, r: 8 }, { x: 65, y: 5, r: 20 }];

  let ctx = null, running = false, paused = false, intro = null;
  let fanX = null, fanY = null;
  const iconLoops = new Map();

  // ---------- เตรียม DOM (ครั้งเดียว) ----------
  let prepared = false;
  function prepDom() {
    if (prepared) return; prepared = true;
    const sub = $('.hero-subtitle');
    if (sub && !sub.querySelector('.lm-ch')) {
      sub.innerHTML = [...sub.textContent].map(c => `<span class="lm-ch">${c === ' ' ? '&nbsp;' : c}</span>`).join('');
    }
    const title = $('.hero-title');
    // แสงกวาดเฉพาะบนตัวอักษร: หน้าต่าง (.lm-shine) เลื่อนไปทางขวา ส่วนข้อความสำเนาข้างใน (.lm-shine-text) เลื่อนสวนกลับ
    // ทำให้ข้อความอยู่ที่เดิมแต่ถูกเผยเฉพาะช่วงที่หน้าต่างผ่าน — ใช้ transform ล้วน ไม่ต้องวาดใหม่
    if (title && !title.querySelector('.lm-title-line')) {
      const first = title.firstChild;
      if (first && first.nodeType === 3) {
        const line = document.createElement('b'); line.className = 'lm-title-line';
        line.textContent = first.textContent.trim();
        line.insertAdjacentHTML('beforeend', `<i class="lm-shine" aria-hidden="true"><i class="lm-shine-text">${line.textContent}</i></i>`);
        title.replaceChild(line, first);
      }
    }
    ['#btn-lobby-pvp', '#btn-lobby-bot'].forEach(s => {
      const b = $(s); if (!b) return;
      if (s === '#btn-lobby-pvp') b.insertAdjacentHTML('beforeend', '<i class="lm-glow" aria-hidden="true"></i>');
      b.insertAdjacentHTML('beforeend', '<i class="lm-ripples" aria-hidden="true"></i>');
    });
    $$('.feature-card').forEach(c => c.insertAdjacentHTML('beforeend', '<i class="lm-edge" aria-hidden="true"></i>'));
    if (!$('#lm-intro')) {
      const ov = document.createElement('div');
      ov.id = 'lm-intro'; ov.setAttribute('aria-hidden', 'true');
      ov.innerHTML = '<div class="lm-intro-bg"></div><div class="lm-intro-flash"></div><div class="lm-intro-logo"></div>';
      document.body.appendChild(ov);
    }
    if (!$('#lm-particles')) {
      const cv = document.createElement('canvas'); cv.id = 'lm-particles'; cv.setAttribute('aria-hidden', 'true');
      lobby.prepend(cv);
    }
  }

  const seen = () => { try { return sessionStorage.getItem('lm-seen') === '1'; } catch (e) { return false; } };
  const markSeen = () => { try { sessionStorage.setItem('lm-seen', '1'); } catch (e) {} };

  // ---------- ฉากเปิด + พุ่งเข้าที่ ----------
  function buildIntro(short) {
    const fans = $$('.fan-card');
    fans.forEach((c, i) => gsap.set(c, { x: FAN[i].x, y: FAN[i].y, rotation: FAN[i].r }));
    gsap.set('.lm-sword.lm-r', { scaleX: -1 });
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    const t0 = short ? 0 : .5;

    if (!short) {
      const ov = $('#lm-intro'), big = ov.querySelector('.lm-intro-logo');
      big.innerHTML = $('.lm-logo').outerHTML;
      // วัดตำแหน่งโลโก้จริง "ก่อน" สร้าง from-tween (from จะเลื่อน navbar ทันที)
      const target = $('.lobby-logo .lm-logo').getBoundingClientRect();
      ov.style.display = 'block';
      const bigRect = big.getBoundingClientRect();
      const cx = innerWidth / 2 - bigRect.width / 2, cy = innerHeight / 2 - bigRect.height / 2;
      const s = target.width / (bigRect.width || 1);
      gsap.set(big, { x: cx, y: cy });
      gsap.set(big.querySelector('.lm-r'), { scaleX: -1 });
      tl.set('.lobby-logo .lm-logo', { autoAlpha: 0 }, 0)
        .fromTo(big, { scale: .4, autoAlpha: 0 }, { scale: 1.15, autoAlpha: 1, duration: .28, ease: 'back.out(2)', transformOrigin: '50% 50%' }, 0)
        .fromTo(ov.querySelector('.lm-intro-flash'), { autoAlpha: 0, scale: .4 }, { autoAlpha: 1, scale: 1.5, duration: .1, yoyo: true, repeat: 1, ease: 'power2.out' }, .16)
        .to(big, { x: target.left, y: target.top, scale: s, transformOrigin: '0 0', duration: .24, ease: 'power2.inOut' }, .28)
        .to(ov.querySelector('.lm-intro-bg'), { autoAlpha: 0, duration: .24 }, .28)
        .set('.lobby-logo .lm-logo', { autoAlpha: 1 }, .52)
        .set(ov, { display: 'none' }, .52);
    }

    tl.from('.lobby-navbar', { y: -50, autoAlpha: 0, duration: .4 }, short ? 0 : .3)
      .from('.lm-ch', { y: 12, autoAlpha: 0, duration: .3, stagger: .02 }, t0 + .1)
      .from('.hero-title', { y: 18, autoAlpha: 0, duration: .45 }, t0 + .15)
      .add(shineSweep(.7, 'power2.inOut'), t0 + .45)
      .from('.hero-desc', { y: 10, autoAlpha: 0, duration: .4 }, t0 + .25)
      .from(fans, { x: '+=420', y: '-=40', rotation: '+=60', autoAlpha: 0, duration: .55, stagger: .08, ease: 'back.out(1.4)' }, t0 + .2)
      // ปุ่ม/กล่องเมนูใช้ opacity (ไม่ใช่ autoAlpha) ให้ยังคลิกได้ระหว่างฉากเปิด
      .from(['#btn-lobby-pvp', '#btn-lobby-bot'], { scale: .6, opacity: 0, duration: .35, stagger: .07, ease: 'back.out(2.5)' }, t0 + .6)
      .from('.feature-card', { y: 40, opacity: 0, duration: .4, stagger: .08 }, t0 + .7);

    if (short) tl.timeScale(tl.duration() / .6);
    return tl;
  }

  function shineSweep(duration, ease) {
    const win = $('.lm-shine'), txt = $('.lm-shine-text'), line = $('.lm-title-line');
    const tl = gsap.timeline();
    if (!win || !txt || !line) return tl;
    const W = line.offsetWidth, sw = win.offsetWidth;
    return tl.fromTo(win, { x: -sw }, { x: W, duration, ease }, 0)
             .fromTo(txt, { x: sw }, { x: -W, duration, ease }, 0);
  }

  function skipIntro(e) {
    if (!intro || intro.progress() === 1) return;
    intro.progress(1); // ข้ามแต่ไม่กินคลิก: ปุ่มที่กดจะทำงานต่อทันที
  }

  // ---------- พักหายใจ + ลูป ----------
  const R = gsap.utils.random;
  function startIdle() {
    $$('.fan-card').forEach((c, i) => {
      gsap.to(c, { y: FAN[i].y - 6, rotation: FAN[i].r + 1.2, duration: R(2, 3), yoyo: true, repeat: -1, ease: 'sine.inOut', delay: i * .35 });
    });
    gsap.fromTo('.lm-glow', { opacity: .2 }, { opacity: .9, duration: 1.5, yoyo: true, repeat: -1, ease: 'sine.inOut' });
    // ดาบไขว้กระทบกัน ทุก ~4 วิ
    gsap.timeline({ repeat: -1, repeatDelay: 3.35, delay: .6 })
      .to('.lobby-logo .lm-l', { rotation: 14, duration: .16, ease: 'power2.in' }, 0)
      .to('.lobby-logo .lm-r', { rotation: -14, duration: .16, ease: 'power2.in' }, 0)
      .fromTo('.lobby-logo .lm-spark', { scale: .2, opacity: 0 }, { scale: 1.4, opacity: 1, duration: .1, yoyo: true, repeat: 1 }, .14)
      .to('.lobby-logo .lm-sword', { rotation: 0, duration: .35, ease: 'back.out(3)' }, .2);
    // แสงกวาดชื่อเกม ทุก 6 วิ
    gsap.timeline({ repeat: -1, repeatDelay: 4.8, delay: 2 }).add(shineSweep(1.2, 'power1.inOut'));
    // ไอคอนกล่องเมนู ทุก 5–7 วิ ไม่พร้อมกัน
    const icons = $$('.feature-card .lm-ico');
    const makers = [
      el => gsap.timeline().to(el, { rotation: -14, x: -3, duration: .12 }).to(el, { rotation: 12, x: 3, duration: .12 }).to(el, { rotation: -6, x: -1, duration: .1 }).to(el, { rotation: 0, x: 0, duration: .16, ease: 'back.out(3)' }),
      el => gsap.timeline().to(el, { rotation: 18, duration: .25, ease: 'sine.inOut' }).to(el, { rotation: -14, duration: .3, ease: 'sine.inOut' }).to(el, { rotation: 0, duration: .25, ease: 'sine.inOut' }),
      el => gsap.timeline().to(el, { scale: 1.2, y: -2, duration: .18, ease: 'power2.out' }).to(el, { scale: 1, y: 0, duration: .35, ease: 'back.out(3)' }),
    ];
    icons.forEach((el, i) => {
      const loop = gsap.timeline({ repeat: -1, repeatDelay: R(4.4, 6.2), delay: 1 + i * 1.7 }).add(makers[i % 3](el));
      iconLoops.set(el.closest('.feature-card'), loop);
    });
    // ▷ ขยับไปข้างหน้า · 🤖 กะพริบ
    gsap.timeline({ repeat: -1, repeatDelay: 1.6 }).to('#btn-lobby-pvp .lm-ico', { x: 4, duration: .22, yoyo: true, repeat: 1, ease: 'sine.inOut' });
    gsap.timeline({ repeat: -1, repeatDelay: R(3.5, 5), delay: 1.2 }).to('#btn-lobby-bot .lm-ico', { scaleY: .15, duration: .07, yoyo: true, repeat: 1, ease: 'power1.inOut' });
  }

  // ---------- ปุ่ม + กล่องเมนู ----------
  let bound = false;
  const inCtx = fn => { if (running && ctx) ctx.add(fn); };
  function bindButtons() {
    if (bound) return; bound = true;
    const targets = [$('#btn-lobby-pvp'), $('#btn-lobby-bot'), ...$$('.feature-card')].filter(Boolean);
    targets.forEach(el => {
      const isCard = el.classList.contains('feature-card');
      let hover = false;
      el.addEventListener('pointerenter', e => {
        if (e.pointerType !== 'mouse') return; hover = true;
        inCtx(() => {
          gsap.to(el, { y: -3, scale: isCard ? 1.02 : 1.04, duration: .12, ease: 'power2.out', overwrite: 'auto' });
          if (isCard) {
            gsap.to(el.querySelector('.lm-edge'), { opacity: 1, duration: .15, overwrite: 'auto' });
            const loop = iconLoops.get(el); if (loop) loop.play(0);
          }
        });
      });
      el.addEventListener('pointerleave', e => {
        hover = false;
        inCtx(() => {
          gsap.to(el, { y: 0, scale: 1, duration: .2, ease: 'power2.out', overwrite: 'auto' });
          if (isCard) gsap.to(el.querySelector('.lm-edge'), { opacity: 0, duration: .25, overwrite: 'auto' });
        });
      });
      el.addEventListener('pointerdown', () => inCtx(() => gsap.to(el, { scale: .96, duration: .06, ease: 'power1.out', overwrite: 'auto' })));
      el.addEventListener('pointerup', e => {
        inCtx(() => gsap.to(el, { scale: hover ? (isCard ? 1.02 : 1.04) : 1, duration: .35, ease: 'back.out(3)', overwrite: 'auto' }));
        const box = el.querySelector('.lm-ripples'); if (!box || !running) return;
        const r = el.getBoundingClientRect();
        const dot = document.createElement('i'); dot.className = 'lm-ripple';
        dot.style.left = (e.clientX - r.left) + 'px'; dot.style.top = (e.clientY - r.top) + 'px';
        box.appendChild(dot);
        const size = Math.max(r.width, r.height) / 8;
        gsap.fromTo(dot, { scale: 0, opacity: .55 }, { scale: size, opacity: 0, duration: .5, ease: 'power2.out', onComplete: () => dot.remove(), onInterrupt: () => dot.remove() });
      });
    });

    // การ์ดพัด: เอียงตามเมาส์ + ยกใบที่ชี้
    const hero = $('.lobby-hero'), fan = $('.hero-card-fan');
    if (hero && fan) {
      hero.addEventListener('pointermove', e => {
        if (e.pointerType !== 'mouse' || !running || paused || !fanX) return;
        const r = fan.getBoundingClientRect();
        const px = gsap.utils.clamp(-1, 1, (e.clientX - (r.left + r.width / 2)) / (r.width / 2));
        const py = gsap.utils.clamp(-1, 1, (e.clientY - (r.top + r.height / 2)) / (r.height / 2));
        fanY(px * 14); fanX(-py * 9);
      });
      hero.addEventListener('pointerleave', () => { if (fanX) { fanX(0); fanY(0); } });
      const fans = $$('.fan-card');
      fans.forEach((c, i) => {
        c.addEventListener('pointerenter', e => {
          if (e.pointerType !== 'mouse') return;
          inCtx(() => {
            gsap.to(c, { yPercent: -12, scale: 1.08, zIndex: 10, duration: .2, ease: 'power2.out', overwrite: 'auto' });
            fans.forEach((o, j) => { if (j !== i) gsap.to(o, { xPercent: j < i ? -10 : 10, duration: .25, ease: 'power2.out', overwrite: 'auto' }); });
          });
        });
        c.addEventListener('pointerleave', () => inCtx(() => {
          gsap.to(c, { yPercent: 0, scale: 1, zIndex: i + 1, duration: .3, ease: 'power2.out', overwrite: 'auto' });
          fans.forEach((o, j) => { if (j !== i) gsap.to(o, { xPercent: 0, duration: .3, ease: 'power2.out', overwrite: 'auto' }); });
        }));
      });
    }
  }

  // ---------- อนุภาค ----------
  const P = { cv: null, g: null, list: [], sprite: null, on: false, dpr: 1 };
  function makeSprite() {
    const s = document.createElement('canvas'); s.width = s.height = 32; const g = s.getContext('2d');
    const grd = g.createRadialGradient(16, 16, 0, 16, 16, 16);
    grd.addColorStop(0, 'rgba(255,240,200,1)'); grd.addColorStop(.35, 'rgba(243,201,105,.45)'); grd.addColorStop(1, 'rgba(243,201,105,0)');
    g.fillStyle = grd; g.fillRect(0, 0, 32, 32); return s;
  }
  function sizeCanvas() {
    if (!P.cv) return;
    P.dpr = Math.min(devicePixelRatio || 1, 2);
    P.cv.width = Math.round(innerWidth * P.dpr); P.cv.height = Math.round(innerHeight * P.dpr);
  }
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
    P.cv = $('#lm-particles'); if (!P.cv) return;
    P.g = P.g || P.cv.getContext('2d'); P.sprite = P.sprite || makeSprite();
    sizeCanvas();
    const n = innerWidth < 768 ? 15 : 30;
    if (P.list.length !== n) P.list = Array.from({ length: n }, () => spawn({}, true)); // เล่นต่อจากเดิม ไม่กระโดด
    if (!P.on) { gsap.ticker.add(drawParticles); P.on = true; }
  }
  function stopParticles() {
    if (P.on) { gsap.ticker.remove(drawParticles); P.on = false; }
    if (P.g && P.cv) P.g.clearRect(0, 0, P.cv.width, P.cv.height);
  }
  addEventListener('resize', () => { if (running) { sizeCanvas(); const n = innerWidth < 768 ? 15 : 30; P.list.length = Math.min(P.list.length, n); while (P.list.length < n) P.list.push(spawn({}, true)); } });

  // ---------- เปิด/ปิด ----------
  function start(opts = {}) {
    stop();
    prepDom(); unhide();
    if (reduce) return; // สถานะนิ่งตามสเปก
    running = true; paused = false;
    const short = opts.short != null ? opts.short : (seen() || revealedEarly);
    markSeen();
    ctx = gsap.context(() => {
      const fan = $('.hero-card-fan');
      gsap.set(fan, { transformPerspective: 700 });
      if (canHover) {
        fanX = gsap.quickTo(fan, 'rotationX', { duration: .5, ease: 'power3' });
        fanY = gsap.quickTo(fan, 'rotationY', { duration: .5, ease: 'power3' });
      }
      intro = buildIntro(short);
      intro.eventCallback('onComplete', () => { if (running && ctx) ctx.add(startIdle); });
    });
    bindButtons();
    startParticles();
  }
  function stop() {
    P.list = []; // ออกจากล็อบบี้จริง: รอบหน้าค่อยสุ่มใหม่
    if (ctx) { ctx.revert(); ctx = null; }
    intro = null; fanX = fanY = null; iconLoops.clear();
    $$('.lm-ripple').forEach(d => d.remove());
    const ov = $('#lm-intro'); if (ov) ov.style.display = 'none';
    stopParticles();
    paused = false;
    running = false;
  }
  function setPaused(v) {
    if (!running || v === paused) return;
    paused = v;
    // หยุดเฉพาะแอนิเมชันของล็อบบี้ (ใน ctx) ไม่หยุดทั้งระบบ เพื่อให้แอนิเมชันหน้าต่างที่เปิดทับยังเล่นได้
    // จบฉากเปิดก่อน แล้วค่อยเก็บรายการ tween (onComplete ของฉากเปิดจะสร้างลูปพักหายใจเพิ่ม)
    if (v && intro && intro.progress() < 1) intro.progress(1);
    // v0.6 แก้ล็อบบี้ว่างหลังปิดหน้าต่าง: ctx.getTweens() คืน tween "จุดเริ่ม" ที่ GSAP สร้างแอบไว้ให้ .from()
    // (ยาว 0 วิ, เก็บค่าโปร่งใส) มาด้วย — เดิมสั่ง resume() ทุกตัว ตัวนี้จึงวาดค่าโปร่งใสทับล็อบบี้จนว่างเปล่า
    // → ข้ามตัว "จุดเริ่ม" (data 'isStart' / ยาว 0) และตัวที่หยุดอยู่แล้ว แล้วจำรายการไว้เล่นต่อชุดเดิมเท่านั้น
    if (v) {
      heldTweens = (ctx ? ctx.getTweens() : []).filter(t => t.data !== 'isStart' && t.totalDuration() > 0 && !t.paused());
      heldTweens.forEach(t => t.pause()); stopParticles();
    } else {
      heldTweens.forEach(t => t.resume()); heldTweens = []; startParticles();
    }
  }
  let heldTweens = [];

  // ตรวจสถานะทุก 200 ms: ล็อบบี้แสดงไหม · มีหน้าต่างทับไหม · แท็บซ่อนไหม (ไม่ต้องแก้ game.js)
  const visible = el => el && el.style.display !== 'none' && getComputedStyle(el).display !== 'none';
  function check() {
    const show = visible(lobby);
    if (show && !running && !reduce) start();
    else if (!show && running) stop();
    if (running) setPaused(document.hidden || $$('.modal-overlay').some(visible));
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

  if (visible(lobby)) start(); else { prepDom(); unhide(); }
  // MutationObserver ทำงานก่อนเบราว์เซอร์วาดเฟรมถัดไป: กลับมาล็อบบี้แล้วไม่เห็นภาพนิ่งแวบก่อนฉากเปิด
  new MutationObserver(check).observe(lobby, { attributes: true, attributeFilter: ['style', 'class'] });
  setInterval(check, 200); // สำรองสำหรับหน้าต่าง modal และแท็บ
})();
