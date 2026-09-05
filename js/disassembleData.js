/**
 * 分解中心配方。直接改這份清單即可。
 *
 * 格式：裝備／卷軸 ID → 可分解出的 ETC 材料 { etcId: 數量, ... }
 *   EQUIP_DISASSEMBLE_LIST['01005980'] = { eternalpcs: 1 }
 *   SCROLL_DISASSEMBLE_LIST['scroll_glory_armor_atk'] = { spell_trace: 1 }
 */

function disassembleFillIds(ids, materials) {
  const out = {};
  (ids || []).forEach((id) => {
    const key = String(id || '').trim();
    if (key) out[key] = { ...materials };
  });
  return out;
}

const EQUIP_DISASSEMBLE_LIST = {
  // 永恆防具 → 永恆粉塵
  ...disassembleFillIds([
    '01005980', '01005981', '01005982', '01005983', '01005984',
    '01042433', '01042434', '01042435', '01042436', '01042437',
    '01062285', '01062286', '01062287', '01062288', '01062289',
    '01152212', '01152213', '01152214', '01152215', '01152216',
    '01082760', '01082761', '01082762', '01082763', '01082764',
    '01073629', '01073630', '01073631', '01073632', '01073633',
    '01103433', '01103434', '01103435', '01103436', '01103437',
  ], { eternalpcs: 10 }),

  // 神祕冥界防具 → 神祕粉塵
  ...disassembleFillIds([
    '01004808', '01004809', '01004810', '01004811', '01004812',
    '01053063', '01053064', '01053065', '01053066', '01053067',
    '01152174', '01152175', '01152176', '01152177', '01152178',
    '01082695', '01082696', '01082697', '01082698', '01082699',
    '01073158', '01073159', '01073160', '01073161', '01073162',
    '01102940', '01102941', '01102942', '01102943', '01102944',
  ], { arcanepcs: 5 }),

  // 漆黑 BOSS 套 → 漆黑粉塵
  ...disassembleFillIds([
    '01012632', '01022278', '01132308', '01122430', '01182285',
    '01032316', '01113306',
    '01162080', '01162081', '01162082', '01162083',
    '01190566', '01190567', '01190568', '01190569', '01190570',
    '01672101',
  ], { darkpcs: 5 }),

  // 濃姬副武 → 濃姬粉塵（在此加 ID）
  // '01xxxxxx': { Nohimepcs: 1 },
};

const SCROLL_DISASSEMBLE_LIST = {
  // 專用卷軸 → 咒文的痕跡
  ...disassembleFillIds([
    'scroll_glory_one_hand_weapon_atk', 'scroll_glory_one_hand_weapon_matk',
    'scroll_glory_two_hand_weapon_atk', 'scroll_glory_two_hand_weapon_matk',
    'scroll_glory_armor_atk', 'scroll_glory_armor_matk',
    'scroll_glory_accessory_atk', 'scroll_glory_accessory_matk',
    'scroll_chaos',
    'scroll_destiny_one_hand_weapon_atk', 'scroll_destiny_one_hand_weapon_matk',
    'scroll_destiny_two_hand_weapon_atk', 'scroll_destiny_two_hand_weapon_matk',
    'scroll_destiny_armor_atk', 'scroll_destiny_armor_matk',
    'scroll_destiny_accessory_atk', 'scroll_destiny_accessory_matk',
    'scroll_savior_one_hand_weapon_atk', 'scroll_savior_one_hand_weapon_matk',
    'scroll_savior_two_hand_weapon_atk', 'scroll_savior_two_hand_weapon_matk',
    'scroll_savior_armor_atk', 'scroll_savior_armor_matk',
    'scroll_savior_accessory_atk', 'scroll_savior_accessory_matk',
    'scroll_rainbow_one_hand_weapon_atk', 'scroll_rainbow_one_hand_weapon_matk',
    'scroll_rainbow_two_hand_weapon_atk', 'scroll_rainbow_two_hand_weapon_matk',
    'scroll_rainbow_armor_atk', 'scroll_rainbow_armor_matk',
    'scroll_rainbow_accessory_atk', 'scroll_rainbow_accessory_matk',
    'scroll_black_one_hand_weapon_atk', 'scroll_black_one_hand_weapon_matk',
    'scroll_black_two_hand_weapon_atk', 'scroll_black_two_hand_weapon_matk',
    'scroll_black_armor_atk', 'scroll_black_armor_matk',
    'scroll_black_accessory_atk', 'scroll_black_accessory_matk',
  ], { spell_trace: 1 }),

  // 普通卷軸 → 咒文的痕跡
  ...disassembleFillIds([
    'scroll_normal_weapon_atk_100', 'scroll_normal_weapon_matk_100',
    'scroll_normal_non_weapon_str_100', 'scroll_normal_non_weapon_int_100',
    'scroll_normal_non_weapon_dex_100', 'scroll_normal_non_weapon_luk_100',
  ], { spell_trace: 10 }),
  ...disassembleFillIds([
    'scroll_normal_weapon_atk_70',
    'scroll_normal_weapon_matk_70',
    'scroll_normal_non_weapon_str_70',
    'scroll_normal_non_weapon_int_70',
    'scroll_normal_non_weapon_dex_70',
    'scroll_normal_non_weapon_luk_70',
  ], { spell_trace: 30 }),
  ...disassembleFillIds([
    'scroll_normal_weapon_atk_30',
    'scroll_normal_weapon_matk_30',
    'scroll_normal_non_weapon_str_30',
    'scroll_normal_non_weapon_int_30',
    'scroll_normal_non_weapon_dex_30',
    'scroll_normal_non_weapon_luk_30',
  ], { spell_trace: 100 }),
  ...disassembleFillIds([
    'scroll_normal_weapon_atk_15',
    'scroll_normal_weapon_matk_15',
    'scroll_normal_non_weapon_str_15',
    'scroll_normal_non_weapon_int_15',
    'scroll_normal_non_weapon_dex_15',
    'scroll_normal_non_weapon_luk_15',
  ], { spell_trace: 500 }),
};

const DisassembleStore = {
  normalizeMaterials(raw) {
    if (!raw) return null;
    if (typeof raw === 'string') {
      const id = raw.trim();
      return id ? { [id]: 1 } : null;
    }
    if (Array.isArray(raw)) {
      const out = {};
      raw.forEach((row) => {
        const id = String(row?.id || row?.itemId || '').trim();
        const n = Math.max(0, Math.floor(Number(row?.amount ?? row?.count) || 0));
        if (id && n > 0) out[id] = (out[id] || 0) + n;
      });
      return Object.keys(out).length ? out : null;
    }
    if (typeof raw === 'object') {
      const out = {};
      Object.entries(raw).forEach(([id, amt]) => {
        const n = Math.max(0, Math.floor(Number(amt) || 0));
        if (id && n > 0) out[id] = n;
      });
      return Object.keys(out).length ? out : null;
    }
    return null;
  },

  equipMaterials(itemId) {
    return this.normalizeMaterials(EQUIP_DISASSEMBLE_LIST[String(itemId || '')]);
  },

  scrollMaterials(scrollId) {
    return this.normalizeMaterials(SCROLL_DISASSEMBLE_LIST[String(scrollId || '')]);
  },

  etcMeta(itemId) {
    return typeof IdleEtcStore !== 'undefined' ? IdleEtcStore.get(itemId) : null;
  },

  etcName(itemId) {
    return this.etcMeta(itemId)?.name || itemId;
  },

  etcIcon(itemId) {
    return this.etcMeta(itemId)?.icon || '';
  },

  equipName(itemId) {
    const item = typeof ITEM_DATABASE !== 'undefined' ? ITEM_DATABASE[itemId] : null;
    return item?.name || itemId;
  },

  equipIcon(itemId) {
    const item = typeof ITEM_DATABASE !== 'undefined' ? ITEM_DATABASE[itemId] : null;
    return item?.icon || (itemId ? `images/equip/${itemId}.png` : '');
  },

  materialsLabel(mats) {
    return Object.entries(mats || {}).map(([id, amt]) => (
      `${this.etcName(id)} ×${amt}`
    )).join('、');
  },

  canGrantEtc(mats) {
    if (!mats || typeof InventoryModule === 'undefined') return false;
    if (typeof playerInventoryEtc === 'undefined') return false;
    let needNew = 0;
    Object.keys(mats).forEach((id) => {
      if (InventoryModule.countEtc(id) <= 0) needNew += 1;
    });
    if (!needNew) return true;
    let empty = 0;
    playerInventoryEtc.forEach((entry) => {
      if (!entry) empty += 1;
    });
    return empty >= needNew;
  },

  grantEtc(mats) {
    if (!this.canGrantEtc(mats)) return false;
    Object.entries(mats).forEach(([id, amt]) => {
      InventoryModule.addEtcItem({ itemId: id, amount: amt }, { silent: true, logTag: '分解' });
    });
    return true;
  },

  listBagEquips() {
    const out = [];
    if (typeof playerInventoryEquip === 'undefined') return out;
    playerInventoryEquip.forEach((itemId, slotIndex) => {
      if (!itemId) return;
      const materials = this.equipMaterials(itemId);
      if (!materials) return;
      out.push({
        kind: 'equip',
        slotIndex,
        itemId,
        name: this.equipName(itemId),
        icon: this.equipIcon(itemId),
        materials,
      });
    });
    return out;
  },

  listBagScrolls() {
    const out = [];
    if (typeof playerInventoryConsume === 'undefined') return out;
    const T = typeof CONSUME_ITEM_TYPE !== 'undefined' ? CONSUME_ITEM_TYPE : {};
    playerInventoryConsume.forEach((entry, slotIndex) => {
      if (!entry || entry.type !== (T.GLORY_SCROLL || 'glory_scroll')) return;
      const scrollId = String(entry.scrollId || '');
      const materials = this.scrollMaterials(scrollId);
      if (!materials) return;
      const count = typeof getPlayerGloryScrollCount === 'function'
        ? getPlayerGloryScrollCount(scrollId)
        : 0;
      if (count <= 0) return;
      const scroll = typeof getScrollById === 'function' ? getScrollById(scrollId) : null;
      out.push({
        kind: 'scroll',
        slotIndex,
        scrollId,
        name: scroll?.name || scrollId,
        icon: scroll?.icon || '',
        count,
        materials,
      });
    });
    return out;
  },

  disassembleEquip(slotIndex) {
    if (!Number.isInteger(slotIndex) || slotIndex < 0) return false;
    if (typeof playerInventoryEquip === 'undefined') return false;
    const itemId = playerInventoryEquip[slotIndex];
    const materials = this.equipMaterials(itemId);
    if (!itemId || !materials) return false;
    if (!this.canGrantEtc(materials)) {
      if (typeof addLog === 'function') addLog('[分解] 其他欄空間不足。', 'log-fail');
      return false;
    }
    const name = this.equipName(itemId);
    if (typeof currentEnchantItem !== 'undefined' && currentEnchantItem?.slotIndex === slotIndex) {
      currentEnchantItem = null;
      if (typeof updateUI === 'function') updateUI();
    }
    playerInventoryEquip[slotIndex] = null;
    if (typeof playerInventoryState !== 'undefined') playerInventoryState[slotIndex] = null;
    if (typeof playerInventory !== 'undefined' && Array.isArray(playerInventory)) {
      playerInventory.splice(0, playerInventory.length, ...playerInventoryEquip);
    }
    this.grantEtc(materials);
    if (typeof SessionPersistenceModule !== 'undefined') SessionPersistenceModule.scheduleSave();
    if (typeof InventoryModule !== 'undefined') {
      InventoryModule.render?.();
      InventoryModule.updateSlotCount?.();
    }
    if (typeof addLog === 'function') {
      addLog(`[分解] 已分解【${name}】→ ${this.materialsLabel(materials)}`, 'log-success');
    }
    return true;
  },

  scaleMaterials(mats, times) {
    const n = Math.max(1, Math.floor(Number(times) || 1));
    const out = {};
    Object.entries(mats || {}).forEach(([id, amt]) => {
      const v = Math.max(0, Math.floor(Number(amt) || 0)) * n;
      if (id && v > 0) out[id] = v;
    });
    return Object.keys(out).length ? out : null;
  },

  disassembleScroll(slotIndex, amount = 1) {
    if (!Number.isInteger(slotIndex) || slotIndex < 0) return false;
    if (typeof playerInventoryConsume === 'undefined') return false;
    const entry = playerInventoryConsume[slotIndex];
    const T = typeof CONSUME_ITEM_TYPE !== 'undefined' ? CONSUME_ITEM_TYPE : {};
    if (!entry || entry.type !== (T.GLORY_SCROLL || 'glory_scroll')) return false;
    const scrollId = String(entry.scrollId || '');
    const materials = this.scrollMaterials(scrollId);
    if (!materials) return false;
    const have = typeof getPlayerGloryScrollCount === 'function' ? getPlayerGloryScrollCount(scrollId) : 0;
    if (have <= 0) return false;
    const times = amount === 'all'
      ? have
      : Math.min(have, Math.max(1, Math.floor(Number(amount) || 1)));
    const grant = this.scaleMaterials(materials, times);
    if (!grant || !this.canGrantEtc(grant)) {
      if (typeof addLog === 'function') addLog('[分解] 其他欄空間不足。', 'log-fail');
      return false;
    }
    if (typeof consumeGloryScroll !== 'function' || !consumeGloryScroll(scrollId, times)) return false;
    const left = typeof getPlayerGloryScrollCount === 'function' ? getPlayerGloryScrollCount(scrollId) : 0;
    if (left <= 0 && typeof InventoryModule !== 'undefined') {
      InventoryModule.clearConsumeSlot?.(slotIndex);
    }
    this.grantEtc(grant);
    if (typeof SessionPersistenceModule !== 'undefined') SessionPersistenceModule.scheduleSave();
    if (typeof InventoryModule !== 'undefined') {
      InventoryModule.render?.();
      InventoryModule.updateSlotCount?.();
    }
    const scroll = typeof getScrollById === 'function' ? getScrollById(scrollId) : null;
    if (typeof addLog === 'function') {
      const qty = times > 1 ? `×${times} ` : '';
      addLog(`[分解] 已分解【${scroll?.name || scrollId}】${qty}→ ${this.materialsLabel(grant)}`, 'log-success');
    }
    return true;
  },
};

if (typeof window !== 'undefined') {
  window.EQUIP_DISASSEMBLE_LIST = EQUIP_DISASSEMBLE_LIST;
  window.SCROLL_DISASSEMBLE_LIST = SCROLL_DISASSEMBLE_LIST;
  window.DisassembleStore = DisassembleStore;
}
