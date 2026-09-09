/**
 * 放置模式：藥水資料（請手動增刪）
 *
 * 欄位：
 *   id         唯一 id（消耗欄堆疊用）
 *   name       顯示名稱
 *   icon       ICON 編號或檔名 → images/potion/{icon}.png（可寫 1 或 images/potion/1）
 *   desc       說明
 *   recover    固定回復 HP（與 recoverPct 二擇一）
 *   recoverPct 依最大 HP 百分比回復（例：50 = 50%）
 *   price      商店賣價（楓幣）；缺省或 ≤0 → 賣 1
 */
const IDLE_POTION_DATABASE = [
  {
    id: 'potion-red',
    name: '紅色藥水',
    icon: 'images/potion/1.png',
    desc: '回復一定量 HP。',
    recover: 50,
    price: 5,
  },
  {
    id: 'potion-orange',
    name: '橘色藥水',
    icon: 'images/potion/2.png',
    desc: '回復較多 HP。',
    recover: 150,
    price: 15,
  },
  {
    id: 'potion-white',
    name: '白色藥水',
    icon: 'images/potion/3.png',
    desc: '回復更多 HP。',
    recover: 300,
    price: 30,
  },
  {
    id: 'grilled-eel',
    name: '烤鰻魚',
    icon: 'images/potion/4.png',
    desc: '好吃的烤鰻魚。',
    recover: 1000,
    price: 100,
  },
  {
    id: 'Reindeer-milk',
    name: '馴鹿奶',
    icon: 'images/potion/5.png',
    desc: '將馴鹿的新鮮奶水收集起來裝在瓶子裡。',
    recover: 5000,
    price: 500,
  },
  {
    id: 'Reindeer-milk',
    name: '馴鹿奶',
    icon: 'images/potion/5.png',
    desc: '將馴鹿的新鮮奶水收集起來裝在瓶子裡。',
    recover: 5000,
    price: 500,
  },
  {
    id: '02022089',
    name: '幼年龍的離乳食',
    icon: 'images/potion/8.png',
    desc: '幼年龍的離乳食。',
    recover: 10000,
    price: 1000,
  },
  {
    id: '02020031',
    name: '可口可樂',
    icon: 'images/potion/9.png',
    desc: '幼年龍的離乳食。',
    recoverPct: 30,
    price: 3000,
  },
  {
    id: 'special-potion',
    name: '特殊藥水',
    icon: 'images/potion/6.png',
    desc: '傳說中的祕藥。',
    recoverPct: 50,
    price: 5000,
  },  
  {
    id: 'super-potion',
    name: '超級藥水',
    icon: 'images/potion/7.png',
    desc: '傳說中的祕藥。',
    recoverPct: 100,
    price: 10000,
  },  
];

const IdlePotionStore = (() => {
  function resolveIcon(icon) {
    const raw = String(icon || '').trim();
    if (!raw) return '';
    if (/\.(png|gif|webp|jpe?g)$/i.test(raw)) return raw;
    if (raw.includes('/')) return `${raw}.png`;
    return `images/potion/${raw}.png`;
  }

  function get(id) {
    const key = String(id || '').trim();
    return IDLE_POTION_DATABASE.find((row) => row.id === key) || null;
  }

  function list() {
    return IDLE_POTION_DATABASE.slice();
  }

  function isPotionId(id) {
    return !!get(id);
  }

  function formatRecoverLabel(potion) {
    if (!potion) return '';
    if (potion.recoverPct != null && Number.isFinite(Number(potion.recoverPct))) {
      const pct = Number(potion.recoverPct);
      return `HP +${pct % 1 === 0 ? pct : pct.toFixed(1)}%`;
    }
    if (potion.recover != null && Number.isFinite(Number(potion.recover))) {
      return `HP +${Math.floor(Number(potion.recover))}`;
    }
    return '';
  }

  function calcHealAmount(potion, maxHp) {
    if (!potion) return 0;
    const max = Math.max(1, Math.floor(Number(maxHp) || 0));
    if (potion.recoverPct != null && Number.isFinite(Number(potion.recoverPct))) {
      const pct = Number(potion.recoverPct);
      return Math.max(1, Math.floor(max * pct / 100));
    }
    if (potion.recover != null && Number.isFinite(Number(potion.recover))) {
      return Math.max(1, Math.floor(Number(potion.recover)));
    }
    return 0;
  }

  function buildTooltipHtml(potion) {
    if (!potion) return '';
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
    const iconSrc = esc(resolveIcon(potion.icon));
    const recoverLabel = esc(formatRecoverLabel(potion));
    const desc = esc(potion.desc || '').replace(/\n/g, '<br>');
    return `
      <div class="eq-tooltip-frame inv-etc-frame idle-potion-tip-frame">
        <div class="eq-tooltip-frame-top"${topBg}></div>
        <div class="eq-tooltip-mid-wrap">
          <div class="eq-tooltip-frame-mid"${midBg}></div>
          <div class="eq-tooltip-body">
            <div class="eq-tooltip-content">
              <div class="eq-tip-name-row">
                <div class="eq-tip-name">${esc(potion.name)}</div>
              </div>
              <div class="eq-tip-dotline"${lineStyle}></div>
              <div class="inv-etc-main">
                <div class="eq-tip-icon-wrap">
                  ${baseSrc ? `<img class="eq-tip-icon-base" src="${baseSrc}" alt="">` : ''}
                  ${shadeSrc ? `<img class="eq-tip-icon-shade" src="${shadeSrc}" alt="">` : ''}
                  ${iconSrc ? `<img class="eq-tip-icon" src="${iconSrc}" alt="">` : ''}
                </div>
                <div class="sc-scroll-tip-copy idle-potion-tip-copy">
                  <div class="inv-etc-desc">${desc}</div>
                  ${recoverLabel ? `<div class="sc-scroll-tip-stats idle-potion-tip-stats"><div class="sc-scroll-tip-stat">${recoverLabel}</div></div>` : ''}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="eq-tooltip-frame-btm"${btmBg}></div>
      </div>
    `;
  }

  return {
    resolveIcon,
    get,
    list,
    isPotionId,
    formatRecoverLabel,
    calcHealAmount,
    buildTooltipHtml,
  };
})();

let playerPotionCounts = Object.create(null);

function getPlayerPotionCount(potionId) {
  const id = String(potionId || '').trim();
  if (!id) return 0;
  return Math.max(0, Math.floor(Number(playerPotionCounts[id]) || 0));
}

function cleanupPotionConsumeSlots(potionId) {
  const id = String(potionId || '').trim();
  if (!id || typeof playerInventoryConsume === 'undefined') return;
  const T = typeof CONSUME_ITEM_TYPE !== 'undefined' ? CONSUME_ITEM_TYPE.POTION : 'potion';
  for (let i = 0; i < playerInventoryConsume.length; i += 1) {
    const entry = playerInventoryConsume[i];
    if (entry && entry.type === T && String(entry.itemId) === id) {
      playerInventoryConsume[i] = null;
    }
  }
}

function ensurePotionConsumeInventory(potionId) {
  const id = String(potionId || '').trim();
  if (!id || typeof InventoryModule === 'undefined' || typeof CONSUME_ITEM_TYPE === 'undefined') return;
  if (getPlayerPotionCount(id) <= 0) {
    cleanupPotionConsumeSlots(id);
    return;
  }
  InventoryModule.ensureConsumeSlot(
    (entry) => entry && entry.type === CONSUME_ITEM_TYPE.POTION && String(entry.itemId) === id,
    () => ({ type: CONSUME_ITEM_TYPE.POTION, itemId: id }),
  );
}

function grantPotion(potionId, amount = 1) {
  const id = String(potionId || '').trim();
  const potion = IdlePotionStore.get(id);
  if (!potion) return 0;
  const add = Math.max(0, Math.floor(Number(amount) || 0));
  if (!add) return 0;
  playerPotionCounts[id] = getPlayerPotionCount(id) + add;
  ensurePotionConsumeInventory(id);
  if (typeof SessionPersistenceModule !== 'undefined') SessionPersistenceModule.scheduleSave?.();
  if (typeof InventoryModule !== 'undefined' && InventoryModule.tab === 'consume') {
    InventoryModule.render?.();
  }
  if (typeof IdlePotionPanel !== 'undefined') IdlePotionPanel.refresh?.();
  return add;
}

function takePotion(potionId, amount = 1) {
  const id = String(potionId || '').trim();
  const need = Math.max(1, Math.floor(Number(amount) || 1));
  if (getPlayerPotionCount(id) < need) return false;
  playerPotionCounts[id] = getPlayerPotionCount(id) - need;
  if (playerPotionCounts[id] <= 0) delete playerPotionCounts[id];
  cleanupPotionConsumeSlots(id);
  if (getPlayerPotionCount(id) > 0) ensurePotionConsumeInventory(id);
  if (typeof SessionPersistenceModule !== 'undefined') SessionPersistenceModule.scheduleSave?.();
  if (typeof InventoryModule !== 'undefined' && InventoryModule.tab === 'consume') {
    InventoryModule.render?.();
  }
  if (typeof IdlePotionPanel !== 'undefined') IdlePotionPanel.refresh?.();
  return true;
}

if (typeof window !== 'undefined') {
  window.IDLE_POTION_DATABASE = IDLE_POTION_DATABASE;
  window.IdlePotionStore = IdlePotionStore;
  window.playerPotionCounts = playerPotionCounts;
  window.getPlayerPotionCount = getPlayerPotionCount;
  window.grantPotion = grantPotion;
  window.takePotion = takePotion;
  window.ensurePotionConsumeInventory = ensurePotionConsumeInventory;
}
