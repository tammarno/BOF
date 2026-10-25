# วิธีเพิ่ม/แก้การ์ด (สูตรสำหรับคนและ Claude)

การ์ดทั้งหมดเป็นข้อมูลล้วนในไฟล์ `js/cards/*.js` แยกตามเด็ค: `jit.js` (เด็คจิต), `nuea.js` (เด็คเหนือ), `doom.js` (วันสิ้นโลก), `leaders.js` (ลีดเดอร์) ส่วน `core.js` ประกาศ `CARD_DATABASE` / `DECK_LISTS` และ `schema.js` คือรายชื่อ trigger / cost / บล็อก ที่ระบบรู้จัก พร้อมตัวตรวจข้อมูล

## ตัวตรวจ: อ่านก่อน

- **ทุกคน:** เปิดเกม ถ้าข้อมูลการ์ดผิด จะมี **แถบเตือนสีเหลือง** ขึ้นบนหน้าจอ บอกไอดีการ์ด ตำแหน่ง และสิ่งที่ผิด (ถ้าพิมพ์ชื่อผิดจะบอกชื่อที่ใกล้เคียงให้) เพื่อนที่ไม่มีโฟลเดอร์ `tools` ให้ใช้แถบนี้เป็นตัวตรวจ ไม่มีแถบ = ข้อมูลผ่าน
- **เฉพาะคนที่มีโฟลเดอร์ tools ในเครื่อง:** รัน `node tools/check-cards.js` จะพิมพ์ปัญหาทีละบรรทัดและจบด้วย `พบปัญหา 0 ข้อ` (ออกรหัส 1 ถ้ามีปัญหา) นอกจากนี้ยังตรวจว่าไฟล์ภาพและภาพย่อมีอยู่จริง
- **ลองการ์ดใหม่โดยยังไม่แก้ไฟล์ (เฉพาะคนที่มีโฟลเดอร์ tools ในเครื่อง):** `node tools/check-cards.js --extra '{"id":"NEW01", ...}'` ใส่การ์ดเดียว (วัตถุ) หรือหลายใบ (อาร์เรย์) เป็น JSON เพื่อให้ตัวตรวจนับรวมไปด้วยโดยไม่ต้องแก้ไฟล์การ์ดจริง (ใน JSON ต้องใส่เครื่องหมายคำพูดคู่ให้คีย์ทุกตัว)

## 1. ขั้นตอนเพิ่มการ์ด 4 ข้อ

1. **วางรูป png เลขถัดไป** ในโฟลเดอร์เด็คนั้น เช่น `images/เด็คจิต/` ถ้าเลขสูงสุดตอนนี้คือ 11 ให้ใช้ `12.png` (ดูข้อ 6 เรื่องภาพ)
2. **วางข้อมูลการ์ดในไฟล์เด็ค** ใส่อ็อบเจ็กต์การ์ดต่อท้ายใน `CARD_DATABASE.push(...)` ของไฟล์เด็คนั้น (ก๊อปจากแม่แบบข้อ 2 แล้วแก้ id / name / image / ตัวเลข) id ต้องไม่ซ้ำกับการ์ดอื่น การ์ดใหม่จะ**ขึ้นในคลังการ์ดและหน้าสร้างเด็คเองอัตโนมัติ** (รายการให้เลือกรวมการ์ดทุกใบที่ไม่ใช่ลีดเดอร์)
3. **(ถ้าต้องการ) ใส่เข้าเด็ค** เด็คมาตรฐานใน `DECK_LISTS` **ตายตัว 20 ใบ** การ์ดใหม่จะเข้าเด็คมาตรฐานได้ก็ต่อเมื่อ **แทนที่ id เดิม** ในอาร์เรย์ `DECK_LISTS.Lxx` ของเด็คนั้น (ท้ายไฟล์เด็ค เช่น `DECK_LISTS.L01 = [...]`) ให้จำนวนยังเป็น 20 พอดี และแต่ละ id ได้ไม่เกิน 2 ใบ (เว้นแต่การ์ดนั้นมี `maxCopies`) ถ้า**เพิ่มโดยไม่แทนที่** แถบเตือนจะแจ้งว่าเด็คมี 21 ใบ
4. **เปิดเกมดูแถบเตือน** (หรือรัน `node tools/check-cards.js` ถ้ามีโฟลเดอร์ tools) ต้องไม่มีแถบเหลือง / ต้องได้ `พบปัญหา 0 ข้อ`

## 2. แม่แบบสำเร็จรูป

ทุกแม่แบบด้านล่างผ่านตัวตรวจแล้วจริง (ใช้ภาพที่มีอยู่แล้ว) ก๊อปไปแก้ได้เลย ใส่ต่อท้ายใน `CARD_DATABASE.push(...)` โดยคั่นด้วยจุลภาค ค่า `rarity` ที่ใช้ได้: `N` / `R` / `SR` / `Legend`

**มอนสเตอร์ธรรมดา (ไม่มีสกิล)**

```js
{
  id: 'NEW01',
  name: 'ชื่อการ์ด',
  type: 'Monster',
  rarity: 'N',
  power: 2,
  image: 'images/เด็คจิต/11.png',
  desc: 'ไม่มีสกิล'
}
```

**มอนสเตอร์ลงสนามแล้วทำสกิล (`ON_SUMMON`)**

```js
{
  id: 'NEW02',
  name: 'ชื่อการ์ด',
  type: 'Monster',
  rarity: 'R',
  power: 2,
  image: 'images/เด็คจิต/11.png',
  desc: 'ออโต้: เมื่อลงสนาม เลือกทำลายยูนิทอีกฝ่าย 1 ใบ',
  effects: [
    {
      id: 'new02_on_summon',
      trigger: 'ON_SUMMON',
      steps: [
        { block: 'DESTROY_UNIT', target: 'OPPONENT', count: 1, select: 'CHOOSE' }
      ]
    }
  ]
}
```

**มอนสเตอร์สั่งใช้งานมี cost (`ACTIVATE_MAIN` + `costs`)**

```js
{
  id: 'NEW03',
  name: 'ชื่อการ์ด',
  type: 'Monster',
  rarity: 'R',
  power: 1,
  image: 'images/เด็คจิต/11.png',
  desc: 'สั่งใช้งาน1/เทิร์น: ทิ้งมือ 1 ใบ โม่กองอีกฝ่าย 1 ใบ',
  effects: [
    {
      id: 'new03_main',
      label: 'ทิ้งมือ 1 ใบ -> โม่กองอีกฝ่าย 1 ใบ',
      trigger: 'ACTIVATE_MAIN',
      oncePerTurn: true,
      costs: [{ type: 'DISCARD_HAND', count: 1 }],
      steps: [{ block: 'MILL_DECK', side: 'OPPONENT', count: 1 }]
    }
  ]
}
```

**เวทปกติ (`CAST_SPELL`) มี cost + หลายบล็อก**

```js
{
  id: 'NEW04',
  name: 'ชื่อเวท',
  type: 'NormalSpell',
  rarity: 'R',
  image: 'images/เด็คจิต/11.png',
  desc: 'ทิ้งการ์ดบนมือ 1 ใบ ทำลายยูนิทอีกฝ่าย 1 ใบ แล้วจั่ว 1 ใบ',
  effects: [
    {
      id: 'new04_spell',
      trigger: 'CAST_SPELL',
      costs: [{ type: 'DISCARD_HAND', count: 1 }],
      steps: [
        { block: 'DESTROY_UNIT', target: 'OPPONENT', count: 1, select: 'CHOOSE' },
        { block: 'DRAW', side: 'SELF', count: 1 }
      ]
    }
  ]
}
```

**สกิลต่อเนื่อง (`CONTINUOUS_POWER`)** พลังเพิ่มเองเมื่อเงื่อนไขเป็นจริง

```js
{
  id: 'NEW05',
  name: 'ชื่อการ์ด',
  type: 'Monster',
  rarity: 'R',
  power: 2,
  image: 'images/เด็คจิต/11.png',
  desc: 'ต่อเนื่อง: ถ้ามีการ์ด M02 บนสนามเรา พลัง +1',
  effects: [
    {
      id: 'new05_continuous',
      trigger: 'CONTINUOUS_POWER',
      condition: { type: 'ALLY_ON_BOARD', cardId: 'M02' },
      amount: 1
    }
  ]
}
```

**เรื่อง `desc`:** ถ้าไม่ใส่ `desc` เกมจะสร้างข้อความอธิบายอัตโนมัติจาก `effects` (ฟังก์ชัน `generateStepText` ใน `js/game.js`) แต่ถ้าละค่า optional เช่น `amount` / `count` ข้อความอัตโนมัติบางแบบอาจแสดงคำว่า `undefined` ดังนั้น **ใส่ตัวเลขให้ครบทุกครั้ง** และควรเขียน `desc` เองเมื่อสกิลซับซ้อน

## 3. ตารางบล็อก / trigger / cost / condition ที่ใช้ได้

ตารางนี้สร้างจาก `CARD_SCHEMA` ใน `js/cards/schema.js` ห้ามแก้มือ (ดูข้อ 5 ว่ารีเจนเนอเรตอย่างไร) คอลัมน์ required = ต้องใส่, optional = ใส่หรือไม่ก็ได้

<!-- สร้างอัตโนมัติจาก node tools/check-cards.js --docs อย่าแก้มือ -->
### triggers

| trigger |
| --- |
| ON_SUMMON |
| ON_DESTROY |
| ON_BATTLE_DESTROY |
| ACTIVATE_MAIN |
| ACTIVATE_LEADER |
| CAST_SPELL |
| CONTINUOUS_POWER |
| CONTINUOUS_BOARD_AURA |

### costs

| cost | required | optional |
| --- | --- | --- |
| DISCARD_HAND | - | `count`, `triggerDiscardSkill` |
| REST_SELF | - | - |
| REST_ALLY | - | `count` |
| REDUCE_SELF_POWER | - | `amount` |

### blocks

| block | required | optional | enums | desc |
| --- | --- | --- | --- | --- |
| DRAW | - | `side`, `count`, `bonusIfGraveAtLeast`, `bonusCount` | side: SELF / OPPONENT | จั่วการ์ด count ใบ (ถ้านรกมีอย่างน้อย bonusIfGraveAtLeast ใบ จั่ว bonusCount ใบแทน) |
| HEAL_LEADER | - | `side`, `amount` | side: SELF / OPPONENT | ฟื้นฟู HP ลีดเดอร์ amount หน่วย (ไม่เกิน maxHp) |
| DAMAGE_LEADER | - | `side`, `amount` | side: SELF / OPPONENT | ทำดาเมจใส่ลีดเดอร์ amount หน่วย |
| MILL_DECK | - | `side`, `count` | side: SELF / OPPONENT | ส่งการ์ดใบบนสุดของกอง count ใบลงนรก |
| DESTROY_UNIT | `target` | `count`, `select` | target: SELF / OPPONENT; select: CHOOSE / ALL | ทำลายยูนิตบนสนาม (เลือก count ใบ หรือทั้งหมดเมื่อ select เป็น ALL) |
| ADD_POWER | - | `target`, `count`, `amount`, `duration`, `filterTribe` | target: ALLY / SELF_UNIT / ALL_ALLIES; duration: TURN / PERM | เพิ่มพลังโจมตียูนิตฝั่งเรา +amount (TURN จนจบเทิร์น / PERM ถาวร) |
| REDUCE_POWER | - | `target`, `count`, `amount`, `duration` | target: OPPONENT / ALL_ENEMIES; duration: TURN / PERM | ลดพลังโจมตียูนิตฝ่ายตรงข้าม -amount (เลือก count ใบ หรือทุกใบเมื่อ ALL_ENEMIES) — ไม่ใส่ target หรือใช้ OPPONENT = เลือกศัตรู 1 ใบ; ALL_ENEMIES = ทุกใบ |
| FLEX_POWER | - | `plusAmount`, `minusAmount`, `duration` | duration: TURN / PERM | เลือกยูนิต 1 ใบ: ฝั่งเราพลัง +plusAmount หรือฝั่งตรงข้ามพลัง -minusAmount |
| BOUNCE_UNIT | `target` | `count` | target: SELF / OPPONENT | ส่งยูนิตบนสนาม count ใบกลับขึ้นมือเจ้าของ |
| GRANT_STATUS | `status` | `target`, `count` | target: ALLY / ALL_ALLIES; status: INDESTRUCTIBLE / BURN_ON_KILL | มอบสถานะพิเศษให้ยูนิตฝั่งเรา (INDESTRUCTIBLE ไม่ถูกทำลาย / BURN_ON_KILL ฆ่าแล้วทำดาเมจลีดเดอร์) |
| MARK_END_TURN_DESTROY | - | `target` | - | ทำลายยูนิตนี้เองเมื่อจบเทิร์น |
| TRIGGER_ALLY_PASSIVE | `allyId` | `amount` | - | ยูนิตฝั่งเราที่มี id เป็น allyId ได้พลังถาวร +amount |
| RECOVER_FROM_GRAVE | - | `cardId`, `count`, `filterTribe`, `filterType`, `autoPickFirst` | filterType: SPELL / MONSTER | นำการ์ดที่ตรงเงื่อนไข 1 ใบจากกองนรกขึ้นมือ |
| SEARCH_DECK_OR_GRAVE | `destination` | `cardId`, `filterTribe`, `filterType`, `grantImmunity` | destination: HAND / BOARD; filterType: SPELL / MONSTER | ค้นการ์ดที่ตรงเงื่อนไขจากกองการ์ดหรือกองนรก ไปขึ้นมือ (HAND) หรือลงสนาม (BOARD) |
| CARPET_BOMB_COMPOSITE | - | - | - | ระเบิดปูพรม: ผลตามจำนวนทหารเหนือ (NM02/NM03/NM04) บนสนามฝั่งเรา |

### conditions

| condition | required | optional |
| --- | --- | --- |
| MIN_TRIBE_COUNT | `tribe`, `count` | - |
| ALLY_ON_BOARD | `cardId` | - |
| PER_OTHER_ALLY_TRIBE | `tribe` | - |

<!-- จบส่วนที่สร้างอัตโนมัติ -->

## 4. ข้อความเตือนที่พบบ่อยและวิธีแก้

| ข้อความ (ตัวอย่าง) | แปลว่า / วิธีแก้ |
| --- | --- |
| `บล็อก 'DRAWW' ไม่รู้จัก (ใกล้เคียง: 'DRAW')` | พิมพ์ชื่อบล็อกผิด แก้ตามชื่อที่ใกล้เคียง หรือดูชื่อที่ถูกในตารางข้อ 3 |
| `trigger 'ON_SUMMONN' ไม่รู้จัก (ใกล้เคียง: 'ON_SUMMON')` | ชื่อ trigger ผิด (ใช้ได้เฉพาะที่อยู่ในตาราง trigger) |
| `ขาดพารามิเตอร์ 'target'` | บล็อก/cost/condition นั้นต้องมีพารามิเตอร์ตัวนี้ ดูคอลัมน์ required ในตาราง |
| `ค่า 'ENEMY' ใช้ไม่ได้กับ target (ใช้ได้: SELF, OPPONENT)` | ค่าของพารามิเตอร์ต้องเป็นหนึ่งในที่ระบุ ดูคอลัมน์ enums |
| `id 'M01' ซ้ำ` | มีการ์ดใช้ id นี้แล้ว ตั้ง id ใหม่ |
| `type 'Monstr' ไม่รู้จัก` | `type` ต้องเป็นชนิดที่ระบบรู้จัก เช่น `Monster`, `NormalSpell`, `Leader` |
| `rarity 'X' ไม่รู้จัก` | `rarity` ใช้ได้ `N` / `R` / `SR` / `Legend` |
| `ขาด name` / `ขาด image` / `ขาด id` | การ์ดต้องมีฟิลด์นี้ |
| `ขาด trigger` / `ขาด block` | effect ต้องมี `trigger` และทุก step ต้องมี `block` |
| `steps ต้องเป็นอาร์เรย์` / `costs ต้องเป็นอาร์เรย์` | ต้องครอบด้วย `[ ... ]` แม้มีรายการเดียว |
| `เด็ค L01 มี 21 ใบ (ต้อง 20)` | เพิ่ม id เข้าเด็คโดยไม่แทนที่ ให้แทนที่ id เดิมแทน (ข้อ 1 ขั้นที่ 3) |
| `id 'XXX' ในเด็ค L01 ไม่มีการ์ดนี้` | id ใน `DECK_LISTS` สะกดผิด หรือยังไม่ได้เพิ่มการ์ดนั้น |
| `'M01' เกิน maxCopies (2)` | ใส่ id เดียวกันเกินจำนวนที่กำหนด (ค่าตั้งต้น 2 ใบ หรือค่า `maxCopies` ของการ์ด) |
| `ไม่พบไฟล์ภาพ` / `ไม่พบภาพย่อ` (ตัวตรวจในเครื่องเท่านั้น) | ไฟล์ภาพไม่มีที่ path นั้น / ยังไม่ได้สร้างภาพย่อ ดูข้อ 6 |

## 5. วิธีเพิ่มบล็อกใหม่ (สกิลชนิดใหม่) 5 ขั้น

1. เพิ่ม `case` ของบล็อกใน `executeSingleStep` ใน `js/game.js` (ตัวทำงานจริงของบล็อก)
2. เพิ่ม `case` ใน `generateStepText` ใน `js/game.js` (ข้อความอธิบายอัตโนมัติ)
3. เพิ่มรายการบล็อกใน `CARD_SCHEMA.blocks` ใน `js/cards/schema.js` (ระบุ `required`, `optional`, `enums`, `desc`) ไม่เช่นนั้นตัวตรวจจะบอกว่าบล็อกไม่รู้จัก
4. เพิ่มเทสต์ใน `tests/cards.spec.js` (เฉพาะคนที่มีโฟลเดอร์ tests ในเครื่อง)
5. รัน `node tools/check-cards.js` (เฉพาะคนที่มีโฟลเดอร์ tools ในเครื่อง) แล้วรัน `node tools/check-cards.js --docs` เพื่อรีเจนเนอเรตตารางข้อ 3 วางทับระหว่างหมายเหตุสร้างอัตโนมัติ

## 6. ข้อควรระวังเรื่องภาพ

- ใช้**เลข png ถัดไป**ของโฟลเดอร์เด็ค (เช่น `12.png`) **ห้ามใช้ภาพซ้ำ**หรือเขียนทับภาพของการ์ดอื่น
- ภาพย่อ (`images/thumbs/<เด็ค>/<เลข>.webp`) ใช้แสดงในรายการการ์ด สร้างด้วย `npm run thumbs` (**เฉพาะคนที่มีโฟลเดอร์ tools ในเครื่อง**) แล้ว commit ไฟล์ที่ได้ขึ้นไปด้วย
- ถ้าภาพย่อหาย เกมจะ**ถอยไปใช้ภาพเต็ม**แทน (ไม่พัง แค่โหลดช้ากว่า) คนที่ไม่มี tools ข้ามขั้นนี้ได้ แล้วให้คนที่มีรันทีหลัง
