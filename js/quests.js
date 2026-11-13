/* ============================================================================
   BOF ภารกิจหน้าแรก: รายวัน (ง่าย/ยาก) + รายสัปดาห์ (ยาก · เหรียญ ×2 ชาร์ด ×1.5)
   ข้อมูลความคืบหน้าอยู่ใน economy ของ shop.js (BOFShop) · ไฟล์นี้วาดแผง รับรางวัล และเล่นโมชั่น
   จอใหญ่: แผงอยู่ใต้เมนูซ้าย · มือถือ: ปุ่ม #lb-quest-btn ย้ายแผงเข้า #lb-quests-dialog (bottom sheet)
   ============================================================================ */
(function () {
  const shop = window.BOFShop;
  const panel = document.getElementById('lb-quests');
  if (!shop || !panel) return;

  const WEEKLY_COIN_X = 2;    // รางวัลรายสัปดาห์: เหรียญ ×2
  const WEEKLY_SHARD_X = 1.5; // ชาร์ด ×1.5 (คูณจากฐานที่สูงกว่าเควสต์ยากรายวันอยู่แล้ว)

  const ICON = {
    gift: '<rect x="3" y="9" width="18" height="12" rx="1.5"/><path d="M12 9v12M3 13h18M12 9c-2-4-6-4-6-1s6 1 6 1 6 2 6-1-4-3-6 1"/>',
    pack: '<path d="M6 3h12l-1 18H7z"/><path d="M6 7h12M10 12l2-2 2 2-2 2z"/>',
    craft: '<path d="M12 2l7 7-7 13-7-13z"/><path d="M5 9h14"/>',
    duel: '<path d="M4 4l10 10M14 14l-3 3M17 11l-3 3M4 4h4v4M20 4L10 14M10 14l3 3M7 11l3 3M20 4h-4v4"/>',
    win: '<path d="M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4M12 14v4M8 21h8"/>'
  };

  // id ของเควสต์ง่ายรายวันเท่ากับของเดิมในร้านค้า → ที่กดรับไปแล้ววันนี้ยังนับ
  const DAILY = [
    { id: 'quest_packs_1', tier: 'easy', icon: 'pack', title: 'เปิดซอง 1 ซอง', field: 'packsOpened', goal: 1, coins: 200, shards: 30 },
    { id: 'quest_craft_1', tier: 'easy', icon: 'craft', title: 'ย่อย/หลอมการ์ด 1 ครั้ง', field: 'craftsDone', goal: 1, coins: 250, shards: 40 },
    { id: 'quest_duel_1', tier: 'easy', icon: 'duel', title: 'ดวลจบ 1 แมตช์', field: 'duelsCompleted', goal: 1, coins: 350, shards: 50 },
    { id: 'quest_win_2', tier: 'hard', icon: 'win', title: 'ชนะ 2 แมตช์', field: 'duelsWon', goal: 2, coins: 600, shards: 80 },
    { id: 'quest_packs_3', tier: 'hard', icon: 'pack', title: 'เปิดซอง 3 ซอง', field: 'packsOpened', goal: 3, coins: 500, shards: 70 }
  ];
  const weekly = q => ({ ...q, tier: 'weekly', coins: q.base[0] * WEEKLY_COIN_X, shards: Math.round(q.base[1] * WEEKLY_SHARD_X) });
  const WEEKLY = [
    weekly({ id: 'wk_win_10', icon: 'win', title: 'ชนะ 10 แมตช์', field: 'duelsWon', goal: 10, base: [1000, 120] }),
    weekly({ id: 'wk_duel_15', icon: 'duel', title: 'ดวลจบ 15 แมตช์', field: 'duelsCompleted', goal: 15, base: [900, 100] }),
    weekly({ id: 'wk_packs_10', icon: 'pack', title: 'เปิดซอง 10 ซอง', field: 'packsOpened', goal: 10, base: [800, 100] }),
    weekly({ id: 'wk_craft_5', icon: 'craft', title: 'ย่อย/หลอมการ์ด 5 ครั้ง', field: 'craftsDone', goal: 5, base: [600, 80] })
  ];
  const CHECKIN = { id: 'checkin', tier: 'gift', icon: 'gift', title: 'ของขวัญเช็คอิน', goal: 1, coins: 300, shards: 50 };
  const TIER_LABEL = { easy: 'ง่าย', hard: 'ยาก', weekly: 'ยาก', gift: 'ฟรี' };

  let tab = 'daily';
  let muted = false;
  const fmt = n => Number(n || 0).toLocaleString('th-TH');
  const motionOK = () => typeof gsap !== 'undefined' && !matchMedia('(prefers-reduced-motion: reduce)').matches;

  // สถานะทุกเควสต์ของแท็บ: ready (รับได้) · progress · claimed — เรียงที่รับได้ขึ้นก่อน
  function questsOf(which) {
    const eco = shop.getEconomy();
    shop.ensureProgress();
    const rank = { ready: 0, progress: 1, claimed: 2 };
    const list = which === 'weekly'
      ? WEEKLY.map(q => state(q, eco.weeklyProgress, eco.claimedWeekly))
      : [
          { ...CHECKIN, cur: 1, state: eco.lastDailyClaimDate === eco.dailyProgress.date ? 'claimed' : 'ready' },
          ...DAILY.map(q => state(q, eco.dailyProgress, eco.claimedQuests))
        ];
    return list.sort((a, b) => rank[a.state] - rank[b.state]);
  }
  function state(q, prog, claimed) {
    const cur = Math.min(q.goal, prog[q.field] || 0);
    return { ...q, cur, state: claimed[q.id] ? 'claimed' : (cur >= q.goal ? 'ready' : 'progress') };
  }
  const readyCount = which => questsOf(which).filter(q => q.state === 'ready').length;

  function timeLeft(ms) {
    const m = Math.floor(ms / 60000), h = Math.floor(m / 60), d = Math.floor(h / 24);
    if (d) return `${d} วัน ${h % 24} ชม.`;
    if (h) return `${h} ชม. ${m % 60} นาที`;
    return `${Math.max(1, m)} นาที`;
  }
  const resetMs = () => (tab === 'weekly' ? shop.msToWeeklyReset() : shop.msToDailyReset());

  function rowHTML(q, i) {
    const pct = q.cur / q.goal;
    const btn = q.state === 'claimed'
      ? '<button type="button" class="qb-claim" disabled aria-label="รับแล้ว"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></button>'
      : q.state === 'ready'
        ? `<button type="button" class="qb-claim" data-claim="${q.id}">รับ</button>`
        : `<button type="button" class="qb-claim" disabled>${q.cur}/${q.goal}</button>`;
    return `
      <li class="qb-row is-${q.state} qb-t-${q.tier}" data-id="${q.id}" style="--i:${i}">
        <span class="qb-side"><span class="qb-ico"><svg viewBox="0 0 24 24" aria-hidden="true">${ICON[q.icon]}</svg></span><span class="qb-tier">${TIER_LABEL[q.tier]}</span></span>
        <div class="qb-main">
          <p class="qb-title">${q.title}</p>
          ${q.tier === 'gift' ? '' : `<div class="qb-bar" role="progressbar" aria-valuemin="0" aria-valuemax="${q.goal}" aria-valuenow="${q.cur}"><i style="transform:scaleX(${pct})"></i></div>`}
          <p class="qb-rew"><span>${shop.COIN_SVG}${fmt(q.coins)}</span><span>${shop.SHARD_SVG}${fmt(q.shards)}</span></p>
        </div>
        ${btn}
      </li>`;
  }

  let shownOrder = [];
  const RING = 2 * Math.PI * 15; // เส้นรอบวงของวงแหวนความคืบหน้า (r=15)
  const X_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';

  // keepOrder: ตอนกดรับให้แถวอยู่ที่เดิม (เห็นตราประทับ) ไม่กระโดดลงล่าง
  function render(keepOrder) {
    const eco = shop.getEconomy();
    const list = questsOf(tab);
    if (keepOrder) list.sort((a, b) => shownOrder.indexOf(a.id) - shownOrder.indexOf(b.id));
    shownOrder = list.map(q => q.id);
    const done = list.filter(q => q.state !== 'progress').length;
    const nDaily = readyCount('daily'), nWeekly = readyCount('weekly');
    const nHere = tab === 'weekly' ? nWeekly : nDaily;
    const scroll = panel.querySelector('.qb-list')?.scrollTop || 0;
    panel.innerHTML = `
      <span class="qb-grab" aria-hidden="true"></span>
      <header class="qb-head">
        <span class="qb-emblem" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M7 3h11a2 2 0 0 1 2 2v12H9v2a2 2 0 0 1-4 0V6a3 3 0 0 0-3-3"/><path d="M9 8h7M9 12h5"/></svg></span>
        <div class="qb-head-txt">
          <h3 id="qb-title">ภารกิจ</h3>
          <span class="qb-timer" title="เวลาก่อนรีเซ็ต"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>รีเซ็ตใน <b>${timeLeft(resetMs())}</b></span>
        </div>
        <span class="qb-prog" title="สำเร็จ ${done} จาก ${list.length}">
          <svg class="qb-ring" viewBox="0 0 36 36" aria-hidden="true"><circle cx="18" cy="18" r="15"/><circle class="qb-ring-fg" cx="18" cy="18" r="15" stroke-dasharray="${RING}" stroke-dashoffset="${RING * (1 - done / list.length)}"/></svg>
          <b>${done}/${list.length}</b>
        </span>
        <button type="button" class="qb-close" aria-label="ปิดภารกิจ">${X_ICON}</button>
      </header>
      <p class="qb-wallet"><span class="qb-w-coin">${shop.COIN_SVG}<b>${fmt(eco.coins)}</b></span><span class="qb-w-shard">${shop.SHARD_SVG}<b>${fmt(eco.shards)}</b></span></p>
      <div class="qb-tabs" role="tablist" aria-label="ประเภทภารกิจ" style="--i:${tab === 'weekly' ? 1 : 0}">
        <button type="button" role="tab" data-tab="daily" aria-selected="${tab === 'daily'}">รายวัน${nDaily ? `<i>${nDaily}</i>` : ''}</button>
        <button type="button" role="tab" data-tab="weekly" aria-selected="${tab === 'weekly'}">รายสัปดาห์${nWeekly ? `<i>${nWeekly}</i>` : ''}</button>
        <span class="qb-tab-ink" aria-hidden="true"></span>
      </div>
      ${tab === 'weekly' ? `<p class="qb-bonus">โบนัสรายสัปดาห์<b>${shop.COIN_SVG}×${WEEKLY_COIN_X}</b><b>${shop.SHARD_SVG}×${WEEKLY_SHARD_X}</b></p>` : ''}
      <ul class="qb-list">${list.map(rowHTML).join('')}</ul>
      ${nHere > 1 ? `<button type="button" class="qb-claim-all"><span>รับทั้งหมด</span><b>${nHere}</b></button>` : ''}`;
    panel.querySelector('.qb-list').scrollTop = scroll;
    panel.classList.toggle('has-ready', nDaily + nWeekly > 0);

    const total = nDaily + nWeekly;
    const btn = document.getElementById('lb-quest-btn');
    if (btn) {
      btn.classList.toggle('is-hot', total > 0);
      const badge = btn.querySelector('.qb-count');
      badge.textContent = total; badge.hidden = !total;
    }
  }

  /* ---------------- รับรางวัล ---------------- */
  function claim(ids) {
    const eco = shop.getEconomy();
    const all = [...questsOf('daily'), ...questsOf('weekly')];
    const picked = ids.map(id => all.find(q => q.id === id)).filter(q => q && q.state === 'ready');
    if (!picked.length) return;
    const from = picked.map(q => panel.querySelector(`[data-claim="${q.id}"]`)?.getBoundingClientRect()).filter(Boolean);
    const before = { coins: eco.coins || 0, shards: eco.shards || 0 };
    let coins = 0, shards = 0;
    picked.forEach(q => {
      if (q.id === 'checkin') eco.lastDailyClaimDate = eco.dailyProgress.date;
      else if (q.tier === 'weekly') eco.claimedWeekly[q.id] = true;
      else eco.claimedQuests[q.id] = true;
      coins += q.coins; shards += q.shards;
    });
    eco.coins = before.coins + coins;
    eco.shards = before.shards + shards;
    muted = true; // ไม่ให้ bof:economy วาดทับระหว่างโมชั่น
    shop.save();
    muted = false;
    render(true);
    if (window.BOFHaptic) window.BOFHaptic(18);
    if (window.BOF_AUDIO) window.BOF_AUDIO.playSsr();
    picked.forEach(q => panel.querySelector(`.qb-row[data-id="${q.id}"]`)?.classList.add('just-claimed'));
    celebrate(from, before, { coins, shards });
  }

  // ตัวเลขที่ต้องวิ่งขึ้น: ตัวนับในล็อบบี้ + กระเป๋าในแผง (โชว์เฉพาะในแผ่นมือถือ)
  const counters = kind => [document.getElementById(kind === 'coins' ? 'lb-coin-val' : 'lb-shard-val'), panel.querySelector(kind === 'coins' ? '.qb-w-coin b' : '.qb-w-shard b')].filter(Boolean);
  function flyIcon(kind) {
    const inSheet = panel.closest('dialog[open]');
    return inSheet
      ? panel.querySelector(kind === 'coins' ? '.qb-w-coin svg' : '.qb-w-shard svg')
      : document.querySelector(kind === 'coins' ? '#lb-coin-pill .lb-coin-icon' : '#lb-coin-pill .lb-shard svg');
  }
  function flyTarget(kind) {
    const el = flyIcon(kind);
    return el && el.getBoundingClientRect();
  }

  function celebrate(fromRects, before, gain) {
    const after = { coins: before.coins + gain.coins, shards: before.shards + gain.shards };
    const fx = window.BOFParticles;
    if (!motionOK() || !fx || !fromRects.length) return;
    const host = panel.closest('dialog[open]') || document.body;
    const base = host === document.body ? { left: 0, top: 0 } : host.getBoundingClientRect();
    const targets = { coins: flyTarget('coins'), shards: flyTarget('shards') };
    const per = Math.max(3, Math.round(10 / fromRects.length)); // รับหลายอัน: รวมไม่เกิน ~30 ชิ้นต่อชนิด

    ['coins', 'shards'].forEach(kind => counters(kind).forEach(el => { el.textContent = fmt(before[kind]); }));

    // ตัวเลขวิ่งขึ้นเมื่อชิ้นแรกของแต่ละชนิดถึงเป้า แล้วตัวนับเด้ง
    const started = {};
    const onArrive = kind => {
      if (started[kind]) return;
      started[kind] = true;
      if (kind === 'coins' && window.BOF_AUDIO) window.BOF_AUDIO.playCoinLand();
      const box = { v: before[kind] };
      const els = counters(kind);
      // data-counting: บอก flow-motion ว่าเลขกำลังวิ่ง ไม่ต้องเด้ง/จางทุกเฟรม (ไม่งั้นเลขซีดค้างและแถบสั่น)
      els.forEach(el => { el.dataset.counting = '1'; });
      gsap.to(box, {
        v: after[kind], duration: .8, ease: 'power1.out',
        onUpdate: () => els.forEach(el => { el.textContent = fmt(Math.round(box.v)); }),
        onComplete: () => els.forEach(el => { delete el.dataset.counting; })
      });
      // เด้งเฉพาะไอคอนที่เหรียญ/ชาร์ดบินเข้า + ตัวเลข (เดิมขยายทั้งแถบเงิน ซึ่งในล็อบบี้ PC คือทั้งแผ่นกว้าง)
      const icon = flyIcon(kind);
      if (icon) gsap.fromTo(icon, { scale: 1.5 }, { scale: 1, duration: .55, ease: 'back.out(3)', transformOrigin: '50% 50%', overwrite: 'auto', clearProps: 'transform' });
      els.forEach(el => gsap.fromTo(el, { scale: 1.18 }, { scale: 1, duration: .55, ease: 'back.out(3)', transformOrigin: '0% 50%', overwrite: 'auto', clearProps: 'transform' }));
    };

    fromRects.forEach((r, k) => {
      const x = r.left + r.width / 2, y = r.top + r.height / 2;
      fx.burst(host, x, y, { delay: k * .12, count: 16 });
      fx.reward(host, { x, y }, targets, { delay: k * .12, coins: per, shards: Math.max(2, per - 2), onArrive });
    });
    // กันพลาด: ถ้าไม่มีชิ้นไหนถึงเป้า (เช่นแท็บถูกซ่อน) ก็ยังเดินตัวเลขให้
    setTimeout(() => { onArrive('coins'); onArrive('shards'); }, 2500);

    const pop = document.createElement('span');
    pop.className = 'qb-fx-gain';
    pop.innerHTML = `<b>${shop.COIN_SVG}+${fmt(gain.coins)}</b><b>${shop.SHARD_SVG}+${fmt(gain.shards)}</b>`;
    const r0 = fromRects[0];
    pop.style.cssText = `position:${host === document.body ? 'fixed' : 'absolute'};left:${r0.left + r0.width / 2 - base.left}px;top:${r0.top - base.top}px`;
    host.appendChild(pop);
    gsap.fromTo(pop, { xPercent: -100, y: 6, opacity: 0, scale: .8 }, { y: -30, opacity: 1, scale: 1, duration: .4, ease: 'back.out(2)' });
    gsap.to(pop, { y: -48, opacity: 0, duration: .45, delay: 1.2, ease: 'power1.in', onComplete: () => pop.remove() });
  }

  /* ---------------- เหตุการณ์ ---------------- */
  const dlg = document.getElementById('lb-quests-dialog');
  const side = panel.parentElement;

  panel.addEventListener('click', e => {
    const t = e.target.closest('button');
    if (!t) return;
    if (t.classList.contains('qb-close')) closeSheet();
    else if (t.dataset.tab && t.dataset.tab !== tab) {
      tab = t.dataset.tab;
      render();
      panel.querySelector('.qb-list').classList.add('is-swap');
    } else if (t.dataset.claim) claim([t.dataset.claim]);
    else if (t.classList.contains('qb-claim-all')) claim(questsOf(tab).filter(q => q.state === 'ready').map(q => q.id));
  });
  panel.addEventListener('keydown', e => {
    if ((e.key === 'ArrowRight' || e.key === 'ArrowLeft') && e.target.matches('[role="tab"]')) {
      tab = tab === 'daily' ? 'weekly' : 'daily';
      render();
      panel.querySelector(`[data-tab="${tab}"]`).focus();
    }
  });

  let queued = false;
  document.addEventListener('bof:economy', () => {
    if (queued || muted) return;
    queued = true;
    requestAnimationFrame(() => { queued = false; render(); });
  });

  // นาฬิกานับถอยหลัง: อัปเดตทุก 20 วิ เฉพาะตอนเห็นแผง · ข้ามรอบแล้ววาดใหม่ (เควสต์รีเซ็ต)
  setInterval(() => {
    if (document.hidden || !panel.offsetParent) return;
    const ms = resetMs();
    if (ms < 20000) { setTimeout(render, ms + 1000); return; }
    const el = panel.querySelector('.qb-timer b');
    if (el) el.textContent = timeLeft(ms);
  }, 20000);

  /* ---------------- มือถือ: แผ่นล่าง · ปุ่มปิด · ปัดลงเพื่อปิด ---------------- */
  const sheet = dlg && dlg.querySelector('.lb-dialog-panel');
  function closeSheet() {
    if (!dlg || !dlg.open) return;
    if (!motionOK()) { dlg.close(); return; }
    gsap.to(sheet, { y: sheet.offsetHeight, duration: .24, ease: 'power2.in', onComplete: () => { dlg.close(); gsap.set(sheet, { clearProps: 'transform' }); } });
  }
  document.getElementById('lb-quest-btn')?.addEventListener('click', () => {
    if (!dlg) return;
    dlg.querySelector('.qb-dialog-slot').appendChild(panel);
    render();
    if (window.gsap) gsap.set(sheet, { clearProps: "transform" });
    dlg.showModal();
  });
  dlg?.addEventListener('close', () => { side.appendChild(panel); render(); });
  // แตะพื้นหลังนอกแผ่น = ปิด
  dlg?.addEventListener('click', e => { if (e.target === dlg) closeSheet(); });

  // ลากหัวแผ่นลงเพื่อปิด (ปุ่มในหัวยังกดได้ตามปกติ)
  if (sheet) {
    let y0 = 0, t0 = 0, dy = 0, dragging = false;
    sheet.addEventListener('pointerdown', e => {
      if (!dlg.open || e.target.closest('button') || !e.target.closest('.qb-head, .qb-grab, .qb-wallet')) return;
      dragging = true; y0 = e.clientY; t0 = performance.now(); dy = 0;
      sheet.setPointerCapture(e.pointerId);
    });
    sheet.addEventListener('pointermove', e => {
      if (!dragging) return;
      dy = Math.max(0, e.clientY - y0);
      if (window.gsap) gsap.set(sheet, { y: dy });
    });
    const end = () => {
      if (!dragging) return;
      dragging = false;
      const v = dy / Math.max(1, performance.now() - t0); // px/ms
      if (dy > 110 || (dy > 30 && v > .6)) closeSheet();
      else if (window.gsap) gsap.to(sheet, { y: 0, duration: .3, ease: "back.out(2)" });
    };
    sheet.addEventListener('pointerup', end);
    sheet.addEventListener('pointercancel', end);
  }

  render();
})();
