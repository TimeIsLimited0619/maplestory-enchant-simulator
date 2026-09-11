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

  /** tooltip 內文：優先官方 String.Consume desc */
  function formatTooltipDesc(item) {
    if (!item) return '飛鏢';
    const rawDesc = String(item.desc || '')
      .replace(/#c/gi, '')
      .replace(/#/g, '')
      .trim();
    if (rawDesc) return rawDesc;
    const lines = [];
    const pad = Math.max(0, Math.floor(Number(item.incPAD) || 0));
    if (pad > 0) lines.push(`攻擊力 +${pad}`);
    const req = Math.max(0, Math.floor(Number(item.reqLevel) || 0));
    if (req > 0) lines.push(`需求等級：${req}`);
    if (!lines.length) lines.push('飛鏢');
    return lines.join('\n');
  }

  function buildTooltipHtml(item) {
    if (!item) return '';
    const assets = (typeof EQUIP_TOOLTIP_ASSETS !== 'undefined' && EQUIP_TOOLTIP_ASSETS) || {};
    const frame = assets.equipFrame || {};
    const itemIcon = assets.itemIcon || {};
    const line = frame.line || (assets.frame && assets.frame.dotline) || '';
    const topBg = frame.top ? ` style="background-image:url('${frame.top}')"` : '';
    const midBg = frame.mid ? ` style="background-image:url('${frame.mid}')"` : '';
    const btmBg = frame.btm ? ` style="background-image:url('${frame.btm}')"` : '';
    const lineStyle = line ? ` style="background-image:url('${line}')"` : '';
    const baseSrc = itemIcon.base || '';
    const shadeSrc = itemIcon.shade || '';
    const esc = (s) => String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    const iconSrc = esc(item.icon || item.iconRaw || '');
    const descHtml = esc(formatTooltipDesc(item)).replace(/\n/g, '<br>');
    const pad = Math.max(0, Math.floor(Number(item.incPAD) || 0));
    const req = Math.max(0, Math.floor(Number(item.reqLevel) || 0));
    const hasPadInDesc = /攻擊力/.test(String(item.desc || ''));
    const hasReqInDesc = /等級/.test(String(item.desc || ''));
    const stats = [];
    if (pad > 0 && !hasPadInDesc) stats.push(`攻擊力 +${pad}`);
    if (req > 0 && !hasReqInDesc) stats.push(`需求等級：${req}`);
    const statsHtml = stats.length
      ? `<div class="sc-scroll-tip-stats idle-potion-tip-stats">${
        stats.map((s) => `<div class="sc-scroll-tip-stat">${esc(s)}</div>`).join('')
      }</div>`
      : '';
    return `
      <div class="eq-tooltip-frame inv-etc-frame idle-potion-tip-frame">
        <div class="eq-tooltip-frame-top"${topBg}></div>
        <div class="eq-tooltip-mid-wrap">
          <div class="eq-tooltip-frame-mid"${midBg}></div>
          <div class="eq-tooltip-body">
            <div class="eq-tooltip-content">
              <div class="eq-tip-name-row">
                <div class="eq-tip-name">${esc(item.name || '飛鏢')}</div>
              </div>
              <div class="eq-tip-dotline"${lineStyle}></div>
              <div class="inv-etc-main">
                <div class="eq-tip-icon-wrap">
                  ${baseSrc ? `<img class="eq-tip-icon-base" src="${baseSrc}" alt="">` : ''}
                  ${shadeSrc ? `<img class="eq-tip-icon-shade" src="${shadeSrc}" alt="">` : ''}
                  ${iconSrc ? `<img class="eq-tip-icon" src="${iconSrc}" alt="">` : ''}
                </div>
                <div class="sc-scroll-tip-copy idle-potion-tip-copy">
                  <div class="inv-etc-desc">${descHtml}</div>
                  ${statsHtml}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="eq-tooltip-frame-btm"${btmBg}></div>
      </div>
    `;
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
    formatTooltipDesc,
    buildTooltipHtml,
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
