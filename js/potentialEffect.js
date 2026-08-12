/**
 * 潛能 / 附加潛能強化演出
 * - try 1 次 → success 1（同階）或 success 2（升階）
 * - 傳說無升階，僅 try + success 1
 */
const PotentialEffectModule = {
  hosts: {},
  sprites: {},
  playing: false,
  _timer: null,
  _preloadCache: new Map(),
  _preloadDone: new Set(),
  _currentRank: 'rare',
  /** WZ effect/potential itemIcon 父錨點 */
  _anchor: { x: 209, y: 114 },
  /** WZ vector:textScreenOffset */
  _textScreenOffset: { x: 214, y: 115 },
  _itemIconLt: { x: 166, y: 112 },
  _itemIconScale: 2,

  init() {
    if (this.sprites.back) return;

    this.hosts = {
      back: document.getElementById('ptEffectBackHost'),
      front: document.getElementById('ptEffectFrontHost'),
      text: document.getElementById('ptEffectTextHost'),
      equip: document.getElementById('ptEffectEquipHost'),
    };
    this.sprites = {
      back: this.hosts.back?.querySelector('.pt-effect-back'),
      front: this.hosts.front?.querySelector('.pt-effect-front'),
      text: this.hosts.text?.querySelector('.pt-effect-text'),
      equip: this.hosts.equip?.querySelector('.pt-effect-equip'),
    };
  },

  getActiveMode() {
    const main = document.getElementById('mainContentPanel');
    if (main?.classList.contains('additionalPotential-active')) return 'additionalPotential';
    if (main?.classList.contains('potential-active')) return 'potential';
    return null;
  },

  getRankData(rankId) {
    if (typeof POTENTIAL_EFFECT_BY_RANK === 'undefined') return null;
    return POTENTIAL_EFFECT_BY_RANK[rankId] || null;
  },

  hasAssetsForRank(rankId) {
    return Boolean(this.getRankData(rankId));
  },

  rankHasRankUpSuccess(rankId) {
    return Boolean(this.getRankData(rankId)?.hasRankUpSuccess);
  },

  isAnimEnabled() {
    const mode = this.getActiveMode();
    if (mode === 'additionalPotential') {
      return document.getElementById('chkAddPotentialAnim')?.checked !== false;
    }
    return document.getElementById('chkPotentialAnim')?.checked !== false;
  },

  isPlaying() {
    return this.playing;
  },

  getContextDisplayRank() {
    const mode = this.getActiveMode();
    if (mode === 'additionalPotential' && typeof AddPotentialModule !== 'undefined') {
      return AddPotentialModule.getAddPotDisplayRank();
    }
    if (mode === 'potential' && typeof PotentialModule !== 'undefined') {
      return PotentialModule.getPotentialDisplayRank();
    }
    return 'rare';
  },

  updateTestBarVisible() {
    const mode = this.getActiveMode();
    const hasEquip = Boolean(
      document.querySelector('#equipDropZone img')
      || (typeof currentEnchantItem !== 'undefined' && currentEnchantItem)
    );
    const rankId = hasEquip ? this.getContextDisplayRank() : 'rare';

    if (mode && hasEquip) this.preloadRankAssets(rankId);
  },

  /** 升階 → 2，其餘 → 1；傳說或無 success/2 時固定 1 */
  getSuccessVariant(oldRank, newRank) {
    if (!this.rankHasRankUpSuccess(oldRank)) return 1;
    const oi = POTENTIAL_RANK_ORDER.indexOf(oldRank);
    const ni = POTENTIAL_RANK_ORDER.indexOf(newRank);
    if (oi >= 0 && ni > oi) return 2;
    return 1;
  },

  normalizeSuccessVariant(variant, rankId = this._currentRank) {
    if (variant === 2 && this.rankHasRankUpSuccess(rankId)) return 2;
    return 1;
  },

  getSuccessSpec(rankId, variant) {
    const data = this.getRankData(rankId);
    if (!data) return null;
    const v = this.normalizeSuccessVariant(variant, rankId);
    return data.success[v] || data.success[1] || null;
  },

  getTrySpec(rankId) {
    return this.getRankData(rankId)?.try || null;
  },

  getFrameDelay(rankId) {
    return this.getRankData(rankId)?.frameDelayMs || 60;
  },

  assetPath(rankId, phase, variant, layerKey, frameIndex) {
    const v = phase === 'success' ? this.normalizeSuccessVariant(variant, rankId) : variant;
    return potentialEffectAssetPath(rankId, phase, v, layerKey, frameIndex);
  },

  collectSpecUrls(rankId, phase, variant, spec, includeText) {
    const urls = [];
    const pushLayer = (layerKey, frames) => {
      frames.forEach((f) => {
        urls.push(this.assetPath(rankId, phase, variant, layerKey, f.i));
      });
    };
    pushLayer('itemIcon/front', spec.layers['itemIcon/front'] || []);
    pushLayer('itemIcon/back', spec.layers['itemIcon/back'] || []);
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

  async preloadRankAssets(rankId) {
    if (this._preloadDone.has(rankId)) return;
    const data = this.getRankData(rankId);
    if (!data) return;
    const trySpec = data.try;
    const spec1 = this.getSuccessSpec(rankId, 1);
    const spec2 = this.getSuccessSpec(rankId, 2);
    const urls = [
      ...this.collectSpecUrls(rankId, 'try', null, trySpec, false),
      ...this.collectSpecUrls(rankId, 'success', 1, spec1, true),
    ];
    if (data.hasRankUpSuccess && spec2) {
      urls.push(...this.collectSpecUrls(rankId, 'success', 2, spec2, true));
    }
    await this.preloadUrls(urls);
    this._preloadDone.add(rankId);
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

  getEquipIconSrc() {
    const dropImg = document.querySelector('#equipDropZone img');
    return dropImg?.getAttribute('src') || '';
  },

  /** 動畫期間沿用原本 drop zone 裝備圖，不複製 overlay */
  showEquipAtWzAnchor() {
    this.hideEquipAtWzAnchor();
  },

  hideEquipAtWzAnchor() {
    const img = this.sprites.equip;
    if (img) {
      img.removeAttribute('src');
      img.style.display = 'none';
    }
    this.setHostVisible(this.hosts.equip, false);
  },

  placeTextScreenSprite(img, origin) {
    const anchor = this._textScreenOffset;
    if (origin) {
      img.style.left = `${anchor.x - origin.x}px`;
      img.style.top = `${anchor.y - origin.y}px`;
      img.style.transform = '';
      return;
    }
    img.style.left = `${anchor.x}px`;
    img.style.top = `${anchor.y}px`;
    img.style.transform = 'translate(-50%, -50%)';
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
    this.hideEquipAtWzAnchor();
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
    rankId,
    phase,
    variant,
    spec,
    showText = false,
  }) {
    if (!spec) return;
    const anchor = spec.anchor || this._anchor;
    const frontFrames = spec.layers['itemIcon/front'] || [];
    const backFrames = spec.layers['itemIcon/back'] || [];
    const textFrames = showText ? (spec.layers.textScreen || []) : [];
    const frameCount = Math.max(
      frontFrames.length,
      backFrames.length,
      textFrames.length,
      1
    );

    const showBack = phase === 'success' && backFrames.some((f) => f.o || f.hasImg !== false);
    const showFront = frontFrames.length > 0;
    const showTextLayer = showText && textFrames.length > 0;

    this.setHostVisible(this.hosts.back, showBack);
    this.setHostVisible(this.hosts.front, showFront);
    this.setHostVisible(this.hosts.text, showTextLayer);

    await this.preloadUrls(this.collectSpecUrls(rankId, phase, variant, spec, showText));

    for (let f = 0; f < frameCount; f += 1) {
      const backF = backFrames[f];
      const frontF = frontFrames[f];
      const textF = textFrames[f];
      const delay = frontF?.d || backF?.d || textF?.d || this.getFrameDelay(rankId);

      if (showBack && backF) {
        const src = this.assetPath(rankId, phase, variant, 'itemIcon/back', backF.i);
        this.setSprite(this.sprites.back, src, true);
        this.placeAnchoredSprite(this.sprites.back, anchor, backF.o);
      } else {
        this.setSprite(this.sprites.back, null, false);
      }

      if (frontF) {
        const src = this.assetPath(rankId, phase, variant, 'itemIcon/front', frontF.i);
        this.setSprite(this.sprites.front, src, true);
        this.placeAnchoredSprite(this.sprites.front, anchor, frontF.o);
      } else {
        this.setSprite(this.sprites.front, null, false);
      }

      if (textF && showTextLayer) {
        const src = this.assetPath(rankId, phase, variant, 'textScreen', textF.i);
        this.setSprite(this.sprites.text, src, true);
        this.placeTextScreenSprite(this.sprites.text, textF.o);
      } else {
        this.setSprite(this.sprites.text, null, false);
      }

      await this.wait(delay);
      if (!this.playing) return;
    }
  },

  async begin(rankId) {
    this.init();
    this._currentRank = rankId || this.getContextDisplayRank();
    await this.preloadRankAssets(this._currentRank);
    this.playing = true;
    this.updateTestBarVisible();
    document.getElementById('mainContentPanel')?.classList.add('pt-effect-playing');
    document.getElementById('equipDropZone')?.classList.add('pt-effect-active');
    this.showEquipAtWzAnchor();
  },

  end() {
    this.playing = false;
    if (this._timer) {
      window.clearTimeout(this._timer);
      this._timer = null;
    }
    this.clearSprites();
    document.getElementById('mainContentPanel')?.classList.remove('pt-effect-playing');
    document.getElementById('equipDropZone')?.classList.remove('pt-effect-active');
    this.updateTestBarVisible();
    if (typeof PotentialModule !== 'undefined') PotentialModule.updateResetButtonState();
    if (typeof AddPotentialModule !== 'undefined') AddPotentialModule.updateResetButtonState();
  },

  async runPhases(rankId, phases) {
    await this.begin(rankId);
    try {
      for (const phaseOpts of phases) {
        await this.playLayerFrames({ rankId, ...phaseOpts });
        if (!this.playing) return;
      }
    } finally {
      this.end();
    }
  },

  playTest(mode, variant = 1) {
    if (!document.querySelector('#equipDropZone img')) {
      addLog('⚠️ 請先放置裝備再測試演出。', 'log-fail');
      return;
    }
    const rankId = this.getContextDisplayRank();
    if (!this.hasAssetsForRank(rankId)) {
      addLog(`⚠️ 尚無 ${rankId} 演出素材。`, 'log-fail');
      return;
    }

    const trySpec = this.getTrySpec(rankId);
    if (mode === 'try') {
      const spec1 = this.getSuccessSpec(rankId, 1);
      this.runPhases(rankId, [
        { phase: 'try', variant: null, spec: trySpec, showText: false },
        { phase: 'success', variant: 1, spec: spec1, showText: Boolean(spec1?.layers.textScreen?.length) },
      ]);
      return;
    }

    const v = this.normalizeSuccessVariant(variant, rankId);
    const spec = this.getSuccessSpec(rankId, v);
    this.runPhases(rankId, [
      { phase: 'success', variant: v, spec, showText: Boolean(spec?.layers.textScreen?.length) },
    ]);
  },

  async playTryThen({ rank, onComplete }) {
    const rankId = rank || this.getContextDisplayRank();
    if (!this.hasAssetsForRank(rankId)) {
      onComplete?.();
      return;
    }

    const trySpec = this.getTrySpec(rankId);
    if (!trySpec) {
      onComplete?.();
      return;
    }

    await this.begin(rankId);
    try {
      await this.playLayerFrames({
        rankId,
        phase: 'try',
        variant: null,
        spec: trySpec,
        showText: false,
      });
      onComplete?.();
    } finally {
      this.end();
    }
  },

  /** 強化動畫開啟時：先 try，完成後執行 callback（通常為淡入彈窗） */
  runWithTryAnim({ rank, fn }) {
    const rankId = rank || this.getContextDisplayRank();
    if (!this.isAnimEnabled() || !this.hasAssetsForRank(rankId)) {
      fn?.();
      return;
    }

    if (typeof PotentialModule !== 'undefined') PotentialModule.updateResetButtonState();
    if (typeof AddPotentialModule !== 'undefined') AddPotentialModule.updateResetButtonState();
    this.playTryThen({ rank: rankId, onComplete: fn });
  },

  async playCubeRoll({ rank, oldRank, rollFn, onComplete }) {
    const rankId = rank || 'rare';
    if (!this.hasAssetsForRank(rankId)) {
      onComplete(rollFn());
      return;
    }

    const trySpec = this.getTrySpec(rankId);
    await this.begin(rankId);
    try {
      await this.playLayerFrames({
        rankId,
        phase: 'try',
        variant: null,
        spec: trySpec,
        showText: false,
      });
      if (!this.playing) return;

      const rolled = rollFn();
      const variant = this.getSuccessVariant(oldRank, rolled.rank || oldRank);
      const successSpec = this.getSuccessSpec(rankId, variant);

      await this.playLayerFrames({
        rankId,
        phase: 'success',
        variant,
        spec: successSpec,
        showText: Boolean(successSpec?.layers.textScreen?.length),
      });

      onComplete(rolled);
    } finally {
      this.end();
    }
  },
};

function isPotentialEnhanceAnimEnabled() {
  return document.getElementById('chkPotentialAnim')?.checked !== false;
}
