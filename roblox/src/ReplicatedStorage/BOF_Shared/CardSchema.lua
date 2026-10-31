--!strict
--[[
	============================================================================
	BATTLE OF FRIENDS (แบทเทิล ออฟ เฟรน) — ระบบตรวจสอบฐานข้อมูลการ์ด (CardSchema)
	วางไว้ที่: ReplicatedStorage > BOF_Shared > CardSchema (ModuleScript)
	============================================================================
]]

local CardDatabase = require(script.Parent:WaitForChild("CardDatabase"))

local CardSchema = {}

CardSchema.TRIGGERS = {
	ON_SUMMON = true,
	ON_DESTROY = true,
	ON_BATTLE_DESTROY = true,
	ON_KILL_UNIT = true,
	ON_INTERCEPT = true,
	ON_HIT_LEADER = true,
	ACTIVATE_MAIN = true,
	ACTIVATE_LEADER = true,
	CAST_SPELL = true,
	CONTINUOUS_POWER = true,
	CONTINUOUS_BOARD_AURA = true,
}

CardSchema.CARD_TYPES = {
	Leader = true,
	Monster = true,
	NormalSpell = true,
	ReactionSpell = true,
}

CardSchema.RARITIES = {
	N = true,
	R = true,
	SR = true,
	Legend = true,
}

CardSchema.TRIBES = {
	["ฮีโร่"] = true,
	["ไทย"] = true,
	["วันสิ้นโลก"] = true,
	["ไดโน"] = true,
}

function CardSchema.validateAll()
	local issues = {}
	local byId = {}

	for idx, card in ipairs(CardDatabase.CARDS) do
		local cid = card.id or ("#" .. tostring(idx))
		if byId[cid] then
			table.insert(issues, string.format("[%s] id ซ้ำ", cid))
		else
			byId[cid] = card
		end

		if not CardSchema.CARD_TYPES[card.type] then
			table.insert(issues, string.format("[%s] type '%s' ไม่รู้จัก", cid, tostring(card.type)))
		end
		if card.rarity and not CardSchema.RARITIES[card.rarity] then
			table.insert(issues, string.format("[%s] rarity '%s' ไม่รู้จัก", cid, tostring(card.rarity)))
		end
		if card.tribe and not CardSchema.TRIBES[card.tribe] then
			table.insert(issues, string.format("[%s] tribe '%s' ไม่รู้จัก", cid, tostring(card.tribe)))
		end
	end

	for lid, card in pairs(byId) do
		if card.type == "Leader" and not CardDatabase.DECK_LISTS[lid] then
			table.insert(issues, string.format("[%s] ลีดเดอร์ %s ไม่มีเด็คใน DECK_LISTS", lid, lid))
		end
	end

	for leaderId, list in pairs(CardDatabase.DECK_LISTS) do
		if #list ~= 20 then
			table.insert(issues, string.format("[DECK_LISTS.%s] เด็คมี %d ใบ (ต้อง 20 ใบ)", leaderId, #list))
		end
		local counts = {}
		for _, cid in ipairs(list) do
			local c = byId[cid]
			if not c then
				table.insert(issues, string.format("[DECK_LISTS.%s] ไม่พบการ์ด id '%s'", leaderId, tostring(cid)))
			else
				counts[cid] = (counts[cid] or 0) + 1
				local maxCopies = c.maxCopies or 2
				if counts[cid] > maxCopies then
					table.insert(issues, string.format("[DECK_LISTS.%s] '%s' เกิน maxCopies (%d)", leaderId, cid, maxCopies))
				end
			end
		end
	end

	return issues
end

return CardSchema
