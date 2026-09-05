/**
 * 放置模式 NPC 商店：購買／再次購買（跨店買回）；右側背包隨時可賣
 * 版面座標對照 wz-xml/ui/UI.UINpcShop.img.xml
 */
const UiNpcShop = (() => {
  const ASSET = {
    meso: 'images/npcshop/PointInfo__Meso__iconShop.png',
    mesoLayer: 'images/npcshop/Inventory__Normal__layer_meso.png',
  };

  /** 購買分類分頁（無品項時隱藏）；x 依可見順序動態算 */
  const BUY_CATEGORY_TABS = [
    { id: 'equip', label: '裝備' },
    { id: 'consume', label: '消耗' },
    { id: 'scroll', label: '卷軸' },
    { id: 'misc', label: '雜項' },
  ];

  const REPURCHASE_TAB = { id: 'repurchase', label: '再次購買' };

  /** Shop tab 起始 11、間距 72（tabBuyInterval） */
  const SHOP_TAB_X0 = 11;
  const SHOP_TAB_DX = 72;

  /** Inventory tab 0/1/2 → 11 / 87 / 163 */
  const INV_TABS = [
    { id: 'equip', label: '裝備', x: 11, idx: 0 },
    { id: 'consume', label: '消耗', x: 87, idx: 1 },
    { id: 'etc', label: '其他', x: 163, idx: 2 },
  ];

  const DEFAULT_TIP = '以滑鼠右鍵、雙擊即可進行販售與購買。';
  const BUY_CATEGORY_IDS = new Set(BUY_CATEGORY_TABS.map((t) => t.id));

  let inited = false;
  let open = false;
  let shopTab = 'equip';
  let invTab = 'equip';
  let selectedBuyIndex = -1;
  let selectedInvSlot = -1;
  let selectedRepurchaseUid = '';
  let buyQty = 1;
  let sellQty = 1;
  let sellTarget = null;
  let repurchaseQueue = [];

  function $(id) {
    return document.getElementById(id);
  }

  function gold() {
    return typeof IdleHunt !== 'undefined' ? IdleHunt.getGold() : 0;
  }

  function spend(n) {
    return typeof IdleHunt !== 'undefined' && IdleHunt.spendGold(n);
  }

  function earn(n) {
    if (typeof IdleHunt !== 'undefined') IdleHunt.addGold(n);
  }

  function currentShop() {
    if (typeof IdleNpcShopCatalog === 'undefined') return null;
    return IdleNpcShopCatalog.getUnifiedShop?.()
      || IdleNpcShopCatalog.getShopForCurrentZone?.()
      || null;
  }

  function isBuyCategoryTab(id) {
    return BUY_CATEGORY_IDS.has(String(id || ''));
  }

  /** 目前可見的購買分類 id（已依等級過濾） */
  function availableBuyCategories() {
    const shop = currentShop();
    if (!shop || typeof IdleNpcShopCatalog === 'undefined') return [];
    if (typeof IdleNpcShopCatalog.getAvailableBuyCategories === 'function') {
      return IdleNpcShopCatalog.getAvailableBuyCategories(shop.id);
    }
    return BUY_CATEGORY_TABS.map((t) => t.id);
  }

  /** 確保 shopTab 落在可見分頁；必要時切到第一個有貨的分類 */
  function ensureValidShopTab() {
    if (shopTab === 'repurchase') return;
    const cats = availableBuyCategories();
    if (isBuyCategoryTab(shopTab) && cats.includes(shopTab)) return;
    shopTab = cats[0] || 'repurchase';
  }

  /** 目前購買分頁的可購列（已篩等級＋分類） */
  function currentBuyRows() {
    const shop = currentShop();
    if (!shop || typeof IdleNpcShopCatalog === 'undefined') return [];
    if (!isBuyCategoryTab(shopTab)) return [];
    if (typeof IdleNpcShopCatalog.getBuyListByCategory === 'function') {
      return IdleNpcShopCatalog.getBuyListByCategory(shopTab, shop.id);
    }
    const rows = IdleNpcShopCatalog.getBuyList(shop.id) || [];
    return rows.filter((row) => {
      const cat = IdleNpcShopCatalog.buyCategoryOf?.(row);
      return cat === shopTab;
    });
  }

  function selectedBuyRow() {
    const rows = currentBuyRows();
    if (selectedBuyIndex < 0 || selectedBuyIndex >= rows.length) return null;
    return rows[selectedBuyIndex] || null;
  }

  function formatShopMeso(amount) {
    const n = Math.floor(Number(amount) || 0);
    const sign = n < 0 ? '-' : '';
    const abs = Math.abs(n);
    // 與角色資訊／圖1一致：1億 6013萬 7954
    if (typeof formatPower === 'function') {
      return `${sign}${formatPower(abs).replace(/億/g, '億 ').replace(/萬/g, '萬 ')}`;
    }
    if (typeof formatMesoFullDisplay === 'function') {
      return formatMesoFullDisplay(n);
    }
    return `${sign}${abs.toLocaleString('zh-TW')}`;
  }

  function ensureShopPaperdoll() {
    if (typeof Paperdoll === 'undefined') return;
    Paperdoll.initShop?.($('npcShopRoot') || document.getElementById('npcShopRight')?.parentElement);
    Paperdoll.refresh?.();
  }

  function ensureDom() {
    if ($('npcShopRoot')) return;
    const root = document.createElement('div');
    root.id = 'npcShopRoot';
    root.className = 'npc-shop hidden';
    root.innerHTML = `
      <div class="npc-shop-backdrop" data-npc-shop-close></div>
      <div class="npc-shop-shell" id="npcShopShell">
        <div class="npc-shop-drag-handle" id="npcShopDragHandle" title="拖曳商店"></div>
        <div class="npc-shop-left" id="npcShopLeft">
          <div class="npc-shop-title" id="npcShopTitle">商店</div>
          <div class="npc-shop-tabs" id="npcShopTabs"></div>
          <div class="npc-shop-list" id="npcShopList"></div>
          <div class="npc-shop-hint" id="npcShopHint"></div>
        </div>
        <div class="npc-shop-right" id="npcShopRight">
          <button type="button" class="npc-shop-close" id="npcShopClose" aria-label="關閉"></button>
          <div class="npc-shop-avatar paperdoll-stage paperdoll-stage--shop" id="npcShopAvatar" data-paperdoll="shop" aria-hidden="true"></div>
          <img class="npc-shop-meso-layer" src="${ASSET.mesoLayer}" alt="" onerror="this.style.display='none'">
          <div class="npc-shop-meso">
            <img src="${ASSET.meso}" alt="">
            <span id="npcShopMeso">0</span>
          </div>
          <div class="npc-shop-inv-tabs" id="npcShopInvTabs"></div>
          <div class="npc-shop-inv-list" id="npcShopInvList"></div>
        </div>
        <div id="npcShopBuyPopup" class="npc-shop-buy-popup hidden" aria-hidden="true">
          <div class="npc-shop-buy-card">
            <div class="npc-shop-buy-top">
              <div class="npc-shop-buy-unit-line">單價 <span id="npcShopBuyUnit">0</span></div>
              <div class="npc-shop-buy-icon-hit" id="npcShopBuyIconHit" aria-hidden="true"></div>
              <img class="npc-shop-buy-icon" id="npcShopBuyIcon" alt="">
              <div class="npc-shop-buy-name" id="npcShopBuyName"></div>
            </div>
            <div class="npc-shop-buy-mid">
              <input type="text" inputmode="numeric" pattern="[0-9]*" maxlength="5" class="npc-shop-buy-qty-input" id="npcShopBuyQty" value="1" autocomplete="off">
              <button type="button" class="npc-shop-buy-plus" id="npcShopBuyPlus" aria-label="增加"></button>
              <button type="button" class="npc-shop-buy-minus" id="npcShopBuyMinus" aria-label="減少"></button>
              <img class="npc-shop-buy-mid-point-icon" src="${ASSET.meso}" alt="">
              <span class="npc-shop-buy-mid-point-name">楓幣</span>
              <div class="npc-shop-buy-total" id="npcShopBuyTotal">0</div>
            </div>
            <div class="npc-shop-buy-bottom">
              <button type="button" class="npc-shop-buy-yes" id="npcShopBuyYes" aria-label="確認"></button>
              <button type="button" class="npc-shop-buy-no" id="npcShopBuyNo" aria-label="取消"></button>
            </div>
          </div>
        </div>
        <div id="npcShopSellPopup" class="npc-shop-sell-popup hidden" aria-hidden="true">
          <div class="npc-shop-sell-card">
            <div class="npc-shop-sell-top">
              <div class="npc-shop-sell-unit-line">單價 <span id="npcShopSellUnit">0</span></div>
              <div class="npc-shop-sell-icon-hit" id="npcShopSellIconHit" aria-hidden="true"></div>
              <img class="npc-shop-sell-icon" id="npcShopSellIcon" alt="">
              <div class="npc-shop-sell-name" id="npcShopSellName"></div>
            </div>
            <div class="npc-shop-sell-mid">
              <input type="text" inputmode="numeric" pattern="[0-9]*" maxlength="5" class="npc-shop-sell-qty-input" id="npcShopSellQty" value="1" autocomplete="off">
              <button type="button" class="npc-shop-sell-plus" id="npcShopSellPlus" aria-label="增加"></button>
              <button type="button" class="npc-shop-sell-minus" id="npcShopSellMinus" aria-label="減少"></button>
              <img class="npc-shop-sell-mid-point-icon" src="${ASSET.meso}" alt="">
              <span class="npc-shop-sell-mid-point-name">楓幣</span>
              <div class="npc-shop-sell-total" id="npcShopSellTotal">0</div>
            </div>
            <div class="npc-shop-sell-bottom">
              <button type="button" class="npc-shop-sell-yes" id="npcShopSellYes" aria-label="確認"></button>
              <button type="button" class="npc-shop-sell-no" id="npcShopSellNo" aria-label="取消"></button>
            </div>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(root);

    $('npcShopClose')?.addEventListener('click', () => setOpen(false));
    root.querySelector('[data-npc-shop-close]')?.addEventListener('click', () => setOpen(false));
    $('npcShopBuyMinus')?.addEventListener('click', () => setBuyQty(buyQty - 1));
    $('npcShopBuyPlus')?.addEventListener('click', () => setBuyQty(buyQty + 1));
    $('npcShopBuyQty')?.addEventListener('change', (e) => {
      setBuyQty(Number(e.target.value) || 1);
    });
    $('npcShopBuyQty')?.addEventListener('input', (e) => {
      const raw = String(e.target.value || '').replace(/\D/g, '');
      if (raw !== e.target.value) e.target.value = raw;
      if (raw) setBuyQty(Number(raw) || 1);
    });
    $('npcShopBuyYes')?.addEventListener('click', confirmBuy);
    $('npcShopBuyNo')?.addEventListener('click', hideBuyPopup);
    $('npcShopSellMinus')?.addEventListener('click', () => setSellQty(sellQty - 1));
    $('npcShopSellPlus')?.addEventListener('click', () => setSellQty(sellQty + 1));
    $('npcShopSellQty')?.addEventListener('change', (e) => {
      setSellQty(Number(e.target.value) || 1);
    });
    $('npcShopSellQty')?.addEventListener('input', (e) => {
      const raw = String(e.target.value || '').replace(/\D/g, '');
      if (raw !== e.target.value) e.target.value = raw;
      if (raw) setSellQty(Number(raw) || 1);
    });
    $('npcShopSellYes')?.addEventListener('click', confirmSell);
    $('npcShopSellNo')?.addEventListener('click', hideSellPopup);
    bindDrag();
    bindShopTooltips();
  }

  const rowTipPayload = new WeakMap();

  function tagRowTip(rowEl, payload) {
    if (rowEl && payload) rowTipPayload.set(rowEl, payload);
  }

  function consumeTypeConst() {
    return typeof CONSUME_ITEM_TYPE !== 'undefined' ? CONSUME_ITEM_TYPE : {};
  }

  function hideAllShopTooltips() {
    if (typeof EquipTooltipModule !== 'undefined') EquipTooltipModule.hide();
    if (typeof InventoryModule !== 'undefined') {
      InventoryModule.hideConsumeTooltip?.();
      InventoryModule.hideEtcTooltip?.();
    }
    if (typeof ScrollModule !== 'undefined') ScrollModule.hideScrollTooltip?.();
  }

  function etcTipFromDisplay(disp, desc = '') {
    if (!disp?.name) return null;
    return { kind: 'etc', name: disp.name, desc, icon: disp.icon || '' };
  }

  function resolveEtcEntryTooltip(entry) {
    if (!entry) return null;
    const catalog = typeof IdleEtcStore !== 'undefined' ? IdleEtcStore.get(entry.itemId) : null;
    return {
      kind: 'etc',
      name: catalog?.name || entry.name || entry.itemId || '其他',
      desc: catalog?.desc || entry.desc || '',
      icon: catalog?.icon || entry.icon || '',
    };
  }

  function resolveConsumeEntryTooltip(entry) {
    if (!entry) return null;
    const T = consumeTypeConst();

    if (typeof isStarForceScrollConsumeEntry === 'function' && isStarForceScrollConsumeEntry(entry)) {
      const meta = typeof getStarForceScrollById === 'function' ? getStarForceScrollById(entry.scrollId) : null;
      if (!meta) return null;
      if (meta.hover) return { kind: 'consume', hover: meta.hover };
      return etcTipFromDisplay({ name: meta.name, icon: meta.icon });
    }
    if (typeof isPotentialScrollConsumeEntry === 'function' && isPotentialScrollConsumeEntry(entry)) {
      const meta = typeof getPotentialScrollById === 'function' ? getPotentialScrollById(entry.scrollId) : null;
      if (!meta) return null;
      if (meta.hover) return { kind: 'consume', hover: meta.hover };
      return etcTipFromDisplay({ name: meta.name, icon: meta.icon });
    }
    if (entry.type === T.GLORY_SCROLL || entry.type === 'glory_scroll') {
      const scroll = typeof getScrollById === 'function' ? getScrollById(entry.scrollId) : null;
      if (scroll) return { kind: 'glory_scroll', scroll };
    }
    if (entry.type === T.BONUS_STAT || entry.type === 'bonus_stat') {
      const item = typeof getBonusStatItemById === 'function' ? getBonusStatItemById(entry.itemId) : null;
      if (!item) return null;
      if (item.tooltipImage) return { kind: 'consume', hover: item.tooltipImage };
      return etcTipFromDisplay({ name: item.name, icon: item.icon });
    }
    if (entry.type === T.EXCEPTIONAL_HAMMER || entry.type === 'exceptional_hammer') {
      const hammer = typeof getExceptionalHammerById === 'function' ? getExceptionalHammerById(entry.hammerId) : null;
      if (!hammer) return null;
      if (hammer.hover) return { kind: 'consume', hover: hammer.hover };
      return etcTipFromDisplay({ name: hammer.name, icon: hammer.icon });
    }
    if (entry.type === T.SOUL || entry.type === 'soul') {
      const mat = typeof getSoulMaterialById === 'function' ? getSoulMaterialById(entry.soulId) : null;
      if (!mat) return null;
      if (mat.hover) return { kind: 'consume', hover: mat.hover };
      return etcTipFromDisplay({ name: mat.name, icon: mat.icon });
    }
    if (entry.type === T.POTION || entry.type === 'potion') {
      const potion = typeof IdlePotionStore !== 'undefined' ? IdlePotionStore.get(entry.itemId) : null;
      if (!potion) return null;
      return { kind: 'potion', potion };
    }

    const disp = typeof IdleNpcShopCatalog !== 'undefined'
      ? IdleNpcShopCatalog.resolveConsumeEntryDisplay(entry)
      : null;
    return etcTipFromDisplay(disp);
  }

  function consumeEntryFromBuyRow(row) {
    if (!row) return null;
    const T = consumeTypeConst();
    if (row.kind === 'scroll') {
      const scroll = typeof resolveShopScrollMeta === 'function'
        ? resolveShopScrollMeta(row.itemId || row.scrollId)
        : null;
      if (scroll?.consumeType === 'potential_scroll') {
        return { type: T.POTENTIAL_SCROLL, scrollId: scroll.scrollId };
      }
      if (scroll?.consumeType === 'starforce_scroll') {
        return { type: T.STARFORCE_SCROLL, scrollId: scroll.scrollId };
      }
      return { type: T.GLORY_SCROLL, scrollId: row.itemId || row.scrollId };
    }
    if (row.consumeType === 'recovery_card' || row.itemId === 'recovery_card') {
      return { type: T.RECOVERY_CARD };
    }
    if (row.consumeType === 'starforce_scroll') {
      return { type: T.STARFORCE_SCROLL, scrollId: row.scrollId || row.itemId };
    }
    if (row.consumeType === 'potential_scroll') {
      return { type: T.POTENTIAL_SCROLL, scrollId: row.scrollId || row.itemId };
    }
    if (row.consumeType === 'cube') {
      return { type: T.CUBE, cubeId: row.cubeId };
    }
    if (row.consumeType === 'add_cube') {
      return { type: T.ADD_CUBE, cubeId: row.cubeId };
    }
    if (row.consumeType === 'hammer') {
      return { type: T.HAMMER, hammerId: row.hammerId };
    }
    if (row.consumeType === 'glory_scroll') {
      return { type: T.GLORY_SCROLL, scrollId: row.scrollId || row.itemId };
    }
    if (row.consumeType === 'bonus_stat') {
      return { type: T.BONUS_STAT, itemId: row.itemId };
    }
    if (row.consumeType === 'exceptional_hammer') {
      return { type: T.EXCEPTIONAL_HAMMER, hammerId: row.hammerId };
    }
    if (row.consumeType === 'soul') {
      return { type: T.SOUL, soulId: row.soulId };
    }
    if (row.consumeType === 'potion'
      || (row.kind === 'consume' && typeof IdlePotionStore !== 'undefined' && IdlePotionStore.isPotionId?.(row.itemId))) {
      return { type: T.POTION, itemId: row.itemId };
    }
    return null;
  }

  function buyRowToGrantDrop(row) {
    if (!row) return null;
    const amount = Math.max(1, Math.floor(Number(row.amount) || 1));
    if (row.kind === 'scroll') {
      const scroll = typeof resolveShopScrollMeta === 'function'
        ? resolveShopScrollMeta(row.itemId || row.scrollId)
        : null;
      if (scroll) {
        return { consumeType: scroll.consumeType, scrollId: scroll.scrollId, amount };
      }
      return { consumeType: 'glory_scroll', scrollId: row.itemId || row.scrollId, amount };
    }
    if (row.consumeType === 'recovery_card' || row.itemId === 'recovery_card') {
      return { consumeType: 'recovery_card', amount };
    }
    if (row.consumeType === 'potion'
      || (row.kind === 'consume' && typeof IdlePotionStore !== 'undefined' && IdlePotionStore.isPotionId?.(row.itemId))) {
      return { consumeType: 'potion', itemId: row.itemId, amount };
    }
    if (row.consumeType) {
      return {
        consumeType: row.consumeType,
        amount,
        itemId: row.itemId,
        scrollId: row.scrollId || row.itemId,
        cubeId: row.cubeId,
        hammerId: row.hammerId,
        soulId: row.soulId,
      };
    }
    return row;
  }

  function resolveBuyRowTooltip(row) {
    if (!row) return null;
    if (row.kind === 'special' || row.specialType === 'hyper_point'
      || row.itemId === 'hyper_stat_point') {
      const disp = typeof IdleNpcShopCatalog !== 'undefined'
        ? IdleNpcShopCatalog.resolveBuyRowDisplay(row)
        : null;
      return etcTipFromDisplay(
        {
          name: disp?.name || row.name || '極限屬性點',
          icon: disp?.icon || row.icon || '',
        },
        disp?.desc || row.desc || '永久增加極限屬性點數。',
      );
    }
    if (row.kind === 'equip') {
      return { kind: 'equip', itemId: row.itemId, slotIndex: -1 };
    }
    if (row.kind === 'etc' || row.bag === 'etc') {
      return resolveEtcEntryTooltip(row);
    }
    const consumeEntry = consumeEntryFromBuyRow(row);
    if (consumeEntry) return resolveConsumeEntryTooltip(consumeEntry);
    if (row.kind === 'consume' || row.consumeType) {
      const disp = typeof IdleNpcShopCatalog !== 'undefined'
        ? IdleNpcShopCatalog.resolveBuyRowDisplay(row)
        : null;
      return etcTipFromDisplay(disp);
    }
    return null;
  }

  function resolveRepurchaseTooltip(entry) {
    if (!entry) return null;
    if (entry.kind === 'equip') {
      return {
        kind: 'equip',
        itemId: entry.itemId,
        slotIndex: -1,
        state: entry.state || null,
      };
    }
    if (entry.kind === 'consume') {
      return resolveConsumeEntryTooltip(entry.consumeEntry);
    }
    if (entry.kind === 'etc') {
      return resolveEtcEntryTooltip(entry.etcPayload || { itemId: entry.itemId, name: entry.name, icon: entry.icon });
    }
    return null;
  }

  function showShopTooltip(anchorEl, payload) {
    if (!anchorEl || !payload) return;
    if (payload.kind === 'equip' && typeof EquipTooltipModule !== 'undefined') {
      EquipTooltipModule.show(
        anchorEl,
        payload.itemId,
        payload.slotIndex ?? -1,
        payload.state ?? null,
      );
      return;
    }
    if (payload.kind === 'consume' && payload.hover && typeof InventoryModule !== 'undefined') {
      InventoryModule.showConsumeTooltip?.(anchorEl, payload.hover);
      return;
    }
    if (payload.kind === 'glory_scroll' && payload.scroll && typeof ScrollModule !== 'undefined') {
      ScrollModule.showScrollTooltip(anchorEl, payload.scroll);
      return;
    }
    if (payload.kind === 'etc' && typeof InventoryModule !== 'undefined') {
      InventoryModule.showEtcTooltip?.(anchorEl, payload.name, payload.desc || '', payload.icon || '');
      return;
    }
    if (payload.kind === 'potion' && payload.potion && typeof InventoryModule !== 'undefined') {
      InventoryModule.showPotionTooltip?.(anchorEl, payload.potion);
    }
  }

  function bindShopListTooltips(listEl) {
    if (!listEl || listEl.dataset.shopTooltipReady) return;
    listEl.addEventListener('mouseover', (event) => {
      if (typeof EquipTooltipModule !== 'undefined'
        && (EquipTooltipModule.pinned || EquipTooltipModule.dragging)) return;
      const row = event.target.closest?.('.npc-shop-row, .npc-shop-inv-row');
      if (!row || listEl._shopTooltipRow === row) return;
      const payload = rowTipPayload.get(row);
      if (!payload) return;
      hideAllShopTooltips();
      listEl._shopTooltipRow = row;
      showShopTooltip(row, payload);
    });
    listEl.addEventListener('mouseout', (event) => {
      const row = event.target.closest?.('.npc-shop-row, .npc-shop-inv-row');
      if (!row) return;
      const related = event.relatedTarget;
      if (related instanceof Node && row.contains(related)) return;
      if (listEl._shopTooltipRow === row) {
        listEl._shopTooltipRow = null;
        hideAllShopTooltips();
      }
    });
    listEl.dataset.shopTooltipReady = '1';
  }

  function bindPopupIconTooltip(iconEl, getPayload) {
    if (!iconEl || iconEl.dataset.shopTooltipReady) return;
    iconEl.addEventListener('mouseenter', () => {
      if (typeof EquipTooltipModule !== 'undefined'
        && (EquipTooltipModule.pinned || EquipTooltipModule.dragging)) return;
      const payload = typeof getPayload === 'function' ? getPayload() : null;
      if (!payload) return;
      hideAllShopTooltips();
      showShopTooltip(iconEl, payload);
    });
    iconEl.addEventListener('mouseleave', () => hideAllShopTooltips());
    iconEl.dataset.shopTooltipReady = '1';
  }

  function bindShopTooltips() {
    bindShopListTooltips($('npcShopList'));
    bindShopListTooltips($('npcShopInvList'));
    bindPopupIconTooltip($('npcShopBuyIconHit'), () => {
      return resolveBuyRowTooltip(selectedBuyRow());
    });
    bindPopupIconTooltip($('npcShopSellIconHit'), () => {
      if (!sellTarget) return null;
      if (sellTarget.tab === 'consume') {
        return resolveConsumeEntryTooltip(playerInventoryConsume?.[sellTarget.slotIndex]);
      }
      if (sellTarget.tab === 'etc') {
        return resolveEtcEntryTooltip(playerInventoryEtc?.[sellTarget.slotIndex]);
      }
      return null;
    });
  }

  function bindDrag() {
    const shell = $('npcShopShell');
    if (!shell || typeof PanelDrag === 'undefined') return;
    PanelDrag.enable(shell, {
      handle: '#npcShopDragHandle',
      ignoreSelector: 'button, input, .npc-shop-tabs, .npc-shop-inv-tabs, .npc-shop-list, .npc-shop-inv-list',
      storageKey: 'ui.drag.npcShop',
      title: '拖曳商店',
    });
  }

  function setBuyQty(n) {
    buyQty = Math.max(1, Math.min(999, Math.floor(Number(n) || 1)));
    const input = $('npcShopBuyQty');
    if (input) input.value = String(buyQty);
    syncBuyPopupTotals();
  }

  function syncBuyPopupTotals() {
    const row = selectedBuyRow();
    const disp = IdleNpcShopCatalog.resolveBuyRowDisplay(row);
    const unit = disp.price;
    const total = unit * buyQty;
    const unitEl = $('npcShopBuyUnit');
    const totalEl = $('npcShopBuyTotal');
    if (unitEl) unitEl.textContent = unit.toLocaleString('zh-TW');
    if (totalEl) totalEl.textContent = total.toLocaleString('zh-TW');
  }

  function showBuyPopup() {
    const row = selectedBuyRow();
    if (!row) return;
    const disp = IdleNpcShopCatalog.resolveBuyRowDisplay(row);
    const pop = $('npcShopBuyPopup');
    const icon = $('npcShopBuyIcon');
    const name = $('npcShopBuyName');
    if (icon) icon.src = disp.icon || '';
    if (name) name.textContent = disp.name;
    setBuyQty(1);
    pop?.classList.remove('hidden');
    pop?.setAttribute('aria-hidden', 'false');
  }

  function hideBuyPopup() {
    const pop = $('npcShopBuyPopup');
    pop?.classList.add('hidden');
    pop?.setAttribute('aria-hidden', 'true');
    hideAllShopTooltips();
  }

  function hideSellPopup() {
    const pop = $('npcShopSellPopup');
    pop?.classList.add('hidden');
    pop?.setAttribute('aria-hidden', 'true');
    sellTarget = null;
    hideAllShopTooltips();
  }

  function isBuyPopupOpen() {
    const pop = $('npcShopBuyPopup');
    return !!(pop && !pop.classList.contains('hidden'));
  }

  function isSellPopupOpen() {
    const pop = $('npcShopSellPopup');
    return !!(pop && !pop.classList.contains('hidden'));
  }

  function getSellTargetMaxQty() {
    if (!sellTarget) return 1;
    if (sellTarget.tab === 'consume') {
      const entry = playerInventoryConsume?.[sellTarget.slotIndex];
      return Math.max(1, getConsumeEntryCount(entry));
    }
    if (sellTarget.tab === 'etc') {
      const entry = playerInventoryEtc?.[sellTarget.slotIndex];
      return Math.max(1, Math.floor(Number(entry?.amount) || 1));
    }
    return 1;
  }

  function getSellTargetDisplay() {
    if (!sellTarget) return { name: '', icon: '', price: 0 };
    if (sellTarget.tab === 'consume') {
      const entry = playerInventoryConsume?.[sellTarget.slotIndex];
      return IdleNpcShopCatalog.resolveConsumeEntryDisplay(entry);
    }
    if (sellTarget.tab === 'etc') {
      const entry = playerInventoryEtc?.[sellTarget.slotIndex];
      return IdleNpcShopCatalog.resolveEtcEntryDisplay(entry);
    }
    return { name: '', icon: '', price: 0 };
  }

  function setSellQty(n) {
    const max = getSellTargetMaxQty();
    sellQty = Math.max(1, Math.min(max, Math.min(999, Math.floor(Number(n) || 1))));
    const input = $('npcShopSellQty');
    if (input) input.value = String(sellQty);
    syncSellPopupTotals();
  }

  function syncSellPopupTotals() {
    const disp = getSellTargetDisplay();
    const unit = disp.price;
    const total = unit * sellQty;
    const unitEl = $('npcShopSellUnit');
    const totalEl = $('npcShopSellTotal');
    if (unitEl) unitEl.textContent = unit.toLocaleString('zh-TW');
    if (totalEl) totalEl.textContent = total.toLocaleString('zh-TW');
  }

  function showSellPopup(tab, slotIndex) {
    if (tab !== 'consume' && tab !== 'etc') return;
    sellTarget = { tab, slotIndex };
    const disp = getSellTargetDisplay();
    if (!disp.name) {
      sellTarget = null;
      return;
    }
    const pop = $('npcShopSellPopup');
    const icon = $('npcShopSellIcon');
    const name = $('npcShopSellName');
    if (icon) icon.src = disp.icon || '';
    if (name) name.textContent = disp.name;
    setSellQty(1);
    pop?.classList.remove('hidden');
    pop?.setAttribute('aria-hidden', 'false');
  }

  function closeByEsc() {
    if (!open) return false;
    if (isSellPopupOpen()) {
      hideSellPopup();
      return true;
    }
    if (isBuyPopupOpen()) {
      hideBuyPopup();
      return true;
    }
    setOpen(false);
    return true;
  }

  function confirmSell() {
    if (!sellTarget) return;
    const qty = sellQty;
    const disp = getSellTargetDisplay();
    const total = disp.price * qty;
    let ok = false;
    if (sellTarget.tab === 'consume') {
      ok = sellConsumeSlot(sellTarget.slotIndex, qty);
    } else if (sellTarget.tab === 'etc') {
      ok = sellEtcSlot(sellTarget.slotIndex, qty);
    }
    if (ok) {
      if (typeof addLog === 'function') {
        addLog(`[商店] 賣出【${disp.name}】×${qty}（${total.toLocaleString('zh-TW')} 楓幣）`, 'log-success');
      }
      hideSellPopup();
      render();
    }
  }

  function confirmBuy() {
    const shop = currentShop();
    if (!shop) return;
    const row = selectedBuyRow();
    if (!row) return;
    if (typeof IdleNpcShopCatalog.isRowAvailable === 'function'
      && !IdleNpcShopCatalog.isRowAvailable(row)) {
      if (typeof addLog === 'function') addLog('[商店] 目前等級無法購買此商品。', 'log-fail');
      hideBuyPopup();
      render();
      return;
    }
    const disp = IdleNpcShopCatalog.resolveBuyRowDisplay(row);
    const total = disp.price * buyQty;
    if (total > 0 && !spend(total)) {
      if (typeof addLog === 'function') addLog('[商店] 楓幣不足。', 'log-fail');
      return;
    }
    const isHyperPoint = row.kind === 'special' || row.specialType === 'hyper_point'
      || row.itemId === 'hyper_stat_point';
    let ok = true;
    // 極限屬性點一次加總，避免逐筆 notify 造成卡頓
    if (isHyperPoint) {
      ok = grantBuyRow(row, buyQty);
    } else {
      for (let i = 0; i < buyQty; i++) {
        if (!grantBuyRow(row)) {
          ok = false;
          break;
        }
      }
    }
    if (ok) {
      if (typeof addLog === 'function') {
        addLog(`[商店] 購買【${disp.name}】×${buyQty}（${total.toLocaleString('zh-TW')} 楓幣）`, 'log-success');
      }
      hideBuyPopup();
      render();
    } else if (typeof addLog === 'function') {
      addLog(
        isHyperPoint ? '[商店] 購買失敗。' : '[商店] 背包空間不足，部分商品未放入。',
        'log-fail',
      );
      render();
    }
  }

  function grantBuyRow(row, qty = 1) {
    if (!row) return false;
    if (row.kind === 'special' || row.specialType === 'hyper_point'
      || row.itemId === 'hyper_stat_point') {
      const per = Math.max(1, Math.floor(Number(row.amount) || 1));
      const times = Math.max(1, Math.floor(Number(qty) || 1));
      const pts = per * times;
      if (typeof CharacterProgression === 'undefined'
        || typeof CharacterProgression.grantHyperPoints !== 'function') {
        return false;
      }
      return CharacterProgression.grantHyperPoints(pts) > 0;
    }
    if (typeof InventoryModule === 'undefined') return false;
    if (row.kind === 'equip') {
      return InventoryModule.addEquipFromCatalog(row.itemId, null, {
        silent: true,
        logTag: '商店',
        switchTab: false,
      });
    }
    const drop = buyRowToGrantDrop(row);
    if (!drop) return false;
    if (drop.consumeType) {
      return InventoryModule.grantConsumeDrop(drop, { silent: true, logTag: '商店' }).ok;
    }
    return InventoryModule.applyIdleDrop(drop, { silent: true, logTag: '商店' }).ok;
  }

  function pushRepurchase(entry) {
    repurchaseQueue.unshift(entry);
    const max = (typeof IdleNpcShopCatalog !== 'undefined'
      ? IdleNpcShopCatalog.REPURCHASE_MAX
      : 20) || 20;
    if (repurchaseQueue.length > max) repurchaseQueue.length = max;
    persistRepurchase();
  }

  function persistRepurchase() {
    if (typeof SessionPersistenceModule !== 'undefined') {
      SessionPersistenceModule.scheduleSave();
    }
  }

  function exportRepurchase() {
    return repurchaseQueue.map((e) => ({
      ...e,
      state: e.state ? JSON.parse(JSON.stringify(e.state)) : null,
      consumeEntry: e.consumeEntry ? JSON.parse(JSON.stringify(e.consumeEntry)) : null,
      etcPayload: e.etcPayload ? JSON.parse(JSON.stringify(e.etcPayload)) : null,
    }));
  }

  function importRepurchase(list) {
    repurchaseQueue = Array.isArray(list)
      ? list.map((e) => ({
        uid: String(e.uid || `${Date.now()}-${Math.random()}`),
        kind: e.kind || 'equip',
        itemId: e.itemId || '',
        name: e.name || e.itemId || '物品',
        icon: e.icon || '',
        soldPrice: Math.max(1, Math.floor(Number(e.soldPrice) || 1)),
        state: e.state || null,
        consumeEntry: e.consumeEntry ? JSON.parse(JSON.stringify(e.consumeEntry)) : null,
        etcPayload: e.etcPayload ? JSON.parse(JSON.stringify(e.etcPayload)) : null,
        amount: Math.max(1, Math.floor(Number(e.amount) || 1)),
        soldAt: Number(e.soldAt) || Date.now(),
      })).filter((e) => {
        if (e.kind === 'consume') return !!e.consumeEntry;
        if (e.kind === 'etc') return !!(e.itemId || e.etcPayload?.itemId);
        return !!e.itemId;
      })
      : [];
  }

  function repurchaseTotalPrice(entry) {
    const unit = Math.max(1, Math.floor(Number(entry?.soldPrice) || 1));
    const amount = Math.max(1, Math.floor(Number(entry?.amount) || 1));
    return unit * amount;
  }

  function repurchaseLabel(entry) {
    const amount = Math.max(1, Math.floor(Number(entry?.amount) || 1));
    if (amount > 1) return `${entry.name} ×${amount}`;
    return entry.name;
  }

  function consumeEntryToDropRow(entry, amount = 1) {
    if (!entry) return null;
    const qty = Math.max(1, Math.floor(Number(amount) || 1));
    const T = typeof CONSUME_ITEM_TYPE !== 'undefined' ? CONSUME_ITEM_TYPE : {};
    if (typeof isStarForceScrollConsumeEntry === 'function' && isStarForceScrollConsumeEntry(entry)) {
      return { consumeType: 'starforce_scroll', scrollId: entry.scrollId, amount: qty };
    }
    if (typeof isPotentialScrollConsumeEntry === 'function' && isPotentialScrollConsumeEntry(entry)) {
      return { consumeType: 'potential_scroll', scrollId: entry.scrollId, amount: qty };
    }
    if (entry.type === T.CUBE || entry.type === 'cube') {
      return { consumeType: 'cube', cubeId: entry.cubeId, amount: qty };
    }
    if (entry.type === T.ADD_CUBE || entry.type === 'add_cube') {
      return { consumeType: 'add_cube', cubeId: entry.cubeId, amount: qty };
    }
    if (entry.type === T.HAMMER || entry.type === 'hammer') {
      return { consumeType: 'hammer', hammerId: entry.hammerId, amount: qty };
    }
    if (entry.type === T.GLORY_SCROLL || entry.type === 'glory_scroll') {
      return { consumeType: 'glory_scroll', scrollId: entry.scrollId, amount: qty };
    }
    if (entry.type === T.BONUS_STAT || entry.type === 'bonus_stat') {
      return { consumeType: 'bonus_stat', itemId: entry.itemId, amount: qty };
    }
    if (entry.type === T.EXCEPTIONAL_HAMMER || entry.type === 'exceptional_hammer') {
      return { consumeType: 'exceptional_hammer', hammerId: entry.hammerId, amount: qty };
    }
    if (entry.type === T.SOUL || entry.type === 'soul') {
      return { consumeType: 'soul', soulId: entry.soulId, amount: qty };
    }
    if (entry.type === T.RECOVERY_CARD || entry.type === 'recovery_card') {
      return { consumeType: 'recovery_card', amount: qty };
    }
    if (entry.type === T.POTION || entry.type === 'potion') {
      return { consumeType: 'potion', itemId: entry.itemId, amount: qty };
    }
    return null;
  }

  function sellEquipSlot(slotIndex) {
    if (typeof playerInventoryEquip === 'undefined') return false;
    const itemId = playerInventoryEquip[slotIndex];
    if (!itemId) return false;
    const state = playerInventoryState[slotIndex]
      ? JSON.parse(JSON.stringify(playerInventoryState[slotIndex]))
      : null;
    const item = typeof ITEM_DATABASE !== 'undefined' ? ITEM_DATABASE[itemId] : null;
    const soldPrice = IdleNpcShopCatalog.getSellPrice(itemId, state);
    const name = item?.name || itemId;
    const icon = item?.icon || `images/equip/${itemId}.png`;

    if (typeof currentEnchantItem !== 'undefined' && currentEnchantItem
      && currentEnchantItem.slotIndex === slotIndex
      && typeof unloadEquipFromSlot === 'function') {
      unloadEquipFromSlot({ silent: true });
    }

    playerInventoryEquip[slotIndex] = null;
    playerInventoryState[slotIndex] = null;
    if (typeof playerInventory !== 'undefined' && Array.isArray(playerInventory)) {
      playerInventory.splice(0, playerInventory.length, ...playerInventoryEquip);
    }

    earn(soldPrice);
    pushRepurchase({
      uid: `rp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      kind: 'equip',
      itemId,
      name,
      icon,
      soldPrice,
      state,
      amount: 1,
      soldAt: Date.now(),
    });
    if (typeof InventoryModule !== 'undefined') {
      InventoryModule.render?.();
      InventoryModule.updateSlotCount?.();
    }
    if (typeof SessionPersistenceModule !== 'undefined') SessionPersistenceModule.scheduleSave();
    if (typeof addLog === 'function') {
      addLog(`[商店] 賣出【${name}】＋${soldPrice.toLocaleString('zh-TW')} 楓幣`, 'log-success');
    }
    selectedInvSlot = -1;
    return true;
  }

  function hasConsumeEntryStock(entry) {
    if (!entry) return false;
    const T = typeof CONSUME_ITEM_TYPE !== 'undefined' ? CONSUME_ITEM_TYPE : {};
    if (typeof isStarForceScrollConsumeEntry === 'function' && isStarForceScrollConsumeEntry(entry)) {
      return typeof getPlayerStarForceScrollCount === 'function'
        ? getPlayerStarForceScrollCount(entry.scrollId) > 0
        : false;
    }
    if (typeof isPotentialScrollConsumeEntry === 'function' && isPotentialScrollConsumeEntry(entry)) {
      return typeof getPlayerPotentialScrollCount === 'function'
        ? getPlayerPotentialScrollCount(entry.scrollId) > 0
        : false;
    }
    if (entry.type === T.CUBE || entry.type === 'cube') {
      return typeof getPlayerCubeCount === 'function' ? getPlayerCubeCount(entry.cubeId) > 0 : false;
    }
    if (entry.type === T.ADD_CUBE || entry.type === 'add_cube') {
      return typeof getPlayerAddPotCubeCount === 'function' ? getPlayerAddPotCubeCount(entry.cubeId) > 0 : false;
    }
    if (entry.type === T.HAMMER || entry.type === 'hammer') {
      return typeof getPlayerHammerCount === 'function' ? getPlayerHammerCount(entry.hammerId) > 0 : false;
    }
    if (entry.type === T.GLORY_SCROLL || entry.type === 'glory_scroll') {
      return typeof getPlayerGloryScrollCount === 'function' ? getPlayerGloryScrollCount(entry.scrollId) > 0 : false;
    }
    if (entry.type === T.BONUS_STAT || entry.type === 'bonus_stat') {
      return typeof getPlayerBonusStatItemCount === 'function' ? getPlayerBonusStatItemCount(entry.itemId) > 0 : false;
    }
    if (entry.type === T.EXCEPTIONAL_HAMMER || entry.type === 'exceptional_hammer') {
      return typeof getPlayerExceptionalHammerCount === 'function'
        ? getPlayerExceptionalHammerCount(entry.hammerId) > 0
        : false;
    }
    if (entry.type === T.SOUL || entry.type === 'soul') {
      return typeof getPlayerSoulMaterialCount === 'function' ? getPlayerSoulMaterialCount(entry.soulId) > 0 : false;
    }
    if (entry.type === T.RECOVERY_CARD || entry.type === 'recovery_card') {
      return Math.max(0, Math.floor(Number(typeof playerRecoveryCardCount !== 'undefined' ? playerRecoveryCardCount : 0) || 0)) > 0;
    }
    if (entry.type === T.POTION || entry.type === 'potion') {
      return typeof getPlayerPotionCount === 'function' ? getPlayerPotionCount(entry.itemId) > 0 : false;
    }
    return false;
  }

  function getConsumeEntryCount(entry) {
    if (!entry) return 0;
    const T = typeof CONSUME_ITEM_TYPE !== 'undefined' ? CONSUME_ITEM_TYPE : {};
    if (typeof isStarForceScrollConsumeEntry === 'function' && isStarForceScrollConsumeEntry(entry)) {
      return typeof getPlayerStarForceScrollCount === 'function' ? getPlayerStarForceScrollCount(entry.scrollId) : 0;
    }
    if (typeof isPotentialScrollConsumeEntry === 'function' && isPotentialScrollConsumeEntry(entry)) {
      return typeof getPlayerPotentialScrollCount === 'function' ? getPlayerPotentialScrollCount(entry.scrollId) : 0;
    }
    if (entry.type === T.CUBE || entry.type === 'cube') {
      return typeof getPlayerCubeCount === 'function' ? getPlayerCubeCount(entry.cubeId) : 0;
    }
    if (entry.type === T.ADD_CUBE || entry.type === 'add_cube') {
      return typeof getPlayerAddPotCubeCount === 'function' ? getPlayerAddPotCubeCount(entry.cubeId) : 0;
    }
    if (entry.type === T.HAMMER || entry.type === 'hammer') {
      return typeof getPlayerHammerCount === 'function' ? getPlayerHammerCount(entry.hammerId) : 0;
    }
    if (entry.type === T.GLORY_SCROLL || entry.type === 'glory_scroll') {
      return typeof getPlayerGloryScrollCount === 'function' ? getPlayerGloryScrollCount(entry.scrollId) : 0;
    }
    if (entry.type === T.BONUS_STAT || entry.type === 'bonus_stat') {
      return typeof getPlayerBonusStatItemCount === 'function' ? getPlayerBonusStatItemCount(entry.itemId) : 0;
    }
    if (entry.type === T.EXCEPTIONAL_HAMMER || entry.type === 'exceptional_hammer') {
      return typeof getPlayerExceptionalHammerCount === 'function' ? getPlayerExceptionalHammerCount(entry.hammerId) : 0;
    }
    if (entry.type === T.SOUL || entry.type === 'soul') {
      return typeof getPlayerSoulMaterialCount === 'function' ? getPlayerSoulMaterialCount(entry.soulId) : 0;
    }
    if (entry.type === T.RECOVERY_CARD || entry.type === 'recovery_card') {
      return Math.max(0, Math.floor(Number(typeof playerRecoveryCardCount !== 'undefined' ? playerRecoveryCardCount : 0) || 0));
    }
    if (entry.type === T.POTION || entry.type === 'potion') {
      return typeof getPlayerPotionCount === 'function' ? getPlayerPotionCount(entry.itemId) : 0;
    }
    return 0;
  }

  function takeConsumeStock(entry, amount = 1) {
    const amt = Math.max(1, Math.floor(Number(amount) || 1));
    if (!entry || getConsumeEntryCount(entry) < amt) return false;
    const T = typeof CONSUME_ITEM_TYPE !== 'undefined' ? CONSUME_ITEM_TYPE : {};

    if (typeof isStarForceScrollConsumeEntry === 'function' && isStarForceScrollConsumeEntry(entry)) {
      return typeof consumeStarForceScroll === 'function' && consumeStarForceScroll(entry.scrollId, amt);
    }
    if (typeof isPotentialScrollConsumeEntry === 'function' && isPotentialScrollConsumeEntry(entry)) {
      return typeof consumePotentialScroll === 'function' && consumePotentialScroll(entry.scrollId, amt);
    }
    if (entry.type === T.CUBE || entry.type === 'cube') {
      const c = typeof getPlayerCubeCount === 'function' ? getPlayerCubeCount(entry.cubeId) : 0;
      if (c < amt || typeof playerCubeCounts === 'undefined') return false;
      playerCubeCounts[entry.cubeId] = c - amt;
      return true;
    }
    if (entry.type === T.ADD_CUBE || entry.type === 'add_cube') {
      const c = typeof getPlayerAddPotCubeCount === 'function' ? getPlayerAddPotCubeCount(entry.cubeId) : 0;
      if (c < amt || typeof playerAddPotCubeCounts === 'undefined') return false;
      playerAddPotCubeCounts[entry.cubeId] = c - amt;
      return true;
    }
    if (entry.type === T.HAMMER || entry.type === 'hammer') {
      return typeof consumePlayerHammer === 'function' && consumePlayerHammer(entry.hammerId, amt);
    }
    if (entry.type === T.GLORY_SCROLL || entry.type === 'glory_scroll') {
      return typeof consumeGloryScroll === 'function' && consumeGloryScroll(entry.scrollId, amt);
    }
    if (entry.type === T.BONUS_STAT || entry.type === 'bonus_stat') {
      return typeof consumePlayerBonusStatItem === 'function' && consumePlayerBonusStatItem(entry.itemId, amt);
    }
    if (entry.type === T.EXCEPTIONAL_HAMMER || entry.type === 'exceptional_hammer') {
      return typeof consumePlayerExceptionalHammer === 'function' && consumePlayerExceptionalHammer(entry.hammerId, amt);
    }
    if (entry.type === T.SOUL || entry.type === 'soul') {
      return typeof consumePlayerSoulMaterial === 'function' && consumePlayerSoulMaterial(entry.soulId, amt);
    }
    if (entry.type === T.RECOVERY_CARD || entry.type === 'recovery_card') {
      const c = Math.max(0, Math.floor(Number(typeof playerRecoveryCardCount !== 'undefined' ? playerRecoveryCardCount : 0) || 0));
      if (c < amt) return false;
      playerRecoveryCardCount = c - amt;
      return true;
    }
    if (entry.type === T.POTION || entry.type === 'potion') {
      return typeof takePotion === 'function' && takePotion(entry.itemId, amt);
    }
    return false;
  }

  function pruneConsumeSlotIfEmpty(slotIndex) {
    const entry = playerInventoryConsume?.[slotIndex];
    if (!entry || hasConsumeEntryStock(entry)) return;
    playerInventoryConsume[slotIndex] = null;
  }

  function sellConsumeSlot(slotIndex, qty = 1) {
    if (typeof playerInventoryConsume === 'undefined') return false;
    const entry = playerInventoryConsume[slotIndex];
    const amount = Math.max(1, Math.floor(Number(qty) || 1));
    if (!entry || getConsumeEntryCount(entry) < amount) return false;
    const disp = IdleNpcShopCatalog.resolveConsumeEntryDisplay(entry);
    const consumeEntry = JSON.parse(JSON.stringify(entry));
    if (!takeConsumeStock(entry, amount)) return false;
    pruneConsumeSlotIfEmpty(slotIndex);
    const total = disp.price * amount;
    earn(total);
    pushRepurchase({
      uid: `rp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      kind: 'consume',
      itemId: consumeEntry.scrollId || consumeEntry.cubeId || consumeEntry.hammerId || consumeEntry.itemId || consumeEntry.soulId || 'consume',
      name: disp.name,
      icon: disp.icon,
      soldPrice: disp.price,
      consumeEntry,
      amount,
      soldAt: Date.now(),
    });
    if (typeof InventoryModule !== 'undefined') {
      InventoryModule.render?.();
      InventoryModule.updateSlotCount?.();
    }
    if (typeof SessionPersistenceModule !== 'undefined') SessionPersistenceModule.scheduleSave();
    selectedInvSlot = -1;
    return true;
  }

  function sellEtcSlot(slotIndex, qty = 1) {
    if (typeof playerInventoryEtc === 'undefined') return false;
    const entry = playerInventoryEtc[slotIndex];
    if (!entry) return false;
    const disp = IdleNpcShopCatalog.resolveEtcEntryDisplay(entry);
    const have = Math.max(1, Math.floor(Number(entry.amount) || 1));
    const amount = Math.min(have, Math.max(1, Math.floor(Number(qty) || 1)));
    const etcPayload = {
      itemId: entry.itemId,
      name: entry.name || disp.name,
      icon: entry.icon || disp.icon,
      desc: entry.desc || '',
    };
    if (amount >= have) {
      playerInventoryEtc[slotIndex] = null;
    } else {
      entry.amount = have - amount;
    }
    const total = disp.price * amount;
    earn(total);
    pushRepurchase({
      uid: `rp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      kind: 'etc',
      itemId: etcPayload.itemId,
      name: disp.name,
      icon: disp.icon,
      soldPrice: disp.price,
      etcPayload,
      amount,
      soldAt: Date.now(),
    });
    if (typeof InventoryModule !== 'undefined') {
      InventoryModule.render?.();
      InventoryModule.updateSlotCount?.();
    }
    if (typeof SessionPersistenceModule !== 'undefined') SessionPersistenceModule.scheduleSave();
    selectedInvSlot = -1;
    return true;
  }

  function repurchaseByUid(uid) {
    const idx = repurchaseQueue.findIndex((e) => e.uid === uid);
    if (idx < 0) return false;
    const entry = repurchaseQueue[idx];
    const cost = repurchaseTotalPrice(entry);
    if (!spend(cost)) {
      if (typeof addLog === 'function') addLog('[商店] 楓幣不足，無法再次購買。', 'log-fail');
      return false;
    }

    let ok = false;
    if (entry.kind === 'equip') {
      if (typeof InventoryModule === 'undefined' || typeof playerInventoryEquip === 'undefined') {
        earn(cost);
        return false;
      }
      const bagIdx = InventoryModule.findEmptyEquipSlot?.() ?? -1;
      if (bagIdx < 0) {
        earn(cost);
        if (typeof addLog === 'function') addLog('[商店] 裝備欄已滿。', 'log-fail');
        return false;
      }
      playerInventoryEquip[bagIdx] = entry.itemId;
      playerInventoryState[bagIdx] = entry.state
        ? {
          ...JSON.parse(JSON.stringify(entry.state)),
          itemId: entry.itemId,
          slotIndex: bagIdx,
        }
        : null;
      if (typeof playerInventory !== 'undefined' && Array.isArray(playerInventory)) {
        playerInventory.splice(0, playerInventory.length, ...playerInventoryEquip);
      }
      ok = true;
    } else if (entry.kind === 'consume') {
      const row = consumeEntryToDropRow(entry.consumeEntry, entry.amount);
      if (!row || typeof InventoryModule === 'undefined') {
        earn(cost);
        if (typeof addLog === 'function') addLog('[商店] 無法再次購買此消耗品。', 'log-fail');
        return false;
      }
      const result = InventoryModule.grantConsumeDrop(row, { silent: true, logTag: '商店' });
      if (!result?.ok) {
        earn(cost);
        if (typeof addLog === 'function') addLog('[商店] 消耗欄已滿或無法放入。', 'log-fail');
        return false;
      }
      ok = true;
    } else if (entry.kind === 'etc') {
      if (typeof InventoryModule === 'undefined') {
        earn(cost);
        return false;
      }
      const payload = entry.etcPayload || { itemId: entry.itemId };
      const result = InventoryModule.addEtcItem({
        itemId: payload.itemId || entry.itemId,
        name: payload.name || entry.name,
        icon: payload.icon || entry.icon,
        desc: payload.desc || '',
        amount: entry.amount || 1,
      }, { silent: true, logTag: '商店' });
      if (!result?.ok) {
        earn(cost);
        if (typeof addLog === 'function') addLog('[商店] 其他欄已滿。', 'log-fail');
        return false;
      }
      ok = true;
    } else {
      earn(cost);
      if (typeof addLog === 'function') addLog('[商店] 無法再次購買此物品。', 'log-fail');
      return false;
    }

    if (!ok) return false;
    repurchaseQueue.splice(idx, 1);
    persistRepurchase();
    if (typeof InventoryModule !== 'undefined') {
      InventoryModule.render?.();
      InventoryModule.updateSlotCount?.();
    }
    if (typeof addLog === 'function') {
      addLog(`[商店] 再次購買【${repurchaseLabel(entry)}】−${cost.toLocaleString('zh-TW')} 楓幣`, 'log-success');
    }
    selectedRepurchaseUid = '';
    return true;
  }

  function buildVisibleShopTabs() {
    const cats = availableBuyCategories();
    const tabs = BUY_CATEGORY_TABS
      .filter((t) => cats.includes(t.id))
      .map((t) => ({ ...t }));
    tabs.push({ ...REPURCHASE_TAB });
    return tabs.map((t, i) => ({
      ...t,
      x: SHOP_TAB_X0 + i * SHOP_TAB_DX,
    }));
  }

  function renderTabs() {
    const el = $('npcShopTabs');
    if (!el) return;
    ensureValidShopTab();
    const tabs = buildVisibleShopTabs();
    el.innerHTML = tabs.map((t) => (
      `<button type="button" class="npc-shop-tab${shopTab === t.id ? ' is-on' : ''}" data-shop-tab="${t.id}" data-x="${t.x}">${t.label}</button>`
    )).join('');
    el.querySelectorAll('[data-shop-tab]').forEach((btn) => {
      btn.addEventListener('click', () => {
        shopTab = btn.getAttribute('data-shop-tab');
        selectedBuyIndex = -1;
        selectedRepurchaseUid = '';
        hideBuyPopup();
        hideSellPopup();
        render();
      });
    });
  }

  function renderInvTabs() {
    const el = $('npcShopInvTabs');
    if (!el) return;
    el.innerHTML = INV_TABS.map((t) => (
      `<button type="button" class="npc-shop-inv-tab${invTab === t.id ? ' is-on' : ''}" data-inv-tab="${t.id}" data-x="${t.x}" data-tab-idx="${t.idx}" aria-label="${t.label}" title="${t.label}"></button>`
    )).join('');
    el.querySelectorAll('[data-inv-tab]').forEach((btn) => {
      btn.addEventListener('click', () => {
        invTab = btn.getAttribute('data-inv-tab');
        selectedInvSlot = -1;
        hideSellPopup();
        render();
      });
    });
  }

  function rowPriceHtml(price) {
    return `
      <img class="npc-shop-row-meso-icon" src="${ASSET.meso}" alt="">
      <span class="npc-shop-row-price">${Number(price).toLocaleString('zh-TW')}</span>
    `;
  }

  function renderShopList() {
    const list = $('npcShopList');
    const hint = $('npcShopHint');
    if (!list) return;
    list.innerHTML = '';

    if (isBuyCategoryTab(shopTab)) {
      const shop = currentShop();
      if (!shop) {
        if (hint) hint.textContent = '商店資料載入中…';
        return;
      }
      const buyRows = currentBuyRows();
      if (selectedBuyIndex >= buyRows.length) selectedBuyIndex = -1;
      if (hint) {
        hint.textContent = buyRows.length
          ? DEFAULT_TIP
          : '目前等級沒有可購買的商品。';
      }
      buyRows.forEach((row, i) => {
        const disp = IdleNpcShopCatalog.resolveBuyRowDisplay(row);
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `npc-shop-row${selectedBuyIndex === i ? ' is-selected' : ''}`;
        btn.innerHTML = `
          <img class="npc-shop-row-icon" src="${disp.icon}" alt="">
          <span class="npc-shop-row-name">${escapeHtml(disp.name)}</span>
          ${rowPriceHtml(disp.price)}
        `;
        tagRowTip(btn, resolveBuyRowTooltip(row));
        btn.addEventListener('click', () => {
          selectedBuyIndex = i;
          render();
          showBuyPopup();
        });
        list.appendChild(btn);
      });
      return;
    }

    if (shopTab === 'repurchase') {
      if (hint) hint.textContent = repurchaseQueue.length
        ? '點選可原價買回（裝備含強化進度）。'
        : '尚無已賣出的物品。';
      repurchaseQueue.forEach((entry) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `npc-shop-row${selectedRepurchaseUid === entry.uid ? ' is-selected' : ''}`;
        btn.innerHTML = `
          <img class="npc-shop-row-icon" src="${entry.icon || ''}" alt="">
          <span class="npc-shop-row-name">${escapeHtml(repurchaseLabel(entry))}</span>
          ${rowPriceHtml(repurchaseTotalPrice(entry))}
        `;
        tagRowTip(btn, resolveRepurchaseTooltip(entry));
        btn.addEventListener('click', () => {
          selectedRepurchaseUid = entry.uid;
          render();
          repurchaseByUid(entry.uid);
          render();
        });
        list.appendChild(btn);
      });
    }
  }

  function renderInvList() {
    const list = $('npcShopInvList');
    if (!list) return;
    list.innerHTML = '';

    if (invTab === 'equip' && typeof playerInventoryEquip !== 'undefined') {
      playerInventoryEquip.forEach((itemId, slotIndex) => {
        if (!itemId) return;
        const item = typeof ITEM_DATABASE !== 'undefined' ? ITEM_DATABASE[itemId] : null;
        const price = IdleNpcShopCatalog.getSellPrice(itemId, playerInventoryState[slotIndex]);
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `npc-shop-inv-row${selectedInvSlot === slotIndex ? ' is-selected' : ''}`;
        btn.innerHTML = `
          <img class="npc-shop-row-icon" src="${item?.icon || `images/equip/${itemId}.png`}" alt="">
          <span class="npc-shop-row-name">${escapeHtml(item?.name || itemId)}</span>
          ${rowPriceHtml(price)}
        `;
        tagRowTip(btn, { kind: 'equip', itemId, slotIndex });
        btn.addEventListener('click', () => {
          selectedInvSlot = slotIndex;
          sellEquipSlot(slotIndex);
          render();
        });
        list.appendChild(btn);
      });
      return;
    }

    if (invTab === 'consume' && typeof playerInventoryConsume !== 'undefined') {
      playerInventoryConsume.forEach((entry, slotIndex) => {
        if (!entry || !hasConsumeEntryStock(entry)) return;
        const disp = IdleNpcShopCatalog.resolveConsumeEntryDisplay(entry);
        const count = getConsumeEntryCount(entry);
        const label = count > 1 ? `${disp.name} ×${count}` : disp.name;
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `npc-shop-inv-row${selectedInvSlot === slotIndex ? ' is-selected' : ''}`;
        btn.innerHTML = `
          <img class="npc-shop-row-icon" src="${disp.icon}" alt="">
          <span class="npc-shop-row-name">${escapeHtml(label)}</span>
          ${rowPriceHtml(disp.price)}
        `;
        tagRowTip(btn, resolveConsumeEntryTooltip(entry));
        btn.addEventListener('click', () => {
          selectedInvSlot = slotIndex;
          showSellPopup('consume', slotIndex);
          render();
        });
        list.appendChild(btn);
      });
      return;
    }

    if (invTab === 'etc' && typeof playerInventoryEtc !== 'undefined') {
      playerInventoryEtc.forEach((entry, slotIndex) => {
        if (!entry) return;
        const disp = IdleNpcShopCatalog.resolveEtcEntryDisplay(entry);
        const count = Math.max(1, Math.floor(Number(entry.amount) || 1));
        const label = count > 1 ? `${disp.name} ×${count}` : disp.name;
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `npc-shop-inv-row${selectedInvSlot === slotIndex ? ' is-selected' : ''}`;
        btn.innerHTML = `
          <img class="npc-shop-row-icon" src="${disp.icon}" alt="">
          <span class="npc-shop-row-name">${escapeHtml(label)}</span>
          ${rowPriceHtml(disp.price)}
        `;
        tagRowTip(btn, resolveEtcEntryTooltip(entry));
        btn.addEventListener('click', () => {
          selectedInvSlot = slotIndex;
          showSellPopup('etc', slotIndex);
          render();
        });
        list.appendChild(btn);
      });
    }
  }

  function escapeHtml(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function render() {
    if (!open) return;
    ensureDom();
    hideAllShopTooltips();
    const shop = currentShop();
    const title = $('npcShopTitle');
    if (title) title.textContent = shop?.name || '商店';
    const meso = $('npcShopMeso');
    if (meso) meso.textContent = formatShopMeso(gold());
    ensureShopPaperdoll();
    renderTabs();
    renderInvTabs();
    renderShopList();
    renderInvList();
  }

  function setOpen(next) {
    ensureDom();
    open = !!next;
    const root = $('npcShopRoot');
    root?.classList.toggle('hidden', !open);
    if (open) {
      if (typeof GeneratedEquipLoader !== 'undefined') GeneratedEquipLoader.register?.();
      shopTab = availableBuyCategories()[0] || 'repurchase';
      selectedBuyIndex = -1;
      hideBuyPopup();
      hideSellPopup();
      render();
      if (typeof PanelDrag !== 'undefined') PanelDrag.bringFront($('npcShopShell'));
      // 開啟後再 mount 一次，確保 clientWidth／Height 正確
      requestAnimationFrame(() => ensureShopPaperdoll());
    } else {
      hideAllShopTooltips();
    }
    if (typeof IdleHunt !== 'undefined') IdleHunt.syncBlockingPanelPause?.();
  }

  function toggle() {
    setOpen(!open);
  }

  function init() {
    if (inited) return;
    inited = true;
    ensureDom();
  }

  return {
    init,
    setOpen,
    toggle,
    isOpen: () => open,
    closeByEsc,
    render,
    exportRepurchase,
    importRepurchase,
    clearRepurchase() {
      repurchaseQueue = [];
      persistRepurchase();
    },
  };
})();

if (typeof window !== 'undefined') {
  window.UiNpcShop = UiNpcShop;
  window.addEventListener('DOMContentLoaded', () => UiNpcShop.init());
}
