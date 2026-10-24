# Lobby Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** แทนหน้าล็อบบี้เดิม (Hero + การ์ดเมนู 3 ใบ) ด้วยหน้ายาวแบบ Colour chapters 6 ส่วน มีส่วนเลือกเด็คที่กดได้ และ motion ใหม่

**Architecture:** HTML ของล็อบบี้อยู่ใน `index.html` เหมือนเดิม ข้อมูลที่เป็นตัวเลขหรือรายการการ์ดสร้างจาก `CARD_DATABASE` โดย `js/lobby.js` (โหลดหลัง `game.js`)
สไตล์ทั้งหมดของล็อบบี้ย้ายไป `css/lobby.css` (scoped ใต้ `#lobby-screen`) ส่วน `js/lobby-motion.js` เขียนใหม่โดยคง API `window.LobbyMotion` เดิม
ไม่แตะตรรกะเกมใน `game.js` นอกจาก `setupLobbyEvents()`

**Tech Stack:** HTML/CSS/vanilla JS, GSAP 3.12.5 core (`vendor/gsap.min.js`), PeerJS เดิม, Playwright (เทสต์), `design-taste-frontend` scripts (lint/inspect)

**Spec:** `docs/specs/2026-10-24-lobby-redesign-design.md`

## Global Constraints

- เปิดได้ทั้งแบบ `file://` และ GitHub Pages — ห้ามโหลดข้อมูลด้วย `fetch`, ใช้ global `CARD_DATABASE` / `getDefaultDeckForLeader` เท่านั้น
- ไม่เพิ่มไลบรารีที่หน้าเว็บโหลด (ไม่มี ScrollTrigger) · Playwright เป็น devDependency สำหรับเทสต์เท่านั้น
- ฟอนต์: `--font-display` Kanit, `--font-body` IBM Plex Sans Thai (ค่าเดิมใน `holo.css`)
- Tokens ตาม spec §3 ทุกค่า (`--lb-navy #0b0d1a`, `--lb-navy-2 #161a33`, `--lb-ink #e8eaf7`, `--lb-ink-dark #12142a`, `--lb-paper #f5ecd7`, `--lb-paper-2 #ebe0c6`, `--lb-gold #f3c969`, `--deck-jit #0f4d3c/#3ee08f`, `--deck-nuea #6b2430/#f0a347`, `--deck-doom #142a52/#5fd0ff`)
- ตัวอักษร 5 ขั้น: `clamp(64px, 10vw, 160px)` · `clamp(40px, 5.6vw, 96px)` · 20px · 17px · 14px (ขั้นต่ำ 13px) · ปุ่มมุม 4px · ขอบหน้า 28px / 16px (<768px)
- กฎบ้านใน `#lobby-screen`: ไม่มี gradient, ไม่มี shadow/glow ตอนนิ่ง, ไม่มีอีโมจิ (ไอคอนเป็น SVG inline), ไม่มี eyebrow, ไม่มีเลขลำดับ, ไม่มีเส้นคั่นบาง, ไม่มี backdrop-filter, หัวข้อ ≤ 2 บรรทัด
  ยกเว้น holo บนภาพการ์ด และดาว canvas ใน Hero
- id ที่ต้องคงไว้: `lobby-screen`, `btn-lobby-pvp`, `btn-lobby-bot`, `nav-deck`, `nav-cards`, `input-join-code`, `btn-join-room` (อันใน modal), ทุก modal
- `currentDeckConfig` ที่ตั้งจากล็อบบี้ต้องไม่เขียนลง `localStorage['my_card_game_deck']`
- motion: ใช้แค่ transform/opacity · intro ≤ 2 วินาที · `gsap.matchMedia()` สำหรับ reduced motion · เนื้อหามองเห็นได้แม้ JS ไม่ทำงาน
- ข้อความภาษาไทยทุกคำตาม spec §5 ใช้ตามตัวอักษร

## Review Focus

1. **กด "เล่นเด็คนี้" หรือสลับเด็ครัวๆ** — เวทีต้องจบที่เด็คที่กดล่าสุด ไม่มีการ์ดสองชุดซ้อนกัน (เทสต์ใน Task 3: `deck rapid switch ends on last`)
2. **รหัสห้องมีช่องว่าง วางมาจากแชต หรือเป็นเลขไทย** — `" 4829 "` ต้องผ่าน, `"๔๘๒๙"` แปลงเป็น `"4829"`, `"48a9"` แสดงข้อความผิด (เทสต์ใน Task 1 และ Task 4)
3. **กลับจากเกมมาล็อบบี้** — ไม่มี motion ซ้อน และเวทียังแสดงเด็คที่เลือกไว้ (เทสต์ใน Task 6: `T2 restarts on return` และ `deck kept after return`)
4. **จอแคบ 320px** — ไม่มีการเลื่อนแนวนอน แฟ้มและแถบชื่อเด็คไม่ล้น (เทสต์ใน Task 2: `no horizontal scroll at 320 and 390`)
5. **ภาพการ์ดโหลดไม่ขึ้นหรือช้า** — ตารางไม่กระโดด (มี `width`/`height`) และมี `alt` เป็นชื่อการ์ด (เทสต์ใน Task 2: `gallery images sized and labelled`)

---

### Task 0: เครื่องมือเทสต์และ baseline

**Files:**
- Create: `package.json` (ผ่าน `npm init -y`, ตั้ง `"private": true`)
- Modify: `.gitignore` (เพิ่ม `node_modules/`)

- [ ] **Step 1:** `npm i -D playwright` แล้ว `npx playwright install chromium`
- [ ] **Step 2:** รัน baseline ทั้ง 4 ชุดและจดผลไว้ใน commit message
  Run: `node tests/lobby.spec.js; node tests/ui.spec.js; node tests/choice.spec.js; node tests/panel.spec.js`
  Expected: ผ่านเกือบทั้งหมด · ข้อ memory (`T7`) อาจคืนค่า -1 บน Windows เพราะใช้ `ps` — บันทึกว่าเป็นข้อจำกัดของเครื่อง ไม่ใช่บั๊ก
- [ ] **Step 3: Commit** `chore: add playwright dev dependency for local tests`

---

### Task 1: ข้อมูลล็อบบี้ (`js/lobby.js` ส่วน data)

**Files:**
- Create: `js/lobby.js`
- Modify: `index.html` (เพิ่ม `<script src="js/lobby.js"></script>` หลัง `js/holo.js` ก่อน `vendor/gsap.min.js`)
- Test: `tests/lobby.spec.js` (เขียนใหม่ทั้งไฟล์ เก็บ helper เดิม: `openPage`, `frameStats`, `opacityAll`, runner)

**Interfaces:**
- Produces: `window.LobbyData` =
  - `rarityCounts(): { Legend: number, SR: number, R: number, N: number, total: number }`
  - `DECKS: [{ key: 'jit'|'nuea'|'doom', leaderId: 'L01'|'L02'|'L03', name: string, style: string }]` (ชื่อและประโยคสไตล์ตาม spec §5.2)
  - `deckInfo(leaderId): { leader: Card, cards: Card[] /* ไม่ซ้ำ ไม่รวมลีดเดอร์ */, total: 21, hp: number }`
  - `galleryCards(): Card[]` — Legend ทั้งหมดก่อน แล้ว SR ตามลำดับใน DB รวม 9 ใบ
  - `normalizeRoomCode(raw: string): string | null` — trim, แปลงเลขไทย ๐–๙ เป็น 0–9, คืนค่าเมื่อเป็นเลข 4 หลักพอดี ไม่งั้น `null`

- [ ] **Step 1: เขียนเทสต์ที่ล้ม**

```js
test('D1 rarity counts match database', async b => {
  const p = await openPage(b, { seen: true });
  const c = await p.evaluate(() => LobbyData.rarityCounts());
  assert(c.Legend === 5 && c.SR === 12 && c.R === 17 && c.N === 5 && c.total === 39, JSON.stringify(c));
});
test('D2 deck info per leader', async b => {
  const p = await openPage(b, { seen: true });
  const d = await p.evaluate(() => ['L01','L02','L03'].map(id => { const i = LobbyData.deckInfo(id); return [i.leader.id, i.cards.length, i.total, i.hp]; }));
  assert(JSON.stringify(d) === JSON.stringify([['L01',10,21,6],['L02',10,21,6],['L03',16,21,6]]), JSON.stringify(d));
});
test('D3 room code normalize', async b => {
  const p = await openPage(b, { seen: true });
  const r = await p.evaluate(() => [' 4829 ', '๔๘๒๙', '48a9', '', '12345'].map(LobbyData.normalizeRoomCode));
  assert(JSON.stringify(r) === JSON.stringify(['4829','4829',null,null,null]), JSON.stringify(r));
});
```

- [ ] **Step 2:** Run `node tests/lobby.spec.js D` → Expected: FAIL `LobbyData is not defined`
- [ ] **Step 3:** เขียน `window.LobbyData` ใน `js/lobby.js` (IIFE เหมือนไฟล์อื่น) · `deckInfo` ใช้ `getDefaultDeckForLeader(leaderId)` แล้วกรองซ้ำด้วย `Set`
- [ ] **Step 4:** Run `node tests/lobby.spec.js D` → Expected: PASS 3/3
- [ ] **Step 5: Commit** `feat(lobby): add lobby data helpers from card database`

---

### Task 2: โครงหน้าและสไตล์ 6 ส่วน

**Files:**
- Modify: `index.html` (แทนบล็อก `<div id="lobby-screen">…</div>` ทั้งหมด · เพิ่ม `<link rel="stylesheet" href="css/lobby.css">` หลัง `css/panel-motion.css`)
- Create: `css/lobby.css`
- Modify: `css/style.css` (ลบกฎ `.lobby-wrapper`, `.lobby-navbar`, `.lobby-logo`, `.lobby-nav-links`, `.lobby-hero`, `.hero-*`, `.btn-lobby-*`, `.lobby-feature-grid`, `.feature-*`, `.fan-*` บรรทัดราว 632–760)
- Modify: `css/lobby-motion.css` (ลบกฎที่ชี้ `.fan-card`, `.feature-card`, `.hero-card-fan`)
- Modify: `js/lobby.js` (ส่วน render)
- Test: `tests/lobby.spec.js`

**Interfaces:**
- Consumes: `LobbyData` (Task 1), `createCardElement(card)` จาก `game.js` (ได้การ์ดที่ holo ตกแต่งแล้ว)
- Produces (DOM ที่ Task 3–6 ใช้):
  - `section#lb-hero` มี `h1.lb-title > span.lb-line` (หนึ่ง span ต่อบรรทัด), `p.lb-lead`, `nav.lb-folders > a.lb-folder[href="#lb-stats|#lb-decks|#lb-gallery|#lb-how"]`, `div.lb-folder-front` (มี `#btn-lobby-pvp`, `#btn-lobby-bot`, `form#lb-join`, `div.lb-leaders`)
  - `section#lb-stats` (`h2`, `.lb-total`, `table.lb-receipt`)
  - `section#lb-decks` (`h2`, `.lb-deck-list > button.lb-deck-btn[data-leader]`, `.lb-stage` ที่มี `.lb-stage-cards`, `.lb-stage-meta`, `button#lb-play-deck`, `a#lb-deck-all`)
  - `section#lb-gallery` (`h2` ในช่องแรก, `.lb-tile` ภาพ/คำ, `a#lb-gallery-all`)
  - `section#lb-how` (`h2`, `.lb-bar > .lb-seg` ×3)
  - `footer#lb-footer` (`button#lb-footer-cta`, ลิงก์ GitHub)
  - เมนูบน: `a#nav-deck` "จัดเด็ค" ซ้าย, `a#nav-cards` "คลังการ์ด" ขวา
  - `LobbyView.render()` เติมตัวเลข ใบเสร็จ แกลเลอรี และการ์ดลีดเดอร์จาก `LobbyData` · HTML มีค่าตั้งต้น (39, 5/12/17/5) เผื่อ JS ไม่ทำงาน

- [ ] **Step 1: เขียนเทสต์ที่ล้ม**

```js
test('S1 one h1 and every section titled', async b => {
  const p = await openPage(b, { seen: true });
  const v = await p.evaluate(() => ({ h1: document.querySelectorAll('#lobby-screen h1').length,
    untitled: ['#lb-stats','#lb-decks','#lb-gallery','#lb-how'].filter(s => !document.querySelector(s + ' h2')) }));
  assert(v.h1 === 1 && v.untitled.length === 0, JSON.stringify(v));
});
test('S2 receipt sums to 39', async b => {
  const p = await openPage(b, { seen: true });
  const v = await p.evaluate(() => [...document.querySelectorAll('.lb-receipt tbody td.num')].map(t => +t.textContent));
  assert(v.reduce((a, x) => a + x, 0) === 39 && v.length === 4, JSON.stringify(v));
});
test('S3 no horizontal scroll at 320 and 390', async b => {
  for (const width of [320, 390]) { const p = await openPage(b, { seen: true, viewport: { width, height: 800 } });
    assert(!(await p.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)), 'scroll at ' + width); }
});
test('S4 gallery images sized and labelled', async b => {
  const p = await openPage(b, { seen: true });
  const bad = await p.evaluate(() => [...document.querySelectorAll('#lb-gallery img')].filter(i => !i.getAttribute('width') || !i.getAttribute('height') || !i.alt).length);
  assert(bad === 0, bad + ' images missing size/alt');
});
test('S5 house rules in lobby', async b => {
  const p = await openPage(b, { seen: true });
  const v = await p.evaluate(() => [...document.querySelectorAll('#lobby-screen *')].filter(e => !e.closest('.card') && !e.closest('canvas')).filter(e => {
    const s = getComputedStyle(e); return s.backgroundImage.includes('gradient') || s.backdropFilter !== 'none' || /\p{Extended_Pictographic}/u.test(e.childNodes[0]?.nodeValue || ''); }).map(e => e.className));
  assert(v.length === 0, JSON.stringify(v.slice(0, 5)));
});
test('S6 no console errors', async b => {
  const p = await openPage(b, { seen: true }); await p.waitForTimeout(500);
  assert(p.errors.length === 0, p.errors.join('\n'));
});
```

- [ ] **Step 2:** Run `node tests/lobby.spec.js S` → Expected: FAIL (ยังไม่มี section ใหม่)
- [ ] **Step 3:** เขียน HTML ตาม spec §5.0–5.5 · ไอคอนดาบไขว้ wordmark เป็น SVG inline
  · แถบแฟ้มใช้ `clip-path: polygon()` · แฟ้มหน้าสุดสี `--lb-gold`
- [ ] **Step 4:** เขียน `css/lobby.css` — tokens บน `#lobby-screen`, กริด 12 คอลัมน์, breakpoints 768/1024, ลำดับพื้นตามตาราง spec §4
  · สีระดับความหายากบนพื้น paper ใช้ค่าที่ contrast ≥ 4.5:1 กับ `--lb-paper`
- [ ] **Step 5:** เขียน `LobbyView.render()` ใน `js/lobby.js` · แกลเลอรีวางช่องคำ LEGEND/SR/R/N ทุก 3 ช่องภาพ · การ์ดลีดเดอร์และแกลเลอรีสร้างด้วย `createCardElement` · ภาพ `loading="lazy"` ยกเว้นลีดเดอร์ใน Hero
- [ ] **Step 6:** ลบ CSS เก่าใน `style.css` และ `lobby-motion.css`
- [ ] **Step 7:** Run `node tests/lobby.spec.js S` → Expected: PASS 6/6
- [ ] **Step 8: Commit** `feat(lobby): rebuild lobby as colour-chapter long page`

---

### Task 3: ส่วนเลือกเด็ค (live thing)

**Files:**
- Modify: `js/lobby.js`, `css/lobby.css`, `index.html` (dialog เลือกโหมด `#lb-mode-dialog` ใช้ `<dialog>` พร้อมปุ่ม `#lb-mode-pvp`, `#lb-mode-bot`, `#lb-mode-close`)
- Test: `tests/lobby.spec.js`

**Interfaces:**
- Consumes: `LobbyData.deckInfo`, `LobbyData.DECKS`, DOM จาก Task 2, `openZoneViewerModal(title, cards, null)`, `openAISetupModal()`
- Produces: `LobbyView.selectDeck(leaderId: string): void` (อัปเดต `aria-pressed`, ตั้ง `--stage` บน `.lb-stage`, เติมการ์ด, ส่ง event `lobby:deck` บน `#lb-decks` ให้ motion ใช้) · `LobbyView.selectedDeck(): string`

- [ ] **Step 1: เขียนเทสต์ที่ล้ม**

```js
test('K1 deck switch updates stage', async b => {
  const p = await openPage(b, { seen: true });
  await p.click('.lb-deck-btn[data-leader="L02"]'); await p.waitForTimeout(600);
  const v = await p.evaluate(() => ({ pressed: [...document.querySelectorAll('.lb-deck-btn')].map(x => x.getAttribute('aria-pressed')),
    stage: getComputedStyle(document.querySelector('.lb-stage')).getPropertyValue('--stage').trim(), n: document.querySelectorAll('.lb-stage-cards .card').length }));
  assert(JSON.stringify(v.pressed) === '["false","true","false"]' && v.stage === '#6b2430' && v.n === 11, JSON.stringify(v));
});
test('K2 deck rapid switch ends on last', async b => {
  const p = await openPage(b, { seen: true });
  for (const id of ['L02','L03','L01','L03']) await p.click(`.lb-deck-btn[data-leader="${id}"]`);
  await p.waitForTimeout(900);
  const ids = await p.evaluate(() => [...document.querySelectorAll('.lb-stage-cards .card')].length);
  assert(ids === 17, 'cards on stage: ' + ids);
});
test('K3 play this deck sets config without saving', async b => {
  const p = await openPage(b, { seen: true });
  const before = await p.evaluate(() => localStorage.getItem('my_card_game_deck'));
  await p.click('.lb-deck-btn[data-leader="L03"]'); await p.click('#lb-play-deck'); await p.waitForTimeout(300);
  const v = await p.evaluate(() => ({ leader: currentDeckConfig.leaderId, n: currentDeckConfig.mainDeck.length,
    saved: localStorage.getItem('my_card_game_deck'), open: document.getElementById('lb-mode-dialog').open }));
  assert(v.leader === 'L03' && v.n === 20 && v.saved === before && v.open, JSON.stringify(v));
});
test('K4 mode dialog routes to bot setup', async b => {
  const p = await openPage(b, { seen: true });
  await p.click('#lb-play-deck'); await p.click('#lb-mode-bot'); await p.waitForTimeout(400);
  assert(await p.evaluate(() => getComputedStyle(document.getElementById('ai-setup-modal')).display !== 'none'), 'ai setup not open');
});
```

- [ ] **Step 2:** Run `node tests/lobby.spec.js K` → Expected: FAIL
- [ ] **Step 3:** เขียน `selectDeck` (การ์ดเรียงเหลื่อม ลีดเดอร์ใหญ่ แสดงชื่อลีดเดอร์ HP 21 ใบ และประโยคสไตล์) · ปุ่ม `#lb-play-deck` ตั้ง `currentDeckConfig = { leaderId, mainDeck: [...getDefaultDeckForLeader(leaderId)] }` แล้ว `showModal()` · `#lb-deck-all` เปิด Zone Viewer ด้วย `deckInfo(id)` (ลีดเดอร์ + การ์ด) · มือถือใช้ `scroll-snap` กับ `.lb-deck-list`
- [ ] **Step 4:** Run `node tests/lobby.spec.js K` → Expected: PASS 4/4
- [ ] **Step 5: Commit** `feat(lobby): add live deck picker with play-this-deck flow`

---

### Task 4: ฟอร์มเข้าห้องบน Hero

**Files:**
- Modify: `js/lobby.js`, `css/lobby.css`
- Test: `tests/lobby.spec.js`

**Interfaces:**
- Consumes: `LobbyData.normalizeRoomCode`, `joinPvpRoomAsGuest(code)` จาก `game.js`
- Produces: `form#lb-join` มี `label[for="lb-join-code"]` "มีรหัสห้องจากเพื่อน?", `input#lb-join-code` (`inputmode="numeric"`, `maxlength="4"`, `autocomplete="off"`), `button[type=submit]` "เข้าร่วม", `p#lb-join-error` (`aria-live="polite"`)

- [ ] **Step 1: เขียนเทสต์ที่ล้ม**

```js
test('J1 empty or bad code shows error, no join', async b => {
  const p = await openPage(b, { seen: true });
  await p.evaluate(() => { window.__joined = null; window.joinPvpRoomAsGuest = c => { window.__joined = c; }; });
  for (const code of ['', '48a9']) { await p.fill('#lb-join-code', code); await p.click('#lb-join button[type=submit]');
    assert(await p.evaluate(() => document.getElementById('lb-join-error').textContent.trim().length > 0 && window.__joined === null), 'no error for ' + JSON.stringify(code)); }
});
test('J2 valid code joins directly', async b => {
  const p = await openPage(b, { seen: true });
  await p.evaluate(() => { window.joinPvpRoomAsGuest = c => { window.__joined = c; }; });
  await p.fill('#lb-join-code', '๔๘๒๙'); await p.press('#lb-join-code', 'Enter');
  assert(await p.evaluate(() => window.__joined === '4829' && document.getElementById('pvp-room-modal').style.display !== 'flex'), 'did not join');
});
```

- [ ] **Step 2:** Run `node tests/lobby.spec.js J` → Expected: FAIL
- [ ] **Step 3:** submit handler: `preventDefault`, `normalizeRoomCode`, ถ้า `null` แสดง "กรอกรหัสห้องเป็นเลข 4 หลัก" แล้ว focus ช่อง · ถ้าถูกเรียก `window.joinPvpRoomAsGuest(code)` (เรียกผ่าน `window` ให้เทสต์แทนที่ได้)
- [ ] **Step 4:** Run `node tests/lobby.spec.js J` → Expected: PASS 2/2
- [ ] **Step 5: Commit** `feat(lobby): join a room straight from the hero`

---

### Task 5: ต่อปุ่มเดิมใน `game.js` + holo tilt + แก้เทสต์ชุดอื่น

**Files:**
- Modify: `js/game.js` — `setupLobbyEvents()` (ราวบรรทัด 5855–5895): ลบ handler `card-menu-deckbuilder`, `card-menu-cardlist`, `card-menu-preset`, `nav-play` · เพิ่ม `#lb-footer-cta` และ `#lb-mode-pvp` → เปิด `#pvp-room-modal` · `#lb-gallery-all` → `openCardsFn`
- Modify: `js/holo.js` — แยก `bindHandTilt` เป็น `bindTilt(container: Element, maxDeg: number)` ใช้กับ `#player-hand` (12) เหมือนเดิม และ export `window.HoloTilt = { bind: bindTilt }`
- Modify: `js/lobby.js` — เรียก `HoloTilt.bind(document.querySelector('.lb-leaders'), 10)` และกับ `#lb-gallery` ถ้า `window.HoloTilt` มี
- Modify: `tests/panel.spec.js` — `lobbyOk` ใช้ `.lb-title`, `#lb-hero nav.lb-folders`, `#btn-lobby-pvp`, `.lb-folder-front` แทน selector เก่า · `#card-menu-deckbuilder` → `#nav-deck` · `#card-menu-cardlist` → `#nav-cards`
- Test: `tests/lobby.spec.js`, `tests/panel.spec.js`, `tests/ui.spec.js`, `tests/choice.spec.js`

- [ ] **Step 1: เขียนเทสต์ที่ล้ม**

```js
test('W1 old menu cards gone, nav still opens tools', async b => {
  const p = await openPage(b, { seen: true });
  assert(await p.evaluate(() => !document.querySelector('[id^="card-menu-"]')), 'old menu cards still in DOM');
  await p.click('#nav-cards'); await p.waitForTimeout(500);
  assert(await p.evaluate(() => getComputedStyle(document.getElementById('zone-viewer-modal')).display !== 'none'), 'card list did not open');
});
test('W2 footer CTA opens pvp', async b => {
  const p = await openPage(b, { seen: true });
  await p.click('#lb-footer-cta'); await p.waitForTimeout(400);
  assert(await p.evaluate(() => document.getElementById('pvp-room-modal').style.display === 'flex'), 'pvp not open');
});
test('W3 leader cards tilt on mouse', async b => {
  const p = await openPage(b, { seen: true }); const bb = await p.locator('.lb-leaders .card').first().boundingBox();
  await p.mouse.move(bb.x + bb.width * .9, bb.y + bb.height * .2); await p.waitForTimeout(100);
  assert(await p.evaluate(() => document.querySelector('.lb-leaders .card').style.getPropertyValue('--ry') !== ''), 'no tilt');
});
```

- [ ] **Step 2:** Run `node tests/lobby.spec.js W` → Expected: FAIL
- [ ] **Step 3:** ทำการแก้ไขตาม Files ข้างบน
- [ ] **Step 4:** Run `node tests/lobby.spec.js W` → PASS 3/3 · แล้ว `node tests/panel.spec.js`, `node tests/ui.spec.js`, `node tests/choice.spec.js` → Expected: ผ่านเท่า baseline ของ Task 0
- [ ] **Step 5: Commit** `feat(lobby): wire new lobby controls and card tilt`

---

### Task 6: Motion ใหม่ (`js/lobby-motion.js`)

**Files:**
- Modify: `js/lobby-motion.js` (เขียนใหม่ทั้งไฟล์) · `css/lobby-motion.css` (mask ของ `.lb-line`, สถานะ `lm-pre`)
- Test: `tests/lobby.spec.js`

**Interfaces:**
- Consumes: DOM จาก Task 2 (`.lb-line`, `.lb-lead`, `.lb-folder`, `section[id^="lb-"]`), event `lobby:deck` จาก Task 3
- Produces (คงเดิม): `window.LobbyMotion = { start(): void, stop(): void, isRunning(): boolean, isPaused(): boolean, _particleCount(): number, _particlesActive(): boolean }` · `sessionStorage['lm-seen']` สำหรับ intro สั้น · `.lm-ripple` ไม่ใช้แล้ว (ไม่ต้องสร้าง)

ค่าที่ spec กำหนด: บรรทัดหัวข้อ `yPercent 110 → 0` 0.9s `power4.out` บรรทัดที่สอง +0.11s · แฟ้ม `y 80 → 0` stagger 0.07 · เข้าส่วน `IntersectionObserver` threshold 0.2 → `y 24 → 0` + `autoAlpha` stagger 0.08 ครั้งเดียว · สลับเด็ค: การ์ดเดิม `autoAlpha 0` 0.2s, การ์ดใหม่ `y 40 → 0` stagger 0.05, `--stage` 0.4s, `overwrite: 'auto'` · ปุ่มกด `scale 0.97` ≤ 80ms, hover `y -4` ด้วย `gsap.quickTo` · ดาว canvas เดิม จำกัดในกล่อง `#lb-hero` · reduced motion: `gsap.matchMedia()` ตั้งสถานะสุดท้ายทันที ดาวนิ่ง

- [ ] **Step 1: ย้ายเทสต์ motion เดิมมาไฟล์ใหม่** — T1, T2 ทั้งหมด, T3 (`intro finishes by 2s`, `skip on click`, `bot button single click during intro`, `short on return`, `reduced motion`, `intro smooth`), T4 (`only transform/opacity`, `idle is smooth`), T5 (`button press is fast`, `buttons still work`, `touch has no tilt` กับ `.lb-leaders`), T6, T7
  · เปลี่ยน `INTRO_PARTS` เป็น `'.lb-line, .lb-lead, .lb-folder, #btn-lobby-pvp, #btn-lobby-bot'` · ลบเทสต์ fan tilt และ ripple
- [ ] **Step 2: เพิ่มเทสต์ใหม่**

```js
test('M1 sections reveal once on scroll', async b => {
  const p = await openPage(b, { seen: true }); await p.waitForTimeout(800);
  await p.locator('#lb-how').scrollIntoViewIfNeeded(); await p.waitForTimeout(900);
  const o = await opacityAll(p, '#lb-how h2, #lb-how .lb-seg');
  assert(o.every(x => x > .99), JSON.stringify(o));
});
test('M2 content visible without gsap', async b => {
  const p = await openPage(b, { seen: true, blockGsap: true }); await p.waitForTimeout(1700);
  const o = await opacityAll(p, '#lobby-screen h1, #lobby-screen h2, #btn-lobby-pvp');
  assert(o.every(x => x > .99), JSON.stringify(o));
});
test('M3 deck kept after return', async b => {
  const p = await openPage(b, { seen: true });
  await p.click('.lb-deck-btn[data-leader="L02"]'); await p.click('#btn-lobby-bot'); await p.click('#btn-start-ai-match'); await p.waitForTimeout(500);
  await p.evaluate(() => returnToLobbyScreen()); await p.waitForTimeout(800);
  assert(await p.evaluate(() => LobbyView.selectedDeck() === 'L02' && LobbyMotion.isRunning()), 'deck or motion lost');
});
```

  `openPage` รับ `opts.blockGsap` → `ctx.route('**/gsap.min.js', r => r.abort())` · กลับล็อบบี้ด้วย `returnToLobbyScreen()` (`game.js:1179`)
- [ ] **Step 3:** Run `node tests/lobby.spec.js T` และ `M` → Expected: FAIL ส่วนที่อ้าง DOM ใหม่
- [ ] **Step 4:** เขียน `lobby-motion.js` ใหม่ตามค่าข้างบน · ใช้ `gsap.context()` ภายใน `start()` และ `ctx.revert()` ใน `stop()` · pause/resume ใต้ modal ใช้กลไกเดิม (`MutationObserver` บน modal ที่ไฟล์เดิมใช้)
- [ ] **Step 5:** Run `node tests/lobby.spec.js` → Expected: PASS ทั้งไฟล์ (ยกเว้นข้อ memory ที่บันทึกใน Task 0) · แล้วรัน `ui`, `choice`, `panel` อีกครั้ง
- [ ] **Step 6: Commit** `feat(lobby): new lobby motion with masked headline and chapter reveals`

---

### Task 7: ตรวจด้วย design-taste-frontend, เก็บงาน, STATUS

**Files:**
- Modify: ไฟล์ในล็อบบี้ตามที่ inspector พบ · `STATUS.md` (ไฟล์ใหม่ `css/lobby.css`, `js/lobby.js`, จำนวนเทสต์ใหม่, วิธีรัน)

- [ ] **Step 1:** `node <skill>/scripts/lint.mjs index.html css/lobby.css js/lobby.js` → แก้จน 0 FAIL
- [ ] **Step 2:** `node <skill>/scripts/inspect.mjs index.html --out .taste-skill/after` → แก้จน 0 FAIL ที่ 1440/768/390
  ใช้ `--allow` เฉพาะกฎที่ชนกับข้อยกเว้น (holo บนการ์ด, ดาวใน Hero) และจดไว้ใน STATUS
- [ ] **Step 3:** เปิดภาพหน้าจอทุกขนาด วิจารณ์ตาม `references/critique.md` §4 แก้ปัญหาใหญ่ 3 ข้อ แล้ว inspect ใหม่ (ไม่เกิน 3 รอบ)
- [ ] **Step 4:** เปิด `index.html` แบบ `file://` ด้วยเบราว์เซอร์ในแอป กดทุกปุ่มในล็อบบี้ 1 รอบ
- [ ] **Step 5:** รันทั้ง 4 ชุดเทสต์ → Expected: ผ่านทั้งหมด (ยกเว้นข้อ memory บน Windows)
- [ ] **Step 6:** อัปเดต `STATUS.md`
- [ ] **Step 7: Commit** `docs: update status for lobby redesign`
- [ ] **Step 8:** **ถามผู้ใช้ก่อน push** ไป `origin/main` (GitHub Pages จะ deploy ทันที)
