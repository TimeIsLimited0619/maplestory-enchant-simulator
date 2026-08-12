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
    case 'additionalPotential':
      return typeof isMedalItem === 'function' ? !isMedalItem(item) : true;
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

  syncInspectModules();
}

function saveInventoryItemState(slotIndex, state) {
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

function handleGlobalEscapeKey() {
  if (typeof ExceptionalModule !== 'undefined' && ExceptionalModule.isExtractConfirmOpen?.()) {
    ExceptionalModule.closeExtractConfirm();
    return;
  }
  if (isBlockingOverlayOpen()) return;
  if (getActiveCategory() === 'none') return;
  switchCategoryTab('none', null);
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

function loadEquipToSlot(itemId, slotIndex) {
  if (currentEnchantItem) {
    unloadEquipFromSlot();
  }

  const itemData = ITEM_DATABASE[itemId];
  if (!itemData) return;

  currentEnchantItem = loadEnchantStateForSlot(itemId, slotIndex);

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

  const invItemImg = document.getElementById(`inv_item_equip_${slotIndex}`);
  const invFrame = invItemImg?.parentElement;
  if (invFrame?.classList.contains('inv-item-frame')) {
    invFrame.classList.add('equipped-hidden');
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
}

function unloadEquipFromSlot() {
  if (!currentEnchantItem) return;

  const slotIndex = currentEnchantItem.slotIndex;
  const itemName = currentEnchantItem.name;

  saveInventoryItemState(slotIndex, currentEnchantItem);

  const invItemImg = document.getElementById(`inv_item_equip_${slotIndex}`);
  const invFrame = invItemImg?.parentElement;
  if (invFrame?.classList.contains('inv-item-frame')) {
    invFrame.classList.remove('equipped-hidden');
  }

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
  // 特效模組多用相對路徑當快取鍵；同步暖機，避免開頁用絕對 URL、播放用相對 URL 各載一次
  if (typeof EnchantImagePreload !== 'undefined' && url && !/^https?:\/\//i.test(url) && !url.startsWith('data:')) {
    EnchantImagePreload.preload(url);
  }
  const absolute = normalizePreloadUrl(url);
  if (!absolute) return Promise.resolve(null);
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
  const prevHidden = panels.map((panel) => panel.classList.contains('hidden'));

  // 短暫顯示所有子面板，強制瀏覽器載入 display:none 時不會抓的 CSS 底圖
  panels.forEach((panel) => {
    panel.classList.remove('hidden');
    panel.style.position = 'absolute';
    panel.style.left = '-10000px';
    panel.style.top = '0';
    panel.style.visibility = 'hidden';
    panel.style.pointerEvents = 'none';
  });

  if (mainPanel) {
    activeClasses.forEach((cls) => mainPanel.classList.add(cls));
  }

  // 觸發一次 layout / paint
  void document.body.offsetHeight;

  return () => {
    panels.forEach((panel, index) => {
      panel.style.position = '';
      panel.style.left = '';
      panel.style.top = '';
      panel.style.visibility = '';
      panel.style.pointerEvents = '';
      panel.classList.toggle('hidden', prevHidden[index] !== false);
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
  concurrency = 12,
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

async function runEnchantBootPreload() {
  updateEnchantBootProgress(0, 1, '正在收集介面素材…');

  const restorePanels = warmEnchantPanelsForCssBackgrounds();
  let chromeUrls = [];
  try {
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    chromeUrls = [
      ...collectStylesheetImageUrls(),
      ...collectDomImageUrls(),
      ...collectDatabaseIconUrls(),
    ];
  } finally {
    restorePanels();
    if (typeof syncMainPanelIdleState === 'function') syncMainPanelIdleState();
    if (typeof updateNonePageControls === 'function') updateNonePageControls();
  }

  const effectPlan = collectAllEffectPreloadPlan();
  const chromeUniqueCount = new Set(chromeUrls.map(normalizePreloadUrl).filter(Boolean)).size;
  const effectCount = effectPlan.jobs.length;
  const total = Math.max(1, chromeUniqueCount + effectCount);

  updateEnchantBootProgress(0, total, '正在載入全部素材…');

  let done = 0;
  const report = (statusText) => {
    updateEnchantBootProgress(done, total, statusText);
  };

  // 1) 介面素材
  await preloadUrlBatch(chromeUrls, {
    concurrency: 14,
    onProgress: (batchDone) => {
      done = batchDone;
      report(`正在載入介面素材…（${batchDone}/${chromeUniqueCount}）`);
    },
    statusText: '正在載入介面素材…',
  });

  // 2) 全部特效／翻牌幀（寫入各模組自己的快取）
  if (effectCount) {
    const effectOffset = chromeUniqueCount;
    await preloadEffectJobs(effectPlan.jobs, {
      concurrency: 10,
      onProgress: (batchDone, batchTotal) => {
        done = effectOffset + batchDone;
        report(`正在載入特效素材…（${batchDone}/${batchTotal}）`);
      },
    });
    effectPlan.markDone();
  }

  done = total;
  updateEnchantBootProgress(total, total, '全部載入完成');
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

  const collectDeepImageUrls = (value, out = []) => {
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
  };

  // 自動強化面板素材
  [
    typeof AUTO_ENCHANT_STAR_FORCE !== 'undefined' ? AUTO_ENCHANT_STAR_FORCE : null,
    typeof AUTO_ENCHANT_POTENTIAL !== 'undefined' ? AUTO_ENCHANT_POTENTIAL : null,
    typeof AUTO_ENCHANT_ADD_POTENTIAL !== 'undefined' ? AUTO_ENCHANT_ADD_POTENTIAL : null,
    typeof AUTO_ENCHANT_BONUS_STAT !== 'undefined' ? AUTO_ENCHANT_BONUS_STAT : null,
  ].forEach((cfg) => {
    collectDeepImageUrls(cfg).forEach((url) => {
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

async function preloadEffectJobs(jobs, { concurrency = 10, onProgress = null } = {}) {
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

  document.querySelectorAll('.ms-control-subpanel').forEach(panel => {
    panel.classList.add('hidden');
  });

  if (activeCat !== 'none') {
    const activePanel = document.getElementById(`panel-${activeCat}`);
    if (activePanel) activePanel.classList.remove('hidden');
  }

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
  // 特效預載改到 idle，避免與首次切頁底圖解碼搶主執行緒
  scheduleEffectTestBarRefresh();
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
  if (typeof seedStarForceScrollConsumeInventory === 'function'
    && !(typeof SessionPersistenceModule !== 'undefined' && SessionPersistenceModule.hasSavedSession())) {
    seedStarForceScrollConsumeInventory();
  }
  // 無論有無存檔，開頁再合併一次：補齊 ITEM_DATABASE 新增裝備
  if (typeof SessionPersistenceModule !== 'undefined') {
    SessionPersistenceModule.mergeDefaultEquipInventory();
  }
  if (typeof StarForceModule !== 'undefined') {
    StarForceModule.bindCostItemEvents();
  }
  InventoryModule.init();
  if (typeof EquipTooltipModule !== 'undefined') {
    EquipTooltipModule.init();
  }
  if (typeof StarForceModule !== 'undefined') {
    StarForceModule.syncMethodSelectWidth();
  }
  switchCategoryTab('none', null);
  updateCategoryTabStates();
  updateNonePageControls();
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
