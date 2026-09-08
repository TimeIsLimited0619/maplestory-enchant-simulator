/**
 * 分解中心側欄：分解裝備／分解卷軸，對照背包可分解清單後點擊分解。
 * 右側可展開「配方預覽」列出全部分解配方，並接上 UI Tooltip。
 */
const DisassemblePanel = (() => {
  let inited = false;
  let open = false;
  let recipeOpen = false;
  /** home | equip | scroll */
  let view = 'home';

  function $(id) {
    return document.getElementById(id);
  }

  function store() {
    return typeof DisassembleStore !== 'undefined' ? DisassembleStore : null;
  }

  function tipAttr(kind, itemId) {
    const id = String(itemId || '').trim();
    if (!kind || !id) return '';
    return ` data-disassemble-tip="${kind}" data-item-id="${id}"`;
  }

  function hideDisassembleTips() {
    if (typeof EquipTooltipModule !== 'undefined') EquipTooltipModule.hide?.();
    if (typeof InventoryModule !== 'undefined') {
      InventoryModule.hideEtcTooltip?.();
      InventoryModule.hideConsumeTooltip?.();
    }
  }

  function showDisassembleTip(anchorEl, kind, itemId) {
    const id = String(itemId || '').trim();
    if (!anchorEl || !kind || !id) return;
    if (typeof EquipTooltipModule !== 'undefined'
      && (EquipTooltipModule.pinned || EquipTooltipModule.dragging)) return;

    hideDisassembleTips();

    if (kind === 'equip') {
      if (typeof ITEM_DATABASE === 'undefined' || !ITEM_DATABASE[id]) return;
      if (typeof EquipTooltipModule !== 'undefined') {
        EquipTooltipModule.show(anchorEl, id, -1);
      }
      return;
    }

    if (kind === 'etc' && typeof InventoryModule !== 'undefined') {
      const catalog = typeof IdleEtcStore !== 'undefined' ? IdleEtcStore.get(id) : null;
      InventoryModule.showEtcTooltip?.(
        anchorEl,
        catalog?.name || id,
        catalog?.desc || '',
        catalog?.icon || '',
      );
      return;
    }

    if (kind === 'scroll' && typeof InventoryModule !== 'undefined') {
      const scroll = typeof getScrollById === 'function' ? getScrollById(id) : null;
      if (scroll?.hover) {
        InventoryModule.showConsumeTooltip?.(anchorEl, scroll.hover);
      }
    }
  }

  function bindDisassembleTooltips(el) {
    if (!el || el.dataset.disassembleTooltipReady) return;
    el.addEventListener('mouseover', (event) => {
      const tipEl = event.target.closest?.('[data-disassemble-tip][data-item-id]');
      if (!tipEl || !el.contains(tipEl)) return;
      if (el._disassembleTipEl === tipEl) return;
      el._disassembleTipEl = tipEl;
      showDisassembleTip(
        tipEl,
        tipEl.getAttribute('data-disassemble-tip') || '',
        tipEl.getAttribute('data-item-id') || '',
      );
    });
    el.addEventListener('mouseout', (event) => {
      const tipEl = event.target.closest?.('[data-disassemble-tip][data-item-id]');
      if (!tipEl || el._disassembleTipEl !== tipEl) return;
      const related = event.relatedTarget;
      if (related instanceof Node && tipEl.contains(related)) return;
      el._disassembleTipEl = null;
      hideDisassembleTips();
    });
    el.dataset.disassembleTooltipReady = '1';
  }

  function panelMarkup() {
    return `<div id="disassembleRoot" class="disassemble-root" aria-hidden="true">
      <div id="disassemblePanel" class="disassemble-panel" role="dialog" aria-labelledby="disassembleTitle">
        <div class="disassemble-head">
          <button type="button" id="disassembleBack" class="disassemble-nav" hidden>← 返回</button>
          <span id="disassembleTitle">分解中心</span>
          <button type="button" id="disassembleRecipeToggle" class="disassemble-nav" aria-pressed="false">配方預覽</button>
          <button type="button" id="disassembleClose" class="disassemble-nav">關閉</button>
        </div>
        <div id="disassembleBody" class="disassemble-body"></div>
      </div>
      <div id="disassembleRecipePanel" class="disassemble-recipe-panel" aria-hidden="true">
        <div class="disassemble-head">
          <span id="disassembleRecipeTitle">分解配方</span>
          <button type="button" id="disassembleRecipeClose" class="disassemble-nav">關閉</button>
        </div>
        <div id="disassembleRecipeBody" class="disassemble-body"></div>
      </div>
    </div>`;
  }

  function ensureDom() {
    let root = $('disassembleRoot');
    const nav = $('appNavSidebar');
    if (!root) {
      const legacy = $('disassemblePanel');
      if (legacy && !legacy.closest('#disassembleRoot')) legacy.remove();
      if (nav) nav.insertAdjacentHTML('afterend', panelMarkup());
      else document.body.insertAdjacentHTML('beforeend', panelMarkup());
      root = $('disassembleRoot');
    } else {
      const inField = root.closest('.idle-hunt-field-wrap');
      if (inField || (nav && root.previousElementSibling !== nav && root.nextElementSibling !== nav)) {
        root.remove();
        if (nav) nav.insertAdjacentElement('afterend', root);
        else document.body.appendChild(root);
      }
    }
    bindDisassembleTooltips($('disassembleBody'));
    bindDisassembleTooltips($('disassembleRecipeBody'));
    return root;
  }

  function syncChrome() {
    const root = $('disassembleRoot');
    root?.classList.toggle('is-open', open);
    root?.setAttribute('aria-hidden', open ? 'false' : 'true');
    $('btnViewDisassemble')?.classList.toggle('is-active', open);

    const back = $('disassembleBack');
    if (back) back.hidden = view === 'home';
    const title = $('disassembleTitle');
    if (title) {
      title.textContent = view === 'equip' ? '分解裝備' : (view === 'scroll' ? '分解卷軸' : '分解中心');
    }

    const showRecipe = open && recipeOpen;
    const recipePanel = $('disassembleRecipePanel');
    recipePanel?.classList.toggle('is-open', showRecipe);
    recipePanel?.setAttribute('aria-hidden', showRecipe ? 'false' : 'true');

    const toggle = $('disassembleRecipeToggle');
    if (toggle) {
      toggle.classList.toggle('is-active', showRecipe);
      toggle.setAttribute('aria-pressed', showRecipe ? 'true' : 'false');
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
      return `<span class="disassemble-mat"${tipAttr('etc', id)}>${img}${s.etcName(id)} ×${amt}</span>`;
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
        const tipId = row.kind === 'scroll' ? row.scrollId : row.itemId;
        const tipKind = row.kind === 'scroll' ? 'scroll' : 'equip';
        const icon = row.icon
          ? `<img class="disassemble-row__icon" src="${row.icon}" alt="" draggable="false"${tipAttr(tipKind, tipId)} onerror="this.style.opacity='0.3'">`
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

  function recipeRowsMarkup(rows, tipKind, idKey) {
    if (!rows.length) return '<div class="disassemble-empty">尚無配方。</div>';
    return `<div class="disassemble-list">${rows.map((row) => {
      const tipId = row[idKey];
      const icon = row.icon
        ? `<img class="disassemble-row__icon" src="${row.icon}" alt="" draggable="false"${tipAttr(tipKind, tipId)} onerror="this.style.opacity='0.3'">`
        : '<span class="disassemble-row__icon"></span>';
      return `<div class="disassemble-row disassemble-row--static">
        ${icon}
        <span class="disassemble-row__text">
          <span class="disassemble-row__name"${tipAttr(tipKind, tipId)}>${row.name}</span>
          ${materialsMarkup(row.materials)}
        </span>
      </div>`;
    }).join('')}</div>`;
  }

  function recipeMarkup() {
    const s = store();
    if (!s) return '<div class="disassemble-empty">分解資料尚未載入。</div>';
    const equips = s.listEquipRecipes();
    const scrolls = s.listScrollRecipes();
    return `<p class="disassemble-hint">滑鼠移到圖示或名稱可查看物品說明。</p>
      <div class="disassemble-section-title">裝備（${equips.length}）</div>
      ${recipeRowsMarkup(equips, 'equip', 'itemId')}
      <div class="disassemble-section-title">卷軸（${scrolls.length}）</div>
      ${recipeRowsMarkup(scrolls, 'scroll', 'scrollId')}`;
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

  function setRecipeOpen(next) {
    recipeOpen = !!next;
    if (!recipeOpen) hideDisassembleTips();
    render();
  }

  function toggleRecipe() {
    setRecipeOpen(!recipeOpen);
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
    const recipeBody = $('disassembleRecipeBody');
    if (recipeBody) {
      recipeBody.innerHTML = (open && recipeOpen) ? recipeMarkup() : '';
    }
    syncInventoryPick();
  }

  function setOpen(next) {
    open = !!next;
    if (open) {
      view = 'home';
      if (typeof EquipCraftPanel !== 'undefined') EquipCraftPanel.setOpen?.(false);
      if (typeof JobChangePanel !== 'undefined') JobChangePanel.setOpen?.(false);
      if (typeof IdleHunt !== 'undefined' && typeof IdleHunt.setPickerOpen === 'function') {
        IdleHunt.setPickerOpen(false);
      }
      if (typeof IdleDungeon !== 'undefined') IdleDungeon.setOpen?.(false);
      if (typeof IdleBoss !== 'undefined') IdleBoss.closeAll?.();
    } else {
      view = 'home';
      recipeOpen = false;
      hideDisassembleTips();
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
    $('disassembleRecipeToggle')?.addEventListener('click', (e) => {
      e.preventDefault();
      toggleRecipe();
    });
    $('disassembleRecipeClose')?.addEventListener('click', (e) => {
      e.preventDefault();
      setRecipeOpen(false);
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
    isRecipeOpen: () => open && recipeOpen,
    setRecipeOpen,
    toggleRecipe,
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
