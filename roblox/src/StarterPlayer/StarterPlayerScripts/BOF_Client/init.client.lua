--!nonstrict
--[[
	============================================================================
	BATTLE OF FRIENDS (แบทเทิล ออฟ เฟรน) — ระบบหน้าจอ UI สไตล์ BuddyTime ครบวงจร (BOF_Client)
	วางไว้ที่: StarterPlayer > StarterPlayerScripts > BOF_Client (LocalScript)
	ฟีเจอร์ UI ครบทุกแท็บตามคลิปต้นแบบ + กฎการเล่น แบทเทิล ออฟ เฟรน 100%:
	  - แถบเมนูซ้าย 16 หมวด: Play, เควส, Deck Builder, Collection, Shop, Open Pack,
	    PvP Room, เพื่อน, กิลด์, สถิติ, Ranked, Style, ห้อง AFK, โปรไฟล์, How to play, ตั้งค่า
	  - โหมดเดินในแมพ 3D (ปุ่ม "เดินเข้าแมพ" พร้อมแถบลอย "[🏠 กลับเมนู] [⚔️ ชวนดวล : เปิด]" ด้านบนจอ)
	  - ระบบค้นหาการ์ดด้วยรูปภาพการ์ดจริง (Visual Card Grid) และคลิกขวาดูรายละเอียดการ์ดเท่านั้น!
	============================================================================
]]

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local localPlayer = Players.LocalPlayer
local playerGui = localPlayer:WaitForChild("PlayerGui")

local BOF_Shared = ReplicatedStorage:WaitForChild("BOF_Shared")
local CardDatabase = require(BOF_Shared:WaitForChild("CardDatabase"))

local BOF_Remotes = ReplicatedStorage:WaitForChild("BOF_Remotes")
local DuelActionEvent = BOF_Remotes:WaitForChild("DuelAction") :: RemoteEvent
local DuelStateEvent = BOF_Remotes:WaitForChild("DuelState") :: RemoteEvent

-- ==================== สถานะฝั่ง Client ====================
local myProfile = {
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
	deckSlots = {
		{ name = "เด็คจิต (Starter)", leaderId = "L01", mainDeck = CardDatabase.getDefaultDeck("L01"), shareCode = "BOF101" },
		{ name = "เด็คขุนเหนือ", leaderId = "L02", mainDeck = CardDatabase.getDefaultDeck("L02"), shareCode = "BOF202" },
		{ name = "เด็ควันสิ้นโลก", leaderId = "L03", mainDeck = CardDatabase.getDefaultDeck("L03"), shareCode = "BOF303" },
		{ name = "เด็คไดโนไฮบริด", leaderId = "L04", mainDeck = CardDatabase.getDefaultDeck("L04"), shareCode = "BOF404" },
	},
	leaderId = "L01",
	mainDeck = CardDatabase.getDefaultDeck("L01"),
	foilMap = { ["L01"] = "Prism", ["L04"] = "Prism", ["DN07"] = "Prism" },
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
	quests = {},
	onlinePlayers = {},
}

local currentMatchState = nil
local currentSidebarTab = "PLAY"
local selectedAiDiff = "HARD"
local selectedAiLeader = "RANDOM"
local isAfkActive = false
local openRoomsList = {}

-- สถานะระหว่างดวลบนกระดาน
local selectedHandIndex: number? = nil
local selectedAttackerSlot: number? = nil
local mulliganSelected: { [number]: boolean } = {}

-- ==================== ฟังก์ชันช่วยเหลือด้านสีและ UI ====================
local function hexToColor3(hex: string?): Color3
	if not hex or type(hex) ~= "string" then
		return Color3.fromRGB(59, 130, 246)
	end
	local clean = string.gsub(hex, "#", "")
	if #clean == 6 then
		local r = tonumber(string.sub(clean, 1, 2), 16) or 59
		local g = tonumber(string.sub(clean, 3, 4), 16) or 130
		local b = tonumber(string.sub(clean, 5, 6), 16) or 246
		return Color3.fromRGB(r, g, b)
	end
	return Color3.fromRGB(59, 130, 246)
end

local function formatCommaNumber(n: number): string
	local s = tostring(math.floor(n or 0))
	return s:reverse():gsub("(%d%d%d)", "%1,"):reverse():gsub("^,", "")
end

local function formatTribeText(tribe): string
	if type(tribe) == "table" then
		return table.concat(tribe, " / ")
	elseif type(tribe) == "string" and tribe ~= "" and tribe ~= "-" then
		return tribe
	end
	return "-"
end

local function getCardTheme(card)
	if not card then
		return { bg = Color3.fromRGB(30, 41, 59), accent = Color3.fromRGB(100, 116, 139), icon = "🃏", typeTag = "CARD" }
	end
	if card.type == "Leader" then
		return { bg = Color3.fromRGB(69, 26, 3), accent = Color3.fromRGB(245, 158, 11), icon = "👑", typeTag = "LEADER" }
	elseif card.type == "NormalSpell" then
		return { bg = Color3.fromRGB(12, 74, 110), accent = Color3.fromRGB(56, 189, 248), icon = "✨", typeTag = "SPELL" }
	elseif card.type == "ReactionSpell" then
		return { bg = Color3.fromRGB(88, 28, 135), accent = Color3.fromRGB(192, 132, 252), icon = "🛡️", typeTag = "COUNTER" }
	else
		local prefix = string.sub(card.id or "", 1, 2)
		if prefix == "DN" then
			return { bg = Color3.fromRGB(20, 83, 45), accent = Color3.fromRGB(74, 222, 128), icon = "🦖", typeTag = "MONSTER" }
		elseif prefix == "DM" then
			return { bg = Color3.fromRGB(59, 7, 100), accent = Color3.fromRGB(168, 85, 247), icon = "🌌", typeTag = "MONSTER" }
		elseif prefix == "NM" then
			return { bg = Color3.fromRGB(67, 20, 7), accent = Color3.fromRGB(251, 146, 60), icon = "⚔️", typeTag = "MONSTER" }
		else
			return { bg = Color3.fromRGB(30, 58, 138), accent = Color3.fromRGB(96, 165, 250), icon = "🔥", typeTag = "MONSTER" }
		end
	end
end

local function addCorner(parent: GuiObject, radius: number)
	local c = Instance.new("UICorner")
	c.CornerRadius = UDim.new(0, radius)
	c.Parent = parent
	return c
end

local function addStroke(parent: GuiObject, color: Color3, thickness: number, transparency: number?)
	local s = Instance.new("UIStroke")
	s.Color = color
	s.Thickness = thickness
	s.Transparency = transparency or 0
	s.ApplyStrokeMode = Enum.ApplyStrokeMode.Border
	s.Parent = parent
	return s
end

local function clearGuiChildren(container: Instance)
	for _, ch in ipairs(container:GetChildren()) do
		if ch:IsA("GuiObject") then
			ch:Destroy()
		end
	end
end

-- ==================== สร้าง ScreenGui หลัก ====================
local oldGui = playerGui:FindFirstChild("BattleOfFriendsUI")
if oldGui then
	oldGui:Destroy()
end

local screenGui = Instance.new("ScreenGui")
screenGui.Name = "BattleOfFriendsUI"
screenGui.ResetOnSpawn = false
screenGui.IgnoreGuiInset = true
screenGui.ZIndexBehavior = Enum.ZIndexBehavior.Sibling
screenGui.Parent = playerGui

-- แถบแจ้งเตือน Toast ลอยด้านบน
local toastLabel = Instance.new("TextLabel")
toastLabel.Size = UDim2.fromOffset(520, 38)
toastLabel.AnchorPoint = Vector2.new(0.5, 0)
toastLabel.Position = UDim2.new(0.5, 0, 0, 58)
toastLabel.BackgroundColor3 = Color3.fromRGB(15, 23, 42)
toastLabel.Font = Enum.Font.GothamBold
toastLabel.TextSize = 14
toastLabel.TextColor3 = Color3.fromRGB(254, 240, 138)
toastLabel.Visible = false
toastLabel.ZIndex = 95
toastLabel.Parent = screenGui
addCorner(toastLabel, 10)
addStroke(toastLabel, Color3.fromRGB(250, 204, 21), 1.8)

local function showToast(msg: string)
	toastLabel.Text = "🔔 " .. msg
	toastLabel.Visible = true
	task.delay(3.5, function()
		if toastLabel.Text == "🔔 " .. msg then
			toastLabel.Visible = false
		end
	end)
end

-- ==================== หน้าต่างดูรายละเอียดการ์ด (เปิดด้วยคลิกขวา MouseButton2Click เท่านั้น!) ====================
local inspectOverlay = Instance.new("Frame")
inspectOverlay.Name = "CardInspectModal"
inspectOverlay.Size = UDim2.fromScale(1, 1)
inspectOverlay.BackgroundColor3 = Color3.fromRGB(2, 6, 23)
inspectOverlay.BackgroundTransparency = 0.25
inspectOverlay.Visible = false
inspectOverlay.ZIndex = 90
inspectOverlay.Parent = screenGui

local inspectBox = Instance.new("Frame")
inspectBox.Size = UDim2.fromOffset(440, 530)
inspectBox.AnchorPoint = Vector2.new(0.5, 0.5)
inspectBox.Position = UDim2.fromScale(0.5, 0.5)
inspectBox.BackgroundColor3 = Color3.fromRGB(19, 23, 34)
inspectBox.ZIndex = 91
inspectBox.Parent = inspectOverlay
addCorner(inspectBox, 16)
local inspectStroke = addStroke(inspectBox, Color3.fromRGB(250, 204, 21), 2.5)

local inspectArtFrame = Instance.new("Frame")
inspectArtFrame.Size = UDim2.new(1, -32, 0, 225)
inspectArtFrame.Position = UDim2.fromOffset(16, 16)
inspectArtFrame.BackgroundColor3 = Color3.fromRGB(30, 41, 59)
inspectArtFrame.ClipsDescendants = true
inspectArtFrame.ZIndex = 92
inspectArtFrame.Parent = inspectBox
addCorner(inspectArtFrame, 12)

local inspectFallbackIcon = Instance.new("TextLabel")
inspectFallbackIcon.Size = UDim2.fromScale(1, 0.78)
inspectFallbackIcon.BackgroundTransparency = 1
inspectFallbackIcon.Font = Enum.Font.GothamBlack
inspectFallbackIcon.TextSize = 72
inspectFallbackIcon.TextColor3 = Color3.fromRGB(255, 255, 255)
inspectFallbackIcon.Text = "🃏"
inspectFallbackIcon.ZIndex = 93
inspectFallbackIcon.Parent = inspectArtFrame

local inspectCardCodeBadge = Instance.new("TextLabel")
inspectCardCodeBadge.Size = UDim2.new(1, -16, 0, 28)
inspectCardCodeBadge.Position = UDim2.new(0, 8, 1, -34)
inspectCardCodeBadge.BackgroundTransparency = 0.25
inspectCardCodeBadge.BackgroundColor3 = Color3.fromRGB(2, 6, 23)
inspectCardCodeBadge.Font = Enum.Font.GothamBold
inspectCardCodeBadge.TextSize = 13
inspectCardCodeBadge.TextColor3 = Color3.fromRGB(250, 204, 21)
inspectCardCodeBadge.ZIndex = 94
inspectCardCodeBadge.Parent = inspectArtFrame
addCorner(inspectCardCodeBadge, 6)

local inspectImage = Instance.new("ImageLabel")
inspectImage.Size = UDim2.fromScale(1, 1)
inspectImage.BackgroundTransparency = 1
inspectImage.ScaleType = Enum.ScaleType.Fit
inspectImage.Visible = false
inspectImage.ZIndex = 95
inspectImage.Parent = inspectArtFrame

local inspectTitle = Instance.new("TextLabel")
inspectTitle.Size = UDim2.new(1, -32, 0, 32)
inspectTitle.Position = UDim2.fromOffset(16, 250)
inspectTitle.BackgroundTransparency = 1
inspectTitle.Font = Enum.Font.GothamBlack
inspectTitle.TextSize = 22
inspectTitle.TextColor3 = Color3.fromRGB(254, 240, 138)
inspectTitle.TextXAlignment = Enum.TextXAlignment.Left
inspectTitle.ZIndex = 92
inspectTitle.Parent = inspectBox

local inspectMeta = Instance.new("TextLabel")
inspectMeta.Size = UDim2.new(1, -32, 0, 24)
inspectMeta.Position = UDim2.fromOffset(16, 282)
inspectMeta.BackgroundTransparency = 1
inspectMeta.Font = Enum.Font.GothamBold
inspectMeta.TextSize = 14
inspectMeta.TextColor3 = Color3.fromRGB(148, 163, 184)
inspectMeta.TextXAlignment = Enum.TextXAlignment.Left
inspectMeta.ZIndex = 92
inspectMeta.Parent = inspectBox

local inspectDescScroll = Instance.new("ScrollingFrame")
inspectDescScroll.Size = UDim2.new(1, -32, 0, 150)
inspectDescScroll.Position = UDim2.fromOffset(16, 312)
inspectDescScroll.BackgroundColor3 = Color3.fromRGB(11, 15, 25)
inspectDescScroll.BorderSizePixel = 0
inspectDescScroll.ScrollBarThickness = 6
inspectDescScroll.AutomaticCanvasSize = Enum.AutomaticSize.Y
inspectDescScroll.CanvasSize = UDim2.new(0, 0, 0, 0)
inspectDescScroll.ZIndex = 92
inspectDescScroll.Parent = inspectBox
addCorner(inspectDescScroll, 10)

local inspectDescText = Instance.new("TextLabel")
inspectDescText.Size = UDim2.new(1, -20, 0, 0)
inspectDescText.Position = UDim2.fromOffset(10, 10)
inspectDescText.AutomaticSize = Enum.AutomaticSize.Y
inspectDescText.BackgroundTransparency = 1
inspectDescText.Font = Enum.Font.GothamMedium
inspectDescText.TextSize = 15
inspectDescText.TextColor3 = Color3.fromRGB(241, 245, 249)
inspectDescText.TextWrapped = true
inspectDescText.TextXAlignment = Enum.TextXAlignment.Left
inspectDescText.TextYAlignment = Enum.TextYAlignment.Top
inspectDescText.ZIndex = 93
inspectDescText.Parent = inspectDescScroll

local inspectCloseBtn = Instance.new("TextButton")
inspectCloseBtn.Size = UDim2.new(1, -32, 0, 42)
inspectCloseBtn.Position = UDim2.fromOffset(16, 472)
inspectCloseBtn.BackgroundColor3 = Color3.fromRGB(220, 38, 38)
inspectCloseBtn.Font = Enum.Font.GothamBold
inspectCloseBtn.TextSize = 15
inspectCloseBtn.TextColor3 = Color3.fromRGB(255, 255, 255)
inspectCloseBtn.Text = "✖ ปิดหน้าต่างข้อมูล (คลิกขวาที่การ์ดใบใดก็ได้เพื่อดูรายละเอียด)"
inspectCloseBtn.ZIndex = 92
inspectCloseBtn.Parent = inspectBox
addCorner(inspectCloseBtn, 10)
inspectCloseBtn.MouseButton1Click:Connect(function()
	inspectOverlay.Visible = false
end)

local function openCardInspectModal(cardData)
	if not cardData then
		return
	end
	local fullTemplate = CardDatabase.getCardById(cardData.id) or cardData
	local theme = getCardTheme(fullTemplate)
	local foil = (myProfile.foilMap and myProfile.foilMap[fullTemplate.id]) or "Normal"

	inspectStroke.Color = (foil == "Prism" and Color3.fromRGB(232, 121, 249))
		or (foil == "Royal" and Color3.fromRGB(250, 204, 21))
		or theme.accent
	inspectArtFrame.BackgroundColor3 = theme.bg
	inspectFallbackIcon.Text = theme.icon

	local assetUri = CardDatabase.getImageAsset(cardData.image or fullTemplate.image)
	if assetUri ~= "" then
		inspectImage.Image = assetUri
		inspectImage.Visible = true
	else
		inspectImage.Visible = false
	end

	local foilLabel = (foil == "Prism" and "💎 PRISM FOIL")
		or (foil == "Royal" and "👑 ROYAL FOIL")
		or (foil == "Glossy" and "✨ GLOSSY")
		or "NORMAL"
	inspectCardCodeBadge.Text = string.format("[%s] %s • %s • %s", fullTemplate.id or "?", theme.typeTag, fullTemplate.rarity or "R", foilLabel)
	inspectTitle.Text = fullTemplate.name or "การ์ด"

	local statPart = ""
	if fullTemplate.type == "Leader" then
		local curHp = cardData.hp or fullTemplate.maxHp or 6
		local maxHp = cardData.maxHp or fullTemplate.maxHp or 6
		statPart = string.format("❤️ HP: %d/%d", curHp, maxHp)
	elseif fullTemplate.type == "Monster" then
		local effPwr = cardData.effectivePower or cardData.power or fullTemplate.power or 0
		local basePwr = fullTemplate.power or 0
		statPart = string.format("⚔️ Power: %d (พื้นฐาน %d)", effPwr, basePwr)
	else
		statPart = "✨ การ์ดเวทมนตร์"
	end

	inspectMeta.Text = string.format("%s  |  เผ่า: %s", statPart, formatTribeText(fullTemplate.tribe))
	inspectDescText.Text = fullTemplate.desc or "ไม่มีความสามารถพิเศษ"
	inspectOverlay.Visible = true
end

-- ==================== ฟังก์ชันสร้าง Card Widget (สไตล์การ์ด BuddyTime พร้อมป้าย Foil/Rarity/Power) ====================
local function createCardWidget(cardData, options)
	options = options or {}
	local width = options.width or 118
	local height = options.height or 166
	local fullCard = CardDatabase.getCardById(cardData.id) or cardData
	local theme = getCardTheme(fullCard)
	local foil = options.foilOverride or (myProfile.foilMap and myProfile.foilMap[fullCard.id]) or "Normal"

	local btn = Instance.new("TextButton")
	btn.Name = "Card_" .. tostring(cardData.uid or cardData.id)
	btn.Size = UDim2.fromOffset(width, height)
	btn.BackgroundColor3 = Color3.fromRGB(17, 24, 39)
	btn.AutoButtonColor = true
	btn.Text = ""

	if cardData.state == "Rest" and options.showRestState then
		btn.BackgroundColor3 = Color3.fromRGB(30, 27, 75)
		btn.Rotation = 8
	end

	addCorner(btn, 10)
	local defaultBorder = (foil == "Prism" and Color3.fromRGB(232, 121, 249))
		or (foil == "Royal" and Color3.fromRGB(250, 204, 21))
		or (foil == "Glossy" and Color3.fromRGB(56, 189, 248))
		or theme.accent
	local borderStroke = addStroke(btn, options.highlightColor or defaultBorder, options.isHighlighted and 3 or 1.8)

	local artBox = Instance.new("Frame")
	artBox.Size = UDim2.new(1, -10, 0.56, -6)
	artBox.Position = UDim2.fromOffset(5, 5)
	artBox.BackgroundColor3 = theme.bg
	artBox.ClipsDescendants = true
	artBox.Active = false
	artBox.Parent = btn
	addCorner(artBox, 7)

	-- แถบประเภทการ์ดด้านบนสุด (เช่น MONSTER / SPELL / COUNTER / LEADER เหมือนในคลิป 01:05!)
	local topTypeBanner = Instance.new("TextLabel")
	topTypeBanner.Size = UDim2.new(1, 0, 0, 16)
	topTypeBanner.BackgroundColor3 = Color3.fromRGB(2, 6, 23)
	topTypeBanner.BackgroundTransparency = 0.25
	topTypeBanner.Font = Enum.Font.GothamBlack
	topTypeBanner.TextSize = 10
	topTypeBanner.TextColor3 = Color3.fromRGB(255, 255, 255)
	topTypeBanner.Text = theme.typeTag
	topTypeBanner.Active = false
	topTypeBanner.Parent = artBox

	local iconLbl = Instance.new("TextLabel")
	iconLbl.Size = UDim2.new(1, 0, 0.72, 0)
	iconLbl.Position = UDim2.fromScale(0, 0.14)
	iconLbl.BackgroundTransparency = 1
	iconLbl.Font = Enum.Font.GothamBlack
	iconLbl.TextSize = math.floor(height * 0.21)
	iconLbl.TextColor3 = Color3.fromRGB(255, 255, 255)
	iconLbl.Text = theme.icon
	iconLbl.Active = false
	iconLbl.Parent = artBox

	local tribeBanner = Instance.new("TextLabel")
	tribeBanner.Size = UDim2.new(1, 0, 0, 15)
	tribeBanner.Position = UDim2.new(0, 0, 1, -15)
	tribeBanner.BackgroundColor3 = Color3.fromRGB(2, 6, 23)
	tribeBanner.BackgroundTransparency = 0.3
	tribeBanner.Font = Enum.Font.GothamBold
	tribeBanner.TextSize = 9
	tribeBanner.TextColor3 = Color3.fromRGB(203, 213, 225)
	tribeBanner.Text = formatTribeText(fullCard.tribe)
	tribeBanner.TextTruncate = Enum.TextTruncate.AtEnd
	tribeBanner.Active = false
	tribeBanner.Parent = artBox

	local imgUri = CardDatabase.getImageAsset(cardData.image or fullCard.image)
	if imgUri ~= "" then
		local img = Instance.new("ImageLabel")
		img.Size = UDim2.fromScale(1, 1)
		img.BackgroundTransparency = 1
		img.ScaleType = Enum.ScaleType.Crop
		img.Image = imgUri
		img.Active = false
		img.Parent = artBox
	end

	-- ป้าย Foil (Prism / Royal / Glossy)
	if foil ~= "Normal" then
		local foilTag = Instance.new("TextLabel")
		foilTag.Size = UDim2.fromOffset(54, 15)
		foilTag.Position = UDim2.fromOffset(4, 18)
		foilTag.BackgroundColor3 = (foil == "Prism" and Color3.fromRGB(192, 38, 211))
			or (foil == "Royal" and Color3.fromRGB(217, 119, 6))
			or Color3.fromRGB(2, 132, 199)
		foilTag.Font = Enum.Font.GothamBlack
		foilTag.TextSize = 9
		foilTag.TextColor3 = Color3.fromRGB(255, 255, 255)
		foilTag.Text = (foil == "Prism" and "💎Prism") or (foil == "Royal" and "👑Royal") or "✨Glossy"
		foilTag.Active = false
		foilTag.Parent = artBox
		addCorner(foilTag, 4)
	end

	if options.zoneBadge and options.zoneBadge ~= "" then
		local zBadge = Instance.new("TextLabel")
		zBadge.Size = UDim2.new(1, -8, 0, 17)
		zBadge.Position = UDim2.new(0, 4, 1, -34)
		zBadge.BackgroundColor3 = Color3.fromRGB(124, 58, 237)
		zBadge.Font = Enum.Font.GothamBold
		zBadge.TextSize = 10
		zBadge.TextColor3 = Color3.fromRGB(255, 255, 255)
		zBadge.Text = options.zoneBadge
		zBadge.Active = false
		zBadge.Parent = artBox
		addCorner(zBadge, 4)
	end

	if fullCard.type == "Monster" then
		local effPwr = cardData.effectivePower or cardData.power or fullCard.power or 0
		local basePwr = fullCard.power or 0
		local pwrBadge = Instance.new("TextLabel")
		pwrBadge.Size = UDim2.fromOffset(28, 20)
		pwrBadge.Position = UDim2.new(1, -32, 0, 4)
		pwrBadge.BackgroundColor3 = (effPwr > basePwr) and Color3.fromRGB(22, 163, 74)
			or ((effPwr < basePwr) and Color3.fromRGB(220, 38, 38) or Color3.fromRGB(15, 23, 42))
		pwrBadge.Font = Enum.Font.GothamBlack
		pwrBadge.TextSize = 12
		pwrBadge.TextColor3 = Color3.fromRGB(254, 240, 138)
		pwrBadge.Text = tostring(effPwr)
		pwrBadge.Active = false
		pwrBadge.Parent = btn
		addCorner(pwrBadge, 6)
		addStroke(pwrBadge, Color3.fromRGB(250, 204, 21), 1.2)
	elseif fullCard.type == "Leader" then
		local hp = cardData.hp or fullCard.maxHp or 6
		local maxHp = cardData.maxHp or fullCard.maxHp or 6
		local hpBadge = Instance.new("TextLabel")
		hpBadge.Size = UDim2.fromOffset(46, 20)
		hpBadge.Position = UDim2.new(1, -50, 0, 4)
		hpBadge.BackgroundColor3 = Color3.fromRGB(185, 28, 28)
		hpBadge.Font = Enum.Font.GothamBlack
		hpBadge.TextSize = 11
		hpBadge.TextColor3 = Color3.fromRGB(255, 255, 255)
		hpBadge.Text = string.format("❤️%d/%d", hp, maxHp)
		hpBadge.Active = false
		hpBadge.Parent = btn
		addCorner(hpBadge, 6)
	end

	local nameLbl = Instance.new("TextLabel")
	nameLbl.Size = UDim2.new(1, -10, 0, 20)
	nameLbl.Position = UDim2.new(0, 5, 0.56, 0)
	nameLbl.BackgroundTransparency = 1
	nameLbl.Font = Enum.Font.GothamBold
	nameLbl.TextSize = 11
	nameLbl.TextColor3 = Color3.fromRGB(248, 250, 252)
	nameLbl.TextTruncate = Enum.TextTruncate.AtEnd
	nameLbl.Text = fullCard.name or cardData.id
	nameLbl.Active = false
	nameLbl.Parent = btn

	local descLbl = Instance.new("TextLabel")
	descLbl.Size = UDim2.new(1, -10, 0.44, -24)
	descLbl.Position = UDim2.new(0, 5, 0.56, 19)
	descLbl.BackgroundTransparency = 1
	descLbl.Font = Enum.Font.Gotham
	descLbl.TextSize = 9
	descLbl.TextColor3 = Color3.fromRGB(148, 163, 184)
	descLbl.TextWrapped = true
	descLbl.TextYAlignment = Enum.TextYAlignment.Top
	descLbl.TextXAlignment = Enum.TextXAlignment.Left
	descLbl.Text = fullCard.desc or ""
	descLbl.Active = false
	descLbl.Parent = btn

	if options.onActivateSkill and cardData.hasMainSkill then
		local skillBtn = Instance.new("TextButton")
		skillBtn.Size = UDim2.new(1, -12, 0, 22)
		skillBtn.Position = UDim2.new(0, 6, 1, -25)
		skillBtn.BackgroundColor3 = Color3.fromRGB(2, 132, 199)
		skillBtn.Font = Enum.Font.GothamBold
		skillBtn.TextSize = 11
		skillBtn.TextColor3 = Color3.fromRGB(255, 255, 255)
		skillBtn.Text = "⚡ ใช้สกิล"
		skillBtn.ZIndex = (btn.ZIndex or 1) + 3
		skillBtn.Parent = btn
		addCorner(skillBtn, 6)
		skillBtn.MouseButton1Click:Connect(function()
			options.onActivateSkill()
		end)
	end

	if options.onLeftClick then
		btn.MouseButton1Click:Connect(function()
			options.onLeftClick()
		end)
	end

	btn.MouseButton2Click:Connect(function()
		openCardInspectModal(cardData)
	end)

	return btn, borderStroke
end

-- ==================== แถบลอยด้านบนจอขณะเดินในแมพ 3D (เหมือนในคลิป 00:31-00:36!) ====================
local mapFloatingBar = Instance.new("Frame")
mapFloatingBar.Name = "MapTopFloatingBar"
mapFloatingBar.Size = UDim2.fromOffset(310, 38)
mapFloatingBar.AnchorPoint = Vector2.new(0.5, 0)
mapFloatingBar.Position = UDim2.new(0.5, 0, 0, 10)
mapFloatingBar.BackgroundColor3 = Color3.fromRGB(15, 23, 42)
mapFloatingBar.BackgroundTransparency = 0.12
mapFloatingBar.Visible = false
mapFloatingBar.ZIndex = 45
mapFloatingBar.Parent = screenGui
addCorner(mapFloatingBar, 10)
addStroke(mapFloatingBar, Color3.fromRGB(71, 85, 105), 1.5)

local backToMenuBtn = Instance.new("TextButton")
backToMenuBtn.Size = UDim2.new(0.46, -8, 1, -8)
backToMenuBtn.Position = UDim2.fromOffset(6, 4)
backToMenuBtn.BackgroundColor3 = Color3.fromRGB(30, 41, 59)
backToMenuBtn.Font = Enum.Font.GothamBold
backToMenuBtn.TextSize = 13
backToMenuBtn.TextColor3 = Color3.fromRGB(255, 255, 255)
backToMenuBtn.Text = "🏠 กลับเมนู"
backToMenuBtn.ZIndex = 46
backToMenuBtn.Parent = mapFloatingBar
addCorner(backToMenuBtn, 8)

local mapChallengeToggleBtn = Instance.new("TextButton")
mapChallengeToggleBtn.Size = UDim2.new(0.54, -8, 1, -8)
mapChallengeToggleBtn.Position = UDim2.new(0.46, 2, 0, 4)
mapChallengeToggleBtn.BackgroundColor3 = Color3.fromRGB(22, 163, 74)
mapChallengeToggleBtn.Font = Enum.Font.GothamBold
mapChallengeToggleBtn.TextSize = 13
mapChallengeToggleBtn.TextColor3 = Color3.fromRGB(255, 255, 255)
mapChallengeToggleBtn.Text = "⚔️ ชวนดวล : เปิด"
mapChallengeToggleBtn.ZIndex = 46
mapChallengeToggleBtn.Parent = mapFloatingBar
addCorner(mapChallengeToggleBtn, 8)
mapChallengeToggleBtn.MouseButton1Click:Connect(function()
	DuelActionEvent:FireServer({ action = "TOGGLE_DUEL_REQUEST" })
end)

-- ==================== หน้าจอ Hub เมนูหลักเต็มจอสไตล์ BuddyTime (00:00 - 03:19) ====================
local hubScreen = Instance.new("Frame")
hubScreen.Name = "BuddyTimeHubScreen"
hubScreen.Size = UDim2.fromScale(1, 1)
hubScreen.BackgroundColor3 = Color3.fromRGB(16, 18, 24)
hubScreen.ZIndex = 25
hubScreen.Parent = screenGui

-- 1. แถบหัวด้านบน (Top Header Bar: โลโก้ BATTLE OF FRIENDS + ปุ่ม Code! + เหรียญทอง + เวลาออนไลน์)
local topHeader = Instance.new("Frame")
topHeader.Size = UDim2.new(1, 0, 0, 50)
topHeader.BackgroundColor3 = Color3.fromRGB(22, 25, 34)
topHeader.BorderSizePixel = 0
topHeader.ZIndex = 26
topHeader.Parent = hubScreen
addStroke(topHeader, Color3.fromRGB(45, 55, 72), 1)

local logoLabel = Instance.new("TextLabel")
logoLabel.Size = UDim2.fromOffset(275, 38)
logoLabel.Position = UDim2.fromOffset(16, 6)
logoLabel.BackgroundTransparency = 1
logoLabel.Font = Enum.Font.GothamBlack
logoLabel.TextSize = 21
logoLabel.RichText = true
logoLabel.Text = '<font color="#38bdf8">BATTLE</font> <font color="#facc15">OF FRIENDS</font> ⚡'
logoLabel.TextXAlignment = Enum.TextXAlignment.Left
logoLabel.ZIndex = 27
logoLabel.Parent = topHeader

local openCodeModalBtn = Instance.new("TextButton")
openCodeModalBtn.Size = UDim2.fromOffset(82, 28)
openCodeModalBtn.Position = UDim2.fromOffset(298, 11)
openCodeModalBtn.BackgroundColor3 = Color3.fromRGB(22, 163, 74)
openCodeModalBtn.Font = Enum.Font.GothamBlack
openCodeModalBtn.TextSize = 13
openCodeModalBtn.TextColor3 = Color3.fromRGB(255, 255, 255)
openCodeModalBtn.Text = "🎁 Code!"
openCodeModalBtn.ZIndex = 27
openCodeModalBtn.Parent = topHeader
addCorner(openCodeModalBtn, 8)
addStroke(openCodeModalBtn, Color3.fromRGB(134, 239, 172), 1.5)

local coinsPill = Instance.new("Frame")
coinsPill.Size = UDim2.fromOffset(145, 34)
coinsPill.Position = UDim2.new(1, -305, 0, 8)
coinsPill.BackgroundColor3 = Color3.fromRGB(30, 35, 48)
coinsPill.ZIndex = 27
coinsPill.Parent = topHeader
addCorner(coinsPill, 17)
addStroke(coinsPill, Color3.fromRGB(234, 179, 8), 1.5)

local coinsTextLabel = Instance.new("TextLabel")
coinsTextLabel.Size = UDim2.new(1, -16, 1, 0)
coinsTextLabel.Position = UDim2.fromOffset(8, 0)
coinsTextLabel.BackgroundTransparency = 1
coinsTextLabel.Font = Enum.Font.GothamBlack
coinsTextLabel.TextSize = 15
coinsTextLabel.TextColor3 = Color3.fromRGB(250, 204, 21)
coinsTextLabel.Text = "🪙 29,990"
coinsTextLabel.ZIndex = 28
coinsTextLabel.Parent = coinsPill

local packTicketPill = Instance.new("Frame")
packTicketPill.Size = UDim2.fromOffset(140, 34)
packTicketPill.Position = UDim2.new(1, -152, 0, 8)
packTicketPill.BackgroundColor3 = Color3.fromRGB(30, 35, 48)
packTicketPill.ZIndex = 27
packTicketPill.Parent = topHeader
addCorner(packTicketPill, 17)
addStroke(packTicketPill, Color3.fromRGB(56, 189, 248), 1.5)

local packTicketLabel = Instance.new("TextLabel")
packTicketLabel.Size = UDim2.new(1, -12, 1, 0)
packTicketLabel.Position = UDim2.fromOffset(6, 0)
packTicketLabel.BackgroundTransparency = 1
packTicketLabel.Font = Enum.Font.GothamBold
packTicketLabel.TextSize = 13
packTicketLabel.TextColor3 = Color3.fromRGB(125, 211, 252)
packTicketLabel.Text = "🎟️ ตั๋วซองฟรี: 5"
packTicketLabel.ZIndex = 28
packTicketLabel.Parent = packTicketPill

-- หน้าต่างกรอกโค้ดรับรางวัล (เมื่อคลิกปุ่ม Code!)
local codeModal = Instance.new("Frame")
codeModal.Size = UDim2.fromOffset(400, 210)
codeModal.AnchorPoint = Vector2.new(0.5, 0.5)
codeModal.Position = UDim2.fromScale(0.5, 0.5)
codeModal.BackgroundColor3 = Color3.fromRGB(22, 27, 38)
codeModal.Visible = false
codeModal.ZIndex = 85
codeModal.Parent = screenGui
addCorner(codeModal, 14)
addStroke(codeModal, Color3.fromRGB(34, 197, 94), 2)

local codeModalTitle = Instance.new("TextLabel")
codeModalTitle.Size = UDim2.new(1, -24, 0, 32)
codeModalTitle.Position = UDim2.fromOffset(12, 12)
codeModalTitle.BackgroundTransparency = 1
codeModalTitle.Font = Enum.Font.GothamBlack
codeModalTitle.TextSize = 18
codeModalTitle.TextColor3 = Color3.fromRGB(134, 239, 172)
codeModalTitle.Text = "🎁 กรอกโค้ดรับรางวัล (BOF2026 / FRIEND999)"
codeModalTitle.ZIndex = 86
codeModalTitle.Parent = codeModal

local codeInputBox = Instance.new("TextBox")
codeInputBox.Size = UDim2.new(1, -32, 0, 42)
codeInputBox.Position = UDim2.fromOffset(16, 56)
codeInputBox.BackgroundColor3 = Color3.fromRGB(11, 15, 25)
codeInputBox.Font = Enum.Font.GothamBold
codeInputBox.TextSize = 16
codeInputBox.TextColor3 = Color3.fromRGB(255, 255, 255)
codeInputBox.PlaceholderText = "พิมพ์โค้ดที่นี่ เช่น BOF2026..."
codeInputBox.Text = "BOF2026"
codeInputBox.ZIndex = 86
codeInputBox.Parent = codeModal
addCorner(codeInputBox, 8)

local redeemConfirmBtn = Instance.new("TextButton")
redeemConfirmBtn.Size = UDim2.new(0.6, -20, 0, 40)
redeemConfirmBtn.Position = UDim2.fromOffset(16, 114)
redeemConfirmBtn.BackgroundColor3 = Color3.fromRGB(22, 163, 74)
redeemConfirmBtn.Font = Enum.Font.GothamBlack
redeemConfirmBtn.TextSize = 15
redeemConfirmBtn.TextColor3 = Color3.fromRGB(255, 255, 255)
redeemConfirmBtn.Text = "✅ ยืนยันรับรางวัล"
redeemConfirmBtn.ZIndex = 86
redeemConfirmBtn.Parent = codeModal
addCorner(redeemConfirmBtn, 8)

local redeemCloseBtn = Instance.new("TextButton")
redeemCloseBtn.Size = UDim2.new(0.4, -20, 0, 40)
redeemCloseBtn.Position = UDim2.new(0.6, 4, 0, 114)
redeemCloseBtn.BackgroundColor3 = Color3.fromRGB(71, 85, 105)
redeemCloseBtn.Font = Enum.Font.GothamBold
redeemCloseBtn.TextSize = 14
redeemCloseBtn.TextColor3 = Color3.fromRGB(255, 255, 255)
redeemCloseBtn.Text = "ปิด"
redeemCloseBtn.ZIndex = 86
redeemCloseBtn.Parent = codeModal
addCorner(redeemCloseBtn, 8)

openCodeModalBtn.MouseButton1Click:Connect(function()
	codeModal.Visible = not codeModal.Visible
end)
redeemCloseBtn.MouseButton1Click:Connect(function()
	codeModal.Visible = false
end)
redeemConfirmBtn.MouseButton1Click:Connect(function()
	DuelActionEvent:FireServer({
		action = "REDEEM_CODE",
		code = codeInputBox.Text,
	})
	codeModal.Visible = false
end)

-- 2. แถบเมนูซ้ายมือ 16 หมวด (Left Sidebar Navigation เหมือนในคลิปเป๊ะ!)
local leftSidebar = Instance.new("ScrollingFrame")
leftSidebar.Size = UDim2.new(0, 195, 1, -66)
leftSidebar.Position = UDim2.fromOffset(10, 58)
leftSidebar.BackgroundTransparency = 1
leftSidebar.BorderSizePixel = 0
leftSidebar.ScrollBarThickness = 4
leftSidebar.AutomaticCanvasSize = Enum.AutomaticSize.Y
leftSidebar.CanvasSize = UDim2.new(0, 0, 0, 0)
leftSidebar.ZIndex = 26
leftSidebar.Parent = hubScreen

local sidebarLayout = Instance.new("UIListLayout")
sidebarLayout.Padding = UDim.new(0, 6)
sidebarLayout.Parent = leftSidebar

-- 3. พื้นที่แสดงเนื้อหาหลักด้านขวา (Main Content Panel)
local mainContentCard = Instance.new("Frame")
mainContentCard.Size = UDim2.new(1, -225, 1, -72)
mainContentCard.Position = UDim2.fromOffset(213, 60)
mainContentCard.BackgroundColor3 = Color3.fromRGB(22, 26, 36)
mainContentCard.ZIndex = 26
mainContentCard.Parent = hubScreen
addCorner(mainContentCard, 14)
addStroke(mainContentCard, Color3.fromRGB(45, 55, 72), 1.5)

local SIDEBAR_TABS = {
	{ id = "PLAY", label = "⚔️  Play" },
	{ id = "QUEST", label = "📜  เควส", badge = "!" },
	{ id = "DECK", label = "🃏  Deck Builder" },
	{ id = "COLLECTION", label = "📚  Collection" },
	{ id = "SHOP", label = "🛒  Shop" },
	{ id = "PACK", label = "📦  Open Pack", badge = "FREE" },
	{ id = "PVP_ROOM", label = "🔑  PvP Room" },
	{ id = "FRIENDS", label = "👋  เพื่อน" },
	{ id = "GUILD", label = "🛡️  กิลด์" },
	{ id = "STATS", label = "📊  สถิติ" },
	{ id = "RANKED", label = "🏆  Ranked" },
	{ id = "STYLE", label = "🎨  Style" },
	{ id = "AFK", label = "💤  ห้อง AFK" },
	{ id = "PROFILE", label = "👤  โปรไฟล์" },
	{ id = "HOWTO", label = "📖  How to play" },
	{ id = "SETTINGS", label = "⚙️  ตั้งค่า" },
}

local sidebarBtnMap = {}
local renderActiveHubTab -- forward declaration

for _, tabInfo in ipairs(SIDEBAR_TABS) do
	local b = Instance.new("TextButton")
	b.Size = UDim2.new(1, -8, 0, 38)
	b.BackgroundColor3 = Color3.fromRGB(30, 35, 48)
	b.Font = Enum.Font.GothamBold
	b.TextSize = 14
	b.TextColor3 = Color3.fromRGB(226, 232, 240)
	b.TextXAlignment = Enum.TextXAlignment.Left
	b.Text = "    " .. tabInfo.label
	b.ZIndex = 27
	b.Parent = leftSidebar
	addCorner(b, 9)
	local st = addStroke(b, Color3.fromRGB(51, 65, 85), 1.2)

	if tabInfo.badge then
		local dot = Instance.new("TextLabel")
		dot.Size = UDim2.fromOffset(tabInfo.badge == "FREE" and 42 or 20, 20)
		dot.Position = UDim2.new(1, tabInfo.badge == "FREE" and -48 or -26, 0.5, -10)
		dot.BackgroundColor3 = Color3.fromRGB(239, 68, 68)
		dot.Font = Enum.Font.GothamBlack
		dot.TextSize = 10
		dot.TextColor3 = Color3.fromRGB(255, 255, 255)
		dot.Text = tabInfo.badge
		dot.ZIndex = 28
		dot.Parent = b
		addCorner(dot, 10)
	end

	sidebarBtnMap[tabInfo.id] = { btn = b, stroke = st }
	b.MouseButton1Click:Connect(function()
		currentSidebarTab = tabInfo.id
		renderActiveHubTab()
	end)
end

-- ==================== หน้าต่างแก้ไขการ์ดในเด็ค 20 ใบ (Deck Editor Sub-Modal) ====================
local editingSlotIndex = 1
local editingLeaderId = "L01"
local editingDeckName = "เด็คจิต"
local editingMainDeck = CardDatabase.getDefaultDeck("L01")

local deckEditorOverlay = Instance.new("Frame")
deckEditorOverlay.Size = UDim2.fromScale(1, 1)
deckEditorOverlay.BackgroundColor3 = Color3.fromRGB(2, 6, 23)
deckEditorOverlay.BackgroundTransparency = 0.25
deckEditorOverlay.Visible = false
deckEditorOverlay.ZIndex = 70
deckEditorOverlay.Parent = screenGui

local deckEditorBox = Instance.new("Frame")
deckEditorBox.Size = UDim2.fromOffset(920, 560)
deckEditorBox.AnchorPoint = Vector2.new(0.5, 0.5)
deckEditorBox.Position = UDim2.fromScale(0.5, 0.5)
deckEditorBox.BackgroundColor3 = Color3.fromRGB(18, 22, 32)
deckEditorBox.ZIndex = 71
deckEditorBox.Parent = deckEditorOverlay
addCorner(deckEditorBox, 16)
addStroke(deckEditorBox, Color3.fromRGB(250, 204, 21), 2)

local deHeaderTitle = Instance.new("TextLabel")
deHeaderTitle.Size = UDim2.new(0.55, 0, 0, 36)
deHeaderTitle.Position = UDim2.fromOffset(20, 12)
deHeaderTitle.BackgroundTransparency = 1
deHeaderTitle.Font = Enum.Font.GothamBlack
deHeaderTitle.TextSize = 19
deHeaderTitle.TextColor3 = Color3.fromRGB(250, 204, 21)
deHeaderTitle.TextXAlignment = Enum.TextXAlignment.Left
deHeaderTitle.Text = "🃏 แก้ไขเด็ค (คลิกซ้ายเพิ่ม/นำออก • คลิกขวาดูรายละเอียด)"
deHeaderTitle.ZIndex = 72
deHeaderTitle.Parent = deckEditorBox

local deLeaderRow = Instance.new("Frame")
deLeaderRow.Size = UDim2.new(0.62, -20, 0, 34)
deLeaderRow.Position = UDim2.fromOffset(20, 50)
deLeaderRow.BackgroundTransparency = 1
deLeaderRow.ZIndex = 72
deLeaderRow.Parent = deckEditorBox

local deCountBadge = Instance.new("TextLabel")
deCountBadge.Size = UDim2.fromOffset(145, 34)
deCountBadge.Position = UDim2.new(1, -395, 0, 14)
deCountBadge.BackgroundColor3 = Color3.fromRGB(30, 41, 59)
deCountBadge.Font = Enum.Font.GothamBlack
deCountBadge.TextSize = 14
deCountBadge.TextColor3 = Color3.fromRGB(74, 222, 128)
deCountBadge.ZIndex = 72
deCountBadge.Parent = deckEditorBox
addCorner(deCountBadge, 8)

local deAutoFillBtn = Instance.new("TextButton")
deAutoFillBtn.Size = UDim2.fromOffset(115, 34)
deAutoFillBtn.Position = UDim2.new(1, -242, 0, 14)
deAutoFillBtn.BackgroundColor3 = Color3.fromRGB(2, 132, 199)
deAutoFillBtn.Font = Enum.Font.GothamBold
deAutoFillBtn.TextSize = 12
deAutoFillBtn.TextColor3 = Color3.fromRGB(255, 255, 255)
deAutoFillBtn.Text = "⚡ โหลดเด็คแนะนำ"
deAutoFillBtn.ZIndex = 72
deAutoFillBtn.Parent = deckEditorBox
addCorner(deAutoFillBtn, 8)

local deSaveBtn = Instance.new("TextButton")
deSaveBtn.Size = UDim2.fromOffset(105, 34)
deSaveBtn.Position = UDim2.new(1, -120, 0, 14)
deSaveBtn.BackgroundColor3 = Color3.fromRGB(22, 163, 74)
deSaveBtn.Font = Enum.Font.GothamBlack
deSaveBtn.TextSize = 13
deSaveBtn.TextColor3 = Color3.fromRGB(255, 255, 255)
deSaveBtn.Text = "💾 บันทึก"
deSaveBtn.ZIndex = 72
deSaveBtn.Parent = deckEditorBox
addCorner(deSaveBtn, 8)

local deCatalogScroll = Instance.new("ScrollingFrame")
deCatalogScroll.Size = UDim2.new(0.64, -24, 1, -102)
deCatalogScroll.Position = UDim2.fromOffset(16, 90)
deCatalogScroll.BackgroundColor3 = Color3.fromRGB(11, 15, 25)
deCatalogScroll.BorderSizePixel = 0
deCatalogScroll.ScrollBarThickness = 6
deCatalogScroll.AutomaticCanvasSize = Enum.AutomaticSize.Y
deCatalogScroll.CanvasSize = UDim2.new(0, 0, 0, 0)
deCatalogScroll.ZIndex = 72
deCatalogScroll.Parent = deckEditorBox
addCorner(deCatalogScroll, 10)

local deCatalogGrid = Instance.new("UIGridLayout")
deCatalogGrid.CellSize = UDim2.fromOffset(106, 150)
deCatalogGrid.CellPadding = UDim2.fromOffset(8, 8)
deCatalogGrid.Parent = deCatalogScroll

local deDeckListScroll = Instance.new("ScrollingFrame")
deDeckListScroll.Size = UDim2.new(0.36, -20, 1, -102)
deDeckListScroll.Position = UDim2.new(0.64, 4, 0, 90)
deDeckListScroll.BackgroundColor3 = Color3.fromRGB(11, 15, 25)
deDeckListScroll.BorderSizePixel = 0
deDeckListScroll.ScrollBarThickness = 6
deDeckListScroll.AutomaticCanvasSize = Enum.AutomaticSize.Y
deDeckListScroll.CanvasSize = UDim2.new(0, 0, 0, 0)
deDeckListScroll.ZIndex = 72
deDeckListScroll.Parent = deckEditorBox
addCorner(deDeckListScroll, 10)

local deDeckListLayout = Instance.new("UIListLayout")
deDeckListLayout.Padding = UDim.new(0, 4)
deDeckListLayout.Parent = deDeckListScroll

local function refreshDeckEditorModal()
	clearGuiChildren(deLeaderRow)
	clearGuiChildren(deCatalogScroll)
	clearGuiChildren(deDeckListScroll)

	deHeaderTitle.Text = string.format("🃏 แก้ไขเด็ค: %s (สล็อต #%d)", editingDeckName, editingSlotIndex)
	deCountBadge.Text = string.format("การ์ด: %d / 20 ใบ", #editingMainDeck)
	deCountBadge.TextColor3 = (#editingMainDeck == 20) and Color3.fromRGB(74, 222, 128) or Color3.fromRGB(250, 204, 21)

	local leaders = { "L01", "L02", "L03", "L04" }
	for i, lid in ipairs(leaders) do
		local meta = CardDatabase.DECK_METADATA[lid]
		local b = Instance.new("TextButton")
		b.Size = UDim2.new(0.24, -4, 1, 0)
		b.Position = UDim2.new((i - 1) * 0.25, 0, 0, 0)
		b.BackgroundColor3 = (editingLeaderId == lid) and Color3.fromRGB(217, 119, 6) or Color3.fromRGB(30, 41, 59)
		b.Font = Enum.Font.GothamBold
		b.TextSize = 12
		b.TextColor3 = Color3.fromRGB(255, 255, 255)
		b.Text = meta and meta.title or lid
		b.ZIndex = 73
		b.Parent = deLeaderRow
		addCorner(b, 7)
		b.MouseButton1Click:Connect(function()
			editingLeaderId = lid
			refreshDeckEditorModal()
		end)
		b.MouseButton2Click:Connect(function()
			openCardInspectModal(CardDatabase.getCardById(lid))
		end)
	end

	local counts = {}
	for _, cid in ipairs(editingMainDeck) do
		counts[cid] = (counts[cid] or 0) + 1
	end

	for _, card in ipairs(CardDatabase.CARDS) do
		if card.type ~= "Leader" then
			local used = counts[card.id] or 0
			local maxCopies = card.maxCopies or 2
			local w = createCardWidget(card, {
				width = 106,
				height = 150,
				zoneBadge = string.format("%d / %d ใบ", used, maxCopies),
				onLeftClick = function()
					if #editingMainDeck >= 20 then
						showToast("เด็คครบ 20 ใบแล้ว! คลิกที่รายการฝั่งขวาเพื่อนำออกก่อน")
						return
					end
					if used >= maxCopies then
						showToast(string.format('ใส่ "%s" ได้สูงสุด %d ใบ!', card.name, maxCopies))
						return
					end
					table.insert(editingMainDeck, card.id)
					refreshDeckEditorModal()
				end,
			})
			w.ZIndex = 73
			w.Parent = deCatalogScroll
		end
	end

	for idx, cid in ipairs(editingMainDeck) do
		local c = CardDatabase.getCardById(cid)
		if c then
			local row = Instance.new("TextButton")
			row.Size = UDim2.new(1, -10, 0, 28)
			row.BackgroundColor3 = Color3.fromRGB(30, 41, 59)
			row.Font = Enum.Font.GothamBold
			row.TextSize = 12
			row.TextColor3 = Color3.fromRGB(241, 245, 249)
			row.TextXAlignment = Enum.TextXAlignment.Left
			row.Text = string.format("  %d. [%s] %s  (คลิกเพื่อนำออก)", idx, c.id, c.name)
			row.ZIndex = 73
			row.Parent = deDeckListScroll
			addCorner(row, 6)
			row.MouseButton1Click:Connect(function()
				table.remove(editingMainDeck, idx)
				refreshDeckEditorModal()
			end)
			row.MouseButton2Click:Connect(function()
				openCardInspectModal(c)
			end)
		end
	end
end

deAutoFillBtn.MouseButton1Click:Connect(function()
	local def = CardDatabase.getDefaultDeck(editingLeaderId)
	editingMainDeck = {}
	for i, v in ipairs(def) do
		editingMainDeck[i] = v
	end
	refreshDeckEditorModal()
end)

deSaveBtn.MouseButton1Click:Connect(function()
	if #editingMainDeck ~= 20 then
		showToast("กรุณาจัดเด็คให้ครบ 20 ใบพอดี! (หรือกดปุ่ม 'โหลดเด็คแนะนำ')")
		return
	end
	deckEditorOverlay.Visible = false
	DuelActionEvent:FireServer({
		action = "SAVE_DECK",
		slotIndex = editingSlotIndex,
		leaderId = editingLeaderId,
		deckName = editingDeckName,
		mainDeck = editingMainDeck,
	})
end)

-- ==================== หน้าต่างแสดงผลสุ่มการ์ดจากซอง (Pack Opening Result Modal) ====================
local packResultOverlay = Instance.new("Frame")
packResultOverlay.Size = UDim2.fromScale(1, 1)
packResultOverlay.BackgroundColor3 = Color3.fromRGB(2, 6, 23)
packResultOverlay.BackgroundTransparency = 0.2
packResultOverlay.Visible = false
packResultOverlay.ZIndex = 82
packResultOverlay.Parent = screenGui

local packResultBox = Instance.new("Frame")
packResultBox.Size = UDim2.fromOffset(780, 460)
packResultBox.AnchorPoint = Vector2.new(0.5, 0.5)
packResultBox.Position = UDim2.fromScale(0.5, 0.5)
packResultBox.BackgroundColor3 = Color3.fromRGB(18, 22, 32)
packResultBox.ZIndex = 83
packResultBox.Parent = packResultOverlay
addCorner(packResultBox, 16)
addStroke(packResultBox, Color3.fromRGB(250, 204, 21), 2.5)

local packResultTitle = Instance.new("TextLabel")
packResultTitle.Size = UDim2.new(1, -32, 0, 38)
packResultTitle.Position = UDim2.fromOffset(16, 12)
packResultTitle.BackgroundTransparency = 1
packResultTitle.Font = Enum.Font.GothamBlack
packResultTitle.TextSize = 22
packResultTitle.TextColor3 = Color3.fromRGB(254, 240, 138)
packResultTitle.Text = "🎉 เปิดซองสุ่มการ์ดสำเร็จ! (คลิกขวาที่การ์ดเพื่อดูรายละเอียด)"
packResultTitle.ZIndex = 84
packResultTitle.Parent = packResultBox

local packResultScroll = Instance.new("ScrollingFrame")
packResultScroll.Size = UDim2.new(1, -32, 1, -116)
packResultScroll.Position = UDim2.fromOffset(16, 54)
packResultScroll.BackgroundColor3 = Color3.fromRGB(11, 15, 25)
packResultScroll.BorderSizePixel = 0
packResultScroll.ScrollBarThickness = 6
packResultScroll.AutomaticCanvasSize = Enum.AutomaticSize.Y
packResultScroll.CanvasSize = UDim2.new(0, 0, 0, 0)
packResultScroll.ZIndex = 84
packResultScroll.Parent = packResultBox
addCorner(packResultScroll, 10)

local packResultGrid = Instance.new("UIGridLayout")
packResultGrid.CellSize = UDim2.fromOffset(122, 172)
packResultGrid.CellPadding = UDim2.fromOffset(12, 12)
packResultGrid.HorizontalAlignment = Enum.HorizontalAlignment.Center
packResultGrid.Parent = packResultScroll

local packResultCloseBtn = Instance.new("TextButton")
packResultCloseBtn.Size = UDim2.fromOffset(220, 42)
packResultCloseBtn.AnchorPoint = Vector2.new(0.5, 0)
packResultCloseBtn.Position = UDim2.new(0.5, 0, 1, -52)
packResultCloseBtn.BackgroundColor3 = Color3.fromRGB(22, 163, 74)
packResultCloseBtn.Font = Enum.Font.GothamBlack
packResultCloseBtn.TextSize = 16
packResultCloseBtn.TextColor3 = Color3.fromRGB(255, 255, 255)
packResultCloseBtn.Text = "✅ เก็บเข้าคลังการ์ด"
packResultCloseBtn.ZIndex = 84
packResultCloseBtn.Parent = packResultBox
addCorner(packResultCloseBtn, 10)
packResultCloseBtn.MouseButton1Click:Connect(function()
	packResultOverlay.Visible = false
end)

local function showPackOpenedModal(pulledList)
	clearGuiChildren(packResultScroll)
	for _, item in ipairs(pulledList or {}) do
		local c = CardDatabase.getCardById(item.id)
		if c then
			local w = createCardWidget(c, {
				width = 122,
				height = 172,
				foilOverride = item.foil,
				zoneBadge = item.foil ~= "Normal" and ("✨ " .. item.foil .. "!") or nil,
				onLeftClick = function()
					openCardInspectModal(c)
				end,
			})
			w.ZIndex = 85
			w.Parent = packResultScroll
		end
	end
	packResultOverlay.Visible = true
end

-- ==================== ฟังก์ชันวาดเนื้อหาทั้ง 16 แท็บในหน้าจอ Hub (เหมือนในคลิป BuddyTime!) ====================
local function createSectionTitle(parent: Instance, titleText: string, subtitleText: string)
	local title = Instance.new("TextLabel")
	title.Size = UDim2.new(1, -40, 0, 32)
	title.Position = UDim2.fromOffset(22, 16)
	title.BackgroundTransparency = 1
	title.Font = Enum.Font.GothamBlack
	title.TextSize = 24
	title.TextColor3 = Color3.fromRGB(250, 204, 21)
	title.TextXAlignment = Enum.TextXAlignment.Left
	title.Text = titleText
	title.ZIndex = 27
	title.Parent = parent

	local sub = Instance.new("TextLabel")
	sub.Size = UDim2.new(1, -40, 0, 20)
	sub.Position = UDim2.fromOffset(22, 48)
	sub.BackgroundTransparency = 1
	sub.Font = Enum.Font.GothamMedium
	sub.TextSize = 13
	sub.TextColor3 = Color3.fromRGB(148, 163, 184)
	sub.TextXAlignment = Enum.TextXAlignment.Left
	sub.Text = subtitleText
	sub.ZIndex = 27
	sub.Parent = parent
end

renderActiveHubTab = function()
	-- อัปเดตเหรียญและตั๋วบน Header
	coinsTextLabel.Text = "🪙 " .. formatCommaNumber(myProfile.coins or 29990)
	packTicketLabel.Text = "🎟️ ตั๋วซองฟรี: " .. tostring(myProfile.freePacks or 0)
	mapChallengeToggleBtn.Text = myProfile.duelRequestOpen and "⚔️ ชวนดวล : เปิด" or "🚫 ชวนดวล : ปิด"
	mapChallengeToggleBtn.BackgroundColor3 = myProfile.duelRequestOpen and Color3.fromRGB(22, 163, 74) or Color3.fromRGB(71, 85, 105)

	-- ไฮไลต์ปุ่ม Sidebar ที่เลือกอยู่เป็นสีทองเหมือนในคลิป!
	for tabId, entry in pairs(sidebarBtnMap) do
		local isAct = (tabId == currentSidebarTab)
		entry.btn.BackgroundColor3 = isAct and Color3.fromRGB(217, 119, 6) or Color3.fromRGB(30, 35, 48)
		entry.btn.TextColor3 = isAct and Color3.fromRGB(15, 23, 42) or Color3.fromRGB(226, 232, 240)
		entry.stroke.Color = isAct and Color3.fromRGB(253, 224, 71) or Color3.fromRGB(51, 65, 85)
	end

	clearGuiChildren(mainContentCard)

	local activeSlot = myProfile.deckSlots[myProfile.activeSlotIndex] or myProfile.deckSlots[1]
	local activeLeader = CardDatabase.getCardById(activeSlot.leaderId) or CardDatabase.getCardById("L01")
	local activeMeta = CardDatabase.DECK_METADATA[activeSlot.leaderId] or CardDatabase.DECK_METADATA.L01

	-- =========================================================================
	-- แท็บที่ 1: ⚔️ PLAY (เข้าสู่การต่อสู้ — เหมือนวินาทีที่ 00:00 - 00:31 ในคลิป!)
	-- =========================================================================
	if currentSidebarTab == "PLAY" then
		createSectionTitle(mainContentCard, "เข้าสู่การต่อสู้", "เลือกเด็คแล้วเริ่มสู้ได้เลย — เด็คจิต / เด็คขุนเหนือ / เด็ควันสิ้นโลก / เด็คไดโน")

		-- กล่องแสดงเด็คที่ใช้อยู่ + ป้ายแรงก์ Master ★ 56
		local activeDeckBox = Instance.new("Frame")
		activeDeckBox.Size = UDim2.new(1, -44, 0, 86)
		activeDeckBox.Position = UDim2.fromOffset(22, 78)
		activeDeckBox.BackgroundColor3 = Color3.fromRGB(28, 34, 48)
		activeDeckBox.ZIndex = 27
		activeDeckBox.Parent = mainContentCard
		addCorner(activeDeckBox, 12)
		addStroke(activeDeckBox, Color3.fromRGB(63, 76, 102), 1.5)

		local tagTop = Instance.new("TextLabel")
		tagTop.Size = UDim2.fromOffset(120, 18)
		tagTop.Position = UDim2.fromOffset(16, 10)
		tagTop.BackgroundTransparency = 1
		tagTop.Font = Enum.Font.GothamBold
		tagTop.TextSize = 12
		tagTop.TextColor3 = Color3.fromRGB(148, 163, 184)
		tagTop.TextXAlignment = Enum.TextXAlignment.Left
		tagTop.Text = "เด็คที่ใช้อยู่"
		tagTop.ZIndex = 28
		tagTop.Parent = activeDeckBox

		local deckNameBig = Instance.new("TextLabel")
		deckNameBig.Size = UDim2.new(0.6, 0, 0, 28)
		deckNameBig.Position = UDim2.fromOffset(16, 28)
		deckNameBig.BackgroundTransparency = 1
		deckNameBig.Font = Enum.Font.GothamBlack
		deckNameBig.TextSize = 21
		deckNameBig.TextColor3 = Color3.fromRGB(255, 255, 255)
		deckNameBig.TextXAlignment = Enum.TextXAlignment.Left
		deckNameBig.Text = activeSlot.name
		deckNameBig.ZIndex = 28
		deckNameBig.Parent = activeDeckBox

		local deckSubMeta = Instance.new("TextLabel")
		deckSubMeta.Size = UDim2.new(0.7, 0, 0, 20)
		deckSubMeta.Position = UDim2.fromOffset(16, 56)
		deckSubMeta.BackgroundTransparency = 1
		deckSubMeta.Font = Enum.Font.GothamBold
		deckSubMeta.TextSize = 13
		deckSubMeta.TextColor3 = hexToColor3(activeMeta.color)
		deckSubMeta.TextXAlignment = Enum.TextXAlignment.Left
		deckSubMeta.Text = string.format("🚩 %s • 20 ใบ • Leader : %s (คลิกขวาดูการ์ด)", activeMeta.name, activeLeader.name)
		deckSubMeta.ZIndex = 28
		deckSubMeta.Parent = activeDeckBox

		local rankBadge = Instance.new("TextLabel")
		rankBadge.Size = UDim2.fromOffset(138, 30)
		rankBadge.Position = UDim2.new(1, -154, 0, 14)
		rankBadge.BackgroundColor3 = Color3.fromRGB(88, 28, 135)
		rankBadge.Font = Enum.Font.GothamBlack
		rankBadge.TextSize = 13
		rankBadge.TextColor3 = Color3.fromRGB(250, 204, 21)
		rankBadge.Text = string.format("👑 %s ★ %d", myProfile.rankTier or "Master", myProfile.rankStars or 56)
		rankBadge.ZIndex = 28
		rankBadge.Parent = activeDeckBox
		addCorner(rankBadge, 8)
		addStroke(rankBadge, Color3.fromRGB(192, 132, 252), 1.2)

		-- แถบสลับเด็คด่วนทั้ง 4 สล็อต
		local quickDeckRow = Instance.new("Frame")
		quickDeckRow.Size = UDim2.fromOffset(380, 28)
		quickDeckRow.Position = UDim2.new(1, -396, 0, 50)
		quickDeckRow.BackgroundTransparency = 1
		quickDeckRow.ZIndex = 28
		quickDeckRow.Parent = activeDeckBox

		for idx = 1, math.min(4, #myProfile.deckSlots) do
			local sl = myProfile.deckSlots[idx]
			local qb = Instance.new("TextButton")
			qb.Size = UDim2.new(0.24, -4, 1, 0)
			qb.Position = UDim2.new((idx - 1) * 0.25, 0, 0, 0)
			qb.BackgroundColor3 = (idx == myProfile.activeSlotIndex) and Color3.fromRGB(217, 119, 6) or Color3.fromRGB(15, 23, 42)
			qb.Font = Enum.Font.GothamBold
			qb.TextSize = 11
			qb.TextColor3 = Color3.fromRGB(255, 255, 255)
			qb.Text = sl.name
			qb.TextTruncate = Enum.TextTruncate.AtEnd
			qb.ZIndex = 29
			qb.Parent = quickDeckRow
			addCorner(qb, 6)
			qb.MouseButton1Click:Connect(function()
				DuelActionEvent:FireServer({ action = "SELECT_DECK_SLOT", slotIndex = idx })
			end)
			qb.MouseButton2Click:Connect(function()
				openCardInspectModal(CardDatabase.getCardById(sl.leaderId))
			end)
		end

		-- ปุ่มใหญ่ 3 ปุ่มเรียงกัน (เหมือนในคลิป 00:14!): ฝึกซ้อมกับบอท | หาคู่ต่อสู้ | เล่นกับเพื่อน
		local bigButtonsRow = Instance.new("Frame")
		bigButtonsRow.Size = UDim2.new(1, -44, 0, 48)
		bigButtonsRow.Position = UDim2.fromOffset(22, 176)
		bigButtonsRow.BackgroundTransparency = 1
		bigButtonsRow.ZIndex = 27
		bigButtonsRow.Parent = mainContentCard

		local btnTrainBot = Instance.new("TextButton")
		btnTrainBot.Size = UDim2.new(0.325, 0, 1, 0)
		btnTrainBot.BackgroundColor3 = Color3.fromRGB(217, 119, 6)
		btnTrainBot.Font = Enum.Font.GothamBlack
		btnTrainBot.TextSize = 16
		btnTrainBot.TextColor3 = Color3.fromRGB(15, 23, 42)
		btnTrainBot.Text = "🤖 ฝึกซ้อมกับบอท"
		btnTrainBot.ZIndex = 28
		btnTrainBot.Parent = bigButtonsRow
		addCorner(btnTrainBot, 10)
		btnTrainBot.MouseButton1Click:Connect(function()
			hubScreen.Visible = false
			DuelActionEvent:FireServer({
				action = "START_BOT_MATCH",
				difficulty = selectedAiDiff,
				aiLeaderId = selectedAiLeader,
			})
		end)

		local btnQuickMatch = Instance.new("TextButton")
		btnQuickMatch.Size = UDim2.new(0.325, 0, 1, 0)
		btnQuickMatch.Position = UDim2.fromScale(0.3375, 0)
		btnQuickMatch.BackgroundColor3 = Color3.fromRGB(37, 99, 235)
		btnQuickMatch.Font = Enum.Font.GothamBlack
		btnQuickMatch.TextSize = 16
		btnQuickMatch.TextColor3 = Color3.fromRGB(255, 255, 255)
		btnQuickMatch.Text = "⚔️ หาคู่ต่อสู้ (Ranked)"
		btnQuickMatch.ZIndex = 28
		btnQuickMatch.Parent = bigButtonsRow
		addCorner(btnQuickMatch, 10)
		btnQuickMatch.MouseButton1Click:Connect(function()
			hubScreen.Visible = false
			DuelActionEvent:FireServer({ action = "QUICK_MATCH" })
		end)

		local btnPlayFriend = Instance.new("TextButton")
		btnPlayFriend.Size = UDim2.new(0.325, 0, 1, 0)
		btnPlayFriend.Position = UDim2.fromScale(0.675, 0)
		btnPlayFriend.BackgroundColor3 = Color3.fromRGB(45, 55, 72)
		btnPlayFriend.Font = Enum.Font.GothamBlack
		btnPlayFriend.TextSize = 16
		btnPlayFriend.TextColor3 = Color3.fromRGB(255, 255, 255)
		btnPlayFriend.Text = "👥 เล่นกับเพื่อน"
		btnPlayFriend.ZIndex = 28
		btnPlayFriend.Parent = bigButtonsRow
		addCorner(btnPlayFriend, 10)
		btnPlayFriend.MouseButton1Click:Connect(function()
			currentSidebarTab = "PVP_ROOM"
			renderActiveHubTab()
		end)

		-- กล่องตั้งค่าความยากบอท & โหมดซ้อม (เหมือนในคลิป 00:16 - 00:31!)
		local botConfigCard = Instance.new("Frame")
		botConfigCard.Size = UDim2.new(1, -44, 0, 145)
		botConfigCard.Position = UDim2.fromOffset(22, 236)
		botConfigCard.BackgroundColor3 = Color3.fromRGB(28, 34, 48)
		botConfigCard.ZIndex = 27
		botConfigCard.Parent = mainContentCard
		addCorner(botConfigCard, 12)
		addStroke(botConfigCard, Color3.fromRGB(51, 65, 85), 1.2)

		local diffTitle = Instance.new("TextLabel")
		diffTitle.Size = UDim2.fromOffset(120, 28)
		diffTitle.Position = UDim2.fromOffset(16, 12)
		diffTitle.BackgroundTransparency = 1
		diffTitle.Font = Enum.Font.GothamBold
		diffTitle.TextSize = 13
		diffTitle.TextColor3 = Color3.fromRGB(203, 213, 225)
		diffTitle.TextXAlignment = Enum.TextXAlignment.Left
		diffTitle.Text = "ความยากของบอท :"
		diffTitle.ZIndex = 28
		diffTitle.Parent = botConfigCard

		local diffPills = {
			{ id = "EASY", label = "🟢 ง่าย", col = Color3.fromRGB(22, 163, 74) },
			{ id = "MEDIUM", label = "🟡 ปกติ", col = Color3.fromRGB(202, 138, 4) },
			{ id = "HARD", label = "🔴 ยาก", col = Color3.fromRGB(220, 38, 38) },
		}
		for i, dp in ipairs(diffPills) do
			local b = Instance.new("TextButton")
			b.Size = UDim2.fromOffset(82, 28)
			b.Position = UDim2.fromOffset(132 + (i - 1) * 90, 12)
			b.BackgroundColor3 = (selectedAiDiff == dp.id) and dp.col or Color3.fromRGB(15, 23, 42)
			b.Font = Enum.Font.GothamBold
			b.TextSize = 12
			b.TextColor3 = Color3.fromRGB(255, 255, 255)
			b.Text = dp.label
			b.ZIndex = 28
			b.Parent = botConfigCard
			addCorner(b, 14)
			b.MouseButton1Click:Connect(function()
				selectedAiDiff = dp.id
				renderActiveHubTab()
			end)
		end

		local aiDeckLabel = Instance.new("TextLabel")
		aiDeckLabel.Size = UDim2.fromOffset(120, 28)
		aiDeckLabel.Position = UDim2.fromOffset(16, 50)
		aiDeckLabel.BackgroundTransparency = 1
		aiDeckLabel.Font = Enum.Font.GothamBold
		aiDeckLabel.TextSize = 13
		aiDeckLabel.TextColor3 = Color3.fromRGB(203, 213, 225)
		aiDeckLabel.TextXAlignment = Enum.TextXAlignment.Left
		aiDeckLabel.Text = "เด็คคู่ต่อสู้ AI :"
		aiDeckLabel.ZIndex = 28
		aiDeckLabel.Parent = botConfigCard

		local aiDeckOpts = {
			{ id = "RANDOM", label = "🎲 สุ่มเด็ค" },
			{ id = "L01", label = "🔥 เด็คจิต" },
			{ id = "L02", label = "⚔️ ขุนเหนือ" },
			{ id = "L03", label = "🌌 วันสิ้นโลก" },
			{ id = "L04", label = "🦖 ไดโน" },
		}
		for i, opt in ipairs(aiDeckOpts) do
			local b = Instance.new("TextButton")
			b.Size = UDim2.fromOffset(96, 28)
			b.Position = UDim2.fromOffset(132 + (i - 1) * 102, 50)
			b.BackgroundColor3 = (selectedAiLeader == opt.id) and Color3.fromRGB(13, 148, 136) or Color3.fromRGB(15, 23, 42)
			b.Font = Enum.Font.GothamBold
			b.TextSize = 12
			b.TextColor3 = Color3.fromRGB(255, 255, 255)
			b.Text = opt.label
			b.ZIndex = 28
			b.Parent = botConfigCard
			addCorner(b, 8)
			b.MouseButton1Click:Connect(function()
				selectedAiLeader = opt.id
				renderActiveHubTab()
			end)
		end

		-- ปุ่ม ซ้อมคนเดียว / สนามซ้อม / ตั้งค่าเกม / เดินเข้าแมพ (เหมือนในคลิป 00:31!)
		local soloPracticeBtn = Instance.new("TextButton")
		soloPracticeBtn.Size = UDim2.fromOffset(130, 32)
		soloPracticeBtn.Position = UDim2.fromOffset(16, 94)
		soloPracticeBtn.BackgroundColor3 = Color3.fromRGB(15, 118, 110)
		soloPracticeBtn.Font = Enum.Font.GothamBold
		soloPracticeBtn.TextSize = 13
		soloPracticeBtn.TextColor3 = Color3.fromRGB(255, 255, 255)
		soloPracticeBtn.Text = "🎯 ซ้อมคนเดียว"
		soloPracticeBtn.ZIndex = 28
		soloPracticeBtn.Parent = botConfigCard
		addCorner(soloPracticeBtn, 8)
		soloPracticeBtn.MouseButton1Click:Connect(function()
			hubScreen.Visible = false
			DuelActionEvent:FireServer({ action = "START_BOT_MATCH", difficulty = "EASY", aiLeaderId = selectedAiLeader })
		end)

		local openSettingsQuickBtn = Instance.new("TextButton")
		openSettingsQuickBtn.Size = UDim2.fromOffset(125, 32)
		openSettingsQuickBtn.Position = UDim2.fromOffset(156, 94)
		openSettingsQuickBtn.BackgroundColor3 = Color3.fromRGB(51, 65, 85)
		openSettingsQuickBtn.Font = Enum.Font.GothamBold
		openSettingsQuickBtn.TextSize = 13
		openSettingsQuickBtn.TextColor3 = Color3.fromRGB(255, 255, 255)
		openSettingsQuickBtn.Text = "⚙️ ตั้งค่าเกม"
		openSettingsQuickBtn.ZIndex = 28
		openSettingsQuickBtn.Parent = botConfigCard
		addCorner(openSettingsQuickBtn, 8)
		openSettingsQuickBtn.MouseButton1Click:Connect(function()
			currentSidebarTab = "SETTINGS"
			renderActiveHubTab()
		end)

		local walkIntoMapBtn = Instance.new("TextButton")
		walkIntoMapBtn.Size = UDim2.fromOffset(145, 32)
		walkIntoMapBtn.Position = UDim2.fromOffset(291, 94)
		walkIntoMapBtn.BackgroundColor3 = Color3.fromRGB(22, 163, 74)
		walkIntoMapBtn.Font = Enum.Font.GothamBlack
		walkIntoMapBtn.TextSize = 13
		walkIntoMapBtn.TextColor3 = Color3.fromRGB(255, 255, 255)
		walkIntoMapBtn.Text = "🏃 เดินเข้าแมพ (3D)"
		walkIntoMapBtn.ZIndex = 28
		walkIntoMapBtn.Parent = botConfigCard
		addCorner(walkIntoMapBtn, 8)
		walkIntoMapBtn.MouseButton1Click:Connect(function()
			hubScreen.Visible = false
			mapFloatingBar.Visible = true
		end)

		-- กล่องสถิติผู้เล่นด้านล่าง (เหมือนในคลิป 00:30)
		local summaryBox = Instance.new("Frame")
		summaryBox.Size = UDim2.new(1, -44, 0, 82)
		summaryBox.Position = UDim2.fromOffset(22, 392)
		summaryBox.BackgroundColor3 = Color3.fromRGB(15, 20, 30)
		summaryBox.ZIndex = 27
		summaryBox.Parent = mainContentCard
		addCorner(summaryBox, 10)
		addStroke(summaryBox, Color3.fromRGB(45, 55, 72), 1)

		local summaryText = Instance.new("TextLabel")
		summaryText.Size = UDim2.new(1, -24, 1, -16)
		summaryText.Position = UDim2.fromOffset(12, 8)
		summaryText.BackgroundTransparency = 1
		summaryText.Font = Enum.Font.GothamMedium
		summaryText.TextSize = 13
		summaryText.TextColor3 = Color3.fromRGB(148, 163, 184)
		summaryText.TextXAlignment = Enum.TextXAlignment.Left
		summaryText.TextWrapped = true
		summaryText.Text = string.format(
			"📊 สถิติของคุณ — ชนะ : %d  •  แพ้ : %d  •  เปิดซองสะสม : %d ซอง\nคลังการ์ด : ครบทั้ง 48 ใบ (4 เผ่า)  |  โค้ดแจกฟรี : BOF2026 , FRIEND999 , DINO5000 (กดปุ่ม 🎁 Code! ด้านบน)",
			myProfile.wins or 12,
			myProfile.losses or 3,
			myProfile.packsOpened or 4
		)
		summaryText.ZIndex = 28
		summaryText.Parent = summaryBox

	-- =========================================================================
	-- แท็บที่ 2: 📜 เควส (รายวัน / Side Quest — เหมือนวินาทีที่ 00:40 - 00:51!)
	-- =========================================================================
	elseif currentSidebarTab == "QUEST" then
		createSectionTitle(mainContentCard, "เควสภารกิจ", "ทำภารกิจรายวันและ Side Quest เพื่อรับเหรียญทองและตั๋วสุ่มซองฟรี!")

		local qScroll = Instance.new("ScrollingFrame")
		qScroll.Size = UDim2.new(1, -44, 1, -92)
		qScroll.Position = UDim2.fromOffset(22, 78)
		qScroll.BackgroundTransparency = 1
		qScroll.BorderSizePixel = 0
		qScroll.ScrollBarThickness = 5
		qScroll.AutomaticCanvasSize = Enum.AutomaticSize.Y
		qScroll.CanvasSize = UDim2.new(0, 0, 0, 0)
		qScroll.ZIndex = 27
		qScroll.Parent = mainContentCard

		local qLayout = Instance.new("UIListLayout")
		qLayout.Padding = UDim.new(0, 10)
		qLayout.Parent = qScroll

		local questList = myProfile.quests
		if not questList or #questList == 0 then
			questList = {
				{ id = "q_play_1", title = "ประเดิมสนามดวล 1 ครั้ง", desc = "เข้าเล่นโหมดฝึกซ้อมกับบอทหรือดวลกับผู้เล่น 1 ครั้ง", goal = 1, metric = "matchesPlayed", rewardCoins = 1500, rewardPacks = 2 },
				{ id = "q_win_1", title = "คว้าชัยชนะแห่งเฟรน", desc = "ชนะการดวลในโหมดใดก็ได้ 1 ครั้ง", goal = 1, metric = "wins", rewardCoins = 2500, rewardPacks = 3 },
				{ id = "q_pack_3", title = "นักเปิดซองมือทอง", desc = "เปิดซองสุ่มการ์ด Booster Pack ครบ 3 ซอง", goal = 3, metric = "packsOpened", rewardCoins = 2000, rewardPacks = 2 },
				{ id = "sq_win_5", title = "นักสู้หน้าใหม่ไฟแรง (Side Quest)", desc = "สะสมชัยชนะครบ 5 ครั้ง", goal = 5, metric = "wins", rewardCoins = 5000, rewardPacks = 5 },
			}
		end

		for _, q in ipairs(questList) do
			local curVal = myProfile[q.metric] or 0
			local claimed = myProfile.claimedQuests and myProfile.claimedQuests[q.id]
			local canClaim = (curVal >= q.goal) and not claimed

			local row = Instance.new("Frame")
			row.Size = UDim2.new(1, -10, 0, 74)
			row.BackgroundColor3 = Color3.fromRGB(28, 34, 48)
			row.ZIndex = 28
			row.Parent = qScroll
			addCorner(row, 10)
			addStroke(row, canClaim and Color3.fromRGB(250, 204, 21) or Color3.fromRGB(51, 65, 85), 1.5)

			local qt = Instance.new("TextLabel")
			qt.Size = UDim2.new(0.65, 0, 0, 24)
			qt.Position = UDim2.fromOffset(14, 8)
			qt.BackgroundTransparency = 1
			qt.Font = Enum.Font.GothamBlack
			qt.TextSize = 15
			qt.TextColor3 = Color3.fromRGB(250, 204, 21)
			qt.TextXAlignment = Enum.TextXAlignment.Left
			qt.Text = q.title
			qt.ZIndex = 29
			qt.Parent = row

			local qd = Instance.new("TextLabel")
			qd.Size = UDim2.new(0.65, 0, 0, 18)
			qd.Position = UDim2.fromOffset(14, 30)
			qd.BackgroundTransparency = 1
			qd.Font = Enum.Font.Gotham
			qd.TextSize = 12
			qd.TextColor3 = Color3.fromRGB(203, 213, 225)
			qd.TextXAlignment = Enum.TextXAlignment.Left
			qd.Text = string.format("%s  (ความคืบหน้า: %d / %d)", q.desc, math.min(curVal, q.goal), q.goal)
			qd.ZIndex = 29
			qd.Parent = row

			-- แถบ Progress Bar สีทองเหมือนในคลิป!
			local barBg = Instance.new("Frame")
			barBg.Size = UDim2.new(0.72, 0, 0, 10)
			barBg.Position = UDim2.fromOffset(14, 54)
			barBg.BackgroundColor3 = Color3.fromRGB(15, 23, 42)
			barBg.ZIndex = 29
			barBg.Parent = row
			addCorner(barBg, 5)

			local barFill = Instance.new("Frame")
			barFill.Size = UDim2.fromScale(math.clamp(curVal / math.max(1, q.goal), 0, 1), 1)
			barFill.BackgroundColor3 = Color3.fromRGB(234, 179, 8)
			barFill.ZIndex = 30
			barFill.Parent = barBg
			addCorner(barFill, 5)

			local claimBtn = Instance.new("TextButton")
			claimBtn.Size = UDim2.fromOffset(150, 42)
			claimBtn.Position = UDim2.new(1, -166, 0.5, -21)
			claimBtn.BackgroundColor3 = claimed and Color3.fromRGB(51, 65, 85)
				or (canClaim and Color3.fromRGB(22, 163, 74) or Color3.fromRGB(30, 41, 59))
			claimBtn.Font = Enum.Font.GothamBlack
			claimBtn.TextSize = 13
			claimBtn.TextColor3 = Color3.fromRGB(255, 255, 255)
			claimBtn.Text = claimed and "✓ รับแล้ว"
				or string.format("🎁 รับ +%d🪙", q.rewardCoins or 1500)
			claimBtn.ZIndex = 29
			claimBtn.Parent = row
			addCorner(claimBtn, 8)
			claimBtn.MouseButton1Click:Connect(function()
				DuelActionEvent:FireServer({ action = "CLAIM_QUEST", questId = q.id })
			end)
		end

	-- =========================================================================
	-- แท็บที่ 3: 🃏 DECK BUILDER (สล็อตเด็ค + แชร์โค้ดเด็ค — เหมือนวินาทีที่ 00:52 - 01:03!)
	-- =========================================================================
	elseif currentSidebarTab == "DECK" then
		createSectionTitle(mainContentCard, "จัดเด็ค (Deck Builder)", "เลือกสล็อตเด็ค 20 ใบ • นำเข้าโค้ดเด็คจากเพื่อน (เช่น BOF101, BOF202, BOF303, BOF404)")

		-- กล่องนำเข้าโค้ดเด็คด้านบน
		local importBar = Instance.new("Frame")
		importBar.Size = UDim2.new(1, -44, 0, 52)
		importBar.Position = UDim2.fromOffset(22, 76)
		importBar.BackgroundColor3 = Color3.fromRGB(28, 34, 48)
		importBar.ZIndex = 27
		importBar.Parent = mainContentCard
		addCorner(importBar, 10)
		addStroke(importBar, Color3.fromRGB(51, 65, 85), 1.2)

		local codeBox = Instance.new("TextBox")
		codeBox.Size = UDim2.fromOffset(220, 34)
		codeBox.Position = UDim2.fromOffset(12, 9)
		codeBox.BackgroundColor3 = Color3.fromRGB(15, 23, 42)
		codeBox.Font = Enum.Font.GothamBold
		codeBox.TextSize = 14
		codeBox.TextColor3 = Color3.fromRGB(255, 255, 255)
		codeBox.PlaceholderText = "ใส่โค้ดเด็ค เช่น BOF404..."
		codeBox.Text = ""
		codeBox.ZIndex = 28
		codeBox.Parent = importBar
		addCorner(codeBox, 7)

		local importBtn = Instance.new("TextButton")
		importBtn.Size = UDim2.fromOffset(150, 34)
		importBtn.Position = UDim2.fromOffset(242, 9)
		importBtn.BackgroundColor3 = Color3.fromRGB(124, 58, 237)
		importBtn.Font = Enum.Font.GothamBold
		importBtn.TextSize = 13
		importBtn.TextColor3 = Color3.fromRGB(255, 255, 255)
		importBtn.Text = "📥 นำเข้าโค้ดเด็ค"
		importBtn.ZIndex = 28
		importBtn.Parent = importBar
		addCorner(importBtn, 7)
		importBtn.MouseButton1Click:Connect(function()
			DuelActionEvent:FireServer({ action = "IMPORT_DECK_CODE", deckCode = codeBox.Text })
		end)

		local newSlotBtn = Instance.new("TextButton")
		newSlotBtn.Size = UDim2.fromOffset(170, 34)
		newSlotBtn.Position = UDim2.new(1, -182, 0, 9)
		newSlotBtn.BackgroundColor3 = Color3.fromRGB(22, 163, 74)
		newSlotBtn.Font = Enum.Font.GothamBold
		newSlotBtn.TextSize = 13
		newSlotBtn.TextColor3 = Color3.fromRGB(255, 255, 255)
		newSlotBtn.Text = "➕ สร้างสล็อตเด็คใหม่"
		newSlotBtn.ZIndex = 28
		newSlotBtn.Parent = importBar
		addCorner(newSlotBtn, 7)
		newSlotBtn.MouseButton1Click:Connect(function()
			DuelActionEvent:FireServer({ action = "CREATE_DECK_SLOT", leaderId = "L01" })
		end)

		local slotScroll = Instance.new("ScrollingFrame")
		slotScroll.Size = UDim2.new(1, -44, 1, -148)
		slotScroll.Position = UDim2.fromOffset(22, 138)
		slotScroll.BackgroundTransparency = 1
		slotScroll.BorderSizePixel = 0
		slotScroll.ScrollBarThickness = 5
		slotScroll.AutomaticCanvasSize = Enum.AutomaticSize.Y
		slotScroll.CanvasSize = UDim2.new(0, 0, 0, 0)
		slotScroll.ZIndex = 27
		slotScroll.Parent = mainContentCard

		local slotLayout = Instance.new("UIListLayout")
		slotLayout.Padding = UDim.new(0, 10)
		slotLayout.Parent = slotScroll

		for idx, slot in ipairs(myProfile.deckSlots) do
			local isCurrent = (idx == myProfile.activeSlotIndex)
			local lCard = CardDatabase.getCardById(slot.leaderId) or CardDatabase.getCardById("L01")
			local meta = CardDatabase.DECK_METADATA[slot.leaderId] or CardDatabase.DECK_METADATA.L01

			local card = Instance.new("Frame")
			card.Size = UDim2.new(1, -10, 0, 82)
			card.BackgroundColor3 = Color3.fromRGB(28, 34, 48)
			card.ZIndex = 28
			card.Parent = slotScroll
			addCorner(card, 10)
			addStroke(card, isCurrent and Color3.fromRGB(250, 204, 21) or Color3.fromRGB(51, 65, 85), isCurrent and 2 or 1.2)

			local stName = Instance.new("TextLabel")
			stName.Size = UDim2.new(0.55, 0, 0, 26)
			stName.Position = UDim2.fromOffset(14, 8)
			stName.BackgroundTransparency = 1
			stName.Font = Enum.Font.GothamBlack
			stName.TextSize = 17
			stName.TextColor3 = isCurrent and Color3.fromRGB(250, 204, 21) or Color3.fromRGB(255, 255, 255)
			stName.TextXAlignment = Enum.TextXAlignment.Left
			stName.Text = (isCurrent and "★ " or "") .. slot.name
			stName.ZIndex = 29
			stName.Parent = card

			local stSub = Instance.new("TextLabel")
			stSub.Size = UDim2.new(0.6, 0, 0, 20)
			stSub.Position = UDim2.fromOffset(14, 34)
			stSub.BackgroundTransparency = 1
			stSub.Font = Enum.Font.GothamBold
			stSub.TextSize = 12
			stSub.TextColor3 = hexToColor3(meta.color)
			stSub.TextXAlignment = Enum.TextXAlignment.Left
			stSub.Text = string.format("🚩 %s • %d ใบ • Leader: %s", meta.name, #slot.mainDeck, lCard.name)
			stSub.ZIndex = 29
			stSub.Parent = card

			local codeTag = Instance.new("TextLabel")
			codeTag.Size = UDim2.fromOffset(140, 20)
			codeTag.Position = UDim2.fromOffset(14, 56)
			codeTag.BackgroundColor3 = Color3.fromRGB(15, 23, 42)
			codeTag.Font = Enum.Font.GothamBlack
			codeTag.TextSize = 11
			codeTag.TextColor3 = Color3.fromRGB(250, 204, 21)
			codeTag.Text = "แชร์โค้ด : " .. tostring(slot.shareCode or "BOF101")
			codeTag.ZIndex = 29
			codeTag.Parent = card
			addCorner(codeTag, 5)

			local setMainBtn = Instance.new("TextButton")
			setMainBtn.Size = UDim2.fromOffset(115, 32)
			setMainBtn.Position = UDim2.new(1, -245, 0, 12)
			setMainBtn.BackgroundColor3 = isCurrent and Color3.fromRGB(22, 163, 74) or Color3.fromRGB(51, 65, 85)
			setMainBtn.Font = Enum.Font.GothamBold
			setMainBtn.TextSize = 12
			setMainBtn.TextColor3 = Color3.fromRGB(255, 255, 255)
			setMainBtn.Text = isCurrent and "✓ เด็คหลัก" or "ตั้งเป็นเด็คหลัก"
			setMainBtn.ZIndex = 29
			setMainBtn.Parent = card
			addCorner(setMainBtn, 7)
			setMainBtn.MouseButton1Click:Connect(function()
				DuelActionEvent:FireServer({ action = "SELECT_DECK_SLOT", slotIndex = idx })
			end)

			local editBtn = Instance.new("TextButton")
			editBtn.Size = UDim2.fromOffset(110, 32)
			editBtn.Position = UDim2.new(1, -122, 0, 12)
			editBtn.BackgroundColor3 = Color3.fromRGB(124, 58, 237)
			editBtn.Font = Enum.Font.GothamBold
			editBtn.TextSize = 12
			editBtn.TextColor3 = Color3.fromRGB(255, 255, 255)
			editBtn.Text = "✏️ แก้ไขเด็ค"
			editBtn.ZIndex = 29
			editBtn.Parent = card
			addCorner(editBtn, 7)
			editBtn.MouseButton1Click:Connect(function()
				editingSlotIndex = idx
				editingLeaderId = slot.leaderId
				editingDeckName = slot.name
				editingMainDeck = {}
				for i, v in ipairs(slot.mainDeck) do
					editingMainDeck[i] = v
				end
				refreshDeckEditorModal()
				deckEditorOverlay.Visible = true
			end)
		end

	-- =========================================================================
	-- แท็บที่ 4: 📚 COLLECTION (คลังการ์ด + ตีบวกฟอยล์ Glossy/Royal/Prism — เหมือนวินาทีที่ 01:04 - 01:15!)
	-- =========================================================================
	elseif currentSidebarTab == "COLLECTION" then
		createSectionTitle(mainContentCard, "คอลเลกชันการ์ด (Collection)", "คลิกซ้ายที่ปุ่มด้านล่างการ์ดเพื่อตีบวกฟอยล์ (✨Glossy -> 👑Royal -> 💎Prism) • คลิกขวาดูใบใหญ่!")

		local colScroll = Instance.new("ScrollingFrame")
		colScroll.Size = UDim2.new(1, -44, 1, -92)
		colScroll.Position = UDim2.fromOffset(22, 78)
		colScroll.BackgroundColor3 = Color3.fromRGB(14, 18, 28)
		colScroll.BorderSizePixel = 0
		colScroll.ScrollBarThickness = 6
		colScroll.AutomaticCanvasSize = Enum.AutomaticSize.Y
		colScroll.CanvasSize = UDim2.new(0, 0, 0, 0)
		colScroll.ZIndex = 27
		colScroll.Parent = mainContentCard
		addCorner(colScroll, 10)

		local colGrid = Instance.new("UIGridLayout")
		colGrid.CellSize = UDim2.fromOffset(128, 206)
		colGrid.CellPadding = UDim2.fromOffset(10, 10)
		colGrid.Parent = colScroll

		for _, card in ipairs(CardDatabase.CARDS) do
			local holder = Instance.new("Frame")
			holder.BackgroundTransparency = 1
			holder.ZIndex = 28
			holder.Parent = colScroll

			local w = createCardWidget(card, {
				width = 128,
				height = 172,
				onLeftClick = function()
					openCardInspectModal(card)
				end,
			})
			w.ZIndex = 29
			w.Parent = holder

			local curFoil = (myProfile.foilMap and myProfile.foilMap[card.id]) or "Normal"
			local upBtn = Instance.new("TextButton")
			upBtn.Size = UDim2.new(1, 0, 0, 28)
			upBtn.Position = UDim2.fromOffset(0, 176)
			upBtn.BackgroundColor3 = (curFoil == "Prism") and Color3.fromRGB(192, 38, 211) or Color3.fromRGB(30, 41, 59)
			upBtn.Font = Enum.Font.GothamBold
			upBtn.TextSize = 11
			upBtn.TextColor3 = Color3.fromRGB(255, 255, 255)
			upBtn.Text = (curFoil == "Prism") and "💎 MAX PRISM" or "✨ ตีบวกฟอยล์ (500🪙)"
			upBtn.ZIndex = 29
			upBtn.Parent = holder
			addCorner(upBtn, 6)
			upBtn.MouseButton1Click:Connect(function()
				DuelActionEvent:FireServer({ action = "UPGRADE_FOIL", cardId = card.id })
			end)
		end

	-- =========================================================================
	-- แท็บที่ 5 & 6: 🛒 SHOP & 📦 OPEN PACK (ร้านค้าเด็ค & เปิดซอง Booster — เหมือนวินาทีที่ 01:16 - 01:33!)
	-- =========================================================================
	elseif currentSidebarTab == "SHOP" or currentSidebarTab == "PACK" then
		local isPackTab = (currentSidebarTab == "PACK")
		createSectionTitle(
			mainContentCard,
			isPackTab and "สุ่มซองการ์ด (Open Booster Pack)" or "ร้านค้าเด็คเริ่มต้น (Trial Deck Shop)",
			isPackTab and "ซองละ 5 ใบ • มีโอกาสได้การ์ดฟอยล์ ✨Glossy / 👑Royal / 💎Prism!"
				or "ปลดล็อกและดูรายชื่อการ์ดใน Trial Deck ทั้ง 4 เผ่าหลักของ แบทเทิล ออฟ เฟรน"
		)

		local packScroll = Instance.new("ScrollingFrame")
		packScroll.Size = UDim2.new(1, -44, 1, -92)
		packScroll.Position = UDim2.fromOffset(22, 78)
		packScroll.BackgroundTransparency = 1
		packScroll.BorderSizePixel = 0
		packScroll.ScrollBarThickness = 5
		packScroll.AutomaticCanvasSize = Enum.AutomaticSize.Y
		packScroll.CanvasSize = UDim2.new(0, 0, 0, 0)
		packScroll.ZIndex = 27
		packScroll.Parent = mainContentCard

		local packLayout = Instance.new("UIListLayout")
		packLayout.Padding = UDim.new(0, 12)
		packLayout.Parent = packScroll

		local boosters = {
			{ lid = "L01", code = "BOF-BT01", name = "Booster Vol.1 : จิตแห่งฮีโร่ (Hero Spirit)", desc = "ซองละ 5 ใบ • การันตีเผ่าฮีโร่ พร้อมลุ้น ออลฟอจิต & บาคุจิต ระดับฟอยล์ Prism!", color = "#3ee08f" },
			{ lid = "L02", code = "BOF-BT02", name = "Booster Vol.2 : กองทัพขุนเหนือ (Northern Army)", desc = "ซองละ 5 ใบ • การันตีกองทัพเหนือ พร้อมลุ้น จอมพลเหนือ & สายลับไพร่เหนือ!", color = "#f0a347" },
			{ lid = "L03", code = "BOF-BT03", name = "Booster Vol.3 : ทะลุมิติวันสิ้นโลก (Doomsday Future)", desc = "ซองละ 5 ใบ • การันตียูนิตวันสิ้นโลกและร่างอนาคตทั้ง 6 ร่าง!", color = "#5fd0ff" },
			{ lid = "L04", code = "BOF-BT04", name = "Booster Vol.4 : ปฏิบัติการไดโนไฮบริด (Dino Lab)", desc = "ซองละ 5 ใบ • การันตีเผ่าไดโน พร้อมลุ้น ไดโนเร็กซ์ ไฮบริด & เมเทโอ!", color = "#a3e635" },
		}

		for _, bInfo in ipairs(boosters) do
			local row = Instance.new("Frame")
			row.Size = UDim2.new(1, -10, 0, 108)
			row.BackgroundColor3 = Color3.fromRGB(28, 34, 48)
			row.ZIndex = 28
			row.Parent = packScroll
			addCorner(row, 12)
			addStroke(row, hexToColor3(bInfo.color), 1.6)

			local bTitle = Instance.new("TextLabel")
			bTitle.Size = UDim2.new(0.75, 0, 0, 26)
			bTitle.Position = UDim2.fromOffset(18, 10)
			bTitle.BackgroundTransparency = 1
			bTitle.Font = Enum.Font.GothamBlack
			bTitle.TextSize = 18
			bTitle.TextColor3 = Color3.fromRGB(250, 204, 21)
			bTitle.TextXAlignment = Enum.TextXAlignment.Left
			bTitle.Text = bInfo.code .. " • " .. bInfo.name
			bTitle.ZIndex = 29
			bTitle.Parent = row

			local bDesc = Instance.new("TextLabel")
			bDesc.Size = UDim2.new(0.75, 0, 0, 20)
			bDesc.Position = UDim2.fromOffset(18, 36)
			bDesc.BackgroundTransparency = 1
			bDesc.Font = Enum.Font.Gotham
			bDesc.TextSize = 13
			bDesc.TextColor3 = Color3.fromRGB(203, 213, 225)
			bDesc.TextXAlignment = Enum.TextXAlignment.Left
			bDesc.Text = bInfo.desc
			bDesc.ZIndex = 29
			bDesc.Parent = row

			local open1Btn = Instance.new("TextButton")
			open1Btn.Size = UDim2.fromOffset(145, 34)
			open1Btn.Position = UDim2.fromOffset(18, 64)
			open1Btn.BackgroundColor3 = Color3.fromRGB(22, 163, 74)
			open1Btn.Font = Enum.Font.GothamBlack
			open1Btn.TextSize = 13
			open1Btn.TextColor3 = Color3.fromRGB(255, 255, 255)
			open1Btn.Text = (myProfile.freePacks and myProfile.freePacks > 0) and "🎟️ เปิดฟรี 1 ซอง" or "📦 เปิด 1 ซอง (200🪙)"
			open1Btn.ZIndex = 29
			open1Btn.Parent = row
			addCorner(open1Btn, 8)
			open1Btn.MouseButton1Click:Connect(function()
				DuelActionEvent:FireServer({ action = "OPEN_PACK", packLeader = bInfo.lid, count = 1 })
			end)

			local open10Btn = Instance.new("TextButton")
			open10Btn.Size = UDim2.fromOffset(165, 34)
			open10Btn.Position = UDim2.fromOffset(173, 64)
			open10Btn.BackgroundColor3 = Color3.fromRGB(124, 58, 237)
			open10Btn.Font = Enum.Font.GothamBlack
			open10Btn.TextSize = 13
			open10Btn.TextColor3 = Color3.fromRGB(255, 255, 255)
			open10Btn.Text = "🔥 เปิด 10 ซอง (1,800🪙)"
			open10Btn.ZIndex = 29
			open10Btn.Parent = row
			addCorner(open10Btn, 8)
			open10Btn.MouseButton1Click:Connect(function()
				DuelActionEvent:FireServer({ action = "OPEN_PACK", packLeader = bInfo.lid, count = 10 })
			end)

			local viewPoolBtn = Instance.new("TextButton")
			viewPoolBtn.Size = UDim2.fromOffset(140, 34)
			viewPoolBtn.Position = UDim2.fromOffset(348, 64)
			viewPoolBtn.BackgroundColor3 = Color3.fromRGB(51, 65, 85)
			viewPoolBtn.Font = Enum.Font.GothamBold
			viewPoolBtn.TextSize = 12
			viewPoolBtn.TextColor3 = Color3.fromRGB(255, 255, 255)
			viewPoolBtn.Text = "🔍 ดูการ์ดในซอง"
			viewPoolBtn.ZIndex = 29
			viewPoolBtn.Parent = row
			addCorner(viewPoolBtn, 8)
			viewPoolBtn.MouseButton1Click:Connect(function()
				local preview = {}
				local seen = {}
				for _, cid in ipairs(CardDatabase.getDefaultDeck(bInfo.lid)) do
					if not seen[cid] then
						seen[cid] = true
						table.insert(preview, { id = cid, foil = "Normal" })
					end
				end
				showPackOpenedModal(preview)
			end)
		end

	-- =========================================================================
	-- แท็บที่ 7: 🔑 PVP ROOM (สร้างห้อง / กรอกเลขห้อง 6 หลัก — เหมือนวินาทีที่ 01:34 - 01:41!)
	-- =========================================================================
	elseif currentSidebarTab == "PVP_ROOM" then
		createSectionTitle(mainContentCard, "เล่นกับเพื่อนด้วยเลขห้อง (PvP Room)", "สร้างห้องแล้วส่งเลข 6 หลักให้เพื่อน — อยู่คนละปาร์ตี้ก็ดวลด้วยกันได้ทันที!")

		local createRoomBtn = Instance.new("TextButton")
		createRoomBtn.Size = UDim2.fromOffset(220, 46)
		createRoomBtn.Position = UDim2.fromOffset(22, 82)
		createRoomBtn.BackgroundColor3 = Color3.fromRGB(217, 119, 6)
		createRoomBtn.Font = Enum.Font.GothamBlack
		createRoomBtn.TextSize = 16
		createRoomBtn.TextColor3 = Color3.fromRGB(15, 23, 42)
		createRoomBtn.Text = "➕ สร้างห้องใหม่ (6 หลัก)"
		createRoomBtn.ZIndex = 28
		createRoomBtn.Parent = mainContentCard
		addCorner(createRoomBtn, 10)
		createRoomBtn.MouseButton1Click:Connect(function()
			DuelActionEvent:FireServer({ action = "CREATE_PVP_ROOM" })
		end)

		local roomInputBox = Instance.new("TextBox")
		roomInputBox.Size = UDim2.fromOffset(220, 46)
		roomInputBox.Position = UDim2.fromOffset(22, 144)
		roomInputBox.BackgroundColor3 = Color3.fromRGB(15, 23, 42)
		roomInputBox.Font = Enum.Font.GothamBlack
		roomInputBox.TextSize = 18
		roomInputBox.TextColor3 = Color3.fromRGB(255, 255, 255)
		roomInputBox.PlaceholderText = "กรอกเลขห้อง 6 หลัก"
		roomInputBox.Text = ""
		roomInputBox.ZIndex = 28
		roomInputBox.Parent = mainContentCard
		addCorner(roomInputBox, 10)
		addStroke(roomInputBox, Color3.fromRGB(71, 85, 105), 1.5)

		local joinRoomBtn = Instance.new("TextButton")
		joinRoomBtn.Size = UDim2.fromOffset(125, 46)
		joinRoomBtn.Position = UDim2.fromOffset(252, 144)
		joinRoomBtn.BackgroundColor3 = Color3.fromRGB(37, 99, 235)
		joinRoomBtn.Font = Enum.Font.GothamBlack
		joinRoomBtn.TextSize = 15
		joinRoomBtn.TextColor3 = Color3.fromRGB(255, 255, 255)
		joinRoomBtn.Text = "เข้าห้อง"
		joinRoomBtn.ZIndex = 28
		joinRoomBtn.Parent = mainContentCard
		addCorner(joinRoomBtn, 10)
		joinRoomBtn.MouseButton1Click:Connect(function()
			hubScreen.Visible = false
			DuelActionEvent:FireServer({ action = "JOIN_PVP_ROOM", roomCode = roomInputBox.Text })
		end)

		local openRoomsBox = Instance.new("ScrollingFrame")
		openRoomsBox.Size = UDim2.new(1, -44, 1, -220)
		openRoomsBox.Position = UDim2.fromOffset(22, 204)
		openRoomsBox.BackgroundColor3 = Color3.fromRGB(15, 20, 30)
		openRoomsBox.BorderSizePixel = 0
		openRoomsBox.ScrollBarThickness = 5
		openRoomsBox.AutomaticCanvasSize = Enum.AutomaticSize.Y
		openRoomsBox.CanvasSize = UDim2.new(0, 0, 0, 0)
		openRoomsBox.ZIndex = 28
		openRoomsBox.Parent = mainContentCard
		addCorner(openRoomsBox, 10)

		local orLayout = Instance.new("UIListLayout")
		orLayout.Padding = UDim.new(0, 8)
		orLayout.Parent = openRoomsBox

		for _, r in ipairs(openRoomsList or {}) do
			local row = Instance.new("Frame")
			row.Size = UDim2.new(1, -12, 0, 44)
			row.BackgroundColor3 = Color3.fromRGB(28, 34, 48)
			row.ZIndex = 29
			row.Parent = openRoomsBox
			addCorner(row, 8)

			local lbl = Instance.new("TextLabel")
			lbl.Size = UDim2.new(0.7, 0, 1, 0)
			lbl.Position = UDim2.fromOffset(14, 0)
			lbl.BackgroundTransparency = 1
			lbl.Font = Enum.Font.GothamBold
			lbl.TextSize = 14
			lbl.TextColor3 = Color3.fromRGB(250, 204, 21)
			lbl.TextXAlignment = Enum.TextXAlignment.Left
			lbl.Text = string.format("🔑 เลขห้อง: %s  •  เจ้าของห้อง: %s (👑 %s)", r.roomCode, r.hostName, r.leaderName)
			lbl.ZIndex = 30
			lbl.Parent = row

			local jb = Instance.new("TextButton")
			jb.Size = UDim2.fromOffset(115, 32)
			jb.Position = UDim2.new(1, -125, 0.5, -16)
			jb.BackgroundColor3 = Color3.fromRGB(22, 163, 74)
			jb.Font = Enum.Font.GothamBold
			jb.TextSize = 13
			jb.TextColor3 = Color3.fromRGB(255, 255, 255)
			jb.Text = "⚔️ เข้าร่วมทันที"
			jb.ZIndex = 30
			jb.Parent = row
			addCorner(jb, 7)
			jb.MouseButton1Click:Connect(function()
				hubScreen.Visible = false
				DuelActionEvent:FireServer({ action = "JOIN_PVP_ROOM", roomCode = r.roomCode })
			end)
		end

	-- =========================================================================
	-- แท็บที่ 8: 👋 เพื่อน (รายชื่อผู้เล่นในเซิร์ฟเวอร์ + ปุ่มชวนดวล — เหมือนวินาทีที่ 01:42 - 01:49!)
	-- =========================================================================
	elseif currentSidebarTab == "FRIENDS" then
		createSectionTitle(mainContentCard, "เพื่อน & ผู้เล่นออนไลน์", "ดูผู้เล่นที่ออนไลน์ในเซิร์ฟเวอร์ตอนนี้ แล้วกดปุ่ม '⚔️ ชวนดวล' ได้ทันที!")

		local fScroll = Instance.new("ScrollingFrame")
		fScroll.Size = UDim2.new(1, -44, 1, -92)
		fScroll.Position = UDim2.fromOffset(22, 78)
		fScroll.BackgroundTransparency = 1
		fScroll.BorderSizePixel = 0
		fScroll.ScrollBarThickness = 5
		fScroll.AutomaticCanvasSize = Enum.AutomaticSize.Y
		fScroll.CanvasSize = UDim2.new(0, 0, 0, 0)
		fScroll.ZIndex = 27
		fScroll.Parent = mainContentCard

		local fLayout = Instance.new("UIListLayout")
		fLayout.Padding = UDim.new(0, 8)
		fLayout.Parent = fScroll

		for _, plrInfo in ipairs(myProfile.onlinePlayers or {}) do
			local row = Instance.new("Frame")
			row.Size = UDim2.new(1, -10, 0, 52)
			row.BackgroundColor3 = Color3.fromRGB(28, 34, 48)
			row.ZIndex = 28
			row.Parent = fScroll
			addCorner(row, 10)
			addStroke(row, Color3.fromRGB(51, 65, 85), 1.2)

			local pName = Instance.new("TextLabel")
			pName.Size = UDim2.new(0.65, 0, 1, 0)
			pName.Position = UDim2.fromOffset(16, 0)
			pName.BackgroundTransparency = 1
			pName.Font = Enum.Font.GothamBold
			pName.TextSize = 14
			pName.TextColor3 = Color3.fromRGB(255, 255, 255)
			pName.TextXAlignment = Enum.TextXAlignment.Left
			pName.Text = string.format("🟢 %s (@%s)  •  👑 %s (%s ★%d)", plrInfo.displayName, plrInfo.name, plrInfo.leaderName, plrInfo.rankTier, plrInfo.rankStars)
			pName.ZIndex = 29
			pName.Parent = row

			if plrInfo.userId ~= localPlayer.UserId then
				local chBtn = Instance.new("TextButton")
				chBtn.Size = UDim2.fromOffset(120, 34)
				chBtn.Position = UDim2.new(1, -134, 0.5, -17)
				chBtn.BackgroundColor3 = Color3.fromRGB(37, 99, 235)
				chBtn.Font = Enum.Font.GothamBold
				chBtn.TextSize = 13
				chBtn.TextColor3 = Color3.fromRGB(255, 255, 255)
				chBtn.Text = "⚔️ ชวนดวล"
				chBtn.ZIndex = 29
				chBtn.Parent = row
				addCorner(chBtn, 8)
				chBtn.MouseButton1Click:Connect(function()
					hubScreen.Visible = false
					DuelActionEvent:FireServer({ action = "CHALLENGE_PLAYER", targetUserId = plrInfo.userId })
				end)
			end
		end

	-- =========================================================================
	-- แท็บที่ 9: 🛡️ กิลด์ (เช็คอินกิลด์รับเหรียญ — เหมือนวินาทีที่ 01:50 - 02:00!)
	-- =========================================================================
	elseif currentSidebarTab == "GUILD" then
		createSectionTitle(mainContentCard, "กิลด์ / ทีม : Battle of Friends Official", "เช็คอินกิลด์รายวันเพื่อรับโบนัส +1,500 เหรียญทอง และช่วยกันสะสมแต้มกิลด์!")

		local gBox = Instance.new("Frame")
		gBox.Size = UDim2.new(1, -44, 0, 140)
		gBox.Position = UDim2.fromOffset(22, 82)
		gBox.BackgroundColor3 = Color3.fromRGB(28, 34, 48)
		gBox.ZIndex = 28
		gBox.Parent = mainContentCard
		addCorner(gBox, 12)
		addStroke(gBox, Color3.fromRGB(234, 179, 8), 1.8)

		local gTitle = Instance.new("TextLabel")
		gTitle.Size = UDim2.new(0.7, 0, 0, 32)
		gTitle.Position = UDim2.fromOffset(18, 14)
		gTitle.BackgroundTransparency = 1
		gTitle.Font = Enum.Font.GothamBlack
		gTitle.TextSize = 20
		gTitle.TextColor3 = Color3.fromRGB(250, 204, 21)
		gTitle.TextXAlignment = Enum.TextXAlignment.Left
		gTitle.Text = "🛡️ กิลด์ : แบทเทิล ออฟ เฟรน Lv.10 (โบนัสเหรียญ +15%)"
		gTitle.ZIndex = 29
		gTitle.Parent = gBox

		local gDesc = Instance.new("TextLabel")
		gDesc.Size = UDim2.new(0.7, 0, 0, 48)
		gDesc.Position = UDim2.fromOffset(18, 48)
		gDesc.BackgroundTransparency = 1
		gDesc.Font = Enum.Font.GothamMedium
		gDesc.TextSize = 14
		gDesc.TextColor3 = Color3.fromRGB(203, 213, 225)
		gDesc.TextXAlignment = Enum.TextXAlignment.Left
		gDesc.TextWrapped = true
		gDesc.Text = "แต้มกิลด์รวม: 72,509 แต้ม • สมาชิกทุกคนที่กดเช็คอินวันนี้รับทันที 1,500 เหรียญทอง!"
		gDesc.ZIndex = 29
		gDesc.Parent = gBox

		local checkInBtn = Instance.new("TextButton")
		checkInBtn.Size = UDim2.fromOffset(170, 44)
		checkInBtn.Position = UDim2.new(1, -190, 0.5, -22)
		checkInBtn.BackgroundColor3 = myProfile.guildCheckedIn and Color3.fromRGB(51, 65, 85) or Color3.fromRGB(22, 163, 74)
		checkInBtn.Font = Enum.Font.GothamBlack
		checkInBtn.TextSize = 15
		checkInBtn.TextColor3 = Color3.fromRGB(255, 255, 255)
		checkInBtn.Text = myProfile.guildCheckedIn and "✓ เช็คอินวันนี้แล้ว" or "✅ เช็คอินรับ 1,500🪙"
		checkInBtn.ZIndex = 29
		checkInBtn.Parent = gBox
		addCorner(checkInBtn, 10)
		checkInBtn.MouseButton1Click:Connect(function()
			DuelActionEvent:FireServer({ action = "GUILD_CHECKIN" })
		end)

	-- =========================================================================
	-- แท็บที่ 10: 📊 สถิติ (อัตราชนะแต่ละเผ่า & การ์ดยอดนิยม — เหมือนวินาทีที่ 02:01 - 02:25!)
	-- =========================================================================
	elseif currentSidebarTab == "STATS" then
		createSectionTitle(mainContentCard, "สถิติเมต้า (Meta Statistics)", "ความนิยมและอัตราชนะของทั้ง 4 เด็คหลักในเซิร์ฟเวอร์ — กดปุ่ม 'ใช้เด็คนี้' เพื่อคัดลอกได้เลย!")

		local metaList = {
			{ lid = "L04", name = "1. เด็คไดโน (ศูนย์วิจัยไดโน)", winRate = "58.4%", matches = "42,180 แมตช์", ratio = 0.88, col = Color3.fromRGB(163, 230, 53), code = "BOF404" },
			{ lid = "L01", name = "2. เด็คจิต (มายฮีโร่ เดจิต)", winRate = "54.2%", matches = "38,910 แมตช์", ratio = 0.78, col = Color3.fromRGB(62, 224, 143), code = "BOF101" },
			{ lid = "L03", name = "3. เด็ควันสิ้นโลก (ร่างอนาคต)", winRate = "52.9%", matches = "31,400 แมตช์", ratio = 0.68, col = Color3.fromRGB(95, 208, 255), code = "BOF303" },
			{ lid = "L02", name = "4. เด็คขุนเหนือ (กองทัพเหนือ)", winRate = "51.5%", matches = "25,950 แมตช์", ratio = 0.58, col = Color3.fromRGB(240, 163, 71), code = "BOF202" },
		}

		for i, m in ipairs(metaList) do
			local row = Instance.new("Frame")
			row.Size = UDim2.new(1, -44, 0, 74)
			row.Position = UDim2.fromOffset(22, 82 + (i - 1) * 84)
			row.BackgroundColor3 = Color3.fromRGB(28, 34, 48)
			row.ZIndex = 28
			row.Parent = mainContentCard
			addCorner(row, 10)

			local lbl = Instance.new("TextLabel")
			lbl.Size = UDim2.new(0.6, 0, 0, 26)
			lbl.Position = UDim2.fromOffset(16, 8)
			lbl.BackgroundTransparency = 1
			lbl.Font = Enum.Font.GothamBlack
			lbl.TextSize = 16
			lbl.TextColor3 = Color3.fromRGB(255, 255, 255)
			lbl.TextXAlignment = Enum.TextXAlignment.Left
			lbl.Text = m.name
			lbl.ZIndex = 29
			lbl.Parent = row

			local wr = Instance.new("TextLabel")
			wr.Size = UDim2.fromOffset(220, 26)
			wr.Position = UDim2.new(1, -350, 0, 8)
			wr.BackgroundTransparency = 1
			wr.Font = Enum.Font.GothamBold
			wr.TextSize = 14
			wr.TextColor3 = m.col
			wr.TextXAlignment = Enum.TextXAlignment.Right
			wr.Text = string.format("%s  •  Win Rate %s", m.matches, m.winRate)
			wr.ZIndex = 29
			wr.Parent = row

			local barBg = Instance.new("Frame")
			barBg.Size = UDim2.new(0.76, 0, 0, 12)
			barBg.Position = UDim2.fromOffset(16, 44)
			barBg.BackgroundColor3 = Color3.fromRGB(15, 23, 42)
			barBg.ZIndex = 29
			barBg.Parent = row
			addCorner(barBg, 6)

			local barFill = Instance.new("Frame")
			barFill.Size = UDim2.fromScale(m.ratio, 1)
			barFill.BackgroundColor3 = m.col
			barFill.ZIndex = 30
			barFill.Parent = barBg
			addCorner(barFill, 6)

			local tryBtn = Instance.new("TextButton")
			tryBtn.Size = UDim2.fromOffset(105, 36)
			tryBtn.Position = UDim2.new(1, -118, 0.5, -18)
			tryBtn.BackgroundColor3 = Color3.fromRGB(37, 99, 235)
			tryBtn.Font = Enum.Font.GothamBold
			tryBtn.TextSize = 13
			tryBtn.TextColor3 = Color3.fromRGB(255, 255, 255)
			tryBtn.Text = "📋 ลองเด็คนี้"
			tryBtn.ZIndex = 29
			tryBtn.Parent = row
			addCorner(tryBtn, 8)
			tryBtn.MouseButton1Click:Connect(function()
				DuelActionEvent:FireServer({ action = "IMPORT_DECK_CODE", deckCode = m.code })
			end)
		end

	-- =========================================================================
	-- แท็บที่ 11: 🏆 RANKED (อันดับผู้เล่น — เหมือนวินาทีที่ 02:26 - 02:33!)
	-- =========================================================================
	elseif currentSidebarTab == "RANKED" then
		createSectionTitle(mainContentCard, "ตารางอันดับแรงก์ (Ranked Leaderboard)", "ชนะการดวลเพื่อสะสมดาว ★ ไต่ระดับสู่ Master แห่ง แบทเทิล ออฟ เฟรน!")

		local myRankBox = Instance.new("Frame")
		myRankBox.Size = UDim2.new(1, -44, 0, 90)
		myRankBox.Position = UDim2.fromOffset(22, 82)
		myRankBox.BackgroundColor3 = Color3.fromRGB(46, 16, 101)
		myRankBox.ZIndex = 28
		myRankBox.Parent = mainContentCard
		addCorner(myRankBox, 12)
		addStroke(myRankBox, Color3.fromRGB(250, 204, 21), 2)

		local mrLbl = Instance.new("TextLabel")
		mrLbl.Size = UDim2.new(1, -32, 1, 0)
		mrLbl.Position = UDim2.fromOffset(16, 0)
		mrLbl.BackgroundTransparency = 1
		mrLbl.Font = Enum.Font.GothamBlack
		mrLbl.TextSize = 24
		mrLbl.TextColor3 = Color3.fromRGB(250, 204, 21)
		mrLbl.Text = string.format("👑 แรงก์ของคุณ : %s  ★ %d ดาว  (ชนะ %d / แพ้ %d)", myProfile.rankTier or "Master", myProfile.rankStars or 56, myProfile.wins or 12, myProfile.losses or 3)
		mrLbl.ZIndex = 29
		mrLbl.Parent = myRankBox

	-- =========================================================================
	-- แท็บที่ 12: 🎨 STYLE (ซื้อ/สวมใส่ ปลอกการ์ด, สนาม, ฉายา, เอฟเฟกต์ — เหมือนวินาทีที่ 02:34 - 02:47!)
	-- =========================================================================
	elseif currentSidebarTab == "STYLE" then
		createSectionTitle(mainContentCard, "ตกแต่งโปรไฟล์ & สนาม (Style Shop)", "ปรับแต่งปลอกการ์ด, ธีมสนาม, ฉายา และท่าเอฟเฟกต์เรียกการ์ดของคุณ!")

		local styleItems = {
			{ cat = "sleeve", name = "Classic Blue", desc = "ปลอกการ์ดสีน้ำเงินคลาสสิก", price = 0 },
			{ cat = "sleeve", name = "Champion Gold", desc = "ปลอกการ์ดสีทองแชมเปี้ยน", price = 600 },
			{ cat = "arena", name = "Crimson Arena", desc = "ธีมสนามประลองเพลิงสีชาด", price = 700 },
			{ cat = "title", name = "ราชันย์แห่งเฟรน", desc = "ฉายาพิเศษแสดงหน้าชื่อผู้เล่น", price = 800 },
			{ cat = "summonFx", name = "อุกกาบาตเพลิง", desc = "เอฟเฟกต์ตอนอัญเชิญยูนิตลงสนาม", price = 1000 },
		}

		for i, st in ipairs(styleItems) do
			local isOwned = myProfile.ownedStyles and myProfile.ownedStyles[st.name]
			local isEquipped = myProfile.equippedStyle and (myProfile.equippedStyle[st.cat] == st.name)

			local row = Instance.new("Frame")
			row.Size = UDim2.new(1, -44, 0, 62)
			row.Position = UDim2.fromOffset(22, 82 + (i - 1) * 70)
			row.BackgroundColor3 = Color3.fromRGB(28, 34, 48)
			row.ZIndex = 28
			row.Parent = mainContentCard
			addCorner(row, 10)
			addStroke(row, isEquipped and Color3.fromRGB(74, 222, 128) or Color3.fromRGB(51, 65, 85), 1.4)

			local nm = Instance.new("TextLabel")
			nm.Size = UDim2.new(0.6, 0, 0, 26)
			nm.Position = UDim2.fromOffset(16, 8)
			nm.BackgroundTransparency = 1
			nm.Font = Enum.Font.GothamBlack
			nm.TextSize = 16
			nm.TextColor3 = Color3.fromRGB(255, 255, 255)
			nm.TextXAlignment = Enum.TextXAlignment.Left
			nm.Text = st.name
			nm.ZIndex = 29
			nm.Parent = row

			local ds = Instance.new("TextLabel")
			ds.Size = UDim2.new(0.6, 0, 0, 20)
			ds.Position = UDim2.fromOffset(16, 34)
			ds.BackgroundTransparency = 1
			ds.Font = Enum.Font.Gotham
			ds.TextSize = 12
			ds.TextColor3 = Color3.fromRGB(148, 163, 184)
			ds.TextXAlignment = Enum.TextXAlignment.Left
			ds.Text = st.desc
			ds.ZIndex = 29
			ds.Parent = row

			local actBtn = Instance.new("TextButton")
			actBtn.Size = UDim2.fromOffset(140, 36)
			actBtn.Position = UDim2.new(1, -156, 0.5, -18)
			actBtn.BackgroundColor3 = isEquipped and Color3.fromRGB(22, 163, 74) or Color3.fromRGB(217, 119, 6)
			actBtn.Font = Enum.Font.GothamBlack
			actBtn.TextSize = 13
			actBtn.TextColor3 = Color3.fromRGB(255, 255, 255)
			actBtn.Text = isEquipped and "✓ ใช้อยู่" or (isOwned and "สวมใส่" or string.format("🪙 %d Buy", st.price))
			actBtn.ZIndex = 29
			actBtn.Parent = row
			addCorner(actBtn, 8)
			actBtn.MouseButton1Click:Connect(function()
				DuelActionEvent:FireServer({
					action = "BUY_OR_EQUIP_STYLE",
					category = st.cat,
					itemName = st.name,
					price = st.price,
				})
			end)
		end

	-- =========================================================================
	-- แท็บที่ 13: 💤 ห้อง AFK (รับเหรียญอัตโนมัติ — เหมือนวินาทีที่ 02:48 - 02:50!)
	-- =========================================================================
	elseif currentSidebarTab == "AFK" then
		createSectionTitle(mainContentCard, "💤 ห้อง AFK (รับเหรียญอัตโนมัติ)", "เปิดโหมด AFK ทิ้งไว้เพื่อรับ +45 เหรียญทองทุกๆ 5 วินาที!")

		local afkCard = Instance.new("Frame")
		afkCard.Size = UDim2.new(1, -44, 0, 160)
		afkCard.Position = UDim2.fromOffset(22, 84)
		afkCard.BackgroundColor3 = Color3.fromRGB(28, 34, 48)
		afkCard.ZIndex = 28
		afkCard.Parent = mainContentCard
		addCorner(afkCard, 12)
		addStroke(afkCard, isAfkActive and Color3.fromRGB(74, 222, 128) or Color3.fromRGB(124, 58, 237), 2)

		local afkStatus = Instance.new("TextLabel")
		afkStatus.Size = UDim2.new(1, -32, 0, 54)
		afkStatus.Position = UDim2.fromOffset(16, 18)
		afkStatus.BackgroundTransparency = 1
		afkStatus.Font = Enum.Font.GothamBold
		afkStatus.TextSize = 16
		afkStatus.TextColor3 = Color3.fromRGB(226, 232, 240)
		afkStatus.TextXAlignment = Enum.TextXAlignment.Left
		afkStatus.TextWrapped = true
		afkStatus.Text = isAfkActive
			and "🟢 กำลังอยู่ในโหมด AFK — ระบบกำลังแจก +45 เหรียญทองให้คุณอัตโนมัติทุกๆ 5 วินาที!"
			or "⚪ ยังไม่ได้เปิดโหมด AFK — กดปุ่มด้านล่างเพื่อเริ่มสะสมเหรียญอัตโนมัติได้เลย"
		afkStatus.ZIndex = 29
		afkStatus.Parent = afkCard

		local toggleAfkBtn = Instance.new("TextButton")
		toggleAfkBtn.Size = UDim2.fromOffset(220, 44)
		toggleAfkBtn.Position = UDim2.fromOffset(16, 92)
		toggleAfkBtn.BackgroundColor3 = isAfkActive and Color3.fromRGB(220, 38, 38) or Color3.fromRGB(124, 58, 237)
		toggleAfkBtn.Font = Enum.Font.GothamBlack
		toggleAfkBtn.TextSize = 15
		toggleAfkBtn.TextColor3 = Color3.fromRGB(255, 255, 255)
		toggleAfkBtn.Text = isAfkActive and "⏹️ ออกจากโหมด AFK" or "💤 เข้าห้อง AFK รับเหรียญ"
		toggleAfkBtn.ZIndex = 29
		toggleAfkBtn.Parent = afkCard
		addCorner(toggleAfkBtn, 10)
		toggleAfkBtn.MouseButton1Click:Connect(function()
			isAfkActive = not isAfkActive
			renderActiveHubTab()
		end)

	-- =========================================================================
	-- แท็บที่ 14: 👤 โปรไฟล์ (ตู้โชว์การ์ด 3 ใบ — เหมือนวินาทีที่ 02:51 - 02:54!)
	-- =========================================================================
	elseif currentSidebarTab == "PROFILE" then
		createSectionTitle(mainContentCard, "โปรไฟล์ของฉัน : " .. localPlayer.DisplayName, "สถิติการดวลและตู้โชว์การ์ด 3 ใบโปรดของคุณ (คลิกขวาที่การ์ดเพื่อดูรายละเอียด)")

		local profCard = Instance.new("Frame")
		profCard.Size = UDim2.new(1, -44, 0, 310)
		profCard.Position = UDim2.fromOffset(22, 82)
		profCard.BackgroundColor3 = Color3.fromRGB(28, 34, 48)
		profCard.ZIndex = 28
		profCard.Parent = mainContentCard
		addCorner(profCard, 12)
		addStroke(profCard, Color3.fromRGB(250, 204, 21), 1.5)

		local pHeader = Instance.new("TextLabel")
		pHeader.Size = UDim2.new(1, -32, 0, 48)
		pHeader.Position = UDim2.fromOffset(16, 12)
		pHeader.BackgroundTransparency = 1
		pHeader.Font = Enum.Font.GothamBlack
		pHeader.TextSize = 18
		pHeader.TextColor3 = Color3.fromRGB(250, 204, 21)
		pHeader.TextXAlignment = Enum.TextXAlignment.Left
		pHeader.Text = string.format(
			"👤 %s (@%s)  •  ฉายา: %s\n⚔️ ชนะ %d  •  แพ้ %d  •  เปิดซองสะสม %d ซอง",
			localPlayer.DisplayName,
			localPlayer.Name,
			(myProfile.equippedStyle and myProfile.equippedStyle.title) or "Master Duelist",
			myProfile.wins or 12,
			myProfile.losses or 3,
			myProfile.packsOpened or 4
		)
		pHeader.ZIndex = 29
		pHeader.Parent = profCard

		local scTitle = Instance.new("TextLabel")
		scTitle.Size = UDim2.fromOffset(240, 24)
		scTitle.Position = UDim2.fromOffset(16, 72)
		scTitle.BackgroundTransparency = 1
		scTitle.Font = Enum.Font.GothamBold
		scTitle.TextSize = 14
		scTitle.TextColor3 = Color3.fromRGB(250, 204, 21)
		scTitle.TextXAlignment = Enum.TextXAlignment.Left
		scTitle.Text = "★ ตู้โชว์การ์ดประจำตัว (3 ใบ)"
		scTitle.ZIndex = 29
		scTitle.Parent = profCard

		for i = 1, 3 do
			local cid = (myProfile.showcaseCards and myProfile.showcaseCards[i]) or "L01"
			local c = CardDatabase.getCardById(cid) or CardDatabase.getCardById("L01")
			local w = createCardWidget(c, {
				width = 126,
				height = 178,
				foilOverride = "Prism",
				onLeftClick = function()
					openCardInspectModal(c)
				end,
			})
			w.Position = UDim2.fromOffset(20 + (i - 1) * 148, 104)
			w.ZIndex = 29
			w.Parent = profCard
		end

	-- =========================================================================
	-- แท็บที่ 15: 📖 HOW TO PLAY (คู่มือวิธีเล่น แบทเทิล ออฟ เฟรน — เหมือนวินาทีที่ 02:55 - 03:06!)
	-- =========================================================================
	elseif currentSidebarTab == "HOWTO" then
		createSectionTitle(mainContentCard, "วิธีเล่น แบทเทิล ออฟ เฟรน (How to Play)", "กติกาหลักของเกมการ์ด แบทเทิล ออฟ เฟรน และคีย์เวิร์ดความสามารถพิเศษทั้งหมด")

		local hScroll = Instance.new("ScrollingFrame")
		hScroll.Size = UDim2.new(1, -44, 1, -92)
		hScroll.Position = UDim2.fromOffset(22, 78)
		hScroll.BackgroundTransparency = 1
		hScroll.BorderSizePixel = 0
		hScroll.ScrollBarThickness = 5
		hScroll.AutomaticCanvasSize = Enum.AutomaticSize.Y
		hScroll.CanvasSize = UDim2.new(0, 0, 0, 0)
		hScroll.ZIndex = 27
		hScroll.Parent = mainContentCard

		local hLayout = Instance.new("UIListLayout")
		hLayout.Padding = UDim.new(0, 10)
		hLayout.Parent = hScroll

		local rules = {
			{ title = "🎯 เป้าหมายของการดวล", body = "โจมตีการ์ด Leader ของฝ่ายตรงข้ามจน HP เหลือ 0 (เริ่มต้น 6 HP) เพื่อคว้าชัยชนะ!" },
			{ title = "🔄 ช่วงเปลี่ยนมือเริ่มต้น (Mulligan)", body = "เริ่มเกมจั่วการ์ด 5 ใบ สามารถเลือกเปลี่ยนการ์ดบนมือได้สูงสุด 2 ใบก่อนเริ่มเทิร์นที่ 1" },
			{ title = "⏳ ลำดับเทิร์น (Turn Phases)", body = "Stand Phase (ตั้งการ์ดทุกใบเป็น Stand) -> Draw Phase (จั่ว 1 ใบ) -> Main Phase (ลงยูนิตใน 3 ช่อง / ใช้สกิล / ร่ายเวท 1 ใบ) -> Battle Phase -> End Phase" },
			{ title = "🦖 คีย์เวิร์ดพิเศษ: จุติ / อนาคต / ไฮบริด / สายลับ", body = "• จุติ (ออลฟอจิต): อัญเชิญจากนรกเมื่อ Leader ถูกตีตอน HP <= 2 และล้างสนาม\n• อนาคต (เด็ควันสิ้นโลก): ส่งร่างต้นบนสนามไปมิติมืดเพื่ออัญเชิญร่างอนาคต และสลับกลับตอนจบเทิร์น\n• ไฮบริด (เด็คไดโน): ส่งวัตถุดิบ 2 ใบจากมือ/สนาม/นรกไปมิติมืดเพื่ออัญเชิญ\n• สายลับไพร่เหนือ: ส่งไปยึดช่องว่างบนสนามของฝ่ายตรงข้าม!" },
			{ title = "🖱️ การควบคุมเมาส์ในแมพนี้", body = "• คลิกซ้าย (Left-Click): สั่งเล่นการ์ด, เลือกช่องลงสนาม, สั่งโจมตีใส่ยูนิตหรือหลีดเดอร์ศัตรูทันที\n• คลิกขวา (Right-Click): เปิดหน้าต่างดูรายละเอียดการ์ดใบใหญ่" },
		}

		for _, r in ipairs(rules) do
			local box = Instance.new("Frame")
			box.Size = UDim2.new(1, -10, 0, 88)
			box.BackgroundColor3 = Color3.fromRGB(28, 34, 48)
			box.ZIndex = 28
			box.Parent = hScroll
			addCorner(box, 10)
			addStroke(box, Color3.fromRGB(51, 65, 85), 1.2)

			local rt = Instance.new("TextLabel")
			rt.Size = UDim2.new(1, -24, 0, 24)
			rt.Position = UDim2.fromOffset(14, 8)
			rt.BackgroundTransparency = 1
			rt.Font = Enum.Font.GothamBlack
			rt.TextSize = 15
			rt.TextColor3 = Color3.fromRGB(56, 189, 248)
			rt.TextXAlignment = Enum.TextXAlignment.Left
			rt.Text = r.title
			rt.ZIndex = 29
			rt.Parent = box

			local rb = Instance.new("TextLabel")
			rb.Size = UDim2.new(1, -24, 0, 50)
			rb.Position = UDim2.fromOffset(14, 32)
			rb.BackgroundTransparency = 1
			rb.Font = Enum.Font.Gotham
			rb.TextSize = 12
			rb.TextColor3 = Color3.fromRGB(226, 232, 240)
			rb.TextXAlignment = Enum.TextXAlignment.Left
			rb.TextYAlignment = Enum.TextYAlignment.Top
			rb.TextWrapped = true
			rb.Text = r.body
			rb.ZIndex = 29
			rb.Parent = box
		end

	-- =========================================================================
	-- แท็บที่ 16: ⚙️ ตั้งค่า (Settings — เหมือนวินาทีที่ 03:07 - 03:19!)
	-- =========================================================================
	else
		createSectionTitle(mainContentCard, "ตั้งค่าเกม (Game Settings)", "ปรับแต่งมุมมองการเล่น, การรับคำท้าดวล และขนาด UI")

		local setBox = Instance.new("Frame")
		setBox.Size = UDim2.new(1, -44, 0, 180)
		setBox.Position = UDim2.fromOffset(22, 82)
		setBox.BackgroundColor3 = Color3.fromRGB(28, 34, 48)
		setBox.ZIndex = 28
		setBox.Parent = mainContentCard
		addCorner(setBox, 12)

		local info = Instance.new("TextLabel")
		info.Size = UDim2.new(1, -32, 1, -24)
		info.Position = UDim2.fromOffset(16, 12)
		info.BackgroundTransparency = 1
		info.Font = Enum.Font.GothamBold
		info.TextSize = 14
		info.TextColor3 = Color3.fromRGB(226, 232, 240)
		info.TextXAlignment = Enum.TextXAlignment.Left
		info.TextYAlignment = Enum.TextYAlignment.Top
		info.TextWrapped = true
		info.Text = "🖥️ โหมดมุมมองการเล่น: กระดาน 2D เต็มจอ + ซิงค์ลงสนาม Playmat 3D ในแมพแบบสด (LIVE DUEL)\n\n🖱️ การดูข้อมูลการ์ด: คลิกขวา (Right-Click) เท่านั้น (ป้องกันหน้าต่างเด้งรบกวนเวลาคลิกซ้ายโจมตี Leader)\n\n🖼️ การค้นหาการ์ดจากสกิล: แสดงเป็นตารางรูปภาพการ์ด (Visual Card Grid) ทุกสกิล"
		info.ZIndex = 29
		info.Parent = setBox
	end
end

backToMenuBtn.MouseButton1Click:Connect(function()
	mapFloatingBar.Visible = false
	hubScreen.Visible = true
	renderActiveHubTab()
end)

-- ลูปแจกเหรียญห้อง AFK อัตโนมัติเมื่อเปิดโหมด AFK
task.spawn(function()
	while true do
		task.wait(5)
		if isAfkActive and hubScreen.Visible then
			DuelActionEvent:FireServer({ action = "AFK_REWARD_TICK" })
		end
	end
end)

-- ==================== กระดานดวลหลัก (Duel Board Screen) ====================
local boardScreen = Instance.new("Frame")
boardScreen.Name = "DuelBoardScreen"
boardScreen.Size = UDim2.fromScale(1, 1)
boardScreen.BackgroundColor3 = Color3.fromRGB(9, 13, 24)
boardScreen.Visible = false
boardScreen.ZIndex = 10
boardScreen.Parent = screenGui

-- 1. โซนฝ่ายตรงข้าม (ด้านบน)
local oppBar = Instance.new("Frame")
oppBar.Size = UDim2.new(1, -24, 0, 175)
oppBar.Position = UDim2.fromOffset(12, 48)
oppBar.BackgroundColor3 = Color3.fromRGB(23, 15, 30)
oppBar.BackgroundTransparency = 0.2
oppBar.ZIndex = 11
oppBar.Parent = boardScreen
addCorner(oppBar, 14)
addStroke(oppBar, Color3.fromRGB(220, 38, 38), 1.5, 0.3)

local oppInfoPanel = Instance.new("Frame")
oppInfoPanel.Size = UDim2.fromOffset(220, 160)
oppInfoPanel.Position = UDim2.fromOffset(10, 8)
oppInfoPanel.BackgroundTransparency = 1
oppInfoPanel.ZIndex = 12
oppInfoPanel.Parent = oppBar

local oppLeaderContainer = Instance.new("Frame")
oppLeaderContainer.Size = UDim2.fromOffset(118, 162)
oppLeaderContainer.Position = UDim2.fromOffset(235, 8)
oppLeaderContainer.BackgroundTransparency = 1
oppLeaderContainer.ZIndex = 12
oppLeaderContainer.Parent = oppBar

local oppSlotsContainer = Instance.new("Frame")
oppSlotsContainer.Size = UDim2.fromOffset(390, 162)
oppSlotsContainer.Position = UDim2.new(0.5, -150, 0, 8)
oppSlotsContainer.BackgroundTransparency = 1
oppSlotsContainer.ZIndex = 12
oppSlotsContainer.Parent = oppBar

local oppZonesContainer = Instance.new("Frame")
oppZonesContainer.Size = UDim2.fromOffset(200, 162)
oppZonesContainer.Position = UDim2.new(1, -210, 0, 8)
oppZonesContainer.BackgroundTransparency = 1
oppZonesContainer.ZIndex = 12
oppZonesContainer.Parent = oppBar

-- 2. แถบควบคุมตรงกลางสนาม (Center HUD & Action Bar)
local centerHud = Instance.new("Frame")
centerHud.Size = UDim2.new(1, -24, 0, 52)
centerHud.Position = UDim2.fromOffset(12, 230)
centerHud.BackgroundColor3 = Color3.fromRGB(15, 23, 42)
centerHud.ZIndex = 15
centerHud.Parent = boardScreen
addCorner(centerHud, 12)
addStroke(centerHud, Color3.fromRGB(56, 189, 248), 1.5)

local turnPhaseLabel = Instance.new("TextLabel")
turnPhaseLabel.Size = UDim2.fromOffset(270, 40)
turnPhaseLabel.Position = UDim2.fromOffset(12, 6)
turnPhaseLabel.BackgroundColor3 = Color3.fromRGB(30, 41, 59)
turnPhaseLabel.Font = Enum.Font.GothamBlack
turnPhaseLabel.TextSize = 14
turnPhaseLabel.TextColor3 = Color3.fromRGB(254, 240, 138)
turnPhaseLabel.Text = "Turn 1 • Main Phase"
turnPhaseLabel.ZIndex = 16
turnPhaseLabel.Parent = centerHud
addCorner(turnPhaseLabel, 8)

local latestLogLabel = Instance.new("TextLabel")
latestLogLabel.Size = UDim2.new(1, -590, 1, -12)
latestLogLabel.Position = UDim2.fromOffset(292, 6)
latestLogLabel.BackgroundTransparency = 1
latestLogLabel.Font = Enum.Font.GothamBold
latestLogLabel.TextSize = 13
latestLogLabel.TextColor3 = Color3.fromRGB(226, 232, 240)
latestLogLabel.TextXAlignment = Enum.TextXAlignment.Left
latestLogLabel.TextTruncate = Enum.TextTruncate.AtEnd
latestLogLabel.Text = "🎲 พร้อมเริ่มการดวล!"
latestLogLabel.ZIndex = 16
latestLogLabel.Parent = centerHud

local nextPhaseBtn = Instance.new("TextButton")
nextPhaseBtn.Size = UDim2.fromOffset(185, 38)
nextPhaseBtn.Position = UDim2.new(1, -290, 0, 7)
nextPhaseBtn.BackgroundColor3 = Color3.fromRGB(22, 163, 74)
nextPhaseBtn.Font = Enum.Font.GothamBlack
nextPhaseBtn.TextSize = 14
nextPhaseBtn.TextColor3 = Color3.fromRGB(255, 255, 255)
nextPhaseBtn.Text = "⚔️ เข้าสู่ Battle Phase"
nextPhaseBtn.ZIndex = 16
nextPhaseBtn.Parent = centerHud
addCorner(nextPhaseBtn, 8)
nextPhaseBtn.MouseButton1Click:Connect(function()
	selectedHandIndex = nil
	selectedAttackerSlot = nil
	DuelActionEvent:FireServer({ action = "NEXT_PHASE" })
end)

local surrenderBtn = Instance.new("TextButton")
surrenderBtn.Size = UDim2.fromOffset(90, 38)
surrenderBtn.Position = UDim2.new(1, -98, 0, 7)
surrenderBtn.BackgroundColor3 = Color3.fromRGB(185, 28, 28)
surrenderBtn.Font = Enum.Font.GothamBold
surrenderBtn.TextSize = 13
surrenderBtn.TextColor3 = Color3.fromRGB(255, 255, 255)
surrenderBtn.Text = "🏳️ ยอมแพ้"
surrenderBtn.ZIndex = 16
surrenderBtn.Parent = centerHud
addCorner(surrenderBtn, 8)
surrenderBtn.MouseButton1Click:Connect(function()
	DuelActionEvent:FireServer({ action = "SURRENDER" })
end)

-- 3. โซนสนามฝั่งผู้เล่น (ด้านล่างกลาง)
local playerBar = Instance.new("Frame")
playerBar.Size = UDim2.new(1, -24, 0, 180)
playerBar.Position = UDim2.fromOffset(12, 288)
playerBar.BackgroundColor3 = Color3.fromRGB(15, 23, 42)
playerBar.BackgroundTransparency = 0.15
playerBar.ZIndex = 11
playerBar.Parent = boardScreen
addCorner(playerBar, 14)
addStroke(playerBar, Color3.fromRGB(59, 130, 246), 1.5, 0.3)

local playerInfoPanel = Instance.new("Frame")
playerInfoPanel.Size = UDim2.fromOffset(220, 165)
playerInfoPanel.Position = UDim2.fromOffset(10, 8)
playerInfoPanel.BackgroundTransparency = 1
playerInfoPanel.ZIndex = 12
playerInfoPanel.Parent = playerBar

local playerLeaderContainer = Instance.new("Frame")
playerLeaderContainer.Size = UDim2.fromOffset(118, 165)
playerLeaderContainer.Position = UDim2.fromOffset(235, 8)
playerLeaderContainer.BackgroundTransparency = 1
playerLeaderContainer.ZIndex = 12
playerLeaderContainer.Parent = playerBar

local playerSlotsContainer = Instance.new("Frame")
playerSlotsContainer.Size = UDim2.fromOffset(390, 165)
playerSlotsContainer.Position = UDim2.new(0.5, -150, 0, 8)
playerSlotsContainer.BackgroundTransparency = 1
playerSlotsContainer.ZIndex = 12
playerSlotsContainer.Parent = playerBar

local playerZonesContainer = Instance.new("Frame")
playerZonesContainer.Size = UDim2.fromOffset(200, 165)
playerZonesContainer.Position = UDim2.new(1, -210, 0, 8)
playerZonesContainer.BackgroundTransparency = 1
playerZonesContainer.ZIndex = 12
playerZonesContainer.Parent = playerBar

-- 4. โซนการ์ดบนมือของผู้เล่น (Hand Dock)
local handDock = Instance.new("ScrollingFrame")
handDock.Size = UDim2.new(1, -24, 1, -480)
handDock.Position = UDim2.fromOffset(12, 474)
handDock.BackgroundColor3 = Color3.fromRGB(2, 6, 23)
handDock.BackgroundTransparency = 0.2
handDock.BorderSizePixel = 0
handDock.ScrollBarThickness = 6
handDock.ScrollingDirection = Enum.ScrollingDirection.X
handDock.AutomaticCanvasSize = Enum.AutomaticSize.X
handDock.CanvasSize = UDim2.new(0, 0, 0, 0)
handDock.ZIndex = 14
handDock.Parent = boardScreen
addCorner(handDock, 12)
addStroke(handDock, Color3.fromRGB(71, 85, 105), 1.2)

local handLayout = Instance.new("UIListLayout")
handLayout.FillDirection = Enum.FillDirection.Horizontal
handLayout.HorizontalAlignment = Enum.HorizontalAlignment.Center
handLayout.VerticalAlignment = Enum.VerticalAlignment.Center
handLayout.Padding = UDim.new(0, 10)
handLayout.Parent = handDock

-- ==================== หน้าต่างดูรายการการ์ดในนรก / มิติมืด ====================
local zoneBrowserModal = Instance.new("Frame")
zoneBrowserModal.Size = UDim2.fromOffset(720, 440)
zoneBrowserModal.AnchorPoint = Vector2.new(0.5, 0.5)
zoneBrowserModal.Position = UDim2.fromScale(0.5, 0.5)
zoneBrowserModal.BackgroundColor3 = Color3.fromRGB(15, 23, 42)
zoneBrowserModal.Visible = false
zoneBrowserModal.ZIndex = 75
zoneBrowserModal.Parent = screenGui
addCorner(zoneBrowserModal, 16)
addStroke(zoneBrowserModal, Color3.fromRGB(168, 85, 247), 2)

local zbTitle = Instance.new("TextLabel")
zbTitle.Size = UDim2.new(1, -120, 0, 36)
zbTitle.Position = UDim2.fromOffset(18, 12)
zbTitle.BackgroundTransparency = 1
zbTitle.Font = Enum.Font.GothamBlack
zbTitle.TextSize = 18
zbTitle.TextColor3 = Color3.fromRGB(248, 250, 252)
zbTitle.TextXAlignment = Enum.TextXAlignment.Left
zbTitle.ZIndex = 76
zbTitle.Parent = zoneBrowserModal

local zbCloseBtn = Instance.new("TextButton")
zbCloseBtn.Size = UDim2.fromOffset(90, 32)
zbCloseBtn.Position = UDim2.new(1, -104, 0, 14)
zbCloseBtn.BackgroundColor3 = Color3.fromRGB(220, 38, 38)
zbCloseBtn.Font = Enum.Font.GothamBold
zbCloseBtn.TextSize = 13
zbCloseBtn.TextColor3 = Color3.fromRGB(255, 255, 255)
zbCloseBtn.Text = "✖ ปิด"
zbCloseBtn.ZIndex = 76
zbCloseBtn.Parent = zoneBrowserModal
addCorner(zbCloseBtn, 8)
zbCloseBtn.MouseButton1Click:Connect(function()
	zoneBrowserModal.Visible = false
end)

local zbScroll = Instance.new("ScrollingFrame")
zbScroll.Size = UDim2.new(1, -32, 1, -66)
zbScroll.Position = UDim2.fromOffset(16, 52)
zbScroll.BackgroundColor3 = Color3.fromRGB(2, 6, 23)
zbScroll.BorderSizePixel = 0
zbScroll.ScrollBarThickness = 6
zbScroll.AutomaticCanvasSize = Enum.AutomaticSize.Y
zbScroll.CanvasSize = UDim2.new(0, 0, 0, 0)
zbScroll.ZIndex = 76
zbScroll.Parent = zoneBrowserModal
addCorner(zbScroll, 10)

local zbGrid = Instance.new("UIGridLayout")
zbGrid.CellSize = UDim2.fromOffset(118, 166)
zbGrid.CellPadding = UDim2.fromOffset(10, 10)
zbGrid.Parent = zbScroll

local function openZoneBrowser(title: string, cardList)
	zbTitle.Text = title .. " (คลิกขวาหรือคลิกซ้ายที่การ์ดเพื่อดูรายละเอียด)"
	clearGuiChildren(zbScroll)
	for _, c in ipairs(cardList or {}) do
		local w = createCardWidget(c, {
			onLeftClick = function()
				openCardInspectModal(c)
			end,
		})
		w.ZIndex = 77
		w.Parent = zbScroll
	end
	zoneBrowserModal.Visible = true
end

-- ==================== หน้าต่าง Visual Card Choice Modal (แสดงรูปการ์ดเมื่อค้นหาการ์ดจากสกิล!) ====================
local choiceOverlay = Instance.new("Frame")
choiceOverlay.Name = "VisualChoiceModal"
choiceOverlay.Size = UDim2.fromScale(1, 1)
choiceOverlay.BackgroundColor3 = Color3.fromRGB(2, 6, 23)
choiceOverlay.BackgroundTransparency = 0.35
choiceOverlay.Visible = false
choiceOverlay.ZIndex = 80
choiceOverlay.Parent = screenGui

local choiceWindow = Instance.new("Frame")
choiceWindow.Size = UDim2.fromOffset(760, 470)
choiceWindow.AnchorPoint = Vector2.new(0.5, 0.5)
choiceWindow.Position = UDim2.fromScale(0.5, 0.5)
choiceWindow.BackgroundColor3 = Color3.fromRGB(15, 23, 42)
choiceWindow.ZIndex = 81
choiceWindow.Parent = choiceOverlay
addCorner(choiceWindow, 16)
addStroke(choiceWindow, Color3.fromRGB(250, 204, 21), 2.5)

local choiceTitleLbl = Instance.new("TextLabel")
choiceTitleLbl.Size = UDim2.new(1, -32, 0, 32)
choiceTitleLbl.Position = UDim2.fromOffset(16, 14)
choiceTitleLbl.BackgroundTransparency = 1
choiceTitleLbl.Font = Enum.Font.GothamBlack
choiceTitleLbl.TextSize = 20
choiceTitleLbl.TextColor3 = Color3.fromRGB(254, 240, 138)
choiceTitleLbl.TextXAlignment = Enum.TextXAlignment.Left
choiceTitleLbl.ZIndex = 82
choiceTitleLbl.Parent = choiceWindow

local choiceDescLbl = Instance.new("TextLabel")
choiceDescLbl.Size = UDim2.new(1, -32, 0, 24)
choiceDescLbl.Position = UDim2.fromOffset(16, 46)
choiceDescLbl.BackgroundTransparency = 1
choiceDescLbl.Font = Enum.Font.GothamBold
choiceDescLbl.TextSize = 14
choiceDescLbl.TextColor3 = Color3.fromRGB(203, 213, 225)
choiceDescLbl.TextXAlignment = Enum.TextXAlignment.Left
choiceDescLbl.ZIndex = 82
choiceDescLbl.Parent = choiceWindow

local choiceCardGridScroll = Instance.new("ScrollingFrame")
choiceCardGridScroll.Size = UDim2.new(1, -32, 0, 290)
choiceCardGridScroll.Position = UDim2.fromOffset(16, 76)
choiceCardGridScroll.BackgroundColor3 = Color3.fromRGB(2, 6, 23)
choiceCardGridScroll.BackgroundTransparency = 0.3
choiceCardGridScroll.BorderSizePixel = 0
choiceCardGridScroll.ScrollBarThickness = 6
choiceCardGridScroll.AutomaticCanvasSize = Enum.AutomaticSize.Y
choiceCardGridScroll.CanvasSize = UDim2.new(0, 0, 0, 0)
choiceCardGridScroll.ZIndex = 82
choiceCardGridScroll.Parent = choiceWindow
addCorner(choiceCardGridScroll, 10)

local choiceGridLayout = Instance.new("UIGridLayout")
choiceGridLayout.CellSize = UDim2.fromOffset(122, 172)
choiceGridLayout.CellPadding = UDim2.fromOffset(12, 12)
choiceGridLayout.HorizontalAlignment = Enum.HorizontalAlignment.Center
choiceGridLayout.Parent = choiceCardGridScroll

local choiceActionBtnRow = Instance.new("ScrollingFrame")
choiceActionBtnRow.Size = UDim2.new(1, -32, 0, 80)
choiceActionBtnRow.Position = UDim2.fromOffset(16, 376)
choiceActionBtnRow.BackgroundTransparency = 1
choiceActionBtnRow.BorderSizePixel = 0
choiceActionBtnRow.ScrollBarThickness = 4
choiceActionBtnRow.AutomaticCanvasSize = Enum.AutomaticSize.Y
choiceActionBtnRow.CanvasSize = UDim2.new(0, 0, 0, 0)
choiceActionBtnRow.ZIndex = 82
choiceActionBtnRow.Parent = choiceWindow

local choiceActionLayout = Instance.new("UIListLayout")
choiceActionLayout.Padding = UDim.new(0, 6)
choiceActionLayout.Parent = choiceActionBtnRow

-- ==================== หน้าต่าง Mulligan เปลี่ยนการ์ดเริ่มต้น ====================
local mulliganOverlay = Instance.new("Frame")
mulliganOverlay.Size = UDim2.fromScale(1, 1)
mulliganOverlay.BackgroundColor3 = Color3.fromRGB(2, 6, 23)
mulliganOverlay.BackgroundTransparency = 0.25
mulliganOverlay.Visible = false
mulliganOverlay.ZIndex = 78
mulliganOverlay.Parent = screenGui

local mulliganBox = Instance.new("Frame")
mulliganBox.Size = UDim2.fromOffset(740, 360)
mulliganBox.AnchorPoint = Vector2.new(0.5, 0.5)
mulliganBox.Position = UDim2.fromScale(0.5, 0.5)
mulliganBox.BackgroundColor3 = Color3.fromRGB(15, 23, 42)
mulliganBox.ZIndex = 79
mulliganBox.Parent = mulliganOverlay
addCorner(mulliganBox, 16)
addStroke(mulliganBox, Color3.fromRGB(56, 189, 248), 2)

local mulTitle = Instance.new("TextLabel")
mulTitle.Size = UDim2.new(1, -32, 0, 34)
mulTitle.Position = UDim2.fromOffset(16, 14)
mulTitle.BackgroundTransparency = 1
mulTitle.Font = Enum.Font.GothamBlack
mulTitle.TextSize = 20
mulTitle.TextColor3 = Color3.fromRGB(254, 240, 138)
mulTitle.Text = "🔄 ช่วง Mulligan: คลิกซ้ายเลือกการ์ดที่จะเปลี่ยน (สูงสุด 2 ใบ) • คลิกขวาดูรายละเอียด"
mulTitle.ZIndex = 80
mulTitle.Parent = mulliganBox

local mulCardsFrame = Instance.new("Frame")
mulCardsFrame.Size = UDim2.new(1, -32, 0, 195)
mulCardsFrame.Position = UDim2.fromOffset(16, 60)
mulCardsFrame.BackgroundTransparency = 1
mulCardsFrame.ZIndex = 80
mulCardsFrame.Parent = mulliganBox

local mulLayout = Instance.new("UIListLayout")
mulLayout.FillDirection = Enum.FillDirection.Horizontal
mulLayout.HorizontalAlignment = Enum.HorizontalAlignment.Center
mulLayout.VerticalAlignment = Enum.VerticalAlignment.Center
mulLayout.Padding = UDim.new(0, 14)
mulLayout.Parent = mulCardsFrame

local mulConfirmBtn = Instance.new("TextButton")
mulConfirmBtn.Size = UDim2.fromOffset(280, 46)
mulConfirmBtn.AnchorPoint = Vector2.new(0.5, 0)
mulConfirmBtn.Position = UDim2.new(0.5, 0, 1, -64)
mulConfirmBtn.BackgroundColor3 = Color3.fromRGB(22, 163, 74)
mulConfirmBtn.Font = Enum.Font.GothamBlack
mulConfirmBtn.TextSize = 16
mulConfirmBtn.TextColor3 = Color3.fromRGB(255, 255, 255)
mulConfirmBtn.Text = "✅ ยืนยันการ์ดเริ่มต้นและเริ่มเกม!"
mulConfirmBtn.ZIndex = 80
mulConfirmBtn.Parent = mulliganBox
addCorner(mulConfirmBtn, 10)

mulConfirmBtn.MouseButton1Click:Connect(function()
	local indices = {}
	for idx, sel in pairs(mulliganSelected) do
		if sel then
			table.insert(indices, idx)
		end
	end
	mulliganSelected = {}
	mulliganOverlay.Visible = false
	DuelActionEvent:FireServer({
		action = "MULLIGAN",
		indices = indices,
	})
end)

-- ==================== หน้าต่างสรุปผลจบเกม (Victory / Defeat Banner) ====================
local gameOverModal = Instance.new("Frame")
gameOverModal.Size = UDim2.fromOffset(480, 260)
gameOverModal.AnchorPoint = Vector2.new(0.5, 0.5)
gameOverModal.Position = UDim2.fromScale(0.5, 0.5)
gameOverModal.BackgroundColor3 = Color3.fromRGB(15, 23, 42)
gameOverModal.Visible = false
gameOverModal.ZIndex = 88
gameOverModal.Parent = screenGui
addCorner(gameOverModal, 18)
local goStroke = addStroke(gameOverModal, Color3.fromRGB(250, 204, 21), 3)

local goTitle = Instance.new("TextLabel")
goTitle.Size = UDim2.new(1, -24, 0, 56)
goTitle.Position = UDim2.fromOffset(12, 24)
goTitle.BackgroundTransparency = 1
goTitle.Font = Enum.Font.GothamBlack
goTitle.TextSize = 30
goTitle.TextColor3 = Color3.fromRGB(254, 240, 138)
goTitle.ZIndex = 89
goTitle.Parent = gameOverModal

local goSub = Instance.new("TextLabel")
goSub.Size = UDim2.new(1, -32, 0, 60)
goSub.Position = UDim2.fromOffset(16, 86)
goSub.BackgroundTransparency = 1
goSub.Font = Enum.Font.GothamBold
goSub.TextSize = 15
goSub.TextColor3 = Color3.fromRGB(226, 232, 240)
goSub.TextWrapped = true
goSub.ZIndex = 89
goSub.Parent = gameOverModal

local goBackLobbyBtn = Instance.new("TextButton")
goBackLobbyBtn.Size = UDim2.fromOffset(260, 48)
goBackLobbyBtn.AnchorPoint = Vector2.new(0.5, 0)
goBackLobbyBtn.Position = UDim2.new(0.5, 0, 1, -70)
goBackLobbyBtn.BackgroundColor3 = Color3.fromRGB(217, 119, 6)
goBackLobbyBtn.Font = Enum.Font.GothamBlack
goBackLobbyBtn.TextSize = 16
goBackLobbyBtn.TextColor3 = Color3.fromRGB(15, 23, 42)
goBackLobbyBtn.Text = "🏠 กลับสู่เมนู แบทเทิล ออฟ เฟรน"
goBackLobbyBtn.ZIndex = 89
goBackLobbyBtn.Parent = gameOverModal
addCorner(goBackLobbyBtn, 12)
goBackLobbyBtn.MouseButton1Click:Connect(function()
	gameOverModal.Visible = false
	boardScreen.Visible = false
	mapFloatingBar.Visible = false
	hubScreen.Visible = true
	currentMatchState = nil
	renderActiveHubTab()
end)

-- ==================== ฟังก์ชันวาดกระดานดวลทั้งหมดจาก Match State ====================
local function renderDuelState(state)
	currentMatchState = state
	boardScreen.Visible = true
	hubScreen.Visible = false
	mapFloatingBar.Visible = false

	local me = state.player
	local opp = state.opponent
	local isMyTurn = state.isMyTurn
	local pending = state.pendingPrompt

	local turnOwnerText = isMyTurn and "🟢 เทิร์นของคุณ" or ("🔴 เทิร์นของ " .. opp.name)
	turnPhaseLabel.Text = string.format("Turn %d • %s (%s)", state.turnCount, state.phase, turnOwnerText)
	latestLogLabel.Text = state.latestLog or ""

	if pending and pending.kind == "TARGET" then
		latestLogLabel.Text = "🎯 " .. (pending.promptText or "คลิกเลือกเป้าหมาย")
		latestLogLabel.TextColor3 = Color3.fromRGB(250, 204, 21)
	elseif selectedHandIndex then
		latestLogLabel.Text = "👉 คลิกเลือกช่อง Monster Zone ฝั่งเรา (1, 2 หรือ 3) เพื่อวางการ์ดลงสนาม!"
		latestLogLabel.TextColor3 = Color3.fromRGB(74, 222, 128)
	elseif selectedAttackerSlot then
		latestLogLabel.Text = "⚔️ คลิกเลือกเป้าหมายโจมตีของฝ่ายตรงข้าม (ยูนิตศัตรู หรือ การ์ด Leader ศัตรู)!"
		latestLogLabel.TextColor3 = Color3.fromRGB(248, 113, 113)
	else
		latestLogLabel.TextColor3 = Color3.fromRGB(226, 232, 240)
	end

	nextPhaseBtn.Visible = isMyTurn and not state.gameOver and (state.phase == "Main Phase" or state.phase == "Battle Phase")
	if state.phase == "Main Phase" then
		nextPhaseBtn.Text = "⚔️ เข้าสู่ Battle Phase"
		nextPhaseBtn.BackgroundColor3 = Color3.fromRGB(217, 119, 6)
	else
		nextPhaseBtn.Text = "⏭️ จบเทิร์น (End Turn)"
		nextPhaseBtn.BackgroundColor3 = Color3.fromRGB(37, 99, 235)
	end

	-- วาดโซนฝ่ายตรงข้าม
	clearGuiChildren(oppInfoPanel)
	local oppNameLbl = Instance.new("TextLabel")
	oppNameLbl.Size = UDim2.new(1, 0, 0, 28)
	oppNameLbl.BackgroundTransparency = 1
	oppNameLbl.Font = Enum.Font.GothamBlack
	oppNameLbl.TextSize = 16
	oppNameLbl.TextColor3 = Color3.fromRGB(248, 113, 113)
	oppNameLbl.TextXAlignment = Enum.TextXAlignment.Left
	oppNameLbl.Text = "🆚 " .. opp.name
	oppNameLbl.Parent = oppInfoPanel

	local oppStatsLbl = Instance.new("TextLabel")
	oppStatsLbl.Size = UDim2.new(1, 0, 0, 80)
	oppStatsLbl.Position = UDim2.fromOffset(0, 32)
	oppStatsLbl.BackgroundTransparency = 1
	oppStatsLbl.Font = Enum.Font.GothamBold
	oppStatsLbl.TextSize = 13
	oppStatsLbl.TextColor3 = Color3.fromRGB(203, 213, 225)
	oppStatsLbl.TextXAlignment = Enum.TextXAlignment.Left
	oppStatsLbl.TextYAlignment = Enum.TextYAlignment.Top
	oppStatsLbl.Text = string.format(
		"❤️ HP หลีดเดอร์: %d / %d\n🤚 การ์ดบนมือ: %d ใบ\n📚 กองการ์ด: %d ใบ\n(คลิกขวาที่การ์ดเพื่อดูสกิล)",
		opp.leader.hp,
		opp.leader.maxHp,
		opp.handCount,
		opp.deckCount
	)
	oppStatsLbl.Parent = oppInfoPanel

	clearGuiChildren(oppLeaderContainer)
	local canAttackEnemyLeader = (isMyTurn and state.phase == "Battle Phase" and selectedAttackerSlot ~= nil)
	local oppLeaderWidget = createCardWidget(opp.leader, {
		width = 114,
		height = 158,
		isHighlighted = canAttackEnemyLeader,
		highlightColor = canAttackEnemyLeader and Color3.fromRGB(239, 68, 68) or nil,
		onLeftClick = function()
			-- คลิกซ้ายที่ Leader ศัตรู = โจมตีเท่านั้น (ไม่เปิดหน้าต่างรายละเอียดตามคำสั่งผู้ใช้!)
			if selectedAttackerSlot ~= nil then
				local atkSlot = selectedAttackerSlot
				selectedAttackerSlot = nil
				DuelActionEvent:FireServer({
					action = "DECLARE_ATTACK",
					attackerSlot = atkSlot,
					targetType = "leader",
				})
			end
		end,
	})
	oppLeaderWidget.Parent = oppLeaderContainer

	clearGuiChildren(oppSlotsContainer)
	for slotIdx = 1, 3 do
		local xPos = (slotIdx - 1) * 130
		local unit = opp.board[slotIdx]
		local isTargetPrompt = pending
			and pending.kind == "TARGET"
			and (pending.targetZone == "OPPONENT_BOARD" or pending.targetZone == "ANY_BOARD")
		local canAttackUnit = (isMyTurn and state.phase == "Battle Phase" and selectedAttackerSlot ~= nil and unit ~= nil)

		if unit then
			local w = createCardWidget(unit, {
				width = 115,
				height = 156,
				showRestState = true,
				isHighlighted = isTargetPrompt or canAttackUnit,
				highlightColor = (isTargetPrompt or canAttackUnit) and Color3.fromRGB(239, 68, 68) or nil,
				onLeftClick = function()
					if isTargetPrompt then
						DuelActionEvent:FireServer({
							action = "TARGET_RESPONSE",
							zone = "ENEMY_BOARD",
							index = slotIdx,
						})
						return
					end
					if selectedAttackerSlot ~= nil then
						local atkSlot = selectedAttackerSlot
						selectedAttackerSlot = nil
						DuelActionEvent:FireServer({
							action = "DECLARE_ATTACK",
							attackerSlot = atkSlot,
							targetType = "monster",
							targetSlot = slotIdx,
						})
					end
				end,
			})
			w.Position = UDim2.fromOffset(xPos, 0)
			w.Parent = oppSlotsContainer
		else
			local emptySlot = Instance.new("Frame")
			emptySlot.Size = UDim2.fromOffset(115, 156)
			emptySlot.Position = UDim2.fromOffset(xPos, 0)
			emptySlot.BackgroundColor3 = Color3.fromRGB(15, 23, 42)
			emptySlot.BackgroundTransparency = 0.45
			emptySlot.Parent = oppSlotsContainer
			addCorner(emptySlot, 10)
			addStroke(emptySlot, Color3.fromRGB(71, 85, 105), 1.2, 0.4)

			local lbl = Instance.new("TextLabel")
			lbl.Size = UDim2.fromScale(1, 1)
			lbl.BackgroundTransparency = 1
			lbl.Font = Enum.Font.GothamBold
			lbl.TextSize = 12
			lbl.TextColor3 = Color3.fromRGB(100, 116, 139)
			lbl.Text = "ช่องศัตรู #" .. tostring(slotIdx)
			lbl.Parent = emptySlot
		end
	end

	clearGuiChildren(oppZonesContainer)
	local oppGraveBtn = Instance.new("TextButton")
	oppGraveBtn.Size = UDim2.new(1, 0, 0, 44)
	oppGraveBtn.Position = UDim2.fromOffset(0, 16)
	oppGraveBtn.BackgroundColor3 = Color3.fromRGB(88, 28, 135)
	oppGraveBtn.Font = Enum.Font.GothamBold
	oppGraveBtn.TextSize = 13
	oppGraveBtn.TextColor3 = Color3.fromRGB(255, 255, 255)
	oppGraveBtn.Text = string.format("🔥 นรกศัตรู (%d ใบ)", #opp.graveyard)
	oppGraveBtn.Parent = oppZonesContainer
	addCorner(oppGraveBtn, 8)
	oppGraveBtn.MouseButton1Click:Connect(function()
		openZoneBrowser("🔥 กองนรกของ " .. opp.name, opp.graveyard)
	end)

	local oppDarkBtn = Instance.new("TextButton")
	oppDarkBtn.Size = UDim2.new(1, 0, 0, 44)
	oppDarkBtn.Position = UDim2.fromOffset(0, 72)
	oppDarkBtn.BackgroundColor3 = Color3.fromRGB(30, 41, 59)
	oppDarkBtn.Font = Enum.Font.GothamBold
	oppDarkBtn.TextSize = 13
	oppDarkBtn.TextColor3 = Color3.fromRGB(192, 132, 252)
	oppDarkBtn.Text = string.format("🌌 มิติมืดศัตรู (%d ใบ)", #opp.darkDimension)
	oppDarkBtn.Parent = oppZonesContainer
	addCorner(oppDarkBtn, 8)
	oppDarkBtn.MouseButton1Click:Connect(function()
		openZoneBrowser("🌌 มิติมืดของ " .. opp.name, opp.darkDimension)
	end)

	-- วาดโซนผู้เล่น
	clearGuiChildren(playerInfoPanel)
	local myNameLbl = Instance.new("TextLabel")
	myNameLbl.Size = UDim2.new(1, 0, 0, 26)
	myNameLbl.BackgroundTransparency = 1
	myNameLbl.Font = Enum.Font.GothamBlack
	myNameLbl.TextSize = 16
	myNameLbl.TextColor3 = Color3.fromRGB(96, 165, 250)
	myNameLbl.TextXAlignment = Enum.TextXAlignment.Left
	myNameLbl.Text = "🛡️ " .. me.name
	myNameLbl.Parent = playerInfoPanel

	local myStatsLbl = Instance.new("TextLabel")
	myStatsLbl.Size = UDim2.new(1, 0, 0, 72)
	myStatsLbl.Position = UDim2.fromOffset(0, 28)
	myStatsLbl.BackgroundTransparency = 1
	myStatsLbl.Font = Enum.Font.GothamBold
	myStatsLbl.TextSize = 13
	myStatsLbl.TextColor3 = Color3.fromRGB(203, 213, 225)
	myStatsLbl.TextXAlignment = Enum.TextXAlignment.Left
	myStatsLbl.TextYAlignment = Enum.TextYAlignment.Top
	myStatsLbl.Text = string.format(
		"❤️ HP หลีดเดอร์: %d / %d\n📚 กองการ์ด: %d ใบ\n✨ โควต้าเวท: %d / 1",
		me.leader.hp,
		me.leader.maxHp,
		me.deckCount,
		1 - (me.spellQuota and me.spellQuota.normalUsed or 0)
	)
	myStatsLbl.Parent = playerInfoPanel

	if me.leader.hasActiveSkill then
		local leaderSkillBtn = Instance.new("TextButton")
		leaderSkillBtn.Size = UDim2.new(1, -10, 0, 38)
		leaderSkillBtn.Position = UDim2.fromOffset(0, 110)
		local canUseLeader = isMyTurn and state.phase == "Main Phase" and not me.leader.abilityUsedThisTurn and not pending
		leaderSkillBtn.BackgroundColor3 = canUseLeader and Color3.fromRGB(234, 179, 8) or Color3.fromRGB(51, 65, 85)
		leaderSkillBtn.Font = Enum.Font.GothamBlack
		leaderSkillBtn.TextSize = 13
		leaderSkillBtn.TextColor3 = canUseLeader and Color3.fromRGB(15, 23, 42) or Color3.fromRGB(148, 163, 184)
		leaderSkillBtn.Text = me.leader.abilityUsedThisTurn and "👑 ใช้สกิล Leader ไปแล้ว" or "👑 กดใช้สกิล Leader!"
		leaderSkillBtn.Parent = playerInfoPanel
		addCorner(leaderSkillBtn, 8)
		leaderSkillBtn.MouseButton1Click:Connect(function()
			if canUseLeader then
				DuelActionEvent:FireServer({ action = "ACTIVATE_LEADER" })
			end
		end)
	end

	clearGuiChildren(playerLeaderContainer)
	local myLeaderWidget = createCardWidget(me.leader, {
		width = 114,
		height = 158,
		onLeftClick = function()
			if isMyTurn and state.phase == "Main Phase" and me.leader.hasActiveSkill and not me.leader.abilityUsedThisTurn then
				DuelActionEvent:FireServer({ action = "ACTIVATE_LEADER" })
			end
		end,
	})
	myLeaderWidget.Parent = playerLeaderContainer

	clearGuiChildren(playerSlotsContainer)
	for slotIdx = 1, 3 do
		local xPos = (slotIdx - 1) * 130
		local unit = me.board[slotIdx]
		local isTargetPrompt = pending
			and pending.kind == "TARGET"
			and (pending.targetZone == "PLAYER_BOARD" or pending.targetZone == "ANY_BOARD")
		local isSelectingSlotForSummon = (selectedHandIndex ~= nil)
		local isSelectedAttacker = (selectedAttackerSlot == slotIdx)

		if unit then
			local w = createCardWidget(unit, {
				width = 115,
				height = 156,
				showRestState = true,
				isHighlighted = isTargetPrompt or isSelectingSlotForSummon or isSelectedAttacker,
				highlightColor = isSelectedAttacker and Color3.fromRGB(250, 204, 21)
					or (isSelectingSlotForSummon and Color3.fromRGB(74, 222, 128) or Color3.fromRGB(56, 189, 248)),
				onActivateSkill = (isMyTurn and state.phase == "Main Phase" and not pending) and function()
					DuelActionEvent:FireServer({
						action = "ACTIVATE_MONSTER",
						slotIndex = slotIdx,
					})
				end or nil,
				onLeftClick = function()
					if isTargetPrompt then
						DuelActionEvent:FireServer({
							action = "TARGET_RESPONSE",
							zone = "SELF_BOARD",
							index = slotIdx,
						})
						return
					end
					if selectedHandIndex ~= nil then
						local hIdx = selectedHandIndex
						selectedHandIndex = nil
						DuelActionEvent:FireServer({
							action = "PLAY_CARD",
							handIndex = hIdx,
							targetSlot = slotIdx,
						})
						return
					end
					if isMyTurn and state.phase == "Battle Phase" and unit.state == "Stand" then
						if selectedAttackerSlot == slotIdx then
							selectedAttackerSlot = nil
						else
							selectedAttackerSlot = slotIdx
						end
						renderDuelState(currentMatchState)
					end
				end,
			})
			w.Position = UDim2.fromOffset(xPos, 0)
			w.Parent = playerSlotsContainer
		else
			local emptyBtn = Instance.new("TextButton")
			emptyBtn.Size = UDim2.fromOffset(115, 156)
			emptyBtn.Position = UDim2.fromOffset(xPos, 0)
			emptyBtn.BackgroundColor3 = isSelectingSlotForSummon and Color3.fromRGB(20, 83, 45) or Color3.fromRGB(15, 23, 42)
			emptyBtn.BackgroundTransparency = isSelectingSlotForSummon and 0.15 or 0.45
			emptyBtn.Font = Enum.Font.GothamBold
			emptyBtn.TextSize = 12
			emptyBtn.TextColor3 = isSelectingSlotForSummon and Color3.fromRGB(134, 239, 172) or Color3.fromRGB(148, 163, 184)
			emptyBtn.Text = isSelectingSlotForSummon and ("📥 ลงช่องที่ " .. tostring(slotIdx)) or ("ช่องของเรา #" .. tostring(slotIdx))
			emptyBtn.Parent = playerSlotsContainer
			addCorner(emptyBtn, 10)
			addStroke(
				emptyBtn,
				isSelectingSlotForSummon and Color3.fromRGB(74, 222, 128) or Color3.fromRGB(71, 85, 105),
				isSelectingSlotForSummon and 2.5 or 1.2
			)

			emptyBtn.MouseButton1Click:Connect(function()
				if isTargetPrompt then
					DuelActionEvent:FireServer({
						action = "TARGET_RESPONSE",
						zone = "SELF_BOARD",
						index = slotIdx,
					})
					return
				end
				if selectedHandIndex ~= nil then
					local hIdx = selectedHandIndex
					selectedHandIndex = nil
					DuelActionEvent:FireServer({
						action = "PLAY_CARD",
						handIndex = hIdx,
						targetSlot = slotIdx,
					})
				end
			end)
		end
	end

	clearGuiChildren(playerZonesContainer)
	local myGraveBtn = Instance.new("TextButton")
	myGraveBtn.Size = UDim2.new(1, 0, 0, 44)
	myGraveBtn.Position = UDim2.fromOffset(0, 16)
	myGraveBtn.BackgroundColor3 = Color3.fromRGB(124, 58, 237)
	myGraveBtn.Font = Enum.Font.GothamBold
	myGraveBtn.TextSize = 13
	myGraveBtn.TextColor3 = Color3.fromRGB(255, 255, 255)
	myGraveBtn.Text = string.format("🔥 นรกของเรา (%d ใบ)", #me.graveyard)
	myGraveBtn.Parent = playerZonesContainer
	addCorner(myGraveBtn, 8)
	myGraveBtn.MouseButton1Click:Connect(function()
		openZoneBrowser("🔥 กองนรกของเรา", me.graveyard)
	end)

	local myDarkBtn = Instance.new("TextButton")
	myDarkBtn.Size = UDim2.new(1, 0, 0, 44)
	myDarkBtn.Position = UDim2.fromOffset(0, 72)
	myDarkBtn.BackgroundColor3 = Color3.fromRGB(30, 41, 59)
	myDarkBtn.Font = Enum.Font.GothamBold
	myDarkBtn.TextSize = 13
	myDarkBtn.TextColor3 = Color3.fromRGB(192, 132, 252)
	myDarkBtn.Text = string.format("🌌 มิติมืดของเรา (%d ใบ)", #me.darkDimension)
	myDarkBtn.Parent = playerZonesContainer
	addCorner(myDarkBtn, 8)
	myDarkBtn.MouseButton1Click:Connect(function()
		openZoneBrowser("🌌 มิติมืดของเรา", me.darkDimension)
	end)

	clearGuiChildren(handDock)
	local isHandTargetPrompt = pending and pending.kind == "TARGET" and pending.targetZone == "PLAYER_HAND"
	for hIdx, card in ipairs(me.hand) do
		local isChosenHand = (selectedHandIndex == hIdx)
		local w = createCardWidget(card, {
			width = 112,
			height = 156,
			isHighlighted = isChosenHand or isHandTargetPrompt or card.canHybridSummon,
			highlightColor = isChosenHand and Color3.fromRGB(250, 204, 21)
				or (isHandTargetPrompt and Color3.fromRGB(239, 68, 68) or nil),
			onLeftClick = function()
				if isHandTargetPrompt then
					DuelActionEvent:FireServer({
						action = "TARGET_RESPONSE",
						zone = "SELF_HAND",
						index = hIdx,
					})
					return
				end
				if not isMyTurn or state.phase ~= "Main Phase" or pending then
					return
				end
				if card.type == "NormalSpell" or card.type == "ReactionSpell" or card.hybridMaterials or card.futureBaseId or card.isSpy then
					selectedHandIndex = nil
					DuelActionEvent:FireServer({
						action = "PLAY_CARD",
						handIndex = hIdx,
					})
					return
				end
				if selectedHandIndex == hIdx then
					selectedHandIndex = nil
					DuelActionEvent:FireServer({
						action = "PLAY_CARD",
						handIndex = hIdx,
					})
				else
					selectedHandIndex = hIdx
					renderDuelState(currentMatchState)
				end
			end,
		})
		w.Parent = handDock
	end

	if state.phase == "Mulligan" and not me.mulliganDone then
		mulliganOverlay.Visible = true
		clearGuiChildren(mulCardsFrame)
		for idx, c in ipairs(me.hand) do
			local isSel = mulliganSelected[idx] == true
			local w = createCardWidget(c, {
				width = 118,
				height = 168,
				isHighlighted = isSel,
				highlightColor = isSel and Color3.fromRGB(239, 68, 68) or Color3.fromRGB(71, 85, 105),
				zoneBadge = isSel and "🔄 เปลี่ยนใบนี้" or nil,
				onLeftClick = function()
					if mulliganSelected[idx] then
						mulliganSelected[idx] = nil
					else
						local cnt = 0
						for _, v in pairs(mulliganSelected) do
							if v then
								cnt += 1
							end
						end
						if cnt >= 2 then
							showToast("เลือกเปลี่ยนการ์ดได้สูงสุด 2 ใบ!")
							return
						end
						mulliganSelected[idx] = true
					end
					renderDuelState(currentMatchState)
				end,
			})
			w.Parent = mulCardsFrame
		end
	else
		mulliganOverlay.Visible = false
	end

	if pending and pending.kind == "CHOICE" then
		choiceOverlay.Visible = true
		choiceTitleLbl.Text = pending.title or "⚡ เลือกทำงานความสามารถ"
		choiceDescLbl.Text = (pending.description or "คลิกซ้ายที่รูปการ์ดเพื่อเลือก") .. " (คลิกขวาที่การ์ดเพื่อดูรายละเอียด)"
		clearGuiChildren(choiceCardGridScroll)
		clearGuiChildren(choiceActionBtnRow)

		local hasCardOptions = false
		for _, opt in ipairs(pending.options or {}) do
			if opt.cardId then
				hasCardOptions = true
				local tmpl = CardDatabase.getCardById(opt.cardId) or {
					id = opt.cardId,
					name = opt.label,
					type = "Monster",
				}
				local w = createCardWidget(tmpl, {
					width = 122,
					height = 172,
					zoneBadge = opt.zoneBadge or opt.label,
					isHighlighted = not opt.disabled,
					highlightColor = hexToColor3(opt.color),
					onLeftClick = function()
						if not opt.disabled then
							choiceOverlay.Visible = false
							DuelActionEvent:FireServer({
								action = "CHOICE_RESPONSE",
								optionIndex = opt.index,
							})
						end
					end,
				})
				w.ZIndex = 83
				w.Parent = choiceCardGridScroll
			else
				local actBtn = Instance.new("TextButton")
				actBtn.Size = UDim2.new(1, -12, 0, 36)
				actBtn.BackgroundColor3 = opt.disabled and Color3.fromRGB(51, 65, 85) or hexToColor3(opt.color)
				actBtn.Font = Enum.Font.GothamBold
				actBtn.TextSize = 14
				actBtn.TextColor3 = Color3.fromRGB(255, 255, 255)
				actBtn.Text = opt.label
				actBtn.ZIndex = 83
				actBtn.Parent = choiceActionBtnRow
				addCorner(actBtn, 8)
				actBtn.MouseButton1Click:Connect(function()
					if not opt.disabled then
						choiceOverlay.Visible = false
						DuelActionEvent:FireServer({
							action = "CHOICE_RESPONSE",
							optionIndex = opt.index,
						})
					end
				end)
			end
		end
		choiceCardGridScroll.Visible = hasCardOptions
		if hasCardOptions then
			choiceActionBtnRow.Position = UDim2.fromOffset(16, 376)
			choiceActionBtnRow.Size = UDim2.new(1, -32, 0, 80)
		else
			choiceActionBtnRow.Position = UDim2.fromOffset(16, 86)
			choiceActionBtnRow.Size = UDim2.new(1, -32, 0, 360)
		end
	else
		choiceOverlay.Visible = false
	end

	if state.gameOver then
		gameOverModal.Visible = true
		if state.isWinner then
			goTitle.Text = "🏆 VICTORY! (+600🪙 +1★)"
			goTitle.TextColor3 = Color3.fromRGB(250, 204, 21)
			goStroke.Color = Color3.fromRGB(250, 204, 21)
		else
			goTitle.Text = "💀 DEFEAT! (+200🪙)"
			goTitle.TextColor3 = Color3.fromRGB(248, 113, 113)
			goStroke.Color = Color3.fromRGB(239, 68, 68)
		end
		goSub.Text = state.latestLog or "จบการดวล แบทเทิล ออฟ เฟรน"
	else
		gameOverModal.Visible = false
	end
end

-- ==================== รับข้อมูลจากเซิร์ฟเวอร์ ====================
DuelStateEvent.OnClientEvent:Connect(function(packet)
	if type(packet) ~= "table" then
		return
	end
	if packet.packetType == "MATCH_STATE" and packet.state then
		renderDuelState(packet.state)
	elseif packet.packetType == "PROFILE_SYNC" and packet.profile then
		myProfile = packet.profile
		if hubScreen.Visible then
			renderActiveHubTab()
		end
	elseif packet.packetType == "PACK_OPENED" and packet.cards then
		showPackOpenedModal(packet.cards)
	elseif packet.packetType == "ROOM_LIST" then
		openRoomsList = packet.rooms or {}
		if hubScreen.Visible and currentSidebarTab == "PVP_ROOM" then
			renderActiveHubTab()
		end
	elseif packet.packetType == "NOTIFY" and packet.message then
		showToast(packet.message)
	end
end)

-- วาดหน้าจอเริ่มต้นทันทีและขอข้อมูลโปรไฟล์จากเซิร์ฟเวอร์
renderActiveHubTab()
DuelActionEvent:FireServer({ action = "REQUEST_PROFILE" })

print("🎮 [แบทเทิล ออฟ เฟรน] BOF_Client (BuddyTime UI Edition) โหลดเสร็จสมบูรณ์!")
