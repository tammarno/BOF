--!nonstrict
--[[
	============================================================================
	BATTLE OF FRIENDS (แบทเทิล ออฟ เฟรน) — เซิร์ฟเวอร์หลัก (BOF_Server)
	วางไว้ที่: ServerScriptService > BOF_Server (Script)
	รองรับระบบ UI ครบวงจรสไตล์ BuddyTime + กฎการเล่น แบทเทิล ออฟ เฟรน 100%:
	  - ระบบโปรไฟล์ผู้เล่น, เหรียญทอง (Coins), โค้ดแจกของรางวัล (Code!), ระบบแรงก์ (Ranked)
	  - ระบบสล็อตจัดเด็ค (Deck Slots 1-8) + รหัสแชร์เด็ค 6 หลัก
	  - ระบบเปิดซองสุ่มการ์ด (Open Pack 1 ซอง / 10 ซอง), ตีบวกฟอยล์ (Glossy / Royal / Prism)
	  - ระบบเควส (รายวัน / Side Quest), ร้านค้า (Shop), ตกแต่งปลอกการ์ด/ฉายา (Style), ห้อง AFK
	  - ลานประลอง 3D บนพื้นแมพพร้อมเส้นขอบนีออนสีเหลืองและป้าย LIVE DUEL เหมือนในคลิป!
	============================================================================
]]

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Workspace = game:GetService("Workspace")

local BOF_Shared = ReplicatedStorage:WaitForChild("BOF_Shared")
local CardDatabase = require(BOF_Shared:WaitForChild("CardDatabase"))
local CardSchema = require(BOF_Shared:WaitForChild("CardSchema"))
local GameEngine = require(BOF_Shared:WaitForChild("GameEngine"))

CardSchema.validateAll()

local remotesFolder = ReplicatedStorage:FindFirstChild("BOF_Remotes")
if not remotesFolder then
	remotesFolder = Instance.new("Folder")
	remotesFolder.Name = "BOF_Remotes"
	remotesFolder.Parent = ReplicatedStorage
end

local function getOrCreateRemote(name: string): RemoteEvent
	local ev = remotesFolder:FindFirstChild(name)
	if not ev then
		ev = Instance.new("RemoteEvent")
		ev.Name = name
		ev.Parent = remotesFolder
	end
	return ev :: RemoteEvent
end

local DuelActionEvent = getOrCreateRemote("DuelAction")
local DuelStateEvent = getOrCreateRemote("DuelState")

-- ==================== สถานะเซิร์ฟเวอร์และโปรไฟล์ผู้เล่น ====================
local playerProfiles = {}
local activeMatches = {}
local pvpRooms = {} -- [roomCode 6 หลัก]
local duelCourts = {} -- สนามดวล 3D บนพื้นแมพ (ขอบสีเหลืองเหมือนในคลิป)
local sharedDeckCodes = {
	["BOF101"] = { name = "เด็คจิต (Starter)", leaderId = "L01", cards = CardDatabase.getDefaultDeck("L01") },
	["BOF202"] = { name = "เด็คขุนเหนือ (Starter)", leaderId = "L02", cards = CardDatabase.getDefaultDeck("L02") },
	["BOF303"] = { name = "เด็ควันสิ้นโลก (Starter)", leaderId = "L03", cards = CardDatabase.getDefaultDeck("L03") },
	["BOF404"] = { name = "เด็คไดโน (Starter)", leaderId = "L04", cards = CardDatabase.getDefaultDeck("L04") },
}

local PROMO_CODES = {
	["BOF2026"] = { coins = 5000, freePacks = 3, desc = "รับ 5,000 เหรียญ + ตั๋วสุ่มซองฟรี 3 ซอง!" },
	["FRIEND999"] = { coins = 10000, freePacks = 5, desc = "รับ 10,000 เหรียญ + ตั๋วสุ่มซองฟรี 5 ซอง!" },
	["DINO5000"] = { coins = 5000, freePacks = 2, desc = "รับ 5,000 เหรียญ + ตั๋วสุ่มซองฟรี 2 ซอง!" },
}

local QUEST_DEFS = {
	{ id = "q_play_1", tab = "DAILY", title = "ประเดิมสนามดวล 1 ครั้ง", desc = "เข้าเล่นโหมดฝึกซ้อมกับบอทหรือดวลกับผู้เล่น 1 ครั้ง", goal = 1, metric = "matchesPlayed", rewardCoins = 1500, rewardPacks = 2 },
	{ id = "q_win_1", tab = "DAILY", title = "คว้าชัยชนะแห่งเฟรน", desc = "ชนะการดวลในโหมดใดก็ได้ 1 ครั้ง", goal = 1, metric = "wins", rewardCoins = 2500, rewardPacks = 3 },
	{ id = "q_pack_3", tab = "DAILY", title = "นักเปิดซองมือทอง", desc = "เปิดซองสุ่มการ์ด Booster Pack ครบ 3 ซอง", goal = 3, metric = "packsOpened", rewardCoins = 2000, rewardPacks = 2 },
	{ id = "sq_win_5", tab = "SIDE", title = "นักสู้หน้าใหม่ไฟแรง", desc = "สะสมชัยชนะครบ 5 ครั้ง", goal = 5, metric = "wins", rewardCoins = 5000, rewardPacks = 5, rewardTitle = "นักสู้หน้าใหม่" },
	{ id = "sq_pack_10", tab = "SIDE", title = "นักสะสมระดับตำนาน", desc = "เปิดซองการ์ดสะสมครบ 10 ซอง", goal = 10, metric = "packsOpened", rewardCoins = 8000, rewardPacks = 5, rewardTitle = "นักสะสมการ์ด" },
}

local function generateCode6(): string
	local chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
	local res = ""
	for _ = 1, 6 do
		local idx = math.random(1, #chars)
		res = res .. string.sub(chars, idx, idx)
	end
	return res
end

local function copyArray(arr)
	local out = {}
	for i, v in ipairs(arr or {}) do
		out[i] = v
	end
	return out
end

local function getProfile(player: Player)
	if not playerProfiles[player] then
		local slots = {
			{ name = "เด็คจิต (Starter)", leaderId = "L01", mainDeck = copyArray(CardDatabase.getDefaultDeck("L01")), shareCode = "BOF101" },
			{ name = "เด็คขุนเหนือ", leaderId = "L02", mainDeck = copyArray(CardDatabase.getDefaultDeck("L02")), shareCode = "BOF202" },
			{ name = "เด็ควันสิ้นโลก", leaderId = "L03", mainDeck = copyArray(CardDatabase.getDefaultDeck("L03")), shareCode = "BOF303" },
			{ name = "เด็คไดโนไฮบริด", leaderId = "L04", mainDeck = copyArray(CardDatabase.getDefaultDeck("L04")), shareCode = "BOF404" },
		}
		playerProfiles[player] = {
			coins = 29990,
			freePacks = 5,
			rankStars = 56,
			rankTier = "Master",
			wins = 12,
			losses = 3,
			matchesPlayed = 15,
			packsOpened = 4,
			guildCheckedIn = false,
			duelRequestOpen = true,
			activeSlotIndex = 1,
			deckSlots = slots,
			leaderId = slots[1].leaderId,
			mainDeck = slots[1].mainDeck,
			foilMap = {
				["L01"] = "Prism",
				["L02"] = "Royal",
				["L03"] = "Royal",
				["L04"] = "Prism",
				["DN07"] = "Prism",
				["M04"] = "Royal",
			},
			showcaseCards = { "L01", "DN07", "DM09" },
			equippedStyle = {
				sleeve = "Classic Blue",
				arena = "Dark Slate",
				title = "Master Duelist",
				summonFx = "สายฟ้าฟาด",
			},
			ownedStyles = {
				["Classic Blue"] = true,
				["Dark Slate"] = true,
				["Master Duelist"] = true,
				["สายฟ้าฟาด"] = true,
			},
			claimedQuests = {},
			redeemedCodes = {},
			activeMatchId = nil,
			waitingRoomCode = nil,
			seatedCourtId = nil,
		}
	end
	return playerProfiles[player]
end

local function serializeProfileForClient(player: Player)
	local p = getProfile(player)
	local activeSlot = p.deckSlots[p.activeSlotIndex] or p.deckSlots[1]
	p.leaderId = activeSlot.leaderId
	p.mainDeck = activeSlot.mainDeck

	-- รายชื่อผู้เล่นในเซิร์ฟเวอร์สำหรับแท็บ "เพื่อน" และ "Ranked"
	local onlinePlayers = {}
	for _, other in ipairs(Players:GetPlayers()) do
		local op = getProfile(other)
		local oSlot = op.deckSlots[op.activeSlotIndex] or op.deckSlots[1]
		local lCard = CardDatabase.getCardById(oSlot.leaderId)
		table.insert(onlinePlayers, {
			userId = other.UserId,
			name = other.Name,
			displayName = other.DisplayName,
			rankTier = op.rankTier,
			rankStars = op.rankStars,
			wins = op.wins,
			losses = op.losses,
			leaderId = oSlot.leaderId,
			leaderName = lCard and lCard.name or oSlot.leaderId,
			inMatch = (op.activeMatchId ~= nil),
			duelRequestOpen = op.duelRequestOpen,
		})
	end

	return {
		coins = p.coins,
		freePacks = p.freePacks,
		rankStars = p.rankStars,
		rankTier = p.rankTier,
		wins = p.wins,
		losses = p.losses,
		matchesPlayed = p.matchesPlayed,
		packsOpened = p.packsOpened,
		guildCheckedIn = p.guildCheckedIn,
		duelRequestOpen = p.duelRequestOpen,
		activeSlotIndex = p.activeSlotIndex,
		deckSlots = p.deckSlots,
		leaderId = p.leaderId,
		mainDeck = p.mainDeck,
		foilMap = p.foilMap,
		showcaseCards = p.showcaseCards,
		equippedStyle = p.equippedStyle,
		ownedStyles = p.ownedStyles,
		claimedQuests = p.claimedQuests,
		quests = QUEST_DEFS,
		onlinePlayers = onlinePlayers,
	}
end

local function syncProfileToPlayer(player: Player)
	if player and player.Parent == Players then
		DuelStateEvent:FireClient(player, {
			packetType = "PROFILE_SYNC",
			profile = serializeProfileForClient(player),
		})
	end
end

local function sendNotification(player: Player, message: string, msgType: string?)
	if player and player.Parent == Players then
		DuelStateEvent:FireClient(player, {
			packetType = "NOTIFY",
			message = message,
			msgType = msgType or "INFO",
		})
	end
end

local function broadcastRoomList()
	local list = {}
	for code, room in pairs(pvpRooms) do
		if room.host and room.host.Parent == Players then
			local leaderCard = CardDatabase.getCardById(room.leaderId)
			table.insert(list, {
				roomCode = code,
				hostName = room.host.DisplayName .. " (@" .. room.host.Name .. ")",
				leaderId = room.leaderId,
				leaderName = leaderCard and leaderCard.name or room.leaderId,
			})
		else
			pvpRooms[code] = nil
		end
	end
	for _, plr in ipairs(Players:GetPlayers()) do
		DuelStateEvent:FireClient(plr, {
			packetType = "ROOM_LIST",
			rooms = list,
		})
	end
end

-- ==================== อัปเดตกระดาน 3D บนพื้นแมพ (เหมือนในคลิป 00:31-00:36!) ====================
local function updateCourt3DVisual(courtId: number)
	local court = duelCourts[courtId]
	if not court then
		return
	end

	local rec = court.matchId and activeMatches[court.matchId] or nil
	if rec and rec.engine then
		local eng = rec.engine
		local c1 = eng.contestants.P1
		local c2 = eng.contestants.P2
		court.topBannerTitle.Text = "🔴 LIVE DUEL"
		court.topBannerTitle.TextColor3 = Color3.fromRGB(248, 113, 113)
		court.topBannerNames.Text = string.format("%s  ✖  %s", c1.name, c2.name)

		court.p1HudText.Text = string.format("%s\nLIFE %d\nมือ %d • เด็ค %d • นรก %d", c1.name, c1.leader.hp, #c1.hand, #c1.deck, #c1.graveyard)
		court.p2HudText.Text = string.format("%s\nLIFE %d\nมือ %d • เด็ค %d • นรก %d", c2.name, c2.leader.hp, #c2.hand, #c2.deck, #c2.graveyard)

		-- อัปเดตชื่อการ์ดบนช่องสนาม 3D ทั้ง 2 ฝั่ง
		court.p1LeaderLbl.Text = string.format("👑 LEADER\n%s\n❤️ HP %d/%d", c1.leader.name, c1.leader.hp, c1.leader.maxHp)
		court.p2LeaderLbl.Text = string.format("👑 LEADER\n%s\n❤️ HP %d/%d", c2.leader.name, c2.leader.hp, c2.leader.maxHp)

		for s = 1, 3 do
			local m1 = c1.board[s]
			if m1 then
				court.p1SlotLabels[s].Text = string.format("%s\n⚔️ Pwr %d (%s)", m1.name, GameEngine.getEffectivePower(m1, c1), m1.state)
				court.p1SlotLabels[s].TextColor3 = Color3.fromRGB(254, 240, 138)
			else
				court.p1SlotLabels[s].Text = string.format("UNIT SLOT #%d\n(ว่าง)", s)
				court.p1SlotLabels[s].TextColor3 = Color3.fromRGB(148, 163, 184)
			end

			local m2 = c2.board[s]
			if m2 then
				court.p2SlotLabels[s].Text = string.format("%s\n⚔️ Pwr %d (%s)", m2.name, GameEngine.getEffectivePower(m2, c2), m2.state)
				court.p2SlotLabels[s].TextColor3 = Color3.fromRGB(254, 240, 138)
			else
				court.p2SlotLabels[s].Text = string.format("UNIT SLOT #%d\n(ว่าง)", s)
				court.p2SlotLabels[s].TextColor3 = Color3.fromRGB(148, 163, 184)
			end
		end
	else
		local p1Name = court.seat1 and court.seat1.DisplayName or "ว่าง (กด E)"
		local p2Name = court.seat2 and court.seat2.DisplayName or "ว่าง (กด E)"
		court.topBannerTitle.Text = string.format("⚔️ สนามดวล #%d", courtId)
		court.topBannerTitle.TextColor3 = Color3.fromRGB(250, 204, 21)
		court.topBannerNames.Text = string.format("%s  VS  %s", p1Name, p2Name)
		court.p1HudText.Text = "ฝั่ง P1: " .. p1Name .. "\nเดินมาเหยียบจุดยืนแล้วกด E"
		court.p2HudText.Text = "ฝั่ง P2: " .. p2Name .. "\nเดินมาเหยียบจุดยืนแล้วกด E"
	end
end

-- ==================== การสร้างและซิงค์ Match ====================
local function syncMatchToPlayers(matchRecord, showcaseBanner)
	local engine = matchRecord.engine
	if matchRecord.courtId then
		updateCourt3DVisual(matchRecord.courtId)
	end

	-- ถ้าเกมจบ แจกเหรียญและอัปเดตสถิติชนะ/แพ้!
	if engine.gameOver and not matchRecord.rewardsGranted then
		matchRecord.rewardsGranted = true
		if matchRecord.p1 and playerProfiles[matchRecord.p1] then
			local prof1 = getProfile(matchRecord.p1)
			prof1.matchesPlayed += 1
			if engine.winnerSide == "P1" then
				prof1.wins += 1
				prof1.coins += 600
				prof1.rankStars += 1
				sendNotification(matchRecord.p1, "🏆 ชนะการดวล! ได้รับ +600 เหรียญ และ +1 ดาวแรงก์!", "SUCCESS")
			else
				prof1.losses += 1
				prof1.coins += 200
			end
			syncProfileToPlayer(matchRecord.p1)
		end
		if matchRecord.p2 and playerProfiles[matchRecord.p2] then
			local prof2 = getProfile(matchRecord.p2)
			prof2.matchesPlayed += 1
			if engine.winnerSide == "P2" then
				prof2.wins += 1
				prof2.coins += 600
				prof2.rankStars += 1
				sendNotification(matchRecord.p2, "🏆 ชนะการดวล! ได้รับ +600 เหรียญ และ +1 ดาวแรงก์!", "SUCCESS")
			else
				prof2.losses += 1
				prof2.coins += 200
			end
			syncProfileToPlayer(matchRecord.p2)
		end
	end

	if matchRecord.p1 and matchRecord.p1.Parent == Players then
		local stateP1 = engine:serializeForSide("P1", showcaseBanner)
		DuelStateEvent:FireClient(matchRecord.p1, {
			packetType = "MATCH_STATE",
			state = stateP1,
		})
	end
	if matchRecord.p2 and matchRecord.p2.Parent == Players then
		local stateP2 = engine:serializeForSide("P2", showcaseBanner)
		DuelStateEvent:FireClient(matchRecord.p2, {
			packetType = "MATCH_STATE",
			state = stateP2,
		})
	end
end

local function cleanupMatch(matchId: string)
	local rec = activeMatches[matchId]
	if not rec then
		return
	end
	activeMatches[matchId] = nil

	if rec.p1 and playerProfiles[rec.p1] and playerProfiles[rec.p1].activeMatchId == matchId then
		playerProfiles[rec.p1].activeMatchId = nil
	end
	if rec.p2 and playerProfiles[rec.p2] and playerProfiles[rec.p2].activeMatchId == matchId then
		playerProfiles[rec.p2].activeMatchId = nil
	end
	if rec.courtId and duelCourts[rec.courtId] then
		local c = duelCourts[rec.courtId]
		c.matchId = nil
		c.seat1 = nil
		c.seat2 = nil
		updateCourt3DVisual(rec.courtId)
	end
end

local function findFreeCourtId(): number?
	for id, c in pairs(duelCourts) do
		if not c.matchId and not c.seat1 and not c.seat2 then
			return id
		end
	end
	return nil
end

local function startBotMatch(player: Player, aiDifficulty: string?, aiLeaderId: string?)
	local profile = getProfile(player)
	if profile.activeMatchId then
		cleanupMatch(profile.activeMatchId)
	end

	local activeSlot = profile.deckSlots[profile.activeSlotIndex] or profile.deckSlots[1]
	local matchId = string.format("bot_%d_%d", player.UserId, math.random(1000, 9999))
	local diff = aiDifficulty or "HARD"
	local botNames = {
		EASY = "🤖 บอทฝึกหัด (ง่าย)",
		MEDIUM = "🤖 บอทนักสู้ (ปกติ)",
		HARD = "🤖 บอทปรมาจารย์ (ยาก)",
	}

	local freeCourt = findFreeCourtId()
	local matchRecord = {
		matchId = matchId,
		p1 = player,
		p2 = nil,
		courtId = freeCourt,
		rewardsGranted = false,
		engine = nil,
	}

	local engine = GameEngine.newMatch({
		matchId = matchId,
		mode = "BOT",
		aiDifficulty = diff,
		p1Name = player.DisplayName,
		p1LeaderId = activeSlot.leaderId,
		p1DeckList = activeSlot.mainDeck,
		p2Name = botNames[diff] or "🤖 AI Bot",
		p2LeaderId = aiLeaderId or "RANDOM",
		onStateChanged = function(_, _, showcaseBanner)
			syncMatchToPlayers(matchRecord, showcaseBanner)
		end,
	})

	matchRecord.engine = engine
	activeMatches[matchId] = matchRecord
	profile.activeMatchId = matchId

	if freeCourt and duelCourts[freeCourt] then
		duelCourts[freeCourt].matchId = matchId
		updateCourt3DVisual(freeCourt)
	end

	syncMatchToPlayers(matchRecord, nil)
end

local function startPvpMatch(player1: Player, player2: Player, courtId: number?)
	local prof1 = getProfile(player1)
	local prof2 = getProfile(player2)

	if prof1.activeMatchId then
		cleanupMatch(prof1.activeMatchId)
	end
	if prof2.activeMatchId then
		cleanupMatch(prof2.activeMatchId)
	end

	local p1, p2 = player1, player2
	if math.random(1, 2) == 2 then
		p1, p2 = player2, player1
		prof1, prof2 = prof2, prof1
	end

	local slot1 = prof1.deckSlots[prof1.activeSlotIndex] or prof1.deckSlots[1]
	local slot2 = prof2.deckSlots[prof2.activeSlotIndex] or prof2.deckSlots[1]

	local assignedCourt = courtId or findFreeCourtId()
	local matchId = string.format("pvp_%d_%d_%d", p1.UserId, p2.UserId, math.random(1000, 9999))
	local matchRecord = {
		matchId = matchId,
		p1 = p1,
		p2 = p2,
		courtId = assignedCourt,
		rewardsGranted = false,
		engine = nil,
	}

	local engine = GameEngine.newMatch({
		matchId = matchId,
		mode = "PVP",
		p1Name = p1.DisplayName,
		p1LeaderId = slot1.leaderId,
		p1DeckList = slot1.mainDeck,
		p2Name = p2.DisplayName,
		p2LeaderId = slot2.leaderId,
		p2DeckList = slot2.mainDeck,
		onStateChanged = function(_, _, showcaseBanner)
			syncMatchToPlayers(matchRecord, showcaseBanner)
		end,
	})

	matchRecord.engine = engine
	activeMatches[matchId] = matchRecord
	prof1.activeMatchId = matchId
	prof2.activeMatchId = matchId

	if assignedCourt and duelCourts[assignedCourt] then
		duelCourts[assignedCourt].matchId = matchId
		updateCourt3DVisual(assignedCourt)
	end

	syncMatchToPlayers(matchRecord, nil)
end

-- ==================== สร้างสนามดวล 3D บนพื้นแมพ (สไตล์ BuddyTime 00:31-00:36!) ====================
local function buildArenaInWorkspace()
	local oldArena = Workspace:FindFirstChild("BattleOfFriends_Arena")
	if oldArena then
		oldArena:Destroy()
	end

	local arena = Instance.new("Folder")
	arena.Name = "BattleOfFriends_Arena"
	arena.Parent = Workspace

	-- สร้างสนามดวล 3D บนพื้น (Playmat Courts) จำนวน 3 สนามเรียงกันเหมือนในคลิป
	for courtIdx = 1, 3 do
		local centerX = (courtIdx - 2) * 44
		local centerZ = -36
		local courtCenter = Vector3.new(centerX, 0.2, centerZ)

		local courtModel = Instance.new("Model")
		courtModel.Name = "DuelCourt_" .. tostring(courtIdx)
		courtModel.Parent = arena

		-- แผ่น Playmat สีดำเทาเข้มบนพื้น
		local matPart = Instance.new("Part")
		matPart.Name = "PlaymatFloor"
		matPart.Size = Vector3.new(28, 0.3, 32)
		matPart.Position = courtCenter
		matPart.Anchored = true
		matPart.Material = Enum.Material.SmoothPlastic
		matPart.Color = Color3.fromRGB(20, 24, 33)
		matPart.Parent = courtModel

		-- เส้นรั้วนีออนสีเหลืองล้อมรอบกรอบนอก (เหมือนในคลิป 00:32!)
		local fenceW, fenceL, fenceY = 34, 38, 2.2
		local rails = {
			{ sz = Vector3.new(fenceW, 0.22, 0.22), pos = Vector3.new(centerX, fenceY, centerZ - fenceL / 2) },
			{ sz = Vector3.new(fenceW, 0.22, 0.22), pos = Vector3.new(centerX, fenceY, centerZ + fenceL / 2) },
			{ sz = Vector3.new(0.22, 0.22, fenceL), pos = Vector3.new(centerX - fenceW / 2, fenceY, centerZ) },
			{ sz = Vector3.new(0.22, 0.22, fenceL), pos = Vector3.new(centerX + fenceW / 2, fenceY, centerZ) },
		}
		for _, r in ipairs(rails) do
			local bar = Instance.new("Part")
			bar.Size = r.sz
			bar.Position = r.pos
			bar.Anchored = true
			bar.CanCollide = false
			bar.Material = Enum.Material.Neon
			bar.Color = Color3.fromRGB(250, 204, 21)
			bar.Parent = courtModel
		end

		-- เสามุมทั้ง 4 มุม
		local corners = {
			Vector3.new(centerX - fenceW / 2, fenceY / 2, centerZ - fenceL / 2),
			Vector3.new(centerX + fenceW / 2, fenceY / 2, centerZ - fenceL / 2),
			Vector3.new(centerX - fenceW / 2, fenceY / 2, centerZ + fenceL / 2),
			Vector3.new(centerX + fenceW / 2, fenceY / 2, centerZ + fenceL / 2),
		}
		for _, cPos in ipairs(corners) do
			local post = Instance.new("Part")
			post.Size = Vector3.new(0.35, fenceY, 0.35)
			post.Position = cPos
			post.Anchored = true
			post.Material = Enum.Material.Metal
			post.Color = Color3.fromRGB(15, 23, 42)
			post.Parent = courtModel
		end

		-- SurfaceGui วาดโซนการ์ดลงบนพื้น Playmat จริง!
		local surfaceGui = Instance.new("SurfaceGui")
		surfaceGui.Face = Enum.NormalId.Top
		surfaceGui.CanvasSize = Vector2.new(840, 960)
		surfaceGui.Parent = matPart

		local centerLine = Instance.new("Frame")
		centerLine.Size = UDim2.new(1, -40, 0, 4)
		centerLine.Position = UDim2.new(0, 20, 0.5, -2)
		centerLine.BackgroundColor3 = Color3.fromRGB(56, 189, 248)
		centerLine.BorderSizePixel = 0
		centerLine.Parent = surfaceGui

		local function createSurfaceZoneBox(xScale, yScale, wScale, hScale, titleText, borderColor)
			local box = Instance.new("Frame")
			box.Size = UDim2.fromScale(wScale, hScale)
			box.Position = UDim2.fromScale(xScale, yScale)
			box.BackgroundColor3 = Color3.fromRGB(15, 23, 42)
			box.BackgroundTransparency = 0.2
			box.BorderSizePixel = 0
			box.Parent = surfaceGui

			local st = Instance.new("UIStroke")
			st.Color = borderColor
			st.Thickness = 3
			st.Parent = box

			local lbl = Instance.new("TextLabel")
			lbl.Size = UDim2.fromScale(0.92, 0.9)
			lbl.Position = UDim2.fromScale(0.04, 0.05)
			lbl.BackgroundTransparency = 1
			lbl.Font = Enum.Font.GothamBold
			lbl.TextScaled = true
			lbl.TextColor3 = Color3.fromRGB(226, 232, 240)
			lbl.Text = titleText
			lbl.Parent = box
			return lbl
		end

		-- โซนฝั่ง P1 (ครึ่งล่าง) และ P2 (ครึ่งบน)
		local p1SlotLabels = {}
		local p2SlotLabels = {}
		for s = 1, 3 do
			local xS = 0.22 + (s - 1) * 0.20
			p2SlotLabels[s] = createSurfaceZoneBox(xS, 0.24, 0.17, 0.20, "P2 UNIT #" .. s, Color3.fromRGB(239, 68, 68))
			p1SlotLabels[s] = createSurfaceZoneBox(xS, 0.56, 0.17, 0.20, "P1 UNIT #" .. s, Color3.fromRGB(59, 130, 246))
		end

		local p2LeaderLbl = createSurfaceZoneBox(0.03, 0.24, 0.16, 0.20, "👑 P2 LEADER", Color3.fromRGB(245, 158, 11))
		local p1LeaderLbl = createSurfaceZoneBox(0.03, 0.56, 0.16, 0.20, "👑 P1 LEADER", Color3.fromRGB(245, 158, 11))

		createSurfaceZoneBox(0.83, 0.24, 0.14, 0.09, "📚 DECK", Color3.fromRGB(148, 163, 184))
		createSurfaceZoneBox(0.83, 0.35, 0.14, 0.09, "🔥 DROP (นรก)", Color3.fromRGB(168, 85, 247))
		createSurfaceZoneBox(0.83, 0.56, 0.14, 0.09, "📚 DECK", Color3.fromRGB(148, 163, 184))
		createSurfaceZoneBox(0.83, 0.67, 0.14, 0.09, "🔥 DROP (นรก)", Color3.fromRGB(168, 85, 247))

		-- ป้ายลอย LIVE DUEL เหนือสนาม (เหมือนในคลิป 00:32!)
		local topBannerPart = Instance.new("Part")
		topBannerPart.Size = Vector3.new(1, 1, 1)
		topBannerPart.Position = courtCenter + Vector3.new(0, 9.5, 0)
		topBannerPart.Anchored = true
		topBannerPart.Transparency = 1
		topBannerPart.CanCollide = false
		topBannerPart.Parent = courtModel

		local topBb = Instance.new("BillboardGui")
		topBb.Size = UDim2.fromOffset(320, 72)
		topBb.AlwaysOnTop = true
		topBb.MaxDistance = 140
		topBb.Parent = topBannerPart

		local topBg = Instance.new("Frame")
		topBg.Size = UDim2.fromScale(1, 1)
		topBg.BackgroundColor3 = Color3.fromRGB(15, 23, 42)
		topBg.BackgroundTransparency = 0.12
		topBg.Parent = topBb
		local topCorner = Instance.new("UICorner")
		topCorner.CornerRadius = UDim.new(0, 10)
		topCorner.Parent = topBg
		local topStroke = Instance.new("UIStroke")
		topStroke.Color = Color3.fromRGB(250, 204, 21)
		topStroke.Thickness = 2
		topStroke.Parent = topBg

		local topTitle = Instance.new("TextLabel")
		topTitle.Size = UDim2.new(1, 0, 0.42, 0)
		topTitle.BackgroundTransparency = 1
		topTitle.Font = Enum.Font.GothamBlack
		topTitle.TextSize = 14
		topTitle.TextColor3 = Color3.fromRGB(248, 113, 113)
		topTitle.Text = "⚔️ สนามดวล #" .. tostring(courtIdx)
		topTitle.Parent = topBg

		local topNames = Instance.new("TextLabel")
		topNames.Size = UDim2.new(1, -12, 0.55, 0)
		topNames.Position = UDim2.fromScale(0, 0.42)
		topNames.BackgroundTransparency = 1
		topNames.Font = Enum.Font.GothamBlack
		topNames.TextSize = 16
		topNames.TextColor3 = Color3.fromRGB(255, 255, 255)
		topNames.Text = "ว่าง  VS  ว่าง"
		topNames.Parent = topBg

		-- ป้าย LIFE / มือ / เด็ค ข้างผู้เล่นทั้ง 2 ฝั่ง
		local p1HudText, p2HudText
		for sideIdx = 1, 2 do
			local zOffset = (sideIdx == 1) and 13.5 or -13.5
			local standPad = Instance.new("Part")
			standPad.Name = "DuelStandPad_" .. tostring(sideIdx)
			standPad.Size = Vector3.new(5, 0.4, 5)
			standPad.Position = courtCenter + Vector3.new(0, 0.25, zOffset)
			standPad.Anchored = true
			standPad.Material = Enum.Material.Neon
			standPad.Color = (sideIdx == 1) and Color3.fromRGB(56, 189, 248) or Color3.fromRGB(248, 113, 113)
			standPad.Parent = courtModel

			local sideBb = Instance.new("BillboardGui")
			sideBb.Size = UDim2.fromOffset(180, 68)
			sideBb.StudsOffset = Vector3.new(8, 2.5, 0)
			sideBb.AlwaysOnTop = true
			sideBb.MaxDistance = 90
			sideBb.Parent = standPad

			local sideFrame = Instance.new("Frame")
			sideFrame.Size = UDim2.fromScale(1, 1)
			sideFrame.BackgroundColor3 = Color3.fromRGB(15, 23, 42)
			sideFrame.BackgroundTransparency = 0.15
			sideFrame.Parent = sideBb
			local sc = Instance.new("UICorner")
			sc.CornerRadius = UDim.new(0, 8)
			sc.Parent = sideFrame
			local ss = Instance.new("UIStroke")
			ss.Color = (sideIdx == 1) and Color3.fromRGB(74, 222, 128) or Color3.fromRGB(248, 113, 113)
			ss.Thickness = 1.5
			ss.Parent = sideFrame

			local sideLbl = Instance.new("TextLabel")
			sideLbl.Size = UDim2.new(1, -12, 1, -8)
			sideLbl.Position = UDim2.fromOffset(6, 4)
			sideLbl.BackgroundTransparency = 1
			sideLbl.Font = Enum.Font.GothamBold
			sideLbl.TextSize = 12
			sideLbl.TextColor3 = Color3.fromRGB(255, 255, 255)
			sideLbl.Text = "LIFE 6"
			sideLbl.Parent = sideFrame

			if sideIdx == 1 then
				p1HudText = sideLbl
			else
				p2HudText = sideLbl
			end

			local prompt = Instance.new("ProximityPrompt")
			prompt.ObjectText = string.format("สนามดวล แบทเทิล ออฟ เฟรน #%d", courtIdx)
			prompt.ActionText = string.format("เข้าประจำที่ฝั่ง P%d (หรือดวลบอท)", sideIdx)
			prompt.HoldDuration = 0
			prompt.MaxActivationDistance = 11
			prompt.Parent = standPad

			prompt.Triggered:Connect(function(plr: Player)
				local court = duelCourts[courtIdx]
				if not court or court.matchId then
					sendNotification(plr, "สนามนี้กำลังทำการดวลอยู่!", "WARN")
					return
				end
				local prof = getProfile(plr)
				if prof.activeMatchId then
					sendNotification(plr, "คุณกำลังอยู่ในแมตช์ดวลอยู่แล้ว!", "WARN")
					return
				end

				if sideIdx == 1 then
					if court.seat1 == plr then
						court.seat1 = nil
						updateCourt3DVisual(courtIdx)
						sendNotification(plr, "ออกจากจุดยืนฝั่ง P1 แล้ว", "INFO")
						return
					end
					court.seat1 = plr
				else
					if court.seat2 == plr then
						court.seat2 = nil
						updateCourt3DVisual(courtIdx)
						sendNotification(plr, "ออกจากจุดยืนฝั่ง P2 แล้ว", "INFO")
						return
					end
					court.seat2 = plr
				end

				updateCourt3DVisual(courtIdx)
				sendNotification(plr, string.format("เข้าประจำสนามดวล #%d (ฝั่ง P%d) รอผู้เล่นอีกฝั่ง!", courtIdx, sideIdx), "SUCCESS")

				if court.seat1 and court.seat2 and court.seat1.Parent == Players and court.seat2.Parent == Players then
					startPvpMatch(court.seat1, court.seat2, courtIdx)
				end
			end)
		end

		duelCourts[courtIdx] = {
			id = courtIdx,
			seat1 = nil,
			seat2 = nil,
			matchId = nil,
			topBannerTitle = topTitle,
			topBannerNames = topNames,
			p1HudText = p1HudText,
			p2HudText = p2HudText,
			p1LeaderLbl = p1LeaderLbl,
			p2LeaderLbl = p2LeaderLbl,
			p1SlotLabels = p1SlotLabels,
			p2SlotLabels = p2SlotLabels,
		}
		updateCourt3DVisual(courtIdx)
	end
end

buildArenaInWorkspace()

-- ==================== จัดการคำสั่งจาก Client (DuelActionEvent) ====================
DuelActionEvent.OnServerEvent:Connect(function(player: Player, payload)
	if type(payload) ~= "table" or type(payload.action) ~= "string" then
		return
	end

	local profile = getProfile(player)
	local action = payload.action

	if action == "REQUEST_PROFILE" then
		syncProfileToPlayer(player)
		broadcastRoomList()
		return
	end

	-- 1. เลือกสล็อตเด็คหลัก
	if action == "SELECT_DECK_SLOT" then
		local slotIdx = tonumber(payload.slotIndex) or 1
		if profile.deckSlots[slotIdx] then
			profile.activeSlotIndex = slotIdx
			profile.leaderId = profile.deckSlots[slotIdx].leaderId
			profile.mainDeck = profile.deckSlots[slotIdx].mainDeck
			syncProfileToPlayer(player)
			sendNotification(player, "เลือกใช้งานเด็ค: " .. profile.deckSlots[slotIdx].name, "SUCCESS")
		end
		return
	end

	-- 2. สร้างสล็อตเด็คใหม่
	if action == "CREATE_DECK_SLOT" then
		if #profile.deckSlots >= 8 then
			sendNotification(player, "สร้างสล็อตเด็คได้สูงสุด 8 สล็อต!", "WARN")
			return
		end
		local lid = tostring(payload.leaderId or "L01")
		local code = generateCode6()
		local newSlot = {
			name = tostring(payload.deckName or ("เด็คใหม่ #" .. tostring(#profile.deckSlots + 1))),
			leaderId = lid,
			mainDeck = copyArray(CardDatabase.getDefaultDeck(lid)),
			shareCode = code,
		}
		table.insert(profile.deckSlots, newSlot)
		sharedDeckCodes[code] = { name = newSlot.name, leaderId = newSlot.leaderId, cards = copyArray(newSlot.mainDeck) }
		profile.activeSlotIndex = #profile.deckSlots
		syncProfileToPlayer(player)
		sendNotification(player, "สร้างสล็อตเด็คใหม่สำเร็จ! (รหัสแชร์: " .. code .. ")", "SUCCESS")
		return
	end

	-- 3. บันทึกเด็คในสล็อตปัจจุบัน
	if action == "SAVE_DECK" then
		local slotIdx = tonumber(payload.slotIndex) or profile.activeSlotIndex or 1
		local slot = profile.deckSlots[slotIdx] or profile.deckSlots[1]
		local leaderId = tostring(payload.leaderId or slot.leaderId or "L01")
		local validSetup = GameEngine.createValidDeck(leaderId, payload.mainDeck, "CHECK")
		local cleanIds = {}
		for _, c in ipairs(validSetup.deck) do
			table.insert(cleanIds, c.id)
		end

		slot.leaderId = leaderId
		slot.mainDeck = cleanIds
		if payload.deckName and tostring(payload.deckName) ~= "" then
			slot.name = tostring(payload.deckName)
		end
		if not slot.shareCode then
			slot.shareCode = generateCode6()
		end
		sharedDeckCodes[slot.shareCode] = { name = slot.name, leaderId = slot.leaderId, cards = copyArray(slot.mainDeck) }

		profile.leaderId = leaderId
		profile.mainDeck = cleanIds
		syncProfileToPlayer(player)
		sendNotification(player, string.format("บันทึกเด็ค '%s' สำเร็จ! (รหัสเด็ค: %s)", slot.name, slot.shareCode), "SUCCESS")
		return
	end

	-- 4. นำเข้าเด็คด้วยโค้ด 6 หลัก (Import Deck Code)
	if action == "IMPORT_DECK_CODE" then
		local code = string.upper(string.gsub(tostring(payload.deckCode or ""), "%s+", ""))
		local found = sharedDeckCodes[code]
		if not found then
			sendNotification(player, "ไม่พบรหัสเด็ค '" .. code .. "' (ลองใช้ BOF101, BOF202, BOF303, BOF404)", "WARN")
			return
		end
		local slot = profile.deckSlots[profile.activeSlotIndex] or profile.deckSlots[1]
		slot.name = found.name .. " (นำเข้า)"
		slot.leaderId = found.leaderId
		slot.mainDeck = copyArray(found.cards)
		syncProfileToPlayer(player)
		sendNotification(player, "นำเข้าเด็คจากโค้ด " .. code .. " สำเร็จ!", "SUCCESS")
		return
	end

	-- 5. เปิดซองสุ่มการ์ด Booster Pack (1 ซอง หรือ 10 ซอง)
	if action == "OPEN_PACK" then
		local count = (tonumber(payload.count) == 10) and 10 or 1
		local packLeader = tostring(payload.packLeader or "L01")
		local cost = (count == 10) and 1800 or 200

		if count == 1 and profile.freePacks > 0 then
			profile.freePacks -= 1
		else
			if profile.coins < cost then
				sendNotification(player, "เหรียญไม่พอสำหรับเปิดซอง! (ต้องการ " .. tostring(cost) .. " เหรียญ)", "WARN")
				return
			end
			profile.coins -= cost
		end

		profile.packsOpened += count
		local pool = CardDatabase.getDefaultDeck(packLeader)
		local pulledCards = {}
		local numCardsToPull = count * 5
		for _ = 1, numCardsToPull do
			local cid = pool[math.random(1, #pool)]
			local roll = math.random(1, 100)
			local foil = "Normal"
			if roll >= 96 then
				foil = "Prism"
				profile.foilMap[cid] = "Prism"
			elseif roll >= 85 then
				foil = "Royal"
				if profile.foilMap[cid] ~= "Prism" then
					profile.foilMap[cid] = "Royal"
				end
			elseif roll >= 65 then
				foil = "Glossy"
				if not profile.foilMap[cid] then
					profile.foilMap[cid] = "Glossy"
				end
			end
			table.insert(pulledCards, { id = cid, foil = foil })
		end

		syncProfileToPlayer(player)
		DuelStateEvent:FireClient(player, {
			packetType = "PACK_OPENED",
			cards = pulledCards,
			packCount = count,
		})
		return
	end

	-- 6. ตีบวกฟอยล์การ์ดใน Collection
	if action == "UPGRADE_FOIL" then
		local cid = tostring(payload.cardId or "M01")
		local cur = profile.foilMap[cid] or "Normal"
		local nextFoil = (cur == "Normal" and "Glossy") or (cur == "Glossy" and "Royal") or "Prism"
		if cur == "Prism" then
			sendNotification(player, "การ์ดใบนี้เป็นระดับสูงสุด 💎 Prism แล้ว!", "INFO")
			return
		end
		if profile.coins < 500 then
			sendNotification(player, "ต้องใช้ 500 เหรียญในการตีบวกฟอยล์!", "WARN")
			return
		end
		profile.coins -= 500
		profile.foilMap[cid] = nextFoil
		syncProfileToPlayer(player)
		sendNotification(player, string.format("✨ ตีบวกการ์ด [%s] เป็นระดับ %s สำเร็จ!", cid, nextFoil), "SUCCESS")
		return
	end

	-- 7. รับรางวัลเควส (Claim Quest)
	if action == "CLAIM_QUEST" then
		local qid = tostring(payload.questId or "")
		if profile.claimedQuests[qid] then
			sendNotification(player, "คุณรับรางวัลเควสนี้ไปแล้ว!", "INFO")
			return
		end
		for _, q in ipairs(QUEST_DEFS) do
			if q.id == qid then
				local prog = profile[q.metric] or 0
				if prog < q.goal then
					sendNotification(player, string.format("ยังไม่บรรลุเงื่อนไข (%d / %d)", prog, q.goal), "WARN")
					return
				end
				profile.claimedQuests[qid] = true
				profile.coins += (q.rewardCoins or 0)
				profile.freePacks += (q.rewardPacks or 0)
				if q.rewardTitle then
					profile.ownedStyles[q.rewardTitle] = true
				end
				syncProfileToPlayer(player)
				sendNotification(player, string.format("🎉 รับรางวัลเควสสำเร็จ! (+%d เหรียญ, +%d ตั๋วเปิดซอง)", q.rewardCoins or 0, q.rewardPacks or 0), "SUCCESS")
				return
			end
		end
		return
	end

	-- 8. กรอกโค้ดรับของรางวัล (Code!)
	if action == "REDEEM_CODE" then
		local code = string.upper(string.gsub(tostring(payload.code or ""), "%s+", ""))
		if profile.redeemedCodes[code] then
			sendNotification(player, "คุณเคยใช้โค้ดนี้ไปแล้ว!", "WARN")
			return
		end
		local reward = PROMO_CODES[code]
		if not reward then
			sendNotification(player, "ไม่พบโค้ดนี้! (โค้ดที่ใช้ได้: BOF2026, FRIEND999, DINO5000)", "WARN")
			return
		end
		profile.redeemedCodes[code] = true
		profile.coins += reward.coins
		profile.freePacks += reward.freePacks
		syncProfileToPlayer(player)
		sendNotification(player, "🎁 ใช้โค้ดสำเร็จ! " .. reward.desc, "SUCCESS")
		return
	end

	-- 9. ซื้อ/สวมใส่ของตกแต่งในแท็บ Style & Shop
	if action == "BUY_OR_EQUIP_STYLE" then
		local category = tostring(payload.category or "sleeve")
		local itemName = tostring(payload.itemName or "")
		local price = tonumber(payload.price) or 600
		if not profile.ownedStyles[itemName] then
			if profile.coins < price then
				sendNotification(player, "เหรียญไม่พอสำหรับซื้อ " .. itemName, "WARN")
				return
			end
			profile.coins -= price
			profile.ownedStyles[itemName] = true
		end
		profile.equippedStyle[category] = itemName
		syncProfileToPlayer(player)
		sendNotification(player, "✨ เลือกใช้งาน '" .. itemName .. "' เรียบร้อยแล้ว!", "SUCCESS")
		return
	end

	-- 10. เช็คอินกิลด์ & ห้อง AFK & ตู้โชว์โปรไฟล์
	if action == "GUILD_CHECKIN" then
		if profile.guildCheckedIn then
			sendNotification(player, "วันนี้คุณเช็คอินกิลด์รับรางวัลไปแล้ว!", "INFO")
			return
		end
		profile.guildCheckedIn = true
		profile.coins += 1500
		syncProfileToPlayer(player)
		sendNotification(player, "🛡️ เช็คอินกิลด์สำเร็จ! ได้รับ +1,500 เหรียญ!", "SUCCESS")
		return
	elseif action == "AFK_REWARD_TICK" then
		profile.coins += 45
		syncProfileToPlayer(player)
		return
	elseif action == "TOGGLE_DUEL_REQUEST" then
		profile.duelRequestOpen = not profile.duelRequestOpen
		syncProfileToPlayer(player)
		return
	elseif action == "SET_SHOWCASE_CARD" then
		local slotIdx = tonumber(payload.slotIndex) or 1
		local cardId = tostring(payload.cardId or "L01")
		if slotIdx >= 1 and slotIdx <= 3 then
			profile.showcaseCards[slotIdx] = cardId
			syncProfileToPlayer(player)
			sendNotification(player, "อัปเดตตู้โชว์การ์ดในโปรไฟล์แล้ว!", "SUCCESS")
		end
		return
	end

	-- 11. เริ่มโหมดดวลกับบอท AI หรือจับคู่หาคู่ต่อสู้
	if action == "START_BOT_MATCH" then
		local difficulty = tostring(payload.difficulty or "HARD")
		local aiLeaderId = payload.aiLeaderId and tostring(payload.aiLeaderId) or "RANDOM"
		startBotMatch(player, difficulty, aiLeaderId)
		return
	elseif action == "QUICK_MATCH" then
		-- ถ้ามีห้องที่เปิดรออยู่ ให้จับคู่เข้าดวล PvP ทันที ถ้าไม่มีให้ดวลกับบอทระดับ Master
		for code, room in pairs(pvpRooms) do
			if room.host and room.host ~= player and room.host.Parent == Players then
				local hostPlayer = room.host
				pvpRooms[code] = nil
				if playerProfiles[hostPlayer] then
					playerProfiles[hostPlayer].waitingRoomCode = nil
				end
				broadcastRoomList()
				startPvpMatch(hostPlayer, player, nil)
				return
			end
		end
		startBotMatch(player, "HARD", "RANDOM")
		return
	end

	-- 12. ระบบห้อง PvP 6 หลัก
	if action == "CREATE_PVP_ROOM" then
		if profile.waitingRoomCode then
			pvpRooms[profile.waitingRoomCode] = nil
		end
		local roomCode = tostring(math.random(100000, 999999))
		while pvpRooms[roomCode] do
			roomCode = tostring(math.random(100000, 999999))
		end
		pvpRooms[roomCode] = {
			host = player,
			leaderId = profile.leaderId,
			createdAt = os.time(),
		}
		profile.waitingRoomCode = roomCode
		sendNotification(player, "🔑 สร้างห้อง PvP เลขห้อง [" .. roomCode .. "] สำเร็จ! ส่งเลข 6 หลักให้เพื่อนกรอกเข้าห้องได้เลย", "SUCCESS")
		broadcastRoomList()
		return
	elseif action == "CANCEL_PVP_ROOM" then
		if profile.waitingRoomCode then
			pvpRooms[profile.waitingRoomCode] = nil
			profile.waitingRoomCode = nil
			broadcastRoomList()
		end
		return
	elseif action == "JOIN_PVP_ROOM" then
		local code = string.gsub(tostring(payload.roomCode or ""), "%s+", "")
		local room = pvpRooms[code]
		if not room or not room.host or room.host.Parent ~= Players then
			sendNotification(player, "ไม่พบเลขห้อง " .. code .. " หรือเจ้าของห้องออกไปแล้ว!", "WARN")
			broadcastRoomList()
			return
		end
		if room.host == player then
			sendNotification(player, "คุณเป็นเจ้าของห้องนี้อยู่แล้ว รอเพื่อนกรอกเลขห้อง " .. code, "INFO")
			return
		end
		local hostPlayer = room.host
		pvpRooms[code] = nil
		if playerProfiles[hostPlayer] then
			playerProfiles[hostPlayer].waitingRoomCode = nil
		end
		broadcastRoomList()
		startPvpMatch(hostPlayer, player, nil)
		return
	elseif action == "CHALLENGE_PLAYER" then
		local targetUserId = tonumber(payload.targetUserId)
		for _, other in ipairs(Players:GetPlayers()) do
			if other.UserId == targetUserId and other ~= player then
				local op = getProfile(other)
				if op.activeMatchId then
					sendNotification(player, other.DisplayName .. " กำลังอยู่ในแมตช์อื่น!", "WARN")
					return
				end
				if not op.duelRequestOpen then
					sendNotification(player, other.DisplayName .. " ปิดรับคำท้าดวลไว้", "WARN")
					return
				end
				startPvpMatch(player, other, nil)
				return
			end
		end
		sendNotification(player, "ไม่พบผู้เล่นเป้าหมายในเซิร์ฟเวอร์", "WARN")
		return
	elseif action == "REQUEST_ROOM_LIST" then
		broadcastRoomList()
		return
	end

	-- 13. คำสั่งภายในแมตช์การดวล
	local matchId = profile.activeMatchId
	local matchRecord = matchId and activeMatches[matchId] or nil
	if not matchRecord or not matchRecord.engine then
		return
	end

	local engine = matchRecord.engine
	local mySide = (matchRecord.p1 == player) and "P1" or "P2"

	if action == "MULLIGAN" then
		engine:performMulligan(mySide, payload.indices)
	elseif action == "PLAY_CARD" then
		engine:playHandCard(mySide, tonumber(payload.handIndex) or 1, payload.targetSlot and tonumber(payload.targetSlot) or nil)
	elseif action == "ACTIVATE_LEADER" then
		engine:activateLeaderSkill(mySide)
	elseif action == "ACTIVATE_MONSTER" then
		engine:activateBoardMonsterSkill(mySide, tonumber(payload.slotIndex) or 1)
	elseif action == "DECLARE_ATTACK" then
		engine:declareAttack(
			mySide,
			tonumber(payload.attackerSlot) or 1,
			tostring(payload.targetType or "leader"),
			payload.targetSlot and tonumber(payload.targetSlot) or nil
		)
	elseif action == "NEXT_PHASE" then
		engine:advancePhaseOrTurn(mySide)
	elseif action == "CHOICE_RESPONSE" then
		engine:handlePlayerChoiceResponse(mySide, tonumber(payload.optionIndex) or 1)
	elseif action == "TARGET_RESPONSE" then
		engine:handlePlayerTargetResponse(mySide, tostring(payload.zone or ""), tonumber(payload.index) or 1)
	elseif action == "LEAVE_MATCH" or action == "SURRENDER" then
		if not engine.gameOver then
			engine.gameOver = true
			engine.winnerSide = (mySide == "P1") and "P2" or "P1"
			engine.pendingPrompt = nil
			engine:addLog(string.format("🏳️ %s กดยอมแพ้! จบการแข่งขัน", player.DisplayName))
			syncMatchToPlayers(matchRecord, nil)
		end
		cleanupMatch(matchId)
	end
end)

Players.PlayerAdded:Connect(function(player: Player)
	getProfile(player)
	task.delay(1.0, function()
		if player.Parent == Players then
			syncProfileToPlayer(player)
			broadcastRoomList()
		end
	end)
end)

Players.PlayerRemoving:Connect(function(player: Player)
	local prof = playerProfiles[player]
	if prof then
		if prof.waitingRoomCode then
			pvpRooms[prof.waitingRoomCode] = nil
			broadcastRoomList()
		end
		if prof.activeMatchId then
			local rec = activeMatches[prof.activeMatchId]
			if rec and rec.engine and not rec.engine.gameOver then
				local leaverSide = (rec.p1 == player) and "P1" or "P2"
				rec.engine.gameOver = true
				rec.engine.winnerSide = (leaverSide == "P1") and "P2" or "P1"
				rec.engine:addLog(string.format("⚠️ %s ออกจากเกม — อีกฝ่ายชนะบายทันที!", player.DisplayName))
				syncMatchToPlayers(rec, nil)
			end
			cleanupMatch(prof.activeMatchId)
		end
	end
	for _, court in pairs(duelCourts) do
		if court.seat1 == player then
			court.seat1 = nil
			updateCourt3DVisual(court.id)
		end
		if court.seat2 == player then
			court.seat2 = nil
			updateCourt3DVisual(court.id)
		end
	end
	playerProfiles[player] = nil
end)

print("🚀 [แบทเทิล ออฟ เฟรน] BOF_Server (BuddyTime UI Edition) พร้อมใช้งานแล้ว!")
