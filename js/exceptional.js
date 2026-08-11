/**
 * ExceptionalModule - 卓越強化（追加強化 / 提取）
 */
const ExceptionalModule = {
  itemData: null,
  subTab: 'enchant',
  busy: false,

  SUMMARY_RED_0: 'images/exceptional/exceptional_summaryBox_red_0.png',

  loadEquip(item) {
    this.itemData = item;
    ensureExceptionalState(item);
    this.updateUI();
  },

  resetState() {
    this.itemData = null;
    this.busy = false;
    this.subTab = 'enchant';
    this.hideHammerHover();
    this.updateUI();
  },

  isEligible(item = this.itemData) {
    return typeof canUseExceptional === 'function' && canUseExceptional(item);
  },

  setPanelMode(mode) {
    const idlePanel = document.getElementById('exIdlePanel');
    const activePanel = document.getElementById('exActivePanel');
    const blockedMsg = document.getElementById('exBlockedMessage');
    const isIdle = mode === 'idle';
    const isBlocked = mode === 'blocked';

    if (idlePanel) idlePanel.classList.toggle('hidden', !isIdle && !isBlocked);
    if (activePanel) activePanel.classList.toggle('hidden', isIdle || isBlocked);
    if (blockedMsg) blockedMsg.classList.toggle('hidden', !isBlocked);

    if (typeof syncMainPanelIdleState === 'function') {
      syncMainPanelIdleState();
    }
    this.updateActionButtons();
  },

  selectSubTab(tab) {
    if (!this.itemData || this.busy) return;
    if (typeof ExceptionalEffectModule !== 'undefined' && ExceptionalEffectModule.isPlaying()) return;

    if (tab === 'enchant' && this.isEnchantDisabled()) return;
    if (tab === 'extract' && this.isExtractDisabled()) return;

    this.subTab = tab;
    this.hideHammerHover();
    this.updateUI();
  },

  isEnchantDisabled() {
    if (!this.itemData || !this.isEligible()) return true;
    return getExceptionalLevel(this.itemData) >= EXCEPTIONAL_MAX_LEVEL;
  },

  isExtractDisabled() {
    if (!this.itemData || !this.isEligible()) return true;
    return getExceptionalLevel(this.itemData) <= 0;
  },

  bindControls() {
    const tabEnchant = document.getElementById('exTabEnchant');
    const tabExtract = document.getElementById('exTabExtract');

    if (tabEnchant && tabEnchant.dataset.bound !== '1') {
      tabEnchant.dataset.bound = '1';
      tabEnchant.addEventListener('click', () => this.selectSubTab('enchant'));
    }
    if (tabExtract && tabExtract.dataset.bound !== '1') {
      tabExtract.dataset.bound = '1';
      tabExtract.addEventListener('click', () => this.selectSubTab('extract'));
    }

    this.bindHammerHover();
  },

  bindHammerHover() {
    ['exHammerIcon', 'exExtractHammerIcon'].forEach((id) => {
      const el = document.getElementById(id);
      if (!el || el.dataset.hoverBound === '1') return;
      el.dataset.hoverBound = '1';
      el.addEventListener('mouseenter', () => this.showHammerHover(el));
      el.addEventListener('mouseleave', () => this.hideHammerHover());
    });
  },

  showHammerHover(anchor) {
    const tooltip = document.getElementById('exHammerTooltip');
    const img = document.getElementById('exHammerTooltipImg');
    const hammer = getExceptionalHammer(this.itemData);
    if (!tooltip || !img || !hammer?.hover || !anchor) return;

    img.src = hammer.hover;
    img.alt = hammer.name || '卓越鐵鎚';
    tooltip.classList.remove('hidden');
    tooltip.setAttribute('aria-hidden', 'false');

    const positionTooltip = () => {
      const rect = anchor.getBoundingClientRect();
      const gap = 8;
      let left = rect.right + gap;
      let top = rect.top;

      if (left + tooltip.offsetWidth > window.innerWidth - 8) {
        left = Math.max(8, rect.left - tooltip.offsetWidth - gap);
      }
      const maxTop = window.innerHeight - tooltip.offsetHeight - 8;
      if (top > maxTop) top = Math.max(8, maxTop);
      if (top < 8) top = 8;

      tooltip.style.left = `${Math.round(left)}px`;
      tooltip.style.top = `${Math.round(top)}px`;
    };

    if (img.complete) positionTooltip();
    else {
      img.onload = () => {
        img.onload = null;
        positionTooltip();
      };
    }
  },

  hideHammerHover() {
    const tooltip = document.getElementById('exHammerTooltip');
    const img = document.getElementById('exHammerTooltipImg');
    if (img) {
      img.removeAttribute('src');
      img.alt = '';
    }
    if (!tooltip) return;
    tooltip.classList.add('hidden');
    tooltip.setAttribute('aria-hidden', 'true');
    tooltip.style.removeProperty('left');
    tooltip.style.removeProperty('top');
  },

  updateUI() {
    this.bindControls();

    if (!this.itemData) {
      this.setPanelMode('idle');
      return;
    }

    if (!this.isEligible()) {
      this.setPanelMode('blocked');
      return;
    }

    if (this.isEnchantDisabled() && this.subTab === 'enchant' && !this.isExtractDisabled()) {
      this.subTab = 'extract';
    } else if (this.isExtractDisabled() && this.subTab === 'extract' && !this.isEnchantDisabled()) {
      this.subTab = 'enchant';
    }

    this.setPanelMode('active');
    this.renderActive();
  },

  renderActive() {
    const root = document.getElementById('exActivePanel');
    if (root) root.dataset.subtab = this.subTab;

    this.renderSubTabs();
    this.renderSummary();
    this.renderEnchantPanel();
    this.renderExtractPanel();
    this.updateActionButtons();
  },

  renderSubTabs() {
    const tabEnchant = document.getElementById('exTabEnchant');
    const tabExtract = document.getElementById('exTabExtract');
    const enchantDisabled = this.isEnchantDisabled();
    const extractDisabled = this.isExtractDisabled();

    if (tabEnchant) {
      tabEnchant.classList.toggle('checked', this.subTab === 'enchant');
      tabEnchant.disabled = enchantDisabled;
    }
    if (tabExtract) {
      tabExtract.classList.toggle('checked', this.subTab === 'extract');
      tabExtract.disabled = extractDisabled;
    }

    const enchantPanel = document.getElementById('exEnchantPanel');
    const extractPanel = document.getElementById('exExtractPanel');
    enchantPanel?.classList.toggle('hidden', this.subTab !== 'enchant');
    extractPanel?.classList.toggle('hidden', this.subTab !== 'extract');
  },

  renderSummary() {
    const beforeEl = document.getElementById('exSummaryBefore');
    const afterEl = document.getElementById('exSummaryAfter');
    const arrowEl = document.getElementById('exSummaryArrow');
    const singleEl = document.getElementById('exSummarySingle');
    const summaryBox = document.getElementById('exSummaryBox');
    if (!beforeEl || !afterEl) return;

    const isExtract = this.subTab === 'extract';
    summaryBox?.classList.toggle('ex-summary-extract', isExtract);

    if (isExtract) {
      beforeEl.classList.add('hidden');
      afterEl.classList.add('hidden');
      arrowEl?.classList.add('hidden');
      if (singleEl) {
        singleEl.classList.remove('hidden');
        singleEl.setAttribute('aria-hidden', 'false');
        singleEl.innerHTML = this.buildFixedRed0Html();
      }
      return;
    }

    beforeEl.classList.remove('hidden');
    afterEl.classList.remove('hidden');
    if (singleEl) {
      singleEl.classList.add('hidden');
      singleEl.setAttribute('aria-hidden', 'true');
      singleEl.innerHTML = '';
    }

    const level = getExceptionalLevel(this.itemData);
    const previewAfter = !this.isEnchantDisabled()
      ? Math.min(EXCEPTIONAL_MAX_LEVEL, level + 1)
      : level;

    beforeEl.innerHTML = this.buildSummaryLevelHtml(level, 'red');
    afterEl.innerHTML = this.buildSummaryLevelHtml(
      previewAfter,
      previewAfter > level ? 'white' : 'red'
    );

    if (arrowEl) {
      const showArrow = previewAfter > level;
      arrowEl.classList.toggle('hidden', !showArrow);
      arrowEl.classList.toggle('ex-arrow-red-to-white', level === 0 && previewAfter > 0);
      arrowEl.classList.toggle('ex-arrow-white-to-red', level > 0 && previewAfter > level);
    }
  },

  buildFixedRed0Html() {
    return `<img class="ex-summary-level" src="${this.SUMMARY_RED_0}" alt="0">`;
  },

  /**
   * red_0 / red_1 / red_2 = 目前等級 0 / 1 / 2（滿等 3 用 red_2）
   * white_1 / white_2 / white_3 = 預覽下一級
   */
  buildSummaryLevelHtml(level, color = 'red') {
    if (color === 'white') {
      const idx = Math.min(Math.max(level, 1), 3);
      return `<img class="ex-summary-level" src="images/exceptional/exceptional_summaryBox_white_${idx}.png" alt="${level}">`;
    }
    const idx = Math.min(Math.max(level, 0), 2);
    return `<img class="ex-summary-level" src="images/exceptional/exceptional_summaryBox_red_${idx}.png" alt="${level}">`;
  },

  renderEnchantPanel() {
    if (this.subTab !== 'enchant') return;

    const previewEl = document.getElementById('exStatPreview');
    const probEl = document.getElementById('exProbValue');
    const hammerIcon = document.getElementById('exHammerIcon');
    const hammerName = document.getElementById('exHammerName');

    const nextBonus = getExceptionalNextLevelBonus(this.itemData);
    const hammer = getExceptionalHammer(this.itemData);

    if (previewEl) {
      const previewText = Object.keys(nextBonus).length
        ? formatExceptionalStatBlock(nextBonus)
        : '-';
      previewEl.textContent = previewText;
      previewEl.classList.toggle('hidden', this.isEnchantDisabled() || previewText === '-');
    }
    if (probEl) {
      const rate = getExceptionalSuccessRate(this.itemData);
      probEl.textContent = rate != null ? `${rate}%` : '-';
    }
    if (hammerIcon && hammer) {
      hammerIcon.src = hammer.icon;
      hammerIcon.alt = hammer.name;
    }
    if (hammerName) {
      hammerName.textContent = hammer?.name || '-';
    }
  },

  renderExtractPanel() {
    if (this.subTab !== 'extract') return;

    const statEl = document.getElementById('exExtractStatList');
    const incomeIcon = document.getElementById('exExtractHammerIcon');
    const incomeName = document.getElementById('exExtractHammerName');
    const incomeCount = document.getElementById('exExtractHammerCount');

    const level = getExceptionalLevel(this.itemData);
    const total = getExceptionalTotalStats(this.itemData);
    const hammer = getExceptionalHammer(this.itemData);

    if (statEl) {
      // 提取頁：顯示已強化總加成（負號，表示將被移除）
      statEl.textContent = formatExceptionalStatBlock(total, { negate: true });
    }
    if (incomeIcon && hammer) {
      incomeIcon.src = hammer.icon;
      incomeIcon.alt = hammer.name;
    }
    if (incomeName) incomeName.textContent = hammer?.name || '-';
    if (incomeCount) incomeCount.textContent = String(level);
  },

  updateActionButtons() {
    const btnEnchant = document.getElementById('btnExEnchant');
    const btnExtract = document.getElementById('btnExExtract');
    const animPlaying = typeof ExceptionalEffectModule !== 'undefined'
      && ExceptionalEffectModule.isPlaying();

    if (btnEnchant) {
      btnEnchant.classList.toggle('hidden', this.subTab !== 'enchant');
      btnEnchant.disabled = this.busy || animPlaying || this.isEnchantDisabled();
    }
    if (btnExtract) {
      btnExtract.classList.toggle('hidden', this.subTab !== 'extract');
      btnExtract.disabled = this.busy || animPlaying || this.isExtractDisabled();
    }
  },

  handleEnchantClick() {
    if (!this.itemData || this.busy || this.isEnchantDisabled()) return;
    if (typeof ExceptionalEffectModule !== 'undefined' && ExceptionalEffectModule.isPlaying()) return;

    const item = this.itemData;
    const tryLevel = getExceptionalLevel(item);
    const hammer = getExceptionalHammer(item);
    const rate = getExceptionalSuccessRate(item);
    const success = rollExceptionalEnchant(item);

    const finish = () => {
      this.busy = false;
      if (success) {
        applyExceptionalLevelUp(item);
        addLog(`✨ 卓越強化成功！【${item.name}】追加強化 +${getExceptionalLevel(item)}`, 'log-success');
      } else {
        addLog(`💨 卓越強化失敗。【${item.name}】`, 'log-fail');
      }
      this.updateUI();
      updateStatusPanel();
      if (typeof EquipTooltipModule !== 'undefined') EquipTooltipModule.hide();
    };

    this.busy = true;
    this.updateActionButtons();
    if (hammer?.id && typeof trackCostUsage === 'function') {
      trackCostUsage('exceptional', hammer.id);
    }
    addLog(`🔨 使用 ${hammer?.name || '卓越鐵鎚'}（成功率 ${rate}%）`, 'log-info');

    if (typeof ExceptionalEffectModule !== 'undefined') {
      ExceptionalEffectModule.runWithAnim({
        branch: 'enchant',
        success,
        tryLevel,
        fn: finish,
      });
    } else {
      finish();
    }
  },

  handleExtractClick() {
    if (!this.itemData || this.busy || this.isExtractDisabled()) return;
    if (typeof ExceptionalEffectModule !== 'undefined' && ExceptionalEffectModule.isPlaying()) return;
    this.openExtractConfirm();
  },

  bindExtractConfirm() {
    if (this._extractConfirmBound) return;
    this._extractConfirmBound = true;

    document.getElementById('btnExExtractConfirmOk')?.addEventListener('click', () => {
      this.closeExtractConfirm(() => this.executeExtract());
    });
    document.getElementById('btnExExtractConfirmCancel')?.addEventListener('click', () => {
      this.closeExtractConfirm();
    });
    document.getElementById('exExtractConfirmBackdrop')?.addEventListener('click', () => {
      this.closeExtractConfirm();
    });
  },

  openExtractConfirm() {
    this.bindExtractConfirm();
    const modal = document.getElementById('exExtractConfirmModal');
    const detail = document.getElementById('exExtractConfirmDetail');
    if (!modal) return;

    const level = getExceptionalLevel(this.itemData);
    const hammer = getExceptionalHammer(this.itemData);
    if (detail) {
      detail.textContent = `將移除卓越強化 ${level} 次\n並獲得 ${hammer?.name || '卓越鐵鎚'} × ${level}`;
    }

    if (typeof beginModalFadeIn === 'function') {
      beginModalFadeIn(modal);
    } else {
      modal.classList.remove('hidden');
      modal.setAttribute('aria-hidden', 'false');
    }
  },

  closeExtractConfirm(onDone) {
    const modal = document.getElementById('exExtractConfirmModal');
    if (!modal || modal.classList.contains('hidden')) {
      onDone?.();
      return;
    }
    if (typeof beginModalFadeOut === 'function') {
      beginModalFadeOut(modal, onDone);
    } else {
      modal.classList.add('hidden');
      modal.setAttribute('aria-hidden', 'true');
      onDone?.();
    }
  },

  isExtractConfirmOpen() {
    const modal = document.getElementById('exExtractConfirmModal');
    return Boolean(modal && !modal.classList.contains('hidden'));
  },

  executeExtract() {
    if (!this.itemData || this.busy || this.isExtractDisabled()) return;
    if (typeof ExceptionalEffectModule !== 'undefined' && ExceptionalEffectModule.isPlaying()) return;

    const item = this.itemData;
    const prevLevel = getExceptionalLevel(item);
    const hammer = getExceptionalHammer(item);

    const finish = () => {
      this.busy = false;
      applyExceptionalExtract(item);
      addLog(`📦 卓越強化已提取，獲得 ${hammer?.name || '卓越鐵鎚'} × ${prevLevel}`, 'log-success');
      if (!this.isEnchantDisabled()) this.subTab = 'enchant';
      this.updateUI();
      updateStatusPanel();
      if (typeof EquipTooltipModule !== 'undefined') EquipTooltipModule.hide();
    };

    this.busy = true;
    this.updateActionButtons();
    addLog(`🔧 提取卓越強化`, 'log-info');

    if (typeof ExceptionalEffectModule !== 'undefined') {
      ExceptionalEffectModule.runWithAnim({
        branch: 'extract',
        success: true,
        fn: finish,
      });
    } else {
      finish();
    }
  },
};
