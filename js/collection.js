/* ============================================================================
   COLLECTION (BOF v0.9) — หน้า "คลังการ์ด" แบบแฟ้มสะสม (โหลดหลัง shop.js)
   - วงแหวนความคืบหน้าการสะสม · ค้นหาชื่อ · กรองสายเด็ค (สีแผงเปลี่ยนตามเด็ค) และความแรร์
   - การ์ดที่ยังไม่มีเป็นเงามืดพร้อมแม่กุญแจ · แตะการ์ดเพื่อดูใบใหญ่ (holo.js)
   เป็น div ซ้อนทับ (ไม่ใช่ <dialog>) เพื่อให้หน้าต่างการ์ดใบใหญ่ (z-index 400) อยู่เหนือได้
   ============================================================================ */
(function () {
  const D = window.BOFDecks;
  if (!D || typeof CARD_DATABASE === 'undefined') return;
  const state = { deck: 'ALL', rarity: 'ALL', q: '' };
  let root = null, lastFocus = null;

  const esc = s => String(s).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
  const owned = () => {
    const eco = window.BOFShop && window.BOFShop.getEconomy ? window.BOFShop.getEconomy() : null;
    return (eco && eco.ownedCards) || {};
  };
  const chips = (list, active, attr, counts) => list.map(f => `
    <button type="button" class="fx-chip" role="radio" aria-checked="${f.key === active}" ${attr}="${f.key}" style="--chip-c:${f.c}">
      <span>${f.label}</span>${counts ? `<small>${counts[f.key] || 0}</small>` : ''}
    </button>`).join('');

  function build() {
    root = document.createElement('div');
    root.id = 'bof-collection';
    root.className = 'modal-overlay col-overlay';
    root.style.display = 'none';
    root.innerHTML = `
      <div class="col-box" role="dialog" aria-modal="true" aria-labelledby="col-title">
        <header class="col-head">
          <div class="col-ring" aria-hidden="true">
            <svg viewBox="0 0 44 44"><circle cx="22" cy="22" r="19" class="col-ring-bg"/><circle cx="22" cy="22" r="19" class="col-ring-fg" pathLength="100"/></svg>
            <b class="col-ring-n"></b>
          </div>
          <div class="col-title-wrap">
            <h2 id="col-title">คลังการ์ด</h2>
            <p class="col-sub"></p>
          </div>
          <label class="col-search">
            <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg>
            <input type="search" placeholder="ค้นหาชื่อการ์ด" aria-label="ค้นหาชื่อการ์ด" autocomplete="off">
          </label>
          <button type="button" class="col-x" aria-label="ปิดคลังการ์ด"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
        </header>
        <div class="col-filters">
          <div class="fx-chips" role="radiogroup" aria-label="สายเด็ค" data-g="deck"></div>
          <div class="fx-chips fx-chips-rarity" role="radiogroup" aria-label="ความแรร์" data-g="rarity"></div>
        </div>
        <div class="col-grid" role="list"></div>
        <p class="fx-empty col-empty" hidden>ไม่พบการ์ดที่ตรงกับตัวกรอง</p>
      </div>`;
    document.body.appendChild(root);

    root.addEventListener('click', e => {
      if (e.target === root || e.target.closest('.col-x')) { close(); return; }
      const deckChip = e.target.closest('[data-deck]');
      if (deckChip) { if (state.deck !== deckChip.dataset.deck) { state.deck = deckChip.dataset.deck; render(true); } return; }
      const rarChip = e.target.closest('[data-rar]');
      if (rarChip) { if (state.rarity !== rarChip.dataset.rar) { state.rarity = rarChip.dataset.rar; render(true); } return; }
      const card = e.target.closest('.col-card');
      if (card) inspect(card);
    });
    root.addEventListener('contextmenu', e => {
      const card = e.target.closest('.col-card'); if (!card) return;
      e.preventDefault(); inspect(card);
    });
    root.addEventListener('keydown', e => { if (e.key === 'Escape' && !document.body.classList.contains('holo-inspecting')) close(); });
    let t = null;
    root.querySelector('.col-search input').addEventListener('input', e => {
      clearTimeout(t);
      t = setTimeout(() => { state.q = e.target.value.trim().toLowerCase(); render(true); }, 120);
    });
  }

  function inspect(el) {
    const card = CARD_DATABASE.find(c => c.id === el.dataset.id);
    if (card && typeof window.openCardDetailModal === 'function') window.openCardDetailModal(card, null, el.querySelector('.col-art'));
  }

  function render(filtered) {
    const own = owned();
    const box = root.querySelector('.col-box');
    const accent = (D.DECK_FILTERS.find(d => d.key === state.deck) || D.DECK_FILTERS[0]).c;
    box.style.setProperty('--accent', accent);

    // สรุปการสะสม (ตามสายเด็คที่เลือก)
    const inDeck = CARD_DATABASE.filter(c => state.deck === 'ALL' || D.deckOfCard(c).key === state.deck);
    const have = inDeck.filter(c => Number(own[c.id] || 0) > 0).length;
    root.querySelector('.col-ring-fg').style.strokeDasharray = `${Math.round((have / Math.max(1, inDeck.length)) * 100)} 100`;
    root.querySelector('.col-ring-n').textContent = have;
    root.querySelector('.col-sub').textContent = `สะสมแล้ว ${have} จาก ${inDeck.length} แบบ · แตะการ์ดเพื่อดูใบใหญ่`;

    const deckCounts = { ALL: CARD_DATABASE.length };
    CARD_DATABASE.forEach(c => { const k = D.deckOfCard(c).key; deckCounts[k] = (deckCounts[k] || 0) + 1; });
    root.querySelector('[data-g="deck"]').innerHTML = chips(D.DECK_FILTERS, state.deck, 'data-deck', deckCounts);
    root.querySelector('[data-g="rarity"]').innerHTML = chips(D.RARITY_FILTERS, state.rarity, 'data-rar');

    const list = inDeck.filter(c =>
      (state.rarity === 'ALL' || c.rarity === state.rarity) &&
      (!state.q || String(c.name).toLowerCase().includes(state.q)));
    const grid = root.querySelector('.col-grid');
    grid.innerHTML = list.map(c => {
      const n = Number(own[c.id] || 0);
      const max = D.maxKeepOf(c);
      return `
        <button type="button" role="listitem" class="col-card r-${c.rarity} ${n ? 'is-owned' : 'is-locked'}" data-id="${c.id}" style="--c:${D.deckOfCard(c).c}" aria-label="${esc(c.name)} ${c.rarity}${n ? ` มี ${n} ใบ` : ' ยังไม่มี'}">
          <span class="col-art"><img src="${D.thumbOf(c.image)}" alt="" loading="lazy" draggable="false"><span class="col-shine" aria-hidden="true"></span>
            ${n ? '' : '<span class="col-lock" aria-hidden="true"><svg viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 018 0v3"/></svg></span>'}
          </span>
          <span class="col-name">${esc(c.name)}</span>
          <span class="col-meta"><i class="col-rar">${c.rarity}</i><span class="col-own">${n ? `×${Math.min(n, max)}` : 'ยังไม่มี'}</span></span>
        </button>`;
    }).join('');
    root.querySelector('.col-empty').hidden = list.length > 0;
    if (filtered) grid.dispatchEvent(new CustomEvent('fx:filter', { bubbles: true, detail: { grid } }));
  }

  function open() {
    if (window.BOFShop && window.BOFShop.reloadFromProfile) window.BOFShop.reloadFromProfile();
    if (!root) build();
    lastFocus = document.activeElement;
    render(false);
    root.style.display = 'flex';
    root.querySelector('.col-grid').scrollTop = 0;
    root.querySelector('.col-x').focus({ preventScroll: true });
  }
  function close() {
    if (!root) return;
    root.style.display = 'none';
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }

  window.BOFCollection = { open, close };
})();
