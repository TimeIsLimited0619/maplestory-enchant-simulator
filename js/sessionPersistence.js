/**
 * 工作階段持久化（localStorage）＋存檔匯出／匯入
 * 自動存檔與匯出使用相同內容：背包、強化進度、成本統計、方塊／星力卷持有等
 */
const SESSION_PERSISTENCE_KEY = 'mss-session-v1';
const MSS_LOCAL_SAVE_KEY = 'mss-save-local-v1';
const SESSION_PERSISTENCE_VERSION = 1;
const MSS_SAVE_FORMAT = 'mss-save';
const MSS_SAVE_FILE_VERSION = 1;
const MSS_BACKUP_DB_NAME = 'mss-file-backup-v1';
const MSS_BACKUP_STORE = 'handles';
const MSS_BACKUP_META_KEY = 'mss-file-backup-meta-v1';
const MSS_BACKUP_REMIND_KEY = 'mss-file-backup-remind-v1';
const MSS_BACKUP_WRITE_MIN_MS = 30000;
/** 匯出／本機備份檔加密包裝（localStorage 仍為明文） */
const MSS_FILE_ENC_FORMAT = 'mss-save-enc';
const MSS_FILE_ENC_VERSION = 1;
/** 前端混淆用；無法真正防破解，只擋隨手改檔 */
const MSS_FILE_ENC_SECRET = 'mss-file-obf-v1|maplestory-enchant-simulator|tw-zh';

const SessionPersistenceModule = {
  loadedFromStorage: false,
  equippedSlotIndex: null,
  saveTimer: null,
  _deferredPayload: null,
  activeProfile: 'sim',
  _needIdleStarter: false,
  /** 放置重置／首次進入時發放新手裝備；可填已 import:wz 的武器／防具／飾品 ID */
  IDLE_STARTER_ITEM_IDS: ['01302000', '01060138', '01040002'],
  get IDLE_STARTER_WEAPON_ID() {
    return this.IDLE_STARTER_ITEM_IDS[0] || '01242000';
  },

  profileFromStorage() {
    try {
      return localStorage.getItem('app.mode.v1') === 'idle' ? 'idle' : 'sim';
    } catch (_) {
      return 'sim';
    }
  },

  keysFor(profile) {
    const suffix = profile === 'idle' ? '.idle' : '';
    return {
      full: MSS_LOCAL_SAVE_KEY + suffix,
      session: SESSION_PERSISTENCE_KEY + suffix,
    };
  },

  hasSavedSession() {
    return this.loadedFromStorage;
  },

  scheduleSave() {
    if (this.saveTimer) clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => {
      this.saveTimer = null;
      this.saveToStorage();
    }, 400);
  },

  syncCurrentEnchantToInventory() {
    if (typeof currentEnchantItem === 'undefined' || !currentEnchantItem) return;

    if (typeof syncEnchantStateFromModules === 'function') {
      syncEnchantStateFromModules(currentEnchantItem);
    }

    // 已移出背包時，進度只存在 currentEnchantItem → equippedItem 快照
    if (!Number.isInteger(currentEnchantItem.slotIndex) || currentEnchantItem.slotIndex < 0) {
      return;
    }

    const itemId = this.resolveItemId(currentEnchantItem)
      || playerInventoryEquip[currentEnchantItem.slotIndex];
    const snapshot = this.stampState(currentEnchantItem, itemId);
    if (snapshot) playerInventoryState[currentEnchantItem.slotIndex] = snapshot;
  },

  collectSnapshot() {
    this.syncCurrentEnchantToInventory();

    let equippedItem = null;
    if (typeof currentEnchantItem !== 'undefined' && currentEnchantItem) {
      const itemId = this.resolveItemId(currentEnchantItem);
      const state = this.stampState(currentEnchantItem, itemId);
      if (itemId && state) {
        equippedItem = { itemId, state };
      }
    }

    const snap = {
      version: SESSION_PERSISTENCE_VERSION,
      inventoryEquip: playerInventoryEquip.slice(),
      inventoryConsume: playerInventoryConsume.slice(),
      inventoryEtc: (typeof playerInventoryEtc !== 'undefined' ? playerInventoryEtc.slice() : []),
      inventoryState: playerInventoryState.slice(),
      // 新格式：強化槽實體；舊 equippedSlotIndex 保留相容（通常為 -1 / null）
      equippedItem,
      equippedSlotIndex: null,
    };

    if (typeof TrunkData !== 'undefined' && typeof TrunkData.exportSnapshot === 'function') {
      Object.assign(snap, TrunkData.exportSnapshot());
    }

    if (typeof UiEquipModule !== 'undefined' && typeof UiEquipModule.exportState === 'function') {
      Object.assign(snap, UiEquipModule.exportState());
    }

    return snap;
  },

  buildExportPayload() {
    const payload = {
      format: MSS_SAVE_FORMAT,
      version: MSS_SAVE_FILE_VERSION,
      exportedAt: new Date().toISOString(),
      session: this.collectSnapshot()
    };

    if (typeof CostTrackerModule !== 'undefined' && typeof CostTrackerModule.getSavePayload === 'function') {
      payload.costTracker = CostTrackerModule.getSavePayload();
    }
    if (typeof playerCubeCounts !== 'undefined') {
      payload.playerCubeCounts = { ...playerCubeCounts };
    }
    if (typeof playerAddPotCubeCounts !== 'undefined') {
      payload.playerAddPotCubeCounts = { ...playerAddPotCubeCounts };
    }
    if (typeof playerStarForceScrollInventory !== 'undefined') {
      payload.playerStarForceScrollInventory = { ...playerStarForceScrollInventory };
    }
    if (typeof playerPotentialScrollInventory !== 'undefined') {
      payload.playerPotentialScrollInventory = { ...playerPotentialScrollInventory };
    }
    if (typeof playerHammerInventory !== 'undefined') {
      payload.playerHammerInventory = { ...playerHammerInventory };
    }
    if (typeof playerGloryScrollInventory !== 'undefined') {
      payload.playerGloryScrollInventory = { ...playerGloryScrollInventory };
    }
    if (typeof playerRecoveryCardCount !== 'undefined') {
      payload.playerRecoveryCardCount = Math.max(0, Math.floor(Number(playerRecoveryCardCount) || 0));
    }
    if (typeof playerPotionCounts !== 'undefined') {
      payload.playerPotionCounts = { ...playerPotionCounts };
    }
    if (typeof playerThrowingStarCounts !== 'undefined') {
      payload.playerThrowingStarCounts = { ...playerThrowingStarCounts };
    }
    if (typeof playerBonusStatItemCounts !== 'undefined') {
      payload.playerBonusStatItemCounts = { ...playerBonusStatItemCounts };
    }
    if (typeof playerExceptionalHammerCounts !== 'undefined') {
      payload.playerExceptionalHammerCounts = { ...playerExceptionalHammerCounts };
    }
    if (typeof playerSoulMaterialCounts !== 'undefined') {
      payload.playerSoulMaterialCounts = { ...playerSoulMaterialCounts };
    }
    if (typeof UiNpcShop !== 'undefined' && typeof UiNpcShop.exportRepurchase === 'function') {
      payload.npcShopRepurchase = UiNpcShop.exportRepurchase();
    }

    if (typeof CharacterProgression !== 'undefined'
      && typeof CharacterProgression.getSavePayload === 'function') {
      payload.characterProgression = CharacterProgression.getSavePayload();
    }
    if (typeof CharacterSkills !== 'undefined'
      && typeof CharacterSkills.getSavePayload === 'function') {
      payload.characterSkills = CharacterSkills.getSavePayload();
    }
    if (typeof IdleHunt !== 'undefined'
      && typeof IdleHunt.getSavePayload === 'function') {
      payload.idleHunt = IdleHunt.getSavePayload();
    }

    return payload;
  },

  saveToStorage() {
    try {
      const payload = this.buildExportPayload();
      if (this.activeProfile === 'idle') {
        delete payload.costTracker;
      }
      const keys = this.keysFor(this.activeProfile);
      localStorage.setItem(keys.full, JSON.stringify(payload));
      localStorage.setItem(keys.session, JSON.stringify(payload.session));
      this.scheduleFileBackupWrite();
    } catch (err) {
      console.warn('[SessionPersistence] 儲存失敗:', err);
    }
  },

  // —— 本機檔案備份（File System Access API）——

  supportsFileSystemBackup() {
    return typeof window !== 'undefined'
      && typeof window.showSaveFilePicker === 'function'
      && typeof window.showOpenFilePicker === 'function'
      && typeof indexedDB !== 'undefined';
  },

  openBackupDb() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(MSS_BACKUP_DB_NAME, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(MSS_BACKUP_STORE)) {
          db.createObjectStore(MSS_BACKUP_STORE, { keyPath: 'profile' });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error || new Error('IndexedDB open failed'));
    });
  },

  async idbGetBackupRecord(profile) {
    const key = profile === 'idle' ? 'idle' : 'sim';
    const db = await this.openBackupDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(MSS_BACKUP_STORE, 'readonly');
      const req = tx.objectStore(MSS_BACKUP_STORE).get(key);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  },

  async idbPutBackupRecord(record) {
    const db = await this.openBackupDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(MSS_BACKUP_STORE, 'readwrite');
      tx.objectStore(MSS_BACKUP_STORE).put(record);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  },

  async idbDeleteBackupRecord(profile) {
    const key = profile === 'idle' ? 'idle' : 'sim';
    const db = await this.openBackupDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(MSS_BACKUP_STORE, 'readwrite');
      tx.objectStore(MSS_BACKUP_STORE).delete(key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  },

  backupMetaKey(profile) {
    const suffix = profile === 'idle' ? '.idle' : '';
    return `${MSS_BACKUP_META_KEY}${suffix}`;
  },

  readBackupMeta(profile = this.activeProfile) {
    try {
      const raw = localStorage.getItem(this.backupMetaKey(profile));
      if (!raw) return { fileName: '', lastWriteAt: 0, bound: false };
      const data = JSON.parse(raw);
      return {
        fileName: String(data?.fileName || ''),
        lastWriteAt: Number(data?.lastWriteAt) || 0,
        bound: Boolean(data?.bound),
      };
    } catch (_) {
      return { fileName: '', lastWriteAt: 0, bound: false };
    }
  },

  writeBackupMeta(profile, patch) {
    const prev = this.readBackupMeta(profile);
    const next = { ...prev, ...patch };
    try {
      localStorage.setItem(this.backupMetaKey(profile), JSON.stringify(next));
    } catch (_) { /* ignore quota */ }
    return next;
  },

  defaultBackupFileName(profile = this.activeProfile) {
    return profile === 'idle' ? 'mss-save-idle.mss' : 'mss-save-sim.mss';
  },

  fileSavePickerTypes() {
    return [{
      description: 'MapleStory Simulator Save',
      accept: {
        'application/json': ['.mss', '.json'],
        'application/octet-stream': ['.mss'],
      },
    }];
  },

  bytesToBase64(bytes) {
    const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
    let binary = '';
    const chunk = 0x8000;
    for (let i = 0; i < arr.length; i += chunk) {
      binary += String.fromCharCode.apply(null, arr.subarray(i, i + chunk));
    }
    return btoa(binary);
  },

  base64ToBytes(b64) {
    const binary = atob(String(b64 || ''));
    const out = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
    return out;
  },

  async getFileEncryptionKey() {
    if (!globalThis.crypto?.subtle) {
      throw new Error('此環境不支援 Web Crypto');
    }
    const material = await crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(MSS_FILE_ENC_SECRET),
    );
    return crypto.subtle.importKey('raw', material, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
  },

  async encryptPayloadForFile(payload) {
    const key = await this.getFileEncryptionKey();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const plain = new TextEncoder().encode(JSON.stringify(payload));
    const cipherBuf = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plain);
    return {
      format: MSS_FILE_ENC_FORMAT,
      version: MSS_FILE_ENC_VERSION,
      alg: 'AES-GCM',
      iv: this.bytesToBase64(iv),
      data: this.bytesToBase64(cipherBuf),
    };
  },

  async decryptPayloadFromFile(wrapped) {
    if (!wrapped || wrapped.format !== MSS_FILE_ENC_FORMAT) {
      throw new Error('不是加密存檔格式');
    }
    if (Number(wrapped.version) !== MSS_FILE_ENC_VERSION) {
      throw new Error('加密存檔版本不相容');
    }
    if (wrapped.alg && wrapped.alg !== 'AES-GCM') {
      throw new Error('不支援的加密演算法');
    }
    const key = await this.getFileEncryptionKey();
    const iv = this.base64ToBytes(wrapped.iv);
    const data = this.base64ToBytes(wrapped.data);
    let plainBuf;
    try {
      plainBuf = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data);
    } catch (_) {
      throw new Error('存檔解密失敗（檔案可能被竄改）');
    }
    const text = new TextDecoder().decode(plainBuf);
    const payload = JSON.parse(text);
    if (!payload || payload.format !== MSS_SAVE_FORMAT) {
      throw new Error('解密後不是有效存檔');
    }
    return payload;
  },

  async serializePayloadForFile(payload) {
    const forFile = this.stripFileExportRestricted(payload);
    if (globalThis.crypto?.subtle) {
      const wrapped = await this.encryptPayloadForFile(forFile);
      return `${JSON.stringify(wrapped)}\n`;
    }
    // 非安全內容（如 http）無法用 SubtleCrypto → 退回明文
    console.warn('[SessionPersistence] Web Crypto 不可用，檔案改存明文');
    return `${JSON.stringify(forFile, null, 2)}\n`;
  },

  isPotionConsumeEntry(entry) {
    if (!entry || typeof entry !== 'object') return false;
    const T = typeof CONSUME_ITEM_TYPE !== 'undefined' ? CONSUME_ITEM_TYPE : {};
    const potionType = T.POTION || 'potion';
    if (entry.type === potionType || entry.type === 'potion') return true;
    if (entry.kind === 'consume' && (entry.type === potionType || entry.type === 'potion')) return true;
    return false;
  },

  /**
   * 匯出／本機備份檔專用：不含楓幣、不含消耗欄藥水以外物品。
   * localStorage 主存仍用完整 buildExportPayload。
   */
  stripFileExportRestricted(payload) {
    if (!payload || typeof payload !== 'object') return payload;
    let clone;
    try {
      clone = JSON.parse(JSON.stringify(payload));
    } catch (_) {
      return payload;
    }

    // 楓幣：放置持有、倉庫
    if (clone.idleHunt && typeof clone.idleHunt === 'object') {
      delete clone.idleHunt.gold;
    }
    if (clone.session && typeof clone.session === 'object') {
      delete clone.session.trunkMeso;
      if (Array.isArray(clone.session.inventoryConsume)) {
        clone.session.inventoryConsume = clone.session.inventoryConsume.map((entry) => (
          this.isPotionConsumeEntry(entry) ? entry : null
        ));
      }
      // 倉庫內非藥水消耗也不帶走
      if (Array.isArray(clone.session.trunkSlots)) {
        clone.session.trunkSlots = clone.session.trunkSlots.map((entry) => {
          if (!entry || entry.kind !== 'consume') return entry;
          return this.isPotionConsumeEntry(entry) ? entry : null;
        });
      }
    }

    // 消耗數量表：只留藥水
    clone.playerCubeCounts = {};
    clone.playerAddPotCubeCounts = {};
    clone.playerStarForceScrollInventory = {};
    clone.playerPotentialScrollInventory = {};
    clone.playerHammerInventory = {};
    clone.playerGloryScrollInventory = {};
    clone.playerRecoveryCardCount = 0;
    clone.playerThrowingStarCounts = {};
    clone.playerBonusStatItemCounts = {};
    clone.playerExceptionalHammerCounts = {};
    clone.playerSoulMaterialCounts = {};
    // playerPotionCounts 保留

    if (Array.isArray(clone.npcShopRepurchase)) {
      clone.npcShopRepurchase = clone.npcShopRepurchase.filter((entry) => {
        if (!entry) return false;
        if (entry.kind === 'equip' || entry.kind === 'etc') return true;
        if (entry.kind === 'potion' || this.isPotionConsumeEntry(entry)) return true;
        if (entry.kind === 'consume'
          || entry.kind === 'throwing_star'
          || entry.kind === 'glory_scroll') {
          return false;
        }
        if (entry.type) {
          const T = typeof CONSUME_ITEM_TYPE !== 'undefined' ? CONSUME_ITEM_TYPE : {};
          if (entry.type === (T.POTION || 'potion')) return true;
          if (Object.values(T).includes(entry.type)) return false;
        }
        return true;
      });
    }

    clone.fileExportStripped = {
      meso: true,
      nonPotionConsume: true,
    };
    return clone;
  },

  async parseSaveFileText(text) {
    let parsed;
    try {
      parsed = JSON.parse(String(text || ''));
    } catch (_) {
      throw new Error('無法解析存檔檔案');
    }
    if (parsed?.format === MSS_SAVE_FORMAT) {
      return parsed;
    }
    if (parsed?.format === MSS_FILE_ENC_FORMAT) {
      return this.decryptPayloadFromFile(parsed);
    }
    throw new Error('無效的存檔格式');
  },

  async ensureBackupPermission(handle, mode = 'readwrite') {
    if (!handle || typeof handle.queryPermission !== 'function') return false;
    let state = await handle.queryPermission({ mode });
    if (state === 'granted') return true;
    if (typeof handle.requestPermission === 'function') {
      state = await handle.requestPermission({ mode });
    }
    return state === 'granted';
  },

  async getBackupStatus(profile = this.activeProfile) {
    const meta = this.readBackupMeta(profile);
    const supports = this.supportsFileSystemBackup();
    let hasHandle = false;
    if (supports) {
      try {
        const rec = await this.idbGetBackupRecord(profile);
        hasHandle = Boolean(rec?.handle);
      } catch (_) {
        hasHandle = false;
      }
    }
    return {
      supports,
      bound: Boolean(meta.bound || hasHandle),
      hasHandle,
      fileName: meta.fileName || (hasHandle ? this.defaultBackupFileName(profile) : ''),
      lastWriteAt: meta.lastWriteAt || 0,
      profile: profile === 'idle' ? 'idle' : 'sim',
    };
  },

  async bindBackupFile(profile = this.activeProfile) {
    if (!this.supportsFileSystemBackup()) {
      throw new Error('此瀏覽器不支援本機檔案自動備份，請改用「匯出存檔」');
    }
    const key = profile === 'idle' ? 'idle' : 'sim';
    const suggested = this.defaultBackupFileName(key);
    const handle = await window.showSaveFilePicker({
      suggestedName: suggested,
      types: this.fileSavePickerTypes(),
    });
    await this.idbPutBackupRecord({
      profile: key,
      handle,
      fileName: handle.name || suggested,
      lastWriteAt: 0,
    });
    this.writeBackupMeta(key, {
      bound: true,
      fileName: handle.name || suggested,
    });
    await this.writeBackupFileNow({ force: true, profile: key });
    return this.getBackupStatus(key);
  },

  async unbindBackupFile(profile = this.activeProfile) {
    const key = profile === 'idle' ? 'idle' : 'sim';
    try {
      await this.idbDeleteBackupRecord(key);
    } catch (_) { /* ignore */ }
    this.writeBackupMeta(key, { bound: false, fileName: '', lastWriteAt: 0 });
    return this.getBackupStatus(key);
  },

  scheduleFileBackupWrite() {
    if (!this.supportsFileSystemBackup()) return;
    const meta = this.readBackupMeta(this.activeProfile);
    if (!meta.bound) return;
    if (this._backupWriteTimer) clearTimeout(this._backupWriteTimer);
    this._backupWriteTimer = setTimeout(() => {
      this._backupWriteTimer = null;
      this.writeBackupFileNow({ force: false }).catch(() => {});
    }, MSS_BACKUP_WRITE_MIN_MS);
  },

  async flushFileBackup() {
    if (this._backupWriteTimer) {
      clearTimeout(this._backupWriteTimer);
      this._backupWriteTimer = null;
    }
    try {
      await this.writeBackupFileNow({ force: true });
    } catch (_) { /* ignore */ }
  },

  async writeBackupFileNow({ force = false, profile = this.activeProfile } = {}) {
    if (!this.supportsFileSystemBackup()) return false;
    const key = profile === 'idle' ? 'idle' : 'sim';
    const meta = this.readBackupMeta(key);
    if (!meta.bound && !force) return false;

    let rec = null;
    try {
      rec = await this.idbGetBackupRecord(key);
    } catch (err) {
      console.warn('[SessionPersistence] 讀取備份 handle 失敗:', err);
      return false;
    }
    if (!rec?.handle) {
      if (meta.bound) {
        this.writeBackupMeta(key, { bound: false });
      }
      return false;
    }

    const now = Date.now();
    if (!force && this._lastBackupWriteAt?.[key]
      && (now - this._lastBackupWriteAt[key]) < MSS_BACKUP_WRITE_MIN_MS) {
      return false;
    }
    if (this._backupWriting) return false;
    this._backupWriting = true;

    try {
      const ok = await this.ensureBackupPermission(rec.handle, 'readwrite');
      if (!ok) {
        if (typeof addLog === 'function') {
          addLog('[存檔] 本機備份檔權限失效，請至「存檔」重新綁定。', 'log-fail');
        }
        return false;
      }

      // 寫入時若指定非 active profile，仍以目前記憶體為準（僅 active 有完整狀態）
      if (key !== this.activeProfile) {
        return false;
      }

      const payload = this.buildExportPayload();
      if (key === 'idle') delete payload.costTracker;
      const json = await this.serializePayloadForFile(payload);
      const writable = await rec.handle.createWritable();
      await writable.write(json);
      await writable.close();

      if (!this._lastBackupWriteAt) this._lastBackupWriteAt = {};
      this._lastBackupWriteAt[key] = now;
      const fileName = rec.handle.name || rec.fileName || this.defaultBackupFileName(key);
      await this.idbPutBackupRecord({
        profile: key,
        handle: rec.handle,
        fileName,
        lastWriteAt: now,
      });
      this.writeBackupMeta(key, { bound: true, fileName, lastWriteAt: now });
      if (typeof SaveBackupPanel !== 'undefined') SaveBackupPanel.refresh?.();
      return true;
    } catch (err) {
      console.warn('[SessionPersistence] 本機備份寫入失敗:', err);
      return false;
    } finally {
      this._backupWriting = false;
    }
  },

  async importSaveFromFile(file) {
    if (!file) throw new Error('未選擇檔案');
    const text = await file.text();
    const data = await this.parseSaveFileText(text);
    this.importSaveFromObject(data);
    return data;
  },

  async pickAndImportBackupFile() {
    if (typeof window.showOpenFilePicker === 'function') {
      const [handle] = await window.showOpenFilePicker({
        multiple: false,
        types: this.fileSavePickerTypes(),
      });
      const file = await handle.getFile();
      return this.importSaveFromFile(file);
    }
    throw new Error('此瀏覽器請改用「匯入存檔」選擇檔案');
  },

  async loadFromBoundBackupFile(profile = this.activeProfile) {
    if (!this.supportsFileSystemBackup()) {
      throw new Error('此瀏覽器不支援讀取綁定備份檔');
    }
    const key = profile === 'idle' ? 'idle' : 'sim';
    const rec = await this.idbGetBackupRecord(key);
    if (!rec?.handle) throw new Error('尚未綁定本機備份檔');
    const ok = await this.ensureBackupPermission(rec.handle, 'read');
    if (!ok) throw new Error('無法取得備份檔讀取權限');
    const file = await rec.handle.getFile();
    return this.importSaveFromFile(file);
  },

  maybeRemindBindBackup() {
    if (!this.loadedFromStorage) return;
    const key = this.activeProfile === 'idle' ? 'idle' : 'sim';
    const meta = this.readBackupMeta(key);
    if (meta.bound) return;
    const day = new Date().toISOString().slice(0, 10);
    const stampKey = `${MSS_BACKUP_REMIND_KEY}.${key}`;
    try {
      if (localStorage.getItem(stampKey) === day) return;
      localStorage.setItem(stampKey, day);
    } catch (_) {
      return;
    }
    if (typeof addLog === 'function') {
      addLog(
        '[存檔] 建議綁定本機備份檔：點左側「存檔」。清瀏覽器資料時 localStorage 會遺失，本機檔可還原。',
        'log-info'
      );
    }
  },

  readPayloadFor(profile) {
    const keys = this.keysFor(profile);
    try {
      const fullRaw = localStorage.getItem(keys.full);
      if (fullRaw) {
        const data = JSON.parse(fullRaw);
        if (data?.format === MSS_SAVE_FORMAT
          && data.version === MSS_SAVE_FILE_VERSION
          && data.session?.version === SESSION_PERSISTENCE_VERSION) {
          return data;
        }
      }
      const legacyRaw = localStorage.getItem(keys.session);
      if (!legacyRaw) return null;
      const session = JSON.parse(legacyRaw);
      if (!session || session.version !== SESSION_PERSISTENCE_VERSION) return null;
      return { session };
    } catch (_) {
      return null;
    }
  },

  emptySessionSnapshot() {
    const count = typeof INVENTORY_SLOT_COUNT !== 'undefined' ? INVENTORY_SLOT_COUNT : 128;
    const trunkCount = typeof TRUNK_SLOT_COUNT !== 'undefined' ? TRUNK_SLOT_COUNT : count;
    return {
      version: SESSION_PERSISTENCE_VERSION,
      inventoryEquip: new Array(count).fill(null),
      inventoryConsume: new Array(count).fill(null),
      inventoryEtc: new Array(count).fill(null),
      inventoryState: new Array(count).fill(null),
      trunkSlots: new Array(trunkCount).fill(null),
      trunkMeso: 0,
      equippedItem: null,
      equippedSlotIndex: null,
      bodyWearActive: {},
      bodyWearByPreset: { 1: {}, 2: {}, 3: {} },
      activeEquipPreset: 1,
      pendingEquipPreset: 1,
    };
  },

  emptyExtraPayload() {
    return {
      playerCubeCounts: {},
      playerAddPotCubeCounts: {},
      playerStarForceScrollInventory: {},
      playerPotentialScrollInventory: {},
      playerHammerInventory: {},
      playerGloryScrollInventory: {},
      playerRecoveryCardCount: 0,
      playerPotionCounts: {},
      playerThrowingStarCounts: {},
      playerBonusStatItemCounts: {},
      playerExceptionalHammerCounts: {},
      playerSoulMaterialCounts: {},
      npcShopRepurchase: [],
      characterProgression: null,
      characterSkills: null,
      idleHunt: null,
    };
  },

  applyWorld(session, extra) {
    try { this.clearEquipSlotSilent(); } catch (err) {
      console.warn('[SessionPersistence] 清強化槽失敗', err);
    }
    try {
      if (typeof UiEquipModule !== 'undefined') UiEquipModule.clearAllPresets?.();
    } catch (err) {
      console.warn('[SessionPersistence] 清裝備欄失敗', err);
    }
    this.applySessionSnapshot(session || this.emptySessionSnapshot());
    try {
      this.applyExtraPayload({ ...this.emptyExtraPayload(), ...(extra || {}) });
    } catch (err) {
      console.warn('[SessionPersistence] 套用額外存檔失敗', err);
    }
    try { this.refreshWorldUi(); } catch (err) {
      console.warn('[SessionPersistence] 重整介面失敗', err);
    }
    if (this.activeProfile === 'idle') {
      try { this.grantIdleStarterIfNeeded(); } catch (err) {
        console.warn('[SessionPersistence] 發放新手武器失敗', err);
      }
    }
  },

  refreshWorldUi() {
    if (typeof aeCloseAllAutoEnchantOverlays === 'function') {
      aeCloseAllAutoEnchantOverlays();
    }
    if (typeof EquipTooltipModule !== 'undefined') {
      EquipTooltipModule.hide(true);
    }
    if (typeof initInventory === 'function') initInventory();
    if (typeof InventoryModule !== 'undefined') {
      InventoryModule.render?.();
      InventoryModule.updateSlotCount?.();
    }
    if (typeof TrunkModule !== 'undefined') {
      TrunkModule.render?.();
      TrunkModule.updateMesoDisplay?.();
    }
    if (typeof updateStatusPanel === 'function') updateStatusPanel();
    if (typeof updateCategoryTabStates === 'function') updateCategoryTabStates();
    if (typeof syncMainPanelIdleState === 'function') syncMainPanelIdleState();
    if (typeof updateNonePageControls === 'function') updateNonePageControls();
    if (typeof syncInspectModules === 'function') syncInspectModules();
    if (typeof calculateCost === 'function') calculateCost();
    this.restoreUiEquipState();
    this.restoreEquippedItem();
    if (typeof GrowingEquip !== 'undefined') GrowingEquip.sync?.({ log: false });
    if (typeof CharacterCombatPanel !== 'undefined') CharacterCombatPanel.syncToCombatPower?.();
    if (typeof UiCharacterInfo !== 'undefined') UiCharacterInfo.refresh?.();
    if (typeof UiHyperStat !== 'undefined') UiHyperStat.refresh?.();
    if (typeof UiApDistribution !== 'undefined') UiApDistribution.refresh?.();
    if (typeof IdleHunt !== 'undefined') IdleHunt.refreshDisplay?.();
  },

  findItemBagIndex(itemId) {
    if (!itemId || typeof playerInventoryEquip === 'undefined') return -1;
    for (let i = 0; i < playerInventoryEquip.length; i++) {
      if (playerInventoryEquip[i] === itemId) return i;
    }
    return -1;
  },

  findIdleWeaponBagIndex() {
    if (typeof playerInventoryEquip === 'undefined' || typeof ITEM_DATABASE === 'undefined') return -1;
    const starter = this.findItemBagIndex(this.IDLE_STARTER_WEAPON_ID);
    if (starter >= 0) return starter;
    for (let i = 0; i < playerInventoryEquip.length; i++) {
      const id = playerInventoryEquip[i];
      if (!id) continue;
      const item = ITEM_DATABASE[id];
      if (item?.mainType === 'WEAPON' || item?.islot === 'Wp' || item?.islot === 'Gw' || item?.islot === 'Wpsi') {
        return i;
      }
    }
    return -1;
  },

  starterItemIds() {
    const ids = Array.isArray(this.IDLE_STARTER_ITEM_IDS) ? this.IDLE_STARTER_ITEM_IDS : [];
    const seen = new Set();
    return ids.map((id) => String(id || '').trim()).filter((id) => {
      if (!id || seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  },

  ensureStarterInDatabase(itemId) {
    const id = itemId || this.IDLE_STARTER_WEAPON_ID;
    if (typeof GeneratedEquipLoader !== 'undefined') GeneratedEquipLoader.register?.();
    if (typeof ITEM_DATABASE !== 'undefined' && ITEM_DATABASE[id]) return id;
    if (typeof buildEquipFromWzInfo !== 'function') {
      return ITEM_DATABASE?.[id] ? id : null;
    }
    const fromWz = (typeof WZ_IMPORTED_EQUIP_RECORDS !== 'undefined' && Array.isArray(WZ_IMPORTED_EQUIP_RECORDS))
      ? WZ_IMPORTED_EQUIP_RECORDS.find((entry) => entry?.id === id)
      : null;
    const fromDoll = (typeof PAPERDOLL_EQUIP_RECORDS !== 'undefined' && Array.isArray(PAPERDOLL_EQUIP_RECORDS))
      ? PAPERDOLL_EQUIP_RECORDS.find((entry) => entry?.id === id)
      : null;
    const fromGen = (typeof GENERATED_EQUIP_RECORDS !== 'undefined' && Array.isArray(GENERATED_EQUIP_RECORDS))
      ? GENERATED_EQUIP_RECORDS.find((entry) => entry?.id === id)
      : null;
    const row = fromWz || fromDoll || fromGen;
    if (!row) return ITEM_DATABASE?.[id] ? id : null;
    ITEM_DATABASE[id] = buildEquipFromWzInfo(row.id, row.name || row.id, row.info || {});
    return id;
  },

  grantOneIdleStarter(starterId, { forceWear, weaponFallback }) {
    const id = this.ensureStarterInDatabase(starterId);
    if (!id || typeof ITEM_DATABASE === 'undefined' || !ITEM_DATABASE[id]) return false;
    let bagIndex = this.findItemBagIndex(id);
    if (bagIndex < 0 && weaponFallback) bagIndex = this.findIdleWeaponBagIndex();
    if (bagIndex < 0) {
      if (typeof InventoryModule === 'undefined' || typeof InventoryModule.addEquipFromCatalog !== 'function') {
        return false;
      }
      InventoryModule.addEquipFromCatalog(id, 0, { silent: true, switchTab: false });
      bagIndex = this.findItemBagIndex(id);
    }
    if (bagIndex < 0) return false;
    if (typeof UiEquipModule === 'undefined') return true;
    const item = ITEM_DATABASE[id];
    const isWeapon = item?.islot === 'Wp' || item?.islot === 'Gw' || item?.mainType === EQUIP_TYPE.WEAPON;
    const slotHint = isWeapon ? '11' : null;
    const alreadyOn = slotHint
      ? UiEquipModule.getWornEntry?.(slotHint)
      : null;
    if (alreadyOn && alreadyOn.itemId === id) return true;
    if (forceWear || !alreadyOn) {
      UiEquipModule.wearFromBag(playerInventoryEquip[bagIndex], bagIndex, slotHint);
    }
    return true;
  },

  grantIdleStarterIfNeeded() {
    if (this.activeProfile !== 'idle') return false;
    if (typeof CharacterSkills !== 'undefined') {
      if (CharacterSkills.needsJobLinePick?.()) return false;
      if (typeof CharacterSkills.needsIdleStarterGrant === 'function'
        && !CharacterSkills.needsIdleStarterGrant()) {
        return false;
      }
    }
    const ids = this.starterItemIds();
    if (!ids.length) return false;
    if (typeof UiEquipModule !== 'undefined' && this._needIdleStarter) {
      ids.forEach((starterId) => {
        const item = ITEM_DATABASE?.[starterId];
        const isWeapon = item?.islot === 'Wp' || item?.islot === 'Gw' || item?.mainType === EQUIP_TYPE.WEAPON;
        if (isWeapon) UiEquipModule.unequipSlot?.('11', { silent: true });
      });
      UiEquipModule.unequipSlot?.('11', { silent: true });
    }
    let granted = false;
    ids.forEach((starterId, index) => {
      if (this.grantOneIdleStarter(starterId, {
        forceWear: this._needIdleStarter,
        weaponFallback: index === 0 && !this._needIdleStarter,
      })) granted = true;
    });
    if (!granted) return false;
    InventoryModule.render?.();
    UiEquipModule.refresh?.();
    if (typeof CharacterCombatPanel !== 'undefined') {
      CharacterCombatPanel.syncFromEquippedWeapon?.();
      CharacterCombatPanel.syncToCombatPower?.();
    }
    if (typeof UiCharacterInfo !== 'undefined') UiCharacterInfo.refresh?.();
    if (typeof CharacterSkills !== 'undefined') {
      CharacterSkills.markIdleStarterGranted?.();
    }
    this._needIdleStarter = false;
    this.saveToStorage();
    return true;
  },

  switchProfile(next, fromHint) {
    const want = next === 'idle' ? 'idle' : 'sim';
    const from = (fromHint === 'idle' || fromHint === 'sim')
      ? fromHint
      : (this.activeProfile === 'idle' ? 'idle' : 'sim');
    this.activeProfile = from;
    this.saveToStorage();
    this.activeProfile = want;
    const data = this.readPayloadFor(want);
    this._needIdleStarter = want === 'idle' && !data?.session;
    this.applyWorld(
      data?.session || this.emptySessionSnapshot(),
      { ...this.emptyExtraPayload(), ...(data || {}) },
    );
    this._deferredPayload = null;
    this.loadedFromStorage = true;
  },

  resetIdleWorld() {
    const inIdle = this.activeProfile === 'idle'
      || (typeof AppMode !== 'undefined' && AppMode.isIdle?.());
    if (!inIdle) return false;
    this.activeProfile = 'idle';
    this._needIdleStarter = true;
    this.applyWorld(this.emptySessionSnapshot(), this.emptyExtraPayload());
    this.saveToStorage();
    return true;
  },

  loadFromStorage() {
    this.activeProfile = this.profileFromStorage();
    try {
      const data = this.readPayloadFor(this.activeProfile);
      if (data?.session) {
        this.applySessionSnapshot(data.session);
        this._deferredPayload = data.format ? data : null;
        this.loadedFromStorage = true;
        return true;
      }
      if (this.activeProfile === 'idle') {
        this._needIdleStarter = true;
        this.applySessionSnapshot(this.emptySessionSnapshot());
        this._deferredPayload = this.emptyExtraPayload();
        this.loadedFromStorage = true;
        return true;
      }
      return false;
    } catch (err) {
      console.warn('[SessionPersistence] 讀取失敗:', err);
      return false;
    }
  },

  /** DOM ready、CostTracker 等模組就緒後套用延遲欄位 */
  applyDeferredSavePayload() {
    const data = this._deferredPayload;
    this._deferredPayload = null;
    if (!data) return;
    this.applyExtraPayload(data);
    this.grantIdleStarterIfNeeded();
    if (typeof GrowingEquip !== 'undefined') GrowingEquip.sync?.({ log: true });
  },

  applyExtraPayload(data) {
    if (!data || typeof data !== 'object') return;
    if (typeof InventoryModule !== 'undefined') {
      InventoryModule._consumeCountsReady = false;
    }

    const resetMap = (target) => {
      if (typeof target === 'undefined') return;
      Object.keys(target).forEach((key) => { delete target[key]; });
    };
    resetMap(typeof playerCubeCounts !== 'undefined' ? playerCubeCounts : undefined);
    resetMap(typeof playerAddPotCubeCounts !== 'undefined' ? playerAddPotCubeCounts : undefined);
    resetMap(typeof playerStarForceScrollInventory !== 'undefined' ? playerStarForceScrollInventory : undefined);
    resetMap(typeof playerPotentialScrollInventory !== 'undefined' ? playerPotentialScrollInventory : undefined);
    resetMap(typeof playerHammerInventory !== 'undefined' ? playerHammerInventory : undefined);
    resetMap(typeof playerGloryScrollInventory !== 'undefined' ? playerGloryScrollInventory : undefined);
    resetMap(typeof playerBonusStatItemCounts !== 'undefined' ? playerBonusStatItemCounts : undefined);
    resetMap(typeof playerExceptionalHammerCounts !== 'undefined' ? playerExceptionalHammerCounts : undefined);
    resetMap(typeof playerSoulMaterialCounts !== 'undefined' ? playerSoulMaterialCounts : undefined);

    if (data.costTracker && typeof CostTrackerModule !== 'undefined'
      && typeof CostTrackerModule.applySavePayload === 'function') {
      CostTrackerModule.applySavePayload(data.costTracker);
    }

    if (data.playerCubeCounts && typeof playerCubeCounts !== 'undefined') {
      Object.assign(playerCubeCounts, data.playerCubeCounts);
    }

    if (data.playerAddPotCubeCounts && typeof playerAddPotCubeCounts !== 'undefined') {
      Object.keys(playerAddPotCubeCounts).forEach((key) => {
        delete playerAddPotCubeCounts[key];
      });
      Object.assign(playerAddPotCubeCounts, data.playerAddPotCubeCounts);
    }

    if (data.playerStarForceScrollInventory && typeof playerStarForceScrollInventory !== 'undefined') {
      Object.keys(playerStarForceScrollInventory).forEach((key) => {
        delete playerStarForceScrollInventory[key];
      });
      Object.assign(playerStarForceScrollInventory, data.playerStarForceScrollInventory);
    }

    if (data.playerPotentialScrollInventory && typeof playerPotentialScrollInventory !== 'undefined') {
      Object.keys(playerPotentialScrollInventory).forEach((key) => {
        delete playerPotentialScrollInventory[key];
      });
      Object.assign(playerPotentialScrollInventory, data.playerPotentialScrollInventory);
      if (this.activeProfile !== 'idle' && typeof ensurePotentialScrollCounts === 'function') {
        ensurePotentialScrollCounts();
      }
    } else if (this.activeProfile !== 'idle' && typeof ensurePotentialScrollCounts === 'function') {
      ensurePotentialScrollCounts();
    }
    if (typeof ensurePotentialScrollConsumeInventory === 'function') {
      ensurePotentialScrollConsumeInventory();
    }

    const assignCountMap = (target, src) => {
      if (!src || typeof target === 'undefined') return;
      Object.keys(target).forEach((key) => { delete target[key]; });
      Object.assign(target, src);
    };
    if (data.playerHammerInventory && typeof playerHammerInventory !== 'undefined') {
      assignCountMap(playerHammerInventory, data.playerHammerInventory);
    }
    if (data.playerGloryScrollInventory && typeof playerGloryScrollInventory !== 'undefined') {
      assignCountMap(playerGloryScrollInventory, data.playerGloryScrollInventory);
    }
    if (typeof playerRecoveryCardCount !== 'undefined') {
      playerRecoveryCardCount = Math.max(0, Math.floor(Number(data.playerRecoveryCardCount) || 0));
      if (typeof ensureRecoveryCardConsumeInventory === 'function') {
        ensureRecoveryCardConsumeInventory();
      }
    }
    if (data.playerPotionCounts && typeof playerPotionCounts !== 'undefined') {
      assignCountMap(playerPotionCounts, data.playerPotionCounts);
      if (typeof IdlePotionStore !== 'undefined') {
        IdlePotionStore.list().forEach((potion) => {
          if (getPlayerPotionCount(potion.id) > 0 && typeof ensurePotionConsumeInventory === 'function') {
            ensurePotionConsumeInventory(potion.id);
          }
        });
      }
    }
    if (data.playerThrowingStarCounts && typeof playerThrowingStarCounts !== 'undefined') {
      assignCountMap(playerThrowingStarCounts, data.playerThrowingStarCounts);
      if (typeof ThrowingStarStore !== 'undefined') {
        ThrowingStarStore.list().forEach((star) => {
          if (getPlayerThrowingStarCount(star.id) > 0 && typeof ensureThrowingStarConsumeInventory === 'function') {
            ensureThrowingStarConsumeInventory(star.id);
          }
        });
        ThrowingStarStore.notifyCombatPad?.();
      }
    }
    if (data.playerBonusStatItemCounts && typeof playerBonusStatItemCounts !== 'undefined') {
      assignCountMap(playerBonusStatItemCounts, data.playerBonusStatItemCounts);
    }
    if (data.playerExceptionalHammerCounts && typeof playerExceptionalHammerCounts !== 'undefined') {
      assignCountMap(playerExceptionalHammerCounts, data.playerExceptionalHammerCounts);
    }
    if (data.playerSoulMaterialCounts && typeof playerSoulMaterialCounts !== 'undefined') {
      assignCountMap(playerSoulMaterialCounts, data.playerSoulMaterialCounts);
    }
    if (typeof UiNpcShop !== 'undefined' && typeof UiNpcShop.importRepurchase === 'function') {
      UiNpcShop.importRepurchase(data.npcShopRepurchase || []);
    }

    if (data.characterProgression
      && typeof CharacterProgression !== 'undefined'
      && typeof CharacterProgression.applySavePayload === 'function') {
      CharacterProgression.applySavePayload(data.characterProgression);
    }
    if (data.characterSkills
      && typeof CharacterSkills !== 'undefined'
      && typeof CharacterSkills.applySavePayload === 'function') {
      CharacterSkills.applySavePayload(data.characterSkills);
    }
    if (data.idleHunt
      && typeof IdleHunt !== 'undefined'
      && typeof IdleHunt.applySavePayload === 'function') {
      IdleHunt.applySavePayload(data.idleHunt);
    }

    if (typeof InventoryModule !== 'undefined' && typeof InventoryModule.markConsumeCountsReady === 'function') {
      InventoryModule.markConsumeCountsReady();
    }
  },

  async exportSaveToFile() {
    try {
      const payload = this.buildExportPayload();
      const text = await this.serializePayloadForFile(payload);
      const blob = new Blob([text], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const encrypted = text.includes(`"format":"${MSS_FILE_ENC_FORMAT}"`)
        || text.includes(`"format": "${MSS_FILE_ENC_FORMAT}"`);
      anchor.href = url;
      anchor.download = encrypted ? `mss-save-${stamp}.mss` : `mss-save-${stamp}.json`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      if (typeof addLog === 'function') {
        addLog(encrypted ? '💾 已匯出加密存檔。' : '💾 已匯出存檔。', 'log-success');
      }
      return true;
    } catch (err) {
      console.warn('[SessionPersistence] 匯出失敗:', err);
      if (typeof addLog === 'function') {
        addLog('⚠️ 匯出存檔失敗。', 'log-fail');
      }
      return false;
    }
  },

  importSaveFromObject(data) {
    if (!data || data.format !== MSS_SAVE_FORMAT || data.version !== MSS_SAVE_FILE_VERSION) {
      throw new Error('無效的存檔格式');
    }

    const session = data.session;
    if (!session || session.version !== SESSION_PERSISTENCE_VERSION) {
      throw new Error('存檔版本不相容');
    }

    this.clearEquipSlotSilent();
    try {
      if (typeof UiEquipModule !== 'undefined') UiEquipModule.clearAllPresets?.();
    } catch (_) { /* ignore */ }
    this.applySessionSnapshot(session);
    this.applyExtraPayload(data);

    if (typeof aeCloseAllAutoEnchantOverlays === 'function') {
      aeCloseAllAutoEnchantOverlays();
    }
    if (typeof EquipTooltipModule !== 'undefined') {
      EquipTooltipModule.hide(true);
    }

    if (typeof initInventory === 'function') initInventory();
    if (typeof updateStatusPanel === 'function') updateStatusPanel();
    if (typeof updateCategoryTabStates === 'function') updateCategoryTabStates();
    if (typeof syncMainPanelIdleState === 'function') syncMainPanelIdleState();
    if (typeof updateNonePageControls === 'function') updateNonePageControls();
    if (typeof syncInspectModules === 'function') syncInspectModules();
    if (typeof calculateCost === 'function') calculateCost();

    this.restoreUiEquipState();
    this.restoreEquippedItem();

    if (typeof CostTrackerModule !== 'undefined') {
      CostTrackerModule.refreshCostDisplay();
      if (CostTrackerModule.isOpen) CostTrackerModule.render();
    }

    this.loadedFromStorage = true;
    this.saveToStorage();
  },

  clearEquipSlotSilent() {
    if (typeof currentEnchantItem === 'undefined' || !currentEnchantItem) return;

    const dropZone = document.getElementById('equipDropZone');
    if (dropZone) dropZone.innerHTML = '';

    const sfItemName = document.getElementById('sfItemName');
    if (sfItemName) sfItemName.innerText = '請放置裝備';

    currentEnchantItem = null;

    if (typeof StarForceModule !== 'undefined') StarForceModule.clearEquipState?.();
    if (typeof HammerModule !== 'undefined') HammerModule.resetState();
    if (typeof SoulWeaponModule !== 'undefined') SoulWeaponModule.resetState();
    if (typeof ExceptionalModule !== 'undefined') ExceptionalModule.resetState();
    if (typeof ScrollModule !== 'undefined') ScrollModule.resetState();
    if (typeof PotentialModule !== 'undefined') PotentialModule.resetState();
    if (typeof AddPotentialModule !== 'undefined') AddPotentialModule.resetState();
    if (typeof BonusStatModule !== 'undefined') BonusStatModule.resetState();

    if (typeof updateActiveModuleEquip === 'function') updateActiveModuleEquip();
  },

  resolveItemId(itemId) {
    if (typeof resolveEquipItemId === 'function') {
      return resolveEquipItemId(itemId);
    }
    return itemId || null;
  },

  isValidItemId(itemId) {
    const id = this.resolveItemId(itemId);
    return Boolean(id && typeof ITEM_DATABASE !== 'undefined' && ITEM_DATABASE[id]);
  },

  stampState(state, itemId) {
    if (!state || typeof state !== 'object') return null;
    let snapshot = null;
    if (typeof cloneEnchantState === 'function') {
      snapshot = cloneEnchantState(state);
    } else {
      try {
        snapshot = JSON.parse(JSON.stringify(state));
      } catch (_) {
        snapshot = { ...state };
      }
    }
    if (!snapshot || typeof snapshot !== 'object') return null;
    if (typeof stampEnchantItemId === 'function') {
      return stampEnchantItemId(snapshot, itemId);
    }
    snapshot.itemId = itemId;
    snapshot.id = itemId;
    delete snapshot.slotIndex;
    return snapshot;
  },

  sanitizeEquipArray(source) {
    const count = typeof INVENTORY_SLOT_COUNT !== 'undefined' ? INVENTORY_SLOT_COUNT : 128;
    const result = new Array(count).fill(null);
    if (!Array.isArray(source)) return result;

    for (let i = 0; i < count; i++) {
      const itemId = this.resolveItemId(source[i]);
      result[i] = this.isValidItemId(itemId) ? itemId : null;
    }
    return result;
  },

  sanitizeStateArray(source, equipArray) {
    const count = typeof INVENTORY_SLOT_COUNT !== 'undefined' ? INVENTORY_SLOT_COUNT : 128;
    const result = new Array(count).fill(null);
    if (!Array.isArray(source)) return result;

    for (let i = 0; i < count; i++) {
      const itemId = equipArray[i];
      const state = source[i];
      if (!itemId || !state || typeof state !== 'object') {
        result[i] = null;
        continue;
      }
      const stateId = this.resolveItemId(state.itemId || state.id);
      // 僅在「確認是另一件裝備」時丟棄 state；ID 寫法不同（補零／型別）則修復保留
      if (stateId && this.isValidItemId(stateId) && stateId !== itemId) {
        result[i] = null;
        continue;
      }
      result[i] = this.stampState(state, itemId);
    }
    return result;
  },

  sanitizeEtcArray(source) {
    const count = typeof INVENTORY_SLOT_COUNT !== 'undefined' ? INVENTORY_SLOT_COUNT : 128;
    const result = new Array(count).fill(null);
    if (!Array.isArray(source)) return result;
    for (let i = 0; i < count; i++) {
      const row = source[i];
      if (!row || typeof row !== 'object') continue;
      const itemId = String(row.itemId || row.id || '').trim();
      if (!itemId) continue;
      result[i] = {
        type: 'etc',
        itemId,
        name: String(row.name || itemId),
        icon: String(row.icon || ''),
        amount: Math.max(1, Math.floor(Number(row.amount) || 1)),
        ...(row.slotLocked ? { slotLocked: true } : {}),
      };
    }
    return result;
  },

  /** 舊版「鎖格子」陣列 → 改寫到道具本身的 slotLocked */
  migrateLegacySlotLockArrays(data, equip) {
    const count = typeof INVENTORY_SLOT_COUNT !== 'undefined' ? INVENTORY_SLOT_COUNT : 128;

    const equipLocks = Array.isArray(data?.inventorySlotLockEquip) ? data.inventorySlotLockEquip : null;
    if (equipLocks) {
      for (let i = 0; i < count; i++) {
        if (!equipLocks[i] || !equip[i]) continue;
        let state = playerInventoryState[i];
        const stateId = this.resolveItemId(state?.itemId || state?.id);
        if (!state || (stateId && stateId !== equip[i])) {
          state = { itemId: equip[i], id: equip[i] };
        } else {
          state = this.stampState(state, equip[i]) || { itemId: equip[i], id: equip[i] };
        }
        state.slotLocked = true;
        playerInventoryState[i] = state;
      }
    }

    const consumeLocks = Array.isArray(data?.inventorySlotLockConsume) ? data.inventorySlotLockConsume : null;
    if (consumeLocks && typeof playerInventoryConsume !== 'undefined') {
      for (let i = 0; i < count; i++) {
        if (!consumeLocks[i] || !playerInventoryConsume[i] || typeof playerInventoryConsume[i] !== 'object') {
          continue;
        }
        playerInventoryConsume[i].slotLocked = true;
      }
    }

    const etcLocks = Array.isArray(data?.inventorySlotLockEtc) ? data.inventorySlotLockEtc : null;
    if (etcLocks && typeof playerInventoryEtc !== 'undefined') {
      for (let i = 0; i < count; i++) {
        if (!etcLocks[i] || !playerInventoryEtc[i] || typeof playerInventoryEtc[i] !== 'object') {
          continue;
        }
        playerInventoryEtc[i].slotLocked = true;
      }
    }
  },

  migrateEtcPotionsToConsume() {
    if (typeof playerInventoryEtc === 'undefined' || typeof IdlePotionStore === 'undefined') return;
    for (let i = 0; i < playerInventoryEtc.length; i += 1) {
      const entry = playerInventoryEtc[i];
      if (!entry) continue;
      const id = String(entry.itemId || '').trim();
      if (!IdlePotionStore.isPotionId?.(id)) continue;
      const amount = Math.max(1, Math.floor(Number(entry.amount) || 1));
      if (typeof grantPotion === 'function') grantPotion(id, amount);
      playerInventoryEtc[i] = null;
    }
  },

  applySessionSnapshot(data) {
    const equip = this.sanitizeEquipArray(data.inventoryEquip);
    playerInventoryEquip.splice(0, playerInventoryEquip.length, ...equip);

    const consumeCount = typeof INVENTORY_SLOT_COUNT !== 'undefined' ? INVENTORY_SLOT_COUNT : 128;
    const consume = Array.isArray(data.inventoryConsume)
      ? data.inventoryConsume.slice(0, consumeCount)
      : new Array(consumeCount).fill(null);
    while (consume.length < consumeCount) consume.push(null);
    playerInventoryConsume.splice(0, playerInventoryConsume.length, ...consume);

    const etc = this.sanitizeEtcArray(data.inventoryEtc);
    if (typeof playerInventoryEtc !== 'undefined') {
      playerInventoryEtc.splice(0, playerInventoryEtc.length, ...etc);
    }
    this.migrateEtcPotionsToConsume();

    const state = this.sanitizeStateArray(data.inventoryState, equip);
    playerInventoryState.splice(0, playerInventoryState.length, ...state);

    this.migrateLegacySlotLockArrays(data, equip);

    const slot = data.equippedSlotIndex;
    this.equippedSlotIndex = Number.isInteger(slot) && slot >= 0 && slot < consumeCount && equip[slot]
      ? slot
      : null;

    // 新格式強化槽實體（物品已不在背包）
    this._pendingEquippedItem = null;
    const pendingId = this.resolveItemId(data.equippedItem?.itemId);
    if (pendingId && this.isValidItemId(pendingId)) {
      this._pendingEquippedItem = {
        itemId: pendingId,
        state: this.stampState(data.equippedItem.state || {}, pendingId),
      };
      this.equippedSlotIndex = null;
    }

    this.mergeDefaultEquipInventory();
    if (typeof ensurePotentialScrollConsumeInventory === 'function') {
      ensurePotentialScrollConsumeInventory();
    }
    if (typeof TrunkData !== 'undefined' && typeof TrunkData.applySnapshot === 'function') {
      TrunkData.applySnapshot(data || {});
    }
    if (this.activeProfile !== 'idle') {
      if (typeof stripLegacyStarterPotentialsFromInventory === 'function') {
        stripLegacyStarterPotentialsFromInventory();
      }
    }

    // UiEquip 模組可能尚未載入：延後到 restoreUiEquipState
    this._pendingUiEquipState = {
      bodyWearActive: data.bodyWearActive || null,
      bodyWearByPreset: data.bodyWearByPreset || null,
      activeEquipPreset: data.activeEquipPreset,
      pendingEquipPreset: data.pendingEquipPreset,
    };
  },

  restoreUiEquipState() {
    const pending = this._pendingUiEquipState;
    this._pendingUiEquipState = null;
    if (!pending || typeof UiEquipModule === 'undefined') return;
    if (typeof UiEquipModule.importState !== 'function') return;
    if (!pending.bodyWearActive && !pending.bodyWearByPreset && pending.activeEquipPreset == null) {
      return;
    }
    UiEquipModule.importState(pending);
  },

  /**
   * 只清掉資料庫已不存在的格子；不再把 ITEM_DATABASE 全量塞進背包。
   * 新裝備請從物品清單拿取。
   */
  mergeDefaultEquipInventory() {
    const count = typeof INVENTORY_SLOT_COUNT !== 'undefined' ? INVENTORY_SLOT_COUNT : 128;
    if (typeof playerInventoryEquip === 'undefined') return;

    for (let i = 0; i < count; i++) {
      const itemId = playerInventoryEquip[i];
      if (!itemId) continue;
      if (this.isValidItemId(itemId)) continue;
      playerInventoryEquip[i] = null;
      if (typeof playerInventoryState !== 'undefined') playerInventoryState[i] = null;
    }

    if (typeof playerInventory !== 'undefined' && Array.isArray(playerInventory)) {
      playerInventory.splice(0, playerInventory.length, ...playerInventoryEquip);
    }
  },

  restoreEquippedItem() {
    if (this._pendingEquippedItem?.itemId) {
      const held = this._pendingEquippedItem;
      this._pendingEquippedItem = null;
      if (typeof loadEnchantItemHeld === 'function') {
        loadEnchantItemHeld(held.itemId, held.state);
      }
      return;
    }

    if (this.equippedSlotIndex == null) return;
    const itemId = playerInventoryEquip[this.equippedSlotIndex];
    if (!this.isValidItemId(itemId)) {
      this.equippedSlotIndex = null;
      return;
    }
    if (typeof loadEquipToSlot === 'function') {
      loadEquipToSlot(itemId, this.equippedSlotIndex);
    }
    this.equippedSlotIndex = null;
  },

  bindAutoSave() {
    window.addEventListener('beforeunload', () => {
      this.saveToStorage();
      // beforeunload 無法可靠 await；仍觸發非同步 flush
      this.flushFileBackup();
    });
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.saveToStorage();
        this.flushFileBackup();
      }
    });
    // 開頁輕量提醒（延後，等 log／UI 就緒）
    setTimeout(() => {
      try { this.maybeRemindBindBackup(); } catch (_) { /* ignore */ }
    }, 1200);
  }
};

SessionPersistenceModule.loadFromStorage();
