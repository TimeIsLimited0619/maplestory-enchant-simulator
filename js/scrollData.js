// ==========================================
// 1. 卷軸分類與背包格設定
// ==========================================

const SCROLL_TAB = {
  SPECIAL: 'special',
  TRACE: 'trace'
};

const SCROLL_TYPE = {
  FIXED: 'fixed',
  BLACK: 'black',
  GLORY: 'glory',
  DESTINY: 'destiny',
  SAVIOR: 'savior',
  RAINBOW: 'rainbow',
  CHAOS: 'chaos'
};

const SCROLL_EQUIP_TARGET = {
  ARMOR: 'armor',
  WEAPON: 'weapon',
  ACCESSORY: 'accessory',
  ONE_HAND_WEAPON: 'one_hand_weapon',
  TWO_HAND_WEAPON: 'two_hand_weapon'
};

/** 專用卷軸欄：總共 5 排 × 9 格，可視 2 排，滾輪捲動（格距對齊星火背包） */
const SCROLL_GRID_COLS = 9;
const SCROLL_GRID_ROWS = 5;
const SCROLL_VISIBLE_ROWS = 2;
const SCROLL_SLOT_SIZE = 38;
const SCROLL_SLOT_GAP = 3;
const SCROLL_SLOT_COUNT = SCROLL_GRID_COLS * SCROLL_GRID_ROWS;

/** 選中框（scroll.costScroll.inven.selected）相對格子左上角，對齊星火 itemSlotSelected */
const SCROLL_SLOT_SELECTED = {
  x: -2,
  y: -1,
  width: 40,
  height: 40,
};

/** 專用卷軸 icon 原始尺寸（比照方塊背包 iconWidth/iconHeight） */
const SCROLL_ICON_NATIVE_SIZE = {
  'images/scroll/black.png': { w: 41, h: 40 },
  'images/scroll/glory.png': { w: 34, h: 31 },
  'images/scroll/destiny.png': { w: 35, h: 34 },
  'images/scroll/savior.png': { w: 41, h: 37 },
  'images/scroll/rainbow.png': { w: 34, h: 31 },
  'images/scroll/recover.png': { w: 30, h: 26 },
  'images/scroll/whiterecover.png': { w: 30, h: 26 },
  'images/scroll/arkrecover.png': { w: 30, h: 26 },
  'images/scroll/chaos.png': { w: 30, h: 26 },
};

function getScrollIconSize(scroll) {
  if (scroll?.iconWidth && scroll?.iconHeight) {
    return { w: scroll.iconWidth, h: scroll.iconHeight };
  }
  const known = SCROLL_ICON_NATIVE_SIZE[scroll?.icon];
  return known ? { w: known.w, h: known.h } : { w: 34, h: 31 };
}

// scrolldata 檔名規則：{系列}{裝備種類}{屬性}.png
// 系列：b=究極 g=榮耀 d=命運 s=救世 r=星彩
// 裝備：a=防具 w=武器 c=飾品
// 屬性：ad=攻擊力 md=魔法攻擊力 st=屬性
const SCROLL_DETAIL_TYPE_CODE = {
  [SCROLL_TYPE.BLACK]: 'b',
  [SCROLL_TYPE.GLORY]: 'g',
  [SCROLL_TYPE.DESTINY]: 'd',
  [SCROLL_TYPE.SAVIOR]: 's',
  [SCROLL_TYPE.RAINBOW]: 'r'
};

const SCROLL_DETAIL_EQUIP_CODE = {
  [SCROLL_EQUIP_TARGET.ARMOR]: 'a',
  [SCROLL_EQUIP_TARGET.WEAPON]: 'w',
  [SCROLL_EQUIP_TARGET.ACCESSORY]: 'c',
  [SCROLL_EQUIP_TARGET.ONE_HAND_WEAPON]: 'oh',
  [SCROLL_EQUIP_TARGET.TWO_HAND_WEAPON]: 'th'
};

const SCROLL_DETAIL_STAT_CODE = {
  scrollAtk: 'ad',
  scrollMatk: 'md',
  scrollStat: 'st'
};

const SCROLL_DETAIL_IMAGE_DIR = 'images/scrolldata';

// ==========================================
// 2. 恢復卡設定
// ==========================================

const RECOVERY_CARD = {
  id: 'recovery_card',
  name: '恢復卡',
  icon: 'images/scroll/scroll.costScroll.switchSpecialScroll.icon.returnConsume.png',
  switchChecked: 'images/scroll/scroll.costScroll.switchSpecialScroll.checked.0.png',
  switchPressed: 'images/scroll/scroll.costScroll.switchSpecialScroll.pressed.0.png'
};

const DEFAULT_RECOVERY_CARD_COUNT = 99;
let playerRecoveryCardCount = DEFAULT_RECOVERY_CARD_COUNT;

// ==========================================
// 3. 隨機骰值卷軸機率表
// ==========================================

const GLORY_RATE_TABLE = {
  armor: [
    { val: 5, rate: 1 }, { val: 6, rate: 2 }, { val: 7, rate: 4 }, { val: 8, rate: 6 },
    { val: 9, rate: 31 }, { val: 10, rate: 28 }, { val: 11, rate: 13 }, { val: 12, rate: 7 },
    { val: 13, rate: 5 }, { val: 14, rate: 2 }, { val: 15, rate: 1 }
  ],
  weapon: [
    { val: 10, rate: 1 }, { val: 11, rate: 2 }, { val: 12, rate: 4 }, { val: 13, rate: 6 },
    { val: 14, rate: 31 }, { val: 15, rate: 28 }, { val: 16, rate: 13 }, { val: 17, rate: 7 },
    { val: 18, rate: 5 }, { val: 19, rate: 2 }, { val: 20, rate: 1 }
  ]
};
/** 飾品與防具共用同一骰值表 */
GLORY_RATE_TABLE.accessory = GLORY_RATE_TABLE.armor;

// 測試用：true = 榮耀卷軸必定洗出最高數值
const GLORY_FORCE_MAX_ROLL = false;

const DESTINY_RATE_TABLE = {
  armor: [
    { val: 7, rate: 4 }, { val: 8, rate: 6 }, { val: 9, rate: 31 }, { val: 10, rate: 30 },
    { val: 11, rate: 14 }, { val: 12, rate: 7 }, { val: 13, rate: 5 }, { val: 14, rate: 2 },
    { val: 15, rate: 1 }
  ],
  weapon: [
    { val: 12, rate: 4 }, { val: 13, rate: 6 }, { val: 14, rate: 31 }, { val: 15, rate: 30 },
    { val: 16, rate: 14 }, { val: 17, rate: 7 }, { val: 18, rate: 5 }, { val: 19, rate: 2 },
    { val: 20, rate: 1 }
  ]
};
DESTINY_RATE_TABLE.accessory = DESTINY_RATE_TABLE.armor;

const SAVIOR_RATE_TABLE = {
  armor: [
    { val: 10, rate: 35 }, { val: 11, rate: 30 }, { val: 12, rate: 15 },
    { val: 13, rate: 8 }, { val: 14, rate: 7 }, { val: 15, rate: 5 }
  ],
  weapon: [
    { val: 15, rate: 35 }, { val: 16, rate: 30 }, { val: 17, rate: 15 },
    { val: 18, rate: 8 }, { val: 19, rate: 7 }, { val: 20, rate: 5 }
  ]
};
SAVIOR_RATE_TABLE.accessory = SAVIOR_RATE_TABLE.armor;

const RAINBOW_RATE_TABLE = {
  armor: [
    { val: 11, rate: 10 }, { val: 12, rate: 22 }, { val: 13, rate: 28 },
    { val: 14, rate: 18 }, { val: 15, rate: 12 }, { val: 16, rate: 10 }
  ],
  weapon: [
    { val: 16, rate: 10 }, { val: 17, rate: 22 }, { val: 18, rate: 28 },
    { val: 19, rate: 18 }, { val: 20, rate: 12 }, { val: 21, rate: 10 }
  ]
};
RAINBOW_RATE_TABLE.accessory = RAINBOW_RATE_TABLE.armor;

const RANDOM_RATE_TABLES = {
  glory: GLORY_RATE_TABLE,
  destiny: DESTINY_RATE_TABLE,
  savior: SAVIOR_RATE_TABLE,
  rainbow: RAINBOW_RATE_TABLE
};

/**
 * 貓谷卷軸骰值：相對正服 T+2（循環）
 * 例：T1→T3 機率、…、T10→T1、T11→T2（超出階數迴圈回最高階）
 */
const SCROLL_CAT_VALLEY_TIER_SHIFT = 2;

/** true = 貓谷機率（T+2）；false = 正服機率。未解鎖密籍時一律視為正服。 */
let scrollUseCatValleyRates = false;

function isScrollCatValleyRatesEnabled() {
  if (typeof isCatValleyContentUnlocked !== 'function' || !isCatValleyContentUnlocked()) {
    return false;
  }
  return scrollUseCatValleyRates !== false;
}

function setScrollCatValleyRatesEnabled(enabled) {
  scrollUseCatValleyRates = Boolean(enabled);
}

/**
 * 依數值由高到低視為 T1、T2…；每階改用「低 shift 階」的正服機率（超出則循環）。
 * @param {Array<{val:number, rate:number}>} rates
 * @param {number} [shift=2]
 */
function applyScrollRateTierShift(rates, shift = SCROLL_CAT_VALLEY_TIER_SHIFT) {
  if (!Array.isArray(rates) || !rates.length || !shift) {
    return (rates || []).map((entry) => ({ ...entry }));
  }
  const sortedDesc = rates
    .map((entry, index) => ({ ...entry, _i: index }))
    .sort((a, b) => b.val - a.val || a._i - b._i);
  const n = sortedDesc.length;
  const officialRatesDesc = sortedDesc.map((entry) => entry.rate);
  const shifted = sortedDesc.map((entry, tierIndex) => {
    const srcIndex = (tierIndex + shift) % n;
    return { val: entry.val, rate: officialRatesDesc[srcIndex] };
  });
  // 還原為原表順序（通常由低到高）
  const byVal = new Map(shifted.map((entry) => [entry.val, entry.rate]));
  return rates.map((entry) => ({
    val: entry.val,
    rate: byVal.has(entry.val) ? byVal.get(entry.val) : entry.rate,
  }));
}

/** 驚訝的混沌卷軸：各屬性獨立骰值（%） */
const CHAOS_RATE_TABLE = [
  { val: 7, rate: 4 },
  { val: 6, rate: 5 },
  { val: 4, rate: 4 },
  { val: 3, rate: 13 },
  { val: 2, rate: 23 },
  { val: 1, rate: 33 },
  { val: 0, rate: 18 }
];

/** 混沌卷軸影響屬性；HP/MP 以骰值 ×10 改變 */
const CHAOS_STAT_DEFS = [
  { key: 'atk', field: 'scrollAtk', label: '攻擊力', mult: 1 },
  { key: 'matk', field: 'scrollMatk', label: '魔法攻擊力', mult: 1 },
  { key: 'str', field: 'scrollStr', label: 'STR', mult: 1 },
  { key: 'dex', field: 'scrollDex', label: 'DEX', mult: 1 },
  { key: 'int', field: 'scrollInt', label: 'INT', mult: 1 },
  { key: 'luk', field: 'scrollLuk', label: 'LUK', mult: 1 },
  { key: 'def', field: 'scrollDef', label: '防禦力', mult: 1 },
  { key: 'speed', field: 'scrollSpeed', label: '移動速度', mult: 1 },
  { key: 'jump', field: 'scrollJump', label: '跳躍力', mult: 1 },
  { key: 'hp', field: 'scrollHp', label: '最大HP', mult: 10 },
  { key: 'mp', field: 'scrollMp', label: '最大MP', mult: 10 }
];

const SCROLL_EXTRA_BONUS_FIELDS = [
  'scrollStr', 'scrollDex', 'scrollInt', 'scrollLuk',
  'scrollDef', 'scrollHp', 'scrollMp', 'scrollSpeed', 'scrollJump',
  'scrollDamR', 'scrollBdR', 'scrollImdR', 'scrollAllStatR'
];

/** 武器卷軸：四屬＋攻擊／魔力各自獨立骰同一機率表 */
const WEAPON_MULTI_STAT_ATK = [
  { label: 'STR', field: 'scrollStr' },
  { label: 'INT', field: 'scrollInt' },
  { label: 'DEX', field: 'scrollDex' },
  { label: 'LUK', field: 'scrollLuk' },
  { label: '攻擊力', field: 'scrollAtk' }
];

const WEAPON_MULTI_STAT_MATK = [
  { label: 'STR', field: 'scrollStr' },
  { label: 'INT', field: 'scrollInt' },
  { label: 'DEX', field: 'scrollDex' },
  { label: 'LUK', field: 'scrollLuk' },
  { label: '魔力', field: 'scrollMatk' }
];

/** 混沌卷自動強化目標：與武器攻擊卷相同（四屬＋攻擊） */
const CHAOS_AUTO_TARGET_DEFS = WEAPON_MULTI_STAT_ATK;

const gloryRatesArmor = GLORY_RATE_TABLE.armor;
const gloryRatesWeapon = GLORY_RATE_TABLE.weapon;

// ==========================================
// 4. 專用卷軸資料庫
// ==========================================
// equipTarget：armor | weapon | accessory
// scrollType black → 不使用恢復卡；glory/destiny/savior/rainbow → 可選恢復卡

const SCROLL_DATABASE = {

  scroll_glory_one_hand_weapon_atk: {
    id: 'scroll_glory_one_hand_weapon_atk',
    slotIndex: 0,
    name: '榮耀單手武器攻擊力卷軸',
    tab: SCROLL_TAB.SPECIAL,
    scrollType: SCROLL_TYPE.GLORY,
    equipTarget: SCROLL_EQUIP_TARGET.ONE_HAND_WEAPON,
    rate: 100,
    icon: 'images/scroll/glory.png',
    multiStatRoll: {
      tableKey: 'glory',
      ratesKey: 'weapon',
      stats: WEAPON_MULTI_STAT_ATK
    }
  },

  scroll_glory_one_hand_weapon_matk: {
    id: 'scroll_glory_one_hand_weapon_matk',
    slotIndex: 1,
    name: '榮耀單手武器魔力卷軸',
    tab: SCROLL_TAB.SPECIAL,
    scrollType: SCROLL_TYPE.GLORY,
    equipTarget: SCROLL_EQUIP_TARGET.ONE_HAND_WEAPON,
    rate: 100,
    icon: 'images/scroll/glory.png',
    multiStatRoll: {
      tableKey: 'glory',
      ratesKey: 'weapon',
      stats: WEAPON_MULTI_STAT_MATK
    } 
  },

  scroll_glory_two_hand_weapon_atk: {
    id: 'scroll_glory_two_hand_weapon_atk',
    slotIndex: 2,
    name: '榮耀雙手武器攻擊力卷軸',
    tab: SCROLL_TAB.SPECIAL,
    scrollType: SCROLL_TYPE.GLORY,
    equipTarget: SCROLL_EQUIP_TARGET.TWO_HAND_WEAPON,
    rate: 100,
    icon: 'images/scroll/glory.png',
    multiStatRoll: {
      tableKey: 'glory',
      ratesKey: 'weapon',
      stats: WEAPON_MULTI_STAT_ATK
    }
  },

  scroll_glory_two_hand_weapon_matk: {
    id: 'scroll_glory_two_hand_weapon_matk',
    slotIndex: 3,
    name: '榮耀雙手武器魔力卷軸',
    tab: SCROLL_TAB.SPECIAL,
    scrollType: SCROLL_TYPE.GLORY,
    equipTarget: SCROLL_EQUIP_TARGET.TWO_HAND_WEAPON,
    rate: 100,
    icon: 'images/scroll/glory.png',
    multiStatRoll: {
      tableKey: 'glory',
      ratesKey: 'weapon',
      stats: WEAPON_MULTI_STAT_MATK
    }
  },

  scroll_glory_armor_atk: {
    id: 'scroll_glory_armor_atk',
    slotIndex: 4,
    name: '榮耀防具攻擊力卷軸',
    tab: SCROLL_TAB.SPECIAL,
    scrollType: SCROLL_TYPE.GLORY,
    equipTarget: SCROLL_EQUIP_TARGET.ARMOR,
    rate: 100,
    icon: 'images/scroll/glory.png',
    randomRoll: {
      statLabel: '攻擊力',
      statField: 'scrollAtk',
      tableKey: 'glory',
      ratesKey: 'armor'
    }
  },

  scroll_glory_armor_matk: {
    id: 'scroll_glory_armor_matk',
    slotIndex: 5,
    name: '榮耀防具魔力卷軸',
    tab: SCROLL_TAB.SPECIAL,
    scrollType: SCROLL_TYPE.GLORY,
    equipTarget: SCROLL_EQUIP_TARGET.ARMOR,
    rate: 100,
    icon: 'images/scroll/glory.png',
    randomRoll: {
      statLabel: '魔力',
      statField: 'scrollMatk',
      tableKey: 'glory',
      ratesKey: 'armor'
    }
  },

  scroll_glory_accessory_atk: {
    id: 'scroll_glory_accessory_atk',
    slotIndex: 6,
    name: '榮耀飾品攻擊力卷軸',
    tab: SCROLL_TAB.SPECIAL,
    scrollType: SCROLL_TYPE.GLORY,
    equipTarget: SCROLL_EQUIP_TARGET.ACCESSORY,
    rate: 100,
    icon: 'images/scroll/glory.png',
    randomRoll: {
      statLabel: '攻擊力',
      statField: 'scrollAtk',
      tableKey: 'glory',
      ratesKey: 'accessory'
    }
  },

  scroll_glory_accessory_matk: {
    id: 'scroll_glory_accessory_matk',
    slotIndex: 7,
    name: '榮耀飾品魔力卷軸',
    tab: SCROLL_TAB.SPECIAL,
    scrollType: SCROLL_TYPE.GLORY,
    equipTarget: SCROLL_EQUIP_TARGET.ACCESSORY,
    rate: 100,
    icon: 'images/scroll/glory.png',
    randomRoll: {
      statLabel: '魔力',
      statField: 'scrollMatk',
      tableKey: 'glory',
      ratesKey: 'accessory'
    }
  },
  
  scroll_chaos: {
    id: 'scroll_chaos',
    gameId: '02049116',
    slotIndex: 8,
    name: '驚訝的混沌卷軸60%',
    tab: SCROLL_TAB.SPECIAL,
    scrollType: SCROLL_TYPE.CHAOS,
    rate: 60,
    icon: 'images/scroll/chaos.png',
    detailKey: 'incredible_chaos_60',
    stats: [
      { label: '各屬性隨機增減', val: '' },
      { label: '最大HP、MP各改變10', val: '' }
    ]
  },

  scroll_destiny_one_hand_weapon_atk: {
    id: 'scroll_destiny_one_hand_weapon_atk',
    slotIndex: 9,
    name: '命運單手武器攻擊力卷軸',
    tab: SCROLL_TAB.SPECIAL,
    scrollType: SCROLL_TYPE.DESTINY,
    equipTarget: SCROLL_EQUIP_TARGET.ONE_HAND_WEAPON,
    rate: 100,
    icon: 'images/scroll/destiny.png',
    multiStatRoll: {
      tableKey: 'destiny',
      ratesKey: 'weapon',
      stats: WEAPON_MULTI_STAT_ATK
    }
  },

  scroll_destiny_one_hand_weapon_matk: {
    id: 'scroll_destiny_one_hand_weapon_matk',
    slotIndex: 10,
    name: '命運單手武器魔力卷軸',
    tab: SCROLL_TAB.SPECIAL,
    scrollType: SCROLL_TYPE.DESTINY,
    equipTarget: SCROLL_EQUIP_TARGET.ONE_HAND_WEAPON,
    rate: 100,
    icon: 'images/scroll/destiny.png',
    multiStatRoll: {
      tableKey: 'destiny',
      ratesKey: 'weapon',
      stats: WEAPON_MULTI_STAT_MATK
    }
  },

  scroll_destiny_two_hand_weapon_atk: {
    id: 'scroll_destiny_two_hand_weapon_atk',
    slotIndex: 11,
    name: '命運雙手武器攻擊力卷軸',
    tab: SCROLL_TAB.SPECIAL,
    scrollType: SCROLL_TYPE.DESTINY,
    equipTarget: SCROLL_EQUIP_TARGET.TWO_HAND_WEAPON,
    rate: 100,
    icon: 'images/scroll/destiny.png',
    multiStatRoll: {
      tableKey: 'destiny',
      ratesKey: 'weapon',
      stats: WEAPON_MULTI_STAT_ATK
    }
  },

  scroll_destiny_two_hand_weapon_matk: {
    id: 'scroll_destiny_two_hand_weapon_matk',
    slotIndex: 12,
    name: '命運雙手武器魔力卷軸',
    tab: SCROLL_TAB.SPECIAL,
    scrollType: SCROLL_TYPE.DESTINY,
    equipTarget: SCROLL_EQUIP_TARGET.TWO_HAND_WEAPON,
    rate: 100,
    icon: 'images/scroll/destiny.png',
    multiStatRoll: {
      tableKey: 'destiny',
      ratesKey: 'weapon',
      stats: WEAPON_MULTI_STAT_MATK
    }
  },

  scroll_destiny_armor_atk: {
    id: 'scroll_destiny_armor_atk',
    slotIndex: 13,
    name: '命運防具攻擊力卷軸',
    tab: SCROLL_TAB.SPECIAL,
    scrollType: SCROLL_TYPE.DESTINY,
    equipTarget: SCROLL_EQUIP_TARGET.ARMOR,
    maxEquipLevel: 200,
    rate: 100,
    icon: 'images/scroll/destiny.png',
    randomRoll: {
      statLabel: '攻擊力',
      statField: 'scrollAtk',
      tableKey: 'destiny',
      ratesKey: 'armor'
    }
  },

  scroll_destiny_armor_matk: {
    id: 'scroll_destiny_armor_matk',
    slotIndex: 14,
    name: '命運防具魔力卷軸',
    tab: SCROLL_TAB.SPECIAL,
    scrollType: SCROLL_TYPE.DESTINY,
    equipTarget: SCROLL_EQUIP_TARGET.ARMOR,
    maxEquipLevel: 200,
    rate: 100,
    icon: 'images/scroll/destiny.png',
    randomRoll: {
      statLabel: '魔力',
      statField: 'scrollMatk',
      tableKey: 'destiny',
      ratesKey: 'armor'
    }
  },

  scroll_destiny_accessory_atk: {
    id: 'scroll_destiny_accessory_atk',
    slotIndex: 15,
    name: '命運飾品攻擊力卷軸',
    tab: SCROLL_TAB.SPECIAL,
    scrollType: SCROLL_TYPE.DESTINY,
    equipTarget: SCROLL_EQUIP_TARGET.ACCESSORY,
    rate: 100,
    icon: 'images/scroll/destiny.png',
    randomRoll: {
      statLabel: '攻擊力',
      statField: 'scrollAtk',
      tableKey: 'destiny',
      ratesKey: 'accessory'
    }
  },

  scroll_destiny_accessory_matk: {
    id: 'scroll_destiny_accessory_matk',
    slotIndex: 16,
    name: '命運飾品魔力卷軸',
    tab: SCROLL_TAB.SPECIAL,
    scrollType: SCROLL_TYPE.DESTINY,
    equipTarget: SCROLL_EQUIP_TARGET.ACCESSORY,
    rate: 100,
    icon: 'images/scroll/destiny.png',
    randomRoll: {
      statLabel: '魔力',
      statField: 'scrollMatk',
      tableKey: 'destiny',
      ratesKey: 'accessory'
    }
  },

  scroll_savior_one_hand_weapon_atk: {
    id: 'scroll_savior_one_hand_weapon_atk',
    slotIndex: 18,
    name: '救世單手武器攻擊力卷軸',
    tab: SCROLL_TAB.SPECIAL,
    scrollType: SCROLL_TYPE.SAVIOR,
    equipTarget: SCROLL_EQUIP_TARGET.ONE_HAND_WEAPON,
    rate: 100,
    icon: 'images/scroll/savior.png',
    multiStatRoll: {
      tableKey: 'savior',
      ratesKey: 'weapon',
      stats: WEAPON_MULTI_STAT_ATK
    }
  },

  scroll_savior_one_hand_weapon_matk: {
    id: 'scroll_savior_one_hand_weapon_matk',
    slotIndex: 19,
    name: '救世單手武器魔力卷軸',
    tab: SCROLL_TAB.SPECIAL,
    scrollType: SCROLL_TYPE.SAVIOR,
    equipTarget: SCROLL_EQUIP_TARGET.ONE_HAND_WEAPON,
    rate: 100,
    icon: 'images/scroll/savior.png',
    multiStatRoll: {
      tableKey: 'savior',
      ratesKey: 'weapon',
      stats: WEAPON_MULTI_STAT_MATK
    }
  },

  scroll_savior_two_hand_weapon_atk: {
    id: 'scroll_savior_two_hand_weapon_atk',
    slotIndex: 20,
    name: '救世雙手武器攻擊力卷軸',
    tab: SCROLL_TAB.SPECIAL,
    scrollType: SCROLL_TYPE.SAVIOR,
    equipTarget: SCROLL_EQUIP_TARGET.TWO_HAND_WEAPON,
    rate: 100,
    icon: 'images/scroll/savior.png',
    multiStatRoll: {
      tableKey: 'savior',
      ratesKey: 'weapon',
      stats: WEAPON_MULTI_STAT_ATK
    }
  },

  scroll_savior_two_hand_weapon_matk: {
    id: 'scroll_savior_two_hand_weapon_matk',
    slotIndex: 21,
    name: '救世雙手武器魔力卷軸',
    tab: SCROLL_TAB.SPECIAL,
    scrollType: SCROLL_TYPE.SAVIOR,
    equipTarget: SCROLL_EQUIP_TARGET.TWO_HAND_WEAPON,
    rate: 100,
    icon: 'images/scroll/savior.png',
    multiStatRoll: {
      tableKey: 'savior',
      ratesKey: 'weapon',
      stats: WEAPON_MULTI_STAT_MATK
    }
  },

  scroll_savior_armor_atk: {
    id: 'scroll_savior_armor_atk',
    slotIndex: 22,
    name: '救世防具攻擊力卷軸',
    tab: SCROLL_TAB.SPECIAL,
    scrollType: SCROLL_TYPE.SAVIOR,
    equipTarget: SCROLL_EQUIP_TARGET.ARMOR,
    rate: 100,
    icon: 'images/scroll/savior.png',
    randomRoll: {
      statLabel: '攻擊力',
      statField: 'scrollAtk',
      tableKey: 'savior',
      ratesKey: 'armor'
    }
  },
  scroll_savior_armor_matk: {
    id: 'scroll_savior_armor_matk',
    slotIndex: 23,
    name: '救世防具魔力卷軸',
    tab: SCROLL_TAB.SPECIAL,
    scrollType: SCROLL_TYPE.SAVIOR,
    equipTarget: SCROLL_EQUIP_TARGET.ARMOR,
    rate: 100,
    icon: 'images/scroll/savior.png',
    randomRoll: {
      statLabel: '魔力',
      statField: 'scrollMatk',
      tableKey: 'savior',
      ratesKey: 'armor'
    }
  },
  scroll_savior_accessory_atk: {
    id: 'scroll_savior_accessory_atk',
    slotIndex: 24,
    name: '救世飾品攻擊力卷軸',
    tab: SCROLL_TAB.SPECIAL,
    scrollType: SCROLL_TYPE.SAVIOR,
    equipTarget: SCROLL_EQUIP_TARGET.ACCESSORY,
    rate: 100,
    icon: 'images/scroll/savior.png',
    randomRoll: {
      statLabel: '攻擊力',
      statField: 'scrollAtk',
      tableKey: 'savior',
      ratesKey: 'accessory'
    }
  },
  scroll_savior_accessory_matk: {
    id: 'scroll_savior_accessory_matk',
    slotIndex: 25,
    name: '救世飾品魔力卷軸',
    tab: SCROLL_TAB.SPECIAL,
    scrollType: SCROLL_TYPE.SAVIOR,
    equipTarget: SCROLL_EQUIP_TARGET.ACCESSORY,
    rate: 100,
    icon: 'images/scroll/savior.png',
    randomRoll: {
      statLabel: '魔力',
      statField: 'scrollMatk',
      tableKey: 'savior',
      ratesKey: 'accessory'
    }
  },

  scroll_rainbow_one_hand_weapon_atk: {
    id: 'scroll_rainbow_one_hand_weapon_atk',
    slotIndex: 27,
    name: '星彩單手武器攻擊力卷軸',
    tab: SCROLL_TAB.SPECIAL,
    scrollType: SCROLL_TYPE.RAINBOW,
    equipTarget: SCROLL_EQUIP_TARGET.ONE_HAND_WEAPON,
    rate: 100,
    icon: 'images/scroll/rainbow.png',
    multiStatRoll: {
      tableKey: 'rainbow',
      ratesKey: 'weapon',
      stats: WEAPON_MULTI_STAT_ATK
    }
  },

  scroll_rainbow_one_hand_weapon_matk: {
    id: 'scroll_rainbow_one_hand_weapon_matk',
    slotIndex: 28,
    name: '星彩單手武器魔力卷軸',
    tab: SCROLL_TAB.SPECIAL,
    scrollType: SCROLL_TYPE.RAINBOW,
    equipTarget: SCROLL_EQUIP_TARGET.ONE_HAND_WEAPON,
    rate: 100,
    icon: 'images/scroll/rainbow.png',
    multiStatRoll: {
      tableKey: 'rainbow',
      ratesKey: 'weapon',
      stats: WEAPON_MULTI_STAT_MATK
    }
  },

  scroll_rainbow_two_hand_weapon_atk: {
    id: 'scroll_rainbow_two_hand_weapon_atk',
    slotIndex: 29,
    name: '星彩雙手武器攻擊力卷軸',
    tab: SCROLL_TAB.SPECIAL,
    scrollType: SCROLL_TYPE.RAINBOW,
    equipTarget: SCROLL_EQUIP_TARGET.TWO_HAND_WEAPON,
    rate: 100,
    icon: 'images/scroll/rainbow.png',
    multiStatRoll: {
      tableKey: 'rainbow',
      ratesKey: 'weapon',
      stats: WEAPON_MULTI_STAT_ATK
    }
  },

  scroll_rainbow_two_hand_weapon_matk: {
    id: 'scroll_rainbow_two_hand_weapon_matk',
    slotIndex: 30,
    name: '星彩雙手武器魔力卷軸',
    tab: SCROLL_TAB.SPECIAL,
    scrollType: SCROLL_TYPE.RAINBOW,
    equipTarget: SCROLL_EQUIP_TARGET.TWO_HAND_WEAPON,
    rate: 100,
    icon: 'images/scroll/rainbow.png',
    multiStatRoll: {
      tableKey: 'rainbow',
      ratesKey: 'weapon',
      stats: WEAPON_MULTI_STAT_MATK
    }
  },

  scroll_rainbow_armor_atk: {
    id: 'scroll_rainbow_armor_atk',
    slotIndex: 31,
    name: '星彩防具攻擊力卷軸',
    tab: SCROLL_TAB.SPECIAL,
    scrollType: SCROLL_TYPE.RAINBOW,
    equipTarget: SCROLL_EQUIP_TARGET.ARMOR,
    rate: 100,
    icon: 'images/scroll/rainbow.png',
    randomRoll: {
      statLabel: '攻擊力',
      statField: 'scrollAtk',
      tableKey: 'rainbow',
      ratesKey: 'armor'
    }
  },
  scroll_rainbow_armor_matk: {
    id: 'scroll_rainbow_armor_matk',
    slotIndex: 32,
    name: '星彩防具魔力卷軸',
    tab: SCROLL_TAB.SPECIAL,
    scrollType: SCROLL_TYPE.RAINBOW,
    equipTarget: SCROLL_EQUIP_TARGET.ARMOR,
    rate: 100,
    icon: 'images/scroll/rainbow.png',
    randomRoll: {
      statLabel: '魔力',
      statField: 'scrollMatk',
      tableKey: 'rainbow',
      ratesKey: 'armor'
    }
  },
  scroll_rainbow_accessory_atk: {
    id: 'scroll_rainbow_accessory_atk',
    slotIndex: 33,
    name: '星彩飾品攻擊力卷軸',
    tab: SCROLL_TAB.SPECIAL,
    scrollType: SCROLL_TYPE.RAINBOW,
    equipTarget: SCROLL_EQUIP_TARGET.ACCESSORY,
    rate: 100,
    icon: 'images/scroll/rainbow.png',
    randomRoll: {
      statLabel: '攻擊力',
      statField: 'scrollAtk',
      tableKey: 'rainbow',
      ratesKey: 'accessory'
    }
  },
  scroll_rainbow_accessory_matk: {
    id: 'scroll_rainbow_accessory_matk',
    slotIndex: 34,
    name: '星彩飾品魔力卷軸',
    tab: SCROLL_TAB.SPECIAL,
    scrollType: SCROLL_TYPE.RAINBOW,
    equipTarget: SCROLL_EQUIP_TARGET.ACCESSORY,
    rate: 100,
    icon: 'images/scroll/rainbow.png',
    randomRoll: {
      statLabel: '魔力',
      statField: 'scrollMatk',
      tableKey: 'rainbow',
      ratesKey: 'accessory'
    }
  },

  scroll_black_one_hand_weapon_atk: {
    id: 'scroll_black_one_hand_weapon_atk',
    slotIndex: 36,
    name: '究極的黑暗單手武器攻擊力卷軸',
    tab: SCROLL_TAB.SPECIAL,
    scrollType: SCROLL_TYPE.BLACK,
    equipTarget: SCROLL_EQUIP_TARGET.ONE_HAND_WEAPON,
    rate: 100,
    icon: 'images/scroll/black.png',
    stats: [
      { label: '攻擊力', val: 14 },
      { label: 'STR', val: 14 },
      { label: 'DEX', val: 14 },
      { label: 'INT', val: 14 },
      { label: 'LUK', val: 14 }
    ]
  },

  scroll_black_one_hand_weapon_matk: {
    id: 'scroll_black_one_hand_weapon_matk',
    slotIndex: 37,
    name: '究極的黑暗單手武器魔力卷軸',
    tab: SCROLL_TAB.SPECIAL,
    scrollType: SCROLL_TYPE.BLACK,
    equipTarget: SCROLL_EQUIP_TARGET.ONE_HAND_WEAPON,
    rate: 100,
    icon: 'images/scroll/black.png',
    stats: [
      { label: '魔力', val: 14 },
      { label: 'STR', val: 14 },
      { label: 'DEX', val: 14 },
      { label: 'INT', val: 14 },
      { label: 'LUK', val: 14 }
    ]
  },

  scroll_black_two_hand_weapon_atk: {
    id: 'scroll_black_two_hand_weapon_atk',
    slotIndex: 38,
    name: '究極的黑暗雙手武器攻擊力卷軸',
    tab: SCROLL_TAB.SPECIAL,
    scrollType: SCROLL_TYPE.BLACK,
    equipTarget: SCROLL_EQUIP_TARGET.TWO_HAND_WEAPON,
    rate: 100,
    icon: 'images/scroll/black.png',
    stats: [
      { label: '攻擊力', val: 14 },
      { label: 'STR', val: 14 },
      { label: 'DEX', val: 14 },
      { label: 'INT', val: 14 },
      { label: 'LUK', val: 14 }
    ]
  },

  scroll_black_two_hand_weapon_matk: {
    id: 'scroll_black_two_hand_weapon_matk',
    slotIndex: 39,
    name: '究極的黑暗雙手武器魔力卷軸',
    tab: SCROLL_TAB.SPECIAL,
    scrollType: SCROLL_TYPE.BLACK,
    equipTarget: SCROLL_EQUIP_TARGET.TWO_HAND_WEAPON,
    rate: 100,
    icon: 'images/scroll/black.png',
    stats: [
      { label: '魔力', val: 14 },
      { label: 'STR', val: 14 },
      { label: 'DEX', val: 14 },
      { label: 'INT', val: 14 },
      { label: 'LUK', val: 14 }
    ]
  },

  scroll_black_armor_atk: {
    id: 'scroll_black_armor_atk',
    slotIndex: 40,
    name: '究極的黑暗防具攻擊力卷軸',
    tab: SCROLL_TAB.SPECIAL,
    scrollType: SCROLL_TYPE.BLACK,
    equipTarget: SCROLL_EQUIP_TARGET.ARMOR,
    rate: 100,
    icon: 'images/scroll/black.png',
    stats: [
      { label: '攻擊力', val: 9 },
      { label: 'STR', val: 2 },
      { label: 'DEX', val: 2 },
      { label: 'INT', val: 2 },
      { label: 'LUK', val: 2 }
    ]
  },

  scroll_black_armor_matk: {
    id: 'scroll_black_armor_matk',
    slotIndex: 41,
    name: '究極的黑暗防具魔力卷軸',
    tab: SCROLL_TAB.SPECIAL,
    scrollType: SCROLL_TYPE.BLACK,
    equipTarget: SCROLL_EQUIP_TARGET.ARMOR,
    rate: 100,
    icon: 'images/scroll/black.png',
    stats: [
      { label: '魔力', val: 9 },
      { label: 'STR', val: 2 },
      { label: 'DEX', val: 2 },
      { label: 'INT', val: 2 },
      { label: 'LUK', val: 2 }
    ]
  },

  scroll_black_accessory_atk: {
    id: 'scroll_black_accessory_atk',
    slotIndex: 42,
    name: '究極的黑暗飾品攻擊力卷軸',
    tab: SCROLL_TAB.SPECIAL,
    scrollType: SCROLL_TYPE.BLACK,
    equipTarget: SCROLL_EQUIP_TARGET.ACCESSORY,
    rate: 100,
    icon: 'images/scroll/black.png',
    stats: [
      { label: '攻擊力', val: 9 }
    ]
  },

  scroll_black_accessory_matk: {
    id: 'scroll_black_accessory_matk',
    slotIndex: 43,
    name: '究極的黑暗飾品魔力卷軸',
    tab: SCROLL_TAB.SPECIAL,
    scrollType: SCROLL_TYPE.BLACK,
    equipTarget: SCROLL_EQUIP_TARGET.ACCESSORY,
    rate: 100,
    icon: 'images/scroll/black.png',
    stats: [
      { label: '魔力', val: 9 }
    ]
  }
}
// ==========================================
// 5. 咒文的痕跡種類
// ==========================================

const TRACE_TYPES = [
  { id: 'trace_70', label: '70%', rate: 70, cost: 30 },
  { id: 'trace_100', label: '100%', rate: 100, cost: 300 }
];

// ==========================================
// 6. 查詢與骰值工具
// ==========================================

function getScrollById(scrollId) {
  return SCROLL_DATABASE[scrollId] || null;
}

function getScrollDetailStatField(scroll) {
  if (scroll?.randomRoll?.statField) return scroll.randomRoll.statField;
  if (scroll?.multiStatRoll?.stats?.length) {
    if (scroll.multiStatRoll.stats.some((line) => line.field === 'scrollMatk')) return 'scrollMatk';
    if (scroll.multiStatRoll.stats.some((line) => line.field === 'scrollAtk')) return 'scrollAtk';
  }
  if (!scroll?.stats?.length) return 'scrollAtk';

  if (scroll.stats.some((line) => line.label.includes('魔法攻擊力') || line.label.includes('魔力'))) return 'scrollMatk';
  if (scroll.stats.some((line) => line.label.includes('攻擊力'))) return 'scrollAtk';
  return 'scrollStat';
}

function getScrollDetailKey(scroll) {
  if (!scroll) return null;
  if (scroll.detailKey) return scroll.detailKey;

  const typeCode = SCROLL_DETAIL_TYPE_CODE[scroll.scrollType];
  const equipCode = SCROLL_DETAIL_EQUIP_CODE[scroll.equipTarget];
  const statField = getScrollDetailStatField(scroll);
  const statCode = SCROLL_DETAIL_STAT_CODE[statField] || 'ad';

  if (!typeCode || !equipCode) return null;
  return `${typeCode}${equipCode}${statCode}`;
}

function getScrollDetailImagePath(scroll) {
  const key = getScrollDetailKey(scroll);
  if (!key) return null;
  return `${SCROLL_DETAIL_IMAGE_DIR}/${key}.png`;
}

function getScrollItemBySlot(slotIndex) {
  return Object.values(SCROLL_DATABASE).find(
    item => item.tab === SCROLL_TAB.SPECIAL && item.slotIndex === slotIndex
  ) || null;
}

function getScrollByType(scrollType) {
  return Object.values(SCROLL_DATABASE).find(item => item.scrollType === scrollType) || null;
}

function getGloryScrollItem() {
  return getScrollByType(SCROLL_TYPE.GLORY);
}

function isRandomRollScroll(scroll) {
  return Boolean(scroll?.randomRoll);
}

function isMultiStatRollScroll(scroll) {
  return Boolean(scroll?.multiStatRoll?.stats?.length);
}

function scrollRequiresRecoveryCard(scroll) {
  if (!scroll) return false;
  return scroll.scrollType !== SCROLL_TYPE.BLACK;
}

function isChaosScroll(scroll) {
  return scroll?.scrollType === SCROLL_TYPE.CHAOS;
}

function isSpecialRandomScroll(scroll) {
  if (!scroll) return false;
  return [
    SCROLL_TYPE.GLORY,
    SCROLL_TYPE.DESTINY,
    SCROLL_TYPE.SAVIOR,
    SCROLL_TYPE.RAINBOW
  ].includes(scroll.scrollType);
}

function isTwoHandWeaponItem(item) {
  return item?.mainType === EQUIP_TYPE.WEAPON
    && (item.islot === 'Gw' || item.subType === 'twoHandWeapon');
}

function isOffHandWeaponItem(item) {
  return item?.mainType === EQUIP_TYPE.offHandWeapon
    || item?.islot === 'ohp'
    || item?.subType === 'offHandWeapon'
    || item?.subType === 'shield'
    || item?.islot === 'Si';
}

/** 輔助武器且本身有 tuc（可強化次數）時，可使用單手／雙手武器卷軸 */
function canOffHandUseWeaponScroll(item) {
  if (!isOffHandWeaponItem(item)) return false;
  if (typeof hasBaseUpgradeSlots === 'function') {
    return hasBaseUpgradeSlots(item);
  }
  const base = item.baseMaxUpgradeSlots ?? item.maxUpgradeSlots ?? 0;
  return base > 0;
}

function isOneHandWeaponItem(item) {
  return item?.mainType === EQUIP_TYPE.WEAPON
    && !isTwoHandWeaponItem(item)
    && !isOffHandWeaponItem(item);
}

function getScrollEquipError(scroll, item) {
  if (!scroll || !item) return null;

  // 胸章（Ba）：僅能使用混沌卷
  if (typeof isPinItem === 'function' && isPinItem(item)) {
    if (scroll.scrollType !== SCROLL_TYPE.CHAOS) {
      return '胸章僅能使用混沌卷軸。';
    }
    if (scroll.maxEquipLevel && (item.reqLevel || 0) > scroll.maxEquipLevel) {
      return `此卷軸僅限 ${scroll.maxEquipLevel} 等以下（含）裝備使用。`;
    }
    return null;
  }

  if (!scroll.equipTarget) return null;

  // 機器心臟（Heart / Tm）可使用任何部位卷軸
  if (!(typeof isHeartItem === 'function' ? isHeartItem(item) : item?.islot === 'Tm')) {
    if (scroll.equipTarget === SCROLL_EQUIP_TARGET.ARMOR && item.mainType !== EQUIP_TYPE.ARMOR) {
      return '此卷軸僅限防具使用。';
    }
    if (scroll.equipTarget === SCROLL_EQUIP_TARGET.WEAPON
      && item.mainType !== EQUIP_TYPE.WEAPON
      && !canOffHandUseWeaponScroll(item)) {
      return '此卷軸僅限武器使用。';
    }
    if (scroll.equipTarget === SCROLL_EQUIP_TARGET.ONE_HAND_WEAPON
      && !isOneHandWeaponItem(item)
      && !canOffHandUseWeaponScroll(item)) {
      return '此卷軸僅限單手武器使用。';
    }
    if (scroll.equipTarget === SCROLL_EQUIP_TARGET.TWO_HAND_WEAPON
      && !isTwoHandWeaponItem(item)
      && !canOffHandUseWeaponScroll(item)) {
      return '此卷軸僅限雙手武器使用。';
    }
    if (scroll.equipTarget === SCROLL_EQUIP_TARGET.ACCESSORY && item.mainType !== EQUIP_TYPE.ACCESSORY) {
      return '此卷軸僅限飾品使用。';
    }
  }

  if (scroll.maxEquipLevel && (item.reqLevel || 0) > scroll.maxEquipLevel) {
    return `此卷軸僅限 ${scroll.maxEquipLevel} 等以下（含）裝備使用。`;
  }

  return null;
}

function canUseScrollOnEquip(scroll, item) {
  return !getScrollEquipError(scroll, item);
}

function getRandomRollRates(scroll) {
  const roll = scroll?.randomRoll || scroll?.multiStatRoll;
  if (!roll) {
    return isScrollCatValleyRatesEnabled()
      ? applyScrollRateTierShift(GLORY_RATE_TABLE.armor)
      : GLORY_RATE_TABLE.armor.map((entry) => ({ ...entry }));
  }

  const table = RANDOM_RATE_TABLES[roll.tableKey] || GLORY_RATE_TABLE;
  // 飾品與防具同表；缺 key 時優先回退 armor（勿誤用 weapon）
  const base = table[roll.ratesKey] || table.armor || table.weapon || GLORY_RATE_TABLE.armor;
  if (isScrollCatValleyRatesEnabled()) {
    return applyScrollRateTierShift(base);
  }
  return base.map((entry) => ({ ...entry }));
}

function getRandomStatRange(scroll) {
  const rates = getRandomRollRates(scroll);
  const vals = rates.map((entry) => entry.val);
  return { min: Math.min(...vals), max: Math.max(...vals) };
}

function isMaxRandomRollValue(scroll, val) {
  if (!scroll || val == null || !isRandomRollScroll(scroll)) return false;
  const range = getRandomStatRange(scroll);
  return Number(val) === range.max;
}

function getScrollRollValues(scroll) {
  const rates = getRandomRollRates(scroll);
  return [...new Set(rates.map((entry) => entry.val))].sort((a, b) => a - b);
}

function rollRandomStatValue(scroll) {
  if (GLORY_FORCE_MAX_ROLL && scroll?.scrollType === SCROLL_TYPE.GLORY) {
    return getRandomStatRange(scroll).max;
  }

  const rates = getRandomRollRates(scroll);
  // T+2 循環後權重總和應仍為 100；仍以實際總和為分母較穩
  const total = rates.reduce((sum, entry) => sum + (Number(entry.rate) || 0), 0);
  if (total <= 0) return rates[rates.length - 1]?.val ?? 0;

  let roll = Math.random() * total;
  for (const entry of rates) {
    roll -= Number(entry.rate) || 0;
    if (roll < 0) return entry.val;
  }

  return rates[rates.length - 1].val;
}

function applyRandomScrollBonus(item, scroll, val) {
  const field = scroll?.randomRoll?.statField || 'scrollStat';
  item[field] = (item[field] || 0) + val;
  return field;
}

function rollMultiStatValue(scroll) {
  return rollRandomStatValue(scroll);
}

function getMultiStatRollRange(scroll) {
  return getRandomStatRange(scroll);
}

function rollMultiStatChanges(scroll) {
  const stats = scroll?.multiStatRoll?.stats || [];
  return stats.map((def) => {
    const val = rollMultiStatValue(scroll);
    return {
      label: def.label,
      field: def.field,
      val,
      applied: val
    };
  });
}

function applyMultiStatScrollBonus(item, changes) {
  (changes || []).forEach((change) => {
    if (!change?.field || !change.val) return;
    item[change.field] = (item[change.field] || 0) + change.val;
  });
  return changes;
}

function formatMultiStatChangeLog(changes) {
  const parts = (changes || [])
    .filter((change) => change && change.val)
    .map((change) => `${change.label} +${change.val}`);
  return parts.length ? parts.join('、') : '無屬性變化';
}

function applyFixedScrollStats(item, stats) {
  const statFields = {
    STR: 'scrollStr',
    DEX: 'scrollDex',
    INT: 'scrollInt',
    LUK: 'scrollLuk'
  };

  (stats || []).forEach((line) => {
    const label = String(line.label || '').trim();
    const val = Number(line.val);
    if (!Number.isFinite(val)) return;

    if (label === '攻擊力' || label === '物理攻擊力') {
      item.scrollAtk = (item.scrollAtk || 0) + val;
    } else if (label === '魔力' || label === '魔法攻擊力') {
      item.scrollMatk = (item.scrollMatk || 0) + val;
    } else if (statFields[label]) {
      const field = statFields[label];
      item[field] = (item[field] || 0) + val;
    } else {
      item.scrollStat = (item.scrollStat || 0) + val;
    }
  });
}

function resetScrollBonusFields(item) {
  if (!item) return;
  item.scrollStat = 0;
  item.scrollAtk = 0;
  item.scrollMatk = 0;
  SCROLL_EXTRA_BONUS_FIELDS.forEach((field) => {
    item[field] = 0;
  });
  item.catValleyLevel = 0;
  item.medalEnhanceLevel = 0;
  item.medalEnhanceStarted = false;
  item.catValleyTotemStarted = false;
  item.catValleyJackpotMain = null;
  item.catValleyJackpotAdd = null;
}

function rollChaosDeltaValue() {
  const roll = Math.random() * 100;
  let accumulated = 0;
  for (const entry of CHAOS_RATE_TABLE) {
    accumulated += entry.rate;
    if (roll < accumulated) return entry.val;
  }
  return CHAOS_RATE_TABLE[CHAOS_RATE_TABLE.length - 1].val;
}

function getChaosStatCurrentTotal(item, def) {
  if (!item || !def) return 0;

  if (typeof EquipTooltipModule !== 'undefined' && typeof EquipTooltipModule.buildStatSegments === 'function') {
    const line = EquipTooltipModule.buildStatSegments(item).find((row) => row.label === def.label);
    if (line) return Number(line.total) || 0;
  }

  const base = item.baseStats || {};
  const wz = item.wz || {};
  switch (def.key) {
    case 'atk': return (base.atk || 0) + (item.scrollAtk || 0);
    case 'matk': return (base.matk || 0) + (item.scrollMatk || 0);
    case 'str': return (base.str || 0) + (item.scrollStat || 0) + (item.scrollStr || 0);
    case 'dex': return (base.dex || 0) + (item.scrollStat || 0) + (item.scrollDex || 0);
    case 'int': return (base.int || 0) + (item.scrollStat || 0) + (item.scrollInt || 0);
    case 'luk': return (base.luk || 0) + (item.scrollStat || 0) + (item.scrollLuk || 0);
    case 'def': return (base.def || 0) + (item.scrollDef || 0);
    case 'hp': return (base.hp || 0) + (item.scrollHp || 0);
    case 'mp': return (base.mp || 0) + (item.scrollMp || 0);
    case 'speed': return (wz.incSpeed || 0) + (item.scrollSpeed || 0);
    case 'jump': return (wz.incJump || 0) + (item.scrollJump || 0);
    default: return 0;
  }
}

function rollChaosChanges(item) {
  return CHAOS_STAT_DEFS.map((def) => {
    const raw = rollChaosDeltaValue();
    const desired = raw * (def.mult || 1);
    const current = getChaosStatCurrentTotal(item, def);
    const next = Math.max(0, current + desired);
    const applied = next - current;
    return {
      key: def.key,
      field: def.field,
      label: def.label,
      raw,
      desired,
      applied
    };
  });
}

function applyChaosScrollBonus(item, changes) {
  (changes || []).forEach((change) => {
    if (!change?.field || !change.applied) return;
    item[change.field] = (item[change.field] || 0) + change.applied;
  });
  return changes;
}

function formatChaosChangeLog(changes) {
  const parts = (changes || [])
    .filter((change) => change && change.applied !== 0)
    .map((change) => {
      const sign = change.applied > 0 ? '+' : '';
      return `${change.label} ${sign}${change.applied}`;
    });
  return parts.length ? parts.join('、') : '無屬性變化';
}

function getChaosStatRange() {
  const vals = CHAOS_RATE_TABLE.map((entry) => entry.val);
  return { min: Math.min(...vals), max: Math.max(...vals) };
}

function getGloryRates(scroll) {
  return getRandomRollRates(scroll);
}

function getGloryStatRange(scroll) {
  return getRandomStatRange(scroll);
}

function rollGloryStatValue(scroll) {
  return rollRandomStatValue(scroll);
}

function applyGloryScrollBonus(item, scroll, val) {
  return applyRandomScrollBonus(item, scroll, val);
}

function consumeRecoveryCard() {
  if (playerRecoveryCardCount <= 0) {
    playerRecoveryCardCount = DEFAULT_RECOVERY_CARD_COUNT;
  }
  if (playerRecoveryCardCount <= 0) return false;
  playerRecoveryCardCount -= 1;
  trackCostUsage('recoveryCard');
  if (playerRecoveryCardCount <= 0) {
    playerRecoveryCardCount = DEFAULT_RECOVERY_CARD_COUNT;
  }
  return true;
}

const RESTORE_SCROLLS = [
  {
    id: 'scroll_recover',
    name: '回真卷軸100%',
    icon: 'images/scroll/recover.png',
    rate: 100,
    restoreType: 'recover',
    effectLabel: '星力、卷軸強化初始化'
  },
  {
    id: 'scroll_white_recover',
    name: '純白的卷軸100%',
    icon: 'images/scroll/whiterecover.png',
    rate: 100,
    restoreType: 'white',
    effectLabel: '恢復因卷軸應用失敗所消耗的卷軸剩餘次數'
  },
  {
    id: 'scroll_ark_recover',
    name: '亞克回真卷軸100%',
    icon: 'images/scroll/arkrecover.png',
    rate: 100,
    restoreType: 'ark',
    effectLabel: '卷軸強化初始化'
  }
];

function getRestoreScrollById(restoreId) {
  return RESTORE_SCROLLS.find(item => item.id === restoreId) || null;
}

function applyRestoreScroll(item, restoreScroll) {
  if (!item || !restoreScroll) return { restoredFailUses: 0 };

  switch (restoreScroll.restoreType) {
    case 'recover':
      item.star = 0;
      item.starConsecutiveDrops = 0;
      item.scrollUsed = 0;
      item.scrollFailUses = 0;
      item.scrollSlotResults = [];
      resetScrollBonusFields(item);
      return { restoredFailUses: 0, resetStar: true };

    case 'white': {
      const failUses = item.scrollFailUses || 0;
      if (Array.isArray(item.scrollSlotResults) && item.scrollSlotResults.length) {
        item.scrollSlotResults = item.scrollSlotResults.filter((result) => result !== 'fail');
        item.scrollUsed = item.scrollSlotResults.length;
      } else {
        item.scrollUsed = Math.max(0, (item.scrollUsed || 0) - failUses);
      }
      item.scrollFailUses = 0;
      return { restoredFailUses: failUses, resetStar: false };
    }

    case 'ark':
      item.scrollUsed = 0;
      item.scrollFailUses = 0;
      item.scrollSlotResults = [];
      resetScrollBonusFields(item);
      return { restoredFailUses: 0, resetStar: false };

    default:
      return { restoredFailUses: 0, resetStar: false };
  }
}
