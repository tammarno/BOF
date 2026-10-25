CARD_DATABASE.push(
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
);

DECK_LISTS.L03 = [
  'DM01', 'DM01', 'DM02', 'DM02',
  'DM03', 'DM04', 'DM05', 'DM06', 'DM07', 'DM08',
  'DM09', 'DM10', 'DM11', 'DM12', 'DM13', 'DM14',
  'DS01', 'DS01', 'DS02', 'DS02'
];
