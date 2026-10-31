--!nonstrict
--[[
	============================================================================
	BATTLE OF FRIENDS (แบทเทิล ออฟ เฟรน) — ระบบประมวลผลเกมและสกิลทั้งหมด (GameEngine)
	วางไว้ที่: ReplicatedStorage > BOF_Shared > GameEngine (ModuleScript)
	รองรับทั้งโหมดเล่นกับบอท (AI 3 ระดับความยาก) และโหมดดวลกับเพื่อน (PvP บนโต๊ะในแมพ)
	============================================================================
]]

local CardDatabase = require(script.Parent:WaitForChild("CardDatabase"))

local GameEngine = {}
GameEngine.__index = GameEngine

-- ==================== ฟังก์ชันช่วยเหลือพื้นฐาน ====================
local function deepCopy(orig)
	if type(orig) ~= "table" then
		return orig
	end
	local copy = {}
	for k, v in pairs(orig) do
		copy[deepCopy(k)] = deepCopy(v)
	end
	return copy
end

local function hasCardName(card, keyword: string?): boolean
	if not card or not card.name or not keyword or keyword == "" then
		return false
	end
	return string.find(card.name, keyword, 1, true) ~= nil
end

local function hasCardTribe(card, tribeName: string?): boolean
	if not card or not tribeName or tribeName == "" then
		return false
	end
	if type(card.tribe) == "table" then
		for _, t in ipairs(card.tribe) do
			if t == tribeName then
				return true
			end
		end
		return false
	end
	return card.tribe == tribeName
end

local function isNueaCard(card): boolean
	return hasCardName(card, "เหนือ")
end

local function isSoldierCard(card): boolean
	return hasCardName(card, "ทหาร")
end

local function isPhraiCard(card): boolean
	return hasCardName(card, "ไพร่")
end

local function shuffleArray(arr)
	local copy = {}
	for i = 1, #arr do
		copy[i] = arr[i]
	end
	for i = #copy, 2, -1 do
		local j = math.random(1, i)
		copy[i], copy[j] = copy[j], copy[i]
	end
	return copy
end

local function createCardInstance(template, uid: string)
	local inst = deepCopy(template)
	inst.uid = uid
	inst.state = "Stand"
	inst.basePower = template.power or 0
	inst.permPowerMod = 0
	inst.tempPowerMod = 0
	inst.destroyAtEndOfTurn = false
	inst.burnLeaderOnKill = false
	inst.indestructibleUntilNextTurn = false
	inst.immuneToEnemyEffectsUntilEndOfTurn = false
	inst.returnFromDarkDimensionId = nil
	inst.usedSkills = {}
	return inst
end

local function resetCardStateForZoneChange(card)
	if not card then
		return nil
	end
	card.state = "Stand"
	card.permPowerMod = 0
	card.tempPowerMod = 0
	card.destroyAtEndOfTurn = false
	card.burnLeaderOnKill = false
	card.indestructibleUntilNextTurn = false
	card.immuneToEnemyEffectsUntilEndOfTurn = false
	card.returnFromDarkDimensionId = nil
	card.usedSkills = {}
	return card
end

function GameEngine.getEffectivePower(card, ownerContestant): number
	if not card or card.type ~= "Monster" then
		return 0
	end

	local total = (card.basePower or card.power or 0) + (card.permPowerMod or 0) + (card.tempPowerMod or 0)

	if ownerContestant and ownerContestant.board then
		-- 1. CONTINUOUS_POWER ของตัวการ์ดเอง
		if type(card.effects) == "table" then
			for _, eff in ipairs(card.effects) do
				if eff.trigger == "CONTINUOUS_POWER" then
					local cond = eff.condition
					if not cond then
						total += (eff.amount or 0)
					elseif cond.type == "ALLY_ON_BOARD" then
						for i = 1, 3 do
							local m = ownerContestant.board[i]
							if m and m.id == cond.cardId then
								total += (eff.amount or 0)
								break
							end
						end
					elseif cond.type == "PER_OTHER_ALLY_TRIBE" then
						local cnt = 0
						for i = 1, 3 do
							local m = ownerContestant.board[i]
							if m and m.uid ~= card.uid and hasCardTribe(m, cond.tribe) then
								cnt += 1
							end
						end
						total += cnt * (eff.amountPerUnit or 1)
					elseif cond.type == "PER_OTHER_ALLY_NAME" then
						local cnt = 0
						for i = 1, 3 do
							local m = ownerContestant.board[i]
							if m and m.uid ~= card.uid and hasCardName(m, cond.nameKeyword) then
								cnt += 1
							end
						end
						total += cnt * (eff.amountPerUnit or 1)
					elseif cond.type == "PER_GRAVE_COUNT" then
						local div = math.max(1, cond.divisor or 3)
						local graveLen = ownerContestant.graveyard and #ownerContestant.graveyard or 0
						local stacks = math.floor(graveLen / div)
						total += stacks * (eff.amountPerUnit or 1)
					end
				end
			end
		end

		-- 2. CONTINUOUS_BOARD_AURA จาก Leader (เช่น ขุนเหนือ L02)
		if ownerContestant.leader and type(ownerContestant.leader.effects) == "table" then
			for _, aura in ipairs(ownerContestant.leader.effects) do
				if aura.trigger == "CONTINUOUS_BOARD_AURA" then
					local matchesTribe = (not aura.targetTribe) or hasCardTribe(card, aura.targetTribe)
					local matchesName = (not aura.targetNameKeyword) or hasCardName(card, aura.targetNameKeyword)
					if matchesTribe and matchesName and aura.condition then
						if aura.condition.type == "MIN_TRIBE_COUNT" then
							local cnt = 0
							for i = 1, 3 do
								local m = ownerContestant.board[i]
								if m and hasCardTribe(m, aura.condition.tribe) then
									cnt += 1
								end
							end
							if cnt >= (aura.condition.count or 1) then
								total += (aura.amount or 0)
							end
						elseif aura.condition.type == "MIN_NAME_COUNT" then
							local cnt = 0
							for i = 1, 3 do
								local m = ownerContestant.board[i]
								if m and hasCardName(m, aura.condition.nameKeyword) then
									cnt += 1
								end
							end
							if cnt >= (aura.condition.count or 1) then
								total += (aura.amount or 0)
							end
						end
					end
				end
			end
		end
	end

	return math.max(0, total)
end

function GameEngine.createValidDeck(leaderId: string, mainDeckIds: { string }?, ownerPrefix: string)
	local leaderTemplate = CardDatabase.getCardById(leaderId)
	if not leaderTemplate or leaderTemplate.type ~= "Leader" then
		leaderTemplate = CardDatabase.getCardById("L01")
	end

	local defaultList = CardDatabase.getDefaultDeck(leaderTemplate.id)
	local sourceList = (type(mainDeckIds) == "table" and #mainDeckIds == 20) and mainDeckIds or defaultList

	local idCounter = {}
	local mainDeck = {}

	for idx, cardId in ipairs(sourceList) do
		local tmpl = CardDatabase.getCardById(cardId)
		if tmpl and tmpl.type ~= "Leader" then
			local maxAllowed = tmpl.maxCopies or 2
			idCounter[tmpl.id] = (idCounter[tmpl.id] or 0) + 1
			if idCounter[tmpl.id] <= maxAllowed and #mainDeck < 20 then
				table.insert(mainDeck, createCardInstance(tmpl, string.format("%s_%s_%d", ownerPrefix, tmpl.id, idx)))
			end
		end
	end

	if #mainDeck < 20 then
		for idx, cardId in ipairs(defaultList) do
			if #mainDeck >= 20 then
				break
			end
			local tmpl = CardDatabase.getCardById(cardId)
			if tmpl and tmpl.type ~= "Leader" then
				local maxAllowed = tmpl.maxCopies or 2
				idCounter[tmpl.id] = (idCounter[tmpl.id] or 0) + 1
				if idCounter[tmpl.id] <= maxAllowed then
					table.insert(mainDeck, createCardInstance(tmpl, string.format("%s_fill_%d", ownerPrefix, idx)))
				end
			end
		end
	end

	local leaderCopy = deepCopy(leaderTemplate)
	leaderCopy.hp = leaderTemplate.maxHp or 6
	leaderCopy.abilityUsedThisTurn = false

	return {
		leader = leaderCopy,
		deck = shuffleArray(mainDeck),
	}
end

function GameEngine.createContestant(name: string, isFirstPlayer: boolean, prefix: string, leaderId: string, deckIds: { string }?, isAI: boolean?)
	local setup = GameEngine.createValidDeck(leaderId, deckIds, prefix)
	return {
		name = name,
		prefix = prefix,
		isFirstPlayer = isFirstPlayer,
		isAI = isAI == true,
		turnsTaken = 0,
		attacksThisTurn = 0,
		unitsDestroyedThisTurn = 0,
		futureUsedThisTurn = false,
		allForJitUsed = false,
		mayaOncePerGameUsed = false,
		mulliganDone = isAI == true,
		leader = setup.leader,
		deck = setup.deck,
		hand = {},
		board = { [1] = nil, [2] = nil, [3] = nil },
		graveyard = {},
		darkDimension = {},
		spellQuota = { normalUsed = 0, reactionUsed = 0 },
	}
end

-- ==================== การสร้าง Match Instance ====================
function GameEngine.newMatch(config)
	local self = setmetatable({}, GameEngine)

	self.matchId = config.matchId or ("match_" .. tostring(math.random(100000, 999999)))
	self.mode = config.mode or "BOT" -- "BOT" | "PVP"
	self.aiDifficulty = config.aiDifficulty or "HARD"
	self.onStateChanged = config.onStateChanged -- function(self, latestLog, showcaseBanner)

	self.turnCount = 1
	self.activeSide = "P1" -- "P1" | "P2"
	self.phase = "Mulligan"
	self.gameOver = false
	self.winnerSide = nil
	self.logs = {}

	-- คิวรอผู้เล่นเลือกตัวเลือก (Choice Modal) หรือเลือกช่องบนสนาม (Board Target)
	self.pendingPrompt = nil -- { side = "P1"|"P2", kind = "CHOICE"|"TARGET"|"INTERCEPT", ... }
	self._promptCallbacks = {}

	local p1Leader = config.p1LeaderId or "L01"
	local p1Deck = config.p1DeckList
	local p2Leader = config.p2LeaderId or "L01"
	local p2Deck = config.p2DeckList

	if self.mode == "BOT" and (not config.p2LeaderId or config.p2LeaderId == "RANDOM") then
		local leaders = { "L01", "L02", "L03", "L04" }
		p2Leader = leaders[math.random(1, #leaders)]
		p2Deck = CardDatabase.getDefaultDeck(p2Leader)
	end

	self.contestants = {
		P1 = GameEngine.createContestant(config.p1Name or "Player 1", true, "P1", p1Leader, p1Deck, false),
		P2 = GameEngine.createContestant(
			config.p2Name or (self.mode == "BOT" and "AI Bot" or "Player 2"),
			false,
			"P2",
			p2Leader,
			p2Deck,
			self.mode == "BOT"
		),
	}

	self:drawCards(self.contestants.P1, 5)
	self:drawCards(self.contestants.P2, 5)

	self:addLog(string.format("🎲 เริ่มการดวล [แบทเทิล ออฟ เฟรน]! %s ปะทะ %s (%s)",
		self.contestants.P1.name,
		self.contestants.P2.name,
		self.contestants.P2.leader.name
	))

	return self
end

function GameEngine:getSideOfContestant(contestant): string
	return (contestant == self.contestants.P1) and "P1" or "P2"
end

function GameEngine:getOpponent(contestant)
	return (contestant == self.contestants.P1) and self.contestants.P2 or self.contestants.P1
end

function GameEngine:addLog(message: string)
	local entry = string.format("[Turn %d] %s", self.turnCount, message)
	table.insert(self.logs, entry)
	if #self.logs > 50 then
		table.remove(self.logs, 1)
	end
	self.latestLog = message
end

function GameEngine:broadcast(showcaseBanner)
	if self.onStateChanged then
		self.onStateChanged(self, self.latestLog, showcaseBanner)
	end
end

function GameEngine:drawCards(contestant, count: number)
	for _ = 1, count do
		if #contestant.deck > 0 then
			local card = table.remove(contestant.deck)
			resetCardStateForZoneChange(card)
			table.insert(contestant.hand, card)
		end
	end
end

function GameEngine:performMulligan(side: string, indices: { number }?)
	local contestant = self.contestants[side]
	if not contestant or contestant.mulliganDone then
		return
	end

	if type(indices) == "table" and #indices > 0 then
		local unique = {}
		local sorted = {}
		for _, idx in ipairs(indices) do
			if type(idx) == "number" and idx >= 1 and idx <= #contestant.hand and not unique[idx] and #sorted < 2 then
				unique[idx] = true
				table.insert(sorted, idx)
			end
		end
		table.sort(sorted, function(a, b)
			return a > b
		end)

		local returned = {}
		for _, idx in ipairs(sorted) do
			local c = table.remove(contestant.hand, idx)
			if c then
				table.insert(returned, c)
			end
		end
		self:drawCards(contestant, #returned)
		for _, c in ipairs(returned) do
			table.insert(contestant.deck, c)
		end
		contestant.deck = shuffleArray(contestant.deck)
	end

	contestant.mulliganDone = true

	if self.contestants.P1.mulliganDone and self.contestants.P2.mulliganDone then
		self:startTurn("P1")
	else
		self:addLog(string.format("⏳ %s เลือก Mulligan เสร็จแล้ว รออีกฝ่าย...", contestant.name))
		self:broadcast()
	end
end

-- ==================== ระบบขอมติ/ตัวเลือกจากผู้เล่น (Choice & Target Prompts) ====================
function GameEngine:askChoice(side: string, title: string, description: string, options: { any })
	local cleanOptions = {}
	self._promptCallbacks = {}

	for idx, opt in ipairs(options) do
		table.insert(cleanOptions, {
			index = idx,
			label = opt.label,
			color = opt.color or "#3b82f6",
			disabled = opt.disabled == true,
			cardId = opt.cardId,
			zoneBadge = opt.zoneBadge,
		})
		self._promptCallbacks[idx] = opt.onSelect
	end

	self.pendingPrompt = {
		side = side,
		kind = "CHOICE",
		title = title,
		description = description,
		options = cleanOptions,
	}
	self:broadcast()
end

function GameEngine:askBoardOrHandTarget(side: string, spec)
	self.pendingPrompt = {
		side = side,
		kind = "TARGET",
		targetZone = spec.targetZone, -- "PLAYER_BOARD" | "OPPONENT_BOARD" | "ANY_BOARD" | "PLAYER_HAND"
		remainingCount = spec.remainingCount or 1,
		requireStand = spec.requireStand == true,
		filterTribe = spec.filterTribe,
		filterName = spec.filterName,
		excludeHandUid = spec.excludeHandUid,
		promptText = spec.promptText or "คลิกเลือกเป้าหมาย",
	}
	self._targetSpec = spec
	self:addLog(self.pendingPrompt.promptText)
	self:broadcast()
end

function GameEngine:handlePlayerChoiceResponse(side: string, optionIndex: number)
	if not self.pendingPrompt or self.pendingPrompt.side ~= side or self.pendingPrompt.kind ~= "CHOICE" then
		return
	end
	local opt = self.pendingPrompt.options[optionIndex]
	if not opt or opt.disabled then
		return
	end
	local cb = self._promptCallbacks[optionIndex]
	self.pendingPrompt = nil
	self._promptCallbacks = {}
	if cb then
		cb()
	end
	self:broadcast()
end

function GameEngine:handlePlayerTargetResponse(side: string, zone: string, index: number)
	if not self.pendingPrompt or self.pendingPrompt.side ~= side or self.pendingPrompt.kind ~= "TARGET" then
		return false
	end
	local spec = self._targetSpec
	if not spec then
		self.pendingPrompt = nil
		return false
	end

	local accepted = false
	if spec.targetZone == "PLAYER_HAND" and zone == "SELF_HAND" and spec.onSelectHand then
		accepted = spec.onSelectHand(index) ~= false
	elseif spec.targetZone == "PLAYER_BOARD" and zone == "SELF_BOARD" and spec.onSelectSlot then
		accepted = spec.onSelectSlot(index) == true
	elseif spec.targetZone == "OPPONENT_BOARD" and zone == "ENEMY_BOARD" and spec.onSelectSlot then
		accepted = spec.onSelectSlot(index) == true
	elseif spec.targetZone == "ANY_BOARD" and (zone == "SELF_BOARD" or zone == "ENEMY_BOARD") and spec.onSelectAnyBoardSlot then
		accepted = spec.onSelectAnyBoardSlot(zone == "SELF_BOARD" and "SELF" or "OPPONENT", index) == true
	end

	if accepted then
		self.pendingPrompt.remainingCount -= 1
		if self.pendingPrompt.remainingCount <= 0 or (spec.shouldStopEarly and spec.shouldStopEarly()) then
			local doneCb = spec.onAllSelected
			self.pendingPrompt = nil
			self._targetSpec = nil
			if doneCb then
				doneCb()
			end
		end
		self:broadcast()
		return true
	end
	return false
end

-- ==================== การตรวจสอบจบเกม ====================
function GameEngine:checkGameOver(): boolean
	if self.contestants.P1.leader.hp <= 0 then
		self.gameOver = true
		self.winnerSide = "P2"
		self.pendingPrompt = nil
		self:addLog(string.format("💀 จบเกม! Leader ของ %s HP เหลือ 0 — %s เป็นฝ่ายชนะ!", self.contestants.P1.name, self.contestants.P2.name))
		self:broadcast()
		return true
	end
	if self.contestants.P2.leader.hp <= 0 then
		self.gameOver = true
		self.winnerSide = "P1"
		self.pendingPrompt = nil
		self:addLog(string.format("🏆 จบเกม! Leader ของ %s HP เหลือ 0 — %s เป็นฝ่ายชนะ!", self.contestants.P2.name, self.contestants.P1.name))
		self:broadcast()
		return true
	end
	return false
end

-- ==================== การวางทับและการทำลายยูนิตบนสนาม ====================
function GameEngine:sendOverwrittenMonsterToGrave(contestant, slotIndex: number)
	local oldMonster = contestant.board[slotIndex]
	if not oldMonster then
		return nil
	end
	contestant.board[slotIndex] = nil
	resetCardStateForZoneChange(oldMonster)
	table.insert(contestant.graveyard, oldMonster)
	return oldMonster
end

function GameEngine:destroyBoardMonster(boardOwner, slotIndex: number, isFromBattle: boolean?, isByEnemyEffect: boolean?)
	local monster = boardOwner.board[slotIndex]
	if not monster then
		return { destroyed = false, reason = "empty" }
	end

	if isByEnemyEffect and monster.immuneToEnemyEffectsUntilEndOfTurn then
		self:addLog(string.format('🛡️ "%s" ไม่ได้รับผลจากความสามารถของการ์ดฝ่ายตรงข้ามในเทิร์นนี้!', monster.name))
		return { destroyed = false, reason = "immune", monster = monster }
	end

	if monster.indestructibleUntilNextTurn then
		self:addLog(string.format('🛡️ "%s" ไม่สามารถถูกทำลายได้จนเริ่มเทิร์นถัดไป!', monster.name))
		return { destroyed = false, reason = "indestructible", monster = monster }
	end

	boardOwner.board[slotIndex] = nil
	boardOwner.unitsDestroyedThisTurn = (boardOwner.unitsDestroyedThisTurn or 0) + 1
	local otherContestant = self:getOpponent(boardOwner)

	resetCardStateForZoneChange(monster)
	table.insert(boardOwner.graveyard, monster)

	-- ON_DESTROY
	self:triggerCardEffects(monster, "ON_DESTROY", {
		caster = boardOwner,
		opponent = otherContestant,
		sourceCard = monster,
		sourceSlot = slotIndex,
		isAI = boardOwner.isAI,
	})

	-- ON_BATTLE_DESTROY
	if isFromBattle then
		self:triggerCardEffects(monster, "ON_BATTLE_DESTROY", {
			caster = boardOwner,
			opponent = otherContestant,
			sourceCard = monster,
			sourceSlot = slotIndex,
			isAI = boardOwner.isAI,
		})
	end

	-- ตรวจสอบสกิลจากมือของ แอชชี่ล่า (DM07)
	self:checkAshilaHandTrigger(boardOwner)

	return { destroyed = true, monster = monster }
end

function GameEngine:checkAshilaHandTrigger(contestant)
	if not contestant or (contestant.unitsDestroyedThisTurn or 0) < 2 then
		return
	end
	local ashilaIdx = nil
	for idx, c in ipairs(contestant.hand) do
		if c.id == "DM07" then
			ashilaIdx = idx
			break
		end
	end
	if not ashilaIdx then
		return
	end

	if contestant.isAI then
		local emptySlot = self:findEmptySlot(contestant)
		if emptySlot then
			local summoned = table.remove(contestant.hand, ashilaIdx)
			resetCardStateForZoneChange(summoned)
			summoned.state = "Stand"
			summoned.tempPowerMod += 2
			contestant.board[emptySlot] = summoned
			self:addLog('🔥 [AI แอชชี่ล่า] ยูนิตถูกทำลายครบ 2 ใบ! คอล "แอชชี่ล่า" จากบนมือลงสนามและพลังโจมตี +2 จนจบเทิร์น!')
			self:broadcast({ card = summoned, actor = contestant.name, sub = '🔥 คอล "แอชชี่ล่า" จากมือ พลัง +2!' })
		end
		return
	end

	if self.pendingPrompt then
		return
	end

	local side = self:getSideOfContestant(contestant)
	self:askChoice(
		side,
		'🔥 เงื่อนไขสกิล "แอชชี่ล่า" บนมือทำงาน!',
		string.format("ยูนิตฝั่งคุณถูกทำลายครบ %d ใบในเทิร์นนี้แล้ว!\nต้องการสั่งใช้งาน \"แอชชี่ล่า\" จากบนมือ เพื่อคอลลงสนามและเพิ่มพลังโจมตี +2 จนจบเทิร์นหรือไม่?", contestant.unitsDestroyedThisTurn),
		{
			{
				label = '🔥 สั่งใช้งาน: คอล "แอชชี่ล่า" ลงสนาม (พลังโจมตี +2 จนจบเทิร์น!)',
				color = "#dc2626",
				cardId = "DM07",
				onSelect = function()
					self:summonAshilaBySkillFromHand(contestant)
				end,
			},
			{
				label = "ยังไม่ใช้ตอนนี้ (เก็บไว้บนมือก่อน)",
				color = "#475569",
				onSelect = function() end,
			},
		}
	)
end

function GameEngine:summonAshilaBySkillFromHand(contestant)
	local handIdx = nil
	for i, c in ipairs(contestant.hand) do
		if c.id == "DM07" then
			handIdx = i
			break
		end
	end
	if not handIdx then
		return
	end
	local summoned = table.remove(contestant.hand, handIdx)
	resetCardStateForZoneChange(summoned)
	summoned.state = "Stand"
	summoned.tempPowerMod += 2

	self:placeUnitOnBoardOrAskSlot(contestant, summoned, function(slotIdx)
		self:addLog(string.format('🔥 [สกิลแอชชี่ล่า] คอล "แอชชี่ล่า" ลงช่องที่ %d พลังโจมตี +2 จนจบเทิร์น!', slotIdx))
	end)
end

function GameEngine:findEmptySlot(contestant): number?
	for i = 1, 3 do
		if contestant.board[i] == nil then
			return i
		end
	end
	return nil
end

function GameEngine:countBoardUnits(contestant): number
	local cnt = 0
	for i = 1, 3 do
		if contestant.board[i] ~= nil then
			cnt += 1
		end
	end
	return cnt
end

function GameEngine:placeUnitOnBoardOrAskSlot(contestant, cardToPlace, onAfterPlace)
	local emptySlot = self:findEmptySlot(contestant)
	local opponent = self:getOpponent(contestant)
	if emptySlot then
		contestant.board[emptySlot] = cardToPlace
		self:triggerCardEffects(cardToPlace, "ON_SUMMON", {
			caster = contestant,
			opponent = opponent,
			sourceCard = cardToPlace,
			sourceSlot = emptySlot,
			isAI = contestant.isAI,
		}, function()
			if onAfterPlace then
				onAfterPlace(emptySlot)
			end
			self:broadcast()
		end)
		return
	end

	if contestant.isAI then
		self:sendOverwrittenMonsterToGrave(contestant, 1)
		contestant.board[1] = cardToPlace
		self:triggerCardEffects(cardToPlace, "ON_SUMMON", {
			caster = contestant,
			opponent = opponent,
			sourceCard = cardToPlace,
			sourceSlot = 1,
			isAI = true,
		}, function()
			if onAfterPlace then
				onAfterPlace(1)
			end
			self:broadcast()
		end)
		return
	end

	local side = self:getSideOfContestant(contestant)
	self:askBoardOrHandTarget(side, {
		targetZone = "PLAYER_BOARD",
		remainingCount = 1,
		promptText = string.format('✨ สนามเต็ม 3 ช่อง — คลิกเลือกช่องบนสนามของคุณเพื่อวาง "%s" ทับ!', cardToPlace.name),
		onSelectSlot = function(slotIdx)
			if slotIdx < 1 or slotIdx > 3 then
				return false
			end
			local overwritten = self:sendOverwrittenMonsterToGrave(contestant, slotIdx)
			contestant.board[slotIdx] = cardToPlace
			self:addLog(string.format('✨ คอล "%s" ลงช่องที่ %d (วางทับ "%s")!', cardToPlace.name, slotIdx, overwritten and overwritten.name or "-"))
			self:triggerCardEffects(cardToPlace, "ON_SUMMON", {
				caster = contestant,
				opponent = opponent,
				sourceCard = cardToPlace,
				sourceSlot = slotIdx,
				isAI = false,
			}, function()
				if onAfterPlace then
					onAfterPlace(slotIdx)
				end
				self:broadcast()
			end)
			return true
		end,
	})
end

-- ==================== MODULAR EFFECT ENGINE ====================
function GameEngine:filterCards(cardArray, filterSpec)
	local results = {}
	if type(cardArray) ~= "table" then
		return results
	end
	for _, c in ipairs(cardArray) do
		if c then
			local ok = true
			if filterSpec.cardId and c.id ~= filterSpec.cardId then
				ok = false
			end
			if ok and filterSpec.filterTribe and not hasCardTribe(c, filterSpec.filterTribe) then
				ok = false
			end
			if ok and filterSpec.filterName and not hasCardName(c, filterSpec.filterName) then
				ok = false
			end
			if ok and filterSpec.filterType == "SPELL" and c.type ~= "NormalSpell" and c.type ~= "ReactionSpell" then
				ok = false
			end
			if ok and filterSpec.filterType == "MONSTER" and c.type ~= "Monster" then
				ok = false
			end
			if ok then
				table.insert(results, c)
			end
		end
	end
	return results
end

function GameEngine:canActivateEffect(effectDef, context)
	local caster = context.caster
	local opponent = context.opponent
	local sourceCard = context.sourceCard

	if effectDef.oncePerTurn and sourceCard then
		if sourceCard.type == "Leader" and sourceCard.abilityUsedThisTurn then
			return false, string.format("%s ใช้ความสามารถไปแล้วในเทิร์นนี้!", sourceCard.name)
		end
		if sourceCard.usedSkills and sourceCard.usedSkills[effectDef.id] then
			return false, string.format('"%s" ใช้ความสามารถนี้ไปแล้วในเทิร์นนี้!', sourceCard.name)
		end
	end

	if effectDef.condition then
		local cond = effectDef.condition
		if cond.type == "ALLY_ON_BOARD" then
			local found = false
			for i = 1, 3 do
				if caster.board[i] and caster.board[i].id == cond.cardId then
					found = true
					break
				end
			end
			if not found then
				local partner = CardDatabase.getCardById(cond.cardId)
				return false, string.format('ต้องมี "%s" อยู่บนสนามฝั่งเรา!', partner and partner.name or cond.cardId)
			end
		elseif cond.type == "MIN_TRIBE_COUNT" then
			local cnt = 0
			for i = 1, 3 do
				if caster.board[i] and hasCardTribe(caster.board[i], cond.tribe) then
					cnt += 1
				end
			end
			if cnt < (cond.count or 1) then
				return false, string.format('ต้องมียูนิทเผ่า "%s" บนสนามอย่างน้อย %d ใบ!', cond.tribe, cond.count or 1)
			end
		elseif cond.type == "MIN_NAME_COUNT" then
			local cnt = 0
			for i = 1, 3 do
				if caster.board[i] and hasCardName(caster.board[i], cond.nameKeyword) then
					cnt += 1
				end
			end
			if cnt < (cond.count or 1) then
				return false, string.format('ต้องมียูนิทที่มีคำว่า "%s" บนสนามอย่างน้อย %d ใบ!', cond.nameKeyword, cond.count or 1)
			end
		end
	end

	if type(effectDef.costs) == "table" then
		for _, cost in ipairs(effectDef.costs) do
			if cost.type == "DISCARD_HAND" then
				local avail = 0
				for idx, _ in ipairs(caster.hand) do
					if idx ~= context.excludeHandIndex then
						avail += 1
					end
				end
				if avail < (cost.count or 1) then
					return false, string.format("ต้องมีการ์ดใบอื่นบนมืออย่างน้อย %d ใบเพื่อใช้ทิ้ง!", cost.count or 1)
				end
			elseif cost.type == "REST_ALLY" then
				local standCnt = 0
				for i = 1, 3 do
					if caster.board[i] and caster.board[i].state == "Stand" then
						standCnt += 1
					end
				end
				if standCnt < (cost.count or 1) then
					return false, string.format("ต้องมียูนิทฝั่งเราที่อยู่ในสถานะ Stand อย่างน้อย %d ใบ!", cost.count or 1)
				end
			elseif cost.type == "REST_SELF" then
				if not sourceCard or sourceCard.state ~= "Stand" then
					return false, string.format('"%s" ต้องอยู่ในสถานะ Stand!', sourceCard and sourceCard.name or "ยูนิต")
				end
			elseif cost.type == "REDUCE_SELF_POWER" then
				if not sourceCard or GameEngine.getEffectivePower(sourceCard, caster) < (cost.amount or 1) then
					return false, string.format('พลังของ "%s" น้อยกว่า %d จึงลดพลังไม่ได้!', sourceCard and sourceCard.name or "ยูนิต", cost.amount or 1)
				end
			end
		end
	end

	if effectDef.trigger == "CAST_SPELL" or effectDef.trigger == "ACTIVATE_MAIN" or effectDef.trigger == "ACTIVATE_LEADER" then
		for _, step in ipairs(effectDef.steps or {}) do
			if step.block == "DESTROY_UNIT" and step.target == "OPPONENT" and self:countBoardUnits(opponent) == 0 then
				return false, "ฝ่ายตรงข้ามไม่มีมอนสเตอร์บนสนามให้ทำลาย!"
			elseif step.block == "REDUCE_POWER" and step.target == "ALL_ENEMIES" and self:countBoardUnits(opponent) == 0 then
				return false, "ฝ่ายตรงข้ามไม่มีมอนสเตอร์บนสนาม!"
			elseif step.block == "BOUNCE_UNIT" and step.target == "OPPONENT" and self:countBoardUnits(opponent) == 0 then
				return false, "ฝ่ายตรงข้ามไม่มีมอนสเตอร์บนสนามให้ส่งกลับขึ้นมือ!"
			elseif step.block == "ADD_POWER" and (step.target == "ALLY" or step.target == "ALL_ALLIES") then
				local matchCnt = 0
				for i = 1, 3 do
					local m = caster.board[i]
					if m and (not step.filterTribe or hasCardTribe(m, step.filterTribe)) and (not step.filterName or hasCardName(m, step.filterName)) then
						matchCnt += 1
					end
				end
				if matchCnt == 0 then
					return false, "ไม่มียูนิทเป้าหมายบนสนามฝั่งเราให้เพิ่มพลัง!"
				end
			elseif step.block == "RECOVER_FROM_GRAVE" then
				if #self:filterCards(caster.graveyard, step) == 0 then
					return false, "ไม่มีการ์ดที่ตรงเงื่อนไขอยู่ในกองนรก!"
				end
			elseif step.block == "SEARCH_DECK_OR_GRAVE" then
				if #self:filterCards(caster.deck, step) == 0 and #self:filterCards(caster.graveyard, step) == 0 then
					return false, "ไม่มีการ์ดเป้าหมายอยู่ในกองการ์ดหรือกองนรกเลย!"
				end
			elseif step.block == "SEARCH_DECK" then
				if #self:filterCards(caster.deck, step) == 0 then
					return false, "ไม่มีการ์ดที่ตรงเงื่อนไขอยู่ในกองการ์ดเลย!"
				end
			elseif step.block == "MILL_DECK" then
				local targetSide = step.side == "OPPONENT" and opponent or caster
				if #targetSide.deck == 0 then
					return false, "กองการ์ดเป้าหมายหมดแล้ว!"
				end
			elseif step.block == "CARPET_BOMB_COMPOSITE" then
				local hasSoldier = false
				for i = 1, 3 do
					local m = caster.board[i]
					if m and (m.id == "NM02" or m.id == "NM03" or m.id == "NM04") then
						hasSoldier = true
						break
					end
				end
				if not hasSoldier then
					return false, "ไม่มี ทหารเกณฑ์เหนือ, ทหารพรานเหนือ หรือ ทหารหลวงเหนือ บนสนามเลย!"
				end
			end
		end
	end

	return true, nil
end

function GameEngine:triggerCardEffects(card, triggerType: string, context, onAllDone)
	if not card or type(card.effects) ~= "table" then
		if onAllDone then
			onAllDone()
		end
		return false
	end

	local matching = {}
	for _, e in ipairs(card.effects) do
		if e.trigger == triggerType then
			if not (e.oncePerTurn and card.usedSkills and card.usedSkills[e.id]) then
				table.insert(matching, e)
			end
		end
	end

	if #matching == 0 then
		if onAllDone then
			onAllDone()
		end
		return false
	end

	local idx = 1
	local function runNext()
		if idx > #matching then
			if onAllDone then
				onAllDone()
			end
			return
		end
		local eff = matching[idx]
		idx += 1
		local ctxCopy = deepCopy(context)
		ctxCopy.caster = context.caster
		ctxCopy.opponent = context.opponent
		ctxCopy.sourceCard = card
		self:activateSpecificEffect(eff, ctxCopy, runNext)
	end

	runNext()
	return true
end

function GameEngine:activateSpecificEffect(effectDef, context, onComplete)
	local costQueue = deepCopy(effectDef.costs or {})
	local stepQueue = deepCopy(effectDef.steps or {})

	local function afterCosts()
		local caster = context.caster
		local sourceCard = context.sourceCard

		if effectDef.oncePerTurn and sourceCard then
			if sourceCard.type == "Leader" then
				sourceCard.abilityUsedThisTurn = true
			elseif sourceCard.usedSkills then
				sourceCard.usedSkills[effectDef.id] = true
			end
		end

		if effectDef.trigger == "CAST_SPELL" and context.spellHandUid then
			for i, c in ipairs(caster.hand) do
				if c.uid == context.spellHandUid then
					local usedSpell = table.remove(caster.hand, i)
					caster.spellQuota.normalUsed += 1
					resetCardStateForZoneChange(usedSpell)
					table.insert(caster.graveyard, usedSpell)
					break
				end
			end
		end

		self:runStepQueue(stepQueue, context, function()
			self:broadcast()
			if onComplete then
				onComplete()
			end
		end)
	end

	self:runCostQueue(costQueue, context, afterCosts)
end

function GameEngine:runCostQueue(costQueue, context, onCostsPaid)
	if not costQueue or #costQueue == 0 then
		onCostsPaid()
		return
	end
	local cost = table.remove(costQueue, 1)
	local caster = context.caster
	local opponent = context.opponent
	local sourceCard = context.sourceCard
	local isAI = context.isAI

	if cost.type == "REST_SELF" then
		if sourceCard then
			sourceCard.state = "Rest"
		end
		self:runCostQueue(costQueue, context, onCostsPaid)
		return
	elseif cost.type == "REDUCE_SELF_POWER" then
		if sourceCard then
			sourceCard.permPowerMod = (sourceCard.permPowerMod or 0) - (cost.amount or 1)
		end
		self:runCostQueue(costQueue, context, onCostsPaid)
		return
	elseif cost.type == "DISCARD_HAND" then
		local count = cost.count or 1
		if isAI then
			for _ = 1, count do
				if #caster.hand == 0 then
					break
				end
				local d = table.remove(caster.hand)
				resetCardStateForZoneChange(d)
				table.insert(caster.graveyard, d)
				if cost.triggerDiscardSkill and d.id == "DM05" and #opponent.hand > 0 then
					local oppD = table.remove(opponent.hand)
					resetCardStateForZoneChange(oppD)
					table.insert(opponent.graveyard, oppD)
				end
			end
			self:runCostQueue(costQueue, context, onCostsPaid)
			return
		end

		local side = self:getSideOfContestant(caster)
		self:askBoardOrHandTarget(side, {
			targetZone = "PLAYER_HAND",
			remainingCount = count,
			excludeHandUid = sourceCard and sourceCard.uid or nil,
			promptText = string.format("👉 [%s] คลิกเลือกการ์ดบนมือของคุณ %d ใบเพื่อทิ้งลงนรก", sourceCard and sourceCard.name or "จ่าย Cost", count),
			onSelectHand = function(handIdx)
				local card = caster.hand[handIdx]
				if not card or (sourceCard and card.uid == sourceCard.uid) then
					return false
				end
				local discarded = table.remove(caster.hand, handIdx)
				resetCardStateForZoneChange(discarded)
				table.insert(caster.graveyard, discarded)
				self:addLog(string.format('🗑️ ทิ้ง "%s" จากมือลงนรก', discarded.name))
				if cost.triggerDiscardSkill and discarded.id == "DM05" and #opponent.hand > 0 then
					local oppDiscarded = table.remove(opponent.hand)
					resetCardStateForZoneChange(oppDiscarded)
					table.insert(opponent.graveyard, oppDiscarded)
					self:addLog(string.format('🍬 [ออโต้ซึรุรุ] ถูกทิ้งจากสกิลโอนามิ -> อีกฝ่ายต้องทิ้ง "%s" 1 ใบ!', oppDiscarded.name))
				end
				return true
			end,
			onAllSelected = function()
				self:runCostQueue(costQueue, context, onCostsPaid)
			end,
		})
		return
	elseif cost.type == "REST_ALLY" then
		local count = cost.count or 1
		if isAI then
			local rested = 0
			for i = 1, 3 do
				local m = caster.board[i]
				if m and m.state == "Stand" and rested < count then
					m.state = "Rest"
					rested += 1
				end
			end
			self:runCostQueue(costQueue, context, onCostsPaid)
			return
		end

		local side = self:getSideOfContestant(caster)
		local selectedSlots = {}
		self:askBoardOrHandTarget(side, {
			targetZone = "PLAYER_BOARD",
			requireStand = true,
			remainingCount = count,
			promptText = string.format("👉 [%s] คลิกเลือกยูนิทฝ่ายเราที่ Stand อยู่ (%d ใบ) เพื่อเปลี่ยนเป็น Rest", sourceCard and sourceCard.name or "จ่าย Cost", count),
			onSelectSlot = function(slotIdx)
				local unit = caster.board[slotIdx]
				if not unit or unit.state ~= "Stand" or selectedSlots[slotIdx] then
					return false
				end
				selectedSlots[slotIdx] = true
				unit.state = "Rest"
				return true
			end,
			onAllSelected = function()
				self:runCostQueue(costQueue, context, onCostsPaid)
			end,
		})
		return
	end

	self:runCostQueue(costQueue, context, onCostsPaid)
end

function GameEngine:runStepQueue(stepQueue, context, onAllStepsComplete)
	if not stepQueue or #stepQueue == 0 then
		onAllStepsComplete()
		return
	end
	local step = table.remove(stepQueue, 1)
	self:executeSingleStep(step, context, function()
		self:runStepQueue(stepQueue, context, onAllStepsComplete)
	end)
end

function GameEngine:executeSingleStep(step, context, nextStep)
	local caster = context.caster
	local opponent = context.opponent
	local sourceCard = context.sourceCard
	local isAI = context.isAI
	local side = self:getSideOfContestant(caster)
	local cardTitle = sourceCard and string.format("[%s]", sourceCard.name) or "[เอฟเฟกต์]"

	if step.block == "DRAW" then
		local targetSide = step.side == "OPPONENT" and opponent or caster
		local count = step.count or 1
		if step.bonusIfGraveAtLeast and #caster.graveyard >= step.bonusIfGraveAtLeast then
			count = step.bonusCount or count
		end
		self:drawCards(targetSide, count)
		self:addLog(string.format("✨ %s %s จั่วการ์ด %d ใบ!", cardTitle, targetSide.name, count))
		nextStep()
		return

	elseif step.block == "HEAL_LEADER" then
		local targetSide = step.side == "OPPONENT" and opponent or caster
		local oldHp = targetSide.leader.hp
		targetSide.leader.hp = math.min(targetSide.leader.maxHp, targetSide.leader.hp + (step.amount or 1))
		self:addLog(string.format("✨ %s ฟื้นฟู HP ลีดเดอร์ (%d -> %d/%d)!", cardTitle, oldHp, targetSide.leader.hp, targetSide.leader.maxHp))
		nextStep()
		return

	elseif step.block == "DAMAGE_LEADER" then
		local targetSide = step.side == "OPPONENT" and opponent or caster
		targetSide.leader.hp = math.max(0, targetSide.leader.hp - (step.amount or 1))
		self:addLog(string.format("💥 %s ทำดาเมจใส่ Leader ของ %s %d หน่วย!", cardTitle, targetSide.name, step.amount or 1))
		self:checkGameOver()
		nextStep()
		return

	elseif step.block == "MILL_DECK" then
		local targetSide = step.side == "OPPONENT" and opponent or caster
		local count = step.count or 1
		local milledNames = {}
		for _ = 1, count do
			if #targetSide.deck == 0 then
				break
			end
			local milled = table.remove(targetSide.deck)
			resetCardStateForZoneChange(milled)
			table.insert(targetSide.graveyard, milled)
			table.insert(milledNames, milled.name)
		end
		if #milledNames > 0 then
			self:addLog(string.format('❄️ %s ส่ง "%s" ใบบนสุดของกอง %s ลงนรก!', cardTitle, table.concat(milledNames, ", "), targetSide.name))
		end
		nextStep()
		return

	elseif step.block == "DESTROY_UNIT" then
		if step.target == "BOTH" and step.select == "ALL" then
			for i = 1, 3 do
				if caster.board[i] then
					self:destroyBoardMonster(caster, i, false, false)
				end
				if opponent.board[i] then
					self:destroyBoardMonster(opponent, i, false, true)
				end
			end
			self:addLog(string.format("☄️ %s ทำลายยูนิตทั้งหมดบนสนามทั้ง 2 ฝั่ง!", cardTitle))
			nextStep()
			return
		end

		local targetOwner = step.target == "SELF" and caster or opponent
		local isEnemyEffect = (targetOwner ~= caster)

		if step.select == "ALL" then
			for i = 1, 3 do
				if targetOwner.board[i] then
					self:destroyBoardMonster(targetOwner, i, false, isEnemyEffect)
				end
			end
			self:addLog(string.format("💥 %s ทำลายยูนิตบนสนามของ %s!", cardTitle, targetOwner.name))
			nextStep()
			return
		end

		local validSlots = {}
		for i = 1, 3 do
			if targetOwner.board[i] ~= nil then
				table.insert(validSlots, i)
			end
		end
		if #validSlots == 0 then
			nextStep()
			return
		end

		local count = math.min(step.count or 1, #validSlots)
		if isAI then
			for _ = 1, count do
				local bestSlot = nil
				local maxPwr = -1
				for i = 1, 3 do
					local m = targetOwner.board[i]
					if m and m.id ~= "NM05" and not m.immuneToEnemyEffectsUntilEndOfTurn then
						local p = GameEngine.getEffectivePower(m, targetOwner)
						if p > maxPwr then
							maxPwr = p
							bestSlot = i
						end
					end
				end
				if bestSlot then
					self:destroyBoardMonster(targetOwner, bestSlot, false, isEnemyEffect)
				end
			end
			nextStep()
			return
		end

		self:askBoardOrHandTarget(side, {
			targetZone = (targetOwner == caster) and "PLAYER_BOARD" or "OPPONENT_BOARD",
			remainingCount = count,
			promptText = string.format("💥 %s คลิกเลือกยูนิทของ %s บนสนามเพื่อทำลาย (%d ใบ)!", cardTitle, targetOwner.name, count),
			shouldStopEarly = function()
				return self:countBoardUnits(targetOwner) == 0
			end,
			onSelectSlot = function(slotIdx)
				local targetMonster = targetOwner.board[slotIdx]
				if not targetMonster then
					return false
				end
				self:destroyBoardMonster(targetOwner, slotIdx, false, isEnemyEffect)
				self:addLog(string.format('💥 %s สั่งทำลาย "%s" สำเร็จ!', cardTitle, targetMonster.name))
				return true
			end,
			onAllSelected = nextStep,
		})
		return

	elseif step.block == "ADD_POWER" then
		local amount = step.amount or 1
		local prop = step.duration == "TURN" and "tempPowerMod" or "permPowerMod"
		local durLabel = step.duration == "TURN" and "จนจบเทิร์น" or "ถาวร"

		if step.target == "SELF_UNIT" then
			if sourceCard then
				sourceCard[prop] = (sourceCard[prop] or 0) + amount
				self:addLog(string.format("🔥 %s เพิ่มพลังโจมตี +%d (%s)!", cardTitle, amount, durLabel))
			end
			nextStep()
			return
		end

		if step.target == "ALL_ALLIES" then
			for i = 1, 3 do
				local m = caster.board[i]
				if m and (not step.filterTribe or hasCardTribe(m, step.filterTribe)) and (not step.filterName or hasCardName(m, step.filterName)) then
					m[prop] = (m[prop] or 0) + amount
				end
			end
			self:addLog(string.format("✨ %s เพิ่มพลังโจมตีให้ยูนิทฝั่งเรา +%d (%s)!", cardTitle, amount, durLabel))
			nextStep()
			return
		end

		local validAllies = {}
		for i = 1, 3 do
			local m = caster.board[i]
			if m and (not step.filterTribe or hasCardTribe(m, step.filterTribe)) and (not step.filterName or hasCardName(m, step.filterName)) then
				table.insert(validAllies, m)
			end
		end
		if #validAllies == 0 then
			nextStep()
			return
		end

		if isAI then
			local picked = validAllies[1]
			for _, m in ipairs(validAllies) do
				if m.state == "Stand" and m.id ~= "NM05" then
					picked = m
					break
				end
			end
			if picked then
				picked[prop] = (picked[prop] or 0) + amount
			end
			nextStep()
			return
		end

		self:askBoardOrHandTarget(side, {
			targetZone = "PLAYER_BOARD",
			filterTribe = step.filterTribe,
			filterName = step.filterName,
			remainingCount = step.count or 1,
			promptText = string.format("✨ %s คลิกเลือกยูนิทฝั่งเราเพื่อเพิ่มพลังโจมตี +%d (%s)!", cardTitle, amount, durLabel),
			onSelectSlot = function(slotIdx)
				local ally = caster.board[slotIdx]
				if not ally then
					return false
				end
				if step.filterTribe and not hasCardTribe(ally, step.filterTribe) then
					return false
				end
				if step.filterName and not hasCardName(ally, step.filterName) then
					return false
				end
				ally[prop] = (ally[prop] or 0) + amount
				self:addLog(string.format('✨ %s เพิ่มพลังโจมตีให้ "%s" +%d!', cardTitle, ally.name, amount))
				return true
			end,
			onAllSelected = nextStep,
		})
		return

	elseif step.block == "REDUCE_POWER" then
		local amount = step.amount or 1
		local prop = step.duration == "TURN" and "tempPowerMod" or "permPowerMod"

		if step.target == "ALL_ENEMIES" then
			for i = 1, 3 do
				local m = opponent.board[i]
				if m and not m.immuneToEnemyEffectsUntilEndOfTurn then
					m[prop] = (m[prop] or 0) - amount
				end
			end
			self:addLog(string.format("📉 %s ลดพลังโจมตีของยูนิทฝ่ายตรงข้ามทุกใบลง %d หน่วย!", cardTitle, amount))
			nextStep()
			return
		end

		if isAI then
			for i = 1, 3 do
				local m = opponent.board[i]
				if m and m.id ~= "NM05" and not m.immuneToEnemyEffectsUntilEndOfTurn then
					m[prop] = (m[prop] or 0) - amount
					break
				end
			end
			nextStep()
			return
		end

		self:askBoardOrHandTarget(side, {
			targetZone = "OPPONENT_BOARD",
			remainingCount = step.count or 1,
			promptText = string.format("📉 %s คลิกเลือกยูนิทฝ่ายตรงข้ามเพื่อลดพลังโจมตี -%d!", cardTitle, amount),
			onSelectSlot = function(slotIdx)
				local enemy = opponent.board[slotIdx]
				if not enemy or enemy.immuneToEnemyEffectsUntilEndOfTurn then
					return false
				end
				enemy[prop] = (enemy[prop] or 0) - amount
				self:addLog(string.format('📉 %s ลดพลังโจมตีของ "%s" ลง %d หน่วย!', cardTitle, enemy.name, amount))
				return true
			end,
			onAllSelected = nextStep,
		})
		return

	elseif step.block == "FLEX_POWER" then
		local prop = step.duration == "TURN" and "tempPowerMod" or "permPowerMod"
		if isAI then
			local targetEnemy = nil
			for i = 1, 3 do
				local m = opponent.board[i]
				if m and m.id ~= "NM05" and not m.immuneToEnemyEffectsUntilEndOfTurn then
					targetEnemy = m
					break
				end
			end
			if targetEnemy then
				targetEnemy[prop] = (targetEnemy[prop] or 0) - (step.minusAmount or 1)
			elseif sourceCard then
				sourceCard[prop] = (sourceCard[prop] or 0) + (step.plusAmount or 1)
			end
			nextStep()
			return
		end

		self:askBoardOrHandTarget(side, {
			targetZone = "ANY_BOARD",
			remainingCount = 1,
			promptText = string.format("🏹 %s คลิกเลือกยูนิท 1 ใบบนสนาม (ฝั่งเรา +%d / อีกฝ่าย -%d)", cardTitle, step.plusAmount or 1, step.minusAmount or 1),
			onSelectAnyBoardSlot = function(whichSide, slotIdx)
				if whichSide == "SELF" then
					local ally = caster.board[slotIdx]
					if not ally then
						return false
					end
					ally[prop] = (ally[prop] or 0) + (step.plusAmount or 1)
					self:addLog(string.format('🏹 %s เพิ่มพลังโจมตีให้ "%s" +%d!', cardTitle, ally.name, step.plusAmount or 1))
					return true
				else
					local enemy = opponent.board[slotIdx]
					if not enemy or enemy.immuneToEnemyEffectsUntilEndOfTurn then
						return false
					end
					enemy[prop] = (enemy[prop] or 0) - (step.minusAmount or 1)
					self:addLog(string.format('🏹 %s ลดพลังโจมตีของ "%s" -%d!', cardTitle, enemy.name, step.minusAmount or 1))
					return true
				end
			end,
			onAllSelected = nextStep,
		})
		return

	elseif step.block == "BOUNCE_UNIT" then
		local targetOwner = step.target == "SELF" and caster or opponent
		local validSlots = {}
		for i = 1, 3 do
			local m = targetOwner.board[i]
			if m and not m.immuneToEnemyEffectsUntilEndOfTurn then
				table.insert(validSlots, i)
			end
		end
		if #validSlots == 0 then
			nextStep()
			return
		end

		if isAI then
			local sIdx = validSlots[1]
			local bounced = targetOwner.board[sIdx]
			targetOwner.board[sIdx] = nil
			resetCardStateForZoneChange(bounced)
			table.insert(targetOwner.hand, bounced)
			nextStep()
			return
		end

		self:askBoardOrHandTarget(side, {
			targetZone = (targetOwner == caster) and "PLAYER_BOARD" or "OPPONENT_BOARD",
			remainingCount = step.count or 1,
			promptText = string.format("🌪️ %s คลิกเลือกยูนิทของ %s บนสนามเพื่อส่งกลับขึ้นมือ!", cardTitle, targetOwner.name),
			onSelectSlot = function(slotIdx)
				local targetMonster = targetOwner.board[slotIdx]
				if not targetMonster or (targetOwner ~= caster and targetMonster.immuneToEnemyEffectsUntilEndOfTurn) then
					return false
				end
				targetOwner.board[slotIdx] = nil
				resetCardStateForZoneChange(targetMonster)
				table.insert(targetOwner.hand, targetMonster)
				self:addLog(string.format('🌪️ %s ส่ง "%s" กลับขึ้นมือสำเร็จ!', cardTitle, targetMonster.name))
				return true
			end,
			onAllSelected = nextStep,
		})
		return

	elseif step.block == "GRANT_STATUS" then
		if step.target == "ALL_ALLIES" then
			for i = 1, 3 do
				local m = caster.board[i]
				if m then
					if step.status == "INDESTRUCTIBLE" then
						m.indestructibleUntilNextTurn = true
					elseif step.status == "BURN_ON_KILL" then
						m.burnLeaderOnKill = true
					end
				end
			end
			nextStep()
			return
		end

		if isAI then
			for i = 1, 3 do
				local m = caster.board[i]
				if m then
					if step.status == "INDESTRUCTIBLE" then
						m.indestructibleUntilNextTurn = true
					elseif step.status == "BURN_ON_KILL" then
						m.burnLeaderOnKill = true
					end
					break
				end
			end
			nextStep()
			return
		end

		self:askBoardOrHandTarget(side, {
			targetZone = "PLAYER_BOARD",
			remainingCount = step.count or 1,
			promptText = string.format("🌟 %s คลิกเลือกยูนิทฝ่ายเรา 1 ใบบนสนามเพื่อรับความสามารถพิเศษ!", cardTitle),
			onSelectSlot = function(slotIdx)
				local ally = caster.board[slotIdx]
				if not ally then
					return false
				end
				if step.status == "BURN_ON_KILL" then
					ally.burnLeaderOnKill = true
				elseif step.status == "INDESTRUCTIBLE" then
					ally.indestructibleUntilNextTurn = true
				end
				self:addLog(string.format('🌟 %s มอบความสามารถพิเศษให้ "%s" สำเร็จ!', cardTitle, ally.name))
				return true
			end,
			onAllSelected = nextStep,
		})
		return

	elseif step.block == "STAND_SELF" then
		if sourceCard then
			for i = 1, 3 do
				if caster.board[i] and caster.board[i].uid == sourceCard.uid then
					sourceCard.state = "Stand"
					self:addLog(string.format("⚡ %s เปลี่ยนสถานะกลับเป็น Stand พร้อมลุยต่อ!", cardTitle))
					break
				end
			end
		end
		nextStep()
		return

	elseif step.block == "MARK_END_TURN_DESTROY" then
		if sourceCard then
			sourceCard.destroyAtEndOfTurn = true
		end
		nextStep()
		return

	elseif step.block == "TRIGGER_ALLY_PASSIVE" then
		for i = 1, 3 do
			local m = caster.board[i]
			if m and m.id == step.allyId then
				m.permPowerMod = (m.permPowerMod or 0) + (step.amount or 1)
			end
		end
		nextStep()
		return

	elseif step.block == "RECOVER_FROM_GRAVE" then
		local allMatches = self:filterCards(caster.graveyard, step)
		local candidates = {}
		for _, c in ipairs(allMatches) do
			if not sourceCard or c.uid ~= sourceCard.uid then
				table.insert(candidates, c)
			end
		end
		if #candidates == 0 then
			nextStep()
			return
		end

		if isAI or step.autoPickFirst or #candidates == 1 then
			local picked = candidates[1]
			for idx, c in ipairs(caster.graveyard) do
				if c.uid == picked.uid then
					local rec = table.remove(caster.graveyard, idx)
					resetCardStateForZoneChange(rec)
					table.insert(caster.hand, rec)
					self:addLog(string.format('🪦 %s นำ "%s" จากกองนรกขึ้นมือ!', cardTitle, rec.name))
					break
				end
			end
			nextStep()
			return
		end

		local seen = {}
		local options = {}
		for _, targetCard in ipairs(candidates) do
			if not seen[targetCard.id] then
				seen[targetCard.id] = true
				table.insert(options, {
					label = string.format('นำ "%s" ขึ้นมือ', targetCard.name),
					color = "#16a34a",
					cardId = targetCard.id,
					zoneBadge = "จากนรก",
					onSelect = function()
						for gIdx, c in ipairs(caster.graveyard) do
							if c.id == targetCard.id then
								local rec = table.remove(caster.graveyard, gIdx)
								resetCardStateForZoneChange(rec)
								table.insert(caster.hand, rec)
								self:addLog(string.format('✨ %s นำ "%s" จากกองนรกขึ้นมือสำเร็จ!', cardTitle, rec.name))
								break
							end
						end
						nextStep()
					end,
				})
			end
		end
		self:askChoice(side, "🪦 " .. cardTitle, "เลือกการ์ด 1 ใบจากกองนรกเพื่อนำกลับขึ้นมือ:", options)
		return

	elseif step.block == "SEARCH_DECK_OR_GRAVE" then
		local inGrave = self:filterCards(caster.graveyard, step)
		local inDeck = self:filterCards(caster.deck, step)

		local function placeCard(foundCard, fromZone)
			resetCardStateForZoneChange(foundCard)
			if fromZone == "deck" then
				caster.deck = shuffleArray(caster.deck)
			end
			if step.destination == "HAND" then
				table.insert(caster.hand, foundCard)
				self:addLog(string.format('🦅 %s นำ "%s" ขึ้นมือเรียบร้อย!', cardTitle, foundCard.name))
				nextStep()
			elseif step.destination == "BOARD" then
				foundCard.state = "Stand"
				if step.grantImmunity then
					foundCard.immuneToEnemyEffectsUntilEndOfTurn = true
				end
				self:placeUnitOnBoardOrAskSlot(caster, foundCard, function()
					nextStep()
				end)
			end
		end

		if isAI or (step.destination == "BOARD" and step.cardId) then
			if #inGrave > 0 then
				for i, c in ipairs(caster.graveyard) do
					if c.uid == inGrave[1].uid then
						placeCard(table.remove(caster.graveyard, i), "grave")
						return
					end
				end
			elseif #inDeck > 0 then
				for i, c in ipairs(caster.deck) do
					if c.uid == inDeck[1].uid then
						placeCard(table.remove(caster.deck, i), "deck")
						return
					end
				end
			end
			nextStep()
			return
		end

		local options = {}
		if #inDeck > 0 then
			table.insert(options, {
				label = string.format('ดึง "%s" จากกองการ์ด', inDeck[1].name),
				color = "#0284c7",
				cardId = inDeck[1].id,
				zoneBadge = "จากกองการ์ด",
				onSelect = function()
					for i, c in ipairs(caster.deck) do
						if c.id == inDeck[1].id then
							placeCard(table.remove(caster.deck, i), "deck")
							return
						end
					end
					nextStep()
				end,
			})
		end
		if #inGrave > 0 then
			table.insert(options, {
				label = string.format('ดึง "%s" จากกองนรก', inGrave[1].name),
				color = "#7c3aed",
				cardId = inGrave[1].id,
				zoneBadge = "จากนรก",
				onSelect = function()
					for i, c in ipairs(caster.graveyard) do
						if c.id == inGrave[1].id then
							placeCard(table.remove(caster.graveyard, i), "grave")
							return
						end
					end
					nextStep()
				end,
			})
		end
		self:askChoice(side, "🔍 " .. cardTitle, "เลือกการ์ดที่ต้องการค้นหา:", options)
		return

	elseif step.block == "SEARCH_DECK" then
		local maxPick = step.count or 1
		local pickedNames = {}

		local function finishSearch()
			caster.deck = shuffleArray(caster.deck)
			if #pickedNames > 0 then
				self:addLog(string.format('🧬 %s ค้นหา "%s" จากกองการ์ดขึ้นมือ พร้อมสับกอง!', cardTitle, table.concat(pickedNames, ", ")))
			end
			nextStep()
		end

		if isAI then
			for _ = 1, maxPick do
				local matches = self:filterCards(caster.deck, step)
				if #matches == 0 then
					break
				end
				for i, c in ipairs(caster.deck) do
					if c.uid == matches[1].uid then
						local picked = table.remove(caster.deck, i)
						resetCardStateForZoneChange(picked)
						table.insert(caster.hand, picked)
						table.insert(pickedNames, picked.name)
						break
					end
				end
			end
			finishSearch()
			return
		end

		local function promptNextPick(pickNum)
			local matches = self:filterCards(caster.deck, step)
			if #matches == 0 or pickNum > maxPick then
				finishSearch()
				return
			end

			local seen = {}
			local options = {}
			for _, targetCard in ipairs(matches) do
				if not seen[targetCard.id] then
					seen[targetCard.id] = true
					table.insert(options, {
						label = string.format('นำ "%s" (Power %d) ขึ้นมือ', targetCard.name, targetCard.power or 0),
						color = "#16a34a",
						cardId = targetCard.id,
						zoneBadge = "จากกองการ์ด",
						onSelect = function()
							for dIdx, c in ipairs(caster.deck) do
								if c.id == targetCard.id then
									local picked = table.remove(caster.deck, dIdx)
									resetCardStateForZoneChange(picked)
									table.insert(caster.hand, picked)
									table.insert(pickedNames, picked.name)
									break
								end
							end
							promptNextPick(pickNum + 1)
						end,
					})
				end
			end

			if step.upTo and pickNum > 1 then
				table.insert(options, {
					label = string.format("✅ พอแค่นี้ (เลือกแล้ว %d ใบ)", #pickedNames),
					color = "#475569",
					onSelect = finishSearch,
				})
			end

			self:askChoice(
				side,
				string.format("🧬 %s (ใบที่ %d/%d)", cardTitle, pickNum, maxPick),
				"คลิกที่รูปการ์ดจากกองการ์ดเพื่อนำขึ้นมือ:",
				options
			)
		end

		promptNextPick(1)
		return

	elseif step.block == "CARPET_BOMB_COMPOSITE" then
		local conscriptCount, rangerCount, royalCount = 0, 0, 0
		for i = 1, 3 do
			local m = caster.board[i]
			if m then
				if m.id == "NM04" then
					conscriptCount += 1
				elseif m.id == "NM03" then
					rangerCount += 1
				elseif m.id == "NM02" then
					royalCount += 1
				end
			end
		end
		local dynamicSteps = {}
		if conscriptCount > 0 then
			table.insert(dynamicSteps, { block = "ADD_POWER", target = "ALL_ALLIES", filterName = "เหนือ", amount = conscriptCount, duration = "TURN" })
		end
		if royalCount > 0 then
			table.insert(dynamicSteps, { block = "GRANT_STATUS", target = "ALL_ALLIES", status = "INDESTRUCTIBLE" })
		end
		if rangerCount > 0 and self:countBoardUnits(opponent) > 0 then
			table.insert(dynamicSteps, { block = "DESTROY_UNIT", target = "OPPONENT", count = rangerCount, select = "CHOOSE" })
		end
		self:runStepQueue(dynamicSteps, context, nextStep)
		return
	end

	nextStep()
end

-- ==================== ระบบเทิร์น (Start / Main / Battle / End Phase) ====================
function GameEngine:startTurn(side: string)
	if self.gameOver then
		return
	end
	self.activeSide = side
	local contestant = self.contestants[side]
	self.phase = "Start Phase"

	contestant.turnsTaken += 1
	contestant.attacksThisTurn = 0
	contestant.unitsDestroyedThisTurn = 0
	contestant.futureUsedThisTurn = false
	contestant.leader.abilityUsedThisTurn = false
	contestant.spellQuota.normalUsed = 0
	contestant.spellQuota.reactionUsed = 0

	self:drawCards(contestant, 1)

	for i = 1, 3 do
		local m = contestant.board[i]
		if m then
			m.state = "Stand"
			m.usedSkills = {}
			m.indestructibleUntilNextTurn = false
		end
	end

	local function enterMainPhase()
		if self.gameOver then
			return
		end
		self.phase = "Main Phase"
		self:addLog(string.format("🟢 เทิร์นของ %s (Turn %d - Main Phase)", contestant.name, self.turnCount))
		self:broadcast()
		if contestant.isAI then
			task.spawn(function()
				self:runAITurnRoutine()
			end)
		end
	end

	if contestant.leader.id == "L02" then
		self:triggerKhunNueaStartTurn(contestant, enterMainPhase)
		return
	end

	self:triggerDoomsdayStartTurnQueue(contestant, enterMainPhase)
end

function GameEngine:triggerKhunNueaStartTurn(contestant, onDone)
	local inGraveIdx, inDeckIdx = nil, nil
	for i, c in ipairs(contestant.graveyard) do
		if c.id == "NM01" then
			inGraveIdx = i
			break
		end
	end
	for i, c in ipairs(contestant.deck) do
		if c.id == "NM01" then
			inDeckIdx = i
			break
		end
	end
	if not inGraveIdx and not inDeckIdx then
		onDone()
		return
	end

	if contestant.isAI then
		if inGraveIdx then
			local c = table.remove(contestant.graveyard, inGraveIdx)
			resetCardStateForZoneChange(c)
			table.insert(contestant.hand, c)
		elseif inDeckIdx then
			local c = table.remove(contestant.deck, inDeckIdx)
			resetCardStateForZoneChange(c)
			table.insert(contestant.hand, c)
			contestant.deck = shuffleArray(contestant.deck)
		end
		onDone()
		return
	end

	local side = self:getSideOfContestant(contestant)
	local options = {}
	if inGraveIdx then
		table.insert(options, {
			label = 'นำ "ไพร่ชาวนาเหนือ" จากกองนรกขึ้นมือ',
			color = "#7c3aed",
			cardId = "NM01",
			zoneBadge = "จากนรก",
			onSelect = function()
				local c = table.remove(contestant.graveyard, inGraveIdx)
				if c then
					resetCardStateForZoneChange(c)
					table.insert(contestant.hand, c)
					self:addLog('👑 [ขุนเหนือ] นำ "ไพร่ชาวนาเหนือ" 1 ใบจากกองนรกขึ้นมือสำเร็จ!')
				end
				onDone()
			end,
		})
	end
	if inDeckIdx then
		table.insert(options, {
			label = 'นำ "ไพร่ชาวนาเหนือ" จากกองการ์ดขึ้นมือ',
			color = "#0284c7",
			cardId = "NM01",
			zoneBadge = "จากกองการ์ด",
			onSelect = function()
				local c = table.remove(contestant.deck, inDeckIdx)
				if c then
					resetCardStateForZoneChange(c)
					table.insert(contestant.hand, c)
					contestant.deck = shuffleArray(contestant.deck)
					self:addLog('👑 [ขุนเหนือ] นำ "ไพร่ชาวนาเหนือ" 1 ใบจากกองการ์ดขึ้นมือสำเร็จ!')
				end
				onDone()
			end,
		})
	end
	table.insert(options, {
		label = "ไม่นำขึ้นมือ (ข้าม)",
		color = "#475569",
		onSelect = onDone,
	})
	self:askChoice(side, "👑 ออโต้เมื่อเข้าเทิร์น: ขุนเหนือ", 'เลือกนำ "ไพร่ชาวนาเหนือ" 1 ใบขึ้นมือ:', options)
end

function GameEngine:triggerDoomsdayStartTurnQueue(contestant, onDone)
	local function checkDebirun()
		local hasDebirun = false
		for i = 1, 3 do
			if contestant.board[i] and contestant.board[i].id == "DM04" then
				hasDebirun = true
				break
			end
		end
		if not hasDebirun then
			onDone()
			return
		end
		self:triggerDebirunStartTurn(contestant, onDone)
	end

	if contestant.leader.id == "L03" then
		local validTargets = {}
		for _, c in ipairs(contestant.graveyard) do
			if c.type == "Monster" and not c.cannotNormalSummon and not c.isSpy and (c.basePower or c.power or 0) <= 2 then
				table.insert(validTargets, c)
			end
		end
		if #validTargets > 0 then
			if contestant.isAI then
				local emptySlot = self:findEmptySlot(contestant)
				if emptySlot then
					for i, g in ipairs(contestant.graveyard) do
						if g.uid == validTargets[1].uid then
							local called = table.remove(contestant.graveyard, i)
							resetCardStateForZoneChange(called)
							contestant.board[emptySlot] = called
							self:triggerCardEffects(called, "ON_SUMMON", {
								caster = contestant,
								opponent = self:getOpponent(contestant),
								sourceCard = called,
								sourceSlot = emptySlot,
								isAI = true,
							})
							break
						end
					end
				end
				checkDebirun()
				return
			end

			local side = self:getSideOfContestant(contestant)
			local seen = {}
			local options = {}
			for _, c in ipairs(validTargets) do
				if not seen[c.id] then
					seen[c.id] = true
					table.insert(options, {
						label = string.format('คอล "%s" (Power %d) จากนรก', c.name, c.power or 0),
						color = "#7c3aed",
						cardId = c.id,
						zoneBadge = "จากนรก",
						onSelect = function()
							for gIdx, g in ipairs(contestant.graveyard) do
								if g.id == c.id then
									local called = table.remove(contestant.graveyard, gIdx)
									resetCardStateForZoneChange(called)
									self:placeUnitOnBoardOrAskSlot(contestant, called, function()
										checkDebirun()
									end)
									return
								end
							end
							checkDebirun()
						end,
					})
				end
			end
			table.insert(options, { label = "ไม่คอล (ข้าม)", color = "#475569", onSelect = checkDebirun })
			self:askChoice(side, "⏳ ออโต้เมื่อเข้าเทิร์น: วันสิ้นโลก", "เลือกคอลยูนิตพลังพื้นฐานไม่เกิน 2 จากนรก 1 ใบลงสนาม:", options)
			return
		end
	end

	checkDebirun()
end

function GameEngine:triggerDebirunStartTurn(contestant, onComplete)
	for i, c in ipairs(contestant.graveyard) do
		if c.id == "DS01" then
			local spell = table.remove(contestant.graveyard, i)
			local drawCnt = #contestant.graveyard >= 5 and 2 or 1
			self:drawCards(contestant, drawCnt)
			for s = 1, 3 do
				if contestant.board[s] then
					contestant.board[s].tempPowerMod += 1
					break
				end
			end
			table.insert(contestant.graveyard, spell)
			self:addLog('😈 [ออโต้ เดบิรุน] ค้นหา "เบิกเนตรแห่งแสง" และบังคับใช้งานทันที!')
			onComplete()
			return
		end
	end
	onComplete()
end

function GameEngine:executeEndPhaseCleanup(contestant)
	for i = 1, 3 do
		local m = contestant.board[i]
		if m then
			if m.returnFromDarkDimensionId then
				local baseId = m.returnFromDarkDimensionId
				local futureName = m.name
				contestant.board[i] = nil
				resetCardStateForZoneChange(m)
				table.insert(contestant.graveyard, m)

				for dIdx, d in ipairs(contestant.darkDimension) do
					if d.id == baseId then
						local returned = table.remove(contestant.darkDimension, dIdx)
						resetCardStateForZoneChange(returned)
						returned.state = "Stand"
						contestant.board[i] = returned
						self:addLog(string.format('🌌 [จบเทิร์นอนาคต] นำ "%s" ลงนรก และคอล "%s" จากมิติมืดกลับลงสนาม!', futureName, returned.name))
						break
					end
				end
			elseif m.destroyAtEndOfTurn then
				self:destroyBoardMonster(contestant, i)
				self:addLog(string.format('🔥 "%s" ถูกทำลายเมื่อจบเทิร์นตามเงื่อนไขความสามารถ!', m.name))
			end
		end
	end

	for _, sideKey in ipairs({ "P1", "P2" }) do
		local sideObj = self.contestants[sideKey]
		for i = 1, 3 do
			local m = sideObj.board[i]
			if m then
				m.tempPowerMod = 0
				m.immuneToEnemyEffectsUntilEndOfTurn = false
			end
		end
	end
end

function GameEngine:advancePhaseOrTurn(side: string)
	if self.gameOver or self.activeSide ~= side or self.pendingPrompt then
		return
	end
	if self.phase == "Main Phase" then
		self.phase = "Battle Phase"
		self:addLog(string.format("⚔️ %s เข้าสู่ Battle Phase!", self.contestants[side].name))
		self:broadcast()
	elseif self.phase == "Battle Phase" then
		self:endTurn(side)
	end
end

function GameEngine:endTurn(side: string)
	if self.gameOver or self.activeSide ~= side or self.pendingPrompt then
		return
	end
	local current = self.contestants[side]
	self:executeEndPhaseCleanup(current)
	self.phase = "End Phase"
	self.turnCount += 1
	local nextSide = (side == "P1") and "P2" or "P1"
	self:startTurn(nextSide)
end

-- ==================== การสั่งใช้งานการ์ดของผู้เล่น (Summon / Spell / Hybrid / Juti / Future / Leader) ====================
function GameEngine:getHybridMaterialCandidates(contestant, nameKeyword: string, excludeUids)
	local results = {}
	for _, c in ipairs(contestant.graveyard) do
		if c and not excludeUids[c.uid] and hasCardName(c, nameKeyword) then
			table.insert(results, { card = c, zone = "grave", zoneLabel = "จากนรก" })
		end
	end
	for _, c in ipairs(contestant.hand) do
		if c and not excludeUids[c.uid] and hasCardName(c, nameKeyword) then
			table.insert(results, { card = c, zone = "hand", zoneLabel = "จากบนมือ" })
		end
	end
	for slotIdx = 1, 3 do
		local c = contestant.board[slotIdx]
		if c and not excludeUids[c.uid] and hasCardName(c, nameKeyword) then
			table.insert(results, { card = c, zone = "board", slotIdx = slotIdx, zoneLabel = string.format("จากสนาม (ช่อง %d)", slotIdx) })
		end
	end
	return results
end

function GameEngine:canSummonHybridCard(contestant, hybridCard): boolean
	if not contestant or not hybridCard or type(hybridCard.hybridMaterials) ~= "table" then
		return false
	end
	local matA, matB = hybridCard.hybridMaterials[1], hybridCard.hybridMaterials[2]
	local exA = { [hybridCard.uid] = true }
	local listA = self:getHybridMaterialCandidates(contestant, matA, exA)
	for _, itemA in ipairs(listA) do
		local exB = { [hybridCard.uid] = true, [itemA.card.uid] = true }
		local listB = self:getHybridMaterialCandidates(contestant, matB, exB)
		if #listB > 0 then
			return true
		end
	end
	return false
end

function GameEngine:removeCardToDarkDimension(contestant, item)
	local targetUid = item.card.uid
	local removed = nil
	if item.zone == "grave" then
		for i, c in ipairs(contestant.graveyard) do
			if c.uid == targetUid then
				removed = table.remove(contestant.graveyard, i)
				break
			end
		end
	elseif item.zone == "hand" then
		for i, c in ipairs(contestant.hand) do
			if c.uid == targetUid then
				removed = table.remove(contestant.hand, i)
				break
			end
		end
	elseif item.zone == "board" then
		for i = 1, 3 do
			if contestant.board[i] and contestant.board[i].uid == targetUid then
				removed = contestant.board[i]
				contestant.board[i] = nil
				break
			end
		end
	end
	if removed then
		resetCardStateForZoneChange(removed)
		table.insert(contestant.darkDimension, removed)
	end
	return removed
end

function GameEngine:playHandCard(side: string, handIndex: number, targetSlot: number?)
	if self.gameOver or self.activeSide ~= side or self.pendingPrompt then
		return
	end
	local contestant = self.contestants[side]
	local opponent = self:getOpponent(contestant)
	local card = contestant.hand[handIndex]
	if not card then
		return
	end

	-- 1. การ์ดเวทมนตร์ NormalSpell
	if card.type == "NormalSpell" then
		if self.phase ~= "Main Phase" then
			self:addLog("⚠️ ใช้ Normal Spell ได้ใน Main Phase เท่านั้น!")
			self:broadcast()
			return
		end
		if contestant.spellQuota.normalUsed >= 1 then
			self:addLog("❌ คุณใช้โควต้า Normal Spell (1 ใบ/เทิร์น) ไปแล้วในเทิร์นนี้!")
			self:broadcast()
			return
		end
		local spellEffect = nil
		for _, e in ipairs(card.effects or {}) do
			if e.trigger == "CAST_SPELL" then
				spellEffect = e
				break
			end
		end
		if not spellEffect then
			return
		end
		local ctx = {
			caster = contestant,
			opponent = opponent,
			sourceCard = card,
			spellHandUid = card.uid,
			excludeHandIndex = handIndex,
			isAI = false,
		}
		local ok, reason = self:canActivateEffect(spellEffect, ctx)
		if not ok then
			self:addLog(string.format('⚠️ ใช้ "%s" ไม่ได้: %s', card.name, reason or ""))
			self:broadcast()
			return
		end
		self:broadcast({ card = card, actor = contestant.name, sub = string.format('✨ ร่ายเวทมนตร์ "%s"!', card.name) })
		self:activateSpecificEffect(spellEffect, ctx)
		return
	end

	if card.type == "ReactionSpell" then
		self:addLog('ℹ️ การ์ด Reaction Spell จะเด้งถามอัตโนมัติเมื่อฝ่ายตรงข้ามประกาศโจมตีและเงื่อนไขครบ!')
		self:broadcast()
		return
	end

	-- 2. การ์ดมอนสเตอร์ไฮบริด (DN06 / DN07)
	if type(card.hybridMaterials) == "table" then
		if not self:canSummonHybridCard(contestant, card) then
			self:addLog(string.format('🚫 ไม่สามารถอัญเชิญ "%s" ได้! ต้องมีการ์ดวัตถุดิบครบใน มือ, สนาม หรือ นรก!', card.name))
			self:broadcast()
			return
		end
		local matA, matB = card.hybridMaterials[1], card.hybridMaterials[2]
		local candidatesA = self:getHybridMaterialCandidates(contestant, matA, { [card.uid] = true })
		local optionsA = {}
		for _, itemA in ipairs(candidatesA) do
			local candidatesB = self:getHybridMaterialCandidates(contestant, matB, { [card.uid] = true, [itemA.card.uid] = true })
			if #candidatesB > 0 then
				table.insert(optionsA, {
					label = string.format('ส่ง "%s" ไปมิติมืด', itemA.card.name),
					color = "#7c3aed",
					cardId = itemA.card.id,
					zoneBadge = itemA.zoneLabel,
					onSelect = function()
						local optionsB = {}
						for _, itemB in ipairs(candidatesB) do
							table.insert(optionsB, {
								label = string.format('ส่ง "%s" ไปมิติมืด -> อัญเชิญ!', itemB.card.name),
								color = "#16a34a",
								cardId = itemB.card.id,
								zoneBadge = itemB.zoneLabel,
								onSelect = function()
									self:removeCardToDarkDimension(contestant, itemA)
									self:removeCardToDarkDimension(contestant, itemB)
									for hIdx, hc in ipairs(contestant.hand) do
										if hc.uid == card.uid then
											local hybrid = table.remove(contestant.hand, hIdx)
											resetCardStateForZoneChange(hybrid)
											hybrid.state = "Stand"
											self:broadcast({ card = hybrid, actor = contestant.name, sub = "🦖 อัญเชิญไฮบริดจากมิติมืด!" })
											self:placeUnitOnBoardOrAskSlot(contestant, hybrid)
											break
										end
									end
								end,
							})
						end
						table.insert(optionsB, { label = "❌ ยกเลิก", color = "#475569", onSelect = function() end })
						self:askChoice(side, string.format("🦖 อัญเชิญไฮบริด: %s (วัตถุดิบ 2/2)", card.name), string.format('เลือกการ์ด "%s" เพื่อส่งไปมิติมืด:', matB), optionsB)
					end,
				})
			end
		end
		table.insert(optionsA, { label = "❌ ยกเลิก", color = "#475569", onSelect = function() end })
		self:askChoice(side, string.format("🦖 อัญเชิญไฮบริด: %s (วัตถุดิบ 1/2)", card.name), string.format('เลือกการ์ด "%s" เพื่อส่งไปมิติมืด:', matA), optionsA)
		return
	end

	-- 3. การ์ดอนาคต (DM09 - DM14)
	if card.futureBaseId then
		if contestant.futureUsedThisTurn then
			self:addLog('🚫 คุณใช้ความสามารถ "อนาคต" ไปแล้วในเทิร์นนี้ (จำกัด 1 ครั้ง/เทิร์น)!')
			self:broadcast()
			return
		end
		local baseSlot = nil
		for i = 1, 3 do
			if contestant.board[i] and contestant.board[i].id == card.futureBaseId then
				baseSlot = i
				break
			end
		end
		if not baseSlot then
			self:addLog(string.format('🚫 ต้องมี "%s" อยู่บนสนามฝั่งเราเพื่อส่งไปมิติมืด!', card.futureBaseName or card.futureBaseId))
			self:broadcast()
			return
		end
		local futureCard = table.remove(contestant.hand, handIndex)
		local baseUnit = contestant.board[baseSlot]
		contestant.futureUsedThisTurn = true
		resetCardStateForZoneChange(baseUnit)
		table.insert(contestant.darkDimension, baseUnit)

		resetCardStateForZoneChange(futureCard)
		futureCard.state = "Stand"
		futureCard.returnFromDarkDimensionId = baseUnit.id
		contestant.board[baseSlot] = futureCard
		self:addLog(string.format('🌌 [อนาคต] ส่ง "%s" ไปมิติมืด และอัญเชิญ "%s" ลงสนาม!', baseUnit.name, futureCard.name))
		self:broadcast({ card = futureCard, actor = contestant.name, sub = "🌌 อัญเชิญร่างอนาคต!" })
		self:triggerCardEffects(futureCard, "ON_SUMMON", {
			caster = contestant,
			opponent = opponent,
			sourceCard = futureCard,
			sourceSlot = baseSlot,
			isAI = false,
		})
		self:broadcast()
		return
	end

	-- 4. สายลับไพร่เหนือ (NM05)
	if card.isSpy or card.id == "NM05" then
		local emptyEnemy = self:findEmptySlot(opponent)
		if not emptyEnemy then
			self:addLog("⚠️ สนามฝ่ายตรงข้ามเต็มทั้ง 3 ช่อง ไม่สามารถวางสายลับได้!")
			self:broadcast()
			return
		end
		local spy = table.remove(contestant.hand, handIndex)
		resetCardStateForZoneChange(spy)
		spy.state = "Stand"
		opponent.board[emptyEnemy] = spy
		self:addLog(string.format('🕵️ ส่ง "%s" ไปยึดช่องที่ %d บนสนามของ %s!', spy.name, emptyEnemy, opponent.name))
		self:broadcast({ card = spy, actor = contestant.name, sub = "🕵️ ส่งสายลับยึดสนามศัตรู!" })
		return
	end

	-- 5. อัญเชิญมอนสเตอร์ปกติลงสนาม
	if card.cannotNormalSummon then
		self:addLog(string.format('🚫 "%s" ไม่สามารถอัญเชิญแบบปกติได้!', card.name))
		self:broadcast()
		return
	end

	local chosenSlot = targetSlot
	if not chosenSlot or chosenSlot < 1 or chosenSlot > 3 then
		chosenSlot = self:findEmptySlot(contestant) or 1
	end

	local summoned = table.remove(contestant.hand, handIndex)
	resetCardStateForZoneChange(summoned)
	summoned.state = "Stand"

	if contestant.board[chosenSlot] ~= nil then
		self:sendOverwrittenMonsterToGrave(contestant, chosenSlot)
	end
	contestant.board[chosenSlot] = summoned
	self:addLog(string.format('✅ %s อัญเชิญ "%s" ลงช่องที่ %d!', contestant.name, summoned.name, chosenSlot))
	self:broadcast({ card = summoned, actor = contestant.name, sub = string.format("⚔️ อัญเชิญลงช่องที่ %d", chosenSlot) })

	self:triggerCardEffects(summoned, "ON_SUMMON", {
		caster = contestant,
		opponent = opponent,
		sourceCard = summoned,
		sourceSlot = chosenSlot,
		isAI = false,
	}, function()
		self:broadcast()
	end)
end

-- ==================== กดใช้สกิล Leader และสกิลมอนสเตอร์บนสนาม ====================
function GameEngine:activateLeaderSkill(side: string)
	if self.gameOver or self.activeSide ~= side or self.phase ~= "Main Phase" or self.pendingPrompt then
		return
	end
	local contestant = self.contestants[side]
	local opponent = self:getOpponent(contestant)
	local leaderEffects = {}
	for _, e in ipairs(contestant.leader.effects or {}) do
		if e.trigger == "ACTIVATE_LEADER" then
			table.insert(leaderEffects, e)
		end
	end
	if #leaderEffects == 0 then
		return
	end
	local eff = leaderEffects[1]
	local ctx = { caster = contestant, opponent = opponent, sourceCard = contestant.leader, isAI = false }
	local ok, reason = self:canActivateEffect(eff, ctx)
	if not ok then
		self:addLog("❌ " .. (reason or "ใช้สกิลลีดเดอร์ไม่ได้"))
		self:broadcast()
		return
	end
	self:broadcast({ card = contestant.leader, actor = contestant.name, sub = "👑 สั่งใช้งานสกิล Leader!" })
	self:activateSpecificEffect(eff, ctx)
end

function GameEngine:activateBoardMonsterSkill(side: string, slotIndex: number)
	if self.gameOver or self.activeSide ~= side or self.phase ~= "Main Phase" or self.pendingPrompt then
		return
	end
	local contestant = self.contestants[side]
	local opponent = self:getOpponent(contestant)
	local monster = contestant.board[slotIndex]
	if not monster then
		return
	end

	local mainEffects = {}
	for _, e in ipairs(monster.effects or {}) do
		if e.trigger == "ACTIVATE_MAIN" then
			table.insert(mainEffects, e)
		end
	end
	if #mainEffects == 0 then
		return
	end

	local ctx = { caster = contestant, opponent = opponent, sourceCard = monster, sourceSlot = slotIndex, isAI = false }
	if #mainEffects == 1 then
		local eff = mainEffects[1]
		local ok, reason = self:canActivateEffect(eff, ctx)
		if not ok then
			self:addLog("⚠️ " .. (reason or "เงื่อนไขสกิลไม่ครบ"))
			self:broadcast()
			return
		end
		self:broadcast({ card = monster, actor = contestant.name, sub = eff.label or "⚡ ใช้สกิลยูนิต!" })
		self:activateSpecificEffect(eff, ctx)
		return
	end

	local options = {}
	for idx, eff in ipairs(mainEffects) do
		local ok = self:canActivateEffect(eff, ctx)
		table.insert(options, {
			label = eff.label or ("สกิลที่ " .. tostring(idx)),
			disabled = not ok,
			color = idx == 1 and "#0284c7" or "#16a34a",
			onSelect = function()
				self:activateSpecificEffect(eff, ctx)
			end,
		})
	end
	table.insert(options, { label = "❌ ยกเลิก", color = "#475569", onSelect = function() end })
	self:askChoice(side, "⚡ เลือกใช้ความสามารถของ " .. monster.name, "เลือกสกิลที่ต้องการสั่งใช้งาน:", options)
end

-- ==================== ระบบการต่อสู้ (Battle & Intercept & Reaction) ====================
function GameEngine:canContestantAttack(contestant, monster)
	if self.gameOver then
		return false, "เกมจบแล้ว"
	end
	if not monster or monster.state ~= "Stand" then
		return false, "ยูนิทต้องอยู่ในสถานะ Stand เท่านั้น"
	end
	if contestant.isFirstPlayer and contestant.turnsTaken == 1 then
		return false, "กฎผู้เล่นเริ่มคนแรก: ห้ามโจมตีใน Turn 1!"
	end
	if not contestant.isFirstPlayer and contestant.turnsTaken == 1 and contestant.attacksThisTurn >= 1 then
		return false, "กฎผู้เล่นเริ่มคนที่สอง: เทิร์นแรกโจมตีได้เพียง 1 ครั้ง!"
	end
	return true, nil
end

function GameEngine:declareAttack(side: string, attackerSlot: number, targetType: string, targetSlot: number?, onAttackDone)
	if self.gameOver or self.activeSide ~= side or self.phase ~= "Battle Phase" or self.pendingPrompt then
		if onAttackDone then
			onAttackDone()
		end
		return
	end

	local attacker = self.contestants[side]
	local defender = self:getOpponent(attacker)
	local attackingMonster = attacker.board[attackerSlot]

	local allowed, reason = self:canContestantAttack(attacker, attackingMonster)
	if not allowed then
		if not attacker.isAI then
			self:addLog("🚫 โจมตีไม่ได้: " .. (reason or ""))
			self:broadcast()
		end
		if onAttackDone then
			onAttackDone()
		end
		return
	end

	if targetType == "monster" then
		local targetMonster = defender.board[targetSlot or 0]
		if not targetMonster then
			if onAttackDone then
				onAttackDone()
			end
			return
		end
		if targetMonster.id == "DM03" then
			for i = 1, 3 do
				if defender.board[i] and defender.board[i].id == "DM05" then
					self:addLog('🛡️ "มายอา" ไม่ตกเป็นเป้าหมายการโจมตีตราบเท่าที่มี "ซึรุรุ" อยู่บนสนาม!')
					self:broadcast()
					if onAttackDone then
						onAttackDone()
					end
					return
				end
			end
		end
	end

	attackingMonster.state = "Rest"
	attacker.attacksThisTurn += 1

	local targetLabel = targetType == "leader" and defender.leader.name or (defender.board[targetSlot] and defender.board[targetSlot].name or "เป้าหมาย")
	self:broadcast({
		card = attackingMonster,
		actor = attacker.name .. " ประกาศโจมตี!",
		sub = string.format('⚔️ "%s" โจมตีใส่ %s!', attackingMonster.name, targetLabel),
	})

	self:checkDefenderReactions(attacker, defender, attackerSlot, targetType, targetSlot, onAttackDone)
end

function GameEngine:checkDefenderReactions(attacker, defender, attackerSlot, targetType, targetSlot, onComplete)
	local attackingMonster = attacker.board[attackerSlot]
	if not attackingMonster then
		if onComplete then
			onComplete()
		end
		return
	end

	local function continueNormalCombat()
		if targetType == "monster" and targetSlot then
			self:compareAndDestroyMonsters(attacker, attackerSlot, defender, targetSlot, function(msg)
				self:addLog(string.format('⚔️ [%s] "%s" โจมตี! -> %s', attacker.name, attackingMonster.name, msg))
				self:checkGameOver()
				self:broadcast()
				if onComplete then
					onComplete()
				end
			end)
		else
			self:proceedToIntercept(attacker, defender, attackerSlot, onComplete)
		end
	end

	-- ตรวจการ์ด เมเทโอ (DNS03) และ พวกเราจะช่วยเอง (DS02)
	local dinoCnt = 0
	for i = 1, 3 do
		if defender.board[i] and hasCardTribe(defender.board[i], "ไดโน") then
			dinoCnt += 1
		end
	end
	local dns03Idx = nil
	local ds02Idx = nil
	for idx, c in ipairs(defender.hand) do
		if c.id == "DNS03" and not dns03Idx then
			dns03Idx = idx
		elseif c.id == "DS02" and not ds02Idx then
			ds02Idx = idx
		end
	end
	local monsterGraveCnt = 0
	for _, c in ipairs(defender.graveyard) do
		if c.type == "Monster" then
			monsterGraveCnt += 1
		end
	end

	local canMeteor = (dns03Idx ~= nil) and (dinoCnt >= 2) and (defender.spellQuota.reactionUsed < 1)
	local canWeWillHelp = (ds02Idx ~= nil) and (monsterGraveCnt >= 5) and (defender.spellQuota.reactionUsed < 1)

	if defender.isAI then
		if canMeteor and (targetType == "leader" or defender.leader.hp <= 4) then
			local spell = table.remove(defender.hand, dns03Idx)
			defender.spellQuota.reactionUsed += 1
			table.insert(defender.graveyard, spell)
			for i = 1, 3 do
				if defender.board[i] then
					self:destroyBoardMonster(defender, i, false, false)
				end
				if attacker.board[i] then
					self:destroyBoardMonster(attacker, i, false, true)
				end
			end
			self:addLog('☄️ [AI - เมเทโอ] ทำลายการ์ดทั้งหมดบนสนามทั้ง 2 ฝั่งและหยุดการโจมตี!')
			self:broadcast({ card = spell, actor = defender.name, sub = "☄️ เมเทโอ! ล้างสนามทั้งสองฝั่ง!" })
			if onComplete then
				onComplete()
			end
			return
		end
		continueNormalCombat()
		return
	end

	if canMeteor or canWeWillHelp then
		local defSide = self:getSideOfContestant(defender)
		local options = {}
		if canMeteor then
			table.insert(options, {
				label = '☄️ ใช้การ์ด "เมเทโอ" (ทำลายการ์ดทั้งหมดบนสนามทั้ง 2 ฝั่ง)',
				color = "#dc2626",
				cardId = "DNS03",
				onSelect = function()
					local spell = table.remove(defender.hand, dns03Idx)
					defender.spellQuota.reactionUsed += 1
					table.insert(defender.graveyard, spell)
					for i = 1, 3 do
						if defender.board[i] then
							self:destroyBoardMonster(defender, i, false, false)
						end
						if attacker.board[i] then
							self:destroyBoardMonster(attacker, i, false, true)
						end
					end
					self:addLog('☄️ [เมเทโอ] ทำลายการ์ดทั้งหมดบนสนามทั้ง 2 ฝั่งสำเร็จ!')
					self:broadcast({ card = spell, actor = defender.name, sub = "☄️ เมเทโอ! ล้างสนามทั้งสองฝั่ง!" })
					if onComplete then
						onComplete()
					end
				end,
			})
		end
		if canWeWillHelp then
			table.insert(options, {
				label = '🛡️ ใช้การ์ด "พวกเราจะช่วยเอง" (นำยูนิต 5 ใบในนรกกลับเข้ากอง แล้วยกเลิกการโจมตี)',
				color = "#0284c7",
				cardId = "DS02",
				onSelect = function()
					local spell = table.remove(defender.hand, ds02Idx)
					defender.spellQuota.reactionUsed += 1
					local ret = 0
					for i = #defender.graveyard, 1, -1 do
						if defender.graveyard[i].type == "Monster" and ret < 5 then
							local u = table.remove(defender.graveyard, i)
							resetCardStateForZoneChange(u)
							table.insert(defender.deck, u)
							ret += 1
						end
					end
					defender.deck = shuffleArray(defender.deck)
					table.insert(defender.graveyard, spell)
					self:addLog('🛡️ [พวกเราจะช่วยเอง] นำยูนิต 5 ใบในนรกกลับเข้ากอง — ยกเลิกการโจมตีสำเร็จ!')
					self:broadcast({ card = spell, actor = defender.name, sub = "🛡️ ยกเลิกการโจมตี!" })
					if onComplete then
						onComplete()
					end
				end,
			})
		end
		table.insert(options, {
			label = "ไม่ใช้เวทรีแอค (ดำเนินการป้องกันตามปกติ)",
			color = "#475569",
			onSelect = continueNormalCombat,
		})
		self:askChoice(defSide, "⚡ ฝ่ายตรงข้ามประกาศโจมตี!", string.format('"%s" กำลังโจมตีเข้ามา! ต้องการใช้การ์ดรีแอคชันหรือไม่?', attackingMonster.name), options)
		return
	end

	continueNormalCombat()
end

function GameEngine:proceedToIntercept(attacker, defender, attackerSlot, onComplete)
	local attackingMonster = attacker.board[attackerSlot]
	if not attackingMonster then
		if onComplete then
			onComplete()
		end
		return
	end

	local standBlockers = {}
	for i = 1, 3 do
		local m = defender.board[i]
		if m and m.state == "Stand" then
			table.insert(standBlockers, i)
		end
	end

	local function directLeaderHit()
		defender.leader.hp = math.max(0, defender.leader.hp - 1)
		self:addLog(string.format('💥 "%s" โจมตีเข้าใส่ Leader ของ %s โดยตรง! (เหลือ %d/%d HP)', attackingMonster.name, defender.name, defender.leader.hp, defender.leader.maxHp))
		if self:checkGameOver() then
			if onComplete then
				onComplete()
			end
			return
		end
		self:triggerCardEffects(attackingMonster, "ON_HIT_LEADER", {
			caster = attacker,
			opponent = defender,
			sourceCard = attackingMonster,
			sourceSlot = attackerSlot,
			isAI = attacker.isAI,
		}, function()
			self:checkGameOver()
			self:broadcast()
			if onComplete then
				onComplete()
			end
		end)
	end

	if #standBlockers == 0 then
		directLeaderHit()
		return
	end

	local function resolveBlocker(chosenSlot)
		local blocker = defender.board[chosenSlot]
		if not blocker then
			directLeaderHit()
			return
		end
		blocker.state = "Rest"
		local standOnSurvive = false
		for _, e in ipairs(blocker.effects or {}) do
			if e.trigger == "ON_INTERCEPT" and e.standOnSurvive then
				standOnSurvive = true
				break
			end
		end

		self:triggerCardEffects(blocker, "ON_INTERCEPT", {
			caster = defender,
			opponent = attacker,
			sourceCard = blocker,
			sourceSlot = chosenSlot,
			isAI = defender.isAI,
		}, function()
			self:compareAndDestroyMonsters(attacker, attackerSlot, defender, chosenSlot, function(msg)
				if standOnSurvive and defender.board[chosenSlot] and defender.board[chosenSlot].uid == blocker.uid then
					blocker.state = "Stand"
					msg = msg .. string.format(' (🛡️ "%s" ป้องกันสำเร็จและลุกขึ้น Stand!)', blocker.name)
				end
				self:addLog(string.format('🛡️ %s ส่ง "%s" เข้า Intercept! -> %s', defender.name, blocker.name, msg))
				self:checkGameOver()
				self:broadcast()
				if onComplete then
					onComplete()
				end
			end)
		end)
	end

	if defender.isAI then
		local atkPwr = GameEngine.getEffectivePower(attackingMonster, attacker)
		local chosen = nil
		for _, sIdx in ipairs(standBlockers) do
			local b = defender.board[sIdx]
			if b.id ~= "NM05" then
				local bonus = (b.id == "DN03") and 2 or 0
				if GameEngine.getEffectivePower(b, defender) + bonus >= atkPwr then
					chosen = sIdx
					break
				end
			end
		end
		if not chosen and defender.leader.hp <= 2 then
			for _, sIdx in ipairs(standBlockers) do
				if defender.board[sIdx].id ~= "NM05" then
					chosen = sIdx
					break
				end
			end
		end
		if chosen then
			resolveBlocker(chosen)
		else
			directLeaderHit()
		end
		return
	end

	local defSide = self:getSideOfContestant(defender)
	local options = {}
	for _, sIdx in ipairs(standBlockers) do
		local b = defender.board[sIdx]
		table.insert(options, {
			label = string.format('🛡️ ส่ง "%s" (ช่อง %d) รับการโจมตีแทน', b.name, sIdx),
			color = "#0284c7",
			cardId = b.id,
			zoneBadge = string.format("ช่อง %d (Power %d)", sIdx, GameEngine.getEffectivePower(b, defender)),
			onSelect = function()
				resolveBlocker(sIdx)
			end,
		})
	end
	table.insert(options, {
		label = "💥 ไม่ป้องกัน (Leader เสีย 1 HP)",
		color = "#dc2626",
		onSelect = directLeaderHit,
	})

	self:askChoice(
		defSide,
		"🛡️ Intercept: ป้องกันการโจมตีใส่ Leader!",
		string.format('⚠️ "%s" (Power %d) กำลังโจมตี Leader ของคุณ! เลือกยูนิตที่ Stand อยู่เพื่อรับการโจมตีแทน:', attackingMonster.name, GameEngine.getEffectivePower(attackingMonster, attacker)),
		options
	)
end

function GameEngine:compareAndDestroyMonsters(contestantA, slotA, contestantB, slotB, onAfterCombat)
	local monsterA = contestantA.board[slotA]
	local monsterB = contestantB.board[slotB]
	if not monsterA or not monsterB then
		if onAfterCombat then
			onAfterCombat("")
		end
		return
	end

	local totalA = GameEngine.getEffectivePower(monsterA, contestantA)
	local totalB = GameEngine.getEffectivePower(monsterB, contestantB)

	if totalA > totalB then
		local hadBurn = monsterA.burnLeaderOnKill == true
		local resB = self:destroyBoardMonster(contestantB, slotB, true, false)
		local burnMsg = ""
		if resB.destroyed and hadBurn then
			contestantB.leader.hp = math.max(0, contestantB.leader.hp - 1)
			burnMsg = string.format(" และทำดาเมจใส่ Leader อีกฝ่าย 1 หน่วย (เหลือ %d HP)!", contestantB.leader.hp)
		end
		local msg = string.format('"%s" (%d) ชนะ "%s" (%d)!%s', monsterA.name, totalA, monsterB.name, totalB, burnMsg)
		if resB.destroyed then
			self:triggerCardEffects(monsterA, "ON_KILL_UNIT", {
				caster = contestantA,
				opponent = contestantB,
				sourceCard = monsterA,
				sourceSlot = slotA,
				isAI = contestantA.isAI,
			}, function()
				if onAfterCombat then
					onAfterCombat(msg)
				end
			end)
		elseif onAfterCombat then
			onAfterCombat(msg)
		end
	elseif totalA < totalB then
		local resA = self:destroyBoardMonster(contestantA, slotA, true, false)
		local msg = string.format('"%s" (%d) พลังสูงกว่า! สวนกลับทำลาย "%s" (%d)!', monsterB.name, totalB, monsterA.name, totalA)
		if resA.destroyed then
			self:triggerCardEffects(monsterB, "ON_KILL_UNIT", {
				caster = contestantB,
				opponent = contestantA,
				sourceCard = monsterB,
				sourceSlot = slotB,
				isAI = contestantB.isAI,
			}, function()
				if onAfterCombat then
					onAfterCombat(msg)
				end
			end)
		elseif onAfterCombat then
			onAfterCombat(msg)
		end
	else
		local hadBurn = monsterA.burnLeaderOnKill == true
		self:destroyBoardMonster(contestantA, slotA, true, false)
		local resB = self:destroyBoardMonster(contestantB, slotB, true, false)
		if resB.destroyed and hadBurn then
			contestantB.leader.hp = math.max(0, contestantB.leader.hp - 1)
		end
		local msg = string.format("พลังเท่ากัน (%d)! ทำลายกันทั้งสองฝ่าย!", totalA)
		if onAfterCombat then
			onAfterCombat(msg)
		end
	end
end

-- ==================== สมองกลบอท AI (รันบน Server อัตโนมัติ) ====================
function GameEngine:runAITurnRoutine()
	local ai = self.contestants.P2
	local player = self.contestants.P1
	if not ai.isAI or self.gameOver then
		return
	end

	task.wait(1.0)
	if self.gameOver then
		return
	end

	-- 1. อัญเชิญไฮบริดถ้าทำได้
	if self.aiDifficulty ~= "EASY" and self:findEmptySlot(ai) then
		for hIdx, c in ipairs(ai.hand) do
			if type(c.hybridMaterials) == "table" and self:canSummonHybridCard(ai, c) then
				local matA, matB = c.hybridMaterials[1], c.hybridMaterials[2]
				local listA = self:getHybridMaterialCandidates(ai, matA, { [c.uid] = true })
				for _, itemA in ipairs(listA) do
					local listB = self:getHybridMaterialCandidates(ai, matB, { [c.uid] = true, [itemA.card.uid] = true })
					if #listB > 0 then
						self:removeCardToDarkDimension(ai, itemA)
						self:removeCardToDarkDimension(ai, listB[1])
						local hybrid = table.remove(ai.hand, hIdx)
						resetCardStateForZoneChange(hybrid)
						hybrid.state = "Stand"
						local slot = self:findEmptySlot(ai) or 1
						ai.board[slot] = hybrid
						self:addLog(string.format('🦖 [AI ไฮบริด] อัญเชิญ "%s" ลงช่องที่ %d!', hybrid.name, slot))
						self:broadcast({ card = hybrid, actor = ai.name, sub = "🦖 AI อัญเชิญไฮบริด!" })
						task.wait(1.1)
						break
					end
				end
				break
			end
		end
	end

	-- 2. อัญเชิญยูนิตปกติลงช่องว่าง
	while not self.gameOver and not self.pendingPrompt do
		local emptySlot = self:findEmptySlot(ai)
		if not emptySlot then
			break
		end
		local summonIdx = nil
		for i, c in ipairs(ai.hand) do
			if c.type == "Monster" and not c.cannotNormalSummon and not c.isSpy and c.id ~= "M04" then
				summonIdx = i
				break
			end
		end
		if not summonIdx then
			break
		end
		local summoned = table.remove(ai.hand, summonIdx)
		resetCardStateForZoneChange(summoned)
		summoned.state = "Stand"
		ai.board[emptySlot] = summoned
		self:addLog(string.format('🤖 %s อัญเชิญ "%s" ลงช่องที่ %d!', ai.name, summoned.name, emptySlot))
		self:broadcast({ card = summoned, actor = ai.name, sub = string.format("อัญเชิญลงช่องที่ %d", emptySlot) })
		self:triggerCardEffects(summoned, "ON_SUMMON", {
			caster = ai,
			opponent = player,
			sourceCard = summoned,
			sourceSlot = emptySlot,
			isAI = true,
		})
		self:broadcast()
		task.wait(1.1)
	end

	-- 3. ใช้สกิล Leader ของ AI
	if self.aiDifficulty ~= "EASY" and not ai.leader.abilityUsedThisTurn then
		local leaderEffects = {}
		for _, e in ipairs(ai.leader.effects or {}) do
			if e.trigger == "ACTIVATE_LEADER" then
				table.insert(leaderEffects, e)
			end
		end
		if #leaderEffects > 0 then
			local ctx = { caster = ai, opponent = player, sourceCard = ai.leader, isAI = true }
			if self:canActivateEffect(leaderEffects[1], ctx) then
				self:activateSpecificEffect(leaderEffects[1], ctx)
				self:broadcast({ card = ai.leader, actor = ai.name, sub = "👑 AI ใช้สกิล Leader!" })
				task.wait(1.0)
			end
		end
	end

	-- 4. เข้าสู่ Battle Phase
	if self.gameOver then
		return
	end
	self.phase = "Battle Phase"
	self:addLog(string.format("⚔️ %s เข้าสู่ Battle Phase!", ai.name))
	self:broadcast()
	task.wait(0.9)

	for slotIdx = 1, 3 do
		if self.gameOver then
			return
		end
		-- รอจนกว่าผู้เล่นจะกดเลือก Intercept/Reaction เสร็จ
		while self.pendingPrompt and not self.gameOver do
			task.wait(0.25)
		end
		if self.gameOver then
			return
		end

		local m = ai.board[slotIdx]
		if m and m.id ~= "NM05" and self:canContestantAttack(ai, m) then
			local aiPwr = GameEngine.getEffectivePower(m, ai)
			local bestTargetSlot = nil
			local bestPwr = -1
			for pSlot = 1, 3 do
				local pm = player.board[pSlot]
				if pm and pm.id ~= "NM05" then
					local pPwr = GameEngine.getEffectivePower(pm, player)
					if aiPwr > pPwr and pPwr > bestPwr then
						bestPwr = pPwr
						bestTargetSlot = pSlot
					end
				end
			end

			local done = false
			if bestTargetSlot then
				self:declareAttack("P2", slotIdx, "monster", bestTargetSlot, function()
					done = true
				end)
			else
				self:declareAttack("P2", slotIdx, "leader", nil, function()
					done = true
				end)
			end

			local waitElapsed = 0
			while not done and not self.gameOver and waitElapsed < 30 do
				task.wait(0.25)
				waitElapsed += 0.25
			end
			task.wait(1.0)
		end
	end

	while self.pendingPrompt and not self.gameOver do
		task.wait(0.25)
	end
	if not self.gameOver and self.activeSide == "P2" then
		self:endTurn("P2")
	end
end

-- ==================== สร้าง Snapshot ส่งให้ Client วาด UI ====================
function GameEngine:serializeForSide(viewerSide: string, showcaseBanner)
	local mySide = viewerSide
	local oppSide = (viewerSide == "P1") and "P2" or "P1"
	local me = self.contestants[mySide]
	local opp = self.contestants[oppSide]

	local function serializeCard(c, owner)
		if not c then
			return nil
		end
		local hasMainSkill = false
		local mainSkillLabel = nil
		if type(c.effects) == "table" then
			for _, eff in ipairs(c.effects) do
				if eff.trigger == "ACTIVATE_MAIN" then
					hasMainSkill = true
					mainSkillLabel = eff.label or "⚡ ใช้สกิล"
					break
				end
			end
		end
		return {
			uid = c.uid,
			id = c.id,
			name = c.name,
			type = c.type,
			tribe = c.tribe,
			rarity = c.rarity,
			power = c.power or 0,
			effectivePower = GameEngine.getEffectivePower(c, owner),
			maxHp = c.maxHp,
			hp = c.hp,
			state = c.state or "Stand",
			image = c.image,
			desc = c.desc,
			cannotNormalSummon = c.cannotNormalSummon,
			hybridMaterials = c.hybridMaterials,
			futureBaseId = c.futureBaseId,
			isSpy = c.isSpy,
			canHybridSummon = (type(c.hybridMaterials) == "table") and self:canSummonHybridCard(owner, c) or false,
			hasMainSkill = hasMainSkill,
			mainSkillLabel = mainSkillLabel,
			burnLeaderOnKill = c.burnLeaderOnKill,
			indestructibleUntilNextTurn = c.indestructibleUntilNextTurn,
			immuneToEnemyEffectsUntilEndOfTurn = c.immuneToEnemyEffectsUntilEndOfTurn,
		}
	end

	local myHand = {}
	for _, c in ipairs(me.hand) do
		table.insert(myHand, serializeCard(c, me))
	end

	local myBoard = {}
	local oppBoard = {}
	for i = 1, 3 do
		myBoard[i] = serializeCard(me.board[i], me)
		oppBoard[i] = serializeCard(opp.board[i], opp)
	end

	local myGrave = {}
	for _, c in ipairs(me.graveyard) do
		table.insert(myGrave, serializeCard(c, me))
	end
	local oppGrave = {}
	for _, c in ipairs(opp.graveyard) do
		table.insert(oppGrave, serializeCard(c, opp))
	end

	local myDark = {}
	for _, c in ipairs(me.darkDimension) do
		table.insert(myDark, serializeCard(c, me))
	end
	local oppDark = {}
	for _, c in ipairs(opp.darkDimension) do
		table.insert(oppDark, serializeCard(c, opp))
	end

	return {
		matchId = self.matchId,
		mode = self.mode,
		viewerSide = viewerSide,
		turnCount = self.turnCount,
		isMyTurn = (self.activeSide == viewerSide),
		phase = self.phase,
		gameOver = self.gameOver,
		isWinner = (self.winnerSide == viewerSide),
		latestLog = self.latestLog or "",
		logs = self.logs,
		showcaseBanner = showcaseBanner,
		pendingPrompt = (self.pendingPrompt and self.pendingPrompt.side == viewerSide) and self.pendingPrompt or nil,
		waitingForOpponentPrompt = (self.pendingPrompt and self.pendingPrompt.side ~= viewerSide) or false,
		player = {
			name = me.name,
			mulliganDone = me.mulliganDone,
			leader = {
				id = me.leader.id,
				name = me.leader.name,
				hp = me.leader.hp,
				maxHp = me.leader.maxHp,
				image = me.leader.image,
				desc = me.leader.desc,
				abilityUsedThisTurn = me.leader.abilityUsedThisTurn,
				hasActiveSkill = (me.leader.effects ~= nil and #me.leader.effects > 0 and me.leader.effects[1].trigger == "ACTIVATE_LEADER"),
			},
			deckCount = #me.deck,
			handCount = #me.hand,
			hand = myHand,
			board = myBoard,
			graveyard = myGrave,
			darkDimension = myDark,
			spellQuota = me.spellQuota,
			unitsDestroyedThisTurn = me.unitsDestroyedThisTurn,
		},
		opponent = {
			name = opp.name,
			leader = {
				id = opp.leader.id,
				name = opp.leader.name,
				hp = opp.leader.hp,
				maxHp = opp.leader.maxHp,
				image = opp.leader.image,
				desc = opp.leader.desc,
			},
			deckCount = #opp.deck,
			handCount = #opp.hand,
			board = oppBoard,
			graveyard = oppGrave,
			darkDimension = oppDark,
		},
	}
end

return GameEngine
