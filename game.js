/* ============================================================================
   สารบัญหมวดหมู่โค้ดในไฟล์ game.js
   ----------------------------------------------------------------------------
   หมวดที่ 1: ฐานข้อมูลการ์ดทั้งหมด (CARD DATABASE & DEFAULT DECKS)
   หมวดที่ 2: ระบบจัดการกองการ์ด และการคำนวณค่าพลัง (DECK & POWER CALCULATION)
   หมวดที่ 3: สถานะเกม ระบบ Log และหน้าต่างเปิดดูโซนต่างๆ (STATE, LOGS & ZONES)
   หมวดที่ 4: ความสามารถกดใช้ของ Leader และ Monster บนสนาม (ACTIVATED ABILITIES)
   หมวดที่ 5: ระบบการ์ดเวทมนตร์ (SPELL CARDS)
   หมวดที่ 6: ระบบจัดการเทิร์นและการคลิกกระดาน (TURN & CLICK HANDLERS)
   หมวดที่ 7: ระบบการต่อสู้และ Intercept (COMBAT SYSTEM)
   หมวดที่ 8: ระบบปัญญาประดิษฐ์และปุ่มเปลี่ยนเฟส (AI LOGIC & PHASES)
   หมวดที่ 9: ระบบแสดงคำอธิบายการ์ดและวาดหน้าจอกระดาน (TOOLTIP & RENDER UI)
   หมวดที่ 10: ระบบหน้าต่างจัดเด็ค (DECK BUILDER)
   หมวดที่ 11: ระบบควบคุมหน้าล็อบบี้หลักและดวลออนไลน์ (LOBBY & MULTIPLAYER PVP)
   ============================================================================ */


/* ============================================================================
   หมวดที่ 1: ฐานข้อมูลการ์ดทั้งหมด (CARD DATABASE - เด็คจิต, เด็คเหนือ, เด็ควันสิ้นโลก)
   ============================================================================ */
const CARD_DATABASE = [
  // ==================== LEADER ====================
  { id: 'L01', name: 'มายฮีโร่ เดจิต', type: 'Leader', maxHp: 6, image: 'images/เด็คจิต/1.png', ability: 'LEADER_DEJIT_BUFF', desc: 'สั่งใช้งาน/1 เทิร์น: เลือกยูนิทฝั่งเรา 1 ตัว เพิ่มพลังโจมตี +1 จนจบเทิร์น' },
  { id: 'L02', name: 'ขุนเหนือ', type: 'Leader', maxHp: 6, image: 'images/เด็คเหนือ/1.png', ability: 'LEADER_KHUN_NUEA', desc: 'ออโต้: เมื่อเข้าเทิร์น นำ "ไพร่ชาวนาเหนือ" จากกองหรือนรกไม่เกิน 1 ใบขึ้นมือ\nต่อเนื่อง: ถ้ามี "เหนือ" 3 ใบบนสนาม "เหนือ" ทุกใบบนสนามเราพลังโจมตี +1' },
  { id: 'L03', name: 'วันสิ้นโลก', type: 'Leader', maxHp: 6, image: 'images/วันสิ้นโลก/1.png', ability: 'LEADER_DOOMSDAY', desc: 'ออโต้: เมื่อเข้าเทิร์น คอลการ์ดยูนิตจากนรก 1 ใบลงสนาม โดยที่พลังโจมตีพื้นฐานต้องไม่เกิน 2' },

  // ==================== MONSTER & SPELL: เด็คจิต ====================
  { id: 'M01', name: 'บาคุจิต', type: 'Monster', power: 2, image: 'images/เด็คจิต/2.png', ability: 'BAKU_SKILL', desc: 'ต่อเนื่อง: ถ้ามีโทโดโรจิตบนสนามเรา พลัง +1\nออโต้: เมื่อลงสนาม เลือกทำลายยูนิทอีกฝ่าย 1 ใบ' },
  { id: 'M02', name: 'โทโดโรจิต', type: 'Monster', power: 1, image: 'images/เด็คจิต/3.png', ability: 'TODORO_SKILL', desc: 'สั่งใช้งาน1/เทิร์น: ทิ้งมือ 1 ใบ โม่กองอีกฝ่าย 1 ใบ\nสั่งใช้งาน2/เทิร์น: นำบาคุจิตจากนรกขึ้นมือ 1 ใบ' },
  { id: 'M03', name: 'ออลจิต', type: 'Monster', power: 2, image: 'images/เด็คจิต/4.png', ability: 'ALL_JIT_HAND_INTERCEPT', desc: 'เมื่อลีดเดอร์ถูกโจมตี: อัญเชิญใบนี้จากมือลงสนาม และเปลี่ยนเป้าหมายโจมตีมาที่ใบนี้แทน' },
  { id: 'M04', name: 'ออลฟอจิต', type: 'Monster', power: 3, image: 'images/เด็คจิต/5.png', ability: 'ALL_FOR_JIT_GRAVE', cannotNormalSummon: true, desc: 'ห้ามอัญเชิญปกติ | จากนรก/1 เกม (เมื่อลีดเดอร์ถูกตีและ HP<=2): อัญเชิญใบนี้และทำลายยูนิททุกใบบนสนาม' },
  { id: 'M05', name: 'เอ็นเดจิต', type: 'Monster', power: 2, image: 'images/เด็คจิต/6.png', ability: 'ENDE_SKILL', desc: 'สั่งใช้งาน: พลังโจมตียูนิทนี้ +2 และเมื่อจบเทิร์น ทำลายการ์ดใบนี้' },
  { id: 'M06', name: 'ฮออ์กส์ฟีม', type: 'Monster', power: 2, image: 'images/เด็คจิต/7.png', ability: 'HAWKS_SKILL', desc: 'สั่งใช้งาน: ลดพลังใบนี้ -2 นำเอ็นเดจิตจากกอง/นรกขึ้นมือ\nออโต้: เมื่อเอ็นเดจิตใช้สกิล ใบนี้พลัง +2' },
  { id: 'S01', name: 'โอ็ยใครเหยียบตีน!!!', type: 'NormalSpell', effect: 'SPELL_DISCARD_DESTROY', image: 'images/เด็คจิต/8.png', desc: 'ทิ้งการ์ดบนมือ 1 ใบ เลือกทำลายยูนิทฝั่งตรงข้าม 1 ใบ' },
  { id: 'S02', name: 'เชี่ย หุ้นตก', type: 'NormalSpell', effect: 'SPELL_DEBUFF_ALL_3', image: 'images/เด็คจิต/9.png', desc: 'ลดพลังโจมตีของยูนิทฝั่งตรงข้ามทุกใบลง 3 หน่วย จนจบเทิร์น' },
  { id: 'S03', name: 'หนึ่งเดียวเพื่อทุกสิ่ง', type: 'NormalSpell', effect: 'SPELL_REST_1_HEAL_1', image: 'images/เด็คจิต/10.png', desc: 'Rest ยูนิทที่ Stand อยู่ฝั่งเรา 1 ใบ แล้วเพิ่มพลังชีวิตลีดเดอร์เรา +1' },
  { id: 'S04', name: 'ทุกสิ่งเพื่อหนึ่งเดียว', type: 'NormalSpell', effect: 'SPELL_REST_2_GRANT_BURN', image: 'images/เด็คจิต/11.png', desc: 'Rest ยูนิทฝั่งเรา 2 ใบ เลือกยูนิทเรา 1 ใบได้รับออโต้: เมื่อตีทำลายยูนิทสำเร็จ ทำดาเมจลีดเดอร์อีกฝ่าย 1' },

  // ==================== MONSTER & SPELL: เด็คเหนือ ====================
  { id: 'NM01', name: 'ไพร่ชาวนาเหนือ', type: 'Monster', power: 1, image: 'images/เด็คเหนือ/2.png', ability: 'PEASANT_HAND_SKILL', desc: 'สั่งใช้จากบนมือ: ส่งใบนี้ลงนรกและเลือก 1 อย่าง:\n1) อัญเชิญ "สายลับไพร่เหนือ" จากกองหรือนรกลงสนามอีกฝ่าย\n2) นำการ์ด "ทหาร" 1 ใบจากกองขึ้นมือ' },
  { id: 'NM02', name: 'ทหารหลวงเหนือ', type: 'Monster', power: 2, image: 'images/เด็คเหนือ/3.png', ability: 'ROYAL_GUARD_SKILL', desc: 'สั่งใช้จากบนมือ: ส่ง "ไพร่ชาวนาเหนือ" 1 ใบบนมือลงนรกเพื่ออัญเชิญจุติใบนี้ (พลัง +1)\nจุติ: หากมี "ทหารเกณฑ์เหนือ" บนสนามเรา อัญเชิญ "ทหาร" 1 ใบจากกอง/นรกลงสนามทันที' },
  { id: 'NM03', name: 'ทหารพรานเหนือ', type: 'Monster', power: 1, image: 'images/เด็คเหนือ/4.png', ability: 'RANGER_SKILL', desc: 'สั่งใช้จากบนมือ: ส่ง "ไพร่ชาวนาเหนือ" ลงนรกแล้วอัญเชิญใบนี้ลงสนาม (พลัง +1)\nสั่งใช้/เทิร์นละครั้ง: เลือกยูนิท 1 ใบ ถ้าเป็นฝั่งเราพลัง +1 ถ้าเป็นฝั่งตรงข้ามพลัง -1' },
  { id: 'NM04', name: 'ทหารเกณฑ์เหนือ', type: 'Monster', power: 1, image: 'images/เด็คเหนือ/5.png', ability: 'CONSCRIPT_SKILL', desc: 'ออโต้: เมื่อลงสนาม พลัง +1\nต่อเนื่อง: พลังโจมตี +1 ตามจำนวน "ทหาร" ใบอื่นบนสนามเรา\nคำสั่งเสีย: เมื่อถูกทำลาย นำการ์ดที่มีคำว่า "ไพร่" 1 ใบจากนรกขึ้นมือ' },
  { id: 'NM05', name: 'สายลับไพร่เหนือ', type: 'Monster', power: 0, image: 'images/เด็คเหนือ/6.png', ability: 'SPY_SKILL', isSpy: true, desc: 'สายลับ: อัญเชิญการ์ดใบนี้ลงบนสนามฝ่ายตรงข้าม\nคำสั่งเสีย: ลงนรกฝ่ายตรงข้าม และฝ่ายตรงข้ามจั่วการ์ด 1 ใบ' },
  { id: 'NS01', name: 'หมอไพร่เหนือ', type: 'NormalSpell', effect: 'SPELL_RECOVER_PHRAI', image: 'images/เด็คเหนือ/7.png', desc: 'นำการ์ดที่มีคำว่า "ไพร่" 1 ใบจากนรกขึ้นมือ' },
  { id: 'NS02', name: 'หมอสนามเหนือ', type: 'NormalSpell', effect: 'SPELL_RECOVER_SOLDIER', image: 'images/เด็คเหนือ/8.png', desc: 'นำการ์ดที่มีคำว่า "ทหาร" 1 ใบจากนรกขึ้นมือ' },
  { id: 'NS03', name: 'ระเบิดปูพรม', type: 'NormalSpell', effect: 'SPELL_CARPET_BOMB', image: 'images/เด็คเหนือ/9.png', desc: 'แสดงผลตามยูนิท "ทหาร" บนสนามเรา:\n- ทหารเกณฑ์เหนือ: ยูนิท "เหนือ" ทุกใบพลัง +1 จนจบเทิร์น\n- ทหารพรานเหนือ: ทำลายยูนิทอีกฝ่าย 1 ใบ\n- ทหารหลวงเหนือ: ยูนิทเราทุกใบไม่ถูกทำลายจนเริ่มเทิร์นถัดไป' },
  { id: 'NS04', name: 'หน่วยข่าวกรอง', type: 'NormalSpell', effect: 'SPELL_RECOVER_SPELL', image: 'images/เด็คเหนือ/10.png', desc: 'นำการ์ดเวทจากในนรกขึ้นมือ 1 ใบ' },
  { id: 'NS05', name: 'จีวรบิน', type: 'NormalSpell', effect: 'SPELL_BOUNCE_ENEMY', image: 'images/เด็คเหนือ/11.png', desc: 'เลือกยูนิทฝั่งตรงข้าม 1 ใบ นำการ์ดใบนั้นกลับขึ้นมือเจ้าของ' },

  // ==================== MONSTER & SPELL: เด็ควันสิ้นโลก ====================
  { id: 'DM01', name: 'โอนามิ ผู้ทำลายโลก', type: 'Monster', power: 2, maxCopies: 2, image: 'images/วันสิ้นโลก/2.png', ability: 'ONAMI_SKILL', desc: 'คู่หู: เมื่ออยู่คู่กับ "โรเซเลีย" พลังโจมตี +2 ตลอดเทิร์นเราและอีกฝ่าย\nสั่งใช้งาน/1 เทิร์น: ทิ้งการ์ดมือ 1 ใบ อัญเชิญ "โรเซเลีย" จากกองหรือนรก 1 ใบลงสนาม แล้วสับกอง' },
  { id: 'DM02', name: 'โรเซเลีย', type: 'Monster', power: 3, maxCopies: 2, image: 'images/วันสิ้นโลก/3.png', ability: 'ROSELIA_SKILL', desc: 'คู่หู: เมื่ออยู่คู่กับโอนามิ สามารถ Rest ใบนี้เพื่อจั่ว 1 ใบได้\nออโต้: เมื่อลงสนามด้วยสกิลของโอนามิ จะไม่โดนความสามารถการ์ดอีกฝ่ายจนจบเทิร์น\nออโต้: เมื่อถูกทำลายจากการต่อสู้ จั่ว 1 ใบ' },
  { id: 'DM03', name: 'มายอา', type: 'Monster', power: 2, maxCopies: 1, image: 'images/วันสิ้นโลก/4.png', ability: 'MAYA_SKILL', desc: '[ใส่ได้ 1 ใบ] ต่อเนื่อง: ตราบที่มี "ซึรุรุ" บนสนามเรา ยูนิทนี้ไม่ตกเป็นเป้าหมายการโจมตี\n1 เกม: เมื่ออีกฝ่ายโจมตี เปิดท็อปการ์ด 1 ใบ ถ้าเป็น "โซเนบุ" อีกฝ่ายจบเทิร์นทันที' },
  { id: 'DM04', name: 'เดบิรุน', type: 'Monster', power: 2, maxCopies: 1, image: 'images/วันสิ้นโลก/5.png', ability: 'DEBIRUN_SKILL', desc: '[ใส่ได้ 1 ใบ] ออโต้: เมื่อเข้าเทิร์น ค้นหาการ์ดเวทจากกองหรือนรกขึ้นมือแล้วบังคับใช้งาน แต่ถ้าไม่สามารถใช้งานได้ ชุบยูนิตจากนรกได้ 1 ใบ' },
  { id: 'DM05', name: 'ซึรุรุ', type: 'Monster', power: 1, maxCopies: 1, image: 'images/วันสิ้นโลก/6.png', ability: 'TSURURU_SKILL', desc: '[ใส่ได้ 1 ใบ] ออโต้: เมื่อการ์ดใบนี้ถูกทิ้งจากสกิลของ "โอนามิ ผู้ทำลายโลก" อีกฝ่ายต้องทิ้งมือ 1 ใบ' },
  { id: 'DM06', name: 'โซเนบุ', type: 'Monster', power: 3, maxCopies: 1, image: 'images/วันสิ้นโลก/7.png', ability: 'SONEBU_SKILL', desc: '[ใส่ได้ 1 ใบ] ออโต้: เมื่อยูนิตนี้โจมตี ถ้าอีกฝ่ายใช้เวทรีแอค ทั้ง 2 ฝ่ายทอยเต๋า ใครน้อยกว่าชนะและสกิลเวทนั้นไร้ผล' },
  { id: 'DM07', name: 'แอชชี่ล่า', type: 'Monster', power: 2, maxCopies: 1, image: 'images/วันสิ้นโลก/8.png', ability: 'ASHILA_SKILL', desc: '[ใส่ได้ 1 ใบ] สั่งใช้งานจากบนมือ: ถ้ายูนิตฝ่ายเราถูกทำลาย 2 ใบขึ้นไปในเทิร์นนี้ คอลใบนี้ลงสนามและพลังโจมตี +2 จนจบเทิร์น' },
  { id: 'DM08', name: 'เอมิ', type: 'Monster', power: 1, maxCopies: 1, image: 'images/วันสิ้นโลก/9.png', ability: 'EMI_SKILL', desc: '[ใส่ได้ 1 ใบ] ออโต้: ถ้าบนสนามเรามี "เดบิรุน" พลังโจมตี +1 และสามารถทิ้งการ์ดมือ 3 ใบเพื่อ Stand โจมตีอีกครั้งได้' },

  // --- การ์ดอนาคต (DM09 - DM14) ---
  { id: 'DM09', name: 'ผู้รักษาความฝัน มายอา', type: 'Monster', power: 2, maxCopies: 1, cannotNormalSummon: true, image: 'images/วันสิ้นโลก/10.png', ability: 'FUTURE_MAYA', futureBaseId: 'DM03', futureBaseName: 'มายอา', desc: '[ใส่ได้ 1 ใบ | ห้ามอัญเชิญปกติ | อนาคต: มายอา]\nส่ง "มายอา" บนสนามไปมิติมืดแล้วคอลใบนี้: พลัง +1 และเปิดท็อปกอง ถ้าเป็นเวท บังคับ Rest ยูนิตอีกฝ่าย 1 ใบ' },
  { id: 'DM10', name: 'เดบิรุน เดอะ ฟิวเจอร์', type: 'Monster', power: 2, maxCopies: 1, cannotNormalSummon: true, image: 'images/วันสิ้นโลก/11.png', ability: 'FUTURE_DEBIRUN', futureBaseId: 'DM04', futureBaseName: 'เดบิรุน', desc: '[ใส่ได้ 1 ใบ | ห้ามอัญเชิญปกติ | อนาคต: เดบิรุน]\nส่ง "เดบิรุน" บนสนามไปมิติมืดแล้วคอลใบนี้: นำยูนิตอื่นบนสนามเรา 1 ใบขึ้นมือ จากนั้นเปิดท็อปกอง ถ้าเป็นยูนิตคอลลงสนามโดยสกิลไม่ทำงาน ถ้าเป็นเวทนำขึ้นมือ' },
  { id: 'DM11', name: 'เด็กสาวขนมหวาน ซึรุรุ', type: 'Monster', power: 2, maxCopies: 1, cannotNormalSummon: true, image: 'images/วันสิ้นโลก/12.png', ability: 'FUTURE_TSURURU', futureBaseId: 'DM05', futureBaseName: 'ซึรุรุ', desc: '[ใส่ได้ 1 ใบ | ห้ามอัญเชิญปกติ | อนาคต: ซึรุรุ]\nส่ง "ซึรุรุ" บนสนามไปมิติมืดแล้วคอลใบนี้: คอล "มายอา" จากนรก 1 ใบลงสนามและเพิ่มพลังให้มายอา +1' },
  { id: 'DM12', name: 'นักล่าปีศาจ โซเนบุ', type: 'Monster', power: 2, maxCopies: 1, cannotNormalSummon: true, image: 'images/วันสิ้นโลก/13.png', ability: 'FUTURE_SONEBU', futureBaseId: 'DM06', futureBaseName: 'โซเนบุ', desc: '[ใส่ได้ 1 ใบ | ห้ามอัญเชิญปกติ | อนาคต: โซเนบุ]\nส่ง "โซเนบุ" บนสนามไปมิติมืดแล้วคอลใบนี้: อีกฝ่ายเลือกทิ้งมือ 1 ใบ หรือทำลายยูนิตบนสนาม 1 ใบ ถ้าไม่ทำ ยูนิตนี้พลัง +1' },
  { id: 'DM13', name: 'ยอดนักดาบ แอชชี่ล่า', type: 'Monster', power: 3, maxCopies: 1, cannotNormalSummon: true, image: 'images/วันสิ้นโลก/14.png', ability: 'FUTURE_ASHILA', futureBaseId: 'DM07', futureBaseName: 'แอชชี่ล่า', desc: '[ใส่ได้ 1 ใบ | ห้ามอัญเชิญปกติ | อนาคต: แอชชี่ล่า]\nส่ง "แอชชี่ล่า" บนสนามไปมิติมืดแล้วคอลใบนี้: การ์ดทุกใบบนสนามอีกฝ่ายพลังโจมตี -1 จนจบเทิร์น' },
  { id: 'DM14', name: 'สุดยอดเอไอ เอมิ', type: 'Monster', power: 1, maxCopies: 1, cannotNormalSummon: true, image: 'images/วันสิ้นโลก/15.png', ability: 'FUTURE_EMI', futureBaseId: 'DM08', futureBaseName: 'เอมิ', desc: '[ใส่ได้ 1 ใบ | ห้ามอัญเชิญปกติ | อนาคต: เอมิ]\nส่ง "เอมิ" บนสนามไปมิติมืดแล้วคอลใบนี้: บังคับอีกฝ่ายนำการ์ดบนสนาม 1 ใบขึ้นมือแล้วคอลใบอื่นลงมาแทน' },

  // --- เวทมนตร์เด็ควันสิ้นโลก ---
  { id: 'DS01', name: 'เบิกเนตรแห่งแสง', type: 'NormalSpell', maxCopies: 2, effect: 'SPELL_LIGHT_AWAKEN', image: 'images/วันสิ้นโลก/16.png', desc: 'จั่วการ์ด 1 ใบ แต่ถ้าในนรกเรามีการ์ด 5 ใบขึ้นไป จั่ว 2 ใบแทน และเพิ่มพลังโจมตี +1 ให้ยูนิตบนสนามเรา 1 ใบ' },
  { id: 'DS02', name: 'พวกเราจะช่วยเอง', type: 'ReactionSpell', maxCopies: 2, effect: 'SPELL_WE_WILL_HELP', image: 'images/วันสิ้นโลก/17.png', desc: 'เมื่ออีกฝ่ายโจมตี: นำการ์ดยูนิต (ที่ไม่ใช่เวท) 5 ใบในนรกเรากลับเข้ากองและสับกอง แล้วยกเลิกการโจมตีนั้นทันที' }
];

const DEFAULT_DECK_LIST = ['M01', 'M01', 'M02', 'M02', 'M03', 'M03', 'M04', 'M04', 'M05', 'M05', 'M06', 'M06', 'S01', 'S01', 'S02', 'S02', 'S03', 'S03', 'S04', 'S04'];
const DEFAULT_NUEA_DECK_LIST = ['NM01', 'NM01', 'NM02', 'NM02', 'NM03', 'NM03', 'NM04', 'NM04', 'NM05', 'NM05', 'NS01', 'NS01', 'NS02', 'NS02', 'NS03', 'NS03', 'NS04', 'NS04', 'NS05', 'NS05'];
const DEFAULT_DOOMSDAY_DECK_LIST = ['DM01', 'DM01', 'DM02', 'DM02', 'DM03', 'DM04', 'DM05', 'DM06', 'DM07', 'DM08', 'DM09', 'DM10', 'DM11', 'DM12', 'DM13', 'DM14', 'DS01', 'DS01', 'DS02', 'DS02'];


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
  return contestant.board.some(m => m !== null && m.id === 'DM01') && contestant.board.some(m => m !== null && m.id === 'DM02');
}

function getEffectivePower(card, ownerContestant) {
  if (!card || card.type !== 'Monster') return 0;
  let total = (card.basePower !== undefined ? card.basePower : card.power) + (card.permPowerMod || 0) + (card.tempPowerMod || 0);

  if (ownerContestant && Array.isArray(ownerContestant.board)) {
    if (card.id === 'M01' && ownerContestant.board.some(m => m !== null && m.id === 'M02')) total += 1;
    if (card.id === 'NM04') total += ownerContestant.board.filter(m => m !== null && m.uid !== card.uid && isSoldierCard(m)).length;
    if (ownerContestant.leader && ownerContestant.leader.id === 'L02' && isNueaCard(card)) {
      if (ownerContestant.board.filter(m => m !== null && isNueaCard(m)).length >= 3) total += 1;
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
  const leaderTemplate = CARD_DATABASE.find(c => c.id === leaderId && c.type === 'Leader') || CARD_DATABASE.find(c => c.type === 'Leader');
  const defaultListForLeader = getDefaultDeckForLeader(leaderTemplate.id);
  const sourceList = (Array.isArray(mainDeckCardIds) && mainDeckCardIds.length === 20) ? mainDeckCardIds : defaultListForLeader;

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

  return { leader: { ...leaderTemplate, hp: leaderTemplate.maxHp, abilityUsedThisTurn: false }, deck: shuffleDeck(mainDeck) };
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
    if (contestant.hand[idx]) returnedCards.push(contestant.hand.splice(idx, 1)[0]);
  }
  drawCards(contestant, returnedCards.length);
  contestant.deck.push(...returnedCards);
  contestant.deck = shuffleDeck(contestant.deck);
}

function sendOverwrittenMonsterToGrave(contestant, slotIndex) {
  const oldMonster = contestant.board[slotIndex];
  if (!oldMonster) return null;
  contestant.board[slotIndex] = null;
  resetCardStateForZoneChange(oldMonster);
  contestant.graveyard.push(oldMonster);
  return oldMonster;
}

function destroyBoardMonster(boardOwner, slotIndex, isFromBattle = false, isByEnemyEffect = false) {
  const monster = boardOwner.board[slotIndex];
  if (!monster) return { destroyed: false, reason: 'empty' };

  if (isByEnemyEffect && monster.immuneToEnemyEffectsUntilEndOfTurn) {
    setLog(`🛡️ "${monster.name}" ไม่ได้รับผลจากความสามารถฝ่ายตรงข้าม!`);
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

  if (monster.id === 'NM04') {
    const phraiIdx = boardOwner.graveyard.findIndex(c => c.uid !== monster.uid && isPhraiCard(c));
    if (phraiIdx !== -1) {
      const phraiCard = boardOwner.graveyard.splice(phraiIdx, 1)[0];
      resetCardStateForZoneChange(phraiCard);
      boardOwner.hand.push(phraiCard);
      setLog(`🪦 [คำสั่งเสีย] นำ "${phraiCard.name}" จากนรกขึ้นมือ!`);
    }
  }
  if (monster.id === 'NM05') {
    drawCards(otherContestant, 1);
    setLog(`🕵️ [คำสั่งเสีย] สายลับไพร่เหนือลงนรก ฝ่ายตรงข้ามจั่วการ์ด 1 ใบ!`);
  }
  if (monster.id === 'DM02' && isFromBattle) {
    drawCards(boardOwner, 1);
    setLog(`🌹 [โรเซเลีย] ถูกทำลายจากการต่อสู้ จั่วการ์ด 1 ใบ!`);
  }

  return { destroyed: true, monster };
}


/* ============================================================================
   หมวดที่ 3: สถานะเกม ระบบ Log และหน้าต่างเปิดดูโซน (นรก / มิติมืด)
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
    name, isFirstPlayer, turnsTaken: 0, attacksThisTurn: 0, unitsDestroyedThisTurn: 0,
    futureUsedThisTurn: false, allForJitUsed: false, mayaOncePerGameUsed: false,
    leader: setup.leader, deck: setup.deck, hand: [], board: [null, null, null],
    graveyard: [], darkDimension: [], spellQuota: { normalUsed: 0, reactionUsed: 0 }
  };
}

function setLog(message) {
  const singleLog = document.getElementById('action-log');
  if (singleLog) singleLog.textContent = message;

  const scrollbox = document.getElementById('action-log-scrollbox');
  if (scrollbox) {
    const logItem = document.createElement('div');
    logItem.className = 'log-item';
    if (message.includes('🤖') || message.includes('AI')) logItem.classList.add('ai-action');
    logItem.textContent = `[Turn ${gameState.turnCount}] ${message}`;
    scrollbox.appendChild(logItem);
    scrollbox.scrollTop = scrollbox.scrollHeight;
  }
}

function checkGameOver() {
  if (gameState.player.leader.hp <= 0) {
    gameState.gameOver = true;
    gameState.pendingAction = null;
    setLog('💀 จบเกม! Leader ของคุณ HP เหลือ 0 — AI เป็นฝ่ายชนะ!');
    disableControls();
    return true;
  }
  if (gameState.ai.leader.hp <= 0) {
    gameState.gameOver = true;
    gameState.pendingAction = null;
    setLog('🏆 ยินดีด้วย! คุณโจมตี Leader ของ AI จน HP เหลือ 0 — คุณเป็นฝ่ายชนะ!');
    disableControls();
    return true;
  }
  return false;
}

function disableControls() {
  document.getElementById('btn-next-phase').disabled = true;
  document.getElementById('btn-end-turn').disabled = true;
}

function showChoiceModal(title, description, options) {
  let modal = document.getElementById('custom-choice-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'custom-choice-modal';
    modal.className = 'modal-overlay';
    modal.style.display = 'none';
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
    btn.onclick = () => { modal.style.display = 'none'; if (opt.onSelect) opt.onSelect(); };
    btnContainer.appendChild(btn);
  });
  modal.style.display = 'flex';
}

// สร้าง UI ช่อง "🌌 มิติมืด" และผูกคลิกดูการ์ดในนรก/มิติมืด
function ensureZoneUIAndViewers() {
  if (!document.getElementById('zone-viewer-modal')) {
    const viewerModal = document.createElement('div');
    viewerModal.id = 'zone-viewer-modal';
    viewerModal.className = 'modal-overlay';
    viewerModal.style.display = 'none';
    viewerModal.innerHTML = `
      <div class="modal-box" style="max-width: 780px; max-height: 88vh; overflow-y: auto;">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #334155; padding-bottom: 10px; margin-bottom: 15px;">
          <h2 id="zone-viewer-title" style="color: #fbbf24;">รายการการ์ด</h2>
          <button class="btn" id="btn-close-zone-viewer" style="background: #dc2626;">✖ ปิด</button>
        </div>
        <p id="zone-viewer-empty" style="color: #94a3b8; margin: 20px 0; display: none;">ไม่มีการ์ดในโซนนี้</p>
        <div id="zone-viewer-list" style="display: flex; flex-wrap: wrap; justify-content: center; gap: 12px; margin-bottom: 10px;"></div>
      </div>
    `;
    document.body.appendChild(viewerModal);
    document.getElementById('btn-close-zone-viewer').onclick = () => { viewerModal.style.display = 'none'; };
  }

  const aiGraveCountEl = document.getElementById('ai-grave-count');
  if (aiGraveCountEl) {
    const aiGraveBox = aiGraveCountEl.parentElement;
    aiGraveBox.style.cursor = 'pointer';
    aiGraveBox.title = 'คลิกดูนรก AI';
    aiGraveBox.onclick = () => openZoneViewerModal('🪦 กองนรก AI', gameState.ai.graveyard, gameState.ai);

    const aiPileGroup = aiGraveBox.parentElement;
    if (aiPileGroup && !document.getElementById('ai-dark-box')) {
      const darkBox = document.createElement('div');
      darkBox.id = 'ai-dark-box';
      darkBox.className = 'info-box';
      darkBox.style.background = '#131129';
      darkBox.style.border = '2px dashed #6366f1';
      darkBox.style.cursor = 'pointer';
      darkBox.title = 'คลิกดูมิติมืด AI';
      darkBox.innerHTML = `<div>🌌 มิติมืด</div><h2 id="ai-dark-count">0</h2><div style="font-size:10px; color:#a5b4fc;">(คลิกดู)</div>`;
      darkBox.onclick = () => openZoneViewerModal('🌌 มิติมืด AI', gameState.ai.darkDimension, gameState.ai);
      aiPileGroup.appendChild(darkBox);
    }
  }

  const playerGraveCountEl = document.getElementById('player-grave-count');
  if (playerGraveCountEl) {
    const playerGraveBox = playerGraveCountEl.parentElement;
    playerGraveBox.style.cursor = 'pointer';
    playerGraveBox.title = 'คลิกดูนรกของคุณ';
    playerGraveBox.onclick = () => openZoneViewerModal('🪦 กองนรกของคุณ', gameState.player.graveyard, gameState.player);

    const playerPileGroup = playerGraveBox.parentElement;
    if (playerPileGroup && !document.getElementById('player-dark-box')) {
      const darkBox = document.createElement('div');
      darkBox.id = 'player-dark-box';
      darkBox.className = 'info-box';
      darkBox.style.background = '#131129';
      darkBox.style.border = '2px dashed #6366f1';
      darkBox.style.cursor = 'pointer';
      darkBox.title = 'คลิกดูมิติมืดของคุณ';
      darkBox.innerHTML = `<div>🌌 มิติมืด</div><h2 id="player-dark-count">0</h2><div style="font-size:10px; color:#a5b4fc;">(คลิกดู)</div>`;
      darkBox.onclick = () => openZoneViewerModal('🌌 มิติมืดของคุณ', gameState.player.darkDimension, gameState.player);
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
      cardEl.style.cursor = 'default';
      listEl.appendChild(cardEl);
    });
  }
  modal.style.display = 'flex';
}


/* ============================================================================
   หมวดที่ 4: ความสามารถของ Leader และ Monster ทั้ง 3 เด็ค
   ============================================================================ */
function activateLeaderSkillPlayer() {
  const player = gameState.player;
  if (gameState.gameOver || gameState.activeTurn !== 'player' || gameState.phase !== 'Main Phase') return;
  if (gameState.pendingAction) { setLog('⚠️ กรุณาเลือกเป้าหมายที่ค้างอยู่ให้เสร็จก่อน!'); return; }
  if (player.leader.id === 'L02' || player.leader.id === 'L03') return;
  if (player.leader.id !== 'L01') return;
  if (player.leader.abilityUsedThisTurn) { setLog('❌ ใช้ความสามารถไปแล้วในเทิร์นนี้!'); return; }
  if (!player.board.some(m => m !== null)) { setLog('⚠️ ไม่มีมอนสเตอร์บนสนามให้เพิ่มพลัง!'); return; }

  gameState.selectedHandIndex = null;
  gameState.pendingAction = { type: 'LEADER_L01_TARGET' };
  setLog('👑 [เดจิต] เลือกยูนิทฝั่งเรา 1 ตัวเพื่อเพิ่มพลัง +1 จนจบเทิร์น');
  renderGame();
}

function triggerKhunNueaStartTurn(contestant) {
  if (!contestant.leader || contestant.leader.id !== 'L02') return;
  const inGraveIdx = contestant.graveyard.findIndex(c => c.id === 'NM01');
  const inDeckIdx = contestant.deck.findIndex(c => c.id === 'NM01');
  if (inGraveIdx === -1 && inDeckIdx === -1) return;

  if (contestant.name === 'AI') {
    if (inGraveIdx !== -1) {
      contestant.hand.push(resetCardStateForZoneChange(contestant.graveyard.splice(inGraveIdx, 1)[0]));
    } else if (inDeckIdx !== -1) {
      contestant.hand.push(resetCardStateForZoneChange(contestant.deck.splice(inDeckIdx, 1)[0]));
      contestant.deck = shuffleDeck(contestant.deck);
    }
    renderGame();
    return;
  }

  showChoiceModal('👑 ขุนเหนือ (ออโต้เข้าเทิร์น)', 'นำ "ไพร่ชาวนาเหนือ" จากกองหรือนรกไม่เกิน 1 ใบขึ้นมือ', [
    { label: 'จากนรก', disabled: inGraveIdx === -1, color: '#7c3aed', onSelect: () => { contestant.hand.push(resetCardStateForZoneChange(contestant.graveyard.splice(inGraveIdx, 1)[0])); renderGame(); } },
    { label: 'จากกอง', disabled: inDeckIdx === -1, color: '#0284c7', onSelect: () => { contestant.hand.push(resetCardStateForZoneChange(contestant.deck.splice(inDeckIdx, 1)[0])); contestant.deck = shuffleDeck(contestant.deck); renderGame(); } },
    { label: 'ข้าม', color: '#475569', onSelect: () => renderGame() }
  ]);
}

function triggerDoomsdayStartTurnQueue(contestant, onDoneCallback = null) {
  const finishQueue = () => { renderGame(); if (onDoneCallback) onDoneCallback(); };
  const checkDebirunStep = () => {
    if (!contestant.board.some(m => m !== null && m.id === 'DM04')) { finishQueue(); return; }
    triggerDebirunStartTurn(contestant, finishQueue);
  };

  if (contestant.leader && contestant.leader.id === 'L03') {
    const validTargets = contestant.graveyard.filter(c => c.type === 'Monster' && !c.cannotNormalSummon && !c.isSpy && (c.basePower !== undefined ? c.basePower : c.power) <= 2);
    if (validTargets.length > 0) {
      if (contestant.name === 'AI') {
        const emptySlot = contestant.board.findIndex(m => m === null);
        if (emptySlot !== -1) {
          const gIdx = contestant.graveyard.findIndex(c => c.uid === validTargets[0].uid);
          if (gIdx !== -1) contestant.board[emptySlot] = resetCardStateForZoneChange(contestant.graveyard.splice(gIdx, 1)[0]);
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
            label: `คอล "${c.name}" (Power ${c.power}) ลงสนาม`, color: '#7c3aed',
            onSelect: () => {
              const gIdx = contestant.graveyard.findIndex(g => g.id === c.id);
              if (gIdx !== -1) {
                const called = resetCardStateForZoneChange(contestant.graveyard.splice(gIdx, 1)[0]);
                const emptySlot = contestant.board.findIndex(m => m === null);
                if (emptySlot !== -1) {
                  contestant.board[emptySlot] = called;
                  checkDebirunStep();
                } else {
                  gameState.pendingAction = { type: 'CALL_FROM_EFFECT_SELECT_SLOT', cardToPlace: called, onAfterPlace: checkDebirunStep };
                  setLog(`⏳ สนามเต็ม — คลิกเลือกช่องบนสนามเพื่อวาง "${called.name}" ทับ`);
                  renderGame();
                }
              } else { checkDebirunStep(); }
            }
          });
        }
      });
      options.push({ label: 'ข้าม', color: '#475569', onSelect: () => checkDebirunStep() });
      showChoiceModal('⏳ วันสิ้นโลก (ออโต้เข้าเทิร์น)', 'คอลยูนิตพลังไม่เกิน 2 จากนรก 1 ใบ:', options);
      return;
    }
  }
  checkDebirunStep();
}

function triggerDebirunStartTurn(contestant, onComplete) {
  const unitsInGrave = contestant.graveyard.filter(c => c.type === 'Monster' && !c.cannotNormalSummon && !c.isSpy);
  if (unitsInGrave.length === 0) { if (onComplete) onComplete(); return; }

  if (contestant.name === 'AI') {
    const emptySlot = contestant.board.findIndex(m => m === null);
    if (emptySlot !== -1) contestant.board[emptySlot] = resetCardStateForZoneChange(contestant.graveyard.splice(contestant.graveyard.findIndex(c => c.uid === unitsInGrave[0].uid), 1)[0]);
    if (onComplete) onComplete();
    return;
  }

  const opts = [];
  const seen = new Set();
  unitsInGrave.forEach(u => {
    if (!seen.has(u.id)) {
      seen.add(u.id);
      opts.push({
        label: `ชุบ "${u.name}" (Power ${u.power})`, color: '#16a34a',
        onSelect: () => {
          const idx = contestant.graveyard.findIndex(g => g.id === u.id);
          if (idx !== -1) {
            const card = resetCardStateForZoneChange(contestant.graveyard.splice(idx, 1)[0]);
            const slot = contestant.board.findIndex(m => m === null);
            if (slot !== -1) {
              contestant.board[slot] = card;
              if (onComplete) onComplete();
            } else {
              gameState.pendingAction = { type: 'CALL_FROM_EFFECT_SELECT_SLOT', cardToPlace: card, onAfterPlace: onComplete };
              setLog(`😈 เดบิรุน: สนามเต็ม — เลือกช่องเพื่อวางทับ`);
              renderGame();
            }
          } else if (onComplete) onComplete();
        }
      });
    }
  });
  showChoiceModal('😈 เดบิรุน (ชุบยูนิตจากนรก)', 'เลือกยูนิตชุบลงสนาม:', opts);
}

// จัดการเมนูบนมือของเด็ควันสิ้นโลก (แอชชี่ล่า & อนาคต)
function handleDoomsdayHandMenu(handIndex) {
  const player = gameState.player;
  const ai = gameState.ai;
  const card = player.hand[handIndex];
  if (!card) return;

  if (card.id === 'DM07') {
    const canSpecialCall = player.unitsDestroyedThisTurn >= 2;
    showChoiceModal('🔥 แอชชี่ล่า', `ยูนิตที่ถูกทำลายในเทิร์นนี้: ${player.unitsDestroyedThisTurn} ใบ`, [
      { label: 'อัญเชิญปกติ (Power 2)', color: '#d97706', onSelect: () => { gameState.selectedHandIndex = handIndex; setLog('👉 เลือกแอชชี่ล่า — คลิกช่องสนาม (วางทับได้)'); renderGame(); } },
      {
        label: `สั่งใช้จากมือ (ยูนิตถูกทำลายครบ 2 ใบ): พลัง +2 ${!canSpecialCall ? '(เงื่อนไขไม่ครบ)' : ''}`, disabled: !canSpecialCall, color: '#dc2626',
        onSelect: () => {
          const summoned = resetCardStateForZoneChange(player.hand.splice(handIndex, 1)[0]);
          summoned.tempPowerMod += 2;
          const emptySlot = player.board.findIndex(m => m === null);
          if (emptySlot !== -1) {
            player.board[emptySlot] = summoned;
            renderGame();
          } else {
            gameState.pendingAction = { type: 'CALL_FROM_EFFECT_SELECT_SLOT', cardToPlace: summoned, onAfterPlace: null };
            setLog('🔥 สนามเต็ม — คลิกช่องเพื่อวางทับ');
            renderGame();
          }
        }
      },
      { label: 'ยกเลิก', color: '#475569', onSelect: () => renderGame() }
    ]);
    return;
  }

  if (card.futureBaseId) {
    const baseSlotIdx = player.board.findIndex(m => m !== null && m.id === card.futureBaseId);
    if (player.futureUsedThisTurn) { setLog('🚫 ใช้ความสามารถอนาคตไปแล้วในเทิร์นนี้'); return; }
    if (baseSlotIdx === -1) { setLog(`🚫 ต้องมี "${card.futureBaseName}" บนสนามเพื่อส่งไปมิติมืด`); return; }

    showChoiceModal(`🌌 สั่งใช้งานอนาคต: ${card.name}`, `ส่ง "${card.futureBaseName}" ไปมิติมืดแล้วคอลใบนี้ลงสนาม`, [
      { label: 'ยืนยัน', color: '#7c3aed', onSelect: () => executeFutureSummon(player, ai, handIndex, baseSlotIdx) },
      { label: 'ยกเลิก', color: '#475569', onSelect: () => renderGame() }
    ]);
  }
}

function executeFutureSummon(caster, opponent, handIndex, baseSlotIndex) {
  const futureCard = caster.hand.splice(handIndex, 1)[0];
  const baseUnit = caster.board[baseSlotIndex];
  if (!futureCard || !baseUnit) return;

  caster.futureUsedThisTurn = true;
  caster.darkDimension.push(resetCardStateForZoneChange(baseUnit));

  resetCardStateForZoneChange(futureCard);
  futureCard.state = 'Stand';
  futureCard.returnFromDarkDimensionId = baseUnit.id;
  caster.board[baseSlotIndex] = futureCard;

  if (futureCard.id === 'DM09') {
    futureCard.permPowerMod += 1;
    if (caster.deck.length > 0) {
      const top = caster.deck[caster.deck.length - 1];
      if ((top.type === 'NormalSpell' || top.type === 'ReactionSpell') && opponent.board.some(m => m !== null && m.state === 'Stand')) {
        opponent.board.find(m => m !== null && m.state === 'Stand').state = 'Rest';
      }
    }
  } else if (futureCard.id === 'DM11') {
    const mayaIdx = caster.graveyard.findIndex(c => c.id === 'DM03');
    if (mayaIdx !== -1) {
      const maya = resetCardStateForZoneChange(caster.graveyard.splice(mayaIdx, 1)[0]);
      maya.permPowerMod += 1;
      const slot = caster.board.findIndex(m => m === null);
      if (slot !== -1) caster.board[slot] = maya;
      else { gameState.pendingAction = { type: 'CALL_FROM_EFFECT_SELECT_SLOT', cardToPlace: maya, onAfterPlace: null }; }
    }
  } else if (futureCard.id === 'DM12' && opponent.hand.length > 0) {
    opponent.graveyard.push(resetCardStateForZoneChange(opponent.hand.pop()));
  } else if (futureCard.id === 'DM13') {
    opponent.board.forEach(m => { if (m && !m.immuneToEnemyEffectsUntilEndOfTurn) m.tempPowerMod -= 1; });
  } else if (futureCard.id === 'DM14') {
    const enemySlot = opponent.board.findIndex(m => m !== null && !m.immuneToEnemyEffectsUntilEndOfTurn);
    if (enemySlot !== -1) opponent.hand.push(resetCardStateForZoneChange(opponent.board[enemySlot]));
  }
  setLog(`🌌 ใช้ความสามารถอนาคตอัญเชิญ "${futureCard.name}" สำเร็จ!`);
  renderGame();
}

function handleNueaHandAbilityMenu(handIndex) {
  const player = gameState.player;
  const ai = gameState.ai;
  const card = player.hand[handIndex];
  if (!card) return;

  if (card.id === 'NM01') {
    const canSummonSpy = (player.deck.some(c => c.id === 'NM05') || player.graveyard.some(c => c.id === 'NM05')) && ai.board.some(m => m === null);
    showChoiceModal('🌾 ไพร่ชาวนาเหนือ', 'เลือกวิธีใช้งาน:', [
      { label: 'อัญเชิญปกติ (วางทับได้)', color: '#d97706', onSelect: () => { gameState.selectedHandIndex = handIndex; setLog('👉 เลือกไพร่ชาวนาเหนือ — คลิกช่องสนาม'); renderGame(); } },
      {
        label: 'ทิ้งลงนรก -> ส่งสายลับไปสนาม AI', disabled: !canSummonSpy, color: '#7c3aed',
        onSelect: () => {
          player.graveyard.push(resetCardStateForZoneChange(player.hand.splice(handIndex, 1)[0]));
          let spy = null;
          const g = player.graveyard.findIndex(c => c.id === 'NM05');
          if (g !== -1) spy = player.graveyard.splice(g, 1)[0];
          else {
            const d = player.deck.findIndex(c => c.id === 'NM05');
            if (d !== -1) { spy = player.deck.splice(d, 1)[0]; player.deck = shuffleDeck(player.deck); }
          }
          const empty = ai.board.findIndex(m => m === null);
          if (spy && empty !== -1) { ai.board[empty] = resetCardStateForZoneChange(spy); spy.state = 'Stand'; }
          renderGame();
        }
      },
      { label: 'ทิ้งลงนรก -> ดึงทหารขึ้นมือ', color: '#0284c7', onSelect: () => { player.graveyard.push(resetCardStateForZoneChange(player.hand.splice(handIndex, 1)[0])); openSelectSoldierFromDeckModal(player); } },
      { label: 'ยกเลิก', color: '#475569', onSelect: () => renderGame() }
    ]);
  }
}

function openSelectSoldierFromDeckModal(contestant) {
  const uniqueSoldiers = [];
  const seen = new Set();
  contestant.deck.forEach(c => { if (isSoldierCard(c) && !seen.has(c.id)) { seen.add(c.id); uniqueSoldiers.push(c); } });
  if (uniqueSoldiers.length === 0) { setLog('⚠️ ไม่พบทหารในกอง'); renderGame(); return; }

  showChoiceModal('🛡️ ดึงทหารจากกองขึ้นมือ', 'เลือกทหาร:', uniqueSoldiers.map(s => ({
    label: s.name, color: '#16a34a',
    onSelect: () => {
      const idx = contestant.deck.findIndex(c => c.id === s.id);
      if (idx !== -1) { contestant.hand.push(resetCardStateForZoneChange(contestant.deck.splice(idx, 1)[0])); contestant.deck = shuffleDeck(contestant.deck); }
      renderGame();
    }
  })));
}

function triggerRoyalGuardJutiBonus(contestant) {
  if (!contestant.board.some(m => m !== null && m.id === 'NM04')) return;
  const soldiers = [...contestant.graveyard.filter(c => isSoldierCard(c)), ...contestant.deck.filter(c => isSoldierCard(c))];
  if (soldiers.length === 0) return;

  const place = (card) => {
    resetCardStateForZoneChange(card);
    if (card.id === 'NM04') card.permPowerMod += 1;
    const slot = contestant.board.findIndex(m => m === null);
    if (slot !== -1) { contestant.board[slot] = card; renderGame(); }
    else { gameState.pendingAction = { type: 'CALL_FROM_EFFECT_SELECT_SLOT', cardToPlace: card, onAfterPlace: null }; renderGame(); }
  };

  showChoiceModal('🔥 จุติ - ทหารหลวงเหนือ', 'อัญเชิญทหารลงสนามฟรี:', soldiers.map(s => ({
    label: s.name, color: '#7c3aed',
    onSelect: () => {
      let idx = contestant.graveyard.findIndex(g => g.id === s.id);
      if (idx !== -1) { place(contestant.graveyard.splice(idx, 1)[0]); return; }
      idx = contestant.deck.findIndex(d => d.id === s.id);
      if (idx !== -1) { const c = contestant.deck.splice(idx, 1)[0]; contestant.deck = shuffleDeck(contestant.deck); place(c); }
    }
  })));
}

function activateMonsterOnBoardPlayer(slotIndex) {
  const player = gameState.player;
  const monster = player.board[slotIndex];
  if (!monster) return;

  if (monster.id === 'M02') {
    showChoiceModal('❄️ โทโดโรจิต', 'เลือกสกิล:', [
      { label: 'ทิ้งมือ -> โม่กองอีกฝ่าย', color: '#0284c7', onSelect: () => { gameState.pendingAction = { type: 'TODORO_SKILL1_DISCARD', sourceSlot: slotIndex }; renderGame(); } },
      { label: 'ดึงบาคุจิตจากนรกขึ้นมือ', color: '#16a34a', onSelect: () => { const idx = player.graveyard.findIndex(c => c.id === 'M01'); if (idx !== -1) player.hand.push(resetCardStateForZoneChange(player.graveyard.splice(idx, 1)[0])); renderGame(); } },
      { label: 'ยกเลิก', color: '#475569', onSelect: () => renderGame() }
    ]);
    return;
  }
  if (monster.id === 'M05') { triggerEndeSkill(player, slotIndex); renderGame(); return; }
  if (monster.id === 'DM01') {
    if (player.hand.length === 0) return;
    gameState.pendingAction = { type: 'ONAMI_DISCARD_HAND', sourceSlot: slotIndex };
    setLog('🌊 ทิ้งการ์ดมือ 1 ใบเพื่ออัญเชิญโรเซเลีย');
    renderGame();
    return;
  }
  if (monster.id === 'DM02' && isPartnerActive(player) && monster.state === 'Stand') {
    monster.state = 'Rest';
    drawCards(player, 1);
    setLog('🌹 โรเซเลียจั่วการ์ด 1 ใบ');
    renderGame();
    return;
  }
  setLog(`ℹ️ ${monster.name} ไม่มีสกิลกดใช้`);
}

function triggerEndeSkill(contestant, slotIndex) {
  const ende = contestant.board[slotIndex];
  if (!ende || ende.id !== 'M05') return;
  ende.tempPowerMod += 2;
  ende.destroyAtEndOfTurn = true;
  ende.usedSkills.endeBoost = true;
  contestant.board.forEach(m => { if (m && m.id === 'M06') m.permPowerMod += 2; });
}

function executeHawksSearch(contestant, slotIndex, sourceZone) {
  const hawks = contestant.board[slotIndex];
  if (!hawks) return;
  const src = sourceZone === 'deck' ? contestant.deck : contestant.graveyard;
  const idx = src.findIndex(c => c.id === 'M05');
  if (idx !== -1) {
    hawks.permPowerMod -= 2;
    contestant.hand.push(resetCardStateForZoneChange(src.splice(idx, 1)[0]));
    if (sourceZone === 'deck') contestant.deck = shuffleDeck(contestant.deck);
    renderGame();
  }
}


/* ============================================================================
   หมวดที่ 5: ระบบเวทมนตร์ (SPELL CARDS)
   ============================================================================ */
function initiatePlayerSpell(handIndex) {
  const player = gameState.player;
  const ai = gameState.ai;
  const spell = player.hand[handIndex];
  if (!spell) return;

  if (spell.type === 'NormalSpell' && player.spellQuota.normalUsed >= 1) { setLog('❌ ใช้ Normal Spell ไปแล้ว'); return; }

  if (spell.id === 'DS01') {
    const used = player.hand.splice(handIndex, 1)[0];
    player.spellQuota.normalUsed += 1;
    drawCards(player, player.graveyard.length >= 5 ? 2 : 1);
    player.graveyard.push(used);
    gameState.pendingAction = { type: 'SPELL_DS01_BUFF_TARGET' };
    setLog('✨ เบิกเนตรแห่งแสง: เลือกยูนิทเพิ่มพลัง +1');
    renderGame();
    return;
  }
  if (spell.id === 'S02') {
    player.hand.splice(handIndex, 1);
    player.spellQuota.normalUsed += 1;
    ai.board.forEach(m => { if (m && !m.immuneToEnemyEffectsUntilEndOfTurn) m.tempPowerMod -= 3; });
    renderGame();
    return;
  }
}


/* ============================================================================
   หมวดที่ 6: ระบบจัดการเทิร์น และคลิกกระดาน (รองรับวางทับ)
   ============================================================================ */
function canContestantAttack(contestant, monster) {
  if (gameState.gameOver) return { allowed: false, reason: 'จบเกมแล้ว' };
  if (!monster || monster.state !== 'Stand') return { allowed: false, reason: 'ยูนิทต้อง Stand' };
  if (contestant.isFirstPlayer && contestant.turnsTaken === 1) return { allowed: false, reason: 'ห้ามตีเทิร์น 1' };
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
  contestant.board.forEach(m => { if (m) { m.state = 'Stand'; m.usedSkills = {}; m.indestructibleUntilNextTurn = false; } });

  if (contestant.leader && contestant.leader.id === 'L02') { triggerKhunNueaStartTurn(contestant); if (onStartEffectsComplete) onStartEffectsComplete(); return; }
  triggerDoomsdayStartTurnQueue(contestant, onStartEffectsComplete);
}

function executeEndPhaseCleanup(activeContestant) {
  activeContestant.board.forEach((m, idx) => {
    if (!m) return;
    if (m.returnFromDarkDimensionId) {
      const baseId = m.returnFromDarkDimensionId;
      activeContestant.board[idx] = null;
      activeContestant.graveyard.push(resetCardStateForZoneChange(m));
      const darkIdx = activeContestant.darkDimension.findIndex(d => d.id === baseId);
      if (darkIdx !== -1) {
        const returned = resetCardStateForZoneChange(activeContestant.darkDimension.splice(darkIdx, 1)[0]);
        returned.state = 'Stand';
        activeContestant.board[idx] = returned;
      }
      return;
    }
    if (m.destroyAtEndOfTurn) destroyBoardMonster(activeContestant, idx);
  });
  [gameState.player, gameState.ai].forEach(side => side.board.forEach(m => { if (m) { m.tempPowerMod = 0; m.immuneToEnemyEffectsUntilEndOfTurn = false; } }));
}

function handleHandCardClick(handIndex) {
  if (gameState.gameOver || gameState.activeTurn !== 'player' || gameState.phase !== 'Main Phase') return;
  const player = gameState.player;
  const card = player.hand[handIndex];
  if (!card) return;

  if (gameState.pendingAction) {
    if (gameState.pendingAction.type === 'ONAMI_DISCARD_HAND') {
      player.graveyard.push(resetCardStateForZoneChange(player.hand.splice(handIndex, 1)[0]));
      let roselia = player.graveyard.findIndex(c => c.id === 'DM02') !== -1 ? player.graveyard.splice(player.graveyard.findIndex(c => c.id === 'DM02'), 1)[0] : player.deck.splice(player.deck.findIndex(c => c.id === 'DM02'), 1)[0];
      player.deck = shuffleDeck(player.deck);
      gameState.pendingAction = null;
      if (roselia) {
        resetCardStateForZoneChange(roselia);
        roselia.state = 'Stand';
        const empty = player.board.findIndex(m => m === null);
        if (empty !== -1) player.board[empty] = roselia;
        else gameState.pendingAction = { type: 'CALL_FROM_EFFECT_SELECT_SLOT', cardToPlace: roselia, onAfterPlace: null };
      }
      renderGame();
      return;
    }
  }

  if (card.type === 'Monster') {
    if (card.id === 'DM07' || card.futureBaseId) { handleDoomsdayHandMenu(handIndex); return; }
    if (card.id === 'NM01' || card.id === 'NM02' || card.id === 'NM03') { handleNueaHandAbilityMenu(handIndex); return; }
    gameState.selectedHandIndex = handIndex;
    renderGame();
    return;
  }
  initiatePlayerSpell(handIndex);
}

function handlePlayerSlotClick(slotIndex) {
  if (gameState.gameOver || gameState.activeTurn !== 'player') return;
  const player = gameState.player;
  if (slotIndex === 'leader') { activateLeaderSkillPlayer(); return; }

  const slotMonster = player.board[slotIndex];

  if (gameState.pendingAction) {
    const action = gameState.pendingAction;
    if (action.type === 'CALL_FROM_EFFECT_SELECT_SLOT') {
      if (slotMonster !== null) sendOverwrittenMonsterToGrave(player, slotIndex);
      player.board[slotIndex] = action.cardToPlace;
      gameState.pendingAction = null;
      renderGame();
      if (action.onAfterPlace) action.onAfterPlace();
      return;
    }
    if (action.type === 'SPELL_DS01_BUFF_TARGET' && slotMonster) {
      slotMonster.tempPowerMod += 1;
      gameState.pendingAction = null;
      renderGame();
      return;
    }
  }

  // ⭐ อัญเชิญลงสนาม หรือ วางทับช่องเดิม
  if (gameState.phase === 'Main Phase' && gameState.selectedHandIndex !== null) {
    if (player.board[slotIndex] !== null) sendOverwrittenMonsterToGrave(player, slotIndex);
    player.board[slotIndex] = resetCardStateForZoneChange(player.hand.splice(gameState.selectedHandIndex, 1)[0]);
    player.board[slotIndex].state = 'Stand';
    gameState.selectedHandIndex = null;
    renderGame();
    return;
  }

  if (gameState.phase === 'Main Phase' && slotMonster) activateMonsterOnBoardPlayer(slotIndex);
  if (gameState.phase === 'Battle Phase' && slotMonster) {
    gameState.selectedAttackerSlot = (gameState.selectedAttackerSlot === slotIndex) ? null : slotIndex;
    renderGame();
  }
}

function handleAISlotClick(aiSlotIndex) {
  if (gameState.gameOver || gameState.activeTurn !== 'player' || gameState.phase !== 'Battle Phase' || gameState.selectedAttackerSlot === null) return;
  executeAttack(gameState.player, gameState.ai, gameState.selectedAttackerSlot, 'monster', aiSlotIndex);
}

document.getElementById('ai-leader-box').addEventListener('click', () => {
  if (gameState.gameOver || gameState.activeTurn !== 'player' || gameState.phase !== 'Battle Phase' || gameState.selectedAttackerSlot === null) return;
  executeAttack(gameState.player, gameState.ai, gameState.selectedAttackerSlot, 'leader', null);
});


/* ============================================================================
   หมวดที่ 7: ระบบการต่อสู้และ Intercept
   ============================================================================ */
function executeAttack(attacker, defender, attackerSlot, targetType, targetSlot, onCompleteCallback = null) {
  const attackingMonster = attacker.board[attackerSlot];
  if (!canContestantAttack(attacker, attackingMonster).allowed) return;

  attackingMonster.state = 'Rest';
  attacker.attacksThisTurn += 1;
  gameState.selectedAttackerSlot = null;

  if (targetType === 'monster') {
    compareAndDestroyMonsters(attacker, attackerSlot, defender, targetSlot);
    renderGame();
    checkGameOver();
    if (onCompleteCallback) onCompleteCallback();
  } else {
    defender.leader.hp = Math.max(0, defender.leader.hp - 1);
    renderGame();
    checkGameOver();
    if (onCompleteCallback) onCompleteCallback();
  }
}

function compareAndDestroyMonsters(contestantA, slotA, contestantB, slotB) {
  const mA = contestantA.board[slotA], mB = contestantB.board[slotB];
  if (!mA || !mB) return;
  const pA = getEffectivePower(mA, contestantA), pB = getEffectivePower(mB, contestantB);

  if (pA > pB) destroyBoardMonster(contestantB, slotB, true, false);
  else if (pA < pB) destroyBoardMonster(contestantA, slotA, true, false);
  else { destroyBoardMonster(contestantA, slotA, true, false); destroyBoardMonster(contestantB, slotB, true, false); }
}


/* ============================================================================
   หมวดที่ 8: ระบบ AI และปุ่มเปลี่ยนเฟส
   ============================================================================ */
document.getElementById('btn-next-phase').addEventListener('click', () => {
  if (gameState.activeTurn !== 'player' || gameState.phase !== 'Main Phase') return;
  gameState.phase = 'Battle Phase';
  gameState.selectedHandIndex = null;
  document.getElementById('btn-next-phase').disabled = true;
  renderGame();
});

document.getElementById('btn-end-turn').addEventListener('click', () => {
  if (gameState.activeTurn !== 'player' || gameState.gameOver) return;
  executeEndPhaseCleanup(gameState.player);
  gameState.phase = 'End Phase';
  disableControls();
  renderGame();
  setTimeout(startAITurn, 650);
});

function startAITurn() {
  if (gameState.gameOver) return;
  gameState.activeTurn = 'ai';
  gameState.turnCount += 1;
  gameState.phase = 'Start Phase';
  executeStartPhase(gameState.ai, () => {
    renderGame();
    setTimeout(() => {
      gameState.phase = 'Main Phase';
      aiPlayMainPhase(() => {
        setTimeout(() => { gameState.phase = 'Battle Phase'; renderGame(); aiPlayBattlePhase(0); }, 800);
      });
    }, 800);
  });
}

function aiPlayMainPhase(onMainComplete) {
  const ai = gameState.ai;
  for (let slot = 0; slot < 3; slot++) {
    if (ai.board[slot] === null && ai.hand.length > 0) {
      ai.board[slot] = resetCardStateForZoneChange(ai.hand.pop());
      ai.board[slot].state = 'Stand';
    }
  }
  renderGame();
  onMainComplete();
}

function aiPlayBattlePhase(slotIndex) {
  if (gameState.gameOver) return;
  if (slotIndex >= 3) { setTimeout(endAITurn, 700); return; }
  const ai = gameState.ai, player = gameState.player;
  const m = ai.board[slotIndex];
  if (!canContestantAttack(ai, m).allowed) { aiPlayBattlePhase(slotIndex + 1); return; }

  const target = player.board.findIndex(slot => slot !== null);
  if (target !== -1) executeAttack(ai, player, slotIndex, 'monster', target, () => setTimeout(() => aiPlayBattlePhase(slotIndex + 1), 850));
  else executeAttack(ai, player, slotIndex, 'leader', null, () => setTimeout(() => aiPlayBattlePhase(slotIndex + 1), 850));
}

function endAITurn() {
  if (gameState.gameOver) return;
  executeEndPhaseCleanup(gameState.ai);
  gameState.phase = 'End Phase';
  renderGame();
  setTimeout(() => { gameState.activeTurn = 'player'; gameState.turnCount += 1; startPlayerTurn(); }, 600);
}


/* ============================================================================
   หมวดที่ 9: ระบบ Tooltip และวาดหน้าจอ (RENDER UI)
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
  let statsHtml = card.type === 'Monster' ? `<div class="tooltip-stats">⚔️ พลัง: ${getEffectivePower(card, ownerContestant)}</div>` : '';
  tooltip.innerHTML = `<div class="tooltip-header"><span class="tooltip-name">${card.name}</span><span>${card.type}</span></div>${statsHtml}<div class="tooltip-desc">${card.desc || ''}</div>`;
  tooltip.style.display = 'block';
  moveCardTooltip(event);
}

function moveCardTooltip(event) {
  const tooltip = document.getElementById('card-hover-tooltip');
  if (!tooltip || tooltip.style.display === 'none') return;
  tooltip.style.left = `${Math.min(event.clientX + 15, window.innerWidth - 280)}px`;
  tooltip.style.top = `${Math.min(event.clientY + 15, window.innerHeight - 150)}px`;
}

function hideCardTooltip() {
  const tooltip = document.getElementById('card-hover-tooltip');
  if (tooltip) tooltip.style.display = 'none';
}

function attachCardTooltipEvents(element, card, ownerContestant = null) {
  element.addEventListener('mouseenter', (e) => showCardTooltip(e, card, ownerContestant));
  element.addEventListener('mousemove', (e) => moveCardTooltip(e));
  element.addEventListener('mouseleave', () => hideCardTooltip());
}

function createCardElement(card, ownerContestant = null) {
  const div = document.createElement('div');
  div.className = `card ${card.type} ${card.state || ''}`;
  div.innerHTML = `<div><span class="card-type">${card.type}</span><div class="card-art"><img src="${card.image}"></div><div class="card-name">${card.name}</div></div>${card.type === 'Monster' ? `<div class="card-power">⚔️ ${getEffectivePower(card, ownerContestant)}</div>` : ''}`;
  attachCardTooltipEvents(div, card, ownerContestant);
  return div;
}

function renderBoardSlots(containerId, contestant, isPlayerBoard) {
  const container = document.getElementById(containerId);
  const slots = container.querySelectorAll('.slot');
  slots.forEach((slotEl, idx) => {
    slotEl.innerHTML = '';
    slotEl.classList.remove('valid-target', 'attack-target');
    const monster = contestant.board[idx];
    if (monster) {
      const cardEl = createCardElement(monster, contestant);
      if (isPlayerBoard && gameState.selectedAttackerSlot === idx) cardEl.classList.add('selected-attacker');
      slotEl.appendChild(cardEl);
    } else {
      slotEl.textContent = `ช่อง ${idx + 1}`;
    }
    slotEl.onclick = () => isPlayerBoard ? handlePlayerSlotClick(idx) : handleAISlotClick(idx);
  });
}

function renderGame() {
  const { player, ai } = gameState;
  if (!player || !ai) return;

  ensureZoneUIAndViewers();
  document.getElementById('ai-leader-name').textContent = ai.leader.name;
  document.getElementById('ai-leader-hp').textContent = ai.leader.hp;
  document.getElementById('ai-leader-img').src = ai.leader.image;
  document.getElementById('ai-deck-count').textContent = ai.deck.length;
  document.getElementById('ai-grave-count').textContent = ai.graveyard.length;
  document.getElementById('ai-hand-count').textContent = ai.hand.length;
  const aiDarkCount = document.getElementById('ai-dark-count');
  if (aiDarkCount) aiDarkCount.textContent = ai.darkDimension.length;

  document.getElementById('player-leader-name').textContent = player.leader.name;
  document.getElementById('player-leader-hp').textContent = player.leader.hp;
  document.getElementById('player-leader-img').src = player.leader.image;
  document.getElementById('player-deck-count').textContent = player.deck.length;
  document.getElementById('player-grave-count').textContent = player.graveyard.length;
  const playerDarkCount = document.getElementById('player-dark-count');
  if (playerDarkCount) playerDarkCount.textContent = player.darkDimension.length;

  document.getElementById('turn-indicator').textContent = `Turn ${gameState.turnCount} (${gameState.activeTurn === 'player' ? 'ตาของคุณ' : 'ตาของ AI'})`;
  document.getElementById('phase-indicator').textContent = gameState.phase;

  renderBoardSlots('ai-board', ai, false);
  renderBoardSlots('player-board', player, true);

  const handContainer = document.getElementById('player-hand');
  handContainer.innerHTML = '';
  player.hand.forEach((card, idx) => {
    const cardEl = createCardElement(card, player);
    if (gameState.selectedHandIndex === idx) cardEl.classList.add('selected-hand');
    cardEl.addEventListener('click', () => handleHandCardClick(idx));
    handContainer.appendChild(cardEl);
  });
}

function renderMulliganModal() {
  const listEl = document.getElementById('mulligan-card-list');
  listEl.innerHTML = '';
  gameState.player.hand.forEach((card, index) => {
    const cardEl = createCardElement(card, gameState.player);
    if (gameState.mulliganSelected.includes(index)) cardEl.classList.add('selected-mulligan');
    cardEl.addEventListener('click', () => {
      const pos = gameState.mulliganSelected.indexOf(index);
      if (pos !== -1) gameState.mulliganSelected.splice(pos, 1);
      else if (gameState.mulliganSelected.length < 2) gameState.mulliganSelected.push(index);
      renderMulliganModal();
    });
    listEl.appendChild(cardEl);
  });
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
  document.getElementById('btn-next-phase').disabled = false;
  document.getElementById('btn-end-turn').disabled = false;
  executeStartPhase(gameState.player, () => { setLog(`🟢 เทิร์นของคุณ (${gameState.player.turnsTaken})`); renderGame(); });
}


/* ============================================================================
   หมวดที่ 10: ระบบหน้าต่างจัดเด็ค (Deck Builder)
   ============================================================================ */
let currentDeckConfig = loadSavedDeck();

function loadSavedDeck() {
  try {
    const saved = localStorage.getItem('my_card_game_deck');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.leaderId && Array.isArray(parsed.mainDeck) && parsed.mainDeck.length === 20) return parsed;
    }
  } catch (e) {}
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

  CARD_DATABASE.filter(c => c.type === 'Leader').forEach(leader => {
    const item = document.createElement('div');
    item.className = 'pool-item';
    const cardEl = document.createElement('div');
    cardEl.className = `card Leader ${currentDeckConfig.leaderId === leader.id ? 'selected-leader' : ''}`;
    cardEl.innerHTML = `<div><span class="card-type">LEADER</span><div class="card-art"><img src="${leader.image}"></div><div class="card-name">${leader.name}</div></div>`;
    attachCardTooltipEvents(cardEl, leader, null);
    cardEl.addEventListener('click', () => { currentDeckConfig.leaderId = leader.id; renderDeckBuilder(); });
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
        if (currentDeckConfig.mainDeck.length >= 20) { alert('เด็คครบ 20 ใบแล้ว'); return; }
        currentDeckConfig.mainDeck.push(card.id);
      } else {
        currentDeckConfig.mainDeck = currentDeckConfig.mainDeck.filter(id => id !== card.id);
      }
      renderDeckBuilder();
    });

    const badge = document.createElement('div');
    badge.className = `count-badge ${countInDeck === maxAllowed ? 'maxed' : ''}`;
    badge.textContent = `${countInDeck} / ${maxAllowed}`;
    item.appendChild(cardEl);
    item.appendChild(badge);
    mainContainer.appendChild(item);
  });

  const count = currentDeckConfig.mainDeck.length;
  document.getElementById('deck-status-text').textContent = `Main Deck: ${count}/20 ใบ`;
  document.getElementById('btn-save-start').disabled = (count !== 20);
}

document.getElementById('btn-open-deck').addEventListener('click', openDeckBuilder);
document.getElementById('btn-reset-deck').addEventListener('click', () => { currentDeckConfig.mainDeck = []; renderDeckBuilder(); });

document.getElementById('btn-default-deck').addEventListener('click', () => {
  showChoiceModal('🃏 เลือกเด็คมาตรฐาน', 'เลือกเด็คที่ต้องการโหลด:', [
    { label: 'เด็คจิต', color: '#0284c7', onSelect: () => { currentDeckConfig.leaderId = 'L01'; currentDeckConfig.mainDeck = [...DEFAULT_DECK_LIST]; renderDeckBuilder(); } },
    { label: 'เด็คเหนือ', color: '#16a34a', onSelect: () => { currentDeckConfig.leaderId = 'L02'; currentDeckConfig.mainDeck = [...DEFAULT_NUEA_DECK_LIST]; renderDeckBuilder(); } },
    { label: 'เด็ควันสิ้นโลก', color: '#7c3aed', onSelect: () => { currentDeckConfig.leaderId = 'L03'; currentDeckConfig.mainDeck = [...DEFAULT_DOOMSDAY_DECK_LIST]; renderDeckBuilder(); } }
  ]);
});

document.getElementById('btn-save-start').addEventListener('click', () => {
  if (currentDeckConfig.mainDeck.length !== 20) return;
  localStorage.setItem('my_card_game_deck', JSON.stringify(currentDeckConfig));
  document.getElementById('deck-builder-modal').style.display = 'none';
  initGame();
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
  setLog('🎲 เริ่มเกมใหม่! เลือกเปลี่ยนการ์ด Mulligan สูงสุด 2 ใบ');
  renderGame();
  renderMulliganModal();
}

initGame();


/* ============================================================================
   หมวดที่ 11: ระบบล็อบบี้ และระบบดวลกับเพื่อนออนไลน์ (PeerJS PvP)
   ============================================================================ */
const pvpState = { isMultiplayer: false, role: null, peer: null, conn: null, roomCode: null, localMulliganDone: false, remoteMulliganDone: false, isApplyingRemote: false };

function sendPvpPacket(packet) { if (pvpState.isMultiplayer && pvpState.conn && pvpState.conn.open) pvpState.conn.send(packet); }

function syncBoardToOpponent(latestLogMessage = null) {
  if (!pvpState.isMultiplayer || !pvpState.conn || !pvpState.conn.open || pvpState.isApplyingRemote) return;
  sendPvpPacket({
    type: 'SYNC_BOARD', turnCount: gameState.turnCount, activeTurnOnReceiver: gameState.activeTurn === 'player' ? 'ai' : 'player',
    phase: gameState.phase, gameOver: gameState.gameOver, senderData: gameState.player, receiverData: gameState.ai, logMessage: latestLogMessage
  });
}

const _originalRenderGame = renderGame;
renderGame = function () {
  _originalRenderGame();
  if (pvpState.isMultiplayer && !pvpState.isApplyingRemote && pvpState.localMulliganDone && pvpState.remoteMulliganDone) syncBoardToOpponent();
};

const _originalSetLog = setLog;
setLog = function (message) {
  _originalSetLog(message);
  if (pvpState.isMultiplayer && !pvpState.isApplyingRemote) {
    sendPvpPacket({ type: 'LOG_ONLY', message: message.replace('ของคุณ', 'ของฝ่ายตรงข้าม').replace('คุณ', 'ฝ่ายตรงข้าม') });
  }
};

function bindMultiplayerButtons() {
  const oldEndBtn = document.getElementById('btn-end-turn');
  if (oldEndBtn) {
    const newEndBtn = oldEndBtn.cloneNode(true);
    oldEndBtn.parentNode.replaceChild(newEndBtn, oldEndBtn);
    newEndBtn.addEventListener('click', () => {
      if (gameState.activeTurn !== 'player' || gameState.gameOver || gameState.isRollingDice || gameState.pendingAction) return;
      executeEndPhaseCleanup(gameState.player);
      gameState.phase = 'End Phase';
      disableControls();
      if (pvpState.isMultiplayer) {
        gameState.activeTurn = 'ai';
        _originalSetLog('⏭️ จบเทิร์น — ส่งเทิร์นให้เพื่อน');
        _originalRenderGame();
        sendPvpPacket({ type: 'PASS_TURN', nextTurnCount: gameState.turnCount + 1, senderData: gameState.player, receiverData: gameState.ai });
        return;
      }
      _originalRenderGame();
      setTimeout(startAITurn, 650);
    });
  }

  const confirmMulliganBtn = document.getElementById('btn-confirm-mulligan');
  if (confirmMulliganBtn) {
    const newMulliganBtn = confirmMulliganBtn.cloneNode(true);
    confirmMulliganBtn.parentNode.replaceChild(newMulliganBtn, confirmMulliganBtn);
    newMulliganBtn.addEventListener('click', () => {
      performMulligan(gameState.player, gameState.mulliganSelected);
      document.getElementById('mulligan-modal').style.display = 'none';
      if (!pvpState.isMultiplayer) { startPlayerTurn(); return; }
      pvpState.localMulliganDone = true;
      sendPvpPacket({ type: 'MULLIGAN_READY', playerData: gameState.player });
      checkBothPlayersMulliganReady();
    });
  }
}

function checkBothPlayersMulliganReady() {
  if (!pvpState.localMulliganDone) return;
  if (!pvpState.remoteMulliganDone) { disableControls(); _originalSetLog('⏳ รอเพื่อนเลือกการ์ด Mulligan...'); _originalRenderGame(); return; }
  if (pvpState.role === 'host') { gameState.activeTurn = 'player'; startPlayerTurn(); syncBoardToOpponent('🎲 พร้อมแล้ว! เจ้าของห้องเริ่มเทิร์นที่ 1'); }
  else { gameState.activeTurn = 'ai'; disableControls(); _originalSetLog('🎲 พร้อมแล้ว! รอเจ้าของห้องเล่นเทิร์น 1'); _originalRenderGame(); }
}

function handleIncomingPvpData(data) {
  if (!data || !data.type) return;
  pvpState.isApplyingRemote = true;
  try {
    if (data.type === 'START_PVP_MATCH') startPvpMatchBoard(pvpState.role);
    else if (data.type === 'MULLIGAN_READY') { pvpState.remoteMulliganDone = true; gameState.ai = data.playerData; _originalRenderGame(); checkBothPlayersMulliganReady(); }
    else if (data.type === 'SYNC_BOARD') {
      gameState.turnCount = data.turnCount; gameState.activeTurn = data.activeTurnOnReceiver; gameState.phase = data.phase; gameState.gameOver = data.gameOver;
      gameState.ai = data.senderData; gameState.player = data.receiverData;
      if (data.logMessage) _originalSetLog(data.logMessage);
      _originalRenderGame(); checkGameOver();
    }
    else if (data.type === 'PASS_TURN') {
      gameState.turnCount = data.nextTurnCount; gameState.ai = data.senderData; gameState.player = data.receiverData;
      gameState.activeTurn = 'player'; _originalSetLog('🟢 ตาของคุณ!'); startPlayerTurn(); syncBoardToOpponent();
    }
    else if (data.type === 'LOG_ONLY') _originalSetLog(`🌐 [เพื่อน] ${data.message}`);
  } finally { pvpState.isApplyingRemote = false; }
}

function startPvpMatchBoard(role) {
  document.getElementById('lobby-screen').style.display = 'none';
  document.getElementById('pvp-room-modal').style.display = 'none';
  document.querySelector('.game-container').style.display = 'flex';

  pvpState.isMultiplayer = true; pvpState.role = role; pvpState.localMulliganDone = false; pvpState.remoteMulliganDone = false;
  gameState.turnCount = 1; gameState.activeTurn = (role === 'host') ? 'player' : 'ai'; gameState.phase = 'Mulligan'; gameState.gameOver = false;
  const scrollbox = document.getElementById('action-log-scrollbox');
  if (scrollbox) scrollbox.innerHTML = '';

  const isFirst = (role === 'host');
  gameState.player = createContestant('Player', isFirst, isFirst ? 'P1' : 'P2', currentDeckConfig.leaderId, currentDeckConfig.mainDeck);
  gameState.ai = createContestant('เพื่อนของคุณ', !isFirst, isFirst ? 'P2' : 'P1', 'L01', DEFAULT_DECK_LIST);
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
  const lobbyScreen = document.getElementById('lobby-screen'), gameBoard = document.querySelector('.game-container'), mull = document.getElementById('mulligan-modal');
  if (!lobbyScreen || !gameBoard) return;

  gameBoard.style.display = 'none';
  if (mull) mull.style.display = 'none';

  const centerBtnGroup = document.getElementById('btn-open-deck')?.parentElement;
  if (centerBtnGroup && !document.getElementById('btn-back-lobby')) {
    const backBtn = document.createElement('button');
    backBtn.id = 'btn-back-lobby'; backBtn.className = 'btn'; backBtn.style.background = '#475569'; backBtn.style.marginLeft = '4px'; backBtn.textContent = '🏠 ล็อบบี้';
    backBtn.onclick = () => { if (pvpState.peer) pvpState.peer.destroy(); pvpState.isMultiplayer = false; gameBoard.style.display = 'none'; lobbyScreen.style.display = 'flex'; };
    centerBtnGroup.appendChild(backBtn);
  }

  document.getElementById('btn-lobby-bot')?.addEventListener('click', () => { pvpState.isMultiplayer = false; lobbyScreen.style.display = 'none'; gameBoard.style.display = 'flex'; initGame(); });
  document.getElementById('btn-lobby-pvp')?.addEventListener('click', () => { document.getElementById('pvp-room-modal').style.display = 'flex'; });
  document.getElementById('btn-close-pvp-modal')?.addEventListener('click', () => { document.getElementById('pvp-room-modal').style.display = 'none'; });
  document.getElementById('btn-create-room')?.addEventListener('click', createPvpRoomAsHost);
  document.getElementById('btn-join-room')?.addEventListener('click', () => joinPvpRoomAsGuest(document.getElementById('input-join-code').value));

  const openDeckFn = (e) => { if (e) e.preventDefault(); openDeckBuilder(); };
  const openCardsFn = (e) => { if (e) e.preventDefault(); openZoneViewerModal('🔍 คลังการ์ดทั้งหมด', CARD_DATABASE, null); };

  document.getElementById('card-menu-deckbuilder')?.addEventListener('click', openDeckFn);
  document.getElementById('nav-deck')?.addEventListener('click', openDeckFn);
  document.getElementById('card-menu-cardlist')?.addEventListener('click', openCardsFn);
  document.getElementById('nav-cards')?.addEventListener('click', openCardsFn);
  document.getElementById('nav-play')?.addEventListener('click', (e) => { e.preventDefault(); document.getElementById('pvp-room-modal').style.display = 'flex'; });
  document.getElementById('card-menu-preset')?.addEventListener('click', () => { openDeckBuilder(); document.getElementById('btn-default-deck').click(); });
}

setupLobbyEvents();
