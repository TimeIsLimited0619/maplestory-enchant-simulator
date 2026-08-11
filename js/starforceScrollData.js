/**
 * 星力強化卷軸道具（素材目錄：images/scrolldata/）
 */
const STARFORCE_SCROLL_IMAGE_BASE = 'images/scrolldata';

const STARFORCE_SCROLLS = [
  {
    id: 'scroll_set20',
    method: 'scroll_set20_100',
    name: '星力20星強化卷',
    icon: `${STARFORCE_SCROLL_IMAGE_BASE}/scroll_set20.png`,
    rate: 100,
    previewTargetStar: 20,
    maxCurrentStar: 19,
  },
  {
    id: 'scroll_under23_30',
    method: 'scroll_under23_30',
    name: '追加一星強化卷30% (23星)',
    icon: `${STARFORCE_SCROLL_IMAGE_BASE}/scroll_under23_30.png`,
    rate: 30,
    maxCurrentStar: 22,
  },
  {
    id: 'scroll_under23_100',
    method: 'scroll_under23_100',
    name: '追加一星強化卷100% (23星)',
    icon: `${STARFORCE_SCROLL_IMAGE_BASE}/scroll_under23_100.png`,
    rate: 100,
    maxCurrentStar: 22,
  },
  {
    id: 'scroll_24_100',
    method: 'scroll_24_100',
    name: '追加一星強化卷100% (24星)',
    icon: `${STARFORCE_SCROLL_IMAGE_BASE}/scroll_24_100.png`,
    rate: 100,
    requiredCurrentStar: 23,
  },
  {
    id: 'scroll_25_30',
    method: 'scroll_25_30',
    name: '追加一星強化卷30% (25星)',
    icon: `${STARFORCE_SCROLL_IMAGE_BASE}/scroll_25_30.png`,
    rate: 30,
    requiredCurrentStar: 24,
  },
];

/** 模擬持有數量（之後改由背包消耗欄同步） */
const playerStarForceScrollInventory = {
  scroll_set20: 99,
  scroll_under23_30: 99,
  scroll_under23_100: 99,
  scroll_24_100: 99,
  scroll_25_30: 99,
};

const CONSUME_ITEM_TYPE = {
  STARFORCE_SCROLL: 'starforce_scroll',
};

function isStarForceScrollConsumeEntry(entry) {
  return Boolean(
    entry
    && entry.type === CONSUME_ITEM_TYPE.STARFORCE_SCROLL
    && entry.scrollId
  );
}

/** 初始化消耗欄前幾格為星力卷（測試用） */
function seedStarForceScrollConsumeInventory() {
  if (typeof playerInventoryConsume === 'undefined' || typeof INVENTORY_SLOT_COUNT === 'undefined') {
    return;
  }

  STARFORCE_SCROLLS.forEach((scroll, index) => {
    if (index >= INVENTORY_SLOT_COUNT) return;
    playerInventoryConsume[index] = {
      type: CONSUME_ITEM_TYPE.STARFORCE_SCROLL,
      scrollId: scroll.id,
    };
  });
}

function getStarForceScrollById(id) {
  if (!id) return null;
  return STARFORCE_SCROLLS.find((s) => s.id === id) || null;
}

function getStarForceScrollByMethod(method) {
  if (!method || method === 'normal') return null;
  return STARFORCE_SCROLLS.find((s) => s.method === method) || null;
}

function getPlayerStarForceScrollCount(scrollId) {
  return playerStarForceScrollInventory[scrollId] || 0;
}

function consumeStarForceScroll(scrollId, amount = 1) {
  if (!scrollId || amount <= 0) return false;
  const current = getPlayerStarForceScrollCount(scrollId);
  if (current < amount) return false;
  playerStarForceScrollInventory[scrollId] = current - amount;

  if (typeof InventoryModule !== 'undefined') {
    InventoryModule.render();
    InventoryModule.updateSlotCount();
  }

  if (
    getPlayerStarForceScrollCount(scrollId) === 0
    && typeof StarForceModule !== 'undefined'
    && StarForceModule.selectedScrollId === scrollId
  ) {
    StarForceModule.clearSelectedScroll();
  }

  return true;
}
