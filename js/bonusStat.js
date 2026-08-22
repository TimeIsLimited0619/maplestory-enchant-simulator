/**
 * BonusStatModule - 附加能力主面板
 */
const BonusStatModule = {
  itemData: null,
  costTab: 'meso',
  selectedItemId: null,
  showStatDetail: false,
  lastAtkPow: null,
  pendingRollCount: 1,

  loadEquip(item) {
    const itemChanged = this.itemData !== item;
    if (itemChanged && typeof AutoEnchantBonusStatModule !== 'undefined') {
      AutoEnchantBonusStatModule.onEquipChanged();
    }
    this.itemData = item;
    if (!this.itemData.bonusStat) {
      this.itemData.bonusStat = getDefaultBonusStatState();
    }
    this.selectedItemId = null;
    this.lastAtkPow = this.itemData.bonusStat.atkPow;
    this.updateUI();
  },

  resetState() {
    if (typeof AutoEnchantBonusStatModule !== 'undefined') {
      AutoEnchantBonusStatModule.onEquipChanged();
    }
    this.hideItemTooltip();
    this.itemData = null;
    this.selectedItemId = null;
    this.showStatDetail = false;
    this.lastAtkPow = null;
    this.pendingRollCount = 1;
    this.updateUI();
    this.updateResetButtonState();
  },

  setIdleMode(isIdle) {
    const idlePanel = document.getElementById('bsIdlePanel');
    const activePanel = document.getElementById('bsActivePanel');

    if (idlePanel) idlePanel.classList.toggle('hidden', !isIdle);
    if (activePanel) activePanel.classList.toggle('hidden', isIdle);

    if (typeof syncMainPanelIdleState === 'function') {
      syncMainPanelIdleState();
    }
    this.updateResetButtonState();
  },

  isChoiceOverlayOpen() {
    return !document.getElementById('bsChoiceOverlay')?.classList.contains('hidden');
  },

  isBonusStatOverlayOpen() {
    return this.isChoiceOverlayOpen()
      || (typeof AutoEnchantBonusStatModule !== 'undefined' && AutoEnchantBonusStatModule.isOpen);
  },

  setCostTab(tab) {
    if (tab !== 'meso' && tab !== 'item') return;
    this.costTab = tab;
    if (tab === 'meso') {
      this.selectedItemId = null;
      this.hideItemTooltip();
    }
    this.updateUI();
  },

  selectItem(itemId) {
    if (!this.itemData) return;
    const item = getBonusStatItemById(itemId);
    if (!item) return;
    this.costTab = 'item';
    this.selectedItemId = this.selectedItemId === itemId ? null : itemId;
    this.updateUI();
  },

  getSelectedItem() {
    if (!this.selectedItemId) return null;
    return getBonusStatItemById(this.selectedItemId);
  },

  toggleStatDetail() {
    this.showStatDetail = !this.showStatDetail;
    this.updateUI();
  },

  canReset() {
    if (!this.itemData?.bonusStat) return false;
    if (typeof canUseBonusStat === 'function' && !canUseBonusStat(this.itemData)) return false;
    if (this.isBonusStatOverlayOpen()) return false;
    if (typeof AutoEnchantBonusStatModule !== 'undefined' && AutoEnchantBonusStatModule.isRunning) {
      return false;
    }
    if (typeof BonusStatEffectModule !== 'undefined' && BonusStatEffectModule.isPlaying()) {
      return false;
    }

    if (this.costTab === 'meso') {
      return true;
    }

    return Boolean(this.getSelectedItem());
  },

  getResetBlockReason() {
    if (!this.itemData) return '請先放置裝備。';
    if (typeof canUseBonusStat === 'function' && !canUseBonusStat(this.itemData)) {
      return '此裝備無法使用附加能力。';
    }
    if (this.costTab === 'item' && !this.getSelectedItem()) {
      return '請選擇要使用的道具。';
    }
    return null;
  },

  payResetCost(count = 1) {
    if (this.costTab === 'meso') {
      if (typeof trackCostEvent === 'function') {
        const meso = getBonusStatMesoCost(this.itemData.bonusStat.level) * count;
        trackCostEvent('bonusStatMeso', meso);
      }
      return true;
    }

    const item = this.getSelectedItem();
    if (!item) return false;
    consumePlayerBonusStatItem(item.id, count);
    if (typeof trackCostEvent === 'function') {
      trackCostEvent(`bonusStatItem:${item.id}`, count);
    }
    if (typeof trackBonusStatCatValleyCost === 'function') {
      trackBonusStatCatValleyCost(this.itemData, count);
    }
    return true;
  },

  performRoll(baseState = null) {
    const consumable = this.costTab === 'item' ? this.getSelectedItem() : null;
    const source = baseState || this.itemData.bonusStat;
    const starFireType = getBonusStatRollStarFireType(
      this.costTab,
      consumable,
      source
    );
    const before = cloneBonusStatState(source);
    const after = rollBonusStatState(before, {
      equip: this.itemData,
      consumable,
      starFireType,
    });
    return { before, after };
  },

  handleResetClick(mode = 'normal') {
    if (!this.itemData) return;

    const block = this.getResetBlockReason();
    if (block) {
      return addLog(`⚠️ ${block}`, 'log-fail');
    }

    const selectedItem = this.getSelectedItem();
    if (mode === 'triple' && !selectedItem?.tripleReset) {
      return addLog('⚠️ 三次重設僅限覺醒的暗黑輪迴星火使用。', 'log-fail');
    }

    const rollCount = mode === 'triple' ? 3 : 1;
    const starFireType = getBonusStatRollStarFireType(
      this.costTab,
      selectedItem,
      this.itemData.bonusStat
    );
    const showChoice = bonusStatShouldShowChoiceOverlay(this.costTab, selectedItem, mode);
    const successVariant = showChoice ? 1 : 0;

    const applyReset = () => {
      this.payResetCost(rollCount);
      this.lastAtkPow = this.itemData.bonusStat.atkPow;
      const { before, after } = this.performRoll();
      let result = after;

      if (mode === 'triple') {
        let current = after;
        for (let i = 1; i < rollCount; i += 1) {
          current = rollBonusStatState(current, {
            equip: this.itemData,
            consumable: selectedItem,
            starFireType: selectedItem?.starFireType,
          });
        }
        result = current;
      }

      if (showChoice) {
        this.openChoiceOverlay(before, result, rollCount);
      } else {
        this.applyChoiceResult(result);
      }

      const costLabel = this.costTab === 'meso'
        ? formatMesoAmount(getBonusStatMesoCost(before.level) * rollCount)
        : `${selectedItem?.name || '道具'} ×${rollCount}`;
      addLog(`🔥 附加能力重設（${costLabel}）`, 'log-success');
      this.updateResetButtonState();
    };

    if (typeof BonusStatEffectModule !== 'undefined') {
      BonusStatEffectModule.runWithAnim({
        starFireType,
        successVariant,
        fn: applyReset,
      });
      return;
    }

    applyReset();
  },

  openChoiceOverlay(before, after, rollCount = 1) {
    if (typeof BonusStatChoiceModule !== 'undefined') {
      BonusStatChoiceModule.open(before, after, rollCount);
    }
  },

  applyChoiceResult(chosen, opts = {}) {
    if (!chosen || !this.itemData) return;
    this.itemData.bonusStat = cloneBonusStatState(chosen);
    if (opts.skipUi) return;
    this.updateUI();
    if (typeof updateStatusPanel === 'function') updateStatusPanel();
  },

  renderSummaryBox() {
    const box = document.getElementById('bsSummaryBox');
    const frame = document.getElementById('bsSummaryFrame');
    const level = document.getElementById('bsSummaryLevel');
    if (!box || !frame || !level || !this.itemData?.bonusStat) return;

    const levelNum = getBonusStatSummaryBoxLevel(this.itemData.bonusStat);
    const frameSrc = BONUS_STAT_UI.summaryBoxFrame;
    const levelSrc = BONUS_STAT_UI.summaryLevel(levelNum);
    const levelChanging = level.getAttribute('src') !== levelSrc;
    const frameChanging = frame.getAttribute('src') !== frameSrc;

    if (levelChanging || frameChanging) {
      box.classList.add('bs-summary-box--pending');
    }

    const syncSummaryBoxLayout = () => {
      if (!frame.naturalWidth || !frame.naturalHeight
        || !level.naturalWidth || !level.naturalHeight) return;

      const frameW = Math.round(frame.naturalWidth);
      const frameH = Math.round(frame.naturalHeight);
      const levelW = Math.round(level.naturalWidth);
      const levelH = Math.round(level.naturalHeight);

      bsApplyPixelImage(frame, frameW, frameH);
      bsApplyPixelImage(level, levelW, levelH);

      const levelOffset = BONUS_STAT_LAYOUT?.summaryLevel || { x: 0, y: 0 };

      box.style.width = `${frameW}px`;
      box.style.height = `${frameH}px`;
      box.style.transform = 'none';
      box.style.left = `${Math.round((bsGetBonusStatPanelWidth() - frameW) / 2)}px`;

      level.style.left = `${Math.round((frameW - levelW) / 2) + Math.round(levelOffset.x || 0)}px`;
      level.style.top = `${Math.round((frameH - levelH) / 2) + Math.round(levelOffset.y || 0)}px`;
      box.classList.remove('bs-summary-box--pending');
    };

    const trySync = () => {
      if (!frame.complete || !level.complete) return;
      if (!frame.naturalWidth || !level.naturalWidth) return;
      syncSummaryBoxLayout();
    };

    frame.onload = trySync;
    level.onload = trySync;

    if (frameChanging) frame.src = frameSrc;
    if (levelChanging) level.src = levelSrc;
    level.alt = `星火等級總和 ${levelNum}`;
    box.setAttribute('aria-label', level.alt);

    const waitForImage = (img, changing) => {
      if (!changing) return Promise.resolve();
      if (typeof img.decode === 'function') {
        return img.decode().catch(() => {});
      }
      return new Promise((resolve) => {
        if (img.complete) resolve();
        else img.addEventListener('load', resolve, { once: true });
      });
    };

    Promise.all([
      waitForImage(frame, frameChanging),
      waitForImage(level, levelChanging),
    ]).then(trySync);

    if (!frameChanging && !levelChanging) trySync();
  },

  renderStatList() {
    const list = document.getElementById('bsStatList');
    if (!list || !this.itemData?.bonusStat) return;

    const lines = this.itemData.bonusStat.lines || [];
    list.classList.toggle('bs-stat-values--detail', !this.showStatDetail);

    if (!lines.length) {
      list.innerHTML = '<div class="bs-stat-line bs-stat-line--empty">尚無附加能力</div>';
      return;
    }

    if (this.showStatDetail) {
      list.innerHTML = lines.map((line) => {
        const parts = formatBonusStatLineDisplay(line, this.itemData);
        return (
          `<div class="bs-stat-line">`
          + `<img class="bs-stat-icon bs-pixel-image" src="${BONUS_STAT_UI.statIcon(parts.iconIndex)}" alt="" draggable="false">`
          + `<span class="bs-stat-label">${parts.label}</span>`
          + `<span class="bs-stat-value">${parts.value}</span>`
          + `</div>`
        );
      }).join('');

      list.querySelectorAll('.bs-stat-icon').forEach((icon) => {
        const applyIconSize = () => {
          if (!icon.naturalWidth || !icon.naturalHeight) return;
          bsApplyPixelImage(icon, icon.naturalWidth, icon.naturalHeight);
        };
        icon.onload = applyIconSize;
        if (icon.complete) applyIconSize();
      });
      return;
    }

    const rows = aggregateBonusStatLines(lines, this.itemData);
    if (!rows.length) {
      list.innerHTML = '<div class="bs-stat-line bs-stat-line--empty">尚無附加能力</div>';
      return;
    }

    list.innerHTML = rows.map((row) => {
      const label = row.label;
      const value = formatAggregatedBonusStatValue(row);
      const mainClass = BONUS_STAT_DETAIL_MAIN_IDS.has(row.statId)
        ? ' bs-stat-line--detail-main'
        : '';
      return (
        `<div class="bs-stat-line bs-stat-line--detail${mainClass}">`
        + `<span class="bs-stat-label">${label}</span>`
        + `<span class="bs-stat-value">${value}</span>`
        + `</div>`
      );
    }).join('');
  },

  renderAtkPow() {
    const display = document.getElementById('bsAtkPowChange');
    if (!display || !this.itemData?.bonusStat) return;

    const current = this.itemData.bonusStat.atkPow || 0;
    if (this.lastAtkPow == null) {
      display.textContent = '-';
      display.classList.remove('bs-atk-up', 'bs-atk-down');
      return;
    }

    const delta = current - this.lastAtkPow;
    if (delta === 0) {
      display.textContent = '-';
      display.classList.remove('bs-atk-up', 'bs-atk-down');
      return;
    }

    display.textContent = formatBonusStatAtkPow(delta);
    display.classList.toggle('bs-atk-up', delta > 0);
    display.classList.toggle('bs-atk-down', delta < 0);
  },

  renderCostTab() {
    const mesoTab = document.getElementById('bsCostTabMeso');
    const itemTab = document.getElementById('bsCostTabItem');
    const mesoPanel = document.getElementById('bsCostMesoPanel');
    const itemPanel = document.getElementById('bsCostItemPanel');

    if (mesoTab) {
      const mesoSrc = this.costTab === 'meso'
        ? BONUS_STAT_UI.costTab.mesoSelected
        : BONUS_STAT_UI.costTab.mesoNormal;
      mesoTab.style.background = `transparent url('${mesoSrc}') no-repeat 0 0 / auto`;
    }
    if (itemTab) {
      const itemSrc = this.costTab === 'item'
        ? BONUS_STAT_UI.costTab.itemSelected
        : BONUS_STAT_UI.costTab.itemNormal;
      itemTab.style.background = `transparent url('${itemSrc}') no-repeat 0 0 / auto`;
    }
    if (mesoPanel) mesoPanel.classList.toggle('hidden', this.costTab !== 'meso');
    if (itemPanel) itemPanel.classList.toggle('hidden', this.costTab !== 'item');
  },

  renderMesoCost() {
    const el = document.getElementById('bsMesoCost');
    if (!el) return;
    const level = this.itemData?.bonusStat?.level ?? 1;
    el.textContent = formatMesoAmount(getBonusStatMesoCost(level));
  },

  applyLayoutOffsets() {
    const panel = document.getElementById('panel-bonusStat');
    if (!panel || typeof BONUS_STAT_LAYOUT === 'undefined') return;

    const layout = BONUS_STAT_LAYOUT;
    const mesoRow = panel.querySelector('.bs-meso-row');
    if (mesoRow) {
      mesoRow.style.position = 'absolute';
      mesoRow.style.inset = 'auto';
      mesoRow.style.left = `${199 + layout.mesoText.x}px`;
      mesoRow.style.top = `${59 + layout.mesoText.y}px`;
      mesoRow.style.transform = 'translate(-50%, -50%)';
      mesoRow.style.height = 'auto';
      mesoRow.style.width = 'auto';
      mesoRow.style.padding = '0';
    }

    const grid = document.getElementById('bsItemGrid');
    if (grid) {
      grid.style.position = 'absolute';
      grid.style.top = `${layout.itemGrid.y}px`;
      grid.style.left = `${layout.itemGrid.x}px`;
    }

    panel.querySelectorAll('.bs-item-icon').forEach((icon) => {
      icon.style.position = 'relative';
      icon.style.left = `${layout.itemIcon.x}px`;
      icon.style.top = `${layout.itemIcon.y}px`;
    });

    if (layout.itemSlotSelected) {
      const sel = layout.itemSlotSelected;
      const nativeW = sel.nativeWidth ?? 36;
      const nativeH = sel.nativeHeight ?? 36;
      const resolveSize = (value, native) => {
        if (value === 'auto') return `${native}px`;
        if (typeof value === 'number') return `${value}px`;
        return value;
      };
      panel.style.setProperty('--bs-slot-selected-x', `${sel.x}px`);
      panel.style.setProperty('--bs-slot-selected-y', `${sel.y}px`);
      panel.style.setProperty('--bs-slot-selected-w', resolveSize(sel.width, nativeW));
      panel.style.setProperty('--bs-slot-selected-h', resolveSize(sel.height, nativeH));
    }

    const help = document.getElementById('bsHelpArea');
    if (help) {
      const item = this.getSelectedItem();
      const helpX = item?.memorial ? layout.helpMemorial.x : layout.help.x;
      help.style.position = 'absolute';
      help.style.left = `${helpX}px`;
      help.style.top = `${layout.help.y + layout.help.yOffset}px`;
      help.style.right = 'auto';
      help.style.bottom = 'auto';
      help.style.transform = 'none';
    }

    const statList = document.getElementById('bsStatList');
    if (statList && layout.statList) {
      statList.style.marginLeft = `${layout.statList.x}px`;
      statList.style.marginTop = `${layout.statList.y}px`;
    }

    const statDetail = layout.statDetail;
    const detailToggle = document.getElementById('bsStatDetailToggle');
    const detailLabel = document.getElementById('bsStatDetailLabel');
    if (statDetail) {
      if (detailToggle) {
        detailToggle.style.position = 'relative';
        detailToggle.style.left = `${statDetail.toggle.x}px`;
        detailToggle.style.top = `${statDetail.toggle.y}px`;
      }
      if (detailLabel) {
        detailLabel.style.position = 'relative';
        detailLabel.style.left = `${statDetail.label.x}px`;
        detailLabel.style.top = `${statDetail.label.y}px`;
      }
    }
  },

  initItemGrid() {
    const grid = document.getElementById('bsItemGrid');
    if (!grid || grid.dataset.tooltipReady === '1') return;

    grid.addEventListener('mouseover', (event) => {
      const slot = event.target.closest('.bs-item-slot.has-item');
      if (!slot || grid._tooltipSlot === slot) return;

      grid._tooltipSlot = slot;
      const item = getBonusStatItemById(slot.dataset.itemId);
      if (item) this.showItemTooltip(slot, item);
    });

    grid.addEventListener('mouseout', (event) => {
      const slot = event.target.closest('.bs-item-slot.has-item');
      if (!slot) return;

      const related = event.relatedTarget;
      if (related instanceof Node && slot.contains(related)) return;

      if (grid._tooltipSlot === slot) {
        grid._tooltipSlot = null;
        this.hideItemTooltip();
      }
    });

    grid.addEventListener('mouseleave', () => {
      grid._tooltipSlot = null;
      this.hideItemTooltip();
    });

    grid.dataset.tooltipReady = '1';
    this.bindCatValleyRatesToggle();
  },

  bindCatValleyRatesToggle() {
    const catValleyRatesCheck = document.getElementById('chkBonusStatCatValleyRates');
    if (!catValleyRatesCheck || catValleyRatesCheck.dataset.bound === '1') return;
    catValleyRatesCheck.dataset.bound = '1';
    if (typeof isBonusStatCatValleyRatesEnabled === 'function') {
      catValleyRatesCheck.checked = isBonusStatCatValleyRatesEnabled();
    }
    catValleyRatesCheck.addEventListener('change', () => {
      if (typeof setBonusStatCatValleyRatesEnabled === 'function') {
        setBonusStatCatValleyRatesEnabled(catValleyRatesCheck.checked);
      }
      if (typeof BonusStatInspectModule !== 'undefined' && BonusStatInspectModule.isOpen) {
        BonusStatInspectModule.render();
      }
    });
  },

  showItemTooltip(slot, item) {
    const tooltip = document.getElementById('bsItemTooltip');
    const img = document.getElementById('bsItemTooltipImg');
    const detailPath = getBonusStatItemTooltipPath(item);
    if (!tooltip || !img || !detailPath) return;

    img.src = detailPath;
    img.alt = item.name || '星火詳細資訊';
    tooltip.classList.remove('hidden');
    tooltip.setAttribute('aria-hidden', 'false');

    const positionTooltip = () => {
      const rect = slot.getBoundingClientRect();
      const gap = 8;
      let left = rect.left - tooltip.offsetWidth - gap;
      let top = rect.top;

      if (left < 8) {
        left = rect.right + gap;
      }

      const maxTop = window.innerHeight - tooltip.offsetHeight - 8;
      if (top > maxTop) top = Math.max(8, maxTop);
      if (top < 8) top = 8;

      tooltip.style.left = `${left}px`;
      tooltip.style.top = `${top}px`;
    };

    if (img.complete) {
      positionTooltip();
    } else {
      img.onload = () => {
        img.onload = null;
        positionTooltip();
      };
    }
  },

  hideItemTooltip() {
    const tooltip = document.getElementById('bsItemTooltip');
    const img = document.getElementById('bsItemTooltipImg');
    const grid = document.getElementById('bsItemGrid');
    if (grid) grid._tooltipSlot = null;

    if (!tooltip) return;
    tooltip.classList.add('hidden');
    tooltip.setAttribute('aria-hidden', 'true');
    tooltip.style.removeProperty('left');
    tooltip.style.removeProperty('top');

    if (img) {
      img.onload = null;
      img.removeAttribute('src');
      img.alt = '';
    }
  },

  renderSelectedItemName() {
    const nameEl = document.getElementById('bsSelectedItemName');
    if (!nameEl) return;
    const item = this.getSelectedItem();
    nameEl.textContent = item ? item.name : '';
  },

  renderItemGrid() {
    const grid = document.getElementById('bsItemGrid');
    if (!grid) return;

    this.hideItemTooltip();

    grid.querySelectorAll('.bs-item-slot').forEach((slot) => {
      const slotIndex = Number(slot.dataset.slotIndex);
      const item = getBonusStatItemBySlot(slotIndex);
      const hasEquip = Boolean(this.itemData);

      slot.classList.toggle('has-item', Boolean(item));
      slot.classList.toggle('selected', Boolean(item && this.selectedItemId === item.id));
      slot.classList.toggle('is-blocked', Boolean(item && !hasEquip));
      slot.innerHTML = '';
      slot.disabled = false;

      if (!item) return;

      slot.dataset.itemId = item.id;
      const w = item.iconWidth || 32;
      const h = item.iconHeight || 32;
      slot.innerHTML = `
        <img class="bs-item-icon" src="${item.icon}" alt="${item.name}" width="${w}" height="${h}">
      `;
      slot.onclick = () => this.selectItem(item.id);
    });

    this.renderSelectedItemName();
    this.applyLayoutOffsets();
  },

  renderHelp() {
    const area = document.getElementById('bsHelpArea');
    const img = document.getElementById('bsHelpImage');
    const item = this.getSelectedItem();
    const show = Boolean(item && this.itemData && this.costTab === 'item');

    if (area) {
      area.classList.toggle('hidden', !show);
      area.setAttribute('aria-hidden', show ? 'false' : 'true');
    }
    if (!img || !show) {
      this.applyLayoutOffsets();
      return;
    }
    if (item.helpImage) {
      img.src = item.helpImage;
      img.alt = item.name;
    }
    this.applyLayoutOffsets();
  },

  renderStatDetailToggle() {
    const btn = document.getElementById('bsStatDetailToggle');
    const label = document.getElementById('bsStatDetailLabel');
    const indicator = document.getElementById('bsStatDetailIndicator');
    if (!btn) return;

    btn.classList.toggle('is-checked', this.showStatDetail);
    btn.setAttribute('aria-pressed', this.showStatDetail ? 'true' : 'false');
    btn.setAttribute('aria-label', this.showStatDetail ? '詳細資訊：開啟' : '詳細資訊：關閉');

    const applyPixelSize = (img) => {
      if (!img?.naturalWidth || !img.naturalHeight) return;
      bsApplyPixelImage(img, img.naturalWidth, img.naturalHeight);
    };

    if (label) {
      label.src = BONUS_STAT_UI.statDetail.btnNormal;
      label.onload = () => applyPixelSize(label);
      if (label.complete) applyPixelSize(label);
    }

    if (indicator) {
      indicator.src = this.showStatDetail
        ? BONUS_STAT_UI.statDetail.checked
        : BONUS_STAT_UI.statDetail.unchecked;
      indicator.alt = this.showStatDetail ? '詳細資訊已開啟' : '詳細資訊已關閉';

      const applyIndicatorLayout = () => {
        if (!indicator.naturalWidth || !indicator.naturalHeight) return;
        bsApplyPixelImage(indicator, indicator.naturalWidth, indicator.naturalHeight);
        const slotW = 25;
        const slotH = 13;
        indicator.style.left = `${slotW - indicator.naturalWidth}px`;
        indicator.style.top = `${Math.round((slotH - indicator.naturalHeight) / 2)}px`;
      };

      indicator.onload = applyIndicatorLayout;
      if (indicator.complete) applyIndicatorLayout();
    }
  },

  updateResetButtonState() {
    const btn = document.getElementById('btnBonusStatReset');
    const btn1 = document.getElementById('btnBonusStatReset1');
    const btn3 = document.getElementById('btnBonusStatReset3');
    const overlayOpen = this.isBonusStatOverlayOpen();
    const autoRunning = typeof AutoEnchantBonusStatModule !== 'undefined'
      && AutoEnchantBonusStatModule.isRunning;
    const effectPlaying = typeof BonusStatEffectModule !== 'undefined'
      && BonusStatEffectModule.isPlaying();
    const can = this.canReset();

    [btn, btn1, btn3].forEach((el) => {
      if (!el) return;
      el.disabled = !can || overlayOpen || autoRunning || effectPlaying;
      el.classList.toggle('hidden', overlayOpen);
    });
  },

  updateUI() {
    const isIdle = !this.itemData;
    this.setIdleMode(isIdle);
    this.renderCostTab();

    const bottomOptions = document.getElementById('bsBottomOptions');
    if (bottomOptions) bottomOptions.classList.remove('hidden');
    const bottomOptionsLeft = document.getElementById('bsBottomOptionsLeft');
    if (bottomOptionsLeft) bottomOptionsLeft.classList.remove('hidden');
    const catValleyRatesCheck = document.getElementById('chkBonusStatCatValleyRates');
    if (catValleyRatesCheck && typeof isBonusStatCatValleyRatesEnabled === 'function') {
      catValleyRatesCheck.checked = isBonusStatCatValleyRatesEnabled();
    }

    if (typeof AutoEnchantBonusStatModule !== 'undefined') {
      AutoEnchantBonusStatModule.syncAutoCheckbox();
      if (AutoEnchantBonusStatModule.isOpen) {
        AutoEnchantBonusStatModule.render();
      }
    }

    if (isIdle) {
      this.renderMesoCost();
      this.renderItemGrid();
      this.renderHelp();
      this.renderCostTab();
      this.updateResetButtonState();
      this.applyLayoutOffsets();
      if (typeof BonusStatInspectModule !== 'undefined' && BonusStatInspectModule.isOpen) {
        BonusStatInspectModule.starFireType = BonusStatInspectModule.getCurrentStarFireTypeFromModule();
        BonusStatInspectModule.render();
      }
      return;
    }

    this.renderSummaryBox();
    this.renderStatList();
    this.renderAtkPow();
    this.renderMesoCost();
    this.renderItemGrid();
    this.renderHelp();
    this.renderStatDetailToggle();
    this.updateResetButtonState();
    this.applyLayoutOffsets();
    if (typeof BonusStatInspectModule !== 'undefined' && BonusStatInspectModule.isOpen) {
      BonusStatInspectModule.starFireType = BonusStatInspectModule.getCurrentStarFireTypeFromModule();
      BonusStatInspectModule.render();
    }
  },
};

document.addEventListener('DOMContentLoaded', () => {
  BonusStatModule.initItemGrid();
});
