/**
 * 防具與飾品 201~250 級附加潛能詞條數值（所有附加潛能方塊共用）
 * 來源：飾品_附加潛能屬性與數值對照表 1(201-250級_附加潛能總覽).csv
 * 機率沿用 event8422；此檔僅定義洗出後的數值／文案。
 */

const ARMOR_ACC_201250_ADDPOT_LEVEL_MIN = 201;
const ARMOR_ACC_201250_ADDPOT_LEVEL_MAX = 250;

const ARMOR_ACC_201250_ADDPOT_PERCENT = {
  rare: {
    stat: '3%',
    maxHpMp: '3%',
    def: '3%'
  },
  epic: {
    stat: '5%',
    maxHpMp: '6%',
    allStat: '5%',
    def: '5%'
  },
  unique: {
    stat: '7%',
    maxHpMp: '9%',
    allStat: '6%'
  },
  legendary: {
    stat: '9%',
    maxHpMp: '12%',
    allStat: '7%',
    critDamage: '1%',
    gloveCritDamage: '3%',
    meso: 5,
    drop: 5
  }
};

const ARMOR_ACC_201250_ADDPOT_FLAT = {
  rare: {
    main: 11,
    atk: 11,
    maxHpMp: 125,
    def: 125,
    allStat: 3,
    speed: 6,
    jump: 6
  },
  epic: {
    main: 15,
    atk: 12,
    maxHpMp: 185,
    def: 150,
    speed: 8,
    jump: 8
  },
  unique: {
    main: 19,
    atk: 15,
    maxHpMp: 315
  },
  legendary: {
    main: 21,
    atk: 17,
    maxHpMp: 375
  }
};

const ARMOR_ACC_201250_ADDPOT_HP_RECOVERY = {
  unique: '20%',
  legendary: '30%'
};

const ARMOR_ACC_201250_ADDPOT_LEVEL_SCALE = {
  unique: 1,
  legendary: 2
};

function isArmorAccessory201250AddPotItem(item) {
  if (!item) return false;
  if (item.mainType !== EQUIP_TYPE.ARMOR && item.mainType !== EQUIP_TYPE.ACCESSORY) return false;
  const level = Number(item.reqLevel) || 0;
  return level >= ARMOR_ACC_201250_ADDPOT_LEVEL_MIN && level <= ARMOR_ACC_201250_ADDPOT_LEVEL_MAX;
}

function isArmorAccessory201250AddPotentialContext(context = {}) {
  if ((context.eventId || 8422) !== 8422) return false;
  return isArmorAccessory201250AddPotItem(context.item);
}

function getArmorAcc201250AddPotSlotKind(item) {
  if (!item) return null;
  if (typeof isCapeGroupPotentialEquip === 'function' && isCapeGroupPotentialEquip(item)) {
    return 'armorOther';
  }
  if (item.mainType === EQUIP_TYPE.ACCESSORY) return 'accessory';
  switch (item.islot) {
    case 'Cp': return 'hat';
    case 'Gv': return 'glove';
    default: return 'armorOther';
  }
}

function getAddPot201250EntryScope(context) {
  return context.group?.entries?.[context.entryIndex]?.scope || null;
}

function classifyArmorAccessory201250AddPotStat(statName) {
  if (statName === 'STR' || statName === 'DEX' || statName === 'INT' || statName === 'LUK') return 'mainFlat';
  if (/^(STR|DEX|INT|LUK)%$/.test(statName)) return 'mainPercent';
  if (statName === '物理攻擊力' || statName === '魔法攻擊力') return 'atkFlat';
  if (statName === '最大HP' || statName === '最大MP') return 'maxHpMpFlat';
  if (statName === '最大HP%' || statName === '最大MP%') return 'maxHpMpPercent';
  if (statName === '防禦力') return 'defFlat';
  if (statName === '防禦力%') return 'defPercent';
  if (statName === '全屬性') return 'allStatFlat';
  if (statName === '全屬性%') return 'allStatPercent';
  if (statName === '移動速度') return 'speedFlat';
  if (statName === '跳躍力') return 'jumpFlat';
  if (statName === '爆擊傷害%') return 'critDamage';
  if (statName === '楓幣獲得量%') return 'mesoPercent';
  if (statName === '道具掉落率%') return 'dropPercent';
  if (statName === 'HP恢復道具及恢復技能效果增加') return 'hpRecovery';
  if (statName === '減少所有技能冷卻時間(10秒以下會減少5%，不會減少到未滿5秒)') return 'cooldownReduce';
  if (/^以角色等級為準每9級增加(力量|敏捷|智力|幸運)$/.test(statName)) return 'levelScale';
  return null;
}

function armorAccessory201250AddPotLabelForStat(statName) {
  if (statName === '物理攻擊力' || statName === '魔法攻擊力') return statName;
  if (statName === '最大HP' || statName === '最大HP%') return 'MaxHP';
  if (statName === '最大MP' || statName === '最大MP%') return 'MaxMP';
  if (statName === '防禦力' || statName === '防禦力%') return '防禦力';
  if (statName === '全屬性' || statName === '全屬性%') return '全屬性';
  if (statName === '移動速度') return '移動速度';
  if (statName === '跳躍力') return '跳躍力';
  if (statName === '爆擊傷害%') return '爆擊傷害';
  if (statName === '楓幣獲得量%') return '楓幣獲得量';
  if (statName === '道具掉落率%') return '道具掉落率';
  if (/^以角色等級為準每9級增加/.test(statName)) return statName;
  if (/^(STR|DEX|INT|LUK)%?$/.test(statName)) return statName.replace(/%$/, '');
  return statName;
}

function formatArmorAccessory201250AddPotentialStatValue(statName, internalRank, context = {}) {
  if (!isArmorAccessory201250AddPotentialContext(context)) return null;

  const kind = classifyArmorAccessory201250AddPotStat(statName);
  if (!kind || kind === 'levelScale' || kind === 'hpRecovery' || kind === 'cooldownReduce') return null;

  const item = context.item;
  const slot = getArmorAcc201250AddPotSlotKind(item);
  const pct = ARMOR_ACC_201250_ADDPOT_PERCENT[internalRank];
  const flat = ARMOR_ACC_201250_ADDPOT_FLAT[internalRank];

  switch (kind) {
    case 'mainFlat':
      return flat?.main != null ? String(flat.main) : null;
    case 'mainPercent':
      return pct?.stat || null;
    case 'atkFlat':
      return flat?.atk != null ? String(flat.atk) : null;
    case 'maxHpMpFlat':
      return flat?.maxHpMp != null ? String(flat.maxHpMp) : null;
    case 'maxHpMpPercent':
      return pct?.maxHpMp || null;
    case 'defFlat':
      return flat?.def != null ? String(flat.def) : null;
    case 'defPercent':
      return pct?.def || null;
    case 'allStatFlat':
      return internalRank === 'rare' ? String(ARMOR_ACC_201250_ADDPOT_FLAT.rare.allStat) : null;
    case 'allStatPercent':
      return pct?.allStat || null;
    case 'speedFlat':
      return flat?.speed != null ? String(flat.speed) : null;
    case 'jumpFlat':
      return flat?.jump != null ? String(flat.jump) : null;
    case 'critDamage': {
      if (internalRank !== 'legendary') return null;
      if (slot === 'glove') {
        const scope = getAddPot201250EntryScope(context);
        if (scope === '手套專用') return pct?.gloveCritDamage || null;
        return pct?.critDamage || null;
      }
      return pct?.critDamage || null;
    }
    case 'mesoPercent':
      return internalRank === 'legendary' ? `+${pct?.meso ?? 5}%` : null;
    case 'dropPercent':
      return internalRank === 'legendary' ? `+${pct?.drop ?? 5}%` : null;
    default:
      return null;
  }
}

function parseArmorAccessory201250AddPotentialStat(statName, internalRank, context = {}) {
  if (!isArmorAccessory201250AddPotentialContext(context)) return null;

  const item = context.item;
  const slot = getArmorAcc201250AddPotSlotKind(item);
  const kind = classifyArmorAccessory201250AddPotStat(statName);

  if (kind === 'cooldownReduce') {
    if (slot !== 'hat' || internalRank !== 'legendary') return null;
    return { label: '所有技能冷卻時間 -1秒', value: '' };
  }

  if (kind === 'hpRecovery') {
    const percent = ARMOR_ACC_201250_ADDPOT_HP_RECOVERY[internalRank];
    if (!percent) return null;
    return { label: `HP恢復道具及恢復技能效果增加 ${percent}`, value: '' };
  }

  if (kind === 'levelScale') {
    const perStep = ARMOR_ACC_201250_ADDPOT_LEVEL_SCALE[internalRank];
    if (perStep == null) return null;
    return { label: statName, value: String(perStep) };
  }

  const value = formatArmorAccessory201250AddPotentialStatValue(statName, internalRank, context);
  if (value == null) return null;

  return {
    label: armorAccessory201250AddPotLabelForStat(statName),
    value
  };
}
