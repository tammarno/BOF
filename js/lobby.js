/* ============================================================================
   LOBBY (BOF v0.8) — โหลดหลัง game.js และ holo.js
   ข้อมูลของหน้าล็อบบี้สร้างจาก CARD_DATABASE ทั้งหมด (ไม่ฮาร์ดโค้ดตัวเลข)
   สเปก: docs/specs/2026-10-24-lobby-game-design.md
   ============================================================================ */
(function () {
  const RARITIES = ['SSR', 'SR', 'R', 'N'];
  const THAI_DIGITS = '๐๑๒๓๔๕๖๗๘๙';

  const DECKS = [
    { key: 'jit', leaderId: 'L01', name: 'เด็คจิต', style: 'เสริมพลังยูนิทเผ่าฮีโร่แล้วบุกให้แรงที่สุดในเทิร์นเดียว' },
    { key: 'nuea', leaderId: 'L02', name: 'เด็คเหนือ', style: 'ส่งไพร่และทหารลงสนามให้ครบทัพ แล้วชุบกลับจากนรกไม่รู้จบ' },
    { key: 'doom', leaderId: 'L03', name: 'เด็ควันสิ้นโลก', style: 'ปลุกยูนิทจากนรก แล้ววิวัฒน์สู่ร่างแห่งอนาคต' },
    { key: 'dino', leaderId: 'L04', name: 'เด็คไดโน', style: 'สะสมเผ่าไดโนและผสานร่างไฮบริดสุดแกร่งจากมิติมืด' },
    { key: 'demon', leaderId: 'L05', name: 'เด็คปีศาจ', style: 'สะสมการ์ดในมิติมืดและใช้พลังแห่งบาปทั้ง 7 พิชิตชัยชนะ' },
    { key: 'oat', leaderId: 'L06', name: 'เด็คโอ็ต', style: 'เปิดท็อปกองคอลพรรคพวกสายบ้าลงสนามและถล่มด้วยคอมโบสุดปั่น' },
  ];

  const byId = id => CARD_DATABASE.find(c => c.id === id);

  function rarityCounts() {
    const counts = { SSR: 0, SR: 0, R: 0, N: 0, total: 0 };
    for (const card of CARD_DATABASE) {
      const r = RARITIES.includes(card.rarity) ? card.rarity : 'N';
      counts[r]++; counts.total++;
    }
    return counts;
  }

  // เด็คมาตรฐาน = ลีดเดอร์ 1 + การ์ด 20 ใบ · cards คือการ์ดไม่ซ้ำ ไม่รวมลีดเดอร์
  function deckInfo(leaderId) {
    const leader = byId(leaderId);
    const list = getDefaultDeckForLeader(leaderId);
    const cards = [...new Set(list)].map(byId).filter(Boolean);
    return { leader, cards, total: list.length + 1, hp: leader.maxHp };
  }

  function normalizeRoomCode(raw) {
    const code = String(raw || '').trim().replace(/[๐-๙]/g, d => THAI_DIGITS.indexOf(d));
    return /^\d{4}$/.test(code) ? code : null;
  }

  // ภาพย่อ WebP (สร้างด้วย tools/make-thumbs.js): images/เด็คจิต/3.png → images/thumbs/เด็คจิต/3.webp
  const thumbOf = card => card.image.replace(/^images\//, 'images/thumbs/').replace(/\.png$/, '.webp');

  // เด็คมาตรฐาน (L01–L04) หรือเด็คที่ผู้เล่นบันทึกไว้ ('mine') → ลีดเดอร์ + การ์ดไม่ซ้ำ
  function cardsOfDeck(key) {
    const cfg = key === 'mine' ? loadSavedDeck() : { leaderId: key, mainDeck: getDefaultDeckForLeader(key) };
    return [byId(cfg.leaderId), ...[...new Set(cfg.mainDeck)].map(byId)].filter(Boolean);
  }
  const legendCount = key => cardsOfDeck(key).filter(c => c.rarity === 'SSR').length;

  window.LobbyData = { DECKS, rarityCounts, deckInfo, normalizeRoomCode, thumbOf, cardsOfDeck, legendCount };

  /* ---------------- การแสดงผล (ล็อบบี้เกมหน้าจอเดียว v0.8) ---------------- */
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const DECK_COLOURS = { L01: '#3ee08f', L02: '#f0a347', L03: '#5fd0ff', L04: '#a3e635', L05: '#c084fc', L06: '#fb923c' };
  const STANDARD = ['L01', 'L02', 'L03', 'L04', 'L05', 'L06'];
  const small = () => matchMedia('(max-width: 767px)').matches;
  const wallSize = () => (small() ? { cols: 6, rows: 6 } : { cols: 12, rows: 5 });

  const hasSavedDeck = () => {
    try {
      const d = JSON.parse(localStorage.getItem('my_card_game_deck'));
      // ต้องเป็นลีดเดอร์ที่มีอยู่จริง (เด็คเก่า/แก้มือ/เสียหาย อาจมี leaderId แปลก ๆ)
      return !!(d && STANDARD.includes(d.leaderId) && Array.isArray(d.mainDeck) && d.mainDeck.length === 20);
    } catch (e) { return false; }
  };
  const leaderIdOf = key => (key === 'mine' ? loadSavedDeck().leaderId : key);
  const randomOf = list => list[Math.floor(Math.random() * list.length)];

  // ภาพย่อ: ถ้าโหลดไม่ได้ สลับไปใช้ภาพเต็มครั้งเดียว
  function setThumb(img, card) {
    img.onerror = () => { img.onerror = null; img.src = card.image; };
    img.src = thumbOf(card);
  }
  function thumbImg(card, cls) {
    const img = new Image();
    img.alt = ''; img.decoding = 'async';
    if (cls) img.className = cls;
    setThumb(img, card);
    return img;
  }

  function renderWall(key) {
    const inner = $('#lb-wall .lb-wall-inner'); if (!inner) return;
    const { cols, rows } = wallSize();
    const cards = cardsOfDeck(key);
    inner.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    const tiles = [];
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const card = randomOf(cards);
      const tile = document.createElement('div');
      tile.className = 'lb-tile'; tile.dataset.r = r; tile.dataset.c = c; tile.dataset.cardId = card.id;
      tile.appendChild(thumbImg(card, 'front')); tiles.push(tile);
    }
    inner.replaceChildren(...tiles);
  }

  function getSavedDeckName() {
    try {
      const d = loadSavedDeck();
      if (d && d.name) return d.name;
    } catch (e) {}
    return 'เด็คของฉัน';
  }

  function renderInfo(key) {
    const leaderId = leaderIdOf(key);
    const info = deckInfo(leaderId);
    const deck = DECKS.find(d => d.leaderId === leaderId);
    $('#lobby-screen').style.setProperty('--deck', DECK_COLOURS[leaderId]);
    $('.lb-deck-name').textContent = key === 'mine' ? getSavedDeckName() : deck.name;
    $('.lb-leader-name').textContent = info.leader.name;
    $('.lb-deck-style').textContent = key === 'mine' ? `สล็อตเด็คจัดเอง (${deck.name})` : deck.style;
    $('.lb-chips').replaceChildren(...[`HP ${info.hp}`, `${info.total} ใบ`, `SSR ${legendCount(key)}`].map(t => {
      const s = document.createElement('span'); s.textContent = t; return s;
    }));
  }

  // keepOld: เก็บใบเดิมไว้ให้ lobby-motion.js หมุนออก แล้วลบทิ้งหลัง 0.45 วิ (ใบล่าสุดอยู่ท้ายเสมอ)
  function renderLeader(key, keepOld = false) {
    const box = $('#lb-leader'); if (!box) return;
    const leader = byId(leaderIdOf(key));
    const img = new Image(); img.src = leader.image; img.alt = leader.name; img.decoding = 'async';
    box.onclick = () => {
      if (typeof window.openCardDetailModal === 'function') {
        window.openCardDetailModal(leader, null, box);
      }
    };
    if (!keepOld) { box.replaceChildren(img); return; }
    const old = [...box.querySelectorAll('img')];
    old.forEach(o => o.setAttribute('aria-hidden', 'true'));
    box.appendChild(img);
    setTimeout(() => old.forEach(o => o.remove()), 450);
  }

  // ข้อมูล ลีดเดอร์ และกำแพงของเด็ค แบบทันที (lobby-motion.js ใส่ท่าทางให้เอง)
  function renderDeck(key) {
    renderInfo(key);
    renderLeader(key);
    renderWall(key);
  }

  function deckDisplayName(key) {
    if (key === 'mine') {
      const lid = leaderIdOf('mine');
      const d = DECKS.find(item => item.leaderId === lid);
      return d ? `เด็คของฉัน (${d.name})` : 'เด็คของฉัน';
    }
    const found = DECKS.find(d => d.leaderId === key);
    return found ? found.name : key;
  }

  function updateDeckPickerButton() {
    const pickerBtn = $('#lb-deck-picker-btn');
    if (!pickerBtn) return;
    const leaderId = leaderIdOf(selected);
    const leader = byId(leaderId);
    const deck = DECKS.find(d => d.leaderId === leaderId);
    const thumb = pickerBtn.querySelector('.lb-deck-picker-thumb');
    if (thumb && leader) setThumb(thumb, leader);
    const nameEl = pickerBtn.querySelector('.lb-deck-picker-name');
    const slotNum = (window.BOFDeckSlots && typeof window.BOFDeckSlots.getActiveSlotIndex === 'function')
      ? window.BOFDeckSlots.getActiveSlotIndex() + 1
      : 1;
    if (nameEl) nameEl.textContent = selected === 'mine' ? `[สล็อต #${slotNum}] ${getSavedDeckName()}` : (deck ? deck.name : selected);
    const countEl = pickerBtn.querySelector('.lb-deck-picker-sub');
    if (countEl) countEl.textContent = selected === 'mine' ? `กำลังใช้สล็อตเด็คจัดเอง #${slotNum}` : `เลือกได้จาก 6 เด็คหลัก & 5 สล็อตจัดเอง`;
  }

  function ensureDeckPickerDialog() {
    let dlg = $('#lb-deck-picker-dialog');
    if (dlg) return dlg;
    const lobby = $('#lobby-screen');
    if (!lobby) return null;
    dlg = document.createElement('dialog');
    dlg.id = 'lb-deck-picker-dialog';
    dlg.className = 'lb-dialog lb-dialog-dark';
    dlg.setAttribute('aria-labelledby', 'lb-deck-picker-title');
    dlg.innerHTML = `
      <div class="lb-dialog-panel lb-deck-picker-panel">
        <div class="lb-deck-picker-head">
          <div>
            <h2 id="lb-deck-picker-title">เลือกเด็คสำหรับดวล</h2>
            <p class="lb-deck-picker-desc">เด็คที่เลือกจะใช้ในการดวลครั้งถัดไป</p>
          </div>
          <button type="button" class="lb-deck-picker-x" data-close aria-label="ปิด">✕</button>
        </div>
        <div class="lb-deck-picker-body">
          <h3 class="lb-picker-section">เด็คหลัก</h3>
          <div id="lb-deck-picker-grid" class="lb-deck-picker-grid" role="listbox" aria-label="เด็คหลัก"></div>
          <div id="lb-deck-picker-slots" class="lb-deck-picker-slots"></div>
        </div>
        <div class="lb-deck-picker-footer">
          <button type="button" class="lb-deck-picker-builder-btn" id="lb-deck-picker-builder">จัดเด็คของฉัน</button>
          <button type="button" class="lb-dialog-close" data-close>ปิดหน้าต่าง</button>
        </div>
      </div>
    `;
    lobby.appendChild(dlg);
    dlg.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', () => dlg.close()));
    dlg.addEventListener('click', e => {
      if (e.target === dlg) dlg.close();
    });
    dlg.querySelector('#lb-deck-picker-builder')?.addEventListener('click', () => {
      dlg.close();
      $('#nav-deck')?.click();
    });
    dlg.querySelector('#lb-deck-picker-grid')?.addEventListener('click', e => {
      const cardBtn = e.target.closest('.lb-picker-item');
      if (!cardBtn) return;
      const key = cardBtn.dataset.deck;
      dlg.close();
      if (key) selectDeck(key); // selectDeck จัดการกำแพงเอง — renderDeck ซ้ำจะสร้างกำแพงใหม่ทับคลื่นพลิกไพ่
    });
    return dlg;
  }

  function renderDeckPickerGrid() {
    const dlg = ensureDeckPickerDialog();
    if (!dlg) return;

    const slotsBox = dlg.querySelector('#lb-deck-picker-slots');
    if (slotsBox && window.BOFDeckSlots && typeof window.BOFDeckSlots.getState === 'function') {
      const st = window.BOFDeckSlots.getState();
      const activeIdx = st.activeSlot || 0;
      const isUsingMine = selected === 'mine';
      // ปุ่มสล็อตเด็คจัดเอง: กดครั้งเดียวใช้ทันที (เดิมเป็น select + ปุ่มยืนยัน)
      const head = document.createElement('h3');
      head.className = 'lb-picker-section';
      head.textContent = 'เด็คที่จัดเอง';
      const row = document.createElement('div');
      row.className = 'lb-slot-row';
      row.setAttribute('role', 'listbox');
      row.setAttribute('aria-label', 'เด็คที่จัดเอง');
      st.slots.forEach((s, idx) => {
        const leader = byId(s.leaderId || 'L01') || byId('L01');
        const on = isUsingMine && idx === activeIdx;
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'lb-slot-chip' + (on ? ' is-selected' : '');
        b.dataset.slot = idx;
        b.setAttribute('role', 'option');
        b.setAttribute('aria-selected', String(on));
        b.style.setProperty('--item-accent', DECK_COLOURS[leader.id] || '#f3c969');
        const num = document.createElement('span'); num.className = 'lb-slot-num'; num.textContent = idx + 1;
        const name = document.createElement('span'); name.className = 'lb-slot-name'; name.textContent = s.name || `เด็คจัดเอง #${idx + 1}`;
        b.append(thumbImg(leader), num, name);
        row.appendChild(b);
      });
      slotsBox.replaceChildren(head, row);

      const applyChosenSlot = (idx) => {
        window.BOFDeckSlots.selectSlot(idx);
        dlg.close();
        refreshMine();
        selectDeck('mine', true); // force: สลับสล็อตแต่ยังเป็น 'mine' ก็ต้องพลิกกำแพง
      };

      row.onclick = e => {
        const chip = e.target.closest('.lb-slot-chip');
        if (chip) applyChosenSlot(Number(chip.dataset.slot));
      };
    }

    const grid = dlg.querySelector('#lb-deck-picker-grid');
    if (!grid) return;
    // แสดงเฉพาะ 6 เด็คหลัก (STANDARD) เพราะเด็คจัดเองเลือกจากช้อยส์สล็อตด้านบนแล้ว
    const keys = [...STANDARD];
    grid.replaceChildren(...keys.map(key => {
      const leaderId = leaderIdOf(key);
      const leader = byId(leaderId);
      const deck = DECKS.find(d => d.leaderId === leaderId);
      const isSelected = key === selected;
      const accent = DECK_COLOURS[leaderId] || '#f3c969';

      const item = document.createElement('button');
      item.type = 'button';
      item.className = `lb-picker-item${isSelected ? ' is-selected' : ''}`;
      item.dataset.deck = key;
      item.style.setProperty('--item-accent', accent);
      item.setAttribute('role', 'option');
      item.setAttribute('aria-selected', String(isSelected));

      const artWrap = document.createElement('div');
      artWrap.className = 'lb-picker-art';
      artWrap.appendChild(thumbImg(leader));
      const meta = document.createElement('div');
      meta.className = 'lb-picker-meta';
      const title = document.createElement('strong');
      title.className = 'lb-picker-name';
      title.textContent = deck ? deck.name : key;
      const sub = document.createElement('span');
      sub.className = 'lb-picker-leader';
      sub.textContent = leader.name;
      const style = document.createElement('span');
      style.className = 'lb-picker-style';
      style.textContent = deck ? deck.style : '';
      meta.append(title, sub, style);

      item.append(artWrap, meta);
      if (isSelected) {
        const activeTag = document.createElement('span');
        activeTag.className = 'lb-picker-tag';
        activeTag.textContent = 'กำลังใช้';
        item.appendChild(activeTag);
      }
      return item;
    }));
  }

  function openDeckPickerModal() {
    renderDeckPickerGrid();
    const dlg = ensureDeckPickerDialog();
    if (dlg && !dlg.open) dlg.showModal();
  }

  function renderDeckButtons() {
    const box = $('#lb-decks'); if (!box) return;
    const keys = [...STANDARD, ...(hasSavedDeck() ? ['mine'] : [])];
    const thumbBtns = keys.map(key => {
      const btn = document.createElement('button');
      btn.type = 'button'; btn.className = 'lb-deck'; btn.dataset.deck = key;
      btn.setAttribute('aria-pressed', 'false');
      btn.setAttribute('aria-label', key === 'mine' ? 'เด็คของฉัน' : DECKS.find(d => d.leaderId === key).name);
      btn.appendChild(thumbImg(byId(leaderIdOf(key))));
      if (key === 'mine') {
        const tag = document.createElement('span'); tag.className = 'lb-deck-mine-tag'; tag.textContent = 'ของฉัน';
        btn.appendChild(tag);
      }
      return btn;
    });

    const pickerBtn = document.createElement('button');
    pickerBtn.type = 'button';
    pickerBtn.id = 'lb-deck-picker-btn';
    pickerBtn.className = 'lb-deck-picker-btn';
    pickerBtn.setAttribute('aria-haspopup', 'dialog');
    pickerBtn.innerHTML = `
      <img class="lb-deck-picker-thumb" src="" alt="">
      <span class="lb-deck-picker-info">
        <small class="lb-deck-picker-sub">มีให้เลือกครบ ${keys.length} เด็ค</small>
        <b class="lb-deck-picker-name">เด็คจิต</b>
      </span>
      <span class="lb-deck-picker-cta">🃏 กดเลือกเด็ค ▾</span>
    `;
    pickerBtn.addEventListener('click', e => {
      e.stopPropagation();
      openDeckPickerModal();
    });

    box.replaceChildren(...thumbBtns, pickerBtn);
    updateDeckPickerButton();
  }

  function renderCounts() {
    const c = rarityCounts();
    const el = $('[data-counts]');
    if (el) el.textContent = `การ์ดทั้งหมด ${c.total} ใบ · SSR ${c.SSR} · SR ${c.SR} · R ${c.R} · N ${c.N} · เด็คละ 21 ใบ`;
  }

  /* ---------------- หน้าต่าง ---------------- */
  // ชิปบอกเด็คที่กำลังจะเล่น (รูปลีดเดอร์ + ชื่อเด็ค) ในหน้าต่างเลือกโหมด
  function renderModeDeck() {
    const chip = $('#lb-mode-dialog .lb-mode-deck'); if (!chip) return;
    const leader = byId(leaderIdOf(selected));
    setThumb(chip.querySelector('img'), leader);
    chip.querySelector('b').textContent = selected === 'mine' ? getSavedDeckName() : DECKS.find(d => d.leaderId === selected).name;
  }

  function bindDialogs() {
    const open = id => () => $(id)?.showModal();
    $('#lb-play')?.addEventListener('click', () => { renderModeDeck(); $('#lb-mode-dialog').showModal(); });
    $('#nav-howto')?.addEventListener('click', open('#lb-howto-dialog'));
    const shuffleSwitch = $('#lb-setting-shuffle');
    $('#nav-settings')?.addEventListener('click', () => {
      if (shuffleSwitch && window.HandShuffle) shuffleSwitch.checked = HandShuffle.enabled();
      $('#lb-settings-dialog')?.showModal();
    });
    shuffleSwitch?.addEventListener('change', () => { if (window.HandShuffle) HandShuffle.setEnabled(shuffleSwitch.checked); });
    $('#lb-mode-close')?.addEventListener('click', () => $('#lb-mode-dialog').close());
    $$('#lobby-screen dialog [data-close]').forEach(b => b.addEventListener('click', () => b.closest('dialog').close()));
    // มือถือ: ฟอร์มเข้าห้องย้ายเข้า dialog ตอนเปิด แล้วย้ายกลับตอนปิด
    const joinDialog = $('#lb-join-dialog'); if (!joinDialog) return;
    $('#nav-join')?.addEventListener('click', () => {
      joinDialog.querySelector('.lb-join-dialog-slot').appendChild($('#lb-join'));
      joinDialog.showModal(); $('#lb-join-code').focus();
    });
    joinDialog.addEventListener('close', () => $('.lb-join-slot').appendChild($('#lb-join')));
  }

  /* ---------------- เข้าห้องด้วยรหัส ---------------- */
  function bindJoinForm() {
    const form = $('#lb-join'); if (!form) return;
    const input = $('#lb-join-code');
    const error = $('#lb-join-error');
    form.addEventListener('submit', e => {
      e.preventDefault();
      const code = normalizeRoomCode(input.value);
      if (!code) {
        error.textContent = 'กรอกรหัสห้องเป็นเลข 4 หลัก';
        input.setAttribute('aria-invalid', 'true');
        input.focus();
        return;
      }
      error.textContent = '';
      input.removeAttribute('aria-invalid');
      if ($('#lb-join-dialog')?.open) $('#lb-join-dialog').close();
      applySelectedDeck();
      window.joinPvpRoomAsGuest(code); // เรียกผ่าน window ให้เทสต์แทนที่ได้
    });
    input.addEventListener('input', () => { if (error.textContent) { error.textContent = ''; input.removeAttribute('aria-invalid'); } });
  }

  /* ---------------- เด็คที่เลือก ---------------- */
  const STORE = 'bof_lobby_deck';
  const validKey = key => STANDARD.includes(key) || (key === 'mine' && hasSavedDeck());
  function initialDeck() {
    let stored = null;
    try { stored = localStorage.getItem(STORE); } catch (e) {}
    if (validKey(stored)) return stored;
    return hasSavedDeck() ? 'mine' : 'L01'; // 'mine' ที่เด็คบันทึกหายไปแล้วก็ถอยมาที่นี่
  }
  let selected = 'L01';

  function markPressed() {
    $$('.lb-deck').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.deck === selected)));
    updateDeckPickerButton();
  }

  function selectDeck(key, force = false) {
    if (!validKey(key) || (key === selected && !force)) return;
    const prev = selected;
    selected = key;
    try { localStorage.setItem(STORE, key); } catch (e) {}
    markPressed();
    // ขณะ motion ทำงาน: lobby-motion.js พลิกกำแพงและหมุนลีดเดอร์เอง (ฟัง lobby:deck)
    if (window.LobbyMotion && LobbyMotion.isRunning()) { renderInfo(key); renderLeader(key, true); }
    else renderDeck(key);
    $('#lb-decks')?.dispatchEvent(new CustomEvent('lobby:deck', { detail: { key, prev } }));
  }

  // ตั้งเด็คที่จะใช้เล่นจริง (ในหน่วยความจำเท่านั้น — ไม่เขียน my_card_game_deck)
  function applySelectedDeck() {
    currentDeckConfig = selected === 'mine'
      ? loadSavedDeck()
      : { leaderId: selected, mainDeck: [...getDefaultDeckForLeader(selected)] };
  }

  function refreshMine() {
    renderDeckButtons();
    if (!validKey(selected)) { selected = 'L01'; renderDeck(selected); }
    markPressed();
  }

  function bindDeckSelection() {
    $('#lb-decks')?.addEventListener('click', e => {
      const btn = e.target.closest('.lb-deck'); if (btn) selectDeck(btn.dataset.deck);
    });
    // ปุ่มในหน้าต่างเลือกโหมด: ตั้งเด็คแล้วปิดหน้าต่าง ก่อน handler เดิมของ game.js (capture)
    ['#btn-lobby-bot', '#btn-lobby-pvp'].forEach(id => $(id)?.addEventListener('click', () => {
      applySelectedDeck();
      const dialog = $('#lb-mode-dialog'); if (dialog?.open) dialog.close();
    }, true));
    // หน้าจัดเด็คต้องเริ่มจากเด็คที่บันทึกไว้ ไม่ใช่เด็คที่ล็อบบี้ตั้งไว้ตอนเล่นรอบก่อน
    // (ไม่งั้นกดบันทึกแล้วเด็คที่จัดเองจะถูกเขียนทับ) — capture: ก่อน openDeckBuilder ของ game.js
    $('#nav-deck')?.addEventListener('click', () => { currentDeckConfig = loadSavedDeck(); }, true);
    // ล็อบบี้ถูกซ่อน (เข้าเกม): ปิด dialog ที่ค้าง ไม่งั้น showModal ทำให้กระดานเกมกดไม่ได้
    new MutationObserver(() => {
      if ($('#lobby-screen').style.display === 'none') $$('#lobby-screen dialog[open]').forEach(d => d.close());
    }).observe($('#lobby-screen'), { attributes: true, attributeFilter: ['style'] });
    // เปลี่ยนขนาดข้าม 767px (หมุนจอ): สร้างกำแพงใหม่ให้จำนวนช่องตรงกับ layout
    const mql = matchMedia('(max-width: 767px)');
    const onResizeBp = () => renderWall(selected);
    if (mql.addEventListener) mql.addEventListener('change', onResizeBp);
    else if (mql.addListener) mql.addListener(onResizeBp);
    // บันทึกในหน้าจัดเด็คแล้ว: แสดงและเลือก "เด็คของฉัน" (หลัง handler ของ game.js เขียน localStorage)
    $('#btn-save-start')?.addEventListener('click', () => setTimeout(() => { refreshMine(); selectDeck('mine', true); }, 0));
  }

  function render() {
    renderDeckButtons();
    renderCounts();
    selected = initialDeck();
    renderDeck(selected);
    markPressed();
  }

  window.LobbyView = { render, renderDeck, wallSize, selectDeck, applySelectedDeck, refreshMine, selectedDeck: () => selected };
  render();
  bindDialogs();
  bindJoinForm();
  bindDeckSelection();
  // ถอดรหัสภาพลีดเดอร์ล่วงหน้าเฉพาะบน Desktop (บนมือถือ iOS Safari / Samsung Browser การ decode PNG ใหญ่ 6 ใบพร้อมกันอาจทำให้เกิน RAM limit ของแท็บ)
  if (!small()) {
    setTimeout(() => DECKS.forEach(d => {
      const i = new Image();
      i.src = byId(d.leaderId).image;
      if (typeof i.decode === 'function') i.decode().catch(() => {});
    }), 1800);
  }
  // ลีดเดอร์เอียงตามเมาส์ (holo.js ใส่ --rx/--ry ให้ #lb-leader · มือถือไม่เอียง)
  if (window.HoloTilt) HoloTilt.bind($('.lb-leader-wrap'), 8, '.lb-leader');
})();
