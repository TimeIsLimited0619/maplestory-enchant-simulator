/**
 * 低等級裝備（1~150 級）潛能數值區間
 * 機率沿用 event8421 / event8422（與裝備等級無關）
 * 數值來源：官方 V255 調整公告（91~150 附加）、社群方塊潛能整理表（1~150 主潛能%）
 */

const LOW_LEVEL_POTENTIAL_MAX = 150;

function isLowLevelPotentialItem(item) {
  if (!item) return false;
  const level = Number(item.reqLevel) || 0;
  return level >= 1 && level <= LOW_LEVEL_POTENTIAL_MAX;
}

/** 主潛能／附加潛能 % 用區間（1-30 / 31-70 / 71-150） */
function getLowLevelPercentBand(reqLevel) {
  const level = Math.max(1, Math.min(LOW_LEVEL_POTENTIAL_MAX, Number(reqLevel) || 100));
  if (level <= 30) return '1_30';
  if (level <= 70) return '31_70';
  return '71_150';
}

/** 固定值用區間（1-30 / 31-70 / 71-120 / 121-150） */
function getLowLevelFlatBand(reqLevel) {
  const level = Math.max(1, Math.min(LOW_LEVEL_POTENTIAL_MAX, Number(reqLevel) || 100));
  if (level <= 30) return '1_30';
  if (level <= 70) return '31_70';
  if (level <= 120) return '71_120';
  return '121_150';
}

function pickLowLevelRankRow(table, band, internalRank) {
  const row = table[band] || table['71_150'];
  return row?.[internalRank] ?? row?.rare ?? null;
}

/** 主潛能：STR/DEX/INT/LUK%、防禦%、HP/MP% */
const LOW_MAIN_STAT_PERCENT = {
  '1_30': { rare: '1%', epic: '2%', unique: '3%', legendary: '4%' },
  '31_70': { rare: '2%', epic: '4%', unique: '6%', legendary: '8%' },
  '71_150': { rare: '3%', epic: '6%', unique: '9%', legendary: '12%' }
};

/** 主潛能：全屬性%（稀有以上） */
const LOW_MAIN_ALLSTAT_PERCENT = {
  '1_30': { epic: '1%', unique: '2%', legendary: '3%' },
  '31_70': { epic: '2%', unique: '4%', legendary: '6%' },
  '71_150': { epic: '3%', unique: '6%', legendary: '9%' }
};

/** 武器主潛能：物攻%/魔攻% */
const LOW_WEAPON_ATK_PERCENT = LOW_MAIN_STAT_PERCENT;

/** 武器主潛能：總傷害% */
const LOW_WEAPON_TOTAL_DAMAGE_PERCENT = {
  '1_30': { rare: '1%', epic: '2%', unique: '3%', legendary: '4%' },
  '31_70': { rare: '2%', epic: '4%', unique: '6%', legendary: '7%' },
  '71_150': { rare: '3%', epic: '6%', unique: '9%', legendary: '10%' }
};

/** 武器主潛能：爆擊機率% */
const LOW_WEAPON_CRIT_RATE_PERCENT = {
  '1_30': { rare: '4%', epic: '4%', unique: '6%', legendary: '8%' },
  '31_70': { rare: '4%', epic: '8%', unique: '6%', legendary: '9%' },
  '71_150': { rare: '4%', epic: '8%', unique: '9%', legendary: '12%' }
};

/** 主潛能：特殊階固定值（四圍、HP/MP、防禦、全屬、物攻） */
const LOW_MAIN_FLAT_RARE = {
  '1_30': { main: 2, maxHpMp: 50, def: 50, allStat: 1, atk: 2 },
  '31_70': { main: 4, maxHpMp: 80, def: 80, allStat: 2, atk: 4 },
  '71_120': { main: 6, maxHpMp: 100, def: 100, allStat: 3, atk: 6 },
  '121_150': { main: 8, maxHpMp: 110, def: 110, allStat: 4, atk: 8 }
};

/** 附加潛能 %（91~150 對照 V255；1~90 依比例遞減） */
const LOW_ADDPOT_STAT_PERCENT = {
  '1_30': { rare: '1%', epic: '2%', unique: '3%', legendary: '4%' },
  '31_70': { rare: '2%', epic: '3%', unique: '5%', legendary: '6%' },
  '71_150': { rare: '3%', epic: '5%', unique: '6%', legendary: '8%' }
};

const LOW_ADDPOT_MAXHPMP_PERCENT = {
  '1_30': { rare: '1%', epic: '2%', unique: '3%', legendary: '4%' },
  '31_70': { rare: '2%', epic: '4%', unique: '5%', legendary: '7%' },
  '71_150': { rare: '3%', epic: '6%', unique: '8%', legendary: '11%' }
};

const LOW_ADDPOT_DEF_PERCENT = LOW_ADDPOT_STAT_PERCENT;

const LOW_ADDPOT_ALLSTAT_PERCENT = {
  '1_30': { epic: '1%', unique: '2%', legendary: '3%' },
  '31_70': { epic: '2%', unique: '3%', legendary: '4%' },
  '71_150': { epic: '4%', unique: '5%', legendary: '6%' }
};

/** 附加潛能固定值（91~150 罕見/傳說對照 V255） */
const LOW_ADDPOT_FLAT = {
  '1_30': {
    rare: { main: 5, atk: 5, maxHpMp: 60, def: 60, allStat: 1, speed: 3, jump: 3 },
    epic: { main: 7, atk: 6, maxHpMp: 90, def: 80, speed: 4, jump: 4 },
    unique: { main: 9, atk: 8, maxHpMp: 120 },
    legendary: { main: 11, atk: 10, maxHpMp: 150 }
  },
  '31_70': {
    rare: { main: 8, atk: 8, maxHpMp: 90, def: 90, allStat: 2, speed: 4, jump: 4 },
    epic: { main: 11, atk: 10, maxHpMp: 140, def: 110, speed: 6, jump: 6 },
    unique: { main: 14, atk: 12, maxHpMp: 200 },
    legendary: { main: 16, atk: 14, maxHpMp: 250 }
  },
  '71_150': {
    rare: { main: 11, atk: 11, maxHpMp: 125, def: 125, allStat: 3, speed: 6, jump: 6 },
    epic: { main: 15, atk: 12, maxHpMp: 185, def: 150, speed: 8, jump: 8 },
    unique: { main: 18, atk: 14, maxHpMp: 300 },
    legendary: { main: 20, atk: 16, maxHpMp: 360 }
  }
};

/** 武器附加潛能 % */
const LOW_WEAPON_ADDPOT_STAT_PERCENT = LOW_ADDPOT_STAT_PERCENT;

const LOW_WEAPON_ADDPOT_ATK_PERCENT = LOW_ADDPOT_STAT_PERCENT;

const LOW_WEAPON_ADDPOT_MAXHPMP_PERCENT = LOW_ADDPOT_MAXHPMP_PERCENT;

const LOW_WEAPON_ADDPOT_TOTAL_DAMAGE_PERCENT = {
  '1_30': { rare: '1%', epic: '2%', unique: '3%', legendary: '4%' },
  '31_70': { rare: '2%', epic: '3%', unique: '5%', legendary: '6%' },
  '71_150': { rare: '3%', epic: '5%', unique: '6%', legendary: '8%' }
};

const LOW_WEAPON_ADDPOT_CRIT_RATE_PERCENT = {
  '1_30': { rare: '3%', epic: '4%', unique: '5%', legendary: '6%' },
  '31_70': { rare: '3%', epic: '5%', unique: '6%', legendary: '7%' },
  '71_150': { rare: '4%', epic: '6%', unique: '8%', legendary: '9%' }
};

const LOW_WEAPON_ADDPOT_ALLSTAT_PERCENT = LOW_ADDPOT_ALLSTAT_PERCENT;

/** 主潛能：傳說飾品楓幣/掉寶 */
const LOW_MAIN_MESO_DROP_PERCENT = {
  '1_30': 10,
  '31_70': 15,
  '71_150': 20
};

/** 武器主潛能：內嵌 % 依階級 */
const LOW_WEAPON_MAIN_EMBEDDED_BY_RANK = {
  無視怪物防禦力: { rare: 15, epic: 15, unique: 30 },
  攻擊BOSS怪物時傷害增加: { unique: 30 }
};

/** 武器附加潛能：內嵌 % 依階級 */
const LOW_WEAPON_ADDPOT_EMBEDDED_BY_RANK = {
  無視怪物防禦力: { epic: 3, unique: 4, legendary: 5 },
  攻擊BOSS怪物時傷害增加: { unique: 12, legendary: 18 }
};

function getLowLevelAddPotFlatRow(reqLevel, internalRank) {
  const pctBand = getLowLevelPercentBand(reqLevel);
  const table = LOW_ADDPOT_FLAT[pctBand] || LOW_ADDPOT_FLAT['71_150'];
  return table[internalRank] || null;
}

function getLowLevelMainFlatRare(reqLevel) {
  const band = getLowLevelFlatBand(reqLevel);
  return LOW_MAIN_FLAT_RARE[band] || LOW_MAIN_FLAT_RARE['71_120'];
}

function getLowLevelWeaponAtkFlatLegendary(reqLevel) {
  const level = Math.max(1, Math.min(LOW_LEVEL_POTENTIAL_MAX, Number(reqLevel) || 100));
  return Math.min(32, Math.floor(level / 10) + 7);
}
