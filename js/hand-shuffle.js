// สับไพ่ในมือแบบ overhand ตอนเริ่มเทิร์น (ตัววางแผนเป็นฟังก์ชันบริสุทธิ์ ไม่แตะ DOM)
(function () {
  'use strict';

  const HandShuffle = {
    CUTS: 3,
    SPEED: 1.5,
    STORE_KEY: 'bof_hand_shuffle',
  };

  // ดัชนี 0 = ซ้ายสุด = หลังสุดของกอง
  // แต่ละรอบ: ดึงก้อนติดกัน k ใบ (จากหลังสุดด้วยโอกาส 0.75 ไม่งั้นจากจุดสุ่ม) แล้วสอดกลับที่ความลึกสุ่ม `to`
  // ในกองที่เหลือ โดย `to !== from` เสมอ (ไม่งั้นได้กองเดิม) — จึงไม่ใช่แค่การหมุนกอง
  function planOnce(n, cuts, rng) {
    let cur = Array.from({ length: n }, (_, i) => i);
    const out = [];
    for (let i = 0; i < cuts; i++) {
      const k = Math.min(1 + Math.floor(rng() * 3), n - 1);
      const from = rng() < 0.75 ? 0 : Math.floor(rng() * (n - k + 1));
      const packet = cur.slice(from, from + k);
      const rest = cur.slice(0, from).concat(cur.slice(from + k));
      // เลือก to จาก 0..rest.length ยกเว้น from
      const r = Math.floor(rng() * rest.length);
      const to = r >= from ? r + 1 : r;
      const after = rest.slice(0, to).concat(packet, rest.slice(to));
      out.push({ packet, from, to, fromBack: from === 0, after: after.slice() });
      cur = after;
    }
    return { cuts: out, perm: cur };
  }

  HandShuffle.plan = function (n, cuts, rng) {
    if (!(n >= 2)) return null;
    if (cuts === undefined) cuts = HandShuffle.CUTS;
    if (!rng) rng = Math.random;
    const need = Math.min(3, n);
    let p = null;
    for (let t = 0; t < 50; t++) {
      p = planOnce(n, cuts, rng);
      let moved = 0;
      for (let s = 0; s < n; s++) if (p.perm[s] !== s) moved++;
      if (moved >= need) break;
    }
    return p;
  };

  // ---------- แอนิเมชันในเกม (Web Animations API, transform/opacity เท่านั้น) ----------
  // เวลาที่ความเร็ว ×1 (หารด้วย SPEED ตอนเล่น)
  const T = {
    gather: 320, gatherStagger: 30,
    cut: 210, cutStagger: 18,
    land: 200, squash: 110,
    spread: 500, spreadStagger: 50, spreadStaggerMax: 300,
    fade: 180,
  };
  const PILE_DX = 9, PILE_ROT = 3.5, PILE_CURVE = 2, TIGHT_DX = 6;
  const EASE = 'cubic-bezier(.25,.7,.3,1)';
  const EASE_LAND = 'cubic-bezier(.3,1.45,.5,1)';

  let active = null; // { skip(), done: Promise }

  // Task 3 แทนที่ด้วยค่าจาก localStorage
  HandShuffle.enabled = function () { return true; };
  HandShuffle.isBusy = function () { return !!active; };
  HandShuffle.skip = function () { if (active) active.skip(); };

  const reducedMotion = () => !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const pose = (x, y, r, ry, sx, sy) => ({ x, y, r: r || 0, ry: ry || 0, sx: sx === undefined ? 1 : sx, sy: sy === undefined ? (sx === undefined ? 1 : sx) : sy });
  const with_ = (p, o) => Object.assign({}, p, o);
  // ลำดับฟังก์ชันเหมือนกันทุกคีย์เฟรม เพื่อให้ interpolate ทีละตัวได้
  const tf = p => `translate(${p.x.toFixed(2)}px, ${p.y.toFixed(2)}px) rotate(${p.r.toFixed(2)}deg) rotateY(${p.ry.toFixed(2)}deg) scale(${p.sx}, ${p.sy})`;

  HandShuffle.run = async function (hand) {
    if (active) { active.skip(); await active.done; }
    const plan = HandShuffle.plan(hand.length);
    if (!plan) return;
    const handEl = document.getElementById('player-hand');
    const els = handEl ? Array.from(handEl.querySelectorAll('.card')) : [];
    const orig = hand.slice();
    // ตรรกะเกมได้ลำดับใหม่ทันที ก่อนผู้เล่นกดอะไรได้
    plan.perm.forEach((o, s) => { hand[s] = orig[o]; });
    if (els.length !== orig.length) { if (typeof renderGame === 'function') renderGame(); return; }

    const n = els.length;
    const anims = [];
    let stopped = false, resolveStop, resolveDone;
    const stopP = new Promise(r => { resolveStop = r; });
    const done = new Promise(r => { resolveDone = r; });
    const halt = () => { if (!stopped) { stopped = true; resolveStop(); } };
    const me = {
      done,
      skip() { halt(); anims.forEach(a => { try { a.finish(); } catch (e) { /* ไม่มีผล */ } }); },
    };
    const body = document.body;
    let obs = null, skipEl = null;

    const alive = () => !stopped && !(typeof gameState !== 'undefined' && gameState && gameState.gameOver) && els.every(e => e.isConnected);
    const D = ms => (stopped ? 1 : ms / HandShuffle.SPEED);
    const wait = list => Promise.race([Promise.all(list.map(a => a.finished.catch(() => {}))), stopP]);
    const play = (el, frames, ms, delay, easing) => {
      const a = el.animate(frames.map(f => {
        const k = { transform: tf(f.p) };
        if (f.o !== undefined) k.offset = f.o;
        if (f.e) k.easing = f.e;
        return k;
      }), { duration: D(ms), delay: stopped ? 0 : (delay || 0) / HandShuffle.SPEED, easing: easing || 'linear', fill: 'forwards' });
      anims.push(a);
      return a;
    };

    try {
      active = me;

      // มีการวาดมือใหม่จากที่อื่น → ยุติทันที
      obs = new MutationObserver(halt);
      obs.observe(handEl, { childList: true });

      body.classList.add('hs-busy');
      skipEl = document.createElement('div');
      skipEl.id = 'hs-skip';
      skipEl.title = 'แตะเพื่อข้าม';
      skipEl.addEventListener('click', e => { e.stopPropagation(); HandShuffle.skip(); });
      (handEl.parentElement || body).appendChild(skipEl);
      skipEl.style.left = handEl.offsetLeft + 'px';
      skipEl.style.top = handEl.offsetTop + 'px';
      skipEl.style.width = handEl.offsetWidth + 'px';
      skipEl.style.height = handEl.offsetHeight + 'px';

      if (reducedMotion()) {
        // ไม่เคลื่อนที่: จางลง → แสดงลำดับใหม่ → กลับมาชัด
        const half = T.fade / 2;
        const out = els.map(el => { const a = el.animate([{ opacity: 1 }, { opacity: 0.35 }], { duration: stopped ? 1 : half, fill: 'forwards' }); anims.push(a); return a; });
        await wait(out);
        if (!alive()) return;
        obs.disconnect();
        renderGame();
        const fresh = Array.from(handEl.querySelectorAll('.card'));
        const back = fresh.map(el => { const a = el.animate([{ opacity: 0.35 }, { opacity: 1 }], { duration: stopped ? 1 : half }); anims.push(a); return a; });
        await wait(back);
        return;
      }

      // วัดกล่องของแต่ละใบในสภาพเป็นกลาง (hs-busy ปิด transition/ยก/เอียง)
      const H = handEl.getBoundingClientRect();
      const R = els.map(e => { const r = e.getBoundingClientRect(); return { cx: r.left + r.width / 2, cy: r.top + r.height / 2 }; });
      const cx0 = H.left + H.width / 2, cy0 = H.top + H.height / 2;
      const pileAt = (i, p, m, dx) => {
        const o = p - (m - 1) / 2;
        return pose(cx0 + o * dx - R[i].cx, cy0 + Math.abs(o) * PILE_CURVE - R[i].cy, o * PILE_ROT);
      };
      const cur = els.map(() => pose(0, 0));
      const setZ = order => order.forEach((i, p) => { els[i].style.zIndex = String(p + 1); });

      // 1) รวบ: ลอยเป็นโค้งเข้ากองพัดแน่นกลางมือ
      let order = els.map((_, i) => i);
      setZ(order);
      const g = order.map((i, p) => {
        const a = cur[i], b = pileAt(i, p, n, PILE_DX);
        const mid = pose((a.x + b.x) / 2, Math.min(a.y, b.y) - 34, (a.r + b.r) / 2, 0, 1.03);
        cur[i] = b;
        return play(els[i], [
          { p: a, e: 'cubic-bezier(.3,.6,.4,1)' },
          { p: mid, o: 0.5, e: 'cubic-bezier(.5,0,.5,1)' },
          { p: b },
        ], T.gather, p * T.gatherStagger, EASE);
      });
      await wait(g);
      if (!alive()) return;

      // 2) ตัด ×3
      for (const cut of plan.cuts) {
        const k = cut.packet.length;
        const dir = cut.fromBack ? 1 : -1;
        const inPacket = new Set(cut.packet);
        const rest = order.filter(i => !inPacket.has(i));
        const pull = cut.packet.map((i, j) => {
          const a = cur[i];
          const nudge = with_(a, { x: a.x - dir * 8 });
          const apex = pose(a.x + dir * (120 + 7 * j), a.y - (40 + 3 * j), a.r + dir * (12 + 3 * j), -dir * 26, 1.04);
          cur[i] = apex;
          return play(els[i], [
            { p: a, e: 'ease-out' },
            { p: nudge, o: 0.22, e: 'cubic-bezier(.2,.7,.3,1)' },
            { p: apex },
          ], T.cut, j * T.cutStagger);
        });
        const close = rest.map((i, q) => {
          const a = cur[i], b = pileAt(i, q, rest.length, TIGHT_DX);
          cur[i] = b;
          return play(els[i], [{ p: a }, { p: b }], T.cut, 0, EASE);
        });
        await wait(pull.concat(close));
        if (!alive()) return;

        // จุดสูงสุด: ก้อนสลับหน้า/หลัง แล้ววางลงกองใหม่แบบเด้ง
        order = cut.after.slice();
        setZ(order);
        const land = order.map((i, s) => {
          const a = cur[i], b = pileAt(i, s, n, PILE_DX);
          cur[i] = b;
          return play(els[i], [{ p: a }, { p: b }], T.land, 0, inPacket.has(i) ? EASE_LAND : EASE);
        });
        await wait(land);
        if (!alive()) return;

        // กองยุบเล็กน้อย
        const squash = order.map(i => {
          const a = cur[i];
          return play(els[i], [{ p: a }, { p: with_(a, { y: a.y + 2, sx: 1.01, sy: 0.95 }), o: 0.45 }, { p: a }], T.squash, 0, 'ease-in-out');
        });
        await wait(squash);
        if (!alive()) return;
      }

      // 3) คลี่: แต่ละใบโค้งไปช่องใหม่ แล้วส่ายเข้าที่
      const slotOf = [];
      plan.perm.forEach((o, s) => { slotOf[o] = s; });
      const stagger = n > 1 ? Math.min(T.spreadStagger, T.spreadStaggerMax / (n - 1)) : 0;
      setZ(plan.perm);
      const spread = plan.perm.map((i, s) => {
        const a = cur[i];
        const b = pose(R[s].cx - R[i].cx, R[s].cy - R[i].cy);
        const side = b.x >= a.x ? 1 : -1;
        cur[i] = b;
        return play(els[i], [
          { p: a },
          { p: pose((a.x + b.x) / 2, Math.min(a.y, b.y) - 30, a.r / 2 + side * 6), o: 0.5 },
          { p: with_(b, { y: b.y + 4, r: -side * 1.5 }), o: 0.78 },
          { p: with_(b, { y: b.y - 1.5, r: side * 0.6 }), o: 0.9 },
          { p: b },
        ], T.spread, s * stagger, EASE);
      });
      await wait(spread);
    } finally {
      if (obs) obs.disconnect();
      anims.forEach(a => { try { a.cancel(); } catch (e) { /* ไม่มีผล */ } });
      els.forEach(e => { e.style.zIndex = ''; });
      body.classList.remove('hs-busy');
      if (skipEl) skipEl.remove();
      if (active === me) active = null;
      // วาดใหม่ตามลำดับใหม่ (ถ้ามีคนวาดไปแล้ว การ์ดเดิมจะหลุดจาก DOM)
      try {
        if (els.every(e => e.isConnected) && typeof renderGame === 'function') renderGame();
      } finally {
        resolveDone();
      }
    }
  };

  window.HandShuffle = HandShuffle;
})();
