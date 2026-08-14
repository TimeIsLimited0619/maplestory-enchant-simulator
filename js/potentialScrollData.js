/**
 * 消耗欄：潛在能力／附加潛在能力賦予卷軸
 */
const POTENTIAL_SCROLL_IMAGE_BASE = 'images/scrolldata';
const POTENTIAL_SCROLL_USE_CURSOR = 'images/iventory/Basic.img.Cursor.32.0.png';

const POTENTIAL_SCROLLS = [
  {
    id: 'scroll_rare_add_potential',
    name: '特別附加潛在能力賦予卷軸',
    target: 'additional',
    grade: 'rare',
    preferredSlot: 5, // 第 6 格
    icon: `${POTENTIAL_SCROLL_IMAGE_BASE}/02048339.info.iconRaw.png`,
    hover: `${POTENTIAL_SCROLL_IMAGE_BASE}/2048339.png`,
  },
  {
    id: 'scroll_epic_potential',
    name: '稀有潛在能力賦予卷軸',
    target: 'main',
    grade: 'epic',
    preferredSlot: 6, // 第 7 格
    icon: `${POTENTIAL_SCROLL_IMAGE_BASE}/02049700.info.iconRaw.png`,
    hover: `${POTENTIAL_SCROLL_IMAGE_BASE}/2049700.png`,
  },
  {
    id: 'scroll_legendary_potential_100',
    name: '傳說潛在能力卷軸100%',
    target: 'main',
    grade: 'legendary',
    preferredSlot: 126, // 第 127 格
    icon: `${POTENTIAL_SCROLL_IMAGE_BASE}/02049787.info.iconRaw.png`,
    hover: `${POTENTIAL_SCROLL_IMAGE_BASE}/2049787.png`,
  },
  {
    id: 'scroll_legendary_add_potential_100',
    name: '附加傳說潛在能力卷軸100%',
    target: 'additional',
    grade: 'legendary',
    preferredSlot: 127, // 第 128 格
    icon: `${POTENTIAL_SCROLL_IMAGE_BASE}/02049770.info.iconRaw.png`,
    hover: `${POTENTIAL_SCROLL_IMAGE_BASE}/2049770.png`,
  },
];

/** 模擬持有數量 */
const playerPotentialScrollInventory = {
  scroll_rare_add_potential: 99,
  scroll_epic_potential: 99,
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

function getPotentialScrollRankLabel(grade) {
  if (typeof POTENTIAL_RANKS !== 'undefined' && POTENTIAL_RANKS[grade]?.label) {
    return POTENTIAL_RANKS[grade].label;
  }
  if (grade === 'epic') return '稀有';
  if (grade === 'rare') return '特殊';
  if (grade === 'unique') return '罕見';
  return '傳說';
}

/**
 * 將潛能卷放到 preferredSlot（並清掉舊位置）。
 * 舊存檔相容：強制對齊預設格，避免傳說卷佔用前排。
 */
function ensurePotentialScrollConsumeInventory() {
  if (typeof playerInventoryConsume === 'undefined' || typeof INVENTORY_SLOT_COUNT === 'undefined') {
    return;
  }

  ensurePotentialScrollCounts();

  const type = typeof CONSUME_ITEM_TYPE !== 'undefined'
    ? CONSUME_ITEM_TYPE.POTENTIAL_SCROLL
    : 'potential_scroll';

  // 先移除所有潛能卷佔位，再依 preferredSlot 重放
  for (let i = 0; i < playerInventoryConsume.length; i++) {
    const entry = playerInventoryConsume[i];
    if (entry && entry.type === type) {
      playerInventoryConsume[i] = null;
    }
  }

  POTENTIAL_SCROLLS.forEach((scroll) => {
    let slot = Number.isInteger(scroll.preferredSlot) ? scroll.preferredSlot : -1;
    if (slot < 0 || slot >= INVENTORY_SLOT_COUNT) {
      slot = playerInventoryConsume.findIndex((entry) => !entry);
    }
    if (slot < 0 || slot >= INVENTORY_SLOT_COUNT) return;

    // 若目標格被非潛能卷占用，改找空格（不覆蓋星力卷等）
    if (playerInventoryConsume[slot] && playerInventoryConsume[slot].type !== type) {
      const emptyIndex = playerInventoryConsume.findIndex((entry) => !entry);
      if (emptyIndex < 0) return;
      slot = emptyIndex;
    }

    playerInventoryConsume[slot] = {
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
 * 潛能賦予卷使用限制：
 * - 勳章／圖騰／口袋／機器人不可用
 * - 胸章不可用附加潛能卷
 * - 主潛卷：不可用於已有主要潛能的裝備
 * - 附潛卷：需先有主要潛能；不可用於已有附加潛能的裝備
 */
function getPotentialScrollBlockReason(item, scroll) {
  if (!item || !scroll) return '無法套用至該裝備';

  const target = scroll.target === 'additional' ? 'additional' : 'main';
  const scrollName = scroll.name || (target === 'additional' ? '附加潛能賦予卷軸' : '潛能賦予卷軸');

  if (typeof isEnhancementLockedItem === 'function' && isEnhancementLockedItem(item)) {
    return `此裝備無法使用${scrollName}`;
  }
  if (typeof isMedalItem === 'function' && isMedalItem(item)) {
    return `勳章無法使用${scrollName}`;
  }
  if (typeof isTotemItem === 'function' && isTotemItem(item)) {
    return `圖騰無法使用${scrollName}`;
  }
  if (typeof isPocketItem === 'function' && isPocketItem(item)) {
    return `口袋道具無法使用${scrollName}`;
  }
  if (typeof isPinItem === 'function' && isPinItem(item) && target === 'additional') {
    return '胸章無法使用附加潛能賦予卷軸';
  }

  const hasMain = typeof hasEquipPotentialLines === 'function'
    ? hasEquipPotentialLines(item, 'main')
    : (Array.isArray(item.potential?.lines) && item.potential.lines.length > 0);
  const hasAdd = typeof hasEquipPotentialLines === 'function'
    ? hasEquipPotentialLines(item, 'additional')
    : (Array.isArray(item.additionalPotential?.lines) && item.additionalPotential.lines.length > 0);

  if (target === 'main') {
    if (hasMain) return '此裝備已有主要潛能，無法再使用潛能賦予卷軸';
    return null;
  }

  if (!hasMain) return '需先擁有主要潛能才能使用附加潛能賦予卷軸';
  if (hasAdd) return '此裝備已有附加潛能，無法再使用附加潛能賦予卷軸';
  return null;
}

function getLegendaryPotentialScrollBlockReason(item, target) {
  const scroll = {
    name: target === 'additional' ? '附加潛在能力卷軸' : '潛在能力卷軸',
    target: target === 'additional' ? 'additional' : 'main',
  };
  return getPotentialScrollBlockReason(item, scroll);
}

function canApplyLegendaryPotentialScroll(item, target) {
  return !getLegendaryPotentialScrollBlockReason(item, target);
}

function canApplyPotentialScroll(item, scroll) {
  return !getPotentialScrollBlockReason(item, scroll);
}

/**
 * 依卷軸設定賦予指定等級潛能（特殊／稀有／傳說…）
 */
function applyPotentialScrollGrade(item, scroll) {
  if (!item || !scroll) return { ok: false, reason: 'no_item' };

  const blockReason = getPotentialScrollBlockReason(item, scroll);
  if (blockReason) {
    return { ok: false, reason: 'blocked', message: blockReason };
  }

  const isAdd = scroll.target === 'additional';
  const field = isAdd ? 'additionalPotential' : 'potential';
  const grade = scroll.grade || 'legendary';
  const previous = item[field] && typeof item[field] === 'object'
    ? item[field]
    : null;

  const rolled = rollPotentialScrollState(item, previous, isAdd, grade);
  if (!rolled?.lines?.length) {
    return { ok: false, reason: 'roll_failed' };
  }

  item[field] = {
    rank: grade,
    lines: rolled.lines,
    atkPow: rolled.atkPow,
  };

  return { ok: true, field, potential: item[field], grade };
}

/** @deprecated 改用 applyPotentialScrollGrade(item, scroll) */
function applyLegendaryPotentialGrade(item, target) {
  const scroll = {
    target: target === 'additional' ? 'additional' : 'main',
    grade: 'legendary',
    name: target === 'additional' ? '附加傳說潛在能力卷軸' : '傳說潛在能力卷軸',
  };
  return applyPotentialScrollGrade(item, scroll);
}

function rollPotentialScrollState(item, currentPotential, isAdd, grade) {
  const rank = grade || 'legendary';
  const seedPotential = {
    rank,
    lines: Array.isArray(currentPotential?.lines) ? currentPotential.lines : [],
    atkPow: currentPotential?.atkPow || 0,
  };

  if (isAdd) {
    const cube = { rateKey: 'restoreAdd' };
    if (typeof rerollAddPotWithCube === 'function') {
      // 附加恢復方塊會依 seed.rank 走；先塞目標等級
      const rolled = rerollAddPotWithCube(cube, item, seedPotential);
      if (rolled?.lines?.length) {
        return {
          rank,
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
        rank,
        lines: rolled.lines,
        atkPow: rolled.atkPow,
      };
    }
  }

  const eventId = isAdd && typeof ADDPOT_CUBE_EVENT_ID !== 'undefined'
    ? ADDPOT_CUBE_EVENT_ID
    : (typeof POTENTIAL_CUBE_EVENT_ID !== 'undefined' ? POTENTIAL_CUBE_EVENT_ID : undefined);
  const cube = isAdd
    ? { rateKey: 'restoreAdd' }
    : { rateKey: 'restore' };

  if (typeof rollPotentialLines === 'function') {
    const lines = rollPotentialLines(
      item,
      rank,
      cube,
      seedPotential,
      rank,
      eventId
    );
    if (Array.isArray(lines) && lines.length) {
      delete lines._mirrorCopied;
      const atkPow = typeof rollNextPotentialAtkPow === 'function'
        ? rollNextPotentialAtkPow(currentPotential)
        : Math.max(0, currentPotential?.atkPow || 0);
      return { rank, lines, atkPow };
    }
  }

  return null;
}

/** @deprecated */
function rollLegendaryPotentialState(item, currentPotential, isAdd) {
  return rollPotentialScrollState(item, currentPotential, isAdd, 'legendary');
}
