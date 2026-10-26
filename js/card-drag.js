// ลากการ์ดจากมือลงสนาม: ลูกศรเล็ง → การ์ดพุ่งโค้งลงช่อง → เรียกตัวจัดการคลิกช่องเดิมของ game.js
(function () {
  'use strict';

  const CardDrag = {};
  // การ์ดที่มีเมนูของตัวเองตอนกดจากมือ → ใช้การคลิกเหมือนเดิม
  const MENU_IDS = ['DM07', 'NM01', 'NM02', 'NM03'];

  let busy = false;
  CardDrag.isBusy = function () { return busy; };

  // 'board' = ลงช่องฝั่งเรา, 'spy' = ลงช่องว่างฝั่งศัตรู, null = ลากไม่ได้ (ใช้คลิก)
  CardDrag.canDrag = function (card, gs) {
    if (gs === undefined && typeof gameState !== 'undefined') gs = gameState;
    if (!card || !gs) return null;
    if (gs.activeTurn !== 'player' || gs.phase !== 'Main Phase' || gs.pendingAction || gs.gameOver || gs.isRollingDice) return null;
    if (window.HandShuffle && HandShuffle.isBusy()) return null;
    if (typeof isChoiceModalOpen === 'function' && isChoiceModalOpen()) return null;
    if (card.type !== 'Monster' || card.id === 'M04' || card.cannotNormalSummon || card.futureBaseId || MENU_IDS.includes(card.id)) return null;
    if (card.id === 'NM05' || card.isSpy) return 'spy';
    return 'board';
  };

  window.CardDrag = CardDrag;
})();
