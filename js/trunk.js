/**
 * TrunkModule — 倉庫面板 UI（左共用格 8 欄／右背包鏡像 4 欄）
 */
const TrunkModule = {
  panelOpen: false,
  bagTab: 'equip',
  storageScrollTop: 0,
  bagScrollTop: 0,
  _bound: false,
  _thumbDrag: null,
  _mesoPopupMode: null,
  _mesoPopupMax: 0,
  SLOT_COUNT: typeof TRUNK_SLOT_COUNT !== 'undefined' ? TRUNK_SLOT_COUNT : 128,
  STORAGE_COLS: 8,
  BAG_COLS: 4,
  SLOT_SIZE: 42,
  GAP: 4,
  VISIBLE_ROWS_STORAGE: 8,
  VISIBLE_ROWS_BAG: 5,

  init() {
    if (this._bound) return;
    this._bound = true;
    this.bindControls();
    this.setOpen(false);
  },

  bindControls() {
    document.getElementById('trunkClose')?.addEventListener('click', (e) => {
      e.preventDefault();
      this.setOpen(false);
    });
    document.getElementById('trunkBtnSort')?.addEventListener('click', () => this.handleSort());
    document.getElementById('trunkBtnGetAll')?.addEventListener('click', () => this.handleGetAll());
    document.getElementById('trunkBtnMesoIn')?.addEventListener('click', () => this.openMesoPopup('in'));
    document.getElementById('trunkBtnMesoOut')?.addEventListener('click', () => this.openMesoPopup('out'));

    document.getElementById('trunkMesoPopupCancel')?.addEventListener('click', () => this.closeMesoPopup());
    document.getElementById('trunkMesoPopupAll')?.addEventListener('click', () => {
      const input = document.getElementById('trunkMesoPopupInput');
      if (input) input.value = String(this._mesoPopupMax);
    });
    document.getElementById('trunkMesoPopupOk')?.addEventListener('click', () => this.confirmMesoPopup());
    document.getElementById('trunkMesoPopupInput')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.confirmMesoPopup();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        this.closeMesoPopup();
      }
    });
    document.getElementById('trunkMesoPopupInput')?.addEventListener('input', (e) => {
      const raw = String(e.target.value || '').replace(/\D/g, '');
      if (raw !== e.target.value) e.target.value = raw;
    });
    document.getElementById('trunkMesoPopup')?.addEventListener('click', (e) => {
      if (e.target?.id === 'trunkMesoPopup') this.closeMesoPopup();
    });

    document.querySelectorAll('#trunkBagTabs .trunk-tab').forEach((btn) => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        if (tab === 'equip' || tab === 'consume' || tab === 'etc') this.setBagTab(tab);
      });
    });

    const storageVp = document.getElementById('trunkStorageViewport');
    const bagVp = document.getElementById('trunkBagViewport');
    storageVp?.addEventListener('wheel', (e) => this.onWheel(e, 'storage'), { passive: false });
    bagVp?.addEventListener('wheel', (e) => this.onWheel(e, 'bag'), { passive: false });

    document.getElementById('trunkStorageScrollTrack')?.addEventListener('mousedown', (e) => {
      this.onTrackDown(e, 'storage');
    });
    document.getElementById('trunkBagScrollTrack')?.addEventListener('mousedown', (e) => {
      this.onTrackDown(e, 'bag');
    });
    document.getElementById('trunkStorageScrollThumb')?.addEventListener('mousedown', (e) => {
      this.onThumbDown(e, 'storage');
    });
    document.getElementById('trunkBagScrollThumb')?.addEventListener('mousedown', (e) => {
      this.onThumbDown(e, 'bag');
    });
    window.addEventListener('mousemove', (e) => this.onThumbMove(e));
    window.addEventListener('mouseup', () => this.onThumbUp());
  },

  isOpen() {
    return !!this.panelOpen;
  },

  setOpen(next) {
    this.panelOpen = !!next;
    const panel = document.getElementById('trunkPanel');
    if (panel) {
      panel.classList.toggle('hidden', !this.panelOpen);
      panel.setAttribute('aria-hidden', this.panelOpen ? 'false' : 'true');
    }
    if (!this.panelOpen) {
      this.closeMesoPopup();
      return;
    }
    if (typeof InventoryModule !== 'undefined' && !InventoryModule.isOpen?.()) {
      InventoryModule.setOpen?.(true);
    }
    if (typeof PanelDrag !== 'undefined') PanelDrag.bringFront(panel);
    this.render();
    this.updateMesoDisplay();
  },

  toggle() {
    this.setOpen(!this.panelOpen);
  },

  setBagTab(tab) {
    this.bagTab = tab;
    this.bagScrollTop = 0;
    document.querySelectorAll('#trunkBagTabs .trunk-tab').forEach((btn) => {
      btn.classList.toggle('checked', btn.dataset.tab === tab);
    });
    const panel = document.getElementById('trunkPanel');
    if (panel) {
      panel.classList.toggle('trunk-bag-equip', tab === 'equip');
      panel.classList.toggle('trunk-bag-consume', tab === 'consume');
      panel.classList.toggle('trunk-bag-etc', tab === 'etc');
    }
    this.renderBag();
    this.updateScroll('bag');
  },

  colsFor(side) {
    return side === 'storage' ? this.STORAGE_COLS : this.BAG_COLS;
  },

  rowsFor(side) {
    return Math.ceil(this.SLOT_COUNT / this.colsFor(side));
  },

  rowStride() {
    return this.SLOT_SIZE + this.GAP;
  },

  gridHeight(rows) {
    return rows * this.rowStride() - this.GAP;
  },

  getContentHeight(side) {
    return this.gridHeight(this.rowsFor(side));
  },

  getViewportHeight(side) {
    if (side === 'storage') return this.gridHeight(this.VISIBLE_ROWS_STORAGE);
    return 242;
  },

  getMaxScroll(side) {
    return Math.max(0, this.getContentHeight(side) - this.getViewportHeight(side));
  },

  snapScroll(side, value) {
    const stride = this.rowStride();
    const maxScroll = this.getMaxScroll(side);
    const snapped = Math.round(value / stride) * stride;
    return Math.max(0, Math.min(maxScroll, snapped));
  },

  scrollKey(side) {
    return side === 'storage' ? 'storageScrollTop' : 'bagScrollTop';
  },

  onWheel(e, side) {
    e.preventDefault();
    const maxScroll = this.getMaxScroll(side);
    if (maxScroll <= 0) return;
    const direction = e.deltaY > 0 ? 1 : e.deltaY < 0 ? -1 : 0;
    if (!direction) return;
    const key = this.scrollKey(side);
    this[key] = this.snapScroll(side, this[key] + direction * this.rowStride());
    this.updateScroll(side);
  },

  onTrackDown(e, side) {
    if (e.target?.id?.includes('ScrollThumb')) return;
    const track = e.currentTarget;
    const rect = track.getBoundingClientRect();
    const ratio = (e.clientY - rect.top) / Math.max(1, rect.height);
    const maxScroll = this.getMaxScroll(side);
    const maxRow = Math.round(maxScroll / this.rowStride());
    const targetRow = Math.round(ratio * maxRow);
    const key = this.scrollKey(side);
    this[key] = this.snapScroll(side, targetRow * this.rowStride());
    this.updateScroll(side);
  },

  onThumbDown(e, side) {
    e.preventDefault();
    e.stopPropagation();
    const key = this.scrollKey(side);
    this._thumbDrag = { side, startY: e.clientY, startScroll: this[key] };
  },

  onThumbMove(e) {
    if (!this._thumbDrag) return;
    const { side, startY, startScroll } = this._thumbDrag;
    const track = document.getElementById(
      side === 'storage' ? 'trunkStorageScrollTrack' : 'trunkBagScrollTrack',
    );
    const thumb = document.getElementById(
      side === 'storage' ? 'trunkStorageScrollThumb' : 'trunkBagScrollThumb',
    );
    if (!track || !thumb) return;
    const trackH = track.clientHeight;
    const thumbH = thumb.clientHeight;
    const maxScroll = this.getMaxScroll(side);
    const scrollableTrack = Math.max(1, trackH - thumbH);
    const delta = e.clientY - startY;
    const scrollDelta = (delta / scrollableTrack) * maxScroll;
    const key = this.scrollKey(side);
    this[key] = this.snapScroll(side, startScroll + scrollDelta);
    this.updateScroll(side);
  },

  onThumbUp() {
    if (!this._thumbDrag) return;
    const { side } = this._thumbDrag;
    const key = this.scrollKey(side);
    this[key] = this.snapScroll(side, this[key]);
    this.updateScroll(side);
    this._thumbDrag = null;
  },

  applyScroll(side) {
    const gridId = side === 'storage' ? 'trunkStorageGrid' : 'trunkBagGrid';
    const key = this.scrollKey(side);
    const grid = document.getElementById(gridId);
    if (!grid) return;
    const maxScroll = this.getMaxScroll(side);
    grid.style.transform = maxScroll > 0 ? `translateY(-${this[key]}px)` : '';
  },

  updateScroll(side) {
    const thumb = document.getElementById(
      side === 'storage' ? 'trunkStorageScrollThumb' : 'trunkBagScrollThumb',
    );
    const track = document.getElementById(
      side === 'storage' ? 'trunkStorageScrollTrack' : 'trunkBagScrollTrack',
    );
    if (!thumb || !track) return;
    const contentH = this.getContentHeight(side);
    const viewportH = this.getViewportHeight(side);
    const trackH = track.clientHeight || viewportH;
    const maxScroll = this.getMaxScroll(side);
    const key = this.scrollKey(side);
    this[key] = this.snapScroll(side, this[key]);

    const thumbH = Math.max(28, Math.round(trackH * (viewportH / Math.max(viewportH, contentH))));
    const maxThumbTop = Math.max(0, trackH - thumbH);
    const thumbTop = maxScroll > 0 ? (this[key] / maxScroll) * maxThumbTop : 0;
    thumb.style.height = `${thumbH}px`;
    thumb.style.top = `${thumbTop}px`;
    this.applyScroll(side);
  },

  formatMeso(n) {
    if (typeof formatMesoAmount === 'function') return formatMesoAmount(n);
    const v = Math.max(0, Math.floor(Number(n) || 0));
    return `${String(v).replace(/\B(?=(\d{3})+(?!\d))/g, ',')} 楓幣`;
  },

  updateMesoDisplay() {
    const storageEl = document.getElementById('trunkStorageMeso');
    const bagEl = document.getElementById('trunkBagMeso');
    const idle = typeof isIdlePlayMode === 'function' && isIdlePlayMode();
    const trunkMeso = typeof TrunkData !== 'undefined' ? TrunkData.getMeso() : 0;
    const bagMeso = idle && typeof getIdleHeldMeso === 'function' ? getIdleHeldMeso() : 0;
    if (storageEl) storageEl.textContent = idle ? this.formatMeso(trunkMeso) : '-';
    if (bagEl) bagEl.textContent = idle ? this.formatMeso(bagMeso) : '-';

    document.getElementById('trunkBtnMesoIn')?.toggleAttribute('disabled', !idle);
    document.getElementById('trunkBtnMesoOut')?.toggleAttribute('disabled', !idle);
  },

  updateSlotCount() {
    const el = document.getElementById('trunkSlotCount');
    if (!el || typeof TrunkData === 'undefined') return;
    el.textContent = String(TrunkData.usedCount());
  },

  reasonMessage(reason) {
    const map = {
      item_locked: '便利鎖定的裝備無法存入倉庫。',
      enchanting: '強化中的裝備無法存入倉庫。',
      trunk_full: '倉庫已滿。',
      bag_full: '背包已滿。',
      occupied: '目標格子已被占用。',
      not_idle: '楓幣存提僅在待機模式可用。',
      no_meso: '楓幣不足。',
      bad_amount: '請輸入有效數量。',
      empty: '格子是空的。',
    };
    return map[reason] || '無法完成操作。';
  },

  logFail(result) {
    if (typeof addLog === 'function') {
      addLog(`[倉庫] ${this.reasonMessage(result?.reason)}`, 'log-fail');
    }
  },

  handleSort() {
    if (typeof TrunkData === 'undefined') return;
    const n = TrunkData.sortSlots();
    if (typeof addLog === 'function') {
      addLog(n ? `[倉庫] 已整理 ${n} 格物品。` : '[倉庫] 沒有可整理的物品。', 'log-info');
    }
  },

  handleGetAll() {
    if (typeof TrunkData === 'undefined') return;
    const result = TrunkData.getAll();
    if (typeof addLog === 'function') {
      if (result.stopped) {
        addLog(`[倉庫] 已取出 ${result.moved} 件，背包已滿而停止。`, 'log-fail');
      } else {
        addLog(`[倉庫] 已全部取出（${result.moved} 件）。`, 'log-success');
      }
    }
  },

  openMesoPopup(mode) {
    if (typeof TrunkData === 'undefined') return;
    const idle = typeof isIdlePlayMode === 'function' && isIdlePlayMode();
    if (!idle) {
      this.logFail({ reason: 'not_idle' });
      return;
    }
    const max = mode === 'in'
      ? (typeof getIdleHeldMeso === 'function' ? getIdleHeldMeso() : 0)
      : TrunkData.getMeso();
    this._mesoPopupMode = mode;
    this._mesoPopupMax = Math.max(0, Math.floor(Number(max) || 0));

    const popup = document.getElementById('trunkMesoPopup');
    const title = document.getElementById('trunkMesoPopupTitle');
    const hint = document.getElementById('trunkMesoPopupHint');
    const input = document.getElementById('trunkMesoPopupInput');
    if (title) title.textContent = mode === 'in' ? '存入楓幣' : '領出楓幣';
    if (hint) {
      hint.textContent = mode === 'in'
        ? `可存入上限：${this.formatMeso(this._mesoPopupMax)}`
        : `可領出上限：${this.formatMeso(this._mesoPopupMax)}`;
    }
    if (input) {
      input.value = this._mesoPopupMax > 0 ? String(this._mesoPopupMax) : '';
    }
    popup?.classList.remove('hidden');
    popup?.setAttribute('aria-hidden', 'false');
    setTimeout(() => {
      input?.focus();
      input?.select();
    }, 0);
  },

  closeMesoPopup() {
    this._mesoPopupMode = null;
    this._mesoPopupMax = 0;
    const popup = document.getElementById('trunkMesoPopup');
    popup?.classList.add('hidden');
    popup?.setAttribute('aria-hidden', 'true');
  },

  confirmMesoPopup() {
    if (!this._mesoPopupMode || typeof TrunkData === 'undefined') {
      this.closeMesoPopup();
      return;
    }
    const input = document.getElementById('trunkMesoPopupInput');
    const raw = String(input?.value || '').replace(/\D/g, '');
    const amount = raw ? Math.floor(Number(raw) || 0) : this._mesoPopupMax;
    const mode = this._mesoPopupMode;
    this.closeMesoPopup();
    const result = mode === 'in' ? TrunkData.mesoIn(amount) : TrunkData.mesoOut(amount);
    if (!result.ok) this.logFail(result);
    else if (typeof addLog === 'function') {
      const verb = mode === 'in' ? '已存入' : '已領出';
      addLog(`[倉庫] ${verb} ${this.formatMeso(result.amount)}。`, 'log-success');
    }
  },

  render() {
    if (!this.panelOpen) return;
    this.renderStorage();
    this.renderBag();
    this.updateSlotCount();
    this.updateMesoDisplay();
    this.updateScroll('storage');
    this.updateScroll('bag');
  },

  makeSlot(index, side) {
    const slot = document.createElement('div');
    slot.className = 'ms-inv-slot trunk-slot';
    slot.dataset.slotIndex = String(index);
    slot.dataset.trunkSide = side;
    slot.ondragover = (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      slot.classList.add('inv-drag-over');
    };
    slot.ondragleave = () => slot.classList.remove('inv-drag-over');
    slot.ondrop = (e) => this.handleDrop(e, side, index);
    return slot;
  },

  bindItemDrag(img, payload, slot) {
    img.draggable = true;
    img.ondragstart = (e) => {
      if (typeof EquipTooltipModule !== 'undefined') EquipTooltipModule.beginDrag?.();
      e.dataTransfer.setData('text/plain', JSON.stringify(payload));
      e.dataTransfer.effectAllowed = 'move';
      slot.classList.add('inv-dragging');
    };
    img.ondragend = () => {
      slot.classList.remove('inv-dragging');
      document.querySelectorAll('.ms-inv-slot.inv-drag-over').forEach((el) => {
        el.classList.remove('inv-drag-over');
      });
      if (typeof EquipTooltipModule !== 'undefined') EquipTooltipModule.endDrag?.();
    };
  },

  appendIcon(slot, icon, name, count, opts = {}) {
    const frame = document.createElement('div');
    frame.className = 'inv-item-frame';
    const img = document.createElement('img');
    img.src = icon || '';
    img.alt = name || '';
    img.title = name || '';
    frame.appendChild(img);
    slot.appendChild(frame);
    if (count > 1 || opts.forceCount) {
      const qty = document.createElement('span');
      qty.className = 'inv-item-count';
      qty.textContent = String(count);
      slot.appendChild(qty);
    }
    if (opts.slotLocked) {
      const lock = document.createElement('img');
      lock.className = 'inv-sortlock-icon';
      lock.src = 'images/iventory/sortlock.png';
      lock.alt = '';
      slot.appendChild(lock);
    }
    if (opts.itemLocked) {
      const lock = document.createElement('img');
      lock.className = 'inv-itemlock-icon';
      lock.src = 'images/iventory/itemlock.png';
      lock.alt = '';
      slot.appendChild(lock);
    }
    return img;
  },

  resolveConsumeVisual(entry) {
    if (!entry) return null;
    const T = typeof CONSUME_ITEM_TYPE !== 'undefined' ? CONSUME_ITEM_TYPE : {};
    const type = entry.type;
    const count = entry.kind === 'consume' && entry.amount != null
      ? Math.max(1, Math.floor(Number(entry.amount) || 1))
      : (typeof InventoryModule !== 'undefined'
        ? Math.max(0, Math.floor(Number(InventoryModule.consumeEntryCount(entry)) || 0))
        : 1);

    if (type === (T.STARFORCE_SCROLL || 'starforce_scroll')) {
      const s = typeof getStarForceScrollById === 'function' ? getStarForceScrollById(entry.scrollId) : null;
      return { icon: s?.icon, name: s?.name || entry.scrollId, count };
    }
    if (type === (T.POTENTIAL_SCROLL || 'potential_scroll')) {
      const s = typeof getPotentialScrollById === 'function' ? getPotentialScrollById(entry.scrollId) : null;
      return { icon: s?.icon, name: s?.name || entry.scrollId, count };
    }
    if (type === (T.CUBE || 'cube')) {
      const c = typeof getPotentialCubeById === 'function' ? getPotentialCubeById(entry.cubeId) : null;
      return { icon: c?.icon, name: c?.name || entry.cubeId, count };
    }
    if (type === (T.ADD_CUBE || 'add_cube')) {
      const c = typeof getAddPotCubeById === 'function' ? getAddPotCubeById(entry.cubeId) : null;
      return { icon: c?.icon, name: c?.name || entry.cubeId, count };
    }
    if (type === (T.HAMMER || 'hammer')) {
      const h = typeof HAMMER_TYPES !== 'undefined' ? HAMMER_TYPES[entry.hammerId] : null;
      return { icon: h?.icon, name: h?.name || entry.hammerId, count };
    }
    if (type === (T.GLORY_SCROLL || 'glory_scroll')) {
      const s = typeof getScrollById === 'function' ? getScrollById(entry.scrollId) : null;
      return { icon: s?.icon, name: s?.name || entry.scrollId, count };
    }
    if (type === (T.BONUS_STAT || 'bonus_stat')) {
      const s = typeof getBonusStatItemById === 'function' ? getBonusStatItemById(entry.itemId) : null;
      return { icon: s?.icon, name: s?.name || entry.itemId, count };
    }
    if (type === (T.EXCEPTIONAL_HAMMER || 'exceptional_hammer')) {
      const h = typeof getExceptionalHammerById === 'function' ? getExceptionalHammerById(entry.hammerId) : null;
      return { icon: h?.icon, name: h?.name || entry.hammerId, count };
    }
    if (type === (T.SOUL || 'soul')) {
      const m = typeof getSoulMaterialById === 'function' ? getSoulMaterialById(entry.soulId) : null;
      return { icon: m?.icon, name: m?.name || entry.soulId, count };
    }
    if (type === (T.RECOVERY_CARD || 'recovery_card')) {
      const c = typeof RECOVERY_CARD !== 'undefined' ? RECOVERY_CARD : null;
      return { icon: c?.icon, name: c?.name || '恢復卡', count };
    }
    if (type === (T.POTION || 'potion')) {
      const p = typeof IdlePotionStore !== 'undefined' ? IdlePotionStore.get(entry.itemId) : null;
      return {
        icon: p ? IdlePotionStore.resolveIcon?.(p.icon) : '',
        name: p?.name || entry.itemId,
        count,
      };
    }
    return { icon: '', name: type || '消耗品', count };
  },

  fillStorageSlot(slot, entry, index) {
    if (!entry) return;
    if (entry.kind === 'equip') {
      const item = typeof ITEM_DATABASE !== 'undefined' ? ITEM_DATABASE[entry.itemId] : null;
      const img = this.appendIcon(
        slot,
        item?.icon,
        item?.name || entry.itemId,
        1,
        { slotLocked: !!entry.state?.slotLocked, itemLocked: !!entry.state?.itemLocked },
      );
      this.bindItemDrag(img, { source: 'trunkStorage', slotIndex: index }, slot);
      img.addEventListener('dblclick', (e) => {
        e.preventDefault();
        this.withdrawIndex(index);
      });
      return;
    }
    if (entry.kind === 'consume') {
      const vis = this.resolveConsumeVisual(entry);
      if (!vis) return;
      const img = this.appendIcon(slot, vis.icon, vis.name, vis.count, {
        forceCount: vis.count > 0,
        slotLocked: !!entry.slotLocked,
      });
      this.bindItemDrag(img, { source: 'trunkStorage', slotIndex: index }, slot);
      img.addEventListener('dblclick', (e) => {
        e.preventDefault();
        this.withdrawIndex(index);
      });
      return;
    }
    if (entry.kind === 'etc') {
      const img = this.appendIcon(
        slot,
        entry.icon,
        entry.name || entry.itemId,
        Math.max(1, Math.floor(Number(entry.amount) || 1)),
        { forceCount: true, slotLocked: !!entry.slotLocked },
      );
      this.bindItemDrag(img, { source: 'trunkStorage', slotIndex: index }, slot);
      img.addEventListener('dblclick', (e) => {
        e.preventDefault();
        this.withdrawIndex(index);
      });
    }
  },

  fillBagSlot(slot, tab, index) {
    if (tab === 'equip') {
      const itemId = playerInventoryEquip?.[index];
      if (!itemId) return;
      const state = playerInventoryState?.[index];
      const item = typeof ITEM_DATABASE !== 'undefined' ? ITEM_DATABASE[itemId] : null;
      const img = this.appendIcon(
        slot,
        item?.icon,
        item?.name || itemId,
        1,
        { slotLocked: !!state?.slotLocked, itemLocked: !!state?.itemLocked },
      );
      this.bindItemDrag(img, { source: 'trunkBag', tab: 'equip', slotIndex: index }, slot);
      img.addEventListener('dblclick', (e) => {
        e.preventDefault();
        this.depositBag('equip', index);
      });
      return;
    }
    if (tab === 'consume') {
      const entry = playerInventoryConsume?.[index];
      if (!entry) return;
      if (typeof InventoryModule !== 'undefined' && !InventoryModule.isConsumeEntryActive?.(entry)) return;
      const vis = this.resolveConsumeVisual(entry);
      if (!vis || vis.count <= 0) return;
      const img = this.appendIcon(slot, vis.icon, vis.name, vis.count, {
        forceCount: true,
        slotLocked: !!entry.slotLocked,
      });
      this.bindItemDrag(img, { source: 'trunkBag', tab: 'consume', slotIndex: index }, slot);
      img.addEventListener('dblclick', (e) => {
        e.preventDefault();
        this.depositBag('consume', index);
      });
      return;
    }
    if (tab === 'etc') {
      const entry = playerInventoryEtc?.[index];
      if (!entry) return;
      const img = this.appendIcon(
        slot,
        entry.icon,
        entry.name || entry.itemId,
        Math.max(1, Math.floor(Number(entry.amount) || 1)),
        { forceCount: true, slotLocked: !!entry.slotLocked },
      );
      this.bindItemDrag(img, { source: 'trunkBag', tab: 'etc', slotIndex: index }, slot);
      img.addEventListener('dblclick', (e) => {
        e.preventDefault();
        this.depositBag('etc', index);
      });
    }
  },

  renderStorage() {
    const grid = document.getElementById('trunkStorageGrid');
    if (!grid || typeof TrunkData === 'undefined') return;
    grid.innerHTML = '';
    const slots = TrunkData.getSlots();
    for (let i = 0; i < this.SLOT_COUNT; i += 1) {
      const slot = this.makeSlot(i, 'storage');
      this.fillStorageSlot(slot, slots[i], i);
      grid.appendChild(slot);
    }
  },

  renderBag() {
    const grid = document.getElementById('trunkBagGrid');
    if (!grid) return;
    grid.innerHTML = '';
    for (let i = 0; i < this.SLOT_COUNT; i += 1) {
      const slot = this.makeSlot(i, 'bag');
      this.fillBagSlot(slot, this.bagTab, i);
      grid.appendChild(slot);
    }
  },

  depositBag(tab, bagIndex) {
    if (typeof TrunkData === 'undefined') return;
    const result = TrunkData.depositFromBag(tab, bagIndex);
    if (!result.ok) this.logFail(result);
  },

  withdrawIndex(trunkIndex) {
    if (typeof TrunkData === 'undefined') return;
    const entry = TrunkData.getSlots()[trunkIndex];
    if (entry?.kind === 'equip') this.setBagTab('equip');
    else if (entry?.kind === 'consume') this.setBagTab('consume');
    else if (entry?.kind === 'etc') this.setBagTab('etc');
    const result = TrunkData.withdrawToBag(trunkIndex);
    if (!result.ok) this.logFail(result);
    else if (result.tab) this.setBagTab(result.tab);
  },

  handleDrop(e, side, targetIndex) {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget?.classList.remove('inv-drag-over');
    const raw = e.dataTransfer.getData('text/plain');
    if (!raw || typeof TrunkData === 'undefined') return;
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (_) {
      return;
    }

    if (side === 'storage') {
      if (parsed.source === 'trunkStorage') {
        TrunkData.swapTrunkSlots(parsed.slotIndex, targetIndex);
        return;
      }
      if (parsed.source === 'trunkBag') {
        const result = TrunkData.depositFromBag(parsed.tab, parsed.slotIndex, targetIndex);
        if (!result.ok) this.logFail(result);
        return;
      }
      if (parsed.tab && Number.isInteger(parsed.slotIndex) && !parsed.source) {
        const result = TrunkData.depositFromBag(parsed.tab, parsed.slotIndex, targetIndex);
        if (!result.ok) this.logFail(result);
      }
      return;
    }

    if (side === 'bag') {
      if (parsed.source === 'trunkStorage') {
        const entry = TrunkData.getSlots()[parsed.slotIndex];
        if (!entry) return;
        const wantTab = entry.kind === 'equip' ? 'equip' : (entry.kind === 'consume' ? 'consume' : 'etc');
        if (this.bagTab !== wantTab) this.setBagTab(wantTab);
        const result = entry.kind === 'equip'
          ? TrunkData.withdrawEquip(parsed.slotIndex, targetIndex)
          : TrunkData.withdrawToBag(parsed.slotIndex);
        if (!result.ok) this.logFail(result);
        return;
      }
      if (parsed.source === 'trunkBag' && parsed.tab === this.bagTab) {
        if (typeof InventoryModule !== 'undefined' && InventoryModule.swapSlots) {
          if (InventoryModule.tab !== this.bagTab) InventoryModule.setTab(this.bagTab);
          InventoryModule.swapSlots(parsed.slotIndex, targetIndex);
          this.render();
        }
      }
    }
  },
};

function initTrunk() {
  TrunkModule.init();
}
