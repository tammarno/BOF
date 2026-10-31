--!strict
--[[
	============================================================================
	BATTLE OF FRIENDS (แบทเทิล ออฟ เฟรน) — ฐานข้อมูลการ์ดและเด็คเริ่มต้น (Luau)
	วางไว้ที่: ReplicatedStorage > BOF_Shared > CardDatabase (ModuleScript)
	============================================================================
	วิธีใส่รูปการ์ดจริงใน Roblox Studio:
	1. เปิด View > Asset Manager > Bulk Import แล้วอัปโหลดรูปจากโฟลเดอร์ images/ ทั้งหมด
	2. นำรหัส rbxassetid://ตัวเลข มาใส่ในตาราง IMAGE_ASSETS ด้านล่าง (หรือแก้ช่อง image ของการ์ดแต่ละใบ)
	3. ถ้ารูปใดยังไม่ได้ใส่รหัส ระบบ UI จะวาดกรอบการ์ดสีตามเผ่า/ความหายากพร้อมชื่อและสกิลให้อัตโนมัติ!
]]

local CardDatabase = {}

-- ตารางจับคู่ Path รูปภาพเดิมจากเว็บ -> รหัส Asset ใน Roblox
CardDatabase.IMAGE_ASSETS = {
	-- เด็คจิต (ฮีโร่)
	["images/เด็คจิต/1.png"] = "rbxassetid://0",
	["images/เด็คจิต/2.png"] = "rbxassetid://0",
	["images/เด็คจิต/3.png"] = "rbxassetid://0",
	["images/เด็คจิต/4.png"] = "rbxassetid://0",
	["images/เด็คจิต/5.png"] = "rbxassetid://0",
	["images/เด็คจิต/6.png"] = "rbxassetid://0",
	["images/เด็คจิต/7.png"] = "rbxassetid://0",
	["images/เด็คจิต/8.png"] = "rbxassetid://0",
	["images/เด็คจิต/9.png"] = "rbxassetid://0",
	["images/เด็คจิต/10.png"] = "rbxassetid://0",
	["images/เด็คจิต/11.png"] = "rbxassetid://0",

	-- เด็คเหนือ (ไทย)
	["images/เด็คเหนือ/1.png"] = "rbxassetid://0",
	["images/เด็คเหนือ/2.png"] = "rbxassetid://0",
	["images/เด็คเหนือ/3.png"] = "rbxassetid://0",
	["images/เด็คเหนือ/4.png"] = "rbxassetid://0",
	["images/เด็คเหนือ/5.png"] = "rbxassetid://0",
	["images/เด็คเหนือ/6.png"] = "rbxassetid://0",
	["images/เด็คเหนือ/7.png"] = "rbxassetid://0",
	["images/เด็คเหนือ/8.png"] = "rbxassetid://0",
	["images/เด็คเหนือ/9.png"] = "rbxassetid://0",
	["images/เด็คเหนือ/10.png"] = "rbxassetid://0",
	["images/เด็คเหนือ/11.png"] = "rbxassetid://0",

	-- เด็ควันสิ้นโลก
	["images/วันสิ้นโลก/1.png"] = "rbxassetid://0",
	["images/วันสิ้นโลก/2.png"] = "rbxassetid://0",
	["images/วันสิ้นโลก/3.png"] = "rbxassetid://0",
	["images/วันสิ้นโลก/4.png"] = "rbxassetid://0",
	["images/วันสิ้นโลก/5.png"] = "rbxassetid://0",
	["images/วันสิ้นโลก/6.png"] = "rbxassetid://0",
	["images/วันสิ้นโลก/7.png"] = "rbxassetid://0",
	["images/วันสิ้นโลก/8.png"] = "rbxassetid://0",
	["images/วันสิ้นโลก/9.png"] = "rbxassetid://0",
	["images/วันสิ้นโลก/10.png"] = "rbxassetid://0",
	["images/วันสิ้นโลก/11.png"] = "rbxassetid://0",
	["images/วันสิ้นโลก/12.png"] = "rbxassetid://0",
	["images/วันสิ้นโลก/13.png"] = "rbxassetid://0",
	["images/วันสิ้นโลก/14.png"] = "rbxassetid://0",
	["images/วันสิ้นโลก/15.png"] = "rbxassetid://0",
	["images/วันสิ้นโลก/16.png"] = "rbxassetid://0",
	["images/วันสิ้นโลก/17.png"] = "rbxassetid://0",

	-- เด็คไดโน
	["images/ไดโน/1.png"] = "rbxassetid://0",
	["images/ไดโน/2.png"] = "rbxassetid://0",
	["images/ไดโน/3.png"] = "rbxassetid://0",
	["images/ไดโน/4.png"] = "rbxassetid://0",
	["images/ไดโน/5.png"] = "rbxassetid://0",
	["images/ไดโน/6.png"] = "rbxassetid://0",
	["images/ไดโน/7.png"] = "rbxassetid://0",
	["images/ไดโน/8.png"] = "rbxassetid://0",
	["images/ไดโน/9.png"] = "rbxassetid://0",
	["images/ไดโน/10.png"] = "rbxassetid://0",
	["images/ไดโน/11.png"] = "rbxassetid://0",
}

CardDatabase.DECK_METADATA = {
	L01 = {
		key = "jit",
		leaderId = "L01",
		title = "🔥 เด็คจิต",
		name = "เด็คจิต",
		leaderName = "มายฮีโร่ เดจิต",
		style = "เสริมพลังยูนิทเผ่าฮีโร่แล้วบุกให้แรงที่สุดในเทิร์นเดียว",
		color = "#3ee08f",
	},
	L02 = {
		key = "nuea",
		leaderId = "L02",
		title = "⚔️ เด็คขุนเหนือ",
		name = "เด็คเหนือ",
		leaderName = "ขุนเหนือ",
		style = "ส่งไพร่และทหารลงสนามให้ครบทัพ แล้วชุบกลับจากนรกไม่รู้จบ",
		color = "#f0a347",
	},
	L03 = {
		key = "doom",
		leaderId = "L03",
		title = "🌌 เด็ควันสิ้นโลก",
		name = "เด็ควันสิ้นโลก",
		leaderName = "วันสิ้นโลก",
		style = "ปลุกยูนิทจากนรก แล้ววิวัฒน์สู่ร่างแห่งอนาคต",
		color = "#5fd0ff",
	},
	L04 = {
		key = "dino",
		leaderId = "L04",
		title = "🦖 เด็คไดโน",
		name = "เด็คไดโน",
		leaderName = "ศูนย์วิจัยไดโน",
		style = "สะสมเผ่าไดโนและผสานร่างไฮบริดสุดแกร่งจากมิติมืด",
		color = "#a3e635",
	},
}
CardDatabase.DECK_METADATA[1] = CardDatabase.DECK_METADATA.L01
CardDatabase.DECK_METADATA[2] = CardDatabase.DECK_METADATA.L02
CardDatabase.DECK_METADATA[3] = CardDatabase.DECK_METADATA.L03
CardDatabase.DECK_METADATA[4] = CardDatabase.DECK_METADATA.L04

CardDatabase.CARDS = {
	-- ==================== LEADER (ทั้ง 4 เด็ค) ====================
	{
		id = "L01",
		name = "มายฮีโร่ เดจิต",
		type = "Leader",
		rarity = "Legend",
		maxHp = 6,
		image = "images/เด็คจิต/1.png",
		ability = "LEADER_DEJIT_BUFF",
		desc = "สั่งใช้งาน/1 เทิร์น: เลือกยูนิทฝั่งเรา 1 ตัว เพิ่มพลังโจมตี +1 จนจบเทิร์น",
		effects = {
			{
				id = "leader_l01_buff",
				trigger = "ACTIVATE_LEADER",
				oncePerTurn = true,
				steps = {
					{ block = "ADD_POWER", target = "ALLY", count = 1, amount = 1, duration = "TURN" },
				},
			},
		},
	},
	{
		id = "L02",
		name = "ขุนเหนือ",
		type = "Leader",
		rarity = "Legend",
		maxHp = 6,
		image = "images/เด็คเหนือ/1.png",
		ability = "LEADER_KHUN_NUEA",
		desc = 'ออโต้: เมื่อเข้าเทิร์น นำ "ไพร่ชาวนาเหนือ" จากกองหรือนรกไม่เกิน 1 ใบขึ้นมือ\nต่อเนื่อง: ถ้ามีการ์ดที่มีคำว่า "เหนือ" 3 ใบบนสนาม การ์ดที่มีคำว่า "เหนือ" ทุกใบบนสนามเราพลังโจมตี +1',
		effects = {
			{
				id = "leader_l02_aura",
				trigger = "CONTINUOUS_BOARD_AURA",
				condition = { type = "MIN_NAME_COUNT", nameKeyword = "เหนือ", count = 3 },
				targetNameKeyword = "เหนือ",
				amount = 1,
			},
		},
	},
	{
		id = "L03",
		name = "วันสิ้นโลก",
		type = "Leader",
		rarity = "Legend",
		maxHp = 6,
		image = "images/วันสิ้นโลก/1.png",
		ability = "LEADER_DOOMSDAY",
		desc = "ออโต้: เมื่อเข้าเทิร์น คอลการ์ดยูนิตจากนรก 1 ใบลงสนาม โดยที่พลังโจมตีพื้นฐานต้องไม่เกิน 2",
	},
	{
		id = "L04",
		name = "ศูนย์วิจัยไดโน",
		type = "Leader",
		rarity = "Legend",
		maxHp = 6,
		image = "images/ไดโน/1.png",
		ability = "LEADER_DINO_LAB",
		desc = "สั่งใช้งาน/1 เทิร์น: เลือกการ์ดยูนิทเผ่า ไดโน จากนรก 1 ใบ นำใบนั้นขึ้นมือ",
		effects = {
			{
				id = "leader_l04_recover",
				trigger = "ACTIVATE_LEADER",
				oncePerTurn = true,
				steps = {
					{ block = "RECOVER_FROM_GRAVE", filterTribe = "ไดโน", filterType = "MONSTER", count = 1 },
				},
			},
		},
	},

	-- ==================== MONSTER & SPELL: เด็คจิต ====================
	{
		id = "M01",
		name = "บาคุจิต",
		type = "Monster",
		tribe = "ฮีโร่",
		rarity = "SR",
		power = 2,
		image = "images/เด็คจิต/2.png",
		ability = "BAKU_SKILL",
		desc = "ต่อเนื่อง: ถ้ามีโทโดโรจิตบนสนามเรา พลัง +1\nออโต้: เมื่อลงสนาม เลือกทำลายยูนิทอีกฝ่าย 1 ใบ",
		effects = {
			{
				id = "baku_continuous",
				trigger = "CONTINUOUS_POWER",
				condition = { type = "ALLY_ON_BOARD", cardId = "M02" },
				amount = 1,
			},
			{
				id = "baku_on_summon",
				trigger = "ON_SUMMON",
				steps = {
					{ block = "DESTROY_UNIT", target = "OPPONENT", count = 1, select = "CHOOSE" },
				},
			},
		},
	},
	{
		id = "M02",
		name = "โทโดโรจิต",
		type = "Monster",
		tribe = "ฮีโร่",
		rarity = "R",
		power = 1,
		image = "images/เด็คจิต/3.png",
		ability = "TODORO_SKILL",
		desc = "สั่งใช้งาน1/เทิร์น: ทิ้งมือ 1 ใบ โม่กองอีกฝ่าย 1 ใบ\nสั่งใช้งาน2/เทิร์น: นำบาคุจิตจากนรกขึ้นมือ 1 ใบ",
		effects = {
			{
				id = "todoroMill",
				label = "1) ทิ้งมือ 1 ใบ -> ส่งใบบนสุดกองอีกฝ่ายลงนรก",
				trigger = "ACTIVATE_MAIN",
				oncePerTurn = true,
				costs = { { type = "DISCARD_HAND", count = 1 } },
				steps = { { block = "MILL_DECK", side = "OPPONENT", count = 1 } },
			},
			{
				id = "todoroRecover",
				label = '2) นำ "บาคุจิต" 1 ใบจากนรกขึ้นมือ',
				trigger = "ACTIVATE_MAIN",
				oncePerTurn = true,
				steps = { { block = "RECOVER_FROM_GRAVE", cardId = "M01", count = 1 } },
			},
		},
	},
	{
		id = "M03",
		name = "ออลจิต",
		type = "Monster",
		tribe = "ฮีโร่",
		rarity = "R",
		power = 2,
		image = "images/เด็คจิต/4.png",
		ability = "ALL_JIT_HAND_INTERCEPT",
		desc = "เมื่อลีดเดอร์ถูกโจมตี: อัญเชิญใบนี้จากมือลงสนาม และเปลี่ยนเป้าหมายโจมตีมาที่ใบนี้แทน",
	},
	{
		id = "M04",
		name = "ออลฟอจิต",
		type = "Monster",
		tribe = "ฮีโร่",
		rarity = "Legend",
		power = 3,
		image = "images/เด็คจิต/5.png",
		ability = "ALL_FOR_JIT_GRAVE",
		cannotNormalSummon = true,
		desc = "ห้ามอัญเชิญปกติ | จากนรก/1 เกม (เมื่อลีดเดอร์ถูกตีและ HP<=2): อัญเชิญใบนี้และทำลายยูนิททุกใบบนสนาม",
	},
	{
		id = "M05",
		name = "เอ็นเดจิต",
		type = "Monster",
		tribe = "ฮีโร่",
		rarity = "R",
		power = 2,
		image = "images/เด็คจิต/6.png",
		ability = "ENDE_SKILL",
		desc = "สั่งใช้งาน: พลังโจมตียูนิทนี้ +2 และเมื่อจบเทิร์น ทำลายการ์ดใบนี้",
		effects = {
			{
				id = "endeBoost",
				label = "เพิ่มพลังโจมตี +2 (ทำลายใบนี้เมื่อจบเทิร์น)",
				trigger = "ACTIVATE_MAIN",
				oncePerTurn = true,
				steps = {
					{ block = "ADD_POWER", target = "SELF_UNIT", amount = 2, duration = "TURN" },
					{ block = "MARK_END_TURN_DESTROY", target = "SELF_UNIT" },
					{ block = "TRIGGER_ALLY_PASSIVE", allyId = "M06", amount = 2 },
				},
			},
		},
	},
	{
		id = "M06",
		name = "ฮออ์กส์ฟีม",
		type = "Monster",
		tribe = "ฮีโร่",
		rarity = "R",
		power = 2,
		image = "images/เด็คจิต/7.png",
		ability = "HAWKS_SKILL",
		desc = "สั่งใช้งาน: ลดพลังใบนี้ -2 นำเอ็นเดจิตจากกอง/นรกขึ้นมือ\nออโต้: เมื่อเอ็นเดจิตใช้สกิล ใบนี้พลัง +2",
		effects = {
			{
				id = "hawksSearch",
				label = 'ลดพลังใบนี้ -2 -> ค้นหา "เอ็นเดจิต" จากกอง/นรกขึ้นมือ',
				trigger = "ACTIVATE_MAIN",
				oncePerTurn = true,
				costs = { { type = "REDUCE_SELF_POWER", amount = 2 } },
				steps = {
					{ block = "SEARCH_DECK_OR_GRAVE", cardId = "M05", destination = "HAND" },
				},
			},
		},
	},
	{
		id = "S01",
		name = "โอ็ยใครเหยียบตีน!!!",
		type = "NormalSpell",
		rarity = "SR",
		effect = "SPELL_DISCARD_DESTROY",
		image = "images/เด็คจิต/8.png",
		desc = "ทิ้งการ์ดบนมือ 1 ใบ เลือกทำลายยูนิทฝั่งตรงข้าม 1 ใบ",
		effects = {
			{
				id = "spell_s01",
				trigger = "CAST_SPELL",
				costs = { { type = "DISCARD_HAND", count = 1 } },
				steps = {
					{ block = "DESTROY_UNIT", target = "OPPONENT", count = 1, select = "CHOOSE" },
				},
			},
		},
	},
	{
		id = "S02",
		name = "เชี่ย หุ้นตก",
		type = "NormalSpell",
		rarity = "SR",
		effect = "SPELL_DEBUFF_ALL_3",
		image = "images/เด็คจิต/9.png",
		desc = "ลดพลังโจมตีของยูนิทฝั่งตรงข้ามทุกใบลง 3 หน่วย จนจบเทิร์น",
		effects = {
			{
				id = "spell_s02",
				trigger = "CAST_SPELL",
				steps = {
					{ block = "REDUCE_POWER", target = "ALL_ENEMIES", amount = 3, duration = "TURN" },
				},
			},
		},
	},
	{
		id = "S03",
		name = "หนึ่งเดียวเพื่อทุกสิ่ง",
		type = "NormalSpell",
		rarity = "R",
		effect = "SPELL_REST_1_HEAL_1",
		image = "images/เด็คจิต/10.png",
		desc = "Rest ยูนิทที่ Stand อยู่ฝั่งเรา 1 ใบ แล้วเพิ่มพลังชีวิตลีดเดอร์เรา +1",
		effects = {
			{
				id = "spell_s03",
				trigger = "CAST_SPELL",
				costs = { { type = "REST_ALLY", count = 1 } },
				steps = {
					{ block = "HEAL_LEADER", side = "SELF", amount = 1 },
				},
			},
		},
	},
	{
		id = "S04",
		name = "ทุกสิ่งเพื่อหนึ่งเดียว",
		type = "NormalSpell",
		rarity = "R",
		effect = "SPELL_REST_2_GRANT_BURN",
		image = "images/เด็คจิต/11.png",
		desc = "Rest ยูนิทฝั่งเรา 2 ใบ เลือกยูนิทเรา 1 ใบได้รับออโต้: เมื่อตีทำลายยูนิทสำเร็จ ทำดาเมจลีดเดอร์อีกฝ่าย 1",
		effects = {
			{
				id = "spell_s04",
				trigger = "CAST_SPELL",
				costs = { { type = "REST_ALLY", count = 2 } },
				steps = {
					{ block = "GRANT_STATUS", target = "ALLY", count = 1, status = "BURN_ON_KILL" },
				},
			},
		},
	},

	-- ==================== MONSTER & SPELL: เด็คเหนือ ====================
	{
		id = "NM01",
		name = "ไพร่ชาวนาเหนือ",
		type = "Monster",
		tribe = "ไทย",
		rarity = "N",
		power = 1,
		image = "images/เด็คเหนือ/2.png",
		ability = "PEASANT_HAND_SKILL",
		desc = 'สั่งใช้จากบนมือ: ส่งใบนี้ลงนรกและเลือก 1 อย่าง:\n1) อัญเชิญ "สายลับไพร่เหนือ" จากกองหรือนรกลงสนามอีกฝ่าย\n2) นำการ์ดที่มีคำว่า "ทหาร" 1 ใบจากกองขึ้นมือ',
	},
	{
		id = "NM02",
		name = "ทหารหลวงเหนือ",
		type = "Monster",
		tribe = "ไทย",
		rarity = "R",
		power = 2,
		image = "images/เด็คเหนือ/3.png",
		ability = "ROYAL_GUARD_SKILL",
		desc = 'สั่งใช้จากบนมือ: ส่ง "ไพร่ชาวนาเหนือ" 1 ใบบนมือลงนรกเพื่ออัญเชิญจุติใบนี้ (พลัง +1)\nจุติ: หากมี "ทหารเกณฑ์เหนือ" บนสนามเรา อัญเชิญการ์ดที่มีคำว่า "ทหาร" 1 ใบจากกอง/นรกลงสนามทันที',
	},
	{
		id = "NM03",
		name = "ทหารพรานเหนือ",
		type = "Monster",
		tribe = "ไทย",
		rarity = "N",
		power = 1,
		image = "images/เด็คเหนือ/4.png",
		ability = "RANGER_SKILL",
		desc = 'สั่งใช้จากบนมือ: ส่ง "ไพร่ชาวนาเหนือ" ลงนรกแล้วอัญเชิญใบนี้ลงสนาม (พลัง +1)\nสั่งใช้/เทิร์นละครั้ง: เลือกยูนิท 1 ใบ ถ้าเป็นฝั่งเราพลัง +1 ถ้าเป็นฝั่งตรงข้ามพลัง -1',
		effects = {
			{
				id = "rangerTarget",
				label = "เลือกยูนิท 1 ใบ (ฝั่งเราพลัง +1 / ฝั่งตรงข้ามพลัง -1)",
				trigger = "ACTIVATE_MAIN",
				oncePerTurn = true,
				steps = {
					{ block = "FLEX_POWER", plusAmount = 1, minusAmount = 1, duration = "PERM" },
				},
			},
		},
	},
	{
		id = "NM04",
		name = "ทหารเกณฑ์เหนือ",
		type = "Monster",
		tribe = "ไทย",
		rarity = "R",
		power = 1,
		image = "images/เด็คเหนือ/5.png",
		ability = "CONSCRIPT_SKILL",
		desc = 'ออโต้: เมื่อลงสนาม พลัง +1\nต่อเนื่อง: พลังโจมตี +1 ตามจำนวนการ์ดที่มีคำว่า "ทหาร" ใบอื่นบนสนามเรา\nคำสั่งเสีย: เมื่อถูกทำลาย นำการ์ดที่มีคำว่า "ไพร่" 1 ใบจากนรกขึ้นมือ',
		effects = {
			{
				id = "conscript_summon",
				trigger = "ON_SUMMON",
				steps = {
					{ block = "ADD_POWER", target = "SELF_UNIT", amount = 1, duration = "PERM" },
				},
			},
			{
				id = "conscript_continuous",
				trigger = "CONTINUOUS_POWER",
				condition = { type = "PER_OTHER_ALLY_NAME", nameKeyword = "ทหาร" },
				amountPerUnit = 1,
			},
			{
				id = "conscript_death",
				trigger = "ON_DESTROY",
				steps = {
					{ block = "RECOVER_FROM_GRAVE", filterName = "ไพร่", count = 1, autoPickFirst = true },
				},
			},
		},
	},
	{
		id = "NM05",
		name = "สายลับไพร่เหนือ",
		type = "Monster",
		tribe = "ไทย",
		rarity = "N",
		power = 0,
		image = "images/เด็คเหนือ/6.png",
		ability = "SPY_SKILL",
		isSpy = true,
		desc = "สายลับ: อัญเชิญการ์ดใบนี้ลงบนสนามฝ่ายตรงข้าม\nคำสั่งเสีย: ลงนรกฝ่ายตรงข้าม และฝ่ายตรงข้ามจั่วการ์ด 1 ใบ",
		effects = {
			{
				id = "spy_death",
				trigger = "ON_DESTROY",
				steps = {
					{ block = "DRAW", side = "OPPONENT", count = 1 },
				},
			},
		},
	},
	{
		id = "NS01",
		name = "หมอไพร่เหนือ",
		type = "NormalSpell",
		rarity = "N",
		effect = "SPELL_RECOVER_PHRAI",
		image = "images/เด็คเหนือ/7.png",
		desc = 'นำการ์ดที่มีคำว่า "ไพร่" 1 ใบจากนรกขึ้นมือ',
		effects = {
			{
				id = "spell_ns01",
				trigger = "CAST_SPELL",
				steps = {
					{ block = "RECOVER_FROM_GRAVE", filterName = "ไพร่", count = 1 },
				},
			},
		},
	},
	{
		id = "NS02",
		name = "หมอสนามเหนือ",
		type = "NormalSpell",
		rarity = "N",
		effect = "SPELL_RECOVER_SOLDIER",
		image = "images/เด็คเหนือ/8.png",
		desc = 'นำการ์ดที่มีคำว่า "ทหาร" 1 ใบจากนรกขึ้นมือ',
		effects = {
			{
				id = "spell_ns02",
				trigger = "CAST_SPELL",
				steps = {
					{ block = "RECOVER_FROM_GRAVE", filterName = "ทหาร", count = 1 },
				},
			},
		},
	},
	{
		id = "NS03",
		name = "ระเบิดปูพรม",
		type = "NormalSpell",
		rarity = "SR",
		effect = "SPELL_CARPET_BOMB",
		image = "images/เด็คเหนือ/9.png",
		desc = 'แสดงผลตามยูนิทที่มีคำว่า "ทหาร" บนสนามเรา:\n- ทหารเกณฑ์เหนือ: ยูนิทที่มีคำว่า "เหนือ" ทุกใบพลัง +1 จนจบเทิร์น\n- ทหารพรานเหนือ: ทำลายยูนิทอีกฝ่าย 1 ใบ\n- ทหารหลวงเหนือ: ยูนิทเราทุกใบไม่ถูกทำลายจนเริ่มเทิร์นถัดไป',
		effects = {
			{
				id = "spell_ns03",
				trigger = "CAST_SPELL",
				steps = {
					{ block = "CARPET_BOMB_COMPOSITE" },
				},
			},
		},
	},
	{
		id = "NS04",
		name = "หน่วยข่าวกรอง",
		type = "NormalSpell",
		rarity = "R",
		effect = "SPELL_RECOVER_SPELL",
		image = "images/เด็คเหนือ/10.png",
		desc = "นำการ์ดเวทจากในนรกขึ้นมือ 1 ใบ",
		effects = {
			{
				id = "spell_ns04",
				trigger = "CAST_SPELL",
				steps = {
					{ block = "RECOVER_FROM_GRAVE", filterType = "SPELL", count = 1 },
				},
			},
		},
	},
	{
		id = "NS05",
		name = "จีวรบิน",
		type = "NormalSpell",
		rarity = "SR",
		effect = "SPELL_BOUNCE_ENEMY",
		image = "images/เด็คเหนือ/11.png",
		desc = "เลือกยูนิทฝั่งตรงข้าม 1 ใบ นำการ์ดใบนั้นกลับขึ้นมือเจ้าของ",
		effects = {
			{
				id = "spell_ns05",
				trigger = "CAST_SPELL",
				steps = {
					{ block = "BOUNCE_UNIT", target = "OPPONENT", count = 1 },
				},
			},
		},
	},

	-- ==================== MONSTER & SPELL: เด็ควันสิ้นโลก ====================
	{
		id = "DM01",
		name = "โอนามิ ผู้ทำลายโลก",
		type = "Monster",
		tribe = "วันสิ้นโลก",
		rarity = "Legend",
		power = 2,
		maxCopies = 2,
		image = "images/วันสิ้นโลก/2.png",
		ability = "ONAMI_SKILL",
		desc = 'คู่หู: เมื่ออยู่คู่กับ "โรเซเลีย" พลังโจมตี +2 ตลอดเทิร์นเราและอีกฝ่าย\nสั่งใช้งาน/1 เทิร์น: ทิ้งการ์ดมือ 1 ใบ อัญเชิญ "โรเซเลีย" จากกองหรือนรก 1 ใบลงสนาม แล้วสับกอง',
		effects = {
			{
				id = "onami_partner_buff",
				trigger = "CONTINUOUS_POWER",
				condition = { type = "ALLY_ON_BOARD", cardId = "DM02" },
				amount = 2,
			},
			{
				id = "onamiSummon",
				label = 'ทิ้งมือ 1 ใบ -> อัญเชิญ "โรเซเลีย" จากกองหรือนรกลงสนาม',
				trigger = "ACTIVATE_MAIN",
				oncePerTurn = true,
				costs = { { type = "DISCARD_HAND", count = 1, triggerDiscardSkill = true } },
				steps = {
					{ block = "SEARCH_DECK_OR_GRAVE", cardId = "DM02", destination = "BOARD", grantImmunity = true },
				},
			},
		},
	},
	{
		id = "DM02",
		name = "โรเซเลีย",
		type = "Monster",
		tribe = "วันสิ้นโลก",
		rarity = "SR",
		power = 3,
		maxCopies = 2,
		image = "images/วันสิ้นโลก/3.png",
		ability = "ROSELIA_SKILL",
		desc = "คู่หู: เมื่ออยู่คู่กับโอนามิ สามารถ Rest ใบนี้เพื่อจั่ว 1 ใบได้\nออโต้: เมื่อลงสนามด้วยสกิลของโอนามิ จะไม่โดนความสามารถการ์ดอีกฝ่ายจนจบเทิร์น\nออโต้: เมื่อถูกทำลายจากการต่อสู้ จั่ว 1 ใบ",
		effects = {
			{
				id = "roselia_draw",
				label = "เปลี่ยนโรเซเลียเป็น Rest -> จั่วการ์ด 1 ใบ (ต้องมีโอนามิบนสนาม)",
				trigger = "ACTIVATE_MAIN",
				condition = { type = "ALLY_ON_BOARD", cardId = "DM01" },
				costs = { { type = "REST_SELF" } },
				steps = {
					{ block = "DRAW", side = "SELF", count = 1 },
				},
			},
			{
				id = "roselia_battle_death",
				trigger = "ON_BATTLE_DESTROY",
				steps = {
					{ block = "DRAW", side = "SELF", count = 1 },
				},
			},
		},
	},
	{
		id = "DM03",
		name = "มายอา",
		type = "Monster",
		tribe = "วันสิ้นโลก",
		rarity = "R",
		power = 2,
		maxCopies = 1,
		image = "images/วันสิ้นโลก/4.png",
		ability = "MAYA_SKILL",
		desc = '[ใส่ได้ 1 ใบ] ต่อเนื่อง: ตราบที่มี "ซึรุรุ" บนสนามเรา ยูนิทนี้ไม่ตกเป็นเป้าหมายการโจมตี\n1 เกม: เมื่ออีกฝ่ายโจมตี เปิดท็อปการ์ด 1 ใบ ถ้าเป็น "โซเนบุ" อีกฝ่ายจบเทิร์นทันที',
	},
	{
		id = "DM04",
		name = "เดบิรุน",
		type = "Monster",
		tribe = "วันสิ้นโลก",
		rarity = "R",
		power = 2,
		maxCopies = 1,
		image = "images/วันสิ้นโลก/5.png",
		ability = "DEBIRUN_SKILL",
		desc = "[ใส่ได้ 1 ใบ] ออโต้: เมื่อเข้าเทิร์น ค้นหาการ์ดเวทจากกองหรือนรกขึ้นมือแล้วบังคับใช้งาน แต่ถ้าไม่สามารถใช้งานได้ ชุบยูนิตจากนรกได้ 1 ใบ",
	},
	{
		id = "DM05",
		name = "ซึรุรุ",
		type = "Monster",
		tribe = "วันสิ้นโลก",
		rarity = "R",
		power = 1,
		maxCopies = 1,
		image = "images/วันสิ้นโลก/6.png",
		ability = "TSURURU_SKILL",
		desc = '[ใส่ได้ 1 ใบ] ออโต้: เมื่อการ์ดใบนี้ถูกทิ้งจากสกิลของ "โอนามิ ผู้ทำลายโลก" อีกฝ่ายต้องทิ้งมือ 1 ใบ',
	},
	{
		id = "DM06",
		name = "โซเนบุ",
		type = "Monster",
		tribe = "วันสิ้นโลก",
		rarity = "R",
		power = 3,
		maxCopies = 1,
		image = "images/วันสิ้นโลก/7.png",
		ability = "SONEBU_SKILL",
		desc = "[ใส่ได้ 1 ใบ] ออโต้: เมื่อยูนิตนี้โจมตี ถ้าอีกฝ่ายใช้เวทรีแอค ทั้ง 2 ฝ่ายทอยเต๋า ใครน้อยกว่าชนะและสกิลเวทนั้นไร้ผล",
	},
	{
		id = "DM07",
		name = "แอชชี่ล่า",
		type = "Monster",
		tribe = "วันสิ้นโลก",
		rarity = "R",
		power = 2,
		maxCopies = 1,
		image = "images/วันสิ้นโลก/8.png",
		ability = "ASHILA_SKILL",
		desc = "[ใส่ได้ 1 ใบ] สั่งใช้งานจากบนมือ: ถ้ายูนิตฝ่ายเราถูกทำลาย 2 ใบขึ้นไปในเทิร์นนี้ ทำการคอลการ์ดใบนี้ลงสนาม แล้วพลังโจมตีเพิ่มขึ้น +2 จนจบเทิร์น",
	},
	{
		id = "DM08",
		name = "เอมิ",
		type = "Monster",
		tribe = "วันสิ้นโลก",
		rarity = "R",
		power = 1,
		maxCopies = 1,
		image = "images/วันสิ้นโลก/9.png",
		ability = "EMI_SKILL",
		desc = '[ใส่ได้ 1 ใบ] ออโต้: ถ้าบนสนามเรามี "เดบิรุน" พลังโจมตี +1 และสามารถทิ้งการ์ดมือ 3 ใบเพื่อ Stand โจมตีอีกครั้งได้',
		effects = {
			{
				id = "emi_continuous",
				trigger = "CONTINUOUS_POWER",
				condition = { type = "ALLY_ON_BOARD", cardId = "DM04" },
				amount = 1,
			},
		},
	},
	{
		id = "DM09",
		name = "ผู้รักษาความฝัน มายอา",
		type = "Monster",
		tribe = "วันสิ้นโลก",
		rarity = "SR",
		power = 2,
		maxCopies = 1,
		cannotNormalSummon = true,
		image = "images/วันสิ้นโลก/10.png",
		ability = "FUTURE_MAYA",
		futureBaseId = "DM03",
		futureBaseName = "มายอา",
		desc = '[ใส่ได้ 1 ใบ | ห้ามอัญเชิญปกติ | อนาคต: มายอา]\nส่ง "มายอา" บนสนามไปมิติมืดแล้วคอลใบนี้: พลัง +1 และเปิดท็อปกอง ถ้าเป็นเวท บังคับ Rest ยูนิตอีกฝ่าย 1 ใบ (จบเทิร์นลงนรกและคอลมายอากลับมา)',
	},
	{
		id = "DM10",
		name = "เดบิรุน เดอะ ฟิวเจอร์",
		type = "Monster",
		tribe = "วันสิ้นโลก",
		rarity = "SR",
		power = 2,
		maxCopies = 1,
		cannotNormalSummon = true,
		image = "images/วันสิ้นโลก/11.png",
		ability = "FUTURE_DEBIRUN",
		futureBaseId = "DM04",
		futureBaseName = "เดบิรุน",
		desc = '[ใส่ได้ 1 ใบ | ห้ามอัญเชิญปกติ | อนาคต: เดบิรุน]\nส่ง "เดบิรุน" บนสนามไปมิติมืดแล้วคอลใบนี้: นำยูนิตอื่นบนสนามเรา 1 ใบขึ้นมือ จากนั้นเปิดท็อปกอง ถ้าเป็นยูนิตคอลลงสนามโดยสกิลไม่ทำงาน ถ้าเป็นเวทนำขึ้นมือ',
	},
	{
		id = "DM11",
		name = "เด็กสาวขนมหวาน ซึรุรุ",
		type = "Monster",
		tribe = "วันสิ้นโลก",
		rarity = "SR",
		power = 2,
		maxCopies = 1,
		cannotNormalSummon = true,
		image = "images/วันสิ้นโลก/12.png",
		ability = "FUTURE_TSURURU",
		futureBaseId = "DM05",
		futureBaseName = "ซึรุรุ",
		desc = '[ใส่ได้ 1 ใบ | ห้ามอัญเชิญปกติ | อนาคต: ซึรุรุ]\nส่ง "ซึรุรุ" บนสนามไปมิติมืดแล้วคอลใบนี้: คอล "มายอา" จากนรก 1 ใบลงสนามและเพิ่มพลังให้มายอา +1 (จบเทิร์นลงนรกและคอลซึรุรุกลับมา)',
	},
	{
		id = "DM12",
		name = "นักล่าปีศาจ โซเนบุ",
		type = "Monster",
		tribe = "วันสิ้นโลก",
		rarity = "SR",
		power = 2,
		maxCopies = 1,
		cannotNormalSummon = true,
		image = "images/วันสิ้นโลก/13.png",
		ability = "FUTURE_SONEBU",
		futureBaseId = "DM06",
		futureBaseName = "โซเนบุ",
		desc = '[ใส่ได้ 1 ใบ | ห้ามอัญเชิญปกติ | อนาคต: โซเนบุ]\nส่ง "โซเนบุ" บนสนามไปมิติมืดแล้วคอลใบนี้: อีกฝ่ายเลือกทิ้งมือ 1 ใบ หรือทำลายยูนิตบนสนาม 1 ใบ ถ้าไม่ทำ ยูนิตนี้พลัง +1',
	},
	{
		id = "DM13",
		name = "ยอดนักดาบ แอชชี่ล่า",
		type = "Monster",
		tribe = "วันสิ้นโลก",
		rarity = "SR",
		power = 3,
		maxCopies = 1,
		cannotNormalSummon = true,
		image = "images/วันสิ้นโลก/14.png",
		ability = "FUTURE_ASHILA",
		futureBaseId = "DM07",
		futureBaseName = "แอชชี่ล่า",
		desc = '[ใส่ได้ 1 ใบ | ห้ามอัญเชิญปกติ | อนาคต: แอชชี่ล่า]\nส่ง "แอชชี่ล่า" บนสนามไปมิติมืดแล้วคอลใบนี้: การ์ดทุกใบบนสนามอีกฝ่ายพลังโจมตี -1 จนจบเทิร์น (จบเทิร์นลงนรกและคอลแอชชี่ล่ากลับมา)',
		effects = {
			{
				id = "future_ashila_debuff",
				trigger = "ON_SUMMON",
				steps = {
					{ block = "REDUCE_POWER", target = "ALL_ENEMIES", amount = 1, duration = "TURN" },
				},
			},
		},
	},
	{
		id = "DM14",
		name = "สุดยอดเอไอ เอมิ",
		type = "Monster",
		tribe = "วันสิ้นโลก",
		rarity = "SR",
		power = 1,
		maxCopies = 1,
		cannotNormalSummon = true,
		image = "images/วันสิ้นโลก/15.png",
		ability = "FUTURE_EMI",
		futureBaseId = "DM08",
		futureBaseName = "เอมิ",
		desc = '[ใส่ได้ 1 ใบ | ห้ามอัญเชิญปกติ | อนาคต: เอมิ]\nส่ง "เอมิ" บนสนามไปมิติมืดแล้วคอลใบนี้: บังคับอีกฝ่ายนำการ์ดบนสนาม 1 ใบขึ้นมือแล้วคอลใบอื่นลงมาแทน ถ้าไม่มีเราจั่ว 1 ใบ',
	},
	{
		id = "DS01",
		name = "เบิกเนตรแห่งแสง",
		type = "NormalSpell",
		rarity = "R",
		maxCopies = 2,
		effect = "SPELL_LIGHT_AWAKEN",
		image = "images/วันสิ้นโลก/16.png",
		desc = "จั่วการ์ด 1 ใบ แต่ถ้าในนรกเรามีการ์ด 5 ใบขึ้นไป จั่ว 2 ใบแทน และเพิ่มพลังโจมตี +1 ให้ยูนิตบนสนามเรา 1 ใบ",
		effects = {
			{
				id = "spell_ds01",
				trigger = "CAST_SPELL",
				steps = {
					{ block = "DRAW", side = "SELF", count = 1, bonusIfGraveAtLeast = 5, bonusCount = 2 },
					{ block = "ADD_POWER", target = "ALLY", count = 1, amount = 1, duration = "TURN" },
				},
			},
		},
	},
	{
		id = "DS02",
		name = "พวกเราจะช่วยเอง",
		type = "ReactionSpell",
		rarity = "R",
		maxCopies = 2,
		effect = "SPELL_WE_WILL_HELP",
		image = "images/วันสิ้นโลก/17.png",
		desc = "เมื่ออีกฝ่ายโจมตี: นำการ์ดยูนิต (ที่ไม่ใช่เวท) 5 ใบในนรกเรากลับเข้ากองและสับกอง แล้วยกเลิกการโจมตีนั้นทันที",
	},

	-- ==================== MONSTER & SPELL: เด็คไดโน ====================
	{
		id = "DN01",
		name = "ทีเร็กซ์ — ราชันนักล่า",
		type = "Monster",
		tribe = "ไดโน",
		rarity = "SR",
		power = 2,
		image = "images/ไดโน/2.png",
		ability = "TREX_KILL_DESTROY",
		desc = "ออโต้: เมื่อยูนิทนี้ทำลายยูนิทฝั่งตรงข้ามสำเร็จ เลือกยูนิทฝั่งตรงข้าม 1 ใบ ทำลายยูนิทนั้น",
		effects = {
			{
				id = "trex_on_kill",
				trigger = "ON_KILL_UNIT",
				steps = {
					{ block = "DESTROY_UNIT", target = "OPPONENT", count = 1, select = "CHOOSE" },
				},
			},
		},
	},
	{
		id = "DN02",
		name = "เวโลซิแรปเตอร์ — นักล่าแห่งฝูง",
		type = "Monster",
		tribe = "ไดโน",
		rarity = "R",
		power = 1,
		image = "images/ไดโน/3.png",
		ability = "RAPTOR_BUFF_DINO",
		desc = "สั่งใช้งาน/1 เทิร์น: เรสการ์ดใบนี้แล้ว เลือกยูนิทเผ่าไดโนบนสนาม 1 ใบ พลังโจมตีใบนั้น +2 หน่วย จนจบเทิร์น",
		effects = {
			{
				id = "raptor_buff",
				label = "Rest ใบนี้ -> เลือกยูนิทเผ่าไดโน 1 ใบ พลัง +2 จนจบเทิร์น",
				trigger = "ACTIVATE_MAIN",
				oncePerTurn = true,
				costs = { { type = "REST_SELF" } },
				steps = {
					{ block = "ADD_POWER", target = "ALLY", filterTribe = "ไดโน", count = 1, amount = 2, duration = "TURN" },
				},
			},
		},
	},
	{
		id = "DN03",
		name = "ไทรเซราทอปส์ — ปราการมีชีวิต",
		type = "Monster",
		tribe = "ไดโน",
		rarity = "R",
		power = 2,
		image = "images/ไดโน/4.png",
		ability = "TRICERATOPS_GUARD",
		desc = "ออโต้: เมื่อยูนิทนี้รับการโจมตีแทนลีดเดอร์ พลังโจมตีของยูนิทนี้ +2 หน่วย จนจบเทิร์น แล้วถ้าป้องกันสำเร็จ สแตร์นยูนิทนี้",
		effects = {
			{
				id = "triceratops_intercept",
				trigger = "ON_INTERCEPT",
				standOnSurvive = true,
				steps = {
					{ block = "ADD_POWER", target = "SELF_UNIT", amount = 2, duration = "TURN" },
				},
			},
		},
	},
	{
		id = "DN04",
		name = "พเทอราโนดอน — เจ้าเวหา",
		type = "Monster",
		tribe = "ไดโน",
		rarity = "N",
		power = 2,
		image = "images/ไดโน/5.png",
		ability = "PTERANODON_MILL_DRAW",
		desc = "สั่งใช้งาน/1 เทิร์น: ส่งการ์ดใบบนสุดของกองการ์ด 2 ใบลงนรก หลังจากนั้น จั่วการ์ด 1 ใบ",
		effects = {
			{
				id = "pteranodon_mill_draw",
				label = "ส่งใบบนสุดของกองเรา 2 ใบลงนรก -> จั่วการ์ด 1 ใบ",
				trigger = "ACTIVATE_MAIN",
				oncePerTurn = true,
				steps = {
					{ block = "MILL_DECK", side = "SELF", count = 2 },
					{ block = "DRAW", side = "SELF", count = 1 },
				},
			},
		},
	},
	{
		id = "DN05",
		name = "สไปโนซอรัส — ผู้ล่าแห่งสายน้ำ",
		type = "Monster",
		tribe = "ไดโน",
		rarity = "R",
		power = 0,
		image = "images/ไดโน/6.png",
		ability = "SPINOSAURUS_GRAVE_POWER",
		desc = "ต่อเนื่อง: ยูนิทนี้พลังโจมตี +1 หน่วย ต่อการ์ดในนรกทุกๆ 3 ใบ",
		effects = {
			{
				id = "spinosaurus_continuous",
				trigger = "CONTINUOUS_POWER",
				condition = { type = "PER_GRAVE_COUNT", divisor = 3 },
				amountPerUnit = 1,
			},
		},
	},
	{
		id = "DN06",
		name = "ไฮบริด — อินโดมินัสเร็กซ์",
		type = "Monster",
		tribe = "ไดโน",
		rarity = "Legend",
		power = 3,
		cannotNormalSummon = true,
		hybridMaterials = { "ทีเร็กซ์", "เวโลซิแรปเตอร์" },
		image = "images/ไดโน/7.png",
		ability = "INDOMINUS_HYBRID",
		desc = '[ห้ามอัญเชิญปกติ]\nสั่งใช้งานจากบนมือ: ส่งการ์ดที่มีชื่อ "ทีเร็กซ์" กับ "เวโลซิแรปเตอร์" จาก มือ, สนาม, นรก ไปมิติมืด เพื่ออัญเชิญการ์ดใบนี้ลงสนาม\nออโต้: เมื่อการ์ดนี้ทำลายยูนิทสำเร็จ สแตร์นยูนิทนี้',
		effects = {
			{
				id = "indominus_on_kill_stand",
				trigger = "ON_KILL_UNIT",
				steps = {
					{ block = "STAND_SELF" },
				},
			},
		},
	},
	{
		id = "DN07",
		name = "ไฮบริด — อินโดแรปเตอร์",
		type = "Monster",
		tribe = "ไดโน",
		rarity = "Legend",
		power = 2,
		cannotNormalSummon = true,
		hybridMaterials = { "ทีเร็กซ์", "เวโลซิแรปเตอร์" },
		image = "images/ไดโน/8.png",
		ability = "INDORAPTOR_HYBRID",
		desc = '[ห้ามอัญเชิญปกติ]\nสั่งใช้งานจากบนมือ: ส่งการ์ดที่มีชื่อ "ทีเร็กซ์" กับ "เวโลซิแรปเตอร์" จาก มือ, สนาม, นรก ไปมิติมืด เพื่ออัญเชิญการ์ดใบนี้ลงสนาม\nออโต้/1 เทิร์น: เมื่อการ์ดนี้โจมตีลีดเดอร์สำเร็จ สแตร์นยูนิทนี้',
		effects = {
			{
				id = "indoraptor_on_hit_leader",
				trigger = "ON_HIT_LEADER",
				oncePerTurn = true,
				steps = {
					{ block = "STAND_SELF" },
				},
			},
		},
	},
	{
		id = "DNS01",
		name = "DNA กลายพันธุ์",
		type = "NormalSpell",
		rarity = "R",
		effect = "SPELL_DINO_SEARCH_2",
		image = "images/ไดโน/9.png",
		desc = "หายูนิทเผ่า ไดโน ไม่เกิน 2 ใบ จากกองการ์ด แสดงแล้วนำขึ้นมือ",
		effects = {
			{
				id = "spell_dns01",
				trigger = "CAST_SPELL",
				steps = {
					{ block = "SEARCH_DECK", filterTribe = "ไดโน", filterType = "MONSTER", count = 2, upTo = true },
				},
			},
		},
	},
	{
		id = "DNS02",
		name = "ระบบกรงกักกันล้มเหลว",
		type = "NormalSpell",
		rarity = "N",
		effect = "SPELL_DINO_BUFF_ALL",
		image = "images/ไดโน/10.png",
		desc = "ในเทิร์นนี้เผ่า ไดโน ทุกใบ พลังโจมตี +1 หน่วยจนจบเทิร์น",
		effects = {
			{
				id = "spell_dns02",
				trigger = "CAST_SPELL",
				steps = {
					{ block = "ADD_POWER", target = "ALL_ALLIES", filterTribe = "ไดโน", amount = 1, duration = "TURN" },
				},
			},
		},
	},
	{
		id = "DNS03",
		name = "เมเทโอ",
		type = "ReactionSpell",
		rarity = "SR",
		effect = "SPELL_METEOR_WIPE",
		image = "images/ไดโน/11.png",
		desc = "เมื่อการ์ดฝั่งตรงข้ามโจมตีแล้วบนสนามเรามียูนิทเผ่า ไดโน 2 ใบขึ้นไป ทำลายการ์ดทั้งหมดบนสนามทั้ง 2 ฝั่ง",
	},
}

CardDatabase.DECK_LISTS = {
	L01 = {
		"M01", "M01", "M02", "M02", "M03", "M03", "M04", "M04", "M05", "M05",
		"M06", "M06", "S01", "S01", "S02", "S02", "S03", "S03", "S04", "S04",
	},
	L02 = {
		"NM01", "NM01", "NM02", "NM02", "NM03", "NM03", "NM04", "NM04", "NM05", "NM05",
		"NS01", "NS01", "NS02", "NS02", "NS03", "NS03", "NS04", "NS04", "NS05", "NS05",
	},
	L03 = {
		"DM01", "DM01", "DM02", "DM02",
		"DM03", "DM04", "DM05", "DM06", "DM07", "DM08",
		"DM09", "DM10", "DM11", "DM12", "DM13", "DM14",
		"DS01", "DS01", "DS02", "DS02",
	},
	L04 = {
		"DN01", "DN01", "DN02", "DN02", "DN03", "DN03", "DN04", "DN04", "DN05", "DN05",
		"DN06", "DN06", "DN07", "DN07", "DNS01", "DNS01", "DNS02", "DNS02", "DNS03", "DNS03",
	},
}

-- ดัชนีค้นหาการ์ดตาม ID
CardDatabase.CARD_POOL = CardDatabase.CARDS
CardDatabase.BY_ID = {}
for _, card in ipairs(CardDatabase.CARDS) do
	CardDatabase.BY_ID[card.id] = card
end

function CardDatabase.getCardById(cardId: string)
	return CardDatabase.BY_ID[cardId]
end

function CardDatabase.getImageAsset(cardOrImagePath: any): string
	local path = type(cardOrImagePath) == "table" and cardOrImagePath.image or cardOrImagePath
	if type(path) ~= "string" then
		return ""
	end
	if string.find(path, "^rbxassetid://") then
		return path
	end
	local mapped = CardDatabase.IMAGE_ASSETS[path]
	if mapped and mapped ~= "rbxassetid://0" then
		return mapped
	end
	return ""
end

function CardDatabase.getDefaultDeck(leaderId: string): { string }
	return CardDatabase.DECK_LISTS[leaderId] or CardDatabase.DECK_LISTS.L01
end

return CardDatabase
