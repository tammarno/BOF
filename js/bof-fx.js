/* ============================================================================
   BOF FX "ตราทอง": ชุดโมชั่น + VFX + particle กลางของทั้งเกม (ต้องมี GSAP และ js/fx-particles.js)
   ทุกฟังก์ชันคืน gsap timeline เพื่อเอาไปต่อกันใน timeline ใหญ่ได้ และย้อน/กระโดดได้ (seek)
   อนุภาคใช้ tl.call จึงเล่นเฉพาะตอนเล่นจริง ไม่ยิงตอนกระโดดข้ามขั้น

   BOFFX.ease                    — จังหวะประจำเกม: lift (ยก), slam (ตบลง), settle (เด้งเข้าที่), fly (บิน)
   BOFFX.seal(el)                — วงเวทหกแฉกหมุนใต้การ์ด (ใช้สกิล)
   BOFFX.slam(el)                — ยกการ์ดแล้วตบลง + คลื่นกระแทก + ประกายทอง (ลงสนาม)
   BOFFX.shatter(el, img)        — การ์ดสว่างวาบแล้วแตกเป็นเศษ (ถูกทำลาย)
   BOFFX.beam(box, a, b)         — เส้นแสงพุ่งจาก a ไป b · a/b = {x,y} เป็น % ของ box
   BOFFX.link(box, a, b)         — เส้นประทองเชื่อมคู่หู (คงอยู่)
   BOFFX.pop(el, value, up)      — ตัวเลขเด้งเปลี่ยนค่า (up=false เป็นสีแดง)
   BOFFX.touch(box)              — สร้างจุดแตะนิ้ว · BOFFX.tapAt(touch, x, y) แตะที่ % ของ box
   BOFFX.sparks(el, opts)        — ประกายเพชรทองที่กลาง el (ผ่าน BOFParticles.burst)
   ============================================================================ */
(function () {
  if (typeof gsap === 'undefined') return;

  const ease = { lift: 'power2.out', slam: 'power4.in', settle: 'back.out(2.4)', fly: 'power3.inOut' };
  const GOLD = '255, 214, 120', WHITE = '255, 255, 255';

  const SEAL_SVG = `<svg viewBox="0 0 100 100" aria-hidden="true"><g fill="none" stroke="#ffe39a">
    <circle cx="50" cy="50" r="47" stroke-width="1.6"/><circle cx="50" cy="50" r="41" stroke-width=".8" stroke-dasharray="3 3"/>
    <circle cx="50" cy="50" r="22" stroke-width="1.2"/>
    <path d="M50 9 L85.5 70.5 L14.5 70.5 Z M50 91 L14.5 29.5 L85.5 29.5 Z" stroke-width="1.3"/></g>
    <g fill="#ffe39a">${[0, 60, 120, 180, 240, 300].map(a => `<rect x="48" y="0.5" width="4" height="4" transform="rotate(${a} 50 50) rotate(45 50 2.5)"/>`).join('')}</g></svg>`;

  function make(cls, parent, html) {
    const el = document.createElement('div');
    el.className = cls;
    if (html) el.innerHTML = html;
    parent.appendChild(el);
    return el;
  }

  function hostOf(el) { return el.closest('dialog[open]') || document.body; }

  function sparks(el, opts = {}) {
    if (!window.BOFParticles) return;
    const r = el.getBoundingClientRect();
    if (!r.width) return;
    BOFParticles.burst(hostOf(el), r.left + r.width / 2, r.top + r.height / 2,
      { count: 18, speed: 230, size: 12, rings: 1, radius: r.width * .9, color: GOLD, color2: WHITE, ...opts });
  }

  function seal(el) {
    const s = el.querySelector(':scope > .fx-seal') || make('fx-seal', el, SEAL_SVG);
    return gsap.timeline()
      .fromTo(s, { scale: 0, rotate: -90, opacity: 0 }, { scale: 1, rotate: 0, opacity: 1, duration: .5, ease: ease.settle })
      .to(s, { rotate: 120, duration: 1.2, ease: 'none' }, '<')
      .call(() => sparks(el, { count: 12, rings: 1 }), null, .25)
      .to(s, { opacity: 0, scale: 1.25, duration: .35 }, '-=.3');
  }

  function slam(el) {
    const sh = el.querySelector(':scope > .fx-shock') || make('fx-shock', el);
    return gsap.timeline()
      .to(el, { yPercent: -18, scale: 1.12, duration: .22, ease: ease.lift })
      .to(el, { yPercent: 0, scale: 1, duration: .16, ease: ease.slam })
      .call(() => sparks(el, { count: 22, speed: 280, rings: 2 }))
      .fromTo(sh, { scale: .2, opacity: 1 }, { scale: 1, opacity: 0, duration: .5, ease: 'power2.out', immediateRender: false }, '<')
      .fromTo(el, { scaleY: .92 }, { scaleY: 1, duration: .35, ease: ease.settle, immediateRender: false }, '<');
  }

  // เศษ 6 ชิ้นจากภาพการ์ดเดียวกัน (clip-path) แตกออกคนละทิศ
  const CUTS = [
    'polygon(0 0,55% 0,40% 38%,0 30%)', 'polygon(55% 0,100% 0,100% 35%,40% 38%)',
    'polygon(0 30%,40% 38%,52% 66%,0 72%)', 'polygon(40% 38%,100% 35%,100% 70%,52% 66%)',
    'polygon(0 72%,52% 66%,45% 100%,0 100%)', 'polygon(52% 66%,100% 70%,100% 100%,45% 100%)'
  ];
  function shatter(el, img) {
    const flash = el.querySelector(':scope > .fx-flash') || make('fx-flash', el);
    let shards = [...el.querySelectorAll(':scope > .fx-shard')];
    if (!shards.length) {
      shards = CUTS.map(c => {
        const s = make('fx-shard', el);
        s.style.clipPath = c;
        s.style.backgroundImage = `url("${img}")`;
        return s;
      });
    }
    const face = el.querySelectorAll(':scope > :not(.fx-shard):not(.fx-flash):not(.fx-seal):not(.fx-shock)');
    const tl = gsap.timeline()
      .to(el, { x: '+=3%', duration: .05, repeat: 5, yoyo: true, ease: 'none' })
      .to(flash, { opacity: .9, duration: .12 }, '<.1')
      .call(() => sparks(el, { count: 26, speed: 320, rings: 2, color: '255, 140, 90', color2: GOLD }))
      .set(face, { opacity: 0 })
      .set(el, { boxShadow: 'none', background: 'transparent' })
      .set(shards, { opacity: 1 })
      .to(flash, { opacity: 0, duration: .2 });
    shards.forEach((s, i) => {
      const a = (i / shards.length) * Math.PI * 2 + .4;
      tl.to(s, { xPercent: Math.cos(a) * 70, yPercent: Math.sin(a) * 70 + 20, rotate: (i % 2 ? 1 : -1) * (25 + i * 9), opacity: 0, duration: .6, ease: 'power2.out' }, '<');
    });
    return tl;
  }

  // จุดใน % ของกล่อง → ตำแหน่ง/ความยาว/มุมของเส้น (ต้องรู้สัดส่วนกล่อง h/w)
  function lineGeo(box, a, b) {
    const k = box.clientHeight && box.clientWidth ? box.clientHeight / box.clientWidth : (parseFloat(box.dataset.aspect) || .625);
    const dx = b.x - a.x, dy = (b.y - a.y) * k;
    return { left: a.x + '%', top: a.y + '%', width: Math.hypot(dx, dy) + '%', rotate: Math.atan2(dy, dx) * 180 / Math.PI };
  }

  function beam(box, a, b) {
    const el = make('fx-beam', box);
    const g = lineGeo(box, a, b);
    gsap.set(el, { left: g.left, top: g.top, width: g.width, rotate: g.rotate });
    return gsap.timeline()
      .fromTo(el, { scaleX: 0, opacity: 1 }, { scaleX: 1, duration: .22, ease: 'power3.in' })
      .to(el, { opacity: 0, duration: .25 });
  }

  function link(box, a, b) {
    const el = make('fx-link', box);
    const g = lineGeo(box, a, b);
    gsap.set(el, { left: g.left, top: g.top, width: g.width, rotate: g.rotate });
    return gsap.timeline().fromTo(el, { scaleX: 0, opacity: 0 }, { scaleX: 1, opacity: 1, duration: .45, ease: ease.lift });
  }

  function pop(el, value, up = true) {
    const rgb = up ? '94, 242, 160' : '255, 93, 115', hex = up ? '#5ef2a0' : '#ff5d73';
    return gsap.timeline()
      .to(el, { scale: 1.9, duration: .18, ease: ease.lift })
      .set(el, { innerText: value, color: hex, textShadow: `0 0 8px rgba(${rgb}, .9)` })
      .to(el, { scale: 1, duration: .4, ease: ease.settle })
      .call(() => sparks(el, { count: 10, speed: 150, rings: 1, radius: 30, color: rgb, color2: WHITE }), null, '<');
  }

  function touch(box) { return make('fx-touch', box); }
  function tapAt(t, x, y, move = .35) {
    return gsap.timeline()
      .to(t, { left: x + '%', top: y + '%', opacity: 1, duration: move, ease: ease.fly })
      .to(t, { scale: .8, duration: .1 })
      .call(() => { t.classList.remove('is-press'); void t.offsetWidth; t.classList.add('is-press'); })
      .to(t, { scale: 1, duration: .15 });
  }

  window.BOFFX = { ease, seal, slam, shatter, beam, link, pop, touch, tapAt, sparks };
})();
