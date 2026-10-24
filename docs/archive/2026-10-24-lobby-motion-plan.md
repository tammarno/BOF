# Lobby Motion (BOF v0.3) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** เพิ่ม motion หน้าล็อบบี้ (ฉากเปิด → พุ่งเข้าที่ → พักหายใจ + ลูป, ปุ่มไว, การ์ดพัดเอียงตามเมาส์, อนุภาค) โดยไม่แตะตรรกะเกม

**Architecture:** ไฟล์ `lobby-motion.js` ไฟล์เดียวแบ่งเป็นฟังก์ชันตามหน้าที่ ทั้งหมดอยู่ใน `gsap.context()` เดียวเพื่อหยุด/ล้างได้ทีเดียว ตัวเฝ้าการแสดงผลของ `#lobby-screen` (MutationObserver บน style) เป็นตัวเปิด/ปิด สถานะเริ่มต้นและเลเยอร์อยู่ใน `lobby-motion.css`

**Tech Stack:** HTML/CSS/JS ล้วน, GSAP 3.12.5 (เก็บใน `vendor/`), ทดสอบด้วย Playwright (Node) ในเครื่องพัฒนา

**Spec:** `docs/specs/2026-10-24-lobby-motion-design.md`

## Global Constraints

- ขยับด้วย transform และ opacity เท่านั้น
- ห้าม backdrop-filter / mix-blend-mode กับสิ่งที่ขยับหรืออยู่บนสิ่งที่ขยับ
- อนุภาค ≤ 30 จุด (จอกว้าง < 768px: ≤ 15) ใน canvas เดียว
- เมาส์ตามใช้ `gsap.quickTo`
- ไม่แก้ `game.js`; id ปุ่มและข้อความเดิมใน `index.html` คงอยู่
- ทดสอบที่ viewport 1316×620, deviceScaleFactor 1.25, รูปจริง
- เกณฑ์: ≤ 17 ms/เฟรม (p95), หน่วยความจำเรนเดอร์ไม่โตต่อเนื่องใน 30 วิ
- ค่าจังหวะ: ฉากเปิด 0–0.5 วิ, พุ่งเข้าที่ 0.5–1.6 วิ, ฉากสั้น 0.6 วิ, stagger การ์ด 0.08 วิ, ปุ่มชี้ 0.12 วิ / ยก 3px / ขยาย 1.04, กด 0.06 วิ / 0.96, ลอยการ์ด 4–6 วิ, ปุ่มหายใจ 3 วิ, ดาบ 4 วิ, ชื่อเกม 6 วิ, ไอคอนเมนู 5–7 วิ

## Review Focus

- กดปุ่ม "เล่นกับบอท" ระหว่างฉากเปิด → ข้ามฉากและเปิดหน้าตั้งค่าบอททันที (คลิกเดียว ไม่ต้องกดสองครั้ง)
- เข้าเกม → กลับล็อบบี้ → เข้าเกมซ้ำหลายรอบ → ไม่มี tween/ลูปซ้อน และหน่วยความจำไม่โต
- ปรับขนาดหน้าต่างระหว่างพักหายใจ → canvas อนุภาคปรับขนาดตาม ไม่ยืด/เบลอ
- รูปการ์ดพัดยังโหลดไม่เสร็จตอนฉากเปิด → การ์ดยังบินเข้าที่ได้ ไม่กระโดด
- สลับแท็บกลับมา → ลูปเล่นต่อ ไม่มีแอนิเมชันค้างกลางทาง

---

### Task 1: ติดตั้ง GSAP + ไฟล์ตั้งต้น + ชุดทดสอบ

**Files:**
- Create: `vendor/gsap.min.js` (จาก npm `gsap@3.12.5/dist/gsap.min.js`)
- Create: `lobby-motion.js`, `lobby-motion.css`
- Modify: `index.html` (เพิ่ม `<link lobby-motion.css>` หลัง holo.css; `<script vendor/gsap.min.js>` และ `<script lobby-motion.js>` หลัง holo.js)
- Modify: `holo.css` (`.lobby-navbar`, `.btn-lobby-secondary`: ลบ backdrop-filter ใช้ `background: rgba(22,26,52,.92)`)
- Test: `tests/lobby.spec.js` (Playwright, ไม่ส่งขึ้นเกม)

**Interfaces:**
- Produces: `window.LobbyMotion = { start(opts?: {short?: boolean}), stop(), isRunning(): boolean }`

- [ ] **Step 1: เขียนเทสต์** `loads gsap and LobbyMotion`: `typeof gsap === 'object'`, `typeof LobbyMotion.start === 'function'`, ไม่มี pageerror; และ `navbar has no backdrop-filter`: computed `backdropFilter === 'none'`
- [ ] **Step 2: รัน** `node tests/lobby.spec.js` → FAIL (LobbyMotion undefined)
- [ ] **Step 3: ทำ** ติดตั้งไฟล์ ใส่ script/link และโครง `LobbyMotion` ว่าง (start/stop/isRunning)
- [ ] **Step 4: รัน** → PASS
- [ ] **Step 5: บันทึก** ส่งไฟล์ลงเครื่อง

### Task 2: ตัวเปิด/ปิดอัตโนมัติ

**Files:** Modify `lobby-motion.js` · Test `tests/lobby.spec.js`

**Interfaces:**
- Consumes: `LobbyMotion` จาก Task 1
- Produces: `ctx` (gsap.context) ภายใน; `start()` สร้าง context ใหม่, `stop()` เรียก `ctx.revert()` + หยุด canvas; ตัวเฝ้าเรียก start เมื่อ `#lobby-screen` แสดง, stop เมื่อซ่อน; `visibilitychange` → `gsap.globalTimeline.pause()/resume()` เฉพาะตอน running

- [ ] **Step 1: เทสต์** `stops when leaving lobby`: คลิก `#btn-lobby-bot` → `#btn-start-ai-match` → `LobbyMotion.isRunning() === false` และ `gsap.globalTimeline.getChildren().length === 0`; `restarts on return`: โหลดใหม่ → `isRunning() === true`; `no stacking`: เรียก start สองครั้ง → จำนวน children เท่ากับเรียกครั้งเดียว
- [ ] **Step 2: รัน** → FAIL
- [ ] **Step 3: ทำ** ตามสัญญาด้านบน (start ซ้ำ = stop ก่อน)
- [ ] **Step 4: รัน** → PASS
- [ ] **Step 5: บันทึก**

### Task 3: ฉากเปิด + พุ่งเข้าที่ + ข้ามฉาก

**Files:** Modify `lobby-motion.js`, `lobby-motion.css`, `index.html` (ห่อดาบ ⚔️ เป็น `<span class="lm-logo"><i class="lm-sword l">…</i><i class="lm-sword r">…</i></span>`, ห่อตัวอักษร subtitle เป็น `<span class="lm-ch">` ด้วย JS ไม่แก้ HTML) · Test

**Interfaces:**
- Produces: `buildIntro(short: boolean): gsap.core.Timeline`; overlay `#lm-intro`; `skipIntro()` = `tl.progress(1)`; แฟล็ก `sessionStorage['lm-seen']` (ห่อ try/catch) กำหนด short

- [ ] **Step 1: เทสต์** `intro finishes ~1.6s`: หลัง 2 วิ ทุก `.fan-card`, `.feature-card`, ปุ่ม มี opacity 1 และ `#lm-intro` ถูกซ่อน; `skip on click`: คลิกที่ 0.3 วิ → ภายใน 100 ms ทุกชิ้น opacity 1; `bot button single click during intro`: คลิก `#btn-lobby-bot` ที่ 0.3 วิ → `#ai-setup-modal` (หรือ modal ตั้งค่าบอทเดิม) แสดง; `short on return`: sessionStorage มีแฟล็ก → เข้าที่ภายใน 0.8 วิ ไม่มี `#lm-intro`; `reduced motion`: emulate reduce → ทุกชิ้น opacity 1 ทันที, `isRunning()` false
- [ ] **Step 2: รัน** → FAIL
- [ ] **Step 3: ทำ** timeline ตามตารางในสเปกส่วนที่ 2 (ใช้ `from`/stagger; การ์ดพัดใช้ `x: 400, rotation: 0` → ค่าพัดเดิมจาก CSS ผ่าน `gsap.from`) ข้ามฉากด้วย pointerdown/keydown ช่วง capture ที่ไม่ preventDefault
- [ ] **Step 4: รัน** → PASS + ภาพหน้าจอที่ 0.3/0.9/1.6 วิ
- [ ] **Step 5: บันทึก**

### Task 4: พักหายใจ + ลูปโลโก้/ไอคอน

**Files:** Modify `lobby-motion.js`, `lobby-motion.css`, `index.html` (ห่อไอคอนกล่องเมนูและไอคอนบนปุ่มด้วย `<span class="lm-ico">`) · Test

**Interfaces:**
- Consumes: เรียกต่อท้าย intro timeline
- Produces: `startIdle(): void` สร้างลูป `repeat:-1` ทั้งหมดใน ctx

- [ ] **Step 1: เทสต์** `idle loops running`: หลัง 2.5 วิ มี tween repeat −1 ≥ 8 ตัว; `idle is smooth`: วัด rAF 3 วิ → p95 ≤ 17 ms; `only transform/opacity`: ทุก tween ใน ctx มีแต่คีย์ใน `{x,y,rotation,rotationX,rotationY,scale,scaleX,scaleY,opacity,xPercent,yPercent,backgroundPosition*}` — ยกเว้นชื่อเกมกวาดแสง ให้ทำด้วย pseudo-element เลื่อน x แทน backgroundPosition (ดังนั้นห้าม backgroundPosition)
- [ ] **Step 2: รัน** → FAIL
- [ ] **Step 3: ทำ** ลูปตามสเปกส่วนที่ 3 (ค่าเวลาใน Global Constraints; สุ่ม delay ให้ไม่พร้อมกัน)
- [ ] **Step 4: รัน** → PASS
- [ ] **Step 5: บันทึก**

### Task 5: ปุ่ม + กล่องเมนู + การ์ดพัดตามเมาส์

**Files:** Modify `lobby-motion.js`, `lobby-motion.css` · Test

**Interfaces:**
- Produces: `bindButtons()`, `bindFan()`; ใช้ `gsap.quickTo(fan, 'rotationY'|'rotationX', {duration:.5, ease:'power3'})`; วงแสงคลิก = div `.lm-ripple` ที่ลบตัวเองหลังจบ

- [ ] **Step 1: เทสต์** `button press is fast`: pointerdown บน `#btn-lobby-pvp` → ภายใน 80 ms scale ≤ 0.97; `button still works`: คลิก `#btn-lobby-pvp` → modal PvP เดิมแสดง; `ripples cleaned`: คลิก 10 ครั้ง → หลัง 1 วิ ไม่มี `.lm-ripple`; `fan tilts`: เลื่อนเมาส์ไปมุมขวาของ `.hero-card-fan` → rotationY ของพัด > 0; `fan hover smooth`: วัด 2 วิ ระหว่างเลื่อนเมาส์ → p95 ≤ 17 ms; `touch has no tilt`: hasTouch, pointerType touch → rotationY = 0
- [ ] **Step 2: รัน** → FAIL
- [ ] **Step 3: ทำ** ตามสเปกส่วนที่ 4
- [ ] **Step 4: รัน** → PASS
- [ ] **Step 5: บันทึก**

### Task 6: อนุภาค canvas

**Files:** Modify `lobby-motion.js`, `lobby-motion.css` · Test

**Interfaces:**
- Produces: `startParticles(): void`, `stopParticles(): void` (เรียกใน stop); canvas `#lm-particles` อยู่ใต้เนื้อหา `pointer-events:none`; ใช้ `gsap.ticker.add` ไม่ใช้ rAF ของตัวเอง

- [ ] **Step 1: เทสต์** `particle count`: กว้าง 1316 → จำนวน ≤ 30; กว้าง 600 → ≤ 15; `resize`: เปลี่ยน viewport → `canvas.width === innerWidth*dpr` (ปัดเศษ); `stops`: เข้าเกม → ticker ไม่มี callback ของอนุภาค
- [ ] **Step 2: รัน** → FAIL
- [ ] **Step 3: ทำ** จุดกลมเรืองแสงจาง (วาด radial gradient ไว้ล่วงหน้าบน canvas ย่อยแล้ว drawImage) ลอยขึ้นช้า วนกลับล่างจอ
- [ ] **Step 4: รัน** → PASS
- [ ] **Step 5: บันทึก**

### Task 7: ตรวจรวม + Trello

**Files:** Test `tests/lobby.spec.js`

- [ ] **Step 1: เทสต์รวม** `memory stable`: ล็อบบี้ค้าง 30 วิ → RSS เรนเดอร์ปลาย − ต้น < 50 MB; `round trips`: ล็อบบี้ → เกม → โหลดกลับ ×5 → children timeline หลังหยุด = 0 ทุกรอบ; `no console errors` ตลอดชุด
- [ ] **Step 2: รัน** ทั้งชุด → PASS ทั้งหมด
- [ ] **Step 3:** จับภาพหน้าจอ 4 จังหวะ ส่งให้ผู้พัฒนา
- [ ] **Step 4:** บันทึกการ์ด Trello "ล่าสุด" เป็นเวอร์ชัน 0.3 ไว้บนสุด รูปแบบเดิม (ภาษาทั่วไป, ก่อน/หลัง, วิธีทำ, การทดสอบ)
- [ ] **Step 5:** ส่งไฟล์ทั้งหมดลงเครื่อง
