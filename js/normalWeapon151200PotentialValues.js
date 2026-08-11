/**
 * 普通武器 151~200 級潛能詞條數值（主潛能／附加潛能，所有方塊共用）
 * 來源：普通武器_151-200級_潛能屬性與數值表單.xlsx
 * 機率沿用 event8421／event8422 武器群組；此檔僅定義洗出後的數值／文案。
 */

const NORMAL_WEAPON_151200_LEVEL_MIN = 151;
const NORMAL_WEAPON_151200_LEVEL_MAX = 200;

const NORMAL_WEAPON_151200_MAIN_PERCENT = {
  rare: {
    stat: '4%',
    atk: '4%',
    crit: '4%',
    totalDamage: '4%'
  },
  epic: {
    stat: '7%',
    atk: '7%',
    crit: '8%',
    totalDamage: '7%',
    maxHpMp: '7%',
    allStat: '4%'
  },
  unique: {
    stat: '10%',
    atk: '10%',
    totalDamage: '10%',
    ignoreDef: '30%',
    bossDamage: '30%',
    crit: '10%',
    allStat: '7%'
  },
  legendary: {
    stat: '13%',
    atk: '13%',
    totalDamage: '13%',
    crit: '12%',
    allStat: '10%'
  }
};

const NORMAL_WEAPON_151200_ADDPOT_PERCENT = {
  rare: {
    stat: '4%',
    atk: '4%',
    crit: '4%',
    totalDamage: '4%',
    maxHpMp: '3%'
  },
  epic: {
    stat: '7%',
    atk: '7%',
    crit: '6%',
    totalDamage: '7%',
    maxHpMp: '6%',
    allStat: '4%',
    ignoreDef: '3%'
  },
  unique: {
    stat: '10%',
    atk: '10%',
    crit: '10%',
    totalDamage: '10%',
    maxHpMp: '8%',
    allStat: '7%',
    ignoreDef: '4%',
    bossDamage: '12%'
  },
  legendary: {
    stat: '13%',
    atk: '13%',
    crit: '13%',
    totalDamage: '13%',
    maxHpMp: '11%',
    allStat: '10%',
    ignoreDef: '5%',
    bossDamage: '18%'
  }
};

const NORMAL_WEAPON_151200_FLAT = {
  rare: {
    main: 13,
    atk: 13,
    maxHpMp: 125,
    allStat: 6,
    def: 125,
    speed: 6,
    jump: 6
  },
  legendary: {
    atk: 32
  }
};

/** 主潛能：內嵌 % 依階級（傳說沿用 cube 表 stat 名稱中的數值） */
const NORMAL_WEAPON_151200_MAIN_EMBEDDED_BY_RANK = {
  無視怪物防禦力: { rare: 15, epic: 15, unique: 30 },
  攻擊BOSS怪物時傷害增加: { unique: 30 }
};

/** 附加潛能：內嵌 % 依階級 */
const NORMAL_WEAPON_151200_ADDPOT_EMBEDDED_BY_RANK = {
  無視怪物防禦力: { epic: 3, unique: 4, legendary: 5 },
  攻擊BOSS怪物時傷害增加: { unique: 12, legendary: 18 }
};

const NORMAL_WEAPON_151200_MAIN_PROC_LINES = {
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

const NORMAL_WEAPON_151200_ADDPOT_PROC_LINES = {
  '攻擊時有一定的機率恢復HP': {
    epic: '攻擊時有 3% 的機率恢復 54 HP',
    unique: '攻擊時有 15% 的機率恢復 97 HP'
  },
  '攻擊時有一定的機率恢復MP': {
    epic: '攻擊時有 3% 的機率恢復 54 MP',
    unique: '攻擊時有 15% 的機率恢復 97 MP'
  }
};

const NORMAL_WEAPON_151200_ADDPOT_LEVEL_SCALE = {
  unique: 1,
  legendary: 2
};

function isNormalWeapon151200Item(item) {
  if (!item || (typeof isWeaponPotentialEquip === 'function'
    ? !isWeaponPotentialEquip(item)
    : item.mainType !== EQUIP_TYPE.WEAPON)) return false;
  if (typeof isDestinyWeapon === 'function' && isDestinyWeapon(item)) return false;
  const level = Number(item.reqLevel) || 0;
  return level >= NORMAL_WEAPON_151200_LEVEL_MIN && level <= NORMAL_WEAPON_151200_LEVEL_MAX;
}

function isNormalWeapon151200MainPotentialContext(context = {}) {
  if ((context.eventId || 8421) !== 8421) return false;
  return isNormalWeapon151200Item(context.item);
}

function isNormalWeapon151200AddPotentialContext(context = {}) {
  if ((context.eventId || 8422) !== 8422) return false;
  return isNormalWeapon151200Item(context.item);
}

function classifyNormalWeapon151200MainStat(statName) {
  if (statName === 'STR' || statName === 'DEX' || statName === 'INT' || statName === 'LUK') return 'mainFlat';
  if (/^(STR|DEX|INT|LUK)%$/.test(statName)) return 'mainPercent';
  if (statName === '物理攻擊力' || statName === '魔法攻擊力') return 'atkFlat';
  if (statName === '物理攻擊力%' || statName === '魔法攻擊力%') return 'atkPercent';
  if (statName === '最大HP' || statName === '最大MP') return 'maxHpMpFlat';
  if (statName === '最大HP%' || statName === '最大MP%') return 'maxHpMpPercent';
  if (statName === '爆擊機率%') return 'critRate';
  if (statName === '總傷害' || statName === '總傷害%') return 'totalDamage';
  if (statName === '全屬性') return 'allStatFlat';
  if (statName === '全屬性%') return 'allStatPercent';
  if (NORMAL_WEAPON_151200_MAIN_PROC_LINES[statName]) return 'procLine';
  return null;
}

function classifyNormalWeapon151200AddPotStat(statName) {
  if (statName === 'STR' || statName === 'DEX' || statName === 'INT' || statName === 'LUK') return 'mainFlat';
  if (/^(STR|DEX|INT|LUK)%$/.test(statName)) return 'mainPercent';
  if (statName === '物理攻擊力' || statName === '魔法攻擊力') return 'atkFlat';
  if (statName === '物理攻擊力%' || statName === '魔法攻擊力%') return 'atkPercent';
  if (statName === '最大HP' || statName === '最大MP') return 'maxHpMpFlat';
  if (statName === '最大HP%' || statName === '最大MP%') return 'maxHpMpPercent';
  if (statName === '防禦力') return 'defFlat';
  if (statName === '移動速度') return 'speedFlat';
  if (statName === '跳躍力') return 'jumpFlat';
  if (statName === '爆擊機率%') return 'critRate';
  if (statName === '總傷害' || statName === '總傷害%') return 'totalDamage';
  if (statName === '全屬性') return 'allStatFlat';
  if (statName === '全屬性%') return 'allStatPercent';
  if (/^以角色等級為準每9級增加(力量|敏捷|智力|幸運)$/.test(statName)) return 'levelScale';
  if (NORMAL_WEAPON_151200_ADDPOT_PROC_LINES[statName]) return 'procLine';
  return null;
}

function normalWeapon151200MainLabelForStat(statName) {
  if (statName === '物理攻擊力' || statName === '物理攻擊力%') return '物理攻擊力';
  if (statName === '魔法攻擊力' || statName === '魔法攻擊力%') return '魔法攻擊力';
  if (statName === '最大HP' || statName === '最大HP%') return 'MaxHP';
  if (statName === '最大MP' || statName === '最大MP%') return 'MaxMP';
  if (statName === '爆擊機率%') return '爆擊機率';
  if (statName === '總傷害' || statName === '總傷害%') return '總傷害';
  if (statName === '全屬性' || statName === '全屬性%') return '全屬性';
  if (/^(STR|DEX|INT|LUK)%?$/.test(statName)) return statName.replace(/%$/, '');
  return statName;
}

function normalWeapon151200AddPotLabelForStat(statName) {
  if (statName === '物理攻擊力' || statName === '物理攻擊力%') return '物理攻擊力';
  if (statName === '魔法攻擊力' || statName === '魔法攻擊力%') return '魔法攻擊力';
  if (statName === '最大HP' || statName === '最大HP%') return 'MaxHP';
  if (statName === '最大MP' || statName === '最大MP%') return 'MaxMP';
  if (statName === '防禦力') return '防禦力';
  if (statName === '移動速度') return '移動速度';
  if (statName === '跳躍力') return '跳躍力';
  if (statName === '爆擊機率%') return '爆擊機率';
  if (statName === '總傷害' || statName === '總傷害%') return '總傷害';
  if (statName === '全屬性' || statName === '全屬性%') return '全屬性';
  if (/^以角色等級為準每9級增加/.test(statName)) return statName;
  if (/^(STR|DEX|INT|LUK)%?$/.test(statName)) return statName.replace(/%$/, '');
  return statName;
}

function parseNormalWeapon151200MainEmbeddedStat(statName, internalRank) {
  const match = statName.match(/^(.+?)\+(\d+)(%?)$/);
  if (!match) return null;

  const baseName = match[1];
  const oldVal = Number(match[2]);
  const rankMap = NORMAL_WEAPON_151200_MAIN_EMBEDDED_BY_RANK[baseName];
  if (rankMap?.[internalRank] != null) {
    return {
      label: typeof formatPotentialBossDamageLabel === 'function'
        ? formatPotentialBossDamageLabel(baseName)
        : baseName,
      value: `${rankMap[internalRank]}%`,
    };
  }
  if (internalRank === 'legendary' && rankMap) {
    return {
      label: typeof formatPotentialBossDamageLabel === 'function'
        ? formatPotentialBossDamageLabel(baseName)
        : baseName,
      value: `${oldVal}%`,
    };
  }
  return null;
}

function parseNormalWeapon151200AddPotEmbeddedStat(statName, internalRank) {
  const match = statName.match(/^(.+?)\+(\d+)(%?)$/);
  if (!match) return null;

  const baseName = match[1];
  const rankMap = NORMAL_WEAPON_151200_ADDPOT_EMBEDDED_BY_RANK[baseName];
  if (!rankMap) return null;

  const newVal = rankMap[internalRank];
  if (newVal == null) return null;

  return {
    label: typeof formatPotentialBossDamageLabel === 'function'
      ? formatPotentialBossDamageLabel(baseName)
      : baseName,
    value: `${newVal}%`,
  };
}

function formatNormalWeapon151200MainPotentialStatValue(statName, internalRank, context = {}) {
  if (!isNormalWeapon151200MainPotentialContext(context)) return null;

  const kind = classifyNormalWeapon151200MainStat(statName);
  if (!kind || kind === 'procLine') return null;

  const pct = NORMAL_WEAPON_151200_MAIN_PERCENT[internalRank];
  const flat = NORMAL_WEAPON_151200_FLAT[internalRank];

  switch (kind) {
    case 'mainFlat':
      return internalRank === 'rare' && flat?.main != null ? String(flat.main) : null;
    case 'mainPercent':
      return pct?.stat || null;
    case 'atkFlat':
      if (internalRank === 'rare') return String(NORMAL_WEAPON_151200_FLAT.rare.atk);
      if (internalRank === 'legendary') return String(NORMAL_WEAPON_151200_FLAT.legendary.atk);
      return null;
    case 'atkPercent':
      return pct?.atk || null;
    case 'maxHpMpFlat':
      return internalRank === 'rare' ? String(NORMAL_WEAPON_151200_FLAT.rare.maxHpMp) : null;
    case 'maxHpMpPercent':
      return pct?.maxHpMp || null;
    case 'critRate':
      return pct?.crit || null;
    case 'totalDamage':
      return pct?.totalDamage || null;
    case 'allStatFlat':
      return internalRank === 'rare' ? String(NORMAL_WEAPON_151200_FLAT.rare.allStat) : null;
    case 'allStatPercent':
      return pct?.allStat || null;
    default:
      return null;
  }
}

function formatNormalWeapon151200AddPotentialStatValue(statName, internalRank, context = {}) {
  if (!isNormalWeapon151200AddPotentialContext(context)) return null;

  const kind = classifyNormalWeapon151200AddPotStat(statName);
  if (!kind || kind === 'procLine' || kind === 'levelScale') return null;

  const pct = NORMAL_WEAPON_151200_ADDPOT_PERCENT[internalRank];
  const flat = NORMAL_WEAPON_151200_FLAT[internalRank];

  switch (kind) {
    case 'mainFlat':
      return internalRank === 'rare' && flat?.main != null ? String(flat.main) : null;
    case 'mainPercent':
      return pct?.stat || null;
    case 'atkFlat':
      if (internalRank === 'rare') return String(NORMAL_WEAPON_151200_FLAT.rare.atk);
      if (internalRank === 'legendary') return String(NORMAL_WEAPON_151200_FLAT.legendary.atk);
      return null;
    case 'atkPercent':
      return pct?.atk || null;
    case 'maxHpMpFlat':
      return internalRank === 'rare' ? String(NORMAL_WEAPON_151200_FLAT.rare.maxHpMp) : null;
    case 'maxHpMpPercent':
      return pct?.maxHpMp || null;
    case 'defFlat':
      return internalRank === 'rare' ? String(NORMAL_WEAPON_151200_FLAT.rare.def) : null;
    case 'speedFlat':
      return internalRank === 'rare' ? String(NORMAL_WEAPON_151200_FLAT.rare.speed) : null;
    case 'jumpFlat':
      return internalRank === 'rare' ? String(NORMAL_WEAPON_151200_FLAT.rare.jump) : null;
    case 'critRate':
      return pct?.crit || null;
    case 'totalDamage':
      return pct?.totalDamage || null;
    case 'allStatFlat':
      return internalRank === 'rare' ? String(NORMAL_WEAPON_151200_FLAT.rare.allStat) : null;
    case 'allStatPercent':
      return pct?.allStat || null;
    default:
      return null;
  }
}

function parseNormalWeapon151200MainPotentialStat(statName, internalRank, context = {}) {
  if (!isNormalWeapon151200MainPotentialContext(context)) return null;

  const embedded = parseNormalWeapon151200MainEmbeddedStat(statName, internalRank);
  if (embedded) return embedded;

  const procTable = NORMAL_WEAPON_151200_MAIN_PROC_LINES[statName];
  if (procTable?.[internalRank]) {
    return { label: procTable[internalRank], value: '' };
  }

  const value = formatNormalWeapon151200MainPotentialStatValue(statName, internalRank, context);
  if (value == null) return null;

  return {
    label: normalWeapon151200MainLabelForStat(statName),
    value
  };
}

function parseNormalWeapon151200AddPotentialStat(statName, internalRank, context = {}) {
  if (!isNormalWeapon151200AddPotentialContext(context)) return null;

  const embedded = parseNormalWeapon151200AddPotEmbeddedStat(statName, internalRank);
  if (embedded) return embedded;

  const procTable = NORMAL_WEAPON_151200_ADDPOT_PROC_LINES[statName];
  if (procTable?.[internalRank]) {
    return { label: procTable[internalRank], value: '' };
  }

  if (/^以角色等級為準每9級增加(力量|敏捷|智力|幸運)$/.test(statName)) {
    const perStep = NORMAL_WEAPON_151200_ADDPOT_LEVEL_SCALE[internalRank];
    if (perStep == null) return null;
    return { label: statName, value: String(perStep) };
  }

  const value = formatNormalWeapon151200AddPotentialStatValue(statName, internalRank, context);
  if (value == null) return null;

  return {
    label: normalWeapon151200AddPotLabelForStat(statName),
    value
  };
}
