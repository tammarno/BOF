CARD_DATABASE.push(
  // ==================== MONSTER & SPELL: เด็คโอ็ต ====================
  {
    id: 'OM01',
    name: 'ไอโอ๊ตบ้าการ์ตูน',
    type: 'Monster',
    tribe: 'บ้า',
    rarity: 'SR',
    power: 1,
    image: 'images/เด็คโอ๊ต/2.png',
    ability: 'OAT_ANIME_SKILL',
    desc: 'ออโต้: เมื่อการ์ดนี้ลงสนามด้วยความสามารถของ "ไอแบงค์บ้าเกม" พลังโจมตีเพิ่ม 2 หน่วย และได้รับความสามารถ ออโต้/1 เทิร์น: เมื่อการ์ดใบนี้จะถูกทำลายหรือนำลงนรก การ์ดใบนี้จะไม่ถูกทำลายหรือลงนรก'
  },
  {
    id: 'OM02',
    name: 'ไอแบงค์บ้าเกม',
    type: 'Monster',
    tribe: 'บ้า',
    rarity: 'SR',
    power: 2,
    image: 'images/เด็คโอ๊ต/3.png',
    ability: 'BANK_GAME_SKILL',
    desc: 'ออโต้: เมื่อการ์ดนี้ลงสนาม เปิดการ์ด 2 ใบบนสุดของกอง เลือกการ์ด 1 ใบจากในนั้นลงสนาม และนำการ์ดที่ไม่ได้เลือกไปไว้บนกอง',
    effects: [
      {
        id: 'bank_on_summon',
        trigger: 'ON_SUMMON',
        steps: [
          { block: 'BANK_SUMMON_TOP2' }
        ]
      }
    ]
  },
  {
    id: 'OM03',
    name: 'ไอจิตบ้ากาม',
    type: 'Monster',
    tribe: 'บ้า',
    rarity: 'N',
    power: 2,
    image: 'images/เด็คโอ๊ต/4.png',
    ability: 'JIT_CRAZY_SKILL',
    desc: 'ออโต้: เมื่อการ์ดนี้ลงสนาม เลือกยูนิทฝ่ายตรงข้าม 1 ใบ ลดพลังโจมตี 1 หน่วย จนจบเทิร์น',
    effects: [
      {
        id: 'jit_crazy_summon',
        trigger: 'ON_SUMMON',
        steps: [
          { block: 'JIT_CRAZY_DEBUFF' }
        ]
      }
    ]
  },
  {
    id: 'OM04',
    name: 'ไออาร์มบ้าการ์ดเกม',
    type: 'Monster',
    tribe: 'บ้า',
    rarity: 'N',
    power: 3,
    image: 'images/เด็คโอ๊ต/5.png',
    ability: 'ARM_CARDGAME_SKILL',
    desc: 'ออโต้: เมื่อการ์ดนี้ลงสนาม ทำความสามารถตามลำดับตามเงื่อนไขข้างล่าง:\n1) ถ้ามีการ์ด "ไอโอ๊ตบ้าการ์ตูน" บนสนาม เลือกการ์ดจากนรกขึ้นมือไม่เกิน 1 ใบ\n2) ถ้ามีการ์ด "ไอแบงค์บ้าเกม" บนสนาม เพิ่มพลังโจมตีการ์ดนี้ 2 หน่วย จนจบเทิร์นอีกฝั่ง\n3) ถ้ามีการ์ด "ไอจิตบ้ากาม" บนสนาม ความสามารถของไอจิตบ้ากามเปลี่ยนจาก 1 ใบ เป็นทุกใบ',
    effects: [
      {
        id: 'arm_summon',
        trigger: 'ON_SUMMON',
        steps: [
          { block: 'ARM_TRIPLE_CHECK' }
        ]
      }
    ]
  },
  {
    id: 'OM05',
    name: 'ไอเหนือผู้มีคลิปแปลก',
    type: 'Monster',
    tribe: 'บ้า',
    rarity: 'N',
    power: 2,
    image: 'images/เด็คโอ๊ต/6.png',
    ability: 'NUEA_WEIRD_CLIP',
    desc: 'ออโต้: เมื่อลงสนาม ดูการ์ด 3 ใบบนสุดของกอง ถ้ามีการ์ดเวทมนตร์ให้หยิบขึ้นมือไม่เกิน 1 ใบ นำการ์ดไปไว้ใต้กอง\nสั่งใช้งาน/1 เทิร์น: สั่งใช้การ์ดเวทมนตร์จากบนมือโดยไม่เสียการจำกัดการใช้เวทมนตร์',
    effects: [
      {
        id: 'nuea_clip_summon',
        trigger: 'ON_SUMMON',
        steps: [
          { block: 'NUEA_CLIP_TOP3_SPELL' }
        ]
      },
      {
        id: 'nuea_clip_free_spell',
        label: 'สั่งใช้การ์ดเวทมนตร์จากบนมือโดยไม่เสียโควต้าเวทมนตร์',
        trigger: 'ACTIVATE_MAIN',
        oncePerTurn: true,
        steps: [
          { block: 'NUEA_CLIP_FREE_CAST' }
        ]
      }
    ]
  },
  {
    id: 'OM06',
    name: 'ไอเจย์นักบิด',
    type: 'Monster',
    tribe: 'บ้า',
    rarity: 'N',
    power: 1,
    image: 'images/เด็คโอ๊ต/7.png',
    ability: 'JAY_BIKER_SKILL',
    desc: 'สั่งใช้งาน/1 เทิร์น: เรสการ์ดใบนี้ ฝั่งตรงข้ามทิ้งการ์ดบนมือ 1 ใบ และจั่วการ์ด 1 ใบ',
    effects: [
      {
        id: 'jay_biker_skill',
        label: 'Rest การ์ดใบนี้ -> ฝั่งตรงข้ามทิ้งการ์ดบนมือ 1 ใบ และเราจั่วการ์ด 1 ใบ',
        trigger: 'ACTIVATE_MAIN',
        oncePerTurn: true,
        costs: [{ type: 'REST_SELF' }],
        steps: [
          { block: 'JAY_DISCARD_AND_DRAW' }
        ]
      }
    ]
  },
  {
    id: 'OM07',
    name: 'ไอดีนบ้าHee',
    type: 'Monster',
    tribe: 'บ้า',
    rarity: 'R',
    power: 3,
    cannotNormalSummon: true,
    image: 'images/เด็คโอ๊ต/8.png',
    ability: 'DEAN_CRAZY_SKILL',
    desc: '[ห้ามอัญเชิญแบบปกติ]\nออโต้: เมื่อการ์ดนี้ลงสนามด้วยความสามารถของ "ไอแบงค์บ้าเกม" นำการ์ดจากนรก 3 ใบกลับเข้ากอง แล้วสับกอง\nสั่งใช้งาน/1 เทิร์น: จั่วการ์ด 2 ใบ และทิ้งการ์ดบนมือ 1 ใบ',
    effects: [
      {
        id: 'dean_draw2_discard1',
        label: 'จั่วการ์ด 2 ใบ แล้วทิ้งการ์ดบนมือ 1 ใบ',
        trigger: 'ACTIVATE_MAIN',
        oncePerTurn: true,
        steps: [
          { block: 'DEAN_DRAW2_DISCARD1' }
        ]
      }
    ]
  },
  {
    id: 'OS01',
    name: 'ท่าไม้ตาย(มั้ง)',
    type: 'NormalSpell',
    rarity: 'R',
    effect: 'SPELL_ULTIMATE_MAYBE',
    image: 'images/เด็คโอ๊ต/9.png',
    desc: 'ทิ้งการ์ดบนมือ 3 ใบ ทำลายการ์ดบนสนามฝ่ายตรงข้ามทั้งหมด (*เงื่อนไข ต้องมีการ์ด "ไอโอ๊ตบ้าการ์ตูน" บนสนาม)',
    effects: [
      {
        id: 'spell_os01',
        trigger: 'CAST_SPELL',
        condition: { type: 'ALLY_ON_BOARD', cardId: 'OM01' },
        costs: [{ type: 'DISCARD_HAND', count: 3 }],
        steps: [
          { block: 'DESTROY_UNIT', target: 'OPPONENT', select: 'ALL' }
        ]
      }
    ]
  },
  {
    id: 'OS02',
    name: 'สงครามความบ้า',
    type: 'NormalSpell',
    rarity: 'N',
    effect: 'SPELL_CRAZY_WAR',
    image: 'images/เด็คโอ๊ต/10.png',
    desc: 'หาการ์ด "ไอโอ๊ตบ้าการ์ตูน" และ "ไอแบงค์บ้าเกม" จากกองหรือนรกอย่างละไม่เกิน 1 ใบขึ้นมือ ถ้าหาจากกองให้สับกอง',
    effects: [
      {
        id: 'spell_os02',
        trigger: 'CAST_SPELL',
        steps: [
          { block: 'CRAZY_WAR_SEARCH_PAIR' }
        ]
      }
    ]
  },
  {
    id: 'OS03',
    name: 'เร็วขึ้นอีก!!!!!!',
    type: 'ReactionSpell',
    rarity: 'R',
    effect: 'SPELL_FASTER_UNBLOCKABLE',
    image: 'images/เด็คโอ๊ต/11.png',
    desc: 'เมื่อ "ไอแบงค์บ้าเกม" โจมตี ฝ่ายตรงข้ามไม่สามารถนำยูนิทมาป้องกันการโจมตีนี้ได้'
  }
);

DECK_LISTS.L06 = [
  'OM01', 'OM01', 'OM02', 'OM02', 'OM03', 'OM03', 'OM04', 'OM04', 'OM05', 'OM05',
  'OM06', 'OM06', 'OM07', 'OM07', 'OS01', 'OS01', 'OS02', 'OS02', 'OS03', 'OS03'
];
