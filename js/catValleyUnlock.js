/**
 * 額外內容密籍（老遊戲風格）：預設隱藏，輸入序列後才顯示。
 * 解鎖狀態會記在本機，重整後仍有效；再輸入一次可關閉。
 */
const CatValleyUnlock = (() => {
  const STORAGE_KEY = 'enchant.secret.v1';
  const TYPED_CODE = 'meow';
  const KONAMI = [
    'ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown',
    'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight',
    'KeyB', 'KeyA',
  ];

  let unlocked = false;
  let typedBuffer = '';
  let konamiIndex = 0;
  let flashTimer = null;

  function isFormField(target) {
    if (!(target instanceof Element)) return false;
    const tag = target.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
    return target.isContentEditable;
  }

  function load() {
    try {
      unlocked = localStorage.getItem(STORAGE_KEY) === '1';
    } catch (_) {
      unlocked = false;
    }
    return unlocked;
  }

  function persist() {
    try {
      if (unlocked) localStorage.setItem(STORAGE_KEY, '1');
      else localStorage.removeItem(STORAGE_KEY);
    } catch (_) { /* ignore */ }
  }

  function applyDom() {
    document.documentElement.classList.toggle('secret-unlocked', unlocked);
  }

  function showFlash(enabled) {
    let root = document.getElementById('secretCodeFlash');
    if (!root) {
      root = document.createElement('div');
      root.id = 'secretCodeFlash';
      root.className = 'secret-code-flash';
      root.setAttribute('aria-hidden', 'true');
      root.innerHTML = '<div class="secret-code-flash-box"><span class="secret-code-flash-title"></span></div>';
      document.body.appendChild(root);
    }
    const title = root.querySelector('.secret-code-flash-title');
    if (title) title.textContent = enabled ? 'CHEAT ENABLED' : 'CHEAT DISABLED';
    root.classList.add('is-visible');
    if (flashTimer) clearTimeout(flashTimer);
    flashTimer = setTimeout(() => {
      root.classList.remove('is-visible');
    }, 1400);
  }

  function enableCatValleyRatesDefaults() {
    if (typeof setScrollCatValleyRatesEnabled === 'function') {
      setScrollCatValleyRatesEnabled(true);
    }
    if (typeof setStarForceCatValleyRatesEnabled === 'function') {
      setStarForceCatValleyRatesEnabled(true);
    }
    if (typeof setBonusStatCatValleyRatesEnabled === 'function') {
      setBonusStatCatValleyRatesEnabled(true);
    }
    if (typeof setHammerCatValleyRatesEnabled === 'function') {
      setHammerCatValleyRatesEnabled(true);
    }
  }

  function refreshDependents() {
    if (unlocked) enableCatValleyRatesDefaults();
    if (typeof CatValleyEnhanceModule !== 'undefined') {
      if (!unlocked) CatValleyEnhanceModule.closeSubmenu?.();
      CatValleyEnhanceModule.updateButton?.();
    }
    if (typeof CostTrackerModule !== 'undefined') CostTrackerModule.render?.();
    if (typeof ScrollModule !== 'undefined') ScrollModule.updateUI?.();
    const ratesCheck = document.getElementById('chkScrollCatValleyRates');
    if (ratesCheck && typeof isScrollCatValleyRatesEnabled === 'function') {
      ratesCheck.checked = isScrollCatValleyRatesEnabled();
    }
    const starRatesCheck = document.getElementById('chkStarForceCatValleyRates');
    if (starRatesCheck && typeof isStarForceCatValleyRatesEnabled === 'function') {
      starRatesCheck.checked = isStarForceCatValleyRatesEnabled();
    }
    if (typeof StarForceModule !== 'undefined') {
      StarForceModule.syncCatValleyRatesUi?.();
      StarForceModule.updateUI?.();
    }
    const bonusRatesCheck = document.getElementById('chkBonusStatCatValleyRates');
    if (bonusRatesCheck && typeof isBonusStatCatValleyRatesEnabled === 'function') {
      bonusRatesCheck.checked = isBonusStatCatValleyRatesEnabled();
    }
    if (typeof BonusStatInspectModule !== 'undefined' && BonusStatInspectModule.isOpen) {
      BonusStatInspectModule.render?.();
    }
    const hammerRatesCheck = document.getElementById('chkHammerCatValleyRates');
    if (hammerRatesCheck && typeof isHammerCatValleyRatesEnabled === 'function') {
      hammerRatesCheck.checked = isHammerCatValleyRatesEnabled();
    }
    if (typeof HammerModule !== 'undefined') {
      HammerModule.syncCatValleyRatesUi?.();
    }
  }

  function setUnlocked(next, { flash = true } = {}) {
    const enabled = !!next;
    if (unlocked === enabled) {
      applyDom();
      return unlocked;
    }
    unlocked = enabled;
    persist();
    applyDom();
    refreshDependents();
    if (flash) showFlash(unlocked);
    return unlocked;
  }

  function acceptCode() {
    typedBuffer = '';
    konamiIndex = 0;
    setUnlocked(!unlocked);
  }

  function onKeyDown(event) {
    if (event.repeat || event.ctrlKey || event.altKey || event.metaKey) return;
    if (isFormField(event.target)) {
      typedBuffer = '';
      konamiIndex = 0;
      return;
    }

    if (event.code === KONAMI[konamiIndex]) {
      konamiIndex += 1;
      if (konamiIndex >= KONAMI.length) acceptCode();
    } else {
      konamiIndex = event.code === KONAMI[0] ? 1 : 0;
    }

    if (event.key.length === 1 && /[a-z]/i.test(event.key)) {
      typedBuffer = (typedBuffer + event.key.toLowerCase()).slice(-TYPED_CODE.length);
      if (typedBuffer === TYPED_CODE) acceptCode();
    }
  }

  function init() {
    load();
    applyDom();
    if (!window.__secretCodeBound) {
      window.__secretCodeBound = true;
      window.addEventListener('keydown', onKeyDown, true);
    }
  }

  load();
  applyDom();

  return {
    init,
    isUnlocked: () => unlocked,
    setUnlocked,
  };
})();

function isCatValleyContentUnlocked() {
  return typeof CatValleyUnlock !== 'undefined' && CatValleyUnlock.isUnlocked();
}

if (typeof window !== 'undefined') {
  window.CatValleyUnlock = CatValleyUnlock;
  window.addEventListener('DOMContentLoaded', () => CatValleyUnlock.init());
}
