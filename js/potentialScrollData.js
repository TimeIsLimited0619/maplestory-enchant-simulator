/**
 * 消耗欄：傳說／附加傳說潛在能力卷軸（100%）
 */
const POTENTIAL_SCROLL_IMAGE_BASE = 'images/scrolldata';
const POTENTIAL_SCROLL_USE_CURSOR = 'images/iventory/Basic.img.Cursor.32.0.png';

const POTENTIAL_SCROLLS = [
  {
    id: 'scroll_legendary_potential_100',
    name: '傳說潛在能力卷軸100%',
    target: 'main',
    icon: `${POTENTIAL_SCROLL_IMAGE_BASE}/02049787.info.iconRaw.png`,
    hover: `${POTENTIAL_SCROLL_IMAGE_BASE}/2049787.png`,
  },
  {
    id: 'scroll_legendary_add_potential_100',
    name: '附加傳說潛在能力卷軸100%',
    target: 'additional',
    icon: `${POTENTIAL_SCROLL_IMAGE_BASE}/02049770.info.iconRaw.png`,
    hover: `${POTENTIAL_SCROLL_IMAGE_BASE}/2049770.png`,
  },
];

/** 模擬持有數量 */
const playerPotentialScrollInventory = {
  scroll_legendary_potential_100: 99,
  scroll_legendary_add_potential_100: 99,
};

function isPotentialScrollConsumeEntry(entry) {
  const type = typeof CONSUME_ITEM_TYPE !== 'undefined'
    ? CONSUME_ITEM_TYPE.POTENTIAL_SCROLL
    : 'potential_scroll';
  return Boolean(entry && entry.type === type && entry.scrollId);
}

function getPotentialScrollById(id) {
  if (!id) return null;
  return POTENTIAL_SCROLLS.find((scroll) => scroll.id === id) || null;
}

function getPlayerPotentialScrollCount(scrollId) {
  return playerPotentialScrollInventory[scrollId] || 0;
}

function ensurePotentialScrollCounts() {
  POTENTIAL_SCROLLS.forEach((scroll) => {
    if (playerPotentialScrollInventory[scroll.id] == null) {
      playerPotentialScrollInventory[scroll.id] = 99;
    }
  });
}

/** 將潛能卷補進消耗欄空格（舊存檔相容） */
function ensurePotentialScrollConsumeInventory() {
  if (typeof playerInventoryConsume === 'undefined' || typeof INVENTORY_SLOT_COUNT === 'undefined') {
    return;
  }

  ensurePotentialScrollCounts();

  const type = typeof CONSUME_ITEM_TYPE !== 'undefined'
    ? CONSUME_ITEM_TYPE.POTENTIAL_SCROLL
    : 'potential_scroll';

  POTENTIAL_SCROLLS.forEach((scroll) => {
    const exists = playerInventoryConsume.some(
      (entry) => entry && entry.type === type && entry.scrollId === scroll.id
    );
    if (exists) return;

    const emptyIndex = playerInventoryConsume.findIndex((entry) => !entry);
    if (emptyIndex < 0 || emptyIndex >= INVENTORY_SLOT_COUNT) return;

    playerInventoryConsume[emptyIndex] = {
      type,
      scrollId: scroll.id,
    };
  });
}

function consumePotentialScroll(scrollId, amount = 1) {
  if (!scrollId || amount <= 0) return false;
  const current = getPlayerPotentialScrollCount(scrollId);
  if (current < amount) return false;
  playerPotentialScrollInventory[scrollId] = current - amount;

  if (typeof InventoryModule !== 'undefined') {
    InventoryModule.render();
    InventoryModule.updateSlotCount();
  }

  if (
    getPlayerPotentialScrollCount(scrollId) === 0
    && typeof InventoryModule !== 'undefined'
    && InventoryModule.pendingPotentialScrollId === scrollId
  ) {
    InventoryModule.cancelPotentialScrollUse();
  }

  return true;
}

/**
 * 提升至傳說後，以恢復方塊規則重骰一次詞條（非三排必傳說）。
 */
function getLegendaryPotentialScrollBlockReason(item, target) {
  if (!item) return '無法套用至該裝備';
  if (typeof isMedalItem === 'function' && isMedalItem(item)) {
    return target === 'additional'
      ? '勳章無法使用附加傳說潛在能力卷軸'
      : '勳章無法使用傳說潛在能力卷軸';
  }
  return null;
}

function canApplyLegendaryPotentialScroll(item, target) {
  return !getLegendaryPotentialScrollBlockReason(item, target);
}

function applyLegendaryPotentialGrade(item, target) {
  if (!item) return { ok: false, reason: 'no_item' };

  const blockReason = getLegendaryPotentialScrollBlockReason(item, target);
  if (blockReason) {
    return { ok: false, reason: 'blocked', message: blockReason };
  }

  const isAdd = target === 'additional';
  const field = isAdd ? 'additionalPotential' : 'potential';
  const previous = item[field] && typeof item[field] === 'object'
    ? item[field]
    : null;

  const rolled = rollLegendaryPotentialState(item, previous, isAdd);
  if (!rolled?.lines?.length) {
    return { ok: false, reason: 'roll_failed' };
  }

  item[field] = {
    rank: 'legendary',
    lines: rolled.lines,
    atkPow: rolled.atkPow,
  };

  return { ok: true, field, potential: item[field] };
}

function rollLegendaryPotentialState(item, currentPotential, isAdd) {
  const seedPotential = {
    rank: 'legendary',
    lines: Array.isArray(currentPotential?.lines) ? currentPotential.lines : [],
    atkPow: currentPotential?.atkPow || 0,
  };

  // 主潛能：恢復方塊；附加：恢復附加方塊
  if (isAdd) {
    const cube = { rateKey: 'restoreAdd' };
    if (typeof rerollAddPotWithCube === 'function') {
      const rolled = rerollAddPotWithCube(cube, item, seedPotential);
      if (rolled?.lines?.length) {
        return {
          rank: 'legendary',
          lines: rolled.lines,
          atkPow: rolled.atkPow,
        };
      }
    }
  } else if (typeof rerollPotentialWithCube === 'function') {
    const cube = { rateKey: 'restore' };
    const eventId = typeof POTENTIAL_CUBE_EVENT_ID !== 'undefined'
      ? POTENTIAL_CUBE_EVENT_ID
      : undefined;
    const rolled = rerollPotentialWithCube(cube, item, seedPotential, eventId);
    if (rolled?.lines?.length) {
      return {
        rank: 'legendary',
        lines: rolled.lines,
        atkPow: rolled.atkPow,
      };
    }
  }

  // 後備：同恢復方塊 rateKey + 傳說表頭直接骰詞條
  const eventId = isAdd && typeof ADDPOT_CUBE_EVENT_ID !== 'undefined'
    ? ADDPOT_CUBE_EVENT_ID
    : (typeof POTENTIAL_CUBE_EVENT_ID !== 'undefined' ? POTENTIAL_CUBE_EVENT_ID : undefined);
  const cube = isAdd
    ? { rateKey: 'restoreAdd' }
    : { rateKey: 'restore' };

  if (typeof rollPotentialLines === 'function') {
    const lines = rollPotentialLines(
      item,
      'legendary',
      cube,
      seedPotential,
      'legendary',
      eventId
    );
    if (Array.isArray(lines) && lines.length) {
      delete lines._mirrorCopied;
      const atkPow = typeof rollNextPotentialAtkPow === 'function'
        ? rollNextPotentialAtkPow(currentPotential)
        : Math.max(0, currentPotential?.atkPow || 0);
      return { rank: 'legendary', lines, atkPow };
    }
  }

  return null;
}
