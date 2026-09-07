/**
 * 套裝效果：以 wzImportedSetItems.js（Etc.SetItemInfo）為準。
 * 永恆 886–890、神祕冥界 617–621 合併顯示；創世／命運武器仍可用名稱匹配。
 */

const ETERNAL_SET_IDS = [886, 887, 888, 889, 890];
const ARCANE_SET_IDS = [617, 618, 619, 620, 621];

/** SetItem Option（無 ItemOption.wz 時的對照；level 對應表上數值） */
const SET_ITEM_OPTION_LINES = {
  '60020@1': '爆擊傷害 +5%',
  '60023@13': '無視怪物防禦率 +10%',
  '60024@13': '攻擊Boss怪物時傷害 +10%',
  '60087@13': '無視怪物防禦率 +20%',
  '60088@13': '攻擊Boss怪物時傷害 +15%',
  '60089@13': '無視怪物防禦率 +15%',
  // 露塔必思 4 件：潛能表 option 30602 lv15（本專案潛能儲存格式不同，直接對照）
  '30602@15': '攻擊Boss怪物時傷害 +30%',
  '40116@14': '異常狀態抗性: +10' ,
  '30602@14': '攻擊Boss怪物時傷害 +30%',
};

const SET_ITEM_TYPE_META = [
  { code: 100, slot: '帽子' },
  { code: 101, slot: '臉飾' },
  { code: 102, slot: '眼飾' },
  { code: 103, slot: '耳環' },
  { code: 104, slot: '上衣' },
  { code: 105, slot: '套服' },
  { code: 106, slot: '褲/裙' },
  { code: 107, slot: '鞋子' },
  { code: 108, slot: '手套' },
  { code: 109, slot: '盾牌' },
  { code: 110, slot: '披風' },
  { code: 111, slot: '戒指' },
  { code: 112, slot: '墜飾' },
  { code: 113, slot: '腰帶' },
  { code: 114, slot: '勳章' },
  { code: 115, slot: '肩膀裝飾' },
  { code: 116, slot: '口袋道具' },
  { code: 118, slot: '胸章' },
  { code: 119, slot: '徽章' },
  { code: 166, slot: '機器人' },
  { code: 167, slot: '機器心臟' },
];

function padSetItemId(raw) {
  const digits = String(raw || '').replace(/\D/g, '');
  if (!digits) return '';
  return digits.padStart(8, '0').slice(-8);
}

function setItemTypeCode(itemId) {
  const digits = String(itemId || '').replace(/\D/g, '').replace(/^0+/, '') || '0';
  if (digits.length < 3) return Number(digits) || 0;
  return Number(digits.slice(0, 3)) || 0;
}

function isSetWeaponTypeCode(code) {
  return code >= 121 && code <= 159;
}

function setSlotMeta(itemId) {
  const code = setItemTypeCode(itemId);
  if (isSetWeaponTypeCode(code)) return { code, slot: '武器', weapon: true };
  const hit = SET_ITEM_TYPE_META.find((row) => row.code === code);
  return { code, slot: hit?.slot || `道具(${code})`, weapon: false };
}

function lookupSetItemName(itemId) {
  const id = padSetItemId(itemId);
  if (typeof ITEM_DATABASE !== 'undefined' && ITEM_DATABASE[id]?.name) return ITEM_DATABASE[id].name;
  if (typeof WZ_IMPORTED_EQUIP_RECORDS !== 'undefined') {
    const row = WZ_IMPORTED_EQUIP_RECORDS.find((r) => r.id === id);
    if (row?.name) return row.name;
  }
  return id;
}

function stripJobSetName(name) {
  return String(name || '')
    .replace(/（[^）]*）/g, '')
    .replace(/\([^)]*\)/g, '')
    .replace(/\(劍士\)|\(法師\)|\(弓箭手\)|\(盜賊\)|\(海盜\)|\(戰士\)|\(弓手\)/g, '')
    .trim();
}

/** 永恆／神祕冥界套組武器：名稱含創世／命運，且為武器部位（含神之子 Wpsi） */
function isEternalSetWeaponCandidate(row) {
  const name = String(row?.name || row?.item?.name || '');
  if (!name.includes('創世') && !name.includes('命運')) return false;
  const item = row?.item;
  if (!item) return false;
  if (typeof EQUIP_TYPE !== 'undefined' && item.mainType === EQUIP_TYPE.WEAPON) return true;
  const islot = item.islot || '';
  return islot === 'Wp' || islot === 'Wpsi' || islot === 'Gw' || islot === 'Op';
}

function getWzSetRecord(setItemId) {
  const id = String(Number(setItemId) || 0);
  if (!id || id === '0') return null;
  if (typeof WZ_IMPORTED_SET_ITEM_BY_ID !== 'undefined' && WZ_IMPORTED_SET_ITEM_BY_ID[id]) {
    return WZ_IMPORTED_SET_ITEM_BY_ID[id];
  }
  if (typeof WZ_IMPORTED_SET_ITEM_RECORDS !== 'undefined') {
    return WZ_IMPORTED_SET_ITEM_RECORDS.find((row) => Number(row.id) === Number(setItemId)) || null;
  }
  return null;
}

function formatSetStatLines(stats) {
  const s = stats || {};
  const lines = [];
  const take = (key) => {
    const v = Number(s[key]) || 0;
    return v;
  };

  const all = take('incAllStat');
  const pad = take('incPAD');
  const mad = take('incMAD');
  const mhp = take('incMHP');
  const mmp = take('incMMP');
  const mhpr = take('incMHPr');
  const mmpr = take('incMMPr');
  const pdd = take('incPDD');
  const mdd = take('incMDD');
  const str = take('incSTR');
  const dex = take('incDEX');
  const int_ = take('incINT');
  const luk = take('incLUK');

  const flatParts = [];
  if (all) flatParts.push(`全屬性 +${all}`);
  if (str) flatParts.push(`STR +${str}`);
  if (dex) flatParts.push(`DEX +${dex}`);
  if (int_) flatParts.push(`INT +${int_}`);
  if (luk) flatParts.push(`LUK +${luk}`);
  if (mhp && mmp && mhp === mmp) flatParts.push(`最大HP/最大MP +${mhp}`);
  else {
    if (mhp) flatParts.push(`最大HP +${mhp}`);
    if (mmp) flatParts.push(`最大MP +${mmp}`);
  }
  if (flatParts.length) lines.push(flatParts.join(', '));

  if (pad && mad && pad === mad) lines.push(`攻擊力/魔力 +${pad}`);
  else {
    if (pad) lines.push(`攻擊力 +${pad}`);
    if (mad) lines.push(`魔力 +${mad}`);
  }

  if (pdd) lines.push(`防禦力 +${pdd}`);
  if (mdd && mdd !== pdd) lines.push(`魔法防禦力 +${mdd}`);

  if (mhpr && mmpr && mhpr === mmpr) lines.push(`最大HP/最大MP +${mhpr}%`);
  else {
    if (mhpr) lines.push(`最大HP +${mhpr}%`);
    if (mmpr) lines.push(`最大MP +${mmpr}%`);
  }

  return lines;
}

function formatSetOptionLines(options) {
  return (options || []).map((opt) => {
    const key = `${Number(opt.option) || 0}@${Number(opt.level) || 0}`;
    return SET_ITEM_OPTION_LINES[key] || `潛在能力選項 ${key}`;
  }).filter(Boolean);
}

function formatSetEffectLines(tierEffect) {
  if (!tierEffect) return [];
  return [
    ...formatSetStatLines(tierEffect.stats),
    ...formatSetOptionLines(tierEffect.options),
  ];
}

function groupSetPieces(itemIds, opts = {}) {
  /** 可同時穿著多件、且套裝清單各自計件（如戒指） */
  const multiInstanceTypes = new Set([111]);
  const groups = new Map();
  (itemIds || []).forEach((rawId) => {
    const id = padSetItemId(rawId);
    if (!id) return;
    const meta = setSlotMeta(id);
    if (opts.weaponMatch && meta.weapon) return;
    if (multiInstanceTypes.has(meta.code)) {
      const key = `multi:${id}`;
      groups.set(key, {
        slot: meta.slot,
        itemIds: [id],
        weapon: false,
        order: meta.code,
        forceSingle: true,
      });
      return;
    }
    const key = meta.weapon ? 'weapon' : `t${meta.code}`;
    if (!groups.has(key)) {
      groups.set(key, {
        slot: meta.slot,
        itemIds: [],
        weapon: meta.weapon,
        order: meta.weapon ? 500 : meta.code,
      });
    }
    const g = groups.get(key);
    if (!g.itemIds.includes(id)) g.itemIds.push(id);
  });

  const pieces = [...groups.values()]
    .sort((a, b) => a.order - b.order || String(a.itemIds[0]).localeCompare(String(b.itemIds[0])))
    .map((g) => {
      const names = g.itemIds.map((id) => lookupSetItemName(id));
      const uniqueNames = [...new Set(names.filter(Boolean))];
      const chooseOne = !g.forceSingle && g.itemIds.length > 1;
      let name = uniqueNames[0] || g.slot;
      const looksLikeId = (n) => !n || /^\d{7,8}$/.test(String(n));
      if (chooseOne) {
        if (g.weapon) name = opts.weaponDesc || '可選擇其中一件武器';
        else {
          const nice = uniqueNames.find((n) => !looksLikeId(n));
          name = nice ? `${stripJobSetName(nice)}（擇1）` : `${g.slot}（擇1）`;
        }
      } else if (looksLikeId(name)) {
        name = g.slot;
      }
      return {
        slot: g.slot,
        name,
        itemIds: g.itemIds,
        chooseOne,
      };
    });

  if (opts.weaponMatch) {
    pieces.push({
      slot: '武器',
      name: opts.weaponDesc || '可選擇創世或命運武器其一',
      match: 'eternalWeapon',
      chooseOne: true,
    });
    pieces.sort((a, b) => {
      const ao = a.slot === '武器' ? 500 : setItemTypeCode(a.itemIds?.[0] || 0);
      const bo = b.slot === '武器' ? 500 : setItemTypeCode(b.itemIds?.[0] || 0);
      if (ao !== bo) return ao - bo;
      return String(a.itemIds?.[0] || '').localeCompare(String(b.itemIds?.[0] || ''));
    });
  }
  return pieces;
}

function buildEffectsFromWz(effectsObj) {
  const out = {};
  Object.keys(effectsObj || {}).forEach((key) => {
    const n = Number(key);
    if (!Number.isFinite(n)) return;
    const lines = formatSetEffectLines(effectsObj[key]);
    if (lines.length) out[n] = lines;
  });
  return out;
}

function buildDefFromWzRecord(rec, override = {}) {
  if (!rec) return null;
  const weaponMatch = !!override.weaponMatch;
  const weaponDesc = override.weaponDesc
    || rec.desc?.weapon
    || (weaponMatch ? '可選擇創世或命運武器其一' : '');
  const itemIds = override.itemIds || rec.itemIds || [];
  return {
    id: override.id != null ? override.id : rec.id,
    name: override.name || stripJobSetName(rec.name) || rec.name,
    setIds: override.setIds || [rec.id],
    completeCount: override.completeCount || rec.completeCount || 0,
    jokerPossible: !!(override.jokerPossible ?? rec.jokerPossible),
    pieces: groupSetPieces(itemIds, { weaponMatch, weaponDesc }),
    effects: buildEffectsFromWz(override.effects || rec.effects),
    source: 'setItemInfo',
  };
}

function mergeWzSetRecords(setIds, mergeOpts) {
  const records = setIds.map((id) => getWzSetRecord(id)).filter(Boolean);
  if (!records.length) return null;
  const itemIds = [];
  const seen = new Set();
  records.forEach((rec) => {
    (rec.itemIds || []).forEach((id) => {
      const p = padSetItemId(id);
      if (!p || seen.has(p)) return;
      seen.add(p);
      itemIds.push(p);
    });
  });
  // 效果以第一筆職業分支為準（各分支相同）
  return buildDefFromWzRecord(records[0], {
    id: mergeOpts.key,
    name: mergeOpts.name,
    setIds,
    itemIds,
    weaponMatch: true,
    weaponDesc: records[0].desc?.weapon || mergeOpts.weaponDesc,
    effects: records[0].effects,
    completeCount: records[0].completeCount,
    jokerPossible: records.some((r) => r.jokerPossible),
  });
}

const _equipSetDefCache = Object.create(null);

function getEquipSetDef(setItemId) {
  const id = Number(setItemId) || 0;
  if (!id) return null;
  if (ETERNAL_SET_IDS.includes(id)) {
    if (!_equipSetDefCache.eternal) {
      _equipSetDefCache.eternal = mergeWzSetRecords(ETERNAL_SET_IDS, {
        key: 'eternal',
        name: '永恆套組',
      });
    }
    return _equipSetDefCache.eternal;
  }
  if (ARCANE_SET_IDS.includes(id)) {
    if (!_equipSetDefCache.arcane) {
      _equipSetDefCache.arcane = mergeWzSetRecords(ARCANE_SET_IDS, {
        key: 'arcane',
        name: '神祕冥界套裝',
      });
    }
    return _equipSetDefCache.arcane;
  }
  const cacheKey = String(id);
  if (_equipSetDefCache[cacheKey]) return _equipSetDefCache[cacheKey];
  const rec = getWzSetRecord(id);
  if (!rec) return null;
  const def = buildDefFromWzRecord(rec);
  _equipSetDefCache[cacheKey] = def;
  return def;
}

/** 目前穿著可能觸發的套裝 def（依 setItemID；合併組去重） */
function listActiveEquipSetDefs(wornList) {
  const seen = new Set();
  const defs = [];
  (wornList || []).forEach((row) => {
    const def = getEquipSetDef(row.setId);
    if (!def) return;
    const key = String(def.id);
    if (seen.has(key)) return;
    seen.add(key);
    defs.push(def);
  });
  return defs;
}

function getWornEquipEntries() {
  if (typeof UiEquipModule === 'undefined' || typeof UiEquipModule.getActiveWearEntries !== 'function') {
    return [];
  }
  return (UiEquipModule.getActiveWearEntries() || []).filter((entry) => entry?.itemId);
}

function resolveWornItem(entry) {
  if (!entry?.itemId) return null;
  if (typeof EquipTooltipModule !== 'undefined' && typeof EquipTooltipModule.resolveItemState === 'function') {
    return EquipTooltipModule.resolveItemState(
      entry.itemId,
      `body:${entry.slotId}`,
      entry.state,
    );
  }
  return typeof ITEM_DATABASE !== 'undefined' ? ITEM_DATABASE[entry.itemId] : null;
}

function findWornForIds(wornList, itemIds) {
  const idSet = new Set((itemIds || []).map(String));
  if (!idSet.size) return null;
  return wornList.find((row) => idSet.has(String(row.itemId))) || null;
}

function findWornForPiece(wornList, piece) {
  if (!piece) return null;
  if (piece.match === 'eternalWeapon') {
    return wornList.find((row) => isEternalSetWeaponCandidate(row)) || null;
  }
  if (typeof piece.match === 'function') {
    return wornList.find((row) => piece.match(row)) || null;
  }
  return findWornForIds(wornList, piece.itemIds);
}

function wornListFromEntries(entries) {
  return (entries || getWornEquipEntries()).map((entry) => {
    const item = resolveWornItem(entry);
    return {
      itemId: String(entry.itemId),
      name: item?.name || entry.itemId,
      joker: !!(item?.wz?.jokerToSetItem),
      setId: Number(item?.wz?.setItemID) || 0,
      item,
    };
  });
}

function snapshotSetFromWornList(def, wornList) {
  const groupFilled = Object.create(null);
  const rows = def.pieces.map((piece, index) => {
    const worn = findWornForPiece(wornList, piece);
    const group = piece.group || `p${index}`;
    if (worn) groupFilled[group] = true;
    const lucky = !!(worn?.joker);
    const wornName = worn ? worn.name : '';
    let luckyKind = null;
    if (lucky) {
      luckyKind = String(wornName).includes('創世') ? 'genesis' : 'destiny';
    }
    return {
      slot: piece.slot,
      name: piece.name,
      chooseOne: !!piece.chooseOne,
      group,
      equipped: !!worn,
      lucky,
      luckyKind,
      displayName: worn ? worn.name : piece.name,
    };
  });

  const groups = [];
  rows.forEach((row) => {
    if (!groups.includes(row.group)) groups.push(row.group);
  });
  const wornCount = groups.filter((g) => groupFilled[g]).length;
  const total = def.completeCount > 0 ? def.completeCount : groups.length;

  return {
    def,
    name: def.name,
    wornCount,
    total,
    rows,
    effects: Object.keys(def.effects)
      .map(Number)
      .sort((a, b) => a - b)
      .map((n) => ({
        count: n,
        lines: def.effects[n],
        active: wornCount >= n,
      })),
  };
}

function getEquipSetSnapshot(setItemId, entries) {
  const def = getEquipSetDef(setItemId);
  if (!def) return null;
  return snapshotSetFromWornList(def, wornListFromEntries(entries));
}

const SET_STAT_LABEL_ALIASES = {
  全屬性: ['全屬性'],
  最大HP: ['最大HP'],
  最大MP: ['最大MP'],
  '最大HP/最大MP': ['最大HP', '最大MP'],
  '攻擊力/魔力': ['攻擊力', '魔法攻擊力'],
  攻擊力: ['攻擊力'],
  魔力: ['魔法攻擊力'],
  防禦力: ['防禦力'],
  物理防禦力: ['防禦力'],
  魔法防禦力: ['防禦力'],
  攻擊Boss怪物時傷害: ['BOSS怪物傷害'],
  BOSS怪物傷害: ['BOSS怪物傷害'],
  無視怪物防禦率: ['無視防禦率'],
  無視防禦率: ['無視防禦率'],
  爆擊傷害: ['爆擊傷害'],
  STR: ['STR'],
  DEX: ['DEX'],
  INT: ['INT'],
  LUK: ['LUK'],
};

const SET_MAIN_LABELS = new Set([
  'STR', 'DEX', 'INT', 'LUK', '最大HP', '最大MP', '攻擊力', '魔法攻擊力', '防禦力',
]);

function expandSetStatLabel(raw) {
  const key = String(raw || '').replace(/\s+/g, '');
  return SET_STAT_LABEL_ALIASES[key] || [String(raw || '').trim()];
}

function applySetEffectLine(line, acc) {
  String(line || '').split(/[,，]/).forEach((clause) => {
    const text = clause.trim();
    if (!text) return;
    const m = text.match(/^(.+?)\s*\+(\d+(?:\.\d+)?)(%?)$/);
    if (!m) return;
    const labels = expandSetStatLabel(m[1]);
    const value = Number(m[2]) || 0;
    const isPercent = m[3] === '%';
    if (!value) return;
    labels.forEach((label) => {
      if (/無視.*防禦/.test(label) && isPercent) {
        acc.ied.push(value);
        acc.extra[label] = (acc.extra[label] || 0) + value;
        acc.extraPercent[label] = true;
        return;
      }
      if (isPercent && (label === '最大HP' || label === '最大MP')) {
        const pctKey = `${label}%`;
        acc.extra[pctKey] = (acc.extra[pctKey] || 0) + value;
        acc.extraPercent[pctKey] = true;
        return;
      }
      if (isPercent && label === '全屬性') {
        acc.extra['全屬性%'] = (acc.extra['全屬性%'] || 0) + value;
        acc.extraPercent['全屬性%'] = true;
        return;
      }
      if (!isPercent && SET_MAIN_LABELS.has(label)) {
        acc.main[label] = (acc.main[label] || 0) + value;
        return;
      }
      acc.extra[label] = (acc.extra[label] || 0) + value;
      if (isPercent) acc.extraPercent[label] = true;
    });
  });
}

/** 目前（或指定）穿著的套裝效果加總，供戰鬥力／屬性面板使用 */
function collectEquipSetBonuses(entries) {
  const wornList = wornListFromEntries(entries);
  const acc = { main: {}, extra: {}, extraPercent: {}, ied: [], details: [] };
  listActiveEquipSetDefs(wornList).forEach((def) => {
    const snap = snapshotSetFromWornList(def, wornList);
    if (!snap.wornCount) return;
    const setAcc = { main: {}, extra: {}, extraPercent: {}, ied: [] };
    snap.effects.forEach((block) => {
      if (!block.active) return;
      block.lines.forEach((line) => {
        applySetEffectLine(line, acc);
        applySetEffectLine(line, setAcc);
      });
    });
    acc.details.push({
      id: def.id,
      name: def.name,
      wornCount: snap.wornCount,
      total: snap.total,
      totals: setAcc,
    });
  });
  return acc;
}

/** 供標籤／除錯：常用套組顯示名（其餘走 SetItemInfo 名稱） */
function getEquipSetLabel(setItemId) {
  const id = Number(setItemId) || 0;
  if (ETERNAL_SET_IDS.includes(id)) return '永恆套組';
  if (ARCANE_SET_IDS.includes(id)) return '神祕冥界套裝';
  if (typeof EQUIP_SET_LABELS !== 'undefined' && EQUIP_SET_LABELS[id]) return EQUIP_SET_LABELS[id];
  const rec = getWzSetRecord(id);
  return rec ? stripJobSetName(rec.name) || rec.name : '';
}
