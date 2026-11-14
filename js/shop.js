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

  // เวลาไทยแบบ "นาฬิกาผนัง" (เหมือน getThaiQuestDayKey)
  function thaiNow() {
    const n = new Date();
    return new Date(n.getTime() + n.getTimezoneOffset() * 60000 + 7 * 3600000);
  }
  // รอบเควสต์รายสัปดาห์: เริ่มวันจันทร์ 06:00 น. เวลาไทย · คีย์ = วันที่ของวันจันทร์นั้น
  function weekStart() {
    const t = thaiNow();
    t.setHours(t.getHours() - 6);
    t.setDate(t.getDate() - ((t.getDay() + 6) % 7));
    t.setHours(6, 0, 0, 0);
    return t;
  }
  function getThaiQuestWeekKey() {
    const t = weekStart();
    return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
  }
  function msToWeeklyReset() {
    const t = weekStart();
    t.setDate(t.getDate() + 7);
    return Math.max(0, t - thaiNow());
  }
  function msToDailyReset() {
    const t = thaiNow(), r = new Date(t);
    if (t.getHours() >= 6) r.setDate(r.getDate() + 1);
    r.setHours(6, 0, 0, 0);
    return Math.max(0, r - t);
  }

  // ตัวนับเควสต์: รีเซ็ตรายวัน/รายสัปดาห์เมื่อข้ามรอบ แล้วนับเพิ่มทั้งสองฝั่งพร้อมกัน
  const freshProgress = () => ({ packsOpened: 0, craftsDone: 0, duelsCompleted: 0, duelsWon: 0 });
  function ensureProgress(eco = economy) {
    const d = getThaiQuestDayKey(), w = getThaiQuestWeekKey();
    if (!eco.dailyProgress || eco.dailyProgress.date !== d) { eco.dailyProgress = { date: d, ...freshProgress() }; eco.claimedQuests = {}; }
    if (!eco.weeklyProgress || eco.weeklyProgress.week !== w) { eco.weeklyProgress = { week: w, ...freshProgress() }; eco.claimedWeekly = {}; }
    if (!eco.claimedQuests) eco.claimedQuests = {};
    if (!eco.claimedWeekly) eco.claimedWeekly = {};
    return eco;
  }
  function bumpProgress(field, n = 1) {
    ensureProgress();
    economy.dailyProgress[field] = (economy.dailyProgress[field] || 0) + n;
    economy.weeklyProgress[field] = (economy.weeklyProgress[field] || 0) + n;
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
      return ensureProgress({
        coins: typeof user.coins === 'number' ? user.coins : STARTING_COINS,
        shards: typeof user.shards === 'number' ? user.shards : 150,
        ownedCards: user.ownedCards && typeof user.ownedCards === 'object' ? { ...user.ownedCards } : {},
        packsOpened: Number(user.packsOpened || 0),
        pity: user.pity && typeof user.pity === 'object' ? { ...user.pity } : {},
        lastDailyClaimDate: user.lastDailyClaimDate || '',
        dailyProgress: uProgress,
        claimedQuests: uClaimed,
        weeklyProgress: user.weeklyProgress ? { ...user.weeklyProgress } : null,
        claimedWeekly: user.claimedWeekly ? { ...user.claimedWeekly } : {},
        ownedCosmetics: { ...DEFAULT_OWNED_COSMETICS, ...(user.ownedCosmetics || {}) },
        equippedCosmetics: { ...DEFAULT_EQUIPPED_COSMETICS, ...(user.equippedCosmetics || {}) }
      });
    }

    let guestCoins = STARTING_COINS;
    let guestShards = 150;
    let guestPacks = 0;
    let guestPity = {};
    let guestDaily = '';
    let guestQuests = {};
    let guestWeekly = null;
    let guestClaimedWeekly = {};
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
        guestWeekly = savedGuest.weeklyProgress || null;
        guestClaimedWeekly = savedGuest.claimedWeekly || {};
        if (savedGuest.ownedCosmetics) {
          guestOwnedCosmetics = { ...DEFAULT_OWNED_COSMETICS, ...savedGuest.ownedCosmetics };
        }
        if (savedGuest.equippedCosmetics) {
          guestEquippedCosmetics = { ...DEFAULT_EQUIPPED_COSMETICS, ...savedGuest.equippedCosmetics };
        }
      }
    } catch (e) {}

    return ensureProgress({
      coins: guestCoins,
      shards: guestShards,
      ownedCards: getGuestFullOwned(),
      packsOpened: guestPacks,
      pity: guestPity,
      lastDailyClaimDate: guestDaily,
      dailyProgress: guestDailyProgress,
      claimedQuests: guestQuests,
      weeklyProgress: guestWeekly,
      claimedWeekly: guestClaimedWeekly,
      ownedCosmetics: guestOwnedCosmetics,
      equippedCosmetics: guestEquippedCosmetics
    });
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
          weeklyProgress: economy.weeklyProgress,
          claimedWeekly: economy.claimedWeekly,
          ownedCosmetics: economy.ownedCosmetics,
          equippedCosmetics: economy.equippedCosmetics
        }));
      } catch (e) {}
    }
    updateCoinDisplays();
    applyEquippedCosmetics();
    document.dispatchEvent(new CustomEvent('bof:economy'));
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
    const lobbyShardVal = document.getElementById('lb-shard-val');
    if (lobbyShardVal) lobbyShardVal.textContent = shardFmt;
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

  /* ---------------- ฉากเปิดซอง: ลากฉีกซองฟอยล์ (js/pack-open.js) ---------------- */
  const PACK_LABEL = { pack_jit: ['จิต', 'JIT'], pack_nuea: ['เหนือ', 'NUEA'], pack_doom: ['สิ้นโลก', 'DOOM'], pack_dino: ['ไดโน', 'DINO'], pack_demon: ['ปีศาจ', 'DEMON'], pack_oat: ['โอ๊ต', 'OAT'] };
  function playPackOpeningAnimation(pack, packCount, highestRarity, onComplete) {
    const stage = document.getElementById('bof-pack-anim-stage');
    const done = () => { if (onComplete) onComplete(); };
    if (!stage || !window.BOFPackOpen) { done(); return; }
    const [short, en] = PACK_LABEL[pack.id] || [pack.name, 'BOF'];
    window.BOFPackOpen.play(stage, {
      image: pack.image, color: pack.color || '#3ee08f', name: pack.name, short, en,
      count: packCount, top: highestRarity, cards: CARDS_PER_PACK * packCount, perPack: CARDS_PER_PACK
    }).then(done);
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
    bumpProgress('packsOpened', packCount);

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
      const granted = grantCardToCollection(card);
      // เกินจำนวนจัดเด็ค (ลีดเดอร์ 1 · การ์ดอื่น 2) → แปลงเป็นชาร์ดทันที ตามค่าเดียวกับปุ่มย่อยการ์ดซ้ำ
      const maxKeep = card.type === 'Leader' ? 1 : 2;
      if (economy.ownedCards[card.id] > maxKeep) {
        economy.ownedCards[card.id] = maxKeep;
        granted.shards = DISENCHANT_VALUES[card.rarity] || 10;
        economy.shards = (economy.shards || 0) + granted.shards;
      }
      drawn.push(granted);
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

  /* ---------------- อนุภาค (js/fx-particles.js) ---------------- */
  // พลิกการ์ด: N เงียบ (เปิด 10 ซองจะได้ไม่รก) · R/SR/SSR ตาม BOFParticles.rarity
  function flipFx(wrap, rarity) {
    const fx = window.BOFParticles, stage = document.getElementById('bof-reveal-stage');
    if (!fx || !stage || rarity === 'N') return;
    fx.rarity(stage, wrap.getBoundingClientRect(), rarity);
    if (rarity === 'SSR' && window.BOFHaptic) window.BOFHaptic(30);
  }

  /* ---------------- หน้าต่างผลการเปิดซอง: พลิกการ์ด · ใบซ้ำแตกเป็นชาร์ดแล้วบินเข้าตัวนับ ---------------- */
  const RARITY_TONE = { SSR: '#fde047', SR: '#ff8597', R: '#7cc0ff', N: '#cbd5e1' };
  const motionOK = () => typeof gsap !== 'undefined' && !matchMedia('(prefers-reduced-motion: reduce)').matches;
  let revealShardTotal = 0;   // ชาร์ดที่นับขึ้นแล้วในหน้าต่างนี้ (ตัวเลขวิ่งไล่ไปหายอดจริง)
  let revealShardShown = { v: 0 };

  function bumpRevealShards(add) {
    revealShardTotal += add;
    const el = document.getElementById('bof-reveal-shards');
    if (!el) return;
    const chip = el.closest('.rv-chip-shard');
    if (!motionOK()) { el.textContent = revealShardTotal.toLocaleString('th-TH'); return; }
    gsap.to(revealShardShown, {
      v: revealShardTotal, duration: .5, ease: 'power2.out', overwrite: 'auto',
      onUpdate: () => { el.textContent = Math.round(revealShardShown.v).toLocaleString('th-TH'); }
    });
    if (chip) gsap.fromTo(chip, { scale: 1.18 }, { scale: 1, duration: .45, ease: 'back.out(3)', overwrite: 'auto' });
  }

  // ใบซ้ำ: สั่น → แตกเป็นเศษคริสตัลบินเข้าตัวนับชาร์ด → การ์ดกลายเป็นป้าย "+N ชาร์ด"
  function shatterToShards(wrap, item) {
    const value = item.shards || 0;
    const finish = () => {
      wrap.classList.add('is-shattered');
      if (window.BOF_AUDIO) window.BOF_AUDIO.playSpell();
      bumpRevealShards(value);
    };
    if (!motionOK()) { finish(); return; }

    const stage = document.getElementById('bof-reveal-stage');
    const target = document.querySelector('#bof-reveal-summary .rv-chip-shard svg') || document.getElementById('bof-reveal-summary');
    const from = wrap.getBoundingClientRect();
    const to = target ? target.getBoundingClientRect() : { left: innerWidth / 2, top: 40, width: 0, height: 0 };
    const cx = from.left + from.width / 2, cy = from.top + from.height / 2;
    const tx = to.left + to.width / 2, ty = to.top + to.height / 2;

    const layer = document.createElement('div');
    layer.className = 'rv-shard-layer';
    stage.appendChild(layer);
    const n = Math.min(14, 6 + Math.round(value / 25));
    const bits = [];
    for (let i = 0; i < n; i++) {
      const b = document.createElement('span');
      b.className = 'rv-shard-bit';
      b.style.left = `${cx}px`; b.style.top = `${cy}px`;
      layer.appendChild(b);
      bits.push(b);
    }

    const front = wrap.querySelector('.bof-flip-front');
    const tl = gsap.timeline({
      onComplete: () => {
        layer.remove();
        if (!wrap.classList.contains('is-shattered')) finish();
        gsap.set(front, { clearProps: 'all' });
        gsap.set(wrap, { clearProps: 'transform' }); // คืน transform ให้ CSS (ชี้แล้วยกการ์ด)
      }
    });
    tl.to(wrap, { x: -3, duration: .05, repeat: 5, yoyo: true, ease: 'none' })
      .set(wrap, { x: 0 })
      .add(() => {
        wrap.classList.add('is-cracking');
        const b = wrap.getBoundingClientRect();
        if (window.BOFParticles) window.BOFParticles.burst(stage, b.left + b.width / 2, b.top + b.height / 2, { count: 14, rings: 1, radius: b.width * .6, speed: 200, size: 10, color: '196, 167, 255', color2: '255, 255, 255' });
      })
      .to(front, { scale: .86, opacity: .25, filter: 'saturate(0) brightness(1.6)', duration: .28, ease: 'power2.in' })
      .add(() => { if (!wrap.classList.contains('is-shattered')) finish(); gsap.set(front, { clearProps: 'all' }); });
    bits.forEach((b, i) => {
      const ang = (Math.PI * 2 * i) / n + Math.random() * .5;
      const r = 50 + Math.random() * 45;
      const delay = .32 + Math.random() * .06;
      gsap.timeline({ delay })
        .fromTo(b, { x: 0, y: 0, scale: .4, rotation: Math.random() * 180, opacity: 1 },
          { x: Math.cos(ang) * r, y: Math.sin(ang) * r, scale: 1, rotation: '+=160', duration: .32, ease: 'power3.out' })
        .to(b, { x: tx - cx, y: ty - cy, scale: .35, rotation: '+=220', duration: .5 + i * .025, ease: 'power3.in' })
        .to(b, { opacity: 0, duration: .08 });
    });
    tl.duration(Math.max(tl.duration(), 1.3));
  }

  function flipRevealCard(wrap) {
    if (!wrap || wrap.classList.contains('is-flipped')) return false;
    wrap.classList.add('is-flipped');
    const item = wrap._revealItem;
    if (window.BOF_AUDIO) window.BOF_AUDIO.playCardDraw();
    if (item && item.card.rarity === 'SSR' && window.BOFPackOpen) window.BOFPackOpen.ssrSpot(wrap); // ไฟส่องใบ SSR
    // SSR ฉลองเสมอแม้เป็นใบซ้ำ (ใบซ้ำจะแตกเป็นชาร์ดตามหลัง)
    if (item && (!item.shards || item.card.rarity === 'SSR') && motionOK()) setTimeout(() => flipFx(wrap, item.card.rarity), 280);
    if (item && item.shards) setTimeout(() => shatterToShards(wrap, item), 600); // รอให้พลิกเสร็จ (0.55s) ก่อนแตก
    return true;
  }

  function showPackRevealStage(titleText, drawnItems) {
    const stage = document.getElementById('bof-reveal-stage');
    const titleEl = document.getElementById('bof-reveal-title');
    const summaryEl = document.getElementById('bof-reveal-summary');
    const cardsBox = document.getElementById('bof-reveal-cards');
    if (!stage || !cardsBox) return;

    revealShardTotal = 0;
    revealShardShown = { v: 0 };

    if (titleEl) {
      titleEl.innerHTML = `ผลการเปิดซอง <span>${titleText}</span><small>แตะการ์ดเพื่อพลิก · พลิกแล้วแตะอีกครั้งหรือคลิกขวาเพื่อดูใบใหญ่</small>`;
    }

    if (summaryEl) {
      const counts = { SSR: 0, SR: 0, R: 0, N: 0, newCount: 0, dupes: 0, shards: 0 };
      drawnItems.forEach(it => {
        counts[it.card.rarity] = (counts[it.card.rarity] || 0) + 1;
        if (it.isNew) counts.newCount++;
        if (it.shards) { counts.dupes++; counts.shards += it.shards; }
      });
      summaryEl.innerHTML = ['SSR', 'SR', 'R', 'N']
        .filter(r => counts[r] > 0)
        .map(r => `<span class="rv-chip" style="--t:${RARITY_TONE[r]}"><b>${r}</b>${counts[r]} ใบ</span>`).join('')
        + (counts.newCount ? `<span class="rv-chip rv-chip-new">การ์ดใหม่ ${counts.newCount} ใบ</span>` : '')
        + (counts.shards ? `<span class="rv-chip rv-chip-shard" title="การ์ดซ้ำ ${counts.dupes} ใบ กลายเป็นชาร์ดรวม ${counts.shards}">${SHARD_SVG}ชาร์ด +<b id="bof-reveal-shards">0</b><small>/ ${counts.shards.toLocaleString('th-TH')}</small></span>` : '');
    }

    cardsBox.innerHTML = '';

    drawnItems.forEach((item, idx) => {
      const c = item.card;
      const wrap = document.createElement('div');
      wrap.className = 'bof-flip-card' + (item.shards ? ' is-dupe' : '');
      wrap.style.animationDelay = `${Math.min(idx * 0.03, 0.8)}s`;
      wrap.tabIndex = 0;
      wrap.setAttribute('role', 'button');
      wrap.setAttribute('aria-label', `การ์ดใบที่ ${idx + 1} จาก ${drawnItems.length} แตะเพื่อพลิก`);
      wrap._revealItem = item;

      const inner = document.createElement('div');
      inner.className = 'bof-flip-inner';

      const back = document.createElement('div');
      back.className = `bof-flip-back hint-${c.rarity}`;
      back.innerHTML = `<span class="rv-back-n">${idx + 1}</span><span>แตะเพื่อพลิก</span>`;

      const front = document.createElement('div');
      front.className = 'bof-flip-front';

      const pillLabel = item.shards ? `ซ้ำ · ${c.rarity}` : (item.isNew ? `ใหม่ · ${c.rarity}` : c.rarity);
      const foilCardEl = createFullArtFoilCard(c, pillLabel);
      front.appendChild(foilCardEl);
      if (item.shards) {
        const res = document.createElement('div');
        res.className = 'rv-dupe-result';
        res.innerHTML = `${SHARD_SVG}<b>+${item.shards}</b><span>ชาร์ด</span><small>${c.name}</small>`;
        front.appendChild(res);
      }

      inner.appendChild(back);
      inner.appendChild(front);
      wrap.appendChild(inner);

      const openDetail = () => {
        if (typeof window.openCardDetailModal === 'function') window.openCardDetailModal(c, null, foilCardEl);
      };
      wrap.addEventListener('click', () => { if (!flipRevealCard(wrap)) openDetail(); });
      wrap.addEventListener('keydown', e => {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        e.preventDefault();
        if (!flipRevealCard(wrap)) openDetail();
      });
      wrap.addEventListener('contextmenu', e => { e.preventDefault(); openDetail(); });

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

  // พลิกทั้งหมด: ไล่พลิกทีละใบ (ใบซ้ำจะแตกเป็นชาร์ดตามจังหวะ)
  function flipAllRevealCards() {
    const cards = [...document.querySelectorAll('#bof-reveal-cards .bof-flip-card:not(.is-flipped)')];
    const gap = motionOK() ? Math.max(40, Math.min(110, 1400 / Math.max(1, cards.length))) : 0;
    cards.forEach((c, i) => setTimeout(() => flipRevealCard(c), i * gap));
  }

  /* ---------------- ระบบร้านค้า แท็บสุ่มซอง, หลอมการ์ด, เควสต์ประจำวัน และของตกแต่ง ---------------- */
  let activeShopTab = 'packs'; // 'packs' | 'craft' | 'cosmetics'
  let craftFilterTribe = 'ALL';
  let craftFilterRarity = 'ALL';
  let cosmeticFilterCat = 'ALL'; // 'ALL' | 'card_back' | 'frame' | 'title' | 'arena_theme'

  // มูลค่าย่อยการ์ดส่วนเกิน -> Soul Shards (🔮)
  const DISENCHANT_VALUES = { N: 10, R: 30, SR: 100, SSR: 300 };
  // ค่าใช้จ่ายในการหลอมการ์ดใหม่ (Crafting Cost)
  const CRAFT_COSTS = { N: 50, R: 150, SR: 400, SSR: 1000 };

  // แท็บร้าน (แบบ A): 4 แท็บกว้างเท่ากัน + เส้นทองใต้แท็บที่เลื่อนตามแท็บที่เลือก (--i) · แท็บเควสต์มีจุดบอกรางวัลที่รอรับ
  const SHOP_TABS = [
    { id: 'packs', label: 'สุ่มซอง', icon: '<rect x="6" y="3" width="12" height="18" rx="2"/><path d="M9 8h6M9 12h6"/>' },
    { id: 'craft', label: 'หลอมการ์ด', icon: '<path d="M9 3h6M10 3v6l-5 9a2 2 0 002 3h10a2 2 0 002-3l-5-9V3"/>' },
    { id: 'cosmetics', label: 'ของตกแต่ง', icon: '<path d="M14 4l6 6-8 8-6-6zM6 12l-2 6 6-2"/>' }
  ];
  const COIN_SVG = '<svg class="sh-ico-coin" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="#f3c969"/><circle cx="12" cy="12" r="6.5" fill="none" stroke="#b07a1e" stroke-width="1.6"/></svg>';
  const SHARD_SVG = '<svg class="sh-ico-shard" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2l7 7-7 13-7-13z" fill="#c4a7ff"/><path d="M5 9h14M12 2l-3 7 3 13 3-13z" stroke="#7d5cd6" stroke-width="1" fill="none"/></svg>';

  function renderActiveTabView() {
    const viewContainer = document.getElementById('bof-tab-view-container');
    if (!viewContainer) return;
    viewContainer.style.setProperty('--accent', '#f3c969'); // หมวดที่มีตัวกรองสีจะตั้งสีของตัวเองทับ
    if (activeShopTab === 'packs') renderPacksView(viewContainer);
    else if (activeShopTab === 'craft') renderCraftingView(viewContainer);
    else if (activeShopTab === 'cosmetics') renderCosmeticsView(viewContainer);
  }

  function renderShopContent() {
    updateCoinDisplays();
    const body = document.getElementById('bof-shop-dynamic-body');
    if (!body) return;
    const idx = Math.max(0, SHOP_TABS.findIndex(t => t.id === activeShopTab));

    body.innerHTML = `
      <div class="sh-tabs" role="tablist" aria-label="หมวดร้านค้า" style="--i:${idx}">
        ${SHOP_TABS.map(t => `
          <button type="button" class="sh-tab" role="tab" id="sh-tab-${t.id}" data-tab="${t.id}" aria-selected="${t.id === activeShopTab}" aria-controls="bof-tab-view-container" tabindex="${t.id === activeShopTab ? 0 : -1}">
            <svg viewBox="0 0 24 24" aria-hidden="true">${t.icon}</svg><span>${t.label}</span>
          </button>`).join('')}
        <span class="sh-tab-ink" aria-hidden="true"></span>
      </div>
      <div id="bof-tab-view-container" class="sh-view" role="tabpanel" aria-labelledby="sh-tab-${activeShopTab}"></div>
    `;

    const tabsEl = body.querySelector('.sh-tabs');
    const tabs = [...tabsEl.querySelectorAll('.sh-tab')];
    const selectTab = (btn, focus) => {
      if (btn.dataset.tab === activeShopTab) return;
      activeShopTab = btn.dataset.tab;
      tabsEl.style.setProperty('--i', tabs.indexOf(btn));
      tabs.forEach(t => { const on = t === btn; t.setAttribute('aria-selected', String(on)); t.tabIndex = on ? 0 : -1; });
      if (focus) btn.focus();
      const view = document.getElementById('bof-tab-view-container');
      view.setAttribute('aria-labelledby', btn.id);
      renderActiveTabView();
      view.dispatchEvent(new CustomEvent('shop:tab', { bubbles: true, detail: { tab: activeShopTab } }));
    };
    tabs.forEach(btn => btn.addEventListener('click', () => selectTab(btn, false)));
    tabsEl.addEventListener('keydown', e => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      e.preventDefault();
      const i = tabs.findIndex(t => t.dataset.tab === activeShopTab);
      selectTab(tabs[(i + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length], true);
    });

    renderActiveTabView();
  }

  // --- มุมมองที่ 1: ซองการ์ด 6 สาย (แบบ A): สวิตช์ "เปิดครั้งละ 1 / 10 ซอง" ด้านบน → แต่ละซองเหลือปุ่มเดียว ---
  let packQty = 1;
  const thumbOf = img => String(img).replace(/^images\//, 'images/thumbs/').replace(/\.png$/, '.webp');
  const buyLabel = (p, qty) => `เปิด ${qty} ซอง · <span class="sh-price">${COIN_SVG}${(qty === 10 ? p.tenPrice : p.price).toLocaleString('th-TH')}</span>`;

  function renderPacksView(container) {
    const totalUnique = typeof CARD_DATABASE !== 'undefined' ? CARD_DATABASE.length : 72;
    const ownedUnique = Object.keys(economy.ownedCards).filter(id => economy.ownedCards[id] > 0).length;

    container.innerHTML = `
      <div class="sh-packs-bar">
        <div class="sh-qty" role="radiogroup" aria-label="จำนวนซองต่อครั้ง" data-q="${packQty}">
          <span class="sh-qty-thumb" aria-hidden="true"></span>
          <button type="button" role="radio" data-qty="1" aria-checked="${packQty === 1}">1 ซอง</button>
          <button type="button" role="radio" data-qty="10" aria-checked="${packQty === 10}">10 ซอง <span class="sh-save">−10%</span></button>
        </div>
        <p class="sh-packs-info">ซองละ 5 ใบ · N 40% · R 30% · SR 20% · SSR 10% · สะสมแล้ว <b>${ownedUnique}/${totalUnique}</b> แบบ</p>
      </div>
      <p class="sh-dupe-note">${SHARD_SVG}<span>การ์ดที่เกินจำนวนจัดเด็ค (ลีดเดอร์ 1 ใบ · การ์ดอื่น 2 ใบ) จะกลายเป็นชาร์ดให้อัตโนมัติ</span></p>

      <div class="sh-packs">
        ${FACTION_PACKS.map(p => {
          const deckCards = typeof CARD_DATABASE !== 'undefined'
            ? CARD_DATABASE.filter(c => c.image && c.image.startsWith(p.prefix))
            : [];
          const leader = deckCards.find(c => c.type === 'Leader');
          const ownedInDeck = deckCards.filter(c => economy.ownedCards[c.id] > 0).length;
          const pityCount = (economy.pity && economy.pity[p.id]) || 0;
          const remainingPity = Math.max(0, PITY_THRESHOLD - pityCount);
          const pityPercent = Math.min(100, (pityCount / PITY_THRESHOLD) * 100);

          return `
            <article class="sh-pack" style="--c:${p.color};">
              <div class="sh-pack-art"><span class="sh-pack-back" aria-hidden="true"></span><img src="${thumbOf(p.image)}" alt="" loading="lazy"></div>
              <div class="sh-pack-info">
                <h3>${p.name}</h3>
                <p>ลุ้นลีดเดอร์ SSR ${leader ? leader.name : ''} · สะสม ${ownedInDeck}/${deckCards.length}</p>
              </div>
              <div class="sh-pity">
                <div><span>การันตี SSR</span><span>อีก <b>${remainingPity}</b> ซอง</span></div>
                <div class="sh-meter" role="progressbar" aria-label="ความคืบหน้าการันตี SSR ${p.name}" aria-valuemin="0" aria-valuemax="${PITY_THRESHOLD}" aria-valuenow="${pityCount}"><i style="width:${pityPercent}%"></i></div>
              </div>
              <button type="button" class="sh-buy" data-pack="${p.id}" data-count="${packQty}">${buyLabel(p, packQty)}</button>
            </article>
          `;
        }).join('')}
      </div>
    `;

    const qtyEl = container.querySelector('.sh-qty');
    qtyEl.addEventListener('click', e => {
      const b = e.target.closest('[data-qty]'); if (!b) return;
      const q = Number(b.dataset.qty);
      if (q === packQty) return;
      packQty = q;
      qtyEl.dataset.q = q;
      qtyEl.querySelectorAll('[data-qty]').forEach(x => x.setAttribute('aria-checked', String(x === b)));
      container.querySelectorAll('.sh-buy[data-pack]').forEach(btn => {
        const p = FACTION_PACKS.find(x => x.id === btn.dataset.pack);
        btn.dataset.count = q;
        btn.innerHTML = buyLabel(p, q);
      });
      container.dispatchEvent(new CustomEvent('shop:qty', { bubbles: true, detail: { qty: q } }));
    });

    container.querySelectorAll('.sh-buy[data-pack]').forEach(btn => {
      btn.addEventListener('click', () => {
        openFactionPack(btn.dataset.pack, Number(btn.dataset.count || 1));
      });
    });
  }

  // --- มุมมองที่ 2: โรงหลอมการ์ด — ย่อยการ์ดซ้ำ + หลอมการ์ดที่ขาด ---
  // ตัวกรองสายเด็คใช้สีประจำเด็ค: เลือกแล้วทั้งแผงเปลี่ยนสีตาม (--accent ไล่สีด้วย @property)
  const DECK_FILTERS = [
    { key: 'ALL', label: 'ทั้งหมด', c: '#f3c969' },
    { key: 'JIT', label: 'จิต', dir: 'เด็คจิต', c: '#3ee08f' },
    { key: 'NUEA', label: 'ขุนเหนือ', dir: 'เด็คเหนือ', c: '#f0a347' },
    { key: 'DOOM', label: 'สิ้นโลก', dir: 'วันสิ้นโลก', c: '#5fd0ff' },
    { key: 'DINO', label: 'ไดโน', dir: 'ไดโน', c: '#a3e635' },
    { key: 'DEMON', label: 'ปีศาจ', dir: 'เด็คปีศาจ', c: '#c084fc' },
    { key: 'OAT', label: 'โอ๊ต', dir: 'เด็คโอ๊ต', c: '#fb923c' }
  ];
  const RARITY_FILTERS = [
    { key: 'ALL', label: 'ทุกระดับ', c: '#f3c969' },
    { key: 'SSR', label: 'SSR', c: '#fde047' },
    { key: 'SR', label: 'SR', c: '#ff8597' },
    { key: 'R', label: 'R', c: '#7cc0ff' },
    { key: 'N', label: 'N', c: '#cbd5e1' }
  ];
  const deckOfCard = card => DECK_FILTERS.find(d => d.dir && String(card.image || '').includes(`/${d.dir}/`)) || DECK_FILTERS[0];
  const maxKeepOf = card => (card.type === 'Leader' ? 1 : 2);
  const chipsHTML = (list, active, attr, counts) => list.map(f => `
    <button type="button" class="fx-chip" role="radio" aria-checked="${f.key === active}" ${attr}="${f.key}" style="--chip-c:${f.c}">
      <span>${f.label}</span>${counts ? `<small>${counts[f.key] || 0}</small>` : ''}
    </button>`).join('');
  window.BOFDecks = { DECK_FILTERS, RARITY_FILTERS, deckOfCard, maxKeepOf, thumbOf: img => String(img).replace(/^images\//, 'images/thumbs/').replace(/\.png$/, '.webp') };

  function renderCraftingView(container) {
    if (typeof CARD_DATABASE === 'undefined') return;

    let totalExtraCards = 0;
    let totalShardsGained = 0;
    CARD_DATABASE.forEach(card => {
      const owned = Number(economy.ownedCards[card.id] || 0);
      const maxKeep = maxKeepOf(card);
      if (owned > maxKeep) {
        totalExtraCards += owned - maxKeep;
        totalShardsGained += (owned - maxKeep) * (DISENCHANT_VALUES[card.rarity] || 10);
      }
    });

    const allCards = CARD_DATABASE.filter(c => {
      if (craftFilterRarity !== 'ALL' && c.rarity !== craftFilterRarity) return false;
      if (craftFilterTribe !== 'ALL' && deckOfCard(c).key !== craftFilterTribe) return false;
      return true;
    });
    const accent = (DECK_FILTERS.find(d => d.key === craftFilterTribe) || DECK_FILTERS[0]).c;
    const deckCounts = { ALL: CARD_DATABASE.length };
    CARD_DATABASE.forEach(c => { const k = deckOfCard(c).key; deckCounts[k] = (deckCounts[k] || 0) + 1; });

    container.style.setProperty('--accent', accent); // อยู่บนกล่องที่ไม่ถูกวาดใหม่ สีจึงไล่เปลี่ยนได้
    container.innerHTML = `
      <div class="cf">
        <section class="cf-melt ${totalExtraCards ? 'has-extra' : ''}">
          <div class="cf-orb" aria-hidden="true">${SHARD_SVG}</div>
          <div class="cf-melt-text">
            <h4>ย่อยการ์ดซ้ำ</h4>
            <p>${totalExtraCards
              ? `มีการ์ดเกินจำนวนจัดเด็ค <b>${totalExtraCards} ใบ</b> ย่อยแล้วได้ <b class="cf-plus">+${totalShardsGained.toLocaleString('th-TH')} ชาร์ด</b>`
              : 'ไม่มีการ์ดเกินจำนวนจัดเด็คแล้ว การ์ดซ้ำจากซองจะกลายเป็นชาร์ดให้อัตโนมัติ'}</p>
          </div>
          <button type="button" class="cf-melt-btn" id="btn-disenchant-all" ${totalExtraCards ? '' : 'disabled'}>${totalExtraCards ? `ย่อยทั้งหมด +${totalShardsGained.toLocaleString('th-TH')}` : 'ไม่มีการ์ดซ้ำ'}</button>
        </section>

        <div class="cf-filters">
          <div class="fx-chips" role="radiogroup" aria-label="สายเด็ค">${chipsHTML(DECK_FILTERS, craftFilterTribe, 'data-tribe', deckCounts)}</div>
          <div class="fx-chips fx-chips-rarity" role="radiogroup" aria-label="ความแรร์">${chipsHTML(RARITY_FILTERS.map(r => ({ ...r, label: r.key === 'ALL' ? r.label : `${r.label} · ${CRAFT_COSTS[r.key]}` })), craftFilterRarity, 'data-rarity')}</div>
        </div>

        <div class="cf-grid">
          ${allCards.map(c => {
            const owned = Number(economy.ownedCards[c.id] || 0);
            const maxKeep = maxKeepOf(c);
            const cost = CRAFT_COSTS[c.rarity] || 50;
            const full = owned >= maxKeep;
            const canAfford = (economy.shards || 0) >= cost;
            const label = full ? 'มีครบแล้ว' : `หลอม ${SHARD_SVG}${cost.toLocaleString('th-TH')}`;
            return `
              <article class="cf-card r-${c.rarity} ${owned ? 'is-owned' : 'is-missing'}" data-craft-tile="${c.id}" style="--c:${deckOfCard(c).c}">
                <div class="cf-art"><img src="${window.BOFDecks.thumbOf(c.image)}" alt="" loading="lazy"><i class="cf-rar">${c.rarity}</i></div>
                <h5 title="${c.name}">${c.name}</h5>
                <div class="cf-own" aria-label="มี ${owned} จาก ${maxKeep} ใบ">${Array.from({ length: maxKeep }, (_, i) => `<i class="${i < owned ? 'on' : ''}"></i>`).join('')}<span>${Math.min(owned, 99)}/${maxKeep}</span></div>
                <button type="button" class="cf-craft-btn" data-craft-id="${c.id}" ${full || !canAfford ? 'disabled' : ''} ${!full && !canAfford ? 'title="ชาร์ดไม่พอ"' : ''}>${label}</button>
              </article>
            `;
          }).join('') || '<p class="fx-empty">ไม่มีการ์ดที่ตรงกับตัวกรอง</p>'}
        </div>
      </div>
    `;

    const disenchantBtn = container.querySelector('#btn-disenchant-all');
    if (disenchantBtn) {
      disenchantBtn.onclick = () => {
        if (totalExtraCards <= 0) return;
        CARD_DATABASE.forEach(card => {
          const maxKeep = maxKeepOf(card);
          if (Number(economy.ownedCards[card.id] || 0) > maxKeep) economy.ownedCards[card.id] = maxKeep;
        });
        economy.shards = (economy.shards || 0) + totalShardsGained;
        bumpProgress('craftsDone');
        const from = container.querySelector('.cf-orb');
        const fromRect = from ? from.getBoundingClientRect() : null;
        saveEconomy();
        if (window.BOF_AUDIO) window.BOF_AUDIO.playSpell();
        showShopToast(`✨ ย่อยการ์ดซ้ำสำเร็จ! ได้รับ +${totalShardsGained.toLocaleString('th-TH')} 🔮 Soul Shards`);
        renderCraftingView(container);
        container.dispatchEvent(new CustomEvent('shop:melt', { bubbles: true, detail: { from: fromRect, amount: totalShardsGained } }));
      };
    }

    const rerender = () => {
      renderCraftingView(container);
      container.dispatchEvent(new CustomEvent('fx:filter', { bubbles: true, detail: { grid: container.querySelector('.cf-grid') } }));
    };
    container.querySelectorAll('.fx-chip[data-tribe]').forEach(btn => {
      btn.onclick = () => { if (craftFilterTribe === btn.dataset.tribe) return; craftFilterTribe = btn.dataset.tribe; rerender(); };
    });
    container.querySelectorAll('.fx-chip[data-rarity]').forEach(btn => {
      btn.onclick = () => { if (craftFilterRarity === btn.dataset.rarity) return; craftFilterRarity = btn.dataset.rarity; rerender(); };
    });

    container.querySelectorAll('.cf-craft-btn[data-craft-id]').forEach(btn => {
      btn.onclick = () => {
        const target = CARD_DATABASE.find(c => c.id === btn.dataset.craftId);
        if (!target) return;
        const cost = CRAFT_COSTS[target.rarity] || 50;
        if ((economy.shards || 0) < cost) {
          showShopToast('⚠️ เศษวิญญาณ Soul Shards ไม่เพียงพอ!');
          return;
        }
        if (Number(economy.ownedCards[target.id] || 0) >= maxKeepOf(target)) return;
        economy.shards -= cost;
        grantCardToCollection(target);
        bumpProgress('craftsDone');
        saveEconomy();
        if (window.BOF_AUDIO) window.BOF_AUDIO.playSsr();
        showShopToast(`🔮 หลอมการ์ด "${target.name}" [${target.rarity}] สำเร็จ!`);
        renderCraftingView(container);
        container.dispatchEvent(new CustomEvent('shop:craft', { bubbles: true, detail: { id: target.id } }));
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
      // URL เต็ม: url() ในตัวแปร CSS ถูกตีความเทียบกับไฟล์ css ที่ใช้ตัวแปร (css/images/... = 404) ไม่ใช่เทียบกับหน้าเว็บ
      const cssUrl = rawImg.startsWith('data:') ? `url("${rawImg}")` : `url('${new URL(rawImg, document.baseURI).href}')`;
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

  // --- มุมมองที่ 4: ห้องแต่งตัว — เวทีโชว์ชุดที่สวมอยู่ (ลองชิ้นใหม่บนเวทีได้ก่อนซื้อ) + ชั้นวางของตกแต่ง ---
  const COS_CATS = [
    { key: 'ALL', label: 'ทั้งหมด', c: '#f3c969' },
    { key: 'card_back', label: 'หลังการ์ด', c: '#ff8597' },
    { key: 'frame', label: 'กรอบโปรไฟล์', c: '#5fd0ff' },
    { key: 'title', label: 'ฉายา', c: '#fde047' },
    { key: 'arena_theme', label: 'สีสนาม', c: '#a3e635' }
  ];
  const RARITY_C = { N: '#cbd5e1', R: '#7cc0ff', SR: '#ff8597', SSR: '#fde047' };
  let cosmeticTry = {}; // ชิ้นที่กำลังลองบนเวที { category: itemId } — ไม่บันทึก

  function cosmeticPreviewHTML(item, avatarSrc) {
    if (item.category === 'card_back') {
      return `<div class="bof-cos-preview-cardback" data-cb-style="${item.styleId}"><img src="${item.image}" alt="" loading="lazy"><span class="bof-cos-cb-shine"></span></div>`;
    }
    if (item.category === 'frame') {
      return `<div class="bof-cos-preview-frame-wrap"><img class="bof-cos-avatar-sample" data-frame="${item.styleId}" src="${avatarSrc}" alt=""></div>`;
    }
    if (item.category === 'title') {
      return `<div class="bof-cos-preview-title-wrap"><span class="bof-user-title-pill is-large" style="--title-color:${item.color};">${item.badgeText}</span></div>`;
    }
    return `<div class="bof-cos-preview-arena" style="background:${item.previewBg};" data-arena-style="${item.styleId}">
      <div class="bof-cos-arena-grid-lines"><span></span><span></span><span></span></div>
      <div class="bof-cos-arena-divider"></div>
      <div class="bof-cos-arena-grid-lines"><span></span><span></span><span></span></div></div>`;
  }

  function renderCosmeticsView(container) {
    if (!economy.ownedCosmetics) economy.ownedCosmetics = { ...DEFAULT_OWNED_COSMETICS };
    if (!economy.equippedCosmetics) economy.equippedCosmetics = { ...DEFAULT_EQUIPPED_COSMETICS };

    const counts = { ALL: COSMETIC_ITEMS.length };
    COSMETIC_ITEMS.forEach(it => { counts[it.category] = (counts[it.category] || 0) + 1; });
    const filteredItems = COSMETIC_ITEMS.filter(it => cosmeticFilterCat === 'ALL' || it.category === cosmeticFilterCat);
    const user = window.BOFAuth && typeof window.BOFAuth.currentUser === 'function' ? window.BOFAuth.currentUser() : null;
    const avatarSrc = (user && user.customAvatar) || 'images/thumbs/เด็คจิต/1.webp';
    const playerName = (document.querySelector('#lb-auth-bar .lb-auth-name') || {}).textContent || 'ผู้เล่น';

    // ชุดบนเวที = ที่สวมอยู่ ทับด้วยชิ้นที่กำลังลอง
    const pick = (cat, fallback) => getCosmeticItemById(cosmeticTry[cat] || economy.equippedCosmetics[cat]) || getCosmeticItemById(fallback);
    const look = {
      card_back: pick('card_back', 'cb_default'),
      frame: pick('frame', 'pf_default'),
      title: pick('title', 'tt_default'),
      arena_theme: pick('arena_theme', 'mt_default')
    };
    const trying = Object.values(cosmeticTry).map(id => getCosmeticItemById(id)).filter(Boolean);
    const accent = (COS_CATS.find(c => c.key === cosmeticFilterCat) || COS_CATS[0]).c;
    const slot = (cat, label, valueHTML, thumbHTML) => `
      <button type="button" class="cs-slot ${cosmeticFilterCat === cat ? 'is-on' : ''} ${cosmeticTry[cat] ? 'is-trying' : ''}" data-cos-jump="${cat}" style="--chip-c:${COS_CATS.find(c => c.key === cat).c}">
        <span class="cs-slot-thumb">${thumbHTML}</span>
        <span class="cs-slot-meta"><small>${label}</small><b>${valueHTML}</b></span>
      </button>`;

    container.style.setProperty('--accent', accent);
    container.innerHTML = `
      <div class="cs">
        <section class="cs-stage" aria-label="ชุดที่สวมอยู่">
          <div class="cs-arena" style="background:${look.arena_theme ? look.arena_theme.previewBg : '#1b2048'};">
            <div class="cs-arena-lines" aria-hidden="true"></div>
            <div class="cs-hero">
              <img class="bof-cos-avatar-sample cs-avatar" data-frame="${look.frame ? look.frame.styleId : 'default'}" src="${avatarSrc}" alt="">
              <span class="bof-user-title-pill" style="--title-color:${look.title ? look.title.color : '#94a3b8'};">${look.title ? look.title.badgeText : ''}</span>
              <b class="cs-name">${playerName}</b>
            </div>
            <div class="cs-fan" aria-hidden="true">
              <img src="${look.card_back ? look.card_back.image : 'images/card-back.png'}" alt="">
              <img src="${look.card_back ? look.card_back.image : 'images/card-back.png'}" alt="">
              <img src="${look.card_back ? look.card_back.image : 'images/card-back.png'}" alt="">
            </div>
            ${trying.length ? `<div class="cs-try-banner"><span>กำลังลอง: ${trying.map(t => t.name).join(', ')}</span><button type="button" class="cs-try-reset">กลับชุดเดิม</button></div>` : ''}
          </div>
          <div class="cs-slots">
            ${slot('card_back', 'หลังการ์ด', look.card_back ? look.card_back.name : '-', `<img src="${look.card_back ? look.card_back.image : ''}" alt="">`)}
            ${slot('frame', 'กรอบโปรไฟล์', look.frame ? look.frame.name : '-', `<img class="bof-cos-eq-mini-avatar" data-frame="${look.frame ? look.frame.styleId : 'default'}" src="${avatarSrc}" alt="">`)}
            ${slot('title', 'ฉายา', `<span style="color:${look.title ? look.title.color : '#fde047'}">${look.title ? look.title.badgeText : '-'}</span>`, '<i class="cs-ico-title"></i>')}
            ${slot('arena_theme', 'สีสนาม', look.arena_theme ? look.arena_theme.name : '-', `<span class="cs-swatch" style="background:${look.arena_theme ? look.arena_theme.previewBg : '#1e293b'}"></span>`)}
          </div>
        </section>

        <div class="fx-chips" role="radiogroup" aria-label="หมวดของตกแต่ง">${chipsHTML(COS_CATS, cosmeticFilterCat, 'data-cos-cat', counts)}</div>

        <div class="cs-grid">
          ${filteredItems.map(item => {
            const isOwned = !!economy.ownedCosmetics[item.id] || item.currency === 'free';
            const isEquipped = economy.equippedCosmetics[item.category] === item.id;
            const isTrying = cosmeticTry[item.category] === item.id;
            const canAfford = item.currency === 'coins'
              ? (economy.coins || 0) >= item.price
              : (item.currency === 'shards' ? (economy.shards || 0) >= item.price : true);
            const rarity = item.rarity || 'R';
            const cur = item.currency === 'shards' ? SHARD_SVG : COIN_SVG;
            const action = isEquipped
              ? '<span class="cs-state is-eq">สวมใส่อยู่</span>'
              : isOwned
                ? `<button type="button" class="cs-btn cs-btn-equip" data-equip-id="${item.id}">สวมใส่</button>`
                : `<button type="button" class="cs-btn cs-btn-buy" data-buy-id="${item.id}" ${canAfford ? '' : 'disabled title="ไม่พอ"'}>แลก ${cur}${item.price.toLocaleString('th-TH')}</button>`;
            return `
              <article class="cs-item r-${rarity} ${isEquipped ? 'is-equipped' : ''} ${isOwned ? 'is-owned' : ''} ${isTrying ? 'is-trying' : ''}" data-cos-item="${item.id}" style="--rc:${RARITY_C[rarity] || '#cbd5e1'}">
                <span class="cs-glow" aria-hidden="true"></span>
                <button type="button" class="cs-preview" data-try-id="${item.id}" aria-label="ลอง ${item.name} บนเวที">
                  ${cosmeticPreviewHTML(item, avatarSrc)}
                  <span class="cs-try-hint">${isTrying ? 'กำลังลอง' : 'แตะเพื่อลอง'}</span>
                </button>
                <div class="cs-item-body">
                  <div class="cs-item-top"><i class="cs-rar">${rarity}</i>${isOwned && !isEquipped ? '<span class="cs-state">มีแล้ว</span>' : ''}</div>
                  <h5>${item.name}</h5>
                  <p>${item.desc}</p>
                  ${action}
                </div>
              </article>
            `;
          }).join('')}
        </div>
      </div>
    `;

    const rerender = (evt, detail) => {
      renderCosmeticsView(container);
      if (evt) container.dispatchEvent(new CustomEvent(evt, { bubbles: true, detail: detail || {} }));
    };
    const filterTo = cat => {
      if (cosmeticFilterCat === cat) return;
      cosmeticFilterCat = cat;
      rerender();
      container.dispatchEvent(new CustomEvent('fx:filter', { bubbles: true, detail: { grid: container.querySelector('.cs-grid') } }));
    };
    container.querySelectorAll('.cs-slot[data-cos-jump]').forEach(b => { b.onclick = () => filterTo(b.dataset.cosJump); });
    container.querySelectorAll('.fx-chip[data-cos-cat]').forEach(b => { b.onclick = () => filterTo(b.dataset.cosCat); });

    container.querySelectorAll('.cs-preview[data-try-id]').forEach(b => {
      b.onclick = () => {
        const item = getCosmeticItemById(b.dataset.tryId); if (!item) return;
        const same = cosmeticTry[item.category] === item.id || economy.equippedCosmetics[item.category] === item.id;
        if (same) delete cosmeticTry[item.category]; else cosmeticTry[item.category] = item.id;
        rerender('cos:try', { category: item.category });
      };
    });
    container.querySelector('.cs-try-reset')?.addEventListener('click', () => { cosmeticTry = {}; rerender('cos:try', {}); });

    container.querySelectorAll('.cs-btn[data-equip-id]').forEach(btn => {
      btn.onclick = () => {
        const item = getCosmeticItemById(btn.dataset.equipId);
        if (!item) return;
        economy.equippedCosmetics[item.category] = item.id;
        delete cosmeticTry[item.category];
        saveEconomy();
        if (window.BOF_AUDIO) window.BOF_AUDIO.playSpell();
        showShopToast(`✨ สวมใส่ "${item.name}" เรียบร้อยแล้ว!`);
        rerender('cos:equip', { id: item.id, category: item.category });
      };
    });

    container.querySelectorAll('.cs-btn[data-buy-id]').forEach(btn => {
      btn.onclick = () => {
        const item = getCosmeticItemById(btn.dataset.buyId);
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
        delete cosmeticTry[item.category];
        saveEconomy();
        if (window.BOF_AUDIO) window.BOF_AUDIO.playSsr();
        showShopToast(`🎉 แลกซื้อและสวมใส่ "${item.name}" สำเร็จ!`);
        rerender('cos:equip', { id: item.id, category: item.category, bought: true });
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
    // คลังการ์ด (เมนู "คลังการ์ด") ย้ายไปอยู่ js/collection.js — แสดงทุกใบ ใบที่ยังไม่มีเป็นเงาล็อกไว้

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
            badge.textContent = (window.isMobileUI && window.isMobileUI()) ? `${countInDeck}/${allowedMax} · มี ${ownedCount}` : `ใส่ในเด็ค: ${countInDeck}/${allowedMax} (มีในคลัง ${ownedCount} ใบ)`;
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

    // ช่องใส่โค้ดซ่อนไว้จนกดปุ่ม "ใส่โค้ด" (ไม่ค่อยได้ใช้ จึงไม่ให้กินที่หัวร้าน)
    const codeToggle = document.getElementById('bof-shop-code-toggle');
    const codeBox = document.getElementById('bof-shop-code-box');
    codeToggle?.addEventListener('click', () => {
      const open = codeBox.hidden;
      codeBox.hidden = !open;
      codeToggle.setAttribute('aria-expanded', String(open));
      if (open) document.getElementById('bof-shop-code-input')?.focus();
      codeBox.dispatchEvent(new CustomEvent('shop:code', { bubbles: true, detail: { open } }));
    });

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
    document.getElementById('bof-reveal-flip-all')?.addEventListener('click', flipAllRevealCards);

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
        bumpProgress('duelsCompleted');
        if (isWin) bumpProgress('duelsWon');
        saveEconomy();
        const extraDesc = `${desc || ''} (ได้รับรางวัลแมตช์ +${reward} 🪙 Coins!)`;
        return origEnd.call(this, title, extraDesc);
      };
    }
  }

  window.BOFShop = {
    getEconomy: () => economy,
    save: saveEconomy,
    ensureProgress: () => ensureProgress(),
    msToDailyReset,
    msToWeeklyReset,
    COIN_SVG,
    SHARD_SVG,
    applyEquippedCosmetics,
    reloadFromProfile: () => {
      economy = loadEconomy();
      updateCoinDisplays();
      syncLobbyDecksForOwnership();
      applyEquippedCosmetics();
      document.dispatchEvent(new CustomEvent('bof:economy'));
    }
  };

  bindShopEvents();
  hookCollectionAndDeckBuilder();
  updateCoinDisplays();
  syncLobbyDecksForOwnership();
  applyEquippedCosmetics();
})();
