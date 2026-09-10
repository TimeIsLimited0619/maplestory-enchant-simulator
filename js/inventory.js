/**
 * InventoryModule - 背包 UI（分頁 / 128 格 / 滾輪 / min-full）
 */
const InventoryModule = {
  mode: 'min',
  tab: 'equip',
  scrollTop: 0,
  draggingThumb: false,
  dragStartY: 0,
  dragStartScroll: 0,
  /** 潛能卷使用中：等待點選裝備 */
  pendingPotentialScrollId: null,
  /** 物品欄開關（頂部選單） */
  panelOpen: false,
  /** 分解中心點選中：equip | scroll | null */
  disassemblePick: null,
  /** 鎖定模式：null | 'slot' | 'item' */
  lockMode: null,
  _renderRaf: 0,

  SLOT_COUNT: INVENTORY_SLOT_COUNT,
  /** 小背包：4 欄 × 32 列 */
  COLS: 4,
  ROWS: 32,
  /** 大背包：4 個 4×8 區塊橫向排列 → 16 欄 × 8 列 */
  FULL_COLS: 16,
  FULL_ROWS: 8,
  BLOCK_SIZE: 32,
  SLOT_SIZE: 42,
  ITEM_SIZE: 40,
  GAP: 4,
  VISIBLE_ROWS_MIN: 8,

  rowStride() {
    return this.SLOT_SIZE + this.GAP;
  },

  gridHeight(rows) {
    return rows * this.rowStride() - this.GAP;
  },

  getInventory() {
    if (this.tab === 'consume') return playerInventoryConsume;
    if (this.tab === 'etc') return playerInventoryEtc;
    return playerInventoryEquip;
  },

  init() {
    this.bindEvents();
    this.bindPanelControls();
    this.bindPotentialScrollUseGuards();
    this.bindLockModeGuards();
    this.ensureConsumeTooltip();
    if (typeof ensurePotentialScrollConsumeInventory === 'function') {
      ensurePotentialScrollConsumeInventory();
    }
    if (typeof stripLegacyStarterPotentialsFromInventory === 'function') {
      stripLegacyStarterPotentialsFromInventory();
    }
    this.syncTabUi();
    this.syncLockButtons();
    this.render();
    this.updateSlotCount();
    this.updateMesoDisplay();
    this.updateScroll();
    this.setOpen(this.panelOpen);
  },

  bindEvents() {
    const panel = document.getElementById('inventoryPanel');
    const viewport = document.getElementById('invViewport');
    const track = document.getElementById('invScrollTrack');
    const thumb = document.getElementById('invScrollThumb');

    document.getElementById('invBtnFull')?.addEventListener('click', () => this.setMode('full'));
    document.getElementById('invBtnMin')?.addEventListener('click', () => this.setMode('min'));
    document.getElementById('invBtnSortEquip')?.addEventListener('click', () => this.sortCurrentInventory());

    document.getElementById('invBtnSlotLock')?.addEventListener('click', () => this.setLockMode('slot'));
    document.getElementById('invBtnSlotLockActive')?.addEventListener('click', () => this.clearLockMode());
    document.getElementById('invBtnItemLock')?.addEventListener('click', () => this.setLockMode('item'));
    document.getElementById('invBtnItemLockActive')?.addEventListener('click', () => this.clearLockMode());

    document.getElementById('invBtnUpgrade')?.addEventListener('click', () => {
      if (typeof UiEquipModule !== 'undefined') UiEquipModule.toggleEnchant?.();
    });
    document.getElementById('invBtnEquip')?.addEventListener('click', () => {
      if (typeof UiEquipModule !== 'undefined') UiEquipModule.toggleEquip?.();
    });
    document.getElementById('invBtnShop')?.addEventListener('click', () => {
      if (typeof UiNpcShop !== 'undefined') UiNpcShop.toggle?.();
      else if (typeof addLog === 'function') addLog('[背包] 商店尚未載入。', 'log-fail');
    });
    document.getElementById('invBtnSuccession')?.addEventListener('click', () => {
      if (typeof UiToadsHammer !== 'undefined') UiToadsHammer.toggle?.();
      else if (typeof addLog === 'function') addLog('[背包] 裝備繼承尚未載入。', 'log-fail');
    });

    document.getElementById('invBtnTrunk')?.addEventListener('click', () => {
      if (typeof TrunkModule !== 'undefined') TrunkModule.toggle();
      else if (typeof addLog === 'function') addLog('[背包] 倉庫尚未載入。', 'log-fail');
    });

    // AutoBuild 其餘按鈕：版面已上，功能待實作
    const stubIds = [
      'invBtnFilter', 'invBtnFilterApplied',
      'invBtnMeso',
      'invBtnItemAlchemy',
      'invBtnHelp', 'invBtnBossReward', 'invBtnBag',
      'invBtnSearch', 'invBtnSearchCancel',
    ];
    stubIds.forEach((id) => {
      document.getElementById(id)?.addEventListener('click', () => {
        if (typeof addLog === 'function') {
          addLog('[背包] 此按鈕功能尚未實作。', 'log-info');
        }
      });
    });

    document.querySelectorAll('.inv-tab').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (btn.getAttribute('data-stub') === '1') {
          if (typeof addLog === 'function') {
            addLog('[背包] 此分頁尚未實作。', 'log-info');
          }
          return;
        }
        const tab = btn.dataset.tab;
        if (tab) this.setTab(tab);
      });
    });

    viewport?.addEventListener('wheel', (e) => this.onWheel(e), { passive: false });

    track?.addEventListener('mousedown', (e) => this.onTrackMouseDown(e));
    thumb?.addEventListener('mousedown', (e) => this.onThumbMouseDown(e));
    window.addEventListener('mousemove', (e) => this.onThumbMouseMove(e));
    window.addEventListener('mouseup', () => this.onThumbMouseUp());
    this.bindDisassemblePick();
  },

  bindPotentialScrollUseGuards() {
    if (this._potentialScrollGuardsBound) return;
    this._potentialScrollGuardsBound = true;

    document.addEventListener('contextmenu', (event) => {
      if (!this.pendingPotentialScrollId) return;
      event.preventDefault();
      this.cancelPotentialScrollUse();
      if (typeof addLog === 'function') {
        addLog('[消耗] 已取消使用潛在能力卷軸。', 'log-info');
      }
    });

    const dropZone = document.getElementById('equipDropZone');
    dropZone?.addEventListener('click', (event) => {
      if (!this.pendingPotentialScrollId || !currentEnchantItem) return;
      event.preventDefault();
      event.stopPropagation();
      const itemId = currentEnchantItem.itemId || currentEnchantItem.id;
      this.applyPendingPotentialScrollToEquip(itemId, -1);
    });
  },

  bindLockModeGuards() {
    if (this._lockModeGuardsBound) return;
    this._lockModeGuardsBound = true;

    document.addEventListener('pointerdown', (event) => {
      if (!this.lockMode) return;
      if (event.button !== 0) return;
      const t = event.target;
      if (!(t instanceof Element)) return;
      if (t.closest('#invBtnSlotLock, #invBtnSlotLockActive, #invBtnItemLock, #invBtnItemLockActive')) {
        return;
      }
      if (t.closest('.ms-inv-slot')) return;
      this.clearLockMode();
    }, true);
  },

  /** 位置鎖定跟著道具（非格子） */
  isSlotLocked(slotIndex, tab = this.tab) {
    if (!Number.isInteger(slotIndex) || slotIndex < 0) return false;
    if (tab === 'equip') {
      if (typeof playerInventoryEquip === 'undefined' || !playerInventoryEquip[slotIndex]) {
        return false;
      }
      return Boolean(playerInventoryState?.[slotIndex]?.slotLocked);
    }
    const inventory = tab === 'consume'
      ? (typeof playerInventoryConsume !== 'undefined' ? playerInventoryConsume : null)
      : (typeof playerInventoryEtc !== 'undefined' ? playerInventoryEtc : null);
    const entry = inventory?.[slotIndex];
    return Boolean(entry && typeof entry === 'object' && entry.slotLocked);
  },

  isEquipItemLocked(slotIndex) {
    if (!Number.isInteger(slotIndex) || slotIndex < 0) return false;
    if (typeof playerInventoryEquip === 'undefined' || !playerInventoryEquip[slotIndex]) {
      return false;
    }
    return Boolean(playerInventoryState?.[slotIndex]?.itemLocked);
  },

  isEquipEntryLocked(entry) {
    return Boolean(entry?.state?.itemLocked || entry?.itemLocked);
  },

  syncLockButtons() {
    const slotOn = this.lockMode === 'slot';
    const itemOn = this.lockMode === 'item';
    document.getElementById('invBtnSlotLock')?.classList.toggle('hidden', slotOn);
    document.getElementById('invBtnSlotLockActive')?.classList.toggle('hidden', !slotOn);
    document.getElementById('invBtnItemLock')?.classList.toggle('hidden', itemOn);
    document.getElementById('invBtnItemLockActive')?.classList.toggle('hidden', !itemOn);
  },

  setLockMode(mode) {
    if (mode !== 'slot' && mode !== 'item') return;
    if (this.lockMode === mode) {
      this.clearLockMode();
      return;
    }

    if (this.pendingPotentialScrollId) this.cancelPotentialScrollUse();
    if (this.disassemblePick) this.setDisassemblePick(null);

    this.lockMode = mode;
    document.body.classList.toggle('inv-slot-lock-mode', mode === 'slot');
    document.body.classList.toggle('inv-item-lock-mode', mode === 'item');
    this.syncLockButtons();

    if (typeof addLog === 'function') {
      addLog(
        mode === 'slot'
          ? '[背包] 格子鎖定：點選道具以固定／解除位置，點空白處結束。'
          : '[背包] 便利鎖定：點選裝備以鎖定／解除，點空白處結束。',
        'log-info'
      );
    }
  },

  clearLockMode() {
    if (!this.lockMode) return;
    this.lockMode = null;
    document.body.classList.remove('inv-slot-lock-mode', 'inv-item-lock-mode');
    this.syncLockButtons();
  },

  toggleSlotLockAt(slotIndex) {
    if (!Number.isInteger(slotIndex) || slotIndex < 0) return;
    const inventory = this.getInventory();
    const entry = inventory?.[slotIndex];
    if (!entry) return;

    let nextLocked = false;
    if (this.tab === 'equip') {
      const itemId = entry;
      let state = playerInventoryState[slotIndex];
      if (!state || state.itemId !== itemId) {
        state = typeof loadEnchantStateForSlot === 'function'
          ? loadEnchantStateForSlot(itemId, slotIndex)
          : { itemId, slotLocked: false };
      }
      if (!state) return;
      state.slotLocked = !state.slotLocked;
      nextLocked = state.slotLocked;
      if (typeof saveInventoryItemState === 'function') {
        saveInventoryItemState(slotIndex, state);
      } else {
        playerInventoryState[slotIndex] = state;
      }
    } else if (typeof entry === 'object') {
      entry.slotLocked = !entry.slotLocked;
      nextLocked = entry.slotLocked;
      if (typeof SessionPersistenceModule !== 'undefined') {
        SessionPersistenceModule.scheduleSave();
      }
    } else {
      return;
    }

    this.render();
    if (typeof addLog === 'function') {
      addLog(
        nextLocked ? '[背包] 已固定道具位置。' : '[背包] 已解除位置固定。',
        'log-info'
      );
    }
  },

  toggleItemLockAt(slotIndex) {
    if (this.tab !== 'equip') {
      if (typeof addLog === 'function') {
        addLog('[背包] 便利鎖定僅能用於裝備。', 'log-fail');
      }
      return;
    }
    if (!Number.isInteger(slotIndex) || slotIndex < 0) return;
    const itemId = playerInventoryEquip?.[slotIndex];
    if (!itemId) return;

    let state = playerInventoryState[slotIndex];
    if (!state || state.itemId !== itemId) {
      state = typeof loadEnchantStateForSlot === 'function'
        ? loadEnchantStateForSlot(itemId, slotIndex)
        : { itemId, itemLocked: false };
    }
    if (!state) return;

    state.itemLocked = !state.itemLocked;
    if (typeof saveInventoryItemState === 'function') {
      saveInventoryItemState(slotIndex, state);
    } else {
      playerInventoryState[slotIndex] = state;
    }

    this.render();
    if (typeof addLog === 'function') {
      addLog(
        state.itemLocked
          ? '[背包] 已便利鎖定裝備（無法販售、強化、分解、進階消耗）。'
          : '[背包] 已解除便利鎖定。',
        'log-info'
      );
    }
  },

  handleSlotLockClick(slotIndex) {
    if (!this.lockMode) return false;
    const inventory = this.getInventory();
    const entry = inventory?.[slotIndex] ?? null;

    if (!entry) {
      this.clearLockMode();
      return true;
    }

    if (this.lockMode === 'slot') {
      this.toggleSlotLockAt(slotIndex);
      return true;
    }

    if (this.lockMode === 'item') {
      this.toggleItemLockAt(slotIndex);
      return true;
    }
    return false;
  },

  applyLockOverlays(slot, slotIndex) {
    if (!slot) return;
    if (this.isSlotLocked(slotIndex)) {
      const bar = document.createElement('img');
      bar.className = 'inv-sortlock-icon';
      bar.src = 'images/iventory/sortlock.png';
      bar.alt = '';
      bar.draggable = false;
      slot.appendChild(bar);
    }
    if (this.tab === 'equip' && this.isEquipItemLocked(slotIndex)) {
      const frame = slot.querySelector('.inv-item-frame') || slot;
      const icon = document.createElement('img');
      icon.className = 'inv-itemlock-icon';
      icon.src = 'images/iventory/itemlock.png';
      icon.alt = '';
      icon.draggable = false;
      frame.appendChild(icon);
    }
  },

  ensureConsumeTooltip() {
    if (document.getElementById('invConsumeTooltip')) return;
    const el = document.createElement('div');
    el.id = 'invConsumeTooltip';
    el.className = 'inv-consume-tooltip hidden';
    el.setAttribute('aria-hidden', 'true');
    el.innerHTML = '<img id="invConsumeTooltipImg" class="inv-consume-tooltip-img" alt="">';
    document.body.appendChild(el);
  },

  showConsumeTooltip(anchorEl, hoverSrc) {
    this.ensureConsumeTooltip();
    const tip = document.getElementById('invConsumeTooltip');
    const img = document.getElementById('invConsumeTooltipImg');
    if (!tip || !img || !hoverSrc || !anchorEl) return;

    this._consumeTooltipToken = (this._consumeTooltipToken || 0) + 1;
    const token = this._consumeTooltipToken;
    this._consumeTooltipAnchor = anchorEl;
    if (typeof HoverTooltipGuard !== 'undefined') {
      HoverTooltipGuard.watch('inv-consume', anchorEl, { hide: () => this.hideConsumeTooltip() });
    }

    const place = () => {
      if (token !== this._consumeTooltipToken) return;
      if (!anchorEl.isConnected) return;
      const rect = anchorEl.getBoundingClientRect();
      if (!rect.width && !rect.height) return;

      tip.style.left = '-9999px';
      tip.style.top = '0px';
      tip.classList.remove('hidden');
      tip.setAttribute('aria-hidden', 'false');

      const tipW = tip.offsetWidth || img.naturalWidth || 290;
      const tipH = tip.offsetHeight || img.naturalHeight || 120;
      let left = rect.right + 8;
      let top = rect.top;
      if (left + tipW > window.innerWidth - 8) {
        left = Math.max(8, rect.left - tipW - 8);
      }
      if (top + tipH > window.innerHeight - 8) {
        top = Math.max(8, window.innerHeight - tipH - 8);
      }
      if (top < 8) top = 8;
      tip.style.left = `${left}px`;
      tip.style.top = `${top}px`;
    };

    img.onload = null;
    img.onerror = null;

    const afterReady = () => {
      if (token !== this._consumeTooltipToken) return;
      requestAnimationFrame(place);
    };

    if (img.getAttribute('src') === hoverSrc && img.complete && img.naturalWidth) {
      afterReady();
    } else {
      img.onload = () => {
        img.onload = null;
        afterReady();
      };
      img.onerror = () => {
        img.onerror = null;
        this.hideConsumeTooltip();
      };
      img.src = hoverSrc;
      tip.classList.remove('hidden');
      tip.setAttribute('aria-hidden', 'false');
      if (img.complete && img.naturalWidth) afterReady();
    }
  },

  hideConsumeTooltip() {
    if (typeof HoverTooltipGuard !== 'undefined') HoverTooltipGuard.unwatch('inv-consume');
    this._consumeTooltipToken = (this._consumeTooltipToken || 0) + 1;
    this._consumeTooltipAnchor = null;
    const tip = document.getElementById('invConsumeTooltip');
    const img = document.getElementById('invConsumeTooltipImg');
    if (img) {
      img.onload = null;
      img.onerror = null;
    }
    if (!tip) return;
    tip.classList.add('hidden');
    tip.setAttribute('aria-hidden', 'true');
    tip.style.removeProperty('left');
    tip.style.removeProperty('top');
  },

  ensureEtcTooltip() {
    if (document.getElementById('invEtcTooltip')) return;
    const el = document.createElement('div');
    el.id = 'invEtcTooltip';
    el.className = 'eq-tooltip inv-etc-tooltip hidden';
    el.setAttribute('aria-hidden', 'true');
    document.body.appendChild(el);
  },

  formatEtcDescHtml(text) {
    const raw = String(text || '（尚無物品描述）');
    const escaped = raw
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    const marked = escaped.replace(/\*\*(.+?)\*\*/g, '<span class="inv-etc-em">$1</span>');
    const keys = ['永恆', '神秘', '太初', '聖者', '暴君', '米特拉', '濃姬', '漆黑', '覺醒'];
    let html = marked;
    keys.forEach((key) => {
      html = html.split(`<span class="inv-etc-em">${key}</span>`).join(`\u0000${key}\u0001`);
      html = html.split(key).join(`<span class="inv-etc-em">${key}</span>`);
      html = html.split(`\u0000${key}\u0001`).join(`<span class="inv-etc-em">${key}</span>`);
    });
    return html.replace(/\n/g, '<br>');
  },

  showPotionTooltip(anchorEl, potion) {
    if (!potion || !anchorEl) return;
    this.ensureEtcTooltip();
    const tip = document.getElementById('invEtcTooltip');
    if (!tip) return;
    this._etcTooltipToken = (this._etcTooltipToken || 0) + 1;
    const token = this._etcTooltipToken;
    this._etcTooltipAnchor = anchorEl;
    if (typeof HoverTooltipGuard !== 'undefined') {
      HoverTooltipGuard.watch('inv-etc', anchorEl, { hide: () => this.hideEtcTooltip() });
    }
    tip.innerHTML = typeof IdlePotionStore !== 'undefined'
      ? IdlePotionStore.buildTooltipHtml(potion)
      : this.buildEtcTooltipHtml(potion.name, potion.desc, IdlePotionStore?.resolveIcon?.(potion.icon));
    tip.classList.remove('hidden');
    tip.setAttribute('aria-hidden', 'false');
    this.placeEtcTooltip(anchorEl);
    const iconEl = tip.querySelector('.eq-tip-icon');
    if (iconEl) {
      const applyScale = () => {
        if (token !== this._etcTooltipToken) return;
        if (!iconEl.naturalWidth) return;
        iconEl.style.width = `${Math.round(iconEl.naturalWidth * 2)}px`;
        iconEl.style.height = `${Math.round(iconEl.naturalHeight * 2)}px`;
        this.placeEtcTooltip(anchorEl);
      };
      if (iconEl.complete) applyScale();
      else iconEl.addEventListener('load', applyScale, { once: true });
    }
    requestAnimationFrame(() => {
      if (token !== this._etcTooltipToken) return;
      this.placeEtcTooltip(anchorEl);
    });
  },

  resolveEtcCatalog(itemId) {
    const id = String(itemId || '').trim();
    if (!id) return null;
    return typeof IdleEtcStore !== 'undefined' ? IdleEtcStore.get(id) : null;
  },

  buildEtcTooltipHtml(name, desc, icon) {
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
    const safeName = String(name || '其他')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    const iconSrc = String(icon || '').replace(/"/g, '&quot;');
    return `
      <div class="eq-tooltip-frame inv-etc-frame">
        <div class="eq-tooltip-frame-top"${topBg}></div>
        <div class="eq-tooltip-mid-wrap">
          <div class="eq-tooltip-frame-mid"${midBg}></div>
          <div class="eq-tooltip-body">
            <div class="eq-tooltip-content">
              <div class="eq-tip-name-row">
                <div class="eq-tip-name">${safeName}</div>
              </div>
              <div class="eq-tip-dotline"${lineStyle}></div>
              <div class="inv-etc-main">
                <div class="eq-tip-icon-wrap">
                  ${baseSrc ? `<img class="eq-tip-icon-base" src="${baseSrc}" alt="">` : ''}
                  ${shadeSrc ? `<img class="eq-tip-icon-shade" src="${shadeSrc}" alt="">` : ''}
                  ${iconSrc ? `<img class="eq-tip-icon" src="${iconSrc}" alt="">` : ''}
                </div>
                <div class="inv-etc-desc">${this.formatEtcDescHtml(desc)}</div>
              </div>
            </div>
          </div>
        </div>
        <div class="eq-tooltip-frame-btm"${btmBg}></div>
      </div>
    `;
  },

  placeEtcTooltip(anchorEl) {
    const tip = document.getElementById('invEtcTooltip');
    if (!tip || !anchorEl?.isConnected) return;
    const rect = anchorEl.getBoundingClientRect();
    const tipW = tip.offsetWidth || 261;
    const tipH = tip.offsetHeight || 120;
    let left = rect.right + 8;
    let top = rect.top;
    if (left + tipW > window.innerWidth - 8) left = Math.max(8, rect.left - tipW - 8);
    if (top + tipH > window.innerHeight - 8) top = Math.max(8, window.innerHeight - tipH - 8);
    if (top < 8) top = 8;
    tip.style.left = `${left}px`;
    tip.style.top = `${top}px`;
  },

  showEtcTooltip(anchorEl, name, desc, icon) {
    this.ensureEtcTooltip();
    const tip = document.getElementById('invEtcTooltip');
    if (!tip || !anchorEl) return;
    this._etcTooltipToken = (this._etcTooltipToken || 0) + 1;
    const token = this._etcTooltipToken;
    this._etcTooltipAnchor = anchorEl;
    if (typeof HoverTooltipGuard !== 'undefined') {
      HoverTooltipGuard.watch('inv-etc', anchorEl, { hide: () => this.hideEtcTooltip() });
    }
    tip.innerHTML = this.buildEtcTooltipHtml(name, desc, icon);
    tip.classList.remove('hidden');
    tip.setAttribute('aria-hidden', 'false');
    this.placeEtcTooltip(anchorEl);
    const iconEl = tip.querySelector('.eq-tip-icon');
    if (iconEl) {
      const applyScale = () => {
        if (token !== this._etcTooltipToken) return;
        if (!iconEl.naturalWidth) return;
        iconEl.style.width = `${Math.round(iconEl.naturalWidth * 2)}px`;
        iconEl.style.height = `${Math.round(iconEl.naturalHeight * 2)}px`;
        this.placeEtcTooltip(anchorEl);
      };
      if (iconEl.complete) applyScale();
      else iconEl.addEventListener('load', applyScale, { once: true });
    }
    requestAnimationFrame(() => {
      if (token !== this._etcTooltipToken) return;
      this.placeEtcTooltip(anchorEl);
    });
  },

  hideEtcTooltip() {
    if (typeof HoverTooltipGuard !== 'undefined') HoverTooltipGuard.unwatch('inv-etc');
    this._etcTooltipToken = (this._etcTooltipToken || 0) + 1;
    this._etcTooltipAnchor = null;
    const tip = document.getElementById('invEtcTooltip');
    if (!tip) return;
    tip.classList.add('hidden');
    tip.setAttribute('aria-hidden', 'true');
  },

  setMode(mode) {
    if (this.mode === mode) return;
    this.mode = mode;
    this.scrollTop = 0;

    const panel = document.getElementById('inventoryPanel');
    panel?.classList.toggle('inv-mode-min', mode === 'min');
    panel?.classList.toggle('inv-mode-full', mode === 'full');

    document.getElementById('invBtnFull')?.classList.toggle('hidden', mode === 'full');
    document.getElementById('invBtnMin')?.classList.toggle('hidden', mode === 'min');
    document.getElementById('invScrollbar')?.classList.toggle('hidden', mode === 'full');

    this.render();
    this.syncTabUi();
    this.updateSlotCount();
    this.updateMesoDisplay();
    this.updateScroll();
  },

  syncTabUi() {
    const panel = document.getElementById('inventoryPanel');
    if (panel) {
      panel.classList.toggle('inv-active-equip', this.tab === 'equip');
      panel.classList.toggle('inv-active-consume', this.tab === 'consume');
      panel.classList.toggle('inv-active-etc', this.tab === 'etc');
    }

    document.getElementById('invSlotCountEquip')?.classList.toggle('hidden', this.tab !== 'equip');
    document.getElementById('invSlotCountConsume')?.classList.toggle('hidden', this.tab !== 'consume');
    document.getElementById('invSlotCountEtc')?.classList.toggle('hidden', this.tab !== 'etc');

    const sortBtn = document.getElementById('invBtnSortEquip');
    if (sortBtn) {
      const canSort = this.tab === 'equip' || this.tab === 'consume' || this.tab === 'etc';
      sortBtn.disabled = !canSort;
      const tabLabel = this.tab === 'consume' ? '消耗' : (this.tab === 'etc' ? '其他' : '裝備');
      sortBtn.setAttribute('aria-label', `整理${tabLabel}背包`);
      sortBtn.title = '依編號由小到大自動排序道具。';
    }
  },

  normalizeItemIdNum(itemId) {
    const raw = String(itemId ?? '').replace(/\D/g, '');
    if (!raw) return Number.MAX_SAFE_INTEGER;
    const n = Number(raw);
    return Number.isFinite(n) ? n : Number.MAX_SAFE_INTEGER;
  },

  entryItemId(entry) {
    if (entry == null) return '';
    if (typeof entry === 'string' || typeof entry === 'number') return String(entry).trim();
    const keys = ['itemId', 'id', 'scrollId', 'hammerId', 'cubeId', 'soulId'];
    for (const key of keys) {
      const val = entry[key];
      if (val != null && String(val).trim() !== '') return String(val).trim();
    }
    const type = String(entry.type || '').trim();
    const recoveryType = typeof CONSUME_ITEM_TYPE !== 'undefined'
      ? CONSUME_ITEM_TYPE.RECOVERY_CARD
      : 'recovery_card';
    if (type === recoveryType || type === 'recovery_card') {
      return typeof RECOVERY_CARD !== 'undefined'
        ? String(RECOVERY_CARD.id || 'recovery_card')
        : 'recovery_card';
    }
    return type;
  },

  compareEntrySortKeys(idA, idB) {
    const a = String(idA || '');
    const b = String(idB || '');
    const pureA = /^\d+$/.test(a);
    const pureB = /^\d+$/.test(b);
    if (pureA && pureB) {
      const na = this.normalizeItemIdNum(a);
      const nb = this.normalizeItemIdNum(b);
      if (na !== nb) return na - nb;
      return 0;
    }
    return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
  },

  /** 消耗品數量表是否已從存檔載入（未就緒時禁止清除占位） */
  _consumeCountsReady: false,

  markConsumeCountsReady() {
    this._consumeCountsReady = true;
    this.syncConsumeSlotsFromCounts();
    this.pruneInactiveConsumeSlots();
    if (this.tab === 'consume') {
      this.render();
      this.updateSlotCount();
    }
  },

  consumeEntryCount(entry) {
    if (!entry) return null;
    if (typeof isStarForceScrollConsumeEntry === 'function' && isStarForceScrollConsumeEntry(entry)) {
      if (typeof getPlayerStarForceScrollCount !== 'function') return null;
      return getPlayerStarForceScrollCount(entry.scrollId);
    }
    if (typeof isPotentialScrollConsumeEntry === 'function' && isPotentialScrollConsumeEntry(entry)) {
      if (typeof getPlayerPotentialScrollCount !== 'function') return null;
      return getPlayerPotentialScrollCount(entry.scrollId);
    }
    const T = typeof CONSUME_ITEM_TYPE !== 'undefined' ? CONSUME_ITEM_TYPE : {};
    if (entry.type === (T.CUBE || 'cube')) {
      if (typeof getPlayerCubeCount !== 'function') return null;
      return getPlayerCubeCount(entry.cubeId);
    }
    if (entry.type === (T.ADD_CUBE || 'add_cube')) {
      if (typeof getPlayerAddPotCubeCount !== 'function') return null;
      return getPlayerAddPotCubeCount(entry.cubeId);
    }
    if (entry.type === (T.HAMMER || 'hammer')) {
      if (typeof getPlayerHammerCount !== 'function') return null;
      return getPlayerHammerCount(entry.hammerId);
    }
    if (entry.type === (T.GLORY_SCROLL || 'glory_scroll')) {
      if (typeof getPlayerGloryScrollCount !== 'function') return null;
      return getPlayerGloryScrollCount(entry.scrollId);
    }
    if (entry.type === (T.BONUS_STAT || 'bonus_stat')) {
      if (typeof getPlayerBonusStatItemCount !== 'function') return null;
      return getPlayerBonusStatItemCount(entry.itemId);
    }
    if (entry.type === (T.EXCEPTIONAL_HAMMER || 'exceptional_hammer')) {
      if (typeof getPlayerExceptionalHammerCount !== 'function') return null;
      return getPlayerExceptionalHammerCount(entry.hammerId);
    }
    if (entry.type === (T.SOUL || 'soul')) {
      if (typeof getPlayerSoulMaterialCount !== 'function') return null;
      return getPlayerSoulMaterialCount(entry.soulId);
    }
    if (entry.type === (T.RECOVERY_CARD || 'recovery_card')) {
      if (typeof playerRecoveryCardCount === 'undefined') return null;
      return Math.max(0, Math.floor(Number(playerRecoveryCardCount) || 0));
    }
    if (entry.type === (T.POTION || 'potion')) {
      if (typeof getPlayerPotionCount !== 'function') return null;
      return getPlayerPotionCount(entry.itemId);
    }
    return null;
  },

  /** 消耗欄格內有 entry 但實際數量為 0 → 不顯示但仍占格（幽靈占位） */
  isConsumeEntryActive(entry) {
    const count = this.consumeEntryCount(entry);
    if (count == null) return true;
    return count > 0;
  },

  /** 依數量表補回缺少的消耗欄占位（占位被誤刪時可恢復顯示） */
  syncConsumeSlotsFromCounts() {
    if (typeof playerInventoryConsume === 'undefined' || typeof CONSUME_ITEM_TYPE === 'undefined') return;
    const T = CONSUME_ITEM_TYPE;

    if (typeof playerStarForceScrollInventory !== 'undefined' && typeof getPlayerStarForceScrollCount === 'function') {
      Object.keys(playerStarForceScrollInventory).forEach((scrollId) => {
        if (getPlayerStarForceScrollCount(scrollId) <= 0) return;
        this.ensureConsumeSlot(
          (e) => typeof isStarForceScrollConsumeEntry === 'function'
            && isStarForceScrollConsumeEntry(e)
            && e.scrollId === scrollId,
          () => ({ type: T.STARFORCE_SCROLL, scrollId }),
        );
      });
    }

    if (typeof ensurePotentialScrollConsumeInventory === 'function') {
      ensurePotentialScrollConsumeInventory();
    }

    if (typeof playerGloryScrollInventory !== 'undefined' && typeof getPlayerGloryScrollCount === 'function') {
      Object.keys(playerGloryScrollInventory).forEach((scrollId) => {
        if (getPlayerGloryScrollCount(scrollId) <= 0) return;
        this.ensureConsumeSlot(
          (e) => e && e.type === T.GLORY_SCROLL && e.scrollId === scrollId,
          () => ({ type: T.GLORY_SCROLL, scrollId }),
        );
      });
    }

    const syncMap = (counts, matchFn, createFn) => {
      if (!counts || typeof counts !== 'object') return;
      Object.keys(counts).forEach((id) => {
        if ((Number(counts[id]) || 0) <= 0) return;
        this.ensureConsumeSlot(matchFn(id), createFn(id));
      });
    };

    if (typeof getPlayerCubeCount === 'function') {
      syncMap(
        typeof playerCubeCounts !== 'undefined' ? playerCubeCounts : null,
        (cubeId) => (e) => e && e.type === T.CUBE && e.cubeId === cubeId,
        (cubeId) => () => ({ type: T.CUBE, cubeId }),
      );
    }
    if (typeof getPlayerAddPotCubeCount === 'function') {
      syncMap(
        typeof playerAddPotCubeCounts !== 'undefined' ? playerAddPotCubeCounts : null,
        (cubeId) => (e) => e && e.type === T.ADD_CUBE && e.cubeId === cubeId,
        (cubeId) => () => ({ type: T.ADD_CUBE, cubeId }),
      );
    }
    if (typeof getPlayerHammerCount === 'function') {
      syncMap(
        typeof playerHammerInventory !== 'undefined' ? playerHammerInventory : null,
        (hammerId) => (e) => e && e.type === T.HAMMER && e.hammerId === hammerId,
        (hammerId) => () => ({ type: T.HAMMER, hammerId }),
      );
    }
    if (typeof getPlayerBonusStatItemCount === 'function') {
      syncMap(
        typeof playerBonusStatItemCounts !== 'undefined' ? playerBonusStatItemCounts : null,
        (itemId) => (e) => e && e.type === T.BONUS_STAT && e.itemId === itemId,
        (itemId) => () => ({ type: T.BONUS_STAT, itemId }),
      );
    }
    if (typeof getPlayerExceptionalHammerCount === 'function') {
      syncMap(
        typeof playerExceptionalHammerCounts !== 'undefined' ? playerExceptionalHammerCounts : null,
        (hammerId) => (e) => e && e.type === T.EXCEPTIONAL_HAMMER && e.hammerId === hammerId,
        (hammerId) => () => ({ type: T.EXCEPTIONAL_HAMMER, hammerId }),
      );
    }
    if (typeof getPlayerSoulMaterialCount === 'function') {
      syncMap(
        typeof playerSoulMaterialCounts !== 'undefined' ? playerSoulMaterialCounts : null,
        (soulId) => (e) => e && e.type === T.SOUL && e.soulId === soulId,
        (soulId) => () => ({ type: T.SOUL, soulId }),
      );
    }

    if (typeof ensureRecoveryCardConsumeInventory === 'function') {
      ensureRecoveryCardConsumeInventory();
    }
    if (typeof IdlePotionStore !== 'undefined' && typeof getPlayerPotionCount === 'function') {
      IdlePotionStore.list().forEach((potion) => {
        if (getPlayerPotionCount(potion.id) > 0 && typeof ensurePotionConsumeInventory === 'function') {
          ensurePotionConsumeInventory(potion.id);
        }
      });
    }
  },

  /** 清除消耗欄幽靈占位（數量已歸零但 slot 仍留 entry） */
  pruneInactiveConsumeSlots() {
    if (!this._consumeCountsReady || typeof playerInventoryConsume === 'undefined') return 0;
    let removed = 0;
    for (let i = 0; i < playerInventoryConsume.length; i += 1) {
      const entry = playerInventoryConsume[i];
      if (!entry) continue;
      const count = this.consumeEntryCount(entry);
      if (count != null && count <= 0) {
        playerInventoryConsume[i] = null;
        removed += 1;
      }
    }
    return removed;
  },

  sortCurrentInventory() {
    const tab = this.tab;
    if (tab !== 'equip' && tab !== 'consume' && tab !== 'etc') return;

    if (typeof EquipTooltipModule !== 'undefined') {
      EquipTooltipModule.hide();
    }
    this.hideConsumeTooltip?.();

    if (tab === 'equip'
      && currentEnchantItem
      && typeof saveInventoryItemState === 'function'
      && Number.isInteger(currentEnchantItem.slotIndex)
      && currentEnchantItem.slotIndex >= 0) {
      saveInventoryItemState(currentEnchantItem.slotIndex, currentEnchantItem);
    }

    const inventory = this.getInventory();
    if (!Array.isArray(inventory)) return;

    if (tab === 'consume' && this._consumeCountsReady) {
      this.pruneInactiveConsumeSlots();
    }

    const entries = [];
    for (let i = 0; i < inventory.length; i++) {
      if (this.isSlotLocked(i, tab)) continue;
      const entry = inventory[i];
      if (!entry) continue;
      if (tab === 'consume' && !this.isConsumeEntryActive(entry)) continue;
      const itemId = this.entryItemId(entry);
      entries.push({
        entry,
        oldIndex: i,
        sortKey: itemId,
        state: tab === 'equip' ? (playerInventoryState[i] ?? null) : null,
      });
    }

    const tabName = tab === 'consume' ? '消耗' : (tab === 'etc' ? '其他' : '裝備');
    if (!entries.length) {
      if (typeof addLog === 'function') addLog(`[背包] 沒有可整理的${tabName}道具。`, 'log-info');
      return;
    }

    entries.sort((a, b) => {
      const cmp = this.compareEntrySortKeys(a.sortKey, b.sortKey);
      if (cmp !== 0) return cmp;
      return a.oldIndex - b.oldIndex;
    });

    // 先清空未鎖定格，鎖定格原樣保留
    for (let i = 0; i < inventory.length; i++) {
      if (this.isSlotLocked(i, tab)) continue;
      inventory[i] = null;
      if (tab === 'equip') playerInventoryState[i] = null;
    }

    let writeAt = 0;
    entries.forEach((row) => {
      while (writeAt < inventory.length && this.isSlotLocked(writeAt, tab)) writeAt += 1;
      if (writeAt >= inventory.length) return;
      inventory[writeAt] = row.entry;
      if (tab === 'equip') playerInventoryState[writeAt] = row.state;
      writeAt += 1;
    });

    if (tab === 'equip') {
      if (typeof playerInventory !== 'undefined') {
        playerInventory.splice(0, playerInventory.length, ...inventory);
      }
    } else {
      // consume / etc：陣列已就地改寫
    }

    if (typeof SessionPersistenceModule !== 'undefined') {
      SessionPersistenceModule.scheduleSave();
    }

    this.scrollTop = 0;
    this.render();
    this.updateSlotCount();
    this.updateScroll();

    if (typeof addLog === 'function') {
      addLog(`[背包] 已依編號由小到大整理${tabName}。`, 'log-info');
    }
  },

  /** @deprecated 請用 sortCurrentInventory */
  sortEquipInventory() {
    if (this.tab !== 'equip') this.setTab('equip');
    this.sortCurrentInventory();
  },

  setTab(tab) {
    if (this.tab === tab) return;
    if (typeof EquipTooltipModule !== 'undefined') {
      EquipTooltipModule.hide();
    }
    this.hideConsumeTooltip();
    this.tab = tab;
    this.scrollTop = 0;

    document.querySelectorAll('.inv-tab').forEach((btn) => {
      btn.classList.toggle('checked', btn.dataset.tab === tab);
    });

    this.syncTabUi();
    this.render();
    this.updateSlotCount();
    this.updateScroll();
    if (typeof CatValleyEnhanceModule !== 'undefined') {
      CatValleyEnhanceModule.updateButton();
    }
  },

  getFullGridPlacement(slotIndex) {
    const block = Math.floor(slotIndex / this.BLOCK_SIZE);
    const inBlock = slotIndex % this.BLOCK_SIZE;
    const row = Math.floor(inBlock / this.COLS) + 1;
    const col = block * 8 + (inBlock % this.COLS) * 2 + 1;
    return { row, col };
  },

  applySlotGridPosition(slot, slotIndex) {
    if (this.mode === 'full') {
      const { row, col } = this.getFullGridPlacement(slotIndex);
      slot.style.gridRow = String(row);
      slot.style.gridColumn = String(col);
    } else {
      slot.style.gridRow = '';
      slot.style.gridColumn = '';
    }
  },

  getItemMainPotentialRank(itemId, slotIndex) {
    if (this.tab !== 'equip') return null;

    const hasLines = (pot) => Array.isArray(pot?.lines) && pot.lines.length > 0;

    if (
      typeof currentEnchantItem !== 'undefined'
      && currentEnchantItem
      && currentEnchantItem.slotIndex === slotIndex
      && hasLines(currentEnchantItem.potential)
      && currentEnchantItem.potential?.rank
    ) {
      return currentEnchantItem.potential.rank;
    }

    const saved = playerInventoryState[slotIndex];
    if (hasLines(saved?.potential) && saved.potential.rank) {
      return saved.potential.rank;
    }

    const template = ITEM_DATABASE[itemId];
    if (hasLines(template?.potential) && template.potential.rank) {
      return template.potential.rank;
    }

    return null;
  },

  hideHoverTooltips() {
    if (typeof EquipTooltipModule !== 'undefined') {
      EquipTooltipModule.hide();
    }
    this.hideConsumeTooltip?.();
    this.hideEtcTooltip?.();
  },

  scheduleRender() {
    if (this._renderRaf) return;
    const raf = typeof requestAnimationFrame === 'function'
      ? requestAnimationFrame.bind(window)
      : (fn) => setTimeout(fn, 16);
    this._renderRaf = raf(() => {
      this._renderRaf = 0;
      this.render();
      this.updateSlotCount();
    });
  },

  render() {
    const grid = document.getElementById('inventoryGrid');
    if (!grid) return;

    grid.innerHTML = '';

    const inventory = this.getInventory();

    for (let i = 0; i < this.SLOT_COUNT; i++) {
      const slot = document.createElement('div');
      slot.className = 'ms-inv-slot';
      slot.dataset.slotIndex = i;
      slot.dataset.invTab = this.tab;

      slot.ondragover = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        slot.classList.add('inv-drag-over');
      };
      slot.ondragleave = () => slot.classList.remove('inv-drag-over');
      slot.ondrop = (e) => this.handleDrop(e, i);

      slot.addEventListener('click', (e) => {
        if (!this.lockMode) return;
        e.preventDefault();
        e.stopPropagation();
        this.handleSlotLockClick(i);
      });

      this.applySlotGridPosition(slot, i);

      const entry = inventory[i] ?? null;
      if (this.tab === 'equip') {
        this.renderEquipSlot(slot, entry, i);
      } else if (this.tab === 'consume') {
        this.renderConsumeSlot(slot, entry, i);
      } else if (this.tab === 'etc') {
        this.renderEtcSlot(slot, entry, i);
      }

      this.applyLockOverlays(slot, i);

      this.applyDisassembleSlot(slot, i, entry);
      grid.appendChild(slot);
    }

    if (currentEnchantItem && this.tab === 'equip') {
      // 強化槽已移出背包：無需再 hidden 背包格
    }
  },

  setDisassemblePick(mode) {
    const next = mode === 'equip' || mode === 'scroll' ? mode : null;
    this.disassemblePick = next;
    document.body.classList.toggle('inv-disassemble-pick', !!next);
    if (next && this.lockMode) this.clearLockMode();
    if (next && this.pendingPotentialScrollId) this.cancelPotentialScrollUse();
    if (next === 'equip' && this.tab !== 'equip') this.setTab('equip');
    else if (next === 'scroll' && this.tab !== 'consume') this.setTab('consume');
    else this.render();
  },

  applyDisassembleSlot(slot, slotIndex, entry) {
    slot.classList.remove('is-disassemble-ok', 'is-disassemble-dim');
    if (!this.disassemblePick || typeof DisassembleStore === 'undefined') return;
    const pickingEquip = this.disassemblePick === 'equip' && this.tab === 'equip';
    const pickingScroll = this.disassemblePick === 'scroll' && this.tab === 'consume';
    if (!pickingEquip && !pickingScroll) return;
    let ok = false;
    if (pickingEquip) {
      ok = !!entry && !!DisassembleStore.equipMaterials(entry) && !this.isEquipItemLocked(slotIndex);
    } else {
      const T = typeof CONSUME_ITEM_TYPE !== 'undefined' ? CONSUME_ITEM_TYPE : {};
      const scrollId = entry?.scrollId;
      const count = typeof getPlayerGloryScrollCount === 'function'
        ? getPlayerGloryScrollCount(scrollId)
        : 0;
      ok = !!(entry && entry.type === (T.GLORY_SCROLL || 'glory_scroll')
        && DisassembleStore.scrollMaterials(scrollId)
        && count > 0);
    }
    slot.classList.add(ok ? 'is-disassemble-ok' : 'is-disassemble-dim');
    if (ok) {
      const img = slot.querySelector('img');
      if (img) img.draggable = false;
    }
  },

  bindDisassemblePick() {
    if (this._disassemblePickBound) return;
    this._disassemblePickBound = true;
    const grid = document.getElementById('inventoryGrid');
    grid?.addEventListener('click', (e) => {
      if (!this.disassemblePick) return;
      const slot = e.target.closest('.ms-inv-slot');
      if (!slot || !grid.contains(slot)) return;
      if (!slot.classList.contains('is-disassemble-ok')) return;
      e.preventDefault();
      e.stopPropagation();
      const idx = Number(slot.dataset.slotIndex);
      if (typeof DisassemblePanel !== 'undefined') {
        DisassemblePanel.tryBreak(this.disassemblePick === 'scroll' ? 'scroll' : 'equip', idx, e);
      }
    }, true);
    grid?.addEventListener('dblclick', (e) => {
      if (!this.disassemblePick) return;
      if (e.target.closest('.ms-inv-slot')) {
        e.preventDefault();
        e.stopPropagation();
      }
    }, true);
  },

  renderEquipSlot(slot, itemId, slotIndex) {
    if (!itemId || typeof ITEM_DATABASE === 'undefined' || !ITEM_DATABASE[itemId]) return;

    const itemData = ITEM_DATABASE[itemId];
    const potentialRank = this.getItemMainPotentialRank(itemId, slotIndex);
    if (potentialRank) slot.classList.add(`inv-potential-${potentialRank}`);

    const itemFrame = document.createElement('div');
    itemFrame.className = 'inv-item-frame';

    const equipImg = document.createElement('img');
    equipImg.src = itemData.icon;
    equipImg.alt = itemData.name;
    equipImg.id = `inv_item_equip_${slotIndex}`;
    equipImg.draggable = true;

    equipImg.ondragstart = (e) => {
      if (this.lockMode || this.pendingPotentialScrollId) {
        e.preventDefault();
        return;
      }
      if (typeof EquipTooltipModule !== 'undefined') {
        EquipTooltipModule.beginDrag?.();
      }
      e.dataTransfer.setData('text/plain', JSON.stringify({
        slotIndex,
        itemId,
        tab: 'equip',
      }));
      e.dataTransfer.effectAllowed = 'move';
      slot.classList.add('inv-dragging');
    };
    equipImg.ondragend = () => {
      slot.classList.remove('inv-dragging');
      document.querySelectorAll('.ms-inv-slot.inv-drag-over').forEach((el) => {
        el.classList.remove('inv-drag-over');
      });
      if (typeof EquipTooltipModule !== 'undefined') {
        EquipTooltipModule.endDrag?.();
      }
    };

    equipImg.addEventListener('click', (e) => {
      if (this.lockMode) {
        e.preventDefault();
        e.stopPropagation();
        this.handleSlotLockClick(slotIndex);
        return;
      }
      if (!this.pendingPotentialScrollId) return;
      e.preventDefault();
      e.stopPropagation();
      this.applyPendingPotentialScrollToEquip(itemId, slotIndex);
    });

    equipImg.ondblclick = (e) => {
      if (this.lockMode || this.pendingPotentialScrollId) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      // 強化台開著 → 放進強化槽；否則穿到裝備欄
      if (typeof UiEquipModule !== 'undefined' && UiEquipModule.isEnchantOpen?.()) {
        loadEquipToSlot(itemId, slotIndex);
        return;
      }
      if (typeof UiEquipModule !== 'undefined' && typeof UiEquipModule.wearFromBag === 'function') {
        UiEquipModule.wearFromBag(itemId, slotIndex);
      }
    };

    itemFrame.appendChild(equipImg);
    slot.appendChild(itemFrame);
  },

  renderConsumeSlot(slot, entry, slotIndex) {
    if (typeof isStarForceScrollConsumeEntry === 'function' && isStarForceScrollConsumeEntry(entry)) {
      this.renderStarForceScrollSlot(slot, entry, slotIndex);
      return;
    }
    if (typeof isPotentialScrollConsumeEntry === 'function' && isPotentialScrollConsumeEntry(entry)) {
      this.renderPotentialScrollSlot(slot, entry, slotIndex);
      return;
    }
    if (entry && entry.type === (typeof CONSUME_ITEM_TYPE !== 'undefined' ? CONSUME_ITEM_TYPE.CUBE : 'cube')) {
      this.renderCubeConsumeSlot(slot, entry, slotIndex);
      return;
    }
    if (entry && entry.type === (typeof CONSUME_ITEM_TYPE !== 'undefined' ? CONSUME_ITEM_TYPE.ADD_CUBE : 'add_cube')) {
      this.renderAddCubeConsumeSlot(slot, entry, slotIndex);
      return;
    }
    if (entry && entry.type === (typeof CONSUME_ITEM_TYPE !== 'undefined' ? CONSUME_ITEM_TYPE.HAMMER : 'hammer')) {
      this.renderHammerConsumeSlot(slot, entry, slotIndex);
      return;
    }
    if (entry && entry.type === (typeof CONSUME_ITEM_TYPE !== 'undefined' ? CONSUME_ITEM_TYPE.GLORY_SCROLL : 'glory_scroll')) {
      this.renderGloryScrollConsumeSlot(slot, entry, slotIndex);
      return;
    }
    if (entry && entry.type === (typeof CONSUME_ITEM_TYPE !== 'undefined' ? CONSUME_ITEM_TYPE.BONUS_STAT : 'bonus_stat')) {
      this.renderBonusStatConsumeSlot(slot, entry, slotIndex);
      return;
    }
    if (entry && entry.type === (typeof CONSUME_ITEM_TYPE !== 'undefined' ? CONSUME_ITEM_TYPE.EXCEPTIONAL_HAMMER : 'exceptional_hammer')) {
      this.renderExceptionalHammerConsumeSlot(slot, entry, slotIndex);
      return;
    }
    if (entry && entry.type === (typeof CONSUME_ITEM_TYPE !== 'undefined' ? CONSUME_ITEM_TYPE.SOUL : 'soul')) {
      this.renderSoulConsumeSlot(slot, entry, slotIndex);
      return;
    }
    if (entry && entry.type === (typeof CONSUME_ITEM_TYPE !== 'undefined' ? CONSUME_ITEM_TYPE.RECOVERY_CARD : 'recovery_card')) {
      this.renderRecoveryCardConsumeSlot(slot, entry, slotIndex);
      return;
    }
    if (entry && entry.type === (typeof CONSUME_ITEM_TYPE !== 'undefined' ? CONSUME_ITEM_TYPE.POTION : 'potion')) {
      this.renderPotionConsumeSlot(slot, entry, slotIndex);
    }
  },

  renderEtcSlot(slot, entry, slotIndex) {
    if (!entry || typeof entry !== 'object') return;
    const catalog = this.resolveEtcCatalog(entry.itemId);
    const name = catalog?.name || entry.name || entry.itemId || '其他';
    const icon = catalog?.icon || entry.icon || '';
    const desc = catalog?.desc || entry.desc || '';
    const amount = Math.max(1, Math.floor(Number(entry.amount) || 1));

    const itemFrame = document.createElement('div');
    itemFrame.className = 'inv-item-frame inv-consume-frame';

    const img = document.createElement('img');
    img.src = icon;
    img.alt = name;
    img.id = `inv_item_etc_${slotIndex}`;
    img.draggable = true;
    img.title = '';
    img.onerror = () => { img.style.visibility = 'hidden'; };
    img.addEventListener('mouseenter', () => this.showEtcTooltip(img, name, desc, icon));
    img.addEventListener('mouseleave', () => this.hideEtcTooltip());
    img.ondragstart = (e) => {
      e.dataTransfer.setData('text/plain', JSON.stringify({
        slotIndex,
        tab: 'etc',
      }));
      e.dataTransfer.effectAllowed = 'move';
      slot.classList.add('inv-dragging');
    };
    img.ondragend = () => {
      slot.classList.remove('inv-dragging');
      document.querySelectorAll('.ms-inv-slot.inv-drag-over').forEach((el) => {
        el.classList.remove('inv-drag-over');
      });
    };
    itemFrame.appendChild(img);
    if (amount > 1) {
      const qty = document.createElement('span');
      qty.className = 'inv-item-count';
      qty.textContent = String(amount);
      itemFrame.appendChild(qty);
    }
    slot.appendChild(itemFrame);
  },

  renderPotentialScrollSlot(slot, entry, slotIndex) {
    const scroll = typeof getPotentialScrollById === 'function'
      ? getPotentialScrollById(entry.scrollId)
      : null;
    if (!scroll) return;

    const count = typeof getPlayerPotentialScrollCount === 'function'
      ? getPlayerPotentialScrollCount(scroll.id)
      : 0;
    if (count <= 0) return;

    if (this.pendingPotentialScrollId === scroll.id) {
      slot.classList.add('inv-slot-selected');
    }

    const itemFrame = document.createElement('div');
    itemFrame.className = 'inv-item-frame inv-consume-frame';

    const scrollImg = document.createElement('img');
    scrollImg.src = scroll.icon;
    scrollImg.alt = scroll.name;
    scrollImg.id = `inv_item_consume_${slotIndex}`;
    scrollImg.draggable = true;
    // 不用 native title，避免與自訂 hover 說明圖搶顯示／造成定位錯亂
    scrollImg.removeAttribute('title');

    scrollImg.ondragstart = (e) => {
      e.dataTransfer.setData('text/plain', JSON.stringify({
        slotIndex,
        tab: 'consume',
      }));
      e.dataTransfer.effectAllowed = 'move';
      slot.classList.add('inv-dragging');
    };
    scrollImg.ondragend = () => {
      slot.classList.remove('inv-dragging');
      document.querySelectorAll('.ms-inv-slot.inv-drag-over').forEach((el) => {
        el.classList.remove('inv-drag-over');
      });
    };

    scrollImg.addEventListener('mouseenter', () => {
      this.showConsumeTooltip(scrollImg, scroll.hover);
    });
    scrollImg.addEventListener('mouseleave', () => {
      this.hideConsumeTooltip();
    });

    scrollImg.addEventListener('dblclick', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.handlePotentialScrollDblClick(scroll.id);
    });

    itemFrame.appendChild(scrollImg);
    this.appendStackCount(itemFrame, count);
    slot.appendChild(itemFrame);
  },

  beginPotentialScrollUse(scrollId) {
    if (this.lockMode) this.clearLockMode();
    this.pendingPotentialScrollId = scrollId;
    document.body.classList.add('inv-potential-scroll-use');
    this.hideConsumeTooltip();
    if (typeof EquipTooltipModule !== 'undefined') {
      EquipTooltipModule.hide();
    }
    // 只切到背包裝備列，方便點選背包內裝備
    if (this.tab !== 'equip') {
      this.setTab('equip');
    } else {
      this.render();
    }
  },

  cancelPotentialScrollUse() {
    if (!this.pendingPotentialScrollId) return;
    this.pendingPotentialScrollId = null;
    document.body.classList.remove('inv-potential-scroll-use');
    if (this.tab === 'consume') this.render();
  },

  findEmptyEtcSlot() {
    if (typeof playerInventoryEtc === 'undefined') return -1;
    for (let i = 0; i < playerInventoryEtc.length; i++) {
      if (!playerInventoryEtc[i]) return i;
    }
    return -1;
  },

  addEtcItem(row, opts = {}) {
    if (typeof playerInventoryEtc === 'undefined') return { ok: false, name: '' };
    const itemId = String(row?.itemId || row?.id || '').trim();
    const catalog = this.resolveEtcCatalog(itemId);
    const name = String(catalog?.name || row?.name || itemId || '其他');
    const icon = String(catalog?.icon || row?.icon || '');
    const desc = String(catalog?.desc || row?.desc || '');
    const amount = Math.max(1, Math.floor(Number(row?.amount) || 1));
    if (!itemId) return { ok: false, name };

    const stack = playerInventoryEtc.find((entry) => entry && String(entry.itemId) === itemId);
    if (stack) {
      stack.amount = Math.max(1, Math.floor(Number(stack.amount) || 1)) + amount;
    } else {
      const empty = this.findEmptyEtcSlot();
      if (empty < 0) {
        if (!opts.silent && typeof addLog === 'function') {
          addLog(`[${opts.logTag || '放置'}] 其他欄已滿，無法放入【${name}】。`, 'log-fail');
        }
        return { ok: false, name };
      }
      playerInventoryEtc[empty] = { type: 'etc', itemId, name, icon, desc, amount };
    }

    if (typeof SessionPersistenceModule !== 'undefined') SessionPersistenceModule.scheduleSave();
    if (opts.switchTab && this.tab !== 'etc') this.setTab('etc');
    else if (this.tab === 'etc') {
      if (opts.silent) this.scheduleRender();
      else this.render();
    }
    this.updateSlotCount();
    if (!opts.silent && typeof addLog === 'function') {
      addLog(`[${opts.logTag || '放置'}] 已將【${name}】放入其他欄。`, 'log-success');
    }
    return { ok: true, name };
  },

  countEtc(itemId) {
    const id = String(itemId || '');
    if (!id || typeof playerInventoryEtc === 'undefined') return 0;
    return playerInventoryEtc.reduce((sum, entry) => {
      if (!entry || String(entry.itemId) !== id) return sum;
      return sum + Math.max(0, Math.floor(Number(entry.amount) || 0));
    }, 0);
  },

  takeEtc(itemId, amount = 1) {
    const id = String(itemId || '');
    let need = Math.max(1, Math.floor(Number(amount) || 1));
    if (!id || typeof playerInventoryEtc === 'undefined') return false;
    if (this.countEtc(id) < need) return false;
    for (let i = 0; i < playerInventoryEtc.length && need > 0; i++) {
      const entry = playerInventoryEtc[i];
      if (!entry || String(entry.itemId) !== id) continue;
      const have = Math.max(0, Math.floor(Number(entry.amount) || 0));
      if (have > need) {
        entry.amount = have - need;
        need = 0;
      } else {
        playerInventoryEtc[i] = null;
        need -= have;
      }
    }
    if (typeof SessionPersistenceModule !== 'undefined') SessionPersistenceModule.scheduleSave();
    if (this.tab === 'etc') this.render();
    this.updateSlotCount();
    return true;
  },

  handlePotentialScrollDblClick(scrollId) {
    const count = typeof getPlayerPotentialScrollCount === 'function'
      ? getPlayerPotentialScrollCount(scrollId)
      : 0;
    if (count <= 0) return;

    if (this.pendingPotentialScrollId === scrollId) {
      this.cancelPotentialScrollUse();
      if (typeof addLog === 'function') {
        addLog('[消耗] 已取消使用潛在能力卷軸。', 'log-info');
      }
      return;
    }

    const scroll = typeof getPotentialScrollById === 'function'
      ? getPotentialScrollById(scrollId)
      : null;
    this.beginPotentialScrollUse(scrollId);
    if (scroll && typeof addLog === 'function') {
      addLog(`[消耗] 已選擇【${scroll.name}】，請點選背包或裝備欄中的裝備套用。`, 'log-info');
    }
  },

  getOrCreateEquipStateForScroll(itemId, slotIndex) {
    // 裝備欄身體槽：'body:11'
    if (typeof slotIndex === 'string' && slotIndex.startsWith('body:')) {
      if (typeof UiEquipModule === 'undefined' || typeof UiEquipModule.getWornEntry !== 'function') {
        return null;
      }
      const uiSlot = slotIndex.slice(5);
      const entry = UiEquipModule.getWornEntry(uiSlot);
      if (!entry?.itemId || entry.itemId !== itemId) return null;
      if (!entry.state) {
        const template = typeof ITEM_DATABASE !== 'undefined' ? ITEM_DATABASE[itemId] : null;
        if (!template || typeof createEnchantState !== 'function') return null;
        entry.state = createEnchantState(template, -1);
      }
      return entry.state;
    }

    if (currentEnchantItem) {
      const curId = currentEnchantItem.itemId || currentEnchantItem.id;
      if (curId === itemId && (
        slotIndex === -1
        || slotIndex === currentEnchantItem.slotIndex
        || !Number.isInteger(slotIndex)
      )) {
        return currentEnchantItem;
      }
    }

    if (!Number.isInteger(slotIndex) || slotIndex < 0) return null;

    let state = playerInventoryState[slotIndex];
    if (state) return state;

    const template = typeof ITEM_DATABASE !== 'undefined' ? ITEM_DATABASE[itemId] : null;
    if (!template || typeof createEnchantState !== 'function') return null;

    state = createEnchantState(template, slotIndex);
    playerInventoryState[slotIndex] = state;
    return state;
  },

  applyPendingPotentialScrollToEquip(itemId, slotIndex) {
    const scrollId = this.pendingPotentialScrollId;
    if (!scrollId) return false;

    const scroll = typeof getPotentialScrollById === 'function'
      ? getPotentialScrollById(scrollId)
      : null;
    if (!scroll) {
      this.cancelPotentialScrollUse();
      return false;
    }

    const count = typeof getPlayerPotentialScrollCount === 'function'
      ? getPlayerPotentialScrollCount(scrollId)
      : 0;
    if (count <= 0) {
      this.cancelPotentialScrollUse();
      return false;
    }

    const item = this.getOrCreateEquipStateForScroll(itemId, slotIndex);
    if (!item) {
      if (typeof addLog === 'function') {
        addLog('[消耗] 無法套用至該裝備。', 'log-fail');
      }
      return false;
    }

    const result = typeof applyPotentialScrollGrade === 'function'
      ? applyPotentialScrollGrade(item, scroll)
      : (typeof applyLegendaryPotentialGrade === 'function'
        ? applyLegendaryPotentialGrade(item, scroll.target)
        : { ok: false });
    if (!result?.ok) {
      if (typeof addLog === 'function') {
        addLog(`[消耗] ${result?.message || '套用失敗。'}`, 'log-fail');
      }
      return false;
    }

    if (typeof consumePotentialScroll === 'function') {
      consumePotentialScroll(scrollId, 1);
    }

    if (currentEnchantItem && (
      currentEnchantItem.slotIndex === slotIndex
      || slotIndex === -1
      || (currentEnchantItem.itemId || currentEnchantItem.id) === itemId
    ) && !(typeof slotIndex === 'string' && slotIndex.startsWith('body:'))) {
      if (typeof refreshEquippedItemUI === 'function') {
        refreshEquippedItemUI();
      } else {
        if (typeof saveInventoryItemState === 'function') {
          saveInventoryItemState(currentEnchantItem.slotIndex, currentEnchantItem);
        }
        if (typeof updateStatusPanel === 'function') updateStatusPanel();
        if (typeof refreshActiveModuleUI === 'function') refreshActiveModuleUI();
        if (typeof updateActiveModuleEquip === 'function') updateActiveModuleEquip();
        if (typeof syncInspectModules === 'function') syncInspectModules();
      }
    } else if (typeof slotIndex === 'string' && slotIndex.startsWith('body:')) {
      if (typeof UiEquipModule !== 'undefined' && typeof UiEquipModule.refresh === 'function') {
        UiEquipModule.refresh();
      }
    } else if (typeof saveInventoryItemState === 'function') {
      saveInventoryItemState(slotIndex, item);
    }

    this.cancelPotentialScrollUse();
    this.render();
    this.updateSlotCount();

    if (typeof SessionPersistenceModule !== 'undefined') {
      SessionPersistenceModule.scheduleSave();
    }

    const targetLabel = scroll.target === 'additional' ? '附加潛能' : '潛能';
    const gradeLabel = typeof getPotentialScrollRankLabel === 'function'
      ? getPotentialScrollRankLabel(scroll.grade || result.grade || 'legendary')
      : (scroll.grade || '傳說');
    if (typeof addLog === 'function') {
      addLog(
        `[消耗] 已對【${item.name || itemId}】使用【${scroll.name}】，${targetLabel}賦予為${gradeLabel}。`,
        'log-success'
      );
    }
    return true;
  },

  renderStarForceScrollSlot(slot, entry, slotIndex) {
    const scroll = typeof getStarForceScrollById === 'function'
      ? getStarForceScrollById(entry.scrollId)
      : null;
    if (!scroll) return;

    const count = typeof getPlayerStarForceScrollCount === 'function'
      ? getPlayerStarForceScrollCount(scroll.id)
      : 0;
    if (count <= 0) return;

    const selected = typeof StarForceModule !== 'undefined'
      && StarForceModule.selectedScrollId === scroll.id;
    if (selected) slot.classList.add('inv-slot-selected');

    const itemFrame = document.createElement('div');
    itemFrame.className = 'inv-item-frame inv-consume-frame';

    const scrollImg = document.createElement('img');
    scrollImg.src = scroll.icon;
    scrollImg.alt = scroll.name;
    scrollImg.id = `inv_item_consume_${slotIndex}`;
    scrollImg.draggable = true;
    scrollImg.title = `${scroll.name}（雙擊開啟星力）`;

    scrollImg.ondragstart = (e) => {
      e.dataTransfer.setData('text/plain', JSON.stringify({
        slotIndex,
        tab: 'consume',
      }));
      e.dataTransfer.effectAllowed = 'move';
      slot.classList.add('inv-dragging');
    };
    scrollImg.ondragend = () => {
      slot.classList.remove('inv-dragging');
      document.querySelectorAll('.ms-inv-slot.inv-drag-over').forEach((el) => {
        el.classList.remove('inv-drag-over');
      });
    };

    scrollImg.addEventListener('dblclick', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.handleStarForceScrollDblClick(scroll.id);
    });

    itemFrame.appendChild(scrollImg);
    this.appendStackCount(itemFrame, count);
    slot.appendChild(itemFrame);
  },

  renderCubeConsumeSlot(slot, entry, slotIndex) {
    const cube = typeof getPotentialCubeById === 'function'
      ? getPotentialCubeById(entry.cubeId)
      : null;
    if (!cube) return;
    const count = typeof getPlayerCubeCount === 'function' ? getPlayerCubeCount(cube.id) : 0;
    if (count <= 0) return;

    const itemFrame = document.createElement('div');
    itemFrame.className = 'inv-item-frame inv-consume-frame';
    const img = document.createElement('img');
    img.src = cube.icon;
    img.alt = cube.name;
    img.id = `inv_item_consume_${slotIndex}`;
    img.draggable = true;
    img.title = `${cube.name}（雙擊開啟潛能）`;
    img.ondragstart = (e) => {
      e.dataTransfer.setData('text/plain', JSON.stringify({
        slotIndex,
        tab: 'consume',
      }));
      e.dataTransfer.effectAllowed = 'move';
      slot.classList.add('inv-dragging');
    };
    img.ondragend = () => {
      slot.classList.remove('inv-dragging');
      document.querySelectorAll('.ms-inv-slot.inv-drag-over').forEach((el) => {
        el.classList.remove('inv-drag-over');
      });
    };
    img.addEventListener('dblclick', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.handleCubeDblClick(cube.id);
    });
    itemFrame.appendChild(img);
    this.appendStackCount(itemFrame, count);
    slot.appendChild(itemFrame);
  },

  appendStackCount(itemFrame, count) {
    const n = Math.max(0, Math.floor(Number(count) || 0));
    if (n <= 0 || !itemFrame) return;
    const qty = document.createElement('span');
    qty.className = 'inv-item-count';
    qty.textContent = String(n);
    itemFrame.appendChild(qty);
  },

  renderGenericConsumeIcon(slot, slotIndex, icon, name, count = 0, opts = {}) {
    const itemFrame = document.createElement('div');
    itemFrame.className = 'inv-item-frame inv-consume-frame';
    const img = document.createElement('img');
    img.src = icon;
    img.alt = name;
    img.id = `inv_item_consume_${slotIndex}`;
    img.draggable = true;
    img.title = opts.title || name;
    img.ondragstart = (e) => {
      const payload = { slotIndex, tab: 'consume' };
      this._activeDragPayload = payload;
      e.dataTransfer.setData('text/plain', JSON.stringify(payload));
      e.dataTransfer.effectAllowed = 'move';
      slot.classList.add('inv-dragging');
    };
    img.ondragend = () => {
      this._activeDragPayload = null;
      slot.classList.remove('inv-dragging');
      document.querySelectorAll('.ms-inv-slot.inv-drag-over').forEach((el) => {
        el.classList.remove('inv-drag-over');
      });
    };
    if (typeof opts.onDblClick === 'function') {
      img.addEventListener('dblclick', (e) => {
        e.preventDefault();
        e.stopPropagation();
        opts.onDblClick();
      });
    }
    itemFrame.appendChild(img);
    this.appendStackCount(itemFrame, count);
    slot.appendChild(itemFrame);
  },

  renderAddCubeConsumeSlot(slot, entry, slotIndex) {
    const cube = typeof getAddPotCubeById === 'function' ? getAddPotCubeById(entry.cubeId) : null;
    if (!cube) return;
    const count = typeof getPlayerAddPotCubeCount === 'function' ? getPlayerAddPotCubeCount(cube.id) : 0;
    if (count <= 0) return;
    this.renderGenericConsumeIcon(slot, slotIndex, cube.icon, cube.name, count, {
      title: `${cube.name}（雙擊開啟附加潛能）`,
      onDblClick: () => this.handleAddCubeDblClick(cube.id),
    });
  },

  renderHammerConsumeSlot(slot, entry, slotIndex) {
    const type = typeof HAMMER_TYPES !== 'undefined' ? HAMMER_TYPES[entry.hammerId] : null;
    if (!type) return;
    const count = typeof getPlayerHammerCount === 'function' ? getPlayerHammerCount(entry.hammerId) : 0;
    if (count <= 0) return;
    this.renderGenericConsumeIcon(slot, slotIndex, type.icon, type.name, count, {
      title: `${type.name}（雙擊開啟鐵鎚）`,
      onDblClick: () => this.handleHammerDblClick(entry.hammerId),
    });
  },

  renderGloryScrollConsumeSlot(slot, entry, slotIndex) {
    const scroll = typeof getScrollById === 'function' ? getScrollById(entry.scrollId) : null;
    if (!scroll) return;
    const count = typeof getPlayerGloryScrollCount === 'function' ? getPlayerGloryScrollCount(scroll.id) : 0;
    if (count <= 0) return;
    const isNormal = scroll.tab === (typeof SCROLL_TAB !== 'undefined' ? SCROLL_TAB.NORMAL : 'normal');
    const showQty = isNormal || (typeof isIdlePlayMode === 'function' && isIdlePlayMode());
    this.renderGenericConsumeIcon(slot, slotIndex, scroll.icon, scroll.name, showQty ? count : 0, {
      title: `${scroll.name}（雙擊開啟卷軸）`,
      onDblClick: () => this.handleGloryScrollDblClick(scroll.id),
    });
    const img = slot.querySelector('img');
    if (img) {
      img.title = `${scroll.name}（雙擊開啟卷軸）`;
      img.addEventListener('mouseenter', () => {
        if (typeof ScrollModule !== 'undefined') ScrollModule.showScrollTooltip(img, scroll);
      });
      img.addEventListener('mouseleave', () => {
        if (typeof ScrollModule !== 'undefined') ScrollModule.hideScrollTooltip();
      });
    }
  },

  renderBonusStatConsumeSlot(slot, entry, slotIndex) {
    const item = typeof getBonusStatItemById === 'function' ? getBonusStatItemById(entry.itemId) : null;
    if (!item) return;
    const count = typeof getPlayerBonusStatItemCount === 'function' ? getPlayerBonusStatItemCount(item.id) : 0;
    if (count <= 0) return;
    this.renderGenericConsumeIcon(slot, slotIndex, item.icon, item.name, count, {
      title: `${item.name}（雙擊開啟星火）`,
      onDblClick: () => this.handleBonusStatDblClick(item.id),
    });
  },

  renderExceptionalHammerConsumeSlot(slot, entry, slotIndex) {
    const hammer = typeof getExceptionalHammerById === 'function' ? getExceptionalHammerById(entry.hammerId) : null;
    if (!hammer) return;
    const count = typeof getPlayerExceptionalHammerCount === 'function' ? getPlayerExceptionalHammerCount(hammer.id) : 0;
    if (count <= 0) return;
    this.renderGenericConsumeIcon(slot, slotIndex, hammer.icon, hammer.name, count);
  },

  renderSoulConsumeSlot(slot, entry, slotIndex) {
    const mat = typeof getSoulMaterialById === 'function' ? getSoulMaterialById(entry.soulId) : null;
    if (!mat) return;
    const count = typeof getPlayerSoulMaterialCount === 'function' ? getPlayerSoulMaterialCount(mat.id) : 0;
    if (count <= 0) return;
    this.renderGenericConsumeIcon(slot, slotIndex, mat.icon, mat.name, count);
  },

  renderRecoveryCardConsumeSlot(slot, entry, slotIndex) {
    const card = typeof RECOVERY_CARD !== 'undefined' ? RECOVERY_CARD : null;
    if (!card) return;
    const count = Math.max(0, Math.floor(Number(typeof playerRecoveryCardCount !== 'undefined' ? playerRecoveryCardCount : 0) || 0));
    if (count <= 0) return;
    const showQty = typeof isIdlePlayMode === 'function' && isIdlePlayMode();
    this.renderGenericConsumeIcon(slot, slotIndex, card.icon, card.name, showQty ? count : 0);
  },

  renderPotionConsumeSlot(slot, entry, slotIndex) {
    const potion = typeof IdlePotionStore !== 'undefined' ? IdlePotionStore.get(entry.itemId) : null;
    if (!potion) return;
    const count = typeof getPlayerPotionCount === 'function'
      ? getPlayerPotionCount(entry.itemId)
      : 0;
    if (count <= 0) return;
    this.renderGenericConsumeIcon(
      slot,
      slotIndex,
      IdlePotionStore.resolveIcon(potion.icon),
      potion.name,
      count,
      {
        title: `${potion.name}（雙擊裝備到自動喝藥槽）`,
        onDblClick: () => this.handlePotionDblClick(entry.itemId),
      },
    );
    const img = slot.querySelector('img');
    if (img) {
      img.title = `${potion.name}（雙擊裝備到自動喝藥槽）`;
      img.ondragstart = (e) => {
        const payload = {
          slotIndex,
          tab: 'consume',
          itemId: entry.itemId,
          consumeType: 'potion',
        };
        this._activeDragPayload = payload;
        e.dataTransfer.setData('text/plain', JSON.stringify(payload));
        e.dataTransfer.effectAllowed = 'copyMove';
        slot.classList.add('inv-dragging');
      };
      img.ondragend = () => {
        this._activeDragPayload = null;
        slot.classList.remove('inv-dragging');
        document.querySelectorAll('.ms-inv-slot.inv-drag-over').forEach((el) => {
          el.classList.remove('inv-drag-over');
        });
      };
      img.addEventListener('mouseenter', () => this.showPotionTooltip(img, potion));
      img.addEventListener('mouseleave', () => this.hideEtcTooltip());
    }
  },

  handlePotionDblClick(itemId) {
    const id = String(itemId || '').trim();
    if (!id) return;
    if (typeof IdlePotionStore === 'undefined' || !IdlePotionStore.isPotionId?.(id)) return;

    if (typeof IdlePotionPanel === 'undefined' || typeof IdlePotionPanel.setQuickPotion !== 'function') {
      if (typeof addLog === 'function') addLog('[藥水] 自動喝藥槽尚未載入。', 'log-fail');
      return;
    }

    const ok = IdlePotionPanel.setQuickPotion(id);
    if (!ok) {
      if (typeof addLog === 'function') addLog('[藥水] 無法裝備到自動喝藥槽。', 'log-fail');
      return;
    }

    const potion = IdlePotionStore.get(id);
    if (typeof addLog === 'function') {
      addLog(`[藥水] 已將【${potion?.name || id}】裝備到自動喝藥槽。`, 'log-success');
    }
  },

  /** 開啟強化台並切到指定分頁（背包雙擊可略過「當前裝備不適用」限制） */
  openEnchantCategory(category) {
    if (this.lockMode) this.clearLockMode();
    if (this.pendingPotentialScrollId) this.cancelPotentialScrollUse();

    if (typeof UiEquipModule !== 'undefined' && typeof UiEquipModule.setEnchantOpen === 'function') {
      UiEquipModule.setEnchantOpen(true);
    }

    const tabId = (typeof TAB_BUTTON_IDS !== 'undefined' && TAB_BUTTON_IDS[category])
      ? TAB_BUTTON_IDS[category]
      : null;
    const btn = tabId ? document.getElementById(tabId) : null;

    document.querySelectorAll('.ms-tab-btn').forEach((tab) => tab.classList.remove('checked'));
    if (btn) btn.classList.add('checked');

    const select = document.getElementById('actionCategory');
    if (select) select.value = category;

    if (typeof switchCategory === 'function') {
      switchCategory();
    } else if (typeof switchCategoryTab === 'function') {
      switchCategoryTab(category, btn);
    }
  },

  handleCubeDblClick(cubeId) {
    if (!cubeId) return;
    this.openEnchantCategory('potential');
    if (typeof PotentialModule !== 'undefined') {
      PotentialModule.selectedCubeId = cubeId;
      PotentialModule.updateUI?.();
    }
    const cube = typeof getPotentialCubeById === 'function' ? getPotentialCubeById(cubeId) : null;
    if (cube && typeof addLog === 'function') {
      addLog(`[潛能] 已開啟潛能面板（【${cube.name}】）。`, 'log-info');
    }
  },

  handleAddCubeDblClick(cubeId) {
    if (!cubeId) return;
    this.openEnchantCategory('additionalPotential');
    if (typeof AddPotentialModule !== 'undefined') {
      AddPotentialModule.selectedCubeId = cubeId;
      AddPotentialModule.updateUI?.();
    }
    const cube = typeof getAddPotCubeById === 'function' ? getAddPotCubeById(cubeId) : null;
    if (cube && typeof addLog === 'function') {
      addLog(`[附加潛能] 已開啟附加潛能面板（【${cube.name}】）。`, 'log-info');
    }
  },

  handleHammerDblClick(hammerId) {
    if (!hammerId) return;
    this.openEnchantCategory('hammer');
    if (typeof HammerModule !== 'undefined') {
      HammerModule.selectedHammer = hammerId;
      if (hammerId === 'golden') HammerModule.setAutoWhiteHammerEnabled?.(false);
      HammerModule.updateUI?.();
    }
    const type = typeof HAMMER_TYPES !== 'undefined' ? HAMMER_TYPES[hammerId] : null;
    if (type && typeof addLog === 'function') {
      addLog(`[鐵鎚] 已開啟鐵鎚面板（【${type.name}】）。`, 'log-info');
    }
  },

  handleGloryScrollDblClick(scrollId) {
    if (!scrollId) return;
    const scroll = typeof getScrollById === 'function' ? getScrollById(scrollId) : null;
    if (!scroll) return;

    this.openEnchantCategory('scroll');

    if (typeof ScrollModule !== 'undefined') {
      const tab = scroll.tab === (typeof SCROLL_TAB !== 'undefined' ? SCROLL_TAB.NORMAL : 'normal')
        ? 'normal'
        : 'special';
      ScrollModule.selectedTab = tab;
      ScrollModule.lastCatalogTab = tab;
      ScrollModule.selectedScrollId = scrollId;
      ScrollModule.selectedRestoreScrollId = null;
      ScrollModule.selectedTraceId = null;
      ScrollModule.updateUI?.();
    }

    if (typeof addLog === 'function') {
      addLog(`[卷軸] 已開啟卷軸面板（【${scroll.name}】）。`, 'log-info');
    }
  },

  handleBonusStatDblClick(itemId) {
    if (!itemId) return;
    this.openEnchantCategory('bonusStat');
    if (typeof BonusStatModule !== 'undefined') {
      BonusStatModule.costTab = 'item';
      BonusStatModule.selectedItemId = itemId;
      BonusStatModule.updateUI?.();
    }
    const item = typeof getBonusStatItemById === 'function' ? getBonusStatItemById(itemId) : null;
    if (item && typeof addLog === 'function') {
      addLog(`[星火] 已開啟附加能力面板（【${item.name}】）。`, 'log-info');
    }
  },

  handleStarForceScrollDblClick(scrollId) {
    if (typeof StarForceModule === 'undefined') return;

    const count = typeof getPlayerStarForceScrollCount === 'function'
      ? getPlayerStarForceScrollCount(scrollId)
      : 0;
    if (count <= 0) return;

    if (StarForceModule.selectedScrollId === scrollId) {
      StarForceModule.clearSelectedScroll();
      return;
    }

    StarForceModule.setSelectedScroll(scrollId);

    const scroll = typeof getStarForceScrollById === 'function'
      ? getStarForceScrollById(scrollId)
      : null;
    if (scroll && typeof addLog === 'function') {
      addLog(`[星力] 已選擇【${scroll.name}】，請放置裝備。`, 'log-info');
    }

    this.openEnchantCategory('star');

    if (this.tab !== 'equip') {
      this.setTab('equip');
    }
  },

  swapSlots(fromIndex, toIndex) {
    if (fromIndex === toIndex) return;

    const inventory = this.getInventory();

    const fromId = inventory[fromIndex] ?? null;
    const toId = inventory[toIndex] ?? null;

    if (this.tab === 'equip') {
      if (Number.isInteger(currentEnchantItem?.slotIndex) && currentEnchantItem.slotIndex >= 0
        && (currentEnchantItem.slotIndex === fromIndex || currentEnchantItem.slotIndex === toIndex)) {
        saveInventoryItemState(currentEnchantItem.slotIndex, currentEnchantItem);
      }

      const fromState = playerInventoryState[fromIndex] ?? null;
      const toState = playerInventoryState[toIndex] ?? null;
      playerInventoryState[fromIndex] = toState;
      playerInventoryState[toIndex] = fromState;

      if (currentEnchantItem && Number.isInteger(currentEnchantItem.slotIndex) && currentEnchantItem.slotIndex >= 0) {
        if (currentEnchantItem.slotIndex === fromIndex) {
          currentEnchantItem.slotIndex = toIndex;
        } else if (currentEnchantItem.slotIndex === toIndex) {
          currentEnchantItem.slotIndex = fromIndex;
        }
      }
    }

    inventory[fromIndex] = toId;
    inventory[toIndex] = fromId;

    if (typeof SessionPersistenceModule !== 'undefined') {
      SessionPersistenceModule.scheduleSave();
    }

    this.render();
    this.updateSlotCount();
  },

  findEmptyEquipSlot() {
    if (typeof playerInventoryEquip === 'undefined') return -1;
    for (let i = 0; i < playerInventoryEquip.length; i++) {
      if (!playerInventoryEquip[i]) return i;
    }
    return -1;
  },

  addEquipFromCatalog(itemId, preferredSlot = null, opts = {}) {
    if (!itemId || typeof ITEM_DATABASE === 'undefined' || !ITEM_DATABASE[itemId]) return false;
    const switchTab = opts.switchTab !== false;
    if (switchTab && this.tab !== 'equip') this.setTab('equip');

    let idx = Number.isInteger(preferredSlot) ? preferredSlot : -1;
    if (idx < 0 || idx >= playerInventoryEquip.length || playerInventoryEquip[idx]) {
      idx = this.findEmptyEquipSlot();
    }
    if (idx < 0) {
      if (!opts.silent && typeof addLog === 'function') {
        addLog(`[${opts.logTag || '清單'}] 物品欄已滿，無法放入裝備。`, 'log-fail');
      }
      return false;
    }

    playerInventoryEquip[idx] = itemId;
    playerInventoryState[idx] = null;
    if (typeof playerInventory !== 'undefined' && Array.isArray(playerInventory)) {
      playerInventory.splice(0, playerInventory.length, ...playerInventoryEquip);
    }
    if (typeof SessionPersistenceModule !== 'undefined') {
      SessionPersistenceModule.scheduleSave();
    }
    if (opts.silent) this.scheduleRender();
    else {
      this.render();
      this.updateSlotCount();
    }
    const name = ITEM_DATABASE[itemId]?.name || itemId;
    if (!opts.silent && typeof addLog === 'function') {
      addLog(`[${opts.logTag || '清單'}] 已將【${name}】放入物品欄。`, 'log-success');
    }
    return true;
  },

  findEmptyConsumeSlot() {
    if (typeof playerInventoryConsume === 'undefined') return -1;
    for (let i = 0; i < playerInventoryConsume.length; i++) {
      if (!playerInventoryConsume[i]) return i;
    }
    return -1;
  },

  ensureConsumeSlot(matchFn, createFn) {
    if (typeof playerInventoryConsume === 'undefined') return -1;
    for (let i = 0; i < playerInventoryConsume.length; i++) {
      if (matchFn(playerInventoryConsume[i])) return i;
    }
    const idx = this.findEmptyConsumeSlot();
    if (idx < 0) return -1;
    playerInventoryConsume[idx] = createFn();
    return idx;
  },

  grantConsumeDrop(row, opts = {}) {
    if (!row) return { ok: false, name: '' };
    const logTag = opts.logTag || '放置';
    let name = row.name || row.id || '消耗品';
    let ok = false;

    if (row.consumeType === 'starforce_scroll' && typeof grantStarForceScroll === 'function') {
      const scroll = typeof getStarForceScrollById === 'function' ? getStarForceScrollById(row.scrollId) : null;
      name = scroll?.name || row.scrollId;
      ok = grantStarForceScroll(row.scrollId, row.amount || 1) > 0;
      if (ok) {
        this.ensureConsumeSlot(
          (entry) => typeof isStarForceScrollConsumeEntry === 'function' && isStarForceScrollConsumeEntry(entry) && entry.scrollId === row.scrollId,
          () => ({
            type: CONSUME_ITEM_TYPE.STARFORCE_SCROLL,
            scrollId: row.scrollId,
          }),
        );
      }
    } else if (row.consumeType === 'potential_scroll' && typeof grantPotentialScroll === 'function') {
      const scroll = typeof getPotentialScrollById === 'function' ? getPotentialScrollById(row.scrollId) : null;
      name = scroll?.name || row.scrollId;
      ok = grantPotentialScroll(row.scrollId, row.amount || 1) > 0;
      if (ok) {
        this.ensureConsumeSlot(
          (entry) => typeof isPotentialScrollConsumeEntry === 'function' && isPotentialScrollConsumeEntry(entry) && entry.scrollId === row.scrollId,
          () => ({
            type: CONSUME_ITEM_TYPE.POTENTIAL_SCROLL,
            scrollId: row.scrollId,
          }),
        );
      }
    } else if (row.consumeType === 'cube' && typeof grantPlayerCube === 'function') {
      const cube = typeof getPotentialCubeById === 'function' ? getPotentialCubeById(row.cubeId) : null;
      name = cube?.name || row.cubeId;
      ok = grantPlayerCube(row.cubeId, row.amount || 1) > 0;
      if (ok) {
        this.ensureConsumeSlot(
          (entry) => entry && entry.type === CONSUME_ITEM_TYPE.CUBE && entry.cubeId === row.cubeId,
          () => ({
            type: CONSUME_ITEM_TYPE.CUBE,
            cubeId: row.cubeId,
          }),
        );
      }
    } else if (row.consumeType === 'add_cube' && typeof grantPlayerAddPotCube === 'function') {
      const cube = typeof getAddPotCubeById === 'function' ? getAddPotCubeById(row.cubeId) : null;
      name = cube?.name || row.cubeId;
      ok = grantPlayerAddPotCube(row.cubeId, row.amount || 1) > 0;
      if (ok) {
        this.ensureConsumeSlot(
          (entry) => entry && entry.type === CONSUME_ITEM_TYPE.ADD_CUBE && entry.cubeId === row.cubeId,
          () => ({ type: CONSUME_ITEM_TYPE.ADD_CUBE, cubeId: row.cubeId }),
        );
      }
    } else if (row.consumeType === 'hammer' && typeof grantPlayerHammer === 'function') {
      const type = typeof HAMMER_TYPES !== 'undefined' ? HAMMER_TYPES[row.hammerId] : null;
      name = type?.name || row.hammerId;
      ok = grantPlayerHammer(row.hammerId, row.amount || 1) > 0;
      if (ok) {
        this.ensureConsumeSlot(
          (entry) => entry && entry.type === CONSUME_ITEM_TYPE.HAMMER && entry.hammerId === row.hammerId,
          () => ({ type: CONSUME_ITEM_TYPE.HAMMER, hammerId: row.hammerId }),
        );
      }
    } else if (row.consumeType === 'glory_scroll' && typeof grantGloryScroll === 'function') {
      const scroll = typeof getScrollById === 'function' ? getScrollById(row.scrollId) : null;
      name = scroll?.name || row.scrollId;
      ok = grantGloryScroll(row.scrollId, row.amount || 1) > 0;
      if (ok) {
        this.ensureConsumeSlot(
          (entry) => entry && entry.type === CONSUME_ITEM_TYPE.GLORY_SCROLL && entry.scrollId === row.scrollId,
          () => ({ type: CONSUME_ITEM_TYPE.GLORY_SCROLL, scrollId: row.scrollId }),
        );
      }
    } else if (row.consumeType === 'bonus_stat' && typeof grantPlayerBonusStatItem === 'function') {
      const item = typeof getBonusStatItemById === 'function' ? getBonusStatItemById(row.itemId) : null;
      name = item?.name || row.itemId;
      ok = grantPlayerBonusStatItem(row.itemId, row.amount || 1) > 0;
      if (ok) {
        this.ensureConsumeSlot(
          (entry) => entry && entry.type === CONSUME_ITEM_TYPE.BONUS_STAT && entry.itemId === row.itemId,
          () => ({ type: CONSUME_ITEM_TYPE.BONUS_STAT, itemId: row.itemId }),
        );
      }
    } else if (row.consumeType === 'exceptional_hammer' && typeof grantPlayerExceptionalHammer === 'function') {
      const hammer = typeof getExceptionalHammerById === 'function' ? getExceptionalHammerById(row.hammerId) : null;
      name = hammer?.name || row.hammerId;
      ok = grantPlayerExceptionalHammer(row.hammerId, row.amount || 1) > 0;
      if (ok) {
        this.ensureConsumeSlot(
          (entry) => entry && entry.type === CONSUME_ITEM_TYPE.EXCEPTIONAL_HAMMER && entry.hammerId === row.hammerId,
          () => ({ type: CONSUME_ITEM_TYPE.EXCEPTIONAL_HAMMER, hammerId: row.hammerId }),
        );
      }
    } else if (row.consumeType === 'soul' && typeof grantPlayerSoulMaterial === 'function') {
      const mat = typeof getSoulMaterialById === 'function' ? getSoulMaterialById(row.soulId) : null;
      name = mat?.name || row.soulId;
      ok = grantPlayerSoulMaterial(row.soulId, row.amount || 1) > 0;
      if (ok) {
        this.ensureConsumeSlot(
          (entry) => entry && entry.type === CONSUME_ITEM_TYPE.SOUL && entry.soulId === row.soulId,
          () => ({ type: CONSUME_ITEM_TYPE.SOUL, soulId: row.soulId }),
        );
      }
    } else if (row.consumeType === 'recovery_card' && typeof grantRecoveryCard === 'function') {
      const card = typeof RECOVERY_CARD !== 'undefined' ? RECOVERY_CARD : null;
      name = card?.name || '恢復卡';
      ok = grantRecoveryCard(row.amount || 1) > 0;
    } else if (row.consumeType === 'potion' && typeof grantPotion === 'function') {
      const potion = typeof IdlePotionStore !== 'undefined' ? IdlePotionStore.get(row.itemId) : null;
      name = potion?.name || row.itemId || '藥水';
      ok = grantPotion(row.itemId, row.amount || 1) > 0;
    }

    if (ok) {
      if (typeof SessionPersistenceModule !== 'undefined') SessionPersistenceModule.scheduleSave();
      if (opts.switchTab && this.tab !== 'consume') this.setTab('consume');
      else if (opts.silent) this.scheduleRender();
      else {
        this.render();
        this.updateSlotCount();
      }
      if (!opts.silent && typeof addLog === 'function') {
        addLog(`[${logTag}] 已將【${name}】放入消耗欄。`, 'log-success');
      }
    } else if (!opts.silent && typeof addLog === 'function') {
      addLog(`[${logTag}] 消耗欄無法放入掉落物。`, 'log-fail');
    }
    return { ok, name };
  },

  normalizeIdleDropRow(row) {
    if (!row) return row;
    const id = String(row?.itemId || row?.id || '').trim();
    if (id
      && typeof IdlePotionStore !== 'undefined'
      && IdlePotionStore.isPotionId?.(id)
      && (row.kind === 'etc' || row.bag === 'etc' || row.kind === 'consume'
        || row.consumeType === 'potion')) {
      // 藥水掉落統一成消耗欄（含 BOSS 獎勵只寫 kind:consume、未帶 consumeType）
      return {
        ...row,
        kind: 'consume',
        bag: 'consume',
        consumeType: 'potion',
        itemId: id,
        amount: Math.max(1, Math.floor(Number(row.amount) || 1)),
      };
    }
    return row;
  },

  applyIdleDrop(row, opts = {}) {
    row = this.normalizeIdleDropRow(row);
    if (!row) return { ok: false, name: '', bag: '' };
    if (row.kind === 'etc' || row.bag === 'etc') {
      const result = this.addEtcItem(row, opts);
      return { ...result, bag: 'etc' };
    }
    if (row.kind === 'equip') {
      const name = (typeof ITEM_DATABASE !== 'undefined' && ITEM_DATABASE[row.itemId]?.name) || row.itemId;
      const times = Math.max(1, Math.floor(Number(row.amount) || 1));
      let granted = 0;
      for (let i = 0; i < times; i += 1) {
        const added = this.addEquipFromCatalog(row.itemId, null, {
          silent: opts.silent,
          logTag: opts.logTag || '放置',
          switchTab: false,
        });
        if (!added) break;
        granted += 1;
      }
      return { ok: granted > 0, name, bag: 'equip', amount: granted };
    }
    const result = this.grantConsumeDrop(row, opts);
    return { ...result, bag: 'consume' };
  },

  /** 只讀：掉落列目前能否進背包（不入包） */
  canAcceptIdleDrop(row) {
    row = this.normalizeIdleDropRow(row);
    if (!row) return false;
    if (row.kind === 'meso') return true;
    if (row.kind === 'equip') {
      return this.findEmptyEquipSlot() >= 0;
    }
    if (row.kind === 'etc' || row.bag === 'etc') {
      const itemId = String(row?.itemId || row?.id || '').trim();
      if (!itemId || typeof playerInventoryEtc === 'undefined') return false;
      if (playerInventoryEtc.some((e) => e && String(e.itemId) === itemId)) return true;
      return this.findEmptyEtcSlot() >= 0;
    }
    return !this.consumeDropNeedsNewSlot(row) || this.findEmptyConsumeSlot() >= 0;
  },

  /** 消耗掉落是否需要新消耗欄格（已有同款堆疊則否） */
  consumeDropNeedsNewSlot(row) {
    if (!row || typeof playerInventoryConsume === 'undefined') return true;
    const T = typeof CONSUME_ITEM_TYPE !== 'undefined' ? CONSUME_ITEM_TYPE : {};
    const match = (fn) => playerInventoryConsume.some((e) => e && fn(e));
    if (row.consumeType === 'starforce_scroll') {
      return !match((e) => typeof isStarForceScrollConsumeEntry === 'function'
        && isStarForceScrollConsumeEntry(e) && e.scrollId === row.scrollId);
    }
    if (row.consumeType === 'potential_scroll') {
      return !match((e) => typeof isPotentialScrollConsumeEntry === 'function'
        && isPotentialScrollConsumeEntry(e) && e.scrollId === row.scrollId);
    }
    if (row.consumeType === 'cube') {
      return !match((e) => e.type === T.CUBE && e.cubeId === row.cubeId);
    }
    if (row.consumeType === 'add_cube') {
      return !match((e) => e.type === T.ADD_CUBE && e.cubeId === row.cubeId);
    }
    if (row.consumeType === 'hammer') {
      return !match((e) => e.type === T.HAMMER && e.hammerId === row.hammerId);
    }
    if (row.consumeType === 'glory_scroll') {
      return !match((e) => e.type === T.GLORY_SCROLL && e.scrollId === row.scrollId);
    }
    if (row.consumeType === 'bonus_stat') {
      return !match((e) => e.type === T.BONUS_STAT && e.itemId === row.itemId);
    }
    if (row.consumeType === 'exceptional_hammer') {
      return !match((e) => e.type === T.EXCEPTIONAL_HAMMER && e.hammerId === row.hammerId);
    }
    if (row.consumeType === 'soul') {
      return !match((e) => e.type === T.SOUL && e.soulId === row.soulId);
    }
    if (row.consumeType === 'recovery_card') {
      return !match((e) => e.type === T.RECOVERY_CARD || e.type === 'recovery_card');
    }
    if (row.consumeType === 'potion') {
      return !match((e) => e.type === T.POTION && String(e.itemId) === String(row.itemId));
    }
    return true;
  },

  removeEquipToCatalog(slotIndex) {
    if (!Number.isInteger(slotIndex) || slotIndex < 0) return false;
    const itemId = playerInventoryEquip[slotIndex];
    if (!itemId) return false;

    const name = (typeof ITEM_DATABASE !== 'undefined' && ITEM_DATABASE[itemId]?.name) || itemId;
    playerInventoryEquip[slotIndex] = null;
    playerInventoryState[slotIndex] = null;
    if (typeof playerInventory !== 'undefined' && Array.isArray(playerInventory)) {
      playerInventory.splice(0, playerInventory.length, ...playerInventoryEquip);
    }
    if (typeof SessionPersistenceModule !== 'undefined') {
      SessionPersistenceModule.scheduleSave();
    }
    this.render();
    this.updateSlotCount();
    if (typeof addLog === 'function') {
      addLog(`[清單] 已從物品欄移除【${name}】。`, 'log-info');
    }
    return true;
  },

  clearConsumeSlot(slotIndex) {
    if (!Number.isInteger(slotIndex) || typeof playerInventoryConsume === 'undefined') return false;
    if (!playerInventoryConsume[slotIndex]) return false;
    playerInventoryConsume[slotIndex] = null;
    if (typeof SessionPersistenceModule !== 'undefined') SessionPersistenceModule.scheduleSave();
    this.render();
    this.updateSlotCount();
    return true;
  },

  clearEtcSlot(slotIndex) {
    if (!Number.isInteger(slotIndex) || typeof playerInventoryEtc === 'undefined') return false;
    if (!playerInventoryEtc[slotIndex]) return false;
    playerInventoryEtc[slotIndex] = null;
    if (typeof SessionPersistenceModule !== 'undefined') SessionPersistenceModule.scheduleSave();
    this.render();
    this.updateSlotCount();
    return true;
  },

  handleDrop(e, targetIndex) {
    e.preventDefault();
    e.stopPropagation();

    const slot = e.currentTarget;
    slot?.classList.remove('inv-drag-over');

    const data = e.dataTransfer.getData('text/plain');
    if (!data) return;

    try {
      const parsed = JSON.parse(data);

      if (parsed.source === 'request') {
        if (parsed.kind === 'consume' && parsed.row) {
          this.grantConsumeDrop({ ...parsed.row, amount: parsed.row.amount || 1 }, { logTag: '清單', switchTab: true });
          return;
        }
        if (parsed.kind === 'etc' && parsed.itemId) {
          this.addEtcItem({ itemId: parsed.itemId, amount: 1 }, { logTag: '清單', switchTab: true });
          return;
        }
        if (parsed.itemId) {
          if (this.tab !== 'equip') this.setTab('equip');
          this.addEquipFromCatalog(parsed.itemId, targetIndex);
        }
        return;
      }

      // 從裝備欄拖回背包 = 脫下
      if (parsed.source === 'body' && typeof UiEquipModule !== 'undefined') {
        if (parsed.uiSlot != null) {
          UiEquipModule.unequipSlot(parsed.uiSlot);
        } else if (Number.isInteger(parsed.bagIndex)) {
          UiEquipModule.unequipBagIndex(parsed.bagIndex, { allPresets: false });
        }
        return;
      }

      const { slotIndex: fromIndex, tab: fromTab } = parsed;
      if (fromIndex === undefined || fromIndex === targetIndex) return;
      if (fromTab && fromTab !== this.tab) return;
      this.swapSlots(fromIndex, targetIndex);
    } catch (err) {
      console.error('背包拖曳失敗:', err);
    }
  },

  updateMesoDisplay() {
    const el = document.getElementById('invMesoBalance');
    const mp = document.getElementById('invMaplePointBalance');
    if (mp) mp.textContent = '0';
    if (el) {
      if (typeof isIdlePlayMode === 'function' && isIdlePlayMode()) {
        el.textContent = typeof formatIdleHeldMeso === 'function'
          ? formatIdleHeldMeso()
          : String(typeof getIdleHeldMeso === 'function' ? getIdleHeldMeso() : 0);
      } else {
        el.textContent = '-';
      }
    }
    if (typeof TrunkModule !== 'undefined' && TrunkModule.isOpen?.()) {
      TrunkModule.updateMesoDisplay?.();
    }
  },

  updateSlotCount() {
    const equipCount = playerInventoryEquip.filter(Boolean).length;
    const consumeCount = playerInventoryConsume.filter((entry) => this.isConsumeEntryActive(entry)).length;
    const etcCount = (typeof playerInventoryEtc !== 'undefined' ? playerInventoryEtc : [])
      .filter(Boolean).length;

    const equipCurrent = document.getElementById('invSlotCountEquipCurrent');
    const consumeCurrent = document.getElementById('invSlotCountConsumeCurrent');
    const etcCurrent = document.getElementById('invSlotCountEtcCurrent');

    if (equipCurrent) equipCurrent.textContent = String(equipCount);
    if (consumeCurrent) consumeCurrent.textContent = String(consumeCount);
    if (etcCurrent) etcCurrent.textContent = String(etcCount);
  },

  snapScroll(value) {
    const stride = this.rowStride();
    const maxScroll = this.getMaxScroll();
    const snapped = Math.round(value / stride) * stride;
    return Math.max(0, Math.min(maxScroll, snapped));
  },

  getContentHeight() {
    return this.gridHeight(this.ROWS);
  },

  getViewportHeight() {
    if (this.mode === 'full') return this.gridHeight(this.FULL_ROWS);
    return this.gridHeight(this.VISIBLE_ROWS_MIN);
  },

  getMaxScroll() {
    if (this.mode === 'full') return 0;
    return Math.max(0, this.getContentHeight() - this.getViewportHeight());
  },

  onWheel(e) {
    if (this.mode !== 'min') return;
    e.preventDefault();
    const maxScroll = this.getMaxScroll();
    if (maxScroll <= 0) return;
    const direction = e.deltaY > 0 ? 1 : e.deltaY < 0 ? -1 : 0;
    if (!direction) return;
    this.scrollTop = this.snapScroll(this.scrollTop + direction * this.rowStride());
    this.updateScroll();
  },

  onTrackMouseDown(e) {
    if (this.mode !== 'min') return;
    const track = document.getElementById('invScrollTrack');
    if (!track || e.target.id === 'invScrollThumb') return;

    const rect = track.getBoundingClientRect();
    const ratio = (e.clientY - rect.top) / rect.height;
    const maxScroll = this.getMaxScroll();
    const maxRow = Math.round(maxScroll / this.rowStride());
    const targetRow = Math.round(ratio * maxRow);
    this.scrollTop = this.snapScroll(targetRow * this.rowStride());
    this.updateScroll();
  },

  onThumbMouseDown(e) {
    if (this.mode !== 'min') return;
    e.preventDefault();
    this.draggingThumb = true;
    this.dragStartY = e.clientY;
    this.dragStartScroll = this.scrollTop;
  },

  onThumbMouseMove(e) {
    if (!this.draggingThumb) return;

    const track = document.getElementById('invScrollTrack');
    const thumb = document.getElementById('invScrollThumb');
    if (!track || !thumb) return;

    const trackH = track.clientHeight;
    const thumbH = thumb.clientHeight;
    const maxScroll = this.getMaxScroll();
    const scrollableTrack = Math.max(1, trackH - thumbH);
    const delta = e.clientY - this.dragStartY;
    const scrollDelta = (delta / scrollableTrack) * maxScroll;

    this.scrollTop = this.snapScroll(this.dragStartScroll + scrollDelta);
    this.updateScroll();
  },

  onThumbMouseUp() {
    if (this.draggingThumb) {
      this.scrollTop = this.snapScroll(this.scrollTop);
      this.updateScroll();
    }
    this.draggingThumb = false;
  },

  updateScroll() {
    const grid = document.getElementById('inventoryGrid');
    const thumb = document.getElementById('invScrollThumb');
    const track = document.getElementById('invScrollTrack');
    if (!grid) return;

    if (this.mode === 'full') {
      grid.style.transform = '';
      if (thumb) {
        thumb.style.top = '0px';
        thumb.style.height = '28px';
      }
      return;
    }

    const maxScroll = this.getMaxScroll();
    grid.style.transform = maxScroll > 0 ? `translateY(-${this.scrollTop}px)` : '';

    if (!thumb || !track) return;

    const trackH = track.clientHeight;
    const contentH = this.getContentHeight();
    const viewportH = this.getViewportHeight();
    const thumbH = Math.max(28, Math.round(trackH * (viewportH / contentH)));
    const maxThumbTop = Math.max(0, trackH - thumbH);
    const thumbTop = maxScroll > 0 ? (this.scrollTop / maxScroll) * maxThumbTop : 0;

    thumb.style.height = `${thumbH}px`;
    thumb.style.top = `${thumbTop}px`;
  },

  isOpen() {
    return !!this.panelOpen;
  },

  syncMenuButton() {
    document.getElementById('btnViewInventory')?.classList.toggle('is-active', !!this.panelOpen);
  },

  setOpen(next) {
    this.panelOpen = !!next;
    const panel = document.getElementById('inventoryPanel');
    const col = document.querySelector('.ms-inventory-column');
    // 關：整欄隱藏；開：欄與面板都顯示
    if (col) col.classList.toggle('hidden', !this.panelOpen);
    if (panel) panel.classList.toggle('hidden', !this.panelOpen);
    if (this.panelOpen && typeof PanelDrag !== 'undefined') {
      PanelDrag.bringFront(panel);
    }
    if (this.panelOpen) this.updateMesoDisplay();
    this.syncMenuButton();
  },

  toggle() {
    this.setOpen(!this.panelOpen);
  },

  bindPanelControls() {
    if (this._panelControlsBound) return;
    this._panelControlsBound = true;
    document.getElementById('btnViewInventory')?.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.toggle();
    });
    document.getElementById('inventoryClose')?.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.setOpen(false);
    });
  },
};

function initInventory() {
  InventoryModule.bindPanelControls();
  // 刷新背包時維持開關狀態，不要強制打開
  InventoryModule.setOpen(InventoryModule.panelOpen);
  InventoryModule.syncTabUi();
  InventoryModule.render();
  InventoryModule.updateSlotCount();
  InventoryModule.updateMesoDisplay();
  InventoryModule.updateScroll();
}
