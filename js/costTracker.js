/**
 * 成本計數器：使用次數統計 + 自訂單價 + 總成本（localStorage／匯出存檔）
 */
const COST_TRACKER_PRICE_UNIT_YI = 100000000;

/** 貓谷素材：單價單位（例如每 100 喵力） */
const COST_TRACKER_CAT_VALLEY_MATERIALS = [
  { id: 'snow', label: '雪花', unitSize: 1 },
  { id: 'taichu', label: '太初', unitSize: 1 },
  { id: 'nekopow', label: '每100喵力', unitSize: 100 },
  { id: 'doom', label: '厄運', unitSize: 1 },
  { id: 'sun', label: '太陽', unitSize: 1 },
  { id: 'darkpcs', label: '每5漆黑粉塵', unitSize: 5 },
  { id: 'Nohimepcs', label: '每5濃姬粉塵', unitSize: 5 },
  { id: 'eternalpcs', label: '每10永恆粉塵', unitSize: 10 },
];

const CostTrackerModule = {
  isOpen: false,
  priceUnitMode: 'normal',
  usage: {
    snow: 0,
    taichu: 0,
    nekopow: 0,
    doom: 0,
    sun: 0,
    darkpcs: 0,
    Nohimepcs: 0,
    eternalpcs: 0,
    scrollGlory: 0,
    recoveryCard: 0,
    goldenHammer: 0,
    platinumHammer: 0,
    marishiaSoulGem: 0,
    bonusStatMeso: 0,
    addPotentialMeso: 0,
    bonusStatItems: {},
    cube: {},
    addCube: {},
    exceptional: {}
  },
  prices: {},
  starStats: {
    starNormal: 0,
    mesoSpent: 0,
    scrollSet20: 0,
    scroll23_100: 0,
    scroll23_30: 0,
    scroll24: 0,
    scroll25: 0
  },

  createEmptyUsage() {
    return {
      snow: 0,
      taichu: 0,
      nekopow: 0,
      doom: 0,
      sun: 0,
      darkpcs: 0,
      Nohimepcs: 0,
      eternalpcs: 0,
      scrollGlory: 0,
      recoveryCard: 0,
      goldenHammer: 0,
      platinumHammer: 0,
      marishiaSoulGem: 0,
      bonusStatMeso: 0,
      addPotentialMeso: 0,
      bonusStatItems: {},
      cube: {},
      addCube: {},
      exceptional: {}
    };
  },

  createEmptyStarStats() {
    return {
      starNormal: 0,
      mesoSpent: 0,
      scrollSet20: 0,
      scroll23_100: 0,
      scroll23_30: 0,
      scroll24: 0,
      scroll25: 0
    };
  },

  init() {
    this.loadPrices();
    this.loadUnitMode();
    this.seedCubeUsageKeys();
    this.bindLogOpen();
    this.bindModal();
    this.bindLegacyPriceInputs();
    this.render();
    this.syncLegacyPriceInputs();
    this.updateUnitToggleButton();
  },

  seedCubeUsageKeys() {
    COST_TRACKER_CAT_VALLEY_MATERIALS.forEach((mat) => {
      if (this.usage[mat.id] == null) this.usage[mat.id] = 0;
      if (this.prices[mat.id] == null) this.prices[mat.id] = 0;
    });
    if (typeof BONUS_STAT_ITEMS !== 'undefined') {
      BONUS_STAT_ITEMS.forEach((item) => {
        const key = `bonusStatItem:${item.id}`;
        if (this.usage.bonusStatItems[item.id] == null) this.usage.bonusStatItems[item.id] = 0;
        if (this.prices[key] == null) this.prices[key] = 0;
      });
    }
    if (typeof POTENTIAL_CUBE_TYPES !== 'undefined') {
      POTENTIAL_CUBE_TYPES.forEach((cube) => {
        if (this.usage.cube[cube.id] == null) this.usage.cube[cube.id] = 0;
        if (this.prices[`cube:${cube.id}`] == null) this.prices[`cube:${cube.id}`] = 0;
      });
    }
    if (typeof ADDPOT_CUBE_TYPES !== 'undefined') {
      ADDPOT_CUBE_TYPES.forEach((cube) => {
        if (this.usage.addCube[cube.id] == null) this.usage.addCube[cube.id] = 0;
        if (this.prices[`addCube:${cube.id}`] == null) this.prices[`addCube:${cube.id}`] = 0;
      });
    }
    if (typeof EXCEPTIONAL_HAMMER_BY_SLOT !== 'undefined') {
      const seen = new Set();
      Object.values(EXCEPTIONAL_HAMMER_BY_SLOT).forEach((hammer) => {
        if (!hammer?.id || seen.has(hammer.id)) return;
        seen.add(hammer.id);
        if (this.usage.exceptional[hammer.id] == null) this.usage.exceptional[hammer.id] = 0;
        if (this.prices[`exceptional:${hammer.id}`] == null) this.prices[`exceptional:${hammer.id}`] = 0;
      });
    }
  },

  getPriceDefs() {
    const defs = [
      ...COST_TRACKER_CAT_VALLEY_MATERIALS.map((mat) => ({
        id: mat.id,
        label: mat.label,
        group: '貓谷',
        unitSize: mat.unitSize,
      })),
      { id: 'scrollSet20', label: '20星強化卷', group: '星力' },
      { id: 'scroll23_100', label: '23星100%卷', group: '星力' },
      { id: 'scroll23_30', label: '23星30%卷', group: '星力' },
      { id: 'scroll24', label: '24星強化卷', group: '星力' },
      { id: 'scroll25', label: '25星強化卷', group: '星力' },
      { id: 'scrollGlory', label: '裝備卷軸（每次）', group: '卷軸' },
      { id: 'recoveryCard', label: '恢復卡', group: '卷軸' },
      { id: 'bonusStatMeso', label: '楓幣洗星火', group: '星火', price: false },
      ...(typeof BONUS_STAT_ITEMS !== 'undefined'
        ? BONUS_STAT_ITEMS.map((item) => ({
          id: `bonusStatItem:${item.id}`,
          label: item.name,
          group: '星火',
        }))
        : []),
      { id: 'marishiaSoulGem', label: '瑪麗西亞靈魂寶珠', group: '靈魂' },
      { id: 'goldenHammer', label: '黃金鐵鎚', group: '鐵鎚' },
      { id: 'platinumHammer', label: '白金鐵鎚', group: '鐵鎚' },
      ...(typeof EXCEPTIONAL_HAMMER_BY_SLOT !== 'undefined'
        ? (() => {
          const seen = new Set();
          return Object.values(EXCEPTIONAL_HAMMER_BY_SLOT).flatMap((hammer) => {
            if (!hammer?.id || seen.has(hammer.id)) return [];
            seen.add(hammer.id);
            return [{
              id: `exceptional:${hammer.id}`,
              label: hammer.name,
              group: '卓越強化',
            }];
          });
        })()
        : []),
      { id: 'addPotentialMeso', label: '附加方塊楓幣', group: '附加潛能方塊', price: false }
    ];

    if (typeof POTENTIAL_CUBE_TYPES !== 'undefined') {
      POTENTIAL_CUBE_TYPES.forEach((cube) => {
        defs.push({
          id: `cube:${cube.id}`,
          label: cube.name,
          group: '主潛能方塊'
        });
      });
    }

    if (typeof ADDPOT_CUBE_TYPES !== 'undefined') {
      ADDPOT_CUBE_TYPES.forEach((cube) => {
        defs.push({
          id: `addCube:${cube.id}`,
          label: cube.name,
          group: '附加潛能方塊'
        });
      });
    }

    return defs;
  },

  getUnitSize(priceId) {
    const mat = COST_TRACKER_CAT_VALLEY_MATERIALS.find((row) => row.id === priceId);
    if (mat) return mat.unitSize || 1;
    const def = this.getPriceDefs().find((row) => row.id === priceId);
    return def?.unitSize || 1;
  },

  getLineSubtotal(priceId, count, storedPrice) {
    if (priceId === 'mesoSpent' || priceId === 'bonusStatMeso' || priceId === 'addPotentialMeso') {
      return count;
    }
    const unitSize = this.getUnitSize(priceId);
    return (count / unitSize) * (parseFloat(storedPrice) || 0);
  },

  getStarStats() {
    return this.starStats;
  },

  resetStarStats() {
    this.starStats = this.createEmptyStarStats();
    if (typeof StarForceModule !== 'undefined') {
      StarForceModule.updateStatsUI?.();
    }
  },

  getSavePayload() {
    this.capturePricesFromForm();
    return {
      usage: JSON.parse(JSON.stringify(this.usage)),
      prices: { ...this.prices },
      priceUnitMode: this.priceUnitMode,
      starStats: { ...this.starStats }
    };
  },

  applySavePayload(data) {
    if (!data || typeof data !== 'object') return;

    this.usage = this.createEmptyUsage();
    this.seedCubeUsageKeys();

    if (data.usage && typeof data.usage === 'object') {
      Object.assign(this.usage, data.usage);
      if (data.usage.bonusStatItems) {
        this.usage.bonusStatItems = { ...data.usage.bonusStatItems };
      }
      if (data.usage.cube) {
        this.usage.cube = { ...data.usage.cube };
      }
      if (data.usage.addCube) {
        this.usage.addCube = { ...data.usage.addCube };
      }
      if (data.usage.exceptional) {
        this.usage.exceptional = { ...data.usage.exceptional };
      }
    }

    this.prices = {};
    this.seedCubeUsageKeys();
    if (data.prices && typeof data.prices === 'object') {
      Object.assign(this.prices, data.prices);
    }

    this.priceUnitMode = data.priceUnitMode === 'yi' ? 'yi' : 'normal';
    this.starStats = {
      ...this.createEmptyStarStats(),
      ...(data.starStats && typeof data.starStats === 'object' ? data.starStats : {})
    };

    this.syncLegacyPriceInputs();
    this.updateUnitToggleButton();
    if (typeof StarForceModule !== 'undefined') {
      StarForceModule.updateStatsUI?.();
    }
  },

  getUsageCount(priceId) {
    const star = this.getStarStats();
    if (priceId === 'mesoSpent') return star.mesoSpent || 0;
    if (priceId === 'bonusStatMeso') return this.usage.bonusStatMeso || 0;
    if (priceId === 'addPotentialMeso') return this.usage.addPotentialMeso || 0;
    if (priceId === 'starNormal') return star.starNormal || 0;
    if (priceId in star) return star[priceId] || 0;
    if (priceId.startsWith('bonusStatItem:')) {
      const itemId = priceId.slice('bonusStatItem:'.length);
      return this.usage.bonusStatItems[itemId] || 0;
    }
    if (priceId.startsWith('cube:')) {
      const cubeId = priceId.slice(5);
      return this.usage.cube[cubeId] || 0;
    }
    if (priceId.startsWith('addCube:')) {
      const cubeId = priceId.slice(8);
      return this.usage.addCube[cubeId] || 0;
    }
    if (priceId.startsWith('exceptional:')) {
      const hammerId = priceId.slice('exceptional:'.length);
      return this.usage.exceptional[hammerId] || 0;
    }
    return this.usage[priceId] || 0;
  },

  track(type, id, amount = 1) {
    const n = Number(amount) || 1;
    if (type === 'bonusStatMeso') {
      this.usage.bonusStatMeso = (this.usage.bonusStatMeso || 0) + n;
    } else if (type === 'addPotentialMeso') {
      this.usage.addPotentialMeso = (this.usage.addPotentialMeso || 0) + n;
    } else if (type === 'bonusStatItem' && id) {
      this.usage.bonusStatItems[id] = (this.usage.bonusStatItems[id] || 0) + n;
    } else if (type === 'cube' && id) {
      this.usage.cube[id] = (this.usage.cube[id] || 0) + n;
    } else if (type === 'addCube' && id) {
      this.usage.addCube[id] = (this.usage.addCube[id] || 0) + n;
    } else if (type === 'exceptional' && id) {
      if (!this.usage.exceptional) this.usage.exceptional = {};
      this.usage.exceptional[id] = (this.usage.exceptional[id] || 0) + n;
    } else if (Object.prototype.hasOwnProperty.call(this.usage, type)) {
      this.usage[type] = (this.usage[type] || 0) + n;
    }
    this.refreshCostDisplay();
    if (this.isOpen) this.render();
    if (typeof SessionPersistenceModule !== 'undefined') {
      SessionPersistenceModule.scheduleSave();
    }
  },

  loadPrices() {
    this.prices = {};
    this.getPriceDefs().forEach((def) => {
      if (this.prices[def.id] == null) this.prices[def.id] = 0;
    });
  },

  savePrices() {
    if (typeof SessionPersistenceModule !== 'undefined') {
      SessionPersistenceModule.scheduleSave();
    }
  },

  /** 從表單讀取單價到 this.prices（不重繪、不寫 log） */
  capturePricesFromForm() {
    const body = document.getElementById('costTrackerBody');
    if (!body) return false;
    let changed = false;
    body.querySelectorAll('[data-price-id]').forEach((input) => {
      const id = input.dataset.priceId;
      if (!id) return;
      const next = this.fromDisplayPrice(input.value);
      if ((parseFloat(this.prices[id]) || 0) !== next) {
        changed = true;
      }
      this.prices[id] = next;
    });
    return changed;
  },

  /** 熱儲存：更新記憶體單價並排程寫入工作階段 */
  hotSavePricesFromForm({ refreshDisplay = true } = {}) {
    const changed = this.capturePricesFromForm();
    this.savePrices();
    this.syncLegacyPriceInputs();
    if (refreshDisplay) this.refreshCostDisplay();
    return changed;
  },

  bindPriceInputHotSave(body = document.getElementById('costTrackerBody')) {
    if (!body || body.dataset.priceHotSaveBound === '1') return;
    body.dataset.priceHotSaveBound = '1';

    const persist = () => {
      this.hotSavePricesFromForm({ refreshDisplay: true });
      const totalEl = document.getElementById('costTrackerTotal');
      if (totalEl) {
        totalEl.textContent = this.formatTotalCost(this.getTotalCost());
      }
    };

    body.addEventListener('input', (event) => {
      const input = event.target?.closest?.('[data-price-id]');
      if (!input) return;
      persist();
    });
    body.addEventListener('change', (event) => {
      const input = event.target?.closest?.('[data-price-id]');
      if (!input) return;
      persist();
    });
  },

  loadUnitMode() {
    this.priceUnitMode = 'normal';
  },

  saveUnitMode() {
    if (typeof SessionPersistenceModule !== 'undefined') {
      SessionPersistenceModule.scheduleSave();
    }
  },

  isYiMode() {
    return this.priceUnitMode === 'yi';
  },

  toDisplayPrice(storedPrice) {
    const n = parseFloat(storedPrice) || 0;
    if (!this.isYiMode()) return n;
    const yi = n / COST_TRACKER_PRICE_UNIT_YI;
    return Number.isInteger(yi) ? yi : parseFloat(yi.toFixed(4));
  },

  fromDisplayPrice(displayValue) {
    const n = parseFloat(displayValue) || 0;
    return this.isYiMode() ? n * COST_TRACKER_PRICE_UNIT_YI : n;
  },

  toggleUnitMode() {
    this.priceUnitMode = this.isYiMode() ? 'normal' : 'yi';
    this.saveUnitMode();
    this.updateUnitToggleButton();
    this.render();
  },

  updateUnitToggleButton() {
    const btn = document.getElementById('costTrackerUnitToggle');
    if (!btn) return;
    btn.textContent = this.isYiMode() ? '正常單位' : '每1=1億';
    btn.classList.toggle('is-yi', this.isYiMode());
    btn.title = this.isYiMode()
      ? '目前：每 1 代表 1 億楓幣，點擊切換為正常楓幣'
      : '目前：正常楓幣，點擊切換為每 1 = 1 億';
  },

  formatTotalCost(amount) {
    const text = typeof formatMesoFullDisplay === 'function'
      ? formatMesoFullDisplay(amount)
      : amount.toLocaleString();
    return `${text}元`;
  },

  formatSubtotal(amount) {
    return typeof formatMesoAmount === 'function'
      ? formatMesoAmount(amount)
      : amount.toLocaleString();
  },

  syncLegacyPriceInputs() {
    const map = {
      price23_100: 'scroll23_100',
      price24: 'scroll24',
      price25: 'scroll25'
    };
    Object.entries(map).forEach(([inputId, priceId]) => {
      const el = document.getElementById(inputId);
      if (el && this.prices[priceId] != null) {
        el.value = String(this.prices[priceId]);
      }
    });
  },

  bindLegacyPriceInputs() {
    const map = {
      price23_100: 'scroll23_100',
      price24: 'scroll24',
      price25: 'scroll25'
    };
    Object.entries(map).forEach(([inputId, priceId]) => {
      const el = document.getElementById(inputId);
      if (!el || el.dataset.costTrackerBound) return;
      el.dataset.costTrackerBound = '1';
      el.addEventListener('change', () => {
        this.prices[priceId] = parseFloat(el.value) || 0;
        this.savePrices();
        this.refreshCostDisplay();
        if (this.isOpen) this.render();
      });
    });
  },

  syncLegacyFromInputs() {
    const map = {
      scroll23_100: 'price23_100',
      scroll24: 'price24',
      scroll25: 'price25'
    };
    Object.entries(map).forEach(([priceId, inputId]) => {
      const el = document.getElementById(inputId);
      if (el) this.prices[priceId] = parseFloat(el.value) || 0;
    });
  },

  getTotalCost() {
    const star = this.getStarStats();
    let total = (star.mesoSpent || 0)
      + (this.usage.bonusStatMeso || 0)
      + (this.usage.addPotentialMeso || 0);

    this.getPriceDefs().forEach((def) => {
      if (def.price === false) return;
      const count = this.getUsageCount(def.id);
      const price = parseFloat(this.prices[def.id]) || 0;
      total += this.getLineSubtotal(def.id, count, price);
    });

    return Math.floor(total);
  },

  refreshCostDisplay() {
    if (typeof calculateCost === 'function') calculateCost();
  },

  resetAll() {
    this.usage = this.createEmptyUsage();
    this.seedCubeUsageKeys();

    this.resetStarStats();

    const restoreEl = document.getElementById('cntRestore');
    if (restoreEl) restoreEl.textContent = '0次';

    this.render();
    this.refreshCostDisplay();
    if (typeof SessionPersistenceModule !== 'undefined') {
      SessionPersistenceModule.scheduleSave();
    }
    addLog('💰 已重置花費與使用次數統計。', 'log-info');
  },

  open() {
    const overlay = document.getElementById('costTrackerOverlay');
    if (!overlay) return;
    this.isOpen = true;
    if (typeof beginModalFadeIn === 'function') {
      beginModalFadeIn(overlay);
    } else {
      overlay.classList.remove('hidden');
      overlay.setAttribute('aria-hidden', 'false');
    }
    this.render();
    this.updateUnitToggleButton();
  },

  close() {
    this.hotSavePricesFromForm({ refreshDisplay: true });
    const overlay = document.getElementById('costTrackerOverlay');
    if (!overlay) return;
    this.isOpen = false;
    overlay.classList.add('hidden');
    overlay.setAttribute('aria-hidden', 'true');
  },

  bindLogOpen() {
    const logBox = document.getElementById('logBox');
    if (logBox && !logBox.dataset.costTrackerBound) {
      logBox.dataset.costTrackerBound = '1';
      logBox.classList.add('ms-sidebar-log-clickable');
      logBox.title = '點擊開啟成本統計';
      logBox.addEventListener('click', () => this.open());
    }
  },

  bindModal() {
    const closeBtn = document.getElementById('costTrackerClose');
    const backdrop = document.getElementById('costTrackerBackdrop');
    const resetBtn = document.getElementById('costTrackerReset');
    const saveBtn = document.getElementById('costTrackerSavePrices');
    const unitBtn = document.getElementById('costTrackerUnitToggle');
    const exportBtn = document.getElementById('costTrackerExportSave');
    const importBtn = document.getElementById('costTrackerImportSave');
    const importFile = document.getElementById('costTrackerImportFile');

    closeBtn?.addEventListener('click', () => this.close());
    backdrop?.addEventListener('click', () => this.close());
    resetBtn?.addEventListener('click', () => {
      if (window.confirm('確定要重置所有使用次數與楓幣花費統計嗎？（單價設定會保留）')) {
        this.resetAll();
      }
    });
    saveBtn?.addEventListener('click', () => this.savePricesFromForm());
    unitBtn?.addEventListener('click', () => this.toggleUnitMode());
    exportBtn?.addEventListener('click', () => this.handleExportSave());
    importBtn?.addEventListener('click', () => importFile?.click());
    importFile?.addEventListener('change', (event) => this.handleImportSaveFile(event));

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && this.isOpen) this.close();
    });

    if (!this._beforeUnloadBound) {
      this._beforeUnloadBound = true;
      window.addEventListener('beforeunload', () => {
        if (!this.isOpen) return;
        this.capturePricesFromForm();
        if (typeof SessionPersistenceModule !== 'undefined') {
          SessionPersistenceModule.saveToStorage?.();
        }
      });
    }
  },

  handleExportSave() {
    if (typeof SessionPersistenceModule !== 'undefined'
      && typeof SessionPersistenceModule.exportSaveToFile === 'function') {
      SessionPersistenceModule.exportSaveToFile();
    }
  },

  handleImportSaveFile(event) {
    const input = event.target;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result || ''));
        if (!window.confirm('匯入存檔會覆蓋目前的背包、強化進度與成本統計，確定要繼續嗎？')) {
          return;
        }
        if (typeof SessionPersistenceModule === 'undefined'
          || typeof SessionPersistenceModule.importSaveFromObject !== 'function') {
          throw new Error('存檔模組未載入');
        }
        SessionPersistenceModule.importSaveFromObject(data);
        addLog('📂 已匯入存檔。', 'log-success');
        this.render();
      } catch (err) {
        console.warn('[CostTracker] 匯入失敗:', err);
        addLog(`⚠️ 匯入失敗：${err.message || '無法讀取檔案'}`, 'log-fail');
      }
    };
    reader.onerror = () => {
      addLog('⚠️ 無法讀取存檔檔案。', 'log-fail');
    };
    reader.readAsText(file, 'UTF-8');
  },

  savePricesFromForm() {
    this.hotSavePricesFromForm({ refreshDisplay: true });
    this.render();
    addLog('💰 已儲存成本單價。', 'log-info');
  },

  formatCount(id, count) {
    if (id === 'mesoSpent' || id === 'bonusStatMeso' || id === 'addPotentialMeso') {
      return typeof formatMesoAmount === 'function'
        ? formatMesoAmount(count)
        : `${count.toLocaleString()} 楓幣`;
    }
    if (id === 'starNormal') return `${count} 次`;
    if (COST_TRACKER_CAT_VALLEY_MATERIALS.some((mat) => mat.id === id)) {
      return `${count.toLocaleString()} 個`;
    }
    if (id.startsWith('scroll') || id.startsWith('cube:') || id.startsWith('addCube:') || id.startsWith('bonusStatItem:') || id.startsWith('exceptional:')) {
      return `${count} 次`;
    }
    if (id === 'recoveryCard' || id === 'marishiaSoulGem') return `${count} 次`;
    if (id.endsWith('Hammer')) return `${count} 次`;
    return String(count);
  },

  render() {
    // 重繪前先熱存表單，避免使用次數更新時蓋掉未按「儲存單價」的輸入
    this.capturePricesFromForm();

    const body = document.getElementById('costTrackerBody');
    const totalEl = document.getElementById('costTrackerTotal');
    if (!body) return;

    const groups = new Map();
    const priceDefs = this.getPriceDefs();
    const catValleyDefs = priceDefs.filter((def) => def.group === '貓谷');
    const otherDefs = priceDefs.filter((def) => def.group !== '貓谷');
    const usageRows = [
      ...catValleyDefs.map((def) => ({
        ...def,
        price: def.price === false ? false : true,
      })),
      { id: 'mesoSpent', label: '楓幣花費', group: '星力', price: false },
      { id: 'starNormal', label: '一般星力強化', group: '星力', price: false },
      ...otherDefs.map((def) => ({
        ...def,
        price: def.price === false ? false : true,
      }))
    ];

    usageRows.forEach((row) => {
      if (!groups.has(row.group)) groups.set(row.group, []);
      groups.get(row.group).push(row);
    });

    let html = '';
    html += '<table class="cost-tracker-table">';
    html += '<colgroup>';
    html += '<col class="cost-tracker-col-name">';
    html += '<col class="cost-tracker-col-count">';
    html += '<col class="cost-tracker-col-price">';
    html += '<col class="cost-tracker-col-sub">';
    html += '</colgroup>';
    html += '<thead><tr><th>項目</th><th>使用次數</th><th>單價</th><th>小計</th></tr></thead><tbody>';

    groups.forEach((rows, groupName) => {
      html += `<tr class="cost-tracker-group-row"><td colspan="4">${groupName}</td></tr>`;

      rows.forEach((row) => {
        const count = this.getUsageCount(row.id);
        const storedPrice = row.price ? (parseFloat(this.prices[row.id]) || 0) : 0;
        const subtotal = this.getLineSubtotal(row.id, count, storedPrice);
        const displayPrice = this.toDisplayPrice(storedPrice);
        const priceStep = this.isYiMode() ? '0.01' : '1';

        html += '<tr>';
        html += `<td class="cost-tracker-name">${row.label}</td>`;
        html += `<td class="cost-tracker-count">${this.formatCount(row.id, count)}</td>`;
        if (row.price) {
          html += `<td class="cost-tracker-price"><input type="number" min="0" step="${priceStep}" data-price-id="${row.id}" value="${displayPrice}"></td>`;
          html += `<td class="cost-tracker-sub">${this.formatSubtotal(subtotal)}</td>`;
        } else {
          html += '<td class="cost-tracker-price cost-tracker-na">—</td>';
          html += `<td class="cost-tracker-sub">${row.id === 'mesoSpent' || row.id === 'bonusStatMeso' || row.id === 'addPotentialMeso' ? this.formatSubtotal(subtotal) : subtotal.toLocaleString()}</td>`;
        }
        html += '</tr>';
      });
    });

    html += '</tbody></table>';

    body.innerHTML = html;
    // render 會重建 DOM，需重新掛熱儲存
    delete body.dataset.priceHotSaveBound;
    this.bindPriceInputHotSave(body);
    this.updateUnitToggleButton();

    if (totalEl) {
      totalEl.textContent = this.formatTotalCost(this.getTotalCost());
    }
  }
};

function trackCostUsage(type, id, amount) {
  if (typeof CostTrackerModule !== 'undefined') {
    CostTrackerModule.track(type, id, amount);
  }
}

function trackCostEvent(eventId, amount = 1) {
  if (typeof CostTrackerModule === 'undefined') return;
  if (eventId === 'bonusStatMeso') {
    CostTrackerModule.track('bonusStatMeso', null, amount);
    return;
  }
  if (eventId === 'addPotentialMeso') {
    CostTrackerModule.track('addPotentialMeso', null, amount);
    return;
  }
  if (eventId.startsWith('bonusStatItem:')) {
    const itemId = eventId.slice('bonusStatItem:'.length);
    CostTrackerModule.track('bonusStatItem', itemId, amount);
  }
}
