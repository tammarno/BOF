/* ============================================================================
   BOF PACK OPEN: ฉากเปิดซองการ์ด (หน้าตาเท่านั้น · js/shop.js ตัดสินผลการสุ่มก่อนเรียก)
   BOFPackOpen.play(stage, { image, color, name, short, en, count, top, cards }) → Promise (จบเมื่อฉากจบหรือกดข้าม)
     ซองฟอยล์หนา 3 มิติ → ลากนิ้วตามรอยปรุเพื่อฉีก แสงลอดปากซองไล่สีขึ้นจนถึงใบสูงสุด (top)
     ×1: กล้องพุ่งเข้าปากซอง → ตัดดำ → สแปลช · ×10: ซองที่เหลือแตกต่อกัน → พลังงานรวมเป็นแกน → ระเบิด → สแปลช
   BOFPackOpen.ssrSpot(el) → Promise · ไฟส่องตอนพลิกใบ SSR บนหน้าผลการเปิดซอง
   reduced motion / ไม่มี GSAP = ข้ามฉาก (resolve ทันที)
   ============================================================================ */
(function () {
  const RAR = { N: { rgb: '226, 232, 245' }, R: { rgb: '124, 192, 255' }, SR: { rgb: '255, 133, 151' }, SSR: { rgb: '253, 224, 71' } };
  const ORDER = ['N', 'R', 'SR', 'SSR'];
  const LIGHT = { N: { L: 150, n: 10, pw: .55 }, R: { L: 210, n: 14, pw: .75 }, SR: { L: 270, n: 18, pw: .9 }, SSR: { L: 340, n: 24, pw: 1 } };
  const reduced = () => typeof gsap === 'undefined' || matchMedia('(prefers-reduced-motion: reduce)').matches;
  const rnd = (a, b) => a + Math.random() * (b - a);
  const mix = (a, b, k) => a.split(',').map((v, i) => Math.round(+v + (+b.split(',')[i] - +v) * k)).join(', ');
  const hexRgb = h => /^#[0-9a-f]{6}$/i.test(h) ? [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)).join(', ') : '62, 224, 143';
  const bump = ms => { if (window.BOFHaptic) window.BOFHaptic(ms); };
  const center = e => { const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, r }; };

  // ---------- แสงลอดปากซอง (canvas เดียวต่อฉาก) ----------
  function makeLight(cv) {
    const g = cv.getContext('2d');
    let dpr = 1, raf = 0, last = 0, st = null, rays = [], motes = [], dead = false;
    const resize = () => { dpr = Math.min(2, devicePixelRatio || 1); cv.width = innerWidth * dpr; cv.height = innerHeight * dpr; };
    resize(); addEventListener('resize', resize);
    function start(s) {
      st = s; st.zoom = st.zoom || 1;
      rays = [...Array(s.n)].map((_, i) => ({ u: Math.min(.98, (i + .5) / s.n + rnd(-.03, .03)), ang: (i / s.n - .5) * .9 + rnd(-.25, .25), len: rnd(.55, 1.15), w: rnd(4, 13), ph: rnd(0, 6.28) }));
      if (!raf && !dead) { last = performance.now(); raf = requestAnimationFrame(loop); }
      return st;
    }
    function loop(now) {
      if (dead) return;
      const dt = Math.min(.05, (now - last) / 1000); last = now;
      const W = innerWidth, H = innerHeight, t = now / 1000;
      g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, H);
      g.globalCompositeOperation = 'lighter';
      if (st && st.mouth.isConnected) {
        // ปลายซ้าย-ขวาของปากซองจริงหลังหมุน/เอียง (ไม่ใช้กรอบสี่เหลี่ยมที่ผิดเมื่อซองหมุน)
        const A = st.mouth.querySelector('.pz-ml').getBoundingClientRect(), B = st.mouth.querySelector('.pz-mr').getBoundingClientRect();
        const ax = A.left, ay = A.top, len = Math.hypot(B.left - ax, B.top - ay) || 1, ux = (B.left - ax) / len, uy = (B.top - ay) / len;
        const nAng = Math.atan2(-ux, uy), ang = Math.atan2(uy, ux);
        const { p, power, rgb } = st, mw = len * p, L0 = st.L * st.zoom;
        const at = k => [ax + ux * len * k, ay + uy * len * k];
        if (p > 0 && power > 0 && mw > 1) {
          const [mx, my] = at(p / 2), [xe, ye] = at(p);
          g.save(); g.translate(mx, my); g.rotate(ang); g.scale(1, .32);
          const bl = g.createRadialGradient(0, 0, 0, 0, 0, mw * .75 + 20);
          bl.addColorStop(0, `rgba(255,255,255,${.5 * power})`); bl.addColorStop(.35, `rgba(${rgb},${.32 * power})`); bl.addColorStop(1, `rgba(${rgb},0)`);
          g.fillStyle = bl; g.beginPath(); g.arc(0, 0, mw * .75 + 20, 0, 7); g.fill(); g.restore();
          rays.forEach(ry => {
            if (ry.u > p) return;
            const [bx, by] = at(ry.u), a = nAng + ry.ang + Math.sin(t * .9 + ry.ph) * .05;
            const L = L0 * ry.len * power * (.85 + .15 * Math.sin(t * 4 + ry.ph * 2)), w = ry.w * (.6 + .4 * power);
            const dx = Math.cos(a), dy = Math.sin(a), nx = -dy, ny = dx, tx = bx + dx * L, ty = by + dy * L;
            const gr = g.createLinearGradient(bx, by, tx, ty);
            gr.addColorStop(0, `rgba(255,255,255,${.7 * power})`); gr.addColorStop(.14, `rgba(${rgb},${.4 * power})`); gr.addColorStop(1, `rgba(${rgb},0)`);
            g.fillStyle = gr; g.beginPath();
            g.moveTo(bx + nx * w * .25, by + ny * w * .25); g.lineTo(tx + nx * w * 1.7, ty + ny * w * 1.7); g.lineTo(tx - nx * w * 1.7, ty - ny * w * 1.7); g.lineTo(bx - nx * w * .25, by - ny * w * .25);
            g.closePath(); g.fill();
          });
          g.save(); g.translate(ax, ay); g.rotate(ang);
          const sg = g.createLinearGradient(0, -7, 0, 7);
          sg.addColorStop(0, 'rgba(255,255,255,0)'); sg.addColorStop(.5, `rgba(255,255,255,${.95 * Math.min(1, power + .3)})`); sg.addColorStop(1, 'rgba(255,255,255,0)');
          g.fillStyle = sg; g.fillRect(0, -7, mw, 14);
          const ls = power * Math.min(1, p * 1.4), half = 200 + 260 * power, c = mw / 2;
          const lg = g.createLinearGradient(c - half, 0, c + half, 0);
          lg.addColorStop(0, `rgba(${rgb},0)`); lg.addColorStop(.5, `rgba(255,255,255,${.75 * ls})`); lg.addColorStop(1, `rgba(${rgb},0)`);
          g.fillStyle = lg; g.fillRect(c - half, -.8, half * 2, 1.6); g.globalAlpha = .22; g.fillRect(c - half, -5, half * 2, 10); g.globalAlpha = 1;
          g.restore();
          if (p < 1) { const tg = g.createRadialGradient(xe, ye, 0, xe, ye, 22); tg.addColorStop(0, 'rgba(255,255,255,1)'); tg.addColorStop(.3, `rgba(${rgb},.8)`); tg.addColorStop(1, `rgba(${rgb},0)`); g.fillStyle = tg; g.fillRect(xe - 22, ye - 22, 44, 44); }
          if (Math.random() < power * Math.min(1, p * 2) * 1.4) { const [sx, sy] = at(p * Math.random()), v = rnd(35, 110); motes.push({ x: sx, y: sy, vx: Math.cos(nAng) * v + rnd(-14, 14), vy: Math.sin(nAng) * v, life: rnd(.8, 1.7), age: 0, s: rnd(.8, 2.4), ph: rnd(0, 6), rgb }); }
        }
      }
      for (let i = motes.length - 1; i >= 0; i--) {
        const m = motes[i]; m.age += dt; if (m.age > m.life) { motes.splice(i, 1); continue; }
        m.x += (m.vx + Math.sin(t * 2 + m.ph) * 10) * dt; m.y += m.vy * dt;
        const a = 1 - m.age / m.life, gr = g.createRadialGradient(m.x, m.y, 0, m.x, m.y, m.s * 4);
        gr.addColorStop(0, `rgba(255,255,255,${a})`); gr.addColorStop(.4, `rgba(${m.rgb},${a * .6})`); gr.addColorStop(1, `rgba(${m.rgb},0)`);
        g.fillStyle = gr; g.fillRect(m.x - m.s * 4, m.y - m.s * 4, m.s * 8, m.s * 8);
      }
      if (st || motes.length) raf = requestAnimationFrame(loop); else { raf = 0; g.clearRect(0, 0, W, H); }
    }
    return {
      start, stop: () => { st = null; }, clear: () => { st = null; motes.length = 0; },
      destroy: () => { dead = true; cancelAnimationFrame(raf); removeEventListener('resize', resize); },
    };
  }

  // ============================================================================
  function play(stage, o) {
    if (!stage || reduced()) return Promise.resolve();
    const top = ORDER.includes(o.top) ? o.top : 'N', x10 = o.count >= 10;
    const deckRgb = hexRgb(o.color);
    const ladder = ORDER.slice(0, ORDER.indexOf(top) + 1);
    const tearColor = p => { if (ladder.length === 1) return RAR.N.rgb; const f = Math.min(.999, p) * (ladder.length - 1), i = Math.floor(f); return mix(RAR[ladder[i]].rgb, RAR[ladder[Math.min(ladder.length - 1, i + 1)]].rgb, Math.min(1, (f - i) * 2.2)); };
    const timers = new Set(), tweens = [];
    let skipped = false, resolveSkip;
    const skipP = new Promise(r => { resolveSkip = r; });
    const wait = ms => new Promise(r => { const t = setTimeout(() => { timers.delete(t); r(); }, ms); timers.add(t); });
    const step = p => Promise.race([p, skipP]).then(() => { if (skipped) throw 'skip'; });

    const root = document.createElement('div');
    root.className = 'pko';
    root.style.setProperty('--deck', o.color); root.style.setProperty('--deck-rgb', deckRgb);
    root.style.setProperty('--rar-rgb', RAR[top].rgb);
    root.innerHTML = '<div class="pko-bg"></div><div class="pko-scene"></div><canvas class="pko-light" aria-hidden="true"></canvas><div class="pko-fx"></div><div class="pko-hint" aria-live="polite"></div><button type="button" class="pko-skip">ข้าม ›</button>';
    stage.innerHTML = ''; stage.appendChild(root);
    stage.className = 'bof-pack-anim-stage is-playing'; stage.style.display = 'flex';
    const scene = root.querySelector('.pko-scene'), fx = root.querySelector('.pko-fx'), hint = root.querySelector('.pko-hint');
    const Light = makeLight(root.querySelector('.pko-light'));
    const el = (cls, parent = scene, html = '') => { const d = document.createElement('div'); d.className = cls; if (html) d.innerHTML = html; parent.appendChild(d); return d; };
    const flashWhite = (dur = .35, max = .9) => { const f = el('flash', fx); gsap.fromTo(f, { opacity: max }, { opacity: 0, duration: dur, ease: 'power2.out', onComplete: () => f.remove() }); };
    const shake = (amt = 8, dur = .3) => gsap.fromTo(scene, { x: 0, y: 0 }, { duration: dur, ease: 'none', keyframes: [...Array(6)].map((_, i) => ({ x: rnd(-amt, amt) * (1 - i / 6), y: rnd(-amt, amt) * (1 - i / 6) })).concat([{ x: 0, y: 0 }]) });
    const burst = (x, y, opt) => { if (!skipped && window.BOFParticles) BOFParticles.burst(fx, x, y, opt); };
    const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    const POUCH = (badge = false) => `<div class="pouch">
      <div class="pz-stack">${[1, 2, 3, 4, 5, 6, 7, 8].map(k => `<i style="--k:${k}"></i>`).join('')}</div>
      <div class="pz-front">
        <div class="pz-body"><div class="pz-clip"><div class="pz-art"><img src="${esc(o.image)}" alt=""></div><div class="pz-emboss"></div><div class="pz-title">${esc(o.short)}</div><div class="pz-brand">BOF<small>CARD PACK · ${o.perPack || 5}</small></div><div class="pz-pillow"></div><div class="pz-sheen"></div></div><div class="pz-mouth"></div><div class="pz-ml"></div><div class="pz-mr"></div></div>
        <div class="pz-top"><div class="pz-tab">TEAR ›</div><div class="pz-no">BOF</div><div class="pz-dots"></div><div class="pz-sheen"></div></div>
        <div class="pz-notch"></div><div class="pz-seam"></div>
      </div>${badge ? '<div class="x10">×10</div>' : ''}</div>`;

    const listeners = [];
    const on = (t, ev, fn, opt) => { t.addEventListener(ev, fn, opt); listeners.push([t, ev, fn, opt]); };
    function cleanup() {
      listeners.forEach(([t, ev, fn, opt]) => t.removeEventListener(ev, fn, opt));
      timers.forEach(clearTimeout); timers.clear();
      gsap.killTweensOf(root.querySelectorAll('*')); gsap.killTweensOf(scene);
      Light.destroy();
      if (window.BOFParticles) BOFParticles.clear();
      stage.className = 'bof-pack-anim-stage'; stage.style.display = 'none'; stage.innerHTML = '';
    }
    const skipBtn = root.querySelector('.pko-skip');
    on(skipBtn, 'click', e => { e.stopPropagation(); if (!skipped) { skipped = true; resolveSkip(); } });

    // ---------- ฉีกซอง ----------
    async function tear(wrap) {
      const pouch = wrap.querySelector('.pouch'), topEl = pouch.querySelector('.pz-top'), seam = pouch.querySelector('.pz-seam'), body = pouch.querySelector('.pz-body');
      on(root, 'pointermove', e => {
        const r = pouch.getBoundingClientRect(), dx = (e.clientX - (r.left + r.width / 2)) / r.width, dy = (e.clientY - (r.top + r.height / 2)) / r.height;
        gsap.to(pouch, { rotateY: dx * 28, rotateX: -dy * 18, duration: .4 });
        pouch.querySelectorAll('.pz-sheen').forEach(s => s.style.setProperty('--sx', (.5 + dx * .9).toFixed(3)));
      });
      tweens.push(gsap.to(pouch, { y: -8, duration: 1.4, yoyo: true, repeat: -1, ease: 'sine.inOut' }));
      hint.textContent = 'ลากตามรอยปรุด้านบนเพื่อฉีกซอง ›'; hint.classList.add('on');
      await step(wait(500));
      const lp = LIGHT[top], L = Light.start({ mouth: body, p: 0, power: 0, rgb: RAR.N.rgb, L: lp.L, n: lp.n });
      let p = 0, lastSpark = 0, stageIdx = 0, drag = false, r = null;
      const setP = v => {
        p = Math.max(p, Math.min(1, v)); L.p = p; L.power = .3 + .4 * p; L.rgb = tearColor(p);
        seam.style.width = (p * 100) + '%'; seam.style.boxShadow = `0 0 6px 1px rgba(${L.rgb},.9)`;
        gsap.set(topEl, { rotation: -p * 7, y: -p * 6 });
        const si = Math.min(ladder.length - 1, Math.floor(p * (ladder.length - 1) + .45)), y0 = r.bottom - 4;
        if (si > stageIdx) { stageIdx = si; bump(15 + si * 10); burst(r.left + r.width * p, y0, { count: 14, rings: 1, radius: 50, speed: 220, size: 11, color: RAR[ladder[si]].rgb, color2: '255, 255, 255' }); }
        const now = performance.now();
        if (now - lastSpark > 60) { lastSpark = now; burst(r.left + r.width * p, y0, { count: 4, rings: 0, speed: 130, size: 7, life: .4, gravity: 260, color: L.rgb, color2: '255, 255, 255' }); }
      };
      // ลากได้ทั้งเมาส์และนิ้ว: กดใกล้แถบบน แล้วเลื่อนไปทางขวา (จับ pointer ไว้ ไม่ให้เบราว์เซอร์เลือกข้อความ/เลื่อนจอ)
      await step(new Promise(done => {
        on(root, 'pointerdown', e => {
          if (e.target === skipBtn) return;
          const b = topEl.getBoundingClientRect();
          if (e.clientY > b.top - 60 && e.clientY < b.bottom + 60) { drag = true; r = b; e.preventDefault(); try { root.setPointerCapture(e.pointerId); } catch (_) { } }
        });
        on(root, 'pointermove', e => { if (!drag) return; setP((e.clientX - r.left) / r.width); if (p >= 1) done(); });
        on(root, 'pointerup', () => { drag = false; });
        on(root, 'dragstart', e => e.preventDefault());
        // แป้นพิมพ์: Enter/Space ฉีกให้ทันที
        on(root, 'keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); r = topEl.getBoundingClientRect(); gsap.to({ v: p }, { v: 1, duration: .5, onUpdate() { setP(this.targets()[0].v); }, onComplete: done }); } });
      }));
      hint.classList.remove('on'); tweens.forEach(t => t.kill());
      bump(30); shake(5, .22);
      gsap.to(topEl, { x: 170, y: -150, rotation: 38, opacity: 0, duration: .55, ease: 'power2.out' });
      seam.remove();
      gsap.to(body.querySelector('.pz-mouth'), { opacity: 1, duration: .25 });
      burst(r.left + r.width / 2, r.bottom - 4, { count: 24, rings: 1, radius: 90, speed: 300, size: 11, color: RAR[top].rgb, color2: '255, 255, 255' });
      gsap.to(L, { power: lp.pw, duration: .35, ease: 'power2.out' }); L.rgb = RAR[top].rgb;
      if (window.BOF_AUDIO && window.BOF_AUDIO.playPackOpen) window.BOF_AUDIO.playPackOpen();
      return { pouch, L };
    }

    // ---------- ×10: ซองที่เหลือแตกต่อกัน (แสงวาบสั้นจางพร้อมซอง) ----------
    async function chain(ghosts) {
      const pts = [];
      for (let i = 0; i < ghosts.length; i++) {
        const gp = ghosts[i], body = gp.querySelector('.pz-body'), tp = gp.querySelector('.pz-top');
        gsap.to(gp, { x: 0, y: 0, z: 0, rotationZ: 0, duration: .09, ease: 'power2.out' });
        await step(wait(90));
        const rgb = i === ghosts.length - 1 ? RAR[top].rgb : tearColor(i / ghosts.length), c = center(body);
        pts.push({ x: c.x + rnd(-40, 40), y: c.r.top, rgb });
        const f = el('mouth-flash', fx); f.style.setProperty('--c', rgb); gsap.set(f, { left: c.x, top: c.r.top });
        gsap.fromTo(f, { scaleX: .3, opacity: 1 }, { scaleX: 1.4, opacity: 0, duration: .28, ease: 'power2.out', onComplete: () => f.remove() });
        gsap.to(tp, { x: rnd(120, 200), y: rnd(-170, -120), rotation: rnd(25, 50), opacity: 0, duration: .4, ease: 'power2.out' });
        burst(c.x, c.r.top, { count: 12, rings: 0, speed: 240, size: 9, color: rgb, color2: '255, 255, 255' });
        shake(3 + i * .6, .16); bump(12);
        gsap.to(gp, { y: 60, opacity: 0, duration: .22, delay: .06, ease: 'power2.in' });
        await step(wait(60));
      }
      Light.clear();
      return pts;
    }
    // ---------- ×10: พลังงานพุ่งรวมเป็นแกน → เต้น 2 จังหวะ → ยุบ → ระเบิด ----------
    async function converge(pts) {
      const cx = innerWidth / 2, cy = innerHeight * .44, rgb = RAR[top].rgb;
      const core = el('core', fx, '<i class="r1"></i><i class="r2"></i><b></b>'); core.style.setProperty('--c', rgb); gsap.set(core, { left: cx, top: cy, scale: 0 });
      pts.forEach((p, i) => {
        for (let k = 0; k < 3; k++) {
          const s = el('streak', fx); s.style.setProperty('--c', p.rgb);
          const sx = p.x + rnd(-60, 60), sy = p.y + rnd(-50, 30);
          gsap.set(s, { left: sx, top: sy, rotation: Math.atan2(cy - sy, cx - sx) * 180 / Math.PI, scaleX: .2, opacity: 0 });
          gsap.timeline({ delay: i * .035 + k * .05, onComplete: () => s.remove() })
            .to(s, { opacity: 1, scaleX: 1, duration: .12 })
            .to(s, { left: cx, top: cy, duration: .38, ease: 'power3.in' }, '<.04')
            .to(s, { scaleX: .1, opacity: 0, duration: .1 });
        }
      });
      gsap.to(core, { scale: 1, duration: .55, delay: .2, ease: 'back.out(1.6)' });
      gsap.set(core.querySelector('.r1'), { rotationX: 68 }); gsap.set(core.querySelector('.r2'), { rotationY: 64 });
      gsap.to(core.querySelector('.r1'), { rotationZ: 360, duration: 1.6, ease: 'none', repeat: -1 });
      gsap.to(core.querySelector('.r2'), { rotationX: 360, duration: 2.2, ease: 'none', repeat: -1 });
      await step(wait(820));
      for (let k = 0; k < 2; k++) {
        gsap.fromTo(core, { scale: 1.18 }, { scale: 1, duration: .28, ease: 'power2.out' });
        const ring = el('pulse-ring', fx); ring.style.setProperty('--c', rgb); gsap.set(ring, { left: cx, top: cy });
        gsap.fromTo(ring, { scale: .3, opacity: .9 }, { scale: 2.6 + k, opacity: 0, duration: .55, ease: 'power2.out', onComplete: () => ring.remove() });
        bump(15); await step(wait(300));
      }
      await step(new Promise(res => gsap.to(core, { scale: .12, duration: .2, ease: 'power3.in', onComplete: res })));
      core.remove();
      flashWhite(.45, .95); shake(12, .4); bump(45);
      const wave = el('pulse-ring big', fx); wave.style.setProperty('--c', rgb); gsap.set(wave, { left: cx, top: cy });
      gsap.fromTo(wave, { scale: .2, opacity: 1 }, { scale: 9, opacity: 0, duration: .7, ease: 'power3.out', onComplete: () => wave.remove() });
      burst(cx, cy, { count: 46, rings: 2, radius: 220, speed: 560, size: 15, color: rgb, color2: '255, 255, 255' });
      await step(wait(260));
    }
    // ---------- สแปลช ----------
    async function splash() {
      const sp = el('splash', scene, `<div class="stripes"></div><div class="big l1">${esc(o.en)} PACK${x10 ? ' ×10' : ''}</div><div class="big l2">BATTLE OF</div>
        <div class="script"><svg viewBox="0 0 300 40" preserveAspectRatio="none"><path d="M6 30 C 70 14, 150 34, 296 12" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1"/></svg><b>Open now!</b></div>
        <div class="cap">${esc(o.name)} · ${o.cards} ใบ · BOF</div><div class="pz-wrap">${POUCH(x10)}</div><div class="sweep"></div>`);
      const spWrap = sp.querySelector('.pz-wrap'); sp.querySelector('.pz-top').style.display = 'none'; sp.querySelector('.pz-seam').remove();
      gsap.set(sp.querySelector('.pz-mouth'), { opacity: 1 });
      gsap.timeline()
        .fromTo(sp.querySelector('.stripes'), { x: 0 }, { x: -120, duration: 2.2, ease: 'none' }, 0)
        .fromTo(sp.querySelector('.l1'), { xPercent: -60, opacity: 0, skewX: -12 }, { xPercent: 0, opacity: 1, skewX: 0, duration: .45, ease: 'power4.out' }, 0)
        .fromTo(sp.querySelector('.l2'), { xPercent: 40, opacity: 0 }, { xPercent: 0, opacity: 1, duration: .5, ease: 'power4.out' }, .08)
        .fromTo(sp.querySelector('.script b'), { clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)', duration: .55, ease: 'power1.inOut' }, .3)
        .to(sp.querySelector('.script path'), { strokeDashoffset: 0, duration: .4, ease: 'power2.out' }, .7)
        .fromTo(spWrap, { x: 300, rotateZ: -32, rotateY: 40, scale: 1.25, opacity: 0 }, { x: 0, rotateZ: -18, rotateY: 26, scale: 1.25, opacity: 1, duration: .55, ease: 'power3.out' }, .12)
        .fromTo(sp.querySelector('.sweep'), { backgroundPosition: '-100% 0' }, { backgroundPosition: '200% 0', duration: .7, ease: 'power2.inOut' }, .55)
        .to(spWrap, { rotateZ: -14, rotateY: 14, duration: 1.2, ease: 'sine.inOut' }, .7)
        .fromTo(sp.querySelector('.cap'), { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: .4 }, .5);
      const L = Light.start({ mouth: sp.querySelector('.pz-body'), p: 1, power: 0, rgb: RAR[top].rgb, L: LIGHT[top].L * .8, n: LIGHT[top].n });
      gsap.to(L, { power: LIGHT[top].pw * .85, duration: .5, delay: .4 });
      await step(wait(1550));
      gsap.to(spWrap, { x: '+=4', duration: .04, repeat: 7, yoyo: true });
      const m = center(sp.querySelector('.pz-body'));
      burst(m.x, m.r.top + 10, { count: 30, rings: 2, radius: 120, speed: 380, size: 13, color: RAR[top].rgb, color2: '255, 255, 255' });
      flashWhite(.3, .6); bump(30);
      gsap.to(L, { power: 0, duration: .3 });
      await step(new Promise(r => gsap.to(sp, { opacity: 0, duration: .45, delay: .15, onComplete: r })));
    }

    async function run() {
      const wrap = el('pz-wrap', scene, '<div class="pz-ground"></div>' + POUCH(x10) + (x10 ? POUCH().repeat(9) : ''));
      const ghosts = [...wrap.querySelectorAll('.pouch')].slice(1);
      ghosts.forEach((gp, i) => { gp.style.zIndex = -1 - i; gsap.set(gp, { x: (i + 1) * 5, y: -(i + 1) * 6, z: -(i + 1) * 18, rotationZ: (i + 1) * 1.3 }); gp.querySelector('.pz-seam').remove(); });
      gsap.fromTo(wrap, { y: 60, opacity: 0, rotateZ: -6 }, { y: 0, opacity: 1, rotateZ: 0, duration: .6, ease: 'back.out(1.6)' });
      root.tabIndex = -1; root.focus({ preventScroll: true });
      const { pouch, L } = await tear(wrap);
      await step(wait(420));
      if (x10) {
        gsap.to(pouch, { y: 70, opacity: 0, duration: .25, ease: 'power2.in' }); gsap.to(L, { power: 0, duration: .22 });
        await step(wait(120)); const pts = await chain(ghosts); await step(wait(120));
        wrap.remove(); await converge(pts);
      } else {
        gsap.to(L, { zoom: 2.2, duration: .45, ease: 'power3.in' });
        gsap.to(wrap, { scale: 2.4, y: 180, duration: .45, ease: 'power3.in' });
        await step(wait(400));
        Light.clear();
        const blk = el('blackout', scene); gsap.set(blk, { opacity: 1 });
        await step(wait(160)); wrap.remove();
        gsap.to(blk, { opacity: 0, duration: .25, delay: .05, onComplete: () => blk.remove() });
      }
      await splash();
    }
    return run().catch(e => { if (e !== 'skip') console.warn('[pack-open]', e); }).then(cleanup);
  }

  // ---------- ไฟส่องตอนพลิกใบ SSR บนหน้าผลการเปิดซอง ----------
  function ssrSpot(cardEl) {
    if (!cardEl || reduced()) return Promise.resolve();
    const c = center(cardEl);
    const spot = document.createElement('div'); spot.className = 'pko-spot';
    spot.innerHTML = '<div class="dim"></div><div class="rays"></div><div class="beam"></div>';
    (cardEl.closest('dialog[open]') || document.body).appendChild(spot);
    const dim = spot.querySelector('.dim'), rays = spot.querySelector('.rays'), beam = spot.querySelector('.beam');
    gsap.fromTo(dim, { opacity: 0 }, { opacity: .55, duration: .25 });
    gsap.set(rays, { left: c.x, top: c.y }); gsap.fromTo(rays, { opacity: 0, scale: .6 }, { opacity: 1, scale: 1, rotation: 40, duration: 2.2, ease: 'none' });
    beam.style.left = c.x + 'px'; gsap.fromTo(beam, { scaleY: 0 }, { scaleY: 1, duration: .35, ease: 'power3.out' });
    gsap.to(cardEl, { x: '+=3', duration: .04, repeat: 9, yoyo: true, ease: 'none', clearProps: 'x' });
    return new Promise(res => setTimeout(() => {
      const s = document.createElement('div'); s.className = 'ssr-stamp'; s.textContent = 'SSR!'; spot.appendChild(s);
      gsap.set(s, { left: c.x, top: c.r.top - 30, xPercent: -50, yPercent: -50 });
      gsap.fromTo(s, { scale: 3, opacity: 0, rotation: -12 }, { scale: 1, opacity: 1, rotation: -6, duration: .3, ease: 'back.out(2)' });
      const f = document.createElement('div'); f.className = 'flash'; spot.appendChild(f);
      gsap.fromTo(f, { opacity: .8 }, { opacity: 0, duration: .5 });
      bump(40);
      gsap.to(spot, { opacity: 0, duration: .6, delay: 1, onComplete: () => spot.remove() });
      res();
    }, 520));
  }

  window.BOFPackOpen = { play, ssrSpot };
})();
