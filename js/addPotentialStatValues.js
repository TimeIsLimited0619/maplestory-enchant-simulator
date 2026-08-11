/**
 * 附加潛能／主潛能詞條數值（依裝備等級與階級）
 * 罕見、傳說為表列基準；特殊、稀有依相同成長量反推。
 */
const ADDPOT_RANK_STEP = { rare: 0, epic: 1, unique: 2, legendary: 3 };

/** 附加潛能：罕見／傳說錨點 + 每降一階成長量 */
const ADDPOT_STAT_ANCHORS = {
  strFlat: {
    growth: 2,
    bands: [
      { min: 91, max: 150, unique: 18, legendary: 20 },
      { min: 151, max: 200, unique: 18, legendary: 20 },
      { min: 201, max: 250, unique: 19, legendary: 21 }
    ]
  },
  statPercent: {
    growth: 2,
    bands: [
      { min: 91, max: 150, unique: 6, legendary: 8 },
      { min: 151, max: 200, unique: 6, legendary: 8 },
      { min: 201, max: 250, unique: 7, legendary: 9 }
    ]
  },
  atkFlat: {
    growth: 2,
    bands: [
      { min: 91, max: 150, unique: 14, legendary: 16 },
      { min: 151, max: 200, unique: 14, legendary: 16 },
      { min: 201, max: 250, unique: 15, legendary: 17 }
    ]
  },
  allStatPercent: {
    growth: 1,
    bands: [
      { min: 91, max: 150, unique: 5, legendary: 6 },
      { min: 151, max: 200, unique: 5, legendary: 6 },
      { min: 201, max: 250, unique: 6, legendary: 7 }
    ]
  },
  maxHpFlat: {
    growth: 60,
    bands: [
      { min: 91, max: 100, unique: 300, legendary: 360 },
      { min: 101, max: 110, unique: 300, legendary: 360 },
      { min: 111, max: 200, unique: 300, legendary: 360 },
      { min: 201, max: 250, unique: 315, legendary: 375 }
    ]
  },
  maxHpPercent: {
    growth: 3,
    bands: [
      { min: 91, max: 150, unique: 8, legendary: 11 },
      { min: 151, max: 200, unique: 8, legendary: 11 },
      { min: 201, max: 250, unique: 9, legendary: 12 }
    ]
  }
};

const ADDPOT_PERCENT_KINDS = new Set(['statPercent', 'allStatPercent', 'maxHpPercent']);

/** 附加：以角色等級為準每9級增加四圍（罕見 +1／傳說 +2） */
const ADDPOT_LEVEL_SCALE_STAT_RE = /^以角色等級為準每9級增加(力量|敏捷|智力|幸運)$/;

function getAddPotLevelScalePerStep(internalRank) {
  const step = ADDPOT_RANK_STEP[internalRank] ?? 2;
  if (step >= 3) return 2;
  if (step >= 2) return 1;
  return 0;
}

function parseAddPotLevelScaleStat(statName, internalRank) {
  if (!ADDPOT_LEVEL_SCALE_STAT_RE.test(statName)) return null;

  const perStep = getAddPotLevelScalePerStep(internalRank);
  return {
    label: statName,
    value: String(perStep)
  };
}

/** 主潛能（一般）：每 10 等 +1，上限 32；以 250 等 = 32 反推 offset */
function mainPotLevelFlat(reqLevel) {
  const level = Math.max(91, Math.min(250, Number(reqLevel) || 200));
  return Math.min(32, Math.floor(level / 10) + 7);
}

function findAddPotLevelBand(bands, reqLevel) {
  const level = Number(reqLevel) || 200;
  return bands.find((band) => level >= band.min && level <= band.max)
    || bands[bands.length - 1];
}

function resolveAddPotBandValue(config, reqLevel, internalRank) {
  const band = findAddPotLevelBand(config.bands, reqLevel);
  const step = ADDPOT_RANK_STEP[internalRank] ?? 2;
  const rankDelta = step - 2;
  return band.unique + rankDelta * config.growth;
}

function classifyAddPotStat(statName) {
  if (statName === 'STR' || statName === 'DEX' || statName === 'INT' || statName === 'LUK') {
    return 'strFlat';
  }
  if (/^(STR|DEX|INT|LUK)%$/.test(statName)) return 'statPercent';
  if (statName === '物理攻擊力' || statName === '魔法攻擊力' || statName === '攻擊力') return 'atkFlat';
  if (statName === '全屬性') return 'allStatPercent';
  if (statName === '最大HP' || statName === '最大MP') return 'maxHpFlat';
  if (statName === '最大HP%' || statName === '最大MP%') return 'maxHpPercent';
  return null;
}

function formatAddPotentialStatValue(statName, internalRank, reqLevel) {
  const kind = classifyAddPotStat(statName);
  if (!kind) return null;

  const config = ADDPOT_STAT_ANCHORS[kind];
  const num = resolveAddPotBandValue(config, reqLevel, internalRank);
  if (ADDPOT_PERCENT_KINDS.has(kind)) return `${num}%`;
  return String(num);
}

/** 主潛能「一般」列：四屬罕見錨點、物／魔攻傳說錨點，其餘階級反推 */
function formatMainPotentialStatValue(statName, internalRank, reqLevel) {
  const step = ADDPOT_RANK_STEP[internalRank] ?? 2;
  const isMainStat = statName === 'STR' || statName === 'DEX' || statName === 'INT' || statName === 'LUK';
  const isMainAtk = statName === '物理攻擊力' || statName === '魔法攻擊力' || statName === '攻擊力';

  if (isMainStat) {
    const anchor = mainPotLevelFlat(reqLevel);
    const rankDelta = step - 2;
    return String(anchor + rankDelta * 2);
  }

  if (isMainAtk) {
    const anchor = mainPotLevelFlat(reqLevel);
    const rankDelta = step - 3;
    return String(anchor + rankDelta * 2);
  }

  return null;
}

function formatPotentialStatValueForContext(statName, internalRank, context = {}) {
  const reqLevel = context.item?.reqLevel || 200;
  const eventId = context.eventId;

  if (eventId === 8421 && typeof formatArmorAccessory151250MainPotentialStatValue === 'function') {
    const armorAccVal = formatArmorAccessory151250MainPotentialStatValue(statName, internalRank, context);
    if (armorAccVal != null) return armorAccVal;
  }

  if (eventId === 8421 && typeof formatNormalWeapon151200MainPotentialStatValue === 'function') {
    const normal151200Val = formatNormalWeapon151200MainPotentialStatValue(statName, internalRank, context);
    if (normal151200Val != null) return normal151200Val;
  }

  if (eventId === 8421 && typeof formatDestinyWeaponPotentialStatValue === 'function') {
    const destinyVal = formatDestinyWeaponPotentialStatValue(statName, internalRank, context);
    if (destinyVal != null) return destinyVal;
  }

  if (eventId === 8422) {
    if (typeof formatArmorAccessory201250AddPotentialStatValue === 'function') {
      const armorAcc201250Val = formatArmorAccessory201250AddPotentialStatValue(statName, internalRank, context);
      if (armorAcc201250Val != null) return armorAcc201250Val;
    }

    if (typeof formatArmorAccessory151200AddPotentialStatValue === 'function') {
      const armorAccAddVal = formatArmorAccessory151200AddPotentialStatValue(statName, internalRank, context);
      if (armorAccAddVal != null) return armorAccAddVal;
    }

    if (typeof formatNormalWeapon151200AddPotentialStatValue === 'function') {
      const normal151200AddVal = formatNormalWeapon151200AddPotentialStatValue(statName, internalRank, context);
      if (normal151200AddVal != null) return normal151200AddVal;
    }

    if (typeof formatDestinyWeaponAddPotentialStatValue === 'function') {
      const destinyAddVal = formatDestinyWeaponAddPotentialStatValue(statName, internalRank, context);
      if (destinyAddVal != null) return destinyAddVal;
    }

    if (typeof isArmorAccessory201250AddPotentialContext === 'function'
      && isArmorAccessory201250AddPotentialContext(context)) {
      return null;
    }

    if (typeof isArmorAccessory151200AddPotentialContext === 'function'
      && isArmorAccessory151200AddPotentialContext(context)) {
      return null;
    }

    if (typeof isNormalWeapon151200AddPotentialContext === 'function'
      && isNormalWeapon151200AddPotentialContext(context)) {
      return null;
    }

    if (typeof isDestinyWeaponAddPotentialContext === 'function'
      && isDestinyWeaponAddPotentialContext(context)) {
      return null;
    }

    const levelScale = parseAddPotLevelScaleStat(statName, internalRank);
    if (levelScale) return levelScale.value;

    const addVal = formatAddPotentialStatValue(statName, internalRank, reqLevel);
    if (addVal != null) return addVal;
  } else if (eventId === 8421) {
    if (typeof isArmorAccessory151250MainPotentialContext === 'function'
      && isArmorAccessory151250MainPotentialContext(context)) {
      return null;
    }

    if (typeof isNormalWeapon151200MainPotentialContext === 'function'
      && isNormalWeapon151200MainPotentialContext(context)) {
      return null;
    }

    if (typeof isDestinyWeaponMainPotentialContext === 'function'
      && isDestinyWeaponMainPotentialContext(context)) {
      return null;
    }
    const mainVal = formatMainPotentialStatValue(statName, internalRank, reqLevel);
    if (mainVal != null) return mainVal;
  }

  return null;
}
