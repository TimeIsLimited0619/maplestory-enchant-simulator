/**
 * 共用視窗拖曳（對齊 UICharacterInfo 手感）
 * PanelDrag.enable(el, { handle, ignoreSelector, storageKey, title, grid })
 * grid：網格吸附間距（px），預設 10；設 0 關閉
 */
const PanelDrag = (() => {
  let current = null;
  let zCounter = 12000;
  const DEFAULT_GRID = 3;

  function $(sel, root) {
    if (!sel) return null;
    if (typeof sel !== 'string') return sel;
    return (root || document).querySelector(sel);
  }

  function resolveGrid(opts) {
    if (opts && Object.prototype.hasOwnProperty.call(opts, 'grid')) {
      const n = Number(opts.grid);
      return Number.isFinite(n) && n > 0 ? n : 0;
    }
    return DEFAULT_GRID;
  }

  function snap(value, grid) {
    if (!grid || grid <= 0) return Math.round(value);
    return Math.round(value / grid) * grid;
  }

  function clampPos(x, y) {
    const maxX = Math.max(0, window.innerWidth - 40);
    const maxY = Math.max(0, window.innerHeight - 40);
    return {
      x: Math.max(0, Math.min(maxX, x)),
      y: Math.max(0, Math.min(maxY, y)),
    };
  }

  function applyPos(el, x, y, grid) {
    if (!el) return;
    const snapped = clampPos(snap(x, grid), snap(y, grid));
    el.style.left = `${snapped.x}px`;
    el.style.top = `${snapped.y}px`;
  }

  /** 第一次拖曳時改為 fixed，鎖在當下螢幕座標 */
  function pinFixed(el, grid) {
    if (!el || el.dataset.panelDragPinned === '1') return;
    const rect = el.getBoundingClientRect();
    el.style.position = 'fixed';
    el.style.right = 'auto';
    el.style.bottom = 'auto';
    el.style.margin = '0';
    applyPos(el, rect.left, rect.top, grid);
    el.dataset.panelDragPinned = '1';
    el.classList.add('is-panel-drag-pinned');
  }

  function bringFront(el) {
    if (!el) return;
    zCounter += 1;
    el.style.zIndex = String(zCounter);
  }

  function savePos(el, storageKey) {
    if (!el || !storageKey) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify({
        left: el.style.left,
        top: el.style.top,
      }));
    } catch (_) { /* ignore */ }
  }

  function restore(el, storageKey, grid) {
    if (!el || !storageKey) return false;
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return false;
      const data = JSON.parse(raw);
      if (!data?.left || !data?.top) return false;
      const left = parseFloat(data.left);
      const top = parseFloat(data.top);
      if (!Number.isFinite(left) || !Number.isFinite(top)) return false;
      el.style.position = 'fixed';
      el.style.right = 'auto';
      el.style.bottom = 'auto';
      el.style.margin = '0';
      applyPos(el, left, top, grid);
      el.dataset.panelDragPinned = '1';
      el.classList.add('is-panel-drag-pinned');
      return true;
    } catch (_) {
      return false;
    }
  }

  function enable(el, opts) {
    opts = opts || {};
    if (!el || el.dataset.panelDragBound === '1') return;
    el.dataset.panelDragBound = '1';

    const grid = resolveGrid(opts);
    el.dataset.panelDragGrid = String(grid);

    if (opts.storageKey) restore(el, opts.storageKey, grid);

    let handle = opts.handle ? $(opts.handle, el) : el;
    if (!handle && opts.handle) {
      // handle 尚未插入時允許之後用 ensureHandle
      handle = null;
    }
    if (!handle) handle = el;

    if (opts.title) handle.setAttribute('title', opts.title);
    handle.classList.add('panel-drag-handle');

    // 點擊視窗任意處即可置頂（含按鈕／輸入，不攔截操作）
    el.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;
      bringFront(el);
    });

    handle.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;
      if (opts.ignoreSelector && e.target.closest?.(opts.ignoreSelector)) return;
      // 避免拖到輸入／按鈕時搶走操作
      const tag = String(e.target?.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'select' || tag === 'textarea' || tag === 'option') return;
      e.preventDefault();
      pinFixed(el, grid);
      const rect = el.getBoundingClientRect();
      current = {
        el,
        ox: e.clientX - rect.left,
        oy: e.clientY - rect.top,
        storageKey: opts.storageKey || '',
        grid,
      };
    });
  }

  function onMove(e) {
    if (!current?.el) return;
    applyPos(
      current.el,
      e.clientX - current.ox,
      e.clientY - current.oy,
      current.grid
    );
  }

  function onUp() {
    if (!current?.el) {
      current = null;
      return;
    }
    // 放開時再對齊一次，確保落點在網格上
    const left = parseFloat(current.el.style.left) || 0;
    const top = parseFloat(current.el.style.top) || 0;
    applyPos(current.el, left, top, current.grid);
    savePos(current.el, current.storageKey);
    current = null;
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }

  return {
    enable,
    restore,
    pinFixed,
    bringFront,
    snap,
    DEFAULT_GRID,
  };
})();

if (typeof window !== 'undefined') {
  window.PanelDrag = PanelDrag;
}
