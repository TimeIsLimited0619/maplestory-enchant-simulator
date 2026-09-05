/**
 * 分解中心側欄：分解裝備／分解卷軸，對照背包可分解清單後點擊分解。
 */
const DisassemblePanel = (() => {
  let inited = false;
  let open = false;
  /** home | equip | scroll */
  let view = 'home';

  function $(id) {
    return document.getElementById(id);
  }

  function store() {
    return typeof DisassembleStore !== 'undefined' ? DisassembleStore : null;
  }

  function panelMarkup() {
    return `<div id="disassemblePanel" class="disassemble-panel" role="dialog" aria-labelledby="disassembleTitle" aria-hidden="true">
      <div class="disassemble-head">
        <button type="button" id="disassembleBack" class="disassemble-nav" hidden>← 返回</button>
        <span id="disassembleTitle">分解中心</span>
        <button type="button" id="disassembleClose" class="disassemble-nav">關閉</button>
      </div>
      <div id="disassembleBody" class="disassemble-body"></div>
    </div>`;
  }

  function ensureDom() {
    let panel = $('disassemblePanel');
    const nav = $('appNavSidebar');
    if (!panel) {
      if (nav) nav.insertAdjacentHTML('afterend', panelMarkup());
      else document.body.insertAdjacentHTML('beforeend', panelMarkup());
      panel = $('disassemblePanel');
    } else {
      const inField = panel.closest('.idle-hunt-field-wrap');
      if (inField || (nav && panel.previousElementSibling !== nav && panel.nextElementSibling !== nav)) {
        panel.remove();
        if (nav) nav.insertAdjacentElement('afterend', panel);
        else document.body.appendChild(panel);
      }
    }
    return panel;
  }

  function syncChrome() {
    const panel = $('disassemblePanel');
    panel?.classList.toggle('is-open', open);
    panel?.setAttribute('aria-hidden', open ? 'false' : 'true');
    $('btnViewDisassemble')?.classList.toggle('is-active', open);
    const back = $('disassembleBack');
    if (back) back.hidden = view === 'home';
    const title = $('disassembleTitle');
    if (title) {
      title.textContent = view === 'equip' ? '分解裝備' : (view === 'scroll' ? '分解卷軸' : '分解中心');
    }
  }

  function materialsMarkup(mats) {
    const s = store();
    if (!s || !mats) return '';
    const chips = Object.entries(mats).map(([id, amt]) => {
      const icon = s.etcIcon(id);
      const img = icon
        ? `<img class="disassemble-mat-icon" src="${icon}" alt="" draggable="false" onerror="this.style.opacity='0.3'">`
        : '';
      return `<span class="disassemble-mat">${img}${s.etcName(id)} ×${amt}</span>`;
    }).join('');
    return `<span class="disassemble-row__meta">${chips || '—'}</span>`;
  }

  function homeMarkup() {
    return `<div class="disassemble-list">
      <button type="button" class="disassemble-row" data-action="open-equip">
        <span class="disassemble-row__text">
          <span class="disassemble-row__name">分解裝備</span>
          <span class="disassemble-row__meta">對照背包，點擊可分解的裝備</span>
        </span>
      </button>
      <button type="button" class="disassemble-row" data-action="open-scroll">
        <span class="disassemble-row__text">
          <span class="disassemble-row__name">分解卷軸</span>
          <span class="disassemble-row__meta">對照消耗欄，點擊可分解的卷軸（Shift＝10 張，Ctrl＝全部）</span>
        </span>
      </button>
    </div>
    <p class="disassemble-hint"></p>`;
  }

  function listMarkup(kind) {
    const s = store();
    if (!s) return '<div class="disassemble-empty">分解資料尚未載入。</div>';
    const rows = kind === 'scroll' ? s.listBagScrolls() : s.listBagEquips();
    if (!rows.length) {
      const what = kind === 'scroll' ? '卷軸' : '裝備';
      const hint = kind === 'scroll'
        ? '<p class="disassemble-hint">按住 Shift 一次分解 10 張，按住 Ctrl 一次分解全部。</p>'
        : '';
      return `${hint}<div class="disassemble-empty">背包中沒有可分解的${what}。</div>`;
    }
    const hint = kind === 'scroll'
      ? '點擊下列物品或背包中的高亮格子即可分解。按住 Shift 一次分解 10 張，按住 Ctrl 一次分解全部。'
      : '點擊下列物品或背包中的高亮格子即可分解。';
    return `<p class="disassemble-hint">${hint}</p>
      <div class="disassemble-list">${rows.map((row) => {
        const icon = row.icon
          ? `<img class="disassemble-row__icon" src="${row.icon}" alt="" draggable="false" onerror="this.style.opacity='0.3'">`
          : '<span class="disassemble-row__icon"></span>';
        const qty = row.count > 1 ? ` ×${row.count}` : '';
        return `<button type="button" class="disassemble-row" data-action="break" data-kind="${row.kind}" data-slot="${row.slotIndex}">
          ${icon}
          <span class="disassemble-row__text">
            <span class="disassemble-row__name">${row.name}${qty}</span>
            ${materialsMarkup(row.materials)}
          </span>
        </button>`;
      }).join('')}</div>`;
  }

  function syncInventoryPick() {
    if (typeof InventoryModule === 'undefined') return;
    if (!open || (view !== 'equip' && view !== 'scroll')) {
      InventoryModule.setDisassemblePick?.(null);
      return;
    }
    InventoryModule.setDisassemblePick(view);
    if (!InventoryModule.panelOpen) InventoryModule.setOpen?.(true);
  }

  function setView(next) {
    view = next || 'home';
    render();
  }

  function render() {
    ensureDom();
    syncChrome();
    const body = $('disassembleBody');
    if (body) {
      if (view === 'equip') body.innerHTML = listMarkup('equip');
      else if (view === 'scroll') body.innerHTML = listMarkup('scroll');
      else body.innerHTML = homeMarkup();
    }
    syncInventoryPick();
  }

  function setOpen(next) {
    open = !!next;
    if (open) {
      view = 'home';
      if (typeof EquipCraftPanel !== 'undefined') EquipCraftPanel.setOpen?.(false);
      if (typeof IdleHunt !== 'undefined' && typeof IdleHunt.setPickerOpen === 'function') {
        IdleHunt.setPickerOpen(false);
      }
      if (typeof IdleDungeon !== 'undefined') IdleDungeon.setOpen?.(false);
      if (typeof IdleBoss !== 'undefined') IdleBoss.closeAll?.();
    } else {
      view = 'home';
    }
    render();
  }

  function toggle() {
    setOpen(!open);
  }

  function scrollAmountFromEvent(e) {
    if (!e) return 1;
    if (e.ctrlKey || e.metaKey) return 'all';
    if (e.shiftKey) return 10;
    return 1;
  }

  function tryBreak(kind, slotIndex, event) {
    const s = store();
    if (!s) return false;
    const idx = Number(slotIndex);
    const ok = kind === 'scroll'
      ? s.disassembleScroll(idx, scrollAmountFromEvent(event))
      : s.disassembleEquip(idx);
    if (ok) render();
    return ok;
  }

  function bindEvents() {
    $('btnViewDisassemble')?.addEventListener('click', (e) => {
      e.preventDefault();
      toggle();
    });
    $('disassembleClose')?.addEventListener('click', (e) => {
      e.preventDefault();
      setOpen(false);
    });
    $('disassembleBack')?.addEventListener('click', (e) => {
      e.preventDefault();
      setView('home');
    });
    $('disassembleBody')?.addEventListener('click', (e) => {
      const row = e.target.closest('[data-action]');
      if (!row) return;
      e.preventDefault();
      const action = row.getAttribute('data-action');
      if (action === 'open-equip') {
        setView('equip');
        return;
      }
      if (action === 'open-scroll') {
        setView('scroll');
        return;
      }
      if (action === 'break') {
        tryBreak(row.getAttribute('data-kind'), row.getAttribute('data-slot'), e);
      }
    });
  }

  function init() {
    if (inited) return;
    inited = true;
    ensureDom();
    bindEvents();
    render();
  }

  return {
    init,
    setOpen,
    toggle,
    isOpen: () => open,
    view: () => view,
    isPicking: () => open && (view === 'equip' || view === 'scroll'),
    pickKind: () => (open ? view : ''),
    tryBreak,
    refresh: render,
  };
})();

if (typeof window !== 'undefined') {
  window.DisassemblePanel = DisassemblePanel;
  window.addEventListener('DOMContentLoaded', () => DisassemblePanel.init());
}
