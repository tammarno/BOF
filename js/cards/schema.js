/* ทะเบียนสิ่งที่เกมรองรับ (แหล่งความจริงเดียวของรูปแบบการ์ด) + ตัวตรวจ validateCards()
   ทุกค่าในนี้ดึงจากโค้ดที่ js/game.js อ่านจริง:
   - blocks: case ใน EffectEngine.executeSingleStep (+ filterCards ที่บล็อกค้นการ์ดใช้)
   - costs: EffectEngine.runCostQueue / canActivateEffect
   - conditions: getEffectivePower / canActivateEffect
   required = พารามิเตอร์ที่ขาดแล้วบล็อกไม่ทำงาน/ทำงานผิดความหมาย; ที่โค้ดมีค่าตั้งต้นให้ถือเป็น optional
   เพิ่มบล็อกใหม่: เพิ่ม case ใน executeSingleStep + generateStepText แล้วเพิ่มรายการที่นี่ */
const CARD_SCHEMA = {
  triggers: [
    'ON_SUMMON', 'ON_DESTROY', 'ON_BATTLE_DESTROY', 'ACTIVATE_MAIN', 'ACTIVATE_LEADER',
    'CAST_SPELL', 'CONTINUOUS_POWER', 'CONTINUOUS_BOARD_AURA',
  ],
  costs: {
    DISCARD_HAND: { required: [], optional: ['count', 'triggerDiscardSkill'] },
    REST_SELF: { required: [], optional: [] },
    REST_ALLY: { required: [], optional: ['count'] },
    REDUCE_SELF_POWER: { required: [], optional: ['amount'] },
  },
  blocks: {
    DRAW: {
      required: [], optional: ['side', 'count', 'bonusIfGraveAtLeast', 'bonusCount'],
      enums: { side: ['SELF', 'OPPONENT'] },
      desc: 'จั่วการ์ด count ใบ (ถ้านรกมีอย่างน้อย bonusIfGraveAtLeast ใบ จั่ว bonusCount ใบแทน)',
    },
    HEAL_LEADER: {
      required: [], optional: ['side', 'amount'],
      enums: { side: ['SELF', 'OPPONENT'] },
      desc: 'ฟื้นฟู HP ลีดเดอร์ amount หน่วย (ไม่เกิน maxHp)',
    },
    DAMAGE_LEADER: {
      required: [], optional: ['side', 'amount'],
      enums: { side: ['SELF', 'OPPONENT'] },
      desc: 'ทำดาเมจใส่ลีดเดอร์ amount หน่วย',
    },
    MILL_DECK: {
      required: [], optional: ['side', 'count'],
      enums: { side: ['SELF', 'OPPONENT'] },
      desc: 'ส่งการ์ดใบบนสุดของกอง count ใบลงนรก',
    },
    DESTROY_UNIT: {
      required: ['target'], optional: ['count', 'select'],
      enums: { target: ['SELF', 'OPPONENT'], select: ['CHOOSE', 'ALL'] },
      desc: 'ทำลายยูนิตบนสนาม (เลือก count ใบ หรือทั้งหมดเมื่อ select เป็น ALL)',
    },
    ADD_POWER: {
      required: [], optional: ['target', 'count', 'amount', 'duration', 'filterTribe'],
      enums: { target: ['ALLY', 'SELF_UNIT', 'ALL_ALLIES'], duration: ['TURN', 'PERM'] },
      desc: 'เพิ่มพลังโจมตียูนิตฝั่งเรา +amount (TURN จนจบเทิร์น / PERM ถาวร)',
    },
    REDUCE_POWER: {
      required: [], optional: ['target', 'count', 'amount', 'duration'],
      enums: { target: ['OPPONENT', 'ALL_ENEMIES'], duration: ['TURN', 'PERM'] },
      desc: 'ลดพลังโจมตียูนิตฝ่ายตรงข้าม -amount (เลือก count ใบ หรือทุกใบเมื่อ ALL_ENEMIES) — ไม่ใส่ target หรือใช้ OPPONENT = เลือกศัตรู 1 ใบ; ALL_ENEMIES = ทุกใบ',
    },
    FLEX_POWER: {
      required: [], optional: ['plusAmount', 'minusAmount', 'duration'],
      enums: { duration: ['TURN', 'PERM'] },
      desc: 'เลือกยูนิต 1 ใบ: ฝั่งเราพลัง +plusAmount หรือฝั่งตรงข้ามพลัง -minusAmount',
    },
    BOUNCE_UNIT: {
      required: ['target'], optional: ['count'],
      enums: { target: ['SELF', 'OPPONENT'] },
      desc: 'ส่งยูนิตบนสนาม count ใบกลับขึ้นมือเจ้าของ',
    },
    GRANT_STATUS: {
      required: ['status'], optional: ['target', 'count'],
      enums: { target: ['ALLY', 'ALL_ALLIES'], status: ['INDESTRUCTIBLE', 'BURN_ON_KILL'] },
      desc: 'มอบสถานะพิเศษให้ยูนิตฝั่งเรา (INDESTRUCTIBLE ไม่ถูกทำลาย / BURN_ON_KILL ฆ่าแล้วทำดาเมจลีดเดอร์)',
    },
    MARK_END_TURN_DESTROY: {
      required: [], optional: ['target'],
      enums: {},
      desc: 'ทำลายยูนิตนี้เองเมื่อจบเทิร์น',
    },
    TRIGGER_ALLY_PASSIVE: {
      required: ['allyId'], optional: ['amount'],
      enums: {},
      desc: 'ยูนิตฝั่งเราที่มี id เป็น allyId ได้พลังถาวร +amount',
    },
    RECOVER_FROM_GRAVE: {
      required: [], optional: ['cardId', 'count', 'filterTribe', 'filterType', 'autoPickFirst'],
      enums: { filterType: ['SPELL', 'MONSTER'] },
      desc: 'นำการ์ดที่ตรงเงื่อนไข 1 ใบจากกองนรกขึ้นมือ',
    },
    SEARCH_DECK_OR_GRAVE: {
      required: ['destination'], optional: ['cardId', 'filterTribe', 'filterType', 'grantImmunity'],
      enums: { destination: ['HAND', 'BOARD'], filterType: ['SPELL', 'MONSTER'] },
      desc: 'ค้นการ์ดที่ตรงเงื่อนไขจากกองการ์ดหรือกองนรก ไปขึ้นมือ (HAND) หรือลงสนาม (BOARD)',
    },
    CARPET_BOMB_COMPOSITE: {
      required: [], optional: [],
      enums: {},
      desc: 'ระเบิดปูพรม: ผลตามจำนวนทหารเหนือ (NM02/NM03/NM04) บนสนามฝั่งเรา',
    },
  },
  conditions: {
    MIN_TRIBE_COUNT: { required: ['tribe', 'count'], optional: [] },
    ALLY_ON_BOARD: { required: ['cardId'], optional: [] },
    PER_OTHER_ALLY_TRIBE: { required: ['tribe'], optional: [] },
  },
  cardTypes: ['Leader', 'Monster', 'NormalSpell', 'ReactionSpell'],
  rarities: ['N', 'R', 'SR', 'Legend'],
};

// ระยะแก้ไข (Levenshtein) ≤ 2 ที่ใกล้ที่สุด ไม่งั้น null
function suggestName(name, candidates) {
  if (typeof name !== 'string' || !Array.isArray(candidates)) return null;
  const dist = (a, b) => {
    let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
    for (let i = 1; i <= a.length; i++) {
      const cur = [i];
      for (let j = 1; j <= b.length; j++) {
        cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      }
      prev = cur;
    }
    return prev[b.length];
  };
  let best = null, bestD = 3;
  for (const c of candidates) {
    if (typeof c !== 'string') continue;
    const d = dist(name, c);
    if (d < bestD) { best = c; bestD = d; }
  }
  return best;
}

// ตรวจฐานข้อมูลการ์ด + เด็ค คืน [{ cardId, path, message }] (ไม่ throw)
function validateCards(db = CARD_DATABASE, decks = DECK_LISTS) {
  try {
    if (!Array.isArray(db)) throw new Error('ฐานข้อมูลการ์ดไม่ใช่อาร์เรย์');
    const issues = [];
    const add = (cardId, path, message) => issues.push({ cardId: cardId === undefined ? null : cardId, path, message });
    const isObj = v => v !== null && typeof v === 'object' && !Array.isArray(v);
    const own = (map, key) => (typeof key === 'string' && Object.prototype.hasOwnProperty.call(map, key)) ? map[key] : undefined;
    const missing = v => v === undefined || v === null || v === '';
    const unknown = (label, value, list) => {
      const s = suggestName(String(value), list);
      return `${label} '${value}' ไม่รู้จัก` + (s ? ` (ใกล้เคียง: '${s}')` : '');
    };
    const checkParams = (cid, path, obj, spec) => {
      for (const p of spec.required || []) {
        if (missing(obj[p])) add(cid, path, `ขาดพารามิเตอร์ '${p}'`);
      }
      for (const [p, values] of Object.entries(spec.enums || {})) {
        if (!missing(obj[p]) && !values.includes(obj[p])) {
          add(cid, path, `ค่า '${obj[p]}' ใช้ไม่ได้กับ ${p} (ใช้ได้: ${values.join(', ')})`);
        }
      }
    };

    const byId = Object.create(null);
    db.forEach((card, ci) => {
      if (!isObj(card)) { add(null, `[${ci}]`, 'การ์ดต้องเป็นอ็อบเจ็กต์'); return; }
      const cid = missing(card.id) ? null : card.id;
      if (cid === null) add(null, `[${ci}].id`, 'ขาด id');
      else if (byId[cid]) add(cid, 'id', `id '${cid}' ซ้ำ`);
      else byId[cid] = card;

      if (!CARD_SCHEMA.cardTypes.includes(card.type)) add(cid, 'type', unknown('type', card.type, CARD_SCHEMA.cardTypes));
      if (card.rarity !== undefined && !CARD_SCHEMA.rarities.includes(card.rarity)) {
        add(cid, 'rarity', unknown('rarity', card.rarity, CARD_SCHEMA.rarities));
      }
      if (missing(card.name)) add(cid, 'name', 'ขาด name');
      if (missing(card.image)) add(cid, 'image', 'ขาด image');

      if (card.effects === undefined) return;
      if (!Array.isArray(card.effects)) { add(cid, 'effects', 'effects ต้องเป็นอาร์เรย์'); return; }
      card.effects.forEach((eff, ei) => {
        const ep = `effects[${ei}]`;
        if (!isObj(eff)) { add(cid, ep, 'effect ต้องเป็นอ็อบเจ็กต์'); return; }

        if (missing(eff.trigger)) add(cid, `${ep}.trigger`, 'ขาด trigger');
        else if (!CARD_SCHEMA.triggers.includes(eff.trigger)) add(cid, `${ep}.trigger`, unknown('trigger', eff.trigger, CARD_SCHEMA.triggers));

        if (eff.condition !== undefined) {
          const cp = `${ep}.condition`;
          if (!isObj(eff.condition)) add(cid, cp, 'condition ต้องเป็นอ็อบเจ็กต์');
          else {
            const spec = own(CARD_SCHEMA.conditions, eff.condition.type);
            if (!spec) add(cid, cp, unknown('condition', eff.condition.type, Object.keys(CARD_SCHEMA.conditions)));
            else checkParams(cid, cp, eff.condition, spec);
          }
        }

        if (eff.costs !== undefined) {
          if (!Array.isArray(eff.costs)) add(cid, `${ep}.costs`, 'costs ต้องเป็นอาร์เรย์');
          else eff.costs.forEach((cost, ki) => {
            const kp = `${ep}.costs[${ki}]`;
            if (!isObj(cost)) { add(cid, kp, 'cost ต้องเป็นอ็อบเจ็กต์'); return; }
            const spec = own(CARD_SCHEMA.costs, cost.type);
            if (!spec) add(cid, kp, unknown('cost', cost.type, Object.keys(CARD_SCHEMA.costs)));
            else checkParams(cid, kp, cost, spec);
          });
        }

        if (eff.steps !== undefined) {
          if (!Array.isArray(eff.steps)) add(cid, `${ep}.steps`, 'steps ต้องเป็นอาร์เรย์');
          else eff.steps.forEach((step, si) => {
            const sp = `${ep}.steps[${si}]`;
            if (!isObj(step)) { add(cid, sp, 'step ต้องเป็นอ็อบเจ็กต์'); return; }
            if (missing(step.block)) { add(cid, sp, 'ขาด block'); return; }
            const spec = own(CARD_SCHEMA.blocks, step.block);
            if (!spec) add(cid, sp, unknown('บล็อก', step.block, Object.keys(CARD_SCHEMA.blocks)));
            else checkParams(cid, sp, step, spec);
          });
        }
      });
    });

    // เด็ค: คีย์ต้องเป็นลีดเดอร์, ครบ 20 ใบ, id มีจริง, ไม่เกิน maxCopies (ค่าตั้งต้น 2 ตาม getCardMaxCopies)
    if (!isObj(decks)) {
      add(null, 'DECK_LISTS', 'DECK_LISTS ต้องเป็นอ็อบเจ็กต์');
      return issues;
    }
    for (const [key, list] of Object.entries(decks)) {
      const dp = `DECK_LISTS.${key}`;
      const leader = byId[key];
      if (!leader) add(key, dp, `คีย์เด็ค '${key}' ไม่มีการ์ด Leader id นี้`);
      else if (leader.type !== 'Leader') add(key, dp, `คีย์เด็ค '${key}' ไม่ใช่การ์ด Leader (type '${leader.type}')`);
      if (!Array.isArray(list)) { add(key, dp, `เด็ค ${key} ต้องเป็นอาร์เรย์ของ id`); continue; }
      if (list.length !== 20) add(key, dp, `เด็ค ${key} มี ${list.length} ใบ (ต้อง 20)`);
      const counts = Object.create(null);
      list.forEach((id, i) => {
        if (!byId[id]) { add(typeof id === 'string' ? id : null, `${dp}[${i}]`, `id '${id}' ในเด็ค ${key} ไม่มีการ์ดนี้`); return; }
        counts[id] = (counts[id] || 0) + 1;
      });
      for (const [id, n] of Object.entries(counts)) {
        const max = byId[id].maxCopies !== undefined ? byId[id].maxCopies : 2;
        if (n > max) add(id, dp, `'${id}' เกิน maxCopies (${max})`);
      }
    }
    return issues;
  } catch (e) {
    return [{ cardId: null, path: 'validateCards', message: 'ตัวตรวจการ์ดทำงานผิดพลาด: ' + (e && e.message ? e.message : String(e)) }];
  }
}
