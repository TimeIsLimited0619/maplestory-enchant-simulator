/**
 * 裝備欄（UIEquip）
 * 穿脫：從背包取出實體（itemId + state）放入身體槽；整理背包不影響已穿裝備
 */
const UiEquipModule = (() => {
  const SLOT_IDS = [
    '1', '2', '3', '4', '5', '6', '7', '8', '9',
    '10', '11', '12', '13', '15', '16', '17',
    '21', '22', '28', '31', '32', '33', '34', '35', '36', '37',
  ];

  const SLOT_LABELS = {
    1: '帽子', 2: '臉飾', 3: '眼飾', 4: '耳環', 5: '上衣', 6: '褲/裙',
    7: '鞋子', 8: '手套', 9: '披風', 10: '輔助武器', 11: '武器',
    12: '戒指', 13: '戒指', 15: '戒指', 16: '戒指', 17: '墜飾',
    21: '勳章', 22: '腰帶', 28: '肩膀裝飾', 31: '口袋道具', 32: '機器人',
    33: '機器心臟', 34: '胸章', 35: '能源', 36: '墜飾', 37: '神之子輔助武器',
  };

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
    Ri: ['12', '13', '15', '16'],
    Pe: ['17', '36'],
    Md: ['21'], Me: ['21'],
    Be: ['22'],
    Sh: ['28'],
    Po: ['31'],
    Ex: ['31'], // 舊碼相容
    Tm: ['33'],
    Ba: ['34'],
    Em: ['35'],
  };

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

  /** 三組 preset 各自保留完整穿著 { itemId, state }；切換只換顯示，不拆回背包 */
  const presetWear = {
    1: emptyWearMap(),
    2: emptyWearMap(),
    3: emptyWearMap(),
  };
  /** 目前顯示中的穿著（永遠指向 presetWear[activePreset]） */
  let activeWear = presetWear[1];

  function emptyWearMap() {
    const map = Object.create(null);
    SLOT_IDS.forEach((id) => { map[id] = null; });
    return map;
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
      return state;
    }
  }

  function scheduleSave() {
    if (typeof SessionPersistenceModule !== 'undefined') {
      SessionPersistenceModule.scheduleSave();
    }
  }

  function getCandidateSlots(item) {
    if (!item) return [];
    return (ISLOT_TO_SLOTS[item.islot || ''] || []).slice();
  }

  function isSlotCompatible(uiSlotId, item) {
    return getCandidateSlots(item).includes(String(uiSlotId));
  }

  function resolveWearTarget(item, preferredSlotId) {
    const candidates = getCandidateSlots(item);
    if (!candidates.length) return null;
    if (preferredSlotId != null) {
      const pref = String(preferredSlotId);
      return candidates.includes(pref) ? pref : null;
    }
    const empty = candidates.find((id) => !activeWear[id]);
    return empty || candidates[0];
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
    for (let i = 0; i < playerInventoryEquip.length; i++) {
      if (playerInventoryEquip[i] !== itemId) continue;
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

  /** 若該背包格正在強化，先卸回背包（保留在原格） */
  function ensureEnchantUnloadedForBag(bagIndex) {
    if (typeof currentEnchantItem === 'undefined' || !currentEnchantItem) return;
    if (currentEnchantItem.slotIndex !== bagIndex) return;
    if (typeof unloadEquipFromSlot === 'function') unloadEquipFromSlot();
  }

  function ensureEnchantUnloadedForItemId(itemId) {
    if (!itemId || typeof currentEnchantItem === 'undefined' || !currentEnchantItem) return;
    const curId = currentEnchantItem.itemId || currentEnchantItem.id;
    if (curId !== itemId) return;
    if (typeof unloadEquipFromSlot === 'function') unloadEquipFromSlot();
  }

  /** 從背包取出實體 */
  function takeFromBag(bagIndex) {
    if (!Number.isInteger(bagIndex) || bagIndex < 0) return null;
    ensureEnchantUnloadedForBag(bagIndex);
    const itemId = playerInventoryEquip[bagIndex];
    if (!itemId) return null;
    const state = cloneState(playerInventoryState[bagIndex] ?? null);
    playerInventoryEquip[bagIndex] = null;
    playerInventoryState[bagIndex] = null;
    syncBagAlias();
    return { itemId, state };
  }

  /** 放回背包；成功回傳 bagIndex，失敗回傳 -1 並還原呼叫端需自行處理 */
  function putToBag(entry) {
    if (!entry?.itemId) return -1;
    const idx = findEmptyBagSlot();
    if (idx < 0) return -1;
    playerInventoryEquip[idx] = entry.itemId;
    playerInventoryState[idx] = cloneState(entry.state);
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

  function findSlotByItemId(itemId) {
    if (!itemId) return null;
    for (const id of SLOT_IDS) {
      if (activeWear[id]?.itemId === itemId) return id;
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

  /**
   * 穿上：從背包取出 → 放入身體槽；原槽有裝備則放回背包
   */
  function wearFromBag(itemId, bagIndex, preferredSlotId = null) {
    if (typeof EquipTooltipModule !== 'undefined') {
      EquipTooltipModule.hide(true);
    }
    if (!Number.isInteger(bagIndex) || bagIndex < 0) return false;
    const resolvedId = itemId || playerInventoryEquip[bagIndex];
    const item = getItemData(resolvedId);
    if (!item) return false;

    const target = resolveWearTarget(item, preferredSlotId);
    if (!target) {
      if (typeof addLog === 'function') {
        addLog(`[裝備欄]【${item.name}】沒有對應可穿槽位。`, 'log-fail');
      }
      return false;
    }

    const entry = takeFromBag(bagIndex);
    if (!entry) return false;

    // 套服清褲；穿褲時先脫套服
    if (item.islot === 'MaPn' && activeWear['6']) {
      if (!returnEntryToBagOrWarn(activeWear['6'])) {
        putToBag(entry);
        return false;
      }
      activeWear['6'] = null;
    }
    if (item.islot === 'Pn' && activeWear['5']) {
      const coat = getItemData(activeWear['5'].itemId);
      if (coat?.islot === 'MaPn') {
        if (!returnEntryToBagOrWarn(activeWear['5'])) {
          putToBag(entry);
          return false;
        }
        activeWear['5'] = null;
      }
    }

    // 若此件已穿在其他槽，清掉
    const existingSlot = findSlotByItemId(entry.itemId);
    if (existingSlot && existingSlot !== target) {
      activeWear[existingSlot] = null;
    }

    const displaced = activeWear[target];
    if (displaced && displaced.itemId !== entry.itemId) {
      if (!returnEntryToBagOrWarn(displaced)) {
        putToBag(entry);
        return false;
      }
    }

    activeWear[target] = entry;

    if (typeof addLog === 'function') {
      addLog(`[裝備欄] 已穿上【${item.name}】→ ${SLOT_LABELS[target] || target}`, 'log-success');
    }

    refresh();
    scheduleSave();
    return true;
  }

  function unequipSlot(uiSlotId, { silent = false } = {}) {
    if (typeof EquipTooltipModule !== 'undefined') {
      EquipTooltipModule.hide(true);
    }
    const id = String(uiSlotId);
    const entry = activeWear[id];
    if (!entry) return false;

    if (!returnEntryToBagOrWarn(entry)) return false;
    activeWear[id] = null;

    if (!silent && typeof addLog === 'function') {
      const item = getItemData(entry.itemId);
      if (item) addLog(`[裝備欄] 已脫下【${item.name}】`, 'log-info');
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
    dumpWearMapToBag(map);

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
    const host = $('uiEquipSlots');
    if (!host) return;
    host.innerHTML = SLOT_IDS.map((id) => {
      const label = SLOT_LABELS[id] || `槽位 ${id}`;
      return `<div class="uiequip-slot" data-slot="${id}" title="${label}"></div>`;
    }).join('');
    bindSlotInteractions();
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

    document.querySelectorAll('#uiEquipSlots .uiequip-slot').forEach((el) => {
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
        img.src = item.icon;
        img.alt = item.name;
        img.draggable = true;
        img.title = `${item.name}（雙擊脫下）`;
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
        el.title = item.name;
      } else {
        el.title = SLOT_LABELS[id] || `槽位 ${id}`;
      }
    });
  }

  function bindSlotInteractions() {
    document.querySelectorAll('#uiEquipSlots .uiequip-slot').forEach((el) => {
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
        // 強化台開啟時優先放入強化槽；否則卸回背包
        if (enchantOpen && typeof loadEquipToSlot === 'function') {
          loadEquipToSlot(entry.itemId, -1);
          refresh();
          return;
        }
        unequipSlot(slotId);
      };
    });
  }

  function handleBodyDrop(e, uiSlotId) {
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

        if (displaced && displaced.itemId !== entry.itemId) {
          if (isSlotCompatible(fromSlot, getItemData(displaced.itemId))) {
            activeWear[fromSlot] = displaced;
          } else if (!returnEntryToBagOrWarn(displaced)) {
            activeWear[fromSlot] = entry;
            activeWear[targetId] = displaced;
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

  let enchantOpen = true;
  let equipOpen = false;

  function syncMenuButtons() {
    $('btnViewEnchant')?.classList.toggle('is-active', enchantOpen);
    $('btnViewEquip')?.classList.toggle('is-active', equipOpen);
  }

  function setEnchantOpen(next) {
    enchantOpen = !!next;
    const wb = $('enchantWorkbench');
    if (wb) wb.classList.toggle('hidden', !enchantOpen);
    // 相容尚未包工作台時的舊 DOM
    const main = $('mainContentPanel');
    const sidebar = document.querySelector('#pageEnhance .ms-sidebar');
    if (!wb) {
      if (main) main.classList.toggle('hidden', !enchantOpen);
      if (sidebar) sidebar.classList.toggle('hidden', !enchantOpen);
    }
    if (enchantOpen && typeof PanelDrag !== 'undefined') {
      PanelDrag.bringFront(wb || main);
    }
    syncMenuButtons();
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
    return SLOT_IDS.map((id) => {
      const entry = activeWear[id];
      if (!entry?.itemId) return null;
      return {
        slotId: id,
        label: SLOT_LABELS[id] || `槽位 ${id}`,
        itemId: entry.itemId,
        state: entry.state || null,
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
    if (typeof UiCharacterInfo !== 'undefined' && typeof UiCharacterInfo.refresh === 'function') {
      UiCharacterInfo.refresh();
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
    bind();
    refreshSlotContents();
    setEnchantOpen(true);
    setEquipOpen(false);
  }

  function serializeWearMap(map) {
    const out = {};
    SLOT_IDS.forEach((id) => {
      const entry = map?.[id];
      if (!entry?.itemId) return;
      out[id] = {
        itemId: entry.itemId,
        state: cloneState(entry.state),
      };
    });
    return out;
  }

  function hydrateWearMap(map, src, { pullFromBag = true } = {}) {
    SLOT_IDS.forEach((id) => { map[id] = null; });
    if (!src || typeof src !== 'object') return;

    SLOT_IDS.forEach((id) => {
      const raw = src[id];
      let itemId = null;
      let state = null;

      if (typeof raw === 'string' && raw) {
        itemId = raw;
      } else if (raw && typeof raw === 'object' && raw.itemId) {
        itemId = raw.itemId;
        state = cloneState(raw.state);
      }
      if (!itemId || !getItemData(itemId)) return;

      if (pullFromBag) {
        const bagIdx = findBagIndexByItemId(itemId);
        if (bagIdx >= 0) {
          const taken = takeFromBag(bagIdx);
          if (taken) {
            map[id] = {
              itemId: taken.itemId,
              state: state != null ? state : taken.state,
            };
            return;
          }
        }
      }

      map[id] = { itemId, state };
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
      activeEquipPreset: activePreset,
      pendingEquipPreset: pendingPreset,
    };
  }

  function importState(data) {
    if (!data) return;

    [1, 2, 3].forEach((n) => {
      dumpWearMapToBag(presetWear[n]);
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
          hydrateWearMap(presetWear[n], src, { pullFromBag: true });
        }
      });
    }

    // 舊存檔只有 bodyWearActive，或 byPreset 為空：灌入目前 preset
    if (!loadedFromPresets && data.bodyWearActive && typeof data.bodyWearActive === 'object') {
      hydrateWearMap(presetWear[presetNo], data.bodyWearActive, { pullFromBag: true });
    }

    setActivePreset(presetNo);
    syncPresetSelected();
    refresh();
  }

  function getWornItemIds() {
    const set = new Set();
    [1, 2, 3].forEach((n) => {
      SLOT_IDS.forEach((id) => {
        const itemId = presetWear[n][id]?.itemId;
        if (itemId) set.add(itemId);
      });
    });
    return set;
  }

  /** 給 tooltip：目前穿在身上的 state */
  function getWornEntry(uiSlotId) {
    return activeWear[String(uiSlotId)] || null;
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
    unequipSlot,
    unequipItemId,
    isItemWorn,
    getWornItemIds,
    unequipBagIndex,
    isBagWornAnywhere,
    isBagWornActive,
    getActiveWornBagIndices,
    remapBagIndices,
    exportState,
    importState,
    getWornEntry,
    getActiveWearEntries,
    refresh,
  };
})();
