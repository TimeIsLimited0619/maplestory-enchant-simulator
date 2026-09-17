/**
 * 裝備實體庫：uid 單一真相；背包／穿著／倉庫為位置；強化槽僅為焦點引用。
 */
const ITEM_STORE_SESSION_VERSION = 2;

const ItemStore = (() => {
  const PRESET_KEYS = [1, 2, 3];

  /** @type {Record<string, { uid: string, baseId: string, state: object|null }>} */
  let byUid = Object.create(null);
  /** @type {(string|null)[]} */
  let bagSlots = [];
  /** @type {Record<number, Record<string, string|null>>} */
  let bodyByPreset = emptyBodyPresets();
  /** @type {(string|null)[]} trunk 裝備格存 uid；非裝備格不經由此 */
  let trunkEquipUids = [];
  /** @type {string|null} */
  let enchantFocus = null;
  /** @type {string[]} */
  let orphanBenchUids = [];
  let seq = 0;
  /** @type {Record<string, string|null>} 角色共用符文槽 */
  let symbolBySlot = Object.create(null);

  function emptyBodyPresets() {
    return { 1: {}, 2: {}, 3: {} };
  }

  function bagCount() {
    return typeof INVENTORY_SLOT_COUNT !== 'undefined' ? INVENTORY_SLOT_COUNT : 128;
  }

  function trunkCount() {
    return typeof TRUNK_SLOT_COUNT !== 'undefined' ? TRUNK_SLOT_COUNT : bagCount();
  }

  function ensureBagSize(n = bagCount()) {
    while (bagSlots.length < n) bagSlots.push(null);
    if (bagSlots.length > n) bagSlots.length = n;
  }

  function ensureTrunkSize(n = trunkCount()) {
    while (trunkEquipUids.length < n) trunkEquipUids.push(null);
    if (trunkEquipUids.length > n) trunkEquipUids.length = n;
  }

  function newUid() {
    seq += 1;
    return `eq_${seq}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  }

  function resolveId(itemId) {
    if (!itemId) return null;
    if (typeof resolveEquipItemId === 'function') {
      return resolveEquipItemId(itemId) || String(itemId);
    }
    return String(itemId);
  }

  function cloneState(state) {
    if (!state || typeof state !== 'object') return state == null ? null : state;
    if (typeof cloneEnchantState === 'function') return cloneEnchantState(state);
    try {
      return JSON.parse(JSON.stringify(state));
    } catch (_) {
      return { ...state };
    }
  }

  function stampState(state, baseId) {
    const id = resolveId(baseId);
    let snap = cloneState(state) || {};
    if (typeof stampEnchantItemId === 'function' && id) {
      stampEnchantItemId(snap, id);
    } else if (id && typeof snap === 'object') {
      snap.itemId = id;
      snap.id = id;
      delete snap.slotIndex;
    }
    if (snap && typeof snap === 'object') {
      delete snap.instanceUid;
      delete snap.wearSlotId;
    }
    return snap;
  }

  function reset() {
    byUid = Object.create(null);
    bagSlots = new Array(bagCount()).fill(null);
    bodyByPreset = emptyBodyPresets();
    trunkEquipUids = new Array(trunkCount()).fill(null);
    enchantFocus = null;
    orphanBenchUids = [];
    symbolBySlot = Object.create(null);
  }

  function get(uid) {
    return uid ? byUid[uid] || null : null;
  }

  function createInstance(baseId, state) {
    const id = resolveId(baseId);
    if (!id) return null;
    const uid = newUid();
    byUid[uid] = {
      uid,
      baseId: id,
      state: stampState(state, id),
    };
    return uid;
  }

  function destroy(uid) {
    if (!uid || !byUid[uid]) return false;
    clearUidFromLocations(uid);
    if (enchantFocus === uid) enchantFocus = null;
    orphanBenchUids = orphanBenchUids.filter((u) => u !== uid);
    delete byUid[uid];
    return true;
  }

  function clearUidFromLocations(uid) {
    for (let i = 0; i < bagSlots.length; i += 1) {
      if (bagSlots[i] === uid) bagSlots[i] = null;
    }
    PRESET_KEYS.forEach((p) => {
      const map = bodyByPreset[p];
      if (!map) return;
      Object.keys(map).forEach((slot) => {
        if (map[slot] === uid) map[slot] = null;
      });
    });
    for (let i = 0; i < trunkEquipUids.length; i += 1) {
      if (trunkEquipUids[i] === uid) trunkEquipUids[i] = null;
    }
    Object.keys(symbolBySlot).forEach((slot) => {
      if (symbolBySlot[slot] === uid) symbolBySlot[slot] = null;
    });
  }

  function findBagIndex(uid) {
    if (!uid) return -1;
    return bagSlots.indexOf(uid);
  }

  function findBodyLoc(uid) {
    if (!uid) return null;
    for (const p of PRESET_KEYS) {
      const map = bodyByPreset[p] || {};
      for (const slot of Object.keys(map)) {
        if (map[slot] === uid) return { preset: p, slot };
      }
    }
    return null;
  }

  function findSymbolLoc(uid) {
    if (!uid) return null;
    const slot = Object.keys(symbolBySlot).find((id) => symbolBySlot[id] === uid);
    return slot ? { slot } : null;
  }

  function findTrunkIndex(uid) {
    if (!uid) return -1;
    return trunkEquipUids.indexOf(uid);
  }

  function setEnchantFocus(uid) {
    if (uid == null) {
      enchantFocus = null;
      return true;
    }
    if (!byUid[uid]) return false;
    const inBag = findBagIndex(uid) >= 0;
    const inBody = !!findBodyLoc(uid);
    const inOrphan = orphanBenchUids.includes(uid);
    const inSymbol = !!findSymbolLoc(uid);
    if (!inBag && !inBody && !inOrphan && !inSymbol) return false;
    enchantFocus = uid;
    return true;
  }

  function clearEnchantFocus() {
    enchantFocus = null;
  }

  function getEnchantFocus() {
    return enchantFocus;
  }

  function updateState(uid, patch) {
    const inst = byUid[uid];
    if (!inst) return false;
    const next = stampState(
      patch && typeof patch === 'object' ? { ...(inst.state || {}), ...cloneState(patch) } : patch,
      inst.baseId
    );
    inst.state = next;
    return true;
  }

  function replaceState(uid, state) {
    const inst = byUid[uid];
    if (!inst) return false;
    inst.state = stampState(state, inst.baseId);
    return true;
  }

  /** 確保背包格有 uid（同 baseId 則沿用） */
  function ensureBagUid(bagIndex) {
    ensureBagSize();
    if (!Number.isInteger(bagIndex) || bagIndex < 0 || bagIndex >= bagSlots.length) return null;
    if (typeof playerInventoryEquip === 'undefined') return null;
    const baseId = resolveId(playerInventoryEquip[bagIndex]);
    if (!baseId) {
      bagSlots[bagIndex] = null;
      return null;
    }
    const existing = bagSlots[bagIndex];
    if (existing && byUid[existing] && byUid[existing].baseId === baseId) {
      const st = typeof playerInventoryState !== 'undefined' ? playerInventoryState[bagIndex] : null;
      if (st) replaceState(existing, st);
      return existing;
    }
    if (existing) destroy(existing);
    const st = typeof playerInventoryState !== 'undefined' ? playerInventoryState[bagIndex] : null;
    const uid = createInstance(baseId, st);
    bagSlots[bagIndex] = uid;
    return uid;
  }

  function ensureBodyUid(preset, slotId, entry) {
    const p = Number(preset);
    if (!PRESET_KEYS.includes(p) || !slotId || !entry?.itemId) return null;
    if (!bodyByPreset[p]) bodyByPreset[p] = {};
    const baseId = resolveId(entry.itemId);
    if (!baseId) return null;
    const existing = bodyByPreset[p][slotId];
    if (existing && byUid[existing] && byUid[existing].baseId === baseId) {
      if (entry.state) replaceState(existing, entry.state);
      return existing;
    }
    if (existing) {
      clearUidFromLocations(existing);
      delete byUid[existing];
    }
    const uid = createInstance(baseId, entry.state);
    bodyByPreset[p][slotId] = uid;
    return uid;
  }

  function ensureSymbolUid(slotId, entry) {
    const slot = String(slotId || '');
    if (!slot || !entry?.itemId) return null;
    const baseId = resolveId(entry.itemId);
    if (!baseId) return null;
    const existing = symbolBySlot[slot];
    if (existing && byUid[existing] && byUid[existing].baseId === baseId) {
      if (entry.state) replaceState(existing, entry.state);
      return existing;
    }
    if (existing) {
      clearUidFromLocations(existing);
      delete byUid[existing];
    }
    const uid = createInstance(baseId, entry.state);
    symbolBySlot[slot] = uid;
    return uid;
  }

  /**
   * 移動實體位置（不含 enchant）。to: { type:'bag', index } | { type:'body', preset, slot } | { type:'trunk', index } | { type:'orphan' } | { type:'symbol', slot }
   */
  function move(uid, to) {
    if (!byUid[uid] || !to) return false;
    clearUidFromLocations(uid);
    orphanBenchUids = orphanBenchUids.filter((u) => u !== uid);
    if (to.type === 'bag') {
      ensureBagSize();
      const idx = to.index;
      if (!Number.isInteger(idx) || idx < 0 || idx >= bagSlots.length) return false;
      if (bagSlots[idx]) return false;
      bagSlots[idx] = uid;
      return true;
    }
    if (to.type === 'body') {
      const p = Number(to.preset);
      const slot = String(to.slot);
      if (!PRESET_KEYS.includes(p) || !slot) return false;
      if (!bodyByPreset[p]) bodyByPreset[p] = {};
      if (bodyByPreset[p][slot]) return false;
      bodyByPreset[p][slot] = uid;
      return true;
    }
    if (to.type === 'trunk') {
      ensureTrunkSize();
      const idx = to.index;
      if (!Number.isInteger(idx) || idx < 0 || idx >= trunkEquipUids.length) return false;
      if (trunkEquipUids[idx]) return false;
      trunkEquipUids[idx] = uid;
      return true;
    }
    if (to.type === 'orphan') {
      if (!orphanBenchUids.includes(uid)) orphanBenchUids.push(uid);
      return true;
    }
    if (to.type === 'symbol') {
      const slot = String(to.slot || '');
      if (!slot) return false;
      if (symbolBySlot[slot]) return false;
      symbolBySlot[slot] = uid;
      return true;
    }
    return false;
  }

  function listLocatedUids() {
    const set = new Set();
    bagSlots.forEach((u) => { if (u) set.add(u); });
    PRESET_KEYS.forEach((p) => {
      const map = bodyByPreset[p] || {};
      Object.keys(map).forEach((slot) => {
        if (map[slot]) set.add(map[slot]);
      });
    });
    trunkEquipUids.forEach((u) => { if (u) set.add(u); });
    Object.keys(symbolBySlot).forEach((slot) => {
      if (symbolBySlot[slot]) set.add(symbolBySlot[slot]);
    });
    orphanBenchUids.forEach((u) => { if (u) set.add(u); });
    return set;
  }

  /**
   * @returns {{ ok: boolean, errors: string[] }}
   */
  function assertInvariants() {
    const errors = [];
    const seen = new Map();

    function mark(uid, where) {
      if (!uid) return;
      if (!byUid[uid]) {
        errors.push(`missing item for ${where}: ${uid}`);
        return;
      }
      if (seen.has(uid)) {
        errors.push(`duplicate location for ${uid}: ${seen.get(uid)} and ${where}`);
      } else {
        seen.set(uid, where);
      }
    }

    bagSlots.forEach((u, i) => mark(u, `bag[${i}]`));
    PRESET_KEYS.forEach((p) => {
      const map = bodyByPreset[p] || {};
      Object.keys(map).forEach((slot) => mark(map[slot], `body[${p}].${slot}`));
    });
    trunkEquipUids.forEach((u, i) => mark(u, `trunk[${i}]`));
    Object.keys(symbolBySlot).forEach((slot) => mark(symbolBySlot[slot], `symbol.${slot}`));
    orphanBenchUids.forEach((u, i) => mark(u, `orphan[${i}]`));

    Object.keys(byUid).forEach((uid) => {
      if (!seen.has(uid)) errors.push(`orphan entity not listed: ${uid}`);
    });

    if (enchantFocus) {
      const ok = findBagIndex(enchantFocus) >= 0
        || !!findBodyLoc(enchantFocus)
        || !!findSymbolLoc(enchantFocus)
        || orphanBenchUids.includes(enchantFocus);
      if (!ok) errors.push(`enchantFocus not in bag/body/symbol/orphan: ${enchantFocus}`);
      if (!byUid[enchantFocus]) errors.push(`enchantFocus missing item: ${enchantFocus}`);
    }

    const located = listLocatedUids();
    if (located.size !== Object.keys(byUid).length) {
      errors.push(`count mismatch items=${Object.keys(byUid).length} located=${located.size}`);
    }

    return { ok: errors.length === 0, errors };
  }

  function wearMapToUids(wearMap, preset) {
    const out = {};
    if (!wearMap || typeof wearMap !== 'object') return out;
    Object.keys(wearMap).forEach((slot) => {
      const entry = wearMap[slot];
      if (!entry?.itemId) return;
      const uid = ensureBodyUid(preset, slot, entry);
      if (uid) out[slot] = uid;
    });
    return out;
  }

  function expandWearUids(uidMap) {
    const out = {};
    if (!uidMap || typeof uidMap !== 'object') return out;
    Object.keys(uidMap).forEach((slot) => {
      const uid = uidMap[slot];
      const inst = get(uid);
      if (!inst) return;
      out[slot] = {
        itemId: inst.baseId,
        state: cloneState(inst.state),
        instanceUid: uid,
      };
    });
    return out;
  }

  /**
   * 從執行期平行陣列／穿著／倉庫重建（盡量沿用既有 uid）。
   */
  function rebuildFromRuntime(opts = {}) {
    const prevBag = bagSlots.slice();
    const prevBody = {
      1: { ...(bodyByPreset[1] || {}) },
      2: { ...(bodyByPreset[2] || {}) },
      3: { ...(bodyByPreset[3] || {}) },
    };
    const prevTrunk = trunkEquipUids.slice();
    const prevFocus = enchantFocus;
    const prevOrphans = orphanBenchUids.slice();
    const prevSymbol = { ...symbolBySlot };
    const prevByUid = byUid;

    byUid = Object.create(null);
    ensureBagSize();
    bagSlots = new Array(bagCount()).fill(null);
    bodyByPreset = emptyBodyPresets();
    ensureTrunkSize();
    trunkEquipUids = new Array(trunkCount()).fill(null);
    symbolBySlot = Object.create(null);
    orphanBenchUids = [];
    enchantFocus = null;

    function reuseOrCreate(oldUid, baseId, state) {
      const id = resolveId(baseId);
      if (!id) return null;
      if (oldUid && prevByUid[oldUid] && prevByUid[oldUid].baseId === id) {
        byUid[oldUid] = {
          uid: oldUid,
          baseId: id,
          state: stampState(state, id),
        };
        return oldUid;
      }
      return createInstance(id, state);
    }

    const equip = opts.inventoryEquip || (typeof playerInventoryEquip !== 'undefined' ? playerInventoryEquip : []);
    const states = opts.inventoryState || (typeof playerInventoryState !== 'undefined' ? playerInventoryState : []);
    ensureBagSize(Math.max(bagCount(), equip.length || 0));
    for (let i = 0; i < bagSlots.length; i += 1) {
      const baseId = resolveId(equip[i]);
      if (!baseId) continue;
      const uid = reuseOrCreate(prevBag[i], baseId, states[i]);
      bagSlots[i] = uid;
    }

    const byPreset = opts.bodyWearByPreset;
    if (byPreset && typeof byPreset === 'object') {
      PRESET_KEYS.forEach((p) => {
        const map = byPreset[p];
        if (!map || typeof map !== 'object') return;
        bodyByPreset[p] = {};
        Object.keys(map).forEach((slot) => {
          const entry = map[slot];
          if (!entry?.itemId) return;
          const oldUid = entry.instanceUid || prevBody[p]?.[slot];
          const uid = reuseOrCreate(oldUid, entry.itemId, entry.state);
          if (uid) bodyByPreset[p][slot] = uid;
        });
      });
    }

    const symbols = opts.symbolWear;
    if (symbols && typeof symbols === 'object') {
      Object.keys(symbols).forEach((slot) => {
        const entry = symbols[slot];
        if (!entry?.itemId) return;
        const oldUid = entry.instanceUid || prevSymbol[slot];
        const uid = reuseOrCreate(oldUid, entry.itemId, entry.state);
        if (uid) symbolBySlot[slot] = uid;
      });
    } else {
      Object.keys(prevSymbol).forEach((slot) => {
        const oldUid = prevSymbol[slot];
        const inst = oldUid && prevByUid[oldUid];
        if (!inst) return;
        const uid = reuseOrCreate(oldUid, inst.baseId, inst.state);
        if (uid) symbolBySlot[slot] = uid;
      });
    }

    const trunk = opts.trunkSlots || (typeof playerTrunkSlots !== 'undefined' ? playerTrunkSlots : []);
    ensureTrunkSize(Math.max(trunkCount(), trunk.length || 0));
    for (let i = 0; i < trunkEquipUids.length; i += 1) {
      const e = trunk[i];
      if (!e || e.kind !== 'equip' || !e.itemId) continue;
      const oldUid = e.uid || prevTrunk[i];
      const uid = reuseOrCreate(oldUid, e.itemId, e.state);
      trunkEquipUids[i] = uid;
    }

    // orphans：仍存在於舊表、未進位置者
    prevOrphans.forEach((uid) => {
      if (prevByUid[uid] && !byUid[uid]) {
        byUid[uid] = {
          uid,
          baseId: prevByUid[uid].baseId,
          state: stampState(prevByUid[uid].state, prevByUid[uid].baseId),
        };
        orphanBenchUids.push(uid);
      } else if (byUid[uid] && findBagIndex(uid) < 0 && !findBodyLoc(uid)
        && findTrunkIndex(uid) < 0 && !findSymbolLoc(uid)) {
        if (!orphanBenchUids.includes(uid)) orphanBenchUids.push(uid);
      }
    });

    if (opts.enchantFocus && byUid[opts.enchantFocus]) {
      setEnchantFocus(opts.enchantFocus);
    } else if (prevFocus && byUid[prevFocus]) {
      setEnchantFocus(prevFocus);
    } else if (opts.focusBagIndex != null && bagSlots[opts.focusBagIndex]) {
      setEnchantFocus(bagSlots[opts.focusBagIndex]);
    } else if (opts.focusWear && opts.focusWear.preset && opts.focusWear.slot) {
      const u = bodyByPreset[opts.focusWear.preset]?.[opts.focusWear.slot];
      if (u) setEnchantFocus(u);
    }

    return assertInvariants();
  }

  /**
   * 投影到執行期平行陣列（供 UI／舊模組讀取）。
   */
  function projectToLegacyArrays() {
    ensureBagSize();
    const count = bagSlots.length;
    if (typeof playerInventoryEquip !== 'undefined') {
      const nextEquip = new Array(count).fill(null);
      const nextState = new Array(count).fill(null);
      for (let i = 0; i < count; i += 1) {
        const uid = bagSlots[i];
        const inst = get(uid);
        if (!inst) continue;
        nextEquip[i] = inst.baseId;
        const st = cloneState(inst.state) || {};
        if (typeof st === 'object') st.instanceUid = uid;
        nextState[i] = st;
      }
      playerInventoryEquip.splice(0, playerInventoryEquip.length, ...nextEquip);
      if (typeof playerInventoryState !== 'undefined') {
        playerInventoryState.splice(0, playerInventoryState.length, ...nextState);
      }
      if (typeof playerInventory !== 'undefined' && Array.isArray(playerInventory)
        && playerInventory !== playerInventoryEquip) {
        playerInventory.splice(0, playerInventory.length, ...nextEquip);
      }
    }
  }

  function exportBodyWearByPresetExpanded() {
    const out = { 1: {}, 2: {}, 3: {} };
    PRESET_KEYS.forEach((p) => {
      out[p] = expandWearUids(bodyByPreset[p]);
    });
    return out;
  }

  function exportBodyWearByPresetUids() {
    const out = { 1: {}, 2: {}, 3: {} };
    PRESET_KEYS.forEach((p) => {
      const map = bodyByPreset[p] || {};
      const slim = {};
      Object.keys(map).forEach((slot) => {
        if (map[slot]) slim[slot] = map[slot];
      });
      out[p] = slim;
    });
    return out;
  }

  function exportSymbolWearExpanded() {
    return expandWearUids(symbolBySlot);
  }

  function exportSymbolWearUids() {
    const slim = {};
    Object.keys(symbolBySlot).forEach((slot) => {
      if (symbolBySlot[slot]) slim[slot] = symbolBySlot[slot];
    });
    return slim;
  }

  function exportTrunkSlotsMerged(legacyTrunk) {
    const count = trunkCount();
    const src = Array.isArray(legacyTrunk) ? legacyTrunk : [];
    const out = new Array(count).fill(null);
    for (let i = 0; i < count; i += 1) {
      const uid = trunkEquipUids[i];
      if (uid && byUid[uid]) {
        out[i] = {
          kind: 'equip',
          uid,
          itemId: byUid[uid].baseId,
          state: cloneState(byUid[uid].state),
        };
        continue;
      }
      const e = src[i];
      if (e && e.kind && e.kind !== 'equip') {
        out[i] = e;
      } else if (e && e.kind === 'equip' && e.itemId) {
        out[i] = {
          kind: 'equip',
          itemId: String(e.itemId),
          state: e.state || null,
        };
      }
    }
    return out;
  }

  function exportItemsMap() {
    const items = Object.create(null);
    Object.keys(byUid).forEach((uid) => {
      const inst = byUid[uid];
      items[uid] = {
        baseId: inst.baseId,
        state: cloneState(inst.state),
      };
    });
    return items;
  }

  function exportEquipSnapshot() {
    ensureBagSize();
    ensureTrunkSize();
    return {
      items: exportItemsMap(),
      bagSlots: bagSlots.slice(),
      bodyWearByPreset: exportBodyWearByPresetUids(),
      bodyWearExpanded: exportBodyWearByPresetExpanded(),
      symbolWearUids: exportSymbolWearUids(),
      symbolWearExpanded: exportSymbolWearExpanded(),
      enchantFocus,
      orphanBenchUids: orphanBenchUids.slice(),
      trunkEquipUids: trunkEquipUids.slice(),
    };
  }

  /**
   * v1 session → v2 純函數遷移。
   * @returns {{ ok: boolean, v2: object|null, report: object, errors: string[] }}
   */
  function migrateSessionV1toV2(v1) {
    const report = {
      bag: 0,
      body: 0,
      trunk: 0,
      benchPlaced: false,
      benchOrphan: false,
      equippedSlotReuse: false,
    };
    const errors = [];
    if (!v1 || typeof v1 !== 'object') {
      return { ok: false, v2: null, report, errors: ['invalid v1'] };
    }

    const count = bagCount();
    const tCount = trunkCount();
    const items = Object.create(null);
    const nextBag = new Array(count).fill(null);
    const nextBody = emptyBodyPresets();
    const nextTrunkUids = new Array(tCount).fill(null);
    const orphans = [];
    let focus = null;
    let localSeq = 0;

    function mint(baseId, state) {
      const id = resolveId(baseId);
      if (!id) return null;
      localSeq += 1;
      const uid = `eq_m${localSeq}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
      items[uid] = { baseId: id, state: stampState(state, id) };
      return uid;
    }

    const equip = Array.isArray(v1.inventoryEquip) ? v1.inventoryEquip : [];
    const states = Array.isArray(v1.inventoryState) ? v1.inventoryState : [];
    for (let i = 0; i < count; i += 1) {
      const id = resolveId(equip[i]);
      if (!id) continue;
      const uid = mint(id, states[i]);
      if (!uid) continue;
      nextBag[i] = uid;
      report.bag += 1;
    }

    function ingestWear(map, preset) {
      if (!map || typeof map !== 'object') return;
      Object.keys(map).forEach((slot) => {
        const raw = map[slot];
        let itemId = null;
        let st = null;
        if (typeof raw === 'string') itemId = raw;
        else if (raw && typeof raw === 'object' && raw.itemId) {
          itemId = raw.itemId;
          st = raw.state;
        }
        itemId = resolveId(itemId);
        if (!itemId) return;
        const uid = mint(itemId, st);
        if (!uid) return;
        if (!nextBody[preset]) nextBody[preset] = {};
        nextBody[preset][slot] = uid;
        report.body += 1;
      });
    }

    if (v1.bodyWearByPreset && typeof v1.bodyWearByPreset === 'object') {
      PRESET_KEYS.forEach((p) => ingestWear(v1.bodyWearByPreset[p], p));
    } else if (v1.bodyWearActive) {
      ingestWear(v1.bodyWearActive, Number(v1.activeEquipPreset) || 1);
    }

    const trunk = Array.isArray(v1.trunkSlots) ? v1.trunkSlots : [];
    const nextTrunkSlots = new Array(tCount).fill(null);
    for (let i = 0; i < tCount; i += 1) {
      const e = trunk[i];
      if (!e || typeof e !== 'object') continue;
      if (e.kind === 'equip' && e.itemId) {
        const uid = mint(e.itemId, e.state);
        if (uid) {
          nextTrunkUids[i] = uid;
          nextTrunkSlots[i] = { kind: 'equip', uid, itemId: resolveId(e.itemId), state: stampState(e.state, e.itemId) };
          report.trunk += 1;
        }
      } else {
        nextTrunkSlots[i] = e;
      }
    }

    const pendingId = resolveId(v1.equippedItem?.itemId);
    if (pendingId) {
      const uid = mint(pendingId, v1.equippedItem.state);
      if (uid) {
        focus = uid;
        const slotHint = Number.isInteger(v1.equippedSlotIndex) ? v1.equippedSlotIndex : -1;
        if (slotHint >= 0 && slotHint < count && !nextBag[slotHint]) {
          nextBag[slotHint] = uid;
          report.benchPlaced = true;
          report.equippedSlotReuse = true;
        } else {
          const empty = nextBag.findIndex((x) => !x);
          if (empty >= 0) {
            nextBag[empty] = uid;
            report.benchPlaced = true;
          } else {
            orphans.push(uid);
            report.benchOrphan = true;
          }
        }
      }
    }

    const itemCount = Object.keys(items).length;
    let located = 0;
    nextBag.forEach((u) => { if (u) located += 1; });
    PRESET_KEYS.forEach((p) => {
      Object.keys(nextBody[p] || {}).forEach((s) => { if (nextBody[p][s]) located += 1; });
    });
    nextTrunkUids.forEach((u) => { if (u) located += 1; });
    located += orphans.length;
    if (located !== itemCount) {
      errors.push(`migrate count mismatch items=${itemCount} located=${located}`);
    }
    if (focus && !items[focus]) errors.push('focus missing after migrate');
    if (focus) {
      const inBag = nextBag.includes(focus);
      const inBody = PRESET_KEYS.some((p) => Object.values(nextBody[p] || {}).includes(focus));
      const inOrphan = orphans.includes(focus);
      if (!inBag && !inBody && !inOrphan) errors.push('focus not placed');
    }

    const inventoryEquip = nextBag.map((u) => (u && items[u] ? items[u].baseId : null));
    const inventoryState = nextBag.map((u) => (u && items[u] ? cloneState(items[u].state) : null));

    const bodyExpanded = { 1: {}, 2: {}, 3: {} };
    PRESET_KEYS.forEach((p) => {
      Object.keys(nextBody[p] || {}).forEach((slot) => {
        const u = nextBody[p][slot];
        if (!u || !items[u]) return;
        bodyExpanded[p][slot] = {
          itemId: items[u].baseId,
          state: cloneState(items[u].state),
          instanceUid: u,
        };
      });
    });

    const v2 = {
      ...v1,
      version: ITEM_STORE_SESSION_VERSION,
      items,
      bagSlots: nextBag,
      bodyWearByPreset: bodyExpanded,
      bodyWearUidByPreset: nextBody,
      enchantFocus: focus,
      orphanBenchUids: orphans,
      trunkSlots: nextTrunkSlots,
      inventoryEquip,
      inventoryState,
      equippedItem: null,
      equippedSlotIndex: null,
    };

    return {
      ok: errors.length === 0,
      v2: errors.length === 0 ? v2 : null,
      report,
      errors,
    };
  }

  /**
   * 載入 v2（或已遷移）session 進 Store，並投影 legacy。
   */
  function importSnapshot(session) {
    reset();
    if (!session || typeof session !== 'object') {
      return { ok: false, errors: ['empty session'] };
    }

    let data = session;
    if (!session.items || !Array.isArray(session.bagSlots)) {
      const migrated = migrateSessionV1toV2(session);
      if (!migrated.ok || !migrated.v2) {
        return { ok: false, errors: migrated.errors, report: migrated.report };
      }
      data = migrated.v2;
      if (typeof addLog === 'function') {
        const r = migrated.report;
        addLog(
          `[存檔] 裝備實體遷移完成：背包 ${r.bag}、穿著 ${r.body}、倉庫 ${r.trunk}`
            + (r.benchPlaced ? '、強化槽已歸位' : '')
            + (r.benchOrphan ? '、強化槽待安置' : ''),
          'log-info'
        );
      }
    }

    const items = data.items || {};
    Object.keys(items).forEach((uid) => {
      const raw = items[uid];
      if (!raw?.baseId) return;
      byUid[uid] = {
        uid,
        baseId: resolveId(raw.baseId),
        state: stampState(raw.state, raw.baseId),
      };
    });

    ensureBagSize();
    const bags = Array.isArray(data.bagSlots) ? data.bagSlots : [];
    for (let i = 0; i < bagSlots.length; i += 1) {
      const uid = bags[i];
      bagSlots[i] = uid && byUid[uid] ? uid : null;
    }

    bodyByPreset = emptyBodyPresets();
    const uidBody = data.bodyWearUidByPreset;
    const expBody = data.bodyWearByPreset;
    const uidBodyLooksValid = uidBody && typeof uidBody === 'object'
      && PRESET_KEYS.some((p) => Object.values(uidBody[p] || {}).some((v) => typeof v === 'string' && byUid[v]));
    if (uidBodyLooksValid) {
      PRESET_KEYS.forEach((p) => {
        const map = uidBody[p] || {};
        bodyByPreset[p] = {};
        Object.keys(map).forEach((slot) => {
          const uid = map[slot];
          if (uid && byUid[uid]) bodyByPreset[p][slot] = uid;
        });
      });
    } else if (expBody && typeof expBody === 'object') {
      PRESET_KEYS.forEach((p) => {
        const map = expBody[p] || {};
        bodyByPreset[p] = {};
        Object.keys(map).forEach((slot) => {
          const entry = map[slot];
          if (!entry) return;
          if (typeof entry === 'string' && byUid[entry]) {
            bodyByPreset[p][slot] = entry;
            return;
          }
          if (entry.instanceUid && byUid[entry.instanceUid]) {
            bodyByPreset[p][slot] = entry.instanceUid;
            return;
          }
          if (entry.itemId) {
            const uid = createInstance(entry.itemId, entry.state);
            if (uid) bodyByPreset[p][slot] = uid;
          }
        });
      });
    }

    symbolBySlot = Object.create(null);
    const uidSymbols = data.symbolWearUids;
    const expSymbols = data.symbolWear || data.symbolWearExpanded;
    if (uidSymbols && typeof uidSymbols === 'object'
      && Object.values(uidSymbols).some((v) => typeof v === 'string' && byUid[v])) {
      Object.keys(uidSymbols).forEach((slot) => {
        const uid = uidSymbols[slot];
        if (uid && byUid[uid]) symbolBySlot[slot] = uid;
      });
    } else if (expSymbols && typeof expSymbols === 'object') {
      Object.keys(expSymbols).forEach((slot) => {
        const entry = expSymbols[slot];
        if (!entry) return;
        if (typeof entry === 'string' && byUid[entry]) {
          symbolBySlot[slot] = entry;
          return;
        }
        if (entry.instanceUid && byUid[entry.instanceUid]) {
          symbolBySlot[slot] = entry.instanceUid;
          return;
        }
        if (entry.itemId) {
          const uid = createInstance(entry.itemId, entry.state);
          if (uid) symbolBySlot[slot] = uid;
        }
      });
    }

    ensureTrunkSize();
    const trunk = Array.isArray(data.trunkSlots) ? data.trunkSlots : [];
    for (let i = 0; i < trunkEquipUids.length; i += 1) {
      const e = trunk[i];
      if (!e || e.kind !== 'equip') continue;
      if (e.uid && byUid[e.uid]) {
        trunkEquipUids[i] = e.uid;
      } else if (e.itemId) {
        const uid = createInstance(e.itemId, e.state);
        trunkEquipUids[i] = uid;
      }
    }

    orphanBenchUids = Array.isArray(data.orphanBenchUids)
      ? data.orphanBenchUids.filter((u) => byUid[u])
      : [];

    if (data.enchantFocus && byUid[data.enchantFocus]) {
      enchantFocus = data.enchantFocus;
    }

    const inv = assertInvariants();
    if (!inv.ok) {
      return { ok: false, errors: inv.errors };
    }

    projectToLegacyArrays();
    return {
      ok: true,
      errors: [],
      enchantFocus,
      orphanBenchUids: orphanBenchUids.slice(),
      bodyWearExpanded: exportBodyWearByPresetExpanded(),
      symbolWearExpanded: exportSymbolWearExpanded(),
      trunkSlots: exportTrunkSlotsMerged(data.trunkSlots),
      sessionMeta: {
        activeEquipPreset: data.activeEquipPreset,
        pendingEquipPreset: data.pendingEquipPreset,
        inventoryConsume: data.inventoryConsume,
        inventoryEtc: data.inventoryEtc,
        trunkMeso: data.trunkMeso,
      },
    };
  }

  function getOrphanBenchUids() {
    return orphanBenchUids.slice();
  }

  function tryPlaceOrphansIntoBag() {
    const left = [];
    orphanBenchUids.forEach((uid) => {
      if (!byUid[uid]) return;
      const empty = bagSlots.findIndex((x) => !x);
      if (empty < 0) {
        left.push(uid);
        return;
      }
      bagSlots[empty] = uid;
    });
    orphanBenchUids = left;
    projectToLegacyArrays();
    return left.length;
  }

  return {
    ITEM_STORE_SESSION_VERSION,
    reset,
    get,
    createInstance,
    destroy,
    move,
    setEnchantFocus,
    clearEnchantFocus,
    getEnchantFocus,
    updateState,
    replaceState,
    ensureBagUid,
    ensureBodyUid,
    ensureSymbolUid,
    findBagIndex,
    findBodyLoc,
    findSymbolLoc,
    findTrunkIndex,
    assertInvariants,
    rebuildFromRuntime,
    projectToLegacyArrays,
    exportEquipSnapshot,
    exportBodyWearByPresetExpanded,
    exportSymbolWearExpanded,
    exportTrunkSlotsMerged,
    migrateSessionV1toV2,
    importSnapshot,
    getOrphanBenchUids,
    tryPlaceOrphansIntoBag,
    getBagSlots: () => bagSlots.slice(),
    getBodyByPreset: () => ({
      1: { ...(bodyByPreset[1] || {}) },
      2: { ...(bodyByPreset[2] || {}) },
      3: { ...(bodyByPreset[3] || {}) },
    }),
    getSymbolBySlot: () => ({ ...symbolBySlot }),
  };
})();

if (typeof window !== 'undefined') {
  window.ItemStore = ItemStore;
  window.ITEM_STORE_SESSION_VERSION = ITEM_STORE_SESSION_VERSION;
}
