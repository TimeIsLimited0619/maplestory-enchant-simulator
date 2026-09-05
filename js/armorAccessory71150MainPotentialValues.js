/**
 * 飾品與防具 1~150 級主潛能詞條數值（所有主潛能方塊共用）
 * 機率沿用 event8421；此檔僅定義洗出後的數值／文案。
 * 數值來源：社群方塊潛能整理表（1~150）、官方 V255（91~150 附加參考）
 */

const ARMOR_ACC_71150_LEVEL_MIN = 1;
const ARMOR_ACC_71150_LEVEL_MAX = 150;

const ARMOR_ACC_71150_UTILITY_LINES = {
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

const ARMOR_ACC_71150_MP_COST_VARIANTS = [17, 35];
const ARMOR_ACC_71150_COOLDOWN_VARIANTS = [2, 1];

function isArmorAccessory71150Item(item) {
  if (!item) return false;
  if (item.mainType !== EQUIP_TYPE.ARMOR && item.mainType !== EQUIP_TYPE.ACCESSORY) return false;
  const level = Number(item.reqLevel) || 0;
  return level >= ARMOR_ACC_71150_LEVEL_MIN && level <= ARMOR_ACC_71150_LEVEL_MAX;
}

function isArmorAccessory71150MainPotentialContext(context = {}) {
  if ((context.eventId || 8421) !== 8421) return false;
  return isArmorAccessory71150Item(context.item);
}

function classifyArmorAccessory71150Stat(statName) {
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
  if (ARMOR_ACC_71150_UTILITY_LINES[statName]) return 'utilitySkill';
  return null;
}

function armorAccessory71150LabelForStat(statName) {
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

function getArmorAccessory71150IgnoreDamagePercent(group, entryIndex) {
  if (!group?.entries) return 20;
  const ignoreIndexes = group.entries
    .map((entry, index) => (entry.stat === '被擊中時有一定機率無視傷害' ? index : -1))
    .filter((index) => index >= 0);
  const variant = ignoreIndexes.indexOf(entryIndex);
  return variant % 2 === 0 ? 20 : 40;
}

function getArmorAccessory71150VariantIndex(group, entryIndex, statName) {
  if (!group?.entries || entryIndex == null) return 0;
  const indexes = group.entries
    .map((entry, index) => (entry.stat === statName ? index : -1))
    .filter((index) => index >= 0);
  const variant = indexes.indexOf(entryIndex);
  return variant >= 0 ? variant : 0;
}

function formatArmorAccessory71150MainPotentialStatValue(statName, internalRank, context = {}) {
  if (!isArmorAccessory71150MainPotentialContext(context)) return null;

  const kind = classifyArmorAccessory71150Stat(statName);
  if (!kind) return null;

  const item = context.item;
  const slot = getArmorAccessorySlotKind(item);
  const reqLevel = item?.reqLevel || 100;
  const pctBand = getLowLevelPercentBand(reqLevel);
  const flatRare = getLowLevelMainFlatRare(reqLevel);

  switch (kind) {
    case 'mainFlat':
      return internalRank === 'rare' ? String(flatRare.main) : null;
    case 'mainPercent':
      return pickLowLevelRankRow(LOW_MAIN_STAT_PERCENT, pctBand, internalRank);
    case 'maxHpMpFlat':
      return internalRank === 'rare' ? String(flatRare.maxHpMp) : null;
    case 'maxHpMpPercent':
      return pickLowLevelRankRow(LOW_MAIN_STAT_PERCENT, pctBand, internalRank);
    case 'defFlat':
      return internalRank === 'rare' ? String(flatRare.def) : null;
    case 'defPercent':
      return internalRank === 'epic' || internalRank === 'rare'
        ? pickLowLevelRankRow(LOW_MAIN_STAT_PERCENT, pctBand, internalRank)
        : null;
    case 'allStatFlat':
      return internalRank === 'rare' ? String(flatRare.allStat) : null;
    case 'allStatPercent':
      return pickLowLevelRankRow(LOW_MAIN_ALLSTAT_PERCENT, pctBand, internalRank);
    case 'critDamage': {
      if (slot !== 'glove' || internalRank !== 'legendary') return null;
      const critByBand = { '1_30': '4%', '31_70': '6%', '71_150': '8%' };
      return critByBand[pctBand] || '8%';
    }
    case 'mesoPercent':
      return slot === 'accessory' && internalRank === 'legendary'
        ? `+${LOW_MAIN_MESO_DROP_PERCENT[pctBand] ?? 20}%`
        : null;
    case 'dropPercent':
      return slot === 'accessory' && internalRank === 'legendary'
        ? `+${LOW_MAIN_MESO_DROP_PERCENT[pctBand] ?? 20}%`
        : null;
    case 'mpCostPercent':
      if (slot !== 'accessory' || internalRank !== 'legendary') return null;
      {
        const variant = getArmorAccessory71150VariantIndex(
          context.group,
          context.entryIndex,
          statName
        );
        const amount = ARMOR_ACC_71150_MP_COST_VARIANTS[variant]
          ?? ARMOR_ACC_71150_MP_COST_VARIANTS[0];
        return `-${amount}%`;
      }
    default:
      return null;
  }
}

function parseArmorAccessory71150MainPotentialStat(statName, internalRank, context = {}) {
  if (!isArmorAccessory71150MainPotentialContext(context)) return null;

  const item = context.item;
  const slot = getArmorAccessorySlotKind(item);
  const kind = classifyArmorAccessory71150Stat(statName);

  if (kind === 'utilitySkill') {
    const line = ARMOR_ACC_71150_UTILITY_LINES[statName];
    if (!line || line.slot !== slot || line.rank !== internalRank) return null;
    return { label: line.label, value: '' };
  }

  if (kind === 'cooldownReduce') {
    if (slot !== 'hat' || internalRank !== 'legendary') return null;
    const variant = getArmorAccessory71150VariantIndex(
      context.group,
      context.entryIndex,
      statName
    );
    const seconds = ARMOR_ACC_71150_COOLDOWN_VARIANTS[variant]
      ?? ARMOR_ACC_71150_COOLDOWN_VARIANTS[0];
    return { label: `所有技能冷卻時間 -${seconds}秒`, value: '' };
  }

  if (kind === 'ignoreDamage') {
    if (internalRank !== 'unique' && internalRank !== 'legendary') return null;
    const damagePercent = getArmorAccessory71150IgnoreDamagePercent(
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

  const value = formatArmorAccessory71150MainPotentialStatValue(statName, internalRank, context);
  if (value == null) return null;

  return {
    label: armorAccessory71150LabelForStat(statName),
    value
  };
}
