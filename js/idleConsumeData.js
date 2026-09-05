/**
 * 消耗欄資料庫（ICON／名稱／機率／加乘）。方塊也算消耗。
 * 以現有星力卷、潛能卷、方塊當範例，之後可自行增刪欄位。
 */
function idleConsumeFromStarforce() {
  if (typeof STARFORCE_SCROLLS === 'undefined') return [];
  return STARFORCE_SCROLLS.map((scroll) => ({
    id: `consume-${scroll.id}`,
    consumeType: 'starforce_scroll',
    scrollId: scroll.id,
    name: scroll.name,
    icon: scroll.icon || '',
    rate: Number(scroll.rate) || 0,
    boost: scroll.previewTargetStar
      ? `強化至 ${scroll.previewTargetStar} 星`
      : (scroll.requiredCurrentStar != null
        ? `+1 星（需目前 ${scroll.requiredCurrentStar} 星）`
        : (scroll.maxCurrentStar != null
          ? `+1 星（目前最多 ${scroll.maxCurrentStar} 星）`
          : '+1 星')),
  }));
}

function idleConsumeFromPotentialScrolls() {
  if (typeof POTENTIAL_SCROLLS === 'undefined') return [];
  const gradeLabel = {
    rare: '特殊',
    epic: '稀有',
    unique: '罕見',
    legendary: '傳說',
  };
  return POTENTIAL_SCROLLS.map((scroll) => {
    const pct = /100%/.test(scroll.name) ? 100 : 70;
    const side = scroll.target === 'additional' ? '附加潛能' : '主潛能';
    return {
      id: `consume-${scroll.id}`,
      consumeType: 'potential_scroll',
      scrollId: scroll.id,
      name: scroll.name,
      icon: scroll.icon || '',
      rate: pct,
      boost: `賦予${gradeLabel[scroll.grade] || scroll.grade || ''}（${side}）`,
    };
  });
}

function idleConsumeFromCubes() {
  if (typeof POTENTIAL_CUBE_TYPES === 'undefined') return [];
  const boostById = {
    shiningMirror: '洗潛；第二排有機會複製第一排',
    equal: '洗潛；高階列與整體同階',
    dazzling: '洗潛；可自選要保留的列',
    union: '洗潛；結合兩組潛能',
    restore: '洗潛；可恢復前一次結果',
  };
  return POTENTIAL_CUBE_TYPES.map((cube) => ({
    id: `consume-cube-${cube.id}`,
    consumeType: 'cube',
    cubeId: cube.id,
    name: cube.name,
    icon: cube.icon || '',
    rate: 100,
    boost: boostById[cube.id] || '洗潛（方塊）',
  }));
}

function idleConsumeFromAddCubes() {
  if (typeof ADDPOT_CUBE_TYPES === 'undefined') return [];
  return ADDPOT_CUBE_TYPES.map((cube) => ({
    id: `consume-add-cube-${cube.id}`,
    consumeType: 'add_cube',
    cubeId: cube.id,
    name: cube.name,
    icon: cube.icon || '',
    rate: 100,
    boost: '洗附加潛能（方塊）',
  }));
}

function idleConsumeFromHammers() {
  if (typeof HAMMER_TYPES === 'undefined') return [];
  return Object.values(HAMMER_TYPES).map((hammer) => ({
    id: `consume-hammer-${hammer.id}`,
    consumeType: 'hammer',
    hammerId: hammer.id,
    name: hammer.name,
    icon: hammer.icon || '',
    rate: 100,
    boost: '增加裝備強化次數',
  }));
}

function idleConsumeFromPotions() {
  if (typeof IdlePotionStore === 'undefined') return [];
  return IdlePotionStore.list().map((potion) => ({
    id: `consume-potion-${potion.id}`,
    consumeType: 'potion',
    itemId: potion.id,
    name: potion.name,
    icon: IdlePotionStore.resolveIcon(potion.icon),
    rate: 100,
    boost: IdlePotionStore.formatRecoverLabel(potion),
  }));
}

function idleConsumeFromRecoveryCard() {
  if (typeof RECOVERY_CARD === 'undefined') return [];
  return [{
    id: 'consume-recovery-card',
    consumeType: 'recovery_card',
    itemId: RECOVERY_CARD.id,
    name: RECOVERY_CARD.name,
    icon: RECOVERY_CARD.icon || '',
    rate: 100,
    boost: '卷軸失敗保次數／成功可選擇不套用',
  }];
}

function idleConsumeFromGloryScrolls() {
  const catalogs = [
    ...(typeof getSpecialScrollCatalog === 'function' ? getSpecialScrollCatalog() : []),
    ...(typeof getNormalScrollCatalog === 'function' ? getNormalScrollCatalog() : []),
  ];
  return catalogs.map((scroll) => ({
    id: `consume-glory-${scroll.id}`,
    consumeType: 'glory_scroll',
    scrollId: scroll.id,
    name: scroll.name,
    icon: scroll.icon || '',
    rate: Number(scroll.rate) || 100,
    boost: scroll.tab === (typeof SCROLL_TAB !== 'undefined' ? SCROLL_TAB.NORMAL : 'normal')
      ? '普通卷軸'
      : '榮耀／專用卷軸',
  }));
}

function idleConsumeFromBonusStat() {
  if (typeof BONUS_STAT_ITEMS === 'undefined') return [];
  return BONUS_STAT_ITEMS.map((item) => ({
    id: `consume-bonus-${item.id}`,
    consumeType: 'bonus_stat',
    itemId: item.id,
    name: item.name,
    icon: item.icon || '',
    rate: 100,
    boost: '重設附加能力（星火）',
  }));
}

function idleConsumeFromExceptionalHammers() {
  if (typeof listExceptionalHammers !== 'function') return [];
  return listExceptionalHammers().map((hammer) => ({
    id: `consume-ex-hammer-${hammer.id}`,
    consumeType: 'exceptional_hammer',
    hammerId: hammer.id,
    name: hammer.name,
    icon: hammer.icon || '',
    rate: 100,
    boost: '卓越強化鐵鎚',
  }));
}

function idleConsumeFromSoulMaterials() {
  if (typeof listSoulMaterials !== 'function') return [];
  return listSoulMaterials().map((mat) => ({
    id: `consume-soul-${mat.id}`,
    consumeType: 'soul',
    soulId: mat.id,
    name: mat.name,
    icon: mat.icon || '',
    rate: 100,
    boost: mat.kind === 'enchanter' ? '靈魂武器卷軸' : '靈魂保珠',
  }));
}

function buildIdleConsumeDatabase() {
  return [
    ...idleConsumeFromStarforce(),
    ...idleConsumeFromPotentialScrolls(),
    ...idleConsumeFromCubes(),
    ...idleConsumeFromAddCubes(),
    ...idleConsumeFromHammers(),
    ...idleConsumeFromGloryScrolls(),
    ...idleConsumeFromRecoveryCard(),
    ...idleConsumeFromPotions(),
    ...idleConsumeFromBonusStat(),
    ...idleConsumeFromExceptionalHammers(),
    ...idleConsumeFromSoulMaterials(),
  ];
}

let IDLE_CONSUME_DATABASE = buildIdleConsumeDatabase();

const IdleConsumeStore = {
  refresh() {
    IDLE_CONSUME_DATABASE = buildIdleConsumeDatabase();
    if (typeof window !== 'undefined') window.IDLE_CONSUME_DATABASE = IDLE_CONSUME_DATABASE;
    return IDLE_CONSUME_DATABASE;
  },

  list() {
    if (!IDLE_CONSUME_DATABASE.length) this.refresh();
    return IDLE_CONSUME_DATABASE.slice();
  },

  get(id) {
    const key = String(id || '');
    return this.list().find((row) => row.id === key) || null;
  },

  search(query) {
    const q = String(query || '').trim().toLowerCase();
    if (!q) return this.list();
    return this.list().filter((row) => (
      row.name.toLowerCase().includes(q)
      || row.id.toLowerCase().includes(q)
      || String(row.scrollId || '').toLowerCase().includes(q)
      || String(row.cubeId || '').toLowerCase().includes(q)
    ));
  },
};

if (typeof window !== 'undefined') {
  window.IDLE_CONSUME_DATABASE = IDLE_CONSUME_DATABASE;
  window.IdleConsumeStore = IdleConsumeStore;
  window.IdleConsumeStore = IdleConsumeStore;
}
