/* ============================================================================
   หมวดที่ 1: ฐานข้อมูลการ์ดทั้งหมด (CARD DATABASE & DEFAULT DECK)
   ----------------------------------------------------------------------------
   - เก็บข้อมูลการ์ดทุกใบในเกม (Leader, Monster, NormalSpell)
   - หากต้องการเพิ่มการ์ดใบใหม่ในอนาคต สามารถคัดลอกโครงสร้าง Object ด้านล่างไปวางต่อท้ายได้เลย
   ============================================================================ */
const CARD_DATABASE = [
  // -------------------- LEADER --------------------
  {
    id: 'L01',
    name: 'มายฮีโร่ เดจิต',
    type: 'Leader',
    maxHp: 6,
    image: 'images/เด็คจิต/1.png',
    ability: 'LEADER_DEJIT_BUFF',
    desc: 'สั่งใช้งาน/1 เทิร์น: เลือกยูนิทฝั่งเรา 1 ตัว เพิ่มพลังโจมตี +1 จนจบเทิร์น'
  },
  {
    id: 'L02',
    name: 'ขุนเหนือ',
    type: 'Leader',
    maxHp: 6,
    image: 'images/เด็คเหนือ/1.png',
    ability: null,
    desc: 'ลีดเดอร์เด็คเหนือ (HP 6)'
  },

  // -------------------- MONSTER (เด็คจิต) --------------------
  {
    id: 'M01',
    name: 'บาคุจิต',
    type: 'Monster',
    power: 2,
    image: 'images/เด็คจิต/2.png',
    ability: 'BAKU_SKILL',
    desc: 'ต่อเนื่อง: ถ้ามีโทโดโรจิตบนสนามเรา พลัง +1 / ออโต้: เมื่อลงสนาม เลือกทำลายยูนิทอีกฝ่าย 1 ใบ'
  },
  {
    id: 'M02',
    name: 'โทโดโรจิต',
    type: 'Monster',
    power: 1,
    image: 'images/เด็คจิต/3.png',
    ability: 'TODORO_SKILL',
    desc: 'สั่งใช้งาน1/เทิร์น: ทิ้งมือ 1 ใบ โม่กองอีกฝ่าย 1 ใบ | สั่งใช้งาน2/เทิร์น: นำบาคุจิตจากนรกขึ้นมือ 1 ใบ'
  },
  {
    id: 'M03',
    name: 'ออลจิต',
    type: 'Monster',
    power: 2,
    image: 'images/เด็คจิต/4.png',
    ability: 'ALL_JIT_HAND_INTERCEPT',
    desc: 'เมื่อลีดเดอร์ถูกโจมตี: อัญเชิญใบนี้จากมือลงสนาม และเปลี่ยนเป้าหมายโจมตีมาที่ใบนี้แทน'
  },
  {
    id: 'M04',
    name: 'ออลฟอจิต',
    type: 'Monster',
    power: 3,
    image: 'images/เด็คจิต/5.png',
    ability: 'ALL_FOR_JIT_GRAVE',
    cannotNormalSummon: true, // กำหนดให้ไม่สามารถอัญเชิญจากมือแบบปกติได้
    desc: 'ห้ามอัญเชิญปกติ | จากนรก/1 เกม (เมื่อลีดเดอร์ถูกตีและ HP<=2): อัญเชิญใบนี้และทำลายยูนิททุกใบบนสนาม'
  },
  {
    id: 'M05',
    name: 'เอ็นเดจิต',
    type: 'Monster',
    power: 2,
    image: 'images/เด็คจิต/6.png',
    ability: 'ENDE_SKILL',
    desc: 'สั่งใช้งาน: พลังโจมตียูนิทนี้ +2 และเมื่อจบเทิร์น ทำลายการ์ดใบนี้'
  },
  {
    id: 'M06',
    name: 'ฮออ์กส์ฟีม',
    type: 'Monster',
    power: 2,
    image: 'images/เด็คจิต/7.png',
    ability: 'HAWKS_SKILL',
    desc: 'สั่งใช้งาน: ลดพลังใบนี้ -2 นำเอ็นเดจิตจากกอง/นรกขึ้นมือ | ออโต้: เมื่อเอ็นเดจิตใช้สกิล ใบนี้พลัง +2'
  },

  // -------------------- SPELL (เวทมนตร์เด็คจิต) --------------------
  {
    id: 'S01',
    name: 'โอ็ยใครเหยียบตีน!!!',
    type: 'NormalSpell',
    effect: 'SPELL_DISCARD_DESTROY',
    image: 'images/เด็คจิต/8.png',
    desc: 'ทิ้งการ์ดบนมือ 1 ใบ เลือกทำลายยูนิทฝั่งตรงข้าม 1 ใบ'
  },
  {
    id: 'S02',
    name: 'เชี่ย หุ้นตก',
    type: 'NormalSpell',
    effect: 'SPELL_DEBUFF_ALL_3',
    image: 'images/เด็คจิต/9.png',
    desc: 'ลดพลังโจมตีของยูนิทฝั่งตรงข้ามทุกใบลง 3 หน่วย จนจบเทิร์น'
  },
  {
    id: 'S03',
    name: 'หนึ่งเดียวเพื่อทุกสิ่ง',
    type: 'NormalSpell',
    effect: 'SPELL_REST_1_HEAL_1',
    image: 'images/เด็คจิต/10.png',
    desc: 'Rest ยูนิทที่ Stand อยู่ฝั่งเรา 1 ใบ แล้วเพิ่มพลังชีวิตลีดเดอร์เรา +1'
  },
  {
    id: 'S04',
    name: 'ทุกสิ่งเพื่อหนึ่งเดียว',
    type: 'NormalSpell',
    effect: 'SPELL_REST_2_GRANT_BURN',
    image: 'images/เด็คจิต/11.png',
    desc: 'Rest ยูนิทฝั่งเรา 2 ใบ เลือกยูนิทเรา 1 ใบได้รับออโต้: เมื่อตีทำลายยูนิทสำเร็จ ทำดาเมจลีดเดอร์อีกฝ่าย 1'
  }
];

// รายชื่อการ์ดเริ่มต้น 20 ใบในเด็ค (ใส่การ์ด 10 แบบ แบบละ 2 ใบ)
const DEFAULT_DECK_LIST = [
  'M01', 'M01', 'M02', 'M02', 'M03', 'M03', 'M04', 'M04', 'M05', 'M05',
  'M06', 'M06', 'S01', 'S01', 'S02', 'S02', 'S03', 'S03', 'S04', 'S04'
];


/* ============================================================================
   หมวดที่ 2: ระบบจัดการกองการ์ด และการคำนวณค่าพลัง (DECK & POWER CALCULATION)
   ----------------------------------------------------------------------------
   - จัดการการสับไพ่ จั่วไพ่ เปลี่ยนมือเริ่มต้น (Mulligan)
   - คำนวณพลังของการ์ดแบบแยกส่วน (พลังพื้นฐาน + พลังถาวร + พลังชั่วคราว + สกิลต่อเนื่อง)
   ============================================================================ */

// ฟังก์ชันสับกองการ์ดแบบสุ่ม (Fisher-Yates Shuffle)
function shuffleDeck(deckArray) {
  const arr = [...deckArray];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ฟังก์ชันสร้าง "การ์ดจริงที่ใช้เล่นในเกม" จากข้อมูลต้นแบบใน CARD_DATABASE
function createCardInstance(template, uid) {
  return {
    ...template,
    uid: uid,                          // รหัสเฉพาะของใบนี้
    state: 'Stand',                    // สถานะการ์ด ('Stand' = ตั้งตรง, 'Rest' = นอนตะแคง)
    basePower: template.power || 0,    // พลังโจมตีพื้นฐานตามหน้าการ์ด
    permPowerMod: 0,                   // พลังที่เพิ่ม/ลดแบบถาวรเมื่ออยู่บนสนาม (เช่น ฮออ์กส์ฟีม)
    tempPowerMod: 0,                   // พลังที่เพิ่ม/ลดชั่วคราวจนจบเทิร์น (เช่น เดจิต, เชี่ย หุ้นตก)
    destroyAtEndOfTurn: false,         // ติดสถานะรอทำลายเมื่อจบเทิร์นหรือไม่ (สำหรับ เอ็นเดจิต)
    burnLeaderOnKill: false,           // ติดความสามารถตีมอนสเตอร์ตายแล้วทำดาเมจลีดเดอร์หรือไม่
    usedSkills: {}                     // บันทึกว่าในเทิร์นนี้กดใช้สกิลย่อยใดไปแล้วบ้าง
  };
}

// ฟังก์ชันล้างค่าสถานะของการ์ดให้กลับมาเป็นค่าเริ่มต้น (เรียกใช้เมื่อการ์ดตกนรกหรือกลับขึ้นมือ)
function resetCardStateForZoneChange(card) {
  if (!card) return card;
  card.state = 'Stand';
  card.permPowerMod = 0;
  card.tempPowerMod = 0;
  card.destroyAtEndOfTurn = false;
  card.burnLeaderOnKill = false;
  card.usedSkills = {};
  return card;
}

// ฟังก์ชันคำนวณพลังโจมตีปัจจุบันของ Monster บนสนาม
function getEffectivePower(card, ownerContestant) {
  if (!card || card.type !== 'Monster') return 0;

  // 1. รวมพลังพื้นฐาน + พลังปรับแต่งถาวร + พลังปรับแต่งชั่วคราวในเทิร์นนี้
  let totalPower = (card.basePower !== undefined ? card.basePower : card.power)
    + (card.permPowerMod || 0)
    + (card.tempPowerMod || 0);

  // 2. ตรวจสอบสกิลต่อเนื่อง (Continuous Effect)
  // การ์ด M01 (บาคุจิต): ถ้าบนสนามฝั่งเดียวกันมี M02 (โทโดโรจิต) อยู่ พลังโจมตี +1
  if (card.id === 'M01' && ownerContestant && Array.isArray(ownerContestant.board)) {
    const hasTodoroOnBoard = ownerContestant.board.some(m => m !== null && m.id === 'M02');
    if (hasTodoroOnBoard) {
      totalPower += 1;
    }
  }

  // ป้องกันไม่ให้ค่าพลังติดลบ (ต่ำสุดคือ 0)
  return Math.max(0, totalPower);
}

// ฟังก์ชันตรวจสอบและสร้างเด็คตามกติกา 21 ใบ (Leader 1 + Main Deck 20, ซ้ำไม่เกิน 2)
function createValidDeck(leaderId, mainDeckCardIds, ownerPrefix) {
  const leaderTemplate = CARD_DATABASE.find(c => c.id === leaderId && c.type === 'Leader')
    || CARD_DATABASE.find(c => c.type === 'Leader');

  const sourceList = (Array.isArray(mainDeckCardIds) && mainDeckCardIds.length === 20)
    ? mainDeckCardIds
    : DEFAULT_DECK_LIST;

  const idCounter = {};
  const mainDeck = [];

  sourceList.forEach((cardId, index) => {
    const cardTemplate = CARD_DATABASE.find(c => c.id === cardId && c.type !== 'Leader');
    if (!cardTemplate) return;

    idCounter[cardTemplate.id] = (idCounter[cardTemplate.id] || 0) + 1;
    if (idCounter[cardTemplate.id] <= 2 && mainDeck.length < 20) {
      mainDeck.push(createCardInstance(cardTemplate, `${ownerPrefix}_${cardTemplate.id}_${index + 1}`));
    }
  });

  return {
    leader: {
      ...leaderTemplate,
      hp: leaderTemplate.maxHp,
      abilityUsedThisTurn: false
    },
    deck: shuffleDeck(mainDeck)
  };
}

// ฟังก์ชันจั่วการ์ดจากใบบนสุดของกองการ์ดเข้ามือ
function drawCards(contestant, count) {
  for (let i = 0; i < count; i++) {
    if (contestant.deck.length > 0) {
      const card = contestant.deck.pop();
      resetCardStateForZoneChange(card);
      contestant.hand.push(card);
    }
  }
}

// ฟังก์ชันเปลี่ยนการ์ดเริ่มต้น (Mulligan) สูงสุด 2 ใบ
function performMulligan(contestant, indicesToMulligan) {
  if (!indicesToMulligan || indicesToMulligan.length === 0) return;
  const sortedIndices = [...indicesToMulligan].sort((a, b) => b - a);
  const returnedCards = [];

  for (const idx of sortedIndices) {
    if (contestant.hand[idx]) {
      returnedCards.push(contestant.hand.splice(idx, 1)[0]);
    }
  }

  drawCards(contestant, returnedCards.length);
  contestant.deck.push(...returnedCards);
  contestant.deck = shuffleDeck(contestant.deck);
}

// ฟังก์ชันส่งยูนิทจากช่องบนสนามลงกองนรก (Graveyard)
function sendBoardMonsterToGraveyard(contestant, slotIndex) {
  const monster = contestant.board[slotIndex];
  if (!monster) return null;
  contestant.board[slotIndex] = null;
  resetCardStateForZoneChange(monster);
  contestant.graveyard.push(monster);
  return monster;
}


/* ============================================================================
   หมวดที่ 3: สถานะของกระดานเกม และหน้าต่างตัวเลือก (GAME STATE & MODAL HELPER)
   ----------------------------------------------------------------------------
   - เก็บตัวแปรสถานะเกมทั้งหมดไว้ในที่เดียว (gameState)
   - มีฟังก์ชันสร้างหน้าต่างปุ่มตัวเลือก (showChoiceModal) เวลาใช้สกิลที่มีหลายทางเลือก
   ============================================================================ */
const gameState = {
  turnCount: 1,
  activeTurn: 'player',       // ตอนนี้เป็นเทิร์นของใคร ('player' หรือ 'ai')
  phase: 'Mulligan',          // เฟสปัจจุบัน ('Mulligan', 'Start Phase', 'Main Phase', 'Battle Phase', 'End Phase')
  mulliganSelected: [],       // ลำดับการ์ดที่เลือกไว้เปลี่ยนตอน Mulligan
  selectedHandIndex: null,    // ลำดับการ์ดบนมือที่กำลังคลิกเลือกเพื่อจะลงสนาม
  selectedAttackerSlot: null, // ช่องของมอนสเตอร์ที่กำลังคลิกเลือกเพื่อสั่งโจมตี
  pendingAttack: null,        // ข้อมูลการโจมตีที่รอการตัดสินใจป้องกัน (Intercept)
  pendingAction: null,        // ข้อมูลสกิลหรือเวทมนตร์ที่กำลังรอให้ผู้เล่นคลิกเลือกเป้าหมาย
  isRollingDice: false,
  gameOver: false,
  player: null,               // ข้อมูลของผู้เล่นทั้งหมด (HP, มือ, สนาม, กองการ์ด, นรก)
  ai: null                    // ข้อมูลของ AI ทั้งหมด
};

// สร้างข้อมูลผู้เล่น 1 ฝั่ง (ใช้ทั้งตอนสร้าง Player และ AI)
function createContestant(name, isFirstPlayer, prefix, leaderId = 'L01', deckList = DEFAULT_DECK_LIST) {
  const setup = createValidDeck(leaderId, deckList, prefix);
  return {
    name,
    isFirstPlayer,
    turnsTaken: 0,
    attacksThisTurn: 0,
    allForJitUsed: false, // ตัวแปรเช็กว่าใช้สกิล "ออลฟอจิต" (1 ครั้ง/เกม) ไปหรือยัง
    leader: setup.leader,
    deck: setup.deck,
    hand: [],
    board: [null, null, null], // สนามมี 3 ช่อง (Index: 0, 1, 2)
    graveyard: [],
    spellQuota: { normalUsed: 0, reactionUsed: 0 }
  };
}

// แสดงข้อความแจ้งเตือนที่แถบตรงกลางกระดาน
function setLog(message) {
  const scrollbox = document.getElementById('action-log-scrollbox');
  if (!scrollbox) return;

  const logItem = document.createElement('div');
  logItem.className = 'log-item';

  // หากเป็นข้อความจาก AI ให้ใส่คลาสพิเศษเพื่อเปลี่ยนสีข้อความให้สังเกตง่าย
  if (message.includes('🤖') || message.includes('AI')) {
    logItem.classList.add('ai-action');
  }

  logItem.textContent = message;
  scrollbox.appendChild(logItem);

  // สั่งให้กล่องเลื่อนลงมาล่างสุดอัตโนมัติ เพื่อให้เห็นการกระทำล่าสุดเสมอ
  scrollbox.scrollTop = scrollbox.scrollHeight;
}
// ตรวจสอบว่ามีฝ่ายใดฝ่ายหนึ่ง HP ของ Leader เหลือ 0 หรือยัง
function checkGameOver() {
  if (gameState.player.leader.hp <= 0) {
    gameState.gameOver = true;
    gameState.pendingAction = null;
    setLog('💀 จบเกม! Leader ของคุณ HP เหลือ 0 — AI เป็นฝ่ายชนะ! (กด F5 หรือจัดเด็คเพื่อเริ่มใหม่)');
    disableControls();
    return true;
  }
  if (gameState.ai.leader.hp <= 0) {
    gameState.gameOver = true;
    gameState.pendingAction = null;
    setLog('🏆 ยินดีด้วย! คุณโจมตี Leader ของ AI จน HP เหลือ 0 — คุณเป็นฝ่ายชนะ!');
    disableControls();
    return true;
  }
  return false;
}

function disableControls() {
  document.getElementById('btn-next-phase').disabled = true;
  document.getElementById('btn-end-turn').disabled = true;
}

// ฟังก์ชันเปิดหน้าต่างป๊อปอัปให้ผู้เล่นกดเลือกตัวเลือกสกิล
function showChoiceModal(title, description, options) {
  let modal = document.getElementById('custom-choice-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'custom-choice-modal';
    modal.className = 'modal-overlay';
    modal.style.display = 'none';
    modal.innerHTML = `
      <div class="modal-box" style="max-width: 560px;">
        <h2 id="choice-modal-title" style="color: #38bdf8;">เลือกการทำงาน</h2>
        <p id="choice-modal-desc" style="color: #cbd5e1; margin: 10px 0 18px 0;"></p>
        <div id="choice-modal-buttons" style="display: flex; flex-direction: column; gap: 10px;"></div>
      </div>
    `;
    document.body.appendChild(modal);
  }

  document.getElementById('choice-modal-title').textContent = title;
  document.getElementById('choice-modal-desc').textContent = description;
  const btnContainer = document.getElementById('choice-modal-buttons');
  btnContainer.innerHTML = '';

  options.forEach(opt => {
    const btn = document.createElement('button');
    btn.className = 'btn';
    btn.style.background = opt.color || '#3b82f6';
    btn.style.padding = '10px 16px';
    btn.textContent = opt.label;
    btn.disabled = !!opt.disabled;
    btn.onclick = () => {
      modal.style.display = 'none';
      if (opt.onSelect) opt.onSelect();
    };
    btnContainer.appendChild(btn);
  });

  modal.style.display = 'flex';
}


/* ============================================================================
   หมวดที่ 4: ความสามารถกดใช้ของ Leader และ Monster บนสนาม (ACTIVATED SKILLS)
   ----------------------------------------------------------------------------
   - สกิลของ มายฮีโร่ เดจิต (L01)
   - สกิลของ โทโดโรจิต (M02), เอ็นเดจิต (M05), และ ฮออ์กส์ฟีม (M06)
   ============================================================================ */

// เมื่อคลิกที่กล่อง Leader ของผู้เล่น เพื่อสั่งใช้สกิล "มายฮีโร่ เดจิต" (L01)
function activateLeaderSkillPlayer() {
  const player = gameState.player;
  if (gameState.gameOver || gameState.activeTurn !== 'player' || gameState.phase !== 'Main Phase') return;
  if (gameState.pendingAction) {
    setLog('⚠️ กรุณาเลือกเป้าหมายของเอฟเฟกต์ที่ค้างอยู่ให้เสร็จก่อน!');
    return;
  }
  if (player.leader.id !== 'L01') {
    setLog('⚠️ ลีดเดอร์ใบนี้ไม่มีความสามารถกดใช้งาน');
    return;
  }
  if (player.leader.abilityUsedThisTurn) {
    setLog('❌ มายฮีโร่ เดจิต ใช้ความสามารถไปแล้วในเทิร์นนี้ (จำกัด 1 ครั้ง/เทิร์น)');
    return;
  }
  if (!player.board.some(m => m !== null)) {
    setLog('⚠️ ไม่มีมอนสเตอร์บนสนามฝั่งเราให้เพิ่มพลัง!');
    return;
  }

  gameState.selectedHandIndex = null;
  gameState.pendingAction = { type: 'LEADER_L01_TARGET' };
  setLog('👑 [มายฮีโร่ เดจิต] คลิกเลือกยูนิทฝั่งเรา 1 ตัวบนสนาม เพื่อเพิ่มพลังโจมตี +1 จนจบเทิร์น');
  renderGame();
}

// เมื่อคลิกที่ Monster บนสนามของผู้เล่นใน Main Phase เพื่อสั่งใช้ความสามารถ
function activateMonsterOnBoardPlayer(slotIndex) {
  const player = gameState.player;
  const monster = player.board[slotIndex];
  if (!monster) return;

  // -------------------- 1. โทโดโรจิต (M02) --------------------
  if (monster.id === 'M02') {
    const usedSkill1 = !!monster.usedSkills.todoroMill;
    const usedSkill2 = !!monster.usedSkills.todoroRecover;
    const canSkill1 = !usedSkill1 && player.hand.length > 0 && gameState.ai.deck.length > 0;
    const hasBakuInGrave = player.graveyard.some(c => c.id === 'M01');
    const canSkill2 = !usedSkill2 && hasBakuInGrave;

    showChoiceModal(
      '❄️ เลือกความสามารถของ โทโดโรจิต',
      'แต่ละความสามารถสั่งใช้ได้เทิร์นละ 1 ครั้ง (แยกกัน)',
      [
        {
          label: `1) ทิ้งมือ 1 ใบ -> ส่งใบบนสุดกองอีกฝ่ายลงนรก ${usedSkill1 ? '(ใช้แล้ว)' : !canSkill1 ? '(เงื่อนไขไม่ครบ)' : ''}`,
          disabled: !canSkill1,
          color: '#0284c7',
          onSelect: () => {
            gameState.pendingAction = {
              type: 'TODORO_SKILL1_DISCARD',
              sourceSlot: slotIndex
            };
            setLog('👉 [โทโดโรจิต] คลิกเลือกการ์ดบนมือของคุณ 1 ใบเพื่อทิ้งลงนรก');
            renderGame();
          }
        },
        {
          label: `2) นำ "บาคุจิต" 1 ใบจากนรกขึ้นมือ ${usedSkill2 ? '(ใช้แล้ว)' : !hasBakuInGrave ? '(ไม่มีบาคุจิตในนรก)' : ''}`,
          disabled: !canSkill2,
          color: '#16a34a',
          onSelect: () => {
            const bakuIdx = player.graveyard.findIndex(c => c.id === 'M01');
            if (bakuIdx !== -1) {
              const bakuCard = player.graveyard.splice(bakuIdx, 1)[0];
              resetCardStateForZoneChange(bakuCard);
              player.hand.push(bakuCard);
              monster.usedSkills.todoroRecover = true;
              setLog('✨ [โทโดโรจิต] นำ "บาคุจิต" 1 ใบจากกองนรกขึ้นมือสำเร็จ!');
              renderGame();
            }
          }
        },
        {
          label: 'ยกเลิก',
          color: '#475569',
          onSelect: () => renderGame()
        }
      ]
    );
    return;
  }

  // -------------------- 2. เอ็นเดจิต (M05) --------------------
  if (monster.id === 'M05') {
    if (monster.usedSkills.endeBoost) {
      setLog('⚠️ เอ็นเดจิต ใช้ความสามารถไปแล้วในเทิร์นนี้!');
      return;
    }
    triggerEndeSkill(player, slotIndex);
    renderGame();
    return;
  }

  // -------------------- 3. ฮออ์กส์ฟีม (M06) --------------------
  if (monster.id === 'M06') {
    if (monster.usedSkills.hawksSearch) {
      setLog('⚠️ ฮออ์กส์ฟีม ใช้ความสามารถค้นหาไปแล้วในเทิร์นนี้!');
      return;
    }
    if (getEffectivePower(monster, player) < 2) {
      setLog('⚠️ พลังของ ฮออ์กส์ฟีม น้อยกว่า 2 จึงไม่สามารถลดพลังเพื่อใช้สกิลได้!');
      return;
    }
    const inDeck = player.deck.some(c => c.id === 'M05');
    const inGrave = player.graveyard.some(c => c.id === 'M05');
    if (!inDeck && !inGrave) {
      setLog('⚠️ ไม่มี "เอ็นเดจิต" อยู่ในกองการ์ดหรือกองนรกเลย!');
      return;
    }

    showChoiceModal(
      '🦅 ความสามารถของ ฮออ์กส์ฟีม',
      'ลดพลังโจมตีของยูนิทนี้ลง 2 หน่วย เพื่อนำ "เอ็นเดจิต" ขึ้นมือ',
      [
        {
          label: `ดึง "เอ็นเดจิต" จากกองการ์ด (พร้อมสับกอง) ${!inDeck ? '(ไม่มีในกอง)' : ''}`,
          disabled: !inDeck,
          color: '#0284c7',
          onSelect: () => executeHawksSearch(player, slotIndex, 'deck')
        },
        {
          label: `ดึง "เอ็นเดจิต" จากกองนรก ${!inGrave ? '(ไม่มีในนรก)' : ''}`,
          disabled: !inGrave,
          color: '#7c3aed',
          onSelect: () => executeHawksSearch(player, slotIndex, 'grave')
        },
        {
          label: 'ยกเลิก',
          color: '#475569',
          onSelect: () => renderGame()
        }
      ]
    );
    return;
  }

  setLog(`ℹ️ "${monster.name}" ไม่มีสกิลกดใช้บนสนาม (หากต้องการโจมตี ให้กดปุ่มเข้าสู่ Battle Phase)`);
}

// ฟังก์ชันทำงานสกิลของ เอ็นเดจิต (M05) และทริกเกอร์สกิลออโต้ของ ฮออ์กส์ฟีม (M06)
function triggerEndeSkill(contestant, slotIndex) {
  const ende = contestant.board[slotIndex];
  if (!ende || ende.id !== 'M05') return;

  ende.tempPowerMod += 2;
  ende.destroyAtEndOfTurn = true;
  ende.usedSkills.endeBoost = true;

  // ออโต้ของ ฮออ์กส์ฟีม (M06): เมื่อเอ็นเดจิตใช้งานความสามารถ พลังของฮออ์กส์ฟีมบนสนาม +2
  let hawksCount = 0;
  contestant.board.forEach(m => {
    if (m && m.id === 'M06') {
      m.permPowerMod += 2;
      hawksCount += 1;
    }
  });

  const hawksText = hawksCount > 0 ? ` และสกิลออโต้ของ "ฮออ์กส์ฟีม" ทำงาน (+2 Power)!` : '';
  setLog(`🔥 [${contestant.name}] "เอ็นเดจิต" เพิ่มพลังโจมตี +2 (จะถูกทำลายเมื่อจบเทิร์น)${hawksText}`);
}

// ฟังก์ชันทำงานสกิลค้นหาของ ฮออ์กส์ฟีม (M06)
function executeHawksSearch(contestant, slotIndex, sourceZone) {
  const hawks = contestant.board[slotIndex];
  if (!hawks || hawks.id !== 'M06') return;

  if (sourceZone === 'deck') {
    const idx = contestant.deck.findIndex(c => c.id === 'M05');
    if (idx === -1) return;
    hawks.permPowerMod -= 2;
    hawks.usedSkills.hawksSearch = true;
    const found = contestant.deck.splice(idx, 1)[0];
    resetCardStateForZoneChange(found);
    contestant.hand.push(found);
    contestant.deck = shuffleDeck(contestant.deck); // ดึงจากกองการ์ด ต้องสับกองใหม่
    setLog(`🦅 [${contestant.name}] "ฮออ์กส์ฟีม" ลดพลัง -2 นำ "เอ็นเดจิต" จากกองการ์ดขึ้นมือและสับกองเรียบร้อย!`);
  } else if (sourceZone === 'grave') {
    const idx = contestant.graveyard.findIndex(c => c.id === 'M05');
    if (idx === -1) return;
    hawks.permPowerMod -= 2;
    hawks.usedSkills.hawksSearch = true;
    const found = contestant.graveyard.splice(idx, 1)[0];
    resetCardStateForZoneChange(found);
    contestant.hand.push(found);
    setLog(`🦅 [${contestant.name}] "ฮออ์กส์ฟีม" ลดพลัง -2 นำ "เอ็นเดจิต" จากกองนรกขึ้นมือเรียบร้อย!`);
  }
  renderGame();
}


/* ============================================================================
   หมวดที่ 5: ระบบการ์ดเวทมนตร์ (SPELL CARDS)
   ----------------------------------------------------------------------------
   - ตรวจสอบเงื่อนไขก่อนใช้เวทมนตร์แต่ละใบ (S01, S02, S03, S04)
   ============================================================================ */
function initiatePlayerSpell(handIndex) {
  const player = gameState.player;
  const ai = gameState.ai;
  const spell = player.hand[handIndex];
  if (!spell) return;

  if (player.spellQuota.normalUsed >= 1) {
    setLog('❌ คุณใช้โควต้า Normal Spell (1 ใบ/เทิร์น) ไปแล้วในเทิร์นนี้!');
    return;
  }

  // S01: โอ็ยใครเหยียบตีน!!! (ทิ้งมือ 1 ใบ ทำลายยูนิทฝ่ายตรงข้าม 1 ใบ)
  if (spell.id === 'S01') {
    const otherHandCards = player.hand.filter((_, idx) => idx !== handIndex);
    if (otherHandCards.length === 0) {
      setLog('⚠️ ใช้ "โอ็ยใครเหยียบตีน!!!" ไม่ได้: ต้องมีการ์ดใบอื่นบนมืออย่างน้อย 1 ใบเพื่อใช้ทิ้ง!');
      return;
    }
    if (!ai.board.some(m => m !== null)) {
      setLog('⚠️ ใช้ "โอ็ยใครเหยียบตีน!!!" ไม่ได้: ฝ่ายตรงข้ามไม่มีมอนสเตอร์บนสนามให้ทำลาย!');
      return;
    }
    gameState.selectedHandIndex = null;
    gameState.pendingAction = {
      type: 'SPELL_S01_DISCARD',
      spellHandIndex: handIndex
    };
    setLog('🦶 [โอ็ยใครเหยียบตีน!!!] ขั้นที่ 1: คลิกเลือกการ์ดใบอื่นบนมือของคุณ 1 ใบเพื่อทิ้งลงนรก');
    renderGame();
    return;
  }

  // S02: เชี่ย หุ้นตก (ลดพลังยูนิทฝ่ายตรงข้ามทุกใบลง 3 จนจบเทิร์น)
  if (spell.id === 'S02') {
    if (!ai.board.some(m => m !== null)) {
      setLog('⚠️ ใช้ "เชี่ย หุ้นตก" ไม่ได้: ฝ่ายตรงข้ามไม่มีมอนสเตอร์บนสนาม!');
      return;
    }
    const usedSpell = player.hand.splice(handIndex, 1)[0];
    player.spellQuota.normalUsed += 1;
    ai.board.forEach(m => {
      if (m) m.tempPowerMod -= 3;
    });
    player.graveyard.push(usedSpell);
    gameState.selectedHandIndex = null;
    setLog('📉 [เชี่ย หุ้นตก] ลดพลังโจมตีของยูนิทฝ่ายตรงข้ามทุกใบลง 3 หน่วยจนจบเทิร์น!');
    renderGame();
    return;
  }

  // S03: หนึ่งเดียวเพื่อทุกสิ่ง (Rest ยูนิทเราที่ Stand 1 ใบ แล้วเพิ่มพลังชีวิตลีดเดอร์ +1)
  if (spell.id === 'S03') {
    if (!player.board.some(m => m !== null && m.state === 'Stand')) {
      setLog('⚠️ ใช้ "หนึ่งเดียวเพื่อทุกสิ่ง" ไม่ได้: ไม่มีมอนสเตอร์ฝ่ายเราที่อยู่ในสถานะ Stand!');
      return;
    }
    gameState.selectedHandIndex = null;
    gameState.pendingAction = {
      type: 'SPELL_S03_REST_TARGET',
      spellHandIndex: handIndex
    };
    setLog('✨ [หนึ่งเดียวเพื่อทุกสิ่ง] คลิกเลือกยูนิทฝ่ายเราที่ Stand อยู่ 1 ใบเพื่อเปลี่ยนเป็น Rest และเพิ่ม HP ลีดเดอร์ +1');
    renderGame();
    return;
  }

  // S04: ทุกสิ่งเพื่อหนึ่งเดียว (Rest ยูนิทเรา 2 ใบ แล้วเลือก 1 ใบรับความสามารถพิเศษ)
  if (spell.id === 'S04') {
    const standAllies = player.board.filter(m => m !== null && m.state === 'Stand');
    if (standAllies.length < 2) {
      setLog('⚠️ ใช้ "ทุกสิ่งเพื่อหนึ่งเดียว" ไม่ได้: ต้องมียูนิทฝ่ายเราที่อยู่ในสถานะ Stand อย่างน้อย 2 ใบ!');
      return;
    }
    gameState.selectedHandIndex = null;
    gameState.pendingAction = {
      type: 'SPELL_S04_REST_FIRST',
      spellHandIndex: handIndex,
      firstRestSlot: null
    };
    setLog('🌟 [ทุกสิ่งเพื่อหนึ่งเดียว] ขั้นที่ 1/3: คลิกเลือกยูนิทฝ่ายเราที่ Stand อยู่ใบที่ 1 เพื่อเปลี่ยนเป็น Rest');
    renderGame();
  }
}


/* ============================================================================
   หมวดที่ 6: ระบบจัดการเทิร์น และการคลิกของผู้เล่น (TURN & CLICK HANDLERS)
   ----------------------------------------------------------------------------
   - ควบคุม Start Phase, End Phase Cleanup และการคลิกการ์ดบนมือ/บนสนาม
   ============================================================================ */

// ตรวจสอบสิทธิ์การโจมตี (รวมกฎ Turn 1 ห้ามตี และคนเริ่มหลังตีได้ครั้งเดียวในเทิร์นแรก)
function canContestantAttack(contestant, monster) {
  if (gameState.gameOver) return { allowed: false, reason: 'เกมจบแล้ว' };
  if (!monster || monster.state !== 'Stand') {
    return { allowed: false, reason: 'ยูนิทต้องอยู่ในสถานะ Stand เท่านั้นจึงจะโจมตีได้' };
  }
  if (contestant.isFirstPlayer && contestant.turnsTaken === 1) {
    return { allowed: false, reason: '🚫 กฎผู้เล่นเริ่มคนแรก: ห้ามโจมตีใน Turn 1!' };
  }
  if (!contestant.isFirstPlayer && contestant.turnsTaken === 1 && contestant.attacksThisTurn >= 1) {
    return { allowed: false, reason: '🚫 กฎผู้เล่นเริ่มคนที่สอง: ในเทิร์นแรกของตัวเอง โจมตีได้เพียง 1 ครั้ง!' };
  }
  return { allowed: true };
}

// ทำงานช่วงเริ่มต้นเทิร์น (Start Phase)
function executeStartPhase(contestant) {
  contestant.turnsTaken += 1;
  contestant.attacksThisTurn = 0;
  contestant.leader.abilityUsedThisTurn = false;
  contestant.spellQuota.normalUsed = 0;
  contestant.spellQuota.reactionUsed = 0;

  drawCards(contestant, 1);

  contestant.board.forEach(m => {
    if (m) {
      m.state = 'Stand';
      m.usedSkills = {};
    }
  });
}

// ทำงานช่วงจบเทิร์น (End Phase): ทำลายเอ็นเดจิตที่ใช้สกิล และล้างค่าพลังชั่วคราวทั้งหมด
function executeEndPhaseCleanup(activeContestant) {
  // 1. ทำลาย เอ็นเดจิต (M05) ที่กดใช้สกิลในเทิร์นนี้และส่งลงกองนรก
  activeContestant.board.forEach((m, idx) => {
    if (m && m.destroyAtEndOfTurn) {
      sendBoardMonsterToGraveyard(activeContestant, idx);
      setLog(`🔥 "${m.name}" ถูกทำลายเมื่อจบเทิร์นตามเงื่อนไขความสามารถ และถูกส่งลงกองนรก!`);
    }
  });

  // 2. ล้างบัฟและดีบัฟที่อยู่แค่ "จนจบเทิร์น" ของทุกใบ
  [gameState.player, gameState.ai].forEach(side => {
    side.board.forEach(m => {
      if (m) m.tempPowerMod = 0;
    });
  });
}

// เมื่อผู้เล่นคลิกที่การ์ดบนมือตัวเอง
function handleHandCardClick(handIndex) {
  if (gameState.gameOver || gameState.isRollingDice || gameState.activeTurn !== 'player' || gameState.phase !== 'Main Phase') {
    setLog('⚠️ ใช้งานการ์ดบนมือได้เฉพาะใน Main Phase ของคุณเท่านั้น!');
    return;
  }

  const player = gameState.player;
  const clickedCard = player.hand[handIndex];
  if (!clickedCard) return;

  // กรณีที่ 1: กำลังอยู่ในโหมดรอคลิกเลือกการ์ดบนมือเพื่อทิ้ง
  if (gameState.pendingAction) {
    // ทิ้งมือจากสกิลที่ 1 ของ โทโดโรจิต (M02)
    if (gameState.pendingAction.type === 'TODORO_SKILL1_DISCARD') {
      const sourceMonster = player.board[gameState.pendingAction.sourceSlot];
      const discarded = player.hand.splice(handIndex, 1)[0];
      resetCardStateForZoneChange(discarded);
      player.graveyard.push(discarded);

      let milledMsg = '';
      if (gameState.ai.deck.length > 0) {
        const milled = gameState.ai.deck.pop();
        resetCardStateForZoneChange(milled);
        gameState.ai.graveyard.push(milled);
        milledMsg = ` และส่ง "${milled.name}" ใบบนสุดของกอง AI ลงนรก!`;
      }
      if (sourceMonster) sourceMonster.usedSkills.todoroMill = true;
      gameState.pendingAction = null;
      setLog(`❄️ [โทโดโรจิต] ทิ้ง "${discarded.name}" จากมือ${milledMsg}`);
      renderGame();
      return;
    }

    // ทิ้งมือจากเวทย์ โอ็ยใครเหยียบตีน!!! (S01)
    if (gameState.pendingAction.type === 'SPELL_S01_DISCARD') {
      if (handIndex === gameState.pendingAction.spellHandIndex) {
        setLog('⚠️ กรุณาคลิกเลือกการ์ดใบอื่นบนมือเพื่อใช้ทิ้ง (ไม่ใช่ตัวการ์ดเวทย์เอง)!');
        return;
      }
      gameState.pendingAction.discardHandIndex = handIndex;
      gameState.pendingAction.type = 'SPELL_S01_DESTROY_TARGET';
      setLog(`🦶 [โอ็ยใครเหยียบตีน!!!] เลือกทิ้ง "${clickedCard.name}" แล้ว — ขั้นที่ 2: คลิกเลือกยูนิทของ AI บนสนามที่ต้องการทำลาย!`);
      renderGame();
      return;
    }

    setLog('⚠️ กรุณาคลิกเลือกเป้าหมายบนสนามตามที่ระบบแจ้งเตือนอยู่!');
    return;
  }

  // กรณีที่ 2: คลิกการ์ด Monster เพื่อเตรียมอัญเชิญลงสนาม
  if (clickedCard.type === 'Monster') {
    if (clickedCard.cannotNormalSummon || clickedCard.id === 'M04') {
      setLog('🚫 "ออลฟอจิต" ไม่สามารถอัญเชิญแบบปกติได้! (ต้องสั่งใช้จากกองนรกเมื่อลีดเดอร์ถูกตีและ HP <= 2)');
      return;
    }

    gameState.selectedHandIndex = (gameState.selectedHandIndex === handIndex) ? null : handIndex;
    setLog(gameState.selectedHandIndex !== null
      ? `👉 เลือก "${clickedCard.name}" แล้ว — คลิกที่ช่องว่างบนกระดานของคุณเพื่ออัญเชิญลงสนาม!`
      : 'ยกเลิกการเลือกการ์ดบนมือ');
    renderGame();
    return;
  }

  // กรณีที่ 3: คลิกการ์ด Normal Spell เพื่อใช้งาน
  if (clickedCard.type === 'NormalSpell') {
    initiatePlayerSpell(handIndex);
  }
}

// เมื่อผู้เล่นคลิกที่ช่องบนสนามฝั่งตัวเอง (หรือกล่อง Leader ตัวเอง)
function handlePlayerSlotClick(slotIndex) {
  if (gameState.gameOver || gameState.isRollingDice || gameState.activeTurn !== 'player') return;
  const player = gameState.player;

  if (slotIndex === 'leader') {
    activateLeaderSkillPlayer();
    return;
  }

  const slotMonster = player.board[slotIndex];

  // --- ส่วนที่ 1: หากกำลังรอเลือกเป้าหมายฝั่งตัวเองจากสกิล/เวทมนตร์ ---
  if (gameState.pendingAction) {
    const action = gameState.pendingAction;

    // เป้าหมายสกิลลีดเดอร์ มายฮีโร่ เดจิต (L01)
    if (action.type === 'LEADER_L01_TARGET') {
      if (!slotMonster) {
        setLog('⚠️ กรุณาคลิกช่องที่มียูนิทฝ่ายเราอยู่!');
        return;
      }
      slotMonster.tempPowerMod += 1;
      player.leader.abilityUsedThisTurn = true;
      gameState.pendingAction = null;
      setLog(`👑 [มายฮีโร่ เดจิต] เพิ่มพลังโจมตีให้ "${slotMonster.name}" +1 จนจบเทิร์น! (พลังปัจจุบัน: ${getEffectivePower(slotMonster, player)})`);
      renderGame();
      return;
    }

    // เป้าหมายเวทย์ S03: หนึ่งเดียวเพื่อทุกสิ่ง
    if (action.type === 'SPELL_S03_REST_TARGET') {
      if (!slotMonster || slotMonster.state !== 'Stand') {
        setLog('⚠️ กรุณาคลิกเลือกยูนิทฝ่ายเราที่อยู่ในสถานะ Stand เท่านั้น!');
        return;
      }
      const usedSpell = player.hand.splice(action.spellHandIndex, 1)[0];
      player.spellQuota.normalUsed += 1;
      slotMonster.state = 'Rest';
      const oldHp = player.leader.hp;
      player.leader.hp = Math.min(player.leader.maxHp, player.leader.hp + 1);
      player.graveyard.push(usedSpell);
      gameState.pendingAction = null;
      setLog(`✨ [หนึ่งเดียวเพื่อทุกสิ่ง] เปลี่ยน "${slotMonster.name}" เป็น Rest และฟื้นฟู HP ลีดเดอร์ (${oldHp} -> ${player.leader.hp}/6)!`);
      renderGame();
      return;
    }

    // เป้าหมายเวทย์ S04 ขั้นที่ 1: เลือกตัวที่ 1 เพื่อ Rest
    if (action.type === 'SPELL_S04_REST_FIRST') {
      if (!slotMonster || slotMonster.state !== 'Stand') {
        setLog('⚠️ กรุณาคลิกเลือกยูนิทฝ่ายเราที่อยู่ในสถานะ Stand ใบที่ 1!');
        return;
      }
      action.firstRestSlot = slotIndex;
      action.type = 'SPELL_S04_REST_SECOND';
      setLog(`🌟 [ทุกสิ่งเพื่อหนึ่งเดียว] เลือก "${slotMonster.name}" เป็นใบที่ 1 แล้ว — ขั้นที่ 2/3: คลิกเลือกยูนิทที่ Stand ใบที่ 2 เพื่อ Rest`);
      renderGame();
      return;
    }

    // เป้าหมายเวทย์ S04 ขั้นที่ 2: เลือกตัวที่ 2 เพื่อ Rest
    if (action.type === 'SPELL_S04_REST_SECOND') {
      if (slotIndex === action.firstRestSlot) {
        setLog('⚠️ กรุณาคลิกเลือกยูนิทคนละใบกับใบแรก!');
        return;
      }
      if (!slotMonster || slotMonster.state !== 'Stand') {
        setLog('⚠️ กรุณาคลิกเลือกยูนิทฝ่ายเราที่อยู่ในสถานะ Stand ใบที่ 2!');
        return;
      }
      action.secondRestSlot = slotIndex;
      action.type = 'SPELL_S04_CHOOSE_BENEFICIARY';
      setLog('🌟 [ทุกสิ่งเพื่อหนึ่งเดียว] ขั้นที่ 3/3: คลิกเลือกยูนิทฝ่ายเรา 1 ใบบนสนามเพื่อรับความสามารถพิเศษ!');
      renderGame();
      return;
    }

    // เป้าหมายเวทย์ S04 ขั้นที่ 3: เลือกตัวรับความสามารถพิเศษ
    if (action.type === 'SPELL_S04_CHOOSE_BENEFICIARY') {
      if (!slotMonster) {
        setLog('⚠️ กรุณาคลิกเลือกยูนิทฝ่ายเรา 1 ใบบนสนาม!');
        return;
      }
      const usedSpell = player.hand.splice(action.spellHandIndex, 1)[0];
      player.spellQuota.normalUsed += 1;
      if (player.board[action.firstRestSlot]) player.board[action.firstRestSlot].state = 'Rest';
      if (player.board[action.secondRestSlot]) player.board[action.secondRestSlot].state = 'Rest';
      slotMonster.burnLeaderOnKill = true;
      player.graveyard.push(usedSpell);
      gameState.pendingAction = null;
      setLog(`🌟 [ทุกสิ่งเพื่อหนึ่งเดียว] Rest ยูนิท 2 ใบ และมอบสกิลออโต้ให้ "${slotMonster.name}" สำเร็จ!`);
      renderGame();
      return;
    }

    return;
  }

  // --- ส่วนที่ 2: การวาง Monster จากมือลงช่องว่างบนสนาม ---
  if (gameState.phase === 'Main Phase' && gameState.selectedHandIndex !== null) {
    const selectedCard = player.hand[gameState.selectedHandIndex];
    if (!selectedCard || selectedCard.type !== 'Monster') return;

    if (selectedCard.cannotNormalSummon || selectedCard.id === 'M04') {
      setLog('🚫 "ออลฟอจิต" ไม่สามารถอัญเชิญแบบปกติได้!');
      gameState.selectedHandIndex = null;
      renderGame();
      return;
    }

    if (player.board[slotIndex] !== null) {
      setLog('⚠️ ช่องนี้มียูนิทวางอยู่แล้ว กรุณาคลิกเลือกช่องว่าง!');
      return;
    }

    const summoned = player.hand.splice(gameState.selectedHandIndex, 1)[0];
    resetCardStateForZoneChange(summoned);
    summoned.state = 'Stand';
    player.board[slotIndex] = summoned;
    gameState.selectedHandIndex = null;

    // ตรวจสอบสกิลออโต้เมื่อลงสนามของ บาคุจิต (M01)
    if (summoned.id === 'M01') {
      const hasEnemy = gameState.ai.board.some(m => m !== null);
      if (hasEnemy) {
        gameState.pendingAction = { type: 'BAKU_DESTROY_TARGET' };
        setLog('💥 [บาคุจิต - ออโต้เมื่อลงสนาม] กรุณาคลิกเลือกยูนิทของ AI บนสนาม 1 ใบเพื่อทำลาย!');
      } else {
        setLog('✅ อัญเชิญ "บาคุจิต" ลงสนามสำเร็จ! (ฝ่ายตรงข้ามไม่มีมอนสเตอร์ให้ทำลาย)');
      }
      renderGame();
      return;
    }

    setLog(`✅ อัญเชิญ "${summoned.name}" ลงช่องที่ ${slotIndex + 1} สำเร็จ!`);
    renderGame();
    return;
  }

  // --- ส่วนที่ 3: คลิกยูนิทบนสนามตัวเองใน Main Phase เพื่อเปิดใช้สกิล ---
  if (gameState.phase === 'Main Phase' && gameState.selectedHandIndex === null) {
    if (slotMonster) {
      activateMonsterOnBoardPlayer(slotIndex);
    }
    return;
  }

  // --- ส่วนที่ 4: คลิกยูนิทตัวเองใน Battle Phase เพื่อเลือกสั่งโจมตี ---
  if (gameState.phase === 'Battle Phase') {
    if (!slotMonster) return;

    const check = canContestantAttack(player, slotMonster);
    if (!check.allowed) {
      setLog(check.reason);
      return;
    }

    gameState.selectedAttackerSlot = (gameState.selectedAttackerSlot === slotIndex) ? null : slotIndex;
    setLog(gameState.selectedAttackerSlot !== null
      ? `⚔️ เลือก "${slotMonster.name}" (Power ${getEffectivePower(slotMonster, player)}) — คลิกที่ยูนิทของ AI หรือคลิกที่ AI Leader เพื่อโจมตี!`
      : 'ยกเลิกการเลือกยูนิทโจมตี');
    renderGame();
  }
}

// เมื่อผู้เล่นคลิกที่ช่องบนสนามฝั่ง AI (เพื่อเลือกเป้าหมายทำลาย หรือสั่งโจมตี)
function handleAISlotClick(aiSlotIndex) {
  if (gameState.gameOver || gameState.activeTurn !== 'player') return;
  const player = gameState.player;
  const ai = gameState.ai;
  const targetMonster = ai.board[aiSlotIndex];

  // กรณีที่ 1: กำลังเลือกเป้าหมายทำลายบนสนาม AI
  if (gameState.pendingAction) {
    const action = gameState.pendingAction;

    // ทำลายจากสกิลลงสนามของ บาคุจิต (M01)
    if (action.type === 'BAKU_DESTROY_TARGET') {
      if (!targetMonster) {
        setLog('⚠️ กรุณาคลิกเลือกช่องที่มีมอนสเตอร์ของ AI อยู่!');
        return;
      }
      sendBoardMonsterToGraveyard(ai, aiSlotIndex);
      gameState.pendingAction = null;
      setLog(`💥 [บาคุจิต] ทำลาย "${targetMonster.name}" ของ AI ลงกองนรกสำเร็จ!`);
      renderGame();
      return;
    }

    // ทำลายจากเวทย์ โอ็ยใครเหยียบตีน!!! (S01)
    if (action.type === 'SPELL_S01_DESTROY_TARGET') {
      if (!targetMonster) {
        setLog('⚠️ กรุณาคลิกเลือกช่องที่มีมอนสเตอร์ของ AI อยู่!');
        return;
      }
      const spellIdx = action.spellHandIndex;
      const discardIdx = action.discardHandIndex;
      const spellCard = player.hand[spellIdx];
      const discardCard = player.hand[discardIdx];

      [spellIdx, discardIdx].sort((a, b) => b - a).forEach(idx => {
        player.hand.splice(idx, 1);
      });

      resetCardStateForZoneChange(discardCard);
      resetCardStateForZoneChange(spellCard);
      player.graveyard.push(discardCard);
      player.graveyard.push(spellCard);
      player.spellQuota.normalUsed += 1;

      sendBoardMonsterToGraveyard(ai, aiSlotIndex);
      gameState.pendingAction = null;
      setLog(`🦶 [โอ็ยใครเหยียบตีน!!!] ทิ้ง "${discardCard.name}" และทำลาย "${targetMonster.name}" ของ AI ลงนรกสำเร็จ!`);
      renderGame();
      return;
    }

    return;
  }

  // กรณีที่ 2: โจมตีใส่ Monster ของ AI ใน Battle Phase
  if (gameState.phase !== 'Battle Phase' || gameState.selectedAttackerSlot === null) return;
  if (!targetMonster) {
    setLog('⚠️ ช่องนี้ไม่มีมอนสเตอร์ของ AI ให้โจมตี!');
    return;
  }

  executeAttack(player, ai, gameState.selectedAttackerSlot, 'monster', aiSlotIndex);
}

// เมื่อคลิกที่กล่อง AI Leader เพื่อสั่งโจมตีเข้าตัว Leader โดยตรง
document.getElementById('ai-leader-box').addEventListener('click', () => {
  if (gameState.gameOver || gameState.activeTurn !== 'player' || gameState.phase !== 'Battle Phase') return;
  if (gameState.pendingAction) return;
  if (gameState.selectedAttackerSlot === null) return;

  executeAttack(gameState.player, gameState.ai, gameState.selectedAttackerSlot, 'leader', null);
});


/* ============================================================================
   หมวดที่ 7: ระบบการต่อสู้, ออลจิต, ออลฟอจิต และ INTERCEPT (COMBAT SYSTEM)
   ----------------------------------------------------------------------------
   - จัดการการโจมตี การวัดพลัง และการเรียกใช้สกิลป้องกันเมื่อ Leader ถูกโจมตี
   ============================================================================ */
function executeAttack(attacker, defender, attackerSlot, targetType, targetSlot, onCompleteCallback = null) {
  const attackingMonster = attacker.board[attackerSlot];
  const check = canContestantAttack(attacker, attackingMonster);
  if (!check.allowed) {
    if (onCompleteCallback) onCompleteCallback();
    return;
  }

  attackingMonster.state = 'Rest';
  attacker.attacksThisTurn += 1;
  gameState.selectedAttackerSlot = null;

  // ถ้าระบุเป้าหมายเป็น Monster ให้เปรียบเทียบพลังกันทันที
  if (targetType === 'monster') {
    const msg = compareAndDestroyMonsters(attacker, attackerSlot, defender, targetSlot);
    setLog(`⚔️ [${attacker.name}] สั่ง "${attackingMonster.name}" โจมตี! -> ${msg}`);
    renderGame();
    checkGameOver();
    if (onCompleteCallback) onCompleteCallback();
    return;
  }

  // ถ้าระบุเป้าหมายเป็น Leader ให้ตรวจสอบสกิลเมื่อ Leader ถูกโจมตี (ออลฟอจิต / ออลจิต / Intercept)
  checkWhenLeaderAttacked(attacker, defender, attackerSlot, onCompleteCallback);
}

function checkWhenLeaderAttacked(attacker, defender, attackerSlot, onCompleteCallback) {
  const attackingMonster = attacker.board[attackerSlot];
  if (!attackingMonster) {
    if (onCompleteCallback) onCompleteCallback();
    return;
  }

  // เงื่อนไขของ ออลฟอจิต (M04): อยู่ในนรก + HP ลีดเดอร์ <= 2 + ยังไม่เคยใช้ในเกมนี้
  const canUseAllForJit = defender.leader.hp <= 2
    && !defender.allForJitUsed
    && defender.graveyard.some(c => c.id === 'M04');

  // เงื่อนไขของ ออลจิต (M03): อยู่ในมือ + มีช่องว่างบนสนาม
  const canUseAllJit = defender.hand.some(c => c.id === 'M03')
    && defender.board.some(m => m === null);

  if (defender.name === 'AI') {
    if (canUseAllForJit) {
      resolveAllForJitTrigger(attacker, defender, attackerSlot, onCompleteCallback);
      return;
    }
    if (canUseAllJit) {
      resolveAllJitFromHand(attacker, defender, attackerSlot, onCompleteCallback);
      return;
    }
    proceedToStandardIntercept(attacker, defender, attackerSlot, onCompleteCallback);
    return;
  }

  if (canUseAllForJit || canUseAllJit) {
    const options = [];
    if (canUseAllForJit) {
      options.push({
        label: '💀 สั่งใช้ "ออลฟอจิต" จากนรก (1 ครั้ง/เกม: ล้างกระดานทุกฝ่ายและอัญเชิญออลฟอจิตลงสนาม!)',
        color: '#dc2626',
        onSelect: () => resolveAllForJitTrigger(attacker, defender, attackerSlot, onCompleteCallback)
      });
    }
    if (canUseAllJit) {
      options.push({
        label: '🛡️ สั่งใช้ "ออลจิต" จากบนมือ (อัญเชิญลงสนามและเปลี่ยนเป้าหมายโจมตีมาที่ออลจิต)',
        color: '#0284c7',
        onSelect: () => resolveAllJitFromHand(attacker, defender, attackerSlot, onCompleteCallback)
      });
    }
    options.push({
      label: 'ไม่ใช้ความสามารถพิเศษ (ดำเนินการต่อตามปกติ)',
      color: '#475569',
      onSelect: () => proceedToStandardIntercept(attacker, defender, attackerSlot, onCompleteCallback)
    });

    showChoiceModal(
      '⚠️ ลีดเดอร์ของคุณกำลังถูกโจมตี!',
      `"${attackingMonster.name}" (Power ${getEffectivePower(attackingMonster, attacker)}) กำลังโจมตีลีดเดอร์ของคุณ! ต้องการสั่งใช้ความสามารถพิเศษหรือไม่?`,
      options
    );
    return;
  }

  proceedToStandardIntercept(attacker, defender, attackerSlot, onCompleteCallback);
}

// ⭐ แก้ไขแล้ว: สกิลของ ออลฟอจิต (M04) -> ทำลายการ์ดทุกใบบนสนามทั้งสองฝ่าย แล้วอัญเชิญออลฟอจิตมายืนบนสนาม!
function resolveAllForJitTrigger(attacker, defender, attackerSlot, onCompleteCallback) {
  const idx = defender.graveyard.findIndex(c => c.id === 'M04');
  if (idx === -1) {
    proceedToStandardIntercept(attacker, defender, attackerSlot, onCompleteCallback);
    return;
  }

  // 1. บันทึกว่าใช้สกิล 1 ครั้งต่อเกมไปแล้ว และนำการ์ดออลฟอจิตออกจากกองนรก
  defender.allForJitUsed = true;
  const allForJitCard = defender.graveyard.splice(idx, 1)[0];
  resetCardStateForZoneChange(allForJitCard);
  allForJitCard.state = 'Stand';

  // 2. ทำลายการ์ดทุกใบบนสนามของทั้งสองฝ่ายลงกองนรกให้หมด
  for (let i = 0; i < 3; i++) {
    if (defender.board[i]) sendBoardMonsterToGraveyard(defender, i);
    if (attacker.board[i]) sendBoardMonsterToGraveyard(attacker, i);
  }

  // 3. วาง "ออลฟอจิต" ลงบนช่องที่ 1 (board[0]) ของสนามฝั่งผู้ใช้!
  defender.board[0] = allForJitCard;

  setLog(`💀 [${defender.name}] สั่งใช้งาน "ออลฟอจิต" จากนรก! ทำลายการ์ดทุกใบบนสนามของทุกฝ่าย และอัญเชิญ "ออลฟอจิต" (Power 3) ลงสู่สนามสำเร็จ!`);
  renderGame();
  checkGameOver();
  if (onCompleteCallback) onCompleteCallback();
}

// สกิลของ ออลจิต (M03): อัญเชิญจากมือลงช่องว่าง และเปลี่ยนเป้าหมายการโจมตีมาสู้กับออลจิต
function resolveAllJitFromHand(attacker, defender, attackerSlot, onCompleteCallback) {
  const handIdx = defender.hand.findIndex(c => c.id === 'M03');
  const emptySlot = defender.board.findIndex(m => m === null);
  if (handIdx === -1 || emptySlot === -1) {
    proceedToStandardIntercept(attacker, defender, attackerSlot, onCompleteCallback);
    return;
  }

  const allJitCard = defender.hand.splice(handIdx, 1)[0];
  resetCardStateForZoneChange(allJitCard);
  allJitCard.state = 'Stand';
  defender.board[emptySlot] = allJitCard;

  const combatMsg = compareAndDestroyMonsters(attacker, attackerSlot, defender, emptySlot);
  setLog(`🛡️ [${defender.name}] อัญเชิญ "ออลจิต" จากบนมือลงสนามและเปลี่ยนเป้าหมายการโจมตีมาที่ตัวเอง! -> ${combatMsg}`);
  renderGame();
  checkGameOver();
  if (onCompleteCallback) onCompleteCallback();
}

// ขั้นตอนการป้องกันปกติ (Intercept ด้วยมอนสเตอร์ที่ Stand อยู่บนสนาม)
function proceedToStandardIntercept(attacker, defender, attackerSlot, onCompleteCallback) {
  const attackingMonster = attacker.board[attackerSlot];
  if (!attackingMonster) {
    if (onCompleteCallback) onCompleteCallback();
    return;
  }

  const standBlockerSlots = defender.board
    .map((m, idx) => (m && m.state === 'Stand' ? idx : null))
    .filter(idx => idx !== null);

  if (standBlockerSlots.length === 0) {
    defender.leader.hp = Math.max(0, defender.leader.hp - 1);
    setLog(`💥 "${attackingMonster.name}" โจมตีเข้าใส่ Leader ของ ${defender.name} โดยตรง! (เสีย 1 HP เหลือ ${defender.leader.hp}/6)`);
    renderGame();
    checkGameOver();
    if (onCompleteCallback) onCompleteCallback();
    return;
  }

  if (defender.name === 'AI') {
    const atkPower = getEffectivePower(attackingMonster, attacker);
    let chosenSlot = standBlockerSlots.find(idx => getEffectivePower(defender.board[idx], defender) >= atkPower);
    if (chosenSlot === undefined && defender.leader.hp <= 2) {
      chosenSlot = standBlockerSlots[0];
    }

    if (chosenSlot !== undefined) {
      const blocker = defender.board[chosenSlot];
      blocker.state = 'Rest';
      const msg = compareAndDestroyMonsters(attacker, attackerSlot, defender, chosenSlot);
      setLog(`🛡️ AI สั่ง "${blocker.name}" เข้ามา Intercept! -> ${msg}`);
    } else {
      defender.leader.hp = Math.max(0, defender.leader.hp - 1);
      setLog(`💥 AI เลือกไม่ป้องกัน! Leader ของ AI เสีย 1 HP (เหลือ ${defender.leader.hp}/6)`);
    }
    renderGame();
    checkGameOver();
    if (onCompleteCallback) onCompleteCallback();
  } else {
    openInterceptModal(attacker, attackerSlot, defender, standBlockerSlots, onCompleteCallback);
  }
}

// เปรียบเทียบค่าพลังระหว่างมอนสเตอร์ที่โจมตี กับ มอนสเตอร์ที่รับการโจมตี
function compareAndDestroyMonsters(contestantA, slotA, contestantB, slotB) {
  const monsterA = contestantA.board[slotA];
  const monsterB = contestantB.board[slotB];
  if (!monsterA || !monsterB) return '';

  const totalA = getEffectivePower(monsterA, contestantA);
  const totalB = getEffectivePower(monsterB, contestantB);

  if (totalA > totalB) {
    const hadBurn = !!monsterA.burnLeaderOnKill;
    sendBoardMonsterToGraveyard(contestantB, slotB);

    let burnMsg = '';
    if (hadBurn) {
      contestantB.leader.hp = Math.max(0, contestantB.leader.hp - 1);
      burnMsg = ` และสกิลออโต้ของ "${monsterA.name}" สร้างความเสียหายใส่ Leader อีกฝ่าย 1 หน่วย (เหลือ ${contestantB.leader.hp}/6)!`;
    }
    return `"${monsterA.name}" (${totalA}) ชนะและทำลาย "${monsterB.name}" (${totalB}) ลงนรก!${burnMsg}`;
  } else if (totalA < totalB) {
    sendBoardMonsterToGraveyard(contestantA, slotA);
    return `"${monsterB.name}" (${totalB}) พลังสูงกว่า! สวนกลับทำลาย "${monsterA.name}" (${totalA}) ลงนรก!`;
  } else {
    const hadBurn = !!monsterA.burnLeaderOnKill;
    sendBoardMonsterToGraveyard(contestantA, slotA);
    sendBoardMonsterToGraveyard(contestantB, slotB);

    let burnMsg = '';
    if (hadBurn) {
      contestantB.leader.hp = Math.max(0, contestantB.leader.hp - 1);
      burnMsg = ` (สกิลออโต้ของ "${monsterA.name}" ทำดาเมจใส่ Leader อีกฝ่าย 1 หน่วย!)`;
    }
    return `พลังเท่ากัน (${totalA})! ทั้งสองใบถูกทำลายลงนรก!${burnMsg}`;
  }
}

function openInterceptModal(attacker, attackerSlot, defender, standBlockerSlots, onCompleteCallback) {
  gameState.pendingAttack = { attacker, attackerSlot, defender, onCompleteCallback };
  const attackerMonster = attacker.board[attackerSlot];
  const atkPwr = getEffectivePower(attackerMonster, attacker);

  document.getElementById('intercept-desc').textContent =
    `⚠️ "${attackerMonster.name}" (Power ${atkPwr}) กำลังโจมตี Leader ของคุณ! คลิกเลือก Monster ที่ Stand อยู่เพื่อรับการโจมตีแทน:`;

  const listEl = document.getElementById('intercept-card-list');
  listEl.innerHTML = '';

  standBlockerSlots.forEach(slotIdx => {
    const blocker = defender.board[slotIdx];
    const cardEl = createCardElement(blocker, defender);
    cardEl.addEventListener('click', () => resolvePlayerIntercept(slotIdx));
    listEl.appendChild(cardEl);
  });

  document.getElementById('intercept-modal').style.display = 'flex';
}

function resolvePlayerIntercept(chosenSlotIndex) {
  document.getElementById('intercept-modal').style.display = 'none';
  const pending = gameState.pendingAttack;
  if (!pending) return;
  gameState.pendingAttack = null;

  const { attacker, attackerSlot, defender, onCompleteCallback } = pending;

  if (chosenSlotIndex !== null) {
    const blocker = defender.board[chosenSlotIndex];
    blocker.state = 'Rest';
    const msg = compareAndDestroyMonsters(attacker, attackerSlot, defender, chosenSlotIndex);
    setLog(`🛡️ คุณส่ง "${blocker.name}" เข้า Intercept! -> ${msg}`);
  } else {
    defender.leader.hp = Math.max(0, defender.leader.hp - 1);
    setLog(`💥 คุณเลือกไม่ป้องกัน! Leader ของคุณเสีย 1 HP (เหลือ ${defender.leader.hp}/6)`);
  }

  renderGame();
  checkGameOver();
  if (onCompleteCallback) onCompleteCallback();
}

document.getElementById('btn-skip-intercept').addEventListener('click', () => {
  resolvePlayerIntercept(null);
});


/* ============================================================================
   หมวดที่ 8: ระบบปัญญาประดิษฐ์ (AI LOGIC & PHASE BUTTONS)
   ----------------------------------------------------------------------------
   - ควบคุมการตัดสินใจของ AI ในการลงการ์ด ใช้สกิล ใช้เวทมนตร์ และสั่งโจมตี
   ============================================================================ */
document.getElementById('btn-next-phase').addEventListener('click', () => {
  if (gameState.activeTurn !== 'player' || gameState.phase !== 'Main Phase' || gameState.isRollingDice) return;
  if (gameState.pendingAction) {
    setLog('⚠️ กรุณาเลือกเป้าหมายของความสามารถที่ค้างอยู่ให้เสร็จก่อนเข้าสู่ Battle Phase!');
    return;
  }
  gameState.phase = 'Battle Phase';
  gameState.selectedHandIndex = null;
  document.getElementById('btn-next-phase').disabled = true;

  if (gameState.player.isFirstPlayer && gameState.player.turnsTaken === 1) {
    setLog('⚔️ เข้าสู่ Battle Phase (Turn 1 ของคนเริ่มก่อนไม่สามารถโจมตีได้ — กดจบเทิร์นได้เลย)');
  } else {
    setLog('⚔️ เข้าสู่ Battle Phase: คลิกยูนิทที่ Stand ของคุณ แล้วคลิกเป้าหมายฝั่ง AI เพื่อโจมตี!');
  }
  renderGame();
});

document.getElementById('btn-end-turn').addEventListener('click', () => {
  if (gameState.activeTurn !== 'player' || gameState.gameOver || gameState.isRollingDice) return;
  if (gameState.pendingAction) {
    setLog('⚠️ กรุณาเลือกเป้าหมายของความสามารถที่ค้างอยู่ให้เสร็จก่อนจบเทิร์น!');
    return;
  }

  executeEndPhaseCleanup(gameState.player);

  gameState.phase = 'End Phase';
  gameState.selectedHandIndex = null;
  gameState.selectedAttackerSlot = null;
  disableControls();
  renderGame();

  setTimeout(startAITurn, 650);
});

function startAITurn() {
  if (gameState.gameOver) return;
  gameState.activeTurn = 'ai';
  gameState.turnCount += 1;
  gameState.phase = 'Start Phase';

  executeStartPhase(gameState.ai);
  setLog('🤖 เทิร์นของ AI: จั่วการ์ด 1 ใบ และเปลี่ยนยูนิททั้งหมดเป็น Stand');
  renderGame();

  setTimeout(() => {
    if (gameState.gameOver) return;
    gameState.phase = 'Main Phase';
    aiPlayMainPhase(() => {
      setTimeout(() => {
        if (gameState.gameOver) return;
        gameState.phase = 'Battle Phase';
        renderGame();
        aiPlayBattlePhase(0);
      }, 800);
    });
  }, 800);
}

function aiPlayMainPhase(onMainComplete) {
  const ai = gameState.ai;
  const player = gameState.player;

  // 1. AI อัญเชิญมอนสเตอร์ลงช่องว่าง
  for (let slot = 0; slot < 3; slot++) {
    if (ai.board[slot] === null) {
      let summonIdx = ai.hand.findIndex(c => c.type === 'Monster' && !c.cannotNormalSummon && c.id !== 'M04' && c.id !== 'M03');
      if (summonIdx === -1) {
        summonIdx = ai.hand.findIndex(c => c.type === 'Monster' && !c.cannotNormalSummon && c.id !== 'M04');
      }

      if (summonIdx !== -1) {
        const summoned = ai.hand.splice(summonIdx, 1)[0];
        resetCardStateForZoneChange(summoned);
        summoned.state = 'Stand';
        ai.board[slot] = summoned;
        setLog(`🤖 AI อัญเชิญ "${summoned.name}" ลงสนาม!`);

        // ถ้า AI ลง บาคุจิต (M01) ให้ทำลายมอนสเตอร์ที่พลังสูงสุดของผู้เล่น
        if (summoned.id === 'M01') {
          let bestTarget = -1;
          let maxPwr = -1;
          player.board.forEach((m, idx) => {
            if (m && getEffectivePower(m, player) > maxPwr) {
              maxPwr = getEffectivePower(m, player);
              bestTarget = idx;
            }
          });
          if (bestTarget !== -1) {
            const destroyed = sendBoardMonsterToGraveyard(player, bestTarget);
            setLog(`💥 [AI บาคุจิต] ทำลาย "${destroyed.name}" บนสนามของคุณลงนรก!`);
          }
        }
      }
    }
  }

  // 2. AI กดใช้ความสามารถของ Monster บนสนาม
  ai.board.forEach((m, slotIdx) => {
    if (!m) return;
    if (m.id === 'M02' && !m.usedSkills.todoroRecover) {
      const bakuIdx = ai.graveyard.findIndex(c => c.id === 'M01');
      if (bakuIdx !== -1) {
        const baku = ai.graveyard.splice(bakuIdx, 1)[0];
        resetCardStateForZoneChange(baku);
        ai.hand.push(baku);
        m.usedSkills.todoroRecover = true;
        setLog('🤖 [AI โทโดโรจิต] นำ "บาคุจิต" จากกองนรกขึ้นมือ!');
      }
    }
    if (m.id === 'M06' && !m.usedSkills.hawksSearch && getEffectivePower(m, ai) >= 2) {
      if (ai.graveyard.some(c => c.id === 'M05')) {
        executeHawksSearch(ai, slotIdx, 'grave');
      } else if (ai.deck.some(c => c.id === 'M05')) {
        executeHawksSearch(ai, slotIdx, 'deck');
      }
    }
    if (m.id === 'M05' && !m.usedSkills.endeBoost && canContestantAttack(ai, m).allowed) {
      triggerEndeSkill(ai, slotIdx);
    }
  });

  // 3. AI กดใช้สกิล Leader มายฮีโร่ เดจิต (L01)
  if (ai.leader.id === 'L01' && !ai.leader.abilityUsedThisTurn) {
    const targetAlly = ai.board.find(m => m !== null && m.state === 'Stand');
    if (targetAlly) {
      targetAlly.tempPowerMod += 1;
      ai.leader.abilityUsedThisTurn = true;
      setLog(`👑 [AI มายฮีโร่ เดจิต] เพิ่มพลังให้ "${targetAlly.name}" +1 จนจบเทิร์น!`);
    }
  }

  // 4. AI ใช้การ์ดเวทมนตร์หากมีจังหวะเหมาะสม
  if (ai.spellQuota.normalUsed < 1) {
    const s02Idx = ai.hand.findIndex(c => c.id === 'S02');
    const playerHasMonster = player.board.some(m => m !== null);
    if (s02Idx !== -1 && playerHasMonster) {
      const spell = ai.hand.splice(s02Idx, 1)[0];
      ai.spellQuota.normalUsed += 1;
      player.board.forEach(m => { if (m) m.tempPowerMod -= 3; });
      ai.graveyard.push(spell);
      setLog('📉 AI ใช้เวทย์ "เชี่ย หุ้นตก" ลดพลังยูนิทของคุณทุกใบลง 3 จนจบเทิร์น!');
    } else {
      const s01Idx = ai.hand.findIndex(c => c.id === 'S01');
      if (s01Idx !== -1 && playerHasMonster && ai.hand.length >= 2) {
        const spell = ai.hand.splice(s01Idx, 1)[0];
        const discarded = ai.hand.pop();
        resetCardStateForZoneChange(discarded);
        ai.graveyard.push(discarded);
        ai.graveyard.push(spell);
        ai.spellQuota.normalUsed += 1;

        const targetIdx = player.board.findIndex(m => m !== null);
        if (targetIdx !== -1) {
          const dead = sendBoardMonsterToGraveyard(player, targetIdx);
          setLog(`🦶 AI ใช้ "โอ็ยใครเหยียบตีน!!!" ทิ้ง "${discarded.name}" และทำลาย "${dead.name}" ของคุณ!`);
        }
      }
    }
  }

  renderGame();
  onMainComplete();
}

function aiPlayBattlePhase(slotIndex) {
  if (gameState.gameOver) return;
  const ai = gameState.ai;
  const player = gameState.player;

  if (slotIndex >= 3) {
    setTimeout(endAITurn, 700);
    return;
  }

  const monster = ai.board[slotIndex];
  const check = canContestantAttack(ai, monster);
  if (!check.allowed) {
    aiPlayBattlePhase(slotIndex + 1);
    return;
  }

  const aiPower = getEffectivePower(monster, ai);

  let bestTargetSlot = -1;
  let bestTargetPower = -1;
  player.board.forEach((m, idx) => {
    if (m) {
      const pPower = getEffectivePower(m, player);
      if (aiPower > pPower && pPower > bestTargetPower) {
        bestTargetPower = pPower;
        bestTargetSlot = idx;
      }
    }
  });

  if (bestTargetSlot !== -1) {
    executeAttack(ai, player, slotIndex, 'monster', bestTargetSlot, () => {
      setTimeout(() => aiPlayBattlePhase(slotIndex + 1), 850);
    });
  } else {
    executeAttack(ai, player, slotIndex, 'leader', null, () => {
      setTimeout(() => aiPlayBattlePhase(slotIndex + 1), 850);
    });
  }
}

function endAITurn() {
  if (gameState.gameOver) return;
  executeEndPhaseCleanup(gameState.ai);
  gameState.phase = 'End Phase';
  renderGame();

  setTimeout(() => {
    gameState.activeTurn = 'player';
    gameState.turnCount += 1;
    startPlayerTurn();
  }, 600);
}


/* ============================================================================
   หมวดที่ 9: ระบบวาดหน้าจอกระดานเกม (RENDER UI)
   ----------------------------------------------------------------------------
   - อ่านค่าจากตัวแปร gameState แล้วนำไปวาดเป็น HTML บนหน้าเว็บทุกครั้งที่มีการเคลื่อนไหว
   ============================================================================ */
function createCardElement(card, ownerContestant = null) {
  const effectivePower = getEffectivePower(card, ownerContestant);
  const div = document.createElement('div');
  div.className = `card ${card.type} ${card.state || ''}`;

  let statusTag = '';
  if (card.type === 'Monster') {
    if (card.burnLeaderOnKill) statusTag += '🔥';
    if (card.destroyAtEndOfTurn) statusTag += '⏳';
  }

  div.innerHTML = `
    <div>
      <div class="card-header">
        <span class="card-type">${card.type} ${statusTag}</span>
      </div>
      <div class="card-art">
        <img src="${card.image}" alt="${card.name}">
      </div>
      <div class="card-name">${card.name}</div>
    </div>
    ${card.type === 'Monster'
      ? `<div class="card-power">⚔️ ${effectivePower}</div>`
      : `<div class="card-desc">${card.desc}</div>`
    }
  `;
  return div;
}

function renderBoardSlots(containerId, contestant, isPlayerBoard) {
  const container = document.getElementById(containerId);
  const slots = container.querySelectorAll('.slot');
  const pendingType = gameState.pendingAction ? gameState.pendingAction.type : null;

  slots.forEach((slotEl, idx) => {
    slotEl.innerHTML = '';
    slotEl.classList.remove('valid-target', 'attack-target');

    const monster = contestant.board[idx];
    if (monster) {
      const cardEl = createCardElement(monster, contestant);
      if (isPlayerBoard && gameState.selectedAttackerSlot === idx) {
        cardEl.classList.add('selected-attacker');
      }
      slotEl.appendChild(cardEl);

      if (isPlayerBoard && pendingType) {
        if (
          pendingType === 'LEADER_L01_TARGET' ||
          pendingType === 'SPELL_S04_CHOOSE_BENEFICIARY' ||
          ((pendingType === 'SPELL_S03_REST_TARGET' || pendingType === 'SPELL_S04_REST_FIRST' || pendingType === 'SPELL_S04_REST_SECOND') && monster.state === 'Stand')
        ) {
          slotEl.classList.add('valid-target');
        }
      }

      if (!isPlayerBoard) {
        if (
          gameState.selectedAttackerSlot !== null ||
          pendingType === 'BAKU_DESTROY_TARGET' ||
          pendingType === 'SPELL_S01_DESTROY_TARGET'
        ) {
          slotEl.classList.add('attack-target');
        }
      }
    } else {
      slotEl.textContent = `ช่อง ${idx + 1}`;
      if (isPlayerBoard && gameState.phase === 'Main Phase' && gameState.selectedHandIndex !== null && !pendingType) {
        slotEl.classList.add('valid-target');
      }
    }

    slotEl.onclick = () => isPlayerBoard ? handlePlayerSlotClick(idx) : handleAISlotClick(idx);
  });
}

function renderGame() {
  const { player, ai } = gameState;
  if (!player || !ai) return;

  document.getElementById('ai-leader-name').textContent = ai.leader.name;
  document.getElementById('ai-leader-hp').textContent = ai.leader.hp;
  document.getElementById('ai-leader-img').src = ai.leader.image;
  document.getElementById('ai-deck-count').textContent = ai.deck.length;
  document.getElementById('ai-grave-count').textContent = ai.graveyard.length;
  document.getElementById('ai-hand-count').textContent = ai.hand.length;

  const aiLeaderBox = document.getElementById('ai-leader-box');
  if (gameState.selectedAttackerSlot !== null && !gameState.pendingAction) {
    aiLeaderBox.classList.add('attack-target');
  } else {
    aiLeaderBox.classList.remove('attack-target');
  }

  document.getElementById('player-leader-name').textContent =
    `${player.leader.name} ${player.leader.abilityUsedThisTurn ? '(ใช้สกิลแล้ว)' : '(คลิกใช้สกิล)'}`;
  document.getElementById('player-leader-hp').textContent = player.leader.hp;
  document.getElementById('player-leader-img').src = player.leader.image;
  document.getElementById('player-deck-count').textContent = player.deck.length;
  document.getElementById('player-grave-count').textContent = player.graveyard.length;

  const playerLeaderBox = document.getElementById('player-leader-box');
  playerLeaderBox.style.cursor = (gameState.activeTurn === 'player' && gameState.phase === 'Main Phase' && !player.leader.abilityUsedThisTurn) ? 'pointer' : 'default';
  playerLeaderBox.onclick = () => handlePlayerSlotClick('leader');

  document.getElementById('turn-indicator').textContent =
    `Turn ${gameState.turnCount} (${gameState.activeTurn === 'player' ? 'ตาของคุณ' : 'ตาของ AI'})`;
  document.getElementById('phase-indicator').textContent = gameState.phase;
  document.getElementById('normal-spell-quota').textContent = `Normal Spell: ${player.spellQuota.normalUsed} / 1`;
  document.getElementById('reaction-spell-quota').textContent = `Reaction Spell: ${player.spellQuota.reactionUsed} / 1`;

  renderBoardSlots('ai-board', ai, false);
  renderBoardSlots('player-board', player, true);

  const handContainer = document.getElementById('player-hand');
  handContainer.innerHTML = '';
  const pendingType = gameState.pendingAction ? gameState.pendingAction.type : null;

  player.hand.forEach((card, idx) => {
    const cardEl = createCardElement(card, player);
    if (gameState.selectedHandIndex === idx) {
      cardEl.classList.add('selected-hand');
    }
    if (pendingType === 'TODORO_SKILL1_DISCARD' || (pendingType === 'SPELL_S01_DISCARD' && idx !== gameState.pendingAction.spellHandIndex)) {
      cardEl.classList.add('selected-mulligan');
    }
    cardEl.addEventListener('click', () => handleHandCardClick(idx));
    handContainer.appendChild(cardEl);
  });
}

function renderMulliganModal() {
  const listEl = document.getElementById('mulligan-card-list');
  listEl.innerHTML = '';
  gameState.player.hand.forEach((card, index) => {
    const cardEl = createCardElement(card, gameState.player);
    if (gameState.mulliganSelected.includes(index)) {
      cardEl.classList.add('selected-mulligan');
    }
    cardEl.addEventListener('click', () => {
      const pos = gameState.mulliganSelected.indexOf(index);
      if (pos !== -1) gameState.mulliganSelected.splice(pos, 1);
      else if (gameState.mulliganSelected.length < 2) gameState.mulliganSelected.push(index);
      renderMulliganModal();
    });
    listEl.appendChild(cardEl);
  });

  const mulliganTextEl = document.getElementById('mulligan-selected-text');
  if (mulliganTextEl) {
    mulliganTextEl.textContent = `เลือกแล้ว: ${gameState.mulliganSelected.length} / 2 ใบ`;
  }
}

document.getElementById('btn-confirm-mulligan').addEventListener('click', () => {
  performMulligan(gameState.player, gameState.mulliganSelected);
  document.getElementById('mulligan-modal').style.display = 'none';
  startPlayerTurn();
});

function startPlayerTurn() {
  if (gameState.gameOver) return;
  executeStartPhase(gameState.player);
  gameState.phase = 'Main Phase';
  gameState.pendingAction = null;
  document.getElementById('btn-next-phase').disabled = false;
  document.getElementById('btn-end-turn').disabled = false;

  setLog(`🟢 เทิร์นของคุณ (ครั้งที่ ${gameState.player.turnsTaken}): คลิกการ์ดในมือเพื่อลงสนาม หรือคลิกยูนิท/ลีดเดอร์บนสนามเพื่อสั่งใช้สกิล!`);
  renderGame();
}


/* ============================================================================
   หมวดที่ 10: ระบบหน้าต่างจัดเด็ค และฟังก์ชันเริ่มเกม (DECK BUILDER & INIT)
   ============================================================================ */
let currentDeckConfig = loadSavedDeck();

function loadSavedDeck() {
  try {
    const saved = localStorage.getItem('my_card_game_deck');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.leaderId && Array.isArray(parsed.mainDeck) && parsed.mainDeck.length === 20) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('โหลดเด็คไม่สำเร็จ ใช้เด็คมาตรฐานแทน');
  }
  return { leaderId: 'L01', mainDeck: [...DEFAULT_DECK_LIST] };
}

function openDeckBuilder() {
  document.getElementById('mulligan-modal').style.display = 'none';
  document.getElementById('deck-builder-modal').style.display = 'flex';
  renderDeckBuilder();
}

function renderDeckBuilder() {
  const leaderContainer = document.getElementById('leader-pool-list');
  const mainContainer = document.getElementById('main-pool-list');
  leaderContainer.innerHTML = '';
  mainContainer.innerHTML = '';

  CARD_DATABASE.filter(c => c.type === 'Leader').forEach(leader => {
    const item = document.createElement('div');
    item.className = 'pool-item';
    const cardEl = document.createElement('div');
    cardEl.className = `card Leader ${currentDeckConfig.leaderId === leader.id ? 'selected-leader' : ''}`;
    cardEl.innerHTML = `
      <div>
        <div class="card-header"><span class="card-type">LEADER</span></div>
        <div class="card-art"><img src="${leader.image}" alt="${leader.name}"></div>
        <div class="card-name">${leader.name}</div>
      </div>
      <div class="card-power" style="background:#be185d;">👑 HP: ${leader.maxHp}</div>
    `;
    cardEl.addEventListener('click', () => {
      currentDeckConfig.leaderId = leader.id;
      renderDeckBuilder();
    });
    item.appendChild(cardEl);
    leaderContainer.appendChild(item);
  });

  CARD_DATABASE.filter(c => c.type !== 'Leader').forEach(card => {
    const countInDeck = currentDeckConfig.mainDeck.filter(id => id === card.id).length;
    const item = document.createElement('div');
    item.className = 'pool-item';
    const cardEl = createCardElement(card, null);
    if (countInDeck > 0) cardEl.style.outline = '2px solid #22c55e';

    cardEl.addEventListener('click', () => {
      if (countInDeck < 2) {
        if (currentDeckConfig.mainDeck.length >= 20) {
          alert('การ์ดใน Main Deck ครบ 20 ใบแล้ว! กรุณาคลิกเอาใบที่มี 2/2 ออกก่อน');
          return;
        }
        currentDeckConfig.mainDeck.push(card.id);
      } else {
        currentDeckConfig.mainDeck = currentDeckConfig.mainDeck.filter(id => id !== card.id);
      }
      renderDeckBuilder();
    });

    const badge = document.createElement('div');
    badge.className = `count-badge ${countInDeck === 2 ? 'maxed' : ''}`;
    badge.textContent = `ใส่ในเด็ค: ${countInDeck} / 2 ใบ`;
    item.appendChild(cardEl);
    item.appendChild(badge);
    mainContainer.appendChild(item);
  });

  const count = currentDeckConfig.mainDeck.length;
  const statusEl = document.getElementById('deck-status-text');
  const saveBtn = document.getElementById('btn-save-start');
  statusEl.textContent = `Leader: 1/1 | Main Deck: ${count}/20 ใบ`;
  statusEl.style.color = (count === 20) ? '#4ade80' : '#f87171';
  saveBtn.disabled = (count !== 20);
}

document.getElementById('btn-open-deck').addEventListener('click', openDeckBuilder);
document.getElementById('btn-reset-deck').addEventListener('click', () => {
  currentDeckConfig.mainDeck = [];
  renderDeckBuilder();
});
document.getElementById('btn-default-deck').addEventListener('click', () => {
  currentDeckConfig.leaderId = 'L01';
  currentDeckConfig.mainDeck = [...DEFAULT_DECK_LIST];
  renderDeckBuilder();
});
document.getElementById('btn-save-start').addEventListener('click', () => {
  if (currentDeckConfig.mainDeck.length !== 20) return;
  localStorage.setItem('my_card_game_deck', JSON.stringify(currentDeckConfig));
  document.getElementById('deck-builder-modal').style.display = 'none';
  initGame();
});

function initGame() {
  gameState.turnCount = 1;
  gameState.activeTurn = 'player';
  gameState.phase = 'Mulligan';
  gameState.mulliganSelected = [];
  gameState.selectedHandIndex = null;
  gameState.selectedAttackerSlot = null;
  gameState.pendingAttack = null;
  gameState.pendingAction = null;
  gameState.isRollingDice = false;
  gameState.gameOver = false;

  gameState.player = createContestant('Player', true, 'P1', currentDeckConfig.leaderId, currentDeckConfig.mainDeck);
  gameState.ai = createContestant('AI', false, 'AI', 'L01', DEFAULT_DECK_LIST);

  drawCards(gameState.player, 5);
  drawCards(gameState.ai, 5);

  document.getElementById('mulligan-modal').style.display = 'flex';
  renderGame();
  renderMulliganModal();
}

initGame();