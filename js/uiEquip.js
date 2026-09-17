/**
 * 裝備欄（UIEquip）
 * 穿脫：從背包取出實體（itemId + state）放入身體槽；整理背包不影響已穿裝備
 */
const UiEquipModule = (() => {
  const BODY_SLOT_IDS = [
    '1', '2', '3', '4', '5', '6', '7', '8', '9',
    '10', '11', '12', '13', '15', '16', '17',
    '21', '22', '28', '31', '32', '33', '34', '35', '36', '37',
  ];

  const TOTEM_SLOT_IDS = ['5000', '5001', '5002', '5250'];

  /** 身體 + 圖騰全部槽（穿著 map / 持久化） */
  const SLOT_IDS = BODY_SLOT_IDS.concat(TOTEM_SLOT_IDS);
  const SYMBOL_SLOT_IDS = [
    'arc-0', 'arc-1', 'arc-2', 'arc-3', 'arc-4', 'arc-5',
    'aut-0', 'aut-1', 'aut-2', 'aut-3', 'aut-4', 'aut-5',
    'grand-0', 'grand-1', 'grand-2',
  ];

  const SLOT_LABELS = {
    1: '帽子', 2: '臉飾', 3: '眼飾', 4: '耳環', 5: '上衣', 6: '褲/裙',
    7: '鞋子', 8: '手套', 9: '披風', 10: '輔助武器', 11: '武器',
    12: '戒指', 13: '戒指', 15: '戒指', 16: '戒指', 17: '墜飾',
    21: '勳章', 22: '腰帶', 28: '肩膀裝飾', 31: '口袋道具', 32: '機器人',
    33: '機器心臟', 34: '胸章', 35: '能源', 36: '墜飾', 37: '神之子輔助武器',
    5000: '圖騰', 5001: '圖騰', 5002: '圖騰', 5250: '珠寶',
  };

  /** 放置死亡／復活流程中禁止換裝（加血裝會把死亡狀態卡死） */
  function isIdleDeathEquipLocked() {
    if (typeof IdleHunt === 'undefined') return false;
    if (typeof IdleHunt.isDeathUiLocked === 'function' && IdleHunt.isDeathUiLocked()) return true;
    if (typeof IdleHunt.isPlayerDead === 'function' && IdleHunt.isPlayerDead()) return true;
    return false;
  }

  function warnDeathEquipLocked() {
    if (typeof addLog === 'function') {
      addLog('[裝備欄] 死亡中無法更換裝備。', 'log-fail');
    }
  }

  const ISLOT_TO_SLOTS = {
    Cp: ['1'],
    Af: ['2'], Am: ['2'], Face: ['2'],
    Ay: ['3'],
    Ae: ['4'], Er: ['4'],
    Ma: ['5'],
    MaPn: ['5'],
    Pn: ['6'],
    So: ['7'],
    Gv: ['8'],
    Sr: ['9'],
    ohp: ['10'], Si: ['10'],
    Wp: ['11'], Gw: ['11'], Op: ['11'],
    WpSi: ['11'],
    Wpsi: ['11', '37'], // 神之子特殊武器：主武 11 或神之子輔助 37
    Ri: ['12', '13', '15', '16'],
    Pe: ['17', '36'],
    Md: ['21'], Me: ['21'],
    Be: ['22'],
    Sh: ['28'],
    Po: ['31'],
    Ex: ['31'], // 舊碼相容
    Tm: ['33'], // 機器心臟
    An: ['32'], // 機器人（之後新增）
    Ba: ['34'],
    Em: ['35'],
  };

  const TOTEM_SLOTS = ['5000', '5001', '5002'];
  const JEWEL_SLOTS = ['5250'];

  const PRESET_SELECTED_ORIGIN = { x: 11, y: 18 };
  const PRESET_SELECTED_NUDGE = { x: 9, y: 3 };
  const PRESET_POS = {
    1: { left: 184, top: 407 },
    2: { left: 214, top: 407 },
    3: { left: 244, top: 407 },
  };

  let pendingPreset = 1;
  let activePreset = 1;
  let inited = false;
  let totemPanelOpen = false;
  let windowMode = 'equip';
  let equipTab = 'equip';
  let decoTab = 'coordi';
  let symbolOpen = false;
  let symbolPage = 'arc';

  /** 三組 preset 各自保留完整穿著 { itemId, state }；切換只換顯示，不拆回背包 */
  const presetWear = {
    1: emptyWearMap(),
    2: emptyWearMap(),
    3: emptyWearMap(),
  };
  /** 目前顯示中的穿著（永遠指向 presetWear[activePreset]） */
  let activeWear = presetWear[1];
  let symbolWear = emptySymbolWear();

  function emptyWearMap() {
    const map = Object.create(null);
    SLOT_IDS.forEach((id) => { map[id] = null; });
    return map;
  }

  function emptySymbolWear() {
    const map = Object.create(null);
    SYMBOL_SLOT_IDS.forEach((id) => { map[id] = null; });
    return map;
  }

  function isSymbolSlotId(id) {
    return SYMBOL_SLOT_IDS.includes(String(id || ''));
  }

  function setActivePreset(n) {
    if (!PRESET_POS[n]) return false;
    activePreset = n;
    activeWear = presetWear[n];
    return true;
  }

  function $(id) {
    return document.getElementById(id);
  }

  function getItemData(itemId) {
    if (!itemId || typeof ITEM_DATABASE === 'undefined') return null;
    return ITEM_DATABASE[itemId] || null;
  }

  function cloneState(state) {
    if (!state) return null;
    try {
      return typeof cloneEnchantState === 'function'
        ? cloneEnchantState(state)
        : JSON.parse(JSON.stringify(state));
    } catch (_) {
      return { ...state };
    }
  }

  function scheduleSave() {
    if (typeof SessionPersistenceModule !== 'undefined') {
      SessionPersistenceModule.scheduleSave();
    }
  }

  function getCandidateSlots(item) {
    if (!item) return [];
    if (typeof isSymbolItem === 'function' ? isSymbolItem(item) : /Symbol$/.test(item.subType || '')) {
      const slot = typeof SymbolForce !== 'undefined'
        ? SymbolForce.slotForItemId(item.itemId || item.id)
        : '';
      return slot ? [slot] : [];
    }
    if (typeof isTotemItem === 'function' ? isTotemItem(item) : item.subType === 'totem') {
      return TOTEM_SLOTS.slice();
    }
    return (ISLOT_TO_SLOTS[item.islot || ''] || []).slice();
  }

  function isSlotCompatible(uiSlotId, item) {
    const id = String(uiSlotId);
    if (JEWEL_SLOTS.includes(id)) return false; // 珠寶槽尚未接物品類型
    return getCandidateSlots(item).includes(id);
  }

  function isOnlyEquipItem(item) {
    if (!item) return false;
    return Boolean(item.wz?.onlyEquip || item.onlyEquip);
  }

  /**
   * onlyEquip：目前 preset 是否已穿著同 itemId。
   * excludeSlotId：換裝目標槽可排除（該槽原件會被換下）。
   * 不同 preset 互不影響。
   */
  function findOnlyEquipConflictInActive(itemId, excludeSlotId = null) {
    if (!itemId) return null;
    const item = getItemData(itemId);
    if (!isOnlyEquipItem(item)) return null;
    const exclude = excludeSlotId != null ? String(excludeSlotId) : null;
    for (const id of SLOT_IDS) {
      if (exclude && String(id) === exclude) continue;
      if (activeWear[id]?.itemId === itemId) return String(id);
    }
    return null;
  }

  function resolveWearTarget(item, preferredSlotId) {
    const candidates = getCandidateSlots(item);
    if (!candidates.length) return null;
    if (preferredSlotId != null) {
      const pref = String(preferredSlotId);
      return candidates.includes(pref) ? pref : null;
    }
    const empty = candidates.find((id) => !(isSymbolSlotId(id) ? symbolWear[id] : activeWear[id]));
    return empty || candidates[0];
  }

  /**
   * 假設穿上 item 後的穿著列表（不改真正裝備欄）
   * 規則對齊 wearFromBag：空槽優先，否則該類型第一槽；套服清褲、穿褲先脫套服。
   */
  function previewWearEntries(item, state, preferredSlotId = null) {
    const current = getActiveWearEntries();
    if (!item) return current;
    const target = resolveWearTarget(item, preferredSlotId);
    if (!target) return current;

    const itemId = item.itemId || item.id;
    const drop = new Set([String(target)]);
    const onlyConflict = findOnlyEquipConflictInActive(itemId, target);
    if (onlyConflict) drop.add(String(onlyConflict));
    if (item.islot === 'MaPn') drop.add('6');
    if (item.islot === 'Pn') {
      const coatEntry = activeWear['5'];
      const coat = coatEntry ? getItemData(coatEntry.itemId) : null;
      if (coat?.islot === 'MaPn') drop.add('5');
    }

    const next = current.filter((entry) => !drop.has(String(entry.slotId)));
    next.push({
      slotId: String(target),
      label: SLOT_LABELS[target] || `槽位 ${target}`,
      itemId,
      state: state || null,
    });
    return next;
  }

  function findEmptyBagSlot() {
    if (typeof playerInventoryEquip === 'undefined') return -1;
    for (let i = 0; i < playerInventoryEquip.length; i++) {
      if (!playerInventoryEquip[i]) return i;
    }
    return -1;
  }

  function findBagIndexByItemId(itemId, used = null) {
    if (!itemId || typeof playerInventoryEquip === 'undefined') return -1;
    const want = (typeof resolveEquipItemId === 'function' ? resolveEquipItemId(itemId) : itemId) || itemId;
    for (let i = 0; i < playerInventoryEquip.length; i++) {
      const have = playerInventoryEquip[i];
      if (!have) continue;
      const resolved = (typeof resolveEquipItemId === 'function' ? resolveEquipItemId(have) : have) || have;
      if (resolved !== want) continue;
      if (used && used.has(i)) continue;
      return i;
    }
    return -1;
  }

  function syncBagAlias() {
    if (typeof playerInventory !== 'undefined' && Array.isArray(playerInventory)) {
      playerInventory.splice(0, playerInventory.length, ...playerInventoryEquip);
    }
  }

  /** 若該背包格正在強化焦點，先清焦點（物品仍在格內） */
  function ensureEnchantUnloadedForBag(bagIndex) {
    if (typeof currentEnchantItem === 'undefined' || !currentEnchantItem) return;
    if (currentEnchantItem.slotIndex !== bagIndex) return;
    if (typeof unloadEquipFromSlot === 'function') unloadEquipFromSlot({ silent: true });
  }

  function ensureEnchantUnloadedForItemId(itemId) {
    if (!itemId || typeof currentEnchantItem === 'undefined' || !currentEnchantItem) return;
    const curId = typeof resolveEquipItemId === 'function'
      ? resolveEquipItemId(currentEnchantItem)
      : (currentEnchantItem.itemId || currentEnchantItem.id);
    const wantId = typeof resolveEquipItemId === 'function'
      ? resolveEquipItemId(itemId)
      : itemId;
    if (!curId || curId !== wantId) return;
    if (typeof unloadEquipFromSlot === 'function') unloadEquipFromSlot({ silent: true });
  }

  /** 寫回目前 preset 穿著槽 state（強化焦點用） */
  function patchActiveWearState(uiSlotId, state, instanceUid) {
    const id = String(uiSlotId);
    const entry = activeWear[id];
    if (!entry?.itemId) return false;
    const itemId = (typeof resolveEquipItemId === 'function'
      ? resolveEquipItemId(entry.itemId)
      : entry.itemId) || entry.itemId;
    let next = cloneState(state);
    if (next && typeof next === 'object') {
      if (typeof stampEnchantItemId === 'function') stampEnchantItemId(next, itemId);
      else {
        next.itemId = itemId;
        next.id = itemId;
      }
      if (instanceUid) next.instanceUid = instanceUid;
    }
    activeWear[id] = {
      itemId,
      state: next,
      instanceUid: instanceUid || entry.instanceUid || null,
    };
    scheduleSave();
    return true;
  }

  /** 從背包取出實體 */
  function takeFromBag(bagIndex) {
    if (!Number.isInteger(bagIndex) || bagIndex < 0) return null;
    ensureEnchantUnloadedForBag(bagIndex);
    const itemId = playerInventoryEquip[bagIndex];
    if (!itemId) return null;
    const state = cloneState(playerInventoryState[bagIndex] ?? null);
    let instanceUid = state?.instanceUid || null;
    if (typeof ItemStore !== 'undefined') {
      const bags = ItemStore.getBagSlots?.() || [];
      instanceUid = bags[bagIndex] || instanceUid;
      if (instanceUid && ItemStore.get(instanceUid)) {
        // 暫放 orphan，穿上後 move 到 body
        ItemStore.move(instanceUid, { type: 'orphan' });
      }
    }
    playerInventoryEquip[bagIndex] = null;
    playerInventoryState[bagIndex] = null;
    syncBagAlias();
    return { itemId, state, instanceUid };
  }

  /** 放回背包；成功回傳 bagIndex，失敗回傳 -1 並還原呼叫端需自行處理 */
  function putToBag(entry) {
    if (!entry?.itemId) return -1;
    const itemId = (typeof resolveEquipItemId === 'function'
      ? resolveEquipItemId(entry.itemId)
      : entry.itemId) || entry.itemId;
    const idx = findEmptyBagSlot();
    if (idx < 0) return -1;
    let state = cloneState(entry.state);
    if (state && typeof state === 'object') {
      if (typeof stampEnchantItemId === 'function') stampEnchantItemId(state, itemId);
      else {
        state.itemId = itemId;
        state.id = itemId;
        delete state.slotIndex;
      }
    } else {
      state = { itemId, id: itemId };
    }
    let uid = entry.instanceUid || null;
    if (typeof ItemStore !== 'undefined') {
      if (uid && ItemStore.get(uid)) {
        ItemStore.replaceState(uid, state);
        if (!ItemStore.move(uid, { type: 'bag', index: idx })) {
          // 若 move 失敗則新建
          uid = ItemStore.createInstance(itemId, state);
          ItemStore.move(uid, { type: 'bag', index: idx });
        }
      } else {
        uid = ItemStore.createInstance(itemId, state);
        ItemStore.move(uid, { type: 'bag', index: idx });
      }
      if (uid && state && typeof state === 'object') state.instanceUid = uid;
    }
    playerInventoryEquip[idx] = itemId;
    playerInventoryState[idx] = state;
    syncBagAlias();
    return idx;
  }

  function returnEntryToBagOrWarn(entry) {
    if (!entry) return true;
    const idx = putToBag(entry);
    if (idx < 0) {
      if (typeof addLog === 'function') {
        addLog('[裝備欄] 背包已滿，無法放回裝備。', 'log-fail');
      }
      return false;
    }
    return true;
  }

  function spendSymbolMeso(cost) {
    const n = Math.max(0, Math.floor(Number(cost) || 0));
    if (!n) return true;
    if (typeof trySpendIdleMeso === 'function') return trySpendIdleMeso(n);
    if (typeof IdleHunt !== 'undefined' && typeof IdleHunt.spendGold === 'function') {
      return IdleHunt.spendGold(n);
    }
    return true;
  }

  function putOnSymbol(slotId, entry) {
    const id = String(slotId);
    if (!isSymbolSlotId(id) || !entry?.itemId) return false;
    const itemId = (typeof resolveEquipItemId === 'function'
      ? resolveEquipItemId(entry.itemId)
      : entry.itemId) || entry.itemId;
    let state = cloneState(entry.state) || {};
    if (typeof SymbolForce !== 'undefined') {
      state = SymbolForce.normalizeState(itemId, state, getItemData(itemId));
    }
    if (typeof stampEnchantItemId === 'function') stampEnchantItemId(state, itemId);
    else {
      state.itemId = itemId;
      state.id = itemId;
    }
    let uid = entry.instanceUid || state.instanceUid || null;
    if (typeof ItemStore !== 'undefined') {
      if (uid && ItemStore.get(uid)) {
        ItemStore.replaceState(uid, state);
        ItemStore.move(uid, { type: 'symbol', slot: id });
      } else {
        uid = ItemStore.ensureSymbolUid(id, { itemId, state, instanceUid: uid });
        if (uid) ItemStore.move(uid, { type: 'symbol', slot: id });
      }
      if (uid && state && typeof state === 'object') state.instanceUid = uid;
    }
    symbolWear[id] = { itemId, state, instanceUid: uid };
    return true;
  }

  function destroyEntry(entry) {
    const uid = entry?.instanceUid || entry?.state?.instanceUid;
    if (uid && typeof ItemStore !== 'undefined') ItemStore.destroy(uid);
  }

  function sameEquipId(a, b) {
    if (!a || !b) return false;
    const ra = (typeof resolveEquipItemId === 'function' ? resolveEquipItemId(a) : a) || a;
    const rb = (typeof resolveEquipItemId === 'function' ? resolveEquipItemId(b) : b) || b;
    return String(ra) === String(rb)
      || String(ra).replace(/^0+/, '') === String(rb).replace(/^0+/, '');
  }

  function listBagIndexesForSymbol(itemId) {
    const out = [];
    if (!itemId || typeof playerInventoryEquip === 'undefined') return out;
    for (let i = 0; i < playerInventoryEquip.length; i += 1) {
      if (sameEquipId(playerInventoryEquip[i], itemId)) out.push(i);
    }
    return out;
  }

  let symbolFeedPending = false;
  let symbolEnhancePending = false;

  function applyFeedToEquipped(slotId, taken, bagItem) {
    const equipped = symbolWear[String(slotId)];
    if (!equipped?.itemId || !taken) return 0;
    const add = typeof SymbolForce !== 'undefined'
      ? SymbolForce.expValue(taken.itemId, taken.state, bagItem)
      : 1;
    const gained = Math.max(1, add);
    const state = cloneState(equipped.state) || {};
    state.symbolExp = Math.max(0, Math.floor(Number(state.symbolExp) || 0)) + gained;
    if (typeof SymbolForce !== 'undefined') {
      Object.assign(state, SymbolForce.normalizeState(equipped.itemId, state, getItemData(equipped.itemId)));
    }
    equipped.state = state;
    if (equipped.instanceUid && typeof ItemStore !== 'undefined') {
      ItemStore.replaceState(equipped.instanceUid, state);
    }
    destroyEntry(taken);
    return gained;
  }

  function feedSymbols(slotId, bagIndexes, bagItem) {
    const equipped = symbolWear[String(slotId)];
    if (!equipped?.itemId) return false;
    const unique = [...new Set((bagIndexes || []).filter((i) => Number.isInteger(i) && i >= 0))];
    unique.sort((a, b) => b - a);
    let count = 0;
    let gained = 0;
    unique.forEach((idx) => {
      if (!sameEquipId(playerInventoryEquip[idx], equipped.itemId)
        && !sameEquipId(playerInventoryEquip[idx], bagItem?.itemId || bagItem?.id)) {
        return;
      }
      const taken = takeFromBag(idx);
      if (!taken) return;
      gained += applyFeedToEquipped(slotId, taken, bagItem || getItemData(taken.itemId));
      count += 1;
    });
    if (!count) return false;
    const name = bagItem?.name || getItemData(equipped.itemId)?.name || equipped.itemId;
    if (typeof addLog === 'function') {
      addLog(`[符文] 已將 ${count} 個【${name}】轉為成長經驗（+${gained}）。`, 'log-success');
    }
    refresh();
    scheduleSave();
    return true;
  }

  async function confirmAndFeedSymbol(slotId, bagIndex, bagItem) {
    if (symbolFeedPending) return false;
    const itemId = bagItem?.itemId || bagItem?.id;
    const indexes = listBagIndexesForSymbol(itemId);
    if (Number.isInteger(bagIndex) && bagIndex >= 0 && !indexes.includes(bagIndex)) {
      indexes.push(bagIndex);
    }
    indexes.sort((a, b) => a - b);
    let feedAll = indexes.length <= 1;
    if (indexes.length > 1) {
      const name = bagItem?.name || itemId;
      const confirmFn = typeof showAppConfirm === 'function'
        ? showAppConfirm
        : ({ message }) => Promise.resolve(window.confirm(message));
      symbolFeedPending = true;
      try {
        feedAll = await confirmFn({
          title: '符文成長',
          message: `背包中有 ${indexes.length} 個【${name}】。要一次全部轉為成長經驗嗎？`,
          confirmText: '全部餵入',
          cancelText: '只餵這個',
        });
      } finally {
        symbolFeedPending = false;
      }
    }
    const targets = feedAll ? indexes : [bagIndex];
    return feedSymbols(slotId, targets, bagItem);
  }

  function wearSymbolFromBag(item, bagIndex) {
    if (isIdleDeathEquipLocked()) {
      warnDeathEquipLocked();
      return false;
    }
    if (!meetsLevelReq(item)) {
      if (typeof addLog === 'function') {
        addLog(`[裝備欄] 角色等級不足，無法穿上【${item.name}】（需要 Lv.${item.reqLevel}）。`, 'log-fail');
      }
      return false;
    }
    const itemId = item.itemId || item.id;
    const slotId = typeof SymbolForce !== 'undefined' ? SymbolForce.slotForItemId(itemId) : '';
    if (!slotId) {
      if (typeof addLog === 'function') {
        addLog(`[裝備欄]【${item.name}】沒有對應可穿符文槽。`, 'log-fail');
      }
      return false;
    }
    const occupied = symbolWear[slotId];
    if (occupied?.itemId) {
      const same = String(occupied.itemId) === String(itemId)
        || String(occupied.itemId).replace(/^0+/, '') === String(itemId).replace(/^0+/, '');
      if (same) {
        void confirmAndFeedSymbol(slotId, bagIndex, item);
        return true;
      }
      if (typeof addLog === 'function') {
        addLog(`[符文] 該槽已穿著其他符文。`, 'log-fail');
      }
      return false;
    }
    const taken = takeFromBag(bagIndex);
    if (!taken) return false;
    if (!putOnSymbol(slotId, taken)) {
      putToBag(taken);
      return false;
    }
    if (typeof addLog === 'function') {
      addLog(`[裝備欄] 已穿上【${item.name}】`, 'log-success');
    }
    refresh();
    scheduleSave();
    return true;
  }

  async function enhanceSymbolSlot(slotId) {
    if (symbolEnhancePending) return false;
    const id = String(slotId);
    const entry = symbolWear[id];
    if (!entry?.itemId || typeof SymbolForce === 'undefined') return false;
    const item = getItemData(entry.itemId);
    const info = SymbolForce.inspect(entry.itemId, entry.state, item);
    if (!info.canEnhance) {
      if (typeof addLog === 'function') {
        addLog(info.atMax ? '[符文] 已達最高等級。' : '[符文] 成長經驗不足，無法強化。', 'log-fail');
      }
      return false;
    }
    const name = item?.name || entry.itemId;
    const nextLv = info.level + 1;
    const costText = formatSymbolNum(info.meso);
    const confirmFn = typeof showAppConfirm === 'function'
      ? showAppConfirm
      : ({ message }) => Promise.resolve(window.confirm(message));
    symbolEnhancePending = true;
    let ok = false;
    try {
      ok = await confirmFn({
        title: '符文強化',
        message: `要將【${name}】從 Lv.${info.level} 強化至 Lv.${nextLv} 嗎？\n需要 ${costText} 楓幣。`,
        confirmText: '強化',
        cancelText: '取消',
      });
    } finally {
      symbolEnhancePending = false;
    }
    if (!ok) return false;
    const live = symbolWear[id];
    if (!live?.itemId || String(live.itemId) !== String(entry.itemId)) return false;
    const liveInfo = SymbolForce.inspect(live.itemId, live.state, getItemData(live.itemId));
    if (!liveInfo.canEnhance || liveInfo.level !== info.level || liveInfo.meso !== info.meso) {
      if (typeof addLog === 'function') {
        addLog('[符文] 狀態已變更，請再試一次。', 'log-fail');
      }
      return false;
    }
    if (!spendSymbolMeso(liveInfo.meso)) {
      if (typeof addLog === 'function') {
        addLog('[符文] 楓幣不足，無法強化。', 'log-fail');
      }
      return false;
    }
    const state = cloneState(live.state) || {};
    state.symbolLevel = liveInfo.level + 1;
    state.symbolExp = Math.max(0, liveInfo.exp - liveInfo.need);
    Object.assign(state, SymbolForce.normalizeState(live.itemId, state, getItemData(live.itemId)));
    live.state = state;
    if (live.instanceUid && typeof ItemStore !== 'undefined') {
      ItemStore.replaceState(live.instanceUid, state);
    }
    if (typeof addLog === 'function') {
      addLog(`[符文]【${name}】強化至 Lv.${state.symbolLevel}。`, 'log-success');
    }
    refresh();
    scheduleSave();
    return true;
  }

  function findSlotByItemId(itemId) {
    if (!itemId) return null;
    for (const id of SLOT_IDS) {
      if (activeWear[id]?.itemId === itemId) return id;
    }
    for (const id of SYMBOL_SLOT_IDS) {
      if (symbolWear[id]?.itemId === itemId) return id;
    }
    return null;
  }

  function findItemAcrossPresets(itemId) {
    if (!itemId) return null;
    for (const n of [1, 2, 3]) {
      const map = presetWear[n];
      for (const id of SLOT_IDS) {
        if (map[id]?.itemId === itemId) return { preset: n, slot: id };
      }
    }
    return null;
  }

  function dumpWearMapToBag(map) {
    let ok = true;
    SLOT_IDS.forEach((id) => {
      const entry = map[id];
      if (!entry) return;
      if (!returnEntryToBagOrWarn(entry)) {
        ok = false;
        return;
      }
      map[id] = null;
    });
    return ok;
  }

  function playerLevel() {
    if (typeof CharacterProgression !== 'undefined' && typeof CharacterProgression.getState === 'function') {
      return Number(CharacterProgression.getState().level) || 1;
    }
    return 1;
  }

  function isIdleEquipMode() {
    return (typeof SessionPersistenceModule !== 'undefined' && SessionPersistenceModule.activeProfile === 'idle')
      || (typeof AppMode !== 'undefined' && AppMode.isIdle?.());
  }

  function meetsLevelReq(item) {
    if (!isIdleEquipMode()) return true;
    const need = Number(item?.reqLevel) || 0;
    if (need <= 0) return true;
    return playerLevel() >= need;
  }

  function emptyEquipBagCount() {
    if (typeof playerInventoryEquip === 'undefined' || !Array.isArray(playerInventoryEquip)) return 0;
    let n = 0;
    for (let i = 0; i < playerInventoryEquip.length; i++) {
      if (!playerInventoryEquip[i]) n++;
    }
    return n;
  }

  /**
   * 穿上：從背包取出 → 放入身體槽；原槽有裝備則放回背包
   */
  function wearFromBag(itemId, bagIndex, preferredSlotId = null) {
    if (isIdleDeathEquipLocked()) {
      warnDeathEquipLocked();
      return false;
    }
    if (typeof EquipTooltipModule !== 'undefined') {
      EquipTooltipModule.hide(true);
    }
    if (!Number.isInteger(bagIndex) || bagIndex < 0) return false;
    const resolvedId = itemId || playerInventoryEquip[bagIndex];
    const item = getItemData(resolvedId);
    if (!item) return false;

    if (typeof isSymbolItem === 'function' ? isSymbolItem(item) : /Symbol$/.test(item.subType || '')) {
      return wearSymbolFromBag(item, bagIndex);
    }

    if (!meetsLevelReq(item)) {
      if (typeof addLog === 'function') {
        addLog(`[裝備欄] 角色等級不足，無法穿上【${item.name}】（需要 Lv.${item.reqLevel}）。`, 'log-fail');
      }
      return false;
    }

    const bagState = typeof playerInventoryState !== 'undefined' ? playerInventoryState[bagIndex] : null;
    if (typeof isStarforceBrokenItem === 'function' && isStarforceBrokenItem(bagState)) {
      if (typeof addLog === 'function') {
        addLog(`[裝備欄]【${item.name}】已損壞，無法穿著。請至裝備加工恢復。`, 'log-fail');
      }
      return false;
    }

    const currentJobName = (typeof CharacterSkills !== 'undefined'
      && typeof CharacterSkills.getCombatJobNameForCurrentLine === 'function')
      ? (CharacterSkills.getCombatJobNameForCurrentLine() || '')
      : (typeof CharacterCombatPanel !== 'undefined'
        ? (CharacterCombatPanel.getState?.()?.jobName || '')
        : '');
    if (currentJobName
      && typeof WeaponTypeMap !== 'undefined'
      && typeof WeaponTypeMap.isWeaponAllowedForJob === 'function'
      && !WeaponTypeMap.isWeaponAllowedForJob(item, currentJobName)) {
      if (typeof addLog === 'function') {
        addLog(`[裝備欄]【${item.name}】不符合目前職業【${currentJobName}】的武器限制。`, 'log-fail');
      }
      return false;
    }

    const target = resolveWearTarget(item, preferredSlotId);
    if (!target) {
      if (typeof addLog === 'function') {
        addLog(`[裝備欄]【${item.name}】沒有對應可穿槽位。`, 'log-fail');
      }
      return false;
    }

    // onlyEquip：目前 preset 已穿同 ID → 先強制卸下舊件再穿（不同 preset 互不影響）
    const onlyConflict = findOnlyEquipConflictInActive(resolvedId, target);
    if (onlyConflict && activeWear[onlyConflict]) {
      if (!returnEntryToBagOrWarn(activeWear[onlyConflict])) {
        return false;
      }
      activeWear[onlyConflict] = null;
    }

    // 預估需放回背包的件數：take 後會多 1 格，不足則先拒絕（避免 take 後回存失敗導致新件消失）
    const willReturnPants = item.islot === 'MaPn' && !!activeWear['6'];
    const willReturnCoatForPants = item.islot === 'Pn' && activeWear['5']
      && getItemData(activeWear['5'].itemId)?.islot === 'MaPn';
    const displacedPreview = activeWear[target];
    let needReturn = 0;
    if (willReturnPants) needReturn += 1;
    if (willReturnCoatForPants) needReturn += 1;
    if (displacedPreview) {
      const alreadyCounted = (willReturnPants && String(target) === '6')
        || (willReturnCoatForPants && String(target) === '5');
      if (!alreadyCounted) needReturn += 1;
    }
    if (emptyEquipBagCount() + 1 < needReturn) {
      if (typeof addLog === 'function') {
        addLog('[裝備欄] 背包空間不足，無法穿上（需先騰出空位）。', 'log-fail');
      }
      return false;
    }

    const entry = takeFromBag(bagIndex);
    if (!entry) return false;

    const abortKeepEntry = () => {
      if (putToBag(entry) >= 0) return;
      if (!activeWear[target]) {
        activeWear[target] = entry;
        return;
      }
      for (const id of SLOT_IDS) {
        if (activeWear[id]) continue;
        activeWear[id] = entry;
        if (typeof addLog === 'function') {
          addLog(`[裝備欄] 背包已滿，【${item.name}】暫放於 ${SLOT_LABELS[id] || id}。`, 'log-fail');
        }
        return;
      }
      if (typeof addLog === 'function') {
        addLog(`[裝備欄] 嚴重：無法安置【${item.name}】，請立即匯出存檔並回報。`, 'log-fail');
      }
    };

    // 套服清褲；穿褲時先脫套服
    if (item.islot === 'MaPn' && activeWear['6']) {
      if (!returnEntryToBagOrWarn(activeWear['6'])) {
        abortKeepEntry();
        return false;
      }
      activeWear['6'] = null;
    }
    if (item.islot === 'Pn' && activeWear['5']) {
      const coat = getItemData(activeWear['5'].itemId);
      if (coat?.islot === 'MaPn') {
        if (!returnEntryToBagOrWarn(activeWear['5'])) {
          abortKeepEntry();
          return false;
        }
        activeWear['5'] = null;
      }
    }

    // 目標槽已有裝備：一律放回背包（即使 itemId 相同，狀態也可能不同）
    const displaced = activeWear[target];
    if (displaced) {
      if (!returnEntryToBagOrWarn(displaced)) {
        abortKeepEntry();
        return false;
      }
      activeWear[target] = null;
    }

    activeWear[target] = entry;
    if (typeof ItemStore !== 'undefined' && entry.instanceUid && ItemStore.get(entry.instanceUid)) {
      ItemStore.move(entry.instanceUid, { type: 'body', preset: activePreset, slot: String(target) });
    }

    if (TOTEM_SLOTS.includes(String(target))) {
      setTotemPanelOpen(true);
    }

    if (typeof addLog === 'function') {
      addLog(`[裝備欄] 已穿上【${item.name}】→ ${SLOT_LABELS[target] || target}`, 'log-success');
    }

    refresh();
    scheduleSave();
    return true;
  }

  function unequipSlot(uiSlotId, { silent = false } = {}) {
    if (isIdleDeathEquipLocked()) {
      if (!silent) warnDeathEquipLocked();
      return false;
    }
    if (typeof EquipTooltipModule !== 'undefined') {
      EquipTooltipModule.hide(true);
    }
    const id = String(uiSlotId);
    const entry = isSymbolSlotId(id) ? symbolWear[id] : activeWear[id];
    if (!entry) return false;

    if (typeof currentEnchantItem !== 'undefined' && currentEnchantItem
      && String(currentEnchantItem.wearSlotId) === id
      && typeof unloadEquipFromSlot === 'function') {
      unloadEquipFromSlot({ silent: true });
    }

    if (!returnEntryToBagOrWarn(entry)) return false;
    if (isSymbolSlotId(id)) symbolWear[id] = null;
    else activeWear[id] = null;

    if (!silent && typeof addLog === 'function') {
      const item = getItemData(entry.itemId);
      if (item) addLog(`[裝備欄] 已脫下【${item.name}】`, 'log-info');
    }

    refresh();
    scheduleSave();
    return true;
  }

  /** 轉職後卸下不符合新職業的主武／神之子副武 */
  function unequipIncompatibleWeapons(jobName, { silent = false } = {}) {
    if (!jobName || typeof WeaponTypeMap === 'undefined'
      || typeof WeaponTypeMap.isWeaponAllowedForJob !== 'function') {
      return false;
    }
    let changed = false;
    const removedNames = [];
    ['11', '37'].forEach((slotId) => {
      const entry = activeWear[slotId];
      if (!entry?.itemId) return;
      const item = getItemData(entry.itemId);
      if (!item) return;
      if (WeaponTypeMap.isWeaponAllowedForJob(item, jobName)) return;
      if (!returnEntryToBagOrWarn(entry)) return;
      activeWear[slotId] = null;
      changed = true;
      if (item.name) removedNames.push(item.name);
    });
    if (!changed) return false;
    if (!silent && typeof addLog === 'function' && removedNames.length) {
      addLog(`[裝備欄] 轉職後已卸下不符職業的武器：${removedNames.join('、')}`, 'log-info');
    }
    refresh();
    scheduleSave();
    return true;
  }

  /** 身上該槽設為強化焦點（不脫裝；強化槽已有焦點則先清除） */
  function moveWornSlotToEnchant(uiSlotId) {
    const id = String(uiSlotId);
    const entry = activeWear[id];
    if (!entry?.itemId) return false;
    if (typeof currentEnchantItem !== 'undefined' && currentEnchantItem) {
      if (typeof unloadEquipFromSlot !== 'function' || !unloadEquipFromSlot({ silent: true })) {
        return false;
      }
    }
    // 正服式：穿著保留，僅設強化焦點
    const ok = typeof loadEquipFromWearEntry === 'function' && loadEquipFromWearEntry(entry, id);
    if (!ok) {
      if (typeof addLog === 'function') {
        addLog('[裝備欄] 無法放入強化槽。', 'log-fail');
      }
      refresh();
      return false;
    }
    refresh();
    scheduleSave();
    return true;
  }

  /** 強化互斥：依 itemId 從任一 preset 卸下並放回背包 */
  function unequipItemId(itemId, { refreshUi = true } = {}) {
    const found = findItemAcrossPresets(itemId);
    if (!found) return false;
    const entry = presetWear[found.preset][found.slot];
    if (!returnEntryToBagOrWarn(entry)) return false;
    presetWear[found.preset][found.slot] = null;
    if (refreshUi) refresh();
    scheduleSave();
    return true;
  }

  /** 直接銷毀身上裝備（不回背包），供蟾蜍鐵鎚等消耗來源裝備用 */
  function destroyWornItem(itemId, { refreshUi = true } = {}) {
    const found = findItemAcrossPresets(itemId);
    if (!found) return false;
    presetWear[found.preset][found.slot] = null;
    if (refreshUi) refresh();
    scheduleSave();
    return true;
  }

  /** 銷毀目前 preset 指定槽（避免同 ID 誤刪其他 preset） */
  function destroyWornSlot(uiSlotId, { refreshUi = true } = {}) {
    const id = String(uiSlotId);
    if (!activeWear[id]) return false;
    activeWear[id] = null;
    if (refreshUi) refresh();
    scheduleSave();
    return true;
  }

  /** 外部（存檔還原等）放回背包；成功回傳 bagIndex，失敗 -1 */
  function putEntryToBag(entry) {
    return putToBag(entry);
  }

  function isItemWorn(itemId) {
    return findItemAcrossPresets(itemId) != null;
  }

  /** @deprecated bag-index API — 改為 no-op / 轉 itemId */
  function unequipBagIndex() {
    return false;
  }

  function isBagWornAnywhere() {
    return false;
  }

  function isBagWornActive() {
    return false;
  }

  function getActiveWornBagIndices() {
    return new Set();
  }

  function remapBagIndices() {
    // 身體槽已不依賴 bag index
  }

  /** 舊存檔 layout（僅 itemId）→ 灌入指定 preset */
  function applyLayoutToPreset(presetNo, layout) {
    const map = presetWear[presetNo];
    if (!map) return false;
    if (!dumpWearMapToBag(map)) {
      if (typeof addLog === 'function') {
        addLog('[裝備欄] 背包已滿，無法套用舊版穿著配置（已保留原穿著）。', 'log-fail');
      }
      return false;
    }

    const usedBag = new Set();
    SLOT_IDS.forEach((id) => {
      const itemId = layout?.[id];
      if (!itemId) {
        map[id] = null;
        return;
      }
      ensureEnchantUnloadedForItemId(itemId);
      const bagIndex = findBagIndexByItemId(itemId, usedBag);
      if (bagIndex < 0) {
        map[id] = null;
        return;
      }
      usedBag.add(bagIndex);
      map[id] = takeFromBag(bagIndex);
    });
    return true;
  }

  function selectPendingPreset(n) {
    if (!PRESET_POS[n]) return;
    pendingPreset = n;
    syncPresetSelected();
  }

  /** Application：切到 pending preset 並顯示其穿著（不拆其他 preset） */
  function applyPendingPreset() {
    if (isIdleDeathEquipLocked()) {
      warnDeathEquipLocked();
      return;
    }
    if (!PRESET_POS[pendingPreset]) return;
    setActivePreset(pendingPreset);
    if (typeof addLog === 'function') {
      addLog(`[裝備欄] 已套用裝備預設 ${activePreset}`, 'log-info');
    }
    refresh();
    scheduleSave();
  }

  function setPreset(n) {
    selectPendingPreset(n);
  }

  function renderSlots() {
    const bodyHost = $('uiEquipSlots');
    if (bodyHost) {
      bodyHost.innerHTML = BODY_SLOT_IDS.map((id) => {
        const label = SLOT_LABELS[id] || `槽位 ${id}`;
        return `<div class="uiequip-slot" data-slot="${id}" title="${label}"></div>`;
      }).join('');
    }

    const totemHost = $('uiEquipTotemSlots');
    if (totemHost) {
      totemHost.innerHTML = TOTEM_SLOT_IDS.map((id) => {
        const label = SLOT_LABELS[id] || `槽位 ${id}`;
        return `<div class="uiequip-slot" data-slot="${id}" title="${label}"></div>`;
      }).join('');
    }

    bindSlotInteractions();
    syncShellUi();
  }

  function isEquipBodyVisible() {
    return windowMode === 'equip' && equipTab === 'equip';
  }

  function setWindowMode(mode) {
    if (mode !== 'equip' && mode !== 'deco') return;
    windowMode = mode;
    syncShellUi();
  }

  function setEquipTab(tab) {
    if (tab !== 'equip' && tab !== 'pet') return;
    equipTab = tab;
    if (tab !== 'equip') {
      symbolOpen = false;
    }
    syncShellUi();
  }

  function setDecoTab(tab) {
    if (tab !== 'coordi' && tab !== 'android' && tab !== 'damageSkin') return;
    decoTab = tab;
    syncShellUi();
  }

  function setSymbolOpen(next) {
    symbolOpen = !!next;
    if (symbolOpen) {
      windowMode = 'equip';
      equipTab = 'equip';
    }
    syncShellUi();
  }

  function toggleSymbolPanel() {
    setSymbolOpen(!symbolOpen);
  }

  function setSymbolPage(page) {
    if (page !== 'arc' && page !== 'aut' && page !== 'grand') return;
    symbolPage = page;
    syncShellUi();
  }

  function toggleSymbolNext() {
    if (symbolPage === 'grand') setSymbolPage('aut');
    else if (symbolPage === 'aut') setSymbolPage('grand');
  }

  function syncShellUi() {
    const panel = $('uiEquipPanel');
    if (panel) {
      panel.dataset.window = windowMode;
      panel.dataset.equipTab = equipTab;
      panel.dataset.decoTab = decoTab;
      panel.dataset.symbolPage = symbolPage;
    }

    $('uiEquipTabEquip')?.classList.toggle('is-selected', equipTab === 'equip');
    $('uiEquipTabPet')?.classList.toggle('is-selected', equipTab === 'pet');
    $('uiEquipTabCoordi')?.classList.toggle('is-selected', decoTab === 'coordi');
    $('uiEquipTabAndroid')?.classList.toggle('is-selected', decoTab === 'android');
    $('uiEquipTabDamageSkin')?.classList.toggle('is-selected', decoTab === 'damageSkin');

    document.querySelectorAll('#uiEquipDecoPages .uiequip-deco-page').forEach((el) => {
      el.classList.toggle('is-active', el.getAttribute('data-deco-page') === decoTab);
    });

    const symbolVisible = symbolOpen && isEquipBodyVisible();
    const symbolPanel = $('uiEquipSymbolPanel');
    const symbolBtn = $('uiEquipSymbolBtn');
    if (symbolPanel) symbolPanel.classList.toggle('is-hidden', !symbolVisible);
    if (symbolBtn) {
      symbolBtn.classList.toggle('is-open', symbolVisible);
      symbolBtn.setAttribute('aria-pressed', symbolVisible ? 'true' : 'false');
    }
    $('uiEquipSymbolTabArc')?.classList.toggle('is-selected', symbolPage === 'arc');
    $('uiEquipSymbolTabAut')?.classList.toggle('is-selected', symbolPage === 'aut' || symbolPage === 'grand');
    document.querySelectorAll('#uiEquipSymbolPanel .uiequip-symbol-page').forEach((el) => {
      el.classList.toggle('is-active', el.getAttribute('data-symbol-page') === symbolPage);
    });

    syncTotemPanelUi();
  }

  function setTotemPanelOpen(next) {
    totemPanelOpen = !!next;
    syncTotemPanelUi();
  }

  function toggleTotemPanel() {
    setTotemPanelOpen(!totemPanelOpen);
  }

  function syncTotemPanelUi() {
    const panel = $('uiEquipTotemPanel');
    const btn = $('uiEquipTotemBtn');
    const visible = totemPanelOpen && isEquipBodyVisible();
    if (panel) panel.classList.toggle('is-hidden', !visible);
    if (btn) {
      btn.classList.toggle('is-open', visible);
      btn.setAttribute('aria-pressed', visible ? 'true' : 'false');
    }
  }

  function beginDragHideTooltip() {
    if (typeof EquipTooltipModule !== 'undefined') {
      EquipTooltipModule.beginDrag?.();
    }
  }

  function endDragHideTooltip() {
    if (typeof EquipTooltipModule !== 'undefined') {
      EquipTooltipModule.endDrag?.();
    }
  }

  function getWornPotentialRank(entry) {
    const hasLines = (pot) => Array.isArray(pot?.lines) && pot.lines.length > 0;
    const fromState = entry?.state?.potential;
    if (hasLines(fromState) && fromState.rank) return String(fromState.rank).toLowerCase();

    const template = getItemData(entry?.itemId);
    const fromTemplate = template?.potential;
    if (hasLines(fromTemplate) && fromTemplate.rank) return String(fromTemplate.rank).toLowerCase();
    return null;
  }

  function refreshSlotContents() {
    const coat = getItemData(activeWear['5']?.itemId);
    const pantsLocked = coat?.islot === 'MaPn';
    const rankClasses = ['rare', 'epic', 'unique', 'legendary']
      .map((r) => `uiequip-potential-${r}`);

    document.querySelectorAll('#uiEquipSlots .uiequip-slot, #uiEquipTotemSlots .uiequip-slot').forEach((el) => {
      const id = el.getAttribute('data-slot');
      const entry = activeWear[id];
      const item = getItemData(entry?.itemId);

      el.classList.remove(...rankClasses);
      el.classList.toggle('is-filled', !!item);
      el.classList.toggle('is-locked', id === '6' && pantsLocked);
      el.innerHTML = '';

      if (item) {
        const rank = getWornPotentialRank(entry);
        if (rank && ['rare', 'epic', 'unique', 'legendary'].includes(rank)) {
          el.classList.add(`uiequip-potential-${rank}`);
        }

        const img = document.createElement('img');
        img.className = 'uiequip-slot-icon';
        img.src = (typeof getEquipDisplayIcon === 'function'
          ? getEquipDisplayIcon(item)
          : item.equipIcon || item.icon);
        img.alt = item.name;
        img.draggable = true;
        img.dataset.uiSlot = id;
        img.dataset.itemId = entry.itemId;
        img.ondragstart = (e) => {
          beginDragHideTooltip();
          e.dataTransfer.setData('text/plain', JSON.stringify({
            source: 'body',
            uiSlot: id,
            itemId: entry.itemId,
            tab: 'equip',
          }));
          e.dataTransfer.effectAllowed = 'move';
        };
        img.ondragend = () => endDragHideTooltip();
        img.addEventListener('click', (e) => {
          if (typeof InventoryModule === 'undefined' || !InventoryModule.pendingPotentialScrollId) {
            return;
          }
          e.preventDefault();
          e.stopPropagation();
          InventoryModule.applyPendingPotentialScrollToEquip(entry.itemId, `body:${id}`);
        });
        el.appendChild(img);
        el.removeAttribute('title');
      } else {
        el.title = SLOT_LABELS[id] || `槽位 ${id}`;
      }
    });
    refreshSymbolSlots();
  }

  function formatSymbolNum(n) {
    const v = Math.max(0, Math.floor(Number(n) || 0));
    return v.toLocaleString('en-US');
  }

  function symbolFontDir(kind) {
    if (kind === 'arcaneSymbol') return 'ArcEquip';
    if (kind === 'grandSymbol') return 'GrandAutEquip';
    return 'AutEquip';
  }

  function symbolKindForPage(pageId) {
    if (pageId === 'arc') return 'arcaneSymbol';
    if (pageId === 'grand') return 'grandSymbol';
    return 'authenticSymbol';
  }

  function symbolGlyphFile(ch) {
    if (ch === '+') return 'plus';
    if (ch === '%') return 'pct';
    if (ch === 'lv') return 'lv';
    return String(ch);
  }

  function jobStatGlyph(job) {
    if (job?.mode === 'da') return 'hp';
    const lab = String(job?.labels?.[0] || 'STR').toUpperCase();
    if (lab === 'DEX') return 'dex';
    if (lab === 'INT') return 'int';
    if (lab === 'LUK') return 'luk';
    if (lab === '最大HP' || lab === 'HP') return 'hp';
    return 'str';
  }

  function textDownTokensFor(info) {
    const lv = Math.max(1, Math.floor(Number(info?.level) || 1));
    return ['lv', ...String(lv).split('')];
  }

  function appendGlyphs(parent, kind, band, tokens) {
    const dir = symbolFontDir(kind);
    tokens.forEach((ch) => {
      const img = document.createElement('img');
      img.className = 'uiequip-symbol-glyph';
      img.src = `images/UIEquip/Symbol/${dir}/${band}/${symbolGlyphFile(ch)}.png`;
      img.alt = '';
      img.draggable = false;
      parent.appendChild(img);
    });
  }

  function appendSymbolFont(el, kind, band, tokens) {
    const wrap = document.createElement('span');
    wrap.className = band === 'textUp' ? 'uiequip-symbol-textup' : 'uiequip-symbol-textdown';
    wrap.setAttribute('aria-hidden', 'true');
    appendGlyphs(wrap, kind, band, tokens);
    el.appendChild(wrap);
  }

  function renderSymbolTotals(page, totals) {
    const box = page.querySelector('.uiequip-symbol-totals');
    if (!box) return;
    box.replaceChildren();
    const pageId = page.getAttribute('data-symbol-page');
    const kind = symbolKindForPage(pageId);
    const job = totals?.job;
    const lines = [];
    const forceVal = pageId === 'arc' ? (Number(totals?.arc) || 0) : (Number(totals?.aut) || 0);
    lines.push({ name: 'force', value: forceVal });
    if (pageId !== 'grand') {
      if (job?.mode === 'xenon') {
        lines.push({ name: 'str', value: Number(totals?.mains?.STR) || 0 });
        lines.push({ name: 'dex', value: Number(totals?.mains?.DEX) || 0 });
        lines.push({ name: 'luk', value: Number(totals?.mains?.LUK) || 0 });
      } else {
        lines.push({ name: jobStatGlyph(job), value: Number(totals?.displayMain) || 0 });
      }
    }
    const startY = lines.length === 1 ? 33 : 22;
    lines.forEach((line, i) => {
      const y = startY + (i * 16);
      const nameRow = document.createElement('span');
      nameRow.className = 'uiequip-symbol-total-line';
      nameRow.style.left = '46px';
      nameRow.style.top = `${y}px`;
      appendGlyphs(nameRow, kind, 'textUp', [line.name]);
      box.appendChild(nameRow);
      const numRow = document.createElement('span');
      numRow.className = 'uiequip-symbol-total-line';
      numRow.style.left = '78px';
      numRow.style.top = `${y}px`;
      appendGlyphs(numRow, kind, 'textUp', ['+', ...String(Math.max(0, Math.floor(line.value))).split('')]);
      box.appendChild(numRow);
    });
  }

  function refreshSymbolSlots() {
    const totals = typeof SymbolForce !== 'undefined' ? SymbolForce.totals() : null;
    document.querySelectorAll('#uiEquipSymbolPanel .uiequip-symbol-page').forEach((page) => {
      renderSymbolTotals(page, totals);
    });

    document.querySelectorAll('#uiEquipSymbolPanel .uiequip-symbol-slot').forEach((el) => {
      const slotId = el.getAttribute('data-symbol-slot');
      const entry = symbolWear[slotId];
      const item = getItemData(entry?.itemId);
      const info = (item && typeof SymbolForce !== 'undefined')
        ? SymbolForce.inspect(entry.itemId, entry.state, item)
        : null;
      el.classList.toggle('is-filled', !!item);
      el.querySelectorAll('.uiequip-slot-icon, .uiequip-symbol-lv, .uiequip-symbol-textup, .uiequip-symbol-textdown, .uiequip-symbol-gauge, .uiequip-symbol-max').forEach((node) => node.remove());

      const enchant = el.querySelector('.uiequip-symbol-enchant');
      if (enchant) {
        const can = !!info?.canEnhance;
        enchant.hidden = !can;
        enchant.disabled = !can;
        enchant.classList.toggle('is-disabled', !can);
        enchant.setAttribute('aria-disabled', can ? 'false' : 'true');
        enchant.title = can
          ? `強化（${formatSymbolNum(info.meso)} 楓幣）`
          : (info?.atMax ? '已達最高等級' : '強化');
      }

      if (item) {
        el.title = `${item.name}  Lv.${info?.level || 1}`;
        const img = document.createElement('img');
        img.className = 'uiequip-slot-icon';
        img.src = item.icon || '';
        img.alt = item.name;
        img.draggable = false;
        img.dataset.uiSlot = slotId;
        img.dataset.itemId = entry.itemId;
        el.appendChild(img);
        if (info) {
          appendSymbolFont(el, info.kind, 'textDown', textDownTokensFor(info));
          const dir = symbolFontDir(info.kind);
          if (info.atMax) {
            const maxEl = document.createElement('span');
            maxEl.className = 'uiequip-symbol-max';
            const maxImg = document.createElement('img');
            maxImg.src = `images/UIEquip/Symbol/${dir}/maxLv.png`;
            maxImg.alt = 'MAX';
            maxImg.draggable = false;
            maxEl.appendChild(maxImg);
            el.appendChild(maxEl);
          } else if (!info.canEnhance) {
            const need = Number(info.need) || 0;
            const ratio = need > 0 ? Math.max(0, Math.min(1, (Number(info.exp) || 0) / need)) : 0;
            const gauge = document.createElement('span');
            gauge.className = 'uiequip-symbol-gauge';
            gauge.style.width = `${Math.round(24 * ratio)}px`;
            const fill = document.createElement('img');
            fill.src = `images/UIEquip/Symbol/${dir}/gauge.png`;
            fill.alt = '';
            fill.draggable = false;
            gauge.appendChild(fill);
            el.appendChild(gauge);
          }
        }
      } else {
        el.title = el.classList.contains('uiequip-symbol-slot-arc')
          ? '神秘符文'
          : (el.classList.contains('uiequip-symbol-slot-grand') ? '豪華真實符文' : '真實符文');
      }
    });
  }

  function bindSlotInteractions() {
    document.querySelectorAll('#uiEquipSlots .uiequip-slot, #uiEquipTotemSlots .uiequip-slot').forEach((el) => {
      el.ondragover = (e) => {
        e.preventDefault();
        el.classList.add('is-drag-over');
      };
      el.ondragleave = () => el.classList.remove('is-drag-over');
      el.ondrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        el.classList.remove('is-drag-over');
        handleBodyDrop(e, el.getAttribute('data-slot'));
      };
      el.ondblclick = (e) => {
        if (typeof InventoryModule !== 'undefined' && InventoryModule.pendingPotentialScrollId) {
          e.preventDefault();
          e.stopPropagation();
          return;
        }
        if (!e.target?.closest?.('img')) return;
        const slotId = el.getAttribute('data-slot');
        const entry = activeWear[String(slotId)];
        if (!entry?.itemId) return;
        if (enchantOpen) {
          moveWornSlotToEnchant(slotId);
          return;
        }
        unequipSlot(slotId);
      };
    });
  }

  function handleBodyDrop(e, uiSlotId) {
    if (isIdleDeathEquipLocked()) {
      warnDeathEquipLocked();
      return;
    }
    const raw = e.dataTransfer.getData('text/plain');
    if (!raw) return;
    try {
      const data = JSON.parse(raw);
      if (data.source === 'body') {
        if (String(data.uiSlot) === String(uiSlotId)) return;
        const fromSlot = String(data.uiSlot);
        const entry = activeWear[fromSlot];
        if (!entry) return;
        const item = getItemData(entry.itemId);
        if (!item || !isSlotCompatible(uiSlotId, item)) {
          if (typeof addLog === 'function') {
            addLog('[裝備欄] 槽位類型不符，無法移動。', 'log-fail');
          }
          return;
        }

        const targetId = String(uiSlotId);
        const displaced = activeWear[targetId];
        activeWear[fromSlot] = null;
        activeWear[targetId] = entry;

        // 同 itemId 也可能是不同強化實體，不可丟棄 displaced
        if (displaced) {
          if (isSlotCompatible(fromSlot, getItemData(displaced.itemId))) {
            activeWear[fromSlot] = displaced;
          } else if (!returnEntryToBagOrWarn(displaced)) {
            activeWear[fromSlot] = entry;
            activeWear[targetId] = displaced;
            if (typeof addLog === 'function') {
              addLog('[裝備欄] 背包已滿，無法移動裝備。', 'log-fail');
            }
            return;
          }
        }

        refresh();
        scheduleSave();
        return;
      }

      if (data.tab && data.tab !== 'equip') return;
      if (!Number.isInteger(data.slotIndex)) return;
      const itemId = data.itemId || playerInventoryEquip[data.slotIndex];
      const item = getItemData(itemId);
      if (!item || !isSlotCompatible(uiSlotId, item)) {
        if (typeof addLog === 'function') {
          addLog('[裝備欄] 槽位類型不符，無法穿上。', 'log-fail');
        }
        return;
      }
      if (!meetsLevelReq(item)) {
        if (typeof addLog === 'function') {
          addLog(`[裝備欄] 角色等級不足，無法穿上【${item.name}】（需要 Lv.${item.reqLevel}）。`, 'log-fail');
        }
        return;
      }
      wearFromBag(itemId, data.slotIndex, uiSlotId);
    } catch (err) {
      console.error('[UiEquip] drop failed', err);
    }
  }

  function syncPresetSelected() {
    const el = $('uiEquipPresetSelected');
    const pos = PRESET_POS[pendingPreset];
    if (!el || !pos) return;
    el.style.left = `${pos.left - PRESET_SELECTED_ORIGIN.x + PRESET_SELECTED_NUDGE.x}px`;
    el.style.top = `${pos.top - PRESET_SELECTED_ORIGIN.y + PRESET_SELECTED_NUDGE.y}px`;

    [1, 2, 3].forEach((n) => {
      const btn = $(`uiEquipPreset${n}`);
      if (btn) btn.classList.toggle('is-checked', n === pendingPreset);
    });
  }

  let enchantOpen = false;
  let equipOpen = false;

  function syncMenuButtons() {
    $('btnViewEnchant')?.classList.toggle('is-active', enchantOpen);
    $('btnViewEquip')?.classList.toggle('is-active', equipOpen);
  }

  function setEnchantOpen(next) {
    const wantOpen = !!next;
    // 關閉強化頁時清除強化焦點（進度已寫回原位置，不需空背包）
    if (enchantOpen && !wantOpen && typeof currentEnchantItem !== 'undefined' && currentEnchantItem) {
      if (typeof unloadEquipFromSlot === 'function') {
        unloadEquipFromSlot({ silent: true });
      }
    }
    enchantOpen = wantOpen;
    const wb = $('enchantWorkbench');
    const main = $('mainContentPanel');
    const sidebar = document.querySelector('#pageEnhance .ms-sidebar');
    if (wb) wb.classList.toggle('hidden', !enchantOpen);
    if (main) main.classList.toggle('hidden', !enchantOpen);
    if (sidebar) sidebar.classList.toggle('hidden', !enchantOpen);
    if (enchantOpen && typeof PanelDrag !== 'undefined') {
      PanelDrag.bringFront(wb || main);
    }
    syncMenuButtons();
    if (typeof IdleHunt !== 'undefined') IdleHunt.syncBlockingPanelPause?.();
  }

  function setEquipOpen(next) {
    equipOpen = !!next;
    const equip = $('uiEquipPanel');
    if (equip) equip.classList.toggle('hidden', !equipOpen);
    if (equipOpen && typeof PanelDrag !== 'undefined') {
      PanelDrag.bringFront(equip);
    }
    syncMenuButtons();
    if (equipOpen) refreshSlotContents();
    if (typeof InventoryModule !== 'undefined' && typeof InventoryModule.render === 'function') {
      InventoryModule.render();
    }
  }

  function toggleEnchant() {
    setEnchantOpen(!enchantOpen);
  }

  function toggleEquip() {
    setEquipOpen(!equipOpen);
  }

  /** @deprecated 改為獨立開關；保留相容：mode=equip 開裝備，否則開強化 */
  function setViewMode(mode) {
    if (mode === 'equip') {
      setEquipOpen(true);
      return;
    }
    setEnchantOpen(true);
  }

  function isEquipOpen() {
    return equipOpen;
  }

  function isEnchantOpen() {
    return enchantOpen;
  }

  /** 雙擊背包優先：裝備欄開啟時穿上 */
  function isEquipView() {
    return isEquipOpen();
  }

  /** 目前預設已穿裝備（唯讀列表，供屬性統計面板） */
  function getActiveWearEntries() {
    const body = SLOT_IDS.map((id) => {
      const entry = activeWear[id];
      if (!entry?.itemId) return null;
      return {
        slotId: id,
        label: SLOT_LABELS[id] || `槽位 ${id}`,
        itemId: entry.itemId,
        state: entry.state || null,
      };
    }).filter(Boolean);
    return body.concat(getSymbolWearEntries());
  }

  function getSymbolWearEntries() {
    return SYMBOL_SLOT_IDS.map((id) => {
      const entry = symbolWear[id];
      if (!entry?.itemId) return null;
      return {
        slotId: id,
        label: id,
        itemId: entry.itemId,
        state: entry.state || null,
        instanceUid: entry.instanceUid || null,
      };
    }).filter(Boolean);
  }

  function refresh() {
    refreshSlotContents();
    if (typeof InventoryModule !== 'undefined') {
      if (typeof InventoryModule.render === 'function') InventoryModule.render();
      if (typeof InventoryModule.updateSlotCount === 'function') InventoryModule.updateSlotCount();
    }
    if (typeof EquipStatPanel !== 'undefined' && typeof EquipStatPanel.refresh === 'function') {
      EquipStatPanel.refresh();
    }
    if (typeof CharacterCombatPanel !== 'undefined'
      && typeof CharacterCombatPanel.syncFromEquippedWeapon === 'function') {
      CharacterCombatPanel.syncFromEquippedWeapon();
    }
    if (typeof UiCharacterInfo !== 'undefined' && typeof UiCharacterInfo.refresh === 'function') {
      UiCharacterInfo.refresh();
    }
    if (typeof IdleHunt !== 'undefined' && typeof IdleHunt.refreshDisplay === 'function') {
      IdleHunt.refreshDisplay();
    }
    if (typeof Paperdoll !== 'undefined' && typeof Paperdoll.refresh === 'function') {
      Paperdoll.refresh();
    }
  }

  function bind() {
    [1, 2, 3].forEach((n) => {
      $(`uiEquipPreset${n}`)?.addEventListener('click', () => selectPendingPreset(n));
    });
    $('uiEquipPresetApply')?.addEventListener('click', (e) => {
      e.preventDefault();
      applyPendingPreset();
    });
    $('uiEquipTabEquip')?.addEventListener('click', (e) => {
      e.preventDefault();
      setWindowMode('equip');
      setEquipTab('equip');
    });
    $('uiEquipTabPet')?.addEventListener('click', (e) => {
      e.preventDefault();
      setWindowMode('equip');
      setEquipTab('pet');
    });
    $('uiEquipTabCoordi')?.addEventListener('click', (e) => {
      e.preventDefault();
      setDecoTab('coordi');
    });
    $('uiEquipTabAndroid')?.addEventListener('click', (e) => {
      e.preventDefault();
      setDecoTab('android');
    });
    $('uiEquipTabDamageSkin')?.addEventListener('click', (e) => {
      e.preventDefault();
      setDecoTab('damageSkin');
    });
    $('uiEquipDecoUiBtn')?.addEventListener('click', (e) => {
      e.preventDefault();
      setWindowMode('deco');
    });
    $('uiEquipEquipUiBtn')?.addEventListener('click', (e) => {
      e.preventDefault();
      setWindowMode('equip');
    });
    $('uiEquipSymbolBtn')?.addEventListener('click', (e) => {
      e.preventDefault();
      toggleSymbolPanel();
    });
    $('uiEquipSymbolTabArc')?.addEventListener('click', (e) => {
      e.preventDefault();
      setSymbolPage('arc');
    });
    $('uiEquipSymbolTabAut')?.addEventListener('click', (e) => {
      e.preventDefault();
      setSymbolPage('aut');
    });
    $('uiEquipSymbolNext')?.addEventListener('click', (e) => {
      e.preventDefault();
      toggleSymbolNext();
    });
    $('uiEquipSymbolNextGrand')?.addEventListener('click', (e) => {
      e.preventDefault();
      toggleSymbolNext();
    });
    const symbolPanel = $('uiEquipSymbolPanel');
    if (symbolPanel && !symbolPanel.dataset.symbolReady) {
      symbolPanel.dataset.symbolReady = '1';
      symbolPanel.addEventListener('click', (e) => {
        const btn = e.target.closest('.uiequip-symbol-enchant');
        if (!btn || btn.disabled) return;
        e.preventDefault();
        e.stopPropagation();
        const slot = btn.closest('.uiequip-symbol-slot')?.getAttribute('data-symbol-slot');
        if (slot) enhanceSymbolSlot(slot);
      });
      symbolPanel.addEventListener('dblclick', (e) => {
        if (e.target.closest('.uiequip-symbol-enchant')) return;
        const slotEl = e.target.closest('.uiequip-symbol-slot');
        if (!slotEl) return;
        const slotId = slotEl.getAttribute('data-symbol-slot');
        if (symbolWear[slotId]?.itemId) unequipSlot(slotId);
      });
      symbolPanel.addEventListener('dragover', (e) => {
        const slotEl = e.target.closest('.uiequip-symbol-slot');
        if (!slotEl) return;
        e.preventDefault();
        slotEl.classList.add('is-drag-over');
      });
      symbolPanel.addEventListener('dragleave', (e) => {
        const slotEl = e.target.closest('.uiequip-symbol-slot');
        if (!slotEl) return;
        slotEl.classList.remove('is-drag-over');
      });
      symbolPanel.addEventListener('drop', (e) => {
        const slotEl = e.target.closest('.uiequip-symbol-slot');
        if (!slotEl) return;
        e.preventDefault();
        e.stopPropagation();
        slotEl.classList.remove('is-drag-over');
        handleBodyDrop(e, slotEl.getAttribute('data-symbol-slot'));
      });
      if (typeof EquipTooltipModule !== 'undefined' && typeof EquipTooltipModule.bindUiEquipHost === 'function') {
        EquipTooltipModule.bindUiEquipHost('uiEquipSymbolPanel');
      }
    }
    $('uiEquipTotemBtn')?.addEventListener('click', (e) => {
      e.preventDefault();
      toggleTotemPanel();
    });
    $('btnViewEnchant')?.addEventListener('click', (e) => {
      e.preventDefault();
      toggleEnchant();
    });
    $('btnViewEquip')?.addEventListener('click', (e) => {
      e.preventDefault();
      toggleEquip();
    });
    $('uiEquipClose')?.addEventListener('click', (e) => {
      e.preventDefault();
      setEquipOpen(false);
    });
  }

  function init() {
    if (inited) return;
    inited = true;
    renderSlots();
    syncPresetSelected();
    syncShellUi();
    bind();
    refreshSlotContents();
    if (typeof Paperdoll !== 'undefined' && typeof Paperdoll.initEquip === 'function') {
      Paperdoll.initEquip();
    }
    setEnchantOpen(false);
    setEquipOpen(false);
  }

  function serializeWearMap(map, ids = SLOT_IDS) {
    const out = {};
    ids.forEach((id) => {
      const entry = map?.[id];
      if (!entry?.itemId) return;
      const itemId = (typeof resolveEquipItemId === 'function'
        ? resolveEquipItemId(entry.itemId)
        : entry.itemId) || entry.itemId;
      let state = cloneState(entry.state);
      if (state && typeof state === 'object') {
        if (typeof stampEnchantItemId === 'function') stampEnchantItemId(state, itemId);
        else {
          state.itemId = itemId;
          state.id = itemId;
        }
      }
      out[id] = {
        itemId,
        state,
        ...(entry.instanceUid ? { instanceUid: entry.instanceUid } : {}),
      };
    });
    return out;
  }

  /**
   * 還原穿著。
   * - 字串 layout（舊存檔）：從背包取出實體
   * - { itemId, state }（新存檔）：穿著本體已在存檔內，不可再依 itemId 從背包抽，
   *   否則背包若另有同 ID 會被誤拿走（重新載入後物品欄少一件）
   */
  function hydrateWearMap(map, src, { pullFromBag = false, ids = SLOT_IDS } = {}) {
    ids.forEach((id) => { map[id] = null; });
    if (!src || typeof src !== 'object') return;

    ids.forEach((id) => {
      const raw = src[id];
      let itemId = null;
      let state = null;
      let legacyIdOnly = false;

      if (typeof raw === 'string' && raw) {
        itemId = raw;
        legacyIdOnly = true;
      } else if (raw && typeof raw === 'object' && raw.itemId) {
        itemId = raw.itemId;
        state = cloneState(raw.state);
      }
      if (typeof resolveEquipItemId === 'function') {
        itemId = resolveEquipItemId(itemId) || itemId;
      }
      if (!itemId || !getItemData(itemId)) return;
      if (state && typeof state === 'object') {
        if (typeof stampEnchantItemId === 'function') stampEnchantItemId(state, itemId);
        else {
          state.itemId = itemId;
          state.id = itemId;
        }
      }

      // 僅舊版「只存 itemId」才從背包抽；完整物件直接還原
      if (pullFromBag && legacyIdOnly) {
        const bagIdx = findBagIndexByItemId(itemId);
        if (bagIdx >= 0) {
          const taken = takeFromBag(bagIdx);
          if (taken) {
            map[id] = taken;
            return;
          }
        }
        // 背包找不到就略過（舊存檔無法憑空生出實體）
        return;
      }

      map[id] = {
        itemId,
        state,
        ...(raw && typeof raw === 'object' && raw.instanceUid ? { instanceUid: raw.instanceUid } : {}),
      };
    });
  }

  function exportState() {
    const byPreset = { 1: {}, 2: {}, 3: {} };
    [1, 2, 3].forEach((n) => {
      byPreset[n] = serializeWearMap(presetWear[n]);
    });

    return {
      // 相容舊欄位：active = 目前 preset 的完整穿著
      bodyWearActive: serializeWearMap(activeWear),
      bodyWearByPreset: byPreset,
      symbolWear: serializeWearMap(symbolWear, SYMBOL_SLOT_IDS),
      activeEquipPreset: activePreset,
      pendingEquipPreset: pendingPreset,
    };
  }

  function clearAllPresets() {
    [1, 2, 3].forEach((n) => {
      SLOT_IDS.forEach((id) => {
        presetWear[n][id] = null;
      });
    });
    pendingPreset = 1;
    setActivePreset(1);
    if (inited) refresh();
  }

  function importState(data) {
    if (!data) return;

    // 完整存檔的 bodyWear 已是獨立實體；不可先把目前穿著卸回背包，
    // 否則會與存檔穿著重複（匯入後背包多一套、身上又一套）。
    [1, 2, 3].forEach((n) => {
      SLOT_IDS.forEach((id) => {
        presetWear[n][id] = null;
      });
    });

    const presetNo = PRESET_POS[data.activeEquipPreset] ? data.activeEquipPreset : 1;
    pendingPreset = PRESET_POS[data.pendingEquipPreset]
      ? data.pendingEquipPreset
      : presetNo;

    const byPreset = data.bodyWearByPreset;
    let loadedFromPresets = false;

    if (byPreset && typeof byPreset === 'object') {
      [1, 2, 3].forEach((n) => {
        const src = byPreset[n];
        if (!src || typeof src !== 'object') return;

        const sample = SLOT_IDS.map((id) => src[id]).find((v) => v != null);
        if (sample == null) return;

        loadedFromPresets = true;
        if (typeof sample === 'string') {
          applyLayoutToPreset(n, src);
        } else {
          hydrateWearMap(presetWear[n], src, { pullFromBag: false });
        }
      });
    }

    // 舊存檔只有 bodyWearActive，或 byPreset 為空：灌入目前 preset
    if (!loadedFromPresets && data.bodyWearActive && typeof data.bodyWearActive === 'object') {
      const sample = SLOT_IDS.map((id) => data.bodyWearActive[id]).find((v) => v != null);
      if (typeof sample === 'string') {
        applyLayoutToPreset(presetNo, data.bodyWearActive);
      } else {
        hydrateWearMap(presetWear[presetNo], data.bodyWearActive, { pullFromBag: false });
      }
    }

    setActivePreset(presetNo);
    hydrateWearMap(symbolWear, data.symbolWear, { pullFromBag: false, ids: SYMBOL_SLOT_IDS });
    SYMBOL_SLOT_IDS.forEach((id) => {
      const entry = symbolWear[id];
      if (!entry?.itemId || typeof ItemStore === 'undefined') return;
      if (entry.instanceUid && ItemStore.get(entry.instanceUid)) {
        ItemStore.move(entry.instanceUid, { type: 'symbol', slot: id });
      } else {
        const uid = ItemStore.ensureSymbolUid(id, entry);
        if (uid) entry.instanceUid = uid;
      }
    });
    syncPresetSelected();
    refresh();
  }

  function getWornItemIds() {
    const set = new Set();
    forEachWornEntry((entry) => {
      if (entry?.itemId) set.add(entry.itemId);
    });
    return set;
  }

  function forEachWornEntry(fn) {
    if (typeof fn !== 'function') return;
    [1, 2, 3].forEach((n) => {
      SLOT_IDS.forEach((id) => {
        const entry = presetWear[n][id];
        if (entry?.itemId) fn(entry, id, n);
      });
    });
    SYMBOL_SLOT_IDS.forEach((id) => {
      const entry = symbolWear[id];
      if (entry?.itemId) fn(entry, id, 'symbol');
    });
  }

  function getWornEntry(uiSlotId) {
    const id = String(uiSlotId);
    if (isSymbolSlotId(id)) return symbolWear[id] || null;
    return activeWear[id] || null;
  }

  function saveWornEntryState(uiSlotId, state) {
    const id = String(uiSlotId);
    const entry = isSymbolSlotId(id) ? symbolWear[id] : activeWear[id];
    if (!entry?.itemId || !state) return false;
    entry.state = cloneState(state);
    if (typeof syncEnchantStateFromModules === 'function') {
      syncEnchantStateFromModules(entry.state);
    }
    scheduleSave();
    return true;
  }

  /** 背包 hover 比較用：同部位目前穿著（多槽取第一件有裝的） */
  function findWornCompareEntry(item) {
    const candidates = getCandidateSlots(item);
    if (!candidates.length) return null;
    for (const id of candidates) {
      const entry = isSymbolSlotId(id) ? symbolWear[id] : activeWear[id];
      if (entry?.itemId) {
        return {
          slotId: String(id),
          itemId: entry.itemId,
          state: entry.state,
        };
      }
    }
    return null;
  }

  return {
    init,
    setViewMode,
    setEnchantOpen,
    setEquipOpen,
    toggleEnchant,
    toggleEquip,
    isEnchantOpen,
    isEquipOpen,
    setPreset,
    selectPendingPreset,
    applyPendingPreset,
    getSelectedPreset: () => pendingPreset,
    getActivePreset: () => activePreset,
    isEquipView,
    wearFromBag,
    moveWornSlotToEnchant,
    patchActiveWearState,
    unequipSlot,
    unequipItemId,
    unequipIncompatibleWeapons,
    destroyWornItem,
    destroyWornSlot,
    putEntryToBag,
    isItemWorn,
    getWornItemIds,
    forEachWornEntry,
    unequipBagIndex,
    isBagWornAnywhere,
    isBagWornActive,
    getActiveWornBagIndices,
    remapBagIndices,
    exportState,
    importState,
    clearAllPresets,
    getWornEntry,
    saveWornEntryState,
    findWornCompareEntry,
    getActiveWearEntries,
    getSymbolWearEntries,
    previewWearEntries,
    refresh,
    setWindowMode,
    setEquipTab,
    setDecoTab,
    setSymbolOpen,
    setSymbolPage,
  };
})();
