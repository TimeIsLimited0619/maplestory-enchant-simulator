/**
 * 附加能力 BEFORE / AFTER 選擇介面（fullScreen_bonusStat）
 */
const BonusStatChoiceModule = {
  before: null,
  after: null,
  originalBefore: null,
  rollCount: 1,
  baseAtk: null,
  closing: false,
  selectedSide: null,
  closeTimer: null,

  isOpen() {
    return !document.getElementById('bsChoiceOverlay')?.classList.contains('hidden');
  },

  isAutoRolling() {
    return typeof AutoEnchantBonusStatModule !== 'undefined'
      && AutoEnchantBonusStatModule.isRunning
      && AutoEnchantBonusStatModule.isMemorialAutoMode?.();
  },

  isAutoPickPending() {
    return typeof AutoEnchantBonusStatModule !== 'undefined'
      && AutoEnchantBonusStatModule.choiceAutoSessionActive;
  },

  isMemorialAutoChoiceUi() {
    return typeof AutoEnchantBonusStatModule !== 'undefined'
      && AutoEnchantBonusStatModule.memorialAutoOverlayActive;
  },

  isAutoEnchantMode() {
    return this.isMemorialAutoChoiceUi();
  },

  getConfirmButtonMode() {
    if (!this.isMemorialAutoChoiceUi()) return 'manual';
    if (this.isAutoRolling()) return 'cancel';
    return 'restart';
  },

  getConfirmButtonAssets() {
    const mode = this.getConfirmButtonMode();
    if (mode === 'cancel') return BONUS_STAT_CHOICE_CONFIRM_UI.autoEnchantCancel;
    if (mode === 'restart') return BONUS_STAT_CHOICE_CONFIRM_UI.autoEnchantConfirm;
    return BONUS_STAT_CHOICE_CONFIRM_UI.confirm;
  },

  paintConfirmButton(btn, state = 'normal') {
    if (!btn) return;
    const assets = this.getConfirmButtonAssets();
    const mode = this.getConfirmButtonMode();
    let key = state;
    if (btn.disabled && mode !== 'cancel') key = 'disabled';
    const src = assets[key] || assets.normal;
    if (src) btn.style.backgroundImage = `url('${src}')`;
  },

  applyConfirmButtonSkin(btn) {
    if (!btn || btn.dataset.bsConfirmSkinBound === '1') return;
    btn.dataset.bsConfirmSkinBound = '1';

    btn.addEventListener('mouseenter', () => {
      if (!btn.disabled) this.paintConfirmButton(btn, 'mouseOver');
    });
    btn.addEventListener('mouseleave', () => {
      if (!btn.disabled) this.paintConfirmButton(btn, 'normal');
    });
    btn.addEventListener('mousedown', () => {
      if (!btn.disabled) this.paintConfirmButton(btn, 'pressed');
    });
    btn.addEventListener('mouseup', () => {
      if (!btn.disabled) this.paintConfirmButton(btn, 'mouseOver');
    });
  },

  onConfirmButtonClick() {
    const mode = this.getConfirmButtonMode();
    if (mode === 'cancel') {
      AutoEnchantBonusStatModule.cancel(true);
      return;
    }
    if (mode === 'restart') {
      AutoEnchantBonusStatModule.restartMemorialAutoFromChoice?.();
      return;
    }
    this.rerollOnce();
  },

  syncAutoEnchantLayout() {
    if (typeof aeBsSyncChoiceAutoEnchantLayout === 'function') {
      aeBsSyncChoiceAutoEnchantLayout();
    }
  },

  open(before, after, rollCount = 1) {
    this.openAutoSession(before, after, rollCount, { fadeIn: true });
  },

  openAutoSession(before, after, rollCount = 1, { fadeIn = true } = {}) {
    this.before = cloneBonusStatState(before);
    this.after = cloneBonusStatState(after);
    this.originalBefore = cloneBonusStatState(before);
    this.rollCount = rollCount;
    this.baseAtk = this.before?.atkPow ?? 0;
    this.closing = false;
    this.selectedSide = null;

    const overlay = document.getElementById('bsChoiceOverlay');
    if (overlay) {
      this.closing = false;
      if (fadeIn && overlay.classList.contains('hidden') && typeof beginModalFadeIn === 'function') {
        beginModalFadeIn(overlay);
      } else {
        overlay.classList.remove('hidden');
        overlay.setAttribute('aria-hidden', 'false');
      }
    }

    BonusStatModule.updateResetButtonState?.();
    this.render();
    this.syncAutoEnchantLayout();
  },

  updateAutoSession(before, after, rollCount = 1) {
    this.before = cloneBonusStatState(before);
    this.after = cloneBonusStatState(after);
    this.rollCount = rollCount;
    this.closing = false;
    this.selectedSide = null;
    this.render();
    if (typeof aePotIsAnyAutoEnchantRunning !== 'function' || !aePotIsAnyAutoEnchantRunning()) {
      if (typeof updateStatusPanel === 'function') updateStatusPanel();
    }
    this.syncAutoEnchantLayout();
  },

  close() {
    this.clearCloseTimer();
    this.before = null;
    this.after = null;
    this.originalBefore = null;
    this.baseAtk = null;
    this.closing = false;
    this.selectedSide = null;

    const overlay = document.getElementById('bsChoiceOverlay');
    if (overlay) {
      overlay.classList.add('hidden');
      if (typeof clearModalFadeState === 'function') clearModalFadeState(overlay);
      overlay.setAttribute('aria-hidden', 'true');
      overlay.classList.remove('is-closing');
    }

    document.getElementById('bsChoiceBefore')?.classList.remove('is-selected');
    document.getElementById('bsChoiceAfter')?.classList.remove('is-selected');

    BonusStatModule.updateUI?.();
    BonusStatModule.updateResetButtonState?.();
    if (typeof AutoEnchantBonusStatModule !== 'undefined') {
      AutoEnchantBonusStatModule.onChoiceOverlayClosed?.();
    }
    this.syncAutoEnchantLayout();
  },

  clearCloseTimer() {
    if (this.closeTimer) {
      clearTimeout(this.closeTimer);
      this.closeTimer = null;
    }
  },

  selectSide(side) {
    if (!this.isOpen() || this.closing || !this.before || !this.after) return;
    if (this.isAutoRolling()) return;
    if (side !== 'before' && side !== 'after') return;

    this.selectedSide = side;
    this.closing = true;
    document.getElementById('bsChoiceBtnConfirm')?.setAttribute('disabled', 'disabled');

    const overlay = document.getElementById('bsChoiceOverlay');
    overlay?.classList.add('is-closing');

    document.getElementById('bsChoiceBefore')?.classList.toggle('is-selected', side === 'before');
    document.getElementById('bsChoiceAfter')?.classList.toggle('is-selected', side === 'after');

    this.closeTimer = setTimeout(() => {
      const chosen = side === 'after' ? this.after : this.before;
      BonusStatModule.applyChoiceResult(chosen);
      addLog(
        `🔥 附加能力：已套用${side === 'after' ? ' AFTER' : ' BEFORE'} 結果。`,
        'log-success'
      );
      this.close();
    }, 500);
  },

  renderLines(container, state) {
    if (!container) return;
    const lines = state?.lines || [];
    if (!lines.length) {
      container.innerHTML = '<div class="bs-choice-line bs-choice-line--empty">-</div>';
      return;
    }

    container.innerHTML = lines.map((line) => {
      const parts = formatBonusStatLineDisplay(line, BonusStatModule.itemData);
      return (
        `<div class="bs-choice-line">`
        + `<img class="bs-choice-icon bs-pixel-image" src="${BONUS_STAT_CHOICE_UI.detailIcon(parts.iconIndex)}" alt="" draggable="false">`
        + `<span class="bs-choice-text">${parts.label} ${parts.value}</span>`
        + `</div>`
      );
    }).join('');
  },

  renderSumList(container, state) {
    if (!container) return;
    const lines = state?.lines || [];
    if (!lines.length) {
      container.innerHTML = '<div class="bs-choice-sum-line bs-choice-sum-line--empty">-</div>';
      return;
    }

    const rows = aggregateBonusStatLines(lines, BonusStatModule.itemData);
    if (!rows.length) {
      container.innerHTML = '<div class="bs-choice-sum-line bs-choice-sum-line--empty">-</div>';
      return;
    }

    container.innerHTML = rows.map((row) => {
      const mainClass = BONUS_STAT_DETAIL_MAIN_IDS.has(row.statId)
        ? ' bs-choice-sum-line--main'
        : '';
      return (
        `<div class="bs-choice-sum-line${mainClass}">`
        + `<span class="bs-choice-sum-label">${row.label}</span>`
        + `<span class="bs-choice-sum-value">${formatAggregatedBonusStatValue(row)}</span>`
        + `</div>`
      );
    }).join('');
  },

  applyChoiceLayoutOffsets() {
    const layout = typeof BONUS_STAT_LAYOUT !== 'undefined' ? BONUS_STAT_LAYOUT : null;
    if (!layout) return;

    const lineOffset = layout.choiceLines || { x: 0, y: 0 };
    const levelOffset = layout.choiceLevel || { x: 0, y: -18 };
    const sumOffset = layout.choiceSum || { x: 0, y: 0 };
    const lineBase = { top: 75, left: 27, right: 29 };
    const sumBase = { top: 205, left: 43, width: 146 };
    const lineTop = lineBase.top + lineOffset.y;
    const lineLeft = lineBase.left + lineOffset.x;

    document.querySelectorAll('.bs-choice-line-list').forEach((el) => {
      el.style.top = `${lineTop}px`;
      el.style.left = `${lineLeft}px`;
      el.style.right = `${Math.max(0, lineBase.right - lineOffset.x)}px`;
    });

    document.querySelectorAll('.bs-choice-level').forEach((el) => {
      el.style.top = `${lineTop + (levelOffset.y || 0)}px`;
      el.style.left = `${lineLeft + (levelOffset.x || 0)}px`;
      el.style.transform = 'none';
    });

    document.querySelectorAll('.bs-choice-sum-list').forEach((el) => {
      el.style.top = `${sumBase.top + sumOffset.y}px`;
      el.style.left = `${sumBase.left + sumOffset.x}px`;
      el.style.width = `${sumBase.width}px`;
    });
  },

  renderAtk(el, state, side) {
    if (!el || !state) return;
    const delta = (state.atkPow || 0) - (this.baseAtk || 0);
    if (side === 'before' || delta === 0) {
      el.textContent = '-';
      el.classList.remove('bs-atk-up', 'bs-atk-down');
      return;
    }
    el.textContent = formatBonusStatAtkPow(delta);
    el.classList.toggle('bs-atk-up', delta > 0);
    el.classList.toggle('bs-atk-down', delta < 0);
  },

  rerollOnce() {
    if (!this.isOpen() || this.closing || !this.originalBefore) return;
    if (this.getConfirmButtonMode() !== 'manual') return;

    const block = BonusStatModule.getResetBlockReason?.();
    if (block) {
      return addLog(`⚠️ ${block}`, 'log-fail');
    }

    if (!BonusStatModule.payResetCost(1)) {
      return addLog('⚠️ 請選擇要使用的道具。', 'log-fail');
    }

    BonusStatModule.lastAtkPow = BonusStatModule.itemData.bonusStat.atkPow;
    const consumable = BonusStatModule.getSelectedItem();
    const after = rollBonusStatState(cloneBonusStatState(this.originalBefore), {
      equip: BonusStatModule.itemData,
      consumable,
      starFireType: consumable?.starFireType,
    });

    this.after = after;
    this.rollCount = 1;
    this.baseAtk = this.originalBefore?.atkPow ?? 0;
    this.render();
    addLog('🔥 附加能力：已重新設定 1 次。', 'log-success');
  },

  renderConfirmBox() {
    const box = document.getElementById('bsChoiceConfirmBox');
    const btn = document.getElementById('bsChoiceBtnConfirm');
    const stockIcon = document.getElementById('bsChoiceStockIcon');
    const stockCount = document.getElementById('bsChoiceStockCount');
    const costCount = document.getElementById('bsChoiceCostCount');
    const item = BonusStatModule.getSelectedItem?.();

    if (box) {
      box.classList.toggle('hidden', !item);
    }
    if (!item) return;

    const count = getPlayerBonusStatItemCount(item.id);
    if (stockIcon) {
      stockIcon.src = item.icon;
      stockIcon.alt = item.name;
      if (item.iconWidth) stockIcon.style.width = `${item.iconWidth}px`;
      if (item.iconHeight) stockIcon.style.height = `${item.iconHeight}px`;
    }
    if (stockCount) {
      stockCount.textContent = `${count}`;
    }
    if (costCount) {
      costCount.textContent = `${this.rollCount}`;
    }
    if (btn) {
      this.applyConfirmButtonSkin(btn);
      btn.disabled = this.closing;
      btn.setAttribute(
        'aria-label',
        this.getConfirmButtonMode() === 'cancel'
          ? '中止自動強化'
          : (this.getConfirmButtonMode() === 'restart' ? '重新開始自動強化' : '重新設定1次')
      );
      this.paintConfirmButton(btn, btn.disabled ? 'disabled' : 'normal');
    }
  },

  renderAutoAssets() {
    const autoMode = this.isAutoEnchantMode();
    const overlay = document.getElementById('bsChoiceOverlay');
    overlay?.classList.toggle('is-auto-enchant-mode', autoMode);

    const infoTopImg = document.getElementById('bsChoiceInfoTopImg');
    if (infoTopImg) {
      const applyInfoTopSize = () => {
        if (!infoTopImg.naturalWidth || !infoTopImg.naturalHeight) return;
        bsApplyPixelImage(infoTopImg, infoTopImg.naturalWidth, infoTopImg.naturalHeight);
      };
      infoTopImg.onload = applyInfoTopSize;
      infoTopImg.src = autoMode
        ? BONUS_STAT_CHOICE_UI.infoAutoBtm
        : BONUS_STAT_CHOICE_UI.infoTop;
      if (infoTopImg.complete) applyInfoTopSize();
    }
  },

  renderAutoState() {
    const overlay = document.getElementById('bsChoiceOverlay');
    if (!overlay) return;
    const rolling = this.isAutoRolling();
    overlay.classList.toggle('is-auto-rolling', rolling);
    overlay.classList.toggle('is-auto-pick-pending', this.isAutoPickPending());
    overlay.classList.toggle('is-auto-restart-ready', this.isMemorialAutoChoiceUi() && !rolling);
  },

  renderLevel(el, state) {
    if (!el) return;
    const sum = typeof calcBonusStatStarTierSum === 'function'
      ? calcBonusStatStarTierSum(state?.lines)
      : 0;
    el.textContent = String(sum);
    el.setAttribute('aria-label', `詞條等級總和 ${sum}`);
    el.title = `詞條等級總和 ${sum}`;
  },

  render() {
    this.applyChoiceLayoutOffsets();
    this.renderAutoState();
    this.renderAutoAssets();
    this.renderLines(document.getElementById('bsChoiceLinesBefore'), this.before);
    this.renderLines(document.getElementById('bsChoiceLinesAfter'), this.after);
    this.renderSumList(document.getElementById('bsChoiceSumBefore'), this.before);
    this.renderSumList(document.getElementById('bsChoiceSumAfter'), this.after);
    this.renderConfirmBox();
    this.renderAtk(document.getElementById('bsChoiceAtkBefore'), this.before, 'before');
    this.renderAtk(document.getElementById('bsChoiceAtkAfter'), this.after, 'after');
    this.renderLevel(document.getElementById('bsChoiceLevelBefore'), this.before);
    this.renderLevel(document.getElementById('bsChoiceLevelAfter'), this.after);

    const rollHint = document.getElementById('bsChoiceRollHint');
    if (rollHint) {
      rollHint.textContent = this.rollCount > 1 ? `（${this.rollCount}次重設結果）` : '';
    }
  },
};
