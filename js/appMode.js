/**
 * 模擬器 / 放置 兩大模式。
 * 放置模式僅保留：強化、裝備欄、物品欄、角色。
 */
const AppMode = (() => {
  const STORAGE_KEY = 'app.mode.v1';
  const SIM_ONLY_CLOSERS = [
    () => typeof ItemRequestPanel !== 'undefined' && ItemRequestPanel.setOpen?.(false),
    () => typeof LogPanel !== 'undefined' && LogPanel.setOpen?.(false),
    () => typeof CostTrackerModule !== 'undefined' && CostTrackerModule.close?.(),
    () => typeof CharacterCombatPanel !== 'undefined' && CharacterCombatPanel.setOpen?.(false),
    () => typeof CombatEfficiencyPanel !== 'undefined' && CombatEfficiencyPanel.setOpen?.(false),
    () => typeof EquipStatPanel !== 'undefined' && EquipStatPanel.setOpen?.(false),
    () => typeof EnchantToolsPanel !== 'undefined' && EnchantToolsPanel.setOpen?.(false),
  ];

  let inited = false;
  let mode = 'sim';

  function $(id) {
    return document.getElementById(id);
  }

  function readStored() {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'idle' ? 'idle' : 'sim';
    } catch (_) {
      return 'sim';
    }
  }

  function persist() {
    try {
      localStorage.setItem(STORAGE_KEY, mode);
    } catch (_) { /* ignore */ }
  }

  function syncButtons() {
    const simBtn = $('btnAppModeSim');
    const idleBtn = $('btnAppModeIdle');
    simBtn?.classList.toggle('is-active', mode === 'sim');
    idleBtn?.classList.toggle('is-active', mode === 'idle');
    simBtn?.setAttribute('aria-selected', mode === 'sim' ? 'true' : 'false');
    idleBtn?.setAttribute('aria-selected', mode === 'idle' ? 'true' : 'false');
  }

  function applyDocumentClass() {
    document.documentElement.classList.toggle('app-mode-idle', mode === 'idle');
    document.documentElement.classList.toggle('app-mode-sim', mode === 'sim');
    document.body.classList.toggle('app-mode-idle', mode === 'idle');
    document.body.classList.toggle('app-mode-sim', mode === 'sim');
  }

  function closeSimOnlyPanels() {
    SIM_ONLY_CLOSERS.forEach((fn) => {
      try { fn(); } catch (_) { /* ignore */ }
    });
  }

  function setMode(next) {
    const want = next === 'idle' ? 'idle' : 'sim';
    const prev = mode;
    if (want === prev) return;
    // 離開放置：先關狩獵再換角色進度，避免模擬器等級觸發 clamp 把地圖改掉
    if (want !== 'idle' && prev === 'idle' && typeof IdleHunt !== 'undefined') {
      IdleHunt.leaveIdleMode?.();
      if (typeof IdlePotionPanel !== 'undefined') IdlePotionPanel.syncVisible?.();
    }
    if (typeof CharacterProgression !== 'undefined') CharacterProgression.save?.();
    if (typeof CharacterCombatPanel !== 'undefined') CharacterCombatPanel.save?.();
    if (typeof SessionPersistenceModule !== 'undefined') {
      SessionPersistenceModule.switchProfile?.(want, prev);
    }
    mode = want;
    persist();
    applyDocumentClass();
    syncButtons();
    if (typeof AppNavSidebar !== 'undefined') AppNavSidebar.refreshProfile?.();
    if (typeof CharacterCombatPanel !== 'undefined') CharacterCombatPanel.reloadFromStorage?.();
    if (typeof CharacterProgression !== 'undefined') CharacterProgression.reloadFromStorage?.();
    if (mode === 'idle') {
      closeSimOnlyPanels();
      if (typeof IdleHunt !== 'undefined') {
        IdleHunt.enterIdleMode?.();
      }
      if (typeof IdlePotionPanel !== 'undefined') IdlePotionPanel.syncVisible?.();
    }
  }

  function init() {
    if (inited) return;
    inited = true;
    mode = readStored();
    applyDocumentClass();
    syncButtons();
    $('btnAppModeSim')?.addEventListener('click', (event) => {
      event.preventDefault();
      setMode('sim');
    });
    $('btnAppModeIdle')?.addEventListener('click', (event) => {
      event.preventDefault();
      setMode('idle');
    });
    if (mode === 'idle') {
      closeSimOnlyPanels();
      IdleHunt?.enterIdleMode?.();
    }
  }

  return {
    init,
    setMode,
    getMode: () => mode,
    isIdle: () => mode === 'idle',
  };
})();

if (typeof window !== 'undefined') {
  window.AppMode = AppMode;
  window.addEventListener('DOMContentLoaded', () => AppMode.init());
}
