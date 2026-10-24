/* ============================================================================
   หมวดที่ 1: ฐานข้อมูลการ์ดทั้งหมด (DATA-DRIVEN CARD DATABASE)
   แยกข้อมูลการ์ดและบล็อกความสามารถ (effects) ออกจากตัวประมวลผลอย่างชัดเจน
   ============================================================================ */
const CARD_DATABASE = [
  // ==================== LEADER (ทั้ง 3 เด็ค) ====================
  {
    id: 'L01',
    name: 'มายฮีโร่ เดจิต',
    type: 'Leader',
    rarity: 'Legend', // ระดับความหายาก (ภาพเท่านั้น): N / R / SR / Legend
    maxHp: 6,
    image: 'images/เด็คจิต/1.png',
    ability: 'LEADER_DEJIT_BUFF',
    desc: 'สั่งใช้งาน/1 เทิร์น: เลือกยูนิทฝั่งเรา 1 ตัว เพิ่มพลังโจมตี +1 จนจบเทิร์น',
    effects: [
      {
        id: 'leader_l01_buff',
        trigger: 'ACTIVATE_LEADER',
        oncePerTurn: true,
        steps: [
          { block: 'ADD_POWER', target: 'ALLY', count: 1, amount: 1, duration: 'TURN' }
        ]
      }
    ]
  },
  {
    id: 'L02',
    name: 'ขุนเหนือ',
    type: 'Leader',
    rarity: 'Legend', // ระดับความหายาก (ภาพเท่านั้น): N / R / SR / Legend
    maxHp: 6,
    image: 'images/เด็คเหนือ/1.png',
    ability: 'LEADER_KHUN_NUEA',
    desc: 'ออโต้: เมื่อเข้าเทิร์น นำ "ไพร่ชาวนาเหนือ" จากกองหรือนรกไม่เกิน 1 ใบขึ้นมือ\nต่อเนื่อง: ถ้ามี "เหนือ" 3 ใบบนสนาม "เหนือ" ทุกใบบนสนามเราพลังโจมตี +1',
    effects: [
      {
        id: 'leader_l02_aura',
        trigger: 'CONTINUOUS_BOARD_AURA',
        condition: { type: 'MIN_TRIBE_COUNT', tribe: 'เหนือ', count: 3 },
        targetTribe: 'เหนือ',
        amount: 1
      }
    ]
  },
  {
    id: 'L03',
    name: 'วันสิ้นโลก',
    type: 'Leader',
    rarity: 'Legend', // ระดับความหายาก (ภาพเท่านั้น): N / R / SR / Legend
    maxHp: 6,
    image: 'images/วันสิ้นโลก/1.png',
    ability: 'LEADER_DOOMSDAY',
    desc: 'ออโต้: เมื่อเข้าเทิร์น คอลการ์ดยูนิตจากนรก 1 ใบลงสนาม โดยที่พลังโจมตีพื้นฐานต้องไม่เกิน 2'
  },

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
  },

  // ==================== MONSTER & SPELL: เด็คเหนือ ====================
  {
    id: 'NM01',
    name: 'ไพร่ชาวนาเหนือ',
    type: 'Monster',
    rarity: 'N', // ระดับความหายาก (ภาพเท่านั้น): N / R / SR / Legend
    power: 1,
    image: 'images/เด็คเหนือ/2.png',
    ability: 'PEASANT_HAND_SKILL',
    desc: 'สั่งใช้จากบนมือ: ส่งใบนี้ลงนรกและเลือก 1 อย่าง:\n1) อัญเชิญ "สายลับไพร่เหนือ" จากกองหรือนรกลงสนามอีกฝ่าย\n2) นำการ์ด "ทหาร" 1 ใบจากกองขึ้นมือ'
  },
  {
    id: 'NM02',
    name: 'ทหารหลวงเหนือ',
    type: 'Monster',
    rarity: 'R', // ระดับความหายาก (ภาพเท่านั้น): N / R / SR / Legend
    power: 2,
    image: 'images/เด็คเหนือ/3.png',
    ability: 'ROYAL_GUARD_SKILL',
    desc: 'สั่งใช้จากบนมือ: ส่ง "ไพร่ชาวนาเหนือ" 1 ใบบนมือลงนรกเพื่ออัญเชิญจุติใบนี้ (พลัง +1)\nจุติ: หากมี "ทหารเกณฑ์เหนือ" บนสนามเรา อัญเชิญ "ทหาร" 1 ใบจากกอง/นรกลงสนามทันที'
  },
  {
    id: 'NM03',
    name: 'ทหารพรานเหนือ',
    type: 'Monster',
    rarity: 'N', // ระดับความหายาก (ภาพเท่านั้น): N / R / SR / Legend
    power: 1,
    image: 'images/เด็คเหนือ/4.png',
    ability: 'RANGER_SKILL',
    desc: 'สั่งใช้จากบนมือ: ส่ง "ไพร่ชาวนาเหนือ" ลงนรกแล้วอัญเชิญใบนี้ลงสนาม (พลัง +1)\nสั่งใช้/เทิร์นละครั้ง: เลือกยูนิท 1 ใบ ถ้าเป็นฝั่งเราพลัง +1 ถ้าเป็นฝั่งตรงข้ามพลัง -1',
    effects: [
      {
        id: 'rangerTarget',
        label: 'เลือกยูนิท 1 ใบ (ฝั่งเราพลัง +1 / ฝั่งตรงข้ามพลัง -1)',
        trigger: 'ACTIVATE_MAIN',
        oncePerTurn: true,
        steps: [
          { block: 'FLEX_POWER', plusAmount: 1, minusAmount: 1, duration: 'PERM' }
        ]
      }
    ]
  },
  {
    id: 'NM04',
    name: 'ทหารเกณฑ์เหนือ',
    type: 'Monster',
    rarity: 'R', // ระดับความหายาก (ภาพเท่านั้น): N / R / SR / Legend
    power: 1,
    image: 'images/เด็คเหนือ/5.png',
    ability: 'CONSCRIPT_SKILL',
    desc: 'ออโต้: เมื่อลงสนาม พลัง +1\nต่อเนื่อง: พลังโจมตี +1 ตามจำนวน "ทหาร" ใบอื่นบนสนามเรา\nคำสั่งเสีย: เมื่อถูกทำลาย นำการ์ดที่มีคำว่า "ไพร่" 1 ใบจากนรกขึ้นมือ',
    effects: [
      {
        id: 'conscript_summon',
        trigger: 'ON_SUMMON',
        steps: [
          { block: 'ADD_POWER', target: 'SELF_UNIT', amount: 1, duration: 'PERM' }
        ]
      },
      {
        id: 'conscript_continuous',
        trigger: 'CONTINUOUS_POWER',
        condition: { type: 'PER_OTHER_ALLY_TRIBE', tribe: 'ทหาร' },
        amountPerUnit: 1
      },
      {
        id: 'conscript_death',
        trigger: 'ON_DESTROY',
        steps: [
          { block: 'RECOVER_FROM_GRAVE', filterTribe: 'ไพร่', count: 1, autoPickFirst: true }
        ]
      }
    ]
  },
  {
    id: 'NM05',
    name: 'สายลับไพร่เหนือ',
    type: 'Monster',
    rarity: 'N', // ระดับความหายาก (ภาพเท่านั้น): N / R / SR / Legend
    power: 0,
    image: 'images/เด็คเหนือ/6.png',
    ability: 'SPY_SKILL',
    isSpy: true,
    desc: 'สายลับ: อัญเชิญการ์ดใบนี้ลงบนสนามฝ่ายตรงข้าม\nคำสั่งเสีย: ลงนรกฝ่ายตรงข้าม และฝ่ายตรงข้ามจั่วการ์ด 1 ใบ',
    effects: [
      {
        id: 'spy_death',
        trigger: 'ON_DESTROY',
        steps: [
          { block: 'DRAW', side: 'OPPONENT', count: 1 }
        ]
      }
    ]
  },
  {
    id: 'NS01',
    name: 'หมอไพร่เหนือ',
    type: 'NormalSpell',
    rarity: 'N', // ระดับความหายาก (ภาพเท่านั้น): N / R / SR / Legend
    effect: 'SPELL_RECOVER_PHRAI',
    image: 'images/เด็คเหนือ/7.png',
    desc: 'นำการ์ดที่มีคำว่า "ไพร่" 1 ใบจากนรกขึ้นมือ',
    effects: [
      {
        id: 'spell_ns01',
        trigger: 'CAST_SPELL',
        steps: [
          { block: 'RECOVER_FROM_GRAVE', filterTribe: 'ไพร่', count: 1 }
        ]
      }
    ]
  },
  {
    id: 'NS02',
    name: 'หมอสนามเหนือ',
    type: 'NormalSpell',
    rarity: 'N', // ระดับความหายาก (ภาพเท่านั้น): N / R / SR / Legend
    effect: 'SPELL_RECOVER_SOLDIER',
    image: 'images/เด็คเหนือ/8.png',
    desc: 'นำการ์ดที่มีคำว่า "ทหาร" 1 ใบจากนรกขึ้นมือ',
    effects: [
      {
        id: 'spell_ns02',
        trigger: 'CAST_SPELL',
        steps: [
          { block: 'RECOVER_FROM_GRAVE', filterTribe: 'ทหาร', count: 1 }
        ]
      }
    ]
  },
  {
    id: 'NS03',
    name: 'ระเบิดปูพรม',
    type: 'NormalSpell',
    rarity: 'SR', // ระดับความหายาก (ภาพเท่านั้น): N / R / SR / Legend
    effect: 'SPELL_CARPET_BOMB',
    image: 'images/เด็คเหนือ/9.png',
    desc: 'แสดงผลตามยูนิท "ทหาร" บนสนามเรา:\n- ทหารเกณฑ์เหนือ: ยูนิท "เหนือ" ทุกใบพลัง +1 จนจบเทิร์น\n- ทหารพรานเหนือ: ทำลายยูนิทอีกฝ่าย 1 ใบ\n- ทหารหลวงเหนือ: ยูนิทเราทุกใบไม่ถูกทำลายจนเริ่มเทิร์นถัดไป',
    effects: [
      {
        id: 'spell_ns03',
        trigger: 'CAST_SPELL',
        steps: [
          { block: 'CARPET_BOMB_COMPOSITE' }
        ]
      }
    ]
  },
  {
    id: 'NS04',
    name: 'หน่วยข่าวกรอง',
    type: 'NormalSpell',
    rarity: 'R', // ระดับความหายาก (ภาพเท่านั้น): N / R / SR / Legend
    effect: 'SPELL_RECOVER_SPELL',
    image: 'images/เด็คเหนือ/10.png',
    desc: 'นำการ์ดเวทจากในนรกขึ้นมือ 1 ใบ',
    effects: [
      {
        id: 'spell_ns04',
        trigger: 'CAST_SPELL',
        steps: [
          { block: 'RECOVER_FROM_GRAVE', filterType: 'SPELL', count: 1 }
        ]
      }
    ]
  },
  {
    id: 'NS05',
    name: 'จีวรบิน',
    type: 'NormalSpell',
    rarity: 'SR', // ระดับความหายาก (ภาพเท่านั้น): N / R / SR / Legend
    effect: 'SPELL_BOUNCE_ENEMY',
    image: 'images/เด็คเหนือ/11.png',
    desc: 'เลือกยูนิทฝั่งตรงข้าม 1 ใบ นำการ์ดใบนั้นกลับขึ้นมือเจ้าของ',
    effects: [
      {
        id: 'spell_ns05',
        trigger: 'CAST_SPELL',
        steps: [
          { block: 'BOUNCE_UNIT', target: 'OPPONENT', count: 1 }
        ]
      }
    ]
  },

  // ==================== MONSTER & SPELL: เด็ควันสิ้นโลก ====================
  {
    id: 'DM01',
    name: 'โอนามิ ผู้ทำลายโลก',
    type: 'Monster',
    rarity: 'Legend', // ระดับความหายาก (ภาพเท่านั้น): N / R / SR / Legend
    power: 2,
    maxCopies: 2,
    image: 'images/วันสิ้นโลก/2.png',
    ability: 'ONAMI_SKILL',
    desc: 'คู่หู: เมื่ออยู่คู่กับ "โรเซเลีย" พลังโจมตี +2 ตลอดเทิร์นเราและอีกฝ่าย\nสั่งใช้งาน/1 เทิร์น: ทิ้งการ์ดมือ 1 ใบ อัญเชิญ "โรเซเลีย" จากกองหรือนรก 1 ใบลงสนาม แล้วสับกอง',
    effects: [
      {
        id: 'onami_partner_buff',
        trigger: 'CONTINUOUS_POWER',
        condition: { type: 'ALLY_ON_BOARD', cardId: 'DM02' },
        amount: 2
      },
      {
        id: 'onamiSummon',
        label: 'ทิ้งมือ 1 ใบ -> อัญเชิญ "โรเซเลีย" จากกองหรือนรกลงสนาม',
        trigger: 'ACTIVATE_MAIN',
        oncePerTurn: true,
        costs: [{ type: 'DISCARD_HAND', count: 1, triggerDiscardSkill: true }],
        steps: [
          { block: 'SEARCH_DECK_OR_GRAVE', cardId: 'DM02', destination: 'BOARD', grantImmunity: true }
        ]
      }
    ]
  },
  {
    id: 'DM02',
    name: 'โรเซเลีย',
    type: 'Monster',
    rarity: 'SR', // ระดับความหายาก (ภาพเท่านั้น): N / R / SR / Legend
    power: 3,
    maxCopies: 2,
    image: 'images/วันสิ้นโลก/3.png',
    ability: 'ROSELIA_SKILL',
    desc: 'คู่หู: เมื่ออยู่คู่กับโอนามิ สามารถ Rest ใบนี้เพื่อจั่ว 1 ใบได้\nออโต้: เมื่อลงสนามด้วยสกิลของโอนามิ จะไม่โดนความสามารถการ์ดอีกฝ่ายจนจบเทิร์น\nออโต้: เมื่อถูกทำลายจากการต่อสู้ จั่ว 1 ใบ',
    effects: [
      {
        id: 'roselia_draw',
        label: 'เปลี่ยนโรเซเลียเป็น Rest -> จั่วการ์ด 1 ใบ (ต้องมีโอนามิบนสนาม)',
        trigger: 'ACTIVATE_MAIN',
        condition: { type: 'ALLY_ON_BOARD', cardId: 'DM01' },
        costs: [{ type: 'REST_SELF' }],
        steps: [
          { block: 'DRAW', side: 'SELF', count: 1 }
        ]
      },
      {
        id: 'roselia_battle_death',
        trigger: 'ON_BATTLE_DESTROY',
        steps: [
          { block: 'DRAW', side: 'SELF', count: 1 }
        ]
      }
    ]
  },
  {
    id: 'DM03',
    name: 'มายอา',
    type: 'Monster',
    rarity: 'R', // ระดับความหายาก (ภาพเท่านั้น): N / R / SR / Legend
    power: 2,
    maxCopies: 1,
    image: 'images/วันสิ้นโลก/4.png',
    ability: 'MAYA_SKILL',
    desc: '[ใส่ได้ 1 ใบ] ต่อเนื่อง: ตราบที่มี "ซึรุรุ" บนสนามเรา ยูนิทนี้ไม่ตกเป็นเป้าหมายการโจมตี\n1 เกม: เมื่ออีกฝ่ายโจมตี เปิดท็อปการ์ด 1 ใบ ถ้าเป็น "โซเนบุ" อีกฝ่ายจบเทิร์นทันที'
  },
  {
    id: 'DM04',
    name: 'เดบิรุน',
    type: 'Monster',
    rarity: 'R', // ระดับความหายาก (ภาพเท่านั้น): N / R / SR / Legend
    power: 2,
    maxCopies: 1,
    image: 'images/วันสิ้นโลก/5.png',
    ability: 'DEBIRUN_SKILL',
    desc: '[ใส่ได้ 1 ใบ] ออโต้: เมื่อเข้าเทิร์น ค้นหาการ์ดเวทจากกองหรือนรกขึ้นมือแล้วบังคับใช้งาน แต่ถ้าไม่สามารถใช้งานได้ ชุบยูนิตจากนรกได้ 1 ใบ'
  },
  {
    id: 'DM05',
    name: 'ซึรุรุ',
    type: 'Monster',
    rarity: 'R', // ระดับความหายาก (ภาพเท่านั้น): N / R / SR / Legend
    power: 1,
    maxCopies: 1,
    image: 'images/วันสิ้นโลก/6.png',
    ability: 'TSURURU_SKILL',
    desc: '[ใส่ได้ 1 ใบ] ออโต้: เมื่อการ์ดใบนี้ถูกทิ้งจากสกิลของ "โอนามิ ผู้ทำลายโลก" อีกฝ่ายต้องทิ้งมือ 1 ใบ'
  },
  {
    id: 'DM06',
    name: 'โซเนบุ',
    type: 'Monster',
    rarity: 'R', // ระดับความหายาก (ภาพเท่านั้น): N / R / SR / Legend
    power: 3,
    maxCopies: 1,
    image: 'images/วันสิ้นโลก/7.png',
    ability: 'SONEBU_SKILL',
    desc: '[ใส่ได้ 1 ใบ] ออโต้: เมื่อยูนิตนี้โจมตี ถ้าอีกฝ่ายใช้เวทรีแอค ทั้ง 2 ฝ่ายทอยเต๋า ใครน้อยกว่าชนะและสกิลเวทนั้นไร้ผล'
  },
  {
    id: 'DM07',
    name: 'แอชชี่ล่า',
    type: 'Monster',
    rarity: 'R', // ระดับความหายาก (ภาพเท่านั้น): N / R / SR / Legend
    power: 2,
    maxCopies: 1,
    image: 'images/วันสิ้นโลก/8.png',
    ability: 'ASHILA_SKILL',
    desc: '[ใส่ได้ 1 ใบ] สั่งใช้งานจากบนมือ: ถ้ายูนิตฝ่ายเราถูกทำลาย 2 ใบขึ้นไปในเทิร์นนี้ ทำการคอลการ์ดใบนี้ลงสนาม แล้วพลังโจมตีเพิ่มขึ้น +2 จนจบเทิร์น'
  },
  {
    id: 'DM08',
    name: 'เอมิ',
    type: 'Monster',
    rarity: 'R', // ระดับความหายาก (ภาพเท่านั้น): N / R / SR / Legend
    power: 1,
    maxCopies: 1,
    image: 'images/วันสิ้นโลก/9.png',
    ability: 'EMI_SKILL',
    desc: '[ใส่ได้ 1 ใบ] ออโต้: ถ้าบนสนามเรามี "เดบิรุน" พลังโจมตี +1 และสามารถทิ้งการ์ดมือ 3 ใบเพื่อ Stand โจมตีอีกครั้งได้',
    effects: [
      {
        id: 'emi_continuous',
        trigger: 'CONTINUOUS_POWER',
        condition: { type: 'ALLY_ON_BOARD', cardId: 'DM04' },
        amount: 1
      }
    ]
  },

  // --- การ์ดอนาคต (DM09 - DM14): ห้ามอัญเชิญแบบปกติ ---
  {
    id: 'DM09',
    name: 'ผู้รักษาความฝัน มายอา',
    type: 'Monster',
    rarity: 'SR', // ระดับความหายาก (ภาพเท่านั้น): N / R / SR / Legend
    power: 2,
    maxCopies: 1,
    cannotNormalSummon: true,
    image: 'images/วันสิ้นโลก/10.png',
    ability: 'FUTURE_MAYA',
    futureBaseId: 'DM03',
    futureBaseName: 'มายอา',
    desc: '[ใส่ได้ 1 ใบ | ห้ามอัญเชิญปกติ | อนาคต: มายอา]\nส่ง "มายอา" บนสนามไปมิติมืดแล้วคอลใบนี้: พลัง +1 และเปิดท็อปกอง ถ้าเป็นเวท บังคับ Rest ยูนิตอีกฝ่าย 1 ใบ (จบเทิร์นลงนรกและคอลมายอากลับมา)'
  },
  {
    id: 'DM10',
    name: 'เดบิรุน เดอะ ฟิวเจอร์',
    type: 'Monster',
    rarity: 'SR', // ระดับความหายาก (ภาพเท่านั้น): N / R / SR / Legend
    power: 2,
    maxCopies: 1,
    cannotNormalSummon: true,
    image: 'images/วันสิ้นโลก/11.png',
    ability: 'FUTURE_DEBIRUN',
    futureBaseId: 'DM04',
    futureBaseName: 'เดบิรุน',
    desc: '[ใส่ได้ 1 ใบ | ห้ามอัญเชิญปกติ | อนาคต: เดบิรุน]\nส่ง "เดบิรุน" บนสนามไปมิติมืดแล้วคอลใบนี้: นำยูนิตอื่นบนสนามเรา 1 ใบขึ้นมือ จากนั้นเปิดท็อปกอง ถ้าเป็นยูนิตคอลลงสนามโดยสกิลไม่ทำงาน ถ้าเป็นเวทนำขึ้นมือ'
  },
  {
    id: 'DM11',
    name: 'เด็กสาวขนมหวาน ซึรุรุ',
    type: 'Monster',
    rarity: 'SR', // ระดับความหายาก (ภาพเท่านั้น): N / R / SR / Legend
    power: 2,
    maxCopies: 1,
    cannotNormalSummon: true,
    image: 'images/วันสิ้นโลก/12.png',
    ability: 'FUTURE_TSURURU',
    futureBaseId: 'DM05',
    futureBaseName: 'ซึรุรุ',
    desc: '[ใส่ได้ 1 ใบ | ห้ามอัญเชิญปกติ | อนาคต: ซึรุรุ]\nส่ง "ซึรุรุ" บนสนามไปมิติมืดแล้วคอลใบนี้: คอล "มายอา" จากนรก 1 ใบลงสนามและเพิ่มพลังให้มายอา +1 (จบเทิร์นลงนรกและคอลซึรุรุกลับมา)'
  },
  {
    id: 'DM12',
    name: 'นักล่าปีศาจ โซเนบุ',
    type: 'Monster',
    rarity: 'SR', // ระดับความหายาก (ภาพเท่านั้น): N / R / SR / Legend
    power: 2,
    maxCopies: 1,
    cannotNormalSummon: true,
    image: 'images/วันสิ้นโลก/13.png',
    ability: 'FUTURE_SONEBU',
    futureBaseId: 'DM06',
    futureBaseName: 'โซเนบุ',
    desc: '[ใส่ได้ 1 ใบ | ห้ามอัญเชิญปกติ | อนาคต: โซเนบุ]\nส่ง "โซเนบุ" บนสนามไปมิติมืดแล้วคอลใบนี้: อีกฝ่ายเลือกทิ้งมือ 1 ใบ หรือทำลายยูนิตบนสนาม 1 ใบ ถ้าไม่ทำ ยูนิตนี้พลัง +1'
  },
  {
    id: 'DM13',
    name: 'ยอดนักดาบ แอชชี่ล่า',
    type: 'Monster',
    rarity: 'SR', // ระดับความหายาก (ภาพเท่านั้น): N / R / SR / Legend
    power: 3,
    maxCopies: 1,
    cannotNormalSummon: true,
    image: 'images/วันสิ้นโลก/14.png',
    ability: 'FUTURE_ASHILA',
    futureBaseId: 'DM07',
    futureBaseName: 'แอชชี่ล่า',
    desc: '[ใส่ได้ 1 ใบ | ห้ามอัญเชิญปกติ | อนาคต: แอชชี่ล่า]\nส่ง "แอชชี่ล่า" บนสนามไปมิติมืดแล้วคอลใบนี้: การ์ดทุกใบบนสนามอีกฝ่ายพลังโจมตี -1 จนจบเทิร์น (จบเทิร์นลงนรกและคอลแอชชี่ล่ากลับมา)',
    effects: [
      {
        id: 'future_ashila_debuff',
        trigger: 'ON_SUMMON',
        steps: [
          { block: 'REDUCE_POWER', target: 'ALL_ENEMIES', amount: 1, duration: 'TURN' }
        ]
      }
    ]
  },
  {
    id: 'DM14',
    name: 'สุดยอดเอไอ เอมิ',
    type: 'Monster',
    rarity: 'SR', // ระดับความหายาก (ภาพเท่านั้น): N / R / SR / Legend
    power: 1,
    maxCopies: 1,
    cannotNormalSummon: true,
    image: 'images/วันสิ้นโลก/15.png',
    ability: 'FUTURE_EMI',
    futureBaseId: 'DM08',
    futureBaseName: 'เอมิ',
    desc: '[ใส่ได้ 1 ใบ | ห้ามอัญเชิญปกติ | อนาคต: เอมิ]\nส่ง "เอมิ" บนสนามไปมิติมืดแล้วคอลใบนี้: บังคับอีกฝ่ายนำการ์ดบนสนาม 1 ใบขึ้นมือแล้วคอลใบอื่นลงมาแทน ถ้าไม่มีเราจั่ว 1 ใบ'
  },

  // --- เวทมนตร์เด็ควันสิ้นโลก ---
  {
    id: 'DS01',
    name: 'เบิกเนตรแห่งแสง',
    type: 'NormalSpell',
    rarity: 'R', // ระดับความหายาก (ภาพเท่านั้น): N / R / SR / Legend
    maxCopies: 2,
    effect: 'SPELL_LIGHT_AWAKEN',
    image: 'images/วันสิ้นโลก/16.png',
    desc: 'จั่วการ์ด 1 ใบ แต่ถ้าในนรกเรามีการ์ด 5 ใบขึ้นไป จั่ว 2 ใบแทน และเพิ่มพลังโจมตี +1 ให้ยูนิตบนสนามเรา 1 ใบ',
    effects: [
      {
        id: 'spell_ds01',
        trigger: 'CAST_SPELL',
        steps: [
          { block: 'DRAW', side: 'SELF', count: 1, bonusIfGraveAtLeast: 5, bonusCount: 2 },
          { block: 'ADD_POWER', target: 'ALLY', count: 1, amount: 1, duration: 'TURN' }
        ]
      }
    ]
  },
  {
    id: 'DS02',
    name: 'พวกเราจะช่วยเอง',
    type: 'ReactionSpell',
    rarity: 'R', // ระดับความหายาก (ภาพเท่านั้น): N / R / SR / Legend
    maxCopies: 2,
    effect: 'SPELL_WE_WILL_HELP',
    image: 'images/วันสิ้นโลก/17.png',
    desc: 'เมื่ออีกฝ่ายโจมตี: นำการ์ดยูนิต (ที่ไม่ใช่เวท) 5 ใบในนรกเรากลับเข้ากองและสับกอง แล้วยกเลิกการโจมตีนั้นทันที'
  }
];

const DEFAULT_DECK_LIST = [
  'M01', 'M01', 'M02', 'M02', 'M03', 'M03', 'M04', 'M04', 'M05', 'M05',
  'M06', 'M06', 'S01', 'S01', 'S02', 'S02', 'S03', 'S03', 'S04', 'S04'
];

const DEFAULT_NUEA_DECK_LIST = [
  'NM01', 'NM01', 'NM02', 'NM02', 'NM03', 'NM03', 'NM04', 'NM04', 'NM05', 'NM05',
  'NS01', 'NS01', 'NS02', 'NS02', 'NS03', 'NS03', 'NS04', 'NS04', 'NS05', 'NS05'
];

const DEFAULT_DOOMSDAY_DECK_LIST = [
  'DM01', 'DM01', 'DM02', 'DM02',
  'DM03', 'DM04', 'DM05', 'DM06', 'DM07', 'DM08',
  'DM09', 'DM10', 'DM11', 'DM12', 'DM13', 'DM14',
  'DS01', 'DS01', 'DS02', 'DS02'
];


/* ============================================================================
   หมวดที่ 2: ฟังก์ชันตรวจสอบเผ่า, คำอธิบายอัตโนมัติ และการคำนวณค่าพลังจากบล็อก
   ============================================================================ */
function isNueaCard(card) { return card && card.name && card.name.includes('เหนือ'); }
function isSoldierCard(card) { return card && card.name && card.name.includes('ทหาร'); }
function isPhraiCard(card) { return card && card.name && card.name.includes('ไพร่'); }
function hasCardTribe(card, tribeKeyword) { return card && card.name && card.name.includes(tribeKeyword); }
function getCardMaxCopies(cardTemplate) { return cardTemplate && cardTemplate.maxCopies !== undefined ? cardTemplate.maxCopies : 2; }

// 📝 ระบบสร้างข้อความอธิบายความสามารถอัตโนมัติจากบล็อก effects (กรณีการ์ดใหม่ไม่ได้เขียน desc เอง)
function generateStepText(step) {
  switch (step.block) {
    case 'DRAW':
      if (step.bonusIfGraveAtLeast) {
        return `จั่วการ์ด ${step.count} ใบ (ถ้านรกมี ${step.bonusIfGraveAtLeast} ใบขึ้นไป จั่ว ${step.bonusCount} ใบ)`;
      }
      return `${step.side === 'OPPONENT' ? 'อีกฝ่าย' : ''}จั่วการ์ด ${step.count || 1} ใบ`;
    case 'DESTROY_UNIT':
      return step.select === 'ALL'
        ? `ทำลายยูนิต${step.target === 'OPPONENT' ? 'อีกฝ่าย' : ''}ทุกใบ`
        : `เลือกทำลายยูนิต${step.target === 'OPPONENT' ? 'อีกฝ่าย' : ''} ${step.count || 1} ใบ`;
    case 'ADD_POWER': {
      const durText = step.duration === 'TURN' ? 'จนจบเทิร์น' : '';
      if (step.target === 'SELF_UNIT') return `พลังโจมตียูนิตนี้ +${step.amount} ${durText}`.trim();
      if (step.target === 'ALL_ALLIES') return `ยูนิต${step.filterTribe ? `"${step.filterTribe}"` : 'ฝั่งเรา'}ทุกใบพลัง +${step.amount} ${durText}`.trim();
      return `เลือกยูนิตฝั่งเรา ${step.count || 1} ใบ พลัง +${step.amount} ${durText}`.trim();
    }
    case 'REDUCE_POWER': {
      const durText = step.duration === 'TURN' ? 'จนจบเทิร์น' : '';
      if (step.target === 'ALL_ENEMIES') return `ลดพลังยูนิตอีกฝ่ายทุกใบ -${step.amount} ${durText}`.trim();
      return `เลือกยูนิตอีกฝ่าย ${step.count || 1} ใบ พลัง -${step.amount} ${durText}`.trim();
    }
    case 'FLEX_POWER':
      return `เลือกยูนิต 1 ใบ (ฝั่งเราพลัง +${step.plusAmount} / ฝั่งตรงข้ามพลัง -${step.minusAmount})`;
    case 'HEAL_LEADER':
      return `ฟื้นฟู HP ลีดเดอร์เรา +${step.amount}`;
    case 'DAMAGE_LEADER':
      return `ทำดาเมจใส่ลีดเดอร์${step.side === 'OPPONENT' ? 'อีกฝ่าย' : ''} ${step.amount} หน่วย`;
    case 'MILL_DECK':
      return `ส่งการ์ดใบบนสุดของกอง${step.side === 'OPPONENT' ? 'อีกฝ่าย' : 'เรา'} ${step.count || 1} ใบลงนรก`;
    case 'RECOVER_FROM_GRAVE':
      return `นำการ์ด${step.filterTribe ? ` "${step.filterTribe}"` : step.filterType === 'SPELL' ? 'เวทมนตร์' : ''} ${step.count || 1} ใบจากนรกขึ้นมือ`;
    case 'BOUNCE_UNIT':
      return `เลือกยูนิตอีกฝ่าย ${step.count || 1} ใบ กลับขึ้นมือเจ้าของ`;
    default:
      return '';
  }
}

function getCardDescription(card) {
  if (!card) return '';
  if (card.desc && card.desc.trim() !== '') return card.desc;
  if (!Array.isArray(card.effects) || card.effects.length === 0) return 'ไม่มีความสามารถพิเศษ';

  return card.effects.map(eff => {
    const triggerMap = {
      ON_SUMMON: 'ออโต้ (เมื่อลงสนาม): ',
      ON_DESTROY: 'คำสั่งเสีย: ',
      ON_BATTLE_DESTROY: 'เมื่อถูกทำลายจากการต่อสู้: ',
      ACTIVATE_MAIN: 'สั่งใช้งาน: ',
      ACTIVATE_LEADER: 'สั่งใช้งาน/เทิร์น: ',
      CAST_SPELL: ''
    };
    const prefix = triggerMap[eff.trigger] || '';
    const stepsText = (eff.steps || []).map(generateStepText).filter(Boolean).join(' แล้ว');
    return `${prefix}${stepsText}`;
  }).filter(Boolean).join('\n');
}

// เติม desc อัตโนมัติให้การ์ดในฐานข้อมูลที่ไม่ได้ระบุ desc
CARD_DATABASE.forEach(c => {
  if (!c.desc) c.desc = getCardDescription(c);
});

function shuffleDeck(deckArray) {
  const arr = [...deckArray];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function createCardInstance(template, uid) {
  return {
    ...template,
    desc: getCardDescription(template),
    uid,
    state: 'Stand',
    basePower: template.power !== undefined ? template.power : 0,
    permPowerMod: 0,
    tempPowerMod: 0,
    destroyAtEndOfTurn: false,
    burnLeaderOnKill: false,
    indestructibleUntilNextTurn: false,
    immuneToEnemyEffectsUntilEndOfTurn: false,
    returnFromDarkDimensionId: null,
    usedSkills: {}
  };
}

function resetCardStateForZoneChange(card) {
  if (!card) return card;
  card.state = 'Stand';
  card.permPowerMod = 0;
  card.tempPowerMod = 0;
  card.destroyAtEndOfTurn = false;
  card.burnLeaderOnKill = false;
  card.indestructibleUntilNextTurn = false;
  card.immuneToEnemyEffectsUntilEndOfTurn = false;
  card.returnFromDarkDimensionId = null;
  card.usedSkills = {};
  return card;
}

function isPartnerActive(contestant) {
  if (!contestant || !Array.isArray(contestant.board)) return false;
  const hasOnami = contestant.board.some(m => m !== null && m.id === 'DM01');
  const hasRoselia = contestant.board.some(m => m !== null && m.id === 'DM02');
  return hasOnami && hasRoselia;
}

// ⚡ คำนวณค่าพลังผ่านบล็อก CONTINUOUS_POWER และ CONTINUOUS_BOARD_AURA
function getEffectivePower(card, ownerContestant) {
  if (!card || card.type !== 'Monster') return 0;

  let total = (card.basePower !== undefined ? card.basePower : card.power)
    + (card.permPowerMod || 0)
    + (card.tempPowerMod || 0);

  if (ownerContestant && Array.isArray(ownerContestant.board)) {
    // 1. บล็อก CONTINUOUS_POWER ของตัวการ์ดเอง
    if (Array.isArray(card.effects)) {
      card.effects.filter(e => e.trigger === 'CONTINUOUS_POWER').forEach(eff => {
        const cond = eff.condition;
        if (!cond) {
          total += (eff.amount || 0);
        } else if (cond.type === 'ALLY_ON_BOARD') {
          if (ownerContestant.board.some(m => m !== null && m.id === cond.cardId)) {
            total += (eff.amount || 0);
          }
        } else if (cond.type === 'PER_OTHER_ALLY_TRIBE') {
          const count = ownerContestant.board.filter(m =>
            m !== null && m.uid !== card.uid && hasCardTribe(m, cond.tribe)
          ).length;
          total += count * (eff.amountPerUnit || 1);
        }
      });
    }

    // 2. บล็อก CONTINUOUS_BOARD_AURA จาก Leader (เช่น ขุนเหนือ L02)
    if (ownerContestant.leader && Array.isArray(ownerContestant.leader.effects)) {
      ownerContestant.leader.effects.filter(e => e.trigger === 'CONTINUOUS_BOARD_AURA').forEach(aura => {
        if (!aura.targetTribe || hasCardTribe(card, aura.targetTribe)) {
          if (aura.condition && aura.condition.type === 'MIN_TRIBE_COUNT') {
            const cnt = ownerContestant.board.filter(m => m !== null && hasCardTribe(m, aura.condition.tribe)).length;
            if (cnt >= aura.condition.count) total += (aura.amount || 0);
          }
        }
      });
    }
  }

  return Math.max(0, total);
}

function getDefaultDeckForLeader(leaderId) {
  if (leaderId === 'L02') return DEFAULT_NUEA_DECK_LIST;
  if (leaderId === 'L03') return DEFAULT_DOOMSDAY_DECK_LIST;
  return DEFAULT_DECK_LIST;
}

function createValidDeck(leaderId, mainDeckCardIds, ownerPrefix) {
  const leaderTemplate = CARD_DATABASE.find(c => c.id === leaderId && c.type === 'Leader')
    || CARD_DATABASE.find(c => c.type === 'Leader');

  const defaultListForLeader = getDefaultDeckForLeader(leaderTemplate.id);
  const sourceList = (Array.isArray(mainDeckCardIds) && mainDeckCardIds.length === 20)
    ? mainDeckCardIds
    : defaultListForLeader;

  const idCounter = {};
  const mainDeck = [];

  sourceList.forEach((cardId, index) => {
    const cardTemplate = CARD_DATABASE.find(c => c.id === cardId && c.type !== 'Leader');
    if (!cardTemplate) return;
    const maxAllowed = getCardMaxCopies(cardTemplate);
    idCounter[cardTemplate.id] = (idCounter[cardTemplate.id] || 0) + 1;
    if (idCounter[cardTemplate.id] <= maxAllowed && mainDeck.length < 20) {
      mainDeck.push(createCardInstance(cardTemplate, `${ownerPrefix}_${cardTemplate.id}_${index + 1}`));
    }
  });

  if (mainDeck.length < 20) {
    defaultListForLeader.forEach((cardId, idx) => {
      if (mainDeck.length >= 20) return;
      const cardTemplate = CARD_DATABASE.find(c => c.id === cardId && c.type !== 'Leader');
      if (!cardTemplate) return;
      const maxAllowed = getCardMaxCopies(cardTemplate);
      idCounter[cardTemplate.id] = (idCounter[cardTemplate.id] || 0) + 1;
      if (idCounter[cardTemplate.id] <= maxAllowed) {
        mainDeck.push(createCardInstance(cardTemplate, `${ownerPrefix}_fill_${idx + 1}`));
      }
    });
  }

  return {
    leader: {
      ...leaderTemplate,
      hp: leaderTemplate.maxHp,
      abilityUsedThisTurn: false
    },
    deck: shuffleDeck(mainDeck)
  };
}

function drawCards(contestant, count) {
  for (let i = 0; i < count; i++) {
    if (contestant.deck.length > 0) {
      const card = contestant.deck.pop();
      resetCardStateForZoneChange(card);
      contestant.hand.push(card);
    }
  }
}

function performMulligan(contestant, indicesToMulligan) {
  if (!indicesToMulligan || indicesToMulligan.length === 0) return;
  const sortedIndices = [...indicesToMulligan].sort((a, b) => b - a);
  const returnedCards = [];

  for (const idx of sortedIndices) {
    if (contestant.hand[idx]) {
      returnedCards.push(contestant.hand.splice(idx, 1)[0]);
    }
  }

  drawCards(contestant, returnedCards.length);
  contestant.deck.push(...returnedCards);
  contestant.deck = shuffleDeck(contestant.deck);
}

// วางการ์ดทับช่องเดิม: ส่งใบเก่าลงนรกโดย "ไม่ถือว่าถูกทำลาย"
function sendOverwrittenMonsterToGrave(contestant, slotIndex) {
  const oldMonster = contestant.board[slotIndex];
  if (!oldMonster) return null;
  contestant.board[slotIndex] = null;
  resetCardStateForZoneChange(oldMonster);
  contestant.graveyard.push(oldMonster);
  return oldMonster;
}

// ทำลายยูนิตบนสนาม (รันบล็อก ON_DESTROY และ ON_BATTLE_DESTROY อัตโนมัติ)
function destroyBoardMonster(boardOwner, slotIndex, isFromBattle = false, isByEnemyEffect = false) {
  const monster = boardOwner.board[slotIndex];
  if (!monster) return { destroyed: false, reason: 'empty' };

  if (isByEnemyEffect && monster.immuneToEnemyEffectsUntilEndOfTurn) {
    setLog(`🛡️ "${monster.name}" ไม่ได้รับผลจากความสามารถของการ์ดฝ่ายตรงข้ามในเทิร์นนี้!`);
    return { destroyed: false, reason: 'immune', monster };
  }

  if (monster.indestructibleUntilNextTurn) {
    setLog(`🛡️ "${monster.name}" ไม่สามารถถูกทำลายได้จนเริ่มเทิร์นถัดไป!`);
    return { destroyed: false, reason: 'indestructible', monster };
  }

  boardOwner.board[slotIndex] = null;
  boardOwner.unitsDestroyedThisTurn = (boardOwner.unitsDestroyedThisTurn || 0) + 1;
  const otherContestant = (boardOwner === gameState.player) ? gameState.ai : gameState.player;

  resetCardStateForZoneChange(monster);
  boardOwner.graveyard.push(monster);

  // รันบล็อกความสามารถเมื่อถูกทำลาย (ON_DESTROY)
  EffectEngine.triggerCardEffects(monster, 'ON_DESTROY', {
    caster: boardOwner,
    opponent: otherContestant,
    sourceCard: monster,
    sourceSlot: slotIndex,
    isAI: boardOwner !== gameState.player
  });

  // รันบล็อกความสามารถเมื่อถูกทำลายจากการต่อสู้ (ON_BATTLE_DESTROY)
  if (isFromBattle) {
    EffectEngine.triggerCardEffects(monster, 'ON_BATTLE_DESTROY', {
      caster: boardOwner,
      opponent: otherContestant,
      sourceCard: monster,
      sourceSlot: slotIndex,
      isAI: boardOwner !== gameState.player
    });
  }

  // ตรวจสอบสกิลจากบนมือของ "แอชชี่ล่า" (DM07): ถ้ายูนิตฝ่ายเราถูกทำลายครบ 2 ใบขึ้นไปในเทิร์นนี้
  checkAshilaHandTrigger(boardOwner);

  return { destroyed: true, monster };
}

function checkAshilaHandTrigger(contestant) {
  if (!contestant || contestant.unitsDestroyedThisTurn < 2) return;

  const ashilaHandIdx = contestant.hand.findIndex(c => c.id === 'DM07');
  if (ashilaHandIdx === -1) return;

  if (contestant !== gameState.player) {
    const emptySlot = contestant.board.findIndex(m => m === null);
    if (emptySlot !== -1) {
      const summoned = contestant.hand.splice(ashilaHandIdx, 1)[0];
      resetCardStateForZoneChange(summoned);
      summoned.state = 'Stand';
      summoned.tempPowerMod += 2;
      contestant.board[emptySlot] = summoned;
      setLog('🔥 [AI แอชชี่ล่า] ยูนิตถูกทำลายครบ 2 ใบ! คอล "แอชชี่ล่า" จากบนมือลงสนามและพลังโจมตี +2 จนจบเทิร์น!');
      renderGame();
    }
    return;
  }

  setTimeout(() => {
    const currentIdx = contestant.hand.findIndex(c => c.id === 'DM07');
    if (currentIdx === -1 || gameState.gameOver) return;

    showChoiceModal(
      '🔥 เงื่อนไขสกิล "แอชชี่ล่า" บนมือทำงาน!',
      `ยูนิตฝั่งคุณถูกทำลายครบ ${contestant.unitsDestroyedThisTurn} ใบในเทิร์นนี้แล้ว!\nต้องการสั่งใช้งาน "แอชชี่ล่า" จากบนมือ เพื่อคอลลงสนามและเพิ่มพลังโจมตี +2 จนจบเทิร์นหรือไม่?`,
      [
        {
          label: '🔥 สั่งใช้งาน: คอล "แอชชี่ล่า" ลงสนาม (พลังโจมตี +2 จนจบเทิร์น!)',
          color: '#dc2626',
          onSelect: () => summonAshilaBySkillFromHand(contestant)
        },
        {
          label: 'ยังไม่ใช้ตอนนี้ (เก็บไว้บนมือก่อน)',
          color: '#475569',
          onSelect: () => renderGame()
        }
      ]
    );
  }, 150);
}

function summonAshilaBySkillFromHand(contestant) {
  const handIdx = contestant.hand.findIndex(c => c.id === 'DM07');
  if (handIdx === -1) return;

  const summoned = contestant.hand.splice(handIdx, 1)[0];
  resetCardStateForZoneChange(summoned);
  summoned.state = 'Stand';
  summoned.tempPowerMod += 2;

  const emptySlot = contestant.board.findIndex(m => m === null);
  if (emptySlot !== -1) {
    contestant.board[emptySlot] = summoned;
    setLog(`🔥 [สกิลแอชชี่ล่า] คอล "แอชชี่ล่า" จากบนมือลงช่องที่ ${emptySlot + 1} และพลังโจมตี +2 จนจบเทิร์น (เป็น ${getEffectivePower(summoned, contestant)})!`);
    renderGame();
  } else {
    gameState.pendingAction = {
      type: 'CALL_FROM_EFFECT_SELECT_SLOT',
      cardToPlace: summoned,
      onAfterPlace: null
    };
    setLog('🔥 [สกิลแอชชี่ล่า] สนามเต็ม 3 ช่อง — คลิกเลือกช่องบนสนามของคุณเพื่อวาง "แอชชี่ล่า" (Power 4) ทับ!');
    renderGame();
  }
}


/* ============================================================================
   หมวดที่ 3: สถานะเกม ระบบยืนยันการใช้การ์ด และหน้าต่างดูรายละเอียดการ์ด
   ============================================================================ */
const gameState = {
  turnCount: 1,
  activeTurn: 'player',
  phase: 'Mulligan',
  mulliganSelected: [],
  selectedHandIndex: null,
  selectedAttackerSlot: null,
  pendingAttack: null,
  pendingAction: null,
  isRollingDice: false,
  gameOver: false,
  player: null,
  ai: null
};

function createContestant(name, isFirstPlayer, prefix, leaderId = 'L01', deckList = DEFAULT_DECK_LIST) {
  const setup = createValidDeck(leaderId, deckList, prefix);
  return {
    name,
    isFirstPlayer,
    turnsTaken: 0,
    attacksThisTurn: 0,
    unitsDestroyedThisTurn: 0,
    futureUsedThisTurn: false,
    allForJitUsed: false,
    mayaOncePerGameUsed: false,
    leader: setup.leader,
    deck: setup.deck,
    hand: [],
    board: [null, null, null],
    graveyard: [],
    darkDimension: [],
    spellQuota: { normalUsed: 0, reactionUsed: 0 }
  };
}

function setLog(message) {
  const singleLog = document.getElementById('action-log');
  if (singleLog) singleLog.textContent = message;

  const scrollbox = document.getElementById('action-log-scrollbox');
  if (scrollbox) {
    const logItem = document.createElement('div');
    logItem.className = 'log-item';
    if (message.includes('🤖') || message.includes('AI')) {
      logItem.classList.add('ai-action');
    }
    logItem.textContent = `[Turn ${gameState.turnCount}] ${message}`;
    scrollbox.appendChild(logItem);
    scrollbox.scrollTop = scrollbox.scrollHeight;
  }
}

function checkGameOver() {
  if (gameState.player.leader.hp <= 0) {
    gameState.gameOver = true;
    gameState.pendingAction = null;
    setLog('💀 จบเกม! Leader ของคุณ HP เหลือ 0 — คุณเป็นฝ่ายพ่ายแพ้!');
    disableControls();
    setTimeout(() => showEndMatchModal('💀 คุณพ่ายแพ้!', 'Leader ของคุณ HP เหลือ 0'), 500);
    return true;
  }
  if (gameState.ai.leader.hp <= 0) {
    gameState.gameOver = true;
    gameState.pendingAction = null;
    setLog('🏆 ยินดีด้วย! Leader ของฝ่ายตรงข้าม HP เหลือ 0 — คุณเป็นฝ่ายชนะ!');
    disableControls();
    setTimeout(() => showEndMatchModal('🏆 ยินดีด้วย คุณชนะ!', 'คุณโจมตี Leader ของฝ่ายตรงข้ามจน HP เหลือ 0 สำเร็จ!'), 500);
    return true;
  }
  return false;
}

function showEndMatchModal(title, desc) {
  showChoiceModal(title, desc, [
    {
      label: '🔄 เริ่มเล่นใหม่อีกครั้ง',
      color: '#16a34a',
      onSelect: () => initGame()
    },
    {
      label: '🏠 กลับสู่หน้าล็อบบี้หลัก',
      color: '#3b82f6',
      onSelect: () => returnToLobbyScreen()
    }
  ]);
}

function returnToLobbyScreen() {
  if (typeof pvpState !== 'undefined' && pvpState.peer) pvpState.peer.destroy();
  if (typeof pvpState !== 'undefined') pvpState.isMultiplayer = false;
  const gameBoard = document.querySelector('.game-container');
  const lobbyScreen = document.getElementById('lobby-screen');
  const mulliganModal = document.getElementById('mulligan-modal');
  if (mulliganModal) mulliganModal.style.display = 'none';
  if (gameBoard) gameBoard.style.display = 'none';
  if (lobbyScreen) lobbyScreen.style.display = ''; // ให้ css/lobby.css เลือก flex/grid ตามขนาดจอเอง
}

function disableControls() {
  const passBtn = document.getElementById('btn-pass-turn-inline');
  if (passBtn) passBtn.disabled = true;
}

function showChoiceModal(title, description, options) {
  let modal = document.getElementById('custom-choice-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'custom-choice-modal';
    modal.className = 'modal-overlay';
    modal.style.display = 'none';
    modal.style.zIndex = '250';
    modal.innerHTML = `
      <div class="modal-box" style="max-width: 620px; max-height: 85vh; overflow-y: auto;">
        <h2 id="choice-modal-title" style="color: #38bdf8;">เลือกการทำงาน</h2>
        <p id="choice-modal-desc" style="color: #cbd5e1; margin: 10px 0 18px 0; white-space: pre-line;"></p>
        <div id="choice-modal-buttons" style="display: flex; flex-direction: column; gap: 10px;"></div>
      </div>
    `;
    document.body.appendChild(modal);
  }

  document.getElementById('choice-modal-title').textContent = title;
  document.getElementById('choice-modal-desc').textContent = description;
  const btnContainer = document.getElementById('choice-modal-buttons');
  btnContainer.innerHTML = '';

  options.forEach(opt => {
    const btn = document.createElement('button');
    btn.className = 'btn';
    btn.style.background = opt.color || '#3b82f6';
    btn.style.padding = '10px 16px';
    btn.textContent = opt.label;
    btn.disabled = !!opt.disabled;
    btn.onclick = () => {
      modal.style.display = 'none';
      if (opt.onSelect) opt.onSelect();
    };
    btnContainer.appendChild(btn);
  });

  modal.style.display = 'flex';
}

function askCardUseConfirmation(card, actionTitle, onConfirmCallback) {
  const powerInfo = card.type === 'Monster' ? ` (Power: ${card.power})` : '';
  showChoiceModal(
    `❓ ยืนยันการใช้งานการ์ด: ${card.name}${powerInfo}`,
    `คุณต้องการ ${actionTitle} ใช่หรือไม่?\n\n📜 ความสามารถ:\n${getCardDescription(card)}`,
    [
      {
        label: `✅ ยืนยัน (${actionTitle})`,
        color: '#16a34a',
        onSelect: () => {
          if (onConfirmCallback) onConfirmCallback();
        }
      },
      {
        label: '❌ ยกเลิก',
        color: '#475569',
        onSelect: () => renderGame()
      }
    ]
  );
}

function openCardDetailModal(card, ownerContestant = null) {
  if (!card) return;
  let detailModal = document.getElementById('card-detail-view-modal');
  if (!detailModal) {
    detailModal = document.createElement('div');
    detailModal.id = 'card-detail-view-modal';
    detailModal.className = 'modal-overlay';
    detailModal.style.display = 'none';
    detailModal.style.zIndex = '300';
    detailModal.innerHTML = `
      <div class="modal-box" style="max-width: 500px; text-align: left; display: flex; flex-direction: column; gap: 14px;">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #334155; padding-bottom: 10px;">
          <h2 id="detail-card-name" style="color: #fbbf24; font-size: 20px;">ชื่อการ์ด</h2>
          <span id="detail-card-type" style="background: #1e293b; padding: 4px 10px; border-radius: 12px; font-size: 12px; color: #38bdf8; border: 1px solid #475569;">ประเภท</span>
        </div>
        <div style="display: flex; gap: 16px; align-items: flex-start; flex-wrap: wrap; justify-content: center;">
          <img id="detail-card-img" src="" alt="Card Image" style="width: 180px; height: 250px; object-fit: cover; border-radius: 10px; border: 2px solid #fbbf24; box-shadow: 0 8px 20px rgba(0,0,0,0.7);">
          <div style="flex: 1; min-width: 220px; display: flex; flex-direction: column; gap: 10px;">
            <div id="detail-card-stats" style="background: #141724; padding: 10px 12px; border-radius: 8px; border: 1px solid #2e344e; font-weight: bold; color: #4ade80; font-size: 14px;"></div>
            <div style="background: #141724; padding: 12px; border-radius: 8px; border: 1px solid #2e344e;">
              <div style="font-size: 12px; color: #94a3b8; margin-bottom: 6px; font-weight: bold;">📜 รายละเอียดความสามารถ:</div>
              <div id="detail-card-desc" style="font-size: 14px; color: #f8fafc; line-height: 1.6; white-space: pre-line;"></div>
            </div>
          </div>
        </div>
        <button class="btn" id="btn-close-card-detail" style="background: #3b82f6; width: 100%; padding: 10px;">ปิดหน้าต่างรายละเอียด</button>
      </div>
    `;
    document.body.appendChild(detailModal);
    document.getElementById('btn-close-card-detail').onclick = () => {
      detailModal.style.display = 'none';
    };
  }

  document.getElementById('detail-card-name').textContent = card.name;
  document.getElementById('detail-card-type').textContent = card.type;
  document.getElementById('detail-card-img').src = card.image;

  let statsText = '';
  if (card.type === 'Monster') {
    const effPwr = ownerContestant ? getEffectivePower(card, ownerContestant) : card.power;
    const maxCopy = getCardMaxCopies(card);
    statsText = `⚔️ พลังโจมตี: ${effPwr} (พื้นฐาน: ${card.power})\n🃏 ใส่ในเด็คได้สูงสุด: ${maxCopy} ใบ`;
  } else if (card.type === 'Leader') {
    statsText = `👑 พลังชีวิตสูงสุด (HP): ${card.maxHp}`;
  } else {
    const maxCopy = getCardMaxCopies(card);
    statsText = `✨ การ์ดเวทมนตร์ (${card.type})\n🃏 ใส่ในเด็คได้สูงสุด: ${maxCopy} ใบ`;
  }

  document.getElementById('detail-card-stats').style.whiteSpace = 'pre-line';
  document.getElementById('detail-card-stats').textContent = statsText;
  document.getElementById('detail-card-desc').textContent = getCardDescription(card);
  detailModal.style.display = 'flex';
}

function ensureZoneUIAndViewers() {
  if (!document.getElementById('zone-viewer-modal')) {
    const viewerModal = document.createElement('div');
    viewerModal.id = 'zone-viewer-modal';
    viewerModal.className = 'modal-overlay';
    viewerModal.style.display = 'none';
    viewerModal.style.zIndex = '200';
    viewerModal.innerHTML = `
      <div class="modal-box" style="max-width: 820px; max-height: 88vh; overflow-y: auto;">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #334155; padding-bottom: 10px; margin-bottom: 8px;">
          <h2 id="zone-viewer-title" style="color: #fbbf24; font-size: 16px;">รายการการ์ด</h2>
          <button class="btn" id="btn-close-zone-viewer" style="background: #dc2626; padding: 6px 12px;">✖ ปิด</button>
        </div>
        <p style="font-size: 12px; color: #38bdf8; margin-bottom: 12px;">💡 แตะที่การ์ดใบใดก็ได้เพื่อเปิดดูรูปใหญ่และรายละเอียดความสามารถ</p>
        <p id="zone-viewer-empty" style="color: #94a3b8; margin: 20px 0; display: none;">ไม่มีการ์ดในโซนนี้</p>
        <div id="zone-viewer-list" style="display: flex; flex-wrap: wrap; justify-content: center; gap: 10px; margin-bottom: 10px;"></div>
      </div>
    `;
    document.body.appendChild(viewerModal);
    document.getElementById('btn-close-zone-viewer').onclick = () => {
      viewerModal.style.display = 'none';
    };
  }

  const logToggle = document.getElementById('action-log-toggle');
  const logContainer = document.getElementById('action-log-container');
  const logIndicator = document.getElementById('log-expand-indicator');
  if (logToggle && logContainer && !logToggle.dataset.bound) {
    logToggle.dataset.bound = 'true';
    logToggle.onclick = (e) => {
      e.stopPropagation();
      const isExpanded = logContainer.classList.toggle('expanded');
      if (logIndicator) {
        logIndicator.textContent = isExpanded ? '▼ ปิด' : '▲ ประวัติ';
      }
    };
    document.addEventListener('click', (e) => {
      if (logContainer.classList.contains('expanded') && !logContainer.contains(e.target)) {
        logContainer.classList.remove('expanded');
        if (logIndicator) logIndicator.textContent = '▲ ประวัติ';
      }
    });
  }

  const aiGraveCountEl = document.getElementById('ai-grave-count');
  if (aiGraveCountEl) {
    const aiGraveBox = aiGraveCountEl.parentElement;
    aiGraveBox.style.cursor = 'pointer';
    aiGraveBox.title = 'แตะเพื่อดูการ์ดในนรกของฝ่ายตรงข้าม';
    aiGraveBox.onclick = () => openZoneViewerModal('🪦 กองนรกของฝ่ายตรงข้าม (Graveyard)', gameState.ai.graveyard, gameState.ai);

    const aiPileGroup = aiGraveBox.parentElement;
    if (aiPileGroup && !document.getElementById('ai-dark-box')) {
      const darkBox = document.createElement('div');
      darkBox.id = 'ai-dark-box';
      darkBox.className = 'info-box dark-box';
      darkBox.style.cursor = 'pointer';
      darkBox.title = 'แตะเพื่อดูการ์ดในมิติมืดของฝ่ายตรงข้าม';
      darkBox.innerHTML = `<div class="pile-label">🌌 มิติมืด</div><h2 id="ai-dark-count">0</h2><div class="pile-sub-hint">(คลิกดู)</div>`;
      darkBox.onclick = () => openZoneViewerModal('🌌 มิติมืดของฝ่ายตรงข้าม (Dark Dimension)', gameState.ai.darkDimension, gameState.ai);
      aiPileGroup.appendChild(darkBox);
    }
  }

  const playerGraveCountEl = document.getElementById('player-grave-count');
  if (playerGraveCountEl) {
    const playerGraveBox = playerGraveCountEl.parentElement;
    playerGraveBox.style.cursor = 'pointer';
    playerGraveBox.title = 'แตะเพื่อดูการ์ดในนรกของคุณ';
    playerGraveBox.onclick = () => openZoneViewerModal('🪦 กองนรกของคุณ (Graveyard)', gameState.player.graveyard, gameState.player);

    const playerPileGroup = playerGraveBox.parentElement;
    if (playerPileGroup && !document.getElementById('player-dark-box')) {
      const darkBox = document.createElement('div');
      darkBox.id = 'player-dark-box';
      darkBox.className = 'info-box dark-box';
      darkBox.style.cursor = 'pointer';
      darkBox.title = 'แตะเพื่อดูการ์ดในมิติมืดของคุณ';
      darkBox.innerHTML = `<div class="pile-label">🌌 มิติมืด</div><h2 id="player-dark-count">0</h2><div class="pile-sub-hint">(คลิกดู)</div>`;
      darkBox.onclick = () => openZoneViewerModal('🌌 มิติมืดของคุณ (Dark Dimension)', gameState.player.darkDimension, gameState.player);
      playerPileGroup.appendChild(darkBox);
    }
  }
}

function openZoneViewerModal(titleText, cardArray, ownerContestant) {
  ensureZoneUIAndViewers();
  const modal = document.getElementById('zone-viewer-modal');
  const titleEl = document.getElementById('zone-viewer-title');
  const emptyEl = document.getElementById('zone-viewer-empty');
  const listEl = document.getElementById('zone-viewer-list');

  titleEl.textContent = `${titleText} (${cardArray.length} ใบ)`;
  listEl.innerHTML = '';

  if (!cardArray || cardArray.length === 0) {
    emptyEl.style.display = 'block';
  } else {
    emptyEl.style.display = 'none';
    cardArray.forEach(card => {
      const cardEl = createCardElement(card, ownerContestant);
      cardEl.style.cursor = 'pointer';
      cardEl.title = 'คลิกเพื่อดูรายละเอียดของการ์ดใบนี้';
      cardEl.addEventListener('click', () => {
        openCardDetailModal(card, ownerContestant);
      });
      listEl.appendChild(cardEl);
    });
  }

  modal.style.display = 'flex';
}


/* ============================================================================
   หมวดที่ 4: ระบบประมวลผลความสามารถแบบบล็อก (MODULAR CARD EFFECT ENGINE)
   รองรับการตรวจเงื่อนไข, การจ่าย Cost, การเลือกเป้าหมาย และการต่อหลายบล็อกในการ์ดใบเดียว
   ============================================================================ */
const EffectEngine = {
  // 1. ตรวจสอบเงื่อนไขและคอสต์ก่อนเริ่มใช้งานความสามารถ
  canActivateEffect(effectDef, context) {
    const { caster, opponent, sourceCard } = context;

    if (effectDef.oncePerTurn && sourceCard) {
      if (sourceCard.type === 'Leader' && sourceCard.abilityUsedThisTurn) {
        return { ok: false, reason: `${sourceCard.name} ใช้ความสามารถไปแล้วในเทิร์นนี้!` };
      }
      if (sourceCard.usedSkills && sourceCard.usedSkills[effectDef.id]) {
        return { ok: false, reason: `"${sourceCard.name}" ใช้ความสามารถนี้ไปแล้วในเทิร์นนี้!` };
      }
    }

    // ตรวจสอบ Condition
    if (effectDef.condition) {
      const cond = effectDef.condition;
      if (cond.type === 'ALLY_ON_BOARD' && !caster.board.some(m => m !== null && m.id === cond.cardId)) {
        const partnerTemplate = CARD_DATABASE.find(c => c.id === cond.cardId);
        return { ok: false, reason: `ต้องมี "${partnerTemplate ? partnerTemplate.name : cond.cardId}" อยู่บนสนามฝั่งเรา!` };
      }
    }

    // ตรวจสอบ Costs
    if (Array.isArray(effectDef.costs)) {
      for (const cost of effectDef.costs) {
        if (cost.type === 'DISCARD_HAND') {
          const availableHand = caster.hand.filter((_, idx) => idx !== context.excludeHandIndex);
          if (availableHand.length < (cost.count || 1)) {
            return { ok: false, reason: `ต้องมีการ์ดใบอื่นบนมืออย่างน้อย ${cost.count || 1} ใบเพื่อใช้ทิ้ง!` };
          }
        }
        if (cost.type === 'REST_ALLY') {
          const standAllies = caster.board.filter(m => m !== null && m.state === 'Stand');
          if (standAllies.length < (cost.count || 1)) {
            return { ok: false, reason: `ต้องมียูนิทฝั่งเราที่อยู่ในสถานะ Stand อย่างน้อย ${cost.count || 1} ใบ!` };
          }
        }
        if (cost.type === 'REST_SELF') {
          if (!sourceCard || sourceCard.state !== 'Stand') {
            return { ok: false, reason: `"${sourceCard ? sourceCard.name : 'ยูนิต'}" ต้องอยู่ในสถานะ Stand!` };
          }
        }
        if (cost.type === 'REDUCE_SELF_POWER') {
          if (!sourceCard || getEffectivePower(sourceCard, caster) < (cost.amount || 1)) {
            return { ok: false, reason: `พลังของ "${sourceCard.name}" น้อยกว่า ${cost.amount} จึงไม่สามารถลดพลังเพื่อใช้สกิลได้!` };
          }
        }
      }
    }

    // ตรวจสอบความพร้อมของเป้าหมายในบล็อกหลัก (สำหรับการ์ดเวทมนตร์และสกิลกดใช้)
    if (effectDef.trigger === 'CAST_SPELL' || effectDef.trigger === 'ACTIVATE_MAIN' || effectDef.trigger === 'ACTIVATE_LEADER') {
      for (const step of (effectDef.steps || [])) {
        if (step.block === 'DESTROY_UNIT' && step.target === 'OPPONENT' && !opponent.board.some(m => m !== null)) {
          return { ok: false, reason: 'ฝ่ายตรงข้ามไม่มีมอนสเตอร์บนสนามให้ทำลาย!' };
        }
        if (step.block === 'REDUCE_POWER' && step.target === 'ALL_ENEMIES' && !opponent.board.some(m => m !== null)) {
          return { ok: false, reason: 'ฝ่ายตรงข้ามไม่มีมอนสเตอร์บนสนาม!' };
        }
        if (step.block === 'BOUNCE_UNIT' && step.target === 'OPPONENT' && !opponent.board.some(m => m !== null)) {
          return { ok: false, reason: 'ฝ่ายตรงข้ามไม่มีมอนสเตอร์บนสนามให้ส่งกลับขึ้นมือ!' };
        }
        if (step.block === 'ADD_POWER' && step.target === 'ALLY' && effectDef.trigger === 'ACTIVATE_LEADER' && !caster.board.some(m => m !== null)) {
          return { ok: false, reason: 'ไม่มีมอนสเตอร์บนสนามฝั่งเราให้เพิ่มพลัง!' };
        }
        if (step.block === 'RECOVER_FROM_GRAVE') {
          const matches = this.filterCards(caster.graveyard, step);
          if (matches.length === 0) return { ok: false, reason: 'ไม่มีการ์ดที่ตรงเงื่อนไขอยู่ในกองนรก!' };
        }
        if (step.block === 'SEARCH_DECK_OR_GRAVE') {
          const inDeck = this.filterCards(caster.deck, step).length > 0;
          const inGrave = this.filterCards(caster.graveyard, step).length > 0;
          if (!inDeck && !inGrave) return { ok: false, reason: 'ไม่มีการ์ดเป้าหมายอยู่ในกองการ์ดหรือกองนรกเลย!' };
        }
        if (step.block === 'MILL_DECK' && step.side === 'OPPONENT' && opponent.deck.length === 0) {
          return { ok: false, reason: 'กองการ์ดของฝ่ายตรงข้ามหมดแล้ว!' };
        }
        if (step.block === 'CARPET_BOMB_COMPOSITE') {
          const hasSoldier = caster.board.some(m => m !== null && (m.id === 'NM02' || m.id === 'NM03' || m.id === 'NM04'));
          if (!hasSoldier) return { ok: false, reason: 'ไม่มี ทหารเกณฑ์เหนือ, ทหารพรานเหนือ หรือ ทหารหลวงเหนือ บนสนามของคุณเลย!' };
        }
      }
    }

    return { ok: true };
  },

  filterCards(cardArray, filterSpec) {
    if (!Array.isArray(cardArray)) return [];
    return cardArray.filter(c => {
      if (!c) return false;
      if (filterSpec.cardId && c.id !== filterSpec.cardId) return false;
      if (filterSpec.filterTribe && !hasCardTribe(c, filterSpec.filterTribe)) return false;
      if (filterSpec.filterType === 'SPELL' && c.type !== 'NormalSpell' && c.type !== 'ReactionSpell') return false;
      if (filterSpec.filterType === 'MONSTER' && c.type !== 'Monster') return false;
      return true;
    });
  },

  // 2. เรียกใช้เอฟเฟกต์ทั้งหมดของการ์ดที่ตรงกับ Trigger (เช่น ON_SUMMON, ON_DESTROY)
  triggerCardEffects(card, triggerType, context, onAllDone = null) {
    if (!card || !Array.isArray(card.effects)) {
      if (onAllDone) onAllDone();
      return false;
    }
    const matchingEffects = card.effects.filter(e => e.trigger === triggerType);
    if (matchingEffects.length === 0) {
      if (onAllDone) onAllDone();
      return false;
    }

    let idx = 0;
    const runNextEffect = () => {
      if (idx >= matchingEffects.length) {
        if (onAllDone) onAllDone();
        return;
      }
      const eff = matchingEffects[idx++];
      this.activateSpecificEffect(eff, { ...context, sourceCard: card }, runNextEffect);
    };
    runNextEffect();
    return true;
  },

  // 3. เริ่มต้นรัน Effect 1 ชุด (จ่าย Cost ตามลำดับ -> รัน Steps ตามลำดับ)
  activateSpecificEffect(effectDef, context, onComplete = null) {
    const costQueue = Array.isArray(effectDef.costs) ? [...effectDef.costs] : [];
    const stepQueue = Array.isArray(effectDef.steps) ? [...effectDef.steps] : [];

    const markSkillUsedAndRunSteps = () => {
      const { caster, sourceCard, spellHandIndex } = context;
      if (effectDef.oncePerTurn && sourceCard) {
        if (sourceCard.type === 'Leader') sourceCard.abilityUsedThisTurn = true;
        else if (sourceCard.usedSkills) sourceCard.usedSkills[effectDef.id] = true;
      }

      // หากเป็นการร่ายการ์ดเวทมนตร์จากมือ ให้นำการ์ดเวทออกจากมือลงนรกเมื่อจ่าย Cost เสร็จ
      if (effectDef.trigger === 'CAST_SPELL' && spellHandIndex !== undefined && spellHandIndex !== null) {
        const currentSpellIdx = caster.hand.findIndex(c => c.uid === sourceCard.uid);
        if (currentSpellIdx !== -1) {
          const usedSpell = caster.hand.splice(currentSpellIdx, 1)[0];
          caster.spellQuota.normalUsed += 1;
          resetCardStateForZoneChange(usedSpell);
          caster.graveyard.push(usedSpell);
        }
      }

      this.runStepQueue(stepQueue, context, () => {
        renderGame();
        if (onComplete) onComplete();
      });
    };

    this.runCostQueue(costQueue, context, markSkillUsedAndRunSteps);
  },

  // 4. ประมวลผลคิวการจ่าย Cost
  runCostQueue(costQueue, context, onCostsPaid) {
    if (!costQueue || costQueue.length === 0) {
      onCostsPaid();
      return;
    }
    const cost = costQueue.shift();
    const { caster, opponent, sourceCard, isAI } = context;

    if (cost.type === 'REST_SELF') {
      if (sourceCard) sourceCard.state = 'Rest';
      this.runCostQueue(costQueue, context, onCostsPaid);
      return;
    }

    if (cost.type === 'REDUCE_SELF_POWER') {
      if (sourceCard) sourceCard.permPowerMod -= (cost.amount || 1);
      this.runCostQueue(costQueue, context, onCostsPaid);
      return;
    }

    if (cost.type === 'DISCARD_HAND') {
      const count = cost.count || 1;
      if (isAI) {
        for (let i = 0; i < count && caster.hand.length > 0; i++) {
          const d = caster.hand.pop();
          resetCardStateForZoneChange(d);
          caster.graveyard.push(d);
          if (cost.triggerDiscardSkill && d.id === 'DM05' && opponent.hand.length > 0) {
            const oppD = opponent.hand.pop();
            resetCardStateForZoneChange(oppD);
            opponent.graveyard.push(oppD);
          }
        }
        this.runCostQueue(costQueue, context, onCostsPaid);
        return;
      }

      gameState.pendingAction = {
        type: 'MODULAR_SELECT_TARGET',
        targetZone: 'PLAYER_HAND',
        remainingCount: count,
        excludeHandUid: sourceCard ? sourceCard.uid : null,
        promptText: `👉 [${sourceCard ? sourceCard.name : 'จ่าย Cost'}] คลิกเลือกการ์ดบนมือของคุณ ${count} ใบเพื่อทิ้งลงนรก`,
        onSelectHand: (handIdx) => {
          const discarded = caster.hand.splice(handIdx, 1)[0];
          resetCardStateForZoneChange(discarded);
          caster.graveyard.push(discarded);
          setLog(`🗑️ ทิ้ง "${discarded.name}" จากมือลงนรก`);

          if (cost.triggerDiscardSkill && discarded.id === 'DM05' && opponent.hand.length > 0) {
            const aiDiscarded = opponent.hand.pop();
            resetCardStateForZoneChange(aiDiscarded);
            opponent.graveyard.push(aiDiscarded);
            setLog(`🍬 [ออโต้ซึรุรุ] ถูกทิ้งจากสกิลโอนามิ -> ฝ่ายตรงข้ามต้องทิ้ง "${aiDiscarded.name}" 1 ใบ!`);
          }
        },
        onAllSelected: () => this.runCostQueue(costQueue, context, onCostsPaid)
      };
      setLog(gameState.pendingAction.promptText);
      renderGame();
      return;
    }

    if (cost.type === 'REST_ALLY') {
      const count = cost.count || 1;
      if (isAI) {
        let rested = 0;
        caster.board.forEach(m => {
          if (m && m.state === 'Stand' && rested < count) {
            m.state = 'Rest';
            rested++;
          }
        });
        this.runCostQueue(costQueue, context, onCostsPaid);
        return;
      }

      const selectedSlots = [];
      gameState.pendingAction = {
        type: 'MODULAR_SELECT_TARGET',
        targetZone: 'PLAYER_BOARD',
        requireStand: true,
        remainingCount: count,
        selectedSlots,
        promptText: `👉 [${sourceCard ? sourceCard.name : 'จ่าย Cost'}] คลิกเลือกยูนิทฝ่ายเราที่ Stand อยู่ (${count} ใบ) เพื่อเปลี่ยนเป็น Rest`,
        onSelectSlot: (slotIdx) => {
          const unit = caster.board[slotIdx];
          if (!unit || unit.state !== 'Stand' || selectedSlots.includes(slotIdx)) return false;
          selectedSlots.push(slotIdx);
          unit.state = 'Rest';
          return true;
        },
        onAllSelected: () => this.runCostQueue(costQueue, context, onCostsPaid)
      };
      setLog(gameState.pendingAction.promptText);
      renderGame();
      return;
    }

    this.runCostQueue(costQueue, context, onCostsPaid);
  },

  // 5. ประมวลผลคิวบล็อกความสามารถทีละลำดับ (Sequential Step Pipeline)
  runStepQueue(stepQueue, context, onAllStepsComplete) {
    if (!stepQueue || stepQueue.length === 0) {
      onAllStepsComplete();
      return;
    }
    const step = stepQueue.shift();
    this.executeSingleStep(step, context, () => {
      this.runStepQueue(stepQueue, context, onAllStepsComplete);
    });
  },

  executeSingleStep(step, context, next) {
    const { caster, opponent, sourceCard, isAI } = context;
    const cardTitle = sourceCard ? `[${sourceCard.name}]` : '[เอฟเฟกต์]';

    switch (step.block) {
      // --- บล็อกที่ 1: จั่วการ์ด (DRAW) ---
      case 'DRAW': {
        const targetSide = step.side === 'OPPONENT' ? opponent : caster;
        let count = step.count || 1;
        if (step.bonusIfGraveAtLeast && caster.graveyard.length >= step.bonusIfGraveAtLeast) {
          count = step.bonusCount || count;
        }
        drawCards(targetSide, count);
        setLog(`✨ ${cardTitle} ${targetSide.name} จั่วการ์ด ${count} ใบ!`);
        next();
        return;
      }

      // --- บล็อกที่ 2: ฟื้นฟู/ทำดาเมจใส่ Leader ---
      case 'HEAL_LEADER': {
        const targetSide = step.side === 'OPPONENT' ? opponent : caster;
        const oldHp = targetSide.leader.hp;
        targetSide.leader.hp = Math.min(targetSide.leader.maxHp, targetSide.leader.hp + (step.amount || 1));
        setLog(`✨ ${cardTitle} ฟื้นฟู HP ลีดเดอร์ (${oldHp} -> ${targetSide.leader.hp}/${targetSide.leader.maxHp})!`);
        next();
        return;
      }

      case 'DAMAGE_LEADER': {
        const targetSide = step.side === 'OPPONENT' ? opponent : caster;
        targetSide.leader.hp = Math.max(0, targetSide.leader.hp - (step.amount || 1));
        setLog(`💥 ${cardTitle} ทำดาเมจใส่ Leader ของ ${targetSide.name} ${step.amount || 1} หน่วย!`);
        checkGameOver();
        next();
        return;
      }

      // --- บล็อกที่ 3: โม่กองการ์ด (MILL_DECK) ---
      case 'MILL_DECK': {
        const targetSide = step.side === 'OPPONENT' ? opponent : caster;
        const count = step.count || 1;
        const milledNames = [];
        for (let i = 0; i < count && targetSide.deck.length > 0; i++) {
          const milled = targetSide.deck.pop();
          resetCardStateForZoneChange(milled);
          targetSide.graveyard.push(milled);
          milledNames.push(milled.name);
        }
        if (milledNames.length > 0) {
          setLog(`❄️ ${cardTitle} ส่ง "${milledNames.join(', ')}" ใบบนสุดของกอง ${targetSide.name} ลงนรก!`);
        }
        next();
        return;
      }

      // --- บล็อกที่ 4: ทำลายการ์ดยูนิต (DESTROY_UNIT) ---
      case 'DESTROY_UNIT': {
        const targetBoardOwner = step.target === 'SELF' ? caster : opponent;
        const isEnemyEffect = (targetBoardOwner !== caster);

        if (step.select === 'ALL') {
          for (let i = 0; i < 3; i++) {
            if (targetBoardOwner.board[i]) destroyBoardMonster(targetBoardOwner, i, false, isEnemyEffect);
          }
          setLog(`💥 ${cardTitle} ทำลายยูนิตบนสนามของ ${targetBoardOwner.name}!`);
          next();
          return;
        }

        const validSlots = targetBoardOwner.board
          .map((m, idx) => (m !== null ? idx : null))
          .filter(idx => idx !== null);

        if (validSlots.length === 0) {
          setLog(`ℹ️ ${cardTitle} ไม่มีมอนสเตอร์เป้าหมายบนสนามให้ทำลาย`);
          next();
          return;
        }

        const count = Math.min(step.count || 1, validSlots.length);
        if (isAI) {
          for (let k = 0; k < count; k++) {
            let bestSlot = -1;
            let maxPwr = -1;
            targetBoardOwner.board.forEach((m, idx) => {
              if (m && m.id !== 'NM05' && !m.immuneToEnemyEffectsUntilEndOfTurn && getEffectivePower(m, targetBoardOwner) > maxPwr) {
                maxPwr = getEffectivePower(m, targetBoardOwner);
                bestSlot = idx;
              }
            });
            if (bestSlot !== -1) destroyBoardMonster(targetBoardOwner, bestSlot, false, isEnemyEffect);
          }
          next();
          return;
        }

        gameState.pendingAction = {
          type: 'MODULAR_SELECT_TARGET',
          targetZone: targetBoardOwner === gameState.player ? 'PLAYER_BOARD' : 'OPPONENT_BOARD',
          remainingCount: count,
          promptText: `💥 ${cardTitle} คลิกเลือกยูนิทของ ${targetBoardOwner.name} บนสนามเพื่อทำลาย (${count} ใบ)!`,
          onSelectSlot: (slotIdx) => {
            const targetMonster = targetBoardOwner.board[slotIdx];
            if (!targetMonster) {
              setLog('⚠️ กรุณาคลิกเลือกช่องที่มีมอนสเตอร์อยู่!');
              return false;
            }
            destroyBoardMonster(targetBoardOwner, slotIdx, false, isEnemyEffect);
            setLog(`💥 ${cardTitle} สั่งทำลาย "${targetMonster.name}" สำเร็จ!`);
            return true;
          },
          onAllSelected: () => next()
        };
        setLog(gameState.pendingAction.promptText);
        renderGame();
        return;
      }

      // --- บล็อกที่ 5: เพิ่มพลังโจมตี (ADD_POWER) ---
      case 'ADD_POWER': {
        const amount = step.amount || 1;
        const prop = step.duration === 'TURN' ? 'tempPowerMod' : 'permPowerMod';
        const durLabel = step.duration === 'TURN' ? 'จนจบเทิร์น' : 'ถาวร';

        if (step.target === 'SELF_UNIT') {
          if (sourceCard) {
            sourceCard[prop] = (sourceCard[prop] || 0) + amount;
            setLog(`🔥 ${cardTitle} เพิ่มพลังโจมตี +${amount} (${durLabel})!`);
          }
          next();
          return;
        }

        if (step.target === 'ALL_ALLIES') {
          caster.board.forEach(m => {
            if (m && (!step.filterTribe || hasCardTribe(m, step.filterTribe))) {
              m[prop] = (m[prop] || 0) + amount;
            }
          });
          setLog(`✨ ${cardTitle} เพิ่มพลังโจมตีให้ยูนิทฝั่งเรา +${amount} (${durLabel})!`);
          next();
          return;
        }

        // กรณีเลือกเป้าหมายฝั่งเรา (ALLY)
        const hasAlly = caster.board.some(m => m !== null);
        if (!hasAlly) {
          setLog(`ℹ️ ${cardTitle} ไม่มีมอนสเตอร์บนสนามฝั่งเราให้เพิ่มพลัง`);
          next();
          return;
        }

        const count = step.count || 1;
        if (isAI) {
          const ally = caster.board.find(m => m !== null && m.id !== 'NM05');
          if (ally) ally[prop] = (ally[prop] || 0) + amount;
          next();
          return;
        }

        gameState.pendingAction = {
          type: 'MODULAR_SELECT_TARGET',
          targetZone: 'PLAYER_BOARD',
          remainingCount: count,
          promptText: `✨ ${cardTitle} คลิกเลือกยูนิทฝั่งเรา (${count} ใบ) เพื่อเพิ่มพลังโจมตี +${amount} (${durLabel})!`,
          onSelectSlot: (slotIdx) => {
            const ally = caster.board[slotIdx];
            if (!ally) {
              setLog('⚠️ กรุณาคลิกช่องที่มียูนิทฝั่งเราอยู่!');
              return false;
            }
            ally[prop] = (ally[prop] || 0) + amount;
            setLog(`✨ ${cardTitle} เพิ่มพลังโจมตีให้ "${ally.name}" +${amount} (เป็น ${getEffectivePower(ally, caster)})!`);
            return true;
          },
          onAllSelected: () => next()
        };
        setLog(gameState.pendingAction.promptText);
        renderGame();
        return;
      }

      // --- บล็อกที่ 6: ลดพลังโจมตี (REDUCE_POWER) ---
      case 'REDUCE_POWER': {
        const amount = step.amount || 1;
        const prop = step.duration === 'TURN' ? 'tempPowerMod' : 'permPowerMod';
        const durLabel = step.duration === 'TURN' ? 'จนจบเทิร์น' : '';

        if (step.target === 'ALL_ENEMIES') {
          opponent.board.forEach(m => {
            if (m && !m.immuneToEnemyEffectsUntilEndOfTurn) {
              m[prop] = (m[prop] || 0) - amount;
            }
          });
          setLog(`📉 ${cardTitle} ลดพลังโจมตีของยูนิทฝ่ายตรงข้ามทุกใบลง ${amount} หน่วย ${durLabel}!`.trim());
          next();
          return;
        }

        const hasEnemy = opponent.board.some(m => m !== null && !m.immuneToEnemyEffectsUntilEndOfTurn);
        if (!hasEnemy) {
          setLog(`ℹ️ ${cardTitle} ไม่มีมอนสเตอร์ฝ่ายตรงข้ามที่สามารถลดพลังได้`);
          next();
          return;
        }

        const count = step.count || 1;
        if (isAI) {
          const target = opponent.board.find(m => m !== null && m.id !== 'NM05' && !m.immuneToEnemyEffectsUntilEndOfTurn);
          if (target) target[prop] = (target[prop] || 0) - amount;
          next();
          return;
        }

        gameState.pendingAction = {
          type: 'MODULAR_SELECT_TARGET',
          targetZone: 'OPPONENT_BOARD',
          remainingCount: count,
          promptText: `📉 ${cardTitle} คลิกเลือกยูนิทฝ่ายตรงข้าม (${count} ใบ) เพื่อลดพลังโจมตี -${amount}!`,
          onSelectSlot: (slotIdx) => {
            const enemy = opponent.board[slotIdx];
            if (!enemy) {
              setLog('⚠️ กรุณาคลิกเลือกช่องที่มียูนิทฝ่ายตรงข้ามอยู่!');
              return false;
            }
            if (enemy.immuneToEnemyEffectsUntilEndOfTurn) {
              setLog(`🛡️ "${enemy.name}" ป้องกันความสามารถการ์ดฝ่ายตรงข้ามในเทิร์นนี้!`);
              return false;
            }
            enemy[prop] = (enemy[prop] || 0) - amount;
            setLog(`📉 ${cardTitle} ลดพลังโจมตีของ "${enemy.name}" ลง ${amount} หน่วย!`);
            return true;
          },
          onAllSelected: () => next()
        };
        setLog(gameState.pendingAction.promptText);
        renderGame();
        return;
      }

      // --- บล็อกที่ 7: เลือกบัฟฝั่งเรา หรือ ดีบัฟฝั่งตรงข้าม (FLEX_POWER เช่น ทหารพรานเหนือ) ---
      case 'FLEX_POWER': {
        const prop = step.duration === 'TURN' ? 'tempPowerMod' : 'permPowerMod';
        if (isAI) {
          const enemy = opponent.board.find(m => m !== null && m.id !== 'NM05' && !m.immuneToEnemyEffectsUntilEndOfTurn);
          if (enemy) enemy[prop] -= (step.minusAmount || 1);
          else if (sourceCard) sourceCard[prop] += (step.plusAmount || 1);
          next();
          return;
        }

        gameState.pendingAction = {
          type: 'MODULAR_SELECT_TARGET',
          targetZone: 'ANY_BOARD',
          remainingCount: 1,
          promptText: `🏹 ${cardTitle} คลิกเลือกยูนิท 1 ใบบนสนาม (คลิกยูนิทเราพลัง +${step.plusAmount || 1} / คลิกยูนิทอีกฝ่ายพลัง -${step.minusAmount || 1})`,
          onSelectAnyBoardSlot: (side, slotIdx) => {
            if (side === 'PLAYER') {
              const ally = caster.board[slotIdx];
              if (!ally) return false;
              ally[prop] += (step.plusAmount || 1);
              setLog(`🏹 ${cardTitle} เพิ่มพลังโจมตีให้ "${ally.name}" ฝั่งเรา +${step.plusAmount || 1}!`);
              return true;
            } else {
              const enemy = opponent.board[slotIdx];
              if (!enemy) return false;
              if (enemy.immuneToEnemyEffectsUntilEndOfTurn) {
                setLog(`🛡️ "${enemy.name}" ไม่ได้รับผลจากความสามารถของการ์ดฝ่ายตรงข้ามในเทิร์นนี้!`);
                return false;
              }
              enemy[prop] -= (step.minusAmount || 1);
              setLog(`🏹 ${cardTitle} ลดพลังโจมตีของ "${enemy.name}" ฝั่งตรงข้ามลง ${step.minusAmount || 1}!`);
              return true;
            }
          },
          onAllSelected: () => next()
        };
        setLog(gameState.pendingAction.promptText);
        renderGame();
        return;
      }

      // --- บล็อกที่ 8: ส่งยูนิตบนสนามกลับขึ้นมือ (BOUNCE_UNIT) ---
      case 'BOUNCE_UNIT': {
        const targetOwner = step.target === 'SELF' ? caster : opponent;
        const validSlots = targetOwner.board
          .map((m, idx) => (m !== null && !m.immuneToEnemyEffectsUntilEndOfTurn ? idx : null))
          .filter(idx => idx !== null);

        if (validSlots.length === 0) {
          setLog(`ℹ️ ${cardTitle} ไม่มียูนิตเป้าหมายที่สามารถส่งกลับขึ้นมือได้`);
          next();
          return;
        }

        if (isAI) {
          const slotIdx = validSlots[0];
          const bounced = targetOwner.board[slotIdx];
          targetOwner.board[slotIdx] = null;
          resetCardStateForZoneChange(bounced);
          targetOwner.hand.push(bounced);
          next();
          return;
        }

        gameState.pendingAction = {
          type: 'MODULAR_SELECT_TARGET',
          targetZone: targetOwner === gameState.player ? 'PLAYER_BOARD' : 'OPPONENT_BOARD',
          remainingCount: step.count || 1,
          promptText: `🌪️ ${cardTitle} คลิกเลือกยูนิทของ ${targetOwner.name} บนสนามเพื่อส่งกลับขึ้นมือ!`,
          onSelectSlot: (slotIdx) => {
            const targetMonster = targetOwner.board[slotIdx];
            if (!targetMonster) return false;
            if (targetOwner !== caster && targetMonster.immuneToEnemyEffectsUntilEndOfTurn) {
              setLog(`🛡️ "${targetMonster.name}" ป้องกันความสามารถการ์ดฝ่ายตรงข้ามในเทิร์นนี้!`);
              return false;
            }
            targetOwner.board[slotIdx] = null;
            resetCardStateForZoneChange(targetMonster);
            targetOwner.hand.push(targetMonster);
            setLog(`🌪️ ${cardTitle} ส่ง "${targetMonster.name}" กลับขึ้นมือสำเร็จ!`);
            return true;
          },
          onAllSelected: () => next()
        };
        setLog(gameState.pendingAction.promptText);
        renderGame();
        return;
      }

      // --- บล็อกที่ 9: มอบสถานะพิเศษ / ทำลายเมื่อจบเทิร์น / กระตุ้นพาสซีฟเพื่อนร่วมทีม ---
      case 'GRANT_STATUS': {
        if (step.target === 'ALL_ALLIES') {
          caster.board.forEach(m => {
            if (m && step.status === 'INDESTRUCTIBLE') m.indestructibleUntilNextTurn = true;
            if (m && step.status === 'BURN_ON_KILL') m.burnLeaderOnKill = true;
          });
          next();
          return;
        }

        gameState.pendingAction = {
          type: 'MODULAR_SELECT_TARGET',
          targetZone: 'PLAYER_BOARD',
          remainingCount: step.count || 1,
          promptText: `🌟 ${cardTitle} คลิกเลือกยูนิทฝ่ายเรา 1 ใบบนสนามเพื่อรับความสามารถพิเศษ!`,
          onSelectSlot: (slotIdx) => {
            const ally = caster.board[slotIdx];
            if (!ally) return false;
            if (step.status === 'BURN_ON_KILL') ally.burnLeaderOnKill = true;
            if (step.status === 'INDESTRUCTIBLE') ally.indestructibleUntilNextTurn = true;
            setLog(`🌟 ${cardTitle} มอบความสามารถพิเศษให้ "${ally.name}" สำเร็จ!`);
            return true;
          },
          onAllSelected: () => next()
        };
        setLog(gameState.pendingAction.promptText);
        renderGame();
        return;
      }

      case 'MARK_END_TURN_DESTROY': {
        if (sourceCard) sourceCard.destroyAtEndOfTurn = true;
        next();
        return;
      }

      case 'TRIGGER_ALLY_PASSIVE': {
        let count = 0;
        caster.board.forEach(m => {
          if (m && m.id === step.allyId) {
            m.permPowerMod += (step.amount || 1);
            count++;
          }
        });
        if (count > 0) setLog(`🦅 สกิลออโต้ของยูนิตสนับสนุนทำงาน (+${step.amount || 1} Power)!`);
        next();
        return;
      }

      // --- บล็อกที่ 10: นำการ์ดจากนรกขึ้นมือ (RECOVER_FROM_GRAVE) ---
      case 'RECOVER_FROM_GRAVE': {
        const candidates = this.filterCards(caster.graveyard, step).filter(c => !sourceCard || c.uid !== sourceCard.uid);
        if (candidates.length === 0) {
          next();
          return;
        }

        if (isAI || step.autoPickFirst || candidates.length === 1) {
          const pickedTemplate = candidates[0];
          const gIdx = caster.graveyard.findIndex(c => c.uid === pickedTemplate.uid);
          if (gIdx !== -1) {
            const recovered = caster.graveyard.splice(gIdx, 1)[0];
            resetCardStateForZoneChange(recovered);
            caster.hand.push(recovered);
            setLog(`🪦 ${cardTitle} นำ "${recovered.name}" 1 ใบจากกองนรกขึ้นมือของ ${caster.name}!`);
          }
          next();
          return;
        }

        const uniqueMap = new Map();
        candidates.forEach(c => { if (!uniqueMap.has(c.id)) uniqueMap.set(c.id, c); });
        const options = Array.from(uniqueMap.values()).map(targetCard => ({
          label: `นำ "${targetCard.name}" ขึ้นมือ`,
          color: '#16a34a',
          onSelect: () => {
            const gIdx = caster.graveyard.findIndex(c => c.id === targetCard.id);
            if (gIdx !== -1) {
              const recovered = caster.graveyard.splice(gIdx, 1)[0];
              resetCardStateForZoneChange(recovered);
              caster.hand.push(recovered);
              setLog(`✨ ${cardTitle} นำ "${recovered.name}" 1 ใบจากกองนรกขึ้นมือสำเร็จ!`);
            }
            next();
          }
        }));
        showChoiceModal(`🪦 ${cardTitle}`, 'เลือกการ์ด 1 ใบจากกองนรกเพื่อนำกลับขึ้นมือ:', options);
        return;
      }

      // --- บล็อกที่ 11: ค้นหาการ์ดจากกองหรือนรก (SEARCH_DECK_OR_GRAVE) ---
      case 'SEARCH_DECK_OR_GRAVE': {
        const inGrave = this.filterCards(caster.graveyard, step);
        const inDeck = this.filterCards(caster.deck, step);

        const placeCardToDestination = (foundCard, fromZone) => {
          resetCardStateForZoneChange(foundCard);
          if (fromZone === 'deck') caster.deck = shuffleDeck(caster.deck);

          if (step.destination === 'HAND') {
            caster.hand.push(foundCard);
            setLog(`🦅 ${cardTitle} นำ "${foundCard.name}" จาก${fromZone === 'deck' ? 'กองการ์ด' : 'กองนรก'}ขึ้นมือเรียบร้อย!`);
            next();
            return;
          }

          if (step.destination === 'BOARD') {
            foundCard.state = 'Stand';
            if (step.grantImmunity) foundCard.immuneToEnemyEffectsUntilEndOfTurn = true;
            const emptySlot = caster.board.findIndex(m => m === null);
            if (emptySlot !== -1) {
              caster.board[emptySlot] = foundCard;
              setLog(`🌊 ${cardTitle} อัญเชิญ "${foundCard.name}" ลงสนามสำเร็จ!`);
              EffectEngine.triggerCardEffects(foundCard, 'ON_SUMMON', {
                caster, opponent, sourceCard: foundCard, sourceSlot: emptySlot, isAI
              }, next);
            } else {
              gameState.pendingAction = {
                type: 'CALL_FROM_EFFECT_SELECT_SLOT',
                cardToPlace: foundCard,
                onAfterPlace: next
              };
              setLog(`🌊 ${cardTitle} สนามเต็ม 3 ช่อง — คลิกเลือกช่องบนสนามของคุณเพื่อวาง "${foundCard.name}" ทับ!`);
              renderGame();
            }
          }
        };

        if (isAI) {
          if (inGrave.length > 0) {
            const idx = caster.graveyard.findIndex(c => c.uid === inGrave[0].uid);
            placeCardToDestination(caster.graveyard.splice(idx, 1)[0], 'grave');
          } else if (inDeck.length > 0) {
            const idx = caster.deck.findIndex(c => c.uid === inDeck[0].uid);
            placeCardToDestination(caster.deck.splice(idx, 1)[0], 'deck');
          } else {
            next();
          }
          return;
        }

        // ถ้าเป็นการค้นหาเพื่อลงสนามทันที (เช่น โอนามิ เรียก โรเซเลีย) ให้ดึงจากนรกหรือกองให้อัตโนมัติ
        if (step.destination === 'BOARD' && step.cardId) {
          if (inGrave.length > 0) {
            const idx = caster.graveyard.findIndex(c => c.id === step.cardId);
            placeCardToDestination(caster.graveyard.splice(idx, 1)[0], 'grave');
          } else if (inDeck.length > 0) {
            const idx = caster.deck.findIndex(c => c.id === step.cardId);
            placeCardToDestination(caster.deck.splice(idx, 1)[0], 'deck');
          } else {
            next();
          }
          return;
        }

        const options = [];
        if (inDeck.length > 0) {
          options.push({
            label: `ดึง "${inDeck[0].name}" จากกองการ์ด (พร้อมสับกอง)`,
            color: '#0284c7',
            onSelect: () => {
              const idx = caster.deck.findIndex(c => c.id === inDeck[0].id);
              if (idx !== -1) placeCardToDestination(caster.deck.splice(idx, 1)[0], 'deck');
              else next();
            }
          });
        }
        if (inGrave.length > 0) {
          options.push({
            label: `ดึง "${inGrave[0].name}" จากกองนรก`,
            color: '#7c3aed',
            onSelect: () => {
              const idx = caster.graveyard.findIndex(c => c.id === inGrave[0].id);
              if (idx !== -1) placeCardToDestination(caster.graveyard.splice(idx, 1)[0], 'grave');
              else next();
            }
          });
        }
        showChoiceModal(`🔍 ${cardTitle}`, 'เลือกโซนที่ต้องการค้นหาการ์ด:', options);
        return;
      }

      // --- บล็อกที่ 12: ระเบิดปูพรม (CARPET_BOMB_COMPOSITE) ---
      case 'CARPET_BOMB_COMPOSITE': {
        const conscriptCount = caster.board.filter(m => m !== null && m.id === 'NM04').length;
        const rangerCount = caster.board.filter(m => m !== null && m.id === 'NM03').length;
        const royalCount = caster.board.filter(m => m !== null && m.id === 'NM02').length;

        const dynamicSteps = [];
        if (conscriptCount > 0) {
          dynamicSteps.push({ block: 'ADD_POWER', target: 'ALL_ALLIES', filterTribe: 'เหนือ', amount: conscriptCount, duration: 'TURN' });
        }
        if (royalCount > 0) {
          dynamicSteps.push({ block: 'GRANT_STATUS', target: 'ALL_ALLIES', status: 'INDESTRUCTIBLE' });
        }
        if (rangerCount > 0 && opponent.board.some(m => m !== null)) {
          dynamicSteps.push({ block: 'DESTROY_UNIT', target: 'OPPONENT', count: rangerCount, select: 'CHOOSE' });
        }
        this.runStepQueue(dynamicSteps, context, next);
        return;
      }

      default:
        next();
    }
  }
};


/* ============================================================================
   หมวดที่ 5: ความสามารถของ Leader, Monster และการร่าย Spell (เชื่อมเข้ากับ EffectEngine)
   ============================================================================ */
function activateLeaderSkillPlayer() {
  const player = gameState.player;
  if (gameState.gameOver || gameState.activeTurn !== 'player') return;
  if (gameState.pendingAction) {
    setLog('⚠️ กรุณาเลือกเป้าหมายของเอฟเฟกต์ที่ค้างอยู่ให้เสร็จก่อน!');
    return;
  }

  const leaderEffects = (player.leader.effects || []).filter(e => e.trigger === 'ACTIVATE_LEADER');
  if (leaderEffects.length === 0) {
    openCardDetailModal(player.leader, player);
    return;
  }

  if (gameState.phase !== 'Main Phase') {
    setLog(`⚠️ สกิลลีดเดอร์ ${player.leader.name} กดใช้ได้ใน Main Phase เท่านั้น!`);
    return;
  }

  const eff = leaderEffects[0];
  const ctx = { caster: player, opponent: gameState.ai, sourceCard: player.leader, isAI: false };
  const check = EffectEngine.canActivateEffect(eff, ctx);
  if (!check.ok) {
    setLog(`❌ ${check.reason}`);
    return;
  }

  askCardUseConfirmation(player.leader, 'ใช้สกิลลีดเดอร์', () => {
    gameState.selectedHandIndex = null;
    gameState.selectedAttackerSlot = null;
    EffectEngine.activateSpecificEffect(eff, ctx);
  });
}

// สั่งใช้งานความสามารถของ Monster บนสนาม (อ่านจากบล็อก ACTIVATE_MAIN ของการ์ดโดยตรง)
function activateMonsterOnBoardPlayer(slotIndex) {
  const player = gameState.player;
  const monster = player.board[slotIndex];
  if (!monster) return;

  const mainEffects = (monster.effects || []).filter(e => e.trigger === 'ACTIVATE_MAIN');
  if (mainEffects.length === 0) {
    openCardDetailModal(monster, player);
    setLog(`ℹ️ "${monster.name}" ไม่มีสกิลกดใช้บนสนาม (หากต้องการสั่งโจมตี ให้กดปุ่ม "⚔️ เฟสถัดไป (Battle Phase)" ด้านขวา)`);
    return;
  }

  const ctx = { caster: player, opponent: gameState.ai, sourceCard: monster, sourceSlot: slotIndex, isAI: false };

  // กรณีมี 1 สกิลกดใช้บนสนาม
  if (mainEffects.length === 1) {
    const eff = mainEffects[0];
    const check = EffectEngine.canActivateEffect(eff, ctx);
    if (!check.ok) {
      setLog(`⚠️ ${check.reason}`);
      return;
    }
    askCardUseConfirmation(monster, eff.label || `ใช้ความสามารถของ "${monster.name}"`, () => {
      EffectEngine.activateSpecificEffect(eff, ctx);
    });
    return;
  }

  // กรณีมีหลายสกิลกดใช้ในใบเดียว (เช่น โทโดโรจิต M02)
  const options = mainEffects.map((eff, idx) => {
    const check = EffectEngine.canActivateEffect(eff, ctx);
    const used = monster.usedSkills && monster.usedSkills[eff.id];
    const statusSuffix = used ? ' (ใช้แล้ว)' : (!check.ok ? ' (เงื่อนไขไม่ครบ)' : '');
    return {
      label: `${eff.label || `สกิลที่ ${idx + 1}`}${statusSuffix}`,
      disabled: !check.ok,
      color: idx === 0 ? '#0284c7' : '#16a34a',
      onSelect: () => EffectEngine.activateSpecificEffect(eff, ctx)
    };
  });

  options.push({ label: '🔍 ดูรายละเอียดการ์ดใบนี้', color: '#6366f1', onSelect: () => openCardDetailModal(monster, player) });
  options.push({ label: '❌ ยกเลิก', color: '#475569', onSelect: () => renderGame() });

  showChoiceModal(`⚡ เลือกใช้ความสามารถของ ${monster.name}`, 'แต่ละความสามารถสั่งใช้ได้ตามเงื่อนไขที่ระบุ:', options);
}

// สั่งใช้งานการ์ดเวทมนตร์จากมือผ่าน EffectEngine
function initiatePlayerSpell(handIndex) {
  const player = gameState.player;
  const spell = player.hand[handIndex];
  if (!spell) return;

  if (spell.type === 'NormalSpell' && player.spellQuota.normalUsed >= 1) {
    setLog('❌ คุณใช้โควต้า Normal Spell (1 ใบ/เทิร์น) ไปแล้วในเทิร์นนี้!');
    return;
  }
  if (spell.type === 'ReactionSpell' && player.spellQuota.reactionUsed >= 1) {
    setLog('❌ คุณใช้โควต้า Reaction Spell (1 ใบ/เทิร์น) ไปแล้วในเทิร์นนี้!');
    return;
  }

  if (spell.id === 'DS02') {
    setLog('ℹ️ "พวกเราจะช่วยเอง" เป็นการ์ดป้องกันเมื่ออีกฝ่ายโจมตี (ระบบจะเด้งถามอัตโนมัติเมื่ออีกฝ่ายโจมตีและคุณมียูนิตในนรกครบ 5 ใบ)');
    return;
  }

  const spellEffect = (spell.effects || []).find(e => e.trigger === 'CAST_SPELL');
  if (!spellEffect) return;

  const ctx = {
    caster: player,
    opponent: gameState.ai,
    sourceCard: spell,
    spellHandIndex: handIndex,
    excludeHandIndex: handIndex,
    isAI: false
  };

  const check = EffectEngine.canActivateEffect(spellEffect, ctx);
  if (!check.ok) {
    setLog(`⚠️ ใช้ "${spell.name}" ไม่ได้: ${check.reason}`);
    return;
  }

  askCardUseConfirmation(spell, `ใช้งานการ์ดเวทมนตร์ "${spell.name}"`, () => {
    gameState.selectedHandIndex = null;
    EffectEngine.activateSpecificEffect(spellEffect, ctx);
  });
}

// ฟังก์ชันช่วยเหลือสำหรับ AI และความสามารถเฉพาะของเด็คเหนือ/วันสิ้นโลก
function triggerEndeSkill(contestant, slotIndex) {
  const ende = contestant.board[slotIndex];
  if (!ende) return;
  const eff = (ende.effects || []).find(e => e.id === 'endeBoost');
  const other = contestant === gameState.player ? gameState.ai : gameState.player;
  if (eff) {
    EffectEngine.activateSpecificEffect(eff, {
      caster: contestant,
      opponent: other,
      sourceCard: ende,
      sourceSlot: slotIndex,
      isAI: contestant !== gameState.player
    });
  }
}

function executeHawksSearch(contestant, slotIndex, sourceZone) {
  const hawks = contestant.board[slotIndex];
  if (!hawks) return;
  const zoneArr = sourceZone === 'deck' ? contestant.deck : contestant.graveyard;
  const idx = zoneArr.findIndex(c => c.id === 'M05');
  if (idx === -1) return;
  hawks.permPowerMod -= 2;
  hawks.usedSkills.hawksSearch = true;
  const found = zoneArr.splice(idx, 1)[0];
  resetCardStateForZoneChange(found);
  contestant.hand.push(found);
  if (sourceZone === 'deck') contestant.deck = shuffleDeck(contestant.deck);
  setLog(`🦅 [${contestant.name}] "ฮออ์กส์ฟีม" ลดพลัง -2 นำ "เอ็นเดจิต" ขึ้นมือเรียบร้อย!`);
  renderGame();
}

function triggerKhunNueaStartTurn(contestant) {
  if (!contestant.leader || contestant.leader.id !== 'L02') return;
  const inGraveIdx = contestant.graveyard.findIndex(c => c.id === 'NM01');
  const inDeckIdx = contestant.deck.findIndex(c => c.id === 'NM01');
  if (inGraveIdx === -1 && inDeckIdx === -1) return;

  if (contestant !== gameState.player) {
    if (inGraveIdx !== -1) {
      const card = contestant.graveyard.splice(inGraveIdx, 1)[0];
      resetCardStateForZoneChange(card);
      contestant.hand.push(card);
      setLog('👑 [AI ขุนเหนือ] นำ "ไพร่ชาวนาเหนือ" 1 ใบจากนรกขึ้นมือ!');
    } else if (inDeckIdx !== -1) {
      const card = contestant.deck.splice(inDeckIdx, 1)[0];
      resetCardStateForZoneChange(card);
      contestant.hand.push(card);
      contestant.deck = shuffleDeck(contestant.deck);
      setLog('👑 [AI ขุนเหนือ] นำ "ไพร่ชาวนาเหนือ" 1 ใบจากกองขึ้นมือ!');
    }
    renderGame();
    return;
  }

  showChoiceModal(
    '👑 ออโต้เมื่อเข้าเทิร์น: ขุนเหนือ',
    'คุณสามารถนำ "ไพร่ชาวนาเหนือ" จากกองการ์ดหรือนรกไม่เกิน 1 ใบขึ้นมือได้',
    [
      {
        label: `นำ "ไพร่ชาวนาเหนือ" จากกองนรกขึ้นมือ ${inGraveIdx === -1 ? '(ไม่มีในนรก)' : ''}`,
        disabled: inGraveIdx === -1,
        color: '#7c3aed',
        onSelect: () => {
          const card = contestant.graveyard.splice(inGraveIdx, 1)[0];
          resetCardStateForZoneChange(card);
          contestant.hand.push(card);
          setLog('👑 [ขุนเหนือ] นำ "ไพร่ชาวนาเหนือ" 1 ใบจากกองนรกขึ้นมือสำเร็จ!');
          renderGame();
        }
      },
      {
        label: `นำ "ไพร่ชาวนาเหนือ" จากกองการ์ดขึ้นมือ ${inDeckIdx === -1 ? '(ไม่มีในกอง)' : ''}`,
        disabled: inDeckIdx === -1,
        color: '#0284c7',
        onSelect: () => {
          const card = contestant.deck.splice(inDeckIdx, 1)[0];
          resetCardStateForZoneChange(card);
          contestant.hand.push(card);
          contestant.deck = shuffleDeck(contestant.deck);
          setLog('👑 [ขุนเหนือ] นำ "ไพร่ชาวนาเหนือ" 1 ใบจากกองการ์ดขึ้นมือสำเร็จ!');
          renderGame();
        }
      },
      { label: 'ไม่นำขึ้นมือ (ข้าม)', color: '#475569', onSelect: () => renderGame() }
    ]
  );
}

function triggerDoomsdayStartTurnQueue(contestant, onDoneCallback = null) {
  const finishQueue = () => {
    renderGame();
    if (onDoneCallback) onDoneCallback();
  };

  const checkDebirunStep = () => {
    const hasDebirun = contestant.board.some(m => m !== null && m.id === 'DM04');
    if (!hasDebirun) {
      finishQueue();
      return;
    }
    triggerDebirunStartTurn(contestant, finishQueue);
  };

  if (contestant.leader && contestant.leader.id === 'L03') {
    const validTargets = contestant.graveyard.filter(c =>
      c.type === 'Monster' && !c.cannotNormalSummon && !c.isSpy && (c.basePower !== undefined ? c.basePower : c.power) <= 2
    );

    if (validTargets.length > 0) {
      if (contestant !== gameState.player) {
        const emptySlot = contestant.board.findIndex(m => m === null);
        if (emptySlot !== -1) {
          const gIdx = contestant.graveyard.findIndex(c => c.uid === validTargets[0].uid);
          if (gIdx !== -1) {
            const called = contestant.graveyard.splice(gIdx, 1)[0];
            resetCardStateForZoneChange(called);
            contestant.board[emptySlot] = called;
            EffectEngine.triggerCardEffects(called, 'ON_SUMMON', {
              caster: contestant, opponent: gameState.player, sourceCard: called, sourceSlot: emptySlot, isAI: true
            });
            setLog(`⏳ [AI วันสิ้นโลก] คอล "${called.name}" จากนรกลงสนาม!`);
          }
        }
        checkDebirunStep();
        return;
      }

      const seenIds = new Set();
      const options = [];
      validTargets.forEach(c => {
        if (!seenIds.has(c.id)) {
          seenIds.add(c.id);
          options.push({
            label: `คอล "${c.name}" (Power ${c.power}) จากนรกลงสนาม`,
            color: '#7c3aed',
            onSelect: () => {
              const gIdx = contestant.graveyard.findIndex(g => g.id === c.id);
              if (gIdx !== -1) {
                const called = contestant.graveyard.splice(gIdx, 1)[0];
                resetCardStateForZoneChange(called);

                const emptySlot = contestant.board.findIndex(m => m === null);
                if (emptySlot !== -1) {
                  contestant.board[emptySlot] = called;
                  setLog(`⏳ [วันสิ้นโลก] คอล "${called.name}" จากนรกลงช่องที่ ${emptySlot + 1}!`);
                  EffectEngine.triggerCardEffects(called, 'ON_SUMMON', {
                    caster: contestant, opponent: gameState.ai, sourceCard: called, sourceSlot: emptySlot, isAI: false
                  }, checkDebirunStep);
                } else {
                  gameState.pendingAction = {
                    type: 'CALL_FROM_EFFECT_SELECT_SLOT',
                    cardToPlace: called,
                    onAfterPlace: checkDebirunStep
                  };
                  setLog(`⏳ [วันสิ้นโลก] สนามเต็ม 3 ช่อง — คลิกเลือกช่องบนสนามของคุณเพื่อวาง "${called.name}" ทับ`);
                  renderGame();
                }
              } else {
                checkDebirunStep();
              }
            }
          });
        }
      });
      options.push({ label: 'ไม่คอล (ข้าม)', color: '#475569', onSelect: () => checkDebirunStep() });
      showChoiceModal('⏳ ออโต้เมื่อเข้าเทิร์น: วันสิ้นโลก', 'เลือกคอลยูนิตที่มีพลังโจมตีไม่เกิน 2 จากกองนรก 1 ใบลงสนาม:', options);
      return;
    }
  }

  checkDebirunStep();
}

function triggerDebirunStartTurn(contestant, onComplete) {
  const spellsInGrave = contestant.graveyard.filter(c => c.type === 'NormalSpell' || c.type === 'ReactionSpell');
  const spellsInDeck = contestant.deck.filter(c => c.type === 'NormalSpell' || c.type === 'ReactionSpell');

  const reviveUnitFallback = (reasonText) => {
    const unitsInGrave = contestant.graveyard.filter(c => c.type === 'Monster' && !c.cannotNormalSummon && !c.isSpy);
    if (unitsInGrave.length === 0) {
      setLog(`😈 [เดบิรุน] ${reasonText} (ไม่มีมอนสเตอร์ในนรกให้ชุบ)`);
      if (onComplete) onComplete();
      return;
    }

    if (contestant !== gameState.player) {
      const emptySlot = contestant.board.findIndex(m => m === null);
      if (emptySlot !== -1) {
        const uIdx = contestant.graveyard.findIndex(c => c.uid === unitsInGrave[0].uid);
        const revived = contestant.graveyard.splice(uIdx, 1)[0];
        resetCardStateForZoneChange(revived);
        contestant.board[emptySlot] = revived;
        setLog(`😈 [AI เดบิรุน] ชุบ "${revived.name}" จากนรกลงสนาม!`);
      }
      if (onComplete) onComplete();
      return;
    }

    const opts = [];
    const seen = new Set();
    unitsInGrave.forEach(u => {
      if (!seen.has(u.id)) {
        seen.add(u.id);
        opts.push({
          label: `ชุบยูนิต "${u.name}" (Power ${u.power}) ลงสนาม`,
          color: '#16a34a',
          onSelect: () => {
            const idx = contestant.graveyard.findIndex(g => g.id === u.id);
            if (idx !== -1) {
              const card = contestant.graveyard.splice(idx, 1)[0];
              resetCardStateForZoneChange(card);
              const emptySlot = contestant.board.findIndex(m => m === null);
              if (emptySlot !== -1) {
                contestant.board[emptySlot] = card;
                setLog(`😈 [เดบิรุน] ชุบยูนิต "${card.name}" จากนรกลงสนามสำเร็จ!`);
                if (onComplete) onComplete();
              } else {
                gameState.pendingAction = {
                  type: 'CALL_FROM_EFFECT_SELECT_SLOT',
                  cardToPlace: card,
                  onAfterPlace: onComplete
                };
                setLog(`😈 [เดบิรุน] สนามเต็ม 3 ช่อง — คลิกเลือกช่องบนสนามของคุณเพื่อวาง "${card.name}" ทับ!`);
                renderGame();
              }
            } else if (onComplete) {
              onComplete();
            }
          }
        });
      }
    });
    showChoiceModal('😈 สกิลของ เดบิรุน (ชุบยูนิตจากนรก)', `${reasonText} เลือกยูนิต 1 ใบจากนรกเพื่อชุบลงสนาม:`, opts);
  };

  if (spellsInGrave.length === 0 && spellsInDeck.length === 0) {
    reviveUnitFallback('ไม่พบการ์ดเวทในกองหรือนรก');
    return;
  }

  const canForceCastSpell = (spellCard) => spellCard.id === 'DS01';

  if (contestant !== gameState.player) {
    const ds01GraveIdx = contestant.graveyard.findIndex(c => c.id === 'DS01');
    const ds01DeckIdx = contestant.deck.findIndex(c => c.id === 'DS01');
    if (ds01GraveIdx !== -1 || ds01DeckIdx !== -1) {
      const spell = ds01GraveIdx !== -1
        ? contestant.graveyard.splice(ds01GraveIdx, 1)[0]
        : contestant.deck.splice(ds01DeckIdx, 1)[0];
      if (ds01DeckIdx !== -1) contestant.deck = shuffleDeck(contestant.deck);
      const drawCount = contestant.graveyard.length >= 5 ? 2 : 1;
      drawCards(contestant, drawCount);
      const ally = contestant.board.find(m => m !== null);
      if (ally) ally.tempPowerMod += 1;
      contestant.graveyard.push(spell);
      setLog(`😈 [AI เดบิรุน] ค้นหา "เบิกเนตรแห่งแสง" และบังคับใช้งานทันที!`);
      if (onComplete) onComplete();
    } else {
      reviveUnitFallback('การ์ดเวทที่ค้นหาไม่สามารถบังคับใช้งานในจังหวะนี้ได้');
    }
    return;
  }

  const options = [];
  const allSpells = [
    ...spellsInGrave.map(s => ({ card: s, zone: 'grave', zoneLabel: 'จากนรก' })),
    ...spellsInDeck.map(s => ({ card: s, zone: 'deck', zoneLabel: 'จากกองการ์ด' }))
  ];
  const seenKeys = new Set();

  allSpells.forEach(item => {
    const key = `${item.zone}_${item.card.id}`;
    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      options.push({
        label: `[${item.zoneLabel}] ค้นหา "${item.card.name}" ขึ้นมือแล้วบังคับใช้งาน`,
        color: '#0284c7',
        onSelect: () => {
          const sourceArr = item.zone === 'grave' ? contestant.graveyard : contestant.deck;
          const idx = sourceArr.findIndex(c => c.id === item.card.id);
          if (idx !== -1) {
            const pickedSpell = sourceArr.splice(idx, 1)[0];
            if (item.zone === 'deck') contestant.deck = shuffleDeck(contestant.deck);
            resetCardStateForZoneChange(pickedSpell);
            contestant.hand.push(pickedSpell);

            if (canForceCastSpell(pickedSpell)) {
              const handIdx = contestant.hand.length - 1;
              const used = contestant.hand.splice(handIdx, 1)[0];
              const drawCnt = contestant.graveyard.length >= 5 ? 2 : 1;
              drawCards(contestant, drawCnt);
              const ally = contestant.board.find(m => m !== null);
              if (ally) ally.tempPowerMod += 1;
              contestant.graveyard.push(used);
              setLog(`😈 [เดบิรุน] ดึง "${used.name}" ขึ้นมือและบังคับใช้งานทันที (จั่ว ${drawCnt} ใบ และบัฟพลัง +1)!`);
              if (onComplete) onComplete();
            } else {
              reviveUnitFallback(`ดึง "${pickedSpell.name}" ขึ้นมือแล้ว แต่เงื่อนไขเวทไม่สามารถบังคับใช้ตอนนี้ได้`);
            }
          }
        }
      });
    }
  });

  showChoiceModal('😈 ออโต้เมื่อเข้าเทิร์น: เดบิรุน', 'เลือกค้นหาการ์ดเวทจากกองหรือนรกขึ้นมือเพื่อบังคับใช้งาน (หากใช้งานไม่ได้จะชุบยูนิตจากนรก 1 ใบ):', options);
}

function handleDoomsdayHandMenu(handIndex) {
  const player = gameState.player;
  const ai = gameState.ai;
  const card = player.hand[handIndex];
  if (!card) return;

  if (card.id === 'DM07') {
    const canSpecialCall = player.unitsDestroyedThisTurn >= 2;
    showChoiceModal(
      `🔥 ยืนยันการใช้การ์ด: แอชชี่ล่า`,
      `ยูนิตฝั่งเราที่ถูกทำลายในเทิร์นนี้: ${player.unitsDestroyedThisTurn} / 2 ใบ\n\n📜 ความสามารถ:\n${getCardDescription(card)}`,
      [
        {
          label: `💥 สั่งใช้งานสกิลจากมือ (เมื่อยูนิตถูกทำลาย 2 ใบขึ้นไป): คอลลงสนามและพลัง +2 จนจบเทิร์น ${!canSpecialCall ? '(ยูนิตถูกทำลายยังไม่ครบ 2 ใบ)' : ''}`,
          disabled: !canSpecialCall,
          color: '#dc2626',
          onSelect: () => summonAshilaBySkillFromHand(player)
        },
        {
          label: `✅ อัญเชิญปกติลงสนาม (Power 2 - เฉพาะใน Main Phase)`,
          disabled: gameState.phase !== 'Main Phase',
          color: '#d97706',
          onSelect: () => {
            gameState.selectedHandIndex = handIndex;
            setLog('👉 เลือก "แอชชี่ล่า" แล้ว — คลิกที่ช่องบนสนามของคุณเพื่อลงสนาม!');
            renderGame();
          }
        },
        { label: '❌ ยกเลิก', color: '#475569', onSelect: () => renderGame() }
      ]
    );
    return;
  }

  if (card.futureBaseId) {
    const baseSlotIdx = player.board.findIndex(m => m !== null && m.id === card.futureBaseId);
    if (player.futureUsedThisTurn) {
      setLog('🚫 คุณใช้ความสามารถ "อนาคต" ไปแล้วในเทิร์นนี้ (จำกัด 1 ครั้งต่อเทิร์น)!');
      return;
    }
    if (baseSlotIdx === -1) {
      setLog(`🚫 ไม่สามารถอัญเชิญ "${card.name}" แบบปกติได้! ต้องมี "${card.futureBaseName}" อยู่บนสนามฝั่งเราเพื่อส่งไปมิติมืดเท่านั้น!`);
      return;
    }

    showChoiceModal(
      `🌌 ยืนยันการใช้การ์ดอนาคต: ${card.name}`,
      `ต้องการส่ง "${card.futureBaseName}" บนสนามไปที่ "มิติมืด" แล้วคอล "${card.name}" ลงสนามใช่หรือไม่?\n\n📜 ความสามารถ:\n${getCardDescription(card)}`,
      [
        {
          label: `✅ ยืนยัน: ส่ง "${card.futureBaseName}" ไปมิติมืด -> คอล "${card.name}" ลงสนาม!`,
          color: '#7c3aed',
          onSelect: () => executeFutureSummon(player, ai, handIndex, baseSlotIdx)
        },
        { label: '❌ ยกเลิก', color: '#475569', onSelect: () => renderGame() }
      ]
    );
  }
}

function executeFutureSummon(caster, opponent, handIndex, baseSlotIndex) {
  const futureCard = caster.hand.splice(handIndex, 1)[0];
  const baseUnit = caster.board[baseSlotIndex];
  if (!futureCard || !baseUnit) return;

  caster.futureUsedThisTurn = true;
  resetCardStateForZoneChange(baseUnit);
  caster.darkDimension.push(baseUnit);

  resetCardStateForZoneChange(futureCard);
  futureCard.state = 'Stand';
  futureCard.returnFromDarkDimensionId = baseUnit.id;
  caster.board[baseSlotIndex] = futureCard;

  // หากการ์ดอนาคตมีบล็อก ON_SUMMON ใน effects (เช่น DM13) ให้รันผ่าน EffectEngine ได้ทันที
  if (Array.isArray(futureCard.effects) && futureCard.effects.some(e => e.trigger === 'ON_SUMMON')) {
    EffectEngine.triggerCardEffects(futureCard, 'ON_SUMMON', {
      caster, opponent, sourceCard: futureCard, sourceSlot: baseSlotIndex, isAI: caster !== gameState.player
    });
    renderGame();
    return;
  }

  if (futureCard.id === 'DM09') {
    futureCard.permPowerMod += 1;
    let topMsg = 'ไม่มีการ์ดในกองให้เปิด';
    if (caster.deck.length > 0) {
      const topCard = caster.deck[caster.deck.length - 1];
      if (topCard.type === 'NormalSpell' || topCard.type === 'ReactionSpell') {
        const standEnemy = opponent.board.find(m => m !== null && m.state === 'Stand');
        if (standEnemy) {
          standEnemy.state = 'Rest';
          topMsg = `เปิดท็อปกองได้เวท "${topCard.name}" -> บังคับ Rest "${standEnemy.name}" ของอีกฝ่าย!`;
        } else {
          topMsg = `เปิดท็อปกองได้เวท "${topCard.name}" (อีกฝ่ายไม่มียูนิตที่ Stand อยู่)`;
        }
      } else {
        topMsg = `เปิดท็อปกองได้ "${topCard.name}" (ไม่ใช่การ์ดเวท)`;
      }
    }
    setLog(`🌌 [อนาคต - ผู้รักษาความฝัน มายอา] ส่งมายอาไปมิติมืด คอลลงสนามพลัง +1 | ${topMsg}`);
    renderGame();
    return;
  }

  if (futureCard.id === 'DM10') {
    const otherSlot = caster.board.findIndex((m, idx) => m !== null && idx !== baseSlotIndex);
    let bounceMsg = '';
    if (otherSlot !== -1) {
      const bounced = caster.board[otherSlot];
      caster.board[otherSlot] = null;
      resetCardStateForZoneChange(bounced);
      caster.hand.push(bounced);
      bounceMsg = `นำ "${bounced.name}" บนสนามเราขึ้นมือ `;
    }
    let topMsg = '';
    if (caster.deck.length > 0) {
      const topCard = caster.deck.pop();
      resetCardStateForZoneChange(topCard);
      if (topCard.type === 'Monster') {
        const emptySlot = caster.board.findIndex(m => m === null);
        if (emptySlot !== -1) {
          caster.board[emptySlot] = topCard;
          topMsg = `และเปิดท็อปกองคอล "${topCard.name}" ลงสนาม!`;
        } else {
          caster.hand.push(topCard);
          topMsg = `และนำ "${topCard.name}" ขึ้นมือ (สนามเต็ม)`;
        }
      } else {
        caster.hand.push(topCard);
        topMsg = `และเปิดท็อปกองได้เวท "${topCard.name}" นำขึ้นมือ!`;
      }
    }
    setLog(`🌌 [อนาคต - เดบิรุน เดอะ ฟิวเจอร์] ส่งเดบิรุนไปมิติมืด ${bounceMsg}${topMsg}`);
    renderGame();
    return;
  }

  if (futureCard.id === 'DM11') {
    const mayaGraveIdx = caster.graveyard.findIndex(c => c.id === 'DM03');
    if (mayaGraveIdx !== -1) {
      const maya = caster.graveyard.splice(mayaGraveIdx, 1)[0];
      resetCardStateForZoneChange(maya);
      maya.permPowerMod += 1;
      const emptySlot = caster.board.findIndex(m => m === null);
      if (emptySlot !== -1) {
        caster.board[emptySlot] = maya;
        setLog('🌌 [อนาคต - เด็กสาวขนมหวาน ซึรุรุ] ส่งซึรุรุไปมิติมืด คอล "มายอา" จากนรกลงสนาม และเพิ่มพลังให้มายอา +1!');
      } else {
        gameState.pendingAction = {
          type: 'CALL_FROM_EFFECT_SELECT_SLOT',
          cardToPlace: maya,
          onAfterPlace: null
        };
        setLog('🌌 [อนาคต - เด็กสาวขนมหวาน ซึรุรุ] สนามเต็ม 3 ช่อง — คลิกเลือกช่องบนสนามเพื่อวาง "มายอา" ทับ!');
      }
    } else {
      setLog('🌌 [อนาคต - เด็กสาวขนมหวาน ซึรุรุ] ส่งซึรุรุไปมิติมืดและลงสนามสำเร็จ! (ไม่มีมายอาในนรก)');
    }
    renderGame();
    return;
  }

  if (futureCard.id === 'DM12') {
    if (opponent.hand.length > 0) {
      const discarded = opponent.hand.pop();
      resetCardStateForZoneChange(discarded);
      opponent.graveyard.push(discarded);
      setLog(`🌌 [อนาคต - นักล่าปีศาจ โซเนบุ] ส่งโซเนบุไปมิติมืด -> ฝ่ายตรงข้ามทิ้งการ์ดบนมือ "${discarded.name}" 1 ใบ!`);
    } else {
      futureCard.permPowerMod += 1;
      setLog('🌌 [อนาคต - นักล่าปีศาจ โซเนบุ] ฝ่ายตรงข้ามไม่ทิ้งการ์ด -> นักล่าปีศาจ โซเนบุ พลัง +1!');
    }
    renderGame();
    return;
  }

  if (futureCard.id === 'DM14') {
    const enemySlot = opponent.board.findIndex(m => m !== null && !m.immuneToEnemyEffectsUntilEndOfTurn);
    if (enemySlot !== -1) {
      const bouncedEnemy = opponent.board[enemySlot];
      opponent.board[enemySlot] = null;
      resetCardStateForZoneChange(bouncedEnemy);
      opponent.hand.push(bouncedEnemy);

      const otherUnitInHandIdx = opponent.hand.findIndex(c => c.type === 'Monster' && c.uid !== bouncedEnemy.uid && !c.cannotNormalSummon);
      if (otherUnitInHandIdx !== -1) {
        const replacement = opponent.hand.splice(otherUnitInHandIdx, 1)[0];
        resetCardStateForZoneChange(replacement);
        opponent.board[enemySlot] = replacement;
        setLog(`🌌 [อนาคต - สุดยอดเอไอ เอมิ] บังคับอีกฝ่ายนำ "${bouncedEnemy.name}" ขึ้นมือ และคอล "${replacement.name}" ลงมาแทน!`);
      } else {
        drawCards(caster, 1);
        setLog(`🌌 [อนาคต - สุดยอดเอไอ เอมิ] บังคับอีกฝ่ายนำ "${bouncedEnemy.name}" ขึ้นมือ (อีกฝ่ายไม่มียูนิตอื่นให้คอล เราจั่ว 1 ใบ)!`);
      }
    } else {
      drawCards(caster, 1);
      setLog('🌌 [อนาคต - สุดยอดเอไอ เอมิ] อีกฝ่ายไม่มีการ์ดบนสนามให้ยกขึ้นมือ -> เราจั่วการ์ด 1 ใบ!');
    }
    renderGame();
  }
}

function handleNueaHandAbilityMenu(handIndex) {
  const player = gameState.player;
  const ai = gameState.ai;
  const card = player.hand[handIndex];
  if (!card) return;

  if (card.id === 'NM01') {
    const spyInDeck = player.deck.some(c => c.id === 'NM05');
    const spyInGrave = player.graveyard.some(c => c.id === 'NM05');
    const enemyHasEmptySlot = ai.board.some(m => m === null);
    const canSummonSpy = (spyInDeck || spyInGrave) && enemyHasEmptySlot;
    const soldierInDeck = player.deck.some(c => isSoldierCard(c));

    showChoiceModal(
      '🌾 ยืนยันการใช้การ์ด: ไพร่ชาวนาเหนือ',
      `เลือกวิธีใช้งานการ์ดใบนี้:\n\n📜 ความสามารถ:\n${getCardDescription(card)}`,
      [
        {
          label: '✅ อัญเชิญปกติลงสนาม (Power 1)',
          color: '#d97706',
          onSelect: () => {
            gameState.selectedHandIndex = handIndex;
            setLog('👉 เลือก "ไพร่ชาวนาเหนือ" แล้ว — คลิกที่ช่องบนกระดานของคุณเพื่อลงสนาม!');
            renderGame();
          }
        },
        {
          label: `🕵️ สั่งใช้ 1: ทิ้งใบนี้ลงนรก -> อัญเชิญ "สายลับไพร่เหนือ" จากกอง/นรกลงสนามอีกฝ่าย ${!canSummonSpy ? '(เงื่อนไขไม่ครบ)' : ''}`,
          disabled: !canSummonSpy,
          color: '#7c3aed',
          onSelect: () => {
            const discarded = player.hand.splice(handIndex, 1)[0];
            resetCardStateForZoneChange(discarded);
            player.graveyard.push(discarded);

            let spyCard = null;
            const gIdx = player.graveyard.findIndex(c => c.id === 'NM05');
            if (gIdx !== -1) {
              spyCard = player.graveyard.splice(gIdx, 1)[0];
            } else {
              const dIdx = player.deck.findIndex(c => c.id === 'NM05');
              if (dIdx !== -1) {
                spyCard = player.deck.splice(dIdx, 1)[0];
                player.deck = shuffleDeck(player.deck);
              }
            }
            const emptyAiSlot = ai.board.findIndex(m => m === null);
            if (spyCard && emptyAiSlot !== -1) {
              resetCardStateForZoneChange(spyCard);
              spyCard.state = 'Stand';
              ai.board[emptyAiSlot] = spyCard;
              setLog('🕵️ [ไพร่ชาวนาเหนือ] ส่งตัวเองลงนรก และอัญเชิญ "สายลับไพร่เหนือ" ลงบนสนามของฝ่ายตรงข้ามสำเร็จ!');
            }
            renderGame();
          }
        },
        {
          label: `🛡️ สั่งใช้ 2: ทิ้งใบนี้ลงนรก -> เลือกนำการ์ด "ทหาร" 1 ใบจากกองการ์ดขึ้นมือ ${!soldierInDeck ? '(ไม่มีทหารในกอง)' : ''}`,
          disabled: !soldierInDeck,
          color: '#0284c7',
          onSelect: () => {
            const discarded = player.hand.splice(handIndex, 1)[0];
            resetCardStateForZoneChange(discarded);
            player.graveyard.push(discarded);
            openSelectSoldierFromDeckModal(player);
          }
        },
        { label: '❌ ยกเลิก', color: '#475569', onSelect: () => renderGame() }
      ]
    );
    return;
  }

  if (card.id === 'NM02' || card.id === 'NM03') {
    const canJuti = player.hand.some((c, idx) => idx !== handIndex && c.id === 'NM01');

    showChoiceModal(
      `⚔️ ยืนยันการใช้การ์ด: ${card.name}`,
      `เลือกวิธีอัญเชิญการ์ดใบนี้:\n\n📜 ความสามารถ:\n${getCardDescription(card)}`,
      [
        {
          label: `✅ อัญเชิญปกติลงสนาม (Power ${card.power})`,
          color: '#d97706',
          onSelect: () => {
            gameState.selectedHandIndex = handIndex;
            setLog(`👉 เลือก "${card.name}" แล้ว — คลิกที่ช่องบนกระดานของคุณเพื่อลงสนาม!`);
            renderGame();
          }
        },
        {
          label: `🔥 สั่งใช้จากมือ (จุติ): ทิ้ง "ไพร่ชาวนาเหนือ" บนมือ 1 ใบ -> อัญเชิญใบนี้พลัง +1 ${!canJuti ? '(ต้องมีไพร่ชาวนาเหนือบนมือ)' : ''}`,
          disabled: !canJuti,
          color: '#dc2626',
          onSelect: () => {
            gameState.pendingAction = { type: 'JUTI_SELECT_SLOT', summonHandIndex: handIndex };
            setLog(`🔥 [อัญเชิญจุติ ${card.name}] คลิกเลือกช่องบนสนามของคุณเพื่อวางการ์ด`);
            renderGame();
          }
        },
        { label: '❌ ยกเลิก', color: '#475569', onSelect: () => renderGame() }
      ]
    );
  }
}

function openSelectSoldierFromDeckModal(contestant) {
  const uniqueSoldiers = [];
  const seenIds = new Set();
  contestant.deck.forEach(c => {
    if (isSoldierCard(c) && !seenIds.has(c.id)) {
      seenIds.add(c.id);
      uniqueSoldiers.push(c);
    }
  });

  if (uniqueSoldiers.length === 0) {
    setLog('⚠️ ไม่พบการ์ด "ทหาร" ในกองการ์ด');
    renderGame();
    return;
  }

  const options = uniqueSoldiers.map(sCard => ({
    label: `เลือก "${sCard.name}" (Power ${sCard.power}) ขึ้นมือ`,
    color: '#16a34a',
    onSelect: () => {
      const idx = contestant.deck.findIndex(c => c.id === sCard.id);
      if (idx !== -1) {
        const picked = contestant.deck.splice(idx, 1)[0];
        resetCardStateForZoneChange(picked);
        contestant.hand.push(picked);
        contestant.deck = shuffleDeck(contestant.deck);
        setLog(`🛡️ [ไพร่ชาวนาเหนือ] นำ "${picked.name}" จากกองการ์ดขึ้นมือและสับกองสำเร็จ!`);
      }
      renderGame();
    }
  }));

  showChoiceModal('🛡️ เลือกการ์ด "ทหาร" 1 ใบจากกองการ์ดขึ้นมือ', 'คลิกเลือกทหารที่ต้องการดึงขึ้นมือ:', options);
}

function triggerRoyalGuardJutiBonus(contestant) {
  const hasConscriptOnBoard = contestant.board.some(m => m !== null && m.id === 'NM04');
  if (!hasConscriptOnBoard) return;

  const graveSoldiers = contestant.graveyard.filter(c => isSoldierCard(c));
  const deckSoldiers = contestant.deck.filter(c => isSoldierCard(c));
  if (graveSoldiers.length === 0 && deckSoldiers.length === 0) return;

  if (contestant !== gameState.player) {
    const emptySlot = contestant.board.findIndex(m => m === null);
    if (emptySlot === -1) return;
    let summoned = null;
    if (graveSoldiers.length > 0) {
      const idx = contestant.graveyard.findIndex(c => isSoldierCard(c));
      summoned = contestant.graveyard.splice(idx, 1)[0];
    } else {
      const idx = contestant.deck.findIndex(c => isSoldierCard(c));
      summoned = contestant.deck.splice(idx, 1)[0];
      contestant.deck = shuffleDeck(contestant.deck);
    }
    if (summoned) {
      resetCardStateForZoneChange(summoned);
      contestant.board[emptySlot] = summoned;
      EffectEngine.triggerCardEffects(summoned, 'ON_SUMMON', {
        caster: contestant, opponent: gameState.player, sourceCard: summoned, sourceSlot: emptySlot, isAI: true
      });
      setLog(`🤖 [จุติ - ทหารหลวงเหนือ] อัญเชิญ "${summoned.name}" ลงสนามฟรี!`);
    }
    renderGame();
    return;
  }

  const placeBonusSoldier = (card) => {
    resetCardStateForZoneChange(card);
    const emptySlot = contestant.board.findIndex(m => m === null);
    if (emptySlot !== -1) {
      contestant.board[emptySlot] = card;
      setLog(`✨ [จุติ - ทหารหลวงเหนือ] อัญเชิญ "${card.name}" ลงสนามทันที!`);
      EffectEngine.triggerCardEffects(card, 'ON_SUMMON', {
        caster: contestant, opponent: gameState.ai, sourceCard: card, sourceSlot: emptySlot, isAI: false
      }, () => renderGame());
    } else {
      gameState.pendingAction = {
        type: 'CALL_FROM_EFFECT_SELECT_SLOT',
        cardToPlace: card,
        onAfterPlace: null
      };
      setLog(`✨ [จุติ - ทหารหลวงเหนือ] สนามเต็ม 3 ช่อง — คลิกเลือกช่องบนสนามของคุณเพื่อวาง "${card.name}" ทับ!`);
      renderGame();
    }
  };

  const options = [];
  const seen = new Set();

  graveSoldiers.forEach(c => {
    const key = `G_${c.id}`;
    if (!seen.has(key)) {
      seen.add(key);
      options.push({
        label: `[จากนรก] อัญเชิญ "${c.name}" (Power ${c.power})`,
        color: '#7c3aed',
        onSelect: () => {
          const idx = contestant.graveyard.findIndex(g => g.id === c.id);
          if (idx !== -1) placeBonusSoldier(contestant.graveyard.splice(idx, 1)[0]);
        }
      });
    }
  });

  deckSoldiers.forEach(c => {
    const key = `D_${c.id}`;
    if (!seen.has(key)) {
      seen.add(key);
      options.push({
        label: `[จากกองการ์ด] อัญเชิญ "${c.name}" (Power ${c.power})`,
        color: '#0284c7',
        onSelect: () => {
          const idx = contestant.deck.findIndex(d => d.id === c.id);
          if (idx !== -1) {
            const card = contestant.deck.splice(idx, 1)[0];
            contestant.deck = shuffleDeck(contestant.deck);
            placeBonusSoldier(card);
          }
        }
      });
    }
  });

  showChoiceModal('🔥 สกิลจุติของ ทหารหลวงเหนือ!', 'เลือกอัญเชิญ "ทหาร" 1 ใบจากกองหรือนรกลงสนามทันที:', options);
}


/* ============================================================================
   หมวดที่ 6: ระบบจัดการเทิร์น และการคลิกเลือกเป้าหมายผ่าน EffectEngine
   ============================================================================ */
function canContestantAttack(contestant, monster) {
  if (gameState.gameOver) return { allowed: false, reason: 'เกมจบแล้ว' };
  if (!monster || monster.state !== 'Stand') {
    return { allowed: false, reason: 'ยูนิทต้องอยู่ในสถานะ Stand เท่านั้นจึงจะโจมตีได้' };
  }
  if (contestant.isFirstPlayer && contestant.turnsTaken === 1) {
    return { allowed: false, reason: 'กฎผู้เล่นเริ่มคนแรก: ห้ามโจมตีใน Turn 1!' };
  }
  if (!contestant.isFirstPlayer && contestant.turnsTaken === 1 && contestant.attacksThisTurn >= 1) {
    return { allowed: false, reason: 'กฎผู้เล่นเริ่มคนที่สอง: ในเทิร์นแรกของตัวเอง โจมตีได้เพียง 1 ครั้ง!' };
  }
  return { allowed: true };
}

function executeStartPhase(contestant, onStartEffectsComplete = null) {
  contestant.turnsTaken += 1;
  contestant.attacksThisTurn = 0;
  contestant.unitsDestroyedThisTurn = 0;
  contestant.futureUsedThisTurn = false;
  contestant.leader.abilityUsedThisTurn = false;
  contestant.spellQuota.normalUsed = 0;
  contestant.spellQuota.reactionUsed = 0;

  drawCards(contestant, 1);

  contestant.board.forEach(m => {
    if (m) {
      m.state = 'Stand';
      m.usedSkills = {};
      m.indestructibleUntilNextTurn = false;
    }
  });

  if (contestant.leader && contestant.leader.id === 'L02') {
    triggerKhunNueaStartTurn(contestant);
    if (onStartEffectsComplete) onStartEffectsComplete();
    return;
  }

  triggerDoomsdayStartTurnQueue(contestant, onStartEffectsComplete);
}

function executeEndPhaseCleanup(activeContestant) {
  activeContestant.board.forEach((m, idx) => {
    if (!m) return;

    if (m.returnFromDarkDimensionId) {
      const baseId = m.returnFromDarkDimensionId;
      const futureName = m.name;
      activeContestant.board[idx] = null;
      resetCardStateForZoneChange(m);
      activeContestant.graveyard.push(m);

      const darkIdx = activeContestant.darkDimension.findIndex(d => d.id === baseId);
      if (darkIdx !== -1) {
        const returnedUnit = activeContestant.darkDimension.splice(darkIdx, 1)[0];
        resetCardStateForZoneChange(returnedUnit);
        returnedUnit.state = 'Stand';
        activeContestant.board[idx] = returnedUnit;
        setLog(`🌌 [จบเทิร์นอนาคต] นำ "${futureName}" ลงนรก และคอล "${returnedUnit.name}" จากมิติมืดกลับลงสนาม!`);
      }
      return;
    }

    if (m.destroyAtEndOfTurn) {
      destroyBoardMonster(activeContestant, idx);
      setLog(`🔥 "${m.name}" ถูกทำลายเมื่อจบเทิร์นตามเงื่อนไขความสามารถ!`);
    }
  });

  [gameState.player, gameState.ai].forEach(side => {
    side.board.forEach(m => {
      if (m) {
        m.tempPowerMod = 0;
        m.immuneToEnemyEffectsUntilEndOfTurn = false;
      }
    });
  });
}

// เมื่อผู้เล่นคลิกที่การ์ดบนมือตัวเอง
function handleHandCardClick(handIndex) {
  const player = gameState.player;
  const ai = gameState.ai;
  const clickedCard = player ? player.hand[handIndex] : null;
  if (!clickedCard) return;

  const isAshilaReadyInBattle = (clickedCard.id === 'DM07' && player.unitsDestroyedThisTurn >= 2 && gameState.phase === 'Battle Phase');

  if (gameState.gameOver || gameState.isRollingDice || gameState.activeTurn !== 'player' || (gameState.phase !== 'Main Phase' && !isAshilaReadyInBattle)) {
    setLog('⚠️ ลงการ์ดหรือใช้เวทมนตร์จากมือได้เฉพาะใน Main Phase ของคุณเท่านั้น!');
    return;
  }

  // กรณีที่ 1: อยู่ระหว่างรอคลิกเลือกการ์ดบนมือจาก Modular EffectEngine
  if (gameState.pendingAction) {
    const action = gameState.pendingAction;
    if (action.type === 'MODULAR_SELECT_TARGET' && action.targetZone === 'PLAYER_HAND') {
      if (action.excludeHandUid && clickedCard.uid === action.excludeHandUid) {
        setLog('⚠️ กรุณาคลิกเลือกการ์ดใบอื่นบนมือเพื่อใช้ทิ้ง!');
        return;
      }
      if (action.onSelectHand) action.onSelectHand(handIndex);
      action.remainingCount -= 1;
      if (action.remainingCount <= 0) {
        const doneCb = action.onAllSelected;
        gameState.pendingAction = null;
        if (doneCb) doneCb();
      } else {
        renderGame();
      }
      return;
    }

    setLog('⚠️ กรุณาคลิกเลือกเป้าหมายบนสนามตามที่ระบบแจ้งเตือนอยู่!');
    return;
  }

  if (gameState.selectedHandIndex === handIndex) {
    gameState.selectedHandIndex = null;
    setLog('ยกเลิกการเลือกการ์ดบนมือ');
    renderGame();
    return;
  }

  // กรณีที่ 2: คลิกการ์ด Monster บนมือ
  if (clickedCard.type === 'Monster') {
    if (clickedCard.id === 'M04') {
      setLog('🚫 "ออลฟอจิต" ไม่สามารถอัญเชิญแบบปกติได้!');
      return;
    }

    if (clickedCard.id === 'DM07' || clickedCard.futureBaseId) {
      handleDoomsdayHandMenu(handIndex);
      return;
    }

    if (clickedCard.id === 'NM01' || clickedCard.id === 'NM02' || clickedCard.id === 'NM03') {
      handleNueaHandAbilityMenu(handIndex);
      return;
    }

    if (clickedCard.id === 'NM05' || clickedCard.isSpy) {
      if (!ai.board.some(m => m === null)) {
        setLog('⚠️ สนามของฝ่ายตรงข้ามเต็มทั้ง 3 ช่อง จึงไม่สามารถส่งสายลับไปลงได้!');
        return;
      }
      askCardUseConfirmation(clickedCard, 'ส่งสายลับใบนี้ลงบนสนามของฝ่ายตรงข้าม', () => {
        gameState.selectedAttackerSlot = null;
        gameState.selectedHandIndex = handIndex;
        setLog('🕵️ เลือก "สายลับไพร่เหนือ" แล้ว — คลิกที่ช่องว่างบนสนามของฝ่ายตรงข้าม (ด้านบน) เพื่อวางสายลับ!');
        renderGame();
      });
      return;
    }

    askCardUseConfirmation(clickedCard, 'อัญเชิญยูนิตใบนี้ลงสู่สนามของคุณ', () => {
      gameState.selectedAttackerSlot = null;
      gameState.selectedHandIndex = handIndex;
      setLog(`👉 ยืนยันเลือก "${clickedCard.name}" แล้ว — คลิกที่ช่องบนสนามของคุณเพื่อลงสนาม (วางทับช่องที่มีมอนสเตอร์ได้)!`);
      renderGame();
    });
    return;
  }

  // กรณีที่ 3: คลิกการ์ดเวทมนตร์
  if (clickedCard.type === 'NormalSpell' || clickedCard.type === 'ReactionSpell') {
    initiatePlayerSpell(handIndex);
  }
}

// เมื่อผู้เล่นคลิกที่ช่องบนสนามฝั่งตัวเอง
function handlePlayerSlotClick(slotIndex) {
  if (gameState.gameOver || gameState.isRollingDice || gameState.activeTurn !== 'player') return;
  const player = gameState.player;

  if (slotIndex === 'leader') {
    activateLeaderSkillPlayer();
    return;
  }

  const slotMonster = player.board[slotIndex];

  // --- ส่วนที่ 1: หากกำลังรอเลือกเป้าหมายจาก EffectEngine หรือการวางการ์ดพิเศษ ---
  if (gameState.pendingAction) {
    const action = gameState.pendingAction;

    if (action.type === 'MODULAR_SELECT_TARGET') {
      let accepted = false;
      if (action.targetZone === 'PLAYER_BOARD' && action.onSelectSlot) {
        accepted = action.onSelectSlot(slotIndex);
      } else if (action.targetZone === 'ANY_BOARD' && action.onSelectAnyBoardSlot) {
        accepted = action.onSelectAnyBoardSlot('PLAYER', slotIndex);
      }
      if (accepted) {
        action.remainingCount -= 1;
        if (action.remainingCount <= 0) {
          const doneCb = action.onAllSelected;
          gameState.pendingAction = null;
          if (doneCb) doneCb();
        } else {
          renderGame();
        }
      }
      return;
    }

    if (action.type === 'CALL_FROM_EFFECT_SELECT_SLOT') {
      const cardToPlace = action.cardToPlace;
      const callback = action.onAfterPlace;
      let overwriteMsg = '';
      if (slotMonster !== null) {
        const overwritten = sendOverwrittenMonsterToGrave(player, slotIndex);
        overwriteMsg = ` (วางทับ "${overwritten.name}" ส่งลงนรกโดยไม่ถือว่าถูกทำลาย)`;
      }
      player.board[slotIndex] = cardToPlace;
      gameState.pendingAction = null;
      setLog(`✨ คอล "${cardToPlace.name}" ลงช่องที่ ${slotIndex + 1} สำเร็จ!${overwriteMsg}`);
      EffectEngine.triggerCardEffects(cardToPlace, 'ON_SUMMON', {
        caster: player, opponent: gameState.ai, sourceCard: cardToPlace, sourceSlot: slotIndex, isAI: false
      }, () => {
        renderGame();
        if (callback) callback();
      });
      return;
    }

    if (action.type === 'JUTI_SELECT_SLOT') {
      const summonIdx = action.summonHandIndex;
      const peasantIdx = player.hand.findIndex((c, idx) => idx !== summonIdx && c.id === 'NM01');
      if (peasantIdx === -1) {
        gameState.pendingAction = null;
        renderGame();
        return;
      }

      const summonedCard = player.hand[summonIdx];
      const peasantCard = player.hand[peasantIdx];
      [summonIdx, peasantIdx].sort((a, b) => b - a).forEach(idx => player.hand.splice(idx, 1));

      resetCardStateForZoneChange(peasantCard);
      player.graveyard.push(peasantCard);

      let overwriteMsg = '';
      if (slotMonster !== null) {
        const overwritten = sendOverwrittenMonsterToGrave(player, slotIndex);
        overwriteMsg = ` (วางทับ "${overwritten.name}" ส่งลงนรกโดยไม่ถือว่าถูกทำลาย)`;
      }

      resetCardStateForZoneChange(summonedCard);
      summonedCard.state = 'Stand';
      summonedCard.permPowerMod += 1;
      player.board[slotIndex] = summonedCard;
      gameState.pendingAction = null;

      setLog(`🔥 อัญเชิญจุติ "${summonedCard.name}" (พลัง +1 เป็น ${getEffectivePower(summonedCard, player)}) สำเร็จ!${overwriteMsg}`);
      if (summonedCard.id === 'NM02') triggerRoyalGuardJutiBonus(player);
      renderGame();
      return;
    }

    return;
  }

  // --- ส่วนที่ 2: การวาง Monster จากมือลงสนามตัวเอง (รันบล็อก ON_SUMMON อัตโนมัติ) ---
  if (gameState.phase === 'Main Phase' && gameState.selectedHandIndex !== null) {
    const selectedCard = player.hand[gameState.selectedHandIndex];
    if (!selectedCard || selectedCard.type !== 'Monster') return;

    if (selectedCard.cannotNormalSummon) {
      setLog(`🚫 "${selectedCard.name}" ไม่สามารถอัญเชิญแบบปกติได้!`);
      gameState.selectedHandIndex = null;
      renderGame();
      return;
    }

    if (selectedCard.id === 'NM05' || selectedCard.isSpy) {
      setLog('🕵️ "สายลับไพร่เหนือ" ต้องคลิกวางลงบนช่องว่างของสนามฝ่ายตรงข้าม (ด้านบน)!');
      return;
    }

    let overwriteMsg = '';
    if (player.board[slotIndex] !== null) {
      const overwritten = sendOverwrittenMonsterToGrave(player, slotIndex);
      overwriteMsg = ` (วางทับ "${overwritten.name}" ส่งลงนรกโดยไม่ถือว่าถูกทำลาย)`;
    }

    const summoned = player.hand.splice(gameState.selectedHandIndex, 1)[0];
    resetCardStateForZoneChange(summoned);
    summoned.state = 'Stand';
    player.board[slotIndex] = summoned;
    gameState.selectedHandIndex = null;

    setLog(`✅ อัญเชิญ "${summoned.name}" ลงช่องที่ ${slotIndex + 1} สำเร็จ!${overwriteMsg}`);
    EffectEngine.triggerCardEffects(summoned, 'ON_SUMMON', {
      caster: player,
      opponent: gameState.ai,
      sourceCard: summoned,
      sourceSlot: slotIndex,
      isAI: false
    }, () => renderGame());
    return;
  }

  // --- ส่วนที่ 3: คลิกยูนิทบนสนามตัวเองใน Main Phase (ใช้สกิล) หรือ Battle Phase (สั่งโจมตี) ---
  if (gameState.phase === 'Main Phase' && gameState.selectedHandIndex === null) {
    if (slotMonster) {
      activateMonsterOnBoardPlayer(slotIndex);
    }
    return;
  }

  if (gameState.phase === 'Battle Phase') {
    if (!slotMonster) return;

    if (slotMonster.id === 'DM08' && slotMonster.state === 'Rest') {
      const hasDebirun = player.board.some(m => m !== null && m.id === 'DM04');
      if (hasDebirun && player.hand.length >= 3 && !slotMonster.usedSkills.emiReattack) {
        showChoiceModal(
          '⚡ สกิลออโต้ของ เอมิ (โจมตีอีกครั้ง)',
          'บนสนามเรามี "เดบิรุน" อยู่! ต้องการทิ้งการ์ดบนมือ 3 ใบ เพื่อเปลี่ยน เอมิ เป็น Stand และโจมตีอีกครั้งหรือไม่?',
          [
            {
              label: '🔥 ทิ้งการ์ดบนมือ 3 ใบ -> Stand เอมิเพื่อโจมตีอีกครั้ง!',
              color: '#dc2626',
              onSelect: () => {
                for (let i = 0; i < 3; i++) {
                  const d = player.hand.pop();
                  resetCardStateForZoneChange(d);
                  player.graveyard.push(d);
                }
                slotMonster.state = 'Stand';
                slotMonster.usedSkills.emiReattack = true;
                setLog('⚡ [เอมิ] ทิ้งการ์ดบนมือ 3 ใบ และลุกขึ้น Stand พร้อมโจมตีอีกครั้ง!');
                renderGame();
              }
            },
            { label: '❌ ยกเลิก', color: '#475569', onSelect: () => renderGame() }
          ]
        );
        return;
      }
    }

    const check = canContestantAttack(player, slotMonster);
    if (!check.allowed) {
      setLog(`🚫 โจมตีไม่ได้: ${check.reason}`);
      return;
    }

    gameState.selectedAttackerSlot = (gameState.selectedAttackerSlot === slotIndex) ? null : slotIndex;
    setLog(gameState.selectedAttackerSlot !== null
      ? `⚔️ เลือก "${slotMonster.name}" (Power ${getEffectivePower(slotMonster, player)}) โจมตี — คลิกที่ยูนิทหรือ Leader ของฝ่ายตรงข้าม!`
      : 'ยกเลิกการเลือกโจมตี');
    renderGame();
  }
}

function handleAISlotClick(aiSlotIndex) {
  if (gameState.gameOver || gameState.activeTurn !== 'player') return;
  const player = gameState.player;
  const ai = gameState.ai;
  const targetMonster = ai.board[aiSlotIndex];

  if (gameState.phase === 'Main Phase' && gameState.selectedHandIndex !== null && !gameState.pendingAction) {
    const selectedCard = player.hand[gameState.selectedHandIndex];
    if (selectedCard && (selectedCard.id === 'NM05' || selectedCard.isSpy)) {
      if (targetMonster !== null) {
        setLog('⚠️ ช่องนี้ของฝ่ายตรงข้ามมียูนิทอยู่แล้ว กรุณาคลิกเลือกช่องว่าง!');
        return;
      }
      const spy = player.hand.splice(gameState.selectedHandIndex, 1)[0];
      resetCardStateForZoneChange(spy);
      spy.state = 'Stand';
      ai.board[aiSlotIndex] = spy;
      gameState.selectedHandIndex = null;
      setLog(`🕵️ อัญเชิญ "สายลับไพร่เหนือ" ลงไปยึดช่องที่ ${aiSlotIndex + 1} บนสนามของฝ่ายตรงข้ามสำเร็จ!`);
      renderGame();
      return;
    }
  }

  // รับการคลิกเลือกเป้าหมายฝั่งตรงข้ามจาก EffectEngine
  if (gameState.pendingAction) {
    const action = gameState.pendingAction;
    if (action.type === 'MODULAR_SELECT_TARGET') {
      let accepted = false;
      if (action.targetZone === 'OPPONENT_BOARD' && action.onSelectSlot) {
        accepted = action.onSelectSlot(aiSlotIndex);
      } else if (action.targetZone === 'ANY_BOARD' && action.onSelectAnyBoardSlot) {
        accepted = action.onSelectAnyBoardSlot('OPPONENT', aiSlotIndex);
      }
      if (accepted) {
        action.remainingCount -= 1;
        const stillHasValidEnemy = ai.board.some(m => m !== null);
        if (action.remainingCount <= 0 || !stillHasValidEnemy) {
          const doneCb = action.onAllSelected;
          gameState.pendingAction = null;
          if (doneCb) doneCb();
        } else {
          setLog(`👉 เลือกเป้าหมายต่อไป (เหลืออีก ${action.remainingCount} ใบ)!`);
          renderGame();
        }
      }
      return;
    }
    return;
  }

  // โจมตีใส่ Monster ของฝ่ายตรงข้าม (ใน Battle Phase)
  if (gameState.phase !== 'Battle Phase' || gameState.selectedAttackerSlot === null) {
    if (targetMonster) openCardDetailModal(targetMonster, ai);
    return;
  }
  if (!targetMonster) {
    setLog('⚠️ ช่องนี้ไม่มีมอนสเตอร์ให้โจมตี!');
    return;
  }

  if (targetMonster.id === 'DM03' && ai.board.some(m => m !== null && m.id === 'DM05')) {
    setLog('🛡️ "มายอา" ไม่ตกเป็นเป้าหมายการโจมตีตราบเท่าที่มี "ซึรุรุ" อยู่บนสนาม!');
    return;
  }

  executeAttack(player, ai, gameState.selectedAttackerSlot, 'monster', aiSlotIndex);
}

document.getElementById('ai-leader-box').addEventListener('click', () => {
  if (gameState.gameOver || gameState.activeTurn !== 'player' || gameState.phase !== 'Battle Phase') return;
  if (gameState.pendingAction || gameState.selectedAttackerSlot === null) return;

  executeAttack(gameState.player, gameState.ai, gameState.selectedAttackerSlot, 'leader', null);
});

/* ============================================================================
   หมวดที่ 7: ระบบเอฟเฟกต์แอนิเมชัน (Visual FX) และระบบการต่อสู้ / INTERCEPT
   ============================================================================ */

// 🎨 สร้าง CSS Animation สำหรับเอฟเฟกต์การลงการ์ด โชว์สกิล และการพุ่งโจมตีอัตโนมัติ
function ensureVisualEffectsStyles() {
  if (document.getElementById('tcg-visual-fx-styles')) return;
  const style = document.createElement('style');
  style.id = 'tcg-visual-fx-styles';
  style.textContent = `
    /* เอฟเฟกต์ตอนการ์ดลงสนามใหม่ */
    @keyframes summonDropIn {
      0% { transform: scale(1.45) translateY(-35px); opacity: 0; filter: brightness(2.2); }
      60% { transform: scale(0.95) translateY(4px); opacity: 1; }
      100% { transform: scale(1) translateY(0); opacity: 1; filter: brightness(1); }
    }
    .fx-summon-drop {
      animation: summonDropIn 0.55s cubic-bezier(0.22, 1, 0.36, 1) forwards !important;
      box-shadow: 0 0 28px #fbbf24, 0 0 12px #ffffff !important;
      z-index: 25 !important;
    }

    /* เอฟเฟกต์ตอนใช้สกิลบัฟพลัง */
    @keyframes skillGlowPulse {
      0% { transform: scale(1); box-shadow: 0 0 5px #38bdf8; }
      50% { transform: scale(1.12); box-shadow: 0 0 30px #38bdf8, 0 0 15px #4ade80; filter: brightness(1.5); }
      100% { transform: scale(1); box-shadow: 0 0 5px #38bdf8; }
    }
    .fx-skill-glow {
      animation: skillGlowPulse 0.65s ease-in-out !important;
      z-index: 25 !important;
    }

    /* เอฟเฟกต์พุ่งโจมตี (ฝั่ง AI พุ่งลงล่าง / ฝั่ง Player พุ่งขึ้นบน) */
    @keyframes lungeDownAI {
      0% { transform: translateY(0) scale(1); }
      45% { transform: translateY(42px) scale(1.15); box-shadow: 0 0 30px #ef4444; }
      100% { transform: translateY(0) scale(1); }
    }
    @keyframes lungeUpPlayer {
      0% { transform: translateY(0) scale(1); }
      45% { transform: translateY(-42px) scale(1.15); box-shadow: 0 0 30px #f59e0b; }
      100% { transform: translateY(0) scale(1); }
    }
    .fx-attack-ai {
      animation: lungeDownAI 0.55s ease-in-out !important;
      z-index: 30 !important;
    }
    .fx-attack-player {
      animation: lungeUpPlayer 0.55s ease-in-out !important;
      z-index: 30 !important;
    }

    /* เอฟเฟกต์เป้าหมายถูกโจมตีหรือถูกทำลาย */
    @keyframes targetHitShake {
      0%, 100% { transform: translateX(0); }
      20% { transform: translateX(-10px) rotate(-3deg); filter: brightness(2) sepia(1) hue-rotate(-50deg) saturate(5); }
      40% { transform: translateX(10px) rotate(3deg); }
      60% { transform: translateX(-8px); }
      80% { transform: translateX(8px); }
    }
    .fx-target-hit {
      animation: targetHitShake 0.55s ease-in-out !important;
      box-shadow: 0 0 32px #dc2626 !important;
    }

    /* แบนเนอร์โชว์การ์ด/สกิลกลางจอ (Cut-in Showcase) */
    #fx-card-cutin-banner {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) scale(0.85);
      z-index: 350;
      background: linear-gradient(135deg, rgba(15, 23, 42, 0.96), rgba(30, 41, 59, 0.96));
      border: 2px solid #fbbf24;
      border-radius: 16px;
      padding: 14px 22px;
      display: none;
      align-items: center;
      gap: 16px;
      box-shadow: 0 15px 40px rgba(0, 0, 0, 0.85), 0 0 30px rgba(251, 191, 36, 0.5);
      pointer-events: none;
      transition: opacity 0.25s ease, transform 0.25s ease;
      opacity: 0;
      min-width: 290px;
      max-width: 90vw;
    }
    #fx-card-cutin-banner.show {
      display: flex;
      opacity: 1;
      transform: translate(-50%, -50%) scale(1);
    }
    #fx-card-cutin-banner img {
      width: 72px;
      height: 100px;
      object-fit: cover;
      border-radius: 8px;
      border: 2px solid #38bdf8;
      flex-shrink: 0;
    }
    .cutin-info-actor {
      font-size: 11px;
      font-weight: bold;
      color: #38bdf8;
      letter-spacing: 0.5px;
      margin-bottom: 2px;
    }
    .cutin-info-title {
      font-size: 17px;
      font-weight: 900;
      color: #fbbf24;
      margin-bottom: 4px;
    }
    .cutin-info-sub {
      font-size: 13px;
      color: #f8fafc;
      line-height: 1.35;
    }
  `;
  document.head.appendChild(style);

  if (!document.getElementById('fx-card-cutin-banner')) {
    const banner = document.createElement('div');
    banner.id = 'fx-card-cutin-banner';
    banner.innerHTML = `
      <img id="cutin-img" src="" alt="Card">
      <div>
        <div class="cutin-info-actor" id="cutin-actor">ACTION</div>
        <div class="cutin-info-title" id="cutin-title">Card Name</div>
        <div class="cutin-info-sub" id="cutin-sub">Effect description</div>
      </div>
    `;
    document.body.appendChild(banner);
  }
}

let cutinTimeoutId = null;
function showCardShowcaseBanner(card, actorName, actionSubText, borderColor = '#fbbf24', duration = 1050) {
  if (!card) return;
  ensureVisualEffectsStyles();
  const banner = document.getElementById('fx-card-cutin-banner');
  if (!banner) return;

  document.getElementById('cutin-img').src = card.image || '';
  document.getElementById('cutin-actor').textContent = `⚡ ${actorName}`;
  document.getElementById('cutin-title').textContent = card.name;
  document.getElementById('cutin-sub').textContent = actionSubText;
  banner.style.borderColor = borderColor;

  if (cutinTimeoutId) clearTimeout(cutinTimeoutId);
  banner.classList.add('show');
  cutinTimeoutId = setTimeout(() => {
    banner.classList.remove('show');
  }, duration);
}

function getSlotElement(isPlayerSide, slotIndex) {
  if (slotIndex === 'leader' || slotIndex === null) {
    return document.getElementById(isPlayerSide ? 'player-leader-box' : 'ai-leader-box');
  }
  const boardId = isPlayerSide ? 'player-board' : 'ai-board';
  const boardEl = document.getElementById(boardId);
  if (!boardEl) return null;
  const slots = boardEl.querySelectorAll('.slot');
  return slots[slotIndex] || null;
}

function playSlotAnimation(isPlayerSide, slotIndex, cssClass, duration = 650) {
  ensureVisualEffectsStyles();
  const slotEl = getSlotElement(isPlayerSide, slotIndex);
  if (!slotEl) return;
  const targetEl = (slotIndex !== 'leader' && slotIndex !== null && slotEl.querySelector('.card'))
    ? slotEl.querySelector('.card')
    : slotEl;

  targetEl.classList.remove(cssClass);
  void targetEl.offsetWidth; // รีเซ็ตแอนิเมชันให้เล่นซ้ำได้ทันที
  targetEl.classList.add(cssClass);
  setTimeout(() => {
    targetEl.classList.remove(cssClass);
  }, duration);
}

function playAttackVisualAnimation(attacker, defender, attackerSlot, targetType, targetSlot, onAnimDone) {
  ensureVisualEffectsStyles();
  const isAttackerPlayer = (attacker === gameState.player);
  const isDefenderPlayer = (defender === gameState.player);
  const attackerMonster = attacker.board[attackerSlot];

  if (attackerMonster) {
    const targetName = targetType === 'leader'
      ? `Leader (${defender.leader.name})`
      : (defender.board[targetSlot] ? defender.board[targetSlot].name : 'เป้าหมาย');
    showCardShowcaseBanner(
      attackerMonster,
      `${attacker.name} ประกาศโจมตี!`,
      `⚔️ "${attackerMonster.name}" โจมตีใส่ ${targetName}!`,
      '#ef4444',
      800
    );
  }

  playSlotAnimation(isAttackerPlayer, attackerSlot, isAttackerPlayer ? 'fx-attack-player' : 'fx-attack-ai', 600);
  const defTargetSlot = (targetType === 'leader') ? 'leader' : targetSlot;
  setTimeout(() => {
    playSlotAnimation(isDefenderPlayer, defTargetSlot, 'fx-target-hit', 600);
  }, 200);

  setTimeout(() => {
    if (onAnimDone) onAnimDone();
  }, 680);
}

// ฟังก์ชันหลักเมื่อสั่งโจมตี (เพิ่มแอนิเมชันพุ่งโจมตีก่อนประมวลผล)
function executeAttack(attacker, defender, attackerSlot, targetType, targetSlot, onCompleteCallback = null) {
  const attackingMonster = attacker.board[attackerSlot];
  const check = canContestantAttack(attacker, attackingMonster);
  if (!check.allowed) {
    if (onCompleteCallback) onCompleteCallback();
    return;
  }

  attackingMonster.state = 'Rest';
  attacker.attacksThisTurn += 1;
  gameState.selectedAttackerSlot = null;

  // เล่นแอนิเมชันพุ่งโจมตีให้ผู้เล่นเห็นก่อน
  playAttackVisualAnimation(attacker, defender, attackerSlot, targetType, targetSlot, () => {
    // 🌐 กรณีโหมด PvP และเราเป็นคนสั่งโจมตี: ส่งคำสั่งไปให้เครื่องของเพื่อนเป็นคนเลือกป้องกันเอง
    if (typeof pvpState !== 'undefined' && pvpState.isMultiplayer && attacker === gameState.player) {
      pvpState.waitingForDefense = true;
      disableControls();
      _originalSetLog(`⚔️ สั่ง "${attackingMonster.name}" โจมตีแล้ว — ⏳ รอฝ่ายตรงข้ามตัดสินใจป้องกัน...`);
      _originalRenderGame();

      sendPvpPacket({
        type: 'DECLARE_ATTACK',
        attackerSlot,
        targetType,
        targetSlot,
        senderData: gameState.player,
        receiverData: gameState.ai
      });
      return;
    }

    checkDefenderAttackReactions(attacker, defender, attackerSlot, targetType, targetSlot, onCompleteCallback);
  });
}

function checkDefenderAttackReactions(attacker, defender, attackerSlot, targetType, targetSlot, onCompleteCallback) {
  const attackingMonster = attacker.board[attackerSlot];
  if (!attackingMonster) {
    if (onCompleteCallback) onCompleteCallback();
    return;
  }

  const isLocalDefender = (defender === gameState.player);

  const continueNormalAttackFlow = () => {
    if (targetType === 'monster') {
      const msg = compareAndDestroyMonsters(attacker, attackerSlot, defender, targetSlot);
      setLog(`⚔️ [${attacker.name}] สั่ง "${attackingMonster.name}" โจมตี! -> ${msg}`);
      renderGame();
      checkGameOver();
      if (onCompleteCallback) onCompleteCallback();
    } else {
      checkWhenLeaderAttacked(attacker, defender, attackerSlot, onCompleteCallback);
    }
  };

  const canUseMayaOnce = defender.board.some(m => m !== null && m.id === 'DM03')
    && !defender.mayaOncePerGameUsed
    && defender.deck.length > 0;

  const nonSpellsInGrave = defender.graveyard.filter(c => c.type === 'Monster');
  const ds02InHandIdx = defender.hand.findIndex(c => c.id === 'DS02');
  const canUseWeWillHelp = (ds02InHandIdx !== -1)
    && (nonSpellsInGrave.length >= 5)
    && (defender.spellQuota.reactionUsed < 1);

  // 🤖 กรณีฝ่ายตั้งรับเป็น AI: ให้ AI ตัดสินใจใช้สกิลเองพร้อมโชว์แบนเนอร์ให้ผู้เล่นเห็นชัดๆ
  if (!isLocalDefender) {
    if (canUseWeWillHelp && (targetType === 'leader' || defender.leader.hp <= 3)) {
      const spellCard = defender.hand.splice(ds02InHandIdx, 1)[0];
      defender.spellQuota.reactionUsed += 1;
      let returnedCount = 0;
      for (let i = defender.graveyard.length - 1; i >= 0 && returnedCount < 5; i--) {
        if (defender.graveyard[i].type === 'Monster') {
          const unit = defender.graveyard.splice(i, 1)[0];
          resetCardStateForZoneChange(unit);
          defender.deck.push(unit);
          returnedCount += 1;
        }
      }
      defender.deck = shuffleDeck(defender.deck);
      defender.graveyard.push(spellCard);

      showCardShowcaseBanner(spellCard, 'AI ใช้เวทย์ป้องกัน!', 'นำยูนิต 5 ใบในนรกเข้ากอง และยกเลิกการโจมตี!', '#a855f7', 1200);

      if (attackingMonster.id === 'DM06') {
        const atkRoll = Math.floor(Math.random() * 6) + 1;
        const defRoll = Math.floor(Math.random() * 6) + 1;
        if (atkRoll < defRoll) {
          setLog(`🎲 [ออโต้ - โซเนบุ] โซเนบุทอยได้ [${atkRoll}] ชนะ AI [${defRoll}] -> เวทย์ "พวกเราจะช่วยเอง" ของ AI ไร้ผล!`);
          renderGame();
          continueNormalAttackFlow();
          return;
        }
      }
      setLog(`🛡️ [AI - พวกเราจะช่วยเอง] AI นำยูนิต 5 ใบในนรกกลับเข้ากอง — ยกเลิกการโจมตีของคุณ!`);
      renderGame();
      if (onCompleteCallback) onCompleteCallback();
      return;
    }

    if (canUseMayaOnce && targetType === 'leader' && defender.leader.hp <= 2) {
      defender.mayaOncePerGameUsed = true;
      const mayaCard = defender.board.find(m => m && m.id === 'DM03');
      const topCard = defender.deck[defender.deck.length - 1];
      showCardShowcaseBanner(mayaCard, 'AI สั่งใช้สกิล 1 เกม!', `เปิดท็อปกองได้ "${topCard ? topCard.name : '-'}"`, '#7c3aed', 1200);

      if (topCard && topCard.id === 'DM06') {
        setLog(`🔮 [AI มายอา - 1 เกม] เปิดท็อปกองพบ "โซเนบุ"! บังคับจบเทิร์นของคุณทันที!`);
        renderGame();
        triggerPlayerPassTurn();
        return;
      } else {
        setLog(`🔮 [AI มายอา - 1 เกม] AI เปิดท็อปกองได้ "${topCard ? topCard.name : '-'}" (ไม่ใช่โซเนบุ การโจมตีดำเนินต่อ)`);
        renderGame();
      }
    }

    continueNormalAttackFlow();
    return;
  }

  // 👤 กรณีเราเป็นฝ่ายถูกโจมตี: เด้งถามเฉพาะการ์ดของเราเอง
  if (canUseMayaOnce || canUseWeWillHelp) {
    const options = [];

    if (canUseMayaOnce) {
      options.push({
        label: '🔮 สั่งใช้สกิล 1 เกมของ "มายอา": เปิดท็อปกอง 1 ใบ ถ้าเป็น "โซเนบุ" อีกฝ่ายจบเทิร์นทันที!',
        color: '#7c3aed',
        onSelect: () => {
          defender.mayaOncePerGameUsed = true;
          const topCard = defender.deck[defender.deck.length - 1];
          if (topCard && topCard.id === 'DM06') {
            setLog(`🔮 [มายอา - 1 เกม] เปิดท็อปกองพบ "${topCard.name}"! บังคับให้ฝ่ายตรงข้ามจบเทิร์นทันที!`);
            renderGame();
            if (typeof pvpState !== 'undefined' && pvpState.isMultiplayer) {
              if (onCompleteCallback) onCompleteCallback('FORCE_END_TURN');
            } else {
              endAITurn();
            }
          } else {
            setLog(`🔮 [มายอา - 1 เกม] เปิดท็อปกองได้ "${topCard ? topCard.name : '-'}" (ไม่ใช่โซเนบุ การโจมตีดำเนินต่อ)`);
            renderGame();
            continueNormalAttackFlow();
          }
        }
      });
    }

    if (canUseWeWillHelp) {
      options.push({
        label: '🛡️ ใช้การ์ด "พวกเราจะช่วยเอง": นำยูนิต 5 ใบในนรกกลับเข้ากอง แล้วยกเลิกการโจมตี!',
        color: '#0284c7',
        onSelect: () => {
          const spellCard = defender.hand.splice(ds02InHandIdx, 1)[0];
          defender.spellQuota.reactionUsed += 1;

          let returnedCount = 0;
          for (let i = defender.graveyard.length - 1; i >= 0 && returnedCount < 5; i--) {
            if (defender.graveyard[i].type === 'Monster') {
              const unit = defender.graveyard.splice(i, 1)[0];
              resetCardStateForZoneChange(unit);
              defender.deck.push(unit);
              returnedCount += 1;
            }
          }
          defender.deck = shuffleDeck(defender.deck);
          defender.graveyard.push(spellCard);

          if (attackingMonster.id === 'DM06') {
            const atkRoll = Math.floor(Math.random() * 6) + 1;
            const defRoll = Math.floor(Math.random() * 6) + 1;
            if (atkRoll < defRoll) {
              setLog(`🎲 [ออโต้ - โซเนบุ] โซเนบุทอยได้ [${atkRoll}] น้อยกว่าคุณ [${defRoll}] -> โซเนบุชนะ! เวทย์ "พวกเราจะช่วยเอง" ไร้ผล!`);
              renderGame();
              continueNormalAttackFlow();
              return;
            }
            setLog(`🎲 [ออโต้ - โซเนบุ] คุณทอยได้ [${defRoll}] น้อยกว่าหรือเท่ากับโซเนบุ [${atkRoll}] -> ยกเลิกการโจมตีสำเร็จ!`);
          } else {
            setLog('🛡️ [พวกเราจะช่วยเอง] นำยูนิต 5 ใบในนรกกลับเข้ากองและสับกอง — ยกเลิกการโจมตีสำเร็จ!');
          }
          renderGame();
          if (onCompleteCallback) onCompleteCallback();
        }
      });
    }

    options.push({
      label: 'ไม่ใช้ (ดำเนินการป้องกันตามปกติ)',
      color: '#475569',
      onSelect: () => continueNormalAttackFlow()
    });

    showChoiceModal(
      '⚡ ฝ่ายตรงข้ามประกาศโจมตี!',
      `"${attackingMonster.name}" กำลังโจมตีเข้ามา! คุณต้องการเปิดใช้ความสามารถการ์ดของคุณเพื่อตอบโต้หรือไม่?`,
      options
    );
    return;
  }

  continueNormalAttackFlow();
}

function checkWhenLeaderAttacked(attacker, defender, attackerSlot, onCompleteCallback) {
  const attackingMonster = attacker.board[attackerSlot];
  if (!attackingMonster) {
    if (onCompleteCallback) onCompleteCallback();
    return;
  }

  const isLocalDefender = (defender === gameState.player);

  const canUseAllForJit = defender.leader.hp <= 2
    && !defender.allForJitUsed
    && defender.graveyard.some(c => c.id === 'M04');

  const canUseAllJit = defender.hand.some(c => c.id === 'M03')
    && defender.board.some(m => m === null);

  if (!isLocalDefender) {
    if (canUseAllForJit) {
      resolveAllForJitTrigger(attacker, defender, attackerSlot, onCompleteCallback);
      return;
    }
    if (canUseAllJit) {
      resolveAllJitFromHand(attacker, defender, attackerSlot, onCompleteCallback);
      return;
    }
    proceedToStandardIntercept(attacker, defender, attackerSlot, onCompleteCallback);
    return;
  }

  if (canUseAllForJit || canUseAllJit) {
    const options = [];
    if (canUseAllForJit) {
      options.push({
        label: '💀 สั่งใช้ "ออลฟอจิต" จากนรก (1 ครั้ง/เกม: ล้างกระดานทุกฝ่ายและอัญเชิญออลฟอจิตลงสนาม!)',
        color: '#dc2626',
        onSelect: () => resolveAllForJitTrigger(attacker, defender, attackerSlot, onCompleteCallback)
      });
    }
    if (canUseAllJit) {
      options.push({
        label: '🛡️ สั่งใช้ "ออลจิต" จากบนมือ (อัญเชิญลงสนามและเปลี่ยนเป้าหมายโจมตีมาที่ออลจิต)',
        color: '#0284c7',
        onSelect: () => resolveAllJitFromHand(attacker, defender, attackerSlot, onCompleteCallback)
      });
    }
    options.push({
      label: 'ไม่ใช้ความสามารถพิเศษ (ไปสู่ขั้นตอนเลือก Intercept ตามปกติ)',
      color: '#475569',
      onSelect: () => proceedToStandardIntercept(attacker, defender, attackerSlot, onCompleteCallback)
    });

    showChoiceModal(
      '⚠️ ลีดเดอร์ของคุณกำลังถูกโจมตี!',
      `"${attackingMonster.name}" (Power ${getEffectivePower(attackingMonster, attacker)}) กำลังโจมตีลีดเดอร์ของคุณ! ต้องการสั่งใช้ความสามารถการ์ดของคุณหรือไม่?`,
      options
    );
    return;
  }

  proceedToStandardIntercept(attacker, defender, attackerSlot, onCompleteCallback);
}

function resolveAllForJitTrigger(attacker, defender, attackerSlot, onCompleteCallback) {
  const idx = defender.graveyard.findIndex(c => c.id === 'M04');
  if (idx === -1) {
    proceedToStandardIntercept(attacker, defender, attackerSlot, onCompleteCallback);
    return;
  }

  defender.allForJitUsed = true;
  const allForJitCard = defender.graveyard.splice(idx, 1)[0];
  resetCardStateForZoneChange(allForJitCard);
  allForJitCard.state = 'Stand';

  showCardShowcaseBanner(allForJitCard, `${defender.name} ปลุกออลฟอจิตจากนรก!`, '💀 ทำลายยูนิตทุกใบบนสนามและอัญเชิญลงสนาม!', '#dc2626', 1300);

  for (let i = 0; i < 3; i++) {
    if (defender.board[i]) destroyBoardMonster(defender, i, false, true);
    if (attacker.board[i]) destroyBoardMonster(attacker, i, false, true);
  }

  const emptySlot = defender.board.findIndex(m => m === null);
  if (emptySlot !== -1) {
    defender.board[emptySlot] = allForJitCard;
  }

  setLog(`💀 [${defender.name}] สั่งใช้งาน "ออลฟอจิต" จากนรก! ทำลายการ์ดบนสนามและอัญเชิญ "ออลฟอจิต" (Power 3) ลงสู่สนามสำเร็จ!`);
  renderGame();
  if (emptySlot !== -1) playSlotAnimation(defender === gameState.player, emptySlot, 'fx-summon-drop');
  checkGameOver();
  if (onCompleteCallback) onCompleteCallback();
}

function resolveAllJitFromHand(attacker, defender, attackerSlot, onCompleteCallback) {
  const handIdx = defender.hand.findIndex(c => c.id === 'M03');
  const emptySlot = defender.board.findIndex(m => m === null);
  if (handIdx === -1 || emptySlot === -1) {
    proceedToStandardIntercept(attacker, defender, attackerSlot, onCompleteCallback);
    return;
  }

  const allJitCard = defender.hand.splice(handIdx, 1)[0];
  resetCardStateForZoneChange(allJitCard);
  allJitCard.state = 'Stand';
  defender.board[emptySlot] = allJitCard;

  showCardShowcaseBanner(allJitCard, `${defender.name} ส่งออลจิตโดดบัง!`, '🛡️ อัญเชิญจากมือลงมารับการโจมตีแทน Leader!', '#0284c7', 1100);

  const combatMsg = compareAndDestroyMonsters(attacker, attackerSlot, defender, emptySlot);
  setLog(`🛡️ [${defender.name}] อัญเชิญ "ออลจิต" จากบนมือลงสนามและเปลี่ยนเป้าหมายการโจมตีมาที่ตัวเอง! -> ${combatMsg}`);
  renderGame();
  checkGameOver();
  if (onCompleteCallback) onCompleteCallback();
}

function proceedToStandardIntercept(attacker, defender, attackerSlot, onCompleteCallback) {
  const attackingMonster = attacker.board[attackerSlot];
  if (!attackingMonster) {
    if (onCompleteCallback) onCompleteCallback();
    return;
  }

  const isLocalDefender = (defender === gameState.player);

  const standBlockerSlots = defender.board
    .map((m, idx) => (m && m.state === 'Stand' ? idx : null))
    .filter(idx => idx !== null);

  if (standBlockerSlots.length === 0) {
    defender.leader.hp = Math.max(0, defender.leader.hp - 1);
    setLog(`💥 "${attackingMonster.name}" โจมตีเข้าใส่ Leader ของ ${defender.name} โดยตรง! (เสีย 1 HP เหลือ ${defender.leader.hp}/6)`);
    renderGame();
    playSlotAnimation(isLocalDefender, 'leader', 'fx-target-hit');
    checkGameOver();
    if (onCompleteCallback) onCompleteCallback();
    return;
  }

  if (!isLocalDefender) {
    const atkPower = getEffectivePower(attackingMonster, attacker);
    const validAiBlockers = standBlockerSlots.filter(idx => defender.board[idx].id !== 'NM05');
    let chosenSlot = validAiBlockers.find(idx => getEffectivePower(defender.board[idx], defender) >= atkPower);
    if (chosenSlot === undefined && defender.leader.hp <= 2 && validAiBlockers.length > 0) {
      chosenSlot = validAiBlockers[0];
    }

    if (chosenSlot !== undefined) {
      const blocker = defender.board[chosenSlot];
      blocker.state = 'Rest';
      showCardShowcaseBanner(blocker, 'AI สั่งป้องกัน (Intercept)!', `🛡️ ส่ง "${blocker.name}" เข้ารับการโจมตีแทน Leader!`, '#38bdf8', 950);
      const msg = compareAndDestroyMonsters(attacker, attackerSlot, defender, chosenSlot);
      setLog(`🛡️ AI สั่ง "${blocker.name}" เข้ามา Intercept! -> ${msg}`);
    } else {
      defender.leader.hp = Math.max(0, defender.leader.hp - 1);
      setLog(`💥 AI เลือกไม่ป้องกัน! Leader ของ AI เสีย 1 HP (เหลือ ${defender.leader.hp}/6)`);
      playSlotAnimation(false, 'leader', 'fx-target-hit');
    }
    renderGame();
    checkGameOver();
    if (onCompleteCallback) onCompleteCallback();
  } else {
    openInterceptModal(attacker, attackerSlot, defender, standBlockerSlots, onCompleteCallback);
  }
}

function compareAndDestroyMonsters(contestantA, slotA, contestantB, slotB) {
  const monsterA = contestantA.board[slotA];
  const monsterB = contestantB.board[slotB];
  if (!monsterA || !monsterB) return '';

  const totalA = getEffectivePower(monsterA, contestantA);
  const totalB = getEffectivePower(monsterB, contestantB);

  if (totalA > totalB) {
    const hadBurn = !!monsterA.burnLeaderOnKill;
    const resB = destroyBoardMonster(contestantB, slotB, true, false);

    let burnMsg = '';
    if (resB.destroyed && hadBurn) {
      contestantB.leader.hp = Math.max(0, contestantB.leader.hp - 1);
      burnMsg = ` และสกิลออโต้ของ "${monsterA.name}" ทำดาเมจใส่ Leader อีกฝ่าย 1 หน่วย (เหลือ ${contestantB.leader.hp}/6)!`;
    }
    return `"${monsterA.name}" (${totalA}) ชนะ "${monsterB.name}" (${totalB})!${burnMsg}`;
  } else if (totalA < totalB) {
    destroyBoardMonster(contestantA, slotA, true, false);
    return `"${monsterB.name}" (${totalB}) พลังสูงกว่า! สวนกลับทำลาย "${monsterA.name}" (${totalA})!`;
  } else {
    const hadBurn = !!monsterA.burnLeaderOnKill;
    destroyBoardMonster(contestantA, slotA, true, false);
    const resB = destroyBoardMonster(contestantB, slotB, true, false);

    let burnMsg = '';
    if (resB.destroyed && hadBurn) {
      contestantB.leader.hp = Math.max(0, contestantB.leader.hp - 1);
      burnMsg = ` (สกิลออโต้ของ "${monsterA.name}" ทำดาเมจใส่ Leader อีกฝ่าย 1 หน่วย!)`;
    }
    return `พลังเท่ากัน (${totalA})! ปะทะกันทั้งสองฝ่าย!${burnMsg}`;
  }
}

function openInterceptModal(attacker, attackerSlot, defender, standBlockerSlots, onCompleteCallback) {
  gameState.pendingAttack = { attacker, attackerSlot, defender, onCompleteCallback };
  const attackerMonster = attacker.board[attackerSlot];
  const atkPwr = getEffectivePower(attackerMonster, attacker);

  document.getElementById('intercept-desc').textContent =
    `⚠️ "${attackerMonster.name}" (Power ${atkPwr}) กำลังโจมตี Leader ของคุณ! คลิกเลือก Monster ที่ Stand อยู่ฝั่งคุณเพื่อรับการโจมตีแทน:`;

  const listEl = document.getElementById('intercept-card-list');
  listEl.innerHTML = '';

  standBlockerSlots.forEach(slotIdx => {
    const blocker = defender.board[slotIdx];
    const cardEl = createCardElement(blocker, defender);
    cardEl.addEventListener('click', () => resolvePlayerIntercept(slotIdx));
    listEl.appendChild(cardEl);
  });

  document.getElementById('intercept-modal').style.display = 'flex';
}

function resolvePlayerIntercept(chosenSlotIndex) {
  document.getElementById('intercept-modal').style.display = 'none';
  const pending = gameState.pendingAttack;
  if (!pending) return;
  gameState.pendingAttack = null;

  const { attacker, attackerSlot, defender, onCompleteCallback } = pending;

  if (chosenSlotIndex !== null) {
    const blocker = defender.board[chosenSlotIndex];
    blocker.state = 'Rest';
    const msg = compareAndDestroyMonsters(attacker, attackerSlot, defender, chosenSlotIndex);
    setLog(`🛡️ คุณส่ง "${blocker.name}" เข้า Intercept! -> ${msg}`);
  } else {
    defender.leader.hp = Math.max(0, defender.leader.hp - 1);
    setLog(`💥 คุณเลือกไม่ป้องกัน! Leader ของคุณเสีย 1 HP (เหลือ ${defender.leader.hp}/6)`);
    playSlotAnimation(true, 'leader', 'fx-target-hit');
  }

  renderGame();
  checkGameOver();
  if (onCompleteCallback) onCompleteCallback();
}

document.getElementById('btn-skip-intercept').addEventListener('click', () => {
  resolvePlayerIntercept(null);
});


/* ============================================================================
   หมวดที่ 8: ระบบตั้งค่า AI และระบบคิวการเล่นทีละจังหวะของ AI (Step-by-Step Pacing)
   ============================================================================ */
const aiConfig = {
  deckChoice: 'RANDOM', // 'RANDOM' | 'L01' | 'L02' | 'L03'
  difficulty: 'HARD',   // 'EASY' | 'NORMAL' | 'HARD'
  stepDelayMs: 1200     // หน่วงเวลา 1.2 วินาทีต่อ 1 แอ็กชันของ AI เพื่อให้ผู้เล่นมองตามทัน
};

function getAIDifficultyLabel(diff) {
  if (diff === 'EASY') return '🟢 ง่าย (Easy)';
  if (diff === 'NORMAL') return '🟡 ปานกลาง (Normal)';
  return '🔴 ยาก (Hard)';
}

function openAISetupModal() {
  let modal = document.getElementById('ai-setup-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'ai-setup-modal';
    modal.className = 'modal-overlay';
    modal.style.display = 'none';
    modal.style.zIndex = '240';
    modal.innerHTML = `
      <div class="modal-box" style="max-width: 520px; text-align: left;">
        <h2 style="color: #38bdf8; text-align: center; margin-bottom: 6px;">🤖 ตั้งค่าการดวลกับบอท (AI Settings)</h2>
        <p style="color: #94a3b8; font-size: 13px; text-align: center; margin-bottom: 16px;">
          เลือกระดับความยากและเด็คของ AI ที่ต้องการฝึกซ้อม
        </p>

        <div style="margin-bottom: 16px;">
          <div style="font-weight: bold; color: #fbbf24; margin-bottom: 8px; font-size: 14px;">⚙️ 1. เลือกระดับความยากของ AI:</div>
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px;" id="ai-diff-buttons">
            <button class="btn ai-diff-btn" data-diff="EASY" style="padding: 10px 6px; font-size: 13px;">🟢 ง่าย<br><span style="font-size:10px; font-weight:normal;">ไม่ใช้คอมโบ</span></button>
            <button class="btn ai-diff-btn" data-diff="NORMAL" style="padding: 10px 6px; font-size: 13px;">🟡 ปานกลาง<br><span style="font-size:10px; font-weight:normal;">ใช้สกิลพื้นฐาน</span></button>
            <button class="btn ai-diff-btn" data-diff="HARD" style="padding: 10px 6px; font-size: 13px;">🔴 ยาก<br><span style="font-size:10px; font-weight:normal;">จัดเต็มทุกคอมโบ</span></button>
          </div>
        </div>

        <div style="margin-bottom: 20px;">
          <div style="font-weight: bold; color: #38bdf8; margin-bottom: 8px; font-size: 14px;">🃏 2. เลือกเด็คของ AI:</div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;" id="ai-deck-buttons">
            <button class="btn ai-deck-btn" data-deck="RANDOM" style="padding: 10px; font-size: 13px;">🎲 สุ่มเด็ค (Random)</button>
            <button class="btn ai-deck-btn" data-deck="L01" style="padding: 10px; font-size: 13px;">🔥 เด็คจิต</button>
            <button class="btn ai-deck-btn" data-deck="L02" style="padding: 10px; font-size: 13px;">🐘 เด็คเหนือ</button>
            <button class="btn ai-deck-btn" data-deck="L03" style="padding: 10px; font-size: 13px;">⏳ เด็ควันสิ้นโลก</button>
          </div>
        </div>

        <div style="display: flex; gap: 10px;">
          <button class="btn" id="btn-start-ai-match" style="flex: 2; background: #16a34a; padding: 12px; font-size: 15px;">⚔️ เริ่มเกมเลย!</button>
          <button class="btn" id="btn-cancel-ai-setup" style="flex: 1; background: #475569; padding: 12px;">ยกเลิก</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    modal.querySelectorAll('.ai-diff-btn').forEach(btn => {
      btn.onclick = () => {
        aiConfig.difficulty = btn.getAttribute('data-diff');
        refreshAISetupModalUI();
      };
    });

    modal.querySelectorAll('.ai-deck-btn').forEach(btn => {
      btn.onclick = () => {
        aiConfig.deckChoice = btn.getAttribute('data-deck');
        refreshAISetupModalUI();
      };
    });

    document.getElementById('btn-cancel-ai-setup').onclick = () => {
      modal.style.display = 'none';
    };

    document.getElementById('btn-start-ai-match').onclick = () => {
      modal.style.display = 'none';
      pvpState.isMultiplayer = false;
      pvpState.waitingForDefense = false;
      document.getElementById('lobby-screen').style.display = 'none';
      document.querySelector('.game-container').style.display = 'flex';
      initGame();
    };
  }

  refreshAISetupModalUI();
  modal.style.display = 'flex';
}

function refreshAISetupModalUI() {
  const modal = document.getElementById('ai-setup-modal');
  if (!modal) return;

  modal.querySelectorAll('.ai-diff-btn').forEach(btn => {
    const isSelected = btn.getAttribute('data-diff') === aiConfig.difficulty;
    btn.style.background = isSelected ? '#dc2626' : '#1e293b';
    btn.style.border = isSelected ? '2px solid #fbbf24' : '1px solid #475569';
  });

  modal.querySelectorAll('.ai-deck-btn').forEach(btn => {
    const isSelected = btn.getAttribute('data-deck') === aiConfig.deckChoice;
    btn.style.background = isSelected ? '#2563eb' : '#1e293b';
    btn.style.border = isSelected ? '2px solid #38bdf8' : '1px solid #475569';
  });
}

function setupInGameControlBar() {
  ['btn-next-phase', 'btn-end-turn', 'btn-open-deck', 'btn-back-lobby'].forEach(btnId => {
    const el = document.getElementById(btnId);
    if (el) el.style.display = 'none';
  });

  const parentGroup = document.getElementById('btn-open-deck')?.parentElement;
  if (!parentGroup) return;

  if (!document.getElementById('btn-surrender-match')) {
    const nextPhaseBtn = document.createElement('button');
    nextPhaseBtn.id = 'btn-pass-turn-inline';
    nextPhaseBtn.className = 'btn';
    nextPhaseBtn.style.background = '#0284c7';
    nextPhaseBtn.style.marginRight = '8px';
    nextPhaseBtn.textContent = '⚔️ เฟสถัดไป (Battle Phase)';
    nextPhaseBtn.onclick = () => handleNextPhaseButtonClick();
    parentGroup.appendChild(nextPhaseBtn);

    const surrenderBtn = document.createElement('button');
    surrenderBtn.id = 'btn-surrender-match';
    surrenderBtn.className = 'btn';
    surrenderBtn.style.background = '#dc2626';
    surrenderBtn.textContent = '🏳️ ยอมแพ้';
    surrenderBtn.onclick = () => handlePlayerSurrender();
    parentGroup.appendChild(surrenderBtn);
  }
}

function handleNextPhaseButtonClick() {
  if (gameState.activeTurn !== 'player' || gameState.gameOver || gameState.isRollingDice) return;
  if (typeof pvpState !== 'undefined' && pvpState.waitingForDefense) {
    setLog('⏳ กรุณารอฝ่ายตรงข้ามเลือกการป้องกันให้เสร็จก่อน!');
    return;
  }
  if (gameState.pendingAction) {
    setLog('⚠️ กรุณาเลือกเป้าหมายของความสามารถที่ค้างอยู่ให้เสร็จก่อนเปลี่ยนเฟส!');
    return;
  }

  if (gameState.phase === 'Main Phase') {
    gameState.phase = 'Battle Phase';
    gameState.selectedHandIndex = null;
    gameState.selectedAttackerSlot = null;

    if (gameState.player.isFirstPlayer && gameState.player.turnsTaken === 1) {
      setLog('⚔️ เข้าสู่ Battle Phase (Turn 1 ของผู้เล่นคนแรกไม่สามารถโจมตีได้ — กด "เฟสถัดไป (จบเทิร์น)" ได้เลย)');
    } else {
      setLog('⚔️ เข้าสู่ Battle Phase: คลิกเลือกยูนิตที่ Stand ของคุณเพื่อสั่งโจมตี หรือกด "เฟสถัดไป (จบเทิร์น)"!');
    }
    renderGame();
    return;
  }

  if (gameState.phase === 'Battle Phase') {
    triggerPlayerPassTurn();
  }
}

function handlePlayerSurrender() {
  if (gameState.gameOver) {
    returnToLobbyScreen();
    return;
  }

  showChoiceModal(
    '🏳️ ยืนยันการยอมแพ้',
    'คุณต้องการยอมแพ้ในแมตช์นี้และออกจากกระดานใช่หรือไม่?',
    [
      {
        label: '🏳️ ยืนยันยอมแพ้',
        color: '#dc2626',
        onSelect: () => {
          gameState.player.leader.hp = 0;
          gameState.gameOver = true;
          setLog('🏳️ คุณประกาศยอมแพ้ในแมตช์นี้!');
          renderGame();
          if (typeof pvpState !== 'undefined' && pvpState.isMultiplayer) {
            syncBoardToOpponent('🏳️ ฝ่ายตรงข้ามประกาศยอมแพ้! คุณเป็นฝ่ายชนะ!');
          }
          checkGameOver();
        }
      },
      {
        label: '❌ เล่นต่อ',
        color: '#475569',
        onSelect: () => renderGame()
      }
    ]
  );
}

function triggerPlayerPassTurn() {
  if (gameState.activeTurn !== 'player' || gameState.gameOver || gameState.isRollingDice) return;
  if (typeof pvpState !== 'undefined' && pvpState.waitingForDefense) {
    setLog('⏳ กรุณารอฝ่ายตรงข้ามเลือกการป้องกันให้เสร็จก่อน!');
    return;
  }
  if (gameState.pendingAction) {
    setLog('⚠️ กรุณาเลือกเป้าหมายของความสามารถที่ค้างอยู่ให้เสร็จก่อน!');
    return;
  }

  executeEndPhaseCleanup(gameState.player);
  gameState.phase = 'End Phase';
  gameState.selectedHandIndex = null;
  gameState.selectedAttackerSlot = null;
  disableControls();

  if (typeof pvpState !== 'undefined' && pvpState.isMultiplayer) {
    gameState.activeTurn = 'ai';
    _originalSetLog('⏭️ จบเทิร์น — ส่งเทิร์นให้เพื่อนของคุณ!');
    _originalRenderGame();

    sendPvpPacket({
      type: 'PASS_TURN',
      nextTurnCount: gameState.turnCount + 1,
      senderData: gameState.player,
      receiverData: gameState.ai
    });
    return;
  }

  renderGame();
  setTimeout(startAITurn, 800);
}

function startAITurn() {
  if (gameState.gameOver) return;
  gameState.activeTurn = 'ai';
  gameState.turnCount += 1;
  gameState.phase = 'Start Phase';

  setLog(`🤖 เทิร์นของ ${gameState.ai.name}: จั่วการ์ด 1 ใบ และเปลี่ยนยูนิททั้งหมดเป็น Stand`);
  executeStartPhase(gameState.ai, () => {
    renderGame();
    setTimeout(() => {
      if (gameState.gameOver) return;
      gameState.phase = 'Main Phase';
      renderGame();
      // เริ่มรันแอ็กชันใน Main Phase ของ AI ทีละ 1 สเต็ป
      setTimeout(() => aiPlayMainPhase(onAIMainPhaseDone), 900);
    }, 1000);
  });
}

function onAIMainPhaseDone() {
  if (gameState.gameOver) return;
  setTimeout(() => {
    if (gameState.gameOver) return;
    gameState.phase = 'Battle Phase';
    setLog('⚔️ AI เข้าสู่ Battle Phase เตรียมสั่งยูนิตโจมตี!');
    renderGame();
    setTimeout(() => aiPlayBattlePhase(0), 1000);
  }, 900);
}

// ⏳ สมองกล AI ช่วง Main Phase แบบทีละสเต็ป (ทำ 1 อย่าง -> แสดงเอฟเฟกต์ -> รอ 1.2 วินาที -> ทำอย่างถัดไป)
function aiPlayMainPhase(onMainComplete) {
  if (gameState.gameOver) return;
  const didAction = performSingleAIMainAction();
  if (didAction) {
    setTimeout(() => {
      aiPlayMainPhase(onMainComplete);
    }, aiConfig.stepDelayMs);
  } else {
    onMainComplete();
  }
}

// ค้นหาและลงมือทำแอ็กชันของ AI เพียง 1 อย่างต่อครั้ง (คืนค่า true ถ้าทำสำเร็จ, คืนค่า false ถ้าไม่มีอะไรทำต่อแล้ว)
function performSingleAIMainAction() {
  const ai = gameState.ai;
  const player = gameState.player;
  const diff = aiConfig.difficulty;

  // ==================== สเต็ปที่ 1: สกิลจากมือ (ไพร่ชาวนาเหนือ / สายลับ / จุติ) ====================
  if (diff !== 'EASY') {
    const peasantIdx = ai.hand.findIndex(c => c.id === 'NM01');
    const jutiInHand = ai.hand.some(c => c.id === 'NM02' || c.id === 'NM03');
    const peasantCount = ai.hand.filter(c => c.id === 'NM01').length;

    if (peasantIdx !== -1 && (!jutiInHand || peasantCount >= 2)) {
      const spyAvailable = ai.deck.some(c => c.id === 'NM05') || ai.graveyard.some(c => c.id === 'NM05');
      const emptyPlayerSlot = player.board.findIndex(m => m === null);
      if (diff === 'HARD' && spyAvailable && emptyPlayerSlot !== -1) {
        const discarded = ai.hand.splice(peasantIdx, 1)[0];
        resetCardStateForZoneChange(discarded);
        ai.graveyard.push(discarded);
        let spy = null;
        const gIdx = ai.graveyard.findIndex(c => c.id === 'NM05');
        if (gIdx !== -1) spy = ai.graveyard.splice(gIdx, 1)[0];
        else {
          const dIdx = ai.deck.findIndex(c => c.id === 'NM05');
          if (dIdx !== -1) { spy = ai.deck.splice(dIdx, 1)[0]; ai.deck = shuffleDeck(ai.deck); }
        }
        if (spy) {
          resetCardStateForZoneChange(spy);
          player.board[emptyPlayerSlot] = spy;
          showCardShowcaseBanner(spy, 'AI ใช้สกิลไพร่ชาวนาเหนือ!', '🕵️ ส่ง "สายลับไพร่เหนือ" มายึดช่องสนามของคุณ!', '#7c3aed');
          setLog('🕵️ [AI ไพร่ชาวนาเหนือ] ส่งตัวเองลงนรก และส่ง "สายลับไพร่เหนือ" มายึดช่องสนามของคุณ!');
          renderGame();
          playSlotAnimation(true, emptyPlayerSlot, 'fx-summon-drop');
          return true;
        }
      } else if (ai.deck.some(c => isSoldierCard(c))) {
        const discarded = ai.hand.splice(peasantIdx, 1)[0];
        resetCardStateForZoneChange(discarded);
        ai.graveyard.push(discarded);
        const sIdx = ai.deck.findIndex(c => isSoldierCard(c));
        if (sIdx !== -1) {
          const soldier = ai.deck.splice(sIdx, 1)[0];
          resetCardStateForZoneChange(soldier);
          ai.hand.push(soldier);
          ai.deck = shuffleDeck(ai.deck);
          showCardShowcaseBanner(discarded, 'AI ใช้สกิลไพร่ชาวนาเหนือ!', `🛡️ ค้นหา "${soldier.name}" จากกองขึ้นมือ!`, '#0284c7');
          setLog(`🛡️ [AI ไพร่ชาวนาเหนือ] ทิ้งตัวเองลงนรกและดึง "${soldier.name}" จากกองขึ้นมือ!`);
          renderGame();
          return true;
        }
      }
    }

    // ส่งสายลับไพร่เหนือ (NM05) จากมือไปยึดช่องว่างของผู้เล่นทีละใบ
    const spyHandIdx = ai.hand.findIndex(c => c.id === 'NM05' || c.isSpy);
    const targetPlayerSlot = player.board.findIndex(m => m === null);
    if (spyHandIdx !== -1 && targetPlayerSlot !== -1) {
      const spyCard = ai.hand.splice(spyHandIdx, 1)[0];
      resetCardStateForZoneChange(spyCard);
      player.board[targetPlayerSlot] = spyCard;
      showCardShowcaseBanner(spyCard, 'AI ส่งสายลับ!', `🕵️ ยึดช่องที่ ${targetPlayerSlot + 1} บนสนามของคุณ!`, '#7c3aed');
      setLog(`🕵️ AI ส่ง "สายลับไพร่เหนือ" ลงไปยึดช่องที่ ${targetPlayerSlot + 1} บนสนามของคุณ!`);
      renderGame();
      playSlotAnimation(true, targetPlayerSlot, 'fx-summon-drop');
      return true;
    }

    // อัญเชิญจุติ (เฉพาะระดับ HARD) ทีละใบ
    if (diff === 'HARD') {
      const emptyAiSlot = ai.board.findIndex(m => m === null);
      if (emptyAiSlot !== -1) {
        const jutiIdx = ai.hand.findIndex(c => c.id === 'NM02' || c.id === 'NM03');
        const pIdx = ai.hand.findIndex((c, idx) => idx !== jutiIdx && c.id === 'NM01');
        if (jutiIdx !== -1 && pIdx !== -1) {
          const summoned = ai.hand[jutiIdx];
          const fodder = ai.hand[pIdx];
          [jutiIdx, pIdx].sort((a, b) => b - a).forEach(i => ai.hand.splice(i, 1));
          resetCardStateForZoneChange(fodder);
          ai.graveyard.push(fodder);
          resetCardStateForZoneChange(summoned);
          summoned.permPowerMod += 1;
          ai.board[emptyAiSlot] = summoned;
          showCardShowcaseBanner(summoned, 'AI อัญเชิญจุติ!', `🔥 ทิ้งไพร่ชาวนาเหนือ คอล "${summoned.name}" พลัง +1!`, '#dc2626');
          setLog(`🔥 [AI อัญเชิญจุติ] ทิ้งไพร่ชาวนาเหนือ อัญเชิญ "${summoned.name}" (พลัง +1)!`);
          if (summoned.id === 'NM02') triggerRoyalGuardJutiBonus(ai);
          renderGame();
          playSlotAnimation(false, emptyAiSlot, 'fx-summon-drop');
          return true;
        }
      }
    }
  }

  // ==================== สเต็ปที่ 2: อัญเชิญมอนสเตอร์ลงสนามทีละ 1 ใบ ====================
  const emptySlot = ai.board.findIndex(m => m === null);
  if (emptySlot !== -1) {
    let summonIdx = -1;
    if (diff !== 'EASY') {
      summonIdx = ai.hand.findIndex(c =>
        c.type === 'Monster' && !c.cannotNormalSummon && !c.isSpy && c.id !== 'M04' && c.id !== 'M03'
      );
    }
    if (summonIdx === -1) {
      summonIdx = ai.hand.findIndex(c =>
        c.type === 'Monster' && !c.cannotNormalSummon && !c.isSpy && c.id !== 'M04'
      );
    }

    if (summonIdx !== -1) {
      const summoned = ai.hand.splice(summonIdx, 1)[0];
      resetCardStateForZoneChange(summoned);
      summoned.state = 'Stand';
      if (summoned.id === 'NM04') summoned.permPowerMod += 1;
      ai.board[emptySlot] = summoned;

      showCardShowcaseBanner(summoned, 'AI อัญเชิญยูนิต!', `ลงช่องที่ ${emptySlot + 1} (Power ${getEffectivePower(summoned, ai)})`, '#f59e0b');
      setLog(`🤖 AI อัญเชิญ "${summoned.name}" ลงช่องที่ ${emptySlot + 1}!`);

      if (summoned.id === 'M01') {
        let bestTarget = -1;
        let maxPwr = -1;
        player.board.forEach((m, idx) => {
          if (m && m.id !== 'NM05' && !m.immuneToEnemyEffectsUntilEndOfTurn && getEffectivePower(m, player) > maxPwr) {
            maxPwr = getEffectivePower(m, player);
            bestTarget = idx;
          }
        });
        if (bestTarget !== -1) {
          destroyBoardMonster(player, bestTarget, false, true);
          setLog(`💥 [AI บาคุจิต] อัญเชิญลงสนามและทำลายมอนสเตอร์ช่องที่ ${bestTarget + 1} ของคุณ!`);
          playSlotAnimation(true, bestTarget, 'fx-target-hit');
        }
      }

      renderGame();
      playSlotAnimation(false, emptySlot, 'fx-summon-drop');
      return true;
    }
  }

  if (diff === 'EASY') return false;

  // ==================== สเต็ปที่ 3: กดใช้สกิลของมอนสเตอร์บนสนามทีละ 1 สกิล ====================
  for (let slotIdx = 0; slotIdx < 3; slotIdx++) {
    const m = ai.board[slotIdx];
    if (!m) continue;

    // 3.1 โทโดโรจิต (M02) เก็บบาคุจิต
    if (m.id === 'M02' && !m.usedSkills.todoroRecover) {
      const bakuIdx = ai.graveyard.findIndex(c => c.id === 'M01');
      if (bakuIdx !== -1) {
        const baku = ai.graveyard.splice(bakuIdx, 1)[0];
        resetCardStateForZoneChange(baku);
        ai.hand.push(baku);
        m.usedSkills.todoroRecover = true;
        showCardShowcaseBanner(m, 'AI ใช้สกิลยูนิต!', '❄️ นำ "บาคุจิต" จากกองนรกกลับขึ้นมือ!', '#38bdf8');
        setLog('🤖 [AI โทโดโรจิต] นำ "บาคุจิต" จากกองนรกขึ้นมือ!');
        renderGame();
        playSlotAnimation(false, slotIdx, 'fx-skill-glow');
        return true;
      }
    }

    // 3.2 โทโดโรจิต (M02) โม่กองผู้เล่น
    if (diff === 'HARD' && m.id === 'M02' && !m.usedSkills.todoroMill && ai.hand.length >= 3 && player.deck.length > 0) {
      const discarded = ai.hand.pop();
      resetCardStateForZoneChange(discarded);
      ai.graveyard.push(discarded);
      const milled = player.deck.pop();
      resetCardStateForZoneChange(milled);
      player.graveyard.push(milled);
      m.usedSkills.todoroMill = true;
      showCardShowcaseBanner(m, 'AI ใช้สกิลยูนิต!', `❄️ โม่การ์ด "${milled.name}" จากกองคุณลงนรก!`, '#38bdf8');
      setLog(`❄️ [AI โทโดโรจิต] ทิ้ง "${discarded.name}" และโม่ "${milled.name}" จากกองคุณลงนรก!`);
      renderGame();
      playSlotAnimation(false, slotIdx, 'fx-skill-glow');
      return true;
    }

    // 3.3 ฮออ์กส์ฟีม (M06) ค้นหาเอ็นเดจิต
    const hasEndeInHand = ai.hand.some(c => c.id === 'M05');
    if (m.id === 'M06' && !m.usedSkills.hawksSearch && !hasEndeInHand && getEffectivePower(m, ai) >= 2) {
      if (ai.graveyard.some(c => c.id === 'M05') || ai.deck.some(c => c.id === 'M05')) {
        const zone = ai.graveyard.some(c => c.id === 'M05') ? 'grave' : 'deck';
        showCardShowcaseBanner(m, 'AI ใช้สกิลยูนิต!', '🦅 ลดพลัง -2 ค้นหา "เอ็นเดจิต" ขึ้นมือ!', '#38bdf8');
        executeHawksSearch(ai, slotIdx, zone);
        playSlotAnimation(false, slotIdx, 'fx-skill-glow');
        return true;
      }
    }

    // 3.4 ทหารพรานเหนือ (NM03)
    if (m.id === 'NM03' && !m.usedSkills.rangerTarget) {
      const enemySlotIdx = player.board.findIndex(em => em && em.id !== 'NM05' && !em.immuneToEnemyEffectsUntilEndOfTurn);
      if (enemySlotIdx !== -1) {
        const enemyTarget = player.board[enemySlotIdx];
        enemyTarget.permPowerMod -= 1;
        m.usedSkills.rangerTarget = true;
        showCardShowcaseBanner(m, 'AI ใช้สกิลทหารพรานเหนือ!', `🏹 ลดพลังของ "${enemyTarget.name}" ลง 1!`, '#16a34a');
        setLog(`🏹 [AI ทหารพรานเหนือ] ลดพลังโจมตีของ "${enemyTarget.name}" ลง 1!`);
        renderGame();
        playSlotAnimation(false, slotIdx, 'fx-skill-glow');
        playSlotAnimation(true, enemySlotIdx, 'fx-target-hit');
        return true;
      } else {
        m.permPowerMod += 1;
        m.usedSkills.rangerTarget = true;
        showCardShowcaseBanner(m, 'AI ใช้สกิลทหารพรานเหนือ!', '🏹 เพิ่มพลังโจมตีให้ตัวเอง +1!', '#16a34a');
        setLog('🏹 [AI ทหารพรานเหนือ] เพิ่มพลังโจมตีให้ตัวเอง +1!');
        renderGame();
        playSlotAnimation(false, slotIdx, 'fx-skill-glow');
        return true;
      }
    }

    // 3.5 โอนามิ ผู้ทำลายโลก (DM01) เรียกโรเซเลีย
    if (m.id === 'DM01' && !m.usedSkills.onamiSummon && ai.hand.length > 0 && ai.board.some(s => s === null)) {
      const roseliaInGrave = ai.graveyard.findIndex(c => c.id === 'DM02');
      const roseliaInDeck = ai.deck.findIndex(c => c.id === 'DM02');
      if (roseliaInGrave !== -1 || roseliaInDeck !== -1) {
        let discardIdx = ai.hand.findIndex(c => c.id === 'DM05');
        if (discardIdx === -1) discardIdx = 0;
        const discarded = ai.hand.splice(discardIdx, 1)[0];
        resetCardStateForZoneChange(discarded);
        ai.graveyard.push(discarded);

        if (discarded.id === 'DM05' && player.hand.length > 0) {
          const pDiscarded = player.hand.pop();
          resetCardStateForZoneChange(pDiscarded);
          player.graveyard.push(pDiscarded);
          setLog(`🍬 [AI ออโต้ซึรุรุ] ถูกทิ้งโดยโอนามิ -> บังคับทิ้ง "${pDiscarded.name}" บนมือคุณ!`);
        }

        const roselia = roseliaInGrave !== -1
          ? ai.graveyard.splice(roseliaInGrave, 1)[0]
          : ai.deck.splice(roseliaInDeck, 1)[0];
        if (roseliaInGrave === -1) ai.deck = shuffleDeck(ai.deck);
        resetCardStateForZoneChange(roselia);
        roselia.immuneToEnemyEffectsUntilEndOfTurn = true;
        const targetEmpty = ai.board.findIndex(s => s === null);
        if (targetEmpty !== -1) {
          ai.board[targetEmpty] = roselia;
          m.usedSkills.onamiSummon = true;
          showCardShowcaseBanner(roselia, 'AI สกิลคู่หูโอนามิ!', '🌊 อัญเชิญ "โรเซเลีย" ลงสนามเข้าสู่สถานะคู่หู!', '#ec4899');
          setLog('🌊 [AI โอนามิ] อัญเชิญ "โรเซเลีย" ลงสนามเข้าสู่สถานะคู่หู!');
          renderGame();
          playSlotAnimation(false, targetEmpty, 'fx-summon-drop');
          return true;
        }
      }
    }

    // 3.6 โรเซเลีย (DM02) Rest จั่วการ์ด
    if (m.id === 'DM02' && m.state === 'Stand' && isPartnerActive(ai) && ai.hand.length <= 2) {
      m.state = 'Rest';
      drawCards(ai, 1);
      showCardShowcaseBanner(m, 'AI สกิลคู่หูโรเซเลีย!', '🌹 เปลี่ยนเป็น Rest เพื่อจั่วการ์ด 1 ใบ!', '#ec4899');
      setLog('🌹 [AI คู่หู - โรเซเลีย] เปลี่ยนเป็น Rest เพื่อจั่วการ์ด 1 ใบ!');
      renderGame();
      playSlotAnimation(false, slotIdx, 'fx-skill-glow');
      return true;
    }

    // 3.7 เอ็นเดจิต (M05) กดบัฟพลัง +2
    if (m.id === 'M05' && !m.usedSkills.endeBoost && canContestantAttack(ai, m).allowed) {
      showCardShowcaseBanner(m, 'AI ใช้สกิลเอ็นเดจิต!', '🔥 เพิ่มพลังโจมตี +2 จนจบเทิร์น!', '#dc2626');
      triggerEndeSkill(ai, slotIdx);
      renderGame();
      playSlotAnimation(false, slotIdx, 'fx-skill-glow');
      return true;
    }
  }

  // ==================== สเต็ปที่ 4: การ์ดอนาคต (DM09 - DM14) ทีละใบ ====================
  if (diff === 'HARD' && !ai.futureUsedThisTurn) {
    const futureHandIdx = ai.hand.findIndex(c =>
      c.futureBaseId && ai.board.some(m => m !== null && m.id === c.futureBaseId)
    );
    if (futureHandIdx !== -1) {
      const futureCard = ai.hand[futureHandIdx];
      const baseSlotIdx = ai.board.findIndex(m => m !== null && m.id === futureCard.futureBaseId);
      if (baseSlotIdx !== -1) {
        showCardShowcaseBanner(futureCard, 'AI อัญเชิญการ์ดอนาคต!', `🌌 ส่ง "${futureCard.futureBaseName}" ไปมิติมืด!`, '#6366f1');
        executeFutureSummon(ai, player, futureHandIdx, baseSlotIdx);
        playSlotAnimation(false, baseSlotIdx, 'fx-summon-drop');
        return true;
      }
    }
  }

  // ==================== สเต็ปที่ 5: สกิล Leader มายฮีโร่ เดจิต (L01) ====================
  if (ai.leader.id === 'L01' && !ai.leader.abilityUsedThisTurn) {
    const targetSlot = ai.board.findIndex(m => m !== null && m.state === 'Stand' && m.id !== 'NM05');
    if (targetSlot !== -1) {
      const targetAlly = ai.board[targetSlot];
      targetAlly.tempPowerMod += 1;
      ai.leader.abilityUsedThisTurn = true;
      showCardShowcaseBanner(ai.leader, 'AI ใช้สกิล Leader!', `👑 เพิ่มพลังให้ "${targetAlly.name}" +1!`, '#ec4899');
      setLog(`👑 [AI มายฮีโร่ เดจิต] เพิ่มพลังให้ "${targetAlly.name}" +1 จนจบเทิร์น!`);
      renderGame();
      playSlotAnimation(false, targetSlot, 'fx-skill-glow');
      return true;
    }
  }

  // ==================== สเต็ปที่ 6: การ์ดเวทมนตร์ของ AI ====================
  if (ai.spellQuota.normalUsed < 1) {
    const casted = aiCastBestNormalSpell(ai, player, diff);
    if (casted) return true;
  }

  return false;
}

function aiCastBestNormalSpell(ai, player, diff) {
  // 1. เชี่ย หุ้นตก (S02)
  const s02Idx = ai.hand.findIndex(c => c.id === 'S02');
  if (s02Idx !== -1 && player.board.some(m => m !== null && m.id !== 'NM05')) {
    const spell = ai.hand.splice(s02Idx, 1)[0];
    ai.spellQuota.normalUsed += 1;
    player.board.forEach(m => { if (m && !m.immuneToEnemyEffectsUntilEndOfTurn) m.tempPowerMod -= 3; });
    ai.graveyard.push(spell);
    showCardShowcaseBanner(spell, 'AI ใช้การ์ดเวทมนตร์!', '📉 ลดพลังยูนิทของคุณทุกใบลง 3 จนจบเทิร์น!', '#10b981');
    setLog('📉 AI ใช้เวทย์ "เชี่ย หุ้นตก" ลดพลังยูนิทของคุณทุกใบลง 3 จนจบเทิร์น!');
    renderGame();
    return true;
  }

  // 2. เบิกเนตรแห่งแสง (DS01)
  const ds01Idx = ai.hand.findIndex(c => c.id === 'DS01');
  if (ds01Idx !== -1) {
    const spell = ai.hand.splice(ds01Idx, 1)[0];
    ai.spellQuota.normalUsed += 1;
    const drawCnt = ai.graveyard.length >= 5 ? 2 : 1;
    drawCards(ai, drawCnt);
    const ally = ai.board.find(m => m !== null && m.id !== 'NM05');
    if (ally) ally.tempPowerMod += 1;
    ai.graveyard.push(spell);
    showCardShowcaseBanner(spell, 'AI ใช้การ์ดเวทมนตร์!', `✨ จั่วการ์ด ${drawCnt} ใบ และบัฟพลัง +1!`, '#10b981');
    setLog(`✨ AI ใช้เวทย์ "เบิกเนตรแห่งแสง" จั่วการ์ด ${drawCnt} ใบ และบัฟพลัง +1!`);
    renderGame();
    return true;
  }

  if (diff !== 'HARD') return false;

  // 3. โอ็ยใครเหยียบตีน!!! (S01)
  const s01Idx = ai.hand.findIndex(c => c.id === 'S01');
  const enemySlot = player.board.findIndex(m => m !== null && m.id !== 'NM05' && !m.immuneToEnemyEffectsUntilEndOfTurn);
  if (s01Idx !== -1 && ai.hand.length >= 2 && enemySlot !== -1) {
    const spell = ai.hand.splice(s01Idx, 1)[0];
    const discarded = ai.hand.pop();
    resetCardStateForZoneChange(discarded);
    ai.graveyard.push(discarded);
    ai.graveyard.push(spell);
    ai.spellQuota.normalUsed += 1;
    showCardShowcaseBanner(spell, 'AI ใช้การ์ดเวทมนตร์!', `🦶 ทิ้ง "${discarded.name}" ทำลายยูนิตช่องที่ ${enemySlot + 1}!`, '#10b981');
    destroyBoardMonster(player, enemySlot, false, true);
    setLog(`🦶 AI ใช้เวทย์ "โอ็ยใครเหยียบตีน!!!" ทิ้ง "${discarded.name}" เพื่อทำลายมอนสเตอร์ของคุณ!`);
    renderGame();
    playSlotAnimation(true, enemySlot, 'fx-target-hit');
    return true;
  }

  // 4. ระเบิดปูพรม (NS03)
  const ns03Idx = ai.hand.findIndex(c => c.id === 'NS03');
  const hasSoldiers = ai.board.some(m => m && (m.id === 'NM02' || m.id === 'NM03' || m.id === 'NM04'));
  if (ns03Idx !== -1 && hasSoldiers) {
    const spell = ai.hand.splice(ns03Idx, 1)[0];
    ai.spellQuota.normalUsed += 1;
    ai.graveyard.push(spell);
    const cCount = ai.board.filter(m => m && m.id === 'NM04').length;
    const rCount = ai.board.filter(m => m && m.id === 'NM03').length;
    const lCount = ai.board.filter(m => m && m.id === 'NM02').length;
    if (cCount > 0) ai.board.forEach(m => { if (m && isNueaCard(m)) m.tempPowerMod += cCount; });
    if (lCount > 0) ai.board.forEach(m => { if (m) m.indestructibleUntilNextTurn = true; });
    for (let k = 0; k < rCount; k++) {
      const targetIdx = player.board.findIndex(m => m !== null && m.id !== 'NM05' && !m.immuneToEnemyEffectsUntilEndOfTurn);
      if (targetIdx !== -1) destroyBoardMonster(player, targetIdx, false, true);
    }
    showCardShowcaseBanner(spell, 'AI ใช้การ์ดเวทมนตร์!', '💣 แสดงผลระเบิดปูพรมตามทหารบนสนาม!', '#10b981');
    setLog('💣 AI ใช้เวทย์ "ระเบิดปูพรม" แสดงผลตามยูนิตทหารบนสนาม!');
    renderGame();
    return true;
  }

  // 5. จีวรบิน (NS05)
  const ns05Idx = ai.hand.findIndex(c => c.id === 'NS05');
  if (ns05Idx !== -1 && enemySlot !== -1) {
    const spell = ai.hand.splice(ns05Idx, 1)[0];
    ai.spellQuota.normalUsed += 1;
    ai.graveyard.push(spell);
    const bounced = player.board[enemySlot];
    player.board[enemySlot] = null;
    resetCardStateForZoneChange(bounced);
    player.hand.push(bounced);
    showCardShowcaseBanner(spell, 'AI ใช้การ์ดเวทมนตร์!', `🌪️ ส่ง "${bounced.name}" ของคุณกลับขึ้นมือ!`, '#10b981');
    setLog(`🌪️ AI ใช้เวทย์ "จีวรบิน" ดีด "${bounced.name}" ของคุณกลับขึ้นมือ!`);
    renderGame();
    return true;
  }

  // 6. หมอสนามเหนือ (NS02) / หมอไพร่เหนือ (NS01)
  const ns02Idx = ai.hand.findIndex(c => c.id === 'NS02');
  if (ns02Idx !== -1 && ai.graveyard.some(c => isSoldierCard(c))) {
    const spell = ai.hand.splice(ns02Idx, 1)[0];
    ai.spellQuota.normalUsed += 1;
    const gIdx = ai.graveyard.findIndex(c => isSoldierCard(c));
    const rec = ai.graveyard.splice(gIdx, 1)[0];
    resetCardStateForZoneChange(rec);
    ai.hand.push(rec);
    ai.graveyard.push(spell);
    showCardShowcaseBanner(spell, 'AI ใช้การ์ดเวทมนตร์!', `✨ เก็บ "${rec.name}" จากนรกขึ้นมือ!`, '#10b981');
    setLog(`✨ AI ใช้ "หมอสนามเหนือ" เก็บ "${rec.name}" จากนรกขึ้นมือ!`);
    renderGame();
    return true;
  }

  const ns01Idx = ai.hand.findIndex(c => c.id === 'NS01');
  if (ns01Idx !== -1 && ai.graveyard.some(c => isPhraiCard(c))) {
    const spell = ai.hand.splice(ns01Idx, 1)[0];
    ai.spellQuota.normalUsed += 1;
    const gIdx = ai.graveyard.findIndex(c => isPhraiCard(c));
    const rec = ai.graveyard.splice(gIdx, 1)[0];
    resetCardStateForZoneChange(rec);
    ai.hand.push(rec);
    ai.graveyard.push(spell);
    showCardShowcaseBanner(spell, 'AI ใช้การ์ดเวทมนตร์!', `✨ เก็บ "${rec.name}" จากนรกขึ้นมือ!`, '#10b981');
    setLog(`✨ AI ใช้ "หมอไพร่เหนือ" เก็บ "${rec.name}" จากนรกขึ้นมือ!`);
    renderGame();
    return true;
  }

  return false;
}

// 🧠 สมองกล AI ช่วง Battle Phase (เว้นจังหวะการตีแต่ละตัวให้ผู้เล่นมองเห็นชัดเจน)
function aiPlayBattlePhase(slotIndex) {
  if (gameState.gameOver) return;
  const ai = gameState.ai;
  const player = gameState.player;
  const diff = aiConfig.difficulty;

  if (slotIndex >= 3) {
    if (diff === 'HARD') {
      const emiSlot = ai.board.findIndex(m => m && m.id === 'DM08' && m.state === 'Rest' && !m.usedSkills.emiReattack);
      const hasDebirun = ai.board.some(m => m && m.id === 'DM04');
      if (emiSlot !== -1 && hasDebirun && ai.hand.length >= 3) {
        for (let i = 0; i < 3; i++) {
          const d = ai.hand.pop();
          resetCardStateForZoneChange(d);
          ai.graveyard.push(d);
        }
        ai.board[emiSlot].state = 'Stand';
        ai.board[emiSlot].usedSkills.emiReattack = true;
        showCardShowcaseBanner(ai.board[emiSlot], 'AI สกิลออโต้เอมิ!', '⚡ ทิ้งมือ 3 ใบ ลุกขึ้น Stand โจมตีอีกครั้ง!', '#f59e0b');
        setLog('⚡ [AI เอมิ] ทิ้งมือ 3 ใบเพื่อ Stand ลุกขึ้นมาโจมตีอีกครั้ง!');
        renderGame();
        playSlotAnimation(false, emiSlot, 'fx-skill-glow');
        setTimeout(() => aiPlayBattlePhase(emiSlot), 1100);
        return;
      }
    }
    setTimeout(endAITurn, 900);
    return;
  }

  const monster = ai.board[slotIndex];
  const check = canContestantAttack(ai, monster);
  if (!check.allowed || (monster && monster.id === 'NM05')) {
    aiPlayBattlePhase(slotIndex + 1);
    return;
  }

  const aiPower = getEffectivePower(monster, ai);
  const playerHasTsururu = player.board.some(m => m !== null && m.id === 'DM05');

  const playerHasStandBlocker = player.board.some(m => m !== null && m.state === 'Stand');
  if (diff === 'HARD' && player.leader.hp === 1 && !playerHasStandBlocker) {
    executeAttack(ai, player, slotIndex, 'leader', null, () => {
      setTimeout(() => aiPlayBattlePhase(slotIndex + 1), 1150);
    });
    return;
  }

  let bestTargetSlot = -1;
  let bestTargetPower = -1;

  if (diff !== 'EASY') {
    player.board.forEach((m, idx) => {
      if (m && m.id !== 'NM05') {
        if (m.id === 'DM03' && playerHasTsururu) return;
        const pPower = getEffectivePower(m, player);
        if (aiPower > pPower && pPower > bestTargetPower) {
          bestTargetPower = pPower;
          bestTargetSlot = idx;
        }
      }
    });
  }

  if (bestTargetSlot !== -1) {
    executeAttack(ai, player, slotIndex, 'monster', bestTargetSlot, () => {
      setTimeout(() => aiPlayBattlePhase(slotIndex + 1), 1150);
    });
  } else {
    executeAttack(ai, player, slotIndex, 'leader', null, () => {
      setTimeout(() => aiPlayBattlePhase(slotIndex + 1), 1150);
    });
  }
}

function endAITurn() {
  if (gameState.gameOver) return;
  executeEndPhaseCleanup(gameState.ai);
  gameState.phase = 'End Phase';
  renderGame();

  setTimeout(() => {
    gameState.activeTurn = 'player';
    gameState.turnCount += 1;
    startPlayerTurn();
  }, 750);
}


/* ============================================================================
   หมวดที่ 9: ระบบแสดงคำอธิบายการ์ด (TOOLTIP + แตะค้างบนมือถือ) และ RENDER UI
   (พร้อมตรวจจับการ์ดที่เพิ่งลงสนามเพื่อเล่นแอนิเมชันอัตโนมัติ)
   ============================================================================ */
let previousBoardUids = {
  player: [null, null, null],
  ai: [null, null, null]
};

function getOrCreateTooltipElement() {
  let tooltip = document.getElementById('card-hover-tooltip');
  if (!tooltip) {
    tooltip = document.createElement('div');
    tooltip.id = 'card-hover-tooltip';
    tooltip.className = 'card-tooltip';
    document.body.appendChild(tooltip);
  }
  return tooltip;
}

function showCardTooltip(event, card, ownerContestant = null) {
  if (!card) return;
  const tooltip = getOrCreateTooltipElement();

  let statsHtml = '';
  if (card.type === 'Monster') {
    const currentPwr = getEffectivePower(card, ownerContestant);
    const basePwr = card.basePower !== undefined ? card.basePower : card.power;
    statsHtml = `<div class="tooltip-stats">⚔️ พลังโจมตี: ${currentPwr} (พื้นฐาน: ${basePwr}) | สถานะ: ${card.state || 'Stand'}</div>`;
  } else if (card.type === 'Leader') {
    const currentHp = card.hp !== undefined ? card.hp : card.maxHp;
    statsHtml = `<div class="tooltip-stats">👑 พลังชีวิต (HP): ${currentHp} / ${card.maxHp}</div>`;
  }

  tooltip.innerHTML = `
    <div class="tooltip-header">
      <span class="tooltip-name">${card.name}</span>
      <span class="tooltip-type">${card.type}</span>
    </div>
    ${statsHtml}
    <div class="tooltip-desc">${card.desc || 'ไม่มีความสามารถพิเศษ'}</div>
  `;

  tooltip.style.display = 'block';
  moveCardTooltip(event);
}

function moveCardTooltip(event) {
  const tooltip = document.getElementById('card-hover-tooltip');
  if (!tooltip || tooltip.style.display === 'none') return;

  const offset = 16;
  let left = event.clientX + offset;
  let top = event.clientY + offset;

  const rect = tooltip.getBoundingClientRect();
  if (left + rect.width > window.innerWidth - 10) {
    left = event.clientX - rect.width - offset;
  }
  if (top + rect.height > window.innerHeight - 10) {
    top = event.clientY - rect.height - offset;
  }

  tooltip.style.left = `${Math.max(10, left)}px`;
  tooltip.style.top = `${Math.max(10, top)}px`;
}

function hideCardTooltip() {
  const tooltip = document.getElementById('card-hover-tooltip');
  if (tooltip) tooltip.style.display = 'none';
}

function attachCardTooltipEvents(element, card, ownerContestant = null) {
  element.addEventListener('mouseenter', (e) => {
    if (window.innerWidth > 768) showCardTooltip(e, card, ownerContestant);
  });
  element.addEventListener('mousemove', (e) => {
    if (window.innerWidth > 768) moveCardTooltip(e);
  });
  element.addEventListener('mouseleave', () => hideCardTooltip());
  element.addEventListener('click', () => hideCardTooltip());

  let touchTimer = null;
  element.addEventListener('touchstart', () => {
    touchTimer = setTimeout(() => {
      openCardDetailModal(card, ownerContestant);
    }, 450);
  }, { passive: true });

  element.addEventListener('touchend', () => {
    if (touchTimer) clearTimeout(touchTimer);
  });

  element.addEventListener('touchmove', () => {
    if (touchTimer) clearTimeout(touchTimer);
  });
}

function createCardElement(card, ownerContestant = null) {
  const effectivePower = getEffectivePower(card, ownerContestant);
  const div = document.createElement('div');
  div.className = `card ${card.type} ${card.state || ''}`;

  let statusTag = '';
  if (card.type === 'Monster') {
    if (card.burnLeaderOnKill) statusTag += '🔥';
    if (card.destroyAtEndOfTurn || card.returnFromDarkDimensionId) statusTag += '⏳';
    if (card.indestructibleUntilNextTurn || card.immuneToEnemyEffectsUntilEndOfTurn) statusTag += '🛡️';
  }

  div.innerHTML = `
    <div>
      <div class="card-header">
        <span class="card-type">${card.type} ${statusTag}</span>
      </div>
      <div class="card-art">
        <img src="${card.image}" alt="${card.name}">
      </div>
      <div class="card-name">${card.name}</div>
    </div>
    ${card.type === 'Monster'
      ? `<div class="card-power">⚔️ ${effectivePower}</div>`
      : `<div class="card-desc">${card.desc}</div>`
    }
  `;

  attachCardTooltipEvents(div, card, ownerContestant);
  return div;
}

function renderBoardSlots(containerId, contestant, isPlayerBoard) {
  ensureVisualEffectsStyles();
  const container = document.getElementById(containerId);
  const slots = container.querySelectorAll('.slot');
  const pendingType = gameState.pendingAction ? gameState.pendingAction.type : null;
  const selectedHandCard = (gameState.selectedHandIndex !== null && gameState.player)
    ? gameState.player.hand[gameState.selectedHandIndex]
    : null;
  const sideKey = isPlayerBoard ? 'player' : 'ai';

  slots.forEach((slotEl, idx) => {
    slotEl.innerHTML = '';
    slotEl.classList.remove('valid-target', 'attack-target');

    const monster = contestant.board[idx];
    const prevUid = previousBoardUids[sideKey][idx];

    if (monster) {
      const cardEl = createCardElement(monster, contestant);
      if (isPlayerBoard && gameState.selectedAttackerSlot === idx) {
        cardEl.classList.add('selected-attacker');
      }
      // ✨ ถ้าเป็นการ์ดใบใหม่ที่เพิ่งถูกวางลงในช่องนี้ ให้เล่นเอฟเฟกต์ Summon Drop อัตโนมัติ!
      if (monster.uid !== prevUid) {
        cardEl.classList.add('fx-summon-drop');
      }
      slotEl.appendChild(cardEl);
      previousBoardUids[sideKey][idx] = monster.uid;

      if (isPlayerBoard) {
        if (
          (gameState.phase === 'Main Phase' && selectedHandCard && !selectedHandCard.isSpy && !pendingType) ||
          pendingType === 'JUTI_SELECT_SLOT' ||
          pendingType === 'CALL_FROM_EFFECT_SELECT_SLOT' ||
          pendingType === 'LEADER_L01_TARGET' ||
          pendingType === 'SPELL_DS01_BUFF_TARGET' ||
          pendingType === 'RANGER_SELECT_UNIT' ||
          pendingType === 'SPELL_S04_CHOOSE_BENEFICIARY' ||
          ((pendingType === 'SPELL_S03_REST_TARGET' || pendingType === 'SPELL_S04_REST_FIRST' || pendingType === 'SPELL_S04_REST_SECOND') && monster.state === 'Stand')
        ) {
          slotEl.classList.add('valid-target');
        }
      }

      if (!isPlayerBoard) {
        if (
          gameState.selectedAttackerSlot !== null ||
          pendingType === 'BAKU_DESTROY_TARGET' ||
          pendingType === 'SPELL_S01_DESTROY_TARGET' ||
          pendingType === 'SPELL_NS05_BOUNCE_TARGET' ||
          pendingType === 'CARPET_BOMB_DESTROY' ||
          pendingType === 'RANGER_SELECT_UNIT'
        ) {
          slotEl.classList.add('attack-target');
        }
      }
    } else {
      previousBoardUids[sideKey][idx] = null;
      slotEl.textContent = `ช่อง ${idx + 1}`;
      if (isPlayerBoard && gameState.activeTurn === 'player' && gameState.phase === 'Main Phase') {
        if (
          (selectedHandCard && !selectedHandCard.isSpy && !pendingType) ||
          pendingType === 'JUTI_SELECT_SLOT' ||
          pendingType === 'CALL_FROM_EFFECT_SELECT_SLOT'
        ) {
          slotEl.classList.add('valid-target');
        }
      }
      if (!isPlayerBoard && gameState.activeTurn === 'player' && gameState.phase === 'Main Phase' && selectedHandCard && selectedHandCard.isSpy && !pendingType) {
        slotEl.classList.add('attack-target');
      }
    }

    slotEl.onclick = () => isPlayerBoard ? handlePlayerSlotClick(idx) : handleAISlotClick(idx);
  });
}

// วางทับฟังก์ชัน renderGame เดิมในหมวดที่ 9 ของ game.js (ปรับข้อความโควตาและชื่อ Leader ให้กระชับบนมือถือ)
function renderGame() {
  const { player, ai } = gameState;
  if (!player || !ai) return;

  ensureZoneUIAndViewers();
  setupInGameControlBar();

  const isMobileView = window.innerWidth <= 768;

  document.getElementById('ai-leader-name').textContent = ai.leader.name;
  document.getElementById('ai-leader-hp').textContent = ai.leader.hp;
  document.getElementById('ai-leader-img').src = ai.leader.image;
  document.getElementById('ai-deck-count').textContent = ai.deck.length;
  document.getElementById('ai-grave-count').textContent = ai.graveyard.length;
  document.getElementById('ai-hand-count').textContent = ai.hand.length;
  const aiDarkCountEl = document.getElementById('ai-dark-count');
  if (aiDarkCountEl) aiDarkCountEl.textContent = ai.darkDimension.length;

  const aiLeaderBox = document.getElementById('ai-leader-box');
  if (gameState.selectedAttackerSlot !== null && !gameState.pendingAction) {
    aiLeaderBox.classList.add('attack-target');
  } else {
    aiLeaderBox.classList.remove('attack-target');
  }
  aiLeaderBox.onclick = () => {
    if (gameState.activeTurn === 'player' && gameState.phase === 'Battle Phase' && gameState.selectedAttackerSlot !== null && !gameState.pendingAction) {
      return; // ปล่อยให้ event โจมตีทำงานตามปกติ
    }
    openCardDetailModal(ai.leader, ai);
  };
  aiLeaderBox.onmouseenter = (e) => showCardTooltip(e, ai.leader, ai);
  aiLeaderBox.onmousemove = (e) => moveCardTooltip(e);
  aiLeaderBox.onmouseleave = () => hideCardTooltip();

  const leaderSuffix = isMobileView
    ? (player.leader.id === 'L01' ? (player.leader.abilityUsedThisTurn ? '✓' : '⚡') : '')
    : (player.leader.id === 'L01' ? (player.leader.abilityUsedThisTurn ? '(ใช้สกิลแล้ว)' : '(คลิกใช้สกิล)') : '(คลิกดูรายละเอียด)');

  document.getElementById('player-leader-name').textContent = `${player.leader.name} ${leaderSuffix}`.trim();
  document.getElementById('player-leader-hp').textContent = player.leader.hp;
  document.getElementById('player-leader-img').src = player.leader.image;
  document.getElementById('player-deck-count').textContent = player.deck.length;
  document.getElementById('player-grave-count').textContent = player.graveyard.length;
  const playerDarkCountEl = document.getElementById('player-dark-count');
  if (playerDarkCountEl) playerDarkCountEl.textContent = player.darkDimension.length;

  const playerLeaderBox = document.getElementById('player-leader-box');
  playerLeaderBox.style.cursor = 'pointer';
  playerLeaderBox.onclick = () => {
    hideCardTooltip();
    handlePlayerSlotClick('leader');
  };
  playerLeaderBox.onmouseenter = (e) => showCardTooltip(e, player.leader, player);
  playerLeaderBox.onmousemove = (e) => moveCardTooltip(e);
  playerLeaderBox.onmouseleave = () => hideCardTooltip();

  document.getElementById('turn-indicator').textContent =
    `Turn ${gameState.turnCount} (${gameState.activeTurn === 'player' ? 'ตาคุณ' : 'ตาอีกฝ่าย'})`;
  document.getElementById('phase-indicator').textContent = gameState.phase;

  document.getElementById('normal-spell-quota').textContent = isMobileView
    ? `✨ ปกติ: ${player.spellQuota.normalUsed}/1`
    : `Normal Spell: ${player.spellQuota.normalUsed} / 1`;
  document.getElementById('reaction-spell-quota').textContent = isMobileView
    ? `🛡️ รีแอค: ${player.spellQuota.reactionUsed}/1`
    : `Reaction Spell: ${player.spellQuota.reactionUsed} / 1`;

  const passBtn = document.getElementById('btn-pass-turn-inline');
  if (passBtn) {
    const isWaitingDefense = (typeof pvpState !== 'undefined' && pvpState.waitingForDefense);
    passBtn.disabled = (gameState.activeTurn !== 'player' || gameState.gameOver || isWaitingDefense);
    if (isWaitingDefense) {
      passBtn.textContent = '⏳ รออีกฝ่ายป้องกัน...';
      passBtn.style.background = '#475569';
    } else if (gameState.phase === 'Main Phase') {
      passBtn.textContent = '⚔️ เฟสถัดไป (Battle Phase)';
      passBtn.style.background = '#0284c7';
    } else if (gameState.phase === 'Battle Phase') {
      passBtn.textContent = '⏭️ เฟสถัดไป (จบเทิร์น)';
      passBtn.style.background = '#d97706';
    } else {
      passBtn.textContent = '⏳ รอเทิร์นฝ่ายตรงข้าม...';
      passBtn.style.background = '#475569';
    }
  }

  renderBoardSlots('ai-board', ai, false);
  renderBoardSlots('player-board', player, true);

  const handContainer = document.getElementById('player-hand');
  handContainer.innerHTML = '';
  const pendingType = gameState.pendingAction ? gameState.pendingAction.type : null;

  player.hand.forEach((card, idx) => {
    const cardEl = createCardElement(card, player);
    if (gameState.selectedHandIndex === idx) {
      cardEl.classList.add('selected-hand');
    }
    if (
      pendingType === 'ONAMI_DISCARD_HAND' ||
      pendingType === 'TODORO_SKILL1_DISCARD' ||
      (pendingType === 'SPELL_S01_DISCARD' && idx !== gameState.pendingAction.spellHandIndex)
    ) {
      cardEl.classList.add('selected-mulligan');
    }
    if (card.id === 'DM07' && player.unitsDestroyedThisTurn >= 2) {
      cardEl.style.outline = '3px solid #f59e0b';
      cardEl.style.boxShadow = '0 0 16px rgba(245, 158, 11, 0.9)';
    }
    cardEl.addEventListener('click', () => handleHandCardClick(idx));
    handContainer.appendChild(cardEl);
  });
}
function renderMulliganModal() {
  const listEl = document.getElementById('mulligan-card-list');
  listEl.innerHTML = '';
  gameState.player.hand.forEach((card, index) => {
    const cardEl = createCardElement(card, gameState.player);
    if (gameState.mulliganSelected.includes(index)) {
      cardEl.classList.add('selected-mulligan');
    }
    cardEl.addEventListener('click', () => {
      const pos = gameState.mulliganSelected.indexOf(index);
      if (pos !== -1) gameState.mulliganSelected.splice(pos, 1);
      else if (gameState.mulliganSelected.length < 2) gameState.mulliganSelected.push(index);
      renderMulliganModal();
    });
    listEl.appendChild(cardEl);
  });

  const mulliganTextEl = document.getElementById('mulligan-selected-text');
  if (mulliganTextEl) {
    mulliganTextEl.textContent = `เลือกแล้ว: ${gameState.mulliganSelected.length} / 2 ใบ`;
  }
}

document.getElementById('btn-confirm-mulligan').addEventListener('click', () => {
  performMulligan(gameState.player, gameState.mulliganSelected);
  document.getElementById('mulligan-modal').style.display = 'none';
  startPlayerTurn();
});

function startPlayerTurn() {
  if (gameState.gameOver) return;
  gameState.phase = 'Main Phase';
  gameState.pendingAction = null;

  executeStartPhase(gameState.player, () => {
    setLog(`🟢 เทิร์นของคุณ (ครั้งที่ ${gameState.player.turnsTaken}): ลงการ์ด/ใช้สกิลใน Main Phase หรือกด "⚔️ เฟสถัดไป (Battle Phase)" เพื่อโจมตี!`);
    renderGame();
  });
}


/* ============================================================================
   หมวดที่ 10: ระบบหน้าต่างจัดเด็ค และการสร้างเกมพร้อมสุ่มเด็ค AI
   ============================================================================ */
let currentDeckConfig = loadSavedDeck();

function loadSavedDeck() {
  try {
    const saved = localStorage.getItem('my_card_game_deck');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.leaderId && Array.isArray(parsed.mainDeck) && parsed.mainDeck.length === 20) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('โหลดเด็คไม่สำเร็จ ใช้เด็คมาตรฐานแทน');
  }
  return { leaderId: 'L01', mainDeck: [...DEFAULT_DECK_LIST] };
}

function openDeckBuilder() {
  document.getElementById('mulligan-modal').style.display = 'none';
  document.getElementById('deck-builder-modal').style.display = 'flex';
  renderDeckBuilder();
}

function renderDeckBuilder() {
  const leaderContainer = document.getElementById('leader-pool-list');
  const mainContainer = document.getElementById('main-pool-list');
  leaderContainer.innerHTML = '';
  mainContainer.innerHTML = '';

  const saveBtn = document.getElementById('btn-save-start');
  if (saveBtn) saveBtn.textContent = '✅ บันทึกเด็ค';

  CARD_DATABASE.filter(c => c.type === 'Leader').forEach(leader => {
    const item = document.createElement('div');
    item.className = 'pool-item';
    const cardEl = document.createElement('div');
    cardEl.className = `card Leader ${currentDeckConfig.leaderId === leader.id ? 'selected-leader' : ''}`;
    cardEl.innerHTML = `
      <div>
        <div class="card-header"><span class="card-type">LEADER</span></div>
        <div class="card-art"><img src="${leader.image}" alt="${leader.name}"></div>
        <div class="card-name">${leader.name}</div>
      </div>
      <div class="card-power" style="background:#be185d;">👑 HP: ${leader.maxHp}</div>
    `;
    attachCardTooltipEvents(cardEl, leader, null);
    cardEl.addEventListener('click', () => {
      currentDeckConfig.leaderId = leader.id;
      renderDeckBuilder();
    });
    item.appendChild(cardEl);
    leaderContainer.appendChild(item);
  });

  CARD_DATABASE.filter(c => c.type !== 'Leader').forEach(card => {
    const maxAllowed = getCardMaxCopies(card);
    const countInDeck = currentDeckConfig.mainDeck.filter(id => id === card.id).length;
    const item = document.createElement('div');
    item.className = 'pool-item';
    const cardEl = createCardElement(card, null);
    if (countInDeck > 0) cardEl.style.outline = '2px solid #22c55e';

    cardEl.addEventListener('click', () => {
      if (countInDeck < maxAllowed) {
        if (currentDeckConfig.mainDeck.length >= 20) {
          alert('การ์ดใน Main Deck ครบ 20 ใบแล้ว! กรุณาคลิกเอาใบอื่นออกก่อน');
          return;
        }
        currentDeckConfig.mainDeck.push(card.id);
      } else {
        currentDeckConfig.mainDeck = currentDeckConfig.mainDeck.filter(id => id !== card.id);
      }
      renderDeckBuilder();
    });

    const badge = document.createElement('div');
    badge.className = `count-badge ${countInDeck === maxAllowed ? 'maxed' : ''}`;
    badge.textContent = `ใส่ในเด็ค: ${countInDeck} / ${maxAllowed} ใบ`;
    item.appendChild(cardEl);
    item.appendChild(badge);
    mainContainer.appendChild(item);
  });

  const count = currentDeckConfig.mainDeck.length;
  const statusEl = document.getElementById('deck-status-text');
  statusEl.textContent = `Leader: 1/1 | Main Deck: ${count}/20 ใบ`;
  statusEl.style.color = (count === 20) ? '#4ade80' : '#f87171';
  if (saveBtn) saveBtn.disabled = (count !== 20);
}

document.getElementById('btn-open-deck')?.addEventListener('click', openDeckBuilder);
document.getElementById('btn-reset-deck')?.addEventListener('click', () => {
  currentDeckConfig.mainDeck = [];
  renderDeckBuilder();
});

document.getElementById('btn-default-deck')?.addEventListener('click', () => {
  showChoiceModal(
    '🃏 เลือกเด็คมาตรฐาน',
    'คุณต้องการโหลดเด็คมาตรฐานชุดใดเข้าสู่กระดานจัดเด็ค?',
    [
      {
        label: '🔥 โหลด "เด็คจิต" (Leader: มายฮีโร่ เดจิต + 20 ใบ)',
        color: '#0284c7',
        onSelect: () => {
          currentDeckConfig.leaderId = 'L01';
          currentDeckConfig.mainDeck = [...DEFAULT_DECK_LIST];
          renderDeckBuilder();
        }
      },
      {
        label: '🐘 โหลด "เด็คเหนือ" (Leader: ขุนเหนือ + 20 ใบ)',
        color: '#16a34a',
        onSelect: () => {
          currentDeckConfig.leaderId = 'L02';
          currentDeckConfig.mainDeck = [...DEFAULT_NUEA_DECK_LIST];
          renderDeckBuilder();
        }
      },
      {
        label: '⏳ โหลด "เด็ควันสิ้นโลก" (Leader: วันสิ้นโลก + 20 ใบ [ใบที่ 4-15 แบบละ 1 ใบ])',
        color: '#7c3aed',
        onSelect: () => {
          currentDeckConfig.leaderId = 'L03';
          currentDeckConfig.mainDeck = [...DEFAULT_DOOMSDAY_DECK_LIST];
          renderDeckBuilder();
        }
      }
    ]
  );
});

document.getElementById('btn-save-start')?.addEventListener('click', () => {
  if (currentDeckConfig.mainDeck.length !== 20) return;
  localStorage.setItem('my_card_game_deck', JSON.stringify(currentDeckConfig));
  document.getElementById('deck-builder-modal').style.display = 'none';
  setLog('✅ บันทึกเด็คเรียบร้อยแล้ว!');
});

function initGame() {
  gameState.turnCount = 1;
  gameState.activeTurn = 'player';
  gameState.phase = 'Mulligan';
  gameState.mulliganSelected = [];
  gameState.selectedHandIndex = null;
  gameState.selectedAttackerSlot = null;
  gameState.pendingAttack = null;
  gameState.pendingAction = null;
  gameState.isRollingDice = false;
  gameState.gameOver = false;

  previousBoardUids = {
    player: [null, null, null],
    ai: [null, null, null]
  };

  const scrollbox = document.getElementById('action-log-scrollbox');
  if (scrollbox) scrollbox.innerHTML = '';

  const allLeaderIds = ['L01', 'L02', 'L03'];
  const chosenAiLeaderId = (aiConfig.deckChoice === 'RANDOM')
    ? allLeaderIds[Math.floor(Math.random() * allLeaderIds.length)]
    : aiConfig.deckChoice;
  const chosenAiDeckList = getDefaultDeckForLeader(chosenAiLeaderId);

  gameState.player = createContestant('Player', true, 'P1', currentDeckConfig.leaderId, currentDeckConfig.mainDeck);
  gameState.ai = createContestant('AI', false, 'AI', chosenAiLeaderId, chosenAiDeckList);

  drawCards(gameState.player, 5);
  drawCards(gameState.ai, 5);

  document.getElementById('mulligan-modal').style.display = 'flex';
  setLog(`🎲 เริ่มเกมใหม่! AI ใช้ [${gameState.ai.leader.name}] ระดับความยาก [${getAIDifficultyLabel(aiConfig.difficulty)}]`);
  renderGame();
  renderMulliganModal();
}


/* ============================================================================
   หมวดที่ 11: ระบบล็อบบี้ และระบบดวลกับเพื่อนออนไลน์ (PeerJS PvP)
   ============================================================================ */
const pvpState = {
  isMultiplayer: false,
  role: null,
  peer: null,
  conn: null,
  roomCode: null,
  localMulliganDone: false,
  remoteMulliganDone: false,
  isApplyingRemote: false,
  waitingForDefense: false
};

function sendPvpPacket(packet) {
  if (pvpState.isMultiplayer && pvpState.conn && pvpState.conn.open) {
    pvpState.conn.send(packet);
  }
}

function syncBoardToOpponent(latestLogMessage = null) {
  if (!pvpState.isMultiplayer || !pvpState.conn || !pvpState.conn.open || pvpState.isApplyingRemote) return;
  sendPvpPacket({
    type: 'SYNC_BOARD',
    turnCount: gameState.turnCount,
    activeTurnOnReceiver: gameState.activeTurn === 'player' ? 'ai' : 'player',
    phase: gameState.phase,
    gameOver: gameState.gameOver,
    senderData: gameState.player,
    receiverData: gameState.ai,
    logMessage: latestLogMessage
  });
}

const _originalRenderGame = renderGame;
renderGame = function () {
  _originalRenderGame();
  if (pvpState.isMultiplayer && !pvpState.isApplyingRemote && pvpState.localMulliganDone && pvpState.remoteMulliganDone) {
    syncBoardToOpponent();
  }
};

const _originalSetLog = setLog;
setLog = function (message) {
  _originalSetLog(message);
  if (pvpState.isMultiplayer && !pvpState.isApplyingRemote) {
    sendPvpPacket({
      type: 'LOG_ONLY',
      message: message.replace('ของคุณ', 'ของฝ่ายตรงข้าม').replace('คุณ', 'ฝ่ายตรงข้าม')
    });
  }
};

function bindMultiplayerButtons() {
  const confirmMulliganBtn = document.getElementById('btn-confirm-mulligan');
  if (confirmMulliganBtn) {
    const newMulliganBtn = confirmMulliganBtn.cloneNode(true);
    confirmMulliganBtn.parentNode.replaceChild(newMulliganBtn, confirmMulliganBtn);

    newMulliganBtn.addEventListener('click', () => {
      performMulligan(gameState.player, gameState.mulliganSelected);
      document.getElementById('mulligan-modal').style.display = 'none';

      if (!pvpState.isMultiplayer) {
        startPlayerTurn();
        return;
      }

      pvpState.localMulliganDone = true;
      sendPvpPacket({
        type: 'MULLIGAN_READY',
        playerData: gameState.player
      });
      checkBothPlayersMulliganReady();
    });
  }
}

function checkBothPlayersMulliganReady() {
  if (!pvpState.localMulliganDone) return;
  if (!pvpState.remoteMulliganDone) {
    disableControls();
    _originalSetLog('⏳ รอเพื่อนเลือกการ์ด Mulligan...');
    _originalRenderGame();
    return;
  }
  if (pvpState.role === 'host') {
    gameState.activeTurn = 'player';
    startPlayerTurn();
    syncBoardToOpponent('🎲 พร้อมแล้ว! เจ้าของห้องเริ่มเทิร์นที่ 1');
  } else {
    gameState.activeTurn = 'ai';
    disableControls();
    _originalSetLog('🎲 พร้อมแล้ว! รอเจ้าของห้องเล่นเทิร์นที่ 1');
    _originalRenderGame();
  }
}

function handleIncomingPvpData(data) {
  if (!data || !data.type) return;

  if (data.type === 'DECLARE_ATTACK') {
    pvpState.isApplyingRemote = true;
    gameState.ai = data.senderData;
    gameState.player = data.receiverData;
    gameState.ai.name = 'ฝ่ายตรงข้าม';
    gameState.player.name = 'Player';
    _originalRenderGame();
    pvpState.isApplyingRemote = false;

    playAttackVisualAnimation(gameState.ai, gameState.player, data.attackerSlot, data.targetType, data.targetSlot, () => {
      checkDefenderAttackReactions(
        gameState.ai,
        gameState.player,
        data.attackerSlot,
        data.targetType,
        data.targetSlot,
        (specialResult) => {
          if (specialResult === 'FORCE_END_TURN') {
            executeEndPhaseCleanup(gameState.ai);
            sendPvpPacket({
              type: 'ATTACK_RESOLVED',
              forceEndTurn: true,
              nextTurnCount: gameState.turnCount + 1,
              senderData: gameState.player,
              receiverData: gameState.ai
            });
            gameState.turnCount += 1;
            gameState.activeTurn = 'player';
            startPlayerTurn();
            syncBoardToOpponent();
          } else {
            sendPvpPacket({
              type: 'ATTACK_RESOLVED',
              forceEndTurn: false,
              gameOver: gameState.gameOver,
              senderData: gameState.player,
              receiverData: gameState.ai
            });
            _originalRenderGame();
            checkGameOver();
          }
        }
      );
    });
    return;
  }

  if (data.type === 'ATTACK_RESOLVED') {
    pvpState.isApplyingRemote = true;
    pvpState.waitingForDefense = false;
    gameState.ai = data.senderData;
    gameState.player = data.receiverData;
    gameState.ai.name = 'ฝ่ายตรงข้าม';
    gameState.player.name = 'Player';

    if (data.forceEndTurn) {
      gameState.turnCount = data.nextTurnCount;
      gameState.activeTurn = 'ai';
      gameState.phase = 'Main Phase';
      disableControls();
      _originalSetLog('🔮 ฝ่ายตรงข้ามเปิดใช้สกิล "มายอา" พบโซเนบุ — เทิร์นของคุณถูกบังคับจบทันที!');
    } else {
      gameState.gameOver = data.gameOver;
    }

    _originalRenderGame();
    checkGameOver();
    pvpState.isApplyingRemote = false;
    return;
  }

  pvpState.isApplyingRemote = true;
  try {
    if (data.type === 'START_PVP_MATCH') startPvpMatchBoard(pvpState.role);
    else if (data.type === 'MULLIGAN_READY') {
      pvpState.remoteMulliganDone = true;
      gameState.ai = data.playerData;
      gameState.ai.name = 'ฝ่ายตรงข้าม';
      _originalRenderGame();
      checkBothPlayersMulliganReady();
    } else if (data.type === 'SYNC_BOARD') {
      gameState.turnCount = data.turnCount;
      gameState.activeTurn = data.activeTurnOnReceiver;
      gameState.phase = data.phase;
      gameState.gameOver = data.gameOver;
      gameState.ai = data.senderData;
      gameState.player = data.receiverData;
      gameState.ai.name = 'ฝ่ายตรงข้าม';
      gameState.player.name = 'Player';
      if (data.logMessage) _originalSetLog(data.logMessage);
      _originalRenderGame();
      checkGameOver();
    } else if (data.type === 'PASS_TURN') {
      pvpState.waitingForDefense = false;
      gameState.turnCount = data.nextTurnCount;
      gameState.ai = data.senderData;
      gameState.player = data.receiverData;
      gameState.ai.name = 'ฝ่ายตรงข้าม';
      gameState.player.name = 'Player';
      gameState.activeTurn = 'player';
      _originalSetLog('🟢 ตาของคุณ!');
      startPlayerTurn();
      syncBoardToOpponent();
    } else if (data.type === 'LOG_ONLY') {
      _originalSetLog(`🌐 [เพื่อน] ${data.message}`);
    }
  } finally {
    pvpState.isApplyingRemote = false;
  }
}

function startPvpMatchBoard(role) {
  document.getElementById('lobby-screen').style.display = 'none';
  document.getElementById('pvp-room-modal').style.display = 'none';
  document.querySelector('.game-container').style.display = 'flex';

  pvpState.isMultiplayer = true;
  pvpState.role = role;
  pvpState.localMulliganDone = false;
  pvpState.remoteMulliganDone = false;
  pvpState.waitingForDefense = false;

  previousBoardUids = {
    player: [null, null, null],
    ai: [null, null, null]
  };

  gameState.turnCount = 1;
  gameState.activeTurn = (role === 'host') ? 'player' : 'ai';
  gameState.phase = 'Mulligan';
  gameState.gameOver = false;

  const scrollbox = document.getElementById('action-log-scrollbox');
  if (scrollbox) scrollbox.innerHTML = '';

  const isFirst = (role === 'host');
  gameState.player = createContestant('Player', isFirst, isFirst ? 'P1' : 'P2', currentDeckConfig.leaderId, currentDeckConfig.mainDeck);
  gameState.ai = createContestant('ฝ่ายตรงข้าม', !isFirst, isFirst ? 'P2' : 'P1', 'L01', DEFAULT_DECK_LIST);
  drawCards(gameState.player, 5);

  document.getElementById('mulligan-modal').style.display = 'flex';
  _originalSetLog(`🌐 เชื่อมต่อสำเร็จ! (${isFirst ? 'คุณเริ่มก่อน' : 'เพื่อนเริ่มก่อน'}) เลือก Mulligan`);
  _originalRenderGame();
  renderMulliganModal();
}

function createPvpRoomAsHost() {
  if (typeof Peer === 'undefined') { alert('ไม่พบ PeerJS'); return; }
  const randomCode = Math.floor(1000 + Math.random() * 9000).toString();
  if (pvpState.peer) pvpState.peer.destroy();
  pvpState.peer = new Peer(`my-tcg-room-${randomCode}`);
  pvpState.roomCode = randomCode;

  document.getElementById('my-room-code').textContent = 'กำลังสร้าง...';
  document.getElementById('room-code-display').style.display = 'block';

  pvpState.peer.on('open', () => { document.getElementById('my-room-code').textContent = randomCode; });
  pvpState.peer.on('connection', (conn) => {
    pvpState.conn = conn;
    conn.on('open', () => { conn.send({ type: 'START_PVP_MATCH' }); startPvpMatchBoard('host'); });
    conn.on('data', handleIncomingPvpData);
  });
}

function joinPvpRoomAsGuest(codeInput) {
  const code = codeInput.trim();
  if (!code) { alert('กรุณากรอกรหัสห้อง'); return; }
  if (pvpState.peer) pvpState.peer.destroy();
  pvpState.peer = new Peer();
  pvpState.peer.on('open', () => {
    pvpState.conn = pvpState.peer.connect(`my-tcg-room-${code}`);
    pvpState.conn.on('data', handleIncomingPvpData);
  });
  pvpState.peer.on('error', () => { alert('ไม่พบห้องนี้'); });
}

function setupLobbyEvents() {
  ensureVisualEffectsStyles();
  bindMultiplayerButtons();
  setupInGameControlBar();

  const lobbyScreen = document.getElementById('lobby-screen');
  const gameBoard = document.querySelector('.game-container');
  const mull = document.getElementById('mulligan-modal');
  if (!lobbyScreen || !gameBoard) return;

  gameBoard.style.display = 'none';
  if (mull) mull.style.display = 'none';

  document.getElementById('btn-lobby-bot')?.addEventListener('click', () => {
    openAISetupModal();
  });

  document.getElementById('btn-lobby-pvp')?.addEventListener('click', () => {
    document.getElementById('pvp-room-modal').style.display = 'flex';
  });
  document.getElementById('btn-close-pvp-modal')?.addEventListener('click', () => {
    document.getElementById('pvp-room-modal').style.display = 'none';
  });
  document.getElementById('btn-create-room')?.addEventListener('click', createPvpRoomAsHost);
  document.getElementById('btn-join-room')?.addEventListener('click', () => {
    joinPvpRoomAsGuest(document.getElementById('input-join-code').value);
  });

  const openDeckFn = (e) => { if (e) e.preventDefault(); openDeckBuilder(); };
  const openCardsFn = (e) => { if (e) e.preventDefault(); openZoneViewerModal('🔍 คลังการ์ดทั้งหมด (คลิกที่การ์ดเพื่อดูรายละเอียด)', CARD_DATABASE, null); };

  document.getElementById('nav-deck')?.addEventListener('click', openDeckFn);
  document.getElementById('nav-cards')?.addEventListener('click', openCardsFn);
}

setupLobbyEvents();
