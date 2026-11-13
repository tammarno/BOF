/* ============================================================================
   หมวดที่ 1: ฐานข้อมูลการ์ดทั้งหมด (DATA-DRIVEN CARD DATABASE)
   แยกข้อมูลการ์ดและบล็อกความสามารถ (effects) ออกจากตัวประมวลผลอย่างชัดเจน
   ============================================================================ */
/* การ์ดและรายชื่อเด็คย้ายไป js/cards/*.js (โหลดก่อนไฟล์นี้) */
const DEFAULT_DECK_LIST = DECK_LISTS.L01;
const DEFAULT_NUEA_DECK_LIST = DECK_LISTS.L02;
const DEFAULT_DOOMSDAY_DECK_LIST = DECK_LISTS.L03;
const DEFAULT_DINO_DECK_LIST = DECK_LISTS.L04;
const DEFAULT_DEMON_DECK_LIST = DECK_LISTS.L05;
const DEFAULT_OAT_DECK_LIST = DECK_LISTS.L06;

function isSpellCard(card) {
  return !!(card && (card.type === 'NormalSpell' || card.type === 'ReactionSpell' || card.type === 'LandSpell'));
}


/* ============================================================================
   หมวดที่ 2: ฟังก์ชันตรวจสอบเผ่า, คำสำคัญในชื่อการ์ด, คำอธิบายอัตโนมัติ และการคำนวณค่าพลังจากบล็อก
   ============================================================================ */
function isNueaCard(card) { return card && card.name && card.name.includes('เหนือ'); }
function isSoldierCard(card) { return card && card.name && card.name.includes('ทหาร'); }
function isPhraiCard(card) { return card && card.name && card.name.includes('ไพร่'); }
function hasCardName(card, nameKeyword) { return !!(card && card.name && card.name.includes(nameKeyword)); }
function hasCardTribe(card, tribeName) {
  if (!card || !tribeName) return false;
  if (Array.isArray(card.tribe)) return card.tribe.includes(tribeName);
  return card.tribe === tribeName;
}
function getCardMaxCopies(cardTemplate) { return cardTemplate && cardTemplate.maxCopies !== undefined ? cardTemplate.maxCopies : 2; }

// 📝 ระบบสร้างข้อความอธิบายความสามารถอัตโนมัติจากบล็อก effects (กรณีการ์ดใหม่ไม่ได้เขียน desc เอง)
function generateStepText(step) {
  switch (step.block) {
    case 'DRAW':
      if (step.bonusIfGraveAtLeast) {
        return `จั่วการ์ด ${step.count} ใบ (ถ้านรกมี ${step.bonusIfGraveAtLeast} ใบขึ้นไป จั่ว ${step.bonusCount} ใบ)`;
      }
      return `${step.side === 'OPPONENT' ? 'อีกฝ่าย' : ''}จั่วการ์ด ${step.count || 1} ใบ`;
    case 'DESTROY_UNIT':
      if (step.target === 'BOTH' && step.select === 'ALL') {
        return 'ทำลายยูนิตทั้งหมดบนสนามทั้ง 2 ฝั่ง';
      }
      return step.select === 'ALL'
        ? `ทำลายยูนิต${step.target === 'OPPONENT' ? 'อีกฝ่าย' : ''}ทุกใบ`
        : `เลือกทำลายยูนิต${step.target === 'OPPONENT' ? 'อีกฝ่าย' : ''} ${step.count || 1} ใบ`;
    case 'ADD_POWER': {
      const durText = step.duration === 'TURN' ? 'จนจบเทิร์น' : '';
      const filterLabel = step.filterTribe ? `เผ่า ${step.filterTribe}` : (step.filterName ? `ที่มีคำว่า "${step.filterName}"` : '');
      if (step.target === 'SELF_UNIT') return `พลังโจมตียูนิตนี้ +${step.amount} ${durText}`.trim();
      if (step.target === 'ALL_ALLIES') return `ยูนิต${filterLabel ? ` ${filterLabel}` : 'ฝั่งเรา'}ทุกใบพลัง +${step.amount} ${durText}`.trim();
      return `เลือกยูนิต${filterLabel ? ` ${filterLabel}` : 'ฝั่งเรา'} ${step.count || 1} ใบ พลัง +${step.amount} ${durText}`.trim();
    }
    case 'REDUCE_POWER': {
      const durText = step.duration === 'TURN' ? 'จนจบเทิร์น' : '';
      if (step.target === 'ALL_ENEMIES') return `ลดพลังยูนิตอีกฝ่ายทุกใบ -${step.amount} ${durText}`.trim();
      return `เลือกยูนิตอีกฝ่าย ${step.count || 1} ใบ พลัง -${step.amount} ${durText}`.trim();
    }
    case 'FLEX_POWER':
      return `เลือกยูนิต 1 ใบ (ฝั่งเราพลัง +${step.plusAmount} / ฝั่งตรงข้ามพลัง -${step.minusAmount})`;
    case 'HEAL_LEADER':
      return `ฟื้นฟู HP ลีดเดอร์เรา +${step.amount}`;
    case 'DAMAGE_LEADER':
      return `ทำดาเมจใส่ลีดเดอร์${step.side === 'OPPONENT' ? 'อีกฝ่าย' : ''} ${step.amount} หน่วย`;
    case 'MILL_DECK':
      return `ส่งการ์ดใบบนสุดของกอง${step.side === 'OPPONENT' ? 'อีกฝ่าย' : 'เรา'} ${step.count || 1} ใบลงนรก`;
    case 'RECOVER_FROM_GRAVE': {
      const label = step.filterTribe
        ? `เผ่า ${step.filterTribe}`
        : step.filterName
          ? `ที่มีคำว่า "${step.filterName}"`
          : step.filterType === 'SPELL'
            ? 'เวทมนตร์'
            : '';
      return `นำการ์ด${label ? ` ${label}` : ''} ${step.count || 1} ใบจากนรกขึ้นมือ`;
    }
    case 'SEARCH_DECK': {
      const label = step.filterTribe
        ? `เผ่า ${step.filterTribe}`
        : step.filterName
          ? `ที่มีคำว่า "${step.filterName}"`
          : '';
      return `ค้นหาการ์ด${label ? ` ${label}` : ''} ${step.upTo ? 'ไม่เกิน ' : ''}${step.count || 1} ใบจากกองการ์ดขึ้นมือ`;
    }
    case 'STAND_SELF':
      return 'สแตร์นยูนิทนี้';
    case 'BOUNCE_UNIT':
      return `เลือกยูนิตอีกฝ่าย ${step.count || 1} ใบ กลับขึ้นมือเจ้าของ`;
    default:
      return '';
  }
}

function getCardDescription(card) {
  if (!card) return '';
  if (card.desc && card.desc.trim() !== '') return card.desc;
  if (!Array.isArray(card.effects) || card.effects.length === 0) return 'ไม่มีความสามารถพิเศษ';

  return card.effects.map(eff => {
    const triggerMap = {
      ON_SUMMON: 'ออโต้ (เมื่อลงสนาม): ',
      ON_DESTROY: 'คำสั่งเสีย: ',
      ON_BATTLE_DESTROY: 'เมื่อถูกทำลายจากการต่อสู้: ',
      ON_KILL_UNIT: 'ออโต้ (เมื่อทำลายยูนิทสำเร็จ): ',
      ON_INTERCEPT: 'ออโต้ (เมื่อรับการโจมตีแทนลีดเดอร์): ',
      ON_HIT_LEADER: 'ออโต้ (เมื่อโจมตีลีดเดอร์สำเร็จ): ',
      ACTIVATE_MAIN: 'สั่งใช้งาน: ',
      ACTIVATE_LEADER: 'สั่งใช้งาน/เทิร์น: ',
      CAST_SPELL: ''
    };
    const prefix = triggerMap[eff.trigger] || '';
    const stepsText = (eff.steps || []).map(generateStepText).filter(Boolean).join(' แล้ว');
    return `${prefix}${stepsText}`;
  }).filter(Boolean).join('\n');
}

// เติม desc อัตโนมัติให้การ์ดในฐานข้อมูลที่ไม่ได้ระบุ desc
CARD_DATABASE.forEach(c => {
  if (!c.desc) c.desc = getCardDescription(c);
});

function shuffleDeck(deckArray, contestant = null) {
  const arr = [...deckArray];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }

  // เล่นแอนิเมชันสับกองอัตโนมัติเฉพาะระหว่างการเล่นเกมจริง (เมื่อมีการค้นหากอง หรือการ์ดสั่งให้สับกอง)
  if (typeof gameState !== 'undefined' && gameState && !gameState.gameOver && gameState.phase !== 'Setup') {
    let side = null;
    if (contestant) {
      side = (contestant === gameState.player) ? 'player' : 'ai';
    } else if (gameState.player && deckArray === gameState.player.deck) {
      side = 'player';
    } else if (gameState.ai && deckArray === gameState.ai.deck) {
      side = 'ai';
    }
    if (side && typeof playDeckShuffleAnimation === 'function') {
      playDeckShuffleAnimation(null, side);
    }
  }

  return arr;
}

function createCardInstance(template, uid) {
  return {
    ...template,
    desc: getCardDescription(template),
    uid,
    state: 'Stand',
    basePower: template.power !== undefined ? template.power : 0,
    permPowerMod: 0,
    tempPowerMod: 0,
    untilEnemyEndPowerMod: 0,
    destroyAtEndOfTurn: false,
    burnLeaderOnKill: false,
    indestructibleUntilNextTurn: false,
    immuneToEnemyEffectsUntilEndOfTurn: false,
    oatShieldAvailable: false,
    oatShieldUsedThisTurn: false,
    beelzebubBuffThisTurn: false,
    tauntedByLeviathanUid: null,
    returnFromDarkDimensionId: null,
    usedSkills: {}
  };
}

function resetCardStateForZoneChange(card) {
  if (!card) return card;
  card.state = 'Stand';
  card.permPowerMod = 0;
  card.tempPowerMod = 0;
  card.untilEnemyEndPowerMod = 0;
  card.destroyAtEndOfTurn = false;
  card.burnLeaderOnKill = false;
  card.indestructibleUntilNextTurn = false;
  card.immuneToEnemyEffectsUntilEndOfTurn = false;
  card.oatShieldAvailable = false;
  card.oatShieldUsedThisTurn = false;
  card.beelzebubBuffThisTurn = false;
  card.tauntedByLeviathanUid = null;
  card.returnFromDarkDimensionId = null;
  card.usedSkills = {};
  return card;
}

function isPartnerActive(contestant) {
  if (!contestant || !Array.isArray(contestant.board)) return false;
  const hasOnami = contestant.board.some(m => m !== null && m.id === 'DM01');
  const hasRoselia = contestant.board.some(m => m !== null && m.id === 'DM02');
  return hasOnami && hasRoselia;
}

// ⚡ คำนวณค่าพลังผ่านบล็อก CONTINUOUS_POWER และ CONTINUOUS_BOARD_AURA
function getEffectivePower(card, ownerContestant) {
  if (!card || card.type !== 'Monster') return 0;

  let total = (card.basePower !== undefined ? card.basePower : card.power)
    + (card.permPowerMod || 0)
    + (card.tempPowerMod || 0)
    + (card.untilEnemyEndPowerMod || 0);

  if (ownerContestant && Array.isArray(ownerContestant.board)) {
    // 0. แลนด์สเปล "สัญญาปีศาจ" (DMS01) ในมิติมืด: ยูนิทเผ่า "ปีศาจ" ทุกใบบนสนามพลังโจมตี +1 ทั้งเกม
    if (hasCardTribe(card, 'ปีศาจ') && Array.isArray(ownerContestant.darkDimension)) {
      if (ownerContestant.darkDimension.some(d => d && d.id === 'DMS01')) {
        total += 1;
      }
    }

    // 1. บล็อก CONTINUOUS_POWER ของตัวการ์ดเอง
    if (Array.isArray(card.effects)) {
      card.effects.filter(e => e.trigger === 'CONTINUOUS_POWER').forEach(eff => {
        const cond = eff.condition;
        if (!cond) {
          total += (eff.amount || 0);
        } else if (cond.type === 'ALLY_ON_BOARD') {
          if (ownerContestant.board.some(m => m !== null && m.id === cond.cardId)) {
            total += (eff.amount || 0);
          }
        } else if (cond.type === 'PER_OTHER_ALLY_TRIBE') {
          const count = ownerContestant.board.filter(m =>
            m !== null && m.uid !== card.uid && hasCardTribe(m, cond.tribe)
          ).length;
          total += count * (eff.amountPerUnit || 1);
        } else if (cond.type === 'PER_OTHER_ALLY_NAME') {
          const count = ownerContestant.board.filter(m =>
            m !== null && m.uid !== card.uid && hasCardName(m, cond.nameKeyword)
          ).length;
          total += count * (eff.amountPerUnit || 1);
        } else if (cond.type === 'PER_GRAVE_COUNT') {
          const divisor = Math.max(1, cond.divisor || 3);
          const graveLen = Array.isArray(ownerContestant.graveyard) ? ownerContestant.graveyard.length : 0;
          const stacks = Math.floor(graveLen / divisor);
          total += stacks * (eff.amountPerUnit || 1);
        }
      });
    }

    // 2. บล็อก CONTINUOUS_BOARD_AURA จาก Leader (เช่น ขุนเหนือ L02)
    if (ownerContestant.leader && Array.isArray(ownerContestant.leader.effects)) {
      ownerContestant.leader.effects.filter(e => e.trigger === 'CONTINUOUS_BOARD_AURA').forEach(aura => {
        const matchesTargetTribe = !aura.targetTribe || hasCardTribe(card, aura.targetTribe);
        const matchesTargetName = !aura.targetNameKeyword || hasCardName(card, aura.targetNameKeyword);
        if (matchesTargetTribe && matchesTargetName) {
          if (aura.condition && aura.condition.type === 'MIN_TRIBE_COUNT') {
            const cnt = ownerContestant.board.filter(m => m !== null && hasCardTribe(m, aura.condition.tribe)).length;
            if (cnt >= aura.condition.count) total += (aura.amount || 0);
          } else if (aura.condition && aura.condition.type === 'MIN_NAME_COUNT') {
            const cnt = ownerContestant.board.filter(m => m !== null && hasCardName(m, aura.condition.nameKeyword)).length;
            if (cnt >= aura.condition.count) total += (aura.amount || 0);
          }
        }
      });
    }
  }

  return Math.max(0, total);
}

function getDefaultDeckForLeader(leaderId) {
  const list = DECK_LISTS[leaderId];
  return Array.isArray(list) ? list : DECK_LISTS.L01;
}

function createValidDeck(leaderId, mainDeckCardIds, ownerPrefix) {
  const leaderTemplate = CARD_DATABASE.find(c => c.id === leaderId && c.type === 'Leader')
    || CARD_DATABASE.find(c => c.type === 'Leader');

  const defaultListForLeader = getDefaultDeckForLeader(leaderTemplate.id);
  const sourceList = (Array.isArray(mainDeckCardIds) && mainDeckCardIds.length === 20)
    ? mainDeckCardIds
    : defaultListForLeader;

  const idCounter = {};
  const mainDeck = [];

  sourceList.forEach((cardId, index) => {
    const cardTemplate = CARD_DATABASE.find(c => c.id === cardId && c.type !== 'Leader');
    if (!cardTemplate) return;
    const maxAllowed = getCardMaxCopies(cardTemplate);
    idCounter[cardTemplate.id] = (idCounter[cardTemplate.id] || 0) + 1;
    if (idCounter[cardTemplate.id] <= maxAllowed && mainDeck.length < 20) {
      mainDeck.push(createCardInstance(cardTemplate, `${ownerPrefix}_${cardTemplate.id}_${index + 1}`));
    }
  });

  if (mainDeck.length < 20) {
    defaultListForLeader.forEach((cardId, idx) => {
      if (mainDeck.length >= 20) return;
      const cardTemplate = CARD_DATABASE.find(c => c.id === cardId && c.type !== 'Leader');
      if (!cardTemplate) return;
      const maxAllowed = getCardMaxCopies(cardTemplate);
      idCounter[cardTemplate.id] = (idCounter[cardTemplate.id] || 0) + 1;
      if (idCounter[cardTemplate.id] <= maxAllowed) {
        mainDeck.push(createCardInstance(cardTemplate, `${ownerPrefix}_fill_${idx + 1}`));
      }
    });
  }

  return {
    leader: {
      ...leaderTemplate,
      hp: leaderTemplate.maxHp,
      abilityUsedThisTurn: false
    },
    deck: shuffleDeck(mainDeck)
  };
}

function drawCards(contestant, count) {
  for (let i = 0; i < count; i++) {
    if (contestant.deck.length > 0) {
      const card = contestant.deck.pop();
      resetCardStateForZoneChange(card);
      contestant.hand.push(card);
    }
  }
}

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

// วางการ์ดทับช่องเดิม: ส่งใบเก่าลงนรกโดย "ไม่ถือว่าถูกทำลาย"

// หาเจ้าของการ์ดจริง: เทียบ prefix ของ uid (ก่อน '_') กับ ownerPrefix ของแต่ละฝ่าย
// (PvP ใช้ P1/P2 และสลับมุมมองกันบนแต่ละเครื่อง จึงห้ามผูก 'P1' = gameState.player ตายตัว)
function getCardOriginalOwner(card, fallbackContestant = null) {
  if (!card) return fallbackContestant;
  const { player, ai } = gameState;
  // originalOwner ที่ผ่าน JSON sync มาจะเป็นสำเนา ไม่ใช่ object จริง จึงใช้ได้เฉพาะตอนอ้างอิงตรงกัน
  if (card.originalOwner && (card.originalOwner === player || card.originalOwner === ai)) {
    return card.originalOwner;
  }
  if (typeof card.uid === 'string' && card.uid.includes('_')) {
    const prefix = card.uid.split('_')[0];
    if (player && player.ownerPrefix === prefix) return player;
    if (ai && ai.ownerPrefix === prefix) return ai;
  }
  return fallbackContestant;
}

function sendOverwrittenMonsterToGrave(contestant, slotIndex) {
  const oldMonster = contestant.board[slotIndex];
  if (!oldMonster) return null;
  if (oldMonster.oatShieldAvailable && !oldMonster.oatShieldUsedThisTurn) {
    oldMonster.oatShieldUsedThisTurn = true;
    setLog(`🛡️ [ออโต้/1 เทิร์น - ${oldMonster.name}] ป้องกันการถูกทำลายหรือนำลงนรกสำเร็จ!`);
    return oldMonster;
  }
  const targetGraveContestant = getCardOriginalOwner(oldMonster, contestant);
  contestant.board[slotIndex] = null;
  resetCardStateForZoneChange(oldMonster);
  targetGraveContestant.graveyard.push(oldMonster);
  return oldMonster;
}

// ทำลายยูนิตบนสนาม (รันบล็อก ON_DESTROY และ ON_BATTLE_DESTROY อัตโนมัติ)
function destroyBoardMonster(boardOwner, slotIndex, isFromBattle = false, isByEnemyEffect = false) {
  const monster = boardOwner.board[slotIndex];
  if (!monster) return { destroyed: false, reason: 'empty' };

  if (isByEnemyEffect && monster.immuneToEnemyEffectsUntilEndOfTurn) {
    setLog(`🛡️ "${monster.name}" ไม่ได้รับผลจากความสามารถของการ์ดฝ่ายตรงข้ามในเทิร์นนี้!`);
    return { destroyed: false, reason: 'immune', monster };
  }

  if (monster.indestructibleUntilNextTurn) {
    setLog(`🛡️ "${monster.name}" ไม่สามารถถูกทำลายได้จนเริ่มเทิร์นถัดไป!`);
    return { destroyed: false, reason: 'indestructible', monster };
  }

  if (monster.beelzebubBuffThisTurn && gameState.activeTurn === (boardOwner === gameState.player ? 'player' : 'ai')) {
    setLog(`🍔 [เบลเซบับ บาปตะกละ] ไม่ออกจากสนามจนจบเทิร์นฝ่ายเรา!`);
    return { destroyed: false, reason: 'beelzebub_buff', monster };
  }

  if (monster.oatShieldAvailable && !monster.oatShieldUsedThisTurn) {
    monster.oatShieldUsedThisTurn = true;
    setLog(`🛡️ [ออโต้/1 เทิร์น - ${monster.name}] การ์ดใบนี้ไม่ถูกทำลายหรือนำลงนรก!`);
    return { destroyed: false, reason: 'oat_shield', monster };
  }

  boardOwner.board[slotIndex] = null;
  boardOwner.unitsDestroyedThisTurn = (boardOwner.unitsDestroyedThisTurn || 0) + 1;
  const otherContestant = (boardOwner === gameState.player) ? gameState.ai : gameState.player;

  const targetGraveContestant = getCardOriginalOwner(monster, boardOwner);
  resetCardStateForZoneChange(monster);
  targetGraveContestant.graveyard.push(monster);

  // รันบล็อกความสามารถเมื่อถูกทำลาย (ON_DESTROY)
  EffectEngine.triggerCardEffects(monster, 'ON_DESTROY', {
    caster: boardOwner,
    opponent: otherContestant,
    sourceCard: monster,
    sourceSlot: slotIndex,
    isAI: boardOwner !== gameState.player
  });

  // รันบล็อกความสามารถเมื่อถูกทำลายจากการต่อสู้ (ON_BATTLE_DESTROY)
  if (isFromBattle) {
    EffectEngine.triggerCardEffects(monster, 'ON_BATTLE_DESTROY', {
      caster: boardOwner,
      opponent: otherContestant,
      sourceCard: monster,
      sourceSlot: slotIndex,
      isAI: boardOwner !== gameState.player
    });
  }

  // ตรวจสอบสกิลจากบนมือของ "แอชชี่ล่า" (DM07): ถ้ายูนิตฝ่ายเราถูกทำลายครบ 2 ใบขึ้นไปในเทิร์นนี้
  checkAshilaHandTrigger(boardOwner);

  return { destroyed: true, monster };
}

function checkAshilaHandTrigger(contestant) {
  if (!contestant || contestant.unitsDestroyedThisTurn < 2) return;

  const ashilaHandIdx = contestant.hand.findIndex(c => c.id === 'DM07');
  if (ashilaHandIdx === -1) return;

  if (contestant !== gameState.player) {
    const emptySlot = contestant.board.findIndex(m => m === null);
    if (emptySlot !== -1) {
      const summoned = contestant.hand.splice(ashilaHandIdx, 1)[0];
      resetCardStateForZoneChange(summoned);
      summoned.state = 'Stand';
      summoned.tempPowerMod += 2;
      contestant.board[emptySlot] = summoned;
      setLog('🔥 [AI แอชชี่ล่า] ยูนิตถูกทำลายครบ 2 ใบ! คอล "แอชชี่ล่า" จากบนมือลงสนามและพลังโจมตี +2 จนจบเทิร์น!');
      renderGame();
    }
    return;
  }

  setTimeout(() => {
    const currentIdx = contestant.hand.findIndex(c => c.id === 'DM07');
    if (currentIdx === -1 || gameState.gameOver) return;

    showChoiceModal(
      '🔥 เงื่อนไขสกิล "แอชชี่ล่า" บนมือทำงาน!',
      `ยูนิตฝั่งคุณถูกทำลายครบ ${contestant.unitsDestroyedThisTurn} ใบในเทิร์นนี้แล้ว!\nต้องการสั่งใช้งาน "แอชชี่ล่า" จากบนมือ เพื่อคอลลงสนามและเพิ่มพลังโจมตี +2 จนจบเทิร์นหรือไม่?`,
      [
        {
          label: '🔥 สั่งใช้งาน: คอล "แอชชี่ล่า" ลงสนาม (พลังโจมตี +2 จนจบเทิร์น!)',
          color: '#dc2626',
          onSelect: () => summonAshilaBySkillFromHand(contestant)
        },
        {
          label: 'ยังไม่ใช้ตอนนี้ (เก็บไว้บนมือก่อน)',
          color: '#475569',
          onSelect: () => renderGame()
        }
      ]
    );
  }, 150);
}

function summonAshilaBySkillFromHand(contestant) {
  const handIdx = contestant.hand.findIndex(c => c.id === 'DM07');
  if (handIdx === -1) return;

  const summoned = contestant.hand.splice(handIdx, 1)[0];
  resetCardStateForZoneChange(summoned);
  summoned.state = 'Stand';
  summoned.tempPowerMod += 2;

  const emptySlot = contestant.board.findIndex(m => m === null);
  if (emptySlot !== -1) {
    contestant.board[emptySlot] = summoned;
    setLog(`🔥 [สกิลแอชชี่ล่า] คอล "แอชชี่ล่า" จากบนมือลงช่องที่ ${emptySlot + 1} และพลังโจมตี +2 จนจบเทิร์น (เป็น ${getEffectivePower(summoned, contestant)})!`);
    renderGame();
  } else {
    gameState.pendingAction = {
      type: 'CALL_FROM_EFFECT_SELECT_SLOT',
      cardToPlace: summoned,
      onAfterPlace: null
    };
    setLog('🔥 [สกิลแอชชี่ล่า] สนามเต็ม 3 ช่อง — คลิกเลือกช่องบนสนามของคุณเพื่อวาง "แอชชี่ล่า" (Power 4) ทับ!');
    renderGame();
  }
}


/* ============================================================================
   หมวดที่ 3: สถานะเกม ระบบยืนยันการใช้การ์ด และหน้าต่างดูรายละเอียดการ์ด
   ============================================================================ */
const gameState = {
  turnCount: 1,
  activeTurn: 'player',
  phase: 'Mulligan',
  mulliganSelected: [],
  selectedHandIndex: null,
  selectedAttackerSlot: null,
  pendingAttack: null,
  pendingAction: null,
  isWaitingForChoice: false,
  isRollingDice: false,
  gameOver: false,
  matchLogHistory: [],
  player: null,
  ai: null
};

// ตรวจสอบว่ากำลังมีหน้าต่างตัวเลือก, รอเลือกเป้าหมาย หรือรอการตัดสินใจของสกิลอยู่หรือไม่
function isInteractionBlocked() {
  if (gameState.gameOver) return false;
  if (gameState.pendingAction) return true;
  if (gameState.isWaitingForChoice) return true;
  const choiceModal = document.getElementById('custom-choice-modal');
  if (choiceModal && choiceModal.style.display !== 'none' && choiceModal.style.display !== '') return true;
  const interceptModal = document.getElementById('intercept-modal');
  if (interceptModal && interceptModal.style.display !== 'none' && interceptModal.style.display !== '') return true;
  return false;
}

function createContestant(name, isFirstPlayer, prefix, leaderId = 'L01', deckList = DEFAULT_DECK_LIST) {
  const setup = createValidDeck(leaderId, deckList, prefix);
  return {
    name,
    ownerPrefix: prefix,
    isFirstPlayer,
    turnsTaken: 0,
    attacksThisTurn: 0,
    unitsDestroyedThisTurn: 0,
    futureUsedThisTurn: false,
    allForJitUsed: false,
    mayaOncePerGameUsed: false,
    satanOncePerGameUsed: false,
    jitCrazyUpgraded: false,
    leader: setup.leader,
    deck: setup.deck,
    hand: [],
    board: [null, null, null],
    graveyard: [],
    darkDimension: [],
    spellQuota: { normalUsed: 0, reactionUsed: 0 }
  };
}

function findCardMentionedInLog(message) {
  if (typeof CARD_DATABASE === 'undefined' || !Array.isArray(CARD_DATABASE) || !message) return null;
  const quoted = message.match(/"([^"]+)"/);
  if (quoted && quoted[1]) {
    const foundQuoted = CARD_DATABASE.find(c => c.name === quoted[1].trim());
    if (foundQuoted) return foundQuoted;
  }
  const bracketed = message.match(/\[(?:AI\s+|ออโต้\s*-\s*|คู่หู\s*-\s*)?([^\]]+)\]/);
  if (bracketed && bracketed[1]) {
    const clean = bracketed[1].replace(/^AI\s+/i, '').trim();
    const foundBracket = CARD_DATABASE.find(c => c.name === clean || clean.includes(c.name));
    if (foundBracket) return foundBracket;
  }
  return null;
}

function updateLastPlayedCardWidget(info) {
  const btn = document.getElementById('btn-last-card-pill');
  if (!btn) return;
  if (!info || !info.card) {
    btn.style.display = 'none';
    return;
  }
  const c = info.card;
  const thumb = btn.querySelector('.last-card-pill-img');
  const nameEl = btn.querySelector('.last-card-pill-name');
  const sideEl = btn.querySelector('.last-card-pill-side');
  if (thumb) thumb.src = c.image || '';
  if (nameEl) nameEl.textContent = c.name || 'การ์ดล่าสุด';
  if (sideEl) {
    sideEl.textContent = info.isAI ? '🤖 คู่แข่งใช้' : '👤 เราใช้';
    sideEl.style.color = info.isAI ? '#fca5a5' : '#86efac';
  }
  btn.style.borderColor = info.isAI ? '#ef4444' : '#22c55e';
  btn.style.display = 'inline-flex';
}

function setLog(message) {
  const singleLog = document.getElementById('action-log');
  if (singleLog) singleLog.textContent = message;

  const scrollbox = document.getElementById('action-log-scrollbox');
  if (scrollbox) {
    const logItem = document.createElement('div');
    logItem.className = 'log-item';
    if (message.includes('🤖') || message.includes('AI')) {
      logItem.classList.add('ai-action');
    }
    logItem.textContent = `[Turn ${gameState.turnCount}] ${message}`;
    scrollbox.appendChild(logItem);
    scrollbox.scrollTop = scrollbox.scrollHeight;
  }

  if (!Array.isArray(gameState.matchLogHistory)) gameState.matchLogHistory = [];
  let logCategory = 'OTHER';
  if (/โจมตี|ดาเมจ|⚔️|💥|ตี/i.test(message)) logCategory = 'ATTACK';
  else if (/เวท|สกิล|✨|⚡|🔮|🏰|🌌/i.test(message)) logCategory = 'SPELL';
  else if (/อัญเชิญ|ลงสนาม|คอล|🦖|👑/i.test(message)) logCategory = 'SUMMON';

  const isAI = message.includes('🤖') || message.includes('AI') || message.includes('ฝ่ายตรงข้าม') || message.includes('[เพื่อน]');
  let matchedCard = null;
  let actionSubText = '';
  let actorTitle = '';

  if (gameState._pendingBannerCard && (Date.now() - (gameState._pendingBannerCard.ts || 0) < 1800)) {
    matchedCard = gameState._pendingBannerCard.card;
    actionSubText = gameState._pendingBannerCard.actionSubText || '';
    actorTitle = gameState._pendingBannerCard.actorName || '';
    gameState._pendingBannerCard = null;
  } else {
    matchedCard = findCardMentionedInLog(message);
  }

  const entry = {
    id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    turn: gameState.turnCount,
    category: logCategory,
    message,
    isAI,
    cardId: matchedCard ? matchedCard.id : null,
    actorTitle: actorTitle || (isAI ? '🤖 ฝ่ายตรงข้าม' : '👤 ฝั่งเรา'),
    actionSubText: actionSubText || message,
    time: new Date().toLocaleTimeString('th-TH', { hour12: false })
  };

  gameState.matchLogHistory.push(entry);

  if (matchedCard) {
    gameState.lastPlayedCardInfo = {
      card: matchedCard,
      actorName: entry.actorTitle,
      actionSubText: entry.actionSubText,
      message: entry.message,
      turn: entry.turn,
      isAI: entry.isAI,
      category: entry.category,
      time: entry.time
    };
    updateLastPlayedCardWidget(gameState.lastPlayedCardInfo);
    updateCardDetailPanel(matchedCard);
  }
}

function checkGameOver() {
  if (!gameState.player || !gameState.ai) return false;
  if (gameState.gameOver) return true;

  // เงื่อนไขชนะพิเศษของแลนด์สเปล "ดินแดนปีศาจ" (DMS03):
  // เมื่อมีการ์ดในมิติมืดทั้งฝั่งเราและฝั่งตรงข้ามรวมกัน 15 ใบขึ้นไป ฝั่งที่มี "ดินแดนปีศาจ" ในมิติมืดชนะทันที!
  const totalDarkCards = (gameState.player.darkDimension ? gameState.player.darkDimension.length : 0)
    + (gameState.ai.darkDimension ? gameState.ai.darkDimension.length : 0);

  if (totalDarkCards >= 15) {
    const playerHasDemonRealm = gameState.player.darkDimension.some(c => c && c.id === 'DMS03');
    const aiHasDemonRealm = gameState.ai.darkDimension.some(c => c && c.id === 'DMS03');
    if (playerHasDemonRealm) {
      gameState.gameOver = true;
      gameState.pendingAction = null;
      setLog(`🏰 [ดินแดนปีศาจ] การ์ดในมิติมืดทั้ง 2 ฝั่งรวมกันครบ ${totalDarkCards} ใบ (≥ 15 ใบ) — คุณชนะเกมทันทีด้วยพลังของ "ดินแดนปีศาจ"!`);
      disableControls();
      setTimeout(() => showEndMatchModal('🏆 ชัยชนะแห่งดินแดนปีศาจ!', `การ์ดในมิติมืดทั้งสองฝ่ายรวมกันครบ ${totalDarkCards}/15 ใบ! คุณชนะเกมทันที!`), 500);
      return true;
    }
    if (aiHasDemonRealm) {
      gameState.gameOver = true;
      gameState.pendingAction = null;
      setLog(`💀 [ดินแดนปีศาจ] การ์ดในมิติมืดทั้ง 2 ฝั่งรวมกันครบ ${totalDarkCards} ใบ (≥ 15 ใบ) — ฝ่ายตรงข้ามชนะเกมทันทีด้วย "ดินแดนปีศาจ"!`);
      disableControls();
      setTimeout(() => showEndMatchModal('💀 คุณพ่ายแพ้!', `ฝ่ายตรงข้ามสะสมการ์ดในมิติมืดรวมกันครบ ${totalDarkCards}/15 ใบ ชนะด้วย "ดินแดนปีศาจ"!`), 500);
      return true;
    }
  }

  if (gameState.player.leader.hp <= 0) {
    gameState.gameOver = true;
    gameState.pendingAction = null;
    setLog('💀 จบเกม! Leader ของคุณ HP เหลือ 0 — คุณเป็นฝ่ายพ่ายแพ้!');
    disableControls();
    setTimeout(() => showEndMatchModal('💀 คุณพ่ายแพ้!', 'Leader ของคุณ HP เหลือ 0'), 500);
    return true;
  }
  if (gameState.ai.leader.hp <= 0) {
    gameState.gameOver = true;
    gameState.pendingAction = null;
    setLog('🏆 ยินดีด้วย! Leader ของฝ่ายตรงข้าม HP เหลือ 0 — คุณเป็นฝ่ายชนะ!');
    disableControls();
    setTimeout(() => showEndMatchModal('🏆 ยินดีด้วย คุณชนะ!', 'คุณโจมตี Leader ของฝ่ายตรงข้ามจน HP เหลือ 0 สำเร็จ!'), 500);
    return true;
  }
  return false;
}

function showEndMatchModal(title, desc) {
  // โหมดฝึก: ปุ่ม "เริ่มเล่นใหม่" ของหน้านี้จะเริ่มเกมจริงทับการซ้อม · แถบโค้ชมีปุ่มเริ่มใหม่/ออกให้แล้ว
  // วาดกระดานใหม่ด้วย: ชนะแบบ "ดินแดนปีศาจ" ไม่มีการวาดหลังจบ แถบโค้ชเลยไม่ขึ้นว่าสำเร็จ
  if (window.BOFTutorial && window.BOFTutorial.isTutorialActive()) { renderGame(); return; }
  showChoiceModal(title, desc, [
    {
      label: '🔄 เริ่มเล่นใหม่อีกครั้ง',
      color: '#16a34a',
      onSelect: () => initGame()
    },
    {
      label: '🏠 กลับสู่หน้าล็อบบี้หลัก',
      color: '#3b82f6',
      onSelect: () => returnToLobbyScreen()
    }
  ]);
}

function returnToLobbyScreen() {
  // ปิด isMultiplayer ก่อน destroy: ไม่งั้น conn.on('close') ฝั่งเราจะเด้ง "คุณชนะ" ให้คนที่กดออกเอง
  if (typeof pvpState !== 'undefined') pvpState.isMultiplayer = false;
  if (typeof pvpState !== 'undefined' && pvpState.peer) pvpState.peer.destroy();
  const gameBoard = document.querySelector('.game-container');
  const lobbyScreen = document.getElementById('lobby-screen');
  const mulliganModal = document.getElementById('mulligan-modal');
  if (mulliganModal) mulliganModal.style.display = 'none';
  if (gameBoard) gameBoard.style.display = 'none';
  if (lobbyScreen) lobbyScreen.style.display = ''; // ให้ css/lobby.css เลือก flex/grid ตามขนาดจอเอง
}

function disableControls() {
  const passBtn = document.getElementById('btn-pass-turn-inline');
  if (passBtn) passBtn.disabled = true;
}

function showChoiceModal(title, description, options, extra = null) {
  let modal = document.getElementById('custom-choice-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'custom-choice-modal';
    modal.className = 'modal-overlay';
    modal.style.display = 'none';
    modal.style.zIndex = '250';
    modal.innerHTML = `
      <div class="modal-box" style="max-width: 620px; max-height: 85vh; overflow-y: auto;">
        <h2 id="choice-modal-title" style="color: #38bdf8;">เลือกการทำงาน</h2>
        <p id="choice-modal-desc" style="color: #cbd5e1; margin: 10px 0 14px 0; white-space: pre-line;"></p>
        <div id="choice-modal-preview" style="display: none; flex-wrap: wrap; justify-content: center; gap: 10px; margin-bottom: 14px;"></div>
        <div id="choice-modal-buttons" style="display: flex; flex-direction: column; gap: 10px;"></div>
      </div>
    `;
    document.body.appendChild(modal);
  }

  document.getElementById('choice-modal-title').textContent = title;
  document.getElementById('choice-modal-desc').textContent = description;

  let previewEl = document.getElementById('choice-modal-preview');
  if (!previewEl) {
    previewEl = document.createElement('div');
    previewEl.id = 'choice-modal-preview';
    previewEl.style.cssText = 'display: none; flex-wrap: wrap; justify-content: center; gap: 10px; margin-bottom: 14px;';
    const descEl = document.getElementById('choice-modal-desc');
    if (descEl) descEl.insertAdjacentElement('afterend', previewEl);
  }
  previewEl.innerHTML = '';
  if (extra && Array.isArray(extra.previewCards) && extra.previewCards.length > 0) {
    previewEl.style.display = 'flex';
    extra.previewCards.forEach(card => {
      if (!card) return;
      const cardEl = createCardElement(card, gameState.player);
      previewEl.appendChild(cardEl);
    });
  } else {
    previewEl.style.display = 'none';
  }

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

function askCardUseConfirmation(card, actionTitle, onConfirmCallback) {
  const powerInfo = card.type === 'Monster' ? ` (Power: ${card.power})` : '';
  const tribeInfo = card.tribe ? ` [เผ่า: ${card.tribe}]` : '';
  showChoiceModal(
    `❓ ยืนยันการใช้งานการ์ด: ${card.name}${powerInfo}${tribeInfo}`,
    `คุณต้องการ ${actionTitle} ใช่หรือไม่?\n\n📜 ความสามารถ:\n${getCardDescription(card)}`,
    [
      {
        label: (window.isMobileUI && window.isMobileUI()) ? '✅ ยืนยัน' : `✅ ยืนยัน (${actionTitle})`,
        color: '#16a34a',
        onSelect: () => {
          if (onConfirmCallback) onConfirmCallback();
        }
      },
      {
        label: '❌ ยกเลิก',
        color: '#475569',
        onSelect: () => renderGame()
      }
    ]
  );
}

function openCardDetailModal(card, ownerContestant = null) {
  if (!card) return;
  let detailModal = document.getElementById('card-detail-view-modal');
  if (!detailModal) {
    detailModal = document.createElement('div');
    detailModal.id = 'card-detail-view-modal';
    detailModal.className = 'modal-overlay';
    detailModal.style.display = 'none';
    detailModal.style.zIndex = '300';
    detailModal.innerHTML = `
      <div class="modal-box" style="max-width: 500px; text-align: left; display: flex; flex-direction: column; gap: 14px;">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #334155; padding-bottom: 10px;">
          <h2 id="detail-card-name" style="color: #fbbf24; font-size: 20px;">ชื่อการ์ด</h2>
          <span id="detail-card-type" style="background: #1e293b; padding: 4px 10px; border-radius: 12px; font-size: 12px; color: #38bdf8; border: 1px solid #475569;">ประเภท</span>
        </div>
        <div style="display: flex; gap: 16px; align-items: flex-start; flex-wrap: wrap; justify-content: center;">
          <img id="detail-card-img" src="" alt="Card Image" style="width: 180px; height: 250px; object-fit: cover; border-radius: 10px; border: 2px solid #fbbf24; box-shadow: 0 8px 20px rgba(0,0,0,0.7);">
          <div style="flex: 1; min-width: 220px; display: flex; flex-direction: column; gap: 10px;">
            <div id="detail-card-stats" style="background: #141724; padding: 10px 12px; border-radius: 8px; border: 1px solid #2e344e; font-weight: bold; color: #4ade80; font-size: 14px;"></div>
            <div style="background: #141724; padding: 12px; border-radius: 8px; border: 1px solid #2e344e;">
              <div style="font-size: 12px; color: #94a3b8; margin-bottom: 6px; font-weight: bold;">📜 รายละเอียดความสามารถ:</div>
              <div id="detail-card-desc" style="font-size: 14px; color: #f8fafc; line-height: 1.6; white-space: pre-line;"></div>
            </div>
          </div>
        </div>
        <button class="btn" id="btn-close-card-detail" style="background: #3b82f6; width: 100%; padding: 10px;">ปิดหน้าต่างรายละเอียด</button>
      </div>
    `;
    document.body.appendChild(detailModal);
    document.getElementById('btn-close-card-detail').onclick = () => {
      detailModal.style.display = 'none';
    };
  }

  document.getElementById('detail-card-name').textContent = card.name;
  document.getElementById('detail-card-type').textContent = card.tribe ? `${card.type} • เผ่า${card.tribe}` : card.type;
  document.getElementById('detail-card-img').src = card.image;

  let statsText = '';
  if (card.type === 'Monster') {
    const effPwr = ownerContestant ? getEffectivePower(card, ownerContestant) : card.power;
    const maxCopy = getCardMaxCopies(card);
    const tribeLine = card.tribe ? `\n🧬 เผ่า: ${card.tribe}` : '';
    statsText = `⚔️ พลังโจมตี: ${effPwr} (พื้นฐาน: ${card.power})${tribeLine}\n🃏 ใส่ในเด็คได้สูงสุด: ${maxCopy} ใบ`;
  } else if (card.type === 'Leader') {
    statsText = `👑 พลังชีวิตสูงสุด (HP): ${card.maxHp}`;
  } else {
    const maxCopy = getCardMaxCopies(card);
    statsText = `✨ การ์ดเวทมนตร์ (${card.type})\n🃏 ใส่ในเด็คได้สูงสุด: ${maxCopy} ใบ`;
  }

  document.getElementById('detail-card-stats').style.whiteSpace = 'pre-line';
  document.getElementById('detail-card-stats').textContent = statsText;
  document.getElementById('detail-card-desc').textContent = getCardDescription(card);
  detailModal.style.display = 'flex';
}

function ensureZoneUIAndViewers() {
  if (!document.getElementById('zone-viewer-modal')) {
    const viewerModal = document.createElement('div');
    viewerModal.id = 'zone-viewer-modal';
    viewerModal.className = 'modal-overlay';
    viewerModal.style.display = 'none';
    viewerModal.style.zIndex = '200';
    viewerModal.innerHTML = `
      <div class="modal-box" style="max-width: 820px; max-height: 88vh; overflow-y: auto;">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #334155; padding-bottom: 10px; margin-bottom: 8px;">
          <h2 id="zone-viewer-title" style="color: #fbbf24; font-size: 16px;">รายการการ์ด</h2>
          <button class="btn" id="btn-close-zone-viewer" style="background: #dc2626; padding: 6px 12px;">✖ ปิด</button>
        </div>
        <p style="font-size: 12px; color: #38bdf8; margin-bottom: 12px;">💡 คลิกขวาที่การ์ดใบใดก็ได้เพื่อเปิดดูรูปใหญ่และรายละเอียดความสามารถ</p>
        <p id="zone-viewer-empty" style="color: #94a3b8; margin: 20px 0; display: none;">ไม่มีการ์ดในโซนนี้</p>
        <div id="zone-viewer-list" style="display: flex; flex-wrap: wrap; justify-content: center; gap: 10px; margin-bottom: 10px;"></div>
      </div>
    `;
    document.body.appendChild(viewerModal);
    document.getElementById('btn-close-zone-viewer').onclick = () => {
      viewerModal.style.display = 'none';
    };
  }

  const logToggle = document.getElementById('action-log-toggle');
  const logContainer = document.getElementById('action-log-container');
  const logIndicator = document.getElementById('log-expand-indicator');
  if (logToggle && logContainer && !logToggle.dataset.bound) {
    logToggle.dataset.bound = 'true';
    logToggle.onclick = (e) => {
      e.stopPropagation();
      const isExpanded = logContainer.classList.toggle('expanded');
      if (logIndicator) {
        logIndicator.textContent = isExpanded ? '▼ ปิด' : '▲ ประวัติ';
      }
    };
    document.addEventListener('click', (e) => {
      if (logContainer.classList.contains('expanded') && !logContainer.contains(e.target)) {
        logContainer.classList.remove('expanded');
        if (logIndicator) logIndicator.textContent = '▲ ประวัติ';
      }
    });
  }

  const aiGraveBox = document.getElementById('ai-grave-box');
  if (aiGraveBox) {
    aiGraveBox.style.cursor = 'pointer';
    aiGraveBox.title = 'คลิกดูการ์ดในดรอปโซนของคู่แข่ง';
    aiGraveBox.onclick = () => openZoneViewerModal('🪦 ดรอปโซนของคู่แข่ง (Graveyard)', gameState.ai.graveyard, gameState.ai);
  }

  const aiDarkBox = document.getElementById('ai-dark-box');
  if (aiDarkBox) {
    aiDarkBox.style.cursor = 'pointer';
    aiDarkBox.title = 'คลิกดูการ์ดในมิติมืดของคู่แข่ง';
    aiDarkBox.onclick = () => openZoneViewerModal('🌌 มิติมืดของคู่แข่ง (Dark Dimension)', gameState.ai.darkDimension, gameState.ai);
  }

  const aiDeckBox = document.getElementById('ai-deck-box');
  if (aiDeckBox) {
    aiDeckBox.onclick = null;
    aiDeckBox.style.cursor = 'default';
  }

  const playerGraveBox = document.getElementById('player-grave-box');
  if (playerGraveBox) {
    playerGraveBox.style.cursor = 'pointer';
    playerGraveBox.title = 'คลิกดูการ์ดในดรอปโซนของคุณ';
    playerGraveBox.onclick = () => openZoneViewerModal('🪦 ดรอปโซนของคุณ (Graveyard)', gameState.player.graveyard, gameState.player);
  }

  const playerDarkBox = document.getElementById('player-dark-box');
  if (playerDarkBox) {
    playerDarkBox.style.cursor = 'pointer';
    playerDarkBox.title = 'คลิกดูการ์ดในมิติมืดของคุณ';
    playerDarkBox.onclick = () => openZoneViewerModal('🌌 มิติมืดของคุณ (Dark Dimension)', gameState.player.darkDimension, gameState.player);
  }

  const playerDeckBox = document.getElementById('player-deck-box');
  if (playerDeckBox) {
    playerDeckBox.onclick = null;
    playerDeckBox.style.cursor = 'default';
  }
}



/**
 * ระบบสับกองการ์ดพร้อมแอนิเมชันแบบ Cardfight Vanguard / BOF
 * @param {Function} [onDone] - Callback เมื่อสับเสร็จ
 * @param {string} [targetZone] - 'all' | 'player' | 'ai'
 */
function playDeckShuffleAnimation(onDone, targetZone = 'all') {
  if (window.BOF_AUDIO && typeof window.BOF_AUDIO.playDeckShuffle === 'function') {
    window.BOF_AUDIO.playDeckShuffle();
  }

  const targets = [];
  if (targetZone === 'all' || targetZone === 'player') {
    const pDeck = document.getElementById('player-deck-box');
    if (pDeck) targets.push(pDeck);
  }
  if (targetZone === 'all' || targetZone === 'ai') {
    const aiDeck = document.getElementById('ai-deck-box');
    if (aiDeck) targets.push(aiDeck);
  }

  targets.forEach(deckEl => {
    const oldAnim = deckEl.querySelector('.deck-shuffle-anim');
    if (oldAnim) oldAnim.remove();

    const animEl = document.createElement('div');
    animEl.className = 'deck-shuffle-anim';
    animEl.innerHTML = `
      <div class="deck-packet packet-left"></div>
      <div class="deck-packet packet-right"></div>
    `;
    deckEl.appendChild(animEl);

    setTimeout(() => {
      animEl.remove();
    }, 1250);
  });

  setTimeout(() => {
    if (typeof onDone === 'function') onDone();
  }, 1300);
}

/**
 * ระบบทอยเหรียญตัดสินใครเริ่มก่อน (Coin Toss System) ตามตัวอย่างวิดีโอ
 * @param {Object} options
 * @param {Function} options.onComplete - callback(isPlayerFirst)
 * @param {boolean} [options.forcedResult] - บังคับผล (ใช้สำหรับ PvP ซิงค์ผล)
 */
function startCoinToss(options = {}) {
  const modal = document.getElementById('coin-toss-modal');
  const coinEl = document.getElementById('bof-coin-element');
  const resultBanner = document.getElementById('coin-result-banner');
  const winnerTitle = document.getElementById('coin-winner-title');
  const detailText = document.getElementById('coin-detail-text');
  const instructionText = document.getElementById('coin-instruction-text');
  const proceedBtn = document.getElementById('btn-coin-proceed');

  const isPlayerFirst = options.forcedResult !== undefined ? options.forcedResult : (Math.random() < 0.5);

  if (!modal || !coinEl) {
    if (typeof options.onComplete === 'function') options.onComplete(isPlayerFirst);
    return;
  }

  modal.style.display = 'flex';
  resultBanner.style.display = 'none';
  proceedBtn.style.display = 'none';
  instructionText.style.display = 'block';
  instructionText.textContent = 'กำลังทอยเหรียญ...';
  coinEl.className = 'bof-coin';

  if (window.BOF_AUDIO && typeof window.BOF_AUDIO.playCoinFlip === 'function') {
    window.BOF_AUDIO.playCoinFlip();
  }

  setTimeout(() => {
    coinEl.classList.add(isPlayerFirst ? 'flipping-heads' : 'flipping-tails');
  }, 50);

  setTimeout(() => {
    if (window.BOF_AUDIO && typeof window.BOF_AUDIO.playCoinLand === 'function') {
      window.BOF_AUDIO.playCoinLand();
    }

    resultBanner.style.display = 'block';
    if (isPlayerFirst) {
      winnerTitle.textContent = '🎉 คุณได้เริ่มก่อน (PLAYER FIRST)';
      winnerTitle.style.color = '#4ade80';
      detailText.textContent = '🪙 เหรียญออก: หัว (Heads)';
    } else {
      winnerTitle.textContent = '🤖 AI เริ่มก่อน (AI FIRST)';
      winnerTitle.style.color = '#f472b6';
      detailText.textContent = '🪙 เหรียญออก: ก้อย (Tails)';
    }

    instructionText.textContent = 'สับและหยิบมือเริ่มต้น 5 ใบ';
    proceedBtn.style.display = 'inline-block';
    proceedBtn.disabled = false;

    let handled = false;
    const handleProceed = () => {
      if (handled) return;
      handled = true;
      modal.style.display = 'none';
      if (typeof options.onComplete === 'function') {
        options.onComplete(isPlayerFirst);
      }
    };

    proceedBtn.onclick = handleProceed;
    setTimeout(() => {
      if (modal.style.display !== 'none' && !handled) {
        handleProceed();
      }
    }, 4500);
  }, 1400);
}

function openZoneViewerModal(titleText, cardArray, ownerContestant) {
  ensureZoneUIAndViewers();
  const modal = document.getElementById('zone-viewer-modal');
  const titleEl = document.getElementById('zone-viewer-title');
  const emptyEl = document.getElementById('zone-viewer-empty');
  const listEl = document.getElementById('zone-viewer-list');

  titleEl.textContent = `${titleText} (${cardArray.length} ใบ)`;
  listEl.innerHTML = '';

  if (!cardArray || cardArray.length === 0) {
    emptyEl.style.display = 'block';
  } else {
    emptyEl.style.display = 'none';
    cardArray.forEach(card => {
      const cardEl = createCardElement(card, ownerContestant);
      cardEl.title = 'คลิกขวาเพื่อดูรายละเอียดของการ์ดใบนี้';
      listEl.appendChild(cardEl);
    });
  }

  modal.style.display = 'flex';
}


/* ============================================================================
   หมวดที่ 4: ระบบประมวลผลความสามารถแบบบล็อก (MODULAR CARD EFFECT ENGINE)
   รองรับการตรวจเงื่อนไข, การจ่าย Cost, การเลือกเป้าหมาย และการต่อหลายบล็อกในการ์ดใบเดียว
   ============================================================================ */
const EffectEngine = {
  // 1. ตรวจสอบเงื่อนไขและคอสต์ก่อนเริ่มใช้งานความสามารถ
  canActivateEffect(effectDef, context) {
    const { caster, opponent, sourceCard } = context;

    if (effectDef.oncePerTurn && sourceCard) {
      if (sourceCard.type === 'Leader' && sourceCard.abilityUsedThisTurn) {
        return { ok: false, reason: `${sourceCard.name} ใช้ความสามารถไปแล้วในเทิร์นนี้!` };
      }
      if (sourceCard.usedSkills && sourceCard.usedSkills[effectDef.id]) {
        return { ok: false, reason: `"${sourceCard.name}" ใช้ความสามารถนี้ไปแล้วในเทิร์นนี้!` };
      }
    }

    // ตรวจสอบ Condition
    if (effectDef.condition) {
      const cond = effectDef.condition;
      if (cond.type === 'ALLY_ON_BOARD' && !caster.board.some(m => m !== null && m.id === cond.cardId)) {
        const partnerTemplate = CARD_DATABASE.find(c => c.id === cond.cardId);
        return { ok: false, reason: `ต้องมี "${partnerTemplate ? partnerTemplate.name : cond.cardId}" อยู่บนสนามฝั่งเรา!` };
      }
      if (cond.type === 'MIN_TRIBE_COUNT') {
        const cnt = caster.board.filter(m => m !== null && hasCardTribe(m, cond.tribe)).length;
        if (cnt < cond.count) {
          return { ok: false, reason: `ต้องมียูนิทเผ่า "${cond.tribe}" บนสนามอย่างน้อย ${cond.count} ใบ!` };
        }
      }
      if (cond.type === 'MIN_NAME_COUNT') {
        const cnt = caster.board.filter(m => m !== null && hasCardName(m, cond.nameKeyword)).length;
        if (cnt < cond.count) {
          return { ok: false, reason: `ต้องมียูนิทที่มีคำว่า "${cond.nameKeyword}" บนสนามอย่างน้อย ${cond.count} ใบ!` };
        }
      }
    }

    // ตรวจสอบ Costs
    if (Array.isArray(effectDef.costs)) {
      for (const cost of effectDef.costs) {
        if (cost.type === 'DISCARD_HAND') {
          const availableHand = caster.hand.filter((_, idx) => idx !== context.excludeHandIndex);
          if (availableHand.length < (cost.count || 1)) {
            return { ok: false, reason: `ต้องมีการ์ดใบอื่นบนมืออย่างน้อย ${cost.count || 1} ใบเพื่อใช้ทิ้ง!` };
          }
        }
        if (cost.type === 'REST_ALLY') {
          const standAllies = caster.board.filter(m => m !== null && m.state === 'Stand');
          if (standAllies.length < (cost.count || 1)) {
            return { ok: false, reason: `ต้องมียูนิทฝั่งเราที่อยู่ในสถานะ Stand อย่างน้อย ${cost.count || 1} ใบ!` };
          }
        }
        if (cost.type === 'REST_SELF') {
          if (!sourceCard || sourceCard.state !== 'Stand') {
            return { ok: false, reason: `"${sourceCard ? sourceCard.name : 'ยูนิต'}" ต้องอยู่ในสถานะ Stand!` };
          }
        }
        if (cost.type === 'REDUCE_SELF_POWER') {
          if (!sourceCard || getEffectivePower(sourceCard, caster) < (cost.amount || 1)) {
            return { ok: false, reason: `พลังของ "${sourceCard.name}" น้อยกว่า ${cost.amount} จึงไม่สามารถลดพลังเพื่อใช้สกิลได้!` };
          }
        }
      }
    }

    // ตรวจสอบความพร้อมของเป้าหมายในบล็อกหลัก (สำหรับการ์ดเวทมนตร์และสกิลกดใช้)
    if (effectDef.trigger === 'CAST_SPELL' || effectDef.trigger === 'ACTIVATE_MAIN' || effectDef.trigger === 'ACTIVATE_LEADER') {
      for (const step of (effectDef.steps || [])) {
        if (step.block === 'DESTROY_UNIT' && step.target === 'OPPONENT' && !opponent.board.some(m => m !== null)) {
          return { ok: false, reason: 'ฝ่ายตรงข้ามไม่มีมอนสเตอร์บนสนามให้ทำลาย!' };
        }
        if (step.block === 'REDUCE_POWER' && step.target === 'ALL_ENEMIES' && !opponent.board.some(m => m !== null)) {
          return { ok: false, reason: 'ฝ่ายตรงข้ามไม่มีมอนสเตอร์บนสนาม!' };
        }
        if (step.block === 'BOUNCE_UNIT' && step.target === 'OPPONENT' && !opponent.board.some(m => m !== null)) {
          return { ok: false, reason: 'ฝ่ายตรงข้ามไม่มีมอนสเตอร์บนสนามให้ส่งกลับขึ้นมือ!' };
        }
        if (step.block === 'ADD_POWER' && (step.target === 'ALLY' || step.target === 'ALL_ALLIES')) {
          const matchingAllies = caster.board.filter(m =>
            m !== null &&
            (!step.filterTribe || hasCardTribe(m, step.filterTribe)) &&
            (!step.filterName || hasCardName(m, step.filterName))
          );
          if (matchingAllies.length === 0) {
            return { ok: false, reason: `ไม่มียูนิท${step.filterTribe ? `เผ่า "${step.filterTribe}"` : ''}บนสนามฝั่งเราให้เพิ่มพลัง!` };
          }
        }
        if (step.block === 'GRANT_STATUS' && !caster.board.some(m => m !== null)) {
          return { ok: false, reason: 'ไม่มียูนิทบนสนามฝั่งเราให้มอบความสามารถพิเศษ!' };
        }
        if (step.block === 'RECOVER_FROM_GRAVE') {
          const matches = this.filterCards(caster.graveyard, step);
          if (matches.length === 0) return { ok: false, reason: 'ไม่มีการ์ดที่ตรงเงื่อนไขอยู่ในกองนรก!' };
        }
        if (step.block === 'SEARCH_DECK_OR_GRAVE') {
          const inDeck = this.filterCards(caster.deck, step).length > 0;
          const inGrave = this.filterCards(caster.graveyard, step).length > 0;
          if (!inDeck && !inGrave) return { ok: false, reason: 'ไม่มีการ์ดเป้าหมายอยู่ในกองการ์ดหรือกองนรกเลย!' };
        }
        if (step.block === 'SEARCH_DECK') {
          const inDeck = this.filterCards(caster.deck, step).length > 0;
          if (!inDeck) return { ok: false, reason: 'ไม่มีการ์ดที่ตรงเงื่อนไขอยู่ในกองการ์ดเลย!' };
        }
        if (step.block === 'MILL_DECK') {
          const targetSide = step.side === 'OPPONENT' ? opponent : caster;
          if (targetSide.deck.length === 0) {
            return { ok: false, reason: `กองการ์ดของ${step.side === 'OPPONENT' ? 'ฝ่ายตรงข้าม' : 'คุณ'}หมดแล้ว!` };
          }
        }
        if (step.block === 'CARPET_BOMB_COMPOSITE') {
          const hasSoldier = caster.board.some(m => m !== null && (m.id === 'NM02' || m.id === 'NM03' || m.id === 'NM04'));
          if (!hasSoldier) return { ok: false, reason: 'ไม่มี ทหารเกณฑ์เหนือ, ทหารพรานเหนือ หรือ ทหารหลวงเหนือ บนสนามของคุณเลย!' };
        }
        if (step.block === 'LEVIATHAN_MARK_TARGET') {
          const hasPwr2Enemy = opponent.board.some(m => m !== null && getEffectivePower(m, opponent) === 2);
          if (!hasPwr2Enemy) return { ok: false, reason: 'ฝ่ายตรงข้ามไม่มียูนิทที่มีพลังโจมตี 2 หน่วยบนสนาม!' };
        }
        if (step.block === 'SATAN_WRATH_EFFECT') {
          if (caster.satanOncePerGameUsed) return { ok: false, reason: 'ความสามารถของ "ซาตาน บาปโทสะ" สั่งใช้ได้เพียง 1 ครั้งต่อเกมเท่านั้น!' };
          if (caster.leader.hp !== 1) return { ok: false, reason: `ต้องมีเลือดลีดเดอร์เหลือ 1 หน่วยเท่านั้น! (ปัจจุบัน: ${caster.leader.hp} หน่วย)` };
          if (caster.hand.length < 5) return { ok: false, reason: `ต้องมีการ์ดบนมืออย่างน้อย 5 ใบเพื่อใช้ทิ้ง! (ปัจจุบันมี ${caster.hand.length} ใบ)` };
        }
        if (step.block === 'BEELZEBUB_GLUTTONY_SKILL') {
          if (caster.graveyard.length < 2) return { ok: false, reason: `ต้องมีการ์ดในดรอป (นรก) อย่างน้อย 2 ใบ! (ปัจจุบันมี ${caster.graveyard.length} ใบ)` };
        }
        if (step.block === 'NUEA_CLIP_FREE_CAST') {
          const normalSpellsInHand = caster.hand
            .map((c, idx) => ({ card: c, idx }))
            .filter(item => item.card && item.card.type === 'NormalSpell');
          if (normalSpellsInHand.length === 0) {
            return { ok: false, reason: 'ไม่มีการ์ดเวทมนตร์ปกติ (NormalSpell) บนมือให้สั่งใช้งาน!' };
          }
          const anyReadySpell = normalSpellsInHand.some(item => {
            const spEff = (item.card.effects || []).find(e => e.trigger === 'CAST_SPELL');
            if (!spEff) return false;
            return this.canActivateEffect(spEff, {
              caster,
              opponent,
              sourceCard: item.card,
              spellHandIndex: item.idx,
              excludeHandIndex: item.idx,
              isAI: context.isAI
            }).ok;
          });
          if (!anyReadySpell) {
            return { ok: false, reason: 'การ์ดเวทมนตร์ปกติบนมือยังไม่ครบเงื่อนไขในการสั่งใช้งาน!' };
          }
        }
        if (step.block === 'DEAN_DRAW2_DISCARD1') {
          if (caster.deck.length === 0) return { ok: false, reason: 'กองการ์ดของคุณหมดแล้ว!' };
        }
        if (step.block === 'CRAZY_WAR_SEARCH_PAIR') {
          const hasOatOrBank = [...caster.deck, ...caster.graveyard].some(c => c && (c.id === 'OM01' || c.id === 'OM02'));
          if (!hasOatOrBank) return { ok: false, reason: 'ไม่มี "ไอโอ๊ตบ้าการ์ตูน" หรือ "ไอแบงค์บ้าเกม" อยู่ในกองหรือนรกเลย!' };
        }
      }
    }

    return { ok: true };
  },

  filterCards(cardArray, filterSpec) {
    if (!Array.isArray(cardArray)) return [];
    return cardArray.filter(c => {
      if (!c) return false;
      if (filterSpec.cardId && c.id !== filterSpec.cardId) return false;
      if (filterSpec.filterTribe && !hasCardTribe(c, filterSpec.filterTribe)) return false;
      if (filterSpec.filterName && !hasCardName(c, filterSpec.filterName)) return false;
      if (filterSpec.filterType === 'SPELL' && !isSpellCard(c)) return false;
      if (filterSpec.filterType === 'MONSTER' && c.type !== 'Monster') return false;
      return true;
    });
  },

  // 2. เรียกใช้เอฟเฟกต์ทั้งหมดของการ์ดที่ตรงกับ Trigger (เช่น ON_SUMMON, ON_DESTROY, ON_KILL_UNIT, ON_HIT_LEADER, ON_INTERCEPT)
  triggerCardEffects(card, triggerType, context, onAllDone = null) {
    if (!card || !Array.isArray(card.effects)) {
      if (onAllDone) onAllDone();
      return false;
    }
    const matchingEffects = card.effects.filter(e => {
      if (e.trigger !== triggerType) return false;
      if (e.oncePerTurn && card.usedSkills && card.usedSkills[e.id]) return false;
      return true;
    });
    if (matchingEffects.length === 0) {
      if (onAllDone) onAllDone();
      return false;
    }

    let idx = 0;
    const runNextEffect = () => {
      if (idx >= matchingEffects.length) {
        if (onAllDone) onAllDone();
        return;
      }
      const eff = matchingEffects[idx++];
      this.activateSpecificEffect(eff, { ...context, sourceCard: card }, runNextEffect);
    };
    runNextEffect();
    return true;
  },

  // 3. เริ่มต้นรัน Effect 1 ชุด (จ่าย Cost ตามลำดับ -> รัน Steps ตามลำดับ)
  activateSpecificEffect(effectDef, context, onComplete = null) {
    const costQueue = Array.isArray(effectDef.costs) ? [...effectDef.costs] : [];
    const stepQueue = Array.isArray(effectDef.steps) ? [...effectDef.steps] : [];

    const markSkillUsedAndRunSteps = () => {
      const { caster, sourceCard, spellHandIndex } = context;
      if (effectDef.oncePerTurn && sourceCard) {
        if (sourceCard.type === 'Leader') sourceCard.abilityUsedThisTurn = true;
        else {
          if (!sourceCard.usedSkills) sourceCard.usedSkills = {};
          sourceCard.usedSkills[effectDef.id] = true;
        }
      }

      // หากเป็นการร่ายการ์ดเวทมนตร์จากมือ ให้นำการ์ดเวทออกจากมือลงนรกเมื่อจ่าย Cost เสร็จ
      if (effectDef.trigger === 'CAST_SPELL' && spellHandIndex !== undefined && spellHandIndex !== null) {
        const currentSpellIdx = caster.hand.findIndex(c => c.uid === sourceCard.uid);
        if (currentSpellIdx !== -1) {
          const usedSpell = caster.hand.splice(currentSpellIdx, 1)[0];
          caster.spellQuota.normalUsed += 1;
          resetCardStateForZoneChange(usedSpell);
          caster.graveyard.push(usedSpell);
        }
      }

      this.runStepQueue(stepQueue, context, () => {
        renderGame();
        if (onComplete) onComplete();
      });
    };

    this.runCostQueue(costQueue, context, markSkillUsedAndRunSteps);
  },

  // 4. ประมวลผลคิวการจ่าย Cost
  runCostQueue(costQueue, context, onCostsPaid) {
    if (!costQueue || costQueue.length === 0) {
      onCostsPaid();
      return;
    }
    const cost = costQueue.shift();
    const { caster, opponent, sourceCard, isAI } = context;

    if (cost.type === 'REST_SELF') {
      if (sourceCard) sourceCard.state = 'Rest';
      this.runCostQueue(costQueue, context, onCostsPaid);
      return;
    }

    if (cost.type === 'REDUCE_SELF_POWER') {
      if (sourceCard) sourceCard.permPowerMod -= (cost.amount || 1);
      this.runCostQueue(costQueue, context, onCostsPaid);
      return;
    }

    if (cost.type === 'DISCARD_HAND') {
      const count = cost.count || 1;
      if (isAI) {
        for (let i = 0; i < count && caster.hand.length > 0; i++) {
          const d = caster.hand.pop();
          resetCardStateForZoneChange(d);
          caster.graveyard.push(d);
          if (cost.triggerDiscardSkill && d.id === 'DM05' && opponent.hand.length > 0) {
            const oppD = opponent.hand.pop();
            resetCardStateForZoneChange(oppD);
            opponent.graveyard.push(oppD);
          }
        }
        this.runCostQueue(costQueue, context, onCostsPaid);
        return;
      }

      gameState.pendingAction = {
        type: 'MODULAR_SELECT_TARGET',
        targetZone: 'PLAYER_HAND',
        remainingCount: count,
        excludeHandUid: sourceCard ? sourceCard.uid : null,
        promptText: `👉 [${sourceCard ? sourceCard.name : 'จ่าย Cost'}] คลิกเลือกการ์ดบนมือของคุณ ${count} ใบเพื่อทิ้งลงนรก`,
        onSelectHand: (handIdx) => {
          const discarded = caster.hand.splice(handIdx, 1)[0];
          resetCardStateForZoneChange(discarded);
          caster.graveyard.push(discarded);
          setLog(`🗑️ ทิ้ง "${discarded.name}" จากมือลงนรก`);

          if (cost.triggerDiscardSkill && discarded.id === 'DM05' && opponent.hand.length > 0) {
            const aiDiscarded = opponent.hand.pop();
            resetCardStateForZoneChange(aiDiscarded);
            opponent.graveyard.push(aiDiscarded);
            setLog(`🍬 [ออโต้ซึรุรุ] ถูกทิ้งจากสกิลโอนามิ -> ฝ่ายตรงข้ามต้องทิ้ง "${aiDiscarded.name}" 1 ใบ!`);
          }
        },
        onAllSelected: () => this.runCostQueue(costQueue, context, onCostsPaid)
      };
      setLog(gameState.pendingAction.promptText);
      renderGame();
      return;
    }

    if (cost.type === 'REST_ALLY') {
      const count = cost.count || 1;
      if (isAI) {
        let rested = 0;
        caster.board.forEach(m => {
          if (m && m.state === 'Stand' && rested < count) {
            m.state = 'Rest';
            rested++;
          }
        });
        this.runCostQueue(costQueue, context, onCostsPaid);
        return;
      }

      const selectedSlots = [];
      gameState.pendingAction = {
        type: 'MODULAR_SELECT_TARGET',
        targetZone: 'PLAYER_BOARD',
        requireStand: true,
        remainingCount: count,
        selectedSlots,
        promptText: `👉 [${sourceCard ? sourceCard.name : 'จ่าย Cost'}] คลิกเลือกยูนิทฝ่ายเราที่ Stand อยู่ (${count} ใบ) เพื่อเปลี่ยนเป็น Rest`,
        onSelectSlot: (slotIdx) => {
          const unit = caster.board[slotIdx];
          if (!unit || unit.state !== 'Stand' || selectedSlots.includes(slotIdx)) return false;
          selectedSlots.push(slotIdx);
          unit.state = 'Rest';
          return true;
        },
        onAllSelected: () => this.runCostQueue(costQueue, context, onCostsPaid)
      };
      setLog(gameState.pendingAction.promptText);
      renderGame();
      return;
    }

    this.runCostQueue(costQueue, context, onCostsPaid);
  },

  // 5. ประมวลผลคิวบล็อกความสามารถทีละลำดับ (Sequential Step Pipeline)
  runStepQueue(stepQueue, context, onAllStepsComplete) {
    if (!stepQueue || stepQueue.length === 0) {
      onAllStepsComplete();
      return;
    }
    const step = stepQueue.shift();
    this.executeSingleStep(step, context, () => {
      this.runStepQueue(stepQueue, context, onAllStepsComplete);
    });
  },

  executeSingleStep(step, context, next) {
    const { caster, opponent, sourceCard, isAI } = context;
    const cardTitle = sourceCard ? `[${sourceCard.name}]` : '[เอฟเฟกต์]';

    switch (step.block) {
      // --- บล็อกที่ 1: จั่วการ์ด (DRAW) ---
      case 'DRAW': {
        const targetSide = step.side === 'OPPONENT' ? opponent : caster;
        let count = step.count || 1;
        if (step.bonusIfGraveAtLeast && caster.graveyard.length >= step.bonusIfGraveAtLeast) {
          count = step.bonusCount || count;
        }
        drawCards(targetSide, count);
        setLog(`✨ ${cardTitle} ${targetSide.name} จั่วการ์ด ${count} ใบ!`);
        next();
        return;
      }

      // --- บล็อกที่ 2: ฟื้นฟู/ทำดาเมจใส่ Leader ---
      case 'HEAL_LEADER': {
        const targetSide = step.side === 'OPPONENT' ? opponent : caster;
        const oldHp = targetSide.leader.hp;
        targetSide.leader.hp = Math.min(targetSide.leader.maxHp, targetSide.leader.hp + (step.amount || 1));
        setLog(`✨ ${cardTitle} ฟื้นฟู HP ลีดเดอร์ (${oldHp} -> ${targetSide.leader.hp}/${targetSide.leader.maxHp})!`);
        next();
        return;
      }

      case 'DAMAGE_LEADER': {
        const targetSide = step.side === 'OPPONENT' ? opponent : caster;
        targetSide.leader.hp = Math.max(0, targetSide.leader.hp - (step.amount || 1));
        setLog(`💥 ${cardTitle} ทำดาเมจใส่ Leader ของ ${targetSide.name} ${step.amount || 1} หน่วย!`);
        checkGameOver();
        next();
        return;
      }

      // --- บล็อกที่ 3: โม่กองการ์ด (MILL_DECK) ---
      case 'MILL_DECK': {
        const targetSide = step.side === 'OPPONENT' ? opponent : caster;
        const count = step.count || 1;
        const milledNames = [];
        for (let i = 0; i < count && targetSide.deck.length > 0; i++) {
          const milled = targetSide.deck.pop();
          resetCardStateForZoneChange(milled);
          targetSide.graveyard.push(milled);
          milledNames.push(milled.name);
        }
        if (milledNames.length > 0) {
          setLog(`❄️ ${cardTitle} ส่ง "${milledNames.join(', ')}" ใบบนสุดของกอง ${targetSide.name} ลงนรก!`);
        }
        next();
        return;
      }

      // --- บล็อกที่ 4: ทำลายการ์ดยูนิต (DESTROY_UNIT) ---
      case 'DESTROY_UNIT': {
        if (step.target === 'BOTH' && step.select === 'ALL') {
          for (let i = 0; i < 3; i++) {
            if (caster.board[i]) destroyBoardMonster(caster, i, false, false);
            if (opponent.board[i]) destroyBoardMonster(opponent, i, false, true);
          }
          setLog(`☄️ ${cardTitle} ทำลายยูนิตทั้งหมดบนสนามทั้ง 2 ฝั่ง!`);
          next();
          return;
        }

        const targetBoardOwner = step.target === 'SELF' ? caster : opponent;
        const isEnemyEffect = (targetBoardOwner !== caster);

        if (step.select === 'ALL') {
          for (let i = 0; i < 3; i++) {
            if (targetBoardOwner.board[i]) destroyBoardMonster(targetBoardOwner, i, false, isEnemyEffect);
          }
          setLog(`💥 ${cardTitle} ทำลายยูนิตบนสนามของ ${targetBoardOwner.name}!`);
          next();
          return;
        }

        const validSlots = targetBoardOwner.board
          .map((m, idx) => (m !== null ? idx : null))
          .filter(idx => idx !== null);

        if (validSlots.length === 0) {
          setLog(`ℹ️ ${cardTitle} ไม่มีมอนสเตอร์เป้าหมายบนสนามให้ทำลาย`);
          next();
          return;
        }

        const count = Math.min(step.count || 1, validSlots.length);
        if (isAI) {
          for (let k = 0; k < count; k++) {
            let bestSlot = -1;
            let maxPwr = -1;
            targetBoardOwner.board.forEach((m, idx) => {
              if (m && m.id !== 'NM05' && !m.immuneToEnemyEffectsUntilEndOfTurn && getEffectivePower(m, targetBoardOwner) > maxPwr) {
                maxPwr = getEffectivePower(m, targetBoardOwner);
                bestSlot = idx;
              }
            });
            if (bestSlot !== -1) destroyBoardMonster(targetBoardOwner, bestSlot, false, isEnemyEffect);
          }
          next();
          return;
        }

        gameState.pendingAction = {
          type: 'MODULAR_SELECT_TARGET',
          targetZone: targetBoardOwner === gameState.player ? 'PLAYER_BOARD' : 'OPPONENT_BOARD',
          remainingCount: count,
          promptText: `💥 ${cardTitle} คลิกเลือกยูนิทของ ${targetBoardOwner.name} บนสนามเพื่อทำลาย (${count} ใบ)!`,
          onSelectSlot: (slotIdx) => {
            const targetMonster = targetBoardOwner.board[slotIdx];
            if (!targetMonster) {
              setLog('⚠️ กรุณาคลิกเลือกช่องที่มีมอนสเตอร์อยู่!');
              return false;
            }
            destroyBoardMonster(targetBoardOwner, slotIdx, false, isEnemyEffect);
            setLog(`💥 ${cardTitle} สั่งทำลาย "${targetMonster.name}" สำเร็จ!`);
            return true;
          },
          onAllSelected: () => next()
        };
        setLog(gameState.pendingAction.promptText);
        renderGame();
        return;
      }

      // --- บล็อกที่ 5: เพิ่มพลังโจมตี (ADD_POWER) ---
      case 'ADD_POWER': {
        const amount = step.amount || 1;
        const prop = step.duration === 'TURN' ? 'tempPowerMod' : 'permPowerMod';
        const durLabel = step.duration === 'TURN' ? 'จนจบเทิร์น' : 'ถาวร';

        if (step.target === 'SELF_UNIT') {
          if (sourceCard) {
            sourceCard[prop] = (sourceCard[prop] || 0) + amount;
            setLog(`🔥 ${cardTitle} เพิ่มพลังโจมตี +${amount} (${durLabel})!`);
          }
          next();
          return;
        }

        if (step.target === 'ALL_ALLIES') {
          caster.board.forEach(m => {
            if (
              m &&
              (!step.filterTribe || hasCardTribe(m, step.filterTribe)) &&
              (!step.filterName || hasCardName(m, step.filterName))
            ) {
              m[prop] = (m[prop] || 0) + amount;
            }
          });
          setLog(`✨ ${cardTitle} เพิ่มพลังโจมตีให้ยูนิทฝั่งเรา +${amount} (${durLabel})!`);
          next();
          return;
        }

        // กรณีเลือกเป้าหมายฝั่งเรา (ALLY) รองรับ filterTribe และ filterName
        const validAllies = caster.board.filter(m =>
          m !== null &&
          (!step.filterTribe || hasCardTribe(m, step.filterTribe)) &&
          (!step.filterName || hasCardName(m, step.filterName))
        );
        if (validAllies.length === 0) {
          setLog(`ℹ️ ${cardTitle} ไม่มีมอนสเตอร์บนสนามฝั่งเราที่ตรงเงื่อนไขให้เพิ่มพลัง`);
          next();
          return;
        }

        const count = Math.min(step.count || 1, validAllies.length);
        if (isAI) {
          const preferStand = validAllies.find(m => m.state === 'Stand' && m.id !== 'NM05') || validAllies[0];
          if (preferStand) preferStand[prop] = (preferStand[prop] || 0) + amount;
          next();
          return;
        }

        const tribeHint = step.filterTribe ? `เผ่า "${step.filterTribe}" ` : '';
        gameState.pendingAction = {
          type: 'MODULAR_SELECT_TARGET',
          targetZone: 'PLAYER_BOARD',
          filterTribe: step.filterTribe || null,
          filterName: step.filterName || null,
          remainingCount: count,
          promptText: `✨ ${cardTitle} คลิกเลือกยูนิท${tribeHint}ฝั่งเรา (${count} ใบ) เพื่อเพิ่มพลังโจมตี +${amount} (${durLabel})!`,
          onSelectSlot: (slotIdx) => {
            const ally = caster.board[slotIdx];
            if (!ally) {
              setLog('⚠️ กรุณาคลิกช่องที่มียูนิทฝั่งเราอยู่!');
              return false;
            }
            if (step.filterTribe && !hasCardTribe(ally, step.filterTribe)) {
              setLog(`⚠️ กรุณาเลือกยูนิทเผ่า "${step.filterTribe}" เท่านั้น!`);
              return false;
            }
            if (step.filterName && !hasCardName(ally, step.filterName)) {
              setLog(`⚠️ กรุณาเลือกยูนิทที่มีคำว่า "${step.filterName}" เท่านั้น!`);
              return false;
            }
            ally[prop] = (ally[prop] || 0) + amount;
            setLog(`✨ ${cardTitle} เพิ่มพลังโจมตีให้ "${ally.name}" +${amount} (เป็น ${getEffectivePower(ally, caster)})!`);
            return true;
          },
          onAllSelected: () => next()
        };
        setLog(gameState.pendingAction.promptText);
        renderGame();
        return;
      }

      // --- บล็อกที่ 6: ลดพลังโจมตี (REDUCE_POWER) ---
      case 'REDUCE_POWER': {
        const amount = step.amount || 1;
        const prop = step.duration === 'TURN' ? 'tempPowerMod' : 'permPowerMod';
        const durLabel = step.duration === 'TURN' ? 'จนจบเทิร์น' : '';

        if (step.target === 'ALL_ENEMIES') {
          opponent.board.forEach(m => {
            if (m && !m.immuneToEnemyEffectsUntilEndOfTurn) {
              m[prop] = (m[prop] || 0) - amount;
            }
          });
          setLog(`📉 ${cardTitle} ลดพลังโจมตีของยูนิทฝ่ายตรงข้ามทุกใบลง ${amount} หน่วย ${durLabel}!`.trim());
          next();
          return;
        }

        const validEnemies = opponent.board.filter(m => m !== null && !m.immuneToEnemyEffectsUntilEndOfTurn);
        if (validEnemies.length === 0) {
          setLog(`ℹ️ ${cardTitle} ไม่มีมอนสเตอร์ฝ่ายตรงข้ามที่สามารถลดพลังได้`);
          next();
          return;
        }

        const count = Math.min(step.count || 1, validEnemies.length);
        if (isAI) {
          const target = validEnemies.find(m => m.id !== 'NM05') || validEnemies[0];
          if (target) target[prop] = (target[prop] || 0) - amount;
          next();
          return;
        }

        gameState.pendingAction = {
          type: 'MODULAR_SELECT_TARGET',
          targetZone: 'OPPONENT_BOARD',
          remainingCount: count,
          promptText: `📉 ${cardTitle} คลิกเลือกยูนิทฝ่ายตรงข้าม (${count} ใบ) เพื่อลดพลังโจมตี -${amount}!`,
          onSelectSlot: (slotIdx) => {
            const enemy = opponent.board[slotIdx];
            if (!enemy) {
              setLog('⚠️ กรุณาคลิกเลือกช่องที่มียูนิทฝ่ายตรงข้ามอยู่!');
              return false;
            }
            if (enemy.immuneToEnemyEffectsUntilEndOfTurn) {
              setLog(`🛡️ "${enemy.name}" ป้องกันความสามารถการ์ดฝ่ายตรงข้ามในเทิร์นนี้!`);
              return false;
            }
            enemy[prop] = (enemy[prop] || 0) - amount;
            setLog(`📉 ${cardTitle} ลดพลังโจมตีของ "${enemy.name}" ลง ${amount} หน่วย!`);
            return true;
          },
          onAllSelected: () => next()
        };
        setLog(gameState.pendingAction.promptText);
        renderGame();
        return;
      }

      // --- บล็อกที่ 7: เลือกบัฟฝั่งเรา หรือ ดีบัฟฝั่งตรงข้าม (FLEX_POWER เช่น ทหารพรานเหนือ) ---
      case 'FLEX_POWER': {
        const prop = step.duration === 'TURN' ? 'tempPowerMod' : 'permPowerMod';
        if (isAI) {
          const enemy = opponent.board.find(m => m !== null && m.id !== 'NM05' && !m.immuneToEnemyEffectsUntilEndOfTurn);
          if (enemy) enemy[prop] -= (step.minusAmount || 1);
          else if (sourceCard) sourceCard[prop] += (step.plusAmount || 1);
          next();
          return;
        }

        gameState.pendingAction = {
          type: 'MODULAR_SELECT_TARGET',
          targetZone: 'ANY_BOARD',
          remainingCount: 1,
          promptText: `🏹 ${cardTitle} คลิกเลือกยูนิท 1 ใบบนสนาม (คลิกยูนิทเราพลัง +${step.plusAmount || 1} / คลิกยูนิทอีกฝ่ายพลัง -${step.minusAmount || 1})`,
          onSelectAnyBoardSlot: (side, slotIdx) => {
            if (side === 'PLAYER') {
              const ally = caster.board[slotIdx];
              if (!ally) return false;
              ally[prop] += (step.plusAmount || 1);
              setLog(`🏹 ${cardTitle} เพิ่มพลังโจมตีให้ "${ally.name}" ฝั่งเรา +${step.plusAmount || 1}!`);
              return true;
            } else {
              const enemy = opponent.board[slotIdx];
              if (!enemy) return false;
              if (enemy.immuneToEnemyEffectsUntilEndOfTurn) {
                setLog(`🛡️ "${enemy.name}" ไม่ได้รับผลจากความสามารถของการ์ดฝ่ายตรงข้ามในเทิร์นนี้!`);
                return false;
              }
              enemy[prop] -= (step.minusAmount || 1);
              setLog(`🏹 ${cardTitle} ลดพลังโจมตีของ "${enemy.name}" ฝั่งตรงข้ามลง ${step.minusAmount || 1}!`);
              return true;
            }
          },
          onAllSelected: () => next()
        };
        setLog(gameState.pendingAction.promptText);
        renderGame();
        return;
      }

      // --- บล็อกที่ 8: ส่งยูนิตบนสนามกลับขึ้นมือ (BOUNCE_UNIT) ---
      case 'BOUNCE_UNIT': {
        const targetOwner = step.target === 'SELF' ? caster : opponent;
        const validSlots = targetOwner.board
          .map((m, idx) => (m !== null && !m.immuneToEnemyEffectsUntilEndOfTurn ? idx : null))
          .filter(idx => idx !== null);

        if (validSlots.length === 0) {
          setLog(`ℹ️ ${cardTitle} ไม่มียูนิตเป้าหมายที่สามารถส่งกลับขึ้นมือได้`);
          next();
          return;
        }

        const count = Math.min(step.count || 1, validSlots.length);
        if (isAI) {
          const slotIdx = validSlots[0];
          const bounced = targetOwner.board[slotIdx];
          targetOwner.board[slotIdx] = null;
          resetCardStateForZoneChange(bounced);
          targetOwner.hand.push(bounced);
          next();
          return;
        }

        gameState.pendingAction = {
          type: 'MODULAR_SELECT_TARGET',
          targetZone: targetOwner === gameState.player ? 'PLAYER_BOARD' : 'OPPONENT_BOARD',
          remainingCount: count,
          promptText: `🌪️ ${cardTitle} คลิกเลือกยูนิทของ ${targetOwner.name} บนสนามเพื่อส่งกลับขึ้นมือ!`,
          onSelectSlot: (slotIdx) => {
            const targetMonster = targetOwner.board[slotIdx];
            if (!targetMonster) return false;
            if (targetOwner !== caster && targetMonster.immuneToEnemyEffectsUntilEndOfTurn) {
              setLog(`🛡️ "${targetMonster.name}" ป้องกันความสามารถการ์ดฝ่ายตรงข้ามในเทิร์นนี้!`);
              return false;
            }
            targetOwner.board[slotIdx] = null;
            resetCardStateForZoneChange(targetMonster);
            targetOwner.hand.push(targetMonster);
            setLog(`🌪️ ${cardTitle} ส่ง "${targetMonster.name}" กลับขึ้นมือสำเร็จ!`);
            return true;
          },
          onAllSelected: () => next()
        };
        setLog(gameState.pendingAction.promptText);
        renderGame();
        return;
      }

      // --- บล็อกที่ 9: มอบสถานะพิเศษ / Stand ตัวเอง / ทำลายเมื่อจบเทิร์น / กระตุ้นพาสซีฟเพื่อนร่วมทีม ---
      case 'GRANT_STATUS': {
        if (step.target === 'ALL_ALLIES') {
          caster.board.forEach(m => {
            if (m && step.status === 'INDESTRUCTIBLE') m.indestructibleUntilNextTurn = true;
            if (m && step.status === 'BURN_ON_KILL') m.burnLeaderOnKill = true;
          });
          next();
          return;
        }

        const validAllies = caster.board.filter(m => m !== null);
        if (validAllies.length === 0) {
          next();
          return;
        }

        if (isAI) {
          const chosenAlly = validAllies.find(m => m.state === 'Stand' && m.id !== 'NM05') || validAllies[0];
          if (chosenAlly) {
            if (step.status === 'BURN_ON_KILL') chosenAlly.burnLeaderOnKill = true;
            if (step.status === 'INDESTRUCTIBLE') chosenAlly.indestructibleUntilNextTurn = true;
            setLog(`🌟 ${cardTitle} มอบความสามารถพิเศษให้ "${chosenAlly.name}" สำเร็จ!`);
          }
          next();
          return;
        }

        const count = Math.min(step.count || 1, validAllies.length);
        gameState.pendingAction = {
          type: 'MODULAR_SELECT_TARGET',
          targetZone: 'PLAYER_BOARD',
          remainingCount: count,
          promptText: `🌟 ${cardTitle} คลิกเลือกยูนิทฝ่ายเรา 1 ใบบนสนามเพื่อรับความสามารถพิเศษ!`,
          onSelectSlot: (slotIdx) => {
            const ally = caster.board[slotIdx];
            if (!ally) return false;
            if (step.status === 'BURN_ON_KILL') ally.burnLeaderOnKill = true;
            if (step.status === 'INDESTRUCTIBLE') ally.indestructibleUntilNextTurn = true;
            setLog(`🌟 ${cardTitle} มอบความสามารถพิเศษให้ "${ally.name}" สำเร็จ!`);
            return true;
          },
          onAllSelected: () => next()
        };
        setLog(gameState.pendingAction.promptText);
        renderGame();
        return;
      }

      case 'STAND_SELF': {
        if (sourceCard && caster.board.some(m => m && m.uid === sourceCard.uid)) {
          sourceCard.state = 'Stand';
          setLog(`⚡ ${cardTitle} เปลี่ยนสถานะกลับเป็น Stand พร้อมลุยต่อ!`);
        }
        next();
        return;
      }

      case 'MARK_END_TURN_DESTROY': {
        if (sourceCard) sourceCard.destroyAtEndOfTurn = true;
        next();
        return;
      }

      case 'TRIGGER_ALLY_PASSIVE': {
        let count = 0;
        caster.board.forEach(m => {
          if (m && m.id === step.allyId) {
            m.permPowerMod += (step.amount || 1);
            count++;
          }
        });
        if (count > 0) setLog(`🦅 สกิลออโต้ของยูนิตสนับสนุนทำงาน (+${step.amount || 1} Power)!`);
        next();
        return;
      }

      // --- บล็อกที่ 10: นำการ์ดจากนรกขึ้นมือ (RECOVER_FROM_GRAVE) ---
      case 'RECOVER_FROM_GRAVE': {
        const candidates = this.filterCards(caster.graveyard, step).filter(c => !sourceCard || c.uid !== sourceCard.uid);
        if (candidates.length === 0) {
          next();
          return;
        }

        if (isAI || step.autoPickFirst || candidates.length === 1) {
          const pickedTemplate = candidates[0];
          const gIdx = caster.graveyard.findIndex(c => c.uid === pickedTemplate.uid);
          if (gIdx !== -1) {
            const recovered = caster.graveyard.splice(gIdx, 1)[0];
            resetCardStateForZoneChange(recovered);
            caster.hand.push(recovered);
            setLog(`🪦 ${cardTitle} นำ "${recovered.name}" 1 ใบจากกองนรกขึ้นมือของ ${caster.name}!`);
          }
          next();
          return;
        }

        const uniqueMap = new Map();
        candidates.forEach(c => { if (!uniqueMap.has(c.id)) uniqueMap.set(c.id, c); });
        const options = Array.from(uniqueMap.values()).map(targetCard => ({
          label: `นำ "${targetCard.name}" ขึ้นมือ`,
          color: '#16a34a',
          onSelect: () => {
            const gIdx = caster.graveyard.findIndex(c => c.id === targetCard.id);
            if (gIdx !== -1) {
              const recovered = caster.graveyard.splice(gIdx, 1)[0];
              resetCardStateForZoneChange(recovered);
              caster.hand.push(recovered);
              setLog(`✨ ${cardTitle} นำ "${recovered.name}" 1 ใบจากกองนรกขึ้นมือสำเร็จ!`);
            }
            next();
          }
        }));
        showChoiceModal(`🪦 ${cardTitle}`, 'เลือกการ์ด 1 ใบจากกองนรกเพื่อนำกลับขึ้นมือ:', options);
        return;
      }

      // --- บล็อกที่ 11: ค้นหาการ์ดจากกองหรือนรก (SEARCH_DECK_OR_GRAVE) ---
      case 'SEARCH_DECK_OR_GRAVE': {
        const inGrave = this.filterCards(caster.graveyard, step);
        const inDeck = this.filterCards(caster.deck, step);

        const placeCardToDestination = (foundCard, fromZone) => {
          resetCardStateForZoneChange(foundCard);
          if (fromZone === 'deck') caster.deck = shuffleDeck(caster.deck);

          if (step.destination === 'HAND') {
            caster.hand.push(foundCard);
            setLog(`🦅 ${cardTitle} นำ "${foundCard.name}" จาก${fromZone === 'deck' ? 'กองการ์ด' : 'กองนรก'}ขึ้นมือเรียบร้อย!`);
            next();
            return;
          }

          if (step.destination === 'BOARD') {
            foundCard.state = 'Stand';
            if (step.grantImmunity) foundCard.immuneToEnemyEffectsUntilEndOfTurn = true;
            const emptySlot = caster.board.findIndex(m => m === null);
            if (emptySlot !== -1) {
              caster.board[emptySlot] = foundCard;
              setLog(`🌊 ${cardTitle} อัญเชิญ "${foundCard.name}" ลงสนามสำเร็จ!`);
              EffectEngine.triggerCardEffects(foundCard, 'ON_SUMMON', {
                caster, opponent, sourceCard: foundCard, sourceSlot: emptySlot, isAI
              }, next);
            } else {
              gameState.pendingAction = {
                type: 'CALL_FROM_EFFECT_SELECT_SLOT',
                cardToPlace: foundCard,
                onAfterPlace: next
              };
              setLog(`🌊 ${cardTitle} สนามเต็ม 3 ช่อง — คลิกเลือกช่องบนสนามของคุณเพื่อวาง "${foundCard.name}" ทับ!`);
              renderGame();
            }
          }
        };

        if (isAI) {
          if (inGrave.length > 0) {
            const idx = caster.graveyard.findIndex(c => c.uid === inGrave[0].uid);
            placeCardToDestination(caster.graveyard.splice(idx, 1)[0], 'grave');
          } else if (inDeck.length > 0) {
            const idx = caster.deck.findIndex(c => c.uid === inDeck[0].uid);
            placeCardToDestination(caster.deck.splice(idx, 1)[0], 'deck');
          } else {
            next();
          }
          return;
        }

        // ถ้าเป็นการค้นหาเพื่อลงสนามทันที (เช่น โอนามิ เรียก โรเซเลีย) ให้ดึงจากนรกหรือกองให้อัตโนมัติ
        if (step.destination === 'BOARD' && step.cardId) {
          if (inGrave.length > 0) {
            const idx = caster.graveyard.findIndex(c => c.id === step.cardId);
            placeCardToDestination(caster.graveyard.splice(idx, 1)[0], 'grave');
          } else if (inDeck.length > 0) {
            const idx = caster.deck.findIndex(c => c.id === step.cardId);
            placeCardToDestination(caster.deck.splice(idx, 1)[0], 'deck');
          } else {
            next();
          }
          return;
        }

        const options = [];
        if (inDeck.length > 0) {
          options.push({
            label: `ดึง "${inDeck[0].name}" จากกองการ์ด (พร้อมสับกอง)`,
            color: '#0284c7',
            onSelect: () => {
              const idx = caster.deck.findIndex(c => c.id === inDeck[0].id);
              if (idx !== -1) placeCardToDestination(caster.deck.splice(idx, 1)[0], 'deck');
              else next();
            }
          });
        }
        if (inGrave.length > 0) {
          options.push({
            label: `ดึง "${inGrave[0].name}" จากกองนรก`,
            color: '#7c3aed',
            onSelect: () => {
              const idx = caster.graveyard.findIndex(c => c.id === inGrave[0].id);
              if (idx !== -1) placeCardToDestination(caster.graveyard.splice(idx, 1)[0], 'grave');
              else next();
            }
          });
        }
        showChoiceModal(`🔍 ${cardTitle}`, 'เลือกโซนที่ต้องการค้นหาการ์ด:', options);
        return;
      }

      // --- บล็อกที่ 11.5: ค้นหาการ์ดจากกองการ์ดขึ้นมือ (SEARCH_DECK เช่น DNA กลายพันธุ์) ---
      case 'SEARCH_DECK': {
        const maxPick = step.count || 1;
        const pickedNames = [];

        const finishSearch = () => {
          caster.deck = shuffleDeck(caster.deck);
          if (pickedNames.length > 0) {
            setLog(`🧬 ${cardTitle} ค้นหา "${pickedNames.join(', ')}" จากกองการ์ดแสดงแล้วนำขึ้นมือ พร้อมสับกอง!`);
          } else {
            setLog(`🧬 ${cardTitle} ไม่ได้นำการ์ดขึ้นมือ (สับกองการ์ดเรียบร้อย)`);
          }
          next();
        };

        if (isAI) {
          for (let i = 0; i < maxPick; i++) {
            const matches = this.filterCards(caster.deck, step);
            if (matches.length === 0) break;
            const dIdx = caster.deck.findIndex(c => c.uid === matches[0].uid);
            if (dIdx !== -1) {
              const picked = caster.deck.splice(dIdx, 1)[0];
              resetCardStateForZoneChange(picked);
              caster.hand.push(picked);
              pickedNames.push(picked.name);
            }
          }
          finishSearch();
          return;
        }

        const promptNextPick = (pickNumber) => {
          const matches = this.filterCards(caster.deck, step);
          if (matches.length === 0 || pickNumber > maxPick) {
            finishSearch();
            return;
          }

          const uniqueMap = new Map();
          matches.forEach(c => { if (!uniqueMap.has(c.id)) uniqueMap.set(c.id, c); });
          const options = Array.from(uniqueMap.values()).map(targetCard => ({
            label: `นำ "${targetCard.name}" (Power ${targetCard.power}) ขึ้นมือ`,
            color: '#16a34a',
            onSelect: () => {
              const dIdx = caster.deck.findIndex(c => c.id === targetCard.id);
              if (dIdx !== -1) {
                const picked = caster.deck.splice(dIdx, 1)[0];
                resetCardStateForZoneChange(picked);
                caster.hand.push(picked);
                pickedNames.push(picked.name);
              }
              promptNextPick(pickNumber + 1);
            }
          }));

          if (step.upTo && pickNumber > 1) {
            options.push({
              label: `✅ พอแค่นี้ (เลือกแล้ว ${pickedNames.length} ใบ)`,
              color: '#475569',
              onSelect: () => finishSearch()
            });
          }

          showChoiceModal(
            `🧬 ${cardTitle} (ใบที่ ${pickNumber}/${maxPick})`,
            `เลือกการ์ดยูนิท${step.filterTribe ? `เผ่า ${step.filterTribe}` : ''} จากกองการ์ดเพื่อนำขึ้นมือ:`,
            options
          );
        };

        promptNextPick(1);
        return;
      }

      // --- บล็อกที่ 12: ระเบิดปูพรม (CARPET_BOMB_COMPOSITE) ---
      case 'CARPET_BOMB_COMPOSITE': {
        const conscriptCount = caster.board.filter(m => m !== null && m.id === 'NM04').length;
        const rangerCount = caster.board.filter(m => m !== null && m.id === 'NM03').length;
        const royalCount = caster.board.filter(m => m !== null && m.id === 'NM02').length;

        const dynamicSteps = [];
        if (conscriptCount > 0) {
          dynamicSteps.push({ block: 'ADD_POWER', target: 'ALL_ALLIES', filterName: 'เหนือ', amount: conscriptCount, duration: 'TURN' });
        }
        if (royalCount > 0) {
          dynamicSteps.push({ block: 'GRANT_STATUS', target: 'ALL_ALLIES', status: 'INDESTRUCTIBLE' });
        }
        if (rangerCount > 0 && opponent.board.some(m => m !== null)) {
          dynamicSteps.push({ block: 'DESTROY_UNIT', target: 'OPPONENT', count: rangerCount, select: 'CHOOSE' });
        }
        this.runStepQueue(dynamicSteps, context, next);
        return;
      }

      // --- บล็อกที่ 13: แมมมอน บาปความโลภ (MAMMON_SUMMON_CHOICE) ---
      case 'MAMMON_SUMMON_CHOICE': {
        const doOption1 = () => {
          if (opponent.hand.length === 0) {
            gameState.isWaitingForChoice = false;
            next();
            return;
          }
          const discarded = opponent.hand.pop();
          resetCardStateForZoneChange(discarded);
          opponent.graveyard.push(discarded);
          const wasSpell = isSpellCard(discarded);
          if (wasSpell) {
            drawCards(caster, 1);
            setLog(`💰 ${cardTitle} อีกฝั่งเลือกทิ้ง "${discarded.name}" (เป็นเวทมนตร์) -> ${caster.name} จั่วการ์ด 1 ใบ!`);
          } else {
            setLog(`💰 ${cardTitle} อีกฝั่งเลือกทิ้ง "${discarded.name}" จากมือลงนรก!`);
          }
          gameState.isWaitingForChoice = false;
          next();
        };

        const doOption2 = () => {
          if (opponent.deck.length > 0) {
            const milled = opponent.deck.pop();
            resetCardStateForZoneChange(milled);
            opponent.graveyard.push(milled);
            setLog(`💰 ${cardTitle} อีกฝั่งเลือกนำ "${milled.name}" ใบบนสุดของกองลงนรก!`);
          }
          renderGame();
          if (caster.graveyard.length > 0) {
            this.executeSingleStep({ block: 'RECOVER_FROM_GRAVE', count: 1 }, context, () => {
              gameState.isWaitingForChoice = false;
              renderGame();
              next();
            });
          } else {
            gameState.isWaitingForChoice = false;
            renderGame();
            next();
          }
        };

        gameState.isWaitingForChoice = true;

        // ในโหมดเล่นกับเพื่อนออนไลน์ (PVP): ส่งหน้าต่างตัวเลือกไปยังเครื่องของเพื่อนจริง ๆ
        if (pvpState.isMultiplayer && pvpState.conn && pvpState.conn.open) {
          setLog(`💰 [แมมมอน บาปความโลภ] กำลังรอฝ่ายตรงข้ามเลือก 1 จาก 2 ทางเลือก...`);
          sendPvpPacket({
            type: 'REQUEST_PVP_CHOICE',
            choiceId: 'mammon_' + Date.now(),
            title: `💰 ${cardTitle} ลงสนาม!`,
            description: 'ฝ่ายตรงข้ามลงแมมมอน! กรุณาเลือกทำ 1 อย่างจาก 2 อย่างด้านล่าง:',
            options: [
              { label: '1) ทิ้งการ์ดบนมือ 1 ใบ (ถ้าทิ้งเวทมนตร์ อีกฝ่ายได้จั่ว 1 ใบ)', color: '#d97706' },
              { label: '2) นำการ์ดใบบนสุดของกองเราลงนรก (อีกฝ่ายนำการ์ดจากดรอป 1 ใบขึ้นมือ)', color: '#7c3aed' }
            ]
          });
          pvpState.pendingChoiceResolver = (optIdx) => {
            if (optIdx === 0) doOption1();
            else doOption2();
          };
          return;
        }

        // ถ้าอีกฝั่งเป็น AI (ผู้เล่นลงแมมมอน): AI จะคิดและตัดสินใจ พร้อมแจ้งเตือนให้ผู้เล่นเห็นชัดเจน (ผู้เล่นต้องรอ AI เลือกเสร็จก่อน)
        if (!isAI) {
          setLog(`💰 [แมมมอน บาปความโลภ] กำลังรออีกฝ่าย (AI) เลือก 1 จาก 2 ทางเลือก...`);
          if (sourceCard) {
            showCardShowcaseBanner(sourceCard, 'แมมมอน บาปความโลภ', '🤖 ฝ่ายตรงข้ามกำลังตัดสินใจเลือก...', '#eab308', 900);
          }
          setTimeout(() => {
            if (opponent.hand.length > 0 && opponent.hand.some(c => !isSpellCard(c))) {
              const nonSpellIdx = opponent.hand.findIndex(c => !isSpellCard(c));
              const discarded = opponent.hand.splice(nonSpellIdx, 1)[0];
              resetCardStateForZoneChange(discarded);
              opponent.graveyard.push(discarded);
              showCardShowcaseBanner(discarded, 'AI เลือกข้อ 1 (ทิ้งการ์ด)', `💰 AI ทิ้ง "${discarded.name}" ลงนรก!`, '#d97706', 1000);
              setLog(`💰 ${cardTitle} ฝ่ายตรงข้าม (AI) เลือกข้อ 1: ทิ้ง "${discarded.name}" ลงนรก!`);
              renderGame();
              gameState.isWaitingForChoice = false;
              next();
            } else {
              showCardShowcaseBanner(sourceCard, 'AI เลือกข้อ 2 (โม่กอง)', '💰 AI นำใบบนสุดของกองลงนรก -> คุณได้เก็บการ์ดจากนรก 1 ใบ!', '#7c3aed', 1000);
              doOption2();
            }
          }, 850);
          return;
        }

        // ถ้า AI ลงแมมมอนใส่ผู้เล่น: ให้ผู้เล่นเป็นคนเลือกทำ 1 อย่าง (AI จะหยุดรอจนกว่าผู้เล่นจะเลือกเสร็จสิ้น)
        const opts = [];
        if (opponent.hand.length > 0) {
          opts.push({
            label: '1) ทิ้งการ์ดบนมือเรา 1 ใบ (ถ้าทิ้งเวทมนตร์ อีกฝ่ายได้จั่ว 1 ใบ)',
            color: '#d97706',
            onSelect: () => {
              gameState.pendingAction = {
                type: 'MODULAR_SELECT_TARGET',
                targetZone: 'PLAYER_HAND',
                remainingCount: 1,
                promptText: '💰 [แมมมอน] คลิกเลือกการ์ดบนมือของคุณ 1 ใบเพื่อทิ้งลงนรก:',
                onSelectHand: (hIdx) => {
                  const d = opponent.hand.splice(hIdx, 1)[0];
                  resetCardStateForZoneChange(d);
                  opponent.graveyard.push(d);
                  if (isSpellCard(d)) {
                    drawCards(caster, 1);
                    setLog(`💰 [แมมมอน] คุณทิ้งเวทมนตร์ "${d.name}" -> AI จั่วการ์ด 1 ใบ!`);
                  } else {
                    setLog(`💰 [แมมมอน] คุณทิ้ง "${d.name}" ลงนรก!`);
                  }
                },
                onAllSelected: () => {
                  gameState.isWaitingForChoice = false;
                  next();
                }
              };
              setLog(gameState.pendingAction.promptText);
              renderGame();
            }
          });
        }
        opts.push({
          label: '2) นำการ์ดใบบนสุดของกองเราลงนรก (อีกฝ่ายนำการ์ดจากดรอป 1 ใบขึ้นมือ)',
          color: '#7c3aed',
          onSelect: () => doOption2()
        });
        showChoiceModal(`💰 ${cardTitle} ลงสนาม!`, 'กรุณาเลือกทำ 1 อย่างจาก 2 อย่างด้านล่าง (เกมจะรอให้เลือกเสร็จก่อนดำเนินต่อ):', opts);
        return;
      }

      // --- บล็อกที่ 14: ลิเวียธาน บาปความริษยา (LEVIATHAN_MARK_TARGET) ---
      case 'LEVIATHAN_MARK_TARGET': {
        const validSlots = opponent.board
          .map((m, idx) => (m !== null && getEffectivePower(m, opponent) === 2 ? idx : null))
          .filter(idx => idx !== null);

        if (validSlots.length === 0 || !sourceCard) {
          next();
          return;
        }

        if (isAI) {
          const targetEnemy = opponent.board[validSlots[0]];
          if (targetEnemy) {
            targetEnemy.tauntedByLeviathanUid = sourceCard.uid;
            setLog(`🐍 ${cardTitle} เลือก "${targetEnemy.name}" (Power 2) — ถ้าโจมตีต้องเปลี่ยนมาโจมตีลิเวียธานแทน!`);
          }
          next();
          return;
        }

        gameState.pendingAction = {
          type: 'MODULAR_SELECT_TARGET',
          targetZone: 'OPPONENT_BOARD',
          remainingCount: 1,
          promptText: `🐍 ${cardTitle} คลิกเลือกยูนิทฝ่ายตรงข้ามที่มีพลังโจมตี 2 หน่วย 1 ใบ (บังคับเปลี่ยนเป้าโจมตีมาที่ใบนี้)!`,
          onSelectSlot: (slotIdx) => {
            const enemy = opponent.board[slotIdx];
            if (!enemy || getEffectivePower(enemy, opponent) !== 2) {
              setLog('⚠️ กรุณาเลือกยูนิทฝ่ายตรงข้ามที่มีพลังโจมตีเท่ากับ 2 หน่วยเท่านั้น!');
              return false;
            }
            enemy.tauntedByLeviathanUid = sourceCard.uid;
            setLog(`🐍 ${cardTitle} ล็อกเป้า "${enemy.name}" สำเร็จ! หากใบนั้นโจมตีจะถูกเปลี่ยนเป้ามาที่ลิเวียธานทันที!`);
            return true;
          },
          onAllSelected: () => next()
        };
        setLog(gameState.pendingAction.promptText);
        renderGame();
        return;
      }

      // --- บล็อกที่ 15: ซาตาน บาปโทสะ (SATAN_WRATH_EFFECT) ---
      case 'SATAN_WRATH_EFFECT': {
        if (caster.satanOncePerGameUsed || caster.leader.hp !== 1 || caster.hand.length < 5) {
          next();
          return;
        }
        caster.satanOncePerGameUsed = true;

        const executeSatanDestruction = () => {
          // ทำลายการ์ดใบอื่นบนสนามทุกใบ (ทั้งฝั่งเราและฝั่งตรงข้าม ยกเว้นตัวซาตานเอง)
          for (let i = 0; i < 3; i++) {
            if (caster.board[i] && (!sourceCard || caster.board[i].uid !== sourceCard.uid)) {
              destroyBoardMonster(caster, i, false, false);
            }
            if (opponent.board[i]) {
              destroyBoardMonster(opponent, i, false, true);
            }
          }
          // ฝั่งตรงข้ามทิ้งการ์ดบนมือ 3 ใบ
          let oppDiscardedCount = 0;
          for (let k = 0; k < 3 && opponent.hand.length > 0; k++) {
            const d = opponent.hand.pop();
            resetCardStateForZoneChange(d);
            opponent.graveyard.push(d);
            oppDiscardedCount++;
          }
          setLog(`🔥 ${cardTitle} [1 เกม] ทิ้งมือ 5 ใบ -> ทำลายการ์ดใบอื่นบนสนามทั้งหมด และฝ่ายตรงข้ามทิ้งมือ ${oppDiscardedCount} ใบ!`);
          next();
        };

        if (isAI || caster.hand.length === 5) {
          for (let i = 0; i < 5 && caster.hand.length > 0; i++) {
            const d = caster.hand.pop();
            resetCardStateForZoneChange(d);
            caster.graveyard.push(d);
          }
          executeSatanDestruction();
          return;
        }

        gameState.pendingAction = {
          type: 'MODULAR_SELECT_TARGET',
          targetZone: 'PLAYER_HAND',
          remainingCount: 5,
          promptText: `🔥 ${cardTitle} คลิกเลือกการ์ดบนมือของคุณ 5 ใบเพื่อทิ้งลงนรก:`,
          onSelectHand: (hIdx) => {
            const d = caster.hand.splice(hIdx, 1)[0];
            resetCardStateForZoneChange(d);
            caster.graveyard.push(d);
          },
          onAllSelected: () => executeSatanDestruction()
        };
        setLog(gameState.pendingAction.promptText);
        renderGame();
        return;
      }

      // --- บล็อกที่ 16: แอสโมดิวส์ บาปราคะ (ASMODEUS_TOP3_SPELL) ---
      case 'ASMODEUS_TOP3_SPELL': {
        if (caster.deck.length === 0) {
          next();
          return;
        }
        const lookCount = Math.min(3, caster.deck.length);
        const topCards = [];
        for (let i = 0; i < lookCount; i++) {
          topCards.push(caster.deck.pop());
        }

        const finishAsmodeus = (pickedUid) => {
          let pickedCard = null;
          const remaining = [];
          topCards.forEach(c => {
            if (pickedUid && c.uid === pickedUid && !pickedCard) {
              pickedCard = c;
            } else {
              remaining.push(c);
            }
          });

          if (pickedCard) {
            resetCardStateForZoneChange(pickedCard);
            if (pickedCard.id === 'DMS01') {
              caster.darkDimension.push(pickedCard);
              setLog(`💋 ${cardTitle} พบ "สัญญาปีศาจ" — นำเข้าสู่ "มิติมืด" ทันที! (ยูนิทเผ่าปีศาจพลัง +1 ทั้งเกม)`);
            } else {
              caster.hand.push(pickedCard);
              setLog(`💋 ${cardTitle} หยิบเวทมนตร์ "${pickedCard.name}" ขึ้นมือ และนำใบที่เหลือไว้ใต้กอง!`);
            }
          } else {
            setLog(`💋 ${cardTitle} ดูการ์ด ${lookCount} ใบบนสุดแล้วนำไว้ใต้กอง`);
          }

          // นำการ์ดที่เหลือไปไว้ใต้กอง (ต้นอาร์เรย์ deck คือใต้กอง เพราะ pop() คือใบบนสุด)
          remaining.forEach(r => {
            resetCardStateForZoneChange(r);
            caster.deck.unshift(r);
          });
          checkGameOver();
          next();
        };

        const spellCandidates = topCards.filter(c => isSpellCard(c));
        if (spellCandidates.length === 0) {
          finishAsmodeus(null);
          return;
        }

        if (isAI) {
          const contract = spellCandidates.find(c => c.id === 'DMS01') || spellCandidates[0];
          finishAsmodeus(contract.uid);
          return;
        }

        const topNames = topCards.map(c => `${c.name} [${c.type}]`).join(' / ');
        const options = spellCandidates.map(sp => ({
          label: sp.id === 'DMS01'
            ? `🌌 เลือก "${sp.name}" -> นำเข้ามิติมืดทันที!`
            : `✨ หยิบเวทมนตร์ "${sp.name}" ขึ้นมือ`,
          color: sp.id === 'DMS01' ? '#7c3aed' : '#16a34a',
          onSelect: () => finishAsmodeus(sp.uid)
        }));
        options.push({
          label: 'ไม่หยิบ (นำทั้ง 3 ใบไปไว้ใต้กอง)',
          color: '#475569',
          onSelect: () => finishAsmodeus(null)
        });

        showChoiceModal(
          `💋 ${cardTitle} เปิดดู 3 ใบบนสุดของกอง`,
          `การ์ด 3 ใบบนสุดที่พบ: ${topNames}\nเลือกเวทมนตร์ไม่เกิน 1 ใบ (หากเป็น "สัญญาปีศาจ" จะนำเข้ามิติมืดทันที):`,
          options
        );
        return;
      }

      // --- บล็อกที่ 17: เบลเซบับ บาปตะกละ (BEELZEBUB_GLUTTONY_SKILL) ---
      case 'BEELZEBUB_GLUTTONY_SKILL': {
        if (sourceCard) {
          sourceCard.usedSkills = sourceCard.usedSkills || {};
          sourceCard.usedSkills['beelzebub_gluttony'] = true;
        }
        if (caster.graveyard.length < 2 || !sourceCard) {
          next();
          return;
        }

        const applyBeelzebubBuff = (returnedCount) => {
          caster.deck = shuffleDeck(caster.deck);
          sourceCard.beelzebubBuffThisTurn = true;
          setLog(`🍔 ${cardTitle} นำการ์ดจากดรอป ${returnedCount} ใบกลับเข้ากอง -> เทิร์นนี้ถ้าต่อสู้กับยูนิตที่พลังโจมตีเท่ากันจะชนะทันที และไม่ออกจากสนามจนจบเทิร์นเรา!`);
          next();
        };

        if (isAI || caster.graveyard.length === 2) {
          let cnt = 0;
          while (cnt < 2 && caster.graveyard.length > 0) {
            const c = caster.graveyard.pop();
            resetCardStateForZoneChange(c);
            caster.deck.push(c);
            cnt++;
          }
          applyBeelzebubBuff(cnt);
          return;
        }

        let returned = 0;
        const promptReturnNext = () => {
          if (caster.graveyard.length === 0) {
            applyBeelzebubBuff(returned);
            return;
          }
          const uniqueMap = new Map();
          caster.graveyard.forEach(c => { if (!uniqueMap.has(c.id)) uniqueMap.set(c.id, c); });
          const opts = Array.from(uniqueMap.values()).map(cardItem => ({
            label: `นำ "${cardItem.name}" กลับเข้ากอง (${returned + 1})`,
            color: '#0284c7',
            onSelect: () => {
              const gIdx = caster.graveyard.findIndex(g => g.id === cardItem.id);
              if (gIdx !== -1) {
                const c = caster.graveyard.splice(gIdx, 1)[0];
                resetCardStateForZoneChange(c);
                caster.deck.push(c);
                returned++;
              }
              promptReturnNext();
            }
          }));
          if (returned >= 2) {
            opts.push({
              label: `✅ พอแค่นี้ (นำกลับเข้ากองแล้ว ${returned} ใบ -> รับบัฟเบลเซบับ!)`,
              color: '#16a34a',
              onSelect: () => applyBeelzebubBuff(returned)
            });
          }
          showChoiceModal(
            `🍔 ${cardTitle} (เลือกแล้ว ${returned} ใบ — ต้องเลือกอย่างน้อย 2 ใบ)`,
            'เลือกการ์ดจากดรอป (นรก) เพื่อนำกลับเข้ากอง:',
            opts
          );
        };
        promptReturnNext();
        return;
      }

      // --- บล็อกที่ 18: ไอแบงค์บ้าเกม (BANK_SUMMON_TOP2) ---
      case 'BANK_SUMMON_TOP2': {
        if (caster.deck.length === 0) {
          next();
          return;
        }
        const lookCount = Math.min(2, caster.deck.length);
        const top2 = [];
        for (let i = 0; i < lookCount; i++) {
          top2.push(caster.deck.pop());
        }

        const resolveBankChoice = (chosenCard, unchosenCards) => {
          // นำการ์ดที่ไม่ได้เลือกกลับไปไว้บนกอง
          unchosenCards.forEach(u => {
            resetCardStateForZoneChange(u);
            caster.deck.push(u);
          });

          if (!chosenCard) {
            next();
            return;
          }

          resetCardStateForZoneChange(chosenCard);
          // หากใบที่เลือกเป็นเวทมนตร์ (วางบนช่องสนามมอนสเตอร์ไม่ได้) ให้นำขึ้นมือแทนเพื่อไม่ให้การ์ดสูญหาย
          if (chosenCard.type !== 'Monster') {
            caster.hand.push(chosenCard);
            setLog(`🎮 ${cardTitle} เปิด 2 ใบบนสุด เลือก "${chosenCard.name}" (เวทมนตร์ -> นำขึ้นมือ) และวางใบที่เหลือไว้บนกอง!`);
            next();
            return;
          }

          chosenCard.state = 'Stand';

          // ตรวจสอบเอฟเฟกต์พิเศษเมื่อลงสนามด้วยความสามารถของ "ไอแบงค์บ้าเกม":
          // 1) "ไอโอ๊ตบ้าการ์ตูน" (OM01): พลังโจมตี +2 และได้รับออโต้/1 เทิร์น ไม่ถูกทำลายหรือนำลงนรก
          if (chosenCard.id === 'OM01') {
            chosenCard.permPowerMod += 2;
            chosenCard.oatShieldAvailable = true;
            chosenCard.oatShieldUsedThisTurn = false;
          }

          const triggerAfterBankPlace = (placedSlot) => {
            if (chosenCard.id === 'OM01') {
              setLog(`🗡️ [ไอโอ๊ตบ้าการ์ตูน] ลงสนามด้วยสกิลของ "ไอแบงค์บ้าเกม" -> พลังโจมตี +2 (เป็น ${getEffectivePower(chosenCard, caster)}) และได้รับเกราะป้องกันการถูกทำลาย/ลงนรก เทิร์นละ 1 ครั้ง!`);
            }
            // 2) "ไอดีนบ้าHee" (OM07): เมื่อลงสนามด้วยสกิลของ "ไอแบงค์บ้าเกม" นำการ์ดจากนรก 3 ใบกลับเข้ากองแล้วสับกอง
            if (chosenCard.id === 'OM07' && caster.graveyard.length > 0) {
              let retCnt = 0;
              while (retCnt < 3 && caster.graveyard.length > 0) {
                const gCard = caster.graveyard.pop();
                resetCardStateForZoneChange(gCard);
                caster.deck.push(gCard);
                retCnt++;
              }
              caster.deck = shuffleDeck(caster.deck);
              setLog(`🤪 [ไอดีนบ้าHee] ลงสนามด้วยสกิลของ "ไอแบงค์บ้าเกม" -> นำการ์ดจากนรก ${retCnt} ใบกลับเข้ากองและสับกอง!`);
            }

            EffectEngine.triggerCardEffects(chosenCard, 'ON_SUMMON', {
              caster, opponent, sourceCard: chosenCard, sourceSlot: placedSlot, isAI
            }, next);
          };

          const emptySlot = caster.board.findIndex(m => m === null);
          if (emptySlot !== -1) {
            caster.board[emptySlot] = chosenCard;
            setLog(`🎮 ${cardTitle} เปิด 2 ใบบนสุด อัญเชิญ "${chosenCard.name}" ลงช่องที่ ${emptySlot + 1}!`);
            triggerAfterBankPlace(emptySlot);
          } else if (isAI) {
            caster.hand.push(chosenCard);
            setLog(`🎮 ${cardTitle} เปิด 2 ใบบนสุด นำ "${chosenCard.name}" ขึ้นมือ (สนามเต็ม)!`);
            next();
          } else {
            gameState.pendingAction = {
              type: 'CALL_FROM_EFFECT_SELECT_SLOT',
              cardToPlace: chosenCard,
              skipDefaultOnSummon: true,
              onAfterPlace: (placedSlot) => triggerAfterBankPlace(placedSlot !== undefined ? placedSlot : 0)
            };
            setLog(`🎮 ${cardTitle} สนามเต็ม 3 ช่อง — คลิกเลือกช่องบนสนามเพื่อวาง "${chosenCard.name}" ทับ!`);
            renderGame();
          }
        };

        if (isAI) {
          const preferUnit = top2.find(c => c.type === 'Monster' && (c.id === 'OM01' || c.id === 'OM07'))
            || top2.find(c => c.type === 'Monster')
            || top2[0];
          const others = top2.filter(c => c.uid !== preferUnit.uid);
          resolveBankChoice(preferUnit, others);
          return;
        }

        const options = top2.map(cardOpt => ({
          label: cardOpt.type === 'Monster'
            ? `⚔️ เลือกอัญเชิญ "${cardOpt.name}" (Power ${cardOpt.power}) ลงสนาม`
            : `✨ เลือก "${cardOpt.name}" (เวทมนตร์ -> นำขึ้นมือ)`,
          color: (cardOpt.id === 'OM01' || cardOpt.id === 'OM07') ? '#16a34a' : '#0284c7',
          onSelect: () => {
            const others = top2.filter(c => c.uid !== cardOpt.uid);
            resolveBankChoice(cardOpt, others);
          }
        }));

        showChoiceModal(
          `🎮 ${cardTitle} เปิดการ์ด ${lookCount} ใบบนสุดของกอง`,
          'เลือกการ์ด 1 ใบลงสนาม (และนำใบที่ไม่ได้เลือกกลับไปไว้บนกอง):',
          options
        );
        return;
      }

      // --- บล็อกที่ 19: ไอจิตบ้ากาม (JIT_CRAZY_DEBUFF) ---
      case 'JIT_CRAZY_DEBUFF': {
        if (caster.jitCrazyUpgraded) {
          this.executeSingleStep({ block: 'REDUCE_POWER', target: 'ALL_ENEMIES', amount: 1, duration: 'TURN' }, context, next);
        } else {
          this.executeSingleStep({ block: 'REDUCE_POWER', target: 'OPPONENT', count: 1, amount: 1, duration: 'TURN' }, context, next);
        }
        return;
      }

      // --- บล็อกที่ 20: ไออาร์มบ้าการ์ดเกม (ARM_TRIPLE_CHECK) ---
      case 'ARM_TRIPLE_CHECK': {
        const hasOat = caster.board.some(m => m !== null && m.id === 'OM01');
        const hasBank = caster.board.some(m => m !== null && m.id === 'OM02');
        const hasJitCrazy = caster.board.some(m => m !== null && m.id === 'OM03');

        const step3Check = () => {
          if (hasJitCrazy) {
            caster.jitCrazyUpgraded = true;
            opponent.board.forEach(m => {
              if (m && !m.immuneToEnemyEffectsUntilEndOfTurn) {
                m.tempPowerMod = (m.tempPowerMod || 0) - 1;
              }
            });
            setLog(`🃏 ${cardTitle} [เงื่อนไข 3: มีไอจิตบ้ากามบนสนาม] อัปเกรดสกิลไอจิตบ้ากามเป็นลดพลังทุกใบ และลดพลังยูนิทอีกฝ่ายทุกใบ -1 จนจบเทิร์น!`);
          }
          next();
        };

        const step2Check = () => {
          if (hasBank && sourceCard) {
            sourceCard.untilEnemyEndPowerMod = (sourceCard.untilEnemyEndPowerMod || 0) + 2;
            setLog(`🃏 ${cardTitle} [เงื่อนไข 2: มีไอแบงค์บ้าเกมบนสนาม] พลังโจมตีของ "${sourceCard.name}" +2 จนจบเทิร์นอีกฝั่ง!`);
          }
          step3Check();
        };

        if (hasOat && caster.graveyard.length > 0) {
          setLog(`🃏 ${cardTitle} [เงื่อนไข 1: มีไอโอ๊ตบ้าการ์ตูนบนสนาม] เลือกการ์ดจากนรกขึ้นมือไม่เกิน 1 ใบ!`);
          this.executeSingleStep({ block: 'RECOVER_FROM_GRAVE', count: 1 }, context, step2Check);
        } else {
          step2Check();
        }
        return;
      }

      // --- บล็อกที่ 21: ไอเหนือผู้มีคลิปแปลก (NUEA_CLIP_TOP3_SPELL & NUEA_CLIP_FREE_CAST) ---
      case 'NUEA_CLIP_TOP3_SPELL': {
        if (caster.deck.length === 0) {
          next();
          return;
        }
        const lookCount = Math.min(3, caster.deck.length);
        const top3 = [];
        for (let i = 0; i < lookCount; i++) {
          top3.push(caster.deck.pop());
        }

        const finishClipTop3 = (pickedUid) => {
          let picked = null;
          const rest = [];
          top3.forEach(c => {
            if (pickedUid && c.uid === pickedUid && !picked) picked = c;
            else rest.push(c);
          });
          if (picked) {
            resetCardStateForZoneChange(picked);
            caster.hand.push(picked);
            setLog(`📹 ${cardTitle} หยิบการ์ดเวทมนตร์ "${picked.name}" ขึ้นมือ และนำใบที่เหลือไว้ใต้กอง!`);
          } else {
            setLog(`📹 ${cardTitle} ดูการ์ด ${lookCount} ใบบนสุดแล้วนำไปไว้ใต้กอง`);
          }
          rest.forEach(r => {
            resetCardStateForZoneChange(r);
            caster.deck.unshift(r);
          });
          next();
        };

        const spells = top3.filter(c => isSpellCard(c));
        if (spells.length === 0) {
          finishClipTop3(null);
          return;
        }

        if (isAI) {
          finishClipTop3(spells[0].uid);
          return;
        }

        const topNames = top3.map(c => `${c.name} [${c.type}]`).join(' / ');
        const opts = spells.map(sp => ({
          label: `✨ หยิบเวทมนตร์ "${sp.name}" ขึ้นมือ`,
          color: '#16a34a',
          onSelect: () => finishClipTop3(sp.uid)
        }));
        opts.push({
          label: 'ไม่หยิบ (นำทั้งหมดไว้ใต้กอง)',
          color: '#475569',
          onSelect: () => finishClipTop3(null)
        });
        showChoiceModal(`📹 ${cardTitle} ดูการ์ด 3 ใบบนสุดของกอง`, `พบ: ${topNames}\nเลือกหยิบเวทมนตร์ไม่เกิน 1 ใบขึ้นมือ:`, opts);
        return;
      }

      case 'NUEA_CLIP_FREE_CAST': {
        const normalSpells = caster.hand
          .map((c, idx) => ({ card: c, idx }))
          .filter(item => item.card && item.card.type === 'NormalSpell');

        if (normalSpells.length === 0) {
          next();
          return;
        }

        const castWithoutQuota = (handIdx) => {
          const spellCard = caster.hand[handIdx];
          if (!spellCard) { next(); return; }
          const spellEff = (spellCard.effects || []).find(e => e.trigger === 'CAST_SPELL');
          if (!spellEff) { next(); return; }
          const subCtx = {
            caster,
            opponent,
            sourceCard: spellCard,
            spellHandIndex: handIdx,
            excludeHandIndex: handIdx,
            isAI
          };
          const check = this.canActivateEffect(spellEff, subCtx);
          if (!check.ok) {
            if (!isAI) setLog(`⚠️ ร่าย "${spellCard.name}" ไม่ได้: ${check.reason}`);
            next();
            return;
          }
          // ชดเชยโควต้า Normal Spell คืน 1 ครั้งเพื่อไม่เสียการจำกัดการใช้เวทมนตร์
          caster.spellQuota.normalUsed = Math.max(-1, caster.spellQuota.normalUsed - 1);
          setLog(`📹 ${cardTitle} สั่งใช้เวทมนตร์ "${spellCard.name}" จากบนมือโดยไม่เสียโควต้าเวทมนตร์!`);
          this.activateSpecificEffect(spellEff, subCtx, next);
        };

        if (isAI) {
          const validItem = normalSpells.find(item => {
            const spellEff = (item.card.effects || []).find(e => e.trigger === 'CAST_SPELL');
            if (!spellEff) return false;
            return this.canActivateEffect(spellEff, {
              caster,
              opponent,
              sourceCard: item.card,
              spellHandIndex: item.idx,
              excludeHandIndex: item.idx,
              isAI: true
            }).ok;
          });
          if (validItem) {
            castWithoutQuota(validItem.idx);
          } else {
            next();
          }
          return;
        }

        const opts = normalSpells.map(item => ({
          label: `✨ ร่าย "${item.card.name}" ฟรี (ไม่เสียโควต้า Normal Spell)`,
          color: '#0284c7',
          onSelect: () => castWithoutQuota(item.idx)
        }));
        opts.push({
          label: '❌ ยกเลิก',
          color: '#475569',
          onSelect: () => {
            if (sourceCard && sourceCard.usedSkills) {
              delete sourceCard.usedSkills['nuea_clip_free_spell'];
            }
            next();
          }
        });
        showChoiceModal(`📹 ${cardTitle}`, 'เลือกการ์ดเวทมนตร์จากบนมือเพื่อสั่งใช้งานโดยไม่เสียโควต้า:', opts);
        return;
      }

      // --- บล็อกที่ 22: ไอเจย์นักบิด (JAY_DISCARD_AND_DRAW) ---
      case 'JAY_DISCARD_AND_DRAW': {
        if (opponent.hand.length > 0) {
          const d = opponent.hand.pop();
          resetCardStateForZoneChange(d);
          opponent.graveyard.push(d);
          setLog(`🏍️ ${cardTitle} บังคับให้ฝ่ายตรงข้ามทิ้ง "${d.name}" 1 ใบ!`);
        }
        drawCards(caster, 1);
        setLog(`🏍️ ${cardTitle} ${caster.name} จั่วการ์ด 1 ใบ!`);
        next();
        return;
      }

      // --- บล็อกที่ 23: ไอดีนบ้าHee (DEAN_DRAW2_DISCARD1) ---
      case 'DEAN_DRAW2_DISCARD1': {
        drawCards(caster, 2);
        if (caster.hand.length === 0) {
          next();
          return;
        }
        if (isAI) {
          const d = caster.hand.pop();
          resetCardStateForZoneChange(d);
          caster.graveyard.push(d);
          setLog(`🤪 ${cardTitle} จั่วการ์ด 2 ใบ และทิ้ง "${d.name}" 1 ใบ!`);
          next();
          return;
        }
        gameState.pendingAction = {
          type: 'MODULAR_SELECT_TARGET',
          targetZone: 'PLAYER_HAND',
          remainingCount: 1,
          promptText: `🤪 ${cardTitle} จั่วการ์ด 2 ใบแล้ว — คลิกเลือกการ์ดบนมือของคุณ 1 ใบเพื่อทิ้งลงนรก!`,
          onSelectHand: (hIdx) => {
            const d = caster.hand.splice(hIdx, 1)[0];
            resetCardStateForZoneChange(d);
            caster.graveyard.push(d);
            setLog(`🤪 ${cardTitle} ทิ้ง "${d.name}" จากมือลงนรกเรียบร้อย!`);
          },
          onAllSelected: () => next()
        };
        setLog(gameState.pendingAction.promptText);
        renderGame();
        return;
      }

      // --- บล็อกที่ 24: สงครามความบ้า (CRAZY_WAR_SEARCH_PAIR) ---
      case 'CRAZY_WAR_SEARCH_PAIR': {
        const pickedNames = [];
        let tookFromDeck = false;

        ['OM01', 'OM02'].forEach(targetId => {
          const gIdx = caster.graveyard.findIndex(c => c && c.id === targetId);
          if (gIdx !== -1) {
            const c = caster.graveyard.splice(gIdx, 1)[0];
            resetCardStateForZoneChange(c);
            caster.hand.push(c);
            pickedNames.push(`${c.name} (จากนรก)`);
          } else {
            const dIdx = caster.deck.findIndex(c => c && c.id === targetId);
            if (dIdx !== -1) {
              const c = caster.deck.splice(dIdx, 1)[0];
              resetCardStateForZoneChange(c);
              caster.hand.push(c);
              pickedNames.push(`${c.name} (จากกอง)`);
              tookFromDeck = true;
            }
          }
        });

        if (tookFromDeck) {
          caster.deck = shuffleDeck(caster.deck);
        }
        if (pickedNames.length > 0) {
          setLog(`⚔️ ${cardTitle} นำ ${pickedNames.join(' และ ')} ขึ้นมือสำเร็จ!`);
        } else {
          setLog(`ℹ️ ${cardTitle} ไม่พบ "ไอโอ๊ตบ้าการ์ตูน" หรือ "ไอแบงค์บ้าเกม" ในกองและนรก`);
        }
        next();
        return;
      }

      default:
        next();
    }
  }
};


/* ============================================================================
   หมวดที่ 5: ความสามารถของ Leader, Monster และการร่าย Spell (เชื่อมเข้ากับ EffectEngine)
   ============================================================================ */
function activateLeaderSkillPlayer() {
  const player = gameState.player;
  if (gameState.gameOver || gameState.activeTurn !== 'player') return;
  if (gameState.pendingAction) {
    setLog('⚠️ กรุณาเลือกเป้าหมายของเอฟเฟกต์ที่ค้างอยู่ให้เสร็จก่อน!');
    return;
  }

  const leaderEffects = (player.leader.effects || []).filter(e => e.trigger === 'ACTIVATE_LEADER');
  if (leaderEffects.length === 0) {
    setLog(`ℹ️ ลีดเดอร์ "${player.leader.name}" เป็นความสามารถต่อเนื่อง/ออโต้ (คลิกขวาเพื่อดูรายละเอียดการ์ด)`);
    return;
  }

  if (gameState.phase !== 'Main Phase') {
    setLog(`⚠️ สกิลลีดเดอร์ ${player.leader.name} กดใช้ได้ใน Main Phase เท่านั้น!`);
    return;
  }

  const eff = leaderEffects[0];
  const ctx = { caster: player, opponent: gameState.ai, sourceCard: player.leader, isAI: false };
  const check = EffectEngine.canActivateEffect(eff, ctx);
  if (!check.ok) {
    setLog(`❌ ${check.reason}`);
    return;
  }

  askCardUseConfirmation(player.leader, 'ใช้สกิลลีดเดอร์', () => {
    gameState.selectedHandIndex = null;
    gameState.selectedAttackerSlot = null;
    EffectEngine.activateSpecificEffect(eff, ctx);
  });
}

// สั่งใช้งานความสามารถของ Monster บนสนาม (อ่านจากบล็อก ACTIVATE_MAIN ของการ์ดโดยตรง)
function activateMonsterOnBoardPlayer(slotIndex) {
  const player = gameState.player;
  const monster = player.board[slotIndex];
  if (!monster) return;

  const mainEffects = (monster.effects || []).filter(e => e.trigger === 'ACTIVATE_MAIN');
  if (mainEffects.length === 0) {
    setLog(`ℹ️ "${monster.name}" ไม่มีสกิลกดใช้บนสนาม (คลิกขวาเพื่อดูรายละเอียด หรือเข้าสู่ Battle Phase เพื่อสั่งโจมตี)`);
    return;
  }

  const ctx = { caster: player, opponent: gameState.ai, sourceCard: monster, sourceSlot: slotIndex, isAI: false };

  // กรณีมี 1 สกิลกดใช้บนสนาม
  if (mainEffects.length === 1) {
    const eff = mainEffects[0];
    const check = EffectEngine.canActivateEffect(eff, ctx);
    if (!check.ok) {
      setLog(`⚠️ ${check.reason}`);
      return;
    }
    askCardUseConfirmation(monster, eff.label || `ใช้ความสามารถของ "${monster.name}"`, () => {
      EffectEngine.activateSpecificEffect(eff, ctx);
    });
    return;
  }

  // กรณีมีหลายสกิลกดใช้ในใบเดียว (เช่น โทโดโรจิต M02)
  const options = mainEffects.map((eff, idx) => {
    const check = EffectEngine.canActivateEffect(eff, ctx);
    const used = monster.usedSkills && monster.usedSkills[eff.id];
    const statusSuffix = used ? ' (ใช้แล้ว)' : (!check.ok ? ' (เงื่อนไขไม่ครบ)' : '');
    return {
      label: `${eff.label || `สกิลที่ ${idx + 1}`}${statusSuffix}`,
      disabled: !check.ok,
      color: idx === 0 ? '#0284c7' : '#16a34a',
      onSelect: () => EffectEngine.activateSpecificEffect(eff, ctx)
    };
  });

  options.push({ label: '🔍 ดูรายละเอียดการ์ดใบนี้', color: '#6366f1', onSelect: () => openCardDetailModal(monster, player) });
  options.push({ label: '❌ ยกเลิก', color: '#475569', onSelect: () => renderGame() });

  showChoiceModal(`⚡ เลือกใช้ความสามารถของ ${monster.name}`, 'แต่ละความสามารถสั่งใช้ได้ตามเงื่อนไขที่ระบุ:', options);
}

// สั่งใช้งานการ์ดเวทมนตร์จากมือผ่าน EffectEngine
function initiatePlayerSpell(handIndex) {
  if (window.BOF_AUDIO) window.BOF_AUDIO.playSpell();
  const player = gameState.player;
  const spell = player.hand[handIndex];
  if (!spell) return;

  if (spell.type === 'LandSpell') {
    setLog(`🏰 "${spell.name}" เป็นแลนด์สเปล (LandSpell) — จะแสดงผลความสามารถก็ต่อเมื่ออยู่ใน "มิติมืด" เท่านั้น (ไม่สามารถกดร่ายจากมือแบบปกติได้)!`);
    return;
  }

  if (spell.type === 'NormalSpell' && player.spellQuota.normalUsed >= 1) {
    setLog('❌ คุณใช้โควต้า Normal Spell (1 ใบ/เทิร์น) ไปแล้วในเทิร์นนี้!');
    return;
  }
  if (spell.type === 'ReactionSpell' && player.spellQuota.reactionUsed >= 1) {
    setLog('❌ คุณใช้โควต้า Reaction Spell (1 ใบ/เทิร์น) ไปแล้วในเทิร์นนี้!');
    return;
  }

  if (spell.id === 'DS02') {
    setLog('ℹ️ "พวกเราจะช่วยเอง" เป็นการ์ดป้องกันเมื่ออีกฝ่ายโจมตี (ระบบจะเด้งถามอัตโนมัติเมื่ออีกฝ่ายโจมตีและคุณมียูนิตในนรกครบ 5 ใบ)');
    return;
  }
  if (spell.id === 'DNS03') {
    setLog('ℹ️ "เมเทโอ" เป็นเวทรีแอคเมื่ออีกฝ่ายโจมตี (ระบบจะเด้งถามอัตโนมัติเมื่ออีกฝ่ายโจมตีและบนสนามเรามียูนิทเผ่าไดโน 2 ใบขึ้นไป)');
    return;
  }
  if (spell.id === 'DMS02') {
    setLog('ℹ️ "คำเตือนต้องห้าม" เป็นเวทรีแอคเมื่ออีกฝ่ายโจมตีและเรามียูนิทเผ่า "ปีศาจ" บนสนาม (ระบบจะเด้งถามอัตโนมัติเมื่อถูกโจมตี)');
    return;
  }
  if (spell.id === 'OS03') {
    setLog('ℹ️ "เร็วขึ้นอีก!!!!!!" เป็นเวทรีแอคเมื่อ "ไอแบงค์บ้าเกม" โจมตี (ระบบจะเด้งถามอัตโนมัติเมื่อคุณสั่งไอแบงค์บ้าเกมโจมตี)');
    return;
  }

  const spellEffect = (spell.effects || []).find(e => e.trigger === 'CAST_SPELL');
  if (!spellEffect) return;

  const ctx = {
    caster: player,
    opponent: gameState.ai,
    sourceCard: spell,
    spellHandIndex: handIndex,
    excludeHandIndex: handIndex,
    isAI: false
  };

  const check = EffectEngine.canActivateEffect(spellEffect, ctx);
  if (!check.ok) {
    setLog(`⚠️ ใช้ "${spell.name}" ไม่ได้: ${check.reason}`);
    return;
  }

  askCardUseConfirmation(spell, `ใช้งานการ์ดเวทมนตร์ "${spell.name}"`, () => {
    gameState.selectedHandIndex = null;
    EffectEngine.activateSpecificEffect(spellEffect, ctx);
  });
}

// ==================== ระบบอัญเชิญไฮบริด (เด็คไดโน: อินโดมินัสเร็กซ์ / อินโดแรปเตอร์) ====================
// ค้นหาการ์ดวัตถุดิบที่มีชื่อตรงกับคำที่ระบุ (เช่น "ทีเร็กซ์" จะตรงกับ "ทีเร็กซ์ — ราชันนักล่า") จาก นรก, มือ หรือ สนาม
function getHybridMaterialCandidates(contestant, nameKeyword, excludeUids = new Set()) {
  const results = [];
  if (!contestant || !nameKeyword) return results;

  // เรียงลำดับความสะดวก: นรก -> มือ -> สนาม
  contestant.graveyard.forEach(c => {
    if (c && !excludeUids.has(c.uid) && hasCardName(c, nameKeyword)) {
      results.push({ card: c, zone: 'grave', zoneLabel: 'จากนรก' });
    }
  });
  contestant.hand.forEach(c => {
    if (c && !excludeUids.has(c.uid) && hasCardName(c, nameKeyword)) {
      results.push({ card: c, zone: 'hand', zoneLabel: 'จากบนมือ' });
    }
  });
  contestant.board.forEach((c, slotIdx) => {
    if (c && !excludeUids.has(c.uid) && hasCardName(c, nameKeyword)) {
      results.push({ card: c, zone: 'board', slotIdx, zoneLabel: `จากสนาม (ช่อง ${slotIdx + 1})` });
    }
  });
  return results;
}

function canSummonHybridCard(contestant, hybridCard) {
  if (!contestant || !hybridCard || !Array.isArray(hybridCard.hybridMaterials)) return false;
  const [matA, matB] = hybridCard.hybridMaterials;
  const exclude = new Set([hybridCard.uid]);
  const listA = getHybridMaterialCandidates(contestant, matA, exclude);
  for (const itemA of listA) {
    const nextExclude = new Set([hybridCard.uid, itemA.card.uid]);
    const listB = getHybridMaterialCandidates(contestant, matB, nextExclude);
    if (listB.length > 0) return true;
  }
  return false;
}

function removeCardToDarkDimension(contestant, item) {
  if (!contestant || !item || !item.card) return null;
  const targetUid = item.card.uid;
  let removed = null;

  if (item.zone === 'grave') {
    const idx = contestant.graveyard.findIndex(c => c && c.uid === targetUid);
    if (idx !== -1) removed = contestant.graveyard.splice(idx, 1)[0];
  } else if (item.zone === 'hand') {
    const idx = contestant.hand.findIndex(c => c && c.uid === targetUid);
    if (idx !== -1) removed = contestant.hand.splice(idx, 1)[0];
  } else if (item.zone === 'board') {
    const sIdx = contestant.board.findIndex(c => c && c.uid === targetUid);
    if (sIdx !== -1) {
      removed = contestant.board[sIdx];
      contestant.board[sIdx] = null;
    }
  }

  if (removed) {
    resetCardStateForZoneChange(removed);
    contestant.darkDimension.push(removed);
  }
  return removed;
}

function handleDinoHybridHandMenu(handIndex) {
  const player = gameState.player;
  const card = player.hand[handIndex];
  if (!card || !Array.isArray(card.hybridMaterials)) return;

  const [matA, matB] = card.hybridMaterials;
  if (!canSummonHybridCard(player, card)) {
    setLog(`🚫 ไม่สามารถอัญเชิญ "${card.name}" ได้! ต้องมีการ์ดที่มีชื่อ "${matA}" และ "${matB}" อยู่ใน มือ, สนาม หรือ นรก เพื่อส่งไปมิติมืด!`);
    return;
  }

  const excludeA = new Set([card.uid]);
  const candidatesA = getHybridMaterialCandidates(player, matA, excludeA);

  // กรองให้เหลือตัวเลือกตามโซนที่ไม่ซ้ำกันเพื่อความกระชับ
  const uniqueA = [];
  const seenKeyA = new Set();
  candidatesA.forEach(item => {
    const nextExclude = new Set([card.uid, item.card.uid]);
    if (getHybridMaterialCandidates(player, matB, nextExclude).length === 0) return;
    const key = `${item.zone}_${item.card.id}_${item.slotIdx !== undefined ? item.slotIdx : ''}`;
    if (!seenKeyA.has(key)) {
      seenKeyA.add(key);
      uniqueA.push(item);
    }
  });

  const optionsA = uniqueA.map(itemA => ({
    label: `🧬 ส่ง "${itemA.card.name}" [${itemA.zoneLabel}] ไปมิติมืด`,
    color: itemA.zone === 'grave' ? '#7c3aed' : itemA.zone === 'hand' ? '#0284c7' : '#d97706',
    onSelect: () => {
      const excludeB = new Set([card.uid, itemA.card.uid]);
      const candidatesB = getHybridMaterialCandidates(player, matB, excludeB);
      const uniqueB = [];
      const seenKeyB = new Set();
      candidatesB.forEach(itemB => {
        const key = `${itemB.zone}_${itemB.card.id}_${itemB.slotIdx !== undefined ? itemB.slotIdx : ''}`;
        if (!seenKeyB.has(key)) {
          seenKeyB.add(key);
          uniqueB.push(itemB);
        }
      });

      const optionsB = uniqueB.map(itemB => ({
        label: `🧬 ส่ง "${itemB.card.name}" [${itemB.zoneLabel}] ไปมิติมืด -> อัญเชิญ "${card.name}"!`,
        color: '#16a34a',
        onSelect: () => executeHybridSummon(player, card.uid, itemA, itemB)
      }));
      optionsB.push({ label: '❌ ยกเลิก', color: '#475569', onSelect: () => renderGame() });

      showChoiceModal(
        `🦖 อัญเชิญไฮบริด: ${card.name} (ขั้นที่ 2/2)`,
        `เลือกการ์ดที่มีชื่อ "${matB}" จาก มือ, สนาม หรือ นรก เพื่อส่งไปมิติมืด:`,
        optionsB
      );
    }
  }));

  optionsA.push({ label: '❌ ยกเลิก', color: '#475569', onSelect: () => renderGame() });

  showChoiceModal(
    `🦖 อัญเชิญไฮบริด: ${card.name} (ขั้นที่ 1/2)`,
    `เลือกการ์ดที่มีชื่อ "${matA}" จาก มือ, สนาม หรือ นรก เพื่อส่งไปมิติมืด:\n\n📜 ความสามารถ:\n${getCardDescription(card)}`,
    optionsA
  );
}

function executeHybridSummon(contestant, hybridCardUid, matItemA, matItemB) {
  removeCardToDarkDimension(contestant, matItemA);
  removeCardToDarkDimension(contestant, matItemB);

  const hIdx = contestant.hand.findIndex(c => c && c.uid === hybridCardUid);
  if (hIdx === -1) {
    renderGame();
    return;
  }

  const hybridCard = contestant.hand.splice(hIdx, 1)[0];
  resetCardStateForZoneChange(hybridCard);
  hybridCard.state = 'Stand';

  const emptySlot = contestant.board.findIndex(m => m === null);
  if (emptySlot !== -1) {
    contestant.board[emptySlot] = hybridCard;
    setLog(`🦖 [ไฮบริด] ส่ง "${matItemA.card.name}" และ "${matItemB.card.name}" ไปมิติมืด -> อัญเชิญ "${hybridCard.name}" ลงช่องที่ ${emptySlot + 1} สำเร็จ!`);
    renderGame();
  } else {
    gameState.pendingAction = {
      type: 'CALL_FROM_EFFECT_SELECT_SLOT',
      cardToPlace: hybridCard,
      onAfterPlace: null
    };
    setLog(`🦖 [ไฮบริด] สนามเต็ม 3 ช่อง — คลิกเลือกช่องบนสนามของคุณเพื่อวาง "${hybridCard.name}" ทับ!`);
    renderGame();
  }
}

// ฟังก์ชันช่วยเหลือสำหรับ AI และความสามารถเฉพาะของเด็คเหนือ/วันสิ้นโลก
function triggerEndeSkill(contestant, slotIndex) {
  const ende = contestant.board[slotIndex];
  if (!ende) return;
  const eff = (ende.effects || []).find(e => e.id === 'endeBoost');
  const other = contestant === gameState.player ? gameState.ai : gameState.player;
  if (eff) {
    EffectEngine.activateSpecificEffect(eff, {
      caster: contestant,
      opponent: other,
      sourceCard: ende,
      sourceSlot: slotIndex,
      isAI: contestant !== gameState.player
    });
  }
}

function executeHawksSearch(contestant, slotIndex, sourceZone) {
  const hawks = contestant.board[slotIndex];
  if (!hawks) return;
  const zoneArr = sourceZone === 'deck' ? contestant.deck : contestant.graveyard;
  const idx = zoneArr.findIndex(c => c.id === 'M05');
  if (idx === -1) return;
  hawks.permPowerMod -= 2;
  hawks.usedSkills.hawksSearch = true;
  const found = zoneArr.splice(idx, 1)[0];
  resetCardStateForZoneChange(found);
  contestant.hand.push(found);
  if (sourceZone === 'deck') contestant.deck = shuffleDeck(contestant.deck);
  setLog(`🦅 [${contestant.name}] "ฮออ์กส์ฟีม" ลดพลัง -2 นำ "เอ็นเดจิต" ขึ้นมือเรียบร้อย!`);
  renderGame();
}

function triggerKhunNueaStartTurn(contestant, onComplete = null) {
  if (!contestant.leader || contestant.leader.id !== 'L02') {
    if (onComplete) onComplete();
    return;
  }
  const inGraveIdx = contestant.graveyard.findIndex(c => c.id === 'NM01');
  const inDeckIdx = contestant.deck.findIndex(c => c.id === 'NM01');
  if (inGraveIdx === -1 && inDeckIdx === -1) {
    if (onComplete) onComplete();
    return;
  }

  if (contestant !== gameState.player) {
    if (inGraveIdx !== -1) {
      const card = contestant.graveyard.splice(inGraveIdx, 1)[0];
      resetCardStateForZoneChange(card);
      contestant.hand.push(card);
      setLog('👑 [AI ขุนเหนือ] นำ "ไพร่ชาวนาเหนือ" 1 ใบจากนรกขึ้นมือ!');
    } else if (inDeckIdx !== -1) {
      const card = contestant.deck.splice(inDeckIdx, 1)[0];
      resetCardStateForZoneChange(card);
      contestant.hand.push(card);
      contestant.deck = shuffleDeck(contestant.deck);
      setLog('👑 [AI ขุนเหนือ] นำ "ไพร่ชาวนาเหนือ" 1 ใบจากกองขึ้นมือ!');
    }
    renderGame();
    if (onComplete) onComplete();
    return;
  }

  showChoiceModal(
    '👑 ออโต้เมื่อเข้าเทิร์น: ขุนเหนือ',
    'คุณสามารถนำ "ไพร่ชาวนาเหนือ" จากกองการ์ดหรือนรกไม่เกิน 1 ใบขึ้นมือได้',
    [
      {
        label: `นำ "ไพร่ชาวนาเหนือ" จากกองนรกขึ้นมือ ${inGraveIdx === -1 ? '(ไม่มีในนรก)' : ''}`,
        disabled: inGraveIdx === -1,
        color: '#7c3aed',
        onSelect: () => {
          const card = contestant.graveyard.splice(inGraveIdx, 1)[0];
          resetCardStateForZoneChange(card);
          contestant.hand.push(card);
          setLog('👑 [ขุนเหนือ] นำ "ไพร่ชาวนาเหนือ" 1 ใบจากกองนรกขึ้นมือสำเร็จ!');
          renderGame();
          if (onComplete) onComplete();
        }
      },
      {
        label: `นำ "ไพร่ชาวนาเหนือ" จากกองการ์ดขึ้นมือ ${inDeckIdx === -1 ? '(ไม่มีในกอง)' : ''}`,
        disabled: inDeckIdx === -1,
        color: '#0284c7',
        onSelect: () => {
          const card = contestant.deck.splice(inDeckIdx, 1)[0];
          resetCardStateForZoneChange(card);
          contestant.hand.push(card);
          contestant.deck = shuffleDeck(contestant.deck);
          setLog('👑 [ขุนเหนือ] นำ "ไพร่ชาวนาเหนือ" 1 ใบจากกองการ์ดขึ้นมือสำเร็จ!');
          renderGame();
          if (onComplete) onComplete();
        }
      },
      {
        label: 'ไม่นำขึ้นมือ (ข้าม)',
        color: '#475569',
        onSelect: () => {
          renderGame();
          if (onComplete) onComplete();
        }
      }
    ]
  );
}

function triggerDoomsdayStartTurnQueue(contestant, onDoneCallback = null) {
  const finishQueue = () => {
    renderGame();
    if (onDoneCallback) onDoneCallback();
  };

  const checkDebirunStep = () => {
    const hasDebirun = contestant.board.some(m => m !== null && m.id === 'DM04');
    if (!hasDebirun) {
      finishQueue();
      return;
    }
    triggerDebirunStartTurn(contestant, finishQueue);
  };

  if (contestant.leader && contestant.leader.id === 'L03') {
    const validTargets = contestant.graveyard.filter(c =>
      c.type === 'Monster' && !c.cannotNormalSummon && !c.isSpy && (c.basePower !== undefined ? c.basePower : c.power) <= 2
    );

    if (validTargets.length > 0) {
      if (contestant !== gameState.player) {
        const emptySlot = contestant.board.findIndex(m => m === null);
        if (emptySlot !== -1) {
          const gIdx = contestant.graveyard.findIndex(c => c.uid === validTargets[0].uid);
          if (gIdx !== -1) {
            const called = contestant.graveyard.splice(gIdx, 1)[0];
            resetCardStateForZoneChange(called);
            contestant.board[emptySlot] = called;
            EffectEngine.triggerCardEffects(called, 'ON_SUMMON', {
              caster: contestant, opponent: gameState.player, sourceCard: called, sourceSlot: emptySlot, isAI: true
            });
            setLog(`⏳ [AI วันสิ้นโลก] คอล "${called.name}" จากนรกลงสนาม!`);
          }
        }
        checkDebirunStep();
        return;
      }

      const seenIds = new Set();
      const options = [];
      validTargets.forEach(c => {
        if (!seenIds.has(c.id)) {
          seenIds.add(c.id);
          options.push({
            label: `คอล "${c.name}" (Power ${c.power}) จากนรกลงสนาม`,
            color: '#7c3aed',
            onSelect: () => {
              const gIdx = contestant.graveyard.findIndex(g => g.id === c.id);
              if (gIdx !== -1) {
                const called = contestant.graveyard.splice(gIdx, 1)[0];
                resetCardStateForZoneChange(called);

                const emptySlot = contestant.board.findIndex(m => m === null);
                if (emptySlot !== -1) {
                  contestant.board[emptySlot] = called;
                  setLog(`⏳ [วันสิ้นโลก] คอล "${called.name}" จากนรกลงช่องที่ ${emptySlot + 1}!`);
                  EffectEngine.triggerCardEffects(called, 'ON_SUMMON', {
                    caster: contestant, opponent: gameState.ai, sourceCard: called, sourceSlot: emptySlot, isAI: false
                  }, checkDebirunStep);
                } else {
                  gameState.pendingAction = {
                    type: 'CALL_FROM_EFFECT_SELECT_SLOT',
                    cardToPlace: called,
                    onAfterPlace: checkDebirunStep
                  };
                  setLog(`⏳ [วันสิ้นโลก] สนามเต็ม 3 ช่อง — คลิกเลือกช่องบนสนามของคุณเพื่อวาง "${called.name}" ทับ`);
                  renderGame();
                }
              } else {
                checkDebirunStep();
              }
            }
          });
        }
      });
      options.push({ label: 'ไม่คอล (ข้าม)', color: '#475569', onSelect: () => checkDebirunStep() });
      showChoiceModal('⏳ ออโต้เมื่อเข้าเทิร์น: วันสิ้นโลก', 'เลือกคอลยูนิตที่มีพลังโจมตีไม่เกิน 2 จากกองนรก 1 ใบลงสนาม:', options);
      return;
    }
  }

  checkDebirunStep();
}

function triggerDebirunStartTurn(contestant, onComplete) {
  const spellsInGrave = contestant.graveyard.filter(c => c.type === 'NormalSpell' || c.type === 'ReactionSpell');
  const spellsInDeck = contestant.deck.filter(c => c.type === 'NormalSpell' || c.type === 'ReactionSpell');

  const reviveUnitFallback = (reasonText) => {
    const unitsInGrave = contestant.graveyard.filter(c => c.type === 'Monster' && !c.cannotNormalSummon && !c.isSpy);
    if (unitsInGrave.length === 0) {
      setLog(`😈 [เดบิรุน] ${reasonText} (ไม่มีมอนสเตอร์ในนรกให้ชุบ)`);
      if (onComplete) onComplete();
      return;
    }

    if (contestant !== gameState.player) {
      const emptySlot = contestant.board.findIndex(m => m === null);
      if (emptySlot !== -1) {
        const uIdx = contestant.graveyard.findIndex(c => c.uid === unitsInGrave[0].uid);
        const revived = contestant.graveyard.splice(uIdx, 1)[0];
        resetCardStateForZoneChange(revived);
        contestant.board[emptySlot] = revived;
        setLog(`😈 [AI เดบิรุน] ชุบ "${revived.name}" จากนรกลงสนาม!`);
        EffectEngine.triggerCardEffects(revived, 'ON_SUMMON', {
          caster: contestant, opponent: gameState.player, sourceCard: revived, sourceSlot: emptySlot, isAI: true
        }, onComplete);
        return;
      }
      if (onComplete) onComplete();
      return;
    }

    const opts = [];
    const seen = new Set();
    unitsInGrave.forEach(u => {
      if (!seen.has(u.id)) {
        seen.add(u.id);
        opts.push({
          label: `ชุบยูนิต "${u.name}" (Power ${u.power}) ลงสนาม`,
          color: '#16a34a',
          onSelect: () => {
            const idx = contestant.graveyard.findIndex(g => g.id === u.id);
            if (idx !== -1) {
              const card = contestant.graveyard.splice(idx, 1)[0];
              resetCardStateForZoneChange(card);
              const emptySlot = contestant.board.findIndex(m => m === null);
              if (emptySlot !== -1) {
                contestant.board[emptySlot] = card;
                setLog(`😈 [เดบิรุน] ชุบยูนิต "${card.name}" จากนรกลงสนามสำเร็จ!`);
                EffectEngine.triggerCardEffects(card, 'ON_SUMMON', {
                  caster: contestant, opponent: gameState.ai, sourceCard: card, sourceSlot: emptySlot, isAI: false
                }, onComplete);
              } else {
                gameState.pendingAction = {
                  type: 'CALL_FROM_EFFECT_SELECT_SLOT',
                  cardToPlace: card,
                  onAfterPlace: onComplete
                };
                setLog(`😈 [เดบิรุน] สนามเต็ม 3 ช่อง — คลิกเลือกช่องบนสนามของคุณเพื่อวาง "${card.name}" ทับ!`);
                renderGame();
              }
            } else if (onComplete) {
              onComplete();
            }
          }
        });
      }
    });
    showChoiceModal('😈 สกิลของ เดบิรุน (ชุบยูนิตจากนรก)', `${reasonText} เลือกยูนิต 1 ใบจากนรกเพื่อชุบลงสนาม:`, opts);
  };

  if (spellsInGrave.length === 0 && spellsInDeck.length === 0) {
    reviveUnitFallback('ไม่พบการ์ดเวทในกองหรือนรก');
    return;
  }

  const canForceCastSpell = (spellCard) => spellCard.id === 'DS01';

  if (contestant !== gameState.player) {
    const ds01GraveIdx = contestant.graveyard.findIndex(c => c.id === 'DS01');
    const ds01DeckIdx = contestant.deck.findIndex(c => c.id === 'DS01');
    if (ds01GraveIdx !== -1 || ds01DeckIdx !== -1) {
      const spell = ds01GraveIdx !== -1
        ? contestant.graveyard.splice(ds01GraveIdx, 1)[0]
        : contestant.deck.splice(ds01DeckIdx, 1)[0];
      if (ds01DeckIdx !== -1) contestant.deck = shuffleDeck(contestant.deck);
      const drawCount = contestant.graveyard.length >= 5 ? 2 : 1;
      drawCards(contestant, drawCount);
      const ally = contestant.board.find(m => m !== null);
      if (ally) ally.tempPowerMod += 1;
      contestant.graveyard.push(spell);
      setLog(`😈 [AI เดบิรุน] ค้นหา "เบิกเนตรแห่งแสง" และบังคับใช้งานทันที!`);
      if (onComplete) onComplete();
    } else {
      reviveUnitFallback('การ์ดเวทที่ค้นหาไม่สามารถบังคับใช้งานในจังหวะนี้ได้');
    }
    return;
  }

  const options = [];
  const allSpells = [
    ...spellsInGrave.map(s => ({ card: s, zone: 'grave', zoneLabel: 'จากนรก' })),
    ...spellsInDeck.map(s => ({ card: s, zone: 'deck', zoneLabel: 'จากกองการ์ด' }))
  ];
  const seenKeys = new Set();

  allSpells.forEach(item => {
    const key = `${item.zone}_${item.card.id}`;
    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      options.push({
        label: `[${item.zoneLabel}] ค้นหา "${item.card.name}" ขึ้นมือแล้วบังคับใช้งาน`,
        color: '#0284c7',
        onSelect: () => {
          const sourceArr = item.zone === 'grave' ? contestant.graveyard : contestant.deck;
          const idx = sourceArr.findIndex(c => c.id === item.card.id);
          if (idx !== -1) {
            const pickedSpell = sourceArr.splice(idx, 1)[0];
            if (item.zone === 'deck') contestant.deck = shuffleDeck(contestant.deck);
            resetCardStateForZoneChange(pickedSpell);
            contestant.hand.push(pickedSpell);

            if (canForceCastSpell(pickedSpell)) {
              const handIdx = contestant.hand.length - 1;
              const used = contestant.hand.splice(handIdx, 1)[0];
              const drawCnt = contestant.graveyard.length >= 5 ? 2 : 1;
              drawCards(contestant, drawCnt);
              const ally = contestant.board.find(m => m !== null);
              if (ally) ally.tempPowerMod += 1;
              contestant.graveyard.push(used);
              setLog(`😈 [เดบิรุน] ดึง "${used.name}" ขึ้นมือและบังคับใช้งานทันที (จั่ว ${drawCnt} ใบ และบัฟพลัง +1)!`);
              if (onComplete) onComplete();
            } else {
              reviveUnitFallback(`ดึง "${pickedSpell.name}" ขึ้นมือแล้ว แต่เงื่อนไขเวทไม่สามารถบังคับใช้ตอนนี้ได้`);
            }
          }
        }
      });
    }
  });

  showChoiceModal('😈 ออโต้เมื่อเข้าเทิร์น: เดบิรุน', 'เลือกค้นหาการ์ดเวทจากกองหรือนรกขึ้นมือเพื่อบังคับใช้งาน (หากใช้งานไม่ได้จะชุบยูนิตจากนรก 1 ใบ):', options);
}

function handleDoomsdayHandMenu(handIndex) {
  const player = gameState.player;
  const ai = gameState.ai;
  const card = player.hand[handIndex];
  if (!card) return;

  if (card.id === 'DM07') {
    const canSpecialCall = player.unitsDestroyedThisTurn >= 2;
    showChoiceModal(
      `🔥 ยืนยันการใช้การ์ด: แอชชี่ล่า`,
      `ยูนิตฝั่งเราที่ถูกทำลายในเทิร์นนี้: ${player.unitsDestroyedThisTurn} / 2 ใบ\n\n📜 ความสามารถ:\n${getCardDescription(card)}`,
      [
        {
          label: `💥 สั่งใช้งานสกิลจากมือ (เมื่อยูนิตถูกทำลาย 2 ใบขึ้นไป): คอลลงสนามและพลัง +2 จนจบเทิร์น ${!canSpecialCall ? '(ยูนิตถูกทำลายยังไม่ครบ 2 ใบ)' : ''}`,
          disabled: !canSpecialCall,
          color: '#dc2626',
          onSelect: () => summonAshilaBySkillFromHand(player)
        },
        {
          label: `✅ อัญเชิญปกติลงสนาม (Power 2 - เฉพาะใน Main Phase)`,
          disabled: gameState.phase !== 'Main Phase',
          color: '#d97706',
          onSelect: () => {
            gameState.selectedHandIndex = handIndex;
            setLog('👉 เลือก "แอชชี่ล่า" แล้ว — คลิกที่ช่องบนสนามของคุณเพื่อลงสนาม!');
            renderGame();
          }
        },
        { label: '❌ ยกเลิก', color: '#475569', onSelect: () => renderGame() }
      ]
    );
    return;
  }

  if (card.futureBaseId) {
    const baseSlotIdx = player.board.findIndex(m => m !== null && m.id === card.futureBaseId);
    if (player.futureUsedThisTurn) {
      setLog('🚫 คุณใช้ความสามารถ "อนาคต" ไปแล้วในเทิร์นนี้ (จำกัด 1 ครั้งต่อเทิร์น)!');
      return;
    }
    if (baseSlotIdx === -1) {
      setLog(`🚫 ไม่สามารถอัญเชิญ "${card.name}" แบบปกติได้! ต้องมี "${card.futureBaseName}" อยู่บนสนามฝั่งเราเพื่อส่งไปมิติมืดเท่านั้น!`);
      return;
    }

    showChoiceModal(
      `🌌 ยืนยันการใช้การ์ดอนาคต: ${card.name}`,
      `ต้องการส่ง "${card.futureBaseName}" บนสนามไปที่ "มิติมืด" แล้วคอล "${card.name}" ลงสนามใช่หรือไม่?\n\n📜 ความสามารถ:\n${getCardDescription(card)}`,
      [
        {
          label: `✅ ยืนยัน: ส่ง "${card.futureBaseName}" ไปมิติมืด -> คอล "${card.name}" ลงสนาม!`,
          color: '#7c3aed',
          onSelect: () => executeFutureSummon(player, ai, handIndex, baseSlotIdx)
        },
        { label: '❌ ยกเลิก', color: '#475569', onSelect: () => renderGame() }
      ]
    );
  }
}

function executeFutureSummon(caster, opponent, handIndex, baseSlotIndex) {
  const futureCard = caster.hand.splice(handIndex, 1)[0];
  const baseUnit = caster.board[baseSlotIndex];
  if (!futureCard || !baseUnit) return;

  caster.futureUsedThisTurn = true;
  resetCardStateForZoneChange(baseUnit);
  caster.darkDimension.push(baseUnit);

  resetCardStateForZoneChange(futureCard);
  futureCard.state = 'Stand';
  futureCard.returnFromDarkDimensionId = baseUnit.id;
  caster.board[baseSlotIndex] = futureCard;

  // หากการ์ดอนาคตมีบล็อก ON_SUMMON ใน effects (เช่น DM13) ให้รันผ่าน EffectEngine ได้ทันที
  if (Array.isArray(futureCard.effects) && futureCard.effects.some(e => e.trigger === 'ON_SUMMON')) {
    EffectEngine.triggerCardEffects(futureCard, 'ON_SUMMON', {
      caster, opponent, sourceCard: futureCard, sourceSlot: baseSlotIndex, isAI: caster !== gameState.player
    });
    renderGame();
    return;
  }

  if (futureCard.id === 'DM09') {
    futureCard.permPowerMod += 1;
    let topMsg = 'ไม่มีการ์ดในกองให้เปิด';
    if (caster.deck.length > 0) {
      const topCard = caster.deck[caster.deck.length - 1];
      if (topCard.type === 'NormalSpell' || topCard.type === 'ReactionSpell') {
        const standEnemy = opponent.board.find(m => m !== null && m.state === 'Stand');
        if (standEnemy) {
          standEnemy.state = 'Rest';
          topMsg = `เปิดท็อปกองได้เวท "${topCard.name}" -> บังคับ Rest "${standEnemy.name}" ของอีกฝ่าย!`;
        } else {
          topMsg = `เปิดท็อปกองได้เวท "${topCard.name}" (อีกฝ่ายไม่มียูนิตที่ Stand อยู่)`;
        }
      } else {
        topMsg = `เปิดท็อปกองได้ "${topCard.name}" (ไม่ใช่การ์ดเวท)`;
      }
    }
    setLog(`🌌 [อนาคต - ผู้รักษาความฝัน มายอา] ส่งมายอาไปมิติมืด คอลลงสนามพลัง +1 | ${topMsg}`);
    renderGame();
    return;
  }

  if (futureCard.id === 'DM10') {
    const otherSlot = caster.board.findIndex((m, idx) => m !== null && idx !== baseSlotIndex);
    let bounceMsg = '';
    if (otherSlot !== -1) {
      const bounced = caster.board[otherSlot];
      caster.board[otherSlot] = null;
      resetCardStateForZoneChange(bounced);
      caster.hand.push(bounced);
      bounceMsg = `นำ "${bounced.name}" บนสนามเราขึ้นมือ `;
    }
    let topMsg = '';
    if (caster.deck.length > 0) {
      const topCard = caster.deck.pop();
      resetCardStateForZoneChange(topCard);
      if (topCard.type === 'Monster') {
        const emptySlot = caster.board.findIndex(m => m === null);
        if (emptySlot !== -1) {
          caster.board[emptySlot] = topCard;
          topMsg = `และเปิดท็อปกองคอล "${topCard.name}" ลงสนาม!`;
        } else {
          caster.hand.push(topCard);
          topMsg = `และนำ "${topCard.name}" ขึ้นมือ (สนามเต็ม)`;
        }
      } else {
        caster.hand.push(topCard);
        topMsg = `และเปิดท็อปกองได้เวท "${topCard.name}" นำขึ้นมือ!`;
      }
    }
    setLog(`🌌 [อนาคต - เดบิรุน เดอะ ฟิวเจอร์] ส่งเดบิรุนไปมิติมืด ${bounceMsg}${topMsg}`);
    renderGame();
    return;
  }

  if (futureCard.id === 'DM11') {
    const mayaGraveIdx = caster.graveyard.findIndex(c => c.id === 'DM03');
    if (mayaGraveIdx !== -1) {
      const maya = caster.graveyard.splice(mayaGraveIdx, 1)[0];
      resetCardStateForZoneChange(maya);
      maya.permPowerMod += 1;
      const emptySlot = caster.board.findIndex(m => m === null);
      if (emptySlot !== -1) {
        caster.board[emptySlot] = maya;
        setLog('🌌 [อนาคต - เด็กสาวขนมหวาน ซึรุรุ] ส่งซึรุรุไปมิติมืด คอล "มายอา" จากนรกลงสนาม และเพิ่มพลังให้มายอา +1!');
      } else {
        gameState.pendingAction = {
          type: 'CALL_FROM_EFFECT_SELECT_SLOT',
          cardToPlace: maya,
          onAfterPlace: null
        };
        setLog('🌌 [อนาคต - เด็กสาวขนมหวาน ซึรุรุ] สนามเต็ม 3 ช่อง — คลิกเลือกช่องบนสนามเพื่อวาง "มายอา" ทับ!');
      }
    } else {
      setLog('🌌 [อนาคต - เด็กสาวขนมหวาน ซึรุรุ] ส่งซึรุรุไปมิติมืดและลงสนามสำเร็จ! (ไม่มีมายอาในนรก)');
    }
    renderGame();
    return;
  }

  if (futureCard.id === 'DM12') {
    const oppHasHand = opponent.hand.length > 0;
    const oppBoardUnits = opponent.board.map((m, idx) => ({ m, idx })).filter(x => x.m !== null);

    if (opponent === gameState.player) {
      const opts = [];
      if (oppHasHand) {
        opts.push({
          label: `🃏 ทิ้งการ์ดบนมือของคุณ 1 ใบ (${opponent.hand[opponent.hand.length - 1].name})`,
          color: '#d97706',
          onSelect: () => {
            const discarded = opponent.hand.pop();
            if (discarded) {
              resetCardStateForZoneChange(discarded);
              opponent.graveyard.push(discarded);
              setLog(`🌌 [อนาคต - นักล่าปีศาจ โซเนบุ] คุณเลือกทิ้งการ์ดบนมือ "${discarded.name}" 1 ใบ!`);
            }
            gameState.isWaitingForChoice = false;
            renderGame();
          }
        });
      }
      oppBoardUnits.forEach(item => {
        opts.push({
          label: `💥 ทำลาย "${item.m.name}" (ช่อง ${item.idx + 1}) บนสนามของคุณ`,
          color: '#dc2626',
          onSelect: () => {
            destroyBoardMonster(opponent, item.idx);
            setLog(`🌌 [อนาคต - นักล่าปีศาจ โซเนบุ] คุณเลือกทำลาย "${item.m.name}" บนสนามของคุณ!`);
            gameState.isWaitingForChoice = false;
            renderGame();
          }
        });
      });
      opts.push({
        label: '❌ ไม่ทำ (นักล่าปีศาจ โซเนบุ พลังโจมตี +1)',
        color: '#475569',
        onSelect: () => {
          futureCard.permPowerMod += 1;
          setLog('🌌 [อนาคต - นักล่าปีศาจ โซเนบุ] คุณเลือกไม่ทำ -> นักล่าปีศาจ โซเนบุ พลัง +1!');
          gameState.isWaitingForChoice = false;
          renderGame();
        }
      });
      gameState.isWaitingForChoice = true;
      showChoiceModal(
        '🌌 สกิลอนาคตของ นักล่าปีศาจ โซเนบุ!',
        'ฝ่ายตรงข้ามบังคับให้คุณเลือก ทิ้งการ์ดบนมือ 1 ใบ หรือ ทำลายการ์ดบนสนามของตัวเอง 1 ใบ (หากไม่ทำ โซเนบุ พลัง +1):',
        opts
      );
      return;
    }

    if (oppHasHand) {
      const discarded = opponent.hand.pop();
      resetCardStateForZoneChange(discarded);
      opponent.graveyard.push(discarded);
      setLog(`🌌 [อนาคต - นักล่าปีศาจ โซเนบุ] ส่งโซเนบุไปมิติมืด -> ฝ่ายตรงข้ามเลือกทิ้งการ์ดบนมือ "${discarded.name}" 1 ใบ!`);
    } else if (oppBoardUnits.length > 0) {
      oppBoardUnits.sort((a, b) => getEffectivePower(a.m, opponent) - getEffectivePower(b.m, opponent));
      const target = oppBoardUnits[0];
      destroyBoardMonster(opponent, target.idx);
      setLog(`🌌 [อนาคต - นักล่าปีศาจ โซเนบุ] ฝ่ายตรงข้ามไม่มีมือให้ทิ้ง -> เลือกทำลาย "${target.m.name}" บนสนามตัวเอง 1 ใบ!`);
    } else {
      futureCard.permPowerMod += 1;
      setLog('🌌 [อนาคต - นักล่าปีศาจ โซเนบุ] ฝ่ายตรงข้ามไม่ทิ้งการ์ด/ทำลายยูนิต -> นักล่าปีศาจ โซเนบุ พลัง +1!');
    }
    renderGame();
    return;
  }

  if (futureCard.id === 'DM14') {
    const enemySlot = opponent.board.findIndex(m => m !== null && !m.immuneToEnemyEffectsUntilEndOfTurn);
    if (enemySlot !== -1) {
      const bouncedEnemy = opponent.board[enemySlot];
      opponent.board[enemySlot] = null;
      resetCardStateForZoneChange(bouncedEnemy);
      opponent.hand.push(bouncedEnemy);

      const otherUnitInHandIdx = opponent.hand.findIndex(c => c.type === 'Monster' && c.uid !== bouncedEnemy.uid && !c.cannotNormalSummon);
      if (otherUnitInHandIdx !== -1) {
        const replacement = opponent.hand.splice(otherUnitInHandIdx, 1)[0];
        resetCardStateForZoneChange(replacement);
        opponent.board[enemySlot] = replacement;
        setLog(`🌌 [อนาคต - สุดยอดเอไอ เอมิ] บังคับอีกฝ่ายนำ "${bouncedEnemy.name}" ขึ้นมือ และคอล "${replacement.name}" ลงมาแทน!`);
      } else {
        drawCards(caster, 1);
        setLog(`🌌 [อนาคต - สุดยอดเอไอ เอมิ] บังคับอีกฝ่ายนำ "${bouncedEnemy.name}" ขึ้นมือ (อีกฝ่ายไม่มียูนิตอื่นให้คอล เราจั่ว 1 ใบ)!`);
      }
    } else {
      drawCards(caster, 1);
      setLog('🌌 [อนาคต - สุดยอดเอไอ เอมิ] อีกฝ่ายไม่มีการ์ดบนสนามให้ยกขึ้นมือ -> เราจั่วการ์ด 1 ใบ!');
    }
    renderGame();
  }
}

function handleNueaHandAbilityMenu(handIndex) {
  const player = gameState.player;
  const ai = gameState.ai;
  const card = player.hand[handIndex];
  if (!card) return;

  if (card.id === 'NM01') {
    const spyInDeck = player.deck.some(c => c.id === 'NM05');
    const spyInGrave = player.graveyard.some(c => c.id === 'NM05');
    const enemyHasEmptySlot = ai.board.some(m => m === null);
    const canSummonSpy = (spyInDeck || spyInGrave) && enemyHasEmptySlot;
    const soldierInDeck = player.deck.some(c => isSoldierCard(c));

    showChoiceModal(
      '🌾 ยืนยันการใช้การ์ด: ไพร่ชาวนาเหนือ',
      `เลือกวิธีใช้งานการ์ดใบนี้:\n\n📜 ความสามารถ:\n${getCardDescription(card)}`,
      [
        {
          label: '✅ อัญเชิญปกติลงสนาม (Power 1)',
          color: '#d97706',
          onSelect: () => {
            gameState.selectedHandIndex = handIndex;
            setLog('👉 เลือก "ไพร่ชาวนาเหนือ" แล้ว — คลิกที่ช่องบนกระดานของคุณเพื่อลงสนาม!');
            renderGame();
          }
        },
        {
          label: `🕵️ สั่งใช้ 1: ทิ้งใบนี้ลงนรก -> อัญเชิญ "สายลับไพร่เหนือ" จากกอง/นรกลงสนามอีกฝ่าย ${!canSummonSpy ? '(เงื่อนไขไม่ครบ)' : ''}`,
          disabled: !canSummonSpy,
          color: '#7c3aed',
          onSelect: () => {
            const discarded = player.hand.splice(handIndex, 1)[0];
            resetCardStateForZoneChange(discarded);
            player.graveyard.push(discarded);

            let spyCard = null;
            const gIdx = player.graveyard.findIndex(c => c.id === 'NM05');
            if (gIdx !== -1) {
              spyCard = player.graveyard.splice(gIdx, 1)[0];
            } else {
              const dIdx = player.deck.findIndex(c => c.id === 'NM05');
              if (dIdx !== -1) {
                spyCard = player.deck.splice(dIdx, 1)[0];
                player.deck = shuffleDeck(player.deck);
              }
            }
            const emptyAiSlot = ai.board.findIndex(m => m === null);
            if (spyCard && emptyAiSlot !== -1) {
              resetCardStateForZoneChange(spyCard);
              spyCard.state = 'Stand';
              ai.board[emptyAiSlot] = spyCard;
              setLog('🕵️ [ไพร่ชาวนาเหนือ] ส่งตัวเองลงนรก และอัญเชิญ "สายลับไพร่เหนือ" ลงบนสนามของฝ่ายตรงข้ามสำเร็จ!');
            }
            renderGame();
          }
        },
        {
          label: `🛡️ สั่งใช้ 2: ทิ้งใบนี้ลงนรก -> เลือกนำการ์ดที่มีคำว่า "ทหาร" 1 ใบจากกองการ์ดขึ้นมือ ${!soldierInDeck ? '(ไม่มีทหารในกอง)' : ''}`,
          disabled: !soldierInDeck,
          color: '#0284c7',
          onSelect: () => {
            const discarded = player.hand.splice(handIndex, 1)[0];
            resetCardStateForZoneChange(discarded);
            player.graveyard.push(discarded);
            openSelectSoldierFromDeckModal(player);
          }
        },
        { label: '❌ ยกเลิก', color: '#475569', onSelect: () => renderGame() }
      ]
    );
    return;
  }

  if (card.id === 'NM02' || card.id === 'NM03') {
    const canJuti = player.hand.some((c, idx) => idx !== handIndex && c.id === 'NM01');

    showChoiceModal(
      `⚔️ ยืนยันการใช้การ์ด: ${card.name}`,
      `เลือกวิธีอัญเชิญการ์ดใบนี้:\n\n📜 ความสามารถ:\n${getCardDescription(card)}`,
      [
        {
          label: `✅ อัญเชิญปกติลงสนาม (Power ${card.power})`,
          color: '#d97706',
          onSelect: () => {
            gameState.selectedHandIndex = handIndex;
            setLog(`👉 เลือก "${card.name}" แล้ว — คลิกที่ช่องบนกระดานของคุณเพื่อลงสนาม!`);
            renderGame();
          }
        },
        {
          label: `🔥 สั่งใช้จากมือ (จุติ): ทิ้ง "ไพร่ชาวนาเหนือ" บนมือ 1 ใบ -> อัญเชิญใบนี้พลัง +1 ${!canJuti ? '(ต้องมีไพร่ชาวนาเหนือบนมือ)' : ''}`,
          disabled: !canJuti,
          color: '#dc2626',
          onSelect: () => {
            gameState.pendingAction = { type: 'JUTI_SELECT_SLOT', summonHandIndex: handIndex };
            setLog(`🔥 [อัญเชิญจุติ ${card.name}] คลิกเลือกช่องบนสนามของคุณเพื่อวางการ์ด`);
            renderGame();
          }
        },
        { label: '❌ ยกเลิก', color: '#475569', onSelect: () => renderGame() }
      ]
    );
  }
}

function openSelectSoldierFromDeckModal(contestant) {
  const uniqueSoldiers = [];
  const seenIds = new Set();
  contestant.deck.forEach(c => {
    if (isSoldierCard(c) && !seenIds.has(c.id)) {
      seenIds.add(c.id);
      uniqueSoldiers.push(c);
    }
  });

  if (uniqueSoldiers.length === 0) {
    setLog('⚠️ ไม่พบการ์ดที่มีคำว่า "ทหาร" ในกองการ์ด');
    renderGame();
    return;
  }

  const options = uniqueSoldiers.map(sCard => ({
    label: `เลือก "${sCard.name}" (Power ${sCard.power}) ขึ้นมือ`,
    color: '#16a34a',
    onSelect: () => {
      const idx = contestant.deck.findIndex(c => c.id === sCard.id);
      if (idx !== -1) {
        const picked = contestant.deck.splice(idx, 1)[0];
        resetCardStateForZoneChange(picked);
        contestant.hand.push(picked);
        contestant.deck = shuffleDeck(contestant.deck);
        setLog(`🛡️ [ไพร่ชาวนาเหนือ] นำ "${picked.name}" จากกองการ์ดขึ้นมือและสับกองสำเร็จ!`);
      }
      renderGame();
    }
  }));

  showChoiceModal('🛡️ เลือกการ์ดที่มีคำว่า "ทหาร" 1 ใบจากกองการ์ดขึ้นมือ', 'คลิกเลือกทหารที่ต้องการดึงขึ้นมือ:', options);
}

function triggerRoyalGuardJutiBonus(contestant) {
  const hasConscriptOnBoard = contestant.board.some(m => m !== null && m.id === 'NM04');
  if (!hasConscriptOnBoard) return;

  const graveSoldiers = contestant.graveyard.filter(c => isSoldierCard(c));
  const deckSoldiers = contestant.deck.filter(c => isSoldierCard(c));
  if (graveSoldiers.length === 0 && deckSoldiers.length === 0) return;

  if (contestant !== gameState.player) {
    const emptySlot = contestant.board.findIndex(m => m === null);
    if (emptySlot === -1) return;
    let summoned = null;
    if (graveSoldiers.length > 0) {
      const idx = contestant.graveyard.findIndex(c => isSoldierCard(c));
      summoned = contestant.graveyard.splice(idx, 1)[0];
    } else {
      const idx = contestant.deck.findIndex(c => isSoldierCard(c));
      summoned = contestant.deck.splice(idx, 1)[0];
      contestant.deck = shuffleDeck(contestant.deck);
    }
    if (summoned) {
      resetCardStateForZoneChange(summoned);
      contestant.board[emptySlot] = summoned;
      EffectEngine.triggerCardEffects(summoned, 'ON_SUMMON', {
        caster: contestant, opponent: gameState.player, sourceCard: summoned, sourceSlot: emptySlot, isAI: true
      });
      setLog(`🤖 [จุติ - ทหารหลวงเหนือ] อัญเชิญ "${summoned.name}" ลงสนามฟรี!`);
    }
    renderGame();
    return;
  }

  const placeBonusSoldier = (card) => {
    resetCardStateForZoneChange(card);
    const emptySlot = contestant.board.findIndex(m => m === null);
    if (emptySlot !== -1) {
      contestant.board[emptySlot] = card;
      setLog(`✨ [จุติ - ทหารหลวงเหนือ] อัญเชิญ "${card.name}" ลงสนามทันที!`);
      EffectEngine.triggerCardEffects(card, 'ON_SUMMON', {
        caster: contestant, opponent: gameState.ai, sourceCard: card, sourceSlot: emptySlot, isAI: false
      }, () => renderGame());
    } else {
      gameState.pendingAction = {
        type: 'CALL_FROM_EFFECT_SELECT_SLOT',
        cardToPlace: card,
        onAfterPlace: null
      };
      setLog(`✨ [จุติ - ทหารหลวงเหนือ] สนามเต็ม 3 ช่อง — คลิกเลือกช่องบนสนามของคุณเพื่อวาง "${card.name}" ทับ!`);
      renderGame();
    }
  };

  const options = [];
  const seen = new Set();

  graveSoldiers.forEach(c => {
    const key = `G_${c.id}`;
    if (!seen.has(key)) {
      seen.add(key);
      options.push({
        label: `[จากนรก] อัญเชิญ "${c.name}" (Power ${c.power})`,
        color: '#7c3aed',
        onSelect: () => {
          const idx = contestant.graveyard.findIndex(g => g.id === c.id);
          if (idx !== -1) placeBonusSoldier(contestant.graveyard.splice(idx, 1)[0]);
        }
      });
    }
  });

  deckSoldiers.forEach(c => {
    const key = `D_${c.id}`;
    if (!seen.has(key)) {
      seen.add(key);
      options.push({
        label: `[จากกองการ์ด] อัญเชิญ "${c.name}" (Power ${c.power})`,
        color: '#0284c7',
        onSelect: () => {
          const idx = contestant.deck.findIndex(d => d.id === c.id);
          if (idx !== -1) {
            const card = contestant.deck.splice(idx, 1)[0];
            contestant.deck = shuffleDeck(contestant.deck);
            placeBonusSoldier(card);
          }
        }
      });
    }
  });

  showChoiceModal('🔥 สกิลจุติของ ทหารหลวงเหนือ!', 'เลือกอัญเชิญการ์ดที่มีคำว่า "ทหาร" 1 ใบจากกองหรือนรกลงสนามทันที:', options);
}


/* ============================================================================
   หมวดที่ 6: ระบบจัดการเทิร์น และการคลิกเลือกเป้าหมายผ่าน EffectEngine
   ============================================================================ */
function canContestantAttack(contestant, monster) {
  if (gameState.gameOver) return { allowed: false, reason: 'เกมจบแล้ว' };
  if (!monster || monster.state !== 'Stand') {
    return { allowed: false, reason: 'ยูนิทต้องอยู่ในสถานะ Stand เท่านั้นจึงจะโจมตีได้' };
  }
  if (contestant.isFirstPlayer && contestant.turnsTaken === 1) {
    return { allowed: false, reason: 'กฎผู้เล่นเริ่มคนแรก: ห้ามโจมตีใน Turn 1!' };
  }
  if (!contestant.isFirstPlayer && contestant.turnsTaken === 1 && contestant.attacksThisTurn >= 1) {
    return { allowed: false, reason: 'กฎผู้เล่นเริ่มคนที่สอง: ในเทิร์นแรกของตัวเอง โจมตีได้เพียง 1 ครั้ง!' };
  }
  return { allowed: true };
}

function triggerOatLeaderStartTurn(contestant, onComplete) {
  if (!contestant.leader || contestant.leader.id !== 'L06' || contestant.deck.length === 0) {
    if (onComplete) onComplete();
    return;
  }

  const lookCount = Math.min(2, contestant.deck.length);
  const top2 = [];
  for (let i = 0; i < lookCount; i++) {
    top2.push(contestant.deck.pop());
  }

  const placeRemainingCards = (remainingCards, placeWhere) => {
    if (placeWhere === 'BOTTOM') {
      remainingCards.forEach(c => {
        resetCardStateForZoneChange(c);
        contestant.deck.unshift(c);
      });
    } else {
      remainingCards.forEach(c => {
        resetCardStateForZoneChange(c);
        contestant.deck.push(c);
      });
    }
    renderGame();
    if (onComplete) onComplete();
  };

  if (contestant !== gameState.player) {
    const spellIdx = top2.findIndex(c => isSpellCard(c));
    if (spellIdx !== -1) {
      const sp = top2.splice(spellIdx, 1)[0];
      resetCardStateForZoneChange(sp);
      contestant.hand.push(sp);
      setLog(`👑 [AI ไอโอ๊ตบ้าทุกสิ่ง] เปิด 2 ใบบนสุด นำเวทมนตร์ "${sp.name}" ขึ้นมือ!`);
    }
    const wantTop = top2.some(c => c.id === 'OM01' || c.id === 'OM07');
    placeRemainingCards(top2, wantTop ? 'TOP' : 'BOTTOM');
    return;
  }

  const askWhereToPlaceRemaining = (remaining) => {
    if (remaining.length === 0) {
      renderGame();
      if (onComplete) onComplete();
      return;
    }
    const remNames = remaining.map(c => c.name).join(', ');
    showChoiceModal(
      '👑 ไอโอ๊ตบ้าทุกสิ่ง: จัดเรียงการ์ดที่เหลือ',
      `ต้องการนำการ์ด${remaining.length > 1 ? 'ทั้ง ' + remaining.length + ' ใบ' : ''}ด้านล่างไปไว้บนกองหรือล่างกองการ์ด?`,
      [
        {
          label: '🔼 วางไว้บนกองการ์ด',
          color: '#0284c7',
          onSelect: () => {
            setLog(`👑 [ไอโอ๊ตบ้าทุกสิ่ง] นำ "${remNames}" เรียงไว้บนกองการ์ด!`);
            placeRemainingCards(remaining, 'TOP');
          }
        },
        {
          label: '🔽 วางไว้ล่างกองการ์ด',
          color: '#475569',
          onSelect: () => {
            setLog(`👑 [ไอโอ๊ตบ้าทุกสิ่ง] นำ "${remNames}" เรียงไว้ใต้กองการ์ด!`);
            placeRemainingCards(remaining, 'BOTTOM');
          }
        }
      ],
      { previewCards: remaining }
    );
  };

  const spellsInTop2 = top2.filter(c => isSpellCard(c));
  const topNames = top2.map(c => `${c.name} [${c.type}]`).join(' / ');

  if (spellsInTop2.length === 0) {
    setLog(`👑 [ไอโอ๊ตบ้าทุกสิ่ง] เปิด 2 ใบบนสุดพบ: ${topNames} (ไม่มีเวทมนตร์)`);
    askWhereToPlaceRemaining(top2);
    return;
  }

  const options = spellsInTop2.map(sp => ({
    label: `✨ เลือกเวทมนตร์ "${sp.name}" นำขึ้นมือ`,
    color: '#16a34a',
    onSelect: () => {
      resetCardStateForZoneChange(sp);
      contestant.hand.push(sp);
      setLog(`👑 [ไอโอ๊ตบ้าทุกสิ่ง] นำเวทมนตร์ "${sp.name}" ขึ้นมือสำเร็จ!`);
      const rem = top2.filter(c => c.uid !== sp.uid);
      askWhereToPlaceRemaining(rem);
    }
  }));
  options.push({
    label: 'ไม่นำเวทมนตร์ขึ้นมือ',
    color: '#475569',
    onSelect: () => askWhereToPlaceRemaining(top2)
  });

  const nonSpellsInTop2 = top2.filter(c => !isSpellCard(c));
  showChoiceModal(
    '👑 ออโต้เมื่อเข้าเทิร์น: ไอโอ๊ตบ้าทุกสิ่ง',
    nonSpellsInTop2.length
      ? `เปิดการ์ด 2 ใบบนสุดของกอง (ใบที่ไม่ใช่เวทมนตร์มีป้าย "👁 เปิดดู")\nคลิกรูปการ์ดเวทมนตร์เพื่อนำขึ้นมือ (ไม่เกิน 1 ใบ):`
      : `เปิดการ์ด 2 ใบบนสุดของกอง\nคลิกรูปการ์ดเวทมนตร์เพื่อนำขึ้นมือ (ไม่เกิน 1 ใบ):`,
    options,
    { previewCards: nonSpellsInTop2 }
  );
}

function executeStartPhase(contestant, onStartEffectsComplete = null) {
  contestant.turnsTaken += 1;
  contestant.attacksThisTurn = 0;
  contestant.unitsDestroyedThisTurn = 0;
  contestant.futureUsedThisTurn = false;
  contestant.leader.abilityUsedThisTurn = false;
  contestant.spellQuota.normalUsed = 0;
  contestant.spellQuota.reactionUsed = 0;

  drawCards(contestant, 1);

  contestant.board.forEach(m => {
    if (m) {
      m.state = 'Stand';
      m.usedSkills = {};
      m.indestructibleUntilNextTurn = false;
      m.oatShieldUsedThisTurn = false;
      m.beelzebubBuffThisTurn = false;
      m.tauntedByLeviathanUid = null;
      // ล้างบัฟ "จนจบเทิร์นอีกฝั่ง" ของฝ่ายตรงข้ามเมื่อจบเทิร์นอีกฝั่งแล้วเข้าเทิร์นเรา
      m.untilEnemyEndPowerMod = 0;
    }
  });

  if (contestant.leader && contestant.leader.id === 'L02') {
    triggerKhunNueaStartTurn(contestant, () => {
      triggerDoomsdayStartTurnQueue(contestant, onStartEffectsComplete);
    });
    return;
  }

  if (contestant.leader && contestant.leader.id === 'L06') {
    triggerOatLeaderStartTurn(contestant, () => {
      triggerDoomsdayStartTurnQueue(contestant, onStartEffectsComplete);
    });
    return;
  }

  triggerDoomsdayStartTurnQueue(contestant, onStartEffectsComplete);
}

function executeEndPhaseCleanup(activeContestant) {
  // แลนด์สเปล "สัญญาปีศาจ" (DMS01) ในมิติมืด: เมื่อจบเทิร์น เลือกการ์ดจากดรอป 1 ใบขึ้นมือ
  if (
    Array.isArray(activeContestant.darkDimension) &&
    activeContestant.darkDimension.some(d => d && d.id === 'DMS01') &&
    activeContestant.graveyard.length > 0
  ) {
    if (activeContestant === gameState.player && activeContestant.graveyard.length > 1) {
      const uniqueMap = new Map();
      activeContestant.graveyard.forEach(c => { if (!uniqueMap.has(c.id)) uniqueMap.set(c.id, c); });
      const options = Array.from(uniqueMap.values()).map(targetCard => ({
        label: `นำ "${targetCard.name}" ขึ้นมือ`,
        color: '#7c3aed',
        onSelect: () => {
          gameState.isWaitingForChoice = false;
          const gIdx = activeContestant.graveyard.findIndex(c => c.id === targetCard.id);
          if (gIdx !== -1) {
            const recovered = activeContestant.graveyard.splice(gIdx, 1)[0];
            resetCardStateForZoneChange(recovered);
            activeContestant.hand.push(recovered);
            setLog(`📜 [สัญญาปีศาจ - มิติมืด] เมื่อจบเทิร์น นำ "${recovered.name}" จากดรอปขึ้นมือสำเร็จ!`);
            renderGame();
          }
        }
      }));
      gameState.isWaitingForChoice = true;
      showChoiceModal('📜 สัญญาปีศาจ (มิติมืด)', 'เมื่อจบเทิร์น เลือกการ์ด 1 ใบจากกองดรอป (นรก) เพื่อนำกลับขึ้นมือ:', options);
    } else {
      const recovered = activeContestant.graveyard.pop();
      resetCardStateForZoneChange(recovered);
      activeContestant.hand.push(recovered);
      setLog(`📜 [สัญญาปีศาจ - มิติมืด] เมื่อจบเทิร์น นำ "${recovered.name}" 1 ใบจากดรอปขึ้นมือของ ${activeContestant.name}!`);
      renderGame();
    }
  }

  activeContestant.board.forEach((m, idx) => {
    if (!m) return;
    m.beelzebubBuffThisTurn = false;

    if (m.returnFromDarkDimensionId) {
      const baseId = m.returnFromDarkDimensionId;
      const futureName = m.name;
      activeContestant.board[idx] = null;
      resetCardStateForZoneChange(m);
      activeContestant.graveyard.push(m);

      const darkIdx = activeContestant.darkDimension.findIndex(d => d.id === baseId);
      if (darkIdx !== -1) {
        const returnedUnit = activeContestant.darkDimension.splice(darkIdx, 1)[0];
        resetCardStateForZoneChange(returnedUnit);
        returnedUnit.state = 'Stand';
        activeContestant.board[idx] = returnedUnit;
        setLog(`🌌 [จบเทิร์นอนาคต] นำ "${futureName}" ลงนรก และคอล "${returnedUnit.name}" จากมิติมืดกลับลงสนาม!`);
      }
      return;
    }

    if (m.destroyAtEndOfTurn) {
      destroyBoardMonster(activeContestant, idx);
      setLog(`🔥 "${m.name}" ถูกทำลายเมื่อจบเทิร์นตามเงื่อนไขความสามารถ!`);
    }
  });

  [gameState.player, gameState.ai].forEach(side => {
    side.board.forEach(m => {
      if (m) {
        m.tempPowerMod = 0;
        m.immuneToEnemyEffectsUntilEndOfTurn = false;
      }
    });
  });
}

// เมื่อผู้เล่นคลิกที่การ์ดบนมือตัวเอง
function handleHandCardClick(handIndex) {
  const player = gameState.player;
  const ai = gameState.ai;
  const clickedCard = player ? player.hand[handIndex] : null;
  if (!clickedCard) return;

  const isAshilaReadyInBattle = (clickedCard.id === 'DM07' && player.unitsDestroyedThisTurn >= 2 && gameState.phase === 'Battle Phase');
  const awaitingHandTarget = gameState.pendingAction && gameState.pendingAction.type === 'MODULAR_SELECT_TARGET' && gameState.pendingAction.targetZone === 'PLAYER_HAND';

  if (!awaitingHandTarget) {
    if (gameState.gameOver || gameState.isRollingDice || gameState.activeTurn !== 'player' || (gameState.phase !== 'Main Phase' && !isAshilaReadyInBattle)) {
      setLog('⚠️ ลงการ์ดหรือใช้เวทมนตร์จากมือได้เฉพาะใน Main Phase ของคุณเท่านั้น!');
      return;
    }
    if (isInteractionBlocked()) {
      setLog('⏳ กรุณารอและดำเนินการเลือกของความสามารถให้เสร็จสิ้นก่อน!');
      return;
    }
  }

  // กรณีที่ 1: อยู่ระหว่างรอคลิกเลือกการ์ดบนมือจาก Modular EffectEngine
  if (gameState.pendingAction) {
    const action = gameState.pendingAction;
    if (action.type === 'MODULAR_SELECT_TARGET' && action.targetZone === 'PLAYER_HAND') {
      if (action.excludeHandUid && clickedCard.uid === action.excludeHandUid) {
        setLog('⚠️ กรุณาคลิกเลือกการ์ดใบอื่นบนมือเพื่อใช้ทิ้ง!');
        return;
      }
      if (action.onSelectHand) action.onSelectHand(handIndex);
      action.remainingCount -= 1;
      if (action.remainingCount <= 0) {
        const doneCb = action.onAllSelected;
        gameState.pendingAction = null;
        if (doneCb) doneCb();
      } else {
        renderGame();
      }
      return;
    }

    setLog('⚠️ กรุณาคลิกเลือกเป้าหมายบนสนามตามที่ระบบแจ้งเตือนอยู่!');
    return;
  }

  if (gameState.selectedHandIndex === handIndex) {
    gameState.selectedHandIndex = null;
    setLog('ยกเลิกการเลือกการ์ดบนมือ');
    renderGame();
    return;
  }

  // กรณีที่ 2: คลิกการ์ด Monster บนมือ
  if (clickedCard.type === 'Monster') {
    if (clickedCard.id === 'M04') {
      setLog('🚫 "ออลฟอจิต" ไม่สามารถอัญเชิญแบบปกติได้!');
      return;
    }

    if (Array.isArray(clickedCard.hybridMaterials)) {
      handleDinoHybridHandMenu(handIndex);
      return;
    }

    if (clickedCard.id === 'DM07' || clickedCard.futureBaseId) {
      handleDoomsdayHandMenu(handIndex);
      return;
    }

    if (clickedCard.id === 'NM01' || clickedCard.id === 'NM02' || clickedCard.id === 'NM03') {
      handleNueaHandAbilityMenu(handIndex);
      return;
    }

    if (clickedCard.id === 'NM05' || clickedCard.isSpy) {
      if (!ai.board.some(m => m === null)) {
        setLog('⚠️ สนามของฝ่ายตรงข้ามเต็มทั้ง 3 ช่อง จึงไม่สามารถส่งสายลับไปลงได้!');
        return;
      }
      askCardUseConfirmation(clickedCard, 'ส่งสายลับใบนี้ลงบนสนามของฝ่ายตรงข้าม', () => {
        gameState.selectedAttackerSlot = null;
        gameState.selectedHandIndex = handIndex;
        setLog('🕵️ เลือก "สายลับไพร่เหนือ" แล้ว — คลิกที่ช่องว่างบนสนามของฝ่ายตรงข้าม (ด้านบน) เพื่อวางสายลับ!');
        renderGame();
      });
      return;
    }

    askCardUseConfirmation(clickedCard, 'อัญเชิญยูนิตใบนี้ลงสู่สนามของคุณ', () => {
      gameState.selectedAttackerSlot = null;
      gameState.selectedHandIndex = handIndex;
      setLog(`👉 ยืนยันเลือก "${clickedCard.name}" แล้ว — คลิกที่ช่องบนสนามของคุณเพื่อลงสนาม (วางทับช่องที่มีมอนสเตอร์ได้)!`);
      renderGame();
    });
    return;
  }

  // กรณีที่ 3: คลิกการ์ดเวทมนตร์
  if (isSpellCard(clickedCard)) {
    initiatePlayerSpell(handIndex);
  }
}

// เมื่อผู้เล่นคลิกที่ช่องบนสนามฝั่งตัวเอง
function handlePlayerSlotClick(slotIndex) {
  if (gameState.gameOver || gameState.isRollingDice) return;
  const awaitingBoardTarget = gameState.pendingAction && (
    (gameState.pendingAction.type === 'MODULAR_SELECT_TARGET' && ['PLAYER_BOARD', 'ANY_BOARD'].includes(gameState.pendingAction.targetZone)) ||
    gameState.pendingAction.type === 'CALL_FROM_EFFECT_SELECT_SLOT' ||
    gameState.pendingAction.type === 'JUTI_SELECT_SLOT'
  );
  if (gameState.activeTurn !== 'player' && !awaitingBoardTarget) return;

  const player = gameState.player;

  if (slotIndex === 'leader') {
    if (isInteractionBlocked()) {
      setLog('⏳ กรุณารอและดำเนินการเลือกของความสามารถให้เสร็จสิ้นก่อน!');
      return;
    }
    activateLeaderSkillPlayer();
    return;
  }

  if (isInteractionBlocked() && !awaitingBoardTarget) {
    setLog('⏳ กรุณารอและดำเนินการเลือกของความสามารถให้เสร็จสิ้นก่อน!');
    return;
  }

  const slotMonster = player.board[slotIndex];

  // --- ส่วนที่ 1: หากกำลังรอเลือกเป้าหมายจาก EffectEngine หรือการวางการ์ดพิเศษ ---
  if (gameState.pendingAction) {
    const action = gameState.pendingAction;

    if (action.type === 'MODULAR_SELECT_TARGET') {
      let accepted = false;
      if (action.targetZone === 'PLAYER_BOARD' && action.onSelectSlot) {
        accepted = action.onSelectSlot(slotIndex);
      } else if (action.targetZone === 'ANY_BOARD' && action.onSelectAnyBoardSlot) {
        accepted = action.onSelectAnyBoardSlot('PLAYER', slotIndex);
      }
      if (accepted) {
        action.remainingCount -= 1;
        if (action.remainingCount <= 0) {
          const doneCb = action.onAllSelected;
          gameState.pendingAction = null;
          if (doneCb) doneCb();
        } else {
          renderGame();
        }
      }
      return;
    }

    if (action.type === 'CALL_FROM_EFFECT_SELECT_SLOT') {
      const cardToPlace = action.cardToPlace;
      const callback = action.onAfterPlace;
      const skipDefaultOnSummon = !!action.skipDefaultOnSummon;
      let overwriteMsg = '';
      if (slotMonster !== null) {
        const overwritten = sendOverwrittenMonsterToGrave(player, slotIndex);
        overwriteMsg = ` (วางทับ "${overwritten.name}" ส่งลงนรกโดยไม่ถือว่าถูกทำลาย)`;
      }
      player.board[slotIndex] = cardToPlace;
      gameState.pendingAction = null;
      setLog(`✨ คอล "${cardToPlace.name}" ลงช่องที่ ${slotIndex + 1} สำเร็จ!${overwriteMsg}`);
      if (skipDefaultOnSummon) {
        renderGame();
        if (callback) callback(slotIndex);
      } else {
        EffectEngine.triggerCardEffects(cardToPlace, 'ON_SUMMON', {
          caster: player, opponent: gameState.ai, sourceCard: cardToPlace, sourceSlot: slotIndex, isAI: false
        }, () => {
          renderGame();
          if (callback) callback(slotIndex);
        });
      }
      return;
    }

    if (action.type === 'JUTI_SELECT_SLOT') {
      const summonIdx = action.summonHandIndex;
      const peasantIdx = player.hand.findIndex((c, idx) => idx !== summonIdx && c.id === 'NM01');
      if (peasantIdx === -1) {
        gameState.pendingAction = null;
        renderGame();
        return;
      }

      const summonedCard = player.hand[summonIdx];
      const peasantCard = player.hand[peasantIdx];
      [summonIdx, peasantIdx].sort((a, b) => b - a).forEach(idx => player.hand.splice(idx, 1));

      resetCardStateForZoneChange(peasantCard);
      player.graveyard.push(peasantCard);

      let overwriteMsg = '';
      if (slotMonster !== null) {
        const overwritten = sendOverwrittenMonsterToGrave(player, slotIndex);
        overwriteMsg = ` (วางทับ "${overwritten.name}" ส่งลงนรกโดยไม่ถือว่าถูกทำลาย)`;
      }

      resetCardStateForZoneChange(summonedCard);
      summonedCard.state = 'Stand';
      summonedCard.permPowerMod += 1;
      player.board[slotIndex] = summonedCard;
      gameState.pendingAction = null;

      setLog(`🔥 อัญเชิญจุติ "${summonedCard.name}" (พลัง +1 เป็น ${getEffectivePower(summonedCard, player)}) สำเร็จ!${overwriteMsg}`);
      if (summonedCard.id === 'NM02') triggerRoyalGuardJutiBonus(player);
      renderGame();
      return;
    }

    return;
  }

  // --- ส่วนที่ 2: การวาง Monster จากมือลงสนามตัวเอง (รันบล็อก ON_SUMMON อัตโนมัติ) ---
  if (gameState.phase === 'Main Phase' && gameState.selectedHandIndex !== null) {
    const selectedCard = player.hand[gameState.selectedHandIndex];
    if (!selectedCard || selectedCard.type !== 'Monster') return;

    if (selectedCard.cannotNormalSummon) {
      setLog(`🚫 "${selectedCard.name}" ไม่สามารถอัญเชิญแบบปกติได้!`);
      gameState.selectedHandIndex = null;
      renderGame();
      return;
    }

    if (selectedCard.id === 'NM05' || selectedCard.isSpy) {
      setLog('🕵️ "สายลับไพร่เหนือ" ต้องคลิกวางลงบนช่องว่างของสนามฝ่ายตรงข้าม (ด้านบน)!');
      return;
    }

    let overwriteMsg = '';
    if (player.board[slotIndex] !== null) {
      const overwritten = sendOverwrittenMonsterToGrave(player, slotIndex);
      overwriteMsg = ` (วางทับ "${overwritten.name}" ส่งลงนรกโดยไม่ถือว่าถูกทำลาย)`;
    }

    const summoned = player.hand.splice(gameState.selectedHandIndex, 1)[0];
    resetCardStateForZoneChange(summoned);
    summoned.state = 'Stand';
    player.board[slotIndex] = summoned;
    gameState.selectedHandIndex = null;

    setLog(`✅ อัญเชิญ "${summoned.name}" ลงช่องที่ ${slotIndex + 1} สำเร็จ!${overwriteMsg}`);
    EffectEngine.triggerCardEffects(summoned, 'ON_SUMMON', {
      caster: player,
      opponent: gameState.ai,
      sourceCard: summoned,
      sourceSlot: slotIndex,
      isAI: false
    }, () => renderGame());
    return;
  }

  // --- ส่วนที่ 3: คลิกยูนิทบนสนามตัวเองใน Main Phase (ใช้สกิล) หรือ Battle Phase (สั่งโจมตี) ---
  if (gameState.phase === 'Main Phase' && gameState.selectedHandIndex === null) {
    if (slotMonster) {
      activateMonsterOnBoardPlayer(slotIndex);
    }
    return;
  }

  if (gameState.phase === 'Battle Phase') {
    if (!slotMonster) return;

    if (slotMonster.id === 'DM08' && slotMonster.state === 'Rest') {
      const hasDebirun = player.board.some(m => m !== null && m.id === 'DM04');
      if (hasDebirun && player.hand.length >= 3 && !slotMonster.usedSkills.emiReattack) {
        showChoiceModal(
          '⚡ สกิลออโต้ของ เอมิ (โจมตีอีกครั้ง)',
          'บนสนามเรามี "เดบิรุน" อยู่! ต้องการทิ้งการ์ดบนมือ 3 ใบ เพื่อเปลี่ยน เอมิ เป็น Stand และโจมตีอีกครั้งหรือไม่?',
          [
            {
              label: '🔥 ทิ้งการ์ดบนมือ 3 ใบ -> Stand เอมิเพื่อโจมตีอีกครั้ง!',
              color: '#dc2626',
              onSelect: () => {
                for (let i = 0; i < 3; i++) {
                  const d = player.hand.pop();
                  resetCardStateForZoneChange(d);
                  player.graveyard.push(d);
                }
                slotMonster.state = 'Stand';
                slotMonster.usedSkills.emiReattack = true;
                setLog('⚡ [เอมิ] ทิ้งการ์ดบนมือ 3 ใบ และลุกขึ้น Stand พร้อมโจมตีอีกครั้ง!');
                renderGame();
              }
            },
            { label: '❌ ยกเลิก', color: '#475569', onSelect: () => renderGame() }
          ]
        );
        return;
      }
    }

    const check = canContestantAttack(player, slotMonster);
    if (!check.allowed) {
      setLog(`🚫 โจมตีไม่ได้: ${check.reason}`);
      return;
    }

    gameState.selectedAttackerSlot = (gameState.selectedAttackerSlot === slotIndex) ? null : slotIndex;
    setLog(gameState.selectedAttackerSlot !== null
      ? `⚔️ เลือก "${slotMonster.name}" (Power ${getEffectivePower(slotMonster, player)}) โจมตี — คลิกที่ยูนิทหรือ Leader ของฝ่ายตรงข้าม!`
      : 'ยกเลิกการเลือกโจมตี');
    renderGame();
  }
}

function handleAISlotClick(aiSlotIndex) {
  if (gameState.gameOver) return;
  // สกิลของเราที่ทำงานในเทิร์นอีกฝ่าย (เช่น ทีเร็กซ์ชนะตอนป้องกัน) ยังรอให้เลือกเป้าหมาย → ต้องคลิกได้ ไม่งั้นเทิร์นอีกฝ่ายค้าง
  const awaitingOurTarget = gameState.pendingAction && gameState.pendingAction.type === 'MODULAR_SELECT_TARGET' && ['OPPONENT_BOARD', 'ANY_BOARD'].includes(gameState.pendingAction.targetZone);
  if (gameState.activeTurn !== 'player' && !awaitingOurTarget) return;

  if (isInteractionBlocked() && !awaitingOurTarget) {
    setLog('⏳ กรุณารอและดำเนินการเลือกของความสามารถให้เสร็จสิ้นก่อน!');
    return;
  }
  const player = gameState.player;
  const ai = gameState.ai;
  const targetMonster = ai.board[aiSlotIndex];

  if (gameState.phase === 'Main Phase' && gameState.selectedHandIndex !== null && !gameState.pendingAction) {
    const selectedCard = player.hand[gameState.selectedHandIndex];
    if (selectedCard && (selectedCard.id === 'NM05' || selectedCard.isSpy)) {
      if (targetMonster !== null) {
        setLog('⚠️ ช่องนี้ของฝ่ายตรงข้ามมียูนิทอยู่แล้ว กรุณาคลิกเลือกช่องว่าง!');
        return;
      }
      const spy = player.hand.splice(gameState.selectedHandIndex, 1)[0];
      resetCardStateForZoneChange(spy);
      spy.state = 'Stand';
      spy.originalOwner = player;
      ai.board[aiSlotIndex] = spy;
      gameState.selectedHandIndex = null;
      setLog(`🕵️ อัญเชิญ "สายลับไพร่เหนือ" ลงไปยึดช่องที่ ${aiSlotIndex + 1} บนสนามของฝ่ายตรงข้ามสำเร็จ!`);
      renderGame();
      return;
    }
  }

  // รับการคลิกเลือกเป้าหมายฝั่งตรงข้ามจาก EffectEngine
  if (gameState.pendingAction) {
    const action = gameState.pendingAction;
    if (action.type === 'MODULAR_SELECT_TARGET') {
      let accepted = false;
      if (action.targetZone === 'OPPONENT_BOARD' && action.onSelectSlot) {
        accepted = action.onSelectSlot(aiSlotIndex);
      } else if (action.targetZone === 'ANY_BOARD' && action.onSelectAnyBoardSlot) {
        accepted = action.onSelectAnyBoardSlot('OPPONENT', aiSlotIndex);
      }
      if (accepted) {
        action.remainingCount -= 1;
        const stillHasValidEnemy = ai.board.some(m => m !== null);
        if (action.remainingCount <= 0 || !stillHasValidEnemy) {
          const doneCb = action.onAllSelected;
          gameState.pendingAction = null;
          if (doneCb) doneCb();
        } else {
          setLog(`👉 เลือกเป้าหมายต่อไป (เหลืออีก ${action.remainingCount} ใบ)!`);
          renderGame();
        }
      }
      return;
    }
    return;
  }

  // โจมตีใส่ Monster ของฝ่ายตรงข้าม (ใน Battle Phase)
  if (gameState.phase !== 'Battle Phase' || gameState.selectedAttackerSlot === null) {
    return;
  }
  if (!targetMonster) {
    setLog('⚠️ ช่องนี้ไม่มีมอนสเตอร์ให้โจมตี!');
    return;
  }

  if (targetMonster.id === 'DM03' && ai.board.some(m => m !== null && m.id === 'DM05')) {
    setLog('🛡️ "มายอา" ไม่ตกเป็นเป้าหมายการโจมตีตราบเท่าที่มี "ซึรุรุ" อยู่บนสนาม!');
    return;
  }

  executeAttack(player, ai, gameState.selectedAttackerSlot, 'monster', aiSlotIndex);
}

document.getElementById('ai-leader-box').addEventListener('click', () => {
  if (gameState.gameOver || gameState.activeTurn !== 'player' || gameState.phase !== 'Battle Phase') return;
  if (gameState.pendingAction || gameState.selectedAttackerSlot === null) return;

  executeAttack(gameState.player, gameState.ai, gameState.selectedAttackerSlot, 'leader', null);
});

/* ============================================================================
   หมวดที่ 7: ระบบเอฟเฟกต์แอนิเมชัน (Visual FX) และระบบการต่อสู้ / INTERCEPT
   ============================================================================ */

// 🎨 สร้าง CSS Animation สำหรับเอฟเฟกต์การลงการ์ด โชว์สกิล และการพุ่งโจมตีอัตโนมัติ
function ensureVisualEffectsStyles() {
  if (document.getElementById('tcg-visual-fx-styles')) return;
  const style = document.createElement('style');
  style.id = 'tcg-visual-fx-styles';
  style.textContent = `
    /* เอฟเฟกต์ตอนใช้สกิลบัฟพลัง */
    @keyframes skillGlowPulse {
      0% { transform: scale(1); box-shadow: 0 0 5px #38bdf8; }
      50% { transform: scale(1.12); box-shadow: 0 0 30px #38bdf8, 0 0 15px #4ade80; filter: brightness(1.5); }
      100% { transform: scale(1); box-shadow: 0 0 5px #38bdf8; }
    }
    .fx-skill-glow {
      animation: skillGlowPulse 0.65s ease-in-out !important;
      z-index: 25 !important;
    }

    /* เอฟเฟกต์พุ่งโจมตี (ฝั่ง AI พุ่งลงล่าง / ฝั่ง Player พุ่งขึ้นบน) */
    @keyframes lungeDownAI {
      0% { transform: translateY(0) scale(1); }
      45% { transform: translateY(42px) scale(1.15); box-shadow: 0 0 30px #ef4444; }
      100% { transform: translateY(0) scale(1); }
    }
    @keyframes lungeUpPlayer {
      0% { transform: translateY(0) scale(1); }
      45% { transform: translateY(-42px) scale(1.15); box-shadow: 0 0 30px #f59e0b; }
      100% { transform: translateY(0) scale(1); }
    }
    .fx-attack-ai {
      animation: lungeDownAI 0.55s ease-in-out !important;
      z-index: 30 !important;
    }
    .fx-attack-player {
      animation: lungeUpPlayer 0.55s ease-in-out !important;
      z-index: 30 !important;
    }

    /* เอฟเฟกต์เป้าหมายถูกโจมตีหรือถูกทำลาย */
    @keyframes targetHitShake {
      0%, 100% { transform: translateX(0); }
      20% { transform: translateX(-10px) rotate(-3deg); filter: brightness(2) sepia(1) hue-rotate(-50deg) saturate(5); }
      40% { transform: translateX(10px) rotate(3deg); }
      60% { transform: translateX(-8px); }
      80% { transform: translateX(8px); }
    }
    .fx-target-hit {
      animation: targetHitShake 0.55s ease-in-out !important;
      box-shadow: 0 0 32px #dc2626 !important;
    }

    /* แบนเนอร์โชว์การ์ด/สกิลกลางจอ (Cut-in Showcase) */
    #fx-card-cutin-banner {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) scale(0.85);
      z-index: 350;
      background: linear-gradient(135deg, rgba(15, 23, 42, 0.96), rgba(30, 41, 59, 0.96));
      border: 2px solid #fbbf24;
      border-radius: 16px;
      padding: 14px 22px;
      display: none;
      align-items: center;
      gap: 16px;
      box-shadow: 0 15px 40px rgba(0, 0, 0, 0.85), 0 0 30px rgba(251, 191, 36, 0.5);
      pointer-events: none;
      transition: opacity 0.25s ease, transform 0.25s ease;
      opacity: 0;
      min-width: 290px;
      max-width: 90vw;
    }
    #fx-card-cutin-banner.show {
      display: flex;
      opacity: 1;
      transform: translate(-50%, -50%) scale(1);
    }
    #fx-card-cutin-banner img {
      width: 72px;
      height: 100px;
      object-fit: cover;
      border-radius: 8px;
      border: 2px solid #38bdf8;
      flex-shrink: 0;
    }
    .cutin-info-actor {
      font-size: 11px;
      font-weight: bold;
      color: #38bdf8;
      letter-spacing: 0.5px;
      margin-bottom: 2px;
    }
    .cutin-info-title {
      font-size: 17px;
      font-weight: 900;
      color: #fbbf24;
      margin-bottom: 4px;
    }
    .cutin-info-sub {
      font-size: 13px;
      color: #f8fafc;
      line-height: 1.35;
    }
  `;
  document.head.appendChild(style);

  if (!document.getElementById('fx-card-cutin-banner')) {
    const banner = document.createElement('div');
    banner.id = 'fx-card-cutin-banner';
    banner.innerHTML = `
      <img id="cutin-img" src="" alt="Card">
      <div>
        <div class="cutin-info-actor" id="cutin-actor">ACTION</div>
        <div class="cutin-info-title" id="cutin-title">Card Name</div>
        <div class="cutin-info-sub" id="cutin-sub">Effect description</div>
      </div>
    `;
    document.body.appendChild(banner);
  }
}

let cutinTimeoutId = null;
function showCardShowcaseBanner(card, actorName, actionSubText, borderColor = '#fbbf24', duration = 1050) {
  if (!card) return;
  const isAIActor = String(actorName || '').includes('AI') || String(actorName || '').includes('ฝ่ายตรงข้าม');
  gameState._pendingBannerCard = {
    card,
    actorName,
    actionSubText,
    isAI: isAIActor,
    ts: Date.now()
  };
  gameState.lastPlayedCardInfo = {
    card,
    actorName: actorName || (isAIActor ? '🤖 ฝ่ายตรงข้าม' : '👤 ฝั่งเรา'),
    actionSubText: actionSubText || '',
    message: `${actorName}: ${actionSubText}`,
    turn: gameState.turnCount || 1,
    isAI: isAIActor,
    category: 'SPELL',
    time: new Date().toLocaleTimeString('th-TH', { hour12: false })
  };
  updateLastPlayedCardWidget(gameState.lastPlayedCardInfo);
  updateCardDetailPanel(card);

  ensureVisualEffectsStyles();
  const banner = document.getElementById('fx-card-cutin-banner');
  if (!banner) return;

  document.getElementById('cutin-img').src = card.image || '';
  document.getElementById('cutin-actor').textContent = `⚡ ${actorName}`;
  document.getElementById('cutin-title').textContent = card.name;
  document.getElementById('cutin-sub').textContent = actionSubText;
  banner.style.borderColor = borderColor;

  if (cutinTimeoutId) clearTimeout(cutinTimeoutId);
  banner.classList.add('show');
  cutinTimeoutId = setTimeout(() => {
    banner.classList.remove('show');
  }, duration);
}

function getSlotElement(isPlayerSide, slotIndex) {
  if (slotIndex === 'leader' || slotIndex === null) {
    return document.getElementById(isPlayerSide ? 'player-leader-box' : 'ai-leader-box');
  }
  const boardId = isPlayerSide ? 'player-board' : 'ai-board';
  const boardEl = document.getElementById(boardId);
  if (!boardEl) return null;
  const slots = boardEl.querySelectorAll('.slot');
  return slots[slotIndex] || null;
}

function playSlotAnimation(isPlayerSide, slotIndex, cssClass, duration = 650) {
  ensureVisualEffectsStyles();
  const slotEl = getSlotElement(isPlayerSide, slotIndex);
  if (!slotEl) return;
  const targetEl = (slotIndex !== 'leader' && slotIndex !== null && slotEl.querySelector('.card'))
    ? slotEl.querySelector('.card')
    : slotEl;

  targetEl.classList.remove(cssClass);
  void targetEl.offsetWidth; // รีเซ็ตแอนิเมชันให้เล่นซ้ำได้ทันที
  targetEl.classList.add(cssClass);
  setTimeout(() => {
    targetEl.classList.remove(cssClass);
  }, duration);
}

function playAttackVisualAnimation(attacker, defender, attackerSlot, targetType, targetSlot, onAnimDone) {
  ensureVisualEffectsStyles();
  const isAttackerPlayer = (attacker === gameState.player);
  const isDefenderPlayer = (defender === gameState.player);
  const attackerMonster = attacker.board[attackerSlot];

  if (attackerMonster) {
    const targetName = targetType === 'leader'
      ? `Leader (${defender.leader.name})`
      : (defender.board[targetSlot] ? defender.board[targetSlot].name : 'เป้าหมาย');
    showCardShowcaseBanner(
      attackerMonster,
      `${attacker.name} ประกาศโจมตี!`,
      `⚔️ "${attackerMonster.name}" โจมตีใส่ ${targetName}!`,
      '#ef4444',
      800
    );
  }

  playSlotAnimation(isAttackerPlayer, attackerSlot, isAttackerPlayer ? 'fx-attack-player' : 'fx-attack-ai', 600);
  const defTargetSlot = (targetType === 'leader') ? 'leader' : targetSlot;
  setTimeout(() => {
    playSlotAnimation(isDefenderPlayer, defTargetSlot, 'fx-target-hit', 600);
  }, 200);

  setTimeout(() => {
    if (onAnimDone) onAnimDone();
  }, 680);
}

function triggerBelphegorAttackSuccess(attacker, defender, attackingMonster) {
  if (!attackingMonster || attackingMonster.id !== 'DMM07') return;
  let movedMsg = [];
  if (attacker.deck.length > 0) {
    const c = attacker.deck.pop();
    resetCardStateForZoneChange(c);
    attacker.darkDimension.push(c);
    movedMsg.push(`${attacker.name}: "${c.name}"`);
  }
  if (defender.deck.length > 0) {
    const c = defender.deck.pop();
    resetCardStateForZoneChange(c);
    defender.darkDimension.push(c);
    movedMsg.push(`${defender.name}: "${c.name}"`);
  }
  if (movedMsg.length > 0) {
    setLog(`💤 [ออโต้ - เบลเฟกอร์ บาปเกียจคร้าน] โจมตีสำเร็จ! นำการ์ดใบบนสุดของทั้ง 2 ฝั่งเข้ามิติมืดของตน (${movedMsg.join(' | ')})!`);
    checkGameOver();
  }
}

// ฟังก์ชันหลักเมื่อสั่งโจมตี (เพิ่มแอนิเมชันพุ่งโจมตีก่อนประมวลผล)
function executeAttack(attacker, defender, attackerSlot, targetType, targetSlot, onCompleteCallback = null) {
  const attackingMonster = attacker.board[attackerSlot];
  const check = canContestantAttack(attacker, attackingMonster);
  if (!check.allowed) {
    if (onCompleteCallback) onCompleteCallback();
    return;
  }

  // 🐍 ตรวจสอบว่ายูนิทที่สั่งโจมตีถูกสกิลของ "ลิเวียธาน บาปความริษยา" (DMM03) ล็อกเป้าไว้หรือไม่
  if (attackingMonster.tauntedByLeviathanUid) {
    const leviSlot = defender.board.findIndex(m => m && m.uid === attackingMonster.tauntedByLeviathanUid);
    if (leviSlot !== -1) {
      targetType = 'monster';
      targetSlot = leviSlot;
      setLog(`🐍 [สกิลลิเวียธาน บาปความริษยา] เปลี่ยนเป้าหมายการโจมตีของ "${attackingMonster.name}" มาที่ "ลิเวียธาน บาปความริษยา" แทน!`);
    }
    attackingMonster.tauntedByLeviathanUid = null;
  }

  attackingMonster.state = 'Rest';
  attacker.attacksThisTurn += 1;
  gameState.selectedAttackerSlot = null;

  const proceedWithAttackExecution = (unblockableAttack = false) => {
    attackingMonster.unblockableThisAttack = unblockableAttack;
    playAttackVisualAnimation(attacker, defender, attackerSlot, targetType, targetSlot, () => {
      // 🌐 กรณีโหมด PvP และเราเป็นคนสั่งโจมตี: ส่งคำสั่งไปให้เครื่องของเพื่อนเป็นคนเลือกป้องกันเอง
      if (typeof pvpState !== 'undefined' && pvpState.isMultiplayer && attacker === gameState.player) {
        pvpState.waitingForDefense = true;
        disableControls();
        _originalSetLog(`⚔️ สั่ง "${attackingMonster.name}" โจมตีแล้ว — ⏳ รอฝ่ายตรงข้ามตัดสินใจป้องกัน...`);
        _originalRenderGame();

        sendPvpPacket({
          type: 'DECLARE_ATTACK',
          attackerSlot,
          targetType,
          targetSlot,
          senderData: gameState.player,
          receiverData: gameState.ai
        });
        return;
      }

      checkDefenderAttackReactions(attacker, defender, attackerSlot, targetType, targetSlot, onCompleteCallback);
    });
  };

  // ⚡ ตรวจสอบเวทรีแอคฝ่ายบุก: "เร็วขึ้นอีก!!!!!!" (OS03) เมื่อ "ไอแบงค์บ้าเกม" (OM02) โจมตี
  const os03Idx = attacker.hand.findIndex(c => c && c.id === 'OS03');
  if (attackingMonster.id === 'OM02' && os03Idx !== -1 && attacker.spellQuota.reactionUsed < 1 && targetType === 'leader') {
    if (attacker !== gameState.player) {
      if (aiConfig.difficulty !== 'EASY') {
        const spell = attacker.hand.splice(os03Idx, 1)[0];
        attacker.spellQuota.reactionUsed += 1;
        resetCardStateForZoneChange(spell);
        attacker.graveyard.push(spell);
        showCardShowcaseBanner(spell, 'AI ใช้เวทรีแอค เร็วขึ้นอีก!!!!!!', '⚔️ การโจมตีของ "ไอแบงค์บ้าเกม" ไม่สามารถนำยูนิทมาป้องกันได้!', '#38bdf8', 1100);
        setLog('⚡ [AI - เร็วขึ้นอีก!!!!!!] เมื่อ "ไอแบงค์บ้าเกม" โจมตี ฝ่ายตรงข้ามไม่สามารถนำยูนิทมาป้องกันการโจมตีนี้ได้!');
        proceedWithAttackExecution(true);
        return;
      }
    } else {
      showChoiceModal(
        '⚡ สั่งใช้งานเวทรีแอค: เร็วขึ้นอีก!!!!!!',
        '"ไอแบงค์บ้าเกม" กำลังประกาศโจมตี! คุณต้องการร่าย "เร็วขึ้นอีก!!!!!!" จากบนมือ เพื่อให้ฝ่ายตรงข้ามไม่สามารถนำยูนิทมาป้องกัน (Intercept) การโจมตีนี้ได้หรือไม่?',
        [
          {
            label: '⚡ ร่าย "เร็วขึ้นอีก!!!!!!" (ห้ามอีกฝ่ายนำยูนิทมาป้องกันการโจมตีนี้!)',
            color: '#0284c7',
            onSelect: () => {
              const idx = attacker.hand.findIndex(c => c && c.id === 'OS03');
              if (idx !== -1) {
                const spell = attacker.hand.splice(idx, 1)[0];
                attacker.spellQuota.reactionUsed += 1;
                resetCardStateForZoneChange(spell);
                attacker.graveyard.push(spell);
                setLog('⚡ [เร็วขึ้นอีก!!!!!!] ร่ายเวทรีแอคสำเร็จ — ฝ่ายตรงข้ามไม่สามารถนำยูนิทมาป้องกันการโจมตีของ "ไอแบงค์บ้าเกม" ได้!');
              }
              proceedWithAttackExecution(true);
            }
          },
          {
            label: 'ไม่ใช้ (โจมตีตามปกติ)',
            color: '#475569',
            onSelect: () => proceedWithAttackExecution(false)
          }
        ]
      );
      return;
    }
  }

  proceedWithAttackExecution(false);
}

function checkDefenderAttackReactions(attacker, defender, attackerSlot, targetType, targetSlot, onCompleteCallback) {
  const attackingMonster = attacker.board[attackerSlot];
  if (!attackingMonster) {
    if (onCompleteCallback) onCompleteCallback();
    return;
  }

  const isLocalDefender = (defender === gameState.player);

  const continueNormalAttackFlow = () => {
    if (targetType === 'monster') {
      compareAndDestroyMonsters(attacker, attackerSlot, defender, targetSlot, (msg) => {
        setLog(`⚔️ [${attacker.name}] สั่ง "${attackingMonster.name}" โจมตี! -> ${msg}`);
        renderGame();
        checkGameOver();
        if (onCompleteCallback) onCompleteCallback();
      });
    } else {
      checkWhenLeaderAttacked(attacker, defender, attackerSlot, onCompleteCallback);
    }
  };

  const canUseMayaOnce = defender.board.some(m => m !== null && m.id === 'DM03')
    && !defender.mayaOncePerGameUsed
    && defender.deck.length > 0;

  const nonSpellsInGrave = defender.graveyard.filter(c => c.type === 'Monster');
  const ds02InHandIdx = defender.hand.findIndex(c => c.id === 'DS02');
  const canUseWeWillHelp = (ds02InHandIdx !== -1)
    && (nonSpellsInGrave.length >= 5)
    && (defender.spellQuota.reactionUsed < 1);

  const dinoCountOnDefenderBoard = defender.board.filter(m => m !== null && hasCardTribe(m, 'ไดโน')).length;
  const dns03InHandIdx = defender.hand.findIndex(c => c.id === 'DNS03');
  const canUseMeteor = (dns03InHandIdx !== -1)
    && (dinoCountOnDefenderBoard >= 2)
    && (defender.spellQuota.reactionUsed < 1);

  const demonCountOnDefenderBoard = defender.board.filter(m => m !== null && hasCardTribe(m, 'ปีศาจ')).length;
  const dms02InHandIdx = defender.hand.findIndex(c => c.id === 'DMS02');
  const canUseForbiddenWarning = (dms02InHandIdx !== -1)
    && (demonCountOnDefenderBoard >= 1)
    && (defender.spellQuota.reactionUsed < 1);

  // 🤖 กรณีฝ่ายตั้งรับเป็น AI: ให้ AI ตัดสินใจใช้สกิลเองพร้อมโชว์แบนเนอร์ให้ผู้เล่นเห็นชัดๆ (ระดับ EASY จะไม่ใช้เวทรีแอคซับซ้อน)
  if (!isLocalDefender) {
    if (aiConfig.difficulty === 'EASY') {
      continueNormalAttackFlow();
      return;
    }
    if (canUseForbiddenWarning && (targetType === 'leader' || defender.leader.hp <= 4)) {
      const spellCard = defender.hand.splice(dms02InHandIdx, 1)[0];
      defender.spellQuota.reactionUsed += 1;
      defender.graveyard.push(spellCard);

      showCardShowcaseBanner(spellCard, 'AI ใช้เวทรีแอค คำเตือนต้องห้าม!', '🌌 ทั้งสองฝ่ายนำการ์ดบนมือตนเอง 1 ใบเข้ามิติมืด และยกเลิกการโจมตี!', '#7c3aed', 1200);

      if (attackingMonster.id === 'DM06') {
        const atkRoll = Math.floor(Math.random() * 6) + 1;
        const defRoll = Math.floor(Math.random() * 6) + 1;
        if (atkRoll < defRoll) {
          setLog(`🎲 [ออโต้ - โซเนบุ] โซเนบุทอยได้ [${atkRoll}] ชนะ AI [${defRoll}] -> เวทย์ "คำเตือนต้องห้าม" ของ AI ไร้ผล!`);
          renderGame();
          continueNormalAttackFlow();
          return;
        }
      }

      if (defender.hand.length > 0) {
        const landIdx = defender.hand.findIndex(c => c.type === 'LandSpell');
        const c = defender.hand.splice(landIdx !== -1 ? landIdx : 0, 1)[0];
        resetCardStateForZoneChange(c);
        defender.darkDimension.push(c);
      }

      if (attacker.hand.length > 0) {
        gameState.pendingAction = {
          type: 'MODULAR_SELECT_TARGET',
          targetZone: 'PLAYER_HAND',
          remainingCount: 1,
          promptText: '🌌 [AI ใช้คำเตือนต้องห้าม] คลิกเลือกการ์ดบนมือของคุณ 1 ใบเพื่อนำเข้าสู่ "มิติมืด" (การโจมตีถูกยกเลิก):',
          onSelectHand: (hIdx) => {
            const c = attacker.hand.splice(hIdx, 1)[0];
            resetCardStateForZoneChange(c);
            attacker.darkDimension.push(c);
            setLog(`🌌 [คำเตือนต้องห้าม] ทั้งสองฝ่ายนำการ์ดบนมือ 1 ใบเข้ามิติมืด และยกเลิกการโจมตี!`);
            checkGameOver();
          },
          onAllSelected: () => {
            renderGame();
            if (onCompleteCallback) onCompleteCallback();
          }
        };
        setLog(gameState.pendingAction.promptText);
        renderGame();
        return;
      }

      setLog('🌌 [AI - คำเตือนต้องห้าม] ทั้งสองฝ่ายนำการ์ดบนมือ 1 ใบเข้ามิติมืด และยกเลิกการโจมตี!');
      checkGameOver();
      renderGame();
      if (onCompleteCallback) onCompleteCallback();
      return;
    }

    if (canUseMeteor && (targetType === 'leader' || defender.leader.hp <= 4)) {
      const spellCard = defender.hand.splice(dns03InHandIdx, 1)[0];
      defender.spellQuota.reactionUsed += 1;
      defender.graveyard.push(spellCard);

      showCardShowcaseBanner(spellCard, 'AI ใช้เวทรีแอค เมเทโอ!', '☄️ ทำลายการ์ดทั้งหมดบนสนามทั้ง 2 ฝั่ง!', '#dc2626', 1200);

      if (attackingMonster.id === 'DM06') {
        const atkRoll = Math.floor(Math.random() * 6) + 1;
        const defRoll = Math.floor(Math.random() * 6) + 1;
        if (atkRoll < defRoll) {
          setLog(`🎲 [ออโต้ - โซเนบุ] โซเนบุทอยได้ [${atkRoll}] ชนะ AI [${defRoll}] -> เวทย์ "เมเทโอ" ของ AI ไร้ผล!`);
          renderGame();
          continueNormalAttackFlow();
          return;
        }
      }

      for (let i = 0; i < 3; i++) {
        if (defender.board[i]) destroyBoardMonster(defender, i, false, false);
        if (attacker.board[i]) destroyBoardMonster(attacker, i, false, true);
      }
      setLog('☄️ [AI - เมเทโอ] AI สั่งใช้งาน "เมเทโอ"! ทำลายการ์ดทั้งหมดบนสนามทั้ง 2 ฝั่งและหยุดการโจมตี!');
      renderGame();
      if (onCompleteCallback) onCompleteCallback();
      return;
    }

    if (canUseWeWillHelp && (targetType === 'leader' || defender.leader.hp <= 3)) {
      const spellCard = defender.hand.splice(ds02InHandIdx, 1)[0];
      defender.spellQuota.reactionUsed += 1;
      let returnedCount = 0;
      for (let i = defender.graveyard.length - 1; i >= 0 && returnedCount < 5; i--) {
        if (defender.graveyard[i].type === 'Monster') {
          const unit = defender.graveyard.splice(i, 1)[0];
          resetCardStateForZoneChange(unit);
          defender.deck.push(unit);
          returnedCount += 1;
        }
      }
      defender.deck = shuffleDeck(defender.deck);
      defender.graveyard.push(spellCard);

      showCardShowcaseBanner(spellCard, 'AI ใช้เวทย์ป้องกัน!', 'นำยูนิต 5 ใบในนรกเข้ากอง และยกเลิกการโจมตี!', '#a855f7', 1200);

      if (attackingMonster.id === 'DM06') {
        const atkRoll = Math.floor(Math.random() * 6) + 1;
        const defRoll = Math.floor(Math.random() * 6) + 1;
        if (atkRoll < defRoll) {
          setLog(`🎲 [ออโต้ - โซเนบุ] โซเนบุทอยได้ [${atkRoll}] ชนะ AI [${defRoll}] -> เวทย์ "พวกเราจะช่วยเอง" ของ AI ไร้ผล!`);
          renderGame();
          continueNormalAttackFlow();
          return;
        }
      }
      setLog(`🛡️ [AI - พวกเราจะช่วยเอง] AI นำยูนิต 5 ใบในนรกกลับเข้ากอง — ยกเลิกการโจมตีของคุณ!`);
      renderGame();
      if (onCompleteCallback) onCompleteCallback();
      return;
    }

    if (canUseMayaOnce && targetType === 'leader' && defender.leader.hp <= 2) {
      defender.mayaOncePerGameUsed = true;
      const mayaCard = defender.board.find(m => m && m.id === 'DM03');
      const topCard = defender.deck[defender.deck.length - 1];
      showCardShowcaseBanner(mayaCard, 'AI สั่งใช้สกิล 1 เกม!', `เปิดท็อปกองได้ "${topCard ? topCard.name : '-'}"`, '#7c3aed', 1200);

      if (topCard && topCard.id === 'DM06') {
        setLog(`🔮 [AI มายอา - 1 เกม] เปิดท็อปกองพบ "โซเนบุ"! บังคับจบเทิร์นของคุณทันที!`);
        renderGame();
        triggerPlayerPassTurn();
        return;
      } else {
        setLog(`🔮 [AI มายอา - 1 เกม] AI เปิดท็อปกองได้ "${topCard ? topCard.name : '-'}" (ไม่ใช่โซเนบุ การโจมตีดำเนินต่อ)`);
        renderGame();
      }
    }

    continueNormalAttackFlow();
    return;
  }

  // 👤 กรณีเราเป็นฝ่ายถูกโจมตี: เด้งถามเฉพาะการ์ดของเราเอง
  if (canUseMayaOnce || canUseWeWillHelp || canUseMeteor || canUseForbiddenWarning) {
    const options = [];

    if (canUseForbiddenWarning) {
      options.push({
        label: '🌌 ใช้การ์ด "คำเตือนต้องห้าม": เราและฝ่ายตรงข้ามนำการ์ดบนมือตนเอง 1 ใบเข้ามิติมืด และยกเลิกการโจมตี!',
        color: '#7c3aed',
        onSelect: () => {
          const spellCard = defender.hand.splice(dms02InHandIdx, 1)[0];
          defender.spellQuota.reactionUsed += 1;
          defender.graveyard.push(spellCard);

          if (attackingMonster.id === 'DM06') {
            const atkRoll = Math.floor(Math.random() * 6) + 1;
            const defRoll = Math.floor(Math.random() * 6) + 1;
            if (atkRoll < defRoll) {
              setLog(`🎲 [ออโต้ - โซเนบุ] โซเนบุทอยได้ [${atkRoll}] น้อยกว่าคุณ [${defRoll}] -> โซเนบุชนะ! เวทย์ "คำเตือนต้องห้าม" ไร้ผล!`);
              renderGame();
              continueNormalAttackFlow();
              return;
            }
          }

          // ฝ่ายตรงข้าม (AI) นำการ์ดบนมือ 1 ใบเข้ามิติมืด
          if (attacker.hand.length > 0) {
            const oppCard = attacker.hand.pop();
            resetCardStateForZoneChange(oppCard);
            attacker.darkDimension.push(oppCard);
          }

          // หากเรามีการ์ดบนมือเหลืออยู่ ให้คลิกเลือก 1 ใบเข้ามิติมืด
          if (defender.hand.length > 0) {
            gameState.pendingAction = {
              type: 'MODULAR_SELECT_TARGET',
              targetZone: 'PLAYER_HAND',
              remainingCount: 1,
              promptText: '🌌 [คำเตือนต้องห้าม] คลิกเลือกการ์ดบนมือของคุณ 1 ใบเพื่อนำเข้าสู่ "มิติมืด" (การโจมตีถูกยกเลิกแล้ว!):',
              onSelectHand: (hIdx) => {
                const myCard = defender.hand.splice(hIdx, 1)[0];
                resetCardStateForZoneChange(myCard);
                defender.darkDimension.push(myCard);
                setLog(`🌌 [คำเตือนต้องห้าม] นำ "${myCard.name}" และการ์ดบนมืออีกฝั่ง 1 ใบเข้ามิติมืด — ยกเลิกการโจมตีสำเร็จ!`);
                checkGameOver();
              },
              onAllSelected: () => {
                renderGame();
                if (onCompleteCallback) onCompleteCallback();
              }
            };
            setLog(gameState.pendingAction.promptText);
            renderGame();
            return;
          }

          setLog('🌌 [คำเตือนต้องห้าม] นำการ์ดบนมือเข้ามิติมืด และยกเลิกการโจมตีสำเร็จ!');
          checkGameOver();
          renderGame();
          if (onCompleteCallback) onCompleteCallback();
        }
      });
    }

    if (canUseMeteor) {
      options.push({
        label: '☄️ ใช้การ์ด "เมเทโอ": ทำลายการ์ดทั้งหมดบนสนามทั้ง 2 ฝั่ง (เมื่อเรามียูนิทเผ่าไดโน 2 ใบขึ้นไป)!',
        color: '#dc2626',
        onSelect: () => {
          const spellCard = defender.hand.splice(dns03InHandIdx, 1)[0];
          defender.spellQuota.reactionUsed += 1;
          defender.graveyard.push(spellCard);

          if (attackingMonster.id === 'DM06') {
            const atkRoll = Math.floor(Math.random() * 6) + 1;
            const defRoll = Math.floor(Math.random() * 6) + 1;
            if (atkRoll < defRoll) {
              setLog(`🎲 [ออโต้ - โซเนบุ] โซเนบุทอยได้ [${atkRoll}] น้อยกว่าคุณ [${defRoll}] -> โซเนบุชนะ! เวทย์ "เมเทโอ" ไร้ผล!`);
              renderGame();
              continueNormalAttackFlow();
              return;
            }
          }

          for (let i = 0; i < 3; i++) {
            if (defender.board[i]) destroyBoardMonster(defender, i, false, false);
            if (attacker.board[i]) destroyBoardMonster(attacker, i, false, true);
          }
          setLog('☄️ [เมเทโอ] มียูนิทเผ่าไดโน 2 ใบขึ้นไปบนสนาม — ทำลายการ์ดทั้งหมดบนสนามทั้ง 2 ฝั่งสำเร็จ!');
          renderGame();
          if (onCompleteCallback) onCompleteCallback();
        }
      });
    }

    if (canUseMayaOnce) {
      options.push({
        label: '🔮 สั่งใช้สกิล 1 เกมของ "มายอา": เปิดท็อปกอง 1 ใบ ถ้าเป็น "โซเนบุ" อีกฝ่ายจบเทิร์นทันที!',
        color: '#7c3aed',
        onSelect: () => {
          defender.mayaOncePerGameUsed = true;
          const topCard = defender.deck[defender.deck.length - 1];
          if (topCard && topCard.id === 'DM06') {
            setLog(`🔮 [มายอา - 1 เกม] เปิดท็อปกองพบ "${topCard.name}"! บังคับให้ฝ่ายตรงข้ามจบเทิร์นทันที!`);
            renderGame();
            if (typeof pvpState !== 'undefined' && pvpState.isMultiplayer) {
              if (onCompleteCallback) onCompleteCallback('FORCE_END_TURN');
            } else {
              endAITurn();
            }
          } else {
            setLog(`🔮 [มายอา - 1 เกม] เปิดท็อปกองได้ "${topCard ? topCard.name : '-'}" (ไม่ใช่โซเนบุ การโจมตีดำเนินต่อ)`);
            renderGame();
            continueNormalAttackFlow();
          }
        }
      });
    }

    if (canUseWeWillHelp) {
      options.push({
        label: '🛡️ ใช้การ์ด "พวกเราจะช่วยเอง": นำยูนิต 5 ใบในนรกกลับเข้ากอง แล้วยกเลิกการโจมตี!',
        color: '#0284c7',
        onSelect: () => {
          const spellCard = defender.hand.splice(ds02InHandIdx, 1)[0];
          defender.spellQuota.reactionUsed += 1;

          let returnedCount = 0;
          for (let i = defender.graveyard.length - 1; i >= 0 && returnedCount < 5; i--) {
            if (defender.graveyard[i].type === 'Monster') {
              const unit = defender.graveyard.splice(i, 1)[0];
              resetCardStateForZoneChange(unit);
              defender.deck.push(unit);
              returnedCount += 1;
            }
          }
          defender.deck = shuffleDeck(defender.deck);
          defender.graveyard.push(spellCard);

          if (attackingMonster.id === 'DM06') {
            const atkRoll = Math.floor(Math.random() * 6) + 1;
            const defRoll = Math.floor(Math.random() * 6) + 1;
            if (atkRoll < defRoll) {
              setLog(`🎲 [ออโต้ - โซเนบุ] โซเนบุทอยได้ [${atkRoll}] น้อยกว่าคุณ [${defRoll}] -> โซเนบุชนะ! เวทย์ "พวกเราจะช่วยเอง" ไร้ผล!`);
              renderGame();
              continueNormalAttackFlow();
              return;
            }
            setLog(`🎲 [ออโต้ - โซเนบุ] คุณทอยได้ [${defRoll}] น้อยกว่าหรือเท่ากับโซเนบุ [${atkRoll}] -> ยกเลิกการโจมตีสำเร็จ!`);
          } else {
            setLog('🛡️ [พวกเราจะช่วยเอง] นำยูนิต 5 ใบในนรกกลับเข้ากองและสับกอง — ยกเลิกการโจมตีสำเร็จ!');
          }
          renderGame();
          if (onCompleteCallback) onCompleteCallback();
        }
      });
    }

    options.push({
      label: 'ไม่ใช้ (ดำเนินการป้องกันตามปกติ)',
      color: '#475569',
      onSelect: () => continueNormalAttackFlow()
    });

    showChoiceModal(
      '⚡ ฝ่ายตรงข้ามประกาศโจมตี!',
      `"${attackingMonster.name}" กำลังโจมตีเข้ามา! คุณต้องการเปิดใช้ความสามารถการ์ดของคุณเพื่อตอบโต้หรือไม่?`,
      options
    );
    return;
  }

  continueNormalAttackFlow();
}

function checkWhenLeaderAttacked(attacker, defender, attackerSlot, onCompleteCallback) {
  const attackingMonster = attacker.board[attackerSlot];
  if (!attackingMonster) {
    if (onCompleteCallback) onCompleteCallback();
    return;
  }

  const isLocalDefender = (defender === gameState.player);

  const canUseAllForJit = defender.leader.hp <= 2
    && !defender.allForJitUsed
    && defender.graveyard.some(c => c.id === 'M04');

  const canUseAllJit = defender.hand.some(c => c.id === 'M03')
    && defender.board.some(m => m === null);

  if (!isLocalDefender) {
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
      label: 'ไม่ใช้ความสามารถพิเศษ (ไปสู่ขั้นตอนเลือก Intercept ตามปกติ)',
      color: '#475569',
      onSelect: () => proceedToStandardIntercept(attacker, defender, attackerSlot, onCompleteCallback)
    });

    showChoiceModal(
      '⚠️ ลีดเดอร์ของคุณกำลังถูกโจมตี!',
      `"${attackingMonster.name}" (Power ${getEffectivePower(attackingMonster, attacker)}) กำลังโจมตีลีดเดอร์ของคุณ! ต้องการสั่งใช้ความสามารถการ์ดของคุณหรือไม่?`,
      options
    );
    return;
  }

  proceedToStandardIntercept(attacker, defender, attackerSlot, onCompleteCallback);
}

function resolveAllForJitTrigger(attacker, defender, attackerSlot, onCompleteCallback) {
  const idx = defender.graveyard.findIndex(c => c.id === 'M04');
  if (idx === -1) {
    proceedToStandardIntercept(attacker, defender, attackerSlot, onCompleteCallback);
    return;
  }

  defender.allForJitUsed = true;
  const allForJitCard = defender.graveyard.splice(idx, 1)[0];
  resetCardStateForZoneChange(allForJitCard);
  allForJitCard.state = 'Stand';

  showCardShowcaseBanner(allForJitCard, `${defender.name} ปลุกออลฟอจิตจากนรก!`, '💀 ทำลายยูนิตทุกใบบนสนามและอัญเชิญลงสนาม!', '#dc2626', 1300);

  for (let i = 0; i < 3; i++) {
    if (defender.board[i]) destroyBoardMonster(defender, i, false, true);
    if (attacker.board[i]) destroyBoardMonster(attacker, i, false, true);
  }

  const emptySlot = defender.board.findIndex(m => m === null);
  if (emptySlot !== -1) {
    defender.board[emptySlot] = allForJitCard;
  }

  setLog(`💀 [${defender.name}] สั่งใช้งาน "ออลฟอจิต" จากนรก! ทำลายการ์ดบนสนามและอัญเชิญ "ออลฟอจิต" (Power 3) ลงสู่สนามสำเร็จ!`);
  renderGame();
  checkGameOver();
  if (onCompleteCallback) onCompleteCallback();
}

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

  showCardShowcaseBanner(allJitCard, `${defender.name} ส่งออลจิตโดดบัง!`, '🛡️ อัญเชิญจากมือลงมารับการโจมตีแทน Leader!', '#0284c7', 1100);

  compareAndDestroyMonsters(attacker, attackerSlot, defender, emptySlot, (combatMsg) => {
    setLog(`🛡️ [${defender.name}] อัญเชิญ "ออลจิต" จากบนมือลงสนามและเปลี่ยนเป้าหมายการโจมตีมาที่ตัวเอง! -> ${combatMsg}`);
    renderGame();
    checkGameOver();
    if (onCompleteCallback) onCompleteCallback();
  });
}

function applyInterceptSkillAndBattle(attacker, attackerSlot, defender, chosenSlot, onBattleDone) {
  const blocker = defender.board[chosenSlot];
  if (!blocker) {
    if (onBattleDone) onBattleDone('');
    return;
  }

  blocker.state = 'Rest';
  const hasStandOnSurvive = Array.isArray(blocker.effects) && blocker.effects.some(e => e.trigger === 'ON_INTERCEPT' && e.standOnSurvive);

  EffectEngine.triggerCardEffects(blocker, 'ON_INTERCEPT', {
    caster: defender,
    opponent: attacker,
    sourceCard: blocker,
    sourceSlot: chosenSlot,
    isAI: defender !== gameState.player
  }, () => {
    compareAndDestroyMonsters(attacker, attackerSlot, defender, chosenSlot, (msg) => {
      let extraStandMsg = '';
      if (hasStandOnSurvive && defender.board[chosenSlot] && defender.board[chosenSlot].uid === blocker.uid) {
        blocker.state = 'Stand';
        extraStandMsg = ` (🛡️ "${blocker.name}" ป้องกันสำเร็จและลุกขึ้น Stand!)`;
      }
      if (onBattleDone) onBattleDone(msg + extraStandMsg);
    });
  });
}

function proceedToStandardIntercept(attacker, defender, attackerSlot, onCompleteCallback) {
  const attackingMonster = attacker.board[attackerSlot];
  if (!attackingMonster) {
    if (onCompleteCallback) onCompleteCallback();
    return;
  }

  const isLocalDefender = (defender === gameState.player);

  const standBlockerSlots = defender.board
    .map((m, idx) => (m && m.state === 'Stand' ? idx : null))
    .filter(idx => idx !== null);

  const handleDirectLeaderHit = (logText) => {
    defender.leader.hp = Math.max(0, defender.leader.hp - 1);
    setLog(logText);
    renderGame();
    playSlotAnimation(isLocalDefender, 'leader', 'fx-target-hit');
    if (checkGameOver()) {
      if (onCompleteCallback) onCompleteCallback();
      return;
    }
    // 💤 ออโต้ของ "เบลเฟกอร์ บาปเกียจคร้าน" (DMM07): เมื่อโจมตีสำเร็จ นำการ์ดบนสุดของทั้ง 2 ฝั่งเข้ามิติมืดของตน
    triggerBelphegorAttackSuccess(attacker, defender, attackingMonster);
    if (gameState.gameOver) {
      if (onCompleteCallback) onCompleteCallback();
      return;
    }
    // รันสกิลออโต้เมื่อโจมตีลีดเดอร์สำเร็จ (เช่น ไฮบริด — อินโดแรปเตอร์ ON_HIT_LEADER)
    EffectEngine.triggerCardEffects(attackingMonster, 'ON_HIT_LEADER', {
      caster: attacker,
      opponent: defender,
      sourceCard: attackingMonster,
      sourceSlot: attackerSlot,
      isAI: attacker !== gameState.player
    }, () => {
      renderGame();
      checkGameOver();
      if (onCompleteCallback) onCompleteCallback();
    });
  };

  // ⚡ หากมีเอฟเฟกต์ "เร็วขึ้นอีก!!!!!!" (OS03) ฝ่ายตรงข้ามไม่สามารถนำยูนิทมาป้องกันการโจมตีนี้ได้
  if (attackingMonster.unblockableThisAttack) {
    attackingMonster.unblockableThisAttack = false;
    handleDirectLeaderHit(`⚡ [เร็วขึ้นอีก!!!!!!] ฝ่ายตรงข้ามไม่สามารถนำยูนิทมาป้องกันได้! "${attackingMonster.name}" โจมตีเข้าใส่ Leader ของ ${defender.name} โดยตรง! (เสีย 1 HP เหลือ ${Math.max(0, defender.leader.hp - 1)}/6)`);
    return;
  }

  if (standBlockerSlots.length === 0) {
    handleDirectLeaderHit(`💥 "${attackingMonster.name}" โจมตีเข้าใส่ Leader ของ ${defender.name} โดยตรง! (เสีย 1 HP เหลือ ${defender.leader.hp - 1 >= 0 ? defender.leader.hp - 1 : 0}/6)`);
    return;
  }

  if (!isLocalDefender) {
    const atkPower = getEffectivePower(attackingMonster, attacker);
    const validAiBlockers = standBlockerSlots.filter(idx => defender.board[idx].id !== 'NM05');
    let chosenSlot = validAiBlockers.find(idx => {
      const b = defender.board[idx];
      const interceptBonus = (Array.isArray(b.effects) && b.effects.some(e => e.trigger === 'ON_INTERCEPT')) ? 2 : 0;
      return (getEffectivePower(b, defender) + interceptBonus) >= atkPower;
    });
    if (chosenSlot === undefined && defender.leader.hp <= 2 && validAiBlockers.length > 0) {
      chosenSlot = validAiBlockers[0];
    }

    if (chosenSlot !== undefined) {
      const blocker = defender.board[chosenSlot];
      showCardShowcaseBanner(blocker, 'AI สั่งป้องกัน (Intercept)!', `🛡️ ส่ง "${blocker.name}" เข้ารับการโจมตีแทน Leader!`, '#38bdf8', 950);
      applyInterceptSkillAndBattle(attacker, attackerSlot, defender, chosenSlot, (msg) => {
        setLog(`🛡️ AI สั่ง "${blocker.name}" เข้ามา Intercept! -> ${msg}`);
        renderGame();
        checkGameOver();
        if (onCompleteCallback) onCompleteCallback();
      });
    } else {
      handleDirectLeaderHit(`💥 AI เลือกไม่ป้องกัน! Leader ของ AI เสีย 1 HP (เหลือ ${Math.max(0, defender.leader.hp - 1)}/6)`);
    }
  } else {
    openInterceptModal(attacker, attackerSlot, defender, standBlockerSlots, onCompleteCallback);
  }
}

function compareAndDestroyMonsters(contestantA, slotA, contestantB, slotB, onAfterCombat = null) {
  const monsterA = contestantA.board[slotA];
  const monsterB = contestantB.board[slotB];
  if (!monsterA || !monsterB) {
    if (onAfterCombat) onAfterCombat('');
    return '';
  }

  let totalA = getEffectivePower(monsterA, contestantA);
  let totalB = getEffectivePower(monsterB, contestantB);

  // 😈 ออโต้ของ "ลูซิเฟอร์ บาปความหยิ่งผยอง" (DMM01):
  // เมื่อเข้าเทิร์นฝ่ายตรงข้าม ถ้าในมิติมืดเรามี "ดินแดนปีศาจ" (DMS03) การ์ดที่ต่อสู้กับลูซิเฟอร์พลังโจมตีลด 1 หน่วย
  let luciferNote = '';
  if (
    monsterB.id === 'DMM01' &&
    Array.isArray(contestantB.darkDimension) &&
    contestantB.darkDimension.some(d => d && d.id === 'DMS03')
  ) {
    totalA = Math.max(0, totalA - 1);
    luciferNote = ` [😈 สกิลลูซิเฟอร์ลดพลัง "${monsterA.name}" -1 เหลือ ${totalA}]`;
  }
  if (
    monsterA.id === 'DMM01' &&
    Array.isArray(contestantA.darkDimension) &&
    contestantA.darkDimension.some(d => d && d.id === 'DMS03') &&
    gameState.activeTurn !== (contestantA === gameState.player ? 'player' : 'ai')
  ) {
    totalB = Math.max(0, totalB - 1);
    luciferNote = ` [😈 สกิลลูซิเฟอร์ลดพลัง "${monsterB.name}" -1 เหลือ ${totalB}]`;
  }

  if (totalA > totalB) {
    const hadBurn = !!monsterA.burnLeaderOnKill;
    const resB = destroyBoardMonster(contestantB, slotB, true, false);

    let burnMsg = '';
    if (resB.destroyed && hadBurn) {
      contestantB.leader.hp = Math.max(0, contestantB.leader.hp - 1);
      burnMsg = ` และสกิลออโต้ของ "${monsterA.name}" ทำดาเมจใส่ Leader อีกฝ่าย 1 หน่วย (เหลือ ${contestantB.leader.hp}/6)!`;
    }
    const msg = `"${monsterA.name}" (${totalA}) ชนะ "${monsterB.name}" (${totalB})!${luciferNote}${burnMsg}`;

    // 💤 ออโต้ของ "เบลเฟกอร์ บาปเกียจคร้าน" (DMM07): เมื่อโจมตีชนะสำเร็จ นำการ์ดใบบนสุดของทั้ง 2 ฝั่งเข้ามิติมืดของตน
    triggerBelphegorAttackSuccess(contestantA, contestantB, monsterA);

    if (resB.destroyed) {
      EffectEngine.triggerCardEffects(monsterA, 'ON_KILL_UNIT', {
        caster: contestantA,
        opponent: contestantB,
        sourceCard: monsterA,
        sourceSlot: slotA,
        isAI: contestantA !== gameState.player
      }, () => {
        if (onAfterCombat) onAfterCombat(msg);
      });
    } else if (onAfterCombat) {
      onAfterCombat(msg);
    }
    return msg;
  } else if (totalA < totalB) {
    const resA = destroyBoardMonster(contestantA, slotA, true, false);
    const msg = `"${monsterB.name}" (${totalB}) พลังสูงกว่า! สวนกลับทำลาย "${monsterA.name}" (${totalA})!${luciferNote}`;

    if (resA.destroyed) {
      EffectEngine.triggerCardEffects(monsterB, 'ON_KILL_UNIT', {
        caster: contestantB,
        opponent: contestantA,
        sourceCard: monsterB,
        sourceSlot: slotB,
        isAI: contestantB !== gameState.player
      }, () => {
        if (onAfterCombat) onAfterCombat(msg);
      });
    } else if (onAfterCombat) {
      onAfterCombat(msg);
    }
    return msg;
  } else {
    // 🍔 ตรวจสอบสกิลของ "เบลเซบับ บาปตะกละ" (DMM06):
    // ถ้าเปิดใช้งานสกิลในเทิร์นนี้ เมื่อต่อสู้กับการ์ดที่มีพลังโจมตีเท่ากัน จะชนะการต่อสู้นั้นทันทีและไม่ออกจากสนามจนจบเทิร์นเรา!
    if (monsterA.beelzebubBuffThisTurn && !monsterB.beelzebubBuffThisTurn) {
      const resB = destroyBoardMonster(contestantB, slotB, true, false);
      const msg = `🍔 [สกิลเบลเซบับ บาปตะกละ] พลังเท่ากัน (${totalA}) แต่ "${monsterA.name}" ชนะการต่อสู้ทันทีและไม่ออกจากสนาม!${luciferNote}`;
      if (resB.destroyed) {
        EffectEngine.triggerCardEffects(monsterA, 'ON_KILL_UNIT', {
          caster: contestantA, opponent: contestantB, sourceCard: monsterA, sourceSlot: slotA, isAI: contestantA !== gameState.player
        }, () => { if (onAfterCombat) onAfterCombat(msg); });
      } else if (onAfterCombat) {
        onAfterCombat(msg);
      }
      return msg;
    }
    if (monsterB.beelzebubBuffThisTurn && !monsterA.beelzebubBuffThisTurn) {
      const resA = destroyBoardMonster(contestantA, slotA, true, false);
      const msg = `🍔 [สกิลเบลเซบับ บาปตะกละ] พลังเท่ากัน (${totalB}) แต่ "${monsterB.name}" ชนะการต่อสู้ทันทีและไม่ออกจากสนาม!${luciferNote}`;
      if (resA.destroyed) {
        EffectEngine.triggerCardEffects(monsterB, 'ON_KILL_UNIT', {
          caster: contestantB, opponent: contestantA, sourceCard: monsterB, sourceSlot: slotB, isAI: contestantB !== gameState.player
        }, () => { if (onAfterCombat) onAfterCombat(msg); });
      } else if (onAfterCombat) {
        onAfterCombat(msg);
      }
      return msg;
    }

    const hadBurn = !!monsterA.burnLeaderOnKill;
    destroyBoardMonster(contestantA, slotA, true, false);
    const resB = destroyBoardMonster(contestantB, slotB, true, false);

    let burnMsg = '';
    if (resB.destroyed && hadBurn) {
      contestantB.leader.hp = Math.max(0, contestantB.leader.hp - 1);
      burnMsg = ` (สกิลออโต้ของ "${monsterA.name}" ทำดาเมจใส่ Leader อีกฝ่าย 1 หน่วย!)`;
    }
    const msg = `พลังเท่ากัน (${totalA})! ปะทะกันทั้งสองฝ่าย!${luciferNote}${burnMsg}`;
    if (onAfterCombat) onAfterCombat(msg);
    return msg;
  }
}

function openInterceptModal(attacker, attackerSlot, defender, standBlockerSlots, onCompleteCallback) {
  gameState.pendingAttack = { attacker, attackerSlot, defender, onCompleteCallback };
  const attackerMonster = attacker.board[attackerSlot];
  const atkPwr = getEffectivePower(attackerMonster, attacker);

  document.getElementById('intercept-desc').textContent =
    `⚠️ "${attackerMonster.name}" (Power ${atkPwr}) กำลังโจมตี Leader ของคุณ! คลิกเลือก Monster ที่ Stand อยู่ฝั่งคุณเพื่อรับการโจมตีแทน:`;

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
  const attackingMonster = attacker.board[attackerSlot];

  if (chosenSlotIndex !== null) {
    const blocker = defender.board[chosenSlotIndex];
    applyInterceptSkillAndBattle(attacker, attackerSlot, defender, chosenSlotIndex, (msg) => {
      setLog(`🛡️ คุณส่ง "${blocker.name}" เข้า Intercept! -> ${msg}`);
      renderGame();
      checkGameOver();
      if (onCompleteCallback) onCompleteCallback();
    });
  } else {
    defender.leader.hp = Math.max(0, defender.leader.hp - 1);
    setLog(`💥 คุณเลือกไม่ป้องกัน! Leader ของคุณเสีย 1 HP (เหลือ ${defender.leader.hp}/6)`);
    playSlotAnimation(true, 'leader', 'fx-target-hit');
    triggerBelphegorAttackSuccess(attacker, defender, attackingMonster);
    renderGame();
    if (checkGameOver()) {
      if (onCompleteCallback) onCompleteCallback();
      return;
    }
    if (attackingMonster) {
      EffectEngine.triggerCardEffects(attackingMonster, 'ON_HIT_LEADER', {
        caster: attacker,
        opponent: defender,
        sourceCard: attackingMonster,
        sourceSlot: attackerSlot,
        isAI: attacker !== gameState.player
      }, () => {
        renderGame();
        checkGameOver();
        if (onCompleteCallback) onCompleteCallback();
      });
    } else if (onCompleteCallback) {
      onCompleteCallback();
    }
  }
}

document.getElementById('btn-skip-intercept').addEventListener('click', () => {
  resolvePlayerIntercept(null);
});


/* ============================================================================
   หมวดที่ 8: ระบบตั้งค่า AI และระบบคิวการเล่นทีละจังหวะของ AI (Step-by-Step Pacing)
   ============================================================================ */
const AI_CONFIG_STORAGE_KEY = 'bof_ai_config_v1';

const aiConfig = (function () {
  const defaults = {
    deckChoice: 'RANDOM', // 'RANDOM' | 'L01' | 'L02' | 'L03' | 'L04' | 'L05' | 'L06'
    difficulty: 'NORMAL', // 'EASY' | 'NORMAL' | 'HARD'
    stepDelayMs: 1150
  };
  try {
    const saved = JSON.parse(localStorage.getItem(AI_CONFIG_STORAGE_KEY));
    if (saved) {
      if (['RANDOM', 'L01', 'L02', 'L03', 'L04', 'L05', 'L06'].includes(saved.deckChoice)) {
        defaults.deckChoice = saved.deckChoice;
      }
      if (['EASY', 'NORMAL', 'HARD'].includes(saved.difficulty)) {
        defaults.difficulty = saved.difficulty;
      }
    }
  } catch (e) {}
  defaults.stepDelayMs = defaults.difficulty === 'EASY' ? 1300 : (defaults.difficulty === 'HARD' ? 1050 : 1150);
  return defaults;
})();

function saveAIConfigToStorage() {
  aiConfig.stepDelayMs = aiConfig.difficulty === 'EASY' ? 1300 : (aiConfig.difficulty === 'HARD' ? 1050 : 1150);
  try {
    localStorage.setItem(AI_CONFIG_STORAGE_KEY, JSON.stringify({
      deckChoice: aiConfig.deckChoice,
      difficulty: aiConfig.difficulty
    }));
  } catch (e) {}
}

function getAIDifficultyLabel(diff) {
  if (diff === 'EASY') return '🟢 ง่าย (ฝึกหัด)';
  if (diff === 'NORMAL') return '🟡 ปกติ (มาตรฐาน)';
  return '🔴 โหด (จัดเต็ม)';
}

const AI_DECK_CATALOG = [
  { id: 'L01', name: 'เด็คจิต (ฮีโร่)', leader: 'มายฮีโร่ เดจิต', desc: 'บัฟพลังฮีโร่แล้วบุกทะลวงในเทิร์นเดียว', color: '#3ee08f', img: 'images/เด็คจิต/1.png' },
  { id: 'L02', name: 'เด็คเหนือ (สยาม)', leader: 'ขุนเหนือ', desc: 'ส่งทัพไพร่-ทหารลงสนามและชุบจากนรก', color: '#f0a347', img: 'images/เด็คเหนือ/1.png' },
  { id: 'L03', name: 'เด็ควันสิ้นโลก', leader: 'วันสิ้นโลก', desc: 'คู่หูประสานพลังและวิวัฒน์สู่ร่างอนาคต', color: '#5fd0ff', img: 'images/วันสิ้นโลก/1.png' },
  { id: 'L04', name: 'เด็คไดโน', leader: 'ศูนย์วิจัยไดโน', desc: 'สะสมเผ่าไดโนและผสานร่างไฮบริดสุดแกร่ง', color: '#a3e635', img: 'images/ไดโน/1.png' },
  { id: 'L05', name: 'เด็คปีศาจ', leader: 'ปีศาจ', desc: 'สะสมมิติมืดและใช้พลังบาปทั้ง 7 พิชิตชัย', color: '#c084fc', img: 'images/เด็คปีศาจ/1.png' },
  { id: 'L06', name: 'เด็คโอ็ต', leader: 'ไอโอ๊ตบ้าทุกสิ่ง', desc: 'เปิดท็อปกองคอลพรรคพวกสายบ้าลงสนาม', color: '#fb923c', img: 'images/เด็คโอ๊ต/1.png' }
];

function openAISetupModal() {
  let modal = document.getElementById('ai-setup-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'ai-setup-modal';
    modal.className = 'modal-overlay';
    modal.style.display = 'none';
    modal.style.zIndex = '240';
    modal.innerHTML = `
      <div class="modal-box ai-setup-box">
        <div class="ai-setup-header">
          <div>
            <h2>🤖 ตั้งค่าคู่ซ้อม AI <span class="m-hide">(AI Battle Setup)</span></h2>
            <p>เลือกระดับความยากและเด็คของบอทที่ต้องการฝึกซ้อมแก้ทาง</p>
          </div>
          <button type="button" id="btn-close-ai-setup-x" class="bof-auth-close-x" aria-label="ปิด">✕</button>
        </div>

        <div class="ai-setup-section">
          <div class="ai-setup-sec-title">🧠 1. เลือกระดับความยากของ AI:</div>
          <div class="ai-diff-grid" id="ai-diff-buttons">
            <button type="button" class="ai-diff-card ai-diff-btn" data-diff="EASY">
              <div class="ai-diff-top">
                <span class="ai-diff-badge is-easy">🟢 ง่าย</span>
                <span class="ai-diff-reward">ชนะ +250 🪙</span>
              </div>
              <div class="ai-diff-desc">ลงยูนิตและโจมตีพื้นฐาน ไม่ใช้คอมโบหรือเวทสวนกลับ เหมาะสำหรับหัดเล่นเด็คใหม่</div>
            </button>
            <button type="button" class="ai-diff-card ai-diff-btn" data-diff="NORMAL">
              <div class="ai-diff-top">
                <span class="ai-diff-badge is-normal">🟡 ปกติ</span>
                <span class="ai-diff-reward">ชนะ +300 🪙</span>
              </div>
              <div class="ai-diff-desc">ใช้สกิลยูนิต สกิลลีดเดอร์ และเวทมนตร์ตามจังหวะมาตรฐาน เหมาะซ้อมมือทั่วไป</div>
            </button>
            <button type="button" class="ai-diff-card ai-diff-btn" data-diff="HARD">
              <div class="ai-diff-top">
                <span class="ai-diff-badge is-hard">🔴 โหด</span>
                <span class="ai-diff-reward">ชนะ +400 🪙</span>
              </div>
              <div class="ai-diff-desc">จัดเต็มทุกคอมโบ (จุติ/ไฮบริด/อนาคต/มิติมืด) เล็งเป้าคุ้มสุดและกางเวทสวนกลับ</div>
            </button>
          </div>
        </div>

        <div class="ai-setup-section">
          <div class="ai-setup-sec-title">🃏 2. เลือกเด็คให้ AI <span class="m-hide">(ซ้อมมือแก้ทางเด็คเฉพาะ)</span>:</div>
          <div class="ai-deck-grid" id="ai-deck-buttons">
            <button type="button" class="ai-deck-card ai-deck-btn is-random-card" data-deck="RANDOM">
              <div class="ai-deck-random-ico">🎲</div>
              <div class="ai-deck-meta">
                <strong>สุ่มเด็คอัตโนมัติ <span class="m-hide">(Random Deck)</span></strong>
                <span>สุ่มเจอลีดเดอร์จากทั้ง 6 สายเด็คหลัก (L01–L06)</span>
              </div>
            </button>
            ${AI_DECK_CATALOG.map(d => `
              <button type="button" class="ai-deck-card ai-deck-btn" data-deck="${d.id}" style="--ai-deck-accent:${d.color};">
                <img class="ai-deck-thumb" src="${d.img}" alt="${d.name}">
                <div class="ai-deck-meta">
                  <strong>${d.name}</strong>
                  <small>👑 ${d.leader}</small>
                  <span>${d.desc}</span>
                </div>
              </button>
            `).join('')}
          </div>
        </div>

        <div class="ai-setup-footer">
          <button type="button" class="btn ai-start-btn" id="btn-start-ai-match">⚔️ เริ่มดวลกับ AI เลย!</button>
          <button type="button" class="btn ai-cancel-btn" id="btn-cancel-ai-setup">ยกเลิก</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    modal.querySelectorAll('.ai-diff-btn').forEach(btn => {
      btn.onclick = () => {
        aiConfig.difficulty = btn.getAttribute('data-diff');
        saveAIConfigToStorage();
        refreshAISetupModalUI();
      };
    });

    modal.querySelectorAll('.ai-deck-btn').forEach(btn => {
      btn.onclick = () => {
        aiConfig.deckChoice = btn.getAttribute('data-deck');
        saveAIConfigToStorage();
        refreshAISetupModalUI();
      };
    });

    const closeSetup = () => { modal.style.display = 'none'; };
    document.getElementById('btn-cancel-ai-setup').onclick = closeSetup;
    document.getElementById('btn-close-ai-setup-x').onclick = closeSetup;
    modal.addEventListener('click', e => {
      if (e.target === modal) closeSetup();
    });

    document.getElementById('btn-start-ai-match').onclick = () => {
      saveAIConfigToStorage();
      modal.style.display = 'none';
      pvpState.isMultiplayer = false;
      pvpState.waitingForDefense = false;
      document.getElementById('lobby-screen').style.display = 'none';
      document.querySelector('.game-container').style.display = 'flex';
      initGame();
    };
  }

  refreshAISetupModalUI();
  modal.style.display = 'flex';
}

function refreshAISetupModalUI() {
  const modal = document.getElementById('ai-setup-modal');
  if (!modal) return;

  modal.querySelectorAll('.ai-diff-btn').forEach(btn => {
    const isSelected = btn.getAttribute('data-diff') === aiConfig.difficulty;
    btn.classList.toggle('is-selected', isSelected);
  });

  modal.querySelectorAll('.ai-deck-btn').forEach(btn => {
    const isSelected = btn.getAttribute('data-deck') === aiConfig.deckChoice;
    btn.classList.toggle('is-selected', isSelected);
  });
}

function setupInGameControlBar() {
  ['btn-next-phase', 'btn-end-turn', 'btn-open-deck', 'btn-back-lobby', 'btn-open-combat-log'].forEach(btnId => {
    const el = document.getElementById(btnId);
    if (el) el.style.display = 'none';
  });

  const parentGroup = document.getElementById('btn-open-deck')?.parentElement;
  if (!parentGroup) return;

  if (!document.getElementById('btn-last-card-pill')) {
    const lastCardBtn = document.createElement('button');
    lastCardBtn.type = 'button';
    lastCardBtn.id = 'btn-last-card-pill';
    lastCardBtn.className = 'btn last-card-pill-btn';
    lastCardBtn.title = 'คลิกดูการ์ดและสกิลใบล่าสุดที่เพิ่งทำงาน';
    lastCardBtn.style.display = 'none';
    lastCardBtn.innerHTML = `
      <img class="last-card-pill-img" src="" alt="">
      <span class="last-card-pill-meta">
        <small class="last-card-pill-side">⚡ ล่าสุด</small>
        <b class="last-card-pill-name">-</b>
      </span>
    `;
    lastCardBtn.onclick = () => {
      const logModal = document.getElementById('combat-log-modal');
      if (logModal) {
        if (gameState.lastPlayedCardInfo && gameState.lastPlayedCardInfo.card) {
          selectedLogSpotlight = gameState.lastPlayedCardInfo;
        }
        renderCombatLogModal();
        logModal.style.display = 'flex';
      }
    };
    parentGroup.appendChild(lastCardBtn);
  }

  if (!document.getElementById('btn-surrender-match')) {
    const sandboxBtn = document.createElement('button');
    sandboxBtn.type = 'button';
    sandboxBtn.id = 'btn-open-sandbox';
    sandboxBtn.className = 'btn';
    sandboxBtn.style.background = '#7c3aed';
    sandboxBtn.style.marginRight = '6px';
    sandboxBtn.title = 'เปิดห้องทดลองสกิลการ์ด & ตรวจเช็กการ์ด 72 ใบ';
    sandboxBtn.textContent = '🧪 ทดสอบสกิล';
    sandboxBtn.onclick = () => {
      if (window.BOFSandbox && typeof window.BOFSandbox.openModal === 'function') {
        window.BOFSandbox.openModal();
      }
    };
    parentGroup.appendChild(sandboxBtn);

    const nextPhaseBtn = document.createElement('button');
    nextPhaseBtn.id = 'btn-pass-turn-inline';
    nextPhaseBtn.className = 'btn';
    nextPhaseBtn.style.background = '#0284c7';
    nextPhaseBtn.style.marginRight = '8px';
    nextPhaseBtn.textContent = '⚔️ เฟสถัดไป (Battle Phase)';
    nextPhaseBtn.onclick = () => handleNextPhaseButtonClick();
    parentGroup.appendChild(nextPhaseBtn);

    const surrenderBtn = document.createElement('button');
    surrenderBtn.id = 'btn-surrender-match';
    surrenderBtn.className = 'btn';
    surrenderBtn.style.background = '#dc2626';
    surrenderBtn.textContent = '🏳️ ยอมแพ้';
    surrenderBtn.onclick = () => handlePlayerSurrender();
    parentGroup.appendChild(surrenderBtn);
  }

  const sbBtn = document.getElementById('btn-open-sandbox');
  if (sbBtn) {
    const isPvp = (typeof pvpState !== 'undefined' && pvpState.isMultiplayer);
    const isAdmin = (typeof window.BOFSandbox !== 'undefined' && typeof window.BOFSandbox.isAdminUnlocked === 'function' && window.BOFSandbox.isAdminUnlocked());
    sbBtn.style.display = (!isPvp && isAdmin) ? '' : 'none';
  }
}

function handleNextPhaseButtonClick() {
  if (gameState.activeTurn !== 'player' || gameState.gameOver || gameState.isRollingDice) return;
  if (typeof pvpState !== 'undefined' && pvpState.waitingForDefense) {
    setLog('⏳ กรุณารอฝ่ายตรงข้ามเลือกการป้องกันให้เสร็จก่อน!');
    return;
  }
  if (isInteractionBlocked()) {
    setLog('⚠️ กรุณารอและดำเนินการเลือกของความสามารถที่ค้างอยู่ให้เสร็จก่อนเปลี่ยนเฟส!');
    return;
  }

  if (gameState.phase === 'Main Phase') {
    gameState.phase = 'Battle Phase';
    gameState.selectedHandIndex = null;
    gameState.selectedAttackerSlot = null;

    if (gameState.player.isFirstPlayer && gameState.player.turnsTaken === 1) {
      setLog('⚔️ เข้าสู่ Battle Phase (Turn 1 ของผู้เล่นคนแรกไม่สามารถโจมตีได้ — กด "เฟสถัดไป (จบเทิร์น)" ได้เลย)');
    } else {
      setLog('⚔️ เข้าสู่ Battle Phase: คลิกเลือกยูนิตที่ Stand ของคุณเพื่อสั่งโจมตี หรือกด "เฟสถัดไป (จบเทิร์น)"!');
    }
    renderGame();
    return;
  }

  if (gameState.phase === 'Battle Phase') {
    triggerPlayerPassTurn();
  }
}

function handlePlayerSurrender() {
  if (gameState.gameOver) {
    returnToLobbyScreen();
    return;
  }

  showChoiceModal(
    '🏳️ ยืนยันการยอมแพ้',
    'คุณต้องการยอมแพ้ในแมตช์นี้และออกจากกระดานใช่หรือไม่?',
    [
      {
        label: '🏳️ ยืนยันยอมแพ้',
        color: '#dc2626',
        onSelect: () => {
          gameState.player.leader.hp = 0;
          gameState.player.surrendered = true; // ส่งไปกับ senderData ให้อีกฝั่งรู้ว่าแพ้เพราะยอมแพ้
          gameState.gameOver = true;
          gameState.pendingAction = null;
          disableControls();
          setLog('🏳️ คุณประกาศยอมแพ้ในแมตช์นี้!');
          renderGame();
          if (typeof pvpState !== 'undefined' && pvpState.isMultiplayer) {
            sendPvpPacket({
              type: 'PLAYER_SURRENDER',
              senderData: gameState.player,
              receiverData: gameState.ai
            });
            syncBoardToOpponent('🏳️ ฝ่ายตรงข้ามประกาศยอมแพ้! คุณเป็นฝ่ายชนะ!');
          }
          if (typeof playSoundEffect === 'function') {
            playSoundEffect('defeat');
          } else if (window.BOF_AUDIO) {
            window.BOF_AUDIO.playDefeat();
          }
          setTimeout(() => {
            showEndMatchModal('💀 คุณพ่ายแพ้!', 'คุณได้กดยืนยันยอมแพ้ในแมตช์นี้');
          }, 300);
        }
      },
      {
        label: '❌ เล่นต่อ',
        color: '#475569',
        onSelect: () => renderGame()
      }
    ]
  );
}

function triggerPlayerPassTurn() {
  if (gameState.activeTurn !== 'player' || gameState.gameOver || gameState.isRollingDice) return;
  if (typeof pvpState !== 'undefined' && pvpState.waitingForDefense) {
    setLog('⏳ กรุณารอฝ่ายตรงข้ามเลือกการป้องกันให้เสร็จก่อน!');
    return;
  }
  if (gameState.pendingAction) {
    setLog('⚠️ กรุณาเลือกเป้าหมายของความสามารถที่ค้างอยู่ให้เสร็จก่อน!');
    return;
  }

  executeEndPhaseCleanup(gameState.player);
  gameState.phase = 'End Phase';
  gameState.selectedHandIndex = null;
  gameState.selectedAttackerSlot = null;
  disableControls();

  if (typeof pvpState !== 'undefined' && pvpState.isMultiplayer) {
    gameState.activeTurn = 'ai';
    _originalSetLog('⏭️ จบเทิร์น — ส่งเทิร์นให้เพื่อนของคุณ!');
    _originalRenderGame();

    sendPvpPacket({
      type: 'PASS_TURN',
      nextTurnCount: gameState.turnCount + 1,
      senderData: gameState.player,
      receiverData: gameState.ai
    });
    return;
  }

  renderGame();
  setTimeout(startAITurn, 800);
}

function startAITurn() {
  if (gameState.gameOver) return;
  if (isInteractionBlocked()) {
    setTimeout(startAITurn, 400);
    return;
  }
  if (window.BOFSandbox && window.BOFSandbox.isDummyAIEnabled()) {
    gameState.activeTurn = 'player';
    gameState.turnCount += 1;
    setLog('🧪 [โหมดทดสอบสกิล: หุ่นซ้อม AI] ข้ามเทิร์น AI อัตโนมัติและเริ่มเทิร์นใหม่ของคุณทันที!');
    startPlayerTurn();
    return;
  }
  gameState.activeTurn = 'ai';
  gameState.turnCount += 1;
  gameState.phase = 'Start Phase';

  setLog(`🤖 เทิร์นของ ${gameState.ai.name}: จั่วการ์ด 1 ใบ และเปลี่ยนยูนิททั้งหมดเป็น Stand`);
  executeStartPhase(gameState.ai, () => {
    renderGame();
    setTimeout(() => {
      if (gameState.gameOver) return;
      gameState.phase = 'Main Phase';
      renderGame();
      // เริ่มรันแอ็กชันใน Main Phase ของ AI ทีละ 1 สเต็ป
      setTimeout(() => aiPlayMainPhase(onAIMainPhaseDone), 900);
    }, 1000);
  });
}

function onAIMainPhaseDone() {
  if (gameState.gameOver) return;
  setTimeout(() => {
    if (gameState.gameOver) return;
    gameState.phase = 'Battle Phase';
    setLog('⚔️ AI เข้าสู่ Battle Phase เตรียมสั่งยูนิตโจมตี!');
    renderGame();
    setTimeout(() => aiPlayBattlePhase(0), 1000);
  }, 900);
}

// ⏳ สมองกล AI ช่วง Main Phase แบบทีละสเต็ป (ทำ 1 อย่าง -> แสดงเอฟเฟกต์ -> รอ 1.2 วินาที -> ทำอย่างถัดไป)
function aiPlayMainPhase(onMainComplete) {
  if (gameState.gameOver) return;
  // ถ้ามีหน้าต่างคำถาม หรือกำลังรอผู้เล่นเลือกผลของสกิล (เช่น แมมมอน บาปความโลภ) ให้ AI หยุดรอจนกว่าจะเลือกเสร็จสิ้น
  if (isInteractionBlocked()) {
    setTimeout(() => {
      aiPlayMainPhase(onMainComplete);
    }, 400);
    return;
  }
  const didAction = performSingleAIMainAction();
  if (didAction) {
    setTimeout(() => {
      aiPlayMainPhase(onMainComplete);
    }, aiConfig.stepDelayMs);
  } else {
    onMainComplete();
  }
}

// ค้นหาและลงมือทำแอ็กชันของ AI เพียง 1 อย่างต่อครั้ง (คืนค่า true ถ้าทำสำเร็จ, คืนค่า false ถ้าไม่มีอะไรทำต่อแล้ว)
function performSingleAIMainAction() {
  const ai = gameState.ai;
  const player = gameState.player;
  const diff = aiConfig.difficulty;

  // ==================== สเต็ปที่ 1: สกิลจากมือ (ไพร่ชาวนาเหนือ / สายลับ / จุติ / ไฮบริดไดโน) ====================
  if (diff !== 'EASY') {
    // 1.0 อัญเชิญไฮบริดไดโนจากมือ (DN06 / DN07)
    const emptySlotForHybrid = ai.board.findIndex(m => m === null);
    if (emptySlotForHybrid !== -1) {
      const hybridIdx = ai.hand.findIndex(c => Array.isArray(c.hybridMaterials) && canSummonHybridCard(ai, c));
      if (hybridIdx !== -1) {
        const hybridCard = ai.hand[hybridIdx];
        const [matA, matB] = hybridCard.hybridMaterials;
        const listA = getHybridMaterialCandidates(ai, matA, new Set([hybridCard.uid]));
        let chosenA = null;
        let chosenB = null;
        for (const itemA of listA) {
          const listB = getHybridMaterialCandidates(ai, matB, new Set([hybridCard.uid, itemA.card.uid]));
          if (listB.length > 0) {
            chosenA = itemA;
            chosenB = listB[0];
            break;
          }
        }
        if (chosenA && chosenB) {
          showCardShowcaseBanner(hybridCard, 'AI อัญเชิญไฮบริด!', `🦖 ส่ง "${chosenA.card.name}" และ "${chosenB.card.name}" ไปมิติมืด!`, '#dc2626');
          executeHybridSummon(ai, hybridCard.uid, chosenA, chosenB);
          return true;
        }
      }
    }

    const peasantIdx = ai.hand.findIndex(c => c.id === 'NM01');
    const jutiInHand = ai.hand.some(c => c.id === 'NM02' || c.id === 'NM03');
    const peasantCount = ai.hand.filter(c => c.id === 'NM01').length;

    if (peasantIdx !== -1 && (!jutiInHand || peasantCount >= 2)) {
      const spyAvailable = ai.deck.some(c => c.id === 'NM05') || ai.graveyard.some(c => c.id === 'NM05');
      const emptyPlayerSlot = player.board.findIndex(m => m === null);
      if (diff === 'HARD' && spyAvailable && emptyPlayerSlot !== -1) {
        const discarded = ai.hand.splice(peasantIdx, 1)[0];
        resetCardStateForZoneChange(discarded);
        ai.graveyard.push(discarded);
        let spy = null;
        const gIdx = ai.graveyard.findIndex(c => c.id === 'NM05');
        if (gIdx !== -1) spy = ai.graveyard.splice(gIdx, 1)[0];
        else {
          const dIdx = ai.deck.findIndex(c => c.id === 'NM05');
          if (dIdx !== -1) { spy = ai.deck.splice(dIdx, 1)[0]; ai.deck = shuffleDeck(ai.deck); }
        }
        if (spy) {
          resetCardStateForZoneChange(spy);
          player.board[emptyPlayerSlot] = spy;
          showCardShowcaseBanner(spy, 'AI ใช้สกิลไพร่ชาวนาเหนือ!', '🕵️ ส่ง "สายลับไพร่เหนือ" มายึดช่องสนามของคุณ!', '#7c3aed');
          setLog('🕵️ [AI ไพร่ชาวนาเหนือ] ส่งตัวเองลงนรก และส่ง "สายลับไพร่เหนือ" มายึดช่องสนามของคุณ!');
          renderGame();
          return true;
        }
      } else if (ai.deck.some(c => isSoldierCard(c))) {
        const discarded = ai.hand.splice(peasantIdx, 1)[0];
        resetCardStateForZoneChange(discarded);
        ai.graveyard.push(discarded);
        const sIdx = ai.deck.findIndex(c => isSoldierCard(c));
        if (sIdx !== -1) {
          const soldier = ai.deck.splice(sIdx, 1)[0];
          resetCardStateForZoneChange(soldier);
          ai.hand.push(soldier);
          ai.deck = shuffleDeck(ai.deck);
          showCardShowcaseBanner(discarded, 'AI ใช้สกิลไพร่ชาวนาเหนือ!', `🛡️ ค้นหา "${soldier.name}" จากกองขึ้นมือ!`, '#0284c7');
          setLog(`🛡️ [AI ไพร่ชาวนาเหนือ] ทิ้งตัวเองลงนรกและดึง "${soldier.name}" จากกองขึ้นมือ!`);
          renderGame();
          return true;
        }
      }
    }

    // ส่งสายลับไพร่เหนือ (NM05) จากมือไปยึดช่องว่างของผู้เล่นทีละใบ
    const spyHandIdx = ai.hand.findIndex(c => c.id === 'NM05' || c.isSpy);
    const targetPlayerSlot = player.board.findIndex(m => m === null);
    if (spyHandIdx !== -1 && targetPlayerSlot !== -1) {
      const spyCard = ai.hand.splice(spyHandIdx, 1)[0];
      resetCardStateForZoneChange(spyCard);
      spyCard.originalOwner = ai;
      player.board[targetPlayerSlot] = spyCard;
      showCardShowcaseBanner(spyCard, 'AI ส่งสายลับ!', `🕵️ ยึดช่องที่ ${targetPlayerSlot + 1} บนสนามของคุณ!`, '#7c3aed');
      setLog(`🕵️ AI ส่ง "สายลับไพร่เหนือ" ลงไปยึดช่องที่ ${targetPlayerSlot + 1} บนสนามของคุณ!`);
      renderGame();
      return true;
    }

    // อัญเชิญจุติ (เฉพาะระดับ HARD) ทีละใบ
    if (diff === 'HARD') {
      const emptyAiSlot = ai.board.findIndex(m => m === null);
      if (emptyAiSlot !== -1) {
        const jutiIdx = ai.hand.findIndex(c => c.id === 'NM02' || c.id === 'NM03');
        const pIdx = ai.hand.findIndex((c, idx) => idx !== jutiIdx && c.id === 'NM01');
        if (jutiIdx !== -1 && pIdx !== -1) {
          const summoned = ai.hand[jutiIdx];
          const fodder = ai.hand[pIdx];
          [jutiIdx, pIdx].sort((a, b) => b - a).forEach(i => ai.hand.splice(i, 1));
          resetCardStateForZoneChange(fodder);
          ai.graveyard.push(fodder);
          resetCardStateForZoneChange(summoned);
          summoned.permPowerMod += 1;
          ai.board[emptyAiSlot] = summoned;
          showCardShowcaseBanner(summoned, 'AI อัญเชิญจุติ!', `🔥 ทิ้งไพร่ชาวนาเหนือ คอล "${summoned.name}" พลัง +1!`, '#dc2626');
          setLog(`🔥 [AI อัญเชิญจุติ] ทิ้งไพร่ชาวนาเหนือ อัญเชิญ "${summoned.name}" (พลัง +1)!`);
          if (summoned.id === 'NM02') triggerRoyalGuardJutiBonus(ai);
          renderGame();
          return true;
        }
      }
    }
  }

  // ==================== สเต็ปที่ 2: อัญเชิญมอนสเตอร์ลงสนามทีละ 1 ใบ ====================
  const emptySlot = ai.board.findIndex(m => m === null);
  if (emptySlot !== -1) {
    let summonIdx = -1;
    if (diff !== 'EASY') {
      summonIdx = ai.hand.findIndex(c =>
        c.type === 'Monster' && !c.cannotNormalSummon && !c.isSpy && c.id !== 'M04' && c.id !== 'M03'
      );
    }
    if (summonIdx === -1) {
      summonIdx = ai.hand.findIndex(c =>
        c.type === 'Monster' && !c.cannotNormalSummon && !c.isSpy && c.id !== 'M04'
      );
    }

    if (summonIdx !== -1) {
      const summoned = ai.hand.splice(summonIdx, 1)[0];
      resetCardStateForZoneChange(summoned);
      summoned.state = 'Stand';
      if (summoned.id === 'NM04') summoned.permPowerMod += 1;
      ai.board[emptySlot] = summoned;

      showCardShowcaseBanner(summoned, 'AI อัญเชิญยูนิต!', `ลงช่องที่ ${emptySlot + 1} (Power ${getEffectivePower(summoned, ai)})`, '#f59e0b');
      setLog(`🤖 AI อัญเชิญ "${summoned.name}" ลงช่องที่ ${emptySlot + 1}!`);

      if (summoned.id === 'M01') {
        let bestTarget = -1;
        let maxPwr = -1;
        player.board.forEach((m, idx) => {
          if (m && m.id !== 'NM05' && !m.immuneToEnemyEffectsUntilEndOfTurn && getEffectivePower(m, player) > maxPwr) {
            maxPwr = getEffectivePower(m, player);
            bestTarget = idx;
          }
        });
        if (bestTarget !== -1) {
          destroyBoardMonster(player, bestTarget, false, true);
          setLog(`💥 [AI บาคุจิต] อัญเชิญลงสนามและทำลายมอนสเตอร์ช่องที่ ${bestTarget + 1} ของคุณ!`);
          playSlotAnimation(true, bestTarget, 'fx-target-hit');
        }
      } else if (summoned.id !== 'NM04' && Array.isArray(summoned.effects) && summoned.effects.some(e => e.trigger === 'ON_SUMMON')) {
        EffectEngine.triggerCardEffects(summoned, 'ON_SUMMON', {
          caster: ai,
          opponent: player,
          sourceCard: summoned,
          sourceSlot: emptySlot,
          isAI: true
        });
      }

      renderGame();
      return true;
    }
  }

  if (diff === 'EASY') return false;

  // ==================== สเต็ปที่ 3: กดใช้สกิลของมอนสเตอร์บนสนามทีละ 1 สกิล ====================
  for (let slotIdx = 0; slotIdx < 3; slotIdx++) {
    const m = ai.board[slotIdx];
    if (!m) continue;

    // 3.0 พเทอราโนดอน (DN04) โม่กองตัวเอง 2 ใบแล้วจั่ว 1 ใบ
    if (m.id === 'DN04' && !m.usedSkills.pteranodon_mill_draw && ai.deck.length >= 3) {
      const eff = (m.effects || []).find(e => e.id === 'pteranodon_mill_draw');
      if (eff) {
        showCardShowcaseBanner(m, 'AI ใช้สกิลพเทอราโนดอน!', '🦖 โม่กองการ์ด 2 ใบลงนรก แล้วจั่วการ์ด 1 ใบ!', '#16a34a');
        EffectEngine.activateSpecificEffect(eff, { caster: ai, opponent: player, sourceCard: m, sourceSlot: slotIdx, isAI: true });
        playSlotAnimation(false, slotIdx, 'fx-skill-glow');
        return true;
      }
    }

    // 3.0.2 เวโลซิแรปเตอร์ (DN02) Rest ตัวเองเพื่อบัฟไดโนตัวอื่นบนสนาม +2
    if (m.id === 'DN02' && m.state === 'Stand' && !m.usedSkills.raptor_buff) {
      const otherDino = ai.board.find((ally, idx) => ally && idx !== slotIdx && hasCardTribe(ally, 'ไดโน') && ally.state === 'Stand');
      if (otherDino) {
        m.state = 'Rest';
        m.usedSkills.raptor_buff = true;
        otherDino.tempPowerMod += 2;
        showCardShowcaseBanner(m, 'AI ใช้สกิลเวโลซิแรปเตอร์!', `🦖 Rest ตัวเอง บัฟพลังให้ "${otherDino.name}" +2 จนจบเทิร์น!`, '#16a34a');
        setLog(`🦖 [AI เวโลซิแรปเตอร์] Rest ตัวเองเพื่อเพิ่มพลังให้ "${otherDino.name}" +2 จนจบเทิร์น!`);
        renderGame();
        playSlotAnimation(false, slotIdx, 'fx-skill-glow');
        return true;
      }
    }

    // 3.1 โทโดโรจิต (M02) เก็บบาคุจิต
    if (m.id === 'M02' && !m.usedSkills.todoroRecover) {
      const bakuIdx = ai.graveyard.findIndex(c => c.id === 'M01');
      if (bakuIdx !== -1) {
        const baku = ai.graveyard.splice(bakuIdx, 1)[0];
        resetCardStateForZoneChange(baku);
        ai.hand.push(baku);
        m.usedSkills.todoroRecover = true;
        showCardShowcaseBanner(m, 'AI ใช้สกิลยูนิต!', '❄️ นำ "บาคุจิต" จากกองนรกกลับขึ้นมือ!', '#38bdf8');
        setLog('🤖 [AI โทโดโรจิต] นำ "บาคุจิต" จากกองนรกขึ้นมือ!');
        renderGame();
        playSlotAnimation(false, slotIdx, 'fx-skill-glow');
        return true;
      }
    }

    // 3.2 โทโดโรจิต (M02) โม่กองผู้เล่น
    if (diff === 'HARD' && m.id === 'M02' && !m.usedSkills.todoroMill && ai.hand.length >= 3 && player.deck.length > 0) {
      const discarded = ai.hand.pop();
      resetCardStateForZoneChange(discarded);
      ai.graveyard.push(discarded);
      const milled = player.deck.pop();
      resetCardStateForZoneChange(milled);
      player.graveyard.push(milled);
      m.usedSkills.todoroMill = true;
      showCardShowcaseBanner(m, 'AI ใช้สกิลยูนิต!', `❄️ โม่การ์ด "${milled.name}" จากกองคุณลงนรก!`, '#38bdf8');
      setLog(`❄️ [AI โทโดโรจิต] ทิ้ง "${discarded.name}" และโม่ "${milled.name}" จากกองคุณลงนรก!`);
      renderGame();
      playSlotAnimation(false, slotIdx, 'fx-skill-glow');
      return true;
    }

    // 3.3 ฮออ์กส์ฟีม (M06) ค้นหาเอ็นเดจิต
    const hasEndeInHand = ai.hand.some(c => c.id === 'M05');
    if (m.id === 'M06' && !m.usedSkills.hawksSearch && !hasEndeInHand && getEffectivePower(m, ai) >= 2) {
      if (ai.graveyard.some(c => c.id === 'M05') || ai.deck.some(c => c.id === 'M05')) {
        const zone = ai.graveyard.some(c => c.id === 'M05') ? 'grave' : 'deck';
        showCardShowcaseBanner(m, 'AI ใช้สกิลยูนิต!', '🦅 ลดพลัง -2 ค้นหา "เอ็นเดจิต" ขึ้นมือ!', '#38bdf8');
        executeHawksSearch(ai, slotIdx, zone);
        playSlotAnimation(false, slotIdx, 'fx-skill-glow');
        return true;
      }
    }

    // 3.4 ทหารพรานเหนือ (NM03)
    if (m.id === 'NM03' && !m.usedSkills.rangerTarget) {
      const enemySlotIdx = player.board.findIndex(em => em && em.id !== 'NM05' && !em.immuneToEnemyEffectsUntilEndOfTurn);
      if (enemySlotIdx !== -1) {
        const enemyTarget = player.board[enemySlotIdx];
        enemyTarget.permPowerMod -= 1;
        m.usedSkills.rangerTarget = true;
        showCardShowcaseBanner(m, 'AI ใช้สกิลทหารพรานเหนือ!', `🏹 ลดพลังของ "${enemyTarget.name}" ลง 1!`, '#16a34a');
        setLog(`🏹 [AI ทหารพรานเหนือ] ลดพลังโจมตีของ "${enemyTarget.name}" ลง 1!`);
        renderGame();
        playSlotAnimation(false, slotIdx, 'fx-skill-glow');
        playSlotAnimation(true, enemySlotIdx, 'fx-target-hit');
        return true;
      } else {
        m.permPowerMod += 1;
        m.usedSkills.rangerTarget = true;
        showCardShowcaseBanner(m, 'AI ใช้สกิลทหารพรานเหนือ!', '🏹 เพิ่มพลังโจมตีให้ตัวเอง +1!', '#16a34a');
        setLog('🏹 [AI ทหารพรานเหนือ] เพิ่มพลังโจมตีให้ตัวเอง +1!');
        renderGame();
        playSlotAnimation(false, slotIdx, 'fx-skill-glow');
        return true;
      }
    }

    // 3.5 โอนามิ ผู้ทำลายโลก (DM01) เรียกโรเซเลีย
    if (m.id === 'DM01' && !m.usedSkills.onamiSummon && ai.hand.length > 0 && ai.board.some(s => s === null)) {
      const roseliaInGrave = ai.graveyard.findIndex(c => c.id === 'DM02');
      const roseliaInDeck = ai.deck.findIndex(c => c.id === 'DM02');
      if (roseliaInGrave !== -1 || roseliaInDeck !== -1) {
        let discardIdx = ai.hand.findIndex(c => c.id === 'DM05');
        if (discardIdx === -1) discardIdx = 0;
        const discarded = ai.hand.splice(discardIdx, 1)[0];
        resetCardStateForZoneChange(discarded);
        ai.graveyard.push(discarded);

        if (discarded.id === 'DM05' && player.hand.length > 0) {
          const pDiscarded = player.hand.pop();
          resetCardStateForZoneChange(pDiscarded);
          player.graveyard.push(pDiscarded);
          setLog(`🍬 [AI ออโต้ซึรุรุ] ถูกทิ้งโดยโอนามิ -> บังคับทิ้ง "${pDiscarded.name}" บนมือคุณ!`);
        }

        const roselia = roseliaInGrave !== -1
          ? ai.graveyard.splice(roseliaInGrave, 1)[0]
          : ai.deck.splice(roseliaInDeck, 1)[0];
        if (roseliaInGrave === -1) ai.deck = shuffleDeck(ai.deck);
        resetCardStateForZoneChange(roselia);
        roselia.immuneToEnemyEffectsUntilEndOfTurn = true;
        const targetEmpty = ai.board.findIndex(s => s === null);
        if (targetEmpty !== -1) {
          ai.board[targetEmpty] = roselia;
          m.usedSkills.onamiSummon = true;
          showCardShowcaseBanner(roselia, 'AI สกิลคู่หูโอนามิ!', '🌊 อัญเชิญ "โรเซเลีย" ลงสนามเข้าสู่สถานะคู่หู!', '#ec4899');
          setLog('🌊 [AI โอนามิ] อัญเชิญ "โรเซเลีย" ลงสนามเข้าสู่สถานะคู่หู!');
          renderGame();
          return true;
        }
      }
    }

    // 3.6 โรเซเลีย (DM02) Rest จั่วการ์ด
    if (m.id === 'DM02' && m.state === 'Stand' && isPartnerActive(ai) && ai.hand.length <= 2) {
      m.state = 'Rest';
      drawCards(ai, 1);
      showCardShowcaseBanner(m, 'AI สกิลคู่หูโรเซเลีย!', '🌹 เปลี่ยนเป็น Rest เพื่อจั่วการ์ด 1 ใบ!', '#ec4899');
      setLog('🌹 [AI คู่หู - โรเซเลีย] เปลี่ยนเป็น Rest เพื่อจั่วการ์ด 1 ใบ!');
      renderGame();
      playSlotAnimation(false, slotIdx, 'fx-skill-glow');
      return true;
    }

    // 3.7 เอ็นเดจิต (M05) กดบัฟพลัง +2
    if (m.id === 'M05' && !m.usedSkills.endeBoost && canContestantAttack(ai, m).allowed) {
      showCardShowcaseBanner(m, 'AI ใช้สกิลเอ็นเดจิต!', '🔥 เพิ่มพลังโจมตี +2 จนจบเทิร์น!', '#dc2626');
      triggerEndeSkill(ai, slotIdx);
      renderGame();
      playSlotAnimation(false, slotIdx, 'fx-skill-glow');
      return true;
    }

    // 3.8 สกิล ACTIVATE_MAIN ของยูนิต (รองรับทั้งเด็คปีศาจ, เด็คโอ็ต และยูนิตทุกใบที่มีสกิลสั่งใช้)
    if (Array.isArray(m.effects)) {
      if (m.id === 'OM02' && (m.usedSkills && m.usedSkills.aiBankUsedThisTurn || ai.hand.length < 2)) continue;
      const eff = m.effects.find(e =>
        e.trigger === 'ACTIVATE_MAIN' &&
        (!m.usedSkills || !m.usedSkills[e.id]) &&
        EffectEngine.canActivateEffect(e, { caster: ai, opponent: player, sourceCard: m, sourceSlot: slotIdx, isAI: true }).ok
      );
      if (eff) {
        m.usedSkills = m.usedSkills || {};
        m.usedSkills[eff.id] = true;
        if (m.id === 'OM02') m.usedSkills.aiBankUsedThisTurn = true;
        showCardShowcaseBanner(m, 'AI ใช้สกิลยูนิต!', `⚡ ${eff.label || m.name}`, '#a855f7');
        EffectEngine.activateSpecificEffect(eff, { caster: ai, opponent: player, sourceCard: m, sourceSlot: slotIdx, isAI: true });
        playSlotAnimation(false, slotIdx, 'fx-skill-glow');
        return true;
      }
    }
  }

  // ==================== สเต็ปที่ 4: การ์ดอนาคต (DM09 - DM14) ทีละใบ ====================
  if (diff === 'HARD' && !ai.futureUsedThisTurn) {
    const futureHandIdx = ai.hand.findIndex(c =>
      c.futureBaseId && ai.board.some(m => m !== null && m.id === c.futureBaseId)
    );
    if (futureHandIdx !== -1) {
      const futureCard = ai.hand[futureHandIdx];
      const baseSlotIdx = ai.board.findIndex(m => m !== null && m.id === futureCard.futureBaseId);
      if (baseSlotIdx !== -1) {
        showCardShowcaseBanner(futureCard, 'AI อัญเชิญการ์ดอนาคต!', `🌌 ส่ง "${futureCard.futureBaseName}" ไปมิติมืด!`, '#6366f1');
        executeFutureSummon(ai, player, futureHandIdx, baseSlotIdx);
        return true;
      }
    }
  }

  // ==================== สเต็ปที่ 5: สกิล Leader (L01 มายฮีโร่ เดจิต / L04 ศูนย์วิจัยไดโน) ====================
  if (ai.leader.id === 'L01' && !ai.leader.abilityUsedThisTurn) {
    const targetSlot = ai.board.findIndex(m => m !== null && m.state === 'Stand' && m.id !== 'NM05');
    if (targetSlot !== -1) {
      const targetAlly = ai.board[targetSlot];
      targetAlly.tempPowerMod += 1;
      ai.leader.abilityUsedThisTurn = true;
      showCardShowcaseBanner(ai.leader, 'AI ใช้สกิล Leader!', `👑 เพิ่มพลังให้ "${targetAlly.name}" +1!`, '#ec4899');
      setLog(`👑 [AI มายฮีโร่ เดจิต] เพิ่มพลังให้ "${targetAlly.name}" +1 จนจบเทิร์น!`);
      renderGame();
      playSlotAnimation(false, targetSlot, 'fx-skill-glow');
      return true;
    }
  }

  if (ai.leader.id === 'L04' && !ai.leader.abilityUsedThisTurn) {
    const dinoGraveIdx = ai.graveyard.findIndex(c => c && c.type === 'Monster' && hasCardTribe(c, 'ไดโน'));
    if (dinoGraveIdx !== -1) {
      const recovered = ai.graveyard.splice(dinoGraveIdx, 1)[0];
      resetCardStateForZoneChange(recovered);
      ai.hand.push(recovered);
      ai.leader.abilityUsedThisTurn = true;
      showCardShowcaseBanner(ai.leader, 'AI ใช้สกิลศูนย์วิจัยไดโน!', `🦖 นำ "${recovered.name}" จากนรกขึ้นมือ!`, '#10b981');
      setLog(`👑 [AI ศูนย์วิจัยไดโน] นำ "${recovered.name}" จากนรกขึ้นมือ!`);
      renderGame();
      return true;
    }
  }

  // ==================== สเต็ปที่ 6: การ์ดเวทมนตร์ของ AI ====================
  if (ai.spellQuota.normalUsed < 1) {
    const casted = aiCastBestNormalSpell(ai, player, diff);
    if (casted) return true;
  }

  return false;
}

function aiCastBestNormalSpell(ai, player, diff) {
  // 0.1 DNA กลายพันธุ์ (DNS01)
  const dns01Idx = ai.hand.findIndex(c => c.id === 'DNS01');
  if (dns01Idx !== -1 && ai.deck.some(c => c && c.type === 'Monster' && hasCardTribe(c, 'ไดโน'))) {
    const spell = ai.hand.splice(dns01Idx, 1)[0];
    ai.spellQuota.normalUsed += 1;
    ai.graveyard.push(spell);
    const picked = [];
    for (let i = 0; i < 2; i++) {
      const dIdx = ai.deck.findIndex(c => c && c.type === 'Monster' && hasCardTribe(c, 'ไดโน'));
      if (dIdx === -1) break;
      const card = ai.deck.splice(dIdx, 1)[0];
      resetCardStateForZoneChange(card);
      ai.hand.push(card);
      picked.push(card.name);
    }
    ai.deck = shuffleDeck(ai.deck);
    showCardShowcaseBanner(spell, 'AI ใช้การ์ดเวทมนตร์!', `🧬 ค้นหา "${picked.join(', ')}" ขึ้นมือ!`, '#10b981');
    setLog(`🧬 AI ใช้เวทย์ "DNA กลายพันธุ์" ค้นหา "${picked.join(', ')}" จากกองขึ้นมือ!`);
    renderGame();
    return true;
  }

  // 0.2 ระบบกรงกักกันล้มเหลว (DNS02)
  const dns02Idx = ai.hand.findIndex(c => c.id === 'DNS02');
  if (dns02Idx !== -1 && ai.board.some(m => m !== null && hasCardTribe(m, 'ไดโน'))) {
    const spell = ai.hand.splice(dns02Idx, 1)[0];
    ai.spellQuota.normalUsed += 1;
    ai.graveyard.push(spell);
    ai.board.forEach(m => { if (m && hasCardTribe(m, 'ไดโน')) m.tempPowerMod += 1; });
    showCardShowcaseBanner(spell, 'AI ใช้การ์ดเวทมนตร์!', '🦖 ยูนิทเผ่าไดโนทุกใบพลัง +1 จนจบเทิร์น!', '#10b981');
    setLog('🦖 AI ใช้เวทย์ "ระบบกรงกักกันล้มเหลว" เพิ่มพลังให้เผ่าไดโนทุกใบ +1 จนจบเทิร์น!');
    renderGame();
    return true;
  }

  // 1. เชี่ย หุ้นตก (S02)
  const s02Idx = ai.hand.findIndex(c => c.id === 'S02');
  if (s02Idx !== -1 && player.board.some(m => m !== null && m.id !== 'NM05')) {
    const spell = ai.hand.splice(s02Idx, 1)[0];
    ai.spellQuota.normalUsed += 1;
    player.board.forEach(m => { if (m && !m.immuneToEnemyEffectsUntilEndOfTurn) m.tempPowerMod -= 3; });
    ai.graveyard.push(spell);
    showCardShowcaseBanner(spell, 'AI ใช้การ์ดเวทมนตร์!', '📉 ลดพลังยูนิทของคุณทุกใบลง 3 จนจบเทิร์น!', '#10b981');
    setLog('📉 AI ใช้เวทย์ "เชี่ย หุ้นตก" ลดพลังยูนิทของคุณทุกใบลง 3 จนจบเทิร์น!');
    renderGame();
    return true;
  }

  // 2. เบิกเนตรแห่งแสง (DS01)
  const ds01Idx = ai.hand.findIndex(c => c.id === 'DS01');
  if (ds01Idx !== -1) {
    const spell = ai.hand.splice(ds01Idx, 1)[0];
    ai.spellQuota.normalUsed += 1;
    const drawCnt = ai.graveyard.length >= 5 ? 2 : 1;
    drawCards(ai, drawCnt);
    const ally = ai.board.find(m => m !== null && m.id !== 'NM05');
    if (ally) ally.tempPowerMod += 1;
    ai.graveyard.push(spell);
    showCardShowcaseBanner(spell, 'AI ใช้การ์ดเวทมนตร์!', `✨ จั่วการ์ด ${drawCnt} ใบ และบัฟพลัง +1!`, '#10b981');
    setLog(`✨ AI ใช้เวทย์ "เบิกเนตรแห่งแสง" จั่วการ์ด ${drawCnt} ใบ และบัฟพลัง +1!`);
    renderGame();
    return true;
  }

  if (diff !== 'HARD') return false;

  // 3. โอ็ยใครเหยียบตีน!!! (S01)
  const s01Idx = ai.hand.findIndex(c => c.id === 'S01');
  const enemySlot = player.board.findIndex(m => m !== null && m.id !== 'NM05' && !m.immuneToEnemyEffectsUntilEndOfTurn);
  if (s01Idx !== -1 && ai.hand.length >= 2 && enemySlot !== -1) {
    const spell = ai.hand.splice(s01Idx, 1)[0];
    const discarded = ai.hand.pop();
    resetCardStateForZoneChange(discarded);
    ai.graveyard.push(discarded);
    ai.graveyard.push(spell);
    ai.spellQuota.normalUsed += 1;
    showCardShowcaseBanner(spell, 'AI ใช้การ์ดเวทมนตร์!', `🦶 ทิ้ง "${discarded.name}" ทำลายยูนิตช่องที่ ${enemySlot + 1}!`, '#10b981');
    destroyBoardMonster(player, enemySlot, false, true);
    setLog(`🦶 AI ใช้เวทย์ "โอ็ยใครเหยียบตีน!!!" ทิ้ง "${discarded.name}" เพื่อทำลายมอนสเตอร์ของคุณ!`);
    renderGame();
    playSlotAnimation(true, enemySlot, 'fx-target-hit');
    return true;
  }

  // 4. ระเบิดปูพรม (NS03)
  const ns03Idx = ai.hand.findIndex(c => c.id === 'NS03');
  const hasSoldiers = ai.board.some(m => m && (m.id === 'NM02' || m.id === 'NM03' || m.id === 'NM04'));
  if (ns03Idx !== -1 && hasSoldiers) {
    const spell = ai.hand.splice(ns03Idx, 1)[0];
    ai.spellQuota.normalUsed += 1;
    ai.graveyard.push(spell);
    const cCount = ai.board.filter(m => m && m.id === 'NM04').length;
    const rCount = ai.board.filter(m => m && m.id === 'NM03').length;
    const lCount = ai.board.filter(m => m && m.id === 'NM02').length;
    if (cCount > 0) ai.board.forEach(m => { if (m && isNueaCard(m)) m.tempPowerMod += cCount; });
    if (lCount > 0) ai.board.forEach(m => { if (m) m.indestructibleUntilNextTurn = true; });
    for (let k = 0; k < rCount; k++) {
      const targetIdx = player.board.findIndex(m => m !== null && m.id !== 'NM05' && !m.immuneToEnemyEffectsUntilEndOfTurn);
      if (targetIdx !== -1) destroyBoardMonster(player, targetIdx, false, true);
    }
    showCardShowcaseBanner(spell, 'AI ใช้การ์ดเวทมนตร์!', '💣 แสดงผลระเบิดปูพรมตามทหารบนสนาม!', '#10b981');
    setLog('💣 AI ใช้เวทย์ "ระเบิดปูพรม" แสดงผลตามยูนิตทหารบนสนาม!');
    renderGame();
    return true;
  }

  // 5. จีวรบิน (NS05)
  const ns05Idx = ai.hand.findIndex(c => c.id === 'NS05');
  if (ns05Idx !== -1 && enemySlot !== -1) {
    const spell = ai.hand.splice(ns05Idx, 1)[0];
    ai.spellQuota.normalUsed += 1;
    ai.graveyard.push(spell);
    const bounced = player.board[enemySlot];
    player.board[enemySlot] = null;
    resetCardStateForZoneChange(bounced);
    player.hand.push(bounced);
    showCardShowcaseBanner(spell, 'AI ใช้การ์ดเวทมนตร์!', `🌪️ ส่ง "${bounced.name}" ของคุณกลับขึ้นมือ!`, '#10b981');
    setLog(`🌪️ AI ใช้เวทย์ "จีวรบิน" ดีด "${bounced.name}" ของคุณกลับขึ้นมือ!`);
    renderGame();
    return true;
  }

  // 6. หมอสนามเหนือ (NS02) / หมอไพร่เหนือ (NS01)
  const ns02Idx = ai.hand.findIndex(c => c.id === 'NS02');
  if (ns02Idx !== -1 && ai.graveyard.some(c => isSoldierCard(c))) {
    const spell = ai.hand.splice(ns02Idx, 1)[0];
    ai.spellQuota.normalUsed += 1;
    const gIdx = ai.graveyard.findIndex(c => isSoldierCard(c));
    const rec = ai.graveyard.splice(gIdx, 1)[0];
    resetCardStateForZoneChange(rec);
    ai.hand.push(rec);
    ai.graveyard.push(spell);
    showCardShowcaseBanner(spell, 'AI ใช้การ์ดเวทมนตร์!', `✨ เก็บ "${rec.name}" จากนรกขึ้นมือ!`, '#10b981');
    setLog(`✨ AI ใช้ "หมอสนามเหนือ" เก็บ "${rec.name}" จากนรกขึ้นมือ!`);
    renderGame();
    return true;
  }

  const ns01Idx = ai.hand.findIndex(c => c.id === 'NS01');
  if (ns01Idx !== -1 && ai.graveyard.some(c => isPhraiCard(c))) {
    const spell = ai.hand.splice(ns01Idx, 1)[0];
    ai.spellQuota.normalUsed += 1;
    const gIdx = ai.graveyard.findIndex(c => isPhraiCard(c));
    const rec = ai.graveyard.splice(gIdx, 1)[0];
    resetCardStateForZoneChange(rec);
    ai.hand.push(rec);
    ai.graveyard.push(spell);
    showCardShowcaseBanner(spell, 'AI ใช้การ์ดเวทมนตร์!', `✨ เก็บ "${rec.name}" จากนรกขึ้นมือ!`, '#10b981');
    setLog(`✨ AI ใช้ "หมอไพร่เหนือ" เก็บ "${rec.name}" จากนรกขึ้นมือ!`);
    renderGame();
    return true;
  }

  // 7. เวทเด็คโอ็ต (OS01 ท่าไม้ตาย(มั้ง) / OS02 โดนแน่มึง)
  const osIdx = ai.hand.findIndex(c => c.id === 'OS01' || c.id === 'OS02');
  if (osIdx !== -1) {
    const spell = ai.hand[osIdx];
    const eff = (spell.effects || []).find(e => e.trigger === 'CAST_SPELL' || e.trigger === 'ON_CAST');
    if (eff && EffectEngine.canActivateEffect(eff, { caster: ai, opponent: player, sourceCard: spell, isAI: true }).ok) {
      ai.hand.splice(osIdx, 1);
      ai.spellQuota.normalUsed += 1;
      ai.graveyard.push(spell);
      showCardShowcaseBanner(spell, 'AI ใช้การ์ดเวทมนตร์!', `🤪 ${spell.name}!`, '#f97316');
      EffectEngine.activateSpecificEffect(eff, { caster: ai, opponent: player, sourceCard: spell, isAI: true });
      return true;
    }
  }

  return false;
}

// 🧠 สมองกล AI ช่วง Battle Phase (เว้นจังหวะการตีแต่ละตัวให้ผู้เล่นมองเห็นชัดเจน)
function aiPlayBattlePhase(slotIndex) {
  if (gameState.gameOver) return;
  // ถ้ามีหน้าต่างคำถาม หรือกำลังรอผลของสกิล ให้ AI หยุดรอก่อนโจมตี
  if (isInteractionBlocked()) {
    setTimeout(() => {
      aiPlayBattlePhase(slotIndex);
    }, 400);
    return;
  }
  const ai = gameState.ai;
  const player = gameState.player;
  const diff = aiConfig.difficulty;

  if (slotIndex >= 3) {
    // ตรวจสอบว่ามียูนิตที่ลุกขึ้น Stand จากสกิลออโต้ (เช่น อินโดมินัสเร็กซ์ / อินโดแรปเตอร์) หรือไม่
    const reStandSlot = ai.board.findIndex(m => m && m.state === 'Stand' && m.id !== 'NM05' && canContestantAttack(ai, m).allowed);
    if (reStandSlot !== -1) {
      setTimeout(() => aiPlayBattlePhase(reStandSlot), 900);
      return;
    }

    if (diff === 'HARD') {
      const emiSlot = ai.board.findIndex(m => m && m.id === 'DM08' && m.state === 'Rest' && !m.usedSkills.emiReattack);
      const hasDebirun = ai.board.some(m => m && m.id === 'DM04');
      if (emiSlot !== -1 && hasDebirun && ai.hand.length >= 3) {
        for (let i = 0; i < 3; i++) {
          const d = ai.hand.pop();
          resetCardStateForZoneChange(d);
          ai.graveyard.push(d);
        }
        ai.board[emiSlot].state = 'Stand';
        ai.board[emiSlot].usedSkills.emiReattack = true;
        showCardShowcaseBanner(ai.board[emiSlot], 'AI สกิลออโต้เอมิ!', '⚡ ทิ้งมือ 3 ใบ ลุกขึ้น Stand โจมตีอีกครั้ง!', '#f59e0b');
        setLog('⚡ [AI เอมิ] ทิ้งมือ 3 ใบเพื่อ Stand ลุกขึ้นมาโจมตีอีกครั้ง!');
        renderGame();
        playSlotAnimation(false, emiSlot, 'fx-skill-glow');
        setTimeout(() => aiPlayBattlePhase(emiSlot), 1100);
        return;
      }
    }
    setTimeout(endAITurn, 900);
    return;
  }

  const monster = ai.board[slotIndex];
  const check = canContestantAttack(ai, monster);
  if (!check.allowed || (monster && monster.id === 'NM05')) {
    aiPlayBattlePhase(slotIndex + 1);
    return;
  }

  const aiPower = getEffectivePower(monster, ai);
  const playerHasTsururu = player.board.some(m => m !== null && m.id === 'DM05');

  const playerHasStandBlocker = player.board.some(m => m !== null && m.state === 'Stand');
  if (diff === 'HARD' && player.leader.hp === 1 && !playerHasStandBlocker) {
    executeAttack(ai, player, slotIndex, 'leader', null, () => {
      setTimeout(() => aiPlayBattlePhase(slotIndex + 1), 1150);
    });
    return;
  }

  let bestTargetSlot = -1;
  let bestTargetPower = -1;

  if (diff !== 'EASY') {
    player.board.forEach((m, idx) => {
      if (m && m.id !== 'NM05') {
        if (m.id === 'DM03' && playerHasTsururu) return;
        const pPower = getEffectivePower(m, player);
        if (aiPower > pPower && pPower > bestTargetPower) {
          bestTargetPower = pPower;
          bestTargetSlot = idx;
        }
      }
    });
  }

  if (bestTargetSlot !== -1) {
    executeAttack(ai, player, slotIndex, 'monster', bestTargetSlot, () => {
      setTimeout(() => aiPlayBattlePhase(slotIndex + 1), 1150);
    });
  } else {
    executeAttack(ai, player, slotIndex, 'leader', null, () => {
      setTimeout(() => aiPlayBattlePhase(slotIndex + 1), 1150);
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
  }, 750);
}


/* ============================================================================
   หมวดที่ 9: ระบบแสดงคำอธิบายการ์ด (TOOLTIP + แตะค้างบนมือถือ) และ RENDER UI
   (พร้อมตรวจจับการ์ดที่เพิ่งลงสนามเพื่อเล่นแอนิเมชันอัตโนมัติ)
   ============================================================================ */
let previousBoardUids = {
  player: [null, null, null],
  ai: [null, null, null]
};

function getOrCreateTooltipElement() {
  let tooltip = document.getElementById('card-hover-tooltip');
  if (!tooltip) {
    tooltip = document.createElement('div');
    tooltip.id = 'card-hover-tooltip';
    tooltip.className = 'card-tooltip';
    document.body.appendChild(tooltip);
  }
  return tooltip;
}

function showCardTooltip(event, card, ownerContestant = null) {
  if (!card) return;
  const tooltip = getOrCreateTooltipElement();

  let statsHtml = '';
  if (card.type === 'Monster') {
    const currentPwr = getEffectivePower(card, ownerContestant);
    const basePwr = card.basePower !== undefined ? card.basePower : card.power;
    const tribeText = card.tribe ? ` | เผ่า: ${card.tribe}` : '';
    statsHtml = `<div class="tooltip-stats">⚔️ พลังโจมตี: ${currentPwr} (พื้นฐาน: ${basePwr})${tribeText} | สถานะ: ${card.state || 'Stand'}</div>`;
  } else if (card.type === 'Leader') {
    const currentHp = card.hp !== undefined ? card.hp : card.maxHp;
    statsHtml = `<div class="tooltip-stats">👑 พลังชีวิต (HP): ${currentHp} / ${card.maxHp}</div>`;
  }

  tooltip.innerHTML = `
    <div class="tooltip-header">
      <span class="tooltip-name">${card.name}</span>
      <span class="tooltip-type">${card.tribe ? `${card.type} • ${card.tribe}` : card.type}</span>
    </div>
    ${statsHtml}
    <div class="tooltip-desc">${card.desc || 'ไม่มีความสามารถพิเศษ'}</div>
  `;

  tooltip.style.display = 'block';
  moveCardTooltip(event);
}

function moveCardTooltip(event) {
  const tooltip = document.getElementById('card-hover-tooltip');
  if (!tooltip || tooltip.style.display === 'none') return;

  const offset = 16;
  let left = event.clientX + offset;
  let top = event.clientY + offset;

  const rect = tooltip.getBoundingClientRect();
  if (left + rect.width > window.innerWidth - 10) {
    left = event.clientX - rect.width - offset;
  }
  if (top + rect.height > window.innerHeight - 10) {
    top = event.clientY - rect.height - offset;
  }

  tooltip.style.left = `${Math.max(10, left)}px`;
  tooltip.style.top = `${Math.max(10, top)}px`;
}

function hideCardTooltip() {
  const tooltip = document.getElementById('card-hover-tooltip');
  if (tooltip) tooltip.style.display = 'none';
}

function attachCardTooltipEvents(element, card, ownerContestant = null) {
  element.addEventListener('mouseenter', (e) => {
    if (window.innerWidth > 768) showCardTooltip(e, card, ownerContestant);
  });
  element.addEventListener('mousemove', (e) => {
    if (window.innerWidth > 768) moveCardTooltip(e);
  });
  element.addEventListener('mouseleave', () => hideCardTooltip());
  element.addEventListener('click', () => hideCardTooltip());

  let touchTimer = null;
  element.addEventListener('touchstart', () => {
    touchTimer = setTimeout(() => {
      openCardDetailModal(card, ownerContestant);
    }, 450);
  }, { passive: true });

  element.addEventListener('touchend', () => {
    if (touchTimer) clearTimeout(touchTimer);
  });

  element.addEventListener('touchmove', () => {
    if (touchTimer) clearTimeout(touchTimer);
  });
}

function createCardElement(card, ownerContestant = null) {
  const effectivePower = getEffectivePower(card, ownerContestant);
  const div = document.createElement('div');
  div.className = `card ${card.type} ${card.state || ''}`;

  let statusTag = '';
  if (card.type === 'Monster') {
    if (card.burnLeaderOnKill) statusTag += '🔥';
    if (card.destroyAtEndOfTurn || card.returnFromDarkDimensionId) statusTag += '⏳';
    if (card.indestructibleUntilNextTurn || card.immuneToEnemyEffectsUntilEndOfTurn) statusTag += '🛡️';
  }

  const headerTypeText = card.tribe ? `${card.type} (${card.tribe}) ${statusTag}` : `${card.type} ${statusTag}`;

  div.innerHTML = `
    <div class="card-art">
      <img src="${card.image}" alt="${card.name}">
    </div>
    <div class="card-name">${card.name} ${statusTag}</div>
    ${card.type === 'Monster'
      ? `<div class="card-power">⚔️ ${effectivePower}</div>`
      : ''
    }
  `;
  div.addEventListener('mouseenter', () => updateCardDetailPanel(card));
  div.addEventListener('click', () => updateCardDetailPanel(card));

  attachCardTooltipEvents(div, card, ownerContestant);
  return div;
}

function renderBoardSlots(containerId, contestant, isPlayerBoard) {
  ensureVisualEffectsStyles();
  const container = document.getElementById(containerId);
  const slots = container.querySelectorAll('.slot');
  const pendingAction = gameState.pendingAction;
  const pendingType = pendingAction ? pendingAction.type : null;
  const selectedHandCard = (gameState.selectedHandIndex !== null && gameState.player)
    ? gameState.player.hand[gameState.selectedHandIndex]
    : null;
  const sideKey = isPlayerBoard ? 'player' : 'ai';

  slots.forEach((slotEl, idx) => {
    slotEl.innerHTML = '';
    slotEl.classList.remove('valid-target', 'attack-target');

    const monster = contestant.board[idx];
    const prevUid = previousBoardUids[sideKey][idx];

    if (monster) {
      const cardEl = createCardElement(monster, contestant);
      if (isPlayerBoard && gameState.selectedAttackerSlot === idx) {
        cardEl.classList.add('selected-attacker');
      }
      slotEl.appendChild(cardEl);
      // การ์ดใบใหม่ในช่องนี้ (ลงด้วยวิธีไหนก็ตาม) → เอฟเฟคโฮโลแตกตามระดับ
      if (monster.uid !== prevUid && window.SummonFx) SummonFx.play(slotEl, cardEl);
      previousBoardUids[sideKey][idx] = monster.uid;

      if (isPlayerBoard) {
        const matchesModularPlayerTarget = pendingType === 'MODULAR_SELECT_TARGET' &&
          (pendingAction.targetZone === 'PLAYER_BOARD' || pendingAction.targetZone === 'ANY_BOARD') &&
          (!pendingAction.requireStand || monster.state === 'Stand') &&
          (!pendingAction.filterTribe || hasCardTribe(monster, pendingAction.filterTribe)) &&
          (!pendingAction.filterName || hasCardName(monster, pendingAction.filterName));

        if (
          (gameState.phase === 'Main Phase' && selectedHandCard && !selectedHandCard.isSpy && !pendingType) ||
          pendingType === 'JUTI_SELECT_SLOT' ||
          pendingType === 'CALL_FROM_EFFECT_SELECT_SLOT' ||
          matchesModularPlayerTarget
        ) {
          slotEl.classList.add('valid-target');
        }
      }

      if (!isPlayerBoard) {
        const matchesModularEnemyTarget = pendingType === 'MODULAR_SELECT_TARGET' &&
          (pendingAction.targetZone === 'OPPONENT_BOARD' || pendingAction.targetZone === 'ANY_BOARD');

        if (
          gameState.selectedAttackerSlot !== null ||
          matchesModularEnemyTarget
        ) {
          slotEl.classList.add('attack-target');
        }
      }
    } else {
      previousBoardUids[sideKey][idx] = null;
      slotEl.textContent = `ช่อง ${idx + 1}`;
      if (isPlayerBoard && gameState.activeTurn === 'player' && gameState.phase === 'Main Phase') {
        if (
          (selectedHandCard && !selectedHandCard.isSpy && !pendingType) ||
          pendingType === 'JUTI_SELECT_SLOT' ||
          pendingType === 'CALL_FROM_EFFECT_SELECT_SLOT'
        ) {
          slotEl.classList.add('valid-target');
        }
      }
      if (!isPlayerBoard && gameState.activeTurn === 'player' && gameState.phase === 'Main Phase' && selectedHandCard && selectedHandCard.isSpy && !pendingType) {
        slotEl.classList.add('attack-target');
      }
    }

    slotEl.onclick = () => isPlayerBoard ? handlePlayerSlotClick(idx) : handleAISlotClick(idx);
  });
}

// วางทับฟังก์ชัน renderGame เดิมในหมวดที่ 9 ของ game.js (ปรับข้อความโควตาและชื่อ Leader ให้กระชับบนมือถือ)
function renderGame() {
  const { player, ai } = gameState;
  if (!player || !ai) return;

  ensureZoneUIAndViewers();
  setupInGameControlBar();

  const isMobileView = window.isMobileUI ? window.isMobileUI() : window.innerWidth <= 768;

  document.getElementById('ai-deck-count').textContent = ai.deck.length;
  document.getElementById('ai-grave-count').textContent = ai.graveyard.length;
  document.getElementById('ai-hand-count').textContent = ai.hand.length;
  const aiDarkCountEl = document.getElementById('ai-dark-count');
  if (aiDarkCountEl) aiDarkCountEl.textContent = ai.darkDimension.length;

  // แสดงตัวการ์ดลีดเดอร์ของ AI เต็มใบ พร้อมหลอดเลือด ❤️ มุมซ้ายบน
  const aiLeaderBox = document.getElementById('ai-leader-box');
  if (aiLeaderBox) {
    aiLeaderBox.innerHTML = '';
    const aiLeaderCard = createCardElement(ai.leader, ai);
    const aiHpBadge = document.createElement('div');
    aiHpBadge.className = 'leader-hp-badge';
    aiHpBadge.innerHTML = `❤️ <span id="ai-leader-hp">${ai.leader.hp}</span>/6`;
    aiLeaderBox.appendChild(aiHpBadge);
    aiLeaderBox.appendChild(aiLeaderCard);

    if (gameState.selectedAttackerSlot !== null && !gameState.pendingAction) {
      aiLeaderBox.classList.add('attack-target');
    } else {
      aiLeaderBox.classList.remove('attack-target');
    }
    aiLeaderBox.onclick = null;
    aiLeaderBox.oncontextmenu = (e) => {
      e.preventDefault();
      hideCardTooltip();
      openCardDetailModal(ai.leader, ai, aiLeaderBox);
    };
    aiLeaderBox.onmouseenter = (e) => showCardTooltip(e, ai.leader, ai);
    aiLeaderBox.onmousemove = (e) => moveCardTooltip(e);
    aiLeaderBox.onmouseleave = () => hideCardTooltip();
  }

  const hasActiveLeaderSkill = Array.isArray(player.leader.effects) && player.leader.effects.some(e => e.trigger === 'ACTIVATE_LEADER');

  document.getElementById('player-deck-count').textContent = player.deck.length;
  document.getElementById('player-grave-count').textContent = player.graveyard.length;
  const playerDarkCountEl = document.getElementById('player-dark-count');
  if (playerDarkCountEl) playerDarkCountEl.textContent = player.darkDimension.length;

  // แสดงตัวการ์ดลีดเดอร์ของผู้เล่นเต็มใบ พร้อมหลอดเลือด ❤️ มุมซ้ายบน
  const playerLeaderBox = document.getElementById('player-leader-box');
  if (playerLeaderBox) {
    playerLeaderBox.innerHTML = '';
    const playerLeaderCard = createCardElement(player.leader, player);
    if (hasActiveLeaderSkill) {
      if (player.leader.abilityUsedThisTurn) {
        playerLeaderCard.style.filter = 'grayscale(0.4)';
      } else {
        playerLeaderCard.style.boxShadow = '0 0 16px rgba(250, 204, 21, 0.9)';
      }
    }
    const playerHpBadge = document.createElement('div');
    playerHpBadge.className = 'leader-hp-badge';
    playerHpBadge.innerHTML = `❤️ <span id="player-leader-hp">${player.leader.hp}</span>/6`;
    playerLeaderBox.appendChild(playerHpBadge);
    playerLeaderBox.appendChild(playerLeaderCard);

    playerLeaderBox.style.cursor = 'pointer';
    playerLeaderBox.onclick = () => {
      hideCardTooltip();
      handlePlayerSlotClick('leader');
    };
    playerLeaderBox.oncontextmenu = (e) => {
      e.preventDefault();
      hideCardTooltip();
      openCardDetailModal(player.leader, player, playerLeaderBox);
    };
    playerLeaderBox.onmouseenter = (e) => showCardTooltip(e, player.leader, player);
    playerLeaderBox.onmousemove = (e) => moveCardTooltip(e);
    playerLeaderBox.onmouseleave = () => hideCardTooltip();
  }

  document.getElementById('turn-indicator').textContent = isMobileView
    ? `${gameState.activeTurn === 'player' ? 'ตาคุณ' : 'ตาคู่แข่ง'} · T${gameState.turnCount}`
    : `Turn ${gameState.turnCount} (${gameState.activeTurn === 'player' ? 'ตาคุณ' : 'ตาอีกฝ่าย'})`;
  document.getElementById('phase-indicator').textContent = gameState.phase;

  const normalQuotaEl = document.getElementById('normal-spell-quota');
  const reactionQuotaEl = document.getElementById('reaction-spell-quota');
  normalQuotaEl.textContent = isMobileView
    ? `✨ ${player.spellQuota.normalUsed}/1`
    : `Normal Spell: ${player.spellQuota.normalUsed} / 1`;
  reactionQuotaEl.textContent = isMobileView
    ? `🛡️ ${player.spellQuota.reactionUsed}/1`
    : `Reaction Spell: ${player.spellQuota.reactionUsed} / 1`;
  normalQuotaEl.title = 'Normal Spell ที่ใช้ในเทิร์นนี้';
  reactionQuotaEl.title = 'Reaction Spell ที่ใช้ในเทิร์นนี้';

  const passBtn = document.getElementById('btn-pass-turn-inline');
  if (passBtn) {
    const isWaitingDefense = (typeof pvpState !== 'undefined' && pvpState.waitingForDefense);
    passBtn.disabled = (gameState.activeTurn !== 'player' || gameState.gameOver || isWaitingDefense);
    // มือถือ: ข้อความสั้นลงแต่ยังขึ้นต้น "เฟสถัดไป" ให้ตรงกับโหมดฝึกสอน
    if (isWaitingDefense) {
      passBtn.textContent = isMobileView ? '⏳ รออีกฝ่ายป้องกัน' : '⏳ รออีกฝ่ายป้องกัน...';
      passBtn.style.background = '#475569';
    } else if (gameState.phase === 'Main Phase') {
      passBtn.textContent = isMobileView ? '⚔️ เฟสถัดไป · ต่อสู้' : '⚔️ เฟสถัดไป (Battle Phase)';
      passBtn.style.background = '#0284c7';
    } else if (gameState.phase === 'Battle Phase') {
      passBtn.textContent = isMobileView ? '⏭️ เฟสถัดไป · จบเทิร์น' : '⏭️ เฟสถัดไป (จบเทิร์น)';
      passBtn.style.background = '#d97706';
    } else {
      passBtn.textContent = isMobileView ? '⏳ รอคู่แข่ง' : '⏳ รอเทิร์นฝ่ายตรงข้าม...';
      passBtn.style.background = '#475569';
    }
  }

  renderBoardSlots('ai-board', ai, false);
  renderBoardSlots('player-board', player, true);

  const handContainer = document.getElementById('player-hand');
  handContainer.innerHTML = '';
  const pendingAction = gameState.pendingAction;
  const pendingType = pendingAction ? pendingAction.type : null;

  const shuffleBtn = document.getElementById('btn-shuffle-hand');
  if (shuffleBtn) shuffleBtn.disabled = gameState.activeTurn !== 'player' || !canShuffleHandNow();

  player.hand.forEach((card, idx) => {
    const cardEl = createCardElement(card, player);
    if (gameState.selectedHandIndex === idx) {
      cardEl.classList.add('selected-hand');
    }
    if (
      pendingType === 'MODULAR_SELECT_TARGET' &&
      pendingAction.targetZone === 'PLAYER_HAND' &&
      (!pendingAction.excludeHandUid || card.uid !== pendingAction.excludeHandUid)
    ) {
      cardEl.classList.add('selected-mulligan');
    }
    if (card.id === 'DM07' && player.unitsDestroyedThisTurn >= 2) {
      cardEl.style.outline = '3px solid #f59e0b';
      cardEl.style.boxShadow = '0 0 16px rgba(245, 158, 11, 0.9)';
    }
    if (Array.isArray(card.hybridMaterials) && canSummonHybridCard(player, card)) {
      cardEl.style.outline = '3px solid #10b981';
      cardEl.style.boxShadow = '0 0 16px rgba(16, 185, 129, 0.9)';
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

// 😈 สกิลออโต้เมื่อเริ่มเกมของหลีดเดอร์ "ปีศาจ" (L05):
// "ออโต้ : เมื่อเริ่มเกม นำการ์ด 'ดินแดนปีศาจ' ในกองไปที่มิติมืด จากนั้นจั่วการ์ด 2 ใบ และสับกอง"
function applyStartOfGameLeaderEffects(contestant) {
  if (!contestant || !contestant.leader) return;
  if (contestant.leader.id === 'L05' && !contestant.demonStartOfGameTriggered) {
    contestant.demonStartOfGameTriggered = true;
    let realmCard = null;
    const deckIdx = contestant.deck.findIndex(c => c && (c.id === 'DMS03' || c.name === 'ดินแดนปีศาจ'));
    if (deckIdx !== -1) {
      realmCard = contestant.deck.splice(deckIdx, 1)[0];
    } else {
      const handIdx = contestant.hand.findIndex(c => c && (c.id === 'DMS03' || c.name === 'ดินแดนปีศาจ'));
      if (handIdx !== -1) {
        realmCard = contestant.hand.splice(handIdx, 1)[0];
      }
    }
    if (realmCard) {
      resetCardStateForZoneChange(realmCard);
      contestant.darkDimension.push(realmCard);
    }
    contestant.deck = shuffleDeck(contestant.deck);
    drawCards(contestant, 2);
    setLog(`😈 [ออโต้เริ่มเกม - ${contestant.leader.name}] (${contestant.name}) นำ "ดินแดนปีศาจ" ไปยังมิติมืด จั่วการ์ด 2 ใบ และสับกอง!`);
  }
}

function startAIFirstTurn() {
  if (gameState.gameOver) return;
  gameState.activeTurn = 'ai';
  gameState.turnCount = 1;
  gameState.phase = 'Start Phase';

  setLog(`🤖 ตาของ ${gameState.ai.name} (เริ่มก่อน): จั่วการ์ด 1 ใบและเตรียมพร้อมยูนิต`);
  executeStartPhase(gameState.ai, () => {
    renderGame();
    setTimeout(() => {
      if (gameState.gameOver) return;
      gameState.phase = 'Main Phase';
      setLog(`🤖 ${gameState.ai.name} เข้าสู่ Main Phase...`);
      renderGame();
      setTimeout(() => aiPlayMainPhase(onAIMainPhaseDone), 900);
    }, 1000);
  });
}

document.getElementById('btn-confirm-mulligan').addEventListener('click', () => {
  performMulligan(gameState.player, gameState.mulliganSelected);
  applyStartOfGameLeaderEffects(gameState.player);
  applyStartOfGameLeaderEffects(gameState.ai);
  document.getElementById('mulligan-modal').style.display = 'none';

  if (gameState.activeTurn === 'ai') {
    startAIFirstTurn();
  } else {
    startPlayerTurn();
  }
});

// หน้าต่างเลือก (เช่น ขุนเหนือ) เปิดค้างโดยไม่ตั้ง pendingAction → ห้ามสับไพ่ใต้หน้าต่างนั้น
function isChoiceModalOpen() {
  const m = document.getElementById('custom-choice-modal');
  return !!m && m.style.display !== 'none';
}

function startPlayerTurn() {
  if (gameState.gameOver) return;
  gameState.phase = 'Main Phase';
  gameState.pendingAction = null;

  executeStartPhase(gameState.player, () => {
    setLog(`🟢 เทิร์นของคุณ (ครั้งที่ ${gameState.player.turnsTaken}): ลงการ์ด/ใช้สกิลใน Main Phase หรือกด "⚔️ เฟสถัดไป (Battle Phase)" เพื่อโจมตี!`);
    renderGame();
    if (typeof HandShuffle !== 'undefined' && HandShuffle.enabled() && canShuffleHandNow()) HandShuffle.run(gameState.player.hand).catch(e => console.warn('HandShuffle', e));
  });
}

// สับมือได้เฉพาะตอนไม่มีอะไรค้าง (pendingAction บางตัวจำดัชนีการ์ดในมือไว้ / กำลังลากการ์ดอยู่)
function canShuffleHandNow() {
  return !gameState.pendingAction && !gameState.gameOver && gameState.player.hand.length >= 2 && !isChoiceModalOpen()
    && !(window.CardDrag && CardDrag.isBusy());
}

// ปุ่ม 🔀 สับเล่นๆ: ทำงานแม้ปิดการสับทุกเทิร์นในตั้งค่า, เฉพาะเทิร์นเรา (เทิร์น AI วาดมือใหม่บ่อยจนแอนิเมชันถูกตัด)
document.getElementById('btn-shuffle-hand')?.addEventListener('click', () => {
  if (typeof HandShuffle === 'undefined' || HandShuffle.isBusy()) return;
  if (gameState.activeTurn !== 'player' || !canShuffleHandNow()) return;
  HandShuffle.run(gameState.player.hand).catch(e => console.warn('HandShuffle', e));
});


/* ============================================================================
   หมวดที่ 10: ระบบหน้าต่างจัดเด็ค (5 สล็อต + แชร์ Deck Code) และการสร้างเกม
   ============================================================================ */
const DECK_SLOTS_STORAGE_KEY = 'bof_deck_slots_v1';
const TOTAL_DECK_SLOTS = 5;

function createDefaultDeckSlotsState() {
  let firstSlot = { name: 'เด็คจัดเอง #1', leaderId: 'L01', mainDeck: [...DEFAULT_DECK_LIST] };
  try {
    const legacy = JSON.parse(localStorage.getItem('my_card_game_deck'));
    if (legacy && legacy.leaderId && Array.isArray(legacy.mainDeck) && legacy.mainDeck.length === 20) {
      firstSlot = {
        name: legacy.name || 'เด็คจัดเอง #1',
        leaderId: legacy.leaderId,
        mainDeck: [...legacy.mainDeck]
      };
    }
  } catch (e) {}

  const presets = [
    firstSlot,
    { name: 'เด็คจัดเอง #2', leaderId: 'L02', mainDeck: [...DEFAULT_NUEA_DECK_LIST] },
    { name: 'เด็คจัดเอง #3', leaderId: 'L03', mainDeck: [...DEFAULT_DOOMSDAY_DECK_LIST] },
    { name: 'เด็คจัดเอง #4', leaderId: 'L04', mainDeck: [...DEFAULT_DINO_DECK_LIST] },
    { name: 'เด็คจัดเอง #5', leaderId: 'L05', mainDeck: [...DEFAULT_DEMON_DECK_LIST] }
  ];
  return { activeSlot: 0, slots: presets };
}

function loadDeckSlotsState() {
  try {
    const raw = JSON.parse(localStorage.getItem(DECK_SLOTS_STORAGE_KEY));
    if (raw && Array.isArray(raw.slots) && raw.slots.length === TOTAL_DECK_SLOTS) {
      const idx = Math.max(0, Math.min(TOTAL_DECK_SLOTS - 1, Number(raw.activeSlot || 0)));
      return {
        activeSlot: idx,
        slots: raw.slots.map((s, i) => ({
          name: String((s && s.name) || `เด็คจัดเอง #${i + 1}`).slice(0, 24),
          leaderId: (s && s.leaderId) || 'L01',
          mainDeck: Array.isArray(s && s.mainDeck) ? [...s.mainDeck] : [...DEFAULT_DECK_LIST]
        }))
      };
    }
  } catch (e) {}
  return createDefaultDeckSlotsState();
}

let deckSlotsState = loadDeckSlotsState();

function persistDeckSlotsState() {
  try {
    localStorage.setItem(DECK_SLOTS_STORAGE_KEY, JSON.stringify(deckSlotsState));
    const active = deckSlotsState.slots[deckSlotsState.activeSlot];
    if (active && active.leaderId && Array.isArray(active.mainDeck) && active.mainDeck.length === 20) {
      localStorage.setItem('my_card_game_deck', JSON.stringify(active));
    }
  } catch (e) {}
}

function encodeDeckCode(cfg) {
  if (!cfg || !cfg.leaderId || !Array.isArray(cfg.mainDeck)) return '';
  const counts = {};
  cfg.mainDeck.forEach(id => {
    counts[id] = (counts[id] || 0) + 1;
  });
  const body = Object.entries(counts).map(([id, n]) => `${id}.${n}`).join('_');
  return `BOF1-${cfg.leaderId}-${body}`;
}

function decodeDeckCode(rawCode) {
  const code = String(rawCode || '').trim();
  if (!code) throw new Error('กรุณาวางรหัสเด็ค (Deck Code) ก่อนกดนำเข้า');

  let leaderId = '';
  let mainDeck = [];
  let customName = '';

  if (/^BOF1-/i.test(code)) {
    const parts = code.split('-');
    if (parts.length < 3) throw new Error('รูปแบบรหัสเด็คไม่ถูกต้อง (ต้องขึ้นต้นด้วย BOF1-...)');
    leaderId = parts[1].trim().toUpperCase();
    const pairs = parts.slice(2).join('-').split('_').filter(Boolean);
    pairs.forEach(p => {
      const [cidRaw, cntRaw] = p.split('.');
      const cid = String(cidRaw || '').trim().toUpperCase();
      const cnt = Math.max(1, Math.min(4, Number(cntRaw || 1)));
      for (let i = 0; i < cnt; i++) mainDeck.push(cid);
    });
  } else {
    try {
      const parsed = JSON.parse(decodeURIComponent(atob(code)));
      leaderId = parsed.leaderId;
      mainDeck = Array.isArray(parsed.mainDeck) ? parsed.mainDeck : [];
      customName = parsed.name || '';
    } catch (e) {
      throw new Error('รหัสเด็คไม่ถูกต้อง! ตัวอย่างรหัสที่รองรับ: BOF1-L01-M01.2_M02.2...');
    }
  }

  const leaderCard = CARD_DATABASE.find(c => c.id === leaderId && c.type === 'Leader');
  if (!leaderCard) throw new Error(`ไม่พบการ์ด Leader รหัส "${leaderId}"`);

  if (mainDeck.length !== 20) {
    throw new Error(`รหัสเด็คนี้มีการ์ด ${mainDeck.length} ใบ (กติกาต้องครบ 20 ใบพอดี)`);
  }

  const copyCheck = {};
  for (const cid of mainDeck) {
    const card = CARD_DATABASE.find(c => c.id === cid && c.type !== 'Leader');
    if (!card) throw new Error(`ไม่พบการ์ดรหัส "${cid}" ในฐานข้อมูล`);
    copyCheck[cid] = (copyCheck[cid] || 0) + 1;
    const maxAllowed = getCardMaxCopies(card);
    if (copyCheck[cid] > maxAllowed) {
      throw new Error(`การ์ด "${card.name}" ใส่เกินจำนวนสูงสุดที่กำหนด (${maxAllowed} ใบ)`);
    }
  }

  // ตรวจสอบจำนวนการ์ดในคลังหากผู้เล่นล็อกอินอยู่
  if (window.BOFAuth && typeof window.BOFAuth.currentUser === 'function' && window.BOFAuth.currentUser() && window.BOFShop && typeof window.BOFShop.getEconomy === 'function') {
    const eco = window.BOFShop.getEconomy();
    const owned = (eco && eco.ownedCards) || {};
    if ((owned[leaderId] || 0) < 1) {
      throw new Error(`คุณยังไม่มี Leader "${leaderCard.name}" ในคลังการ์ด`);
    }
    for (const [cid, need] of Object.entries(copyCheck)) {
      const have = Number(owned[cid] || 0);
      if (have < need) {
        const cObj = CARD_DATABASE.find(c => c.id === cid);
        throw new Error(`การ์ด "${cObj ? cObj.name : cid}" ในคลังมี ${have}/${need} ใบ (สุ่มซองหรือหลอมการ์ดเพิ่มก่อน)`);
      }
    }
  }

  return { leaderId, mainDeck, name: customName };
}

let currentDeckConfig = loadSavedDeck();

function loadSavedDeck() {
  try {
    deckSlotsState = loadDeckSlotsState();
    const active = deckSlotsState.slots[deckSlotsState.activeSlot];
    if (active && active.leaderId && Array.isArray(active.mainDeck) && active.mainDeck.length === 20) {
      return {
        name: active.name || `เด็คจัดเอง #${deckSlotsState.activeSlot + 1}`,
        leaderId: active.leaderId,
        mainDeck: [...active.mainDeck]
      };
    }
    const saved = localStorage.getItem('my_card_game_deck');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.leaderId && Array.isArray(parsed.mainDeck) && parsed.mainDeck.length === 20) {
        return {
          name: parsed.name || 'เด็คของฉัน',
          leaderId: parsed.leaderId,
          mainDeck: [...parsed.mainDeck]
        };
      }
    }
  } catch (e) {
    console.warn('โหลดเด็คไม่สำเร็จ ใช้เด็คมาตรฐานแทน');
  }
  return { name: 'เด็คจัดเอง #1', leaderId: 'L01', mainDeck: [...DEFAULT_DECK_LIST] };
}

window.BOFDeckSlots = {
  getState: () => deckSlotsState,
  getActiveSlotIndex: () => deckSlotsState.activeSlot,
  getActiveDeck: () => {
    const s = deckSlotsState.slots[deckSlotsState.activeSlot];
    return s ? { ...s, mainDeck: [...s.mainDeck] } : loadSavedDeck();
  },
  selectSlot: (idx) => {
    const validIdx = Math.max(0, Math.min(TOTAL_DECK_SLOTS - 1, Number(idx || 0)));
    deckSlotsState.activeSlot = validIdx;
    const slot = deckSlotsState.slots[validIdx];
    currentDeckConfig = {
      name: slot.name || `เด็คจัดเอง #${validIdx + 1}`,
      leaderId: slot.leaderId,
      mainDeck: [...slot.mainDeck]
    };
    persistDeckSlotsState();
    if (window.LobbyView && typeof window.LobbyView.refreshMine === 'function') {
      window.LobbyView.refreshMine();
    }
    return currentDeckConfig;
  },
  encodeDeckCode,
  decodeDeckCode,
  exportState: () => JSON.parse(JSON.stringify(deckSlotsState)),
  importState: (state) => {
    if (!state || !Array.isArray(state.slots)) return;
    deckSlotsState = {
      activeSlot: Math.max(0, Math.min(TOTAL_DECK_SLOTS - 1, Number(state.activeSlot || 0))),
      slots: state.slots.slice(0, TOTAL_DECK_SLOTS).map((s, i) => ({
        name: String((s && s.name) || `เด็คจัดเอง #${i + 1}`).slice(0, 24),
        leaderId: (s && s.leaderId) || 'L01',
        mainDeck: Array.isArray(s && s.mainDeck) ? [...s.mainDeck] : [...DEFAULT_DECK_LIST]
      }))
    };
    persistDeckSlotsState();
  }
};

function showDeckBuilderFeedback(msg, isError = false) {
  const fb = document.getElementById('deck-code-feedback');
  if (!fb) return;
  fb.textContent = msg;
  fb.className = 'deck-code-feedback ' + (isError ? 'is-error' : 'is-ok');
  fb.style.display = 'block';
  if (window._deckFbTimer) clearTimeout(window._deckFbTimer);
  window._deckFbTimer = setTimeout(() => {
    if (fb) fb.style.display = 'none';
  }, 4000);
}

function autoBuildDeckForLeader(leaderId) {
  const targetLeaderId = leaderId || currentDeckConfig.leaderId || 'L01';
  const presetList = typeof getDefaultDeckForLeader === 'function'
    ? [...getDefaultDeckForLeader(targetLeaderId)]
    : [...DEFAULT_DECK_LIST];

  const isLogged = window.BOFAuth && typeof window.BOFAuth.currentUser === 'function' && !!window.BOFAuth.currentUser();
  if (!isLogged || !window.BOFShop || typeof window.BOFShop.getEconomy !== 'function') {
    return presetList;
  }

  const eco = window.BOFShop.getEconomy();
  const owned = (eco && eco.ownedCards) || {};
  const result = [];
  const usedCounts = {};

  // 1. ใส่การ์ดจากชุดมาตรฐานของ Leader นั้นตามจำนวนที่มีจริงในคลังก่อน
  for (const cid of presetList) {
    const cardObj = CARD_DATABASE.find(c => c.id === cid && c.type !== 'Leader');
    if (!cardObj) continue;
    const ruleMax = getCardMaxCopies(cardObj);
    const have = Number(owned[cid] || 0);
    const allowed = Math.min(ruleMax, have);
    const curr = usedCounts[cid] || 0;
    if (curr < allowed && result.length < 20) {
      result.push(cid);
      usedCounts[cid] = curr + 1;
    }
  }

  // 2. หากการ์ดในคลังของสายนั้นยังไม่ครบ 20 ใบ ให้เติมการ์ดใบอื่นที่มีในคลังให้อัตโนมัติจนครบ 20 ใบ
  if (result.length < 20) {
    const leaderCard = CARD_DATABASE.find(c => c.id === targetLeaderId);
    const preferredTribe = leaderCard && leaderCard.tribe ? leaderCard.tribe : null;
    const allMain = CARD_DATABASE.filter(c => c.type !== 'Leader' && Number(owned[c.id] || 0) > 0);
    allMain.sort((a, b) => {
      const aMatch = preferredTribe && hasCardTribe(a, preferredTribe) ? 1 : 0;
      const bMatch = preferredTribe && hasCardTribe(b, preferredTribe) ? 1 : 0;
      if (aMatch !== bMatch) return bMatch - aMatch;
      return (b.power || 0) - (a.power || 0);
    });
    for (const cardObj of allMain) {
      if (result.length >= 20) break;
      const ruleMax = getCardMaxCopies(cardObj);
      const have = Number(owned[cardObj.id] || 0);
      const allowed = Math.min(ruleMax, have);
      while ((usedCounts[cardObj.id] || 0) < allowed && result.length < 20) {
        result.push(cardObj.id);
        usedCounts[cardObj.id] = (usedCounts[cardObj.id] || 0) + 1;
      }
    }
  }

  return result;
}

function ensureDeckSlotsToolbar() {
  const modalBox = document.querySelector('#deck-builder-modal .deck-builder-box');
  const header = document.querySelector('#deck-builder-modal .deck-builder-header');
  if (!modalBox || !header) return;

  // เพิ่มปุ่มปิดหน้าต่างจัดเด็คถ้ายังไม่มี
  const headerBtnRow = header.querySelector('div:last-child');
  if (headerBtnRow && !document.getElementById('btn-close-deck-builder')) {
    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.id = 'btn-close-deck-builder';
    closeBtn.className = 'btn';
    closeBtn.style.background = '#334155';
    closeBtn.textContent = '✕ ปิด';
    closeBtn.onclick = () => {
      document.getElementById('deck-builder-modal').style.display = 'none';
    };
    headerBtnRow.appendChild(closeBtn);
  }

  let toolbar = document.getElementById('bof-deck-slots-toolbar');
  if (!toolbar) {
    toolbar = document.createElement('div');
    toolbar.id = 'bof-deck-slots-toolbar';
    toolbar.className = 'deck-slots-toolbar';
    header.insertAdjacentElement('afterend', toolbar);
  }

  const activeIdx = deckSlotsState.activeSlot;
  const activeSlot = deckSlotsState.slots[activeIdx] || {};
  const deckNameVal = currentDeckConfig.name || activeSlot.name || `เด็คจัดเอง #${activeIdx + 1}`;
  const currentCode = encodeDeckCode(currentDeckConfig);

  toolbar.innerHTML = `
    <div class="deck-code-actions-row">
      <div class="deck-slot-choice-group">
        <label for="select-builder-deck-slot">🗂️ สล็อตที่กำลังแก้ไข:</label>
        <select id="select-builder-deck-slot" class="deck-slot-choice-select">
          ${deckSlotsState.slots.map((slot, idx) => {
            const lId = idx === activeIdx ? currentDeckConfig.leaderId : slot.leaderId;
            const leader = CARD_DATABASE.find(c => c.id === lId);
            const count = idx === activeIdx ? currentDeckConfig.mainDeck.length : (slot.mainDeck ? slot.mainDeck.length : 0);
            const name = idx === activeIdx ? deckNameVal : (slot.name || `เด็คจัดเอง #${idx + 1}`);
            return `<option value="${idx}" ${idx === activeIdx ? 'selected' : ''}>สล็อต #${idx + 1}: ${name} (👑 ${leader ? leader.name : lId} · ${count}/20 ใบ)</option>`;
          }).join('')}
        </select>
        <button type="button" class="btn deck-slot-switch-modal-btn" id="btn-reopen-slot-picker" title="กลับไปหน้าเลือกสล็อตทั้งหมด">🔄 เปลี่ยนสล็อต</button>
      </div>

      <div class="deck-name-edit-group">
        <label for="input-deck-slot-name">✏️ ชื่อเด็ค:</label>
        <input type="text" id="input-deck-slot-name" maxlength="22" value="${deckNameVal.replace(/"/g, '&quot;')}" placeholder="ตั้งชื่อเด็คของคุณ...">
      </div>

      <div class="deck-code-share-group">
        <input type="text" id="input-deck-share-code" value="${currentCode}" placeholder="วางรหัสเด็ค (Deck Code) เช่น BOF1-L01-...">
        <button type="button" class="btn deck-code-btn is-copy" id="btn-copy-deck-code" title="คัดลอกรหัสเด็คส่งให้เพื่อน">📋 คัดลอกโค้ด</button>
        <button type="button" class="btn deck-code-btn is-import" id="btn-import-deck-code" title="นำเข้าเด็คจากรหัสที่วาง">📥 นำเข้าโค้ด</button>
      </div>
    </div>
    <p id="deck-code-feedback" class="deck-code-feedback" style="display:none;"></p>
  `;

  const slotSelect = document.getElementById('select-builder-deck-slot');
  if (slotSelect) {
    slotSelect.onchange = () => {
      const targetIdx = Number(slotSelect.value || 0);
      if (targetIdx === deckSlotsState.activeSlot) return;
      deckSlotsState.slots[deckSlotsState.activeSlot] = {
        name: currentDeckConfig.name || `เด็คจัดเอง #${deckSlotsState.activeSlot + 1}`,
        leaderId: currentDeckConfig.leaderId,
        mainDeck: [...currentDeckConfig.mainDeck]
      };
      deckSlotsState.activeSlot = targetIdx;
      const nextSlot = deckSlotsState.slots[targetIdx];
      currentDeckConfig = {
        name: nextSlot.name || `เด็คจัดเอง #${targetIdx + 1}`,
        leaderId: nextSlot.leaderId,
        mainDeck: [...nextSlot.mainDeck]
      };
      persistDeckSlotsState();
      window.renderDeckBuilder();
      showDeckBuilderFeedback(`🗂️ สลับมาแก้ไข "สล็อต #${targetIdx + 1}: ${currentDeckConfig.name}" แล้ว`);
    };
  }

  const reopenBtn = document.getElementById('btn-reopen-slot-picker');
  if (reopenBtn) {
    reopenBtn.onclick = () => {
      deckSlotsState.slots[deckSlotsState.activeSlot] = {
        name: currentDeckConfig.name || `เด็คจัดเอง #${deckSlotsState.activeSlot + 1}`,
        leaderId: currentDeckConfig.leaderId,
        mainDeck: [...currentDeckConfig.mainDeck]
      };
      persistDeckSlotsState();
      document.getElementById('deck-builder-modal').style.display = 'none';
      openDeckSlotPickerModal();
    };
  }

  const nameInput = document.getElementById('input-deck-slot-name');
  if (nameInput) {
    nameInput.oninput = () => {
      const val = nameInput.value.trim() || `เด็คจัดเอง #${deckSlotsState.activeSlot + 1}`;
      currentDeckConfig.name = val;
      deckSlotsState.slots[deckSlotsState.activeSlot].name = val;
      if (slotSelect && slotSelect.options[deckSlotsState.activeSlot]) {
        const leader = CARD_DATABASE.find(c => c.id === currentDeckConfig.leaderId);
        slotSelect.options[deckSlotsState.activeSlot].textContent =
          `สล็อต #${deckSlotsState.activeSlot + 1}: ${val} (👑 ${leader ? leader.name : currentDeckConfig.leaderId} · ${currentDeckConfig.mainDeck.length}/20 ใบ)`;
      }
    };
  }

  const copyBtn = document.getElementById('btn-copy-deck-code');
  if (copyBtn) {
    copyBtn.onclick = () => {
      const codeStr = encodeDeckCode(currentDeckConfig);
      const codeInput = document.getElementById('input-deck-share-code');
      if (codeInput) codeInput.value = codeStr;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(codeStr).then(() => {
          showDeckBuilderFeedback(`✅ คัดลอก Deck Code "${codeStr}" แล้ว! ส่งให้เพื่อนวางในช่องนำเข้าได้เลย`);
        }).catch(() => {
          if (codeInput) { codeInput.select(); document.execCommand('copy'); }
          showDeckBuilderFeedback(`✅ คัดลอก Deck Code แล้ว!`);
        });
      } else {
        if (codeInput) { codeInput.select(); document.execCommand('copy'); }
        showDeckBuilderFeedback(`✅ คัดลอก Deck Code แล้ว!`);
      }
    };
  }

  const importBtn = document.getElementById('btn-import-deck-code');
  if (importBtn) {
    importBtn.onclick = () => {
      const codeInput = document.getElementById('input-deck-share-code');
      const raw = codeInput ? codeInput.value.trim() : '';
      try {
        const decoded = decodeDeckCode(raw);
        currentDeckConfig.leaderId = decoded.leaderId;
        currentDeckConfig.mainDeck = [...decoded.mainDeck];
        if (decoded.name) currentDeckConfig.name = decoded.name;
        deckSlotsState.slots[deckSlotsState.activeSlot] = {
          name: currentDeckConfig.name || `เด็คจัดเอง #${deckSlotsState.activeSlot + 1}`,
          leaderId: currentDeckConfig.leaderId,
          mainDeck: [...currentDeckConfig.mainDeck]
        };
        persistDeckSlotsState();
        window.renderDeckBuilder();
        showDeckBuilderFeedback('🎉 นำเข้า Deck Code สำเร็จ! โหลดการ์ดทั้ง 21 ใบเข้าสู่สล็อตนี้แล้ว');
      } catch (err) {
        showDeckBuilderFeedback(`❌ ${err.message || 'รหัสเด็คไม่ถูกต้อง'}`, true);
      }
    };
  }
}

function openDeckBuilderEditorForSlot(slotIdx) {
  deckSlotsState = loadDeckSlotsState();
  const validIdx = Math.max(0, Math.min(TOTAL_DECK_SLOTS - 1, Number(slotIdx ?? deckSlotsState.activeSlot ?? 0)));
  deckSlotsState.activeSlot = validIdx;
  const active = deckSlotsState.slots[validIdx];
  if (active) {
    currentDeckConfig = {
      name: active.name || `เด็คจัดเอง #${validIdx + 1}`,
      leaderId: active.leaderId,
      mainDeck: [...active.mainDeck]
    };
  }
  persistDeckSlotsState();
  document.getElementById('mulligan-modal').style.display = 'none';
  const pickerModal = document.getElementById('deck-slot-picker-modal');
  if (pickerModal) pickerModal.style.display = 'none';
  document.getElementById('deck-builder-modal').style.display = 'flex';
  window.renderDeckBuilder();
}

function openDeckSlotPickerModal() {
  deckSlotsState = loadDeckSlotsState();
  let modal = document.getElementById('deck-slot-picker-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'deck-slot-picker-modal';
    modal.className = 'modal-overlay';
    modal.style.display = 'none';
    modal.style.zIndex = '260';
    document.body.appendChild(modal);
  }

  const activeIdx = deckSlotsState.activeSlot || 0;
  const LV = window.LobbyView || {};
  const colourOf = id => (LV.colours && LV.colours[id]) || '#f3c969';
  const thumbOf = img => String(img || 'images/เด็คจิต/1.png').replace(/^images\//, 'images/thumbs/').replace(/\.png$/, '.webp');
  const esc = s => String(s).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
  const info = deckSlotsState.slots.map((s, idx) => {
    const l = CARD_DATABASE.find(c => c.id === s.leaderId);
    const cnt = Array.isArray(s.mainDeck) ? s.mainDeck.length : 0;
    return {
      idx, cnt, ready: !!l && cnt === 20,
      name: esc(s.name || `เด็คจัดเอง #${idx + 1}`),
      leader: esc(l ? l.name : s.leaderId),
      img: l ? l.image : 'images/เด็คจิต/1.png',
      c: colourOf(s.leaderId)
    };
  });
  const inUse = idx => idx === deckSlotsState.activeSlot && typeof LV.selectedDeck === 'function' && LV.selectedDeck() === 'mine';
  let sel = activeIdx;

  // แบบ A "ชั้นวาง + รายละเอียด": รายการสล็อตย่อทางซ้าย · สล็อตที่เลือกแสดงเต็มทางขวา พร้อมปุ่มแก้ไข / ใช้ดวล
  modal.innerHTML = `
    <div class="modal-box deck-slot-picker-box sp-box" role="dialog" aria-modal="true" aria-labelledby="sp-title">
      <div class="sp-head">
        <div><h2 id="sp-title">เด็คของฉัน</h2><p>เลือกสล็อต แล้วแก้ไขหรือใช้ดวลได้ทันที</p></div>
        <button type="button" id="btn-close-slot-picker-x" class="sp-x" aria-label="ปิด"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
      </div>
      <div class="sp-body">
        <div class="sp-list" role="tablist" aria-label="สล็อตเด็ค">
          ${info.map(s => `
            <button type="button" class="sp-row" role="tab" data-slot="${s.idx}" aria-selected="${s.idx === sel}" style="--c:${s.c}">
              <span class="sp-num">${s.idx + 1}</span>
              <img src="${thumbOf(s.img)}" alt="" loading="lazy">
              <span class="sp-row-meta"><strong>${s.name}</strong><small class="${s.cnt < 20 ? 'sp-warn' : ''}">${s.cnt}/20 ใบ${s.cnt < 20 ? ' · ยังไม่ครบ' : ''}</small></span>
            </button>`).join('')}
        </div>
        <div class="sp-detail" role="tabpanel" aria-live="polite"></div>
      </div>
    </div>
  `;

  const detail = modal.querySelector('.sp-detail');
  const renderDetail = () => {
    const s = info[sel];
    detail.style.setProperty('--c', s.c);
    detail.innerHTML = `
      <div class="sp-art"><img src="${s.img}" alt="${s.leader}"></div>
      <div class="sp-info">
        ${inUse(s.idx) ? '<span class="sp-tag">ใช้ดวลอยู่</span>' : `<span class="sp-slot-label">สล็อต ${s.idx + 1}</span>`}
        <h3>${s.name}</h3>
        <span class="sp-leader">ลีดเดอร์ ${s.leader}</span>
        <div class="sp-count">
          <div><span>การ์ดในเด็ค</span><b class="${s.cnt < 20 ? 'sp-warn' : ''}">${s.cnt} / 20</b></div>
          <div class="sp-meter"><i style="width:${Math.min(100, s.cnt * 5)}%"></i></div>
        </div>
        <div class="sp-acts">
          <button type="button" class="sp-btn sp-btn-gold" data-act="edit"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16zM14 6l4 4"/></svg>แก้ไขเด็ค</button>
          ${inUse(s.idx) ? '' : `<button type="button" class="sp-btn sp-btn-ghost" data-act="use" ${s.ready ? '' : 'disabled title="ต้องมีการ์ดครบ 20 ใบ"'}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4l9 9M4 4h4M4 4v4M20 4l-9 9M20 4h-4M20 4v4M7 13l4 4M17 13l-4 4"/></svg>ใช้เด็คนี้ดวล</button>`}
        </div>
      </div>`;
  };
  renderDetail();

  const closePicker = () => { modal.style.display = 'none'; };
  modal.querySelector('#btn-close-slot-picker-x').onclick = closePicker;
  modal.onclick = (e) => { if (e.target === modal) closePicker(); };
  modal.onkeydown = (e) => {
    if (e.key === 'Escape') { closePicker(); return; }
    const row = e.target.closest && e.target.closest('.sp-row');
    if (!row || !['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight'].includes(e.key)) return;
    e.preventDefault();
    const step = (e.key === 'ArrowDown' || e.key === 'ArrowRight') ? 1 : -1;
    modal.querySelectorAll('.sp-row')[(sel + step + info.length) % info.length].click();
  };

  const rows = [...modal.querySelectorAll('.sp-row')];
  rows.forEach(row => {
    row.onclick = () => {
      const idx = Number(row.dataset.slot);
      if (idx === sel) return;
      sel = idx;
      rows.forEach(r => r.setAttribute('aria-selected', String(r === row)));
      row.focus();
      renderDetail();
      modal.dispatchEvent(new CustomEvent('sp:select', { detail: { index: idx } }));
    };
  });

  detail.onclick = (e) => {
    const btn = e.target.closest('[data-act]'); if (!btn || btn.disabled) return;
    if (btn.dataset.act === 'edit') { openDeckBuilderEditorForSlot(sel); return; }
    window.BOFDeckSlots.selectSlot(sel);
    if (typeof LV.selectDeck === 'function') LV.selectDeck('mine', true);
    renderDetail();
    modal.dispatchEvent(new CustomEvent('sp:use', { detail: { index: sel } }));
  };

  modal.style.display = 'flex';
}

function openDeckBuilder() {
  openDeckSlotPickerModal();
}

function renderDeckBuilder() {
  ensureDeckSlotsToolbar();
  const leaderContainer = document.getElementById('leader-pool-list');
  const mainContainer = document.getElementById('main-pool-list');
  leaderContainer.innerHTML = '';
  mainContainer.innerHTML = '';

  const saveBtn = document.getElementById('btn-save-start');
  if (saveBtn) saveBtn.textContent = `✅ บันทึกสล็อต ${deckSlotsState.activeSlot + 1}`;

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
    attachCardTooltipEvents(cardEl, leader, null);
    cardEl.addEventListener('click', () => {
      currentDeckConfig.leaderId = leader.id;
      renderDeckBuilder();
    });
    item.appendChild(cardEl);
    leaderContainer.appendChild(item);
  });

  CARD_DATABASE.filter(c => c.type !== 'Leader').forEach(card => {
    const maxAllowed = getCardMaxCopies(card);
    const countInDeck = currentDeckConfig.mainDeck.filter(id => id === card.id).length;
    const item = document.createElement('div');
    item.className = 'pool-item';
    const cardEl = createCardElement(card, null);
    if (countInDeck > 0) cardEl.style.outline = '2px solid #22c55e';

    cardEl.addEventListener('click', () => {
      const limit = cardEl.dataset.allowedMax !== undefined ? Number(cardEl.dataset.allowedMax) : maxAllowed;
      if (countInDeck < limit) {
        if (currentDeckConfig.mainDeck.length >= 20) {
          alert('การ์ดใน Main Deck ครบ 20 ใบแล้ว! กรุณาคลิกเอาใบอื่นออกก่อน');
          return;
        }
        currentDeckConfig.mainDeck.push(card.id);
      } else {
        currentDeckConfig.mainDeck = currentDeckConfig.mainDeck.filter(id => id !== card.id);
      }
      renderDeckBuilder();
    });

    const badge = document.createElement('div');
    badge.className = `count-badge ${countInDeck === maxAllowed ? 'maxed' : ''}`;
    badge.textContent = (window.isMobileUI && window.isMobileUI()) ? `${countInDeck}/${maxAllowed}` : `ใส่ในเด็ค: ${countInDeck} / ${maxAllowed} ใบ`;
    item.appendChild(cardEl);
    item.appendChild(badge);
    mainContainer.appendChild(item);
  });

  const count = currentDeckConfig.mainDeck.length;
  const statusEl = document.getElementById('deck-status-text');
  statusEl.textContent = (window.isMobileUI && window.isMobileUI()) ? `🃏 ${count}/20 ใบ` : `Leader: 1/1 | Main Deck: ${count}/20 ใบ`;
  statusEl.style.color = (count === 20) ? '#4ade80' : '#f87171';
  if (saveBtn) saveBtn.disabled = (count !== 20);
}

document.getElementById('btn-open-deck')?.addEventListener('click', openDeckBuilder);
document.getElementById('btn-reset-deck')?.addEventListener('click', () => {
  currentDeckConfig.mainDeck = [];
  renderDeckBuilder();
});

document.getElementById('btn-default-deck')?.addEventListener('click', () => {
  const chosenLeaderId = currentDeckConfig.leaderId || 'L01';
  const leaderCard = CARD_DATABASE.find(c => c.id === chosenLeaderId);
  const autoList = autoBuildDeckForLeader(chosenLeaderId);
  currentDeckConfig.leaderId = chosenLeaderId;
  currentDeckConfig.mainDeck = [...autoList];
  renderDeckBuilder();
  showDeckBuilderFeedback(`⚡ จัดเด็คอัตโนมัติตามลีดเดอร์ "${leaderCard ? leaderCard.name : chosenLeaderId}" (${autoList.length}/20 ใบ) เรียบร้อยแล้ว!`);
});

document.getElementById('btn-save-start')?.addEventListener('click', () => {
  if (currentDeckConfig.mainDeck.length !== 20) return;
  const activeIdx = deckSlotsState.activeSlot;
  const nameInput = document.getElementById('input-deck-slot-name');
  const slotName = (nameInput && nameInput.value.trim()) || currentDeckConfig.name || `เด็คจัดเอง #${activeIdx + 1}`;
  currentDeckConfig.name = slotName;
  deckSlotsState.slots[activeIdx] = {
    name: slotName,
    leaderId: currentDeckConfig.leaderId,
    mainDeck: [...currentDeckConfig.mainDeck]
  };
  persistDeckSlotsState();
  document.getElementById('deck-builder-modal').style.display = 'none';
  setLog(`✅ บันทึกเด็ค "${slotName}" (สล็อต ${activeIdx + 1}) เรียบร้อยแล้ว!`);
});

function initGame() {
  if (window.BOFSandbox && typeof window.BOFSandbox.setDummyAIEnabled === 'function') {
    window.BOFSandbox.setDummyAIEnabled(false);
  }
  gameState.turnCount = 1;
  gameState.activeTurn = 'player';
  gameState.phase = 'Mulligan';
  gameState.mulliganSelected = [];
  gameState.selectedHandIndex = null;
  gameState.selectedAttackerSlot = null;
  gameState.pendingAttack = null;
  gameState.pendingAction = null;
  gameState.isRollingDice = false;
  gameState.isWaitingForChoice = false;
  gameState.gameOver = false;
  gameState.matchLogHistory = [];
  gameState.lastPlayedCardInfo = null;
  gameState._pendingBannerCard = null;
  updateLastPlayedCardWidget(null);

  previousBoardUids = {
    player: [null, null, null],
    ai: [null, null, null]
  };

  const scrollbox = document.getElementById('action-log-scrollbox');
  if (scrollbox) scrollbox.innerHTML = '';

  const allLeaderIds = ['L01', 'L02', 'L03', 'L04', 'L05', 'L06'];
  const chosenAiLeaderId = (aiConfig.deckChoice === 'RANDOM')
    ? allLeaderIds[Math.floor(Math.random() * allLeaderIds.length)]
    : aiConfig.deckChoice;
  const chosenAiDeckList = getDefaultDeckForLeader(chosenAiLeaderId);

  gameState.player = createContestant('Player', true, 'P1', currentDeckConfig.leaderId, currentDeckConfig.mainDeck);
  gameState.ai = createContestant('AI', false, 'AI', chosenAiLeaderId, chosenAiDeckList);

  const aiHeaderTitle = document.querySelector('.ai-mat-half .side-header-bar > span:first-child');
  if (aiHeaderTitle && gameState.ai && gameState.ai.leader) {
    const diffShort = aiConfig.difficulty === 'EASY' ? '🟢ง่าย' : (aiConfig.difficulty === 'HARD' ? '🔴โหด' : '🟡ปกติ');
    aiHeaderTitle.innerHTML = `🤖 <b>${gameState.ai.leader.name}</b> <span class="ai-header-diff-pill is-${aiConfig.difficulty.toLowerCase()}">${diffShort}</span>`;
  }

  ensureZoneUIAndViewers();
  setupInGameControlBar();
  initArenaCustomBackground();
  if (window.BOFShop && typeof window.BOFShop.applyEquippedCosmetics === 'function') {
    window.BOFShop.applyEquippedCosmetics();
  }
  renderGame();

  const mulliganModal = document.getElementById('mulligan-modal');
  if (mulliganModal) mulliganModal.style.display = 'none';

  setLog(`⚔️ การประลองเริ่มต้น! AI ใช้ลีดเดอร์ [${gameState.ai.leader.name}] ระดับความยาก [${getAIDifficultyLabel(aiConfig.difficulty)}]`);

  // ทอยเหรียญตัดสินว่าใครเริ่มก่อน แล้วสับกองการ์ด
  startCoinToss({
    onComplete: (isPlayerFirst) => {
      gameState.activeTurn = isPlayerFirst ? 'player' : 'ai';
      gameState.player.isFirstPlayer = isPlayerFirst;
      gameState.ai.isFirstPlayer = !isPlayerFirst;
      setLog(`🪙 ผลการทอยเหรียญ: ${isPlayerFirst ? 'ผู้เล่นเริ่มก่อน (หัว)' : 'AI เริ่มก่อน (ก้อย)'}! กำลังสับกองการ์ด...`);
      
      playDeckShuffleAnimation(() => {
        drawCards(gameState.player, 5);
        drawCards(gameState.ai, 5);
        if (mulliganModal) mulliganModal.style.display = 'flex';
        setLog(`🃏 จั่วการ์ดเริ่มต้น 5 ใบ! เข้าสู่ช่วง Mulligan (เปลี่ยนการ์ดเริ่มต้น)`);
        renderGame();
        renderMulliganModal();
      });
    }
  });
}


/* ============================================================================
   หมวดที่ 11: ระบบล็อบบี้ และระบบดวลกับเพื่อนออนไลน์ (PeerJS PvP)
   ============================================================================ */
const pvpState = {
  isMultiplayer: false,
  role: null,
  peer: null,
  conn: null,
  roomCode: null,
  localMulliganDone: false,
  remoteMulliganDone: false,
  isApplyingRemote: false,
  waitingForDefense: false,
  pendingChoiceResolver: null
};

function sendPvpPacket(packet) {
  if (pvpState.isMultiplayer && pvpState.conn && pvpState.conn.open) {
    pvpState.conn.send(packet);
  }
}

function syncBoardToOpponent(latestLogMessage = null) {
  if (!pvpState.isMultiplayer || !pvpState.conn || !pvpState.conn.open || pvpState.isApplyingRemote) return;
  sendPvpPacket({
    type: 'SYNC_BOARD',
    turnCount: gameState.turnCount,
    activeTurnOnReceiver: gameState.activeTurn === 'player' ? 'ai' : 'player',
    phase: gameState.phase,
    gameOver: gameState.gameOver,
    senderData: gameState.player,
    receiverData: gameState.ai,
    logMessage: latestLogMessage
  });
}

const _originalRenderGame = renderGame;
renderGame = function () {
  _originalRenderGame();
  if (pvpState.isMultiplayer && !pvpState.isApplyingRemote && pvpState.localMulliganDone && pvpState.remoteMulliganDone) {
    syncBoardToOpponent();
  }
};

const _originalSetLog = setLog;
setLog = function (message) {
  _originalSetLog(message);
  if (pvpState.isMultiplayer && !pvpState.isApplyingRemote) {
    sendPvpPacket({
      type: 'LOG_ONLY',
      message: message.replace('ของคุณ', 'ของฝ่ายตรงข้าม').replace('คุณ', 'ฝ่ายตรงข้าม')
    });
  }
};

function bindMultiplayerButtons() {
  const confirmMulliganBtn = document.getElementById('btn-confirm-mulligan');
  if (confirmMulliganBtn) {
    const newMulliganBtn = confirmMulliganBtn.cloneNode(true);
    confirmMulliganBtn.parentNode.replaceChild(newMulliganBtn, confirmMulliganBtn);

    newMulliganBtn.addEventListener('click', () => {
      performMulligan(gameState.player, gameState.mulliganSelected);
      applyStartOfGameLeaderEffects(gameState.player);
      document.getElementById('mulligan-modal').style.display = 'none';

      if (!pvpState.isMultiplayer) {
        applyStartOfGameLeaderEffects(gameState.ai);
        if (gameState.activeTurn === 'ai') {
          startAIFirstTurn();
        } else {
          startPlayerTurn();
        }
        return;
      }

      pvpState.localMulliganDone = true;
      sendPvpPacket({
        type: 'MULLIGAN_READY',
        playerData: gameState.player
      });
      checkBothPlayersMulliganReady();
    });
  }
}

function checkBothPlayersMulliganReady() {
  if (!pvpState.localMulliganDone) return;
  if (!pvpState.remoteMulliganDone) {
    disableControls();
    _originalSetLog('⏳ รอเพื่อนเลือกการ์ด Mulligan...');
    _originalRenderGame();
    return;
  }
  if (pvpState.role === 'host') {
    gameState.activeTurn = 'player';
    startPlayerTurn();
    syncBoardToOpponent('🎲 พร้อมแล้ว! เจ้าของห้องเริ่มเทิร์นที่ 1');
  } else {
    gameState.activeTurn = 'ai';
    disableControls();
    _originalSetLog('🎲 พร้อมแล้ว! รอเจ้าของห้องเล่นเทิร์นที่ 1');
    _originalRenderGame();
  }
}

function handleIncomingPvpData(data) {
  if (!data || !data.type) return;

  if (data.type === 'PLAYER_SURRENDER') {
    // SYNC_BOARD ที่มี surrendered มักมาถึงก่อนและจบแมตช์ไปแล้ว: ห้ามเด้งผลซ้ำ (รางวัล/เควสต์จะนับสองรอบ)
    if (gameState.gameOver) return;
    pvpState.isApplyingRemote = true;
    gameState.gameOver = true;
    gameState.pendingAction = null;
    if (data.senderData) gameState.ai = data.senderData;
    if (data.receiverData) gameState.player = data.receiverData;
    gameState.ai.name = 'ฝ่ายตรงข้าม';
    gameState.player.name = 'Player';
    disableControls();
    _originalSetLog('🏳️ ฝ่ายตรงข้ามประกาศยอมแพ้! คุณเป็นฝ่ายชนะ!');
    _originalRenderGame();
    if (window.BOF_AUDIO && typeof window.BOF_AUDIO.playVictory === 'function') {
      try { window.BOF_AUDIO.playVictory(); } catch (e) {}
    }
    showEndMatchModal('🏆 คุณชนะ!', 'ฝ่ายตรงข้ามกดยอมแพ้ในแมตช์นี้');
    pvpState.isApplyingRemote = false;
    return;
  }

  if (data.type === 'DECLARE_ATTACK') {
    pvpState.isApplyingRemote = true;
    gameState.ai = data.senderData;
    gameState.player = data.receiverData;
    gameState.ai.name = 'ฝ่ายตรงข้าม';
    gameState.player.name = 'Player';
    _originalRenderGame();
    pvpState.isApplyingRemote = false;

    playAttackVisualAnimation(gameState.ai, gameState.player, data.attackerSlot, data.targetType, data.targetSlot, () => {
      checkDefenderAttackReactions(
        gameState.ai,
        gameState.player,
        data.attackerSlot,
        data.targetType,
        data.targetSlot,
        (specialResult) => {
          if (specialResult === 'FORCE_END_TURN') {
            executeEndPhaseCleanup(gameState.ai);
            sendPvpPacket({
              type: 'ATTACK_RESOLVED',
              forceEndTurn: true,
              nextTurnCount: gameState.turnCount + 1,
              senderData: gameState.player,
              receiverData: gameState.ai
            });
            gameState.turnCount += 1;
            gameState.activeTurn = 'player';
            startPlayerTurn();
            syncBoardToOpponent();
          } else {
            sendPvpPacket({
              type: 'ATTACK_RESOLVED',
              forceEndTurn: false,
              gameOver: gameState.gameOver,
              senderData: gameState.player,
              receiverData: gameState.ai
            });
            _originalRenderGame();
            checkGameOver();
          }
        }
      );
    });
    return;
  }

  if (data.type === 'ATTACK_RESOLVED') {
    pvpState.isApplyingRemote = true;
    pvpState.waitingForDefense = false;
    gameState.ai = data.senderData;
    gameState.player = data.receiverData;
    gameState.ai.name = 'ฝ่ายตรงข้าม';
    gameState.player.name = 'Player';

    if (data.forceEndTurn) {
      gameState.turnCount = data.nextTurnCount;
      gameState.activeTurn = 'ai';
      gameState.phase = 'Main Phase';
      disableControls();
      _originalSetLog('🔮 ฝ่ายตรงข้ามเปิดใช้สกิล "มายอา" พบโซเนบุ — เทิร์นของคุณถูกบังคับจบทันที!');
    } else {
      gameState.gameOver = data.gameOver;
    }

    _originalRenderGame();
    checkGameOver();
    pvpState.isApplyingRemote = false;
    return;
  }

  pvpState.isApplyingRemote = true;
  try {
    if (data.type === 'START_PVP_MATCH') startPvpMatchBoard(pvpState.role);
    else if (data.type === 'MULLIGAN_READY') {
      pvpState.remoteMulliganDone = true;
      gameState.ai = data.playerData;
      gameState.ai.name = 'ฝ่ายตรงข้าม';
      _originalRenderGame();
      checkBothPlayersMulliganReady();
    } else if (data.type === 'SYNC_BOARD') {
      const wasGameOver = gameState.gameOver;
      gameState.turnCount = data.turnCount;
      gameState.activeTurn = data.activeTurnOnReceiver;
      gameState.phase = data.phase;
      gameState.ai = data.senderData;
      gameState.player = data.receiverData;
      gameState.ai.name = 'ฝ่ายตรงข้าม';
      gameState.player.name = 'Player';
      if (data.logMessage) _originalSetLog(data.logMessage);
      _originalRenderGame();
      if (!wasGameOver && gameState.ai.surrendered) {
        // อีกฝั่งกดยอมแพ้ -> แจ้งเตือนและจบแมตช์ฝั่งนี้ทันที
        gameState.gameOver = true;
        gameState.pendingAction = null;
        disableControls();
        _originalSetLog('🏳️ ฝ่ายตรงข้ามประกาศยอมแพ้! คุณเป็นฝ่ายชนะ!');
        if (window.BOF_AUDIO && typeof window.BOF_AUDIO.playVictory === 'function') window.BOF_AUDIO.playVictory();
        setTimeout(() => showEndMatchModal('🏆 คุณชนะ! (ฝ่ายตรงข้ามยอมแพ้)', 'ฝ่ายตรงข้ามกดยอมแพ้ในแมตช์นี้'), 300);
      } else if (!wasGameOver) {
        // ห้ามตั้ง gameOver ก่อน checkGameOver ไม่งั้นจะ return ทันทีและไม่เด้งหน้าต่างผลแมตช์
        if (!checkGameOver() && data.gameOver) {
          gameState.gameOver = true;
          disableControls();
        }
      }
    } else if (data.type === 'PASS_TURN') {
      pvpState.waitingForDefense = false;
      gameState.turnCount = data.nextTurnCount;
      gameState.ai = data.senderData;
      gameState.player = data.receiverData;
      gameState.ai.name = 'ฝ่ายตรงข้าม';
      gameState.player.name = 'Player';
      gameState.activeTurn = 'player';
      _originalSetLog('🟢 ตาของคุณ!');
      startPlayerTurn();
      syncBoardToOpponent();
    } else if (data.type === 'LOG_ONLY') {
      _originalSetLog(`🌐 [เพื่อน] ${data.message}`);
    } else if (data.type === 'REQUEST_PVP_CHOICE') {
      const opts = (data.options || []).map((o, idx) => ({
        label: o.label,
        color: o.color || '#3b82f6',
        onSelect: () => {
          sendPvpPacket({
            type: 'SUBMIT_PVP_CHOICE',
            choiceId: data.choiceId,
            optionIndex: idx
          });
        }
      }));
      showChoiceModal(data.title || '❓ ฝ่ายตรงข้ามขอการตัดสินใจ', data.description || 'กรุณาเลือก 1 อย่าง:', opts);
    } else if (data.type === 'SUBMIT_PVP_CHOICE') {
      if (typeof pvpState.pendingChoiceResolver === 'function') {
        const resolver = pvpState.pendingChoiceResolver;
        pvpState.pendingChoiceResolver = null;
        resolver(data.optionIndex);
      }
    }
  } finally {
    pvpState.isApplyingRemote = false;
  }
}

function startPvpMatchBoard(role) {
  document.getElementById('lobby-screen').style.display = 'none';
  document.getElementById('pvp-room-modal').style.display = 'none';
  document.querySelector('.game-container').style.display = 'flex';

  pvpState.isMultiplayer = true;
  pvpState.role = role;
  pvpState.localMulliganDone = false;
  pvpState.remoteMulliganDone = false;
  pvpState.waitingForDefense = false;

  previousBoardUids = {
    player: [null, null, null],
    ai: [null, null, null]
  };

  gameState.turnCount = 1;
  gameState.activeTurn = (role === 'host') ? 'player' : 'ai';
  gameState.phase = 'Mulligan';
  gameState.gameOver = false;

  const scrollbox = document.getElementById('action-log-scrollbox');
  if (scrollbox) scrollbox.innerHTML = '';

  const isFirst = (role === 'host');
  gameState.player = createContestant('Player', isFirst, isFirst ? 'P1' : 'P2', currentDeckConfig.leaderId, currentDeckConfig.mainDeck);
  gameState.ai = createContestant('ฝ่ายตรงข้าม', !isFirst, isFirst ? 'P2' : 'P1', 'L01', DEFAULT_DECK_LIST);

  ensureZoneUIAndViewers();
  initArenaCustomBackground();
  _originalRenderGame();

  const mulliganModal = document.getElementById('mulligan-modal');
  if (mulliganModal) mulliganModal.style.display = 'none';

  startCoinToss({
    forcedResult: isFirst,
    onComplete: () => {
      playDeckShuffleAnimation(() => {
        drawCards(gameState.player, 5);
        if (mulliganModal) mulliganModal.style.display = 'flex';
        _originalSetLog(`🎉 เริ่มการดวลออนไลน์! (${isFirst ? 'คุณได้เริ่มก่อน' : 'เพื่อนได้เริ่มก่อน'}) เข้าสู่ช่วง Mulligan`);
        _originalRenderGame();
        renderMulliganModal();
      });
    }
  });
}

function createPvpRoomAsHost() {
  if (typeof Peer === 'undefined') { alert('ไม่พบ PeerJS'); return; }
  const randomCode = Math.floor(1000 + Math.random() * 9000).toString();
  if (pvpState.peer) pvpState.peer.destroy();
  pvpState.peer = new Peer(`my-tcg-room-${randomCode}`);
  pvpState.roomCode = randomCode;

  document.getElementById('my-room-code').textContent = 'กำลังสร้าง...';
  document.getElementById('room-code-display').style.display = 'block';

  pvpState.peer.on('open', () => { document.getElementById('my-room-code').textContent = randomCode; });
  pvpState.peer.on('connection', (conn) => {
    pvpState.conn = conn;
    conn.on('open', () => { conn.send({ type: 'START_PVP_MATCH' }); startPvpMatchBoard('host'); });
    conn.on('data', handleIncomingPvpData);
    conn.on('close', () => {
      if (pvpState.isMultiplayer && !gameState.gameOver) {
        gameState.gameOver = true;
        disableControls();
        _originalSetLog('🔌 ฝ่ายตรงข้ามออกจากการเชื่อมต่อ!');
        showEndMatchModal('🏆 คุณชนะ!', 'ฝ่ายตรงข้ามตัดการเชื่อมต่อไป');
      }
    });
  });
}

function joinPvpRoomAsGuest(codeInput) {
  const code = codeInput.trim();
  if (!code) { alert('กรุณากรอกรหัสห้อง'); return; }
  pvpState.role = 'guest';
  if (pvpState.peer) pvpState.peer.destroy();
  pvpState.peer = new Peer();
  pvpState.peer.on('open', () => {
    pvpState.conn = pvpState.peer.connect(`my-tcg-room-${code}`);
    pvpState.conn.on('data', handleIncomingPvpData);
    pvpState.conn.on('close', () => {
      if (pvpState.isMultiplayer && !gameState.gameOver) {
        gameState.gameOver = true;
        disableControls();
        _originalSetLog('🔌 ฝ่ายตรงข้ามออกจากการเชื่อมต่อ!');
        showEndMatchModal('🏆 คุณชนะ!', 'ฝ่ายตรงข้ามตัดการเชื่อมต่อไป');
      }
    });
  });
  pvpState.peer.on('error', () => { alert('ไม่พบห้องนี้'); });
}

function setupLobbyEvents() {
  ensureVisualEffectsStyles();
  bindMultiplayerButtons();
  setupInGameControlBar();

  const lobbyScreen = document.getElementById('lobby-screen');
  const gameBoard = document.querySelector('.game-container');
  const mull = document.getElementById('mulligan-modal');
  if (!lobbyScreen || !gameBoard) return;

  gameBoard.style.display = 'none';
  if (mull) mull.style.display = 'none';

  document.getElementById('btn-lobby-bot')?.addEventListener('click', () => {
    openAISetupModal();
  });

  document.getElementById('btn-lobby-pvp')?.addEventListener('click', () => {
    document.getElementById('pvp-room-modal').style.display = 'flex';
  });
  document.getElementById('btn-close-pvp-modal')?.addEventListener('click', () => {
    document.getElementById('pvp-room-modal').style.display = 'none';
  });
  document.getElementById('btn-create-room')?.addEventListener('click', createPvpRoomAsHost);
  document.getElementById('btn-join-room')?.addEventListener('click', () => {
    joinPvpRoomAsGuest(document.getElementById('input-join-code').value);
  });

  const openDeckFn = (e) => { if (e) e.preventDefault(); openDeckBuilder(); };
  const openCardsFn = (e) => {
    if (e) e.preventDefault();
    if (window.BOFCollection) { window.BOFCollection.open(); return; } // คลังการ์ดแบบแฟ้มสะสม (js/collection.js)
    openZoneViewerModal('🔍 คลังการ์ดทั้งหมด (คลิกขวาที่การ์ดเพื่อดูรายละเอียด)', CARD_DATABASE, null);
  };

  document.getElementById('nav-deck')?.addEventListener('click', openDeckFn);
  document.getElementById('nav-cards')?.addEventListener('click', openCardsFn);
}

setupLobbyEvents();

/* ============================================================================
   COMBAT LOG DRAWER & SOUND CONTROLS BINDING
   ============================================================================ */
let activeCombatLogFilter = 'ALL';
let selectedLogSpotlight = null;

function ensureCombatLogSpotlightContainer() {
  const modalBox = document.querySelector('#combat-log-modal .combat-log-box');
  const filterRow = document.querySelector('#combat-log-modal .combat-log-filters');
  if (!modalBox || !filterRow) return null;
  let spot = document.getElementById('combat-log-spotlight');
  if (!spot) {
    spot = document.createElement('div');
    spot.id = 'combat-log-spotlight';
    spot.className = 'combat-log-spotlight';
    modalBox.insertBefore(spot, filterRow);
  }
  return spot;
}

function renderCombatLogSpotlight(spotEl) {
  if (!spotEl) return;
  const info = selectedLogSpotlight || gameState.lastPlayedCardInfo;
  if (!info || !info.card) {
    spotEl.innerHTML = `
      <div class="combat-spot-empty">
        <span>🃏 ยังไม่มีการ์ดที่เพิ่งทำงานในแมตช์นี้ — เมื่อมีการร่ายเวท ใช้สกิล หรืออัญเชิญการ์ด ข้อมูลสกิลจะไฮไลต์ตรงนี้ทันที!</span>
      </div>
    `;
    return;
  }

  const c = info.card;
  const desc = c.desc || (typeof getCardDescription === 'function' ? getCardDescription(c) : 'ไม่มีความสามารถ');
  const sideText = info.isAI ? '🤖 ฝ่ายตรงข้ามใช้' : '👤 ฝั่งเราใช้';
  const sideCls = info.isAI ? 'is-ai' : 'is-player';
  const statText = c.type === 'Monster'
    ? `⚔️ Power ${c.power}${c.tribe ? ` · เผ่า${c.tribe}` : ''}`
    : (c.type === 'Leader' ? `👑 Leader · HP ${c.maxHp}` : `✨ ${c.type}`);

  spotEl.innerHTML = `
    <div class="combat-spot-card ${sideCls}">
      <div class="combat-spot-art-wrap" id="combat-spot-art-trigger" title="คลิกเพื่อดูการ์ดใบใหญ่ 3D">
        <img src="${c.image || ''}" alt="${c.name}">
        <span class="combat-spot-zoom-hint">🔍 ซูม</span>
      </div>
      <div class="combat-spot-body">
        <div class="combat-spot-head">
          <span class="combat-spot-badge ${sideCls}">${sideText} · เทิร์น ${info.turn || 1}</span>
          <span class="combat-spot-stat">${statText}</span>
        </div>
        <div class="combat-spot-title-row">
          <strong class="combat-spot-name">${c.name}</strong>
          <span class="combat-spot-rarity rarity-${c.rarity || 'N'}">${c.rarity || 'N'}</span>
        </div>
        <div class="combat-spot-action-summary">⚡ ${info.actionSubText || info.message || ''}</div>
        <div class="combat-spot-skill-highlight">
          <div class="combat-spot-skill-label">📜 ไฮไลต์ความสามารถของการ์ดใบนี้:</div>
          <div class="combat-spot-skill-text">${desc}</div>
        </div>
      </div>
    </div>
  `;

  const artTrigger = spotEl.querySelector('#combat-spot-art-trigger');
  if (artTrigger && typeof window.openCardDetailModal === 'function') {
    artTrigger.onclick = () => {
      window.openCardDetailModal(c, null, artTrigger);
    };
  }
}

function renderCombatLogModal() {
  const listEl = document.getElementById('combat-log-list');
  if (!listEl) return;
  listEl.innerHTML = '';

  const spotEl = ensureCombatLogSpotlightContainer();
  renderCombatLogSpotlight(spotEl);

  const history = Array.isArray(gameState.matchLogHistory) ? gameState.matchLogHistory : [];
  const filtered = activeCombatLogFilter === 'ALL'
    ? history
    : history.filter(item => item.category === activeCombatLogFilter);

  if (filtered.length === 0) {
    listEl.innerHTML = '<div style="color:#64748b;text-align:center;padding:30px;font-size:14px;">ยังไม่มีประวัติในหมวดหมู่นี้</div>';
    return;
  }

  // แสดงรายการล่าสุดไว้ด้านบนสุดเพื่อให้อ่านย้อนหลังบนมือถือได้ง่ายทันที หรือเรียงตามลำดับพร้อมเลื่อนลงล่างสุด
  filtered.forEach(item => {
    const cardObj = item.cardId && typeof CARD_DATABASE !== 'undefined'
      ? CARD_DATABASE.find(c => c.id === item.cardId)
      : null;

    const row = document.createElement('div');
    row.className = `combat-log-row ${item.isAI ? 'is-ai' : 'is-player'} ${cardObj ? 'has-card' : ''}`;

    if (cardObj) {
      const thumb = document.createElement('img');
      thumb.className = 'combat-log-thumb';
      thumb.src = cardObj.image || '';
      thumb.alt = cardObj.name;
      row.appendChild(thumb);
    }

    const contentWrap = document.createElement('div');
    contentWrap.className = 'combat-log-row-main';

    const topMeta = document.createElement('div');
    topMeta.className = 'combat-log-row-badges';

    // 1. ชิปบอกเลขเทิร์น
    const turnBadge = document.createElement('span');
    turnBadge.className = 'combat-chip is-turn';
    turnBadge.textContent = `เทิร์น ${item.turn}`;

    // 2. ชิปบอกฝั่ง (เรา vs คู่แข่ง)
    const sideBadge = document.createElement('span');
    sideBadge.className = `combat-chip ${item.isAI ? 'is-side-ai' : 'is-side-player'}`;
    sideBadge.textContent = item.isAI ? '🤖 คู่แข่ง' : '👤 ฝั่งเรา';

    // 3. ชิปประเภทการกระทำ (โจมตี / เวท / อัญเชิญ / ระบบ)
    const catBadge = document.createElement('span');
    catBadge.className = `combat-chip is-cat-${(item.category || 'OTHER').toLowerCase()}`;
    if (item.category === 'ATTACK') {
      catBadge.textContent = '⚔️ โจมตี';
    } else if (item.category === 'SPELL') {
      catBadge.textContent = '✨ เวท/สกิล';
    } else if (item.category === 'SUMMON') {
      catBadge.textContent = '🃏 อัญเชิญ';
    } else {
      catBadge.textContent = '📢 ระบบ';
    }

    const timeSpan = document.createElement('span');
    timeSpan.className = 'combat-log-time';
    timeSpan.textContent = item.time;

    topMeta.append(turnBadge, sideBadge, catBadge);
    if (cardObj) {
      const inspectHint = document.createElement('span');
      inspectHint.className = 'combat-chip is-inspect-hint';
      inspectHint.textContent = `🔍 แตะดูสกิล "${cardObj.name}"`;
      topMeta.appendChild(inspectHint);
    }
    topMeta.appendChild(timeSpan);

    const textSpan = document.createElement('div');
    textSpan.className = 'combat-log-msg';
    textSpan.textContent = item.message;

    contentWrap.append(topMeta, textSpan);
    row.appendChild(contentWrap);

    if (cardObj) {
      row.onclick = () => {
        selectedLogSpotlight = {
          card: cardObj,
          actorName: item.actorTitle,
          actionSubText: item.actionSubText || item.message,
          message: item.message,
          turn: item.turn,
          isAI: item.isAI,
          category: item.category,
          time: item.time
        };
        renderCombatLogSpotlight(spotEl);
      };
    }

    listEl.appendChild(row);
  });

  listEl.scrollTop = listEl.scrollHeight;
}

function initCombatLogAndAudioControls() {
  const btnOpenLog = document.getElementById('btn-open-combat-log');
  const btnCloseLog = document.getElementById('btn-close-combat-log');
  const logModal = document.getElementById('combat-log-modal');
  if (btnOpenLog && logModal) {
    btnOpenLog.onclick = () => {
      renderCombatLogModal();
      logModal.style.display = 'flex';
    };
  }
  if (btnCloseLog && logModal) {
    btnCloseLog.onclick = () => {
      logModal.style.display = 'none';
    };
  }

  // Filter buttons
  document.querySelectorAll('.combat-filter-btn').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('.combat-filter-btn').forEach(b => {
        b.classList.remove('is-active');
        b.style.background = '#334155';
      });
      btn.classList.add('is-active');
      btn.style.background = '#3b82f6';
      activeCombatLogFilter = btn.dataset.filter || 'ALL';
      renderCombatLogModal();
    };
  });

  // Sound toggle button in game board
  const btnSound = document.getElementById('btn-toggle-sound');
  if (btnSound && window.BOF_AUDIO) {
    const syncBoardSoundBtn = () => {
      const on = window.BOF_AUDIO.isSoundEnabled();
      btnSound.textContent = on ? '🔊' : '🔇';
      btnSound.title = on ? 'เสียง: เปิด (คลิกเพื่อปิด)' : 'เสียง: ปิด (คลิกเพื่อเปิด)';
      btnSound.style.background = on ? '#334155' : '#7f1d1d';
    };
    btnSound.onclick = () => {
      window.BOF_AUDIO.toggleSound();
      syncBoardSoundBtn();
    };
    syncBoardSoundBtn();
  }

  // Sound settings in Lobby settings dialog
  const soundSwitch = document.getElementById('lb-setting-sound');
  const volumeSlider = document.getElementById('lb-setting-volume');
  const volumeOut = document.getElementById('lb-setting-volume-val');
  // ปิดเสียงแล้ว แถบระดับเสียงใช้ไม่ได้ (จางลง) — เปิดกลับก็ใช้ได้ทันที
  const syncVolumeRow = () => {
    if (!volumeSlider || !soundSwitch) return;
    volumeSlider.disabled = !soundSwitch.checked;
    volumeSlider.closest('.st-vol')?.classList.toggle('is-off', !soundSwitch.checked);
    if (volumeOut) volumeOut.textContent = Math.round(Number(volumeSlider.value) * 100) + '%';
  };
  if (soundSwitch && window.BOF_AUDIO) {
    soundSwitch.checked = window.BOF_AUDIO.isSoundEnabled();
    soundSwitch.onchange = () => {
      window.BOF_AUDIO.setSoundEnabled(soundSwitch.checked);
      syncVolumeRow();
      if (btnSound) {
        btnSound.textContent = soundSwitch.checked ? '🔊' : '🔇';
        btnSound.style.background = soundSwitch.checked ? '#334155' : '#7f1d1d';
      }
    };
  }
  if (volumeSlider && window.BOF_AUDIO) {
    volumeSlider.value = localStorage.getItem('bof_sound_volume') || '0.7';
    volumeSlider.oninput = () => {
      window.BOF_AUDIO.setVolume(volumeSlider.value);
      syncVolumeRow();
    };
  }
  syncVolumeRow();
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCombatLogAndAudioControls);
  } else {
    initCombatLogAndAudioControls();
  }
}


function updateCardDetailPanel(card) {
  if (!card) return;
  const desc = card.desc || (typeof getCardDescription === 'function' ? getCardDescription(card) : '');
  const html = `
    <div style="display:flex;gap:6px;align-items:flex-start;">
      <img src="${card.image || ''}" style="width:38px;aspect-ratio:750/1050;border-radius:4px;border:1px solid #64748b;object-fit:cover;" alt="">
      <div style="flex:1;min-width:0;">
        <div style="font-size:11.5px;font-weight:bold;color:#fde047;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${card.name}</div>
        <div style="font-size:10px;color:#94a3b8;">${card.tribe ? `[${card.tribe}]` : ''} ${card.power !== undefined ? `⚔️ ${card.power}` : (card.type || '')}</div>
      </div>
    </div>
    <div style="font-size:10px;color:#e2e8f0;margin-top:4px;line-height:1.35;max-height:92px;overflow-y:auto;white-space:pre-line;">${desc || 'ไม่มีความสามารถ'}</div>
  `;
  const pBox = document.getElementById('player-detail-content');
  if (pBox) pBox.innerHTML = html;
  const aBox = document.getElementById('ai-detail-content');
  if (aBox) aBox.innerHTML = html;
}

function initArenaCustomBackground() {
  const arenaEl = document.getElementById('bof-game-arena') || document.querySelector('.game-container');
  const lobbyInput = document.getElementById('lobby-arena-bg-input');
  const lobbyResetBtn = document.getElementById('btn-lobby-reset-arena-bg');
  const statusEl = document.getElementById('lobby-arena-bg-status');
  const previewEl = document.getElementById('lobby-arena-bg-preview');

  const updateStatus = () => {
    const savedBg = localStorage.getItem('bof_arena_bg');
    if (statusEl) {
      statusEl.style.display = savedBg ? 'block' : 'none';
    }
    if (previewEl) {
      previewEl.style.backgroundImage = savedBg ? 'url("' + savedBg + '")' : '';
      previewEl.classList.toggle('has-img', !!savedBg);
    }
    if (savedBg && arenaEl) {
      arenaEl.style.backgroundImage = `url("${savedBg}")`;
      arenaEl.style.backgroundSize = 'cover';
      arenaEl.style.backgroundPosition = 'center';
    } else if (arenaEl) {
      arenaEl.style.backgroundImage = '';
    }
  };

  updateStatus();

  if (lobbyInput && !lobbyInput._bofBound) {
    lobbyInput._bofBound = true;
    lobbyInput.addEventListener('change', e => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = evt => {
        const dataUrl = evt.target.result;
        try {
          localStorage.setItem('bof_arena_bg', dataUrl);
          updateStatus();
          alert('🖼️ บันทึกภาพพื้นหลังสนามประลองใหม่เรียบร้อยแล้ว!');
        } catch (err) {
          alert('ขนาดไฟล์ภาพใหญ่เกินไป กรุณาเลือกไฟล์ภาพที่มีขนาดเล็กลง');
        }
      };
      reader.readAsDataURL(file);
    });
  }

  if (lobbyResetBtn && !lobbyResetBtn._bofBound) {
    lobbyResetBtn._bofBound = true;
    lobbyResetBtn.addEventListener('click', () => {
      localStorage.removeItem('bof_arena_bg');
      updateStatus();
      alert('🔄 รีเซ็ตภาพพื้นหลังสนามกลับเป็นค่าเริ่มต้นเรียบร้อยแล้ว');
    });
  }
}

document.addEventListener('DOMContentLoaded', () => initArenaCustomBackground());

/* ============================================================================
   หมวดที่ 12: ห้องทดลองสกิลการ์ด (CARD SKILL SANDBOX) & ระบบสแกนตรวจบั๊ก 72 ใบอัตโนมัติ
   ============================================================================ */
(function initBOFSandboxSystem() {
  const ADMIN_SESSION_KEY = 'bof_admin_unlocked_v1';
  const ADMIN_PASSCODES = ['bofadmin', '9999'];

  let dummyAIEnabled = false;
  let selectedDeckFilter = 'ALL';
  let selectedCardId = 'L01';
  let searchKeyword = '';

  function isAdminUnlocked() {
    try {
      return sessionStorage.getItem(ADMIN_SESSION_KEY) === '1' || localStorage.getItem(ADMIN_SESSION_KEY) === '1';
    } catch (e) {
      return false;
    }
  }

  function setAdminUnlocked(unlocked) {
    try {
      if (unlocked) {
        sessionStorage.setItem(ADMIN_SESSION_KEY, '1');
        localStorage.setItem(ADMIN_SESSION_KEY, '1');
      } else {
        sessionStorage.removeItem(ADMIN_SESSION_KEY);
        localStorage.removeItem(ADMIN_SESSION_KEY);
        dummyAIEnabled = false;
        closeSandboxModal();
      }
    } catch (e) {}
    syncAdminSandboxVisibility();
  }

  function syncAdminSandboxVisibility() {
    const unlocked = isAdminUnlocked();
    const lobbySection = document.getElementById('lobby-admin-sandbox-section');
    const authBox = document.getElementById('lobby-admin-auth-box');
    const showAuthBtn = document.getElementById('btn-show-admin-passcode');
    const sbBtn = document.getElementById('btn-open-sandbox');
    const isPvp = (typeof pvpState !== 'undefined' && pvpState.isMultiplayer);

    if (lobbySection) {
      lobbySection.style.display = unlocked ? 'block' : 'none';
    }
    if (authBox && unlocked) {
      authBox.style.display = 'none';
    }
    if (showAuthBtn) {
      showAuthBtn.style.display = unlocked ? 'none' : 'inline-block';
    }
    if (sbBtn) {
      sbBtn.style.display = (unlocked && !isPvp) ? '' : 'none';
    }
  }

  function getCardDeckCategory(card) {
    if (!card) return 'OTHER';
    if (card.type === 'Leader') return 'LEADER';
    const id = card.id || '';
    if (/^(M0|S0)/.test(id)) return 'JIT';
    if (/^(NM|NS)/.test(id)) return 'NUEA';
    if (/^(DM\d|DS)/.test(id)) return 'DOOM';
    if (/^(DN\d|DNS)/.test(id)) return 'DINO';
    if (/^(DMM|DMS)/.test(id)) return 'DEMON';
    if (/^(OM|OS)/.test(id)) return 'OAT';
    return 'OTHER';
  }

  let sandboxCardSeq = 0;
  function makeSandboxCard(cardId) {
    const tpl = CARD_DATABASE.find(c => c.id === cardId);
    if (!tpl) return null;
    const inst = createCardInstance(tpl, `SBX-${cardId}-${++sandboxCardSeq}`);
    resetCardStateForZoneChange(inst);
    return inst;
  }

  function ensureSandboxMatchReady() {
    if (typeof pvpState !== 'undefined' && pvpState.isMultiplayer) {
      alert('ไม่สามารถใช้ห้องทดลองสกิลในโหมดดวลออนไลน์กับเพื่อนได้');
      return false;
    }

    const lobbyScreen = document.getElementById('lobby-screen');
    const gameBoard = document.querySelector('.game-container');
    const mullModal = document.getElementById('mulligan-modal');
    const coinModal = document.getElementById('coin-toss-overlay');
    const settingsDialog = document.getElementById('lb-settings-dialog');

    if (settingsDialog && typeof settingsDialog.close === 'function' && settingsDialog.open) {
      settingsDialog.close();
    }
    if (lobbyScreen && lobbyScreen.style.display !== 'none') {
      lobbyScreen.style.display = 'none';
    }
    if (gameBoard && gameBoard.style.display === 'none') {
      gameBoard.style.display = 'flex';
    }
    if (mullModal) mullModal.style.display = 'none';
    if (coinModal) coinModal.style.display = 'none';

    if (!gameState.player || !gameState.ai || gameState.gameOver || gameState.phase === 'Mulligan') {
      gameState.turnCount = 2;
      gameState.activeTurn = 'player';
      gameState.phase = 'Main Phase';
      gameState.mulliganSelected = [];
      gameState.selectedHandIndex = null;
      gameState.selectedAttackerSlot = null;
      gameState.pendingAttack = null;
      gameState.pendingAction = null;
      gameState.isRollingDice = false;
      gameState.isWaitingForChoice = false;
      gameState.gameOver = false;

      gameState.player = createContestant('Player', true, 'P1', currentDeckConfig.leaderId || 'L01', currentDeckConfig.mainDeck || DEFAULT_DECK_LIST);
      gameState.ai = createContestant('AI (หุ่นซ้อม)', false, 'AI', 'L01', DEFAULT_DECK_LIST);
      gameState.player.turnsTaken = 2;
      gameState.ai.turnsTaken = 2;
      drawCards(gameState.player, 5);
      drawCards(gameState.ai, 5);
      ensureZoneUIAndViewers();
      setupInGameControlBar();
      initArenaCustomBackground();
    }

    gameState.gameOver = false;
    gameState.isRollingDice = false;
    gameState.isWaitingForChoice = false;
    gameState.pendingAction = null;
    gameState.pendingAttack = null;
    gameState.selectedHandIndex = null;
    gameState.selectedAttackerSlot = null;
    gameState.activeTurn = 'player';
    if (gameState.phase !== 'Main Phase' && gameState.phase !== 'Battle Phase') {
      gameState.phase = 'Main Phase';
    }
    if (gameState.player.turnsTaken < 2) gameState.player.turnsTaken = 2;
    return true;
  }

  function resetQuotasAndSkills() {
    if (!ensureSandboxMatchReady()) return;
    const p = gameState.player;
    const a = gameState.ai;
    [p, a].forEach(side => {
      if (!side) return;
      side.attacksThisTurn = 0;
      side.futureUsedThisTurn = false;
      if (side.leader) side.leader.abilityUsedThisTurn = false;
      if (side.spellQuota) {
        side.spellQuota.normalUsed = 0;
        side.spellQuota.reactionUsed = 0;
      }
      side.board.forEach(m => {
        if (m) {
          m.state = 'Stand';
          m.usedSkills = {};
          m.oatShieldUsedThisTurn = false;
          m.beelzebubBuffThisTurn = false;
        }
      });
    });
    gameState.activeTurn = 'player';
    gameState.phase = 'Main Phase';
    gameState.pendingAction = null;
    setLog('🧪 [ห้องทดลอง] รีเซ็ตสกิล 1/เทิร์น, โควต้าเวทมนตร์ และจับยูนิตทุกใบลุกขึ้น Stand เรียบร้อย!');
    renderGame();
  }

  function forceAIAttackPlayer(targetType = 'leader', targetSlot = null) {
    if (!ensureSandboxMatchReady()) return;
    const ai = gameState.ai;
    const player = gameState.player;
    let attackerSlot = ai.board.findIndex(m => m !== null && m.id !== 'NM05');
    if (attackerSlot === -1) {
      attackerSlot = 0;
      ai.board[0] = makeSandboxCard('M01');
    }
    ai.board[attackerSlot].state = 'Stand';
    ai.turnsTaken = Math.max(2, ai.turnsTaken || 2);
    player.spellQuota.reactionUsed = 0;

    closeSandboxModal();
    setLog(`🧪 [ห้องทดลอง] สั่งให้ "${ai.board[attackerSlot].name}" ของ AI โจมตี${targetType === 'leader' ? 'ลีดเดอร์ของคุณ' : 'ยูนิตช่องที่ ' + (targetSlot + 1)} ทันที เพื่อทดสอบการป้องกัน/เวทรีแอค!`);
    renderGame();
    setTimeout(() => {
      executeAttack(ai, player, attackerSlot, targetType, targetSlot, () => {
        gameState.activeTurn = 'player';
        gameState.phase = 'Main Phase';
        renderGame();
      });
    }, 250);
  }

  function getScenarioGuideForCard(cardId) {
    const card = CARD_DATABASE.find(c => c.id === cardId);
    if (!card) return 'เลือกการ์ดที่ต้องการทดสอบ';

    const guides = {
      L01: 'ตั้งลีดเดอร์เราเป็น "มายฮีโร่ เดจิต", วางยูนิตบนสนามเรา + เติมการ์ดบนมือ 2 ใบ -> คลิกที่การ์ด Leader ของเราเพื่อกดใช้สกิลทิ้งมือ 1 ใบบัฟพลัง +1!',
      L02: 'ตั้งลีดเดอร์เราเป็น "ขุนเหนือ", ใส่ "ไพร่ชาวนาเหนือ" ในกองและนรก -> รันสกิลเข้าเทิร์นให้เลือกดึงขึ้นมือทันที และใส่ยูนิตบนมือพร้อมเทสต์สกิลต่อเนื่อง!',
      L03: 'ตั้งลีดเดอร์เราเป็น "วันสิ้นโลก", ใส่ยูนิตพลัง ≤ 2 ในนรก -> เปิดหน้าต่างเลือกคอลยูนิตจากนรกลงสนามเมื่อเริ่มเทิร์นทันที!',
      L04: 'ตั้งลีดเดอร์เราเป็น "ศูนย์วิจัยไดโน", เติมการ์ดบนมือและกองการ์ด -> คลิกที่การ์ด Leader ของเราเพื่อทิ้งมือ 1 ใบ โม่กอง 1 ใบ และจั่ว 1 ใบ!',
      L05: 'ตั้งลีดเดอร์เราเป็น "ปีศาจ", รันออโต้เริ่มเกมนำ "ดินแดนปีศาจ" ไปมิติมืด + จั่ว 2 ใบ และใส่ยูนิตบนสนามอีกฝ่าย -> คลิกที่ Leader เราเพื่อทดสอบสกิลลดพลัง!',
      L06: 'ตั้งลีดเดอร์เราเป็น "ไอโอ๊ตบ้าทุกสิ่ง", เรียงเวทมนตร์ + ไอโอ๊ตบ้าการ์ตูนไว้ 2 ใบบนสุดของกอง -> เปิดหน้าต่างสกิลเข้าเทิร์นให้เลือกหยิบเวทและเรียงกองทันที!',
      M03: 'ตั้ง HP ลีดเดอร์เรา = 2, ใส่ "ออลจิต" บนมือเรา และสั่ง AI โจมตีลีดเดอร์เราทันที -> หน้าต่างถามส่งออลจิตจากมือลงมารับดาเมจแทนจะเด้งขึ้นมาทันที!',
      M04: 'ตั้ง HP ลีดเดอร์เรา = 1, ใส่ "ออลฟอจิต" บนมือเรา, ใส่ บาคุจิต/โทโดจิต/ออลจิต ในนรกครบ และสั่ง AI โจมตีลีดเดอร์เราทันที -> กดอัญเชิญออลฟอจิตลงมารับดาเมจและทำลายทั้งสนามได้เลย!',
      M05: 'ใส่ "เอ็นเดจิต" บนสนามเรา (Stand) -> คลิกที่เอ็นเดจิตบนสนามเพื่อกดใช้สกิลแลกเลือดลีดเดอร์ 1 HP บัฟพลัง +1 และทริกเกอร์เผาลีดเดอร์เมื่อตีมอนสเตอร์ตาย!',
      M06: 'ใส่ "ฮออ์กส์ฟีม" บนสนามเรา และใส่ "เอ็นเดจิต" ไว้ทั้งในกองและนรก -> คลิกที่ฮออ์กส์ฟีมบนสนามเพื่อกดใช้สกิลลดพลัง -2 ค้นหาเอ็นเดจิตขึ้นมือ!',
      NM01: 'ใส่ "ไพร่ชาวนาเหนือ" บนมือเรา, ใส่ "สายลับไพร่เหนือ" และทหารในกอง/นรก -> คลิกที่ไพร่ชาวนาเหนือบนมือเพื่อเลือกทั้ง 3 โหมด (ลงปกติ / ส่งสายลับยึดช่อง AI / ค้นหาทหาร)!',
      NM02: 'ใส่ "ทหารหลวงเหนือ" + "ไพร่ชาวนาเหนือ" บนมือเรา, วาง "ทหารเกณฑ์เหนือ" บนสนามเรา และใส่ทหารในกอง/นรก -> คลิกทหารหลวงเหนือบนมือเพื่อทดสอบ "อัญเชิญจุติ" และคอลทหารเพิ่มฟรี!',
      NM03: 'ใส่ "ทหารม้าเหนือ" + "ไพร่ชาวนาเหนือ" บนมือเรา และวางยูนิตบนสนาม AI -> คลิกทหารม้าเหนือบนมือเพื่อทดสอบ "อัญเชิญจุติ"!',
      NM05: 'ใส่ "สายลับไพร่เหนือ" บนมือเรา และเปิดช่องว่างบนสนาม AI -> คลิกสายลับไพร่เหนือบนมือแล้วคลิกช่องว่างฝั่ง AI เพื่อส่งไปยึดช่อง!',
      NS01: 'ใส่ "กองทัพหลวงเหนือ" บนมือเรา, วางทหาร 3 ใบบนสนามเรา และวางยูนิต 3 ใบบนสนาม AI -> คลิกร่ายเวทเพื่อทดสอบเงื่อนไขทหาร 1+ / 2+ / 3+ ใบครบทุกขั้น!',
      DM03: 'วาง "มายอา" (Stand) + "ซึรุรุ" บนสนามเรา, เรียง "โซเนบุ" ไว้ใบบนสุดของกองเรา และสั่ง AI โจมตีทันที -> คลิกเลือกมายอาเข้ารับการโจมตี (Intercept) เพื่อเปิดท็อปกองเจอมอนสเตอร์โซเนบุและบังคับจบเทิร์น AI!',
      DM04: 'วาง "เดบิรุน" บนสนามเรา, ใส่เวท "เบิกเนตรแห่งแสง" และยูนิตในนรก -> เปิดหน้าต่างสกิลเข้าเทิร์นของเดบิรุนให้เลือกค้นหาเวทหรือชุบยูนิตทันที!',
      DM07: 'ตั้งค่าจำนวนยูนิตฝั่งเราที่ถูกทำลายในเทิร์นนี้ = 2 ใบ และใส่ "แอชชี่ล่า" บนมือเรา (ขอบการ์ดเรืองแสงสีส้ม) -> คลิกที่แอชชี่ล่าบนมือเพื่อคอลพิเศษพลัง +2 ได้เลย!',
      DM08: 'วาง "เอมิ" (Rest) คู่กับ "เดบิรุน" บนสนามเรา, เติมการ์ดบนมือ 3 ใบ และเข้าสู่ Battle Phase -> คลิกที่เอมิบนสนามเพื่อกดใช้สกิลทิ้งมือ 3 ใบลุกขึ้น Stand โจมตีซ้ำ!',
      DM09: 'วาง "มายอา" บนสนามเรา, ใส่ "อนาคต - ผู้รักษาความฝัน มายอา" บนมือเรา และวางเวทไว้ใบบนสุดของกอง -> คลิกการ์ดอนาคตบนมือเพื่อส่งมายอาไปมิติมืดและคอลลงสนาม!',
      DM10: 'วาง "เดบิรุน" + ยูนิตอีกใบบนสนามเรา, ใส่ "อนาคต - เดบิรุน เดอะ ฟิวเจอร์" บนมือเรา -> คลิกการ์ดอนาคตบนมือเพื่อทดสอบยกเพื่อนขึ้นมือและเปิดท็อปกองคอลลงสนาม!',
      DM11: 'วาง "ซึรุรุ" บนสนามเรา, ใส่ "มายอา" ในนรก และใส่ "อนาคต - เด็กสาวขนมหวาน ซึรุรุ" บนมือ -> คลิกการ์ดอนาคตบนมือเพื่อชุบมายอาพลัง +1!',
      DM12: 'วาง "โซเนบุ" บนสนามเรา, ใส่ "อนาคต - นักล่าปีศาจ โซเนบุ" บนมือเรา -> คลิกการ์ดอนาคตบนมือเพื่อบังคับอีกฝ่ายทิ้งมือ/ทำลายยูนิต หรือรับพลัง +1!',
      DM13: 'วาง "แอชชี่ล่า" บนสนามเรา, วางยูนิตบนสนาม AI และใส่ "อนาคต - แอชชี่ล่า ร่างสมบูรณ์" บนมือ -> คลิกการ์ดอนาคตบนมือเพื่อทำลายยูนิตอีกฝ่ายและรับบัฟพลัง!',
      DM14: 'วาง "เอมิ" บนสนามเรา, วางยูนิตบนสนาม AI + มอนสเตอร์บนมือ AI และใส่ "อนาคต - สุดยอดเอไอ เอมิ" บนมือ -> คลิกการ์ดอนาคตบนมือเพื่อบังคับ AI สลับยูนิต!',
      DS02: 'ใส่เวทรีแอค "ร่างโคลนของเอมิ" บนมือเรา, วาง "เอมิ" บนสนามเรา และสั่ง AI โจมตีทันที -> กดใช้เวทรีแอคในหน้าต่างป้องกันเพื่อหยุดการโจมตีและชุบยูนิต!',
      DN06: 'ใส่ "อินโดมินัสเร็กซ์" บนมือเรา (ขอบเรืองแสงสีเขียว) พร้อมวัตถุดิบ "ทีเร็กซ์" + "เวโลซิแรปเตอร์" -> คลิกที่อินโดมินัสเร็กซ์บนมือเพื่ออัญเชิญไฮบริดส่งวัตถุดิบไปมิติมืด!',
      DN07: 'ใส่ "อินโดแรปเตอร์" บนมือเรา (ขอบเรืองแสงสีเขียว) พร้อมวัตถุดิบ "อินโดมินัสเร็กซ์" + "เวโลซิแรปเตอร์" -> คลิกที่อินโดแรปเตอร์บนมือเพื่ออัญเชิญไฮบริด!',
      DNS03: 'ใส่เวทรีแอค "ไดโนคำราม" บนมือเรา, วางไดโนพลัง ≥ 4 และไดโนตัวอื่นบนสนามเรา แล้วสั่ง AI โจมตีทันที -> กดใช้เวทรีแอคเพื่อลดดาเมจเป็น 0 และทำลายผู้โจมตี!',
      DMM04: 'ใส่ "ซาตาน บาปแห่งความโกรธ" บนมือเรา, เติมมิติมืด 15 ใบ (พร้อมดินแดนปีศาจ) และใส่ปีศาจ 7 บาปอีก 6 ตนครบในสนาม/นรก -> อัญเชิญซาตานลงสนามเพื่อดูสกิลทำลายล้างหรือชนะเกมทันที (Alternate Win)!',
      DMS01: 'ใส่แลนด์สเปล "สัญญาปีศาจ" บนมือเรา และใส่การ์ดในนรก 3 ใบ -> คลิกร่ายสัญญาปีศาจเพื่อส่งไปมิติมืด จั่ว 1 ทิ้ง 1 (และเมื่อกดจบเทิร์นจะได้เลือกเก็บการ์ดจากนรกขึ้นมือ)!',
      DMS02: 'ใส่เวทรีแอค "บาปแห่งปีศาจ" บนมือเรา, วาง "ดินแดนปีศาจ" ในมิติมืด, ใส่ปีศาจ 2 ใบในนรก และสั่ง AI โจมตีทันที -> กดใช้เวทรีแอคเพื่อหยุดการโจมตีและนำปีศาจกลับเข้ากอง!',
      OM02: 'ใส่ "ไอแบงค์บ้าเกม" บนมือเรา และเรียง "ไอโอ๊ตบ้าการ์ตูน (OM01)" กับ "ไอดีนบ้าHee (OM07)" ไว้ 2 ใบบนสุดของกอง -> อัญเชิญไอแบงค์บ้าเกมลงสนามเพื่อเปิด 2 ใบบนสุดคอลลงสนามพร้อมติดบัฟพิเศษ!',
      OM04: 'วาง "ไอโอ๊ตบ้าการ์ตูน (OM01)", "ไอแบงค์บ้าเกม (OM02)", และ "ไอจิตบ้ากาม (OM03)" บนสนามเรา + ใส่การ์ดในนรก และใส่ "ไออาร์มบ้าการ์ดเกม (OM04)" บนมือ -> อัญเชิญลงสนามเพื่อทริกเกอร์ครบทั้ง 3 เงื่อนไขพร้อมกัน!',
      OM05: 'ใส่ "ไอเหนือผู้มีคลิปแปลก" บนมือเรา, เรียงเวทไว้ 3 ใบบนสุดของกอง และใส่ Normal Spell บนมือ -> อัญเชิญลงสนามเพื่อหยิบเวทจากท็อป 3 แล้วคลิกที่ตัวมันบนสนามเพื่อร่ายเวทฟรีไม่เสียโควต้า!',
      OS03: 'ใส่เวทรีแอค "บิดไม่ได้แต่ช่วยได้" บนมือเรา, วาง "ไอเจย์นักบิด (OM08)" บนสนามเรา, ใส่การ์ดในนรก 3 ใบ และสั่ง AI โจมตีทันที -> กดใช้เวทรีแอคเพื่อป้องกันและนำการ์ดกลับเข้ากอง!'
    };

    if (guides[cardId]) return guides[cardId];
    if (card.type === 'ReactionSpell') {
      return `ใส่เวทรีแอค "${card.name}" บนมือเรา พร้อมจัดเงื่อนไขสนามให้ครบ และสั่ง AI โจมตีทันทีเพื่อให้หน้าต่างกดใช้ Reaction Spell เด้งขึ้นมาให้ทดสอบทันที!`;
    }
    if (card.type === 'NormalSpell') {
      return `ใส่เวทมนตร์ "${card.name}" บนมือเรา, รีเซ็ตโควต้าเวทเป็น 0/1 และจัดเตรียมเป้าหมายบนสนาม/นรก/มือให้พร้อม -> คลิกที่การ์ด "${card.name}" บนมือเพื่อร่ายทดสอบสกิลได้ทันที!`;
    }
    return `ใส่ยูนิต "${card.name}" บนมือเรา (พร้อมเปิดช่องว่างบนสนามและจัดเงื่อนไขเผ่า/นรก/มิติมืด/ยูนิตฝั่ง AI ให้ครบ) -> คลิกที่ "${card.name}" บนมือเพื่ออัญเชิญลงสนาม หรือคลิกที่ตัวมันบนสนามเพื่อกดใช้สกิลได้ทันที!`;
  }

  function syncDummyAIButtonUI() {
    const dummyBtn = document.getElementById('btn-toggle-dummy-ai');
    if (dummyBtn) {
      dummyBtn.classList.toggle('is-on', dummyAIEnabled);
      dummyBtn.textContent = `🛑 หุ่นซ้อม AI (ไม่เดินเอง): ${dummyAIEnabled ? 'เปิดอยู่ ✅' : 'ปิดอยู่ ❌'}`;
    }
  }

  function setupScenarioForCard(cardId) {
    if (!ensureSandboxMatchReady()) return;
    const cardTpl = CARD_DATABASE.find(c => c.id === cardId);
    if (!cardTpl) return;

    dummyAIEnabled = true;
    syncDummyAIButtonUI();

    const p = gameState.player;
    const a = gameState.ai;

    // เคลียร์สถานะพื้นฐานให้สะอาดและพร้อมเทสต์
    gameState.gameOver = false;
    gameState.isWaitingForChoice = false;
    gameState.pendingAction = null;
    gameState.pendingAttack = null;
    gameState.selectedHandIndex = null;
    gameState.selectedAttackerSlot = null;
    gameState.activeTurn = 'player';
    gameState.phase = 'Main Phase';
    gameState.turnCount = 2;

    p.turnsTaken = 2;
    p.attacksThisTurn = 0;
    p.unitsDestroyedThisTurn = 0;
    p.futureUsedThisTurn = false;
    p.jitCrazyUpgraded = false;
    p.spellQuota = { normalUsed: 0, reactionUsed: 0 };
    p.leader.hp = 6;
    p.leader.abilityUsedThisTurn = false;
    p.board = [null, null, null];
    p.hand = [];
    p.graveyard = [];
    p.darkDimension = [];
    p.deck = DEFAULT_DECK_LIST.map(cid => makeSandboxCard(cid)).filter(Boolean);

    a.turnsTaken = 2;
    a.attacksThisTurn = 0;
    a.leader.hp = 6;
    a.board = [makeSandboxCard('M01'), makeSandboxCard('M02'), null];
    a.hand = [makeSandboxCard('M01'), makeSandboxCard('M02')];
    a.graveyard = [makeSandboxCard('M07'), makeSandboxCard('S01')];
    a.darkDimension = [];
    a.deck = DEFAULT_DECK_LIST.map(cid => makeSandboxCard(cid)).filter(Boolean);

    // เติมของพื้นฐานในนรกและกองฝั่งเราเผื่อสกิลขุด/ค้นหา
    p.graveyard.push(makeSandboxCard('M01'), makeSandboxCard('M02'), makeSandboxCard('S01'));

    // กรณีที่ 1: การ์ดประเภท Leader (L01 - L06)
    if (cardTpl.type === 'Leader') {
      const newLeader = makeSandboxCard(cardId);
      newLeader.hp = newLeader.maxHp || 6;
      newLeader.abilityUsedThisTurn = false;
      p.leader = newLeader;
      p.deck = getDefaultDeckForLeader(cardId).map(cid => makeSandboxCard(cid)).filter(Boolean);

      if (cardId === 'L01') {
        p.board[0] = makeSandboxCard('M01');
        p.hand.push(makeSandboxCard('M02'), makeSandboxCard('M07'));
      } else if (cardId === 'L02') {
        p.graveyard.push(makeSandboxCard('NM01'));
        p.deck.push(makeSandboxCard('NM01'));
        p.hand.push(makeSandboxCard('NM02'), makeSandboxCard('NM04'));
        closeSandboxModal();
        renderGame();
        setLog('🧪 [จัดฉาก L02 ขุนเหนือ] ทดสอบสกิลออโต้เข้าเทิร์นของขุนเหนือทันที!');
        triggerKhunNueaStartTurn(p);
        return;
      } else if (cardId === 'L03') {
        p.graveyard.push(makeSandboxCard('DM01'), makeSandboxCard('DM03'));
        p.hand.push(makeSandboxCard('DM04'), makeSandboxCard('DS01'));
        closeSandboxModal();
        renderGame();
        setLog('🧪 [จัดฉาก L03 วันสิ้นโลก] ทดสอบสกิลออโต้เข้าเทิร์นคอลยูนิตพลัง ≤ 2 จากนรกทันที!');
        triggerDoomsdayStartTurnQueue(p);
        return;
      } else if (cardId === 'L04') {
        p.board[0] = makeSandboxCard('DN01');
        p.hand.push(makeSandboxCard('DN02'), makeSandboxCard('DN05'));
      } else if (cardId === 'L05') {
        p.demonStartOfGameTriggered = false;
        applyStartOfGameLeaderEffects(p);
        p.board[0] = makeSandboxCard('DMM01');
      } else if (cardId === 'L06') {
        p.deck.push(makeSandboxCard('OM01'), makeSandboxCard('OS01'));
        p.hand.push(makeSandboxCard('OM02'));
        closeSandboxModal();
        renderGame();
        setLog('🧪 [จัดฉาก L06 ไอโอ๊ตบ้าทุกสิ่ง] ทดสอบสกิลออโต้เข้าเทิร์นเปิดการ์ด 2 ใบบนสุดของกองทันที!');
        triggerOatLeaderStartTurn(p);
        return;
      }

      closeSandboxModal();
      setLog(`🧪 [จัดฉากทดสอบ ${cardTpl.name}] ตั้งเป็น Leader ฝั่งเราเรียบร้อย — คลิกที่การ์ด Leader ของเราเพื่อกดใช้สกิลได้เลย!`);
      renderGame();
      return;
    }

    // กรณีที่ 2: การ์ดป้องกันจากมือ / บนสนาม และ Reaction Spells ที่ต้องให้ AI โจมตีเข้ามา
    if (cardId === 'M03') {
      p.leader.hp = 2;
      p.hand.push(makeSandboxCard('M03'), makeSandboxCard('M01'));
      forceAIAttackPlayer('leader', null);
      return;
    }
    if (cardId === 'M04') {
      p.leader.hp = 1;
      p.graveyard = [makeSandboxCard('M01'), makeSandboxCard('M02'), makeSandboxCard('M03')];
      p.hand.push(makeSandboxCard('M04'));
      forceAIAttackPlayer('leader', null);
      return;
    }
    if (cardId === 'DM03') {
      p.board[0] = makeSandboxCard('DM03');
      p.board[1] = makeSandboxCard('DM05');
      p.deck.push(makeSandboxCard('DM06')); // โซเนบุอยู่ใบบนสุดของกอง
      forceAIAttackPlayer('leader', null);
      return;
    }
    if (cardId === 'DN03') {
      p.board[0] = makeSandboxCard('DN03');
      a.board[0] = makeSandboxCard('M07'); // Power 1 ตีเข้ามาไม่เข้ากระดองแองคิโลซอรัส
      forceAIAttackPlayer('leader', null);
      return;
    }
    if (cardTpl.type === 'ReactionSpell') {
      p.hand.push(makeSandboxCard(cardId));
      if (cardId === 'DS02') {
        p.board[0] = makeSandboxCard('DM08'); // เอมิบนสนาม
        p.graveyard.push(makeSandboxCard('DM01'), makeSandboxCard('DM04'));
      } else if (cardId === 'DNS03') {
        p.board[0] = makeSandboxCard('DN05'); // ทีเร็กซ์ Power 4
        p.board[1] = makeSandboxCard('DN01'); // สเตโกซอรัส Power 2
      } else if (cardId === 'DMS02') {
        p.darkDimension.push(makeSandboxCard('DMS03')); // ดินแดนปีศาจในมิติมืด
        p.graveyard.push(makeSandboxCard('DMM01'), makeSandboxCard('DMM02'));
      } else if (cardId === 'OS03') {
        p.board[0] = makeSandboxCard('OM08'); // ไอเจย์นักบิดบนสนาม
        p.graveyard.push(makeSandboxCard('OM01'), makeSandboxCard('OM02'), makeSandboxCard('OS01'));
      }
      forceAIAttackPlayer('leader', null);
      return;
    }

    // กรณีที่ 3: การ์ดที่มีเงื่อนไขเฉพาะตัว
    switch (cardId) {
      case 'M02': // โทโดจิต (ต้องการบาคุจิตบนสนาม)
        p.board[0] = makeSandboxCard('M01');
        p.hand.push(makeSandboxCard('M02'));
        break;
      case 'M05': // เอ็นเดจิต
        p.board[0] = makeSandboxCard('M05');
        p.hand.push(makeSandboxCard('M05'));
        break;
      case 'M06': // ฮออ์กส์ฟีม (ค้นหาเอ็นเดจิตจากกอง/นรก)
        p.board[0] = makeSandboxCard('M06');
        p.graveyard.push(makeSandboxCard('M05'));
        p.deck.push(makeSandboxCard('M05'));
        p.hand.push(makeSandboxCard('M06'));
        break;
      case 'S01': // วันฟอจิต (ต้องการออลจิตบนสนามจะได้ +3 แทน +2)
        p.board[0] = makeSandboxCard('M03');
        p.board[1] = makeSandboxCard('M01');
        p.hand.push(makeSandboxCard('S01'));
        break;
      case 'S02': // ระเบิดจิต (ทิ้งมือ 1 ทำลาย 1)
        p.hand.push(makeSandboxCard('S02'), makeSandboxCard('M07'));
        break;
      case 'S03': // จิตฮีล (ทิ้งมือ 2 ฮีล लीडเดอร์ +1)
        p.leader.hp = 4;
        p.hand.push(makeSandboxCard('S03'), makeSandboxCard('M07'), makeSandboxCard('M01'));
        break;
      case 'S04': // ทุกสิ่งเพื่อหนึ่งเดียว (ต้องมียูนิต Stand บนสนามเรา >= 2 ใบ)
        p.board[0] = makeSandboxCard('M01');
        p.board[1] = makeSandboxCard('M02');
        p.hand.push(makeSandboxCard('S04'));
        break;
      case 'S05': // พลังสืบทอด (ชุบจากนรก)
        p.graveyard = [makeSandboxCard('M01'), makeSandboxCard('M05'), makeSandboxCard('S01')];
        p.hand.push(makeSandboxCard('S05'));
        break;

      // --- เด็คเหนือ ---
      case 'NM01': // ไพร่ชาวนาเหนือ
        p.leader = makeSandboxCard('L02');
        p.deck.push(makeSandboxCard('NM05'), makeSandboxCard('NM02'), makeSandboxCard('NM04'));
        p.graveyard.push(makeSandboxCard('NM05'));
        p.hand.push(makeSandboxCard('NM01'), makeSandboxCard('NM01'));
        break;
      case 'NM02': // ทหารหลวงเหนือ (จุติ + โบนัสเมื่อมีทหารเกณฑ์เหนือ)
      case 'NM03': // ทหารม้าเหนือ
        p.leader = makeSandboxCard('L02');
        p.board[0] = makeSandboxCard('NM04');
        p.graveyard.push(makeSandboxCard('NM03'), makeSandboxCard('NM04'));
        p.deck.push(makeSandboxCard('NM02'), makeSandboxCard('NM04'));
        p.hand.push(makeSandboxCard(cardId), makeSandboxCard('NM01'));
        break;
      case 'NM04': // ทหารเกณฑ์เหนือ
        p.board[0] = makeSandboxCard('NM02');
        p.hand.push(makeSandboxCard('NM04'));
        break;
      case 'NM05': // สายลับไพร่เหนือ
        a.board = [makeSandboxCard('M01'), null, null];
        p.hand.push(makeSandboxCard('NM05'));
        break;
      case 'NS01': // กองทัพหลวงเหนือ (ทหาร 3 ใบบนสนาม)
        p.board = [makeSandboxCard('NM02'), makeSandboxCard('NM03'), makeSandboxCard('NM04')];
        a.board = [makeSandboxCard('M01'), makeSandboxCard('M02'), makeSandboxCard('M07')];
        p.hand.push(makeSandboxCard('NS01'));
        break;
      case 'NS02': // สั่งประหาร
        a.board[0] = makeSandboxCard('NM05'); // มีสายลับบนสนามอีกฝ่าย
        p.hand.push(makeSandboxCard('NS02'), makeSandboxCard('NM01'));
        break;
      case 'NS03': // หมอไพร่เหนือ
        p.graveyard = [makeSandboxCard('NM01'), makeSandboxCard('NM02'), makeSandboxCard('NS01')];
        p.hand.push(makeSandboxCard('NS03'));
        break;

      // --- เด็ควันสิ้นโลก ---
      case 'DM01': // โซระ (ทิ้งมือ 1 คอลยูนิตพลัง <= 2 จากนรก)
        p.graveyard = [makeSandboxCard('DM03'), makeSandboxCard('DM05')];
        p.hand.push(makeSandboxCard('DM01'), makeSandboxCard('DM02'));
        break;
      case 'DM02': // ยูอิ (เปิดท็อป 3 หยิบมอนสเตอร์พลัง <= 2)
        p.deck.push(makeSandboxCard('DS01'), makeSandboxCard('DM03'), makeSandboxCard('DM01'));
        p.hand.push(makeSandboxCard('DM02'));
        break;
      case 'DM04': // เดบิรุน
        p.board[0] = makeSandboxCard('DM04');
        p.graveyard.push(makeSandboxCard('DS01'), makeSandboxCard('DM01'));
        p.deck.push(makeSandboxCard('DS03'));
        p.hand.push(makeSandboxCard('DM04'));
        closeSandboxModal();
        renderGame();
        setLog('🧪 [จัดฉาก DM04 เดบิรุน] เปิดหน้าต่างสกิลออโต้เข้าเทิร์นของเดบิรุนทันที!');
        triggerDebirunStartTurn(p, () => renderGame());
        return;
      case 'DM05': // ซึรุรุ (ปกป้องมายอา + ตายแล้วดึงมายอาขึ้นมือ)
        p.board[0] = makeSandboxCard('DM03');
        p.deck.push(makeSandboxCard('DM03'));
        p.hand.push(makeSandboxCard('DM05'));
        break;
      case 'DM06': // โซเนบุ (ต้องมียูนิตใบอื่นบนสนามอีก 2 ใบถึงจะตีได้ และได้ +1)
        p.board[0] = makeSandboxCard('DM01');
        p.board[1] = makeSandboxCard('DM03');
        p.hand.push(makeSandboxCard('DM06'));
        break;
      case 'DM07': // แอชชี่ล่า (ยูนิตฝั่งเราถูกทำลาย >= 2 ใบในเทิร์นนี้)
        p.unitsDestroyedThisTurn = 2;
        p.hand.push(makeSandboxCard('DM07'));
        break;
      case 'DM08': // เอมิ (เมื่อจบการต่อสู้และมีเดบิรุน ทิ้งมือ 3 ใบลุกขึ้น Stand)
        p.board[0] = makeSandboxCard('DM08');
        p.board[0].state = 'Rest';
        p.board[1] = makeSandboxCard('DM04');
        p.hand.push(makeSandboxCard('DM01'), makeSandboxCard('DM02'), makeSandboxCard('DM03'));
        gameState.phase = 'Battle Phase';
        break;
      case 'DM09': // อนาคต - ผู้รักษาความฝัน มายอา
        p.board[0] = makeSandboxCard('DM03');
        p.deck.push(makeSandboxCard('DS01')); // ท็อปกองเป็นเวท
        p.hand.push(makeSandboxCard('DM09'));
        break;
      case 'DM10': // อนาคต - เดบิรุน เดอะ ฟิวเจอร์
        p.board[0] = makeSandboxCard('DM04');
        p.board[1] = makeSandboxCard('DM01');
        p.deck.push(makeSandboxCard('DM06'));
        p.hand.push(makeSandboxCard('DM10'));
        break;
      case 'DM11': // อนาคต - เด็กสาวขนมหวาน ซึรุรุ
        p.board[0] = makeSandboxCard('DM05');
        p.graveyard.push(makeSandboxCard('DM03'));
        p.hand.push(makeSandboxCard('DM11'));
        break;
      case 'DM12': // อนาคต - นักล่าปีศาจ โซเนบุ
        p.board[0] = makeSandboxCard('DM06');
        p.hand.push(makeSandboxCard('DM12'));
        break;
      case 'DM13': // อนาคต - แอชชี่ล่า ร่างสมบูรณ์
        p.board[0] = makeSandboxCard('DM07');
        p.hand.push(makeSandboxCard('DM13'));
        break;
      case 'DM14': // อนาคต - สุดยอดเอไอ เอมิ
        p.board[0] = makeSandboxCard('DM08');
        a.board[0] = makeSandboxCard('M01');
        a.hand = [makeSandboxCard('M02')];
        p.hand.push(makeSandboxCard('DM14'));
        break;
      case 'DS01': // เบิกเนตรแห่งแสง (มีของในนรก >= 5 ใบจะจั่ว 2 แทน 1)
        p.board[0] = makeSandboxCard('DM01');
        p.graveyard = ['DM01', 'DM02', 'DM03', 'DM04', 'DM05'].map(cid => makeSandboxCard(cid));
        p.hand.push(makeSandboxCard('DS01'));
        break;
      case 'DS03': // ประตูสู่มิติอนาคต
        p.board[0] = makeSandboxCard('DM03');
        p.deck.push(makeSandboxCard('DM09'), makeSandboxCard('DM10'));
        p.graveyard.push(makeSandboxCard('DM11'));
        p.hand.push(makeSandboxCard('DS03'), makeSandboxCard('DM01'));
        break;

      // --- เด็คไดโน ---
      case 'DN01': // สเตโกซอรัส
      case 'DN02': // เวโลซิแรปเตอร์
      case 'DN04': // พเทอราโนดอน
      case 'DN05': // ทีเร็กซ์
        p.board[0] = makeSandboxCard('DN01');
        p.board[1] = makeSandboxCard('DN02');
        p.graveyard = [makeSandboxCard('DN03'), makeSandboxCard('DN04'), makeSandboxCard('DN05')];
        p.hand.push(makeSandboxCard(cardId));
        break;
      case 'DN06': // อินโดมินัสเร็กซ์ (ไฮบริด: ทีเร็กซ์ + เวโลซิแรปเตอร์)
        p.board[0] = makeSandboxCard('DN05');
        p.graveyard.push(makeSandboxCard('DN02'));
        p.hand.push(makeSandboxCard('DN06'), makeSandboxCard('DN02'));
        break;
      case 'DN07': // อินโดแรปเตอร์ (ไฮบริด: อินโดมินัสเร็กซ์ + เวโลซิแรปเตอร์)
        p.board[0] = makeSandboxCard('DN06');
        p.graveyard.push(makeSandboxCard('DN02'));
        p.hand.push(makeSandboxCard('DN07'), makeSandboxCard('DN02'));
        break;
      case 'DNS01': // ฟอสซิลคืนชีพ
        p.graveyard = [makeSandboxCard('DN05'), makeSandboxCard('DN02'), makeSandboxCard('DN06')];
        p.hand.push(makeSandboxCard('DNS01'));
        break;
      case 'DNS02': // กองทัพไดโนบุก
        p.board = [makeSandboxCard('DN05'), makeSandboxCard('DN02'), null];
        p.hand.push(makeSandboxCard('DNS02'));
        break;

      // --- เด็คปีศาจ ---
      case 'DMM01': // แอสโมเดียส
      case 'DMM02': // ลูซิเฟอร์
      case 'DMM03': // เบลเซบับ
      case 'DMM05': // ลิเวียธาน
      case 'DMM06': // เบลเฟกอร์
      case 'DMM07': // แมมมอน
      case 'DMM08': // ซามาเอล
      case 'DMS01': // สัญญาปีศาจ
      case 'DMS03': // ดินแดนปีศาจ
      case 'DMS04': // พิธีกรรมอัญเชิญปีศาจ
        p.leader = makeSandboxCard('L05');
        p.darkDimension = [
          makeSandboxCard('DMS03'),
          makeSandboxCard('DMS01'),
          ...['DMM01', 'DMM02', 'DMM03', 'DMM05', 'DMM06', 'DMM07', 'DMM08', 'DMM01', 'DMM02', 'DMM03', 'DMM05', 'DMM06', 'DMM07'].map(cid => makeSandboxCard(cid))
        ]; // 15 ใบในมิติมืด
        p.graveyard = [makeSandboxCard('DMM01'), makeSandboxCard('DMM02'), makeSandboxCard('DMM04')];
        p.board[0] = makeSandboxCard('DMM03');
        p.hand.push(makeSandboxCard(cardId), makeSandboxCard('DMM01'));
        break;
      case 'DMM04': // ซาตาน บาปแห่งความโกรธ (ครบ 7 บาป + มิติมืด 15 ใบ)
        p.leader = makeSandboxCard('L05');
        p.darkDimension = [
          makeSandboxCard('DMS03'),
          ...Array.from({ length: 14 }, () => makeSandboxCard('DMS01'))
        ]; // 15 ใบในมิติมืด
        p.board = [makeSandboxCard('DMM01'), makeSandboxCard('DMM02'), null];
        p.graveyard = ['DMM03', 'DMM05', 'DMM06', 'DMM07', 'DMM08'].map(cid => makeSandboxCard(cid));
        p.hand.push(makeSandboxCard('DMM04'));
        break;

      // --- เด็คโอ๊ต ---
      case 'OM01': // ไอโอ๊ตบ้าการ์ตูน
      case 'OM03': // ไอจิตบ้ากาม
      case 'OM07': // ไอดีนบ้าHee
      case 'OM08': // ไอเจย์นักบิด
      case 'OS01': // ท่าไม้ตาย(มั้ง)
      case 'OS02': // โดนแน่มึง
        p.leader = makeSandboxCard('L06');
        p.board = [makeSandboxCard('OM01'), makeSandboxCard('OM02'), null];
        p.graveyard = [makeSandboxCard('OM01'), makeSandboxCard('OM02'), makeSandboxCard('OM03'), makeSandboxCard('OS01')];
        p.hand.push(makeSandboxCard(cardId), makeSandboxCard('OS01'));
        break;
      case 'OM02': // ไอแบงค์บ้าเกม (เปิด 2 ใบบนสุดคอล OM01 / OM07)
        p.leader = makeSandboxCard('L06');
        p.deck.push(makeSandboxCard('OM07'), makeSandboxCard('OM01'));
        p.hand.push(makeSandboxCard('OM02'));
        break;
      case 'OM04': // ไออาร์มบ้าการ์ดเกม (เช็ก OM01 + OM02 + OM03 บนสนาม)
        p.leader = makeSandboxCard('L06');
        p.board = [makeSandboxCard('OM01'), makeSandboxCard('OM02'), makeSandboxCard('OM03')];
        p.graveyard = [makeSandboxCard('OS01'), makeSandboxCard('OM07')];
        p.hand.push(makeSandboxCard('OM04'));
        break;
      case 'OM05': // ไอเหนือผู้มีคลิปแปลก (เปิดท็อป 3 หยิบเวท + กดใช้ร่ายเวทฟรี)
        p.leader = makeSandboxCard('L06');
        p.deck.push(makeSandboxCard('OS01'), makeSandboxCard('OS02'), makeSandboxCard('OM01'));
        p.hand.push(makeSandboxCard('OM05'), makeSandboxCard('OS01'));
        break;
      case 'OM06': // ไอเอิร์ธบ้าพลัง (มี OM01 + OM02 ในนรกได้พลัง +1)
        p.leader = makeSandboxCard('L06');
        p.graveyard = [makeSandboxCard('OM01'), makeSandboxCard('OM02')];
        p.hand.push(makeSandboxCard('OM06'));
        break;

      default:
        p.hand.push(makeSandboxCard(cardId));
        break;
    }

    closeSandboxModal();
    setLog(`🧪 [จัดฉากพร้อมเทสต์: ${cardTpl.name} (${cardTpl.id})] — ${getScenarioGuideForCard(cardId)}`);
    renderGame();
  }

  function spawnCardToZone(cardId, zone) {
    if (!ensureSandboxMatchReady()) return;
    const inst = makeSandboxCard(cardId);
    if (!inst) return;
    const p = gameState.player;
    const a = gameState.ai;

    if (inst.type === 'Leader') {
      if (zone === 'AI_BOARD') {
        a.leader = inst;
        a.leader.hp = inst.maxHp || 6;
        setLog(`🧪 [ห้องทดลอง] เปลี่ยน Leader ของ AI เป็น "${inst.name}"!`);
      } else {
        p.leader = inst;
        p.leader.hp = inst.maxHp || 6;
        setLog(`🧪 [ห้องทดลอง] เปลี่ยน Leader ของเราเป็น "${inst.name}"!`);
      }
      renderGame();
      return;
    }

    switch (zone) {
      case 'PLAYER_HAND':
        p.hand.push(inst);
        setLog(`🧪 เสก "${inst.name}" เข้ามือเราเรียบร้อย!`);
        break;
      case 'PLAYER_BOARD': {
        if (inst.type !== 'Monster') {
          p.hand.push(inst);
          setLog(`🧪 "${inst.name}" เป็นการ์ดเวท จึงเสกเข้ามือเราแทน!`);
          break;
        }
        let slot = p.board.findIndex(m => m === null);
        if (slot === -1) slot = 0;
        p.board[slot] = inst;
        setLog(`🧪 เสก "${inst.name}" ลงช่องที่ ${slot + 1} บนสนามเราเรียบร้อย!`);
        break;
      }
      case 'PLAYER_GRAVE':
        p.graveyard.push(inst);
        setLog(`🧪 เสก "${inst.name}" ลงกองนรกเราเรียบร้อย!`);
        break;
      case 'PLAYER_DARK':
        p.darkDimension.push(inst);
        setLog(`🧪 เสก "${inst.name}" ไปยังมิติมืดเราเรียบร้อย!`);
        break;
      case 'PLAYER_DECK_TOP':
        p.deck.push(inst);
        setLog(`🧪 วาง "${inst.name}" ไว้ใบบนสุดของกองการ์ดเราเรียบร้อย!`);
        break;
      case 'AI_BOARD': {
        if (inst.type !== 'Monster') {
          a.hand.push(inst);
          setLog(`🧪 เสก "${inst.name}" เข้ามือ AI เรียบร้อย!`);
          break;
        }
        let aiSlot = a.board.findIndex(m => m === null);
        if (aiSlot === -1) aiSlot = 0;
        a.board[aiSlot] = inst;
        setLog(`🧪 เสก "${inst.name}" ลงช่องที่ ${aiSlot + 1} บนสนาม AI เรียบร้อย!`);
        break;
      }
      case 'AI_HAND':
        a.hand.push(inst);
        setLog(`🧪 เสก "${inst.name}" เข้ามือ AI เรียบร้อย!`);
        break;
    }
    renderGame();
  }

  // 🤖 ฟังก์ชันรันตรวจเช็กสกิลการ์ดทั้ง 72 ใบแบบอัตโนมัติ (ไม่กระทบกระดานหลัก)
  async function runAllCardDiagnostics() {
    const outBox = document.getElementById('bof-sandbox-diag-results');
    if (outBox) {
      outBox.style.display = 'block';
      outBox.innerHTML = `<div style="padding:12px;color:#38bdf8;font-weight:bold;">⏳ กำลังรันตรวจเช็กสกิลการ์ดทั้ง ${CARD_DATABASE.length} ใบ (Schema + รูปภาพ + เงื่อนไขสกิล + จำลองการทำงาน Player/AI)...</div>`;
    }

    const schemaReport = typeof validateCards === 'function' ? validateCards() : { ok: true, issues: [] };

    // 1. ตรวจสอบการโหลดรูปภาพของการ์ดทั้ง 72 ใบ
    const checkImage = (src) => new Promise(resolve => {
      if (!src) { resolve(false); return; }
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = src;
    });

    // สำรองสถานะเกมไว้ก่อนจำลองรันสกิล
    const backupState = {
      turnCount: gameState.turnCount,
      activeTurn: gameState.activeTurn,
      phase: gameState.phase,
      player: gameState.player,
      ai: gameState.ai,
      pendingAction: gameState.pendingAction,
      pendingAttack: gameState.pendingAttack,
      isWaitingForChoice: gameState.isWaitingForChoice,
      gameOver: gameState.gameOver,
      matchLogHistory: Array.isArray(gameState.matchLogHistory) ? [...gameState.matchLogHistory] : [],
      lastPlayedCardInfo: gameState.lastPlayedCardInfo
    };

    const results = [];
    let passCount = 0;
    let failCount = 0;

    try {
      for (const card of CARD_DATABASE) {
        const cardIssues = [];
        const notes = [];

        // เช็ก 1: รูปภาพ
        const imgOk = await checkImage(card.image);
        if (!imgOk) {
          cardIssues.push(`ไม่พบไฟล์รูปภาพ: ${card.image}`);
        } else {
          notes.push('รูปภาพพร้อม');
        }

        // เช็ก 2: คำอธิบายและข้อมูลพื้นฐาน
        const desc = getCardDescription(card);
        if (!desc || desc.trim().length === 0) {
          cardIssues.push('ไม่มีคำอธิบายความสามารถ (desc)');
        }

        // เช็ก 3: จำลองคำนวณค่าพลังและตรวจสอบสกิลในสภาพแวดล้อมจำลอง
        try {
          const mockP = createContestant('DiagPlayer', true, 'DP', 'L01', DEFAULT_DECK_LIST);
          const mockA = createContestant('DiagAI', false, 'DA', 'L01', DEFAULT_DECK_LIST);
          mockP.turnsTaken = 2;
          mockA.turnsTaken = 2;
          mockP.unitsDestroyedThisTurn = 2;
          mockP.board = [makeSandboxCard('M01'), makeSandboxCard('NM04'), makeSandboxCard('OM01')];
          mockA.board = [makeSandboxCard('M01'), makeSandboxCard('M02'), null];
          mockP.hand = [makeSandboxCard('M01'), makeSandboxCard('NM01'), makeSandboxCard('OS01')];
          mockA.hand = [makeSandboxCard('M01'), makeSandboxCard('M02')];
          mockP.graveyard = ['M01', 'M02', 'M03', 'DM03', 'DN02', 'DMM01', 'OM01', 'OM02', 'DS01'].map(cid => makeSandboxCard(cid)).filter(Boolean);
          mockP.darkDimension = [makeSandboxCard('DMS03'), ...Array.from({ length: 14 }, () => makeSandboxCard('DMS01'))];

          gameState.player = mockP;
          gameState.ai = mockA;
          gameState.activeTurn = 'player';
          gameState.phase = 'Main Phase';
          gameState.gameOver = false;
          gameState.pendingAction = null;

          const inst = makeSandboxCard(card.id);
          if (inst.type === 'Monster') {
            const pwr = getEffectivePower(inst, mockP);
            if (typeof pwr !== 'number' || Number.isNaN(pwr)) {
              cardIssues.push(`คำนวณพลังโจมตีผิดพลาด (ได้ค่า ${pwr})`);
            } else {
              notes.push(`Power=${pwr}`);
            }
          }

          if (Array.isArray(inst.effects) && inst.effects.length > 0) {
            for (const eff of inst.effects) {
              const ctxAI = {
                caster: mockP,
                opponent: mockA,
                sourceCard: inst,
                sourceSlot: 0,
                isAI: true
              };
              const checkRes = EffectEngine.canActivateEffect(eff, ctxAI);
              if (typeof checkRes.ok !== 'boolean') {
                cardIssues.push(`canActivateEffect คืนค่าไม่ถูกต้องในเอฟเฟกต์ ${eff.id || eff.trigger}`);
              }
              // จำลองรันสเต็ปของเอฟเฟกต์ในโหมด AI เพื่อเช็กว่าไม่มี exception หรือค้าง
              if (Array.isArray(eff.steps)) {
                EffectEngine.runSteps(eff.steps, 0, ctxAI, () => {});
              }
              notes.push(`Effect[${eff.trigger}] OK`);
            }
          } else {
            notes.push('Special/Passive Handler OK');
          }
        } catch (simErr) {
          cardIssues.push(`จำลองรันสกิลพบข้อผิดพลาด: ${simErr.message || simErr}`);
        }

        const choiceModal = document.getElementById('custom-choice-modal');
        if (choiceModal) choiceModal.style.display = 'none';

        const ok = cardIssues.length === 0;
        if (ok) passCount++;
        else failCount++;

        results.push({
          id: card.id,
          name: card.name,
          type: card.type,
          ok,
          issues: cardIssues,
          notes: notes.join(' · ')
        });
      }
    } finally {
      // คืนค่าสถานะกระดานเดิมกลับมาทั้งหมด
      gameState.turnCount = backupState.turnCount;
      gameState.activeTurn = backupState.activeTurn;
      gameState.phase = backupState.phase;
      gameState.player = backupState.player;
      gameState.ai = backupState.ai;
      gameState.pendingAction = backupState.pendingAction;
      gameState.pendingAttack = backupState.pendingAttack;
      gameState.isWaitingForChoice = backupState.isWaitingForChoice;
      gameState.gameOver = backupState.gameOver;
      gameState.matchLogHistory = backupState.matchLogHistory;
      gameState.lastPlayedCardInfo = backupState.lastPlayedCardInfo;
      if (gameState.player && gameState.ai) {
        _originalRenderGame();
      }
    }

    if (!outBox) return results;

    const allOk = failCount === 0 && schemaReport.ok;
    outBox.innerHTML = `
      <div class="bof-diag-summary ${allOk ? 'is-pass' : 'is-fail'}">
        <div>
          <strong>${allOk ? '✅ ตรวจเช็กการ์ดทั้ง 72 ใบผ่านครบ 100%!' : `⚠️ พบจุดต้องตรวจสอบ ${failCount} ใบ`}</strong>
          <div style="font-size:12px;margin-top:2px;color:#cbd5e1;">
            ผ่านการตรวจสอบ: <b>${passCount}/${CARD_DATABASE.length} ใบ</b> · Schema & เด็คมาตรฐาน: <b>${schemaReport.ok ? 'ปกติ (0 issues)' : `พบ ${schemaReport.issues.length} รายการ`}</b>
          </div>
        </div>
        <button type="button" class="btn" style="background:#334155;font-size:11.5px;padding:4px 10px;" id="btn-hide-diag-results">ซ่อนผลลัพธ์</button>
      </div>
      <div class="bof-diag-table-wrap">
        ${results.map(r => `
          <div class="bof-diag-row ${r.ok ? 'is-ok' : 'is-err'}">
            <span class="bof-diag-badge">${r.ok ? '✅ PASS' : '❌ FAIL'}</span>
            <strong class="bof-diag-card-name">[${r.id}] ${r.name}</strong>
            <span class="bof-diag-card-type">${r.type}</span>
            <span class="bof-diag-card-note">${r.ok ? r.notes : r.issues.join(', ')}</span>
            <button type="button" class="btn bof-diag-try-btn" data-diag-try="${r.id}">⚡ เทสต์ใบนี้</button>
          </div>
        `).join('')}
      </div>
    `;

    outBox.querySelector('#btn-hide-diag-results')?.addEventListener('click', () => {
      outBox.style.display = 'none';
    });
    outBox.querySelectorAll('[data-diag-try]').forEach(btn => {
      btn.addEventListener('click', () => {
        const cid = btn.getAttribute('data-diag-try');
        selectedCardId = cid;
        setupScenarioForCard(cid);
      });
    });

    return results;
  }

  function renderSandboxCardDetails() {
    const selectEl = document.getElementById('bof-sandbox-card-select');
    const previewEl = document.getElementById('bof-sandbox-card-preview');
    if (!selectEl || !previewEl) return;

    const filteredCards = CARD_DATABASE.filter(c => {
      if (selectedDeckFilter !== 'ALL' && getCardDeckCategory(c) !== selectedDeckFilter) return false;
      if (searchKeyword) {
        const kw = searchKeyword.toLowerCase();
        const matchId = (c.id || '').toLowerCase().includes(kw);
        const matchName = (c.name || '').toLowerCase().includes(kw);
        const matchDesc = (c.desc || '').toLowerCase().includes(kw);
        if (!matchId && !matchName && !matchDesc) return false;
      }
      return true;
    });

    if (filteredCards.length > 0 && !filteredCards.some(c => c.id === selectedCardId)) {
      selectedCardId = filteredCards[0].id;
    }

    selectEl.innerHTML = filteredCards.map(c => {
      const pwrTxt = c.type === 'Monster' ? `⚔️${c.power}` : (c.type === 'Leader' ? `👑HP ${c.maxHp}` : `✨${c.type}`);
      return `<option value="${c.id}" ${c.id === selectedCardId ? 'selected' : ''}>[${c.id}] ${c.name} (${pwrTxt})</option>`;
    }).join('');

    const currentCard = CARD_DATABASE.find(c => c.id === selectedCardId) || filteredCards[0];
    if (!currentCard) {
      previewEl.innerHTML = `<div style="padding:16px;color:#94a3b8;text-align:center;">ไม่พบการ์ดที่ตรงกับคำค้นหา</div>`;
      return;
    }

    const guideTxt = getScenarioGuideForCard(currentCard.id);
    const descTxt = getCardDescription(currentCard);

    previewEl.innerHTML = `
      <div class="bof-sb-preview-card">
        <img class="bof-sb-preview-img" src="${currentCard.image}" alt="${currentCard.name}">
        <div class="bof-sb-preview-info">
          <div class="bof-sb-preview-head">
            <span class="bof-sb-id-badge">${currentCard.id}</span>
            <strong class="bof-sb-title">${currentCard.name}</strong>
            <span class="bof-sb-meta-pill">${currentCard.type}${currentCard.tribe ? ` · เผ่า${currentCard.tribe}` : ''}${currentCard.power !== undefined ? ` · Power ${currentCard.power}` : ''}</span>
          </div>
          <div class="bof-sb-skill-box">
            <b>📜 ความสามารถการ์ด:</b>
            <div>${descTxt}</div>
          </div>
          <div class="bof-sb-guide-box">
            <b>💡 วิธีทดสอบเมื่อกดปุ่ม "จัดฉากพร้อมเทสต์ใบนี้ทันที":</b>
            <div>${guideTxt}</div>
          </div>
        </div>
      </div>
    `;
  }

  function ensureSandboxModal() {
    let modal = document.getElementById('bof-sandbox-modal');
    if (modal) return modal;

    modal = document.createElement('div');
    modal.id = 'bof-sandbox-modal';
    modal.className = 'modal-overlay';
    modal.style.display = 'none';
    modal.style.zIndex = '320';

    const deckTabs = [
      { key: 'ALL', label: '🃏 ทั้งหมด (72)' },
      { key: 'LEADER', label: '👑 Leader (6)' },
      { key: 'JIT', label: '⚡ เด็คจิต' },
      { key: 'NUEA', label: '🌾 เด็คเหนือ' },
      { key: 'DOOM', label: '⏳ วันสิ้นโลก' },
      { key: 'DINO', label: '🦖 เด็คไดโน' },
      { key: 'DEMON', label: '😈 เด็คปีศาจ' },
      { key: 'OAT', label: '🤪 เด็คโอ๊ต' }
    ];

    modal.innerHTML = `
      <div class="modal-box bof-sandbox-box">
        <div class="ai-setup-header">
          <div>
            <h2>🧪 ห้องทดลองสกิลการ์ด & ตรวจเช็กบั๊ก 72 ใบ (Skill Lab)</h2>
            <p>เลือกการ์ดใบไหนก็ได้เพื่อจัดฉากเทสต์สกิลในคลิกเดียวโดยไม่ต้องรอสุ่มจั่วในแมตช์จริง</p>
          </div>
          <button type="button" id="btn-close-sandbox-x" class="bof-auth-close-x" aria-label="ปิด">✕</button>
        </div>

        <!-- แถบที่ 1: ปุ่มสแกนตรวจเช็กอัตโนมัติทั้ง 72 ใบ + โหมดหุ่นซ้อม AI -->
        <div class="bof-sb-top-bar">
          <button type="button" class="btn bof-sb-diag-btn" id="btn-run-all-diagnostics">
            🤖 สแกนตรวจเช็กสกิลการ์ดทั้ง 72 ใบอัตโนมัติ (1-Click Audit)
          </button>
          <button type="button" class="btn bof-sb-dummy-btn ${dummyAIEnabled ? 'is-on' : ''}" id="btn-toggle-dummy-ai">
            🛑 หุ่นซ้อม AI (ไม่เดินเอง): ${dummyAIEnabled ? 'เปิดอยู่ ✅' : 'ปิดอยู่ ❌'}
          </button>
        </div>

        <div id="bof-sandbox-diag-results" class="bof-sandbox-diag-results" style="display:none;"></div>

        <!-- แถบที่ 2: เลือกหมวดหมู่เด็ค + ค้นหา + เลือกการ์ด -->
        <div class="bof-sb-filter-section">
          <div class="bof-sb-deck-tabs" id="bof-sb-deck-tabs">
            ${deckTabs.map(t => `
              <button type="button" class="bof-sb-tab-btn ${t.key === selectedDeckFilter ? 'is-active' : ''}" data-sb-tab="${t.key}">${t.label}</button>
            `).join('')}
          </div>
          <div class="bof-sb-select-row">
            <input type="text" id="bof-sandbox-search" class="bof-sb-search-input" placeholder="🔍 พิมพ์ค้นหาชื่อการ์ด / รหัส (เช่น ซาตาน, M04, ไฮบริด, อนาคต)...">
            <select id="bof-sandbox-card-select" class="bof-sb-card-select"></select>
          </div>
        </div>

        <!-- แถบที่ 3: ข้อมูลการ์ดที่เลือก + ปุ่มจัดฉากพร้อมเทสต์ทันที -->
        <div id="bof-sandbox-card-preview"></div>

        <div class="bof-sb-primary-actions">
          <button type="button" class="btn bof-sb-scenario-btn" id="btn-sb-setup-scenario">
            ⚡ จัดฉากพร้อมเทสต์ใบนี้ทันที! (เซ็ตสนาม/มือ/นรก/มิติมืดให้ครบอัตโนมัติ)
          </button>
        </div>

        <!-- แถบที่ 4: เสกการ์ดใบที่เลือกลงโซนต่างๆ โดยตรง -->
        <div class="bof-sb-zone-bar">
          <span class="bof-sb-bar-label">🃏 เสกใบนี้เพิ่มลงโซน:</span>
          <button type="button" class="btn bof-sb-zone-btn" data-sb-zone="PLAYER_HAND">+ มือเรา</button>
          <button type="button" class="btn bof-sb-zone-btn" data-sb-zone="PLAYER_BOARD">+ สนามเรา</button>
          <button type="button" class="btn bof-sb-zone-btn" data-sb-zone="PLAYER_GRAVE">+ นรกเรา</button>
          <button type="button" class="btn bof-sb-zone-btn" data-sb-zone="PLAYER_DARK">+ มิติมืดเรา</button>
          <button type="button" class="btn bof-sb-zone-btn" data-sb-zone="PLAYER_DECK_TOP">+ ใบบนสุดกองเรา</button>
          <button type="button" class="btn bof-sb-zone-btn is-ai" data-sb-zone="AI_BOARD">+ สนาม AI</button>
          <button type="button" class="btn bof-sb-zone-btn is-ai" data-sb-zone="AI_HAND">+ มือ AI</button>
        </div>

        <!-- แถบที่ 5: ปุ่มควบคุมกระดานด่วน -->
        <div class="bof-sb-quick-tools">
          <span class="bof-sb-bar-label">🎛️ เครื่องมือช่วยเทสต์ด่วน:</span>
          <button type="button" class="btn bof-sb-tool-btn is-attack" id="btn-sb-force-ai-attack">⚔️ สั่ง AI โจมตีเราทันที (เทสต์ป้องกัน/เวทรีแอค)</button>
          <button type="button" class="btn bof-sb-tool-btn" id="btn-sb-reset-quotas">🔄 รีเซ็ตสกิล 1/เทิร์น & โควต้าเวท + Stand ทุกใบ</button>
          <button type="button" class="btn bof-sb-tool-btn" id="btn-sb-trigger-start">🌅 ทดสอบเอฟเฟกต์เข้าเทิร์น (Start Phase)</button>
          <button type="button" class="btn bof-sb-tool-btn" id="btn-sb-trigger-end">🌙 ทดสอบเอฟเฟกต์จบเทิร์น (End Phase)</button>
          <button type="button" class="btn bof-sb-tool-btn" id="btn-sb-hp-1">💔 ตั้ง HP เรา = 1</button>
          <button type="button" class="btn bof-sb-tool-btn" id="btn-sb-hp-full">❤️ ฮีลเต็ม 6 HP ทั้งคู่</button>
          <button type="button" class="btn bof-sb-tool-btn" id="btn-sb-fill-dark">🌌 เติมมิติมืด 15 ใบ</button>
          <button type="button" class="btn bof-sb-tool-btn" id="btn-sb-lock-admin-inline" style="background:#475569 !important;margin-left:auto;">🔒 ล็อกซ่อนโหมดแอดมิน</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    modal.querySelector('#btn-close-sandbox-x').onclick = closeSandboxModal;
    modal.querySelector('#btn-sb-lock-admin-inline').onclick = () => {
      setAdminUnlocked(false);
    };
    modal.addEventListener('click', e => {
      if (e.target === modal) closeSandboxModal();
    });

    modal.querySelector('#btn-run-all-diagnostics').onclick = () => {
      runAllCardDiagnostics();
    };

    const dummyBtn = modal.querySelector('#btn-toggle-dummy-ai');
    dummyBtn.onclick = () => {
      dummyAIEnabled = !dummyAIEnabled;
      dummyBtn.classList.toggle('is-on', dummyAIEnabled);
      dummyBtn.textContent = `🛑 หุ่นซ้อม AI (ไม่เดินเอง): ${dummyAIEnabled ? 'เปิดอยู่ ✅' : 'ปิดอยู่ ❌'}`;
    };

    modal.querySelectorAll('[data-sb-tab]').forEach(tabBtn => {
      tabBtn.onclick = () => {
        selectedDeckFilter = tabBtn.getAttribute('data-sb-tab') || 'ALL';
        modal.querySelectorAll('[data-sb-tab]').forEach(b => b.classList.toggle('is-active', b === tabBtn));
        renderSandboxCardDetails();
      };
    });

    const searchInput = modal.querySelector('#bof-sandbox-search');
    searchInput.oninput = () => {
      searchKeyword = searchInput.value.trim();
      renderSandboxCardDetails();
    };

    const selectEl = modal.querySelector('#bof-sandbox-card-select');
    selectEl.onchange = () => {
      selectedCardId = selectEl.value;
      renderSandboxCardDetails();
    };

    modal.querySelector('#btn-sb-setup-scenario').onclick = () => {
      setupScenarioForCard(selectedCardId);
    };

    modal.querySelectorAll('[data-sb-zone]').forEach(zBtn => {
      zBtn.onclick = () => {
        const zone = zBtn.getAttribute('data-sb-zone');
        spawnCardToZone(selectedCardId, zone);
      };
    });

    modal.querySelector('#btn-sb-force-ai-attack').onclick = () => {
      forceAIAttackPlayer('leader', null);
    };

    modal.querySelector('#btn-sb-reset-quotas').onclick = () => {
      resetQuotasAndSkills();
      closeSandboxModal();
    };

    modal.querySelector('#btn-sb-trigger-start').onclick = () => {
      if (!ensureSandboxMatchReady()) return;
      closeSandboxModal();
      executeStartPhase(gameState.player, () => renderGame());
    };

    modal.querySelector('#btn-sb-trigger-end').onclick = () => {
      if (!ensureSandboxMatchReady()) return;
      closeSandboxModal();
      executeEndPhaseCleanup(gameState.player);
      renderGame();
    };

    modal.querySelector('#btn-sb-hp-1').onclick = () => {
      if (!ensureSandboxMatchReady()) return;
      gameState.player.leader.hp = 1;
      setLog('🧪 [ห้องทดลอง] ตั้ง HP ลีดเดอร์ของเราเป็น 1 HP เรียบร้อย!');
      renderGame();
      closeSandboxModal();
    };

    modal.querySelector('#btn-sb-hp-full').onclick = () => {
      if (!ensureSandboxMatchReady()) return;
      gameState.player.leader.hp = 6;
      gameState.ai.leader.hp = 6;
      setLog('🧪 [ห้องทดลอง] ฟื้นฟู HP ลีดเดอร์ทั้งสองฝั่งเป็น 6/6 เรียบร้อย!');
      renderGame();
      closeSandboxModal();
    };

    modal.querySelector('#btn-sb-fill-dark').onclick = () => {
      if (!ensureSandboxMatchReady()) return;
      const p = gameState.player;
      p.darkDimension = [
        makeSandboxCard('DMS03'),
        ...Array.from({ length: 14 }, () => makeSandboxCard('DMS01'))
      ];
      setLog('🧪 [ห้องทดลอง] เติมการ์ดในมิติมืดของเราเป็น 15 ใบ (พร้อมดินแดนปีศาจ) เรียบร้อย!');
      renderGame();
      closeSandboxModal();
    };

    return modal;
  }

  function openSandboxModal(autoRunDiag = false) {
    if (!isAdminUnlocked()) return;
    const modal = ensureSandboxModal();
    syncDummyAIButtonUI();
    renderSandboxCardDetails();
    modal.style.display = 'flex';
    if (autoRunDiag) {
      runAllCardDiagnostics();
    }
  }

  function closeSandboxModal() {
    const modal = document.getElementById('bof-sandbox-modal');
    if (modal) modal.style.display = 'none';
  }

  function verifyAdminPasscode(rawInput) {
    const val = String(rawInput || '').trim().toLowerCase();
    return ADMIN_PASSCODES.includes(val);
  }

  function bindAdminAndSandboxEvents() {
    syncAdminSandboxVisibility();

    const openAuthBox = () => {
      if (isAdminUnlocked()) return;
      const authBox = document.getElementById('lobby-admin-auth-box');
      const passInput = document.getElementById('input-admin-passcode');
      if (authBox) {
        authBox.style.display = 'block';
        if (passInput) setTimeout(() => passInput.focus(), 50);
      }
    };

    const showAuthBtn = document.getElementById('btn-show-admin-passcode');
    if (showAuthBtn && !showAuthBtn._bofBound) {
      showAuthBtn._bofBound = true;
      showAuthBtn.addEventListener('click', (e) => {
        e.preventDefault();
        openAuthBox();
      });
    }

    // ทริกเกอร์เสริม: แตะหัวข้อ "ตั้งค่า" ในหน้าต่างตั้งค่าเพื่อเปิดช่องกรอกรหัสแอดมินได้เช่นกัน
    const settingsTitleEl = document.getElementById('lb-settings-title');
    if (settingsTitleEl && !settingsTitleEl._bofBound) {
      settingsTitleEl._bofBound = true;
      settingsTitleEl.addEventListener('click', () => {
        openAuthBox();
      });
    }

    // คีย์ลัดสำหรับแอดมินบน PC: กด Ctrl + Shift + D
    if (!window._bofAdminKeyBound) {
      window._bofAdminKeyBound = true;
      document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.shiftKey && (e.key === 'D' || e.key === 'd')) {
          e.preventDefault();
          if (isAdminUnlocked()) {
            openSandboxModal(false);
            return;
          }
          const entered = window.prompt('🔐 กรอกรหัสผ่านแอดมินเพื่อเปิดระบบทดสอบสกิลการ์ด:');
          if (entered !== null && verifyAdminPasscode(entered)) {
            setAdminUnlocked(true);
            openSandboxModal(false);
          } else if (entered !== null) {
            alert('❌ รหัสแอดมินไม่ถูกต้อง');
          }
        }
      });
    }

    const verifyBtn = document.getElementById('btn-verify-admin-passcode');
    const passInput = document.getElementById('input-admin-passcode');
    const feedbackEl = document.getElementById('admin-passcode-feedback');

    const handleVerifyClick = () => {
      const val = passInput ? passInput.value : '';
      if (verifyAdminPasscode(val)) {
        if (passInput) passInput.value = '';
        if (feedbackEl) feedbackEl.style.display = 'none';
        setAdminUnlocked(true);
      } else if (feedbackEl) {
        feedbackEl.textContent = '❌ รหัสแอดมินไม่ถูกต้อง';
        feedbackEl.style.display = 'block';
      }
    };

    if (verifyBtn && !verifyBtn._bofBound) {
      verifyBtn._bofBound = true;
      verifyBtn.addEventListener('click', handleVerifyClick);
    }
    if (passInput && !passInput._bofBound) {
      passInput._bofBound = true;
      passInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleVerifyClick();
        }
      });
    }

    const lockBtn = document.getElementById('btn-lobby-lock-admin');
    if (lockBtn && !lockBtn._bofBound) {
      lockBtn._bofBound = true;
      lockBtn.addEventListener('click', () => {
        setAdminUnlocked(false);
      });
    }

    const lobbyOpenBtn = document.getElementById('btn-lobby-open-sandbox');
    if (lobbyOpenBtn && !lobbyOpenBtn._bofBound) {
      lobbyOpenBtn._bofBound = true;
      lobbyOpenBtn.addEventListener('click', () => {
        if (!isAdminUnlocked()) return;
        dummyAIEnabled = true;
        ensureSandboxMatchReady();
        renderGame();
        openSandboxModal(false);
      });
    }
    const lobbyDiagBtn = document.getElementById('btn-lobby-run-diagnostics');
    if (lobbyDiagBtn && !lobbyDiagBtn._bofBound) {
      lobbyDiagBtn._bofBound = true;
      lobbyDiagBtn.addEventListener('click', () => {
        if (!isAdminUnlocked()) return;
        const settingsDialog = document.getElementById('lb-settings-dialog');
        if (settingsDialog && typeof settingsDialog.close === 'function' && settingsDialog.open) {
          settingsDialog.close();
        }
        openSandboxModal(true);
      });
    }
  }

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', bindAdminAndSandboxEvents);
    } else {
      bindAdminAndSandboxEvents();
    }
  }

  window.BOFSandbox = {
    openModal: openSandboxModal,
    closeModal: closeSandboxModal,
    setupScenarioForCard,
    spawnCardToZone,
    runAllCardDiagnostics,
    forceAIAttackPlayer,
    resetQuotasAndSkills,
    isAdminUnlocked,
    setAdminUnlocked,
    isDummyAIEnabled: () => (isAdminUnlocked() && dummyAIEnabled) || (window.BOFTutorial && window.BOFTutorial.wantsDummyAI()),
    setDummyAIEnabled: (val) => {
      dummyAIEnabled = !!val;
      syncDummyAIButtonUI();
    }
  };
})();

/* ============================================================================
   หมวดที่ 13: ระบบสอนการเล่นแบบจับมือทำ (HAND-HOLDING TUTORIAL) & ซ้อมคอมโบทั้ง 6 เด็ค
   ============================================================================ */
(function initBOFTutorialAndComboGuide() {
  const DECK_COMBO_GUIDES = [
    {
      leaderId: 'L01',
      deckName: '⚡ เด็คจิต (มายฮีโร่ เดจิต)',
      overview: 'จุดเด่น: บุกทะลวงด้วยยูนิตเผ่าฮีโร่ ทำลายแผงหน้าของคู่แข่งพร้อมเร่งพลังโจมตีปิดเกม และมีไพ่ตายพลิกกระดานเมื่อเลือดเหลือ ≤ 2 HP',
      combos: [
        {
          id: 'jit_duo',
          title: '💥 คอมโบ 1: คู่หูฮีโร่ (โทโดโรจิตเก็บการ์ด + บาคุจิตระเบิดสนาม)',
          cards: ['M02', 'M01'],
          steps: [
            '1. คลิกที่ "โทโดโรจิต (M02)" บนสนาม → เลือกหัวข้อที่ 2 เพื่อนำ "บาคุจิต (M01)" จากนรกกลับขึ้นมือฟรี!',
            '2. อัญเชิญ "บาคุจิต (M01)" จากมือลงสนาม → เลือกทำลายมอนสเตอร์ของอีกฝ่าย 1 ใบทันที และบาคุจิตจะได้พลังโจมตี +1 (กลายเป็น Power 3) เพราะมีโทโดโรจิตอยู่คู่กัน!'
          ]
        },
        {
          id: 'jit_ende',
          title: '🦅 คอมโบ 2: ฮออ์กส์ฟีมเรียกเอ็นเดจิต + เร่งพลังคู่!',
          cards: ['M06', 'M05', 'L01'],
          steps: [
            '1. คลิกที่ "ฮออ์กส์ฟีม (M06)" บนสนาม → กดใช้สกิลลดพลังตัวเอง -2 เพื่อค้นหา "เอ็นเดจิต (M05)" จากกองการ์ดหรือนรกขึ้นมือ',
            '2. อัญเชิญ "เอ็นเดจิต (M05)" ลงสนาม แล้วคลิกที่เอ็นเดจิตเพื่อกดใช้สกิล → เอ็นเดจิตได้พลัง +2 (เป็น Power 4) และฮออ์กส์ฟีมได้พลัง +2 คืนกลับมาทันที!',
            '3. คลิกที่การ์ด Leader "มายฮีโร่ เดจิต (L01)" ของเราเพื่อบัฟพลังให้ยูนิตบนสนามเพิ่มอีก +1!'
          ]
        },
        {
          id: 'jit_allforjit',
          title: '👑 คอมโบ 3: ป้อมปราการพลิกนรก (ออลจิต & ออลฟอจิต)',
          cards: ['M03', 'M04'],
          steps: [
            '1. เมื่อเลือด Leader เราเหลือ ≤ 2 HP โดยมี "ออลจิต (M03)" บนมือ และ "ออลฟอจิต (M04)" อยู่ในนรก ให้กดปุ่มเปลี่ยนเฟสจนจบเทิร์นเพื่อให้ AI โจมตีเข้ามา',
            '2. ทันทีที่ AI โจมตีใส่ Leader เรา จะมีหน้าต่างให้เลือกปลุก "ออลฟอจิต (M04)" จากนรกลงมาระเบิดล้างมอนสเตอร์ทุกใบบนสนาม หรือส่ง "ออลจิต (M03)" จากมือลงมารับดาเมจแทน!'
          ]
        }
      ]
    },
    {
      leaderId: 'L02',
      deckName: '🌾 เด็คเหนือ (ขุนเหนือ)',
      overview: 'จุดเด่น: ดึง "ไพร่ชาวนาเหนือ" ขึ้นมือทุกเทิร์น ส่งสายลับไปยึดช่องสนามอีกฝ่าย และอัญเชิญ "จุติ" เรียกกองทัพทหารลงสนามรัวๆ',
      combos: [
        {
          id: 'nuea_spy',
          title: '🕵️ คอมโบ 1: ส่งสายลับยึดช่องสนาม + หมอไพร่เหนือวนการ์ด',
          cards: ['NM01', 'NM05', 'NS01'],
          steps: [
            '1. คลิกที่ "ไพร่ชาวนาเหนือ (NM01)" บนมือ → เลือกหัวข้อที่ 1 (ทิ้งตัวเองลงนรก) เพื่อส่ง "สายลับไพร่เหนือ (NM05)" จากกอง/นรกไปยึดช่องว่างบนสนามอีกฝ่าย!',
            '2. ร่ายเวท "หมอไพร่เหนือ (NS01)" จากบนมือ → เลือกเก็บ "ไพร่ชาวนาเหนือ (NM01)" จากนรกกลับขึ้นมือ',
            '3. คลิกที่ "ไพร่ชาวนาเหนือ (NM01)" บนมืออีกครั้ง → เลือกหัวข้อที่ 2 เพื่อค้นหาการ์ด "ทหาร" จากกองขึ้นมือฟรี!'
          ]
        },
        {
          id: 'nuea_juti',
          title: '🔥 คอมโบ 2: อัญเชิญจุติ ทหารหลวงเหนือ เรียกพรรคพวกครบ 3 ช่อง!',
          cards: ['NM04', 'NM01', 'NM02'],
          steps: [
            '1. อัญเชิญ "ทหารเกณฑ์เหนือ (NM04)" จากมือลงสนาม (ได้รับพลัง +1 เมื่อลงสนาม)',
            '2. คลิกที่ "ทหารหลวงเหนือ (NM02)" บนมือ → เลือก "สั่งใช้จากบนมือ (อัญเชิญจุติ)" โดยทิ้งไพร่ชาวนาเหนือ 1 ใบ แล้วคลิกวางลงช่องว่างบนสนามเรา',
            '3. เพราะมีทหารเกณฑ์เหนืออยู่บนสนาม สกิลจุติของทหารหลวงจะทำงานต่อทันที → เลือกอัญเชิญการ์ด "ทหาร" จากกอง/นรกลงช่องที่ 3 ฟรี (ครบ 3 ใบรับออร่าขุนเหนือ +1 ยกแผง)!'
          ]
        },
        {
          id: 'nuea_army',
          title: '💣 คอมโบ 3: กองทัพ 3 ทหาร + ระเบิดปูพรม ครบ 3 เอฟเฟกต์!',
          cards: ['NM04', 'NM03', 'NM02', 'NS03'],
          steps: [
            '1. บนสนามมี ทหารเกณฑ์ (NM04) และ ทหารพราน (NM03) อยู่แล้ว ให้อัญเชิญ "ทหารหลวงเหนือ (NM02)" ลงช่องที่ 3 เพื่อรวมครบ 3 ทหาร!',
            '2. คลิกที่ "ทหารพรานเหนือ (NM03)" บนสนามเพื่อกดใช้สกิล → คลิกเลือกบัฟพลังให้ยูนิตเรา +1 หรือลดพลังยูนิตศัตรู -1',
            '3. ร่ายเวท "ระเบิดปูพรม (NS03)" บนมือ → แสดงผลครบทั้ง 3 ขั้น: ยูนิตเหนือทุกใบพลัง +1 + ทำลายยูนิตอีกฝ่าย 1 ใบ + ยูนิตเราทุกใบไม่ถูกทำลายจนเริ่มเทิร์นถัดไป!'
          ]
        }
      ]
    },
    {
      leaderId: 'L03',
      deckName: '⏳ เด็ควันสิ้นโลก',
      overview: 'จุดเด่น: ชุบยูนิตพลัง ≤ 2 จากนรกทุกต้นเทิร์น ประสานพลังคู่หู "โอนามิ + โรเซเลีย" เปิดท็อปโซเนบุบังคับจบเทิร์น และวิวัฒน์ร่าง "อนาคต"!',
      combos: [
        {
          id: 'doom_maya_lock',
          title: '🔮 คอมโบ 1: คู่หูโอนามิทิ้งซึรุรุ + มายอาเปิดท็อปโซเนบุบังคับจบเทิร์น!',
          cards: ['DM01', 'DM05', 'DM02', 'DM03'],
          steps: [
            '1. คลิกที่ "โอนามิ ผู้ทำลายโลก (DM01)" บนสนาม → กดใช้สกิลโดยคลิกทิ้ง "ซึรุรุ (DM05)" บนมือ (สกิลซึรุรุจะบังคับอีกฝ่ายทิ้งมือ 1 ใบทันที!) แล้วเลือกอัญเชิญ "โรเซเลีย (DM02)" ลงสนาม',
            '2. คลิกที่ "โรเซเลีย (DM02)" บนสนาม → กดใช้สกิลคู่หู (Rest โรเซเลียเพื่อจั่วการ์ดฟรี 1 ใบ)!',
            '3. กดเปลี่ยนเฟสจนจบเทิร์น เมื่อ AI โจมตีมา ให้เลือกเปิดใช้สกิล 1 เกมของ "มายอา (DM03)" เพื่อเปิดท็อปกองเจอ "โซเนบุ (DM06)" และบังคับจบเทิร์นของ AI ทันที!'
          ]
        },
        {
          id: 'doom_future',
          title: '🌌 คอมโบ 2: วิวัฒน์ร่างอนาคต & ดึงร่างต้นกลับเมื่อจบเทิร์น',
          cards: ['DM07', 'DM13', 'DM04', 'DM10'],
          steps: [
            '1. คลิกที่การ์ดอนาคต "ยอดนักดาบ แอชชี่ล่า (DM13)" บนมือ → เลือกอัญเชิญร่างอนาคต แล้วคลิกที่ร่างต้น "แอชชี่ล่า (DM07)" บนสนามเพื่อส่งไปมิติมืดและลดพลังศัตรูทุกใบ -1!',
            '2. กดปุ่มเปลี่ยนเฟสไปสู่ Battle Phase แล้วกดจบเทิร์น → ร่างอนาคตจะลงนรกและดึงร่างต้น "แอชชี่ล่า (DM07)" จากมิติมืดกลับลงสนามในสถานะ Stand อัตโนมัติ!'
          ]
        },
        {
          id: 'doom_emi',
          title: '⚡ คอมโบ 3: เอมิ + เดบิรุน ทิ้งมือ 3 ใบลุกขึ้น Stand ตีเบิ้ล!',
          cards: ['DS01', 'DM04', 'DM08'],
          steps: [
            '1. ร่ายเวท "เบิกเนตรแห่งแสง (DS01)" จากบนมือ (เมื่อมีนรก ≥ 5 ใบจะได้จั่ว 2 ใบ!) แล้วคลิกเลือกบัฟพลังให้ "เอมิ (DM08)" บนสนาม +1',
            '2. กดปุ่มเข้าสู่ Battle Phase แล้วสั่ง "เอมิ (DM08)" โจมตีใส่ Leader ของอีกฝ่าย 1 ครั้ง',
            '3. คลิกที่ "เอมิ (DM08)" ที่กำลังนอน Rest อยู่บนสนาม → กดยืนยันทิ้งการ์ดบนมือ 3 ใบเพื่อลุกขึ้น Stand แล้วสั่งโจมตีซ้ำอีกครั้ง!'
          ]
        }
      ]
    },
    {
      leaderId: 'L04',
      deckName: '🦖 เด็คไดโน (ศูนย์วิจัยไดโน)',
      overview: 'จุดเด่น: โม่การ์ดลงนรกเพื่อเร่งพลังให้สไปโนซอรัส และส่ง "ทีเร็กซ์ + เวโลซิแรปเตอร์" ไปมิติมืดเพื่อผสานร่าง "ไฮบริดไดโน" ตีเบิ้ล!',
      combos: [
        {
          id: 'dino_mill',
          title: '🦴 คอมโบ 1: พเทอราโนดอนโม่กองเร่งพลังสไปโนซอรัส + แรปเตอร์บัฟ +2',
          cards: ['DN04', 'L04', 'DN05', 'DN02'],
          steps: [
            '1. คลิกที่ "พเทอราโนดอน (DN04)" บนสนาม → กดใช้สกิลโม่การ์ด 2 ใบลงนรกแล้วจั่ว 1 ใบ (ทำให้การ์ดในนรกเพิ่มและ "สไปโนซอรัส (DN05)" ได้พลังโจมตีเพิ่มขึ้นทันที!)',
            '2. คลิกที่การ์ด Leader "ศูนย์วิจัยไดโน (L04)" ของเรา → เลือกเก็บการ์ดไดโนจากนรกกลับขึ้นมือ 1 ใบฟรี!',
            '3. คลิกที่ "เวโลซิแรปเตอร์ (DN02)" บนสนามเพื่อ Rest ตัวเอง แล้วคลิกเลือกบัฟพลังให้ "สไปโนซอรัส (DN05)" +2 จนจบเทิร์น!'
          ]
        },
        {
          id: 'dino_hybrid',
          title: '🦖 คอมโบ 2: ผสานร่างไฮบริด "อินโดมินัสเร็กซ์" ตีตายแล้วลุกขึ้นตีซ้ำ!',
          cards: ['DN01', 'DN02', 'DN06'],
          steps: [
            '1. คลิกที่ "ไฮบริด — อินโดมินัสเร็กซ์ (DN06)" บนมือ (ขอบเรืองแสงสีเขียว) → กดยืนยันส่งวัตถุดิบ "ทีเร็กซ์ (DN01)" และ "เวโลซิแรปเตอร์ (DN02)" ไปมิติมืดเพื่ออัญเชิญลงสนาม!',
            '2. กดปุ่มเข้าสู่ Battle Phase แล้วสั่ง "อินโดมินัสเร็กซ์ (DN06)" โจมตีทำลายมอนสเตอร์บนสนามของอีกฝ่าย',
            '3. เมื่อทำลายมอนสเตอร์สำเร็จ อินโดมินัสเร็กซ์จะลุกขึ้น Stand อัตโนมัติ → สั่งโจมตีซ้ำใส่ Leader อีกฝ่ายเพื่อปิดเกมได้เลย!'
          ]
        }
      ]
    },
    {
      leaderId: 'L05',
      deckName: '😈 เด็คปีศาจ',
      overview: 'จุดเด่น: เปิดเกมด้วย "ดินแดนปีศาจ" ในมิติมืด ใช้ "สัญญาปีศาจ" บัฟพลังปีศาจทุกตัว +1 และสะสมมิติมืดครบ 15 ใบเพื่อชนะเกมทันที!',
      combos: [
        {
          id: 'demon_dark_engine',
          title: '🌌 คอมโบ 1: แอสโมดิวส์ส่งสัญญาปีศาจเข้ามิติมืด + เบลเฟกอร์ดูดกองชนะเกม!',
          cards: ['DMM05', 'DMS01', 'DMM07', 'DMS03'],
          steps: [
            '1. อัญเชิญ "แอสโมดิวส์ บาปราคะ (DMM05)" จากมือลงสนาม → สกิลเปิดท็อป 3 ใบจะทำงาน ให้เลือก "สัญญาปีศาจ (DMS01)" เพื่อส่งเข้ามิติมืดทันที (ปีศาจทุกตัวบนสนามพลัง +1 ถาวร)!',
            '2. กดปุ่มเข้าสู่ Battle Phase แล้วสั่ง "เบลเฟกอร์ บาปเกียจคร้าน (DMM07)" โจมตีใส่ Leader อีกฝ่าย → สกิลออโต้ของเบลเฟกอร์จะดูดการ์ดใบบนสุดของทั้ง 2 ฝั่งเข้ามิติมืด จนครบ 15 ใบและชนะเกมด้วย "ดินแดนปีศาจ (DMS03)" ทันที!'
          ]
        },
        {
          id: 'demon_satan_win',
          title: '🔥 คอมโบ 2: ซาตาน บาปโทสะ ระเบิดสนามล้างบาง & ทำลายมือคู่แข่ง!',
          cards: ['DMM04', 'DMM06'],
          steps: [
            '1. เมื่อ Leader เราเหลือ 1 HP และมีการ์ดบนมือครบ 5 ใบ ให้คลิกที่ "ซาตาน บาปโทสะ (DMM04)" บนสนาม → กดใช้สกิล [1 เกม] ทิ้งมือ 5 ใบเพื่อทำลายการ์ดใบอื่นบนสนามทั้งหมด และบังคับอีกฝ่ายทิ้งมือ 3 ใบ!',
            '2. กดปุ่มเข้าสู่ Battle Phase แล้วสั่ง "ซาตาน บาปโทสะ (DMM04)" โจมตีใส่ Leader อีกฝ่ายเพื่อคว้าชัยชนะ!'
          ]
        }
      ]
    },
    {
      leaderId: 'L06',
      deckName: '🤪 เด็คโอ๊ต (ไอโอ๊ตบ้าทุกสิ่ง)',
      overview: 'จุดเด่น: จัดเรียงการ์ดใบบนสุดของกองทุกเทิร์น ใช้ "ไอแบงค์บ้าเกม" เปิดท็อปกองคอลพรรคพวกลงสนามพร้อมเกราะอมตะ และรวมแก๊ง 3 ช่าปลดล็อกคอมโบ "ไออาร์มบ้าการ์ดเกม"!',
      combos: [
        {
          id: 'oat_topdeck_bank',
          title: '🎮 คอมโบ 1: เรียงท็อปกอง + ไอแบงค์บ้าเกม เปิดคอลไอโอ๊ตติดเกราะอมตะ!',
          cards: ['L06', 'OM02', 'OM01'],
          steps: [
            '1. เมื่อเริ่มเทิร์น สกิลออโต้ของ "ไอโอ๊ตบ้าทุกสิ่ง (L06)" จะเปิดการ์ด 2 ใบบนสุดของกอง → กดเลือกหยิบเวทมนตร์ขึ้นมือ แล้วเลือก "วางไว้บนสุดของกองการ์ด" เพื่อให้ "ไอโอ๊ตบ้าการ์ตูน (OM01)" อยู่ใบบนสุด!',
            '2. อัญเชิญ "ไอแบงค์บ้าเกม (OM02)" จากมือลงสนาม → เลือกคอล "ไอโอ๊ตบ้าการ์ตูน (OM01)" ลงสนามฟรี พร้อมรับพลังโจมตี +2 และเกราะอมตะไม่ถูกทำลายเทิร์นละ 1 ครั้ง!'
          ]
        },
        {
          id: 'oat_arm_triple',
          title: '🃏 คอมโบ 2: โอ๊ต + จิต ปลดล็อกไออาร์ม แล้วไอจิตลดพลังศัตรูทั้งแผง!',
          cards: ['OM01', 'OM03', 'OM04', 'OM03'],
          steps: [
            '1. บนสนามมี โอ๊ต (OM01) + จิต (OM03) และเว้นช่องว่างไว้ 1 ช่อง → ลง "ไออาร์มบ้าการ์ดเกม (OM04)" ในช่องว่าง (ถ้าวางทับใบไหน ใบนั้นจะหายก่อนเช็กเงื่อนไข สนาม 3 ช่องจึงปลดได้ 2 ใน 3 ผล)',
            '2. ผล 1 (มีไอโอ๊ต): เลือกเก็บการ์ดจากนรกขึ้นมือ 1 ใบ · ผล 3 (มีไอจิต): ศัตรูทุกใบพลัง -1 และสกิลไอจิตบ้ากามอัปเกรดเป็นลดพลังทุกใบ',
            '3. ลง "ไอจิตบ้ากาม (OM03)" ใบที่ 2 วางทับใบเดิม → สกิลที่อัปเกรดแล้วลดพลังศัตรูทุกใบอีก -1!'
          ]
        },
        {
          id: 'oat_nuea_clip',
          title: '📹 คอมโบ 3: ไอเหนือผู้มีคลิปแปลก ค้นหาเวท & ร่ายเวทเบิ้ล 2 ใบในเทิร์นเดียว!',
          cards: ['OM05', 'OS02', 'OS01'],
          steps: [
            '1. อัญเชิญ "ไอเหนือผู้มีคลิปแปลก (OM05)" จากมือลงสนาม → ดูการ์ด 3 ใบบนสุดของกองและเลือกหยิบการ์ดเวทมนตร์ขึ้นมือ 1 ใบฟรี!',
            '2. คลิกที่ "ไอเหนือผู้มีคลิปแปลก (OM05)" บนสนามเพื่อกดใช้สกิล → คลิกเลือกการ์ดเวท "สงครามความบ้า (OS02)" บนมือเพื่อร่ายฟรีโดยไม่เสียโควต้า Normal Spell (ดึงโอ๊ต+แบงค์ขึ้นมือ)!',
            '3. เนื่องจากโควต้า Normal Spell ยังเหลือ 0/1 ให้คลิกร่ายเวท "ท่าไม้ตาย(มั้ง) (OS01)" จากบนมือต่อได้อีกใบ (ทิ้งมือ 3 ใบ ทำลายมอนสเตอร์อีกฝ่ายทั้งหมด)!'
          ]
        }
      ]
    }
  ];

  let selectedComboLeaderId = 'L01';

  // สถานะของระบบจับมือสอน (Guided Session)
  let guidedSession = null; // { mode: 'tutorial'|'combo', id: string, title: string, stepIndex: number, steps: Array }

  let makeCardSeq = 0;
  function makeCard(cid) {
    const tpl = CARD_DATABASE.find(c => c.id === cid);
    // uid ต้องไม่ซ้ำ (ไฮบริด/ซาตาน/แอสโมดิวส์ ฯลฯ หาการ์ดด้วย uid) · ไม่มี "_" = เจ้าของตามโซนที่อยู่
    return tpl ? createCardInstance(tpl, `TUT-${cid}-${++makeCardSeq}`) : null;
  }

  function clearGuidedHighlights() {
    document.querySelectorAll('.bof-guided-highlight').forEach(el => {
      el.classList.remove('bof-guided-highlight');
    });
    document.querySelectorAll('.bof-guided-pointer-badge').forEach(el => {
      el.remove();
    });
  }

  // ไอคอนนิ้วแตะ (เส้นแบบ lucide "pointer") ใช้ชี้การ์ด/ช่อง/Leader แทนป้ายข้อความที่บังรูปการ์ด
  const GUIDE_TAP_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M22 14a8 8 0 0 1-8 8"/><path d="M18 11v-1a2 2 0 0 0-4 0"/><path d="M14 10V9a2 2 0 0 0-4 0v1"/><path d="M10 9.5V4a2 2 0 0 0-4 0v10"/><path d="M18 11a2 2 0 1 1 4 0v3a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/></svg>';

  function attachGuidedPointer(targetEl, labelText, placeInside = false) {
    if (!targetEl) return;
    targetEl.classList.add('bof-guided-highlight');
    const badge = document.createElement('div');
    badge.className = 'bof-guided-pointer-badge';
    if (targetEl.tagName === 'BUTTON') {
      // ปุ่ม: ป้ายข้อความ · 'chip' = เกาะขอบบนขวาของปุ่มตัวเลือก ไม่ทับข้อความปุ่ม
      badge.textContent = labelText || '👆 กดตรงนี้!';
      if (placeInside === 'chip') badge.classList.add('is-chip');
    } else {
      // การ์ด/ช่อง/Leader: ไอคอนนิ้วแตะ + วงคลื่น (คำอธิบายเต็มอยู่ในแถบโค้ช) · inside = การ์ดบนมือที่ขอบบนถูกตัด
      badge.classList.add('is-icon');
      if (placeInside) badge.classList.add('is-inside');
      badge.setAttribute('role', 'img');
      badge.setAttribute('aria-label', labelText || 'กดตรงนี้');
      badge.innerHTML = GUIDE_TAP_ICON;
    }
    targetEl.appendChild(badge);
    // แจ้ง js/tutorial-coach.js ให้หลบเป้าทันที (ไม่ต้องรอรอบตรวจ)
    document.dispatchEvent(new CustomEvent('bof:guide-target'));
  }

  // หาปุ่มในหน้าต่างตัวเลือกที่ต้องกด: เทียบคำสำคัญตามลำดับ ถ้าไม่เจอให้เลือกปุ่มแรกที่ไม่ใช่ "ยกเลิก/ไม่ใช้/ดูรายละเอียด"
  function findGuidedChoiceButton(step) {
    const btns = Array.from(document.querySelectorAll('#custom-choice-modal #choice-modal-buttons button'))
      .filter(b => !b.disabled);
    if (btns.length === 0) return null;
    if (step && typeof step.choiceOptionIndex === 'number' && btns[step.choiceOptionIndex]) {
      return btns[step.choiceOptionIndex];
    }
    const keywords = (step && Array.isArray(step.choiceKeywords)) ? step.choiceKeywords : [];
    for (const kw of keywords) {
      const hit = btns.find(b => (b.textContent || '').includes(kw));
      if (hit) return hit;
    }
    const isSkipLabel = (t) => t.includes('❌') || t.includes('🔍') || t.trim().startsWith('ไม่');
    return btns.find(b => !isSkipLabel(b.textContent || '')) || btns[0];
  }

  function getHandCardElementByCardId(cardId) {
    if (!gameState.player || !Array.isArray(gameState.player.hand)) return null;
    const handCards = document.querySelectorAll('#player-hand .card');
    for (let i = 0; i < gameState.player.hand.length; i++) {
      const c = gameState.player.hand[i];
      if (c && (!cardId || c.id === cardId) && handCards[i]) {
        return handCards[i];
      }
    }
    return null;
  }

  function getBoardSlotElement(isPlayerBoard, predicateOrSlotIdx) {
    const boardId = isPlayerBoard ? 'player-board' : 'ai-board';
    const slots = document.querySelectorAll(`#${boardId} .slot`);
    const contestant = isPlayerBoard ? gameState.player : gameState.ai;
    if (!contestant || !slots.length) return null;

    if (typeof predicateOrSlotIdx === 'number') {
      return slots[predicateOrSlotIdx] || null;
    }
    for (let i = 0; i < 3; i++) {
      if (predicateOrSlotIdx(contestant.board[i], i) && slots[i]) {
        return slots[i];
      }
    }
    return null;
  }

  function updateGuidedVisualPointer() {
    clearGuidedHighlights();
    if (!guidedSession || !gameState.player || gameState.gameOver) return;

    const step = guidedSession.steps[guidedSession.stepIndex];
    if (!step) return;

    // 1. หากหน้าต่าง Choice Modal เปิดอยู่ ให้ชี้ไปที่ปุ่มตัวเลือกที่ต้องกดทันที
    if (isChoiceModalOpen()) {
      const targetBtn = findGuidedChoiceButton(step);
      if (targetBtn) {
        // ปุ่มที่ choice-ui แปลงเป็นรูปการ์ดถูกซ่อน: ชี้ที่รูปการ์ดแทน
        attachGuidedPointer(targetBtn._umItem || targetBtn, step.choicePointerText || '👆 คลิกเลือกหัวข้อนี้!', targetBtn._umItem ? true : 'chip');
      }
      return;
    }

    // 2. หากหน้าต่าง Intercept Modal เปิดอยู่
    const interceptModal = document.getElementById('intercept-modal');
    if (interceptModal && interceptModal.style.display !== 'none') {
      const firstCard = interceptModal.querySelector('#intercept-card-list .card');
      if (firstCard) {
        attachGuidedPointer(firstCard, '👆 คลิกเลือกยูนิตใบนี้เพื่อบัง!');
      }
      return;
    }

    // 3. หากระบบกำลังรอให้ผู้เล่นคลิกเลือกเป้าหมาย (pendingAction)
    if (gameState.pendingAction) {
      const pa = gameState.pendingAction;
      if (pa.targetZone === 'PLAYER_HAND') {
        const handCards = document.querySelectorAll('#player-hand .card');
        let targetEl = null;
        if (step.pendingHandCardId) {
          const idx = gameState.player.hand.findIndex(c => c && c.id === step.pendingHandCardId && c.uid !== pa.excludeHandUid);
          if (idx !== -1 && handCards[idx]) targetEl = handCards[idx];
        }
        if (!targetEl) {
          const idx = gameState.player.hand.findIndex(c => c && c.uid !== pa.excludeHandUid);
          if (idx !== -1 && handCards[idx]) targetEl = handCards[idx];
        }
        attachGuidedPointer(targetEl, step.pendingPointerText || '👆 คลิกเลือกการ์ดใบนี้บนมือ!', true);
        return;
      }
      if (pa.targetZone === 'PLAYER_BOARD' || pa.targetZone === 'ANY_BOARD') {
        const slotEl = getBoardSlotElement(true, (m) => {
          if (!m) return false;
          if (step.pendingBoardCardId && m.id !== step.pendingBoardCardId) return false;
          if (pa.filterTribe && !hasCardTribe(m, pa.filterTribe)) return false;
          if (pa.filterName && !hasCardName(m, pa.filterName)) return false;
          return true;
        }) || getBoardSlotElement(true, (m) => m !== null);
        attachGuidedPointer(slotEl, step.pendingPointerText || '👆 คลิกเลือกยูนิตใบนี้บนสนาม!');
        return;
      }
      if (pa.targetZone === 'OPPONENT_BOARD') {
        const slotEl = getBoardSlotElement(false, (m) => m !== null && m.id !== 'NM05') || getBoardSlotElement(false, (m) => m !== null);
        attachGuidedPointer(slotEl, step.pendingPointerText || '👆 คลิกเลือกเป้าหมายของอีกฝ่ายใบนี้!');
        return;
      }
      if (pa.type === 'JUTI_SELECT_SLOT' || pa.type === 'CALL_FROM_EFFECT_SELECT_SLOT') {
        const slotEl = getBoardSlotElement(true, (m) => m === null) || getBoardSlotElement(true, 0);
        attachGuidedPointer(slotEl, '👆 คลิกวางลงช่องว่างตรงนี้!');
        return;
      }
      return;
    }

    // ระหว่างเทิร์นของ AI ไม่ต้องชี้อะไร (รอให้ AI โจมตีเข้ามาแล้วค่อยชี้ปุ่มในหน้าต่างตอบโต้)
    if (gameState.activeTurn !== 'player') return;

    // 4. ชี้เป้าตามประเภทคำสั่งของสเต็ปปัจจุบัน
    if (step.action === 'SUMMON_HAND' || step.action === 'CLICK_HAND') {
      const selectedCard = (gameState.selectedHandIndex !== null && gameState.player.hand[gameState.selectedHandIndex])
        ? gameState.player.hand[gameState.selectedHandIndex]
        : null;
      if (selectedCard && (!step.cardId || selectedCard.id === step.cardId)) {
        // เลือกการ์ดบนมือแล้ว (ผ่านหน้าต่างยืนยันแล้ว) -> ชี้ช่องบนสนามที่ต้องวาง
        const slotEl = typeof step.targetSlot === 'number'
          ? getBoardSlotElement(true, step.targetSlot)
          : (getBoardSlotElement(true, (m) => m === null) || getBoardSlotElement(true, 0));
        attachGuidedPointer(slotEl, step.slotPointerText || '👆 2. คลิกวางลงช่องนี้บนสนาม!');
      } else {
        const handEl = getHandCardElementByCardId(step.cardId);
        attachGuidedPointer(handEl, step.pointerText || '👆 คลิกเลือกการ์ดใบนี้บนมือ', true);
      }
      return;
    }

    if (step.action === 'CLICK_LEADER') {
      const leaderBox = document.getElementById('player-leader-box');
      attachGuidedPointer(leaderBox, step.pointerText || '👆 คลิกที่ Leader ของเราเพื่อใช้สกิล!');
      return;
    }

    if (step.action === 'CLICK_BOARD_UNIT') {
      const slotEl = getBoardSlotElement(true, (m) => m && (!step.cardId || m.id === step.cardId));
      attachGuidedPointer(slotEl, step.pointerText || '👆 คลิกที่ยูนิตใบนี้บนสนามเพื่อใช้สกิล!');
      return;
    }

    if (step.action === 'NEXT_PHASE') {
      const passBtn = document.getElementById('btn-pass-turn-inline');
      attachGuidedPointer(passBtn, step.pointerText || '👆 กดปุ่มเปลี่ยนเฟสตรงนี้!');
      return;
    }

    if (step.action === 'ATTACK_MONSTER') {
      if (gameState.selectedAttackerSlot === null) {
        const slotEl = getBoardSlotElement(true, (m) => m && m.state === 'Stand' && (!step.cardId || m.id === step.cardId))
          || getBoardSlotElement(true, (m) => m && m.state === 'Stand');
        attachGuidedPointer(slotEl, step.pointerText || '👆 1. คลิกยูนิตที่ตั้งอยู่ (Stand) เพื่อสั่งโจมตี');
      } else {
        const aiSlotEl = getBoardSlotElement(false, (m) => m !== null);
        attachGuidedPointer(aiSlotEl, step.targetPointerText || '👆 2. คลิกโจมตีมอนสเตอร์อีกฝ่ายใบนี้!');
      }
      return;
    }

    if (step.action === 'ATTACK_LEADER') {
      if (gameState.selectedAttackerSlot === null) {
        const slotEl = getBoardSlotElement(true, (m) => m && m.state === 'Stand' && (!step.cardId || m.id === step.cardId))
          || getBoardSlotElement(true, (m) => m && m.state === 'Stand');
        attachGuidedPointer(slotEl, step.pointerText || '👆 1. คลิกยูนิตที่ตั้งอยู่ (Stand) เพื่อสั่งโจมตี');
      } else {
        const aiLeaderBox = document.getElementById('ai-leader-box');
        attachGuidedPointer(aiLeaderBox, step.targetPointerText || '👆 2. คลิกโจมตีที่ Leader ของอีกฝ่าย!');
      }
      return;
    }
  }

  function ensureTutorialCoachBar() {
    let bar = document.getElementById('bof-tutorial-coach-bar');
    if (bar) return bar;
    bar = document.createElement('div');
    bar.id = 'bof-tutorial-coach-bar';
    bar.style.display = 'none';
    document.body.appendChild(bar);
    return bar;
  }

  function hideTutorialCoachBar() {
    clearGuidedHighlights();
    const bar = document.getElementById('bof-tutorial-coach-bar');
    if (bar) bar.style.display = 'none';
  }

  function renderGuidedCoachBar() {
    if (!guidedSession) {
      hideTutorialCoachBar();
      return;
    }
    const bar = ensureTutorialCoachBar();
    const total = guidedSession.steps.length;
    const idx = guidedSession.stepIndex;
    const step = guidedSession.steps[idx];
    const isCompleted = idx >= total;

    const badgeText = isCompleted
      ? `🎉 สำเร็จครบทุกขั้นตอน! (${total}/${total})`
      : `${guidedSession.badgePrefix} • ขั้นที่ ${idx + 1} / ${total}`;
    const titleText = isCompleted
      ? `ยอดเยี่ยมมาก! คุณทำตามขั้นตอน "${guidedSession.title}" สำเร็จครบถ้วนแล้ว!`
      : step.title;
    const descText = isCompleted
      ? (guidedSession.mode === 'combo'
        ? 'ลองเล่นต่อบนกระดานนี้ได้ หรือกด "🔄 เริ่มใหม่" / "📚 คอมโบอื่น" ด้านล่าง'
        : 'ลองเล่นต่อบนกระดานนี้ได้ หรือกด "🔄 เริ่มใหม่" เพื่อฝึกอีกรอบ')
      : step.desc;

    // หัวข้อสั้น: ตัด "สเต็ป 1/3:" / "ขั้นที่ 1:" ออก เพราะป้ายบอกขั้นอยู่แล้ว
    const shortTitle = String(titleText).replace(/^(สเต็ป|ขั้นที่)\s*[\d\s/]+:\s*/, '');
    const pct = Math.round((Math.min(idx, total) / total) * 100);
    bar.classList.toggle('is-complete', isCompleted);
    bar.dataset.step = String(idx);
    bar.innerHTML = `
      <div class="bof-coach-main">
        <div class="bof-coach-head">
          <span class="bof-coach-step-badge">${badgeText}</span>
          <button type="button" class="bof-coach-toggle" aria-label="ย่อ/ขยายคำอธิบาย"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></button>
        </div>
        <div class="bof-coach-prog" aria-hidden="true"><i style="width:${pct}%"></i></div>
        <div class="bof-coach-title">${shortTitle}</div>
        <div class="bof-coach-desc">${descText}</div>
      </div>
      <div class="bof-coach-actions">
        <button type="button" class="btn bof-coach-btn is-restart" id="btn-coach-restart">${COACH_ICONS.restart}<span>เริ่มใหม่</span></button>
        ${guidedSession.mode === 'combo' ? `<button type="button" class="btn bof-coach-btn is-pick" id="btn-coach-pick-combo">${COACH_ICONS.pick}<span>คอมโบอื่น</span></button>` : ''}
        <button type="button" class="btn bof-coach-btn is-exit" id="btn-coach-exit">${COACH_ICONS.exit}<span>ออก</span></button>
      </div>
    `;
    bar.style.display = 'flex';

    bar.querySelector('#btn-coach-restart')?.addEventListener('click', () => {
      if (!guidedSession) return;
      if (guidedSession.mode === 'tutorial') {
        startInteractiveTutorial();
      } else {
        startComboPracticeSession(guidedSession.id);
      }
    });

    // กลับไปหน้าคอมโบ (ล็อบบี้ > วิธีเล่น > แท็บคอมโบ) ที่เด็คเดิม แล้วเลื่อนไปที่คอมโบที่เพิ่งซ้อม
    bar.querySelector('#btn-coach-pick-combo')?.addEventListener('click', () => {
      const comboId = guidedSession && guidedSession.id;
      const deck = DECK_COMBO_GUIDES.find(d => d.combos.some(c => c.id === comboId));
      guidedSession = null;
      hideTutorialCoachBar();
      returnToLobbyScreen();
      if (deck) selectedComboLeaderId = deck.leaderId;
      const howtoDlg = document.getElementById('lb-howto-dialog');
      if (!howtoDlg) return;
      const comboTab = howtoDlg.querySelector('[data-howto-tab="combos"]');
      if (comboTab) comboTab.click(); // วาดแท็บคอมโบใหม่ตามเด็คที่เลือก
      if (!howtoDlg.open) {
        if (typeof howtoDlg.showModal === 'function') howtoDlg.showModal();
        else howtoDlg.setAttribute('open', '');
      }
      if (window.BOFHowto && typeof window.BOFHowto.focusCombo === 'function') window.BOFHowto.focusCombo(comboId);
    });

    bar.querySelector('#btn-coach-exit')?.addEventListener('click', () => {
      guidedSession = null;
      hideTutorialCoachBar();
      returnToLobbyScreen();
    });
  }

  // ไอคอนปุ่มแถบโค้ช (วาดเอง เส้นทอง) · แต่ละส่วนมี class ให้ css ขยับตอนชี้/กด
  const COACH_ICONS = {
    restart: '<svg class="bof-ci" viewBox="0 0 24 24" aria-hidden="true"><g class="ci-spin"><path d="M20 12a8 8 0 1 1-2.34-5.66"/><path d="M20 4v5h-5"/></g><circle class="ci-dot" cx="12" cy="12" r="1.6"/></svg>',
    pick: '<svg class="bof-ci" viewBox="0 0 24 24" aria-hidden="true"><g class="ci-card ci-back"><rect x="3" y="6" width="10" height="14" rx="2" transform="rotate(-14 8 13)"/></g><g class="ci-card ci-front"><rect x="10" y="4" width="10" height="14" rx="2" transform="rotate(8 15 11)"/><path class="ci-star" d="M15 7.6l1 2.1 2.3.3-1.7 1.6.4 2.3-2-1.1-2 1.1.4-2.3-1.7-1.6 2.3-.3z" transform="rotate(8 15 11)"/></g></svg>',
    exit: '<svg class="bof-ci" viewBox="0 0 24 24" aria-hidden="true"><path d="M10 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4"/><g class="ci-arrow"><path d="M14 8l4 4-4 4"/><path d="M18 12H9"/></g></svg>'
  };

  function checkAndAdvanceGuidedStep() {
    if (!guidedSession || !gameState.player) return;
    if (gameState.pendingAction || isChoiceModalOpen()) {
      updateGuidedVisualPointer();
      return;
    }

    let advanced = false;
    while (guidedSession && guidedSession.stepIndex < guidedSession.steps.length) {
      const step = guidedSession.steps[guidedSession.stepIndex];
      if (typeof step.isDone === 'function' && step.isDone()) {
        if (typeof step.onEnterNext === 'function') {
          step.onEnterNext();
        }
        guidedSession.stepIndex += 1;
        advanced = true;
      } else {
        break;
      }
    }

    if (advanced) {
      renderGuidedCoachBar();
    }
    updateGuidedVisualPointer();
  }

  function preparePracticeArena(playerLeaderId, aiLeaderId = 'L01', useDummyAI = true) {
    const howtoDlg = document.getElementById('lb-howto-dialog');
    if (howtoDlg && howtoDlg.open) howtoDlg.close();

    const lobbyScreen = document.getElementById('lobby-screen');
    const gameBoard = document.querySelector('.game-container');
    const mullModal = document.getElementById('mulligan-modal');
    if (lobbyScreen) lobbyScreen.style.display = 'none';
    if (gameBoard) gameBoard.style.display = 'flex';
    if (mullModal) mullModal.style.display = 'none';
    // ปิดหน้าต่างตัวเลือก/ผลแมตช์ที่ค้างจากรอบก่อน (กด "เริ่มใหม่" ตอนจบคอมโบ)
    const choiceModal = document.getElementById('custom-choice-modal');
    if (choiceModal) choiceModal.style.display = 'none';

    if (window.BOFSandbox && typeof window.BOFSandbox.setDummyAIEnabled === 'function') {
      window.BOFSandbox.setDummyAIEnabled(useDummyAI);
    }

    gameState.turnCount = 2;
    gameState.activeTurn = 'player';
    gameState.phase = 'Main Phase';
    gameState.pendingAction = null;
    gameState.pendingAttack = null;
    gameState.selectedHandIndex = null;
    gameState.selectedAttackerSlot = null;
    gameState.isRollingDice = false;
    gameState.isWaitingForChoice = false;
    gameState.gameOver = false;

    const pDeck = typeof getDefaultDeckForLeader === 'function' ? getDefaultDeckForLeader(playerLeaderId) : DEFAULT_DECK_LIST;
    const aDeck = typeof getDefaultDeckForLeader === 'function' ? getDefaultDeckForLeader(aiLeaderId) : DEFAULT_DECK_LIST;

    gameState.player = createContestant('ผู้ฝึกสอน', true, 'P1', playerLeaderId, pDeck);
    gameState.ai = createContestant('หุ่นฝึกซ้อม AI', false, 'AI', aiLeaderId, aDeck);
    gameState.player.turnsTaken = 2;
    gameState.ai.turnsTaken = 2;
    gameState.player.board = [null, null, null];
    gameState.ai.board = [null, null, null];
    gameState.player.hand = [];
    gameState.ai.hand = [];
    gameState.player.graveyard = [];
    gameState.ai.graveyard = [];
    gameState.player.darkDimension = [];
    gameState.ai.darkDimension = [];

    ensureZoneUIAndViewers();
    setupInGameControlBar();
  }

  // ============================================================================
  // 🎓 1. โหมดจับมือสอนเล่นพื้นฐาน (7 ขั้นตอน ตั้งแต่ลงการ์ดจนตีชนะ)
  // ============================================================================
  function startInteractiveTutorial() {
    preparePracticeArena('L01', 'L01', true);

    gameState.ai.leader.hp = 1;
    gameState.ai.board = [makeCard('M02'), makeCard('M03'), null]; // มีมอนสเตอร์ 2 ตัวให้ซ้อมทำลายด้วยสกิลและซ้อมสั่งตี
    gameState.player.hand = [
      makeCard('M01'), // บาคุจิต
      makeCard('M02'), // โทโดโรจิต
      makeCard('S01'), // โอ๊ยใครเหยียบตีน!!!
      makeCard('M06')  // การ์ดไว้ทิ้งเป็นค่าร่าย S01
    ];

    guidedSession = {
      mode: 'tutorial',
      id: 'basic_tutorial',
      badgePrefix: '🎓 โหมดจับมือสอนเล่น',
      title: 'พื้นฐานการเล่น Battle of Friends',
      stepIndex: 0,
      steps: [
        {
          action: 'SUMMON_HAND',
          cardId: 'M01',
          pointerText: '👆 1. คลิกเลือก "บาคุจิต" บนมือ',
          slotPointerText: '👆 2. คลิกวางลงช่องว่างบนสนามเรา!',
          pendingPointerText: '👆 3. คลิกทำลายยูนิตของ AI ใบนี้!',
          title: 'ขั้นที่ 1: อัญเชิญยูนิตลงสนาม & สกิลเมื่อลงสนาม (ON_SUMMON)',
          desc: 'คลิกที่การ์ด "บาคุจิต (M01)" บนมือด้านล่าง -> คลิกวางลงบนช่องสนามฝั่งเรา -> แล้วคลิกทำลายมอนสเตอร์ของ AI 1 ใบ!',
          isDone: () => gameState.player.board.some(m => m && m.id === 'M01') && !gameState.pendingAction
        },
        {
          action: 'SUMMON_HAND',
          cardId: 'M02',
          pointerText: '👆 1. คลิกเลือก "โทโดโรจิต" บนมือ',
          slotPointerText: '👆 2. คลิกวางลงช่องว่างข้างๆ บาคุจิต!',
          title: 'ขั้นที่ 2: อัญเชิญยูนิตคู่หูเพื่อรับโบนัสพลังต่อเนื่อง!',
          desc: 'คลิกที่การ์ด "โทโดโรจิต (M02)" บนมือ แล้ววางลงช่องว่างบนสนามเรา — สังเกตว่าพลังของ "บาคุจิต" จะเพิ่มขึ้น +1 (เป็น Power 3) ทันทีเพราะมีโทโดโรจิตอยู่บนสนาม!',
          isDone: () => gameState.player.board.some(m => m && m.id === 'M02')
        },
        {
          action: 'CLICK_LEADER',
          pointerText: '👆 คลิกที่การ์ด Leader ของเราตรงนี้!',
          pendingBoardCardId: 'M01',
          pendingPointerText: '👆 คลิกเลือกบัฟพลัง +1 ให้ "บาคุจิต"!',
          title: 'ขั้นที่ 3: กดใช้สกิลของ Leader (เทิร์นละ 1 ครั้ง)',
          desc: 'คลิกที่การ์ด "👑 Leader มายฮีโร่ เดจิต" ของเรา (มุมซ้ายล่าง) แล้วคลิกเลือกยูนิตบนสนามเราเพื่อเพิ่มพลังโจมตี +1 จนจบเทิร์น!',
          isDone: () => !!gameState.player.leader.abilityUsedThisTurn && !gameState.pendingAction
        },
        {
          action: 'CLICK_HAND',
          cardId: 'S01',
          pointerText: '👆 คลิกร่ายเวท "โอ๊ยใครเหยียบตีน!!!"',
          pendingHandCardId: 'M06',
          pendingPointerText: '👆 คลิกเลือกเป้าหมายตามที่สกิลระบุ!',
          title: 'ขั้นที่ 4: การร่ายการ์ดเวทมนตร์ Normal Spell (เทิร์นละ 1 ใบ)',
          desc: 'คลิกที่การ์ดเวท "โอ๊ยใครเหยียบตีน!!! (S01)" บนมือ -> คลิกทิ้งการ์ดบนมือ 1 ใบ -> แล้วคลิกทำลายมอนสเตอร์ใบสุดท้ายของ AI บนสนาม!',
          isDone: () => gameState.player.spellQuota.normalUsed >= 1 && !gameState.pendingAction
        },
        {
          action: 'NEXT_PHASE',
          pointerText: '👆 กดปุ่มเข้าสู่ Battle Phase ตรงนี้!',
          title: 'ขั้นที่ 5: เปลี่ยนเฟสเข้าสู่ช่วงต่อสู้ (Battle Phase)',
          desc: 'เมื่อลงยูนิตและใช้สกิลใน Main Phase เสร็จแล้ว ให้กดปุ่มสีฟ้า "⚔️ เฟสถัดไป (Battle Phase)" บนแถบตรงกลางสนาม!',
          isDone: () => gameState.phase === 'Battle Phase'
        },
        {
          action: 'ATTACK_LEADER',
          cardId: 'M01',
          pointerText: '👆 1. คลิกเลือกยูนิตที่ตั้งอยู่ (Stand)',
          targetPointerText: '👆 2. คลิกโจมตีที่ Leader ของ AI เพื่อชนะเกม!',
          title: 'ขั้นที่ 6: สั่งยูนิตโจมตี Leader อีกฝ่ายเพื่อคว้าชัยชนะ!',
          desc: 'คลิกที่ยูนิตที่ตั้งอยู่ (Stand) บนสนามเรา แล้วคลิกโจมตีที่การ์ด "👑 Leader" ของ AI ด้านบนสุด (เหลือ 1 HP) เพื่อชนะการประลอง!',
          isDone: () => gameState.gameOver || gameState.ai.leader.hp <= 0
        }
      ]
    };

    renderGame();
    renderGuidedCoachBar();
    updateGuidedVisualPointer();
  }

  // ============================================================================
  // 🎮 2. โหมดจับมือซ้อมคอมโบทั้ง 16 คอมโบ (ตั้งสนามตรงตามบทสอน 100% ทุกสเต็ป)
  // ============================================================================
  function startComboPracticeSession(comboId) {
    let foundCombo = null;
    let foundDeck = null;
    for (const d of DECK_COMBO_GUIDES) {
      const c = d.combos.find(item => item.id === comboId);
      if (c) {
        foundCombo = c;
        foundDeck = d;
        break;
      }
    }
    if (!foundCombo || !foundDeck) return;

    // คอมโบที่ต้องให้ AI โจมตีสวนในเทิร์นถัดไป ต้องเปิด AI จริง (ไม่ข้ามเทิร์น AI)
    const needsAIAttack = (comboId === 'jit_allforjit' || comboId === 'doom_maya_lock');
    preparePracticeArena(foundDeck.leaderId, 'L01', !needsAIAttack);

    const p = gameState.player;
    const ai = gameState.ai;
    let steps = [];

    switch (comboId) {
      // ==================== เด็คจิต (L01) ====================
      case 'jit_duo': {
        p.board = [makeCard('M02'), null, null]; // มีโทโดโรจิตบนสนาม
        p.graveyard = [makeCard('M01')];         // มีบาคุจิตในนรก
        p.hand = [makeCard('M06')];
        ai.board = [makeCard('M05'), null, null];
        steps = [
          {
            action: 'CLICK_BOARD_UNIT',
            cardId: 'M02',
            choiceOptionIndex: 1, // หัวข้อที่ 2: นำบาคุจิตจากนรกขึ้นมือ
            pointerText: '👆 1. คลิกที่ "โทโดโรจิต" บนสนาม',
            choicePointerText: '👆 2. คลิกเลือกหัวข้อที่ 2 (นำบาคุจิตจากนรกขึ้นมือ)',
            title: 'สเต็ป 1/2: ใช้สกิลโทโดโรจิต เก็บ "บาคุจิต" จากนรกขึ้นมือ',
            desc: 'คลิกที่ "โทโดโรจิต (M02)" บนสนามเรา แล้วเลือกหัวข้อที่ 2 เพื่อนำ "บาคุจิต (M01)" จากนรกกลับขึ้นมือฟรี!',
            isDone: () => p.hand.some(c => c && c.id === 'M01')
          },
          {
            action: 'SUMMON_HAND',
            cardId: 'M01',
            pointerText: '👆 1. คลิกเลือก "บาคุจิต" บนมือ',
            slotPointerText: '👆 2. คลิกวางลงช่องว่างบนสนามเรา!',
            pendingPointerText: '👆 3. คลิกทำลายมอนสเตอร์ของอีกฝ่าย!',
            title: 'สเต็ป 2/2: อัญเชิญ "บาคุจิต" ทำลายยูนิตอีกฝ่าย & รับพลังคู่หู +1!',
            desc: 'คลิกเลือก "บาคุจิต (M01)" บนมือ -> วางลงช่องว่างบนสนามเรา -> แล้วคลิกทำลายมอนสเตอร์ของ AI! (สังเกตว่าบาคุจิตได้พลัง +1 เป็น Power 3 เพราะมีโทโดโรจิตอยู่คู่กัน)',
            isDone: () => p.board.some(m => m && m.id === 'M01') && !gameState.pendingAction
          }
        ];
        break;
      }

      case 'jit_ende': {
        p.board = [makeCard('M06'), null, null]; // ฮออ์กส์ฟีมบนสนาม
        p.graveyard = [makeCard('M05')];         // เอ็นเดจิตในนรก
        ai.board = [makeCard('M03'), null, null];
        steps = [
          {
            action: 'CLICK_BOARD_UNIT',
            cardId: 'M06',
            choiceOptionIndex: 0,
            pointerText: '👆 1. คลิกที่ "ฮออ์กส์ฟีม" บนสนาม',
            choicePointerText: '👆 2. กดใช้สกิลค้นหา "เอ็นเดจิต" ขึ้นมือ!',
            title: 'สเต็ป 1/3: ใช้สกิลฮออ์กส์ฟีม ค้นหา "เอ็นเดจิต" ขึ้นมือ',
            desc: 'คลิกที่ "ฮออ์กส์ฟีม (M06)" บนสนาม แล้วกดยืนยันใช้สกิล (ลดพลังตัวเอง -2) เพื่อดึง "เอ็นเดจิต (M05)" ขึ้นมือทันที!',
            isDone: () => p.hand.some(c => c && c.id === 'M05')
          },
          {
            action: 'SUMMON_HAND',
            cardId: 'M05',
            pointerText: '👆 1. คลิกเลือก "เอ็นเดจิต" บนมือ',
            slotPointerText: '👆 2. คลิกวางลงช่องว่างบนสนามเรา!',
            title: 'สเต็ป 2/3: อัญเชิญ "เอ็นเดจิต" ลงสนาม',
            desc: 'คลิกที่ "เอ็นเดจิต (M05)" บนมือ แล้วคลิกวางลงช่องว่างบนสนามเรา',
            isDone: () => p.board.some(m => m && m.id === 'M05')
          },
          {
            action: 'CLICK_BOARD_UNIT',
            cardId: 'M05',
            choiceOptionIndex: 0,
            pointerText: '👆 1. คลิกที่ "เอ็นเดจิต" บนสนาม',
            choicePointerText: '👆 2. กดใช้สกิลเพิ่มพลัง +2!',
            title: 'สเต็ป 3/3: กดสกิลเอ็นเดจิต พลัง +2 และคืนพลังให้ฮออ์กส์ฟีม +2!',
            desc: 'คลิกที่ "เอ็นเดจิต (M05)" บนสนามเพื่อกดใช้สกิล -> เอ็นเดจิตจะได้พลัง +2 (เป็น Power 4) และสกิลออโต้ของฮออ์กส์ฟีมจะทำงานได้พลัง +2 คืนกลับมาทันที!',
            isDone: () => {
              const ende = p.board.find(m => m && m.id === 'M05');
              return !!(ende && ende.usedSkills && ende.usedSkills.endeBoost);
            }
          }
        ];
        break;
      }

      case 'jit_allforjit': {
        p.leader.hp = 2;
        p.hand = [makeCard('M03')]; // ออลจิตบนมือ
        p.graveyard = [makeCard('M04'), makeCard('M01'), makeCard('M02')]; // ออลฟอจิตในนรก
        p.board = [null, null, null];
        ai.board = [makeCard('M05'), makeCard('M01'), null];
        ai.hand = [];
        steps = [
          {
            action: 'NEXT_PHASE',
            pointerText: '👆 กดปุ่มเปลี่ยนเฟสไปจนจบเทิร์น เพื่อให้ AI โจมตีมา!',
            title: 'สเต็ป 1/2: จบเทิร์นเพื่อล่อให้ AI โจมตีใส่ Leader ของเรา (ขณะ HP ≤ 2)',
            desc: 'ตอนนี้เรามี "ออลจิต (M03)" บนมือ และมี "ออลฟอจิต (M04)" รออยู่ในนรก ขณะที่เลือด Leader เหลือ 2 HP -> กดปุ่มเปลี่ยนเฟส 2 ครั้งเพื่อจบเทิร์นให้ AI โจมตีเข้ามา!',
            isDone: () => gameState.activeTurn === 'ai'
          },
          {
            action: 'WAIT_REACTION',
            choiceOptionIndex: 0,
            choicePointerText: '👆 คลิกปลุก "ออลฟอจิต" จากนรกล้างกระดาน!',
            title: 'สเต็ป 2/2: สั่งปลุก "ออลฟอจิต" จากนรกระเบิดสนามทุกใบ!',
            desc: 'เมื่อ AI โจมตีใส่ Leader ของเรา หน้าต่างตัวเลือกจะเด้งขึ้นมา -> กดเลือกข้อแรกเพื่อปลุก "ออลฟอจิต (M04)" จากนรกลงมาทำลายมอนสเตอร์ทุกใบบนสนามทันที!',
            isDone: () => p.allForJitUsed || p.board.some(m => m && (m.id === 'M04' || m.id === 'M03'))
          }
        ];
        break;
      }

      // ==================== เด็คเหนือ (L02) ====================
      case 'nuea_spy': {
        p.hand = [makeCard('NM01'), makeCard('NS01')];
        p.deck.push(makeCard('NM05'), makeCard('NM02'));
        ai.board = [null, null, null];
        steps = [
          {
            action: 'CLICK_HAND',
            cardId: 'NM01',
            choiceKeywords: ['สั่งใช้ 1'], // ปุ่มแรกคือ "อัญเชิญปกติ" จึงต้องหาจากข้อความ
            pointerText: '👆 1. คลิกที่ "ไพร่ชาวนาเหนือ" บนมือ',
            choicePointerText: '👆 2. เลือกข้อ 1: ส่งสายลับไปยึดช่องสนามอีกฝ่าย!',
            title: 'สเต็ป 1/3: ใช้สกิลไพร่ชาวนาเหนือ ส่ง "สายลับไพร่เหนือ" ไปยึดสนาม AI',
            desc: 'คลิกที่ "ไพร่ชาวนาเหนือ (NM01)" บนมือ -> เลือกหัวข้อที่ 1 (ส่งตัวเองลงนรกและอัญเชิญสายลับไพร่เหนือลงสนามอีกฝ่าย)!',
            isDone: () => ai.board.some(m => m && m.id === 'NM05')
          },
          {
            action: 'CLICK_HAND',
            cardId: 'NS01',
            choiceOptionIndex: 0,
            pointerText: '👆 1. คลิกร่ายเวท "หมอไพร่เหนือ" บนมือ',
            choicePointerText: '👆 2. เลือกเก็บ "ไพร่ชาวนาเหนือ" จากนรกขึ้นมือ!',
            title: 'สเต็ป 2/3: ร่ายเวท "หมอไพร่เหนือ" ดึงไพร่ชาวนาเหนือจากนรกกลับมาใช้ซ้ำ!',
            desc: 'คลิกที่การ์ดเวท "หมอไพร่เหนือ (NS01)" บนมือ แล้วเลือกเก็บ "ไพร่ชาวนาเหนือ (NM01)" จากนรกกลับขึ้นมือ!',
            isDone: () => p.spellQuota.normalUsed >= 1 && p.hand.some(c => c && c.id === 'NM01')
          },
          {
            action: 'CLICK_HAND',
            cardId: 'NM01',
            choiceKeywords: ['สั่งใช้ 2'],
            pointerText: '👆 1. คลิกที่ "ไพร่ชาวนาเหนือ" บนมืออีกครั้ง',
            choicePointerText: '👆 2. เลือกข้อ 2: ค้นหาการ์ด "ทหาร" จากกองขึ้นมือ!',
            title: 'สเต็ป 3/3: ใช้ไพร่ชาวนาเหนือใบเดิมค้นหา "ทหารหลวงเหนือ" จากกองขึ้นมือ!',
            desc: 'คลิกที่ "ไพร่ชาวนาเหนือ (NM01)" บนมืออีกครั้ง แล้วเลือกหัวข้อที่ 2 เพื่อดึงการ์ด "ทหาร" จากกองขึ้นมือฟรี!',
            isDone: () => p.hand.some(c => c && (c.id === 'NM02' || c.id === 'NM03' || c.id === 'NM04'))
          }
        ];
        break;
      }

      case 'nuea_juti': {
        p.hand = [makeCard('NM04'), makeCard('NM02'), makeCard('NM01')];
        p.graveyard = [makeCard('NM03')]; // มีทหารพรานในนรกให้จุติเรียกออกมาฟรี
        ai.board = [makeCard('M02'), null, null];
        steps = [
          {
            action: 'SUMMON_HAND',
            cardId: 'NM04',
            pointerText: '👆 1. คลิกเลือก "ทหารเกณฑ์เหนือ" บนมือ',
            slotPointerText: '👆 2. คลิกวางลงช่องที่ 1 บนสนามเรา!',
            title: 'สเต็ป 1/2: อัญเชิญ "ทหารเกณฑ์เหนือ (NM04)" ลงสนามเตรียมคอมโบจุติ',
            desc: 'คลิกเลือก "ทหารเกณฑ์เหนือ (NM04)" บนมือ แล้วคลิกวางลงช่องว่างบนสนามเรา (ได้พลัง +1 เมื่อลงสนาม)',
            isDone: () => p.board.some(m => m && m.id === 'NM04')
          },
          {
            action: 'CLICK_HAND',
            cardId: 'NM02',
            choiceKeywords: ['จุติ', 'ทหารพราน'],
            pointerText: '👆 1. คลิกที่ "ทหารหลวงเหนือ" บนมือ',
            choicePointerText: '👆 2. เลือกอัญเชิญจุติ / เลือกทหารจากนรกลงสนาม!',
            title: 'สเต็ป 2/2: อัญเชิญจุติ "ทหารหลวงเหนือ" เรียกพรรคพวกฟรีครบ 3 ช่อง!',
            desc: 'คลิกที่ "ทหารหลวงเหนือ (NM02)" บนมือ -> เลือกหัวข้อที่ 1 (อัญเชิญจุติโดยทิ้งไพร่ชาวนาเหนือ) -> คลิกวางลงช่องว่าง -> แล้วเลือกชุบ "ทหารพรานเหนือ" จากนรกลงช่องที่ 3 ฟรี!',
            isDone: () => p.board.some(m => m && m.id === 'NM02') && !gameState.pendingAction && !isChoiceModalOpen()
          }
        ];
        break;
      }

      case 'nuea_army': {
        const c1 = makeCard('NM04');
        c1.permPowerMod = 1;
        const c2 = makeCard('NM03');
        p.board = [c1, c2, null];
        p.hand = [makeCard('NM02'), makeCard('NS03')];
        ai.board = [makeCard('M01'), makeCard('M05'), null];
        steps = [
          {
            action: 'CLICK_HAND',
            cardId: 'NM02',
            choiceOptionIndex: 0, // อัญเชิญแบบปกติลงสนาม (เมื่อไม่มีไพร่บนมือ)
            pointerText: '👆 1. คลิกเลือก "ทหารหลวงเหนือ" บนมือ',
            slotPointerText: '👆 2. คลิกวางลงช่องที่ 3 บนสนามเรา!',
            title: 'สเต็ป 1/3: ลง "ทหารหลวงเหนือ" ให้ครบทั้ง 3 ทหารบนสนาม',
            desc: 'คลิกที่ "ทหารหลวงเหนือ (NM02)" บนมือ แล้วคลิกวางลงช่องที่ 3 เพื่อให้สนามเรามีครบทั้ง ทหารเกณฑ์ + ทหารพราน + ทหารหลวง!',
            isDone: () => {
              if (gameState.selectedHandIndex !== null && p.hand[gameState.selectedHandIndex]?.id === 'NM02') {
                // ถ้าระบบเลือกการ์ดในมือแล้ว ให้เปลี่ยนเป็นโหมดชี้ช่องสนามทันที
                guidedSession.steps[guidedSession.stepIndex].action = 'SUMMON_HAND';
              }
              return p.board.some(m => m && m.id === 'NM02');
            }
          },
          {
            action: 'CLICK_BOARD_UNIT',
            cardId: 'NM03',
            choiceOptionIndex: 0,
            pointerText: '👆 1. คลิกที่ "ทหารพรานเหนือ" บนสนาม',
            choicePointerText: '👆 2. กดใช้สกิลของทหารพรานเหนือ!',
            pendingPointerText: '👆 3. คลิกเลือกยูนิตบนสนามเพื่อเพิ่ม/ลดพลัง!',
            title: 'สเต็ป 2/3: กดใช้สกิลของ "ทหารพรานเหนือ (NM03)"',
            desc: 'คลิกที่ "ทหารพรานเหนือ (NM03)" บนสนาม -> กดใช้สกิล -> แล้วคลิกเลือกยูนิตฝั่งเราเพื่อเพิ่มพลัง +1 (หรือคลิกยูนิต AI เพื่อลดพลัง -1)!',
            isDone: () => {
              const ranger = p.board.find(m => m && m.id === 'NM03');
              return !!(ranger && ranger.usedSkills && ranger.usedSkills.rangerTarget) && !gameState.pendingAction;
            }
          },
          {
            action: 'CLICK_HAND',
            cardId: 'NS03',
            pointerText: '👆 1. คลิกร่ายเวท "ระเบิดปูพรม" บนมือ!',
            pendingPointerText: '👆 2. คลิกเลือกทำลายมอนสเตอร์ของ AI!',
            title: 'สเต็ป 3/3: ร่ายเวท "ระเบิดปูพรม (NS03)" แสดงผลครบ 3 ทหารพร้อมกัน!',
            desc: 'คลิกการ์ดเวท "ระเบิดปูพรม (NS03)" บนมือ แล้วคลิกเลือกทำลายมอนสเตอร์ของ AI 1 ใบ (พร้อมรับบัฟพลัง +1 ยกแผง และเกราะอมตะไม่ถูกทำลายจนเริ่มเทิร์นถัดไป)!',
            isDone: () => p.spellQuota.normalUsed >= 1 && !gameState.pendingAction
          }
        ];
        break;
      }

      // ==================== เด็ควันสิ้นโลก (L03) ====================
      case 'doom_maya_lock': {
        p.board = [makeCard('DM01'), makeCard('DM03'), null]; // โอนามิ + มายอา บนสนาม
        p.hand = [makeCard('DM05')]; // ซึรุรุบนมือ
        p.graveyard = [makeCard('DM02')]; // โรเซเลียในนรก
        p.deck.push(makeCard('DM06')); // โซเนบุอยู่ใบบนสุดของกอง!
        ai.board = [makeCard('M01'), null, null];
        ai.hand = [makeCard('M02'), makeCard('M03')];
        steps = [
          {
            action: 'CLICK_BOARD_UNIT',
            cardId: 'DM01',
            choiceOptionIndex: 0,
            pointerText: '👆 1. คลิกที่ "โอนามิ ผู้ทำลายโลก" บนสนาม',
            choicePointerText: '👆 2. กดยืนยันใช้สกิล / เลือกโรเซเลียลงสนาม!',
            pendingHandCardId: 'DM05',
            pendingPointerText: '👆 3. คลิกทิ้ง "ซึรุรุ" บนมือ (บังคับอีกฝ่ายทิ้งมือ 1 ใบ)!',
            title: 'สเต็ป 1/3: ใช้สกิลโอนามิ ทิ้ง "ซึรุรุ" เพื่อเรียกคู่หู "โรเซเลีย" ลงสนาม!',
            desc: 'คลิกที่ "โอนามิ ผู้ทำลายโลก (DM01)" บนสนาม -> คลิกทิ้ง "ซึรุรุ (DM05)" บนมือ (สกิลซึรุรุจะบังคับ AI ทิ้งมือ 1 ใบทันที!) -> แล้วเลือกอัญเชิญ "โรเซเลีย (DM02)" ลงสนาม!',
            isDone: () => p.board.some(m => m && m.id === 'DM02') && !gameState.pendingAction
          },
          {
            action: 'CLICK_BOARD_UNIT',
            cardId: 'DM02',
            choiceOptionIndex: 0,
            pointerText: '👆 1. คลิกที่ "โรเซเลีย" บนสนาม',
            choicePointerText: '👆 2. กดใช้สกิลคู่หู Rest เพื่อจั่วการ์ด 1 ใบ!',
            title: 'สเต็ป 2/3: ใช้สกิลคู่หูของ "โรเซเลีย (DM02)" จั่วการ์ดฟรี 1 ใบ!',
            desc: 'ตอนนี้โอนามิและโรเซเลียอยู่คู่กันแล้ว (โอนามิได้พลัง +2 เป็น Power 4) -> คลิกที่ "โรเซเลีย (DM02)" บนสนามเพื่อเปลี่ยนเป็น Rest และจั่วการ์ด 1 ใบ (ต้องเรียงโซเนบุกลับไว้ท็อปกองให้อัตโนมัติหลังจั่ว)!',
            isDone: () => {
              const rose = p.board.find(m => m && m.id === 'DM02');
              return !!(rose && rose.state === 'Rest');
            },
            onEnterNext: () => {
              // รับประกันว่าหลังโรเซเลียจั่วการ์ดแล้ว มี "โซเนบุ (DM06)" อยู่ใบบนสุดของกองสำหรับสกิลมายอา!
              p.deck.push(makeCard('DM06'));
            }
          },
          {
            action: 'NEXT_PHASE',
            choiceOptionIndex: 0,
            pointerText: '👆 กดปุ่มเปลี่ยนเฟสไปจนจบเทิร์น เพื่อให้ AI โจมตีมา!',
            choicePointerText: '👆 กดใช้สกิล 1 เกมของ "มายอา" เปิดท็อปเจอโซเนบุ!',
            title: 'สเต็ป 3/3: จบเทิร์น แล้วกดสกิล 1 เกมของ "มายอา" เปิดเจอโซเนบุบังคับจบเทิร์น AI!',
            desc: 'กดปุ่มเปลี่ยนเฟส 2 ครั้งเพื่อจบเทิร์น -> เมื่อ AI โจมตีเข้ามา ให้กดเลือก "🔮 สั่งใช้สกิล 1 เกมของ มายอา" เพื่อเปิดท็อปกองพบ "โซเนบุ" และบังคับจบเทิร์นของ AI ทันที!',
            isDone: () => !!p.mayaOncePerGameUsed
          }
        ];
        break;
      }

      case 'doom_future': {
        p.board = [makeCard('DM07'), makeCard('DM04'), null]; // แอชชี่ล่า (ร่างต้น) + เดบิรุน บนสนาม
        p.hand = [makeCard('DM13')]; // ยอดนักดาบ แอชชี่ล่า (ร่างอนาคต)
        ai.board = [makeCard('M01'), makeCard('M05'), null];
        steps = [
          {
            action: 'CLICK_HAND',
            cardId: 'DM13',
            choiceOptionIndex: 0,
            pointerText: '👆 1. คลิกการ์ดอนาคต "ยอดนักดาบ แอชชี่ล่า" บนมือ',
            choicePointerText: '👆 2. กดยืนยันอัญเชิญร่างอนาคต!',
            title: 'สเต็ป 1/2: ส่งร่างต้นไปมิติมืดเพื่ออัญเชิญร่างอนาคต "ยอดนักดาบ แอชชี่ล่า"!',
            desc: 'คลิกที่ "ยอดนักดาบ แอชชี่ล่า (DM13)" บนมือ -> กดยืนยันอัญเชิญร่างอนาคต -> แล้วคลิกที่ร่างต้น "แอชชี่ล่า (DM07)" บนสนามเพื่อส่งไปมิติมืดและลดพลังศัตรูทุกใบ -1!',
            isDone: () => p.board.some(m => m && m.id === 'DM13') && !gameState.pendingAction
          },
          {
            action: 'NEXT_PHASE',
            pointerText: '👆 กดปุ่มเปลี่ยนเฟส 2 ครั้งเพื่อจบเทิร์นและดูการสลับร่างกลับ!',
            title: 'สเต็ป 2/2: กดเปลี่ยนเฟสจนจบเทิร์น เพื่อดูร่างต้นกลับมาจากมิติมืดแบบ Stand!',
            desc: 'กดปุ่มเปลี่ยนเฟสเข้าสู่ Battle Phase แล้วกดจบเทิร์น -> สังเกตว่าเมื่อจบเทิร์น ร่างอนาคตจะลงนรกและดึง "แอชชี่ล่า (DM07)" จากมิติมืดกลับลงสนามในสถานะ Stand พร้อมเล่นเทิร์นใหม่ทันที!',
            isDone: () => p.board.some(m => m && m.id === 'DM07') && p.graveyard.some(c => c && c.id === 'DM13')
          }
        ];
        break;
      }

      case 'doom_emi': {
        p.board = [makeCard('DM04'), makeCard('DM08'), null]; // เดบิรุน + เอมิ บนสนาม
        p.graveyard = [makeCard('DM01'), makeCard('DM02'), makeCard('DM03'), makeCard('DM05'), makeCard('DM06')]; // นรก 5 ใบ
        p.hand = [makeCard('DS01'), makeCard('DM01'), makeCard('DM02')]; // ร่าย DS01 จั่ว 2 ใบจะมีมือครบ 4 ใบพอทิ้ง 3 ใบ!
        ai.leader.hp = 2;
        ai.board = [null, null, null];
        steps = [
          {
            action: 'CLICK_HAND',
            cardId: 'DS01',
            pointerText: '👆 1. คลิกร่ายเวท "เบิกเนตรแห่งแสง" บนมือ',
            pendingBoardCardId: 'DM08',
            pendingPointerText: '👆 2. คลิกเลือกบัฟพลัง +1 ให้ "เอมิ"!',
            title: 'สเต็ป 1/4: ร่ายเวท "เบิกเนตรแห่งแสง (DS01)" จั่ว 2 ใบ & บัฟพลังให้เอมิ +1!',
            desc: 'เพราะในนรกเรามีการ์ดครบ 5 ใบ เมื่อคลิกร่าย "เบิกเนตรแห่งแสง (DS01)" จะได้จั่วการ์ดถึง 2 ใบ! จากนั้นคลิกเลือกบัฟพลัง +1 ให้ "เอมิ (DM08)" บนสนาม!',
            isDone: () => p.spellQuota.normalUsed >= 1 && !gameState.pendingAction
          },
          {
            action: 'NEXT_PHASE',
            pointerText: '👆 กดปุ่มเข้าสู่ Battle Phase ตรงนี้!',
            title: 'สเต็ป 2/4: กดปุ่มเปลี่ยนเฟสเข้าสู่ Battle Phase',
            desc: 'กดปุ่มสีฟ้า "⚔️ เฟสถัดไป (Battle Phase)" บนแถบตรงกลางสนามเพื่อเริ่มการโจมตี',
            isDone: () => gameState.phase === 'Battle Phase'
          },
          {
            action: 'ATTACK_LEADER',
            cardId: 'DM08',
            pointerText: '👆 1. คลิกเลือก "เอมิ" บนสนาม',
            targetPointerText: '👆 2. คลิกโจมตีที่ Leader ของ AI ครั้งที่ 1!',
            title: 'สเต็ป 3/4: สั่ง "เอมิ (DM08)" โจมตีใส่ Leader ของอีกฝ่ายครั้งที่ 1',
            desc: 'คลิกที่ "เอมิ (DM08)" บนสนาม แล้วคลิกโจมตีที่การ์ด Leader ของ AI (ทำให้เลือด AI เหลือ 1 HP และเอมินอน Rest)',
            isDone: () => {
              const emi = p.board.find(m => m && m.id === 'DM08');
              return !!(emi && emi.state === 'Rest');
            }
          },
          {
            action: 'CLICK_BOARD_UNIT',
            cardId: 'DM08',
            choiceOptionIndex: 0,
            pointerText: '👆 1. คลิกที่ "เอมิ" ที่นอน Rest อยู่บนสนาม!',
            choicePointerText: '👆 2. กดยืนยันทิ้งมือ 3 ใบเพื่อลุกขึ้น Stand!',
            title: 'สเต็ป 4/4: คลิกที่ "เอมิ" ที่นอน Rest อยู่เพื่อทิ้งมือ 3 ใบและลุกขึ้น Stand ตีซ้ำ!',
            desc: 'เมื่อมี "เดบิรุน (DM04)" อยู่บนสนาม ให้คลิกที่ "เอมิ (DM08)" ที่กำลังนอน Rest อยู่ -> กดยืนยันทิ้งการ์ดบนมือ 3 ใบเพื่อลุกขึ้น Stand พร้อมโจมตีซ้ำปิดเกม!',
            isDone: () => {
              const emi = p.board.find(m => m && m.id === 'DM08');
              return !!(emi && emi.usedSkills && emi.usedSkills.emiReattack);
            }
          }
        ];
        break;
      }

      // ==================== เด็คไดโน (L04) ====================
      case 'dino_mill': {
        p.board = [makeCard('DN04'), makeCard('DN05'), makeCard('DN02')]; // พเทอราโนดอน + สไปโนซอรัส + เวโลซิแรปเตอร์
        p.graveyard = [makeCard('DN01'), makeCard('DN03'), makeCard('DNS01'), makeCard('DNS02')]; // นรก 4 ใบ (โม่เพิ่ม 2 ใบเป็น 6 ใบ -> สไปโนซอรัสได้ +2!)
        ai.board = [makeCard('M01'), null, null];
        steps = [
          {
            action: 'CLICK_BOARD_UNIT',
            cardId: 'DN04',
            choiceOptionIndex: 0,
            pointerText: '👆 1. คลิกที่ "พเทอราโนดอน" บนสนาม',
            choicePointerText: '👆 2. กดใช้สกิลโม่กอง 2 ใบแล้วจั่ว 1 ใบ!',
            title: 'สเต็ป 1/3: ใช้สกิล "พเทอราโนดอน (DN04)" โม่กอง 2 ใบเร่งพลังสไปโนซอรัส!',
            desc: 'คลิกที่ "พเทอราโนดอน (DN04)" บนสนามเพื่อโม่การ์ด 2 ใบลงนรกและจั่ว 1 ใบ — พอในนรกครบ 6 ใบ สกิลต่อเนื่องของ "สไปโนซอรัส (DN05)" จะเพิ่มพลังโจมตีให้ตัวเองทันที!',
            isDone: () => {
              const ptera = p.board.find(m => m && m.id === 'DN04');
              return !!(ptera && ptera.usedSkills && ptera.usedSkills.pteranodon_mill_draw);
            }
          },
          {
            action: 'CLICK_LEADER',
            choiceOptionIndex: 0,
            pointerText: '👆 1. คลิกที่การ์ด Leader "ศูนย์วิจัยไดโน" ของเรา!',
            choicePointerText: '👆 2. กดเลือกเก็บการ์ดไดโนจากนรกขึ้นมือ!',
            title: 'สเต็ป 2/3: กดสกิล Leader "ศูนย์วิจัยไดโน (L04)" เก็บไดโนจากนรกขึ้นมือ!',
            desc: 'คลิกที่การ์ด "👑 Leader ศูนย์วิจัยไดโน (L04)" มุมซ้ายล่าง แล้วเลือกเก็บยูนิตเผ่าไดโนจากนรกกลับขึ้นมือ 1 ใบฟรี!',
            isDone: () => !!p.leader.abilityUsedThisTurn && !isChoiceModalOpen()
          },
          {
            action: 'CLICK_BOARD_UNIT',
            cardId: 'DN02',
            choiceOptionIndex: 0,
            pointerText: '👆 1. คลิกที่ "เวโลซิแรปเตอร์" บนสนาม',
            choicePointerText: '👆 2. กดใช้สกิล Rest ตัวเองเพื่อบัฟพลัง +2!',
            pendingBoardCardId: 'DN05',
            pendingPointerText: '👆 3. คลิกเลือกบัฟพลัง +2 ให้ "สไปโนซอรัส"!',
            title: 'สเต็ป 3/3: ใช้สกิล "เวโลซิแรปเตอร์ (DN02)" บัฟพลังให้สไปโนซอรัส +2!',
            desc: 'คลิกที่ "เวโลซิแรปเตอร์ (DN02)" บนสนาม -> กดยืนยันใช้สกิล Rest ตัวเอง -> แล้วคลิกเลือก "สไปโนซอรัส (DN05)" เพื่อเพิ่มพลังโจมตีอีก +2 จนจบเทิร์น!',
            isDone: () => {
              const raptor = p.board.find(m => m && m.id === 'DN02');
              return !!(raptor && raptor.usedSkills && raptor.usedSkills.raptor_buff) && !gameState.pendingAction;
            }
          }
        ];
        break;
      }

      case 'dino_hybrid': {
        p.hand = [makeCard('DN06')]; // ไฮบริด — อินโดมินัสเร็กซ์
        p.graveyard = [makeCard('DN01'), makeCard('DN02')]; // วัตถุดิบ ทีเร็กซ์ + เวโลซิแรปเตอร์ ในนรก
        ai.board = [makeCard('M02'), null, null]; // มอนสเตอร์ AI Power 1
        ai.leader.hp = 1;
        steps = [
          {
            action: 'CLICK_HAND',
            cardId: 'DN06',
            choiceOptionIndex: 0,
            pointerText: '👆 1. คลิกที่ "ไฮบริด — อินโดมินัสเร็กซ์" (ขอบสีเขียว) บนมือ!',
            choicePointerText: '👆 2. กดยืนยันส่งวัตถุดิบไปมิติมืดเพื่ออัญเชิญไฮบริด!',
            title: 'สเต็ป 1/4: ผสานร่างอัญเชิญ "ไฮบริด — อินโดมินัสเร็กซ์ (DN06)" ลงสนาม!',
            desc: 'คลิกที่ "ไฮบริด — อินโดมินัสเร็กซ์ (DN06)" บนมือ (ขอบเรืองแสงสีเขียว) แล้วกดยืนยันส่ง "ทีเร็กซ์" กับ "เวโลซิแรปเตอร์" จากนรกไปมิติมืดเพื่ออัญเชิญลงสนาม!',
            isDone: () => p.board.some(m => m && m.id === 'DN06')
          },
          {
            action: 'NEXT_PHASE',
            pointerText: '👆 กดปุ่มเข้าสู่ Battle Phase ตรงนี้!',
            title: 'สเต็ป 2/4: กดปุ่มเปลี่ยนเฟสเข้าสู่ Battle Phase',
            desc: 'กดปุ่มสีฟ้า "⚔️ เฟสถัดไป (Battle Phase)" บนแถบตรงกลางสนามเพื่อเริ่มการโจมตี',
            isDone: () => gameState.phase === 'Battle Phase'
          },
          {
            action: 'ATTACK_MONSTER',
            cardId: 'DN06',
            pointerText: '👆 1. คลิกเลือก "อินโดมินัสเร็กซ์" บนสนาม',
            targetPointerText: '👆 2. คลิกโจมตีทำลายมอนสเตอร์ของ AI!',
            title: 'สเต็ป 3/4: สั่ง "อินโดมินัสเร็กซ์" โจมตีทำลายมอนสเตอร์ของ AI (ลุกขึ้น Stand อัตโนมัติ!)',
            desc: 'คลิกที่ "ไฮบริด — อินโดมินัสเร็กซ์ (DN06)" บนสนาม แล้วคลิกโจมตีมอนสเตอร์ของ AI -> เมื่อทำลายมอนสเตอร์สำเร็จ สกิลออโต้จะทำงานทำให้ลุกขึ้น Stand ทันที!',
            isDone: () => p.attacksThisTurn >= 1 && ai.board.every(m => m === null)
          },
          {
            action: 'ATTACK_LEADER',
            cardId: 'DN06',
            pointerText: '👆 1. คลิกเลือก "อินโดมินัสเร็กซ์" ที่ลุกขึ้น Stand อีกครั้ง!',
            targetPointerText: '👆 2. คลิกโจมตีซ้ำใส่ Leader ของ AI เพื่อชนะเกม!',
            title: 'สเต็ป 4/4: สั่ง "อินโดมินัสเร็กซ์" โจมตีซ้ำครั้งที่ 2 ใส่ Leader ของ AI!',
            desc: 'ตอนนี้อินโดมินัสเร็กซ์ลุกขึ้น Stand พร้อมโจมตีต่อแล้ว -> คลิกที่อินโดมินัสเร็กซ์ แล้วคลิกโจมตีที่ Leader ของ AI เพื่อปิดเกมชนะทันที!',
            isDone: () => gameState.gameOver || ai.leader.hp <= 0
          }
        ];
        break;
      }

      // ==================== เด็คปีศาจ (L05) ====================
      case 'demon_dark_engine': {
        p.board = [makeCard('DMM07'), null, null]; // เบลเฟกอร์ บาปเกียจคร้าน บนสนาม
        p.hand = [makeCard('DMM05')]; // แอสโมดิวส์ บาปราคะ บนมือ
        // จัดมิติมืดให้มี 12 ใบ (รวม DMS03 ดินแดนปีศาจ) พอแอสโมดิวส์ส่ง DMS01 เข้ามิติมืดจะเป็น 13 ใบ และเบลเฟกอร์ตีดูดอีก 2 ใบเป็น 15 ใบ ชนะเกมทันที!
        p.darkDimension = [
          makeCard('DMS03'), makeCard('DMM01'), makeCard('DMM02'), makeCard('DMM03'),
          makeCard('DMM04'), makeCard('DMM06'), makeCard('DMS02'), makeCard('DMM01')
        ];
        ai.darkDimension = [makeCard('M01'), makeCard('M02'), makeCard('M03'), makeCard('M05')];
        // เรียง 3 ใบบนสุดของกองให้มี "สัญญาปีศาจ (DMS01)"
        p.deck.push(makeCard('DMM01'), makeCard('DMS02'), makeCard('DMS01'));
        steps = [
          {
            action: 'SUMMON_HAND',
            cardId: 'DMM05',
            choiceKeywords: ['สัญญาปีศาจ', 'ยืนยัน'], // เวทที่เปิดได้เรียงไม่แน่นอน: หาจากชื่อ
            pointerText: '👆 1. คลิกเลือก "แอสโมดิวส์ บาปราคะ" บนมือ',
            slotPointerText: '👆 2. คลิกวางลงช่องว่างบนสนามเรา!',
            choicePointerText: '👆 3. คลิกเลือก "สัญญาปีศาจ" เพื่อส่งเข้ามิติมืด!',
            title: 'สเต็ป 1/3: อัญเชิญ "แอสโมดิวส์ (DMM05)" เปิดท็อปส่ง "สัญญาปีศาจ" เข้ามิติมืด!',
            desc: 'คลิกเลือก "แอสโมดิวส์ บาปราคะ (DMM05)" บนมือแล้ววางลงสนาม -> สกิลเปิดท็อป 3 ใบจะทำงาน ให้กดเลือก "สัญญาปีศาจ (DMS01)" เพื่อส่งเข้ามิติมืดทันที (ปีศาจทุกตัวพลัง +1 ถาวร)!',
            isDone: () => p.darkDimension.some(c => c && c.id === 'DMS01') && !isChoiceModalOpen()
          },
          {
            action: 'NEXT_PHASE',
            pointerText: '👆 กดปุ่มเข้าสู่ Battle Phase ตรงนี้!',
            title: 'สเต็ป 2/3: กดปุ่มเปลี่ยนเฟสเข้าสู่ Battle Phase',
            desc: 'ตอนนี้การ์ดในมิติมืดรวมทั้ง 2 ฝั่งมี 13/15 ใบแล้ว! กดปุ่มเข้าสู่ Battle Phase เพื่อสั่งเบลเฟกอร์โจมตีดูดการ์ดเข้ามิติมืดอีก 2 ใบ!',
            isDone: () => gameState.phase === 'Battle Phase'
          },
          {
            action: 'ATTACK_LEADER',
            cardId: 'DMM07',
            pointerText: '👆 1. คลิกเลือก "เบลเฟกอร์ บาปเกียจคร้าน" บนสนาม',
            targetPointerText: '👆 2. คลิกโจมตีใส่ Leader อีกฝ่ายเพื่อดูดการ์ดครบ 15 ใบชนะเกม!',
            title: 'สเต็ป 3/3: สั่ง "เบลเฟกอร์ (DMM07)" โจมตีดูดการ์ดเข้ามิติมืดครบ 15 ใบ ชนะเกมทันที!',
            desc: 'คลิกที่ "เบลเฟกอร์ บาปเกียจคร้าน (DMM07)" บนสนาม แล้วคลิกโจมตีที่ Leader ของ AI -> สกิลออโต้ของเบลเฟกอร์จะดูดใบบนสุดของทั้ง 2 ฝั่งเข้ามิติมืดจนครบ 15 ใบ และชนะเกมด้วย "ดินแดนปีศาจ" ทันที!',
            isDone: () => gameState.gameOver
          }
        ];
        break;
      }

      case 'demon_satan_win': {
        p.leader.hp = 1; // เงื่อนไขซาตาน: เลือดเราเหลือ 1 HP
        p.board = [makeCard('DMM04'), null, null]; // ซาตาน บาปโทสะ บนสนาม
        p.hand = [makeCard('DMM01'), makeCard('DMM02'), makeCard('DMM03'), makeCard('DMM05'), makeCard('DMM06')]; // มือครบ 5 ใบ
        ai.board = [makeCard('M01'), makeCard('M02'), makeCard('M05')]; // AI มีมอนสเตอร์เต็ม 3 ช่อง
        ai.hand = [makeCard('S01'), makeCard('S02'), makeCard('S03')];
        ai.leader.hp = 1;
        steps = [
          {
            action: 'CLICK_BOARD_UNIT',
            cardId: 'DMM04',
            choiceOptionIndex: 0,
            pointerText: '👆 1. คลิกที่ "ซาตาน บาปโทสะ" บนสนาม',
            choicePointerText: '👆 2. กดใช้สกิล [1 เกม] ล้างสนามและทำลายมือคู่แข่ง!',
            title: 'สเต็ป 1/3: กดสกิล [1 เกม] ของ "ซาตาน บาปโทสะ (DMM04)" กวาดเรียบทั้งสนามและมือ AI!',
            desc: 'เมื่อเลือดเราเหลือ 1 HP ให้คลิกที่ "ซาตาน บาปโทสะ (DMM04)" บนสนาม -> กดยืนยันทิ้งมือ 5 ใบเพื่อทำลายมอนสเตอร์ใบอื่นทุกใบบนสนาม และบังคับ AI ทิ้งมือ 3 ใบจนหมดมือ!',
            isDone: () => !!p.satanOncePerGameUsed && ai.board.every(m => m === null)
          },
          {
            action: 'NEXT_PHASE',
            pointerText: '👆 กดปุ่มเข้าสู่ Battle Phase ตรงนี้!',
            title: 'สเต็ป 2/3: กดปุ่มเปลี่ยนเฟสเข้าสู่ Battle Phase',
            desc: 'ตอนนี้สนามของ AI ถูกทำลายจนโล่งหมดแล้ว กดปุ่มสีฟ้าเพื่อเข้าสู่ Battle Phase!',
            isDone: () => gameState.phase === 'Battle Phase'
          },
          {
            action: 'ATTACK_LEADER',
            cardId: 'DMM04',
            pointerText: '👆 1. คลิกเลือก "ซาตาน บาปโทสะ" บนสนาม',
            targetPointerText: '👆 2. คลิกโจมตีที่ Leader ของ AI เพื่อปิดเกม!',
            title: 'สเต็ป 3/3: สั่ง "ซาตาน บาปโทสะ" โจมตีปิดเกมใส่ Leader ของ AI!',
            desc: 'คลิกที่ "ซาตาน บาปโทสะ (DMM04)" บนสนาม แล้วคลิกโจมตีที่ Leader ของ AI เพื่อคว้าชัยชนะ!',
            isDone: () => gameState.gameOver || ai.leader.hp <= 0
          }
        ];
        break;
      }

      // ==================== เด็คโอ๊ต (L06) ====================
      case 'oat_topdeck_bank': {
        p.hand = [makeCard('OM02')]; // ไอแบงค์บ้าเกม บนมือ
        // เรียง 2 ใบบนสุดของกองให้เป็น OM01 (ไอโอ๊ตบ้าการ์ตูน) และ OS02 (สงครามความบ้า)
        p.deck.push(makeCard('OM06'), makeCard('OM01'), makeCard('OS02'));
        steps = [
          {
            action: 'WAIT_CHOICE',
            choiceOptionIndex: 0,
            choicePointerText: '👆 กดเลือกหยิบเวทขึ้นมือ แล้วเลือก "วางไว้บนสุดของกองการ์ด"!',
            title: 'สเต็ป 1/2: สกิลเข้าเทิร์นของ "ไอโอ๊ตบ้าทุกสิ่ง (L06)" เรียง "ไอโอ๊ตบ้าการ์ตูน" ไว้บนสุดของกอง!',
            desc: 'หน้าต่างสกิลออโต้ต้นเทิร์นของ Leader เปิดการ์ด 2 ใบบนสุด -> กดเลือกหยิบการ์ดเวทมนตร์ขึ้นมือ แล้วกดเลือก "⬆️ วางไว้บนสุดของกองการ์ด" เพื่อให้ "ไอโอ๊ตบ้าการ์ตูน (OM01)" รออยู่ใบบนสุด!',
            isDone: () => !isChoiceModalOpen() && p.hand.some(c => c && c.id === 'OS02')
          },
          {
            action: 'SUMMON_HAND',
            cardId: 'OM02',
            choiceOptionIndex: 0,
            pointerText: '👆 1. คลิกเลือก "ไอแบงค์บ้าเกม" บนมือ',
            slotPointerText: '👆 2. คลิกวางลงช่องว่างบนสนามเรา!',
            choicePointerText: '👆 3. กดเลือกคอล "ไอโอ๊ตบ้าการ์ตูน" ลงสนามฟรี!',
            title: 'สเต็ป 2/2: อัญเชิญ "ไอแบงค์บ้าเกม (OM02)" เปิดท็อปกองคอล "ไอโอ๊ตบ้าการ์ตูน" ติดเกราะอมตะ!',
            desc: 'คลิกเลือก "ไอแบงค์บ้าเกม (OM02)" บนมือแล้ววางลงสนาม -> สกิลจะเปิด 2 ใบบนสุด ให้กดเลือกคอล "ไอโอ๊ตบ้าการ์ตูน (OM01)" ลงสนามฟรี (ได้พลัง +2 เป็น Power 3 และเกราะอมตะ 1 ครั้ง/เทิร์น)!',
            isDone: () => p.board.some(m => m && m.id === 'OM01') && !isChoiceModalOpen() && !gameState.pendingAction
          }
        ];

        // เรียกสกิลต้นเทิร์นของ L06 ทันทีที่เริ่มซ้อมคอมโบนี้
        renderGame();
        guidedSession = {
          mode: 'combo',
          id: comboId,
          badgePrefix: '🎮 ซ้อมคอมโบเด็คโอ๊ต',
          title: foundCombo.title,
          stepIndex: 0,
          steps
        };
        renderGuidedCoachBar();
        // รอป้าย "เทิร์นของคุณ" หายก่อน ไม่งั้นป้ายทับหน้าต่างเลือกการ์ด
        const oatSession = guidedSession;
        setTimeout(() => {
          if (guidedSession !== oatSession) return; // ออก/เริ่มคอมโบอื่นไปแล้ว
          triggerOatLeaderStartTurn(p, () => {
            renderGame();
            checkAndAdvanceGuidedStep();
          });
        }, 1300);
        updateGuidedVisualPointer();
        return;
      }

      case 'oat_arm_triple': {
        // สนามมี 3 ช่อง: ไออาร์ม + อีก 2 ใบ จึงปลดผลได้มากสุด 2 ข้อ (ถ้าวางทับไอโอ๊ต/แบงค์/จิต ใบนั้นจะหายก่อนเช็กเงื่อนไข)
        p.board = [makeCard('OM01'), makeCard('OM03'), null]; // โอ๊ต + จิต + ช่องว่างไว้ลงไออาร์ม
        p.hand = [makeCard('OM04'), makeCard('OM03')]; // ไออาร์ม + ไอจิตบ้ากามใบที่ 2
        p.graveyard = [makeCard('OS02')]; // การ์ดในนรกให้ไออาร์มเก็บขึ้นมือ
        ai.board = [makeCard('M01'), makeCard('M05'), makeCard('M06')]; // มอนสเตอร์ AI 3 ใบไว้ดูผลลดพลังหมู่
        steps = [
          {
            action: 'SUMMON_HAND',
            cardId: 'OM04',
            targetSlot: 2,
            choiceOptionIndex: 0,
            pointerText: '👆 1. คลิกเลือก "ไออาร์มบ้าการ์ดเกม" บนมือ',
            slotPointerText: '👆 2. คลิกวางลงช่องว่าง (ช่องที่ 3)!',
            choicePointerText: '👆 3. กดเลือกเก็บการ์ดจากนรกขึ้นมือ!',
            title: 'สเต็ป 1/2: อัญเชิญ "ไออาร์มบ้าการ์ดเกม (OM04)" ปลดล็อกผลของโอ๊ต + จิต!',
            desc: 'บนสนามมี "ไอโอ๊ตบ้าการ์ตูน" + "ไอจิตบ้ากาม" -> ลง "ไออาร์มบ้าการ์ดเกม (OM04)" ในช่องว่าง: ผล 1 เก็บการ์ดจากนรกขึ้นมือ 1 ใบ + ผล 3 ศัตรูทุกใบพลัง -1 และอัปเกรดสกิลไอจิตให้ลดพลังทุกใบ (สนามมี 3 ช่อง จึงปลดได้ 2 ใน 3 ผล)',
            isDone: () => p.board.some(m => m && m.id === 'OM04') && !!p.jitCrazyUpgraded && !isChoiceModalOpen()
          },
          {
            action: 'SUMMON_HAND',
            cardId: 'OM03',
            targetSlot: 1,
            pointerText: '👆 1. คลิกเลือก "ไอจิตบ้ากาม" บนมือ',
            slotPointerText: '👆 2. คลิกวางทับไอจิตใบเดิม (ช่องที่ 2)!',
            title: 'สเต็ป 2/2: ลง "ไอจิตบ้ากาม (OM03)" ใบที่ 2 ใช้สกิลที่อัปเกรดแล้ว ลดพลังศัตรูทุกใบ!',
            desc: 'คลิกเลือก "ไอจิตบ้ากาม (OM03)" บนมือ แล้ววางทับไอจิตใบเดิมในช่องที่ 2 -> สกิลที่อัปเกรดแล้วจะลดพลังมอนสเตอร์ AI ทุกใบอีก -1 พร้อมกัน!',
            isDone: () => ai.board.filter(Boolean).every(m => (m.tempPowerMod || 0) <= -2)
          }
        ];
        break;
      }

      case 'oat_nuea_clip': {
        p.board = [makeCard('OM01'), null, null]; // มีไอโอ๊ตบ้าการ์ตูนบนสนาม (เงื่อนไขร่าย OS01 ท่าไม้ตาย(มั้ง))
        p.hand = [makeCard('OM05'), makeCard('OS01'), makeCard('OM06')]; // ไอเหนือผู้มีคลิปแปลก + ท่าไม้ตาย(มั้ง)
        p.deck.push(makeCard('OM03'), makeCard('OM04'), makeCard('OS02')); // มี OS02 สงครามความบ้า ใน 3 ใบบนสุดของกอง
        p.graveyard = [makeCard('OM01'), makeCard('OM02')]; // ให้ OS02 ดึงโอ๊ต+แบงค์ขึ้นมือจนมีมือครบ 3 ใบไว้จ่ายค่าร่าย OS01!
        ai.board = [makeCard('M01'), makeCard('M05'), null];
        steps = [
          {
            action: 'SUMMON_HAND',
            cardId: 'OM05',
            choiceOptionIndex: 0,
            pointerText: '👆 1. คลิกเลือก "ไอเหนือผู้มีคลิปแปลก" บนมือ',
            slotPointerText: '👆 2. คลิกวางลงช่องว่างบนสนามเรา!',
            choicePointerText: '👆 3. กดหยิบเวท "สงครามความบ้า" ขึ้นมือ!',
            title: 'สเต็ป 1/3: อัญเชิญ "ไอเหนือผู้มีคลิปแปลก (OM05)" เปิดท็อป 3 ใบหยิบเวทมนตร์ขึ้นมือ!',
            desc: 'คลิกเลือก "ไอเหนือผู้มีคลิปแปลก (OM05)" บนมือแล้ววางลงช่องว่างบนสนาม -> กดเลือกหยิบการ์ดเวท "สงครามความบ้า (OS02)" ขึ้นมือฟรี!',
            isDone: () => p.board.some(m => m && m.id === 'OM05') && p.hand.some(c => c && c.id === 'OS02') && !isChoiceModalOpen()
          },
          {
            action: 'CLICK_BOARD_UNIT',
            cardId: 'OM05',
            choiceKeywords: ['ยืนยัน', 'สงครามความบ้า'], // หน้าต่างที่ 2 เรียงเวทตามมือ: หาเวทจากชื่อ
            pointerText: '👆 1. คลิกที่ "ไอเหนือผู้มีคลิปแปลก" บนสนาม',
            choicePointerText: '👆 2. กดใช้สกิลร่ายเวทฟรีไม่เสียโควต้า!',
            pendingHandCardId: 'OS02',
            pendingPointerText: '👆 3. คลิกเลือกเวท "สงครามความบ้า" บนมือเพื่อร่ายฟรี!',
            title: 'สเต็ป 2/3: กดสกิลของ "ไอเหนือผู้มีคลิปแปลก" ร่ายเวท "สงครามความบ้า" ฟรีไม่เสียโควต้า!',
            desc: 'คลิกที่ "ไอเหนือผู้มีคลิปแปลก (OM05)" บนสนาม -> กดยืนยันใช้สกิล -> แล้วคลิกเลือกการ์ดเวท "สงครามความบ้า (OS02)" บนมือเพื่อดึงโอ๊ตและแบงค์ขึ้นมือโดยที่โควต้า Normal Spell ยังเป็น 0/1!',
            isDone: () => {
              const nuea = p.board.find(m => m && m.id === 'OM05');
              return !!(nuea && nuea.usedSkills && nuea.usedSkills.nuea_clip_free_spell) && !gameState.pendingAction;
            }
          },
          {
            action: 'CLICK_HAND',
            cardId: 'OS01',
            pointerText: '👆 1. คลิกร่ายเวท "ท่าไม้ตาย(มั้ง)" บนมือ (ใบที่ 2 ของเทิร์น)!',
            pendingPointerText: '👆 2. คลิกทิ้งการ์ดบนมือให้ครบ 3 ใบเพื่อระเบิดสนาม AI!',
            title: 'สเต็ป 3/3: ร่ายเวทใบที่ 2 ในเทิร์นเดียว "ท่าไม้ตาย(มั้ง) (OS01)" ทำลายสนาม AI ยกแผง!',
            desc: 'เพราะโควต้า Normal Spell ยังเหลือ 0/1 คุณจึงคลิกร่าย "ท่าไม้ตาย(มั้ง) (OS01)" ต่อได้ทันที -> คลิกทิ้งการ์ดบนมือ 3 ใบเพื่อทำลายมอนสเตอร์บนสนามของ AI ทั้งหมด!',
            isDone: () => p.spellQuota.normalUsed >= 1 && ai.board.every(m => m === null) && !gameState.pendingAction
          }
        ];
        break;
      }
    }

    guidedSession = {
      mode: 'combo',
      id: comboId,
      badgePrefix: `🎮 ซ้อมคอมโบ (${foundDeck.deckName})`,
      liveAI: needsAIAttack,
      title: foundCombo.title,
      stepIndex: 0,
      steps
    };

    renderGame();
    renderGuidedCoachBar();
    updateGuidedVisualPointer();
  }

  function renderComboGuideSection() {
    const tabsBox = document.getElementById('howto-combo-deck-tabs');
    const contentBox = document.getElementById('howto-combo-content');
    if (!tabsBox || !contentBox) return;

    tabsBox.innerHTML = DECK_COMBO_GUIDES.map(d => {
      const lCard = CARD_DATABASE.find(c => c.id === d.leaderId);
      const img = lCard ? lCard.image : 'images/เด็คจิต/1.png';
      return `
        <button type="button" class="lb-combo-deck-pill ${d.leaderId === selectedComboLeaderId ? 'is-active' : ''}" data-combo-leader="${d.leaderId}">
          <img src="${img}" alt="">
          <span>${d.deckName}</span>
        </button>
      `;
    }).join('');

    tabsBox.querySelectorAll('[data-combo-leader]').forEach(btn => {
      btn.onclick = () => {
        selectedComboLeaderId = btn.getAttribute('data-combo-leader') || 'L01';
        renderComboGuideSection();
      };
    });

    const currentDeckGuide = DECK_COMBO_GUIDES.find(d => d.leaderId === selectedComboLeaderId) || DECK_COMBO_GUIDES[0];

    contentBox.innerHTML = `
      <div class="lb-combo-overview">
        <strong>${currentDeckGuide.deckName}</strong>
        <p>${currentDeckGuide.overview}</p>
      </div>
      ${currentDeckGuide.combos.map(combo => {
        const cardsHtml = combo.cards.map((cid, idx) => {
          const cObj = CARD_DATABASE.find(c => c.id === cid);
          if (!cObj) return '';
          const subTxt = cObj.type === 'Monster' ? `Power ${cObj.power}` : (cObj.type === 'Leader' ? `Leader` : cObj.type);
          const arrow = idx < combo.cards.length - 1 ? `<span class="lb-combo-arrow">➔</span>` : '';
          return `
            <div class="lb-combo-mini-card" data-preview-cid="${cObj.id}" title="คลิกเพื่อดูการ์ดใบใหญ่">
              <img src="${cObj.image}" alt="${cObj.name}">
              <div class="lb-combo-mini-meta">
                <b>${cObj.name}</b>
                <small>${cObj.id} · ${subTxt}</small>
              </div>
            </div>
            ${arrow}
          `;
        }).join('');

        return `
          <div class="lb-combo-card">
            <div class="lb-combo-card-head">
              <span class="lb-combo-card-title">${combo.title}</span>
              <button type="button" class="btn lb-combo-practice-btn" data-practice-combo="${combo.id}">
                🎮 จับมือซ้อมคอมโบนี้!
              </button>
            </div>
            <div class="lb-combo-cards-strip">${cardsHtml}</div>
            <ol class="lb-combo-steps-list">
              ${combo.steps.map(s => `<li>${s.replace(/^\d+\.\s*/, '')}</li>`).join('')}
            </ol>
          </div>
        `;
      }).join('')}
    `;

    contentBox.querySelectorAll('[data-preview-cid]').forEach(el => {
      el.onclick = () => {
        const cid = el.getAttribute('data-preview-cid');
        const cObj = CARD_DATABASE.find(c => c.id === cid);
        if (cObj && typeof window.openCardDetailModal === 'function') {
          const howtoDlg = document.getElementById('lb-howto-dialog');
          if (howtoDlg && howtoDlg.open) howtoDlg.close();
          window.openCardDetailModal(cObj, null, el);
        }
      };
    });

    contentBox.querySelectorAll('[data-practice-combo]').forEach(btn => {
      btn.onclick = () => {
        const comboId = btn.getAttribute('data-practice-combo');
        const howtoDlg = document.getElementById('lb-howto-dialog');
        if (howtoDlg && howtoDlg.open) howtoDlg.close();
        startComboPracticeSession(comboId);
      };
    });
  }

  function bindHowtoTabsAndTutorial() {
    const howtoDlg = document.getElementById('lb-howto-dialog');
    if (!howtoDlg) return;

    const tabs = howtoDlg.querySelectorAll('[data-howto-tab]');
    const panes = {
      rules: document.getElementById('howto-pane-rules'),
      zones: document.getElementById('howto-pane-zones'),
      combos: document.getElementById('howto-pane-combos')
    };

    tabs.forEach(tabBtn => {
      if (tabBtn._bofBound) return;
      tabBtn._bofBound = true;
      tabBtn.addEventListener('click', () => {
        const targetKey = tabBtn.getAttribute('data-howto-tab') || 'rules';
        tabs.forEach(b => b.classList.toggle('is-active', b === tabBtn));
        Object.entries(panes).forEach(([k, el]) => {
          if (el) el.style.display = (k === targetKey) ? 'block' : 'none';
        });
        if (targetKey === 'combos') {
          renderComboGuideSection();
        }
      });
    });

    const startTutBtn = document.getElementById('btn-start-interactive-tutorial');
    if (startTutBtn && !startTutBtn._bofBound) {
      startTutBtn._bofBound = true;
      startTutBtn.addEventListener('click', () => {
        startInteractiveTutorial();
      });
    }

    // ผูกกับ renderGame และ showChoiceModal เพื่ออัปเดตตัวชี้เป้าจับมือสอน (👆) ทุกจังหวะอัตโนมัติ
    const origRender = renderGame;
    renderGame = function () {
      origRender();
      if (guidedSession && gameState.player) {
        checkAndAdvanceGuidedStep();
      }
    };

    if (typeof showChoiceModal === 'function' && !showChoiceModal._bofGuidedWrapped) {
      const origShowChoiceModal = showChoiceModal;
      showChoiceModal = function (...args) {
        origShowChoiceModal.apply(this, args);
        if (guidedSession) {
          setTimeout(updateGuidedVisualPointer, 30);
        }
      };
      showChoiceModal._bofGuidedWrapped = true;
    }
  }

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', bindHowtoTabsAndTutorial);
    } else {
      bindHowtoTabsAndTutorial();
    }
  }

  window.BOFTutorial = {
    startInteractiveTutorial,
    startComboPracticeSession,
    hideTutorialCoachBar,
    isTutorialActive: () => !!guidedSession,
    // คอมโบที่ต้องให้ AI ตีสวน (liveAI) ต้องปล่อยให้ AI เล่นเทิร์นจริง
    wantsDummyAI: () => !!guidedSession && !guidedSession.liveAI
  };
})();
