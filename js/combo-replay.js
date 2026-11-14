/* ============================================================================
   วิดีโอสาธิตคอมโบในหน้าวิธีเล่น: กระดานจำลอง + บทเล่นทีละขั้น (GSAP timeline + BOFFX)
   ไม่แตะ game.js: เฝ้า #howto-combo-content แล้วเติมฉากให้การ์ดคอมโบที่มีบทใน js/combo-replays-data.js

   บท (คีย์ = id คอมโบใน game.js):
     setup: { meLeader, oppLeader, me:[3 ช่อง], opp:[3 ช่อง], hand:[], meGrave:[], meVoid:[], deck:[], oppHand:[],
              hp:{me,opp}, power:{คีย์:ค่า}, rest:[คีย์], count:{meGrave,meVoid} (ใบที่ไม่ได้วาด), meter:{label,value,max} }
     steps: [{ say:'คำบรรยาย', act:[[คำสั่ง, ...]] }] · done: ป้ายตอนจบ · doneSay: คำบรรยายตอนจบ
   คีย์การ์ด = id การ์ด ถ้าซ้ำในบทเดียวกันให้ต่อท้าย #อะไรก็ได้ (เช่น 'OM01#2')
   คำสั่งขึ้นต้น '&' = เล่นพร้อมกับคำสั่งก่อนหน้า
     tap k · target k · seal k · glow k
     toHand k · summon k ช่อง (0-2 = ฝั่งเรา, 'o0'-'o2' = ฝั่งคู่ต่อสู้; ช่องมีการ์ดอยู่ = วางทับ ใบเก่าลงนรก)
     discard k · toGrave k · toVoid k · toDeck k · cast k
     draw [k..] · mill [k..] · reveal [k..] · oppDiscard [k..]
     rest k · stand k · attack a b ['hold'] · retreat k · destroy k · shield k
     power k ค่า · hp 'me'|'opp' ค่า · beam a b · link a b · banner 'ข้อความ' ['red'] · meter ค่า
   ============================================================================ */
(function () {
  if (typeof gsap === 'undefined' || !window.BOFFX) return;
  const REPLAYS = window.BOF_COMBO_REPLAYS || {};
  const E = BOFFX.ease;

  // ---------- ผังกระดาน (หน่วย: กว้าง 100 · สูง H) · มือถือใช้กระดานจัตุรัส การ์ดใหญ่ขึ้น ----------
  // shortcut: เลือกผังครั้งเดียวตอนสร้างฉาก หมุนจอระหว่างดูจะยังใช้ผังเดิมจนเปิดเด็คใหม่
  const LAYOUTS = {
    wide: { H: 62.5, CW: 11, slotX: [24, 38, 52], leaderX: 3, graveX: 86, oppY: 3.5, meY: 23.5, handY: 44.5, handMid: 50, handStep: 11, handSpan: 44 },
    tall: { H: 100, CW: 17, slotX: [21.5, 40, 58.5], leaderX: 1.5, graveX: 81.5, oppY: 3, meY: 37, handY: 72, handMid: 50, handStep: 15, handSpan: 42 }
  };
  const BACK = 'images/card-back.png';
  const cardData = id => (typeof CARD_DATABASE !== 'undefined' ? CARD_DATABASE.find(c => c.id === id) : null);
  const thumb = src => String(src || '').replace(/^images\//, 'images/thumbs/').replace(/\.png$/, '.webp');

  function build(stage, script) {
    const L = LAYOUTS[window.isMobileUI && isMobileUI() ? 'tall' : 'wide'];
    const H = L.H, CW = L.CW, CH = CW * 88 / 63;
    const pct = ([x, y]) => ({ left: x + '%', top: (y / H * 100) + '%' });
    const top = y => `top:${y / H * 100}%`;
    const P = {
      meLeader: [L.leaderX, L.meY], oppLeader: [L.leaderX, L.oppY],
      meGrave: [L.graveX, L.meY], oppGrave: [L.graveX, L.oppY],
      meDeck: [L.graveX, L.handY], meVoid: [L.leaderX, L.handY]
    };
    const slotPos = (side, i) => [L.slotX[i], side === 'opp' ? L.oppY : L.meY];
    const centerPos = (i, n) => [50 - CW / 2 + (i - (n - 1) / 2) * CW * 1.5, H / 2 - CH / 2];
    const oppHandPos = (i, n) => [50 - CW / 2 + (i - (n - 1) / 2) * CW * .6, -CH - 3];
    function handPos(i, n) {
      const step = n > 1 ? Math.min(L.handStep, L.handSpan / (n - 1)) : 0;
      return [L.handMid - CW / 2 - (n - 1) * step / 2 + i * step, L.handY];
    }
    const handRot = (i, n) => (i - (n - 1) / 2) * (n > 3 ? 3 : 4);
    const S = script.setup || {};

    stage.style.setProperty('--cr-aspect', `100 / ${H}`);
    stage.style.setProperty('--cr-cw', CW + '%');
    stage.dataset.aspect = H / 100;
    stage.innerHTML = `
      <div class="cr-board" aria-hidden="true">
        ${L.slotX.map(x => `<i class="cr-slot" style="left:${x}%;${top(L.oppY)}"></i><i class="cr-slot" style="left:${x}%;${top(L.meY)}"></i>`).join('')}
        <i class="cr-slot is-grave" style="left:${L.graveX}%;${top(L.oppY)}"><span data-pile="oppGrave">นรก</span></i>
        <i class="cr-slot is-grave" style="left:${L.graveX}%;${top(L.meY)}"><span data-pile="meGrave">นรก</span></i>
        <i class="cr-slot is-deck" style="left:${L.graveX}%;${top(L.handY)}"><img src="${BACK}" alt=""><span>กอง</span></i>
        <i class="cr-slot is-void" style="left:${L.leaderX}%;${top(L.handY)}"><span data-pile="meVoid">มิติมืด</span></i>
        <i class="cr-divider" style="${top((L.oppY + CH + L.meY) / 2)}"></i>
        <span class="cr-side is-opp" style="left:${L.leaderX}%;${top(L.oppY + CH + 1.2)}">คู่ต่อสู้</span>
        <span class="cr-side is-me" style="left:${L.leaderX}%;${top(L.meY + CH + 1.2)}">เรา</span>
      </div>`;

    const tl = gsap.timeline({ paused: true });
    const C = {};                                   // คีย์ → { el, inner, back, pow, hp, img, side, zone, power }
    const hand = [], slots = { me: [null, null, null], opp: [null, null, null] };
    const piles = { meGrave: [], oppGrave: [], meVoid: [], meDeck: [] };
    const pileBase = { meGrave: 0, oppGrave: 0, meVoid: 0, ...(S.count || {}) };
    let z = 5;

    function makeCard(key, faceDown) {
      const id = key.split('#')[0], c = cardData(id) || { name: id, image: '' };
      const el = document.createElement('div');
      el.className = 'cr-card' + (c.type === 'Leader' ? ' is-leader' : '');
      el.innerHTML = `<div class="cr-inner"><img class="cr-face" src="${thumb(c.image)}" alt="${c.name}" draggable="false"><img class="cr-back" src="${BACK}" alt="" draggable="false"></div>` +
        (c.type === 'Monster' ? `<b class="cr-pow">${c.power}</b>` : '') + (c.type === 'Leader' ? `<b class="cr-hp">6</b>` : '');
      el.querySelector('.cr-face').onerror = function () { this.onerror = null; this.src = c.image; };
      stage.appendChild(el);
      const o = C[key] = { el, inner: el.querySelector('.cr-inner'), back: el.querySelector('.cr-back'), pow: el.querySelector('.cr-pow'), hp: el.querySelector('.cr-hp'), img: c.image, power: c.power, side: 'me', faceDown: !!faceDown };
      gsap.set(o.back, { opacity: faceDown ? 1 : 0 });
      if (o.pow) gsap.set(o.pow, { opacity: faceDown ? 0 : 1 });
      return o;
    }
    const at = (o, p, extra) => gsap.set(o.el, { ...pct(p), ...extra });
    const cen = k => { const r = C[k].pos; return { x: r[0] + CW / 2, y: (r[1] + CH / 2) / H * 100 }; };

    // ---------- วางกระดานเริ่มต้น ----------
    function place(key, p, zone, side, extra) { const o = makeCard(key); o.pos = p; o.zone = zone; o.side = side; at(o, p, extra); return o; }
    if (S.oppLeader) place(S.oppLeader, P.oppLeader, 'leader', 'opp');
    if (S.meLeader) place(S.meLeader, P.meLeader, 'leader', 'me');
    ['me', 'opp'].forEach(side => (S[side] || []).forEach((k, i) => { if (k) { place(k, slotPos(side, i), 'slot', side); slots[side][i] = k; C[k].slot = i; } }));
    ['meGrave', 'meVoid'].forEach(pl => (S[pl] || []).forEach(k => { place(k, P[pl], pl, 'me', { zIndex: z++ }); piles[pl].push(k); }));
    (S.hand || []).forEach(k => { const o = makeCard(k); o.zone = 'hand'; hand.push(k); });
    hand.forEach((k, i) => { C[k].pos = handPos(i, hand.length); at(C[k], C[k].pos, { rotate: handRot(i, hand.length) }); });
    (S.deck || []).forEach(k => { const o = makeCard(k, true); o.pos = P.meDeck; o.zone = 'meDeck'; piles.meDeck.push(k); at(o, P.meDeck, { opacity: 0 }); });
    (S.oppHand || []).forEach((k, i, a) => { const o = makeCard(k, true); o.side = 'opp'; o.zone = 'oppHand'; o.pos = oppHandPos(i, a.length); at(o, o.pos); });
    const hp = { me: 6, opp: 6, ...(S.hp || {}) };
    if (S.meLeader) C[S.meLeader].hp.textContent = hp.me;
    if (S.oppLeader) C[S.oppLeader].hp.textContent = hp.opp;
    Object.entries(S.power || {}).forEach(([k, v]) => { C[k].power = v; C[k].pow.textContent = v; });
    (S.rest || []).forEach(k => { gsap.set(C[k].el, { rotate: 90, scale: .9 }); C[k].rested = true; });

    const pileLabel = {};
    stage.querySelectorAll('[data-pile]').forEach(s => { pileLabel[s.dataset.pile] = s; });
    const NAMES = { meGrave: 'นรก', oppGrave: 'นรก', meVoid: 'มิติมืด' };
    const pileText = pl => { const n = piles[pl].length + (pileBase[pl] || 0); return n ? `${NAMES[pl]} ${n}` : NAMES[pl]; };
    Object.keys(pileLabel).forEach(pl => { pileLabel[pl].textContent = pileText(pl); });

    let meterEl = null, meterVal = 0;
    if (S.meter) {
      meterEl = document.createElement('div');
      meterEl.className = 'cr-meter';
      meterEl.innerHTML = `<span>${S.meter.label}</span><b>${S.meter.value}</b><i>/${S.meter.max}</i><em><s></s></em>`;
      stage.after(meterEl); // อยู่ใต้กระดาน ไม่ทับการ์ดที่เปิดกลางจอ
      meterVal = S.meter.value;
      gsap.set(meterEl.querySelector('s'), { width: (S.meter.value / S.meter.max * 100) + '%' });
    }

    const touch = BOFFX.touch(stage);
    gsap.set(touch, { left: '50%', top: '115%' });

    // ---------- ตัวช่วย ----------
    const T = () => gsap.timeline();
    function flip(o, faceUp) {
      o.faceDown = !faceUp;
      return T().to(o.inner, { scaleX: 0, duration: .14, ease: 'power1.in' })
        .set(o.back, { opacity: faceUp ? 0 : 1 }).set(o.pow || {}, { opacity: faceUp ? 1 : 0 })
        .to(o.inner, { scaleX: 1, duration: .16, ease: 'power1.out' });
    }
    function leave(k) {                               // ถอดการ์ดออกจากโซนเดิม (ในโมเดล)
      const o = C[k];
      if (o.zone === 'hand') hand.splice(hand.indexOf(k), 1);
      else if (o.zone === 'slot') slots[o.side][o.slot] = null;
      else if (piles[o.zone]) piles[o.zone].splice(piles[o.zone].indexOf(k), 1);
      if (piles[o.zone]) return pileLabelSet(o.zone);
      return null;
    }
    function pileLabelSet(pl) { return pileLabel[pl] ? T().set(pileLabel[pl], { textContent: pileText(pl) }) : null; }
    function relayoutHand(skip) {
      const t = T();
      hand.forEach((k, i) => {
        const o = C[k];
        if (k === skip) return;
        o.pos = handPos(i, hand.length);
        t.to(o.el, { ...pct(o.pos), rotate: handRot(i, hand.length), scale: 1, duration: .35, ease: E.fly }, 0);
      });
      return t;
    }
    function fly(k, p, { rotate = 0, scale = 1, dur = .55, arc = true } = {}) {
      const o = C[k];
      o.pos = p;
      const t = T().set(o.el, { zIndex: 40, opacity: 1 });
      if (arc) t.to(o.el, { scale: scale * 1.15, duration: dur * .45, ease: E.lift }).to(o.el, { ...pct(p), rotate, duration: dur, ease: E.fly }, 0).to(o.el, { scale, duration: dur * .55, ease: E.settle }, dur * .45);
      else t.to(o.el, { ...pct(p), rotate, scale, duration: dur, ease: E.fly });
      return t;
    }
    function toPile(k, pl) {
      const o = C[k], from = leave(k), t = T();
      if (from) t.add(from);
      if (o.zone === 'hand') t.add(relayoutHand(), 0);
      const faceUp = pl !== 'meDeck';
      o.zone = pl; piles[pl].push(k);
      t.add(fly(k, P[pl], { dur: .5 }), 0);
      if (o.rested) { o.rested = false; }
      if (faceUp && o.faceDown) t.add(flip(o, true), .1);
      if (!faceUp) t.add(flip(o, false), .1).to(o.el, { opacity: 0, duration: .2 });
      t.set(o.el, { zIndex: z++ });
      const lab = pileLabelSet(pl);
      if (lab) t.add(lab);
      t.call(() => BOFFX.sparks(o.el, { count: 8, rings: 0, speed: 140, color: pl === 'meVoid' ? '190, 150, 255' : '255, 214, 120' }));
      return t;
    }
    function glowOn(k, color = '255, 214, 120') {
      return T().to(C[k].el, { boxShadow: `0 0 0 2px rgba(${color}, 1), 0 0 22px 4px rgba(${color}, .8)`, duration: .2 })
        .to(C[k].el, { boxShadow: '0 4px 10px rgba(0, 0, 0, .5)', duration: .4 }, '+=.7');
    }
    const tapAt = k => BOFFX.tapAt(touch, cen(k).x, cen(k).y);
    const hideTouch = () => T().to(touch, { opacity: 0, duration: .2 });
    const ownGrave = k => (C[k].side === 'opp' ? 'oppGrave' : 'meGrave');

    function banner(text, tone) {
      const b = document.createElement('div');
      b.className = 'cr-banner' + (tone === 'red' ? ' is-red' : '');
      b.textContent = text;
      stage.appendChild(b);
      gsap.set(b, { opacity: 0, scale: .6 });
      return T().to(b, { opacity: 1, scale: 1, duration: .35, ease: E.settle })
        .call(() => BOFFX.sparks(b, { count: 16, rings: 1, color: tone === 'red' ? '255, 93, 115' : '255, 214, 120' }))
        .to(b, { opacity: 0, scale: .9, duration: .3 }, '+=.9');
    }

    // ---------- คำสั่ง (คืน timeline ย่อย) ----------
    const ACT = {
      tap: k => T().add(tapAt(k)).add(glowOn(k), '<.3'),
      glow: k => glowOn(k),
      target: k => T().add(tapAt(k)).to(C[k].el, { boxShadow: '0 0 0 2px #ff5d73, 0 0 22px 4px rgba(255, 93, 115, .8)', duration: .2 }, '<.3'),
      seal: k => T().add(BOFFX.seal(C[k].el)),
      toHand(k) {
        const o = C[k], t = T(), from = leave(k);
        if (from) t.add(from);
        const wasBack = o.zone === 'meDeck';
        if (wasBack) t.set(o.el, { opacity: 1 });
        o.zone = 'hand'; hand.push(k);
        t.call(() => BOFFX.sparks(o.el, { count: 10, rings: 0 }));
        t.add(relayoutHand(k), 0);
        const i = hand.length - 1;
        t.add(fly(k, handPos(i, hand.length), { rotate: handRot(i, hand.length), dur: .6 }), 0);
        if (o.faceDown) t.add(flip(o, true), .25);
        t.set(o.el, { zIndex: 6 + i });
        return t;
      },
      summon(k, slot) {
        const o = C[k], t = T(), side = typeof slot === 'string' && slot[0] === 'o' ? 'opp' : 'me', i = +String(slot).replace('o', '');
        const fromHand = o.zone === 'hand', fromDeck = o.zone === 'meDeck';
        if (fromHand) t.add(tapAt(k));
        const prev = slots[side][i];
        if (prev && prev !== k) t.add(toPile(prev, ownGrave(prev)));
        const from = leave(k);
        if (from) t.add(from);
        if (fromDeck) t.set(o.el, { opacity: 1 });
        o.zone = 'slot'; o.slot = i; slots[side][i] = k;
        const p = slotPos(side, i), t0 = t.duration();
        t.add(fly(k, p, { dur: .6, scale: 1.1 }), t0);
        if (fromHand) t.to(touch, { left: (p[0] + CW / 2) + '%', top: ((p[1] + CH / 2) / H * 100) + '%', duration: .6, ease: E.fly }, t0).add(relayoutHand(), t0);
        if (o.faceDown) t.add(flip(o, true), t0 + .2);
        t.to(touch, { opacity: 0, duration: .2 }).to(o.el, { scale: 1, duration: .1 }, '<').add(BOFFX.slam(o.el)).set(o.el, { zIndex: 4 });
        if (o.rested) { t.to(o.el, { rotate: 0, duration: .2 }, '<'); o.rested = false; }
        return t;
      },
      discard: k => toPile(k, 'meGrave'),
      toGrave: k => toPile(k, ownGrave(k)),
      toVoid: k => toPile(k, 'meVoid'),
      toDeck: k => toPile(k, 'meDeck'),
      cast(k) {
        const o = C[k], t = T().add(tapAt(k)), from = leave(k);
        if (from) t.add(from);
        o.zone = 'cast';
        t.add(fly(k, centerPos(0, 1), { scale: 1.4, dur: .55 })).add(hideTouch(), '<').add(relayoutHand(), '<.1');
        t.add(BOFFX.seal(o.el), '-=.1').to({}, { duration: .3 });
        piles.meGrave.push(k); o.zone = 'meGrave';
        t.add(fly(k, P.meGrave, { dur: .5 })).set(o.el, { zIndex: z++ });
        const lab = pileLabelSet('meGrave');
        if (lab) t.add(lab);
        return t;
      },
      draw(...ks) {
        const t = T();
        ks.forEach((k, n) => {
          if (!C[k]) { const o = makeCard(k, true); o.pos = P.meDeck; o.zone = 'meDeck'; piles.meDeck.push(k); at(o, P.meDeck, { opacity: 0 }); }
          t.add(ACT.toHand(k), n * .25);
        });
        return t;
      },
      mill(...ks) {
        const t = T();
        ks.forEach((k, n) => {
          if (!C[k]) { const o = makeCard(k, true); o.pos = P.meDeck; o.zone = 'meDeck'; piles.meDeck.push(k); at(o, P.meDeck, { opacity: 0 }); }
          t.add(toPile(k, 'meGrave'), n * .3);
        });
        return t;
      },
      reveal(...ks) {
        const t = T();
        ks.forEach((k, n) => {
          if (!C[k]) { const o = makeCard(k, true); o.pos = P.meDeck; o.zone = 'meDeck'; piles.meDeck.push(k); at(o, P.meDeck, { opacity: 0 }); }
          const o = C[k], from = leave(k);
          if (from) t.add(from, 0);
          o.zone = 'reveal';
          t.set(o.el, { opacity: 1 }, n * .18).add(fly(k, centerPos(n, ks.length), { scale: 1.3, dur: .55 }), n * .18).add(flip(o, true), n * .18 + .35);
        });
        return t.to({}, { duration: .4 });
      },
      oppDiscard(...ks) {
        const t = T();
        ks.forEach((k, n) => {
          const o = C[k];
          o.zone = 'oppGrave'; piles.oppGrave.push(k);
          t.add(fly(k, P.oppGrave, { dur: .6 }), n * .25).add(flip(o, true), n * .25 + .2).set(o.el, { zIndex: z++ });
        });
        const lab = pileLabelSet('oppGrave');
        if (lab) t.add(lab);
        return t;
      },
      rest(k) { C[k].rested = true; return T().to(C[k].el, { rotate: 90, scale: .9, duration: .35, ease: E.settle }); },
      stand(k) {
        C[k].rested = false;
        return T().to(C[k].el, { rotate: 0, scale: 1, duration: .35, ease: E.settle }).call(() => BOFFX.sparks(C[k].el, { count: 12, rings: 1 }));
      },
      attack(a, b, hold) {
        const o = C[a], from = o.pos, tc = cen(b), t = T();
        const mid = [from[0] + (tc.x - CW / 2 - from[0]) * .62, from[1] + ((tc.y / 100 * H) - CH / 2 - from[1]) * .62];
        t.set(o.el, { zIndex: 45 })
          .to(o.el, { yPercent: o.side === 'me' ? 8 : -8, scale: 1.08, duration: .2, ease: E.lift })
          .to(o.el, { ...pct(mid), duration: .22, ease: 'power3.in' })
          .call(() => { BOFFX.sparks(C[b].el, { count: 22, speed: 300, rings: 2, color: '255, 150, 90' }); })
          .to(C[b].el, { x: '+=4%', duration: .05, repeat: 3, yoyo: true }, '<');
        if (hold) return t;
        return t.add(ACT.retreat(a)).add(ACT.rest(a), '-=.1');
      },
      retreat(k) { const o = C[k]; return T().to(o.el, { ...pct(o.pos), yPercent: 0, scale: 1, duration: .4, ease: E.fly }).set(o.el, { zIndex: 4 }); },
      destroy(k) {
        const o = C[k], t = T().add(BOFFX.shatter(o.el, o.img));
        const pl = ownGrave(k);
        if (o.zone === 'slot') slots[o.side][o.slot] = null;
        const ghostKey = k + '#ghost';
        const g = makeCard(ghostKey);
        g.side = o.side; g.zone = pl; g.pos = P[pl]; piles[pl].push(ghostKey);
        at(g, P[pl], { opacity: 0, zIndex: z++ });
        t.to(g.el, { opacity: 1, duration: .3 }, '-=.25');
        const lab = pileLabelSet(pl);
        if (lab) t.add(lab, '<');
        return t;
      },
      shield(k) {
        const s = document.createElement('i');
        s.className = 'cr-shield';
        C[k].el.appendChild(s);
        gsap.set(s, { opacity: 0, scale: 1.4 });
        return T().to(s, { opacity: 1, scale: 1, duration: .4, ease: E.settle }).call(() => BOFFX.sparks(C[k].el, { count: 10, rings: 1, color: '120, 220, 255' }), null, '<');
      },
      power(k, v) {
        const o = C[k], up = v >= o.power;
        o.power = v;
        return BOFFX.pop(o.pow, v, up);
      },
      hp(side, v) {
        const k = side === 'me' ? S.meLeader : S.oppLeader;
        hp[side] = v;
        const t = BOFFX.pop(C[k].hp, v, false);
        if (v <= 0) t.to(C[k].el, { filter: 'grayscale(1) brightness(.5)', duration: .4 });
        return t;
      },
      beam: (a, b) => BOFFX.beam(stage, cen(a), cen(b)),
      link: (a, b) => BOFFX.link(stage, cen(a), cen(b)),
      banner: (text, tone) => banner(text, tone),
      meter(v) {
        meterVal = v;
        return T().to(meterEl.querySelector('s'), { width: (v / S.meter.max * 100) + '%', duration: .4, ease: E.lift })
          .add(BOFFX.pop(meterEl.querySelector('b'), v, true), '<');
      }
    };

    const labels = [];
    script.steps.forEach((step, i) => {
      tl.addLabel('s' + i, '+=.35');
      labels.push(tl.duration());
      step.act.forEach(([name, ...args]) => {
        const par = name[0] === '&', fn = ACT[par ? name.slice(1) : name];
        if (!fn) { console.warn('[combo-replay] ไม่รู้จักคำสั่ง', name); return; }
        tl.add(fn(...args), par ? '<' : '+=.05');
      });
      tl.to(touch, { opacity: 0, duration: .25 });
      tl.to({}, { duration: 1.2 }); // พักให้อ่านคำบรรยาย
    });

    // ฉากจบ: ป้ายทองแล้วจางออก ให้เห็นกระดานผลลัพธ์
    const done = document.createElement('div');
    done.className = 'cr-done';
    done.innerHTML = `<span>${script.done || 'คอมโบสำเร็จ!'}</span>`;
    stage.appendChild(done);
    gsap.set(done, { opacity: 0, scale: .6 });
    tl.addLabel('done');
    labels.push(tl.duration());
    tl.to(done, { opacity: 1, scale: 1, duration: .45, ease: E.settle });
    tl.call(() => BOFFX.sparks(done, { count: 34, speed: 360, size: 14, rings: 2 }), null, '<.15');
    tl.to(done, { opacity: 0, scale: .9, duration: .4 }, '+=1.4');
    return { tl, labels };
  }

  // ---------- ตัวเล่น: ปุ่มเล่น/หยุด/ย้อน/ถัดไป + คำบรรยาย + จุดขั้น ----------
  const players = new Set();

  function mountPlayer(host, script) {
    const wrap = document.createElement('div');
    wrap.className = 'cr-player';
    wrap.innerHTML = `
      <div class="cr-stage"></div>
      <div class="cr-caption" aria-live="polite"><span class="cr-step-no"></span><span class="cr-say"></span></div>
      <div class="cr-controls">
        <button type="button" class="cr-btn" data-cr="prev" aria-label="ขั้นก่อนหน้า"><svg viewBox="0 0 24 24"><path d="M15 5 8 12l7 7"/></svg></button>
        <button type="button" class="cr-btn cr-play" data-cr="play" aria-label="เล่น"><svg class="i-play" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg><svg class="i-pause" viewBox="0 0 24 24"><path d="M7 5h4v14H7zM13 5h4v14h-4z"/></svg><svg class="i-again" viewBox="0 0 24 24"><path d="M4 12a8 8 0 1 0 2.3-5.6M4 4v4h4"/></svg></button>
        <button type="button" class="cr-btn" data-cr="next" aria-label="ขั้นถัดไป"><svg viewBox="0 0 24 24"><path d="m9 5 7 7-7 7"/></svg></button>
        <div class="cr-dots">${script.steps.map((_, i) => `<button type="button" class="cr-dot" data-cr-go="${i}" aria-label="ขั้นที่ ${i + 1}"></button>`).join('')}</div>
      </div>`;
    host.appendChild(wrap);
    const stage = wrap.querySelector('.cr-stage');
    const { tl, labels } = build(stage, script);
    const sayEl = wrap.querySelector('.cr-say'), noEl = wrap.querySelector('.cr-step-no'), dots = [...wrap.querySelectorAll('.cr-dot')];
    const n = script.steps.length;
    let shown = -2, userPaused = false;

    const stepAt = t => { let k = -1; labels.forEach((l, i) => { if (t >= l - .001) k = i; }); return k; };
    function sync() {
      const k = stepAt(tl.time());
      wrap.classList.toggle('is-playing', tl.isActive() || (!tl.paused() && tl.progress() < 1));
      wrap.classList.toggle('is-ended', tl.progress() >= 1);
      if (k === shown) return;
      shown = k;
      const done = k >= n;
      noEl.textContent = done ? '✓' : (k < 0 ? '▶' : `${k + 1}/${n}`);
      sayEl.innerHTML = done ? (script.doneSay || script.done || 'คอมโบสำเร็จ!') : (k < 0 ? 'กดเล่นเพื่อดูคอมโบนี้ทีละขั้น' : script.steps[k].say);
      dots.forEach((d, i) => { d.classList.toggle('is-on', i === k); d.classList.toggle('is-past', i < k || done); });
    }
    tl.eventCallback('onUpdate', sync);
    tl.eventCallback('onComplete', () => { sync(); });
    sync();

    const p = {
      wrap, tl, stage, left: false,
      play() { players.forEach(o => o !== p && o.pause(true)); if (tl.progress() >= 1) tl.seek(0, true); userPaused = false; tl.play(); sync(); },
      pause(auto) { tl.pause(); if (!auto) userPaused = true; sync(); },
      go(i) { players.forEach(o => o !== p && o.pause(true)); tl.seek(labels[Math.max(0, Math.min(i, labels.length - 1))], true); userPaused = false; tl.play(); sync(); },
      get userPaused() { return userPaused; },
      set userPaused(v) { userPaused = v; }
    };
    wrap.addEventListener('click', e => {
      const b = e.target.closest('[data-cr],[data-cr-go]');
      if (!b) return;
      if (b.dataset.crGo != null) return p.go(+b.dataset.crGo);
      const k = stepAt(tl.time());
      if (b.dataset.cr === 'play') return (tl.paused() || tl.progress() >= 1) ? p.play() : p.pause();
      if (b.dataset.cr === 'next') return p.go(Math.min(k + 1, n));
      // ย้อน: ถ้าเพิ่งเริ่มขั้นนี้ไม่ถึงครึ่งวิ ไปขั้นก่อนหน้า ไม่งั้นเริ่มขั้นนี้ใหม่
      if (b.dataset.cr === 'prev') return p.go(k >= 0 && tl.time() - labels[k] > .5 ? k : k - 1);
    });
    stage.addEventListener('click', () => (tl.paused() || tl.progress() >= 1) ? p.play() : p.pause());
    players.add(p);
    return p;
  }

  // เล่นเองเมื่อเลื่อนมาเห็นครึ่งหนึ่ง · หยุดเมื่อเลื่อนพ้น
  // เล่นต่อเองเมื่อเลื่อนกลับมาเห็นกระดาน ≥ ครึ่ง · หยุดเมื่อเลื่อนพ้น · ทีละวิดีโอ (ใบที่เห็นมากสุด)
  // เลื่อนพ้นแล้วกลับมา = ลืมการกดหยุดเอง และถ้าเล่นจบไปแล้วจะเริ่มใหม่
  const vis = new Map();
  function pickVisible() {
    const cands = [...vis].filter(([p, r]) => r >= .5 && p.wrap.isConnected && !p.userPaused);
    if (!cands.length || cands.some(([p]) => !p.tl.paused() && p.tl.progress() < 1)) return;
    const [best] = cands.sort((a, b) => b[1] - a[1])[0];
    if (best.tl.progress() >= 1 && !best.left) return;
    best.left = false;
    best.play();
  }
  const io = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
    entries.forEach(en => {
      const p = [...players].find(o => o.stage === en.target);
      if (!p) return;
      const r = en.isIntersecting ? en.intersectionRatio : 0;
      vis.set(p, r);
      if (r < .5) {
        if (!p.tl.paused()) p.pause(true);
        if (r === 0) { p.left = true; p.userPaused = false; }
      }
    });
    pickVisible();
  }, { threshold: [0, .25, .5, .75, 1] }) : null;

  // ---------- จัดหน้าการ์ดคอมโบที่ game.js สร้าง ----------
  const DECK_COLOR = { L01: '#ff8a3d', L02: '#9fd36b', L03: '#b892ff', L04: '#3fd6b4', L05: '#ff5d73', L06: '#ff7ac8', L07: '#f472b6', L08: '#ef4444' };

  function enhance() {
    players.forEach(p => { if (!p.wrap.isConnected) { p.tl.kill(); io && io.unobserve(p.stage); vis.delete(p); players.delete(p); } });

    document.querySelectorAll('#howto-combo-deck-tabs .lb-combo-deck-pill:not([data-cr])').forEach(b => {
      b.dataset.cr = '1';
      b.style.setProperty('--deck-c', DECK_COLOR[b.dataset.comboLeader] || '#f3c969');
      const s = b.querySelector('span');
      if (s) { b.title = s.textContent.trim(); s.textContent = s.textContent.replace(/\s*\(.*\)\s*$/, ''); }
    });

    const content = document.getElementById('howto-combo-content');
    if (!content) return;
    const active = document.querySelector('#howto-combo-deck-tabs .is-active');
    content.style.setProperty('--deck-c', DECK_COLOR[active && active.dataset.comboLeader] || '#f3c969');

    content.querySelectorAll('.lb-combo-card:not([data-cr])').forEach(cardBox => {
      cardBox.dataset.cr = '1';
      const btn = cardBox.querySelector('[data-practice-combo]');
      const id = btn && btn.dataset.practiceCombo;
      const title = cardBox.querySelector('.lb-combo-card-title');
      const m = title && title.textContent.match(/^(\S+)\s*คอมโบ\s*(\d+)\s*:\s*(.*)$/);
      if (m) title.innerHTML = `<span class="cr-badge">${m[1]} คอมโบ ${m[2]}</span><span class="cr-title">${m[3]}</span>`;

      const details = document.createElement('details');
      details.className = 'cr-text';
      details.innerHTML = '<summary>อ่านขั้นตอนแบบข้อความ</summary>';
      ['.lb-combo-cards-strip', '.lb-combo-steps-list'].forEach(sel => { const el = cardBox.querySelector(sel); if (el) details.appendChild(el); });

      const head = cardBox.querySelector('.lb-combo-card-head');
      if (REPLAYS[id]) {
        const holder = document.createElement('div');
        head.after(holder);
        const p = mountPlayer(holder, REPLAYS[id]);
        io && io.observe(p.stage);
      } else {
        details.open = true;
      }
      cardBox.appendChild(details);
      if (btn) {
        btn.classList.add('cr-practice');
        btn.textContent = '🎮 ลองเล่นเองแบบจับมือ';
        cardBox.appendChild(btn);
      }
    });
  }

  function init() {
    const content = document.getElementById('howto-combo-content');
    const tabs = document.getElementById('howto-combo-deck-tabs');
    if (!content) return;
    const mo = new MutationObserver(enhance);
    mo.observe(content, { childList: true });
    if (tabs) mo.observe(tabs, { childList: true });
    enhance();
    const dlg = document.getElementById('lb-howto-dialog');
    if (dlg) dlg.addEventListener('close', () => players.forEach(p => p.pause(true)));
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();

  window.BOFComboReplay = { REPLAYS, players };
})();
