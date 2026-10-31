--!nonstrict
--[[
	============================================================================
	BATTLE OF FRIENDS (แบทเทิล ออฟ เฟรน) — เซิร์ฟเวอร์หลัก (BOF_Server)
	วางไว้ที่: ServerScriptService > BOF_Server (Script)
	หน้าที่:
	  1. ตรวจสอบ CardSchema ตอนเริ่มเซิร์ฟเวอร์
	  2. สร้าง RemoteEvents อัตโนมัติใน ReplicatedStorage > BOF_Remotes
	  3. สร้างลานประลอง 3D (โต๊ะดวล PvP 3 โต๊ะ + แท่นท้าดวลบอท 4 เผ่า) ใน Workspace อัตโนมัติ
	  4. จัดการระบบห้อง PvP, โต๊ะดวล, บอท AI, การจัดเด็ค และการประมวลผล GameEngine บนเซิร์ฟเวอร์
	============================================================================
]]

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Workspace = game:GetService("Workspace")

local BOF_Shared = ReplicatedStorage:WaitForChild("BOF_Shared")
local CardDatabase = require(BOF_Shared:WaitForChild("CardDatabase"))
local CardSchema = require(BOF_Shared:WaitForChild("CardSchema"))
local GameEngine = require(BOF_Shared:WaitForChild("GameEngine"))

-- 1. ตรวจสอบความถูกต้องของการ์ดทั้งหมดตอนเปิดเซิร์ฟเวอร์
CardSchema.validateAll()

-- 2. สร้างโฟลเดอร์ RemoteEvents สำหรับสื่อสารระหว่าง Client <-> Server
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

local DuelActionEvent = getOrCreateRemote("DuelAction") -- Client -> Server
local DuelStateEvent = getOrCreateRemote("DuelState")   -- Server -> Client

-- 3. สถานะของผู้เล่นและห้องแข่งขันทั้งหมดบนเซิร์ฟเวอร์
local playerProfiles = {} -- [Player] = { leaderId = "L01", mainDeck = {...}, activeMatchId = nil, seatedTableId = nil }
local activeMatches = {}  -- [matchId] = { engine = GameEngine, p1 = Player, p2 = Player?, tableId = number? }
local pvpRooms = {}       -- [roomCode] = { host = Player, hostName = string, leaderId = string, createdAt = number }
local duelTables = {}     -- [tableId] = { id = number, seat1 = Player?, seat2 = Player?, matchId = string?, billboardLabel = TextLabel? }

local function getProfile(player: Player)
	if not playerProfiles[player] then
		playerProfiles[player] = {
			leaderId = "L01",
			mainDeck = CardDatabase.getDefaultDeck("L01"),
			activeMatchId = nil,
			waitingRoomCode = nil,
			seatedTableId = nil,
		}
	end
	return playerProfiles[player]
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

local function updateTableVisual(tableId: number)
	local tbl = duelTables[tableId]
	if not tbl or not tbl.statusLabel then
		return
	end
	local p1Name = tbl.seat1 and tbl.seat1.DisplayName or "ว่าง (กด E เพื่อนั่ง)"
	local p2Name = tbl.seat2 and tbl.seat2.DisplayName or "ว่าง (กด E เพื่อนั่ง)"
	if tbl.matchId then
		tbl.statusLabel.Text = string.format("⚔️ กำลังดวล: %s VS %s", p1Name, p2Name)
		tbl.statusLabel.TextColor3 = Color3.fromRGB(251, 191, 36)
	else
		tbl.statusLabel.Text = string.format("ฝั่ง P1: %s  |  ฝั่ง P2: %s", p1Name, p2Name)
		tbl.statusLabel.TextColor3 = Color3.fromRGB(226, 232, 240)
	end
end

-- ==================== การสร้างและซิงค์ Match ====================
local function syncMatchToPlayers(matchRecord, showcaseBanner)
	local engine = matchRecord.engine
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
	if rec.tableId and duelTables[rec.tableId] then
		local tbl = duelTables[rec.tableId]
		tbl.matchId = nil
		tbl.seat1 = nil
		tbl.seat2 = nil
		updateTableVisual(rec.tableId)
	end
end

local function startBotMatch(player: Player, aiDifficulty: string?, aiLeaderId: string?)
	local profile = getProfile(player)
	if profile.activeMatchId then
		cleanupMatch(profile.activeMatchId)
	end

	local matchId = string.format("bot_%d_%d", player.UserId, math.random(1000, 9999))
	local diff = aiDifficulty or "HARD"
	local botNames = {
		EASY = "🤖 บอทฝึกหัด (Easy)",
		MEDIUM = "🤖 บอทนักสู้ (Medium)",
		HARD = "🤖 บอทปรมาจารย์ (Hard)",
	}

	local matchRecord = {
		matchId = matchId,
		p1 = player,
		p2 = nil,
		tableId = nil,
		engine = nil,
	}

	local engine = GameEngine.newMatch({
		matchId = matchId,
		mode = "BOT",
		aiDifficulty = diff,
		p1Name = player.DisplayName,
		p1LeaderId = profile.leaderId,
		p1DeckList = profile.mainDeck,
		p2Name = botNames[diff] or "🤖 AI Bot",
		p2LeaderId = aiLeaderId or "RANDOM",
		onStateChanged = function(_, _, showcaseBanner)
			syncMatchToPlayers(matchRecord, showcaseBanner)
		end,
	})

	matchRecord.engine = engine
	activeMatches[matchId] = matchRecord
	profile.activeMatchId = matchId

	syncMatchToPlayers(matchRecord, nil)
end

local function startPvpMatch(player1: Player, player2: Player, tableId: number?)
	local prof1 = getProfile(player1)
	local prof2 = getProfile(player2)

	if prof1.activeMatchId then
		cleanupMatch(prof1.activeMatchId)
	end
	if prof2.activeMatchId then
		cleanupMatch(prof2.activeMatchId)
	end

	-- สุ่มว่าใครได้เริ่มเป็น P1
	local p1, p2 = player1, player2
	if math.random(1, 2) == 2 then
		p1, p2 = player2, player1
		prof1, prof2 = prof2, prof1
	end

	local matchId = string.format("pvp_%d_%d_%d", p1.UserId, p2.UserId, math.random(1000, 9999))
	local matchRecord = {
		matchId = matchId,
		p1 = p1,
		p2 = p2,
		tableId = tableId,
		engine = nil,
	}

	local engine = GameEngine.newMatch({
		matchId = matchId,
		mode = "PVP",
		p1Name = p1.DisplayName,
		p1LeaderId = prof1.leaderId,
		p1DeckList = prof1.mainDeck,
		p2Name = p2.DisplayName,
		p2LeaderId = prof2.leaderId,
		p2DeckList = prof2.mainDeck,
		onStateChanged = function(_, _, showcaseBanner)
			syncMatchToPlayers(matchRecord, showcaseBanner)
		end,
	})

	matchRecord.engine = engine
	activeMatches[matchId] = matchRecord
	prof1.activeMatchId = matchId
	prof2.activeMatchId = matchId

	if tableId and duelTables[tableId] then
		duelTables[tableId].matchId = matchId
		updateTableVisual(tableId)
	end

	syncMatchToPlayers(matchRecord, nil)
end

-- ==================== สร้างลานประลอง 3D (Duel Arena & Tables) ใน Workspace ====================
local function buildArenaInWorkspace()
	if Workspace:FindFirstChild("BattleOfFriends_Arena") then
		return
	end

	local arena = Instance.new("Folder")
	arena.Name = "BattleOfFriends_Arena"
	arena.Parent = Workspace

	-- พื้นลานประลองตรงกลางใกล้จุดเกิด
	local platform = Instance.new("Part")
	platform.Name = "ArenaPlatform"
	platform.Size = Vector3.new(96, 1.2, 64)
	platform.Position = Vector3.new(0, 0.6, -38)
	platform.Anchored = true
	platform.Material = Enum.Material.SmoothPlastic
	platform.Color = Color3.fromRGB(15, 23, 42)
	platform.Parent = arena

	local border = Instance.new("SelectionBox")
	border.Color3 = Color3.fromRGB(56, 189, 248)
	border.LineThickness = 0.08
	border.Adornee = platform
	border.Parent = platform

	-- ป้ายชื่อลานประลองขนาดใหญ่
	local signPart = Instance.new("Part")
	signPart.Name = "ArenaHeaderSign"
	signPart.Size = Vector3.new(34, 6, 1)
	signPart.Position = Vector3.new(0, 14, -66)
	signPart.Anchored = true
	signPart.Transparency = 0.2
	signPart.Material = Enum.Material.Neon
	signPart.Color = Color3.fromRGB(30, 58, 138)
	signPart.Parent = arena

	local signGui = Instance.new("SurfaceGui")
	signGui.Face = Enum.NormalId.South
	signGui.PixelsPerStud = 35
	signGui.Parent = signPart

	local signLabel = Instance.new("TextLabel")
	signLabel.Size = UDim2.fromScale(1, 1)
	signLabel.BackgroundTransparency = 1
	signLabel.Text = "⚔️ แบทเทิล ออฟ เฟรน (BATTLE OF FRIENDS) ⚔️\nเดินไปที่โต๊ะเพื่อกด E ดวลกับเพื่อน หรือคลิกปุ่มด้านบนจอเพื่อเล่นได้ทุกที่!"
	signLabel.TextColor3 = Color3.fromRGB(254, 240, 138)
	signLabel.Font = Enum.Font.GothamBold
	signLabel.TextScaled = true
	signLabel.Parent = signGui

	-- สร้างโต๊ะดวล PvP 3 โต๊ะ
	for i = 1, 3 do
		local xOffset = (i - 2) * 26
		local tableCenter = Vector3.new(xOffset, 2.5, -34)

		local tableModel = Instance.new("Model")
		tableModel.Name = "DuelTable_" .. tostring(i)
		tableModel.Parent = arena

		local topPart = Instance.new("Part")
		topPart.Name = "TableTop"
		topPart.Size = Vector3.new(12, 1.2, 8)
		topPart.Position = tableCenter
		topPart.Anchored = true
		topPart.Material = Enum.Material.SmoothPlastic
		topPart.Color = Color3.fromRGB(30, 41, 59)
		topPart.Parent = tableModel

		local neonTrim = Instance.new("SelectionBox")
		neonTrim.Color3 = Color3.fromRGB(245, 158, 11)
		neonTrim.LineThickness = 0.06
		neonTrim.Adornee = topPart
		neonTrim.Parent = topPart

		-- ป้ายลอยเหนือโต๊ะ
		local bb = Instance.new("BillboardGui")
		bb.Size = UDim2.fromOffset(280, 70)
		bb.StudsOffset = Vector3.new(0, 5.2, 0)
		bb.AlwaysOnTop = true
		bb.MaxDistance = 90
		bb.Parent = topPart

		local titleLbl = Instance.new("TextLabel")
		titleLbl.Size = UDim2.new(1, 0, 0.5, 0)
		titleLbl.BackgroundTransparency = 1
		titleLbl.Font = Enum.Font.GothamBlack
		titleLbl.TextSize = 18
		titleLbl.TextColor3 = Color3.fromRGB(251, 191, 36)
		titleLbl.TextStrokeTransparency = 0.2
		titleLbl.Text = string.format("⚔️ โต๊ะดวล PvP #%d", i)
		titleLbl.Parent = bb

		local statusLbl = Instance.new("TextLabel")
		statusLbl.Size = UDim2.new(1, 0, 0.5, 0)
		statusLbl.Position = UDim2.fromScale(0, 0.5)
		statusLbl.BackgroundTransparency = 1
		statusLbl.Font = Enum.Font.GothamBold
		statusLbl.TextSize = 14
		statusLbl.TextColor3 = Color3.fromRGB(226, 232, 240)
		statusLbl.TextStrokeTransparency = 0.3
		statusLbl.Text = "ฝั่ง P1: ว่าง  |  ฝั่ง P2: ว่าง"
		statusLbl.Parent = bb

		duelTables[i] = {
			id = i,
			seat1 = nil,
			seat2 = nil,
			matchId = nil,
			statusLabel = statusLbl,
		}

		-- สร้างจุดยืน/เก้าอี้ 2 ฝั่งพร้อม ProximityPrompt
		for sideIdx = 1, 2 do
			local zDir = (sideIdx == 1) and -6 or 6
			local pad = Instance.new("Part")
			pad.Name = "PlayerPad_" .. tostring(sideIdx)
			pad.Size = Vector3.new(4.5, 0.6, 4.5)
			pad.Position = tableCenter + Vector3.new(0, -1.0, zDir)
			pad.Anchored = true
			pad.Material = Enum.Material.Neon
			pad.Color = (sideIdx == 1) and Color3.fromRGB(37, 99, 235) or Color3.fromRGB(220, 38, 38)
			pad.Parent = tableModel

			local prompt = Instance.new("ProximityPrompt")
			prompt.ObjectText = string.format("โต๊ะดวลแบทเทิล ออฟ เฟรน #%d", i)
			prompt.ActionText = string.format("เข้าร่วมฝั่ง P%d", sideIdx)
			prompt.HoldDuration = 0
			prompt.MaxActivationDistance = 10
			prompt.Parent = pad

			prompt.Triggered:Connect(function(plr: Player)
				local tbl = duelTables[i]
				if not tbl then
					return
				end
				if tbl.matchId then
					sendNotification(plr, "โต๊ะนี้กำลังดวลอยู่! กรุณาเลือกโต๊ะอื่น", "WARN")
					return
				end

				local prof = getProfile(plr)
				if prof.activeMatchId then
					sendNotification(plr, "คุณกำลังอยู่ในแมตช์ดวลอยู่แล้ว!", "WARN")
					return
				end

				-- ถ้ากดซ้ำที่เดิม = ลุกออกจากโต๊ะ
				if (sideIdx == 1 and tbl.seat1 == plr) or (sideIdx == 2 and tbl.seat2 == plr) then
					if sideIdx == 1 then
						tbl.seat1 = nil
					else
						tbl.seat2 = nil
					end
					prof.seatedTableId = nil
					updateTableVisual(i)
					sendNotification(plr, "คุณออกจากโต๊ะดวลแล้ว", "INFO")
					return
				end

				-- ล้างที่นั่งเก่าถ้าเคยนั่งโต๊ะอื่น
				for _, otherTbl in pairs(duelTables) do
					if otherTbl.seat1 == plr then
						otherTbl.seat1 = nil
						updateTableVisual(otherTbl.id)
					end
					if otherTbl.seat2 == plr then
						otherTbl.seat2 = nil
						updateTableVisual(otherTbl.id)
					end
				end

				if sideIdx == 1 then
					if tbl.seat1 and tbl.seat1.Parent == Players then
						sendNotification(plr, "ฝั่ง P1 มีคนนั่งอยู่แล้ว!", "WARN")
						return
					end
					tbl.seat1 = plr
				else
					if tbl.seat2 and tbl.seat2.Parent == Players then
						sendNotification(plr, "ฝั่ง P2 มีคนนั่งอยู่แล้ว!", "WARN")
						return
					end
					tbl.seat2 = plr
				end

				prof.seatedTableId = i
				updateTableVisual(i)
				sendNotification(plr, string.format("นั่งประจำที่โต๊ะ #%d (ฝั่ง P%d) แล้ว! รอคู่ต่อสู้อีกฝั่ง...", i, sideIdx), "SUCCESS")

				-- เมื่อนั่งครบ 2 คน เริ่มดวล PvP ทันที!
				if tbl.seat1 and tbl.seat2 and tbl.seat1.Parent == Players and tbl.seat2.Parent == Players then
					startPvpMatch(tbl.seat1, tbl.seat2, i)
				end
			end)
		end
	end

	-- สร้างแท่นท้าดวล AI Bot ทั้ง 4 เด็ค (จิต, ขุนเหนือ, วันสิ้นโลก, ไดโน)
	local botPedestals = {
		{ id = "L01", title = "🤖 ดวลบอท: เด็คจิต", color = Color3.fromRGB(59, 130, 246) },
		{ id = "L02", title = "🤖 ดวลบอท: เด็คขุนเหนือ", color = Color3.fromRGB(245, 158, 11) },
		{ id = "L03", title = "🤖 ดวลบอท: เด็ควันสิ้นโลก", color = Color3.fromRGB(168, 85, 247) },
		{ id = "L04", title = "🤖 ดวลบอท: เด็คไดโน", color = Color3.fromRGB(34, 197, 94) },
	}

	for idx, info in ipairs(botPedestals) do
		local xPos = (idx - 2.5) * 20
		local ped = Instance.new("Part")
		ped.Name = "BotPedestal_" .. info.id
		ped.Size = Vector3.new(7, 4, 4)
		ped.Position = Vector3.new(xPos, 2.8, -56)
		ped.Anchored = true
		ped.Material = Enum.Material.SmoothPlastic
		ped.Color = info.color
		ped.Parent = arena

		local bb = Instance.new("BillboardGui")
		bb.Size = UDim2.fromOffset(220, 50)
		bb.StudsOffset = Vector3.new(0, 3.8, 0)
		bb.AlwaysOnTop = true
		bb.MaxDistance = 80
		bb.Parent = ped

		local lbl = Instance.new("TextLabel")
		lbl.Size = UDim2.fromScale(1, 1)
		lbl.BackgroundTransparency = 1
		lbl.Font = Enum.Font.GothamBlack
		lbl.TextSize = 16
		lbl.TextColor3 = Color3.fromRGB(255, 255, 255)
		lbl.TextStrokeTransparency = 0.2
		lbl.Text = info.title
		lbl.Parent = bb

		local prompt = Instance.new("ProximityPrompt")
		prompt.ObjectText = info.title
		prompt.ActionText = "เริ่มดวลกับ AI ทันที!"
		prompt.HoldDuration = 0
		prompt.MaxActivationDistance = 10
		prompt.Parent = ped

		prompt.Triggered:Connect(function(plr: Player)
			startBotMatch(plr, "HARD", info.id)
		end)
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

	-- 1. เลือกหรือบันทึกเด็คของผู้เล่น
	if action == "SAVE_DECK" then
		local leaderId = tostring(payload.leaderId or "L01")
		local leaderCard = CardDatabase.getCardById(leaderId)
		if not leaderCard or leaderCard.type ~= "Leader" then
			leaderId = "L01"
		end

		local validSetup = GameEngine.createValidDeck(leaderId, payload.mainDeck, "CHECK")
		local cleanIds = {}
		for _, c in ipairs(validSetup.deck) do
			table.insert(cleanIds, c.id)
		end

		profile.leaderId = leaderId
		profile.mainDeck = cleanIds

		DuelStateEvent:FireClient(player, {
			packetType = "DECK_SAVED",
			leaderId = profile.leaderId,
			mainDeck = profile.mainDeck,
		})
		sendNotification(player, string.format("บันทึกเด็คสำเร็จ! (Leader: %s | 20 ใบ)", validSetup.leader.name), "SUCCESS")
		return
	end

	-- 2. เริ่มโหมดดวลกับบอท AI
	if action == "START_BOT_MATCH" then
		local difficulty = tostring(payload.difficulty or "HARD")
		local aiLeaderId = payload.aiLeaderId and tostring(payload.aiLeaderId) or "RANDOM"
		startBotMatch(player, difficulty, aiLeaderId)
		return
	end

	-- 3. สร้างห้องรอเพื่อน PvP (ผ่าน UI)
	if action == "CREATE_PVP_ROOM" then
		if profile.waitingRoomCode then
			pvpRooms[profile.waitingRoomCode] = nil
		end
		local roomCode = tostring(math.random(1000, 9999))
		while pvpRooms[roomCode] do
			roomCode = tostring(math.random(1000, 9999))
		end
		pvpRooms[roomCode] = {
			host = player,
			leaderId = profile.leaderId,
			createdAt = os.time(),
		}
		profile.waitingRoomCode = roomCode
		sendNotification(player, "สร้างห้อง PvP รหัส #" .. roomCode .. " แล้ว! รอเพื่อนกดเข้าร่วม...", "SUCCESS")
		broadcastRoomList()
		return
	end

	-- 4. ยกเลิกห้อง PvP
	if action == "CANCEL_PVP_ROOM" then
		if profile.waitingRoomCode then
			pvpRooms[profile.waitingRoomCode] = nil
			profile.waitingRoomCode = nil
			broadcastRoomList()
		end
		return
	end

	-- 5. เข้าร่วมห้อง PvP ด้วยรหัสห้อง
	if action == "JOIN_PVP_ROOM" then
		local code = tostring(payload.roomCode or "")
		local room = pvpRooms[code]
		if not room or not room.host or room.host.Parent ~= Players then
			sendNotification(player, "ไม่พบรหัสห้องนี้ หรือเจ้าของห้องออกไปแล้ว!", "WARN")
			broadcastRoomList()
			return
		end
		if room.host == player then
			sendNotification(player, "คุณเป็นเจ้าของห้องนี้อยู่แล้ว รอผู้เล่นอีกคนกดเข้าร่วม!", "INFO")
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
	end

	if action == "REQUEST_ROOM_LIST" then
		broadcastRoomList()
		return
	end

	-- 6. คำสั่งภายในแมตช์การดวล (ต้องมี activeMatchId)
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

-- ==================== จัดการเมื่อผู้เล่นเข้า/ออกจากเกม ====================
Players.PlayerAdded:Connect(function(player: Player)
	local prof = getProfile(player)
	task.delay(1.5, function()
		if player.Parent == Players then
			DuelStateEvent:FireClient(player, {
				packetType = "DECK_SAVED",
				leaderId = prof.leaderId,
				mainDeck = prof.mainDeck,
			})
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
	for _, tbl in pairs(duelTables) do
		if tbl.seat1 == player then
			tbl.seat1 = nil
			updateTableVisual(tbl.id)
		end
		if tbl.seat2 == player then
			tbl.seat2 = nil
			updateTableVisual(tbl.id)
		end
	end
	playerProfiles[player] = nil
end)

print("🚀 [แบทเทิล ออฟ เฟรน] BOF_Server เริ่มทำงานสมบูรณ์! ลานประลองและระบบการ์ดทั้ง 48 ใบพร้อมใช้งาน")
