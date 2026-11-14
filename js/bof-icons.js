/* ============================================================================
   BOF ICONS: ชุดไอคอนเส้น SVG ประจำเกม (แทนอีโมจิในแถบควบคุม หน้าจบเกม และประวัติการต่อสู้)
   ใช้ currentColor → สีตาม CSS ของปุ่ม · ขนาด 1em → ตามขนาดตัวอักษร
   BOFIcon('sword')  → สตริง <svg> · ชิ้นส่วนที่มี class (เช่น .i-wave) ใช้ทำโมชั่นใน CSS ได้
   ============================================================================ */
(function () {
  const P = {
    // ดาบไขว้: ต่อสู้ / โจมตี
    sword: '<path d="M14.5 17.5 3 6V3h3l11.5 11.5"/><path d="m13 19 6-6"/><path d="m16 16 4 4"/><path d="m19 21 2-2"/>' +
      '<path class="i-x2" d="M9.5 17.5 21 6V3h-3L6.5 14.5"/><path class="i-x2" d="m11 19-6-6"/><path class="i-x2" d="m8 16-4 4"/><path class="i-x2" d="m5 21-2-2"/>',
    // ข้ามไปเฟสถัดไป: ลูกศรสองชั้น + เส้นจบ
    skip: '<path class="i-a1" d="m4 5 7 7-7 7"/><path class="i-a2" d="m11 5 7 7-7 7"/><path d="M20 5v14"/>',
    hourglass: '<path d="M6 2h12M6 22h12"/><path class="i-sand" d="M7 2c0 5 5 6.5 5 10s-5 5-5 10M17 2c0 5-5 6.5-5 10s5 5 5 10"/><path class="i-grain" d="M10 19h4" />',
    flag: '<path d="M5 22V3"/><path class="i-cloth" d="M5 4c3-1.6 5.5 1.6 8.5 0S18 3 19 3.6v9c-1 .6-2.5-.6-5.5 1s-5.5-1.6-8.5 0"/>',
    sound: '<path d="M4 9.5v5h3.5L12 19V5L7.5 9.5z" fill="currentColor" fill-opacity=".18"/><path class="i-wave i-w1" d="M15.5 9a4 4 0 0 1 0 6"/><path class="i-wave i-w2" d="M18.5 6.5a8 8 0 0 1 0 11"/>',
    mute: '<path d="M4 9.5v5h3.5L12 19V5L7.5 9.5z" fill="currentColor" fill-opacity=".18"/><path d="m16 9.5 5 5m0-5-5 5"/>',
    // ประกาย 4 แฉก: เวทปกติ
    spark: '<path d="M12 2.5c.6 4.6 2.4 6.4 7 7-4.6.6-6.4 2.4-7 7-.6-4.6-2.4-6.4-7-7 4.6-.6 6.4-2.4 7-7z" fill="currentColor" fill-opacity=".22"/><path d="M19 15.5c.3 2 1 2.7 3 3-2 .3-2.7 1-3 3-.3-2-1-2.7-3-3 2-.3 2.7-1 3-3z"/>',
    // โล่: เวทสวนกลับ (Reaction)
    shield: '<path d="M12 2.5 4 5.5v6c0 5 3.4 8.7 8 10 4.6-1.3 8-5 8-10v-6z" fill="currentColor" fill-opacity=".18"/><path d="m8.5 12 2.5 2.5 4.5-5"/>',
    crown: '<path d="M3 8.5 7 12l5-7 5 7 4-3.5-2 10H5z" fill="currentColor" fill-opacity=".2"/><path d="M5 21.5h14"/><circle cx="12" cy="4.2" r=".9" fill="currentColor"/>',
    skull: '<path d="M12 2.5c-4.7 0-8 3.2-8 7.6 0 2.5 1.1 4.1 2.6 5.1V18a1.5 1.5 0 0 0 1.5 1.5h7.8a1.5 1.5 0 0 0 1.5-1.5v-2.8c1.5-1 2.6-2.6 2.6-5.1 0-4.4-3.3-7.6-8-7.6z" fill="currentColor" fill-opacity=".16"/>' +
      '<circle cx="8.8" cy="11" r="1.8" fill="currentColor"/><circle cx="15.2" cy="11" r="1.8" fill="currentColor"/><path d="M11 15.5h2M10 19.5v2M14 19.5v2"/>',
    rematch: '<path d="M20 11a8 8 0 0 0-14.5-4.5L3.5 9"/><path d="M3.5 4v5h5"/><path d="M4 13a8 8 0 0 0 14.5 4.5l2-2.5"/><path d="M20.5 20v-5h-5"/>',
    home: '<path d="M3.5 11 12 3.5l8.5 7.5"/><path d="M5.5 9.5V20h4.5v-5.5h4V20h4.5V9.5" fill="currentColor" fill-opacity=".15"/>',
    scroll: '<path d="M7 3.5h11a2 2 0 0 1 2 2v1H9"/><path d="M7 3.5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V6.5" fill="currentColor" fill-opacity=".12"/><path d="M9 10h6M9 13.5h6M9 17h4"/>',
    close: '<path d="m6 6 12 12M18 6 6 18"/>',
    summon: '<rect x="5" y="3" width="11" height="15" rx="2" fill="currentColor" fill-opacity=".15"/><path d="M8 21h10a2 2 0 0 0 2-2V7"/><path d="M10.5 8v5M8 10.5h5"/>',
    all: '<rect x="3.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.5"/>',
    bell: '<path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z" fill="currentColor" fill-opacity=".15"/><path d="M10 21h4"/>',
    bolt: '<path d="M13.5 2.5 5 13.5h6l-1 8 8.5-11h-6z" fill="currentColor" fill-opacity=".2"/>',
    coin: '<circle cx="12" cy="12" r="9" fill="currentColor" fill-opacity=".25"/><circle cx="12" cy="12" r="5.5"/><path d="M12 9.5v5"/>',
    chevron: '<path d="m9 5 7 7-7 7"/>',
    eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>'
  };

  function BOFIcon(name, cls) {
    const body = P[name];
    if (!body) return '';
    return `<svg class="bof-i bof-i-${name}${cls ? ' ' + cls : ''}" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
  }

  window.BOFIcon = BOFIcon;
})();
