/**
 * 鐵鎚強化次數追加演出：try → success / fail（success 固定共用 variant 1）
 */
const HammerEffectModule = {
  SUCCESS_VARIANT: 1,

  hosts: {},
  sprites: {},
  playing: false,
  _timer: null,
  _preloadCache: new Map(),
  _preloadDone: false,

  init() {
    if (this.sprites.back) return;

    this.hosts = {
      back: document.getElementById('hmEffectBackHost'),
      front: document.getElementById('hmEffectFrontHost'),
      text: document.getElementById('hmEffectTextHost'),
      equip: document.getElementById('hmEffectEquipHost'),
      summary1: document.getElementById('hmEffectSummary1Host'),
      summary2: document.getElementById('hmEffectSummary2Host'),
    };
    this.sprites = {
      back: this.hosts.back?.querySelector('.hm-effect-back'),
      front: this.hosts.front?.querySelector('.hm-effect-front'),
      text: this.hosts.text?.querySelector('.hm-effect-text'),
      equip: this.hosts.equip?.querySelector('.hm-effect-equip'),
      summary1: this.hosts.summary1?.querySelector('.hm-effect-summary1'),
      summary2: this.hosts.summary2?.querySelector('.hm-effect-summary2'),
    };
  },

  getLayout() {
    return typeof HAMMER_EFFECT !== 'undefined' ? HAMMER_EFFECT.layout : null;
  },

  getAnchor() {
    return this.getLayout()?.effectAnchor || { x: 209, y: 114 };
  },

  getTextScreenOffset() {
    return this.getLayout()?.textScreenOffset || { x: 214, y: 115 };
  },

  hasAssets() {
    return typeof HAMMER_EFFECT !== 'undefined' && Boolean(HAMMER_EFFECT.try);
  },

  isAnimEnabled() {
    return document.getElementById('chkHammerAnim')?.checked !== false;
  },

  isPlaying() {
    return this.playing;
  },

  isHammerTabActive() {
    const main = document.getElementById('mainContentPanel');
    return Boolean(main?.classList.contains('hammer-active'));
  },

  updateTestBarVisible() {
    this.init();
    const hasEquip = Boolean(document.querySelector('#equipDropZone img'));
    if (this.isHammerTabActive() && hasEquip) this.preloadAssets();
  },

  /** summary 相對次數格中心的偏移（左 7、上 8） */
  _summaryOffset: { x: -7, y: -8 },

  getActiveSummarySlotAnchor() {
    const panel = document.getElementById('mainContentPanel');
    if (!panel) return null;

    let target = document.querySelector(
      '#hmGoldenSlot .hm-lock-icon.next, #hmPlatinumRow .hm-lock-icon.next'
    );
    if (!target) {
      target = document.querySelector(
        '#hmGoldenSlot .hm-lock-slot, #hmPlatinumRow .hm-lock-slot'
      );
    }
    if (!target) {
      target = document.querySelector(
        '#hmGoldenSlot .hm-hammer-icon, #hmPlatinumRow .hm-hammer-icon'
      );
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

  getSpec(phase) {
    if (typeof HAMMER_EFFECT === 'undefined') return null;
    if (phase === 'try') return HAMMER_EFFECT.try;
    if (phase === 'fail') return HAMMER_EFFECT.fail;
    if (phase === 'success') {
      const v = String(this.SUCCESS_VARIANT);
      return HAMMER_EFFECT.success?.[v] || null;
    }
    return null;
  },

  shouldShowSuccessText() {
    return Boolean(this.getSpec('success')?.layers?.textScreen?.length);
  },

  assetPath(phase, variant, layerKey, frameIndex) {
    const v = phase === 'success' ? (variant ?? this.SUCCESS_VARIANT) : variant;
    return hammerEffectAssetPath(phase, v, layerKey, frameIndex);
  },

  frameAt(frames, index) {
    if (!frames?.length) return null;
    return frames[Math.min(index, frames.length - 1)];
  },

  summaryLayerKeys(spec) {
    const keys = Object.keys(spec?.layers || {}).filter((k) => k.startsWith('summaryIcon/'));
    keys.sort();
    return keys;
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
    this.summaryLayerKeys(spec).forEach((key) => {
      pushLayer(key, spec.layers[key] || []);
    });
    if (includeText) pushLayer('textScreen', spec.layers.textScreen || []);
    return urls;
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

  async preloadUrls(urls) {
    const unique = [...new Set(urls.filter(Boolean))];
    await Promise.all(unique.map((url) => this.preloadOne(url)));
  },

  async preloadAssets() {
    if (this._preloadDone || !this.hasAssets()) return;
    const successSpec = this.getSpec('success');
    const urls = [
      ...this.collectSpecUrls('try', null, HAMMER_EFFECT.try, false),
      ...(successSpec ? this.collectSpecUrls('success', this.SUCCESS_VARIANT, successSpec, true) : []),
      ...this.collectSpecUrls('fail', null, HAMMER_EFFECT.fail, true),
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

  summarySpriteForLayer(layerKey) {
    if (layerKey === 'summaryIcon/1') return this.sprites.summary1;
    if (layerKey === 'summaryIcon/2') return this.sprites.summary2;
    if (layerKey === 'summaryIcon/0') return this.sprites.summary1;
    return null;
  },

  summaryHostForLayer(layerKey) {
    if (layerKey === 'summaryIcon/1' || layerKey === 'summaryIcon/0') return this.hosts.summary1;
    if (layerKey === 'summaryIcon/2') return this.hosts.summary2;
    return null;
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
    const summaryLayers = this.summaryLayerKeys(spec).map((key) => ({
      key,
      frames: showSummary ? (spec.layers[key] || []) : [],
    }));
    const textFrames = includeText ? (spec.layers.textScreen || []) : [];
    const frameCount = Math.max(
      frontFrames.length,
      backFrames.length,
      ...summaryLayers.map((l) => l.frames.length),
      textFrames.length,
      1
    );
    const delayDefault = HAMMER_EFFECT?.frameDelayMs || 60;

    await this.preloadUrls(this.collectSpecUrls(phase, variant, spec, includeText));

    for (let f = 0; f < frameCount; f += 1) {
      const backF = this.frameAt(backFrames, f);
      const frontF = this.frameAt(frontFrames, f);
      const textF = this.frameAt(textFrames, f);
      const summaryFrameEntries = summaryLayers.map(({ key, frames }) => ({
        key,
        frame: this.frameAt(frames, f),
      }));
      const delay = frontF?.d || backF?.d
        || summaryFrameEntries.find((e) => e.frame)?.frame?.d
        || textF?.d || delayDefault;

      if (backF?.hasImg) {
        const src = this.assetPath(phase, variant, 'itemIcon/back', backF.i);
        this.setSprite(this.sprites.back, src, true);
        this.setHostVisible(this.hosts.back, true);
        this.placeAnchoredSprite(this.sprites.back, itemAnchor, backF.o);
      } else {
        this.setSprite(this.sprites.back, null, false);
        this.setHostVisible(this.hosts.back, false);
      }

      if (frontF) {
        const src = this.assetPath(phase, variant, 'itemIcon/front', frontF.i);
        this.setSprite(this.sprites.front, src, true);
        this.setHostVisible(this.hosts.front, true);
        this.placeAnchoredSprite(this.sprites.front, itemAnchor, frontF.o);
      } else {
        this.setSprite(this.sprites.front, null, false);
        this.setHostVisible(this.hosts.front, false);
      }

      for (const { key, frame } of summaryFrameEntries) {
        const sprite = this.summarySpriteForLayer(key);
        const host = this.summaryHostForLayer(key);
        if (showSummary && frame?.hasImg && summaryAnchor && sprite) {
          const src = this.assetPath(phase, variant, key, frame.i);
          this.setSprite(sprite, src, true);
          this.setHostVisible(host, true);
          this.placeAnchoredSprite(sprite, summaryAnchor, frame.o);
        } else if (sprite) {
          this.setSprite(sprite, null, false);
          this.setHostVisible(host, false);
        }
      }

      if (textF && includeText) {
        const src = this.assetPath(phase, variant, 'textScreen', textF.i);
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

    const delayDefault = HAMMER_EFFECT?.frameDelayMs || 60;
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
      this.setSprite(this.sprites.text, src, true);
      this.placeTextScreenSprite(this.sprites.text, textF.o);
      await this.wait(textF?.d || delayDefault);
      if (!this.playing) return;
    }
  },

  async begin() {
    this.init();
    await this.preloadAssets();
    this.playing = true;
    this.updateTestBarVisible();
    if (typeof HammerModule !== 'undefined') HammerModule.updateUseButtonState();
    document.getElementById('mainContentPanel')?.classList.add('hm-effect-playing');
    document.getElementById('equipDropZone')?.classList.add('hm-effect-active');
    this.showEquipAtAnchor();
  },

  end() {
    this.playing = false;
    if (this._timer) {
      window.clearTimeout(this._timer);
      this._timer = null;
    }
    this.clearSprites();
    document.getElementById('mainContentPanel')?.classList.remove('hm-effect-playing');
    document.getElementById('equipDropZone')?.classList.remove('hm-effect-active');
    this.updateTestBarVisible();
    if (typeof HammerModule !== 'undefined') HammerModule.updateUseButtonState();
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

  playTest(mode) {
    if (!document.querySelector('#equipDropZone img')) {
      addLog('⚠️ 請先放置裝備再測試演出。', 'log-fail');
      return;
    }
    if (!this.hasAssets()) {
      addLog('⚠️ 尚無鐵鎚演出素材。', 'log-fail');
      return;
    }

    const trySpec = this.getSpec('try');
    const successSpec = this.getSpec('success');
    const variant = this.SUCCESS_VARIANT;

    if (mode === 'try') {
      this.runPhases([
        { phase: 'try', variant: null, spec: trySpec, showText: false },
        {
          phase: 'success',
          variant,
          spec: successSpec,
          showText: this.shouldShowSuccessText(),
          textAfterBody: this.shouldShowSuccessText(),
        },
      ]);
      return;
    }

    if (mode === 'fail') {
      this.runPhases([
        { phase: 'try', variant: null, spec: trySpec, showText: false },
        {
          phase: 'fail',
          variant: null,
          spec: this.getSpec('fail'),
          showText: true,
          textAfterBody: true,
        },
      ]);
      return;
    }

    this.runPhases([
      {
        phase: 'success',
        variant,
        spec: successSpec,
        showText: this.shouldShowSuccessText(),
        textAfterBody: this.shouldShowSuccessText(),
      },
    ]);
  },

  async playHammerUse({ success, onComplete }) {
    if (!this.hasAssets()) {
      onComplete?.();
      return;
    }

    const trySpec = this.getSpec('try');
    const successSpec = this.getSpec('success');
    const variant = this.SUCCESS_VARIANT;
    const showSuccessText = this.shouldShowSuccessText();

    await this.begin();
    try {
      await this.playLayerFrames({
        phase: 'try',
        variant: null,
        spec: trySpec,
        showText: false,
      });
      if (!this.playing) return;

      if (success) {
        await this.playLayerFrames({
          phase: 'success',
          variant,
          spec: successSpec,
          showText: showSuccessText,
          textAfterBody: showSuccessText,
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

  runWithAnim({ success, fn }) {
    if (!this.isAnimEnabled() || !this.hasAssets()) {
      fn?.();
      return;
    }
    if (typeof HammerModule !== 'undefined') HammerModule.updateUseButtonState();
    this.playHammerUse({ success, onComplete: fn });
  },
};
