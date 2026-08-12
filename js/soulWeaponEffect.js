/**
 * 靈魂武器演出：enchanter(try→success/fail) / soul(normal|magnificent|fail)
 *
 * 穩定化重點：
 * - 裝備圖固定 WZ 錨點＋scale(2)，不跟 dropZone hover 連動
 * - 幀載入失敗時保留上一幀，不瞬空
 * - 播放期間不反覆 toggle host.hidden
 * - 先定位再換圖，避免位移閃爍
 */
const SoulWeaponEffectModule = {
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
      back: document.getElementById('swEffectBackHost'),
      front: document.getElementById('swEffectFrontHost'),
      text: document.getElementById('swEffectTextHost'),
      equip: document.getElementById('swEffectEquipHost'),
    };
    this.sprites = {
      back: this.hosts.back?.querySelector('.sw-effect-back'),
      front: this.hosts.front?.querySelector('.sw-effect-front'),
      text: this.hosts.text?.querySelector('.sw-effect-text'),
      equip: this.hosts.equip?.querySelector('.sw-effect-equip'),
    };
  },

  getLayout() {
    return typeof SOUL_WEAPON_EFFECT !== 'undefined' ? SOUL_WEAPON_EFFECT.layout : null;
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
    return typeof SOUL_WEAPON_EFFECT !== 'undefined'
      && Boolean(SOUL_WEAPON_EFFECT.enchanter?.try || SOUL_WEAPON_EFFECT.soul?.normal);
  },

  isAnimEnabled() {
    return document.getElementById('chkSoulWeaponAnim')?.checked !== false;
  },

  isPlaying() {
    return this.playing;
  },

  isSoulWeaponTabActive() {
    return Boolean(document.getElementById('mainContentPanel')?.classList.contains('soulWeapon-active'));
  },

  updateTestBarVisible() {
    this.init();
    const hasEquip = Boolean(document.querySelector('#equipDropZone img'));
    if (this.isSoulWeaponTabActive() && hasEquip) this.preloadAssets();
  },

  getSpec(branch, phase) {
    if (typeof SOUL_WEAPON_EFFECT === 'undefined') return null;
    if (branch === 'enchanter') return SOUL_WEAPON_EFFECT.enchanter?.[phase] || null;
    return SOUL_WEAPON_EFFECT.soul?.[phase] || null;
  },

  assetPath(branch, phase, layerKey, frameIndex) {
    return soulWeaponEffectAssetPath(branch, phase, layerKey, frameIndex);
  },

  collectSpecUrls(branch, phase, spec, includeText) {
    const urls = [];
    const pushLayer = (layerKey, frames) => {
      frames.forEach((f) => {
        if (f.hasImg === false) return;
        urls.push(this.assetPath(branch, phase, layerKey, f.i));
      });
    };
    pushLayer('itemIcon/front', spec?.layers?.['itemIcon/front'] || []);
    pushLayer('itemIcon/back', spec?.layers?.['itemIcon/back'] || []);
    if (includeText) pushLayer('textScreen', spec?.layers?.textScreen || []);
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
    await Promise.all([...new Set(urls.filter(Boolean))].map((url) => this.preloadOne(url)));
  },

  async preloadAssets() {
    if (this._preloadDone || !this.hasAssets()) return;
    const urls = [
      ...this.collectSpecUrls('enchanter', 'try', this.getSpec('enchanter', 'try'), false),
      ...this.collectSpecUrls('enchanter', 'success', this.getSpec('enchanter', 'success'), true),
      ...this.collectSpecUrls('enchanter', 'fail', this.getSpec('enchanter', 'fail'), true),
      ...this.collectSpecUrls('soul', 'normal', this.getSpec('soul', 'normal'), true),
      ...this.collectSpecUrls('soul', 'magnificent', this.getSpec('soul', 'magnificent'), true),
      ...this.collectSpecUrls('soul', 'fail', this.getSpec('soul', 'fail'), true),
    ];
    await this.preloadUrls(urls);
    this._preloadDone = true;
  },

  placeAnchoredSprite(img, anchor, origin) {
    if (!img) return;
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

  /** 動畫期間沿用原本 drop zone 裝備圖，不複製 overlay（避免 1px 偏移） */
  showEquipAtAnchor() {
    this.hideEquipAtAnchor();
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

  /**
   * 呈現一幀：成功才更新；失敗保留上一幀（避免閃空）。
   * 順序：先定位 → 再換 src → 再顯示。
   */
  async presentFrame(spriteKey, src, anchor, origin, isText = false) {
    const el = this.sprites[spriteKey];
    const host = this.hosts[spriteKey];
    if (!el || !host || !src) return false;

    const loaded = await this.preloadOne(src);
    if (!loaded) return false;

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

    // 先開好會用到的 host，播放中不再反覆 display:none
    this.setHostVisible(this.hosts.front, hasFront);
    this.setHostVisible(this.hosts.back, hasBack);
    this.setHostVisible(this.hosts.text, hasText);
    if (!hasFront && this.sprites.front) {
      this.sprites.front.style.display = 'none';
    }
    if (!hasBack && this.sprites.back) {
      this.sprites.back.style.display = 'none';
    }
    if (!hasText && this.sprites.text) {
      this.sprites.text.style.display = 'none';
    }
  },

  async playBodyFrames({ branch, phase, spec, includeText = false, token }) {
    if (!spec) return;

    const itemAnchor = spec.anchor || this.getAnchor();
    const frontFrames = spec.layers['itemIcon/front'] || [];
    const backFrames = spec.layers['itemIcon/back'] || [];
    const textFrames = includeText ? (spec.layers.textScreen || []) : [];
    const frameCount = Math.max(frontFrames.length, backFrames.length, textFrames.length, 1);
    const delayDefault = SOUL_WEAPON_EFFECT?.frameDelayMs || 60;

    this.preparePhaseHosts(spec, includeText);
    await this.preloadUrls(this.collectSpecUrls(branch, phase, spec, includeText));
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
        const src = this.assetPath(branch, phase, 'itemIcon/back', backF.i);
        if (await this.presentFrame('back', src, itemAnchor, backF.o)) presented += 1;
      }

      if (frontF && frontF.hasImg !== false) {
        expected += 1;
        const src = this.assetPath(branch, phase, 'itemIcon/front', frontF.i);
        if (await this.presentFrame('front', src, itemAnchor, frontF.o)) presented += 1;
      }

      if (includeText && textF && textF.hasImg !== false) {
        expected += 1;
        const src = this.assetPath(branch, phase, 'textScreen', textF.i);
        if (await this.presentFrame('text', src, this.getTextScreenOffset(), textF.o, true)) {
          presented += 1;
        }
      }

      // 缺圖的幀直接省略（不補幀、不加等待）
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

  async playTextScreenFrames({ branch, phase, spec, token }) {
    const textFrames = spec?.layers?.textScreen || [];
    if (!textFrames.length) return;
    const delayDefault = SOUL_WEAPON_EFFECT?.frameDelayMs || 60;

    // success 文字階段收起 itemIcon，避免最後一幀（位移很大）僵持造成異常感
    this.hideItemIconSprites();

    this.setHostVisible(this.hosts.text, true);
    await this.preloadUrls(this.collectSpecUrls(branch, phase, spec, true));
    if (token !== this._playToken || !this.playing) return;

    for (let f = 0; f < textFrames.length; f += 1) {
      if (token !== this._playToken || !this.playing) return;
      const textF = textFrames[f];
      if (textF?.hasImg === false) continue;
      const src = this.assetPath(branch, phase, 'textScreen', textF.i);
      const ok = await this.presentFrame('text', src, this.getTextScreenOffset(), textF.o, true);
      // 缺圖直接省略該幀
      if (!ok) continue;
      await this.wait(textF?.d || delayDefault);
    }
  },

  async playLayerFrames({
    branch,
    phase,
    spec,
    showText = false,
    textAfterBody = false,
    token,
  }) {
    if (!spec) return;
    if (textAfterBody && showText) {
      await this.playBodyFrames({
        branch,
        phase,
        spec,
        includeText: false,
        token,
      });
      if (token !== this._playToken || !this.playing) return;
      // 成功字樣前先結束 body 最後一幀，避免異常定格
      this.hideItemIconSprites();
      await this.playTextScreenFrames({ branch, phase, spec, token });
      return;
    }
    await this.playBodyFrames({
      branch,
      phase,
      spec,
      includeText: showText,
      token,
    });
  },

  async begin() {
    this.init();
    await this.preloadAssets();
    this.playing = true;
    this.updateTestBarVisible();
    if (typeof SoulWeaponModule !== 'undefined') SoulWeaponModule.updateConfirmButtonState();
    document.getElementById('mainContentPanel')?.classList.add('sw-effect-playing');
    document.getElementById('equipDropZone')?.classList.add('sw-effect-active');
    this.showEquipAtAnchor();
  },

  end() {
    this.playing = false;
    if (this._timer) {
      window.clearTimeout(this._timer);
      this._timer = null;
    }
    this.clearSprites();
    document.getElementById('mainContentPanel')?.classList.remove('sw-effect-playing');
    document.getElementById('equipDropZone')?.classList.remove('sw-effect-active');
    this.updateTestBarVisible();
    if (typeof SoulWeaponModule !== 'undefined') SoulWeaponModule.updateConfirmButtonState();
  },

  /**
   * @param {'enchanter'|'soul'} branch
   * @param {{ success?: boolean, soulGrade?: 'normal'|'magnificent', onComplete?: Function }} opts
   */
  async play({ branch, success = true, soulGrade = 'normal', onComplete }) {
    if (!this.hasAssets()) {
      onComplete?.();
      return;
    }
    if (this.playing) return;

    const token = (this._playToken += 1);
    await this.begin();
    try {
      if (branch === 'enchanter') {
        await this.playLayerFrames({
          branch: 'enchanter',
          phase: 'try',
          spec: this.getSpec('enchanter', 'try'),
          showText: false,
          token,
        });
        if (token !== this._playToken || !this.playing) return;
        if (success) {
          await this.playLayerFrames({
            branch: 'enchanter',
            phase: 'success',
            spec: this.getSpec('enchanter', 'success'),
            showText: true,
            textAfterBody: true,
            token,
          });
        } else {
          await this.playLayerFrames({
            branch: 'enchanter',
            phase: 'fail',
            spec: this.getSpec('enchanter', 'fail'),
            showText: true,
            textAfterBody: true,
            token,
          });
        }
      } else {
        const phase = success ? (soulGrade === 'magnificent' ? 'magnificent' : 'normal') : 'fail';
        await this.playLayerFrames({
          branch: 'soul',
          phase,
          spec: this.getSpec('soul', phase),
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

  runWithAnim({ branch, success = true, soulGrade = 'normal', fn }) {
    if (!this.isAnimEnabled() || !this.hasAssets()) {
      fn?.();
      return;
    }
    if (this.playing) return;
    if (typeof SoulWeaponModule !== 'undefined') SoulWeaponModule.updateConfirmButtonState();
    this.play({ branch, success, soulGrade, onComplete: fn });
  },
};
