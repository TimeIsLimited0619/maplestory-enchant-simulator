/**
 * 角色技能狀態（等級／裝備格／SP）
 * 預設職業：222 大魔導士（冰、雷）；職業線 primaryJobId = 四轉（SkillJobData.lines）
 */
const CharacterSkills = (() => {
  const STORAGE_KEY = 'ui.characterSkills.v4';
  const DEFAULT_JOB_ID = 222;
  const JOB_LINE_ORDER = ['warrior', 'mage', 'magef', 'nightlord', 'mercedes'];
  const COMBAT_JOB_BY_LINE = {
    warrior: '英雄',
    mage: '大魔導士（冰、雷）',
    magef: '大魔導士（火、毒）',
    nightlord: '夜使者',
    mercedes: '精靈遊俠',
  };
  /** 技能連鎖 1～4 格解鎖等級（對應 10／30／60／100 階） */
  const SKILL_LINK_SLOT_RANKS = ['10', '30', '60', '100'];

  const state = {
    currentJobId: DEFAULT_JOB_ID,
    levels: {},
    equipped: { 1: emptyLoadout(), 2: emptyLoadout(), 3: emptyLoadout() },
    skillLinks: { 1: emptySkillLink(), 2: emptySkillLink(), 3: emptySkillLink() },
    activePreset: 1,
  };

  let hydrated = false;
  let jobLineChosen = false;
  /** 放置模式新手裝是否已發放（選完職業路線後只發一次） */
  let idleStarterGranted = false;

  function emptyLoadout() {
    return Array.from({ length: 9 }, () => null);
  }

  function emptySkillLink() {
    return Array.from({ length: 4 }, () => null);
  }

  function resolveJobId(jobId) {
    const raw = Number(jobId) || DEFAULT_JOB_ID;
    if (typeof SkillCatalog !== 'undefined' && typeof SkillCatalog.normalizeJobId === 'function') {
      return SkillCatalog.normalizeJobId(raw) || DEFAULT_JOB_ID;
    }
    return raw || DEFAULT_JOB_ID;
  }

  function characterLevel() {
    if (typeof CharacterProgression === 'undefined') return 1;
    return Math.max(1, Number(CharacterProgression.getState?.().level) || 1);
  }

  function resolveSkillRank(skillOrId) {
    const skill = typeof skillOrId === 'object' && skillOrId
      ? skillOrId
      : (typeof SkillCatalog !== 'undefined' ? SkillCatalog.getSkill(skillOrId) : null);
    return skill ? String(skill.rank || '') : '';
  }

  function getSpRemainingForRank(rank) {
    if (typeof SkillPoints === 'undefined') return 0;
    return SkillPoints.remainingSpForRank(
      state.currentJobId,
      rank,
      characterLevel(),
      state.levels,
    );
  }

  function ensureHydrated() {
    if (hydrated) return;
    hydrated = true;
    load();
    ensureDefaults();
  }

  function lineSkills() {
    if (typeof SkillCatalog === 'undefined') return [];
    return SkillCatalog.listSkills(state.currentJobId);
  }

  function ensureDefaults() {
    state.currentJobId = resolveJobId(state.currentJobId);
    if (typeof SkillCatalog !== 'undefined') {
      const books = SkillCatalog.booksForJob?.(state.currentJobId) || [];
      if (!books.length) state.currentJobId = DEFAULT_JOB_ID;
    }
    lineSkills().forEach((s) => {
      if (state.levels[s.id] == null) state.levels[s.id] = 0;
    });
    [1, 2, 3].forEach((p) => {
      if (!Array.isArray(state.equipped[p]) || state.equipped[p].length !== 9) {
        state.equipped[p] = emptyLoadout();
      }
      if (!Array.isArray(state.skillLinks[p]) || state.skillLinks[p].length !== 4) {
        state.skillLinks[p] = emptySkillLink();
      }
    });
    pruneLockedSkillLinkSlots();
    if (pruneNoCdAttackFromLoadouts()) save();
    if (pruneAddAttackFollowups()) save();
    if (pruneSupersededSkills()) save();
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        jobLineChosen = false;
        idleStarterGranted = false;
        return;
      }
      const data = JSON.parse(raw);
      if (data.currentJobId != null) state.currentJobId = resolveJobId(data.currentJobId);
      if (data.levels && typeof data.levels === 'object') state.levels = data.levels;
      if (data.equipped && typeof data.equipped === 'object') state.equipped = data.equipped;
      if (data.skillLinks && typeof data.skillLinks === 'object') state.skillLinks = data.skillLinks;
      if (data.activePreset != null) state.activePreset = Number(data.activePreset) || 1;
      jobLineChosen = data.jobLineChosen !== false;
      if (data.idleStarterGranted != null) {
        idleStarterGranted = !!data.idleStarterGranted;
      } else {
        // 舊存檔：已選過職業路線視為已發放，避免刷新重複給裝
        idleStarterGranted = jobLineChosen;
      }
    } catch (_) { /* ignore */ }
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        currentJobId: state.currentJobId,
        levels: state.levels,
        equipped: state.equipped,
        skillLinks: state.skillLinks,
        activePreset: state.activePreset,
        jobLineChosen,
        idleStarterGranted,
      }));
    } catch (_) { /* ignore */ }
  }

  function isSkillUnlocked(skillId) {
    const skill = typeof SkillCatalog !== 'undefined' ? SkillCatalog.getSkill(skillId) : null;
    if (!skill || typeof SkillPoints === 'undefined') return false;
    return SkillPoints.isSkillUnlocked(skill, characterLevel());
  }

  function isRankUnlocked(rank) {
    if (typeof SkillPoints === 'undefined') return true;
    return SkillPoints.isRankUnlocked(rank, characterLevel());
  }

  function skillLinkSlotRequiredLevel(slotIndex) {
    const rank = SKILL_LINK_SLOT_RANKS[Number(slotIndex)];
    if (!rank || typeof SkillPoints === 'undefined') return 999;
    return SkillPoints.rankRequiredLevel(rank);
  }

  function isSkillLinkSlotUnlocked(slotIndex) {
    const i = Number(slotIndex);
    if (!Number.isInteger(i) || i < 0 || i >= SKILL_LINK_SLOT_RANKS.length) return false;
    return characterLevel() >= skillLinkSlotRequiredLevel(i);
  }

  function pruneLockedSkillLinkSlots() {
    [1, 2, 3].forEach((p) => {
      const link = state.skillLinks[p];
      if (!Array.isArray(link)) return;
      for (let i = 0; i < link.length; i += 1) {
        if (!isSkillLinkSlotUnlocked(i)) link[i] = null;
      }
    });
  }

  function onCharacterLevelUp() {
    ensureHydrated();
    pruneLockedSkillLinkSlots();
    save();
    if (typeof SkillBoardPanel !== 'undefined') SkillBoardPanel.refresh?.();
  }

  function currentJobId() {
    ensureHydrated();
    return state.currentJobId;
  }

  function setJobId(jobId) {
    ensureHydrated();
    state.currentJobId = resolveJobId(jobId);
    ensureDefaults();
    save();
  }

  function listJobLines() {
    const all = typeof SkillCatalog !== 'undefined' ? SkillCatalog.lines() : {};
    return JOB_LINE_ORDER
      .filter((key) => all[key])
      .map((key) => ({ key, ...all[key] }));
  }

  function needsJobLinePick() {
    ensureHydrated();
    return !jobLineChosen;
  }

  function needsIdleStarterGrant() {
    ensureHydrated();
    return jobLineChosen && !idleStarterGranted;
  }

  function markIdleStarterGranted() {
    ensureHydrated();
    if (idleStarterGranted) return;
    idleStarterGranted = true;
    save();
  }

  function syncCombatJobName(lineKey) {
    const name = COMBAT_JOB_BY_LINE[lineKey];
    if (!name || typeof CharacterCombatPanel === 'undefined') return;
    if (typeof CharacterCombatPanel.setJobName === 'function') {
      CharacterCombatPanel.setJobName(name);
    }
  }

  function getCombatJobNameForCurrentLine() {
    const key = getCurrentJobLineKey();
    return COMBAT_JOB_BY_LINE[key] || '';
  }

  function getCombatJobNameForLine(lineKey) {
    const key = String(lineKey || '').trim();
    return COMBAT_JOB_BY_LINE[key] || '';
  }

  function applyJobLine(lineKey) {
    ensureHydrated();
    const key = String(lineKey || '').trim();
    const all = typeof SkillCatalog !== 'undefined' ? SkillCatalog.lines() : {};
    const line = all[key];
    if (!line?.primaryJobId) return false;
    state.currentJobId = resolveJobId(line.primaryJobId);
    state.levels = {};
    state.equipped = { 1: emptyLoadout(), 2: emptyLoadout(), 3: emptyLoadout() };
    state.skillLinks = { 1: emptySkillLink(), 2: emptySkillLink(), 3: emptySkillLink() };
    state.activePreset = 1;
    jobLineChosen = true;
    ensureDefaults();
    syncCombatJobName(key);
    save();
    if (typeof SkillBoardPanel !== 'undefined') SkillBoardPanel.refresh?.();
    if (typeof SkillCombat !== 'undefined') SkillCombat.reset?.();
    if (typeof CharacterCombatPanel !== 'undefined') {
      CharacterCombatPanel.syncToCombatPower?.();
    }
    if (typeof UiCharacterInfo !== 'undefined') UiCharacterInfo.refresh?.();
    if (typeof AppNavSidebar !== 'undefined') AppNavSidebar.refreshProfile?.();
    return true;
  }

  function getCurrentJobLineKey() {
    ensureHydrated();
    if (typeof SkillCatalog === 'undefined') return '';
    const line = SkillCatalog.getJobLine?.(state.currentJobId);
    return line?.id ? String(line.id) : '';
  }

  /** 自由轉職消耗（ETC + 楓幣） */
  const JOB_CHANGE_COST = {
    meso: 5,
    etc: { id: 'job_change_ticket', amount: 0 },
  };

  function getJobChangeCost() {
    return {
      meso: Math.max(0, Math.floor(Number(JOB_CHANGE_COST.meso) || 0)),
      etcId: String(JOB_CHANGE_COST.etc?.id || ''),
      etcAmount: Math.max(0, Math.floor(Number(JOB_CHANGE_COST.etc?.amount) || 0)),
    };
  }

  function isJobChangeCombatBusy() {
    if (typeof IdleBoss !== 'undefined') {
      if (IdleBoss.isArenaOpen?.() || IdleBoss.isRunning?.()) return true;
    }
    if (typeof IdleHunt !== 'undefined' && IdleHunt.isRunning?.()) return true;
    return false;
  }

  function canAffordJobChange() {
    const cost = getJobChangeCost();
    if (cost.etcId && cost.etcAmount > 0) {
      const have = typeof InventoryModule !== 'undefined'
        ? InventoryModule.countEtc?.(cost.etcId) || 0
        : 0;
      if (have < cost.etcAmount) return false;
    }
    if (cost.meso > 0) {
      if (typeof isIdlePlayMode === 'function' && isIdlePlayMode()) {
        const have = typeof getIdleHeldMeso === 'function' ? getIdleHeldMeso() : 0;
        if (have < cost.meso) return false;
      }
    }
    return true;
  }

  function spendJobChangeCost() {
    const cost = getJobChangeCost();
    if (!canAffordJobChange()) return false;
    if (cost.meso > 0) {
      if (typeof trySpendIdleMeso === 'function') {
        if (!trySpendIdleMeso(cost.meso, { silent: true })) return false;
      }
    }
    if (cost.etcId && cost.etcAmount > 0) {
      if (typeof InventoryModule === 'undefined' || !InventoryModule.takeEtc?.(cost.etcId, cost.etcAmount)) {
        return false;
      }
    }
    return true;
  }

  /**
   * 安全自由轉職：戰鬥閘門 → 扣費 → applyJobLine → 重置 AP。
   * @returns {{ ok: boolean, reason?: string }}
   */
  function changeJobLineSafely(lineKey) {
    ensureHydrated();
    const key = String(lineKey || '').trim();
    const all = typeof SkillCatalog !== 'undefined' ? SkillCatalog.lines() : {};
    if (!all[key]?.primaryJobId) return { ok: false, reason: 'invalid_job' };
    if (needsJobLinePick()) return { ok: false, reason: 'need_first_pick' };
    if (key === getCurrentJobLineKey()) return { ok: false, reason: 'same_job' };
    if (isJobChangeCombatBusy()) return { ok: false, reason: 'in_combat' };
    if (!canAffordJobChange()) return { ok: false, reason: 'cannot_afford' };
    if (!spendJobChangeCost()) return { ok: false, reason: 'spend_fail' };
    if (!applyJobLine(key)) return { ok: false, reason: 'apply_fail' };
    if (typeof CharacterProgression !== 'undefined') {
      CharacterProgression.resetAp?.({
        jobName: getCombatJobNameForLine(key) || COMBAT_JOB_BY_LINE[key] || '',
      });
    }
    if (typeof SessionPersistenceModule !== 'undefined') {
      SessionPersistenceModule.scheduleSave?.();
    }
    return { ok: true };
  }

  function resetDefault() {
    state.currentJobId = DEFAULT_JOB_ID;
    state.levels = {};
    state.equipped = { 1: emptyLoadout(), 2: emptyLoadout(), 3: emptyLoadout() };
    state.skillLinks = { 1: emptySkillLink(), 2: emptySkillLink(), 3: emptySkillLink() };
    state.activePreset = 1;
    jobLineChosen = false;
    idleStarterGranted = false;
    try { localStorage.removeItem(STORAGE_KEY); } catch (_) { /* ignore */ }
    ensureDefaults();
    save();
    if (typeof SkillBoardPanel !== 'undefined') SkillBoardPanel.refresh?.();
    if (typeof SkillCombat !== 'undefined') SkillCombat.reset?.();
    if (typeof CharacterCombatPanel !== 'undefined') {
      CharacterCombatPanel.syncToCombatPower?.();
    }
    if (typeof UiCharacterInfo !== 'undefined') UiCharacterInfo.refresh?.();
  }

  function getLevel(skillId) {
    ensureHydrated();
    const raw = String(skillId || '');
    const canon = (typeof SkillCatalog !== 'undefined' && typeof SkillCatalog.resolveSkillId === 'function')
      ? SkillCatalog.resolveSkillId(raw)
      : raw;
    const a = Math.max(0, Number(state.levels[canon]) || 0);
    if (a > 0) return a;
    // 舊存檔可能寫在別名 ID（例 2200012）
    if (raw && raw !== canon) {
      return Math.max(0, Number(state.levels[raw]) || 0);
    }
    return 0;
  }

  function currentLoadout() {
    ensureHydrated();
    const p = state.activePreset;
    return state.equipped[p] || emptyLoadout();
  }

  function currentSkillLink() {
    ensureHydrated();
    const p = state.activePreset;
    return state.skillLinks[p] || emptySkillLink();
  }

  function canPlaceInSkillLink(skillId) {
    ensureHydrated();
    if (!isSkillUnlocked(skillId)) return false;
    if (isAddAttackFollowup(skillId)) return false;
    if (isSkillSuperseded(skillId)) return false;
    const skill = typeof SkillCatalog !== 'undefined'
      ? SkillCatalog.getSkill(skillId)
      : null;
    if (!skill || skill.type !== 'active' || !skill.equipable) return false;
    const lv = Math.max(1, getLevel(skillId) || 1);
    if (typeof SkillFormula === 'undefined') return true;
    const common = SkillFormula.evalCommon(skill.common || {}, lv);
    return !(Number(common?.cooltimeSec) > 0);
  }

  /** 接技鏈後續技（月光翻轉／最終一擊等）：不可裝備，只能由頭技自動接 */
  function isAddAttackFollowup(skillId) {
    return typeof SkillCatalog !== 'undefined'
      && typeof SkillCatalog.isAddAttackFollowup === 'function'
      && SkillCatalog.isAddAttackFollowup(skillId);
  }

  /** 已被強化替換技取代（例：已學進階光速雙擊 → 光速雙擊不可再用） */
  function isSkillSuperseded(skillId) {
    ensureHydrated();
    const replacer = typeof SkillCatalog !== 'undefined'
      ? SkillCatalog.getSkillReplacer?.(skillId)
      : null;
    if (!replacer) return false;
    return getLevel(replacer) > 0;
  }

  /**
   * 戰鬥／裝備用：若有已學強化替換，改為強化技 id。
   */
  function resolveCombatSkillId(skillId) {
    ensureHydrated();
    const id = String(skillId || '');
    if (!id) return id;
    const replacer = typeof SkillCatalog !== 'undefined'
      ? SkillCatalog.getSkillReplacer?.(id)
      : null;
    if (replacer && getLevel(replacer) > 0) return String(replacer);
    return id;
  }

  /** 無 CD 主動攻擊：可進技能連鎖，且 common 有傷害％ */
  function isNoCdActiveAttackSkill(skillId, opts = {}) {
    const requireUnlock = opts.requireUnlock !== false;
    ensureHydrated();
    if (requireUnlock && !isSkillUnlocked(skillId)) return false;
    if (isAddAttackFollowup(skillId)) return false;
    if (isSkillSuperseded(skillId)) return false;
    const skill = typeof SkillCatalog !== 'undefined'
      ? SkillCatalog.getSkill(skillId)
      : null;
    if (!skill || skill.type !== 'active' || !skill.equipable) return false;
    const lv = Math.max(1, getLevel(skillId) || 1);
    if (typeof SkillFormula === 'undefined') return true;
    const common = SkillFormula.evalCommon(skill.common || {}, lv);
    if (Number(common?.cooltimeSec) > 0) return false;
    return Number(common?.damagePct) > 0;
  }

  /**
   * 無 CD 主動攻擊只進技能連鎖：塞進第一個已解鎖空格。
   * 已在連鎖中回傳 true；連鎖已滿回傳 false。
   */
  function autoEquipToSkillLink(skillId) {
    ensureHydrated();
    const id = String(skillId || '');
    if (!id || !isNoCdActiveAttackSkill(id)) return false;
    const link = currentSkillLink();
    if (link.includes(id)) return true;
    for (let i = 0; i < link.length; i += 1) {
      if (!isSkillLinkSlotUnlocked(i)) continue;
      if (link[i]) continue;
      link[i] = id;
      return true;
    }
    return false;
  }

  /** 從九宮格清掉不應再出現的無 CD 主動攻擊技（舊存檔／誤放） */
  function pruneNoCdAttackFromLoadouts() {
    let changed = false;
    [1, 2, 3].forEach((p) => {
      const loadout = state.equipped[p];
      if (!Array.isArray(loadout)) return;
      for (let i = 0; i < loadout.length; i += 1) {
        const id = loadout[i];
        if (id && isNoCdActiveAttackSkill(id, { requireUnlock: false })) {
          loadout[i] = null;
          changed = true;
        }
      }
    });
    return changed;
  }

  /** 接技後續技不可裝備／連鎖：清九宮格與技能連鎖 */
  function pruneAddAttackFollowups() {
    let changed = false;
    [1, 2, 3].forEach((p) => {
      const loadout = state.equipped[p];
      if (Array.isArray(loadout)) {
        for (let i = 0; i < loadout.length; i += 1) {
          const id = loadout[i];
          if (id && isAddAttackFollowup(id)) {
            loadout[i] = null;
            changed = true;
          }
        }
      }
      const link = state.skillLinks[p];
      if (Array.isArray(link)) {
        for (let i = 0; i < link.length; i += 1) {
          const id = link[i];
          if (id && isAddAttackFollowup(id)) {
            link[i] = null;
            changed = true;
          }
        }
      }
    });
    return changed;
  }

  /** 強化替換：已學進階時，欄位／連鎖中的舊技改為進階或清掉重複 */
  function pruneSupersededSkills() {
    let changed = false;
    const migrateSlot = (arr, i) => {
      const id = arr[i];
      if (!id) return;
      const replacer = typeof SkillCatalog !== 'undefined'
        ? SkillCatalog.getSkillReplacer?.(id)
        : null;
      if (!replacer || !(getLevel(replacer) > 0)) return;
      const already = arr.indexOf(String(replacer));
      if (already >= 0 && already !== i) {
        arr[i] = null;
      } else {
        arr[i] = String(replacer);
      }
      changed = true;
    };
    [1, 2, 3].forEach((p) => {
      const loadout = state.equipped[p];
      if (Array.isArray(loadout)) {
        for (let i = 0; i < loadout.length; i += 1) migrateSlot(loadout, i);
      }
      const link = state.skillLinks[p];
      if (Array.isArray(link)) {
        for (let i = 0; i < link.length; i += 1) migrateSlot(link, i);
      }
    });
    return changed;
  }

  function setSkillLinkSlot(slotIndex, skillId) {
    ensureHydrated();
    const i = Number(slotIndex);
    if (!Number.isFinite(i) || i < 0 || i > 3) return false;
    if (!isSkillLinkSlotUnlocked(i)) return false;
    const link = currentSkillLink();
    if (skillId == null || skillId === '') {
      link[i] = null;
      save();
      warmCombatFxIfNeeded();
      return true;
    }
    const id = String(skillId);
    if (!canPlaceInSkillLink(id)) return false;
    for (let j = 0; j < link.length; j += 1) {
      if (j !== i && link[j] === id) link[j] = null;
    }
    link[i] = id;
    save();
    warmCombatFxIfNeeded();
    return true;
  }

  function clearSkillLinkSlot(slotIndex) {
    return setSkillLinkSlot(slotIndex, null);
  }

  function isInSkillLink(skillId) {
    return currentSkillLink().includes(String(skillId));
  }

  function setActivePreset(preset) {
    ensureHydrated();
    state.activePreset = Math.max(1, Math.min(3, Number(preset) || 1));
    save();
  }

  function getActivePreset() {
    ensureHydrated();
    return state.activePreset;
  }

  function isEquipped(skillId) {
    const id = String(skillId);
    // 無 CD 主動攻擊改走技能連鎖，九宮格不再算裝備中
    if (isNoCdActiveAttackSkill(id)) return isInSkillLink(id);
    return currentLoadout().includes(id);
  }

  function warmCombatFxIfNeeded() {
    try { SkillEffectPlayer.warmUpCombatLoadout?.(); } catch (_) { /* ignore */ }
  }

  function toggleEquip(skillId) {
    ensureHydrated();
    const skill = SkillCatalog.getSkill(skillId);
    if (!skill || !skill.equipable) return false;
    if (getLevel(skillId) <= 0) return false;
    let id = String(skillId);

    // 已被強化替換：改裝進階技
    if (isSkillSuperseded(id)) {
      const replacer = SkillCatalog.getSkillReplacer?.(id);
      if (!replacer) return false;
      id = String(replacer);
    }

    // 裝強化技時卸下被取代的舊技
    const replaced = SkillCatalog.getReplacedSkillId?.(id);
    if (replaced) {
      const loadout = currentLoadout();
      const gridIdx = loadout.indexOf(String(replaced));
      if (gridIdx >= 0) loadout[gridIdx] = null;
      if (isInSkillLink(replaced)) {
        const link = currentSkillLink();
        for (let i = 0; i < link.length; i += 1) {
          if (link[i] === String(replaced)) link[i] = null;
        }
      }
    }

    // 接技後續：不可裝備；若舊存檔已裝則卸下
    if (isAddAttackFollowup(id)) {
      let changed = false;
      const loadout = currentLoadout();
      const gridIdx = loadout.indexOf(id);
      if (gridIdx >= 0) {
        loadout[gridIdx] = null;
        changed = true;
      }
      if (isInSkillLink(id)) {
        const link = currentSkillLink();
        for (let i = 0; i < link.length; i += 1) {
          if (link[i] === id) link[i] = null;
        }
        changed = true;
      }
      if (changed) {
        save();
        warmCombatFxIfNeeded();
      }
      return false;
    }

    // 無 CD 主動攻擊：只進出技能連鎖，不進九宮格
    if (isNoCdActiveAttackSkill(id)) {
      const loadout = currentLoadout();
      const gridIdx = loadout.indexOf(id);
      if (gridIdx >= 0) loadout[gridIdx] = null;

      if (isInSkillLink(id)) {
        const link = currentSkillLink();
        for (let i = 0; i < link.length; i += 1) {
          if (link[i] === id) link[i] = null;
        }
        save();
        warmCombatFxIfNeeded();
        return true;
      }
      if (!autoEquipToSkillLink(id)) return false;
      save();
      warmCombatFxIfNeeded();
      return true;
    }

    const loadout = currentLoadout();
    const idx = loadout.indexOf(id);
    if (idx >= 0) {
      loadout[idx] = null;
      save();
      warmCombatFxIfNeeded();
      return true;
    }
    const empty = loadout.findIndex((x) => !x);
    if (empty < 0) return false;
    loadout[empty] = id;
    save();
    warmCombatFxIfNeeded();
    return true;
  }

  function unequipSlot(slotIndex) {
    ensureHydrated();
    const loadout = currentLoadout();
    const i = Number(slotIndex);
    if (!Number.isFinite(i) || i < 0 || i > 8) return false;
    if (!loadout[i]) return false;
    loadout[i] = null;
    save();
    return true;
  }

  function levelUp(skillId) {
    ensureHydrated();
    const skill = SkillCatalog.getSkill(skillId);
    if (!skill) return false;
    if (!isSkillUnlocked(skillId)) return false;
    const lv = getLevel(skillId);
    if (lv >= skill.maxLevel) return false;
    const rank = resolveSkillRank(skill);
    if (!rank) return false;
    if (getSpRemainingForRank(rank) <= 0) return false;
    const canon = (typeof SkillCatalog !== 'undefined' && typeof SkillCatalog.resolveSkillId === 'function')
      ? SkillCatalog.resolveSkillId(skillId)
      : String(skillId);
    state.levels[canon] = lv + 1;
    if (String(skillId) !== canon) delete state.levels[String(skillId)];
    pruneSupersededSkills();
    save();
    if (typeof CharacterCombatPanel !== 'undefined') {
      CharacterCombatPanel.syncToCombatPower?.();
    }
    if (typeof UiCharacterInfo !== 'undefined') UiCharacterInfo.refresh?.();
    return true;
  }

  function resetSkillPoints(rank) {
    ensureHydrated();
    const rankKey = rank != null && String(rank) !== '' ? String(rank) : null;
    const targets = rankKey
      ? lineSkills().filter((s) => String(s.rank) === rankKey)
      : lineSkills();
    targets.forEach((s) => {
      const id = String(s.id);
      state.levels[id] = 0;
    });
    save();
    if (typeof CharacterCombatPanel !== 'undefined') {
      CharacterCombatPanel.syncToCombatPower?.();
    }
    if (typeof UiCharacterInfo !== 'undefined') UiCharacterInfo.refresh?.();
  }

  function getPanelSkills(rank, type) {
    ensureHydrated();
    return SkillCatalog.listSkills(state.currentJobId, { rank, type }).map((s) => ({
      ...s,
      level: getLevel(s.id),
      unlocked: isSkillUnlocked(s.id),
    }));
  }

  function getSpRemaining(rank) {
    ensureHydrated();
    const rankKey = rank != null && String(rank) !== '' ? String(rank) : '10';
    return getSpRemainingForRank(rankKey);
  }

  function getSpTotal(rank) {
    ensureHydrated();
    if (typeof SkillPoints === 'undefined') return 0;
    const rankKey = rank != null && String(rank) !== '' ? String(rank) : '10';
    return SkillPoints.totalSpEarnedForRank(
      state.currentJobId,
      rankKey,
      characterLevel(),
    );
  }

  function getSpSpent(rank) {
    ensureHydrated();
    if (typeof SkillPoints === 'undefined') return 0;
    const rankKey = rank != null && String(rank) !== '' ? String(rank) : '10';
    return SkillPoints.spentSpForRank(state.levels, state.currentJobId, rankKey);
  }

  function getJobLabel() {
    ensureHydrated();
    if (typeof SkillCatalog !== 'undefined' && SkillCatalog.jobLabel) {
      return SkillCatalog.jobLabel(state.currentJobId) || '劍士';
    }
    return SkillCatalog.getJobBook(state.currentJobId)?.name || '劍士';
  }

  return {
    emptyLoadout,
    emptySkillLink,
    currentJobId,
    setJobId,
    getLevel,
    currentLoadout,
    currentSkillLink,
    canPlaceInSkillLink,
    isNoCdActiveAttackSkill,
    isAddAttackFollowup,
    isSkillSuperseded,
    resolveCombatSkillId,
    autoEquipToSkillLink,
    setSkillLinkSlot,
    clearSkillLinkSlot,
    isInSkillLink,
    setActivePreset,
    getActivePreset,
    isEquipped,
    toggleEquip,
    unequipSlot,
    levelUp,
    resetSkillPoints,
    getPanelSkills,
    getSpRemaining,
    getSpTotal,
    getSpSpent,
    isSkillUnlocked,
    isRankUnlocked,
    skillLinkSlotRequiredLevel,
    isSkillLinkSlotUnlocked,
    onCharacterLevelUp,
    getJobLabel,
    ensureHydrated,
    listJobLines,
    needsJobLinePick,
    needsIdleStarterGrant,
    markIdleStarterGranted,
    applyJobLine,
    getCurrentJobLineKey,
    getCombatJobNameForCurrentLine,
    getCombatJobNameForLine,
    getJobChangeCost,
    canAffordJobChange,
    isJobChangeCombatBusy,
    changeJobLineSafely,
    resetDefault,
  };
})();

if (typeof window !== 'undefined') {
  window.CharacterSkills = CharacterSkills;
}
