/**
 * 貓谷特殊強化 — 類型判定與數值表
 * 數值併入卷軸紫字（scroll* / scrollDamR / scrollBdR）
 */

const CAT_VALLEY_ENHANCE_TYPE = {
  OLD_ETERNAL: 'oldEternal',
  NEW_ETERNAL: 'newEternal',
  MITRA: 'mitra',
  OFFHAND: 'offhand',
};

const CAT_VALLEY_ENHANCE_META = {
  [CAT_VALLEY_ENHANCE_TYPE.OLD_ETERNAL]: {
    id: CAT_VALLEY_ENHANCE_TYPE.OLD_ETERNAL,
    label: '舊永恆強化',
    maxLevel: 20,
  },
  [CAT_VALLEY_ENHANCE_TYPE.NEW_ETERNAL]: {
    id: CAT_VALLEY_ENHANCE_TYPE.NEW_ETERNAL,
    label: '新永恆強化',
    maxLevel: 20,
  },
  [CAT_VALLEY_ENHANCE_TYPE.MITRA]: {
    id: CAT_VALLEY_ENHANCE_TYPE.MITRA,
    label: '米特拉強化',
    maxLevel: 15,
  },
  [CAT_VALLEY_ENHANCE_TYPE.OFFHAND]: {
    id: CAT_VALLEY_ENHANCE_TYPE.OFFHAND,
    label: '副手強化',
    maxLevel: 10,
  },
};

const CAT_VALLEY_OLD_ETERNAL_SLOTS = new Set(['Cp', 'Ma', 'MaPn', 'Pn', 'Sh']);
const CAT_VALLEY_NEW_ETERNAL_SLOTS = new Set(['Gv', 'So', 'Sr']);
const CAT_VALLEY_PRIMARY_STAT_KEYS = ['str', 'dex', 'int', 'luk'];
const CAT_VALLEY_PRIMARY_SCROLL_FIELDS = {
  str: 'scrollStr',
  dex: 'scrollDex',
  int: 'scrollInt',
  luk: 'scrollLuk',
};

/** 各強化類型：依目標等級（即將升到的等級）對應耗材 */
const CAT_VALLEY_COST_TABLES = {
  [CAT_VALLEY_ENHANCE_TYPE.OLD_ETERNAL]: [
    { maxLevel: 4, snow: 10, eternalpcs: 10, nekopow: 350 },
    { maxLevel: 9, snow: 15, eternalpcs: 15, nekopow: 500 },
    { maxLevel: 14, snow: 20, eternalpcs: 20, nekopow: 750 },
    { maxLevel: 19, snow: 25, eternalpcs: 25, nekopow: 1000 },
    { maxLevel: 20, snow: 30, eternalpcs: 30, nekopow: 1200 },
  ],
  [CAT_VALLEY_ENHANCE_TYPE.NEW_ETERNAL]: [
    { maxLevel: 4, snow: 15, eternalpcs: 15, nekopow: 525 },
    { maxLevel: 9, snow: 22, eternalpcs: 22, nekopow: 750 },
    { maxLevel: 14, snow: 30, eternalpcs: 30, nekopow: 1125 },
    { maxLevel: 19, snow: 37, eternalpcs: 37, nekopow: 1500 },
    { maxLevel: 20, snow: 45, eternalpcs: 45, nekopow: 1800 },
  ],
  [CAT_VALLEY_ENHANCE_TYPE.MITRA]: [
    { maxLevel: 5, sun: 5, darkpcs: 15, nekopow: 500 },
    { maxLevel: 10, sun: 7, darkpcs: 20, nekopow: 700 },
    { maxLevel: 15, sun: 10, darkpcs: 25, nekopow: 1000 },
  ],
  [CAT_VALLEY_ENHANCE_TYPE.OFFHAND]: [
    { maxLevel: 4, doom: 10, Nohimepcs: 25, nekopow: 500 },
    { maxLevel: 9, doom: 15, Nohimepcs: 35, nekopow: 700 },
    { maxLevel: 10, doom: 20, Nohimepcs: 45, nekopow: 1000 },
  ],
};

function getCatValleyEnhanceCostForLevel(type, targetLevel) {
  const table = CAT_VALLEY_COST_TABLES[type];
  if (!table?.length || !(targetLevel > 0)) return null;
  const tier = table.find((row) => targetLevel <= row.maxLevel) || table[table.length - 1];
  const cost = {};
  ['snow', 'taichu', 'nekopow', 'doom', 'sun', 'darkpcs', 'Nohimepcs', 'eternalpcs'].forEach((key) => {
    const val = Number(tier[key]) || 0;
    if (val > 0) cost[key] = val;
  });
  return cost;
}

function trackCatValleyEnhanceCost(type, targetLevel) {
  const cost = getCatValleyEnhanceCostForLevel(type, targetLevel);
  if (!cost || typeof trackCostUsage !== 'function') return cost;
  Object.entries(cost).forEach(([materialId, amount]) => {
    trackCostUsage(materialId, null, amount);
  });
  return cost;
}

function isCatValleyEternalItem(item) {
  return Boolean(item?.name && String(item.name).startsWith('永恆'));
}

function isCatValleyMitraItem(item) {
  if (!item) return false;
  if (typeof isEnergyBadgeItem === 'function' && isEnergyBadgeItem(item)) {
    return String(item.name || '').includes('米特拉');
  }
  return String(item.name || '').includes('米特拉的憤怒');
}

function isCatValleyOffhandItem(item) {
  if (!item) return false;
  if (item.mainType === EQUIP_TYPE.offHandWeapon) return true;
  if (item.islot === 'ohp' || item.subType === 'offHandWeapon') return true;
  if (typeof isAtlasOffHandWeapon === 'function' && isAtlasOffHandWeapon(item)) return true;
  return false;
}

function getCatValleyEnhanceType(item) {
  if (!item) return null;

  if (isCatValleyMitraItem(item)) return CAT_VALLEY_ENHANCE_TYPE.MITRA;
  if (isCatValleyOffhandItem(item)) return CAT_VALLEY_ENHANCE_TYPE.OFFHAND;

  if (isCatValleyEternalItem(item)) {
    const islot = item.islot || '';
    if (CAT_VALLEY_OLD_ETERNAL_SLOTS.has(islot)) return CAT_VALLEY_ENHANCE_TYPE.OLD_ETERNAL;
    if (CAT_VALLEY_NEW_ETERNAL_SLOTS.has(islot)) return CAT_VALLEY_ENHANCE_TYPE.NEW_ETERNAL;
  }

  return null;
}

function getCatValleyEnhanceMeta(item) {
  const type = getCatValleyEnhanceType(item);
  return type ? CAT_VALLEY_ENHANCE_META[type] : null;
}

function getCatValleyLevel(item) {
  return Math.max(0, Number(item?.catValleyLevel) || 0);
}

function getCatValleyRemainingUses(item) {
  const meta = getCatValleyEnhanceMeta(item);
  if (!meta) return 0;
  return Math.max(0, meta.maxLevel - getCatValleyLevel(item));
}

function canUseCatValleyEnhance(item) {
  if (isCatValleyPotentialItem(item)) return true;
  return getCatValleyRemainingUses(item) > 0;
}

const CAT_VALLEY_MEDAL_ENHANCE_MAX = 10;

/** 勳章強化（不朽的遺產／喵喵天使）：目標等級 → 額外數值；每次皆含 四屬+10、雙攻+10 */
const CAT_VALLEY_MEDAL_ENHANCE_TABLE = {
  1: { bdR: 5 },
  2: { bdR: 10 },
  3: { imdR: 5, damR: 5 },
  4: { bdR: 10 },
  5: { damR: 5, allStatR: 10 },
  6: { bdR: 10 },
  7: { imdR: 10, damR: 5 },
  8: { bdR: 10 },
  9: { imdR: 5, damR: 5, allStatR: 5 },
  10: { bdR: 10, damR: 10, allStatR: 10 },
};

function getCatValleyMedalEnhanceTaichuCost(targetLevel) {
  if (targetLevel >= 1 && targetLevel <= 3) return 100;
  if (targetLevel >= 4 && targetLevel <= 5) return 150;
  if (targetLevel >= 6 && targetLevel <= 7) return 200;
  if (targetLevel >= 8 && targetLevel <= 9) return 250;
  if (targetLevel === 10) return 400;
  return 0;
}

function getMedalEnhanceLevel(item) {
  return Math.max(0, Number(item?.medalEnhanceLevel) || 0);
}

function isCatValleyMedalEnhanceMaxed(item) {
  return getMedalEnhanceLevel(item) >= CAT_VALLEY_MEDAL_ENHANCE_MAX;
}

function canUseCatValleyMedalEnhance(item) {
  return isCatValleyPotentialItem(item) && !isCatValleyMedalEnhanceMaxed(item);
}

function canUseCatValleyPotentialMenu(item) {
  return isCatValleyPotentialItem(item) && isCatValleyMedalEnhanceMaxed(item);
}

/**
 * 套用一次勳章強化。
 * @returns {{ ok: boolean, level: number, changes: Array, taichuCost: number, message?: string }}
 */
function applyCatValleyMedalEnhanceOnce(item) {
  if (!isCatValleyPotentialItem(item)) {
    return { ok: false, level: 0, changes: [], taichuCost: 0, message: '此裝備無法使用勳章強化' };
  }
  const levelBefore = getMedalEnhanceLevel(item);
  if (levelBefore >= CAT_VALLEY_MEDAL_ENHANCE_MAX) {
    return { ok: false, level: levelBefore, changes: [], taichuCost: 0, message: '勳章強化已達上限' };
  }

  const nextLevel = levelBefore + 1;
  const bonus = CAT_VALLEY_MEDAL_ENHANCE_TABLE[nextLevel] || {};
  const changes = [];
  const add = (field, val, label) => {
    if (!val) return;
    item[field] = (item[field] || 0) + val;
    changes.push({ field, val, label });
  };

  add('scrollStat', 10, '四屬');
  add('scrollAtk', 10, '攻擊力');
  add('scrollMatk', 10, '魔法攻擊力');
  if (bonus.bdR) add('scrollBdR', bonus.bdR, 'BOSS怪物傷害');
  if (bonus.imdR) add('scrollImdR', bonus.imdR, '無視怪物防禦率');
  if (bonus.damR) add('scrollDamR', bonus.damR, '總傷害');
  if (bonus.allStatR) add('scrollAllStatR', bonus.allStatR, '全屬性');

  item.medalEnhanceLevel = nextLevel;
  const taichuCost = getCatValleyMedalEnhanceTaichuCost(nextLevel);
  if (taichuCost > 0) trackCatValleyTaichuCost(taichuCost);

  return {
    ok: true,
    level: nextLevel,
    changes,
    taichuCost,
    message: `勳章強化：Lv.${nextLevel}/${CAT_VALLEY_MEDAL_ENHANCE_MAX}`
      + (taichuCost ? `（消耗太初 ${taichuCost}）` : ''),
  };
}

/** 貓谷潛能專用裝備：不朽的遺產、喵喵天使 */
const CAT_VALLEY_POTENTIAL_ITEM_IDS = new Set(['01143471', '01143286']);
const CAT_VALLEY_POTENTIAL_ITEM_NAMES = new Set(['不朽的遺產', '喵喵天使']);

function isCatValleyPotentialItem(item) {
  if (!item) return false;
  const id = String(item.itemId || item.id || '');
  if (CAT_VALLEY_POTENTIAL_ITEM_IDS.has(id)) return true;
  return CAT_VALLEY_POTENTIAL_ITEM_NAMES.has(String(item.name || ''));
}

/** 物魔攻 8%，其餘 14%（合計 100%） */
const CAT_VALLEY_POTENTIAL_POOL = [
  { label: 'STR', value: '13%', weight: 14 },
  { label: 'DEX', value: '13%', weight: 14 },
  { label: 'INT', value: '13%', weight: 14 },
  { label: 'LUK', value: '13%', weight: 14 },
  { label: '全屬性', value: '10%', weight: 14 },
  { label: 'MaxHP', value: '13%', weight: 14 },
  { label: '物理攻擊力', value: '13%', weight: 8 },
  { label: '魔法攻擊力', value: '13%', weight: 8 },
];

const CAT_VALLEY_POTENTIAL_COST = {
  addMainTaichu: 100,
  addAddLine1Meso: 10000000000, // 100億
  addAddLine23Taichu: 150,
  rerollAdd1Meso: 4000000000, // 40億
};

function rollCatValleyPotentialLine(usedLabels = new Set()) {
  let pool = CAT_VALLEY_POTENTIAL_POOL;
  const filtered = pool.filter((entry) => !usedLabels.has(entry.label));
  if (filtered.length) pool = filtered;

  const total = pool.reduce((sum, entry) => sum + entry.weight, 0);
  let roll = Math.random() * total;
  for (const entry of pool) {
    roll -= entry.weight;
    if (roll <= 0) {
      return {
        rank: 'legendary',
        label: entry.label,
        value: entry.value,
        statRaw: `${entry.label}+${entry.value}`,
      };
    }
  }
  const fallback = pool[pool.length - 1];
  return {
    rank: 'legendary',
    label: fallback.label,
    value: fallback.value,
    statRaw: `${fallback.label}+${fallback.value}`,
  };
}

function ensureCatValleyPotentialState(item, which = 'main') {
  if (which === 'main') {
    if (!item.potential || typeof item.potential !== 'object') {
      item.potential = typeof getEmptyPotentialState === 'function'
        ? getEmptyPotentialState()
        : { rank: 'legendary', lines: [], atkPow: 0 };
    }
    if (!Array.isArray(item.potential.lines)) item.potential.lines = [];
    return item.potential;
  }
  if (!item.additionalPotential || typeof item.additionalPotential !== 'object') {
    item.additionalPotential = typeof getEmptyAddPotentialState === 'function'
      ? getEmptyAddPotentialState()
      : { rank: 'legendary', lines: [], atkPow: 0 };
  }
  if (!Array.isArray(item.additionalPotential.lines)) item.additionalPotential.lines = [];
  return item.additionalPotential;
}

function syncCatValleyPotentialRank(potState) {
  if (!potState) return;
  if (!potState.lines?.length) {
    potState.rank = 'legendary';
    return;
  }
  if (typeof rollPotentialRankFromLines === 'function') {
    potState.rank = rollPotentialRankFromLines(potState.lines);
  } else {
    potState.rank = 'legendary';
  }
}

function trackCatValleyMesoCost(amount) {
  const n = Number(amount) || 0;
  if (n <= 0 || typeof CostTrackerModule === 'undefined') return;
  if (!CostTrackerModule.starStats) {
    CostTrackerModule.starStats = CostTrackerModule.createEmptyStarStats?.() || { mesoSpent: 0 };
  }
  CostTrackerModule.starStats.mesoSpent = (CostTrackerModule.starStats.mesoSpent || 0) + n;
  CostTrackerModule.refreshCostDisplay?.();
  if (CostTrackerModule.isOpen) CostTrackerModule.render?.();
  if (typeof SessionPersistenceModule !== 'undefined') {
    SessionPersistenceModule.scheduleSave?.();
  }
}

function trackCatValleyTaichuCost(amount) {
  const n = Number(amount) || 0;
  if (n <= 0 || typeof trackCostUsage !== 'function') return;
  trackCostUsage('taichu', null, n);
}

/**
 * 貓谷潛能操作
 * @param {'addMain'|'clearMain'|'addAdd'|'clearAdd'|'rerollAdd1'} action
 */
function applyCatValleyPotentialAction(item, action) {
  if (!isCatValleyPotentialItem(item)) {
    return { ok: false, message: '此裝備無法使用貓谷潛能功能' };
  }

  if (action === 'addMain') {
    const pot = ensureCatValleyPotentialState(item, 'main');
    if (pot.lines.length >= 3) {
      return { ok: false, message: '主要潛能已滿三排' };
    }
    const used = new Set(pot.lines.map((line) => line.label));
    pot.lines.push(rollCatValleyPotentialLine(used));
    syncCatValleyPotentialRank(pot);
    trackCatValleyTaichuCost(CAT_VALLEY_POTENTIAL_COST.addMainTaichu);
    return {
      ok: true,
      message: `增加主要潛能第 ${pot.lines.length} 排（消耗太初 ${CAT_VALLEY_POTENTIAL_COST.addMainTaichu}）`,
    };
  }

  if (action === 'clearMain') {
    const pot = ensureCatValleyPotentialState(item, 'main');
    if (!pot.lines.length) {
      return { ok: false, message: '目前沒有主要潛能可清空' };
    }
    pot.lines = [];
    syncCatValleyPotentialRank(pot);
    return { ok: true, message: '已清空主要潛能' };
  }

  if (action === 'addAdd') {
    const pot = ensureCatValleyPotentialState(item, 'add');
    if (pot.lines.length >= 3) {
      return { ok: false, message: '附加潛能已滿三排' };
    }
    const nextIndex = pot.lines.length; // 0,1,2
    const used = new Set(pot.lines.map((line) => line.label));
    pot.lines.push(rollCatValleyPotentialLine(used));
    syncCatValleyPotentialRank(pot);
    if (nextIndex === 0) {
      trackCatValleyMesoCost(CAT_VALLEY_POTENTIAL_COST.addAddLine1Meso);
      return { ok: true, message: '增加附加潛能第 1 排（消耗 100億楓幣）' };
    }
    trackCatValleyTaichuCost(CAT_VALLEY_POTENTIAL_COST.addAddLine23Taichu);
    return {
      ok: true,
      message: `增加附加潛能第 ${pot.lines.length} 排（消耗太初 ${CAT_VALLEY_POTENTIAL_COST.addAddLine23Taichu}）`,
    };
  }

  if (action === 'clearAdd') {
    const pot = ensureCatValleyPotentialState(item, 'add');
    if (pot.lines.length <= 1) {
      return { ok: false, message: '沒有第二／第三排附加潛能可清空' };
    }
    pot.lines = pot.lines.slice(0, 1);
    syncCatValleyPotentialRank(pot);
    return { ok: true, message: '已清空附加潛能第 2、3 排' };
  }

  if (action === 'rerollAdd1') {
    const pot = ensureCatValleyPotentialState(item, 'add');
    if (!pot.lines.length) {
      return { ok: false, message: '尚無第一排附加潛能可重骰' };
    }
    const used = new Set(pot.lines.slice(1).map((line) => line.label));
    pot.lines[0] = rollCatValleyPotentialLine(used);
    syncCatValleyPotentialRank(pot);
    trackCatValleyMesoCost(CAT_VALLEY_POTENTIAL_COST.rerollAdd1Meso);
    return { ok: true, message: '已重骰附加潛能第 1 排（消耗 40億楓幣）' };
  }

  return { ok: false, message: '未知操作' };
}

function getCatValleyPotentialActionState(item) {
  const pot = item?.potential;
  const add = item?.additionalPotential;
  const mainCount = pot?.lines?.length || 0;
  const addCount = add?.lines?.length || 0;
  return {
    canAddMain: mainCount < 3,
    canClearMain: mainCount > 0,
    canAddAdd: addCount < 3,
    canClearAdd: addCount > 1,
    canRerollAdd1: addCount > 0,
    mainCount,
    addCount,
  };
}

/** 新永恆：基礎非 0 的主屬（最多取 2） */
function getCatValleyNewEternalPrimaryKeys(item) {
  const base = item?.baseStats || {};
  return CAT_VALLEY_PRIMARY_STAT_KEYS
    .filter((key) => (Number(base[key]) || 0) > 0)
    .slice(0, 2);
}

function ensureCatValleyScrollFields(item) {
  if (!item) return;
  if (item.scrollDamR == null) item.scrollDamR = 0;
  if (item.scrollBdR == null) item.scrollBdR = 0;
  if (item.scrollImdR == null) item.scrollImdR = 0;
  if (item.scrollAllStatR == null) item.scrollAllStatR = 0;
  if (item.catValleyLevel == null) item.catValleyLevel = 0;
  if (item.medalEnhanceLevel == null) item.medalEnhanceLevel = 0;
}

/**
 * 套用一次貓谷強化到卷軸紫字欄位。
 * @returns {{ ok: boolean, type: string|null, level: number, changes: Array<{label:string,val:number,field?:string}> }}
 */
function applyCatValleyEnhanceOnce(item) {
  ensureCatValleyScrollFields(item);
  const meta = getCatValleyEnhanceMeta(item);
  if (!meta) return { ok: false, type: null, level: getCatValleyLevel(item), changes: [] };

  const levelBefore = getCatValleyLevel(item);
  if (levelBefore >= meta.maxLevel) {
    return { ok: false, type: meta.id, level: levelBefore, changes: [] };
  }

  const nextLevel = levelBefore + 1;
  const isFinal = nextLevel >= meta.maxLevel;
  const changes = [];

  const add = (field, val, label) => {
    if (!val) return;
    item[field] = (item[field] || 0) + val;
    changes.push({ field, val, label });
  };

  if (meta.id === CAT_VALLEY_ENHANCE_TYPE.OLD_ETERNAL) {
    add('scrollStat', 12, '四屬');
    add('scrollHp', 210, '最大HP');
    if (isFinal) add('scrollDamR', 5, '總傷害');
  } else if (meta.id === CAT_VALLEY_ENHANCE_TYPE.NEW_ETERNAL) {
    getCatValleyNewEternalPrimaryKeys(item).forEach((key) => {
      const field = CAT_VALLEY_PRIMARY_SCROLL_FIELDS[key];
      add(field, 16, key.toUpperCase());
    });
    add('scrollHp', 210, '最大HP');
    if (isFinal) add('scrollDamR', 5, '總傷害');
  } else if (meta.id === CAT_VALLEY_ENHANCE_TYPE.MITRA) {
    add('scrollStat', 8, '四屬');
    add('scrollHp', 140, '最大HP');
    add('scrollAtk', 2, '攻擊力');
    add('scrollMatk', 2, '魔法攻擊力');
    if (isFinal) add('scrollDamR', 10, '總傷害');
  } else if (meta.id === CAT_VALLEY_ENHANCE_TYPE.OFFHAND) {
    add('scrollStat', 3, '四屬');
    add('scrollHp', 54, '最大HP');
    add('scrollAtk', 5, '攻擊力');
    add('scrollMatk', 5, '魔法攻擊力');
    if (isFinal) add('scrollBdR', 10, 'BOSS怪物傷害');
  }

  item.catValleyLevel = nextLevel;
  return { ok: true, type: meta.id, level: nextLevel, changes };
}

/** 一次點擊套用剩餘全部次數 */
function applyCatValleyEnhanceAll(item) {
  ensureCatValleyScrollFields(item);
  const meta = getCatValleyEnhanceMeta(item);
  if (!meta) return { ok: false, applied: 0, type: null, level: 0, changes: [] };

  let applied = 0;
  const allChanges = [];
  while (getCatValleyLevel(item) < meta.maxLevel) {
    const result = applyCatValleyEnhanceOnce(item);
    if (!result.ok) break;
    applied += 1;
    allChanges.push(...result.changes);
  }

  return {
    ok: applied > 0,
    applied,
    type: meta.id,
    label: meta.label,
    level: getCatValleyLevel(item),
    maxLevel: meta.maxLevel,
    changes: allChanges,
  };
}

function formatCatValleyChangeSummary(changes) {
  const merged = new Map();
  (changes || []).forEach((change) => {
    if (!change?.label || !change.val) return;
    merged.set(change.label, (merged.get(change.label) || 0) + change.val);
  });
  return [...merged.entries()]
    .map(([label, val]) => {
      const isPct = label.includes('傷害')
        || label === '總傷害'
        || label === '全屬性'
        || label.includes('無視');
      return `${label} +${val}${isPct ? '%' : ''}`;
    })
    .join('、');
}
