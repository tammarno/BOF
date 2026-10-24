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
    return [...legends, ...srs].slice(0, 9);
  }

  function normalizeRoomCode(raw) {
    const code = String(raw || '').trim().replace(/[๐-๙]/g, d => THAI_DIGITS.indexOf(d));
    return /^\d{4}$/.test(code) ? code : null;
  }

  window.LobbyData = { DECKS, rarityCounts, deckInfo, galleryCards, normalizeRoomCode };
})();
