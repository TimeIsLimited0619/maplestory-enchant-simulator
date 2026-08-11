/**
 * 能源／徽章（islot En / EQUIP_TYPE.Energy）獨立潛能表
 * 來源：能源附加與主要潛能機率權重數值表.csv
 * 主潛 / 附潛、各階級分開；僅權重 *100% 列進池
 */

const ENERGY_POTENTIAL_MAIN_CUBE_KEYS = [
  'restore',
  'shiningMirror',
  'dazzling',
  'equal',
  'union'
];

const ENERGY_POTENTIAL_ADD_CUBE_KEYS = [
  'precious',
  'restoreAdd',
  'absoluteAdd',
  'unionAdd'
];

const ENERGY_POTENTIAL_MAIN_BY_RANK = {
  special: {
    total: 54,
    entries: [
    { stat: 'STR+13', weight: 3 },
    { stat: 'DEX+13', weight: 3 },
    { stat: 'INT+13', weight: 3 },
    { stat: 'LUK+13', weight: 3 },
    { stat: '最大HP+125', weight: 6 },
    { stat: '最大MP+125', weight: 6 },
    { stat: '物理攻擊力+13', weight: 2 },
    { stat: '魔法攻擊力+13', weight: 2 },
    { stat: 'STR+4%', weight: 3 },
    { stat: 'DEX+4%', weight: 3 },
    { stat: 'INT+4%', weight: 3 },
    { stat: 'LUK+4%', weight: 3 },
    { stat: '物理攻擊力+4%', weight: 1 },
    { stat: '魔法攻擊力+4%', weight: 1 },
    { stat: '爆擊機率+4%', weight: 1 },
    { stat: '總傷害+4%', weight: 1 },
    { stat: '全屬性+6', weight: 2 },
    { stat: '攻擊時有20%機率恢復125MP', weight: 1 },
    { stat: '攻擊時有20%機率發動6級中毒效果', weight: 1 },
    { stat: '攻擊時有10%機率發動2級昏迷效果', weight: 1 },
    { stat: '攻擊時有20%機率發動2級緩慢效果', weight: 1 },
    { stat: '攻擊時有20%機率發動3級闇黑效果', weight: 1 },
    { stat: '攻擊時有10%機率發動2級冰結效果', weight: 1 },
    { stat: '攻擊時有10%機率發動2級封印效果', weight: 1 },
    { stat: '無視怪物防禦力+15%', weight: 1 }
    ]
  },
  rare: {
    total: 50,
    entries: [
    { stat: '物理攻擊力+7%', weight: 2 },
    { stat: '魔法攻擊力+7%', weight: 2 },
    { stat: '爆擊機率+8%', weight: 2 },
    { stat: '總傷害+7%', weight: 2 },
    { stat: '攻擊時有20%機率恢復375HP', weight: 2 },
    { stat: '攻擊時有20%機率恢復187MP', weight: 2 },
    { stat: '無視怪物防禦力+15%', weight: 2 },
    { stat: 'STR+7%', weight: 5 },
    { stat: 'DEX+7%', weight: 5 },
    { stat: 'INT+7%', weight: 5 },
    { stat: 'LUK+7%', weight: 5 },
    { stat: '最大HP+7%', weight: 7 },
    { stat: '最大MP+7%', weight: 7 },
    { stat: '全屬性+4%', weight: 2 }
    ]
  },
  unique: {
    total: 43,
    entries: [
    { stat: '物理攻擊力+10%', weight: 3 },
    { stat: '魔法攻擊力+10%', weight: 3 },
    { stat: '總傷害+10%', weight: 3 },
    { stat: '無視怪物防禦力+30%', weight: 4 },
    { stat: '爆擊機率+10%', weight: 5 },
    { stat: 'STR+10%', weight: 5 },
    { stat: 'DEX+10%', weight: 5 },
    { stat: 'INT+10%', weight: 5 },
    { stat: 'LUK+10%', weight: 5 },
    { stat: '全屬性+7%', weight: 5 }
    ]
  },
  legendary: {
    total: 39,
    entries: [
    { stat: '物理攻擊力+13%', weight: 2 },
    { stat: '魔法攻擊力+13%', weight: 2 },
    { stat: '總傷害+13%', weight: 2 },
    { stat: '無視怪物防禦力+35%', weight: 3 },
    { stat: '無視怪物防禦力+40%', weight: 3 },
    { stat: '爆擊機率+12%', weight: 2 },
    { stat: '物理攻擊力+32', weight: 3 },
    { stat: '魔法攻擊力+32', weight: 3 },
    { stat: 'STR+13%', weight: 4 },
    { stat: 'DEX+13%', weight: 4 },
    { stat: 'INT+13%', weight: 4 },
    { stat: 'LUK+13%', weight: 4 },
    { stat: '全屬性+10%', weight: 3 }
    ]
  }
};

const ENERGY_POTENTIAL_ADD_BY_RANK = {
  special: {
    total: 51,
    entries: [
    { stat: '最大HP+125', weight: 3 },
    { stat: '最大MP+125', weight: 3 },
    { stat: '移動速度+6', weight: 3 },
    { stat: '跳躍力+6', weight: 3 },
    { stat: '防禦力+125', weight: 3 },
    { stat: 'STR+13', weight: 3 },
    { stat: 'DEX+13', weight: 3 },
    { stat: 'INT+13', weight: 3 },
    { stat: 'LUK+13', weight: 3 },
    { stat: '物理攻擊力+13', weight: 2 },
    { stat: '魔法攻擊力+13', weight: 2 },
    { stat: '最大HP+3%', weight: 2 },
    { stat: '最大MP+3%', weight: 2 },
    { stat: 'STR+4%', weight: 2 },
    { stat: 'DEX+4%', weight: 2 },
    { stat: 'INT+4%', weight: 2 },
    { stat: 'LUK+4%', weight: 2 },
    { stat: '物理攻擊力+4%', weight: 1 },
    { stat: '魔法攻擊力+4%', weight: 1 },
    { stat: '爆擊機率+4%', weight: 2 },
    { stat: '總傷害+4%', weight: 1 },
    { stat: '全屬性+6', weight: 3 }
    ]
  },
  rare: {
    total: 34,
    entries: [
    { stat: '最大HP+6%', weight: 3 },
    { stat: '最大MP+6%', weight: 3 },
    { stat: '物理攻擊力+7%', weight: 2 },
    { stat: '魔法攻擊力+7%', weight: 2 },
    { stat: '爆擊機率+6%', weight: 1 },
    { stat: 'STR+7%', weight: 3 },
    { stat: 'DEX+7%', weight: 3 },
    { stat: 'INT+7%', weight: 3 },
    { stat: 'LUK+7%', weight: 3 },
    { stat: '總傷害+7%', weight: 1 },
    { stat: '全屬性+4%', weight: 2 },
    { stat: '攻擊時有3%機率恢復54HP', weight: 3 },
    { stat: '攻擊時有3%機率恢復54MP', weight: 3 },
    { stat: '無視怪物防禦力+3%', weight: 2 }
    ]
  },
  unique: {
    total: 42,
    entries: [
    { stat: '最大HP+8%', weight: 3 },
    { stat: '最大MP+8%', weight: 3 },
    { stat: '物理攻擊力+10%', weight: 2 },
    { stat: '魔法攻擊力+10%', weight: 2 },
    { stat: '爆擊機率+10%', weight: 2 },
    { stat: 'STR+10%', weight: 3 },
    { stat: 'DEX+10%', weight: 3 },
    { stat: 'INT+10%', weight: 3 },
    { stat: 'LUK+10%', weight: 3 },
    { stat: '總傷害+10%', weight: 1 },
    { stat: '全屬性+7%', weight: 2 },
    { stat: '無視怪物防禦力+4%', weight: 1 },
    { stat: '攻擊時有15%機率恢復97HP', weight: 3 },
    { stat: '攻擊時有15%機率恢復97MP', weight: 3 },
    { stat: '以角色等級為準每9級STR+1', weight: 2 },
    { stat: '以角色等級為準每9級DEX+1', weight: 2 },
    { stat: '以角色等級為準每9級INT+1', weight: 2 },
    { stat: '以角色等級為準每9級LUK+1', weight: 2 }
    ]
  },
  legendary: {
    total: 38,
    entries: [
    { stat: '最大HP+11%', weight: 3 },
    { stat: '最大MP+11%', weight: 3 },
    { stat: '物理攻擊力+13%', weight: 2 },
    { stat: '魔法攻擊力+13%', weight: 2 },
    { stat: '爆擊機率+13%', weight: 2 },
    { stat: 'STR+13%', weight: 3 },
    { stat: 'DEX+13%', weight: 3 },
    { stat: 'INT+13%', weight: 3 },
    { stat: 'LUK+13%', weight: 3 },
    { stat: '總傷害+13%', weight: 1 },
    { stat: '全屬性+10%', weight: 2 },
    { stat: '無視怪物防禦力+5%', weight: 1 },
    { stat: '以角色等級為準每9級STR+2', weight: 2 },
    { stat: '以角色等級為準每9級DEX+2', weight: 2 },
    { stat: '以角色等級為準每9級INT+2', weight: 2 },
    { stat: '以角色等級為準每9級LUK+2', weight: 2 },
    { stat: '物理攻擊力+32', weight: 1 },
    { stat: '魔法攻擊力+32', weight: 1 }
    ]
  }
};


function isEnergyBadgeItem(item) {
  return item?.mainType === EQUIP_TYPE.Energy
    || item?.islot === 'En';
}

function isEnergyAddPotentialContext(context = {}) {
  return Number(context.eventId) === 8422
    || ENERGY_POTENTIAL_ADD_CUBE_KEYS.includes(context.rateKey);
}

function buildEnergyPotentialRates(weight, total, cubeKeys) {
  const rate = total > 0 ? weight / total : 0;
  const rates = {};
  cubeKeys.forEach((key) => {
    rates[key] = rate;
  });
  return rates;
}

function buildEnergyPotentialGroup(rankKey, pool, cubeKeys) {
  const pack = pool[rankKey];
  if (!pack?.entries?.length) return null;
  return {
    major: '能源/徽章',
    minor: '徽章',
    entries: pack.entries.map((row) => ({
      stat: row.stat,
      scope: '能源/徽章專用',
      rates: buildEnergyPotentialRates(row.weight, pack.total, cubeKeys)
    }))
  };
}

const ENERGY_POTENTIAL_MAIN_GROUPS = Object.fromEntries(
  ['special', 'rare', 'unique', 'legendary'].map((rank) => [
    rank,
    buildEnergyPotentialGroup(rank, ENERGY_POTENTIAL_MAIN_BY_RANK, ENERGY_POTENTIAL_MAIN_CUBE_KEYS)
  ])
);

const ENERGY_POTENTIAL_ADD_GROUPS = Object.fromEntries(
  ['special', 'rare', 'unique', 'legendary'].map((rank) => [
    rank,
    buildEnergyPotentialGroup(rank, ENERGY_POTENTIAL_ADD_BY_RANK, [
      ...ENERGY_POTENTIAL_MAIN_CUBE_KEYS,
      ...ENERGY_POTENTIAL_ADD_CUBE_KEYS
    ])
  ])
);

/** @param {string} officialRank
 *  @param {{ eventId?: number, rateKey?: string }} [context] */
function getEnergyPotentialStatRateGroup(officialRank, context = {}) {
  if (!officialRank) return null;
  const useAdd = isEnergyAddPotentialContext(context);
  const groups = useAdd ? ENERGY_POTENTIAL_ADD_GROUPS : ENERGY_POTENTIAL_MAIN_GROUPS;
  return groups[officialRank] || null;
}

function parseEnergyPotentialStat(statName) {
  if (!statName) return null;

  if (/機率/.test(statName) || /發動/.test(statName)) {
    return { label: statName, value: '' };
  }

  const levelScale = String(statName).match(/^以角色等級為準每9級(STR|DEX|INT|LUK)\+(\d+)$/);
  if (levelScale) {
    return {
      label: '以角色等級為準每9級 ' + levelScale[1] + ' +' + levelScale[2],
      value: ''
    };
  }

  const match = String(statName).match(/^(.+?)\+(\d+)(%?)$/);
  if (!match) return { label: statName, value: '' };

  const baseName = match[1];
  const num = Number(match[2]);
  const isPercent = match[3] === '%';
  const label = typeof formatPotentialBossDamageLabel === 'function'
    ? formatPotentialBossDamageLabel(baseName)
    : baseName;

  return {
    label,
    value: isPercent ? (num + '%') : String(num)
  };
}

function formatEnergyPotentialStatValue(statName) {
  const parsed = parseEnergyPotentialStat(statName);
  return parsed ? parsed.value : null;
}
