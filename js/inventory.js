/**
 * InventoryModule - 背包 UI（分頁 / 128 格 / 滾輪 / min-full）
 */
const InventoryModule = {
  mode: 'min',
  tab: 'equip',
  scrollTop: 0,
  draggingThumb: false,
  dragStartY: 0,
  dragStartScroll: 0,

  SLOT_COUNT: INVENTORY_SLOT_COUNT,
  /** 小背包：4 欄 × 32 列 */
  COLS: 4,
  ROWS: 32,
  /** 大背包：4 個 4×8 區塊橫向排列 → 16 欄 × 8 列 */
  FULL_COLS: 16,
  FULL_ROWS: 8,
  BLOCK_SIZE: 32,
  SLOT_SIZE: 42,
  ITEM_SIZE: 40,
  GAP: 4,
  VISIBLE_ROWS_MIN: 8,

  rowStride() {
    return this.SLOT_SIZE + this.GAP;
  },

  gridHeight(rows) {
    return rows * this.rowStride() - this.GAP;
  },

  getInventory() {
    return this.tab === 'consume' ? playerInventoryConsume : playerInventoryEquip;
  },

  init() {
    this.bindEvents();
    this.syncTabUi();
    this.render();
    this.updateSlotCount();
    this.updateScroll();
  },

  bindEvents() {
    const panel = document.getElementById('inventoryPanel');
    const viewport = document.getElementById('invViewport');
    const track = document.getElementById('invScrollTrack');
    const thumb = document.getElementById('invScrollThumb');

    document.getElementById('invBtnFull')?.addEventListener('click', () => this.setMode('full'));
    document.getElementById('invBtnMin')?.addEventListener('click', () => this.setMode('min'));
    document.getElementById('invBtnSortEquip')?.addEventListener('click', () => this.sortEquipInventory());

    document.querySelectorAll('.inv-tab').forEach((btn) => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        if (tab) this.setTab(tab);
      });
    });

    viewport?.addEventListener('wheel', (e) => this.onWheel(e), { passive: false });

    track?.addEventListener('mousedown', (e) => this.onTrackMouseDown(e));
    thumb?.addEventListener('mousedown', (e) => this.onThumbMouseDown(e));
    window.addEventListener('mousemove', (e) => this.onThumbMouseMove(e));
    window.addEventListener('mouseup', () => this.onThumbMouseUp());
  },

  setMode(mode) {
    if (this.mode === mode) return;
    this.mode = mode;
    this.scrollTop = 0;

    const panel = document.getElementById('inventoryPanel');
    panel?.classList.toggle('inv-mode-min', mode === 'min');
    panel?.classList.toggle('inv-mode-full', mode === 'full');

    document.getElementById('invBtnFull')?.classList.toggle('hidden', mode === 'full');
    document.getElementById('invBtnMin')?.classList.toggle('hidden', mode === 'min');
    document.getElementById('invTabsMin')?.classList.toggle('hidden', mode === 'full');
    document.getElementById('invTabsFull')?.classList.toggle('hidden', mode === 'min');
    document.getElementById('invScrollbar')?.classList.toggle('hidden', mode === 'full');

    this.render();
    this.syncTabUi();
    this.updateSlotCount();
    this.updateScroll();
  },

  syncTabUi() {
    const panel = document.getElementById('inventoryPanel');
    if (panel) {
      panel.classList.toggle('inv-active-equip', this.tab === 'equip');
      panel.classList.toggle('inv-active-consume', this.tab === 'consume');
    }

    document.getElementById('invSlotCountEquip')?.classList.toggle('hidden', this.tab !== 'equip');
    document.getElementById('invSlotCountConsume')?.classList.toggle('hidden', this.tab !== 'consume');

    const sortBtn = document.getElementById('invBtnSortEquip');
    if (sortBtn) sortBtn.disabled = this.tab !== 'equip';
  },

  getEquipSortRank(itemId) {
    const item = typeof ITEM_DATABASE !== 'undefined' ? ITEM_DATABASE[itemId] : null;
    if (!item) return 99;
    if (item.mainType === EQUIP_TYPE.ARMOR) return 0;
    if (item.mainType === EQUIP_TYPE.ACCESSORY) return 1;
    if (item.mainType === EQUIP_TYPE.WEAPON) return 2;
    if (item.mainType === EQUIP_TYPE.offHandWeapon) return 3;
    if (item.mainType === EQUIP_TYPE.Energy) return 4;
    return 5;
  },

  sortEquipInventory() {
    if (this.tab !== 'equip') {
      this.setTab('equip');
    }

    if (typeof EquipTooltipModule !== 'undefined') {
      EquipTooltipModule.hide();
    }

    if (currentEnchantItem && typeof saveInventoryItemState === 'function') {
      saveInventoryItemState(currentEnchantItem.slotIndex, currentEnchantItem);
    }

    const entries = [];
    for (let i = 0; i < playerInventoryEquip.length; i++) {
      const itemId = playerInventoryEquip[i];
      if (!itemId) continue;
      entries.push({
        itemId,
        state: playerInventoryState[i] ?? null,
        oldIndex: i,
        rank: this.getEquipSortRank(itemId),
      });
    }

    if (!entries.length) {
      if (typeof addLog === 'function') addLog('[背包] 沒有可整理的裝備。', 'log-info');
      return;
    }

    entries.sort((a, b) => {
      if (a.rank !== b.rank) return a.rank - b.rank;
      return a.oldIndex - b.oldIndex;
    });

    const nextEquip = new Array(playerInventoryEquip.length).fill(null);
    const nextState = new Array(playerInventoryState.length).fill(null);
    let equippedNewIndex = currentEnchantItem ? null : undefined;

    entries.forEach((entry, index) => {
      nextEquip[index] = entry.itemId;
      nextState[index] = entry.state;
      if (currentEnchantItem && entry.oldIndex === currentEnchantItem.slotIndex) {
        equippedNewIndex = index;
      }
    });

    playerInventoryEquip.splice(0, playerInventoryEquip.length, ...nextEquip);
    playerInventoryState.splice(0, playerInventoryState.length, ...nextState);
    if (typeof playerInventory !== 'undefined') {
      playerInventory.splice(0, playerInventory.length, ...nextEquip);
    }

    if (currentEnchantItem && Number.isInteger(equippedNewIndex)) {
      currentEnchantItem.slotIndex = equippedNewIndex;
    }

    if (typeof SessionPersistenceModule !== 'undefined') {
      SessionPersistenceModule.scheduleSave();
    }

    this.scrollTop = 0;
    this.render();
    this.updateSlotCount();
    this.updateScroll();

    if (typeof addLog === 'function') {
      addLog('[背包] 已依 武器→副武器→飾品→防具 整理裝備。', 'log-info');
    }
  },

  setTab(tab) {
    if (this.tab === tab) return;
    if (typeof EquipTooltipModule !== 'undefined') {
      EquipTooltipModule.hide();
    }
    this.tab = tab;
    this.scrollTop = 0;

    document.querySelectorAll('.inv-tab').forEach((btn) => {
      btn.classList.toggle('checked', btn.dataset.tab === tab);
    });

    this.syncTabUi();
    this.render();
    this.updateSlotCount();
    this.updateScroll();
    if (typeof CatValleyEnhanceModule !== 'undefined') {
      CatValleyEnhanceModule.updateButton();
    }
  },

  getFullGridPlacement(slotIndex) {
    const block = Math.floor(slotIndex / this.BLOCK_SIZE);
    const inBlock = slotIndex % this.BLOCK_SIZE;
    const row = Math.floor(inBlock / this.COLS) + 1;
    const col = block * 8 + (inBlock % this.COLS) * 2 + 1;
    return { row, col };
  },

  applySlotGridPosition(slot, slotIndex) {
    if (this.mode === 'full') {
      const { row, col } = this.getFullGridPlacement(slotIndex);
      slot.style.gridRow = String(row);
      slot.style.gridColumn = String(col);
    } else {
      slot.style.gridRow = '';
      slot.style.gridColumn = '';
    }
  },

  getItemMainPotentialRank(itemId, slotIndex) {
    if (this.tab !== 'equip') return 'rare';

    const saved = playerInventoryState[slotIndex];
    if (saved?.potential?.rank) return saved.potential.rank;

    const template = ITEM_DATABASE[itemId];
    if (template?.potential?.rank) return template.potential.rank;

    return 'rare';
  },

  render() {
    const grid = document.getElementById('inventoryGrid');
    if (!grid) return;

    grid.innerHTML = '';

    const inventory = this.getInventory();

    for (let i = 0; i < this.SLOT_COUNT; i++) {
      const slot = document.createElement('div');
      slot.className = 'ms-inv-slot';
      slot.dataset.slotIndex = i;
      slot.dataset.invTab = this.tab;

      slot.ondragover = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        slot.classList.add('inv-drag-over');
      };
      slot.ondragleave = () => slot.classList.remove('inv-drag-over');
      slot.ondrop = (e) => this.handleDrop(e, i);

      this.applySlotGridPosition(slot, i);

      const entry = inventory[i] ?? null;
      if (this.tab === 'equip') {
        this.renderEquipSlot(slot, entry, i);
      } else if (this.tab === 'consume') {
        this.renderConsumeSlot(slot, entry, i);
      }

      grid.appendChild(slot);
    }

    if (currentEnchantItem && this.tab === 'equip') {
      const slotIndex = currentEnchantItem.slotIndex;
      const invItemImg = document.getElementById(`inv_item_equip_${slotIndex}`);
      const invFrame = invItemImg?.parentElement;
      const invSlot = invFrame?.parentElement;
      if (invFrame?.classList.contains('inv-item-frame')) {
        invFrame.classList.add('equipped-hidden');
      }
      if (invSlot) invSlot.classList.add('inv-slot-equipped');
    }
  },

  renderEquipSlot(slot, itemId, slotIndex) {
    if (!itemId || typeof ITEM_DATABASE === 'undefined' || !ITEM_DATABASE[itemId]) return;

    const itemData = ITEM_DATABASE[itemId];
    const potentialRank = this.getItemMainPotentialRank(itemId, slotIndex);
    slot.classList.add(`inv-potential-${potentialRank}`);

    const itemFrame = document.createElement('div');
    itemFrame.className = 'inv-item-frame';

    const equipImg = document.createElement('img');
    equipImg.src = itemData.icon;
    equipImg.alt = itemData.name;
    equipImg.id = `inv_item_equip_${slotIndex}`;
    equipImg.draggable = true;

    equipImg.ondragstart = (e) => {
      e.dataTransfer.setData('text/plain', JSON.stringify({
        slotIndex,
        itemId,
        tab: 'equip',
      }));
      e.dataTransfer.effectAllowed = 'move';
      slot.classList.add('inv-dragging');
    };
    equipImg.ondragend = () => {
      slot.classList.remove('inv-dragging');
      document.querySelectorAll('.ms-inv-slot.inv-drag-over').forEach((el) => {
        el.classList.remove('inv-drag-over');
      });
    };

    equipImg.ondblclick = () => loadEquipToSlot(itemId, slotIndex);

    itemFrame.appendChild(equipImg);
    slot.appendChild(itemFrame);
  },

  renderConsumeSlot(slot, entry, slotIndex) {
    if (typeof isStarForceScrollConsumeEntry === 'function' && isStarForceScrollConsumeEntry(entry)) {
      this.renderStarForceScrollSlot(slot, entry, slotIndex);
    }
  },

  renderStarForceScrollSlot(slot, entry, slotIndex) {
    const scroll = typeof getStarForceScrollById === 'function'
      ? getStarForceScrollById(entry.scrollId)
      : null;
    if (!scroll) return;

    const count = typeof getPlayerStarForceScrollCount === 'function'
      ? getPlayerStarForceScrollCount(scroll.id)
      : 0;
    if (count <= 0) return;

    const selected = typeof StarForceModule !== 'undefined'
      && StarForceModule.selectedScrollId === scroll.id;
    if (selected) slot.classList.add('inv-slot-selected');

    const itemFrame = document.createElement('div');
    itemFrame.className = 'inv-item-frame inv-consume-frame';

    const scrollImg = document.createElement('img');
    scrollImg.src = scroll.icon;
    scrollImg.alt = scroll.name;
    scrollImg.id = `inv_item_consume_${slotIndex}`;
    scrollImg.draggable = true;
    scrollImg.title = `${scroll.name}（雙擊選取）`;

    scrollImg.ondragstart = (e) => {
      e.dataTransfer.setData('text/plain', JSON.stringify({
        slotIndex,
        tab: 'consume',
      }));
      e.dataTransfer.effectAllowed = 'move';
      slot.classList.add('inv-dragging');
    };
    scrollImg.ondragend = () => {
      slot.classList.remove('inv-dragging');
      document.querySelectorAll('.ms-inv-slot.inv-drag-over').forEach((el) => {
        el.classList.remove('inv-drag-over');
      });
    };

    scrollImg.addEventListener('dblclick', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.handleStarForceScrollDblClick(scroll.id);
    });

    const countEl = document.createElement('span');
    countEl.className = 'inv-item-count';
    countEl.textContent = String(count);

    itemFrame.appendChild(scrollImg);
    itemFrame.appendChild(countEl);
    slot.appendChild(itemFrame);
  },

  handleStarForceScrollDblClick(scrollId) {
    if (typeof StarForceModule === 'undefined') return;

    const count = typeof getPlayerStarForceScrollCount === 'function'
      ? getPlayerStarForceScrollCount(scrollId)
      : 0;
    if (count <= 0) return;

    if (StarForceModule.selectedScrollId === scrollId) {
      StarForceModule.clearSelectedScroll();
      return;
    }

    StarForceModule.setSelectedScroll(scrollId);

    const scroll = typeof getStarForceScrollById === 'function'
      ? getStarForceScrollById(scrollId)
      : null;
    if (scroll && typeof addLog === 'function') {
      addLog(`[星力] 已選擇【${scroll.name}】，請放置裝備。`, 'log-info');
    }

    if (typeof switchCategoryTab === 'function') {
      switchCategoryTab('star', document.getElementById('tabStar'));
    }

    if (this.tab !== 'equip') {
      this.setTab('equip');
    }
  },

  swapSlots(fromIndex, toIndex) {
    if (fromIndex === toIndex) return;

    const inventory = this.getInventory();

    const fromId = inventory[fromIndex] ?? null;
    const toId = inventory[toIndex] ?? null;

    if (this.tab === 'equip') {
      if (currentEnchantItem?.slotIndex === fromIndex || currentEnchantItem?.slotIndex === toIndex) {
        saveInventoryItemState(currentEnchantItem.slotIndex, currentEnchantItem);
      }

      const fromState = playerInventoryState[fromIndex] ?? null;
      const toState = playerInventoryState[toIndex] ?? null;
      playerInventoryState[fromIndex] = toState;
      playerInventoryState[toIndex] = fromState;

      if (currentEnchantItem) {
        if (currentEnchantItem.slotIndex === fromIndex) {
          currentEnchantItem.slotIndex = toIndex;
        } else if (currentEnchantItem.slotIndex === toIndex) {
          currentEnchantItem.slotIndex = fromIndex;
        }
      }
    }

    inventory[fromIndex] = toId;
    inventory[toIndex] = fromId;

    if (typeof SessionPersistenceModule !== 'undefined') {
      SessionPersistenceModule.scheduleSave();
    }

    this.render();
    this.updateSlotCount();
  },

  handleDrop(e, targetIndex) {
    e.preventDefault();
    e.stopPropagation();

    const slot = e.currentTarget;
    slot?.classList.remove('inv-drag-over');

    const data = e.dataTransfer.getData('text/plain');
    if (!data) return;

    try {
      const { slotIndex: fromIndex, tab: fromTab } = JSON.parse(data);
      if (fromIndex === undefined || fromIndex === targetIndex) return;
      if (fromTab && fromTab !== this.tab) return;
      this.swapSlots(fromIndex, targetIndex);
    } catch (err) {
      console.error('背包拖曳失敗:', err);
    }
  },

  updateSlotCount() {
    const equipCount = playerInventoryEquip.filter(Boolean).length;
    const consumeCount = playerInventoryConsume.filter((entry) => {
      if (!entry) return false;
      if (typeof isStarForceScrollConsumeEntry === 'function' && isStarForceScrollConsumeEntry(entry)) {
        return getPlayerStarForceScrollCount(entry.scrollId) > 0;
      }
      return true;
    }).length;

    const equipCurrent = document.getElementById('invSlotCountEquipCurrent');
    const consumeCurrent = document.getElementById('invSlotCountConsumeCurrent');

    if (equipCurrent) equipCurrent.textContent = String(equipCount);
    if (consumeCurrent) consumeCurrent.textContent = String(consumeCount);
  },

  snapScroll(value) {
    const stride = this.rowStride();
    const maxScroll = this.getMaxScroll();
    const snapped = Math.round(value / stride) * stride;
    return Math.max(0, Math.min(maxScroll, snapped));
  },

  getContentHeight() {
    return this.gridHeight(this.ROWS);
  },

  getViewportHeight() {
    if (this.mode === 'full') return this.gridHeight(this.FULL_ROWS);
    return this.gridHeight(this.VISIBLE_ROWS_MIN);
  },

  getMaxScroll() {
    if (this.mode === 'full') return 0;
    return Math.max(0, this.getContentHeight() - this.getViewportHeight());
  },

  onWheel(e) {
    if (this.mode !== 'min') return;
    e.preventDefault();
    const maxScroll = this.getMaxScroll();
    if (maxScroll <= 0) return;
    const direction = e.deltaY > 0 ? 1 : e.deltaY < 0 ? -1 : 0;
    if (!direction) return;
    this.scrollTop = this.snapScroll(this.scrollTop + direction * this.rowStride());
    this.updateScroll();
  },

  onTrackMouseDown(e) {
    if (this.mode !== 'min') return;
    const track = document.getElementById('invScrollTrack');
    if (!track || e.target.id === 'invScrollThumb') return;

    const rect = track.getBoundingClientRect();
    const ratio = (e.clientY - rect.top) / rect.height;
    const maxScroll = this.getMaxScroll();
    const maxRow = Math.round(maxScroll / this.rowStride());
    const targetRow = Math.round(ratio * maxRow);
    this.scrollTop = this.snapScroll(targetRow * this.rowStride());
    this.updateScroll();
  },

  onThumbMouseDown(e) {
    if (this.mode !== 'min') return;
    e.preventDefault();
    this.draggingThumb = true;
    this.dragStartY = e.clientY;
    this.dragStartScroll = this.scrollTop;
  },

  onThumbMouseMove(e) {
    if (!this.draggingThumb) return;

    const track = document.getElementById('invScrollTrack');
    const thumb = document.getElementById('invScrollThumb');
    if (!track || !thumb) return;

    const trackH = track.clientHeight;
    const thumbH = thumb.clientHeight;
    const maxScroll = this.getMaxScroll();
    const scrollableTrack = Math.max(1, trackH - thumbH);
    const delta = e.clientY - this.dragStartY;
    const scrollDelta = (delta / scrollableTrack) * maxScroll;

    this.scrollTop = this.snapScroll(this.dragStartScroll + scrollDelta);
    this.updateScroll();
  },

  onThumbMouseUp() {
    if (this.draggingThumb) {
      this.scrollTop = this.snapScroll(this.scrollTop);
      this.updateScroll();
    }
    this.draggingThumb = false;
  },

  updateScroll() {
    const grid = document.getElementById('inventoryGrid');
    const thumb = document.getElementById('invScrollThumb');
    const track = document.getElementById('invScrollTrack');
    if (!grid) return;

    if (this.mode === 'full') {
      grid.style.transform = '';
      if (thumb) {
        thumb.style.top = '0px';
        thumb.style.height = '28px';
      }
      return;
    }

    const maxScroll = this.getMaxScroll();
    grid.style.transform = maxScroll > 0 ? `translateY(-${this.scrollTop}px)` : '';

    if (!thumb || !track) return;

    const trackH = track.clientHeight;
    const contentH = this.getContentHeight();
    const viewportH = this.getViewportHeight();
    const thumbH = Math.max(28, Math.round(trackH * (viewportH / contentH)));
    const maxThumbTop = Math.max(0, trackH - thumbH);
    const thumbTop = maxScroll > 0 ? (this.scrollTop / maxScroll) * maxThumbTop : 0;

    thumb.style.height = `${thumbH}px`;
    thumb.style.top = `${thumbTop}px`;
  }
};

function initInventory() {
  InventoryModule.syncTabUi();
  InventoryModule.render();
  InventoryModule.updateSlotCount();
  InventoryModule.updateScroll();
}
