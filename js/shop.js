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

  const DEFAULT_OWNED_COSMETICS = {
    cb_default: true,
    pf_default: true,
    tt_default: true,
    mt_default: true
  };

  const DEFAULT_EQUIPPED_COSMETICS = {
    card_back: 'cb_default',
    frame: 'pf_default',
    title: 'tt_default',
    arena_theme: 'mt_default'
  };

  // สร้างลวดลายหลังการ์ดแบบ SVG ความละเอียดสูงสำหรับแต่ละธีมธาตุ
  function makeCardBackSvgDataUri(opts) {
    const {
      bg1 = '#0f172a',
      bg2 = '#1e1b4b',
      border = '#facc15',
      accent = '#38bdf8',
      glow = '#f59e0b',
      symbol = '⚔️',
      title = 'BOF',
      pattern = 'circle'
    } = opts || {};

    let patternShapes = '';
    if (pattern === 'dragon') {
      patternShapes = `
        <polygon points="150,36 244,120 210,210 150,165 90,210 56,120" fill="none" stroke="${accent}" stroke-width="3" opacity="0.55"/>
        <polygon points="150,384 244,300 210,210 150,255 90,210 56,300" fill="none" stroke="${accent}" stroke-width="3" opacity="0.55"/>
        <circle cx="150" cy="210" r="88" fill="none" stroke="${border}" stroke-width="3" stroke-dasharray="10 6"/>
      `;
    } else if (pattern === 'siam') {
      patternShapes = `
        <rect x="52" y="68" width="196" height="284" rx="14" fill="none" stroke="${border}" stroke-width="2.5" stroke-dasharray="6 4" opacity="0.7"/>
        <polygon points="150,55 235,210 150,365 65,210" fill="none" stroke="${accent}" stroke-width="3.5"/>
        <polygon points="150,90 208,210 150,330 92,210" fill="none" stroke="${border}" stroke-width="2"/>
      `;
    } else if (pattern === 'cyber') {
      patternShapes = `
        <path d="M40,90 L110,90 L135,125 L165,125 L190,90 L260,90" fill="none" stroke="${accent}" stroke-width="3" opacity="0.75"/>
        <path d="M40,330 L110,330 L135,295 L165,295 L190,330 L260,330" fill="none" stroke="${accent}" stroke-width="3" opacity="0.75"/>
        <polygon points="150,110 236,160 236,260 150,310 64,260 64,160" fill="none" stroke="${border}" stroke-width="3"/>
        <polygon points="150,132 216,170 216,250 150,288 84,250 84,170" fill="none" stroke="${accent}" stroke-width="2" stroke-dasharray="8 4"/>
      `;
    } else if (pattern === 'abyss') {
      patternShapes = `
        <circle cx="150" cy="210" r="98" fill="none" stroke="${accent}" stroke-width="2.5" stroke-dasharray="4 6"/>
        <polygon points="150,104 178,182 260,182 194,230 218,308 150,260 82,308 106,230 40,182 122,182" fill="none" stroke="${border}" stroke-width="2.5" opacity="0.7"/>
        <circle cx="150" cy="210" r="64" fill="#090314" stroke="${border}" stroke-width="3"/>
      `;
    } else if (pattern === 'sakura') {
      patternShapes = `
        <circle cx="150" cy="175" r="78" fill="${glow}" opacity="0.28"/>
        <circle cx="150" cy="210" r="92" fill="none" stroke="${border}" stroke-width="2.5"/>
        <path d="M60,320 Q150,250 240,320" fill="none" stroke="${accent}" stroke-width="3" opacity="0.7"/>
        <circle cx="85" cy="115" r="6" fill="${accent}" opacity="0.8"/>
        <circle cx="220" cy="135" r="5" fill="${border}" opacity="0.8"/>
        <circle cx="95" cy="295" r="5" fill="${border}" opacity="0.8"/>
        <circle cx="210" cy="280" r="7" fill="${accent}" opacity="0.8"/>
      `;
    } else if (pattern === 'prism') {
      patternShapes = `
        <polygon points="150,48 252,210 150,372 48,210" fill="none" stroke="#38bdf8" stroke-width="3"/>
        <polygon points="150,78 232,210 150,342 68,210" fill="none" stroke="#f472b6" stroke-width="2.5"/>
        <polygon points="62,122 238,122 150,346" fill="none" stroke="#fde047" stroke-width="2" opacity="0.75"/>
        <polygon points="62,298 238,298 150,74" fill="none" stroke="#4ade80" stroke-width="2" opacity="0.75"/>
      `;
    } else {
      patternShapes = `
        <circle cx="150" cy="210" r="96" fill="none" stroke="${accent}" stroke-width="2.5" stroke-dasharray="12 6"/>
        <circle cx="150" cy="210" r="76" fill="none" stroke="${border}" stroke-width="2"/>
        <polygon points="150,92 222,210 150,328 78,210" fill="none" stroke="${border}" stroke-width="2.5" opacity="0.75"/>
      `;
    }

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 420" width="300" height="420">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${bg1}"/>
          <stop offset="55%" stop-color="${bg2}"/>
          <stop offset="100%" stop-color="${bg1}"/>
        </linearGradient>
        <radialGradient id="core" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="${glow}" stop-opacity="0.55"/>
          <stop offset="65%" stop-color="${accent}" stop-opacity="0.18"/>
          <stop offset="100%" stop-color="${bg1}" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <rect width="300" height="420" rx="22" fill="url(#bg)"/>
      <rect x="12" y="12" width="276" height="396" rx="16" fill="none" stroke="${border}" stroke-width="5"/>
      <rect x="22" y="22" width="256" height="376" rx="12" fill="none" stroke="${accent}" stroke-width="1.8" opacity="0.7"/>
      <circle cx="150" cy="210" r="128" fill="url(#core)"/>
      <circle cx="38" cy="38" r="8" fill="${border}"/>
      <circle cx="262" cy="38" r="8" fill="${border}"/>
      <circle cx="38" cy="382" r="8" fill="${border}"/>
      <circle cx="262" cy="382" r="8" fill="${border}"/>
      ${patternShapes}
      <circle cx="150" cy="210" r="46" fill="${bg1}" stroke="${border}" stroke-width="3.5"/>
      <text x="150" y="224" text-anchor="middle" font-size="40">${symbol}</text>
      <rect x="78" y="344" width="144" height="28" rx="14" fill="${bg1}" stroke="${border}" stroke-width="2"/>
      <text x="150" y="363" text-anchor="middle" fill="${border}" font-family="Kanit, sans-serif" font-weight="800" font-size="14" letter-spacing="2">${title}</text>
    </svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  }

  const COSMETIC_ITEMS = [
    // 1. ลายหลังการ์ด (Card Backs — มีให้เลือกครบ 10 ลายที่ไม่ซ้ำกัน)
    {
      id: 'cb_default',
      category: 'card_back',
      name: 'ลายมาตรฐาน BOF',
      desc: 'หลังการ์ดดั้งเดิมประจำสมรภูมิ Battle of Friends',
      currency: 'free',
      price: 0,
      rarity: 'N',
      image: 'images/card-back.png',
      styleId: 'default'
    },
    {
      id: 'cb_gold_edition',
      category: 'card_back',
      name: 'ลายตราเกียรติยศ BOF',
      desc: 'หลังการ์ดลิมิเต็ดอิดิชัน ตรา Battle of Friends ขอบทองคำ',
      currency: 'coins',
      price: 800,
      rarity: 'SR',
      image: 'images/ด้านหลังการ์ด/การ์ดเกม Battle of Friends.png',
      styleId: 'gold'
    },
    {
      id: 'cb_crimson_hero',
      category: 'card_back',
      name: 'ลายมังกรเพลิงราชันย์',
      desc: 'วงเวทอัคคีสีแดงชาดและตราดาบเพลิงแห่งฮีโร่',
      currency: 'coins',
      price: 900,
      rarity: 'R',
      image: makeCardBackSvgDataUri({
        bg1: '#2a060b', bg2: '#7f1d1d', border: '#fbbf24', accent: '#f97316', glow: '#ef4444',
        symbol: '🔥', title: 'CRIMSON HERO', pattern: 'dragon'
      }),
      styleId: 'crimson'
    },
    {
      id: 'cb_siam_royal',
      category: 'card_back',
      name: 'ลายกนกทองคำสยาม',
      desc: 'ลวดลายไทยประยุกต์สีทองอร่ามประจำกองทัพขุนเหนือ',
      currency: 'coins',
      price: 900,
      rarity: 'R',
      image: makeCardBackSvgDataUri({
        bg1: '#0c192c', bg2: '#1e3a5f', border: '#facc15', accent: '#fb923c', glow: '#f59e0b',
        symbol: '🐘', title: 'SIAM WARLORD', pattern: 'siam'
      }),
      styleId: 'gold'
    },
    {
      id: 'cb_emerald_dino',
      category: 'card_back',
      name: 'ลายมรกตดึกดำบรรพ์',
      desc: 'คริสตัลพลังงานชีวมวลสีเขียวมรกตแห่งศูนย์วิจัยไดโน',
      currency: 'coins',
      price: 1000,
      rarity: 'R',
      image: makeCardBackSvgDataUri({
        bg1: '#032215', bg2: '#065f46', border: '#a3e635', accent: '#34d399', glow: '#10b981',
        symbol: '🦖', title: 'JURASSIC CORE', pattern: 'circle'
      }),
      styleId: 'emerald'
    },
    {
      id: 'cb_cosmic_doom',
      category: 'card_back',
      name: 'ลายจักรวาลวันสิ้นโลก',
      desc: 'เข็มทิศดาราและเนบิวลากาลเวลาแห่งโลกอนาคต',
      currency: 'coins',
      price: 1200,
      rarity: 'SR',
      image: makeCardBackSvgDataUri({
        bg1: '#070b24', bg2: '#1e1b4b', border: '#38bdf8', accent: '#818cf8', glow: '#0ea5e9',
        symbol: '⏳', title: 'CHRONO DOOM', pattern: 'circle'
      }),
      styleId: 'cosmic'
    },
    {
      id: 'cb_abyss_demon',
      category: 'card_back',
      name: 'ลายเนตรมิติมืดจอมมาร',
      desc: 'วงแหวนสุริยุปราคาสีม่วงทมิฬและตราบาปทั้งเจ็ด',
      currency: 'shards',
      price: 250,
      rarity: 'SR',
      image: makeCardBackSvgDataUri({
        bg1: '#090314', bg2: '#3b0764', border: '#c084fc', accent: '#f43f5e', glow: '#9333ea',
        symbol: '😈', title: 'ABYSS DEMON', pattern: 'abyss'
      }),
      styleId: 'abyss'
    },
    {
      id: 'cb_cyber_matrix',
      category: 'card_back',
      name: 'ลายไซเบอร์นีออน',
      desc: 'แผงวงจรนีออนโอเวอร์ไดรฟ์สีฟ้า-ชมพูสุดล้ำ',
      currency: 'coins',
      price: 1200,
      rarity: 'SR',
      image: makeCardBackSvgDataUri({
        bg1: '#031326', bg2: '#0f2942', border: '#22d3ee', accent: '#f472b6', glow: '#06b6d4',
        symbol: '⚡', title: 'CYBER MATRIX', pattern: 'cyber'
      }),
      styleId: 'cosmic'
    },
    {
      id: 'cb_sakura_moon',
      category: 'card_back',
      name: 'ลายจันทราซากุระสีชาด',
      desc: 'พระจันทร์สีเลือดและกลีบซากุระต้องมนตร์ยามรัตติกาล',
      currency: 'shards',
      price: 300,
      rarity: 'SSR',
      image: makeCardBackSvgDataUri({
        bg1: '#1a0618', bg2: '#4a0e2e', border: '#fda4af', accent: '#fb7185', glow: '#e11d48',
        symbol: '🌸', title: 'BLOOD SAKURA', pattern: 'sakura'
      }),
      styleId: 'crimson'
    },
    {
      id: 'cb_prismatic_holo',
      category: 'card_back',
      name: 'ลายปริซึมราชันย์ไร้พ่าย',
      desc: 'คริสตัลสายรุ้งโฮโลแกรม 7 สี ระดับตำนานสูงสุดแห่ง BOF',
      currency: 'coins',
      price: 2000,
      rarity: 'SSR',
      image: makeCardBackSvgDataUri({
        bg1: '#0f172a', bg2: '#311042', border: '#fde047', accent: '#38bdf8', glow: '#ec4899',
        symbol: '👑', title: 'PRISMATIC SSR', pattern: 'prism'
      }),
      styleId: 'gold'
    },

    // 2. กรอบโปรไฟล์ (Profile Frames)
    {
      id: 'pf_default',
      category: 'frame',
      name: 'กรอบมาตรฐาน',
      desc: 'กรอบโปรไฟล์และลีดเดอร์แบบคลาสสิก',
      currency: 'free',
      price: 0,
      rarity: 'N',
      styleId: 'default'
    },
    {
      id: 'pf_gold',
      category: 'frame',
      name: 'กรอบทองคำราชันย์',
      desc: 'กรอบทองคำแท้ส่องประกายรอบรูปโปรไฟล์และลีดเดอร์',
      currency: 'coins',
      price: 600,
      rarity: 'R',
      styleId: 'gold'
    },
    {
      id: 'pf_crimson',
      category: 'frame',
      name: 'กรอบเพลิงโลกันตร์',
      desc: 'กรอบเปลวไฟสีแดงส้มลุกโชนทรงพลัง',
      currency: 'coins',
      price: 800,
      rarity: 'SR',
      styleId: 'crimson'
    },
    {
      id: 'pf_neon',
      category: 'frame',
      name: 'กรอบนีออนไซเบอร์',
      desc: 'กรอบแสงนีออนสีฟ้า-ชมพูแห่งโลกอนาคต',
      currency: 'coins',
      price: 800,
      rarity: 'SR',
      styleId: 'neon'
    },
    {
      id: 'pf_abyss',
      category: 'frame',
      name: 'กรอบเนตรมิติมืด',
      desc: 'กรอบพลังงานมืดสีม่วงเข้มของจอมปีศาจ',
      currency: 'shards',
      price: 200,
      rarity: 'SR',
      styleId: 'abyss'
    },
    {
      id: 'pf_holo',
      category: 'frame',
      name: 'กรอบสายรุ้งโฮโลแกรม',
      desc: 'กรอบปริซึมเจ็ดสีหมุนวนระดับสูงสุด',
      currency: 'coins',
      price: 1500,
      rarity: 'SSR',
      styleId: 'holo'
    },

    // 3. ฉายาผู้เล่น (Player Titles)
    {
      id: 'tt_default',
      category: 'title',
      name: 'นักดวลหน้าใหม่',
      badgeText: '⚔️ นักดวลหน้าใหม่',
      desc: 'ฉายาเริ่มต้นของนักดวลทุกคน',
      currency: 'free',
      price: 0,
      rarity: 'N',
      color: '#94a3b8'
    },
    {
      id: 'tt_hero',
      category: 'title',
      name: 'จ้าวแห่งฮีโร่',
      badgeText: '🔥 จ้าวแห่งฮีโร่',
      desc: 'ฉายาผู้สืบทอดเจตจำนงแห่งเดจิต',
      currency: 'coins',
      price: 500,
      rarity: 'R',
      color: '#4ade80'
    },
    {
      id: 'tt_warlord',
      category: 'title',
      name: 'แม่ทัพขุนศึกสยาม',
      badgeText: '🐘 แม่ทัพขุนศึกสยาม',
      desc: 'ฉายาจอมทัพผู้เกรียงไกรแห่งขุนเหนือ',
      currency: 'coins',
      price: 500,
      rarity: 'R',
      color: '#fbbf24'
    },
    {
      id: 'tt_survivor',
      category: 'title',
      name: 'ผู้พิชิตวันสิ้นโลก',
      badgeText: '⏳ ผู้พิชิตวันสิ้นโลก',
      desc: 'ฉายาผู้ก้าวข้ามกาลเวลาและหายนะ',
      currency: 'coins',
      price: 500,
      rarity: 'R',
      color: '#38bdf8'
    },
    {
      id: 'tt_dino',
      category: 'title',
      name: 'นักวิจัยไดโนเสาร์เอก',
      badgeText: '🦖 นักวิจัยไดโนเสาร์เอก',
      desc: 'ฉายาผู้สร้างสุดยอดสายพันธุ์ไฮบริด',
      currency: 'coins',
      price: 500,
      rarity: 'R',
      color: '#a3e635'
    },
    {
      id: 'tt_demon',
      category: 'title',
      name: 'จอมมารบาปทั้งเจ็ด',
      badgeText: '😈 จอมมารบาปทั้งเจ็ด',
      desc: 'ฉายาผู้ปกครองดินแดนแห่งมิติมืด',
      currency: 'shards',
      price: 180,
      rarity: 'SR',
      color: '#c084fc'
    },
    {
      id: 'tt_lunatic',
      category: 'title',
      name: 'ราชันย์สายปั่นท็อปเด็ค',
      badgeText: '🤪 ราชันย์สายปั่นท็อปเด็ค',
      desc: 'ฉายาผู้ฝากชะตาไว้กับใบบนสุดของกอง',
      currency: 'coins',
      price: 700,
      rarity: 'SR',
      color: '#fb923c'
    },
    {
      id: 'tt_tycoon',
      category: 'title',
      name: 'มหาเศรษฐีนักเปิดซอง',
      badgeText: '💎 มหาเศรษฐีนักเปิดซอง',
      desc: 'ฉายาเกียรติยศของสุลต่านแห่งร้านค้า BOF',
      currency: 'coins',
      price: 1500,
      rarity: 'SSR',
      color: '#fde047'
    },

    // 4. สีพื้นสนามประลอง (Arena Mat Themes)
    {
      id: 'mt_default',
      category: 'arena_theme',
      name: 'สนามมาตรฐาน (Midnight)',
      desc: 'พื้นสนามประลองสีน้ำเงินเข้มคลาสสิก',
      currency: 'free',
      price: 0,
      rarity: 'N',
      styleId: 'default',
      previewBg: 'linear-gradient(135deg, #0f172a, #1e293b)'
    },
    {
      id: 'mt_crimson',
      category: 'arena_theme',
      name: 'สนามเพลิงราชันย์ (Volcano)',
      desc: 'พื้นสนามประลองโทนสีแดงเพลิงและลาวาทองคำ',
      currency: 'coins',
      price: 900,
      rarity: 'R',
      styleId: 'crimson',
      previewBg: 'linear-gradient(135deg, #2a0a10, #450a0a, #7f1d1d)'
    },
    {
      id: 'mt_abyss',
      category: 'arena_theme',
      name: 'สนามมิติมืดนิรันดร์ (Abyss)',
      desc: 'พื้นสนามประลองโทนม่วงรัตติกาลแห่งดินแดนปีศาจ',
      currency: 'coins',
      price: 1000,
      rarity: 'SR',
      styleId: 'abyss',
      previewBg: 'linear-gradient(135deg, #13072e, #2e1065, #3b0764)'
    },
    {
      id: 'mt_jungle',
      category: 'arena_theme',
      name: 'สนามดึกดำบรรพ์ (Jurassic)',
      desc: 'พื้นสนามประลองโทนเขียวมรกตศูนย์วิจัยไดโน',
      currency: 'coins',
      price: 900,
      rarity: 'R',
      styleId: 'jungle',
      previewBg: 'linear-gradient(135deg, #052e16, #064e3b, #14532d)'
    },
    {
      id: 'mt_sanctuary',
      category: 'arena_theme',
      name: 'สนามวิหารทองคำ (Sanctuary)',
      desc: 'พื้นสนามประลองโทนทองคำ-น้ำเงินหลวงสุดหรูหรา',
      currency: 'coins',
      price: 1200,
      rarity: 'SR',
      styleId: 'sanctuary',
      previewBg: 'linear-gradient(135deg, #1c1917, #422006, #713f12)'
    },
    {
      id: 'mt_cyber',
      category: 'arena_theme',
      name: 'สนามไซเบอร์นีออน (Cyber)',
      desc: 'พื้นสนามประลองโทนฟ้านีออนไซเบอร์พังก์',
      currency: 'shards',
      price: 250,
      rarity: 'SSR',
      styleId: 'cyber',
      previewBg: 'linear-gradient(135deg, #021024, #082f49, #0c4a6e)'
    }
  ];

  let shopToastTimer = null;
  function showShopToast(text) {
    const el = document.getElementById('bof-shop-toast');
    if (!el) return;
    const isErr = String(text).startsWith('⚠️') || String(text).startsWith('❌');
    el.textContent = text;
    el.className = 'bof-auth-msg ' + (isErr ? 'is-error' : 'is-ok');
    el.style.display = 'block';
    if (shopToastTimer) clearTimeout(shopToastTimer);
    shopToastTimer = setTimeout(() => {
      el.style.display = 'none';
    }, 3500);
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
        claimedQuests: uClaimed,
        ownedCosmetics: { ...DEFAULT_OWNED_COSMETICS, ...(user.ownedCosmetics || {}) },
        equippedCosmetics: { ...DEFAULT_EQUIPPED_COSMETICS, ...(user.equippedCosmetics || {}) }
      };
    }

    let guestCoins = STARTING_COINS;
    let guestShards = 150;
    let guestPacks = 0;
    let guestPity = {};
    let guestDaily = '';
    let guestQuests = {};
    let guestDailyProgress = { date: todayStr, packsOpened: 0, craftsDone: 0, duelsCompleted: 0 };
    let guestOwnedCosmetics = { ...DEFAULT_OWNED_COSMETICS };
    let guestEquippedCosmetics = { ...DEFAULT_EQUIPPED_COSMETICS };
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
        if (savedGuest.ownedCosmetics) {
          guestOwnedCosmetics = { ...DEFAULT_OWNED_COSMETICS, ...savedGuest.ownedCosmetics };
        }
        if (savedGuest.equippedCosmetics) {
          guestEquippedCosmetics = { ...DEFAULT_EQUIPPED_COSMETICS, ...savedGuest.equippedCosmetics };
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
      claimedQuests: guestQuests,
      ownedCosmetics: guestOwnedCosmetics,
      equippedCosmetics: guestEquippedCosmetics
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
          claimedQuests: economy.claimedQuests,
          ownedCosmetics: economy.ownedCosmetics,
          equippedCosmetics: economy.equippedCosmetics
        }));
      } catch (e) {}
    }
    updateCoinDisplays();
    applyEquippedCosmetics();
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
    const todayKey = getThaiQuestDayKey();
    if (!economy.dailyProgress || economy.dailyProgress.date !== todayKey) {
      economy.dailyProgress = { date: todayKey, packsOpened: 0, craftsDone: 0, duelsCompleted: 0 };
      economy.claimedQuests = {};
    }
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

  /* ---------------- ระบบร้านค้า แท็บสุ่มซอง, หลอมการ์ด, เควสต์ประจำวัน และของตกแต่ง ---------------- */
  let activeShopTab = 'packs'; // 'packs' | 'craft' | 'quests' | 'cosmetics'
  let craftFilterTribe = 'ALL';
  let craftFilterRarity = 'ALL';
  let cosmeticFilterCat = 'ALL'; // 'ALL' | 'card_back' | 'frame' | 'title' | 'arena_theme'

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
        <button type="button" class="bof-shop-tab ${activeShopTab === 'packs' ? 'is-active' : ''}" data-tab="packs">📦 สุ่มซองการ์ด<span class="bof-tab-sub"> (Booster)</span></button>
        <button type="button" class="bof-shop-tab ${activeShopTab === 'craft' ? 'is-active' : ''}" data-tab="craft">🔮 ย่อย & หลอม<span class="bof-tab-sub">การ์ด (Crafting)</span></button>
        <button type="button" class="bof-shop-tab ${activeShopTab === 'quests' ? 'is-active' : ''}" data-tab="quests">🎁 เควสต์รายวัน<span class="bof-tab-sub"> & ของขวัญ</span></button>
        <button type="button" class="bof-shop-tab ${activeShopTab === 'cosmetics' ? 'is-active' : ''}" data-tab="cosmetics">🎨 ของตกแต่ง<span class="bof-tab-sub"> (Cosmetics)</span></button>
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
    } else if (activeShopTab === 'cosmetics') {
      renderCosmeticsView(viewContainer);
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
        const todayKey = getThaiQuestDayKey();
        if (!economy.dailyProgress || economy.dailyProgress.date !== todayKey) {
          economy.dailyProgress = { date: todayKey, packsOpened: 0, craftsDone: 0, duelsCompleted: 0 };
          economy.claimedQuests = {};
        }
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
        const todayKey = getThaiQuestDayKey();
        if (!economy.dailyProgress || economy.dailyProgress.date !== todayKey) {
          economy.dailyProgress = { date: todayKey, packsOpened: 0, craftsDone: 0, duelsCompleted: 0 };
          economy.claimedQuests = {};
        }
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
          <div class="bof-daily-login-info">
            <h4 class="bof-daily-login-title">🎁 รางวัลเช็คอินประจำวัน (Daily Login)</h4>
            <p class="bof-daily-login-desc">เข้าเกมรับทันที: <span class="bof-reward-pill is-coin">🪙 +300 Coins</span> <span class="bof-reward-pill is-shard">🔮 +50 Shards</span></p>
          </div>
          <button type="button" class="bof-quest-claim-btn bof-daily-claim-btn ${isDailyClaimed ? 'is-claimed' : ''}" id="btn-claim-daily" ${isDailyClaimed ? 'disabled' : ''}>
            ${isDailyClaimed ? '✓ รับแล้ววันนี้' : '🎁 รับของขวัญทันที'}
          </button>
        </div>

        <div class="bof-quest-section-head">
          <h4 class="bof-quest-section-title">📜 ภารกิจประจำวัน (Daily Missions)</h4>
          <div class="bof-quest-reset-pill">
            ⏳ รีเซ็ตใน: <b id="quest-countdown-timer">${formatCountdown()}</b> (ทุก 06:00 น.)
          </div>
        </div>
        
        ${quests.map(q => {
          const pct = Math.min(100, (q.current / q.max) * 100);
          return `
            <div class="bof-quest-row ${q.isCompleted ? 'is-completed' : ''}">
              <div class="bof-quest-meta">
                <div class="bof-quest-title-row">
                  <h5 class="bof-quest-title">${q.title}</h5>
                  <span class="bof-quest-progress-badge ${q.isCompleted ? 'is-done' : ''}">
                    ${q.current} / ${q.max} ${q.isCompleted ? '✓ สำเร็จ' : ''}
                  </span>
                </div>
                <p class="bof-quest-desc">${q.desc}</p>
                <div class="bof-quest-bar-track">
                  <div class="bof-quest-bar-fill ${q.isCompleted ? 'is-done' : ''}" style="width:${pct}%;"></div>
                </div>
              </div>
              <div class="bof-quest-reward">
                <div class="bof-quest-reward-items">
                  <span class="bof-quest-reward-label">รางวัล:</span>
                  <span class="bof-reward-pill is-coin">🪙 +${q.rewardCoins}</span>
                  <span class="bof-reward-pill is-shard">🔮 +${q.rewardShards}</span>
                </div>
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

  // --- มุมมองที่ 4: ร้านแลกของตกแต่ง (Cosmetics Shop) ---
  function getCosmeticItemById(id) {
    return COSMETIC_ITEMS.find(it => it.id === id) || null;
  }

  function applyEquippedCosmetics() {
    if (!economy) return;
    if (!economy.ownedCosmetics) economy.ownedCosmetics = { ...DEFAULT_OWNED_COSMETICS };
    if (!economy.equippedCosmetics) economy.equippedCosmetics = { ...DEFAULT_EQUIPPED_COSMETICS };

    const eq = economy.equippedCosmetics;

    // 1. ลายหลังการ์ด (Card Back)
    const cbItem = getCosmeticItemById(eq.card_back) || getCosmeticItemById('cb_default');
    if (cbItem) {
      document.documentElement.dataset.cardBack = cbItem.styleId || 'default';
      const rawImg = cbItem.image || 'images/card-back.png';
      const cssUrl = rawImg.startsWith('data:') ? `url("${rawImg}")` : `url('${encodeURI(rawImg)}')`;
      document.documentElement.style.setProperty('--bof-card-back-url', cssUrl);
    }

    // 2. กรอบโปรไฟล์ (Profile Frame)
    const frameItem = getCosmeticItemById(eq.frame) || getCosmeticItemById('pf_default');
    const frameStyle = frameItem ? (frameItem.styleId || 'default') : 'default';
    document.documentElement.dataset.profileFrame = frameStyle;
    const lobbyAvatar = document.querySelector('#lb-auth-bar .lb-auth-avatar');
    if (lobbyAvatar) lobbyAvatar.dataset.frame = frameStyle;
    const profileAvatar = document.getElementById('bof-profile-avatar');
    if (profileAvatar) profileAvatar.dataset.frame = frameStyle;
    const playerLeaderBox = document.getElementById('player-leader-box');
    if (playerLeaderBox) playerLeaderBox.dataset.frame = frameStyle;

    // 3. ฉายาผู้เล่น (Player Title)
    const titleItem = getCosmeticItemById(eq.title) || getCosmeticItemById('tt_default');
    if (titleItem) {
      const authMeta = document.querySelector('#lb-auth-bar .lb-auth-meta');
      if (authMeta) {
        let pill = document.getElementById('lb-cosmetic-title-pill');
        if (!pill) {
          pill = document.createElement('span');
          pill.id = 'lb-cosmetic-title-pill';
          pill.className = 'bof-user-title-pill';
          authMeta.insertBefore(pill, authMeta.firstChild);
        }
        pill.textContent = titleItem.badgeText || titleItem.name;
        pill.style.setProperty('--title-color', titleItem.color || '#94a3b8');
      }

      const profInfo = document.querySelector('#bof-auth-profile-view .bof-profile-info');
      if (profInfo) {
        let pPill = document.getElementById('bof-profile-title-pill');
        if (!pPill) {
          pPill = document.createElement('span');
          pPill.id = 'bof-profile-title-pill';
          pPill.className = 'bof-user-title-pill';
          profInfo.insertBefore(pPill, profInfo.firstChild);
        }
        pPill.textContent = titleItem.badgeText || titleItem.name;
        pPill.style.setProperty('--title-color', titleItem.color || '#94a3b8');
      }
    }

    // 4. ธีมสีพื้นสนามประลอง (Arena Mat Theme)
    const themeItem = getCosmeticItemById(eq.arena_theme) || getCosmeticItemById('mt_default');
    const arenaEl = document.getElementById('bof-game-arena');
    if (arenaEl && themeItem) {
      arenaEl.dataset.arenaTheme = themeItem.styleId || 'default';
    }
  }

  function renderCosmeticsView(container) {
    if (!economy.ownedCosmetics) economy.ownedCosmetics = { ...DEFAULT_OWNED_COSMETICS };
    if (!economy.equippedCosmetics) economy.equippedCosmetics = { ...DEFAULT_EQUIPPED_COSMETICS };

    const countByCat = (cat) => cat === 'ALL'
      ? COSMETIC_ITEMS.length
      : COSMETIC_ITEMS.filter(it => it.category === cat).length;

    const catLabels = {
      ALL: `✨ ทั้งหมด (${countByCat('ALL')})`,
      card_back: `🎴 ลายหลังการ์ด (${countByCat('card_back')})`,
      frame: `🖼️ กรอบโปรไฟล์ (${countByCat('frame')})`,
      title: `👑 ฉายาผู้เล่น (${countByCat('title')})`,
      arena_theme: `🏟️ สีสนามประลอง (${countByCat('arena_theme')})`
    };

    const filteredItems = COSMETIC_ITEMS.filter(it => cosmeticFilterCat === 'ALL' || it.category === cosmeticFilterCat);

    const eqBack = getCosmeticItemById(economy.equippedCosmetics.card_back) || COSMETIC_ITEMS[0];
    const eqFrame = getCosmeticItemById(economy.equippedCosmetics.frame) || getCosmeticItemById('pf_default');
    const eqTitle = getCosmeticItemById(economy.equippedCosmetics.title) || getCosmeticItemById('tt_default');
    const eqTheme = getCosmeticItemById(economy.equippedCosmetics.arena_theme) || getCosmeticItemById('mt_default');
    const currentAvatarSrc = (window.BOFAuth && window.BOFAuth.currentUser && window.BOFAuth.currentUser() && window.BOFAuth.currentUser().customAvatar)
      ? window.BOFAuth.currentUser().customAvatar
      : 'images/เด็คจิต/1.png';

    container.innerHTML = `
      <div class="bof-cosmetics-panel">
        <div class="bof-cosmetics-equipped-bar">
          <div class="bof-cos-eq-head">✨ ชุดของตกแต่งที่กำลังสวมใส่ประจำตัว</div>
          <div class="bof-cos-eq-pills">
            <div class="bof-cos-eq-pill" data-cos-jump="card_back">
              <img class="bof-cos-eq-mini-cb" src="${eqBack ? eqBack.image : 'images/card-back.png'}" alt="">
              <div class="bof-cos-eq-meta">
                <span>🎴 ลายหลังการ์ด</span>
                <b>${eqBack ? eqBack.name : '-'}</b>
              </div>
            </div>
            <div class="bof-cos-eq-pill" data-cos-jump="frame">
              <img class="bof-cos-eq-mini-avatar" data-frame="${eqFrame ? eqFrame.styleId : 'default'}" src="${currentAvatarSrc}" alt="">
              <div class="bof-cos-eq-meta">
                <span>🖼️ กรอบโปรไฟล์</span>
                <b>${eqFrame ? eqFrame.name : '-'}</b>
              </div>
            </div>
            <div class="bof-cos-eq-pill" data-cos-jump="title">
              <div class="bof-cos-eq-meta">
                <span>👑 ฉายาผู้เล่น</span>
                <b style="color:${eqTitle ? eqTitle.color : '#fde047'};">${eqTitle ? eqTitle.badgeText : '-'}</b>
              </div>
            </div>
            <div class="bof-cos-eq-pill" data-cos-jump="arena_theme">
              <span class="bof-cos-eq-mini-swatch" style="background:${eqTheme ? eqTheme.previewBg : '#1e293b'};"></span>
              <div class="bof-cos-eq-meta">
                <span>🏟️ สีสนามประลอง</span>
                <b>${eqTheme ? eqTheme.name : '-'}</b>
              </div>
            </div>
          </div>
        </div>

        <div class="bof-craft-filter-row bof-cosmetics-cat-row">
          ${Object.entries(catLabels).map(([key, label]) => `
            <button type="button" class="bof-craft-filter-btn ${cosmeticFilterCat === key ? 'is-active' : ''}" data-cos-cat="${key}">${label}</button>
          `).join('')}
        </div>

        <div class="bof-cosmetics-grid">
          ${filteredItems.map(item => {
            const isOwned = !!economy.ownedCosmetics[item.id] || item.currency === 'free';
            const isEquipped = economy.equippedCosmetics[item.category] === item.id;
            const canAfford = item.currency === 'coins'
              ? (economy.coins || 0) >= item.price
              : (item.currency === 'shards' ? (economy.shards || 0) >= item.price : true);
            const rarity = item.rarity || 'R';

            let previewHTML = '';
            if (item.category === 'card_back') {
              previewHTML = `
                <div class="bof-cos-preview-cardback" data-cb-style="${item.styleId}">
                  <img src="${item.image}" alt="${item.name}">
                  <span class="bof-cos-cb-shine"></span>
                </div>
              `;
            } else if (item.category === 'frame') {
              previewHTML = `
                <div class="bof-cos-preview-frame-wrap">
                  <img class="bof-cos-avatar-sample" data-frame="${item.styleId}" src="${currentAvatarSrc}" alt="${item.name}">
                </div>
              `;
            } else if (item.category === 'title') {
              previewHTML = `
                <div class="bof-cos-preview-title-wrap">
                  <span class="bof-user-title-pill is-large" style="--title-color:${item.color};border-color:${item.color};color:${item.color};">${item.badgeText}</span>
                </div>
              `;
            } else if (item.category === 'arena_theme') {
              previewHTML = `
                <div class="bof-cos-preview-arena" style="background:${item.previewBg};" data-arena-style="${item.styleId}">
                  <div class="bof-cos-arena-grid-lines">
                    <span></span><span></span><span></span>
                  </div>
                  <div class="bof-cos-arena-divider"></div>
                  <div class="bof-cos-arena-grid-lines">
                    <span></span><span></span><span></span>
                  </div>
                </div>
              `;
            }

            let btnHTML = '';
            if (isEquipped) {
              btnHTML = `<button type="button" class="bof-cos-action-btn is-equipped" disabled>✓ กำลังสวมใส่</button>`;
            } else if (isOwned) {
              btnHTML = `<button type="button" class="bof-cos-action-btn is-equip" data-equip-id="${item.id}">✨ กดสวมใส่</button>`;
            } else {
              const priceLabel = item.currency === 'coins'
                ? `🪙 ${item.price.toLocaleString('th-TH')} Coins`
                : `🔮 ${item.price.toLocaleString('th-TH')} Shards`;
              btnHTML = `<button type="button" class="bof-cos-action-btn is-buy ${canAfford ? '' : 'is-disabled'}" data-buy-id="${item.id}" ${canAfford ? '' : 'disabled'}>🛒 แลกซื้อ · ${priceLabel}</button>`;
            }

            const catBadgeMap = {
              card_back: '🎴 หลังการ์ด',
              frame: '🖼️ กรอบโปรไฟล์',
              title: '👑 ฉายา',
              arena_theme: '🏟️ สีสนาม'
            };

            const statusBadgeHTML = isEquipped
              ? `<span class="bof-cosmetic-status-tag is-eq">✓ สวมใส่อยู่</span>`
              : (isOwned ? `<span class="bof-cosmetic-status-tag is-own">มีในคลัง</span>` : `<span class="bof-cosmetic-rarity-tag is-${rarity}">${rarity}</span>`);

            return `
              <div class="bof-cosmetic-card rarity-border-${rarity} ${isEquipped ? 'is-equipped-card' : ''} ${isOwned ? 'is-owned-card' : ''}">
                <div class="bof-cosmetic-badge-row">
                  <span class="bof-cos-cat-tag">${catBadgeMap[item.category] || ''}</span>
                  ${statusBadgeHTML}
                </div>
                <div class="bof-cos-preview-box">${previewHTML}</div>
                <h5 class="bof-cos-name">${item.name}</h5>
                <p class="bof-cos-desc">${item.desc}</p>
                ${btnHTML}
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;

    container.querySelectorAll('.bof-cos-eq-pill[data-cos-jump]').forEach(pill => {
      pill.onclick = () => {
        cosmeticFilterCat = pill.getAttribute('data-cos-jump') || 'ALL';
        renderCosmeticsView(container);
      };
    });

    container.querySelectorAll('.bof-craft-filter-btn[data-cos-cat]').forEach(btn => {
      btn.onclick = () => {
        cosmeticFilterCat = btn.dataset.cosCat;
        renderCosmeticsView(container);
      };
    });

    container.querySelectorAll('.bof-cos-action-btn[data-equip-id]').forEach(btn => {
      btn.onclick = () => {
        const id = btn.dataset.equipId;
        const item = getCosmeticItemById(id);
        if (!item) return;
        economy.equippedCosmetics[item.category] = item.id;
        saveEconomy();
        if (window.BOF_AUDIO) window.BOF_AUDIO.playSpell();
        showShopToast(`✨ สวมใส่ "${item.name}" เรียบร้อยแล้ว!`);
        renderCosmeticsView(container);
      };
    });

    container.querySelectorAll('.bof-cos-action-btn[data-buy-id]').forEach(btn => {
      btn.onclick = () => {
        const id = btn.dataset.buyId;
        const item = getCosmeticItemById(id);
        if (!item) return;
        if (item.currency === 'coins') {
          if ((economy.coins || 0) < item.price) {
            showShopToast('⚠️ เหรียญ Coins ไม่พอสำหรับแลกของตกแต่งชิ้นนี้!');
            return;
          }
          economy.coins -= item.price;
        } else if (item.currency === 'shards') {
          if ((economy.shards || 0) < item.price) {
            showShopToast('⚠️ เศษวิญญาณ Soul Shards ไม่พอสำหรับแลกของตกแต่งชิ้นนี้!');
            return;
          }
          economy.shards -= item.price;
        }
        economy.ownedCosmetics[item.id] = true;
        economy.equippedCosmetics[item.category] = item.id;
        saveEconomy();
        if (window.BOF_AUDIO) window.BOF_AUDIO.playSsr();
        showShopToast(`🎉 แลกซื้อและสวมใส่ "${item.name}" สำเร็จ!`);
        renderCosmeticsView(container);
      };
    });
  }

  /* ---------------- กรองคลังการ์ด & จัดเด็คตามการ์ดที่มีจริง (เฉพาะตอนล็อกอิน) ---------------- */
  function syncLobbyDecksForOwnership() {
    if (typeof CARD_DATABASE === 'undefined') return;
    const deckBtns = document.querySelectorAll('#lb-decks .lb-deck');
    deckBtns.forEach(btn => {
      btn.style.display = '';
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
            cardEl.dataset.allowedMax = String(allowedMax);
          }
        });

        return res;
      };
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

    // แจกเหรียญ Coins อัตโนมัติหลังจบเกม (ชนะรับตามระดับความยาก AI: ง่าย +250, ปกติ +300, โหด +400 | แพ้ +100 🪙)
    if (typeof window.showEndMatchModal === 'function') {
      const origEnd = window.showEndMatchModal;
      window.showEndMatchModal = function (title, desc) {
        const isWin = String(title).includes('ชนะ');
        let reward = 100;
        if (isWin) {
          const diff = (typeof aiConfig !== 'undefined' && aiConfig && aiConfig.difficulty) ? aiConfig.difficulty : 'NORMAL';
          const isPvP = typeof pvpState !== 'undefined' && pvpState && pvpState.isMultiplayer;
          if (isPvP) reward = 350;
          else if (diff === 'HARD') reward = 400;
          else if (diff === 'EASY') reward = 250;
          else reward = 300;
        }
        economy = loadEconomy();
        economy.coins = (economy.coins || 0) + reward;
        const todayKey = getThaiQuestDayKey();
        if (!economy.dailyProgress || economy.dailyProgress.date !== todayKey) {
          economy.dailyProgress = { date: todayKey, packsOpened: 0, craftsDone: 0, duelsCompleted: 0 };
          economy.claimedQuests = {};
        }
        economy.dailyProgress.duelsCompleted = (economy.dailyProgress.duelsCompleted || 0) + 1;
        saveEconomy();
        const extraDesc = `${desc || ''} (ได้รับรางวัลแมตช์ +${reward} 🪙 Coins!)`;
        return origEnd.call(this, title, extraDesc);
      };
    }
  }

  window.BOFShop = {
    getEconomy: () => economy,
    applyEquippedCosmetics,
    reloadFromProfile: () => {
      economy = loadEconomy();
      updateCoinDisplays();
      syncLobbyDecksForOwnership();
      applyEquippedCosmetics();
    }
  };

  bindShopEvents();
  hookCollectionAndDeckBuilder();
  updateCoinDisplays();
  syncLobbyDecksForOwnership();
  applyEquippedCosmetics();
})();
