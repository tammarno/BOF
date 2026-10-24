/* ============================================================================
   LOBBY MOTION (BOF v0.8) — โหลดหลัง vendor/gsap.min.js
   ฉากเปิด → ลีดเดอร์ยกขึ้น เมนูทยอยเข้า ปุ่มเริ่มดวลเด้ง
   สลับเด็ค: ไพ่บนกำแพงพลิกเป็นคลื่นจากกลางออกไป · ลีดเดอร์ใบเดิมหมุนออก ใบใหม่หมุนเข้า
   ตอนว่าง: กำแพงเลื่อนช้าๆ · ไพ่พลิกเป็นใบอื่นในเด็คเดียวกัน · ลีดเดอร์ลอย · ปุ่มเรือง · ประกาย
   กฎ: transform/opacity เท่านั้น · reduced motion = สถานะสุดท้ายทันที · ไม่มี JS ก็ยังเห็นทุกอย่าง
   สเปก: docs/specs/2026-10-24-lobby-game-design.md §5
   ============================================================================ */
(function () {
  const root = document.documentElement;
  const unhide = () => root.classList.remove('lm-pre');
  const revealedEarly = !root.classList.contains('lm-pre'); // ตัวกันค้าง 1.5 วิ ใน <head> เปิดล็อบบี้ไปก่อนแล้ว
  const noop = () => {};
  const stub = { start: noop, stop: noop, isRunning: () => false, isPaused: () => false, _particleCount: () => 0, _particlesActive: () => false, _particlePos: () => ({ x: 0, y: 0 }) };
  const lobby = document.getElementById('lobby-screen');
  if (typeof gsap === 'undefined' || !lobby) { unhide(); window.LobbyMotion = stub; return; }

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const seen = () => { try { return sessionStorage.getItem('lm-seen') === '1'; } catch (e) { return false; } };
  const markSeen = () => { try { sessionStorage.setItem('lm-seen', '1'); } catch (e) {} };
  const randomOf = list => list[Math.floor(Math.random() * list.length)];

  let ctx = null, running = false, paused = false, intro = null, heldTweens = [], idleTimer = 0;

  // ---------- ฉากเปิด ----------
  // ใช้ opacity (ไม่ใช่ autoAlpha) เพื่อให้ปุ่มกดได้ระหว่างฉากเปิด
  function buildIntro(short) {
    const k = short ? .5 : 1;
    // clearProps: คืน transform ให้ CSS — .lb-menu / #lb-decks ใช้ translate(-50%) จัดตำแหน่ง
    // ถ้าค้างเป็น inline แล้วหมุนจอข้าม breakpoint ตำแหน่งจะผิด
    return gsap.timeline()
      .from('#lb-wall', { opacity: 0, duration: .8 * k, ease: 'power1.out' })
      .from('#lb-leader', { opacity: 0, y: 40, scale: .92, duration: .7 * k, ease: 'power3.out', clearProps: 'transform' }, .15 * k)
      .from('.lb-logo, .lb-info, .lb-menu, #lb-decks, .lb-join-slot', { opacity: 0, y: 16, duration: .45 * k, ease: 'power2.out', stagger: .07 * k, clearProps: 'transform' }, .45 * k)
      .from('#lb-play', { opacity: 0, scale: .85, duration: .5 * k, ease: 'back.out(2)', clearProps: 'transform' }, .85 * k);
  }
  // กดปุ่ม/ลิงก์ระหว่างฉากเปิด: ไม่ข้ามฉาก เพราะของจะกระโดดหนีจากใต้นิ้วก่อนปล่อย ทำให้คลิกหาย
  function skipIntro(e) {
    if (e.type === 'pointerdown' && e.target.closest && e.target.closest('button, a, input, label')) return;
    if (intro && intro.progress() < 1) intro.progress(1);
  }

  // ---------- กำแพงการ์ด: พลิกไพ่ ----------
  // พลิกแบบ 2D: หดแนวนอนจนแบน → เปลี่ยนภาพ → กางกลับ (ภาพเดียวต่อช่อง ไม่ใช้ 3D)
  // วัดแล้ว: ไพ่ 3D 60 ใบ / หมุน rotateY พร้อมกัน / บังคับ reflow ทีละใบ ต่างทำเฟรมตกเหลือ 30fps
  // timeline ของการพลิกไม่เก็บใน ctx (พลิกตอนว่างวันละหลายพันครั้งจะค้างอยู่ใน ctx) — เก็บเฉพาะที่ยังเล่นอยู่
  let flipTimers = [];
  const flipTls = new Set();
  const clearFlips = () => { flipTimers.forEach(clearTimeout); flipTimers = []; };
  const killFlips = () => { flipTls.forEach(tl => tl.progress(1).kill()); flipTls.clear(); };
  function setCard(tile, card) {
    const img = tile.querySelector('img.front');
    img.onerror = () => { img.onerror = null; img.src = card.image; };
    img.src = LobbyData.thumbOf(card);
  }
  function flipTile(tile, card, delay) {
    flipTimers.push(setTimeout(() => {
      if (!tile.isConnected || !running) return;
      const img = tile.querySelector('img.front');
      tile.dataset.cardId = card.id;
      tile.classList.add('flipping');
      const tl = gsap.timeline({ onComplete: () => { tile.classList.remove('flipping'); flipTls.delete(tl); } })
        .to(img, { scaleX: 0, duration: .22, ease: 'power1.in', overwrite: 'auto' })
        .add(() => setCard(tile, card))
        .to(img, { scaleX: 1, duration: .3, ease: 'power2.out' });
      flipTls.add(tl);
      if (paused) tl.pause();
    }, delay));
  }
  // คลื่นพลิกเฉพาะไพ่ที่เห็นบนจอ · ไพ่นอกจอเปลี่ยนภาพทันที (ลดงานต่อเฟรมตอนสลับเด็ค)
  function waveTo(key) {
    clearFlips();
    const cards = LobbyData.cardsOfDeck(key);
    const tiles = $$('#lb-wall .lb-tile');
    const { cols, rows } = LobbyView.wallSize();
    const cr = (rows - 1) / 2, cc = (cols - 1) / 2;
    const rects = tiles.map(t => t.getBoundingClientRect()); // อ่านทั้งหมดก่อน แล้วค่อยเขียน
    tiles.forEach((t, i) => {
      const card = randomOf(cards), r = rects[i];
      const onScreen = r.right > 0 && r.bottom > 0 && r.left < innerWidth && r.top < innerHeight;
      if (onScreen) flipTile(t, card, Math.hypot(t.dataset.r - cr, t.dataset.c - cc) * 70);
      else { t.dataset.cardId = card.id; setCard(t, card); }
    });
  }
  function idleFlip() {
    if (!running || paused) return;
    const cards = LobbyData.cardsOfDeck(LobbyView.selectedDeck());
    const tiles = $$('#lb-wall .lb-tile:not(.flipping)');
    for (let i = 0; i < 2 && tiles.length; i++) flipTile(tiles.splice(Math.floor(Math.random() * tiles.length), 1)[0], randomOf(cards), 0);
  }

  // ---------- สลับเด็ค (lobby.js เปลี่ยนข้อมูลแล้ว และไม่สร้างกำแพงใหม่ขณะ motion ทำงาน) ----------
  $('#lb-decks')?.addEventListener('lobby:deck', e => {
    if (!running) return;
    waveTo(e.detail.key);
    const imgs = $$('#lb-leader img');
    const fresh = imgs[imgs.length - 1];
    const old = imgs.filter(i => i !== fresh);
    ctx.add(() => {
      if (old.length) gsap.to(old, { xPercent: -30, rotationY: 35, opacity: 0, duration: .4, ease: 'power2.in', overwrite: 'auto' });
      gsap.fromTo(fresh, { xPercent: 30, rotationY: -35, opacity: 0 }, { xPercent: 0, rotationY: 0, opacity: 1, duration: .5, ease: 'power3.out', clearProps: 'transform', overwrite: 'auto' });
    });
  });

  // ---------- ปุ่ม: ยุบเมื่อกด ----------
  const PRESSABLE = '.lb-play, .lb-deck, .lb-btn, .lb-join-btn';
  if (!reduce) {
    lobby.addEventListener('pointerdown', e => {
      const el = e.target.closest(PRESSABLE); if (!el) return;
      gsap.to(el, { scale: .97, duration: .06, ease: 'power1.out', overwrite: 'auto' });
    });
    // clearProps: คืน transform ให้ CSS (เช่น .lb-deck ที่เลือกยกขึ้น 6px ด้วย CSS)
    const release = e => {
      const el = e.target.closest && e.target.closest(PRESSABLE); if (!el) return;
      gsap.to(el, { scale: 1, duration: .3, ease: 'back.out(2)', overwrite: 'auto', clearProps: 'transform' });
    };
    lobby.addEventListener('pointerup', release);
    lobby.addEventListener('pointerout', release);
  }

  // ---------- ประกาย (canvas อยู่เหนือกำแพง ใต้เนื้อหา) ----------
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
    ($('.lb-vignette') || lobby.firstChild).after(P.cv);
    P.g = P.cv.getContext('2d'); P.sprite = makeSprite();
  }
  function sizeCanvas() {
    if (!P.cv) return;
    P.dpr = Math.min(devicePixelRatio || 1, 2);
    P.cv.width = Math.round(lobby.clientWidth * P.dpr); P.cv.height = Math.round(lobby.clientHeight * P.dpr);
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

  // ---------- ตอนว่าง ----------
  function startIdle() {
    gsap.to('#lb-leader', { y: -10, duration: 2, ease: 'sine.inOut', yoyo: true, repeat: -1 });
    gsap.fromTo('.lb-wall-inner', { xPercent: -6 }, { xPercent: 6, duration: 60, ease: 'none', yoyo: true, repeat: -1 });
    gsap.to('.lb-play-glow', { opacity: .9, scale: 1.06, duration: 1.1, ease: 'sine.inOut', yoyo: true, repeat: -1 });
  }

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
      intro.eventCallback('onComplete', () => { if (running && ctx) ctx.add(startIdle); });
    });
    idleTimer = setInterval(idleFlip, 1400);
    startParticles();
  }
  function stop() {
    P.list = []; // ออกจากล็อบบี้จริง: รอบหน้าค่อยสุ่มใหม่
    clearInterval(idleTimer); idleTimer = 0;
    clearFlips(); killFlips(); $$('#lb-wall .flipping').forEach(t => t.classList.remove('flipping'));
    if (ctx) { ctx.revert(); ctx = null; }
    $$('#lb-leader img').slice(0, -1).forEach(i => i.remove()); // ใบที่กำลังหมุนออกค้างอยู่
    intro = null; heldTweens = [];
    stopParticles();
    paused = false; running = false;
  }
  function setPaused(v) {
    if (!running || v === paused) return;
    paused = v;
    if (v && intro && intro.progress() < 1) intro.progress(1);
    // ข้าม tween "จุดเริ่ม" ของ .from() (ยาว 0 วิ) — resume ตัวนี้จะวาดค่าโปร่งใสทับล็อบบี้ (บั๊ก v0.6)
    if (v) {
      heldTweens = (ctx ? ctx.getTweens() : []).filter(t => t.data !== 'isStart' && t.totalDuration() > 0 && !t.paused());
      heldTweens.forEach(t => t.pause()); flipTls.forEach(t => t.pause()); stopParticles();
    } else {
      heldTweens.forEach(t => t.resume()); flipTls.forEach(t => t.resume()); heldTweens = []; startParticles();
    }
  }

  // ตรวจสถานะ: ล็อบบี้แสดงไหม · มีหน้าต่างทับไหม · แท็บซ่อนไหม (ไม่ต้องแก้ game.js)
  const visible = el => el && el.style.display !== 'none' && getComputedStyle(el).display !== 'none';
  const covered = () => $$('.modal-overlay').some(visible) || $$('#lobby-screen dialog').some(d => d.open) || document.body.classList.contains('holo-inspecting');
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
    _ctxTweens: () => (ctx ? ctx.getTweens().length : 0),
  };

  if (visible(lobby)) start(); else unhide();
  // MutationObserver ทำงานก่อนเบราว์เซอร์วาดเฟรมถัดไป: กลับมาล็อบบี้แล้วไม่เห็นภาพนิ่งแวบก่อนฉากเปิด
  new MutationObserver(check).observe(lobby, { attributes: true, attributeFilter: ['style', 'class'] });
  setInterval(check, 200); // สำรองสำหรับหน้าต่าง modal, dialog และแท็บ
})();
