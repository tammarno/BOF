CARD_DATABASE.push(
  // ==================== MONSTER & SPELL: เด็คไดโน ====================
  {
    id: 'DN01',
    name: 'ทีเร็กซ์ — ราชันนักล่า',
    type: 'Monster',
    tribe: 'ไดโน',
    rarity: 'SR', // ระดับความหายาก (ภาพเท่านั้น): N / R / SR / Legend
    power: 2,
    image: 'images/ไดโน/2.png',
    ability: 'TREX_KILL_DESTROY',
    desc: 'ออโต้: เมื่อยูนิทนี้ทำลายยูนิทฝั่งตรงข้ามสำเร็จ เลือกยูนิทฝั่งตรงข้าม 1 ใบ ทำลายยูนิทนั้น',
    effects: [
      {
        id: 'trex_on_kill',
        trigger: 'ON_KILL_UNIT',
        steps: [
          { block: 'DESTROY_UNIT', target: 'OPPONENT', count: 1, select: 'CHOOSE' }
        ]
      }
    ]
  },
  {
    id: 'DN02',
    name: 'เวโลซิแรปเตอร์ — นักล่าแห่งฝูง',
    type: 'Monster',
    tribe: 'ไดโน',
    rarity: 'R', // ระดับความหายาก (ภาพเท่านั้น): N / R / SR / Legend
    power: 1,
    image: 'images/ไดโน/3.png',
    ability: 'RAPTOR_BUFF_DINO',
    desc: 'สั่งใช้งาน/1 เทิร์น: เรสการ์ดใบนี้แล้ว เลือกยูนิทเผ่าไดโนบนสนาม 1 ใบ พลังโจมตีใบนั้น +2 หน่วย จนจบเทิร์น',
    effects: [
      {
        id: 'raptor_buff',
        label: 'Rest ใบนี้ -> เลือกยูนิทเผ่าไดโน 1 ใบ พลัง +2 จนจบเทิร์น',
        trigger: 'ACTIVATE_MAIN',
        oncePerTurn: true,
        costs: [{ type: 'REST_SELF' }],
        steps: [
          { block: 'ADD_POWER', target: 'ALLY', filterTribe: 'ไดโน', count: 1, amount: 2, duration: 'TURN' }
        ]
      }
    ]
  },
  {
    id: 'DN03',
    name: 'ไทรเซราทอปส์ — ปราการมีชีวิต',
    type: 'Monster',
    tribe: 'ไดโน',
    rarity: 'R', // ระดับความหายาก (ภาพเท่านั้น): N / R / SR / Legend
    power: 2,
    image: 'images/ไดโน/4.png',
    ability: 'TRICERATOPS_GUARD',
    desc: 'ออโต้: เมื่อยูนิทนี้รับการโจมตีแทนลีดเดอร์ พลังโจมตีของยูนิทนี้ +2 หน่วย จนจบเทิร์น แล้วถ้าป้องกันสำเร็จ สแตร์นยูนิทนี้',
    effects: [
      {
        id: 'triceratops_intercept',
        trigger: 'ON_INTERCEPT',
        standOnSurvive: true,
        steps: [
          { block: 'ADD_POWER', target: 'SELF_UNIT', amount: 2, duration: 'TURN' }
        ]
      }
    ]
  },
  {
    id: 'DN04',
    name: 'พเทอราโนดอน — เจ้าเวหา',
    type: 'Monster',
    tribe: 'ไดโน',
    rarity: 'N', // ระดับความหายาก (ภาพเท่านั้น): N / R / SR / Legend
    power: 2,
    image: 'images/ไดโน/5.png',
    ability: 'PTERANODON_MILL_DRAW',
    desc: 'สั่งใช้งาน/1 เทิร์น: ส่งการ์ดใบบนสุดของกองการ์ด 2 ใบลงนรก หลังจากนั้น จั่วการ์ด 1 ใบ',
    effects: [
      {
        id: 'pteranodon_mill_draw',
        label: 'ส่งใบบนสุดของกองเรา 2 ใบลงนรก -> จั่วการ์ด 1 ใบ',
        trigger: 'ACTIVATE_MAIN',
        oncePerTurn: true,
        steps: [
          { block: 'MILL_DECK', side: 'SELF', count: 2 },
          { block: 'DRAW', side: 'SELF', count: 1 }
        ]
      }
    ]
  },
  {
    id: 'DN05',
    name: 'สไปโนซอรัส — ผู้ล่าแห่งสายน้ำ',
    type: 'Monster',
    tribe: 'ไดโน',
    rarity: 'R', // ระดับความหายาก (ภาพเท่านั้น): N / R / SR / Legend
    power: 0,
    image: 'images/ไดโน/6.png',
    ability: 'SPINOSAURUS_GRAVE_POWER',
    desc: 'ต่อเนื่อง: ยูนิทนี้พลังโจมตี +1 หน่วย ต่อการ์ดในนรกทุกๆ 3 ใบ',
    effects: [
      {
        id: 'spinosaurus_continuous',
        trigger: 'CONTINUOUS_POWER',
        condition: { type: 'PER_GRAVE_COUNT', divisor: 3 },
        amountPerUnit: 1
      }
    ]
  },
  {
    id: 'DN06',
    name: 'ไฮบริด — อินโดมินัสเร็กซ์',
    type: 'Monster',
    tribe: 'ไดโน',
    rarity: 'Legend', // ระดับความหายาก (ภาพเท่านั้น): N / R / SR / Legend
    power: 3,
    cannotNormalSummon: true,
    hybridMaterials: ['ทีเร็กซ์', 'เวโลซิแรปเตอร์'],
    image: 'images/ไดโน/7.png',
    ability: 'INDOMINUS_HYBRID',
    desc: '[ห้ามอัญเชิญปกติ]\nสั่งใช้งานจากบนมือ: ส่งการ์ดที่มีชื่อ "ทีเร็กซ์" กับ "เวโลซิแรปเตอร์" จาก มือ, สนาม, นรก ไปมิติมืด เพื่ออัญเชิญการ์ดใบนี้ลงสนาม\nออโต้: เมื่อการ์ดนี้ทำลายยูนิทสำเร็จ สแตร์นยูนิทนี้',
    effects: [
      {
        id: 'indominus_on_kill_stand',
        trigger: 'ON_KILL_UNIT',
        steps: [
          { block: 'STAND_SELF' }
        ]
      }
    ]
  },
  {
    id: 'DN07',
    name: 'ไฮบริด — อินโดแรปเตอร์',
    type: 'Monster',
    tribe: 'ไดโน',
    rarity: 'Legend', // ระดับความหายาก (ภาพเท่านั้น): N / R / SR / Legend
    power: 2,
    cannotNormalSummon: true,
    hybridMaterials: ['ทีเร็กซ์', 'เวโลซิแรปเตอร์'],
    image: 'images/ไดโน/8.png',
    ability: 'INDORAPTOR_HYBRID',
    desc: '[ห้ามอัญเชิญปกติ]\nสั่งใช้งานจากบนมือ: ส่งการ์ดที่มีชื่อ "ทีเร็กซ์" กับ "เวโลซิแรปเตอร์" จาก มือ, สนาม, นรก ไปมิติมืด เพื่ออัญเชิญการ์ดใบนี้ลงสนาม\nออโต้/1 เทิร์น: เมื่อการ์ดนี้โจมตีลีดเดอร์สำเร็จ สแตร์นยูนิทนี้',
    effects: [
      {
        id: 'indoraptor_on_hit_leader',
        trigger: 'ON_HIT_LEADER',
        oncePerTurn: true,
        steps: [
          { block: 'STAND_SELF' }
        ]
      }
    ]
  },
  {
    id: 'DNS01',
    name: 'DNA กลายพันธุ์',
    type: 'NormalSpell',
    rarity: 'R', // ระดับความหายาก (ภาพเท่านั้น): N / R / SR / Legend
    effect: 'SPELL_DINO_SEARCH_2',
    image: 'images/ไดโน/9.png',
    desc: 'หายูนิทเผ่า ไดโน ไม่เกิน 2 ใบ จากกองการ์ด แสดงแล้วนำขึ้นมือ',
    effects: [
      {
        id: 'spell_dns01',
        trigger: 'CAST_SPELL',
        steps: [
          { block: 'SEARCH_DECK', filterTribe: 'ไดโน', filterType: 'MONSTER', count: 2, upTo: true }
        ]
      }
    ]
  },
  {
    id: 'DNS02',
    name: 'ระบบกรงกักกันล้มเหลว',
    type: 'NormalSpell',
    rarity: 'N', // ระดับความหายาก (ภาพเท่านั้น): N / R / SR / Legend
    effect: 'SPELL_DINO_BUFF_ALL',
    image: 'images/ไดโน/10.png',
    desc: 'ในเทิร์นนี้เผ่า ไดโน ทุกใบ พลังโจมตี +1 หน่วยจนจบเทิร์น',
    effects: [
      {
        id: 'spell_dns02',
        trigger: 'CAST_SPELL',
        steps: [
          { block: 'ADD_POWER', target: 'ALL_ALLIES', filterTribe: 'ไดโน', amount: 1, duration: 'TURN' }
        ]
      }
    ]
  },
  {
    id: 'DNS03',
    name: 'เมเทโอ',
    type: 'ReactionSpell',
    rarity: 'SR', // ระดับความหายาก (ภาพเท่านั้น): N / R / SR / Legend
    effect: 'SPELL_METEOR_WIPE',
    image: 'images/ไดโน/11.png',
    desc: 'เมื่อการ์ดฝั่งตรงข้ามโจมตีแล้วบนสนามเรามียูนิทเผ่า ไดโน 2 ใบขึ้นไป ทำลายการ์ดทั้งหมดบนสนามทั้ง 2 ฝั่ง'
  }
);

DECK_LISTS.L04 = [
  'DN01', 'DN01', 'DN02', 'DN02', 'DN03', 'DN03', 'DN04', 'DN04', 'DN05', 'DN05',
  'DN06', 'DN06', 'DN07', 'DN07', 'DNS01', 'DNS01', 'DNS02', 'DNS02', 'DNS03', 'DNS03'
];