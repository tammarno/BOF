// เอฟเฟคการ์ดลงสนาม: เปลือกแสง → แตกเป็นเศษกระจกโฮโล แรงขึ้นตามระดับความแรร์
// ชิ้นเอฟเฟคอยู่ในเลเยอร์ลอย #summon-fx-layer (พิกัดจอ) จึงไม่ถูกลบตอน renderGame() สร้างช่องใหม่
(function () {
  'use strict';

  const TIER = {
    N: { shards: 8, dist: 70, shake: 0, sparks: 0 },
    R: { shards: 14, dist: 100, shake: 2, sparks: 6 },
    SR: { shards: 22, dist: 140, shake: 4, sparks: 12, rainbow: true, sweep: true },
    Legend: { shards: 34, dist: 220, shake: 7, sparks: 24, rainbow: true, sweep: true, prism: true },
  };
  const COLOR_VAR = { N: '--rar-n', R: '--rar-r', SR: '--rar-sr', Legend: '--rar-legend' };
  const T = { shell: 160, flash: 450, shardMin: 500, shardMax: 900, shake: 220, sweep: 650, reduced: 200, failsafe: 1600 };
  const COARSE_FACTOR = 0.6;

  const SummonFx = { TIER, MAX_PIECES: 90 };
  let layer = null;

  const reducedMotion = () => !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const coarse = () => !!(window.matchMedia && window.matchMedia('(pointer: coarse)').matches) || window.innerWidth < 768;
  const rnd = (a, b) => a + Math.random() * (b - a);

  SummonFx.layer = function () {
    if (!layer || !layer.isConnected) {
      layer = document.createElement('div');
      layer.id = 'summon-fx-layer';
      document.body.appendChild(layer);
    }
    return layer;
  };
  SummonFx.activeCount = function () { return layer ? layer.childElementCount : 0; };

  // สร้างชิ้นกึ่งกลางที่ (x, y) พิกัดจอ; เกินเพดานคืน null
  function spawn(cls, x, y, w, h, style) {
    const L = SummonFx.layer();
    if (L.childElementCount >= SummonFx.MAX_PIECES) return null;
    const el = document.createElement('i');
    el.className = cls;
    el.style.cssText = `left:${x - w / 2}px;top:${y - h / 2}px;width:${w}px;height:${h}px;`;
    if (style) Object.assign(el.style, style);
    L.appendChild(el);
    setTimeout(() => el.remove(), T.failsafe);
    return el;
  }
  // เล่นแล้วลบตัวเองเมื่อจบ
  function play(el, frames, opt) {
    if (!el) return null;
    const a = el.animate(frames, Object.assign({ fill: 'forwards' }, opt));
    a.onfinish = () => el.remove();
    return a;
  }

  function shake(px) {
    const f = [];
    for (let i = 0; i <= 8; i++) { const k = px * (1 - i / 8); f.push({ transform: `translate(${rnd(-k, k)}px, ${rnd(-k, k)}px)` }); }
    f[f.length - 1] = { transform: 'none' };
    ['ai-board', 'player-board'].forEach(id => { const b = document.getElementById(id); if (b) b.animate(f, { duration: T.shake }); });
  }

  function shatter(r, color, rect, cardEl) {
    const tier = TIER[r];
    const k = coarse() ? COARSE_FACTOR : 1;
    const x = rect.left + rect.width / 2, y = rect.top + rect.height / 2, w = rect.width, h = rect.height;
    const img = cardEl.querySelector('.card-art img');
    const art = img && img.src ? `url("${img.src}")` : 'none';

    cardEl.animate([{ filter: 'brightness(2.5)' }, { filter: 'brightness(1)' }], { duration: T.flash, easing: 'ease-out' });
    if (tier.shake) shake(tier.shake);

    const n = Math.round(tier.shards * k);
    for (let i = 0; i < n; i++) {
      const sw = rnd(w * 0.12, w * 0.26), sh = rnd(h * 0.09, h * 0.22);
      const sx = x + rnd(-w / 2 + sw / 2, w / 2 - sw / 2), sy = y + rnd(-h / 2 + sh / 2, h / 2 - sh / 2);
      const s = spawn('sfx-shard', sx, sy, sw, sh, {
        clipPath: `polygon(${rnd(0, 40)}% 0, 100% ${rnd(0, 50)}%, ${rnd(40, 100)}% 100%, 0 ${rnd(30, 90)}%)`,
        backgroundColor: color,
        backgroundImage: art,
        backgroundSize: `${w}px ${h}px`,
        backgroundPosition: `${-(sx - sw / 2 - (x - w / 2))}px ${-(sy - sh / 2 - (y - h / 2))}px`,
        filter: tier.rainbow ? `hue-rotate(${Math.round(rnd(0, 360))}deg) saturate(2) brightness(1.4)` : 'brightness(1.6)',
        '--c': color,
      });
      if (!s) break;
      const a = Math.atan2(sy - y, sx - x) + rnd(-0.4, 0.4), d = rnd(tier.dist * 0.5, tier.dist);
      play(s, [
        { transform: 'translate(0, 0) rotate(0deg)', opacity: 1 },
        { transform: `translate(${Math.cos(a) * d}px, ${Math.sin(a) * d + 30}px) rotate(${rnd(-300, 300)}deg) scale(.4)`, opacity: 0 },
      ], { duration: rnd(T.shardMin, T.shardMax), easing: 'cubic-bezier(.15,.7,.4,1)' });
    }

    const sparks = Math.round(tier.sparks * k);
    for (let i = 0; i < sparks; i++) {
      const sz = rnd(3, 6);
      const s = spawn('sfx-spark', x, y, sz, sz, { '--c': '#fff' });
      if (!s) break;
      const a = rnd(0, Math.PI * 2), d = rnd(tier.dist * 0.4, tier.dist);
      play(s, [
        { transform: 'translate(0, 0) scale(1)', opacity: 1 },
        { transform: `translate(${Math.cos(a) * d}px, ${Math.sin(a) * d + 10}px) scale(.2)`, opacity: 0 },
      ], { duration: rnd(420, 720), delay: rnd(0, 60), easing: 'cubic-bezier(.1,.8,.3,1)' });
    }

    if (tier.sweep) {
      // แสงกวาดผ่านการ์ด: เกาะการ์ดจริง ถ้าถูกวาดใหม่ก็หายไปพร้อมการ์ด
      const g = document.createElement('i');
      g.className = 'sfx-sweep';
      cardEl.appendChild(g);
      play(g, [{ transform: 'translateX(-120%)' }, { transform: 'translateX(120%)' }], { duration: T.sweep, delay: 120, easing: 'ease-in-out' });
    }

    if (tier.prism) {
      play(spawn('sfx-prism', x, y, 60, 60), [
        { transform: 'scale(.5) rotate(0deg)', opacity: 1 },
        { transform: 'scale(6) rotate(90deg)', opacity: 0 },
      ], { duration: 900, easing: 'cubic-bezier(.2,.7,.3,1)' });
      for (let i = 0; i < 4; i++) {
        play(spawn('sfx-ray', x, y, 6, 260, { '--c': color }), [
          { transform: `rotate(${i * 45}deg) scaleY(0)`, opacity: 1 },
          { transform: `rotate(${i * 45}deg) scaleY(1.4)`, opacity: 0 },
        ], { duration: 700, easing: 'ease-out' });
      }
      play(spawn('sfx-flash', x, y, 420, 420, { '--c': color }), [{ opacity: 0.7 }, { opacity: 0 }], { duration: 600, easing: 'ease-out' });
      const st = spawn('sfx-stamp', x, y - 70, 220, 40, { '--c': color });
      if (st) {
        st.textContent = 'LEGEND';
        play(st, [
          { transform: 'scale(2.4)', opacity: 0 },
          { transform: 'scale(.95)', opacity: 1, offset: 0.25 },
          { transform: 'scale(1)', opacity: 1, offset: 0.75 },
          { transform: 'scale(1.05) translateY(-8px)', opacity: 0 },
        ], { duration: 1300, easing: 'cubic-bezier(.2,.8,.3,1)' });
      }
    }
  }

  SummonFx.play = function (slotEl, cardEl) {
    if (!slotEl || !cardEl || !cardEl.isConnected) return;
    const r = TIER[cardEl.dataset.rarity] ? cardEl.dataset.rarity : 'N';
    const color = getComputedStyle(document.documentElement).getPropertyValue(COLOR_VAR[r]).trim() || '#8f97b8';

    if (reducedMotion()) {
      cardEl.animate([
        { opacity: 0, boxShadow: `0 0 0 2px ${color}, 0 0 18px ${color}` },
        { opacity: 1, boxShadow: `0 0 0 2px ${color}, 0 0 18px ${color}` },
      ], { duration: T.reduced, easing: 'ease-out' });
      return;
    }

    const rect = cardEl.getBoundingClientRect();
    const shell = spawn('sfx-shell', rect.left + rect.width / 2, rect.top + rect.height / 2, rect.width, rect.height, { '--c': color });
    if (!shell) { shatter(r, color, rect, cardEl); return; }
    cardEl.style.opacity = '0';
    const a = shell.animate([{ opacity: 0, transform: 'scale(1.25)' }, { opacity: 1, transform: 'scale(1)' }], { duration: T.shell, easing: 'ease-in', fill: 'forwards' });
    a.onfinish = () => {
      shell.remove();
      cardEl.style.opacity = '';
      // การ์ดอาจถูกวาดใหม่ไปแล้ว: เศษยังเล่นตามพิกัดเดิม ส่วนแสงบนการ์ดเก่าไม่มีผล
      shatter(r, color, rect, cardEl);
    };
  };

  window.SummonFx = SummonFx;
})();
