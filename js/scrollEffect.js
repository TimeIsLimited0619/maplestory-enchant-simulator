/**
 * 卷軸強化演出：try → success/0|1 或 fail
 */
const ScrollEffectModule = {
  hosts: {},
  sprites: {},
  playing: false,
  _timer: null,
  _preloadCache: new Map(),
  _preloadDone: false,

  init() {
    if (this.sprites.back) return;

    this.hosts = {
      back: document.getElementById('scEffectBackHost'),
      front: document.getElementById('scEffectFrontHost'),
      text: document.getElementById('scEffectTextHost'),
      equip: document.getElementById('scEffectEquipHost'),
      summary0: document.getElementById('scEffectSummary0Host'),
      summary1: document.getElementById('scEffectSummary1Host'),
    };
    this.sprites = {
      back: this.hosts.back?.querySelector('.sc-effect-back'),
      front: this.hosts.front?.querySelector('.sc-effect-front'),
      text: this.hosts.text?.querySelector('.sc-effect-text'),
      equip: this.hosts.equip?.querySelector('.sc-effect-equip'),
      summary0: this.hosts.summary0?.querySelector('.sc-effect-summary0'),
      summary1: this.hosts.summary1?.querySelector('.sc-effect-summary1'),
    };
  },

  getLayout() {
    return typeof SCROLL_EFFECT !== 'undefined' ? SCROLL_EFFECT.layout : null;
  },

  getAnchor() {
    return this.getLayout()?.effectAnchor || { x: 209, y: 114 };
  },

  getTextScreenOffset() {
    return this.getLayout()?.textScreenOffset || { x: 214, y: 115 };
  },

  getItemIconScale() {
    return this.getLayout()?.itemIconScale || 2;
  },

  hasAssets() {
    return typeof SCROLL_EFFECT !== 'undefined' && Boolean(SCROLL_EFFECT.try);
  },

  isAnimEnabled() {
    return document.getElementById('chkScrollAnim')?.checked !== false;
  },

  isPlaying() {
    return this.playing;
  },

  isScrollTabActive() {
    const main = document.getElementById('mainContentPanel');
    return Boolean(main?.classList.contains('scroll-active'));
  },

  updateTestBarVisible() {
    this.init();
    const hasEquip = Boolean(document.querySelector('#equipDropZone img'));
    if (this.isScrollTabActive() && hasEquip) this.preloadAssets();
  },

  getSuccessVariant(useRecoveryCard = false) {
    return useRecoveryCard ? 1 : 0;
  },

  shouldShowSuccessText(variant) {
    return variant === 0 || variant === 1;
  },

  ensureSuccessSpec(spec, variant) {
    if (!spec || variant !== 1 || spec.layers?.textScreen?.length) return spec;
    const base = SCROLL_EFFECT.success?.['0'];
    if (!base?.layers?.textScreen?.length) return spec;
    return {
      ...spec,
      layers: {
        ...spec.layers,
        textScreen: base.layers.textScreen.map((f) => ({
          ...f,
          outlink: f.outlink?.replace('/success/0/textScreen/', '/success/1/textScreen/') ?? f.outlink,
        })),
      },
    };
  },

  /** summary 相對次數格中心的偏移（左 7、下 6） */
  _summaryOffset: { x: -7, y: 6 },

  getActiveSummarySlotAnchor() {
    const panel = document.getElementById('mainContentPanel');
    if (!panel) return null;

    let target = null;
    if (typeof ScrollModule !== 'undefined' && ScrollModule.itemData) {
      const scrollUsed = ScrollModule.itemData.scrollUsed || 0;
      target = document.querySelector(
        `#scScrollRow [data-scroll-slot-index="${scrollUsed}"],
         #scBonusSlots [data-scroll-slot-index="${scrollUsed}"]`
      );
    }

    if (!target) {
      target = document.querySelector(
        '#scScrollRow .sc-scroll-icon.next, #scBonusSlots .sc-scroll-icon.next'
      )?.closest('[data-scroll-slot-index], .sc-scroll-slot')
        || document.querySelector('#scScrollRow .sc-summary-icon, #scBonusSlots .sc-summary-icon');
    }

    if (!target) return null;

    const panelRect = panel.getBoundingClientRect();
    const slotRect = target.getBoundingClientRect();
    const { x: ox, y: oy } = this._summaryOffset;
    return {
      x: slotRect.left + slotRect.width / 2 - panelRect.left + ox,
      y: slotRect.top + slotRect.height / 2 - panelRect.top + oy,
    };
  },

  getSpec(phase, variant) {
    if (typeof SCROLL_EFFECT === 'undefined') return null;
    if (phase === 'try') return SCROLL_EFFECT.try;
    if (phase === 'fail') return SCROLL_EFFECT.fail;
    if (phase === 'success') {
      const v = String(variant ?? 0);
      return this.ensureSuccessSpec(SCROLL_EFFECT.success?.[v] || null, Number(v));
    }
    return null;
  },

  assetPath(phase, variant, layerKey, frameIndex) {
    return scrollEffectAssetPath(phase, variant, layerKey, frameIndex);
  },

  frameAt(frames, index) {
    if (!frames?.length) return null;
    return frames[Math.min(index, frames.length - 1)];
  },

  collectSpecUrls(phase, variant, spec, includeText) {
    const urls = [];
    const pushLayer = (layerKey, frames) => {
      frames.forEach((f) => {
        if (f.hasImg === false) return;
        urls.push(this.assetPath(phase, variant, layerKey, f.i));
      });
    };

    pushLayer('itemIcon/front', spec.layers['itemIcon/front'] || []);
    pushLayer('itemIcon/back', spec.layers['itemIcon/back'] || []);
    pushLayer('summaryIcon/0', spec.layers['summaryIcon/0'] || []);
    pushLayer('summaryIcon/1', spec.layers['summaryIcon/1'] || []);
    if (includeText) pushLayer('textScreen', spec.layers.textScreen || []);
    return urls;
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

  async preloadUrls(urls) {
    const unique = [...new Set(urls.filter(Boolean))];
    await Promise.all(unique.map((url) => this.preloadOne(url)));
  },

  async preloadAssets() {
    if (this._preloadDone || !this.hasAssets()) return;
    const urls = [
      ...this.collectSpecUrls('try', null, SCROLL_EFFECT.try, false),
      ...this.collectSpecUrls('success', 0, SCROLL_EFFECT.success['0'], true),
      ...this.collectSpecUrls('success', 1, this.getSpec('success', 1), true),
      ...this.collectSpecUrls('fail', null, SCROLL_EFFECT.fail, true),
    ];
    await this.preloadUrls(urls);
    this._preloadDone = true;
  },

  placeAnchoredSprite(img, anchor, origin) {
    if (origin) {
      img.style.left = `${anchor.x - origin.x}px`;
      img.style.top = `${anchor.y - origin.y}px`;
      img.style.transform = '';
      return;
    }
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    if (w > 0 && h > 0) {
      img.style.left = `${anchor.x - w / 2}px`;
      img.style.top = `${anchor.y - h / 2}px`;
      img.style.transform = '';
      return;
    }
    img.style.left = `${anchor.x}px`;
    img.style.top = `${anchor.y}px`;
    img.style.transform = 'translate(-50%, -50%)';
  },

  placeTextScreenSprite(img, origin) {
    this.placeAnchoredSprite(img, this.getTextScreenOffset(), origin);
  },

  getEquipIconSrc() {
    return document.querySelector('#equipDropZone img')?.getAttribute('src') || '';
  },

  /** 動畫期間沿用原本 drop zone 裝備圖，不複製 overlay */
  showEquipAtAnchor() {
    this.hideEquipAtAnchor();
  },

  syncEquipOverlayPosition() {
    // no-op：改用原本裝備圖
  },

  hideEquipAtAnchor() {
    const img = this.sprites.equip;
    if (img) {
      img.removeAttribute('src');
      img.style.display = 'none';
    }
    this.setHostVisible(this.hosts.equip, false);
  },

  setHostVisible(host, visible) {
    if (!host) return;
    host.classList.toggle('hidden', !visible);
    host.setAttribute('aria-hidden', visible ? 'false' : 'true');
  },

  setSprite(el, src, visible) {
    if (!el) return;
    if (!visible || !src) {
      el.style.display = 'none';
      el.removeAttribute('src');
      return;
    }
    if (el.getAttribute('src') !== src) el.src = src;
    el.style.display = 'block';
  },

  clearSprites() {
    Object.values(this.sprites).forEach((el) => {
      if (!el || el === this.sprites.equip) return;
      el.removeAttribute('src');
      el.style.display = 'none';
      el.style.transform = '';
    });
    this.hideEquipAtAnchor();
    Object.values(this.hosts).forEach((host) => {
      if (host === this.hosts.equip) return;
      this.setHostVisible(host, false);
    });
  },

  wait(ms) {
    return new Promise((resolve) => {
      this._timer = window.setTimeout(resolve, ms);
    });
  },

  async playLayerFrames({
    phase,
    variant,
    spec,
    showText = false,
    textAfterBody = false,
  }) {
    if (!spec) return;

    if (textAfterBody && showText) {
      await this.playBodyFrames({ phase, variant, spec });
      if (!this.playing) return;
      await this.playTextScreenFrames({ phase, variant, spec });
      return;
    }

    await this.playBodyFrames({
      phase,
      variant,
      spec,
      includeText: showText,
    });
  },

  async playBodyFrames({
    phase,
    variant,
    spec,
    includeText = false,
  }) {
    if (!spec) return;

    const showSummary = phase !== 'try';
    const itemAnchor = spec.anchor || this.getAnchor();
    const summaryAnchor = showSummary ? this.getActiveSummarySlotAnchor() : null;
    const frontFrames = spec.layers['itemIcon/front'] || [];
    const backFrames = spec.layers['itemIcon/back'] || [];
    const summary0Frames = showSummary ? (spec.layers['summaryIcon/0'] || []) : [];
    const summary1Frames = showSummary ? (spec.layers['summaryIcon/1'] || []) : [];
    const textFrames = includeText ? (spec.layers.textScreen || []) : [];
    const frameCount = Math.max(
      frontFrames.length,
      backFrames.length,
      summary0Frames.length,
      summary1Frames.length,
      textFrames.length,
      1
    );
    const delayDefault = SCROLL_EFFECT?.frameDelayMs || 60;

    await this.preloadUrls(this.collectSpecUrls(phase, variant, spec, includeText));

    for (let f = 0; f < frameCount; f += 1) {
      const backF = this.frameAt(backFrames, f);
      const frontF = this.frameAt(frontFrames, f);
      const summary0F = this.frameAt(summary0Frames, f);
      const summary1F = this.frameAt(summary1Frames, f);
      const textF = this.frameAt(textFrames, f);
      const delay = frontF?.d || backF?.d || summary0F?.d || summary1F?.d || textF?.d || delayDefault;

      if (backF?.hasImg) {
        const src = this.assetPath(phase, variant, 'itemIcon/back', backF.i);
        await this.preloadOne(src);
        this.setSprite(this.sprites.back, src, true);
        this.setHostVisible(this.hosts.back, true);
        this.placeAnchoredSprite(this.sprites.back, itemAnchor, backF.o);
      } else {
        this.setSprite(this.sprites.back, null, false);
        this.setHostVisible(this.hosts.back, false);
      }

      if (frontF) {
        const src = this.assetPath(phase, variant, 'itemIcon/front', frontF.i);
        await this.preloadOne(src);
        this.setSprite(this.sprites.front, src, true);
        this.setHostVisible(this.hosts.front, true);
        this.placeAnchoredSprite(this.sprites.front, itemAnchor, frontF.o);
      } else {
        this.setSprite(this.sprites.front, null, false);
        this.setHostVisible(this.hosts.front, false);
      }

      if (showSummary && summary0F?.hasImg && summaryAnchor) {
        const src = this.assetPath(phase, variant, 'summaryIcon/0', summary0F.i);
        await this.preloadOne(src);
        this.setSprite(this.sprites.summary0, src, true);
        this.setHostVisible(this.hosts.summary0, true);
        this.placeAnchoredSprite(this.sprites.summary0, summaryAnchor, summary0F.o);
      } else {
        this.setSprite(this.sprites.summary0, null, false);
        this.setHostVisible(this.hosts.summary0, false);
      }

      if (showSummary && summary1F?.hasImg && summaryAnchor) {
        const src = this.assetPath(phase, variant, 'summaryIcon/1', summary1F.i);
        await this.preloadOne(src);
        this.setSprite(this.sprites.summary1, src, true);
        this.setHostVisible(this.hosts.summary1, true);
        this.placeAnchoredSprite(this.sprites.summary1, summaryAnchor, summary1F.o);
      } else {
        this.setSprite(this.sprites.summary1, null, false);
        this.setHostVisible(this.hosts.summary1, false);
      }

      if (textF && includeText) {
        const src = this.assetPath(phase, variant, 'textScreen', textF.i);
        await this.preloadOne(src);
        this.setSprite(this.sprites.text, src, true);
        this.setHostVisible(this.hosts.text, true);
        this.placeTextScreenSprite(this.sprites.text, textF.o);
      } else if (!includeText) {
        this.setSprite(this.sprites.text, null, false);
        this.setHostVisible(this.hosts.text, false);
      }

      await this.wait(delay);
      if (!this.playing) return;
    }
  },

  async playTextScreenFrames({ phase, variant, spec }) {
    const textFrames = spec.layers.textScreen || [];
    if (!textFrames.length) return;

    const delayDefault = SCROLL_EFFECT?.frameDelayMs || 60;
    await this.preloadUrls(this.collectSpecUrls(phase, variant, spec, true));
    this.setHostVisible(this.hosts.text, true);

    for (let f = 0; f < textFrames.length; f += 1) {
      const textF = textFrames[f];
      if (!textF?.hasImg && textF?.hasImg !== undefined) {
        await this.wait(textF?.d || delayDefault);
        if (!this.playing) return;
        continue;
      }

      const src = this.assetPath(phase, variant, 'textScreen', textF.i);
      await this.preloadOne(src);
      this.setSprite(this.sprites.text, src, true);
      this.placeTextScreenSprite(this.sprites.text, textF.o);
      await this.wait(textF?.d || delayDefault);
      if (!this.playing) return;
    }

    this.setSprite(this.sprites.text, null, false);
    this.setHostVisible(this.hosts.text, false);
  },

  async begin() {
    this.init();
    await this.preloadAssets();
    this.playing = true;
    this.updateTestBarVisible();
    if (typeof ScrollModule !== 'undefined') ScrollModule.updateUseButtonState();
    document.getElementById('mainContentPanel')?.classList.add('sc-effect-playing');
    document.getElementById('equipDropZone')?.classList.add('sc-effect-active');
    this.showEquipAtAnchor();
  },

  end() {
    this.playing = false;
    if (this._timer) {
      window.clearTimeout(this._timer);
      this._timer = null;
    }
    this.clearSprites();
    document.getElementById('mainContentPanel')?.classList.remove('sc-effect-playing');
    document.getElementById('equipDropZone')?.classList.remove('sc-effect-active');
    this.updateTestBarVisible();
    if (typeof ScrollModule !== 'undefined') ScrollModule.updateUseButtonState();
  },

  async runPhases(phases) {
    await this.begin();
    try {
      for (const phaseOpts of phases) {
        await this.playLayerFrames(phaseOpts);
        if (!this.playing) return;
      }
    } finally {
      this.end();
    }
  },

  playTest(mode, variant = 0) {
    if (!document.querySelector('#equipDropZone img')) {
      addLog('⚠️ 請先放置裝備再測試演出。', 'log-fail');
      return;
    }
    if (!this.hasAssets()) {
      addLog('⚠️ 尚無卷軸演出素材。', 'log-fail');
      return;
    }

    const trySpec = this.getSpec('try');
    if (mode === 'try') {
      const useRecoveryCard = this.getContextUseRecoveryCard();
      const v = this.getSuccessVariant(useRecoveryCard);
      const successSpec = this.getSpec('success', v);
      this.runPhases([
        { phase: 'try', variant: null, spec: trySpec, showText: false },
        {
          phase: 'success',
          variant: v,
          spec: successSpec,
          showText: this.shouldShowSuccessText(v),
          textAfterBody: this.shouldShowSuccessText(v),
        },
      ]);
      return;
    }

    if (mode === 'fail') {
      this.runPhases([
        { phase: 'try', variant: null, spec: trySpec, showText: false },
        { phase: 'fail', variant: null, spec: this.getSpec('fail'), showText: true, textAfterBody: true },
      ]);
      return;
    }

    const successSpec = this.getSpec('success', variant);
    this.runPhases([
      {
        phase: 'success',
        variant,
        spec: successSpec,
        showText: this.shouldShowSuccessText(variant),
        textAfterBody: this.shouldShowSuccessText(variant),
      },
    ]);
  },

  getContextUseRecoveryCard() {
    if (typeof ScrollModule === 'undefined') return false;
    const scroll = ScrollModule.getSelectedScroll();
    if (!scroll || typeof scrollRequiresRecoveryCard !== 'function') return false;
    return scrollRequiresRecoveryCard(scroll)
      && ScrollModule.recoveryCardChecked
      && playerRecoveryCardCount > 0;
  },

  async playScrollUse({ success, tryOnly = false, useRecoveryCard = false, onComplete }) {
    if (!this.hasAssets()) {
      onComplete?.();
      return;
    }

    const trySpec = this.getSpec('try');
    await this.begin();
    try {
      await this.playLayerFrames({
        phase: 'try',
        variant: null,
        spec: trySpec,
        showText: false,
      });
      if (!this.playing) return;

      if (tryOnly) {
        onComplete?.();
        return;
      }

      if (success) {
        const variant = this.getSuccessVariant(useRecoveryCard);
        const successSpec = this.getSpec('success', variant);
        const showText = this.shouldShowSuccessText(variant);
        await this.playLayerFrames({
          phase: 'success',
          variant,
          spec: successSpec,
          showText,
          textAfterBody: showText,
        });
      } else {
        await this.playLayerFrames({
          phase: 'fail',
          variant: null,
          spec: this.getSpec('fail'),
          showText: true,
          textAfterBody: true,
        });
      }

      onComplete?.();
    } finally {
      this.end();
    }
  },

  runWithAnim({ success, tryOnly = false, useRecoveryCard = false, fn }) {
    if (!this.isAnimEnabled() || !this.hasAssets()) {
      fn?.();
      return;
    }
    if (typeof ScrollModule !== 'undefined') ScrollModule.updateUseButtonState();
    this.playScrollUse({ success, tryOnly, useRecoveryCard, onComplete: fn });
  },

  /** 恢復卡彈窗選擇「套用卷軸」後播放 success/1 */
  async playRecoveryApplySuccess({ onComplete }) {
    if (!this.isAnimEnabled() || !this.hasAssets()) {
      onComplete?.();
      return;
    }

    const variant = 1;
    const successSpec = this.getSpec('success', variant);
    if (!successSpec) {
      onComplete?.();
      return;
    }

    await this.begin();
    try {
      const showText = this.shouldShowSuccessText(variant);
      await this.playLayerFrames({
        phase: 'success',
        variant,
        spec: successSpec,
        showText,
        textAfterBody: showText,
      });
      onComplete?.();
    } finally {
      this.end();
    }
  },
};
