/**
 * 星力強化演出：try → success / fail / destroy（tier 1 共用；keep 播 fail）
 */
const StarForceEffectModule = {
  hosts: {},
  sprites: {},
  playing: false,
  _timer: null,
  _preloadCache: new Map(),
  _preloadDone: false,
  _multiSummaryEntries: [],

  init() {
    if (this.sprites.back) return;

    this.hosts = {
      back: document.getElementById('sfEffectBackHost'),
      front: document.getElementById('sfEffectFrontHost'),
      text: document.getElementById('sfEffectTextHost'),
      equip: document.getElementById('sfEffectEquipHost'),
      summary: document.getElementById('sfEffectSummaryHost'),
    };
    this.sprites = {
      back: this.hosts.back?.querySelector('.sf-effect-back'),
      front: this.hosts.front?.querySelector('.sf-effect-front'),
      text: this.hosts.text?.querySelector('.sf-effect-text'),
      equip: this.hosts.equip?.querySelector('.sf-effect-equip'),
      summary: this.hosts.summary?.querySelector('.sf-effect-summary'),
    };
  },

  getLayout() {
    return typeof STARFORCE_EFFECT !== 'undefined' ? STARFORCE_EFFECT.layout : null;
  },

  getAnchor() {
    return this.getLayout()?.effectAnchor || { x: 209, y: 114 };
  },

  getTextScreenOffset() {
    return this.getLayout()?.textScreenOffset || { x: 214, y: 115 };
  },

  getTier() {
    return STARFORCE_EFFECT?.defaultTier ?? '1';
  },

  hasAssets() {
    return typeof STARFORCE_EFFECT !== 'undefined' && Boolean(STARFORCE_EFFECT.try);
  },

  isAnimEnabled() {
    return document.getElementById('chkStarAnim')?.checked !== false;
  },

  isPlaying() {
    return this.playing;
  },

  isStarForceTabActive() {
    const main = document.getElementById('mainContentPanel');
    return Boolean(main?.classList.contains('starforce-active'));
  },

  updateTestBarVisible() {
    this.init();
    const show = this.isStarForceTabActive();
    const hasEquip = Boolean(document.querySelector('#equipDropZone img'));
    if (show && hasEquip) this.preloadAssets();
  },

  /** summary 對齊下一顆星位置的偏移（左 13、上 14） */
  _summaryOffset: { x: -13, y: -14 },

  getNextStarAnchor() {
    if (typeof StarForceModule !== 'undefined' && StarForceModule.currentStars != null) {
      return this.getStarAnchor(StarForceModule.currentStars + 1);
    }
    const panel = document.getElementById('mainContentPanel');
    const target = document.querySelector('#starImgContainer .ms-star-icon.next');
    if (!panel || !target) return null;

    const panelRect = panel.getBoundingClientRect();
    const slotRect = target.getBoundingClientRect();
    const { x: ox, y: oy } = this._summaryOffset;
    return {
      x: slotRect.left + slotRect.width / 2 - panelRect.left + ox,
      y: slotRect.top + slotRect.height / 2 - panelRect.top + oy,
    };
  },

  getStarAnchor(starIndex) {
    const panel = document.getElementById('mainContentPanel');
    const container = document.getElementById('starImgContainer');
    if (!panel || !container || !starIndex) return null;

    const target = container.querySelector(`[data-star-index="${starIndex}"]`);
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
    if (typeof STARFORCE_EFFECT === 'undefined') return null;
    if (phase === 'try') return STARFORCE_EFFECT.try;
    if (phase === 'success') return STARFORCE_EFFECT.success;
    if (phase === 'fail') return STARFORCE_EFFECT.fail;
    if (phase === 'destroy') return STARFORCE_EFFECT.destroy;
    return null;
  },

  outcomePhase(outcome) {
    if (outcome === 'success') return 'success';
    if (outcome === 'destroy') return 'destroy';
    return 'fail';
  },

  assetPath(phase, layerKey, frameIndex) {
    return starForceEffectAssetPath(this.getTier(), phase, layerKey, frameIndex);
  },

  frameAt(frames, index) {
    if (!frames?.length) return null;
    return frames[Math.min(index, frames.length - 1)];
  },

  collectSpecUrls(phase, spec, includeText) {
    const urls = [];
    const pushLayer = (layerKey, frames) => {
      frames.forEach((f) => {
        if (f.hasImg === false) return;
        urls.push(this.assetPath(phase, layerKey, f.i));
      });
    };

    pushLayer('itemIcon/front', spec.layers['itemIcon/front'] || []);
    pushLayer('itemIcon/back', spec.layers['itemIcon/back'] || []);
    pushLayer('summaryIcon', spec.layers.summaryIcon || []);
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
    const urls = [
      ...this.collectSpecUrls('try', STARFORCE_EFFECT.try, false),
      ...this.collectSpecUrls('success', STARFORCE_EFFECT.success, true),
      ...this.collectSpecUrls('fail', STARFORCE_EFFECT.fail, true),
      ...this.collectSpecUrls('destroy', STARFORCE_EFFECT.destroy, true),
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

  captureEquipSnapshot() {
    const dropImg = document.querySelector('#equipDropZone img');
    const panel = document.getElementById('mainContentPanel');
    if (!dropImg || !panel) return null;

    const panelRect = panel.getBoundingClientRect();
    const imgRect = dropImg.getBoundingClientRect();
    const computed = window.getComputedStyle(dropImg);
    return {
      x: imgRect.left + imgRect.width / 2 - panelRect.left,
      y: imgRect.top + imgRect.height / 2 - panelRect.top,
      transform: computed.transform === 'none' ? '' : computed.transform,
      transformOrigin: computed.transformOrigin || 'center center',
      filter: computed.filter || '',
    };
  },

  /** 動畫期間沿用原本 drop zone 裝備圖，不複製 overlay */
  showEquipAtAnchor() {
    this.hideEquipAtAnchor();
  },

  syncEquipOverlayPosition() {
    // no-op：改用原本裝備圖
  },

  hideEquipAtAnchor() {
    const host = this.hosts.equip;
    const img = this.sprites.equip;
    if (img) {
      img.removeAttribute('src');
      img.style.display = 'none';
      img.style.transform = '';
      img.style.filter = '';
    }
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
    this.clearMultiSummarySprites();
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
    spec,
    showText = false,
    textAfterBody = false,
    summaryAfterBody = false,
    summaryStarIndices = null,
  }) {
    if (!spec) return;

    const hasCustomSummary = Boolean(summaryStarIndices?.length);
    const playSummaryLast = (summaryAfterBody || hasCustomSummary)
      && phase !== 'try'
      && Boolean(spec.layers?.summaryIcon?.length);

    if (playSummaryLast) {
      await this.playBodyFrames({ phase, spec, skipSummary: true });
      if (!this.playing) return;
      if (textAfterBody && showText) {
        await this.playTextScreenFrames({ phase, spec });
        if (!this.playing) return;
      }
      if (hasCustomSummary) {
        await this.playMultiStarSummaryIcon(summaryStarIndices);
      } else {
        await this.playSummaryIconFrames({ phase, spec });
      }
      return;
    }

    if (textAfterBody && showText) {
      await this.playBodyFrames({ phase, spec });
      if (!this.playing) return;
      await this.playTextScreenFrames({ phase, spec });
      return;
    }

    await this.playBodyFrames({ phase, spec, includeText: showText });
  },

  async playBodyFrames({ phase, spec, includeText = false, skipSummary = false }) {
    if (!spec) return;

    const showSummary = phase !== 'try' && !skipSummary;
    const itemAnchor = spec.anchor || this.getAnchor();
    const summaryAnchor = showSummary ? this.getNextStarAnchor() : null;
    const frontFrames = spec.layers['itemIcon/front'] || [];
    const backFrames = spec.layers['itemIcon/back'] || [];
    const summaryFrames = showSummary ? (spec.layers.summaryIcon || []) : [];
    const textFrames = includeText ? (spec.layers.textScreen || []) : [];
    const frameCount = Math.max(
      frontFrames.length,
      backFrames.length,
      summaryFrames.length,
      textFrames.length,
      1
    );
    const delayDefault = STARFORCE_EFFECT?.frameDelayMs || 60;

    await this.preloadUrls(this.collectSpecUrls(phase, spec, includeText));

    for (let f = 0; f < frameCount; f += 1) {
      const backF = this.frameAt(backFrames, f);
      const frontF = this.frameAt(frontFrames, f);
      const summaryF = this.frameAt(summaryFrames, f);
      const textF = this.frameAt(textFrames, f);
      const delay = frontF?.d || backF?.d || summaryF?.d || textF?.d || delayDefault;

      if (backF?.hasImg) {
        const src = this.assetPath(phase, 'itemIcon/back', backF.i);
        this.setSprite(this.sprites.back, src, true);
        this.setHostVisible(this.hosts.back, true);
        this.placeAnchoredSprite(this.sprites.back, itemAnchor, backF.o);
      } else {
        this.setSprite(this.sprites.back, null, false);
        this.setHostVisible(this.hosts.back, false);
      }

      if (frontF) {
        const src = this.assetPath(phase, 'itemIcon/front', frontF.i);
        this.setSprite(this.sprites.front, src, true);
        this.setHostVisible(this.hosts.front, true);
        this.placeAnchoredSprite(this.sprites.front, itemAnchor, frontF.o);
      } else {
        this.setSprite(this.sprites.front, null, false);
        this.setHostVisible(this.hosts.front, false);
      }

      if (showSummary && summaryF?.hasImg && summaryAnchor && this.sprites.summary) {
        const src = this.assetPath(phase, 'summaryIcon', summaryF.i);
        this.setSprite(this.sprites.summary, src, true);
        this.setHostVisible(this.hosts.summary, true);
        this.placeAnchoredSprite(this.sprites.summary, summaryAnchor, summaryF.o);
      } else if (this.sprites.summary) {
        this.setSprite(this.sprites.summary, null, false);
        this.setHostVisible(this.hosts.summary, false);
      }

      if (textF && includeText) {
        const src = this.assetPath(phase, 'textScreen', textF.i);
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

  async playSummaryIconFrames({ phase, spec, starIndex }) {
    const summaryFrames = (spec.layers.summaryIcon || [])
      .slice()
      .sort((a, b) => b.i - a.i);
    if (!summaryFrames.length) return;

    const summaryAnchor = starIndex != null
      ? this.getStarAnchor(starIndex)
      : this.getNextStarAnchor();
    if (!summaryAnchor || !this.sprites.summary) return;

    const delayDefault = STARFORCE_EFFECT?.frameDelayMs || 60;
    const urls = (spec.layers.summaryIcon || [])
      .filter((f) => f.hasImg !== false)
      .map((f) => this.assetPath(phase, 'summaryIcon', f.i));
    await this.preloadUrls(urls);
    this.setHostVisible(this.hosts.summary, true);

    for (const summaryF of summaryFrames) {
      if (!summaryF?.hasImg && summaryF?.hasImg !== undefined) {
        await this.wait(summaryF?.d || delayDefault);
        if (!this.playing) return;
        continue;
      }

      const src = this.assetPath(phase, 'summaryIcon', summaryF.i);
      this.setSprite(this.sprites.summary, src, true);
      this.placeAnchoredSprite(this.sprites.summary, summaryAnchor, summaryF.o);
      await this.wait(summaryF?.d || delayDefault);
      if (!this.playing) return;
    }
  },

  async playMultiStarSummaryIcon(starIndices, phase = 'success') {
    const spec = this.getSpec(phase);
    if (!spec?.layers?.summaryIcon?.length || !starIndices?.length) return;

    if (starIndices.length > 1) {
      await this.playMultiStarSummaryIconParallel(starIndices, phase, spec);
      return;
    }

    await this.playSummaryIconFrames({ phase, spec, starIndex: starIndices[0] });
  },

  clearMultiSummarySprites() {
    if (!this._multiSummaryEntries?.length) return;
    this._multiSummaryEntries.forEach(({ host }) => host.remove());
    this._multiSummaryEntries = [];
  },

  async playMultiStarSummaryIconParallel(starIndices, phase, spec) {
    const summaryFrames = (spec.layers.summaryIcon || [])
      .slice()
      .sort((a, b) => b.i - a.i);
    if (!summaryFrames.length) return;

    const panel = document.getElementById('mainContentPanel');
    if (!panel) return;

    this.clearMultiSummarySprites();
    this.setSprite(this.sprites.summary, null, false);
    this.setHostVisible(this.hosts.summary, false);

    const entries = [];
    for (const starIndex of starIndices) {
      const anchor = this.getStarAnchor(starIndex);
      if (!anchor) continue;

      const host = document.createElement('div');
      host.className = 'sf-effect-summary-multi-host';
      host.dataset.starIndex = String(starIndex);
      const img = document.createElement('img');
      img.className = 'sf-effect-sprite sf-effect-summary-multi';
      img.alt = '';
      img.draggable = false;
      host.appendChild(img);
      panel.appendChild(host);
      host.style.left = `${anchor.x}px`;
      host.style.top = `${anchor.y}px`;
      entries.push({ host, img });
    }

    if (!entries.length) return;
    this._multiSummaryEntries = entries;

    const delayDefault = STARFORCE_EFFECT?.frameDelayMs || 60;
    const urls = (spec.layers.summaryIcon || [])
      .filter((f) => f.hasImg !== false)
      .map((f) => this.assetPath(phase, 'summaryIcon', f.i));
    await this.preloadUrls(urls);

    try {
      for (const summaryF of summaryFrames) {
        if (!summaryF?.hasImg && summaryF?.hasImg !== undefined) {
          await this.wait(summaryF?.d || delayDefault);
          if (!this.playing) return;
          continue;
        }

        const src = this.assetPath(phase, 'summaryIcon', summaryF.i);
        entries.forEach(({ img }) => {
          img.src = src;
          img.style.display = 'block';
          this.placeAnchoredSprite(img, { x: 0, y: 0 }, summaryF.o);
        });

        await this.wait(summaryF?.d || delayDefault);
        if (!this.playing) return;
      }
    } finally {
      this.clearMultiSummarySprites();
    }
  },

  async playTextScreenFrames({ phase, spec }) {
    const textFrames = spec.layers.textScreen || [];
    if (!textFrames.length) return;

    const delayDefault = STARFORCE_EFFECT?.frameDelayMs || 60;
    await this.preloadUrls(this.collectSpecUrls(phase, spec, true));
    this.setHostVisible(this.hosts.text, true);

    for (let f = 0; f < textFrames.length; f += 1) {
      const textF = textFrames[f];
      if (!textF?.hasImg && textF?.hasImg !== undefined) {
        await this.wait(textF?.d || delayDefault);
        if (!this.playing) return;
        continue;
      }

      const src = this.assetPath(phase, 'textScreen', textF.i);
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
    if (typeof StarForceModule !== 'undefined') StarForceModule.updateEnhanceButtonState();
    this._equipSnapshot = this.captureEquipSnapshot();
    this.showEquipAtAnchor();
    document.getElementById('mainContentPanel')?.classList.add('sf-effect-playing');
    document.getElementById('equipDropZone')?.classList.add('sf-effect-active');
  },

  end() {
    this.playing = false;
    this._equipSnapshot = null;
    if (this._timer) {
      window.clearTimeout(this._timer);
      this._timer = null;
    }
    this.clearSprites();
    document.getElementById('mainContentPanel')?.classList.remove('sf-effect-playing');
    document.getElementById('equipDropZone')?.classList.remove('sf-effect-active');
    this.updateTestBarVisible();
    if (typeof StarForceModule !== 'undefined') StarForceModule.updateEnhanceButtonState();
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
      addLog('⚠️ 尚無星力演出素材。', 'log-fail');
      return;
    }

    const trySpec = this.getSpec('try');
    const successSpec = this.getSpec('success');
    const failSpec = this.getSpec('fail');
    const destroySpec = this.getSpec('destroy');

    if (mode === 'try') {
      this.runPhases([
        { phase: 'try', spec: trySpec, showText: false },
        { phase: 'success', spec: successSpec, showText: true, textAfterBody: true, summaryAfterBody: true },
      ]);
      return;
    }

    if (mode === 'fail') {
      this.runPhases([
        { phase: 'try', spec: trySpec, showText: false },
        { phase: 'fail', spec: failSpec, showText: true, textAfterBody: true },
      ]);
      return;
    }

    if (mode === 'destroy') {
      this.runPhases([
        { phase: 'try', spec: trySpec, showText: false },
        { phase: 'destroy', spec: destroySpec, showText: true, textAfterBody: true },
      ]);
      return;
    }

    this.runPhases([
      { phase: 'success', spec: successSpec, showText: true, textAfterBody: true, summaryAfterBody: true },
    ]);
  },

  async playStarEnhance({ outcome, onComplete, scrollAnim }) {
    if (!this.hasAssets()) {
      onComplete?.();
      return;
    }

    const trySpec = this.getSpec('try');
    const resultPhase = this.outcomePhase(outcome);
    const resultSpec = this.getSpec(resultPhase);
    const showResultText = Boolean(resultSpec?.layers?.textScreen?.length);
    const summaryStarIndices = outcome === 'success' && scrollAnim?.summaryStars?.length
      ? scrollAnim.summaryStars
      : null;

    await this.begin();
    try {
      await this.playLayerFrames({ phase: 'try', spec: trySpec, showText: false });
      if (!this.playing) return;

      await this.playLayerFrames({
        phase: resultPhase,
        spec: resultSpec,
        showText: showResultText,
        textAfterBody: showResultText,
        summaryAfterBody: resultPhase === 'success' && !summaryStarIndices,
        summaryStarIndices,
      });

      onComplete?.();
    } finally {
      this.end();
    }
  },

  runWithAnim({ outcome, fn, scrollAnim }) {
    if (!this.isAnimEnabled() || !this.hasAssets()) {
      fn?.();
      return;
    }
    if (typeof StarForceModule !== 'undefined') StarForceModule.updateEnhanceButtonState();
    this.playStarEnhance({ outcome, onComplete: fn, scrollAnim });
  },
};
