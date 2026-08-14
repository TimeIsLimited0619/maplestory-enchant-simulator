/**
 * 飾品與防具 151~250 級主潛能詞條數值（所有主潛能方塊共用）
 * 來源：飾品與防具151-250級_主要潛能屬性與數值表單(主要潛能對照表).csv
 * 機率沿用 event8421；此檔僅定義洗出後的數值／文案。
 */

const ARMOR_ACC_151250_LEVEL_MIN = 151;
const ARMOR_ACC_151250_LEVEL_MAX = 250;

const ARMOR_ACC_151250_PERCENT = {
  rare: {
    stat: '4%',
    maxHpMp: '4%'
  },
  epic: {
    stat: '7%',
    maxHpMp: '7%',
    allStat: '4%',
    def: '7%'
  },
  unique: {
    stat: '10%',
    maxHpMp: '10%',
    allStat: '7%'
  },
  legendary: {
    stat: '13%',
    maxHpMp: '13%',
    allStat: '10%',
    critDamage: '8%',
    meso: 20,
    drop: 20
  }
};

const ARMOR_ACC_151250_FLAT = {
  rare: {
    main: 13,
    maxHpMp: 125,
    def: 125,
    allStat: 6
  }
};

/** 傳說飾品：所有技能的 MP 消耗（依 cube 表 entry 順序 17% / 35%） */
const ARMOR_ACC_151250_MP_COST_VARIANTS = [17, 35];

/** 傳說帽子：所有技能冷卻時間（依 cube 表 entry 順序 -2 / -1） */
const ARMOR_ACC_151250_COOLDOWN_VARIANTS = [2, 1];

const ARMOR_ACC_151250_UTILITY_LINES = {
  '可以使用<實用的時空門> 技能': {
    slot: 'hat',
    rank: 'unique',
    label: '可以使用<實用的時空門>技能'
  },
  '可以使用<實用的進階祝福> 技能': {
    slot: 'hat',
    rank: 'legendary',
    label: '可以使用<實用的進階祝福>技能'
  },
  '可以使用<實用的神聖之火> 技能': {
    slot: 'pants',
    rank: 'unique',
    label: '可以使用<實用的神聖之火>技能'
  },
  '可以使用<實用的速度激發> 技能': {
    slot: 'shoes',
    rank: 'unique',
    label: '可以使用<實用的速度激發>技能'
  },
  '可以使用<實用的戰鬥命令> 技能': {
    slot: 'shoes',
    rank: 'legendary',
    label: '可以使用<實用的戰鬥命令>技能'
  },
  '可以使用<實用的會心之眼> 技能': {
    slot: 'glove',
    rank: 'unique',
    label: '可以使用<實用的會心之眼>技能'
  },
  '可以使用<實用的最終極速> 技能': {
    slot: 'glove',
    rank: 'legendary',
    label: '可以使用<實用的最終極速>技能'
  }
};

function isArmorAccessory151250Item(item) {
  if (!item) return false;
  if (item.mainType !== EQUIP_TYPE.ARMOR && item.mainType !== EQUIP_TYPE.ACCESSORY) return false;
  const level = Number(item.reqLevel) || 0;
  return level >= ARMOR_ACC_151250_LEVEL_MIN && level <= ARMOR_ACC_151250_LEVEL_MAX;
}

function isArmorAccessory151250MainPotentialContext(context = {}) {
  if ((context.eventId || 8421) !== 8421) return false;
  return isArmorAccessory151250Item(context.item);
}

function getArmorAccessorySlotKind(item) {
  if (!item) return null;
  if (typeof isCapeGroupPotentialEquip === 'function' && isCapeGroupPotentialEquip(item)) {
    return 'armorOther';
  }
  if (item.mainType === EQUIP_TYPE.ACCESSORY) return 'accessory';
  switch (item.islot) {
    case 'Cp': return 'hat';
    case 'Ma':
    case 'MaPn': return 'top';
    case 'Pn': return 'pants';
    case 'So': return 'shoes';
    case 'Gv': return 'glove';
    default: return 'armorOther';
  }
}

function classifyArmorAccessory151250Stat(statName) {
  if (statName === 'STR' || statName === 'DEX' || statName === 'INT' || statName === 'LUK') return 'mainFlat';
  if (/^(STR|DEX|INT|LUK)%$/.test(statName)) return 'mainPercent';
  if (statName === '最大HP' || statName === '最大MP') return 'maxHpMpFlat';
  if (statName === '最大HP%' || statName === '最大MP%') return 'maxHpMpPercent';
  if (statName === '防禦力') return 'defFlat';
  if (statName === '防禦力%') return 'defPercent';
  if (statName === '全屬性') return 'allStatFlat';
  if (statName === '全屬性%') return 'allStatPercent';
  if (statName === '爆擊傷害%') return 'critDamage';
  if (statName === '楓幣獲得量%') return 'mesoPercent';
  if (statName === '道具掉落率%') return 'dropPercent';
  if (statName === '所有技能的MP消耗%') return 'mpCostPercent';
  if (statName === '被擊中時有一定機率無視傷害') return 'ignoreDamage';
  if (statName === 'HP恢復道具及恢復技能效果增加') return 'hpRecovery';
  if (statName === '被擊中後無敵時間增加') return 'invincibilityTime';
  if (statName === '被擊中時有一定機率在時間內無敵') return 'timedInvincibility';
  if (statName === '減少所有技能冷卻時間(10秒以下會減少5%，不會減少到未滿5秒)') return 'cooldownReduce';
  if (ARMOR_ACC_151250_UTILITY_LINES[statName]) return 'utilitySkill';
  return null;
}

function armorAccessory151250LabelForStat(statName) {
  if (statName === '最大HP' || statName === '最大HP%') return 'MaxHP';
  if (statName === '最大MP' || statName === '最大MP%') return 'MaxMP';
  if (statName === '防禦力' || statName === '防禦力%') return '防禦力';
  if (statName === '全屬性' || statName === '全屬性%') return '全屬性';
  if (statName === '爆擊傷害%') return '爆擊傷害';
  if (statName === '楓幣獲得量%') return '楓幣獲得量';
  if (statName === '道具掉落率%') return '道具掉落率';
  if (statName === '所有技能的MP消耗%') return '所有技能的MP消耗';
  if (/^(STR|DEX|INT|LUK)%?$/.test(statName)) return statName.replace(/%$/, '');
  return statName;
}

function getArmorAccessory151250IgnoreDamagePercent(group, entryIndex) {
  if (!group?.entries) return 20;
  const ignoreIndexes = group.entries
    .map((entry, index) => (entry.stat === '被擊中時有一定機率無視傷害' ? index : -1))
    .filter((index) => index >= 0);
  const variant = ignoreIndexes.indexOf(entryIndex);
  return variant % 2 === 0 ? 20 : 40;
}

function getArmorAccessory151250VariantIndex(group, entryIndex, statName) {
  if (!group?.entries || entryIndex == null) return 0;
  const indexes = group.entries
    .map((entry, index) => (entry.stat === statName ? index : -1))
    .filter((index) => index >= 0);
  const variant = indexes.indexOf(entryIndex);
  return variant >= 0 ? variant : 0;
}

function formatArmorAccessory151250MainPotentialStatValue(statName, internalRank, context = {}) {
  if (!isArmorAccessory151250MainPotentialContext(context)) return null;

  const kind = classifyArmorAccessory151250Stat(statName);
  if (!kind) return null;

  const item = context.item;
  const slot = getArmorAccessorySlotKind(item);
  const pct = ARMOR_ACC_151250_PERCENT[internalRank];
  const flat = ARMOR_ACC_151250_FLAT[internalRank];

  switch (kind) {
    case 'mainFlat':
      return internalRank === 'rare' && flat?.main != null ? String(flat.main) : null;
    case 'mainPercent':
      return pct?.stat || null;
    case 'maxHpMpFlat':
      return internalRank === 'rare' ? String(ARMOR_ACC_151250_FLAT.rare.maxHpMp) : null;
    case 'maxHpMpPercent':
      return pct?.maxHpMp || null;
    case 'defFlat':
      return internalRank === 'rare' ? String(ARMOR_ACC_151250_FLAT.rare.def) : null;
    case 'defPercent':
      return pct?.def || null;
    case 'allStatFlat':
      return internalRank === 'rare' ? String(ARMOR_ACC_151250_FLAT.rare.allStat) : null;
    case 'allStatPercent':
      return pct?.allStat || null;
    case 'critDamage':
      return slot === 'glove' && internalRank === 'legendary' ? pct?.critDamage || null : null;
    case 'mesoPercent':
      return slot === 'accessory' && internalRank === 'legendary'
        ? `+${pct?.meso ?? 20}%`
        : null;
    case 'dropPercent':
      return slot === 'accessory' && internalRank === 'legendary'
        ? `+${pct?.drop ?? 20}%`
        : null;
    case 'mpCostPercent':
      if (slot !== 'accessory' || internalRank !== 'legendary') return null;
      {
        const variant = getArmorAccessory151250VariantIndex(
          context.group,
          context.entryIndex,
          statName
        );
        const amount = ARMOR_ACC_151250_MP_COST_VARIANTS[variant]
          ?? ARMOR_ACC_151250_MP_COST_VARIANTS[0];
        return `-${amount}%`;
      }
    default:
      return null;
  }
}

function parseArmorAccessory151250MainPotentialStat(statName, internalRank, context = {}) {
  if (!isArmorAccessory151250MainPotentialContext(context)) return null;

  const item = context.item;
  const slot = getArmorAccessorySlotKind(item);
  const kind = classifyArmorAccessory151250Stat(statName);

  if (kind === 'utilitySkill') {
    const line = ARMOR_ACC_151250_UTILITY_LINES[statName];
    if (!line || line.slot !== slot || line.rank !== internalRank) return null;
    return { label: line.label, value: '' };
  }

  if (kind === 'cooldownReduce') {
    if (slot !== 'hat' || internalRank !== 'legendary') return null;
    const variant = getArmorAccessory151250VariantIndex(
      context.group,
      context.entryIndex,
      statName
    );
    const seconds = ARMOR_ACC_151250_COOLDOWN_VARIANTS[variant]
      ?? ARMOR_ACC_151250_COOLDOWN_VARIANTS[0];
    return { label: `所有技能冷卻時間 -${seconds}秒`, value: '' };
  }

  if (kind === 'ignoreDamage') {
    if (internalRank !== 'unique' && internalRank !== 'legendary') return null;
    const damagePercent = getArmorAccessory151250IgnoreDamagePercent(
      context.group,
      context.entryIndex
    );
    return {
      label: `被擊中時有 5% 機率無視 ${damagePercent}% 傷害`,
      value: ''
    };
  }

  if (kind === 'hpRecovery') {
    if (internalRank !== 'unique') return null;
    return { label: 'HP恢復道具及恢復技能效果增加 30%', value: '' };
  }

  if (kind === 'invincibilityTime') {
    if (slot !== 'top') return null;
    const seconds = { epic: 1, unique: 2, legendary: 3 }[internalRank];
    if (seconds == null) return null;
    return { label: `被擊中後無敵時間 +${seconds}秒`, value: '' };
  }

  if (kind === 'timedInvincibility') {
    if (slot !== 'top') return null;
    if (internalRank === 'unique') {
      return { label: '被擊中時有 2% 機率在 7 秒內無敵', value: '' };
    }
    if (internalRank === 'legendary') {
      return { label: '被擊中時有 4% 機率在 7 秒內無敵', value: '' };
    }
    return null;
  }

  const value = formatArmorAccessory151250MainPotentialStatValue(statName, internalRank, context);
  if (value == null) return null;

  return {
    label: armorAccessory151250LabelForStat(statName),
    value
  };
}
