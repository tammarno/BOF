/* ============================================================================
   SHOP, FOIL SHOWCASE & BOOSTER PACK SYSTEM (BOF)
   - เรทการสุ่มต่อใบ (ซองละ 5 ใบ รวมการ์ด Leader SSR):
     N = 40% | R = 30% | SR = 20% | SSR = 10%
   - สุ่ม 1 ซอง (5 ใบ) = 200 Coins
   - สุ่ม 10 ซอง (50 ใบ) = ลดราคา 10% เหลือ 1,800 Coins (จากปกติ 2,000 Coins)
   - เรียงลำดับการ์ดที่สุ่มได้จากความแรร์น้อยไปมาก (ซ้าย -> ขวา: N -> R -> SR -> SSR)
   - แอนิเมชันเปิดซองสุ่มการ์ด: 🌌 วงเวทมิติพลังงาน (Dimensional Portal Summon)
   - หลังจบแอนิเมชันจะเด้งหน้าต่างป๊อปอัปแสดงผลการเปิดซองขึ้นมากลางจอทันที
   ============================================================================ */
(function () {
  const GUEST_ECONOMY_KEY = 'bof_guest_economy_v2';
  const STARTING_COINS = 2000;
  const PACK_PRICE = 200;
  const TEN_PACK_DISCOUNT = 0.10; // ลด 10%
  const TEN_PACK_PRICE = Math.round(PACK_PRICE * 10 * (1 - TEN_PACK_DISCOUNT)); // 1,800 Coins
  const CARDS_PER_PACK = 5;

  // เรทการออกของแต่ละใบในซอง (รวม 100%)
  const RARITY_RATES = { N: 40, R: 30, SR: 20, SSR: 10 };
  // ลำดับความแรร์จากน้อยไปมาก (ซ้ายไปขวา)
  const RARITY_ORDER = { N: 1, R: 2, SR: 3, SSR: 4 };

  // ตู้ซองสุ่มการ์ดแยกตาม 6 เด็คหลัก (รวมการ์ด Leader ระดับ SSR ในแต่ละซองด้วย)
  const FACTION_PACKS = [
    {
      id: 'pack_jit',
      name: 'ซองเด็คจิต',
      sub: 'สุ่มการ์ดสายเด็คจิต (มีโอกาสออก Leader มายฮีโร่ เดจิต SSR!)',
      color: '#3ee08f',
      image: 'images/เด็คจิต/1.png',
      prefix: 'images/เด็คจิต/',
      price: PACK_PRICE,
      tenPrice: TEN_PACK_PRICE
    },
    {
      id: 'pack_nuea',
      name: 'ซองขุนเหนือ',
      sub: 'สุ่มการ์ดสายเด็คเหนือ (มีโอกาสออก Leader ขุนเหนือ SSR!)',
      color: '#5eb8ff',
      image: 'images/เด็คเหนือ/1.png',
      prefix: 'images/เด็คเหนือ/',
      price: PACK_PRICE,
      tenPrice: TEN_PACK_PRICE
    },
    {
      id: 'pack_doom',
      name: 'ซองวันสิ้นโลก',
      sub: 'สุ่มการ์ดสายวันสิ้นโลก (มีโอกาสออก Leader วันสิ้นโลก SSR!)',
      color: '#ff6470',
      image: 'images/วันสิ้นโลก/1.png',
      prefix: 'images/วันสิ้นโลก/',
      price: PACK_PRICE,
      tenPrice: TEN_PACK_PRICE
    },
    {
      id: 'pack_dino',
      name: 'ซองศูนย์วิจัยไดโน',
      sub: 'สุ่มการ์ดสายไดโนเสาร์ (มีโอกาสออก Leader ศูนย์วิจัยไดโน SSR!)',
      color: '#f5b841',
      image: 'images/ไดโน/1.png',
      prefix: 'images/ไดโน/',
      price: PACK_PRICE,
      tenPrice: TEN_PACK_PRICE
    },
    {
      id: 'pack_demon',
      name: 'ซองเด็คปีศาจ',
      sub: 'สุ่มการ์ดสายเด็คปีศาจ (มีโอกาสออก Leader ปีศาจ SSR!)',
      color: '#c084fc',
      image: 'images/เด็คปีศาจ/1.png',
      prefix: 'images/เด็คปีศาจ/',
      price: PACK_PRICE,
      tenPrice: TEN_PACK_PRICE
    },
    {
      id: 'pack_oat',
      name: 'ซองเด็คโอ็ต',
      sub: 'สุ่มการ์ดสายเด็คโอ็ต (มีโอกาสออก Leader ไอโอ๊ตบ้าทุกสิ่ง SSR!)',
      color: '#fb923c',
      image: 'images/เด็คโอ๊ต/1.png',
      prefix: 'images/เด็คโอ๊ต/',
      price: PACK_PRICE,
      tenPrice: TEN_PACK_PRICE
    }
  ];

  // โหมด Guest มีการ์ดทุกใบครบจำนวนสูงสุดเพื่อทดลองเล่นได้ทุกเด็ค
  function getGuestFullOwned() {
    const map = {};
    if (typeof CARD_DATABASE !== 'undefined') {
      CARD_DATABASE.forEach(c => {
        map[c.id] = c.type === 'Leader' ? 1 : (c.maxCopies || 2);
      });
    }
    return map;
  }

  function isLoggedInUser() {
    return Boolean(
      window.BOFAuth &&
      typeof window.BOFAuth.currentUser === 'function' &&
      window.BOFAuth.currentUser()
    );
  }

  let economy = loadEconomy();

  function loadEconomy() {
    const user = window.BOFAuth && typeof window.BOFAuth.currentUser === 'function'
      ? window.BOFAuth.currentUser()
      : null;

    if (user) {
      return {
        coins: typeof user.coins === 'number' ? user.coins : STARTING_COINS,
        ownedCards: user.ownedCards && typeof user.ownedCards === 'object' ? { ...user.ownedCards } : {},
        packsOpened: Number(user.packsOpened || 0)
      };
    }

    let guestCoins = STARTING_COINS;
    let guestPacks = 0;
    try {
      const savedGuest = JSON.parse(localStorage.getItem(GUEST_ECONOMY_KEY));
      if (savedGuest && typeof savedGuest.coins === 'number') {
        guestCoins = savedGuest.coins;
        guestPacks = Number(savedGuest.packsOpened || 0);
      }
    } catch (e) {}

    return {
      coins: guestCoins,
      ownedCards: getGuestFullOwned(),
      packsOpened: guestPacks
    };
  }

  function saveEconomy() {
    if (isLoggedInUser()) {
      if (window.BOFAuth && typeof window.BOFAuth.syncEconomy === 'function') {
        window.BOFAuth.syncEconomy(economy);
      }
    } else {
      try {
        localStorage.setItem(GUEST_ECONOMY_KEY, JSON.stringify({
          coins: economy.coins,
          packsOpened: economy.packsOpened
        }));
      } catch (e) {}
    }
    updateCoinDisplays();
  }

  function updateCoinDisplays() {
    const fmt = Number(economy.coins || 0).toLocaleString('th-TH');
    const lobbyCoinVal = document.getElementById('lb-coin-val');
    if (lobbyCoinVal) lobbyCoinVal.textContent = fmt;
    const shopCoinVal = document.getElementById('bof-shop-coin-val');
    if (shopCoinVal) shopCoinVal.textContent = fmt;
  }

  // สุ่มการ์ด 1 ใบตามเปอร์เซ็นต์ N 40% | R 30% | SR 20% | SSR 10%
  function pickCardByRate(pool) {
    const totalWeight = Object.values(RARITY_RATES).reduce((a, b) => a + b, 0);
    const r = Math.random() * totalWeight;
    let acc = 0;
    let chosenRarity = 'N';
    for (const [rarity, weight] of Object.entries(RARITY_RATES)) {
      acc += weight;
      if (r <= acc) {
        chosenRarity = rarity;
        break;
      }
    }
    const candidates = pool.filter(c => c.rarity === chosenRarity);
    const list = candidates.length > 0 ? candidates : pool;
    return list[Math.floor(Math.random() * list.length)];
  }

  function grantCardToCollection(card) {
    const id = card.id;
    const prev = Number(economy.ownedCards[id] || 0);
    economy.ownedCards[id] = prev + 1;
    return { card, isNew: prev === 0, prevCount: prev };
  }

  // สร้างการ์ดเต็มใบพร้อมเลเยอร์ฟอยล์จริงทั้ง 5 ชั้น + ละอองแสงทองสำหรับระดับ SSR
  function createFullArtFoilCard(card, pillText) {
    const rarity = card.rarity || 'N';
    const cardEl = document.createElement('div');
    cardEl.className = 'bof-fullart-card';
    cardEl.dataset.rarity = rarity;

    const artWrap = document.createElement('div');
    artWrap.className = 'card-art';

    const img = document.createElement('img');
    img.src = card.image;
    img.alt = card.name;
    artWrap.appendChild(img);

    if (window.HoloTilt && typeof window.HoloTilt.holoLayersHTML === 'function') {
      artWrap.insertAdjacentHTML('beforeend', window.HoloTilt.holoLayersHTML());
      window.HoloTilt.addStars(artWrap, rarity);
    }

    cardEl.appendChild(artWrap);

    // เพิ่มละอองแสงสีทองลอยรอบการ์ดสำหรับระดับ SSR โดยเฉพาะ
    if (rarity === 'SSR') {
      const aura = document.createElement('div');
      aura.className = 'bof-ssr-aura-sparks';
      for (let i = 0; i < 10; i++) {
        const orb = document.createElement('span');
        orb.className = 'bof-ssr-orb';
        orb.style.left = `${8 + Math.random() * 84}%`;
        orb.style.top = `${15 + Math.random() * 75}%`;
        orb.style.setProperty('--orb-dur', `${1.8 + Math.random() * 1.4}s`);
        orb.style.setProperty('--orb-delay', `${-Math.random() * 2.5}s`);
        aura.appendChild(orb);
      }
      cardEl.appendChild(aura);
    }

    if (pillText) {
      const badge = document.createElement('span');
      badge.className = 'bof-rarity-pill';
      badge.textContent = pillText;
      cardEl.appendChild(badge);
    }

    return cardEl;
  }

  /* ---------------- ฉากแอนิเมชันเปิดซองสุ่มการ์ด (🌌 วงเวทมิติพลังงาน) ---------------- */
  function playPackOpeningAnimation(pack, packCount, highestRarity, onComplete) {
    const stage = document.getElementById('bof-pack-anim-stage');
    if (!stage) {
      if (onComplete) onComplete();
      return;
    }

    const glowMap = {
      N: pack.color || '#8f97b8',
      R: '#4fa7ff',
      SR: '#ff5a6e',
      SSR: '#facc15'
    };
    const glowColor = glowMap[highestRarity] || pack.color || '#facc15';

    stage.className = 'bof-pack-anim-stage is-playing bof-anim-style-portal';
    stage.style.setProperty('--anim-glow', glowColor);

    stage.innerHTML = `
      <div class="bof-portal-ring"></div>
      <div class="bof-portal-ring-inner"></div>
      <div class="bof-anim-pack-wrap">
        <div class="bof-anim-pack-body"><img src="${pack.image}" alt="${pack.name}"></div>
      </div>
      <div class="bof-anim-burst-flash"></div>
      <div class="bof-anim-caption">🌌 กำลังอัญเชิญมิติ ${pack.name} (${packCount} ซอง)...</div>
    `;

    requestAnimationFrame(() => {
      stage.classList.add('is-active');
    });

    let finished = false;
    const closeAnim = () => {
      if (finished) return;
      finished = true;
      stage.className = 'bof-pack-anim-stage';
      stage.innerHTML = '';
      if (onComplete) onComplete();
    };

    stage.onclick = closeAnim;
    setTimeout(closeAnim, 1500);
  }

  // เปิดซองสุ่มตามสายเด็ค (รองรับทั้ง 1 ซอง = 5 ใบ และ 10 ซอง = 50 ใบ ลดราคา 10%)
  function openFactionPack(packId, packCount = 1) {
    const pack = FACTION_PACKS.find(p => p.id === packId);
    if (!pack || typeof CARD_DATABASE === 'undefined') return;

    const totalCost = packCount === 10 ? pack.tenPrice : pack.price * packCount;
    const totalCards = CARDS_PER_PACK * packCount;

    if (economy.coins < totalCost) {
      showShopToast(`⚠️ เหรียญ Coins ไม่พอ! (ต้องการ ${totalCost.toLocaleString('th-TH')} 🪙 — กรอกโค้ดรับเหรียญด้านบนได้เลย)`);
      return;
    }

    economy.coins -= totalCost;
    economy.packsOpened += packCount;

    // พูลการ์ดในซองรวมทั้ง Leader (SSR), Monster, และ Spell ของสายเด็คนั้น
    const pool = CARD_DATABASE.filter(c => c.image && c.image.startsWith(pack.prefix));
    const drawn = [];

    for (let i = 0; i < totalCards; i++) {
      const card = pickCardByRate(pool);
      drawn.push(grantCardToCollection(card));
    }

    // เรียงลำดับการ์ดจากความแรร์น้อยไปมาก (ซ้ายไปขวา: N -> R -> SR -> SSR)
    drawn.sort((a, b) => {
      const ra = RARITY_ORDER[a.card.rarity] || 0;
      const rb = RARITY_ORDER[b.card.rarity] || 0;
      return ra - rb;
    });

    const highestRarity = drawn.length > 0 ? drawn[drawn.length - 1].card.rarity : 'N';

    saveEconomy();
    renderShopContent();
    syncLobbyDecksForOwnership();

    // เล่นแอนิเมชันวงเวทมิติพลังงาน แล้วเปิดหน้าต่างแสดงผลการเปิดซองขึ้นมากลางจอทันที!
    playPackOpeningAnimation(pack, packCount, highestRarity, () => {
      const modeLabel = packCount === 10
        ? `${pack.name} x10 ซอง (${totalCards} ใบ · ลด 10%)`
        : `${pack.name} x1 ซอง (${totalCards} ใบ)`;
      showPackRevealStage(modeLabel, drawn);
    });
  }

  /* ---------------- หน้าต่างป๊อปอัปแสดงผลการเปิดซอง (ขึ้นทันทีหลังจบแอนิเมชัน!) ---------------- */
  function showPackRevealStage(titleText, drawnItems) {
    const stage = document.getElementById('bof-reveal-stage');
    const titleEl = document.getElementById('bof-reveal-title');
    const summaryEl = document.getElementById('bof-reveal-summary');
    const cardsBox = document.getElementById('bof-reveal-cards');
    if (!stage || !cardsBox) return;

    if (titleEl) {
      titleEl.textContent = `✨ ผลการเปิดซอง: ${titleText} — เรียงแรร์น้อย ➔ มาก (คลิกการ์ดเพื่อพลิก / คลิกขวาดูฟอยล์ 3D ใบใหญ่)`;
    }

    if (summaryEl) {
      const counts = { SSR: 0, SR: 0, R: 0, N: 0, newCount: 0 };
      drawnItems.forEach(it => {
        counts[it.card.rarity] = (counts[it.card.rarity] || 0) + 1;
        if (it.isNew) counts.newCount++;
      });
      summaryEl.innerHTML = `
        <span class="bof-sum-badge" style="color:#fde047;border-color:#facc15;">🌟 SSR: ${counts.SSR} ใบ</span>
        <span class="bof-sum-badge" style="color:#fda4af;border-color:#ff5a6e;">🔥 SR: ${counts.SR} ใบ</span>
        <span class="bof-sum-badge" style="color:#93c5fd;border-color:#4fa7ff;">💎 R: ${counts.R} ใบ</span>
        <span class="bof-sum-badge" style="color:#cbd5e1;border-color:#8f97b8;">⚪ N: ${counts.N} ใบ</span>
        <span class="bof-sum-badge" style="color:#4ade80;border-color:#22c55e;">✨ การ์ดใหม่: ${counts.newCount} ใบ</span>
      `;
    }

    cardsBox.innerHTML = '';

    drawnItems.forEach((item, idx) => {
      const c = item.card;
      const wrap = document.createElement('div');
      wrap.className = 'bof-flip-card';
      wrap.style.animationDelay = `${Math.min(idx * 0.03, 0.8)}s`;

      const inner = document.createElement('div');
      inner.className = 'bof-flip-inner';

      const back = document.createElement('div');
      back.className = `bof-flip-back hint-${c.rarity}`;
      back.innerHTML = `<span style="font-size:28px;">🎴</span><span style="margin-top:6px;">แตะเพื่อพลิก</span><small style="font-size:10px;opacity:.82;margin-top:2px;">ใบที่ ${idx + 1} / ${drawnItems.length}</small>`;

      const front = document.createElement('div');
      front.className = 'bof-flip-front';

      const pillLabel = item.isNew ? `NEW! · ${c.rarity}` : c.rarity;
      const foilCardEl = createFullArtFoilCard(c, pillLabel);
      front.appendChild(foilCardEl);

      inner.appendChild(back);
      inner.appendChild(front);
      wrap.appendChild(inner);

      wrap.addEventListener('click', () => {
        if (!wrap.classList.contains('is-flipped')) {
          wrap.classList.add('is-flipped');
        } else if (typeof window.openCardDetailModal === 'function') {
          window.openCardDetailModal(c, null, foilCardEl);
        }
      });

      wrap.addEventListener('contextmenu', e => {
        e.preventDefault();
        if (typeof window.openCardDetailModal === 'function') {
          window.openCardDetailModal(c, null, foilCardEl);
        }
      });

      cardsBox.appendChild(wrap);
    });

    if (window.HoloTilt && typeof window.HoloTilt.bind === 'function') {
      window.HoloTilt.bind(cardsBox, 12, '.bof-fullart-card');
    }

    stage.classList.add('is-open');
  }

  /* ---------------- วาดเนื้อหาร้านค้า 6 ตู้ซอง ---------------- */
  function renderShopContent() {
    updateCoinDisplays();
    const body = document.getElementById('bof-shop-dynamic-body');
    if (!body) return;

    const totalUnique = typeof CARD_DATABASE !== 'undefined' ? CARD_DATABASE.length : 72;
    const ownedUnique = Object.keys(economy.ownedCards).filter(id => economy.ownedCards[id] > 0).length;

    body.innerHTML = `
      <div class="bof-shop-controls-bar">
        <span style="font-size:13px;color:#cbd5e1;">
          🎴 <b>เรทสุ่มทุกใบ:</b> N 40% · R 30% · SR 20% · <b style="color:#fde047;">SSR (Leader) 10%</b>
          &nbsp;|&nbsp; 📚 คลังการ์ด: <b style="color:#fde047;">${ownedUnique} / ${totalUnique}</b> แบบ (เปิดแล้ว <b style="color:#38bdf8;">${economy.packsOpened}</b> ซอง)
        </span>
      </div>

      <div class="bof-packs-grid">
        ${FACTION_PACKS.map(p => {
          const deckCards = typeof CARD_DATABASE !== 'undefined'
            ? CARD_DATABASE.filter(c => c.image && c.image.startsWith(p.prefix))
            : [];
          const ownedInDeck = deckCards.filter(c => economy.ownedCards[c.id] > 0).length;
          return `
            <div class="bof-pack-card" style="--pack-color:${p.color};">
              <div class="bof-pack-foil">
                <img src="${p.image}" alt="${p.name}">
                <span class="bof-pack-ribbon">5 CARDS / PACK</span>
              </div>
              <div class="bof-pack-name">${p.name}</div>
              <div class="bof-pack-sub">${p.sub}</div>
              <div style="font-size:11px;color:#fde047;margin-top:4px;">สะสมในสายนี้: ${ownedInDeck} / ${deckCards.length} แบบ</div>
              <div class="bof-pack-actions">
                <button type="button" class="bof-buy-btn" data-pack="${p.id}" data-count="1">
                  สุ่ม 1 ซอง (5 ใบ) · 🪙 ${p.price}
                </button>
                <button type="button" class="bof-buy-btn is-ten" data-pack="${p.id}" data-count="10">
                  🔥 สุ่ม 10 ซอง (50 ใบ) · 🪙 ${p.tenPrice.toLocaleString('th-TH')}
                  <span class="bof-discount-badge">-10%</span>
                </button>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    // ปุ่มสุ่ม 1 ซอง และ 10 ซอง (ลด 10%)
    body.querySelectorAll('.bof-buy-btn[data-pack]').forEach(btn => {
      btn.addEventListener('click', () => {
        const packId = btn.getAttribute('data-pack');
        const count = Number(btn.getAttribute('data-count') || 1);
        openFactionPack(packId, count);
      });
    });
  }

  function showShopToast(msg) {
    const el = document.getElementById('bof-shop-toast');
    if (!el) return;
    el.textContent = msg;
    el.style.display = 'block';
    clearTimeout(showShopToast._t);
    showShopToast._t = setTimeout(() => {
      el.style.display = 'none';
    }, 3200);
  }

  /* ---------------- กรองคลังการ์ด & จัดเด็คตามการ์ดที่มีจริง (เฉพาะตอนล็อกอิน) ---------------- */
  function syncLobbyDecksForOwnership() {
    if (typeof CARD_DATABASE === 'undefined') return;
    const loggedIn = isLoggedInUser();
    const deckBtns = document.querySelectorAll('#lb-decks .lb-deck');
    deckBtns.forEach(btn => {
      const key = btn.getAttribute('data-deck');
      if (!loggedIn || key === 'mine') {
        btn.style.display = '';
        return;
      }
      const needLeader = Number(economy.ownedCards[key] || 0) >= 1;
      const list = typeof getDefaultDeckForLeader === 'function' ? getDefaultDeckForLeader(key) : [];
      const reqCounts = {};
      list.forEach(cid => { reqCounts[cid] = (reqCounts[cid] || 0) + 1; });
      const hasAllMain = Object.entries(reqCounts).every(([cid, cnt]) => Number(economy.ownedCards[cid] || 0) >= cnt);
      btn.style.display = (needLeader && hasAllMain) ? '' : 'none';
    });
  }

  function hookCollectionAndDeckBuilder() {
    const navCards = document.getElementById('nav-cards');
    if (navCards) {
      navCards.addEventListener('click', e => {
        if (!isLoggedInUser()) return;
        e.preventDefault();
        e.stopImmediatePropagation();
        economy = loadEconomy();
        const ownedList = CARD_DATABASE.filter(c => Number(economy.ownedCards[c.id] || 0) > 0);
        if (typeof openZoneViewerModal === 'function') {
          openZoneViewerModal(
            `🎒 คลังการ์ดของคุณ (${ownedList.length} / ${CARD_DATABASE.length} แบบ — สุ่มเพิ่มได้จากร้านค้าซองการ์ด)`,
            ownedList,
            null
          );
        }
      }, true);
    }

    if (typeof window.renderDeckBuilder === 'function') {
      const origRenderDeckBuilder = window.renderDeckBuilder;
      window.renderDeckBuilder = function () {
        const res = origRenderDeckBuilder.apply(this, arguments);
        if (!isLoggedInUser()) return res;

        economy = loadEconomy();
        const leaderContainer = document.getElementById('leader-pool-list');
        const mainContainer = document.getElementById('main-pool-list');
        if (!leaderContainer || !mainContainer) return res;

        const allLeaders = CARD_DATABASE.filter(c => c.type === 'Leader');
        const leaderItems = Array.from(leaderContainer.children);
        allLeaders.forEach((leader, idx) => {
          const item = leaderItems[idx];
          if (!item) return;
          const ownedCount = Number(economy.ownedCards[leader.id] || 0);
          item.style.display = ownedCount <= 0 ? 'none' : '';
        });

        const allMainCards = CARD_DATABASE.filter(c => c.type !== 'Leader');
        const mainItems = Array.from(mainContainer.children);
        allMainCards.forEach((card, idx) => {
          const item = mainItems[idx];
          if (!item) return;
          const ownedCount = Number(economy.ownedCards[card.id] || 0);
          if (ownedCount <= 0) {
            item.style.display = 'none';
            return;
          }
          item.style.display = '';
          const ruleMax = typeof getCardMaxCopies === 'function' ? getCardMaxCopies(card) : 2;
          const allowedMax = Math.min(ruleMax, ownedCount);
          const countInDeck = currentDeckConfig.mainDeck.filter(id => id === card.id).length;

          const badge = item.querySelector('.count-badge');
          if (badge) {
            badge.className = `count-badge ${countInDeck >= allowedMax ? 'maxed' : ''}`;
            badge.textContent = `ใส่ในเด็ค: ${countInDeck}/${allowedMax} (มีในคลัง ${ownedCount} ใบ)`;
          }

          const cardEl = item.querySelector('.card');
          if (cardEl) {
            cardEl.addEventListener('click', e => {
              e.stopImmediatePropagation();
              if (countInDeck < allowedMax) {
                if (currentDeckConfig.mainDeck.length >= 20) {
                  alert('การ์ดใน Main Deck ครบ 20 ใบแล้ว! กรุณาคลิกเอาใบอื่นออกก่อน');
                  return;
                }
                currentDeckConfig.mainDeck.push(card.id);
              } else {
                currentDeckConfig.mainDeck = currentDeckConfig.mainDeck.filter(id => id !== card.id);
              }
              window.renderDeckBuilder();
            }, true);
          }
        });

        return res;
      };
    }

    const btnDefaultDeck = document.getElementById('btn-default-deck');
    if (btnDefaultDeck) {
      btnDefaultDeck.addEventListener('click', e => {
        if (!isLoggedInUser()) return;
        e.stopImmediatePropagation();
        const user = window.BOFAuth.currentUser();
        const starterLeaderId = (user && user.starterDeckId) || (user && user.avatarId) || 'L01';
        const list = typeof getDefaultDeckForLeader === 'function' ? getDefaultDeckForLeader(starterLeaderId) : [];
        currentDeckConfig.leaderId = starterLeaderId;
        currentDeckConfig.mainDeck = [...list];
        window.renderDeckBuilder();
      }, true);
    }
  }

  function bindShopEvents() {
    const dialog = document.getElementById('bof-shop-dialog');
    if (!dialog) return;

    const openShop = () => {
      economy = loadEconomy();
      renderShopContent();
      dialog.showModal();
    };

    document.getElementById('lb-coin-pill')?.addEventListener('click', openShop);
    document.getElementById('nav-shop')?.addEventListener('click', e => {
      e.preventDefault();
      openShop();
    });

    document.getElementById('bof-shop-close')?.addEventListener('click', () => dialog.close());

    // ระบบช่องกรอกโค้ดรับเหรียญ (โค้ด "10000" รับ 10,000 เหรียญ)
    const redeemShopCode = () => {
      const codeInput = document.getElementById('bof-shop-code-input');
      if (!codeInput) return;
      const code = codeInput.value.trim();
      if (!code) {
        showShopToast('⚠️ กรุณากรอกโค้ดก่อนกดใช้โค้ด');
        return;
      }
      if (code === '10000') {
        economy.coins += 10000;
        saveEconomy();
        renderShopContent();
        codeInput.value = '';
        showShopToast('🎉 ใช้โค้ด "10000" สำเร็จ! ได้รับ +10,000 🪙 เหรียญ!');
      } else {
        showShopToast('❌ โค้ดไม่ถูกต้อง! กรุณาตรวจสอบโค้ดอีกครั้ง');
      }
    };

    document.getElementById('bof-shop-code-btn')?.addEventListener('click', redeemShopCode);
    document.getElementById('bof-shop-code-input')?.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        e.preventDefault();
        redeemShopCode();
      }
    });

    // ปุ่มพลิกการ์ดทั้งหมดพร้อมกัน
    document.getElementById('bof-reveal-flip-all')?.addEventListener('click', () => {
      document.querySelectorAll('#bof-reveal-cards .bof-flip-card').forEach(c => {
        c.classList.add('is-flipped');
      });
    });

    const hideRevealStage = () => {
      document.getElementById('bof-reveal-stage')?.classList.remove('is-open');
    };

    document.getElementById('bof-reveal-hide')?.addEventListener('click', hideRevealStage);
    document.getElementById('bof-reveal-stage')?.addEventListener('click', e => {
      if (e.target.id === 'bof-reveal-stage') hideRevealStage();
    });

    // แจกเหรียญ Coins อัตโนมัติหลังจบเกม (ชนะ +300 🪙, แพ้ +100 🪙)
    if (typeof window.showEndMatchModal === 'function') {
      const origEnd = window.showEndMatchModal;
      window.showEndMatchModal = function (title, desc) {
        const isWin = String(title).includes('ชนะ');
        const reward = isWin ? 300 : 100;
        economy = loadEconomy();
        economy.coins = (economy.coins || 0) + reward;
        saveEconomy();
        const extraDesc = `${desc || ''} (ได้รับรางวัลแมตช์ +${reward} 🪙 Coins!)`;
        return origEnd.call(this, title, extraDesc);
      };
    }
  }

  window.BOFShop = {
    getEconomy: () => economy,
    reloadFromProfile: () => {
      economy = loadEconomy();
      updateCoinDisplays();
      syncLobbyDecksForOwnership();
    }
  };

  bindShopEvents();
  hookCollectionAndDeckBuilder();
  updateCoinDisplays();
  syncLobbyDecksForOwnership();
})();
