/**
 * 命運武器主潛能詞條數值（所有主潛能方塊共用）
 * 來源：Destiny_Weapon_Restoration_Cube_Options_Matrix-v2.xlsx
 * 機率沿用 event8421 武器群組；此檔僅定義洗出後的數值／文案。
 */

const DESTINY_WEAPON_POT_PERCENT = {
  rare: {
    stat: '4%',
    atk: '4%',
    crit: '5%',
    totalDamage: '4%'
  },
  epic: {
    stat: '7%',
    atk: '7%',
    crit: '9%',
    totalDamage: '7%',
    maxHpMp: '7%',
    allStat: '4%'
  },
  unique: {
    stat: '10%',
    atk: '10%',
    totalDamage: '10%',
    ignoreDef: '35%',
    bossDamage: '35%',
    crit: '10%',
    allStat: '7%'
  },
  legendary: {
    stat: '13%',
    atk: '13%',
    totalDamage: '13%',
    crit: '13%',
    allStat: '10%',
    ignoreDefHigh: '45%',
    ignoreDefLow: '40%',
    bossDamageHigh: '45%',
    bossDamageLow: '40%'
  }
};

const DESTINY_WEAPON_POT_FLAT = {
  rare: {
    main: 13,
    maxHpMp: 125,
    atk: 13,
    allStat: 6
  },
  legendary: {
    atk: 32
  }
};

/** 命運武器：內嵌 % 詞條（cube 表 stat 名稱中的舊值 → 顯示值） */
const DESTINY_WEAPON_EMBEDDED_REMAP = {
  無視怪物防禦力: { 15: 20, 30: 35, 35: 40, 40: 45 },
  攻擊BOSS怪物時傷害增加: { 30: 35, 35: 40, 40: 45 }
};

const DESTINY_WEAPON_PROC_LINES = {
  '攻擊時有一定的機率恢復HP': {
    epic: '攻擊時有 20% 的機率恢復 375 HP'
  },
  '攻擊時有一定的機率恢復MP': {
    rare: '攻擊時有 20% 的機率恢復 125 MP',
    epic: '攻擊時有 20% 的機率恢復 187 MP'
  },
  '攻擊時有一定的機率發動中毒效果': {
    rare: '攻擊時有 20% 的機率使對象中毒(Lv.6)'
  },
  '攻擊時有一定的機率發動昏迷效果': {
    rare: '攻擊時有 10% 的機率使對象昏迷(Lv.2)'
  },
  '攻擊時有一定的機率發動緩慢效果': {
    rare: '攻擊時有 20% 的機率使對象緩慢(Lv.2)'
  },
  '攻擊時有一定的機率發動闇黑效果': {
    rare: '攻擊時有 20% 的機率使對象闇黑(Lv.3)'
  },
  '攻擊時有一定的機率發動冰結效果': {
    rare: '攻擊時有 10% 的機率使對象冰結(Lv.2)'
  },
  '攻擊時有一定的機率發動封印效果': {
    rare: '攻擊時有 10% 的機率使對象封印(Lv.2)'
  }
};

/** 命運武器 + 主潛能（8421）：與方塊種類無關，數值表一律套用 */
function isDestinyWeaponMainPotentialContext(context = {}) {
  const item = context.item;
  if (!item || (typeof isWeaponPotentialEquip === 'function'
    ? !isWeaponPotentialEquip(item)
    : item.mainType !== EQUIP_TYPE.WEAPON)) return false;
  if ((context.eventId || 8421) !== 8421) return false;
  if (typeof isDestinyWeapon === 'function') return isDestinyWeapon(item);
  return item.weaponTier === 'destiny' || item.isDestinyWeapon === true;
}

function classifyDestinyWeaponCubeStat(statName) {
  if (statName === 'STR' || statName === 'DEX' || statName === 'INT' || statName === 'LUK') return 'mainFlat';
  if (/^(STR|DEX|INT|LUK)%$/.test(statName)) return 'mainPercent';
  if (statName === '物理攻擊力' || statName === '魔法攻擊力') return 'atkFlat';
  if (statName === '物理攻擊力%' || statName === '魔法攻擊力%') return 'atkPercent';
  if (statName === '最大HP' || statName === '最大MP') return 'maxHpMpFlat';
  if (statName === '最大HP%' || statName === '最大MP%') return 'maxHpMpPercent';
  if (statName === '爆擊機率%') return 'critRate';
  if (statName === '總傷害%') return 'totalDamage';
  if (statName === '全屬性') return 'allStatFlat';
  if (statName === '全屬性%') return 'allStatPercent';
  if (DESTINY_WEAPON_PROC_LINES[statName]) return 'procLine';
  return null;
}

function destinyWeaponLabelForStat(statName) {
  if (statName === '物理攻擊力' || statName === '魔法攻擊力') {
    return statName === '物理攻擊力' ? '物理攻擊力' : '魔法攻擊力';
  }
  if (statName === '物理攻擊力%' || statName === '魔法攻擊力%') {
    return statName === '物理攻擊力%' ? '物理攻擊力' : '魔法攻擊力';
  }
  if (statName === '最大HP' || statName === '最大HP%') return 'MaxHP';
  if (statName === '最大MP' || statName === '最大MP%') return 'MaxMP';
  if (statName === '爆擊機率%') return '爆擊機率';
  if (statName === '總傷害%') return '總傷害';
  if (statName === '全屬性' || statName === '全屬性%') return '全屬性';
  if (/^(STR|DEX|INT|LUK)%?$/.test(statName)) return statName.replace(/%$/, '');
  return statName;
}

function parseDestinyWeaponEmbeddedStat(statName) {
  const match = statName.match(/^(.+?)\+(\d+)(%?)$/);
  if (!match) return null;

  const baseName = match[1];
  const oldVal = Number(match[2]);
  const tierMap = DESTINY_WEAPON_EMBEDDED_REMAP[baseName];
  if (!tierMap) return null;

  const newVal = tierMap[oldVal] ?? oldVal;
  return {
    label: typeof formatPotentialBossDamageLabel === 'function'
      ? formatPotentialBossDamageLabel(baseName)
      : baseName,
    value: `${newVal}%`
  };
}

function formatDestinyWeaponPotentialStatValue(statName, internalRank, context = {}) {
  if (!isDestinyWeaponMainPotentialContext(context)) return null;

  const kind = classifyDestinyWeaponCubeStat(statName);
  if (!kind || kind === 'procLine') return null;

  const pct = DESTINY_WEAPON_POT_PERCENT[internalRank];
  const flat = DESTINY_WEAPON_POT_FLAT[internalRank];

  switch (kind) {
    case 'mainFlat':
      return internalRank === 'rare' && flat?.main != null ? String(flat.main) : null;
    case 'mainPercent':
      return pct?.stat || null;
    case 'atkFlat':
      if (internalRank === 'rare') return String(DESTINY_WEAPON_POT_FLAT.rare.atk);
      if (internalRank === 'legendary') return String(DESTINY_WEAPON_POT_FLAT.legendary.atk);
      return null;
    case 'atkPercent':
      return pct?.atk || null;
    case 'maxHpMpFlat':
      return internalRank === 'rare' ? String(DESTINY_WEAPON_POT_FLAT.rare.maxHpMp) : null;
    case 'maxHpMpPercent':
      return pct?.maxHpMp || null;
    case 'critRate':
      return pct?.crit || null;
    case 'totalDamage':
      return pct?.totalDamage || null;
    case 'allStatFlat':
      return internalRank === 'rare' ? String(DESTINY_WEAPON_POT_FLAT.rare.allStat) : null;
    case 'allStatPercent':
      return pct?.allStat || null;
    default:
      return null;
  }
}

function parseDestinyWeaponPotentialStat(statName, internalRank, context = {}) {
  if (!isDestinyWeaponMainPotentialContext(context)) return null;

  const embedded = parseDestinyWeaponEmbeddedStat(statName);
  if (embedded) return embedded;

  const procTable = DESTINY_WEAPON_PROC_LINES[statName];
  if (procTable?.[internalRank]) {
    return { label: procTable[internalRank], value: '' };
  }

  const value = formatDestinyWeaponPotentialStatValue(statName, internalRank, context);
  if (value == null) return null;

  return {
    label: destinyWeaponLabelForStat(statName),
    value
  };
}
