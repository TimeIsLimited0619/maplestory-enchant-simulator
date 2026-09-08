/**
 * 角色等級／AP／極限屬性點數。
 * AP：每次升級 +5（放置狩獵之後接上）。
 * 極限屬性：140 級起依官方表給點；升一階消耗見 HYPER_LEVEL_COST（16+ 外推）。
 */
const CharacterProgression = (() => {
  const STORAGE_KEY = 'uci.progression.v1';
  const AP_PER_LEVEL = 5;
  const AP_HP_PER_POINT = 15;
  const AP_MP_PER_POINT = 15;
  /** 1 等未配點時 STR/DEX/INT/LUK 的基礎值 */
  const AP_BASE_STAT = 5;
  /** 單一極限屬性等級上限 */
  const HYPER_MAX_LEVEL = 100;

  function storageKey() {
    const idle = (typeof SessionPersistenceModule !== 'undefined'
      && SessionPersistenceModule.activeProfile === 'idle')
      || (typeof AppMode !== 'undefined' && AppMode.isIdle?.());
    return idle ? `${STORAGE_KEY}.idle` : STORAGE_KEY;
  }

  function defaultAp() {
    return { hp: 0, mp: 0, str: 0, dex: 0, int: 0, luk: 0 };
  }

  /**
   * 升到該極限屬性等級需再花的點（index = 目標等級）。
   * 1～15：官方表；16+：延續 10→15 每級 +15 斜率 → cost = 15×L − 115。
   */
  const HYPER_LEVEL_COST_BASE = [0, 1, 2, 4, 8, 10, 15, 20, 25, 30, 35, 50, 65, 80, 95, 110];

  function hyperLevelCost(level) {
    const lv = Math.floor(Number(level) || 0);
    if (lv <= 0) return 0;
    if (lv < HYPER_LEVEL_COST_BASE.length) return HYPER_LEVEL_COST_BASE[lv];
    if (lv > HYPER_MAX_LEVEL) return 0;
    return 15 * lv - 115;
  }

  const HYPER_LEVEL_COST = (() => {
    const arr = [0];
    for (let i = 1; i <= HYPER_MAX_LEVEL; i++) arr[i] = hyperLevelCost(i);
    return arr;
  })();

  const HYPER_KEYS = [
    'str', 'dex', 'int', 'luk', 'hp', 'mp', 'df',
    'critRate', 'critDmg', 'ied', 'dmg', 'boss', 'normal',
    'status', 'atk', 'exp', 'arcane',
  ];

  const HYPER_ROWS = [
    { key: 'str', skillId: '80000400', max: HYPER_MAX_LEVEL, label: 'STR' },
    { key: 'dex', skillId: '80000401', max: HYPER_MAX_LEVEL, label: 'DEX' },
    { key: 'int', skillId: '80000402', max: HYPER_MAX_LEVEL, label: 'INT' },
    { key: 'luk', skillId: '80000403', max: HYPER_MAX_LEVEL, label: 'LUK' },
    { key: 'hp', skillId: '80000404', max: HYPER_MAX_LEVEL, label: 'HP' },
    { key: 'mp', skillId: '80000405', max: HYPER_MAX_LEVEL, label: 'MP' },
    { key: 'df', skillId: '80000406', max: HYPER_MAX_LEVEL, label: 'DF / TF' },
    { key: 'critRate', skillId: '80000409', max: HYPER_MAX_LEVEL, label: '爆擊機率' },
    { key: 'critDmg', skillId: '80000410', max: HYPER_MAX_LEVEL, label: '爆擊傷害' },
    { key: 'ied', skillId: '80000412', max: HYPER_MAX_LEVEL, label: '無視防禦率' },
    { key: 'dmg', skillId: '80000413', max: HYPER_MAX_LEVEL, label: '傷害' },
    { key: 'boss', skillId: '80000414', max: HYPER_MAX_LEVEL, label: 'Boss傷害' },
    { key: 'normal', skillId: '80000422', max: HYPER_MAX_LEVEL, label: '一般傷害' },
    { key: 'status', skillId: '80000416', max: HYPER_MAX_LEVEL, label: '狀態異常耐性' },
    { key: 'atk', skillId: '80000419', max: HYPER_MAX_LEVEL, label: '攻擊力/魔法攻擊力' },
    { key: 'exp', skillId: '80000420', max: HYPER_MAX_LEVEL, label: '獲得經驗值' },
    { key: 'arcane', skillId: '80000421', max: HYPER_MAX_LEVEL, label: '神秘力量' },
  ];

  function emptyHyper() {
    const row = {};
    HYPER_KEYS.forEach((key) => { row[key] = 0; });
    return row;
  }

  const state = {
    level: 1,
    exp: 0,
    ap: { hp: 0, mp: 0, str: 0, dex: 0, int: 0, luk: 0 },
    apInstant: true,
    apInstantDefaultOn: true,
    hyperPreset: 0,
    hyperPresets: [emptyHyper(), emptyHyper(), emptyHyper()],
    /** 商店等額外購入的極限屬性點（永久，重設配點不扣回） */
    hyperExtraPoints: 0,
  };

  function clampInt(n, min, max) {
    const v = Math.floor(Number(n) || 0);
    return Math.max(min, Math.min(max, v));
  }

  function hyperGainAt(level) {
    const lv = Math.floor(level);
    if (lv < 140 || lv > 300) return 0;
    if (lv === 300) return 19;
    return 3 + Math.floor((lv - 140) / 10);
  }

  function hyperTotalAt(level) {
    const lv = clampInt(level, 1, 300);
    let total = 0;
    for (let i = 140; i <= lv; i++) total += hyperGainAt(i);
    return total;
  }

  function hyperCostToReach(level) {
    const lv = clampInt(level, 0, HYPER_MAX_LEVEL);
    let sum = 0;
    for (let i = 1; i <= lv; i++) sum += hyperLevelCost(i);
    return sum;
  }

  function hyperSpent(preset) {
    return HYPER_ROWS.reduce((sum, row) => sum + hyperCostToReach(preset[row.key] || 0), 0);
  }

  function hyperBonusAt(key, level) {
    const lv = clampInt(level, 0, HYPER_MAX_LEVEL);
    if (!lv) return 0;
    if (key === 'str' || key === 'dex' || key === 'int' || key === 'luk') return lv * 30;
    if (key === 'hp' || key === 'mp') return lv * 2;
    if (key === 'df') return lv * 10;
    if (key === 'critRate') return lv <= 5 ? lv : 5 + (lv - 5) * 2;
    if (key === 'critDmg') return lv;
    if (key === 'ied' || key === 'dmg') return lv * 3;
    if (key === 'boss' || key === 'normal') return lv <= 5 ? lv * 3 : 15 + (lv - 5) * 4;
    if (key === 'status') return lv <= 5 ? lv : 5 + (lv - 5) * 2;
    if (key === 'atk') return lv * 3;
    if (key === 'exp') return lv <= 10 ? lv * 0.5 : 5 + (lv - 10);
    if (key === 'arcane') return lv <= 10 ? lv * 5 : 50 + (lv - 10) * 10;
    return 0;
  }

  function load() {
    try {
      const raw = JSON.parse(localStorage.getItem(storageKey()) || 'null');
      if (!raw) return;
      if (Number.isFinite(raw.level)) state.level = clampInt(raw.level, 1, 300);
      if (Number.isFinite(raw.exp) && raw.exp >= 0) state.exp = Number(raw.exp);
      if (raw.ap && typeof raw.ap === 'object') {
        ['hp', 'mp', 'str', 'dex', 'int', 'luk'].forEach((key) => {
          state.ap[key] = clampInt(raw.ap[key], 0, 99999);
        });
      }
      state.apInstant = raw.apInstantDefaultOn ? !!raw.apInstant : true;
      state.apInstantDefaultOn = true;
      if (Number.isInteger(raw.hyperPreset)) state.hyperPreset = clampInt(raw.hyperPreset, 0, 2);
      if (Array.isArray(raw.hyperPresets)) {
        raw.hyperPresets.slice(0, 3).forEach((preset, i) => {
          HYPER_KEYS.forEach((key) => {
            const row = HYPER_ROWS.find((item) => item.key === key);
            state.hyperPresets[i][key] = clampInt(preset?.[key], 0, row?.max || HYPER_MAX_LEVEL);
          });
        });
      }
      if (Number.isFinite(raw.hyperExtraPoints)) {
        state.hyperExtraPoints = Math.max(0, Math.floor(Number(raw.hyperExtraPoints) || 0));
      }
    } catch (_) { /* ignore */ }
    const need = typeof MapleExpTable !== 'undefined' ? MapleExpTable.expToNext(state.level) : 0;
    if (state.level >= 300 || !(need > 0)) state.exp = 0;
    else if (state.exp >= need) state.exp = need * 0.999;
  }

  function save() {
    try {
      localStorage.setItem(storageKey(), JSON.stringify(state));
    } catch (_) { /* ignore */ }
  }

  function notify() {
    save();
    if (typeof CharacterCombatPanel !== 'undefined') CharacterCombatPanel.syncToCombatPower?.();
    if (typeof UiCharacterInfo !== 'undefined') UiCharacterInfo.refresh?.();
    if (typeof UiHyperStat !== 'undefined') UiHyperStat.refresh?.();
    if (typeof UiApDistribution !== 'undefined') UiApDistribution.refresh?.();
    if (typeof IdleHunt !== 'undefined'
      && (typeof AppMode === 'undefined' || AppMode.isIdle?.())) {
      IdleHunt.refreshDisplay?.();
    }
    // 等級變動時刷新商店可購清單
    if (typeof UiNpcShop !== 'undefined' && UiNpcShop.isOpen?.()) UiNpcShop.render?.();
  }

  function notifyExpOnly() {
    save();
    if (typeof UiApDistribution !== 'undefined') UiApDistribution.refresh?.();
  }

  function expToNext() {
    if (typeof MapleExpTable === 'undefined') return 0;
    return MapleExpTable.expToNext(state.level);
  }

  function expProgress() {
    if (state.level >= 300) return 1;
    const need = expToNext();
    if (!(need > 0)) return 1;
    return Math.max(0, Math.min(1, state.exp / need));
  }

  function addExp(amount) {
    let left = Number(amount);
    if (!(left > 0) || state.level >= 300) {
      return { levels: 0, leftover: 0 };
    }
    const before = state.level;
    while (left > 0 && state.level < 300) {
      const need = expToNext();
      const remain = Math.max(0, need - state.exp);
      if (!(remain > 0)) {
        state.level = clampInt(state.level + 1, 1, 300);
        state.exp = 0;
        continue;
      }
      if (left >= remain) {
        left -= remain;
        state.level += 1;
        state.exp = 0;
      } else {
        state.exp += left;
        left = 0;
      }
    }
    if (state.level >= 300) {
      state.level = 300;
      state.exp = 0;
    }
    const levels = state.level - before;
    if (levels > 0) afterLevelGain(levels);
    else notifyExpOnly();
    return { levels, leftover: left };
  }

  /** 依升等所需經驗扣比例；不降等，EXP 最低為 0 */
  function loseExpPercent(rate) {
    const pct = Number(rate);
    if (!(pct > 0) || state.level >= 300) {
      return { lost: 0, rate: 0 };
    }
    const need = expToNext();
    if (!(need > 0)) return { lost: 0, rate: pct };
    const want = Math.max(1, Math.ceil(need * pct));
    const before = Math.max(0, Number(state.exp) || 0);
    const lost = Math.min(before, want);
    if (!(lost > 0)) return { lost: 0, rate: pct };
    state.exp = Math.max(0, before - lost);
    notifyExpOnly();
    if (typeof IdleHunt !== 'undefined') IdleHunt.refreshDisplay?.();
    return { lost, rate: pct };
  }

  function afterLevelGain(gained) {
    if (!(gained > 0)) return;
    if (typeof LevelUpEffect !== 'undefined') {
      LevelUpEffect.playOnHuntPlayer?.(gained);
    }
    if (typeof CharacterSkills !== 'undefined') {
      CharacterSkills.onCharacterLevelUp?.();
    }
    if (state.apInstant) autoAssignAp();
    else notify();
    if (typeof IdleHunt !== 'undefined') IdleHunt.healToFull?.();
  }

  function addHuntExp(base, mobLevel) {
    const n = Number(base);
    if (!(n > 0) || state.level >= 300) {
      return { levels: 0, gained: 0, multiplier: 1 };
    }
    const hyperExp = hyperBonusAt('exp', activeHyper().exp);
    let levelDiffMult = 1;
    if (typeof MapleExpTable !== 'undefined'
      && typeof MapleExpTable.levelDiffExpMultiplier === 'function'
      && Number.isFinite(Number(mobLevel))) {
      levelDiffMult = MapleExpTable.levelDiffExpMultiplier(state.level, mobLevel);
    }
    const gained = n * levelDiffMult * (1 + hyperExp / 100);
    const result = addExp(gained);
    return { levels: result.levels, gained, multiplier: levelDiffMult };
  }

  function addKillExp() {
    if (state.level >= 300 || typeof MapleExpTable === 'undefined') {
      return { levels: 0, gained: 0 };
    }
    const need = expToNext();
    const rate = MapleExpTable.killExpRate(state.level);
    const hyperExp = hyperBonusAt('exp', activeHyper().exp);
    const gained = need * rate * (1 + hyperExp / 100);
    const result = addExp(gained);
    return { levels: result.levels, gained };
  }

  function totalAp() {
    return Math.max(0, state.level - 1) * AP_PER_LEVEL;
  }

  function spentAp() {
    return Object.values(state.ap).reduce((sum, n) => sum + (Number(n) || 0), 0);
  }

  function remainAp() {
    return Math.max(0, totalAp() - spentAp());
  }

  function activeHyper() {
    return state.hyperPresets[state.hyperPreset];
  }

  function remainHyper() {
    return Math.max(0, hyperAvailableTotal() - hyperSpent(activeHyper()));
  }

  function hyperExtraTotal() {
    return Math.max(0, Math.floor(Number(state.hyperExtraPoints) || 0));
  }

  /** 等級給點 + 商店購入點 */
  function hyperAvailableTotal() {
    return hyperTotalAt(state.level) + hyperExtraTotal();
  }

  /** 購入極限屬性點（永久加池；重設配點不會扣掉） */
  function grantHyperPoints(amount = 1) {
    const add = Math.max(0, Math.floor(Number(amount) || 0));
    if (!add) return 0;
    state.hyperExtraPoints = hyperExtraTotal() + add;
    notify();
    return add;
  }

  function addAp(statKey, amount = 1) {
    if (!Object.prototype.hasOwnProperty.call(state.ap, statKey)) return false;
    const add = Math.floor(amount);
    if (add <= 0 || remainAp() < add) return false;
    state.ap[statKey] += add;
    notify();
    return true;
  }

  function autoAssignAp(opts = {}) {
    const forcedJobName = typeof opts === 'string' ? opts : (opts?.jobName || '');
    const left = remainAp();
    if (left <= 0) return false;

    let main = 'str';
    if (typeof CombatJobs !== 'undefined') {
      let jobName = String(forcedJobName || '').trim();
      // 轉職後以技能線為準，避免戰鬥面板職業名缺資料時誤配成 STR
      if (!jobName && typeof CharacterSkills !== 'undefined') {
        jobName = CharacterSkills.getCombatJobNameForCurrentLine?.() || '';
      }
      if (!jobName && typeof CharacterCombatPanel !== 'undefined') {
        jobName = CharacterCombatPanel.getState?.()?.jobName || '';
      }
      const labels = CombatJobs.getJobStatLabelsByName?.(jobName) || {};
      const map = { STR: 'str', DEX: 'dex', INT: 'int', LUK: 'luk' };
      main = map[labels.main] || 'str';
      if (labels.secondSub) {
        const keys = [map[labels.main], map[labels.sub], map[labels.secondSub]].filter(Boolean);
        const each = Math.floor(left / keys.length);
        const extra = left - each * keys.length;
        keys.forEach((key, i) => { state.ap[key] += each + (i === 0 ? extra : 0); });
        notify();
        return true;
      }
    }
    state.ap[main] += left;
    notify();
    return true;
  }

  /** 清空已分配 AP（等級給點池保留）；可選立即依新職業主屬重配 */
  function resetAp(opts = {}) {
    state.ap = defaultAp();
    if (opts.autoAssign || (opts.autoAssign !== false && state.apInstant)) {
      autoAssignAp({ jobName: opts.jobName || '' });
      return true;
    }
    notify();
    return true;
  }

  function hyperCostBetween(fromLv, toLv) {
    const from = Math.max(0, Math.floor(fromLv) || 0);
    const to = Math.max(0, Math.floor(toLv) || 0);
    if (to <= from) return 0;
    let sum = 0;
    for (let i = from + 1; i <= to; i++) sum += hyperLevelCost(i);
    return sum;
  }

  function maxAffordableHyper(key) {
    const row = HYPER_ROWS.find((item) => item.key === key);
    if (!row) return 0;
    const cur = activeHyper()[key] || 0;
    let lv = cur;
    let remain = remainHyper();
    while (lv < row.max) {
      const cost = hyperLevelCost(lv + 1);
      if (remain < cost) break;
      remain -= cost;
      lv += 1;
    }
    return lv;
  }

  function setHyperLevel(key, targetLevel) {
    const row = HYPER_ROWS.find((item) => item.key === key);
    if (!row) return false;
    const preset = activeHyper();
    const cur = preset[key] || 0;
    const target = clampInt(targetLevel, 0, row.max);
    if (target === cur) return false;
    if (target < cur) {
      preset[key] = target;
      notify();
      return true;
    }
    const cost = hyperCostBetween(cur, target);
    if (remainHyper() < cost) return false;
    preset[key] = target;
    notify();
    return true;
  }

  function addHyperLevel(key, steps = 1) {
    const row = HYPER_ROWS.find((item) => item.key === key);
    if (!row) return false;
    const preset = activeHyper();
    let added = 0;
    for (let i = 0; i < steps; i++) {
      const next = (preset[key] || 0) + 1;
      if (next > row.max) break;
      const cost = hyperLevelCost(next);
      if (remainHyper() < cost) break;
      preset[key] = next;
      added += 1;
    }
    if (!added) return false;
    notify();
    return true;
  }

  function resetActiveHyper() {
    state.hyperPresets[state.hyperPreset] = emptyHyper();
    notify();
  }

  function setHyperPreset(index) {
    state.hyperPreset = clampInt(index, 0, 2);
    notify();
  }

  function addLevels(count = 1) {
    const add = Math.floor(count);
    if (add <= 0) return 0;
    const before = state.level;
    state.level = clampInt(state.level + add, 1, 300);
    state.exp = 0;
    const gained = state.level - before;
    afterLevelGain(gained);
    return gained;
  }

  function setLevel(level) {
    const before = state.level;
    state.level = clampInt(level, 1, 300);
    state.exp = 0;
    if (state.level > before) {
      afterLevelGain(state.level - before);
    } else {
      if (typeof CharacterSkills !== 'undefined') {
        CharacterSkills.onCharacterLevelUp?.();
      }
      notify();
    }
  }

  function apStat(key) {
    return AP_BASE_STAT + (Number(state.ap[key]) || 0);
  }

  /** 等級基礎 HP（未含 AP／裝備／技能） */
  function getLevelBaseHp(level) {
    const lv = Math.max(1, Number(level != null ? level : state.level) || 1);
    return 50 + Math.max(0, lv - 1) * 12;
  }

  function getCombatBonus(labels) {
    const hyper = activeHyper();
    const apKeyOf = (statLabel) => ({
      STR: 'str', DEX: 'dex', INT: 'int', LUK: 'luk',
    }[statLabel] || null);
    // AP 吃裝備％；極限屬性不吃％（noApply）
    const apOf = (statLabel) => {
      const k = apKeyOf(statLabel);
      return k ? apStat(k) : 0;
    };
    const hyperOf = (statLabel) => {
      const k = apKeyOf(statLabel);
      return k ? hyperBonusAt(k, hyper[k]) : 0;
    };
    return {
      apMain: apOf(labels?.main),
      apSub: apOf(labels?.sub),
      apSubtwo: apOf(labels?.secondSub),
      noApplyMain: hyperOf(labels?.main),
      noApplySub: hyperOf(labels?.sub),
      noApplySubtwo: hyperOf(labels?.secondSub),
      atk: hyperBonusAt('atk', hyper.atk),
      dmg: hyperBonusAt('dmg', hyper.dmg),
      bossDmg: hyperBonusAt('boss', hyper.boss),
      critDmg: hyperBonusAt('critDmg', hyper.critDmg),
      hp: state.ap.hp * AP_HP_PER_POINT,
      mp: state.ap.mp * AP_MP_PER_POINT,
      hpPercent: hyperBonusAt('hp', hyper.hp),
      mpPercent: hyperBonusAt('mp', hyper.mp),
      critRate: hyperBonusAt('critRate', hyper.critRate),
      ied: hyperBonusAt('ied', hyper.ied),
      normalDmg: hyperBonusAt('normal', hyper.normal),
      expPercent: hyperBonusAt('exp', hyper.exp),
      arcane: hyperBonusAt('arcane', hyper.arcane),
    };
  }

  function applyDefaults() {
    state.level = 1;
    state.exp = 0;
    state.ap = defaultAp();
    state.apInstant = true;
    state.apInstantDefaultOn = true;
    state.hyperPreset = 0;
    state.hyperPresets = [emptyHyper(), emptyHyper(), emptyHyper()];
    state.hyperExtraPoints = 0;
  }

  function reloadFromStorage() {
    applyDefaults();
    load();
    notify();
  }

  function resetDefault() {
    applyDefaults();
    notify();
  }

  load();

  return {
    AP_PER_LEVEL,
    AP_BASE_STAT,
    HYPER_MAX_LEVEL,
    HYPER_LEVEL_COST,
    HYPER_ROWS,
    hyperGainAt,
    hyperTotalAt,
    hyperLevelCost,
    hyperCostToReach,
    hyperBonusAt,
    getState: () => ({
      level: state.level,
      exp: state.exp,
      expToNext: expToNext(),
      expProgress: expProgress(),
      ap: { ...state.ap },
      apInstant: state.apInstant,
      hyperPreset: state.hyperPreset,
      hyper: { ...activeHyper() },
      hyperExtraPoints: hyperExtraTotal(),
    }),
    totalAp,
    remainAp,
    spentAp,
    remainHyper,
    hyperTotal: () => hyperAvailableTotal(),
    hyperExtraTotal,
    grantHyperPoints,
    addAp,
    apStat,
    getLevelBaseHp,
    autoAssignAp,
    resetAp,
    setApInstant(on) {
      state.apInstant = !!on;
      notify();
    },
    addHyperLevel,
    setHyperLevel,
    hyperCostBetween,
    maxAffordableHyper,
    resetActiveHyper,
    setHyperPreset,
    addLevels,
    setLevel,
    addExp,
    loseExpPercent,
    addHuntExp,
    addKillExp,
    expToNext,
    expProgress,
    save,
    reloadFromStorage,
    resetDefault,
    getCombatBonus,
  };
})();

if (typeof window !== 'undefined') window.CharacterProgression = CharacterProgression;
