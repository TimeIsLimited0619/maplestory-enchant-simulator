/**
 * 特效幀預載：onload 後再 decode，避免「已下載但未解碼」造成播放抽搐。
 * 各特效模組共用同一套 Promise／Image 快取鍵（相對路徑字串）。
 */
const EnchantImagePreload = {
  /** @type {Map<string, Promise<HTMLImageElement|null>>} */
  promiseCache: new Map(),
  /** @type {Map<string, HTMLImageElement|null>} */
  imageCache: new Map(),
  /** softTrim 預設上限；掛機過久解碼圖會佔大量記憶體 */
  DEFAULT_SOFT_MAX: 420,

  normalize(url) {
    if (!url) return '';
    return String(url);
  },

  size() {
    return this.imageCache.size;
  },

  getImage(url) {
    const key = this.normalize(url);
    if (!key) return null;
    if (!this.imageCache.has(key)) return null;
    // 讀取時移到 Map 尾端，讓 softTrim 優先丟最久未用的
    const img = this.imageCache.get(key);
    this.imageCache.delete(key);
    this.imageCache.set(key, img);
    return img;
  },

  /**
   * @param {string} url
   * @param {Map<string, Promise<HTMLImageElement|null>>} [localCache] 模組自有 Promise 快取（可選）
   * @param {{ decode?: boolean }} [options] decode 預設 true（特效幀）；UI chrome 可關以加快開頁
   * @returns {Promise<HTMLImageElement|null>}
   */
  preload(url, localCache = null, options = null) {
    const key = this.normalize(url);
    if (!key) return Promise.resolve(null);

    if (localCache?.has(key)) return localCache.get(key);
    if (this.promiseCache.has(key)) {
      const shared = this.promiseCache.get(key);
      if (localCache) localCache.set(key, shared);
      return shared;
    }

    const wantDecode = options?.decode !== false;
    const p = new Promise((resolve) => {
      const img = new Image();
      img.decoding = 'async';
      const finish = (value) => {
        this.imageCache.set(key, value);
        resolve(value);
      };
      img.onload = () => {
        if (wantDecode && typeof img.decode === 'function') {
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

  /** 清空全部解碼快取（轉場／硬釋放用） */
  clear() {
    this.promiseCache.clear();
    this.imageCache.clear();
  },

  /**
   * 保留指定 URL，其餘丟棄。
   * @param {Iterable<string>|Set<string>|null} keepUrls
   */
  evictExcept(keepUrls) {
    const keep = new Set();
    (keepUrls || []).forEach((u) => {
      const key = this.normalize(u);
      if (key) keep.add(key);
    });
    for (const key of [...this.imageCache.keys()]) {
      if (keep.has(key)) continue;
      this.imageCache.delete(key);
      this.promiseCache.delete(key);
    }
    for (const key of [...this.promiseCache.keys()]) {
      if (keep.has(key)) continue;
      this.promiseCache.delete(key);
    }
  },

  /**
   * LRU 軟修剪：超過 maxEntries 時丟掉最久未讀取的解碼圖。
   * @param {number} [maxEntries]
   * @param {Iterable<string>|Set<string>|null} [keepUrls] 永不剔除的 URL（如傷害數字皮膚）
   * @returns {{ before: number, after: number, evicted: number }}
   */
  softTrim(maxEntries, keepUrls) {
    const max = Math.max(64, Math.floor(Number(maxEntries) || this.DEFAULT_SOFT_MAX));
    const keep = new Set();
    (keepUrls || []).forEach((u) => {
      const key = this.normalize(u);
      if (key) keep.add(key);
    });
    const before = this.imageCache.size;
    while (this.imageCache.size > max) {
      let evicted = false;
      for (const key of this.imageCache.keys()) {
        if (keep.has(key)) continue;
        this.imageCache.delete(key);
        this.promiseCache.delete(key);
        evicted = true;
        break;
      }
      if (!evicted) break; // 剩下的都是 keep
    }
    // 清掉已無 image 對應、且已 settled 的 promise 殘留鍵
    for (const key of [...this.promiseCache.keys()]) {
      if (this.imageCache.has(key)) continue;
      this.promiseCache.delete(key);
    }
    const after = this.imageCache.size;
    return { before, after, evicted: Math.max(0, before - after) };
  },
};

if (typeof window !== 'undefined') {
  window.EnchantImagePreload = EnchantImagePreload;
}
