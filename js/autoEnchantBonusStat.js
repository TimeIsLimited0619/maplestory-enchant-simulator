/**
 * 附加能力自動重設 — Enchant.img/autoEnchant/bonusStat
 */
const AutoEnchantBonusStatModule = {
  isOpen: false,
  isRunning: false,
  cancelled: false,
  /** @type {{ statId: string, minValue: number }[]} */
  groupTargets: [
    { statId: '', minValue: 0 },
    { statId: '', minValue: 0 },
    { statId: '', minValue: 0 },
    { statId: '', minValue: 0 },
  ],
  overspeedMode: false,
  progressFrame: 0,
  progressTimer: null,
  cancelHandler: null,
  choiceAutoSessionActive: false,
  lastChoiceStoppedForPick: false,
  memorialSnapshotBefore: null,
  memorialAutoOverlayActive: false,

  isMemorialSelected() {
    return aeBsIsMemorialItem?.(BonusStatModule.getSelectedItem?.());
  },

  isMemorialAutoMode() {
    return this.isRunning && this.isMemorialSelected();
  },

  getLoopDelayMs() {
    return aePotGetAutoEnchantLoopDelayMs(this.overspeedMode);
  },

  getBatchSize() {
    return aePotGetAutoEnchantBatchSize(this.overspeedMode);
  },

  getAutoBlockReason() {
    if (!BonusStatModule?.itemData) return '請先放置裝備。';
    if (BonusStatModule.costTab !== 'item') return '請切換至星火道具分頁並選擇星火。';
    if (!BonusStatModule.getSelectedItem?.()) return '請選擇要使用的星火道具。';
    if (BonusStatModule.isChoiceOverlayOpen?.()) return '請先完成 BEFORE/AFTER 選擇。';
    if (this.choiceAutoSessionActive) return '請先完成 BEFORE/AFTER 選擇。';
    return null;
  },

  canOpen() {
    if (typeof AUTO_ENCHANT_USE_OVERLAY === 'undefined' || !AUTO_ENCHANT_USE_OVERLAY) return false;
    if (!BonusStatModule?.itemData) return false;
    if (typeof canUseBonusStat === 'function' && !canUseBonusStat(BonusStatModule.itemData)) return false;
    if (BonusStatModule.isChoiceOverlayOpen?.()) return false;
    if (this.isRunning) return false;
    return true;
  },

  groupHasTarget(group) {
    return Boolean(group?.statId) && (Number(group?.minValue) || 0) > 0;
  },

  matchesTargets(state) {
    const equip = BonusStatModule.itemData;
    return bonusStatMatchesTargets(state, this.groupTargets, equip);
  },

  canStart() {
    if (!BonusStatModule.itemData?.bonusStat) return false;
    if (this.getAutoBlockReason()) return false;
    return this.groupTargets.some((g) => g.statId && (Number(g.minValue) || 0) > 0);
  },

  getUnavailableStatIds(equip = BonusStatModule.itemData) {
    // 武器％詞條在 UI 併入物／魔攻選項，不另開
    const hidden = new Set(['watkPct', 'matkPct']);
    const available = typeof bsGetAvailableBonusStatIds === 'function'
      ? bsGetAvailableBonusStatIds(equip)
      : null;

    if (available) {
      if (typeof BONUS_STAT_TYPES !== 'undefined') {
        BONUS_STAT_TYPES.forEach((type) => {
          if (hidden.has(type.id)) return;
          if (!available.has(type.id)) hidden.add(type.id);
        });
      }
      return hidden;
    }

    // 無裝備時保守隱藏武器專屬％傷
    hidden.add('bossDmg');
    hidden.add('dmg');
    if (!equip || !bsItemHasBaseWatk(equip)) hidden.add('watk');
    if (!equip || !bsItemHasBaseMatk(equip)) hidden.add('matk');
    return hidden;
  },

  sanitizeGroupTargets() {
    const hidden = this.getUnavailableStatIds();
    this.groupTargets.forEach((group) => {
      if (group?.statId && hidden.has(group.statId)) {
        group.statId = '';
        group.minValue = 0;
      }
    });
  },

  getTakenStatIds(excludeIndex = -1) {
    const taken = new Set();
    this.groupTargets.forEach((group, index) => {
      if (index !== excludeIndex && group?.statId) taken.add(group.statId);
    });
    return taken;
  },

  buildStatOptions() {
    const hiddenIds = this.getUnavailableStatIds();
    return [
      { key: '', label: '不選擇' },
      ...BONUS_STAT_TYPES
        .filter((t) => !hiddenIds.has(t.id))
        .map((t) => ({ key: t.id, label: t.label })),
    ];
  },

  hidePanelForMemorialAuto() {
    this.closeAllCombos();

    const overlay = document.getElementById('aeBsOverlay');
    if (overlay) {
      overlay.classList.add('hidden');
      overlay.setAttribute('aria-hidden', 'true');
    }

    this.isOpen = false;
    aeBsSyncChoiceAutoEnchantLayout?.();
  },

  getProgressAlertEl() {
    if (this.isMemorialSelected() && (this.isRunning || this.memorialAutoOverlayActive)) {
      return document.getElementById('bsChoiceProgressAlert')
        || document.getElementById('aeBsProgressAlert');
    }
    return document.getElementById('aeBsProgressAlert');
  },

  open() {
    if (!BonusStatModule.itemData) {
      return addLog('⚠️ 請先放置裝備。', 'log-fail');
    }

    this.cancelled = false;
    const overlay = document.getElementById('aeBsOverlay');
    if (overlay && typeof beginModalFadeIn === 'function') {
      beginModalFadeIn(overlay);
    } else if (overlay) {
      overlay.classList.remove('hidden');
      overlay.setAttribute('aria-hidden', 'false');
    }

    this.isOpen = true;
    const chk = document.getElementById('chkBonusStatAuto');
    if (chk) chk.checked = true;
    this.render();
    this.syncAutoCheckbox();
    this.bindCancelKeys();
    aeBsSyncChoiceAutoEnchantLayout?.();
  },

  close() {
    if (this.isRunning) this.cancel();
    this.closeAllCombos();
    this.isOpen = false;
    this.choiceAutoSessionActive = false;
    this.lastChoiceStoppedForPick = false;
    this.memorialSnapshotBefore = null;
    this.unbindCancelKeys();
    this.stopProgressAlert();

    const overlay = document.getElementById('aeBsOverlay');
    if (overlay) {
      overlay.classList.add('hidden');
      overlay.setAttribute('aria-hidden', 'true');
    }

    const chk = document.getElementById('chkBonusStatAuto');
    if (chk) chk.checked = false;
    this.syncAutoCheckbox();
    BonusStatModule.updateResetButtonState?.();
    aeBsSyncChoiceAutoEnchantLayout?.();
  },

  onChoiceOverlayClosed() {
    this.choiceAutoSessionActive = false;
    this.lastChoiceStoppedForPick = false;
    this.memorialSnapshotBefore = null;
    this.memorialAutoOverlayActive = false;
    this.stopProgressAlert();

    const chk = document.getElementById('chkBonusStatAuto');
    if (chk) chk.checked = false;

    if (this.isOpen) {
      this.syncAutoCheckbox();
      this.render();
    } else {
      this.syncAutoCheckbox();
    }
    BonusStatModule.updateResetButtonState?.();
    aeBsSyncChoiceAutoEnchantLayout?.();
  },

  initPanelHooks() {
    const chk = document.getElementById('chkBonusStatAuto');
    if (!chk || chk.dataset.aeHooked) return;
    chk.dataset.aeHooked = '1';
    chk.addEventListener('change', () => {
      if (chk.checked) {
        if (this.canOpen()) {
          this.open();
        } else {
          chk.checked = false;
          if (!BonusStatModule?.itemData) {
            addLog('⚠️ 請先放置裝備。', 'log-fail');
          }
        }
      } else if (this.isRunning) {
        this.cancel();
      } else if (this.isOpen) {
        this.close();
      }
    });
  },

  syncAutoCheckbox() {
    const chk = document.getElementById('chkBonusStatAuto');
    if (!chk) return;

    const overlayOn = typeof AUTO_ENCHANT_USE_OVERLAY !== 'undefined' && AUTO_ENCHANT_USE_OVERLAY;
    if (!overlayOn) {
      chk.disabled = true;
      return;
    }

    chk.disabled = this.isRunning
      ? false
      : (!this.isOpen && !this.canOpen());

    if (this.isRunning && this.isMemorialAutoMode()) {
      chk.checked = true;
    } else if (this.isOpen && !this.isRunning) {
      chk.checked = true;
    } else if (this.memorialAutoOverlayActive && (this.choiceAutoSessionActive || BonusStatChoiceModule.isOpen?.())) {
      chk.checked = true;
      chk.disabled = this.choiceAutoSessionActive;
    }
  },

  onEquipChanged() {
    if (this.isRunning) this.cancel();
    if (!BonusStatModule?.itemData) {
      if (this.isOpen) this.close();
      return;
    }
    this.sanitizeGroupTargets();
    if (this.isOpen) this.render();
  },

  onBackdropClick() {
    // 僅自動強化開關可關閉面板；點擊空白處不關閉
  },

  bindCancelKeys() {
    if (this.cancelHandler) return;
    this.cancelHandler = (e) => {
      if (!this.isRunning) return;
      if (e.code === 'Escape' || e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        const fromChoice = BonusStatModule.isChoiceOverlayOpen?.() && this.isMemorialAutoMode();
        this.cancel(fromChoice);
      }
    };
    document.addEventListener('keydown', this.cancelHandler);
  },

  unbindCancelKeys() {
    if (!this.cancelHandler) return;
    document.removeEventListener('keydown', this.cancelHandler);
    this.cancelHandler = null;
  },

  setGroupTarget(index, statId) {
    if (this.isRunning) return;
    if (!this.groupTargets[index]) return;
    this.groupTargets[index].statId = statId || '';
    this.render();
  },

  setGroupMinValue(index, raw) {
    if (this.isRunning) return;
    if (!this.groupTargets[index]) return;
    const n = Math.max(0, Math.min(9999, parseInt(String(raw).replace(/\D/g, ''), 10) || 0));
    this.groupTargets[index].minValue = n;
  },

  resetGroup(index) {
    if (this.isRunning) return;
    if (!this.groupTargets[index]) return;
    this.groupTargets[index] = { statId: '', minValue: 0 };
    const input = document.getElementById(`aeBsValue${index}`);
    if (input) input.value = '';
    this.render();
  },

  resetAll() {
    if (this.isRunning) return;
    for (let i = 0; i < this.groupTargets.length; i += 1) {
      this.groupTargets[i] = { statId: '', minValue: 0 };
    }
    this.render();
  },

  getComboWrap(index) {
    return document.querySelector(`#aeBsRow${index} .ae-bs-stat-combo-wrap`);
  },

  closeAllCombos() {
    document.querySelectorAll('.ae-bs-stat-combo-wrap.is-open').forEach((wrap) => {
      wrap.classList.remove('is-open');
      const list = wrap.querySelector('.ae-bs-stat-combo-list');
      const trigger = wrap.querySelector('.ae-bs-stat-combo-trigger');
      if (list) list.classList.add('hidden');
      if (trigger) {
        trigger.setAttribute('aria-expanded', 'false');
        trigger._aeBsComboPaint?.('normal');
      }
    });
  },

  toggleCombo(index) {
    if (this.isRunning) return;
    const wrap = this.getComboWrap(index);
    if (!wrap || wrap.classList.contains('is-disabled')) return;

    if (wrap.classList.contains('is-open')) {
      this.closeAllCombos();
      return;
    }

    this.closeAllCombos();
    wrap.classList.add('is-open');
    const list = wrap.querySelector('.ae-bs-stat-combo-list');
    const trigger = wrap.querySelector('.ae-bs-stat-combo-trigger');
    if (list) list.classList.remove('hidden');
    if (trigger) {
      trigger.setAttribute('aria-expanded', 'true');
      trigger._aeBsComboPaint?.('pressed');
    }
  },

  pickComboOption(index, statId) {
    if (this.isRunning) return;
    if (statId && this.getTakenStatIds(index).has(statId)) return;
    this.setGroupTarget(index, statId);
    this.closeAllCombos();
  },

  initComboHooks() {
    if (this.comboHooksReady) return;
    this.comboHooksReady = true;

    document.querySelectorAll('.ae-bs-stat-combo-wrap').forEach((wrap) => {
      const index = Number(wrap.dataset.index);
      const trigger = wrap.querySelector('.ae-bs-stat-combo-trigger');
      const noneBtn = wrap.querySelector('.ae-bs-stat-combo-option--none');

      trigger?.addEventListener('click', (event) => {
        event.stopPropagation();
        this.toggleCombo(index);
      });

      noneBtn?.addEventListener('click', (event) => {
        event.stopPropagation();
        this.pickComboOption(index, '');
      });
    });

    document.addEventListener('click', () => this.closeAllCombos());
    document.addEventListener('keydown', (event) => {
      if (event.code === 'Escape') this.closeAllCombos();
    });
  },

  toggleOverspeedMode() {
    if (this.isRunning) return;
    this.overspeedMode = !this.overspeedMode;
    this.render();
  },

  startProgressAlert() {
    const cfg = AUTO_ENCHANT_BONUS_STAT?.progressAlert || [];
    const img = this.getProgressAlertEl();
    if (!img || !cfg.length) return;

    img.classList.remove('hidden');
    this.progressFrame = 0;
    const showFrame = () => {
      const frame = cfg[this.progressFrame % cfg.length];
      if (frame?.src) img.src = frame.src;
      this.progressFrame += 1;
    };
    showFrame();
    this.progressTimer = setInterval(showFrame, cfg[0]?.delay || 300);
  },

  stopProgressAlert() {
    if (this.progressTimer) {
      clearInterval(this.progressTimer);
      this.progressTimer = null;
    }
    ['aeBsProgressAlert', 'bsChoiceProgressAlert'].forEach((id) => {
      const img = document.getElementById(id);
      if (!img) return;
      img.classList.add('hidden');
      img.removeAttribute('src');
    });
  },

  cancel(fromChoiceOverlay = false) {
    if (!this.isRunning) return;
    this.cancelled = true;
    this.isRunning = false;
    this.stopProgressAlert();

    if (this.isMemorialSelected?.() && typeof BonusStatChoiceModule !== 'undefined' && BonusStatChoiceModule.isOpen()) {
      // 裝備狀態回 BEFORE；畫面 AFTER 保留最後一次骰出結果
      if (this.memorialSnapshotBefore) {
        BonusStatModule.applyChoiceResult(this.memorialSnapshotBefore);
        const lastAfter = BonusStatChoiceModule.after
          ? cloneBonusStatState(BonusStatChoiceModule.after)
          : cloneBonusStatState(this.memorialSnapshotBefore);
        BonusStatChoiceModule.updateAutoSession(
          this.memorialSnapshotBefore,
          lastAfter,
          1
        );
      }
    } else if (!fromChoiceOverlay && typeof BonusStatChoiceModule !== 'undefined' && BonusStatChoiceModule.isOpen()) {
      BonusStatChoiceModule.close();
    }

    this.choiceAutoSessionActive = false;
    this.lastChoiceStoppedForPick = false;
    BonusStatModule.updateResetButtonState?.();
    BonusStatChoiceModule.render?.();
    this.render();
    this.syncAutoCheckbox();
    aeBsSyncChoiceAutoEnchantLayout?.();

    const chk = document.getElementById('chkBonusStatAuto');
    if (chk) chk.checked = false;
  },

  async restartMemorialAutoFromChoice() {
    if (this.isRunning) return;
    if (!this.isMemorialSelected()) return;
    if (!BonusStatChoiceModule.isOpen?.()) return;

    this.cancelled = false;
    this.choiceAutoSessionActive = false;
    this.lastChoiceStoppedForPick = false;
    await this.start();
  },

  onActionClick() {
    if (this.isRunning) {
      this.cancel();
      return;
    }
    if (!this.canStart()) {
      const reason = this.getAutoBlockReason()
        || '請設定目標附加能力（屬性與數值），並確認星火道具。';
      return addLog(`⚠️ ${reason}`, 'log-fail');
    }
    if (BonusStatModule.costTab !== 'item') {
      BonusStatModule.setCostTab('item');
    }
    this.start();
  },

  async startNormalAuto() {
    let attempts = 0;

    while (!this.cancelled) {
      let hit = false;
      const batch = this.getBatchSize();
      for (let i = 0; i < batch && !this.cancelled; i += 1) {
        BonusStatModule.payResetCost(1);
        attempts += 1;
        BonusStatModule.lastAtkPow = BonusStatModule.itemData.bonusStat.atkPow;
        const { after } = BonusStatModule.performRoll();

        BonusStatModule.applyChoiceResult(after);

        if (this.matchesTargets(after)) {
          hit = true;
          break;
        }
      }
      if (hit) return { attempts, targetHit: true };
      if (this.cancelled) break;
      await new Promise((resolve) => setTimeout(resolve, this.getLoopDelayMs()));
    }

    return { attempts, targetHit: false };
  },

  async startMemorialAuto() {
    const snapshot = this.memorialSnapshotBefore
      || (BonusStatChoiceModule?.originalBefore
        ? cloneBonusStatState(BonusStatChoiceModule.originalBefore)
        : null)
      || cloneBonusStatState(BonusStatModule.itemData.bonusStat);
    this.memorialSnapshotBefore = snapshot;
    this.memorialAutoOverlayActive = true;
    this.hidePanelForMemorialAuto();
    this.bindCancelKeys();
    this.syncAutoCheckbox();
    this.startProgressAlert();
    let overlayOpened = false;
    let attempts = 0;
    const maxRolls = 50000;
    const delay = () => new Promise((resolve) => setTimeout(resolve, this.getLoopDelayMs()));
    const batch = this.getBatchSize();

    while (!this.cancelled && attempts < maxRolls) {
      let hit = false;
      for (let i = 0; i < batch && !this.cancelled && attempts < maxRolls; i += 1) {
        BonusStatModule.payResetCost(1);
        attempts += 1;

        const { before, after } = BonusStatModule.performRoll(snapshot);

        if (!overlayOpened) {
          BonusStatChoiceModule.openAutoSession(before, after, 1, { fadeIn: true });
          overlayOpened = true;
        } else {
          BonusStatChoiceModule.updateAutoSession(before, after, 1);
        }
        aeBsSyncChoiceAutoEnchantLayout?.();

        if (this.matchesTargets(after)) {
          this.lastChoiceStoppedForPick = true;
          this.choiceAutoSessionActive = true;
          BonusStatChoiceModule.render?.();
          hit = true;
          break;
        }
      }

      if (hit) {
        return { attempts, targetHit: true, stoppedForManualPick: true };
      }
      if (this.cancelled) break;
      await delay();
    }

    return { attempts, targetHit: false, stoppedForManualPick: false };
  },

  async start() {
    this.isRunning = true;
    this.cancelled = false;
    this.lastChoiceStoppedForPick = false;
    this.choiceAutoSessionActive = false;
    this.render();
    this.syncAutoCheckbox();
    BonusStatModule.updateResetButtonState?.();

    const isMemorial = this.isMemorialSelected();
    let attempts = 0;
    let targetHit = false;
    let stoppedForManualPick = false;

    try {
      if (isMemorial) {
        const result = await this.startMemorialAuto();
        attempts = result.attempts || 0;
        targetHit = result.targetHit;
        stoppedForManualPick = result.stoppedForManualPick;
      } else {
        this.startProgressAlert();
        const result = await this.startNormalAuto();
        attempts = result.attempts || 0;
        targetHit = result.targetHit;
        if (targetHit) {
          addLog(`✅ 附加能力自動重設：已達成全部目標（共 ${attempts} 次）`, 'log-success');
        }
      }
    } finally {
      this.isRunning = false;
      this.stopProgressAlert();
      if (isMemorial) {
        this.hidePanelForMemorialAuto();
        if (!stoppedForManualPick && !BonusStatChoiceModule.isOpen?.()) {
          const chk = document.getElementById('chkBonusStatAuto');
          if (chk) chk.checked = false;
        }
      }
      this.render();
      this.syncAutoCheckbox();
      BonusStatModule.updateResetButtonState?.();
      BonusStatChoiceModule.render?.();
      if (typeof updateStatusPanel === 'function') updateStatusPanel();
      aeBsSyncChoiceAutoEnchantLayout?.();
    }

    if (this.cancelled) {
      addLog(`⏹ 已取消自動重設（共 ${attempts} 次）`, 'log-info');
    } else if (stoppedForManualPick) {
      addLog(`🔥 BEFORE/AFTER 已出現目標附加能力，請自行選擇（共骰 ${attempts} 次）`, 'log-success');
    } else if (isMemorial && attempts > 0) {
      addLog(`⚠️ 自動重設結束（共 ${attempts} 次）`, 'log-info');
    }
  },

  applyButtonBg(el, buttonKey, state = 'normal') {
    const cfg = AUTO_ENCHANT_BONUS_STAT;
    const NS = AUTO_ENCHANT_NATIVE_SIZE.bonusStat;
    if (!el || !cfg?.buttons?.[buttonKey]) return;
    const stateSrc = cfg.buttons[buttonKey]?.states?.[state]?.src
      || cfg.buttons[buttonKey]?.states?.normal?.src;
    applyAutoEnchantImage(el, stateSrc, state, NS.ok.w, NS.ok.h);
  },

  renderStopButton(btn, cfg, NS) {
    if (!btn || !cfg?.stopAttackPower) return;
    btn.classList.toggle('is-checked', this.overspeedMode);
    btn.disabled = this.isRunning;
    btn.title = this.overspeedMode
      ? '高速模式：開啟（更快重骰）'
      : '高速模式：關閉';
    applyAutoEnchantImage(
      btn,
      cfg.stopAttackPower.labelSrc,
      'normal',
      NS.stopLabel.w,
      NS.stopLabel.h
    );
    const check = btn.querySelector('.ae-bs-stop-check');
    if (check) {
      applyAutoEnchantOverspeedCheck(
        check,
        this.overspeedMode ? cfg.stopAttackPower.checkedSrc : cfg.stopAttackPower.uncheckedSrc,
        this.overspeedMode,
        NS
      );
    }
  },

  renderResetButton(resetBtn, cfg, NS) {
    const resetSrc = cfg?.bonusStatView?.reset?.states?.normal?.src;
    if (!resetBtn || !resetSrc) return;
    resetBtn.disabled = this.isRunning;
    applyAutoEnchantImage(
      resetBtn,
      resetSrc,
      resetBtn.disabled ? 'disabled' : 'normal',
      NS.reset.w,
      NS.reset.h
    );
  },

  renderActionButton(btnAction, cfg, NS) {
    if (!btnAction) return;
    btnAction.disabled = this.isRunning ? false : !this.canStart();
    this.applyButtonBg(
      btnAction,
      this.isRunning ? 'cancel' : 'ok',
      btnAction.disabled && !this.isRunning ? 'disabled' : 'normal'
    );
    if (cfg.buttons?.ok?.toolTip) {
      const autoBlock = this.getAutoBlockReason();
      const needTarget = !this.groupTargets.some((g) => g.statId && (Number(g.minValue) || 0) > 0);
      btnAction.title = this.isRunning
        ? (cfg.buttons.cancel?.toolTip || '')
        : (autoBlock
          ? autoBlock
          : (needTarget
            ? '請設定至少一項目標附加能力與數值。'
            : cfg.buttons.ok.toolTip));
    }
  },

  fillComboSelect(index) {
    const wrap = this.getComboWrap(index);
    if (!wrap) return;

    const label = wrap.querySelector('.ae-bs-stat-combo-label');
    const scroll = wrap.querySelector('.ae-bs-stat-combo-scroll');
    const trigger = wrap.querySelector('.ae-bs-stat-combo-trigger');
    const current = this.groupTargets[index]?.statId || '';
    const options = this.buildStatOptions();
    const taken = this.getTakenStatIds(index);

    if (scroll) {
      scroll.innerHTML = '';
      options.filter((opt) => opt.key).forEach((opt) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'ae-bs-stat-combo-option';
        btn.dataset.value = opt.key;
        btn.setAttribute('role', 'option');
        btn.textContent = opt.label;
        if (taken.has(opt.key)) {
          btn.classList.add('is-taken');
          btn.disabled = true;
        } else {
          btn.addEventListener('click', (event) => {
            event.stopPropagation();
            this.pickComboOption(index, opt.key);
          });
        }
        scroll.appendChild(btn);
      });
    }

    const selected = options.find((opt) => opt.key === current) || options[0];
    if (label) label.textContent = selected?.label || '不選擇';

    if (trigger) {
      trigger.disabled = this.isRunning;
    }
    wrap.classList.toggle('is-disabled', this.isRunning);
  },

  renderRow(index) {
    const row = document.getElementById(`aeBsRow${index}`);
    const NS = AUTO_ENCHANT_NATIVE_SIZE.bonusStat;
    const rowTop = index * (NS.value.h + NS.valueRowGap);

    if (row) {
      row.style.backgroundImage = 'none';
      row.style.top = `${rowTop}px`;
    }

    const wrap = this.getComboWrap(index);
    const trigger = wrap?.querySelector('.ae-bs-stat-combo-trigger');
    const input = document.getElementById(`aeBsValue${index}`);

    if (wrap) {
      wrap.style.width = `${NS.combo.w}px`;
      wrap.style.height = `${NS.combo.h}px`;
      bindAeBsDropdownInteractions(wrap, trigger, NS.combo.w, NS.combo.h);
    }
    if (input) {
      input.style.width = `${NS.value.w}px`;
      input.style.height = `${NS.value.h}px`;
    }
    if (!this.isRunning) {
      this.fillComboSelect(index);
    } else if (wrap) {
      wrap.classList.add('is-disabled');
      if (trigger) trigger.disabled = true;
    }
    if (input) {
      input.disabled = this.isRunning;
      if (!this.isRunning) {
        input.value = this.groupTargets[index]?.minValue || '';
      }
    }
    if (trigger?._aeBsComboPaint && !wrap?.classList.contains('is-open')) {
      trigger._aeBsComboPaint('normal');
    }
  },

  render() {
    this.initComboHooks();
    this.sanitizeGroupTargets();
    const cfg = AUTO_ENCHANT_BONUS_STAT || {};
    const NS = AUTO_ENCHANT_NATIVE_SIZE.bonusStat;
    const panel = document.getElementById('aeBsPanel');
    const rowsHost = document.getElementById('aeBsRows') || document.querySelector('.ae-bs-rows');
    const viewBg = cfg?.bonusStatView?.backgrnd;

    if (panel && cfg.backgrnd) {
      applyAutoEnchantImage(panel, cfg.backgrnd, 'normal', NS.panel.w, NS.panel.h);
    }

    if (rowsHost && viewBg) {
      applyAutoEnchantImage(rowsHost, viewBg, 'normal', NS.view.w, NS.view.h);
    }

    for (let i = 0; i < 4; i += 1) {
      this.renderRow(i);
    }

    this.renderStopButton(document.getElementById('aeBsStopOverspeed'), cfg, NS);
    this.renderResetButton(document.getElementById('aeBsResetAll'), cfg, NS);
    this.renderActionButton(document.getElementById('aeBsBtnAction'), cfg, NS);
    this.syncAutoCheckbox();
  },
};

document.addEventListener('DOMContentLoaded', () => {
  AutoEnchantBonusStatModule.initPanelHooks();
});
