// ธีมสนามตามเด็ค + ออร่าเทิร์น + หลังการ์ดประจำเด็ค + เอฟเฟกต์โจมตี/เหตุการณ์ประจำเด็ค + ฉากจบเกม
// ไม่แตะตรรกะเกม: ห่อ renderGame / playAttackVisualAnimation / showEndMatchModal แล้วเทียบสถานะกระดานก่อน-หลัง
// หน้าตาอยู่ใน css/deck-themes.css · เปิด index.html?fxpreview เพื่อกดดูทุกเอฟเฟกต์บนกระดานจริง
(function () {
  const COLORS = { L01: '#3ee08f', L02: '#f0a347', L03: '#e8c977', L04: '#a3e635', L05: '#c084fc', L06: '#fb923c' };
  const FULL_MATS = { L01: 'deku', L03: 'doom' }; // เด็คที่มีสนามเต็มรูปแบบ (ที่เหลือได้แค่ออร่าสีประจำเด็ค)
  const DOOM_PAIR = ['DM01', 'DM02']; // โอนามิ + โรเซเลีย (คู่หู)
  const GAUGE_STEP = 25;               // บัฟฮีโร่ 1 ครั้ง = เกจฟูลคาวล์ +25%
  const reduceMotion = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const halves = () => ({
    player: document.querySelector('#bof-game-arena .player-mat-half'),
    ai: document.querySelector('#bof-game-arena .ai-mat-half'),
  });
  const arena = () => document.getElementById('bof-game-arena');
  const leaderId = side => (side && side.leader && side.leader.id) || '';
  const slotEl = (key, i) => (typeof getSlotElement === 'function' ? getSlotElement(key === 'player', i) : null);
  const power = (card, side) => (typeof getEffectivePower === 'function' ? getEffectivePower(card, side) : (card.power || 0));
  const basePower = card => (card.basePower !== undefined ? card.basePower : card.power) || 0;

  // ลายที่ซื้อจากร้านมีสิทธิ์ก่อน (เฉพาะฝั่งผู้เล่น เพราะร้านแต่งได้แค่ฝั่งเรา)
  const boughtBack = () => { const v = document.documentElement.dataset.cardBack; return !!v && v !== 'default'; };
  const boughtArena = () => { const v = arena()?.dataset.arenaTheme; return !!v && v !== 'default'; };

  // ---------- เลเยอร์ฉากหลังของสนาม ----------
  const DEKU_FX = `<svg viewBox="0 0 1000 300" preserveAspectRatio="none">
    <path class="bolt b1" d="M0 60 L120 95 L95 115 L240 170 L215 182 L330 230"/>
    <path class="bolt b2" d="M1000 40 L880 100 L905 118 L760 175 L790 190 L690 250"/>
    <path class="bolt b3" d="M300 300 L380 220 L360 205 L450 140"/>
    <path class="bolt b4" d="M700 300 L630 230 L655 215 L560 150"/></svg>`;

  const NUMERALS = ['XII', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];
  const DOOM_FX = `<svg class="doom-clock" viewBox="-100 -100 200 200">
    <g class="dial"><circle r="94" class="ring"/><circle r="80" class="ring dash"/>
    ${NUMERALS.map((n, i) => {
      const a = (i * 30 - 90) * Math.PI / 180;
      return `<text x="${(68 * Math.cos(a)).toFixed(1)}" y="${(68 * Math.sin(a) + 4).toFixed(1)}">${n}</text>`;
    }).join('')}</g>
    <line class="hand minute" x1="0" y1="6" x2="0" y2="-76"/>
    <line class="hand hour" x1="0" y1="5" x2="0" y2="-48"/>
    <line class="hand sweep" x1="0" y1="10" x2="0" y2="-82"/><circle r="4" class="pin"/></svg>`;

  function fxLayer(half, kind) {
    let el = half.querySelector(':scope > .deck-mat-fx');
    if (el && el.dataset.kind === kind) return el;
    if (el) el.remove();
    if (!kind) return null;
    el = document.createElement('div');
    el.className = 'deck-mat-fx';
    el.dataset.kind = kind;
    el.setAttribute('aria-hidden', 'true');
    el.innerHTML = kind === 'deku' ? DEKU_FX : DOOM_FX;
    half.prepend(el);
    return el;
  }

  // เกจฟูลคาวล์ข้างลีดเดอร์เดจิต
  function gaugeEl(half, show) {
    const field = half.querySelector('.mat-center-field');
    let g = field && field.querySelector(':scope > .deku-gauge');
    if (!show) { if (g) g.remove(); return null; }
    if (!field) return null;
    if (!g) {
      g = document.createElement('div');
      g.className = 'deku-gauge';
      g.setAttribute('role', 'meter');
      g.setAttribute('aria-label', 'เกจฟูลคาวล์');
      g.setAttribute('aria-valuemin', '0');
      g.setAttribute('aria-valuemax', '100');
      g.innerHTML = '<div class="bar"><i></i></div><b>0%</b>';
      field.appendChild(g);
    }
    return g;
  }
  function setGauge(key, half, v) {
    const g = gaugeEl(half, true);
    if (!g) return;
    g.style.setProperty('--g', v / 100);
    g.setAttribute('aria-valuenow', v);
    g.querySelector('b').textContent = v + '%';
    g.classList.toggle('full', v >= 100);
  }

  // ---------- สถานะต่อฝั่ง (ใช้เทียบก่อน-หลังทุกครั้งที่ render) ----------
  // เกมใหม่ = เทิร์นนับถอยหลัง หรือ gameOver กลับเป็น false (ไม่ใช้ identity ของ gameState.player เพราะ PvP แทนที่ object ทุกแพ็กเก็ต)
  let lastCount = 0, wasOver = false;
  let mem = {};
  const freshMem = () => ({ uids: [null, null, null], pow: {}, gauge: 0, primed: false });

  const demo = { buff: {}, pair: {} }; // ใช้เฉพาะแผงตัวอย่าง ?fxpreview (บังคับโชว์โดยไม่ต้องมีการ์ดจริง)

  let lastTurn = null;
  function sync() {
    if (typeof gameState === 'undefined' || !gameState || !gameState.player) return;
    const count = gameState.turnCount || 0;
    const h = halves();
    if (!mem.player || count < lastCount || (wasOver && !gameState.gameOver)) {
      mem = { player: freshMem(), ai: freshMem() }; lastTurn = null;
      for (const k of ['player', 'ai']) h[k]?.classList.remove('mat-defeated');
    }
    lastCount = count; wasOver = !!gameState.gameOver;
    for (const key of ['player', 'ai']) {
      const half = h[key];
      if (!half) continue;
      const side = gameState[key];
      const id = leaderId(side);
      half.dataset.deck = id;
      half.style.setProperty('--deck-c', COLORS[id] || '#94a3b8');
      const ownMat = key === 'ai' || !boughtArena();
      const mat = ownMat ? (FULL_MATS[id] || '') : '';
      if (mat) half.dataset.mat = mat; else delete half.dataset.mat;
      fxLayer(half, mat);
      if (id && (key === 'ai' || !boughtBack())) half.dataset.back = id; else delete half.dataset.back;

      const lead = side.leader || {};
      const max = lead.maxHp || 6;
      half.classList.toggle('hp-critical', lead.hp > 0 && lead.hp <= Math.ceil(max / 3));

      if (id === 'L01') setGauge(key, half, mem[key].gauge); else gaugeEl(half, false);
      if (mat === 'doom') syncClock(half, lead.hp, max);
      boardEvents(key, side, id, half);
    }
    if (h.ai && leaderId(gameState.ai) === 'L03' && h.ai.dataset.mat) syncPair('ai', h.ai);
    if (h.player && leaderId(gameState.player) === 'L03' && h.player.dataset.mat) syncPair('player', h.player);

    const turn = gameState.gameOver ? null : gameState.activeTurn;
    if (turn === lastTurn) return;
    for (const key of ['player', 'ai']) {
      const half = h[key];
      if (!half) continue;
      const wasActive = lastTurn === key;
      const isActive = turn === key;
      half.classList.toggle('turn-active', isActive);
      half.classList.toggle('turn-idle', !!turn && !isActive);
      if (isActive) { restartClass(half, 'turn-in', 1100); turnSound(leaderId(gameState[key])); }
      if (wasActive && !isActive) restartClass(half, 'turn-out', 520);
    }
    lastTurn = turn;
  }

  // ลงการ์ด / บัฟ / ถูกทำลาย / วิวัฒน์ — จับจากความต่างของกระดาน
  function boardEvents(key, side, id, half) {
    const m = mem[key];
    const now = side.board.map(c => (c ? c.uid : null));
    const foe = key === 'player' ? 'ai' : 'player';
    const foeId = leaderId(gameState[foe]);
    side.board.forEach((card, i) => {
      const el = slotEl(key, i);
      if (!card) { if (el) el.classList.toggle('deku-buffed', !!demo.buff[key]); return; }
      const p = power(card, side);
      const fresh = !m.uids.includes(card.uid);
      if (m.primed && fresh) {
        if (id === 'L03' && card.futureBaseId) fx.doomEvolve(key, i);
        else if (id === 'L01' && card.tribe === 'ฮีโร่') fx.dekuStrike(key, i);
        else if (id === 'L03') fx.doomSummon(key, i);
      }
      if (id === 'L01' && el) el.classList.toggle('deku-buffed', !!demo.buff[key] || (card.type === 'Monster' && p > basePower(card)));
      const before = m.pow[card.uid];
      if (m.primed && id === 'L01' && before !== undefined && p > before && card.tribe === 'ฮีโร่') {
        m.gauge = Math.min(100, m.gauge + GAUGE_STEP);
        if (m.gauge >= 100) { fx.dekuFullCowl(key); m.gauge = 0; }
      }
      m.pow[card.uid] = p;
    });
    if (m.primed && foeId === 'L01') {
      m.uids.forEach((u, i) => { if (u !== null && !now.includes(u)) fx.smash(key, i); });
    }
    m.uids = now;
    m.primed = true;
  }

  // เข็มสั้นชี้ตามเทิร์น / เข็มยาวเดินเข้าหา XII เมื่อ HP ลด
  function syncClock(half, hp, max) {
    const svg = half.querySelector('.doom-clock');
    if (!svg) return;
    const turn = Math.max(1, gameState.turnCount || 1);
    svg.querySelector('.hour').style.transform = `rotate(${(turn % 12) * 30}deg)`;
    const left = Math.max(0, Math.min(1, (hp || 0) / max));
    svg.querySelector('.minute').style.transform = `rotate(${360 - 180 * left}deg)`;
  }

  // ริบบิ้นทองเชื่อมคู่หูโอนามิ-โรเซเลีย: ลอยหน้าการ์ด เดินเลียบขอบล่างของสองใบ + กรอบทองที่ทั้งคู่
  function syncPair(key, half) {
    let svg = half.querySelector(':scope > .doom-pair');
    if (!svg) {
      svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('class', 'doom-pair');
      svg.setAttribute('aria-hidden', 'true');
      svg.innerHTML = '<path/>';
      half.appendChild(svg);
    }
    const board = gameState[key].board;
    const idx = demo.pair[key] ? [0, 2] : DOOM_PAIR.map(pid => board.findIndex(c => c && c.id === pid));
    for (let i = 0; i < 3; i++) slotEl(key, i)?.classList.toggle('doom-paired', idx.includes(i) && !idx.includes(-1));
    if (idx.includes(-1)) { svg.classList.remove('on'); return; }
    const L = half.getBoundingClientRect();
    const [a, b] = idx.map(i => { const r = slotEl(key, i).getBoundingClientRect(); return { x: r.left + r.width / 2 - L.left, y: r.bottom - L.top - 4 }; });
    const dip = Math.max(18, Math.abs(b.x - a.x) * 0.12);
    svg.setAttribute('viewBox', `0 0 ${L.width} ${L.height}`);
    svg.querySelector('path').setAttribute('d', `M${a.x} ${a.y} C${a.x + 30} ${a.y + dip} ${b.x - 30} ${b.y + dip} ${b.x} ${b.y}`);
    svg.classList.add('on');
  }

  function restartClass(el, cls, ms) {
    if (!el) return;
    el.classList.remove(cls);
    void el.offsetWidth;
    el.classList.add(cls);
    clearTimeout(el['_t_' + cls]);
    el['_t_' + cls] = setTimeout(() => el.classList.remove(cls), ms);
  }

  // ---------- ชั้นเอฟเฟกต์ลอยเหนือกระดาน ----------
  let overlay = null;
  function fxRoot() {
    if (overlay && overlay.isConnected) return overlay;
    overlay = document.createElement('div');
    overlay.id = 'deck-attack-fx';
    overlay.setAttribute('aria-hidden', 'true');
    document.body.appendChild(overlay);
    return overlay;
  }
  const center = el => { const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width, h: r.height }; };
  function spawn(html, cls, x, y, ms, extra) {
    const el = document.createElement('div');
    el.className = 'dfx ' + cls;
    el.style.left = x + 'px';
    el.style.top = y + 'px';
    if (extra) for (const k in extra) el.style.setProperty(k, extra[k]);
    el.innerHTML = html || '';
    fxRoot().appendChild(el);
    setTimeout(() => el.remove(), ms);
    return el;
  }
  function svgSpawn(cls, inner, ms) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'dfx ' + cls);
    svg.innerHTML = inner;
    fxRoot().appendChild(svg);
    setTimeout(() => svg.remove(), ms);
  }
  function jagged(from, to, amp) {
    const dx = to.x - from.x, dy = to.y - from.y;
    const len = Math.hypot(dx, dy) || 1, nx = -dy / len, ny = dx / len;
    let d = `M${from.x} ${from.y}`;
    for (let i = 1; i < 7; i++) {
      const t = i / 7, k = (i % 2 ? 1 : -1) * (amp * 0.6 + Math.random() * amp);
      d += ` L${from.x + dx * t + nx * k} ${from.y + dy * t + ny * k}`;
    }
    return d + ` L${to.x} ${to.y}`;
  }
  const quiet = () => reduceMotion();

  const fx = {
    // เดจิต 2: ลงฮีโร่ → สายฟ้าฟาดจากฟ้า + เศษหิน
    dekuStrike(key, i) {
      const el = slotEl(key, i); if (!el || quiet()) return;
      const c = center(el);
      svgSpawn('deku-trail big', `<path d="${jagged({ x: c.x + 30, y: 0 }, c, 14)}" pathLength="1"/>`, 620);
      setTimeout(() => {
        spawn('', 'deku-shock', c.x, c.y, 600, { '--s': c.w / 60 });
        for (let n = 0; n < 8; n++) {
          const a = Math.PI + (n / 7) * Math.PI;
          spawn('', 'deku-debris', c.x, c.y + c.h * 0.35, 650, { '--tx': Math.cos(a) * (40 + Math.random() * 40) + 'px', '--ty': Math.sin(a) * (50 + Math.random() * 40) + 'px', '--rot': Math.random() * 300 + 'deg' });
        }
      }, 200);
    },
    // เดจิต 1: เกจเต็ม 100% → สายฟ้าทั้งสนามปะทุพร้อมกัน
    dekuFullCowl(key) {
      const half = halves()[key]; if (!half) return;
      restartClass(half, 'full-cowl', 1400);
      if (quiet()) return;
      const r = half.getBoundingClientRect();
      for (let n = 0; n < 6; n++) {
        const y1 = r.top + Math.random() * r.height, y2 = r.top + Math.random() * r.height;
        setTimeout(() => svgSpawn('deku-trail', `<path d="${jagged({ x: r.left, y: y1 }, { x: r.right, y: y2 }, 22)}" pathLength="1"/>`, 620), n * 90);
      }
      sound.crackle(0.6);
    },
    // เดจิต 4: การ์ดศัตรูถูกทำลาย → SMASH!!
    smash(key, i) {
      const el = slotEl(key, i); if (!el || quiet()) return;
      const c = center(el);
      spawn('SMASH!!', 'deku-smash', c.x, c.y, 900);
    },
    // วันสิ้นโลก 2: ลงการ์ด → วงเลขโรมันหมุนแล้วหดเข้าการ์ด
    doomSummon(key, i) {
      const el = slotEl(key, i); if (!el || quiet()) return;
      const c = center(el);
      const ring = `<svg viewBox="-60 -60 120 120"><circle r="52" class="ring"/>${NUMERALS.map((n, k) => {
        const a = (k * 30 - 90) * Math.PI / 180;
        return `<text x="${(44 * Math.cos(a)).toFixed(1)}" y="${(44 * Math.sin(a) + 3).toFixed(1)}">${n}</text>`;
      }).join('')}</svg>`;
      spawn(ring, 'doom-summon', c.x, c.y, 800, { '--s': c.w / 80 });
    },
    // วันสิ้นโลก 3: วิวัฒน์ → ฉากซีด หน้าปัดหมุนย้อน แล้วแสงทอง
    doomEvolve(key, i) {
      const el = slotEl(key, i); if (!el) return;
      if (quiet()) { restartClass(el, 'doom-evolved', 900); return; }
      const c = center(el);
      restartClass(arena(), 'time-rewind', 900);
      const dial = `<svg viewBox="-50 -50 100 100"><circle r="44"/><circle r="36" class="dash"/>
        <line class="hand" x1="0" y1="0" x2="0" y2="-34"/><line class="hand short" x1="0" y1="0" x2="0" y2="-22"/></svg>`;
      spawn(dial, 'doom-rewind', c.x, c.y, 900, { '--s': c.w / 60 });
      setTimeout(() => { spawn('', 'doom-flash', c.x, c.y, 600, { '--s': c.w / 60 }); restartClass(el, 'doom-evolved', 900); }, 620);
      sound.tick(true);
    },
    // ใช้ร่วม: ฉากจบเกม
    endScene(winnerKey) {
      const h = halves();
      const loserKey = winnerKey === 'player' ? 'ai' : 'player';
      if (h[loserKey]) h[loserKey].classList.add('mat-defeated');
      const id = leaderId(gameState[winnerKey]);
      const c = { x: innerWidth / 2, y: innerHeight / 2 };
      if (id === 'L01') {
        for (let n = 0; n < 9; n++) setTimeout(() => {
          const y1 = Math.random() * innerHeight, y2 = Math.random() * innerHeight;
          svgSpawn('deku-trail big', `<path d="${jagged({ x: -20, y: y1 }, { x: innerWidth + 20, y: y2 }, 30)}" pathLength="1"/>`, 620);
        }, n * 110);
        setTimeout(() => spawn('', 'deku-shock big', c.x, c.y, 600, { '--s': 4 }), 500);
        sound.crackle(1.1);
      } else if (id === 'L03') {
        const dial = `<svg viewBox="-100 -100 200 200"><circle r="92" class="ring"/>${NUMERALS.map((n, k) => {
          const a = (k * 30 - 90) * Math.PI / 180;
          return `<text x="${(72 * Math.cos(a)).toFixed(1)}" y="${(72 * Math.sin(a) + 5).toFixed(1)}">${n}</text>`;
        }).join('')}<line class="hand big" x1="0" y1="0" x2="0" y2="-80"/><line class="hand short" x1="0" y1="0" x2="0" y2="-54"/></svg>`;
        spawn(dial, 'doom-midnight', c.x, c.y, 1500);
        setTimeout(() => spawn('', 'doom-flash big', c.x, c.y, 800, { '--s': 6 }), 900);
        sound.chime();
      } else {
        spawn('', 'plain-ring big', c.x, c.y, 700, { '--c': COLORS[id] || '#facc15', '--s': 5 });
      }
    },
  };

  // ---------- เสียง (สังเคราะห์เอง ไม่ใช้ไฟล์) ----------
  let actx = null;
  const ac = () => {
    if (window.BOF_AUDIO && typeof BOF_AUDIO.isSoundEnabled === 'function' && !BOF_AUDIO.isSoundEnabled()) return null;
    try { actx = actx || new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; }
    if (actx.state === 'suspended') actx.resume().catch(() => {});
    return actx;
  };
  const sound = {
    crackle(dur = 0.35) {
      const a = ac(); if (!a) return;
      const n = Math.floor(a.sampleRate * dur), buf = a.createBuffer(1, n, a.sampleRate), d = buf.getChannelData(0);
      for (let k = 0; k < n; k++) d[k] = (Math.random() * 2 - 1) * (Math.random() < 0.18 ? 1 : 0.08) * (1 - k / n);
      const src = a.createBufferSource(), bp = a.createBiquadFilter(), g = a.createGain();
      src.buffer = buf; bp.type = 'bandpass'; bp.frequency.value = 3200; bp.Q.value = 0.8; g.gain.value = 0.22;
      src.connect(bp).connect(g).connect(a.destination); src.start();
    },
    tick(fast) {
      const a = ac(); if (!a) return;
      const at = a.currentTime;
      [[0, 1400], [fast ? 0.09 : 0.2, 1000]].forEach(([t, f]) => {
        const o = a.createOscillator(), g = a.createGain();
        o.type = 'square'; o.frequency.value = f;
        g.gain.setValueAtTime(0.0001, at + t); g.gain.exponentialRampToValueAtTime(0.12, at + t + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, at + t + 0.05);
        o.connect(g).connect(a.destination); o.start(at + t); o.stop(at + t + 0.06);
      });
    },
    chime() {
      const a = ac(); if (!a) return;
      const at = a.currentTime;
      [0, 0.35, 0.7].forEach((t, k) => {
        const o = a.createOscillator(), g = a.createGain();
        o.type = 'sine'; o.frequency.value = [523, 659, 784][k];
        g.gain.setValueAtTime(0.0001, at + t); g.gain.exponentialRampToValueAtTime(0.18, at + t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, at + t + 1.2);
        o.connect(g).connect(a.destination); o.start(at + t); o.stop(at + t + 1.3);
      });
    },
  };
  function turnSound(id) {
    if (id === 'L01') sound.crackle(0.3);
    else if (id === 'L03') sound.tick(false);
  }

  // ---------- เอฟเฟกต์โจมตี ----------
  function dekuAttack(from, to, big) {
    svgSpawn('deku-trail' + (big ? ' big' : ''), `<path d="${jagged(from, to, big ? 21 : 14)}" pathLength="1"/>`, 620);
    setTimeout(() => {
      spawn('', 'deku-shock' + (big ? ' big' : ''), to.x, to.y, 600, { '--s': to.w / 60 });
      restartClass(arena(), 'deck-shake', 320);
    }, 220);
  }

  function doomAttack(from, to, big) {
    restartClass(arena(), 'time-stop', 420);
    const clock = `<svg viewBox="-50 -50 100 100"><circle r="44"/><circle r="36" class="dash"/>
      <line class="hand" x1="0" y1="0" x2="0" y2="-34"/></svg>`;
    spawn(clock, 'doom-dial' + (big ? ' big' : ''), to.x, to.y, 640, { '--s': to.w / 70 });
    setTimeout(() => {
      const n = big ? 14 : 9;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + Math.random() * 0.4;
        const r = (big ? 90 : 60) + Math.random() * 30;
        spawn('', 'doom-shard', to.x, to.y, 520, { '--tx': Math.cos(a) * r + 'px', '--ty': Math.sin(a) * r + 'px', '--rot': (Math.random() * 360) + 'deg' });
      }
    }, 330);
  }

  function plainAttack(to, color, big) {
    spawn('', 'plain-ring' + (big ? ' big' : ''), to.x, to.y, 560, { '--c': color, '--s': to.w / 60 });
  }

  function wrapAttack() {
    const orig = window.playAttackVisualAnimation;
    if (typeof orig !== 'function') return;
    window.playAttackVisualAnimation = function (attacker, defender, attackerSlot, targetType, targetSlot) {
      const r = orig.apply(this, arguments);
      try {
        if (reduceMotion() || typeof getSlotElement !== 'function') return r;
        const isAttPlayer = attacker === gameState.player;
        const fromEl = getSlotElement(isAttPlayer, attackerSlot === 'leader' ? 'leader' : attackerSlot);
        const toEl = getSlotElement(defender === gameState.player, targetType === 'leader' ? 'leader' : targetSlot);
        if (!fromEl || !toEl) return r;
        const id = leaderId(attacker);
        const big = attackerSlot === 'leader' || attackerSlot === null;
        const from = center(fromEl), to = center(toEl);
        const hitEl = toEl.querySelector('.card') || toEl;
        hitEl.style.setProperty('--hit-c', COLORS[id] || '#dc2626');
        hitEl.classList.add('deck-hit');
        setTimeout(() => hitEl.classList.remove('deck-hit'), 900);
        if (id === 'L01') dekuAttack(from, to, big);
        else if (id === 'L03') doomAttack(from, to, big);
        else setTimeout(() => plainAttack(to, COLORS[id] || '#dc2626', big), 200);
      } catch (e) { console.warn('deck-themes attack fx', e); }
      return r;
    };
  }

  // ---------- ฉากจบเกม: เล่นฉากของผู้ชนะก่อน แล้วค่อยเปิดหน้าต่างสรุปผล ----------
  const SCENE_MS = 1600;
  function wrapEndModal() {
    const orig = window.showEndMatchModal;
    if (typeof orig !== 'function') return;
    window.showEndMatchModal = function (title) {
      const args = arguments, self = this;
      try {
        if (reduceMotion() || !gameState || !gameState.player) return orig.apply(self, args);
        const pDead = gameState.player.leader.hp <= 0, aDead = gameState.ai.leader.hp <= 0;
        const lost = pDead || /พ่ายแพ้|แพ้/.test(String(title || ''));
        const winner = aDead ? 'player' : (lost ? 'ai' : 'player');
        fx.endScene(winner);
        setTimeout(() => orig.apply(self, args), SCENE_MS);
      } catch (e) { console.warn('deck-themes end scene', e); return orig.apply(self, args); }
    };
  }

  // ---------- โหมดตัวอย่าง: index.html?fxpreview ----------
  function previewPanel() {
    if (!/[?&]fxpreview\b/.test(location.search)) return;
    const firstSlot = key => { const b = gameState[key].board; const i = b.findIndex(Boolean); return i < 0 ? 1 : i; };
    const side = id => (leaderId(gameState.player) === id ? 'player' : 'ai');
    const foe = k => (k === 'player' ? 'ai' : 'player');
    const bump = (key, by) => { mem[key].gauge = Math.min(100, mem[key].gauge + by); if (mem[key].gauge >= 100) { fx.dekuFullCowl(key); mem[key].gauge = 0; } sync(); };
    const hp = (key, v) => { gameState[key].leader.hp = v; renderGame(); };
    const items = [
      ['เดจิต', [
        ['เกจ +25%', () => bump(side('L01'), 25)],
        ['ฟูลคาวล์ 100%', () => bump(side('L01'), 100)],
        ['ฮีโร่ลงสนาม', () => fx.dekuStrike(side('L01'), 1)],
        ['การ์ดถูกบัฟ', () => { const k = side('L01'); demo.buff[k] = !demo.buff[k]; sync(); }],
        ['SMASH!!', () => fx.smash(foe(side('L01')), firstSlot(foe(side('L01'))))],
        ['HP ใกล้หมด', () => hp(side('L01'), 1)],
      ]],
      ['วันสิ้นโลก', [
        ['เทิร์นถัดไป (เข็มสั้น)', () => { gameState.turnCount += 1; renderGame(); }],
        ['การ์ดลงสนาม', () => fx.doomSummon(side('L03'), 1)],
        ['วิวัฒน์ร่างอนาคต', () => fx.doomEvolve(side('L03'), firstSlot(side('L03')))],
        ['คู่หูโอนามิ+โรเซเลีย', () => { const k = side('L03'); demo.pair[k] = !demo.pair[k]; sync(); }],
        ['HP ใกล้หมด (ระฆังเที่ยงคืน)', () => hp(side('L03'), 1)],
      ]],
      ['ใช้ร่วม', [
        ['เดจิตชนะ', () => { halves().player.classList.remove('mat-defeated'); halves().ai.classList.remove('mat-defeated'); fx.endScene(side('L01')); }],
        ['วันสิ้นโลกชนะ', () => { halves().player.classList.remove('mat-defeated'); halves().ai.classList.remove('mat-defeated'); fx.endScene(side('L03')); }],
        ['ล้างฉากแพ้ / คืน HP', () => { for (const k of ['player', 'ai']) { halves()[k].classList.remove('mat-defeated'); gameState[k].leader.hp = gameState[k].leader.maxHp || 6; } renderGame(); }],
        ['เสียงเริ่มเทิร์น', () => { turnSound('L01'); setTimeout(() => turnSound('L03'), 500); }],
      ]],
    ];
    const panel = document.createElement('div');
    panel.id = 'fx-preview-panel';
    panel.innerHTML = '<b>ตัวอย่างเอฟเฟกต์</b>' + items.map(([g, list], gi) =>
      `<div class="grp"><span>${g}</span>${list.map((it, ii) => `<button type="button" data-g="${gi}" data-i="${ii}">${it[0]}</button>`).join('')}</div>`).join('');
    panel.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      if (typeof gameState === 'undefined' || !gameState.player) return;
      items[b.dataset.g][1][b.dataset.i][1]();
    });
    document.body.appendChild(panel);
  }

  // ห่อ renderBoardSlots แทน renderGame: PvP เรียก _originalRenderGame ตรง ๆ ซึ่งข้าม wrapper ของ renderGame
  const origSlots = window.renderBoardSlots;
  if (typeof origSlots === 'function') {
    window.renderBoardSlots = function (containerId) {
      const r = origSlots.apply(this, arguments);
      if (containerId === 'player-board') { try { sync(); } catch (e) { console.warn('deck-themes', e); } }
      return r;
    };
  }
  wrapAttack();
  wrapEndModal();
  window.addEventListener('resize', () => { try { sync(); } catch (e) { /* ignore */ } });
  previewPanel();
  window.DeckThemes = { sync, COLORS, fx, sound };
})();
