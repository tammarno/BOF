/* ============================================================================
   BOF อนุภาค (canvas เดียว · วาดด้วย sprite ที่เตรียมไว้ · rAF ทำงานเฉพาะตอนมีอนุภาค)
   BOFParticles.reward(layer, from, targets, opts) — เหรียญ/คริสตัลแตกออกแล้วบินโค้งเข้าตัวนับ
   BOFParticles.burst(layer, x, y, opts)          — ประกายแตกกระจาย + วงแสง
     opts: count, radius, color ('r, g, b'), speed, size, life, gravity, angle+spread (พุ่งเป็นกรวย), rings (0-2), delay
   layer: document.body (พิกัดจอ) หรือกล่อง position fixed/absolute ที่ลอยอยู่ (เช่น <dialog> ที่เปิด, ฉากเปิดซอง)
          ที่เลื่อนได้ก็ใช้ได้ (canvas ตามตำแหน่ง scroll ตอนเริ่ม)
   ============================================================================ */
(function () {
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  let cv = null, ctx = null, layer = null, ox = 0, oy = 0, dpr = 1, raf = 0, last = 0;
  const parts = [];

  // ---------- sprites (วาดครั้งเดียว) ----------
  function sprite(size, draw) {
    const c = document.createElement('canvas');
    c.width = c.height = size;
    draw(c.getContext('2d'), size);
    return c;
  }
  const S = {};
  function makeSprites() {
    if (S.coin) return;
    S.coin = sprite(48, (g, s) => {
      const r = s / 2 - 6;
      g.shadowColor = 'rgba(255, 210, 90, .9)'; g.shadowBlur = 8;
      const grad = g.createRadialGradient(s * .38, s * .34, 2, s / 2, s / 2, r);
      grad.addColorStop(0, '#fff6cf'); grad.addColorStop(.45, '#f3c969'); grad.addColorStop(1, '#a8701a');
      g.fillStyle = grad; g.beginPath(); g.arc(s / 2, s / 2, r, 0, Math.PI * 2); g.fill();
      g.shadowBlur = 0; g.strokeStyle = 'rgba(120, 76, 14, .8)'; g.lineWidth = 2;
      g.beginPath(); g.arc(s / 2, s / 2, r * .62, 0, Math.PI * 2); g.stroke();
    });
    S.shard = sprite(48, (g, s) => {
      g.shadowColor = 'rgba(190, 160, 255, 1)'; g.shadowBlur = 10;
      const grad = g.createLinearGradient(s / 2, 6, s / 2, s - 6);
      grad.addColorStop(0, '#f4eeff'); grad.addColorStop(.4, '#c4a7ff'); grad.addColorStop(1, '#6a46c9');
      g.fillStyle = grad; g.beginPath();
      g.moveTo(s / 2, 6); g.lineTo(s - 12, s * .4); g.lineTo(s / 2, s - 6); g.lineTo(12, s * .4); g.closePath(); g.fill();
      g.shadowBlur = 0; g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 1.2;
      g.beginPath(); g.moveTo(12, s * .4); g.lineTo(s - 12, s * .4); g.moveTo(s / 2, 6); g.lineTo(s / 2, s - 6); g.stroke();
    });
    const glow = (col) => sprite(32, (g, s) => {
      const grad = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
      grad.addColorStop(0, 'rgba(255,255,255,1)'); grad.addColorStop(.25, col); grad.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = grad; g.fillRect(0, 0, s, s);
    });
    S.glow = glow;
    S.sparkGold = glow('rgba(255, 214, 110, .85)');
    S.sparkViolet = glow('rgba(190, 160, 255, .85)');
  }
  const tinted = {};
  const sparkOf = rgb => tinted[rgb] || (tinted[rgb] = S.glow(`rgba(${rgb}, .85)`));

  // ---------- canvas ----------
  function mount(host) {
    makeSprites();
    if (!cv) { cv = document.createElement('canvas'); cv.className = 'bof-fx-canvas'; cv.setAttribute('aria-hidden', 'true'); ctx = cv.getContext('2d'); }
    if (layer !== host || cv.parentNode !== host) {
      parts.length = 0; // เปลี่ยนชั้น: อนุภาคเดิมไม่มีความหมายแล้ว
      host.appendChild(cv);
      layer = host;
    }
    const isBody = host === document.body;
    const r = isBody ? { left: 0, top: 0, width: innerWidth, height: innerHeight } : host.getBoundingClientRect();
    ox = r.left; oy = r.top;
    const st = isBody ? 0 : host.scrollTop, sl = isBody ? 0 : host.scrollLeft; // กล่องที่เลื่อนได้: วาง canvas ตรงส่วนที่มองเห็น
    dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = Math.round(r.width * dpr), h = Math.round(r.height * dpr);
    if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
    cv.style.cssText = `position:${isBody ? 'fixed' : 'absolute'};left:${sl}px;top:${st}px;width:${r.width}px;height:${r.height}px;pointer-events:none;z-index:10000`;
  }

  function start() {
    if (raf) return;
    last = performance.now();
    raf = requestAnimationFrame(tick);
  }

  function tick(now) {
    const dt = Math.min(.05, (now - last) / 1000);
    last = now;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cv.width, cv.height);
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      if (p.delay > 0) { p.delay -= dt; continue; }
      if (p.update(p, dt)) parts.splice(i, 1);
      else p.draw(p);
    }
    if (parts.length) raf = requestAnimationFrame(tick);
    else { raf = 0; ctx.clearRect(0, 0, cv.width, cv.height); }
  }

  // ---------- ชนิดอนุภาค ----------
  function spark(x, y, opt = {}) {
    const a = opt.angle ?? Math.random() * Math.PI * 2;
    const sp = (opt.speed ?? 160) * (.4 + Math.random() * .8);
    parts.push({
      x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0, max: opt.life ?? (.45 + Math.random() * .4),
      size: opt.size ?? (6 + Math.random() * 10), img: opt.rgb ? sparkOf(opt.rgb) : (opt.violet ? S.sparkViolet : S.sparkGold), delay: opt.delay || 0, grav: opt.grav ?? 220,
      update(p, dt) { p.life += dt; p.vx *= .92; p.vy = p.vy * .92 + p.grav * dt; p.x += p.vx * dt; p.y += p.vy * dt; return p.life >= p.max; },
      draw(p) {
        const k = 1 - p.life / p.max;
        ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = k;
        const s = p.size * (.5 + k * .5);
        ctx.drawImage(p.img, p.x - s / 2, p.y - s / 2, s, s);
        ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
      }
    });
  }

  function ring(x, y, opt = {}) {
    parts.push({
      x, y, life: 0, max: opt.life ?? .5, r0: opt.r0 ?? 6, r1: opt.r1 ?? 46, col: opt.color || '255, 227, 154', delay: opt.delay || 0,
      update(p, dt) { p.life += dt; return p.life >= p.max; },
      draw(p) {
        const t = p.life / p.max, e = 1 - Math.pow(1 - t, 3);
        ctx.strokeStyle = `rgba(${p.col}, ${1 - t})`; ctx.lineWidth = 3 * (1 - t) + .5;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r0 + (p.r1 - p.r0) * e, 0, Math.PI * 2); ctx.stroke();
      }
    });
  }

  // เหรียญ/คริสตัล: โค้ง bezier ออกจากจุดเริ่ม (ดีดออกก่อน) แล้วเร่งเข้าเป้า · ทิ้งประกายตามทาง
  function homing(x, y, tx, ty, kind, opt) {
    const a = Math.random() * Math.PI * 2, d = 60 + Math.random() * 70;
    parts.push({
      sx: x, sy: y, cx: x + Math.cos(a) * d, cy: y + Math.sin(a) * d - 40, tx, ty, x, y,
      t: 0, dur: .75 + Math.random() * .3, delay: opt.delay || 0, spin: Math.random() * 6, vs: 8 + Math.random() * 6,
      size: kind === 'coins' ? 22 : 20, img: kind === 'coins' ? S.coin : S.shard, kind, onArrive: opt.onArrive,
      update(p, dt) {
        p.t += dt / p.dur; p.spin += p.vs * dt;
        if (p.t >= 1) {
          for (let i = 0; i < 3; i++) spark(p.tx, p.ty, { violet: p.kind === 'shards', speed: 90, size: 8, grav: 0, life: .3 });
          if (p.onArrive) p.onArrive(p.kind);
          return true;
        }
        const t = p.t < .5 ? 2 * p.t * p.t * .9 + p.t * .1 : 1 - Math.pow(-2 * p.t + 2, 2.4) / 2; // ช้า-เร็ว
        const u = 1 - t;
        p.x = u * u * p.sx + 2 * u * t * p.cx + t * t * p.tx;
        p.y = u * u * p.sy + 2 * u * t * p.cy + t * t * p.ty;
        if (Math.random() < .3) spark(p.x, p.y, { violet: p.kind === 'shards', speed: 20, size: 7, grav: 30, life: .35 });
        return false;
      },
      draw(p) {
        const s = p.size * (1 - p.t * .35);
        ctx.save(); ctx.translate(p.x, p.y);
        if (p.kind === 'coins') ctx.scale(Math.max(.2, Math.abs(Math.cos(p.spin))), 1); // เหรียญหมุนพลิก
        else ctx.rotate(Math.sin(p.spin) * .5);
        ctx.drawImage(p.img, -s / 2, -s / 2, s, s);
        ctx.restore();
      }
    });
  }

  // ---------- API ----------
  const local = (host, x, y) => [x - ox, y - oy];

  window.BOFParticles = {
    burst(host, x, y, opt = {}) {
      if (reduced()) return;
      mount(host);
      [x, y] = local(host, x, y);
      const n = opt.count ?? 18, delay = opt.delay || 0, rad = opt.radius ?? 48, rings = opt.rings ?? 2;
      if (rings > 0) ring(x, y, { delay, r1: rad, color: opt.color });
      if (rings > 1) ring(x, y, { delay: delay + .08, r1: rad * .6, color: opt.color2 || '196, 167, 255' });
      for (let i = 0; i < n; i++) {
        const angle = opt.spread != null ? (opt.angle ?? -Math.PI / 2) + (Math.random() - .5) * opt.spread : (i / n) * Math.PI * 2 + Math.random() * .3;
        spark(x, y, {
          angle, speed: opt.speed ?? 220, delay: delay + (opt.stagger ? Math.random() * opt.stagger : 0),
          rgb: opt.color ? (opt.color2 && i % 3 === 0 ? opt.color2 : opt.color) : null, violet: !opt.color && i % 3 === 0,
          size: opt.size != null ? opt.size * (.6 + Math.random() * .8) : undefined,
          life: opt.life != null ? opt.life * (.7 + Math.random() * .6) : undefined, grav: opt.gravity
        });
      }
      start();
    },
    // targets: { coins: DOMRect, shards: DOMRect } · onArrive(kind) เรียกทุกครั้งที่ชิ้นถึงเป้า
    reward(host, from, targets, opt = {}) {
      if (reduced()) return;
      mount(host);
      const [x, y] = local(host, from.x, from.y);
      ['coins', 'shards'].forEach((kind, k) => {
        const r = targets[kind];
        if (!r) return;
        const [tx, ty] = local(host, r.left + r.width / 2, r.top + r.height / 2);
        const n = opt[kind] ?? (kind === 'coins' ? 10 : 7);
        for (let i = 0; i < n; i++) homing(x, y, tx, ty, kind, { delay: (opt.delay || 0) + k * .06 + i * .03, onArrive: opt.onArrive });
      });
      start();
    }
  };
})();
