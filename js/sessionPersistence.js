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
  activeProfile: 'sim',
  _needIdleStarter: false,
  /** 放置重置／首次進入時發放新手裝備；可填已 import:wz 的武器／防具／飾品 ID */
  IDLE_STARTER_ITEM_IDS: ['01302000', '01060138', '01040002'],
  get IDLE_STARTER_WEAPON_ID() {
    return this.IDLE_STARTER_ITEM_IDS[0] || '01242000';
  },

  profileFromStorage() {
    try {
      return localStorage.getItem('app.mode.v1') === 'idle' ? 'idle' : 'sim';
    } catch (_) {
      return 'sim';
    }
  },

  keysFor(profile) {
    const suffix = profile === 'idle' ? '.idle' : '';
    return {
      full: MSS_LOCAL_SAVE_KEY + suffix,
      session: SESSION_PERSISTENCE_KEY + suffix,
    };
  },

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

    // 已移出背包時，進度只存在 currentEnchantItem → equippedItem 快照
    if (!Number.isInteger(currentEnchantItem.slotIndex) || currentEnchantItem.slotIndex < 0) {
      return;
    }

    const snapshot = typeof cloneEnchantState === 'function'
      ? cloneEnchantState(currentEnchantItem)
      : JSON.parse(JSON.stringify(currentEnchantItem));
    delete snapshot.slotIndex;
    playerInventoryState[currentEnchantItem.slotIndex] = snapshot;
  },

  collectSnapshot() {
    this.syncCurrentEnchantToInventory();

    let equippedItem = null;
    if (typeof currentEnchantItem !== 'undefined' && currentEnchantItem) {
      const itemId = currentEnchantItem.itemId || currentEnchantItem.id;
      const state = typeof cloneEnchantState === 'function'
        ? cloneEnchantState(currentEnchantItem)
        : JSON.parse(JSON.stringify(currentEnchantItem));
      delete state.slotIndex;
      equippedItem = { itemId, state };
    }

    const snap = {
      version: SESSION_PERSISTENCE_VERSION,
      inventoryEquip: playerInventoryEquip.slice(),
      inventoryConsume: playerInventoryConsume.slice(),
      inventoryEtc: (typeof playerInventoryEtc !== 'undefined' ? playerInventoryEtc.slice() : []),
      inventoryState: playerInventoryState.slice(),
      // 新格式：強化槽實體；舊 equippedSlotIndex 保留相容（通常為 -1 / null）
      equippedItem,
      equippedSlotIndex: null,
    };

    if (typeof UiEquipModule !== 'undefined' && typeof UiEquipModule.exportState === 'function') {
      Object.assign(snap, UiEquipModule.exportState());
    }

    return snap;
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
    if (typeof playerPotentialScrollInventory !== 'undefined') {
      payload.playerPotentialScrollInventory = { ...playerPotentialScrollInventory };
    }
    if (typeof playerHammerInventory !== 'undefined') {
      payload.playerHammerInventory = { ...playerHammerInventory };
    }
    if (typeof playerGloryScrollInventory !== 'undefined') {
      payload.playerGloryScrollInventory = { ...playerGloryScrollInventory };
    }
    if (typeof playerRecoveryCardCount !== 'undefined') {
      payload.playerRecoveryCardCount = Math.max(0, Math.floor(Number(playerRecoveryCardCount) || 0));
    }
    if (typeof playerPotionCounts !== 'undefined') {
      payload.playerPotionCounts = { ...playerPotionCounts };
    }
    if (typeof playerBonusStatItemCounts !== 'undefined') {
      payload.playerBonusStatItemCounts = { ...playerBonusStatItemCounts };
    }
    if (typeof playerExceptionalHammerCounts !== 'undefined') {
      payload.playerExceptionalHammerCounts = { ...playerExceptionalHammerCounts };
    }
    if (typeof playerSoulMaterialCounts !== 'undefined') {
      payload.playerSoulMaterialCounts = { ...playerSoulMaterialCounts };
    }
    if (typeof UiNpcShop !== 'undefined' && typeof UiNpcShop.exportRepurchase === 'function') {
      payload.npcShopRepurchase = UiNpcShop.exportRepurchase();
    }

    return payload;
  },

  saveToStorage() {
    try {
      const payload = this.buildExportPayload();
      if (this.activeProfile === 'idle') {
        delete payload.costTracker;
      }
      const keys = this.keysFor(this.activeProfile);
      localStorage.setItem(keys.full, JSON.stringify(payload));
      localStorage.setItem(keys.session, JSON.stringify(payload.session));
    } catch (err) {
      console.warn('[SessionPersistence] 儲存失敗:', err);
    }
  },

  readPayloadFor(profile) {
    const keys = this.keysFor(profile);
    try {
      const fullRaw = localStorage.getItem(keys.full);
      if (fullRaw) {
        const data = JSON.parse(fullRaw);
        if (data?.format === MSS_SAVE_FORMAT
          && data.version === MSS_SAVE_FILE_VERSION
          && data.session?.version === SESSION_PERSISTENCE_VERSION) {
          return data;
        }
      }
      const legacyRaw = localStorage.getItem(keys.session);
      if (!legacyRaw) return null;
      const session = JSON.parse(legacyRaw);
      if (!session || session.version !== SESSION_PERSISTENCE_VERSION) return null;
      return { session };
    } catch (_) {
      return null;
    }
  },

  emptySessionSnapshot() {
    const count = typeof INVENTORY_SLOT_COUNT !== 'undefined' ? INVENTORY_SLOT_COUNT : 128;
    return {
      version: SESSION_PERSISTENCE_VERSION,
      inventoryEquip: new Array(count).fill(null),
      inventoryConsume: new Array(count).fill(null),
      inventoryEtc: new Array(count).fill(null),
      inventoryState: new Array(count).fill(null),
      equippedItem: null,
      equippedSlotIndex: null,
      bodyWearActive: {},
      bodyWearByPreset: { 1: {}, 2: {}, 3: {} },
      activeEquipPreset: 1,
      pendingEquipPreset: 1,
    };
  },

  emptyExtraPayload() {
    return {
      playerCubeCounts: {},
      playerAddPotCubeCounts: {},
      playerStarForceScrollInventory: {},
      playerPotentialScrollInventory: {},
      playerHammerInventory: {},
      playerGloryScrollInventory: {},
      playerRecoveryCardCount: 0,
      playerPotionCounts: {},
      playerBonusStatItemCounts: {},
      playerExceptionalHammerCounts: {},
      playerSoulMaterialCounts: {},
      npcShopRepurchase: [],
    };
  },

  applyWorld(session, extra) {
    try { this.clearEquipSlotSilent(); } catch (err) {
      console.warn('[SessionPersistence] 清強化槽失敗', err);
    }
    try {
      if (typeof UiEquipModule !== 'undefined') UiEquipModule.clearAllPresets?.();
    } catch (err) {
      console.warn('[SessionPersistence] 清裝備欄失敗', err);
    }
    this.applySessionSnapshot(session || this.emptySessionSnapshot());
    try {
      this.applyExtraPayload({ ...this.emptyExtraPayload(), ...(extra || {}) });
    } catch (err) {
      console.warn('[SessionPersistence] 套用額外存檔失敗', err);
    }
    try { this.refreshWorldUi(); } catch (err) {
      console.warn('[SessionPersistence] 重整介面失敗', err);
    }
    if (this.activeProfile === 'idle') {
      try { this.grantIdleStarterIfNeeded(); } catch (err) {
        console.warn('[SessionPersistence] 發放新手武器失敗', err);
      }
    }
  },

  refreshWorldUi() {
    if (typeof aeCloseAllAutoEnchantOverlays === 'function') {
      aeCloseAllAutoEnchantOverlays();
    }
    if (typeof EquipTooltipModule !== 'undefined') {
      EquipTooltipModule.hide(true);
    }
    if (typeof initInventory === 'function') initInventory();
    if (typeof InventoryModule !== 'undefined') {
      InventoryModule.render?.();
      InventoryModule.updateSlotCount?.();
    }
    if (typeof updateStatusPanel === 'function') updateStatusPanel();
    if (typeof updateCategoryTabStates === 'function') updateCategoryTabStates();
    if (typeof syncMainPanelIdleState === 'function') syncMainPanelIdleState();
    if (typeof updateNonePageControls === 'function') updateNonePageControls();
    if (typeof syncInspectModules === 'function') syncInspectModules();
    if (typeof calculateCost === 'function') calculateCost();
    this.restoreUiEquipState();
    this.restoreEquippedItem();
    if (typeof CharacterCombatPanel !== 'undefined') CharacterCombatPanel.syncToCombatPower?.();
    if (typeof UiCharacterInfo !== 'undefined') UiCharacterInfo.refresh?.();
    if (typeof UiHyperStat !== 'undefined') UiHyperStat.refresh?.();
    if (typeof UiApDistribution !== 'undefined') UiApDistribution.refresh?.();
    if (typeof IdleHunt !== 'undefined') IdleHunt.refreshDisplay?.();
  },

  findItemBagIndex(itemId) {
    if (!itemId || typeof playerInventoryEquip === 'undefined') return -1;
    for (let i = 0; i < playerInventoryEquip.length; i++) {
      if (playerInventoryEquip[i] === itemId) return i;
    }
    return -1;
  },

  findIdleWeaponBagIndex() {
    if (typeof playerInventoryEquip === 'undefined' || typeof ITEM_DATABASE === 'undefined') return -1;
    const starter = this.findItemBagIndex(this.IDLE_STARTER_WEAPON_ID);
    if (starter >= 0) return starter;
    for (let i = 0; i < playerInventoryEquip.length; i++) {
      const id = playerInventoryEquip[i];
      if (!id) continue;
      const item = ITEM_DATABASE[id];
      if (item?.mainType === 'WEAPON' || item?.islot === 'Wp' || item?.islot === 'Gw' || item?.islot === 'Wpsi') {
        return i;
      }
    }
    return -1;
  },

  starterItemIds() {
    const ids = Array.isArray(this.IDLE_STARTER_ITEM_IDS) ? this.IDLE_STARTER_ITEM_IDS : [];
    const seen = new Set();
    return ids.map((id) => String(id || '').trim()).filter((id) => {
      if (!id || seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  },

  ensureStarterInDatabase(itemId) {
    const id = itemId || this.IDLE_STARTER_WEAPON_ID;
    if (typeof GeneratedEquipLoader !== 'undefined') GeneratedEquipLoader.register?.();
    if (typeof ITEM_DATABASE !== 'undefined' && ITEM_DATABASE[id]) return id;
    if (typeof buildEquipFromWzInfo !== 'function') {
      return ITEM_DATABASE?.[id] ? id : null;
    }
    const fromWz = (typeof WZ_IMPORTED_EQUIP_RECORDS !== 'undefined' && Array.isArray(WZ_IMPORTED_EQUIP_RECORDS))
      ? WZ_IMPORTED_EQUIP_RECORDS.find((entry) => entry?.id === id)
      : null;
    const fromDoll = (typeof PAPERDOLL_EQUIP_RECORDS !== 'undefined' && Array.isArray(PAPERDOLL_EQUIP_RECORDS))
      ? PAPERDOLL_EQUIP_RECORDS.find((entry) => entry?.id === id)
      : null;
    const fromGen = (typeof GENERATED_EQUIP_RECORDS !== 'undefined' && Array.isArray(GENERATED_EQUIP_RECORDS))
      ? GENERATED_EQUIP_RECORDS.find((entry) => entry?.id === id)
      : null;
    const row = fromWz || fromDoll || fromGen;
    if (!row) return ITEM_DATABASE?.[id] ? id : null;
    ITEM_DATABASE[id] = buildEquipFromWzInfo(row.id, row.name || row.id, row.info || {});
    return id;
  },

  grantOneIdleStarter(starterId, { forceWear, weaponFallback }) {
    const id = this.ensureStarterInDatabase(starterId);
    if (!id || typeof ITEM_DATABASE === 'undefined' || !ITEM_DATABASE[id]) return false;
    let bagIndex = this.findItemBagIndex(id);
    if (bagIndex < 0 && weaponFallback) bagIndex = this.findIdleWeaponBagIndex();
    if (bagIndex < 0) {
      if (typeof InventoryModule === 'undefined' || typeof InventoryModule.addEquipFromCatalog !== 'function') {
        return false;
      }
      InventoryModule.addEquipFromCatalog(id, 0, { silent: true, switchTab: false });
      bagIndex = this.findItemBagIndex(id);
    }
    if (bagIndex < 0) return false;
    if (typeof UiEquipModule === 'undefined') return true;
    const item = ITEM_DATABASE[id];
    const isWeapon = item?.islot === 'Wp' || item?.islot === 'Gw' || item?.mainType === EQUIP_TYPE.WEAPON;
    const slotHint = isWeapon ? '11' : null;
    const alreadyOn = slotHint
      ? UiEquipModule.getWornEntry?.(slotHint)
      : null;
    if (alreadyOn && alreadyOn.itemId === id) return true;
    if (forceWear || !alreadyOn) {
      UiEquipModule.wearFromBag(playerInventoryEquip[bagIndex], bagIndex, slotHint);
    }
    return true;
  },

  grantIdleStarterIfNeeded() {
    if (this.activeProfile !== 'idle') return false;
    if (typeof CharacterSkills !== 'undefined') {
      if (CharacterSkills.needsJobLinePick?.()) return false;
      if (typeof CharacterSkills.needsIdleStarterGrant === 'function'
        && !CharacterSkills.needsIdleStarterGrant()) {
        return false;
      }
    }
    const ids = this.starterItemIds();
    if (!ids.length) return false;
    if (typeof UiEquipModule !== 'undefined' && this._needIdleStarter) {
      ids.forEach((starterId) => {
        const item = ITEM_DATABASE?.[starterId];
        const isWeapon = item?.islot === 'Wp' || item?.islot === 'Gw' || item?.mainType === EQUIP_TYPE.WEAPON;
        if (isWeapon) UiEquipModule.unequipSlot?.('11', { silent: true });
      });
      UiEquipModule.unequipSlot?.('11', { silent: true });
    }
    let granted = false;
    ids.forEach((starterId, index) => {
      if (this.grantOneIdleStarter(starterId, {
        forceWear: this._needIdleStarter,
        weaponFallback: index === 0 && !this._needIdleStarter,
      })) granted = true;
    });
    if (!granted) return false;
    InventoryModule.render?.();
    UiEquipModule.refresh?.();
    if (typeof CharacterCombatPanel !== 'undefined') {
      CharacterCombatPanel.syncFromEquippedWeapon?.();
      CharacterCombatPanel.syncToCombatPower?.();
    }
    if (typeof UiCharacterInfo !== 'undefined') UiCharacterInfo.refresh?.();
    if (typeof CharacterSkills !== 'undefined') {
      CharacterSkills.markIdleStarterGranted?.();
    }
    this._needIdleStarter = false;
    this.saveToStorage();
    return true;
  },

  switchProfile(next, fromHint) {
    const want = next === 'idle' ? 'idle' : 'sim';
    const from = (fromHint === 'idle' || fromHint === 'sim')
      ? fromHint
      : (this.activeProfile === 'idle' ? 'idle' : 'sim');
    this.activeProfile = from;
    this.saveToStorage();
    this.activeProfile = want;
    const data = this.readPayloadFor(want);
    this._needIdleStarter = want === 'idle' && !data?.session;
    this.applyWorld(
      data?.session || this.emptySessionSnapshot(),
      { ...this.emptyExtraPayload(), ...(data || {}) },
    );
    this._deferredPayload = null;
    this.loadedFromStorage = true;
  },

  resetIdleWorld() {
    const inIdle = this.activeProfile === 'idle'
      || (typeof AppMode !== 'undefined' && AppMode.isIdle?.());
    if (!inIdle) return false;
    this.activeProfile = 'idle';
    this._needIdleStarter = true;
    this.applyWorld(this.emptySessionSnapshot(), this.emptyExtraPayload());
    this.saveToStorage();
    return true;
  },

  loadFromStorage() {
    this.activeProfile = this.profileFromStorage();
    try {
      const data = this.readPayloadFor(this.activeProfile);
      if (data?.session) {
        this.applySessionSnapshot(data.session);
        this._deferredPayload = data.format ? data : null;
        this.loadedFromStorage = true;
        return true;
      }
      if (this.activeProfile === 'idle') {
        this._needIdleStarter = true;
        this.applySessionSnapshot(this.emptySessionSnapshot());
        this._deferredPayload = this.emptyExtraPayload();
        this.loadedFromStorage = true;
        return true;
      }
      return false;
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
    this.grantIdleStarterIfNeeded();
  },

  applyExtraPayload(data) {
    if (!data || typeof data !== 'object') return;
    if (typeof InventoryModule !== 'undefined') {
      InventoryModule._consumeCountsReady = false;
    }

    const resetMap = (target) => {
      if (typeof target === 'undefined') return;
      Object.keys(target).forEach((key) => { delete target[key]; });
    };
    resetMap(typeof playerCubeCounts !== 'undefined' ? playerCubeCounts : undefined);
    resetMap(typeof playerAddPotCubeCounts !== 'undefined' ? playerAddPotCubeCounts : undefined);
    resetMap(typeof playerStarForceScrollInventory !== 'undefined' ? playerStarForceScrollInventory : undefined);
    resetMap(typeof playerPotentialScrollInventory !== 'undefined' ? playerPotentialScrollInventory : undefined);
    resetMap(typeof playerHammerInventory !== 'undefined' ? playerHammerInventory : undefined);
    resetMap(typeof playerGloryScrollInventory !== 'undefined' ? playerGloryScrollInventory : undefined);
    resetMap(typeof playerBonusStatItemCounts !== 'undefined' ? playerBonusStatItemCounts : undefined);
    resetMap(typeof playerExceptionalHammerCounts !== 'undefined' ? playerExceptionalHammerCounts : undefined);
    resetMap(typeof playerSoulMaterialCounts !== 'undefined' ? playerSoulMaterialCounts : undefined);

    if (data.costTracker && typeof CostTrackerModule !== 'undefined'
      && typeof CostTrackerModule.applySavePayload === 'function') {
      CostTrackerModule.applySavePayload(data.costTracker);
    }

    if (data.playerCubeCounts && typeof playerCubeCounts !== 'undefined') {
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

    if (data.playerPotentialScrollInventory && typeof playerPotentialScrollInventory !== 'undefined') {
      Object.keys(playerPotentialScrollInventory).forEach((key) => {
        delete playerPotentialScrollInventory[key];
      });
      Object.assign(playerPotentialScrollInventory, data.playerPotentialScrollInventory);
      if (this.activeProfile !== 'idle' && typeof ensurePotentialScrollCounts === 'function') {
        ensurePotentialScrollCounts();
      }
    } else if (this.activeProfile !== 'idle' && typeof ensurePotentialScrollCounts === 'function') {
      ensurePotentialScrollCounts();
    }
    if (typeof ensurePotentialScrollConsumeInventory === 'function') {
      ensurePotentialScrollConsumeInventory();
    }

    const assignCountMap = (target, src) => {
      if (!src || typeof target === 'undefined') return;
      Object.keys(target).forEach((key) => { delete target[key]; });
      Object.assign(target, src);
    };
    if (data.playerHammerInventory && typeof playerHammerInventory !== 'undefined') {
      assignCountMap(playerHammerInventory, data.playerHammerInventory);
    }
    if (data.playerGloryScrollInventory && typeof playerGloryScrollInventory !== 'undefined') {
      assignCountMap(playerGloryScrollInventory, data.playerGloryScrollInventory);
    }
    if (typeof playerRecoveryCardCount !== 'undefined') {
      playerRecoveryCardCount = Math.max(0, Math.floor(Number(data.playerRecoveryCardCount) || 0));
      if (typeof ensureRecoveryCardConsumeInventory === 'function') {
        ensureRecoveryCardConsumeInventory();
      }
    }
    if (data.playerPotionCounts && typeof playerPotionCounts !== 'undefined') {
      assignCountMap(playerPotionCounts, data.playerPotionCounts);
      if (typeof IdlePotionStore !== 'undefined') {
        IdlePotionStore.list().forEach((potion) => {
          if (getPlayerPotionCount(potion.id) > 0 && typeof ensurePotionConsumeInventory === 'function') {
            ensurePotionConsumeInventory(potion.id);
          }
        });
      }
    }
    if (data.playerBonusStatItemCounts && typeof playerBonusStatItemCounts !== 'undefined') {
      assignCountMap(playerBonusStatItemCounts, data.playerBonusStatItemCounts);
    }
    if (data.playerExceptionalHammerCounts && typeof playerExceptionalHammerCounts !== 'undefined') {
      assignCountMap(playerExceptionalHammerCounts, data.playerExceptionalHammerCounts);
    }
    if (data.playerSoulMaterialCounts && typeof playerSoulMaterialCounts !== 'undefined') {
      assignCountMap(playerSoulMaterialCounts, data.playerSoulMaterialCounts);
    }
    if (typeof UiNpcShop !== 'undefined' && typeof UiNpcShop.importRepurchase === 'function') {
      UiNpcShop.importRepurchase(data.npcShopRepurchase || []);
    }
    if (typeof InventoryModule !== 'undefined' && typeof InventoryModule.markConsumeCountsReady === 'function') {
      InventoryModule.markConsumeCountsReady();
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

    this.restoreUiEquipState();
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

  sanitizeEtcArray(source) {
    const count = typeof INVENTORY_SLOT_COUNT !== 'undefined' ? INVENTORY_SLOT_COUNT : 128;
    const result = new Array(count).fill(null);
    if (!Array.isArray(source)) return result;
    for (let i = 0; i < count; i++) {
      const row = source[i];
      if (!row || typeof row !== 'object') continue;
      const itemId = String(row.itemId || row.id || '').trim();
      if (!itemId) continue;
      result[i] = {
        type: 'etc',
        itemId,
        name: String(row.name || itemId),
        icon: String(row.icon || ''),
        amount: Math.max(1, Math.floor(Number(row.amount) || 1)),
      };
    }
    return result;
  },

  migrateEtcPotionsToConsume() {
    if (typeof playerInventoryEtc === 'undefined' || typeof IdlePotionStore === 'undefined') return;
    for (let i = 0; i < playerInventoryEtc.length; i += 1) {
      const entry = playerInventoryEtc[i];
      if (!entry) continue;
      const id = String(entry.itemId || '').trim();
      if (!IdlePotionStore.isPotionId?.(id)) continue;
      const amount = Math.max(1, Math.floor(Number(entry.amount) || 1));
      if (typeof grantPotion === 'function') grantPotion(id, amount);
      playerInventoryEtc[i] = null;
    }
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

    const etc = this.sanitizeEtcArray(data.inventoryEtc);
    if (typeof playerInventoryEtc !== 'undefined') {
      playerInventoryEtc.splice(0, playerInventoryEtc.length, ...etc);
    }
    this.migrateEtcPotionsToConsume();

    const state = this.sanitizeStateArray(data.inventoryState, equip);
    playerInventoryState.splice(0, playerInventoryState.length, ...state);

    const slot = data.equippedSlotIndex;
    this.equippedSlotIndex = Number.isInteger(slot) && slot >= 0 && slot < consumeCount && equip[slot]
      ? slot
      : null;

    // 新格式強化槽實體（物品已不在背包）
    this._pendingEquippedItem = null;
    if (data.equippedItem?.itemId && this.isValidItemId(data.equippedItem.itemId)) {
      this._pendingEquippedItem = {
        itemId: data.equippedItem.itemId,
        state: data.equippedItem.state || null,
      };
      this.equippedSlotIndex = null;
    }

    this.mergeDefaultEquipInventory();
    if (typeof ensurePotentialScrollConsumeInventory === 'function') {
      ensurePotentialScrollConsumeInventory();
    }
    if (this.activeProfile !== 'idle') {
      if (typeof stripLegacyStarterPotentialsFromInventory === 'function') {
        stripLegacyStarterPotentialsFromInventory();
      }
    }

    // UiEquip 模組可能尚未載入：延後到 restoreUiEquipState
    this._pendingUiEquipState = {
      bodyWearActive: data.bodyWearActive || null,
      bodyWearByPreset: data.bodyWearByPreset || null,
      activeEquipPreset: data.activeEquipPreset,
      pendingEquipPreset: data.pendingEquipPreset,
    };
  },

  restoreUiEquipState() {
    const pending = this._pendingUiEquipState;
    this._pendingUiEquipState = null;
    if (!pending || typeof UiEquipModule === 'undefined') return;
    if (typeof UiEquipModule.importState !== 'function') return;
    if (!pending.bodyWearActive && !pending.bodyWearByPreset && pending.activeEquipPreset == null) {
      return;
    }
    UiEquipModule.importState(pending);
  },

  /**
   * 只清掉資料庫已不存在的格子；不再把 ITEM_DATABASE 全量塞進背包。
   * 新裝備請從物品清單拿取。
   */
  mergeDefaultEquipInventory() {
    const count = typeof INVENTORY_SLOT_COUNT !== 'undefined' ? INVENTORY_SLOT_COUNT : 128;
    if (typeof playerInventoryEquip === 'undefined') return;

    for (let i = 0; i < count; i++) {
      const itemId = playerInventoryEquip[i];
      if (!itemId) continue;
      if (this.isValidItemId(itemId)) continue;
      playerInventoryEquip[i] = null;
      if (typeof playerInventoryState !== 'undefined') playerInventoryState[i] = null;
    }

    if (typeof playerInventory !== 'undefined' && Array.isArray(playerInventory)) {
      playerInventory.splice(0, playerInventory.length, ...playerInventoryEquip);
    }
  },

  restoreEquippedItem() {
    if (this._pendingEquippedItem?.itemId) {
      const held = this._pendingEquippedItem;
      this._pendingEquippedItem = null;
      if (typeof loadEnchantItemHeld === 'function') {
        loadEnchantItemHeld(held.itemId, held.state);
      }
      return;
    }

    if (this.equippedSlotIndex == null) return;
    const itemId = playerInventoryEquip[this.equippedSlotIndex];
    if (!this.isValidItemId(itemId)) {
      this.equippedSlotIndex = null;
      return;
    }
    if (typeof loadEquipToSlot === 'function') {
      loadEquipToSlot(itemId, this.equippedSlotIndex);
    }
    this.equippedSlotIndex = null;
  },

  bindAutoSave() {
    window.addEventListener('beforeunload', () => this.saveToStorage());
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') this.saveToStorage();
    });
  }
};

SessionPersistenceModule.loadFromStorage();
