// สับไพ่ในมือแบบ overhand ตอนเริ่มเทิร์น (ตัววางแผนเป็นฟังก์ชันบริสุทธิ์ ไม่แตะ DOM)
(function () {
  'use strict';

  const HandShuffle = {
    CUTS: 3,
    SPEED: 1.5,
    STORE_KEY: 'bof_hand_shuffle',
  };

  // ดัชนี 0 = ซ้ายสุด = หลังสุดของกอง
  // fromBack: ดึงก้อนหลัง (หัวอาร์เรย์) ไปไว้หน้า (ท้ายอาร์เรย์); ไม่งั้นดึงก้อนหน้าไปไว้หลัง
  function planOnce(n, cuts, rng) {
    let cur = Array.from({ length: n }, (_, i) => i);
    const out = [];
    for (let i = 0; i < cuts; i++) {
      const k = Math.min(1 + Math.floor(rng() * 3), n - 1);
      const fromBack = rng() < 0.75;
      let packet, after;
      if (fromBack) {
        packet = cur.slice(0, k);
        after = cur.slice(k).concat(packet);
      } else {
        packet = cur.slice(n - k);
        after = packet.concat(cur.slice(0, n - k));
      }
      out.push({ packet, fromBack, after: after.slice() });
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

  window.HandShuffle = HandShuffle;
})();
