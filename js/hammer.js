const playerHammerInventory = {
  golden: 0,
  platinum: 0,
};

function getPlayerHammerCount(hammerId) {
  return Math.max(0, Number(playerHammerInventory[hammerId]) || 0);
}

function grantPlayerHammer(hammerId, amount = 1) {
  if (!hammerId || amount <= 0) return 0;
  const add = Math.floor(amount);
  playerHammerInventory[hammerId] = getPlayerHammerCount(hammerId) + add;
  return add;
}

function consumePlayerHammer(hammerId, amount = 1) {
  if (!hammerId || amount <= 0) return false;
  if (typeof isIdlePlayMode !== 'function' || !isIdlePlayMode()) return true;
  const current = getPlayerHammerCount(hammerId);
  if (current < amount) return false;
  playerHammerInventory[hammerId] = current - amount;
  if (typeof InventoryModule !== 'undefined') {
    InventoryModule.render?.();
    InventoryModule.updateSlotCount?.();
  }
  return true;
}

/**
 * HammerModule - 強化次數增加（鐵鎚）邏輯與 UI
 */
const HammerModule = {
  itemData: null,
  selectedHammer: null,
  autoRunning: false,
  autoCancelled: false,
  autoCancelHandler: null,
  /** 手動／動畫進行中，防止卡頓連點疊加突破上限 */
  actionBusy: false,
  AUTO_HAMMER_DELAY_MS: 8,

  isBusy() {
    if (this.autoRunning || this.actionBusy) return true;
    return typeof HammerEffectModule !== 'undefined' && HammerEffectModule.isPlaying?.();
  },

  loadEquip(item) {
    this.itemData = item;
    this.selectedHammer = null;
    this.updateUI();
  },

  resetState() {
    this.autoCancelled = true;
    this.autoRunning = false;
    this.unbindAutoCancelListener();
    this.actionBusy = false;
    this.itemData = null;
    this.selectedHammer = null;
    this.updateUI();
    this.updateUseButtonState();
  },

  setPanelMode(mode) {
    const idlePanel = document.getElementById('hmIdlePanel');
    const activePanel = document.getElementById('hmActivePanel');
    const blockedMsg = document.getElementById('hmBlockedMessage');
    const isIdle = mode === 'idle';
    const isBlocked = mode === 'blocked';

    if (idlePanel) idlePanel.classList.toggle('hidden', !isIdle && !isBlocked);
    if (activePanel) activePanel.classList.toggle('hidden', isIdle || isBlocked);
    if (blockedMsg) blockedMsg.classList.toggle('hidden', !isBlocked);

    if (typeof syncMainPanelIdleState === 'function') {
      syncMainPanelIdleState();
    }

    this.updateUseButtonState();
  },

  setIdleMode(isIdle) {
    this.setPanelMode(isIdle ? 'idle' : 'active');
  },

  bindAutoCancelListener() {
    if (this.autoCancelHandler) return;

    this.autoCancelHandler = (event) => {
      if (!this.autoRunning) return;
      if (event.repeat) return;
      this.cancelAutoHammer();
    };

    window.addEventListener('keydown', this.autoCancelHandler);
  },

  unbindAutoCancelListener() {
    if (!this.autoCancelHandler) return;
    window.removeEventListener('keydown', this.autoCancelHandler);
    this.autoCancelHandler = null;
  },

  cancelAutoHammer() {
    if (!this.autoRunning && !this.autoCancelled) return;
    // 只標記取消；autoRunning 交給 runAutoHammer finally 清掉，避免卡頓連點重入雙開
    this.autoCancelled = true;
    this.updateUseButtonState();
  },

  getHammerUsed(hammerId) {
    if (!this.itemData) return 0;
    if (hammerId === 'golden') return this.itemData.goldenHammerUsed || 0;
    if (hammerId === 'platinum') return this.itemData.platinumHammerUsed || 0;
    return 0;
  },

  getHammerMax(hammerId) {
    const type = HAMMER_TYPES[hammerId];
    if (type) return type.maxUses;
    if (!this.itemData) return 0;
    if (hammerId === 'golden') return this.itemData.maxGoldenHammer ?? 1;
    if (hammerId === 'platinum') return this.itemData.maxPlatinumHammer ?? 5;
    return 0;
  },

  getRemainingUses(hammerId) {
    if (!this.itemData) return 0;
    return Math.max(0, this.getHammerMax(hammerId) - this.getHammerUsed(hammerId));
  },

  getBaseSlotCount() {
    if (!this.itemData) return 0;
    return this.itemData.baseMaxUpgradeSlots ?? this.itemData.maxUpgradeSlots ?? 0;
  },

  getBonusSlotCount() {
    return Math.max(0, (this.itemData?.upgradeSlots || 0) - this.getBaseSlotCount());
  },

  createScrollSlotIcon(index, scrollUsed) {
    const img = document.createElement('img');
    img.className = 'hm-summary-icon';
    if (index < scrollUsed) {
      const failed = typeof isScrollSlotFail === 'function'
        && isScrollSlotFail(this.itemData, index, scrollUsed);
      img.src = failed
        ? 'images/scroll/scroll.summaryIcon.0.fail.png'
        : 'images/hammer/hammer.summaryIcon.0.success.png';
      img.alt = failed ? '卷軸失敗' : '卷軸成功';
    } else {
      img.src = 'images/hammer/scroll.summaryIcon.0.empty.png';
      img.alt = '未使用';
    }
    return img;
  },

  areAllHammersExhausted() {
    if (!this.itemData) return false;
    return this.getRemainingUses('golden') <= 0 && this.getRemainingUses('platinum') <= 0;
  },

  getCurrentRate() {
    if (!this.itemData || !this.selectedHammer) return null;

    const used = this.getHammerUsed(this.selectedHammer);
    const type = HAMMER_TYPES[this.selectedHammer];
    if (!type) return null;

    return type.rates[used] ?? type.rates[type.rates.length - 1];
  },

  setAutoWhiteHammerEnabled(enabled) {
    const autoCheck = document.getElementById('chkHammerAutoEnhance');
    if (!autoCheck) return;
    autoCheck.checked = enabled;
    this.updateUseButtonState();
  },

  selectHammer(hammerId) {
    if (!this.itemData) return;

    if (!(typeof canUseHammerEnhancement === 'function'
      ? canUseHammerEnhancement(this.itemData)
      : hasBaseUpgradeSlots(this.itemData))) {
      return addLog('⚠️ 此裝備本身無強化次數，無法增加強化次數。', 'log-fail');
    }

    if (this.getRemainingUses(hammerId) <= 0) {
      const name = HAMMER_TYPES[hammerId]?.name || hammerId;
      return addLog(`⚠️ 此裝備的${name}使用次數已達上限！`, 'log-fail');
    }

    if (typeof isIdlePlayMode === 'function' && isIdlePlayMode()
      && getPlayerHammerCount(hammerId) <= 0) {
      const name = HAMMER_TYPES[hammerId]?.name || hammerId;
      return addLog(`⚠️ 背包中沒有${name}。`, 'log-fail');
    }

    this.selectedHammer = this.selectedHammer === hammerId ? null : hammerId;

    if (this.selectedHammer === 'golden') {
      this.setAutoWhiteHammerEnabled(false);
    }

    this.updateUI();
  },

  createLockIcon(isSelected, alt) {
    if (isSelected) {
      const slot = document.createElement('span');
      slot.className = 'hm-lock-slot';

      const anim = document.createElement('span');
      anim.className = 'hm-lock-icon next';
      anim.setAttribute('aria-hidden', 'true');
      anim.title = alt;

      slot.appendChild(anim);
      return slot;
    }

    const img = document.createElement('img');
    img.className = 'hm-summary-icon hm-hammer-icon';
    img.src = 'images/hammer/hammer.summaryIcon.1.lock.png';
    img.alt = alt;
    return img;
  },

  renderGoldenSlot() {
    const slot = document.getElementById('hmGoldenSlot');
    if (!slot || !this.itemData) return;

    slot.innerHTML = '';
    const goldenUsed = this.getHammerUsed('golden');
    const goldenMax = this.getHammerMax('golden');
    const scrollUsed = this.itemData.scrollUsed || 0;
    const baseCount = this.getBaseSlotCount();

    if (goldenMax <= 0) return;

    if (goldenUsed >= goldenMax) {
      slot.appendChild(this.createScrollSlotIcon(baseCount, scrollUsed));
      return;
    }

    slot.appendChild(this.createLockIcon(
      this.selectedHammer === 'golden',
      '金槌未解鎖'
    ));
  },

  renderPlatinumRow() {
    const platinumRow = document.getElementById('hmPlatinumRow');
    if (!platinumRow || !this.itemData) return;

    const platinumUsed = this.getHammerUsed('platinum');
    const platinumMax = this.getHammerMax('platinum');
    const scrollUsed = this.itemData.scrollUsed || 0;
    const baseCount = this.getBaseSlotCount();
    const goldenUsed = this.getHammerUsed('golden');

    platinumRow.innerHTML = '';
    for (let i = 0; i < platinumMax; i++) {
      if (i < platinumUsed) {
        const slotIndex = baseCount + goldenUsed + i;
        platinumRow.appendChild(this.createScrollSlotIcon(slotIndex, scrollUsed));
      } else {
        platinumRow.appendChild(this.createLockIcon(
          this.selectedHammer === 'platinum' && i === platinumUsed,
          '白槌未解鎖'
        ));
      }
    }
  },

  renderSummary() {
    const scrollRow = document.getElementById('hmScrollRow');
    if (!scrollRow || !this.itemData) return;

    const scrollUsed = this.itemData.scrollUsed || 0;
    const baseScroll = this.getBaseSlotCount();

    scrollRow.innerHTML = '';
    const groupCount = Math.ceil(baseScroll / 5) || 0;
    for (let g = 0; g < groupCount; g++) {
      const group = document.createElement('div');
      group.className = 'hm-icon-group';

      const start = g * 5;
      const end = Math.min(start + 5, baseScroll);
      for (let i = start; i < end; i++) {
        group.appendChild(this.createScrollSlotIcon(i, scrollUsed));
      }

      scrollRow.appendChild(group);
    }

    this.renderGoldenSlot();
    this.renderPlatinumRow();
  },

  renderStatAndRate() {
    const statList = document.getElementById('hmStatList');
    const rateSuccess = document.getElementById('hmRateSuccess');
    const rateFail = document.getElementById('hmRateFail');
    const selectedName = document.getElementById('hmSelectedName');

    if (selectedName) {
      selectedName.textContent = this.selectedHammer
        ? HAMMER_TYPES[this.selectedHammer].name
        : '';
    }

    if (statList) {
      if (this.selectedHammer) {
        statList.innerHTML = '<div class="hm-stat-line">強化次數 <span>+1</span></div>';
      } else if (this.areAllHammersExhausted()) {
        statList.innerHTML = '<div class="hm-stat-empty">強化次數已達上限</div>';
      } else {
        statList.innerHTML = '<div class="hm-stat-empty">請選擇欲使用的鐵鎚</div>';
      }
    }

    const rate = this.getCurrentRate();
    if (rateSuccess && rateFail) {
      if (rate != null) {
        rateSuccess.textContent = `${Number(rate).toFixed(Number(rate) % 1 === 0 ? 0 : 1)}%`;
        rateFail.textContent = `${(100 - rate).toFixed(Number(rate) % 1 === 0 ? 0 : 1)}%`;
      } else {
        rateSuccess.textContent = '0%';
        rateFail.textContent = '0%';
      }
    }
  },

  renderMaterialGrid() {
    const grid = document.getElementById('hmMaterialGrid');
    if (!grid) return;

    grid.innerHTML = '';

    const catalog = [
      { id: 'golden' },
      { id: 'platinum' }
    ];
    const idle = typeof isIdlePlayMode === 'function' && isIdlePlayMode();
    const list = idle
      ? catalog.filter((mat) => getPlayerHammerCount(mat.id) > 0)
      : catalog;

    for (let i = 0; i < 16; i++) {
      const slot = document.createElement('button');
      slot.type = 'button';
      slot.className = 'hm-mat-slot';

      const mat = list[i];
      if (mat) {
        const type = HAMMER_TYPES[mat.id];
        slot.dataset.hammerId = mat.id;
        slot.title = type.name;
        slot.innerHTML = `<img class="hm-mat-icon" src="${type.icon}" alt="${type.name}">`;
        if (idle) {
          const owned = getPlayerHammerCount(mat.id);
          if (owned > 0) {
            slot.insertAdjacentHTML('beforeend', `<span class="hm-mat-count">${owned}</span>`);
          }
        }
        slot.addEventListener('click', () => this.selectHammer(mat.id));

        if (this.selectedHammer === mat.id) {
          slot.classList.add('selected');
        }
      }

      grid.appendChild(slot);
    }
  },

  updateUseButtonState() {
    const btn = document.getElementById('btnHammerUse');
    if (!btn) return;

    const effectPlaying = typeof HammerEffectModule !== 'undefined' && HammerEffectModule.isPlaying();
    const busy = this.autoRunning || this.actionBusy || effectPlaying;
    const canUseHammer = Boolean(this.itemData && (
      typeof canUseHammerEnhancement === 'function'
        ? canUseHammerEnhancement(this.itemData)
        : hasBaseUpgradeSlots(this.itemData)
    ));
    const autoCheck = document.getElementById('chkHammerAutoEnhance');
    if (autoCheck) autoCheck.disabled = !canUseHammer || busy;

    const autoChecked = autoCheck?.checked;
    const idle = typeof isIdlePlayMode === 'function' && isIdlePlayMode();
    const bagOk = (hammerId) => !idle || getPlayerHammerCount(hammerId) > 0;
    const canUseManual = canUseHammer &&
      this.selectedHammer &&
      this.getRemainingUses(this.selectedHammer) > 0 &&
      bagOk(this.selectedHammer);
    const canUseAuto = canUseHammer &&
      autoChecked &&
      this.getRemainingUses('platinum') > 0 &&
      bagOk('platinum');

    btn.disabled = busy || !(canUseManual || canUseAuto);
    if (!this.autoRunning && !this.actionBusy) {
      btn.removeAttribute('aria-busy');
    }
  },

  updateUI() {
    if (!this.itemData) {
      this.setPanelMode('idle');
      this.syncCatValleyRatesUi();
      return;
    }

    if (!(typeof canUseHammerEnhancement === 'function'
      ? canUseHammerEnhancement(this.itemData)
      : hasBaseUpgradeSlots(this.itemData))) {
      this.selectedHammer = null;
      this.setPanelMode('blocked');
      this.syncCatValleyRatesUi();
      return;
    }

    this.setPanelMode('active');

    this.renderSummary();
    this.renderStatAndRate();
    this.renderMaterialGrid();
    this.syncCatValleyRatesUi();
    this.updateUseButtonState();
  },

  syncCatValleyRatesUi() {
    const wrap = document.getElementById('hmBottomOptionsLeft');
    wrap?.classList.remove('hidden');
    const el = document.getElementById('chkHammerCatValleyRates');
    if (el && typeof isHammerCatValleyRatesEnabled === 'function') {
      el.checked = isHammerCatValleyRatesEnabled();
    }
  },

  handleUseClick() {
    if (!this.itemData) return;
    if (this.isBusy()) return;

    if (!(typeof canUseHammerEnhancement === 'function'
      ? canUseHammerEnhancement(this.itemData)
      : hasBaseUpgradeSlots(this.itemData))) {
      return addLog('⚠️ 此裝備本身無強化次數，無法增加強化次數。', 'log-fail');
    }

    const auto = document.getElementById('chkHammerAutoEnhance')?.checked;
    if (auto) {
      this.runAutoHammer();
      return;
    }
    this.useHammerWithAnim();
  },

  trackHammerAttempt(hammerId) {
    trackCostUsage(hammerId === 'golden' ? 'goldenHammer' : 'platinumHammer');
  },

  useHammerWithAnim() {
    const hammerId = this.selectedHammer;
    if (!this.itemData || !hammerId) return null;
    if (this.isBusy()) return null;

    if (!(typeof canUseHammerEnhancement === 'function'
      ? canUseHammerEnhancement(this.itemData)
      : hasBaseUpgradeSlots(this.itemData))) {
      addLog('⚠️ 此裝備本身無強化次數，無法增加強化次數。', 'log-fail');
      return null;
    }

    if (this.getRemainingUses(hammerId) <= 0) {
      const name = HAMMER_TYPES[hammerId]?.name || hammerId;
      addLog(`⚠️ 此裝備的${name}使用次數已達上限！`, 'log-fail');
      return 'exhausted';
    }

    // 先鎖再消耗／擲骰，避免卡頓連點在動畫回呼前重複通過上限檢查
    this.actionBusy = true;
    this.updateUseButtonState();

    if (typeof consumePlayerHammer === 'function' && !consumePlayerHammer(hammerId, 1)) {
      this.actionBusy = false;
      this.updateUseButtonState();
      const name = HAMMER_TYPES[hammerId]?.name || hammerId;
      addLog(`⚠️ 背包中沒有${name}。`, 'log-fail');
      return null;
    }

    const type = HAMMER_TYPES[hammerId];
    const used = this.getHammerUsed(hammerId);
    const rate = type.rates[used] ?? type.rates[type.rates.length - 1];
    const success = Math.random() * 100 < rate;
    this.trackHammerAttempt(hammerId);

    // 結果立刻套用（含上限夾住），動畫只負責演出
    this.applyHammerResult({ hammerId, success, rate, silent: false, skipUI: true });

    const finishUi = () => {
      this.actionBusy = false;
      this.updateUI();
      updateStatusPanel();
    };

    if (typeof HammerEffectModule !== 'undefined'
      && HammerEffectModule.isAnimEnabled?.()
      && HammerEffectModule.hasAssets?.()) {
      HammerEffectModule.runWithAnim({
        success,
        fn: finishUi,
      });
      return success ? 'success' : 'fail';
    }

    finishUi();
    return success ? 'success' : 'fail';
  },

  applyHammerResult({ hammerId, success, rate, silent = false, skipUI = false, preserveSelection = false }) {
    if (!this.itemData || !hammerId) return null;

    const type = HAMMER_TYPES[hammerId];
    const max = this.getHammerMax(hammerId);
    const used = this.getHammerUsed(hammerId);

    if (success) {
      if (used >= max) {
        if (!silent) {
          addLog(`⚠️ 此裝備的${type?.name || hammerId}使用次數已達上限！`, 'log-fail');
        }
        return 'exhausted';
      }
      const nextUsed = Math.min(max, used + 1);
      if (hammerId === 'golden') {
        this.itemData.goldenHammerUsed = nextUsed;
      } else {
        this.itemData.platinumHammerUsed = nextUsed;
      }
      this.itemData.upgradeSlots = (this.itemData.upgradeSlots || 0) + 1;
      if (!silent) {
        addLog(`🔨 ${type.name} 成功！(機率 ${rate}%) 升級次數 +1`, 'log-success');
      }
    } else if (!silent) {
      addLog(`🔨 ${type.name} 失敗。(機率 ${rate}%) 次數未扣除`, 'log-fail');
    }

    if (typeof trackHammerCatValleyCost === 'function') {
      trackHammerCatValleyCost(this.itemData, {
        hammerId,
        success,
        successIndex: used,
      });
    }

    if (!preserveSelection && this.getRemainingUses(hammerId) <= 0) {
      this.selectedHammer = null;
    }

    if (!skipUI) {
      this.updateUI();
      updateStatusPanel();
    }
    return success ? 'success' : 'fail';
  },

  useHammer(options = {}) {
    const { silent = false, skipUI = false, forceHammerId = null } = options;
    const hammerId = forceHammerId || this.selectedHammer;
    if (!this.itemData || !hammerId) return null;

    if (!(typeof canUseHammerEnhancement === 'function'
      ? canUseHammerEnhancement(this.itemData)
      : hasBaseUpgradeSlots(this.itemData))) {
      if (!silent) addLog('⚠️ 此裝備本身無強化次數，無法增加強化次數。', 'log-fail');
      return null;
    }

    if (this.getRemainingUses(hammerId) <= 0) {
      if (!silent) {
        const name = HAMMER_TYPES[hammerId]?.name || hammerId;
        addLog(`⚠️ 此裝備的${name}使用次數已達上限！`, 'log-fail');
      }
      return 'exhausted';
    }

    if (typeof consumePlayerHammer === 'function' && !consumePlayerHammer(hammerId, 1)) {
      if (!silent) {
        const name = HAMMER_TYPES[hammerId]?.name || hammerId;
        addLog(`⚠️ 背包中沒有${name}。`, 'log-fail');
      }
      return null;
    }

    const type = HAMMER_TYPES[hammerId];
    const used = this.getHammerUsed(hammerId);
    const rate = type.rates[used] ?? type.rates[type.rates.length - 1];
    const success = Math.random() * 100 < rate;
    this.trackHammerAttempt(hammerId);

    return this.applyHammerResult({
      hammerId,
      success,
      rate,
      silent,
      skipUI,
      preserveSelection: Boolean(forceHammerId)
    });
  },

  async runAutoHammer() {
    if (this.autoRunning || this.actionBusy || !this.itemData) return;
    if (typeof HammerEffectModule !== 'undefined' && HammerEffectModule.isPlaying?.()) return;

    if (this.getRemainingUses('platinum') <= 0) {
      return addLog('⚠️ 白槌次數已用完！', 'log-fail');
    }

    this.autoRunning = true;
    this.autoCancelled = false;
    this.selectedHammer = 'platinum';

    const btn = document.getElementById('btnHammerUse');
    if (btn) btn.setAttribute('aria-busy', 'true');
    this.updateUseButtonState();
    this.bindAutoCancelListener();

    const startUsed = this.getHammerUsed('platinum');
    const startSlots = this.itemData.upgradeSlots || 0;
    let attempts = 0;
    let wasCancelled = false;

    try {
      while (!this.autoCancelled && this.getRemainingUses('platinum') > 0) {
        const prevUsed = this.getHammerUsed('platinum');
        this.useHammer({ silent: true, skipUI: true, forceHammerId: 'platinum' });
        attempts++;

        if (this.getHammerUsed('platinum') > prevUsed) {
          await new Promise((resolve) => setTimeout(resolve, this.AUTO_HAMMER_DELAY_MS * 2));
        } else {
          await new Promise((resolve) => setTimeout(resolve, this.AUTO_HAMMER_DELAY_MS));
        }

        if (attempts > 10000) break;
      }
    } finally {
      wasCancelled = this.autoCancelled;
      this.unbindAutoCancelListener();
      this.autoRunning = false;
      this.autoCancelled = false;
      if (btn) btn.removeAttribute('aria-busy');
    }

    const successCount = this.getHammerUsed('platinum') - startUsed;
    const slotGain = (this.itemData.upgradeSlots || 0) - startSlots;

    if (this.getRemainingUses('golden') > 0) {
      this.selectedHammer = 'golden';
    }

    this.setAutoWhiteHammerEnabled(false);
    this.updateUI();
    updateStatusPanel();

    if (wasCancelled) {
      addLog(
        `⏹️ 已取消自動敲白槌：成功 ${successCount} 次，升級次數 +${slotGain}（共敲 ${attempts} 次）`,
        'log-info'
      );
    } else if (successCount > 0) {
      addLog(
        `⚡ 自動敲白槌完成：成功 ${successCount} 次，升級次數 +${slotGain}（共敲 ${attempts} 次）`,
        'log-success'
      );
    } else {
      addLog(`🔨 自動敲白槌結束：本次未成功（共敲 ${attempts} 次）`, 'log-fail');
    }
  }
};

window.addEventListener('DOMContentLoaded', () => {
  const autoCheck = document.getElementById('chkHammerAutoEnhance');
  if (autoCheck) {
    autoCheck.addEventListener('change', () => HammerModule.updateUseButtonState());
  }
  const catValleyRatesCheck = document.getElementById('chkHammerCatValleyRates');
  if (catValleyRatesCheck) {
    if (typeof isHammerCatValleyRatesEnabled === 'function') {
      catValleyRatesCheck.checked = isHammerCatValleyRatesEnabled();
    }
    catValleyRatesCheck.addEventListener('change', () => {
      if (typeof setHammerCatValleyRatesEnabled === 'function') {
        setHammerCatValleyRatesEnabled(catValleyRatesCheck.checked);
      }
    });
  }
});
