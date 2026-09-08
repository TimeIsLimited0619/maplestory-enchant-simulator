/**
 * Inventory Trunk（倉庫）資料與存取 API
 * 左欄共用格：equip / consume / etc；楓幣獨立。
 */
const TRUNK_SLOT_COUNT = typeof INVENTORY_SLOT_COUNT !== 'undefined' ? INVENTORY_SLOT_COUNT : 128;

let playerTrunkSlots = new Array(TRUNK_SLOT_COUNT).fill(null);
let playerTrunkMeso = 0;

function trunkCloneJson(value) {
  if (value == null) return null;
  try {
    if (typeof cloneEnchantState === 'function' && value && typeof value === 'object'
      && ('stars' in value || 'upgradeSlots' in value || 'potential' in value)) {
      return cloneEnchantState(value);
    }
  } catch (_) { /* fall through */ }
  try {
    return JSON.parse(JSON.stringify(value));
  } catch (_) {
    return null;
  }
}

function trunkFindEmptySlot(preferred = null) {
  if (Number.isInteger(preferred) && preferred >= 0 && preferred < TRUNK_SLOT_COUNT
    && !playerTrunkSlots[preferred]) {
    return preferred;
  }
  for (let i = 0; i < TRUNK_SLOT_COUNT; i += 1) {
    if (!playerTrunkSlots[i]) return i;
  }
  return -1;
}

function trunkConsumeIdentity(entry) {
  if (!entry) return '';
  const T = typeof CONSUME_ITEM_TYPE !== 'undefined' ? CONSUME_ITEM_TYPE : {};
  const type = entry.type || entry.consumeType || '';
  if (type === (T.STARFORCE_SCROLL || 'starforce_scroll') || entry.scrollId && type.includes('starforce')) {
    return `sf:${entry.scrollId}`;
  }
  if (type === (T.POTENTIAL_SCROLL || 'potential_scroll')) return `ps:${entry.scrollId}`;
  if (type === (T.CUBE || 'cube')) return `cube:${entry.cubeId}`;
  if (type === (T.ADD_CUBE || 'add_cube')) return `acube:${entry.cubeId}`;
  if (type === (T.HAMMER || 'hammer')) return `hm:${entry.hammerId}`;
  if (type === (T.GLORY_SCROLL || 'glory_scroll')) return `gs:${entry.scrollId}`;
  if (type === (T.BONUS_STAT || 'bonus_stat')) return `bs:${entry.itemId}`;
  if (type === (T.EXCEPTIONAL_HAMMER || 'exceptional_hammer')) return `eh:${entry.hammerId}`;
  if (type === (T.SOUL || 'soul')) return `soul:${entry.soulId}`;
  if (type === (T.RECOVERY_CARD || 'recovery_card')) return 'recovery_card';
  if (type === (T.POTION || 'potion')) return `pot:${entry.itemId}`;
  return `misc:${type}:${entry.scrollId || entry.cubeId || entry.hammerId || entry.itemId || entry.soulId || ''}`;
}

function trunkFindStackSlot(kind, meta) {
  for (let i = 0; i < TRUNK_SLOT_COUNT; i += 1) {
    const slot = playerTrunkSlots[i];
    if (!slot || slot.kind !== kind) continue;
    if (kind === 'consume' && trunkConsumeIdentity(slot) === trunkConsumeIdentity(meta)) return i;
    if (kind === 'etc' && String(slot.itemId) === String(meta.itemId)) return i;
  }
  return -1;
}

function trunkNormalizeConsumeType(entry) {
  if (!entry) return '';
  if (entry.type) return entry.type;
  if (typeof isStarForceScrollConsumeEntry === 'function' && isStarForceScrollConsumeEntry(entry)) {
    return CONSUME_ITEM_TYPE.STARFORCE_SCROLL;
  }
  if (typeof isPotentialScrollConsumeEntry === 'function' && isPotentialScrollConsumeEntry(entry)) {
    return CONSUME_ITEM_TYPE.POTENTIAL_SCROLL;
  }
  return '';
}

/** 直接調整消耗數量表（避免 consume* 的模擬器副作用） */
function trunkAdjustConsumeCount(entry, delta) {
  const amount = Math.floor(Math.abs(Number(delta) || 0));
  if (!entry || amount <= 0) return false;
  const sign = delta < 0 ? -1 : 1;
  const T = typeof CONSUME_ITEM_TYPE !== 'undefined' ? CONSUME_ITEM_TYPE : {};
  const type = trunkNormalizeConsumeType(entry);

  const applyMap = (map, key) => {
    if (!map || key == null || key === '') return false;
    const cur = Math.max(0, Math.floor(Number(map[key]) || 0));
    if (sign < 0 && cur < amount) return false;
    map[key] = Math.max(0, cur + sign * amount);
    return true;
  };

  if (type === (T.STARFORCE_SCROLL || 'starforce_scroll')) {
    return applyMap(typeof playerStarForceScrollInventory !== 'undefined' ? playerStarForceScrollInventory : null, entry.scrollId);
  }
  if (type === (T.POTENTIAL_SCROLL || 'potential_scroll')) {
    return applyMap(typeof playerPotentialScrollInventory !== 'undefined' ? playerPotentialScrollInventory : null, entry.scrollId);
  }
  if (type === (T.CUBE || 'cube')) {
    return applyMap(typeof playerCubeCounts !== 'undefined' ? playerCubeCounts : null, entry.cubeId);
  }
  if (type === (T.ADD_CUBE || 'add_cube')) {
    return applyMap(typeof playerAddPotCubeCounts !== 'undefined' ? playerAddPotCubeCounts : null, entry.cubeId);
  }
  if (type === (T.HAMMER || 'hammer')) {
    return applyMap(typeof playerHammerInventory !== 'undefined' ? playerHammerInventory : null, entry.hammerId);
  }
  if (type === (T.GLORY_SCROLL || 'glory_scroll')) {
    return applyMap(typeof playerGloryScrollInventory !== 'undefined' ? playerGloryScrollInventory : null, entry.scrollId);
  }
  if (type === (T.BONUS_STAT || 'bonus_stat')) {
    return applyMap(typeof playerBonusStatItemCounts !== 'undefined' ? playerBonusStatItemCounts : null, entry.itemId);
  }
  if (type === (T.EXCEPTIONAL_HAMMER || 'exceptional_hammer')) {
    return applyMap(typeof playerExceptionalHammerCounts !== 'undefined' ? playerExceptionalHammerCounts : null, entry.hammerId);
  }
  if (type === (T.SOUL || 'soul')) {
    return applyMap(typeof playerSoulMaterialCounts !== 'undefined' ? playerSoulMaterialCounts : null, entry.soulId);
  }
  if (type === (T.RECOVERY_CARD || 'recovery_card')) {
    if (typeof playerRecoveryCardCount === 'undefined') return false;
    const cur = Math.max(0, Math.floor(Number(playerRecoveryCardCount) || 0));
    if (sign < 0 && cur < amount) return false;
    playerRecoveryCardCount = Math.max(0, cur + sign * amount);
    return true;
  }
  if (type === (T.POTION || 'potion')) {
    return applyMap(typeof playerPotionCounts !== 'undefined' ? playerPotionCounts : null, entry.itemId);
  }
  return false;
}

function trunkBuildConsumeTrunkEntry(bagEntry, amount) {
  const type = trunkNormalizeConsumeType(bagEntry);
  const out = {
    kind: 'consume',
    type,
    amount: Math.max(1, Math.floor(Number(amount) || 1)),
  };
  if (bagEntry.scrollId) out.scrollId = bagEntry.scrollId;
  if (bagEntry.cubeId) out.cubeId = bagEntry.cubeId;
  if (bagEntry.hammerId) out.hammerId = bagEntry.hammerId;
  if (bagEntry.itemId) out.itemId = bagEntry.itemId;
  if (bagEntry.soulId) out.soulId = bagEntry.soulId;
  if (bagEntry.slotLocked) out.slotLocked = true;
  return out;
}

function trunkEnsureBagConsumeSlot(entry) {
  if (typeof InventoryModule === 'undefined' || typeof InventoryModule.ensureConsumeSlot !== 'function') {
    return -1;
  }
  const T = typeof CONSUME_ITEM_TYPE !== 'undefined' ? CONSUME_ITEM_TYPE : {};
  const type = entry.type;
  const match = (e) => {
    if (!e) return false;
    if (trunkNormalizeConsumeType(e) !== type) return false;
    return trunkConsumeIdentity(e) === trunkConsumeIdentity(entry);
  };
  const create = () => {
    const base = { type };
    if (entry.scrollId) base.scrollId = entry.scrollId;
    if (entry.cubeId) base.cubeId = entry.cubeId;
    if (entry.hammerId) base.hammerId = entry.hammerId;
    if (entry.itemId) base.itemId = entry.itemId;
    if (entry.soulId) base.soulId = entry.soulId;
    if (entry.slotLocked) base.slotLocked = true;
    return base;
  };
  const idx = InventoryModule.ensureConsumeSlot(match, create);
  if (idx >= 0 && entry.slotLocked && playerInventoryConsume[idx]) {
    playerInventoryConsume[idx].slotLocked = true;
  }
  return idx;
}

function trunkNotifyPersist() {
  if (typeof SessionPersistenceModule !== 'undefined') {
    SessionPersistenceModule.scheduleSave();
  }
}

function trunkRefreshInventories() {
  if (typeof InventoryModule !== 'undefined') {
    InventoryModule.pruneInactiveConsumeSlots?.();
    InventoryModule.render?.();
    InventoryModule.updateSlotCount?.();
    InventoryModule.updateMesoDisplay?.();
  }
  if (typeof TrunkModule !== 'undefined') {
    TrunkModule.render?.();
    TrunkModule.updateMesoDisplay?.();
  }
}

const TrunkData = {
  SLOT_COUNT: TRUNK_SLOT_COUNT,

  getSlots() {
    return playerTrunkSlots;
  },

  getMeso() {
    return Math.max(0, Math.floor(Number(playerTrunkMeso) || 0));
  },

  setMeso(n) {
    playerTrunkMeso = Math.max(0, Math.floor(Number(n) || 0));
  },

  usedCount() {
    let n = 0;
    for (let i = 0; i < TRUNK_SLOT_COUNT; i += 1) {
      if (playerTrunkSlots[i]) n += 1;
    }
    return n;
  },

  canDepositEquip(bagIndex) {
    if (!Number.isInteger(bagIndex) || bagIndex < 0) return { ok: false, reason: 'bad_slot' };
    const itemId = playerInventoryEquip?.[bagIndex];
    if (!itemId) return { ok: false, reason: 'empty' };
    const state = playerInventoryState?.[bagIndex];
    if (state?.itemLocked) return { ok: false, reason: 'item_locked' };
    if (typeof currentEnchantItem !== 'undefined' && currentEnchantItem
      && Number.isInteger(currentEnchantItem.slotIndex)
      && currentEnchantItem.slotIndex === bagIndex) {
      return { ok: false, reason: 'enchanting' };
    }
    return { ok: true };
  },

  depositFromBag(tab, bagIndex, trunkIndex = null) {
    if (tab === 'equip') return this.depositEquip(bagIndex, trunkIndex);
    if (tab === 'consume') return this.depositConsume(bagIndex, trunkIndex);
    if (tab === 'etc') return this.depositEtc(bagIndex, trunkIndex);
    return { ok: false, reason: 'bad_tab' };
  },

  depositEquip(bagIndex, trunkIndex = null) {
    const check = this.canDepositEquip(bagIndex);
    if (!check.ok) return check;
    const itemId = playerInventoryEquip[bagIndex];
    const state = playerInventoryState[bagIndex];
    const ti = trunkFindEmptySlot(trunkIndex);
    if (ti < 0) return { ok: false, reason: 'trunk_full' };
    if (trunkIndex != null && Number.isInteger(trunkIndex) && playerTrunkSlots[trunkIndex]) {
      return { ok: false, reason: 'occupied' };
    }

    playerTrunkSlots[ti] = {
      kind: 'equip',
      itemId,
      state: trunkCloneJson(state),
    };
    playerInventoryEquip[bagIndex] = null;
    playerInventoryState[bagIndex] = null;
    trunkNotifyPersist();
    trunkRefreshInventories();
    return { ok: true, trunkIndex: ti };
  },

  depositConsume(bagIndex, trunkIndex = null) {
    if (!Number.isInteger(bagIndex) || !playerInventoryConsume) return { ok: false, reason: 'bad_slot' };
    const entry = playerInventoryConsume[bagIndex];
    if (!entry) return { ok: false, reason: 'empty' };
    if (typeof InventoryModule !== 'undefined' && !InventoryModule.isConsumeEntryActive?.(entry)) {
      return { ok: false, reason: 'empty' };
    }
    const amount = typeof InventoryModule !== 'undefined'
      ? Math.max(0, Math.floor(Number(InventoryModule.consumeEntryCount(entry)) || 0))
      : 1;
    if (amount <= 0) return { ok: false, reason: 'empty' };

    let ti = -1;
    if (Number.isInteger(trunkIndex) && trunkIndex >= 0) {
      if (playerTrunkSlots[trunkIndex]) {
        const cur = playerTrunkSlots[trunkIndex];
        if (cur.kind === 'consume' && trunkConsumeIdentity(cur) === trunkConsumeIdentity(entry)) {
          ti = trunkIndex;
        } else {
          return { ok: false, reason: 'occupied' };
        }
      } else {
        ti = trunkIndex;
      }
    } else {
      ti = trunkFindStackSlot('consume', entry);
      if (ti < 0) ti = trunkFindEmptySlot();
    }
    if (ti < 0) return { ok: false, reason: 'trunk_full' };

    if (!trunkAdjustConsumeCount(entry, -amount)) {
      return { ok: false, reason: 'count_fail' };
    }

    const payload = trunkBuildConsumeTrunkEntry(entry, amount);
    if (playerTrunkSlots[ti] && playerTrunkSlots[ti].kind === 'consume') {
      playerTrunkSlots[ti].amount = Math.max(1, Math.floor(Number(playerTrunkSlots[ti].amount) || 0) + amount);
      if (payload.slotLocked) playerTrunkSlots[ti].slotLocked = true;
    } else {
      playerTrunkSlots[ti] = payload;
    }

    playerInventoryConsume[bagIndex] = null;
    if (typeof InventoryModule !== 'undefined') {
      InventoryModule.pruneInactiveConsumeSlots?.();
    }
    trunkNotifyPersist();
    trunkRefreshInventories();
    return { ok: true, trunkIndex: ti };
  },

  depositEtc(bagIndex, trunkIndex = null) {
    if (!Number.isInteger(bagIndex) || !playerInventoryEtc) return { ok: false, reason: 'bad_slot' };
    const entry = playerInventoryEtc[bagIndex];
    if (!entry) return { ok: false, reason: 'empty' };
    const amount = Math.max(1, Math.floor(Number(entry.amount) || 1));
    const itemId = String(entry.itemId || '');
    if (!itemId) return { ok: false, reason: 'empty' };

    let ti = -1;
    if (Number.isInteger(trunkIndex) && trunkIndex >= 0) {
      if (playerTrunkSlots[trunkIndex]) {
        const cur = playerTrunkSlots[trunkIndex];
        if (cur.kind === 'etc' && String(cur.itemId) === itemId) ti = trunkIndex;
        else return { ok: false, reason: 'occupied' };
      } else ti = trunkIndex;
    } else {
      ti = trunkFindStackSlot('etc', entry);
      if (ti < 0) ti = trunkFindEmptySlot();
    }
    if (ti < 0) return { ok: false, reason: 'trunk_full' };

    const payload = {
      kind: 'etc',
      itemId,
      name: entry.name || itemId,
      icon: entry.icon || '',
      desc: entry.desc || '',
      amount,
    };
    if (entry.slotLocked) payload.slotLocked = true;

    if (playerTrunkSlots[ti] && playerTrunkSlots[ti].kind === 'etc') {
      playerTrunkSlots[ti].amount = Math.max(1, Math.floor(Number(playerTrunkSlots[ti].amount) || 0) + amount);
      if (payload.slotLocked) playerTrunkSlots[ti].slotLocked = true;
    } else {
      playerTrunkSlots[ti] = payload;
    }
    playerInventoryEtc[bagIndex] = null;
    trunkNotifyPersist();
    trunkRefreshInventories();
    return { ok: true, trunkIndex: ti };
  },

  withdrawToBag(trunkIndex, bagIndex = null) {
    if (!Number.isInteger(trunkIndex) || trunkIndex < 0 || trunkIndex >= TRUNK_SLOT_COUNT) {
      return { ok: false, reason: 'bad_slot' };
    }
    const entry = playerTrunkSlots[trunkIndex];
    if (!entry) return { ok: false, reason: 'empty' };
    if (entry.kind === 'equip') return this.withdrawEquip(trunkIndex, bagIndex);
    if (entry.kind === 'consume') return this.withdrawConsume(trunkIndex);
    if (entry.kind === 'etc') return this.withdrawEtc(trunkIndex);
    return { ok: false, reason: 'bad_kind' };
  },

  withdrawEquip(trunkIndex, bagIndex = null) {
    const entry = playerTrunkSlots[trunkIndex];
    if (!entry || entry.kind !== 'equip') return { ok: false, reason: 'empty' };
    let bi = bagIndex;
    if (!Number.isInteger(bi) || bi < 0 || playerInventoryEquip[bi]) {
      bi = typeof InventoryModule !== 'undefined' ? InventoryModule.findEmptyEquipSlot?.() : -1;
      if (bi == null) bi = -1;
      if (bi < 0) {
        for (let i = 0; i < playerInventoryEquip.length; i += 1) {
          if (!playerInventoryEquip[i]) { bi = i; break; }
        }
      }
    }
    if (bi < 0) return { ok: false, reason: 'bag_full' };
    if (playerInventoryEquip[bi]) return { ok: false, reason: 'occupied' };

    playerInventoryEquip[bi] = entry.itemId;
    playerInventoryState[bi] = trunkCloneJson(entry.state);
    playerTrunkSlots[trunkIndex] = null;
    if (typeof InventoryModule !== 'undefined' && InventoryModule.tab !== 'equip') {
      InventoryModule.setTab?.('equip');
    }
    trunkNotifyPersist();
    trunkRefreshInventories();
    return { ok: true, bagIndex: bi, tab: 'equip' };
  },

  withdrawConsume(trunkIndex) {
    const entry = playerTrunkSlots[trunkIndex];
    if (!entry || entry.kind !== 'consume') return { ok: false, reason: 'empty' };
    const amount = Math.max(1, Math.floor(Number(entry.amount) || 1));

    const needsSlot = typeof InventoryModule !== 'undefined'
      && InventoryModule.consumeDropNeedsNewSlot?.({
        consumeType: entry.type,
        scrollId: entry.scrollId,
        cubeId: entry.cubeId,
        hammerId: entry.hammerId,
        itemId: entry.itemId,
        soulId: entry.soulId,
      });
    if (needsSlot && InventoryModule.findEmptyConsumeSlot?.() < 0) {
      return { ok: false, reason: 'bag_full' };
    }

    if (!trunkAdjustConsumeCount(entry, amount)) {
      return { ok: false, reason: 'count_fail' };
    }
    const bi = trunkEnsureBagConsumeSlot(entry);
    if (bi < 0) {
      trunkAdjustConsumeCount(entry, -amount);
      return { ok: false, reason: 'bag_full' };
    }
    playerTrunkSlots[trunkIndex] = null;
    if (typeof InventoryModule !== 'undefined' && InventoryModule.tab !== 'consume') {
      InventoryModule.setTab?.('consume');
    }
    trunkNotifyPersist();
    trunkRefreshInventories();
    return { ok: true, bagIndex: bi, tab: 'consume' };
  },

  withdrawEtc(trunkIndex) {
    const entry = playerTrunkSlots[trunkIndex];
    if (!entry || entry.kind !== 'etc') return { ok: false, reason: 'empty' };
    const amount = Math.max(1, Math.floor(Number(entry.amount) || 1));
    const result = typeof InventoryModule !== 'undefined'
      ? InventoryModule.addEtcItem({
        itemId: entry.itemId,
        name: entry.name,
        icon: entry.icon,
        desc: entry.desc,
        amount,
      }, { silent: true, switchTab: true, logTag: '倉庫' })
      : { ok: false };
    if (!result?.ok) return { ok: false, reason: 'bag_full' };

    if (entry.slotLocked && playerInventoryEtc) {
      const stack = playerInventoryEtc.find((e) => e && String(e.itemId) === String(entry.itemId));
      if (stack) stack.slotLocked = true;
    }
    playerTrunkSlots[trunkIndex] = null;
    trunkNotifyPersist();
    trunkRefreshInventories();
    return { ok: true, tab: 'etc' };
  },

  swapTrunkSlots(fromIndex, toIndex) {
    if (!Number.isInteger(fromIndex) || !Number.isInteger(toIndex)) return false;
    if (fromIndex === toIndex) return false;
    if (fromIndex < 0 || toIndex < 0 || fromIndex >= TRUNK_SLOT_COUNT || toIndex >= TRUNK_SLOT_COUNT) {
      return false;
    }
    const a = playerTrunkSlots[fromIndex];
    const b = playerTrunkSlots[toIndex];
    if (a && b && a.kind === b.kind && a.kind !== 'equip') {
      if (a.kind === 'consume' && trunkConsumeIdentity(a) === trunkConsumeIdentity(b)) {
        b.amount = Math.max(1, Math.floor(Number(b.amount) || 0) + Math.max(1, Math.floor(Number(a.amount) || 1)));
        if (a.slotLocked) b.slotLocked = true;
        playerTrunkSlots[fromIndex] = null;
        trunkNotifyPersist();
        trunkRefreshInventories();
        return true;
      }
      if (a.kind === 'etc' && String(a.itemId) === String(b.itemId)) {
        b.amount = Math.max(1, Math.floor(Number(b.amount) || 0) + Math.max(1, Math.floor(Number(a.amount) || 1)));
        if (a.slotLocked) b.slotLocked = true;
        playerTrunkSlots[fromIndex] = null;
        trunkNotifyPersist();
        trunkRefreshInventories();
        return true;
      }
    }
    playerTrunkSlots[fromIndex] = b;
    playerTrunkSlots[toIndex] = a;
    trunkNotifyPersist();
    trunkRefreshInventories();
    return true;
  },

  sortSlots() {
    const kindOrder = { equip: 0, consume: 1, etc: 2 };
    const items = [];
    for (let i = 0; i < TRUNK_SLOT_COUNT; i += 1) {
      if (playerTrunkSlots[i]) items.push(playerTrunkSlots[i]);
    }
    items.sort((a, b) => {
      const ka = kindOrder[a.kind] ?? 9;
      const kb = kindOrder[b.kind] ?? 9;
      if (ka !== kb) return ka - kb;
      const idA = String(a.itemId || a.scrollId || a.cubeId || a.hammerId || a.soulId || a.type || '');
      const idB = String(b.itemId || b.scrollId || b.cubeId || b.hammerId || b.soulId || b.type || '');
      if (typeof InventoryModule !== 'undefined' && InventoryModule.compareEntrySortKeys) {
        const cmp = InventoryModule.compareEntrySortKeys(idA, idB);
        if (cmp !== 0) return cmp;
      } else if (idA !== idB) {
        return idA.localeCompare(idB, undefined, { numeric: true });
      }
      return 0;
    });
    for (let i = 0; i < TRUNK_SLOT_COUNT; i += 1) {
      playerTrunkSlots[i] = items[i] || null;
    }
    trunkNotifyPersist();
    trunkRefreshInventories();
    return items.length;
  },

  getAll() {
    let moved = 0;
    for (let i = 0; i < TRUNK_SLOT_COUNT; i += 1) {
      if (!playerTrunkSlots[i]) continue;
      const result = this.withdrawToBag(i);
      if (!result.ok) {
        return { ok: moved > 0, moved, stopped: true, reason: result.reason };
      }
      moved += 1;
    }
    return { ok: true, moved, stopped: false };
  },

  mesoIn(amount) {
    const idle = typeof isIdlePlayMode === 'function' && isIdlePlayMode();
    if (!idle) return { ok: false, reason: 'not_idle' };
    const held = typeof getIdleHeldMeso === 'function' ? getIdleHeldMeso() : 0;
    let n = amount == null || amount === '' ? held : Math.floor(Number(amount) || 0);
    if (!Number.isFinite(n) || n <= 0) return { ok: false, reason: 'bad_amount' };
    n = Math.min(n, held);
    if (n <= 0) return { ok: false, reason: 'no_meso' };
    if (typeof trySpendIdleMeso === 'function') {
      if (!trySpendIdleMeso(n, { silent: true })) return { ok: false, reason: 'spend_fail' };
    } else if (typeof IdleHunt !== 'undefined' && IdleHunt.spendGold) {
      if (!IdleHunt.spendGold(n)) return { ok: false, reason: 'spend_fail' };
    } else {
      return { ok: false, reason: 'no_api' };
    }
    playerTrunkMeso = this.getMeso() + n;
    trunkNotifyPersist();
    trunkRefreshInventories();
    return { ok: true, amount: n };
  },

  mesoOut(amount) {
    const idle = typeof isIdlePlayMode === 'function' && isIdlePlayMode();
    if (!idle) return { ok: false, reason: 'not_idle' };
    const stored = this.getMeso();
    let n = amount == null || amount === '' ? stored : Math.floor(Number(amount) || 0);
    if (!Number.isFinite(n) || n <= 0) return { ok: false, reason: 'bad_amount' };
    n = Math.min(n, stored);
    if (n <= 0) return { ok: false, reason: 'no_meso' };
    playerTrunkMeso = stored - n;
    if (typeof IdleHunt !== 'undefined' && typeof IdleHunt.addGold === 'function') {
      IdleHunt.addGold(n);
    }
    trunkNotifyPersist();
    trunkRefreshInventories();
    return { ok: true, amount: n };
  },

  exportSnapshot() {
    return {
      trunkSlots: playerTrunkSlots.map((e) => (e ? trunkCloneJson(e) : null)),
      trunkMeso: this.getMeso(),
    };
  },

  applySnapshot(data) {
    const count = TRUNK_SLOT_COUNT;
    const next = new Array(count).fill(null);
    const src = Array.isArray(data?.trunkSlots) ? data.trunkSlots : [];
    for (let i = 0; i < count && i < src.length; i += 1) {
      const e = src[i];
      if (!e || typeof e !== 'object') continue;
      if (e.kind === 'equip' && e.itemId) {
        next[i] = { kind: 'equip', itemId: String(e.itemId), state: e.state || null };
      } else if (e.kind === 'consume' && e.type) {
        next[i] = trunkBuildConsumeTrunkEntry(e, e.amount || 1);
      } else if (e.kind === 'etc' && e.itemId) {
        next[i] = {
          kind: 'etc',
          itemId: String(e.itemId),
          name: e.name || String(e.itemId),
          icon: e.icon || '',
          desc: e.desc || '',
          amount: Math.max(1, Math.floor(Number(e.amount) || 1)),
          ...(e.slotLocked ? { slotLocked: true } : {}),
        };
      }
    }
    playerTrunkSlots.splice(0, playerTrunkSlots.length, ...next);
    playerTrunkMeso = Math.max(0, Math.floor(Number(data?.trunkMeso) || 0));
  },
};
