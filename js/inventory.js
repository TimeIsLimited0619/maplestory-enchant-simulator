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
  /** 潛能卷使用中：等待點選裝備 */
  pendingPotentialScrollId: null,
  /** 物品欄開關（頂部選單） */
  panelOpen: true,

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
    this.bindPanelControls();
    this.bindPotentialScrollUseGuards();
    this.ensureConsumeTooltip();
    if (typeof ensurePotentialScrollConsumeInventory === 'function') {
      ensurePotentialScrollConsumeInventory();
    }
    if (typeof stripLegacyStarterPotentialsFromInventory === 'function') {
      stripLegacyStarterPotentialsFromInventory();
    }
    this.syncTabUi();
    this.render();
    this.updateSlotCount();
    this.updateScroll();
    this.setOpen(this.panelOpen);
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

  bindPotentialScrollUseGuards() {
    if (this._potentialScrollGuardsBound) return;
    this._potentialScrollGuardsBound = true;

    document.addEventListener('contextmenu', (event) => {
      if (!this.pendingPotentialScrollId) return;
      event.preventDefault();
      this.cancelPotentialScrollUse();
      if (typeof addLog === 'function') {
        addLog('[消耗] 已取消使用潛在能力卷軸。', 'log-info');
      }
    });

    const dropZone = document.getElementById('equipDropZone');
    dropZone?.addEventListener('click', (event) => {
      if (!this.pendingPotentialScrollId || !currentEnchantItem) return;
      event.preventDefault();
      event.stopPropagation();
      const itemId = currentEnchantItem.itemId || currentEnchantItem.id;
      this.applyPendingPotentialScrollToEquip(itemId, -1);
    });
  },

  ensureConsumeTooltip() {
    if (document.getElementById('invConsumeTooltip')) return;
    const el = document.createElement('div');
    el.id = 'invConsumeTooltip';
    el.className = 'inv-consume-tooltip hidden';
    el.setAttribute('aria-hidden', 'true');
    el.innerHTML = '<img id="invConsumeTooltipImg" class="inv-consume-tooltip-img" alt="">';
    document.body.appendChild(el);
  },

  showConsumeTooltip(anchorEl, hoverSrc) {
    this.ensureConsumeTooltip();
    const tip = document.getElementById('invConsumeTooltip');
    const img = document.getElementById('invConsumeTooltipImg');
    if (!tip || !img || !hoverSrc || !anchorEl) return;

    this._consumeTooltipToken = (this._consumeTooltipToken || 0) + 1;
    const token = this._consumeTooltipToken;
    this._consumeTooltipAnchor = anchorEl;

    const place = () => {
      if (token !== this._consumeTooltipToken) return;
      if (!anchorEl.isConnected) return;
      const rect = anchorEl.getBoundingClientRect();
      if (!rect.width && !rect.height) return;

      tip.style.left = '-9999px';
      tip.style.top = '0px';
      tip.classList.remove('hidden');
      tip.setAttribute('aria-hidden', 'false');

      const tipW = tip.offsetWidth || img.naturalWidth || 290;
      const tipH = tip.offsetHeight || img.naturalHeight || 120;
      let left = rect.right + 8;
      let top = rect.top;
      if (left + tipW > window.innerWidth - 8) {
        left = Math.max(8, rect.left - tipW - 8);
      }
      if (top + tipH > window.innerHeight - 8) {
        top = Math.max(8, window.innerHeight - tipH - 8);
      }
      if (top < 8) top = 8;
      tip.style.left = `${left}px`;
      tip.style.top = `${top}px`;
    };

    img.onload = null;
    img.onerror = null;

    const afterReady = () => {
      if (token !== this._consumeTooltipToken) return;
      requestAnimationFrame(place);
    };

    if (img.getAttribute('src') === hoverSrc && img.complete && img.naturalWidth) {
      afterReady();
    } else {
      img.onload = () => {
        img.onload = null;
        afterReady();
      };
      img.onerror = () => {
        img.onerror = null;
        this.hideConsumeTooltip();
      };
      img.src = hoverSrc;
      tip.classList.remove('hidden');
      tip.setAttribute('aria-hidden', 'false');
      if (img.complete && img.naturalWidth) afterReady();
    }
  },

  hideConsumeTooltip() {
    this._consumeTooltipToken = (this._consumeTooltipToken || 0) + 1;
    this._consumeTooltipAnchor = null;
    const tip = document.getElementById('invConsumeTooltip');
    const img = document.getElementById('invConsumeTooltipImg');
    if (img) {
      img.onload = null;
      img.onerror = null;
    }
    if (!tip) return;
    tip.classList.add('hidden');
    tip.setAttribute('aria-hidden', 'true');
    tip.style.removeProperty('left');
    tip.style.removeProperty('top');
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
    if (item.mainType === EQUIP_TYPE.Emblem) return 4;
    return 5;
  },

  sortEquipInventory() {
    if (this.tab !== 'equip') {
      this.setTab('equip');
    }

    if (typeof EquipTooltipModule !== 'undefined') {
      EquipTooltipModule.hide();
    }

    if (currentEnchantItem && typeof saveInventoryItemState === 'function'
      && Number.isInteger(currentEnchantItem.slotIndex) && currentEnchantItem.slotIndex >= 0) {
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

    entries.forEach((entry, index) => {
      nextEquip[index] = entry.itemId;
      nextState[index] = entry.state;
    });

    playerInventoryEquip.splice(0, playerInventoryEquip.length, ...nextEquip);
    playerInventoryState.splice(0, playerInventoryState.length, ...nextState);
    if (typeof playerInventory !== 'undefined') {
      playerInventory.splice(0, playerInventory.length, ...nextEquip);
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
    this.hideConsumeTooltip();
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
    if (this.tab !== 'equip') return null;

    const hasLines = (pot) => Array.isArray(pot?.lines) && pot.lines.length > 0;

    if (
      typeof currentEnchantItem !== 'undefined'
      && currentEnchantItem
      && currentEnchantItem.slotIndex === slotIndex
      && hasLines(currentEnchantItem.potential)
      && currentEnchantItem.potential?.rank
    ) {
      return currentEnchantItem.potential.rank;
    }

    const saved = playerInventoryState[slotIndex];
    if (hasLines(saved?.potential) && saved.potential.rank) {
      return saved.potential.rank;
    }

    const template = ITEM_DATABASE[itemId];
    if (hasLines(template?.potential) && template.potential.rank) {
      return template.potential.rank;
    }

    return null;
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
      // 強化槽已移出背包：無需再 hidden 背包格
    }
  },

  renderEquipSlot(slot, itemId, slotIndex) {
    if (!itemId || typeof ITEM_DATABASE === 'undefined' || !ITEM_DATABASE[itemId]) return;

    const itemData = ITEM_DATABASE[itemId];
    const potentialRank = this.getItemMainPotentialRank(itemId, slotIndex);
    if (potentialRank) slot.classList.add(`inv-potential-${potentialRank}`);

    const itemFrame = document.createElement('div');
    itemFrame.className = 'inv-item-frame';

    const equipImg = document.createElement('img');
    equipImg.src = itemData.icon;
    equipImg.alt = itemData.name;
    equipImg.id = `inv_item_equip_${slotIndex}`;
    equipImg.draggable = true;

    equipImg.ondragstart = (e) => {
      if (this.pendingPotentialScrollId) {
        e.preventDefault();
        return;
      }
      if (typeof EquipTooltipModule !== 'undefined') {
        EquipTooltipModule.beginDrag?.();
      }
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
      if (typeof EquipTooltipModule !== 'undefined') {
        EquipTooltipModule.endDrag?.();
      }
    };

    equipImg.addEventListener('click', (e) => {
      if (!this.pendingPotentialScrollId) return;
      e.preventDefault();
      e.stopPropagation();
      this.applyPendingPotentialScrollToEquip(itemId, slotIndex);
    });

    equipImg.ondblclick = (e) => {
      if (this.pendingPotentialScrollId) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      // 強化台開啟時優先放入強化槽；否則裝備欄開著就穿上
      if (typeof UiEquipModule !== 'undefined' && UiEquipModule.isEnchantOpen?.()) {
        loadEquipToSlot(itemId, slotIndex);
        return;
      }
      if (typeof UiEquipModule !== 'undefined' && UiEquipModule.isEquipOpen?.()) {
        UiEquipModule.wearFromBag(itemId, slotIndex);
        return;
      }
      loadEquipToSlot(itemId, slotIndex);
    };

    itemFrame.appendChild(equipImg);
    slot.appendChild(itemFrame);
  },

  renderConsumeSlot(slot, entry, slotIndex) {
    if (typeof isStarForceScrollConsumeEntry === 'function' && isStarForceScrollConsumeEntry(entry)) {
      this.renderStarForceScrollSlot(slot, entry, slotIndex);
      return;
    }
    if (typeof isPotentialScrollConsumeEntry === 'function' && isPotentialScrollConsumeEntry(entry)) {
      this.renderPotentialScrollSlot(slot, entry, slotIndex);
    }
  },

  renderPotentialScrollSlot(slot, entry, slotIndex) {
    const scroll = typeof getPotentialScrollById === 'function'
      ? getPotentialScrollById(entry.scrollId)
      : null;
    if (!scroll) return;

    const count = typeof getPlayerPotentialScrollCount === 'function'
      ? getPlayerPotentialScrollCount(scroll.id)
      : 0;
    if (count <= 0) return;

    if (this.pendingPotentialScrollId === scroll.id) {
      slot.classList.add('inv-slot-selected');
    }

    const itemFrame = document.createElement('div');
    itemFrame.className = 'inv-item-frame inv-consume-frame';

    const scrollImg = document.createElement('img');
    scrollImg.src = scroll.icon;
    scrollImg.alt = scroll.name;
    scrollImg.id = `inv_item_consume_${slotIndex}`;
    scrollImg.draggable = true;
    // 不用 native title，避免與自訂 hover 說明圖搶顯示／造成定位錯亂
    scrollImg.removeAttribute('title');

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

    scrollImg.addEventListener('mouseenter', () => {
      this.showConsumeTooltip(scrollImg, scroll.hover);
    });
    scrollImg.addEventListener('mouseleave', () => {
      this.hideConsumeTooltip();
    });

    scrollImg.addEventListener('dblclick', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.handlePotentialScrollDblClick(scroll.id);
    });

    itemFrame.appendChild(scrollImg);
    slot.appendChild(itemFrame);
  },

  beginPotentialScrollUse(scrollId) {
    this.pendingPotentialScrollId = scrollId;
    document.body.classList.add('inv-potential-scroll-use');
    this.hideConsumeTooltip();
    if (typeof EquipTooltipModule !== 'undefined') {
      EquipTooltipModule.hide();
    }
    // 只切到背包裝備列，方便點選背包內裝備
    if (this.tab !== 'equip') {
      this.setTab('equip');
    } else {
      this.render();
    }
  },

  cancelPotentialScrollUse() {
    if (!this.pendingPotentialScrollId) return;
    this.pendingPotentialScrollId = null;
    document.body.classList.remove('inv-potential-scroll-use');
    if (this.tab === 'consume') this.render();
  },

  handlePotentialScrollDblClick(scrollId) {
    const count = typeof getPlayerPotentialScrollCount === 'function'
      ? getPlayerPotentialScrollCount(scrollId)
      : 0;
    if (count <= 0) return;

    if (this.pendingPotentialScrollId === scrollId) {
      this.cancelPotentialScrollUse();
      if (typeof addLog === 'function') {
        addLog('[消耗] 已取消使用潛在能力卷軸。', 'log-info');
      }
      return;
    }

    const scroll = typeof getPotentialScrollById === 'function'
      ? getPotentialScrollById(scrollId)
      : null;
    this.beginPotentialScrollUse(scrollId);
    if (scroll && typeof addLog === 'function') {
      addLog(`[消耗] 已選擇【${scroll.name}】，請點選背包或裝備欄中的裝備套用。`, 'log-info');
    }
  },

  getOrCreateEquipStateForScroll(itemId, slotIndex) {
    // 裝備欄身體槽：'body:11'
    if (typeof slotIndex === 'string' && slotIndex.startsWith('body:')) {
      if (typeof UiEquipModule === 'undefined' || typeof UiEquipModule.getWornEntry !== 'function') {
        return null;
      }
      const uiSlot = slotIndex.slice(5);
      const entry = UiEquipModule.getWornEntry(uiSlot);
      if (!entry?.itemId || entry.itemId !== itemId) return null;
      if (!entry.state) {
        const template = typeof ITEM_DATABASE !== 'undefined' ? ITEM_DATABASE[itemId] : null;
        if (!template || typeof createEnchantState !== 'function') return null;
        entry.state = createEnchantState(template, -1);
      }
      return entry.state;
    }

    if (currentEnchantItem) {
      const curId = currentEnchantItem.itemId || currentEnchantItem.id;
      if (curId === itemId && (
        slotIndex === -1
        || slotIndex === currentEnchantItem.slotIndex
        || !Number.isInteger(slotIndex)
      )) {
        return currentEnchantItem;
      }
    }

    if (!Number.isInteger(slotIndex) || slotIndex < 0) return null;

    let state = playerInventoryState[slotIndex];
    if (state) return state;

    const template = typeof ITEM_DATABASE !== 'undefined' ? ITEM_DATABASE[itemId] : null;
    if (!template || typeof createEnchantState !== 'function') return null;

    state = createEnchantState(template, slotIndex);
    playerInventoryState[slotIndex] = state;
    return state;
  },

  applyPendingPotentialScrollToEquip(itemId, slotIndex) {
    const scrollId = this.pendingPotentialScrollId;
    if (!scrollId) return false;

    const scroll = typeof getPotentialScrollById === 'function'
      ? getPotentialScrollById(scrollId)
      : null;
    if (!scroll) {
      this.cancelPotentialScrollUse();
      return false;
    }

    const count = typeof getPlayerPotentialScrollCount === 'function'
      ? getPlayerPotentialScrollCount(scrollId)
      : 0;
    if (count <= 0) {
      this.cancelPotentialScrollUse();
      return false;
    }

    const item = this.getOrCreateEquipStateForScroll(itemId, slotIndex);
    if (!item) {
      if (typeof addLog === 'function') {
        addLog('[消耗] 無法套用至該裝備。', 'log-fail');
      }
      return false;
    }

    const result = typeof applyPotentialScrollGrade === 'function'
      ? applyPotentialScrollGrade(item, scroll)
      : (typeof applyLegendaryPotentialGrade === 'function'
        ? applyLegendaryPotentialGrade(item, scroll.target)
        : { ok: false });
    if (!result?.ok) {
      if (typeof addLog === 'function') {
        addLog(`[消耗] ${result?.message || '套用失敗。'}`, 'log-fail');
      }
      return false;
    }

    if (typeof consumePotentialScroll === 'function') {
      consumePotentialScroll(scrollId, 1);
    }

    if (currentEnchantItem && (
      currentEnchantItem.slotIndex === slotIndex
      || slotIndex === -1
      || (currentEnchantItem.itemId || currentEnchantItem.id) === itemId
    ) && !(typeof slotIndex === 'string' && slotIndex.startsWith('body:'))) {
      if (typeof refreshEquippedItemUI === 'function') {
        refreshEquippedItemUI();
      } else {
        if (typeof saveInventoryItemState === 'function') {
          saveInventoryItemState(currentEnchantItem.slotIndex, currentEnchantItem);
        }
        if (typeof updateStatusPanel === 'function') updateStatusPanel();
        if (typeof refreshActiveModuleUI === 'function') refreshActiveModuleUI();
        if (typeof updateActiveModuleEquip === 'function') updateActiveModuleEquip();
        if (typeof syncInspectModules === 'function') syncInspectModules();
      }
    } else if (typeof slotIndex === 'string' && slotIndex.startsWith('body:')) {
      if (typeof UiEquipModule !== 'undefined' && typeof UiEquipModule.refresh === 'function') {
        UiEquipModule.refresh();
      }
    } else if (typeof saveInventoryItemState === 'function') {
      saveInventoryItemState(slotIndex, item);
    }

    this.cancelPotentialScrollUse();
    this.render();
    this.updateSlotCount();

    if (typeof SessionPersistenceModule !== 'undefined') {
      SessionPersistenceModule.scheduleSave();
    }

    const targetLabel = scroll.target === 'additional' ? '附加潛能' : '潛能';
    const gradeLabel = typeof getPotentialScrollRankLabel === 'function'
      ? getPotentialScrollRankLabel(scroll.grade || result.grade || 'legendary')
      : (scroll.grade || '傳說');
    if (typeof addLog === 'function') {
      addLog(
        `[消耗] 已對【${item.name || itemId}】使用【${scroll.name}】，${targetLabel}賦予為${gradeLabel}。`,
        'log-success'
      );
    }
    return true;
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

    itemFrame.appendChild(scrollImg);
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
      if (Number.isInteger(currentEnchantItem?.slotIndex) && currentEnchantItem.slotIndex >= 0
        && (currentEnchantItem.slotIndex === fromIndex || currentEnchantItem.slotIndex === toIndex)) {
        saveInventoryItemState(currentEnchantItem.slotIndex, currentEnchantItem);
      }

      const fromState = playerInventoryState[fromIndex] ?? null;
      const toState = playerInventoryState[toIndex] ?? null;
      playerInventoryState[fromIndex] = toState;
      playerInventoryState[toIndex] = fromState;

      if (currentEnchantItem && Number.isInteger(currentEnchantItem.slotIndex) && currentEnchantItem.slotIndex >= 0) {
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
      const parsed = JSON.parse(data);

      // 從裝備欄拖回背包 = 脫下
      if (parsed.source === 'body' && typeof UiEquipModule !== 'undefined') {
        if (parsed.uiSlot != null) {
          UiEquipModule.unequipSlot(parsed.uiSlot);
        } else if (Number.isInteger(parsed.bagIndex)) {
          UiEquipModule.unequipBagIndex(parsed.bagIndex, { allPresets: false });
        }
        return;
      }

      const { slotIndex: fromIndex, tab: fromTab } = parsed;
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
      if (typeof isPotentialScrollConsumeEntry === 'function' && isPotentialScrollConsumeEntry(entry)) {
        return getPlayerPotentialScrollCount(entry.scrollId) > 0;
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
  },

  isOpen() {
    return !!this.panelOpen;
  },

  syncMenuButton() {
    document.getElementById('btnViewInventory')?.classList.toggle('is-active', !!this.panelOpen);
  },

  setOpen(next) {
    this.panelOpen = !!next;
    const panel = document.getElementById('inventoryPanel');
    const col = document.querySelector('.ms-inventory-column');
    // 關：整欄隱藏；開：欄與面板都顯示
    if (col) col.classList.toggle('hidden', !this.panelOpen);
    if (panel) panel.classList.toggle('hidden', !this.panelOpen);
    if (this.panelOpen && typeof PanelDrag !== 'undefined') {
      PanelDrag.bringFront(panel);
    }
    this.syncMenuButton();
  },

  toggle() {
    this.setOpen(!this.panelOpen);
  },

  bindPanelControls() {
    if (this._panelControlsBound) return;
    this._panelControlsBound = true;
    document.getElementById('btnViewInventory')?.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.toggle();
    });
    document.getElementById('inventoryClose')?.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.setOpen(false);
    });
  },
};

function initInventory() {
  InventoryModule.bindPanelControls();
  // 刷新背包時維持開關狀態，不要強制打開
  InventoryModule.setOpen(InventoryModule.panelOpen);
  InventoryModule.syncTabUi();
  InventoryModule.render();
  InventoryModule.updateSlotCount();
  InventoryModule.updateScroll();
}
