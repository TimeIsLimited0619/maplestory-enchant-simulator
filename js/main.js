// ==========================================
// 1. 全域狀態與裝備載入
// ==========================================

const TAB_BUTTON_IDS = {
  star: 'tabStar',
  scroll: 'tabScroll',
  hammer: 'tabHammer',
  soulWeapon: 'tabSoulWeapon',
  bonusStat: 'tabbonusStat',
  potential: 'tabpotential',
  additionalPotential: 'tabadditionalPotential',
  exceptional: 'tabexceptional'
};

/** 左側占位分頁：可點擊但不切換畫面 */
const PLACEHOLDER_TAB_CATEGORIES = new Set([]);

function getActiveCategory() {
  return document.getElementById('actionCategory')?.value || 'none';
}

function getCurrentStarCount(item) {
  if (!item) return 0;
  if (typeof StarForceModule !== 'undefined' && StarForceModule.itemData === item) {
    return StarForceModule.currentStars;
  }
  return item.star || 0;
}

function areAllHammersExhaustedForItem(item) {
  if (!item) return false;
  const goldenMax = item.maxGoldenHammer ?? 1;
  const platinumMax = item.maxPlatinumHammer ?? 5;
  return (item.goldenHammerUsed || 0) >= goldenMax
    && (item.platinumHammerUsed || 0) >= platinumMax;
}

/** 裝備是否仍可使用該分頁功能（無裝備時一律可進入瀏覽） */
function isCategoryAvailable(category, item = currentEnchantItem) {
  if (!item) return true;

  switch (category) {
    case 'star':
      return canUseStarForce(item)
        && getCurrentStarCount(item) < (item.maxStar || 30);
    case 'hammer':
      return hasBaseUpgradeSlots(item) && !areAllHammersExhaustedForItem(item);
    case 'scroll':
      return hasBaseUpgradeSlots(item);
    case 'soulWeapon':
      return typeof canUseSoulWeapon === 'function'
        ? canUseSoulWeapon(item)
        : true;
    case 'bonusStat':
      return typeof canUseBonusStat === 'function'
        ? canUseBonusStat(item)
        : true;
    case 'exceptional':
      return typeof canUseExceptional === 'function'
        ? canUseExceptional(item)
        : false;
    case 'potential':
      return typeof canUsePotentialEnhancement === 'function'
        ? canUsePotentialEnhancement(item)
        : (typeof isMedalItem === 'function' ? !isMedalItem(item) : true);
    case 'additionalPotential':
      return typeof canUseAdditionalPotentialEnhancement === 'function'
        ? canUseAdditionalPotentialEnhancement(item)
        : (typeof isMedalItem === 'function' ? !isMedalItem(item) : true);
    default:
      return true;
  }
}

function isCategoryDisabled(category) {
  if (category === 'none') return false;
  return !isCategoryAvailable(category);
}

function updateCategoryTabStates() {
  Object.entries(TAB_BUTTON_IDS).forEach(([category, tabId]) => {
    const btn = document.getElementById(tabId);
    if (btn) btn.disabled = isCategoryDisabled(category);
  });

  const activeCat = getActiveCategory();
  if (activeCat !== 'none' && isCategoryDisabled(activeCat)) {
    switchCategoryTab('none', null);
  }
}

// ==========================================
// 2. 背包與裝備拖曳載入邏輯
// ==========================================

function allowDrop(e) {
  e.preventDefault();
}

function dropEquip(e) {
  e.preventDefault();
  const data = e.dataTransfer.getData('text/plain');
  if (!data) return;

  try {
    const { itemId, slotIndex, tab } = JSON.parse(data);
    if (tab && tab !== 'equip') return;
    loadEquipToSlot(itemId, slotIndex);
  } catch (err) {
    console.error('拖曳解析失敗:', err);
  }
}

function createEnchantState(itemData, slotIndex) {
  return {
    ...itemData,
    slotIndex,
    itemId: itemData.itemId || itemData.id,
    star: itemData.star || 0,
    starConsecutiveDrops: itemData.starConsecutiveDrops || 0,
    scrollUsed: 0,
    scrollFailUses: 0,
    scrollSlotResults: [],
    scrollStat: 0,
    scrollAtk: 0,
    scrollMatk: 0,
    scrollStr: 0,
    scrollDex: 0,
    scrollInt: 0,
    scrollLuk: 0,
    scrollDef: 0,
    scrollHp: 0,
    scrollMp: 0,
    scrollSpeed: 0,
    scrollJump: 0,
    scrollDamR: 0,
    scrollBdR: 0,
    scrollImdR: 0,
    scrollAllStatR: 0,
    catValleyLevel: itemData.catValleyLevel || 0,
    medalEnhanceLevel: itemData.medalEnhanceLevel || 0,
    catValleyJackpotMain: itemData.catValleyJackpotMain || null,
    catValleyJackpotAdd: itemData.catValleyJackpotAdd || null,
    goldenHammerUsed: 0,
    platinumHammerUsed: 0,
    upgradeSlots: itemData.upgradeSlots,
    maxUpgradeSlots: itemData.maxUpgradeSlots,
    baseMaxUpgradeSlots: itemData.maxUpgradeSlots,
    maxGoldenHammer: itemData.maxGoldenHammer ?? 1,
    maxPlatinumHammer: itemData.maxPlatinumHammer ?? 5,
    potential: itemData.potential
      ? JSON.parse(JSON.stringify(itemData.potential))
      : (typeof shouldStartWithoutPotential === 'function' && shouldStartWithoutPotential(itemData)
        ? getEmptyPotentialState()
        : getDefaultPotentialState()),
    additionalPotential: itemData.additionalPotential
      ? JSON.parse(JSON.stringify(itemData.additionalPotential))
      : (typeof shouldStartWithoutPotential === 'function' && shouldStartWithoutPotential(itemData)
        ? getEmptyAddPotentialState()
        : getDefaultAddPotentialState(itemData.reqLevel)),
    bonusStat: itemData.bonusStat
      ? JSON.parse(JSON.stringify(itemData.bonusStat))
      : getDefaultBonusStatState(),
    soul: itemData.soul
      ? JSON.parse(JSON.stringify(itemData.soul))
      : {
          enchanterApplied: Boolean(itemData.soulEnchanterApplied),
          grade: itemData.soulGrade || null,
          name: itemData.soulName || '',
          option: itemData.soulOption || null,
          stats: itemData.soulStats || null,
        },
    soulEnchanterApplied: Boolean(itemData.soulEnchanterApplied || itemData.soul?.enchanterApplied),
    soulGrade: itemData.soulGrade || itemData.soul?.grade || null,
    soulName: itemData.soulName || itemData.soul?.name || '',
    soulOption: itemData.soulOption || itemData.soul?.option || null,
    soulStats: itemData.soulStats || itemData.soul?.stats || null,
    exceptional: itemData.exceptional
      ? JSON.parse(JSON.stringify(itemData.exceptional))
      : { level: 0 },
  };
}

function cloneEnchantState(state) {
  return JSON.parse(JSON.stringify(state));
}

function syncEnchantStateFromModules(item) {
  if (!item) return;
  if (typeof StarForceModule !== 'undefined' && StarForceModule.itemData === item) {
    item.star = StarForceModule.currentStars;
    item.starConsecutiveDrops = StarForceModule.getStarConsecutiveDrops?.() ?? item.starConsecutiveDrops ?? 0;
  }
}

function syncEnchantStateToModules(item) {
  if (!item) return;
  if (typeof StarForceModule !== 'undefined' && StarForceModule.itemData === item) {
    StarForceModule.currentStars = item.star ?? 0;
    StarForceModule.setStarConsecutiveDrops?.(item.starConsecutiveDrops ?? 0);
  }
}

function refreshActiveModuleUI() {
  if (!currentEnchantItem) return;

  const item = currentEnchantItem;
  const cat = getActiveCategory();
  if (cat === 'none') return;

  const refreshBoundModule = (module, beforeUpdate) => {
    if (!module || module.itemData !== item || typeof module.updateUI !== 'function') {
      return false;
    }
    if (typeof beforeUpdate === 'function') beforeUpdate(module, item);
    module.updateUI();
    return true;
  };

  let refreshed = false;
  if (cat === 'star') {
    refreshed = refreshBoundModule(
      typeof StarForceModule !== 'undefined' ? StarForceModule : null,
      (module, equip) => {
        module.currentStars = equip.star ?? 0;
        module.setStarConsecutiveDrops?.(equip.starConsecutiveDrops ?? 0);
      },
    );
  } else if (cat === 'hammer') {
    refreshed = refreshBoundModule(typeof HammerModule !== 'undefined' ? HammerModule : null);
  } else if (cat === 'soulWeapon') {
    refreshed = refreshBoundModule(typeof SoulWeaponModule !== 'undefined' ? SoulWeaponModule : null);
  } else if (cat === 'scroll') {
    refreshed = refreshBoundModule(typeof ScrollModule !== 'undefined' ? ScrollModule : null);
  } else if (cat === 'potential') {
    refreshed = refreshBoundModule(typeof PotentialModule !== 'undefined' ? PotentialModule : null);
  } else if (cat === 'additionalPotential') {
    refreshed = refreshBoundModule(typeof AddPotentialModule !== 'undefined' ? AddPotentialModule : null);
  } else if (cat === 'bonusStat') {
    refreshed = refreshBoundModule(typeof BonusStatModule !== 'undefined' ? BonusStatModule : null);
  } else if (cat === 'exceptional') {
    refreshed = refreshBoundModule(typeof ExceptionalModule !== 'undefined' ? ExceptionalModule : null);
  }

  if (!refreshed) {
    updateActiveModuleEquip();
  }
}

function refreshEquippedItemUI() {
  if (!currentEnchantItem) {
    updateCategoryTabStates();
    return;
  }

  syncEnchantStateFromModules(currentEnchantItem);
  syncEnchantStateToModules(currentEnchantItem);
  saveInventoryItemState(currentEnchantItem.slotIndex, currentEnchantItem);

  refreshActiveModuleUI();
  updateCategoryTabStates();

  if (typeof EquipTooltipModule !== 'undefined') {
    EquipTooltipModule.refreshIfShowing();
  }

  if (typeof EquipStatPanel !== 'undefined' && typeof EquipStatPanel.refresh === 'function') {
    EquipStatPanel.refresh();
  }
  if (typeof UiCharacterInfo !== 'undefined' && typeof UiCharacterInfo.refresh === 'function') {
    UiCharacterInfo.refresh();
  }

  syncInspectModules();
}

function saveInventoryItemState(slotIndex, state) {
  // 強化槽持有中（已移出背包）：只同步記憶體並排程存檔
  if (!Number.isInteger(slotIndex) || slotIndex < 0) {
    if (state && typeof syncEnchantStateFromModules === 'function') {
      syncEnchantStateFromModules(state);
    }
    if (typeof SessionPersistenceModule !== 'undefined') {
      SessionPersistenceModule.scheduleSave();
    }
    return;
  }

  if (!state) {
    playerInventoryState[slotIndex] = null;
    if (typeof SessionPersistenceModule !== 'undefined') {
      SessionPersistenceModule.scheduleSave();
    }
    return;
  }
  syncEnchantStateFromModules(state);
  const snapshot = cloneEnchantState(state);
  delete snapshot.slotIndex;
  playerInventoryState[slotIndex] = snapshot;
  if (typeof SessionPersistenceModule !== 'undefined') {
    SessionPersistenceModule.scheduleSave();
  }
}

function loadEnchantStateForSlot(itemId, slotIndex) {
  const template = ITEM_DATABASE[itemId];
  if (!template) return null;

  const saved = playerInventoryState[slotIndex];
  if (saved && saved.itemId === itemId) {
    const fresh = createEnchantState(template, slotIndex);
    return {
      ...fresh,
      ...cloneEnchantState(saved),
      // 分類／模板欄位一律以 item.js 為準，避免工作階段舊資料蓋掉 islot 變更
      slotIndex,
      itemId,
      id: itemId,
      name: template.name,
      icon: template.icon,
      mainType: template.mainType,
      subType: template.subType,
      islot: template.islot,
      vslot: template.vslot,
      reqLevel: template.reqLevel,
      reqJob: template.reqJob,
      reqJob2: template.reqJob2,
      reqSpecJob: template.reqSpecJob,
      weaponTier: template.weaponTier,
      atlas: template.atlas,
      baseStats: template.baseStats,
      wz: template.wz,
      potential: saved.potential
        ? cloneEnchantState({ potential: saved.potential }).potential
        : fresh.potential,
      additionalPotential: saved.additionalPotential
        ? cloneEnchantState({ additionalPotential: saved.additionalPotential }).additionalPotential
        : fresh.additionalPotential
    };
  }

  return createEnchantState(template, slotIndex);
}

function resetAllInventoryEquipStates() {
  for (let i = 0; i < playerInventoryState.length; i++) {
    playerInventoryState[i] = null;
  }

  if (currentEnchantItem) {
    const template = ITEM_DATABASE[currentEnchantItem.itemId];
    if (template) {
      currentEnchantItem = createEnchantState(template, currentEnchantItem.slotIndex);
    } else {
      currentEnchantItem = null;
    }
  }

  updateActiveModuleEquip();
  updateStatusPanel();
  updateCategoryTabStates();
  initInventory();
  syncInspectModules();
  if (typeof CatValleyEnhanceModule !== 'undefined') {
    CatValleyEnhanceModule.updateButton();
  }
  if (typeof SessionPersistenceModule !== 'undefined') {
    SessionPersistenceModule.scheduleSave();
  }
  addLog('[系統] 已重置所有裝備的強化狀態。', 'log-info');
}

function resetEquippedItemState() {
  if (!currentEnchantItem) {
    showAppConfirm({
      title: '重置所有裝備狀態',
      message: '目前欄位未放置裝備。\n確定要重置所有裝備的強化狀態嗎？',
      confirmText: '確定重置',
      cancelText: '取消',
    }).then((ok) => {
      if (ok) resetAllInventoryEquipStates();
    });
    return;
  }

  const { slotIndex, itemId, name } = currentEnchantItem;
  const template = ITEM_DATABASE[itemId];
  if (!template) return;

  playerInventoryState[slotIndex] = null;
  currentEnchantItem = createEnchantState(template, slotIndex);

  updateActiveModuleEquip();
  updateStatusPanel();
  updateCategoryTabStates();
  initInventory();
  syncInspectModules();
  if (typeof CatValleyEnhanceModule !== 'undefined') {
    CatValleyEnhanceModule.updateButton();
  }
  if (typeof SessionPersistenceModule !== 'undefined') {
    SessionPersistenceModule.scheduleSave();
  }
  addLog(`[系統] 已重置【${name}】的強化狀態。`, 'log-info');
}

/**
 * 介面內確認彈窗（取代 window.confirm）
 * @returns {Promise<boolean>}
 */
function showAppConfirm({
  title = '確認',
  message = '',
  confirmText = '確定',
  cancelText = '取消',
} = {}) {
  const overlay = document.getElementById('msConfirmOverlay');
  const titleEl = document.getElementById('msConfirmTitle');
  const messageEl = document.getElementById('msConfirmMessage');
  const okBtn = document.getElementById('msConfirmOkBtn');
  const cancelBtn = document.getElementById('msConfirmCancelBtn');

  if (!overlay || !okBtn || !cancelBtn) {
    return Promise.resolve(window.confirm(message));
  }

  if (titleEl) titleEl.textContent = title;
  if (messageEl) messageEl.textContent = message;
  okBtn.textContent = confirmText;
  cancelBtn.textContent = cancelText;

  return new Promise((resolve) => {
    const finish = (result) => {
      cleanup();
      overlay.classList.add('hidden');
      overlay.setAttribute('aria-hidden', 'true');
      resolve(result);
    };

    const onOk = (event) => {
      event.preventDefault();
      finish(true);
    };
    const onCancel = (event) => {
      event.preventDefault();
      finish(false);
    };
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        finish(false);
      } else if (event.key === 'Enter') {
        event.preventDefault();
        event.stopPropagation();
        finish(true);
      }
    };
    const onBackdrop = (event) => {
      if (event.target === overlay) finish(false);
    };

    const cleanup = () => {
      okBtn.removeEventListener('click', onOk);
      cancelBtn.removeEventListener('click', onCancel);
      overlay.removeEventListener('click', onBackdrop);
      window.removeEventListener('keydown', onKeyDown, true);
    };

    okBtn.addEventListener('click', onOk);
    cancelBtn.addEventListener('click', onCancel);
    overlay.addEventListener('click', onBackdrop);
    window.addEventListener('keydown', onKeyDown, true);

    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    okBtn.focus?.();
  });
}

function syncInspectModules() {
  if (typeof PotentialInspectModule !== 'undefined') {
    PotentialInspectModule.updateVisibility();
    if (PotentialInspectModule.isOpen) PotentialInspectModule.render();
  }
  if (typeof BonusStatInspectModule !== 'undefined') {
    BonusStatInspectModule.updateVisibility();
    if (BonusStatInspectModule.isOpen) BonusStatInspectModule.render();
  }
}

const BLOCKING_OVERLAY_IDS = [
  'scrollRecoveryModal',
  'ptInspectOverlay',
  'bsInspectOverlay',
  'ptHexaOverlay',
  'ptUniOverlay',
  'ptMemoriaOverlay',
  'apHexaOverlay',
  'apUniOverlay',
  'apMemoriaOverlay',
  'bsChoiceOverlay',
  'aeBsOverlay',
  'exExtractConfirmModal'
];

function isBlockingOverlayOpen() {
  return BLOCKING_OVERLAY_IDS.some((id) => {
    const el = document.getElementById(id);
    return el && !el.classList.contains('hidden');
  });
}

/** 強化台右上角 ×（HTML 內建，獨立初始化） */
function initEnchantWorkbenchClose() {
  const btn = document.getElementById('enchantWorkbenchClose');
  if (!btn) return;
  if (btn.dataset.closeBound === '1') return;
  btn.dataset.closeBound = '1';
  btn.addEventListener('mousedown', (e) => {
    e.stopPropagation();
  });
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (typeof UiEquipModule !== 'undefined') UiEquipModule.setEnchantOpen(false);
  });
}

function handleGlobalEscapeKey() {
  if (typeof InventoryModule !== 'undefined' && InventoryModule.pendingPotentialScrollId) {
    InventoryModule.cancelPotentialScrollUse();
    if (typeof addLog === 'function') {
      addLog('[消耗] 已取消使用潛能卷軸。', 'log-info');
    }
    return;
  }
  if (typeof ExceptionalModule !== 'undefined' && ExceptionalModule.isExtractConfirmOpen?.()) {
    ExceptionalModule.closeExtractConfirm();
    return;
  }
  if (isBlockingOverlayOpen()) return;

  // 可 ESC 關閉的視窗：依目前 z-index 關閉置頂者
  const escTargets = [
    {
      id: 'equipStatPanel',
      isOpen: () => typeof EquipStatPanel !== 'undefined' && EquipStatPanel.isOpen?.(),
      close: () => EquipStatPanel.setOpen(false),
    },
    {
      id: 'ccpRoot',
      isOpen: () => typeof CharacterCombatPanel !== 'undefined' && CharacterCombatPanel.isOpen?.(),
      close: () => CharacterCombatPanel.setOpen(false),
    },
    {
      id: 'uciRoot',
      isOpen: () => typeof UiCharacterInfo !== 'undefined' && UiCharacterInfo.isOpen?.(),
      close: () => UiCharacterInfo.setOpen(false),
    },
    {
      id: 'inventoryPanel',
      isOpen: () => typeof InventoryModule !== 'undefined' && InventoryModule.isOpen?.(),
      close: () => InventoryModule.setOpen(false),
    },
    {
      id: 'uiEquipPanel',
      isOpen: () => typeof UiEquipModule !== 'undefined' && UiEquipModule.isEquipOpen?.(),
      close: () => UiEquipModule.setEquipOpen(false),
    },
    {
      id: 'enchantWorkbench',
      isOpen: () => typeof UiEquipModule !== 'undefined' && UiEquipModule.isEnchantOpen?.(),
      close: () => {
        // 強化台：非待機先回 none，再按一次才關閉
        if (getActiveCategory() !== 'none') {
          switchCategoryTab('none', null);
          return;
        }
        UiEquipModule.setEnchantOpen(false);
      },
    },
  ];

  function panelZ(el) {
    if (!el) return -Infinity;
    const inline = parseInt(el.style.zIndex, 10);
    if (Number.isFinite(inline)) return inline;
    const computed = parseInt(window.getComputedStyle(el).zIndex, 10);
    return Number.isFinite(computed) ? computed : 0;
  }

  let top = null;
  let topZ = -Infinity;
  let topEl = null;
  escTargets.forEach((t) => {
    if (!t.isOpen()) return;
    const el = document.getElementById(t.id)
      || (t.id === 'enchantWorkbench' ? document.getElementById('mainContentPanel') : null);
    if (!el) return;
    const z = panelZ(el);
    const laterInDom = !topEl
      || (el.compareDocumentPosition(topEl) & Node.DOCUMENT_POSITION_PRECEDING);
    if (!top || z > topZ || (z === topZ && laterInDom)) {
      top = t;
      topZ = z;
      topEl = el;
    }
  });

  top?.close();
}

function updateNonePageControls() {
  const resetBtn = document.getElementById('btnResetEquipState');
  if (resetBtn) {
    resetBtn.classList.toggle('hidden', getActiveCategory() !== 'none');
  }
}

function syncMainPanelIdleState() {
  const cat = getActiveCategory();
  const mainPanel = document.getElementById('mainContentPanel');
  if (!mainPanel) return;

  const hasEquip = Boolean(currentEnchantItem);
  const hasSfScroll = cat === 'star'
    && typeof StarForceModule !== 'undefined'
    && Boolean(StarForceModule.selectedScrollId);

  mainPanel.classList.toggle('none-active', cat === 'none');
  mainPanel.classList.toggle('none-idle', cat === 'none' && !hasEquip);
  mainPanel.classList.toggle('starforce-idle', cat === 'star' && !hasEquip);
  mainPanel.classList.toggle('starforce-scroll-idle', cat === 'star' && !hasEquip && hasSfScroll);
  mainPanel.classList.toggle('hammer-idle', cat === 'hammer' && !hasEquip);
  mainPanel.classList.toggle('soulWeapon-idle', cat === 'soulWeapon' && !hasEquip);
  mainPanel.classList.toggle('scroll-idle', cat === 'scroll' && !hasEquip);
  mainPanel.classList.toggle('potential-idle', cat === 'potential' && !hasEquip);
  mainPanel.classList.toggle('additionalPotential-idle', cat === 'additionalPotential' && !hasEquip);
  mainPanel.classList.toggle('bonusStat-idle', cat === 'bonusStat' && !hasEquip);
  mainPanel.classList.toggle('exceptional-idle', cat === 'exceptional' && !hasEquip);
}

function updateNoneWaitEquipVisibility() {
  syncMainPanelIdleState();
  updateNonePageControls();
}

function findEmptyEquipBagSlot() {
  if (typeof playerInventoryEquip === 'undefined') return -1;
  for (let i = 0; i < playerInventoryEquip.length; i++) {
    if (!playerInventoryEquip[i]) return i;
  }
  return -1;
}

function syncPlayerInventoryAlias() {
  if (typeof playerInventory !== 'undefined' && Array.isArray(playerInventory)
    && typeof playerInventoryEquip !== 'undefined') {
    // playerInventory 與 Equip 為同一陣列參照時無需複製；保險同步長度內容
    if (playerInventory !== playerInventoryEquip) {
      playerInventory.splice(0, playerInventory.length, ...playerInventoryEquip);
    }
  }
}

function loadEquipToSlot(itemId, slotIndex) {
  if (typeof EquipTooltipModule !== 'undefined') {
    EquipTooltipModule.hide(true);
  }
  if (currentEnchantItem) {
    unloadEquipFromSlot();
  }

  // 與裝備欄互斥：身上有同一件則先卸回背包
  if (typeof UiEquipModule !== 'undefined' && UiEquipModule.isItemWorn?.(itemId)) {
    UiEquipModule.unequipItemId(itemId, { refreshUi: false });
    slotIndex = playerInventoryEquip.indexOf(itemId);
    if (slotIndex < 0) return;
  }

  const itemData = ITEM_DATABASE[itemId];
  if (!itemData) return;
  if (!Number.isInteger(slotIndex) || slotIndex < 0 || !playerInventoryEquip[slotIndex]) {
    // 允許已不在背包的還原路徑改走 loadEnchantItemHeld
    return;
  }

  // 先讀取背包進度，再真正移出背包
  currentEnchantItem = loadEnchantStateForSlot(itemId, slotIndex);
  if (!currentEnchantItem) return;

  playerInventoryEquip[slotIndex] = null;
  playerInventoryState[slotIndex] = null;
  syncPlayerInventoryAlias();
  currentEnchantItem.slotIndex = -1;

  const dropZone = document.getElementById('equipDropZone');
  if (dropZone) {
    dropZone.innerHTML = `
      <img src="${itemData.icon}"
           alt="${itemData.name}"
           id="enchantedEquipImg"
           title="雙擊卸下裝備">
    `;

    const equipImg = document.getElementById('enchantedEquipImg');
    if (equipImg) {
      equipImg.ondblclick = () => unloadEquipFromSlot();
    }
  }

  const sfItemName = document.getElementById('sfItemName');
  if (sfItemName) sfItemName.innerText = itemData.name;

  addLog(`[系統] 已成功載入【${itemData.name}】！`, 'log-success');
  updateStatusPanel();
  updateActiveModuleEquip();
  updateNoneWaitEquipVisibility();
  updateCategoryTabStates();
  syncMainPanelIdleState();
  initInventory();
  if (typeof CatValleyEnhanceModule !== 'undefined') {
    CatValleyEnhanceModule.updateButton();
  }
  scheduleEffectTestBarRefresh();
  syncInspectModules();
  if (typeof SessionPersistenceModule !== 'undefined') {
    SessionPersistenceModule.scheduleSave();
  }
}

/** 從存檔還原強化槽（物品已不在背包，或需先從背包取出） */
function loadEnchantItemHeld(itemId, savedState = null) {
  if (currentEnchantItem) {
    unloadEquipFromSlot();
  }
  const itemData = ITEM_DATABASE[itemId];
  if (!itemData) return false;

  // 若仍在背包（舊存檔），先取出
  const bagIdx = playerInventoryEquip.indexOf(itemId);
  if (bagIdx >= 0) {
    loadEquipToSlot(itemId, bagIdx);
    if (savedState && currentEnchantItem) {
      const merged = {
        ...currentEnchantItem,
        ...cloneEnchantState(savedState),
        slotIndex: -1,
        itemId,
        id: itemId,
        name: itemData.name,
        icon: itemData.icon,
        mainType: itemData.mainType,
        subType: itemData.subType,
        islot: itemData.islot,
        vslot: itemData.vslot,
        baseStats: itemData.baseStats,
      };
      currentEnchantItem = merged;
      updateActiveModuleEquip();
      updateStatusPanel();
    }
    return true;
  }

  const fresh = createEnchantState(itemData, -1);
  currentEnchantItem = savedState
    ? {
      ...fresh,
      ...cloneEnchantState(savedState),
      slotIndex: -1,
      itemId,
      id: itemId,
      name: itemData.name,
      icon: itemData.icon,
      mainType: itemData.mainType,
      subType: itemData.subType,
      islot: itemData.islot,
      vslot: itemData.vslot,
      baseStats: itemData.baseStats,
    }
    : fresh;

  const dropZone = document.getElementById('equipDropZone');
  if (dropZone) {
    dropZone.innerHTML = `
      <img src="${itemData.icon}"
           alt="${itemData.name}"
           id="enchantedEquipImg"
           title="雙擊卸下裝備">
    `;
    const equipImg = document.getElementById('enchantedEquipImg');
    if (equipImg) {
      equipImg.ondblclick = () => unloadEquipFromSlot();
    }
  }

  const sfItemName = document.getElementById('sfItemName');
  if (sfItemName) sfItemName.innerText = itemData.name;

  updateStatusPanel();
  updateActiveModuleEquip();
  updateNoneWaitEquipVisibility();
  updateCategoryTabStates();
  syncMainPanelIdleState();
  initInventory();
  scheduleEffectTestBarRefresh();
  syncInspectModules();
  return true;
}

function unloadEquipFromSlot() {
  if (!currentEnchantItem) return;

  const itemName = currentEnchantItem.name;
  const itemId = currentEnchantItem.itemId || currentEnchantItem.id;

  syncEnchantStateFromModules(currentEnchantItem);
  const snapshot = cloneEnchantState(currentEnchantItem);
  delete snapshot.slotIndex;

  const bagIndex = findEmptyEquipBagSlot();
  if (bagIndex < 0) {
    addLog('[系統] 背包已滿，無法卸下強化中的裝備。', 'log-fail');
    return;
  }

  playerInventoryEquip[bagIndex] = itemId;
  playerInventoryState[bagIndex] = snapshot;
  syncPlayerInventoryAlias();

  const dropZone = document.getElementById('equipDropZone');
  if (dropZone) dropZone.innerHTML = '';

  const sfItemName = document.getElementById('sfItemName');
  if (sfItemName) sfItemName.innerText = '請放置裝備';

  addLog(`[系統] 已將【${itemName}】放回背包（強化進度已保留）。`, 'log-fail');
  currentEnchantItem = null;

  updateStatusPanel();
  if (typeof StarForceModule !== 'undefined') {
    StarForceModule.clearEquipState();
  }
  if (typeof HammerModule !== 'undefined') {
    HammerModule.resetState();
  }
  if (typeof SoulWeaponModule !== 'undefined') {
    SoulWeaponModule.resetState();
  }
  if (typeof ScrollModule !== 'undefined') {
    ScrollModule.resetState();
  }
  if (typeof PotentialModule !== 'undefined') {
    PotentialModule.resetState();
  }
  if (typeof AddPotentialModule !== 'undefined') {
    AddPotentialModule.resetState();
  }
  if (typeof BonusStatModule !== 'undefined') {
    BonusStatModule.resetState();
  }
  if (typeof ExceptionalModule !== 'undefined') {
    ExceptionalModule.resetState();
  }
  updateActiveModuleEquip();
  updateNoneWaitEquipVisibility();
  updateCategoryTabStates();
  syncMainPanelIdleState();
  initInventory();
  if (typeof CatValleyEnhanceModule !== 'undefined') {
    CatValleyEnhanceModule.updateButton();
  }
  scheduleEffectTestBarRefresh();
  syncInspectModules();
  if (typeof SessionPersistenceModule !== 'undefined') {
    SessionPersistenceModule.scheduleSave();
  }
}

// ==========================================
// 3. Tab 切換與選單分發控制
// ==========================================

function switchCategoryTab(category, btn) {
  if (PLACEHOLDER_TAB_CATEGORIES.has(category)) return;
  if (category !== 'none' && isCategoryDisabled(category)) return;

  document.querySelectorAll('.ms-tab-btn').forEach(tab => tab.classList.remove('checked'));
  if (btn) btn.classList.add('checked');

  const select = document.getElementById('actionCategory');
  if (select) select.value = category;

  switchCategory();
}

function scheduleIdleWork(fn, timeoutMs = 1500) {
  if (typeof requestIdleCallback === 'function') {
    requestIdleCallback(() => fn(), { timeout: timeoutMs });
  } else {
    setTimeout(fn, 0);
  }
}

const _enchantAssetPreloadCache = new Map();
/** 僅保留已載入 Image 參照，禁止再發新請求 */
const _chromePinHolders = [];

const MAIN_PANEL_BG_BY_CATEGORY = {
  none: 'images/Enchant_none_0.png',
  star: 'images/starforce/Enchant_starForce_0.png',
  hammer: 'images/hammer/hammer.backgrnd.png',
  soulWeapon: 'images/SoulWeapon/soulWeapon_backgrnd.png',
  scroll: 'images/scroll/scroll.backgrnd.png',
  potential: 'images/potential/potential.backgrnd.png',
  additionalPotential: 'images/additionalPotentail/additionalPotential.backgrnd.png',
  bonusStat: 'images/bonusStat/bonusStat_backgrnd.png',
  exceptional: 'images/exceptional/exceptional_backgrnd.png',
};

/** 側邊功能列：normal / mouseOver / pressed / checked / disabled */
const ENCHANT_TAB_BUTTON_PREFIXES = [
  'star',
  'scroll',
  'hammer',
  'soulWeapon',
  'bonusStat',
  'potential',
  'additionalPotential',
  'exceptional',
];

const ENCHANT_TAB_BUTTON_STATES = [
  'normal',
  'mouseOver',
  'pressed',
  'checked',
  'disabled',
];

/** 各分頁待機／道具欄／使用按鈕（不含特效幀、全螢幕彈窗） */
const ENCHANT_UI_CHROME_EXTRAS = [
  'images/common_backgrnd.png',
  'images/none_waitEquip.png',

  // 待機
  'images/starforce/Enchant.img.starForce.layer_waitEquip.png',
  'images/starforce/Enchant.img.starForce.layer_waitEquipMeso.png',
  'images/starforce/Enchant.img.starForce.layer_waitEquipItem.png',
  'images/hammer/hammer.layer_waitEquip.png',
  'images/hammer/hammer.layer_waitEquipItem.png',
  'images/SoulWeapon/soulWeapon_layer_waitEquip.png',
  'images/scroll/scroll.layer_waitEquip0.png',
  'images/scroll/scroll.layer_waitEquip1.png',
  'images/potential/potential.layer_waitEquip.png',
  'images/potential/potential.layer_waitEquip1.png',
  'images/additionalPotentail/layer_waitEquip.png',
  'images/bonusStat/bonusStat_layer_waitEquip.png',
  'images/exceptional/exceptional_layer_waitEquip.png',

  // 星力：花費欄 + 強化按鈕
  'images/starforce/starForce.layer_costMesoBox.png',
  'images/starforce/starForce.layer_costItemBox.png',
  'images/starforce/Enchant_starForce _ button_confirm _ normal_0.png',
  'images/starforce/Enchant_starForce _ button_confirm _ mouseOver_0.png',
  'images/starforce/Enchant_starForce _ button_confirm _ pressed_0.png',
  'images/starforce/Enchant_starForce _ button_confirm _ disabled_0.png',

  // 黃金錘：道具欄 + 強化按鈕
  'images/hammer/hammer.layer_costInvenBox.png',
  'images/hammer/hammer.costInven.selected.png',
  'images/hammer/hammer.button_confirm.normal.0.png',
  'images/hammer/hammer.button_confirm.mouseOver.0.png',
  'images/hammer/hammer.button_confirm.pressed.0.png',
  'images/hammer/hammer.button_confirm.disabled.0.png',

  // 靈魂武器：道具欄 + 使用按鈕
  'images/SoulWeapon/soulWeapon_layer_costInvenBox.png',
  'images/SoulWeapon/soulWeapon_button_confirmEnchanter_normal_0.png',
  'images/SoulWeapon/soulWeapon_button_confirmEnchanter_mouseOver_0.png',
  'images/SoulWeapon/soulWeapon_button_confirmEnchanter_pressed_0.png',
  'images/SoulWeapon/soulWeapon_button_confirmEnchanter_disabled_0.png',
  'images/SoulWeapon/soulWeapon_button_confirmSoul_normal_0.png',
  'images/SoulWeapon/soulWeapon_button_confirmSoul_mouseOver_0.png',
  'images/SoulWeapon/soulWeapon_button_confirmSoul_pressed_0.png',
  'images/SoulWeapon/soulWeapon_button_confirmSoul_disabled_0.png',

  // 卷軸：道具欄 + 強化按鈕
  'images/scroll/scroll.costScroll.layer_costScrollBox.png',
  'images/scroll/scroll.costTrace.layer_costTraceBox.png',
  'images/scroll/scroll.costScroll.inven.selected.png',
  'images/scroll/scroll.button_confirm.normal.0.png',
  'images/scroll/scroll.button_confirm.mouseOver.0.png',
  'images/scroll/scroll.button_confirm.pressed.0.png',
  'images/scroll/scroll.button_confirm.disabled.0.png',

  // 潛能／附加潛能：方塊欄 + 使用按鈕
  'images/potential/potential.costItem.layer_costItemBox.png',
  'images/additionalPotentail/additionalPotential.layer_costMeso100.png',
  'images/potential/potential.button_confirm.normal.0.png',
  'images/potential/potential.button_confirm.mouseOver.0.png',
  'images/potential/potential.button_confirm.pressed.0.png',
  'images/potential/potential.button_confirm.disabled.0.png',

  // 追加屬性：花費欄 + 使用按鈕
  'images/bonusStat/bonusStat_costMeso_layer_costMesoBox.png',
  'images/bonusStat/bonusStat_costItem_layer_costItemBox.png',
  'images/bonusStat/bonusStat_costItem_inven_selected.png',
  'images/bonusStat/bonusStat_button_confirm_normal_0.png',
  'images/bonusStat/bonusStat_button_confirm_mouseOver_0.png',
  'images/bonusStat/bonusStat_button_confirm_pressed_0.png',
  'images/bonusStat/bonusStat_button_confirm_disabled_0.png',
  'images/bonusStat/bonusStat_button_confirm1_normal_0.png',
  'images/bonusStat/bonusStat_button_confirm1_mouseOver_0.png',
  'images/bonusStat/bonusStat_button_confirm1_pressed_0.png',
  'images/bonusStat/bonusStat_button_confirm1_disabled_0.png',
  'images/bonusStat/bonusStat_button_confirm3_normal_0.png',
  'images/bonusStat/bonusStat_button_confirm3_mouseOver_0.png',
  'images/bonusStat/bonusStat_button_confirm3_pressed_0.png',
  'images/bonusStat/bonusStat_button_confirm3_disabled_0.png',

  // 卓越強化：花費欄 + 強化按鈕
  'images/exceptional/exceptional_tabEnchant_layer_costEnchantBox.png',
  'images/exceptional/exceptional_tabEnchant_button_enchant_normal_0.png',
  'images/exceptional/exceptional_tabEnchant_button_enchant_mouseOver_0.png',
  'images/exceptional/exceptional_tabEnchant_button_enchant_pressed_0.png',
  'images/exceptional/exceptional_tabEnchant_button_enchant_disabled_0.png',

  // 裝備欄 UIEquip：外殼／畫布／頁籤／預設按鈕／欄位底圖
  'images/UIEquip/main/main_backgrnd.png',
  'images/UIEquip/EquipTab/EquipTab.canvas_equip.png',
  'images/UIEquip/main/tab_detailTab/main_tab_detailTab_selected_0.png',
  'images/UIEquip/main/tab_detailTab/main_tab_detailTab_normal_1.png',
  'images/UIEquip/EquipTab/presetSelected/presetSelected.0.png',
  'images/UIEquip/EquipTab/button_preset1/button_preset1_normal_0.png',
  'images/UIEquip/EquipTab/button_preset1/button_preset1_mouseOver_0.png',
  'images/UIEquip/EquipTab/button_preset1/button_preset1_pressed_0.png',
  'images/UIEquip/EquipTab/button_preset1/button_preset1_checked_0.png',
  'images/UIEquip/EquipTab/button_preset2/button_preset2_normal_0.png',
  'images/UIEquip/EquipTab/button_preset2/button_preset2_mouseOver_0.png',
  'images/UIEquip/EquipTab/button_preset2/button_preset2_pressed_0.png',
  'images/UIEquip/EquipTab/button_preset2/button_preset2_checked_0.png',
  'images/UIEquip/EquipTab/button_preset3/button_preset3_normal_0.png',
  'images/UIEquip/EquipTab/button_preset3/button_preset3_mouseOver_0.png',
  'images/UIEquip/EquipTab/button_preset3/button_preset3_pressed_0.png',
  'images/UIEquip/EquipTab/button_preset3/button_preset3_checked_0.png',
  'images/UIEquip/EquipTab/button_presetApplication/button_presetApplication_normal_0.png',
  'images/UIEquip/EquipTab/button_presetApplication/button_presetApplication_mouseOver_0.png',
  'images/UIEquip/EquipTab/button_presetApplication/button_presetApplication_pressed_0.png',
  'images/UIEquip/EquipTab/SlotName/SlotName_1.png',
  'images/UIEquip/EquipTab/SlotName/SlotName_2.png',
  'images/UIEquip/EquipTab/SlotName/SlotName_3.png',
  'images/UIEquip/EquipTab/SlotName/SlotName_4.png',
  'images/UIEquip/EquipTab/SlotName/SlotName_5.png',
  'images/UIEquip/EquipTab/SlotName/SlotName_6.png',
  'images/UIEquip/EquipTab/SlotName/SlotName_7.png',
  'images/UIEquip/EquipTab/SlotName/SlotName_8.png',
  'images/UIEquip/EquipTab/SlotName/SlotName_9.png',
  'images/UIEquip/EquipTab/SlotName/SlotName_10.png',
  'images/UIEquip/EquipTab/SlotName/SlotName_11.png',
  'images/UIEquip/EquipTab/SlotName/SlotName_12.png',
  'images/UIEquip/EquipTab/SlotName/SlotName_17.png',
  'images/UIEquip/EquipTab/SlotName/SlotName_21.png',
  'images/UIEquip/EquipTab/SlotName/SlotName_22.png',
  'images/UIEquip/EquipTab/SlotName/SlotName_28.png',
  'images/UIEquip/EquipTab/SlotName/SlotName_31.png',
  'images/UIEquip/EquipTab/SlotName/SlotName_32.png',
  'images/UIEquip/EquipTab/SlotName/SlotName_33.png',
  'images/UIEquip/EquipTab/SlotName/SlotName_34.png',
  'images/UIEquip/EquipTab/SlotName/SlotName_35.png',
];

function collectEssentialEnchantChromeUrls() {
  const urls = [];

  Object.values(MAIN_PANEL_BG_BY_CATEGORY).forEach((src) => urls.push(src));
  ENCHANT_UI_CHROME_EXTRAS.forEach((src) => urls.push(src));

  ENCHANT_TAB_BUTTON_PREFIXES.forEach((prefix) => {
    ENCHANT_TAB_BUTTON_STATES.forEach((state) => {
      urls.push(`images/tabbutton/${prefix}_tab_${state}.png`);
    });
  });

  return [...new Set(urls.filter(Boolean))];
}

function ensureMainPanelBgStack() {
  const mainPanel = document.getElementById('mainContentPanel');
  const stack = document.getElementById('mainPanelBgStack');
  if (!mainPanel || !stack) return;

  if (!stack.dataset.ready) {
    Object.entries(MAIN_PANEL_BG_BY_CATEGORY).forEach(([cat, src]) => {
      const layer = document.createElement('div');
      layer.className = 'ms-main-bg-layer';
      layer.dataset.cat = cat;
      // 先掛好各分頁 backgrnd，切頁只切 is-active，不再臨時換圖
      if (src) layer.style.backgroundImage = `url("${src}")`;
      stack.appendChild(layer);
    });
    stack.dataset.ready = '1';
  }

  mainPanel.classList.add('has-bg-stack');
  setMainPanelBgCategory(
    typeof getActiveCategory === 'function' ? getActiveCategory() : 'none'
  );
}

function setMainPanelBgCategory(category) {
  const stack = document.getElementById('mainPanelBgStack');
  if (!stack) return;
  const cat = MAIN_PANEL_BG_BY_CATEGORY[category] ? category : 'none';
  stack.querySelectorAll('.ms-main-bg-layer').forEach((layer) => {
    const src = MAIN_PANEL_BG_BY_CATEGORY[layer.dataset.cat];
    if (src && !layer.style.backgroundImage) {
      layer.style.backgroundImage = `url("${src}")`;
    }
    layer.classList.toggle('is-active', layer.dataset.cat === cat);
  });
}

/** 只釘住 preload 已完成的 Image，不另外 new Image / 不發網路請求 */
function pinChromeImagesFromCache() {
  _enchantAssetPreloadCache.forEach((promise) => {
    if (!promise || typeof promise.then !== 'function') return;
    promise.then((img) => {
      if (img && !_chromePinHolders.includes(img)) {
        _chromePinHolders.push(img);
      }
    }).catch(() => {});
  });
}

function setControlSubpanelsParked(activeCategory) {
  document.querySelectorAll('.ms-control-subpanel').forEach((panel) => {
    panel.classList.remove('hidden');
    const isActive = Boolean(
      activeCategory
      && activeCategory !== 'none'
      && panel.id === `panel-${activeCategory}`
    );
    panel.classList.toggle('is-parked', !isActive);
    if (isActive) {
      panel.removeAttribute('inert');
      panel.setAttribute('aria-hidden', 'false');
    } else {
      panel.setAttribute('inert', '');
      panel.setAttribute('aria-hidden', 'true');
    }
  });
}

function normalizePreloadUrl(url) {
  if (!url || typeof url !== 'string') return null;
  let next = url.trim();
  if (!next || next.startsWith('data:') || next.startsWith('blob:')) return null;
  if (next.startsWith('url(')) {
    next = next.slice(4, -1).trim().replace(/^['"]|['"]$/g, '');
  }
  if (next.startsWith('../')) next = next.replace(/^\.\.\//, '');
  try {
    return new URL(next, window.location.href).href;
  } catch (_) {
    return null;
  }
}

function preloadEnchantAsset(url) {
  const absolute = normalizePreloadUrl(url);
  if (!absolute) return Promise.resolve(null);

  // 相對路徑同步進特效共用快取，但共用同一個 Promise／請求，避免同一檔打兩次
  const relativeKey = (url && !/^https?:\/\//i.test(url) && !url.startsWith('data:'))
    ? String(url)
    : null;
  if (relativeKey && typeof EnchantImagePreload !== 'undefined') {
    const shared = EnchantImagePreload.preload(relativeKey);
    _enchantAssetPreloadCache.set(absolute, shared);
    return shared;
  }

  if (_enchantAssetPreloadCache.has(absolute)) {
    return _enchantAssetPreloadCache.get(absolute);
  }
  const p = new Promise((resolve) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => {
      if (typeof img.decode === 'function') {
        img.decode().then(() => resolve(img)).catch(() => resolve(img));
      } else {
        resolve(img);
      }
    };
    img.onerror = () => resolve(null);
    img.src = absolute;
  });
  _enchantAssetPreloadCache.set(absolute, p);
  return p;
}

function collectStylesheetImageUrls() {
  const urls = new Set();
  const urlRe = /url\(\s*(['"]?)([^'")]+)\1\s*\)/gi;

  const harvestText = (text) => {
    if (!text) return;
    let match;
    urlRe.lastIndex = 0;
    while ((match = urlRe.exec(text))) {
      const raw = match[2];
      if (!raw || !/images\//i.test(raw)) continue;
      urls.add(raw);
    }
  };

  Array.from(document.styleSheets || []).forEach((sheet) => {
    let rules;
    try {
      rules = sheet.cssRules;
    } catch (_) {
      // 跨網域 stylesheet 無法讀取；略過 CDN
      return;
    }
    Array.from(rules || []).forEach((rule) => {
      if (rule.style) {
        ['backgroundImage', 'background', 'listStyleImage', 'borderImageSource', 'maskImage'].forEach((prop) => {
          harvestText(rule.style[prop]);
        });
      }
      if (rule.cssText) harvestText(rule.cssText);
    });
  });

  return [...urls];
}

function collectDomImageUrls() {
  const urls = new Set();
  document.querySelectorAll('img[src]').forEach((img) => {
    if (img.getAttribute('src')) urls.add(img.getAttribute('src'));
  });
  document.querySelectorAll('[style*="url("]').forEach((el) => {
    const style = el.getAttribute('style') || '';
    const match = style.match(/url\(\s*(['"]?)([^'")]+)\1\s*\)/i);
    if (match?.[2]) urls.add(match[2]);
  });
  return [...urls];
}

function collectDatabaseIconUrls() {
  const urls = new Set();

  const addIcon = (value) => {
    if (typeof value === 'string' && /images\//i.test(value)) urls.add(value);
  };

  if (typeof SCROLL_DATABASE !== 'undefined') {
    Object.values(SCROLL_DATABASE).forEach((scroll) => addIcon(scroll?.icon));
  }
  if (typeof RECOVERY_CARD !== 'undefined') addIcon(RECOVERY_CARD?.icon);
  if (typeof POTENTIAL_CUBE_TYPES !== 'undefined') {
    POTENTIAL_CUBE_TYPES.forEach((cube) => addIcon(cube?.icon));
  }
  if (typeof ADDPOT_CUBE_TYPES !== 'undefined') {
    ADDPOT_CUBE_TYPES.forEach((cube) => addIcon(cube?.icon));
  }
  if (typeof ADDPOT_IMAGES !== 'undefined') {
    Object.values(ADDPOT_IMAGES).forEach(addIcon);
  }
  if (typeof ITEM_DATABASE !== 'undefined') {
    Object.values(ITEM_DATABASE).forEach((item) => addIcon(item?.icon));
  }

  return [...urls];
}

function warmEnchantPanelsForCssBackgrounds() {
  const mainPanel = document.getElementById('mainContentPanel');
  const panels = Array.from(document.querySelectorAll('.ms-control-subpanel'));
  const activeClasses = [
    'starforce-active',
    'hammer-active',
    'soulWeapon-active',
    'scroll-active',
    'potential-active',
    'additionalPotential-active',
    'bonusStat-active',
    'exceptional-active',
    'none-active',
    'none-idle',
    'starforce-idle',
    'hammer-idle',
    'soulWeapon-idle',
    'scroll-idle',
    'potential-idle',
    'additionalPotential-idle',
    'bonusStat-idle',
    'exceptional-idle',
  ];

  const prevMain = activeClasses.map((cls) => mainPanel?.classList.contains(cls));

  // 短暫解除停靠，強制瀏覽器把各分頁 CSS 底圖解碼進記憶體
  panels.forEach((panel) => {
    panel.classList.remove('hidden', 'is-parked');
    panel.removeAttribute('inert');
    panel.style.left = '-10000px';
    panel.style.pointerEvents = 'none';
  });

  if (mainPanel) {
    activeClasses.forEach((cls) => mainPanel.classList.add(cls));
  }

  // 觸發一次 layout / paint
  void document.body.offsetHeight;

  return () => {
    panels.forEach((panel) => {
      panel.style.left = '';
      panel.style.pointerEvents = '';
    });
    // 呼叫端會再 setControlSubpanelsParked；此處先全部停靠以免閃現
    panels.forEach((panel) => {
      panel.classList.add('is-parked');
      panel.setAttribute('inert', '');
      panel.setAttribute('aria-hidden', 'true');
      panel.classList.remove('hidden');
    });
    if (mainPanel) {
      activeClasses.forEach((cls, index) => {
        mainPanel.classList.toggle(cls, Boolean(prevMain[index]));
      });
    }
  };
}

function updateEnchantBootProgress(done, total, statusText) {
  const statusEl = document.getElementById('enchantBootStatus');
  const fillEl = document.getElementById('enchantBootBarFill');
  const progressEl = document.getElementById('enchantBootProgress');
  const pct = total > 0 ? Math.min(100, Math.round((done / total) * 100)) : 100;
  if (statusEl && statusText) statusEl.textContent = statusText;
  if (fillEl) fillEl.style.width = `${pct}%`;
  if (progressEl) progressEl.textContent = `${pct}%（${done}/${total}）`;
}

async function preloadUrlBatch(urls, {
  concurrency = 4,
  onProgress = null,
  statusText = '正在載入介面素材…',
} = {}) {
  const list = [...new Set(urls.map(normalizePreloadUrl).filter(Boolean))];
  let done = 0;
  const total = list.length;
  if (onProgress) onProgress(done, total, statusText);
  if (!total) return;

  let cursor = 0;
  const workers = Array.from({ length: Math.min(concurrency, total) }, async () => {
    while (cursor < list.length) {
      const index = cursor;
      cursor += 1;
      await preloadEnchantAsset(list[index]);
      done += 1;
      if (onProgress) onProgress(done, total, statusText);
    }
  });
  await Promise.all(workers);
}

async function finishEnchantBootOverlay() {
  const overlay = document.getElementById('enchantBootOverlay');
  document.body.classList.remove('enchant-boot-loading');
  if (!overlay) return;
  overlay.classList.add('is-done');
  overlay.setAttribute('aria-busy', 'false');
  window.setTimeout(() => overlay.remove(), 320);
}

function isInfoCardOpen() {
  const overlay = document.getElementById('msInfoCardOverlay');
  return Boolean(overlay && !overlay.classList.contains('hidden'));
}

function closeInfoCard() {
  const overlay = document.getElementById('msInfoCardOverlay');
  if (!overlay || overlay.classList.contains('hidden')) return;

  overlay.classList.add('hidden');
  overlay.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('ms-info-card-open');

  if (overlay._msInfoCardCloseHandler) {
    const btn = document.getElementById('msInfoCardCloseBtn');
    btn?.removeEventListener('click', overlay._msInfoCardCloseHandler);
    overlay._msInfoCardCloseHandler = null;
  }
}

function showInfoCard() {
  const overlay = document.getElementById('msInfoCardOverlay');
  const closeBtn = document.getElementById('msInfoCardCloseBtn');
  if (!overlay || !closeBtn || isInfoCardOpen()) return;

  overlay.classList.remove('hidden');
  overlay.setAttribute('aria-hidden', 'false');
  document.body.classList.add('ms-info-card-open');

  const onClose = (event) => {
    event.preventDefault();
    event.stopPropagation();
    closeInfoCard();
  };

  overlay._msInfoCardCloseHandler = onClose;
  closeBtn.addEventListener('click', onClose);
  closeBtn.focus?.();
}

async function finishBootAndShowInfoCard() {
  await finishEnchantBootOverlay();
  // 等載入層淡出後再顯示說明卡
  window.setTimeout(() => {
    showInfoCard();
  }, 280);
}

/** 依強化分頁預載對應特效（切頁優先；不阻擋 UI） */
let _categoryEffectWarmGen = 0;
let _idleAllEffectsWarmStarted = false;

function collectDeepImageUrls(value, out = []) {
  if (!value) return out;
  if (typeof value === 'string') {
    if (/images\//i.test(value) && /\.(png|jpe?g|gif|webp)(?:$|\?)/i.test(value)) {
      out.push(value);
    }
    return out;
  }
  if (Array.isArray(value)) {
    value.forEach((item) => collectDeepImageUrls(item, out));
    return out;
  }
  if (typeof value === 'object') {
    Object.values(value).forEach((item) => collectDeepImageUrls(item, out));
  }
  return out;
}

async function warmAutoEnchantConfig(cfg) {
  if (!cfg) return;
  const urls = collectDeepImageUrls(cfg);
  if (!urls.length) return;
  await preloadUrlBatch(urls, { concurrency: 3 });
}

async function warmEffectsForCategory(category) {
  if (!category || category === 'none') return;

  const tasks = [];

  if (category === 'star') {
    if (typeof StarForceEffectModule !== 'undefined') {
      tasks.push(StarForceEffectModule.preloadAssets?.());
    }
    if (typeof AUTO_ENCHANT_STAR_FORCE !== 'undefined') {
      tasks.push(warmAutoEnchantConfig(AUTO_ENCHANT_STAR_FORCE));
    }
  } else if (category === 'hammer') {
    if (typeof HammerEffectModule !== 'undefined') {
      tasks.push(HammerEffectModule.preloadAssets?.());
    }
  } else if (category === 'soulWeapon') {
    if (typeof SoulWeaponEffectModule !== 'undefined') {
      tasks.push(SoulWeaponEffectModule.preloadAssets?.());
    }
  } else if (category === 'scroll') {
    if (typeof ScrollEffectModule !== 'undefined') {
      tasks.push(ScrollEffectModule.preloadAssets?.());
    }
  } else if (category === 'potential') {
    if (typeof PotentialEffectModule !== 'undefined' && typeof POTENTIAL_EFFECT_BY_RANK !== 'undefined') {
      const ranks = Object.keys(POTENTIAL_EFFECT_BY_RANK);
      ranks.forEach((rankId) => {
        tasks.push(PotentialEffectModule.preloadRankAssets?.(rankId));
      });
    }
    if (typeof PotentialMemoriaChoiceEffectModule !== 'undefined') {
      tasks.push(PotentialMemoriaChoiceEffectModule.preloadAll?.());
    }
    if (typeof AUTO_ENCHANT_POTENTIAL !== 'undefined') {
      tasks.push(warmAutoEnchantConfig(AUTO_ENCHANT_POTENTIAL));
    }
  } else if (category === 'additionalPotential') {
    // 附加潛能特效與主潛共用 PotentialEffectModule 資源時，仍暖翻牌／自動面板
    if (typeof PotentialEffectModule !== 'undefined' && typeof POTENTIAL_EFFECT_BY_RANK !== 'undefined') {
      const ranks = Object.keys(POTENTIAL_EFFECT_BY_RANK);
      ranks.forEach((rankId) => {
        tasks.push(PotentialEffectModule.preloadRankAssets?.(rankId));
      });
    }
    if (typeof AddPotentialMemoriaChoiceEffectModule !== 'undefined') {
      tasks.push(AddPotentialMemoriaChoiceEffectModule.preloadAll?.());
    }
    if (typeof AUTO_ENCHANT_ADD_POTENTIAL !== 'undefined') {
      tasks.push(warmAutoEnchantConfig(AUTO_ENCHANT_ADD_POTENTIAL));
    }
  } else if (category === 'bonusStat') {
    if (typeof BonusStatEffectModule !== 'undefined' && typeof BONUS_STAT_EFFECT !== 'undefined') {
      const variants = Object.keys(BONUS_STAT_EFFECT.variants || {});
      variants.forEach((variant) => {
        tasks.push(BonusStatEffectModule.preloadVariantAssets?.(variant));
      });
    }
    if (typeof BonusStatChoiceEffectModule !== 'undefined') {
      tasks.push(BonusStatChoiceEffectModule.preloadAll?.());
    }
    if (typeof AUTO_ENCHANT_BONUS_STAT !== 'undefined') {
      tasks.push(warmAutoEnchantConfig(AUTO_ENCHANT_BONUS_STAT));
    }
  } else if (category === 'exceptional') {
    if (typeof ExceptionalEffectModule !== 'undefined') {
      tasks.push(ExceptionalEffectModule.preloadAssets?.());
    }
  }

  const jobs = tasks.filter((t) => t && typeof t.then === 'function');
  // 同時間最多 2 個暖機任務，避免分頁特效一次打爆 GitHub Pages
  const limit = 2;
  let cursor = 0;
  const workers = Array.from({ length: Math.min(limit, jobs.length) }, async () => {
    while (cursor < jobs.length) {
      const index = cursor;
      cursor += 1;
      await jobs[index];
    }
  });
  await Promise.all(workers);
}

function scheduleIdleBackgroundEffectWarm() {
  // GitHub Pages rate limit：禁止開機後自動掃全特效幀
  return;
}

function scheduleCategoryEffectWarm(category) {
  // 不在切頁時預載特效幀（潛能等分頁幀數極多，GitHub Pages 易 429）。
  // 各 EffectModule 播放前仍會自行 preload 該段幀。
  scheduleEffectTestBarRefresh();
}

async function runEnchantBootPreload() {
  updateEnchantBootProgress(0, 1, '正在載入介面素材…');

  ensureMainPanelBgStack();
  setControlSubpanelsParked(
    typeof getActiveCategory === 'function' ? getActiveCategory() : 'none'
  );
  setMainPanelBgCategory(
    typeof getActiveCategory === 'function' ? getActiveCategory() : 'none'
  );

  // 精準預載：各分頁 backgrnd + 側邊功能列五態 + 待機圖（不掃全 CSS，避免 429）
  const chromeUrls = collectEssentialEnchantChromeUrls();
  const chromeUniqueCount = new Set(chromeUrls.map(normalizePreloadUrl).filter(Boolean)).size;
  const chromeTotal = Math.max(1, chromeUniqueCount);

  updateEnchantBootProgress(0, chromeTotal, '正在載入介面素材…');

  await preloadUrlBatch(chromeUrls, {
    concurrency: 3,
    onProgress: (batchDone) => {
      updateEnchantBootProgress(
        batchDone,
        chromeTotal,
        `正在載入介面素材…（${batchDone}/${chromeUniqueCount}）`
      );
    },
    statusText: '正在載入介面素材…',
  });

  pinChromeImagesFromCache();

  updateEnchantBootProgress(chromeTotal, chromeTotal, '介面載入完成');
  await finishBootAndShowInfoCard();

  refreshEffectTestBars();
}

/**
 * 收集所有強化特效／翻牌預載任務，並提供完成後標記。
 * @returns {{ urls: string[], jobs: Array<{ url: string, preloadOne: Function }>, markDone: Function }}
 */
function collectAllEffectPreloadPlan() {
  const jobs = [];
  const seen = new Set();
  const markFns = [];

  const safeUrls = (fn) => {
    try {
      const result = fn();
      return Array.isArray(result) ? result.filter(Boolean) : [];
    } catch (_) {
      return [];
    }
  };

  const addJob = (url, preloadOne) => {
    if (!url || typeof preloadOne !== 'function') return;
    const key = String(url);
    if (seen.has(key)) return;
    seen.add(key);
    jobs.push({ url: key, preloadOne });
  };

  const addModuleUrls = (mod, urls, onDone) => {
    if (!mod || typeof mod.preloadOne !== 'function') return;
    (urls || []).forEach((url) => addJob(url, (u) => mod.preloadOne(u)));
    if (typeof onDone === 'function') markFns.push(onDone);
  };

  const collectDeepImageUrlsLocal = (value, out = []) => collectDeepImageUrls(value, out);

  // 自動強化面板素材
  [
    typeof AUTO_ENCHANT_STAR_FORCE !== 'undefined' ? AUTO_ENCHANT_STAR_FORCE : null,
    typeof AUTO_ENCHANT_POTENTIAL !== 'undefined' ? AUTO_ENCHANT_POTENTIAL : null,
    typeof AUTO_ENCHANT_ADD_POTENTIAL !== 'undefined' ? AUTO_ENCHANT_ADD_POTENTIAL : null,
    typeof AUTO_ENCHANT_BONUS_STAT !== 'undefined' ? AUTO_ENCHANT_BONUS_STAT : null,
  ].forEach((cfg) => {
    collectDeepImageUrlsLocal(cfg).forEach((url) => {
      addJob(url, (u) => preloadEnchantAsset(u));
    });
  });

  // 星力
  if (typeof StarForceEffectModule !== 'undefined' && typeof STARFORCE_EFFECT !== 'undefined') {
    const mod = StarForceEffectModule;
    const urls = safeUrls(() => [
      ...mod.collectSpecUrls('try', STARFORCE_EFFECT.try, false),
      ...mod.collectSpecUrls('success', STARFORCE_EFFECT.success, true),
      ...mod.collectSpecUrls('fail', STARFORCE_EFFECT.fail, true),
    ]);
    addModuleUrls(mod, urls, () => { mod._preloadDone = true; });
  }

  // 卷軸
  if (typeof ScrollEffectModule !== 'undefined' && typeof SCROLL_EFFECT !== 'undefined') {
    const mod = ScrollEffectModule;
    const urls = safeUrls(() => [
      ...mod.collectSpecUrls('try', null, SCROLL_EFFECT.try, false),
      ...mod.collectSpecUrls('success', 0, SCROLL_EFFECT.success?.['0'], true),
      ...mod.collectSpecUrls('success', 1, mod.getSpec?.('success', 1), true),
      ...mod.collectSpecUrls('fail', null, SCROLL_EFFECT.fail, true),
    ]);
    addModuleUrls(mod, urls, () => { mod._preloadDone = true; });
  }

  // 鐵鎚
  if (typeof HammerEffectModule !== 'undefined' && typeof HAMMER_EFFECT !== 'undefined') {
    const mod = HammerEffectModule;
    const successKey = mod.SUCCESS_VARIANT ?? 0;
    const successSpec = HAMMER_EFFECT.success?.[successKey]
      || HAMMER_EFFECT.success?.['0']
      || Object.values(HAMMER_EFFECT.success || {})[0];
    const urls = safeUrls(() => [
      ...mod.collectSpecUrls('try', null, HAMMER_EFFECT.try, false),
      ...(successSpec ? mod.collectSpecUrls('success', successKey, successSpec, true) : []),
      ...mod.collectSpecUrls('fail', null, HAMMER_EFFECT.fail, true),
    ]);
    addModuleUrls(mod, urls, () => { mod._preloadDone = true; });
  }

  // 靈魂武器
  if (typeof SoulWeaponEffectModule !== 'undefined') {
    const mod = SoulWeaponEffectModule;
    const urls = safeUrls(() => [
      ...mod.collectSpecUrls('enchanter', 'try', mod.getSpec?.('enchanter', 'try'), false),
      ...mod.collectSpecUrls('enchanter', 'success', mod.getSpec?.('enchanter', 'success'), true),
      ...mod.collectSpecUrls('enchanter', 'fail', mod.getSpec?.('enchanter', 'fail'), true),
      ...mod.collectSpecUrls('soul', 'normal', mod.getSpec?.('soul', 'normal'), true),
      ...mod.collectSpecUrls('soul', 'magnificent', mod.getSpec?.('soul', 'magnificent'), true),
      ...mod.collectSpecUrls('soul', 'fail', mod.getSpec?.('soul', 'fail'), true),
    ]);
    addModuleUrls(mod, urls, () => { mod._preloadDone = true; });
  }

  // 卓越
  if (typeof ExceptionalEffectModule !== 'undefined') {
    const mod = ExceptionalEffectModule;
    const urls = safeUrls(() => [
      ...mod.collectSpecUrls('enchant', 'try', mod.getSpec?.('enchant', 'try', 0), false, 0),
      ...mod.collectSpecUrls('enchant', 'try', mod.getSpec?.('enchant', 'try', 1), false, 1),
      ...mod.collectSpecUrls('enchant', 'success', mod.getSpec?.('enchant', 'success'), true),
      ...mod.collectSpecUrls('enchant', 'fail', mod.getSpec?.('enchant', 'fail'), true),
      ...mod.collectSpecUrls('extract', 'normal', mod.getSpec?.('extract', 'normal'), true),
    ]);
    addModuleUrls(mod, urls, () => { mod._preloadDone = true; });
  }

  // 潛能（四階全部）
  if (typeof PotentialEffectModule !== 'undefined' && typeof POTENTIAL_EFFECT_BY_RANK !== 'undefined') {
    const mod = PotentialEffectModule;
    const ranks = Object.keys(POTENTIAL_EFFECT_BY_RANK);
    ranks.forEach((rankId) => {
      const data = mod.getRankData?.(rankId);
      if (!data) return;
      const trySpec = data.try;
      const spec1 = mod.getSuccessSpec?.(rankId, 1);
      const spec2 = mod.getSuccessSpec?.(rankId, 2);
      const urls = safeUrls(() => {
        const list = [];
        if (trySpec) list.push(...mod.collectSpecUrls(rankId, 'try', null, trySpec, false));
        if (spec1) list.push(...mod.collectSpecUrls(rankId, 'success', 1, spec1, true));
        if (data.hasRankUpSuccess && spec2) {
          list.push(...mod.collectSpecUrls(rankId, 'success', 2, spec2, true));
        }
        return list;
      });
      addModuleUrls(mod, urls, null);
    });
    markFns.push(() => {
      ranks.forEach((rankId) => mod._preloadDone?.add?.(rankId));
    });
  }

  // 附加能力／星火（全部 variant）
  if (typeof BonusStatEffectModule !== 'undefined' && typeof BONUS_STAT_EFFECT !== 'undefined') {
    const mod = BonusStatEffectModule;
    const variants = Object.keys(BONUS_STAT_EFFECT.variants || {});
    variants.forEach((variant) => {
      const entry = BONUS_STAT_EFFECT.variants[variant];
      if (!entry) return;
      const urls = safeUrls(() => {
        const list = [];
        if (entry.try) list.push(...mod.collectSpecUrls(variant, 'try', null, entry.try, false));
        if (entry.success?.['0']) {
          list.push(...mod.collectSpecUrls(variant, 'success', 0, entry.success['0'], true));
        }
        if (entry.success?.['1']) {
          list.push(...mod.collectSpecUrls(variant, 'success', 1, entry.success['1'], true));
        }
        return list;
      });
      addModuleUrls(mod, urls, null);
    });
    markFns.push(() => {
      variants.forEach((variant) => mod._preloadDone?.add?.(variant));
    });
  }

  // 恢復方塊翻牌（主潛能 + 附加潛能）
  const memoriaMods = [];
  if (typeof PotentialMemoriaChoiceEffectModule !== 'undefined') {
    memoriaMods.push(PotentialMemoriaChoiceEffectModule);
  }
  if (typeof AddPotentialMemoriaChoiceEffectModule !== 'undefined') {
    memoriaMods.push(AddPotentialMemoriaChoiceEffectModule);
  }
  memoriaMods.forEach((mod) => {
    const urls = safeUrls(() => {
      const list = [...(mod.collectPreloadUrls?.() || [])];
      const rankUp = mod.getSpec?.()?.rankUp || {};
      Object.keys(rankUp).forEach((rankId) => {
        list.push(...(mod.collectRankUpPreloadUrls?.(rankId) || []));
      });
      return list;
    });
    addModuleUrls(mod, urls, () => { mod._preloadDone = true; });
  });

  // 暗黑輪迴星火 BEFORE/AFTER 翻牌
  if (typeof BonusStatChoiceEffectModule !== 'undefined') {
    const mod = BonusStatChoiceEffectModule;
    addModuleUrls(mod, safeUrls(() => mod.collectPreloadUrls?.() || []), () => {
      mod._preloadDone = true;
    });
  }

  return {
    urls: jobs.map((job) => job.url),
    jobs,
    markDone() {
      markFns.forEach((fn) => {
        try { fn(); } catch (_) { /* ignore */ }
      });
    },
  };
}

async function preloadEffectJobs(jobs, { concurrency = 2, onProgress = null } = {}) {
  const list = Array.isArray(jobs) ? jobs : [];
  let done = 0;
  const total = list.length;
  if (onProgress) onProgress(done, total);
  if (!total) return;

  let cursor = 0;
  const workers = Array.from({ length: Math.min(concurrency, total) }, async () => {
    while (cursor < list.length) {
      const index = cursor;
      cursor += 1;
      const job = list[index];
      try {
        // 同步寫入各特效模組快取；同時進共用快取
        await Promise.all([
          preloadEnchantAsset(job.url),
          Promise.resolve(job.preloadOne(job.url)),
        ]);
      } catch (_) {
        /* ignore single asset failures */
      }
      done += 1;
      if (onProgress) onProgress(done, total);
    }
  });
  await Promise.all(workers);
}

function refreshEffectTestBars() {
  if (typeof PotentialEffectModule !== 'undefined') {
    PotentialEffectModule.updateTestBarVisible();
  }
  if (typeof ScrollEffectModule !== 'undefined') {
    ScrollEffectModule.updateTestBarVisible();
  }
  if (typeof HammerEffectModule !== 'undefined') {
    HammerEffectModule.updateTestBarVisible();
  }
  if (typeof SoulWeaponEffectModule !== 'undefined') {
    SoulWeaponEffectModule.updateTestBarVisible();
  }
  if (typeof StarForceEffectModule !== 'undefined') {
    StarForceEffectModule.updateTestBarVisible();
  }
  if (typeof BonusStatEffectModule !== 'undefined') {
    BonusStatEffectModule.updateTestBarVisible();
  }
  if (typeof ExceptionalEffectModule !== 'undefined') {
    ExceptionalEffectModule.updateTestBarVisible();
  }
}

function scheduleEffectTestBarRefresh() {
  scheduleIdleWork(refreshEffectTestBars, 1200);
}

function switchCategory() {
  const activeCat = getActiveCategory();

  if (typeof aeCloseAllAutoEnchantOverlays === 'function') {
    aeCloseAllAutoEnchantOverlays();
  }

  if (typeof EquipTooltipModule !== 'undefined') {
    EquipTooltipModule.hide();
  }

  if (
    activeCat !== 'star'
    && typeof StarForceModule !== 'undefined'
    && StarForceModule.selectedScrollId
  ) {
    StarForceModule.clearSelectedScroll();
  }

  const mainPanel = document.getElementById('mainContentPanel');

  setControlSubpanelsParked(activeCat);
  setMainPanelBgCategory(activeCat);

  if (mainPanel) {
    mainPanel.classList.toggle('starforce-active', activeCat === 'star');
    mainPanel.classList.toggle('hammer-active', activeCat === 'hammer');
    mainPanel.classList.toggle('soulWeapon-active', activeCat === 'soulWeapon');
    mainPanel.classList.toggle('scroll-active', activeCat === 'scroll');
    mainPanel.classList.toggle('potential-active', activeCat === 'potential');
    mainPanel.classList.toggle('additionalPotential-active', activeCat === 'additionalPotential');
    mainPanel.classList.toggle('bonusStat-active', activeCat === 'bonusStat');
    mainPanel.classList.toggle('exceptional-active', activeCat === 'exceptional');
  }

  syncMainPanelIdleState();

  updateActiveModuleEquip();
  updateNoneWaitEquipVisibility();
  updateCategoryTabStates();
  syncInspectModules();
  // 切分頁立刻暖當前特效；其餘特效改 idle 背景補載
  scheduleCategoryEffectWarm(activeCat);
}

function updateActiveModuleEquip() {
  const cat = getActiveCategory();

  if (cat === 'none') {
    if (typeof StarForceModule !== 'undefined') StarForceModule.resetState();
    if (typeof HammerModule !== 'undefined') HammerModule.resetState();
    if (typeof SoulWeaponModule !== 'undefined') SoulWeaponModule.resetState();
    if (typeof ScrollModule !== 'undefined') ScrollModule.resetState();
    if (typeof PotentialModule !== 'undefined') PotentialModule.resetState();
    if (typeof AddPotentialModule !== 'undefined') AddPotentialModule.resetState();
    if (typeof BonusStatModule !== 'undefined') BonusStatModule.resetState();
    if (typeof ExceptionalModule !== 'undefined') ExceptionalModule.resetState();
    syncMainPanelIdleState();
    return;
  }

  if (cat === 'star' && typeof StarForceModule !== 'undefined') {
    if (currentEnchantItem) {
      StarForceModule.loadEquip(currentEnchantItem);
    } else {
      StarForceModule.clearEquipState();
    }
  } else if (cat === 'hammer' && typeof HammerModule !== 'undefined') {
    if (currentEnchantItem) {
      HammerModule.loadEquip(currentEnchantItem);
    } else {
      HammerModule.resetState();
    }
  } else if (cat === 'soulWeapon' && typeof SoulWeaponModule !== 'undefined') {
    if (currentEnchantItem) {
      SoulWeaponModule.loadEquip(currentEnchantItem);
    } else {
      SoulWeaponModule.resetState();
    }
  } else if (cat === 'scroll' && typeof ScrollModule !== 'undefined') {
    if (currentEnchantItem) {
      ScrollModule.loadEquip(currentEnchantItem);
    } else {
      ScrollModule.resetState();
    }
  } else if (cat === 'potential' && typeof PotentialModule !== 'undefined') {
    if (currentEnchantItem) {
      PotentialModule.loadEquip(currentEnchantItem);
    } else {
      PotentialModule.resetState();
    }
  } else if (cat === 'additionalPotential' && typeof AddPotentialModule !== 'undefined') {
    if (currentEnchantItem) {
      AddPotentialModule.loadEquip(currentEnchantItem);
    } else {
      AddPotentialModule.resetState();
    }
  } else if (cat === 'bonusStat' && typeof BonusStatModule !== 'undefined') {
    if (currentEnchantItem) {
      BonusStatModule.loadEquip(currentEnchantItem);
    } else {
      BonusStatModule.resetState();
    }
  } else if (cat === 'exceptional' && typeof ExceptionalModule !== 'undefined') {
    if (currentEnchantItem) {
      ExceptionalModule.loadEquip(currentEnchantItem);
    } else {
      ExceptionalModule.resetState();
    }
  }

  syncMainPanelIdleState();
}

function handleMainAction() {
  if (!currentEnchantItem) {
    alert('請先將裝備放入中間強化槽！');
    return;
  }

  const cat = document.getElementById('actionCategory')?.value;
  if (cat === 'star' && typeof StarForceModule !== 'undefined') {
    StarForceModule.handleEnhanceClick();
  } else if (cat === 'scroll' && typeof ScrollModule !== 'undefined') {
    ScrollModule.handleUseClick();
  } else if (cat === 'potential' && typeof PotentialModule !== 'undefined') {
    PotentialModule.handleResetClick();
  } else if (cat === 'additionalPotential' && typeof AddPotentialModule !== 'undefined') {
    AddPotentialModule.handleResetClick();
  } else if (cat === 'bonusStat' && typeof BonusStatModule !== 'undefined') {
    BonusStatModule.handleResetClick();
  } else if (cat === 'hammer' && typeof HammerModule !== 'undefined') {
    HammerModule.handleUseClick();
  } else if (cat === 'soulWeapon' && typeof SoulWeaponModule !== 'undefined') {
    SoulWeaponModule.handleConfirmClick();
  } else if (cat === 'exceptional' && typeof ExceptionalModule !== 'undefined') {
    if (ExceptionalModule.subTab === 'extract') {
      ExceptionalModule.handleExtractClick();
    } else {
      ExceptionalModule.handleEnchantClick();
    }
  }
}

function updateStatusPanel() {
  refreshEquippedItemUI();
}

// ==========================================
// 4. 全域工具 (Log 紀錄與金額計算)
// ==========================================

function addLog(text, className = '') {
  const logBox = document.getElementById('logBox');
  if (!logBox) return;
  const newLog = document.createElement('div');
  if (className) newLog.classList.add(className);
  newLog.innerText = `[${new Date().toLocaleTimeString()}] ${text}`;
  logBox.appendChild(newLog);
  logBox.scrollTop = logBox.scrollHeight;
}

/** 楓幣分段：兆(10^12)／億(10^8)／萬(10^4)／個；為 0 的段不顯示單位 */
function formatMesoParts(amount) {
  const n = Math.floor(Math.abs(Number(amount) || 0));
  if (n === 0) return '0';

  const zhao = Math.floor(n / 1000000000000);
  const yi = Math.floor((n % 1000000000000) / 100000000);
  const wan = Math.floor((n % 100000000) / 10000);
  const rest = n % 10000;

  let text = '';
  if (zhao > 0) text += `${zhao}兆`;
  if (yi > 0) text += `${yi}億`;
  if (wan > 0) text += `${wan}萬`;
  if (rest > 0) text += `${rest}`;
  return text || '0';
}

function formatMesoAmount(amount) {
  const n = Math.floor(Number(amount) || 0);
  const sign = n < 0 ? '-' : '';
  return `${sign}${formatMesoParts(n)} 楓幣`;
}

function formatMesoFullDisplay(amount) {
  const n = Math.floor(Number(amount) || 0);
  const sign = n < 0 ? '-' : '';
  return `${sign}${formatMesoParts(n)}`;
}

function resetTotalCost() {
  if (typeof CostTrackerModule !== 'undefined') {
    CostTrackerModule.resetAll();
    return;
  }

  if (typeof StarForceModule === 'undefined') return;

  const stats = StarForceModule.getStatsCount();
  stats.mesoSpent = 0;
  stats.scroll23_100 = 0;
  stats.scroll24 = 0;
  stats.scroll25 = 0;
  StarForceModule.updateStatsUI();
  calculateCost();
  addLog('💰 已重置花費統計。', 'log-info');
}

function calculateCost() {
  if (typeof CostTrackerModule !== 'undefined') {
    const total = CostTrackerModule.getTotalCost();
    const display = document.getElementById('totalCostDisplay');
    if (display) display.innerText = total.toLocaleString();
    return;
  }

  const p23 = parseFloat(document.getElementById('price23_100')?.value) || 0;
  const p24 = parseFloat(document.getElementById('price24')?.value) || 0;
  const p25 = parseFloat(document.getElementById('price25')?.value) || 0;

  const starStats = typeof CostTrackerModule !== 'undefined'
    ? CostTrackerModule.getStarStats()
    : (typeof StarForceModule !== 'undefined' ? StarForceModule.getStatsCount() : {});

  const total =
    (starStats.mesoSpent || 0) +
    ((starStats.scroll23_100 || 0) * p23) +
    ((starStats.scroll24 || 0) * p24) +
    ((starStats.scroll25 || 0) * p25);

  const display = document.getElementById('totalCostDisplay');
  if (display) display.innerText = total.toLocaleString();
}

window.addEventListener('DOMContentLoaded', () => {
  initEnchantWorkbenchClose();
  if (typeof seedStarForceScrollConsumeInventory === 'function'
    && !(typeof SessionPersistenceModule !== 'undefined' && SessionPersistenceModule.hasSavedSession())) {
    seedStarForceScrollConsumeInventory();
  }
  if (typeof ensurePotentialScrollConsumeInventory === 'function') {
    ensurePotentialScrollConsumeInventory();
  }
  // 無論有無存檔，開頁再合併一次：補齊 ITEM_DATABASE 新增裝備
  if (typeof SessionPersistenceModule !== 'undefined') {
    SessionPersistenceModule.mergeDefaultEquipInventory();
  }
  if (typeof StarForceModule !== 'undefined') {
    StarForceModule.bindCostItemEvents();
  }
  InventoryModule.init();
  if (typeof UiEquipModule !== 'undefined') {
    UiEquipModule.init();
  }
  if (typeof SessionPersistenceModule !== 'undefined'
    && typeof SessionPersistenceModule.restoreUiEquipState === 'function') {
    SessionPersistenceModule.restoreUiEquipState();
  }
  if (typeof EquipTooltipModule !== 'undefined') {
    EquipTooltipModule.init();
  }
  if (typeof PanelDrag !== 'undefined') {
    // 工具列 + 中控台包成一體再拖曳
    (function ensureEnchantWorkbench() {
      const existing = document.getElementById('enchantWorkbench');
      if (existing) {
        document.getElementById('enchantWorkbenchDragHandle')?.remove();
        document.getElementById('mainPanelDragHandle')?.remove();
        return;
      }
      const sidebar = document.querySelector('#pageEnhance .ms-sidebar');
      const main = document.getElementById('mainContentPanel');
      if (!sidebar || !main || !sidebar.parentNode) return;
      const wrap = document.createElement('div');
      wrap.id = 'enchantWorkbench';
      wrap.className = 'enchant-workbench';
      sidebar.parentNode.insertBefore(wrap, sidebar);
      wrap.appendChild(sidebar);
      wrap.appendChild(main);
      // autoEnchant 面板定位相對 sidebar+中控台，跟著強化台一體拖曳／隱藏
      ['aeApOverlay', 'aeBsOverlay', 'aePotOverlay', 'aeSfOverlay'].forEach((id) => {
        const el = document.getElementById(id);
        if (el) wrap.appendChild(el);
      });
      document.getElementById('mainPanelDragHandle')?.remove();
      document.getElementById('enchantWorkbenchDragHandle')?.remove();
    })();

    PanelDrag.enable(document.getElementById('enchantWorkbench'), {
      panelDrag: true,
      storageKey: 'ui.drag.enchantWorkbench',
      ignoreSelector: [
        '#enchantWorkbenchClose',
        '.panel-wb-close',
        '.enchant-wb-close',
        '.ms-tab-btn',
        '.ms-sidebar-log',
        '.ms-sidebar-reset-btn',
        '.ms-sidebar-inspect-btn',
        '#totalCostDisplay',
        '#equipDropZone',
        '.ms-drop-zone',
        '.pt-cube-slot',
        '.sc-tab',
        '.ex-tab-btn',
        '.sc-scroll-thumb',
        '.sc-scroll-track',
      ].join(', '),
    });
    PanelDrag.enable(document.getElementById('uiEquipPanel'), {
      handle: '#uiEquipDragHandle',
      storageKey: 'ui.drag.equipPanel',
      title: '拖曳裝備欄',
      ignoreSelector: '.panel-wb-close',
    });
    PanelDrag.enable(document.getElementById('inventoryPanel'), {
      handle: '#inventoryDragHandle',
      ignoreSelector: '.inv-size-btn, .inv-tab, .inv-sort-btn, .panel-wb-close',
      storageKey: 'ui.drag.inventoryPanel',
      title: '拖曳背包',
    });

    if (typeof UiEquipModule !== 'undefined' && typeof UiEquipModule.setEnchantOpen === 'function') {
      UiEquipModule.setEnchantOpen(UiEquipModule.isEnchantOpen());
    }
  }
  if (typeof EquipStatPanel !== 'undefined') {
    EquipStatPanel.init();
  }
  if (typeof CharacterCombatPanel !== 'undefined') {
    CharacterCombatPanel.init();
  }
  if (typeof PanelDrag !== 'undefined') {
    PanelDrag.enable(document.getElementById('ccpRoot'), {
      handle: '.ccp-header',
      ignoreSelector: '.panel-wb-close, #ccpClose',
      storageKey: 'ui.drag.combatPanel',
      title: '拖曳戰鬥力數值',
    });
    PanelDrag.enable(document.getElementById('equipStatPanel'), {
      handle: '.equip-stat-panel-header',
      ignoreSelector: '.panel-wb-close, #equipStatPanelClose',
      storageKey: 'ui.drag.detailPanel',
      title: '拖曳屬性明細',
    });
  }
  if (typeof UiCharacterInfo !== 'undefined') {
    UiCharacterInfo.init();
  }
  if (typeof StarForceModule !== 'undefined') {
    StarForceModule.syncMethodSelectWidth();
  }
  ensureMainPanelBgStack();
  switchCategoryTab('none', null);
  updateCategoryTabStates();
  updateNonePageControls();
  setControlSubpanelsParked('none');
  setMainPanelBgCategory('none');
  if (typeof PotentialInspectModule !== 'undefined') {
    PotentialInspectModule.init();
  }
  if (typeof BonusStatInspectModule !== 'undefined') {
    BonusStatInspectModule.init();
  }
  if (typeof AutoEnchantPotentialModule !== 'undefined') {
    AutoEnchantPotentialModule.initPanelHooks();
  }
  if (typeof AutoEnchantAddPotentialModule !== 'undefined') {
    AutoEnchantAddPotentialModule.initPanelHooks();
  }
  if (typeof AutoEnchantBonusStatModule !== 'undefined') {
    AutoEnchantBonusStatModule.initPanelHooks();
  }
  if (typeof AutoEnchantStarForceModule !== 'undefined') {
    AutoEnchantStarForceModule.initPanelHooks();
  }
  if (typeof CostTrackerModule !== 'undefined') {
    CostTrackerModule.init();
  }

  if (typeof SessionPersistenceModule !== 'undefined') {
    SessionPersistenceModule.applyDeferredSavePayload();
    SessionPersistenceModule.restoreEquippedItem();
    SessionPersistenceModule.bindAutoSave();
    SessionPersistenceModule.scheduleSave();
  }

  if (typeof calculateCost === 'function') calculateCost();

  runEnchantBootPreload().catch(() => {
    finishBootAndShowInfoCard();
  });

  document.getElementById('totalCostDisplay')?.addEventListener('dblclick', resetTotalCost);
  document.getElementById('btnResetEquipState')?.addEventListener('click', resetEquippedItemState);
  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') handleGlobalEscapeKey();
  });
});
