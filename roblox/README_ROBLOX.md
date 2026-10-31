# ⚔️ แบทเทิล ออฟ เฟรน (Battle of Friends) — Roblox Studio Edition

โปรเจกต์เกมการ์ด **แบทเทิล ออฟ เฟรน (BOF)** ที่แปลงจากเวอร์ชันเว็บมาเป็นไฟล์แมพ **Roblox Studio (`BattleOfFriends.rbxl`)** แบบครบวงจร 100% พร้อมระบบเซิร์ฟเวอร์ป้องกันการโกง (Server-Authoritative), ลานประลอง 3D อัตโนมัติ, บอท AI 3 ระดับ และโหมดดวลกับเพื่อน (PvP)!

---

## 🚀 วิธีเปิดเล่นใน Roblox Studio (ดับเบิลคลิกเปิดได้เลย ไม่ต้องสร้างสคริปต์เอง!)

1. เปิดโฟลเดอร์ `C:\Users\User\Documents\AI\BOF-main\roblox\`
2. ดับเบิลคลิกไฟล์ **`BattleOfFriends.rbxl`** เพื่อเปิดด้วยโปรแกรม **Roblox Studio**
   - ภายในไฟล์นี้ได้ประกอบร่างโฟลเดอร์และสคริปต์ทั้งหมด (`ReplicatedStorage > BOF_Shared`, `ServerScriptService > BOF_Server`, `StarterPlayerScripts > BOF_Client`, `Baseplate`, `SpawnLocation`) ไว้ให้ครบ 100% เรียบร้อยแล้ว!
3. กดปุ่ม **Play (F5)** ใน Roblox Studio ได้เลย!

---

## 📁 โครงสร้างไฟล์ในโฟลเดอร์ `roblox/`

| ไฟล์ในโปรเจกต์ | ตำแหน่งวางใน Roblox Studio | ประเภท | หน้าที่ |
| :--- | :--- | :--- | :--- |
| **`BattleOfFriends.rbxl`** | *(เปิดใน Roblox Studio ได้ทันที)* | **Roblox Place File** | ไฟล์แมพสำเร็จรูปที่ใส่สคริปต์และโครงสร้างทั้งหมดไว้ให้เรียบร้อยแล้ว |
| `src/ReplicatedStorage/BOF_Shared/CardDatabase.lua` | `ReplicatedStorage > BOF_Shared > CardDatabase` | **ModuleScript** | ฐานข้อมูลการ์ดทั้งหมด 48 ใบ (4 เด็ค: จิต, ขุนเหนือ, วันสิ้นโลก, ไดโน) และตาราง `IMAGE_ASSETS` |
| `src/ReplicatedStorage/BOF_Shared/CardSchema.lua` | `ReplicatedStorage > BOF_Shared > CardSchema` | **ModuleScript** | ตัวตรวจสอบความถูกต้องของสกิลและการ์ดตอนเปิดเซิร์ฟเวอร์ |
| `src/ReplicatedStorage/BOF_Shared/GameEngine.lua` | `ReplicatedStorage > BOF_Shared > GameEngine` | **ModuleScript** | กฎเกมทั้งหมด, EffectEngine, อัญเชิญไฮบริด/อนาคต/จุติ/สายลับ, Intercept, Reaction และสมองกลบอท AI |
| `src/ServerScriptService/BOF_Server/init.server.lua` | `ServerScriptService > BOF_Server` | **Script** | สร้าง RemoteEvents, เสกลานประลอง 3D (โต๊ะ PvP + แท่นบอท) ใน Workspace และจัดการห้องแข่งขัน |
| `src/StarterPlayer/StarterPlayerScripts/BOF_Client/init.client.lua` | `StarterPlayer > StarterPlayerScripts > BOF_Client` | **LocalScript** | สร้าง UI ทั้งหมดอัตโนมัติ (ไม่ต้องสร้าง ScreenGui เอง), หน้าต่างค้นหาการ์ดแบบรูปภาพ และคลิกขวาดูข้อมูลการ์ด |

---

## 🖼️ วิธีใส่รูปการ์ดจริงใน Roblox (`rbxassetid://`)

> **หมายเหตุ:** แม้คุณยังไม่ได้อัปโหลดรูปการ์ด ตัวเกมก็มีระบบ **Procedural Card Art Fallback** ที่วาดกรอบสีประจำเผ่า ไอคอน ระดับความหายาก ค่าพลัง และข้อความภาษาไทยให้อัตโนมัติ ทำให้เข้าเล่นได้ทันที 100%!

เมื่อต้องการใส่รูปภาพการ์ดจริงจากโฟลเดอร์เว็บ (`image/`):
1. ใน Roblox Studio ไปที่เมนู **View > Asset Manager > Bulk Import** แล้วเลือกรูปการ์ดทั้งหมดจากโฟลเดอร์ `BOF-main/image/`
2. คัดลอก **Asset ID** ของแต่ละรูปมาใส่ในตาราง `CardDatabase.IMAGE_ASSETS` ในไฟล์ `CardDatabase`:
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
