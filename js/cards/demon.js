CARD_DATABASE.push(
  // ==================== MONSTER & SPELL: เด็คปีศาจ ====================
  {
    id: 'DMM01',
    name: 'ลูซิเฟอร์ บาปความหยิ่งผยอง',
    type: 'Monster',
    tribe: 'ปีศาจ',
    rarity: 'N',
    power: 2,
    image: 'images/เด็คปีศาจ/2.png',
    ability: 'LUCIFER_PRIDE',
    desc: 'ออโต้: เมื่อเข้าเทิร์นฝ่ายตรงข้าม ถ้าในมิติมืดมี "ดินแดนปีศาจ" การ์ดที่ต่อสู้กับการ์ดใบนี้ พลังโจมตีลด 1 หน่วย'
  },
  {
    id: 'DMM02',
    name: 'แมมมอน บาปความโลภ',
    type: 'Monster',
    tribe: 'ปีศาจ',
    rarity: 'N',
    power: 1,
    image: 'images/เด็คปีศาจ/3.png',
    ability: 'MAMMON_GREED',
    desc: 'ออโต้: เมื่อการ์ดนี้ลงสู่สนาม อีกฝั่งเลือกทำ 1 อย่างจาก 2 อย่างด้านล่าง:\n1) ทิ้งการ์ด 1 ใบ ถ้าทิ้ง "เวทมนตร์" เราจั่ว 1 ใบ\n2) นำการ์ดใบบนสุดของกองลงนรก เรานำการ์ดจากดรอป 1 ใบขึ้นมือ',
    effects: [
      {
        id: 'mammon_summon',
        trigger: 'ON_SUMMON',
        steps: [
          { block: 'MAMMON_SUMMON_CHOICE' }
        ]
      }
    ]
  },
  {
    id: 'DMM03',
    name: 'ลิเวียธาน บาปความริษยา',
    type: 'Monster',
    tribe: 'ปีศาจ',
    rarity: 'N',
    power: 2,
    image: 'images/เด็คปีศาจ/4.png',
    ability: 'LEVIATHAN_ENVY',
    desc: 'สั่งใช้งาน/1 เทิร์น: สามารถเลือกยูนิทฝั่งตรงข้ามที่มีพลังโจมตี 2 หน่วย 1 ใบ ถ้าการ์ดใบนั้นโจมตี ให้เปลี่ยนการโจมตีมาที่ตัวนี้แทน',
    effects: [
      {
        id: 'leviathan_taunt',
        label: 'เลือกยูนิทอีกฝ่ายที่พลังโจมตี 2 หน่วย 1 ใบ (บังคับโจมตีใบนี้)',
        trigger: 'ACTIVATE_MAIN',
        oncePerTurn: true,
        steps: [
          { block: 'LEVIATHAN_MARK_TARGET' }
        ]
      }
    ]
  },
  {
    id: 'DMM04',
    name: 'ซาตาน บาปโทสะ',
    type: 'Monster',
    tribe: 'ปีศาจ',
    rarity: 'N',
    power: 3,
    image: 'images/เด็คปีศาจ/5.png',
    ability: 'SATAN_WRATH',
    desc: 'สั่งใช้งาน/1 เกม: เมื่อเรามีเลือด 1 หน่วย ทิ้งการ์ดบนมือเรา 5 ใบ ทำลายการ์ดใบอื่นบนสนามทุกใบ และ ฝั่งตรงข้ามทิ้งการ์ดบนมือ 3 ใบ',
    effects: [
      {
        id: 'satan_wrath_skill',
        label: '[1 เกม] เมื่อ HP=1 ทิ้งมือ 5 ใบ -> ทำลายใบอื่นบนสนามทั้งหมด & อีกฝ่ายทิ้งมือ 3 ใบ',
        trigger: 'ACTIVATE_MAIN',
        oncePerTurn: true,
        steps: [
          { block: 'SATAN_WRATH_EFFECT' }
        ]
      }
    ]
  },
  {
    id: 'DMM05',
    name: 'แอสโมดิวส์ บาปราคะ',
    type: 'Monster',
    tribe: 'ปีศาจ',
    rarity: 'N',
    power: 1,
    image: 'images/เด็คปีศาจ/6.png',
    ability: 'ASMODEUS_LUST',
    desc: 'ออโต้: เมื่อลงสนาม ดูการ์ด 3 ใบบนสุดของกอง ถ้ามีเวทมนตร์ให้หยิบขึ้นมือไม่เกิน 1 ใบ นำการ์ดที่เหลือไปไว้ใต้กอง ถ้าเป็นเวทมนตร์ที่ชื่อว่า "สัญญาปีศาจ" ให้นำไปเข้ามิติมืด',
    effects: [
      {
        id: 'asmodeus_summon',
        trigger: 'ON_SUMMON',
        steps: [
          { block: 'ASMODEUS_TOP3_SPELL' }
        ]
      }
    ]
  },
  {
    id: 'DMM06',
    name: 'เบลเซบับ บาปตะกละ',
    type: 'Monster',
    tribe: 'ปีศาจ',
    rarity: 'R',
    power: 2,
    image: 'images/เด็คปีศาจ/7.png',
    ability: 'BEELZEBUB_GLUTTONY',
    desc: 'สั่งใช้งาน/1 เทิร์น: เราสามารถนำการ์ดจากดรอปกลับเข้ากอง 2 ใบหรือมากกว่า ถ้าทำการใบนี้ตอนต่อสู้กับการ์ดที่มีพลังโจมตีเท่ากัน การ์ดใบนี้จะชนะการต่อสู้นั้น และไม่ออกจากสนามจนจบเทิร์นฝ่ายเรา',
    effects: [
      {
        id: 'beelzebub_gluttony',
        label: 'นำการ์ดจากนรก 2 ใบขึ้นไปกลับเข้ากอง -> ชนะเมื่อสู้กับพลังเท่ากัน & ไม่ถูกทำลายจนจบเทิร์น',
        trigger: 'ACTIVATE_MAIN',
        oncePerTurn: true,
        steps: [
          { block: 'BEELZEBUB_GLUTTONY_SKILL' }
        ]
      }
    ]
  },
  {
    id: 'DMM07',
    name: 'เบลเฟกอร์ บาปเกียจคร้าน',
    type: 'Monster',
    tribe: 'ปีศาจ',
    rarity: 'R',
    power: 2,
    image: 'images/เด็คปีศาจ/8.png',
    ability: 'BELPHEGOR_SLOTH',
    desc: 'ออโต้: เมื่อยูนิทนี้โจมตีสำเร็จ นำการ์ดบนสุดของทั้ง 2 ฝั่งเข้ามิติมืดของตน'
  },
  {
    id: 'DMS01',
    name: 'สัญญาปีศาจ',
    type: 'LandSpell',
    rarity: 'R',
    effect: 'LAND_DEMON_CONTRACT',
    image: 'images/เด็คปีศาจ/9.png',
    desc: '[แลนด์สเปล — แสดงผลเฉพาะเมื่ออยู่ในมิติมืด]\nถ้าการ์ดใบนี้อยู่ในมิติมืด ยูนิทเผ่า "ปีศาจ" ทุกใบบนสนามพลังโจมตี +1 ทั้งเกม และเมื่อจบเทิร์น เลือกการ์ดจากดรอป 1 ใบขึ้นมือ'
  },
  {
    id: 'DMS02',
    name: 'คำเตือนต้องห้าม',
    type: 'ReactionSpell',
    rarity: 'SR',
    effect: 'SPELL_FORBIDDEN_WARNING',
    image: 'images/เด็คปีศาจ/10.png',
    desc: 'ร่ายได้เมื่ออีกฝั่งโจมตีและเรามียูนิทเผ่า "ปีศาจ" บนสนาม เราและฝั่งตรงข้ามนำการ์ดบนมือตนเอง 1 ใบเข้ามิติมืด (และยกเลิกการโจมตีนั้น)'
  },
  {
    id: 'DMS03',
    name: 'ดินแดนปีศาจ',
    type: 'LandSpell',
    rarity: 'SR',
    effect: 'LAND_DEMON_REALM',
    image: 'images/เด็คปีศาจ/11.png',
    desc: '[แลนด์สเปล — แสดงผลเฉพาะเมื่ออยู่ในมิติมืด]\nเมื่อมีการ์ดที่อยู่ในมิติมืดทั้งฝั่งเราและฝั่งตรงข้ามมีรวมกัน 15 ใบ เราจะชนะเกมทันที และการ์ดใบนี้ไม่สามารถถูกยกเลิกจากความสามารถได้'
  }
);

DECK_LISTS.L05 = [
  'DMM01', 'DMM01', 'DMM02', 'DMM02', 'DMM03', 'DMM03', 'DMM04', 'DMM04', 'DMM05', 'DMM05',
  'DMM06', 'DMM06', 'DMM07', 'DMM07', 'DMS01', 'DMS01', 'DMS02', 'DMS02', 'DMS03', 'DMS03'
];
