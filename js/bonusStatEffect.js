/**
 * 星火（附加能力）強化演出：try → success/0|1
 */
const BonusStatEffectModule = {
  hosts: {},
  sprites: {},
  playing: false,
  _timer: null,
  _preloadCache: new Map(),
  _preloadDone: new Set(),

  init() {
    if (this.sprites.back) return;

    this.hosts = {
      back: document.getElementById('bsEffectBackHost'),
      front: document.getElementById('bsEffectFrontHost'),
      text: document.getElementById('bsEffectTextHost'),
      equip: document.getElementById('bsEffectEquipHost'),
    };
    this.sprites = {
      back: this.hosts.back?.querySelector('.bs-effect-back'),
      front: this.hosts.front?.querySelector('.bs-effect-front'),
      text: this.hosts.text?.querySelector('.bs-effect-text'),
      equip: this.hosts.equip?.querySelector('.bs-effect-equip'),
    };
  },

  getLayout() {
    return typeof BONUS_STAT_EFFECT !== 'undefined' ? BONUS_STAT_EFFECT.layout : null;
  },

  getAnchor() {
    return this.getLayout()?.effectAnchor || { x: 209, y: 114 };
  },

  getTextScreenOffset() {
    return this.getLayout()?.textScreenOffset || { x: 214, y: 115 };
  },

  resolveVariant(starFireType) {
    if (typeof getBonusStatEffectVariant === 'function') {
      return getBonusStatEffectVariant(starFireType);
    }
    return 'normal';
  },

  getContextStarFireType() {
    if (typeof BonusStatModule === 'undefined') return 'enhanced';
    const item = BonusStatModule.getSelectedItem?.();
    if (BonusStatModule.costTab === 'item' && item?.starFireType) {
      return item.starFireType;
    }
    return BonusStatModule.itemData?.bonusStat?.starFireType || 'enhanced';
  },

  hasAssetsForVariant(variant) {
    return Boolean(BONUS_STAT_EFFECT?.variants?.[variant]?.try);
  },

  hasAssets() {
    return typeof BONUS_STAT_EFFECT !== 'undefined'
      && Object.keys(BONUS_STAT_EFFECT.variants || {}).length > 0;
  },

  isAnimEnabled() {
    return typeof isBonusStatEnhanceAnimEnabled === 'function'
      ? isBonusStatEnhanceAnimEnabled()
      : document.getElementById('chkBonusStatAnim')?.checked !== false;
  },

  isPlaying() {
    return this.playing;
  },

  isBonusStatTabActive() {
    const main = document.getElementById('mainContentPanel');
    return Boolean(main?.classList.contains('bonusStat-active'));
  },

  updateTestBarVisible() {
    this.init();
    if (!this.isBonusStatTabActive()) return;
    const hasEquip = Boolean(document.querySelector('#equipDropZone img'));
    if (!hasEquip) return;
    this.preloadVariantAssets(this.resolveVariant(this.getContextStarFireType()));
  },

  getVariantSpec(variant, phase, successVariant = 0) {
    const entry = BONUS_STAT_EFFECT?.variants?.[variant];
    if (!entry) return null;
    if (phase === 'try') return entry.try;
    if (phase === 'success') {
      const v = String(successVariant ?? 0);
      return entry.success?.[v] || entry.success?.['0'] || null;
    }
    return null;
  },

  shouldShowSuccessText(spec) {
    return Boolean(spec?.layers?.textScreen?.some((f) => f.hasImg));
  },

  assetPath(variant, phase, successVariant, layerKey, frameIndex) {
    return bonusStatEffectAssetPath(variant, phase, successVariant, layerKey, frameIndex);
  },

  frameAt(frames, index) {
    if (!frames?.length) return null;
    return frames[Math.min(index, frames.length - 1)];
  },

  collectSpecUrls(variant, phase, successVariant, spec, includeText) {
    const urls = [];
    const pushLayer = (layerKey, frames) => {
      (frames || []).forEach((f) => {
        if (f.hasImg === false) return;
        urls.push(this.assetPath(variant, phase, successVariant, layerKey, f.i));
      });
    };
    pushLayer('itemIcon/front', spec.layers['itemIcon/front']);
    pushLayer('itemIcon/back', spec.layers['itemIcon/back']);
    if (includeText) pushLayer('textScreen', spec.layers.textScreen);
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

  async preloadVariantAssets(variant) {
    if (this._preloadDone.has(variant)) return;
    const entry = BONUS_STAT_EFFECT?.variants?.[variant];
    if (!entry) return;

    const urls = [
      ...this.collectSpecUrls(variant, 'try', null, entry.try, false),
      ...this.collectSpecUrls(variant, 'success', 0, entry.success?.['0'], true),
      ...this.collectSpecUrls(variant, 'success', 1, entry.success?.['1'], true),
    ];
    await this.preloadUrls(urls);
    this._preloadDone.add(variant);
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

  /** 動畫期間沿用原本 drop zone 裝備圖，不複製 overlay（避免左偏 1px） */
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
      img.style.transform = '';
      img.style.filter = '';
    }
    const host = this.hosts.equip;
    if (host) {
      host.style.left = '';
      host.style.top = '';
      host.style.transform = '';
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
    variant,
    phase,
    successVariant = 0,
    spec,
    showText = false,
    textAfterBody = false,
  }) {
    if (!spec) return;

    if (textAfterBody && showText) {
      await this.playBodyFrames({ variant, phase, successVariant, spec });
      if (!this.playing) return;
      await this.playTextScreenFrames({ variant, phase, successVariant, spec });
      return;
    }

    await this.playBodyFrames({
      variant,
      phase,
      successVariant,
      spec,
      includeText: showText,
    });
  },

  async playBodyFrames({
    variant,
    phase,
    successVariant = 0,
    spec,
    includeText = false,
  }) {
    if (!spec) return;

    const itemAnchor = spec.anchor || this.getAnchor();
    const frontFrames = spec.layers['itemIcon/front'] || [];
    const backFrames = spec.layers['itemIcon/back'] || [];
    const textFrames = includeText ? (spec.layers.textScreen || []) : [];
    const frameCount = Math.max(frontFrames.length, backFrames.length, textFrames.length, 1);
    const delayDefault = BONUS_STAT_EFFECT?.frameDelayMs || 60;

    await this.preloadUrls(this.collectSpecUrls(variant, phase, successVariant, spec, includeText));

    for (let f = 0; f < frameCount; f += 1) {
      const backF = this.frameAt(backFrames, f);
      const frontF = this.frameAt(frontFrames, f);
      const textF = this.frameAt(textFrames, f);
      const delay = frontF?.d || backF?.d || textF?.d || delayDefault;

      if (backF?.hasImg) {
        const src = this.assetPath(variant, phase, successVariant, 'itemIcon/back', backF.i);
        await this.preloadOne(src);
        this.setSprite(this.sprites.back, src, true);
        this.setHostVisible(this.hosts.back, true);
        this.placeAnchoredSprite(this.sprites.back, itemAnchor, backF.o);
      } else {
        this.setSprite(this.sprites.back, null, false);
        this.setHostVisible(this.hosts.back, false);
      }

      if (frontF?.hasImg !== false && frontF) {
        const src = this.assetPath(variant, phase, successVariant, 'itemIcon/front', frontF.i);
        await this.preloadOne(src);
        this.setSprite(this.sprites.front, src, true);
        this.setHostVisible(this.hosts.front, true);
        this.placeAnchoredSprite(this.sprites.front, itemAnchor, frontF.o);
      } else {
        this.setSprite(this.sprites.front, null, false);
        this.setHostVisible(this.hosts.front, false);
      }

      if (textF && includeText && textF.hasImg !== false) {
        const src = this.assetPath(variant, phase, successVariant, 'textScreen', textF.i);
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

  async playTextScreenFrames({ variant, phase, successVariant = 0, spec }) {
    const textFrames = spec.layers.textScreen || [];
    if (!textFrames.length) return;

    const delayDefault = BONUS_STAT_EFFECT?.frameDelayMs || 60;
    await this.preloadUrls(this.collectSpecUrls(variant, phase, successVariant, spec, true));
    this.setHostVisible(this.hosts.text, true);

    for (let f = 0; f < textFrames.length; f += 1) {
      const textF = textFrames[f];
      if (!textF?.hasImg && textF?.hasImg !== undefined) {
        await this.wait(textF?.d || delayDefault);
        if (!this.playing) return;
        continue;
      }

      const src = this.assetPath(variant, phase, successVariant, 'textScreen', textF.i);
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
    this.playing = true;
    this.updateTestBarVisible();
    BonusStatModule?.updateResetButtonState?.();
    document.getElementById('mainContentPanel')?.classList.add('bs-effect-playing');
    document.getElementById('equipDropZone')?.classList.add('bs-effect-active');
    this.showEquipAtAnchor();
  },

  end() {
    this.playing = false;
    if (this._timer) {
      window.clearTimeout(this._timer);
      this._timer = null;
    }
    this.clearSprites();
    document.getElementById('mainContentPanel')?.classList.remove('bs-effect-playing');
    document.getElementById('equipDropZone')?.classList.remove('bs-effect-active');
    this.updateTestBarVisible();
    BonusStatModule?.updateResetButtonState?.();
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

  async playReset({ starFireType, successVariant = 0, onComplete }) {
    const variant = this.resolveVariant(starFireType);
    if (!this.hasAssetsForVariant(variant)) {
      onComplete?.();
      return;
    }

    const trySpec = this.getVariantSpec(variant, 'try');
    const successSpec = this.getVariantSpec(variant, 'success', successVariant);
    await this.preloadVariantAssets(variant);
    await this.begin();
    try {
      await this.playLayerFrames({
        variant,
        phase: 'try',
        spec: trySpec,
        showText: false,
      });
      if (!this.playing) return;

      const showText = this.shouldShowSuccessText(successSpec);
      await this.playLayerFrames({
        variant,
        phase: 'success',
        successVariant,
        spec: successSpec,
        showText,
        textAfterBody: showText,
      });
      onComplete?.();
    } finally {
      this.end();
    }
  },

  runWithAnim({ starFireType, successVariant = 0, fn }) {
    if (!this.isAnimEnabled() || !this.hasAssets()) {
      fn?.();
      return;
    }
    BonusStatModule?.updateResetButtonState?.();
    this.playReset({ starFireType, successVariant, onComplete: fn });
  },
};
