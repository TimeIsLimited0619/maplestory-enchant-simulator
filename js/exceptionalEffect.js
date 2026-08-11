/**
 * 卓越強化演出：enchant(try→success/fail) / extract(normal)
 */
const ExceptionalEffectModule = {
  hosts: {},
  sprites: {},
  playing: false,
  _timer: null,
  _preloadCache: new Map(),
  _preloadDone: false,
  _playToken: 0,

  init() {
    if (this.sprites.front) return;

    this.hosts = {
      back: document.getElementById('exEffectBackHost'),
      front: document.getElementById('exEffectFrontHost'),
      text: document.getElementById('exEffectTextHost'),
      equip: document.getElementById('exEffectEquipHost'),
    };
    this.sprites = {
      back: this.hosts.back?.querySelector('.ex-effect-back'),
      front: this.hosts.front?.querySelector('.ex-effect-front'),
      text: this.hosts.text?.querySelector('.ex-effect-text'),
      equip: this.hosts.equip?.querySelector('.ex-effect-equip'),
    };
  },

  getLayout() {
    return typeof EXCEPTIONAL_EFFECT !== 'undefined' ? EXCEPTIONAL_EFFECT.layout : null;
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
    return typeof EXCEPTIONAL_EFFECT !== 'undefined'
      && Boolean(EXCEPTIONAL_EFFECT.enchant?.try?.['0']);
  },

  isAnimEnabled() {
    return document.getElementById('chkExceptionalAnim')?.checked !== false;
  },

  isPlaying() {
    return this.playing;
  },

  isExceptionalTabActive() {
    return Boolean(document.getElementById('mainContentPanel')?.classList.contains('exceptional-active'));
  },

  updateTestBarVisible() {
    this.init();
    const hasEquip = Boolean(document.querySelector('#equipDropZone img'));
    if (this.isExceptionalTabActive() && hasEquip) this.preloadAssets();
  },

  getTryVariant(level) {
    return level >= 1 ? '1' : '0';
  },

  getSpec(branch, phase, tryVariant) {
    if (typeof EXCEPTIONAL_EFFECT === 'undefined') return null;
    if (branch === 'enchant' && phase === 'try') {
      const v = this.getTryVariant(tryVariant ?? 0);
      return EXCEPTIONAL_EFFECT.enchant?.try?.[v] || null;
    }
    if (branch === 'enchant') return EXCEPTIONAL_EFFECT.enchant?.[phase] || null;
    if (branch === 'extract') return EXCEPTIONAL_EFFECT.extract?.[phase] || null;
    return null;
  },

  assetPath(branch, phase, layerKey, frameIndex, tryVariant) {
    if (branch === 'enchant' && phase === 'fail'
      && typeof starForceEffectAssetPath === 'function') {
      return starForceEffectAssetPath(0, 'fail', layerKey, frameIndex);
    }
    return exceptionalEffectAssetPath(branch, phase, layerKey, frameIndex, tryVariant);
  },

  collectSpecUrls(branch, phase, spec, includeText, tryVariant) {
    const urls = [];
    const pushLayer = (layerKey, frames) => {
      frames.forEach((f) => {
        if (f.hasImg === false) return;
        urls.push(this.assetPath(branch, phase, layerKey, f.i, tryVariant));
      });
    };
    pushLayer('itemIcon/front', spec?.layers?.['itemIcon/front'] || []);
    pushLayer('itemIcon/back', spec?.layers?.['itemIcon/back'] || []);
    if (includeText) pushLayer('textScreen', spec?.layers?.textScreen || []);
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
    await Promise.all([...new Set(urls.filter(Boolean))].map((url) => this.preloadOne(url)));
  },

  async preloadAssets() {
    if (this._preloadDone || !this.hasAssets()) return;
    const urls = [
      ...this.collectSpecUrls('enchant', 'try', this.getSpec('enchant', 'try', 0), false, 0),
      ...this.collectSpecUrls('enchant', 'try', this.getSpec('enchant', 'try', 1), false, 1),
      ...this.collectSpecUrls('enchant', 'success', this.getSpec('enchant', 'success'), true),
      ...this.collectSpecUrls('enchant', 'fail', this.getSpec('enchant', 'fail'), true),
      ...this.collectSpecUrls('extract', 'normal', this.getSpec('extract', 'normal'), true),
    ];
    await this.preloadUrls(urls);
    this._preloadDone = true;
  },

  setHostVisible(host, visible) {
    if (!host) return;
    host.classList.toggle('hidden', !visible);
    host.setAttribute('aria-hidden', visible ? 'false' : 'true');
  },

  placeAnchoredSprite(el, anchor, origin) {
    if (!el) return;
    const ox = origin?.x ?? 0;
    const oy = origin?.y ?? 0;
    el.style.left = `${anchor.x - ox}px`;
    el.style.top = `${anchor.y - oy}px`;
    el.style.transform = 'none';
  },

  placeTextScreenSprite(el, origin) {
    const offset = this.getTextScreenOffset();
    this.placeAnchoredSprite(el, offset, origin);
  },

  showEquipAtAnchor() {
    const host = this.hosts.equip;
    const el = this.sprites.equip;
    const src = document.querySelector('#equipDropZone img')?.getAttribute('src');
    if (!host || !el || !src) return;
    const anchor = this.getAnchor();
    el.src = src;
    el.style.left = `${anchor.x}px`;
    el.style.top = `${anchor.y}px`;
    el.style.transform = `translate(-50%, -50%) scale(${this.getItemIconScale()})`;
    el.style.display = 'block';
    this.setHostVisible(host, true);
  },

  hideEquipAtAnchor() {
    if (this.sprites.equip) {
      this.sprites.equip.style.display = 'none';
    }
    this.setHostVisible(this.hosts.equip, false);
  },

  async presentFrame(layer, src, anchor, origin, isText) {
    const host = this.hosts[layer];
    const el = this.sprites[layer];
    if (!host || !el || !src) return false;
    const img = await this.preloadOne(src);
    if (!img) return false;
    if (isText) this.placeTextScreenSprite(el, origin);
    else this.placeAnchoredSprite(el, anchor, origin);
    if (el.getAttribute('src') !== src) el.src = src;
    el.style.display = 'block';
    el.style.visibility = 'visible';
    this.setHostVisible(host, true);
    return true;
  },

  clearSprites() {
    Object.values(this.sprites).forEach((el) => {
      if (!el || el === this.sprites.equip) return;
      el.removeAttribute('src');
      el.style.display = 'none';
      el.style.visibility = '';
      el.style.transform = '';
      el.style.left = '';
      el.style.top = '';
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

  preparePhaseHosts(spec, includeText) {
    const hasFront = (spec?.layers?.['itemIcon/front'] || []).some((f) => f.hasImg !== false);
    const hasBack = (spec?.layers?.['itemIcon/back'] || []).some((f) => f.hasImg);
    const hasText = includeText && (spec?.layers?.textScreen || []).length > 0;
    this.setHostVisible(this.hosts.front, hasFront);
    this.setHostVisible(this.hosts.back, hasBack);
    this.setHostVisible(this.hosts.text, hasText);
  },

  async playBodyFrames({
    branch, phase, spec, includeText = false, tryVariant, token,
  }) {
    if (!spec) return;

    const itemAnchor = spec.anchor || this.getAnchor();
    const frontFrames = spec.layers['itemIcon/front'] || [];
    const backFrames = spec.layers['itemIcon/back'] || [];
    const textFrames = includeText ? (spec.layers.textScreen || []) : [];
    const frameCount = Math.max(frontFrames.length, backFrames.length, textFrames.length, 1);
    const delayDefault = EXCEPTIONAL_EFFECT?.frameDelayMs || 60;

    this.preparePhaseHosts(spec, includeText);
    await this.preloadUrls(this.collectSpecUrls(branch, phase, spec, includeText, tryVariant));
    if (token !== this._playToken || !this.playing) return;

    for (let f = 0; f < frameCount; f += 1) {
      if (token !== this._playToken || !this.playing) return;

      const backF = backFrames[f];
      const frontF = frontFrames[f];
      const textF = textFrames[f];
      const delay = frontF?.d || backF?.d || textF?.d || delayDefault;

      let expected = 0;
      let presented = 0;

      if (backF?.hasImg) {
        expected += 1;
        const src = this.assetPath(branch, phase, 'itemIcon/back', backF.i, tryVariant);
        if (await this.presentFrame('back', src, itemAnchor, backF.o)) presented += 1;
      }

      if (frontF && frontF.hasImg !== false) {
        expected += 1;
        const src = this.assetPath(branch, phase, 'itemIcon/front', frontF.i, tryVariant);
        if (await this.presentFrame('front', src, itemAnchor, frontF.o)) presented += 1;
      }

      if (includeText && textF && textF.hasImg !== false) {
        expected += 1;
        const src = this.assetPath(branch, phase, 'textScreen', textF.i, tryVariant);
        if (await this.presentFrame('text', src, this.getTextScreenOffset(), textF.o, true)) {
          presented += 1;
        }
      }

      if (expected > 0 && presented === 0) continue;
      await this.wait(delay);
    }
  },

  hideItemIconSprites() {
    if (this.sprites.front) {
      this.sprites.front.style.display = 'none';
      this.sprites.front.style.visibility = 'hidden';
    }
    if (this.sprites.back) {
      this.sprites.back.style.display = 'none';
      this.sprites.back.style.visibility = 'hidden';
    }
    this.setHostVisible(this.hosts.front, false);
    this.setHostVisible(this.hosts.back, false);
  },

  async playTextScreenFrames({ branch, phase, spec, tryVariant, token }) {
    const textFrames = spec?.layers?.textScreen || [];
    if (!textFrames.length) return;
    const delayDefault = EXCEPTIONAL_EFFECT?.frameDelayMs || 60;

    this.hideItemIconSprites();
    this.setHostVisible(this.hosts.text, true);
    await this.preloadUrls(this.collectSpecUrls(branch, phase, spec, true, tryVariant));
    if (token !== this._playToken || !this.playing) return;

    for (let f = 0; f < textFrames.length; f += 1) {
      if (token !== this._playToken || !this.playing) return;
      const textF = textFrames[f];
      if (textF?.hasImg === false) continue;
      const src = this.assetPath(branch, phase, 'textScreen', textF.i, tryVariant);
      const ok = await this.presentFrame('text', src, this.getTextScreenOffset(), textF.o, true);
      if (!ok) continue;
      await this.wait(textF?.d || delayDefault);
    }
  },

  async playLayerFrames({
    branch, phase, spec, showText = false, textAfterBody = false, tryVariant, token,
  }) {
    if (!spec) return;
    if (textAfterBody && showText) {
      await this.playBodyFrames({
        branch, phase, spec, includeText: false, tryVariant, token,
      });
      if (token !== this._playToken || !this.playing) return;
      this.hideItemIconSprites();
      await this.playTextScreenFrames({ branch, phase, spec, tryVariant, token });
      return;
    }
    await this.playBodyFrames({
      branch, phase, spec, includeText: showText, tryVariant, token,
    });
  },

  async begin() {
    this.init();
    await this.preloadAssets();
    this.playing = true;
    this.updateTestBarVisible();
    if (typeof ExceptionalModule !== 'undefined') ExceptionalModule.updateActionButtons();
    document.getElementById('mainContentPanel')?.classList.add('ex-effect-playing');
    document.getElementById('equipDropZone')?.classList.add('ex-effect-active');
    this.showEquipAtAnchor();
  },

  end() {
    this.playing = false;
    if (this._timer) {
      window.clearTimeout(this._timer);
      this._timer = null;
    }
    this.clearSprites();
    document.getElementById('mainContentPanel')?.classList.remove('ex-effect-playing');
    document.getElementById('equipDropZone')?.classList.remove('ex-effect-active');
    this.updateTestBarVisible();
    if (typeof ExceptionalModule !== 'undefined') ExceptionalModule.updateActionButtons();
  },

  async play({ branch, success = true, tryLevel = 0, onComplete }) {
    if (!this.hasAssets()) {
      onComplete?.();
      return;
    }
    if (this.playing) return;

    const token = (this._playToken += 1);
    const tryVariant = this.getTryVariant(tryLevel);
    await this.begin();
    try {
      if (branch === 'enchant') {
        await this.playLayerFrames({
          branch: 'enchant',
          phase: 'try',
          spec: this.getSpec('enchant', 'try', tryLevel),
          showText: false,
          tryVariant,
          token,
        });
        if (token !== this._playToken || !this.playing) return;
        const resultPhase = success ? 'success' : 'fail';
        await this.playLayerFrames({
          branch: 'enchant',
          phase: resultPhase,
          spec: this.getSpec('enchant', resultPhase),
          showText: true,
          textAfterBody: true,
          tryVariant,
          token,
        });
      } else {
        await this.playLayerFrames({
          branch: 'extract',
          phase: 'normal',
          spec: this.getSpec('extract', 'normal'),
          showText: true,
          textAfterBody: true,
          token,
        });
      }
      if (token === this._playToken) onComplete?.();
    } finally {
      if (token === this._playToken) this.end();
    }
  },

  runWithAnim({ branch, success = true, tryLevel = 0, fn }) {
    if (!this.isAnimEnabled() || !this.hasAssets()) {
      fn?.();
      return;
    }
    if (this.playing) return;
    if (typeof ExceptionalModule !== 'undefined') ExceptionalModule.updateActionButtons();
    this.play({ branch, success, tryLevel, onComplete: fn });
  },
};
