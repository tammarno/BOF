/* ============================================================================
   LOBBY MOTION (BOF v0.8) — โหลดหลัง vendor/gsap.min.js
   ชั่วคราว: คง API เดิมไว้ระหว่างเปลี่ยนหน้าล็อบบี้ (ฉบับเต็มอยู่ใน Task 4 ของแผน)
   ============================================================================ */
(function () {
  document.documentElement.classList.remove('lm-pre');
  const noop = () => {};
  window.LobbyMotion = { start: noop, stop: noop, isRunning: () => false, isPaused: () => false, _particleCount: () => 0, _particlesActive: () => false, _particlePos: () => ({ x: 0, y: 0 }) };
})();
