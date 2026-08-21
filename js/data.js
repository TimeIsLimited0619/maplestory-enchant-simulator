// 1. 防具／飾品星力數值（StarForce_Armor_Accessories_Stats.xlsx；武器見 WEAPON_STAR_*）
/** 防具／飾品四圍累積 */
const ARMOR_STAR_STAT_CUMULATIVE = {
  '128-137': [0,2,4,6,8,10,13,16,19,22,25,28,31,34,37,40,47,54,61,68,75,94,103,103,103,103,103,103,103,103,103],
  '138-149': [0,2,4,6,8,10,13,16,19,22,25,28,31,34,37,40,49,58,67,76,85,106,117,117,117,117,117,117,117,117,117],
  '150-159': [0,2,4,6,8,10,13,16,19,22,25,28,31,34,37,40,51,62,73,84,95,118,131,131,131,131,131,131,131,131,131],
  '160-200': [0,2,4,6,8,10,13,16,19,22,25,28,31,34,37,40,53,66,79,92,105,130,145,145,145,145,145,145,145,145,145],
  '201-249': [0,2,4,6,8,10,13,16,19,22,25,28,31,34,37,40,55,70,85,100,115,142,159,159,159,159,159,159,159,159,159],
  '250': [0,2,4,6,8,10,13,16,19,22,25,28,31,34,37,40,57,74,91,108,125,142,159,159,159,159,159,159,159,159,159],
};

/** 防具／飾品 ATT/MATT 累積（16 星起；手套 1~15 星另見 ARMOR_GLOVE_STAR_ATT_CUMULATIVE） */
const ARMOR_STAR_ATT_CUMULATIVE = {
  '128-137': [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,7,15,24,34,45,63,78,95,114,135,157,180,204,229,255],
  '138-149': [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,8,17,27,38,50,69,85,103,123,145,168,192,217,243,270],
  '150-159': [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,9,19,30,42,55,75,92,111,132,155,179,204,230,257,285],
  '160-200': [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,10,21,33,46,60,87,106,127,150,175,201,228,256,285,315],
  '201-249': [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,12,25,39,54,70,99,120,143,168,195,223,252,282,313,345],
  '250': [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,14,29,45,62,80,99,120,143,168,195,223,252,282,313,345],
};

/** 手套 1~15 星 ATT/MATT 累積 */
const ARMOR_GLOVE_STAR_ATT_CUMULATIVE = [0,0,0,0,0,1,1,2,2,3,3,4,4,5,6,7];

function resolveArmorStarLevelRange(reqLevel) {
  const level = reqLevel || 200;
  if (level <= 137) return '128-137';
  if (level <= 149) return '138-149';
  if (level <= 159) return '150-159';
  if (level <= 200) return '160-200';
  if (level <= 249) return '201-249';
  return '250';
}

function isStarGloveItem(item) {
  return item?.islot === 'Gv';
}

const STAR_CLASS_STAT_KEYS = ['str', 'dex', 'int', 'luk'];

const STAR_CLASS_STAT_LABELS = {
  str: 'STR',
  dex: 'DEX',
  int: 'INT',
  luk: 'LUK',
};

/** Class Stats：1~15 星僅基礎四圍 > 0 的屬性；16 星起四圍皆加（1~15 段仍依基礎判定） */
function hasBaseClassStat(item, statKey) {
  return (item?.baseStats?.[statKey] || 0) > 0;
}

function getRawClassStatCumulative(starCount, item) {
  const star = Math.max(0, Math.min(30, starCount || 0));
  const isWeapon = typeof usesWeaponStarForce === 'function'
    ? usesWeaponStarForce(item)
    : item?.mainType === EQUIP_TYPE.WEAPON;
  if (isWeapon) {
    const range = resolveWeaponStarLevelRange(item?.reqLevel || 200);
    const statTable = WEAPON_STAR_STAT_CUMULATIVE[range] || WEAPON_STAR_STAT_CUMULATIVE['200-249'];
    return statTable[star] ?? statTable[25] ?? 0;
  }
  const range = resolveArmorStarLevelRange(item?.reqLevel || 200);
  const statTable = ARMOR_STAR_STAT_CUMULATIVE[range] || ARMOR_STAR_STAT_CUMULATIVE['200-249'];
  return statTable[star] ?? statTable[30] ?? 0;
}

function getStarClassStatBonus(rawBonus, item, statKey) {
  if (!rawBonus || rawBonus <= 0) return 0;
  return hasBaseClassStat(item, statKey) ? rawBonus : 0;
}

function getStarClassStatBonusAtStar(starCount, item, statKey) {
  const star = Math.max(0, Math.min(30, starCount || 0));
  const raw = getRawClassStatCumulative(star, item);
  if (star <= 15) {
    return getStarClassStatBonus(raw, item, statKey);
  }
  const raw15 = getRawClassStatCumulative(15, item);
  const after15 = raw - raw15;
  let total = after15;
  if (hasBaseClassStat(item, statKey)) {
    total += raw15;
  }
  return total;
}

function appendStarClassStatBoostLines(lines, item, classStatGains, labelMap = STAR_CLASS_STAT_LABELS) {
  if (!item || !classStatGains) return;
  for (const key of STAR_CLASS_STAT_KEYS) {
    const diff = classStatGains[key] || 0;
    if (diff > 0) {
      lines.push({ label: labelMap[key], val: diff });
    }
  }
}

/** 武器星力四圍累積（StarForce_Stats_Data.xlsx） */
const WEAPON_STAR_STAT_CUMULATIVE = {
  '128-137': [0,2,4,6,8,10,13,16,19,22,25,28,31,34,37,40,47,54,61,68,75,75,75,75,75,75],
  '138-149': [0,2,4,6,8,10,13,16,19,22,25,28,31,34,37,40,49,58,67,76,85,94,103,103,103,103],
  '150-159': [0,2,4,6,8,10,13,16,19,22,25,28,31,34,37,40,51,62,73,88,95,106,117,117,117,117],
  '160-199': [0,2,4,6,8,10,13,16,19,22,25,28,31,34,37,40,53,66,79,92,105,118,131,131,131,131],
  '200-249': [0,2,4,6,8,10,13,16,19,22,25,28,31,34,37,40,55,70,85,100,115,130,145,145,145,145],
};

/** 武器 16~25 星每星 ATT/MATT 固定增量（StarForce_Stats_Data.xlsx） */
const WEAPON_STAR_ATT_GAIN_16_25 = {
  '128-137': { 16:6, 17:6, 18:7, 19:8, 20:9 },
  '138-149': { 16:7, 17:7, 18:8, 19:9, 20:10, 21:11, 22:12, 23:30, 24:31, 25:32 },
  '150-159': { 16:8, 17:8, 18:9, 19:10, 20:11, 21:12, 22:13, 23:31, 24:32, 25:33 },
  '160-199': { 16:9, 17:9, 18:10, 19:11, 20:12, 21:13, 22:14, 23:32, 24:33, 25:34 },
  '200-249': { 16:13, 17:13, 18:14, 19:14, 20:15, 21:16, 22:17, 23:34, 24:35, 25:36 },
};

/** 武器 26~30 星每星 ATT/MATT 固定增量 */
const WEAPON_STAR_ATT_GAIN_26_30 = { 26:37, 27:38, 28:39, 29:40, 30:41 };

function resolveWeaponStarLevelRange(reqLevel) {
  const level = reqLevel || 200;
  if (level <= 137) return '128-137';
  if (level <= 149) return '138-149';
  if (level <= 159) return '150-159';
  if (level <= 199) return '160-199';
  return '200-249';
}

/**
 * 1~15 星：每星 floor((基礎+卷軸) × 2% + 1)，以該值固定計算（非複利）。
 * attBase 為 0 則不加成。
 */
function calcWeaponStarAttBonusUpTo15(attBase, starCount) {
  if (!attBase || attBase <= 0) return 0;
  const perStar = Math.floor(attBase * 0.02 + 1);
  const stars = Math.max(0, Math.min(15, starCount || 0));
  return perStar * stars;
}

function getWeaponStarAttGainForStar(star, range) {
  if (star >= 26) return WEAPON_STAR_ATT_GAIN_26_30[star] || 0;
  return (WEAPON_STAR_ATT_GAIN_16_25[range] || {})[star] || 0;
}

/** 武器星力 1~15 星攻擊底數：基礎屬性 + 卷軸（不含火焰／潛能） */
function getWeaponStarAttBaseForStarForce(item, kind) {
  const base = kind === 'matk'
    ? (item?.baseStats?.matk || 0)
    : (item?.baseStats?.atk || 0);
  const scroll = kind === 'matk'
    ? (item?.scrollMatk || 0)
    : (item?.scrollAtk || 0);
  return base + scroll;
}

function getWeaponStarForceBonusAtStar(starCount, item) {
  const star = Math.max(0, Math.min(30, starCount || 0));
  const reqLevel = item?.reqLevel || 200;
  const range = resolveWeaponStarLevelRange(reqLevel);
  const statTable = WEAPON_STAR_STAT_CUMULATIVE[range] || WEAPON_STAR_STAT_CUMULATIVE['200-249'];
  const stat = statTable[star] ?? statTable[25] ?? 0;

  const baseAtk = item?.baseStats?.atk || 0;
  const baseMatk = item?.baseStats?.matk || 0;
  const hasBaseAtk = baseAtk > 0;
  const hasBaseMatk = baseMatk > 0;
  const atkBase = getWeaponStarAttBaseForStarForce(item, 'atk');
  const matkBase = getWeaponStarAttBaseForStarForce(item, 'matk');
  let atk = 0;
  let matk = 0;

  if (star <= 15) {
    if (hasBaseAtk) atk = calcWeaponStarAttBonusUpTo15(atkBase, star);
    if (hasBaseMatk) matk = calcWeaponStarAttBonusUpTo15(matkBase, star);
  } else {
    if (hasBaseAtk) atk = calcWeaponStarAttBonusUpTo15(atkBase, 15);
    if (hasBaseMatk) matk = calcWeaponStarAttBonusUpTo15(matkBase, 15);
    for (let s = 16; s <= star; s += 1) {
      const gain = getWeaponStarAttGainForStar(s, range);
      if (hasBaseAtk) atk += gain;
      if (hasBaseMatk) matk += gain;
    }
  }

  return { stat, atk, matk };
}

function getArmorStarForceBonusAtStar(starCount, item) {
  const star = Math.max(0, Math.min(30, starCount || 0));
  const range = resolveArmorStarLevelRange(item?.reqLevel || 200);
  const statTable = ARMOR_STAR_STAT_CUMULATIVE[range] || ARMOR_STAR_STAT_CUMULATIVE['200-249'];
  const attTable = ARMOR_STAR_ATT_CUMULATIVE[range] || ARMOR_STAR_ATT_CUMULATIVE['200-249'];
  const stat = statTable[star] ?? statTable[30] ?? 0;

  const baseAtk = item?.baseStats?.atk || 0;
  const baseMatk = item?.baseStats?.matk || 0;
  const hasBaseAtk = baseAtk > 0;
  const hasBaseMatk = baseMatk > 0;

  let atk = 0;
  let matk = 0;

  if (star <= 15 && isStarGloveItem(item)) {
    const gloveAtt = ARMOR_GLOVE_STAR_ATT_CUMULATIVE[star] ?? 0;
    if (hasBaseAtk) atk = gloveAtt;
    if (hasBaseMatk) matk = gloveAtt;
  } else {
    const att = attTable[star] ?? attTable[30] ?? 0;
    if (hasBaseAtk) atk = att;
    if (hasBaseMatk) matk = att;
  }

  return { stat, atk, matk };
}

function getStarForceBonusAtStar(starCount, item) {
  const isWeapon = typeof usesWeaponStarForce === 'function'
    ? usesWeaponStarForce(item)
    : item?.mainType === EQUIP_TYPE.WEAPON;
  const core = isWeapon
    ? getWeaponStarForceBonusAtStar(starCount, item)
    : getArmorStarForceBonusAtStar(starCount, item);
  const star = Math.max(0, Math.min(30, starCount || 0));
  const def = typeof getStarDefBonusAtStar === 'function'
    ? getStarDefBonusAtStar(star, item)
    : 0;
  const hp = typeof isStarHpEligible === 'function' && isStarHpEligible(item)
    ? getStarHpBonus(star)
    : 0;
  return { stat: core.stat, atk: core.atk, matk: core.matk, def, hp };
}

function getStarForceGain(fromStar, toStar, item) {
  const cur = getStarForceBonusAtStar(fromStar, item);
  const next = getStarForceBonusAtStar(toStar, item);
  const statDiff = next.stat - cur.stat;
  const atkDiff = next.atk - cur.atk;
  const matkDiff = next.matk - cur.matk;
  const defDiff = item?.mainType === EQUIP_TYPE.ARMOR && typeof getStarDefBonusAtStar === 'function'
    ? getStarDefBonusAtStar(toStar, item) - getStarDefBonusAtStar(fromStar, item)
    : 0;
  const classStatGains = {};
  for (const key of STAR_CLASS_STAT_KEYS) {
    classStatGains[key] = getStarClassStatBonusAtStar(toStar, item, key)
      - getStarClassStatBonusAtStar(fromStar, item, key);
  }
  return { statDiff, atkDiff, matkDiff, defDiff, classStatGains };
}

// 星力累積 Max HP（MapleStory Wiki Stat Tables，1~15 星遞增，16 星起維持 255）
const STAR_HP_CUMULATIVE = [
  0, 5, 10, 15, 25, 35, 50, 65, 85, 105, 130, 155, 180, 205, 230, 255,
];

const STAR_HP_EXCLUDED_ISLOTS = new Set(['Gv', 'So', 'Af', 'Ay']);

function resolveStarStatsTable(reqLevel) {
  const range = resolveArmorStarLevelRange(reqLevel);
  const statTable = ARMOR_STAR_STAT_CUMULATIVE[range];
  const attTable = ARMOR_STAR_ATT_CUMULATIVE[range];
  if (!statTable || !attTable) return null;
  return statTable.map((stat, index) => [stat, attTable[index] || 0]);
}

function getStarHpBonus(starCount) {
  const star = Math.max(0, Math.min(30, starCount || 0));
  if (star <= 0) return 0;
  if (star <= 15) return STAR_HP_CUMULATIVE[star] || 0;
  return 255;
}

function isStarHpEligible(item) {
  const islot = item?.islot || '';
  return !STAR_HP_EXCLUDED_ISLOTS.has(islot);
}

function getStarDefCyclePos(star) {
  return ((star - 1) % 10) + 1;
}

function isStarDefCapItem(item) {
  return item?.islot === 'Cp';
}

/** 防具星力防禦：每 10 星一循環；1~9 星 = floor(位置 × 基礎防禦 / 100)；第 10 星帽子 floor(0.2%)，其餘 round(0.2%) */
function getStarDefPerStarGain(star, item) {
  const baseDef = item?.baseStats?.def || 0;
  if (baseDef <= 0 || star <= 0) return 0;
  const pos = getStarDefCyclePos(star);
  if (pos === 10) {
    const exact = baseDef * 0.002;
    return isStarDefCapItem(item) ? Math.floor(exact) : Math.round(exact);
  }
  return Math.floor((pos * baseDef) / 100);
}

/** 防具星力防禦累積：逐星增量加總 */
function getStarDefBonusAtStar(starCount, item) {
  if (item?.mainType !== EQUIP_TYPE.ARMOR) return 0;
  const baseDef = item?.baseStats?.def || 0;
  if (baseDef <= 0) return 0;
  const star = Math.max(0, Math.min(30, starCount || 0));
  if (star <= 0) return 0;
  let total = 0;
  for (let s = 1; s <= star; s += 1) {
    total += getStarDefPerStarGain(s, item);
  }
  return total;
}

// 2. 星力強化楓幣費用表 (200級 / 250級，索引 0 = 0★→1★ … 29 = 29★→30★，已 ×2)
const starMesoCosts = {
  200: [
    446400, 890800, 1335400, 1779800, 2224200, 2668600, 3113200, 3557600, 4002000, 4446400,
    18167400, 41783000, 76096400, 126699000, 223968200, 228211600, 279997400, 356422800, 1008191600, 1736921600,
    297224800, 539203600, 379977200, 426248000, 475915400, 529078000, 585832800, 646276000, 710502800, 778607400
  ],
  250: [
    870000, 1738200, 2606200, 3474200, 4342200, 5210400, 6078400, 6946400, 7814600, 8682600,
    35481200, 81605600, 148624000, 247457000, 437436200, 445723800, 546868000, 696136400, 1969122200, 3392423000,
    774019600, 877608800, 989520600, 1110017600, 1239360000, 1377804000, 1525602800, 1683007200, 1850264600, 2027620000
  ]
};

// 3. 星力點擊機率表 (成功 / 失敗 / 破壞)
const starRates = [
  { success: 95, fail: 5, destroy: 0, safeguard: false },
  { success: 90, fail: 10, destroy: 0, safeguard: false },
  { success: 85, fail: 15, destroy: 0, safeguard: false },
  { success: 85, fail: 15, destroy: 0, safeguard: false },
  { success: 80, fail: 20, destroy: 0, safeguard: false },
  { success: 75, fail: 25, destroy: 0, safeguard: false },
  { success: 70, fail: 30, destroy: 0, safeguard: false },
  { success: 65, fail: 35, destroy: 0, safeguard: false },
  { success: 60, fail: 40, destroy: 0, safeguard: false },
  { success: 55, fail: 45, destroy: 0, safeguard: false },
  { success: 50, fail: 50, destroy: 0, safeguard: false },
  { success: 45, fail: 55, destroy: 0, safeguard: false },
  { success: 40, fail: 60, destroy: 0, safeguard: false },
  { success: 35, fail: 65, destroy: 0, safeguard: false },
  { success: 30, fail: 70, destroy: 0, safeguard: false },
  { success: 30, fail: 67.9, destroy: 2.1, safeguard: true },
  { success: 30, fail: 67.9, destroy: 2.1, safeguard: true },
  { success: 30, fail: 67.9, destroy: 2.1, safeguard: true },
  { success: 15, fail: 78.2, destroy: 6.8, safeguard: true },
  { success: 15, fail: 78.2, destroy: 6.8, safeguard: false },
  { success: 15, fail: 76.5, destroy: 8.5, safeguard: false },
  { success: 30, fail: 59.5, destroy: 10.5, safeguard: false },
  { success: 15, fail: 72.25, destroy: 12.75, safeguard: false },
  { success: 15, fail: 68, destroy: 17, safeguard: false },
  { success: 10, fail: 72, destroy: 18, safeguard: false },
  { success: 10, fail: 72, destroy: 18, safeguard: false },
  { success: 10, fail: 72, destroy: 18, safeguard: false },
  { success: 7, fail: 74.4, destroy: 18.6, safeguard: false },
  { success: 5, fail: 76, destroy: 19, safeguard: false },
  { success: 3, fail: 77.6, destroy: 19.4, safeguard: false },
  { success: 1, fail: 79.2, destroy: 19.8, safeguard: false },
];

// 4. 鐵鎚種類與成功機率
const HAMMER_TYPES = {
  golden: {
    id: 'golden',
    name: '黃金鐵鎚',
    icon: 'images/hammer/02470000.info.iconRaw.png',
    maxUses: 1,
    rates: [50]
  },
  platinum: {
    id: 'platinum',
    name: '白金鐵鎚',
    icon: 'images/hammer/02472000.info.iconRaw.png',
    maxUses: 5,
    rates: [50, 25, 10, 5, 2.5]
  }
};

const hammerRates = HAMMER_TYPES.platinum.rates;

// 5. 榮耀卷軸防具/飾品骰數機率 — 已移至 js/scrollData.js