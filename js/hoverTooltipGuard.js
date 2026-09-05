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

  return { watch, unwatch, check: checkAll };
})();

if (typeof window !== 'undefined') {
  window.HoverTooltipGuard = HoverTooltipGuard;
}
