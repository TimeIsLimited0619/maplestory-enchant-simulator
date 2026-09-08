/**
 * 傷害數字皮膚：images/damageSkin/{skinId}/{NoRed|NoCri1}/{0-12}.png
 */
const DamageSkinCatalog = (() => {
  const DEFAULT_SKIN_ID = '18';
  const MOB_SKIN_ID = 'mob';
  const STORAGE_KEY = 'idle.damageSkinId';
  const NORMAL_FOLDER = 'NoRed';
  const CRIT_FOLDER = 'NoCri1';
  const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  const UNIT_WAN = 10;
  const UNIT_YI = 11;
  const CRIT_ICON = 12;
  /** 怪物打玩家：Miss / guard 狀態圖（檔名大小寫依素材） */
  const STATUS_GLYPHS = {
    miss: 'Miss',
    guard: 'guard',
  };

  /** @type {Map<string, { widths: Map<string, number>, units: Set<number>, ready: boolean }>} */
  const skinCache = new Map();
  /** @type {Map<string, Promise<object>>} */
  const preloadJobs = new Map();
  let playerSkinId = DEFAULT_SKIN_ID;

  function normalizeSkinId(id) {
    const s = String(id ?? '').trim();
    return s || DEFAULT_SKIN_ID;
  }

  function glyphUrl(skin, folder, index) {
    const id = normalizeSkinId(skin);
    return `images/damageSkin/${id}/${folder}/${index}.png`;
  }

  function statusGlyphName(kind) {
    const key = String(kind || '').trim().toLowerCase();
    return STATUS_GLYPHS[key] || '';
  }

  function statusGlyphUrl(skin, kind) {
    const name = statusGlyphName(kind);
    if (!name) return '';
    const id = normalizeSkinId(skin);
    return `images/damageSkin/${id}/${NORMAL_FOLDER}/${name}.png`;
  }

  function playerSkin() {
    return playerSkinId;
  }

  function setPlayerSkinId(id) {
    playerSkinId = normalizeSkinId(id);
    try {
      localStorage.setItem(STORAGE_KEY, playerSkinId);
    } catch (_) { /* ignore */ }
    return ensurePreloaded(playerSkinId);
  }

  function loadPlayerSkinId() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) playerSkinId = normalizeSkinId(saved);
    } catch (_) { /* ignore */ }
    return playerSkinId;
  }

  function collectSkinUrls(skin) {
    const id = normalizeSkinId(skin);
    const urls = [];
    const folders = [NORMAL_FOLDER, CRIT_FOLDER];
    folders.forEach((folder) => {
      DIGITS.forEach((d) => urls.push(glyphUrl(id, folder, d)));
      urls.push(glyphUrl(id, folder, UNIT_WAN));
      urls.push(glyphUrl(id, folder, UNIT_YI));
      if (folder === CRIT_FOLDER) urls.push(glyphUrl(id, folder, CRIT_ICON));
    });
    if (id === MOB_SKIN_ID) {
      Object.keys(STATUS_GLYPHS).forEach((kind) => {
        const url = statusGlyphUrl(id, kind);
        if (url) urls.push(url);
      });
    }
    return urls;
  }

  /** softTrim 時保留目前玩家／怪物傷害字圖，避免暴擊字體被踢掉後一直 fallback 成普通字 */
  function pinnedUrls() {
    return [
      ...collectSkinUrls(playerSkinId),
      ...collectSkinUrls(MOB_SKIN_ID),
    ];
  }

  function preloadOne(url) {
    if (typeof EnchantImagePreload !== 'undefined') {
      return EnchantImagePreload.preload(url);
    }
    return new Promise((resolve) => {
      const img = new Image();
      img.decoding = 'async';
      const done = () => resolve(img);
      img.onload = () => {
        if (typeof img.decode === 'function') {
          img.decode().then(done).catch(done);
        } else {
          done();
        }
      };
      img.onerror = () => resolve(null);
      img.src = url;
    });
  }

  function skinImagesMissing(skin, entry) {
    if (typeof EnchantImagePreload === 'undefined' || !EnchantImagePreload.getImage) return false;
    const id = normalizeSkinId(skin);
    const folders = [NORMAL_FOLDER];
    if (entry?.widths?.has(`${CRIT_FOLDER}/0`)) folders.push(CRIT_FOLDER);
    return folders.some((folder) => {
      const url = glyphUrl(id, folder, 0);
      const img = EnchantImagePreload.getImage(url);
      return !(img && img.complete && img.naturalWidth > 0);
    });
  }

  async function ensurePreloaded(targetSkinId, opts = {}) {
    const id = normalizeSkinId(targetSkinId);
    const cached = skinCache.get(id);
    if (cached?.ready && !opts.force) {
      // 記憶體軟修剪可能踢掉共享圖：目錄仍 ready，需補載
      if (!skinImagesMissing(id, cached)) return cached;
      preloadJobs.delete(id);
    } else if (cached?.ready && opts.force) {
      preloadJobs.delete(id);
      skinCache.delete(id);
    }

    let job = preloadJobs.get(id);
    if (!job) {
      job = (async () => {
        const widths = new Map();
        const units = new Set();
        const urls = collectSkinUrls(id);

        await Promise.all(urls.map((url) => preloadOne(url)));

        for (const folder of [NORMAL_FOLDER, CRIT_FOLDER]) {
          for (const index of [...DIGITS, UNIT_WAN, UNIT_YI, CRIT_ICON]) {
            const url = glyphUrl(id, folder, index);
            const img = typeof EnchantImagePreload !== 'undefined'
              ? EnchantImagePreload.getImage(url)
              : null;
            if (img && img.naturalWidth > 0) {
              widths.set(`${folder}/${index}`, img.naturalWidth);
              if (index === UNIT_WAN || index === UNIT_YI) units.add(index);
            }
          }
        }
        if (id === MOB_SKIN_ID) {
          Object.keys(STATUS_GLYPHS).forEach((kind) => {
            const name = statusGlyphName(kind);
            const url = statusGlyphUrl(id, kind);
            if (!url) return;
            const img = typeof EnchantImagePreload !== 'undefined'
              ? EnchantImagePreload.getImage(url)
              : null;
            if (img && img.naturalWidth > 0) {
              widths.set(`${NORMAL_FOLDER}/${name}`, img.naturalWidth);
            }
          });
        }

        const entry = { widths, units, ready: true };
        skinCache.set(id, entry);
        return entry;
      })();
      preloadJobs.set(id, job);
    }

    return job;
  }

  function folderFor(isCritical, skin) {
    if (!isCritical) return NORMAL_FOLDER;
    const id = normalizeSkinId(skin);
    const entry = skinCache.get(id);
    // 以預載目錄為準，勿依賴可能被 softTrim 踢掉的 getImage
    if (entry?.widths?.has(`${CRIT_FOLDER}/0`)) return CRIT_FOLDER;
    if (getImage(id, CRIT_FOLDER, 0)) return CRIT_FOLDER;
    return CRIT_FOLDER;
  }

  function buildGlyphs(skin, damageValue, isCritical) {
    const skinId = normalizeSkinId(skin);
    const entry = skinCache.get(skinId);
    const critFolder = CRIT_FOLDER;
    const normalFolder = NORMAL_FOLDER;
    const hasCritGlyph = !!(entry?.widths?.has(`${CRIT_FOLDER}/0`) || getImage(skinId, critFolder, 0));
    const folder = isCritical && hasCritGlyph ? critFolder : normalFolder;
    const n = Math.max(0, Math.floor(Number(damageValue) || 0));
    const glyphs = [];

    if (isCritical && (entry?.widths?.has(`${CRIT_FOLDER}/${CRIT_ICON}`) || getImage(skinId, critFolder, CRIT_ICON))) {
      glyphs.push({ folder: critFolder, index: CRIT_ICON });
    }

    const useYi = hasUnit(skinId, UNIT_YI) && n >= 100000000;
    const yi = Math.floor(n / 100000000);
    const wan = Math.floor((n % 100000000) / 10000);
    const rem = Math.floor(n % 10000);
    const useWan = hasUnit(skinId, UNIT_WAN) && (useYi || wan > 0);

    const pushDigits = (text, f) => {
      String(text).split('').forEach((ch) => {
        glyphs.push({ folder: f, index: Number(ch) });
      });
    };

    if (useYi) {
      pushDigits(yi, folder);
      glyphs.push({ folder, index: UNIT_YI });
      pushDigits(String(wan).padStart(4, '0'), folder);
      if (useWan) glyphs.push({ folder, index: UNIT_WAN });
      pushDigits(String(rem).padStart(4, '0'), folder);
    } else if (useWan) {
      pushDigits(wan, folder);
      glyphs.push({ folder, index: UNIT_WAN });
      pushDigits(String(rem).padStart(4, '0'), folder);
    } else {
      pushDigits(n, folder);
    }

    return glyphs;
  }

  function glyphWidth(skin, folder, index, fallback = 18) {
    const entry = skinCache.get(normalizeSkinId(skin));
    const w = entry?.widths?.get(`${folder}/${index}`);
    return Number.isFinite(w) && w > 0 ? w : fallback;
  }

  function hasUnit(skin, index) {
    const entry = skinCache.get(normalizeSkinId(skin));
    if (!entry?.ready) return false;
    return entry.units.has(index);
  }

  function getImage(skin, folder, index) {
    const url = glyphUrl(skin, folder, index);
    if (typeof EnchantImagePreload !== 'undefined') {
      return EnchantImagePreload.getImage(url);
    }
    return null;
  }

  function getStatusImage(skin, kind) {
    const url = statusGlyphUrl(skin, kind);
    if (!url) return null;
    if (typeof EnchantImagePreload !== 'undefined') {
      return EnchantImagePreload.getImage(url);
    }
    return null;
  }

  function totalWidth(skin, glyphs, overlap = 4) {
    if (!glyphs.length) return 0;
    let w = 0;
    glyphs.forEach((g, i) => {
      w += glyphWidth(skin, g.folder, g.index);
      if (i > 0) w -= overlap;
    });
    return Math.max(0, w);
  }

  function warmUpAll() {
    loadPlayerSkinId();
    return Promise.all([
      ensurePreloaded(playerSkinId),
      ensurePreloaded(MOB_SKIN_ID),
    ]);
  }

  loadPlayerSkinId();

  return {
    DEFAULT_SKIN_ID,
    MOB_SKIN_ID,
    playerSkin,
    setPlayerSkinId,
    loadPlayerSkinId,
    ensurePreloaded,
    warmUpAll,
    glyphUrl,
    statusGlyphUrl,
    statusGlyphName,
    buildGlyphs,
    totalWidth,
    glyphWidth,
    getImage,
    getStatusImage,
    pinnedUrls,
    GLYPH_OVERLAP: 4,
    // 相容舊 API
    currentSkinId: playerSkin,
    setSkinId: setPlayerSkinId,
    loadSkinId: loadPlayerSkinId,
  };
})();

if (typeof window !== 'undefined') {
  window.DamageSkinCatalog = DamageSkinCatalog;
}
