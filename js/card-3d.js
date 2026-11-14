/* ============================================================================
   BOF CARD 3D (หน้าตาเท่านั้น · โหลดหลัง holo.js และ bof-fx.js)
   - การ์ดบนสนาม + Leader: เอียง 3D ตามเมาส์ (PC) ยกตัวขึ้นมีเงาตก · การ์ด Rest (หมุน 90°) ไม่เอียง
   - มือถือ: แตะค้างการ์ดบนสนาม = เอียงเข้าหานิ้วเล็กน้อย (บนมือไม่ทำ เพราะแถวมือต้องเลื่อน/ลากการ์ด)
   - คู่แข่งลงการ์ดใหม่บนสนาม = พลิกจากหลังการ์ดเป็นหน้าการ์ด (BOFFX.flip)
   การ์ดที่จั่วเข้ามือพลิกใน holo.js (ตัวเดียวกับแอนิเมชันบินเข้ามือ)
   ============================================================================ */
(function () {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const BOARD = '.board-slots .card:not(.Rest), .leader-card-slot > .card';
  const arena = document.getElementById('bof-game-arena');

  // PC: ใช้ระบบเอียงเดิมของ holo.js (rAF, อ่านก่อนเขียน, ข้ามเมื่อเปิด Inspect)
  if (window.HoloTilt && arena) HoloTilt.bind(arena, 9, BOARD);

  // มือถือ: แตะค้าง → เอียงเข้าหาจุดที่แตะ · ยกนิ้ว/เลื่อน → คืนท่า
  if (!reduce && arena) {
    let held = null;
    const release = () => {
      if (!held) return;
      const el = held; held = null;
      el.classList.remove('holo-live', 'c3d-press');
      ['--rx', '--ry'].forEach(p => el.style.removeProperty(p));
    };
    arena.addEventListener('pointerdown', e => {
      if (e.pointerType !== 'touch' || document.body.classList.contains('cd-dragging')) return;
      const el = e.target.closest(BOARD);
      if (!el) return;
      release();
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - .5, py = (e.clientY - r.top) / r.height - .5;
      // เอียงให้ด้านที่นิ้วกด "ยุบลง" เหมือนกดบนการ์ดจริง (rotateY บวก = ขอบขวาจมลง, rotateX บวก = ขอบบนจมลง)
      el.style.setProperty('--ry', (px * 16).toFixed(1) + 'deg');
      el.style.setProperty('--rx', (py * -16).toFixed(1) + 'deg');
      el.classList.add('holo-live', 'c3d-press');
      held = el;
    }, { passive: true });
    ['pointerup', 'pointercancel'].forEach(t => addEventListener(t, release, { passive: true }));
  }

  // คู่แข่งลงการ์ดใหม่: พลิกเปิด (ห่อ renderGame ต่อจาก holo.js; ไม่แตะตรรกะเกม)
  let prevAi = null;
  const origRender = window.renderGame;
  if (typeof origRender === 'function') {
    window.renderGame = function () {
      const r = origRender.apply(this, arguments);
      try {
        const ai = typeof gameState !== 'undefined' && gameState && gameState.ai;
        if (ai && Array.isArray(ai.board)) {
          const uids = ai.board.map(m => (m ? m.uid : null));
          if (prevAi && window.BOFFX && BOFFX.flip) {
            const slots = document.querySelectorAll('#ai-board .slot');
            uids.forEach((u, i) => {
              if (u == null || prevAi.includes(u)) return;
              const card = slots[i] && slots[i].querySelector('.card');
              // เริ่มหลังเปลือกแสงของ SummonFx (ซ่อนการ์ด 160ms): เปลือกแสง → เห็นหลังการ์ด → พลิกเปิด
              if (card) BOFFX.flip(card, { lift: 14, dur: .52, delay: .17 });
            });
          }
          prevAi = uids;
        }
      } catch (e) { console.warn('[card-3d]', e); }
      return r;
    };
  }
})();
