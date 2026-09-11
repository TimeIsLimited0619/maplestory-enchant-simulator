/**
 * 放置模式 NPC 商店清單（全地圖共用一間商店）
 *
 * 維護方式：只改 IDLE_NPC_SHOP.buyList。
 * buyList 欄位：
 *   kind     : 'equip' | 'consume' | 'scroll' | 'etc' | 'special' …
 *   itemId   : 物品／卷軸 id（藥水用 potion-red 等，或 consumeType: 'potion'）
 *   buyPrice : 商店售價（楓幣）
 *   amount   : 選填，預設 1
 *   minLevel : 選填，可購買最低等級（含），預設 1
 *   maxLevel : 選填，可購買最高等級（含）；省略＝無上限
 * kind: 'scroll' 會依 itemId 自動辨識：
 *   潛能卷軸（getPotentialScrollById）／星力卷軸／榮耀卷軸
 * kind: 'consume' 會依 itemId 自動辨識：
 *   藥水（IdlePotionStore）／星火（getBonusStatItemById，如 eternalFlame）／飛鏢（ThrowingStarStore）
 * 也可明示：{ kind: 'consume', consumeType: 'bonus_stat', itemId: 'eternalFlame', buyPrice }
 * 也可明示：{ kind: 'consume', consumeType: 'throwing_star', itemId: '02070000', buyPrice }
 * 也可明示：{ kind: 'consume', consumeType: 'potential_scroll', scrollId: 'scroll_epic_potential', buyPrice }
 * 特殊商品 specialType:
 *   hyper_point — 購入極限屬性點（直接加點，不進背包）
 * 注意：極限屬性點包（1 點／100 點）由 getBuyList() 自動插到清單最前，無需寫進 buyList。
 * 購買清單只顯示目前角色等級可購買的品項。
 */

/** 商店卷軸列：依 id 分辨潛能／星力／榮耀 */
function resolveShopScrollMeta(itemId) {
  const id = String(itemId || '').trim();
  if (!id) return null;
  if (typeof getPotentialScrollById === 'function') {
    const pot = getPotentialScrollById(id);
    if (pot) {
      return {
        consumeType: 'potential_scroll',
        scrollId: id,
        name: pot.name,
        icon: pot.icon || '',
        meta: pot,
      };
    }
  }
  if (typeof getStarForceScrollById === 'function') {
    const sf = getStarForceScrollById(id);
    if (sf) {
      return {
        consumeType: 'starforce_scroll',
        scrollId: id,
        name: sf.name,
        icon: sf.icon || '',
        meta: sf,
      };
    }
  }
  if (typeof getScrollById === 'function') {
    const glory = getScrollById(id);
    if (glory) {
      return {
        consumeType: 'glory_scroll',
        scrollId: id,
        name: glory.name,
        icon: glory.icon || '',
        meta: glory,
      };
    }
  }
  return null;
}

/** 極限屬性點商品（全等級可購；固定插在購買清單最前） */
const IDLE_SHOP_HYPER_POINT = {
  kind: 'special',
  specialType: 'hyper_point',
  itemId: 'hyper_stat_point',
  name: '極限屬性點',
  desc: '購入後永久增加 1 點可分配的極限屬性點數。',
  icon: 'images/potion/0.png',
  buyPrice: 1000000,
  amount: 1,
  minLevel: 1,
};

/** 極限屬性點 ×100（1 億楓幣） */
const IDLE_SHOP_HYPER_POINT_100 = {
  kind: 'special',
  specialType: 'hyper_point',
  itemId: 'hyper_stat_point_100',
  name: '極限屬性點 ×100',
  desc: '購入後永久增加 100 點可分配的極限屬性點數。',
  icon: 'images/potion/0.png',
  buyPrice: 100000000,
  amount: 100,
  minLevel: 1,
};

const IDLE_SHOP_HYPER_POINT_PACKS = [
  IDLE_SHOP_HYPER_POINT,
  IDLE_SHOP_HYPER_POINT_100,
];

function isShopHyperPointRow(row) {
  if (!row) return false;
  if (row.specialType === 'hyper_point') return true;
  const id = String(row.itemId || '');
  return id === 'hyper_stat_point' || id.startsWith('hyper_stat_point_');
}

/** 全地圖統一商店（依角色等級篩選可購品項） */
const IDLE_NPC_SHOP = {
  id: 'shop_unified',
  name: '雜貨商店',
  buyList: [
    { kind: 'equip', itemId: '01402001', buyPrice: 100, amount: 1, minLevel: 10, maxLevel: 14 },
    { kind: 'equip', itemId: '01372005', buyPrice: 100, amount: 1, minLevel: 10, maxLevel: 14 },   
    { kind: 'equip', itemId: '01402018', buyPrice: 200, amount: 1, minLevel: 15, maxLevel: 19 },
    { kind: 'equip', itemId: '01372006', buyPrice: 200, amount: 1, minLevel: 15, maxLevel: 19 },
    { kind: 'equip', itemId: '01402000', buyPrice: 1000, amount: 1, minLevel: 20, maxLevel: 24 },
    { kind: 'equip', itemId: '01372002', buyPrice: 1000, amount: 1, minLevel: 20, maxLevel: 24 },
    { kind: 'equip', itemId: '01402008', buyPrice: 5000, amount: 1, minLevel: 25, maxLevel: 29 },
    { kind: 'equip', itemId: '01372004', buyPrice: 5000, amount: 1, minLevel: 25, maxLevel: 29 },
    { kind: 'equip', itemId: '01402010', buyPrice: 5000, amount: 1, minLevel: 30, maxLevel: 34 },
    { kind: 'equip', itemId: '01402002', buyPrice: 5000, amount: 1, minLevel: 30, maxLevel: 34 },
    { kind: 'equip', itemId: '01372003', buyPrice: 5000, amount: 1, minLevel: 30, maxLevel: 34 },
    { kind: 'equip', itemId: '01402006', buyPrice: 6000, amount: 1, minLevel: 35, maxLevel: 39 },
    { kind: 'equip', itemId: '01372001', buyPrice: 6000, amount: 1, minLevel: 35, maxLevel: 39 },
    { kind: 'equip', itemId: '01402007', buyPrice: 10000, amount: 1, minLevel: 40, maxLevel: 49 },
    { kind: 'equip', itemId: '01372000', buyPrice: 10000, amount: 1, minLevel: 40, maxLevel: 49 },
    { kind: 'equip', itemId: '01402003', buyPrice: 20000, amount: 1, minLevel: 50, maxLevel: 59 },
    { kind: 'equip', itemId: '01372007', buyPrice: 20000, amount: 1, minLevel: 50, maxLevel: 59 },
    { kind: 'equip', itemId: '01402011', buyPrice: 40000, amount: 1, minLevel: 60, maxLevel: 69 },
    { kind: 'equip', itemId: '01372014', buyPrice: 40000, amount: 1, minLevel: 60, maxLevel: 69 },
    { kind: 'equip', itemId: '01402012', buyPrice: 80000, amount: 1, minLevel: 70, maxLevel: 79 },
    { kind: 'equip', itemId: '01372015', buyPrice: 80000, amount: 1, minLevel: 70, maxLevel: 79 },
    { kind: 'equip', itemId: '01402015', buyPrice: 100000, amount: 1, minLevel: 80, maxLevel: 89 },
    { kind: 'equip', itemId: '01402004', buyPrice: 100000, amount: 1, minLevel: 80, maxLevel: 89 },
    { kind: 'equip', itemId: '01372016', buyPrice: 100000, amount: 1, minLevel: 80, maxLevel: 89 },
    { kind: 'equip', itemId: '01402016', buyPrice: 150000, amount: 1, minLevel: 90, maxLevel: 99 },
    { kind: 'equip', itemId: '01402005', buyPrice: 150000, amount: 1, minLevel: 90, maxLevel: 99 },
    { kind: 'equip', itemId: '01372009', buyPrice: 150000, amount: 1, minLevel: 90, maxLevel: 99 },
    { kind: 'equip', itemId: '01402035', buyPrice: 300000, amount: 1, minLevel: 100, maxLevel: 109 },
    { kind: 'equip', itemId: '01372010', buyPrice: 300000, amount: 1, minLevel: 100, maxLevel: 109 },
    { kind: 'equip', itemId: '01402036', buyPrice: 400000, amount: 1, minLevel: 110 },
    { kind: 'equip', itemId: '01372032', buyPrice: 400000, amount: 1, minLevel: 110 },
    //雙弩槍
    { kind: 'equip', itemId: '01522000', buyPrice: 100, amount: 1, minLevel: 10, maxLevel: 19 },
    { kind: 'equip', itemId: '01522002', buyPrice: 1000, amount: 1, minLevel: 20, maxLevel: 29 },
    { kind: 'equip', itemId: '01522004', buyPrice: 5000, amount: 1, minLevel: 30, maxLevel: 39 },
    { kind: 'equip', itemId: '01522006', buyPrice: 10000, amount: 1, minLevel: 40, maxLevel: 49 },
    { kind: 'equip', itemId: '01522007', buyPrice: 20000, amount: 1, minLevel: 50, maxLevel: 59 },
    { kind: 'equip', itemId: '01522008', buyPrice: 40000, amount: 1, minLevel: 60, maxLevel: 69 },
    { kind: 'equip', itemId: '01522009', buyPrice: 80000, amount: 1, minLevel: 70, maxLevel: 79 },
    { kind: 'equip', itemId: '01522010', buyPrice: 100000, amount: 1, minLevel: 80, maxLevel: 89 },
    { kind: 'equip', itemId: '01522011', buyPrice: 150000, amount: 1, minLevel: 90, maxLevel: 99 },
    { kind: 'equip', itemId: '01522012', buyPrice: 300000, amount: 1, minLevel: 100, maxLevel: 109 },
    { kind: 'equip', itemId: '01522014', buyPrice: 400000, amount: 1, minLevel: 110 },
    //拳套
    { kind: 'equip', itemId: '01472000', buyPrice: 100, amount: 1, minLevel: 10, maxLevel: 19 },
    { kind: 'equip', itemId: '01472006', buyPrice: 1000, amount: 1, minLevel: 20, maxLevel: 29 },
    { kind: 'equip', itemId: '01472010', buyPrice: 5000, amount: 1, minLevel: 30, maxLevel: 34 },
    { kind: 'equip', itemId: '01472013', buyPrice: 6000, amount: 1, minLevel: 35, maxLevel: 39 },
    { kind: 'equip', itemId: '01472017', buyPrice: 10000, amount: 1, minLevel: 40, maxLevel: 49 },
    { kind: 'equip', itemId: '01472021', buyPrice: 20000, amount: 1, minLevel: 50, maxLevel: 59 },
    { kind: 'equip', itemId: '01472025', buyPrice: 40000, amount: 1, minLevel: 60, maxLevel: 69 },
    { kind: 'equip', itemId: '01472029', buyPrice: 80000, amount: 1, minLevel: 70, maxLevel: 79 },
    { kind: 'equip', itemId: '01472031', buyPrice: 100000, amount: 1, minLevel: 80, maxLevel: 89 },
    { kind: 'equip', itemId: '01472033', buyPrice: 150000, amount: 1, minLevel: 90, maxLevel: 99 },
    { kind: 'equip', itemId: '01472053', buyPrice: 300000, amount: 1, minLevel: 100, maxLevel: 109 },
    { kind: 'equip', itemId: '01472052', buyPrice: 400000, amount: 1, minLevel: 110 },

    { kind: 'consume', itemId: 'potion-red', buyPrice: 50, amount: 1, minLevel: 1, maxLevel: 15 },
    { kind: 'consume', itemId: 'potion-orange', buyPrice: 150, amount: 1, minLevel: 15 },
    { kind: 'consume', itemId: 'potion-white', buyPrice: 300, amount: 1, minLevel: 25 },
    { kind: 'consume', itemId: 'grilled-eel', buyPrice: 1000, amount: 1, minLevel: 40 },
    { kind: 'consume', itemId: 'Reindeer-milk', buyPrice: 5000, amount: 1, minLevel: 65 },
    { kind: 'consume', itemId: '02022089', buyPrice: 10000, amount: 1, minLevel: 100 },
    { kind: 'consume', itemId: '02020031', buyPrice: 30000, amount: 1, minLevel: 100 },

    // 飛鏢（Consume 0207；售價／等級依 WZ，price≤0 時用 PAD×1000）
    { kind: 'consume', consumeType: 'throwing_star', itemId: '02070022', buyPrice: 100, amount: 1, minLevel: 10 },
    { kind: 'consume', consumeType: 'throwing_star', itemId: '02070000', buyPrice: 100, amount: 1, minLevel: 10 },
    { kind: 'consume', consumeType: 'throwing_star', itemId: '02070001', buyPrice: 5000, amount: 1, minLevel: 20 },
    { kind: 'consume', consumeType: 'throwing_star', itemId: '02070002', buyPrice: 10000, amount: 1, minLevel: 30 },
    { kind: 'consume', consumeType: 'throwing_star', itemId: '02070011', buyPrice: 50000, amount: 1, minLevel: 40 },
    { kind: 'consume', consumeType: 'throwing_star', itemId: '02070003', buyPrice: 50000, amount: 1, minLevel: 40 },
    { kind: 'consume', consumeType: 'throwing_star', itemId: '02070004', buyPrice: 100000, amount: 1, minLevel: 60 },
    { kind: 'consume', consumeType: 'throwing_star', itemId: '02070005', buyPrice: 150000, amount: 1, minLevel: 80 },
    { kind: 'consume', consumeType: 'throwing_star', itemId: '02070006', buyPrice: 200000, amount: 1, minLevel: 100 },
    { kind: 'consume', consumeType: 'throwing_star', itemId: '02070024', buyPrice: 200000, amount: 1, minLevel: 100 },
    { kind: 'consume', consumeType: 'throwing_star', itemId: '02070007', buyPrice: 200000, amount: 1, minLevel: 100 },
    { kind: 'consume', consumeType: 'throwing_star', itemId: '02070026', buyPrice: 250000, amount: 1, minLevel: 110 },
    { kind: 'consume', consumeType: 'throwing_star', itemId: '02070023', buyPrice: 300000, amount: 1, minLevel: 120 },
    { kind: 'consume', consumeType: 'throwing_star', itemId: '02070018', buyPrice: 500000, amount: 1, minLevel: 130 },
    { kind: 'consume', consumeType: 'throwing_star', itemId: '02070019', buyPrice: 500000, amount: 1, minLevel: 130 },


    { kind: 'scroll', itemId: 'scroll_normal_non_weapon_str_100', buyPrice: 5000, amount: 1, minLevel: 10 },
    { kind: 'scroll', itemId: 'scroll_normal_weapon_atk_100', buyPrice: 10000, amount: 1, minLevel: 10 },
    { kind: 'scroll', itemId: 'scroll_normal_weapon_matk_100', buyPrice: 10000, amount: 1, minLevel: 10 },
    { kind: 'scroll', itemId: 'scroll_normal_non_weapon_str_70', buyPrice: 20000, amount: 1, minLevel: 25 },
    { kind: 'scroll', itemId: 'scroll_normal_weapon_atk_70', buyPrice: 40000, amount: 1, minLevel: 40 },
    { kind: 'scroll', itemId: 'scroll_normal_weapon_matk_70', buyPrice: 40000, amount: 1, minLevel: 40 },
    { kind: 'scroll', itemId: 'scroll_normal_non_weapon_str_30', buyPrice: 50000, amount: 1, minLevel: 40 },
    { kind: 'scroll', itemId: 'scroll_normal_weapon_atk_30', buyPrice: 100000, amount: 1, minLevel: 40 },
    { kind: 'scroll', itemId: 'scroll_normal_weapon_matk_30', buyPrice: 100000, amount: 1, minLevel: 40 },
    { kind: 'scroll', itemId: 'scroll_normal_non_weapon_str_15', buyPrice: 200000, amount: 1, minLevel: 65 },
    { kind: 'scroll', itemId: 'scroll_normal_weapon_atk_15', buyPrice: 400000, amount: 1, minLevel: 70 },
    { kind: 'scroll', itemId: 'scroll_normal_weapon_matk_15', buyPrice: 400000, amount: 1, minLevel: 70 },


    { kind: 'scroll', itemId: 'scroll_epic_potential', buyPrice: 1000000, amount: 1, minLevel: 60 },
    { kind: 'consume', itemId: 'eternalFlame', buyPrice: 10000000, amount: 1, minLevel: 100 },
  ],
};

/** @deprecated 相容舊程式；等同 [IDLE_NPC_SHOP] */
const IDLE_NPC_SHOPS = {
  [IDLE_NPC_SHOP.id]: IDLE_NPC_SHOP,
};

const IdleNpcShopCatalog = {
  REPURCHASE_MAX: 20,
  UNIFIED_SHOP_ID: IDLE_NPC_SHOP.id,

  listShops() {
    return [IDLE_NPC_SHOP];
  },

  getShop(shopId) {
    if (!shopId || shopId === IDLE_NPC_SHOP.id) return IDLE_NPC_SHOP;
    // 舊商店 id 一律導向統一商店
    return IDLE_NPC_SHOP;
  },

  /** 全地圖共用同一間商店 */
  getUnifiedShop() {
    return IDLE_NPC_SHOP;
  },

  /** @deprecated 改為永遠回傳統一商店 */
  resolveShopIdForZone(_zone) {
    return IDLE_NPC_SHOP.id;
  },

  /** @deprecated 改為永遠回傳統一商店 */
  getShopForCurrentZone() {
    return IDLE_NPC_SHOP;
  },

  playerLevel() {
    if (typeof CharacterProgression !== 'undefined' && CharacterProgression.getState) {
      return Math.max(1, Math.floor(Number(CharacterProgression.getState().level) || 1));
    }
    if (typeof IdleZones !== 'undefined' && typeof IdleZones.playerLevel === 'function') {
      return Math.max(1, Math.floor(Number(IdleZones.playerLevel()) || 1));
    }
    return 1;
  },

  rowMinLevel(row) {
    const n = Number(row?.minLevel);
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : 1;
  },

  rowMaxLevel(row) {
    if (row == null || row.maxLevel == null || row.maxLevel === '') return null;
    const n = Number(row.maxLevel);
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : null;
  },

  /** 目前等級是否可購買此列 */
  isRowAvailable(row, level = this.playerLevel()) {
    if (!row) return false;
    const lv = Math.max(1, Math.floor(Number(level) || 1));
    if (lv < this.rowMinLevel(row)) return false;
    const max = this.rowMaxLevel(row);
    if (max != null && lv > max) return false;
    return true;
  },

  /**
   * 購買分類：equip / consume / scroll / misc
   * scroll 含 kind:scroll 與潛能／星力／榮耀卷軸消耗型
   * 星火（bonus_stat）歸入雜項
   */
  buyCategoryOf(row) {
    if (!row) return 'misc';
    if (row.kind === 'equip') return 'equip';
    if (row.kind === 'scroll') return 'scroll';
    const ct = String(row.consumeType || '');
    if (ct === 'potential_scroll' || ct === 'starforce_scroll' || ct === 'glory_scroll') {
      return 'scroll';
    }
    if (ct === 'bonus_stat'
      || (typeof getBonusStatItemById === 'function' && getBonusStatItemById(row.itemId))) {
      return 'misc';
    }
    if (row.kind === 'consume' || row.consumeType) return 'consume';
    return 'misc';
  },

  /** 依分類篩選可購清單（已套用等級） */
  getBuyListByCategory(category, shopId, opts = {}) {
    const cat = String(category || '');
    return this.getBuyList(shopId, opts).filter((row) => this.buyCategoryOf(row) === cat);
  },

  /** 目前等級下，各分類是否有可購品項 */
  getAvailableBuyCategories(shopId, opts = {}) {
    const counts = { equip: 0, consume: 0, scroll: 0, misc: 0 };
    this.getBuyList(shopId, opts).forEach((row) => {
      const c = this.buyCategoryOf(row);
      if (counts[c] != null) counts[c] += 1;
      else counts.misc += 1;
    });
    return ['equip', 'consume', 'scroll', 'misc'].filter((id) => counts[id] > 0);
  },

  /**
   * 可購買清單（已依角色等級篩選）
   * @param {string} [_shopId] 忽略；保留參數相容舊呼叫
   * @param {{ level?: number, filterByLevel?: boolean }} [opts]
   */
  getBuyList(_shopId, opts = {}) {
    const filterByLevel = opts.filterByLevel !== false;
    const level = opts.level != null ? opts.level : this.playerLevel();
    const base = Array.isArray(IDLE_NPC_SHOP.buyList) ? IDLE_NPC_SHOP.buyList.slice() : [];
    // 極限屬性點包固定插最前；buyList 若再寫一次則去掉避免重複
    const packIds = new Set(IDLE_SHOP_HYPER_POINT_PACKS.map((p) => p.itemId));
    const rest = base.filter((row) => !(row && (
      isShopHyperPointRow(row) || packIds.has(row.itemId)
    )));
    const full = [
      ...IDLE_SHOP_HYPER_POINT_PACKS.map((p) => ({ ...p })),
      ...rest,
    ];
    if (!filterByLevel) return full;
    return full.filter((row) => this.isRowAvailable(row, level));
  },

  normalizeSellPrice(raw) {
    const p = Number(raw);
    if (Number.isFinite(p) && p > 0) return Math.floor(p);
    return 1;
  },

  /** 販售價：裝備／物品 price，缺省或 ≤0 → 1 */
  getSellPrice(itemId, state = null) {
    const fromState = Number(state?.price);
    if (Number.isFinite(fromState) && fromState > 0) return Math.floor(fromState);
    const item = typeof ITEM_DATABASE !== 'undefined' ? ITEM_DATABASE[itemId] : null;
    return this.normalizeSellPrice(item?.price ?? item?.wz?.price);
  },

  resolveConsumeEntryDisplay(entry) {
    if (!entry) return { name: '', icon: '', price: 1 };
    const T = typeof CONSUME_ITEM_TYPE !== 'undefined' ? CONSUME_ITEM_TYPE : {};
    let meta = null;

    if (typeof isStarForceScrollConsumeEntry === 'function' && isStarForceScrollConsumeEntry(entry)) {
      meta = typeof getStarForceScrollById === 'function' ? getStarForceScrollById(entry.scrollId) : null;
    } else if (typeof isPotentialScrollConsumeEntry === 'function' && isPotentialScrollConsumeEntry(entry)) {
      meta = typeof getPotentialScrollById === 'function' ? getPotentialScrollById(entry.scrollId) : null;
    } else if (entry.type === T.CUBE || entry.type === 'cube') {
      meta = typeof getPotentialCubeById === 'function' ? getPotentialCubeById(entry.cubeId) : null;
    } else if (entry.type === T.ADD_CUBE || entry.type === 'add_cube') {
      meta = typeof getAddPotCubeById === 'function' ? getAddPotCubeById(entry.cubeId) : null;
    } else if (entry.type === T.HAMMER || entry.type === 'hammer') {
      meta = typeof HAMMER_TYPES !== 'undefined' ? HAMMER_TYPES[entry.hammerId] : null;
    } else if (entry.type === T.GLORY_SCROLL || entry.type === 'glory_scroll') {
      meta = typeof getScrollById === 'function' ? getScrollById(entry.scrollId) : null;
    } else if (entry.type === T.BONUS_STAT || entry.type === 'bonus_stat') {
      meta = typeof getBonusStatItemById === 'function' ? getBonusStatItemById(entry.itemId) : null;
    } else if (entry.type === T.EXCEPTIONAL_HAMMER || entry.type === 'exceptional_hammer') {
      meta = typeof getExceptionalHammerById === 'function' ? getExceptionalHammerById(entry.hammerId) : null;
    } else if (entry.type === T.SOUL || entry.type === 'soul') {
      meta = typeof getSoulMaterialById === 'function' ? getSoulMaterialById(entry.soulId) : null;
    } else if (entry.type === T.RECOVERY_CARD || entry.type === 'recovery_card') {
      meta = typeof RECOVERY_CARD !== 'undefined' ? RECOVERY_CARD : null;
    } else if (entry.type === T.POTION || entry.type === 'potion') {
      meta = typeof IdlePotionStore !== 'undefined' ? IdlePotionStore.get(entry.itemId) : null;
      if (meta) {
        return {
          name: meta.name,
          icon: IdlePotionStore.resolveIcon(meta.icon),
          price: this.normalizeSellPrice(meta?.price ?? entry?.price),
        };
      }
    } else if (entry.type === T.THROWING_STAR || entry.type === 'throwing_star') {
      meta = typeof ThrowingStarStore !== 'undefined' ? ThrowingStarStore.get(entry.itemId) : null;
      if (meta) {
        return {
          name: meta.name,
          icon: meta.icon || meta.iconRaw || '',
          price: this.normalizeSellPrice(meta?.price ?? entry?.price),
        };
      }
    }

    return {
      name: meta?.name || entry.name || entry.itemId || entry.scrollId || entry.cubeId || '消耗品',
      icon: meta?.icon || entry.icon || '',
      price: this.normalizeSellPrice(meta?.price ?? entry?.price),
    };
  },

  resolveEtcEntryDisplay(entry) {
    if (!entry) return { name: '', icon: '', price: 1 };
    const catalog = typeof IdleEtcStore !== 'undefined' ? IdleEtcStore.get(entry.itemId) : null;
    return {
      name: catalog?.name || entry.name || entry.itemId || '其他',
      icon: catalog?.icon || entry.icon || '',
      price: this.normalizeSellPrice(entry?.price ?? catalog?.price),
    };
  },

  resolveBuyRowDisplay(row) {
    if (!row) return { name: '', icon: '', price: 0 };
    const price = Math.max(0, Math.floor(Number(row.buyPrice) || 0));
    if (isShopHyperPointRow(row)) {
      const base = typeof IDLE_SHOP_HYPER_POINT !== 'undefined' ? IDLE_SHOP_HYPER_POINT : null;
      return {
        name: row.name || base?.name || '極限屬性點',
        icon: row.icon || base?.icon || '',
        price,
        desc: row.desc || base?.desc || '',
      };
    }
    if (row.kind === 'equip') {
      const item = typeof ITEM_DATABASE !== 'undefined' ? ITEM_DATABASE[row.itemId] : null;
      return {
        name: item?.name || row.itemId,
        icon: item?.icon || `images/equip/${row.itemId}.png`,
        price,
      };
    }
    if (row.kind === 'scroll') {
      const scroll = resolveShopScrollMeta(row.itemId || row.scrollId);
      return {
        name: scroll?.name || row.itemId || row.scrollId || '卷軸',
        icon: scroll?.icon || '',
        price,
      };
    }
    if (row.kind === 'consume' || row.consumeType) {
      if (row.itemId === 'recovery_card' || row.consumeType === 'recovery_card') {
        const card = typeof RECOVERY_CARD !== 'undefined' ? RECOVERY_CARD : null;
        return { name: card?.name || '恢復卡', icon: card?.icon || '', price };
      }
      if (row.consumeType === 'potion'
        || (typeof IdlePotionStore !== 'undefined' && IdlePotionStore.isPotionId?.(row.itemId))) {
        const potion = typeof IdlePotionStore !== 'undefined' ? IdlePotionStore.get(row.itemId) : null;
        return {
          name: potion?.name || row.name || row.itemId || '藥水',
          icon: potion ? IdlePotionStore.resolveIcon(potion.icon) : (row.icon || ''),
          price,
        };
      }
      if (row.consumeType === 'throwing_star'
        || (typeof ThrowingStarStore !== 'undefined' && ThrowingStarStore.isThrowingStarId?.(row.itemId))) {
        const star = typeof ThrowingStarStore !== 'undefined' ? ThrowingStarStore.get(row.itemId) : null;
        return {
          name: star?.name || row.name || row.itemId || '飛鏢',
          icon: star?.icon || star?.iconRaw || row.icon || '',
          price,
        };
      }
      if (row.consumeType === 'bonus_stat'
        || (typeof getBonusStatItemById === 'function' && getBonusStatItemById(row.itemId))) {
        const flame = typeof getBonusStatItemById === 'function' ? getBonusStatItemById(row.itemId) : null;
        return {
          name: flame?.name || row.name || row.itemId || '星火',
          icon: flame?.icon || row.icon || '',
          price,
        };
      }
      if (row.consumeType === 'potential_scroll'
        || row.consumeType === 'starforce_scroll'
        || row.consumeType === 'glory_scroll') {
        const scroll = resolveShopScrollMeta(row.scrollId || row.itemId);
        if (scroll) {
          return { name: scroll.name, icon: scroll.icon, price };
        }
      }
      return { name: row.name || row.itemId, icon: row.icon || '', price };
    }
    return { name: row.name || row.itemId || '', icon: row.icon || '', price };
  },
};

if (typeof window !== 'undefined') {
  window.IDLE_NPC_SHOP = IDLE_NPC_SHOP;
  window.IDLE_NPC_SHOPS = IDLE_NPC_SHOPS;
  window.IDLE_SHOP_HYPER_POINT = IDLE_SHOP_HYPER_POINT;
  window.IDLE_SHOP_HYPER_POINT_100 = IDLE_SHOP_HYPER_POINT_100;
  window.IDLE_SHOP_HYPER_POINT_PACKS = IDLE_SHOP_HYPER_POINT_PACKS;
  window.IdleNpcShopCatalog = IdleNpcShopCatalog;
  window.resolveShopScrollMeta = resolveShopScrollMeta;
  window.isShopHyperPointRow = isShopHyperPointRow;
}
