/* ============================================================================
   LOBBY (BOF v0.8) — โหลดหลัง game.js และ holo.js
   ข้อมูลของหน้าล็อบบี้สร้างจาก CARD_DATABASE ทั้งหมด (ไม่ฮาร์ดโค้ดตัวเลข)
   สเปก: docs/specs/2026-10-24-lobby-game-design.md
   ============================================================================ */
(function () {
  const RARITIES = ['Legend', 'SR', 'R', 'N'];
  const THAI_DIGITS = '๐๑๒๓๔๕๖๗๘๙';

  const DECKS = [
    { key: 'jit', leaderId: 'L01', name: 'เด็คจิต', style: 'เสริมพลังยูนิทแล้วบุกให้แรงที่สุดในเทิร์นเดียว' },
    { key: 'nuea', leaderId: 'L02', name: 'เด็คเหนือ', style: 'ส่งไพร่และทหารลงสนามให้ครบทัพ แล้วชุบกลับจากนรกไม่รู้จบ' },
    { key: 'doom', leaderId: 'L03', name: 'เด็ควันสิ้นโลก', style: 'ปลุกยูนิทจากนรก แล้ววิวัฒน์สู่ร่างแห่งอนาคต' },
  ];

  const byId = id => CARD_DATABASE.find(c => c.id === id);

  function rarityCounts() {
    const counts = { Legend: 0, SR: 0, R: 0, N: 0, total: 0 };
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

  // เด็คมาตรฐาน (L01–L03) หรือเด็คที่ผู้เล่นบันทึกไว้ ('mine') → ลีดเดอร์ + การ์ดไม่ซ้ำ
  function cardsOfDeck(key) {
    const cfg = key === 'mine' ? loadSavedDeck() : { leaderId: key, mainDeck: getDefaultDeckForLeader(key) };
    return [byId(cfg.leaderId), ...[...new Set(cfg.mainDeck)].map(byId)].filter(Boolean);
  }
  const legendCount = key => cardsOfDeck(key).filter(c => c.rarity === 'Legend').length;

  window.LobbyData = { DECKS, rarityCounts, deckInfo, normalizeRoomCode, thumbOf, cardsOfDeck, legendCount };

  /* ---------------- การแสดงผล (ล็อบบี้เกมหน้าจอเดียว v0.8) ---------------- */
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const DECK_COLOURS = { L01: '#3ee08f', L02: '#f0a347', L03: '#5fd0ff' };
  const STANDARD = ['L01', 'L02', 'L03'];
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

  function renderInfo(key) {
    const leaderId = leaderIdOf(key);
    const info = deckInfo(leaderId);
    const deck = DECKS.find(d => d.leaderId === leaderId);
    $('#lobby-screen').style.setProperty('--deck', DECK_COLOURS[leaderId]);
    $('.lb-deck-name').textContent = key === 'mine' ? 'เด็คของฉัน' : deck.name;
    $('.lb-leader-name').textContent = info.leader.name;
    $('.lb-deck-style').textContent = key === 'mine' ? `จัดเองจาก${deck.name}` : deck.style;
    $('.lb-chips').replaceChildren(...[`HP ${info.hp}`, `${info.total} ใบ`, `Legend ${legendCount(key)}`].map(t => {
      const s = document.createElement('span'); s.textContent = t; return s;
    }));
  }

  // keepOld: เก็บใบเดิมไว้ให้ lobby-motion.js หมุนออก แล้วลบทิ้งหลัง 0.45 วิ (ใบล่าสุดอยู่ท้ายเสมอ)
  function renderLeader(key, keepOld = false) {
    const box = $('#lb-leader'); if (!box) return;
    const leader = byId(leaderIdOf(key));
    const img = new Image(); img.src = leader.image; img.alt = leader.name; img.decoding = 'async';
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

  function renderDeckButtons() {
    const box = $('#lb-decks'); if (!box) return;
    const keys = [...STANDARD, ...(hasSavedDeck() ? ['mine'] : [])];
    box.replaceChildren(...keys.map(key => {
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
    }));
  }

  function renderCounts() {
    const c = rarityCounts();
    const el = $('[data-counts]');
    if (el) el.textContent = `การ์ดทั้งหมด ${c.total} ใบ · Legend ${c.Legend} · SR ${c.SR} · R ${c.R} · N ${c.N} · เด็คละ 21 ใบ`;
  }

  /* ---------------- หน้าต่าง ---------------- */
  // ชิปบอกเด็คที่กำลังจะเล่น (รูปลีดเดอร์ + ชื่อเด็ค) ในหน้าต่างเลือกโหมด
  function renderModeDeck() {
    const chip = $('#lb-mode-dialog .lb-mode-deck'); if (!chip) return;
    const leader = byId(leaderIdOf(selected));
    setThumb(chip.querySelector('img'), leader);
    chip.querySelector('b').textContent = selected === 'mine' ? 'เด็คของฉัน' : DECKS.find(d => d.leaderId === selected).name;
  }

  function bindDialogs() {
    const open = id => () => $(id)?.showModal();
    $('#lb-play')?.addEventListener('click', () => { renderModeDeck(); $('#lb-mode-dialog').showModal(); });
    $('#nav-howto')?.addEventListener('click', open('#lb-howto-dialog'));
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
  }

  function selectDeck(key) {
    if (!validKey(key) || key === selected) return;
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
    matchMedia('(max-width: 767px)').addEventListener('change', () => renderWall(selected));
    // บันทึกในหน้าจัดเด็คแล้ว: แสดงและเลือก "เด็คของฉัน" (หลัง handler ของ game.js เขียน localStorage)
    $('#btn-save-start')?.addEventListener('click', () => setTimeout(() => { refreshMine(); selectDeck('mine'); renderDeck(selected); }, 0));
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
  // ถอดรหัสภาพลีดเดอร์ทุกเด็คไว้ก่อน (PNG ~1MB) — ไม่งั้นถอดรหัสตอนสลับเด็คแล้วเฟรมสะดุด
  // ทำหลังฉากเปิดจบ (≈1.6 วิ) เพื่อไม่แย่งเฟรมของฉากเปิด
  setTimeout(() => DECKS.forEach(d => { const i = new Image(); i.src = byId(d.leaderId).image; i.decode().catch(() => {}); }), 1800);
  // ลีดเดอร์เอียงตามเมาส์ (holo.js ใส่ --rx/--ry ให้ #lb-leader · มือถือไม่เอียง)
  if (window.HoloTilt) HoloTilt.bind($('.lb-leader-wrap'), 8, '.lb-leader');
})();

