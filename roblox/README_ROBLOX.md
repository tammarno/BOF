# ⚔️ แบทเทิล ออฟ เฟรน (Battle of Friends) — Roblox Studio Edition

โปรเจกต์เกมการ์ด **แบทเทิล ออฟ เฟรน (BOF)** ที่แปลงจากเวอร์ชันเว็บมาเป็นสคริปต์ **Roblox Luau** แบบครบวงจร 100% พร้อมระบบเซิร์ฟเวอร์ป้องกันการโกง (Server-Authoritative), ลานประลอง 3D อัตโนมัติ, บอท AI 3 ระดับ และโหมดดวลกับเพื่อน (PvP)!

---

## 📁 โครงสร้างไฟล์ในโฟลเดอร์ `roblox/`

| ไฟล์ในโปรเจกต์ | ตำแหน่งวางใน Roblox Studio | ประเภท Script | หน้าที่ |
| :--- | :--- | :--- | :--- |
| `src/ReplicatedStorage/BOF_Shared/CardDatabase.lua` | `ReplicatedStorage > BOF_Shared > CardDatabase` | **ModuleScript** | ฐานข้อมูลการ์ดทั้งหมด 48 ใบ (4 เด็ค: จิต, ขุนเหนือ, วันสิ้นโลก, ไดโน) และตาราง `IMAGE_ASSETS` |
| `src/ReplicatedStorage/BOF_Shared/CardSchema.lua` | `ReplicatedStorage > BOF_Shared > CardSchema` | **ModuleScript** | ตัวตรวจสอบความถูกต้องของสกิลและการ์ดตอนเปิดเซิร์ฟเวอร์ |
| `src/ReplicatedStorage/BOF_Shared/GameEngine.lua` | `ReplicatedStorage > BOF_Shared > GameEngine` | **ModuleScript** | กฎเกมทั้งหมด, EffectEngine, อัญเชิญไฮบริด/อนาคต/จุติ/สายลับ, Intercept, Reaction และสมองกลบอท AI |
| `src/ServerScriptService/BOF_Server/init.server.lua` | `ServerScriptService > BOF_Server` | **Script** | สร้าง RemoteEvents, เสกลานประลอง 3D (โต๊ะ PvP + แท่นบอท) ใน Workspace และจัดการห้องแข่งขัน |
| `src/StarterPlayer/StarterPlayerScripts/BOF_Client/init.client.lua` | `StarterPlayer > StarterPlayerScripts > BOF_Client` | **LocalScript** | สร้าง UI ทั้งหมดอัตโนมัติ (ไม่ต้องสร้าง ScreenGui เอง), หน้าต่างค้นหาการ์ดแบบรูปภาพ และคลิกขวาดูข้อมูลการ์ด |

---

## 🚀 วิธีนำเข้าสู่ Roblox Studio (ใช้เวลาเพียง 2 นาที!)

### วิธีที่ 1: คัดลอกวางใน Roblox Studio โดยตรง (ง่ายที่สุด ไม่ต้องลงโปรแกรมเสริม)
1. เปิดโปรแกรม **Roblox Studio** แล้วสร้างแมพใหม่แบบ **Baseplate**
2. ในหน้าต่าง **Explorer** ให้สร้างโฟลเดอร์และสคริปต์ตามลำดับดังนี้:
   - คลิกขวาที่ **`ReplicatedStorage`** > **Insert Object** > **Folder** ตั้งชื่อว่า **`BOF_Shared`**
   - คลิกขวาที่โฟลเดอร์ **`BOF_Shared`** > สร้าง **ModuleScript** จำนวน 3 อัน ตั้งชื่อให้ตรงเป๊ะ:
     1. **`CardDatabase`** (คัดลอกโค้ดจาก `CardDatabase.lua` ไปวางทับ)
     2. **`CardSchema`** (คัดลอกโค้ดจาก `CardSchema.lua` ไปวางทับ)
     3. **`GameEngine`** (คัดลอกโค้ดจาก `GameEngine.lua` ไปวางทับ)
   - คลิกขวาที่ **`ServerScriptService`** > สร้าง **Script** ตั้งชื่อว่า **`BOF_Server`** (คัดลอกโค้ดจาก `BOF_Server/init.server.lua` ไปวางทับ)
   - เปิด **`StarterPlayer`** > คลิกขวาที่ **`StarterPlayerScripts`** > สร้าง **LocalScript** ตั้งชื่อว่า **`BOF_Client`** (คัดลอกโค้ดจาก `BOF_Client/init.client.lua` ไปวางทับ)
3. กดปุ่ม **Play (F5)** ได้เลย! สคริปต์จะสร้างลานประลอง 3D, โต๊ะดวล PvP, แท่นบอท และหน้าจอ UI ให้เองทั้งหมดอัตโนมัติ!

### วิธีที่ 2: ซิงค์ผ่านปลั๊กอิน Rojo (สำหรับสายพัฒนา)
- มีไฟล์ `default.project.json` เตรียมไว้ให้เรียบร้อยที่ `roblox/default.project.json`
- สามารถรันคำสั่ง `rojo serve` ในโฟลเดอร์ `roblox/` แล้วกด Connect ใน Roblox Studio ได้ทันที

---

## 🖼️ วิธีใส่รูปการ์ดจริงใน Roblox (`rbxassetid://`)

> **หมายเหตุ:** แม้คุณยังไม่ได้อัปโหลดรูปการ์ด ตัวเกมก็มีระบบ **Procedural Card Art Fallback** ที่วาดกรอบสีประจำเผ่า ไอคอน ระดับความหายาก ค่าพลัง และข้อความภาษาไทยให้อัตโนมัติ ทำให้เข้าเล่นได้ทันที 100%!

เมื่อต้องการใส่รูปภาพการ์ดจริงจากโฟลเดอร์เว็บ (`image/`):
1. ใน Roblox Studio ไปที่เมนู **View > Asset Manager > Bulk Import** แล้วเลือกรูปการ์ดทั้งหมดจากโฟลเดอร์ `BOF-main/image/`
2. คัดลอก **Asset ID** ของแต่ละรูปมาใส่ในตาราง `CardDatabase.IMAGE_ASSETS` ในไฟล์ `CardDatabase.lua`:
   ```lua
   CardDatabase.IMAGE_ASSETS = {
       ["image/deck1/leader/L01.png"] = "rbxassetid://1234567890", -- เปลี่ยนตัวเลขเป็น Asset ID ของคุณ
       ...
   }
   ```

---

## ✨ ฟีเจอร์เด่นที่ครบถ้วนเหมือนเวอร์ชันเว็บ
- **คลิกขวาดูรายละเอียดการ์ด (`MouseButton2Click`):** คลิกซ้ายที่การ์ดหรือหลีดเดอร์จะใช้สั่งโจมตี/สั่งเล่นการ์ดทันทีโดยไม่เด้งหน้าต่างข้อมูลมารบกวน หากต้องการอ่านสกิลการ์ดใบใดให้ **คลิกขวา** ที่การ์ดใบนั้น
- **ค้นหาการ์ดด้วยรูปภาพจริง (Visual Card Grid):** เวลาใช้สกิลค้นหาการ์ดจากกองการ์ดหรือกองนรก จะแสดงเป็นตารางรูปการ์ดให้คลิกเลือกได้ทันที
- **ลานประลอง 3D ในแมพ:** มีทั้งโต๊ะดวล PvP 3 โต๊ะ (เดินไปกด `E` นั่งครบ 2 คนเริ่มดวลทันที) และแท่นท้าดวลบอททั้ง 4 เผ่า หรือจะกดปุ่ม **"⚔️ เมนู แบทเทิล ออฟ เฟรน"** ด้านบนจอเพื่อดวลจากที่ไหนก็ได้ในแมพ!
