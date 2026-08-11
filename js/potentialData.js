const POTENTIAL_RANKS = {
  rare: {
    id: 'rare',
    label: '特殊',
    summaryBg: 'images/potential/potential.summaryBox.layer_summaryRare.png',
    statIcon: 'images/potential/potential.statIcon.rare.png',
    prefix: 'S',
    weight: 50
  },
  unique: {
    id: 'unique',
    label: '罕見',
    summaryBg: 'images/potential/potential.summaryBox.layer_summaryUnique.png',
    statIcon: 'images/potential/potential.statIcon.unique.png',
    prefix: 'U',
    weight: 30
  },
  epic: {
    id: 'epic',
    label: '稀有',
    summaryBg: 'images/potential/potential.summaryBox.layer_summaryEpic.png',
    statIcon: 'images/potential/potential.statIcon.epic.png',
    prefix: 'R',
    weight: 15
  },
  legendary: {
    id: 'legendary',
    label: '傳說',
    summaryBg: 'images/potential/potential.summaryBox.layer_summaryLegendary.png',
    statIcon: 'images/potential/potential.statIcon.legendary.png',
    prefix: 'L',
    weight: 5
  }
};

/** 低 → 高：特殊 → 稀有 → 罕見 → 傳說 */
const POTENTIAL_RANK_ORDER = ['rare', 'epic', 'unique', 'legendary'];

/** 洗方塊：整體不降階；第一排＝整體等級；其餘各排最多低一階 */
const POTENTIAL_PREVENT_RANK_DROP = true;

const POTENTIAL_LINE_POOL = [
  { label: 'MaxHP', values: { rare: '3%', unique: '9%', epic: '6%', legendary: '12%' } },
  { label: 'MaxMP', values: { rare: '3%', unique: '9%', epic: '6%', legendary: '12%' } },
  { label: 'STR', values: { rare: '3%', unique: '9%', epic: '6%', legendary: '12%' } },
  { label: 'DEX', values: { rare: '3%', unique: '9%', epic: '6%', legendary: '12%' } },
  { label: 'INT', values: { rare: '3%', unique: '9%', epic: '6%', legendary: '12%' } },
  { label: 'LUK', values: { rare: '3%', unique: '9%', epic: '6%', legendary: '12%' } },
  { label: '物理攻擊力', values: { rare: '3%', unique: '9%', epic: '6%', legendary: '12%' } },
  { label: '魔法攻擊力', values: { rare: '3%', unique: '9%', epic: '6%', legendary: '12%' } }
];

const POTENTIAL_CUBE_TYPES = [
  {
    id: 'shiningMirror',
    name: '閃耀鏡射方塊',
    slotIndex: 0,
    icon: 'images/potential/mirrorB.png',
    iconWidth: 35,
    iconHeight: 34,
    mesoCost: 0,
    rateKey: 'shiningMirror',
    helpImage: 'images/potential/potential.costItem.layer_notMemorialHelp.png'
  },
  {
    id: 'equal',
    name: '新對等方塊',
    slotIndex: 1,
    icon: 'images/potential/equalB.png',
    iconWidth: 32,
    iconHeight: 33,
    mesoCost: 0,
    rateKey: 'equal',
    helpImage: 'images/potential/potential.costItem.layer_notMemorialHelp.png'
  },
  {
    id: 'dazzling',
    name: '閃炫方塊',
    slotIndex: 2,
    icon: 'images/potential/hexab.png',
    iconWidth: 25,
    iconHeight: 26,
    mesoCost: 0,
    rateKey: 'dazzling',
    hexaPick: true,
    helpImage: 'images/potential/potential.costItem.layer_hexaHelp3.png'
  },
  {
    id: 'union',
    name: '結合方塊',
    slotIndex: 3,
    icon: 'images/potential/unib.png',
    iconWidth: 39,
    iconHeight: 39,
    mesoCost: 0,
    rateKey: 'union',
    uniPick: true,
    helpImage: 'images/potential/potential.costItem.layer_uniHelp.png'
  },
  {
    id: 'restore',
    name: '恢復方塊',
    slotIndex: 4,
    icon: 'images/potential/memoriaB.png',
    iconWidth: 32,
    iconHeight: 32,
    mesoCost: 0,
    rateKey: 'restore',
    memoriaPick: true,
    helpImage: 'images/potential/potential.costItem.layer_memorialHelp.png'
  }
];

/** 恢復方塊 help（保留給 getPotentialCubeHelpImage fallback） */
const POTENTIAL_CUBE_HELP_IMAGES = {
  restore: 'images/potential/potential.costItem.layer_memorialHelp.png'
};

function getPotentialCubeHelpImage(cubeId) {
  const cube = getPotentialCubeById(cubeId);
  if (cube?.helpImage) return cube.helpImage;
  return POTENTIAL_CUBE_HELP_IMAGES[cubeId] || null;
}

const DEFAULT_CUBE_COUNT = 999;

let playerCubeCounts = {
  shiningMirror: DEFAULT_CUBE_COUNT,
  equal: DEFAULT_CUBE_COUNT,
  dazzling: DEFAULT_CUBE_COUNT,
  union: DEFAULT_CUBE_COUNT,
  restore: DEFAULT_CUBE_COUNT
};

function getPlayerCubeCount(cubeId) {
  const count = playerCubeCounts[cubeId];
  if (!count || count <= 0) {
    playerCubeCounts[cubeId] = DEFAULT_CUBE_COUNT;
    return DEFAULT_CUBE_COUNT;
  }
  return count;
}

function consumePlayerCube(cubeId) {
  const count = getPlayerCubeCount(cubeId);
  playerCubeCounts[cubeId] = count - 1;
  if (playerCubeCounts[cubeId] <= 0) {
    playerCubeCounts[cubeId] = DEFAULT_CUBE_COUNT;
  }
  trackCostUsage('cube', cubeId);
  return true;
}

function getPotentialCubeById(cubeId) {
  return POTENTIAL_CUBE_TYPES.find((cube) => cube.id === cubeId) || null;
}

function getPotentialCubeBySlot(slotIndex) {
  return POTENTIAL_CUBE_TYPES.find((cube) => cube.slotIndex === slotIndex) || null;
}

function getDefaultPotentialState() {
  return {
    rank: 'rare',
    lines: [
      { rank: 'rare', label: 'MaxMP', value: '3%' },
      { rank: 'rare', label: 'MaxMP', value: '3%' },
      { rank: 'rare', label: 'STR', value: '3%' }
    ],
    atkPow: 397803310
  };
}

/** 無潛能（勳章／貓谷潛能專用起始狀態） */
function getEmptyPotentialState() {
  return {
    rank: 'legendary',
    lines: [],
    atkPow: 0
  };
}

function rollPotentialLineRank(cube, currentRank) {
  const currentIndex = POTENTIAL_RANK_ORDER.indexOf(currentRank);
  const maxIndex = POTENTIAL_RANK_ORDER.indexOf(cube.maxResultRank);
  let rankIndex = currentIndex >= 0 ? currentIndex : 0;

  if (Math.random() < cube.rankUpChance && rankIndex < maxIndex) {
    rankIndex += 1;
  }

  const weights = POTENTIAL_RANK_ORDER.slice(0, maxIndex + 1).map((rankId, index) => {
    const rank = POTENTIAL_RANKS[rankId];
    return { rankId, weight: rank.weight * (index <= rankIndex ? 1.4 : 0.6) };
  });

  const total = weights.reduce((sum, item) => sum + item.weight, 0);
  let roll = Math.random() * total;
  for (const item of weights) {
    roll -= item.weight;
    if (roll <= 0) return item.rankId;
  }

  return weights[weights.length - 1].rankId;
}

function rollPotentialLine(cube, rankId) {
  const stat = POTENTIAL_LINE_POOL[Math.floor(Math.random() * POTENTIAL_LINE_POOL.length)];
  return {
    rank: rankId,
    label: stat.label,
    value: stat.values[rankId] || stat.values.rare
  };
}

function rollPotentialRank(lines) {
  const rankIndexes = lines
    .map((line) => POTENTIAL_RANK_ORDER.indexOf(line.rank))
    .filter((index) => index >= 0);
  if (!rankIndexes.length) return 'rare';
  return POTENTIAL_RANK_ORDER[Math.max(...rankIndexes)];
}

function maxInternalRank(a, b) {
  const ia = POTENTIAL_RANK_ORDER.indexOf(a);
  const ib = POTENTIAL_RANK_ORDER.indexOf(b);
  if (ia < 0) return b;
  if (ib < 0) return a;
  return ia >= ib ? a : b;
}

function minInternalRank(a, b) {
  const ia = POTENTIAL_RANK_ORDER.indexOf(a);
  const ib = POTENTIAL_RANK_ORDER.indexOf(b);
  if (ia < 0) return b;
  if (ib < 0) return a;
  return ia <= ib ? a : b;
}

function oneTierBelowInternalRank(rank) {
  const index = POTENTIAL_RANK_ORDER.indexOf(rank);
  if (index <= 0) return rank;
  return POTENTIAL_RANK_ORDER[index - 1];
}

function oneTierAboveInternalRank(rank) {
  const index = POTENTIAL_RANK_ORDER.indexOf(rank);
  if (index < 0 || index >= POTENTIAL_RANK_ORDER.length - 1) return rank;
  return POTENTIAL_RANK_ORDER[index + 1];
}

/** 限制在 [整體等級 - 1 階, 整體等級] */
function clampLineRankToOverallWindow(rank, overallRank) {
  const floor = oneTierBelowInternalRank(overallRank);
  return maxInternalRank(minInternalRank(rank, overallRank), floor);
}

function rerollPotential(cube, currentPotential, item) {
  if (cube.rateKey && typeof rerollPotentialWithCube === 'function') {
    return rerollPotentialWithCube(cube, item, currentPotential);
  }

  const baseRank = currentPotential?.rank || 'rare';
  const headerRank = baseRank;
  const lines = [
    rollPotentialLine(cube, headerRank)
  ];

  for (let i = 1; i < 3; i++) {
    let lineRank = rollPotentialLineRank(cube, headerRank);
    if (POTENTIAL_PREVENT_RANK_DROP) {
      lineRank = clampLineRankToOverallWindow(lineRank, headerRank);
    }
    lines.push(rollPotentialLine(cube, lineRank));
  }

  const rank = rollPotentialRank(lines);
  const atkPow = Math.max(
    0,
    (currentPotential?.atkPow || 300000000) + Math.floor((Math.random() - 0.52) * 5000000)
  );

  return { rank, lines, atkPow };
}

const PT_MAIN_STAT_LABELS = new Set(['STR', 'DEX', 'INT', 'LUK']);
const PT_HPMP_STAT_LABELS = new Set(['MaxHP', 'MaxMP']);
const POTENTIAL_BOSS_DAMAGE_LABEL = 'BOSS怪物傷害';
const POTENTIAL_BOSS_DAMAGE_LEGACY_LABEL = 'BOSS怪物攻擊時傷害';
const POTENTIAL_BOSS_DAMAGE_SOURCE_LABEL = '攻擊BOSS怪物時傷害增加';

function formatPotentialBossDamageLabel(label) {
  if (!label || typeof label !== 'string') return label;
  if (label === POTENTIAL_BOSS_DAMAGE_SOURCE_LABEL) return POTENTIAL_BOSS_DAMAGE_LABEL;
  if (label === POTENTIAL_BOSS_DAMAGE_LEGACY_LABEL) return POTENTIAL_BOSS_DAMAGE_LABEL;
  if (label.startsWith(`${POTENTIAL_BOSS_DAMAGE_SOURCE_LABEL}+`)) return POTENTIAL_BOSS_DAMAGE_LABEL;
  return label;
}

function formatPotentialCooldownLabel(label) {
  if (!label || typeof label !== 'string') return label;
  return label.replace(/(所有技能冷卻時間 -)(\d+)$/, '$1$2秒');
}

function formatPotentialDisplayLabel(label) {
  return formatPotentialCooldownLabel(formatPotentialBossDamageLabel(label));
}

function formatPotentialLineDisplay(line) {
  if (!line?.value) return formatPotentialDisplayLabel(line.label);
  const label = formatPotentialDisplayLabel(line.label.replace(/%$/, ''));
  return `${label} +${line.value}`;
}

function splitPotentialLineDisplay(line) {
  if (!line?.value) {
    return { label: formatPotentialDisplayLabel(line.label), value: '', alignGroup: null };
  }

  const label = formatPotentialDisplayLabel(line.label.replace(/%$/, ''));
  let alignGroup = null;
  if (PT_MAIN_STAT_LABELS.has(label)) alignGroup = 'main';
  else if (PT_HPMP_STAT_LABELS.has(label)) alignGroup = 'hpmp';

  return {
    label,
    value: `+${line.value}`,
    alignGroup
  };
}

function formatPotentialAtkPow(value) {
  const n = Math.floor(Number(value) || 0);
  const sign = n < 0 ? '- ' : '';
  const abs = Math.abs(n);
  const yi = Math.floor(abs / 100000000);
  const wan = Math.floor((abs % 100000000) / 10000);
  const rest = abs % 10000;
  let text = '';
  if (yi > 0) text += `${yi}億 `;
  if (wan > 0) text += `${wan}萬 `;
  if (rest > 0 || !text) text += `${rest}`;
  return `${sign}${text.trim()}`;
}
