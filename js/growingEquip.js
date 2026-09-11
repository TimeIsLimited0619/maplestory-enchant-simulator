/**
 * 等級成長裝備（wz-xml/baseequip）
 * 首次達到 10 等時發放到物品欄；之後每 10 等升級一次，最高對應玩家 100 等。
 * 賣掉後不會在重整時重發；可於自由轉職頁「補領新手套裝」。
 * 升級時改需求等級／基礎屬性，星力／卷軸／潛能等強化原樣繼承。
 * 每成長 3 次再 +1 卷軸可強化次數（加在 WZ tuc 上，不重置已用次數）。
 */
const GrowingEquip = (() => {
  const GRANT_LEVEL = 10;
  const STEP = 10;
  const MAX_LEVEL = 100;
  const MAX_TIER = Math.floor((MAX_LEVEL - GRANT_LEVEL) / STEP);
  const SLOT_BONUS_EVERY = 3;
  const FLAG_KEY = 'growingEquip.starterGranted.v1';

  const PIECES = Object.freeze([
    { id: '01002797', fallbackName: '幹員N的消耗性接聽器' },
    { id: '01052165', fallbackName: '空降幹員套裝' },
    { id: '01082244', fallbackName: '幹員O的尼龍手套' },
    { id: '01072366', fallbackName: '空降幹員鞋' },
    { id: '01102174', fallbackName: '幹員披風' },
  ]);

  const IDS = Object.freeze(PIECES.map((row) => row.id));
  const ID_SET = new Set(IDS);

  const STAT_KEYS = ['str', 'dex', 'int', 'luk', 'atk', 'matk', 'def', 'mdef', 'hp', 'mp'];

  const bases = Object.create(null);
  let captured = false;
  let appliedTier = null;
  let syncing = false;

  function isIdle() {
    if (typeof SessionPersistenceModule !== 'undefined' && SessionPersistenceModule.activeProfile === 'idle') {
      return true;
    }
    return typeof AppMode !== 'undefined' && AppMode.isIdle?.();
  }

  function flagStorageKey() {
    return isIdle() ? `${FLAG_KEY}.idle` : FLAG_KEY;
  }

  function isStarterGranted() {
    try {
      return localStorage.getItem(flagStorageKey()) === '1';
    } catch (_) {
      return false;
    }
  }

  function setStarterGranted(value) {
    try {
      if (value) localStorage.setItem(flagStorageKey(), '1');
      else localStorage.removeItem(flagStorageKey());
    } catch (_) { /* ignore */ }
  }

  function playerLevel() {
    if (typeof CharacterProgression !== 'undefined' && typeof CharacterProgression.getState === 'function') {
      return Math.max(1, Math.floor(Number(CharacterProgression.getState().level) || 1));
    }
    return 1;
  }

  function tierForLevel(level) {
    const lv = Math.max(1, Math.floor(Number(level) || 1));
    if (lv < GRANT_LEVEL) return 0;
    return Math.max(0, Math.min(MAX_TIER, Math.floor(lv / STEP) - 1));
  }

  function reqLevelForTier(tier, baseReq) {
    return (Number(baseReq) || GRANT_LEVEL) + Math.max(0, tier) * STEP;
  }

  function slotBonusForTier(tier) {
    return Math.floor(Math.max(0, Math.floor(Number(tier) || 0)) / SLOT_BONUS_EVERY);
  }

  function cloneStats(stats) {
    const out = {};
    STAT_KEYS.forEach((key) => {
      out[key] = Number(stats?.[key]) || 0;
    });
    return out;
  }

  function captureBases() {
    if (typeof GeneratedEquipLoader !== 'undefined') GeneratedEquipLoader.register?.();
    if (typeof ITEM_DATABASE === 'undefined') return false;
    let ok = true;
    PIECES.forEach((row) => {
      const item = ITEM_DATABASE[row.id];
      if (!item) {
        ok = false;
        return;
      }
      if (bases[row.id]) return;
      bases[row.id] = {
        reqLevel: Number(item.reqLevel) || GRANT_LEVEL,
        baseStats: cloneStats(item.baseStats),
        tuc: Number(item.baseMaxUpgradeSlots ?? item.maxUpgradeSlots ?? item.upgradeSlots) || 0,
        name: item.name || row.fallbackName,
      };
      item.growingEquip = true;
      if (!item.name || item.name === row.id) {
        item.name = row.fallbackName;
      }
    });
    captured = IDS.every((id) => !!bases[id]);
    return captured || ok;
  }

  function grownStats(baseStats, tier) {
    const n = Math.max(0, Math.floor(Number(tier) || 0));
    const next = cloneStats(baseStats);
    next.str += n;
    next.dex += n;
    next.int += n;
    next.luk += n;
    next.hp += n * 10;
    next.def += n * 10;
    return next;
  }

  function applyTemplateTier(tier) {
    if (!captured && !captureBases()) return false;
    if (typeof ITEM_DATABASE === 'undefined') return false;
    const t = Math.max(0, Math.floor(Number(tier) || 0));
    IDS.forEach((id) => {
      const item = ITEM_DATABASE[id];
      const base = bases[id];
      if (!item || !base) return;
      item.reqLevel = reqLevelForTier(t, base.reqLevel);
      item.baseStats = grownStats(base.baseStats, t);
      const bonus = slotBonusForTier(t);
      const tuc = (Number(base.tuc) || 0) + bonus;
      item.upgradeSlots = tuc;
      item.maxUpgradeSlots = tuc;
      item.baseMaxUpgradeSlots = tuc;
      item.growingEquip = true;
      item.growingTier = t;
      item.growingSlotBonus = bonus;
      if (typeof applyStarForceItemRules === 'function') {
        applyStarForceItemRules(item);
      }
    });
    appliedTier = t;
    return true;
  }

  function syncLiveState(state, itemId) {
    if (!state || typeof state !== 'object') return;
    const id = itemId || state.itemId || state.id;
    if (!ID_SET.has(id) || typeof ITEM_DATABASE === 'undefined') return;
    const template = ITEM_DATABASE[id];
    if (!template) return;
    state.reqLevel = template.reqLevel;
    state.baseStats = cloneStats(template.baseStats);
    state.growingEquip = true;
    state.growingTier = template.growingTier || 0;
    const bonus = Number(template.growingSlotBonus) || slotBonusForTier(template.growingTier);
    const prevBonus = Number(state.growingSlotBonus) || 0;
    const delta = bonus - prevBonus;
    if (delta) {
      state.upgradeSlots = Math.max(0, (Number(state.upgradeSlots) || 0) + delta);
      state.maxUpgradeSlots = Math.max(0, (Number(state.maxUpgradeSlots) || 0) + delta);
      state.baseMaxUpgradeSlots = Math.max(0, (Number(state.baseMaxUpgradeSlots) || 0) + delta);
    }
    state.growingSlotBonus = bonus;
    const computedMax = typeof getItemStarForceMaxStar === 'function'
      ? getItemStarForceMaxStar(template)
      : (template.maxStar || 0);
    state.maxStar = Math.max(Number(computedMax) || 0, Number(state.star) || 0);
  }

  function syncLiveCopies() {
    if (typeof currentEnchantItem !== 'undefined' && currentEnchantItem) {
      syncLiveState(currentEnchantItem, currentEnchantItem.itemId || currentEnchantItem.id);
    }
    if (typeof playerInventoryState !== 'undefined' && Array.isArray(playerInventoryState)
      && typeof playerInventoryEquip !== 'undefined') {
      for (let i = 0; i < playerInventoryState.length; i++) {
        const id = playerInventoryEquip[i];
        if (!ID_SET.has(id) || !playerInventoryState[i]) continue;
        syncLiveState(playerInventoryState[i], id);
      }
    }
    if (typeof UiEquipModule !== 'undefined' && typeof UiEquipModule.forEachWornEntry === 'function') {
      UiEquipModule.forEachWornEntry((entry) => {
        if (ID_SET.has(entry.itemId)) syncLiveState(entry.state, entry.itemId);
      });
    }
    if (typeof TrunkData !== 'undefined' && typeof TrunkData.getSlots === 'function') {
      TrunkData.getSlots().forEach((slot) => {
        if (!slot || slot.kind !== 'equip') return;
        const id = slot.itemId;
        if (!ID_SET.has(id)) return;
        syncLiveState(slot.state, id);
      });
    }
  }

  function collectOwnedIds() {
    const owned = new Set();
    if (typeof playerInventoryEquip !== 'undefined' && Array.isArray(playerInventoryEquip)) {
      playerInventoryEquip.forEach((id) => {
        if (ID_SET.has(id)) owned.add(id);
      });
    }
    if (typeof currentEnchantItem !== 'undefined' && currentEnchantItem) {
      const id = currentEnchantItem.itemId || currentEnchantItem.id;
      if (ID_SET.has(id)) owned.add(id);
    }
    if (typeof UiEquipModule !== 'undefined' && typeof UiEquipModule.getWornItemIds === 'function') {
      UiEquipModule.getWornItemIds().forEach((id) => {
        if (ID_SET.has(id)) owned.add(id);
      });
    }
    if (typeof TrunkData !== 'undefined' && typeof TrunkData.getSlots === 'function') {
      TrunkData.getSlots().forEach((slot) => {
        if (slot?.kind === 'equip' && ID_SET.has(slot.itemId)) owned.add(slot.itemId);
      });
    }
    return owned;
  }

  function grantMissing({ log = true, logTag = '成長裝備' } = {}) {
    if (typeof InventoryModule === 'undefined' || typeof InventoryModule.addEquipFromCatalog !== 'function') {
      return [];
    }
    const owned = collectOwnedIds();
    const granted = [];
    IDS.forEach((id) => {
      if (owned.has(id)) return;
      if (typeof ITEM_DATABASE === 'undefined' || !ITEM_DATABASE[id]) return;
      const ok = InventoryModule.addEquipFromCatalog(id, null, {
        silent: true,
        switchTab: false,
        logTag,
      });
      if (!ok) return;
      owned.add(id);
      granted.push(id);
    });
    if (log && granted.length && typeof addLog === 'function') {
      const names = granted.map((id) => ITEM_DATABASE[id]?.name || id).join('、');
      addLog(`[${logTag}] 已將【${names}】放入物品欄。`, 'log-success');
    }
    return granted;
  }

  /** 舊存檔：已持有任一件則視為已領過，避免重整又自動補發 */
  function migrateGrantFlag() {
    if (isStarterGranted()) return;
    if (collectOwnedIds().size > 0) setStarterGranted(true);
  }

  function refreshUi() {
    if (typeof EquipStatPanel !== 'undefined') EquipStatPanel.refresh?.();
    if (typeof UiCharacterInfo !== 'undefined') UiCharacterInfo.refresh?.();
    if (typeof InventoryModule !== 'undefined') {
      InventoryModule.scheduleRender?.();
      InventoryModule.render?.();
    }
    if (typeof UiEquipModule !== 'undefined') UiEquipModule.refresh?.();
    if (typeof EquipTooltipModule !== 'undefined') EquipTooltipModule.refreshIfShowing?.();
    if (typeof CharacterCombatPanel !== 'undefined') CharacterCombatPanel.syncToCombatPower?.();
    if (typeof updateStatusPanel === 'function') updateStatusPanel();
    if (typeof SessionPersistenceModule !== 'undefined') SessionPersistenceModule.scheduleSave?.();
  }

  function sync(opts = {}) {
    if (syncing) return { ok: false };
    syncing = true;
    try {
      captureBases();
      const idle = isIdle();
      const level = playerLevel();
      const nextTier = idle ? tierForLevel(level) : 0;
      const prevTier = appliedTier;
      applyTemplateTier(nextTier);
      syncLiveCopies();

      if (idle) {
        if (level < GRANT_LEVEL) setStarterGranted(false);
        else migrateGrantFlag();
      }

      let granted = [];
      // 僅在「首次從不到 10 等升到 ≥10」時自動發放；重整／賣裝後不重發
      if (idle && opts.crossedGrantLevel && level >= GRANT_LEVEL && !isStarterGranted()) {
        granted = grantMissing({ log: opts.log !== false });
        setStarterGranted(true);
      }

      const upgraded = idle && prevTier != null && nextTier > prevTier && opts.log !== false;
      if (upgraded && typeof addLog === 'function') {
        const req = reqLevelForTier(nextTier, GRANT_LEVEL);
        const slotGain = slotBonusForTier(nextTier) - slotBonusForTier(prevTier);
        const slotNote = slotGain > 0 ? `、可強化次數+${slotGain}` : '';
        addLog(`[成長裝備] 已成長至需求等級 ${req}（全屬+${nextTier}、HP+${nextTier * 10}、防禦+${nextTier * 10}${slotNote}）。強化屬性已繼承。`, 'log-success');
      }

      if (granted.length || upgraded || opts.refresh) refreshUi();
      return { ok: true, tier: nextTier, granted, upgraded };
    } finally {
      syncing = false;
    }
  }

  /** 自由轉職頁補領：補齊缺少的新手套裝件 */
  function claimStarterSet({ log = true } = {}) {
    if (!isIdle()) {
      if (log && typeof addLog === 'function') {
        addLog('[成長裝備] 僅放置模式可補領新手套裝。', 'log-fail');
      }
      return { ok: false, reason: 'not_idle', granted: [] };
    }
    const level = playerLevel();
    if (level < GRANT_LEVEL) {
      if (log && typeof addLog === 'function') {
        addLog(`[成長裝備] 需達到 Lv.${GRANT_LEVEL} 才能補領新手套裝。`, 'log-fail');
      }
      return { ok: false, reason: 'level', granted: [] };
    }
    captureBases();
    applyTemplateTier(tierForLevel(level));
    const granted = grantMissing({ log, logTag: '成長裝備' });
    setStarterGranted(true);
    syncLiveCopies();
    if (granted.length) {
      refreshUi();
    } else if (log && typeof addLog === 'function') {
      addLog('[成長裝備] 新手套裝已齊全，無需補領。', 'log-info');
    }
    return { ok: true, granted };
  }

  function isPiece(itemOrId) {
    const id = typeof itemOrId === 'string'
      ? itemOrId
      : (itemOrId?.itemId || itemOrId?.id);
    return ID_SET.has(id);
  }

  return {
    GRANT_LEVEL,
    MAX_LEVEL,
    IDS,
    isPiece,
    tierForLevel,
    sync,
    claimStarterSet,
    isStarterGranted,
  };
})();

if (typeof window !== 'undefined') window.GrowingEquip = GrowingEquip;
