const ADDPOT_IMAGE_BASE = 'images/additionalPotentail/';

/** 附加潛能素材：potential.* → additionalPotential.* */
const ADDPOT_IMAGES = {
  notMemorialHelp: `${ADDPOT_IMAGE_BASE}additionalPotential.costItem.layer_notMemorialHelp.png`,
  mesoHelp: `${ADDPOT_IMAGE_BASE}additionalPotential.costMeso.layer_help.png`,
  absoluteB: `${ADDPOT_IMAGE_BASE}absoluteb.png`,
  normalB: `${ADDPOT_IMAGE_BASE}anormalb.png`,
  hexaB: `${ADDPOT_IMAGE_BASE}ahexab.png`,
  uniB: `${ADDPOT_IMAGE_BASE}aunib.png`,
  memoriaB: `${ADDPOT_IMAGE_BASE}amemoriab.png`
};

const ADDPOT_CUBE_TYPES = [
  {
    id: 'precious',
    name: '珍貴附加方塊',
    slotIndex: 0,
    icon: ADDPOT_IMAGES.normalB,
    iconWidth: 32,
    iconHeight: 31,
    mesoCost: 0,
    rateKey: 'precious',
    helpImage: ADDPOT_IMAGES.notMemorialHelp
  },
  {
    id: 'absoluteAdd',
    name: '絕對附加方塊',
    slotIndex: 1,
    icon: ADDPOT_IMAGES.absoluteB,
    iconWidth: 37,
    iconHeight: 35,
    mesoCost: 0,
    rateKey: 'absoluteAdd',
    requiresLegendary: true,
    helpImage: ADDPOT_IMAGES.notMemorialHelp
  },
  {
    id: 'addHexa',
    name: '附加閃炫方塊',
    slotIndex: 2,
    icon: ADDPOT_IMAGES.hexaB,
    iconWidth: 33,
    iconHeight: 34,
    mesoCost: 0,
    rateKey: 'restoreAdd',
    hexaPick: true
  },
  {
    id: 'unionAdd',
    name: '結合附加方塊',
    slotIndex: 3,
    icon: ADDPOT_IMAGES.uniB,
    iconWidth: 35,
    iconHeight: 35,
    mesoCost: 0,
    rateKey: 'unionAdd',
    uniPick: true
  },
  {
    id: 'restoreAdd',
    name: '恢復附加方塊',
    slotIndex: 4,
    icon: ADDPOT_IMAGES.memoriaB,
    iconWidth: 32,
    iconHeight: 31,
    mesoCost: 0,
    rateKey: 'restoreAdd',
    memoriaPick: true,
    helpImage: ADDPOT_IMAGES.mesoHelp
  }
];

const ADDPOT_CUBE_HELP_IMAGES = {
  restoreAdd: ADDPOT_IMAGES.mesoHelp
};

function getAddPotCubeHelpImage(cubeId) {
  const cube = getAddPotCubeById(cubeId);
  if (cube?.helpImage) return cube.helpImage;
  return ADDPOT_CUBE_HELP_IMAGES[cubeId] || null;
}

let playerAddPotCubeCounts = {
  precious: DEFAULT_CUBE_COUNT,
  restoreAdd: DEFAULT_CUBE_COUNT,
  addHexa: DEFAULT_CUBE_COUNT,
  absoluteAdd: DEFAULT_CUBE_COUNT,
  unionAdd: DEFAULT_CUBE_COUNT
};

function getPlayerAddPotCubeCount(cubeId) {
  const count = playerAddPotCubeCounts[cubeId];
  if (!count || count <= 0) {
    playerAddPotCubeCounts[cubeId] = DEFAULT_CUBE_COUNT;
    return DEFAULT_CUBE_COUNT;
  }
  return count;
}

/** 附加方塊每次使用楓幣：200 等 80 萬、250 等 125 萬 */
function getAddPotentialCubeMesoCost(item) {
  const lv = Number(item?.reqLevel) || 0;
  if (lv >= 250) return 1250000;
  return 800000;
}

function consumePlayerAddPotCube(cubeId) {
  const count = getPlayerAddPotCubeCount(cubeId);
  playerAddPotCubeCounts[cubeId] = count - 1;
  if (playerAddPotCubeCounts[cubeId] <= 0) {
    playerAddPotCubeCounts[cubeId] = DEFAULT_CUBE_COUNT;
  }
  trackCostUsage('addCube', cubeId);
  const item = (typeof AddPotentialModule !== 'undefined' && AddPotentialModule.itemData)
    || (typeof currentEnchantItem !== 'undefined' ? currentEnchantItem : null);
  const meso = getAddPotentialCubeMesoCost(item);
  if (meso > 0 && typeof trackCostEvent === 'function') {
    trackCostEvent('addPotentialMeso', meso);
  }
  return true;
}

function getAddPotCubeById(cubeId) {
  return ADDPOT_CUBE_TYPES.find((cube) => cube.id === cubeId) || null;
}

function getAddPotCubeBySlot(slotIndex) {
  return ADDPOT_CUBE_TYPES.find((cube) => cube.slotIndex === slotIndex) || null;
}

function isAddPotLegendaryRank(rank) {
  return rank === 'legendary';
}

function getAddPotCubeBlockReason(cube, itemData) {
  if (!cube || !itemData) return null;
  if (typeof isMedalItem === 'function' && isMedalItem(itemData)) {
    return '勳章無法使用方塊洗附加潛能';
  }
  if (!itemData.additionalPotential) return null;
  if (cube.requiresLegendary && !isAddPotLegendaryRank(itemData.additionalPotential.rank)) {
    return '絕對附加方塊僅限傳說等級附加潛能裝備使用';
  }
  return null;
}

function canUseAddPotCube(cube, itemData) {
  return !getAddPotCubeBlockReason(cube, itemData);
}

function getDefaultAddPotentialState(reqLevel = 250) {
  const mpPct = typeof formatAddPotentialStatValue === 'function'
    ? formatAddPotentialStatValue('最大MP%', 'rare', reqLevel)
    : '3%';
  const strPct = typeof formatAddPotentialStatValue === 'function'
    ? formatAddPotentialStatValue('STR%', 'rare', reqLevel)
    : '3%';
  return {
    rank: 'rare',
    lines: [
      { rank: 'rare', label: 'MaxMP', value: mpPct },
      { rank: 'rare', label: 'MaxMP', value: mpPct },
      { rank: 'rare', label: 'STR', value: strPct }
    ],
    atkPow: 397803310
  };
}

function getEmptyAddPotentialState() {
  return {
    rank: 'legendary',
    lines: [],
    atkPow: 0
  };
}

function rerollAddPotential(cube, currentPotential, item) {
  if (cube.rateKey && typeof rerollAddPotWithCube === 'function') {
    return rerollAddPotWithCube(cube, item, currentPotential);
  }
  return rerollPotential(cube, currentPotential, item);
}
