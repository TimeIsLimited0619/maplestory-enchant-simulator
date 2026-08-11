/**
 * 命運武器附加潛能詞條數值（所有附加潛能方塊共用）
 * 來源：命運武器_附加潛能屬性與數值表單.xlsx
 * 機率沿用 event8422 武器群組；此檔僅定義洗出後的數值／文案。
 */

const DESTINY_WEAPON_ADDPOT_PERCENT = {
  rare: {
    stat: '4%',
    atk: '4%',
    crit: '5%',
    totalDamage: '4%',
    maxHpMp: '3%'
  },
  epic: {
    stat: '7%',
    atk: '7%',
    crit: '7%',
    totalDamage: '7%',
    maxHpMp: '6%',
    allStat: '4%',
    ignoreDef: '5%'
  },
  unique: {
    stat: '10%',
    atk: '10%',
    crit: '10%',
    totalDamage: '10%',
    maxHpMp: '9%',
    allStat: '7%',
    ignoreDef: '6%',
    bossDamage: '14%'
  },
  legendary: {
    stat: '13%',
    atk: '13%',
    crit: '13%',
    totalDamage: '13%',
    maxHpMp: '12%',
    allStat: '10%',
    ignoreDef: '7%',
    bossDamage: '20%'
  }
};

const DESTINY_WEAPON_ADDPOT_FLAT = {
  rare: {
    main: 13,
    atk: 13,
    maxHpMp: 125,
    def: 125,
    allStat: 6,
    speed: 6,
    jump: 6
  },
  legendary: {
    atk: 32
  }
};

/** 內嵌 % 詞條依階級顯示（忽略 stat 名稱中的舊數值） */
const DESTINY_WEAPON_ADDPOT_EMBEDDED_BY_RANK = {
  無視怪物防禦力: { epic: 5, unique: 6, legendary: 7 },
  攻擊BOSS怪物時傷害增加: { unique: 14, legendary: 20 }
};

const DESTINY_WEAPON_ADDPOT_PROC_LINES = {
  '攻擊時有一定的機率恢復HP': {
    epic: '攻擊時有 3% 的機率恢復 54 HP',
    unique: '攻擊時有 15% 的機率恢復 97 HP'
  },
  '攻擊時有一定的機率恢復MP': {
    epic: '攻擊時有 3% 的機率恢復 54 MP',
    unique: '攻擊時有 15% 的機率恢復 97 MP'
  }
};

const DESTINY_WEAPON_ADDPOT_LEVEL_SCALE = {
  unique: 1,
  legendary: 2
};

function isDestinyWeaponAddPotentialContext(context = {}) {
  const item = context.item;
  if (!item || (typeof isWeaponPotentialEquip === 'function'
    ? !isWeaponPotentialEquip(item)
    : item.mainType !== EQUIP_TYPE.WEAPON)) return false;
  if ((context.eventId || 8422) !== 8422) return false;
  if (typeof isDestinyWeapon === 'function') return isDestinyWeapon(item);
  return item.weaponTier === 'destiny' || item.isDestinyWeapon === true;
}

function classifyDestinyWeaponAddPotStat(statName) {
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
  if (DESTINY_WEAPON_ADDPOT_PROC_LINES[statName]) return 'procLine';
  return null;
}

function destinyWeaponAddPotLabelForStat(statName) {
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

function parseDestinyWeaponAddPotEmbeddedStat(statName, internalRank) {
  const match = statName.match(/^(.+?)\+(\d+)(%?)$/);
  if (!match) return null;

  const baseName = match[1];
  const rankMap = DESTINY_WEAPON_ADDPOT_EMBEDDED_BY_RANK[baseName];
  if (!rankMap) return null;

  const newVal = rankMap[internalRank];
  if (newVal == null) return null;

  return {
    label: typeof formatPotentialBossDamageLabel === 'function'
      ? formatPotentialBossDamageLabel(baseName)
      : baseName,
    value: `${newVal}%`
  };
}

function formatDestinyWeaponAddPotentialStatValue(statName, internalRank, context = {}) {
  if (!isDestinyWeaponAddPotentialContext(context)) return null;

  const kind = classifyDestinyWeaponAddPotStat(statName);
  if (!kind || kind === 'procLine' || kind === 'levelScale') return null;

  const pct = DESTINY_WEAPON_ADDPOT_PERCENT[internalRank];
  const flat = DESTINY_WEAPON_ADDPOT_FLAT[internalRank];

  switch (kind) {
    case 'mainFlat':
      return internalRank === 'rare' && flat?.main != null ? String(flat.main) : null;
    case 'mainPercent':
      return pct?.stat || null;
    case 'atkFlat':
      if (internalRank === 'rare') return String(DESTINY_WEAPON_ADDPOT_FLAT.rare.atk);
      if (internalRank === 'legendary') return String(DESTINY_WEAPON_ADDPOT_FLAT.legendary.atk);
      return null;
    case 'atkPercent':
      return pct?.atk || null;
    case 'maxHpMpFlat':
      return internalRank === 'rare' ? String(DESTINY_WEAPON_ADDPOT_FLAT.rare.maxHpMp) : null;
    case 'maxHpMpPercent':
      return pct?.maxHpMp || null;
    case 'defFlat':
      return internalRank === 'rare' ? String(DESTINY_WEAPON_ADDPOT_FLAT.rare.def) : null;
    case 'speedFlat':
      return internalRank === 'rare' ? String(DESTINY_WEAPON_ADDPOT_FLAT.rare.speed) : null;
    case 'jumpFlat':
      return internalRank === 'rare' ? String(DESTINY_WEAPON_ADDPOT_FLAT.rare.jump) : null;
    case 'critRate':
      return pct?.crit || null;
    case 'totalDamage':
      return pct?.totalDamage || null;
    case 'allStatFlat':
      return internalRank === 'rare' ? String(DESTINY_WEAPON_ADDPOT_FLAT.rare.allStat) : null;
    case 'allStatPercent':
      return pct?.allStat || null;
    default:
      return null;
  }
}

function parseDestinyWeaponAddPotentialStat(statName, internalRank, context = {}) {
  if (!isDestinyWeaponAddPotentialContext(context)) return null;

  const embedded = parseDestinyWeaponAddPotEmbeddedStat(statName, internalRank);
  if (embedded) return embedded;

  const procTable = DESTINY_WEAPON_ADDPOT_PROC_LINES[statName];
  if (procTable?.[internalRank]) {
    return { label: procTable[internalRank], value: '' };
  }

  if (/^以角色等級為準每9級增加(力量|敏捷|智力|幸運)$/.test(statName)) {
    const perStep = DESTINY_WEAPON_ADDPOT_LEVEL_SCALE[internalRank];
    if (perStep == null) return null;
    return { label: statName, value: String(perStep) };
  }

  const value = formatDestinyWeaponAddPotentialStatValue(statName, internalRank, context);
  if (value == null) return null;

  return {
    label: destinyWeaponAddPotLabelForStat(statName),
    value
  };
}
