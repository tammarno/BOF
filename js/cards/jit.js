CARD_DATABASE.push(
  // ==================== MONSTER & SPELL: เด็คจิต ====================
  {
    id: 'M01',
    name: 'บาคุจิต',
    type: 'Monster',
    rarity: 'SR', // ระดับความหายาก (ภาพเท่านั้น): N / R / SR / Legend
    power: 2,
    image: 'images/เด็คจิต/2.png',
    ability: 'BAKU_SKILL',
    desc: 'ต่อเนื่อง: ถ้ามีโทโดโรจิตบนสนามเรา พลัง +1\nออโต้: เมื่อลงสนาม เลือกทำลายยูนิทอีกฝ่าย 1 ใบ',
    effects: [
      {
        id: 'baku_continuous',
        trigger: 'CONTINUOUS_POWER',
        condition: { type: 'ALLY_ON_BOARD', cardId: 'M02' },
        amount: 1
      },
      {
        id: 'baku_on_summon',
        trigger: 'ON_SUMMON',
        steps: [
          { block: 'DESTROY_UNIT', target: 'OPPONENT', count: 1, select: 'CHOOSE' }
        ]
      }
    ]
  },
  {
    id: 'M02',
    name: 'โทโดโรจิต',
    type: 'Monster',
    rarity: 'R', // ระดับความหายาก (ภาพเท่านั้น): N / R / SR / Legend
    power: 1,
    image: 'images/เด็คจิต/3.png',
    ability: 'TODORO_SKILL',
    desc: 'สั่งใช้งาน1/เทิร์น: ทิ้งมือ 1 ใบ โม่กองอีกฝ่าย 1 ใบ\nสั่งใช้งาน2/เทิร์น: นำบาคุจิตจากนรกขึ้นมือ 1 ใบ',
    effects: [
      {
        id: 'todoroMill',
        label: '1) ทิ้งมือ 1 ใบ -> ส่งใบบนสุดกองอีกฝ่ายลงนรก',
        trigger: 'ACTIVATE_MAIN',
        oncePerTurn: true,
        costs: [{ type: 'DISCARD_HAND', count: 1 }],
        steps: [{ block: 'MILL_DECK', side: 'OPPONENT', count: 1 }]
      },
      {
        id: 'todoroRecover',
        label: '2) นำ "บาคุจิต" 1 ใบจากนรกขึ้นมือ',
        trigger: 'ACTIVATE_MAIN',
        oncePerTurn: true,
        steps: [{ block: 'RECOVER_FROM_GRAVE', cardId: 'M01', count: 1 }]
      }
    ]
  },
  {
    id: 'M03',
    name: 'ออลจิต',
    type: 'Monster',
    rarity: 'R', // ระดับความหายาก (ภาพเท่านั้น): N / R / SR / Legend
    power: 2,
    image: 'images/เด็คจิต/4.png',
    ability: 'ALL_JIT_HAND_INTERCEPT',
    desc: 'เมื่อลีดเดอร์ถูกโจมตี: อัญเชิญใบนี้จากมือลงสนาม และเปลี่ยนเป้าหมายโจมตีมาที่ใบนี้แทน'
  },
  {
    id: 'M04',
    name: 'ออลฟอจิต',
    type: 'Monster',
    rarity: 'Legend', // ระดับความหายาก (ภาพเท่านั้น): N / R / SR / Legend
    power: 3,
    image: 'images/เด็คจิต/5.png',
    ability: 'ALL_FOR_JIT_GRAVE',
    cannotNormalSummon: true,
    desc: 'ห้ามอัญเชิญปกติ | จากนรก/1 เกม (เมื่อลีดเดอร์ถูกตีและ HP<=2): อัญเชิญใบนี้และทำลายยูนิททุกใบบนสนาม'
  },
  {
    id: 'M05',
    name: 'เอ็นเดจิต',
    type: 'Monster',
    rarity: 'R', // ระดับความหายาก (ภาพเท่านั้น): N / R / SR / Legend
    power: 2,
    image: 'images/เด็คจิต/6.png',
    ability: 'ENDE_SKILL',
    desc: 'สั่งใช้งาน: พลังโจมตียูนิทนี้ +2 และเมื่อจบเทิร์น ทำลายการ์ดใบนี้',
    effects: [
      {
        id: 'endeBoost',
        label: 'เพิ่มพลังโจมตี +2 (ทำลายใบนี้เมื่อจบเทิร์น)',
        trigger: 'ACTIVATE_MAIN',
        oncePerTurn: true,
        steps: [
          { block: 'ADD_POWER', target: 'SELF_UNIT', amount: 2, duration: 'TURN' },
          { block: 'MARK_END_TURN_DESTROY', target: 'SELF_UNIT' },
          { block: 'TRIGGER_ALLY_PASSIVE', allyId: 'M06', amount: 2 }
        ]
      }
    ]
  },
  {
    id: 'M06',
    name: 'ฮออ์กส์ฟีม',
    type: 'Monster',
    rarity: 'R', // ระดับความหายาก (ภาพเท่านั้น): N / R / SR / Legend
    power: 2,
    image: 'images/เด็คจิต/7.png',
    ability: 'HAWKS_SKILL',
    desc: 'สั่งใช้งาน: ลดพลังใบนี้ -2 นำเอ็นเดจิตจากกอง/นรกขึ้นมือ\nออโต้: เมื่อเอ็นเดจิตใช้สกิล ใบนี้พลัง +2',
    effects: [
      {
        id: 'hawksSearch',
        label: 'ลดพลังใบนี้ -2 -> ค้นหา "เอ็นเดจิต" จากกอง/นรกขึ้นมือ',
        trigger: 'ACTIVATE_MAIN',
        oncePerTurn: true,
        costs: [{ type: 'REDUCE_SELF_POWER', amount: 2 }],
        steps: [
          { block: 'SEARCH_DECK_OR_GRAVE', cardId: 'M05', destination: 'HAND' }
        ]
      }
    ]
  },
  {
    id: 'S01',
    name: 'โอ็ยใครเหยียบตีน!!!',
    type: 'NormalSpell',
    rarity: 'SR', // ระดับความหายาก (ภาพเท่านั้น): N / R / SR / Legend
    effect: 'SPELL_DISCARD_DESTROY',
    image: 'images/เด็คจิต/8.png',
    desc: 'ทิ้งการ์ดบนมือ 1 ใบ เลือกทำลายยูนิทฝั่งตรงข้าม 1 ใบ',
    effects: [
      {
        id: 'spell_s01',
        trigger: 'CAST_SPELL',
        costs: [{ type: 'DISCARD_HAND', count: 1 }],
        steps: [
          { block: 'DESTROY_UNIT', target: 'OPPONENT', count: 1, select: 'CHOOSE' }
        ]
      }
    ]
  },
  {
    id: 'S02',
    name: 'เชี่ย หุ้นตก',
    type: 'NormalSpell',
    rarity: 'SR', // ระดับความหายาก (ภาพเท่านั้น): N / R / SR / Legend
    effect: 'SPELL_DEBUFF_ALL_3',
    image: 'images/เด็คจิต/9.png',
    desc: 'ลดพลังโจมตีของยูนิทฝั่งตรงข้ามทุกใบลง 3 หน่วย จนจบเทิร์น',
    effects: [
      {
        id: 'spell_s02',
        trigger: 'CAST_SPELL',
        steps: [
          { block: 'REDUCE_POWER', target: 'ALL_ENEMIES', amount: 3, duration: 'TURN' }
        ]
      }
    ]
  },
  {
    id: 'S03',
    name: 'หนึ่งเดียวเพื่อทุกสิ่ง',
    type: 'NormalSpell',
    rarity: 'R', // ระดับความหายาก (ภาพเท่านั้น): N / R / SR / Legend
    effect: 'SPELL_REST_1_HEAL_1',
    image: 'images/เด็คจิต/10.png',
    desc: 'Rest ยูนิทที่ Stand อยู่ฝั่งเรา 1 ใบ แล้วเพิ่มพลังชีวิตลีดเดอร์เรา +1',
    effects: [
      {
        id: 'spell_s03',
        trigger: 'CAST_SPELL',
        costs: [{ type: 'REST_ALLY', count: 1 }],
        steps: [
          { block: 'HEAL_LEADER', side: 'SELF', amount: 1 }
        ]
      }
    ]
  },
  {
    id: 'S04',
    name: 'ทุกสิ่งเพื่อหนึ่งเดียว',
    type: 'NormalSpell',
    rarity: 'R', // ระดับความหายาก (ภาพเท่านั้น): N / R / SR / Legend
    effect: 'SPELL_REST_2_GRANT_BURN',
    image: 'images/เด็คจิต/11.png',
    desc: 'Rest ยูนิทฝั่งเรา 2 ใบ เลือกยูนิทเรา 1 ใบได้รับออโต้: เมื่อตีทำลายยูนิทสำเร็จ ทำดาเมจลีดเดอร์อีกฝ่าย 1',
    effects: [
      {
        id: 'spell_s04',
        trigger: 'CAST_SPELL',
        costs: [{ type: 'REST_ALLY', count: 2 }],
        steps: [
          { block: 'GRANT_STATUS', target: 'ALLY', count: 1, status: 'BURN_ON_KILL' }
        ]
      }
    ]
  }
);

DECK_LISTS.L01 = [
  'M01', 'M01', 'M02', 'M02', 'M03', 'M03', 'M04', 'M04', 'M05', 'M05',
  'M06', 'M06', 'S01', 'S01', 'S02', 'S02', 'S03', 'S03', 'S04', 'S04'
];
