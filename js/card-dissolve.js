/* ============================================================================
   BOF CARD DESTRUCTION v2: การ์ดถูกทำลาย = ฉากสั้นเฉพาะเด็ค (หน้าตาเท่านั้น)
   game.js เรียก BOFDissolve.play(cardEl, card, owner) ตอนการ์ดออกจากสนามไปสุสาน ก่อนวาดกระดานใหม่

   โครง:
   - ร่างโคลนของการ์ด (DOM) ลอยในพิกัดจอ ไม่หายตอน renderGame ล้างช่อง
   - canvas เต็มจอใบเดียว + rAF ตัวเดียวสำหรับทุกฉากที่เล่นพร้อมกัน · สไปรต์แสง/ควันวาดครั้งเดียวแล้วใช้ซ้ำ
   - "เศษการ์ด" ตัดจากภาพจริงของการ์ด (วาดลง canvas เล็กครั้งเดียว) แตกเป็นสามเหลี่ยมมีลายภาพ
   - ความแรง (lvl 0..1) ตามพลัง + ระดับความแรร์ → จำนวนอนุภาค ขนาดคลื่นกระแทก แรงสั่นจอ

   จิต        ชาร์จสายฟ้าคลานทั่วการ์ด → ระเบิดสายฟ้าฟาดออกรอบทิศ → สลายขอบไฟฟ้า (พลังสูง = สายรุ้ง)
   เหนือ      ง้างรับ → ดาบฟันเฉียงผ่า → การ์ดขาดสองท่อนไถลแยก ร่วงเป็นฝุ่น · ธงขาดปลิว
   วันสิ้นโลก  เวลาหยุด หน้าปัดหมุนย้อน → แตกเป็นเศษเวลาค้างกลางอากาศ → ถูกดูดเข้าหลุมดำ → แสงม่วงทองระเบิด
   ไดโน       ขากรรไกรงับ → กรงเล็บสามเส้นข่วนเรืองแดง → แตกเป็นหินอำพันตกกระดอน · รอยเท้ายักษ์ประทับพื้นร้าว
   ปีศาจ      วงเวทเจ็ดแฉกใต้การ์ด ตาแดงวาบ → ไฟนรกเผาจากล่างขึ้นบน ควันดำ ถ่านลอย → เสาเพลิงพุ่ง
   โอ๊ต       ยืดหดการ์ตูน → ระเบิดคอมิก + คำอุทาน → แตกเป็นชิ้นขอบดำหมุนปลิว ดาว จุดฮาล์ฟโทน

   reduced motion = จางหาย 0.2 วิ
   ============================================================================ */
(function () {
  const NS = 'http://www.w3.org/2000/svg';
  const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const small = () => (window.isMobileUI ? window.isMobileUI() : innerWidth < 768);
  const rnd = (a, b) => a + Math.random() * (b - a);
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const easeOut = k => 1 - Math.pow(1 - k, 3);
  const easeIn = k => k * k * k;
  const NUMERALS = ['XII', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];
  const LEADER_DECK = { L01: 'jit', L02: 'nuea', L03: 'doom', L04: 'dino', L05: 'demon', L06: 'oat' };
  const RARITY_LVL = { N: 0, R: .3, SR: .65, SSR: 1, Legend: 1 };

  // ---------- เด็ค / ความแรง ----------
  function deckOf(card, owner) {
    const id = String((card && (card.futureBaseId || card.id)) || '');
    if (/^DM[MS]/.test(id)) return 'demon';
    if (/^DN/.test(id)) return 'dino';
    if (/^D[MS]\d/.test(id)) return 'doom';
    if (/^N[MS]\d/.test(id)) return 'nuea';
    if (/^O[MS]\d/.test(id)) return 'oat';
    if (/^[MS]\d/.test(id)) return 'jit';
    return LEADER_DECK[owner && owner.leader && owner.leader.id] || 'jit';
  }
  // pw = พลังปัจจุบัน (รวมบัฟ) ถ้า game.js ส่งมา ไม่งั้นใช้พลังพื้นฐานของการ์ด
  function levelOf(card, pw) {
    if (!card) return .3;
    if (pw == null) pw = Number(card.power) || 0;
    const rar = card.rarity || (typeof CARD_DATABASE !== 'undefined' && (CARD_DATABASE.find(c => c.id === card.id) || {}).rarity) || 'N';
    return clamp(Math.max((pw - 1) / 4, RARITY_LVL[rar] || 0));
  }

  // ============================================================================
  // canvas เต็มจอ + rAF เดียว
  // ============================================================================
  const E = { cv: null, g: null, dpr: 1, parts: [], draws: [], raf: 0, last: 0 };
  function ensureCanvas() {
    if (E.cv && E.cv.isConnected) return;
    E.cv = document.createElement('canvas');
    E.cv.className = 'fx-dslv-canvas';
    E.cv.setAttribute('aria-hidden', 'true');
    E.g = E.cv.getContext('2d');
    document.body.appendChild(E.cv);
    resize();
  }
  function resize() {
    if (!E.cv) return;
    E.dpr = Math.min(small() ? 1.5 : 2, devicePixelRatio || 1);
    E.cv.width = innerWidth * E.dpr; E.cv.height = innerHeight * E.dpr;
  }
  addEventListener('resize', resize);
  function kick() { ensureCanvas(); if (!E.raf) { E.last = 0; E.raf = requestAnimationFrame(loop); } }
  function addPart(p) { p.age = 0; E.parts.push(p); }
  // drawable: { life (วิ), delay, draw(g, k 0..1, age), end }
  function addDraw(d) { d.age = -(d.delay || 0); E.draws.push(d); kick(); return d; }

  function loop(now) {
    const dt = E.last ? Math.min(.05, (now - E.last) / 1000) : .016;
    E.last = now;
    const g = E.g;
    g.setTransform(E.dpr, 0, 0, E.dpr, 0, 0);
    g.clearRect(0, 0, innerWidth, innerHeight);
    for (let i = E.draws.length - 1; i >= 0; i--) {
      const d = E.draws[i]; d.age += dt;
      if (d.age < 0) continue;
      const k = d.age / d.life;
      if (k >= 1) { E.draws.splice(i, 1); if (d.end) d.end(); continue; }
      g.save(); d.draw(g, k, d.age, dt); g.restore();
    }
    for (let i = E.parts.length - 1; i >= 0; i--) {
      const p = E.parts[i]; p.age += dt;
      const k = p.age / p.life;
      if (k >= 1) { E.parts.splice(i, 1); continue; }
      if (p.drag) { const f = Math.max(0, 1 - p.drag * dt); p.vx *= f; p.vy *= f; }
      p.vy += (p.g || 0) * dt;
      if (p.pull) { p.vx += (p.pull.x - p.x) * p.pull.k * dt; p.vy += (p.pull.y - p.y) * p.pull.k * dt; }
      p.x += p.vx * dt + (p.wob ? Math.sin(p.age * 8 + p.wob) * 18 * dt : 0);
      p.y += p.vy * dt;
      if (p.floor !== undefined && p.y > p.floor) { p.y = p.floor; p.vy *= -(p.bounce || .3); p.vx *= .7; p.vr = (p.vr || 0) * .6; }
      if (p.vr) p.rot += p.vr * dt;
      drawPart(g, p, k);
    }
    if (E.parts.length || E.draws.length) E.raf = requestAnimationFrame(loop);
    else { E.raf = 0; g.clearRect(0, 0, innerWidth, innerHeight); }
  }

  // ---------- สไปรต์ (วาดครั้งเดียว) ----------
  const SPR = {};
  function sprite(key, size, paint) {
    if (SPR[key]) return SPR[key];
    const c = document.createElement('canvas'); c.width = c.height = size;
    paint(c.getContext('2d'), size); SPR[key] = c; return c;
  }
  const glowSpr = rgb => sprite('g' + rgb, 64, (g, s) => {
    const r = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(.22, `rgba(${rgb},.95)`); r.addColorStop(.55, `rgba(${rgb},.28)`); r.addColorStop(1, `rgba(${rgb},0)`);
    g.fillStyle = r; g.fillRect(0, 0, s, s);
  });
  const smokeSpr = rgb => sprite('s' + rgb, 64, (g, s) => {
    const r = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    r.addColorStop(0, `rgba(${rgb},.7)`); r.addColorStop(.5, `rgba(${rgb},.32)`); r.addColorStop(1, `rgba(${rgb},0)`);
    g.fillStyle = r; g.fillRect(0, 0, s, s);
  });
  // สีรุ้งเป็น "r, g, b" สำหรับสไปรต์ (ปัด hue เป็นช่วง 30° ให้แคชสไปรต์ไม่บาน)
  const hsl = h => {
    const hh = (((Math.round(h / 30) * 30) % 360) + 360) % 360, x = 1 - Math.abs(((hh / 60) % 2) - 1);
    const [r, g, b] = hh < 60 ? [1, x, 0] : hh < 120 ? [x, 1, 0] : hh < 180 ? [0, 1, x] : hh < 240 ? [0, x, 1] : hh < 300 ? [x, 0, 1] : [1, 0, x];
    return `${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}`;
  };

  function starPath(g, r, n, inner = .42) {
    g.beginPath();
    for (let i = 0; i < n * 2; i++) { const a = (i * Math.PI) / n - Math.PI / 2, rr = i % 2 ? r * inner : r; g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
    g.closePath();
  }

  function drawPart(g, p, k) {
    const fade = p.fadeIn ? Math.min(1, k / p.fadeIn) * (1 - Math.max(0, (k - .5) / .5)) : 1 - easeIn(k);
    const a = clamp(fade * (p.alpha == null ? 1 : p.alpha));
    if (a <= .01) return;
    const size = p.size * (1 + (p.grow || 0) * k) * (p.shrink ? 1 - k * p.shrink : 1);
    g.save();
    switch (p.kind) {
      case 'glow': {
        g.globalCompositeOperation = 'lighter'; g.globalAlpha = a;
        const s = size * 2; g.drawImage(glowSpr(p.hue != null ? hsl(p.hue + k * 160) : p.rgb), p.x - s, p.y - s, s * 2, s * 2);
        break;
      }
      case 'streak': {
        g.globalCompositeOperation = 'lighter'; g.globalAlpha = a; g.lineCap = 'round';
        g.strokeStyle = p.hue != null ? `hsl(${p.hue + k * 200},100%,70%)` : `rgb(${p.rgb})`; g.lineWidth = size;
        const L = p.len || .035; g.beginPath(); g.moveTo(p.x, p.y); g.lineTo(p.x - p.vx * L, p.y - p.vy * L); g.stroke();
        break;
      }
      case 'smoke': {
        g.globalAlpha = a;
        const s = size * 2; g.drawImage(smokeSpr(p.rgb), p.x - s, p.y - s, s * 2, s * 2);
        break;
      }
      case 'shard': {
        g.globalAlpha = a;
        g.translate(p.x, p.y); g.rotate(p.rot || 0);
        const sc = (p.sc || 1) * (p.shrink ? 1 - k * p.shrink : 1); g.scale(sc, sc);
        g.beginPath(); p.poly.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath();
        g.save(); g.clip();
        if (p.tex) g.drawImage(p.tex, -p.cx, -p.cy);
        if (p.tint) { g.fillStyle = p.tint; g.fillRect(-p.cx, -p.cy, p.tex ? p.tex.width : 200, p.tex ? p.tex.height : 200); }
        g.restore();
        if (p.edge) { g.lineWidth = p.edgeW || 1.4; g.strokeStyle = p.edge; g.lineJoin = 'round'; g.stroke(); }
        break;
      }
      case 'chip': {
        g.globalAlpha = a; g.translate(p.x, p.y); g.rotate(p.rot || 0);
        g.beginPath(); g.moveTo(-size, -size * .5); g.lineTo(size * .3, -size); g.lineTo(size, size * .4); g.lineTo(-size * .2, size); g.closePath();
        g.fillStyle = p.fill; g.fill(); if (p.edge) { g.strokeStyle = p.edge; g.lineWidth = 1; g.stroke(); }
        break;
      }
      case 'shred': { // ผ้าธงขาด: สี่เหลี่ยมพลิ้ว
        g.globalAlpha = a; g.translate(p.x, p.y); g.rotate(p.rot || 0); g.scale(1, Math.sin(p.age * 14 + (p.wob || 0)) || .05);
        g.fillStyle = p.fill; g.fillRect(-size, -size * .45, size * 2, size * .9);
        break;
      }
      case 'star': {
        g.globalAlpha = a; g.translate(p.x, p.y); g.rotate(p.rot || 0); starPath(g, size, p.points || 5, p.inner || .45);
        g.fillStyle = p.fill; g.fill(); g.lineWidth = p.edgeW || 2; g.strokeStyle = p.edge || '#1a0010'; g.lineJoin = 'round'; g.stroke();
        break;
      }
      case 'dot': {
        g.globalAlpha = a; g.fillStyle = p.fill; g.beginPath(); g.arc(p.x, p.y, Math.max(.1, size), 0, 7); g.fill();
        break;
      }
    }
    g.restore();
  }

  // ---------- ของที่วาดบน canvas ใช้ร่วมหลายเด็ค ----------
  function shockwave(cx, cy, r0, r1, rgb, life, width = 6, delay = 0) {
    addDraw({ life, delay, draw(g, k) {
      const r = Math.max(.1, r0 + (r1 - r0) * easeOut(k));
      g.globalCompositeOperation = 'lighter'; g.globalAlpha = (1 - k) * .9;
      g.strokeStyle = `rgb(${rgb})`; g.lineWidth = width * (1 - k * .7);
      g.shadowColor = `rgb(${rgb})`; g.shadowBlur = 18;
      g.beginPath(); g.arc(cx, cy, r, 0, 7); g.stroke();
    } });
  }
  function flash(cx, cy, r, rgb, life, delay = 0) {
    addDraw({ life, delay, draw(g, k) {
      g.globalCompositeOperation = 'lighter'; g.globalAlpha = (1 - k) * (k < .15 ? k / .15 : 1);
      const s = r * (1 + k * .6); g.drawImage(glowSpr(rgb), cx - s, cy - s, s * 2, s * 2);
    } });
  }
  function jagged(x1, y1, x2, y2, segs, amp) {
    const pts = [[x1, y1]], dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
    for (let i = 1; i < segs; i++) { const t = i / segs, o = rnd(-amp, amp); pts.push([x1 + dx * t + nx * o, y1 + dy * t + ny * o]); }
    pts.push([x2, y2]); return pts;
  }
  function strokeBolt(g, pts, color, w, glowCol) {
    g.lineJoin = 'round'; g.lineCap = 'round';
    g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
    const a = g.globalAlpha;
    g.shadowColor = glowCol || color; g.shadowBlur = 14; g.strokeStyle = glowCol || color; g.lineWidth = w * 2.6; g.globalAlpha = a * .55; g.stroke();
    g.globalAlpha = a; g.shadowBlur = 0; g.strokeStyle = color; g.lineWidth = w; g.stroke();
  }

  // ---------- ไดโน: ร่องกรงเล็บ (canvas) ----------
  // ร่อง = แถบตามเส้นโค้ง quadratic p0→p1 ผ่าน cp · เรียวสองปลาย (ปลายท้ายแหลมกว่า) · ขอบซ้าย/ขวาขรุขระคนละจังหวะ
  function gougeShape(p0, cp, p1, maxW, n = 24) {
    const L = [], R = [], C = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n, u = 1 - t;
      const x = u * u * p0[0] + 2 * u * t * cp[0] + t * t * p1[0], y = u * u * p0[1] + 2 * u * t * cp[1] + t * t * p1[1];
      const dx = 2 * u * (cp[0] - p0[0]) + 2 * t * (p1[0] - cp[0]), dy = 2 * u * (cp[1] - p0[1]) + 2 * t * (p1[1] - cp[1]);
      const l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l;
      const w = maxW * Math.pow(Math.sin(Math.PI * Math.min(1, t * 1.06)), .6);
      const wl = w * (1 + rnd(-.28, .22)), wr = w * (1 + rnd(-.28, .22));
      C.push([x, y]); L.push([x + nx * wl, y + ny * wl]); R.push([x - nx * wr, y - ny * wr]);
    }
    return { L, R, C, n };
  }
  // เติมร่องถึงตำแหน่ง upto (0..1) · scale = ความกว้างเทียบขอบจริง (แกนมืด/เส้นร้อนแคบกว่า)
  function fillGouge(g, s, upto, scale) {
    const m = Math.max(1, Math.min(s.n, Math.round(upto * s.n)));
    g.beginPath();
    for (let i = 0; i <= m; i++) { const [cx, cy] = s.C[i], [lx, ly] = s.L[i]; g.lineTo(cx + (lx - cx) * scale, cy + (ly - cy) * scale); }
    for (let i = m; i >= 0; i--) { const [cx, cy] = s.C[i], [rx, ry] = s.R[i]; g.lineTo(cx + (rx - cx) * scale, cy + (ry - cy) * scale); }
    g.closePath(); g.fill();
    return s.C[m];
  }
  // สีตามความร้อน h (1 = ร้อนขาว → .5 ส้ม → 0 แดงคล้ำ)
  function heatCol(h, a = 1) {
    const stops = [[0, [110, 18, 6]], [.45, [255, 96, 20]], [.75, [255, 180, 70]], [1, [255, 246, 214]]];
    let i = 1; while (i < stops.length - 1 && h > stops[i][0]) i++;
    const [t0, c0] = stops[i - 1], [t1, c1] = stops[i], k = clamp((h - t0) / (t1 - t0));
    return `rgba(${c0.map((v, j) => Math.round(v + (c1[j] - v) * k)).join(',')},${a})`;
  }
  // กรงเล็บ 3 เส้นฟาดเฉียงผ่านการ์ด: เงาฟาดสีขาว → ร่องร้อนขาวค่อยเย็นเป็นส้มแดง · ประกายนำหน้าปลายเล็บ · เศษกระเด็นตามทิศฟาด
  function clawSwipe(c, dir, life) {
    const ox = c.rect.left, oy = c.rect.top, W = c.W, H = c.H;
    const marks = [0, 1, 2].map(i => {
      // สามเส้นขนานทแยงผ่านกลางการ์ด: เริ่มเหนือขอบบน จบใต้ขอบล่าง เลื่อนข้างไปตามทิศฟาด · โค้งเล็กน้อยแบบอุ้งเล็บ
      const x0 = dir > 0 ? W * (-.08 + i * .3) : W * (1.08 - i * .3), y0 = -H * .12 + i * H * .04;
      const x1 = x0 + dir * W * .5, y1 = H * 1.12 - i * H * .04;
      const cp = [(x0 + x1) / 2 - dir * W * .12, (y0 + y1) / 2 + H * .02];
      const maxW = W * (i === 1 ? .1 : .085) * (1 + c.lvl * .35);
      const P = (x, y) => [ox + x, oy + y];
      // เงาฟาด = เส้นเดียวกันแต่ยาวเลยการ์ดออกไปสองฝั่ง
      const ext = .22, dx = x1 - x0, dy = y1 - y0;
      return {
        delay: i * .045,
        shape: gougeShape(P(x0, y0), P(cp[0], cp[1]), P(x1, y1), maxW),
        trail: gougeShape(P(x0 - dx * ext, y0 - dy * ext), P(cp[0], cp[1]), P(x1 + dx * ext, y1 + dy * ext), maxW * 1.5, 16),
      };
    });
    const REVEAL = .11;
    addDraw({ life, draw(g, k, age) {
      const fadeAll = 1 - clamp((k - .82) / .18);
      marks.forEach(m => {
        const t = age - m.delay;
        if (t <= 0) return;
        const r = clamp(t / REVEAL), heat = clamp(1 - (t - .06) / .42);
        // 1) เงาฟาดสีขาวเบลอ (เห็นแค่ช่วงแรกสั้นๆ)
        const ta = clamp(1 - t / .16);
        if (ta > 0) {
          g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = ta * .55;
          g.shadowColor = 'rgba(255, 220, 170, 1)'; g.shadowBlur = 18; g.fillStyle = 'rgba(255, 245, 225, .9)';
          fillGouge(g, m.trail, Math.min(1, r * 1.15), .5); g.restore();
        }
        g.save(); g.globalAlpha = fadeAll;
        // 2) ขอบหลอมเรือง
        g.shadowColor = heatCol(Math.max(.45, heat)); g.shadowBlur = 6 + heat * 16; g.fillStyle = heatCol(heat);
        const tip = fillGouge(g, m.shape, r, 1);
        // 3) แกนร่องลึกมืด
        g.shadowBlur = 0; g.fillStyle = 'rgba(18, 4, 0, .95)'; fillGouge(g, m.shape, r, .58);
        // 4) เส้นร้อนกลางร่อง (เย็นเร็วกว่า)
        g.globalCompositeOperation = 'lighter'; g.fillStyle = heatCol(clamp(heat * 1.2), .9 * heat); fillGouge(g, m.shape, r, .16);
        g.restore();
        // ประกายนำหน้าปลายเล็บระหว่างฟาด + เศษกระเด็นตามทิศ
        if (r < 1) {
          g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = 1;
          const s = 16; g.drawImage(glowSpr('255, 190, 90'), tip[0] - s, tip[1] - s, s * 2, s * 2); g.restore();
          if (Math.random() < .8) addPart({ kind: 'streak', x: tip[0], y: tip[1], vx: dir * rnd(80, 260), vy: rnd(-60, 160), g: 600, drag: 1.4, life: rnd(.2, .4), size: rnd(1.2, 2.2), rgb: '255, 170, 80' });
          if (Math.random() < .35) addPart({ kind: 'chip', x: tip[0], y: tip[1], vx: dir * rnd(60, 200), vy: rnd(-160, -40), g: 900, life: rnd(.4, .7), size: rnd(1.5, 3), fill: 'rgb(120, 70, 25)', edge: 'rgba(255, 170, 80, .8)', rot: rnd(0, 6), vr: rnd(-14, 14) });
        }
      });
    } });
  }

  // ---------- ไดโน: รอยเท้าทีเร็กซ์ยักษ์ (canvas) ----------
  // หน่วยรูปเท้า: ส้นอยู่ล่าง (y+) นิ้วชี้ขึ้น (y-) · ยาวราว 95 หน่วย จากส้น y≈36 ถึงปลายเล็บ y≈-58
  let FOOT = null;
  function footPath() {
    if (FOOT) return FOOT;
    // นิ้วยาวเรียวปลายแหลม (นิ้วกลางยาวสุด) + เล็บงุ้ม + ส้นเล็กกลม แบบรอยเท้าเทอโรพอด
    const toe = new Path2D('M-6.5 10 C -9 -10, -5.5 -36, 0 -48 C 5.5 -36, 9 -10, 6.5 10 Z');
    const claw = new Path2D('M-3.6 -45 C -2.6 -54, .4 -60, 5 -65 C 3.2 -58, 3.4 -51, 3.8 -45 Z');
    const heel = new Path2D('M-14 16 C -16 3, -7 -3, 0 -3 C 7 -3, 16 3, 14 16 C 11 30, -11 30, -14 16 Z');
    const p = new Path2D();
    p.addPath(heel);
    [[-30, .82, -4, 6], [0, 1, 0, 0], [30, .82, 4, 6]].forEach(([deg, s, dx, dy]) => {
      const m = new DOMMatrix().translate(dx, 8 + dy).rotate(deg).scale(s).translate(0, -8);
      p.addPath(toe, m); p.addPath(claw, m);
    });
    return (FOOT = p);
  }
  // รอยร้าวแตกกิ่งจากขอบรอยเท้าออกไป (หน่วยเดียวกับรูปเท้า)
  function footCracks() {
    const out = [];
    const walk = (x, y, a, steps, len) => {
      const pts = [[x, y]];
      for (let s = 0; s < steps; s++) {
        a += rnd(-.45, .45); x += Math.cos(a) * len * rnd(.7, 1.2); y += Math.sin(a) * len * rnd(.7, 1.2);
        pts.push([x, y]);
        if (s === 1 && Math.random() < .55) out.push(walk(x, y, a + rnd(.5, .9) * (Math.random() < .5 ? 1 : -1), steps - 2, len * .8));
      }
      return pts;
    };
    for (let i = 0; i < 10; i++) {
      const a = i / 10 * Math.PI * 2 + rnd(-.2, .2), r0 = Math.abs(Math.sin(a)) > .6 ? 38 : 24;
      out.push(walk(Math.cos(a) * r0, Math.sin(a) * r0 * 1.2, a, 5, rnd(7, 10)));
    }
    return out;
  }
  // เท้าตกลงจากบน (ใหญ่ → ขนาดจริง) กระแทกพื้น: รอยยุบมืด ขอบหลอมอำพันค่อยเย็น รอยร้าววิ่งออก เศษหินรอบรอย
  function stomp(cx, cy, len, rot, lvl, n) {
    const foot = footPath(), cracks = footCracks(), s = len / 95;
    const DROP = .1, LIFE = 2;
    const specks = [...Array(16)].map(() => { const a = rnd(0, Math.PI * 2), r = rnd(34, 60); return [Math.cos(a) * r, Math.sin(a) * r * 1.15, rnd(.8, 2.2)]; });
    later(DROP * 1000, () => {
      buzz(45); shake(true);
      for (let i = 0; i < 14 * n; i++) {
        const a = rnd(0, Math.PI * 2), r = len * rnd(.25, .45);
        addPart({ kind: 'smoke', x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r * .8, vx: Math.cos(a) * rnd(60, 140), vy: Math.sin(a) * rnd(40, 100) - 20, drag: 2.2, life: rnd(.7, 1.2), size: rnd(8, 15), grow: 1.6, rgb: '150, 105, 55', alpha: .75 });
      }
      for (let i = 0; i < 18 * n; i++) {
        const a = rnd(0, Math.PI * 2);
        addPart({ kind: 'chip', x: cx + Math.cos(a) * len * .3, y: cy + Math.sin(a) * len * .3, vx: Math.cos(a) * rnd(80, 240), vy: rnd(-300, -120), g: 1100, life: rnd(.5, .9), size: rnd(1.6, 3.6), fill: 'rgb(92, 56, 22)', edge: 'rgba(255, 170, 80, .7)', rot: rnd(0, 6), vr: rnd(-12, 12) });
      }
      shockwave(cx, cy, len * .2, len * (.9 + lvl * .4), '255, 160, 60', .45, 4);
    });
    addDraw({ life: LIFE, draw(g, k, age) {
      const drop = clamp(age / DROP), t = age - DROP;
      const sc = s * (1 + (1 - easeIn(drop)) * .5);
      const alpha = (age < DROP ? drop : 1) * (1 - clamp((age - 1.3) / (LIFE - 1.3)));
      const heat = clamp(1 - t / 1.1);
      g.translate(cx, cy); g.rotate(rot); g.scale(sc, sc);
      g.globalAlpha = alpha;
      // เงาใต้เท้าก่อนกระแทก (เท้ายังลอยอยู่)
      if (age < DROP) { g.fillStyle = 'rgba(0,0,0,.35)'; g.save(); g.translate(4, 6); g.fill(foot); g.restore(); }
      // รอยร้าว (หลังกระแทก): วิ่งออกจากขอบ เรืองอำพันแล้วเย็นเป็นร่องมืด
      if (t > 0) {
        const grow = easeOut(clamp(t / .28));
        g.lineCap = 'round'; g.lineJoin = 'round';
        cracks.forEach(pts => {
          const m = Math.max(1, Math.round((pts.length - 1) * grow));
          g.beginPath(); for (let i = 0; i <= m; i++) g.lineTo(pts[i][0], pts[i][1]);
          g.strokeStyle = 'rgba(20, 8, 2, .85)'; g.lineWidth = 2.6; g.shadowBlur = 0; g.stroke();
          if (heat > 0) { g.strokeStyle = heatCol(heat * .8, heat); g.lineWidth = 1.1; g.shadowColor = 'rgba(255, 120, 30, .9)'; g.shadowBlur = 8 * heat; g.stroke(); }
        });
        g.shadowBlur = 0;
        specks.forEach(([x, y, r]) => { g.fillStyle = 'rgba(70, 40, 14, .9)'; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); });
      }
      // ตัวรอยเท้า: ลากเส้นหนาก่อนแล้วเทสีเข้มทับ → เหลือแค่ขอบนอก (เส้นซ้อนด้านในที่นิ้วทับส้นถูกเทสีทับหมด)
      // ขอบ = สันดินนูนที่หลอมเรืองตอนกระแทกแล้วค่อยเย็นเป็นสีดินอำพัน · ตัวรอย = ยุบลึก เข้มตรงกลาง
      g.lineJoin = 'round';
      g.strokeStyle = t > 0 ? heatCol(Math.max(.3, heat), .9) : 'rgba(120, 80, 40, .6)';
      g.lineWidth = 5; g.shadowColor = 'rgba(255, 110, 20, 1)'; g.shadowBlur = t > 0 ? 3 + heat * 18 : 0; g.stroke(foot);
      g.shadowBlur = 0; g.strokeStyle = 'rgba(70, 40, 14, .9)'; g.lineWidth = 2.2; g.stroke(foot);
      const gr = g.createRadialGradient(0, -4, 3, 0, -8, 60);
      gr.addColorStop(0, 'rgba(6, 2, 0, 1)'); gr.addColorStop(.6, 'rgba(24, 11, 3, 1)'); gr.addColorStop(1, 'rgba(48, 24, 7, 1)');
      g.fillStyle = gr; g.fill(foot);
    } });
  }

  // ---------- เศษการ์ด (สามเหลี่ยมมีลายภาพ) ----------
  function cardTexture(el, w, h) {
    const img = el.querySelector('.card-art img') || el.querySelector('img');
    const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h));
    const g = c.getContext('2d');
    g.fillStyle = '#141938'; g.fillRect(0, 0, w, h);
    try {
      if (img && img.complete && img.naturalWidth) {
        const s = Math.max(w / img.naturalWidth, h / img.naturalHeight), iw = img.naturalWidth * s, ih = img.naturalHeight * s;
        g.drawImage(img, (w - iw) / 2, (h - ih) / 2, iw, ih);
      }
    } catch (e) { /* ภาพยังไม่พร้อม: ใช้พื้นเรียบ */ }
    g.strokeStyle = 'rgba(243, 201, 105, .9)'; g.lineWidth = 3; g.strokeRect(1.5, 1.5, w - 3, h - 3);
    return c;
  }
  // แบ่งการ์ด w×h เป็นตาราง cols×rows จุดยอดเขย่า แล้วตัดเป็นสามเหลี่ยม (คืนจุดศูนย์กลาง + รูปหลายเหลี่ยมเทียบศูนย์กลาง)
  function shardsOf(w, h, cols, rows) {
    const P = [];
    for (let j = 0; j <= rows; j++) for (let i = 0; i <= cols; i++) {
      const edge = i === 0 || j === 0 || i === cols || j === rows;
      P.push([w * i / cols + (edge ? 0 : rnd(-.3, .3) * w / cols), h * j / rows + (edge ? 0 : rnd(-.3, .3) * h / rows)]);
    }
    const at = (i, j) => P[j * (cols + 1) + i], out = [];
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
      const a = at(i, j), b = at(i + 1, j), c = at(i + 1, j + 1), d = at(i, j + 1);
      const tris = Math.random() < .5 ? [[a, b, c], [a, c, d]] : [[a, b, d], [b, c, d]];
      tris.forEach(t => {
        const cx = (t[0][0] + t[1][0] + t[2][0]) / 3, cy = (t[0][1] + t[1][1] + t[2][1]) / 3;
        out.push({ cx, cy, poly: t.map(([x, y]) => [x - cx, y - cy]) });
      });
    }
    return out;
  }

  // ============================================================================
  // ร่างโคลน + SVG filter สลาย
  // ============================================================================
  const DROP = ['fx-target-hit', 'fx-attack-ai', 'fx-attack-player', 'holo-live', 'c3d-press', 'aim-doomed', 'selected-attacker', 'fx-holo-draw'];
  function makeGhost(el, rect, key) {
    const host = document.createElement('div');
    host.className = 'fx-dslv is-' + key;
    host.style.cssText = `left:${rect.left}px;top:${rect.top}px;width:${rect.width}px;height:${rect.height}px`;
    // ห่อด้วยคลาสเดียวกับช่องบนสนาม: สไตล์การ์ดบนสนามยังทำงาน (ชั้นโฮโลซ่อน ขนาดตัวอักษรเท่าเดิม)
    host.innerHTML = '<div class="board-slots fx-dslv-wrap"><div class="slot fx-dslv-slot"></div></div>';
    const ghost = el.cloneNode(true);
    ghost.removeAttribute('id');
    ghost.querySelectorAll('[id]').forEach(n => n.removeAttribute('id'));
    ghost.querySelectorAll('.fx-flip-back, .aim-chip').forEach(n => n.remove());
    DROP.forEach(c => ghost.classList.remove(c));
    ['--rx', '--ry', '--px', '--py', '--hyp'].forEach(p => ghost.style.removeProperty(p));
    ghost.style.opacity = ''; ghost.style.visibility = ''; ghost.style.animation = 'none';
    // ขนาดจริงก่อนหมุน (การ์ด Rest หมุน 90°) · CSS วางกึ่งกลางกล่อง
    ghost.style.width = el.offsetWidth + 'px'; ghost.style.height = el.offsetHeight + 'px';
    host.querySelector('.fx-dslv-slot').appendChild(ghost);
    document.body.appendChild(host);
    return { host, ghost };
  }

  let defs = null, seq = 0;
  function defsEl() {
    if (defs && defs.isConnected) return defs;
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('aria-hidden', 'true');
    svg.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
    defs = document.createElementNS(NS, 'defs'); svg.appendChild(defs); document.body.appendChild(svg);
    return defs;
  }
  const GRAD = dir => 'data:image/svg+xml;utf8,' + encodeURIComponent(
    `<svg xmlns="${NS}" viewBox="0 0 10 10" preserveAspectRatio="none"><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">` +
    `<stop offset="0" stop-color="${dir === 'up' ? '#fff' : '#000'}"/><stop offset="1" stop-color="${dir === 'up' ? '#000' : '#fff'}"/></linearGradient>` +
    `<rect width="10" height="10" fill="url(#g)"/></svg>`);
  // n ต่อพิกเซล = noise (+ไล่ระดับ) · n < t หาย · t ≤ n < t+rim = ขอบไฟสี edge (+เรือง) · ถัดเข้าไป = ขอบไหม้เกรียม (char)
  function makeFilter(o, w, h) {
    const id = 'fx-dslv-' + (++seq);
    const f = document.createElementNS(NS, 'filter');
    f.id = id; f.setAttribute('x', '-15%'); f.setAttribute('y', '-15%'); f.setAttribute('width', '130%'); f.setAttribute('height', '130%');
    f.setAttribute('color-interpolation-filters', 'sRGB');
    const freq = (o.freq * 96 / Math.max(40, w)).toFixed(4);
    const mix = o.bias
      ? `<feImage href="${GRAD(o.bias)}" x="0" y="0" width="${w}" height="${h}" preserveAspectRatio="none" result="grad"/>
         <feComposite in="gray" in2="grad" operator="arithmetic" k2=".45" k3=".6" k4="-.03" result="field"/>`
      : '<feComposite in="gray" in2="gray" operator="arithmetic" k2="1" result="field"/>';
    f.innerHTML = `
      <feTurbulence type="${o.turb || 'fractalNoise'}" baseFrequency="${freq}" numOctaves="3" seed="${Math.floor(rnd(1, 999))}" result="noise"/>
      <feColorMatrix in="noise" type="matrix" values="1.7 0 0 0 -.35  1.7 0 0 0 -.35  1.7 0 0 0 -.35  0 0 0 0 1" result="gray"/>
      ${mix}
      <feColorMatrix in="field" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  1 0 0 0 0" result="nA"/>
      <feComponentTransfer in="nA" result="keep"><feFuncA type="linear" slope="20" intercept="0"/></feComponentTransfer>
      <feComponentTransfer in="nA" result="core"><feFuncA type="linear" slope="20" intercept="0"/></feComponentTransfer>
      <feComponentTransfer in="nA" result="inner"><feFuncA type="linear" slope="20" intercept="0"/></feComponentTransfer>
      <feComposite in="keep" in2="core" operator="out" result="rim0"/>
      <feComposite in="rim0" in2="SourceAlpha" operator="in" result="rim"/>
      <feComposite in="core" in2="inner" operator="out" result="char0"/>
      <feComposite in="char0" in2="SourceAlpha" operator="in" result="char"/>
      <feFlood class="dslv-col" flood-color="${o.edge}"/>
      <feComposite in2="rim" operator="in" result="hot"/>
      <feGaussianBlur in="hot" stdDeviation="${o.bloom || 2.6}" result="bloom"/>
      <feFlood flood-color="${o.char || '#120608'}" flood-opacity=".85"/>
      <feComposite in2="char" operator="in" result="burnt"/>
      <feComposite in="SourceGraphic" in2="core" operator="in" result="body"/>
      <feMerge><feMergeNode in="bloom"/><feMergeNode in="body"/><feMergeNode in="burnt"/><feMergeNode in="hot"/><feMergeNode in="hot"/></feMerge>`;
    defsEl().appendChild(f);
    const [keepA, coreA, innerA] = f.querySelectorAll('feFuncA');
    const col = f.querySelector('.dslv-col');
    return {
      id, el: f,
      set(t, rim, charW = .05) {
        keepA.setAttribute('intercept', (-20 * t).toFixed(3));
        coreA.setAttribute('intercept', (-20 * (t + rim)).toFixed(3));
        innerA.setAttribute('intercept', (-20 * (t + rim + charW)).toFixed(3));
      },
      color(c) { col.setAttribute('flood-color', c); },
    };
  }
  // WAAPI (fill forwards) ทับ inline style: เขียนท่าสุดท้ายลง style แล้วยกเลิกก่อน แล้วต่อ filter สลายท้ายสุด
  function settle(anim) { if (!anim) return; try { anim.commitStyles(); } catch (e) { /* โคลนหลุดจากหน้าแล้ว */ } anim.cancel(); }
  function applyFilter(ghost, flt, anim) {
    settle(anim);
    const host = ghost.closest('.fx-dslv');
    if (host) (host._flt || (host._flt = [])).push(flt.el); // ให้ done() ลบทิ้งได้แม้ rAF หยุดก่อนสลายจบ
    const keep = ghost.style.filter;
    ghost.style.filter = `${keep && keep !== 'none' ? keep + ' ' : ''}url(#${flt.id})`;
  }
  // เดินค่าเกณฑ์ t จาก 0 → 1 ใน dur วิ (ใช้นาฬิกาเดียวกับ canvas) · จบแล้วลบ filter
  function runDissolve(flt, dur, opts = {}) {
    return addDraw({ life: dur, delay: opts.delay || 0, draw(g, k, age) {
      flt.set(-.05 + Math.pow(k, opts.pow || 1.6) * 1.12, opts.rim || .07, opts.char == null ? .05 : opts.char);
      if (opts.each) opts.each(k, age);
    }, end() { flt.el.remove(); if (opts.end) opts.end(); } });
  }

  function shake(heavy) {
    const arena = document.getElementById('bof-game-arena');
    if (!arena) return;
    arena.classList.remove('fx-shake', 'is-heavy'); void arena.offsetWidth;
    arena.classList.add('fx-shake'); arena.classList.toggle('is-heavy', !!heavy);
    setTimeout(() => arena.classList.remove('fx-shake', 'is-heavy'), 260);
  }
  const buzz = ms => { if (window.BOFHaptic) window.BOFHaptic(ms); };
  const later = (ms, fn) => setTimeout(fn, ms);
  function accent(host, cls, html) {
    const d = document.createElement('div');
    d.className = 'fx-dslv-acc ' + cls; d.innerHTML = html; host.appendChild(d); return d;
  }

  // ============================================================================
  // ฉากประจำเด็ค · c = { el, rect, cx, cy, W, H, host, ghost, lvl, n (ตัวคูณจำนวนอนุภาค), done }
  // ============================================================================
  const SCENES = {
    // ---------------- จิต: สายฟ้า (พลังสูง = สายรุ้ง) ----------------
    jit(c) {
      // ระดับพลัง: ต่ำ = สายฟ้าเขียว · กลาง = เขียวปนฟ้าไฟฟ้า · สูง (พลัง 4+ หรือ SR ขึ้นไป) = สายรุ้งวนสี
      const rainbow = c.lvl >= .6, charged = !rainbow && c.lvl >= .4, hue0 = rnd(0, 360);
      const col = k => (rainbow ? `hsl(${(hue0 + k * 540) % 360},100%,74%)` : charged && k * 7 % 2 > 1 ? '#d6fbff' : '#d4ffe8');
      const glowCol = k => (rainbow ? `hsl(${(hue0 + k * 540 + 40) % 360},100%,56%)` : charged && k * 7 % 2 > 1 ? '#22d3ee' : '#3ee08f');
      const rgbAt = k => (rainbow ? hsl(hue0 + k * 540) : charged && k * 7 % 2 > 1 ? '34, 211, 238' : '62, 224, 143');
      if (rainbow) c.host.classList.add('is-rainbow');
      const pre = c.ghost.animate([
        { filter: 'brightness(1)', transform: 'none' },
        { filter: 'brightness(2.2) saturate(1.8)', transform: 'translate(-2px,1px) scale(1.03)' },
        { filter: 'brightness(.9)', transform: 'translate(2px,-1px) scale(1.04)' },
        { filter: 'brightness(2.6) saturate(2)', transform: 'scale(1.06)' },
      ], { duration: 300, easing: 'steps(6)', fill: 'forwards' });
      // ชาร์จ: สายฟ้าคลานบนการ์ด + วงไฟฟ้าหดเข้า
      addDraw({ life: .95, draw(g, k) {
        if (Math.random() < .3) return; // กะพริบ
        g.globalCompositeOperation = 'lighter'; g.globalAlpha = k < .3 ? 1 : 1 - (k - .3) / .7;
        const n = 2 + Math.round(c.lvl * 3);
        for (let i = 0; i < n; i++) {
          const x1 = c.rect.left + rnd(0, c.W), y1 = c.rect.top + rnd(0, c.H), x2 = c.rect.left + rnd(0, c.W), y2 = c.rect.top + rnd(0, c.H);
          strokeBolt(g, jagged(x1, y1, x2, y2, 6, 9), col(k + i * .1), 1.5, glowCol(k + i * .1));
        }
      } });
      addDraw({ life: .3, draw(g, k) {
        g.globalCompositeOperation = 'lighter'; g.globalAlpha = .9;
        const r = Math.max(c.W, c.H) * (1.4 - k);
        g.strokeStyle = col(k); g.shadowColor = glowCol(k); g.shadowBlur = 16; g.lineWidth = 2.5; g.setLineDash([10, 8]); g.lineDashOffset = k * 60;
        g.beginPath(); g.arc(c.cx, c.cy, r, 0, 7); g.stroke();
      } });
      later(300, () => {
        // ระเบิด: แฟลช + คลื่น + สายฟ้าฟาดออกรอบทิศ + ประกายพุ่ง
        buzz(28); shake(c.lvl > .55);
        flash(c.cx, c.cy, Math.max(c.W, c.H) * (1.1 + c.lvl), rainbow ? '255, 255, 255' : '120, 255, 190', .45);
        shockwave(c.cx, c.cy, c.W * .3, c.W * (1.6 + c.lvl * 1.2), rgbAt(0), .55, 7);
        if (rainbow) { shockwave(c.cx, c.cy, c.W * .2, c.W * (1.3 + c.lvl), rgbAt(.33), .6, 4, .06); shockwave(c.cx, c.cy, c.W * .1, c.W * (1 + c.lvl), rgbAt(.66), .65, 3, .12); }
        const bolts = Math.round((5 + c.lvl * 5) * c.n);
        for (let i = 0; i < bolts; i++) {
          const a = rnd(0, Math.PI * 2), L = c.W * rnd(1.2, 2.4 + c.lvl);
          const pts = jagged(c.cx, c.cy, c.cx + Math.cos(a) * L, c.cy + Math.sin(a) * L, 9, 12);
          const kk = i / bolts;
          addDraw({ life: rnd(.22, .4), delay: rnd(0, .08), draw(g, k) {
            if (Math.random() < .25) return;
            g.globalCompositeOperation = 'lighter'; g.globalAlpha = 1 - k;
            strokeBolt(g, pts, col(kk), 2.4 * (1 - k * .5), glowCol(kk));
          } });
        }
        for (let i = 0; i < 46 * c.n * (.7 + c.lvl); i++) {
          const a = rnd(0, Math.PI * 2), v = rnd(260, 620);
          addPart({ kind: 'streak', x: c.cx + rnd(-8, 8), y: c.cy + rnd(-8, 8), vx: Math.cos(a) * v, vy: Math.sin(a) * v, drag: 3.5, life: rnd(.3, .6), size: rnd(1.4, 2.6), rgb: '200, 255, 225', hue: rainbow ? hue0 + rnd(0, 360) : undefined });
        }
        const flt = makeFilter({ edge: rainbow ? '#ffffff' : '#7dffbf', freq: .12, turb: 'turbulence', bloom: 3, char: '#04150c' }, c.W, c.H);
        applyFilter(c.ghost, flt, pre);
        runDissolve(flt, .62, {
          rim: .09, pow: 1.3,
          each(k) {
            if (rainbow) flt.color(`hsl(${(hue0 + k * 720) % 360},100%,65%)`);
            if (Math.random() < .55) addPart({ kind: 'glow', x: c.rect.left + rnd(0, c.W), y: c.rect.top + rnd(0, c.H), vx: rnd(-20, 20), vy: rnd(-70, -20), life: rnd(.4, .8), size: rnd(3, 6), rgb: rgbAt(k), hue: rainbow ? hue0 + k * 400 : undefined });
          },
          end: c.done,
        });
      });
    },

    // ---------------- เหนือ: ดาบฟันผ่าสองท่อน ----------------
    nuea(c) {
      const pre = c.ghost.animate([{ transform: 'none' }, { transform: 'translateY(-6px) rotate(-3deg) scale(1.03)' }], { duration: 180, easing: 'cubic-bezier(.3,0,.2,1)', fill: 'forwards' });
      const dir = Math.random() < .5 ? 1 : -1; // ทิศฟัน
      // เส้นฟัน (พิกัดเทียบการ์ด 0..1) ทแยงผ่านกลางการ์ด เลยขอบออกไปเล็กน้อย
      const ax = dir > 0 ? -.15 : 1.15, bx = dir > 0 ? 1.15 : -.15, ay = rnd(.05, .25), by = rnd(.75, .95);
      const A = [c.rect.left + ax * c.W, c.rect.top + ay * c.H], B = [c.rect.left + bx * c.W, c.rect.top + by * c.H];
      later(180, () => {
        buzz(30); shake(c.lvl > .5);
        addDraw({ life: .36, draw(g, k) { // แสงดาบวาดผ่าน
          const m = Math.min(1, k / .35), x = A[0] + (B[0] - A[0]) * m, y = A[1] + (B[1] - A[1]) * m;
          g.globalCompositeOperation = 'lighter'; g.globalAlpha = 1 - Math.max(0, (k - .35) / .65);
          g.lineCap = 'round'; g.shadowColor = '#ffb347'; g.shadowBlur = 22;
          g.strokeStyle = 'rgba(255, 190, 90, .8)'; g.lineWidth = 12 * (1 - k * .6); g.beginPath(); g.moveTo(A[0], A[1]); g.lineTo(x, y); g.stroke();
          g.strokeStyle = '#fffaf0'; g.lineWidth = 3; g.stroke();
        } });
        const nx0 = -(B[1] - A[1]), ny0 = B[0] - A[0], L0 = Math.hypot(nx0, ny0) || 1;
        for (let i = 0; i < 26 * c.n; i++) {
          const t = Math.random(), x = A[0] + (B[0] - A[0]) * t, y = A[1] + (B[1] - A[1]) * t;
          const s = Math.random() < .5 ? 1 : -1, v = rnd(80, 300);
          addPart({ kind: 'streak', x, y, vx: nx0 / L0 * v * s + rnd(-40, 40), vy: ny0 / L0 * v * s + rnd(-60, 20), g: 400, drag: 1.5, life: rnd(.3, .6), size: rnd(1.2, 2.2), rgb: '255, 200, 110' });
        }
        // ขาดสองท่อน: โคลนอีกใบ ตัดสองใบด้วย clip-path ตามเส้นฟัน แล้วไถลแยกตั้งฉากกับแนวฟัน
        const pct = (x, y) => `${(x * 100).toFixed(1)}% ${(y * 100).toFixed(1)}%`;
        // ปลายซ้าย (Lx<0) / ปลายขวา (Rx>1) ของเส้นฟัน: ท่อนบน = เหนือเส้น, ท่อนล่าง = ใต้เส้น (ไล่จุดตามเข็มนาฬิกา ไม่ไขว้กัน)
        const [Lx, Ly, Rx, Ry] = dir > 0 ? [ax, ay, bx, by] : [bx, by, ax, ay];
        const top = `polygon(-20% -20%, 120% -20%, ${pct(Rx, Ry)}, ${pct(Lx, Ly)})`;
        const bot = `polygon(${pct(Lx, Ly)}, ${pct(Rx, Ry)}, 120% 120%, -20% 120%)`;
        settle(pre);
        // clip-path อยู่ที่การ์ด (นิ่ง) ส่วนการไถลอยู่ที่กล่องห่อ: clip-path + WAAPI บนตัวเดียวกันอาจวาดไม่ขึ้น
        const slot = c.ghost.parentElement;
        const half = el => { const w = document.createElement('div'); w.className = 'fx-dslv-half'; slot.appendChild(w); w.appendChild(el); return w; };
        const twin = c.ghost.cloneNode(true);
        c.ghost.style.clipPath = top; twin.style.clipPath = bot;
        const hTop = half(c.ghost), hBot = half(twin);
        const nx = -(by - ay) * c.H, ny = (bx - ax) * c.W, L = Math.hypot(nx, ny) || 1, ux = nx / L, uy = ny / L;
        const slide = (el, s, rot) => el.animate([
          { transform: 'translate(0px,0px) rotate(0deg)', opacity: 1 },
          { transform: `translate(${ux * 10 * s}px, ${uy * 10 * s}px) rotate(${rot * .3}deg)`, opacity: 1, offset: .25 },
          { transform: `translate(${ux * 30 * s}px, ${uy * 30 * s + 40}px) rotate(${rot}deg)`, opacity: 0 },
        ], { duration: 900, easing: 'cubic-bezier(.3,.1,.5,1)', fill: 'forwards' });
        slide(hTop, -1, -9 * dir); slide(hBot, 1, 11 * dir).onfinish = c.done;
        // ฝุ่นตามแนวขาด + ฝุ่นฟุ้งที่ฐาน + ธงขาดปลิว
        addDraw({ life: .8, draw(g, k) {
          if (Math.random() < .5) return;
          for (let i = 0; i < 3; i++) {
            const t = Math.random(), x = A[0] + (B[0] - A[0]) * t, y = A[1] + (B[1] - A[1]) * t + k * 40;
            addPart({ kind: Math.random() < .3 ? 'chip' : 'smoke', x, y, vx: rnd(-30, 30), vy: rnd(10, 60), g: 160, life: rnd(.5, .9), size: rnd(3, 8), rgb: '170, 130, 90', fill: 'rgb(160, 110, 60)', rot: rnd(0, 6), vr: rnd(-6, 6), grow: .8 });
          }
        } });
        for (let i = 0; i < 9 * c.n; i++) addPart({ kind: 'smoke', x: c.cx + rnd(-c.W * .6, c.W * .6), y: c.rect.bottom + rnd(-6, 6), vx: rnd(-60, 60), vy: rnd(-40, -10), drag: 1.2, life: rnd(.8, 1.3), size: rnd(10, 18), grow: 1.4, rgb: '150, 120, 85', alpha: .8 });
        const flag = ['rgb(176, 32, 38)', 'rgb(240, 163, 71)', 'rgb(250, 236, 200)'];
        for (let i = 0; i < 12 * c.n; i++) addPart({ kind: 'shred', x: c.cx + rnd(-c.W * .4, c.W * .4), y: c.cy + rnd(-c.H * .3, c.H * .2), vx: rnd(-140, 140), vy: rnd(-200, -60), g: 260, drag: 1.4, wob: rnd(0, 6), life: rnd(.9, 1.4), size: rnd(4, 8), fill: flag[i % 3], rot: rnd(0, 6), vr: rnd(-8, 8) });
      });
    },

    // ---------------- วันสิ้นโลก: เวลาหยุด → หลุมดำ ----------------
    doom(c) {
      const pre = c.ghost.animate([
        { filter: 'none', transform: 'none' },
        { filter: 'grayscale(1) sepia(.5) hue-rotate(220deg) brightness(.9) contrast(1.2)', transform: 'scale(.98)' },
      ], { duration: 340, easing: 'ease-out', fill: 'forwards' });
      accent(c.host, 'is-clock', `<svg viewBox="-60 -60 120 120"><circle r="56" class="ring"/><circle r="48" class="ring dash"/>${NUMERALS.map((n, k) => {
        const a = (k * 30 - 90) * Math.PI / 180;
        return `<text x="${(41 * Math.cos(a)).toFixed(1)}" y="${(41 * Math.sin(a) + 3).toFixed(1)}">${n}</text>`;
      }).join('')}<line class="hand h1" x1="0" y1="6" x2="0" y2="-44"/><line class="hand h2" x1="0" y1="4" x2="0" y2="-30"/><circle r="3" class="pin"/></svg>`);
      for (let i = 0; i < 3; i++) shockwave(c.cx, c.cy, c.W * .9, c.W * .25, '190, 150, 255', .4, 2, i * .1); // ระลอกเวลาหดเข้า
      const tex = cardTexture(c.el, c.W, c.H);
      const cols = small() ? 4 : 5, rows = small() ? 5 : 7;
      const voidR = Math.max(c.W, c.H) * (.32 + c.lvl * .12);
      later(360, () => {
        buzz(20);
        settle(pre);
        c.ghost.style.visibility = 'hidden';
        flash(c.cx, c.cy, c.W * .9, '200, 170, 255', .3);
        // เศษเวลา: ค้างกลางอากาศ (ลอยช้า) → ถูกดูดเข้าจุดกลาง
        shardsOf(c.W, c.H, cols, rows).forEach(s => {
          const ox = s.cx - c.W / 2, oy = s.cy - c.H / 2;
          const p = { kind: 'shard', x: c.rect.left + s.cx, y: c.rect.top + s.cy, vx: ox * .35, vy: oy * .35, drag: 2.2, life: 1.15, size: 1, poly: s.poly, cx: s.cx, cy: s.cy, tex, rot: 0, vr: rnd(-.6, .6), sc: 1, edge: 'rgba(214, 184, 255, .95)', edgeW: 1.2, tint: 'rgba(120, 80, 200, .22)', fadeIn: .02 };
          addPart(p);
          later(380, () => { p.pull = { x: c.cx, y: c.cy, k: 38 }; p.drag = 4.5; p.vr = rnd(-12, 12); p.shrink = .9; });
        });
        // หลุมดำ: ขยาย หมุนวงแหวนทอง แล้วยุบ
        addDraw({ life: 1.05, delay: .3, draw(g, k) {
          const r = voidR * (k < .7 ? easeOut(k / .7) : 1 - easeIn((k - .7) / .3));
          if (r <= .5) return;
          const gr = g.createRadialGradient(c.cx, c.cy, 0, c.cx, c.cy, r * 1.6);
          gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(.55, 'rgba(10,0,20,1)'); gr.addColorStop(.62, 'rgba(180,140,255,.95)'); gr.addColorStop(.72, 'rgba(232,201,119,.5)'); gr.addColorStop(1, 'rgba(120,60,200,0)');
          g.fillStyle = gr; g.beginPath(); g.arc(c.cx, c.cy, r * 1.6, 0, 7); g.fill();
          g.globalCompositeOperation = 'lighter'; g.strokeStyle = 'rgba(232, 201, 119, .8)'; g.lineWidth = 1.5;
          for (let i = 0; i < 3; i++) { g.beginPath(); g.arc(c.cx, c.cy, r * (1.15 + i * .18), k * 9 + i * 2, k * 9 + i * 2 + 2.2); g.stroke(); }
        } });
        later(1100, () => {
          buzz(24); shake(c.lvl > .5);
          flash(c.cx, c.cy, c.W * (1.3 + c.lvl), '232, 201, 119', .5);
          shockwave(c.cx, c.cy, 4, c.W * (1.8 + c.lvl), '200, 160, 255', .6, 6);
          shockwave(c.cx, c.cy, 4, c.W * (1.2 + c.lvl), '232, 201, 119', .55, 3, .05);
          for (let i = 0; i < 36 * c.n; i++) {
            const a = rnd(0, Math.PI * 2), v = rnd(60, 260);
            addPart({ kind: 'glow', x: c.cx, y: c.cy, vx: Math.cos(a) * v, vy: Math.sin(a) * v, drag: 2, g: -30, life: rnd(.6, 1.1), size: rnd(2, 4.5), rgb: Math.random() < .5 ? '200, 160, 255' : '232, 201, 119' });
          }
          later(650, c.done);
        });
      });
    },

    // ---------------- ไดโน: งับ → ข่วน → แตกเป็นหิน + รอยเท้า ----------------
    dino(c) {
      // ฟัน 9 ซี่ ไล่จากขวาไปซ้าย (เส้นทางเริ่มที่มุมขวา)
      const teeth = (tip, base) => [...Array(9)].map((_, j) => { const i = 8 - j; return `L${((i + .5) * 12.5 - 6).toFixed(1)} ${tip} L${(i * 12.5 - 6).toFixed(1)} ${base}`; }).join(' ');
      accent(c.host, 'is-jaws', `<svg viewBox="0 0 100 140" preserveAspectRatio="none">
        <path class="jaw top" d="M-6 -2 H106 V18 ${teeth(38, 18)} Z"/>
        <path class="jaw bot" d="M-6 142 H106 V122 ${teeth(102, 122)} Z"/></svg>`);
      later(150, () => { buzz(22); shake(false); });
      let pose = c.ghost.animate([{ transform: 'none' }, { transform: 'scale(.94, .9)', offset: .5 }, { transform: 'scale(1.02) rotate(-2deg)' }], { duration: 300, easing: 'ease-out', fill: 'forwards' });
      later(300, () => { // กรงเล็บ 3 เส้น: การ์ดสะบัดตามแรงฟาด
        const dir = Math.random() < .5 ? 1 : -1;
        settle(pose);
        pose = c.ghost.animate([
          { transform: c.ghost.style.transform || 'none' },
          { transform: `translate(${dir * 9}px, 5px) rotate(${dir * 4}deg) scale(1.01)`, offset: .3 },
          { transform: `translate(${dir * 4}px, 2px) rotate(${dir * 2}deg)` },
        ], { duration: 260, easing: 'cubic-bezier(.2,.8,.3,1)', fill: 'forwards' });
        clawSwipe(c, dir, .62);
        buzz(34); shake(true);
      });
      const tex = cardTexture(c.el, c.W, c.H);
      later(580, () => { // แตกเป็นหินอำพัน + รอยเท้า
        settle(pose);
        c.ghost.style.visibility = 'hidden';
        c.host.querySelectorAll('.fx-dslv-acc').forEach(n => n.classList.add('is-out'));
        buzz(40); shake(true);
        const floor = c.rect.bottom + c.H * .12;
        shardsOf(c.W, c.H, small() ? 3 : 4, small() ? 4 : 5).forEach(s => {
          const ox = s.cx - c.W / 2, oy = s.cy - c.H / 2;
          addPart({ kind: 'shard', x: c.rect.left + s.cx, y: c.rect.top + s.cy, vx: ox * rnd(2.5, 5) + rnd(-40, 40), vy: oy * 2 - rnd(120, 280), g: 1100, floor: floor + rnd(-6, 6), bounce: .32, life: rnd(1, 1.3), size: 1, poly: s.poly, cx: s.cx, cy: s.cy, tex, rot: 0, vr: rnd(-7, 7), sc: 1, tint: 'rgba(150, 82, 10, .28)', edge: 'rgba(255, 196, 92, .9)', edgeW: 1.6 });
        });
        for (let i = 0; i < 26 * c.n; i++) addPart({ kind: 'chip', x: c.cx + rnd(-c.W * .4, c.W * .4), y: c.cy + rnd(-c.H * .3, c.H * .3), vx: rnd(-220, 220), vy: rnd(-320, -60), g: 1000, floor, bounce: .4, life: rnd(.7, 1.1), size: rnd(2, 4.5), fill: 'rgb(150, 92, 30)', edge: 'rgba(255, 190, 90, .9)', rot: rnd(0, 6), vr: rnd(-12, 12) });
        for (let i = 0; i < 10 * c.n; i++) addPart({ kind: 'smoke', x: c.cx + rnd(-c.W * .7, c.W * .7), y: floor, vx: rnd(-90, 90), vy: rnd(-50, -10), drag: 1.4, life: rnd(.8, 1.3), size: rnd(10, 20), grow: 1.5, rgb: '170, 120, 60', alpha: .85 });
        shockwave(c.cx, floor, c.W * .2, c.W * 1.4, '255, 170, 60', .5, 5);
        // รอยเท้าทีเร็กซ์ยักษ์ตกลงประทับตรงช่องนั้น (ค้างอยู่ครู่หนึ่งหลังการ์ดหายไป)
        stomp(c.cx, c.cy + c.H * .04, c.H * 1.18, rnd(-.35, .35), c.lvl, c.n);
        later(900, c.done);
      });
    },

    // ---------------- ปีศาจ: วงเวทเจ็ดแฉก + ไฟนรก ----------------
    demon(c) {
      const hept = [...Array(7)].map((_, i) => { const a = (i * 3 / 7) * Math.PI * 2 - Math.PI / 2; return `${(Math.cos(a) * 40).toFixed(1)},${(Math.sin(a) * 40).toFixed(1)}`; }).join(' ');
      const runes = [...Array(14)].map((_, i) => `<rect x="-2" y="-51" width="4" height="7" transform="rotate(${(i / 14 * 360).toFixed(1)})"/>`).join('');
      accent(c.host, 'is-sigil', `<svg viewBox="-60 -60 120 120"><circle r="56" class="ring"/><circle r="46" class="ring thin"/><g class="runes">${runes}</g><polygon class="star" points="${hept}"/></svg>`);
      accent(c.host, 'is-eyes', '<i></i><i></i>');
      const pre = c.ghost.animate([{ filter: 'none' }, { filter: 'brightness(.55) saturate(1.8) sepia(.4) hue-rotate(-30deg) contrast(1.3)' }], { duration: 300, easing: 'ease-in', fill: 'forwards' });
      later(260, () => {
        buzz(26); shake(c.lvl > .5);
        const flt = makeFilter({ edge: '#ff6a2a', freq: .065, bias: 'up', bloom: 3.4, char: '#0a0204' }, c.W, c.H);
        applyFilter(c.ghost, flt, pre);
        const dur = 1.0;
        runDissolve(flt, dur, {
          rim: .1, char: .09, pow: 1.15,
          each(k) {
            const lineY = c.rect.bottom - c.H * Math.min(1, k * 1.15); // แนวไฟ (ไหม้จากล่างขึ้นบน)
            const n = Math.round((3 + c.lvl * 3) * c.n);
            for (let i = 0; i < n; i++) {
              addPart({ kind: 'glow', x: c.rect.left + rnd(-.05, 1.05) * c.W, y: lineY + rnd(-6, 10), vx: rnd(-15, 15), vy: rnd(-160, -70), wob: rnd(0, 6), life: rnd(.35, .7), size: rnd(5, 10), shrink: .7, rgb: Math.random() < .35 ? '255, 200, 90' : '255, 70, 30' });
            }
            if (Math.random() < .5) addPart({ kind: 'smoke', x: c.rect.left + rnd(0, c.W), y: lineY - rnd(0, 20), vx: rnd(-20, 20), vy: rnd(-90, -40), life: rnd(.8, 1.3), size: rnd(8, 14), grow: 1.6, rgb: '20, 6, 10', alpha: .9 });
            if (Math.random() < .4) addPart({ kind: 'glow', x: c.rect.left + rnd(0, c.W), y: lineY, vx: rnd(-40, 40), vy: rnd(-220, -120), g: 60, wob: rnd(0, 6), life: rnd(.8, 1.4), size: rnd(1.5, 3), rgb: '255, 160, 60' });
          },
        });
        later(dur * 1000 - 120, () => { // เสาเพลิงพุ่งตอนท้าย
          buzz(30);
          addDraw({ life: .6, draw(g, k) {
            const h = c.H * (1.6 + c.lvl) * easeOut(Math.min(1, k * 2.2)), w = c.W * .7 * (1 - k * .5);
            if (h < 1) return;
            const gr = g.createLinearGradient(0, c.rect.bottom, 0, c.rect.bottom - h);
            gr.addColorStop(0, 'rgba(255, 220, 140, .95)'); gr.addColorStop(.35, 'rgba(255, 70, 30, .8)'); gr.addColorStop(.8, 'rgba(90, 0, 20, .4)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
            g.globalCompositeOperation = 'lighter'; g.globalAlpha = 1 - easeIn(k);
            g.fillStyle = gr; g.beginPath(); g.ellipse(c.cx, c.rect.bottom - h / 2, w / 2, h / 2, 0, 0, 7); g.fill();
          } });
          shockwave(c.cx, c.rect.bottom, c.W * .2, c.W * 1.3, '255, 70, 30', .5, 5);
          later(700, c.done);
        });
      });
    },

    // ---------------- โอ๊ต: ระเบิดคอมิก ----------------
    oat(c) {
      const WORDS = ['POOF!', 'BOOM!', 'ปั้ง!!', 'WHAM!', 'บึ้ม!!', 'KAPOW!'];
      const pre = c.ghost.animate([
        { transform: 'none' }, { transform: 'scale(1.18, .8) rotate(-4deg)' }, { transform: 'scale(.82, 1.22) rotate(5deg)' }, { transform: 'scale(1.12, .9)' }, { transform: 'scale(.6) rotate(-10deg)' },
      ], { duration: 300, easing: 'ease-in-out', fill: 'forwards' });
      accent(c.host, 'is-speed', '<i></i><i></i><i></i><i></i><i></i><i></i>');
      const tex = cardTexture(c.el, c.W, c.H);
      later(280, () => {
        settle(pre);
        c.ghost.style.visibility = 'hidden';
        buzz(30); shake(c.lvl > .5);
        const spikes = 14, poly = [...Array(spikes * 2)].map((_, i) => { const a = i / (spikes * 2) * Math.PI * 2, r = i % 2 ? rnd(30, 36) : rnd(44, 50); return `${(Math.cos(a) * r).toFixed(1)},${(Math.sin(a) * r).toFixed(1)}`; }).join(' ');
        accent(c.host, 'is-kaboom', `<svg viewBox="-55 -55 110 110"><polygon class="b2" points="${poly}"/><polygon class="b1" points="${poly}"/></svg><b>${WORDS[Math.floor(Math.random() * WORDS.length)]}</b>`);
        shardsOf(c.W, c.H, 3, 4).forEach(s => { // ชิ้นการ์ดขอบดำ หมุนปลิว
          const ox = s.cx - c.W / 2, oy = s.cy - c.H / 2;
          addPart({ kind: 'shard', x: c.rect.left + s.cx, y: c.rect.top + s.cy, vx: ox * rnd(4, 7), vy: oy * 4 - rnd(100, 260), g: 900, drag: .6, life: rnd(.8, 1.1), size: 1, poly: s.poly, cx: s.cx, cy: s.cy, tex, rot: 0, vr: rnd(-14, 14), sc: .9, edge: '#1a0010', edgeW: 3 });
        });
        const fills = ['#ff7ac2', '#ffd84a', '#7ee0ff', '#ffffff'];
        for (let i = 0; i < 22 * c.n; i++) {
          const a = rnd(0, Math.PI * 2), v = rnd(160, 420);
          addPart({ kind: 'star', x: c.cx, y: c.cy, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 80, g: 520, drag: 1.6, life: rnd(.7, 1.1), size: rnd(4, 9), points: Math.random() < .5 ? 4 : 5, fill: fills[i % 4], edge: '#1a0010', edgeW: 2, rot: rnd(0, 6), vr: rnd(-10, 10) });
        }
        const ring = Math.round(28 * c.n); // จุดฮาล์ฟโทนวงแหวนกระจาย
        for (let i = 0; i < ring; i++) {
          const a = i / ring * Math.PI * 2, v = rnd(220, 300);
          addPart({ kind: 'dot', x: c.cx + Math.cos(a) * 10, y: c.cy + Math.sin(a) * 10, vx: Math.cos(a) * v, vy: Math.sin(a) * v, drag: 3.2, life: .55, size: rnd(2.5, 4.5), shrink: 1, fill: i % 2 ? '#ff4fa8' : '#1a0010' });
        }
        flash(c.cx, c.cy, c.W * 1.2, '255, 150, 210', .35);
        later(1000, c.done);
      });
    },
  };

  // ============================================================================
  function play(el, card, owner, power) {
    if (!el || !el.isConnected) return;
    const rect = el.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const key = deckOf(card, owner);
    const { host, ghost } = makeGhost(el, rect, key);
    el.style.visibility = 'hidden'; // ช่องเดิมจะถูกวาดใหม่อยู่แล้ว · กันเห็นซ้อนสองใบระหว่างรอ
    let finished = false;
    const done = () => { if (finished) return; finished = true; (host._flt || []).forEach(f => f.remove()); host.remove(); };
    setTimeout(done, 3200); // กันค้าง (แท็บถูกซ่อน / rAF หยุด)

    if (reduce()) {
      ghost.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 200, fill: 'forwards' }).onfinish = done;
      return;
    }
    const lvl = levelOf(card, power);
    const c = { el, rect, host, ghost, lvl, done, W: rect.width, H: rect.height, cx: rect.left + rect.width / 2, cy: rect.top + rect.height / 2, n: (small() ? .6 : 1) * (.75 + lvl * .6) };
    kick();
    try { SCENES[key](c); } catch (e) { console.warn('[card-dissolve]', e); done(); }
  }

  window.BOFDissolve = { play, deckOf, levelOf, _engine: E };
})();
