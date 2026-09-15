/**
 * 放置模式定時重整（可選）＋設定面板。
 * 長時間戰鬥後記憶體易膨脹；開啟後會重整並自動續掛推圖／掛機／BOSS／副本。
 */
const IdleSessionRefresh = (() => {
  const RESUME_KEY = 'idle.sessionRefresh.resume.v1';
  const SETTINGS_KEY = 'idle.sessionRefresh.settings.v1';
  const DEFAULT_MINUTES = 8;
  const MIN_MINUTES = 1;
  const MAX_MINUTES = 120;
  const WARN_MS = 2200;
  const RESUME_MAX_AGE_MS = 120 * 1000;
  const RESUME_DELAY_MS = 800;
  const WATCH_MS = 5000;
  const BUSY_RETRY_MS = 60 * 1000;

  let inited = false;
  let panelOpen = false;
  /** home | hotkeys | fxOpacity */
  let panelView = 'home';
  let refreshing = false;
  let timer = null;
  let armedAt = 0;
  /** @type {{ enabled: boolean, minutes: number }} */
  let settings = { enabled: false, minutes: DEFAULT_MINUTES };

  function $(id) {
    return document.getElementById(id);
  }

  function clampMinutes(raw) {
    let n = Math.floor(Number(raw) || 0);
    if (!Number.isFinite(n)) n = DEFAULT_MINUTES;
    return Math.max(MIN_MINUTES, Math.min(MAX_MINUTES, n));
  }

  function readSettings() {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (!raw) return { enabled: false, minutes: DEFAULT_MINUTES };
      const data = JSON.parse(raw);
      return {
        enabled: !!data?.enabled,
        minutes: clampMinutes(data?.minutes ?? DEFAULT_MINUTES),
      };
    } catch (_) {
      return { enabled: false, minutes: DEFAULT_MINUTES };
    }
  }

  function writeSettings(next) {
    settings = {
      enabled: !!next.enabled,
      minutes: clampMinutes(next.minutes),
    };
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (_) { /* ignore */ }
    return settings;
  }

  function getSettings() {
    return { ...settings };
  }

  function intervalMs() {
    return clampMinutes(settings.minutes) * 60 * 1000;
  }

  function isIdleMode() {
    return typeof AppMode === 'undefined' || !!AppMode.isIdle?.();
  }

  function isCombatActive() {
    if (!isIdleMode()) return false;
    if (typeof IdleBoss !== 'undefined' && IdleBoss.isArenaOpen?.()) return true;
    if (typeof IdleHunt !== 'undefined' && IdleHunt.getDungeon?.()) return true;
    if (typeof IdleHunt !== 'undefined' && IdleHunt.isRunning?.()) return true;
    if (typeof IdleBoss !== 'undefined' && IdleBoss.getAutoResumeState?.()) return true;
    if (typeof IdleDungeon !== 'undefined' && IdleDungeon.getAutoResumeState?.()) return true;
    return false;
  }

  function captureResume() {
    const boss = typeof IdleBoss !== 'undefined' ? IdleBoss.getAutoResumeState?.() : null;
    if (boss) return boss;
    const dungeon = typeof IdleDungeon !== 'undefined' ? IdleDungeon.getAutoResumeState?.() : null;
    if (dungeon) return dungeon;
    if (typeof IdleHunt === 'undefined') return null;
    const mode = IdleHunt.getAfkMode?.() || 'off';
    if (mode === 'push' || mode === 'farm') {
      return { kind: 'hunt', afkMode: mode, wantRunning: true };
    }
    if (IdleHunt.isRunning?.()) {
      return { kind: 'hunt', afkMode: 'off', wantRunning: true };
    }
    return null;
  }

  function writeTicket(snap) {
    try {
      sessionStorage.setItem(RESUME_KEY, JSON.stringify({
        v: 1,
        at: Date.now(),
        snap,
      }));
    } catch (_) { /* ignore */ }
  }

  function consumeTicket() {
    try {
      const raw = sessionStorage.getItem(RESUME_KEY);
      if (!raw) return null;
      sessionStorage.removeItem(RESUME_KEY);
      const data = JSON.parse(raw);
      if (!data || data.v !== 1 || !data.snap) return null;
      if (Date.now() - Number(data.at || 0) > RESUME_MAX_AGE_MS) return null;
      return data.snap;
    } catch (_) {
      return null;
    }
  }

  function clearTimer() {
    if (timer != null) {
      window.clearTimeout(timer);
      timer = null;
    }
    armedAt = 0;
  }

  function armTimer(ms) {
    if (!settings.enabled) {
      clearTimer();
      return;
    }
    const wait = Math.max(1000, ms != null ? ms : intervalMs());
    clearTimer();
    armedAt = Date.now();
    timer = window.setTimeout(() => {
      timer = null;
      void doRefresh();
    }, wait);
  }

  function rearmFromSettings() {
    if (!settings.enabled || !isCombatActive() || refreshing) {
      clearTimer();
      return;
    }
    armTimer(intervalMs());
  }

  function flushSaves() {
    try { IdleHunt?.save?.({ flush: true }); } catch (_) { /* ignore */ }
    try { CharacterProgression?.flushSave?.(); } catch (_) { /* ignore */ }
    try { CharacterCombatPanel?.save?.(); } catch (_) { /* ignore */ }
    try { SessionPersistenceModule?.saveToStorage?.(); } catch (_) { /* ignore */ }
  }

  async function softExit(snap) {
    if (snap?.kind === 'boss') {
      IdleBoss?.exitForSessionRefresh?.();
      return;
    }
    if (snap?.kind === 'dungeon') {
      await IdleDungeon?.exitForSessionRefresh?.();
      return;
    }
    try { IdleHunt?.stop?.(true); } catch (_) { /* ignore */ }
  }

  async function doRefresh() {
    if (refreshing) return;
    if (!settings.enabled) {
      clearTimer();
      return;
    }
    if (!isCombatActive()) return;
    if (typeof aePotIsAnyAutoEnchantRunning === 'function' && aePotIsAnyAutoEnchantRunning()) {
      armTimer(BUSY_RETRY_MS);
      return;
    }

    const snap = captureResume();
    if (!snap) {
      armTimer(intervalMs());
      return;
    }

    refreshing = true;
    if (typeof addLog === 'function') {
      addLog('記憶體整理：即將重新整理並自動續掛…', 'log-info');
    }

    try {
      await softExit(snap);
    } catch (_) { /* ignore */ }

    flushSaves();
    writeTicket(snap);

    window.setTimeout(() => {
      try {
        window.location.reload();
      } catch (_) {
        refreshing = false;
        armTimer(intervalMs());
      }
    }, WARN_MS);
  }

  async function resumeAfterLoad(snap) {
    if (!snap || !snap.kind) return;
    if (!isIdleMode()) {
      try { AppMode?.setMode?.('idle'); } catch (_) { /* ignore */ }
    }
    await new Promise((r) => window.setTimeout(r, RESUME_DELAY_MS));

    try {
      if (snap.kind === 'boss') {
        const ok = IdleBoss?.applyAutoResumeState?.(snap);
        if (ok && typeof addLog === 'function') {
          addLog('記憶體整理完成，已自動續行 BOSS 挑戰。', 'log-info');
        }
        return;
      }
      if (snap.kind === 'dungeon') {
        const ok = await IdleDungeon?.applyAutoResumeState?.(snap);
        if (ok && typeof addLog === 'function') {
          addLog('記憶體整理完成，已自動續行副本挑戰。', 'log-info');
        }
        return;
      }
      if (snap.kind === 'hunt') {
        const mode = snap.afkMode === 'farm' || snap.afkMode === 'push' ? snap.afkMode : 'off';
        if (mode !== 'off') {
          IdleHunt?.setAfkMode?.(mode, { resume: true });
        } else if (snap.wantRunning) {
          IdleHunt?.setOpen?.(true);
          IdleHunt?.start?.();
        }
        if (typeof addLog === 'function') {
          const label = mode === 'farm' ? '自動掛機' : mode === 'push' ? '自動推圖' : '狩獵';
          addLog(`記憶體整理完成，已自動續行${label}。`, 'log-info');
        }
      }
    } catch (_) { /* ignore */ }
  }

  function watch() {
    if (refreshing) return;
    if (!settings.enabled) {
      clearTimer();
      return;
    }
    if (!isCombatActive()) {
      clearTimer();
      return;
    }
    const ms = intervalMs();
    if (timer == null) {
      armTimer(ms);
      return;
    }
    if (armedAt > 0 && Date.now() - armedAt >= ms + 2000) {
      clearTimer();
      void doRefresh();
    }
  }

  /* ── 設定面板 UI ── */

  function panelMarkup() {
    return `<div id="gameSettingsPanel" class="game-settings-panel" role="dialog" aria-labelledby="gameSettingsTitle" aria-hidden="true">
      <div class="game-settings-head">
        <button type="button" id="gameSettingsBack" class="game-settings-nav game-settings-back hidden" aria-label="返回">返回</button>
        <span id="gameSettingsTitle">設定</span>
        <button type="button" id="gameSettingsClose" class="game-settings-nav">關閉</button>
      </div>
      <div id="gameSettingsBody" class="game-settings-body"></div>
    </div>`;
  }

  function ensureDom() {
    let panel = $('gameSettingsPanel');
    const nav = $('appNavSidebar');
    if (!panel) {
      if (nav) nav.insertAdjacentHTML('afterend', panelMarkup());
      else document.body.insertAdjacentHTML('beforeend', panelMarkup());
      panel = $('gameSettingsPanel');
    } else if (!$('gameSettingsBack')) {
      const head = panel.querySelector('.game-settings-head');
      const title = $('gameSettingsTitle');
      if (head && title) {
        title.insertAdjacentHTML(
          'beforebegin',
          '<button type="button" id="gameSettingsBack" class="game-settings-nav game-settings-back hidden" aria-label="返回">返回</button>'
        );
      }
    }
    return panel;
  }

  function syncChrome() {
    const panel = $('gameSettingsPanel');
    panel?.classList.toggle('is-open', panelOpen);
    panel?.setAttribute('aria-hidden', panelOpen ? 'false' : 'true');
    $('btnViewGameSettings')?.classList.toggle('is-active', panelOpen);
    const back = $('gameSettingsBack');
    const title = $('gameSettingsTitle');
    const onSub = panelView === 'hotkeys' || panelView === 'fxOpacity';
    back?.classList.toggle('hidden', !onSub);
    if (title) {
      title.textContent = panelView === 'hotkeys'
        ? '自訂快捷鍵'
        : (panelView === 'fxOpacity' ? '特效透明度' : '設定');
    }
  }

  function fxOpacityBodyMarkup() {
    const fx = (typeof SkillEffectPlayer !== 'undefined' && SkillEffectPlayer.getFxOpacity)
      ? SkillEffectPlayer.getFxOpacity()
      : { skill: 1, hit: 1 };
    const skillPct = Math.round((Number(fx.skill) || 1) * 100);
    const hitPct = Math.round((Number(fx.hit) || 1) * 100);
    return `
      <section class="game-settings-section" aria-label="特效透明度">
        <p class="game-settings-hint">調整戰鬥中技能特效與怪物受擊特效的顯示透明度（0% 全透明、100% 不透明）。</p>
        <label class="game-settings-range">
          <span class="game-settings-range-head">
            <span>特效透明度</span>
            <span id="gameSettingsFxSkillPct">${skillPct}%</span>
          </span>
          <input type="range" id="gameSettingsFxSkill" min="0" max="100" step="1" value="${skillPct}" aria-label="特效透明度">
        </label>
        <p class="game-settings-hint">玩家技能 effect（施法／effect／召喚等；不含投射物）。</p>
        <label class="game-settings-range">
          <span class="game-settings-range-head">
            <span>打擊透明度</span>
            <span id="gameSettingsFxHitPct">${hitPct}%</span>
          </span>
          <input type="range" id="gameSettingsFxHit" min="0" max="100" step="1" value="${hitPct}" aria-label="打擊透明度">
        </label>
        <p class="game-settings-hint">打在怪物身上的 hit 特效。</p>
      </section>`;
  }

  function homeBodyMarkup() {
    const s = settings;
    const checked = s.enabled ? ' checked' : '';
    const hideDmg = typeof DamageNumber !== 'undefined' && !!DamageNumber.getHideDamageNumbers?.();
    const hideDmgChecked = hideDmg ? ' checked' : '';
    return `
      <section class="game-settings-section" aria-label="戰鬥顯示">
        <h3 class="game-settings-section-title">戰鬥顯示</h3>
        <label class="game-settings-check" title="隱藏玩家對怪物造成的傷害數字（怪物打你仍會顯示）">
          <input type="checkbox" id="gameSettingsHideDamageNumbers"${hideDmgChecked}>
          <span>透明字形</span>
        </label>
        <p class="game-settings-hint">開啟透明字形，可略為提升效能。</p>
      </section>
      <section class="game-settings-section" aria-label="自動重整">
        <h3 class="game-settings-section-title">記憶體釋放</h3>
        <p class="game-settings-hint">長時間放置戰鬥後可能變卡。開啟後會依間隔重新整理頁面，並自動接回推圖／掛機／自動 BOSS／自動副本。</p>
        <label class="game-settings-check">
          <input type="checkbox" id="gameSettingsAutoRefresh"${checked}>
          <span>啟用自動重整</span>
        </label>
        <label class="game-settings-field">
          <span>每隔幾分鐘重整</span>
          <input type="number" id="gameSettingsMinutes" min="${MIN_MINUTES}" max="${MAX_MINUTES}" step="1" value="${s.minutes}" ${s.enabled ? '' : 'disabled'}>
        </label>
        <p class="game-settings-hint">建議 ${DEFAULT_MINUTES}～10 分鐘。可填 ${MIN_MINUTES}～${MAX_MINUTES}。</p>
      </section>
      <section class="game-settings-section" aria-label="快捷鍵">
        <h3 class="game-settings-section-title">操作</h3>
        <button type="button" class="game-settings-subnav" data-settings-nav="fxOpacity">
          <span class="game-settings-subnav-label">特效透明度</span>
          <span class="game-settings-subnav-chevron" aria-hidden="true">›</span>
        </button>
        <button type="button" class="game-settings-subnav" data-settings-nav="hotkeys">
          <span class="game-settings-subnav-label">自訂快捷鍵</span>
          <span class="game-settings-subnav-chevron" aria-hidden="true">›</span>
        </button>
        <p class="game-settings-hint">戰鬥顯示與選單快捷鍵可於此調整。</p>
      </section>`;
  }

  function bodyMarkup() {
    if (panelView === 'hotkeys'
      && typeof AppHotkeys !== 'undefined'
      && typeof AppHotkeys.settingsSectionHtml === 'function') {
      return AppHotkeys.settingsSectionHtml();
    }
    if (panelView === 'fxOpacity') {
      return fxOpacityBodyMarkup();
    }
    return homeBodyMarkup();
  }

  function setPanelView(next) {
    const view = (next === 'hotkeys' || next === 'fxOpacity') ? next : 'home';
    if (panelView === view) {
      renderPanel();
      return;
    }
    if (panelView === 'hotkeys' && view !== 'hotkeys' && typeof AppHotkeys !== 'undefined') {
      AppHotkeys.stopCapture?.();
    }
    panelView = view;
    renderPanel();
  }

  function renderPanel() {
    ensureDom();
    const body = $('gameSettingsBody');
    if (body) body.innerHTML = bodyMarkup();
    syncChrome();
  }

  function applyFromPanelInputs() {
    const enabled = !!$('gameSettingsAutoRefresh')?.checked;
    const minutes = clampMinutes($('gameSettingsMinutes')?.value);
    writeSettings({ enabled, minutes });
    const minEl = $('gameSettingsMinutes');
    if (minEl) {
      minEl.value = String(settings.minutes);
      minEl.disabled = !settings.enabled;
    }
    rearmFromSettings();
  }

  function applyHideDamageFromPanel() {
    if (typeof DamageNumber === 'undefined') return;
    DamageNumber.setHideDamageNumbers?.(!!$('gameSettingsHideDamageNumbers')?.checked);
  }

  function setPanelOpen(next) {
    panelOpen = !!next;
    if (panelOpen) {
      if (typeof SaveBackupPanel !== 'undefined') SaveBackupPanel.setOpen?.(false);
      if (typeof JobChangePanel !== 'undefined') JobChangePanel.setOpen?.(false);
      if (typeof EquipCraftPanel !== 'undefined') EquipCraftPanel.setOpen?.(false);
      if (typeof DisassemblePanel !== 'undefined') DisassemblePanel.setOpen?.(false);
      if (typeof IdleHunt !== 'undefined') IdleHunt.setPickerOpen?.(false);
      if (typeof IdleDungeon !== 'undefined') IdleDungeon.setOpen?.(false);
      if (typeof IdleBoss !== 'undefined') IdleBoss.closeAll?.();
      settings = readSettings();
      panelView = 'home';
    } else {
      panelView = 'home';
      if (typeof AppHotkeys !== 'undefined') AppHotkeys.stopCapture?.();
    }
    renderPanel();
  }

  function applyFxOpacityFromPanel() {
    if (typeof SkillEffectPlayer === 'undefined' || typeof SkillEffectPlayer.setFxOpacity !== 'function') {
      return;
    }
    const skillEl = $('gameSettingsFxSkill');
    const hitEl = $('gameSettingsFxHit');
    if (!skillEl && !hitEl) return;
    const skill = skillEl ? (Number(skillEl.value) || 0) / 100 : undefined;
    const hit = hitEl ? (Number(hitEl.value) || 0) / 100 : undefined;
    const next = SkillEffectPlayer.setFxOpacity({ skill, hit });
    const skillPct = $('gameSettingsFxSkillPct');
    const hitPct = $('gameSettingsFxHitPct');
    if (skillPct) skillPct.textContent = `${Math.round((next.skill || 0) * 100)}%`;
    if (hitPct) hitPct.textContent = `${Math.round((next.hit || 0) * 100)}%`;
  }

  function bindPanelEvents() {
    $('btnViewGameSettings')?.addEventListener('click', (e) => {
      e.preventDefault();
      setPanelOpen(!panelOpen);
    });
    $('gameSettingsClose')?.addEventListener('click', (e) => {
      e.preventDefault();
      setPanelOpen(false);
    });
    $('gameSettingsBack')?.addEventListener('click', (e) => {
      e.preventDefault();
      setPanelView('home');
    });
    $('gameSettingsBody')?.addEventListener('click', (e) => {
      const navBtn = e.target?.closest?.('[data-settings-nav]');
      if (navBtn) {
        e.preventDefault();
        setPanelView(navBtn.getAttribute('data-settings-nav') || 'home');
        return;
      }
      if (typeof AppHotkeys !== 'undefined') AppHotkeys.onSettingsClick?.(e);
    });
    $('gameSettingsBody')?.addEventListener('input', (e) => {
      const id = e.target?.id;
      if (id === 'gameSettingsFxSkill' || id === 'gameSettingsFxHit') {
        applyFxOpacityFromPanel();
      }
    });
    $('gameSettingsBody')?.addEventListener('change', (e) => {
      const t = e.target;
      if (!t) return;
      if (t.id === 'gameSettingsHideDamageNumbers') {
        applyHideDamageFromPanel();
        return;
      }
      if (t.id === 'gameSettingsFxSkill' || t.id === 'gameSettingsFxHit') {
        applyFxOpacityFromPanel();
        return;
      }
      if (t.id === 'gameSettingsAutoRefresh' || t.id === 'gameSettingsMinutes') {
        applyFromPanelInputs();
      }
    });
    $('gameSettingsBody')?.addEventListener('blur', (e) => {
      if (e.target?.id === 'gameSettingsMinutes') applyFromPanelInputs();
    }, true);
  }

  function init() {
    if (inited) return;
    inited = true;
    settings = readSettings();
    ensureDom();
    bindPanelEvents();
    syncChrome();
    if (typeof AppHotkeys !== 'undefined') AppHotkeys.init?.();
    if (typeof SkillEffectPlayer !== 'undefined') SkillEffectPlayer.initFxOpacity?.();

    const pending = consumeTicket();
    if (pending) {
      window.setTimeout(() => { void resumeAfterLoad(pending); }, 0);
    }
    window.setInterval(watch, WATCH_MS);
    if (settings.enabled && isCombatActive()) armTimer(intervalMs());
  }

  return {
    init,
    getSettings,
    setSettings(next) {
      writeSettings(next || {});
      if (panelOpen) renderPanel();
      rearmFromSettings();
      return getSettings();
    },
    setPanelOpen,
    isPanelOpen: () => panelOpen,
    setOpen: setPanelOpen,
    isOpen: () => panelOpen,
    requestRefreshNow() {
      if (!settings.enabled) return;
      clearTimer();
      void doRefresh();
    },
  };
})();

if (typeof window !== 'undefined') {
  window.IdleSessionRefresh = IdleSessionRefresh;
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => IdleSessionRefresh.init());
  } else {
    IdleSessionRefresh.init();
  }
}
