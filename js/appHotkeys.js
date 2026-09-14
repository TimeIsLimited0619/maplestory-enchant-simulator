/**
 * 自訂選單快捷鍵：設定面板編輯、localStorage 持久化、全域按鍵觸發。
 */
const AppHotkeys = (() => {
  const STORAGE_KEY = 'app.hotkeys.v1';
  /** @type {Record<string, { code: string, key: string, ctrl: boolean, alt: boolean, shift: boolean, meta: boolean }>} */
  let bindings = Object.create(null);
  /** @type {string|null} */
  let capturingId = null;
  let inited = false;

  function readBindings() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return Object.create(null);
      const data = JSON.parse(raw);
      if (!data || typeof data !== 'object' || Array.isArray(data)) return Object.create(null);
      const out = Object.create(null);
      Object.keys(data).forEach((id) => {
        const c = normalizeChord(data[id]);
        if (c) out[id] = c;
      });
      return out;
    } catch (_) {
      return Object.create(null);
    }
  }

  function writeBindings() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(bindings));
    } catch (_) { /* ignore */ }
  }

  function normalizeChord(raw) {
    if (!raw || typeof raw !== 'object') return null;
    const code = String(raw.code || '').trim();
    if (!code) return null;
    return {
      code,
      key: String(raw.key || ''),
      ctrl: !!raw.ctrl,
      alt: !!raw.alt,
      shift: !!raw.shift,
      meta: !!raw.meta,
    };
  }

  function chordFromEvent(e) {
    if (!e || e.isComposing) return null;
    const key = e.key;
    if (key === 'Control' || key === 'Shift' || key === 'Alt' || key === 'Meta') return null;
    if (key === 'Escape') return null;
    return {
      code: e.code || '',
      key: key || '',
      ctrl: !!e.ctrlKey,
      alt: !!e.altKey,
      shift: !!e.shiftKey,
      meta: !!e.metaKey,
    };
  }

  function formatChord(c) {
    const chord = normalizeChord(c);
    if (!chord) return '未設定';
    const parts = [];
    if (chord.ctrl) parts.push('Ctrl');
    if (chord.alt) parts.push('Alt');
    if (chord.shift) parts.push('Shift');
    if (chord.meta) parts.push('Meta');
    let label = '';
    if (chord.code.startsWith('Key') && chord.code.length === 4) {
      label = chord.code.slice(3);
    } else if (chord.code.startsWith('Digit') && chord.code.length === 6) {
      label = chord.code.slice(5);
    } else if (chord.code.startsWith('Numpad')) {
      label = `Num${chord.code.slice(6)}`;
    } else if (chord.key === ' ') {
      label = 'Space';
    } else if (chord.key && chord.key.length === 1) {
      label = chord.key.toUpperCase();
    } else {
      label = chord.key || chord.code;
    }
    parts.push(label);
    return parts.join('+');
  }

  function chordsEqual(a, b) {
    const x = normalizeChord(a);
    const y = normalizeChord(b);
    if (!x || !y) return false;
    return x.code === y.code
      && !!x.ctrl === !!y.ctrl
      && !!x.alt === !!y.alt
      && !!x.shift === !!y.shift
      && !!x.meta === !!y.meta;
  }

  function getCatalog() {
    if (typeof AppNavSidebar !== 'undefined' && typeof AppNavSidebar.getHotkeyCatalog === 'function') {
      return AppNavSidebar.getHotkeyCatalog();
    }
    return [];
  }

  function getBinding(actionId) {
    return bindings[actionId] || null;
  }

  function setBinding(actionId, chord) {
    const id = String(actionId || '');
    if (!id) return false;
    const next = normalizeChord(chord);
    if (!next) {
      delete bindings[id];
      writeBindings();
      return true;
    }
    Object.keys(bindings).forEach((otherId) => {
      if (otherId !== id && chordsEqual(bindings[otherId], next)) {
        delete bindings[otherId];
      }
    });
    bindings[id] = next;
    writeBindings();
    return true;
  }

  function clearBinding(actionId) {
    return setBinding(actionId, null);
  }

  function clearAll() {
    bindings = Object.create(null);
    writeBindings();
  }

  function isTypingTarget(el) {
    if (!el || !(el instanceof Element)) return false;
    const tag = el.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
    if (el.isContentEditable) return true;
    return !!el.closest?.('input, textarea, select, [contenteditable="true"]');
  }

  function isActionAvailable(actionId) {
    const btn = document.getElementById(actionId);
    if (!btn || btn.disabled) return false;
    if (typeof AppNavSidebar !== 'undefined' && AppNavSidebar.isButtonsLocked?.()) return false;
    const simSec = btn.closest('[data-sim-only]');
    const idleSec = btn.closest('[data-idle-only]');
    const idle = typeof AppMode !== 'undefined' && !!AppMode.isIdle?.();
    if (simSec) {
      if (idle) return false;
      if (getComputedStyle(simSec).display === 'none') return false;
    }
    if (idleSec) {
      if (!idle) return false;
      if (getComputedStyle(idleSec).display === 'none') return false;
    }
    return true;
  }

  function invokeAction(actionId) {
    if (!isActionAvailable(actionId)) return false;
    const btn = document.getElementById(actionId);
    if (!btn) return false;
    btn.click();
    return true;
  }

  function findActionByEvent(e) {
    const chord = chordFromEvent(e);
    if (!chord) return null;
    const ids = Object.keys(bindings);
    for (let i = 0; i < ids.length; i += 1) {
      if (chordsEqual(bindings[ids[i]], chord)) return ids[i];
    }
    return null;
  }

  function stopCapture() {
    capturingId = null;
    refreshSettingsUi();
  }

  function startCapture(actionId) {
    capturingId = String(actionId || '') || null;
    refreshSettingsUi();
  }

  function settingsSectionHtml() {
    const catalog = getCatalog();
    let rows = '';
    catalog.forEach((group) => {
      rows += `<h4 class="game-settings-hotkey-group">${escapeHtml(group.group)}</h4>`;
      (group.items || []).forEach((item) => {
        const id = item.id;
        const chord = getBinding(id);
        const capturing = capturingId === id;
        const label = capturing ? '按下按鍵…' : formatChord(chord);
        const activeCls = capturing ? ' is-capturing' : '';
        const hasCls = chord && !capturing ? ' has-binding' : '';
        rows += `<div class="game-settings-hotkey-row" data-hotkey-id="${escapeHtml(id)}">
          <span class="game-settings-hotkey-name" title="${escapeHtml(item.title || item.label)}">${escapeHtml(item.label)}</span>
          <button type="button" class="game-settings-hotkey-bind${activeCls}${hasCls}" data-hotkey-action="capture" aria-label="設定 ${escapeHtml(item.label)} 快捷鍵">${escapeHtml(label)}</button>
          <button type="button" class="game-settings-hotkey-clear" data-hotkey-action="clear" title="清除" ${chord ? '' : 'disabled'}>×</button>
        </div>`;
      });
    });
    return `
      <section class="game-settings-section" aria-label="自訂快捷鍵列表">
        <p class="game-settings-hint">點「未設定」後按下欲綁定的按鍵（可加 Ctrl／Alt／Shift）。Esc 取消錄製；衝突時會覆蓋舊綁定。</p>
        <div class="game-settings-hotkey-list" id="gameSettingsHotkeyList">
          ${rows}
        </div>
        <div class="game-settings-hotkey-footer">
          <button type="button" class="game-settings-nav" data-hotkey-action="clear-all">清除全部快捷鍵</button>
        </div>
      </section>`;
  }

  function escapeHtml(text) {
    return String(text || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function refreshSettingsUi() {
    const list = document.getElementById('gameSettingsHotkeyList');
    if (!list) return;
    const wrap = document.createElement('div');
    wrap.innerHTML = settingsSectionHtml();
    const next = wrap.querySelector('#gameSettingsHotkeyList');
    const section = list.closest('.game-settings-section');
    if (next && section) {
      const fresh = wrap.querySelector('.game-settings-section');
      if (fresh) section.replaceWith(fresh);
    }
  }

  function onSettingsClick(e) {
    const btn = e.target?.closest?.('[data-hotkey-action]');
    if (!btn) return;
    const action = btn.getAttribute('data-hotkey-action');
    if (action === 'clear-all') {
      e.preventDefault();
      clearAll();
      capturingId = null;
      refreshSettingsUi();
      if (typeof addLog === 'function') addLog('[設定] 已清除全部快捷鍵。', 'log-info');
      return;
    }
    const row = btn.closest('[data-hotkey-id]');
    const id = row?.getAttribute('data-hotkey-id');
    if (!id) return;
    e.preventDefault();
    if (action === 'clear') {
      clearBinding(id);
      if (capturingId === id) capturingId = null;
      refreshSettingsUi();
      return;
    }
    if (action === 'capture') {
      if (capturingId === id) {
        stopCapture();
        return;
      }
      startCapture(id);
    }
  }

  function onKeyDown(e) {
    if (e.repeat) return;

    if (capturingId) {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        stopCapture();
        return;
      }
      if (e.key === 'Backspace' || e.key === 'Delete') {
        e.preventDefault();
        e.stopPropagation();
        clearBinding(capturingId);
        capturingId = null;
        refreshSettingsUi();
        return;
      }
      const chord = chordFromEvent(e);
      if (!chord || !chord.code) return;
      e.preventDefault();
      e.stopPropagation();
      setBinding(capturingId, chord);
      capturingId = null;
      refreshSettingsUi();
      if (typeof addLog === 'function') {
        addLog(`[設定] 快捷鍵已設為 ${formatChord(chord)}`, 'log-success');
      }
      return;
    }

    if (e.key === 'Escape') return;
    if (isTypingTarget(document.activeElement)) return;
    if (typeof isBlockingOverlayOpen === 'function' && isBlockingOverlayOpen()) return;

    const actionId = findActionByEvent(e);
    if (!actionId) return;
    e.preventDefault();
    invokeAction(actionId);
  }

  function init() {
    if (inited) return;
    inited = true;
    bindings = readBindings();
    window.addEventListener('keydown', onKeyDown, true);
  }

  return {
    init,
    settingsSectionHtml,
    onSettingsClick,
    getBinding,
    setBinding,
    clearBinding,
    clearAll,
    formatChord,
    isCapturing: () => !!capturingId,
    stopCapture,
  };
})();

if (typeof window !== 'undefined') {
  window.AppHotkeys = AppHotkeys;
}
