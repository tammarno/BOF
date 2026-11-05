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

  // คำนวณรอบวันเควสต์ตามเวลาประเทศไทย (UTC+7) รีวันทุก 06:00 น.
  function getThaiQuestDayKey() {
    const now = new Date();
    const utcMs = now.getTime() + (now.getTimezoneOffset() * 60000);
    const thaiNow = new Date(utcMs + (7 * 3600000));
    if (thaiNow.getHours() < 6) {
      thaiNow.setDate(thaiNow.getDate() - 1);
    }
    const y = thaiNow.getFullYear();
    const m = String(thaiNow.getMonth() + 1).padStart(2, '0');
    const d = String(thaiNow.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  function getThaiQuestCountdown() {
    const now = new Date();
    const utcMs = now.getTime() + (now.getTimezoneOffset() * 60000);
    const thaiNow = new Date(utcMs + (7 * 3600000));
    const nextReset = new Date(thaiNow);
    if (thaiNow.getHours() >= 6) {
      nextReset.setDate(nextReset.getDate() + 1);
    }
    nextReset.setHours(6, 0, 0, 0);
    const diff = Math.max(0, nextReset.getTime() - thaiNow.getTime());
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    return `${String(h).padStart(2, '0')} ชม. ${String(m).padStart(2, '0')} นาที ${String(s).padStart(2, '0')} วินาที`;
  }

  let economy = loadEconomy();

  function loadEconomy() {
    const todayStr = getThaiQuestDayKey();
    const user = window.BOFAuth && typeof window.BOFAuth.currentUser === 'function'
      ? window.BOFAuth.currentUser()
      : null;

    if (user) {
      const uProgress = (user.dailyProgress && user.dailyProgress.date === todayStr)
        ? { ...user.dailyProgress }
        : { date: todayStr, packsOpened: 0, craftsDone: 0, duelsCompleted: 0 };
      const uClaimed = (user.dailyProgress && user.dailyProgress.date === todayStr && user.claimedQuests)
        ? { ...user.claimedQuests }
        : {};
      return {
        coins: typeof user.coins === 'number' ? user.coins : STARTING_COINS,
        shards: typeof user.shards === 'number' ? user.shards : 150,
        ownedCards: user.ownedCards && typeof user.ownedCards === 'object' ? { ...user.ownedCards } : {},
        packsOpened: Number(user.packsOpened || 0),
        pity: user.pity && typeof user.pity === 'object' ? { ...user.pity } : {},
        lastDailyClaimDate: user.lastDailyClaimDate || '',
        dailyProgress: uProgress,
        claimedQuests: uClaimed
      };
    }

    let guestCoins = STARTING_COINS;
    let guestShards = 150;
    let guestPacks = 0;
    let guestPity = {};
    let guestDaily = '';
    let guestQuests = {};
    let guestDailyProgress = { date: todayStr, packsOpened: 0, craftsDone: 0, duelsCompleted: 0 };
    try {
      const savedGuest = JSON.parse(localStorage.getItem(GUEST_ECONOMY_KEY));
      if (savedGuest && typeof savedGuest.coins === 'number') {
        guestCoins = savedGuest.coins;
        guestShards = typeof savedGuest.shards === 'number' ? savedGuest.shards : 150;
        guestPacks = Number(savedGuest.packsOpened || 0);
        guestPity = savedGuest.pity || {};
        guestDaily = savedGuest.lastDailyClaimDate || '';
        if (savedGuest.dailyProgress && savedGuest.dailyProgress.date === todayStr) {
          guestDailyProgress = savedGuest.dailyProgress;
          guestQuests = savedGuest.claimedQuests || {};
        }
      }
    } catch (e) {}

    return {
      coins: guestCoins,
      shards: guestShards,
      ownedCards: getGuestFullOwned(),
      packsOpened: guestPacks,
      pity: guestPity,
      lastDailyClaimDate: guestDaily,
      dailyProgress: guestDailyProgress,
      claimedQuests: guestQuests
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
          shards: economy.shards,
          packsOpened: economy.packsOpened,
          pity: economy.pity,
          lastDailyClaimDate: economy.lastDailyClaimDate,
          dailyProgress: economy.dailyProgress,
          claimedQuests: economy.claimedQuests
        }));
      } catch (e) {}
    }
    updateCoinDisplays();
  }

  function updateCoinDisplays() {
    const fmt = Number(economy.coins || 0).toLocaleString('th-TH');
    const shardFmt = Number(economy.shards || 0).toLocaleString('th-TH');
    const lobbyCoinVal = document.getElementById('lb-coin-val');
    if (lobbyCoinVal) lobbyCoinVal.textContent = fmt;
    const shopCoinVal = document.getElementById('bof-shop-coin-val');
    if (shopCoinVal) shopCoinVal.textContent = fmt;
    const shopShardVal = document.getElementById('bof-shop-shard-val');
    if (shopShardVal) shopShardVal.textContent = shardFmt;
  }

  const PITY_THRESHOLD = 15; // เปิดครบ 15 ซอง การันตี SSR แน่นอน

  // สุ่มการ์ด 1 ใบตามเปอร์เซ็นต์ N 40% | R 30% | SR 20% | SSR 10% (หรือบังคับความแรร์เมื่อติดการันตี)
  function pickCardByRate(pool, forceRarity = null) {
    let chosenRarity = forceRarity;
    if (!chosenRarity) {
      const totalWeight = Object.values(RARITY_RATES).reduce((a, b) => a + b, 0);
      const r = Math.random() * totalWeight;
      let acc = 0;
      chosenRarity = 'N';
      for (const [rarity, weight] of Object.entries(RARITY_RATES)) {
        acc += weight;
        if (r <= acc) {
          chosenRarity = rarity;
          break;
        }
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

    if (window.BOF_AUDIO) window.BOF_AUDIO.playPackOpen();

    let finished = false;
    const closeAnim = () => {
      if (finished) return;
      finished = true;
      stage.className = 'bof-pack-anim-stage';
      stage.style.display = 'none';
      stage.innerHTML = '';
      stage.onclick = null;
      if (onComplete) onComplete();
    };

    // หน่วงเวลา 450ms ก่อนรับคลิกข้าม เพื่อป้องกัน click event จากปุ่มเปิดซองกระเด็นมาปิดแอนิเมชันทันที
    setTimeout(() => {
      stage.onclick = closeAnim;
    }, 450);

    setTimeout(closeAnim, 2100);
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
    if (!economy.dailyProgress) economy.dailyProgress = { date: new Date().toISOString().split('T')[0], packsOpened: 0, craftsDone: 0, duelsCompleted: 0 };
    economy.dailyProgress.packsOpened = (economy.dailyProgress.packsOpened || 0) + packCount;

    // ติดตามระบบ Pity (การันตี SSR ในทุกๆ 15 ซอง)
    if (!economy.pity) economy.pity = {};
    economy.pity[packId] = (economy.pity[packId] || 0) + packCount;
    const isPityTriggered = economy.pity[packId] >= PITY_THRESHOLD;

    // พูลการ์ดในซองรวมทั้ง Leader (SSR), Monster, และ Spell ของสายเด็คนั้น
    const pool = CARD_DATABASE.filter(c => c.image && c.image.startsWith(pack.prefix));
    const drawn = [];

    for (let i = 0; i < totalCards; i++) {
      // ใบสุดท้าย ถ้าครบการันตี Pity จะบังคับเป็นระดับ SSR แน่นอน!
      const forceRarity = (isPityTriggered && i === totalCards - 1) ? 'SSR' : null;
      const card = pickCardByRate(pool, forceRarity);
      if (card && card.rarity === 'SSR') {
        economy.pity[packId] = 0; // รีเซ็ตการันตีเมื่อสุ่มได้ SSR
      }
      drawn.push(grantCardToCollection(card));
    }

    if (window.BOF_AUDIO) window.BOF_AUDIO.playPackOpen();

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

    const hasSSR = Array.isArray(drawnItems) && drawnItems.some(it => it.card && it.card.rarity === 'SSR');
    if (hasSSR && window.BOF_AUDIO) {
      window.BOF_AUDIO.playSsr();
    }
    stage.classList.add('is-open');
    stage.style.display = 'flex';
    stage.scrollTop = 0;
  }

  /* ---------------- ระบบร้านค้า แท็บสุ่มซอง, หลอมการ์ด และเควสต์ประจำวัน ---------------- */
  let activeShopTab = 'packs'; // 'packs' | 'craft' | 'quests'
  let craftFilterTribe = 'ALL';
  let craftFilterRarity = 'ALL';

  // มูลค่าย่อยการ์ดส่วนเกิน -> Soul Shards (🔮)
  const DISENCHANT_VALUES = { N: 10, R: 30, SR: 100, SSR: 300 };
  // ค่าใช้จ่ายในการหลอมการ์ดใหม่ (Crafting Cost)
  const CRAFT_COSTS = { N: 50, R: 150, SR: 400, SSR: 1000 };

  function renderShopContent() {
    updateCoinDisplays();
    const body = document.getElementById('bof-shop-dynamic-body');
    if (!body) return;

    body.innerHTML = `
      <div class="bof-shop-tabs">
        <button type="button" class="bof-shop-tab ${activeShopTab === 'packs' ? 'is-active' : ''}" data-tab="packs">📦 สุ่มซองการ์ด (Booster)</button>
        <button type="button" class="bof-shop-tab ${activeShopTab === 'craft' ? 'is-active' : ''}" data-tab="craft">🔮 ย่อย & หลอมการ์ด (Crafting)</button>
        <button type="button" class="bof-shop-tab ${activeShopTab === 'quests' ? 'is-active' : ''}" data-tab="quests">🎁 เควสต์ & ของขวัญประจำวัน</button>
      </div>
      <div id="bof-tab-view-container"></div>
    `;

    // ผูกแท็บเมนู
    body.querySelectorAll('.bof-shop-tab').forEach(tBtn => {
      tBtn.addEventListener('click', () => {
        activeShopTab = tBtn.dataset.tab;
        renderShopContent();
      });
    });

    const viewContainer = document.getElementById('bof-tab-view-container');
    if (!viewContainer) return;

    if (activeShopTab === 'packs') {
      renderPacksView(viewContainer);
    } else if (activeShopTab === 'craft') {
      renderCraftingView(viewContainer);
    } else if (activeShopTab === 'quests') {
      renderQuestsView(viewContainer);
    }
  }

  // --- มุมมองที่ 1: ตู้สุ่มซองการ์ด 6 สาย พร้อมแถบ Pity ---
  function renderPacksView(container) {
    const totalUnique = typeof CARD_DATABASE !== 'undefined' ? CARD_DATABASE.length : 72;
    const ownedUnique = Object.keys(economy.ownedCards).filter(id => economy.ownedCards[id] > 0).length;

    container.innerHTML = `
      <div class="bof-shop-controls-bar">
        <span style="font-size:13px;color:#cbd5e1;">
          🎴 <b>เรทสุ่ม:</b> N 40% · R 30% · SR 20% · <b style="color:#fde047;">SSR (Leader) 10%</b>
          &nbsp;|&nbsp; 📚 สะสม: <b style="color:#fde047;">${ownedUnique} / ${totalUnique}</b> แบบ (เปิดแล้ว <b style="color:#38bdf8;">${economy.packsOpened}</b> ซอง)
        </span>
      </div>

      <div class="bof-packs-grid">
        ${FACTION_PACKS.map(p => {
          const deckCards = typeof CARD_DATABASE !== 'undefined'
            ? CARD_DATABASE.filter(c => c.image && c.image.startsWith(p.prefix))
            : [];
          const ownedInDeck = deckCards.filter(c => economy.ownedCards[c.id] > 0).length;
          const pityCount = (economy.pity && economy.pity[p.id]) || 0;
          const remainingPity = Math.max(0, PITY_THRESHOLD - pityCount);
          const pityPercent = Math.min(100, (pityCount / PITY_THRESHOLD) * 100);

          return `
            <div class="bof-pack-card" style="--pack-color:${p.color};">
              <div class="bof-pack-foil">
                <img src="${p.image}" alt="${p.name}">
                <span class="bof-pack-ribbon">5 CARDS / PACK</span>
              </div>
              <div class="bof-pack-name">${p.name}</div>
              <div class="bof-pack-sub">${p.sub}</div>
              <div style="font-size:11px;color:#fde047;margin-top:4px;">สะสมในสายนี้: ${ownedInDeck} / ${deckCards.length} แบบ</div>
              
              <div class="bof-pity-counter">
                <div class="bof-pity-text">
                  <span>⭐ การันตี SSR ในอีก:</span>
                  <b>${remainingPity} ซอง</b>
                </div>
                <div class="bof-pity-track">
                  <div class="bof-pity-fill" style="width:${pityPercent}%;"></div>
                </div>
              </div>

              <div class="bof-pack-actions">
                <button type="button" class="bof-buy-btn" data-pack="${p.id}" data-count="1">
                  สุ่ม 1 ซอง · 🪙 ${p.price}
                </button>
                <button type="button" class="bof-buy-btn is-ten" data-pack="${p.id}" data-count="10">
                  🔥 สุ่ม 10 ซอง · 🪙 ${p.tenPrice.toLocaleString('th-TH')}
                  <span class="bof-discount-badge">-10%</span>
                </button>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    container.querySelectorAll('.bof-buy-btn[data-pack]').forEach(btn => {
      btn.addEventListener('click', () => {
        const packId = btn.getAttribute('data-pack');
        const count = Number(btn.getAttribute('data-count') || 1);
        openFactionPack(packId, count);
      });
    });
  }

  // --- มุมมองที่ 2: ระบบย่อยการ์ดส่วนเกิน & หลอมการ์ด (Crafting) ---
  function renderCraftingView(container) {
    if (typeof CARD_DATABASE === 'undefined') return;

    // คำนวณการ์ดส่วนเกิน (Normal > 2 ใบ, Leader > 1 ใบ)
    let totalExtraCards = 0;
    let totalShardsGained = 0;

    CARD_DATABASE.forEach(card => {
      const owned = Number(economy.ownedCards[card.id] || 0);
      const maxKeep = card.type === 'Leader' ? 1 : 2;
      if (owned > maxKeep) {
        const extra = owned - maxKeep;
        totalExtraCards += extra;
        totalShardsGained += extra * (DISENCHANT_VALUES[card.rarity] || 10);
      }
    });

    // กรองการ์ดตามฟิลเตอร์
    const allCards = CARD_DATABASE.filter(c => {
      if (craftFilterRarity !== 'ALL' && c.rarity !== craftFilterRarity) return false;
      if (craftFilterTribe === 'JIT' && !c.image.includes('เด็คจิต')) return false;
      if (craftFilterTribe === 'NUEA' && !c.image.includes('เด็คเหนือ')) return false;
      if (craftFilterTribe === 'DOOM' && !c.image.includes('วันสิ้นโลก')) return false;
      if (craftFilterTribe === 'DINO' && !c.image.includes('ไดโน')) return false;
      if (craftFilterTribe === 'DEMON' && !c.image.includes('เด็คปีศาจ')) return false;
      if (craftFilterTribe === 'OAT' && !c.image.includes('เด็คโอ๊ต')) return false;
      return true;
    });

    container.innerHTML = `
      <div class="bof-craft-panel">
        <div class="bof-disenchant-box">
          <div class="bof-disenchant-info">
            <h4>🔮 ย่อยการ์ดส่วนเกิน (Disenchant Duplicates)</h4>
            <p>พบการ์ดซ้ำที่เกินจำนวนจัดเด็ค <b>${totalExtraCards} ใบ</b> — สามารถย่อยเป็น <b style="color:#fde047;">+${totalShardsGained.toLocaleString('th-TH')} 🔮 Soul Shards</b></p>
          </div>
          <button type="button" class="bof-btn-disenchant" id="btn-disenchant-all" ${totalExtraCards <= 0 ? 'disabled' : ''}>
            ✨ ย่อยการ์ดซ้ำทั้งหมด (+${totalShardsGained} 🔮)
          </button>
        </div>

        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
          <strong style="color:#c084fc;font-size:14px;">🎴 เลือกหลอมการ์ดที่คุณต้องการ:</strong>
          <span style="font-size:12px;color:#94a3b8;">ราคา: N 50 🔮 | R 150 🔮 | SR 400 🔮 | SSR 1,000 🔮</span>
        </div>

        <div class="bof-craft-filter-row">
          <span style="font-size:12px;color:#cbd5e1;">สายเด็ค:</span>
          <button type="button" class="bof-craft-filter-btn ${craftFilterTribe === 'ALL' ? 'is-active' : ''}" data-tribe="ALL">ทั้งหมด</button>
          <button type="button" class="bof-craft-filter-btn ${craftFilterTribe === 'JIT' ? 'is-active' : ''}" data-tribe="JIT">จิต</button>
          <button type="button" class="bof-craft-filter-btn ${craftFilterTribe === 'NUEA' ? 'is-active' : ''}" data-tribe="NUEA">ขุนเหนือ</button>
          <button type="button" class="bof-craft-filter-btn ${craftFilterTribe === 'DOOM' ? 'is-active' : ''}" data-tribe="DOOM">สิ้นโลก</button>
          <button type="button" class="bof-craft-filter-btn ${craftFilterTribe === 'DINO' ? 'is-active' : ''}" data-tribe="DINO">ไดโน</button>
          <button type="button" class="bof-craft-filter-btn ${craftFilterTribe === 'DEMON' ? 'is-active' : ''}" data-tribe="DEMON">ปีศาจ</button>
          <button type="button" class="bof-craft-filter-btn ${craftFilterTribe === 'OAT' ? 'is-active' : ''}" data-tribe="OAT">โอ๊ต</button>

          <span style="font-size:12px;color:#cbd5e1;margin-left:8px;">ความแรร์:</span>
          <button type="button" class="bof-craft-filter-btn ${craftFilterRarity === 'ALL' ? 'is-active' : ''}" data-rarity="ALL">ทุกระดับ</button>
          <button type="button" class="bof-craft-filter-btn ${craftFilterRarity === 'SSR' ? 'is-active' : ''}" data-rarity="SSR">SSR</button>
          <button type="button" class="bof-craft-filter-btn ${craftFilterRarity === 'SR' ? 'is-active' : ''}" data-rarity="SR">SR</button>
          <button type="button" class="bof-craft-filter-btn ${craftFilterRarity === 'R' ? 'is-active' : ''}" data-rarity="R">R</button>
          <button type="button" class="bof-craft-filter-btn ${craftFilterRarity === 'N' ? 'is-active' : ''}" data-rarity="N">N</button>
        </div>

        <div class="bof-craft-grid">
          ${allCards.map(c => {
            const owned = Number(economy.ownedCards[c.id] || 0);
            const cost = CRAFT_COSTS[c.rarity] || 50;
            const canAfford = (economy.shards || 0) >= cost;
            return `
              <div class="bof-craft-card">
                <img src="${c.image}" alt="${c.name}">
                <div class="bof-craft-card-name" title="${c.name}">${c.name}</div>
                <div class="bof-craft-card-owned">ครอบครอง: ${owned} ใบ</div>
                <button type="button" class="bof-craft-action-btn" data-craft-id="${c.id}" ${canAfford ? '' : 'disabled'}>
                  หลอม · ${cost} 🔮
                </button>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;

    // ปุมย่อยการ์ดซ้ำ
    const disenchantBtn = container.querySelector('#btn-disenchant-all');
    if (disenchantBtn) {
      disenchantBtn.onclick = () => {
        if (totalExtraCards <= 0) return;
        CARD_DATABASE.forEach(card => {
          const owned = Number(economy.ownedCards[card.id] || 0);
          const maxKeep = card.type === 'Leader' ? 1 : 2;
          if (owned > maxKeep) {
            economy.ownedCards[card.id] = maxKeep;
          }
        });
        economy.shards = (economy.shards || 0) + totalShardsGained;
        if (!economy.dailyProgress) economy.dailyProgress = { date: new Date().toISOString().split('T')[0], packsOpened: 0, craftsDone: 0, duelsCompleted: 0 };
        economy.dailyProgress.craftsDone = (economy.dailyProgress.craftsDone || 0) + 1;
        saveEconomy();
        if (window.BOF_AUDIO) window.BOF_AUDIO.playSpell();
        showShopToast(`✨ ย่อยการ์ดซ้ำสำเร็จ! ได้รับ +${totalShardsGained.toLocaleString('th-TH')} 🔮 Soul Shards`);
        renderCraftingView(container);
      };
    }

    // ตัวกรอง
    container.querySelectorAll('.bof-craft-filter-btn[data-tribe]').forEach(btn => {
      btn.onclick = () => {
        craftFilterTribe = btn.dataset.tribe;
        renderCraftingView(container);
      };
    });
    container.querySelectorAll('.bof-craft-filter-btn[data-rarity]').forEach(btn => {
      btn.onclick = () => {
        craftFilterRarity = btn.dataset.rarity;
        renderCraftingView(container);
      };
    });

    // ปุ่มหลอมการ์ด
    container.querySelectorAll('.bof-craft-action-btn[data-craft-id]').forEach(btn => {
      btn.onclick = () => {
        const cardId = btn.dataset.craftId;
        const target = CARD_DATABASE.find(c => c.id === cardId);
        if (!target) return;
        const cost = CRAFT_COSTS[target.rarity] || 50;
        if ((economy.shards || 0) < cost) {
          showShopToast('⚠️ เศษวิญญาณ Soul Shards ไม่เพียงพอ!');
          return;
        }
        economy.shards -= cost;
        grantCardToCollection(target);
        if (!economy.dailyProgress) economy.dailyProgress = { date: new Date().toISOString().split('T')[0], packsOpened: 0, craftsDone: 0, duelsCompleted: 0 };
        economy.dailyProgress.craftsDone = (economy.dailyProgress.craftsDone || 0) + 1;
        saveEconomy();
        if (window.BOF_AUDIO) window.BOF_AUDIO.playSsr();
        showShopToast(`🔮 หลอมการ์ด "${target.name}" [${target.rarity}] สำเร็จ!`);
        renderCraftingView(container);
      };
    });
  }

  // --- มุมมองที่ 3: เควสต์ประจำวัน & รางวัลเข้าเกม (Daily Quests) ---
  function renderQuestsView(container) {
    const today = getThaiQuestDayKey();
    if (!economy.dailyProgress || economy.dailyProgress.date !== today) {
      economy.dailyProgress = { date: today, packsOpened: 0, craftsDone: 0, duelsCompleted: 0 };
      economy.claimedQuests = {};
    }
    const isDailyClaimed = economy.lastDailyClaimDate === today;
    if (!economy.claimedQuests) economy.claimedQuests = {};

    const dp = economy.dailyProgress;
    const quests = [
      {
        id: 'quest_packs_1',
        title: '📦 เปิดซองการ์ด 1 ซอง',
        desc: 'เปิดซองสุ่มการ์ดสายใดก็ได้ในร้านค้า 1 ซอง',
        current: Math.min(dp.packsOpened || 0, 1),
        max: 1,
        rewardCoins: 200,
        rewardShards: 30,
        isCompleted: (dp.packsOpened || 0) >= 1,
        isClaimed: !!economy.claimedQuests['quest_packs_1']
      },
      {
        id: 'quest_craft_1',
        title: '🔮 ย่อยหรือหลอมการ์ด 1 ครั้ง',
        desc: 'สะสมการ์ดซ้ำแล้วย่อย หรือหลอมการ์ดใหม่ด้วย Soul Shards',
        current: Math.min(dp.craftsDone || 0, 1),
        max: 1,
        rewardCoins: 250,
        rewardShards: 40,
        isCompleted: (dp.craftsDone || 0) >= 1,
        isClaimed: !!economy.claimedQuests['quest_craft_1']
      },
      {
        id: 'quest_duel_1',
        title: '⚔️ ประลองการ์ด 1 แมตช์',
        desc: 'ดวลการ์ดกับ AI หรือเพื่อนออนไลน์จนจบแมตช์',
        current: Math.min(dp.duelsCompleted || 0, 1),
        max: 1,
        rewardCoins: 350,
        rewardShards: 50,
        isCompleted: (dp.duelsCompleted || 0) >= 1,
        isClaimed: !!economy.claimedQuests['quest_duel_1']
      }
    ];

    function formatCountdown() {
      return getThaiQuestCountdown();
    }

    container.innerHTML = `
      <div class="bof-quests-panel">
        <div class="bof-daily-login-card">
          <div>
            <h4 style="margin:0 0 4px 0;color:#fde047;font-size:16px;">🎁 รางวัลเช็คอินประจำวัน (Daily Login)</h4>
            <p style="margin:0;font-size:13px;color:#f8fafc;">เข้าเกมรับทันที: <b style="color:#fde047;">+300 🪙 Coins</b> และ <b style="color:#c084fc;">+50 🔮 Soul Shards</b></p>
          </div>
          <button type="button" class="bof-quest-claim-btn ${isDailyClaimed ? 'is-claimed' : ''}" id="btn-claim-daily" ${isDailyClaimed ? 'disabled' : ''}>
            ${isDailyClaimed ? '✓ รับแล้ววันนี้' : '🎁 รับของขวัญทันที'}
          </button>
        </div>

        <div style="display:flex;align-items:center;justify-content:space-between;margin:16px 0 10px 0;flex-wrap:wrap;gap:8px;">
          <h4 style="margin:0;color:#38bdf8;font-size:15px;">📜 ภารกิจประจำวัน (Daily Missions)</h4>
          <div style="font-size:12px;color:#94a3b8;background:#1e293b;padding:4px 12px;border-radius:999px;border:1px solid #334155;">
            ⏳ รีเซ็ตภารกิจในอีก: <b id="quest-countdown-timer" style="color:#fde047;">${formatCountdown()}</b> (ทุก 06:00 น. เวลาไทย)
          </div>
        </div>
        
        ${quests.map(q => {
          const pct = Math.min(100, (q.current / q.max) * 100);
          return `
            <div class="bof-quest-row">
              <div class="bof-quest-meta" style="flex:1;">
                <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
                  <h5 style="margin:0;font-size:14px;color:#f8fafc;">${q.title}</h5>
                  <span style="font-size:12px;font-weight:bold;color:${q.isCompleted ? '#4ade80' : '#94a3b8'};">
                    ${q.current} / ${q.max} ${q.isCompleted ? '✓ สำเร็จ' : ''}
                  </span>
                </div>
                <p style="margin:4px 0 8px 0;font-size:12px;color:#cbd5e1;">${q.desc}</p>
                <div style="width:100%;height:6px;background:#334155;border-radius:3px;overflow:hidden;">
                  <div style="width:${pct}%;height:100%;background:${q.isCompleted ? '#22c55e' : '#38bdf8'};transition:width 0.3s;"></div>
                </div>
              </div>
              <div class="bof-quest-reward">
                <span style="font-size:12px;color:#fde047;font-weight:bold;">🪙 +${q.rewardCoins}</span>
                <span style="font-size:12px;color:#c084fc;font-weight:bold;">🔮 +${q.rewardShards}</span>
                <button type="button" class="bof-quest-claim-btn ${q.isClaimed ? 'is-claimed' : (q.isCompleted ? 'is-ready' : '')}" data-claim-quest="${q.id}" ${q.isClaimed || !q.isCompleted ? 'disabled' : ''}>
                  ${q.isClaimed ? '✓ รับแล้ว' : (q.isCompleted ? '✨ กดรับรางวัล' : 'กำลังดำเนินการ')}
                </button>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    // ผูกตัวนับเวลาถอยหลังแบบเรียลไทม์
    if (window._questTimerInterval) clearInterval(window._questTimerInterval);
    window._questTimerInterval = setInterval(() => {
      const el = document.getElementById('quest-countdown-timer');
      if (el) {
        el.textContent = formatCountdown();
      } else {
        clearInterval(window._questTimerInterval);
      }
    }, 1000);

    // ปุ่มรับ Daily Login
    const dailyBtn = container.querySelector('#btn-claim-daily');
    if (dailyBtn && !isDailyClaimed) {
      dailyBtn.onclick = () => {
        economy.coins = (economy.coins || 0) + 300;
        economy.shards = (economy.shards || 0) + 50;
        economy.lastDailyClaimDate = today;
        saveEconomy();
        if (window.BOF_AUDIO) window.BOF_AUDIO.playSsr();
        showShopToast('🎉 เช็คอินประจำวันสำเร็จ! ได้รับ +300 Coins และ +50 Soul Shards!');
        renderQuestsView(container);
      };
    }

    // ปุ่มรับรางวัลแต่ละเควสต์
    container.querySelectorAll('.bof-quest-claim-btn[data-claim-quest]').forEach(btn => {
      btn.onclick = () => {
        const qId = btn.dataset.claimQuest;
        const q = quests.find(item => item.id === qId);
        if (!q || q.isClaimed || !q.isCompleted) return;

        economy.claimedQuests[qId] = true;
        economy.coins = (economy.coins || 0) + q.rewardCoins;
        economy.shards = (economy.shards || 0) + q.rewardShards;
        saveEconomy();
        if (window.BOF_AUDIO) window.BOF_AUDIO.playSsr();
        showShopToast(`🎉 รับรางวัลเควสต์สำเร็จ! ได้รับ +${q.rewardCoins} 🪙 และ +${q.rewardShards} 🔮`);
        renderQuestsView(container);
      };
    });
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
      const st = document.getElementById('bof-reveal-stage');
      if (st) {
        st.classList.remove('is-open');
        st.style.display = 'none';
      }
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
        if (!economy.dailyProgress) economy.dailyProgress = { date: new Date().toISOString().split('T')[0], packsOpened: 0, craftsDone: 0, duelsCompleted: 0 };
        economy.dailyProgress.duelsCompleted = (economy.dailyProgress.duelsCompleted || 0) + 1;
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
