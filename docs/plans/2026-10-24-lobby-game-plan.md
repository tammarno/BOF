# Game Lobby (v0.8) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** แทนล็อบบี้หน้ายาว v0.7 ด้วยล็อบบี้เกมหน้าจอเดียว: ลีดเดอร์กลางจอ, กำแพงการ์ดที่พลิกตามเด็ค, ปุ่มเริ่มดวลที่ไปถึงเกมใน 2 คลิก

**Architecture:** `index.html` มีโครงล็อบบี้ใหม่ · `js/lobby.js` เก็บ `LobbyData` เดิมและเขียน `LobbyView` ใหม่ (render + สถานะเด็คที่เลือก) · `js/lobby-motion.js` เขียนใหม่โดยคง API `window.LobbyMotion` · ภาพย่อ WebP สร้างครั้งเดียวด้วย Playwright แล้ว commit

**Tech Stack:** HTML/CSS/vanilla JS, GSAP 3.12.5 core (`vendor/gsap.min.js`), Playwright (เทสต์ + สคริปต์ภาพย่อ)

**Spec:** `docs/specs/2026-10-24-lobby-game-design.md` · ต้นแบบที่อนุมัติ: `.superpowers/brainstorm/1147-1792856742/content/lobby-proto-v2.html`

## Global Constraints

- **เปิดได้ทั้ง `file://` และ GitHub Pages:** ไม่ใช้ `fetch` ข้อมูลมาจาก `CARD_DATABASE` / `getDefaultDeckForLeader` / `loadSavedDeck` เท่านั้น
- **ไม่เพิ่มไลบรารีที่หน้าเว็บโหลด**
- **ฟอนต์และสี:**
  - ฟอนต์ Kanit (หัวข้อ) / IBM Plex Sans Thai (เนื้อหา)
  - พื้น `#0b0d1a` · ทอง `#f3c969`
  - สีเด็ค: จิต `#3ee08f` · เหนือ `#f0a347` · วันสิ้นโลก `#5fd0ff`
- **การ์ดลีดเดอร์ไม่มีแสงด้านหลังหรือวงแหวน:** มีแค่ขอบทอง 3px + เงาดำ
- **ขยับด้วย transform/opacity เท่านั้น:** ไม่ใช้ `backdrop-filter` หรือ `mix-blend-mode` บนหรือใต้สิ่งที่ขยับ · ไม่ animate `box-shadow`
- **ปุ่มแตะได้ ≥ 44×44px · contrast ตัวอักษร ≥ 4.5:1 · ไอคอนเป็น SVG ไม่ใช่อีโมจิ**
- **ไม่มี scroll และไม่มีองค์ประกอบล้นจอ** ที่ 1440×900, 1316×620, 390×844, 320×640
- **localStorage:** ห้ามเขียน `my_card_game_deck` จากล็อบบี้ · เด็คล่าสุดเก็บที่ `bof_lobby_deck` (`'L01'|'L02'|'L03'|'mine'`)
- **id ที่ต้องคง:** `lobby-screen`, `btn-lobby-pvp`, `btn-lobby-bot` (สองตัวนี้ย้ายไปเป็นปุ่มใน `#lb-mode-dialog`), `nav-deck`, `nav-cards`, `lb-join`, `lb-join-code`, `lb-join-error`, `lb-mode-dialog`

## Review Focus

1. **เด็คบันทึกเสียหายหรือถูกลบ ขณะที่ `bof_lobby_deck = 'mine'`:** ต้องถอยไปใช้ `L01` ไม่ error (Task 2: `G3 mine fallback when saved deck missing`)
2. **กดสลับเด็คระหว่างที่กำแพงยังพลิกไม่เสร็จ หรือระหว่างการพลิกตอนว่าง:** สุดท้ายกำแพงต้องมีแต่การ์ดของเด็คล่าสุด (Task 4: `M3 wall settles on last deck after rapid switching`)
3. **เข้าห้องด้วยรหัสโดยไม่เคยกดเลือกเด็ค:** ต้องใช้เด็คที่แสดงอยู่บนจอ (Task 2: `G6 join applies selected deck`)
4. **จอเตี้ยมาก (1316×620) หรือแคบ (320×640):** ต้องไม่ล้นและไม่ต้องเลื่อน (Task 1: `L1 no scroll and no spill`)
5. **ภาพย่อหาย (โฟลเดอร์ thumbs ไม่ครบ):** ต้องสลับไปใช้ภาพเต็มเอง (Task 1: `L6 missing thumb falls back to full image`)

---

### Task 0: ภาพย่อ WebP + ตัวช่วยข้อมูล

**Files:**
- Create: `tools/make-thumbs.js`, `images/thumbs/<เด็ค>/<n>.webp` (39 ไฟล์)
- Modify: `js/lobby.js` (ส่วน `LobbyData`)
- Test: `tests/lobby.spec.js` (กลุ่ม D: คง D1–D3 เดิม เพิ่ม D4–D6)

**Interfaces:**
- Produces:
  - `LobbyData.thumbOf(card: Card): string` — `images/เด็คจิต/3.png` → `images/thumbs/เด็คจิต/3.webp`
  - `LobbyData.legendCount(leaderId: string): number`
  - `LobbyData.cardsOfDeck(key: 'L01'|'L02'|'L03'|'mine'): Card[]` — ลีดเดอร์ + การ์ดไม่ซ้ำ · `'mine'` อ่านจาก `loadSavedDeck()`

- [ ] **Step 1: เขียนเทสต์ที่ล้ม**

```js
test('D4 thumbOf maps png to webp in thumbs', async b => {
  const p = await openPage(b, { seen: true });
  const v = await p.evaluate(() => LobbyData.thumbOf({ image: 'images/เด็คจิต/3.png' }));
  assert(v === 'images/thumbs/เด็คจิต/3.webp', v);
});
test('D5 every card has a thumbnail file', async b => {
  const p = await openPage(b, { seen: true });
  const paths = await p.evaluate(() => CARD_DATABASE.map(c => LobbyData.thumbOf(c)));
  const missing = paths.filter(x => !require('fs').existsSync(path.join(ROOT, x)));
  assert(missing.length === 0, missing.slice(0, 3).join(', '));
});
test('D6 legend count per deck', async b => {
  const p = await openPage(b, { seen: true });
  const v = await p.evaluate(() => ['L01', 'L02', 'L03'].map(LobbyData.legendCount));
  assert(JSON.stringify(v) === '[2,1,2]', JSON.stringify(v));
});
```

- [ ] **Step 2:** `node tests/lobby.spec.js D` → Expected: FAIL D4–D6 (`thumbOf is not a function`)
- [ ] **Step 3:** เขียน `tools/make-thumbs.js`:
  - เปิด chromium headless แล้วอ่านแต่ละ PNG ใน `images/<เด็ค>/` เป็น data URL
  - วาดลง canvas กว้าง 240px (คงสัดส่วน 750:1050) แล้ว `canvas.toDataURL('image/webp', .8)` และเขียนไฟล์
  - รันด้วย `node tools/make-thumbs.js`
- [ ] **Step 4:** เพิ่ม `thumbOf`, `legendCount`, `cardsOfDeck` ใน `LobbyData`
- [ ] **Step 5:** `node tests/lobby.spec.js D` → Expected: PASS 6/6 · `du -sh images/thumbs` → Expected: ≤ 1.5MB
- [ ] **Step 6: Commit** `feat(lobby): add webp thumbnails and deck data helpers`

---

### Task 1: โครงหน้าและสไตล์ (ภาพนิ่ง)

**Files:**
- Modify: `index.html` (แทนบล็อก `#lobby-screen` ทั้งหมด)
- Rewrite: `css/lobby.css`
- Modify: `js/lobby.js` (ส่วน `LobbyView` · ลบ render ของ v0.7 ที่ไม่ใช้)
- Test: `tests/lobby.spec.js` (ลบกลุ่ม S, K, W, R ของ v0.7 · เพิ่มกลุ่ม L)

**Interfaces:**
- Consumes: Task 0
- Produces (DOM):
  - `#lb-wall` (ภายในมี `.lb-wall-inner > .lb-tile` แต่ละ tile มี `.lb-tile-in > img.front, img.back`, attribute `data-card-id` บนรูปที่หันหน้าอยู่)
  - `.lb-tint` · `.lb-vignette` · `#lb-leader` (มี `img` ภาพเต็ม 1 รูป)
  - `.lb-info` (`.lb-deck-name`, `.lb-leader-name`, `.lb-deck-style`, `.lb-chips`)
  - `#lb-decks > button.lb-deck[data-deck="L01|L02|L03|mine"][aria-pressed]`
  - `#lb-play` · `nav.lb-menu` (`#nav-deck`, `#nav-cards`, `#nav-howto`, มือถือ: `#nav-join`)
  - `form#lb-join` (desktop: มุมขวาบน · มือถือ: อยู่ใน `#lb-join-dialog`)
  - `#lb-mode-dialog` (`#btn-lobby-bot`, `#btn-lobby-pvp`, `#lb-mode-close`) · `#lb-howto-dialog` · `a.lb-github`
- Produces (JS):
  - `LobbyView.render(): void`
  - `LobbyView.renderDeck(key: string): void` — ข้อมูล ลีดเดอร์ และกำแพง แบบทันที ไม่มี motion
  - `LobbyView.wallSize(): { cols: number, rows: number }` — desktop 12×5, < 768px 6×6

- [ ] **Step 1: เขียนเทสต์ที่ล้ม**

```js
test('L1 no scroll and no spill', async b => {
  for (const [width, height] of [[1440, 900], [1316, 620], [390, 844], [320, 640]]) {
    const p = await openPage(b, { seen: true, viewport: { width, height } }); await p.waitForTimeout(1700);
    const v = await p.evaluate(() => ({ scroll: document.documentElement.scrollHeight > innerHeight + 1 || document.documentElement.scrollWidth > innerWidth + 1,
      spill: [...document.querySelectorAll('#lobby-screen *')].filter(e => !e.closest('#lb-wall, dialog') && e.getClientRects().length)
        .filter(e => { const r = e.getBoundingClientRect(); return r.right > innerWidth + 1 || r.bottom > innerHeight + 1 || r.left < -1; }).map(e => e.id || e.className).slice(0, 4) }));
    assert(!v.scroll && v.spill.length === 0, `${width}x${height} ` + JSON.stringify(v));
  }
});
test('L2 play opens mode dialog; bot reaches AI setup in two clicks', async b => {
  const p = await openPage(b, { seen: true });
  await p.click('#lb-play'); await p.click('#btn-lobby-bot'); await p.waitForTimeout(400);
  assert(await p.evaluate(() => getComputedStyle(document.getElementById('ai-setup-modal')).display !== 'none'), 'ai setup not open');
});
test('L3 howto dialog shows steps and real counts', async b => {
  const p = await openPage(b, { seen: true });
  await p.click('#nav-howto');
  const t = await p.evaluate(() => document.getElementById('lb-howto-dialog').innerText);
  assert(/39/.test(t) && /Legend 5/.test(t) && /SR 12/.test(t) && /R 17/.test(t) && /N 5/.test(t) && (t.match(/ขั้น|ก่อนอื่น|จากนั้น|สุดท้าย/g) || []).length >= 3, t.slice(0, 120));
});
test('L4 wall shows only the selected deck', async b => {
  const p = await openPage(b, { seen: true });
  const v = await p.evaluate(() => { const ids = new Set(LobbyData.cardsOfDeck('L01').map(c => c.id));
    const shown = [...document.querySelectorAll('#lb-wall .lb-tile')].map(t => t.dataset.cardId); return { n: shown.length, bad: shown.filter(id => !ids.has(id)) }; });
  assert(v.n === 60 && v.bad.length === 0, JSON.stringify(v));
});
test('L5 mine thumb only when a deck is saved', async b => {
  let p = await openPage(b, { seen: true });
  assert(!(await p.$('.lb-deck[data-deck="mine"]')), 'mine shown without saved deck');
  p = await openPage(b, { seen: true, savedDeck: { leaderId: 'L02', mainDeck: Array(20).fill('NM01') } });
  assert(!!(await p.$('.lb-deck[data-deck="mine"]')), 'mine missing with saved deck');
});
test('L6 missing thumb falls back to full image', async b => {
  const p = await openPage(b, { seen: true, blockThumbs: true }); await p.waitForTimeout(800);
  const v = await p.evaluate(() => [...document.querySelectorAll('#lb-decks img')].map(i => i.complete && i.naturalWidth > 0 && /\.png$/.test(i.src)));
  assert(v.length >= 3 && v.every(Boolean), JSON.stringify(v));
});
test('L7 leader card has no glow or ring', async b => {
  const p = await openPage(b, { seen: true });
  const v = await p.evaluate(() => ({ ring: !!document.querySelector('#lobby-screen .lb-ring, #lobby-screen .lb-glow'),
    shadow: getComputedStyle(document.querySelector('#lb-leader img')).boxShadow }));
  assert(!v.ring && !/rgb\((62, 224, 143|240, 163, 71|95, 208, 255)/.test(v.shadow), JSON.stringify(v));
});
```

  `openPage` ได้ตัวเลือกใหม่:
  - `savedDeck` → `ctx.addInitScript` ตั้ง `localStorage.my_card_game_deck`
  - `lobbyDeck` → ตั้ง `localStorage.bof_lobby_deck`
  - `blockThumbs` → `page.route('**/thumbs/**', r => r.abort())`
- [ ] **Step 2:** `node tests/lobby.spec.js L` → Expected: FAIL (ยังไม่มีโครงใหม่)
- [ ] **Step 3:** เขียน markup ตามตารางใน spec §3:
  - ข้อความ: ปุ่มหลัก "เริ่มดวล ▶" + บรรทัด "เลือกเล่นกับบอทหรือเพื่อน" · ปุ่มใน dialog "เล่นกับบอท" / "ดวลกับเพื่อน (สร้างห้อง)" / "ยกเลิก" · หัว dialog "เล่นเด็คนี้แบบไหน?"
  - เนื้อหาวิธีเล่นใช้ 3 ประโยคเดิมจาก v0.7 (ก่อนอื่น… / จากนั้น… / สุดท้าย…) พร้อมเวลา ไม่กี่วินาที / ไม่ถึงนาที / ราว 10 นาที
- [ ] **Step 4:** เขียน `css/lobby.css`:
  - `#lobby-screen` สูง `100svh` และ `overflow: hidden`
  - ชั้น z: กำแพง < tint < vignette < เนื้อหา
  - ขนาดตาม spec §3 · มือถือ < 768px ใช้แถบไอคอนล่างจอ
  - การ์ดลีดเดอร์: `box-shadow: 0 24px 60px rgba(0,0,0,.7), 0 0 0 3px rgba(243,201,105,.85)`
  - ชั้นสีกำแพง: `background: var(--deck); opacity: .12` (ไม่ใช้ blend)
- [ ] **Step 5:** เขียน `LobbyView.render()` / `renderDeck(key)`:
  - กำแพงสุ่มจาก `cardsOfDeck(key)` ด้วย `thumbOf`
  - ทุก `<img>` ภาพย่อมี `onerror` สลับเป็น `card.image` ครั้งเดียว
  - ข้อความใน `.lb-chips`: `HP 6` · `21 ใบ` · `Legend N`
- [ ] **Step 6:** `node tests/lobby.spec.js L` → Expected: PASS 7/7 · `node tests/lobby.spec.js D` → PASS 6/6 · `node tests/lobby.spec.js J` → PASS (เทสต์ J1/J2 ทำงานบนฟอร์ม desktop เดิม)
- [ ] **Step 7: Commit** `feat(lobby): single-screen game lobby layout with card wall`

---

### Task 2: สถานะเด็คที่เลือก

**Files:**
- Modify: `js/lobby.js`
- Test: `tests/lobby.spec.js` (กลุ่ม G)

**Interfaces:**
- Consumes: Task 0, Task 1
- Produces:
  - `LobbyView.selectDeck(key): void` — อัปเดต `aria-pressed` · `localStorage.bof_lobby_deck` · `renderDeck` · ส่ง `CustomEvent('lobby:deck', { detail: { key, prev } })` บน `#lb-decks`
  - `LobbyView.selectedDeck(): string`
  - `LobbyView.applySelectedDeck(): void` — ตั้ง `currentDeckConfig` ตาม spec §4.1
  - `LobbyView.refreshMine(): void` — สร้าง/ลบรูป mine ใหม่
- **ผูกเหตุการณ์:**
  - `#btn-lobby-bot` / `#btn-lobby-pvp` มี listener แบบ capture ที่เรียก `applySelectedDeck()` แล้วปิด dialog (ก่อน handler ของ game.js)
  - ฟอร์มเข้าห้องเรียก `applySelectedDeck()` ก่อน `window.joinPvpRoomAsGuest(code)`
  - หลัง `#btn-save-start` ใช้ `setTimeout(0)` แล้วเรียก `refreshMine()` + `selectDeck('mine')`

- [ ] **Step 1: เขียนเทสต์ที่ล้ม**

```js
test('G1 selected deck is used and saved deck untouched', async b => {
  const p = await openPage(b, { seen: true, savedDeck: { leaderId: 'L02', mainDeck: Array(20).fill('NM01') } });
  await p.click('.lb-deck[data-deck="L03"]'); await p.click('#lb-play'); await p.click('#btn-lobby-bot'); await p.waitForTimeout(200);
  const v = await p.evaluate(() => ({ leader: currentDeckConfig.leaderId, n: currentDeckConfig.mainDeck.length, saved: JSON.parse(localStorage.my_card_game_deck).leaderId }));
  assert(v.leader === 'L03' && v.n === 20 && v.saved === 'L02', JSON.stringify(v));
});
test('G2 last deck remembered across reload', async b => {
  const p = await openPage(b, { seen: true });
  await p.click('.lb-deck[data-deck="L02"]'); await p.reload(); await p.waitForTimeout(300);
  assert(await p.evaluate(() => LobbyView.selectedDeck() === 'L02' && document.querySelector('.lb-deck[data-deck="L02"]').getAttribute('aria-pressed') === 'true'), 'not remembered');
});
test('G3 mine fallback when saved deck missing', async b => {
  const p = await openPage(b, { seen: true, lobbyDeck: 'mine' });
  assert(await p.evaluate(() => LobbyView.selectedDeck() === 'L01') && p.errors.length === 0, 'no fallback: ' + p.errors.join('|'));
});
test('G4 mine is default and used when a deck is saved', async b => {
  const p = await openPage(b, { seen: true, savedDeck: { leaderId: 'L02', mainDeck: Array(20).fill('NM01') } });
  await p.click('#lb-play'); await p.click('#btn-lobby-bot'); await p.waitForTimeout(200);
  const v = await p.evaluate(() => ({ sel: LobbyView.selectedDeck(), leader: currentDeckConfig.leaderId, first: currentDeckConfig.mainDeck[0] }));
  assert(v.sel === 'mine' && v.leader === 'L02' && v.first === 'NM01', JSON.stringify(v));
});
test('G5 saving in deck builder selects mine', async b => {
  const p = await openPage(b, { seen: true });
  await p.click('#nav-deck'); await p.waitForTimeout(600);
  await p.evaluate(() => { currentDeckConfig.leaderId = 'L03'; currentDeckConfig.mainDeck = [...DEFAULT_DOOMSDAY_DECK_LIST]; renderDeckBuilder(); });
  await p.click('#btn-save-start'); await p.waitForTimeout(400);
  assert(await p.evaluate(() => LobbyView.selectedDeck() === 'mine' && !!document.querySelector('.lb-deck[data-deck="mine"]')), 'mine not selected');
});
test('G6 join applies selected deck', async b => {
  const p = await openPage(b, { seen: true });
  await p.evaluate(() => { window.joinPvpRoomAsGuest = () => { window.__leader = currentDeckConfig.leaderId; }; });
  await p.click('.lb-deck[data-deck="L02"]'); await p.fill('#lb-join-code', '4829'); await p.press('#lb-join-code', 'Enter');
  assert(await p.evaluate(() => window.__leader === 'L02'), 'deck not applied before join');
});
test('G7 cancel keeps current deck config', async b => {
  const p = await openPage(b, { seen: true });
  const before = await p.evaluate(() => JSON.stringify(currentDeckConfig));
  await p.click('.lb-deck[data-deck="L03"]'); await p.click('#lb-play'); await p.click('#lb-mode-close');
  await p.click('#lb-play'); await p.keyboard.press('Escape');
  assert(await p.evaluate(b => JSON.stringify(currentDeckConfig) === b, before), 'changed on cancel');
});
```

- [ ] **Step 2:** `node tests/lobby.spec.js G` → Expected: FAIL
- [ ] **Step 3:** เขียนตาม Interfaces · ค่าเริ่มต้นตาม spec §4.1
- [ ] **Step 4:** `node tests/lobby.spec.js G` → PASS 7/7 · `node tests/lobby.spec.js` (กลุ่ม D/L/J) → PASS
- [ ] **Step 5: Commit** `feat(lobby): remember and apply the selected deck`

---

### Task 3: ต่อเข้าเกมและชุดเทสต์อื่น

**Files:**
- Modify: `js/game.js` `setupLobbyEvents()` — ลบบรรทัด `lb-gallery-all`, `lb-footer-cta` ไม่แตะส่วนอื่น
- Modify: `js/panel-motion.js` + `css/panel-motion.css` — `.lb-top .lb-toplink` → `.lb-menu button`, `.lb-menu a` (กดยุบ + ขีดเส้นใต้ทอง เหมือนเดิม)
- Modify: `tests/ui.spec.js`, `tests/choice.spec.js`, `tests/panel.spec.js` — ทุก `p.click('#btn-lobby-bot'` และ `p.click('#btn-lobby-pvp'` ใส่ `await p.click('#lb-play');` ไว้ก่อน (ปุ่มย้ายเข้า dialog) · `lobbyOk` ใน panel.spec ใช้ `#lb-leader img`, `.lb-menu`, `#lb-play`, `#lb-decks`
- **Ruling ล่วงหน้า:** เทสต์ที่วัดอะไรจากปุ่มเหล่านี้ตรงๆ ตอนอยู่บนล็อบบี้ (เช่น press scale) ให้เปลี่ยนไปวัดที่ `#lb-play`

- [ ] **Step 1:** แก้เทสต์ตามข้างบน แล้วรัน `node tests/ui.spec.js; node tests/choice.spec.js; node tests/panel.spec.js` → Expected: เห็นข้อที่ FAIL เพราะ handler/selector เก่า (จดชื่อไว้)
- [ ] **Step 2:** แก้ `game.js` และ `panel-motion.*`
- [ ] **Step 3:** รันทั้ง 3 ชุด → Expected: ui 19/19, choice 9/9, panel 17/17
- [ ] **Step 4: Commit** `fix(lobby): wire game and other suites to the new lobby`

---

### Task 4: Motion

**Files:**
- Rewrite: `js/lobby-motion.js`, `css/lobby-motion.css`
- Test: `tests/lobby.spec.js` (กลุ่ม T/F/M ทำใหม่)

**Interfaces:**
- Consumes: event `lobby:deck` · `LobbyView.wallSize()` · DOM ของ Task 1
- Produces (คงเดิม): `window.LobbyMotion = { start, stop, isRunning, isPaused, _particleCount, _particlesActive, _particlePos }`
- **ค่าจาก spec §5:**
  - ฉากเปิด ≤ 1.6 วินาที (สั้น ≤ 0.8 วินาที)
  - พลิกการ์ด `rotateY` 180° ใช้เวลา 0.6 วินาที หน่วง 70ms × ระยะห่างจากกลาง
  - ลีดเดอร์เปลี่ยน 0.5 วินาที · ลอยขึ้นลง 10px ทุก 4 วินาที
  - กำแพงเลื่อน ±6% ใน 60 วินาที
  - พลิกตอนว่าง 2 ใบทุก 1.4 วินาที
  - ประกาย: canvas `#lm-particles` ภายใน `#lobby-screen` ≤ 30 จุด (มือถือ ≤ 15)
  - แสงเต้นของปุ่ม: ชั้น `.lb-play-glow` ขยับด้วย opacity/scale
- **การพลิกใช้ CSS class `.flip` + transition:** ตั้ง `will-change: transform` เฉพาะช่วงที่พลิก · การพลิกรอบใหม่ยกเลิกตัวจับเวลาของรอบเก่าทั้งหมด

- [ ] **Step 1: เขียนเทสต์** — ย้ายจากชุด v0.7 แล้วปรับ selector:
  - T1, T2 ทั้งกลุ่ม (รวม `pauses under mode dialog`), T3 (`intro finishes by 2s` ใช้ 1.7s, `hides parts at start` วัด `#lb-leader` opacity, `skip on click`, `bot button single click during intro` → `#lb-play`, `short on return`, `reduced motion`, `intro smooth`)
  - T4 (`only transform/opacity`, `idle is smooth`), T5 (`button press is fast` บน `#lb-play`, `touch has no tilt` บน `#lb-leader`)
  - T6 (จำนวนประกาย, canvas อยู่ใน `#lobby-screen`, `particles stop in game`), T7, F1 (วัด `#lb-leader`), F4

  แล้วเพิ่ม:

```js
test('M1 deck switch flips the wall as a wave', async b => {
  const p = await openPage(b, { seen: true }); await p.waitForTimeout(1700);
  await p.click('.lb-deck[data-deck="L02"]'); await p.waitForTimeout(120);
  const v = await p.evaluate(() => { const t = [...document.querySelectorAll('#lb-wall .lb-tile')];
    const flipping = t.filter(x => gsap.getProperty(x.querySelector('.lb-tile-in'), 'rotationY') % 180 !== 0 || x.classList.contains('flipping')).length; return { flipping, n: t.length }; });
  assert(v.flipping > 0 && v.flipping < v.n, JSON.stringify(v));
});
test('M2 idle flips stay within the selected deck', async b => {
  const p = await openPage(b, { seen: true, lobbyDeck: 'L03' }); await p.waitForTimeout(6000);
  const bad = await p.evaluate(() => { const ids = new Set(LobbyData.cardsOfDeck('L03').map(c => c.id));
    return [...document.querySelectorAll('#lb-wall .lb-tile')].filter(t => !ids.has(t.dataset.cardId)).length; });
  assert(bad === 0, bad + ' tiles from other decks');
});
test('M3 wall settles on last deck after rapid switching', async b => {
  const p = await openPage(b, { seen: true }); await p.waitForTimeout(1700);
  for (const k of ['L02', 'L03', 'L01', 'L02', 'L03']) await p.click(`.lb-deck[data-deck="${k}"]`);
  await p.waitForTimeout(2500);
  const v = await p.evaluate(() => { const ids = new Set(LobbyData.cardsOfDeck('L03').map(c => c.id));
    const tiles = [...document.querySelectorAll('#lb-wall .lb-tile')];
    return { bad: tiles.filter(t => !ids.has(t.dataset.cardId)).length, leader: document.querySelectorAll('#lb-leader img').length, name: document.querySelector('.lb-deck-name').textContent }; });
  assert(v.bad === 0 && v.leader === 1 && v.name === 'เด็ควันสิ้นโลก', JSON.stringify(v));
});
test('M4 deck switch is smooth', async b => {
  const p = await openPage(b, { seen: true }); await p.waitForTimeout(1700);
  const fs = frameStats(p, 1500); await p.click('.lb-deck[data-deck="L02"]');
  const s = await fs; assert(s.p95 <= 17.5, 'switch p95 ' + s.p95.toFixed(1));
});
test('M5 reduced motion swaps deck instantly without flips', async b => {
  const p = await openPage(b, { seen: true, reduced: true });
  await p.click('.lb-deck[data-deck="L02"]'); await p.waitForTimeout(50);
  const v = await p.evaluate(() => { const ids = new Set(LobbyData.cardsOfDeck('L02').map(c => c.id));
    return [...document.querySelectorAll('#lb-wall .lb-tile')].every(t => ids.has(t.dataset.cardId)) && !LobbyMotion._particlesActive(); });
  assert(v, 'not instant under reduced motion');
});
test('M6 content visible without gsap', async b => {
  const p = await openPage(b, { seen: true, blockGsap: true }); await p.waitForTimeout(600);
  const o = await opacityAll(p, '#lb-leader img, #lb-play, .lb-deck-name, #lb-decks');
  assert(o.every(x => x > .99), JSON.stringify(o));
});
```

- [ ] **Step 2:** `node tests/lobby.spec.js T; node tests/lobby.spec.js F; node tests/lobby.spec.js M` → Expected: ข้อที่ต้องใช้ motion จริง FAIL
- [ ] **Step 3:** เขียน `lobby-motion.js` ตามค่าข้างบน (โครงเหมือน v0.7: `start/stop/setPaused/check`, `covered()` รวม `dialog[open]` ทุกตัวใน `#lobby-screen`)
- [ ] **Step 4:** `node tests/lobby.spec.js` → Expected: PASS ทั้งไฟล์ · รัน `ui`, `choice`, `panel` อีกครั้ง → PASS
- [ ] **Step 5: Commit** `feat(lobby): card wall flips, leader swap and lobby motion`

---

### Task 5: ตรวจด้วยตา, STATUS และปิดงาน

- [ ] **Step 1:** ถ่ายภาพที่ 1440×900 และ 390×844 (ปกติ + reduced motion) ด้วย `.taste-skill/shot.js` แล้วเปิดดูทุกภาพ
  - เทียบกับต้นแบบ v2
  - เช็ก checklist ก่อนส่งของ ui-ux-pro-max: contrast, 44px, focus, SVG icon, reduced motion
- [ ] **Step 2:** แก้สิ่งที่เห็น (ไม่เกิน 2 รอบ) แล้วรันทั้ง 4 ชุดเทสต์
- [ ] **Step 3:** อัปเดต `STATUS.md`:
  - เวอร์ชัน 0.8 และตารางไฟล์ (`tools/`, `images/thumbs/`)
  - จำนวนเทสต์
  - ลบงานค้าง "ย่อรูปการ์ดเป็น WebP"
- [ ] **Step 4: Commit** `docs: update status for game lobby v0.8`
- [ ] **Step 5:** รีวิวทั้ง branch โดย reviewer ที่ไม่เคยเห็นงานนี้มาก่อน แล้วแก้ข้อ Critical/Important ด้วย TDD
- [ ] **Step 6:** **ถามผู้ใช้ก่อน merge / push**
