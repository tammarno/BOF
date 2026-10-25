CARD_DATABASE.push(
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
  }
);

DECK_LISTS.L02 = [
  'NM01', 'NM01', 'NM02', 'NM02', 'NM03', 'NM03', 'NM04', 'NM04', 'NM05', 'NM05',
  'NS01', 'NS01', 'NS02', 'NS02', 'NS03', 'NS03', 'NS04', 'NS04', 'NS05', 'NS05'
];
