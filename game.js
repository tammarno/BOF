/* ============================================================================
   หมวดที่ 1: ฐานข้อมูลการ์ดทั้งหมด (CARD DATABASE - เด็คจิต, เด็คเหนือ, เด็ควันสิ้นโลก)
   ============================================================================ */
const CARD_DATABASE = [
  // ==================== LEADER (ทั้ง 3 เด็ค) ====================
  {
    id: 'L01',
    name: 'มายฮีโร่ เดจิต',
    type: 'Leader',
    maxHp: 6,
    image: 'images/เด็คจิต/1.png',
    ability: 'LEADER_DEJIT_BUFF',
    desc: 'สั่งใช้งาน/1 เทิร์น: เลือกยูนิทฝั่งเรา 1 ตัว เพิ่มพลังโจมตี +1 จนจบเทิร์น'
  },
  {
    id: 'L02',
    name: 'ขุนเหนือ',
    type: 'Leader',
    maxHp: 6,
    image: 'images/เด็คเหนือ/1.png',
    ability: 'LEADER_KHUN_NUEA',
    desc: 'ออโต้: เมื่อเข้าเทิร์น นำ "ไพร่ชาวนาเหนือ" จากกองหรือนรกไม่เกิน 1 ใบขึ้นมือ\nต่อเนื่อง: ถ้ามี "เหนือ" 3 ใบบนสนาม "เหนือ" ทุกใบบนสนามเราพลังโจมตี +1'
  },
  {
    id: 'L03',
    name: 'วันสิ้นโลก',
    type: 'Leader',
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
    power: 2,
    image: 'images/เด็คจิต/2.png',
    ability: 'BAKU_SKILL',
    desc: 'ต่อเนื่อง: ถ้ามีโทโดโรจิตบนสนามเรา พลัง +1\nออโต้: เมื่อลงสนาม เลือกทำลายยูนิทอีกฝ่าย 1 ใบ'
  },
  {
    id: 'M02',
    name: 'โทโดโรจิต',
    type: 'Monster',
    power: 1,
    image: 'images/เด็คจิต/3.png',
    ability: 'TODORO_SKILL',
    desc: 'สั่งใช้งาน1/เทิร์น: ทิ้งมือ 1 ใบ โม่กองอีกฝ่าย 1 ใบ\nสั่งใช้งาน2/เทิร์น: นำบาคุจิตจากนรกขึ้นมือ 1 ใบ'
  },
  {
    id: 'M03',
    name: 'ออลจิต',
    type: 'Monster',
    power: 2,
    image: 'images/เด็คจิต/4.png',
    ability: 'ALL_JIT_HAND_INTERCEPT',
    desc: 'เมื่อลีดเดอร์ถูกโจมตี: อัญเชิญใบนี้จากมือลงสนาม และเปลี่ยนเป้าหมายโจมตีมาที่ใบนี้แทน'
  },
  {
    id: 'M04',
    name: 'ออลฟอจิต',
    type: 'Monster',
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
    power: 2,
    image: 'images/เด็คจิต/6.png',
    ability: 'ENDE_SKILL',
    desc: 'สั่งใช้งาน: พลังโจมตียูนิทนี้ +2 และเมื่อจบเทิร์น ทำลายการ์ดใบนี้'
  },
  {
    id: 'M06',
    name: 'ฮออ์กส์ฟีม',
    type: 'Monster',
    power: 2,
    image: 'images/เด็คจิต/7.png',
    ability: 'HAWKS_SKILL',
    desc: 'สั่งใช้งาน: ลดพลังใบนี้ -2 นำเอ็นเดจิตจากกอง/นรกขึ้นมือ\nออโต้: เมื่อเอ็นเดจิตใช้สกิล ใบนี้พลัง +2'
  },
  {
    id: 'S01',
    name: 'โอ็ยใครเหยียบตีน!!!',
    type: 'NormalSpell',
    effect: 'SPELL_DISCARD_DESTROY',
    image: 'images/เด็คจิต/8.png',
    desc: 'ทิ้งการ์ดบนมือ 1 ใบ เลือกทำลายยูนิทฝั่งตรงข้าม 1 ใบ'
  },
  {
    id: 'S02',
    name: 'เชี่ย หุ้นตก',
    type: 'NormalSpell',
    effect: 'SPELL_DEBUFF_ALL_3',
    image: 'images/เด็คจิต/9.png',
    desc: 'ลดพลังโจมตีของยูนิทฝั่งตรงข้ามทุกใบลง 3 หน่วย จนจบเทิร์น'
  },
  {
    id: 'S03',
    name: 'หนึ่งเดียวเพื่อทุกสิ่ง',
    type: 'NormalSpell',
    effect: 'SPELL_REST_1_HEAL_1',
    image: 'images/เด็คจิต/10.png',
    desc: 'Rest ยูนิทที่ Stand อยู่ฝั่งเรา 1 ใบ แล้วเพิ่มพลังชีวิตลีดเดอร์เรา +1'
  },
  {
    id: 'S04',
    name: 'ทุกสิ่งเพื่อหนึ่งเดียว',
    type: 'NormalSpell',
    effect: 'SPELL_REST_2_GRANT_BURN',
    image: 'images/เด็คจิต/11.png',
    desc: 'Rest ยูนิทฝั่งเรา 2 ใบ เลือกยูนิทเรา 1 ใบได้รับออโต้: เมื่อตีทำลายยูนิทสำเร็จ ทำดาเมจลีดเดอร์อีกฝ่าย 1'
  },

  // ==================== MONSTER & SPELL: เด็คเหนือ ====================
  {
    id: 'NM01',
    name: 'ไพร่ชาวนาเหนือ',
    type: 'Monster',
    power: 1,
    image: 'images/เด็คเหนือ/2.png',
    ability: 'PEASANT_HAND_SKILL',
    desc: 'สั่งใช้จากบนมือ: ส่งใบนี้ลงนรกและเลือก 1 อย่าง:\n1) อัญเชิญ "สายลับไพร่เหนือ" จากกองหรือนรกลงสนามอีกฝ่าย\n2) นำการ์ด "ทหาร" 1 ใบจากกองขึ้นมือ'
  },
  {
    id: 'NM02',
    name: 'ทหารหลวงเหนือ',
    type: 'Monster',
    power: 2,
    image: 'images/เด็คเหนือ/3.png',
    ability: 'ROYAL_GUARD_SKILL',
    desc: 'สั่งใช้จากบนมือ: ส่ง "ไพร่ชาวนาเหนือ" 1 ใบบนมือลงนรกเพื่ออัญเชิญจุติใบนี้ (พลัง +1)\nจุติ: หากมี "ทหารเกณฑ์เหนือ" บนสนามเรา อัญเชิญ "ทหาร" 1 ใบจากกอง/นรกลงสนามทันที'
  },
  {
    id: 'NM03',
    name: 'ทหารพรานเหนือ',
    type: 'Monster',
    power: 1,
    image: 'images/เด็คเหนือ/4.png',
    ability: 'RANGER_SKILL',
    desc: 'สั่งใช้จากบนมือ: ส่ง "ไพร่ชาวนาเหนือ" ลงนรกแล้วอัญเชิญใบนี้ลงสนาม (พลัง +1)\nสั่งใช้/เทิร์นละครั้ง: เลือกยูนิท 1 ใบ ถ้าเป็นฝั่งเราพลัง +1 ถ้าเป็นฝั่งตรงข้ามพลัง -1'
  },
  {
    id: 'NM04',
    name: 'ทหารเกณฑ์เหนือ',
    type: 'Monster',
    power: 1,
    image: 'images/เด็คเหนือ/5.png',
    ability: 'CONSCRIPT_SKILL',
    desc: 'ออโต้: เมื่อลงสนาม พลัง +1\nต่อเนื่อง: พลังโจมตี +1 ตามจำนวน "ทหาร" ใบอื่นบนสนามเรา\nคำสั่งเสีย: เมื่อถูกทำลาย นำการ์ดที่มีคำว่า "ไพร่" 1 ใบจากนรกขึ้นมือ'
  },
  {
    id: 'NM05',
    name: 'สายลับไพร่เหนือ',
    type: 'Monster',
    power: 0,
    image: 'images/เด็คเหนือ/6.png',
    ability: 'SPY_SKILL',
    isSpy: true,
    desc: 'สายลับ: อัญเชิญการ์ดใบนี้ลงบนสนามฝ่ายตรงข้าม\nคำสั่งเสีย: ลงนรกฝ่ายตรงข้าม และฝ่ายตรงข้ามจั่วการ์ด 1 ใบ'
  },
  {
    id: 'NS01',
    name: 'หมอไพร่เหนือ',
    type: 'NormalSpell',
    effect: 'SPELL_RECOVER_PHRAI',
    image: 'images/เด็คเหนือ/7.png',
    desc: 'นำการ์ดที่มีคำว่า "ไพร่" 1 ใบจากนรกขึ้นมือ'
  },
  {
    id: 'NS02',
    name: 'หมอสนามเหนือ',
    type: 'NormalSpell',
    effect: 'SPELL_RECOVER_SOLDIER',
    image: 'images/เด็คเหนือ/8.png',
    desc: 'นำการ์ดที่มีคำว่า "ทหาร" 1 ใบจากนรกขึ้นมือ'
  },
  {
    id: 'NS03',
    name: 'ระเบิดปูพรม',
    type: 'NormalSpell',
    effect: 'SPELL_CARPET_BOMB',
    image: 'images/เด็คเหนือ/9.png',
    desc: 'แสดงผลตามยูนิท "ทหาร" บนสนามเรา:\n- ทหารเกณฑ์เหนือ: ยูนิท "เหนือ" ทุกใบพลัง +1 จนจบเทิร์น\n- ทหารพรานเหนือ: ทำลายยูนิทอีกฝ่าย 1 ใบ\n- ทหารหลวงเหนือ: ยูนิทเราทุกใบไม่ถูกทำลายจนเริ่มเทิร์นถัดไป'
  },
  {
    id: 'NS04',
    name: 'หน่วยข่าวกรอง',
    type: 'NormalSpell',
    effect: 'SPELL_RECOVER_SPELL',
    image: 'images/เด็คเหนือ/10.png',
    desc: 'นำการ์ดเวทจากในนรกขึ้นมือ 1 ใบ'
  },
  {
    id: 'NS05',
    name: 'จีวรบิน',
    type: 'NormalSpell',
    effect: 'SPELL_BOUNCE_ENEMY',
    image: 'images/เด็คเหนือ/11.png',
    desc: 'เลือกยูนิทฝั่งตรงข้าม 1 ใบ นำการ์ดใบนั้นกลับขึ้นมือเจ้าของ'
  },

  // ==================== MONSTER & SPELL: เด็ควันสิ้นโลก ====================
  {
    id: 'DM01',
    name: 'โอนามิ ผู้ทำลายโลก',
    type: 'Monster',
    power: 2,
    maxCopies: 2,
    image: 'images/วันสิ้นโลก/2.png',
    ability: 'ONAMI_SKILL',
    desc: 'คู่หู: เมื่ออยู่คู่กับ "โรเซเลีย" พลังโจมตี +2 ตลอดเทิร์นเราและอีกฝ่าย\nสั่งใช้งาน/1 เทิร์น: ทิ้งการ์ดมือ 1 ใบ อัญเชิญ "โรเซเลีย" จากกองหรือนรก 1 ใบลงสนาม แล้วสับกอง'
  },
  {
    id: 'DM02',
    name: 'โรเซเลีย',
    type: 'Monster',
    power: 3,
    maxCopies: 2,
    image: 'images/วันสิ้นโลก/3.png',
    ability: 'ROSELIA_SKILL',
    desc: 'คู่หู: เมื่ออยู่คู่กับโอนามิ สามารถ Rest ใบนี้เพื่อจั่ว 1 ใบได้\nออโต้: เมื่อลงสนามด้วยสกิลของโอนามิ จะไม่โดนความสามารถการ์ดอีกฝ่ายจนจบเทิร์น\nออโต้: เมื่อถูกทำลายจากการต่อสู้ จั่ว 1 ใบ'
  },
  {
    id: 'DM03',
    name: 'มายอา',
    type: 'Monster',
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
    power: 1,
    maxCopies: 1,
    image: 'images/วันสิ้นโลก/9.png',
    ability: 'EMI_SKILL',
    desc: '[ใส่ได้ 1 ใบ] ออโต้: ถ้าบนสนามเรามี "เดบิรุน" พลังโจมตี +1 และสามารถทิ้งการ์ดมือ 3 ใบเพื่อ Stand โจมตีอีกครั้งได้'
  },

  // --- การ์ดอนาคต (DM09 - DM14): ห้ามอัญเชิญแบบปกติ ---
  {
    id: 'DM09',
    name: 'ผู้รักษาความฝัน มายอา',
    type: 'Monster',
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
    power: 3,
    maxCopies: 1,
    cannotNormalSummon: true,
    image: 'images/วันสิ้นโลก/14.png',
    ability: 'FUTURE_ASHILA',
    futureBaseId: 'DM07',
    futureBaseName: 'แอชชี่ล่า',
    desc: '[ใส่ได้ 1 ใบ | ห้ามอัญเชิญปกติ | อนาคต: แอชชี่ล่า]\nส่ง "แอชชี่ล่า" บนสนามไปมิติมืดแล้วคอลใบนี้: การ์ดทุกใบบนสนามอีกฝ่ายพลังโจมตี -1 จนจบเทิร์น (จบเทิร์นลงนรกและคอลแอชชี่ล่ากลับมา)'
  },
  {
    id: 'DM14',
    name: 'สุดยอดเอไอ เอมิ',
    type: 'Monster',
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
    maxCopies: 2,
    effect: 'SPELL_LIGHT_AWAKEN',
    image: 'images/วันสิ้นโลก/16.png',
    desc: 'จั่วการ์ด 1 ใบ แต่ถ้าในนรกเรามีการ์ด 5 ใบขึ้นไป จั่ว 2 ใบแทน และเพิ่มพลังโจมตี +1 ให้ยูนิตบนสนามเรา 1 ใบ'
  },
  {
    id: 'DS02',
    name: 'พวกเราจะช่วยเอง',
    type: 'ReactionSpell',
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
   หมวดที่ 2: ฟังก์ชันตรวจสอบเผ่า การย้ายโซน และการคำนวณค่าพลัง
   ============================================================================ */
function isNueaCard(card) { return card && card.name && card.name.includes('เหนือ'); }
function isSoldierCard(card) { return card && card.name && card.name.includes('ทหาร'); }
function isPhraiCard(card) { return card && card.name && card.name.includes('ไพร่'); }
function getCardMaxCopies(cardTemplate) { return cardTemplate && cardTemplate.maxCopies !== undefined ? cardTemplate.maxCopies : 2; }

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

function getEffectivePower(card, ownerContestant) {
  if (!card || card.type !== 'Monster') return 0;

  let total = (card.basePower !== undefined ? card.basePower : card.power)
    + (card.permPowerMod || 0)
    + (card.tempPowerMod || 0);

  if (ownerContestant && Array.isArray(ownerContestant.board)) {
    if (card.id === 'M01' && ownerContestant.board.some(m => m !== null && m.id === 'M02')) total += 1;
    if (card.id === 'NM04') {
      const otherSoldiers = ownerContestant.board.filter(m => m !== null && m.uid !== card.uid && isSoldierCard(m)).length;
      total += otherSoldiers;
    }
    if (ownerContestant.leader && ownerContestant.leader.id === 'L02' && isNueaCard(card)) {
      const nueaCount = ownerContestant.board.filter(m => m !== null && isNueaCard(m)).length;
      if (nueaCount >= 3) total += 1;
    }
    if (card.id === 'DM01' && isPartnerActive(ownerContestant)) total += 2;
    if (card.id === 'DM08' && ownerContestant.board.some(m => m !== null && m.id === 'DM04')) total += 1;
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

// ทำลายยูนิตบนสนาม (ถือว่าถูกทำลายจริง + ตรวจสอบสกิลแอชชี่ล่าบนมืออัตโนมัติ)
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

  // 1. คำสั่งเสีย ทหารเกณฑ์เหนือ (NM04)
  if (monster.id === 'NM04') {
    const phraiIdx = boardOwner.graveyard.findIndex(c => c.uid !== monster.uid && isPhraiCard(c));
    if (phraiIdx !== -1) {
      const phraiCard = boardOwner.graveyard.splice(phraiIdx, 1)[0];
      resetCardStateForZoneChange(phraiCard);
      boardOwner.hand.push(phraiCard);
      setLog(`🪦 [คำสั่งเสีย - ทหารเกณฑ์เหนือ] นำ "${phraiCard.name}" 1 ใบจากนรกขึ้นมือของ ${boardOwner.name}!`);
    }
  }

  // 2. คำสั่งเสีย สายลับไพร่เหนือ (NM05)
  if (monster.id === 'NM05') {
    drawCards(otherContestant, 1);
    setLog(`🕵️ [คำสั่งเสีย - สายลับไพร่เหนือ] ลงนรกของ ${boardOwner.name} และ ${otherContestant.name} ได้จั่วการ์ด 1 ใบ!`);
  }

  // 3. ออโต้ โรเซเลีย (DM02)
  if (monster.id === 'DM02' && isFromBattle) {
    drawCards(boardOwner, 1);
    setLog(`🌹 [ออโต้ - โรเซเลีย] ถูกทำลายจากการต่อสู้ ${boardOwner.name} จั่วการ์ด 1 ใบ!`);
  }

  // ⭐ 4. ตรวจสอบสกิลจากบนมือของ "แอชชี่ล่า" (DM07): ถ้ายูนิตฝ่ายเราถูกทำลายครบ 2 ใบขึ้นไปในเทิร์นนี้
  checkAshilaHandTrigger(boardOwner);

  return { destroyed: true, monster };
}

// ฟังก์ชันเด้งถามสกิลของ แอชชี่ล่า (DM07) เมื่อการ์ดอยู่บนมือและมียูนิตถูกทำลายครบ 2 ใบขึ้นไปในเทิร์นนี้
function checkAshilaHandTrigger(contestant) {
  if (!contestant || contestant.unitsDestroyedThisTurn < 2) return;

  const ashilaHandIdx = contestant.hand.findIndex(c => c.id === 'DM07');
  if (ashilaHandIdx === -1) return;

  // กรณีเป็น AI: หากมีช่องว่างให้คอลลงสนามพร้อมพลัง +2 ทันที
  if (contestant.name === 'AI') {
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

  // กรณีเป็นผู้เล่น (Player): เด้งหน้าต่างถามทันทีว่าต้องการคอลแอชชี่ล่าจากมือหรือไม่
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

// ฟังก์ชันนำ แอชชี่ล่า จากมือลงสู่สนามด้วยสกิล (+2 Power จนจบเทิร์น)
function summonAshilaBySkillFromHand(contestant) {
  const handIdx = contestant.hand.findIndex(c => c.id === 'DM07');
  if (handIdx === -1) return;

  const summoned = contestant.hand.splice(handIdx, 1)[0];
  resetCardStateForZoneChange(summoned);
  summoned.state = 'Stand';
  summoned.tempPowerMod += 2; // พลังโจมตีเพิ่มขึ้น +2 จนจบเทิร์น (จาก 2 เป็น 4)

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
  if (lobbyScreen) lobbyScreen.style.display = 'flex';
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

// ระบบถามเพื่อยืนยันที่จะใช้การ์ดหรือความสามารถ
function askCardUseConfirmation(card, actionTitle, onConfirmCallback) {
  const powerInfo = card.type === 'Monster' ? ` (Power: ${card.power})` : '';
  showChoiceModal(
    `❓ ยืนยันการใช้งานการ์ด: ${card.name}${powerInfo}`,
    `คุณต้องการ ${actionTitle} ใช่หรือไม่?\n\n📜 ความสามารถ:\n${card.desc || 'ไม่มีความสามารถพิเศษ'}`,
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

// หน้าต่างแสดงรายละเอียดของการ์ดขนาดใหญ่เมื่อคลิกที่การ์ดในหน้า Card List หรือ Graveyard/มิติมืด
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
  document.getElementById('detail-card-desc').textContent = card.desc || 'ไม่มีความสามารถพิเศษ';
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
          <h2 id="zone-viewer-title" style="color: #fbbf24;">รายการการ์ด</h2>
          <button class="btn" id="btn-close-zone-viewer" style="background: #dc2626;">✖ ปิดหน้าต่าง</button>
        </div>
        <p style="font-size: 13px; color: #38bdf8; margin-bottom: 14px;">💡 คลิกที่การ์ดใบใดก็ได้เพื่อเปิดดูรูปใหญ่และรายละเอียดความสามารถ</p>
        <p id="zone-viewer-empty" style="color: #94a3b8; margin: 20px 0; display: none;">ไม่มีการ์ดในโซนนี้</p>
        <div id="zone-viewer-list" style="display: flex; flex-wrap: wrap; justify-content: center; gap: 12px; margin-bottom: 10px;"></div>
      </div>
    `;
    document.body.appendChild(viewerModal);
    document.getElementById('btn-close-zone-viewer').onclick = () => {
      viewerModal.style.display = 'none';
    };
  }

  const aiGraveCountEl = document.getElementById('ai-grave-count');
  if (aiGraveCountEl) {
    const aiGraveBox = aiGraveCountEl.parentElement;
    aiGraveBox.style.cursor = 'pointer';
    aiGraveBox.title = 'คลิกเพื่อดูการ์ดในนรกของฝ่ายตรงข้าม';
    aiGraveBox.onclick = () => openZoneViewerModal('🪦 กองนรกของฝ่ายตรงข้าม (Graveyard)', gameState.ai.graveyard, gameState.ai);

    const aiPileGroup = aiGraveBox.parentElement;
    if (aiPileGroup && !document.getElementById('ai-dark-box')) {
      const darkBox = document.createElement('div');
      darkBox.id = 'ai-dark-box';
      darkBox.className = 'info-box';
      darkBox.style.background = '#131129';
      darkBox.style.border = '2px dashed #6366f1';
      darkBox.style.cursor = 'pointer';
      darkBox.title = 'คลิกเพื่อดูการ์ดในมิติมืดของฝ่ายตรงข้าม';
      darkBox.innerHTML = `<div>🌌 มิติมืด</div><h2 id="ai-dark-count">0</h2><div style="font-size:10px; color:#a5b4fc;">(คลิกดู)</div>`;
      darkBox.onclick = () => openZoneViewerModal('🌌 มิติมืดของฝ่ายตรงข้าม (Dark Dimension)', gameState.ai.darkDimension, gameState.ai);
      aiPileGroup.appendChild(darkBox);
    }
  }

  const playerGraveCountEl = document.getElementById('player-grave-count');
  if (playerGraveCountEl) {
    const playerGraveBox = playerGraveCountEl.parentElement;
    playerGraveBox.style.cursor = 'pointer';
    playerGraveBox.title = 'คลิกเพื่อดูการ์ดในนรกของคุณ';
    playerGraveBox.onclick = () => openZoneViewerModal('🪦 กองนรกของคุณ (Graveyard)', gameState.player.graveyard, gameState.player);

    const playerPileGroup = playerGraveBox.parentElement;
    if (playerPileGroup && !document.getElementById('player-dark-box')) {
      const darkBox = document.createElement('div');
      darkBox.id = 'player-dark-box';
      darkBox.className = 'info-box';
      darkBox.style.background = '#131129';
      darkBox.style.border = '2px dashed #6366f1';
      darkBox.style.cursor = 'pointer';
      darkBox.title = 'คลิกเพื่อดูการ์ดในมิติมืดของคุณ';
      darkBox.innerHTML = `<div>🌌 มิติมืด</div><h2 id="player-dark-count">0</h2><div style="font-size:10px; color:#a5b4fc;">(คลิกดู)</div>`;
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
   หมวดที่ 4: ความสามารถของ Leader และ Monster ทั้ง 3 เด็ค (ครบ 100%)
   ============================================================================ */
function activateLeaderSkillPlayer() {
  const player = gameState.player;
  if (gameState.gameOver || gameState.activeTurn !== 'player') return;
  if (gameState.pendingAction) {
    setLog('⚠️ กรุณาเลือกเป้าหมายของเอฟเฟกต์ที่ค้างอยู่ให้เสร็จก่อน!');
    return;
  }
  if (player.leader.id === 'L02' || player.leader.id === 'L03') {
    openCardDetailModal(player.leader, player);
    return;
  }
  if (player.leader.id !== 'L01') return;
  if (gameState.phase !== 'Main Phase') {
    setLog('⚠️ สกิลลีดเดอร์ มายฮีโร่ เดจิต กดใช้ได้ใน Main Phase เท่านั้น!');
    return;
  }
  if (player.leader.abilityUsedThisTurn) {
    setLog('❌ มายฮีโร่ เดจิต ใช้ความสามารถไปแล้วในเทิร์นนี้!');
    return;
  }
  if (!player.board.some(m => m !== null)) {
    setLog('⚠️ ไม่มีมอนสเตอร์บนสนามฝั่งเราให้เพิ่มพลัง!');
    return;
  }

  askCardUseConfirmation(player.leader, 'ใช้สกิลลีดเดอร์ (เพิ่มพลังโจมตียูนิทฝั่งเรา 1 ตัว +1 จนจบเทิร์น)', () => {
    gameState.selectedHandIndex = null;
    gameState.selectedAttackerSlot = null;
    gameState.pendingAction = { type: 'LEADER_L01_TARGET' };
    setLog('👑 [มายฮีโร่ เดจิต] คลิกเลือกยูนิทฝั่งเรา 1 ตัวบนสนาม เพื่อเพิ่มพลังโจมตี +1 จนจบเทิร์น');
    renderGame();
  });
}

function triggerKhunNueaStartTurn(contestant) {
  if (!contestant.leader || contestant.leader.id !== 'L02') return;
  const inGraveIdx = contestant.graveyard.findIndex(c => c.id === 'NM01');
  const inDeckIdx = contestant.deck.findIndex(c => c.id === 'NM01');
  if (inGraveIdx === -1 && inDeckIdx === -1) return;

  if (contestant.name === 'AI') {
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
      if (contestant.name === 'AI') {
        const emptySlot = contestant.board.findIndex(m => m === null);
        if (emptySlot !== -1) {
          const gIdx = contestant.graveyard.findIndex(c => c.uid === validTargets[0].uid);
          if (gIdx !== -1) {
            const called = contestant.graveyard.splice(gIdx, 1)[0];
            resetCardStateForZoneChange(called);
            contestant.board[emptySlot] = called;
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
                if (called.id === 'NM04') called.permPowerMod += 1;

                const emptySlot = contestant.board.findIndex(m => m === null);
                if (emptySlot !== -1) {
                  contestant.board[emptySlot] = called;
                  setLog(`⏳ [วันสิ้นโลก] คอล "${called.name}" จากนรกลงช่องที่ ${emptySlot + 1}!`);
                  checkDebirunStep();
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

    if (contestant.name === 'AI') {
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

  if (contestant.name === 'AI') {
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

// เมนูเมื่อคลิกการ์ดบนมือของเด็ควันสิ้นโลก (แอชชี่ล่า DM07 & การ์ดอนาคต DM09-DM14)
function handleDoomsdayHandMenu(handIndex) {
  const player = gameState.player;
  const ai = gameState.ai;
  const card = player.hand[handIndex];
  if (!card) return;

  if (card.id === 'DM07') {
    const canSpecialCall = player.unitsDestroyedThisTurn >= 2;
    showChoiceModal(
      `🔥 ยืนยันการใช้การ์ด: แอชชี่ล่า`,
      `ยูนิตฝั่งเราที่ถูกทำลายในเทิร์นนี้: ${player.unitsDestroyedThisTurn} / 2 ใบ\n\n📜 ความสามารถ:\n${card.desc}`,
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
      `ต้องการส่ง "${card.futureBaseName}" บนสนามไปที่ "มิติมืด" แล้วคอล "${card.name}" ลงสนามใช่หรือไม่?\n\n📜 ความสามารถ:\n${card.desc}`,
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

  if (futureCard.id === 'DM13') {
    opponent.board.forEach(m => {
      if (m && !m.immuneToEnemyEffectsUntilEndOfTurn) m.tempPowerMod -= 1;
    });
    setLog('🌌 [อนาคต - ยอดนักดาบ แอชชี่ล่า] การ์ดทุกใบบนสนามของฝ่ายตรงข้ามพลังโจมตี -1 จนจบเทิร์น!');
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
      `เลือกวิธีใช้งานการ์ดใบนี้:\n\n📜 ความสามารถ:\n${card.desc}`,
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
      `เลือกวิธีอัญเชิญการ์ดใบนี้:\n\n📜 ความสามารถ:\n${card.desc}`,
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

  if (contestant.name === 'AI') {
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
      if (summoned.id === 'NM04') summoned.permPowerMod += 1;
      contestant.board[emptySlot] = summoned;
      setLog(`🤖 [จุติ - ทหารหลวงเหนือ] อัญเชิญ "${summoned.name}" ลงสนามฟรี!`);
    }
    renderGame();
    return;
  }

  const placeBonusSoldier = (card) => {
    resetCardStateForZoneChange(card);
    if (card.id === 'NM04') card.permPowerMod += 1;
    const emptySlot = contestant.board.findIndex(m => m === null);
    if (emptySlot !== -1) {
      contestant.board[emptySlot] = card;
      setLog(`✨ [จุติ - ทหารหลวงเหนือ] อัญเชิญ "${card.name}" ลงสนามทันที!`);
      renderGame();
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

// สั่งใช้งานความสามารถของ Monster บนสนาม (ใน Main Phase)
function activateMonsterOnBoardPlayer(slotIndex) {
  const player = gameState.player;
  const monster = player.board[slotIndex];
  if (!monster) return;

  // 1. โทโดโรจิต (M02)
  if (monster.id === 'M02') {
    const usedSkill1 = !!monster.usedSkills.todoroMill;
    const usedSkill2 = !!monster.usedSkills.todoroRecover;
    const canSkill1 = !usedSkill1 && player.hand.length > 0 && gameState.ai.deck.length > 0;
    const hasBakuInGrave = player.graveyard.some(c => c.id === 'M01');
    const canSkill2 = !usedSkill2 && hasBakuInGrave;

    showChoiceModal(
      '❄️ ยืนยันการใช้ความสามารถของ โทโดโรจิต',
      'แต่ละความสามารถสั่งใช้ได้เทิร์นละ 1 ครั้ง (แยกกัน)',
      [
        {
          label: `1) ทิ้งมือ 1 ใบ -> ส่งใบบนสุดกองอีกฝ่ายลงนรก ${usedSkill1 ? '(ใช้แล้ว)' : !canSkill1 ? '(เงื่อนไขไม่ครบ)' : ''}`,
          disabled: !canSkill1,
          color: '#0284c7',
          onSelect: () => {
            gameState.pendingAction = { type: 'TODORO_SKILL1_DISCARD', sourceSlot: slotIndex };
            setLog('👉 [โทโดโรจิต] คลิกเลือกการ์ดบนมือของคุณ 1 ใบเพื่อทิ้งลงนรก');
            renderGame();
          }
        },
        {
          label: `2) นำ "บาคุจิต" 1 ใบจากนรกขึ้นมือ ${usedSkill2 ? '(ใช้แล้ว)' : !hasBakuInGrave ? '(ไม่มีบาคุจิตในนรก)' : ''}`,
          disabled: !canSkill2,
          color: '#16a34a',
          onSelect: () => {
            const bakuIdx = player.graveyard.findIndex(c => c.id === 'M01');
            if (bakuIdx !== -1) {
              const bakuCard = player.graveyard.splice(bakuIdx, 1)[0];
              resetCardStateForZoneChange(bakuCard);
              player.hand.push(bakuCard);
              monster.usedSkills.todoroRecover = true;
              setLog('✨ [โทโดโรจิต] นำ "บาคุจิต" 1 ใบจากกองนรกขึ้นมือสำเร็จ!');
              renderGame();
            }
          }
        },
        { label: '🔍 ดูรายละเอียดการ์ดใบนี้', color: '#6366f1', onSelect: () => openCardDetailModal(monster, player) },
        { label: '❌ ยกเลิก', color: '#475569', onSelect: () => renderGame() }
      ]
    );
    return;
  }

  // 2. เอ็นเดจิต (M05)
  if (monster.id === 'M05') {
    if (monster.usedSkills.endeBoost) {
      setLog('⚠️ เอ็นเดจิต ใช้ความสามารถไปแล้วในเทิร์นนี้!');
      return;
    }
    askCardUseConfirmation(monster, 'ใช้ความสามารถเพิ่มพลังโจมตี +2 (และทำลายใบนี้เมื่อจบเทิร์น)', () => {
      triggerEndeSkill(player, slotIndex);
      renderGame();
    });
    return;
  }

  // 3. ฮออ์กส์ฟีม (M06)
  if (monster.id === 'M06') {
    if (monster.usedSkills.hawksSearch) {
      setLog('⚠️ ฮออ์กส์ฟีม ใช้ความสามารถค้นหาไปแล้วในเทิร์นนี้!');
      return;
    }
    if (getEffectivePower(monster, player) < 2) {
      setLog('⚠️ พลังของ ฮออ์กส์ฟีม น้อยกว่า 2 จึงไม่สามารถลดพลังเพื่อใช้สกิลได้!');
      return;
    }
    const inDeck = player.deck.some(c => c.id === 'M05');
    const inGrave = player.graveyard.some(c => c.id === 'M05');
    if (!inDeck && !inGrave) {
      setLog('⚠️ ไม่มี "เอ็นเดจิต" อยู่ในกองการ์ดหรือกองนรกเลย!');
      return;
    }

    showChoiceModal(
      '🦅 ยืนยันการใช้ความสามารถของ ฮออ์กส์ฟีม',
      'ลดพลังโจมตีของยูนิทนี้ลง 2 หน่วย เพื่อนำ "เอ็นเดจิต" ขึ้นมือ',
      [
        {
          label: `ดึง "เอ็นเดจิต" จากกองการ์ด (พร้อมสับกอง) ${!inDeck ? '(ไม่มีในกอง)' : ''}`,
          disabled: !inDeck,
          color: '#0284c7',
          onSelect: () => executeHawksSearch(player, slotIndex, 'deck')
        },
        {
          label: `ดึง "เอ็นเดจิต" จากกองนรก ${!inGrave ? '(ไม่มีในนรก)' : ''}`,
          disabled: !inGrave,
          color: '#7c3aed',
          onSelect: () => executeHawksSearch(player, slotIndex, 'grave')
        },
        { label: '❌ ยกเลิก', color: '#475569', onSelect: () => renderGame() }
      ]
    );
    return;
  }

  // 4. ทหารพรานเหนือ (NM03)
  if (monster.id === 'NM03') {
    if (monster.usedSkills.rangerTarget) {
      setLog('⚠️ ทหารพรานเหนือ ใช้ความสามารถประจำเทิร์นนี้ไปแล้ว!');
      return;
    }
    askCardUseConfirmation(monster, 'ใช้ความสามารถเลือกยูนิท 1 ใบ (ฝั่งเรา +1 / ฝั่งตรงข้าม -1)', () => {
      gameState.pendingAction = { type: 'RANGER_SELECT_UNIT', sourceSlot: slotIndex };
      setLog('🏹 [ทหารพรานเหนือ] คลิกเลือกยูนิท 1 ใบบนสนาม (คลิกยูนิทเราพลัง +1 / คลิกยูนิทอีกฝ่ายพลัง -1)');
      renderGame();
    });
    return;
  }

  // 5. โอนามิ ผู้ทำลายโลก (DM01)
  if (monster.id === 'DM01') {
    if (monster.usedSkills.onamiSummon) {
      setLog('⚠️ โอนามิ ผู้ทำลายโลก ใช้ความสามารถไปแล้วในเทิร์นนี้!');
      return;
    }
    if (player.hand.length === 0) {
      setLog('⚠️ ไม่มีการ์ดบนมือให้ทิ้งสำหรับสกิลของโอนามิ!');
      return;
    }
    const roseliaInDeck = player.deck.some(c => c.id === 'DM02');
    const roseliaInGrave = player.graveyard.some(c => c.id === 'DM02');
    if (!roseliaInDeck && !roseliaInGrave) {
      setLog('⚠️ ไม่มี "โรเซเลีย" อยู่ในกองการ์ดหรือกองนรกเลย!');
      return;
    }

    askCardUseConfirmation(monster, 'ทิ้งการ์ดบนมือ 1 ใบ เพื่ออัญเชิญ "โรเซเลีย" จากกองหรือนรก', () => {
      gameState.pendingAction = { type: 'ONAMI_DISCARD_HAND', sourceSlot: slotIndex };
      setLog('🌊 [โอนามิ ผู้ทำลายโลก] คลิกเลือกการ์ดบนมือของคุณ 1 ใบเพื่อทิ้งลงนรก และอัญเชิญ "โรเซเลีย" ลงสนาม!');
      renderGame();
    });
    return;
  }

  // 6. โรเซเลีย (DM02)
  if (monster.id === 'DM02') {
    if (!isPartnerActive(player)) {
      setLog('⚠️ ต้องมี "โอนามิ ผู้ทำลายโลก" อยู่บนสนามฝั่งเรา จึงจะเข้าสู่สถานะคู่หูและใช้สกิลนี้ได้!');
      return;
    }
    if (monster.state !== 'Stand') {
      setLog('⚠️ โรเซเลีย ต้องอยู่ในสถานะ Stand จึงจะสั่ง Rest เพื่อจั่วการ์ดได้!');
      return;
    }
    askCardUseConfirmation(monster, 'เปลี่ยนโรเซเลียเป็น Rest เพื่อจั่วการ์ด 1 ใบ (สกิลคู่หู)', () => {
      monster.state = 'Rest';
      drawCards(player, 1);
      setLog('🌹 [คู่หู - โรเซเลีย] เปลี่ยนสถานะเป็น Rest และจั่วการ์ด 1 ใบสำเร็จ!');
      renderGame();
    });
    return;
  }

  openCardDetailModal(monster, player);
  setLog(`ℹ️ "${monster.name}" ไม่มีสกิลกดใช้บนสนาม (หากต้องการสั่งโจมตี ให้กดปุ่ม "⚔️ เฟสถัดไป (Battle Phase)" ด้านขวา)`);
}

function triggerEndeSkill(contestant, slotIndex) {
  const ende = contestant.board[slotIndex];
  if (!ende || ende.id !== 'M05') return;

  ende.tempPowerMod += 2;
  ende.destroyAtEndOfTurn = true;
  ende.usedSkills.endeBoost = true;

  let hawksCount = 0;
  contestant.board.forEach(m => {
    if (m && m.id === 'M06') {
      m.permPowerMod += 2;
      hawksCount += 1;
    }
  });

  const hawksText = hawksCount > 0 ? ` และสกิลออโต้ของ "ฮออ์กส์ฟีม" ทำงาน (+2 Power)!` : '';
  setLog(`🔥 [${contestant.name}] "เอ็นเดจิต" เพิ่มพลังโจมตี +2 (จะถูกทำลายเมื่อจบเทิร์น)${hawksText}`);
}

function executeHawksSearch(contestant, slotIndex, sourceZone) {
  const hawks = contestant.board[slotIndex];
  if (!hawks || hawks.id !== 'M06') return;

  if (sourceZone === 'deck') {
    const idx = contestant.deck.findIndex(c => c.id === 'M05');
    if (idx === -1) return;
    hawks.permPowerMod -= 2;
    hawks.usedSkills.hawksSearch = true;
    const found = contestant.deck.splice(idx, 1)[0];
    resetCardStateForZoneChange(found);
    contestant.hand.push(found);
    contestant.deck = shuffleDeck(contestant.deck);
    setLog(`🦅 [${contestant.name}] "ฮออ์กส์ฟีม" ลดพลัง -2 นำ "เอ็นเดจิต" จากกองการ์ดขึ้นมือและสับกองเรียบร้อย!`);
  } else if (sourceZone === 'grave') {
    const idx = contestant.graveyard.findIndex(c => c.id === 'M05');
    if (idx === -1) return;
    hawks.permPowerMod -= 2;
    hawks.usedSkills.hawksSearch = true;
    const found = contestant.graveyard.splice(idx, 1)[0];
    resetCardStateForZoneChange(found);
    contestant.hand.push(found);
    setLog(`🦅 [${contestant.name}] "ฮออ์กส์ฟีม" ลดพลัง -2 นำ "เอ็นเดจิต" จากกองนรกขึ้นมือเรียบร้อย!`);
  }
  renderGame();
}


/* ============================================================================
   หมวดที่ 5: ระบบการ์ดเวทมนตร์ทั้ง 3 เด็ค (พร้อมถามยืนยันก่อนใช้ทุกใบ)
   ============================================================================ */
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

  askCardUseConfirmation(spell, `ใช้งานการ์ดเวทมนตร์ "${spell.name}"`, () => {
    executeConfirmedPlayerSpell(handIndex);
  });
}

function executeConfirmedPlayerSpell(handIndex) {
  const player = gameState.player;
  const ai = gameState.ai;
  const spell = player.hand[handIndex];
  if (!spell) return;

  if (spell.id === 'DS01') {
    const usedSpell = player.hand.splice(handIndex, 1)[0];
    player.spellQuota.normalUsed += 1;
    const drawCount = player.graveyard.length >= 5 ? 2 : 1;
    drawCards(player, drawCount);
    player.graveyard.push(usedSpell);
    gameState.selectedHandIndex = null;

    if (player.board.some(m => m !== null)) {
      gameState.pendingAction = { type: 'SPELL_DS01_BUFF_TARGET', drawnCount: drawCount };
      setLog(`✨ [เบิกเนตรแห่งแสง] จั่วการ์ด ${drawCount} ใบแล้ว — คลิกเลือกยูนิตบนสนามของคุณ 1 ใบเพื่อเพิ่มพลังโจมตี +1!`);
    } else {
      setLog(`✨ [เบิกเนตรแห่งแสง] จั่วการ์ด ${drawCount} ใบสำเร็จ! (ไม่มีมอนสเตอร์บนสนามให้เพิ่มพลัง)`);
    }
    renderGame();
    return;
  }

  if (spell.id === 'S01') {
    const otherHandCards = player.hand.filter((_, idx) => idx !== handIndex);
    if (otherHandCards.length === 0) {
      setLog('⚠️ ใช้ "โอ็ยใครเหยียบตีน!!!" ไม่ได้: ต้องมีการ์ดใบอื่นบนมืออย่างน้อย 1 ใบเพื่อใช้ทิ้ง!');
      return;
    }
    if (!ai.board.some(m => m !== null)) {
      setLog('⚠️ ใช้ "โอ็ยใครเหยียบตีน!!!" ไม่ได้: ฝ่ายตรงข้ามไม่มีมอนสเตอร์บนสนามให้ทำลาย!');
      return;
    }
    gameState.selectedHandIndex = null;
    gameState.pendingAction = { type: 'SPELL_S01_DISCARD', spellHandIndex: handIndex };
    setLog('🦶 [โอ็ยใครเหยียบตีน!!!] ขั้นที่ 1: คลิกเลือกการ์ดใบอื่นบนมือของคุณ 1 ใบเพื่อทิ้งลงนรก');
    renderGame();
    return;
  }

  if (spell.id === 'S02') {
    if (!ai.board.some(m => m !== null)) {
      setLog('⚠️ ใช้ "เชี่ย หุ้นตก" ไม่ได้: ฝ่ายตรงข้ามไม่มีมอนสเตอร์บนสนาม!');
      return;
    }
    const usedSpell = player.hand.splice(handIndex, 1)[0];
    player.spellQuota.normalUsed += 1;
    ai.board.forEach(m => {
      if (m && !m.immuneToEnemyEffectsUntilEndOfTurn) m.tempPowerMod -= 3;
    });
    player.graveyard.push(usedSpell);
    gameState.selectedHandIndex = null;
    setLog('📉 [เชี่ย หุ้นตก] ลดพลังโจมตีของยูนิทฝ่ายตรงข้ามทุกใบลง 3 หน่วยจนจบเทิร์น!');
    renderGame();
    return;
  }

  if (spell.id === 'S03') {
    if (!player.board.some(m => m !== null && m.state === 'Stand')) {
      setLog('⚠️ ใช้ "หนึ่งเดียวเพื่อทุกสิ่ง" ไม่ได้: ไม่มีมอนสเตอร์ฝ่ายเราที่อยู่ในสถานะ Stand!');
      return;
    }
    gameState.selectedHandIndex = null;
    gameState.pendingAction = { type: 'SPELL_S03_REST_TARGET', spellHandIndex: handIndex };
    setLog('✨ [หนึ่งเดียวเพื่อทุกสิ่ง] คลิกเลือกยูนิทฝ่ายเราที่ Stand อยู่ 1 ใบเพื่อเปลี่ยนเป็น Rest และเพิ่ม HP ลีดเดอร์ +1');
    renderGame();
    return;
  }

  if (spell.id === 'S04') {
    const standAllies = player.board.filter(m => m !== null && m.state === 'Stand');
    if (standAllies.length < 2) {
      setLog('⚠️ ใช้ "ทุกสิ่งเพื่อหนึ่งเดียว" ไม่ได้: ต้องมียูนิทฝ่ายเราที่อยู่ในสถานะ Stand อย่างน้อย 2 ใบ!');
      return;
    }
    gameState.selectedHandIndex = null;
    gameState.pendingAction = { type: 'SPELL_S04_REST_FIRST', spellHandIndex: handIndex, firstRestSlot: null };
    setLog('🌟 [ทุกสิ่งเพื่อหนึ่งเดียว] ขั้นที่ 1/3: คลิกเลือกยูนิทฝ่ายเราที่ Stand อยู่ใบที่ 1 เพื่อเปลี่ยนเป็น Rest');
    renderGame();
    return;
  }

  if (spell.id === 'NS01') {
    if (!player.graveyard.some(c => isPhraiCard(c))) {
      setLog('⚠️ ใช้ "หมอไพร่เหนือ" ไม่ได้: ไม่มีมอนสเตอร์ที่มีคำว่า "ไพร่" อยู่ในกองนรก!');
      return;
    }
    openGraveRecoverModal(player, handIndex, isPhraiCard, 'หมอไพร่เหนือ');
    return;
  }

  if (spell.id === 'NS02') {
    if (!player.graveyard.some(c => isSoldierCard(c))) {
      setLog('⚠️ ใช้ "หมอสนามเหนือ" ไม่ได้: ไม่มีมอนสเตอร์ที่มีคำว่า "ทหาร" อยู่ในกองนรก!');
      return;
    }
    openGraveRecoverModal(player, handIndex, isSoldierCard, 'หมอสนามเหนือ');
    return;
  }

  if (spell.id === 'NS04') {
    if (!player.graveyard.some(c => c.type === 'NormalSpell' || c.type === 'ReactionSpell')) {
      setLog('⚠️ ใช้ "หน่วยข่าวกรอง" ไม่ได้: ไม่มีการ์ดเวทมนตร์อยู่ในกองนรก!');
      return;
    }
    openGraveRecoverModal(player, handIndex, (c) => c.type === 'NormalSpell' || c.type === 'ReactionSpell', 'หน่วยข่าวกรอง');
    return;
  }

  if (spell.id === 'NS05') {
    if (!ai.board.some(m => m !== null)) {
      setLog('⚠️ ใช้ "จีวรบิน" ไม่ได้: ฝ่ายตรงข้ามไม่มีมอนสเตอร์บนสนาม!');
      return;
    }
    gameState.selectedHandIndex = null;
    gameState.pendingAction = { type: 'SPELL_NS05_BOUNCE_TARGET', spellHandIndex: handIndex };
    setLog('🌪️ [จีวรบิน] คลิกเลือกยูนิทของฝ่ายตรงข้ามบนสนาม 1 ใบ เพื่อส่งกลับขึ้นมือ!');
    renderGame();
    return;
  }

  if (spell.id === 'NS03') {
    const conscriptCount = player.board.filter(m => m !== null && m.id === 'NM04').length;
    const rangerCount = player.board.filter(m => m !== null && m.id === 'NM03').length;
    const royalCount = player.board.filter(m => m !== null && m.id === 'NM02').length;

    if (conscriptCount === 0 && rangerCount === 0 && royalCount === 0) {
      setLog('⚠️ ใช้ "ระเบิดปูพรม" ไม่ได้: ไม่มี ทหารเกณฑ์เหนือ, ทหารพรานเหนือ หรือ ทหารหลวงเหนือ บนสนามของคุณเลย!');
      return;
    }

    const usedSpell = player.hand.splice(handIndex, 1)[0];
    player.spellQuota.normalUsed += 1;
    player.graveyard.push(usedSpell);
    gameState.selectedHandIndex = null;

    const effectsLog = [];
    if (conscriptCount > 0) {
      player.board.forEach(m => { if (m && isNueaCard(m)) m.tempPowerMod += conscriptCount; });
      effectsLog.push(`ยูนิทเหนือพลัง +${conscriptCount}`);
    }
    if (royalCount > 0) {
      player.board.forEach(m => { if (m) m.indestructibleUntilNextTurn = true; });
      effectsLog.push('ยูนิทเราไม่ถูกทำลายจนเริ่มเทิร์นหน้า');
    }
    if (rangerCount > 0 && ai.board.some(m => m !== null)) {
      gameState.pendingAction = { type: 'CARPET_BOMB_DESTROY', remainingKills: rangerCount };
      setLog(`💣 [ระเบิดปูพรม] (${effectsLog.join(', ')}) -> กรุณาคลิกเลือกยูนิทของฝ่ายตรงข้ามเพื่อทำลาย (${rangerCount} ครั้ง)!`);
    } else {
      setLog(`💣 [ระเบิดปูพรม] ทำงานสำเร็จ: ${effectsLog.join(' | ')}!`);
    }
    renderGame();
  }
}

function openGraveRecoverModal(contestant, spellHandIndex, filterFn, spellTitle) {
  const candidates = [];
  const seenIds = new Set();
  contestant.graveyard.forEach(c => {
    if (filterFn(c) && !seenIds.has(c.id)) {
      seenIds.add(c.id);
      candidates.push(c);
    }
  });

  const options = candidates.map(targetCard => ({
    label: `นำ "${targetCard.name}" ขึ้นมือ`,
    color: '#16a34a',
    onSelect: () => {
      const usedSpell = contestant.hand.splice(spellHandIndex, 1)[0];
      contestant.spellQuota.normalUsed += 1;

      const gIdx = contestant.graveyard.findIndex(c => c.id === targetCard.id);
      if (gIdx !== -1) {
        const recovered = contestant.graveyard.splice(gIdx, 1)[0];
        resetCardStateForZoneChange(recovered);
        contestant.hand.push(recovered);
      }

      resetCardStateForZoneChange(usedSpell);
      contestant.graveyard.push(usedSpell);
      setLog(`✨ [${spellTitle}] นำ "${targetCard.name}" 1 ใบจากกองนรกขึ้นมือสำเร็จ!`);
      renderGame();
    }
  }));

  options.push({ label: '❌ ยกเลิก', color: '#475569', onSelect: () => renderGame() });
  showChoiceModal(`🪦 ${spellTitle}`, 'เลือกการ์ด 1 ใบจากกองนรกเพื่อนำกลับขึ้นมือ:', options);
}


/* ============================================================================
   หมวดที่ 6: ระบบจัดการเทิร์น และการคลิกของผู้เล่น (แยก Main Phase / Battle Phase)
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

  // อนุญาตให้คลิกใช้สกิลของ แอชชี่ล่า (DM07) จากบนมือได้แม้จะอยู่ใน Battle Phase หากยูนิตถูกทำลายครบ 2 ใบแล้ว
  const isAshilaReadyInBattle = (clickedCard.id === 'DM07' && player.unitsDestroyedThisTurn >= 2 && gameState.phase === 'Battle Phase');

  if (gameState.gameOver || gameState.isRollingDice || gameState.activeTurn !== 'player' || (gameState.phase !== 'Main Phase' && !isAshilaReadyInBattle)) {
    setLog('⚠️ ลงการ์ดหรือใช้เวทมนตร์จากมือได้เฉพาะใน Main Phase ของคุณเท่านั้น!');
    return;
  }

  // กรณีที่ 1: อยู่ระหว่างรอคลิกเลือกการ์ดบนมือเพื่อทิ้ง
  if (gameState.pendingAction) {
    if (gameState.pendingAction.type === 'ONAMI_DISCARD_HAND') {
      const sourceMonster = player.board[gameState.pendingAction.sourceSlot];
      const discarded = player.hand.splice(handIndex, 1)[0];
      resetCardStateForZoneChange(discarded);
      player.graveyard.push(discarded);

      let tsururuMsg = '';
      if (discarded.id === 'DM05' && ai.hand.length > 0) {
        const aiDiscarded = ai.hand.pop();
        resetCardStateForZoneChange(aiDiscarded);
        ai.graveyard.push(aiDiscarded);
        tsururuMsg = ` + 🍬 [ออโต้ซึรุรุ] ฝ่ายตรงข้ามถูกบังคับทิ้งมือ "${aiDiscarded.name}" 1 ใบ!`;
      }

      let roseliaCard = null;
      const gIdx = player.graveyard.findIndex(c => c.id === 'DM02');
      if (gIdx !== -1) {
        roseliaCard = player.graveyard.splice(gIdx, 1)[0];
      } else {
        const dIdx = player.deck.findIndex(c => c.id === 'DM02');
        if (dIdx !== -1) {
          roseliaCard = player.deck.splice(dIdx, 1)[0];
        }
      }
      player.deck = shuffleDeck(player.deck);

      if (sourceMonster) sourceMonster.usedSkills.onamiSummon = true;
      gameState.pendingAction = null;

      if (roseliaCard) {
        resetCardStateForZoneChange(roseliaCard);
        roseliaCard.state = 'Stand';
        roseliaCard.immuneToEnemyEffectsUntilEndOfTurn = true;

        const emptySlot = player.board.findIndex(m => m === null);
        if (emptySlot !== -1) {
          player.board[emptySlot] = roseliaCard;
          setLog(`🌊 [โอนามิ] ทิ้ง "${discarded.name}" อัญเชิญ "โรเซเลีย" ลงสนาม (ไม่โดนสกิลอีกฝ่ายจนจบเทิร์น)!${tsururuMsg}`);
        } else {
          gameState.pendingAction = {
            type: 'CALL_FROM_EFFECT_SELECT_SLOT',
            cardToPlace: roseliaCard,
            onAfterPlace: null
          };
          setLog(`🌊 [โอนามิ] ทิ้ง "${discarded.name}" แล้ว${tsururuMsg} — สนามเต็ม 3 ช่อง คลิกเลือกช่องบนสนามของคุณเพื่อวาง "โรเซเลีย" ทับ!`);
        }
      }
      renderGame();
      return;
    }

    if (gameState.pendingAction.type === 'TODORO_SKILL1_DISCARD') {
      const sourceMonster = player.board[gameState.pendingAction.sourceSlot];
      const discarded = player.hand.splice(handIndex, 1)[0];
      resetCardStateForZoneChange(discarded);
      player.graveyard.push(discarded);

      let milledMsg = '';
      if (ai.deck.length > 0) {
        const milled = ai.deck.pop();
        resetCardStateForZoneChange(milled);
        ai.graveyard.push(milled);
        milledMsg = ` และส่ง "${milled.name}" ใบบนสุดของกองฝ่ายตรงข้ามลงนรก!`;
      }
      if (sourceMonster) sourceMonster.usedSkills.todoroMill = true;
      gameState.pendingAction = null;
      setLog(`❄️ [โทโดโรจิต] ทิ้ง "${discarded.name}" จากมือ${milledMsg}`);
      renderGame();
      return;
    }

    if (gameState.pendingAction.type === 'SPELL_S01_DISCARD') {
      if (handIndex === gameState.pendingAction.spellHandIndex) {
        setLog('⚠️ กรุณาคลิกเลือกการ์ดใบอื่นบนมือเพื่อใช้ทิ้ง!');
        return;
      }
      gameState.pendingAction.discardHandIndex = handIndex;
      gameState.pendingAction.type = 'SPELL_S01_DESTROY_TARGET';
      setLog(`🦶 [โอ็ยใครเหยียบตีน!!!] เลือกทิ้ง "${clickedCard.name}" แล้ว — คลิกเลือกยูนิทของฝ่ายตรงข้ามบนสนามที่ต้องการทำลาย!`);
      renderGame();
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

  // --- ส่วนที่ 1: หากกำลังรอเลือกเป้าหมายฝั่งตัวเอง ---
  if (gameState.pendingAction) {
    const action = gameState.pendingAction;

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
      renderGame();
      if (callback) callback();
      return;
    }

    if (action.type === 'SPELL_DS01_BUFF_TARGET') {
      if (!slotMonster) {
        setLog('⚠️ กรุณาคลิกเลือกช่องที่มียูนิทของคุณอยู่!');
        return;
      }
      slotMonster.tempPowerMod += 1;
      gameState.pendingAction = null;
      setLog(`✨ [เบิกเนตรแห่งแสง] จั่ว ${action.drawnCount} ใบ และเพิ่มพลังให้ "${slotMonster.name}" +1 (เป็น ${getEffectivePower(slotMonster, player)})!`);
      renderGame();
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

    if (action.type === 'RANGER_SELECT_UNIT') {
      if (!slotMonster) {
        setLog('⚠️ กรุณาคลิกช่องที่มียูนิทอยู่!');
        return;
      }
      const ranger = player.board[action.sourceSlot];
      slotMonster.permPowerMod += 1;
      if (ranger) ranger.usedSkills.rangerTarget = true;
      gameState.pendingAction = null;
      setLog(`🏹 [ทหารพรานเหนือ] เพิ่มพลังโจมตีให้ "${slotMonster.name}" ฝั่งเรา +1!`);
      renderGame();
      return;
    }

    if (action.type === 'LEADER_L01_TARGET') {
      if (!slotMonster) {
        setLog('⚠️ กรุณาคลิกช่องที่มียูนิทฝ่ายเราอยู่!');
        return;
      }
      slotMonster.tempPowerMod += 1;
      player.leader.abilityUsedThisTurn = true;
      gameState.pendingAction = null;
      setLog(`👑 [มายฮีโร่ เดจิต] เพิ่มพลังโจมตีให้ "${slotMonster.name}" +1 จนจบเทิร์น!`);
      renderGame();
      return;
    }

    if (action.type === 'SPELL_S03_REST_TARGET') {
      if (!slotMonster || slotMonster.state !== 'Stand') {
        setLog('⚠️ กรุณาคลิกเลือกยูนิทฝ่ายเราที่อยู่ในสถานะ Stand เท่านั้น!');
        return;
      }
      const usedSpell = player.hand.splice(action.spellHandIndex, 1)[0];
      player.spellQuota.normalUsed += 1;
      slotMonster.state = 'Rest';
      const oldHp = player.leader.hp;
      player.leader.hp = Math.min(player.leader.maxHp, player.leader.hp + 1);
      player.graveyard.push(usedSpell);
      gameState.pendingAction = null;
      setLog(`✨ [หนึ่งเดียวเพื่อทุกสิ่ง] เปลี่ยน "${slotMonster.name}" เป็น Rest และฟื้นฟู HP ลีดเดอร์ (${oldHp} -> ${player.leader.hp}/6)!`);
      renderGame();
      return;
    }

    if (action.type === 'SPELL_S04_REST_FIRST') {
      if (!slotMonster || slotMonster.state !== 'Stand') {
        setLog('⚠️ กรุณาคลิกเลือกยูนิทฝ่ายเราที่อยู่ในสถานะ Stand ใบที่ 1!');
        return;
      }
      action.firstRestSlot = slotIndex;
      action.type = 'SPELL_S04_REST_SECOND';
      setLog(`🌟 [ทุกสิ่งเพื่อหนึ่งเดียว] เลือก "${slotMonster.name}" แล้ว — ขั้นที่ 2/3: คลิกเลือกยูนิทที่ Stand ใบที่ 2 เพื่อ Rest`);
      renderGame();
      return;
    }

    if (action.type === 'SPELL_S04_REST_SECOND') {
      if (slotIndex === action.firstRestSlot || !slotMonster || slotMonster.state !== 'Stand') {
        setLog('⚠️ กรุณาคลิกเลือกยูนิทที่ Stand อยู่คนละใบกับใบแรก!');
        return;
      }
      action.secondRestSlot = slotIndex;
      action.type = 'SPELL_S04_CHOOSE_BENEFICIARY';
      setLog('🌟 [ทุกสิ่งเพื่อหนึ่งเดียว] ขั้นที่ 3/3: คลิกเลือกยูนิทฝ่ายเรา 1 ใบบนสนามเพื่อรับความสามารถพิเศษ!');
      renderGame();
      return;
    }

    if (action.type === 'SPELL_S04_CHOOSE_BENEFICIARY') {
      if (!slotMonster) {
        setLog('⚠️ กรุณาคลิกเลือกยูนิทฝ่ายเรา 1 ใบบนสนาม!');
        return;
      }
      const usedSpell = player.hand.splice(action.spellHandIndex, 1)[0];
      player.spellQuota.normalUsed += 1;
      if (player.board[action.firstRestSlot]) player.board[action.firstRestSlot].state = 'Rest';
      if (player.board[action.secondRestSlot]) player.board[action.secondRestSlot].state = 'Rest';
      slotMonster.burnLeaderOnKill = true;
      player.graveyard.push(usedSpell);
      gameState.pendingAction = null;
      setLog(`🌟 [ทุกสิ่งเพื่อหนึ่งเดียว] มอบสกิลออโต้ให้ "${slotMonster.name}" สำเร็จ!`);
      renderGame();
      return;
    }

    return;
  }

  // --- ส่วนที่ 2: การวาง Monster จากมือลงสนามตัวเอง (เฉพาะใน Main Phase) ---
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

    if (summoned.id === 'NM04') summoned.permPowerMod += 1;

    player.board[slotIndex] = summoned;
    gameState.selectedHandIndex = null;

    if (summoned.id === 'M01') {
      const hasEnemy = gameState.ai.board.some(m => m !== null);
      if (hasEnemy) {
        gameState.pendingAction = { type: 'BAKU_DESTROY_TARGET' };
        setLog(`💥 อัญเชิญ "บาคุจิต" สำเร็จ!${overwriteMsg} -> กรุณาคลิกเลือกยูนิทของฝ่ายตรงข้ามบนสนาม 1 ใบเพื่อทำลาย!`);
      } else {
        setLog(`✅ อัญเชิญ "บาคุจิต" ลงสนามสำเร็จ!${overwriteMsg} (ฝ่ายตรงข้ามไม่มีมอนสเตอร์ให้ทำลาย)`);
      }
      renderGame();
      return;
    }

    setLog(`✅ อัญเชิญ "${summoned.name}" (Power ${getEffectivePower(summoned, player)}) ลงช่องที่ ${slotIndex + 1} สำเร็จ!${overwriteMsg}`);
    renderGame();
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

    // ความสามารถออโต้ของ เอมิ (DM08): ถ้าตีไปแล้ว (Rest) และมีเดบิรุนบนสนาม ทิ้งมือ 3 ใบเพื่อ Stand ตีอีกครั้ง
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

  if (gameState.pendingAction) {
    const action = gameState.pendingAction;

    if (action.type === 'RANGER_SELECT_UNIT') {
      if (!targetMonster) {
        setLog('⚠️ กรุณาคลิกช่องที่มียูนิทอยู่!');
        return;
      }
      if (targetMonster.immuneToEnemyEffectsUntilEndOfTurn) {
        setLog(`🛡️ "${targetMonster.name}" ไม่ได้รับผลจากความสามารถของการ์ดฝ่ายตรงข้ามในเทิร์นนี้!`);
        return;
      }
      const ranger = player.board[action.sourceSlot];
      targetMonster.permPowerMod -= 1;
      if (ranger) ranger.usedSkills.rangerTarget = true;
      gameState.pendingAction = null;
      setLog(`🏹 [ทหารพรานเหนือ] ลดพลังโจมตีของ "${targetMonster.name}" ฝั่งตรงข้ามลง 1 หน่วย!`);
      renderGame();
      return;
    }

    if (action.type === 'SPELL_NS05_BOUNCE_TARGET') {
      if (!targetMonster) {
        setLog('⚠️ กรุณาคลิกเลือกช่องที่มีมอนสเตอร์ของฝ่ายตรงข้ามอยู่!');
        return;
      }
      if (targetMonster.immuneToEnemyEffectsUntilEndOfTurn) {
        setLog(`🛡️ "${targetMonster.name}" ป้องกันความสามารถการ์ดฝ่ายตรงข้ามในเทิร์นนี้!`);
        return;
      }
      const usedSpell = player.hand.splice(action.spellHandIndex, 1)[0];
      player.spellQuota.normalUsed += 1;
      player.graveyard.push(usedSpell);

      ai.board[aiSlotIndex] = null;
      resetCardStateForZoneChange(targetMonster);
      ai.hand.push(targetMonster);
      gameState.pendingAction = null;
      setLog(`🌪️ [จีวรบิน] ส่ง "${targetMonster.name}" กลับขึ้นมือฝ่ายตรงข้ามสำเร็จ!`);
      renderGame();
      return;
    }

    if (action.type === 'CARPET_BOMB_DESTROY') {
      if (!targetMonster) {
        setLog('⚠️ กรุณาคลิกเลือกช่องที่มีมอนสเตอร์ของฝ่ายตรงข้ามอยู่!');
        return;
      }
      destroyBoardMonster(ai, aiSlotIndex, false, true);
      action.remainingKills -= 1;
      if (action.remainingKills <= 0 || !ai.board.some(m => m !== null)) {
        gameState.pendingAction = null;
        setLog(`💣 [ระเบิดปูพรม] ทำลายเป้าหมายเสร็จสิ้น!`);
      } else {
        setLog(`💣 [ระเบิดปูพรม] คลิกเลือกทำลายเพิ่มอีก ${action.remainingKills} ใบ!`);
      }
      renderGame();
      return;
    }

    if (action.type === 'BAKU_DESTROY_TARGET') {
      if (!targetMonster) {
        setLog('⚠️ กรุณาคลิกเลือกช่องที่มีมอนสเตอร์ของฝ่ายตรงข้ามอยู่!');
        return;
      }
      destroyBoardMonster(ai, aiSlotIndex, false, true);
      gameState.pendingAction = null;
      setLog(`💥 [บาคุจิต] สั่งทำลาย "${targetMonster.name}" สำเร็จ!`);
      renderGame();
      return;
    }

    if (action.type === 'SPELL_S01_DESTROY_TARGET') {
      if (!targetMonster) {
        setLog('⚠️ กรุณาคลิกเลือกช่องที่มีมอนสเตอร์ของฝ่ายตรงข้ามอยู่!');
        return;
      }
      const spellIdx = action.spellHandIndex;
      const discardIdx = action.discardHandIndex;
      const spellCard = player.hand[spellIdx];
      const discardCard = player.hand[discardIdx];

      [spellIdx, discardIdx].sort((a, b) => b - a).forEach(idx => player.hand.splice(idx, 1));

      resetCardStateForZoneChange(discardCard);
      resetCardStateForZoneChange(spellCard);
      player.graveyard.push(discardCard);
      player.graveyard.push(spellCard);
      player.spellQuota.normalUsed += 1;

      destroyBoardMonster(ai, aiSlotIndex, false, true);
      gameState.pendingAction = null;
      setLog(`🦶 [โอ็ยใครเหยียบตีน!!!] ทิ้ง "${discardCard.name}" และสั่งทำลาย "${targetMonster.name}" สำเร็จ!`);
      renderGame();
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
   หมวดที่ 7: ระบบการต่อสู้, มายอา, พวกเราจะช่วยเอง, ออลจิต/ออลฟอจิต และ INTERCEPT
   (แก้ไขให้เจ้าของการ์ดฝั่งถูกโจมตีเป็นคนเลือกป้องกันและใช้สกิลเองเสมอ ทั้ง AI และ PvP)
   ============================================================================ */
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

  // 🌐 กรณีโหมด PvP และเราเป็นคนสั่งโจมตี: ส่งคำสั่งไปให้เครื่องของเพื่อนเป็นคนเลือกป้องกันเอง!
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

  // 🤖 กรณีฝ่ายตั้งรับไม่ใช่ผู้เล่นหน้าจอนี้ (เป็น AI): ให้ AI ตัดสินใจใช้สกิลเองอัตโนมัติ ไม่ต้องเด้งถามผู้เล่น
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
      const topCard = defender.deck[defender.deck.length - 1];
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

  // 👤 กรณีเราเป็นฝ่ายถูกโจมตี (isLocalDefender === true): เด้งถามเฉพาะการ์ดของเราเอง
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

  // 🤖 กรณีฝ่ายตั้งรับเป็น AI: ให้ AI ตัดสินใจเองอัตโนมัติ
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

  // 👤 กรณีเราเป็นเจ้าของลีดเดอร์ที่กำลังถูกตี: เด้งถามเรา
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
    checkGameOver();
    if (onCompleteCallback) onCompleteCallback();
    return;
  }

  // 🤖 กรณีฝ่ายตั้งรับเป็น AI: ให้ AI เลือกตัวบล็อกเองโดยไม่เด้งถามผู้เล่น
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
      const msg = compareAndDestroyMonsters(attacker, attackerSlot, defender, chosenSlot);
      setLog(`🛡️ AI สั่ง "${blocker.name}" เข้ามา Intercept! -> ${msg}`);
    } else {
      defender.leader.hp = Math.max(0, defender.leader.hp - 1);
      setLog(`💥 AI เลือกไม่ป้องกัน! Leader ของ AI เสีย 1 HP (เหลือ ${defender.leader.hp}/6)`);
    }
    renderGame();
    checkGameOver();
    if (onCompleteCallback) onCompleteCallback();
  } else {
    // 👤 กรณีเราเป็นฝ่ายตั้งรับ: เปิดหน้าต่างให้เราเลือกการ์ดฝั่งเราเอง
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
  }

  renderGame();
  checkGameOver();
  if (onCompleteCallback) onCompleteCallback();
}

document.getElementById('btn-skip-intercept').addEventListener('click', () => {
  resolvePlayerIntercept(null);
});


/* ============================================================================
   หมวดที่ 8: ระบบปุ่ม "เฟสถัดไป" + ปุ่ม "ยอมแพ้" และระบบ AI
   ============================================================================ */
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
  setTimeout(startAITurn, 650);
}

function startAITurn() {
  if (gameState.gameOver) return;
  gameState.activeTurn = 'ai';
  gameState.turnCount += 1;
  gameState.phase = 'Start Phase';

  setLog('🤖 เทิร์นของ AI: จั่วการ์ด 1 ใบ และเปลี่ยนยูนิททั้งหมดเป็น Stand');
  executeStartPhase(gameState.ai, () => {
    renderGame();
    setTimeout(() => {
      if (gameState.gameOver) return;
      gameState.phase = 'Main Phase';
      aiPlayMainPhase(() => {
        setTimeout(() => {
          if (gameState.gameOver) return;
          gameState.phase = 'Battle Phase';
          renderGame();
          aiPlayBattlePhase(0);
        }, 800);
      });
    }, 800);
  });
}

function aiPlayMainPhase(onMainComplete) {
  const ai = gameState.ai;
  const player = gameState.player;

  for (let slot = 0; slot < 3; slot++) {
    if (ai.board[slot] === null) {
      let summonIdx = ai.hand.findIndex(c => c.type === 'Monster' && !c.cannotNormalSummon && !c.isSpy && c.id !== 'M04' && c.id !== 'M03');
      if (summonIdx === -1) {
        summonIdx = ai.hand.findIndex(c => c.type === 'Monster' && !c.cannotNormalSummon && !c.isSpy && c.id !== 'M04');
      }

      if (summonIdx !== -1) {
        const summoned = ai.hand.splice(summonIdx, 1)[0];
        resetCardStateForZoneChange(summoned);
        summoned.state = 'Stand';
        if (summoned.id === 'NM04') summoned.permPowerMod += 1;
        ai.board[slot] = summoned;
        setLog(`🤖 AI อัญเชิญ "${summoned.name}" ลงสนาม!`);

        if (summoned.id === 'M01') {
          let bestTarget = -1;
          let maxPwr = -1;
          player.board.forEach((m, idx) => {
            if (m && !m.immuneToEnemyEffectsUntilEndOfTurn && getEffectivePower(m, player) > maxPwr) {
              maxPwr = getEffectivePower(m, player);
              bestTarget = idx;
            }
          });
          if (bestTarget !== -1) {
            destroyBoardMonster(player, bestTarget, false, true);
            setLog(`💥 [AI บาคุจิต] ทำลายมอนสเตอร์บนสนามของคุณ!`);
          }
        }
      }
    }
  }

  ai.board.forEach((m, slotIdx) => {
    if (!m) return;
    if (m.id === 'M02' && !m.usedSkills.todoroRecover) {
      const bakuIdx = ai.graveyard.findIndex(c => c.id === 'M01');
      if (bakuIdx !== -1) {
        const baku = ai.graveyard.splice(bakuIdx, 1)[0];
        resetCardStateForZoneChange(baku);
        ai.hand.push(baku);
        m.usedSkills.todoroRecover = true;
        setLog('🤖 [AI โทโดโรจิต] นำ "บาคุจิต" จากกองนรกขึ้นมือ!');
      }
    }

    const hasEndeInHand = ai.hand.some(c => c.id === 'M05');
    if (m.id === 'M06' && !m.usedSkills.hawksSearch && !hasEndeInHand && getEffectivePower(m, ai) >= 2) {
      if (ai.graveyard.some(c => c.id === 'M05')) {
        executeHawksSearch(ai, slotIdx, 'grave');
      } else if (ai.deck.some(c => c.id === 'M05')) {
        executeHawksSearch(ai, slotIdx, 'deck');
      }
    }
  });

  for (let slot = 0; slot < 3; slot++) {
    if (ai.board[slot] === null) {
      const endeIdx = ai.hand.findIndex(c => c.id === 'M05');
      if (endeIdx !== -1) {
        const summonedEnde = ai.hand.splice(endeIdx, 1)[0];
        resetCardStateForZoneChange(summonedEnde);
        ai.board[slot] = summonedEnde;
        setLog('🤖 AI อัญเชิญ "เอ็นเดจิต" ลงสนาม!');
      }
    }
  }

  ai.board.forEach((m, slotIdx) => {
    if (m && m.id === 'M05' && !m.usedSkills.endeBoost && canContestantAttack(ai, m).allowed) {
      triggerEndeSkill(ai, slotIdx);
    }
  });

  if (ai.leader.id === 'L01' && !ai.leader.abilityUsedThisTurn) {
    const targetAlly = ai.board.find(m => m !== null && m.state === 'Stand' && m.id !== 'NM05');
    if (targetAlly) {
      targetAlly.tempPowerMod += 1;
      ai.leader.abilityUsedThisTurn = true;
      setLog(`👑 [AI มายฮีโร่ เดจิต] เพิ่มพลังให้ "${targetAlly.name}" +1 จนจบเทิร์น!`);
    }
  }

  if (ai.spellQuota.normalUsed < 1) {
    const s02Idx = ai.hand.findIndex(c => c.id === 'S02');
    const playerHasMonster = player.board.some(m => m !== null);
    if (s02Idx !== -1 && playerHasMonster) {
      const spell = ai.hand.splice(s02Idx, 1)[0];
      ai.spellQuota.normalUsed += 1;
      player.board.forEach(m => { if (m && !m.immuneToEnemyEffectsUntilEndOfTurn) m.tempPowerMod -= 3; });
      ai.graveyard.push(spell);
      setLog('📉 AI ใช้เวทย์ "เชี่ย หุ้นตก" ลดพลังยูนิทของคุณทุกใบลง 3 จนจบเทิร์น!');
    }
  }

  renderGame();
  onMainComplete();
}

function aiPlayBattlePhase(slotIndex) {
  if (gameState.gameOver) return;
  const ai = gameState.ai;
  const player = gameState.player;

  if (slotIndex >= 3) {
    setTimeout(endAITurn, 700);
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

  let bestTargetSlot = -1;
  let bestTargetPower = -1;
  player.board.forEach((m, idx) => {
    if (m) {
      if (m.id === 'DM03' && playerHasTsururu) return;
      const pPower = getEffectivePower(m, player);
      if (aiPower > pPower && pPower > bestTargetPower) {
        bestTargetPower = pPower;
        bestTargetSlot = idx;
      }
    }
  });

  if (bestTargetSlot !== -1) {
    executeAttack(ai, player, slotIndex, 'monster', bestTargetSlot, () => {
      setTimeout(() => aiPlayBattlePhase(slotIndex + 1), 850);
    });
  } else {
    executeAttack(ai, player, slotIndex, 'leader', null, () => {
      setTimeout(() => aiPlayBattlePhase(slotIndex + 1), 850);
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
  }, 600);
}


/* ============================================================================
   หมวดที่ 9: ระบบแสดงคำอธิบายการ์ด (TOOLTIP + แตะค้างบนมือถือ) และ RENDER UI
   ============================================================================ */
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
  const container = document.getElementById(containerId);
  const slots = container.querySelectorAll('.slot');
  const pendingType = gameState.pendingAction ? gameState.pendingAction.type : null;
  const selectedHandCard = (gameState.selectedHandIndex !== null && gameState.player)
    ? gameState.player.hand[gameState.selectedHandIndex]
    : null;

  slots.forEach((slotEl, idx) => {
    slotEl.innerHTML = '';
    slotEl.classList.remove('valid-target', 'attack-target');

    const monster = contestant.board[idx];
    if (monster) {
      const cardEl = createCardElement(monster, contestant);
      if (isPlayerBoard && gameState.selectedAttackerSlot === idx) {
        cardEl.classList.add('selected-attacker');
      }
      slotEl.appendChild(cardEl);

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

function renderGame() {
  const { player, ai } = gameState;
  if (!player || !ai) return;

  ensureZoneUIAndViewers();
  setupInGameControlBar();

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
  aiLeaderBox.onmouseenter = (e) => showCardTooltip(e, ai.leader, ai);
  aiLeaderBox.onmousemove = (e) => moveCardTooltip(e);
  aiLeaderBox.onmouseleave = () => hideCardTooltip();

  const leaderSuffix = (player.leader.id === 'L01')
    ? (player.leader.abilityUsedThisTurn ? '(ใช้สกิลแล้ว)' : '(คลิกใช้สกิล)')
    : '(คลิกดูรายละเอียด)';
  document.getElementById('player-leader-name').textContent = `${player.leader.name} ${leaderSuffix}`;
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
    `Turn ${gameState.turnCount} (${gameState.activeTurn === 'player' ? 'ตาของคุณ' : 'ตาของฝ่ายตรงข้าม'})`;
  document.getElementById('phase-indicator').textContent = gameState.phase;
  document.getElementById('normal-spell-quota').textContent = `Normal Spell: ${player.spellQuota.normalUsed} / 1`;
  document.getElementById('reaction-spell-quota').textContent = `Reaction Spell: ${player.spellQuota.reactionUsed} / 1`;

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
   หมวดที่ 10: ระบบหน้าต่างจัดเด็ค (บันทึกเด็คแล้วไม่ขึ้นหน้า Mulligan)
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

  const scrollbox = document.getElementById('action-log-scrollbox');
  if (scrollbox) scrollbox.innerHTML = '';

  gameState.player = createContestant('Player', true, 'P1', currentDeckConfig.leaderId, currentDeckConfig.mainDeck);
  gameState.ai = createContestant('AI', false, 'AI', 'L01', DEFAULT_DECK_LIST);

  drawCards(gameState.player, 5);
  drawCards(gameState.ai, 5);

  document.getElementById('mulligan-modal').style.display = 'flex';
  setLog('🎲 เริ่มเกมใหม่! กรุณาเลือกเปลี่ยนการ์ดเริ่มต้น (Mulligan) สูงสุด 2 ใบ');
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

  // 🌐 เมื่อเพื่อนสั่งโจมตีมาหาเรา: ให้เครื่องของเราซึ่งเป็นเจ้าของการ์ดฝั่งตั้งรับเป็นคนเลือกสกิลและตัวบล็อกเอง!
  if (data.type === 'DECLARE_ATTACK') {
    pvpState.isApplyingRemote = true;
    gameState.ai = data.senderData;
    gameState.player = data.receiverData;
    gameState.ai.name = 'ฝ่ายตรงข้าม';
    gameState.player.name = 'Player';
    _originalRenderGame();
    pvpState.isApplyingRemote = false;

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
    return;
  }

  // 🌐 เมื่อเพื่อนเลือกป้องกันเสร็จแล้ว ส่งผลลัพธ์กลับมาที่เครื่องคนโจมตี
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
  bindMultiplayerButtons();
  setupInGameControlBar();

  const lobbyScreen = document.getElementById('lobby-screen');
  const gameBoard = document.querySelector('.game-container');
  const mull = document.getElementById('mulligan-modal');
  if (!lobbyScreen || !gameBoard) return;

  gameBoard.style.display = 'none';
  if (mull) mull.style.display = 'none';

  document.getElementById('btn-lobby-bot')?.addEventListener('click', () => {
    pvpState.isMultiplayer = false;
    pvpState.waitingForDefense = false;
    lobbyScreen.style.display = 'none';
    gameBoard.style.display = 'flex';
    initGame();
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

  document.getElementById('card-menu-deckbuilder')?.addEventListener('click', openDeckFn);
  document.getElementById('nav-deck')?.addEventListener('click', openDeckFn);
  document.getElementById('card-menu-cardlist')?.addEventListener('click', openCardsFn);
  document.getElementById('nav-cards')?.addEventListener('click', openCardsFn);
  document.getElementById('nav-play')?.addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('pvp-room-modal').style.display = 'flex';
  });
  document.getElementById('card-menu-preset')?.addEventListener('click', () => {
    openDeckBuilder();
    document.getElementById('btn-default-deck').click();
  });
}

setupLobbyEvents();
