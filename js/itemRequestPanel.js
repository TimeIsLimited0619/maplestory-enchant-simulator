/**
 * 物品清單：從資料庫拿裝備進背包；從背包拖回此處則移除。
 */
const ItemRequestPanel = (() => {
  const FILTERS = [
    { id: 'all', label: '全部' },
    { id: 'weapon', label: '武器' },
    { id: 'offHand', label: '副武' },
    { id: 'armor', label: '防具' },
    { id: 'accessory', label: '飾品' },
  ];

  let inited = false;
  let open = false;
  let filterId = 'all';
  let query = '';

  function $(id) {
    return document.getElementById(id);
  }

  function matchFilter(item) {
    if (!item) return false;
    if (filterId === 'weapon') return item.mainType === EQUIP_TYPE.WEAPON;
    if (filterId === 'offHand') return item.mainType === EQUIP_TYPE.offHandWeapon;
    if (filterId === 'armor') return item.mainType === EQUIP_TYPE.ARMOR;
    if (filterId === 'accessory') {
      return item.mainType === EQUIP_TYPE.ACCESSORY || item.mainType === EQUIP_TYPE.Emblem;
    }
    return true;
  }

  function sortRank(item) {
    if (!item) return 99;
    if (item.mainType === EQUIP_TYPE.WEAPON) return 0;
    if (item.mainType === EQUIP_TYPE.offHandWeapon) return 1;
    if (item.mainType === EQUIP_TYPE.ACCESSORY || item.mainType === EQUIP_TYPE.Emblem) return 2;
    if (item.mainType === EQUIP_TYPE.ARMOR) return 3;
    return 4;
  }

  function listItems() {
    if (typeof ITEM_DATABASE === 'undefined') return [];
    const q = query.trim().toLowerCase();
    return Object.keys(ITEM_DATABASE)
      .map((id) => ITEM_DATABASE[id])
      .filter((item) => matchFilter(item) && (!q || String(item.name || '').toLowerCase().includes(q)))
      .sort((a, b) => {
        const ra = sortRank(a);
        const rb = sortRank(b);
        if (ra !== rb) return ra - rb;
        return String(a.itemId || a.id).localeCompare(String(b.itemId || b.id));
      });
  }

  function grant(itemId, preferredSlot) {
    if (typeof InventoryModule === 'undefined' || typeof InventoryModule.addEquipFromCatalog !== 'function') {
      return false;
    }
    return InventoryModule.addEquipFromCatalog(itemId, preferredSlot);
  }

  function discardFromBag(slotIndex) {
    if (typeof InventoryModule === 'undefined' || typeof InventoryModule.removeEquipToCatalog !== 'function') {
      return false;
    }
    return InventoryModule.removeEquipToCatalog(slotIndex);
  }

  function renderGrid() {
    const grid = $('irqGrid');
    if (!grid) return;
    const items = listItems();
    grid.innerHTML = '';
    const countEl = $('irqCount');
    if (countEl) countEl.textContent = String(items.length);

    items.forEach((item) => {
      const slot = document.createElement('div');
      slot.className = 'irq-slot';
      slot.dataset.itemId = item.itemId || item.id;
      slot.title = item.name || '';

      const img = document.createElement('img');
      img.src = item.icon;
      img.alt = item.name || '';
      img.draggable = true;
      img.ondragstart = (e) => {
        if (typeof EquipTooltipModule !== 'undefined') EquipTooltipModule.beginDrag?.();
        e.dataTransfer.setData('text/plain', JSON.stringify({
          source: 'request',
          itemId: item.itemId || item.id,
        }));
        e.dataTransfer.effectAllowed = 'copy';
        slot.classList.add('is-dragging');
      };
      img.ondragend = () => {
        slot.classList.remove('is-dragging');
        if (typeof EquipTooltipModule !== 'undefined') EquipTooltipModule.endDrag?.();
      };
      img.addEventListener('dblclick', (e) => {
        e.preventDefault();
        e.stopPropagation();
        grant(item.itemId || item.id);
      });
      slot.appendChild(img);
      grid.appendChild(slot);
    });
  }

  function bindHover() {
    const grid = $('irqGrid');
    if (!grid || grid.dataset.eqTooltipReady) return;
    grid.addEventListener('mouseover', (event) => {
      if (typeof EquipTooltipModule === 'undefined') return;
      if (EquipTooltipModule.pinned || EquipTooltipModule.dragging) return;
      const slot = event.target.closest('.irq-slot');
      if (!slot || grid._eqTooltipSlot === slot) return;
      const itemId = slot.dataset.itemId;
      if (!itemId) return;
      grid._eqTooltipSlot = slot;
      EquipTooltipModule.show(slot, itemId, -1);
    });
    grid.addEventListener('mouseout', (event) => {
      if (typeof EquipTooltipModule === 'undefined' || EquipTooltipModule.pinned) return;
      const slot = event.target.closest('.irq-slot');
      if (!slot) return;
      const related = event.relatedTarget;
      if (related instanceof Node && slot.contains(related)) return;
      if (grid._eqTooltipSlot === slot) {
        grid._eqTooltipSlot = null;
        EquipTooltipModule.hide();
      }
    });
    grid.dataset.eqTooltipReady = '1';
  }

  function handlePanelDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    $('irqRoot')?.classList.remove('is-drop-target');
    const raw = e.dataTransfer.getData('text/plain');
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      if (parsed.source === 'request') return;
      if (parsed.tab && parsed.tab !== 'equip') return;
      if (parsed.source === 'body') return;
      if (!Number.isInteger(parsed.slotIndex)) return;
      discardFromBag(parsed.slotIndex);
    } catch (_) { /* ignore */ }
  }

  function renderChrome() {
    const filters = $('irqFilters');
    if (!filters) return;
    filters.innerHTML = FILTERS.map((f) => (
      `<button type="button" class="irq-filter${f.id === filterId ? ' is-active' : ''}" data-filter="${f.id}">${f.label}</button>`
    )).join('');
    filters.querySelectorAll('[data-filter]').forEach((btn) => {
      btn.addEventListener('click', () => {
        filterId = btn.getAttribute('data-filter') || 'all';
        renderChrome();
        renderGrid();
      });
    });
  }

  function ensureDom() {
    if ($('irqRoot')) return;
    const root = document.createElement('div');
    root.id = 'irqRoot';
    root.className = 'irq-root is-hidden';
    root.innerHTML = `
      <div class="irq-header">
        <span>物品清單</span>
        <button type="button" id="irqClose" class="panel-wb-close panel-wb-close--inline" aria-label="關閉物品清單" title="關閉"><span aria-hidden="true">×</span></button>
      </div>
      <p class="irq-hint">拖到物品欄取得（或雙擊）。從物品欄拖回此處則移除。</p>
      <div class="irq-toolbar">
        <div id="irqFilters" class="irq-filters"></div>
        <input type="search" id="irqSearch" class="irq-search" placeholder="搜尋名稱" autocomplete="off">
      </div>
      <div id="irqDrop" class="irq-drop">
        <div id="irqGrid" class="irq-grid"></div>
      </div>
      <div class="irq-footer"><span id="irqCount">0</span> 件</div>
    `;
    document.body.appendChild(root);
  }

  function bind() {
    $('btnViewRequest')?.addEventListener('click', (e) => {
      e.preventDefault();
      setOpen(!open);
    });
    $('irqClose')?.addEventListener('click', (e) => {
      e.preventDefault();
      setOpen(false);
    });
    $('irqSearch')?.addEventListener('input', (e) => {
      query = e.target.value || '';
      renderGrid();
    });
    const drop = $('irqDrop') || $('irqRoot');
    drop?.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      $('irqRoot')?.classList.add('is-drop-target');
    });
    drop?.addEventListener('dragleave', (e) => {
      if (e.currentTarget.contains(e.relatedTarget)) return;
      $('irqRoot')?.classList.remove('is-drop-target');
    });
    drop?.addEventListener('drop', handlePanelDrop);
  }

  function syncMenuButton() {
    $('btnViewRequest')?.classList.toggle('is-active', open);
  }

  function setOpen(next) {
    open = !!next;
    const root = $('irqRoot');
    if (root) root.classList.toggle('is-hidden', !open);
    if (open) {
      renderGrid();
      if (typeof PanelDrag !== 'undefined') PanelDrag.bringFront(root);
    }
    syncMenuButton();
  }

  function init() {
    if (inited) return;
    ensureDom();
    inited = true;
    bind();
    renderChrome();
    renderGrid();
    bindHover();
    setOpen(false);
  }

  return {
    init,
    setOpen,
    toggle() { setOpen(!open); },
    isOpen: () => !!open,
    refresh: renderGrid,
  };
})();

if (typeof window !== 'undefined') {
  window.ItemRequestPanel = ItemRequestPanel;
  window.addEventListener('DOMContentLoaded', () => ItemRequestPanel.init());
}
