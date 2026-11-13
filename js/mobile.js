/* ============================================================================
   BOF มือถือ: สัมผัส (โหลดเป็นไฟล์สุดท้าย) — ทำงานเฉพาะเมื่อ html.is-mobile
   สั่นเบา ๆ เมื่อแตะสิ่งที่กดได้ในเกม (Android · iOS ไม่รองรับ vibrate จะข้ามเอง)
   ============================================================================ */
(function () {
  const canBuzz = typeof navigator.vibrate === 'function' && !matchMedia('(prefers-reduced-motion: reduce)').matches;
  const buzz = ms => { if (canBuzz && window.isMobileUI && window.isMobileUI()) try { navigator.vibrate(ms); } catch (e) { /* บางเบราว์เซอร์บล็อกก่อนผู้ใช้แตะ */ } };
  window.BOFHaptic = buzz;

  const TAP = '#player-hand .card, #bof-game-arena .slot, #bof-game-arena .leader-card-slot, .btn, button, .lb-menu-item, .lb-mode';
  document.addEventListener('pointerdown', e => {
    if (e.pointerType !== 'touch') return;
    const t = e.target.closest && e.target.closest(TAP);
    if (t && !t.disabled) buzz(t.matches('#btn-pass-turn-inline') ? 14 : 8);
  }, { capture: true, passive: true });
})();
