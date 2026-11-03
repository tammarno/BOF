CARD_DATABASE.push(
  // ==================== LEADER (ทั้ง 4 เด็ค) ====================
  {
    id: 'L01',
    name: 'มายฮีโร่ เดจิต',
    type: 'Leader',
    rarity: 'SSR', // ระดับความหายาก: N / R / SR / SSR
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
    rarity: 'SSR', // ระดับความหายาก: N / R / SR / SSR
    maxHp: 6,
    image: 'images/เด็คเหนือ/1.png',
    ability: 'LEADER_KHUN_NUEA',
    desc: 'ออโต้: เมื่อเข้าเทิร์น นำ "ไพร่ชาวนาเหนือ" จากกองหรือนรกไม่เกิน 1 ใบขึ้นมือ\nต่อเนื่อง: ถ้ามีการ์ดที่มีคำว่า "เหนือ" 3 ใบบนสนาม การ์ดที่มีคำว่า "เหนือ" ทุกใบบนสนามเราพลังโจมตี +1',
    effects: [
      {
        id: 'leader_l02_aura',
        trigger: 'CONTINUOUS_BOARD_AURA',
        condition: { type: 'MIN_NAME_COUNT', nameKeyword: 'เหนือ', count: 3 },
        targetNameKeyword: 'เหนือ',
        amount: 1
      }
    ]
  },
  {
    id: 'L03',
    name: 'วันสิ้นโลก',
    type: 'Leader',
    rarity: 'SSR', // ระดับความหายาก: N / R / SR / SSR
    maxHp: 6,
    image: 'images/วันสิ้นโลก/1.png',
    ability: 'LEADER_DOOMSDAY',
    desc: 'ออโต้: เมื่อเข้าเทิร์น คอลการ์ดยูนิตจากนรก 1 ใบลงสนาม โดยที่พลังโจมตีพื้นฐานต้องไม่เกิน 2'
  },
  {
    id: 'L04',
    name: 'ศูนย์วิจัยไดโน',
    type: 'Leader',
    rarity: 'SSR', // ระดับความหายาก: N / R / SR / SSR
    maxHp: 6,
    image: 'images/ไดโน/1.png',
    ability: 'LEADER_DINO_LAB',
    desc: 'สั่งใช้งาน/1 เทิร์น: เลือกการ์ดยูนิทเผ่า ไดโน จากนรก 1 ใบ นำใบนั้นขึ้นมือ',
    effects: [
      {
        id: 'leader_l04_recover',
        trigger: 'ACTIVATE_LEADER',
        oncePerTurn: true,
        steps: [
          { block: 'RECOVER_FROM_GRAVE', filterTribe: 'ไดโน', filterType: 'MONSTER', count: 1 }
        ]
      }
    ]
  },
  {
    id: 'L05',
    name: 'ปีศาจ',
    type: 'Leader',
    rarity: 'SSR',
    maxHp: 6,
    image: 'images/เด็คปีศาจ/1.png',
    ability: 'LEADER_DEMON',
    desc: 'ออโต้: เมื่อเริ่มเกม นำการ์ด "ดินแดนปีศาจ" 1 ใบในกองไปที่มิติมืด จากนั้นจั่วการ์ด 2 ใบ และสับกอง'
  },
  {
    id: 'L06',
    name: 'ไอโอ๊ตบ้าทุกสิ่ง',
    type: 'Leader',
    rarity: 'SSR',
    maxHp: 6,
    image: 'images/เด็คโอ๊ต/1.png',
    ability: 'LEADER_OAT',
    desc: 'ออโต้: เมื่อเข้าเทิร์น เปิดการ์ด 2 ใบบนสุดของกอง เลือกการ์ดเวทมนตร์ไม่เกิน 1 ใบจากในนั้นนำขึ้นมือ แล้วนำการ์ดที่เหลือเรียงไว้บนหรือล่างกองการ์ด'
  }
);
