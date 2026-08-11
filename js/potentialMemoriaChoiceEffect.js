/**
 * 恢復方塊自動重設 — AFTER 卡片 flip 動畫（主潛能 / 附加潛能共用）
 * 邏輯比照星火 memorial auto
 */
function createPtMemoriaFlipRenderer() {
  return {
    pivot: null,
    layers: { front: null, back: null },
    mounted: false,
    _afterBox: null,
    _panel: null,

    mount(panel, afterBox) {
      if (!panel || !afterBox) return;

      afterBox.querySelector('.pt-memoria-flip-eff')?.remove();

      let stage = panel.querySelector('.pt-memoria-flip-stage');
      if (!stage) {
        stage = document.createElement('div');
        stage.className = 'pt-memoria-flip-stage';
        stage.setAttribute('aria-hidden', 'true');
        stage.innerHTML =
          '<img class="pt-memoria-flip-back bs-pixel-image" alt="" draggable="false">'
          + '<img class="pt-memoria-flip-front bs-pixel-image" alt="" draggable="false">';
        panel.appendChild(stage);
      }

      this.pivot = stage;
      this.layers.back = stage.querySelector('.pt-memoria-flip-back');
      this.layers.front = stage.querySelector('.pt-memoria-flip-front');
      this.layers.back.style.pointerEvents = 'none';
      this.layers.front.style.pointerEvents = 'none';
      this._afterBox = afterBox;
      this._panel = panel;
      this.mounted = true;
      this.syncPivot();
    },

    syncPivot(anchor) {
      if (!this.mounted || !this._panel || !this._afterBox || !anchor) return;
      const panelRect = this._panel.getBoundingClientRect();
      const boxRect = this._afterBox.getBoundingClientRect();
      this.pivot.style.left = `${boxRect.left - panelRect.left + anchor.x}px`;
      this.pivot.style.top = `${boxRect.top - panelRect.top + anchor.y}px`;
    },

    showLayer(layer, src, origin) {
      const img = this.layers[layer];
      if (!img || !src || !origin) return;
      if (img.getAttribute('src') !== src) img.src = src;
      img.style.display = 'block';
      img.style.left = `${-origin.x}px`;
      img.style.top = `${-origin.y}px`;
    },

    hideLayer(layer) {
      const img = this.layers[layer];
      if (!img) return;
      img.style.display = 'none';
      img.removeAttribute('src');
    },

    clear() {
      this.hideLayer('back');
      this.hideLayer('front');
      this.pivot?.classList.remove('is-active');
    },

    setActive(on) {
      this.pivot?.classList.toggle('is-active', on);
    },
  };
}

function createMemoriaChoiceEffectModule(config) {
  const {
    id,
    overlayId,
    afterBoxId,
    beforeBoxId,
    btnResetId,
    panelSel,
    clickBoundKey,
    getChoiceModule,
    getAutoEnchantModule,
    isAnimEnabledFn,
    applyAfterLog,
    applyBeforeLog,
  } = config;

  return {
    id,
    overlayId,
    afterBoxId,
    beforeBoxId,
    btnResetId,
    panelSel,
    clickBoundKey,
    renderer: createPtMemoriaFlipRenderer(),
    active: false,
    sessionId: 0,
    selecting: false,
    _flipping: false,
    _pickLoopStarted: false,
    _pickLoopStarting: false,
    _afterRevealed: false,
    _inited: false,
    _preloadCache: new Map(),
    _preloadDone: false,
    _loopPlaying: false,
    _loopTimeline: null,
    _appearTimeline: null,
    _rankUpPlaying: false,
    _rankUpStarting: false,

    getChoice() {
      return typeof getChoiceModule === 'function' ? getChoiceModule() : null;
    },

    getAutoEnchant() {
      return typeof getAutoEnchantModule === 'function' ? getAutoEnchantModule() : null;
    },

    getOverlay() {
      return document.getElementById(this.overlayId);
    },

    init() {
      if (this._inited) return;
      this._inited = true;
      this.ensureRenderer();
      this.bindAfterClick();
      this.hookChoiceModule();
      this.hookAutoEnchantModule();
    },

    getSpec() {
      return typeof POTENTIAL_MEMORIA_CHOICE_EFFECT !== 'undefined' ? POTENTIAL_MEMORIA_CHOICE_EFFECT : null;
    },

    getAnchor() {
      const anchor = this.getSpec()?.displayAnchor;
      return anchor ? { x: anchor.x, y: anchor.y } : { x: 0, y: 0 };
    },

    assetPath(phase, layer, index) {
      return typeof ptMemoriaFlipAssetPath === 'function'
        ? ptMemoriaFlipAssetPath(phase, layer, index)
        : `${this.getSpec()?.assetBase || ''}${phase}/${layer}/${index}.png`;
    },

    rankUpAssetPath(rank, layer, index) {
      return typeof ptMemoriaRankUpAssetPath === 'function'
        ? ptMemoriaRankUpAssetPath(rank, layer, index)
        : `${this.getSpec()?.rankUpAssetBase || ''}${rank}/${layer}/${index}.png`;
    },

    hasRankUpAssets(rankId) {
      const spec = this.getSpec()?.rankUp?.[rankId];
      return Boolean(spec?.front?.length || spec?.back?.length);
    },

    frameAt(list, index) {
      if (!list?.length) return null;
      return list[Math.min(index, list.length - 1)];
    },

    /** 標準化單帧：{ delay, layers } */
    normalizeFrame(back, front, defaultDelay) {
      const delay = front?.d || back?.d || defaultDelay;
      const layers = {};
      if (back?.hasImg !== false && back?.o) {
        layers.back = { phase: back._phase || 'loop', i: back.i, o: back.o };
      }
      if (front?.hasImg !== false && front?.o) {
        layers.front = { phase: front._phase || 'loop', i: front.i, o: front.o };
      }
      return { delay, layers };
    },

    buildLoopTimeline() {
      const loop = this.getSpec()?.flip?.loop;
      if (!loop) return [];
      const delayDefault = this.getSpec()?.frameDelayMs || 60;
      const count = Math.max(loop.front?.length || 0, loop.back?.length || 0, 1);
      const frames = [];
      for (let i = 0; i < count; i += 1) {
        const back = this.frameAt(loop.back, i);
        const front = this.frameAt(loop.front, i);
        if (back) back._phase = 'loop';
        if (front) front._phase = 'loop';
        frames.push(this.normalizeFrame(back, front, delayDefault));
      }
      return frames;
    },

    buildAppearTimeline() {
      const appear = this.getSpec()?.flip?.appear;
      if (!appear) return [];
      const delayDefault = this.getSpec()?.frameDelayMs || 60;
      const count = Math.max(appear.front?.length || 0, appear.back?.length || 0, 1);
      const frames = [];

      for (let i = 0; i < count; i += 1) {
        const backRaw = this.frameAt(appear.back, i);
        const frontRaw = this.frameAt(appear.front, i);

        const back = backRaw ? { ...backRaw, _phase: 'appear' } : null;

        let front = null;
        if (frontRaw && i > 5) {
          if (frontRaw.hasImg !== false) {
            front = { ...frontRaw, _phase: 'appear' };
          }
        }
        // frame 0~5：XML 占位 front，只播 appear back（boxAppearTiming=360ms ≈ 第 6 帧才出現 front）
        frames.push(this.normalizeFrame(back, front, delayDefault));
      }
      return frames;
    },

    getLoopTimeline() {
      if (!this._loopTimeline) this._loopTimeline = this.buildLoopTimeline();
      return this._loopTimeline;
    },

    getAppearTimeline() {
      this._appearTimeline = this.buildAppearTimeline();
      return this._appearTimeline;
    },

    buildRankUpTimeline(rankId) {
      const spec = this.getSpec()?.rankUp?.[rankId];
      if (!spec) return [];
      const delayDefault = this.getSpec()?.frameDelayMs || 60;
      const count = Math.max(spec.front?.length || 0, spec.back?.length || 0, 1);
      const frames = [];
      for (let i = 0; i < count; i += 1) {
        const back = this.frameAt(spec.back, i);
        const front = this.frameAt(spec.front, i);
        const delay = front?.d || back?.d || delayDefault;
        const layers = {};
        if (back?.hasImg !== false && back?.o) {
          layers.back = { rank: back.assetRank || rankId, i: back.i, o: back.o };
        }
        if (front?.hasImg !== false && front?.o) {
          layers.front = { rank: front.assetRank || rankId, i: front.i, o: front.o };
        }
        frames.push({ delay, layers, rankUp: true });
      }
      return frames;
    },

    getRankUpTimeline(rankId) {
      return this.buildRankUpTimeline(rankId);
    },

    collectPreloadUrls() {
      const urls = new Set();
      const spec = this.getSpec()?.flip;
      if (!spec) return [];

      ['loop', 'appear'].forEach((phase) => {
        const phaseSpec = spec[phase];
        if (!phaseSpec) return;
        ['front', 'back'].forEach((layer) => {
          (phaseSpec[layer] || []).forEach((f) => {
            if (f.hasImg !== false) urls.add(this.assetPath(phase, layer, f.i));
          });
        });
      });

      (spec.loop?.front || []).forEach((f, i) => {
        if (i <= 5 && f.hasImg !== false) urls.add(this.assetPath('loop', 'front', f.i));
      });

      return [...urls];
    },

    collectRankUpPreloadUrls(rankId) {
      const urls = new Set();
      const spec = this.getSpec()?.rankUp?.[rankId];
      if (!spec) return [];
      ['front', 'back'].forEach((layer) => {
        (spec[layer] || []).forEach((f) => {
          if (f.hasImg !== false) {
            urls.add(this.rankUpAssetPath(f.assetRank || rankId, layer, f.i));
          }
        });
      });
      return [...urls];
    },

    async preloadRankUp(rankId) {
      await Promise.all(this.collectRankUpPreloadUrls(rankId).map((url) => this.preloadOne(url)));
    },

    preloadOne(url) {
      if (!url) return Promise.resolve(null);
      if (this._preloadCache.has(url)) return this._preloadCache.get(url);
      const p = new Promise((resolve) => {
        const img = new Image();
        img.decoding = 'async';
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
        img.src = url;
      });
      this._preloadCache.set(url, p);
      return p;
    },

    async preloadAll() {
      if (this._preloadDone) return;
      await Promise.all(this.collectPreloadUrls().map((url) => this.preloadOne(url)));
      this._preloadDone = true;
    },

    ensureRenderer() {
      const panel = document.querySelector(this.panelSel);
      const box = document.getElementById(this.afterBoxId);
      if (!panel || !box) return;
      this.renderer.mount(panel, box);
    },

    bindAfterClick() {
      const box = document.getElementById(this.afterBoxId);
      if (!box || box.dataset[this.clickBoundKey]) return;
      box.dataset[this.clickBoundKey] = '1';
      const self = this;
      box.addEventListener('click', (event) => {
        if (self.isAwaitingFlip()) {
          event.preventDefault();
          event.stopImmediatePropagation();
          if (self.shouldHandleAfterClick()) self.handleAfterClick();
          return;
        }
        if (!self.shouldHandleAfterClick()) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        self.handleAfterClick();
      }, true);
    },

    renderFrame(frameDef) {
      this.renderer.syncPivot(this.getAnchor());

      const { layers } = frameDef;

      if (layers.back) {
        const b = layers.back;
        const src = frameDef.rankUp
          ? this.rankUpAssetPath(b.rank, 'back', b.i)
          : this.assetPath(b.phase, 'back', b.i);
        this.renderer.showLayer('back', src, b.o);
      } else {
        this.renderer.hideLayer('back');
      }

      if (layers.front) {
        const f = layers.front;
        const src = frameDef.rankUp
          ? this.rankUpAssetPath(f.rank, 'front', f.i)
          : this.assetPath(f.phase, 'front', f.i);
        this.renderer.showLayer('front', src, f.o);
      } else {
        this.renderer.hideLayer('front');
      }
    },

    wait(ms, sessionId) {
      return new Promise((resolve) => {
        window.setTimeout(() => resolve(sessionId === this.sessionId), ms);
      });
    },

    async playTimeline(timeline, sessionId, loop = false) {
      if (!timeline.length || sessionId !== this.sessionId) return;

      this.renderer.setActive(true);
      if (loop) this._loopPlaying = true;

      do {
        for (let i = 0; i < timeline.length; i += 1) {
          if (sessionId !== this.sessionId || (loop && !this._loopPlaying)) return;
          this.renderFrame(timeline[i]);
          const keepGoing = await this.wait(timeline[i].delay, sessionId);
          if (!keepGoing || (loop && !this._loopPlaying)) return;
        }
      } while (loop && this._loopPlaying && sessionId === this.sessionId);
    },

    beginSession() {
      this.active = true;
      this.sessionId += 1;
      this.getOverlay()?.classList.add('is-pt-flip-playing');
      return this.sessionId;
    },

    stopAll() {
      this.active = false;
      this._loopPlaying = false;
      this.sessionId += 1;
      this.renderer.clear();
      this.getOverlay()?.classList.remove('is-pt-flip-playing');
    },

    hasAssets() {
      const spec = this.getSpec()?.flip;
      return Boolean(spec?.loop?.front?.length || spec?.appear?.back?.length);
    },

    isAnimEnabled() {
      return typeof isAnimEnabledFn === 'function' ? isAnimEnabledFn() : true;
    },

    shouldUseMemorialAutoAnim() {
      const mod = this.getChoice();
      return Boolean(
        mod?.isMemorialAutoChoiceUi?.()
        && this.isAnimEnabled()
        && this.hasAssets()
      );
    },

    async startAfterLoop() {
      this.ensureRenderer();
      const sessionId = this.beginSession();
      await this.playTimeline(this.getLoopTimeline(), sessionId, true);
    },

    async playAfterAppear(sessionId) {
      if (sessionId !== this.sessionId) return;
      await this.preloadAll();
      this.ensureRenderer();
      await this.playTimeline(this.getAppearTimeline(), sessionId, false);
    },

    async playRankUpTimeline(rankId, sessionId) {
      if (sessionId !== this.sessionId) return;
      const timeline = this.getRankUpTimeline(rankId);
      if (!timeline.length) return;
      this.ensureRenderer();
      await this.playTimeline(timeline, sessionId, false);
    },

    setFlipWaiting(waiting) {
      const overlay = this.getOverlay();
      const afterBox = document.getElementById(this.afterBoxId);
      overlay?.classList.toggle('is-pt-flip-waiting', waiting);
      overlay?.classList.toggle('is-auto-rankup-pending', this.isRankUpAutoPick() && !this._afterRevealed);
      afterBox?.classList.toggle('is-flip-box-hidden', waiting);
    },

    isAwaitingFlip() {
      if (!this.shouldUseMemorialAutoAnim()) return false;
      return (
        this._pickLoopStarted
        || this._pickLoopStarting
        || this._flipping
        || this._rankUpPlaying
        || this._rankUpStarting
      ) && !this._afterRevealed;
    },

    isRankUpAutoPick() {
      const mod = this.getChoice();
      const ae = this.getAutoEnchant();
      return Boolean(
        mod?.memoriaRankUp
        && mod?.isAutoPickPending?.()
        && ae
        && ae.lastRankUpStoppedForPick
      );
    },

    shouldBlockConfirmAction() {
      return this.isAwaitingFlip();
    },

    syncInteractionLock() {
      const mod = this.getChoice();
      if (!mod?.isMemoriaOverlayOpen?.()) return;

      const waiting = this.isAwaitingFlip();
      this.setFlipWaiting(waiting);

      const btn = document.getElementById(this.btnResetId);
      if (!btn || !mod.isMemorialAutoChoiceUi?.()) return;

      if (waiting) {
        btn.disabled = true;
        mod.paintMemoriaResetButton?.(btn, 'disabled');
      } else if (!mod.memoriaClosing) {
        btn.disabled = false;
        mod.paintMemoriaResetButton?.(btn, 'normal');
      }
    },

    onAutoRestart() {
      this.resetPickState();
      this.stopAll();
      this.setFlipWaiting(false);
      document.getElementById(this.afterBoxId)?.classList.remove('is-flip-revealed');
      this.getOverlay()?.classList.remove('is-rankup-revealed');
      const ae = this.getAutoEnchant();
      if (ae) ae.lastRankUpStoppedForPick = false;
    },

    unlockChoiceClicks() {
      const ae = this.getAutoEnchant();
      if (ae) ae.isRunning = false;
      const overlay = this.getOverlay();
      overlay?.classList.remove('is-auto-rolling');
      overlay?.classList.add('is-auto-pick-pending');
      this.getChoice()?.render?.();
      this.getChoice()?.renderMemoriaOverlay?.();
    },

    resetPickState() {
      this._pickLoopStarted = false;
      this._pickLoopStarting = false;
      this._afterRevealed = false;
      this._flipping = false;
      this._rankUpPlaying = false;
      this._rankUpStarting = false;
      this.setFlipWaiting(false);
      this.getOverlay()?.classList.remove('is-after-revealed', 'is-rankup-revealed');
    },

    onRollingUpdate() {
      if (!this.shouldUseMemorialAutoAnim()) {
        this.resetPickState();
        this.stopAll();
        return;
      }

      const mod = this.getChoice();
      if (mod?.isAutoPickPending?.()) {
        if (
          !this._pickLoopStarted
          && !this._pickLoopStarting
          && !this._afterRevealed
          && !this._rankUpPlaying
          && !this._rankUpStarting
        ) {
          this.onTargetHit();
        } else {
          this.syncInteractionLock();
        }
        return;
      }

      if (this._pickLoopStarted || this._afterRevealed || this._rankUpPlaying) return;

      this._pickLoopStarting = false;
      this.stopAll();
      this.setFlipWaiting(false);
    },

    async onTargetHit() {
      if (
        this._pickLoopStarted
        || this._pickLoopStarting
        || this._afterRevealed
        || this._rankUpPlaying
        || this._rankUpStarting
      ) return;
      this.init();
      if (!this.shouldUseMemorialAutoAnim()) return;

      if (this.isRankUpAutoPick()) {
        await this.onRankUpHit();
        return;
      }

      this._pickLoopStarting = true;
      try {
        await this.preloadAll();
        if (!this.getChoice()?.isAutoPickPending?.()) return;

        this._pickLoopStarted = true;
        this.setFlipWaiting(true);
        this.unlockChoiceClicks();
        this.syncInteractionLock();
        this.startAfterLoop();
      } finally {
        this._pickLoopStarting = false;
      }
    },

    async onRankUpHit() {
      if (
        this._rankUpPlaying
        || this._rankUpStarting
        || this._afterRevealed
        || this._pickLoopStarted
      ) return;
      this.init();

      const rankId = this.getChoice()?.memoriaAfter?.rank;
      if (!rankId || !this.hasRankUpAssets(rankId)) {
        this.unlockChoiceClicks();
        this._afterRevealed = true;
        this.syncInteractionLock();
        return;
      }

      this._rankUpStarting = true;
      try {
        await this.preloadRankUp(rankId);
        if (!this.getChoice()?.isAutoPickPending?.()) return;

        this.setFlipWaiting(true);
        this.unlockChoiceClicks();
        this.syncInteractionLock();

        this._rankUpPlaying = true;
        const sessionId = this.beginSession();
        await this.playRankUpTimeline(rankId, sessionId);

        this.setFlipWaiting(false);
        this.renderer.clear();
        this._rankUpPlaying = false;
        this._afterRevealed = true;

        this.getOverlay()?.classList.add('is-after-revealed', 'is-rankup-revealed');
        document.getElementById(this.afterBoxId)?.classList.add('is-flip-revealed');
        this.syncInteractionLock();
      } finally {
        this._rankUpStarting = false;
      }
    },

    shouldHandleAfterClick() {
      const mod = this.getChoice();
      if (!mod || mod.memoriaClosing || this.selecting || this._flipping) return false;
      if (!this.shouldUseMemorialAutoAnim() && !this._pickLoopStarted && !this._afterRevealed) return false;
      return this._pickLoopStarted || this._afterRevealed;
    },

    shouldHandleBeforeClick() {
      const mod = this.getChoice();
      if (!mod || mod.memoriaClosing || this.selecting || this._flipping) return false;
      if (this.isRankUpAutoPick()) return false;
      return this._afterRevealed;
    },

    handleAfterClick() {
      if (this._afterRevealed) {
        this.handleAfterConfirm();
      } else if (this._pickLoopStarted) {
        this.handleAfterFlip();
      }
    },

    async handleAfterFlip() {
      const mod = this.getChoice();
      if (!mod?.isMemoriaOverlayOpen() || this._flipping || this._afterRevealed) return;

      this._flipping = true;
      this._loopPlaying = false;
      const sessionId = this.sessionId;

      await this.playAfterAppear(sessionId);
      this.setFlipWaiting(false);
      this.renderer.clear();

      this._pickLoopStarted = false;
      this._afterRevealed = true;
      this._flipping = false;

      this.getOverlay()?.classList.add('is-after-revealed');
      document.getElementById(this.afterBoxId)?.classList.add('is-flip-revealed');
      this.syncInteractionLock();
    },

    handleAfterConfirm() {
      const mod = this.getChoice();
      if (!mod?.isMemoriaOverlayOpen() || mod.memoriaClosing || !mod.memoriaBefore || !mod.memoriaAfter) return;

      this.selecting = true;
      mod.clearMemoriaCloseTimer?.();
      mod.memoriaSelectedSide = 'after';
      mod.memoriaClosing = true;
      document.getElementById(this.btnResetId)?.setAttribute('disabled', 'disabled');

      const overlay = this.getOverlay();
      overlay?.classList.remove('is-auto-rolling');
      overlay?.classList.add('is-closing');

      document.getElementById(this.beforeBoxId)?.classList.remove('is-selected');
      document.getElementById(this.afterBoxId)?.classList.add('is-selected');

      window.setTimeout(() => {
        mod.applyMemoriaChoice('after');
        addLog(applyAfterLog, 'log-success');
        this.selecting = false;
        this.resetPickState();
        mod.closeMemoriaOverlay();
      }, 500);
    },

    handleMemoriaBeforeSelect() {
      const mod = this.getChoice();
      if (!mod?.isMemoriaOverlayOpen() || mod.memoriaClosing) return;

      this.stopAll();
      this.resetPickState();

      mod.clearMemoriaCloseTimer?.();
      mod.memoriaSelectedSide = 'before';
      mod.memoriaClosing = true;
      document.getElementById(this.btnResetId)?.setAttribute('disabled', 'disabled');

      const overlay = this.getOverlay();
      overlay?.classList.remove('is-auto-rolling');
      overlay?.classList.add('is-closing');

      document.getElementById(this.beforeBoxId)?.classList.add('is-selected');
      document.getElementById(this.afterBoxId)?.classList.remove('is-selected');

      window.setTimeout(() => {
        mod.applyMemoriaChoice('before');
        addLog(applyBeforeLog, 'log-success');
        mod.closeMemoriaOverlay();
      }, 500);
    },

    onClose() {
      this.selecting = false;
      this.resetPickState();
      this.stopAll();
      document.getElementById(this.afterBoxId)?.classList.remove('is-flip-revealed');
    },

    hookAutoEnchantModule() {
      const ae = this.getAutoEnchant();
      if (!ae || ae.__flipEffectAeHooked) return;
      ae.__flipEffectAeHooked = true;

      const self = this;
      let choiceActive = ae.choiceAutoSessionActive;

      Object.defineProperty(ae, 'choiceAutoSessionActive', {
        enumerable: true,
        configurable: true,
        get() { return choiceActive; },
        set(value) {
          const prev = choiceActive;
          choiceActive = value;
          if (value && !prev) self.onTargetHit();
        },
      });

      const origRestart = ae.restartMemorialAutoFromChoice?.bind(ae);
      if (origRestart) {
        ae.restartMemorialAutoFromChoice = async (...args) => {
          self.onAutoRestart();
          return origRestart(...args);
        };
      }
    },

    hookChoiceModule() {
      const mod = this.getChoice();
      if (!mod || mod.__flipEffectHooked) return;
      mod.__flipEffectHooked = true;

      const self = this;

      const origOpen = mod.openMemoriaAutoSession.bind(mod);
      mod.openMemoriaAutoSession = (...args) => {
        origOpen(...args);
        self.onRollingUpdate();
      };

      const origUpdate = mod.updateMemoriaAutoSession.bind(mod);
      mod.updateMemoriaAutoSession = (...args) => {
        origUpdate(...args);
        self.onRollingUpdate();
      };

      const origRender = mod.renderMemoriaOverlay.bind(mod);
      mod.renderMemoriaOverlay = (...args) => {
        origRender(...args);
        self.syncInteractionLock();
      };

      const origConfirm = mod.onMemoriaResetButtonClick.bind(mod);
      mod.onMemoriaResetButtonClick = () => {
        if (self.shouldBlockConfirmAction()) return;
        origConfirm();
      };

      const origCloseMemoria = mod.closeMemoriaOverlay.bind(mod);
      mod.closeMemoriaOverlay = () => {
        self.onClose();
        origCloseMemoria();
      };

      const origSelect = mod.selectMemoriaSide.bind(mod);
      mod.selectMemoriaSide = (side) => {
        if (side === 'after') {
          if (self.isRankUpAutoPick() && !self._afterRevealed) {
            return;
          }
          if (self.shouldHandleAfterClick()) {
            self.handleAfterClick();
            return;
          }
          if (self.isAwaitingFlip()) return;
        }
        if (side === 'before') {
          if (self.isRankUpAutoPick()) return;
          if (self.shouldHandleBeforeClick()) {
            self.handleMemoriaBeforeSelect();
            return;
          }
          if (self.isAwaitingFlip()) return;
        }
        origSelect(side);
      };
    },
  };
}

const PotentialMemoriaChoiceEffectModule = createMemoriaChoiceEffectModule({
  id: 'potential',
  overlayId: 'ptMemoriaOverlay',
  afterBoxId: 'ptMemoriaAfter',
  beforeBoxId: 'ptMemoriaBefore',
  btnResetId: 'ptMemoriaBtnReset',
  panelSel: '#ptMemoriaOverlay .pt-memoria-modal-panel',
  clickBoundKey: 'ptFlipClickBound',
  getChoiceModule: () => (typeof PotentialModule !== 'undefined' ? PotentialModule : null),
  getAutoEnchantModule: () => (
    typeof AutoEnchantPotentialModule !== 'undefined' ? AutoEnchantPotentialModule : null
  ),
  isAnimEnabledFn: () => (
    typeof isPotentialEnhanceAnimEnabled === 'function'
      ? isPotentialEnhanceAnimEnabled()
      : document.getElementById('chkPotentialAnim')?.checked !== false
  ),
  applyAfterLog: '🔮 恢復方塊：已套用 AFTER 結果。',
  applyBeforeLog: '🔮 恢復方塊：已套用 BEFORE 結果。',
});

const AddPotentialMemoriaChoiceEffectModule = createMemoriaChoiceEffectModule({
  id: 'addPotential',
  overlayId: 'apMemoriaOverlay',
  afterBoxId: 'apMemoriaAfter',
  beforeBoxId: 'apMemoriaBefore',
  btnResetId: 'apMemoriaBtnReset',
  panelSel: '#apMemoriaOverlay .pt-memoria-modal-panel',
  clickBoundKey: 'apFlipClickBound',
  getChoiceModule: () => (typeof AddPotentialModule !== 'undefined' ? AddPotentialModule : null),
  getAutoEnchantModule: () => (
    typeof AutoEnchantAddPotentialModule !== 'undefined' ? AutoEnchantAddPotentialModule : null
  ),
  isAnimEnabledFn: () => document.getElementById('chkAddPotentialAnim')?.checked !== false,
  applyAfterLog: '🟢 恢復附加方塊：已套用 AFTER 結果。',
  applyBeforeLog: '🟢 恢復附加方塊：已套用 BEFORE 結果。',
});

(function bootstrapMemoriaChoiceEffects() {
  const run = () => {
    PotentialMemoriaChoiceEffectModule.init();
    AddPotentialMemoriaChoiceEffectModule.init();
  };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }
})();
