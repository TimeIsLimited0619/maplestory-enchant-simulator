/**
 * 貓谷特殊強化 — 類型判定與數值表
 * 數值併入卷軸紫字（scroll* / scrollDamR / scrollBdR）
 */

const CAT_VALLEY_ENHANCE_TYPE = {
  OLD_ETERNAL: 'oldEternal',
  NEW_ETERNAL: 'newEternal',
  MITRA: 'mitra',
  OFFHAND: 'offhand',
  TOTEM: 'totem',
  ARCANE: 'arcane',
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
  /** 首次開啟為 Lv.0，後續 +1～+25，共 26 次 */
  [CAT_VALLEY_ENHANCE_TYPE.TOTEM]: {
    id: CAT_VALLEY_ENHANCE_TYPE.TOTEM,
    label: '圖騰強化',
    maxLevel: 25,
    totalUses: 26,
  },
  [CAT_VALLEY_ENHANCE_TYPE.ARCANE]: {
    id: CAT_VALLEY_ENHANCE_TYPE.ARCANE,
    label: '神祕強化',
    maxLevel: 30,
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
  [CAT_VALLEY_ENHANCE_TYPE.ARCANE]: [
    { maxLevel: 30, arcanepcs: 15, nekopow: 15 },
  ],
};

function getCatValleyEnhanceCostForLevel(type, targetLevel) {
  const table = CAT_VALLEY_COST_TABLES[type];
  if (!table?.length || !(targetLevel > 0)) return null;
  const tier = table.find((row) => targetLevel <= row.maxLevel) || table[table.length - 1];
  const cost = {};
  ['snow', 'taichu', 'nekopow', 'doom', 'sun', 'darkpcs', 'Nohimepcs', 'eternalpcs', 'arcanepcs'].forEach((key) => {
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

/** 神祕冥界防具／飾品（不含武器） */
function isCatValleyArcaneItem(item) {
  const name = String(item?.name || '');
  if (!name.startsWith('神祕冥界') && !name.startsWith('神秘冥界')) return false;
  if (typeof EQUIP_TYPE !== 'undefined' && item.mainType === EQUIP_TYPE.WEAPON) return false;
  const islot = item.islot || '';
  if (islot === 'Wp' || islot === 'Wpsi' || islot === 'Gw' || islot === 'Op') return false;
  return true;
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

/** 超越的圖騰（貓谷圖騰特殊強化） */
const CAT_VALLEY_TOTEM_ITEM_IDS = new Set(['01202253']);
const CAT_VALLEY_TOTEM_ITEM_NAMES = new Set(['超越的圖騰']);

function isCatValleyTotemItem(item) {
  if (!item) return false;
  const id = String(item.itemId || item.id || '');
  if (CAT_VALLEY_TOTEM_ITEM_IDS.has(id)) return true;
  if (CAT_VALLEY_TOTEM_ITEM_NAMES.has(String(item.name || ''))) return true;
  return false;
}

function isCatValleyTotemStarted(item) {
  return Boolean(item?.catValleyTotemStarted);
}

/**
 * 超越的圖騰：每次強化追加數值（非累積表；依目標等級套用該列）
 * imdR=無視防禦% bdR=BOSS傷害% damR=傷害% allStatR=全屬性%
 */
const CAT_VALLEY_TOTEM_ENHANCE_TABLE = {
  0: { imdR: 30, bdR: 30, damR: 10, allStatR: 0 },
  1: { imdR: 0, bdR: 10, damR: 10, allStatR: 20 },
  2: { imdR: 10, bdR: 10, damR: 10, allStatR: 10 },
  3: { imdR: 10, bdR: 10, damR: 10, allStatR: 10 },
  4: { imdR: 5, bdR: 10, damR: 10, allStatR: 10 },
  5: { imdR: 5, bdR: 10, damR: 10, allStatR: 10 },
  6: { imdR: 5, bdR: 10, damR: 10, allStatR: 10 },
  7: { imdR: 5, bdR: 10, damR: 10, allStatR: 10 },
  8: { imdR: 5, bdR: 10, damR: 10, allStatR: 10 },
  9: { imdR: 5, bdR: 10, damR: 10, allStatR: 10 },
  10: { imdR: 5, bdR: 10, damR: 10, allStatR: 10 },
  11: { imdR: 5, bdR: 10, damR: 10, allStatR: 10 },
  12: { imdR: 5, bdR: 10, damR: 10, allStatR: 10 },
  13: { imdR: 5, bdR: 10, damR: 10, allStatR: 10 },
  14: { imdR: 5, bdR: 10, damR: 10, allStatR: 10 },
  15: { imdR: 5, bdR: 10, damR: 10, allStatR: 10 },
  16: { imdR: 5, bdR: 10, damR: 10, allStatR: 10 },
  17: { imdR: 5, bdR: 10, damR: 10, allStatR: 10 },
  18: { imdR: 5, bdR: 10, damR: 10, allStatR: 10 },
  19: { imdR: 5, bdR: 10, damR: 10, allStatR: 10 },
  20: { imdR: 5, bdR: 6, damR: 8, allStatR: 8 },
  21: { imdR: 5, bdR: 6, damR: 8, allStatR: 8 },
  22: { imdR: 5, bdR: 6, damR: 8, allStatR: 8 },
  23: { imdR: 5, bdR: 6, damR: 8, allStatR: 8 },
  24: { imdR: 5, bdR: 6, damR: 8, allStatR: 8 },
  25: { imdR: 5, bdR: 5, damR: 15, allStatR: 15 },
};

function getCatValleyEnhanceType(item) {
  if (!item) return null;

  if (isCatValleyTotemItem(item)) return CAT_VALLEY_ENHANCE_TYPE.TOTEM;
  if (isCatValleyMitraItem(item)) return CAT_VALLEY_ENHANCE_TYPE.MITRA;
  if (isCatValleyOffhandItem(item)) return CAT_VALLEY_ENHANCE_TYPE.OFFHAND;
  if (isCatValleyArcaneItem(item)) return CAT_VALLEY_ENHANCE_TYPE.ARCANE;

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
  // 圖騰：未開啟時仍可強化（首次＝Lv.0），共 totalUses 次
  if (meta.id === CAT_VALLEY_ENHANCE_TYPE.TOTEM) {
    if (!isCatValleyTotemStarted(item)) return meta.totalUses || (meta.maxLevel + 1);
    return Math.max(0, meta.maxLevel - getCatValleyLevel(item));
  }
  return Math.max(0, meta.maxLevel - getCatValleyLevel(item));
}

function canUseCatValleyEnhance(item) {
  if (typeof isCatValleyContentUnlocked !== 'function' || !isCatValleyContentUnlocked()) return false;
  if (isCatValleyPotentialItem(item)) return true;
  return getCatValleyRemainingUses(item) > 0;
}

const CAT_VALLEY_MEDAL_ENHANCE_MAX = 10;

/**
 * 勳章強化（不朽的遺產／喵喵天使）
 * - 首次強化＝Lv.0（像超越圖騰）：10% BOSS傷、10% 傷害、15% 無視
 * - Lv.1～10：額外數值表；每次皆含 四屬+10、雙攻+10、HP/MP+1000
 */
const CAT_VALLEY_MEDAL_ENHANCE_TABLE = {
  0: { bdR: 10, damR: 10, imdR: 15 },
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
  if (targetLevel === 0) return 0;
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

/** 已做過首次（+0）之後視為已開啟；舊存檔 level>0 亦視為已開啟 */
function isCatValleyMedalEnhanceStarted(item) {
  if (!item) return false;
  if (item.medalEnhanceStarted) return true;
  return getMedalEnhanceLevel(item) > 0;
}

function isCatValleyMedalEnhanceMaxed(item) {
  return isCatValleyMedalEnhanceStarted(item)
    && getMedalEnhanceLevel(item) >= CAT_VALLEY_MEDAL_ENHANCE_MAX;
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
  if (typeof isCatValleyContentUnlocked !== 'function' || !isCatValleyContentUnlocked()) {
    return { ok: false, level: 0, changes: [], taichuCost: 0, message: '未解鎖' };
  }
  if (!isCatValleyPotentialItem(item)) {
    return { ok: false, level: 0, changes: [], taichuCost: 0, message: '此裝備無法使用勳章強化' };
  }
  if (isCatValleyMedalEnhanceMaxed(item)) {
    return {
      ok: false,
      level: getMedalEnhanceLevel(item),
      changes: [],
      taichuCost: 0,
      message: '勳章強化已達上限',
    };
  }

  const started = isCatValleyMedalEnhanceStarted(item);
  const levelBefore = started ? getMedalEnhanceLevel(item) : -1;
  const nextLevel = levelBefore + 1;
  const bonus = CAT_VALLEY_MEDAL_ENHANCE_TABLE[nextLevel] || {};
  const changes = [];
  const add = (field, val, label) => {
    if (!val) return;
    item[field] = (item[field] || 0) + val;
    changes.push({ field, val, label });
  };

  if (nextLevel === 0) {
    // 首次開啟（+0）：僅套用表上百分比
    if (bonus.bdR) add('scrollBdR', bonus.bdR, 'BOSS怪物傷害');
    if (bonus.damR) add('scrollDamR', bonus.damR, '傷害');
    if (bonus.imdR) add('scrollImdR', bonus.imdR, '無視怪物防禦率');
  } else {
    add('scrollStat', 10, '四屬');
    add('scrollAtk', 10, '攻擊力');
    add('scrollMatk', 10, '魔法攻擊力');
    add('scrollHp', 1000, '最大HP');
    add('scrollMp', 1000, '最大MP');
    if (bonus.bdR) add('scrollBdR', bonus.bdR, 'BOSS怪物傷害');
    if (bonus.imdR) add('scrollImdR', bonus.imdR, '無視怪物防禦率');
    if (bonus.damR) add('scrollDamR', bonus.damR, '傷害');
    if (bonus.allStatR) add('scrollAllStatR', bonus.allStatR, '全屬性');
  }

  item.medalEnhanceLevel = nextLevel;
  item.medalEnhanceStarted = true;
  const taichuCost = getCatValleyMedalEnhanceTaichuCost(nextLevel);
  if (taichuCost > 0) trackCatValleyTaichuCost(taichuCost);

  const levelText = nextLevel === 0
    ? '首次開啟（+0）'
    : `Lv.${nextLevel}/${CAT_VALLEY_MEDAL_ENHANCE_MAX}`;

  return {
    ok: true,
    level: nextLevel,
    changes,
    taichuCost,
    message: `勳章強化：${levelText}`
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

const CAT_VALLEY_POTENTIAL_POOL = [
  { label: 'STR', value: '13%', weight: 12.5 },
  { label: 'DEX', value: '13%', weight: 12.5 },
  { label: 'INT', value: '13%', weight: 12.5 },
  { label: 'LUK', value: '13%', weight: 12.5 },
  { label: '全屬性', value: '10%', weight: 12.5 },
  { label: 'MaxHP', value: '13%', weight: 12.5 },
  { label: '物理攻擊力', value: '13%', weight: 12.5 },
  { label: '魔法攻擊力', value: '13%', weight: 12.5 },
];

const CAT_VALLEY_POTENTIAL_ATK_LABELS = new Set(['物理攻擊力', '魔法攻擊力']);
const CAT_VALLEY_POTENTIAL_ATK_LABEL_LIST = ['物理攻擊力', '魔法攻擊力'];
/** 清空潛能時觸發大獎機率（0.01%）；觸發後後續「增加」鎖定物攻或魔攻 */
const CAT_VALLEY_POTENTIAL_JACKPOT_RATE = 0.001;

const CAT_VALLEY_POTENTIAL_COST = {
  addMainTaichu: 100,
  addAddLine1Meso: 10000000000, // 100億
  addAddLine23Taichu: 150,
  rerollAdd1Meso: 4000000000, // 40億
};

function makeCatValleyPotentialLine(label) {
  const entry = CAT_VALLEY_POTENTIAL_POOL.find((row) => row.label === label)
    || CAT_VALLEY_POTENTIAL_POOL[CAT_VALLEY_POTENTIAL_POOL.length - 1];
  return {
    rank: 'legendary',
    label: entry.label,
    value: entry.value,
    statRaw: `${entry.label}+${entry.value}`,
  };
}

function getCatValleyPotentialJackpot(item, which = 'main') {
  if (!item) return null;
  const key = which === 'add' ? 'catValleyJackpotAdd' : 'catValleyJackpotMain';
  const label = item[key];
  return CAT_VALLEY_POTENTIAL_ATK_LABELS.has(label) ? label : null;
}

function setCatValleyPotentialJackpot(item, which, label) {
  if (!item) return;
  const key = which === 'add' ? 'catValleyJackpotAdd' : 'catValleyJackpotMain';
  item[key] = CAT_VALLEY_POTENTIAL_ATK_LABELS.has(label) ? label : null;
}

function clearCatValleyPotentialJackpot(item, which) {
  if (!item) return;
  if (which === 'add' || which === 'all') item.catValleyJackpotAdd = null;
  if (which === 'main' || which === 'all') item.catValleyJackpotMain = null;
}

function pickCatValleyJackpotAtkLabel() {
  const idx = Math.random() < 0.5 ? 0 : 1;
  return CAT_VALLEY_POTENTIAL_ATK_LABEL_LIST[idx];
}

/**
 * 清空潛能時判定大獎；觸發則隨機鎖定物攻或魔攻。
 * @returns {{ jackpotTriggered: boolean, jackpotLabel: string|null }}
 */
function rollCatValleyPotentialJackpotOnClear(item, which) {
  clearCatValleyPotentialJackpot(item, which);
  if (Math.random() >= CAT_VALLEY_POTENTIAL_JACKPOT_RATE) {
    return { jackpotTriggered: false, jackpotLabel: null };
  }
  const label = pickCatValleyJackpotAtkLabel();
  setCatValleyPotentialJackpot(item, which, label);
  return { jackpotTriggered: true, jackpotLabel: label };
}

/**
 * @param {Set<string>} usedLabels
 * @param {{ forcedLabel?: string|null }} [options]
 */
function rollCatValleyPotentialLine(usedLabels = new Set(), options = {}) {
  const forcedLabel = options.forcedLabel;
  if (forcedLabel && CAT_VALLEY_POTENTIAL_ATK_LABELS.has(forcedLabel)) {
    // 大獎鎖定：允許同屬性重複（例如三物攻）
    return makeCatValleyPotentialLine(forcedLabel);
  }

  const pool = CAT_VALLEY_POTENTIAL_POOL;
  const total = pool.reduce((sum, entry) => sum + entry.weight, 0);
  let roll = Math.random() * total;
  for (const entry of pool) {
    roll -= entry.weight;
    if (roll <= 0) return makeCatValleyPotentialLine(entry.label);
  }
  return makeCatValleyPotentialLine(pool[pool.length - 1].label);
}

/** 增加一排潛能（若已有大獎鎖定則強制該攻） */
function rollCatValleyPotentialAddLine(item, which, usedLabels) {
  const locked = getCatValleyPotentialJackpot(item, which);
  return rollCatValleyPotentialLine(usedLabels, { forcedLabel: locked });
}

/** 主＋副共六排是否皆為指定物／魔攻 */
function isCatValleySixAtkComplete(item, atkLabel) {
  if (!item || !CAT_VALLEY_POTENTIAL_ATK_LABELS.has(atkLabel)) return false;
  const main = item.potential?.lines;
  const add = item.additionalPotential?.lines;
  if (!Array.isArray(main) || main.length !== 3) return false;
  if (!Array.isArray(add) || add.length !== 3) return false;
  return [...main, ...add].every((line) => line?.label === atkLabel);
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
  if (typeof CatValleyEnhanceModule !== 'undefined' && CatValleyEnhanceModule.autoRunning) return;
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
  if (typeof isCatValleyContentUnlocked !== 'function' || !isCatValleyContentUnlocked()) {
    return { ok: false, message: '未解鎖' };
  }
  if (!isCatValleyPotentialItem(item)) {
    return { ok: false, message: '此裝備無法使用貓谷潛能功能' };
  }

  if (action === 'addMain') {
    const pot = ensureCatValleyPotentialState(item, 'main');
    if (pot.lines.length >= 3) {
      return { ok: false, message: '主要潛能已滿三排' };
    }
    const used = new Set(pot.lines.map((line) => line.label));
    const line = rollCatValleyPotentialAddLine(item, 'main', used);
    pot.lines.push(line);
    syncCatValleyPotentialRank(pot);
    if (pot.lines.length >= 3) clearCatValleyPotentialJackpot(item, 'main');
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
    rollCatValleyPotentialJackpotOnClear(item, 'main');
    return { ok: true, message: '已清空主要潛能' };
  }

  if (action === 'addAdd') {
    const pot = ensureCatValleyPotentialState(item, 'add');
    if (pot.lines.length >= 3) {
      return { ok: false, message: '附加潛能已滿三排' };
    }
    const nextIndex = pot.lines.length; // 0,1,2
    const used = new Set(pot.lines.map((line) => line.label));
    const line = rollCatValleyPotentialAddLine(item, 'add', used);
    pot.lines.push(line);
    syncCatValleyPotentialRank(pot);
    if (pot.lines.length >= 3) clearCatValleyPotentialJackpot(item, 'add');

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
    rollCatValleyPotentialJackpotOnClear(item, 'add');
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
  if (item.medalEnhanceStarted == null) {
    item.medalEnhanceStarted = getMedalEnhanceLevel(item) > 0;
  }
  if (item.catValleyTotemStarted == null) item.catValleyTotemStarted = false;
}

/**
 * 套用一次貓谷強化到卷軸紫字欄位。
 * @returns {{ ok: boolean, type: string|null, level: number, changes: Array<{label:string,val:number,field?:string}> }}
 */
function applyCatValleyEnhanceOnce(item) {
  if (typeof isCatValleyContentUnlocked !== 'function' || !isCatValleyContentUnlocked()) {
    return { ok: false, type: null, level: 0, changes: [] };
  }
  ensureCatValleyScrollFields(item);
  const meta = getCatValleyEnhanceMeta(item);
  if (!meta) return { ok: false, type: null, level: getCatValleyLevel(item), changes: [] };

  const isTotem = meta.id === CAT_VALLEY_ENHANCE_TYPE.TOTEM;
  const levelBefore = isTotem && !isCatValleyTotemStarted(item)
    ? -1
    : getCatValleyLevel(item);
  if (levelBefore >= meta.maxLevel) {
    return { ok: false, type: meta.id, level: Math.max(0, levelBefore), changes: [] };
  }

  const nextLevel = levelBefore + 1;
  const isFinal = nextLevel >= meta.maxLevel;
  const changes = [];

  const add = (field, val, label) => {
    if (!val) return;
    item[field] = (item[field] || 0) + val;
    changes.push({ field, val, label });
  };

  if (isTotem) {
    const bonus = CAT_VALLEY_TOTEM_ENHANCE_TABLE[nextLevel] || {};
    if (bonus.imdR) add('scrollImdR', bonus.imdR, '無視怪物防禦率');
    if (bonus.bdR) add('scrollBdR', bonus.bdR, 'BOSS怪物傷害');
    if (bonus.damR) add('scrollDamR', bonus.damR, '傷害');
    if (bonus.allStatR) add('scrollAllStatR', bonus.allStatR, '全屬性');
    item.catValleyTotemStarted = true;
  } else if (meta.id === CAT_VALLEY_ENHANCE_TYPE.OLD_ETERNAL) {
    add('scrollStat', 12, '四屬');
    add('scrollHp', 210, '最大HP');
    if (nextLevel === 5 || nextLevel === 15) add('scrollImdR', 5, '無視怪物防禦率');
    if (nextLevel === 10) add('scrollAllStatR', 5, '全屬性');
    if (isFinal) add('scrollDamR', 5, '傷害');
  } else if (meta.id === CAT_VALLEY_ENHANCE_TYPE.NEW_ETERNAL) {
    getCatValleyNewEternalPrimaryKeys(item).forEach((key) => {
      const field = CAT_VALLEY_PRIMARY_SCROLL_FIELDS[key];
      add(field, 16, key.toUpperCase());
    });
    add('scrollHp', 210, '最大HP');
    if (nextLevel === 5 || nextLevel === 15) add('scrollImdR', 5, '無視怪物防禦率');
    if (nextLevel === 10) add('scrollAllStatR', 5, '全屬性');
    if (isFinal) add('scrollDamR', 5, '傷害');
  } else if (meta.id === CAT_VALLEY_ENHANCE_TYPE.MITRA) {
    add('scrollStat', 8, '四屬');
    add('scrollHp', 140, '最大HP');
    add('scrollAtk', 2, '攻擊力');
    add('scrollMatk', 2, '魔法攻擊力');
    if (nextLevel === 10) add('scrollBdR', 10, 'BOSS怪物傷害');
    if (isFinal) add('scrollDamR', 10, '傷害');
  } else if (meta.id === CAT_VALLEY_ENHANCE_TYPE.OFFHAND) {
    add('scrollStat', 3, '四屬');
    add('scrollHp', 54, '最大HP');
    add('scrollAtk', 5, '攻擊力');
    add('scrollMatk', 5, '魔法攻擊力');
    if (nextLevel === 5) add('scrollImdR', 5, '無視怪物防禦率');
    if (isFinal) add('scrollBdR', 10, 'BOSS怪物傷害');
  } else if (meta.id === CAT_VALLEY_ENHANCE_TYPE.ARCANE) {
    add('scrollStat', 8, '四屬');
    add('scrollHp', 140, '最大HP');
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
  while (getCatValleyRemainingUses(item) > 0) {
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
        || label === '傷害'
        || label === '全屬性'
        || label.includes('無視');
      return `${label} +${val}${isPct ? '%' : ''}`;
    })
    .join('、');
}
