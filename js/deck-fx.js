/* ============================================================================
   BOF DECK FX: เอฟเฟคประจำเด็คตอนโจมตี / ใช้สกิล / พลังเปลี่ยน / ฟื้น HP (หน้าตาเท่านั้น)
   วาดบน canvas + rAF + โหมด lite เดียวกับ js/card-dissolve.js (BOFDissolve._fx) จึงต้องโหลดหลังไฟล์นั้น

   DeckFx.strike(deck, a, b, heavy) — เส้นพุ่ง 0.1 วิ จาก a ไป b ({x,y} พิกัดจอ) แล้วปะทะที่ b · BOFFX.impact เรียกให้
   DeckFx.skill(el, deck)           — การ์ด/Leader ที่ใช้สกิลเรืองสีเด็ค + วงคลื่น + อนุภาคประจำเด็ค
   DeckFx.diff()                    — เรียกท้าย renderGame: เทียบพลัง/HP กับรอบก่อน → ลูกศรขึ้นลง +N/-N · ฟื้น HP
   จิต สายฟ้าเขียว · เหนือ ดาบฟันไขว้ · วันสิ้นโลก รอยแยกเวลาม่วงทอง · ไดโน กรงเล็บอำพัน · ปีศาจ ไฟนรกดำแดง · โอ๊ต ระเบิดคอมิกชมพู
   reduced motion = ไม่มีเส้น/อนุภาค (ตัวเลขยังขึ้นแล้วจาง)
   ============================================================================ */
(function () {
  const F = () => window.BOFDissolve && window.BOFDissolve._fx;
  const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const rnd = (a, b) => a + Math.random() * (b - a);
  const later = (ms, fn) => setTimeout(fn, ms);
  const PAL = {
    jit: { rgb: '62, 224, 143', core: '#e6fff2', glow: '#3ee08f' },
    nuea: { rgb: '255, 179, 71', core: '#fffaf0', glow: '#ffb347' },
    doom: { rgb: '168, 85, 247', core: '#f3e8ff', glow: '#a855f7', gold: '243, 201, 105' },
    dino: { rgb: '255, 150, 50', core: '#fff1d6', glow: '#ff9632' },
    demon: { rgb: '230, 40, 40', core: '#ffd6c2', glow: '#dc2626' },
    oat: { rgb: '255, 105, 180', core: '#fff0f8', glow: '#ff69b4' },
  };
  const OAT_COLORS = ['#ff69b4', '#ffd23f', '#3ec7ff', '#9b5cff', '#5ef2a0'];
  const amount = () => (F().small() ? .6 : 1) * (F().lite() ? .7 : 1);

  // เส้นตรงจาก a ไป b ถึงสัดส่วน m · ชั้นนอกเรือง ชั้นในสว่าง
  function beam(g, a, b, m, w, core, glow) {
    const x = a.x + (b.x - a.x) * m, y = a.y + (b.y - a.y) * m;
    g.lineCap = 'round'; g.shadowColor = glow; g.shadowBlur = 16;
    g.strokeStyle = glow; g.lineWidth = w * 2.4; g.globalAlpha *= .55; g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(x, y); g.stroke();
    g.globalAlpha /= .55; g.shadowBlur = 0; g.strokeStyle = core; g.lineWidth = w; g.stroke();
  }
  // ช่วงพุ่ง = 35% แรกของอายุ (0.1 วิ จาก .28) แล้วจางหาย
  const TRAIL = .28, reach = k => Math.min(1, k / .35), fadeOut = k => 1 - Math.max(0, (k - .35) / .65);

  // ---------- ปะทะ: เส้นพุ่ง (trail) + จุดปะทะ (hit) ประจำเด็ค ----------
  const TRAILS = {
    jit(a, b, p) {
      const { addDraw, jagged, strokeBolt } = F();
      const v = [jagged(a.x, a.y, b.x, b.y, 10, 14), jagged(a.x, a.y, b.x, b.y, 10, 14)];
      addDraw({ life: TRAIL, draw(g, k) {
        if (Math.random() < .2) return;
        const pts = v[Math.floor(k * 12) % 2], m = Math.max(2, Math.ceil(pts.length * reach(k)));
        g.globalCompositeOperation = 'lighter'; g.globalAlpha = fadeOut(k);
        strokeBolt(g, pts.slice(0, m), p.core, 2.6, p.glow);
      } });
    },
    nuea(a, b, p) {
      F().addDraw({ life: TRAIL, draw(g, k) { g.globalCompositeOperation = 'lighter'; g.globalAlpha = fadeOut(k); beam(g, a, b, reach(k), 2.2, p.core, p.glow); } });
    },
    doom(a, b, p) {
      F().addDraw({ life: TRAIL, draw(g, k) {
        g.globalCompositeOperation = 'lighter'; g.globalAlpha = fadeOut(k);
        g.setLineDash([14, 7]); g.lineDashOffset = -k * 90; beam(g, a, b, reach(k), 3, p.core, p.glow);
      } });
    },
    dino(a, b, p) {
      F().addDraw({ life: TRAIL, draw(g, k) { g.globalCompositeOperation = 'lighter'; g.globalAlpha = fadeOut(k); beam(g, a, b, reach(k), 4.5, p.core, p.glow); } });
    },
    demon(a, b, p) { // ไม่มีเส้น: ลูกไฟพุ่งทิ้งควันดำและไฟตามทาง
      const { addPart, addDraw } = F(), n = amount();
      addDraw({ life: .1, draw(g, k) {
        const x = a.x + (b.x - a.x) * k, y = a.y + (b.y - a.y) * k;
        for (let i = 0; i < 3 * n + 1; i++) {
          addPart({ kind: 'glow', x: x + rnd(-5, 5), y: y + rnd(-5, 5), vx: rnd(-30, 30), vy: rnd(-90, -30), life: rnd(.25, .45), size: rnd(4, 8), rgb: Math.random() < .5 ? p.rgb : '255, 140, 40' });
          if (Math.random() < .5) addPart({ kind: 'smoke', x, y, vx: rnd(-20, 20), vy: rnd(-50, -15), life: rnd(.4, .7), size: rnd(6, 11), grow: 1.2, rgb: '22, 6, 8', alpha: .7 });
        }
      } });
    },
    oat(a, b, p) {
      F().addDraw({ life: TRAIL, draw(g, k) { // เส้นการ์ตูนขอบดำ
        const m = reach(k), x = a.x + (b.x - a.x) * m, y = a.y + (b.y - a.y) * m;
        g.globalAlpha = fadeOut(k); g.lineCap = 'round';
        g.strokeStyle = '#1a0010'; g.lineWidth = 9; g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(x, y); g.stroke();
        g.strokeStyle = p.glow; g.lineWidth = 5; g.stroke();
      } });
    },
  };

  const HITS = {
    jit(b, p, heavy) {
      const { addDraw, addPart, jagged, strokeBolt, flash, shockwave } = F(), n = amount();
      flash(b.x, b.y, heavy ? 90 : 60, '120, 255, 190', .3);
      shockwave(b.x, b.y, 8, heavy ? 110 : 70, p.rgb, .3, 4);
      for (let i = 0; i < Math.round((heavy ? 7 : 5) * n); i++) {
        const ang = rnd(0, Math.PI * 2), L = rnd(30, heavy ? 90 : 60), pts = jagged(b.x, b.y, b.x + Math.cos(ang) * L, b.y + Math.sin(ang) * L, 5, 7);
        addDraw({ life: rnd(.14, .24), draw(g, k) { if (Math.random() < .25) return; g.globalCompositeOperation = 'lighter'; g.globalAlpha = 1 - k; strokeBolt(g, pts, p.core, 1.8, p.glow); } });
      }
      for (let i = 0; i < 18 * n; i++) { const ang = rnd(0, Math.PI * 2), v = rnd(200, 480); addPart({ kind: 'streak', x: b.x, y: b.y, vx: Math.cos(ang) * v, vy: Math.sin(ang) * v, drag: 4, life: rnd(.2, .4), size: rnd(1.2, 2.2), rgb: '200, 255, 225' }); }
    },
    nuea(b, p, heavy) { // ดาบฟันไขว้ X ที่เป้า
      const { addDraw, addPart, flash } = F(), n = amount(), R = heavy ? 52 : 38;
      [[-1, 0], [1, .05]].forEach(([s, delay]) => {
        const A = { x: b.x - R * s, y: b.y - R }, B = { x: b.x + R * s, y: b.y + R };
        addDraw({ life: .26, delay, draw(g, k) { g.globalCompositeOperation = 'lighter'; g.globalAlpha = 1 - Math.max(0, (k - .3) / .7); beam(g, A, B, Math.min(1, k / .3), 2.6, p.core, p.glow); } });
      });
      flash(b.x, b.y, R * 1.3, p.rgb, .25, .05);
      for (let i = 0; i < 16 * n; i++) { const ang = rnd(0, Math.PI * 2), v = rnd(120, 320); addPart({ kind: 'streak', x: b.x, y: b.y, vx: Math.cos(ang) * v, vy: Math.sin(ang) * v - 60, g: 500, drag: 1.5, life: rnd(.25, .45), size: rnd(1.2, 2), rgb: '255, 210, 130' }); }
    },
    doom(b, p, heavy) { // วงเวลาซ้อน ม่วง/ทอง + เข็มนาฬิกากวาดย้อน
      const { addDraw, addPart, shockwave, flash } = F(), n = amount(), R = heavy ? 60 : 44;
      flash(b.x, b.y, R * 1.2, p.rgb, .3);
      shockwave(b.x, b.y, R * 1.4, 6, p.rgb, .3, 3); // หดเข้า = เวลาย้อน
      shockwave(b.x, b.y, 6, R * 1.6, p.gold, .32, 3, .06);
      addDraw({ life: .32, draw(g, k) {
        g.globalCompositeOperation = 'lighter'; g.globalAlpha = 1 - k; g.strokeStyle = `rgb(${p.gold})`; g.lineWidth = 2.5; g.lineCap = 'round';
        const ang = -Math.PI / 2 - k * Math.PI * 1.6;
        g.beginPath(); g.moveTo(b.x, b.y); g.lineTo(b.x + Math.cos(ang) * R, b.y + Math.sin(ang) * R); g.stroke();
      } });
      for (let i = 0; i < 12 * n; i++) { const ang = rnd(0, Math.PI * 2), r = rnd(R * .6, R * 1.3); addPart({ kind: 'glow', x: b.x + Math.cos(ang) * r, y: b.y + Math.sin(ang) * r, vx: 0, vy: 0, pull: { x: b.x, y: b.y, k: 22 }, life: rnd(.25, .4), size: rnd(2.5, 4.5), rgb: Math.random() < .5 ? p.rgb : p.gold }); }
    },
    dino(b, p, heavy) { // กรงเล็บ 3 เส้นข่วนผ่านเป้า
      const { addDraw, addPart, shockwave } = F(), n = amount(), R = heavy ? 50 : 38, dir = Math.random() < .5 ? 1 : -1;
      [-1, 0, 1].forEach((o, i) => {
        const A = { x: b.x - R * .55 * dir + o * 14, y: b.y - R }, B = { x: b.x + R * .55 * dir + o * 14, y: b.y + R };
        addDraw({ life: .3, delay: i * .03, draw(g, k) {
          g.globalAlpha = 1 - Math.max(0, (k - .35) / .65);
          const m = Math.min(1, k / .3), x = A.x + (B.x - A.x) * m, y = A.y + (B.y - A.y) * m;
          g.lineCap = 'round'; g.shadowColor = p.glow; g.shadowBlur = 12;
          g.strokeStyle = '#ffcf8a'; g.lineWidth = 5; g.beginPath(); g.moveTo(A.x, A.y); g.lineTo(x, y); g.stroke();
          g.shadowBlur = 0; g.strokeStyle = 'rgba(30, 8, 0, .9)'; g.lineWidth = 2; g.stroke();
        } });
      });
      shockwave(b.x, b.y, 10, R * 1.5, p.rgb, .3, 4);
      for (let i = 0; i < 14 * n; i++) addPart({ kind: 'chip', x: b.x + rnd(-12, 12), y: b.y + rnd(-12, 12), vx: rnd(-220, 220), vy: rnd(-300, -80), g: 1000, life: rnd(.35, .6), size: rnd(1.6, 3.4), fill: 'rgb(140, 84, 26)', edge: 'rgba(255, 190, 90, .9)', rot: rnd(0, 6), vr: rnd(-12, 12) });
    },
    demon(b, p, heavy) { // ไฟนรกพุ่งขึ้นจากจุดปะทะ
      const { addPart, flash, shockwave } = F(), n = amount();
      flash(b.x, b.y, heavy ? 80 : 56, p.rgb, .3);
      shockwave(b.x, b.y, 8, heavy ? 100 : 66, '120, 10, 10', .3, 5);
      for (let i = 0; i < 22 * n; i++) addPart({ kind: 'glow', x: b.x + rnd(-14, 14), y: b.y + rnd(-6, 10), vx: rnd(-60, 60), vy: rnd(-260, -90), drag: 1.5, wob: rnd(0, 6), life: rnd(.3, .55), size: rnd(4, 9), shrink: .6, rgb: Math.random() < .6 ? p.rgb : '255, 150, 40' });
      for (let i = 0; i < 8 * n; i++) addPart({ kind: 'smoke', x: b.x + rnd(-10, 10), y: b.y, vx: rnd(-40, 40), vy: rnd(-90, -30), life: rnd(.5, .8), size: rnd(8, 14), grow: 1.4, rgb: '18, 4, 6', alpha: .8 });
    },
    oat(b, p, heavy) { // ระเบิดหนามคอมิก + คำอุทาน
      const { addDraw, addPart, starPath } = F(), n = amount(), R = heavy ? 46 : 34, word = ['POW!', 'BAM!', 'ปั้ง!', 'WHAM!'][Math.floor(rnd(0, 4))], rot = rnd(-.3, .3);
      addDraw({ life: .3, draw(g, k) {
        const s = k < .25 ? k / .25 * 1.15 : 1.15 - (k - .25) * .2;
        g.globalAlpha = 1 - Math.max(0, (k - .6) / .4); g.translate(b.x, b.y); g.rotate(rot); g.scale(s, s);
        starPath(g, R, 10, .62); g.fillStyle = p.glow; g.fill(); g.lineWidth = 3; g.strokeStyle = '#1a0010'; g.lineJoin = 'round'; g.stroke();
        g.font = `900 ${Math.round(R * .5)}px system-ui, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
        g.lineWidth = 4; g.strokeText(word, 0, 1); g.fillStyle = '#fff'; g.fillText(word, 0, 1);
      } });
      for (let i = 0; i < 10 * n; i++) { const ang = rnd(0, Math.PI * 2), v = rnd(160, 320); addPart({ kind: 'star', x: b.x, y: b.y, vx: Math.cos(ang) * v, vy: Math.sin(ang) * v, drag: 3, life: rnd(.3, .5), size: rnd(4, 7), fill: OAT_COLORS[i % OAT_COLORS.length], rot: rnd(0, 6), vr: rnd(-8, 8) }); }
    },
  };

  function strike(deck, a, b, heavy) {
    if (!F() || reduce()) return false;
    const p = PAL[deck] || PAL.jit;
    try { (TRAILS[deck] || TRAILS.jit)(a, b, p); F().kick(); later(100, () => { (HITS[deck] || HITS.jit)(b, p, heavy); F().kick(); }); }
    catch (e) { console.warn('[deck-fx]', e); return false; }
    return true;
  }

  // ---------- ใช้สกิล ----------
  const SKILL_PARTS = {
    jit(c, p, n, { addDraw, addPart, jagged, strokeBolt }) {
      for (let i = 0; i < 3; i++) {
        addDraw({ life: .3, delay: i * .1, draw(g, k) {
          if (Math.random() < .3) return;
          const x1 = c.l + rnd(0, c.w), y1 = c.t + rnd(0, c.h), x2 = c.l + rnd(0, c.w), y2 = c.t + rnd(0, c.h);
          g.globalCompositeOperation = 'lighter'; g.globalAlpha = 1 - k; strokeBolt(g, jagged(x1, y1, x2, y2, 6, 8), p.core, 1.5, p.glow);
        } });
      }
      for (let i = 0; i < 14 * n; i++) addPart({ kind: 'streak', x: c.l + rnd(0, c.w), y: c.t + c.h, vx: rnd(-20, 20), vy: rnd(-380, -180), drag: 2.5, life: rnd(.3, .5), size: rnd(1.2, 2), rgb: '200, 255, 225' });
    },
    nuea(c, p, n, { addPart }) {
      for (let i = 0; i < 16 * n; i++) addPart({ kind: 'streak', x: c.l + rnd(0, c.w), y: c.t + c.h * rnd(.5, 1), vx: rnd(-30, 30), vy: rnd(-320, -140), drag: 2, life: rnd(.3, .55), size: rnd(1.2, 2.2), rgb: '255, 205, 120' });
      for (let i = 0; i < 6 * n; i++) addPart({ kind: 'shred', x: c.cx + rnd(-c.w * .4, c.w * .4), y: c.t + c.h * .3, vx: rnd(-80, 80), vy: rnd(-160, -60), g: 220, life: rnd(.5, .8), size: rnd(4, 6), fill: ['#d33', '#f28c28', '#f6e7c8'][i % 3], rot: rnd(0, 6), vr: rnd(-6, 6), wob: rnd(0, 6) });
    },
    doom(c, p, n, { addPart, shockwave }) {
      shockwave(c.cx, c.cy, c.R * 1.5, c.R * .2, p.gold, .45, 2.5, .05);
      for (let i = 0; i < 16 * n; i++) { const ang = rnd(0, Math.PI * 2), r = c.R * rnd(1, 1.6); addPart({ kind: 'glow', x: c.cx + Math.cos(ang) * r, y: c.cy + Math.sin(ang) * r, vx: 0, vy: 0, pull: { x: c.cx, y: c.cy, k: 12 }, life: rnd(.35, .55), size: rnd(2.5, 4.5), rgb: Math.random() < .5 ? p.rgb : p.gold }); }
    },
    dino(c, p, n, { addPart }) {
      for (let i = 0; i < 14 * n; i++) addPart({ kind: 'chip', x: c.l + rnd(0, c.w), y: c.t + c.h, vx: rnd(-90, 90), vy: rnd(-320, -140), g: 900, life: rnd(.4, .7), size: rnd(1.6, 3.2), fill: 'rgb(150, 92, 30)', edge: 'rgba(255, 190, 90, .9)', rot: rnd(0, 6), vr: rnd(-10, 10) });
      for (let i = 0; i < 5 * n; i++) addPart({ kind: 'smoke', x: c.l + rnd(0, c.w), y: c.t + c.h, vx: rnd(-40, 40), vy: rnd(-40, -10), life: rnd(.5, .8), size: rnd(8, 13), grow: 1.3, rgb: '170, 120, 60', alpha: .6 });
    },
    demon(c, p, n, { addPart }) {
      for (let i = 0; i < 18 * n; i++) addPart({ kind: 'glow', x: c.l + rnd(0, c.w), y: c.t + c.h * rnd(.6, 1), vx: rnd(-20, 20), vy: rnd(-200, -80), wob: rnd(0, 6), life: rnd(.4, .7), size: rnd(2.5, 5), shrink: .5, rgb: Math.random() < .6 ? p.rgb : '255, 150, 40' });
      for (let i = 0; i < 5 * n; i++) addPart({ kind: 'smoke', x: c.l + rnd(0, c.w), y: c.t + c.h, vx: rnd(-20, 20), vy: rnd(-80, -30), life: rnd(.5, .8), size: rnd(8, 13), grow: 1.3, rgb: '18, 4, 6', alpha: .7 });
    },
    oat(c, p, n, { addPart }) {
      for (let i = 0; i < 12 * n; i++) { const ang = rnd(0, Math.PI * 2), v = rnd(120, 260); addPart({ kind: 'star', x: c.cx, y: c.cy, vx: Math.cos(ang) * v, vy: Math.sin(ang) * v, drag: 2.5, life: rnd(.4, .6), size: rnd(4, 7), fill: OAT_COLORS[i % OAT_COLORS.length], rot: rnd(0, 6), vr: rnd(-8, 8) }); }
    },
  };

  function skill(el, deck) {
    const r = el && el.getBoundingClientRect();
    if (!r || !r.width || !F()) return;
    const p = PAL[deck] || PAL.jit;
    el.style.setProperty('--dfx-c', p.glow);
    el.classList.remove('dfx-skill'); void el.offsetWidth; el.classList.add('dfx-skill');
    later(700, () => el.classList.remove('dfx-skill'));
    if (reduce()) return;
    const fx = F(), n = amount();
    const c = { l: r.left, t: r.top, w: r.width, h: r.height, cx: r.left + r.width / 2, cy: r.top + r.height / 2, R: Math.max(r.width, r.height) / 2 };
    fx.flash(c.cx, c.cy, c.R * 1.4, p.rgb, .35);
    fx.shockwave(c.cx, c.cy, c.R * .5, c.R * 1.8, p.rgb, .45, 4);
    try { (SKILL_PARTS[deck] || SKILL_PARTS.jit)(c, p, n, fx); } catch (e) { console.warn('[deck-fx]', e); }
    fx.kick();
  }

  // ---------- พลังเปลี่ยน / ฟื้น HP ----------
  function popText(r, text, cls, y) {
    const d = document.createElement('div');
    d.className = 'dfx-pop ' + cls; d.textContent = text; document.body.appendChild(d);
    d.style.left = (r.left + r.width / 2) + 'px'; d.style.top = (r.top + r.height * y) + 'px';
    const anim = reduce()
      ? d.animate([{ opacity: 1 }, { opacity: 1, offset: .7 }, { opacity: 0 }], { duration: 900 })
      : d.animate([
        { transform: 'translate(-50%,-50%) scale(.3)', opacity: 0 },
        { transform: 'translate(-50%,-50%) scale(1.3)', opacity: 1, offset: .15 },
        { transform: 'translate(-50%,-50%) scale(1)', opacity: 1, offset: .35 },
        { transform: 'translate(-50%,-90%) scale(1)', opacity: 0 },
      ], { duration: 1000, easing: 'ease-out' });
    anim.onfinish = () => d.remove();
    setTimeout(() => d.remove(), 1500); // กันค้างถ้าแท็บถูกซ่อน
  }
  // ลูกศรบั้ง 3 อันลอยขึ้น (บัฟ) หรือตกลง (ดีบัฟ) บนตัวการ์ด
  function chevrons(r, up) {
    if (reduce() || !F()) return;
    const col = up ? '94, 242, 160' : '255, 93, 115', cx = r.left + r.width / 2, s = Math.min(r.width * .22, 22);
    [0, 1, 2].forEach(i => F().addDraw({ life: .6, delay: i * .08, draw(g, k) {
      const y = r.top + r.height * (up ? .75 - k * .5 : .25 + k * .5);
      g.globalCompositeOperation = 'lighter'; g.globalAlpha = Math.sin(k * Math.PI);
      g.strokeStyle = `rgb(${col})`; g.shadowColor = `rgb(${col})`; g.shadowBlur = 10; g.lineWidth = 4; g.lineCap = 'round'; g.lineJoin = 'round';
      const d = up ? -s * .55 : s * .55;
      g.beginPath(); g.moveTo(cx - s, y - d); g.lineTo(cx, y); g.lineTo(cx + s, y - d); g.stroke();
    } }));
  }
  function heal(r) {
    if (reduce() || !F()) return;
    const fx = F(), cx = r.left + r.width / 2, cy = r.top + r.height / 2, n = amount();
    fx.flash(cx, cy, Math.max(r.width, r.height) * .8, '94, 242, 160', .45);
    for (let i = 0; i < 12 * n; i++) fx.addPart({ kind: 'star', x: r.left + rnd(0, r.width), y: r.top + r.height * rnd(.4, 1), vx: rnd(-15, 15), vy: rnd(-120, -50), life: rnd(.5, .8), size: rnd(4, 6.5), points: 4, inner: .28, fill: '#5ef2a0', edge: '#e9fff3', edgeW: 1, rot: 0 });
    fx.kick();
  }

  let prev = null;
  function diff() {
    if (typeof gameState === 'undefined' || typeof getSlotElement !== 'function' || typeof getEffectivePower !== 'function') return;
    const P = gameState.player, A = gameState.ai;
    if (!P || !A || !P.board || !A.board || !P.leader || !A.leader) { prev = null; return; }
    const cur = { P, A, pw: {}, hp: [P.leader.hp, A.leader.hp] };
    [[P, true], [A, false]].forEach(([side, isP]) => side.board.forEach((m, i) => {
      if (m) cur.pw[m.uid] = { v: getEffectivePower(m, side), isP, i };
    }));
    // แมตช์ใหม่ = ผู้เล่นเป็นอ็อบเจ็กต์ใหม่ → เริ่มนับใหม่ ไม่เด้งว่าฟื้น HP / บัฟ
    if (prev && prev.P === P && prev.A === A) {
      Object.keys(cur.pw).forEach(uid => {
        const was = prev.pw[uid], now = cur.pw[uid];
        if (!was || was.v === now.v) return;
        const slot = getSlotElement(now.isP, now.i), el = slot && (slot.querySelector('.card') || slot);
        const r = el && el.getBoundingClientRect();
        if (!r || !r.width) return;
        const d = now.v - was.v;
        popText(r, (d > 0 ? '+' : '') + d, d > 0 ? 'is-up' : 'is-down', .22);
        chevrons(r, d > 0);
      });
      [true, false].forEach((isP, j) => {
        const d = cur.hp[j] - prev.hp[j];
        if (d <= 0) return; // เสีย HP ใช้ BOFFX.damage อยู่แล้ว
        const el = getSlotElement(isP, 'leader'), r = el && el.getBoundingClientRect();
        if (!r || !r.width) return;
        popText(r, '+' + d, 'is-heal', .58);
        heal(r);
      });
    }
    prev = cur;
  }

  window.DeckFx = { strike, skill, diff, PAL };
})();
