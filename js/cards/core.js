/* ============================================================================
   SAFARI (iOS/macOS) & SAMSUNG INTERNET / IN-APP WEBVIEW COMPATIBILITY LAYER
   ป้องกันหน้าเว็บขาว/ค้าง/เด้งใน Safari (โหมดส่วนตัว/บล็อกคุกกี้/WebKit) และเบราว์เซอร์ Samsung
   ============================================================================ */
(function () {
  if (typeof window === 'undefined') return;

  // 1. Safe localStorage & sessionStorage (ป้องกัน SecurityError ใน Safari Private / Samsung Secret / In-App WebView)
  function ensureSafeStorage(propName) {
    try {
      var st = window[propName];
      if (!st) throw new Error('Storage unavailable');
      var testKey = '__bof_storage_test__';
      st.setItem(testKey, '1');
      st.removeItem(testKey);
      // ห่อ setItem อีกชั้นเพื่อกัน QuotaExceededError ใน Safari
      var origSetItem = st.setItem.bind(st);
      var origGetItem = st.getItem.bind(st);
      var origRemoveItem = st.removeItem.bind(st);
      var memFallback = {};
      st.setItem = function (k, v) {
        try { origSetItem(k, String(v)); } catch (e) { memFallback[k] = String(v); }
      };
      st.getItem = function (k) {
        try {
          var val = origGetItem(k);
          return val !== null ? val : (Object.prototype.hasOwnProperty.call(memFallback, k) ? memFallback[k] : null);
        } catch (e) {
          return Object.prototype.hasOwnProperty.call(memFallback, k) ? memFallback[k] : null;
        }
      };
      st.removeItem = function (k) {
        try { origRemoveItem(k); } catch (e) {}
        delete memFallback[k];
      };
    } catch (err) {
      var mem = {};
      var fakeStorage = {
        getItem: function (k) { return Object.prototype.hasOwnProperty.call(mem, k) ? mem[k] : null; },
        setItem: function (k, v) { mem[k] = String(v); },
        removeItem: function (k) { delete mem[k]; },
        clear: function () { mem = {}; },
        key: function (i) { return Object.keys(mem)[i] || null; },
        get length() { return Object.keys(mem).length; }
      };
      try {
        Object.defineProperty(window, propName, { value: fakeStorage, configurable: true, writable: true });
      } catch (e2) {}
    }
  }
  ensureSafeStorage('localStorage');
  ensureSafeStorage('sessionStorage');

  // 2. Polyfill: Element.prototype.replaceChildren (สำหรับ Safari รุ่นเก่า / Samsung WebView)
  if (typeof Element !== 'undefined' && !Element.prototype.replaceChildren) {
    var replaceChildrenPolyfill = function () {
      while (this.firstChild) {
        this.removeChild(this.firstChild);
      }
      for (var i = 0; i < arguments.length; i++) {
        var node = arguments[i];
        if (typeof node === 'string') {
          this.appendChild(document.createTextNode(node));
        } else if (node) {
          this.appendChild(node);
        }
      }
    };
    Element.prototype.replaceChildren = replaceChildrenPolyfill;
    if (typeof DocumentFragment !== 'undefined') {
      DocumentFragment.prototype.replaceChildren = replaceChildrenPolyfill;
    }
  }

  // 3. Polyfill: MediaQueryList.prototype.addEventListener (Safari < 14 / Samsung WebView)
  if (typeof window.matchMedia === 'function') {
    try {
      var mqlProto = Object.getPrototypeOf(window.matchMedia('(max-width: 1px)'));
      if (mqlProto && !mqlProto.addEventListener && mqlProto.addListener) {
        mqlProto.addEventListener = function (type, listener) {
          if (type === 'change') this.addListener(listener);
        };
        mqlProto.removeEventListener = function (type, listener) {
          if (type === 'change') this.removeListener(listener);
        };
      }
    } catch (e) {}
  }

  // 4. Polyfill: HTMLDialogElement (.showModal / .close) สำหรับ iOS Safari < 15.4 & Samsung In-App Browser
  function patchDialogElement(proto) {
    if (!proto) return;
    if (typeof proto.showModal !== 'function') {
      proto.showModal = function () {
        this.setAttribute('open', '');
        this.classList.add('bof-dialog-polyfilled');
        this.open = true;
      };
    }
    if (typeof proto.close !== 'function') {
      proto.close = function (returnValue) {
        if (returnValue !== undefined) this.returnValue = returnValue;
        this.removeAttribute('open');
        this.classList.remove('bof-dialog-polyfilled');
        this.open = false;
        try {
          this.dispatchEvent(new CustomEvent('close'));
        } catch (e) {}
      };
    }
  }
  if (typeof HTMLDialogElement !== 'undefined') {
    patchDialogElement(HTMLDialogElement.prototype);
  } else if (typeof HTMLElement !== 'undefined') {
    patchDialogElement(HTMLElement.prototype);
  }

  // 5. Polyfill: HTMLImageElement.prototype.decode
  if (typeof HTMLImageElement !== 'undefined' && !HTMLImageElement.prototype.decode) {
    HTMLImageElement.prototype.decode = function () {
      return Promise.resolve();
    };
  }

  // 6. ปลดล็อก html.lm-pre เสมอหากเกิด JS Error ใดๆ เพื่อไม่ให้หน้าเว็บมืดหรือขาวค้าง
  window.addEventListener('error', function () {
    if (document.documentElement) {
      document.documentElement.classList.remove('lm-pre');
    }
  });
})();

/* ข้อมูลการ์ด: อาร์เรย์กลางและรายชื่อเด็ค (ไฟล์ต่อเด็คจะ push เข้ามา) */
const CARD_DATABASE = [];
const DECK_LISTS = {};
