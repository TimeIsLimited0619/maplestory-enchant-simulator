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
  return table.find((row) => lv >= row.minLevel && lv <= row.maxLevel)
    || table[table.length - 1];
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
  const prob = BONUS_STAT_STAR_LEVEL_PROB[starFireType]
    || BONUS_STAT_STAR_LEVEL_PROB.enhanced;
  const entries = [2, 3, 4, 5, 6]
    .map((value) => ({ value, weight: prob[value] || 0 }))
    .filter((entry) => entry.weight > 0);
  return bsRollWeighted(entries.length ? entries : [{ value: 2, weight: 1 }]);
}

function bsRollLineCount(isBossGear) {
  const prob = isBossGear
    ? BONUS_STAT_LINE_COUNT_PROB.boss
    : BONUS_STAT_LINE_COUNT_PROB.general;
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
  if (starFireType === 'awakened' || starFireType === 'blackAwakened') {
    return bsRollAwakenedLineStarTier(starFireType);
  }
  // enhanced / eternal：由星火等級決定上限後，1~maxTier 均勻
  const effective = starFireLevel;
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
  const req = item?.reqLevel || 200;
  const isWeapon = bsIsWeaponItem(item);
  if (!bsCanRollAtkStat(statName, item)) return false;
  if (statName === 'BOSS怪物傷害%' && req < 90) return false;
  if ((statName === '攻擊力' || statName === '魔力') && !isWeapon && req < 60) return false;
  if (statName === '全屬性%' && req < 70) return false;
  return true;
}

function bsResolveStatLine(statName, starTier, item) {
  const meta = BONUS_STAT_NAME_TO_KEY[statName];
  if (!meta) return null;
  const reqLevel = item?.reqLevel || 200;
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

function bsPickStatFromPool(pool, usedLabels, item) {
  const available = pool.filter(
    (name) => !usedLabels.has(name) && bsCanRollStat(name, item)
  );
  if (!available.length) return null;

  const allStatName = '全屬性%';
  const hasAllStat = available.includes(allStatName);
  if (!hasAllStat || available.length === 1) {
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
function bsGetStatPickRates(item, usedLabels = null) {
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
  if (!hasAllStat || available.length === 1) {
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
  const lineCount = bsRollLineCount(bsIsBossGearItem(item));
  const pool = bsGetStatPool(item);
  const used = new Set();
  const lines = [];

  for (let i = 0; i < lineCount; i += 1) {
    const statName = bsPickStatFromPool(pool, used, item);
    if (!statName) break;
    used.add(statName);
    const tier = bsRollLineStarTier(sfLevel, item, starFireType);
    const rolled = bsResolveStatLine(statName, tier, item);
    if (!rolled) continue;
    lines.push(rolled);
  }
  return { starFireLevel: sfLevel, starFireType, lines };
}
