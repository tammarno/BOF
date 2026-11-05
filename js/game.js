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

function getCardOriginalOwner(card, fallbackContestant = null) {
  if (!card) return fallbackContestant;
  if (card.originalOwner) return card.originalOwner;
  if (card.uid) {
    if (card.uid.startsWith('P1')) return gameState.player;
    if (card.uid.startsWith('AI')) return gameState.ai;
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

  gameState.matchLogHistory.push({
    turn: gameState.turnCount,
    category: logCategory,
    message,
    isAI: message.includes('🤖') || message.includes('AI'),
    time: new Date().toLocaleTimeString('th-TH', { hour12: false })
  });
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
  if (typeof pvpState !== 'undefined' && pvpState.peer) pvpState.peer.destroy();
  if (typeof pvpState !== 'undefined') pvpState.isMultiplayer = false;
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

function showChoiceModal(title, description, options) {
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
        <p id="choice-modal-desc" style="color: #cbd5e1; margin: 10px 0 18px 0; white-space: pre-line;"></p>
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

function askCardUseConfirmation(card, actionTitle, onConfirmCallback) {
  const powerInfo = card.type === 'Monster' ? ` (Power: ${card.power})` : '';
  const tribeInfo = card.tribe ? ` [เผ่า: ${card.tribe}]` : '';
  showChoiceModal(
    `❓ ยืนยันการใช้งานการ์ด: ${card.name}${powerInfo}${tribeInfo}`,
    `คุณต้องการ ${actionTitle} ใช่หรือไม่?\n\n📜 ความสามารถ:\n${getCardDescription(card)}`,
    [
      {
        label: `✅ ยืนยัน (${actionTitle})`,
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
          const castableInHand = caster.hand.some(c => c && c.type === 'NormalSpell');
          if (!castableInHand) return { ok: false, reason: 'ไม่มีการ์ดเวทมนตร์ปกติ (NormalSpell) บนมือให้สั่งใช้งาน!' };
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

        const count = step.count || 1;
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

        const hasEnemy = opponent.board.some(m => m !== null && !m.immuneToEnemyEffectsUntilEndOfTurn);
        if (!hasEnemy) {
          setLog(`ℹ️ ${cardTitle} ไม่มีมอนสเตอร์ฝ่ายตรงข้ามที่สามารถลดพลังได้`);
          next();
          return;
        }

        const count = step.count || 1;
        if (isAI) {
          const target = opponent.board.find(m => m !== null && m.id !== 'NM05' && !m.immuneToEnemyEffectsUntilEndOfTurn);
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
          remainingCount: step.count || 1,
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

        gameState.pendingAction = {
          type: 'MODULAR_SELECT_TARGET',
          targetZone: 'PLAYER_BOARD',
          remainingCount: step.count || 1,
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
            next();
          } else {
            gameState.pendingAction = {
              type: 'CALL_FROM_EFFECT_SELECT_SLOT',
              cardToPlace: chosenCard,
              onAfterPlace: () => triggerAfterBankPlace(0)
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
          castWithoutQuota(normalSpells[0].idx);
          return;
        }

        const opts = normalSpells.map(item => ({
          label: `✨ ร่าย "${item.card.name}" ฟรี (ไม่เสียโควต้า Normal Spell)`,
          color: '#0284c7',
          onSelect: () => castWithoutQuota(item.idx)
        }));
        opts.push({ label: '❌ ยกเลิก', color: '#475569', onSelect: () => next() });
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

function triggerKhunNueaStartTurn(contestant) {
  if (!contestant.leader || contestant.leader.id !== 'L02') return;
  const inGraveIdx = contestant.graveyard.findIndex(c => c.id === 'NM01');
  const inDeckIdx = contestant.deck.findIndex(c => c.id === 'NM01');
  if (inGraveIdx === -1 && inDeckIdx === -1) return;

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
        }
      },
      { label: 'ไม่นำขึ้นมือ (ข้าม)', color: '#475569', onSelect: () => renderGame() }
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
                if (onComplete) onComplete();
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
    if (opponent.hand.length > 0) {
      const discarded = opponent.hand.pop();
      resetCardStateForZoneChange(discarded);
      opponent.graveyard.push(discarded);
      setLog(`🌌 [อนาคต - นักล่าปีศาจ โซเนบุ] ส่งโซเนบุไปมิติมืด -> ฝ่ายตรงข้ามทิ้งการ์ดบนมือ "${discarded.name}" 1 ใบ!`);
    } else {
      futureCard.permPowerMod += 1;
      setLog('🌌 [อนาคต - นักล่าปีศาจ โซเนบุ] ฝ่ายตรงข้ามไม่ทิ้งการ์ด -> นักล่าปีศาจ โซเนบุ พลัง +1!');
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
      ? `เปิดการ์ด 2 ใบบนสุดของกอง — การ์ดที่ไม่ใช่เวทมนตร์แสดงด้านบน\nคลิกรูปการ์ดเวทมนตร์ด้านล่างเพื่อนำขึ้นมือ (ไม่เกิน 1 ใบ):`
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
    triggerKhunNueaStartTurn(contestant);
    if (onStartEffectsComplete) onStartEffectsComplete();
    return;
  }

  if (contestant.leader && contestant.leader.id === 'L06') {
    triggerOatLeaderStartTurn(contestant, onStartEffectsComplete);
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
      let overwriteMsg = '';
      if (slotMonster !== null) {
        const overwritten = sendOverwrittenMonsterToGrave(player, slotIndex);
        overwriteMsg = ` (วางทับ "${overwritten.name}" ส่งลงนรกโดยไม่ถือว่าถูกทำลาย)`;
      }
      player.board[slotIndex] = cardToPlace;
      gameState.pendingAction = null;
      setLog(`✨ คอล "${cardToPlace.name}" ลงช่องที่ ${slotIndex + 1} สำเร็จ!${overwriteMsg}`);
      EffectEngine.triggerCardEffects(cardToPlace, 'ON_SUMMON', {
        caster: player, opponent: gameState.ai, sourceCard: cardToPlace, sourceSlot: slotIndex, isAI: false
      }, () => {
        renderGame();
        if (callback) callback();
      });
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
      const spell = attacker.hand.splice(os03Idx, 1)[0];
      attacker.spellQuota.reactionUsed += 1;
      resetCardStateForZoneChange(spell);
      attacker.graveyard.push(spell);
      showCardShowcaseBanner(spell, 'AI ใช้เวทรีแอค เร็วขึ้นอีก!!!!!!', '⚔️ การโจมตีของ "ไอแบงค์บ้าเกม" ไม่สามารถนำยูนิทมาป้องกันได้!', '#38bdf8', 1100);
      setLog('⚡ [AI - เร็วขึ้นอีก!!!!!!] เมื่อ "ไอแบงค์บ้าเกม" โจมตี ฝ่ายตรงข้ามไม่สามารถนำยูนิทมาป้องกันการโจมตีนี้ได้!');
      proceedWithAttackExecution(true);
      return;
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

  // 🤖 กรณีฝ่ายตั้งรับเป็น AI: ให้ AI ตัดสินใจใช้สกิลเองพร้อมโชว์แบนเนอร์ให้ผู้เล่นเห็นชัดๆ
  if (!isLocalDefender) {
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
const aiConfig = {
  deckChoice: 'RANDOM', // 'RANDOM' | 'L01' | 'L02' | 'L03' | 'L04'
  difficulty: 'HARD',   // 'EASY' | 'NORMAL' | 'HARD'
  stepDelayMs: 1200     // หน่วงเวลา 1.2 วินาทีต่อ 1 แอ็กชันของ AI เพื่อให้ผู้เล่นมองตามทัน
};

function getAIDifficultyLabel(diff) {
  if (diff === 'EASY') return '🟢 ง่าย (Easy)';
  if (diff === 'NORMAL') return '🟡 ปานกลาง (Normal)';
  return '🔴 ยาก (Hard)';
}

function openAISetupModal() {
  let modal = document.getElementById('ai-setup-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'ai-setup-modal';
    modal.className = 'modal-overlay';
    modal.style.display = 'none';
    modal.style.zIndex = '240';
    modal.innerHTML = `
      <div class="modal-box" style="max-width: 520px; text-align: left;">
        <h2 style="color: #38bdf8; text-align: center; margin-bottom: 6px;">🤖 ตั้งค่าการดวลกับบอท (AI Settings)</h2>
        <p style="color: #94a3b8; font-size: 13px; text-align: center; margin-bottom: 16px;">
          เลือกระดับความยากและเด็คของ AI ที่ต้องการฝึกซ้อม
        </p>

        <div style="margin-bottom: 16px;">
          <div style="font-weight: bold; color: #fbbf24; margin-bottom: 8px; font-size: 14px;">⚙️ 1. เลือกระดับความยากของ AI:</div>
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px;" id="ai-diff-buttons">
            <button class="btn ai-diff-btn" data-diff="EASY" style="padding: 10px 6px; font-size: 13px;">🟢 ง่าย<br><span style="font-size:10px; font-weight:normal;">ไม่ใช้คอมโบ</span></button>
            <button class="btn ai-diff-btn" data-diff="NORMAL" style="padding: 10px 6px; font-size: 13px;">🟡 ปานกลาง<br><span style="font-size:10px; font-weight:normal;">ใช้สกิลพื้นฐาน</span></button>
            <button class="btn ai-diff-btn" data-diff="HARD" style="padding: 10px 6px; font-size: 13px;">🔴 ยาก<br><span style="font-size:10px; font-weight:normal;">จัดเต็มทุกคอมโบ</span></button>
          </div>
        </div>

        <div style="margin-bottom: 20px;">
          <div style="font-weight: bold; color: #38bdf8; margin-bottom: 8px; font-size: 14px;">🃏 2. เลือกเด็คของ AI:</div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;" id="ai-deck-buttons">
            <button class="btn ai-deck-btn" data-deck="RANDOM" style="padding: 10px; font-size: 13px; grid-column: span 2;">🎲 สุ่มเด็ค (Random)</button>
            <button class="btn ai-deck-btn" data-deck="L01" style="padding: 10px; font-size: 13px;">🔥 เด็คจิต (ฮีโร่)</button>
            <button class="btn ai-deck-btn" data-deck="L02" style="padding: 10px; font-size: 13px;">🐘 เด็คเหนือ (ไทย)</button>
            <button class="btn ai-deck-btn" data-deck="L03" style="padding: 10px; font-size: 13px;">⏳ เด็ควันสิ้นโลก</button>
            <button class="btn ai-deck-btn" data-deck="L04" style="padding: 10px; font-size: 13px;">🦖 เด็คไดโน (ศูนย์วิจัยไดโน)</button>
            <button class="btn ai-deck-btn" data-deck="L05" style="padding: 10px; font-size: 13px;">😈 เด็คปีศาจ</button>
            <button class="btn ai-deck-btn" data-deck="L06" style="padding: 10px; font-size: 13px;">🤪 เด็คโอ็ต</button>
          </div>
        </div>

        <div style="display: flex; gap: 10px;">
          <button class="btn" id="btn-start-ai-match" style="flex: 2; background: #16a34a; padding: 12px; font-size: 15px;">⚔️ เริ่มเกมเลย!</button>
          <button class="btn" id="btn-cancel-ai-setup" style="flex: 1; background: #475569; padding: 12px;">ยกเลิก</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    modal.querySelectorAll('.ai-diff-btn').forEach(btn => {
      btn.onclick = () => {
        aiConfig.difficulty = btn.getAttribute('data-diff');
        refreshAISetupModalUI();
      };
    });

    modal.querySelectorAll('.ai-deck-btn').forEach(btn => {
      btn.onclick = () => {
        aiConfig.deckChoice = btn.getAttribute('data-deck');
        refreshAISetupModalUI();
      };
    });

    document.getElementById('btn-cancel-ai-setup').onclick = () => {
      modal.style.display = 'none';
    };

    document.getElementById('btn-start-ai-match').onclick = () => {
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
    btn.style.background = isSelected ? '#dc2626' : '#1e293b';
    btn.style.border = isSelected ? '2px solid #fbbf24' : '1px solid #475569';
  });

  modal.querySelectorAll('.ai-deck-btn').forEach(btn => {
    const isSelected = btn.getAttribute('data-deck') === aiConfig.deckChoice;
    btn.style.background = isSelected ? '#2563eb' : '#1e293b';
    btn.style.border = isSelected ? '2px solid #38bdf8' : '1px solid #475569';
  });
}

function setupInGameControlBar() {
  ['btn-next-phase', 'btn-end-turn', 'btn-open-deck', 'btn-back-lobby'].forEach(btnId => {
    const el = document.getElementById(btnId);
    if (el) el.style.display = 'none';
  });

  const parentGroup = document.getElementById('btn-open-deck')?.parentElement;
  if (!parentGroup) return;

  if (!document.getElementById('btn-surrender-match')) {
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
          gameState.gameOver = true;
          gameState.pendingAction = null;
          disableControls();
          setLog('🏳️ คุณประกาศยอมแพ้ในแมตช์นี้!');
          renderGame();
          if (typeof pvpState !== 'undefined' && pvpState.isMultiplayer) {
            syncBoardToOpponent('🏳️ ฝ่ายตรงข้ามประกาศยอมแพ้! คุณเป็นฝ่ายชนะ!');
          }
          if (typeof playSoundEffect === 'function') {
            playSoundEffect('defeat');
          } else if (window.BOF_AUDIO) {
            window.BOF_AUDIO.playDefeat();
          }
          setTimeout(() => {
            showEndMatchModal('💀 คุณยอมแพ้การประลอง!', 'คุณได้กดยืนยันยอมแพ้ในแมตช์นี้');
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

  const isMobileView = window.innerWidth <= 768;

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

  document.getElementById('turn-indicator').textContent =
    `Turn ${gameState.turnCount} (${gameState.activeTurn === 'player' ? 'ตาคุณ' : 'ตาอีกฝ่าย'})`;
  document.getElementById('phase-indicator').textContent = gameState.phase;

  document.getElementById('normal-spell-quota').textContent = isMobileView
    ? `✨ ปกติ: ${player.spellQuota.normalUsed}/1`
    : `Normal Spell: ${player.spellQuota.normalUsed} / 1`;
  document.getElementById('reaction-spell-quota').textContent = isMobileView
    ? `🛡️ รีแอค: ${player.spellQuota.reactionUsed}/1`
    : `Reaction Spell: ${player.spellQuota.reactionUsed} / 1`;

  const passBtn = document.getElementById('btn-pass-turn-inline');
  if (passBtn) {
    const isWaitingDefense = (typeof pvpState !== 'undefined' && pvpState.waitingForDefense);
    passBtn.disabled = (gameState.activeTurn !== 'player' || gameState.gameOver || isWaitingDefense);
    if (isWaitingDefense) {
      passBtn.textContent = '⏳ รออีกฝ่ายป้องกัน...';
      passBtn.style.background = '#475569';
    } else if (gameState.phase === 'Main Phase') {
      passBtn.textContent = '⚔️ เฟสถัดไป (Battle Phase)';
      passBtn.style.background = '#0284c7';
    } else if (gameState.phase === 'Battle Phase') {
      passBtn.textContent = '⏭️ เฟสถัดไป (จบเทิร์น)';
      passBtn.style.background = '#d97706';
    } else {
      passBtn.textContent = '⏳ รอเทิร์นฝ่ายตรงข้าม...';
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
   หมวดที่ 10: ระบบหน้าต่างจัดเด็ค และการสร้างเกมพร้อมสุ่มเด็ค AI
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

  const saveBtn = document.getElementById('btn-save-start');
  if (saveBtn) saveBtn.textContent = '✅ บันทึกเด็ค';

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
      if (countInDeck < maxAllowed) {
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
    badge.textContent = `ใส่ในเด็ค: ${countInDeck} / ${maxAllowed} ใบ`;
    item.appendChild(cardEl);
    item.appendChild(badge);
    mainContainer.appendChild(item);
  });

  const count = currentDeckConfig.mainDeck.length;
  const statusEl = document.getElementById('deck-status-text');
  statusEl.textContent = `Leader: 1/1 | Main Deck: ${count}/20 ใบ`;
  statusEl.style.color = (count === 20) ? '#4ade80' : '#f87171';
  if (saveBtn) saveBtn.disabled = (count !== 20);
}

document.getElementById('btn-open-deck')?.addEventListener('click', openDeckBuilder);
document.getElementById('btn-reset-deck')?.addEventListener('click', () => {
  currentDeckConfig.mainDeck = [];
  renderDeckBuilder();
});

document.getElementById('btn-default-deck')?.addEventListener('click', () => {
  showChoiceModal(
    '🃏 เลือกเด็คมาตรฐาน',
    'คุณต้องการโหลดเด็คมาตรฐานชุดใดเข้าสู่กระดานจัดเด็ค?',
    [
      {
        label: '🔥 โหลด "เด็คจิต" (Leader: มายฮีโร่ เดจิต + 20 ใบ [เผ่าฮีโร่])',
        color: '#0284c7',
        onSelect: () => {
          currentDeckConfig.leaderId = 'L01';
          currentDeckConfig.mainDeck = [...DEFAULT_DECK_LIST];
          renderDeckBuilder();
        }
      },
      {
        label: '🐘 โหลด "เด็คเหนือ" (Leader: ขุนเหนือ + 20 ใบ [เผ่าไทย])',
        color: '#16a34a',
        onSelect: () => {
          currentDeckConfig.leaderId = 'L02';
          currentDeckConfig.mainDeck = [...DEFAULT_NUEA_DECK_LIST];
          renderDeckBuilder();
        }
      },
      {
        label: '⏳ โหลด "เด็ควันสิ้นโลก" (Leader: วันสิ้นโลก + 20 ใบ [เผ่าวันสิ้นโลก])',
        color: '#7c3aed',
        onSelect: () => {
          currentDeckConfig.leaderId = 'L03';
          currentDeckConfig.mainDeck = [...DEFAULT_DOOMSDAY_DECK_LIST];
          renderDeckBuilder();
        }
      },
      {
        label: '🦖 โหลด "เด็คไดโน" (Leader: ศูนย์วิจัยไดโน + 20 ใบ [เผ่าไดโน])',
        color: '#d97706',
        onSelect: () => {
          currentDeckConfig.leaderId = 'L04';
          currentDeckConfig.mainDeck = [...DEFAULT_DINO_DECK_LIST];
          renderDeckBuilder();
        }
      },
      {
        label: '😈 โหลด "เด็คปีศาจ" (Leader: ปีศาจ + 20 ใบ [เผ่าปีศาจ])',
        color: '#9333ea',
        onSelect: () => {
          currentDeckConfig.leaderId = 'L05';
          currentDeckConfig.mainDeck = [...DEFAULT_DEMON_DECK_LIST];
          renderDeckBuilder();
        }
      },
      {
        label: '🤪 โหลด "เด็คโอ็ต" (Leader: ไอโอ๊ตบ้าทุกสิ่ง + 20 ใบ [เผ่าบ้า])',
        color: '#ea580c',
        onSelect: () => {
          currentDeckConfig.leaderId = 'L06';
          currentDeckConfig.mainDeck = [...DEFAULT_OAT_DECK_LIST];
          renderDeckBuilder();
        }
      }
    ]
  );
});

document.getElementById('btn-save-start')?.addEventListener('click', () => {
  if (currentDeckConfig.mainDeck.length !== 20) return;
  localStorage.setItem('my_card_game_deck', JSON.stringify(currentDeckConfig));
  document.getElementById('deck-builder-modal').style.display = 'none';
  setLog('✅ บันทึกเด็คเรียบร้อยแล้ว!');
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
  gameState.isWaitingForChoice = false;
  gameState.gameOver = false;

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

  ensureZoneUIAndViewers();
  setupInGameControlBar();
  initArenaCustomBackground();
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
      gameState.turnCount = data.turnCount;
      gameState.activeTurn = data.activeTurnOnReceiver;
      gameState.phase = data.phase;
      gameState.gameOver = data.gameOver;
      gameState.ai = data.senderData;
      gameState.player = data.receiverData;
      gameState.ai.name = 'ฝ่ายตรงข้าม';
      gameState.player.name = 'Player';
      if (data.logMessage) _originalSetLog(data.logMessage);
      _originalRenderGame();
      checkGameOver();
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
  });
}

function joinPvpRoomAsGuest(codeInput) {
  const code = codeInput.trim();
  if (!code) { alert('กรุณากรอกรหัสห้อง'); return; }
  if (pvpState.peer) pvpState.peer.destroy();
  pvpState.peer = new Peer();
  pvpState.peer.on('open', () => {
    pvpState.conn = pvpState.peer.connect(`my-tcg-room-${code}`);
    pvpState.conn.on('data', handleIncomingPvpData);
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
  const openCardsFn = (e) => { if (e) e.preventDefault(); openZoneViewerModal('🔍 คลังการ์ดทั้งหมด (คลิกขวาที่การ์ดเพื่อดูรายละเอียด)', CARD_DATABASE, null); };

  document.getElementById('nav-deck')?.addEventListener('click', openDeckFn);
  document.getElementById('nav-cards')?.addEventListener('click', openCardsFn);
}

setupLobbyEvents();

/* ============================================================================
   COMBAT LOG DRAWER & SOUND CONTROLS BINDING
   ============================================================================ */
let activeCombatLogFilter = 'ALL';

function renderCombatLogModal() {
  const listEl = document.getElementById('combat-log-list');
  if (!listEl) return;
  listEl.innerHTML = '';

  const history = Array.isArray(gameState.matchLogHistory) ? gameState.matchLogHistory : [];
  const filtered = activeCombatLogFilter === 'ALL'
    ? history
    : history.filter(item => item.category === activeCombatLogFilter);

  if (filtered.length === 0) {
    listEl.innerHTML = '<div style="color:#64748b;text-align:center;padding:30px;font-size:14px;">ยังไม่มีประวัติในหมวดหมู่นี้</div>';
    return;
  }

  filtered.forEach(item => {
    const row = document.createElement('div');
    row.style.display = 'flex';
    row.style.gap = '6px';
    row.style.alignItems = 'center';
    row.style.padding = '8px 10px';
    row.style.borderRadius = '8px';
    row.style.fontSize = '13px';
    row.style.lineHeight = '1.4';
    row.style.background = item.isAI ? 'rgba(30, 27, 75, 0.7)' : 'rgba(15, 23, 42, 0.75)';
    row.style.borderLeft = item.isAI ? '4px solid #ef4444' : '4px solid #10b981';
    row.style.marginBottom = '6px';

    // 1. ชิปบอกเลขเทิร์น
    const turnBadge = document.createElement('span');
    turnBadge.style.fontSize = '10.5px';
    turnBadge.style.fontWeight = 'bold';
    turnBadge.style.padding = '2px 8px';
    turnBadge.style.borderRadius = '999px';
    turnBadge.style.whiteSpace = 'nowrap';
    turnBadge.style.background = '#1e293b';
    turnBadge.style.border = '1px solid #475569';
    turnBadge.style.color = '#e2e8f0';
    turnBadge.textContent = `เทิร์น ${item.turn}`;

    // 2. ชิปบอกฝั่ง (เรา vs คู่แข่ง)
    const sideBadge = document.createElement('span');
    sideBadge.style.fontSize = '10.5px';
    sideBadge.style.fontWeight = 'bold';
    sideBadge.style.padding = '2px 8px';
    sideBadge.style.borderRadius = '999px';
    sideBadge.style.whiteSpace = 'nowrap';
    if (item.isAI) {
      sideBadge.style.background = '#991b1b';
      sideBadge.style.color = '#fecaca';
      sideBadge.textContent = '🤖 คู่แข่ง';
    } else {
      sideBadge.style.background = '#065f46';
      sideBadge.style.color = '#a7f3d0';
      sideBadge.textContent = '👤 ฝั่งเรา';
    }

    // 3. ชิปประเภทการกระทำ (โจมตี / เวท / อัญเชิญ / ระบบ)
    const catBadge = document.createElement('span');
    catBadge.style.fontSize = '10px';
    catBadge.style.fontWeight = 'bold';
    catBadge.style.padding = '2px 7px';
    catBadge.style.borderRadius = '999px';
    catBadge.style.whiteSpace = 'nowrap';
    if (item.category === 'ATTACK') {
      catBadge.style.background = '#b91c1c';
      catBadge.style.color = '#fee2e2';
      catBadge.textContent = '⚔️ โจมตี';
    } else if (item.category === 'SPELL') {
      catBadge.style.background = '#7e22ce';
      catBadge.style.color = '#f3e8ff';
      catBadge.textContent = '✨ เวท';
    } else if (item.category === 'SUMMON') {
      catBadge.style.background = '#0f766e';
      catBadge.style.color = '#ccfbf1';
      catBadge.textContent = '🃏 อัญเชิญ';
    } else {
      catBadge.style.background = '#334155';
      catBadge.style.color = '#e2e8f0';
      catBadge.textContent = '📢 ระบบ';
    }

    const textSpan = document.createElement('span');
    textSpan.style.color = item.isAI ? '#e0e7ff' : '#f8fafc';
    textSpan.style.flex = '1';
    textSpan.style.margin = '0 4px';
    textSpan.textContent = item.message;

    const timeSpan = document.createElement('span');
    timeSpan.style.fontSize = '10px';
    timeSpan.style.color = '#64748b';
    timeSpan.style.whiteSpace = 'nowrap';
    timeSpan.textContent = item.time;

    row.appendChild(turnBadge);
    row.appendChild(sideBadge);
    row.appendChild(catBadge);
    row.appendChild(textSpan);
    row.appendChild(timeSpan);
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
  if (soundSwitch && window.BOF_AUDIO) {
    soundSwitch.checked = window.BOF_AUDIO.isSoundEnabled();
    soundSwitch.onchange = () => {
      window.BOF_AUDIO.setSoundEnabled(soundSwitch.checked);
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
    };
  }
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

  const updateStatus = () => {
    const savedBg = localStorage.getItem('bof_arena_bg');
    if (statusEl) {
      statusEl.style.display = savedBg ? 'block' : 'none';
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
