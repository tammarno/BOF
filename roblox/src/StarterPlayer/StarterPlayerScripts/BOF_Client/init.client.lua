--!nonstrict
--[[
	============================================================================
	BATTLE OF FRIENDS (แบทเทิล ออฟ เฟรน) — ระบบหน้าจอและตัวควบคุมฝั่งผู้เล่น (BOF_Client)
	วางไว้ที่: StarterPlayer > StarterPlayerScripts > BOF_Client (LocalScript)
	ฟีเจอร์ครบถ้วนตรงตามเวอร์ชันเว็บ:
	  - หน้าล็อบบี้ "แบทเทิล ออฟ เฟรน", เลือกเด็ค 4 เผ่า (จิต, ขุนเหนือ, วันสิ้นโลก, ไดโน), จัดเด็ค 20 ใบ
	  - ดวลกับบอท AI (Easy / Medium / Hard) หรือดวลกับเพื่อน PvP (ผ่านห้องหรือโต๊ะดวล 3D ในแมพ)
	  - กระดานดวลครบทุกโซน: Leader, Monster 3 ช่อง, Hand, Deck, นรก (Graveyard), มิติมืด (Dark Dimension)
	  - ระบบค้นหา/เลือกการ์ดจากสกิล แสดงเป็น "รูปการ์ดจริงแบบ Grid" (Visual Card Grid Picker)
	  - ระบบดูรายละเอียดการ์ดด้วย "คลิกขวา (Right-Click / MouseButton2Click)" เท่านั้น!
	    คลิกซ้ายที่การ์ดหรือหลีดเดอร์ใช้สำหรับสั่งโจมตี/สั่งเล่นการ์ดโดยไม่เด้งหน้าต่างรายละเอียดมารบกวน
	============================================================================
]]

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local TweenService = game:GetService("TweenService")

local localPlayer = Players.LocalPlayer
local playerGui = localPlayer:WaitForChild("PlayerGui")

local BOF_Shared = ReplicatedStorage:WaitForChild("BOF_Shared")
local CardDatabase = require(BOF_Shared:WaitForChild("CardDatabase"))

local BOF_Remotes = ReplicatedStorage:WaitForChild("BOF_Remotes")
local DuelActionEvent = BOF_Remotes:WaitForChild("DuelAction") :: RemoteEvent
local DuelStateEvent = BOF_Remotes:WaitForChild("DuelState") :: RemoteEvent

-- ==================== สถานะฝั่ง Client ====================
local currentMatchState = nil
local selectedLeaderId = "L01"
local customMainDeck = CardDatabase.getDefaultDeck("L01")
local selectedAiDiff = "HARD"
local selectedAiLeader = "RANDOM"

-- สถานะการคลิกเลือกบนกระดานระหว่างเล่น
local selectedHandIndex: number? = nil -- รอเลือกช่องลงสนาม (1-3)
local selectedAttackerSlot: number? = nil -- รอเลือกเป้าหมายโจมตี (ช่องศัตรู 1-3 หรือ Leader ศัตรู)
local mulliganSelected: { [number]: boolean } = {}

-- ==================== ธีมสีและไอคอนประจำเผ่า/การ์ด ====================
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

local function getCardTheme(card)
	if not card then
		return {
			bg = Color3.fromRGB(30, 41, 59),
			accent = Color3.fromRGB(100, 116, 139),
			icon = "🃏",
			typeTag = "CARD",
		}
	end
	if card.type == "Leader" then
		return {
			bg = Color3.fromRGB(69, 26, 3),
			accent = Color3.fromRGB(245, 158, 11),
			icon = "👑",
			typeTag = "LEADER",
		}
	elseif card.type == "NormalSpell" then
		return {
			bg = Color3.fromRGB(12, 74, 110),
			accent = Color3.fromRGB(56, 189, 248),
			icon = "✨",
			typeTag = "SPELL",
		}
	elseif card.type == "ReactionSpell" then
		return {
			bg = Color3.fromRGB(88, 28, 135),
			accent = Color3.fromRGB(192, 132, 252),
			icon = "🛡️",
			typeTag = "REACTION",
		}
	else
		local idPrefix = string.sub(card.id or "", 1, 2)
		if idPrefix == "DN" then
			return {
				bg = Color3.fromRGB(20, 83, 45),
				accent = Color3.fromRGB(74, 222, 128),
				icon = "🦖",
				typeTag = "MONSTER",
			}
		elseif idPrefix == "DM" then
			return {
				bg = Color3.fromRGB(59, 7, 100),
				accent = Color3.fromRGB(168, 85, 247),
				icon = "🌌",
				typeTag = "MONSTER",
			}
		elseif idPrefix == "NM" then
			return {
				bg = Color3.fromRGB(67, 20, 7),
				accent = Color3.fromRGB(251, 146, 60),
				icon = "⚔️",
				typeTag = "MONSTER",
			}
		else
			return {
				bg = Color3.fromRGB(30, 58, 138),
				accent = Color3.fromRGB(96, 165, 250),
				icon = "🔥",
				typeTag = "MONSTER",
			}
		end
	end
end

local function formatTribeText(tribe): string
	if type(tribe) == "table" then
		return table.concat(tribe, " / ")
	elseif type(tribe) == "string" and tribe ~= "" and tribe ~= "-" then
		return tribe
	end
	return "-"
end

-- ==================== สร้าง UI หลัก (ScreenGui) ====================
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

-- ==================== หน้าต่างดูรายละเอียดการ์ด (เปิดเมื่อคลิกขวาเท่านั้น!) ====================
local inspectOverlay = Instance.new("Frame")
inspectOverlay.Name = "CardInspectModal"
inspectOverlay.Size = UDim2.fromScale(1, 1)
inspectOverlay.BackgroundColor3 = Color3.fromRGB(2, 6, 23)
inspectOverlay.BackgroundTransparency = 0.25
inspectOverlay.Visible = false
inspectOverlay.ZIndex = 90
inspectOverlay.Parent = screenGui

local inspectBox = Instance.new("Frame")
inspectBox.Size = UDim2.fromOffset(420, 520)
inspectBox.AnchorPoint = Vector2.new(0.5, 0.5)
inspectBox.Position = UDim2.fromScale(0.5, 0.5)
inspectBox.BackgroundColor3 = Color3.fromRGB(15, 23, 42)
inspectBox.ZIndex = 91
inspectBox.Parent = inspectOverlay
addCorner(inspectBox, 16)
local inspectStroke = addStroke(inspectBox, Color3.fromRGB(251, 191, 36), 2.5)

local inspectArtFrame = Instance.new("Frame")
inspectArtFrame.Size = UDim2.new(1, -32, 0, 220)
inspectArtFrame.Position = UDim2.fromOffset(16, 16)
inspectArtFrame.BackgroundColor3 = Color3.fromRGB(30, 41, 59)
inspectArtFrame.ClipsDescendants = true
inspectArtFrame.ZIndex = 92
inspectArtFrame.Parent = inspectBox
addCorner(inspectArtFrame, 12)

local inspectFallbackIcon = Instance.new("TextLabel")
inspectFallbackIcon.Size = UDim2.fromScale(1, 0.75)
inspectFallbackIcon.BackgroundTransparency = 1
inspectFallbackIcon.Font = Enum.Font.GothamBlack
inspectFallbackIcon.TextSize = 68
inspectFallbackIcon.TextColor3 = Color3.fromRGB(255, 255, 255)
inspectFallbackIcon.Text = "🃏"
inspectFallbackIcon.ZIndex = 93
inspectFallbackIcon.Parent = inspectArtFrame

local inspectCardCodeBadge = Instance.new("TextLabel")
inspectCardCodeBadge.Size = UDim2.new(1, -16, 0, 28)
inspectCardCodeBadge.Position = UDim2.new(0, 8, 1, -34)
inspectCardCodeBadge.BackgroundTransparency = 0.3
inspectCardCodeBadge.BackgroundColor3 = Color3.fromRGB(2, 6, 23)
inspectCardCodeBadge.Font = Enum.Font.GothamBold
inspectCardCodeBadge.TextSize = 13
inspectCardCodeBadge.TextColor3 = Color3.fromRGB(226, 232, 240)
inspectCardCodeBadge.Text = ""
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
inspectTitle.Position = UDim2.fromOffset(16, 246)
inspectTitle.BackgroundTransparency = 1
inspectTitle.Font = Enum.Font.GothamBlack
inspectTitle.TextSize = 22
inspectTitle.TextColor3 = Color3.fromRGB(254, 240, 138)
inspectTitle.TextXAlignment = Enum.TextXAlignment.Left
inspectTitle.ZIndex = 92
inspectTitle.Parent = inspectBox

local inspectMeta = Instance.new("TextLabel")
inspectMeta.Size = UDim2.new(1, -32, 0, 24)
inspectMeta.Position = UDim2.fromOffset(16, 278)
inspectMeta.BackgroundTransparency = 1
inspectMeta.Font = Enum.Font.GothamBold
inspectMeta.TextSize = 14
inspectMeta.TextColor3 = Color3.fromRGB(148, 163, 184)
inspectMeta.TextXAlignment = Enum.TextXAlignment.Left
inspectMeta.ZIndex = 92
inspectMeta.Parent = inspectBox

local inspectDescScroll = Instance.new("ScrollingFrame")
inspectDescScroll.Size = UDim2.new(1, -32, 0, 145)
inspectDescScroll.Position = UDim2.fromOffset(16, 308)
inspectDescScroll.BackgroundColor3 = Color3.fromRGB(2, 6, 23)
inspectDescScroll.BackgroundTransparency = 0.35
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
inspectCloseBtn.Size = UDim2.new(1, -32, 0, 40)
inspectCloseBtn.Position = UDim2.fromOffset(16, 464)
inspectCloseBtn.BackgroundColor3 = Color3.fromRGB(220, 38, 38)
inspectCloseBtn.Font = Enum.Font.GothamBold
inspectCloseBtn.TextSize = 16
inspectCloseBtn.TextColor3 = Color3.fromRGB(255, 255, 255)
inspectCloseBtn.Text = "✖ ปิดหน้าต่างรายละเอียด (คลิกขวาที่การ์ดใบใดก็ได้เพื่อดูข้อมูล)"
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
	inspectStroke.Color = theme.accent
	inspectArtFrame.BackgroundColor3 = theme.bg
	inspectFallbackIcon.Text = theme.icon

	local assetUri = CardDatabase.getImageAsset(cardData.image or fullTemplate.image)
	if assetUri ~= "" then
		inspectImage.Image = assetUri
		inspectImage.Visible = true
	else
		inspectImage.Visible = false
	end

	inspectCardCodeBadge.Text = string.format("[%s] %s • %s", fullTemplate.id or "?", theme.typeTag, fullTemplate.rarity or "C")
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

-- ==================== ฟังก์ชันสร้าง Card Widget (ใช้ร่วมกันทั้งบนมือ, บนสนาม, ในนรก และในหน้าต่างค้นหาการ์ด) ====================
local function createCardWidget(cardData, options)
	options = options or {}
	local width = options.width or 115
	local height = options.height or 162
	local fullCard = CardDatabase.getCardById(cardData.id) or cardData
	local theme = getCardTheme(fullCard)

	local btn = Instance.new("TextButton")
	btn.Name = "Card_" .. tostring(cardData.uid or cardData.id)
	btn.Size = UDim2.fromOffset(width, height)
	btn.BackgroundColor3 = Color3.fromRGB(15, 23, 42)
	btn.AutoButtonColor = true
	btn.Text = ""

	if cardData.state == "Rest" and options.showRestState then
		btn.BackgroundColor3 = Color3.fromRGB(30, 27, 75)
		btn.Rotation = 8
	end

	addCorner(btn, 10)
	local borderStroke = addStroke(
		btn,
		options.highlightColor or theme.accent,
		options.isHighlighted and 3 or 1.6
	)

	-- ส่วนภาพประกอบด้านบนของการ์ด
	local artBox = Instance.new("Frame")
	artBox.Size = UDim2.new(1, -10, 0.56, -6)
	artBox.Position = UDim2.fromOffset(5, 5)
	artBox.BackgroundColor3 = theme.bg
	artBox.ClipsDescendants = true
	artBox.Active = false
	artBox.Parent = btn
	addCorner(artBox, 7)

	local iconLbl = Instance.new("TextLabel")
	iconLbl.Size = UDim2.fromScale(1, 0.78)
	iconLbl.BackgroundTransparency = 1
	iconLbl.Font = Enum.Font.GothamBlack
	iconLbl.TextSize = math.floor(height * 0.22)
	iconLbl.TextColor3 = Color3.fromRGB(255, 255, 255)
	iconLbl.Text = theme.icon
	iconLbl.Parent = artBox

	local tribeBanner = Instance.new("TextLabel")
	tribeBanner.Size = UDim2.new(1, 0, 0, 16)
	tribeBanner.Position = UDim2.new(0, 0, 1, -16)
	tribeBanner.BackgroundColor3 = Color3.fromRGB(2, 6, 23)
	tribeBanner.BackgroundTransparency = 0.3
	tribeBanner.Font = Enum.Font.GothamBold
	tribeBanner.TextSize = 10
	tribeBanner.TextColor3 = Color3.fromRGB(203, 213, 225)
	tribeBanner.Text = formatTribeText(fullCard.tribe)
	tribeBanner.TextTruncate = Enum.TextTruncate.AtEnd
	tribeBanner.Parent = artBox

	local imgUri = CardDatabase.getImageAsset(cardData.image or fullCard.image)
	if imgUri ~= "" then
		local img = Instance.new("ImageLabel")
		img.Size = UDim2.fromScale(1, 1)
		img.BackgroundTransparency = 1
		img.ScaleType = Enum.ScaleType.Crop
		img.Image = imgUri
		img.Parent = artBox
	end

	-- ป้ายโซน (เช่น "จากกองการ์ด" / "จากนรก" ตอนค้นหาการ์ด)
	if options.zoneBadge and options.zoneBadge ~= "" then
		local zBadge = Instance.new("TextLabel")
		zBadge.Size = UDim2.new(1, -8, 0, 18)
		zBadge.Position = UDim2.fromOffset(4, 4)
		zBadge.BackgroundColor3 = Color3.fromRGB(124, 58, 237)
		zBadge.Font = Enum.Font.GothamBold
		zBadge.TextSize = 10
		zBadge.TextColor3 = Color3.fromRGB(255, 255, 255)
		zBadge.Text = options.zoneBadge
		zBadge.Parent = artBox
		addCorner(zBadge, 5)
	end

	-- ป้ายค่าพลัง Power หรือ HP มุมขวาบน
	if fullCard.type == "Monster" then
		local effPwr = cardData.effectivePower or cardData.power or fullCard.power or 0
		local basePwr = fullCard.power or 0
		local pwrBadge = Instance.new("TextLabel")
		pwrBadge.Size = UDim2.fromOffset(30, 22)
		pwrBadge.Position = UDim2.new(1, -34, 0, 4)
		pwrBadge.BackgroundColor3 = (effPwr > basePwr) and Color3.fromRGB(22, 163, 74)
			or ((effPwr < basePwr) and Color3.fromRGB(220, 38, 38) or Color3.fromRGB(15, 23, 42))
		pwrBadge.Font = Enum.Font.GothamBlack
		pwrBadge.TextSize = 13
		pwrBadge.TextColor3 = Color3.fromRGB(254, 240, 138)
		pwrBadge.Text = tostring(effPwr)
		pwrBadge.Parent = btn
		addCorner(pwrBadge, 6)
		addStroke(pwrBadge, Color3.fromRGB(251, 191, 36), 1.2)
	elseif fullCard.type == "Leader" then
		local hp = cardData.hp or fullCard.maxHp or 6
		local maxHp = cardData.maxHp or fullCard.maxHp or 6
		local hpBadge = Instance.new("TextLabel")
		hpBadge.Size = UDim2.fromOffset(48, 22)
		hpBadge.Position = UDim2.new(1, -52, 0, 4)
		hpBadge.BackgroundColor3 = Color3.fromRGB(185, 28, 28)
		hpBadge.Font = Enum.Font.GothamBlack
		hpBadge.TextSize = 12
		hpBadge.TextColor3 = Color3.fromRGB(255, 255, 255)
		hpBadge.Text = string.format("❤️%d/%d", hp, maxHp)
		hpBadge.Parent = btn
		addCorner(hpBadge, 6)
	end

	-- ป้ายสถานะ Rest / ไฮบริด / อมตะ
	if cardData.state == "Rest" and options.showRestState then
		local restTag = Instance.new("TextLabel")
		restTag.Size = UDim2.fromOffset(44, 18)
		restTag.Position = UDim2.fromOffset(6, 6)
		restTag.BackgroundColor3 = Color3.fromRGB(217, 119, 6)
		restTag.Font = Enum.Font.GothamBlack
		restTag.TextSize = 10
		restTag.TextColor3 = Color3.fromRGB(255, 255, 255)
		restTag.Text = "REST"
		restTag.Parent = btn
		addCorner(restTag, 4)
	elseif cardData.canHybridSummon then
		local hybTag = Instance.new("TextLabel")
		hybTag.Size = UDim2.fromOffset(58, 18)
		hybTag.Position = UDim2.fromOffset(6, 6)
		hybTag.BackgroundColor3 = Color3.fromRGB(22, 163, 74)
		hybTag.Font = Enum.Font.GothamBlack
		hybTag.TextSize = 10
		hybTag.TextColor3 = Color3.fromRGB(255, 255, 255)
		hybTag.Text = "🦖พร้อมผสม"
		hybTag.Parent = btn
		addCorner(hybTag, 4)
	end

	-- ชื่อการ์ด
	local nameLbl = Instance.new("TextLabel")
	nameLbl.Size = UDim2.new(1, -10, 0, 22)
	nameLbl.Position = UDim2.new(0, 5, 0.56, 0)
	nameLbl.BackgroundTransparency = 1
	nameLbl.Font = Enum.Font.GothamBold
	nameLbl.TextSize = 12
	nameLbl.TextColor3 = Color3.fromRGB(248, 250, 252)
	nameLbl.TextTruncate = Enum.TextTruncate.AtEnd
	nameLbl.Text = fullCard.name or cardData.id
	nameLbl.Parent = btn

	-- คำอธิบายสกิลย่อ
	local descLbl = Instance.new("TextLabel")
	descLbl.Size = UDim2.new(1, -10, 0.44, -26)
	descLbl.Position = UDim2.new(0, 5, 0.56, 20)
	descLbl.BackgroundTransparency = 1
	descLbl.Font = Enum.Font.Gotham
	descLbl.TextSize = 9
	descLbl.TextColor3 = Color3.fromRGB(148, 163, 184)
	descLbl.TextWrapped = true
	descLbl.TextYAlignment = Enum.TextYAlignment.Top
	descLbl.TextXAlignment = Enum.TextXAlignment.Left
	descLbl.Text = fullCard.desc or ""
	descLbl.Parent = btn

	-- ปุ่มกดใช้สกิลยูนิตบนสนาม (ถ้ามี ACTIVATE_MAIN)
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

	-- คลิกซ้าย (MouseButton1Click) = เล่นการ์ด / โจมตี / เลือกเป้าหมาย (ไม่เปิดรายละเอียดการ์ด!)
	if options.onLeftClick then
		btn.MouseButton1Click:Connect(function()
			options.onLeftClick()
		end)
	end

	-- คลิกขวา (MouseButton2Click) = เปิดดูรายละเอียดการ์ดเสมอ!
	btn.MouseButton2Click:Connect(function()
		openCardInspectModal(cardData)
	end)

	return btn, borderStroke
end

-- ==================== แถบบนสุด (Top Bar) และระบบแจ้งเตือน ====================
local topNavBar = Instance.new("Frame")
topNavBar.Size = UDim2.fromOffset(380, 40)
topNavBar.Position = UDim2.new(0.5, -190, 0, 8)
topNavBar.BackgroundColor3 = Color3.fromRGB(15, 23, 42)
topNavBar.BackgroundTransparency = 0.1
topNavBar.ZIndex = 40
topNavBar.Parent = screenGui
addCorner(topNavBar, 20)
addStroke(topNavBar, Color3.fromRGB(56, 189, 248), 1.5)

local toggleLobbyBtn = Instance.new("TextButton")
toggleLobbyBtn.Size = UDim2.new(0.55, -8, 1, -8)
toggleLobbyBtn.Position = UDim2.fromOffset(6, 4)
toggleLobbyBtn.BackgroundColor3 = Color3.fromRGB(37, 99, 235)
toggleLobbyBtn.Font = Enum.Font.GothamBold
toggleLobbyBtn.TextSize = 13
toggleLobbyBtn.TextColor3 = Color3.fromRGB(255, 255, 255)
toggleLobbyBtn.Text = "⚔️ เมนู แบทเทิล ออฟ เฟรน"
toggleLobbyBtn.ZIndex = 41
toggleLobbyBtn.Parent = topNavBar
addCorner(toggleLobbyBtn, 16)

local openDeckBuilderTopBtn = Instance.new("TextButton")
openDeckBuilderTopBtn.Size = UDim2.new(0.45, -8, 1, -8)
openDeckBuilderTopBtn.Position = UDim2.new(0.55, 2, 0, 4)
openDeckBuilderTopBtn.BackgroundColor3 = Color3.fromRGB(124, 58, 237)
openDeckBuilderTopBtn.Font = Enum.Font.GothamBold
openDeckBuilderTopBtn.TextSize = 13
openDeckBuilderTopBtn.TextColor3 = Color3.fromRGB(255, 255, 255)
openDeckBuilderTopBtn.Text = "🃏 จัดเด็ค (20 ใบ)"
openDeckBuilderTopBtn.ZIndex = 41
openDeckBuilderTopBtn.Parent = topNavBar
addCorner(openDeckBuilderTopBtn, 16)

local toastLabel = Instance.new("TextLabel")
toastLabel.Size = UDim2.fromOffset(480, 38)
toastLabel.AnchorPoint = Vector2.new(0.5, 0)
toastLabel.Position = UDim2.new(0.5, 0, 0, 54)
toastLabel.BackgroundColor3 = Color3.fromRGB(15, 23, 42)
toastLabel.Font = Enum.Font.GothamBold
toastLabel.TextSize = 14
toastLabel.TextColor3 = Color3.fromRGB(254, 240, 138)
toastLabel.Visible = false
toastLabel.ZIndex = 85
toastLabel.Parent = screenGui
addCorner(toastLabel, 10)
addStroke(toastLabel, Color3.fromRGB(251, 191, 36), 1.5)

local function showToast(msg: string)
	toastLabel.Text = "🔔 " .. msg
	toastLabel.Visible = true
	task.delay(3.5, function()
		if toastLabel.Text == "🔔 " .. msg then
			toastLabel.Visible = false
		end
	end)
end

-- ==================== หน้าล็อบบี้หลัก (Lobby Frame) ====================
local lobbyFrame = Instance.new("Frame")
lobbyFrame.Name = "LobbyWindow"
lobbyFrame.Size = UDim2.fromOffset(880, 540)
lobbyFrame.AnchorPoint = Vector2.new(0.5, 0.5)
lobbyFrame.Position = UDim2.fromScale(0.5, 0.52)
lobbyFrame.BackgroundColor3 = Color3.fromRGB(15, 23, 42)
lobbyFrame.ZIndex = 30
lobbyFrame.Parent = screenGui
addCorner(lobbyFrame, 18)
addStroke(lobbyFrame, Color3.fromRGB(56, 189, 248), 2)

local lobbyTitle = Instance.new("TextLabel")
lobbyTitle.Size = UDim2.new(1, -80, 0, 42)
lobbyTitle.Position = UDim2.fromOffset(24, 14)
lobbyTitle.BackgroundTransparency = 1
lobbyTitle.Font = Enum.Font.GothamBlack
lobbyTitle.TextSize = 26
lobbyTitle.TextColor3 = Color3.fromRGB(254, 240, 138)
lobbyTitle.TextXAlignment = Enum.TextXAlignment.Left
lobbyTitle.Text = "⚔️ แบทเทิล ออฟ เฟรน (BATTLE OF FRIENDS)"
lobbyTitle.ZIndex = 31
lobbyTitle.Parent = lobbyFrame

local lobbySub = Instance.new("TextLabel")
lobbySub.Size = UDim2.new(1, -80, 0, 22)
lobbySub.Position = UDim2.fromOffset(24, 52)
lobbySub.BackgroundTransparency = 1
lobbySub.Font = Enum.Font.GothamMedium
lobbySub.TextSize = 13
lobbySub.TextColor3 = Color3.fromRGB(148, 163, 184)
lobbySub.TextXAlignment = Enum.TextXAlignment.Left
lobbySub.Text = "เลือกเด็คทั้ง 4 เผ่า แล้วกดดวลกับบอท AI หรือเดินไปที่โต๊ะดวลในแมพเพื่อแข่งกับเพื่อน! (คลิกขวาที่การ์ดเพื่อดูสกิล)"
lobbySub.ZIndex = 31
lobbySub.Parent = lobbyFrame

local closeLobbyBtn = Instance.new("TextButton")
closeLobbyBtn.Size = UDim2.fromOffset(38, 38)
closeLobbyBtn.Position = UDim2.new(1, -52, 0, 16)
closeLobbyBtn.BackgroundColor3 = Color3.fromRGB(51, 65, 85)
closeLobbyBtn.Font = Enum.Font.GothamBlack
closeLobbyBtn.TextSize = 16
closeLobbyBtn.TextColor3 = Color3.fromRGB(255, 255, 255)
closeLobbyBtn.Text = "✕"
closeLobbyBtn.ZIndex = 31
closeLobbyBtn.Parent = lobbyFrame
addCorner(closeLobbyBtn, 10)
closeLobbyBtn.MouseButton1Click:Connect(function()
	lobbyFrame.Visible = false
end)

-- โซนเลือกเด็คเริ่มต้นทั้ง 4 เด็ค (L01-L04)
local deckSelectHeader = Instance.new("TextLabel")
deckSelectHeader.Size = UDim2.new(1, -48, 0, 24)
deckSelectHeader.Position = UDim2.fromOffset(24, 84)
deckSelectHeader.BackgroundTransparency = 1
deckSelectHeader.Font = Enum.Font.GothamBold
deckSelectHeader.TextSize = 15
deckSelectHeader.TextColor3 = Color3.fromRGB(56, 189, 248)
deckSelectHeader.TextXAlignment = Enum.TextXAlignment.Left
deckSelectHeader.Text = "1️⃣ เลือกเด็คประจำตัวของคุณ (คลิกซ้ายเพื่อเลือกเด็ค / คลิกขวาที่การ์ดเพื่อดูรายละเอียด Leader):"
deckSelectHeader.ZIndex = 31
deckSelectHeader.Parent = lobbyFrame

local deckCardsRow = Instance.new("Frame")
deckCardsRow.Size = UDim2.new(1, -48, 0, 175)
deckCardsRow.Position = UDim2.fromOffset(24, 112)
deckCardsRow.BackgroundTransparency = 1
deckCardsRow.ZIndex = 31
deckCardsRow.Parent = lobbyFrame

local deckButtons = {}

local function refreshLobbyDeckSelection()
	for lid, item in pairs(deckButtons) do
		local isSelected = (lid == selectedLeaderId)
		item.stroke.Color = isSelected and Color3.fromRGB(250, 204, 21) or Color3.fromRGB(71, 85, 105)
		item.stroke.Thickness = isSelected and 3 or 1.5
		item.badge.Visible = isSelected
	end
end

local leaderOrder = { "L01", "L02", "L03", "L04" }
for idx, lid in ipairs(leaderOrder) do
	local meta = CardDatabase.DECK_METADATA[lid]
	local leaderCard = CardDatabase.getCardById(lid)
	local cardBox = Instance.new("TextButton")
	cardBox.Size = UDim2.new(0.24, -6, 1, 0)
	cardBox.Position = UDim2.new((idx - 1) * 0.25, 0, 0, 0)
	cardBox.BackgroundColor3 = Color3.fromRGB(30, 41, 59)
	cardBox.Text = ""
	cardBox.ZIndex = 32
	cardBox.Parent = deckCardsRow
	addCorner(cardBox, 12)
	local st = addStroke(cardBox, hexToColor3(meta.color), 2)

	local badge = Instance.new("TextLabel")
	badge.Size = UDim2.fromOffset(90, 22)
	badge.Position = UDim2.new(1, -98, 0, 8)
	badge.BackgroundColor3 = Color3.fromRGB(234, 179, 8)
	badge.Font = Enum.Font.GothamBlack
	badge.TextSize = 11
	badge.TextColor3 = Color3.fromRGB(15, 23, 42)
	badge.Text = "✓ เลือกใช้งาน"
	badge.ZIndex = 33
	badge.Parent = cardBox
	addCorner(badge, 6)

	local title = Instance.new("TextLabel")
	title.Size = UDim2.new(1, -20, 0, 28)
	title.Position = UDim2.fromOffset(10, 10)
	title.BackgroundTransparency = 1
	title.Font = Enum.Font.GothamBlack
	title.TextSize = 18
	title.TextColor3 = hexToColor3(meta.color)
	title.TextXAlignment = Enum.TextXAlignment.Left
	title.Text = meta.title
	title.ZIndex = 33
	title.Parent = cardBox

	local sub = Instance.new("TextLabel")
	sub.Size = UDim2.new(1, -20, 0, 20)
	sub.Position = UDim2.fromOffset(10, 38)
	sub.BackgroundTransparency = 1
	sub.Font = Enum.Font.GothamBold
	sub.TextSize = 13
	sub.TextColor3 = Color3.fromRGB(248, 250, 252)
	sub.TextXAlignment = Enum.TextXAlignment.Left
	sub.Text = "👑 Leader: " .. (leaderCard and leaderCard.name or lid)
	sub.ZIndex = 33
	sub.Parent = cardBox

	local desc = Instance.new("TextLabel")
	desc.Size = UDim2.new(1, -20, 0, 95)
	desc.Position = UDim2.fromOffset(10, 64)
	desc.BackgroundTransparency = 1
	desc.Font = Enum.Font.Gotham
	desc.TextSize = 12
	desc.TextColor3 = Color3.fromRGB(203, 213, 225)
	desc.TextWrapped = true
	desc.TextXAlignment = Enum.TextXAlignment.Left
	desc.TextYAlignment = Enum.TextYAlignment.Top
	desc.Text = meta.style .. "\n\n" .. (leaderCard and leaderCard.desc or "")
	desc.ZIndex = 33
	desc.Parent = cardBox

	deckButtons[lid] = { button = cardBox, stroke = st, badge = badge }

	cardBox.MouseButton1Click:Connect(function()
		selectedLeaderId = lid
		customMainDeck = CardDatabase.getDefaultDeck(lid)
		refreshLobbyDeckSelection()
		DuelActionEvent:FireServer({
			action = "SAVE_DECK",
			leaderId = selectedLeaderId,
			mainDeck = customMainDeck,
		})
	end)

	cardBox.MouseButton2Click:Connect(function()
		openCardInspectModal(leaderCard)
	end)
end
refreshLobbyDeckSelection()

-- โซนที่ 2: โหมดดวลกับบอท AI และโหมด PvP กับเพื่อน
local modeSplit = Instance.new("Frame")
modeSplit.Size = UDim2.new(1, -48, 0, 215)
modeSplit.Position = UDim2.fromOffset(24, 302)
modeSplit.BackgroundTransparency = 1
modeSplit.ZIndex = 31
modeSplit.Parent = lobbyFrame

-- กล่องซ้าย: ดวลกับบอท AI
local botPanel = Instance.new("Frame")
botPanel.Size = UDim2.new(0.49, 0, 1, 0)
botPanel.BackgroundColor3 = Color3.fromRGB(30, 41, 59)
botPanel.ZIndex = 32
botPanel.Parent = modeSplit
addCorner(botPanel, 14)
addStroke(botPanel, Color3.fromRGB(59, 130, 246), 1.5)

local botTitle = Instance.new("TextLabel")
botTitle.Size = UDim2.new(1, -24, 0, 28)
botTitle.Position = UDim2.fromOffset(14, 12)
botTitle.BackgroundTransparency = 1
botTitle.Font = Enum.Font.GothamBlack
botTitle.TextSize = 18
botTitle.TextColor3 = Color3.fromRGB(96, 165, 250)
botTitle.TextXAlignment = Enum.TextXAlignment.Left
botTitle.Text = "🤖 โหมดดวลกับบอท AI (ฝึกซ้อม & ทดสอบคอมโบ)"
botTitle.ZIndex = 33
botTitle.Parent = botPanel

local diffRow = Instance.new("Frame")
diffRow.Size = UDim2.new(1, -28, 0, 38)
diffRow.Position = UDim2.fromOffset(14, 48)
diffRow.BackgroundTransparency = 1
diffRow.ZIndex = 33
diffRow.Parent = botPanel

local diffs = {
	{ id = "EASY", label = "🌱 ง่าย (Easy)" },
	{ id = "MEDIUM", label = "⚔️ ปานกลาง (Medium)" },
	{ id = "HARD", label = "🔥 ยาก (Hard)" },
}
local diffBtns = {}
for i, d in ipairs(diffs) do
	local b = Instance.new("TextButton")
	b.Size = UDim2.new(0.32, 0, 1, 0)
	b.Position = UDim2.new((i - 1) * 0.34, 0, 0, 0)
	b.BackgroundColor3 = (d.id == selectedAiDiff) and Color3.fromRGB(37, 99, 235) or Color3.fromRGB(15, 23, 42)
	b.Font = Enum.Font.GothamBold
	b.TextSize = 12
	b.TextColor3 = Color3.fromRGB(255, 255, 255)
	b.Text = d.label
	b.ZIndex = 34
	b.Parent = diffRow
	addCorner(b, 8)
	diffBtns[d.id] = b
	b.MouseButton1Click:Connect(function()
		selectedAiDiff = d.id
		for k, btnObj in pairs(diffBtns) do
			btnObj.BackgroundColor3 = (k == selectedAiDiff) and Color3.fromRGB(37, 99, 235) or Color3.fromRGB(15, 23, 42)
		end
	end)
end

local aiDeckRow = Instance.new("Frame")
aiDeckRow.Size = UDim2.new(1, -28, 0, 34)
aiDeckRow.Position = UDim2.fromOffset(14, 96)
aiDeckRow.BackgroundTransparency = 1
aiDeckRow.ZIndex = 33
aiDeckRow.Parent = botPanel

local aiChoices = {
	{ id = "RANDOM", label = "🎲 สุ่มเด็ค" },
	{ id = "L01", label = "จิต" },
	{ id = "L02", label = "ขุนเหนือ" },
	{ id = "L03", label = "วันสิ้นโลก" },
	{ id = "L04", label = "ไดโน" },
}
local aiDeckBtns = {}
for i, ch in ipairs(aiChoices) do
	local b = Instance.new("TextButton")
	b.Size = UDim2.new(0.19, 0, 1, 0)
	b.Position = UDim2.new((i - 1) * 0.202, 0, 0, 0)
	b.BackgroundColor3 = (ch.id == selectedAiLeader) and Color3.fromRGB(16, 185, 129) or Color3.fromRGB(15, 23, 42)
	b.Font = Enum.Font.GothamBold
	b.TextSize = 11
	b.TextColor3 = Color3.fromRGB(255, 255, 255)
	b.Text = ch.label
	b.ZIndex = 34
	b.Parent = aiDeckRow
	addCorner(b, 7)
	aiDeckBtns[ch.id] = b
	b.MouseButton1Click:Connect(function()
		selectedAiLeader = ch.id
		for k, btnObj in pairs(aiDeckBtns) do
			btnObj.BackgroundColor3 = (k == selectedAiLeader) and Color3.fromRGB(16, 185, 129) or Color3.fromRGB(15, 23, 42)
		end
	end)
end

local startBotBtn = Instance.new("TextButton")
startBotBtn.Size = UDim2.new(1, -28, 0, 50)
startBotBtn.Position = UDim2.fromOffset(14, 146)
startBotBtn.BackgroundColor3 = Color3.fromRGB(22, 163, 74)
startBotBtn.Font = Enum.Font.GothamBlack
startBotBtn.TextSize = 18
startBotBtn.TextColor3 = Color3.fromRGB(255, 255, 255)
startBotBtn.Text = "🚀 เริ่มดวลกับบอท AI ทันที!"
startBotBtn.ZIndex = 34
startBotBtn.Parent = botPanel
addCorner(startBotBtn, 12)
startBotBtn.MouseButton1Click:Connect(function()
	lobbyFrame.Visible = false
	DuelActionEvent:FireServer({
		action = "START_BOT_MATCH",
		difficulty = selectedAiDiff,
		aiLeaderId = selectedAiLeader,
	})
end)

-- กล่องขวา: ดวลกับเพื่อน PvP ในเซิร์ฟเวอร์
local pvpPanel = Instance.new("Frame")
pvpPanel.Size = UDim2.new(0.49, 0, 1, 0)
pvpPanel.Position = UDim2.fromScale(0.51, 0)
pvpPanel.BackgroundColor3 = Color3.fromRGB(30, 41, 59)
pvpPanel.ZIndex = 32
pvpPanel.Parent = modeSplit
addCorner(pvpPanel, 14)
addStroke(pvpPanel, Color3.fromRGB(245, 158, 11), 1.5)

local pvpTitle = Instance.new("TextLabel")
pvpTitle.Size = UDim2.new(1, -24, 0, 28)
pvpTitle.Position = UDim2.fromOffset(14, 12)
pvpTitle.BackgroundTransparency = 1
pvpTitle.Font = Enum.Font.GothamBlack
pvpTitle.TextSize = 18
pvpTitle.TextColor3 = Color3.fromRGB(251, 191, 36)
pvpTitle.TextXAlignment = Enum.TextXAlignment.Left
pvpTitle.Text = "⚔️ โหมดดวลกับเพื่อน (PvP ออนไลน์ในแมพ)"
pvpTitle.ZIndex = 33
pvpTitle.Parent = pvpPanel

local createRoomBtn = Instance.new("TextButton")
createRoomBtn.Size = UDim2.new(0.58, -14, 0, 38)
createRoomBtn.Position = UDim2.fromOffset(14, 46)
createRoomBtn.BackgroundColor3 = Color3.fromRGB(217, 119, 6)
createRoomBtn.Font = Enum.Font.GothamBold
createRoomBtn.TextSize = 13
createRoomBtn.TextColor3 = Color3.fromRGB(255, 255, 255)
createRoomBtn.Text = "➕ สร้างห้องท้าดวล PvP"
createRoomBtn.ZIndex = 34
createRoomBtn.Parent = pvpPanel
addCorner(createRoomBtn, 8)
createRoomBtn.MouseButton1Click:Connect(function()
	DuelActionEvent:FireServer({ action = "CREATE_PVP_ROOM" })
end)

local cancelRoomBtn = Instance.new("TextButton")
cancelRoomBtn.Size = UDim2.new(0.42, -14, 0, 38)
cancelRoomBtn.Position = UDim2.new(0.58, 6, 0, 46)
cancelRoomBtn.BackgroundColor3 = Color3.fromRGB(71, 85, 105)
cancelRoomBtn.Font = Enum.Font.GothamBold
cancelRoomBtn.TextSize = 12
cancelRoomBtn.TextColor3 = Color3.fromRGB(255, 255, 255)
cancelRoomBtn.Text = "✖ ยกเลิกห้อง"
cancelRoomBtn.ZIndex = 34
cancelRoomBtn.Parent = pvpPanel
addCorner(cancelRoomBtn, 8)
cancelRoomBtn.MouseButton1Click:Connect(function()
	DuelActionEvent:FireServer({ action = "CANCEL_PVP_ROOM" })
end)

local roomListScroll = Instance.new("ScrollingFrame")
roomListScroll.Size = UDim2.new(1, -28, 0, 112)
roomListScroll.Position = UDim2.fromOffset(14, 92)
roomListScroll.BackgroundColor3 = Color3.fromRGB(15, 23, 42)
roomListScroll.BorderSizePixel = 0
roomListScroll.ScrollBarThickness = 5
roomListScroll.AutomaticCanvasSize = Enum.AutomaticSize.Y
roomListScroll.CanvasSize = UDim2.new(0, 0, 0, 0)
roomListScroll.ZIndex = 33
roomListScroll.Parent = pvpPanel
addCorner(roomListScroll, 8)

local roomListLayout = Instance.new("UIListLayout")
roomListLayout.Padding = UDim.new(0, 6)
roomListLayout.Parent = roomListScroll

local function renderRoomList(rooms)
	for _, child in ipairs(roomListScroll:GetChildren()) do
		if child:IsA("GuiObject") then
			child:Destroy()
		end
	end
	if not rooms or #rooms == 0 then
		local emptyLbl = Instance.new("TextLabel")
		emptyLbl.Size = UDim2.new(1, -12, 0, 90)
		emptyLbl.BackgroundTransparency = 1
		emptyLbl.Font = Enum.Font.GothamMedium
		emptyLbl.TextSize = 12
		emptyLbl.TextColor3 = Color3.fromRGB(148, 163, 184)
		emptyLbl.TextWrapped = true
		emptyLbl.Text = "ยังไม่มีห้องที่เปิดรอในขณะนี้\nกดปุ่ม 'สร้างห้องท้าดวล PvP' ด้านบน หรือเดินไปกด E ที่โต๊ะดวล 3D ในแมพได้เลย!"
		emptyLbl.ZIndex = 34
		emptyLbl.Parent = roomListScroll
		return
	end
	for _, r in ipairs(rooms) do
		local row = Instance.new("Frame")
		row.Size = UDim2.new(1, -10, 0, 36)
		row.BackgroundColor3 = Color3.fromRGB(30, 41, 59)
		row.ZIndex = 34
		row.Parent = roomListScroll
		addCorner(row, 6)

		local info = Instance.new("TextLabel")
		info.Size = UDim2.new(0.68, -10, 1, 0)
		info.Position = UDim2.fromOffset(8, 0)
		info.BackgroundTransparency = 1
		info.Font = Enum.Font.GothamBold
		info.TextSize = 12
		info.TextColor3 = Color3.fromRGB(248, 250, 252)
		info.TextXAlignment = Enum.TextXAlignment.Left
		info.Text = string.format("#%s • %s (👑 %s)", r.roomCode, r.hostName, r.leaderName)
		info.ZIndex = 35
		info.Parent = row

		local joinBtn = Instance.new("TextButton")
		joinBtn.Size = UDim2.new(0.32, -8, 0, 28)
		joinBtn.Position = UDim2.new(0.68, 4, 0, 4)
		joinBtn.BackgroundColor3 = Color3.fromRGB(22, 163, 74)
		joinBtn.Font = Enum.Font.GothamBold
		joinBtn.TextSize = 12
		joinBtn.TextColor3 = Color3.fromRGB(255, 255, 255)
		joinBtn.Text = "⚔️ เข้าร่วมดวล"
		joinBtn.ZIndex = 35
		joinBtn.Parent = row
		addCorner(joinBtn, 6)
		joinBtn.MouseButton1Click:Connect(function()
			lobbyFrame.Visible = false
			DuelActionEvent:FireServer({
				action = "JOIN_PVP_ROOM",
				roomCode = r.roomCode,
			})
		end)
	end
end
renderRoomList({})

-- ==================== หน้าต่างจัดเด็ค (Deck Builder Modal) ====================
local deckBuilderModal = Instance.new("Frame")
deckBuilderModal.Name = "DeckBuilderModal"
deckBuilderModal.Size = UDim2.fromOffset(920, 560)
deckBuilderModal.AnchorPoint = Vector2.new(0.5, 0.5)
deckBuilderModal.Position = UDim2.fromScale(0.5, 0.52)
deckBuilderModal.BackgroundColor3 = Color3.fromRGB(15, 23, 42)
deckBuilderModal.Visible = false
deckBuilderModal.ZIndex = 60
deckBuilderModal.Parent = screenGui
addCorner(deckBuilderModal, 16)
addStroke(deckBuilderModal, Color3.fromRGB(168, 85, 247), 2)

local dbTitle = Instance.new("TextLabel")
dbTitle.Size = UDim2.new(0.6, 0, 0, 36)
dbTitle.Position = UDim2.fromOffset(20, 12)
dbTitle.BackgroundTransparency = 1
dbTitle.Font = Enum.Font.GothamBlack
dbTitle.TextSize = 20
dbTitle.TextColor3 = Color3.fromRGB(233, 213, 255)
dbTitle.TextXAlignment = Enum.TextXAlignment.Left
dbTitle.Text = "🃏 จัดเด็คแบทเทิล ออฟ เฟรน (คลิกซ้ายเพิ่ม/ลดการ์ด • คลิกขวาดูรายละเอียด)"
dbTitle.ZIndex = 61
dbTitle.Parent = deckBuilderModal

local dbCountLabel = Instance.new("TextLabel")
dbCountLabel.Size = UDim2.fromOffset(180, 32)
dbCountLabel.Position = UDim2.new(1, -330, 0, 14)
dbCountLabel.BackgroundColor3 = Color3.fromRGB(30, 41, 59)
dbCountLabel.Font = Enum.Font.GothamBlack
dbCountLabel.TextSize = 14
dbCountLabel.TextColor3 = Color3.fromRGB(74, 222, 128)
dbCountLabel.Text = "การ์ดในเด็ค: 20 / 20"
dbCountLabel.ZIndex = 61
dbCountLabel.Parent = deckBuilderModal
addCorner(dbCountLabel, 8)

local dbSaveBtn = Instance.new("TextButton")
dbSaveBtn.Size = UDim2.fromOffset(130, 32)
dbSaveBtn.Position = UDim2.new(1, -142, 0, 14)
dbSaveBtn.BackgroundColor3 = Color3.fromRGB(22, 163, 74)
dbSaveBtn.Font = Enum.Font.GothamBold
dbSaveBtn.TextSize = 13
dbSaveBtn.TextColor3 = Color3.fromRGB(255, 255, 255)
dbSaveBtn.Text = "💾 บันทึกและปิด"
dbSaveBtn.ZIndex = 61
dbSaveBtn.Parent = deckBuilderModal
addCorner(dbSaveBtn, 8)

local dbCatalogScroll = Instance.new("ScrollingFrame")
dbCatalogScroll.Size = UDim2.new(0.64, -24, 1, -68)
dbCatalogScroll.Position = UDim2.fromOffset(16, 54)
dbCatalogScroll.BackgroundColor3 = Color3.fromRGB(2, 6, 23)
dbCatalogScroll.BorderSizePixel = 0
dbCatalogScroll.ScrollBarThickness = 6
dbCatalogScroll.AutomaticCanvasSize = Enum.AutomaticSize.Y
dbCatalogScroll.CanvasSize = UDim2.new(0, 0, 0, 0)
dbCatalogScroll.ZIndex = 61
dbCatalogScroll.Parent = deckBuilderModal
addCorner(dbCatalogScroll, 10)

local dbCatalogGrid = Instance.new("UIGridLayout")
dbCatalogGrid.CellSize = UDim2.fromOffset(105, 148)
dbCatalogGrid.CellPadding = UDim2.fromOffset(8, 8)
dbCatalogGrid.Parent = dbCatalogScroll

local dbCurrentDeckScroll = Instance.new("ScrollingFrame")
dbCurrentDeckScroll.Size = UDim2.new(0.36, -20, 1, -68)
dbCurrentDeckScroll.Position = UDim2.new(0.64, 4, 0, 54)
dbCurrentDeckScroll.BackgroundColor3 = Color3.fromRGB(2, 6, 23)
dbCurrentDeckScroll.BorderSizePixel = 0
dbCurrentDeckScroll.ScrollBarThickness = 6
dbCurrentDeckScroll.AutomaticCanvasSize = Enum.AutomaticSize.Y
dbCurrentDeckScroll.CanvasSize = UDim2.new(0, 0, 0, 0)
dbCurrentDeckScroll.ZIndex = 61
dbCurrentDeckScroll.Parent = deckBuilderModal
addCorner(dbCurrentDeckScroll, 10)

local dbCurrentList = Instance.new("UIListLayout")
dbCurrentList.Padding = UDim.new(0, 4)
dbCurrentList.Parent = dbCurrentDeckScroll

local function refreshDeckBuilderUI()
	for _, ch in ipairs(dbCatalogScroll:GetChildren()) do
		if ch:IsA("GuiObject") then
			ch:Destroy()
		end
	end
	for _, ch in ipairs(dbCurrentDeckScroll:GetChildren()) do
		if ch:IsA("GuiObject") then
			ch:Destroy()
		end
	end

	dbCountLabel.Text = string.format("การ์ดในเด็ค: %d / 20", #customMainDeck)
	dbCountLabel.TextColor3 = (#customMainDeck == 20) and Color3.fromRGB(74, 222, 128) or Color3.fromRGB(251, 191, 36)

	local counts = {}
	for _, cid in ipairs(customMainDeck) do
		counts[cid] = (counts[cid] or 0) + 1
	end

	-- แสดงรายการการ์ดในคลังทั้งหมด (ยกเว้น Leader)
	for _, card in ipairs(CardDatabase.CARD_POOL) do
		if card.type ~= "Leader" then
			local used = counts[card.id] or 0
			local maxCopies = card.maxCopies or 2
			local w = createCardWidget(card, {
				width = 105,
				height = 148,
				zoneBadge = string.format("%d / %d ใบ", used, maxCopies),
				onLeftClick = function()
					if #customMainDeck >= 20 then
						showToast("เด็คครบ 20 ใบแล้ว! คลิกที่รายการฝั่งขวาเพื่อนำออกก่อน")
						return
					end
					if used >= maxCopies then
						showToast(string.format('ใส่ "%s" ได้สูงสุด %d ใบต่อเด็ค!', card.name, maxCopies))
						return
					end
					table.insert(customMainDeck, card.id)
					refreshDeckBuilderUI()
				end,
			})
			w.ZIndex = 62
			w.Parent = dbCatalogScroll
		end
	end

	-- แสดงการ์ดที่เลือกอยู่ในเด็คฝั่งขวา
	for idx, cid in ipairs(customMainDeck) do
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
			row.ZIndex = 62
			row.Parent = dbCurrentDeckScroll
			addCorner(row, 6)
			row.MouseButton1Click:Connect(function()
				table.remove(customMainDeck, idx)
				refreshDeckBuilderUI()
			end)
			row.MouseButton2Click:Connect(function()
				openCardInspectModal(c)
			end)
		end
	end
end

openDeckBuilderTopBtn.MouseButton1Click:Connect(function()
	refreshDeckBuilderUI()
	deckBuilderModal.Visible = not deckBuilderModal.Visible
end)

dbSaveBtn.MouseButton1Click:Connect(function()
	if #customMainDeck ~= 20 then
		showToast("กรุณาจัดเด็คให้ครบ 20 ใบพอดี! (หรือคลิกเลือกเด็คเริ่มต้นในหน้าเมนู)")
		return
	end
	deckBuilderModal.Visible = false
	DuelActionEvent:FireServer({
		action = "SAVE_DECK",
		leaderId = selectedLeaderId,
		mainDeck = customMainDeck,
	})
end)

toggleLobbyBtn.MouseButton1Click:Connect(function()
	lobbyFrame.Visible = not lobbyFrame.Visible
	if lobbyFrame.Visible then
		DuelActionEvent:FireServer({ action = "REQUEST_ROOM_LIST" })
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
oppBar.Position = UDim2.fromOffset(12, 50)
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
oppLeaderContainer.Size = UDim2.fromOffset(115, 160)
oppLeaderContainer.Position = UDim2.fromOffset(235, 8)
oppLeaderContainer.BackgroundTransparency = 1
oppLeaderContainer.ZIndex = 12
oppLeaderContainer.Parent = oppBar

local oppSlotsContainer = Instance.new("Frame")
oppSlotsContainer.Size = UDim2.fromOffset(390, 160)
oppSlotsContainer.Position = UDim2.new(0.5, -150, 0, 8)
oppSlotsContainer.BackgroundTransparency = 1
oppSlotsContainer.ZIndex = 12
oppSlotsContainer.Parent = oppBar

local oppZonesContainer = Instance.new("Frame")
oppZonesContainer.Size = UDim2.fromOffset(200, 160)
oppZonesContainer.Position = UDim2.new(1, -210, 0, 8)
oppZonesContainer.BackgroundTransparency = 1
oppZonesContainer.ZIndex = 12
oppZonesContainer.Parent = oppBar

-- 2. แถบควบคุมตรงกลางสนาม (Center HUD & Action Bar)
local centerHud = Instance.new("Frame")
centerHud.Size = UDim2.new(1, -24, 0, 52)
centerHud.Position = UDim2.fromOffset(12, 232)
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
playerBar.Position = UDim2.fromOffset(12, 290)
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
playerLeaderContainer.Size = UDim2.fromOffset(115, 165)
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

-- 4. โซนการ์ดบนมือของผู้เล่น (ด้านล่างสุด เลื่อนซ้าย-ขวาได้)
local handDock = Instance.new("ScrollingFrame")
handDock.Size = UDim2.new(1, -24, 1, -482)
handDock.Position = UDim2.fromOffset(12, 476)
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
zbGrid.CellSize = UDim2.fromOffset(115, 162)
zbGrid.CellPadding = UDim2.fromOffset(10, 10)
zbGrid.Parent = zbScroll

local function openZoneBrowser(title: string, cardList)
	zbTitle.Text = title .. " (คลิกขวาหรือคลิกซ้ายที่การ์ดเพื่อดูรายละเอียด)"
	for _, ch in ipairs(zbScroll:GetChildren()) do
		if ch:IsA("GuiObject") then
			ch:Destroy()
		end
	end
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
goTitle.TextSize = 32
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
goBackLobbyBtn.BackgroundColor3 = Color3.fromRGB(37, 99, 235)
goBackLobbyBtn.Font = Enum.Font.GothamBlack
goBackLobbyBtn.TextSize = 16
goBackLobbyBtn.TextColor3 = Color3.fromRGB(255, 255, 255)
goBackLobbyBtn.Text = "🏠 กลับสู่เมนู แบทเทิล ออฟ เฟรน"
goBackLobbyBtn.ZIndex = 89
goBackLobbyBtn.Parent = gameOverModal
addCorner(goBackLobbyBtn, 12)
goBackLobbyBtn.MouseButton1Click:Connect(function()
	gameOverModal.Visible = false
	boardScreen.Visible = false
	lobbyFrame.Visible = true
	currentMatchState = nil
end)

-- ==================== ฟังก์ชันวาดกระดานดวลทั้งหมดจาก Match State ====================
local function clearGuiChildren(container: Instance)
	for _, ch in ipairs(container:GetChildren()) do
		if ch:IsA("GuiObject") then
			ch:Destroy()
		end
	end
end

local function renderDuelState(state)
	currentMatchState = state
	boardScreen.Visible = true
	lobbyFrame.Visible = false

	local me = state.player
	local opp = state.opponent
	local isMyTurn = state.isMyTurn
	local pending = state.pendingPrompt

	-- 1. อัปเดตแถบสถานะตรงกลาง
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

	-- 2. วาดโซนข้อมูลและ Leader ของฝ่ายตรงข้าม (คลิกซ้าย = โจมตีใส่ Leader ศัตรู / คลิกขวา = ดูรายละเอียด Leader!)
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
		width = 112,
		height = 156,
		isHighlighted = canAttackEnemyLeader,
		highlightColor = canAttackEnemyLeader and Color3.fromRGB(239, 68, 68) or nil,
		onLeftClick = function()
			-- คลิกซ้ายที่หลีดเดอร์ศัตรู: โจมตีเท่านั้น (ไม่เด้งหน้าต่างรายละเอียดการ์ดตามที่ผู้ใช้กำหนด!)
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

	-- 3. วาดช่อง Monster 3 ช่องของฝ่ายตรงข้าม
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

	-- ปุ่มดูนรกและมิติมืดของศัตรู
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

	-- 4. วาดโซนข้อมูลและ Leader ของผู้เล่น
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
		width = 112,
		height = 156,
		onLeftClick = function()
			if isMyTurn and state.phase == "Main Phase" and me.leader.hasActiveSkill and not me.leader.abilityUsedThisTurn then
				DuelActionEvent:FireServer({ action = "ACTIVATE_LEADER" })
			end
		end,
	})
	myLeaderWidget.Parent = playerLeaderContainer

	-- 5. วาดช่อง Monster 3 ช่องของผู้เล่น
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

	-- ปุ่มดูนรกและมิติมืดของฝั่งเรา
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

	-- 6. วาดการ์ดบนมือของผู้เล่น (Hand Dock)
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
				-- ถ้าเป็นเวทมนตร์, ไฮบริด, อนาคต หรือสายลับ ส่งคำสั่งเล่นทันที
				if card.type == "NormalSpell" or card.type == "ReactionSpell" or card.hybridMaterials or card.futureBaseId or card.isSpy then
					selectedHandIndex = nil
					DuelActionEvent:FireServer({
						action = "PLAY_CARD",
						handIndex = hIdx,
					})
					return
				end
				-- ถ้าเป็นมอนสเตอร์ปกติ ให้คลิกเลือกช่อง 1-3 หรือคลิกซ้ำเพื่อลงช่องว่างอัตโนมัติ
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

	-- 7. แสดงหน้าต่าง Mulligan หากอยู่ในช่วง Mulligan
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

	-- 8. แสดงหน้าต่างเลือกการ์ดแบบรูปการ์ด (Visual Card Choice Modal) เมื่อมี CHOICE prompt!
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

	-- 9. หน้าต่างสรุปผลแพ้/ชนะเมื่อจบเกม
	if state.gameOver then
		gameOverModal.Visible = true
		if state.isWinner then
			goTitle.Text = "🏆 VICTORY! คุณชนะ!"
			goTitle.TextColor3 = Color3.fromRGB(250, 204, 21)
			goStroke.Color = Color3.fromRGB(250, 204, 21)
		else
			goTitle.Text = "💀 DEFEAT! คุณพ่ายแพ้"
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
	elseif packet.packetType == "ROOM_LIST" then
		renderRoomList(packet.rooms)
	elseif packet.packetType == "DECK_SAVED" then
		selectedLeaderId = packet.leaderId or selectedLeaderId
		customMainDeck = packet.mainDeck or customMainDeck
		refreshLobbyDeckSelection()
	elseif packet.packetType == "NOTIFY" and packet.message then
		showToast(packet.message)
	end
end)

print("🎮 [แบทเทิล ออฟ เฟรน] BOF_Client โหลดเสร็จสมบูรณ์! พร้อมดวลการ์ดแล้ว")
