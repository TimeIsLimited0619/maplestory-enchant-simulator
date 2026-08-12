/**
 * 特效幀預載：onload 後再 decode，避免「已下載但未解碼」造成播放抽搐。
 * 各特效模組共用同一套 Promise／Image 快取鍵（相對路徑字串）。
 */
const EnchantImagePreload = {
  /** @type {Map<string, Promise<HTMLImageElement|null>>} */
  promiseCache: new Map(),
  /** @type {Map<string, HTMLImageElement|null>} */
  imageCache: new Map(),

  normalize(url) {
    if (!url) return '';
    return String(url);
  },

  getImage(url) {
    const key = this.normalize(url);
    if (!key) return null;
    if (this.imageCache.has(key)) return this.imageCache.get(key);
    return null;
  },

  /**
   * @param {string} url
   * @param {Map<string, Promise<HTMLImageElement|null>>} [localCache] 模組自有 Promise 快取（可選）
   * @returns {Promise<HTMLImageElement|null>}
   */
  preload(url, localCache = null) {
    const key = this.normalize(url);
    if (!key) return Promise.resolve(null);

    if (localCache?.has(key)) return localCache.get(key);
    if (this.promiseCache.has(key)) {
      const shared = this.promiseCache.get(key);
      if (localCache) localCache.set(key, shared);
      return shared;
    }

    const p = new Promise((resolve) => {
      const img = new Image();
      img.decoding = 'async';
      const finish = (value) => {
        this.imageCache.set(key, value);
        resolve(value);
      };
      img.onload = () => {
        if (typeof img.decode === 'function') {
          img.decode().then(() => finish(img)).catch(() => finish(img));
        } else {
          finish(img);
        }
      };
      img.onerror = () => finish(null);
      img.src = key;
    });

    this.promiseCache.set(key, p);
    if (localCache) localCache.set(key, p);
    return p;
  },

  async preloadMany(urls, localCache = null) {
    const list = [...new Set((urls || []).map((u) => this.normalize(u)).filter(Boolean))];
    await Promise.all(list.map((url) => this.preload(url, localCache)));
    return list;
  },
};
