/**
 * 卓越強化：資格、材料、機率、楓幣與各部位加成
 * 加成數值獨立於基礎能力，顯示於卓越強化頁面（靈魂武器區塊風格）
 */
const EXCEPTIONAL_MAX_LEVEL = 3;

/** 漆黑 Boss 套裝（set 677）＋不朽的遺產 */
const EXCEPTIONAL_ELIGIBLE_ITEM_IDS = new Set([
  '01132308', // 夢幻的腰帶
  '01022278', // 附有魔力的眼罩
  '01012632', // 口紅控制器標誌
  '01032316', // 指揮官力量耳環
  '01143471', // 不朽的遺產
  '01012911', // 傲慢的原罪
  '01022913', // 飢渴的血色冤魂
]);

const EXCEPTIONAL_DARK_SET_SLOTS = new Set(['Be', 'Ay', 'Af', 'Ae']);

/** islot → 卓越鐵鎚 */
const EXCEPTIONAL_HAMMER_BY_SLOT = {
  Be: {
    id: '2644200',
    name: '卓越鐵鎚(腰帶)',
    icon: 'images/exceptional/02644200.info.iconRaw.png',
    hover: 'images/exceptional/2644200.png',
  },
  Af: {
    id: '2644201',
    name: '卓越鐵鎚(臉飾)',
    icon: 'images/exceptional/02644201.info.iconRaw.png',
    hover: 'images/exceptional/2644201.png',
  },
  Ay: {
    id: '2644202',
    name: '卓越鐵鎚(眼飾)',
    icon: 'images/exceptional/02644202.info.iconRaw.png',
    hover: 'images/exceptional/2644202.png',
  },
  Ae: {
    id: '2644203',
    name: '卓越鐵鎚(耳環)',
    icon: 'images/exceptional/02644203.info.iconRaw.png',
    hover: 'images/exceptional/2644203.png',
  },
  Md: {
    id: '2644208',
    name: '卓越鐵鎚(勳章)',
    icon: 'images/exceptional/02644208.info.iconRaw.png',
    hover: 'images/exceptional/2644208.png',
  },
};

/**
 * 每級追加能力（累加）；各部位不同
 */
const EXCEPTIONAL_LEVEL_BONUS_BY_SLOT = {
  // 腰帶 / 耳環 / 勳章
  Be: [
    { str: 20, dex: 20, int: 20, luk: 20, pad: 15, mad: 15, mhp: 1000, mmp: 1000 },
    { str: 20, dex: 20, int: 20, luk: 20, pad: 15, mad: 15, mhp: 1000, mmp: 1000 },
    { str: 20, dex: 20, int: 20, luk: 20, pad: 15, mad: 15, mhp: 1000, mmp: 1000 },
  ],
  Ae: [
    { str: 20, dex: 20, int: 20, luk: 20, pad: 15, mad: 15, mhp: 1000, mmp: 1000 },
    { str: 20, dex: 20, int: 20, luk: 20, pad: 15, mad: 15, mhp: 1000, mmp: 1000 },
    { str: 20, dex: 20, int: 20, luk: 20, pad: 15, mad: 15, mhp: 1000, mmp: 1000 },
  ],
  Md: [
    { str: 20, dex: 20, int: 20, luk: 20, pad: 15, mad: 15, mhp: 1000, mmp: 1000 },
    { str: 20, dex: 20, int: 20, luk: 20, pad: 15, mad: 15, mhp: 1000, mmp: 1000 },
    { str: 20, dex: 20, int: 20, luk: 20, pad: 15, mad: 15, mhp: 1000, mmp: 1000 },
  ],
  // 臉飾 / 眼飾
  Af: [
    { str: 15, dex: 15, int: 15, luk: 15, pad: 10, mad: 10, mhp: 750, mmp: 750 },
    { str: 15, dex: 15, int: 15, luk: 15, pad: 10, mad: 10, mhp: 750, mmp: 750 },
    { str: 15, dex: 15, int: 15, luk: 15, pad: 10, mad: 10, mhp: 750, mmp: 750 },
  ],
  Ay: [
    { str: 15, dex: 15, int: 15, luk: 15, pad: 10, mad: 10, mhp: 750, mmp: 750 },
    { str: 15, dex: 15, int: 15, luk: 15, pad: 10, mad: 10, mhp: 750, mmp: 750 },
    { str: 15, dex: 15, int: 15, luk: 15, pad: 10, mad: 10, mhp: 750, mmp: 750 },
  ],
};

/** 成功機率（依目前等級 0→1, 1→2, 2→3） */
const EXCEPTIONAL_SUCCESS_RATES = [70, 50, 30];

const EXCEPTIONAL_STAT_LABELS = {
  str: 'STR',
  dex: 'DEX',
  int: 'INT',
  luk: 'LUK',
  pad: '攻擊力',
  mad: '魔力',
  mhp: '最大HP',
  mmp: '最大MP',
  bdR: '攻擊Boss怪物時傷害',
};

function canUseExceptional(item) {
  if (!item) return false;
  if (typeof isEnhancementLockedItem === 'function' && isEnhancementLockedItem(item)) {
    return false;
  }
  const id = String(item.itemId || item.id || '');
  if (EXCEPTIONAL_ELIGIBLE_ITEM_IDS.has(id)) {
    if (id === '01143471') return item.islot === 'Me' || item.islot === 'Md';
    return EXCEPTIONAL_DARK_SET_SLOTS.has(item.islot);
  }
  return false;
}

function getExceptionalSlotKey(item) {
  if (!item) return null;
  if (item.islot === 'Me' || item.islot === 'Md') return 'Md';
  return EXCEPTIONAL_DARK_SET_SLOTS.has(item.islot) ? item.islot : null;
}

function getExceptionalHammer(item) {
  const slot = getExceptionalSlotKey(item);
  return slot ? EXCEPTIONAL_HAMMER_BY_SLOT[slot] : null;
}

function ensureExceptionalState(item) {
  if (!item) return null;
  if (!item.exceptional || typeof item.exceptional !== 'object') {
    item.exceptional = { level: 0 };
  }
  if (typeof item.exceptional.level !== 'number') {
    item.exceptional.level = 0;
  }
  item.exceptional.level = Math.max(0, Math.min(EXCEPTIONAL_MAX_LEVEL, item.exceptional.level));
  return item.exceptional;
}

function getExceptionalLevel(item) {
  return ensureExceptionalState(item)?.level ?? 0;
}

function sumExceptionalBonuses(slotKey, upToLevel) {
  const table = EXCEPTIONAL_LEVEL_BONUS_BY_SLOT[slotKey] || [];
  const total = {};
  for (let i = 0; i < upToLevel && i < table.length; i += 1) {
    Object.entries(table[i]).forEach(([key, val]) => {
      total[key] = (total[key] || 0) + val;
    });
  }
  return total;
}

function getExceptionalTotalStats(item) {
  const slot = getExceptionalSlotKey(item);
  if (!slot) return {};
  return sumExceptionalBonuses(slot, getExceptionalLevel(item));
}

function getExceptionalNextLevelBonus(item) {
  const slot = getExceptionalSlotKey(item);
  const level = getExceptionalLevel(item);
  if (!slot || level >= EXCEPTIONAL_MAX_LEVEL) return {};
  return { ...(EXCEPTIONAL_LEVEL_BONUS_BY_SLOT[slot]?.[level] || {}) };
}

function formatExceptionalStatLine(key, value, negate = false) {
  const sign = negate ? '-' : '+';
  const abs = Math.abs(value);
  if (key === 'allStat') return `全屬性 ${sign}${abs}`;
  if (key === 'atkPair') return `攻擊力、魔力 ${sign}${abs}`;
  if (key === 'mhp') return `MHP ${sign} ${abs}`;
  if (key === 'mmp') return `MMP ${sign} ${abs}`;
  const label = EXCEPTIONAL_STAT_LABELS[key] || key;
  if (key === 'bdR') return `${label} : ${sign}${abs}%`;
  return `${label} : ${sign}${abs}`;
}

function formatExceptionalStatBlock(stats, { negate = false } = {}) {
  if (!stats) return '無';
  const merged = { ...stats };

  const four = ['str', 'dex', 'int', 'luk'];
  const present = four.filter((k) => merged[k]);
  if (present.length === 4) {
    const vals = present.map((k) => merged[k]);
    if (vals.every((v) => v === vals[0])) {
      present.forEach((k) => { delete merged[k]; });
      merged.allStat = vals[0];
    }
  }

  if (merged.pad && merged.mad && merged.pad === merged.mad) {
    merged.atkPair = merged.pad;
    delete merged.pad;
    delete merged.mad;
  }

  const keys = Object.keys(merged).filter((k) => merged[k]);
  if (!keys.length) return '無';
  const order = ['allStat', 'atkPair', 'pad', 'mad', 'mhp', 'mmp', 'str', 'dex', 'int', 'luk', 'bdR'];
  keys.sort((a, b) => {
    const ia = order.indexOf(a);
    const ib = order.indexOf(b);
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
  });
  return keys.map((k) => formatExceptionalStatLine(k, merged[k], negate)).join('\n');
}

/** UITooltip：全屬性 / 最大 HP·MP / 攻擊力·魔力 */
function formatExceptionalTooltipLines(stats) {
  if (!stats) return [];
  const lines = [];
  const four = ['str', 'dex', 'int', 'luk'];
  const fourVals = four.map((k) => stats[k] || 0);
  if (fourVals.every((v) => v > 0) && fourVals.every((v) => v === fourVals[0])) {
    lines.push(`全屬性 +${fourVals[0]}`);
  } else {
    four.forEach((k) => {
      if (stats[k]) lines.push(`${EXCEPTIONAL_STAT_LABELS[k] || k} +${stats[k]}`);
    });
  }

  const mhp = stats.mhp || 0;
  const mmp = stats.mmp || 0;
  if (mhp > 0 && mmp > 0 && mhp === mmp) {
    lines.push(`最大 HP/最大 MP +${mhp}`);
  } else {
    if (mhp > 0) lines.push(`最大 HP +${mhp}`);
    if (mmp > 0) lines.push(`最大 MP +${mmp}`);
  }

  const pad = stats.pad || 0;
  const mad = stats.mad || 0;
  if (pad > 0 && mad > 0 && pad === mad) {
    lines.push(`攻擊力/魔力 +${pad}`);
  } else {
    if (pad > 0) lines.push(`攻擊力 +${pad}`);
    if (mad > 0) lines.push(`魔力 +${mad}`);
  }

  return lines;
}

function getExceptionalSuccessRate(item) {
  const level = getExceptionalLevel(item);
  if (level >= EXCEPTIONAL_MAX_LEVEL) return null;
  return EXCEPTIONAL_SUCCESS_RATES[level] ?? null;
}

function rollExceptionalEnchant(item) {
  const rate = getExceptionalSuccessRate(item);
  if (rate == null) return false;
  return Math.random() * 100 < rate;
}

function applyExceptionalLevelUp(item) {
  const state = ensureExceptionalState(item);
  if (state.level < EXCEPTIONAL_MAX_LEVEL) {
    state.level += 1;
  }
  return state.level;
}

function applyExceptionalExtract(item) {
  const state = ensureExceptionalState(item);
  const prev = state.level;
  state.level = 0;
  return prev;
}
