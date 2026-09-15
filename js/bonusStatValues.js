/**
 * 輪迴星火附加屬性數值表（自動產生）
 * 來源：楓之谷_輪迴星火附加屬性完整設定與數值對照表(星火機率與屬性種類).csv
 * 星火8、9級 = 星火7 + (星火7-星火6) × n，n=1,2
 * 產生：scripts/parse-bonus-stat-csv.mjs
 */

const BONUS_STAT_STAR_LEVEL_PROB = {
  "awakened": {
    "2": 97.36,
    "3": 1.5,
    "4": 0.58,
    "5": 0.33,
    "6": 0.23
  },
  "blackAwakened": {
    "2": 0,
    "3": 5,
    "4": 13,
    "5": 1.5,
    "6": 80.5
  },
  "enhanced": {
    "2": 50,
    "3": 30,
    "4": 20,
    "5": 0
  },
  "eternal": {
    "2": 44.44,
    "3": 33.33,
    "4": 22.22,
    "5": 0
  }
};

/**
 * 覺醒／暗黑覺醒共用詞條階級：先抽基礎 T1~T5，再抽加值（最終 clamp 1~9）
 * finalTier = baseTier + bonus
 */
const BONUS_STAT_AWAKENED_BASE_TIER_PROB = {
  1: 30,
  2: 25,
  3: 20,
  4: 13,
  5: 12,
};

/** 覺醒／暗黑覺醒共用：基礎階加值 */
const BONUS_STAT_AWAKENED_TIER_BONUS_PROB = {
  2: 40,
  3: 30,
  4: 25,
};

const BONUS_STAT_LINE_COUNT_PROB = {
  "general": [
    0,
    0,
    0,
    100
  ],
  "boss": [
    0,
    0,
    0,
    100
  ]
};

/** 正服詞條數：一般 1~4、BOSS 固定 4 */
const BONUS_STAT_LINE_COUNT_PROB_OFFICIAL = {
  general: [40, 40, 15, 5],
  boss: [0, 0, 0, 100],
};

/** 正服覺醒暗黑星火等級（一般裝備）；貓谷版見 BONUS_STAT_STAR_LEVEL_PROB.blackAwakened */
const BONUS_STAT_STAR_LEVEL_PROB_OFFICIAL_BLACK = {
  2: 0,
  3: 85,
  4: 13,
  5: 1.5,
  6: 0.5,
};

let bonusStatUseCatValleyRates = true;

/** 放置模式：依星火種類鎖定是否套用貓谷機率（模擬器仍吃全域開關） */
const BONUS_STAT_IDLE_CAT_VALLEY_LOCK = {
  enhanced: false,       // 強力的輪迴星火 → 正服
  eternal: false,        // 永遠的輪迴星火 → 正服
  awakened: true,        // 覺醒的輪迴星火 → 貓谷
  blackAwakened: true,   // 覺醒的暗黑輪迴星火 → 貓谷
};

function isBonusStatCatValleyRatesEnabled() {
  if (typeof isCatValleyContentUnlocked !== 'function' || !isCatValleyContentUnlocked()) {
    return false;
  }
  return bonusStatUseCatValleyRates === true;
}

/**
 * 實際擲骰／顯示用：放置模式依星火種類鎖定；其餘走全域開關。
 * @param {string} [starFireType]
 */
function isBonusStatCatValleyRatesFor(starFireType) {
  const type = String(starFireType || '');
  if (
    typeof isIdlePlayMode === 'function'
    && isIdlePlayMode()
    && Object.prototype.hasOwnProperty.call(BONUS_STAT_IDLE_CAT_VALLEY_LOCK, type)
  ) {
    return BONUS_STAT_IDLE_CAT_VALLEY_LOCK[type] === true;
  }
  return isBonusStatCatValleyRatesEnabled();
}

function setBonusStatCatValleyRatesEnabled(enabled) {
  bonusStatUseCatValleyRates = Boolean(enabled);
}

function bsGetStarLevelProb(starFireType = 'enhanced') {
  if (starFireType === 'blackAwakened' && !isBonusStatCatValleyRatesFor(starFireType)) {
    return BONUS_STAT_STAR_LEVEL_PROB_OFFICIAL_BLACK;
  }
  return BONUS_STAT_STAR_LEVEL_PROB[starFireType] || BONUS_STAT_STAR_LEVEL_PROB.enhanced;
}

function bsGetLineCountProb(isBossGear, starFireType = 'enhanced') {
  const tables = isBonusStatCatValleyRatesFor(starFireType)
    ? BONUS_STAT_LINE_COUNT_PROB
    : BONUS_STAT_LINE_COUNT_PROB_OFFICIAL;
  return isBossGear ? tables.boss : tables.general;
}

function bsUsesAwakenedIndependentTiers(starFireType = 'awakened') {
  return isBonusStatCatValleyRatesFor(starFireType);
}

/** 機率表／數值範圍顯示用的詞條階級上限：貓谷 1~9，正服 1~7 */
function bsGetBonusStatDisplayTierMax(starFireType = 'enhanced') {
  return isBonusStatCatValleyRatesFor(starFireType) ? BONUS_STAT_STAR_LINE_TIERS : 7;
}

const BONUS_STAT_STAT_POOL = {
  "weapon": [
    "STR",
    "DEX",
    "INT",
    "LUK",
    "STR+DEX",
    "STR+INT",
    "STR+LUK",
    "DEX+INT",
    "DEX+LUK",
    "INT+LUK",
    "最大HP",
    "最大MP",
    "穿戴等級減少",
    "防禦力",
    "攻擊力",
    "魔力",
    "BOSS怪物傷害%",
    "傷害%",
    "全屬性%"
  ],
  "armor": [
    "STR",
    "DEX",
    "INT",
    "LUK",
    "STR+DEX",
    "STR+INT",
    "STR+LUK",
    "DEX+INT",
    "DEX+LUK",
    "INT+LUK",
    "最大HP",
    "最大MP",
    "穿戴等級減少",
    "防禦力",
    "攻擊力",
    "魔力",
    "移動速度",
    "跳躍力",
    "全屬性%"
  ]
};

const BONUS_STAT_VALUE_TABLES = {
  "singleMain": [
    { "minLevel": 0, "maxLevel": 19, "values": [1, 2, 3, 4, 5, 6, 7, 8, 9] },
    { "minLevel": 20, "maxLevel": 39, "values": [2, 4, 6, 8, 10, 12, 14, 16, 18] },
    { "minLevel": 40, "maxLevel": 59, "values": [3, 6, 9, 12, 15, 18, 21, 24, 27] },
    { "minLevel": 60, "maxLevel": 79, "values": [4, 8, 12, 16, 20, 24, 28, 32, 36] },
    { "minLevel": 80, "maxLevel": 99, "values": [5, 10, 15, 20, 25, 30, 35, 40, 45] },
    { "minLevel": 100, "maxLevel": 119, "values": [6, 12, 18, 24, 30, 36, 42, 48, 54] },
    { "minLevel": 120, "maxLevel": 139, "values": [7, 14, 21, 28, 35, 42, 49, 56, 63] },
    { "minLevel": 140, "maxLevel": 159, "values": [8, 16, 24, 32, 40, 48, 56, 64, 72] },
    {
      "minLevel": 160,
      "maxLevel": 179,
      "values": [
        9,
        18,
        27,
        36,
        45,
        54,
        63,
        72,
        81
      ]
    },
    {
      "minLevel": 180,
      "maxLevel": 199,
      "values": [
        10,
        20,
        30,
        40,
        50,
        60,
        70,
        80,
        90
      ]
    },
    {
      "minLevel": 200,
      "maxLevel": 219,
      "values": [
        11,
        22,
        33,
        44,
        55,
        66,
        77,
        88,
        99
      ]
    },
    {
      "minLevel": 220,
      "maxLevel": 250,
      "values": [
        12,
        24,
        36,
        48,
        60,
        72,
        84,
        96,
        108
      ]
    },
    {
      "minLevel": 251,
      "maxLevel": 260,
      "values": [
        13,
        26,
        39,
        52,
        65,
        78,
        91,
        104,
        117
      ]
    }
  ],
  "dualMain": [
    { "minLevel": 0, "maxLevel": 39, "values": [1, 2, 3, 4, 5, 6, 7, 8, 9] },
    { "minLevel": 40, "maxLevel": 79, "values": [2, 4, 6, 8, 10, 12, 14, 16, 18] },
    { "minLevel": 80, "maxLevel": 119, "values": [3, 6, 9, 12, 15, 18, 21, 24, 27] },
    { "minLevel": 120, "maxLevel": 159, "values": [4, 8, 12, 16, 20, 24, 28, 32, 36] },
    {
      "minLevel": 160,
      "maxLevel": 199,
      "values": [
        5,
        10,
        15,
        20,
        25,
        30,
        35,
        40,
        45
      ]
    },
    {
      "minLevel": 200,
      "maxLevel": 239,
      "values": [
        6,
        12,
        18,
        24,
        30,
        36,
        42,
        48,
        54
      ]
    },
    {
      "minLevel": 240,
      "maxLevel": 250,
      "values": [
        7,
        14,
        21,
        28,
        35,
        42,
        49,
        56,
        63
      ]
    }
  ],
  "def": [
    { "minLevel": 0, "maxLevel": 19, "values": [1, 2, 3, 4, 5, 6, 7, 8, 9] },
    { "minLevel": 20, "maxLevel": 39, "values": [2, 4, 6, 8, 10, 12, 14, 16, 18] },
    { "minLevel": 40, "maxLevel": 59, "values": [3, 6, 9, 12, 15, 18, 21, 24, 27] },
    { "minLevel": 60, "maxLevel": 79, "values": [4, 8, 12, 16, 20, 24, 28, 32, 36] },
    { "minLevel": 80, "maxLevel": 99, "values": [5, 10, 15, 20, 25, 30, 35, 40, 45] },
    { "minLevel": 100, "maxLevel": 119, "values": [6, 12, 18, 24, 30, 36, 42, 48, 54] },
    { "minLevel": 120, "maxLevel": 139, "values": [7, 14, 21, 28, 35, 42, 49, 56, 63] },
    { "minLevel": 140, "maxLevel": 159, "values": [8, 16, 24, 32, 40, 48, 56, 64, 72] },
    {
      "minLevel": 160,
      "maxLevel": 179,
      "values": [
        9,
        18,
        27,
        36,
        45,
        54,
        63,
        72,
        81
      ]
    },
    {
      "minLevel": 180,
      "maxLevel": 199,
      "values": [
        10,
        20,
        30,
        40,
        50,
        60,
        70,
        80,
        90
      ]
    },
    {
      "minLevel": 200,
      "maxLevel": 219,
      "values": [
        11,
        22,
        33,
        44,
        55,
        66,
        77,
        88,
        99
      ]
    },
    {
      "minLevel": 220,
      "maxLevel": 239,
      "values": [
        12,
        24,
        36,
        48,
        60,
        72,
        84,
        96,
        108
      ]
    },
    {
      "minLevel": 240,
      "maxLevel": 250,
      "values": [
        13,
        26,
        39,
        52,
        65,
        78,
        91,
        104,
        117
      ]
    }
  ],
  "hpMp": [
    { "minLevel": 0, "maxLevel": 9, "values": [3, 6, 9, 12, 15, 18, 21, 24, 27] },
    { "minLevel": 10, "maxLevel": 19, "values": [30, 60, 90, 120, 150, 180, 210, 240, 270] },
    { "minLevel": 20, "maxLevel": 29, "values": [60, 120, 180, 240, 300, 360, 420, 480, 540] },
    { "minLevel": 30, "maxLevel": 39, "values": [90, 180, 270, 360, 450, 540, 630, 720, 810] },
    { "minLevel": 40, "maxLevel": 49, "values": [120, 240, 360, 480, 600, 720, 840, 960, 1080] },
    { "minLevel": 50, "maxLevel": 59, "values": [150, 300, 450, 600, 750, 900, 1050, 1200, 1350] },
    { "minLevel": 60, "maxLevel": 69, "values": [180, 360, 540, 720, 900, 1080, 1260, 1440, 1620] },
    { "minLevel": 70, "maxLevel": 79, "values": [210, 420, 630, 840, 1050, 1260, 1470, 1680, 1890] },
    { "minLevel": 80, "maxLevel": 89, "values": [240, 480, 720, 960, 1200, 1440, 1680, 1920, 2160] },
    { "minLevel": 90, "maxLevel": 99, "values": [270, 540, 810, 1080, 1350, 1620, 1890, 2160, 2430] },
    { "minLevel": 100, "maxLevel": 109, "values": [300, 600, 900, 1200, 1500, 1800, 2100, 2400, 2700] },
    { "minLevel": 110, "maxLevel": 119, "values": [330, 660, 990, 1320, 1650, 1980, 2310, 2640, 2970] },
    { "minLevel": 120, "maxLevel": 129, "values": [360, 720, 1080, 1440, 1800, 2160, 2520, 2880, 3240] },
    { "minLevel": 130, "maxLevel": 139, "values": [390, 780, 1170, 1560, 1950, 2340, 2730, 3120, 3510] },
    { "minLevel": 140, "maxLevel": 149, "values": [420, 840, 1260, 1680, 2100, 2520, 2940, 3360, 3780] },
    { "minLevel": 150, "maxLevel": 159, "values": [450, 900, 1350, 1800, 2250, 2700, 3150, 3600, 4050] },
    {
      "minLevel": 160,
      "maxLevel": 169,
      "values": [
        480,
        960,
        1440,
        1920,
        2400,
        2880,
        3360,
        3840,
        4320
      ]
    },
    {
      "minLevel": 170,
      "maxLevel": 179,
      "values": [
        510,
        1020,
        1530,
        2040,
        2550,
        3060,
        3570,
        4080,
        4590
      ]
    },
    {
      "minLevel": 180,
      "maxLevel": 189,
      "values": [
        540,
        1080,
        1620,
        2160,
        2700,
        3240,
        3780,
        4320,
        4860
      ]
    },
    {
      "minLevel": 190,
      "maxLevel": 199,
      "values": [
        570,
        1140,
        1710,
        2280,
        2850,
        3420,
        3990,
        4560,
        5130
      ]
    },
    {
      "minLevel": 200,
      "maxLevel": 209,
      "values": [
        600,
        1200,
        1800,
        2400,
        3000,
        3600,
        4200,
        4800,
        5400
      ]
    },
    {
      "minLevel": 210,
      "maxLevel": 219,
      "values": [
        630,
        1260,
        1890,
        2520,
        3150,
        3780,
        4410,
        5040,
        5670
      ]
    },
    {
      "minLevel": 220,
      "maxLevel": 229,
      "values": [
        660,
        1320,
        1980,
        2640,
        3300,
        3960,
        4620,
        5280,
        5940
      ]
    },
    {
      "minLevel": 230,
      "maxLevel": 239,
      "values": [
        690,
        1380,
        2070,
        2760,
        3450,
        4140,
        4830,
        5520,
        6210
      ]
    },
    {
      "minLevel": 240,
      "maxLevel": 249,
      "values": [
        720,
        1440,
        2160,
        2880,
        3600,
        4320,
        5040,
        5760,
        6480
      ]
    },
    {
      "minLevel": 250,
      "maxLevel": 250,
      "values": [
        750,
        1500,
        2250,
        3000,
        3750,
        4500,
        5250,
        6000,
        6750
      ]
    }
  ],
  "watkPctGeneral": [
    {
      "minLevel": 200,
      "maxLevel": 249,
      "values": [
        "4.9587%",
        "10.9091%",
        "18%",
        "26.4%",
        "36.3%",
        "47.916%",
        "61.4922%",
        "70.5%",
        "79.2%"
      ]
    },
    {
      "minLevel": 250,
      "maxLevel": 250,
      "values": [
        "5.7851%",
        "12.7273%",
        "21%",
        "30.8%",
        "42.35%",
        "55.902%",
        "71.7409%",
        "82.25%",
        "92.4%"
      ]
    }
  ],
  "watkPctBoss": [
    {
      "minLevel": 200,
      "maxLevel": 249,
      "values": [
        "7.4%",
        "15.725%",
        "24.05%",
        "32.375%",
        "40.7%",
        "49.025%",
        "57.35%",
        "65.675%",
        "74%"
      ]
    },
    {
      "minLevel": 250,
      "maxLevel": 250,
      "values": [
        "9.25%",
        "19.701%",
        "30.152%",
        "40.604%",
        "51.055%",
        "61.506%",
        "71.959%",
        "82.419%",
        "92.5%"
      ]
    }
  ],
  "matkPctGeneral": [
    {
      "minLevel": 200,
      "maxLevel": 249,
      "values": [
        "7.4%",
        "15.725%",
        "24.05%",
        "32.375%",
        "40.7%",
        "49.025%",
        "57.35%",
        "65.675%",
        "74%"
      ]
    },
    {
      "minLevel": 250,
      "maxLevel": 250,
      "values": [
        "9.25%",
        "19.701%",
        "30.152%",
        "40.604%",
        "51.055%",
        "61.506%",
        "71.959%",
        "82.419%",
        "92.5%"
      ]
    }
  ],
  "matkPctBoss": [
    {
      "minLevel": 200,
      "maxLevel": 249,
      "values": [
        "7.9%",
        "16.7875%",
        "25.675%",
        "34.5625%",
        "43.45%",
        "52.3375%",
        "61.225%",
        "70.1125%",
        "79%"
      ]
    },
    {
      "minLevel": 250,
      "maxLevel": 250,
      "values": [
        "9.3%",
        "19.7625%",
        "30.225%",
        "40.6875%",
        "51.15%",
        "61.6125%",
        "72.075%",
        "82.5375%",
        "93%"
      ]
    }
  ],
  "fixed": {
    "armorAtkFlat": [
      1,
      2,
      3,
      4,
      5,
      6,
      7,
      8,
      9
    ],
    "speed": [
      1,
      2,
      3,
      4,
      5,
      6,
      7,
      8,
      9
    ],
    "jump": [
      1,
      2,
      3,
      4,
      5,
      6,
      7,
      8,
      9
    ],
    "allStatPct": [
      1,
      2,
      3,
      4,
      5,
      6,
      7,
      8,
      9
    ],
    "bossDmgPct": [
      2,
      4,
      6,
      8,
      10,
      12,
      14,
      16,
      18
    ],
    "dmgPct": [
      1,
      2,
      3,
      4,
      5,
      6,
      7,
      8,
      9
    ],
    "levelReduce": [
      -5,
      -10,
      -15,
      -20,
      -25,
      -30,
      -35,
      -40,
      -45
    ]
  }
};

const BONUS_STAT_STAR_LINE_TIERS = 9;


/** 星火 stat 名稱 → 內部 key */
const BONUS_STAT_NAME_TO_KEY = {
  'STR': { key: 'str', table: 'singleMain' },
  'DEX': { key: 'dex', table: 'singleMain' },
  'INT': { key: 'int', table: 'singleMain' },
  'LUK': { key: 'luk', table: 'singleMain' },
  'STR+DEX': { key: 'strDex', table: 'dualMain', dual: ['str', 'dex'] },
  'STR+INT': { key: 'strInt', table: 'dualMain', dual: ['str', 'int'] },
  'STR+LUK': { key: 'strLuk', table: 'dualMain', dual: ['str', 'luk'] },
  'DEX+INT': { key: 'dexInt', table: 'dualMain', dual: ['dex', 'int'] },
  'DEX+LUK': { key: 'dexLuk', table: 'dualMain', dual: ['dex', 'luk'] },
  'INT+LUK': { key: 'intLuk', table: 'dualMain', dual: ['int', 'luk'] },
  '最大HP': { key: 'maxHp', table: 'hpMp', isPercent: false },
  '最大MP': { key: 'maxMp', table: 'hpMp', isPercent: false },
  '防禦力': { key: 'def', table: 'def' },
  '攻擊力': { key: 'watk', weaponPct: 'watkPct', armorFixedKey: 'armorAtkFlat' },
  '魔力': { key: 'matk', weaponPct: 'matkPct', armorFixedKey: 'armorAtkFlat' },
  '物理攻擊力': { key: 'watk', weaponPct: 'watkPct', armorFixedKey: 'armorAtkFlat' },
  '魔法攻擊力': { key: 'matk', weaponPct: 'matkPct', armorFixedKey: 'armorAtkFlat' },
  '物理攻擊力%': { key: 'watkPct', weaponPct: 'watkPct' },
  '魔法攻擊力%': { key: 'matkPct', weaponPct: 'matkPct' },
  '全屬性%': { key: 'allStat', table: 'fixed', fixedKey: 'allStatPct', isPercent: true },
  'BOSS怪物傷害%': { key: 'bossDmg', table: 'fixed', fixedKey: 'bossDmgPct', isPercent: true },
  // 舊名相容
  '攻擊BOSS怪物時傷害%': { key: 'bossDmg', table: 'fixed', fixedKey: 'bossDmgPct', isPercent: true },
  '傷害%': { key: 'dmg', table: 'fixed', fixedKey: 'dmgPct', isPercent: true },
  '移動速度': { key: 'speed', table: 'fixed', fixedKey: 'speed' },
  '跳躍力': { key: 'jump', table: 'fixed', fixedKey: 'jump' },
  '穿戴等級減少': { key: 'levelReduce', table: 'fixed', fixedKey: 'levelReduce' },
};

function bsParsePercentString(s) {
  if (typeof s === 'number') return s;
  const m = String(s).match(/^([\d.]+)%?$/);
  return m ? parseFloat(m[1]) : 0;
}

function bsFindLevelRow(table, reqLevel) {
  if (!table?.length) return null;
  const lv = Math.max(0, Math.floor(Number(reqLevel) || 0));
  const exact = table.find((row) => lv >= row.minLevel && lv <= row.maxLevel);
  if (exact) return exact;
  // 找不到時：用「不超過該等級」的最高檔；再低於全表則用最低檔（勿用最高檔，否則 160 以下會暴衝）
  let bestBelow = null;
  for (const row of table) {
    if (row.maxLevel <= lv && (!bestBelow || row.maxLevel > bestBelow.maxLevel)) {
      bestBelow = row;
    }
  }
  return bestBelow || table[0];
}

function bsGetTableValue(tableName, reqLevel, starTier, item, options = {}) {
  const tier = Math.max(1, Math.min(BONUS_STAT_STAR_LINE_TIERS, Math.floor(Number(starTier) || 1)));
  const idx = tier - 1;

  if (tableName === 'fixed') {
    const fk = options.fixedKey;
    const arr = BONUS_STAT_VALUE_TABLES.fixed?.[fk];
    return arr ? arr[idx] : 0;
  }

  if (tableName === 'watkPct' || tableName === 'matkPct') {
    const isBoss = options.isBossGear;
    const sub = tableName === 'watkPct'
      ? (isBoss ? 'watkPctBoss' : 'watkPctGeneral')
      : (isBoss ? 'matkPctBoss' : 'matkPctGeneral');
    const row = bsFindLevelRow(BONUS_STAT_VALUE_TABLES[sub], reqLevel);
    return row ? bsParsePercentString(row.values[idx]) : 0;
  }

  const row = bsFindLevelRow(BONUS_STAT_VALUE_TABLES[tableName], reqLevel);
  if (!row) return 0;
  const raw = row.values[idx];
  return typeof raw === 'string' ? bsParsePercentString(raw) : Number(raw) || 0;
}

function bsRollWeighted(entries) {
  const total = entries.reduce((s, e) => s + e.weight, 0);
  if (total <= 0) return entries[0]?.value;
  let r = Math.random() * total;
  for (const e of entries) {
    r -= e.weight;
    if (r <= 0) return e.value;
  }
  return entries[entries.length - 1]?.value;
}

function bsRollStarFireLevel(starFireType = 'enhanced') {
  const prob = bsGetStarLevelProb(starFireType);
  const entries = [2, 3, 4, 5, 6]
    .map((value) => ({ value, weight: prob[value] || 0 }))
    .filter((entry) => entry.weight > 0);
  return bsRollWeighted(entries.length ? entries : [{ value: 2, weight: 1 }]);
}

function bsRollLineCount(isBossGear, starFireType = 'enhanced') {
  const prob = bsGetLineCountProb(isBossGear, starFireType);
  return bsRollWeighted([
    { value: 1, weight: prob[0] || 0 },
    { value: 2, weight: prob[1] || 0 },
    { value: 3, weight: prob[2] || 0 },
    { value: 4, weight: prob[3] || 0 },
  ]);
}

function bsRollWeightedFromProbMap(probMap, keys) {
  const entries = keys
    .map((value) => ({ value, weight: Number(probMap?.[value]) || 0 }))
    .filter((entry) => entry.weight > 0);
  if (!entries.length) return keys[0];
  return bsRollWeighted(entries);
}

/** 覺醒／暗黑：共用基礎 T1~T5 + 加值 → 最終階級 1~9 */
function bsRollAwakenedLineStarTier(_starFireType) {
  const baseTier = bsRollWeightedFromProbMap(BONUS_STAT_AWAKENED_BASE_TIER_PROB, [1, 2, 3, 4, 5]);
  const bonusKeys = Object.keys(BONUS_STAT_AWAKENED_TIER_BONUS_PROB)
    .map(Number)
    .filter((n) => Number.isFinite(n))
    .sort((a, b) => a - b);
  const bonus = bsRollWeightedFromProbMap(BONUS_STAT_AWAKENED_TIER_BONUS_PROB, bonusKeys);
  return Math.max(1, Math.min(BONUS_STAT_STAR_LINE_TIERS, baseTier + bonus));
}

/** 每條附加屬性詞條的星火 tier（1~9） */
function bsRollLineStarTier(starFireLevel, item, starFireType = 'enhanced') {
  if (
    (starFireType === 'awakened' || starFireType === 'blackAwakened')
    && bsUsesAwakenedIndependentTiers(starFireType)
  ) {
    return bsRollAwakenedLineStarTier(starFireType);
  }
  let effective = starFireLevel;
  if (
    (starFireType === 'awakened' || starFireType === 'blackAwakened')
    && bsIsBossGearItem(item)
  ) {
    effective += 2;
  }
  const maxTier = Math.min(BONUS_STAT_STAR_LINE_TIERS, Math.max(1, (effective - 1) * 2));
  return 1 + Math.floor(Math.random() * maxTier);
}

function bsIsBossGearItem(item) {
  return Boolean(item?.isBossGear);
}

function bsIsWeaponItem(item) {
  return item?.mainType === 'WEAPON' || item?.subType === 'weapon';
}

function bsGetStatPool(item) {
  return bsIsWeaponItem(item)
    ? BONUS_STAT_STAT_POOL.weapon
    : BONUS_STAT_STAT_POOL.armor;
}

/** 目前裝備實際可洗出的星火詞條 id（供自動目標選單過濾） */
function bsGetAvailableBonusStatIds(item) {
  const ids = new Set();
  if (!item) return ids;
  const pool = bsGetStatPool(item);
  pool.forEach((name) => {
    if (!bsCanRollStat(name, item)) return;
    const key = BONUS_STAT_NAME_TO_KEY[name]?.key;
    if (key) ids.add(key);
  });
  return ids;
}

/** 自動重設選單：可洗出詞條（含雙屬） */
function bsGetAvailableBonusStatLineOptions(item) {
  const options = [];
  if (!item) return options;
  const pool = bsGetStatPool(item);
  const seen = new Set();
  const labelOf = (name) => {
    if (name === '攻擊力' || name === '物理攻擊力' || name === '物理攻擊力%') return '物理攻擊力';
    if (name === '魔力' || name === '魔法攻擊力' || name === '魔法攻擊力%') return '魔法攻擊力';
    if (name === '最大HP') return 'MaxHP';
    if (name === '最大MP') return 'MaxMP';
    return String(name).replace(/%$/, '');
  };
  pool.forEach((name) => {
    if (!bsCanRollStat(name, item)) return;
    const meta = BONUS_STAT_NAME_TO_KEY[name];
    if (!meta?.key || seen.has(meta.key)) return;
    seen.add(meta.key);
    options.push({ key: meta.key, label: labelOf(name) });
  });
  return options;
}

function bsItemHasBaseWatk(item) {
  return (item?.baseStats?.atk || 0) > 0;
}

function bsItemHasBaseMatk(item) {
  return (item?.baseStats?.matk || 0) > 0;
}

function bsCanRollAtkStat(statName, item) {
  if (statName === '攻擊力' || statName === '物理攻擊力' || statName === '物理攻擊力%') {
    if (!bsItemHasBaseWatk(item)) return false;
    // 有基礎魔攻的武器不出現物攻星火
    if (typeof bsIsWeaponItem === 'function' && bsIsWeaponItem(item) && bsItemHasBaseMatk(item)) {
      return false;
    }
    return true;
  }
  if (statName === '魔力' || statName === '魔法攻擊力' || statName === '魔法攻擊力%') {
    return bsItemHasBaseMatk(item);
  }
  return true;
}

function bsCanRollStat(statName, item) {
  const req = bsResolveEquipReqLevel(item) || 200;
  const isWeapon = bsIsWeaponItem(item);
  if (!bsCanRollAtkStat(statName, item)) return false;
  if (statName === 'BOSS怪物傷害%' && req < 90) return false;
  if ((statName === '攻擊力' || statName === '魔力') && !isWeapon && req < 60) return false;
  if (statName === '全屬性%' && req < 70) return false;
  return true;
}

/** 裝備需求等級：state → ITEM_DATABASE；勿預設 200（會讓低等裝查到高檔） */
function bsResolveEquipReqLevel(item) {
  const direct = Number(item?.reqLevel);
  if (Number.isFinite(direct) && direct > 0) return Math.floor(direct);
  const id = item?.id ?? item?.itemId;
  if (id != null && typeof ITEM_DATABASE !== 'undefined') {
    const fromDb = Number(ITEM_DATABASE[id]?.reqLevel);
    if (Number.isFinite(fromDb) && fromDb > 0) return Math.floor(fromDb);
  }
  return 0;
}

function bsResolveStatLine(statName, starTier, item) {
  const meta = BONUS_STAT_NAME_TO_KEY[statName];
  if (!meta) return null;
  const reqLevel = bsResolveEquipReqLevel(item);
  const isBoss = bsIsBossGearItem(item);
  const isWeapon = bsIsWeaponItem(item);

  if (meta.dual) {
    const v = bsGetTableValue(meta.table, reqLevel, starTier, item);
    return {
      statId: meta.key,
      dual: meta.dual,
      value: v,
      isPercent: false,
      label: statName,
      starTier,
    };
  }

  if (meta.weaponPct && (statName === '攻擊力' || statName === '魔力' || meta.weaponPct)) {
    if (isWeapon) {
      const pctTable = meta.weaponPct;
      const v = bsGetTableValue(pctTable, reqLevel, starTier, item, { isBossGear: isBoss });
      return {
        statId: meta.key,
        value: v,
        isPercent: true,
        label: statName === '魔力' ? '魔法攻擊力' : '物理攻擊力',
        starTier,
      };
    }
    const v = bsGetTableValue('fixed', reqLevel, starTier, item, { fixedKey: meta.armorFixedKey || 'armorAtkFlat' });
    return {
      statId: meta.key,
      value: v,
      isPercent: false,
      label: statName === '魔力' ? '魔法攻擊力' : '物理攻擊力',
      starTier,
    };
  }

  if (meta.table === 'fixed') {
    const v = bsGetTableValue('fixed', reqLevel, starTier, item, { fixedKey: meta.fixedKey });
    return {
      statId: meta.key,
      value: v,
      isPercent: Boolean(meta.isPercent),
      label: statName.replace(/%$/, ''),
      starTier,
    };
  }

  if (meta.table === 'watkPct' || meta.table === 'matkPct') {
    const v = bsGetTableValue(meta.table, reqLevel, starTier, item, { isBossGear: isBoss });
    return { statId: meta.key, value: v, isPercent: true, label: statName.replace(/%$/, ''), starTier };
  }

  const v = bsGetTableValue(meta.table, reqLevel, starTier, item);
  const isPercent = meta.isPercent || statName.includes('%');
  return {
    statId: meta.key,
    value: v,
    isPercent,
    label: statName.replace(/%$/, ''),
    starTier,
  };
}

/** 全屬性% 固定權重（%）；其餘可洗詞條均分剩餘機率 */
const BONUS_STAT_ALLSTAT_PICK_RATE = 4;

function bsPickStatFromPool(pool, usedLabels, item, starFireType = 'enhanced') {
  const available = pool.filter(
    (name) => !usedLabels.has(name) && bsCanRollStat(name, item)
  );
  if (!available.length) return null;

  const allStatName = '全屬性%';
  const hasAllStat = available.includes(allStatName);
  if (!hasAllStat || available.length === 1 || !isBonusStatCatValleyRatesFor(starFireType)) {
    return available[Math.floor(Math.random() * available.length)];
  }

  const others = available.filter((name) => name !== allStatName);
  const restRate = Math.max(0, 100 - BONUS_STAT_ALLSTAT_PICK_RATE);
  const otherWeight = others.length ? restRate / others.length : 0;
  const entries = [
    { value: allStatName, weight: BONUS_STAT_ALLSTAT_PICK_RATE },
    ...others.map((name) => ({ value: name, weight: otherWeight })),
  ].filter((entry) => entry.weight > 0);

  return bsRollWeighted(entries);
}

/** 詞條種類機率（與 bsPickStatFromPool 相同規則；usedLabels 可排除已出現詞條） */
function bsGetStatPickRates(item, usedLabels = null, starFireType = 'enhanced') {
  const pool = typeof bsGetStatPool === 'function'
    ? bsGetStatPool(item)
    : [];
  const used = usedLabels instanceof Set ? usedLabels : new Set(usedLabels || []);
  const available = pool.filter(
    (name) => !used.has(name) && (typeof bsCanRollStat !== 'function' || bsCanRollStat(name, item))
  );
  const rates = new Map();
  if (!available.length) return rates;

  const allStatName = '全屬性%';
  const hasAllStat = available.includes(allStatName);
  if (!hasAllStat || available.length === 1 || !isBonusStatCatValleyRatesFor(starFireType)) {
    const each = 100 / available.length;
    available.forEach((name) => rates.set(name, each));
    return rates;
  }

  const others = available.filter((name) => name !== allStatName);
  const restRate = Math.max(0, 100 - BONUS_STAT_ALLSTAT_PICK_RATE);
  const otherWeight = others.length ? restRate / others.length : 0;
  rates.set(allStatName, BONUS_STAT_ALLSTAT_PICK_RATE);
  others.forEach((name) => rates.set(name, otherWeight));
  return rates;
}

function bsRollBonusStatLines(item, starFireType = 'enhanced', starFireLevel = null) {
  const sfLevel = starFireLevel ?? bsRollStarFireLevel(starFireType);
  const lineCount = bsRollLineCount(bsIsBossGearItem(item), starFireType);
  const pool = bsGetStatPool(item);
  const used = new Set();
  const lines = [];

  for (let i = 0; i < lineCount; i += 1) {
    const statName = bsPickStatFromPool(pool, used, item, starFireType);
    if (!statName) break;
    used.add(statName);
    const tier = bsRollLineStarTier(sfLevel, item, starFireType);
    const rolled = bsResolveStatLine(statName, tier, item);
    if (!rolled) continue;
    lines.push(rolled);
  }
  return { starFireLevel: sfLevel, starFireType, lines };
}

/** 依已存 starTier 推回 bsResolveStatLine 用的詞條名 */
function bsResolveStatNameForStoredLine(line, item) {
  if (!line) return null;
  if (Array.isArray(line.dual) && line.dual.length >= 2) {
    const key = line.dual.map((s) => String(s).toUpperCase()).join('+');
    if (BONUS_STAT_NAME_TO_KEY[key]) return key;
  }
  const id = String(line.statId || '');
  if (id === 'watk' || id === 'watkPct') {
    if (line.isPercent || id === 'watkPct') return '物理攻擊力%';
    return '攻擊力';
  }
  if (id === 'matk' || id === 'matkPct') {
    if (line.isPercent || id === 'matkPct') return '魔法攻擊力%';
    return '魔力';
  }
  if (id === 'maxHp') return '最大HP';
  if (id === 'maxMp') return '最大MP';
  if (id === 'allStat') return '全屬性%';
  if (id === 'bossDmg') return 'BOSS怪物傷害%';
  if (id === 'dmg') return '傷害%';
  if (id === 'def') return '防禦力';
  if (id === 'speed') return '移動速度';
  if (id === 'jump') return '跳躍力';
  if (id === 'levelReduce') return '穿戴等級減少';
  if (id === 'str') return 'STR';
  if (id === 'dex') return 'DEX';
  if (id === 'int') return 'INT';
  if (id === 'luk') return 'LUK';

  const label = String(line.label || '').trim();
  if (label && BONUS_STAT_NAME_TO_KEY[label]) return label;
  if (label && BONUS_STAT_NAME_TO_KEY[`${label}%`]) return `${label}%`;

  const hit = Object.keys(BONUS_STAT_NAME_TO_KEY).find((name) => {
    const meta = BONUS_STAT_NAME_TO_KEY[name];
    return meta?.key === id && !meta.dual;
  });
  return hit || null;
}

/**
 * 依 starTier + 裝備等級重算詞條數值（修正 160 以下誤用最高檔的舊存檔）。
 * @returns {{ line: object, changed: boolean }}
 */
function rematerializeBonusStatLineValue(line, item) {
  const tier = Math.floor(Number(line?.starTier) || 0);
  if (!line || tier <= 0 || typeof bsResolveStatLine !== 'function') {
    return { line, changed: false };
  }
  const name = bsResolveStatNameForStoredLine(line, item);
  if (!name) return { line, changed: false };
  const rolled = bsResolveStatLine(name, tier, item);
  if (!rolled) return { line, changed: false };

  const nextVal = Number(rolled.value);
  const prevVal = Number(line.value);
  const sameVal = Number.isFinite(nextVal) && Number.isFinite(prevVal)
    && Math.abs(nextVal - prevVal) < 1e-6;
  const samePct = Boolean(rolled.isPercent) === Boolean(line.isPercent);
  if (sameVal && samePct && rolled.statId === line.statId) {
    return { line, changed: false };
  }

  return {
    line: {
      ...line,
      statId: rolled.statId || line.statId,
      value: rolled.value,
      isPercent: rolled.isPercent,
      dual: rolled.dual || line.dual,
      label: rolled.label || line.label,
      starTier: tier,
    },
    changed: true,
  };
}

/**
 * 顯示／加總用：有 starTier 時一律依裝備等級查表，不信任舊存檔 line.value。
 */
function bonusStatLineTableValue(line, equip = null) {
  if (!line) return 0;
  const tier = Math.floor(Number(line.starTier) || 0);
  if (tier > 0) {
    const r = rematerializeBonusStatLineValue(line, equip);
    const v = Number(r?.line?.value);
    if (Number.isFinite(v)) return v;
  }
  return Number(line.value) || 0;
}

/** 對裝備 enchant state 的 bonusStat 重算數值；回傳是否有改動 */
function rematerializeEnchantBonusStat(state) {
  if (!state || typeof state !== 'object') return false;
  const bs = state.bonusStat;
  if (!bs?.lines?.length) return false;

  let changed = false;
  const lines = bs.lines.map((line) => {
    const r = rematerializeBonusStatLineValue(line, state);
    if (r.changed) changed = true;
    return r.line;
  });
  if (!changed) return false;

  bs.lines = lines;
  if (typeof calcBonusStatAtkPow === 'function') {
    bs.atkPow = calcBonusStatAtkPow(lines, state);
  }
  return true;
}
