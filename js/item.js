// ==========================================
// 1. 裝備分類與 WZ info 對照
// ==========================================

const EQUIP_TYPE = {
  WEAPON: 'WEAPON',
  offHandWeapon: 'offHandWeapon',
  Emblem: 'Emblem',
  ARMOR: 'ARMOR',
  ACCESSORY: 'ACCESSORY'
};

/** @deprecated 相容舊名 */
EQUIP_TYPE.Energy = EQUIP_TYPE.Emblem;

/** 主潛／附潛數值表是否走武器池（武器 + 輔助武器） */
function isWeaponPotentialEquip(item) {
  return item?.mainType === EQUIP_TYPE.WEAPON
    || item?.mainType === EQUIP_TYPE.offHandWeapon;
}

/** 阿特拉斯副武器（item.js atlas: 1） */
function isAtlasOffHandWeapon(item) {
  return Boolean(Number(item?.atlas));
}

/** 是否為副武器（含盾牌／atlas） */
function isOffHandStarForceEquip(item) {
  if (!item) return false;
  if (isAtlasOffHandWeapon(item)) return true;
  return item.mainType === EQUIP_TYPE.offHandWeapon
    || item.islot === 'ohp'
    || item.islot === 'Si'
    || item.subType === 'offHandWeapon'
    || item.subType === 'shield';
}

/**
 * 星力數值是否走武器表：
 * - 主武器 → 武器表
 * - 副武器（含 atlas）且 tuc≠0 → 武器表
 * - atlas 且 tuc=0 → 防具表
 */
function usesWeaponStarForce(item) {
  if (!item) return false;
  if (item.mainType === EQUIP_TYPE.WEAPON) return true;
  if (!isOffHandStarForceEquip(item)) return false;
  const base = item.baseMaxUpgradeSlots ?? item.maxUpgradeSlots ?? 0;
  return base > 0;
}

/** 武器分類：一般 / 命運（潛在能力數值較高） */
const WEAPON_TIER = {
  NORMAL: 'normal',
  DESTINY: 'destiny'
};

/** WZ Character 資料夾 → 部位（建檔對照用） */
const WZ_CHARACTER_PART = {
  Weapon: { islot: 'Wp', mainType: EQUIP_TYPE.WEAPON, subType: 'weapon' },
  Coat: { islot: 'Ma', mainType: EQUIP_TYPE.ARMOR, subType: 'coat' },
  Longcoat: { islot: 'MaPn', mainType: EQUIP_TYPE.ARMOR, subType: 'longcoat' },
  Cap: { islot: 'Cp', mainType: EQUIP_TYPE.ARMOR, subType: 'cap' },
  Pants: { islot: 'Pn', mainType: EQUIP_TYPE.ARMOR, subType: 'pants' },
  Shoes: { islot: 'So', mainType: EQUIP_TYPE.ARMOR, subType: 'shoes' },
  Glove: { islot: 'Gv', mainType: EQUIP_TYPE.ARMOR, subType: 'gloves' },
  Cape: { islot: 'Sr', mainType: EQUIP_TYPE.ARMOR, subType: 'cape' },
  Shield: { islot: 'Si', mainType: EQUIP_TYPE.offHandWeapon, subType: 'shield' },
  Ring: { islot: 'Ri', mainType: EQUIP_TYPE.ACCESSORY, subType: 'ring' },
  Pendant: { islot: 'Pe', mainType: EQUIP_TYPE.ACCESSORY, subType: 'pendant' },
  Face: { islot: 'Af', mainType: EQUIP_TYPE.ACCESSORY, subType: 'faceAccessory' },
  Eye: { islot: 'Ay', mainType: EQUIP_TYPE.ACCESSORY, subType: 'eye' },
  Earrings: { islot: 'Ae', mainType: EQUIP_TYPE.ACCESSORY, subType: 'earring' },
  Belt: { islot: 'Be', mainType: EQUIP_TYPE.ARMOR, subType: 'belt' },
  /** 胸章（WZ islot Ba）；原 Bt Badge 已無裝備使用而移除 */
  Badge: { islot: 'Ba', mainType: EQUIP_TYPE.ACCESSORY, subType: 'badge' },
  Pocket: { islot: 'Po', mainType: EQUIP_TYPE.ACCESSORY, subType: 'pocket' },
  Shoulder: { islot: 'Sh', mainType: EQUIP_TYPE.ARMOR, subType: 'shoulder' },
  Android: { islot: 'Tm', mainType: EQUIP_TYPE.ACCESSORY, subType: 'android' },
  OffHandWeapon: { islot: 'ohp', mainType: EQUIP_TYPE.offHandWeapon, subType: 'offHandWeapon' },
  /** 勳章（WZ islot Me；舊碼 Md 仍相容） */
  Medal: { islot: 'Me', mainType: EQUIP_TYPE.ACCESSORY, subType: 'medal' },
  /** 徽章／紋章（WZ islot Em；舊碼 En 已移除） */
  Emblem: { islot: 'Em', mainType: EQUIP_TYPE.Emblem, subType: 'emblem' },
  // Accessory 資料夾內含多種 islot，以 XML info.islot 為準
};

/** WZ info.islot → 模擬器主分類 */
const ISLOT_TO_MAIN_TYPE = {
  Wp: EQUIP_TYPE.WEAPON,
  Gw: EQUIP_TYPE.WEAPON,
  Op: EQUIP_TYPE.WEAPON,
  ohp: EQUIP_TYPE.offHandWeapon,
  Ma: EQUIP_TYPE.ARMOR,
  Si: EQUIP_TYPE.offHandWeapon,
  So: EQUIP_TYPE.ARMOR,
  Gv: EQUIP_TYPE.ARMOR,
  Pn: EQUIP_TYPE.ARMOR,
  Sr: EQUIP_TYPE.ARMOR,
  Af: EQUIP_TYPE.ACCESSORY,
  Be: EQUIP_TYPE.ACCESSORY,
  MaPn: EQUIP_TYPE.ARMOR,
  Sh: EQUIP_TYPE.ACCESSORY,
  Me: EQUIP_TYPE.ACCESSORY,
  Pe: EQUIP_TYPE.ACCESSORY,
  Ae: EQUIP_TYPE.ACCESSORY,
  Ri: EQUIP_TYPE.ACCESSORY,
  Er: EQUIP_TYPE.ACCESSORY,
  Ay: EQUIP_TYPE.ACCESSORY,
  Am: EQUIP_TYPE.ACCESSORY,
  Po: EQUIP_TYPE.ACCESSORY,
  Ex: EQUIP_TYPE.ACCESSORY, // 舊碼相容 → pocket
  Cp: EQUIP_TYPE.ARMOR,
  Tm: EQUIP_TYPE.ARMOR,
  Hr: EQUIP_TYPE.ACCESSORY,
  Face: EQUIP_TYPE.ACCESSORY,
  Md: EQUIP_TYPE.ACCESSORY, // 舊碼相容 → medal
  Em: EQUIP_TYPE.Emblem,
  Ba: EQUIP_TYPE.ACCESSORY
};

/** 是否為勳章（islot Me；舊 Md 相容） */
function isMedalItem(item) {
  if (!item) return false;
  return item.islot === 'Me' || item.islot === 'Md' || item.subType === 'medal';
}

/** 是否為胸章（islot Ba / subType badge） */
function isPinItem(item) {
  if (!item) return false;
  return item.islot === 'Ba' || item.subType === 'badge';
}

/** 是否為徽章／紋章（islot Em） */
function isEmblemItem(item) {
  if (!item) return false;
  return item.mainType === EQUIP_TYPE.Emblem || item.islot === 'Em' || item.subType === 'emblem';
}

/** @deprecated 相容舊名 */
function isEnergyBadgeItem(item) {
  return isEmblemItem(item);
}

/** 裝備是否已具備可用潛能詞條（空 lines = 尚未賦予潛能） */
function hasEquipPotentialLines(item, which = 'main') {
  if (!item) return false;
  const pot = which === 'additional' ? item.additionalPotential : item.potential;
  return Array.isArray(pot?.lines) && pot.lines.length > 0;
}

/** 可使用主潛能強化（方塊等）；勳章／尚未賦予潛能者不可 */
function canUsePotentialEnhancement(item) {
  if (!item) return false;
  if (isMedalItem(item)) return false;
  return hasEquipPotentialLines(item, 'main');
}

/** 可使用附加潛能強化；勳章／胸章／尚未賦予附加潛能者不可 */
function canUseAdditionalPotentialEnhancement(item) {
  if (!item) return false;
  if (isMedalItem(item)) return false;
  if (isPinItem(item)) return false;
  return hasEquipPotentialLines(item, 'additional');
}

/** 預設無主／附潛（改由傳說潛能卷等道具賦予） */
function shouldStartWithoutPotential(item) {
  return Boolean(item);
}

/** 披風／腰帶／肩膀／胸章：主／附加潛能共用披風組機率與數值（即使 mainType 為飾品） */
function isCapeGroupPotentialEquip(item) {
  if (!item) return false;
  const islot = item.islot;
  const subType = item.subType;
  return islot === 'Sr' || islot === 'Be' || islot === 'Sh' || islot === 'Ba'
    || subType === 'cape' || subType === 'belt' || subType === 'shoulder' || subType === 'badge';
}

/** WZ info.islot → 模擬器子分類（卷軸／潛能判定用） */
const ISLOT_TO_SUB_TYPE = {
  Wp: 'weapon',
  Gw: 'twoHandWeapon',
  Ma: 'coat',
  MaPn: 'longcoat',
  Si: 'shield',
  So: 'shoes',
  Gv: 'gloves',
  Pn: 'pants',
  Sr: 'cape',
  Af: 'faceAccessory',
  Sh: 'shoulder',
  Be: 'belt',
  Pe: 'pendant',
  Ae: 'earring',
  Ri: 'ring',
  Er: 'earring',
  Ay: 'eye',
  Am: 'faceAccessory',
  Po: 'pocket',
  Ex: 'pocket', // 舊碼相容
  Cp: 'cap',
  Tm: 'android',
  Hr: 'hair',
  Op: 'weapon',
  ohp: 'offHandWeapon',
  Me: 'medal',
  Md: 'medal', // 舊碼相容
  Em: 'emblem',
  Ba: 'badge', // 胸章
};

/**
 * 由 Character.*.img.xml 的 info 節點建立裝備資料。
 * 圖示固定為 images/equip/{itemId}.png
 *
 * @param {string} itemId - 物品 ID（與 XML 檔名一致，如 01215041）
 * @param {string} name - 顯示名稱（String.wz 需自行查表填入）
 * @param {object} info - XML info 節點對應的 plain object
 */
function buildEquipFromWzInfo(itemId, name, info) {
  const islot = info.islot || info.vslot || 'Wp';
  const partHint = info.wzPart ? WZ_CHARACTER_PART[info.wzPart] : null;
  const mainType = ISLOT_TO_MAIN_TYPE[islot] || partHint?.mainType || EQUIP_TYPE.ARMOR;
  const subType = ISLOT_TO_SUB_TYPE[islot] || partHint?.subType || 'unknown';
  const tuc = Number(info.tuc) || 0;
  const isDestinyWeapon = mainType === EQUIP_TYPE.WEAPON && Boolean(info.exceptUpgrade);
  const isPin = islot === 'Ba';

  return {
    id: itemId,
    itemId,
    name: name || itemId,
    icon: `images/equip/${itemId}.png`,
    reqLevel: Number(info.reqLevel) || 0,
    mainType,
    subType,
    islot,
    vslot: info.vslot || islot,
    reqJob: Number(info.reqJob) || 0,
    reqJob2: Number(info.reqJob2) || 0,
    reqSpecJob: Number(info.reqSpecJob) || 0,
    weaponTier: isDestinyWeapon ? WEAPON_TIER.DESTINY : WEAPON_TIER.NORMAL,
    atlas: Number(info.atlas) ? 1 : 0,
    star: 0,
    // 胸章不可星力
    maxStar: isPin ? 0 : 30,
    upgradeSlots: tuc,
    maxUpgradeSlots: tuc,
    hammerSlots: 0,
    maxGoldenHammer: 1,
    maxPlatinumHammer: 5,
    baseStats: {
      str: Number(info.incSTR) || 0,
      dex: Number(info.incDEX) || 0,
      int: Number(info.incINT) || 0,
      luk: Number(info.incLUK) || 0,
      atk: Number(info.incPAD) || 0,
      matk: Number(info.incMAD) || 0,
      def: Number(info.incPDD) || 0,
      mdef: Number(info.incMDD) || 0,
      hp: Number(info.incMHP) || 0,
      mp: Number(info.incMMP) || 0
    },
    wz: {
      wzPart: info.wzPart || '',
      attackSpeed: Number(info.attackSpeed) || 0,
      imdR: Number(info.imdR) || 0,
      bdR: Number(info.bdR) || 0,
      damR: Number(info.damR) || 0,
      incSpeed: Number(info.incSpeed) || 0,
      incJump: Number(info.incJump) || 0,
      incMHPr: Number(info.incMHPr) || 0,
      setItemID: Number(info.setItemID) || 0,
      sfx: info.sfx || '',
      afterImage: info.afterImage || '',
      onlyUpgrade: info.onlyUpgrade || null,
      onlyUpgradeThousand: info.onlyUpgradeThousand || null,
      tradeBlock: Boolean(info.tradeBlock),
      equipTradeBlock: Boolean(info.equipTradeBlock),
      tradeAvailable: Number(info.tradeAvailable) || 0,
      notSale: Boolean(info.notSale),
      bossReward: Boolean(info.bossReward),
      exItem: Boolean(info.exItem),
      charmEXP: Number(info.charmEXP) || 0,
      exceptUpgrade: Boolean(info.exceptUpgrade),
      onlyEquip: Boolean(info.onlyEquip),
      jokerToSetItem: Boolean(info.jokerToSetItem),
      // WZ 原拼法 unsyntesizable
      unsyntesizable: Boolean(info.unsyntesizable || info.unsynthesizable),
    }
  };
}

/** 裝備本身是否具有可強化次數（WZ tuc / baseMaxUpgradeSlots > 0） */
function hasBaseUpgradeSlots(item) {
  if (!item) return false;
  const base = item.baseMaxUpgradeSlots ?? item.maxUpgradeSlots ?? 0;
  return base > 0;
}

/** 是否可進行星力強化（有 tuc，或為阿特拉斯副武器；胸章除外） */
function canUseStarForce(item) {
  if (isPinItem(item)) return false;
  return hasBaseUpgradeSlots(item) || isAtlasOffHandWeapon(item);
}

/** 不可使用附加能力（星火）的部位 */
const BONUS_STAT_BLOCKED_SUBTYPES = new Set([
  'ring',
  'android',
  'offHandWeapon',
  'shield',
  'pin', // 舊 subType 相容
  'badge', // 胸章 Ba
]);

const BONUS_STAT_BLOCKED_ISLOTS = new Set(['Ri', 'Tm', 'ohp', 'Si', 'Em', 'Ba']);

/** 是否可使用附加能力（bonusStat） */
function canUseBonusStat(item) {
  if (!item) return false;
  if (isPinItem(item)) return false;
  if (item.mainType === EQUIP_TYPE.offHandWeapon) return false;
  if (item.mainType === EQUIP_TYPE.Emblem) return false;
  if (BONUS_STAT_BLOCKED_SUBTYPES.has(item.subType)) return false;
  if (BONUS_STAT_BLOCKED_ISLOTS.has(item.islot)) return false;
  return true;
}

// ==========================================
// 2. 裝備資料庫
// ==========================================
// 新增裝備：解析 *.img.xml 的 info → buildEquipFromWzInfo(id, 名稱, info)
// 圖片放置：images/equip/{itemId}.png

const ITEM_DATABASE = {
'01005980': buildEquipFromWzInfo('01005980', '永恆劍士頭盔', {
    islot: 'Cp',
    vslot: 'CpH1H5',
    reqJob: 1,
    reqLevel: 250,
    incSTR: 80,
    incDEX: 80,
    incPDD: 750,
    incPAD: 10,
    tuc: 12,
    imdR: 15,
    equipTradeBlock: 1,
    notSale: 1,
    setItemID: 886
  }),

'01005981': buildEquipFromWzInfo('01005981', '永恆法師帽', {
    islot: 'Cp',
    vslot: 'CpH1H5',
    reqJob: 2,
    reqLevel: 250,
    incINT: 80,
    incLUK: 80,
    incPDD: 750,
    incMAD: 10,
    tuc: 12,
    imdR: 15,
    equipTradeBlock: 1,
    notSale: 1,
    setItemID: 887
  }),

'01005982': buildEquipFromWzInfo('01005982', '永恆弓箭手帽', {
    islot: 'Cp',
    vslot: 'CpH1H5',
    reqJob: 4,
    reqLevel: 250,
    incSTR: 80,
    incDEX: 80,
    incPDD: 750,
    incPAD: 10,
    tuc: 12,
    imdR: 15,
    equipTradeBlock: 1,
    notSale: 1,
    setItemID: 888
  }),

'01005983': buildEquipFromWzInfo('01005983', '永恆盜賊頭巾', {
    islot: 'Cp',
    vslot: 'CpH1H5',
    reqJob: 8,
    reqLevel: 250,
    incLUK: 80,
    incDEX: 80,
    incPDD: 750,
    incPAD: 10,
    tuc: 12,
    imdR: 15,
    equipTradeBlock: 1,
    notSale: 1,
    setItemID: 889
  }),

'01005984': buildEquipFromWzInfo('01005984', '永恆海盜帽', {
    islot: 'Cp',
    vslot: 'CpH1H5',
    reqJob: 16,
    reqLevel: 250,
    incSTR: 80,
    incDEX: 80,
    incPDD: 750,
    incPAD: 10,
    tuc: 12,
    imdR: 15,
    equipTradeBlock: 1,
    notSale: 1,
    setItemID: 890
  }),

'01012632': buildEquipFromWzInfo('01012632', '口紅控制器標誌', {
    wzPart: 'Accessory',
    islot: 'Af',
    vslot: 'Af',
    reqJob: 0,
    reqLevel: 160,
    incSTR: 10,
    incDEX: 10,
    incINT: 10,
    incLUK: 10,
    incPAD: 10,
    incMAD: 10,
    incPDD: 200,
    tuc: 6,
    setItemID: 677,
    notSale: 1,
    bossReward: 1,
    cash: 0,
    equipTradeBlock: 1,
    exItem: 1,
    price: 1,
    tradeAvailable: 2
  }),

'01012911': buildEquipFromWzInfo('01012911', '傲慢的原罪', {
    wzPart: 'Accessory',
    islot: 'Af',
    vslot: 'CpH1H5',
    reqJob: 0,
    reqLevel: 250,
    incSTR: 15,
    incDEX: 15,
    incINT: 15,
    incLUK: 15,
    incPAD: 15,
    incMAD: 15,
    incPDD: 300,
    tuc: 7,
    setItemID: 1055,
    notSale: 1,
    bossReward: 1,
    equipTradeBlock: 1,
    exItem: 1,
    price: 1,
    tradeAvailable: 2
  }),

'01022278': buildEquipFromWzInfo('01022278', '附有魔力的眼罩', {
    wzPart: 'Accessory',
    islot: 'Ay',
    vslot: 'Ay',
    reqLevel: 160,
    incSTR: 15,
    incDEX: 15,
    incINT: 15,
    incLUK: 15,
    incPAD: 3,
    incMAD: 3,
    incPDD: 300,
    tuc: 4,
    setItemID: 677,
    notSale: 1,
    bossReward: 1,
    cash: 0,
    equipTradeBlock: 1,
    exItem: 1,
    price: 1,
    tradeAvailable: 2
  }),

'01032316': buildEquipFromWzInfo('01032316', '指揮官力量耳環', {
    wzPart: 'Accessory',
    islot: 'Ae',
    vslot: 'Ae',
    reqJob: 0,
    reqLevel: 200,
    incSTR: 7,
    incDEX: 7,
    incINT: 7,
    incLUK: 7,
    incPAD: 5,
    incMAD: 5,
    incPDD: 100,
    incMHP: 500,
    tuc: 7,
    setItemID: 677,
    notSale: 1,
    bossReward: 1,
    cash: 0,
    equipTradeBlock: 1,
    exItem: 1,
    price: 1,
    tradeAvailable: 2
  }),

'01042433': buildEquipFromWzInfo('01042433', '永恆劍士鎧甲', {
    wzPart: 'Coat',
    islot: 'Ma',
    vslot: 'Ma',
    reqJob: 1,
    reqLevel: 250,
    incSTR: 50,
    incDEX: 50,
    incPAD: 6,
    incPDD: 325,
    tuc: 8,
    imdR: 5,
    setItemID: 886,
    bossReward: 1,
    charmEXP: 100,
    equipTradeBlock: 1,
    tradeAvailable: 2,
    exItem: 1
  }),

'01042434': buildEquipFromWzInfo('01042434', '永恆法師長袍', {
    wzPart: 'Coat',
    islot: 'Ma',
    vslot: 'Ma',
    reqJob: 2,
    reqLevel: 250,
    incINT: 50,
    incLUK: 50,
    incMAD: 6,
    incPDD: 325,
    tuc: 8,
    imdR: 5,
    setItemID: 887,
    bossReward: 1,
    charmEXP: 100,
    equipTradeBlock: 1,
    tradeAvailable: 2,
    exItem: 1
  }),

'01042435': buildEquipFromWzInfo('01042435', '永恆弓箭手連帽衫', {
    wzPart: 'Coat',
    islot: 'Ma',
    vslot: 'Ma',
    reqJob: 4,
    reqLevel: 250,
    incSTR: 50,
    incDEX: 50,
    incPAD: 6,
    incPDD: 325,
    tuc: 8,
    imdR: 5,
    setItemID: 888,
    bossReward: 1,
    cash: 0,
    charmEXP: 100,
    equipTradeBlock: 1,
    exItem: 1,
    price: 1,
    tradeAvailable: 2
  }),

'01042436': buildEquipFromWzInfo('01042436', '永恆盜賊上衣', {
    wzPart: 'Coat',
    islot: 'Ma',
    vslot: 'Ma',
    reqJob: 8,
    reqLevel: 250,
    incDEX: 50,
    incLUK: 50,
    incPAD: 6,
    incPDD: 325,
    tuc: 8,
    imdR: 5,
    setItemID: 889,
    bossReward: 1,
    cash: 0,
    charmEXP: 100,
    equipTradeBlock: 1,
    exItem: 1,
    price: 1,
    tradeAvailable: 2
  }),

'01042437': buildEquipFromWzInfo('01042437', '永恆海盜大衣', {
    wzPart: 'Coat',
    islot: 'Ma',
    vslot: 'Ma',
    reqJob: 16,
    reqLevel: 250,
    incSTR: 50,
    incDEX: 50,
    incPAD: 6,
    incPDD: 325,
    tuc: 8,
    imdR: 5,
    setItemID: 890,
    bossReward: 1,
    cash: 0,
    charmEXP: 100,
    equipTradeBlock: 1,
    exItem: 1,
    price: 1,
    tradeAvailable: 2
  }),

'01062285': buildEquipFromWzInfo('01062285', '永恆劍士褲', {
    wzPart: 'Pants',
    islot: 'Pn',
    vslot: 'Pn',
    reqJob: 1,
    reqLevel: 250,
    incSTR: 50,
    incDEX: 50,
    incPAD: 6,
    incPDD: 325,
    tuc: 8,
    imdR: 5,
    setItemID: 886,
    bossReward: 1,
    cash: 0,
    charmEXP: 100,
    equipTradeBlock: 1,
    exItem: 1,
    price: 1,
    tradeAvailable: 2
  }),

'01062286': buildEquipFromWzInfo('01062286', '永恆法師褲', {
    wzPart: 'Pants',
    islot: 'Pn',
    vslot: 'Pn',
    reqJob: 2,
    reqLevel: 250,
    incINT: 50,
    incLUK: 50,
    incMAD: 6,
    incPDD: 325,
    tuc: 8,
    imdR: 5,
    setItemID: 887,
    bossReward: 1,
    cash: 0,
    charmEXP: 100,
    equipTradeBlock: 1,
    exItem: 1,
    price: 1,
    tradeAvailable: 2
  }),

'01062287': buildEquipFromWzInfo('01062287', '永恆弓箭手褲', {
    wzPart: 'Pants',
    islot: 'Pn',
    vslot: 'Pn',
    reqJob: 4,
    reqLevel: 250,
    incSTR: 50,
    incDEX: 50,
    incPAD: 6,
    incPDD: 325,
    tuc: 8,
    imdR: 5,
    setItemID: 888,
    bossReward: 1,
    cash: 0,
    charmEXP: 100,
    equipTradeBlock: 1,
    exItem: 1,
    price: 1,
    tradeAvailable: 2
  }),

'01062288': buildEquipFromWzInfo('01062288', '永恆盜賊褲', {
    wzPart: 'Pants',
    islot: 'Pn',
    vslot: 'Pn',
    reqJob: 8,
    reqLevel: 250,
    incDEX: 50,
    incLUK: 50,
    incPAD: 6,
    incPDD: 325,
    tuc: 8,
    imdR: 5,
    setItemID: 889,
    bossReward: 1,
    cash: 0,
    charmEXP: 100,
    equipTradeBlock: 1,
    exItem: 1,
    price: 1,
    tradeAvailable: 2
  }),

'01062289': buildEquipFromWzInfo('01062289', '永恆海盜褲', {
    wzPart: 'Pants',
    islot: 'Pn',
    vslot: 'Pn',
    reqJob: 16,
    reqLevel: 250,
    incSTR: 50,
    incDEX: 50,
    incPAD: 6,
    incPDD: 325,
    tuc: 8,
    imdR: 5,
    setItemID: 890,
    bossReward: 1,
    cash: 0,
    charmEXP: 100,
    equipTradeBlock: 1,
    exItem: 1,
    price: 1,
    tradeAvailable: 2
  }),

'01073629': buildEquipFromWzInfo('01073629', '永恆劍士鞋', {
    wzPart: 'Shoes',
    islot: 'So',
    vslot: 'So',
    reqJob: 1,
    reqLevel: 250,
    incSTR: 55,
    incDEX: 55,
    incPAD: 12,
    incPDD: 325,
    tuc: 8,
    setItemID: 886,
    bossReward: 1,
    cash: 0,
    charmEXP: 200,
    equipTradeBlock: 1,
    exItem: 1,
    price: 1,
    tradeAvailable: 2
  }),

'01073630': buildEquipFromWzInfo('01073630', '永恆法師鞋', {
    wzPart: 'Shoes',
    islot: 'So',
    vslot: 'So',
    reqJob: 2,
    reqLevel: 250,
    incINT: 55,
    incLUK: 55,
    incMAD: 12,
    incPDD: 325,
    incMDD: 325,
    incSpeed: 10,
    incJump: 7,
    tuc: 8,
    setItemID: 887,
    bossReward: 1,
    cash: 0,
    charmEXP: 200,
    equipTradeBlock: 1,
    exItem: 1,
    price: 1,
    tradeAvailable: 2
  }),

'01073631': buildEquipFromWzInfo('01073631', '永恆弓箭手鞋', {
    wzPart: 'Shoes',
    islot: 'So',
    vslot: 'So',
    reqJob: 4,
    reqLevel: 250,
    incSTR: 55,
    incDEX: 55,
    incPAD: 12,
    incPDD: 325,
    incMDD: 325,
    incSpeed: 10,
    incJump: 7,
    tuc: 8,
    setItemID: 888,
    bossReward: 1,
    cash: 0,
    charmEXP: 200,
    equipTradeBlock: 1,
    exItem: 1,
    price: 1,
    tradeAvailable: 2
  }),

'01073632': buildEquipFromWzInfo('01073632', '永恆盜賊鞋', {
    wzPart: 'Shoes',
    islot: 'So',
    vslot: 'So',
    reqJob: 8,
    reqLevel: 250,
    incDEX: 55,
    incLUK: 55,
    incPAD: 12,
    incPDD: 325,
    incMDD: 250,
    incSpeed: 10,
    incJump: 7,
    tuc: 8,
    setItemID: 889,
    bossReward: 1,
    cash: 0,
    charmEXP: 200,
    equipTradeBlock: 1,
    exItem: 1,
    price: 1,
    tradeAvailable: 2
  }),

'01073633': buildEquipFromWzInfo('01073633', '永恆海盜鞋', {
    wzPart: 'Shoes',
    islot: 'So',
    vslot: 'So',
    reqJob: 16,
    reqLevel: 250,
    incSTR: 55,
    incDEX: 55,
    incPAD: 12,
    incPDD: 325,
    incMDD: 250,
    incSpeed: 10,
    incJump: 7,
    tuc: 8,
    setItemID: 890,
    bossReward: 1,
    cash: 0,
    charmEXP: 200,
    equipTradeBlock: 1,
    exItem: 1,
    price: 1,
    tradeAvailable: 2
  }),

'01082760': buildEquipFromWzInfo('01082760', '永恆劍士手套', {
    wzPart: 'Glove',
    islot: 'Gv',
    vslot: 'GlGw',
    reqJob: 1,
    reqLevel: 250,
    incSTR: 55,
    incDEX: 55,
    incPAD: 12,
    incPDD: 325,
    tuc: 8,
    setItemID: 886,
    bossReward: 1,
    cash: 0,
    charmEXP: 200,
    equipTradeBlock: 1,
    exItem: 1,
    price: 1,
    tradeAvailable: 2
  }),

'01082761': buildEquipFromWzInfo('01082761', '永恆法師手套', {
    wzPart: 'Glove',
    islot: 'Gv',
    vslot: 'GlGw',
    reqJob: 2,
    reqLevel: 250,
    incINT: 55,
    incLUK: 55,
    incMAD: 12,
    incPDD: 325,
    incMDD: 250,
    tuc: 8,
    setItemID: 887,
    bossReward: 1,
    cash: 0,
    charmEXP: 200,
    equipTradeBlock: 1,
    exItem: 1,
    price: 1,
    tradeAvailable: 2
  }),

'01082762': buildEquipFromWzInfo('01082762', '永恆弓箭手手套', {
    wzPart: 'Glove',
    islot: 'Gv',
    vslot: 'GlGw',
    reqJob: 4,
    reqLevel: 250,
    incSTR: 55,
    incDEX: 55,
    incPAD: 12,
    incPDD: 325,
    incMDD: 250,
    tuc: 8,
    setItemID: 888,
    bossReward: 1,
    cash: 0,
    charmEXP: 200,
    equipTradeBlock: 1,
    exItem: 1,
    price: 1,
    tradeAvailable: 2
  }),

'01082763': buildEquipFromWzInfo('01082763', '永恆盜賊手套', {
    wzPart: 'Glove',
    islot: 'Gv',
    vslot: 'GlGw',
    reqJob: 8,
    reqLevel: 250,
    incDEX: 55,
    incLUK: 55,
    incPAD: 12,
    incPDD: 325,
    incMDD: 250,
    tuc: 8,
    setItemID: 889,
    bossReward: 1,
    cash: 0,
    charmEXP: 200,
    equipTradeBlock: 1,
    exItem: 1,
    price: 1,
    tradeAvailable: 2
  }),

'01082764': buildEquipFromWzInfo('01082764', '永恆海盜手套', {
    wzPart: 'Glove',
    islot: 'Gv',
    vslot: 'GlGw',
    reqJob: 16,
    reqLevel: 250,
    incSTR: 55,
    incDEX: 55,
    incPAD: 12,
    incPDD: 325,
    incMDD: 250,
    tuc: 8,
    setItemID: 890,
    bossReward: 1,
    cash: 0,
    charmEXP: 200,
    equipTradeBlock: 1,
    exItem: 1,
    price: 1,
    tradeAvailable: 2
  }),

'01099015': buildEquipFromWzInfo('01099015', '毀滅力量盾牌', {
    wzPart: 'Shield',
    islot: 'ohp',
    vslot: 'ohp',
    reqJob: 1,
    reqJob2: 31,
    reqLevel: 100,
    incSTR: 10,
    incDEX: 10,
    incPDD: 81,
    incMHP: 560,
    tuc: 0,
    cash: 0,
    equipTradeBlock: 1,
    price: 1
  }),

'01103433': buildEquipFromWzInfo('01103433', '永恆劍士斗篷', {
    wzPart: 'Cape',
    islot: 'Sr',
    vslot: 'Sr',
    reqJob: 1,
    reqLevel: 250,
    incSTR: 50,
    incDEX: 50,
    incINT: 50,
    incLUK: 50,
    incPAD: 9,
    incMAD: 9,
    incPDD: 600,
    tuc: 8,
    setItemID: 886,
    bossReward: 1,
    cash: 0,
    charmEXP: 100,
    equipTradeBlock: 1,
    exItem: 1,
    price: 1,
    tradeAvailable: 2
  }),

'01103434': buildEquipFromWzInfo('01103434', '永恆法師斗篷', {
    wzPart: 'Cape',
    islot: 'Sr',
    vslot: 'Sr',
    reqJob: 2,
    reqLevel: 250,
    incSTR: 50,
    incDEX: 50,
    incINT: 50,
    incLUK: 50,
    incPAD: 9,
    incMAD: 9,
    incPDD: 600,
    incMDD: 450,
    tuc: 8,
    setItemID: 887,
    bossReward: 1,
    cash: 0,
    charmEXP: 100,
    equipTradeBlock: 1,
    exItem: 1,
    price: 1,
    tradeAvailable: 2
  }),

'01103435': buildEquipFromWzInfo('01103435', '永恆弓箭手斗篷', {
    wzPart: 'Cape',
    islot: 'Sr',
    vslot: 'Sr',
    reqJob: 4,
    reqLevel: 250,
    incSTR: 50,
    incDEX: 50,
    incINT: 50,
    incLUK: 50,
    incPAD: 9,
    incMAD: 9,
    incPDD: 600,
    incMDD: 450,
    tuc: 8,
    setItemID: 888,
    bossReward: 1,
    cash: 0,
    charmEXP: 100,
    equipTradeBlock: 1,
    exItem: 1,
    price: 1,
    tradeAvailable: 2
  }),

'01103436': buildEquipFromWzInfo('01103436', '永恆盜賊斗篷', {
    wzPart: 'Cape',
    islot: 'Sr',
    vslot: 'Sr',
    reqJob: 8,
    reqLevel: 250,
    incSTR: 50,
    incDEX: 50,
    incINT: 50,
    incLUK: 50,
    incPAD: 9,
    incMAD: 9,
    incPDD: 600,
    incMDD: 450,
    tuc: 8,
    setItemID: 889,
    bossReward: 1,
    cash: 0,
    charmEXP: 100,
    equipTradeBlock: 1,
    exItem: 1,
    price: 1,
    tradeAvailable: 2
  }),

'01103437': buildEquipFromWzInfo('01103437', '永恆海盜斗篷', {
    wzPart: 'Cape',
    islot: 'Sr',
    vslot: 'Sr',
    reqJob: 16,
    reqLevel: 250,
    incSTR: 50,
    incDEX: 50,
    incINT: 50,
    incLUK: 50,
    incPAD: 9,
    incMAD: 9,
    incPDD: 600,
    incMDD: 450,
    tuc: 8,
    setItemID: 890,
    bossReward: 1,
    cash: 0,
    charmEXP: 100,
    equipTradeBlock: 1,
    exItem: 1,
    price: 1,
    tradeAvailable: 2
  }),

'01113075': buildEquipFromWzInfo('01113075', '頂級培羅德戒指', {
    wzPart: 'Ring',
    islot: 'Ri',
    vslot: 'Ri',
    reqJob: 0,
    reqLevel: 150,
    incSTR: 10,
    incDEX: 10,
    incINT: 10,
    incLUK: 10,
    incPAD: 8,
    incMAD: 8,
    incPDD: 150,
    incMDD: 150,
    incMHP: 250,
    incMMP: 250,
    incSpeed: 10,
    incJump: 0,
    tuc: 7,
    attackSpeed: 0,
    setItemID: 318,
    notSale: 0,
    cash: 0,
    equipTradeBlock: 1,
    exItem: 1,
    onlyEquip: 1,
    price: 1,
    tradeAvailable: 2
  }),

'01113306': buildEquipFromWzInfo('01113306', '巨大的恐怖', {
    wzPart: 'Ring',
    islot: 'Ri',
    vslot: 'Ri',
    reqJob: 0,
    reqLevel: 200,
    incSTR: 5,
    incDEX: 5,
    incINT: 5,
    incLUK: 5,
    incPAD: 4,
    incMAD: 4,
    incMHP: 250,
    tuc: 3,
    setItemID: 677,
    notSale: 1,
    bossReward: 1,
    equipTradeBlock: 1,
    onlyEquip: 1,
    price: 1,
    tradeAvailable: 2
  }),

'01113341': buildEquipFromWzInfo('01113341', '根源的耳語', {
    wzPart: 'Ring',
    islot: 'Ri',
    vslot: 'Ri',
    reqJob: 0,
    reqLevel: 250,
    incSTR: 10,
    incDEX: 10,
    incINT: 10,
    incLUK: 10,
    incPAD: 5,
    incMAD: 5,
    incMHP: 500,
    incMMP: 500,
    tuc: 4,
    setItemID: 1055,
    notSale: 1,
    bossReward: 1,
    equipTradeBlock: 1,
    onlyEquip: 1,
    price: 1,
    tradeAvailable: 2
  }),

'01113360': buildEquipFromWzInfo('01113360', '恍惚的噩夢', {
    wzPart: 'Ring',
    islot: 'Ri',
    vslot: 'Ri',
    reqJob: 0,
    reqLevel: 250,
    incSTR: 10,
    incDEX: 10,
    incINT: 10,
    incLUK: 10,
    incPAD: 5,
    incMAD: 5,
    incMHP: 500,
    incMMP: 500,
    tuc: 4,
    setItemID: 1055,
    notSale: 1,
    bossReward: 1,
    equipTradeBlock: 1,
    onlyEquip: 1,
    price: 1,
    tradeAvailable: 2
  }),

'01122430': buildEquipFromWzInfo('01122430', '苦痛的根源', {
    wzPart: 'Accessory',
    islot: 'Pe',
    vslot: 'Pe',
    reqJob: 0,
    reqLevel: 160,
    incSTR: 10,
    incDEX: 10,
    incINT: 10,
    incLUK: 10,
    incPAD: 3,
    incMAD: 3,
    incPDD: 200,
    tuc: 6,
    setItemID: 677,
    notSale: 1,
    bossReward: 1,
    cash: 0,
    charmEXP: 150,
    equipTradeBlock: 1,
    exItem: 1,
    onlyEquip: 1,
    price: 1,
    tradeAvailable: 2
  }),

'01122447': buildEquipFromWzInfo('01122447', '死亡之誓', {
    wzPart: 'Accessory',
    islot: 'Pe',
    vslot: 'Pe',
    reqJob: 0,
    reqLevel: 250,
    incSTR: 15,
    incDEX: 15,
    incINT: 15,
    incLUK: 15,
    incPAD: 5,
    incMAD: 5,
    incPDD: 300,
    tuc: 7,
    setItemID: 1055,
    notSale: 1,
    bossReward: 1,
    equipTradeBlock: 1,
    onlyEquip: 1,
    price: 1,
    tradeAvailable: 2
  }),

'01132308': buildEquipFromWzInfo('01132308', '夢幻的腰帶', {
    wzPart: 'Accessory',
    islot: 'Be',
    vslot: 'Be',
    reqJob: 0,
    reqLevel: 200,
    incSTR: 50,
    incDEX: 50,
    incINT: 50,
    incLUK: 50,
    incPAD: 6,
    incMAD: 6,
    incPDD: 150,
    incMHP: 150,
    tuc: 4,
    setItemID: 677,
    notSale: 1,
    bossReward: 1,
    cash: 0,
    equipTradeBlock: 1,
    exItem: 1,
    price: 1,
    tradeAvailable: 2
  }),

'01143286': buildEquipFromWzInfo('01143286', '喵喵天使', {
    wzPart: 'Accessory',
    islot: 'Me',
    vslot: 'Me',
    reqJob: 0,
    reqLevel: 0,
    incSTR: 12,
    incDEX: 12,
    incINT: 12,
    incLUK: 12,
    incPAD: 4,
    incMAD: 4,
    incPDD: 1204,
    incMDD: 1204,
    incMHP: 1204,
    incMMP: 1204,
    tuc: 0,
    tradeBlock: 1,
    notSale: 1,
    cash: 0,
    price: 0,
    onlyEquip: 1
  }),

'01143471': buildEquipFromWzInfo('01143471', '不朽的遺產', {
    wzPart: 'Accessory',
    islot: 'Me',
    vslot: 'Me',
    reqJob: 0,
    reqLevel: 250,
    incSTR: 10,
    incDEX: 10,
    incINT: 10,
    incLUK: 10,
    incPAD: 10,
    incMAD: 10,
    incMHP: 500,
    incMMP: 500,
    tuc: 0,
    bdR: 10,
    setItemID: 1055,
    notSale: 1,
    bossReward: 1,
    cash: 0,
    equipTradeBlock: 1,
    price: 0,
    onlyEquip: 1
  }),

'01152212': buildEquipFromWzInfo('01152212', '永恆劍士肩膀', {
    wzPart: 'Accessory',
    islot: 'Sh',
    vslot: 'Sh',
    reqJob: 1,
    reqLevel: 250,
    incSTR: 51,
    incDEX: 51,
    incINT: 51,
    incLUK: 51,
    incPAD: 28,
    incMAD: 28,
    incPDD: 450,
    tuc: 2,
    setItemID: 886,
    bossReward: 1,
    cash: 0,
    charmEXP: 200,
    equipTradeBlock: 1,
    price: 1,
    tradeAvailable: 2
  }),

'01152213': buildEquipFromWzInfo('01152213', '永恆法師肩膀', {
    wzPart: 'Accessory',
    islot: 'Sh',
    vslot: 'Sh',
    reqJob: 2,
    reqLevel: 250,
    incSTR: 51,
    incDEX: 51,    
    incINT: 51,
    incLUK: 51,
    incPAD: 28,
    incMAD: 28,
    tuc: 2,
    setItemID: 887,
    bossReward: 1,
    cash: 0,
    charmEXP: 200,
    equipTradeBlock: 1,
    price: 1,
    tradeAvailable: 2
  }),

'01152214': buildEquipFromWzInfo('01152214', '永恆弓箭手肩膀', {
    wzPart: 'Accessory',
    islot: 'Sh',
    vslot: 'Sh',
    reqJob: 4,
    reqLevel: 250,
    incSTR: 51,
    incDEX: 51,
    incINT: 51,
    incLUK: 51,
    incPAD: 28,
    incMAD: 28,
    tuc: 2,
    setItemID: 888,
    bossReward: 1,
    cash: 0,
    charmEXP: 200,
    equipTradeBlock: 1,
    price: 1,
    tradeAvailable: 2
  }),

'01152215': buildEquipFromWzInfo('01152215', '永恆盜賊肩膀', {
    wzPart: 'Accessory',
    islot: 'Sh',
    vslot: 'Sh',
    reqJob: 8,
    reqLevel: 250,
    incSTR: 51,
    incDEX: 51,
    incINT: 51,
    incLUK: 51,
    incPAD: 28,
    incMAD: 28,
    tuc: 2,
    setItemID: 889,
    bossReward: 1,
    cash: 0,
    charmEXP: 200,
    equipTradeBlock: 1,
    price: 1,
    tradeAvailable: 2
  }),

'01152216': buildEquipFromWzInfo('01152216', '永恆海盜肩膀', {
    wzPart: 'Accessory',
    islot: 'Sh',
    vslot: 'Sh',
    reqJob: 16,
    reqLevel: 250,
    incSTR: 51,
    incDEX: 51,
    incINT: 51,
    incLUK: 51,
    incPAD: 28,
    incMAD: 28,
    tuc: 2,
    setItemID: 890,
    bossReward: 1,
    cash: 0,
    charmEXP: 200,
    equipTradeBlock: 1,
    price: 1,
    tradeAvailable: 2
  }),

'01162080': buildEquipFromWzInfo('01162080', '受詛咒的赤魔導書', {
    wzPart: 'Accessory',
    islot: 'Po',
    vslot: 'Po',
    reqJob: 0,
    reqLevel: 160,
    incSTR: 20,
    incDEX: 10,
    incINT: 10,
    incLUK: 10,
    incPAD: 10,
    incMAD: 10,
    incMHP: 100,
    incMMP: 100,
    tuc: 0,
    setItemID: 677,
    notSale: 1,
    bossReward: 1,
    cash: 0,
    equipTradeBlock: 1,
    exItem: 1,
    price: 1
  }),

'01162081': buildEquipFromWzInfo('01162081', '受詛咒的青魔導書', {
    wzPart: 'Accessory',
    islot: 'Po',
    vslot: 'Po',
    reqJob: 0,
    reqLevel: 160,
    incSTR: 10,
    incDEX: 10,
    incINT: 20,
    incLUK: 10,
    incPAD: 10,
    incMAD: 10,
    incMHP: 100,
    incMMP: 100,
    tuc: 0,
    setItemID: 677,
    notSale: 1,
    bossReward: 1,
    cash: 0,
    equipTradeBlock: 1,
    exItem: 1,
    price: 1
  }),

'01162082': buildEquipFromWzInfo('01162082', '受詛咒的綠魔導書', {
    wzPart: 'Accessory',
    islot: 'Po',
    vslot: 'Po',
    reqJob: 0,
    reqLevel: 160,
    incSTR: 10,
    incDEX: 20,
    incINT: 10,
    incLUK: 10,
    incPAD: 10,
    incMAD: 10,
    incMHP: 100,
    incMMP: 100,
    tuc: 0,
    setItemID: 677,
    notSale: 1,
    bossReward: 1,
    cash: 0,
    equipTradeBlock: 1,
    exItem: 1,
    price: 1
  }),

  '01162083': buildEquipFromWzInfo('01162083', '受詛咒的黃魔導書', {
    wzPart: 'Accessory',
    islot: 'Po',
    vslot: 'Po',
    reqJob: 0,
    reqLevel: 160,
    incSTR: 10,
    incDEX: 10,
    incINT: 10,
    incLUK: 20,
    incPAD: 10,
    incMAD: 10,
    incMHP: 100,
    incMMP: 100,
    tuc: 0,
    setItemID: 677,
    notSale: 1,
    bossReward: 1,
    cash: 0,
    equipTradeBlock: 1,
    exItem: 1,
    price: 1
  }),

'01182285': buildEquipFromWzInfo('01182285', '創世的胸章', {
    wzPart: 'Accessory',
    islot: 'Ba',
    vslot: 'Ba',
    reqJob: 0,
    reqLevel: 200,
    incSTR: 15,
    incDEX: 15,
    incINT: 15,
    incLUK: 15,
    incPAD: 10,
    incMAD: 10,
    incSpeed: 10,
    incJump: 10,
    tuc: 2,
    setItemID: 677,
    notSale: 1,
    bossReward: 1,
    cash: 0,
    equipTradeBlock: 1,
    price: 1
  }),

'01190566': buildEquipFromWzInfo('01190566', '米特拉的憤怒: 劍士', {
    wzPart: 'Emblem',
    islot: 'Em',
    vslot: 'Em',
    reqJob: 1,
    reqLevel: 200,
    incSTR: 40,
    incDEX: 40,
    incINT: 0,
    incLUK: 0,
    incPAD: 5,
    incMAD: 5,
    incMHP: 700,
    tuc: 0,
    setItemID: 677,
    equipTradeBlock: 1,
    notSale: 1,
    bossReward: 1,
    cash: 0,
    charmEXP: 150,
    price: 1
  }),

'01190567': buildEquipFromWzInfo('01190567', '米特拉的憤怒: 弓箭手', {
    wzPart: 'Emblem',
    islot: 'Em',
    vslot: 'Em',
    reqJob: 1,
    reqLevel: 200,
    incSTR: 40,
    incDEX: 40,
    incINT: 0,
    incLUK: 0,
    incPAD: 5,
    incMAD: 5,
    incMHP: 700,
    tuc: 0,
    setItemID: 677,
    equipTradeBlock: 1,
    notSale: 1,
    bossReward: 1,
    cash: 0,
    charmEXP: 150,
    price: 1
  }),

'01190568': buildEquipFromWzInfo('01190568', '米特拉的憤怒: 法師', {
    wzPart: 'Emblem',
    islot: 'Em',
    vslot: 'Em',
    reqJob: 1,
    reqLevel: 200,
    incSTR: 0,
    incDEX: 0,
    incINT: 40,
    incLUK: 40,
    incPAD: 5,
    incMAD: 5,
    incMHP: 700,
    tuc: 0,
    setItemID: 677,
    equipTradeBlock: 1,
    notSale: 1,
    bossReward: 1,
    cash: 0,
    charmEXP: 150,
    price: 1
  }),

'01190569': buildEquipFromWzInfo('01190569', '米特拉的憤怒: 盜賊', {
    wzPart: 'Emblem',
    islot: 'Em',
    vslot: 'Em',
    reqJob: 1,
    reqLevel: 200,
    incSTR: 0,
    incDEX: 40,
    incINT: 0,
    incLUK: 40,
    incPAD: 5,
    incMAD: 5,
    incMHP: 700,
    tuc: 0,
    setItemID: 677,
    equipTradeBlock: 1,
    notSale: 1,
    bossReward: 1,
    cash: 0,
    charmEXP: 150,
    price: 1
  }),

'01190570': buildEquipFromWzInfo('01190570', '米特拉的憤怒: 海盜', {
    wzPart: 'Emblem',
    islot: 'Em',
    vslot: 'Em',
    reqJob: 1,
    reqLevel: 200,
    incSTR: 40,
    incDEX: 40,
    incINT: 0,
    incLUK: 0,
    incPAD: 5,
    incMAD: 5,
    incMHP: 700,
    tuc: 0,
    setItemID: 677,
    equipTradeBlock: 1,
    notSale: 1,
    bossReward: 1,
    cash: 0,
    charmEXP: 150,
    price: 1
  }),

'01215032': buildEquipFromWzInfo('01215032', '神秘冥界幽靈之劍', {
    islot: 'Wp',
    vslot: 'Wp',
    reqJob: 1,
    reqJob2: 161,
    reqLevel: 200,
    incSTR: 100,
    incDEX: 100,
    incPAD: 295,
    tuc: 8,
    attackSpeed: 4,
    imdR: 20,
    bdR: 30,
    setItemID: 617,
    sfx: 'swordS',
    afterImage: 'swordOS',
    exceptUpgrade: 1,
    tradeBlock: 1,
    notSale: 1,
    equipTradeBlock: 1
  }),

'01215041': buildEquipFromWzInfo('01215041', '命運之劍', {
    islot: 'Wp',
    vslot: 'Wp',
    reqJob: 1,
    reqJob2: 161,
    reqLevel: 250,
    incSTR: 190,
    incDEX: 190,
    incPAD: 373,
    tuc: 9,
    attackSpeed: 6,
    imdR: 20,
    bdR: 30,
    setItemID: 886,
    sfx: 'swordS',
    afterImage: 'swordOS',
    exceptUpgrade: 1,
    tradeBlock: 1,
    notSale: 1,
    exceptUpgrade: 1,
    tradeBlock: 1,
    notSale: 1,
    bossReward: 1,
    cash: 0,
    charmEXP: 200,
    exItem: 1,
    exceptToadsHammer: 1,
    jokerToSetItem: 1,
    noDrop: 1,
    onlyEquip: 1,
    price: 1,
    undecomposable: 1,
    unsyntesizable: 1
  }),

'01242163': buildEquipFromWzInfo('01242163', '命運能量劍', {
    wzPart: 'Weapon',
    islot: 'Wp',
    vslot: 'Wp',
    reqJob: 24,
    reqJob2: 36,
    reqLevel: 250,
    incDEX: 190,
    incLUK: 190,
    incPAD: 280,
    tuc: 9,
    attackSpeed: 5,
    imdR: 20,
    bdR: 30,
    setItemID: 889,
    sfx: 'swordS',
    afterImage: 'swordOS',
    exceptUpgrade: 1,
    tradeBlock: 1,
    notSale: 1,
    bossReward: 1,
    cash: 0,
    charmEXP: 200,
    exItem: 1,
    exceptToadsHammer: 1,
    jokerToSetItem: 1,
    noDrop: 1,
    onlyEquip: 1,
    price: 1,
    undecomposable: 1,
    unsyntesizable: 1
  }),

'01254029': buildEquipFromWzInfo('01254029', '命運陰陽扇', {
    islot: 'Wp',
    vslot: 'Wp',
    reqJob: 2,
    reqJob2: 42,
    reqLevel: 250,
    incINT: 190,
    incLUK: 190,
    incPAD: 260,
    incMAD: 439,
    tuc: 8,
    attackSpeed: 4,
    imdR: 20,
    bdR: 30,
    setItemID: 887,
    sfx: 'mace',
    afterImage: 'mace',
    exceptUpgrade: 1,
    tradeBlock: 1,
    notSale: 1,
    onlyEquip: 1,
    undecomposable: 1,
    unsyntesizable: 1
  }),

'01354309': buildEquipFromWzInfo('01354309', '千魂降臨靈符', {
    wzPart: 'Weapon',
    islot: 'ohp',
    vslot: 'ohp',
    reqJob: 2,
    reqJob2: 42,
    reqLevel: 200,
    incINT: 60,
    incLUK: 60,
    incMAD: 175,
    tuc: 9,
    bossReward: 1,
    cash: 0,
    charmEXP: 200,
    equipTradeBlock: 1,
    exItem: 1,
    price: 1,
    tradeAvailable: 2
  }),

'01354312': buildEquipFromWzInfo('01354312', '阿斯特拉靈符', {
    wzPart: 'Weapon',
    islot: 'ohp',
    vslot: 'ohp',
    reqJob: 2,
    reqJob2: 42,
    reqLevel: 200,
    incINT: 95,
    incLUK: 95,
    incMAD: 260,
    tuc: 10,
    exceptUpgrade: 0,
    tradeBlock: 1,
    notSale: 1,
    cash: 0,
    charmEXP: 200,
    exceptToadsHammer: 1,
    noDrop: 1,
    onlyEquip: 1,
    price: 1,
    undecomposable: 1,
    unsyntesizable: 1
  }),

'01672101': buildEquipFromWzInfo('01672101', '全面控制核心', {
    wzPart: 'Android',
    islot: 'Tm',
    vslot: 'Tm',
    reqJob: 0,
    reqLevel: 200,
    incSTR: 25,
    incDEX: 25,
    incINT: 25,
    incLUK: 25,
    incPAD: 15,
    incMAD: 15,
    incMHP: 1250,
    tuc: 10,
    imdR: 30,
    setItemID: 677,
    tradeBlock: 1,
    cash: 0,
    price: 1,
    tradeBlock: 1,
    equipTradeBlock: 1
  }),

'01723502': buildEquipFromWzInfo('01723502', '阿斯特拉發信器', {
    wzPart: 'OffHandWeapon',
    islot: 'ohp',
    vslot: 'ohp',
    reqJob: 8,
    reqJob2: 36,
    reqLevel: 200,
    incDEX: 20,
    incLUK: 20,
    incPAD: 7,
    tuc: 0,
    atlas: 1,
    exceptUpgrade: 0,
    tradeBlock: 1,
    notSale: 1,
    cash: 0,
    charmEXP: 200,
    exceptToadsHammer: 1,
    noDrop: 1,
    onlyEquip: 1,
    price: 1,
    undecomposable: 1,
    unsyntesizable: 1
  }),

'01724302': buildEquipFromWzInfo('01724302', '阿斯特拉如意寶珠', {
    wzPart: 'Weapon',
    islot: 'ohp',
    vslot: 'ohp',
    reqJob: 1,
    reqJob2: 161,
    reqLevel: 200,
    incSTR: 20,
    incDEX: 20,
    incPAD: 7,
    tuc: 0,
    atlas: 1,
    exceptUpgrade: 0,
    tradeBlock: 1,
    notSale: 1,
    cash: 0,
    charmEXP: 200,
    exceptToadsHammer: 1,
    noDrop: 1,
    onlyEquip: 1,
    price: 1,
    undecomposable: 1,
    unsyntesizable: 1
  })
};

// ==========================================
// 3. 當前狀態資料
// ==========================================

const INVENTORY_SLOT_COUNT = 128;

let playerInventoryEquip = new Array(INVENTORY_SLOT_COUNT).fill(null);
let playerInventoryConsume = new Array(INVENTORY_SLOT_COUNT).fill(null);
/** 裝備分頁各格子的強化進度（卸下後保留，重置按鈕會清空） */
let playerInventoryState = new Array(INVENTORY_SLOT_COUNT).fill(null);

/** @deprecated 腳本相容用，指向裝備分頁 */
let playerInventory = playerInventoryEquip;

playerInventory[0] = '01005980';
playerInventory[1] = '01005981';
playerInventory[2] = '01005982';
playerInventory[3] = '01005983';
playerInventory[4] = '01005984';
playerInventory[5] = '01012632';
playerInventory[6] = '01012911';
playerInventory[7] = '01022278';
playerInventory[8] = '01032316';
playerInventory[9] = '01042433';
playerInventory[10] = '01042434';
playerInventory[11] = '01042435';
playerInventory[12] = '01042436';
playerInventory[13] = '01042437';
playerInventory[14] = '01062285';
playerInventory[15] = '01062286';
playerInventory[16] = '01062287';
playerInventory[17] = '01062288';
playerInventory[18] = '01062289';
playerInventory[19] = '01073629';
playerInventory[20] = '01073630';
playerInventory[21] = '01073631';
playerInventory[22] = '01073632';
playerInventory[23] = '01073633';
playerInventory[24] = '01082760';
playerInventory[25] = '01082761';
playerInventory[26] = '01082762';
playerInventory[27] = '01082763';
playerInventory[28] = '01082764';
playerInventory[29] = '01099015';
playerInventory[30] = '01103433';
playerInventory[31] = '01103434';
playerInventory[32] = '01103435';
playerInventory[33] = '01103436';
playerInventory[34] = '01103437';
playerInventory[35] = '01113306';
playerInventory[36] = '01122430';
playerInventory[37] = '01122447';
playerInventory[38] = '01132308';
playerInventory[39] = '01143471';
playerInventory[40] = '01152212';
playerInventory[41] = '01190566';
playerInventory[42] = '01190567';
playerInventory[43] = '01190568';
playerInventory[44] = '01190569';
playerInventory[45] = '01190570';
playerInventory[46] = '01215032';
playerInventory[47] = '01215041';
playerInventory[48] = '01242163';
playerInventory[49] = '01254029';
playerInventory[50] = '01354309';
playerInventory[51] = '01354312';
playerInventory[52] = '01672101';
playerInventory[53] = '01723502';
playerInventory[54] = '01724302';
playerInventory[55] = '01152213';
playerInventory[56] = '01152214';
playerInventory[57] = '01152215';
playerInventory[58] = '01152216';
playerInventory[59] = '01113341';
playerInventory[60] = '01143286';
playerInventory[61] = '01113360';
playerInventory[62] = '01113075';
playerInventory[63] = '01182285';
playerInventory[64] = '01162080';
playerInventory[65] = '01162081';
playerInventory[66] = '01162082';
playerInventory[67] = '01162083';

let currentEnchantItem = null;

/**
 * 預設背包裝備順序（必須放在 currentEnchantItem 之後，避免 import --inventory 打亂）
 * 1) playerInventory 明確指定的順序
 * 2) ITEM_DATABASE 其餘裝備自動補上（之後新增裝備只要寫進資料庫即可）
 */
function buildDefaultPlayerInventoryEquipIds() {
  const ids = [];
  const seen = new Set();

  if (typeof playerInventoryEquip !== 'undefined') {
    for (const id of playerInventoryEquip) {
      if (!id || seen.has(id)) continue;
      if (typeof ITEM_DATABASE !== 'undefined' && !ITEM_DATABASE[id]) continue;
      ids.push(id);
      seen.add(id);
    }
  }

  if (typeof ITEM_DATABASE !== 'undefined') {
    for (const id of Object.keys(ITEM_DATABASE)) {
      if (seen.has(id)) continue;
      ids.push(id);
      seen.add(id);
    }
  }

  return ids;
}

/** 啟動當下鎖定；存檔合併時另會再掃一遍 ITEM_DATABASE */
const DEFAULT_PLAYER_INVENTORY_EQUIP_IDS = Object.freeze(buildDefaultPlayerInventoryEquipIds());

(function applyInitialDefaultEquipInventory() {
  const next = new Array(INVENTORY_SLOT_COUNT).fill(null);
  DEFAULT_PLAYER_INVENTORY_EQUIP_IDS.forEach((id, index) => {
    if (index < INVENTORY_SLOT_COUNT) next[index] = id;
  });
  playerInventoryEquip.splice(0, playerInventoryEquip.length, ...next);
})();
