/**
 * 附加潛能自動重設 — Enchant.img/autoEnchant/additionalPotential 彈窗
 * 與舊版 checkbox（chkAddPotentialAuto）並存；素材就緒後替換 placeholder。
 */
const AutoEnchantAddPotentialModule = {
  isOpen: false,
  isRunning: false,
  cancelled: false,
  choiceAutoSessionActive: false,
  lastChoiceStoppedForPick: false,
  lastRankUpStoppedForPick: false,
  memorialSnapshotBefore: null,
  memorialAutoOverlayActive: false,
  groupTargets: [['', '', ''], ['', '', ''], ['', '', ''], ['', '', '']],
  /** 超速模式：縮短自動重設每輪間隔 */
  overspeedMode: false,
  progressFrame: 0,
  progressTimer: null,
  cancelHandler: null,
  hexaAutoSessionActive: false,

  getLoopDelayMs() {
    return aePotGetAutoEnchantLoopDelayMs(this.overspeedMode);
  },

  getBatchSize() {
    return aePotGetAutoEnchantBatchSize(this.overspeedMode);
  },

  isMemoriaSelected() {
    return aePotIsMemoriaCube?.(AddPotentialModule.getSelectedCube?.());
  },

  isMemoriaAutoMode() {
    return this.isRunning && this.isMemoriaSelected();
  },

  getAutoEnchantBlockReason() {
    const cube = AddPotentialModule.getSelectedCube();
    const item = AddPotentialModule.itemData;
    const cubeBlock = getAddPotCubeBlockReason(cube, item);
    if (cubeBlock) return cubeBlock;
    const legendaryBlock = aePotGetAutoEnchantLegendaryBlockReason(
      cube,
      item?.additionalPotential,
      { forAddPotential: true }
    );
    if (legendaryBlock) return legendaryBlock;
    if (AddPotentialModule.isMemoriaOverlayOpen?.() && !this.memorialAutoOverlayActive) {
      return '請先完成 BEFORE/AFTER 選擇。';
    }
    if (this.choiceAutoSessionActive) return '請先完成 BEFORE/AFTER 選擇。';
    return null;
  },

  canOpen() {
    if (typeof AUTO_ENCHANT_USE_OVERLAY === 'undefined' || !AUTO_ENCHANT_USE_OVERLAY) return false;
    if (!AddPotentialModule?.itemData) return false;
    if (AddPotentialModule.isHexaOverlayOpen?.()) return false;
    if (AddPotentialModule.isUniOverlayOpen?.()) return false;
    if (AddPotentialModule.isMemoriaOverlayOpen?.()) return false;
    if (this.isRunning) return false;
    return true;
  },

  isRollableCube(cube) {
    if (!cube) return false;
    if (cube.memoriaPick) return false;
    if (aePotIsHexaCube(cube) || aePotIsUnionCube(cube)) return true;
    return Boolean(cube.rateKey || typeof rerollAddPotential === 'function');
  },

  getRateKey() {
    const cube = AddPotentialModule.getSelectedCube();
    if (!cube) return 'precious';
    if (cube.rateKey) return cube.rateKey;
    if (cube.hexaPick) return 'restoreAdd';
    return 'precious';
  },

  buildStatOptions(lineIndex) {
    const item = AddPotentialModule.itemData;
    if (!item || typeof PotentialInspectModule === 'undefined') return [];

    const rateKey = this.getRateKey();
    const data = PotentialInspectModule.buildInspectData(item, 'additionalPotential', rateKey);

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
    const cube = AddPotentialModule.getSelectedCube();
    if (aePotIsUnionCube(cube)) {
      return aePotLineIndexGroupMatches(potential, group);
    }
    if (aePotIsHexaCube(cube)) {
      return aePotHexaGroupMatches(potential, group);
    }
    return aePotGroupMatches(potential, group);
  },

  canKeepAddPotAuto(cube) {
    const item = AddPotentialModule.itemData;
    return Boolean(item) && !getAddPotCubeBlockReason(cube, item);
  },

  matchesTargets(potential) {
    return this.groupTargets.some((group) => this.groupMatches(potential, group));
  },

  shouldStopSuccess(potential) {
    return this.matchesTargets(potential);
  },

  canStart() {
    if (!AddPotentialModule.itemData) return false;
    const cube = AddPotentialModule.getSelectedCube();
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
    if (!AddPotentialModule.itemData) {
      return addLog('⚠️ 請先放置裝備。', 'log-fail');
    }

    this.cancelled = false;

    const overlay = document.getElementById('aeApOverlay');
    if (overlay && typeof beginModalFadeIn === 'function') {
      beginModalFadeIn(overlay);
    } else if (overlay) {
      overlay.classList.remove('hidden');
      overlay.setAttribute('aria-hidden', 'false');
    }

    this.isOpen = true;
    const chk = document.getElementById('chkAddPotentialAuto');
    if (chk) chk.checked = true;
    this.render();
    this.syncAutoCheckbox();
    this.bindCancelKeys();
    AddPotentialModule.updateResetButtonState?.();
    aePotSyncHexaAutoEnchantLayout?.();
  },

  hidePanelForMemorialAuto() {
    const overlay = document.getElementById('aeApOverlay');
    if (overlay) {
      overlay.classList.add('hidden');
      overlay.setAttribute('aria-hidden', 'true');
    }
    this.isOpen = false;
    AddPotentialModule.updateResetButtonState?.();
    aePotSyncMemoriaAutoEnchantLayout?.();
  },

  getProgressAlertEl() {
    if (this.isMemoriaSelected() && (this.isRunning || this.memorialAutoOverlayActive)) {
      return document.getElementById('apMemoriaProgressAlert')
        || document.getElementById('aeApProgressAlert');
    }
    return document.getElementById('aeApProgressAlert');
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

    const overlay = document.getElementById('aeApOverlay');
    if (overlay) {
      overlay.classList.add('hidden');
      overlay.setAttribute('aria-hidden', 'true');
    }

    const chk = document.getElementById('chkAddPotentialAuto');
    if (chk) chk.checked = false;
    this.syncAutoCheckbox();
    AddPotentialModule.updateResetButtonState?.();
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

    const chk = document.getElementById('chkAddPotentialAuto');
    if (chk) chk.checked = false;

    if (this.isOpen) {
      this.syncAutoCheckbox();
      this.render();
    } else {
      this.syncAutoCheckbox();
    }
    AddPotentialModule.updateResetButtonState?.();
    aePotSyncMemoriaAutoEnchantLayout?.();
  },

  initPanelHooks() {
    const chk = document.getElementById('chkAddPotentialAuto');
    if (!chk || chk.dataset.aeHooked) return;
    chk.dataset.aeHooked = '1';
    chk.addEventListener('change', () => {
      if (chk.checked) {
        if (this.canOpen()) {
          this.open();
        } else {
          chk.checked = false;
          if (!AddPotentialModule?.itemData) {
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
    const chk = document.getElementById('chkAddPotentialAuto');
    if (!chk) return;

    const overlayOn = typeof AUTO_ENCHANT_USE_OVERLAY !== 'undefined' && AUTO_ENCHANT_USE_OVERLAY;
    if (!overlayOn) {
      chk.disabled = true;
      return;
    }

    chk.disabled = this.isRunning || (!this.isOpen && !this.canOpen() && !this.memorialAutoOverlayActive);
    if (this.isOpen && !this.isRunning) {
      chk.checked = true;
    } else if (this.memorialAutoOverlayActive && (this.choiceAutoSessionActive || AddPotentialModule.isMemoriaOverlayOpen?.())) {
      chk.checked = true;
      chk.disabled = this.choiceAutoSessionActive;
    }
  },

  onBackdropClick() {
    if (AddPotentialModule.isHexaOverlayOpen?.()) return;
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
      if (!this.isRunning && !this.isOpen) return;
      if (event.repeat) return;
      if (AddPotentialModule.isHexaOverlayOpen?.()) return;
      if (['Escape', 'Enter', ' '].includes(event.key)) {
        event.preventDefault();
        if (this.isRunning) {
          const fromChoice = AddPotentialModule.isMemoriaOverlayOpen?.() && this.isMemoriaAutoMode();
          this.cancel(fromChoice);
        } else if (this.isOpen) {
          this.close();
        }
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
    const frames = AUTO_ENCHANT_ADD_POTENTIAL?.progressAlert || [];
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
    ['aeApProgressAlert', 'apMemoriaProgressAlert'].forEach((id) => {
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

    if (this.isMemoriaSelected?.() && AddPotentialModule.isMemoriaOverlayOpen?.()) {
      if (this.memorialSnapshotBefore) {
        AddPotentialModule.itemData.additionalPotential = AddPotentialModule.cloneMemoriaPotential(this.memorialSnapshotBefore);
        AddPotentialModule.syncAddPotOverallRank();
        const lastAfter = AddPotentialModule.memoriaAfter
          ? AddPotentialModule.cloneMemoriaPotential(AddPotentialModule.memoriaAfter)
          : AddPotentialModule.cloneMemoriaPotential(this.memorialSnapshotBefore);
        AddPotentialModule.updateMemoriaAutoSession(
          this.memorialSnapshotBefore,
          lastAfter
        );
      }
    } else if (!fromChoiceOverlay && AddPotentialModule.isMemoriaOverlayOpen?.()) {
      AddPotentialModule.closeMemoriaOverlay();
    }

    this.choiceAutoSessionActive = false;
    this.lastChoiceStoppedForPick = false;
    this.lastRankUpStoppedForPick = false;
    AddPotentialModule.updateResetButtonState?.();
    AddPotentialModule.renderMemoriaOverlay?.();
    this.render();
    aePotSyncMemoriaAutoEnchantLayout?.();

    const chk = document.getElementById('chkAddPotentialAuto');
    if (chk) chk.checked = false;
    addLog('⏹️ 已中止附加潛能自動重設。', 'log-info');
  },

  async restartMemorialAutoFromChoice() {
    if (this.isRunning) return;
    if (!this.isMemoriaSelected()) return;
    if (!AddPotentialModule.isMemoriaOverlayOpen?.()) return;

    this.cancelled = false;
    this.choiceAutoSessionActive = false;
    this.lastChoiceStoppedForPick = false;
    this.lastRankUpStoppedForPick = false;
    await this.start();
  },

  applyRollSilent(rolled, opts = {}) {
    const { mirrorCopied, ...potential } = rolled;
    AddPotentialModule.itemData.additionalPotential = potential;
    AddPotentialModule.syncAddPotOverallRank(potential);
    AddPotentialModule.lastAtkPow = potential.atkPow;
    if (!opts.skipUi) {
      AddPotentialModule.updateUI();
      if (typeof updateStatusPanel === 'function') updateStatusPanel();
    }
    return mirrorCopied;
  },

  applyPotentialSilent(potential, opts = {}) {
    AddPotentialModule.itemData.additionalPotential = potential;
    AddPotentialModule.syncAddPotOverallRank(potential);
    AddPotentialModule.lastAtkPow = potential.atkPow;
    if (!opts.skipUi) {
      AddPotentialModule.updateUI();
      if (typeof updateStatusPanel === 'function') updateStatusPanel();
    }
  },

  async delayLoop() {
    await new Promise((resolve) => window.setTimeout(resolve, this.getLoopDelayMs()));
  },

  async startNormalAuto(cube, startAtkPow) {
    let attempts = 0;
    while (
      this.isRunning &&
      !this.cancelled &&
      AddPotentialModule.itemData &&
      this.isRollableCube(cube) &&
      this.canKeepAddPotAuto(cube)
    ) {
      let hit = false;
      const batch = this.getBatchSize();
      for (let i = 0; i < batch && this.isRunning && !this.cancelled; i += 1) {
        if (!AddPotentialModule.itemData || !this.isRollableCube(cube) || !this.canKeepAddPotAuto(cube)) break;
        consumePlayerAddPotCube(cube.id);
        const rolled = rerollAddPotential(
          cube,
          AddPotentialModule.itemData.additionalPotential,
          AddPotentialModule.itemData
        );
        this.applyRollSilent(rolled, { skipUi: true });
        attempts += 1;
        if (this.shouldStopSuccess(AddPotentialModule.itemData.additionalPotential)) {
          hit = true;
          break;
        }
        if (attempts > 50000) break;
      }
      AddPotentialModule.updateUI();
      this.render();
      if (hit || attempts > 50000) break;
      await this.delayLoop();
    }
    return attempts;
  },

  async startHexaAuto(cube, startAtkPow) {
    const item = AddPotentialModule.itemData;
    const rateKey = cube.rateKey || 'restoreAdd';
    const result = await aePotRunHexaAutoEnchant({
      cube,
      rollSession: () => (
        typeof rollBrightAddHexaChoices === 'function'
          ? rollBrightAddHexaChoices(item, item.additionalPotential, rateKey)
          : null
      ),
      consumeCube: () => consumePlayerAddPotCube(cube.id),
      groups: this.groupTargets,
      groupMatchesFn: aePotHexaGroupMatches,
      sessionReady: (session) => (
        aePotHexaSessionHasTargetMatch(session, this.groupTargets)
      ),
      openOverlayWithSession: (c, session, opts) => (
        AddPotentialModule.openHexaOverlayWithSession?.(c, session, opts) ?? false
      ),
      updateOverlaySession: (session) => (
        AddPotentialModule.updateHexaAutoSession?.(session) ?? false
      ),
      isRunning: () => this.isRunning && this.canKeepAddPotAuto(cube),
      isCancelled: () => this.cancelled,
      loopDelayMs: this.getLoopDelayMs(),
      batchSize: this.getBatchSize(),
      onProgress: () => {
        AddPotentialModule.updateUI?.();
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
    const rateKey = cube.rateKey || 'unionAdd';
    const eventId = typeof ADDPOT_CUBE_EVENT_ID !== 'undefined' ? ADDPOT_CUBE_EVENT_ID : 8422;
    const result = await aePotRunUnionAutoEnchant({
      getItem: () => AddPotentialModule.itemData,
      getPotential: () => AddPotentialModule.itemData?.additionalPotential,
      setPotential: (potential) => this.applyPotentialSilent(potential, { skipUi: true }),
      consumeCube: () => consumePlayerAddPotCube(cube.id),
      rateKey,
      eventId,
      groups: this.groupTargets,
      shouldStop: (potential) => this.shouldStopSuccess(potential),
      isRunning: () => this.isRunning && this.canKeepAddPotAuto(cube),
      isCancelled: () => this.cancelled,
      loopDelayMs: this.getLoopDelayMs(),
      batchSize: this.getBatchSize(),
      onProgress: () => {
        AddPotentialModule.updateUI?.();
        this.render();
      },
    });
    this.lastUniReselectUses = result.reselectUses;
    this.lastUniResetUses = result.resetUses;
    return result.attempts;
  },

  async startMemoriaAuto() {
    const cube = AddPotentialModule.getSelectedCube();
    const snapshot = this.memorialSnapshotBefore
      || AddPotentialModule.cloneMemoriaPotential(AddPotentialModule.itemData.additionalPotential);
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
      let lastAfter = null;
      for (let i = 0; i < batch && !this.cancelled && attempts < maxRolls; i += 1) {
        consumePlayerAddPotCube(cube.id);
        attempts += 1;

        const rolled = rerollAddPotential(cube, snapshot, AddPotentialModule.itemData);
        lastAfter = AddPotentialModule.cloneMemoriaPotential(rolled);

        const rankUp = AddPotentialModule.isMemoriaRankUp(snapshot, lastAfter);
        if (rankUp) {
          this.lastRankUpStoppedForPick = true;
          this.lastChoiceStoppedForPick = true;
          this.choiceAutoSessionActive = true;
          stoppedRankUp = true;
          break;
        }

        if (this.matchesTargets(lastAfter)) {
          this.lastChoiceStoppedForPick = true;
          this.choiceAutoSessionActive = true;
          hit = true;
          break;
        }
      }

      if (lastAfter) {
        if (!overlayOpened) {
          AddPotentialModule.openMemoriaAutoSession(snapshot, lastAfter, cube, { fadeIn: true });
          overlayOpened = true;
        } else {
          AddPotentialModule.updateMemoriaAutoSession(snapshot, lastAfter);
        }
        aePotSyncMemoriaAutoEnchantLayout?.();
        if (stoppedRankUp || hit) AddPotentialModule.renderMemoriaOverlay?.();
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
      return addLog('⚠️ 無法進行自動重設。請確認目標附加潛在能力，或確認強化貨幣是否未選擇或不足。', 'log-fail');
    }

    const cube = AddPotentialModule.getSelectedCube();
    this.isRunning = true;
    this.cancelled = false;
    this.lastChoiceStoppedForPick = false;
    this.lastRankUpStoppedForPick = false;
    this.choiceAutoSessionActive = false;
    AddPotentialModule.updateResetButtonState?.();

    const isMemoria = this.isMemoriaSelected();
    const startAtkPow = AddPotentialModule.itemData.additionalPotential?.atkPow || 0;
    let attempts = 0;
    let targetHit = false;
    let stoppedForManualPick = false;
    let stoppedForRankUp = false;

    if (!isMemoria) {
      this.startProgressAlert();
    }
    this.render();

    const logItem = aeSessionLogItemMeta(AddPotentialModule.itemData);
    aeSessionLogBegin({
      module: '附加潛能',
      itemId: logItem.itemId,
      itemName: logItem.itemName,
      detail: { cubeName: cube?.name, cubeId: cube?.id, overspeed: this.overspeedMode },
    });

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
      if (isMemoria && !stoppedForManualPick && !AddPotentialModule.isMemoriaOverlayOpen?.()) {
        const chk = document.getElementById('chkAddPotentialAuto');
        if (chk) chk.checked = false;
      }
      this.render();
      AddPotentialModule.updateResetButtonState?.();
      AddPotentialModule.renderMemoriaOverlay?.();
      if (typeof updateStatusPanel === 'function') updateStatusPanel();
      aePotFlushAutoEnchantSideUi?.();
      aePotSyncMemoriaAutoEnchantLayout?.();
    }

    if (!isMemoria) {
      const finalPot = AddPotentialModule.itemData?.additionalPotential;
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
      addLog(`⏹️ 已取消附加潛能自動重設（${attemptLabel}）`, 'log-info');
    } else if (stoppedForRankUp && isMemoria) {
      addLog(`🟢 洗鍊中稀有度提升，請選擇 AFTER（共骰 ${attempts} 次）`, 'log-success');
    } else if (stoppedForManualPick && isMemoria) {
      addLog(`🟢 BEFORE/AFTER 已出現目標附加潛在能力，請自行選擇（共骰 ${attempts} 次）`, 'log-success');
    } else if (hexaReady && aePotIsHexaCube(cube)) {
      addLog(`🟢 六選中已出現目標附加潛能，請自行選擇三項（${attemptLabel}）`, 'log-success');
    } else if (targetHit) {
      addLog(`🟢 自動重設完成：已達成目標附加潛在能力（${attemptLabel}）`, 'log-success');
    } else {
      addLog(`⚠️ 附加潛能自動重設結束（${attemptLabel}）`, 'log-info');
    }

    aeSessionLogEnd({
      outcome: aeSessionLogResolveOutcome({
        cancelled: this.cancelled,
        targetHit,
        stoppedForManualPick,
        stoppedForRankUp,
        hexaReady,
      }),
      attempts,
      targetHit,
      cancelled: this.cancelled,
      detail: { cubeName: cube?.name, uniReselect, uniReset },
    });

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
      const cfg = AUTO_ENCHANT_ADD_POTENTIAL;
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
    const cfg = AUTO_ENCHANT_ADD_POTENTIAL;
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
      const el = document.getElementById(`aeApTitle${index + 1}`);
      const title = cfg.potentialView?.titles?.[key];
      const dim = NS.titles[key];
      if (!el || !title?.src) return;
      el.classList.add(`ae-pot-row-num-${index + 1}`);
      applyAutoEnchantImage(el, title.src, 'normal', dim.w, dim.h);
    });

    [1, 2, 3, 4].forEach((rowNum) => {
      const btn = document.getElementById(`aeApReset${rowNum}`);
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

    selectEl.disabled = this.isRunning;
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
    const cfg = AUTO_ENCHANT_ADD_POTENTIAL || {};
    const NS = AUTO_ENCHANT_NATIVE_SIZE.potential;
    const panel = document.getElementById('aeApPanel');

    if (panel && cfg.backgrnd) {
      applyAutoEnchantImage(panel, cfg.backgrnd, 'normal', NS.panel.w, NS.panel.h);
    }

    this.renderRowChrome(cfg);

    for (let groupIndex = 0; groupIndex < 4; groupIndex += 1) {
      for (let lineIndex = 0; lineIndex < 3; lineIndex += 1) {
        const selectEl = document.getElementById(`aeApG${groupIndex}L${lineIndex}`);
        if (!this.isRunning) {
          this.fillComboSelect(selectEl, groupIndex, lineIndex);
        } else if (selectEl) {
          selectEl.disabled = true;
        }
      }
    }

    const stopBtn = document.getElementById('aeApStopAtk');
    this.renderStopAtkButton(stopBtn, cfg, NS);

    const btnAction = document.getElementById('aeApBtnAction');
    this.renderActionButton(btnAction, cfg, NS);

    this.syncAutoCheckbox();
    aePotSyncHexaAutoEnchantLayout?.();
  },
};
