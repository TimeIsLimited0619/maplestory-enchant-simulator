/**
 * 武器潛能／附加潛能詞條數值（200 等基準）
 * 平衡調整：依官方公告 old→new 精確對應，非全面 +1
 */

/** 200 等武器總傷害：特殊 3 → 稀有 6 → 罕見 9 → 傳說 12（命運武器各階 +1） */
const WEAPON_TOTAL_DAMAGE_200 = {
  normal: { rare: 3, epic: 6, unique: 9, legendary: 12 },
  destiny: { rare: 4, epic: 7, unique: 10, legendary: 13 }
};

/** 250 等武器總傷害 */
const WEAPON_TOTAL_DAMAGE_250 = {
  normal: { rare: 4, epic: 7, unique: 10, legendary: 13 },
  destiny: { rare: 5, epic: 8, unique: 11, legendary: 14 }
};

/**
 * 主潛能 8421 — 爆擊機率%（命運武器對照 Destiny Weapon Matrix v2）
 */
const MAIN_WEAPON_CRIT_RATE = {
  normal: { rare: 5, epic: 9, unique: 11, legendary: 13 },
  destiny: { rare: 5, epic: 9, unique: 10, legendary: 13 }
};

/**
 * 附加潛能 8422 — 爆擊機率%
 * 特殊 4→5、稀有 6→7（罕見／傳說未調整）
 */
const ADD_WEAPON_CRIT_RATE = {
  rare: 5,
  epic: 7,
  unique: 8,
  legendary: 9
};

/** 主潛能 — 內嵌 % 詞條：cube 表舊值 → 平衡後新值（一般武器） */
const MAIN_WEAPON_EMBEDDED_REMAP = {
  無視怪物防禦力: { 15: 20, 30: 35, 35: 40, 40: 45 },
  攻擊BOSS怪物時傷害增加: { 30: 35, 35: 40, 40: 45 }
};

/** 附加潛能 — 內嵌 % 詞條：cube 表舊值 → 平衡後新值 */
const ADD_WEAPON_EMBEDDED_REMAP = {
  無視怪物防禦力: { 3: 5, 4: 6, 5: 7 },
  攻擊BOSS怪物時傷害增加: { 12: 14, 18: 20 }
};

function isDestinyWeapon(item) {
  return item?.weaponTier === 'destiny' || item?.isDestinyWeapon === true;
}

function getWeaponTierKey(item) {
  return isDestinyWeapon(item) ? 'destiny' : 'normal';
}

function getWeaponReqLevel(item) {
  return Math.max(1, Number(item?.reqLevel) || 200);
}

function pickTotalDamageValue(internalRank, item) {
  const level = getWeaponReqLevel(item);
  const table = level >= 250 ? WEAPON_TOTAL_DAMAGE_250 : WEAPON_TOTAL_DAMAGE_200;
  const tier = getWeaponTierKey(item);
  const row = table[tier] || table.normal;
  return row[internalRank] ?? row.rare;
}

function remapEmbeddedPercent(baseName, oldPercent, eventId, item) {
  if (eventId === 8421 && typeof isDestinyWeapon === 'function' && isDestinyWeapon(item)) {
    const destinyMap = typeof DESTINY_WEAPON_EMBEDDED_REMAP !== 'undefined'
      ? DESTINY_WEAPON_EMBEDDED_REMAP[baseName]
      : null;
    if (destinyMap) return destinyMap[oldPercent] ?? oldPercent;
  }

  const map = eventId === 8422 ? ADD_WEAPON_EMBEDDED_REMAP : MAIN_WEAPON_EMBEDDED_REMAP;
  const tierMap = map[baseName];
  if (!tierMap) return oldPercent;
  return tierMap[oldPercent] ?? oldPercent;
}

function parseEmbeddedPercentStat(statName, internalRank, context) {
  const match = statName.match(/^(.+?)\+(\d+)(%?)$/);
  if (!match) return null;

  const item = context.item;
  if (!item || (typeof isWeaponPotentialEquip === 'function'
    ? !isWeaponPotentialEquip(item)
    : item.mainType !== EQUIP_TYPE.WEAPON)) return null;

  const eventId = context.eventId || 8421;

  if (eventId === 8421
    && typeof parseNormalWeapon151200MainEmbeddedStat === 'function'
    && typeof isNormalWeapon151200MainPotentialContext === 'function'
    && isNormalWeapon151200MainPotentialContext(context)) {
    const normal151200 = parseNormalWeapon151200MainEmbeddedStat(statName, internalRank);
    if (normal151200) return normal151200;
    return {
      label: typeof formatPotentialBossDamageLabel === 'function'
        ? formatPotentialBossDamageLabel(match[1])
        : match[1],
      value: `${Number(match[2])}%`,
    };
  }

  const baseName = match[1];
  const oldVal = Number(match[2]);
  const newVal = remapEmbeddedPercent(baseName, oldVal, eventId, item);

  return {
    label: typeof formatPotentialBossDamageLabel === 'function'
      ? formatPotentialBossDamageLabel(baseName)
      : baseName,
    value: `${newVal}%`
  };
}

function parseWeaponPotentialStat(statName, internalRank, context = {}) {
  const item = context.item;
  if (!item || (typeof isWeaponPotentialEquip === 'function'
    ? !isWeaponPotentialEquip(item)
    : item.mainType !== EQUIP_TYPE.WEAPON)) return null;

  if (typeof parseDestinyWeaponPotentialStat === 'function') {
    const destinyStat = parseDestinyWeaponPotentialStat(statName, internalRank, context);
    if (destinyStat) return destinyStat;
  }

  if (typeof parseNormalWeapon151200MainPotentialStat === 'function') {
    const normal151200Stat = parseNormalWeapon151200MainPotentialStat(statName, internalRank, context);
    if (normal151200Stat) return normal151200Stat;
  }

  const eventId = context.eventId || 8421;

  if (statName === '總傷害' || statName === '總傷害%') {
    const num = pickTotalDamageValue(internalRank, item);
    return { label: '總傷害', value: `${num}%` };
  }

  if (statName === '爆擊機率%') {
    if (eventId === 8422) {
      const num = ADD_WEAPON_CRIT_RATE[internalRank] ?? ADD_WEAPON_CRIT_RATE.rare;
      return { label: '爆擊機率', value: `${num}%` };
    }
    const tier = getWeaponTierKey(item);
    const row = MAIN_WEAPON_CRIT_RATE[tier] || MAIN_WEAPON_CRIT_RATE.normal;
    const num = row[internalRank] ?? row.rare;
    return { label: '爆擊機率', value: `${num}%` };
  }

  const embedded = parseEmbeddedPercentStat(statName, internalRank, context);
  if (embedded) return embedded;

  return null;
}
