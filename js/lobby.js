/* ============================================================================
   LOBBY (BOF v0.7) — โหลดหลัง game.js และ holo.js
   ข้อมูลของหน้าล็อบบี้สร้างจาก CARD_DATABASE ทั้งหมด (ไม่ฮาร์ดโค้ดตัวเลข)
   สเปก: docs/specs/2026-10-24-lobby-redesign-design.md
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

  function galleryCards() {
    const legends = CARD_DATABASE.filter(c => c.rarity === 'Legend');
    const srs = CARD_DATABASE.filter(c => c.rarity === 'SR');
    return [...legends, ...srs].slice(0, 7);
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

  window.LobbyData = { DECKS, rarityCounts, deckInfo, galleryCards, normalizeRoomCode, thumbOf, cardsOfDeck, legendCount };

  /* ---------------- การแสดงผล ---------------- */
  const DECK_COLOURS = {
    L01: ['#0f4d3c', '#3ee08f'],
    L02: ['#6b2430', '#f0a347'],
    L03: ['#142a52', '#5fd0ff'],
  };
  const $ = s => document.querySelector(s);
  const deckKeyOfImage = src => (src.includes('เด็คเหนือ') ? 'nuea' : src.includes('วันสิ้นโลก') ? 'doom' : 'jit');

  function cardFigure(card, { lazy = true } = {}) {
    const fig = document.createElement('figure');
    fig.className = 'lb-card';
    fig.dataset.rarity = card.rarity || 'N';
    fig.dataset.cardId = card.id;
    const img = document.createElement('img');
    img.src = card.image; img.alt = card.name; img.width = 750; img.height = 1050; img.decoding = 'async';
    if (lazy) img.loading = 'lazy';
    fig.appendChild(img);
    return fig;
  }

  function renderStats() {
    const c = rarityCounts();
    document.querySelectorAll('[data-stat="total"]').forEach(el => { el.textContent = c.total; });
    document.querySelectorAll('.lb-receipt tbody tr[data-rar]').forEach(tr => { tr.querySelector('td.num').textContent = c[tr.dataset.rar]; });
    const all = $('#lb-gallery-all'); if (all) all.textContent = `ดูการ์ดทั้งหมด ${c.total} ใบ`;
  }

  function renderLeaders() {
    const box = $('.lb-leaders'); if (!box) return;
    box.replaceChildren(...DECKS.map(d => cardFigure(byId(d.leaderId), { lazy: false })));
  }

  // เติมเวทีของเด็ค (ใช้ทั้งตอนโหลดและตอนสลับเด็ค)
  function renderStage(leaderId) {
    const deck = DECKS.find(d => d.leaderId === leaderId) || DECKS[0];
    const info = deckInfo(deck.leaderId);
    const stage = $('.lb-stage'); if (!stage) return;
    const [bg, hi] = DECK_COLOURS[deck.leaderId];
    stage.style.setProperty('--stage', bg);
    stage.style.setProperty('--stage-hi', hi);
    stage.querySelector('.lb-stage-leader strong').textContent = info.leader.name;
    stage.querySelector('.lb-stage-facts').textContent = `HP ${info.hp} · ${info.total} ใบ`;
    stage.querySelector('.lb-stage-style').textContent = deck.style;
    $('#lb-deck-all').textContent = `ดูทั้ง ${info.cards.length + 1} ใบในเด็ค`;
    stage.querySelector('.lb-stage-cards').replaceChildren(cardFigure(info.leader), ...info.cards.map(c => cardFigure(c)));
  }

  function renderGallery() {
    const grid = $('.lb-grid'); if (!grid) return;
    const cards = galleryCards();
    const words = ['LEGEND', 'SR', 'R', 'N'];
    const rarOf = { LEGEND: 'Legend', SR: 'SR', R: 'R', N: 'N' };
    const tiles = [];
    cards.forEach((card, i) => {
      const btn = document.createElement('button');
      btn.type = 'button'; btn.className = 'lb-tile lb-tile-card';
      btn.dataset.cardId = card.id; btn.dataset.deck = deckKeyOfImage(card.image);
      const cap = document.createElement('span'); cap.className = 'lb-tile-cap'; cap.textContent = card.name;
      btn.append(cardFigure(card), cap);
      tiles.push(btn);
      if ((i % 2 === 1 || i === cards.length - 1) && words.length) {
        const w = words.shift();
        const tile = document.createElement('div');
        tile.className = 'lb-tile lb-tile-word'; tile.dataset.rar = rarOf[w];
        const word = document.createElement('span'); word.textContent = w; tile.appendChild(word);
        tiles.push(tile);
      }
    });
    grid.querySelectorAll('.lb-tile-card, .lb-tile-word').forEach(el => el.remove());
    $('#lb-gallery-all').before(...tiles);
  }

  /* ---------------- เลือกเด็ค (live thing) ---------------- */
  let selected = 'L01';

  function selectDeck(leaderId) {
    if (!DECKS.some(d => d.leaderId === leaderId)) return;
    selected = leaderId;
    document.querySelectorAll('.lb-deck-btn').forEach(btn => btn.setAttribute('aria-pressed', String(btn.dataset.leader === leaderId)));
    renderStage(leaderId);
    $('#lb-decks')?.dispatchEvent(new CustomEvent('lobby:deck', { detail: { leaderId } }));
  }

  // เด็คมาตรฐานถูกตั้งตอนเลือกโหมดเท่านั้น (ในหน่วยความจำ ไม่เขียน localStorage)
  // ถ้ากดยกเลิก/Esc เด็คเดิมของผู้เล่นต้องอยู่ครบ
  function playSelectedDeck() {
    $('#lb-mode-dialog')?.showModal();
  }
  function useSelectedDeck() {
    currentDeckConfig = { leaderId: selected, mainDeck: [...getDefaultDeckForLeader(selected)] };
  }

  function bindDeckPicker() {
    document.querySelectorAll('.lb-deck-btn').forEach(btn => btn.addEventListener('click', () => selectDeck(btn.dataset.leader)));
    $('#lb-play-deck')?.addEventListener('click', playSelectedDeck);
    $('#lb-deck-all')?.addEventListener('click', e => {
      e.preventDefault();
      const info = deckInfo(selected);
      const deck = DECKS.find(d => d.leaderId === selected);
      openZoneViewerModal(`การ์ดใน${deck.name}`, [info.leader, ...info.cards], null);
    });
    const dialog = $('#lb-mode-dialog');
    if (!dialog) return;
    const route = id => () => { useSelectedDeck(); dialog.close(); $(id)?.click(); };
    // (ปุ่มใน dialog เรียกปุ่มเดิมของ Hero เพื่อใช้ flow เดียวกันทุกอย่าง)
    $('#lb-mode-pvp')?.addEventListener('click', route('#btn-lobby-pvp'));
    $('#lb-mode-bot')?.addEventListener('click', route('#btn-lobby-bot'));
    $('#lb-mode-close')?.addEventListener('click', () => dialog.close());
  }

  /* ---------------- เข้าห้องจาก Hero ---------------- */
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
      window.joinPvpRoomAsGuest(code); // เรียกผ่าน window ให้เทสต์แทนที่ได้
    });
    input.addEventListener('input', () => { if (error.textContent) { error.textContent = ''; input.removeAttribute('aria-invalid'); } });
  }

  function render() {
    renderStats();
    renderLeaders();
    renderStage(selected);
    renderGallery();
  }

  window.LobbyView = { render, renderStage, cardFigure, selectDeck, selectedDeck: () => selected };
  // การ์ดในแกลเลอรีเปิดหน้า Inspect เดิมของ holo.js · การ์ดลีดเดอร์และแกลเลอรีเอียงตามเมาส์
  function bindCards() {
    $('.lb-grid')?.addEventListener('click', e => {
      const tile = e.target.closest('.lb-tile-card'); if (!tile) return;
      window.openCardDetailModal(byId(tile.dataset.cardId), null, tile.querySelector('.lb-card'));
    });
    if (window.HoloTilt) {
      HoloTilt.bind($('.lb-leaders'), 10, '.lb-card');
      HoloTilt.bind($('.lb-grid'), 10, '.lb-card');
    }
  }

  render();
  bindDeckPicker();
  bindJoinForm();
  bindCards();
})();
