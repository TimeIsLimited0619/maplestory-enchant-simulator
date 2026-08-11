/**
 * 工作階段持久化（localStorage）＋存檔匯出／匯入
 * 自動存檔與匯出使用相同內容：背包、強化進度、成本統計、方塊／星力卷持有等
 */
const SESSION_PERSISTENCE_KEY = 'mss-session-v1';
const MSS_LOCAL_SAVE_KEY = 'mss-save-local-v1';
const SESSION_PERSISTENCE_VERSION = 1;
const MSS_SAVE_FORMAT = 'mss-save';
const MSS_SAVE_FILE_VERSION = 1;

const SessionPersistenceModule = {
  loadedFromStorage: false,
  equippedSlotIndex: null,
  saveTimer: null,
  _deferredPayload: null,

  hasSavedSession() {
    return this.loadedFromStorage;
  },

  scheduleSave() {
    if (this.saveTimer) clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => {
      this.saveTimer = null;
      this.saveToStorage();
    }, 400);
  },

  syncCurrentEnchantToInventory() {
    if (typeof currentEnchantItem === 'undefined' || !currentEnchantItem) return;

    if (typeof syncEnchantStateFromModules === 'function') {
      syncEnchantStateFromModules(currentEnchantItem);
    }

    const snapshot = typeof cloneEnchantState === 'function'
      ? cloneEnchantState(currentEnchantItem)
      : JSON.parse(JSON.stringify(currentEnchantItem));
    delete snapshot.slotIndex;
    playerInventoryState[currentEnchantItem.slotIndex] = snapshot;
  },

  collectSnapshot() {
    this.syncCurrentEnchantToInventory();

    return {
      version: SESSION_PERSISTENCE_VERSION,
      inventoryEquip: playerInventoryEquip.slice(),
      inventoryConsume: playerInventoryConsume.slice(),
      inventoryState: playerInventoryState.slice(),
      equippedSlotIndex: typeof currentEnchantItem !== 'undefined' && currentEnchantItem
        ? currentEnchantItem.slotIndex
        : null
    };
  },

  buildExportPayload() {
    const payload = {
      format: MSS_SAVE_FORMAT,
      version: MSS_SAVE_FILE_VERSION,
      exportedAt: new Date().toISOString(),
      session: this.collectSnapshot()
    };

    if (typeof CostTrackerModule !== 'undefined' && typeof CostTrackerModule.getSavePayload === 'function') {
      payload.costTracker = CostTrackerModule.getSavePayload();
    }
    if (typeof playerCubeCounts !== 'undefined') {
      payload.playerCubeCounts = { ...playerCubeCounts };
    }
    if (typeof playerAddPotCubeCounts !== 'undefined') {
      payload.playerAddPotCubeCounts = { ...playerAddPotCubeCounts };
    }
    if (typeof playerStarForceScrollInventory !== 'undefined') {
      payload.playerStarForceScrollInventory = { ...playerStarForceScrollInventory };
    }

    return payload;
  },

  saveToStorage() {
    try {
      const payload = this.buildExportPayload();
      localStorage.setItem(MSS_LOCAL_SAVE_KEY, JSON.stringify(payload));
      // 相容舊版僅 session 的讀取路徑
      localStorage.setItem(SESSION_PERSISTENCE_KEY, JSON.stringify(payload.session));
    } catch (err) {
      console.warn('[SessionPersistence] 儲存失敗:', err);
    }
  },

  loadFromStorage() {
    try {
      const fullRaw = localStorage.getItem(MSS_LOCAL_SAVE_KEY);
      if (fullRaw) {
        const data = JSON.parse(fullRaw);
        if (data?.format === MSS_SAVE_FORMAT
          && data.version === MSS_SAVE_FILE_VERSION
          && data.session?.version === SESSION_PERSISTENCE_VERSION) {
          this.applySessionSnapshot(data.session);
          this._deferredPayload = data;
          this.loadedFromStorage = true;
          return true;
        }
      }

      const legacyRaw = localStorage.getItem(SESSION_PERSISTENCE_KEY);
      if (!legacyRaw) return false;

      const session = JSON.parse(legacyRaw);
      if (!session || session.version !== SESSION_PERSISTENCE_VERSION) return false;

      this.applySessionSnapshot(session);
      this._deferredPayload = null;
      this.loadedFromStorage = true;
      return true;
    } catch (err) {
      console.warn('[SessionPersistence] 讀取失敗:', err);
      return false;
    }
  },

  /** DOM ready、CostTracker 等模組就緒後套用延遲欄位 */
  applyDeferredSavePayload() {
    const data = this._deferredPayload;
    this._deferredPayload = null;
    if (!data) return;
    this.applyExtraPayload(data);
  },

  applyExtraPayload(data) {
    if (!data || typeof data !== 'object') return;

    if (data.costTracker && typeof CostTrackerModule !== 'undefined'
      && typeof CostTrackerModule.applySavePayload === 'function') {
      CostTrackerModule.applySavePayload(data.costTracker);
    }

    if (data.playerCubeCounts && typeof playerCubeCounts !== 'undefined') {
      Object.keys(playerCubeCounts).forEach((key) => {
        delete playerCubeCounts[key];
      });
      Object.assign(playerCubeCounts, data.playerCubeCounts);
    }

    if (data.playerAddPotCubeCounts && typeof playerAddPotCubeCounts !== 'undefined') {
      Object.keys(playerAddPotCubeCounts).forEach((key) => {
        delete playerAddPotCubeCounts[key];
      });
      Object.assign(playerAddPotCubeCounts, data.playerAddPotCubeCounts);
    }

    if (data.playerStarForceScrollInventory && typeof playerStarForceScrollInventory !== 'undefined') {
      Object.keys(playerStarForceScrollInventory).forEach((key) => {
        delete playerStarForceScrollInventory[key];
      });
      Object.assign(playerStarForceScrollInventory, data.playerStarForceScrollInventory);
    }
  },

  exportSaveToFile() {
    try {
      const payload = this.buildExportPayload();
      const json = JSON.stringify(payload, null, 2);
      const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      anchor.href = url;
      anchor.download = `mss-save-${stamp}.json`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      if (typeof addLog === 'function') {
        addLog('💾 已匯出存檔。', 'log-success');
      }
      return true;
    } catch (err) {
      console.warn('[SessionPersistence] 匯出失敗:', err);
      if (typeof addLog === 'function') {
        addLog('⚠️ 匯出存檔失敗。', 'log-fail');
      }
      return false;
    }
  },

  importSaveFromObject(data) {
    if (!data || data.format !== MSS_SAVE_FORMAT || data.version !== MSS_SAVE_FILE_VERSION) {
      throw new Error('無效的存檔格式');
    }

    const session = data.session;
    if (!session || session.version !== SESSION_PERSISTENCE_VERSION) {
      throw new Error('存檔版本不相容');
    }

    this.clearEquipSlotSilent();
    this.applySessionSnapshot(session);
    this.applyExtraPayload(data);

    if (typeof aeCloseAllAutoEnchantOverlays === 'function') {
      aeCloseAllAutoEnchantOverlays();
    }
    if (typeof EquipTooltipModule !== 'undefined') {
      EquipTooltipModule.hide(true);
    }

    if (typeof initInventory === 'function') initInventory();
    if (typeof updateStatusPanel === 'function') updateStatusPanel();
    if (typeof updateCategoryTabStates === 'function') updateCategoryTabStates();
    if (typeof syncMainPanelIdleState === 'function') syncMainPanelIdleState();
    if (typeof updateNonePageControls === 'function') updateNonePageControls();
    if (typeof syncInspectModules === 'function') syncInspectModules();
    if (typeof calculateCost === 'function') calculateCost();

    this.restoreEquippedItem();

    if (typeof CostTrackerModule !== 'undefined') {
      CostTrackerModule.refreshCostDisplay();
      if (CostTrackerModule.isOpen) CostTrackerModule.render();
    }

    this.loadedFromStorage = true;
    this.saveToStorage();
  },

  clearEquipSlotSilent() {
    if (typeof currentEnchantItem === 'undefined' || !currentEnchantItem) return;

    const slotIndex = currentEnchantItem.slotIndex;
    const invItemImg = document.getElementById(`inv_item_equip_${slotIndex}`);
    const invFrame = invItemImg?.parentElement;
    if (invFrame?.classList.contains('inv-item-frame')) {
      invFrame.classList.remove('equipped-hidden');
    }

    const dropZone = document.getElementById('equipDropZone');
    if (dropZone) dropZone.innerHTML = '';

    const sfItemName = document.getElementById('sfItemName');
    if (sfItemName) sfItemName.innerText = '請放置裝備';

    currentEnchantItem = null;

    if (typeof StarForceModule !== 'undefined') StarForceModule.clearEquipState?.();
    if (typeof HammerModule !== 'undefined') HammerModule.resetState();
    if (typeof SoulWeaponModule !== 'undefined') SoulWeaponModule.resetState();
    if (typeof ExceptionalModule !== 'undefined') ExceptionalModule.resetState();
    if (typeof ScrollModule !== 'undefined') ScrollModule.resetState();
    if (typeof PotentialModule !== 'undefined') PotentialModule.resetState();
    if (typeof AddPotentialModule !== 'undefined') AddPotentialModule.resetState();
    if (typeof BonusStatModule !== 'undefined') BonusStatModule.resetState();

    if (typeof updateActiveModuleEquip === 'function') updateActiveModuleEquip();
  },

  isValidItemId(itemId) {
    return Boolean(itemId && typeof ITEM_DATABASE !== 'undefined' && ITEM_DATABASE[itemId]);
  },

  sanitizeEquipArray(source) {
    const count = typeof INVENTORY_SLOT_COUNT !== 'undefined' ? INVENTORY_SLOT_COUNT : 128;
    const result = new Array(count).fill(null);
    if (!Array.isArray(source)) return result;

    for (let i = 0; i < count; i++) {
      const itemId = source[i];
      result[i] = this.isValidItemId(itemId) ? itemId : null;
    }
    return result;
  },

  sanitizeStateArray(source, equipArray) {
    const count = typeof INVENTORY_SLOT_COUNT !== 'undefined' ? INVENTORY_SLOT_COUNT : 128;
    const result = new Array(count).fill(null);
    if (!Array.isArray(source)) return result;

    for (let i = 0; i < count; i++) {
      const state = source[i];
      const itemId = equipArray[i];
      if (!state || !itemId || state.itemId !== itemId) {
        result[i] = null;
        continue;
      }
      result[i] = state;
    }
    return result;
  },

  applySessionSnapshot(data) {
    const equip = this.sanitizeEquipArray(data.inventoryEquip);
    playerInventoryEquip.splice(0, playerInventoryEquip.length, ...equip);

    const consumeCount = typeof INVENTORY_SLOT_COUNT !== 'undefined' ? INVENTORY_SLOT_COUNT : 128;
    const consume = Array.isArray(data.inventoryConsume)
      ? data.inventoryConsume.slice(0, consumeCount)
      : new Array(consumeCount).fill(null);
    while (consume.length < consumeCount) consume.push(null);
    playerInventoryConsume.splice(0, playerInventoryConsume.length, ...consume);

    const state = this.sanitizeStateArray(data.inventoryState, equip);
    playerInventoryState.splice(0, playerInventoryState.length, ...state);

    const slot = data.equippedSlotIndex;
    this.equippedSlotIndex = Number.isInteger(slot) && slot >= 0 && slot < consumeCount && equip[slot]
      ? slot
      : null;

    this.mergeDefaultEquipInventory();
  },

  /**
   * 以 item.js 預設順序 + ITEM_DATABASE 全量為準：
   * - 補上存檔缺少的新增裝備（含只寫進資料庫、未手動塞背包的）
   * - 依預設順序重排；存檔多出的裝備接在後面
   * - 保留既有強化進度
   */
  getDefaultEquipInventoryIds() {
    const ids = [];
    const seen = new Set();

    const preferred = (typeof DEFAULT_PLAYER_INVENTORY_EQUIP_IDS !== 'undefined'
      && Array.isArray(DEFAULT_PLAYER_INVENTORY_EQUIP_IDS))
      ? DEFAULT_PLAYER_INVENTORY_EQUIP_IDS
      : (typeof buildDefaultPlayerInventoryEquipIds === 'function'
        ? buildDefaultPlayerInventoryEquipIds()
        : []);

    preferred.forEach((id) => {
      if (!id || seen.has(id) || !this.isValidItemId(id)) return;
      ids.push(id);
      seen.add(id);
    });

    if (typeof ITEM_DATABASE !== 'undefined') {
      Object.keys(ITEM_DATABASE).forEach((id) => {
        if (seen.has(id) || !this.isValidItemId(id)) return;
        ids.push(id);
        seen.add(id);
      });
    }

    return ids;
  },

  mergeDefaultEquipInventory() {
    const defaults = this.getDefaultEquipInventoryIds();
    if (!defaults.length) return;

    const count = typeof INVENTORY_SLOT_COUNT !== 'undefined' ? INVENTORY_SLOT_COUNT : 128;
    const equippedId = this.equippedSlotIndex != null
      ? playerInventoryEquip[this.equippedSlotIndex]
      : null;

    const stateById = new Map();
    for (let i = 0; i < count; i++) {
      const itemId = playerInventoryEquip[i];
      if (!itemId || !this.isValidItemId(itemId)) continue;
      if (!stateById.has(itemId)) {
        stateById.set(itemId, playerInventoryState[i] ?? null);
      }
    }

    const defaultSet = new Set(defaults);
    const extras = [];
    for (let i = 0; i < count; i++) {
      const itemId = playerInventoryEquip[i];
      if (!itemId || !this.isValidItemId(itemId)) continue;
      if (defaultSet.has(itemId)) continue;
      if (extras.includes(itemId)) continue;
      extras.push(itemId);
    }

    const nextEquip = new Array(count).fill(null);
    const nextState = new Array(count).fill(null);
    let write = 0;

    const place = (itemId) => {
      if (write >= count || !itemId) return;
      nextEquip[write] = itemId;
      const prev = stateById.get(itemId);
      nextState[write] = prev && prev.itemId === itemId ? prev : null;
      write += 1;
    };

    defaults.forEach(place);
    extras.forEach(place);

    playerInventoryEquip.splice(0, playerInventoryEquip.length, ...nextEquip);
    playerInventoryState.splice(0, playerInventoryState.length, ...nextState);

    if (equippedId) {
      const idx = nextEquip.indexOf(equippedId);
      this.equippedSlotIndex = idx >= 0 ? idx : null;
    } else {
      this.equippedSlotIndex = null;
    }
  },

  restoreEquippedItem() {
    if (this.equippedSlotIndex == null) return;
    const itemId = playerInventoryEquip[this.equippedSlotIndex];
    if (!this.isValidItemId(itemId)) {
      this.equippedSlotIndex = null;
      return;
    }
    if (typeof loadEquipToSlot === 'function') {
      loadEquipToSlot(itemId, this.equippedSlotIndex);
    }
  },

  bindAutoSave() {
    window.addEventListener('beforeunload', () => this.saveToStorage());
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') this.saveToStorage();
    });
  }
};

SessionPersistenceModule.loadFromStorage();
