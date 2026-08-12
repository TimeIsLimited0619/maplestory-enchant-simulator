/**
 * 黑暗星火自動強化（awake_black）選擇窗 — AFTER 卡片 flip 動畫
 *
 * 架構：
 * - FlipRenderer：pivot 定位（ltOffset），stage 掛在 modal panel 上
 * - loop / appear 共用同一 anchor，appear front 0~5 沿用 loop front
 */
const BsChoiceFlipRenderer = {
  pivot: null,
  layers: { front: null, back: null },
  mounted: false,

  mount(panel, afterBox) {
    if (!panel || !afterBox) return;

    afterBox.querySelector('.bs-choice-flip-eff')?.remove();

    let stage = panel.querySelector('.bs-choice-flip-stage');
    if (!stage) {
      stage = document.createElement('div');
      stage.className = 'bs-choice-flip-stage';
      stage.setAttribute('aria-hidden', 'true');
      stage.innerHTML =
        '<img class="bs-choice-flip-back bs-pixel-image" alt="" draggable="false">'
        + '<img class="bs-choice-flip-front bs-pixel-image" alt="" draggable="false">';
      panel.appendChild(stage);
    }

    this.pivot = stage;
    this.layers.back = stage.querySelector('.bs-choice-flip-back');
    this.layers.front = stage.querySelector('.bs-choice-flip-front');
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

const BonusStatChoiceEffectModule = {
  afterBoxId: 'bsChoiceAfter',
  panelSel: '#bsChoiceOverlay .bs-choice-modal-panel',
  renderer: BsChoiceFlipRenderer,
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

  init() {
    if (this._inited) return;
    this._inited = true;
    this.ensureRenderer();
    this.bindAfterClick();
    this.hookChoiceModule();
    this.hookAutoEnchantModule();
  },

  getSpec() {
    return typeof BONUS_STAT_CHOICE_EFFECT !== 'undefined' ? BONUS_STAT_CHOICE_EFFECT : null;
  },

  getAnchor() {
    const spec = this.getSpec();
    const lt = spec?.flip?.loop?.ltOffset || { x: 116, y: 127 };
    const base = spec?.displayAnchor || { x: lt.x - 1, y: lt.y };
    const extra = spec?.displayOffset || { x: 0, y: 0 };
    return { x: base.x + extra.x, y: base.y + extra.y };
  },

  assetPath(phase, layer, index) {
    return typeof bsChoiceFlipAssetPath === 'function'
      ? bsChoiceFlipAssetPath(phase, layer, index)
      : `${this.getSpec()?.assetBase || ''}${phase}/${layer}/${index}.png`;
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

  preloadOne(url) {
    if (typeof EnchantImagePreload !== 'undefined') {
      return EnchantImagePreload.preload(url, this._preloadCache);
    }
    if (!url) return Promise.resolve(null);
    if (this._preloadCache.has(url)) return this._preloadCache.get(url);
    const p = new Promise((resolve) => {
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => {
        if (typeof img.decode === 'function') {
          img.decode().then(() => resolve(img)).catch(() => resolve(img));
        } else resolve(img);
      };
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
    if (!box || box.dataset.bsFlipClickBound) return;
    box.dataset.bsFlipClickBound = '1';
    box.addEventListener('click', (event) => {
      const mod = BonusStatChoiceEffectModule;
      if (mod.isAwaitingFlip()) {
        event.preventDefault();
        event.stopImmediatePropagation();
        if (mod.shouldHandleAfterClick()) mod.handleAfterClick();
        return;
      }
      if (!mod.shouldHandleAfterClick()) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      mod.handleAfterClick();
    }, true);
  },

  renderFrame(frameDef) {
    const anchor = this.getAnchor();
    this.renderer.syncPivot(anchor);

    const { layers } = frameDef;
    if (layers.back) {
      const b = layers.back;
      this.renderer.showLayer('back', this.assetPath(b.phase, 'back', b.i), b.o);
    } else {
      this.renderer.hideLayer('back');
    }

    if (layers.front) {
      const f = layers.front;
      this.renderer.showLayer('front', this.assetPath(f.phase, 'front', f.i), f.o);
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
    document.getElementById('bsChoiceOverlay')?.classList.add('is-bs-flip-playing');
    return this.sessionId;
  },

  stopAll() {
    this.active = false;
    this._loopPlaying = false;
    this.sessionId += 1;
    this.renderer.clear();
    document.getElementById('bsChoiceOverlay')?.classList.remove('is-bs-flip-playing');
  },

  hasAssets() {
    const spec = this.getSpec()?.flip;
    return Boolean(spec?.loop?.front?.length || spec?.appear?.back?.length);
  },

  isAnimEnabled() {
    return typeof isBonusStatEnhanceAnimEnabled === 'function'
      ? isBonusStatEnhanceAnimEnabled()
      : document.getElementById('chkBonusStatAnim')?.checked !== false;
  },

  shouldUseMemorialAutoAnim() {
    return typeof BonusStatChoiceModule !== 'undefined'
      && BonusStatChoiceModule.isMemorialAutoChoiceUi?.()
      && this.isAnimEnabled()
      && this.hasAssets();
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

  setFlipWaiting(waiting) {
    const overlay = document.getElementById('bsChoiceOverlay');
    const afterBox = document.getElementById(this.afterBoxId);
    overlay?.classList.toggle('is-bs-flip-waiting', waiting);
    afterBox?.classList.toggle('is-flip-box-hidden', waiting);
  },

  isAwaitingFlip() {
    if (!this.shouldUseMemorialAutoAnim()) return false;
    return (this._pickLoopStarted || this._pickLoopStarting || this._flipping) && !this._afterRevealed;
  },

  shouldBlockConfirmAction() {
    return this.isAwaitingFlip();
  },

  syncInteractionLock() {
    const mod = BonusStatChoiceModule;
    if (!mod?.isOpen?.()) return;

    const waiting = this.isAwaitingFlip();
    this.setFlipWaiting(waiting);

    const btn = document.getElementById('bsChoiceBtnConfirm');
    if (!btn || !mod.isMemorialAutoChoiceUi?.()) return;

    if (waiting) {
      btn.disabled = true;
      mod.paintConfirmButton?.(btn, 'disabled');
    } else if (!mod.closing) {
      btn.disabled = false;
      mod.paintConfirmButton?.(btn, 'normal');
    }
  },

  onAutoRestart() {
    this.resetPickState();
    this.stopAll();
    this.setFlipWaiting(false);
    document.getElementById('bsChoiceAfter')?.classList.remove('is-flip-revealed');
  },

  unlockChoiceClicks() {
    if (typeof AutoEnchantBonusStatModule !== 'undefined') {
      AutoEnchantBonusStatModule.isRunning = false;
    }
    const overlay = document.getElementById('bsChoiceOverlay');
    overlay?.classList.remove('is-auto-rolling');
    overlay?.classList.add('is-auto-pick-pending');
    BonusStatChoiceModule.render?.();
  },

  resetPickState() {
    this._pickLoopStarted = false;
    this._pickLoopStarting = false;
    this._afterRevealed = false;
    this._flipping = false;
    this.setFlipWaiting(false);
    document.getElementById('bsChoiceOverlay')?.classList.remove('is-after-revealed');
  },

  onRollingUpdate() {
    if (!this.shouldUseMemorialAutoAnim()) {
      this.resetPickState();
      this.stopAll();
      return;
    }

    if (BonusStatChoiceModule.isAutoPickPending?.()) {
      if (!this._pickLoopStarted && !this._pickLoopStarting && !this._afterRevealed) {
        this.onTargetHit();
      } else {
        this.syncInteractionLock();
      }
      return;
    }

    if (this._pickLoopStarted || this._afterRevealed) return;

    this._pickLoopStarting = false;
    this.stopAll();
    this.setFlipWaiting(false);
  },

  async onTargetHit() {
    if (this._pickLoopStarted || this._pickLoopStarting || this._afterRevealed) return;
    this.init();
    if (!this.shouldUseMemorialAutoAnim()) return;

    this._pickLoopStarting = true;
    try {
      await this.preloadAll();
      if (!BonusStatChoiceModule.isAutoPickPending?.()) return;

      this._pickLoopStarted = true;
      this.setFlipWaiting(true);
      this.unlockChoiceClicks();
      this.syncInteractionLock();
      this.startAfterLoop();
    } finally {
      this._pickLoopStarting = false;
    }
  },

  shouldHandleAfterClick() {
    const mod = BonusStatChoiceModule;
    if (!mod || mod.closing || this.selecting || this._flipping) return false;
    if (!this.shouldUseMemorialAutoAnim() && !this._pickLoopStarted && !this._afterRevealed) return false;
    return this._pickLoopStarted || this._afterRevealed;
  },

  shouldHandleBeforeClick() {
    const mod = BonusStatChoiceModule;
    if (!mod || mod.closing || this.selecting || this._flipping) return false;
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
    const mod = BonusStatChoiceModule;
    if (!mod?.isOpen() || this._flipping || this._afterRevealed) return;

    this._flipping = true;
    this._loopPlaying = false;
    const sessionId = this.sessionId;

    await this.playAfterAppear(sessionId);
    this.setFlipWaiting(false);
    this.renderer.clear();

    this._pickLoopStarted = false;
    this._afterRevealed = true;
    this._flipping = false;

    document.getElementById('bsChoiceOverlay')?.classList.add('is-after-revealed');
    document.getElementById('bsChoiceAfter')?.classList.add('is-flip-revealed');
    this.syncInteractionLock();
  },

  handleAfterConfirm() {
    const mod = BonusStatChoiceModule;
    if (!mod?.isOpen() || mod.closing || !mod.before || !mod.after) return;

    this.selecting = true;
    mod.clearCloseTimer?.();
    mod.selectedSide = 'after';
    mod.closing = true;
    document.getElementById('bsChoiceBtnConfirm')?.setAttribute('disabled', 'disabled');

    const overlay = document.getElementById('bsChoiceOverlay');
    overlay?.classList.remove('is-auto-rolling');
    overlay?.classList.add('is-closing');

    document.getElementById('bsChoiceBefore')?.classList.remove('is-selected');
    document.getElementById('bsChoiceAfter')?.classList.add('is-selected');

    window.setTimeout(() => {
      BonusStatModule.applyChoiceResult(mod.after);
      addLog('🔥 附加能力：已套用 AFTER 結果。', 'log-success');
      this.selecting = false;
      this.resetPickState();
      mod.close();
    }, 500);
  },

  handleBeforeSelect() {
    const mod = BonusStatChoiceModule;
    if (!mod?.isOpen() || mod.closing) return;

    this.stopAll();
    this.resetPickState();

    mod.clearCloseTimer?.();
    mod.selectedSide = 'before';
    mod.closing = true;
    document.getElementById('bsChoiceBtnConfirm')?.setAttribute('disabled', 'disabled');

    const overlay = document.getElementById('bsChoiceOverlay');
    overlay?.classList.remove('is-auto-rolling');
    overlay?.classList.add('is-closing');

    document.getElementById('bsChoiceBefore')?.classList.add('is-selected');
    document.getElementById('bsChoiceAfter')?.classList.remove('is-selected');

    window.setTimeout(() => {
      BonusStatModule.applyChoiceResult(mod.before);
      addLog('🔥 附加能力：已套用 BEFORE 結果。', 'log-success');
      mod.close();
    }, 500);
  },

  onClose() {
    this.selecting = false;
    this.resetPickState();
    this.stopAll();
    document.getElementById('bsChoiceAfter')?.classList.remove('is-flip-revealed');
  },

  hookAutoEnchantModule() {
    if (typeof AutoEnchantBonusStatModule === 'undefined' || AutoEnchantBonusStatModule.__flipEffectAeHooked) {
      return;
    }
    AutoEnchantBonusStatModule.__flipEffectAeHooked = true;

    const ae = AutoEnchantBonusStatModule;
    let choiceActive = ae.choiceAutoSessionActive;

    Object.defineProperty(ae, 'choiceAutoSessionActive', {
      enumerable: true,
      configurable: true,
      get() { return choiceActive; },
      set(value) {
        const prev = choiceActive;
        choiceActive = value;
        if (value && !prev) BonusStatChoiceEffectModule.onTargetHit();
      },
    });

    const origRestart = ae.restartMemorialAutoFromChoice?.bind(ae);
    if (origRestart) {
      ae.restartMemorialAutoFromChoice = async (...args) => {
        BonusStatChoiceEffectModule.onAutoRestart();
        return origRestart(...args);
      };
    }
  },

  hookChoiceModule() {
    if (typeof BonusStatChoiceModule === 'undefined' || BonusStatChoiceModule.__flipEffectHooked) {
      return;
    }
    BonusStatChoiceModule.__flipEffectHooked = true;

    const mod = BonusStatChoiceModule;

    const origOpen = mod.openAutoSession.bind(mod);
    mod.openAutoSession = (...args) => {
      origOpen(...args);
      BonusStatChoiceEffectModule.onRollingUpdate();
    };

    const origUpdate = mod.updateAutoSession.bind(mod);
    mod.updateAutoSession = (...args) => {
      origUpdate(...args);
      BonusStatChoiceEffectModule.onRollingUpdate();
    };

    const origRender = mod.render.bind(mod);
    mod.render = (...args) => {
      origRender(...args);
      BonusStatChoiceEffectModule.syncInteractionLock();
    };

    const origConfirm = mod.onConfirmButtonClick.bind(mod);
    mod.onConfirmButtonClick = () => {
      if (BonusStatChoiceEffectModule.shouldBlockConfirmAction()) return;
      origConfirm();
    };

    const origClose = mod.close.bind(mod);
    mod.close = () => {
      BonusStatChoiceEffectModule.onClose();
      origClose();
    };

    const origSelect = mod.selectSide.bind(mod);
    mod.selectSide = (side) => {
      if (side === 'after') {
        if (BonusStatChoiceEffectModule.shouldHandleAfterClick()) {
          BonusStatChoiceEffectModule.handleAfterClick();
          return;
        }
        if (BonusStatChoiceEffectModule.isAwaitingFlip()) return;
      }
      if (side === 'before') {
        if (BonusStatChoiceEffectModule.shouldHandleBeforeClick()) {
          BonusStatChoiceEffectModule.handleBeforeSelect();
          return;
        }
        if (BonusStatChoiceEffectModule.isAwaitingFlip()) return;
      }
      origSelect(side);
    };
  },
};

(function bootstrapChoiceEffect() {
  const run = () => BonusStatChoiceEffectModule.init();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }
})();
