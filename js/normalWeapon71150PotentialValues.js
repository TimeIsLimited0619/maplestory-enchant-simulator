/**
 * 普通武器 1~150 級潛能詞條數值（主潛能／附加潛能，所有方塊共用）
 * 機率沿用 event8421／event8422 武器群組；此檔僅定義洗出後的數值／文案。
 * 數值來源：社群方塊潛能整理表（1~150）、官方 V255（91~150 附加參考）
 */

const NORMAL_WEAPON_71150_LEVEL_MIN = 1;
const NORMAL_WEAPON_71150_LEVEL_MAX = 150;

const NORMAL_WEAPON_71150_MAIN_PROC_LINES = {
  '攻擊時有一定的機率恢復HP': {
    epic: '攻擊時有 20% 的機率恢復 200 HP'
  },
  '攻擊時有一定的機率恢復MP': {
    rare: '攻擊時有 20% 的機率恢復 80 MP',
    epic: '攻擊時有 20% 的機率恢復 120 MP'
  },
  '攻擊時有一定的機率發動中毒效果': {
    rare: '攻擊時有 20% 的機率使對象中毒(Lv.4)'
  },
  '攻擊時有一定的機率發動昏迷效果': {
    rare: '攻擊時有 10% 的機率使對象昏迷(Lv.1)'
  },
  '攻擊時有一定的機率發動緩慢效果': {
    rare: '攻擊時有 20% 的機率使對象緩慢(Lv.1)'
  },
  '攻擊時有一定的機率發動闇黑效果': {
    rare: '攻擊時有 20% 的機率使對象闇黑(Lv.2)'
  },
  '攻擊時有一定的機率發動冰結效果': {
    rare: '攻擊時有 10% 的機率使對象冰結(Lv.1)'
  },
  '攻擊時有一定的機率發動封印效果': {
    rare: '攻擊時有 10% 的機率使對象封印(Lv.1)'
  }
};

const NORMAL_WEAPON_71150_ADDPOT_PROC_LINES = {
  '攻擊時有一定的機率恢復HP': {
    epic: '攻擊時有 3% 的機率恢復 30 HP',
    unique: '攻擊時有 15% 的機率恢復 60 HP'
  },
  '攻擊時有一定的機率恢復MP': {
    epic: '攻擊時有 3% 的機率恢復 30 MP',
    unique: '攻擊時有 15% 的機率恢復 60 MP'
  }
};

const NORMAL_WEAPON_71150_ADDPOT_LEVEL_SCALE = {
  unique: 1,
  legendary: 2
};

function isNormalWeapon71150Item(item) {
  if (!item || (typeof isWeaponPotentialEquip === 'function'
    ? !isWeaponPotentialEquip(item)
    : item.mainType !== EQUIP_TYPE.WEAPON)) return false;
  if (typeof isDestinyWeapon === 'function' && isDestinyWeapon(item)) return false;
  const level = Number(item.reqLevel) || 0;
  return level >= NORMAL_WEAPON_71150_LEVEL_MIN && level <= NORMAL_WEAPON_71150_LEVEL_MAX;
}

function isNormalWeapon71150MainPotentialContext(context = {}) {
  if ((context.eventId || 8421) !== 8421) return false;
  return isNormalWeapon71150Item(context.item);
}

function isNormalWeapon71150AddPotentialContext(context = {}) {
  if ((context.eventId || 8422) !== 8422) return false;
  return isNormalWeapon71150Item(context.item);
}

function classifyNormalWeapon71150MainStat(statName) {
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
  if (NORMAL_WEAPON_71150_MAIN_PROC_LINES[statName]) return 'procLine';
  return null;
}

function classifyNormalWeapon71150AddPotStat(statName) {
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
  if (NORMAL_WEAPON_71150_ADDPOT_PROC_LINES[statName]) return 'procLine';
  return null;
}

function normalWeapon71150MainLabelForStat(statName) {
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

function normalWeapon71150AddPotLabelForStat(statName) {
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

function parseNormalWeapon71150MainEmbeddedStat(statName, internalRank) {
  const match = statName.match(/^(.+?)\+(\d+)(%?)$/);
  if (!match) return null;

  const baseName = match[1];
  const oldVal = Number(match[2]);
  const rankMap = LOW_WEAPON_MAIN_EMBEDDED_BY_RANK[baseName];
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

function parseNormalWeapon71150AddPotEmbeddedStat(statName, internalRank) {
  const match = statName.match(/^(.+?)\+(\d+)(%?)$/);
  if (!match) return null;

  const baseName = match[1];
  const rankMap = LOW_WEAPON_ADDPOT_EMBEDDED_BY_RANK[baseName];
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

function formatNormalWeapon71150MainPotentialStatValue(statName, internalRank, context = {}) {
  if (!isNormalWeapon71150MainPotentialContext(context)) return null;

  const kind = classifyNormalWeapon71150MainStat(statName);
  if (!kind || kind === 'procLine') return null;

  const reqLevel = context.item?.reqLevel || 100;
  const pctBand = getLowLevelPercentBand(reqLevel);
  const flatRare = getLowLevelMainFlatRare(reqLevel);

  switch (kind) {
    case 'mainFlat':
      return internalRank === 'rare' ? String(flatRare.main) : null;
    case 'mainPercent':
      return pickLowLevelRankRow(LOW_MAIN_STAT_PERCENT, pctBand, internalRank);
    case 'atkFlat':
      if (internalRank === 'rare') return String(flatRare.atk);
      if (internalRank === 'legendary') {
        return String(getLowLevelWeaponAtkFlatLegendary(reqLevel));
      }
      return null;
    case 'atkPercent':
      return pickLowLevelRankRow(LOW_WEAPON_ATK_PERCENT, pctBand, internalRank);
    case 'maxHpMpFlat':
      return internalRank === 'rare' ? String(flatRare.maxHpMp) : null;
    case 'maxHpMpPercent':
      return pickLowLevelRankRow(LOW_MAIN_STAT_PERCENT, pctBand, internalRank);
    case 'critRate':
      return pickLowLevelRankRow(LOW_WEAPON_CRIT_RATE_PERCENT, pctBand, internalRank);
    case 'totalDamage':
      return pickLowLevelRankRow(LOW_WEAPON_TOTAL_DAMAGE_PERCENT, pctBand, internalRank);
    case 'allStatFlat':
      return internalRank === 'rare' ? String(flatRare.allStat) : null;
    case 'allStatPercent':
      return pickLowLevelRankRow(LOW_MAIN_ALLSTAT_PERCENT, pctBand, internalRank);
    default:
      return null;
  }
}

function formatNormalWeapon71150AddPotentialStatValue(statName, internalRank, context = {}) {
  if (!isNormalWeapon71150AddPotentialContext(context)) return null;

  const kind = classifyNormalWeapon71150AddPotStat(statName);
  if (!kind || kind === 'procLine' || kind === 'levelScale') return null;

  const reqLevel = context.item?.reqLevel || 100;
  const pctBand = getLowLevelPercentBand(reqLevel);
  const flat = getLowLevelAddPotFlatRow(reqLevel, internalRank);

  switch (kind) {
    case 'mainFlat':
      return flat?.main != null ? String(flat.main) : null;
    case 'mainPercent':
      return pickLowLevelRankRow(LOW_WEAPON_ADDPOT_STAT_PERCENT, pctBand, internalRank);
    case 'atkFlat':
      if (internalRank === 'rare' && flat?.atk != null) return String(flat.atk);
      if (internalRank === 'legendary') {
        return String(getLowLevelWeaponAtkFlatLegendary(reqLevel));
      }
      return flat?.atk != null ? String(flat.atk) : null;
    case 'atkPercent':
      return pickLowLevelRankRow(LOW_WEAPON_ADDPOT_ATK_PERCENT, pctBand, internalRank);
    case 'maxHpMpFlat':
      return flat?.maxHpMp != null ? String(flat.maxHpMp) : null;
    case 'maxHpMpPercent':
      return pickLowLevelRankRow(LOW_WEAPON_ADDPOT_MAXHPMP_PERCENT, pctBand, internalRank);
    case 'defFlat':
      return flat?.def != null ? String(flat.def) : null;
    case 'speedFlat':
      return flat?.speed != null ? String(flat.speed) : null;
    case 'jumpFlat':
      return flat?.jump != null ? String(flat.jump) : null;
    case 'critRate':
      return pickLowLevelRankRow(LOW_WEAPON_ADDPOT_CRIT_RATE_PERCENT, pctBand, internalRank);
    case 'totalDamage':
      return pickLowLevelRankRow(LOW_WEAPON_ADDPOT_TOTAL_DAMAGE_PERCENT, pctBand, internalRank);
    case 'allStatFlat':
      return internalRank === 'rare' && flat?.allStat != null ? String(flat.allStat) : null;
    case 'allStatPercent':
      return pickLowLevelRankRow(LOW_WEAPON_ADDPOT_ALLSTAT_PERCENT, pctBand, internalRank);
    default:
      return null;
  }
}

function parseNormalWeapon71150MainPotentialStat(statName, internalRank, context = {}) {
  if (!isNormalWeapon71150MainPotentialContext(context)) return null;

  const embedded = parseNormalWeapon71150MainEmbeddedStat(statName, internalRank);
  if (embedded) return embedded;

  const procTable = NORMAL_WEAPON_71150_MAIN_PROC_LINES[statName];
  if (procTable?.[internalRank]) {
    return { label: procTable[internalRank], value: '' };
  }

  const value = formatNormalWeapon71150MainPotentialStatValue(statName, internalRank, context);
  if (value == null) return null;

  return {
    label: normalWeapon71150MainLabelForStat(statName),
    value
  };
}

function parseNormalWeapon71150AddPotentialStat(statName, internalRank, context = {}) {
  if (!isNormalWeapon71150AddPotentialContext(context)) return null;

  const embedded = parseNormalWeapon71150AddPotEmbeddedStat(statName, internalRank);
  if (embedded) return embedded;

  const procTable = NORMAL_WEAPON_71150_ADDPOT_PROC_LINES[statName];
  if (procTable?.[internalRank]) {
    return { label: procTable[internalRank], value: '' };
  }

  if (/^以角色等級為準每9級增加(力量|敏捷|智力|幸運)$/.test(statName)) {
    const perStep = NORMAL_WEAPON_71150_ADDPOT_LEVEL_SCALE[internalRank];
    if (perStep == null) return null;
    return { label: statName, value: String(perStep) };
  }

  const value = formatNormalWeapon71150AddPotentialStatValue(statName, internalRank, context);
  if (value == null) return null;

  return {
    label: normalWeapon71150AddPotLabelForStat(statName),
    value
  };
}
