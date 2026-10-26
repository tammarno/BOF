/* ============================================================================
   CHOICE UI (BOF v0.5) — โหลดหลัง game.js, vendor/gsap.min.js, ui-motion.js
   ห่อ showChoiceModal ของ game.js (ไม่แก้ตรรกะเกม) แล้วตกแต่งตามสถานการณ์:
   - ยืนยัน: ไอคอนใหญ่ในวงแหวน · ยืนยันการ์ด = รูปการ์ด + กล่องความสามารถ
   - ชนะ / แพ้: เต็มจอ ป้าย VICTORY / DEFEAT พร้อมเอฟเฟกต์
   - ปุ่ม: แปลงสีที่เกมส่งมาเป็นชุดสีของธีม
   ============================================================================ */
(function () {
  const orig = window.showChoiceModal;
  if (typeof orig !== 'function') return;
  const hasGsap = typeof gsap !== 'undefined';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches || !hasGsap;
  const EMOJI = /^\s*(\p{Extended_Pictographic}(?:️|‍\p{Extended_Pictographic})*)\s*/u;
  // สีเดิมจาก game.js → ปุ่มตามธีม
  const BTN = { '#16a34a': 'primary', '#dc2626': 'danger', '#475569': 'ghost', '#3b82f6': 'ice', '#0284c7': 'ice', '#7c3aed': 'arcane', '#6366f1': 'arcane', '#d97706': 'amber' };
  let live = []; // tween/timeline ของหน้าต่างรอบปัจจุบัน

  function cleanup(modal) {
    live.forEach(t => t && t.kill && t.kill()); live = [];
    modal.querySelectorAll('.um-x').forEach(n => n.remove());
    document.querySelectorAll('.um-spark').forEach(n => n.remove());
    modal.classList.remove('um-choice', 'um-end', 'um-victory', 'um-defeat', 'um-tone-danger', 'um-tone-arcane', 'um-has-card-grid');
    const box = modal.querySelector('.modal-box');
    if (box && hasGsap) gsap.set([box, ...box.children, ...box.querySelectorAll('#choice-modal-buttons .btn')], { clearProps: 'transform,opacity' });
  }

  function themeButtons(modal) {
    modal.querySelectorAll('#choice-modal-buttons .btn').forEach((b, i) => {
      const raw = (b.style.background || '').trim();
      const hex = raw.startsWith('rgb') ? rgbToHex(raw) : raw.toLowerCase();
      const kind = BTN[hex] || (i === 0 ? 'primary' : 'ghost');
      b.classList.add('um-btn-' + kind);
      b.style.background = '';
    });
  }
  function rgbToHex(s) {
    const m = s.match(/\d+/g); if (!m) return s;
    return '#' + m.slice(0, 3).map(n => (+n).toString(16).padStart(2, '0')).join('');
  }

  function iconRing(glyph) {
    const ring = document.createElement('div'); ring.className = 'um-choice-icon um-x'; ring.setAttribute('aria-hidden', 'true');
    ring.innerHTML = `<span class="um-ico-glyph">${glyph}</span>`;
    return ring;
  }

  function findCard(title) {
    const m = title.match(/การ์ด:\s*(.+?)(?:\s*\(Power:.*\))?\s*$/);
    if (!m || typeof CARD_DATABASE === 'undefined') return null;
    return CARD_DATABASE.find(c => c.name === m[1].trim()) || null;
  }

  function findCardInButtonLabel(label) {
    if (typeof CARD_DATABASE === 'undefined' || !Array.isArray(CARD_DATABASE)) return null;
    const quoted = label.match(/"([^"]+)"/);
    if (quoted) {
      const exact = CARD_DATABASE.find(c => c.name === quoted[1].trim() && c.type !== 'Leader');
      if (exact) return exact;
    }
    return null;
  }

  function stripCardNameFromCaption(label, cardName) {
    let s = label.replace(`"${cardName}"`, '').replace(cardName, '');
    s = s.replace(/\(\s*Power\s*\d+\s*\)/gi, '').replace(/\s{2,}/g, ' ').trim();
    return s || 'เลือกใบนี้';
  }

  function convertCardButtonsToGrid(modal) {
    const container = modal.querySelector('#choice-modal-buttons');
    if (!container) return;
    const buttons = [...container.querySelectorAll('.btn')];
    const matched = buttons.map(btn => ({ btn, card: findCardInButtonLabel(btn.textContent || '') }));
    const cardEntries = matched.filter(x => x.card);
    if (cardEntries.length === 0) return;

    modal.classList.add('um-has-card-grid');
    const grid = document.createElement('div');
    grid.className = 'um-card-pick-grid um-x';
    container.parentNode.insertBefore(grid, container);

    const owner = (typeof gameState !== 'undefined' && gameState) ? gameState.player : null;
    cardEntries.forEach(({ btn, card }, idx) => {
      const rawText = (btn.textContent || '').trim();
      const zoneMatch = rawText.match(/\[([^\]]+)\]/);
      const zoneBadgeText = zoneMatch ? zoneMatch[1] : '';
      const actionCaption = stripCardNameFromCaption(rawText.replace(/\[[^\]]+\]/g, ''), card.name);

      const item = document.createElement('div');
      item.className = 'um-card-pick-item' + (btn.disabled ? ' is-disabled' : '');

      let cardEl;
      if (typeof window.createCardElement === 'function') {
        cardEl = window.createCardElement(card, owner);
      } else {
        cardEl = document.createElement('div');
        cardEl.className = `card ${card.type}`;
        cardEl.innerHTML = `<div class="card-art"><img src="${card.image}" alt="${card.name}"></div><div class="card-name">${card.name}</div>`;
      }

      if (zoneBadgeText) {
        const badge = document.createElement('span');
        badge.className = 'um-pick-zone-badge';
        badge.textContent = zoneBadgeText;
        cardEl.appendChild(badge);
      }

      const cap = document.createElement('span');
      cap.className = 'um-pick-caption';
      cap.textContent = actionCaption;

      item.appendChild(cardEl);
      item.appendChild(cap);

      if (!btn.disabled) {
        item.addEventListener('click', (e) => {
          if (e.target.closest('.holo-info-btn')) return;
          if (typeof hideCardTooltip === 'function') hideCardTooltip();
          btn.click();
        });
      }

      btn.style.display = 'none';
      grid.appendChild(item);

      if (!reduce) {
        live.push(gsap.from(item, {
          y: 18,
          scale: 0.92,
          opacity: 0,
          duration: 0.32,
          delay: 0.06 + idx * 0.045,
          ease: 'back.out(1.6)',
          clearProps: 'transform,opacity'
        }));
      }
    });

    if (typeof window.HoloTilt !== 'undefined' && window.HoloTilt && typeof window.HoloTilt.bind === 'function') {
      window.HoloTilt.bind(grid, 10);
    }
  }

  // ---------- ตกแต่ง ----------
  function decorate(title, description) {
    const modal = document.getElementById('custom-choice-modal'); if (!modal) return;
    cleanup(modal);
    const box = modal.querySelector('.modal-box');
    const h2 = modal.querySelector('#choice-modal-title'), desc = modal.querySelector('#choice-modal-desc');
    const em = title.match(EMOJI);
    const glyph = em ? em[1] : '';
    const text = em ? title.slice(em[0].length) : title;
    const victory = /ชนะ/.test(title) && !/ยืนยัน/.test(title);
    const defeat = /พ่ายแพ้/.test(title) && !/ยืนยัน/.test(title);
    themeButtons(modal);

    if (victory || defeat) {
      modal.classList.add('um-end', victory ? 'um-victory' : 'um-defeat');
      const ring = iconRing(glyph || (victory ? '🏆' : '💀'));
      const word = document.createElement('span'); word.className = 'um-end-word um-x';
      const W = victory ? 'VICTORY' : 'DEFEAT';
      word.innerHTML = [...W].map(c => `<span class="um-end-char">${c}</span>`).join('');
      word.setAttribute('aria-label', W);
      h2.textContent = text;
      box.insertBefore(word, h2); box.insertBefore(ring, word);
      const glow = document.createElement('div'); glow.className = 'um-end-glow um-x'; glow.style.top = (word.offsetTop + 10) + 'px'; box.insertBefore(glow, ring);
      if (victory) { const burst = document.createElement('div'); burst.className = 'um-burst um-x'; box.prepend(burst); }
      else { const vig = document.createElement('div'); vig.className = 'um-vignette um-x'; modal.prepend(vig); }
      if (!reduce) (victory ? animateVictory : animateDefeat)(modal, box, ring, word);
      return;
    }

    modal.classList.add('um-choice');
    const card = findCard(title);
    if (/ยอมแพ้|ทำลาย|ทิ้ง/.test(title)) modal.classList.add('um-tone-danger');
    else if (/⚡|สกิล|ความสามารถ/.test(title)) modal.classList.add('um-tone-arcane');
    h2.textContent = text;

    let ring = null;
    if (card) {
      // แยก "📜 ความสามารถ:" ออกจากคำถาม แล้ววางคู่กับรูปการ์ด
      const [question, ability] = description.split(/\n*📜\s*ความสามารถ:\s*\n?/);
      desc.textContent = (question || '').trim();
      const row = document.createElement('div'); row.className = 'um-card-row um-x';
      const img = document.createElement('img'); img.src = card.image; img.alt = card.name; img.decoding = 'async';
      const ab = document.createElement('div'); ab.className = 'um-ability';
      if (card.type === 'Monster') ab.insertAdjacentHTML('beforeend', `<span class="um-stat">⚔️ พลังโจมตี ${card.power}</span>`);
      const lab = document.createElement('span'); lab.className = 'um-ability-label'; lab.textContent = 'ความสามารถ';
      ab.appendChild(lab); ab.appendChild(document.createTextNode((ability || '').trim() || '—'));
      row.appendChild(img); row.appendChild(ab);
      desc.after(row);
      if (!reduce) live.push(gsap.from(row.children, { x: i => (i ? 18 : -18), opacity: 0, duration: .35, stagger: .06, delay: .08, ease: 'power3.out' }));
    } else {
      if (glyph) {
        ring = iconRing(glyph); box.insertBefore(ring, h2);
      }
      // หากเป็นหน้าต่างค้นหา/เลือกการ์ดที่มีความสามารถต่อท้าย ให้ซ่อนส่วน "📜 ความสามารถ:" เพื่อให้แสดงผลรูปการ์ดได้เต็มตา
      if (/\n*📜\s*ความสามารถ:/.test(description)) {
        const [question] = description.split(/\n*📜\s*ความสามารถ:\s*\n?/);
        desc.textContent = (question || '').trim();
      }
      convertCardButtonsToGrid(modal);
    }
    if (!reduce) animateConfirm(box, ring, glyph);
  }

  // ---------- แอนิเมชัน ----------
  function animateConfirm(box, ring, glyph) {
    live.push(gsap.fromTo(box, { scale: .92, opacity: 0, y: 10 }, { scale: 1, opacity: 1, y: 0, duration: .3, ease: 'back.out(1.6)' }));
    if (!ring) return;
    const g = ring.firstChild;
    live.push(gsap.fromTo(ring, { scale: 0, rotation: -25 }, { scale: 1, rotation: 0, duration: .5, delay: .05, ease: 'back.out(2.2)' }));
    // ลูปตามไอคอน: ธงโบก · กะโหลกหายใจ · อื่น ๆ ลอยขึ้นลง
    if (/🏳|🚩|🏴/.test(glyph)) live.push(gsap.to(g, { rotation: 10, transformOrigin: '20% 90%', duration: .7, yoyo: true, repeat: -1, ease: 'sine.inOut', delay: .5 }));
    else if (/💀|☠/.test(glyph)) live.push(gsap.to(g, { scale: 1.08, duration: 1.2, yoyo: true, repeat: -1, ease: 'sine.inOut', delay: .5 }));
    else live.push(gsap.to(g, { y: -4, duration: 1.4, yoyo: true, repeat: -1, ease: 'sine.inOut', delay: .5 }));
  }
  function animateVictory(modal, box, ring, word) {
    const burst = box.querySelector('.um-burst');
    const tl = gsap.timeline();
    tl.fromTo(burst, { scale: .2, opacity: 0 }, { scale: 1.6, opacity: 1, duration: .45, ease: 'power2.out' }, 0)
      .to(burst, { opacity: 0, duration: .9, ease: 'power1.in' }, .45)
      .fromTo(ring, { scale: 0, rotation: -40 }, { scale: 1, rotation: 0, duration: .6, ease: 'back.out(2.4)' }, .05)
      .from(word.children, { y: -60, scale: 1.6, opacity: 0, duration: .45, stagger: .05, ease: 'back.out(2)' }, .15)
      .from([box.querySelector('#choice-modal-title'), box.querySelector('#choice-modal-desc')], { y: 14, opacity: 0, duration: .35, stagger: .06 }, .55)
      // ขยับกล่องที่ครอบปุ่ม ไม่ขยับตัวปุ่ม: ตัวปุ่มมีเอฟเฟกต์ชี้เมาส์ของ ui-motion อยู่ ถ้าขยับซ้อนกันแอนิเมชันจะตัดกันจนปุ่มค้างล่องหน
      .fromTo(box.querySelector('#choice-modal-buttons'), { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: .4, ease: 'back.out(2)' }, .7);
    live.push(tl);
    // ประกายทองกระจายออก (18 จุด, transform/opacity ล้วน, ลบตัวเองเมื่อจบ)
    for (let i = 0; i < 18; i++) {
      const s = document.createElement('i'); s.className = 'um-spark'; box.appendChild(s);
      const a = Math.random() * Math.PI * 2, d = 140 + Math.random() * 260;
      gsap.fromTo(s, { x: 0, y: 0, scale: .4 + Math.random() * .9, opacity: 1 },
        { x: Math.cos(a) * d, y: Math.sin(a) * d * .7 + 60, opacity: 0, duration: 1 + Math.random() * .8, delay: .1 + Math.random() * .2, ease: 'power3.out', onComplete: () => s.remove(), onInterrupt: () => s.remove() });
    }
    live.push(gsap.to(ring.firstChild, { y: -5, duration: 1.4, yoyo: true, repeat: -1, ease: 'sine.inOut', delay: 1.2 }));
    live.push(gsap.to(word, { scale: 1.03, duration: 1.8, yoyo: true, repeat: -1, ease: 'sine.inOut', delay: 1.4 }));
  }
  function animateDefeat(modal, box, ring, word) {
    const vig = modal.querySelector('.um-vignette');
    const tl = gsap.timeline();
    tl.fromTo(vig, { opacity: 0 }, { opacity: 1, duration: .8, ease: 'power2.out' }, 0)
      .fromTo(ring, { scale: 1.6, opacity: 0 }, { scale: 1, opacity: 1, duration: .35, ease: 'power3.in' }, .1)
      .to(ring, { keyframes: { x: [-8, 8, -6, 6, -3, 0] }, duration: .4, ease: 'none' }, .45)
      .from(word.children, { y: 30, opacity: 0, duration: .6, stagger: .07, ease: 'power4.out' }, .35)
      .from([box.querySelector('#choice-modal-title'), box.querySelector('#choice-modal-desc')], { opacity: 0, duration: .5, stagger: .1 }, .8)
      .fromTo(box.querySelector('#choice-modal-buttons'), { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: .4 }, 1);
    live.push(tl);
    live.push(gsap.to(vig, { opacity: .55, duration: 2.4, yoyo: true, repeat: -1, ease: 'sine.inOut', delay: 1 }));
    live.push(gsap.to(ring.firstChild, { scale: 1.08, duration: 1.2, yoyo: true, repeat: -1, ease: 'sine.inOut', delay: 1 }));
  }

  // ---------- ห่อฟังก์ชันของเกม ----------
  window.showChoiceModal = function (title, description, options) {
    const r = orig.apply(this, arguments);
    try { decorate(String(title || ''), String(description || '')); } catch (e) { console.warn('[choice-ui]', e); }
    return r;
  };

  // หยุดลูปเมื่อหน้าต่างถูกปิด (game.js ซ่อนด้วย style.display = 'none')
  const watch = () => {
    const modal = document.getElementById('custom-choice-modal'); if (!modal || modal.dataset.umWatch) return;
    modal.dataset.umWatch = '1';
    new MutationObserver(() => { if (modal.style.display === 'none') cleanup(modal); }).observe(modal, { attributes: true, attributeFilter: ['style'] });
  };
  new MutationObserver(watch).observe(document.body, { childList: true });
  watch();
})();
