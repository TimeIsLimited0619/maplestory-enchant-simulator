/**
 * HoverTooltipGuard — 錨點被重建／移除時自動關閉 hover tooltip。
 *
 * mouseout／mouseleave 在 innerHTML 重建時不會觸發。之後新功能只要在 show 時
 * watch、hide 時 unwatch，不必再於每個操作點手動 hide。
 *
 * HoverTooltipGuard.watch(key, anchorEl, { hide, isPinned })
 * HoverTooltipGuard.unwatch(key)
 */
const HoverTooltipGuard = (() => {
  const items = new Map();
  let raf = 0;
  let bound = false;

  function isPinned(item) {
    return typeof item.isPinned === 'function' && !!item.isPinned();
  }

  function checkAll() {
    items.forEach((item, key) => {
      if (isPinned(item)) return;
      const el = item.anchor;
      if (el && el.isConnected) return;
      items.delete(key);
      if (typeof item.hide === 'function') item.hide();
    });
    syncLoop();
  }

  function loop() {
    raf = 0;
    checkAll();
  }

  function syncLoop() {
    const need = [...items.values()].some((item) => !isPinned(item));
    if (need && !raf) {
      raf = requestAnimationFrame(loop);
    } else if (!need && raf) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
  }

  function ensureBound() {
    if (bound) return;
    bound = true;
    const kick = () => {
      if (!items.size) return;
      queueMicrotask(checkAll);
    };
    document.addEventListener('click', kick, true);
    document.addEventListener('pointerup', kick, true);
  }

  function watch(key, anchorEl, opts = {}) {
    ensureBound();
    const id = String(key || '');
    if (!id || !(anchorEl instanceof Element) || typeof opts.hide !== 'function') return;
    items.set(id, {
      anchor: anchorEl,
      hide: opts.hide,
      isPinned: opts.isPinned,
    });
    syncLoop();
    if (!anchorEl.isConnected) queueMicrotask(checkAll);
  }

  function unwatch(key) {
    items.delete(String(key || ''));
    if (!items.size && raf) {
      cancelAnimationFrame(raf);
      raf = 0;
      return;
    }
    syncLoop();
  }

  /** 商店／物品欄：tooltip 貼在該 UI 面板右側，避免蓋住格內裝備 */
  function resolveBagOrShopPanel(el) {
    if (!el || typeof el.closest !== 'function') return null;
    const shopShell = el.closest('.npc-shop-shell');
    if (shopShell) return shopShell;
    const shopRoot = el.closest('#npcShopRoot, .npc-shop');
    if (shopRoot) {
      return shopRoot.querySelector('.npc-shop-shell') || shopRoot;
    }
    return el.closest('#inventoryPanel');
  }

  function isBagOrShopAnchor(el) {
    return !!resolveBagOrShopPanel(el);
  }

  /**
   * @param {HTMLElement} tipEl
   * @param {Element} anchorEl
   * @param {{ gap?: number, fallbackW?: number, fallbackH?: number, mode?: 'auto'|'panel-right'|'prefer-right'|'prefer-left' }} [opts]
   */
  function placeTooltip(tipEl, anchorEl, opts = {}) {
    if (!tipEl || !anchorEl) return;
    const gap = Number.isFinite(opts.gap) ? opts.gap : 8;
    const tipW = tipEl.offsetWidth || opts.fallbackW || 261;
    const tipH = tipEl.offsetHeight || opts.fallbackH || 120;
    const rect = anchorEl.getBoundingClientRect();
    const panel = resolveBagOrShopPanel(anchorEl);
    let mode = opts.mode || 'auto';
    if (mode === 'auto') {
      mode = panel ? 'panel-right' : 'prefer-right';
    }

    let left;
    if (mode === 'panel-right') {
      const panelRect = (panel || anchorEl).getBoundingClientRect();
      left = panelRect.right + gap;
      // 超出螢幕只夾在右緣，不翻回蓋住 UI 內容
      if (left + tipW > window.innerWidth - gap) {
        left = Math.max(gap, window.innerWidth - tipW - gap);
      }
    } else if (mode === 'prefer-left') {
      left = rect.left - tipW - gap;
      if (left < gap) left = rect.right + gap;
    } else {
      left = rect.right + gap;
      if (left + tipW > window.innerWidth - gap) {
        left = Math.max(gap, rect.left - tipW - gap);
      }
    }

    let top = rect.top;
    if (top + tipH > window.innerHeight - gap) {
      top = Math.max(gap, window.innerHeight - tipH - gap);
    }
    if (top < gap) top = gap;

    tipEl.style.left = `${left}px`;
    tipEl.style.top = `${top}px`;
  }

  return {
    watch,
    unwatch,
    check: checkAll,
    isBagOrShopAnchor,
    resolveBagOrShopPanel,
    placeTooltip,
  };
})();

if (typeof window !== 'undefined') {
  window.HoverTooltipGuard = HoverTooltipGuard;
}
