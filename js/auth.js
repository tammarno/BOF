/* ============================================================================
   AUTH & CLOUD PROFILE SYSTEM (BOF)
   ล็อกอินด้วย "ชื่อผู้ใช้ (Username) + รหัสผ่าน (Password)" ไม่ต้องใช้อีเมล!
   ----------------------------------------------------------------------------
   วิธีเปิดใช้งาน Cloud Sync ข้ามเครื่องผ่าน Firebase (ฟรี 100%):
   1. ไปที่ https://console.firebase.google.com/ สร้างโปรเจกต์ใหม่
   2. ไปที่ Authentication > Sign-in method > เปิดใช้งาน "Email/Password"
   3. ไปที่ Firestore Database > กด Create Database (เลือก Start in test mode)
   4. ไปที่ Project Settings > สร้าง Web App (</>) แล้วนำค่า firebaseConfig มาวางใน BOF_FIREBASE_CONFIG ด้านล่าง
   * หมายเหตุ: หากยังไม่ได้ใส่ค่า BOF_FIREBASE_CONFIG ระบบจะทำงานในโหมดบัญชีประจำเครื่อง + รหัสย้ายเครื่องให้อัตโนมัติทันที!
   ============================================================================ */
(function () {
  const BOF_FIREBASE_CONFIG = {
    apiKey: '',
    authDomain: '',
    projectId: '',
    storageBucket: '',
    messagingSenderId: '',
    appId: ''
  };

  const STORAGE_ACCOUNTS_KEY = 'bof_accounts_db_v1';
  const STORAGE_SESSION_KEY = 'bof_active_user_v1';
  const DECK_STORAGE_KEY = 'my_card_game_deck';

  const AVATAR_LEADERS = [
    { id: 'L01', label: 'เด็คจิต (เดจิต)', image: 'images/เด็คจิต/1.png' },
    { id: 'L02', label: 'เด็คขุนเหนือ', image: 'images/เด็คเหนือ/1.png' },
    { id: 'L03', label: 'เด็ควันสิ้นโลก', image: 'images/วันสิ้นโลก/1.png' },
    { id: 'L04', label: 'เด็คศูนย์วิจัยไดโน', image: 'images/ไดโน/1.png' },
    { id: 'L05', label: 'เด็คปีศาจ', image: 'images/เด็คปีศาจ/1.png' },
    { id: 'L06', label: 'เด็คโอ็ต', image: 'images/เด็คโอ๊ต/1.png' }
  ];

  let currentUser = null;
  let authMode = 'login'; // 'login' | 'register'
  let selectedAvatarId = 'L01';
  let firebaseReady = false;
  let fbAuth = null;
  let fbDb = null;

  /* ---------------- ฟังก์ชันช่วยเหลือจัดการข้อมูล ---------------- */
  function isFirebaseConfigured() {
    return Boolean(
      BOF_FIREBASE_CONFIG.apiKey &&
      BOF_FIREBASE_CONFIG.projectId &&
      !BOF_FIREBASE_CONFIG.apiKey.includes('YOUR_')
    );
  }

  function normalizeUsername(raw) {
    return String(raw || '').trim();
  }

  function usernameKey(raw) {
    return normalizeUsername(raw).toLowerCase();
  }

  // แปลงชื่อผู้ใช้ (ทั้งภาษาไทย/อังกฤษ) ให้เป็นอีเมลจำลองสำหรับ Firebase Auth เบื้องหลัง
  function usernameToSyntheticEmail(username) {
    const key = usernameKey(username);
    const bytes = new TextEncoder().encode(key);
    let hex = '';
    for (const b of bytes) hex += b.toString(16).padStart(2, '0');
    return `u_${hex}@bof-tcg.local`;
  }

  async function hashPassword(password) {
    const raw = `bof_salt_v1:${password}`;
    if (window.crypto && window.crypto.subtle) {
      const buf = await window.crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw));
      return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
    }
    let h = 2166136261;
    for (let i = 0; i < raw.length; i++) {
      h ^= raw.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return `fnv_${(h >>> 0).toString(16)}`;
  }

  function getAvatarImage(avatarId) {
    const found = AVATAR_LEADERS.find(a => a.id === avatarId) || AVATAR_LEADERS[0];
    return found.image;
  }

  function loadLocalAccounts() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_ACCOUNTS_KEY));
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch (e) {
      return {};
    }
  }

  function saveLocalAccounts(db) {
    try {
      localStorage.setItem(STORAGE_ACCOUNTS_KEY, JSON.stringify(db));
    } catch (e) {}
  }

  function readCurrentDeckFromStorage() {
    try {
      const saved = JSON.parse(localStorage.getItem(DECK_STORAGE_KEY));
      if (saved && saved.leaderId && Array.isArray(saved.mainDeck) && saved.mainDeck.length === 20) {
        return saved;
      }
    } catch (e) {}
    return null;
  }

  function applyProfileDeckToGame(profile) {
    if (!profile || !profile.savedDeck) return;
    const d = profile.savedDeck;
    if (d && d.leaderId && Array.isArray(d.mainDeck) && d.mainDeck.length === 20) {
      try {
        localStorage.setItem(DECK_STORAGE_KEY, JSON.stringify(d));
      } catch (e) {}
      if (typeof currentDeckConfig !== 'undefined') {
        currentDeckConfig = { leaderId: d.leaderId, mainDeck: [...d.mainDeck] };
      }
      if (window.LobbyView && typeof window.LobbyView.refreshMine === 'function') {
        window.LobbyView.refreshMine();
        window.LobbyView.selectDeck('mine');
      }
    }
  }

  /* ---------------- โหลด Firebase อัตโนมัติหากใส่ Config แล้ว ---------------- */
  async function initFirebaseIfConfigured() {
    if (!isFirebaseConfigured()) return false;
    try {
      const loadScript = src => new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = src;
        s.onload = resolve;
        s.onerror = reject;
        document.head.appendChild(s);
      });
      if (!window.firebase) {
        await loadScript('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
        await loadScript('https://www.gstatic.com/firebasejs/10.12.2/firebase-auth-compat.js');
        await loadScript('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore-compat.js');
      }
      if (!window.firebase.apps.length) {
        window.firebase.initializeApp(BOF_FIREBASE_CONFIG);
      }
      fbAuth = window.firebase.auth();
      fbDb = window.firebase.firestore();
      firebaseReady = true;
      return true;
    } catch (err) {
      console.warn('[BOF Auth] โหลด Firebase ไม่สำเร็จ สลับไปใช้ Local Account อัตโนมัติ:', err);
      firebaseReady = false;
      return false;
    }
  }

  /* ---------------- บันทึกและซิงค์โปรไฟล์ ---------------- */
  async function persistCurrentUserProfile() {
    if (!currentUser) return;
    const key = usernameKey(currentUser.username);
    const db = loadLocalAccounts();
    if (db[key]) {
      db[key] = { ...db[key], ...currentUser, updatedAt: Date.now() };
      saveLocalAccounts(db);
    } else {
      db[key] = { ...currentUser, updatedAt: Date.now() };
      saveLocalAccounts(db);
    }
    try {
      localStorage.setItem(STORAGE_SESSION_KEY, key);
    } catch (e) {}

    if (firebaseReady && fbDb && currentUser.uid) {
      try {
        await fbDb.collection('bof_users').doc(currentUser.uid).set({
          username: currentUser.username,
          avatarId: currentUser.avatarId || 'L01',
          wins: currentUser.wins || 0,
          losses: currentUser.losses || 0,
          matches: currentUser.matches || 0,
          coins: typeof currentUser.coins === 'number' ? currentUser.coins : 2000,
          shards: typeof currentUser.shards === 'number' ? currentUser.shards : 300,
          pityCount: typeof currentUser.pityCount === 'number' ? currentUser.pityCount : 0,
          ownedCards: currentUser.ownedCards || null,
          packsOpened: currentUser.packsOpened || 0,
          savedDeck: currentUser.savedDeck || null,
          updatedAt: Date.now()
        }, { merge: true });
      } catch (e) {
        console.warn('[BOF Auth] ซิงค์ขึ้น Cloud ไม่สำเร็จ:', e);
      }
    }
    renderAuthBar();
    updateInGamePlayerIdentity();
    if (window.BOFShop && typeof window.BOFShop.reloadFromProfile === 'function') {
      window.BOFShop.reloadFromProfile();
    }
  }

  /* ---------------- สมัครสมาชิก & เข้าสู่ระบบ ---------------- */
  function buildStarterDeckAndCollection(leaderId) {
    const validId = ['L01', 'L02', 'L03', 'L04', 'L05', 'L06'].includes(leaderId) ? leaderId : 'L01';
    const mainList = (typeof getDefaultDeckForLeader === 'function')
      ? [...getDefaultDeckForLeader(validId)]
      : (typeof DECK_LISTS !== 'undefined' && DECK_LISTS[validId] ? [...DECK_LISTS[validId]] : []);
    const owned = { [validId]: 1 };
    mainList.forEach(cid => {
      owned[cid] = (owned[cid] || 0) + 1;
    });
    return {
      starterDeck: { leaderId: validId, mainDeck: mainList },
      starterOwned: owned
    };
  }

  async function registerAccount(usernameRaw, passwordRaw, avatarId) {
    const username = normalizeUsername(usernameRaw);
    const password = String(passwordRaw || '');
    if (username.length < 2 || username.length > 20) {
      throw new Error('ชื่อผู้ใช้ต้องมีความยาว 2 - 20 ตัวอักษร');
    }
    if (password.length < 6) {
      throw new Error('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
    }

    const key = usernameKey(username);
    const chosenLeaderId = avatarId || 'L01';
    const { starterDeck, starterOwned } = buildStarterDeckAndCollection(chosenLeaderId);

    if (firebaseReady && fbAuth && fbDb) {
      const email = usernameToSyntheticEmail(username);
      try {
        const cred = await fbAuth.createUserWithEmailAndPassword(email, password);
        const uid = cred.user.uid;
        const profile = {
          uid,
          username,
          avatarId: chosenLeaderId,
          starterDeckId: chosenLeaderId,
          coins: 2000,
          ownedCards: starterOwned,
          packsOpened: 0,
          wins: 0,
          losses: 0,
          matches: 0,
          savedDeck: starterDeck,
          createdAt: Date.now(),
          updatedAt: Date.now()
        };
        await fbDb.collection('bof_users').doc(uid).set(profile);
        currentUser = profile;
        applyProfileDeckToGame(profile);
        await persistCurrentUserProfile();
        return profile;
      } catch (err) {
        if (err && err.code === 'auth/email-already-in-use') {
          throw new Error('ชื่อผู้ใช้นี้มีคนใช้แล้ว กรุณาตั้งชื่ออื่นหรือกดเข้าสู่ระบบ');
        }
        throw new Error(err.message || 'สมัครสมาชิกไม่สำเร็จ');
      }
    }

    // โหมดบัญชีในเครื่อง
    const db = loadLocalAccounts();
    if (db[key]) {
      throw new Error('ชื่อผู้ใช้นี้ถูกใช้งานแล้ว กรุณาเลือกแท็บ "เข้าสู่ระบบ"');
    }
    const passHash = await hashPassword(password);
    const profile = {
      uid: `local_${Date.now()}`,
      username,
      passwordHash: passHash,
      avatarId: chosenLeaderId,
      starterDeckId: chosenLeaderId,
      coins: 2000,
      ownedCards: starterOwned,
      packsOpened: 0,
      wins: 0,
      losses: 0,
      matches: 0,
      savedDeck: starterDeck,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    db[key] = profile;
    saveLocalAccounts(db);
    currentUser = profile;
    applyProfileDeckToGame(profile);
    await persistCurrentUserProfile();
    return profile;
  }

  async function loginAccount(usernameRaw, passwordRaw) {
    const username = normalizeUsername(usernameRaw);
    const password = String(passwordRaw || '');
    if (!username || !password) {
      throw new Error('กรุณากรอกชื่อผู้ใช้และรหัสผ่านให้ครบ');
    }

    const key = usernameKey(username);

    if (firebaseReady && fbAuth && fbDb) {
      const email = usernameToSyntheticEmail(username);
      try {
        const cred = await fbAuth.signInWithEmailAndPassword(email, password);
        const uid = cred.user.uid;
        const doc = await fbDb.collection('bof_users').doc(uid).get();
        const data = doc.exists ? doc.data() : {};
        const fallbackLeader = data.avatarId || 'L01';
        const fallbackStarter = buildStarterDeckAndCollection(fallbackLeader);
        currentUser = {
          uid,
          username: data.username || username,
          avatarId: fallbackLeader,
          starterDeckId: data.starterDeckId || fallbackLeader,
          coins: typeof data.coins === 'number' ? data.coins : 2000,
          ownedCards: data.ownedCards || fallbackStarter.starterOwned,
          packsOpened: Number(data.packsOpened || 0),
          wins: Number(data.wins || 0),
          losses: Number(data.losses || 0),
          matches: Number(data.matches || 0),
          savedDeck: data.savedDeck || fallbackStarter.starterDeck
        };
        applyProfileDeckToGame(currentUser);
        await persistCurrentUserProfile();
        return currentUser;
      } catch (err) {
        throw new Error('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
      }
    }

    const db = loadLocalAccounts();
    const record = db[key];
    if (!record) {
      throw new Error('ไม่พบชื่อผู้ใช้นี้ กรุณาสมัครสมาชิกก่อน');
    }
    const passHash = await hashPassword(password);
    if (record.passwordHash && record.passwordHash !== passHash) {
      throw new Error('รหัสผ่านไม่ถูกต้อง');
    }
    if (!record.ownedCards) {
      const fallbackStarter = buildStarterDeckAndCollection(record.avatarId || 'L01');
      record.ownedCards = fallbackStarter.starterOwned;
      record.savedDeck = record.savedDeck || fallbackStarter.starterDeck;
    }
    if (typeof record.coins !== 'number') record.coins = 2000;
    currentUser = record;
    applyProfileDeckToGame(currentUser);
    await persistCurrentUserProfile();
    return currentUser;
  }

  async function logoutAccount() {
    if (firebaseReady && fbAuth) {
      try { await fbAuth.signOut(); } catch (e) {}
    }
    currentUser = null;
    try {
      localStorage.removeItem(STORAGE_SESSION_KEY);
    } catch (e) {}
    renderAuthBar();
    updateInGamePlayerIdentity();
    if (window.BOFShop && typeof window.BOFShop.reloadFromProfile === 'function') {
      window.BOFShop.reloadFromProfile();
    }
  }

  /* ---------------- อัปเดต UI ปุ่มโปรไฟล์บนหน้าล็อบบี้และในเกม ---------------- */
  function renderAuthBar() {
    const bar = document.getElementById('lb-auth-bar');
    if (!bar) return;
    const avatarImg = bar.querySelector('.lb-auth-avatar');
    const nameEl = bar.querySelector('.lb-auth-name');
    const subEl = bar.querySelector('.lb-auth-sub');
    const badgeEl = bar.querySelector('.lb-auth-badge');

    if (currentUser) {
      if (avatarImg) avatarImg.src = getAvatarImage(currentUser.avatarId);
      if (nameEl) nameEl.textContent = currentUser.username;
      if (subEl) subEl.textContent = `ชนะ ${currentUser.wins || 0} · แพ้ ${currentUser.losses || 0}`;
      if (badgeEl) {
        badgeEl.textContent = firebaseReady ? '☁️ ซิงค์แล้ว' : '✓ ล็อกอินแล้ว';
        badgeEl.style.display = 'inline-block';
      }
    } else {
      if (avatarImg) avatarImg.src = getAvatarImage('L01');
      if (nameEl) nameEl.textContent = 'ผู้เยี่ยมชม (Guest)';
      if (subEl) subEl.textContent = 'คลิกเพื่อเข้าสู่ระบบ / สมัคร';
      if (badgeEl) badgeEl.style.display = 'none';
    }
  }

  function updateInGamePlayerIdentity() {
    const roleTag = document.querySelector('#player-leader-box .leader-role-tag');
    if (roleTag) {
      roleTag.textContent = currentUser ? `👑 ${currentUser.username}` : '👑 Player Leader';
    }
    if (typeof gameState !== 'undefined' && gameState.player) {
      gameState.player.name = currentUser ? currentUser.username : 'Player';
    }
  }

  /* ---------------- หน้าต่าง Modal เข้าสู่ระบบ / โปรไฟล์ ---------------- */
  function renderAuthDialogContent() {
    const dialog = document.getElementById('bof-auth-dialog');
    if (!dialog) return;
    const formView = document.getElementById('bof-auth-form-view');
    const profileView = document.getElementById('bof-auth-profile-view');
    const titleEl = document.getElementById('bof-auth-title');
    const msgEl = document.getElementById('bof-auth-msg');
    if (msgEl) {
      msgEl.textContent = '';
      msgEl.className = 'bof-auth-msg';
    }

    if (currentUser) {
      if (titleEl) titleEl.textContent = '👤 โปรไฟล์ผู้เล่น';
      if (formView) formView.style.display = 'none';
      if (profileView) profileView.style.display = 'block';

      const pAvatar = document.getElementById('bof-profile-avatar');
      const pName = document.getElementById('bof-profile-username');
      const pDeck = document.getElementById('bof-profile-deck-info');
      const sWins = document.getElementById('bof-stat-wins');
      const sLosses = document.getElementById('bof-stat-losses');
      const sWinrate = document.getElementById('bof-stat-winrate');

      if (pAvatar) pAvatar.src = getAvatarImage(currentUser.avatarId);
      if (pName) pName.textContent = currentUser.username;

      const deckCfg = currentUser.savedDeck || readCurrentDeckFromStorage();
      const leaderCard = (typeof CARD_DATABASE !== 'undefined' && deckCfg)
        ? CARD_DATABASE.find(c => c.id === deckCfg.leaderId)
        : null;
      if (pDeck) {
        pDeck.textContent = leaderCard
          ? `🃏 เด็คที่ซิงค์: ${leaderCard.name} (21 ใบ)`
          : '🃏 เด็คที่ซิงค์: เด็คมาตรฐานเริ่มต้น';
      }

      const wins = currentUser.wins || 0;
      const losses = currentUser.losses || 0;
      const total = wins + losses;
      const rate = total > 0 ? Math.round((wins / total) * 100) : 0;

      if (sWins) sWins.textContent = String(wins);
      if (sLosses) sLosses.textContent = String(losses);
      if (sWinrate) sWinrate.textContent = `${rate}%`;

      renderAvatarPicker('bof-profile-avatar-picker', currentUser.avatarId, async newAvatarId => {
        currentUser.avatarId = newAvatarId;
        await persistCurrentUserProfile();
        renderAuthDialogContent();
      });
    } else {
      if (titleEl) titleEl.textContent = authMode === 'login' ? '🔐 เข้าสู่ระบบ' : '✨ สมัครสมาชิกใหม่';
      if (formView) formView.style.display = 'block';
      if (profileView) profileView.style.display = 'none';

      const tabLogin = document.getElementById('bof-tab-login');
      const tabReg = document.getElementById('bof-tab-register');
      const avatarField = document.getElementById('bof-avatar-field');
      const submitBtn = document.getElementById('bof-auth-submit-btn');

      tabLogin?.classList.toggle('is-active', authMode === 'login');
      tabReg?.classList.toggle('is-active', authMode === 'register');
      if (avatarField) avatarField.style.display = authMode === 'register' ? 'block' : 'none';
      if (submitBtn) submitBtn.textContent = authMode === 'login' ? 'เข้าสู่ระบบ ▶' : 'สร้างบัญชีและเริ่มซิงค์ ▶';

      const handlePickStarterDeck = newId => {
        selectedAvatarId = newId;
        renderAvatarPicker('bof-register-avatar-picker', selectedAvatarId, handlePickStarterDeck);
      };
      renderAvatarPicker('bof-register-avatar-picker', selectedAvatarId, handlePickStarterDeck);
    }
  }

  function renderAvatarPicker(containerId, activeId, onPick) {
    const box = document.getElementById(containerId);
    if (!box) return;
    box.innerHTML = '';
    AVATAR_LEADERS.forEach(item => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'bof-avatar-option' + (item.id === activeId ? ' is-selected' : '');
      const img = document.createElement('img');
      img.src = item.image;
      img.alt = item.label;
      const span = document.createElement('span');
      span.textContent = item.label;
      btn.appendChild(img);
      btn.appendChild(span);
      btn.addEventListener('click', () => {
        if (onPick) onPick(item.id);
      });
      box.appendChild(btn);
    });
  }

  function setStatusMessage(text, isError = false) {
    const msgEl = document.getElementById('bof-auth-msg');
    if (!msgEl) return;
    msgEl.textContent = text;
    msgEl.className = 'bof-auth-msg ' + (isError ? 'is-error' : 'is-ok');
  }

  /* ---------------- เชื่อมระบบเข้ากับการจัดเด็ค, จบเกม, และ PvP ---------------- */
  function hookGameEvents() {
    // 1. เมื่อกดบันทึกเด็คในหน้า Deck Builder -> ซิงค์เข้าบัญชีทันที
    document.getElementById('btn-save-start')?.addEventListener('click', () => {
      setTimeout(() => {
        if (!currentUser) return;
        const savedDeck = readCurrentDeckFromStorage();
        if (savedDeck) {
          currentUser.savedDeck = savedDeck;
          persistCurrentUserProfile();
        }
      }, 50);
    });

    // 2. ดักจับผลแพ้/ชนะอัตโนมัติโดยไม่ต้องแก้ไฟล์ js/game.js
    if (typeof window.showEndMatchModal === 'function') {
      const origShowEndMatch = window.showEndMatchModal;
      window.showEndMatchModal = function (title, desc) {
        if (currentUser) {
          const isWin = String(title).includes('ชนะ');
          currentUser.wins = (currentUser.wins || 0) + (isWin ? 1 : 0);
          currentUser.losses = (currentUser.losses || 0) + (isWin ? 0 : 1);
          currentUser.matches = (currentUser.matches || 0) + 1;
          persistCurrentUserProfile();
        }
        return origShowEndMatch.apply(this, arguments);
      };
    }

    // 3. เมื่อเริ่มเกมใหม่ (VS AI หรือ PvP) -> แสดงชื่อผู้เล่นของบัญชีบนการ์ด Leader
    if (typeof window.initGame === 'function') {
      const origInitGame = window.initGame;
      window.initGame = function () {
        const res = origInitGame.apply(this, arguments);
        updateInGamePlayerIdentity();
        return res;
      };
    }

    // 4. ส่งชื่อผู้เล่นให้เพื่อนในโหมด PvP เมื่อเชื่อมต่อสำเร็จ
    if (typeof window.handleIncomingPvpData === 'function') {
      const origHandlePvp = window.handleIncomingPvpData;
      window.handleIncomingPvpData = function (data) {
        if (data && data.type === 'PLAYER_PROFILE' && data.username) {
          const aiHeader = document.querySelector('.ai-side-zone .side-header-bar span b');
          if (aiHeader) aiHeader.textContent = data.username;
          const aiRole = document.querySelector('#ai-leader-box .leader-role-tag');
          if (aiRole) aiRole.textContent = `👑 ${data.username}`;
          return;
        }
        return origHandlePvp.apply(this, arguments);
      };
    }

    if (typeof window.startPvpMatchBoard === 'function') {
      const origStartPvp = window.startPvpMatchBoard;
      window.startPvpMatchBoard = function (role) {
        const res = origStartPvp.apply(this, arguments);
        updateInGamePlayerIdentity();
        if (currentUser && typeof pvpState !== 'undefined' && pvpState.conn && pvpState.conn.open) {
          try {
            pvpState.conn.send({
              type: 'PLAYER_PROFILE',
              username: currentUser.username,
              avatarId: currentUser.avatarId
            });
          } catch (e) {}
        }
        return res;
      };
    }
  }

  function bindAuthUI() {
    const dialog = document.getElementById('bof-auth-dialog');
    if (!dialog) return;

    document.getElementById('lb-auth-bar')?.addEventListener('click', () => {
      renderAuthDialogContent();
      dialog.showModal();
    });

    document.getElementById('bof-auth-close')?.addEventListener('click', () => dialog.close());

    document.getElementById('bof-tab-login')?.addEventListener('click', () => {
      authMode = 'login';
      renderAuthDialogContent();
    });

    document.getElementById('bof-tab-register')?.addEventListener('click', () => {
      authMode = 'register';
      renderAuthDialogContent();
    });

    document.getElementById('bof-auth-form')?.addEventListener('submit', async e => {
      e.preventDefault();
      const userInp = document.getElementById('bof-input-username');
      const passInp = document.getElementById('bof-input-password');
      const submitBtn = document.getElementById('bof-auth-submit-btn');
      if (!userInp || !passInp) return;

      try {
        if (submitBtn) submitBtn.disabled = true;
        if (authMode === 'register') {
          await registerAccount(userInp.value, passInp.value, selectedAvatarId);
          setStatusMessage('🎉 สมัครสมาชิกและเข้าสู่ระบบสำเร็จ!', false);
        } else {
          await loginAccount(userInp.value, passInp.value);
          setStatusMessage('✅ เข้าสู่ระบบสำเร็จ!', false);
        }
        userInp.value = '';
        passInp.value = '';
        renderAuthDialogContent();
      } catch (err) {
        setStatusMessage(err.message || 'เกิดข้อผิดพลาด', true);
      } finally {
        if (submitBtn) submitBtn.disabled = false;
      }
    });

    document.getElementById('bof-btn-logout')?.addEventListener('click', async () => {
      await logoutAccount();
      renderAuthDialogContent();
    });
  }

  async function restoreSession() {
    await initFirebaseIfConfigured();
    try {
      const savedKey = localStorage.getItem(STORAGE_SESSION_KEY);
      if (savedKey) {
        const db = loadLocalAccounts();
        if (db[savedKey]) {
          currentUser = db[savedKey];
          applyProfileDeckToGame(currentUser);
        }
      }
    } catch (e) {}
    renderAuthBar();
    updateInGamePlayerIdentity();
  }

  window.BOFAuth = {
    currentUser: () => currentUser,
    loginAccount,
    registerAccount,
    logoutAccount,
    syncEconomy: eco => {
      if (!currentUser || !eco) return;
      currentUser.coins = eco.coins;
      currentUser.shards = eco.shards;
      currentUser.pityCount = eco.pityCount;
      currentUser.ownedCards = eco.ownedCards;
      currentUser.packsOpened = eco.packsOpened;
      persistCurrentUserProfile();
    }
  };

  bindAuthUI();
  hookGameEvents();
  restoreSession();
})();
