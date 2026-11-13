/* ============================================================================
   FLOW MOTION (BOF v0.9) — โหลดหลัง panel-motion.js (ไฟล์สุดท้าย)
   โมชันของหน้าที่ออกแบบใหม่: ร้านค้า / ตั้งค่า / เลือกสล็อตเด็ค / หน้าต่างล็อบบี้อื่น ๆ
   - เปิดหน้าต่าง: กล่องเด้งเข้า + เนื้อหาไหลตามกันทีละชิ้น
   - กด: ทุกปุ่มยุบลงทันทีแล้วเด้งกลับ (สปริง)
   - เลือก: แท็บ/สล็อต/จำนวนซอง → เนื้อหาใหม่ไหลเข้า · ตัวเลขเงินเด้งเมื่อเปลี่ยน
   ฟังเหตุการณ์ที่ shop.js / game.js ส่งมา (shop:tab, shop:qty, shop:code, sp:select, sp:use)
   กฎ: transform/opacity เท่านั้น · เคารพ prefers-reduced-motion
   ============================================================================ */
(function () {
  if (typeof gsap === 'undefined' || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const $ = s => document.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const SPRING = 'back.out(2.2)';

  // ---------- เปิดหน้าต่าง ----------
  function popIn(box, items) {
    if (!box) return;
    gsap.killTweensOf(box);
    gsap.fromTo(box, { opacity: 0, scale: .94, y: 18 }, { opacity: 1, scale: 1, y: 0, duration: .36, ease: 'back.out(1.5)', clearProps: 'opacity,transform' });
    const list = (items || []).filter(Boolean).slice(0, 12);
    if (list.length) gsap.fromTo(list, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: .32, stagger: .045, delay: .08, ease: 'power2.out', clearProps: 'opacity,transform' });
  }

  // <dialog> ของล็อบบี้/ร้านค้า: ขยับกล่องข้างใน ไม่ขยับตัว dialog (Chrome ทำ focus หลุด) · หน้าต่างเลือกโหมดมีโมชันของตัวเองแล้ว
  const DIALOGS = {
    'lb-settings-dialog': d => [d.querySelector('.lb-dialog-panel'), $$('.st-head, .st-group, .st-foot', d)],
    'lb-deck-picker-dialog': d => [d.querySelector('.lb-dialog-panel'), [d.querySelector('.lb-deck-picker-head'), ...$$('.lb-picker-item, .lb-slot-chip', d)]],
    'lb-howto-dialog': d => [null, [...d.children]],
    'lb-join-dialog': d => [null, [...d.children]],
    'bof-shop-dialog': d => [d.querySelector('.bof-shop-panel'), [d.querySelector('.sh-top'), d.querySelector('.sh-tabs'), ...$$('.sh-packs-bar, .sh-dupe-note, .sh-pack', d)]],
    'bof-auth-dialog': d => [d.firstElementChild, []],
  };
  for (const [id, parts] of Object.entries(DIALOGS)) {
    const d = document.getElementById(id); if (!d) continue;
    new MutationObserver(() => {
      if (!d.open) return;
      // รอเฟรมถัดไป: ร้านค้าวาดเนื้อหาใหม่หลัง showModal
      requestAnimationFrame(() => { const [box, items] = parts(d); popIn(box, items); });
    }).observe(d, { attributes: true, attributeFilter: ['open'] });
  }

  // ---------- กด: ยุบแล้วเด้งกลับ ----------
  // ปุ่มที่ ui-motion / panel-motion / lobby-motion ดูแลอยู่แล้วไม่แตะ (.btn ในหน้าต่างเก่า, .lb-mode, เมนูล็อบบี้)
  const PRESS = [
    '#bof-shop-dialog button', '#bof-reveal-stage button', '#deck-slot-picker-modal button',
    '#lobby-screen dialog button', '.st-btn', '.lb-deck-picker-btn', '#lb-coin-pill', '#lb-play'
  ].join(',');
  const SKIP = '.lb-mode, .btn, [disabled]';
  const pressable = t => { const b = t.closest && t.closest(PRESS); return b && !b.matches(SKIP) ? b : null; };
  let held = null;
  document.addEventListener('pointerdown', e => {
    const b = pressable(e.target); if (!b) return;
    held = b;
    gsap.to(b, { scale: b.matches('.sh-tab, .sh-qty button, .sp-row') ? .93 : .95, duration: .07, ease: 'power1.out', overwrite: 'auto' });
  }, true);
  const release = () => {
    if (!held) return;
    const b = held; held = null;
    gsap.to(b, { scale: 1, duration: .42, ease: 'back.out(3)', overwrite: 'auto', clearProps: 'transform' });
  };
  document.addEventListener('pointerup', release, true);
  document.addEventListener('pointercancel', release, true);
  document.addEventListener('dragstart', release, true);

  // สวิตช์ตั้งค่า: ปุ่มกลมยืดตัวระหว่างเลื่อน (เหมือนเยลลี่)
  document.addEventListener('change', e => {
    const input = e.target.closest && e.target.closest('.lb-switch-input'); if (!input) return;
    const track = input.nextElementSibling; if (!track) return;
    gsap.fromTo(track, { scaleX: 1.12, scaleY: .9 }, { scaleX: 1, scaleY: 1, duration: .45, ease: 'elastic.out(1, .5)', clearProps: 'transform' });
    const row = input.closest('.st-card');
    const vol = row && row.querySelector('.st-vol');
    if (vol) gsap.fromTo(vol, { x: input.checked ? -6 : 6 }, { x: 0, duration: .35, ease: SPRING, clearProps: 'transform' });
  });

  // ---------- ตัวเลขเงิน: เด้งเมื่อค่าเปลี่ยน (ซื้อซอง / รับรางวัล / ใส่โค้ด) ----------
  ['bof-shop-coin-val', 'bof-shop-shard-val', 'lb-coin-val'].forEach(id => {
    const el = document.getElementById(id); if (!el) return;
    let last = el.textContent;
    new MutationObserver(() => {
      if (el.textContent === last) return;
      if (el.dataset.counting) { last = el.textContent; return; } // quests.js กำลังนับเลขวิ่งและเด้งเอง
      const up = parseInt(el.textContent.replace(/\D/g, ''), 10) > parseInt(last.replace(/\D/g, ''), 10);
      last = el.textContent;
      const chip = el.closest('.sh-wallet > span, #lb-coin-pill') || el;
      gsap.fromTo(chip, { scale: up ? 1.14 : .9 }, { scale: 1, duration: .5, ease: 'back.out(3)', overwrite: 'auto', clearProps: 'transform' });
      gsap.fromTo(el, { y: up ? 8 : -8, opacity: .2 }, { y: 0, opacity: 1, duration: .35, ease: 'power2.out', clearProps: 'transform,opacity' });
    }).observe(el, { childList: true, characterData: true, subtree: true });
  });

  // ---------- ร้านค้า ----------
  document.addEventListener('shop:tab', e => {
    const view = e.target;
    const items = [...view.children].length === 1 ? [...view.firstElementChild.children] : [...view.children];
    gsap.fromTo(items.slice(0, 10), { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: .3, stagger: .04, ease: 'power2.out', clearProps: 'opacity,transform' });
    const packs = $$('.sh-pack', view);
    if (packs.length) gsap.fromTo(packs, { opacity: 0, y: 22, scale: .97 }, { opacity: 1, y: 0, scale: 1, duration: .38, stagger: .05, delay: .08, ease: 'power3.out', clearProps: 'opacity,transform' });
  });
  document.addEventListener('shop:qty', e => {
    const btns = $$('.sh-buy', e.target);
    gsap.fromTo(btns, { scale: .94 }, { scale: 1, duration: .45, stagger: .03, ease: 'back.out(3)', clearProps: 'transform' });
    gsap.fromTo($$('.sh-price', e.target), { y: e.detail.qty === 10 ? 10 : -10, opacity: 0 }, { y: 0, opacity: 1, duration: .3, stagger: .03, ease: 'power2.out', clearProps: 'transform,opacity' });
  });
  document.addEventListener('shop:code', e => {
    if (!e.detail.open) return;
    gsap.fromTo(e.target, { opacity: 0, y: -10 }, { opacity: 1, y: 0, duration: .28, ease: 'power2.out', clearProps: 'opacity,transform' });
  });

  // ---------- หน้าต่างเลือกสล็อตเด็ค (game.js แสดงด้วย style.display) ----------
  const sp = document.getElementById('deck-slot-picker-modal');
  function animateDetail(modal, fromSide) {
    const d = modal.querySelector('.sp-detail'); if (!d) return;
    const art = d.querySelector('.sp-art');
    gsap.fromTo(art, { opacity: 0, rotation: -12, x: fromSide * 30, scale: .9 }, { opacity: 1, rotation: -3, x: 0, scale: 1, duration: .45, ease: SPRING, clearProps: 'opacity,transform' });
    gsap.fromTo(d.querySelectorAll('.sp-info > *'), { opacity: 0, x: fromSide * 16 }, { opacity: 1, x: 0, duration: .3, stagger: .04, ease: 'power2.out', clearProps: 'opacity,transform' });
    gsap.fromTo(d.querySelector('.sp-meter i'), { scaleX: 0 }, { scaleX: 1, duration: .6, delay: .12, ease: 'power3.out', clearProps: 'transform' });
  }
  function watchPicker(modal) {
    if (modal._flow) return; modal._flow = true;
    let lastIdx = null;
    new MutationObserver(() => {
      if (modal.style.display !== 'flex' || modal._shown) { if (modal.style.display === 'none') modal._shown = false; return; }
      modal._shown = true; lastIdx = null;
      popIn(modal.querySelector('.sp-box'), [modal.querySelector('.sp-head'), ...$$('.sp-row', modal)]);
      animateDetail(modal, 1);
    }).observe(modal, { attributes: true, attributeFilter: ['style'] });
    modal.addEventListener('sp:select', e => {
      const prev = lastIdx == null ? 0 : lastIdx; lastIdx = e.detail.index;
      animateDetail(modal, e.detail.index >= prev ? 1 : -1);
    });
    modal.addEventListener('sp:use', () => {
      const tag = modal.querySelector('.sp-tag');
      if (tag) gsap.fromTo(tag, { scale: 0, rotation: -12 }, { scale: 1, rotation: 0, duration: .5, ease: 'back.out(3)', clearProps: 'transform' });
      const d = modal.querySelector('.sp-detail');
      if (d) gsap.fromTo(d, { boxShadow: '0 0 0 2px var(--c), 0 0 40px var(--c)' }, { boxShadow: '0 0 0 0px var(--c), 0 0 0px var(--c)', duration: .8, ease: 'power2.out', clearProps: 'boxShadow' });
    });
  }
  if (sp) watchPicker(sp);
  else new MutationObserver((_, obs) => {
    const m = document.getElementById('deck-slot-picker-modal');
    if (m) { obs.disconnect(); watchPicker(m); }
  }).observe(document.body, { childList: true });

  // ---------- ผลการเปิดซอง: หัวข้อ/ชิปไหลเข้า (การ์ดแจกด้วย CSS อยู่แล้ว) ----------
  const reveal = document.getElementById('bof-reveal-stage');
  if (reveal) new MutationObserver(() => {
    if (!reveal.classList.contains('is-open') || reveal._shown) { if (!reveal.classList.contains('is-open')) reveal._shown = false; return; }
    reveal._shown = true;
    gsap.fromTo([reveal.querySelector('.rv-title'), ...$$('.rv-chip', reveal)], { opacity: 0, y: -12, scale: .9 }, { opacity: 1, y: 0, scale: 1, duration: .35, stagger: .05, ease: 'back.out(2)', clearProps: 'opacity,transform' });
    gsap.fromTo(reveal.querySelectorAll('.rv-btn'), { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: .3, stagger: .06, delay: .35, ease: 'power2.out', clearProps: 'opacity,transform' });
  }).observe(reveal, { attributes: true, attributeFilter: ['class'] });
  // ---------- ตัวกรอง (หลอมการ์ด / ของตกแต่ง / คลังการ์ด): ปุ่มที่เลือกเด้ง + การ์ดชุดใหม่ไหลเข้าเป็นคลื่น ----------
  document.addEventListener('fx:filter', e => {
    const grid = e.detail && e.detail.grid; if (!grid) return;
    const scope = grid.parentElement || document;
    $$('.fx-chip[aria-checked="true"], .cs-slot.is-on', scope).forEach(c =>
      gsap.fromTo(c, { scale: .86 }, { scale: 1, duration: .5, ease: 'back.out(3.5)', clearProps: 'transform' }));
    const tiles = [...grid.children].slice(0, 30);
    gsap.fromTo(tiles, { opacity: 0, y: 18, scale: .92, rotation: () => gsap.utils.random(-3, 3) },
      { opacity: 1, y: 0, scale: 1, rotation: 0, duration: .42, ease: 'back.out(1.6)', stagger: { each: .022, from: 'start' }, clearProps: 'opacity,transform' });
  });

  // ---------- เศษคริสตัลบินระหว่างสองจุด (ย่อย = จากเตาไปกระเป๋า · หลอม = จากกระเป๋าไปการ์ด) ----------
  function flyShards(from, toEl, n) {
    if (!from || !toEl) return;
    const to = toEl.getBoundingClientRect();
    const host = toEl.closest('dialog, .modal-overlay') || document.body;
    const layer = document.createElement('div');
    layer.className = 'rv-shard-layer';
    host.appendChild(layer);
    const sx = from.left + from.width / 2, sy = from.top + from.height / 2;
    const tx = to.left + to.width / 2, ty = to.top + to.height / 2;
    for (let i = 0; i < n; i++) {
      const b = document.createElement('span');
      b.className = 'rv-shard-bit';
      b.style.left = sx + 'px'; b.style.top = sy + 'px';
      layer.appendChild(b);
      const ang = Math.random() * Math.PI * 2, r = 20 + Math.random() * 40;
      gsap.timeline({ delay: i * .03 })
        .fromTo(b, { x: 0, y: 0, scale: .3, opacity: 1 }, { x: Math.cos(ang) * r, y: Math.sin(ang) * r, scale: 1, rotation: 160, duration: .28, ease: 'power3.out' })
        .to(b, { x: tx - sx, y: ty - sy, scale: .4, rotation: 400, duration: .55, ease: 'power3.in' })
        .to(b, { opacity: 0, duration: .06 });
    }
    gsap.delayedCall(.35 + n * .03 + .7, () => layer.remove());
  }
  const shardChip = () => $('#bof-shop-shard-val') && $('#bof-shop-shard-val').closest('span');

  document.addEventListener('shop:melt', e => {
    flyShards(e.detail.from, shardChip(), 16);
    const melt = $('.cf-melt');
    if (melt) gsap.fromTo(melt, { scale: .97 }, { scale: 1, duration: .5, ease: 'back.out(3)', clearProps: 'transform' });
  });
  document.addEventListener('shop:craft', e => {
    const tile = document.querySelector(`[data-craft-tile="${e.detail.id}"]`); if (!tile) return;
    const chip = shardChip();
    if (chip) flyShards(chip.getBoundingClientRect(), tile.querySelector('.cf-art') || tile, 10);
    gsap.delayedCall(.75, () => {
      tile.classList.add('is-crafted');
      gsap.fromTo(tile.querySelector('.cf-art'), { scale: .8, rotation: -6 }, { scale: 1, rotation: 0, duration: .6, ease: 'back.out(3)', clearProps: 'transform' });
      gsap.fromTo(tile.querySelectorAll('.cf-own i.on'), { scale: 0 }, { scale: 1, duration: .4, stagger: .08, ease: 'back.out(4)', clearProps: 'transform' });
      // อนุภาคตามระดับการ์ดที่หลอมได้ (js/fx-particles.js)
      const host = tile.closest('dialog'), rarity = (tile.className.match(/r-(N|R|SR|SSR)/) || [])[1];
      if (window.BOFParticles && host && rarity) window.BOFParticles.rarity(host, (tile.querySelector('.cf-art') || tile).getBoundingClientRect(), rarity);
    });
  });

  // ---------- ห้องแต่งตัว: ลอง/สวม → เวทีเด้ง การ์ดหลังพัดออก ----------
  function stagePop(category) {
    const stage = $('.cs-stage'); if (!stage) return;
    const hero = stage.querySelector('.cs-hero'), fan = $$('.cs-fan img', stage);
    if (!category || category === 'frame' || category === 'title') gsap.fromTo(hero, { scale: .8, opacity: .3 }, { scale: 1, opacity: 1, duration: .5, ease: 'back.out(2.4)', clearProps: 'transform,opacity' });
    if (!category || category === 'card_back') gsap.fromTo(fan, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: .5, stagger: .07, ease: 'back.out(2)', clearProps: 'transform,opacity' });
    if (category === 'arena_theme') gsap.fromTo(stage.querySelector('.cs-arena-lines'), { opacity: 0, scale: 1.15 }, { opacity: 1, scale: 1, duration: .6, ease: 'power3.out', clearProps: 'transform,opacity' });
    const slot = category && stage.querySelector(`.cs-slot[data-cos-jump="${category}"]`);
    if (slot) gsap.fromTo(slot, { scale: .9 }, { scale: 1, duration: .5, ease: 'back.out(3)', clearProps: 'transform' });
  }
  document.addEventListener('cos:try', e => stagePop(e.detail.category));
  document.addEventListener('cos:equip', e => {
    stagePop(e.detail.category);
    const item = document.querySelector(`[data-cos-item="${e.detail.id}"]`);
    if (item) gsap.fromTo(item, { boxShadow: '0 0 0 3px #f3c969, 0 0 44px rgba(243,201,105,.9)' }, { boxShadow: '0 0 0 1px #f3c969, 0 10px 26px rgba(243,201,105,.18)', duration: .9, ease: 'power2.out', clearProps: 'boxShadow' });
  });

  // ---------- คลังการ์ด: เปิดแล้วกล่องเด้ง + การ์ดแจกเข้า + วงแหวนนับขึ้น ----------
  function watchCollection(col) {
    new MutationObserver(() => {
      if (col.style.display !== 'flex' || col._shown) { if (col.style.display === 'none') col._shown = false; return; }
      col._shown = true;
      popIn(col.querySelector('.col-box'), [col.querySelector('.col-head'), ...$$('.fx-chip', col).slice(0, 12)]);
      gsap.fromTo([...col.querySelector('.col-grid').children].slice(0, 30), { opacity: 0, y: 26, rotationX: -40, transformPerspective: 600 },
        { opacity: 1, y: 0, rotationX: 0, duration: .5, stagger: .02, delay: .15, ease: 'power3.out', clearProps: 'opacity,transform' });
      const n = col.querySelector('.col-ring-n'), end = parseInt(n.textContent, 10) || 0, o = { v: 0 };
      gsap.to(o, { v: end, duration: .9, delay: .2, ease: 'power2.out', onUpdate: () => { n.textContent = Math.round(o.v); } });
    }).observe(col, { attributes: true, attributeFilter: ['style'] });
  }
  const col = document.getElementById('bof-collection');
  if (col) watchCollection(col);
  else new MutationObserver((_, obs) => {
    const m = document.getElementById('bof-collection');
    if (m) { obs.disconnect(); watchCollection(m); }
  }).observe(document.body, { childList: true });

  // ---------- เอียงตามเมาส์ (การ์ดคลัง / การ์ดหลอม / ของตกแต่ง) ----------
  if (matchMedia('(hover: hover)').matches) {
    const TILT = '.col-card, .cf-card, .cs-item';
    let tilted = null;
    document.addEventListener('pointermove', e => {
      const el = e.target.closest && e.target.closest(TILT);
      if (tilted && tilted !== el) { gsap.to(tilted, { rotationX: 0, rotationY: 0, y: 0, duration: .4, ease: 'power2.out', overwrite: 'auto', clearProps: 'transform' }); tilted = null; }
      if (!el || held) return;
      tilted = el;
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - .5, py = (e.clientY - r.top) / r.height - .5;
      gsap.to(el, { rotationY: px * 10, rotationX: -py * 10, y: -4, transformPerspective: 700, duration: .3, ease: 'power2.out', overwrite: 'auto' });
    }, { passive: true });
  }
})();
