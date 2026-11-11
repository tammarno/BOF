/* ============================================================================
   BOF AUDIO ENGINE (Pure Web Audio API — No External Files Required!)
   สร้างคลื่นเสียงเอฟเฟกต์แบบ Procedural Synthesis:
   - เสียงจั่วการ์ด, วางการ์ด, ร่ายเวท, โจมตี, ทำลาย, เปิดซองสุ่มการ์ด, ชนะ/แพ้
   - เปิด/ปิดเสียง และปรับระดับเสียงได้ (บันทึกลง localStorage)
   ============================================================================ */
(function () {
  let ctx = null;
  let masterGain = null;
  let isSoundEnabled = true;
  let currentVolume = 0.7;
  try {
    isSoundEnabled = localStorage.getItem('bof_sound_enabled') !== 'false';
    currentVolume = parseFloat(localStorage.getItem('bof_sound_volume') || '0.7');
    if (Number.isNaN(currentVolume)) currentVolume = 0.7;
  } catch (e) {}

  function initAudioContext() {
    try {
      if (!ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          ctx = new AudioCtx();
          masterGain = ctx.createGain();
          masterGain.gain.setValueAtTime(isSoundEnabled ? currentVolume : 0, ctx.currentTime);
          masterGain.connect(ctx.destination);
        }
      }
      if (ctx && ctx.state === 'suspended' && typeof ctx.resume === 'function') {
        const res = ctx.resume();
        if (res && typeof res.catch === 'function') res.catch(() => {});
      }
    } catch (e) {}
  }

  // ปลดล็อก AudioContext เมื่อผู้ใช้แตะหรือคลิกหน้าจอครั้งแรก (รวม touchstart/touchend สำหรับ iOS Safari)
  ['pointerdown', 'touchstart', 'touchend', 'keydown', 'click'].forEach(evt => {
    window.addEventListener(evt, initAudioContext, { once: true, passive: true });
  });

  function setSoundEnabled(enabled) {
    isSoundEnabled = !!enabled;
    localStorage.setItem('bof_sound_enabled', isSoundEnabled ? 'true' : 'false');
    if (masterGain && ctx) {
      masterGain.gain.setValueAtTime(isSoundEnabled ? currentVolume : 0, ctx.currentTime);
    }
    updateSoundUI();
  }

  function setVolume(vol) {
    currentVolume = Math.max(0, Math.min(1, parseFloat(vol)));
    localStorage.setItem('bof_sound_volume', currentVolume.toString());
    if (masterGain && ctx && isSoundEnabled) {
      masterGain.gain.setValueAtTime(currentVolume, ctx.currentTime);
    }
  }

  function canPlay() {
    return isSoundEnabled && ctx && masterGain;
  }

  /* ---------------- เครื่องสังเคราะห์เสียง (Synthesizers) ---------------- */

  // 1. เสียงคลิกปุ่ม / ตัวเลือก
  function playButtonClick() {
    if (!canPlay()) return;
    initAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const now = ctx.currentTime;
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.05);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(now);
    osc.stop(now + 0.05);
  }

  // 2. เสียงจั่วการ์ด / หยิบไพ่ (Card Draw Slide)
  function playCardDraw() {
    if (!canPlay()) return;
    initAudioContext();
    const now = ctx.currentTime;
    const bufferSize = ctx.sampleRate * 0.12;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.4));
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1400, now);
    filter.frequency.exponentialRampToValueAtTime(700, now + 0.12);
    filter.Q.setValueAtTime(3.0, now);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);
    noise.start(now);
  }

  // 3. เสียงวางการ์ดลงสนาม (Card Snap / Placement)
  function playCardPlay() {
    if (!canPlay()) return;
    initAudioContext();
    const now = ctx.currentTime;

    // เสียงตวัดเบาๆ
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(380, now);
    osc.frequency.exponentialRampToValueAtTime(120, now + 0.1);
    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(now);
    osc.stop(now + 0.1);
  }

  // 4. เสียงพุ่งโจมตี (Attack Whoosh)
  function playAttack() {
    if (!canPlay()) return;
    initAudioContext();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(650, now + 0.12);
    osc.frequency.exponentialRampToValueAtTime(180, now + 0.22);
    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(now);
    osc.stop(now + 0.22);
  }

  // 5. เสียงดาเมจ / การปะทะ (Impact Clash)
  function playDamage() {
    if (!canPlay()) return;
    initAudioContext();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(45, now + 0.18);
    gain.gain.setValueAtTime(0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(now);
    osc.stop(now + 0.18);
  }

  // 6. เสียงร่ายการ์ดเวทมนตร์ / ใช้สกิล (Spell Cast Chime)
  function playSpell() {
    if (!canPlay()) return;
    initAudioContext();
    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const noteTime = now + idx * 0.06;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, noteTime);
      gain.gain.setValueAtTime(0.25, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.25);
      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(noteTime);
      osc.stop(noteTime + 0.25);
    });
  }

  // 7. เสียงยูนิตถูกทำลาย (Destroy Explosion)
  function playDestroy() {
    if (!canPlay()) return;
    initAudioContext();
    const now = ctx.currentTime;

    const bufferSize = ctx.sampleRate * 0.25;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(350, now);
    filter.frequency.linearRampToValueAtTime(80, now + 0.25);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.6, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);
    noise.start(now);
  }

  // 8. เสียงเปิดซองสุ่มการ์ด (Booster Pack Open Warp)
  function playPackOpen() {
    if (!canPlay()) return;
    initAudioContext();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(900, now + 0.4);
    osc.frequency.exponentialRampToValueAtTime(300, now + 0.7);
    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(now);
    osc.stop(now + 0.7);
  }

  // 9. เสียงได้รับการ์ดแรร์ SSR (Golden SSR Fanfare)
  function playSsr() {
    if (!canPlay()) return;
    initAudioContext();
    const now = ctx.currentTime;
    const chords = [523.25, 659.25, 783.99, 1046.50, 1318.51];
    chords.forEach((f, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const t = now + i * 0.08;
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, t);
      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(t);
      osc.stop(t + 0.6);
    });
  }

  // 10. เสียงชัยชนะ (Victory Theme)
  function playVictory() {
    if (!canPlay()) return;
    initAudioContext();
    const now = ctx.currentTime;
    const victoryNotes = [
      { f: 523.25, d: 0.15 },
      { f: 659.25, d: 0.15 },
      { f: 783.99, d: 0.18 },
      { f: 1046.50, d: 0.55 }
    ];
    let offset = 0;
    victoryNotes.forEach(n => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const t = now + offset;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(n.f, t);
      gain.gain.setValueAtTime(0.4, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + n.d);
      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(t);
      osc.stop(t + n.d);
      offset += n.d * 0.85;
    });
  }

  // 11. เสียงพ่ายแพ้ (Defeat Theme)
  function playDefeat() {
    if (!canPlay()) return;
    initAudioContext();
    const now = ctx.currentTime;
    const defeatNotes = [440, 415.3, 392, 349.23];
    let offset = 0;
    defeatNotes.forEach((f, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const t = now + offset;
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(f, t);
      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(t);
      osc.stop(t + 0.4);
      offset += 0.28;
    });
  }

  // 12. เสียงทอยเหรียญ (หมุนในอากาศ)
  function playCoinFlip() {
    if (!canPlay()) return;
    initAudioContext();
    const now = ctx.currentTime;
    for (let i = 0; i < 7; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const t = now + i * 0.13;
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1400 + (i % 3) * 350, t);
      gain.gain.setValueAtTime(0.15, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.11);
      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(t);
      osc.stop(t + 0.12);
    }
  }

  // 13. เสียงเหรียญหยุดหมุน / สรุปผล
  function playCoinLand() {
    if (!canPlay()) return;
    initAudioContext();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1760, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.3);
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(now);
    osc.stop(now + 0.36);
  }

  // 14. เสียงสับกองการ์ด (Riffle Deck Shuffle)
  function playDeckShuffle() {
    if (!canPlay()) return;
    initAudioContext();
    const now = ctx.currentTime;
    for (let i = 0; i < 14; i++) {
      const bufferSize = Math.floor(ctx.sampleRate * 0.035);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let j = 0; j < bufferSize; j++) {
        output[j] = Math.random() * 2 - 1;
      }
      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      const t = now + i * 0.045;
      filter.frequency.setValueAtTime(1500 + Math.random() * 800, t);
      filter.Q.setValueAtTime(3.5, t);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.035);

      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(masterGain);

      whiteNoise.start(t);
      whiteNoise.stop(t + 0.036);
    }
  }

  function updateSoundUI() {
    const toggles = document.querySelectorAll('.bof-sound-toggle-btn');
    toggles.forEach(btn => {
      btn.textContent = isSoundEnabled ? '🔊 เสียง: เปิด' : '🔇 เสียง: ปิด';
      btn.classList.toggle('is-muted', !isSoundEnabled);
    });
    const inputs = document.querySelectorAll('.bof-sound-volume-input');
    inputs.forEach(inp => {
      inp.value = currentVolume;
    });
  }

  // เปิดให้เรียกใช้งานทั่วทั้งเกม
  window.BOF_AUDIO = {
    init: initAudioContext,
    isSoundEnabled: () => isSoundEnabled,
    toggleSound: () => { setSoundEnabled(!isSoundEnabled); return isSoundEnabled; },
    setSoundEnabled,
    setVolume,
    playButtonClick,
    playCardDraw,
    playCardPlay,
    playAttack,
    playDamage,
    playSpell,
    playDestroy,
    playPackOpen,
    playSsr,
    playVictory,
    playDefeat,
    playCoinFlip,
    playCoinLand,
    playDeckShuffle
  };

  // ตรวจจับคลิกที่ปุ่มใดๆ เพื่อเล่นเสียงคลิกนุ่มๆ
  document.addEventListener('click', e => {
    if (e.target.closest('button, .btn, .lb-menu-item, .card')) {
      playButtonClick();
    }
  });

  // อัปเดต UI เมื่อ DOM พร้อม
  document.addEventListener('DOMContentLoaded', updateSoundUI);
})();
