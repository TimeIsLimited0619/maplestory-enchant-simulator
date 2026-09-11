/**
 * 飛鏢消耗欄（Consume 0207）：數量、掉落入包、最前格 PAD／外觀。
 * 戰鬥不消耗飛鏢。
 */
const ThrowingStarStore = (() => {
  function consumeType() {
    return typeof CONSUME_ITEM_TYPE !== 'undefined'
      ? CONSUME_ITEM_TYPE.THROWING_STAR
      : 'throwing_star';
  }

  function padId(itemId) {
    if (typeof ThrowingStarBullet !== 'undefined' && typeof ThrowingStarBullet.padId === 'function') {
      return ThrowingStarBullet.padId(itemId) || '';
    }
    const s = String(itemId == null ? '' : itemId).replace(/\D/g, '');
    return s ? s.padStart(8, '0') : '';
  }

  function get(itemId) {
    if (typeof ThrowingStarBullet === 'undefined') return null;
    if (typeof ThrowingStarBullet.get === 'function') return ThrowingStarBullet.get(itemId);
    const id = padId(itemId);
    return (ThrowingStarBullet.ITEMS && ThrowingStarBullet.ITEMS[id]) || null;
  }

  function list() {
    if (typeof ThrowingStarBullet === 'undefined') return [];
    if (typeof ThrowingStarBullet.list === 'function') return ThrowingStarBullet.list();
    return Object.values(ThrowingStarBullet.ITEMS || {});
  }

  function isThrowingStarId(itemId) {
    return !!get(itemId);
  }

  function resolveIcon(item) {
    if (!item) return '';
    return item.iconRaw || item.icon || '';
  }

  function formatBoost(item) {
    const pad = Math.max(0, Math.floor(Number(item?.incPAD) || 0));
    return pad > 0 ? `攻擊力 +${pad}` : '飛鏢';
  }

  function consumeCatalogRows() {
    return list().map((item) => ({
      id: `consume-star-${item.id}`,
      consumeType: 'throwing_star',
      itemId: item.id,
      name: item.name,
      icon: item.icon || item.iconRaw || '',
      rate: 100,
      boost: formatBoost(item),
    }));
  }

  function isEntry(entry) {
    if (!entry) return false;
    const t = consumeType();
    return entry.type === t || entry.type === 'throwing_star';
  }

  function notifyCombatPad() {
    if (typeof CharacterCombatPanel !== 'undefined') {
      CharacterCombatPanel.syncToCombatPower?.();
    }
  }

  function frontEntry() {
    if (typeof playerInventoryConsume === 'undefined' || !Array.isArray(playerInventoryConsume)) {
      return null;
    }
    for (let i = 0; i < playerInventoryConsume.length; i += 1) {
      const entry = playerInventoryConsume[i];
      if (!isEntry(entry)) continue;
      const id = String(entry.itemId || '').trim();
      if (!id) continue;
      if (getPlayerThrowingStarCount(id) > 0) return entry;
    }
    return null;
  }

  function frontItemId() {
    const id = String(frontEntry()?.itemId || '').trim();
    return id ? padId(id) : '';
  }

  function frontIncPad() {
    const item = get(frontItemId());
    return Math.max(0, Math.floor(Number(item?.incPAD) || 0));
  }

  return {
    get,
    list,
    isThrowingStarId,
    isEntry,
    resolveIcon,
    formatBoost,
    consumeCatalogRows,
    notifyCombatPad,
    frontEntry,
    frontItemId,
    frontIncPad,
    padId,
  };
})();

let playerThrowingStarCounts = Object.create(null);

function getPlayerThrowingStarCount(itemId) {
  const id = typeof ThrowingStarStore !== 'undefined'
    ? ThrowingStarStore.padId(itemId)
    : String(itemId || '').trim();
  if (!id) return 0;
  return Math.max(0, Math.floor(Number(playerThrowingStarCounts[id]) || 0));
}

function cleanupThrowingStarConsumeSlots(itemId) {
  const id = ThrowingStarStore.padId(itemId);
  if (!id || typeof playerInventoryConsume === 'undefined') return;
  for (let i = 0; i < playerInventoryConsume.length; i += 1) {
    const entry = playerInventoryConsume[i];
    if (ThrowingStarStore.isEntry(entry) && ThrowingStarStore.padId(entry.itemId) === id) {
      playerInventoryConsume[i] = null;
    }
  }
}

function ensureThrowingStarConsumeInventory(itemId) {
  const id = ThrowingStarStore.padId(itemId);
  if (!id || typeof InventoryModule === 'undefined' || typeof CONSUME_ITEM_TYPE === 'undefined') return;
  if (getPlayerThrowingStarCount(id) <= 0) {
    cleanupThrowingStarConsumeSlots(id);
    return;
  }
  InventoryModule.ensureConsumeSlot(
    (entry) => ThrowingStarStore.isEntry(entry) && ThrowingStarStore.padId(entry.itemId) === id,
    () => ({ type: CONSUME_ITEM_TYPE.THROWING_STAR, itemId: id }),
  );
}

function grantThrowingStar(itemId, amount = 1) {
  const item = ThrowingStarStore.get(itemId);
  if (!item) return 0;
  const add = Math.max(0, Math.floor(Number(amount) || 0));
  if (!add) return 0;
  const id = item.id;
  playerThrowingStarCounts[id] = getPlayerThrowingStarCount(id) + add;
  ensureThrowingStarConsumeInventory(id);
  if (typeof SessionPersistenceModule !== 'undefined') SessionPersistenceModule.scheduleSave?.();
  if (typeof InventoryModule !== 'undefined' && InventoryModule.tab === 'consume') {
    InventoryModule.render?.();
  }
  ThrowingStarStore.notifyCombatPad();
  return add;
}

function takeThrowingStar(itemId, amount = 1) {
  const id = ThrowingStarStore.padId(itemId);
  const need = Math.max(1, Math.floor(Number(amount) || 1));
  if (getPlayerThrowingStarCount(id) < need) return false;
  playerThrowingStarCounts[id] = getPlayerThrowingStarCount(id) - need;
  if (playerThrowingStarCounts[id] <= 0) delete playerThrowingStarCounts[id];
  cleanupThrowingStarConsumeSlots(id);
  if (getPlayerThrowingStarCount(id) > 0) ensureThrowingStarConsumeInventory(id);
  if (typeof SessionPersistenceModule !== 'undefined') SessionPersistenceModule.scheduleSave?.();
  if (typeof InventoryModule !== 'undefined' && InventoryModule.tab === 'consume') {
    InventoryModule.render?.();
  }
  ThrowingStarStore.notifyCombatPad();
  return true;
}

if (typeof window !== 'undefined') {
  window.ThrowingStarStore = ThrowingStarStore;
  window.playerThrowingStarCounts = playerThrowingStarCounts;
  window.getPlayerThrowingStarCount = getPlayerThrowingStarCount;
  window.grantThrowingStar = grantThrowingStar;
  window.takeThrowingStar = takeThrowingStar;
  window.ensureThrowingStarConsumeInventory = ensureThrowingStarConsumeInventory;
}
