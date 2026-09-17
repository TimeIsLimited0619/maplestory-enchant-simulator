/**
 * 星力自動強化 — Enchant.img/autoEnchant/starForce 彈窗
 * 與舊版 checkbox（chkAutoEnhance）並存；素材就緒後替換 placeholder。
 */
const AutoEnchantStarForceModule = {
  isOpen: false,
  isRunning: false,
  cancelled: false,
  targetStar: 0,
  /** 分星防爆：鍵為當前星（強化 from→from+1） */
  protectDestroy: { 15: false, 16: false, 17: false },
  progressFrame: 0,
  progressTimer: null,
  cancelHandler: null,
  loopDelayMs: 8,
  /** 正服可防爆星：15～17 */
  PROTECT_STARS: [15, 16, 17],
  /** 自動強化開關預設開啟；卸裝／損壞後仍記住，放下一件再開窗 */
  preferAuto: true,

  canOpen() {
    if (typeof AUTO_ENCHANT_USE_OVERLAY === 'undefined' || !AUTO_ENCHANT_USE_OVERLAY) return false;
    if (!StarForceModule?.itemData) return false;
    if (typeof isStarforceBrokenItem === 'function' && isStarforceBrokenItem(StarForceModule.itemData)) {
      return false;
    }
    if (!canUseStarForce(StarForceModule.itemData)) return false;
    if (StarForceModule.selectedScrollId) return false;
    if (StarForceModule.autoRunning) return false;
    return true;
  },

  getMaxStar() {
    if (typeof getItemStarForceMaxStar === 'function') {
      return getItemStarForceMaxStar(StarForceModule.itemData);
    }
    return StarForceModule.getMaxStar?.() || 0;
  },

  getMinTarget() {
    return Math.min(StarForceModule.currentStars + 1, this.getMaxStar());
  },

  syncTargetDefault() {
    const min = this.getMinTarget();
    const max = this.getMaxStar();
    if (this.targetStar < min || this.targetStar > max) {
      this.targetStar = max;
    }
  },

  open() {
    if (!this.canOpen()) {
      if (StarForceModule.selectedScrollId) {
        return addLog('⚠️ 使用星力卷軸時無法開啟自動強化視窗。', 'log-fail');
      }
      return addLog('⚠️ 目前無法開啟自動強化視窗。', 'log-fail');
    }

    this.cancelled = false;
    this.syncTargetDefault();

    const overlay = document.getElementById('aeSfOverlay');
    if (overlay && typeof beginModalFadeIn === 'function') {
      beginModalFadeIn(overlay);
    } else if (overlay) {
      overlay.classList.remove('hidden');
      overlay.setAttribute('aria-hidden', 'false');
    }

    this.isOpen = true;
    this.preferAuto = true;
    const chk = document.getElementById('chkAutoEnhance');
    if (chk) chk.checked = true;
    this.render();
    this.bindCancelKeys();
  },

  close(options = {}) {
    if (this.isRunning) this.cancel();

    this.isOpen = false;
    this.unbindCancelKeys();
    this.stopProgressAlert();

    const overlay = document.getElementById('aeSfOverlay');
    if (overlay) {
      overlay.classList.add('hidden');
      overlay.setAttribute('aria-hidden', 'true');
    }

    // 預設記住自動強化；只有玩家關掉勾選才清掉
    if (options.keepPrefer === false) this.preferAuto = false;
    else this.preferAuto = true;
    const chk = document.getElementById('chkAutoEnhance');
    if (chk) chk.checked = this.preferAuto;
    this.syncAutoCheckbox();
  },

  initPanelHooks() {
    const chk = document.getElementById('chkAutoEnhance');
    if (!chk || chk.dataset.aeHooked) return;
    chk.dataset.aeHooked = '1';
    chk.addEventListener('change', () => {
      if (typeof AUTO_ENCHANT_USE_OVERLAY === 'undefined' || !AUTO_ENCHANT_USE_OVERLAY) return;

      if (chk.checked) {
        this.preferAuto = true;
        if (this.canOpen()) {
          this.open();
        } else if (!StarForceModule?.itemData) {
          addLog('⚠️ 請先放置裝備。', 'log-fail');
        } else if (StarForceModule.selectedScrollId) {
          chk.checked = false;
          this.preferAuto = false;
          addLog('⚠️ 使用星力卷軸時無法開啟自動強化視窗。', 'log-fail');
        }
      } else if (this.isOpen) {
        this.close({ keepPrefer: false });
      } else {
        this.preferAuto = false;
      }
    });
  },

  syncAutoCheckbox() {
    const chk = document.getElementById('chkAutoEnhance');
    if (!chk) return;

    const overlayOn = typeof AUTO_ENCHANT_USE_OVERLAY !== 'undefined' && AUTO_ENCHANT_USE_OVERLAY;
    if (!overlayOn) return;

    const canEnhance = Boolean(StarForceModule?.itemData)
      && canUseStarForce(StarForceModule.itemData)
      && !StarForceModule.selectedScrollId;

    chk.disabled = !canEnhance
      || this.isRunning
      || StarForceModule?.autoRunning
      || (!this.isOpen && !this.canOpen() && !this.preferAuto);
    if (this.preferAuto) chk.checked = true;
    if (this.isOpen && !this.isRunning) {
      chk.checked = true;
    }
  },

  tryOpenIfPreferred() {
    if (this.preferAuto && !this.isOpen && this.canOpen() && !this.isRunning) {
      this.open();
    }
  },

  bindCancelKeys() {
    if (this.cancelHandler) return;
    this.cancelHandler = (event) => {
      if (!this.isOpen) return;
      if (event.repeat) return;
      if (['Escape', 'Enter', ' '].includes(event.key)) {
        event.preventDefault();
        if (this.isRunning) this.cancel();
        else this.close();
      }
    };
    window.addEventListener('keydown', this.cancelHandler);
  },

  unbindCancelKeys() {
    if (!this.cancelHandler) return;
    window.removeEventListener('keydown', this.cancelHandler);
    this.cancelHandler = null;
  },

  adjustTarget(delta) {
    if (this.isRunning) return;
    const min = this.getMinTarget();
    const max = this.getMaxStar();
    this.targetStar = Math.max(min, Math.min(max, this.targetStar + delta));
    this.render();
  },

  setTargetMax() {
    if (this.isRunning) return;
    this.targetStar = this.getMaxStar();
    this.render();
  },

  onTargetInput(value) {
    if (this.isRunning) return;
    const num = parseInt(String(value).replace(/\D/g, ''), 10);
    if (!Number.isFinite(num)) return;
    const min = this.getMinTarget();
    const max = this.getMaxStar();
    this.targetStar = Math.max(min, Math.min(max, num));
    this.render();
  },

  toggleProtect(star) {
    if (this.isRunning) return;
    const n = Number(star);
    if (!this.PROTECT_STARS.includes(n)) return;
    this.protectDestroy[n] = !this.protectDestroy[n];
    this.render();
  },

  /** 正服可預設防爆星（15～17）；面板上可預先勾選 */
  isProtectStarAvailable(star) {
    return this.PROTECT_STARS.includes(Number(star));
  },

  /** 依當前星套用主面板防爆勾選 */
  applyProtectForCurrentStar() {
    if (typeof StarForceModule === 'undefined') return;
    const star = StarForceModule.currentStars;
    const want = this.isProtectStarAvailable(star) && Boolean(this.protectDestroy[star]);
    if (typeof StarForceModule.setProtectDestroyChecked === 'function') {
      if (StarForceModule.canUseProtectDestroy?.(star)) {
        const el = document.getElementById('chkProtectDestroy');
        if (el && !el.disabled) el.checked = want;
        else if (el && !want) el.checked = false;
      } else {
        StarForceModule.setProtectDestroyChecked(false);
      }
    }
    StarForceModule.syncProtectDestroyLock?.();
  },

  getProtectDestroyStars() {
    return Object.entries(this.protectDestroy)
      .filter(([star, on]) => on && this.isProtectStarAvailable(Number(star)))
      .map(([star]) => Number(star));
  },

  canStart() {
    if (!StarForceModule.itemData) return false;
    if (typeof isStarforceBrokenItem === 'function' && isStarforceBrokenItem(StarForceModule.itemData)) {
      return false;
    }
    if (StarForceModule.selectedScrollId) return false;
    if (StarForceModule.currentStars >= this.getMaxStar()) return false;
    return this.targetStar > StarForceModule.currentStars;
  },

  startProgressAlert() {
    this.stopProgressAlert();
    const frames = AUTO_ENCHANT_STAR_FORCE?.progressAlert || [];
    if (!frames.length) return;

    const img = document.getElementById('aeSfProgressAlert');
    if (!img) return;

    const tick = () => {
      const frame = frames[this.progressFrame % frames.length];
      this.progressFrame += 1;
      if (frame?.src) img.src = autoEnchantAssetPath(frame.src);
      img.classList.remove('hidden');
      this.progressTimer = window.setTimeout(tick, frame?.delay || 300);
    };
    tick();
  },

  stopProgressAlert() {
    if (this.progressTimer) {
      window.clearTimeout(this.progressTimer);
      this.progressTimer = null;
    }
    this.progressFrame = 0;
    const img = document.getElementById('aeSfProgressAlert');
    if (img) img.classList.add('hidden');
  },

  cancel() {
    if (!this.isRunning) return;
    this.cancelled = true;
    this.isRunning = false;
    StarForceModule.autoCancelled = true;
    StarForceModule.autoRunning = false;
    StarForceModule.unbindAutoCancelListener?.();
    StarForceModule.resetEnhanceButton?.();
    this.stopProgressAlert();
    this.render();
    addLog('⏹️ 已中止自動強化。', 'log-info');
  },

  async start() {
    if (this.isRunning || !this.canStart()) {
      return addLog('⚠️ 無法進行自動強化。請確認目標階段，或確認強化貨幣是否未選擇或不足。', 'log-fail');
    }

    this.isRunning = true;
    this.cancelled = false;
    StarForceModule.autoRunning = true;
    StarForceModule.autoCancelled = false;
    StarForceModule.updateEnhanceButtonState?.();

    const startStars = StarForceModule.currentStars;
    const target = this.targetStar;
    const maxStar = this.getMaxStar();
    let attempts = 0;
    let destroyed = false;
    let destroyAtStar = startStars;

    this.startProgressAlert();
    this.render();

    const logItem = aeSessionLogItemMeta(StarForceModule.itemData);
    aeSessionLogBegin({
      module: '星力',
      itemId: logItem.itemId,
      itemName: logItem.itemName,
      detail: {
        targetStar: target,
        startStars,
        protectStars: this.getProtectDestroyStars(),
      },
    });

    try {
      while (
        this.isRunning &&
        !this.cancelled &&
        StarForceModule.itemData &&
        StarForceModule.currentStars < target &&
        StarForceModule.currentStars < maxStar
      ) {
        this.applyProtectForCurrentStar();
        const prev = StarForceModule.currentStars;
        const outcome = StarForceModule.enhanceStar({
          silent: true,
        });
        attempts += 1;
        this.render();

        if (outcome === 'destroy'
          || !StarForceModule.itemData
          || (typeof isStarforceBrokenItem === 'function' && isStarforceBrokenItem(StarForceModule.itemData))
          || (typeof currentEnchantItem !== 'undefined' && !currentEnchantItem)) {
          destroyed = true;
          destroyAtStar = prev;
          this.isRunning = false;
          break;
        }

        const delay = StarForceModule.currentStars !== prev
          ? this.loopDelayMs * 2
          : this.loopDelayMs;
        await new Promise((resolve) => window.setTimeout(resolve, delay));

        if (attempts > 10000) break;
      }
    } finally {
      this.isRunning = false;
      StarForceModule.autoRunning = false;
      StarForceModule.autoCancelled = this.cancelled;
      StarForceModule.resetEnhanceButton?.();
      this.stopProgressAlert();
      this.render();
      this.syncAutoCheckbox();
    }

    if (destroyed) {
      if (this.isOpen) this.close({ keepPrefer: true });
      addLog(
        `💥 自動強化因裝備損壞中止：於 ★ ${destroyAtStar} 損壞（自 ★ ${startStars}，共 ${attempts} 次）`,
        'log-fail'
      );
    } else if (this.cancelled) {
      addLog(
        `⏹️ 已取消自動強化：★ ${startStars} → ★ ${StarForceModule.currentStars}（共 ${attempts} 次）`,
        'log-info'
      );
    } else {
      addLog(
        `⚡ 自動強化完成：★ ${startStars} → ★ ${StarForceModule.currentStars}（共 ${attempts} 次）`,
        'log-success'
      );
    }

    const sfTargetHit = !destroyed && StarForceModule.currentStars >= target && !this.cancelled;
    aeSessionLogEnd({
      outcome: destroyed
        ? 'fail'
        : aeSessionLogResolveOutcome({
          cancelled: this.cancelled,
          targetHit: sfTargetHit,
        }),
      attempts,
      targetHit: sfTargetHit,
      cancelled: this.cancelled,
      detail: {
        startStars,
        endStars: destroyed ? destroyAtStar : StarForceModule.currentStars,
        targetStar: target,
        destroyed,
        destroyAtStar: destroyed ? destroyAtStar : undefined,
      },
    });
  },

  applyButtonBg(el, buttonKey, state = 'normal') {
    if (!el || !AUTO_ENCHANT_STAR_FORCE?.buttons?.[buttonKey]) return;
    const stateSrc = AUTO_ENCHANT_STAR_FORCE.buttons[buttonKey]?.states?.[state]?.src
      || AUTO_ENCHANT_STAR_FORCE.buttons[buttonKey]?.states?.normal?.src;
    const NS = AUTO_ENCHANT_NATIVE_SIZE.starForceButtons;
    const dim = buttonKey === 'all' ? NS.all : buttonKey === 'up' || buttonKey === 'down' ? NS[buttonKey] : NS.ok;
    applyAutoEnchantImage(el, stateSrc, state, dim.w, dim.h);
  },

  onActionClick() {
    if (this.isRunning) {
      this.cancel();
    } else {
      this.start();
    }
  },

  bindActionButtonInteractions(btnAction) {
    if (!btnAction || btnAction.dataset.aeBtnBound) return;

    bindAutoEnchantButtonInteractions(btnAction, () => {
      const cfg = AUTO_ENCHANT_STAR_FORCE;
      const NS = AUTO_ENCHANT_NATIVE_SIZE.starForceButtons;
      const buttonKey = this.isRunning ? 'cancel' : 'ok';
      const normalSrc = cfg?.buttons?.[buttonKey]?.states?.normal?.src;
      if (!normalSrc) return null;
      return {
        relativePath: normalSrc,
        disabled: btnAction.disabled,
        w: NS.ok.w,
        h: NS.ok.h,
      };
    });
  },

  renderActionButton(btnAction, cfg) {
    if (!btnAction) return;

    btnAction.disabled = !this.isRunning && !this.canStart();
    this.bindActionButtonInteractions(btnAction);

    if (btnAction._aePaint) {
      btnAction._aePaint('normal');
    } else {
      const buttonKey = this.isRunning ? 'cancel' : 'ok';
      this.applyButtonBg(
        btnAction,
        buttonKey,
        btnAction.disabled ? 'disabled' : 'normal'
      );
    }

    const okTip = cfg.buttons?.ok?.toolTip || '將連續進行自動強化至目標階段。';
    const cancelTip = cfg.buttons?.cancel?.toolTip || '點擊 Space、ESC、Enter 鍵即可中止自動強化。';
    const disabledTip = cfg.buttons?.ok?.toolTipDisabled;
    if (this.isRunning) {
      btnAction.title = cancelTip;
    } else if (btnAction.disabled && disabledTip) {
      btnAction.title = disabledTip;
    } else {
      btnAction.title = okTip;
    }
  },

  bindTargetButtonInteractions(btn, buttonKey) {
    if (!btn || btn.dataset.aeBtnBound) return;

    bindAutoEnchantButtonInteractions(btn, () => {
      const cfg = AUTO_ENCHANT_STAR_FORCE;
      const NS = AUTO_ENCHANT_NATIVE_SIZE.starForceButtons;
      const normalSrc = cfg?.buttons?.[buttonKey]?.states?.normal?.src;
      if (!normalSrc) return null;
      const dim = NS[buttonKey];
      return {
        relativePath: normalSrc,
        disabled: btn.disabled,
        w: dim.w,
        h: dim.h,
      };
    });
  },

  renderTargetButton(btn, buttonKey, disabled) {
    if (!btn) return;

    btn.disabled = disabled;
    this.bindTargetButtonInteractions(btn, buttonKey);

    if (btn._aePaint) {
      btn._aePaint('normal');
    } else {
      this.applyButtonBg(btn, buttonKey, btn.disabled ? 'disabled' : 'normal');
    }
  },

  isTargetUpDisabled() {
    if (this.isRunning) return true;
    return this.targetStar >= this.getMaxStar();
  },

  isTargetDownDisabled() {
    if (this.isRunning) return true;
    const current = StarForceModule.currentStars ?? 0;
    return this.targetStar <= current || this.targetStar <= this.getMinTarget();
  },

  render() {
    const cfg = AUTO_ENCHANT_STAR_FORCE || {};
    const panel = document.getElementById('aeSfPanel');
    if (panel && cfg.backgrnd) {
      const NS = AUTO_ENCHANT_NATIVE_SIZE.starForce.panel;
      applyAutoEnchantImage(panel, cfg.backgrnd, 'normal', NS.w, NS.h);
    }

    const beforeEl = document.getElementById('aeSfStarBefore');
    const targetInput = document.getElementById('aeSfStarTarget');
    if (beforeEl) beforeEl.textContent = String(StarForceModule.currentStars ?? 0);
    if (targetInput && document.activeElement !== targetInput) {
      targetInput.value = String(this.targetStar);
    }

    this.PROTECT_STARS.forEach((star) => {
      const el = document.getElementById(`aeSfProtect${star}`);
      if (!el) return;
      if (el.dataset.aeProtectBound !== '1') {
        el.dataset.aeProtectBound = '1';
        // HTML 已有 onclick；這裡不再重複綁定，避免連點切兩次
      }
      const interactive = !this.isRunning;
      const checked = Boolean(this.protectDestroy[star]);
      // 勿用 disabled：素材 _disabled_ 才是帶開關的「關閉」外觀，disabled 會擋點擊
      el.disabled = false;
      el.setAttribute('aria-disabled', interactive ? 'false' : 'true');
      el.classList.toggle('is-checked', checked);
      el.classList.toggle('is-locked', !interactive);
      const protect = cfg.protectDestroy?.[star];
      const NS = AUTO_ENCHANT_NATIVE_SIZE.starForceButtons.protect;
      if (protect?.labelSrc) {
        el.textContent = '';
        // WZ：_disabled_＝含開關的關閉態；_normal_＝開啟態標籤
        applyAutoEnchantImage(
          el,
          protect.labelSrc,
          checked ? 'normal' : 'disabled',
          NS.w,
          NS.h,
        );
        el.dataset.aeProtectState = checked ? 'checked' : 'normal';
      } else {
        el.textContent = `${star}星防破壞`;
      }
      el.title = !interactive
        ? '自動強化進行中，無法變更防破壞'
        : (checked ? `已開啟 ${star}→${star + 1} 防止破壞` : `點擊開啟 ${star}→${star + 1} 防止破壞`);
    });

    const btnAction = document.getElementById('aeSfBtnAction');
    const btnUp = document.getElementById('aeSfBtnUp');
    const btnDown = document.getElementById('aeSfBtnDown');
    const btnAll = document.getElementById('aeSfBtnAll');

    const idle = !this.isRunning;
    this.renderActionButton(btnAction, cfg);
    this.renderTargetButton(btnUp, 'up', this.isTargetUpDisabled());
    this.renderTargetButton(btnDown, 'down', this.isTargetDownDisabled());
    if (btnAll) {
      btnAll.disabled = !idle;
      this.applyButtonBg(btnAll, 'all', btnAll.disabled ? 'disabled' : 'normal');
    }

    this.syncAutoCheckbox();
  },
};
