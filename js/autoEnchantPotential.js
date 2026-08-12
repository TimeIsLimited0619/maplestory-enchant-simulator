/**
 * 主潛能自動重設 — Enchant.img/autoEnchant/potential 彈窗
 * 與舊版 checkbox（chkPotentialAuto）並存；素材就緒後替換 placeholder。
 */
const AutoEnchantPotentialModule = {
  isOpen: false,
  isRunning: false,
  cancelled: false,
  choiceAutoSessionActive: false,
  lastChoiceStoppedForPick: false,
  lastRankUpStoppedForPick: false,
  memorialSnapshotBefore: null,
  memorialAutoOverlayActive: false,
  /** @type {string[][]} 四組×三排目標詞條；空字串＝不指定 */
  groupTargets: [['', '', ''], ['', '', ''], ['', '', ''], ['', '', '']],
  /** 超速模式：縮短自動重設每輪間隔 */
  overspeedMode: false,
  progressFrame: 0,
  progressTimer: null,
  cancelHandler: null,
  /** 自動閃炫已開啟六選 UI，關閉 hexa 後才允許點背景關閉本視窗 */
  hexaAutoSessionActive: false,

  getLoopDelayMs() {
    return aePotGetAutoEnchantLoopDelayMs(this.overspeedMode);
  },

  getBatchSize() {
    return aePotGetAutoEnchantBatchSize(this.overspeedMode);
  },

  isMemoriaSelected() {
    return aePotIsMemoriaCube?.(PotentialModule.getSelectedCube?.());
  },

  isMemoriaAutoMode() {
    return this.isRunning && this.isMemoriaSelected();
  },

  getAutoEnchantBlockReason() {
    const cube = PotentialModule.getSelectedCube();
    const cubeBlock = typeof getPotentialCubeBlockReason === 'function'
      ? getPotentialCubeBlockReason(cube, PotentialModule.itemData)
      : null;
    if (cubeBlock) return cubeBlock;
    const base = aePotGetAutoEnchantLegendaryBlockReason(
      cube,
      PotentialModule.itemData?.potential,
      { forAddPotential: false }
    );
    if (base) return base;
    if (PotentialModule.isMemoriaOverlayOpen?.() && !this.memorialAutoOverlayActive) {
      return '請先完成 BEFORE/AFTER 選擇。';
    }
    if (this.choiceAutoSessionActive) return '請先完成 BEFORE/AFTER 選擇。';
    return null;
  },

  canOpen() {
    if (typeof AUTO_ENCHANT_USE_OVERLAY === 'undefined' || !AUTO_ENCHANT_USE_OVERLAY) return false;
    if (!PotentialModule?.itemData) return false;
    if (PotentialModule.isHexaOverlayOpen?.()) return false;
    if (PotentialModule.isUniOverlayOpen?.()) return false;
    if (PotentialModule.isMemoriaOverlayOpen?.()) return false;
    if (this.isRunning) return false;
    return true;
  },

  isRollableCube(cube) {
    if (!cube) return false;
    if (cube.memoriaPick) return false;
    if (aePotIsHexaCube(cube) || aePotIsUnionCube(cube)) return true;
    return Boolean(cube.rateKey || typeof rerollPotential === 'function');
  },

  getRateKey() {
    const cube = PotentialModule.getSelectedCube();
    if (!cube) return 'equal';
    if (cube.rateKey) return cube.rateKey;
    if (cube.hexaPick) return 'dazzling';
    return 'equal';
  },

  buildStatOptions(lineIndex) {
    const item = PotentialModule.itemData;
    if (!item || typeof PotentialInspectModule === 'undefined') return [];

    const config = PotentialInspectModule.getConfig();
    const rateKey = PotentialInspectModule.getSelectedCubeRateKey(config);
    const data = PotentialInspectModule.buildInspectData(item, 'potential', rateKey);

    return buildAutoEnchantStatOptions(data, lineIndex, item);
  },

  normalizeLineLabel(line) {
    return (line?.label || '').replace(/%$/, '');
  },

  lineMatchesTarget(line, targetKey) {
    return aePotLineMatchesTarget(line, targetKey);
  },

  groupHasTarget(group) {
    return group.some(Boolean);
  },

  groupMatches(potential, group) {
    if (!this.groupHasTarget(group)) return false;
    const cube = PotentialModule.getSelectedCube();
    if (aePotIsUnionCube(cube)) {
      return aePotLineIndexGroupMatches(potential, group);
    }
    if (aePotIsHexaCube(cube)) {
      return aePotHexaGroupMatches(potential, group);
    }
    return aePotGroupMatches(potential, group);
  },

  matchesTargets(potential) {
    return this.groupTargets.some((group) => this.groupMatches(potential, group));
  },

  shouldStopSuccess(potential) {
    return this.matchesTargets(potential);
  },

  canStart() {
    if (!PotentialModule.itemData) return false;
    const cube = PotentialModule.getSelectedCube();
    if (this.isMemoriaSelected()) {
      if (!cube?.memoriaPick) return false;
      if (this.getAutoEnchantBlockReason()) return false;
      if (typeof PotentialEffectModule !== 'undefined' && PotentialEffectModule.isPlaying()) return false;
      return this.groupTargets.some((group) => group.some(Boolean));
    }
    if (!this.isRollableCube(cube)) return false;
    if (this.getAutoEnchantBlockReason()) return false;
    if (typeof PotentialEffectModule !== 'undefined' && PotentialEffectModule.isPlaying()) return false;

    const hasLineTarget = this.groupTargets.some((group) => group.some(Boolean));
    if (!hasLineTarget) return false;
    return true;
  },

  open() {
    if (!PotentialModule.itemData) {
      return addLog('⚠️ 請先放置裝備。', 'log-fail');
    }

    this.cancelled = false;

    const overlay = document.getElementById('aePotOverlay');
    if (overlay && typeof beginModalFadeIn === 'function') {
      beginModalFadeIn(overlay);
    } else if (overlay) {
      overlay.classList.remove('hidden');
      overlay.setAttribute('aria-hidden', 'false');
    }

    this.isOpen = true;
    const chk = document.getElementById('chkPotentialAuto');
    if (chk) chk.checked = true;
    this.render();
    this.syncAutoCheckbox();
    this.bindCancelKeys();
    PotentialModule.updateResetButtonState?.();
    aePotSyncHexaAutoEnchantLayout?.();
  },

  hidePanelForMemorialAuto() {
    const overlay = document.getElementById('aePotOverlay');
    if (overlay) {
      overlay.classList.add('hidden');
      overlay.setAttribute('aria-hidden', 'true');
    }
    this.isOpen = false;
    PotentialModule.updateResetButtonState?.();
    aePotSyncMemoriaAutoEnchantLayout?.();
  },

  getProgressAlertEl() {
    if (this.isMemoriaSelected() && (this.isRunning || this.memorialAutoOverlayActive)) {
      return document.getElementById('ptMemoriaProgressAlert')
        || document.getElementById('aePotProgressAlert');
    }
    return document.getElementById('aePotProgressAlert');
  },

  close() {
    if (this.isRunning) this.cancel();

    this.isOpen = false;
    this.hexaAutoSessionActive = false;
    this.choiceAutoSessionActive = false;
    this.lastChoiceStoppedForPick = false;
    this.lastRankUpStoppedForPick = false;
    this.memorialSnapshotBefore = null;
    this.memorialAutoOverlayActive = false;
    this.unbindCancelKeys();
    this.stopProgressAlert();

    const overlay = document.getElementById('aePotOverlay');
    if (overlay) {
      overlay.classList.add('hidden');
      overlay.setAttribute('aria-hidden', 'true');
    }

    const chk = document.getElementById('chkPotentialAuto');
    if (chk) chk.checked = false;
    this.syncAutoCheckbox();
    PotentialModule.updateResetButtonState?.();
    aePotSyncHexaAutoEnchantLayout?.();
    aePotSyncMemoriaAutoEnchantLayout?.();
  },

  onMemoriaOverlayClosed() {
    this.choiceAutoSessionActive = false;
    this.lastChoiceStoppedForPick = false;
    this.lastRankUpStoppedForPick = false;
    this.memorialSnapshotBefore = null;
    this.memorialAutoOverlayActive = false;
    this.stopProgressAlert();

    const chk = document.getElementById('chkPotentialAuto');
    if (chk) chk.checked = false;

    if (this.isOpen) {
      this.syncAutoCheckbox();
      this.render();
    } else {
      this.syncAutoCheckbox();
    }
    PotentialModule.updateResetButtonState?.();
    aePotSyncMemoriaAutoEnchantLayout?.();
  },

  initPanelHooks() {
    const chk = document.getElementById('chkPotentialAuto');
    if (!chk || chk.dataset.aeHooked) return;
    chk.dataset.aeHooked = '1';
    chk.addEventListener('change', () => {
      if (chk.checked) {
        if (this.canOpen()) {
          this.open();
        } else {
          chk.checked = false;
          if (!PotentialModule?.itemData) {
            addLog('⚠️ 請先放置裝備。', 'log-fail');
          }
        }
      } else if (this.isOpen) {
        this.close();
      } else if (this.isRunning || this.memorialAutoOverlayActive) {
        this.cancel(this.memorialAutoOverlayActive);
      }
    });
  },

  syncAutoCheckbox() {
    const chk = document.getElementById('chkPotentialAuto');
    if (!chk) return;

    const overlayOn = typeof AUTO_ENCHANT_USE_OVERLAY !== 'undefined' && AUTO_ENCHANT_USE_OVERLAY;
    if (!overlayOn) {
      chk.disabled = true;
      return;
    }

    chk.disabled = this.isRunning || (!this.isOpen && !this.canOpen() && !this.memorialAutoOverlayActive);
    if (this.isOpen && !this.isRunning) {
      chk.checked = true;
    } else if (this.memorialAutoOverlayActive && (this.choiceAutoSessionActive || PotentialModule.isMemoriaOverlayOpen?.())) {
      chk.checked = true;
      chk.disabled = this.choiceAutoSessionActive;
    }
  },

  onBackdropClick() {
    if (PotentialModule.isHexaOverlayOpen?.()) return;
    this.close();
  },

  onHexaOverlayClosed() {
    this.hexaAutoSessionActive = false;
    if (this.isOpen) {
      this.syncAutoCheckbox();
      this.render();
    }
  },

  onActionClick() {
    if (this.isRunning) {
      this.cancel();
    } else {
      this.start();
    }
  },

  bindCancelKeys() {
    if (this.cancelHandler) return;
    this.cancelHandler = (event) => {
      if (!this.isRunning) return;
      if (event.repeat) return;
      if (PotentialModule.isHexaOverlayOpen?.()) return;
      if (['Escape', 'Enter', ' '].includes(event.key)) {
        event.preventDefault();
        const fromChoice = PotentialModule.isMemoriaOverlayOpen?.() && this.isMemoriaAutoMode();
        this.cancel(fromChoice);
      }
    };
    window.addEventListener('keydown', this.cancelHandler);
  },

  unbindCancelKeys() {
    if (!this.cancelHandler) return;
    window.removeEventListener('keydown', this.cancelHandler);
    this.cancelHandler = null;
  },

  setGroupTarget(groupIndex, lineIndex, value) {
    if (this.isRunning) return;
    if (groupIndex < 0 || groupIndex > 3) return;
    if (lineIndex < 0 || lineIndex > 2) return;
    this.groupTargets[groupIndex][lineIndex] = value || '';
    this.render();
  },

  resetTargets() {
    if (this.isRunning) return;
    this.groupTargets = [['', '', ''], ['', '', ''], ['', '', ''], ['', '', '']];
    this.render();
  },

  resetSessionSettings() {
    if (this.isRunning) return;
    this.groupTargets = [['', '', ''], ['', '', ''], ['', '', ''], ['', '', '']];
    this.overspeedMode = false;
    if (this.isOpen) this.render();
  },

  onEquipChanged() {
    if (this.isRunning) return;
    if (this.isOpen) {
      this.close();
    }
    this.resetSessionSettings();
  },

  resetGroup(groupIndex) {
    if (this.isRunning) return;
    if (groupIndex < 0 || groupIndex > 3) return;
    this.groupTargets[groupIndex] = ['', '', ''];
    this.render();
  },

  toggleOverspeedMode() {
    if (this.isRunning) return;
    this.overspeedMode = !this.overspeedMode;
    this.render();
  },

  startProgressAlert() {
    this.stopProgressAlert();
    const frames = AUTO_ENCHANT_POTENTIAL?.progressAlert || [];
    const img = this.getProgressAlertEl();
    if (!img || !frames.length) return;

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
    ['aePotProgressAlert', 'ptMemoriaProgressAlert'].forEach((id) => {
      const img = document.getElementById(id);
      if (img) {
        img.classList.add('hidden');
        img.removeAttribute('src');
      }
    });
  },

  cancel(fromChoiceOverlay = false) {
    if (!this.isRunning && !this.choiceAutoSessionActive && !fromChoiceOverlay) return;
    this.cancelled = true;
    this.isRunning = false;
    this.stopProgressAlert();

    if (this.isMemoriaSelected?.() && PotentialModule.isMemoriaOverlayOpen?.()) {
      // 裝備狀態回 BEFORE；畫面 AFTER 保留最後一次骰出結果
      if (this.memorialSnapshotBefore) {
        PotentialModule.itemData.potential = PotentialModule.cloneMemoriaPotential(this.memorialSnapshotBefore);
        PotentialModule.syncPotentialOverallRank();
        const lastAfter = PotentialModule.memoriaAfter
          ? PotentialModule.cloneMemoriaPotential(PotentialModule.memoriaAfter)
          : PotentialModule.cloneMemoriaPotential(this.memorialSnapshotBefore);
        PotentialModule.updateMemoriaAutoSession(
          this.memorialSnapshotBefore,
          lastAfter
        );
      }
    } else if (!fromChoiceOverlay && PotentialModule.isMemoriaOverlayOpen?.()) {
      PotentialModule.closeMemoriaOverlay();
    }

    this.choiceAutoSessionActive = false;
    this.lastChoiceStoppedForPick = false;
    this.lastRankUpStoppedForPick = false;
    PotentialModule.updateResetButtonState?.();
    PotentialModule.renderMemoriaOverlay?.();
    this.render();
    aePotSyncMemoriaAutoEnchantLayout?.();

    const chk = document.getElementById('chkPotentialAuto');
    if (chk) chk.checked = false;
    addLog('⏹️ 已中止自動重設。', 'log-info');
  },

  async restartMemorialAutoFromChoice() {
    if (this.isRunning) return;
    if (!this.isMemoriaSelected()) return;
    if (!PotentialModule.isMemoriaOverlayOpen?.()) return;

    this.cancelled = false;
    this.choiceAutoSessionActive = false;
    this.lastChoiceStoppedForPick = false;
    this.lastRankUpStoppedForPick = false;
    await this.start();
  },

  applyRollSilent(rolled, cube) {
    const { mirrorCopied, ...potential } = rolled;
    PotentialModule.itemData.potential = potential;
    PotentialModule.syncPotentialOverallRank(potential);
    PotentialModule.lastAtkPow = potential.atkPow;
    PotentialModule.updateUI();
    if (typeof updateStatusPanel === 'function') updateStatusPanel();
    return mirrorCopied;
  },

  applyPotentialSilent(potential) {
    PotentialModule.itemData.potential = potential;
    PotentialModule.syncPotentialOverallRank(potential);
    PotentialModule.lastAtkPow = potential.atkPow;
    PotentialModule.updateUI();
    if (typeof updateStatusPanel === 'function') updateStatusPanel();
  },

  async delayLoop() {
    await new Promise((resolve) => window.setTimeout(resolve, this.getLoopDelayMs()));
  },

  async startNormalAuto(cube, startAtkPow) {
    let attempts = 0;
    while (
      this.isRunning &&
      !this.cancelled &&
      PotentialModule.itemData &&
      this.isRollableCube(cube)
    ) {
      let hit = false;
      const batch = this.getBatchSize();
      for (let i = 0; i < batch && this.isRunning && !this.cancelled; i += 1) {
        if (!PotentialModule.itemData || !this.isRollableCube(cube)) break;
        consumePlayerCube(cube.id);
        const rolled = rerollPotential(cube, PotentialModule.itemData.potential, PotentialModule.itemData);
        this.applyRollSilent(rolled, cube);
        attempts += 1;
        this.render();
        if (this.shouldStopSuccess(PotentialModule.itemData.potential)) {
          hit = true;
          break;
        }
        if (attempts > 50000) break;
      }
      if (hit || attempts > 50000) break;
      await this.delayLoop();
    }
    return attempts;
  },

  async startHexaAuto(cube, startAtkPow) {
    const item = PotentialModule.itemData;
    const rateKey = cube.rateKey || 'dazzling';
    const result = await aePotRunHexaAutoEnchant({
      cube,
      rollSession: () => (
        typeof rollDazzlingHexaChoices === 'function'
          ? rollDazzlingHexaChoices(item, item.potential, rateKey)
          : null
      ),
      consumeCube: () => consumePlayerCube(cube.id),
      groups: this.groupTargets,
      groupMatchesFn: aePotHexaGroupMatches,
      sessionReady: (session) => (
        aePotHexaSessionHasTargetMatch(session, this.groupTargets)
      ),
      openOverlayWithSession: (c, session, opts) => (
        PotentialModule.openHexaOverlayWithSession?.(c, session, opts) ?? false
      ),
      updateOverlaySession: (session) => (
        PotentialModule.updateHexaAutoSession?.(session) ?? false
      ),
      isRunning: () => this.isRunning,
      isCancelled: () => this.cancelled,
      loopDelayMs: this.getLoopDelayMs(),
      batchSize: this.getBatchSize(),
      onProgress: () => {
        PotentialModule.updateUI?.();
        this.render();
      },
    });
    this.lastHexaStoppedForPick = result.stoppedForManualPick;
    if (result.overlayOpened) {
      this.hexaAutoSessionActive = true;
    }
    return result.attempts;
  },

  async startUniAuto(cube, startAtkPow) {
    const rateKey = cube.rateKey || 'union';
    const result = await aePotRunUnionAutoEnchant({
      getItem: () => PotentialModule.itemData,
      getPotential: () => PotentialModule.itemData?.potential,
      setPotential: (potential) => this.applyPotentialSilent(potential),
      consumeCube: () => consumePlayerCube(cube.id),
      rateKey,
      groups: this.groupTargets,
      shouldStop: (potential) => this.shouldStopSuccess(potential),
      isRunning: () => this.isRunning,
      isCancelled: () => this.cancelled,
      loopDelayMs: this.getLoopDelayMs(),
      batchSize: this.getBatchSize(),
      onProgress: () => this.render(),
    });
    this.lastUniReselectUses = result.reselectUses;
    this.lastUniResetUses = result.resetUses;
    return result.attempts;
  },

  async startMemoriaAuto() {
    const cube = PotentialModule.getSelectedCube();
    const snapshot = this.memorialSnapshotBefore
      || PotentialModule.cloneMemoriaPotential(PotentialModule.itemData.potential);
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
      let stoppedRankUp = false;
      for (let i = 0; i < batch && !this.cancelled && attempts < maxRolls; i += 1) {
        consumePlayerCube(cube.id);
        attempts += 1;

        const rolled = rerollPotential(cube, snapshot, PotentialModule.itemData);
        const after = PotentialModule.cloneMemoriaPotential(rolled);

        if (!overlayOpened) {
          PotentialModule.openMemoriaAutoSession(snapshot, after, cube, { fadeIn: true });
          overlayOpened = true;
        } else {
          PotentialModule.updateMemoriaAutoSession(snapshot, after);
        }
        aePotSyncMemoriaAutoEnchantLayout?.();

        const rankUp = PotentialModule.isMemoriaRankUp(snapshot, after);
        if (rankUp) {
          this.lastRankUpStoppedForPick = true;
          this.lastChoiceStoppedForPick = true;
          this.choiceAutoSessionActive = true;
          PotentialModule.renderMemoriaOverlay?.();
          stoppedRankUp = true;
          break;
        }

        if (this.matchesTargets(after)) {
          this.lastChoiceStoppedForPick = true;
          this.choiceAutoSessionActive = true;
          PotentialModule.renderMemoriaOverlay?.();
          hit = true;
          break;
        }
      }

      if (stoppedRankUp) {
        return { attempts, targetHit: false, stoppedForManualPick: true, stoppedForRankUp: true };
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
    if (this.isRunning || !this.canStart()) {
      return addLog('⚠️ 無法進行自動重設。請確認目標潛在能力，或確認強化貨幣是否未選擇或不足。', 'log-fail');
    }

    const cube = PotentialModule.getSelectedCube();
    this.isRunning = true;
    this.cancelled = false;
    this.lastChoiceStoppedForPick = false;
    this.lastRankUpStoppedForPick = false;
    this.choiceAutoSessionActive = false;
    PotentialModule.updateResetButtonState?.();

    const isMemoria = this.isMemoriaSelected();
    const startAtkPow = PotentialModule.itemData.potential?.atkPow || 0;
    let attempts = 0;
    let targetHit = false;
    let stoppedForManualPick = false;
    let stoppedForRankUp = false;

    if (!isMemoria) {
      this.startProgressAlert();
    }
    this.render();

    try {
      if (isMemoria) {
        const result = await this.startMemoriaAuto();
        attempts = result.attempts || 0;
        targetHit = result.targetHit;
        stoppedForManualPick = result.stoppedForManualPick;
        stoppedForRankUp = result.stoppedForRankUp;
      } else if (aePotIsHexaCube(cube)) {
        attempts = await this.startHexaAuto(cube, startAtkPow);
      } else if (aePotIsUnionCube(cube)) {
        attempts = await this.startUniAuto(cube, startAtkPow);
      } else {
        attempts = await this.startNormalAuto(cube, startAtkPow);
      }
    } finally {
      this.isRunning = false;
      this.stopProgressAlert();
      if (isMemoria && !stoppedForManualPick && !PotentialModule.isMemoriaOverlayOpen?.()) {
        const chk = document.getElementById('chkPotentialAuto');
        if (chk) chk.checked = false;
      }
      this.render();
      PotentialModule.updateResetButtonState?.();
      PotentialModule.renderMemoriaOverlay?.();
      if (typeof updateStatusPanel === 'function') updateStatusPanel();
      aePotSyncMemoriaAutoEnchantLayout?.();
    }

    if (!isMemoria) {
      const finalPot = PotentialModule.itemData?.potential;
      targetHit = finalPot && this.matchesTargets(finalPot);
    }
    const uniReselect = this.lastUniReselectUses || 0;
    const uniReset = this.lastUniResetUses || 0;
    const hexaReady = this.lastHexaStoppedForPick;
    let attemptLabel = `共 ${attempts} 次`;
    if (aePotIsUnionCube(cube) && (uniReselect > 0 || uniReset > 0)) {
      attemptLabel = `重新選擇 ${uniReselect} 次、重新設定 ${uniReset} 次（方塊 ${attempts} 顆）`;
    } else if (aePotIsHexaCube(cube)) {
      attemptLabel = `共骰 ${attempts} 次`;
    }

    if (this.cancelled) {
      addLog(`⏹️ 已取消自動重設（${attemptLabel}）`, 'log-info');
    } else if (stoppedForRankUp && isMemoria) {
      addLog(`🔮 洗鍊中稀有度提升，請選擇 AFTER（共骰 ${attempts} 次）`, 'log-success');
    } else if (stoppedForManualPick && isMemoria) {
      addLog(`🔮 BEFORE/AFTER 已出現目標潛在能力，請自行選擇（共骰 ${attempts} 次）`, 'log-success');
    } else if (hexaReady && aePotIsHexaCube(cube)) {
      addLog(`🔮 六選中已出現目標潛能，請自行選擇三項（${attemptLabel}）`, 'log-success');
    } else if (targetHit) {
      addLog(`🔮 自動重設完成：已達成目標潛在能力（${attemptLabel}）`, 'log-success');
    } else {
      addLog(`⚠️ 自動重設結束（${attemptLabel}）`, 'log-info');
    }
    this.lastUniReselectUses = 0;
    this.lastUniResetUses = 0;
    this.lastHexaStoppedForPick = false;
  },

  renderStopAtkButton(stopBtn, cfg, NS) {
    if (!stopBtn) return;

    stopBtn.disabled = this.isRunning;
    stopBtn.title = this.overspeedMode
      ? '超速模式：開啟（更快重骰）'
      : '超速模式：關閉';
    if (cfg.stopAttackPower?.labelSrc) {
      applyAutoEnchantImage(
        stopBtn,
        cfg.stopAttackPower.labelSrc,
        stopBtn.disabled ? 'disabled' : 'normal',
        NS.stopLabel.w,
        NS.stopLabel.h
      );
    }

    let checkEl = stopBtn.querySelector('.ae-pot-stop-atk-check');
    if (!checkEl) {
      checkEl = document.createElement('span');
      checkEl.className = 'ae-pot-stop-atk-check';
      checkEl.setAttribute('aria-hidden', 'true');
      stopBtn.appendChild(checkEl);
    }

    const checkSrc = this.overspeedMode
      ? cfg.stopAttackPower?.checkedSrc
      : cfg.stopAttackPower?.uncheckedSrc;
    if (checkSrc) {
      applyAutoEnchantOverspeedCheck(checkEl, checkSrc, this.overspeedMode, NS);
    }
  },

  bindActionButtonInteractions(btnAction) {
    if (!btnAction || btnAction.dataset.aeBtnBound) return;

    bindAutoEnchantButtonInteractions(btnAction, () => {
      const cfg = AUTO_ENCHANT_POTENTIAL;
      const NS = AUTO_ENCHANT_NATIVE_SIZE.potential;
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

  renderActionButton(btnAction, cfg, NS) {
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

    if (cfg.buttons?.ok?.toolTip) {
      btnAction.title = btnAction.disabled && cfg.buttons.ok.toolTipDisabled
        ? cfg.buttons.ok.toolTipDisabled
        : (this.isRunning ? (cfg.buttons.cancel?.toolTip || '') : cfg.buttons.ok.toolTip);
    }
  },

  applyButtonBg(el, buttonKey, state = 'normal') {
    const cfg = AUTO_ENCHANT_POTENTIAL;
    const NS = AUTO_ENCHANT_NATIVE_SIZE.potential;
    if (!el || !cfg?.buttons?.[buttonKey]) return;
    const stateSrc = cfg.buttons[buttonKey]?.states?.[state]?.src
      || cfg.buttons[buttonKey]?.states?.normal?.src;
    applyAutoEnchantImage(el, stateSrc, state, NS.ok.w, NS.ok.h);
  },

  renderRowChrome(cfg) {
    const NS = AUTO_ENCHANT_NATIVE_SIZE.potential;
    const viewBg = cfg.potentialView?.backgrnd;
    const resetSrc = cfg.potentialView?.reset?.states?.normal?.src;

    ['title1', 'title2', 'title3', 'title4'].forEach((key, index) => {
      const el = document.getElementById(`aePotTitle${index + 1}`);
      const title = cfg.potentialView?.titles?.[key];
      const dim = NS.titles[key];
      if (!el || !title?.src) return;
      el.classList.add(`ae-pot-row-num-${index + 1}`);
      applyAutoEnchantImage(el, title.src, 'normal', dim.w, dim.h);
    });

    [1, 2, 3, 4].forEach((rowNum) => {
      const btn = document.getElementById(`aePotReset${rowNum}`);
      const rowEl = btn?.closest('.ae-pot-row');
      if (rowEl && viewBg) {
        applyAutoEnchantImage(rowEl, viewBg, 'normal', NS.view.w, NS.view.h);
      }
      if (!btn || !resetSrc) return;
      btn.disabled = this.isRunning;
      applyAutoEnchantImage(
        btn,
        resetSrc,
        btn.disabled ? 'disabled' : 'normal',
        NS.reset.w,
        NS.reset.h
      );
    });
  },

  fillComboSelect(selectEl, groupIndex, lineIndex) {
    if (!selectEl) return;
    const options = this.buildStatOptions(lineIndex);
    const current = this.groupTargets[groupIndex]?.[lineIndex] || '';
    const idle = !this.isRunning;

    selectEl.disabled = !idle;
    selectEl.innerHTML = '<option value="">不選擇</option>';
    options.forEach((opt) => {
      const option = document.createElement('option');
      option.value = opt.key;
      option.textContent = opt.label;
      selectEl.appendChild(option);
    });
    selectEl.value = current;
  },

  render() {
    const cfg = AUTO_ENCHANT_POTENTIAL || {};
    const NS = AUTO_ENCHANT_NATIVE_SIZE.potential;
    const panel = document.getElementById('aePotPanel');

    if (panel && cfg.backgrnd) {
      applyAutoEnchantImage(panel, cfg.backgrnd, 'normal', NS.panel.w, NS.panel.h);
    }

    this.renderRowChrome(cfg);

    for (let groupIndex = 0; groupIndex < 4; groupIndex += 1) {
      for (let lineIndex = 0; lineIndex < 3; lineIndex += 1) {
        const selectEl = document.getElementById(`aePotG${groupIndex}L${lineIndex}`);
        if (!this.isRunning) {
          this.fillComboSelect(selectEl, groupIndex, lineIndex);
        } else if (selectEl) {
          selectEl.disabled = true;
        }
      }
    }

    const stopBtn = document.getElementById('aePotStopAtk');
    this.renderStopAtkButton(stopBtn, cfg, NS);

    const btnAction = document.getElementById('aePotBtnAction');
    this.renderActionButton(btnAction, cfg, NS);

    this.syncAutoCheckbox();
    aePotSyncHexaAutoEnchantLayout?.();
  },
};
