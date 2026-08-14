/**
 * 潛在能力方塊洗潛邏輯（官方機率表 CUBE_RATES_8421）
 */
const POTENTIAL_CUBE_EVENT_ID = 8421;

const OFFICIAL_RANK_ORDER = ['special', 'rare', 'unique', 'legendary'];

const INTERNAL_TO_OFFICIAL_RANK = {
  rare: 'special',
  epic: 'rare',
  unique: 'unique',
  legendary: 'legendary'
};

const OFFICIAL_TO_INTERNAL_RANK = {
  special: 'rare',
  rare: 'epic',
  unique: 'unique',
  legendary: 'legendary'
};

/** 閃耀鏡射：第二排 20% 複製第一排 */
const SHINING_MIRROR_LINE2_COPY_RATE = 0.2;

/** 新對等：第二、三排永遠與整體同階 */
const EQUAL_LINE_RULES_HIGH = {
  line1: { same: 1, lower: 0 },
  line2Unique: { same: 1, lower: 0 },
  line3Unique: { same: 1, lower: 0 },
  line2Legendary: { same: 1, lower: 0 },
  line3Legendary: { same: 1, lower: 0 }
};

/** 罕見／傳說等級套用規則（解析器未拆表的補充） */
const SHINING_MIRROR_LINE_RULES_HIGH = {
  line1: { same: 1, lower: 0 },
  line2Unique: { same: 0.2, lower: 0.8 },
  line3Unique: { same: 0.1, lower: 0.9 },
  line2Legendary: { same: 0.2, lower: 0.8 },
  line3Legendary: { same: 0.05, lower: 0.95 }
};

const POTENTIAL_STAT_VALUE_TEMPLATES = {
  rare: { percent: '3%', flat: 9 },
  unique: { percent: '9%', flat: 9 },
  epic: { percent: '6%', flat: 12 },
  legendary: { percent: '12%', flat: 13 }
};

const HP_RECOVERY_PERCENT_BY_RANK = {
  rare: 10,
  epic: 20,
  unique: 30,
  legendary: 40
};

const IGNORE_DAMAGE_CHANCE_BY_RANK = {
  epic: '5%',
  unique: '5%',
  legendary: '10%'
};

function getStatEntryKey(group, entryIndex) {
  const entry = group.entries[entryIndex];
  return `${entry.stat}@${entryIndex}`;
}

function getIgnoreDamagePercent(group, entryIndex) {
  const ignoreIndexes = group.entries
    .map((entry, index) => (entry.stat === '被擊中時有一定機率無視傷害' ? index : -1))
    .filter((index) => index >= 0);
  const variant = ignoreIndexes.indexOf(entryIndex);
  return variant % 2 === 0 ? 20 : 40;
}

function formatIgnoreDamageLine(internalRank, damagePercent) {
  const chance = IGNORE_DAMAGE_CHANCE_BY_RANK[internalRank] || '5%';
  return `被擊中時有 ${chance} 機率無視 ${damagePercent}%傷害`;
}

function formatHpRecoveryLine(internalRank) {
  const percent = HP_RECOVERY_PERCENT_BY_RANK[internalRank] || 10;
  return `HP恢復道具及恢復技能效果增加 ${percent}%`;
}

function getPotentialCubeRates(cubeRateKey, eventId = POTENTIAL_CUBE_EVENT_ID) {
  const event = typeof getCubeRateEvent === 'function'
    ? getCubeRateEvent(eventId)
    : (eventId === 8421 && typeof CUBE_RATES_8421 !== 'undefined' ? CUBE_RATES_8421 : null);
  if (!event) return null;

  return {
    rankUp: event.rankUp?.[cubeRateKey] || null,
    lineRules: event.lineRules?.[cubeRateKey]?.lines || null,
    lineRulesHigh: cubeRateKey === 'shiningMirror'
      ? SHINING_MIRROR_LINE_RULES_HIGH
      : cubeRateKey === 'equal'
        ? EQUAL_LINE_RULES_HIGH
        : event.lineRules?.[cubeRateKey]?.linesUniqueLegendary || null,
    statRates: event.statRates || null,
    mirrorCopyRate: cubeRateKey === 'shiningMirror' ? SHINING_MIRROR_LINE2_COPY_RATE : 0
  };
}

function getEquipPotentialCategoryMinor(item) {
  if (!item) {
    return '帽子,上衣,套服,下衣,手套,披風,腰帶,肩膀,機器心臟,胸章';
  }

  if (typeof isEnergyBadgeItem === 'function'
    ? isEnergyBadgeItem(item)
    : item.mainType === EQUIP_TYPE.Emblem) {
    return '徽章';
  }

  if (typeof isWeaponPotentialEquip === 'function'
    ? isWeaponPotentialEquip(item)
    : item.mainType === EQUIP_TYPE.WEAPON) {
    return '武器, 徽章, 輔助武器(力量之盾, 靈魂戒指除外)';
  }

  if (typeof isCapeGroupPotentialEquip === 'function' && isCapeGroupPotentialEquip(item)) {
    return '披風,腰帶,肩膀,機器心臟,胸章';
  }

  if (item.mainType === EQUIP_TYPE.ACCESSORY) {
    return '墜飾,戒指,臉部裝飾,眼睛裝飾,耳環';
  }

  switch (item.islot) {
    case 'Cp': return '帽子';
    case 'Ma':
    case 'MaPn': return '上衣,套服';
    case 'Pn': return '下衣';
    case 'Gv': return '手套';
    case 'So': return '鞋子';
    case 'Sr':
    case 'Be':
    case 'Sh':
      return '披風,腰帶,肩膀,機器心臟,胸章';
    default:
      break;
  }

  switch (item.subType) {
    case 'cap': return '帽子';
    case 'coat':
    case 'longcoat': return '上衣,套服';
    case 'pants': return '下衣';
    case 'gloves': return '手套';
    case 'shoes': return '鞋子';
    case 'cape':
    case 'belt':
    case 'shoulder':
      return '披風,腰帶,肩膀,機器心臟,胸章';
    default:
      return '帽子,上衣,套服,下衣,手套,披風,腰帶,肩膀,機器心臟,胸章';
  }
}

function getEquipPotentialCategory(item) {
  if (!item) {
    return { major: '防具', minor: '帽子,上衣,套服,下衣,手套,披風,腰帶,肩膀,機器心臟,胸章' };
  }

  if (typeof isEnergyBadgeItem === 'function'
    ? isEnergyBadgeItem(item)
    : item.mainType === EQUIP_TYPE.Emblem) {
    return { major: '能源/徽章', minor: getEquipPotentialCategoryMinor(item) };
  }

  if (typeof isWeaponPotentialEquip === 'function'
    ? isWeaponPotentialEquip(item)
    : item.mainType === EQUIP_TYPE.WEAPON) {
    return { major: '武器', minor: getEquipPotentialCategoryMinor(item) };
  }

  if (typeof isCapeGroupPotentialEquip === 'function' && isCapeGroupPotentialEquip(item)) {
    return { major: '防具', minor: '披風,腰帶,肩膀,機器心臟,胸章' };
  }

  if (item.mainType === EQUIP_TYPE.ACCESSORY) {
    return { major: '飾品', minor: getEquipPotentialCategoryMinor(item) };
  }

  return { major: '防具', minor: getEquipPotentialCategoryMinor(item) };
}

function normalizeCategoryToken(text) {
  return String(text || '').replace(/\s/g, '').replace(/裝飾/g, '');
}

function splitCategoryMinor(minor) {
  return String(minor || '')
    .split(/[,，]/)
    .map(normalizeCategoryToken)
    .filter(Boolean);
}

function minorsOverlap(groupMinor, categoryMinor) {
  const groupTokens = splitCategoryMinor(groupMinor);
  const categoryTokens = splitCategoryMinor(categoryMinor);
  if (!groupTokens.length || !categoryTokens.length) return false;

  return categoryTokens.some((categoryToken) =>
    groupTokens.some((groupToken) =>
      groupToken === categoryToken
      || groupToken.includes(categoryToken)
      || categoryToken.includes(groupToken)
    )
  );
}

function majorsCompatible(groupMajor, categoryMajor) {
  const group = normalizeCategoryToken(groupMajor);
  const category = normalizeCategoryToken(categoryMajor);
  if (!group || !category) return false;
  if (group === category) return true;

  const groupRoot = group.split('、')[0];
  const categoryRoot = category.split('、')[0];
  return group.startsWith(category) || category.startsWith(groupRoot) || groupRoot === categoryRoot;
}

function isRegularWeaponItem(item) {
  const isWeaponLike = typeof isWeaponPotentialEquip === 'function'
    ? isWeaponPotentialEquip(item)
    : item?.mainType === EQUIP_TYPE.WEAPON;
  return isWeaponLike
    && item?.islot !== 'Ba'
    && item?.subType !== 'badge'
    && item?.subType !== 'emblem';
}

function pickWeaponStatRateGroup(candidates, category) {
  const weaponGroups = candidates.filter((group) => {
    const tokens = splitCategoryMinor(group.minor);
    return tokens.includes('武器');
  });
  if (!weaponGroups.length) return null;

  weaponGroups.sort((a, b) => splitCategoryMinor(b.minor).length - splitCategoryMinor(a.minor).length);
  const byMajor = weaponGroups.filter((group) => majorsCompatible(group.major, category.major));
  return (byMajor.length ? byMajor : weaponGroups)[0];
}

function findStatRateGroup(statRates, officialRank, category, item = null, context = {}) {
  if (typeof isEnergyBadgeItem === 'function' && isEnergyBadgeItem(item)
    && typeof getEnergyPotentialStatRateGroup === 'function') {
    return getEnergyPotentialStatRateGroup(officialRank, context);
  }

  if (!statRates?.[officialRank]) return null;

  const groups = statRates[officialRank];
  const exactKey = `${category.major}::${category.minor}`;
  if (groups[exactKey]) return groups[exactKey];

  const allGroups = Object.values(groups);
  const byMinor = allGroups.filter((group) => minorsOverlap(group.minor, category.minor));
  if (byMinor.length === 1) {
    if (isRegularWeaponItem(item) && normalizeCategoryToken(byMinor[0].minor) === '徽章') {
      const weaponGroup = pickWeaponStatRateGroup(allGroups, category);
      if (weaponGroup) return weaponGroup;
    }
    return byMinor[0];
  }
  if (byMinor.length > 1) {
    const exactMinor = byMinor.find(
      (group) => normalizeCategoryToken(group.minor) === normalizeCategoryToken(category.minor)
    );
    if (exactMinor) return exactMinor;

    if (isRegularWeaponItem(item)) {
      const weaponGroup = pickWeaponStatRateGroup(byMinor, category);
      if (weaponGroup) return weaponGroup;
    }

    const byMajor = byMinor.filter((group) => majorsCompatible(group.major, category.major));
    const pool = byMajor.length ? byMajor : byMinor;
    pool.sort((a, b) => splitCategoryMinor(b.minor).length - splitCategoryMinor(a.minor).length);
    return pool[0];
  }

  const sameMajor = allGroups.filter((group) => majorsCompatible(group.major, category.major));
  if (sameMajor.length === 1) return sameMajor[0];

  const categoryTokens = splitCategoryMinor(category.minor);
  if (categoryTokens.length === 1) {
    const slotMatch = sameMajor.find((group) => group.minor.includes(categoryTokens[0]));
    if (slotMatch) return slotMatch;
  }

  if (category.minor.includes('鞋')) {
    return sameMajor.find((group) => group.minor.includes('鞋')) || sameMajor[0] || null;
  }

  return sameMajor[0] || null;
}

function rollWeightedMap(weightMap) {
  const entries = Object.entries(weightMap).filter(([, w]) => w != null && w > 0);
  if (!entries.length) return null;

  const total = entries.reduce((sum, [, w]) => sum + w, 0);
  let roll = Math.random() * total;

  for (const [key, weight] of entries) {
    roll -= weight;
    if (roll <= 0) return key;
  }

  return entries[entries.length - 1][0];
}

function maxOfficialRank(a, b) {
  const ia = OFFICIAL_RANK_ORDER.indexOf(a);
  const ib = OFFICIAL_RANK_ORDER.indexOf(b);
  if (ia < 0) return b;
  if (ib < 0) return a;
  return ia >= ib ? a : b;
}

function rollSameOrLower(sameRate, lowerRate) {
  return Math.random() < (sameRate ?? 0) ? 'same' : 'lower';
}

function lowerOfficialRank(rank) {
  const index = OFFICIAL_RANK_ORDER.indexOf(rank);
  if (index <= 0) return OFFICIAL_RANK_ORDER[0];
  return OFFICIAL_RANK_ORDER[index - 1];
}

function rollOfficialRankUp(cubeRates, currentInternalRank) {
  const currentOfficial = INTERNAL_TO_OFFICIAL_RANK[currentInternalRank] || 'special';
  const fromKey = `from${capitalize(currentOfficial)}`;
  const table = cubeRates.rankUp?.rates?.[fromKey];
  if (!table) return currentOfficial;

  const rolled = rollWeightedMap(table) || currentOfficial;
  if (typeof POTENTIAL_PREVENT_RANK_DROP !== 'undefined' && POTENTIAL_PREVENT_RANK_DROP) {
    return maxOfficialRank(rolled, currentOfficial);
  }
  return rolled;
}

/** 官方表判定升階成功後，內部階級最多只升一階（rare→epic→unique→legendary） */
function rollInternalRankUp(cubeRates, currentInternalRank) {
  const currentOfficial = INTERNAL_TO_OFFICIAL_RANK[currentInternalRank] || 'special';
  const rolledOfficial = rollOfficialRankUp(cubeRates, currentInternalRank);
  const rolledUp = OFFICIAL_RANK_ORDER.indexOf(rolledOfficial) > OFFICIAL_RANK_ORDER.indexOf(currentOfficial);

  if (!rolledUp) return currentInternalRank;

  const nextRank = oneTierAboveInternalRank(currentInternalRank);
  if (typeof POTENTIAL_PREVENT_RANK_DROP !== 'undefined' && POTENTIAL_PREVENT_RANK_DROP) {
    return maxInternalRank(nextRank, currentInternalRank);
  }
  return nextRank;
}

function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function getLineRule(cubeRates, headerOfficialRank, lineIndex) {
  const isHighTier = headerOfficialRank === 'unique' || headerOfficialRank === 'legendary';
  const rules = isHighTier ? cubeRates.lineRulesHigh : cubeRates.lineRules;
  if (!rules) return { same: 1, lower: 0 };

  if (lineIndex === 0) return rules.line1 || { same: 1, lower: 0 };

  if (isHighTier) {
    if (lineIndex === 1) {
      return headerOfficialRank === 'legendary'
        ? rules.line2Legendary
        : rules.line2Unique;
    }
    return headerOfficialRank === 'legendary'
      ? rules.line3Legendary
      : rules.line3Unique;
  }

  if (headerOfficialRank === 'special') {
    return lineIndex === 1 ? rules.line2Special : rules.line3Special;
  }

  return lineIndex === 1 ? rules.line2Rare : rules.line3Rare;
}

function resolveLineOfficialRank(headerOfficialRank, lineIndex, cubeRates) {
  const rule = getLineRule(cubeRates, headerOfficialRank, lineIndex);
  const outcome = rollSameOrLower(rule.same, rule.lower);
  return outcome === 'same' ? headerOfficialRank : lowerOfficialRank(headerOfficialRank);
}

function formatPotentialStatValue(statName, internalRank, context = {}) {
  if (typeof formatPotentialStatValueForContext === 'function') {
    const contextual = formatPotentialStatValueForContext(statName, internalRank, context);
    if (contextual != null) return contextual;
  }

  if (typeof isEnergyBadgeItem === 'function'
    && isEnergyBadgeItem(context.item)
    && typeof formatEnergyPotentialStatValue === 'function') {
    const energyVal = formatEnergyPotentialStatValue(statName);
    if (energyVal != null) return energyVal;
  }

  if (typeof formatArmorAccessory151250MainPotentialStatValue === 'function'
    && typeof isArmorAccessory151250MainPotentialContext === 'function'
    && isArmorAccessory151250MainPotentialContext(context)) {
    const armorAccVal = formatArmorAccessory151250MainPotentialStatValue(statName, internalRank, context);
    if (armorAccVal != null) return armorAccVal;
  }

  if (typeof formatArmorAccessory201250AddPotentialStatValue === 'function'
    && typeof isArmorAccessory201250AddPotentialContext === 'function'
    && isArmorAccessory201250AddPotentialContext(context)) {
    const armorAcc201250Val = formatArmorAccessory201250AddPotentialStatValue(statName, internalRank, context);
    if (armorAcc201250Val != null) return armorAcc201250Val;
  }

  if (typeof formatArmorAccessory151200AddPotentialStatValue === 'function'
    && typeof isArmorAccessory151200AddPotentialContext === 'function'
    && isArmorAccessory151200AddPotentialContext(context)) {
    const armorAccAddVal = formatArmorAccessory151200AddPotentialStatValue(statName, internalRank, context);
    if (armorAccAddVal != null) return armorAccAddVal;
  }

  if (typeof formatNormalWeapon151200MainPotentialStatValue === 'function'
    && typeof isNormalWeapon151200MainPotentialContext === 'function'
    && isNormalWeapon151200MainPotentialContext(context)) {
    const normal151200Val = formatNormalWeapon151200MainPotentialStatValue(statName, internalRank, context);
    if (normal151200Val != null) return normal151200Val;
  }

  if (typeof formatDestinyWeaponPotentialStatValue === 'function'
    && typeof isDestinyWeaponMainPotentialContext === 'function'
    && isDestinyWeaponMainPotentialContext(context)) {
    const destinyVal = formatDestinyWeaponPotentialStatValue(statName, internalRank, context);
    if (destinyVal != null) return destinyVal;
  }

  if (typeof formatNormalWeapon151200AddPotentialStatValue === 'function'
    && typeof isNormalWeapon151200AddPotentialContext === 'function'
    && isNormalWeapon151200AddPotentialContext(context)) {
    const normal151200AddVal = formatNormalWeapon151200AddPotentialStatValue(statName, internalRank, context);
    if (normal151200AddVal != null) return normal151200AddVal;
  }

  if (typeof formatDestinyWeaponAddPotentialStatValue === 'function'
    && typeof isDestinyWeaponAddPotentialContext === 'function'
    && isDestinyWeaponAddPotentialContext(context)) {
    const addPotVal = formatDestinyWeaponAddPotentialStatValue(statName, internalRank, context);
    if (addPotVal != null) return addPotVal;
  }

  const template = POTENTIAL_STAT_VALUE_TEMPLATES[internalRank] || POTENTIAL_STAT_VALUE_TEMPLATES.rare;
  if (statName.includes('技能') || statName.includes('實用')) {
    if (statName !== '所有技能的MP消耗%') return '';
  }
  if (/\+\d+%$/.test(statName)) return '';
  if (statName.includes('%') || statName === '總傷害' || /攻擊力%|傷害%|機率%|獲得量%|掉落率%|消耗%|防禦力%/.test(statName)) {
    return template.percent;
  }
  return String(template.flat);
}

function parsePotentialStat(statName, internalRank, context = {}) {
  if (!statName) {
    return { label: 'STR', value: formatPotentialStatValue('STR', internalRank, context) };
  }

  if (typeof isEnergyBadgeItem === 'function'
    && isEnergyBadgeItem(context.item)
    && typeof parseEnergyPotentialStat === 'function') {
    const energyStat = parseEnergyPotentialStat(statName);
    if (energyStat) return energyStat;
  }

  if (context.eventId === 8422 && typeof parseArmorAccessory201250AddPotentialStat === 'function') {
    const armorAcc201250AddPot = parseArmorAccessory201250AddPotentialStat(statName, internalRank, context);
    if (armorAcc201250AddPot) return armorAcc201250AddPot;
  }

  if (context.eventId === 8422 && typeof parseArmorAccessory151200AddPotentialStat === 'function') {
    const armorAccAddPot = parseArmorAccessory151200AddPotentialStat(statName, internalRank, context);
    if (armorAccAddPot) return armorAccAddPot;
  }

  if (context.eventId === 8422 && typeof parseNormalWeapon151200AddPotentialStat === 'function') {
    const normal151200AddPot = parseNormalWeapon151200AddPotentialStat(statName, internalRank, context);
    if (normal151200AddPot) return normal151200AddPot;
  }

  if (context.eventId === 8422 && typeof parseDestinyWeaponAddPotentialStat === 'function') {
    const destinyAddPot = parseDestinyWeaponAddPotentialStat(statName, internalRank, context);
    if (destinyAddPot) return destinyAddPot;
  }

  if (typeof parseArmorAccessory151250MainPotentialStat === 'function') {
    const armorAccStat = parseArmorAccessory151250MainPotentialStat(statName, internalRank, context);
    if (armorAccStat) return armorAccStat;
  }

  // 官方詞條本身已含固定數值（例：無視怪物防禦力+35%）
  if (/\+\d+%?$/.test(statName)) {
    const weaponEmbedded = typeof parseEmbeddedPercentStat === 'function'
      ? parseEmbeddedPercentStat(statName, internalRank, context)
      : null;
    if (weaponEmbedded) return weaponEmbedded;
    if (/\+\d+%$/.test(statName)) {
      return { label: statName, value: '' };
    }
  }

  if (typeof parseWeaponPotentialStat === 'function') {
    const weaponStat = parseWeaponPotentialStat(statName, internalRank, context);
    if (weaponStat) return weaponStat;
  }

  if (statName === '被擊中時有一定機率無視傷害') {
    if (typeof isArmorAccessory151250MainPotentialContext === 'function'
      && isArmorAccessory151250MainPotentialContext(context)) {
      return null;
    }
    const damagePercent = context.group && context.entryIndex != null
      ? getIgnoreDamagePercent(context.group, context.entryIndex)
      : (Math.random() < 0.5 ? 20 : 40);
    return {
      label: formatIgnoreDamageLine(internalRank, damagePercent),
      value: ''
    };
  }

  if (statName === 'HP恢復道具及恢復技能效果增加') {
    if (typeof isArmorAccessory151250MainPotentialContext === 'function'
      && isArmorAccessory151250MainPotentialContext(context)) {
      return null;
    }
    if (typeof isArmorAccessory151200AddPotentialContext === 'function'
      && isArmorAccessory151200AddPotentialContext(context)) {
      return null;
    }
    if (typeof isArmorAccessory201250AddPotentialContext === 'function'
      && isArmorAccessory201250AddPotentialContext(context)) {
      return null;
    }
    return {
      label: formatHpRecoveryLine(internalRank),
      value: ''
    };
  }

  if (typeof parseAddPotLevelScaleStat === 'function') {
    const skipLevelScale = (typeof isArmorAccessory151200AddPotentialContext === 'function'
      && isArmorAccessory151200AddPotentialContext(context))
      || (typeof isArmorAccessory201250AddPotentialContext === 'function'
      && isArmorAccessory201250AddPotentialContext(context));
    if (!skipLevelScale) {
      const levelScale = parseAddPotLevelScaleStat(statName, internalRank);
      if (levelScale) return levelScale;
    }
  }

  if ((statName.includes('技能') || statName.includes('實用')) && statName !== '所有技能的MP消耗%') {
    return { label: statName, value: '' };
  }

  const label = normalizeStatLabel(statName);
  return {
    label,
    value: formatPotentialStatValue(statName, internalRank, context)
  };
}

function normalizeStatLabel(statName) {
  let label = statName
    .replace('最大HP', 'MaxHP')
    .replace('最大MP', 'MaxMP')
    .replace(/%$/, '');
  if (label === '攻擊力') {
    label = '物理攻擊力';
  }
  return label;
}

function rollStatEntry(group, cubeRateKey, _usedStats) {
  if (!group?.entries?.length) return null;

  // 允許同條詞重複出現（不再以 usedStats 去重）
  const source = group.entries
    .map((entry, index) => ({ entry, index }))
    .filter(({ entry }) => {
      const weight = entry.rates?.[cubeRateKey];
      return weight != null && weight > 0;
    });

  if (!source.length) return null;

  const weights = {};
  source.forEach(({ entry, index }) => {
    weights[String(index)] = entry.rates[cubeRateKey];
  });

  const rolledIndex = Number(rollWeightedMap(weights));
  return source.find(({ index }) => index === rolledIndex) || null;
}

function buildPotentialLine(item, lineOfficialRank, cubeRateKey, cubeRates, usedStats, headerInternalRank, lineIndex, eventId = POTENTIAL_CUBE_EVENT_ID) {
  let internalRank = OFFICIAL_TO_INTERNAL_RANK[lineOfficialRank] || 'rare';

  if (typeof POTENTIAL_PREVENT_RANK_DROP !== 'undefined' && POTENTIAL_PREVENT_RANK_DROP) {
    internalRank = lineIndex === 0 && cubeRateKey !== 'union' && cubeRateKey !== 'unionAdd'
      ? headerInternalRank
      : clampLineRankToOverallWindow(internalRank, headerInternalRank);
  }

  const statOfficialRank = INTERNAL_TO_OFFICIAL_RANK[internalRank] || lineOfficialRank;
  const category = getEquipPotentialCategory(item);
  const potContext = { eventId, rateKey: cubeRateKey };
  const group = findStatRateGroup(cubeRates.statRates, statOfficialRank, category, item, potContext);
  const rolled = rollStatEntry(group, cubeRateKey, usedStats);
  const entry = rolled?.entry || null;
  const entryIndex = rolled?.index;
  const parsed = parsePotentialStat(entry?.stat || 'STR', internalRank, { group, entryIndex, item, eventId, rateKey: cubeRateKey });

  return {
    rank: internalRank,
    statRaw: entry?.stat || null,
    label: parsed.label,
    value: parsed.value
  };
}

function rollPotentialLines(item, headerOfficialRank, cube, currentPotential, headerInternalRankOverride, eventId = POTENTIAL_CUBE_EVENT_ID) {
  const cubeRates = getPotentialCubeRates(cube.rateKey, eventId);
  if (!cubeRates) return null;

  const currentRank = currentPotential?.rank || 'rare';
  const headerInternalRank = headerInternalRankOverride ?? maxInternalRank(
    OFFICIAL_TO_INTERNAL_RANK[headerOfficialRank] || 'rare',
    currentRank
  );
  const usedStats = new Set();
  const lines = [];

  for (let i = 0; i < 3; i++) {
    const lineOfficialRank = i === 0
      ? headerOfficialRank
      : resolveLineOfficialRank(headerOfficialRank, i, cubeRates);

    lines.push(buildPotentialLine(
      item,
      lineOfficialRank,
      cube.rateKey,
      cubeRates,
      usedStats,
      headerInternalRank,
      i,
      eventId
    ));
  }

  if (cubeRates.mirrorCopyRate > 0 && Math.random() < cubeRates.mirrorCopyRate) {
    lines[1] = { ...lines[0] };
    lines._mirrorCopied = true;
  }

  return lines;
}

function rollPotentialRankFromLines(lines) {
  const rankIndexes = lines
    .map((line) => POTENTIAL_RANK_ORDER.indexOf(line.rank))
    .filter((index) => index >= 0);

  if (!rankIndexes.length) return 'rare';
  return POTENTIAL_RANK_ORDER[Math.max(...rankIndexes)];
}

function rerollPotentialWithCube(cube, item, currentPotential, eventId = POTENTIAL_CUBE_EVENT_ID) {
  const cubeRates = getPotentialCubeRates(cube.rateKey, eventId);
  if (!cubeRates?.rankUp) {
    const baseRank = currentPotential?.rank || 'rare';
    const headerRank = baseRank;
    const lines = [rollPotentialLine({ maxResultRank: 'legendary' }, headerRank)];

    for (let i = 1; i < 3; i++) {
      let lineRank = rollPotentialLineRank({ maxResultRank: 'legendary', rankUpChance: 0 }, headerRank);
      if (typeof POTENTIAL_PREVENT_RANK_DROP !== 'undefined' && POTENTIAL_PREVENT_RANK_DROP) {
        lineRank = clampLineRankToOverallWindow(lineRank, headerRank);
      }
      lines.push(rollPotentialLine({ maxResultRank: 'legendary' }, lineRank));
    }

    return {
      rank: rollPotentialRank(lines),
      lines,
      atkPow: currentPotential?.atkPow || 300000000,
      mirrorCopied: false
    };
  }

  const currentRank = currentPotential?.rank || 'rare';
  const headerInternalRank = rollInternalRankUp(cubeRates, currentRank);
  const headerOfficialRank = INTERNAL_TO_OFFICIAL_RANK[headerInternalRank] || 'special';
  const lines = rollPotentialLines(item, headerOfficialRank, cube, currentPotential, headerInternalRank, eventId);
  const mirrorCopied = Boolean(lines._mirrorCopied);
  delete lines._mirrorCopied;

  const rank = rollPotentialRankFromLines(lines);
  const atkPow = typeof rollNextPotentialAtkPow === 'function'
    ? rollNextPotentialAtkPow(currentPotential)
    : Math.max(0, (currentPotential?.atkPow || 300000000));

  return { rank, lines, atkPow, mirrorCopied };
}

function rollDazzlingHexaChoices(item, currentPotential, rateKey = 'dazzling', eventId = POTENTIAL_CUBE_EVENT_ID) {
  const cubeRates = getPotentialCubeRates(rateKey, eventId);
  if (!cubeRates?.rankUp) return null;

  const event = typeof getCubeRateEvent === 'function'
    ? getCubeRateEvent(eventId)
    : null;
  const fallbackEvent = eventId === ADDPOT_CUBE_EVENT_ID && typeof getCubeRateEvent === 'function'
    ? getCubeRateEvent(POTENTIAL_CUBE_EVENT_ID)
    : null;
  const slotRules = event?.specialLineRules?.[rateKey]
    || fallbackEvent?.specialLineRules?.dazzling
    || [];

  const currentRank = currentPotential?.rank || 'rare';
  const headerInternalRank = rollInternalRankUp(cubeRates, currentRank);
  const headerOfficialRank = INTERNAL_TO_OFFICIAL_RANK[headerInternalRank] || 'special';

  const options = [];
  for (let i = 0; i < 6; i++) {
    const rule = slotRules[i] || { same: 1, lower: 0 };
    const outcome = rollSameOrLower(rule.same, rule.lower);
    const lineOfficialRank = outcome === 'same' ? headerOfficialRank : lowerOfficialRank(headerOfficialRank);

    let internalRank = OFFICIAL_TO_INTERNAL_RANK[lineOfficialRank] || 'rare';
    if (typeof POTENTIAL_PREVENT_RANK_DROP !== 'undefined' && POTENTIAL_PREVENT_RANK_DROP) {
      internalRank = clampLineRankToOverallWindow(internalRank, headerInternalRank);
    }

    const statOfficialRank = INTERNAL_TO_OFFICIAL_RANK[internalRank] || lineOfficialRank;
    const category = getEquipPotentialCategory(item);
    const potContext = { eventId, rateKey };
    const group = findStatRateGroup(cubeRates.statRates, statOfficialRank, category, item, potContext);
    const rolled = rollStatEntry(group, rateKey, new Set());
    const entry = rolled?.entry || null;
    const entryIndex = rolled?.index;
    const parsed = parsePotentialStat(entry?.stat || 'STR', internalRank, { group, entryIndex, item, eventId, rateKey });

    options.push({
      rank: internalRank,
      label: parsed.label,
      value: parsed.value
    });
  }

  const previewAtkPow = typeof rollNextPotentialAtkPow === 'function'
    ? rollNextPotentialAtkPow(currentPotential)
    : Math.max(0, currentPotential?.atkPow || 300000000);

  return {
    headerRank: headerInternalRank,
    options,
    previewAtkPow
  };
}

function buildPotentialFromHexaSelection(session, selectedIndexes) {
  const lines = selectedIndexes.map((index) => ({ ...session.options[index] }));
  const fromLines = rollPotentialRankFromLines(lines);
  const headerRank = session.headerRank || fromLines;
  return {
    rank: maxInternalRank(headerRank, fromLines),
    lines,
    atkPow: session.previewAtkPow
  };
}

/** 結合方塊：隨機選一排（各 1/3） */
function pickRandomUnionLineIndex() {
  return Math.floor(Math.random() * 3);
}

/** 結合方塊：重骰指定排（不降階、不升階） */
function rollUnionLine(item, currentPotential, lineIndex, rateKey = 'union', eventId = POTENTIAL_CUBE_EVENT_ID) {
  const cubeRates = getPotentialCubeRates(rateKey, eventId);
  if (!cubeRates) return null;

  const event = typeof getCubeRateEvent === 'function'
    ? getCubeRateEvent(eventId)
    : null;
  const fallbackEvent = eventId === ADDPOT_CUBE_EVENT_ID && typeof getCubeRateEvent === 'function'
    ? getCubeRateEvent(POTENTIAL_CUBE_EVENT_ID)
    : null;
  const slotRules = event?.specialLineRules?.[rateKey]
    || fallbackEvent?.specialLineRules?.union
    || [];
  const line2Rule = slotRules[1] || { same: 0.15, lower: 0.85 };
  const rule = lineIndex === 0 ? line2Rule : (slotRules[lineIndex] || line2Rule);

  const headerInternalRank = currentPotential?.rank || 'rare';
  const headerOfficialRank = INTERNAL_TO_OFFICIAL_RANK[headerInternalRank] || 'special';
  const outcome = rollSameOrLower(rule.same, rule.lower);
  const lineOfficialRank = outcome === 'same'
    ? headerOfficialRank
    : lowerOfficialRank(headerOfficialRank);

  const usedStats = new Set();
  // 結合方塊亦允許與其他排相同詞條

  return buildPotentialLine(
    item,
    lineOfficialRank,
    rateKey,
    cubeRates,
    usedStats,
    headerInternalRank,
    lineIndex,
    eventId
  );
}

/** 結合方塊：同步整體階級（第一排可低一階；二三排全低也不降階） */
function syncUnionCubeOverallRank(potential, lineIndex, rankBeforeRoll) {
  if (!potential?.lines?.length) return rankBeforeRoll || potential?.rank || 'rare';

  const floorRank = rankBeforeRoll || potential.rank || 'rare';
  const fromRest = potential.lines.length > 1
    ? rollPotentialRankFromLines(potential.lines.slice(1))
    : floorRank;

  potential.rank = maxInternalRank(floorRank, fromRest);
  return potential.rank;
}

function rollUnionPreviewAtkPow(currentPotential) {
  return typeof rollNextPotentialAtkPow === 'function'
    ? rollNextPotentialAtkPow(currentPotential)
    : Math.max(0, currentPotential?.atkPow || 300000000);
}

/** ── 附加潛能（event 8422）── */
const ADDPOT_CUBE_EVENT_ID = 8422;

/** 絕對附加：1、2 排必定傳說，第 3 排必定罕見（洗罕見詞條池） */
const ABSOLUTE_ADD_LINE_OFFICIAL_RANKS = ['legendary', 'legendary', 'unique'];

function rerollAbsoluteAddPotWithCube(cube, item, currentPotential) {
  const cubeRates = getPotentialCubeRates('absoluteAdd', ADDPOT_CUBE_EVENT_ID);
  if (!cubeRates) return null;

  const headerInternalRank = 'legendary';
  const usedStats = new Set();
  const lines = [];

  for (let i = 0; i < 3; i++) {
    lines.push(buildPotentialLine(
      item,
      ABSOLUTE_ADD_LINE_OFFICIAL_RANKS[i],
      'absoluteAdd',
      cubeRates,
      usedStats,
      headerInternalRank,
      i,
      ADDPOT_CUBE_EVENT_ID
    ));
  }

  const rank = rollPotentialRankFromLines(lines);
  const atkPow = typeof rollNextPotentialAtkPow === 'function'
    ? rollNextPotentialAtkPow(currentPotential)
    : Math.max(0, currentPotential?.atkPow || 300000000);

  return { rank, lines, atkPow, mirrorCopied: false };
}

function rerollAddPotWithCube(cube, item, currentPotential) {
  if (cube.rateKey === 'absoluteAdd') {
    return rerollAbsoluteAddPotWithCube(cube, item, currentPotential);
  }
  return rerollPotentialWithCube(cube, item, currentPotential, ADDPOT_CUBE_EVENT_ID);
}

function rollBrightAddHexaChoices(item, currentPotential, rateKey = 'restoreAdd') {
  return rollDazzlingHexaChoices(item, currentPotential, rateKey, ADDPOT_CUBE_EVENT_ID);
}

function rollUnionAddLine(item, currentPotential, lineIndex) {
  return rollUnionLine(item, currentPotential, lineIndex, 'unionAdd', ADDPOT_CUBE_EVENT_ID);
}
