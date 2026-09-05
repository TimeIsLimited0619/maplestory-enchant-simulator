/**
 * 技能點：10 等起每級給 SP；10／30／60／100 給 4 點，其餘 3 點。
 * SP 依 rank 分池；30／60／100 轉職等級同時注入前後兩階（例：30 等→10+30 各 +4）。
 * 101～200 等一般升級 SP 皆歸四轉（100）；Hyper 僅依 reqLevel 里程碑額外 +2（獨立池）。
 */
const SkillPoints = (() => {
  const SP_START_LEVEL = 10;
  const SP_BONUS_LEVELS = new Set([10, 30, 60, 100]);
  const SP_FOURTH_JOB_MAX_LEVEL = 200;
  const SP_RANK_ORDER = ['10', '30', '60', '100', 'hyper'];
  /** 每個 Hyper reqLevel 里程碑發放的 SP（原版 1，本專案再多發 1） */
  const HYPER_SP_PER_MILESTONE = 2;
  const RANK_LEVELS = {
    10: 10,
    30: 30,
    60: 60,
    100: 100,
    hyper: 140,
    hexa: 999,
  };

  function clampLevel(level) {
    return Math.max(1, Math.min(300, Math.floor(Number(level) || 1)));
  }

  /** 升到 level 當下獲得的 SP（level < 10 → 0） */
  function spGainForLevel(level) {
    const lv = Math.floor(Number(level) || 0);
    if (lv < SP_START_LEVEL) return 0;
    return SP_BONUS_LEVELS.has(lv) ? 4 : 3;
  }

  /**
   * 升到 level 當下，各 rank 池獲得的 SP 歸屬（可多池）
   * 10~29→[10]；30→[10,30]；31~59→[30]；60→[30,60]；61~99→[60]；
   * 100→[60,100]；101~200→[100]；201+→[100]；hyper 無一般升級 SP
   */
  function spRanksForLevel(level) {
    const lv = Math.floor(Number(level) || 0);
    if (lv < SP_START_LEVEL) return [];
    if (lv < 30) return ['10'];
    if (lv === 30) return ['10', '30'];
    if (lv < 60) return ['30'];
    if (lv === 60) return ['30', '60'];
    if (lv < 100) return ['60'];
    if (lv === 100) return ['60', '100'];
    if (lv <= SP_FOURTH_JOB_MAX_LEVEL) return ['100'];
    return ['100'];
  }

  /** @deprecated 請用 spRanksForLevel */
  function spRankForLevel(level) {
    const ranks = spRanksForLevel(level);
    return ranks.length ? ranks[0] : null;
  }

  function rankRequiredLevel(rank) {
    const key = rank != null ? String(rank) : '';
    return RANK_LEVELS[key] != null ? RANK_LEVELS[key] : 999;
  }

  function isRankUnlocked(rank, characterLevel) {
    const lv = clampLevel(characterLevel);
    if (String(rank) === 'hexa') return false;
    return lv >= rankRequiredLevel(rank);
  }

  function highestUnlockedRank(characterLevel) {
    const lv = clampLevel(characterLevel);
    const order = ['10', '30', '60', '100', 'hyper'];
    let last = null;
    order.forEach((rank) => {
      if (isRankUnlocked(rank, lv)) last = rank;
    });
    return last;
  }

  function skillReqLevel(skill) {
    const raw = Number(skill?.reqLevel ?? skill?.reqLev);
    return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : 0;
  }

  function isHyperSkill(skill) {
    return !!skill && (Number(skill.hyper) === 1 || Number(skill.hyper) === 2 || String(skill.rank) === 'hyper');
  }

  /** 技能是否可投點（rank 已解鎖；hyper 另看 reqLevel） */
  function isSkillUnlocked(skill, characterLevel) {
    if (!skill) return false;
    const lv = clampLevel(characterLevel);
    const rank = String(skill.rank || '');
    if (!isRankUnlocked(rank, lv)) return false;
    if (isHyperSkill(skill)) {
      const req = skillReqLevel(skill);
      const need = req > 0 ? req : rankRequiredLevel('hyper');
      if (lv < need) return false;
    }
    return true;
  }

  function lineSkills(jobId) {
    if (typeof SkillCatalog === 'undefined') return [];
    return SkillCatalog.listSkills(jobId, { includeHidden: true });
  }

  /** 指定 rank 在 characterLevel 前累積的一般升級 SP */
  function baseSpTotalForRank(rank, characterLevel) {
    const rankKey = String(rank || '');
    const lv = clampLevel(characterLevel);
    let sum = 0;
    for (let i = SP_START_LEVEL; i <= lv; i += 1) {
      if (spRanksForLevel(i).includes(rankKey)) sum += spGainForLevel(i);
    }
    return sum;
  }

  /** @deprecated 全 rank 合計；新邏輯請用 baseSpTotalForRank */
  function baseSpTotalAtLevel(characterLevel) {
    return SP_RANK_ORDER.reduce(
      (sum, rank) => sum + baseSpTotalForRank(rank, characterLevel),
      0,
    );
  }

  /** Hyper：每達成一個 reqLevel 里程碑 +HYPER_SP_PER_MILESTONE SP（hyper 池） */
  function hyperSpBonusAtLevel(jobId, characterLevel) {
    const lv = clampLevel(characterLevel);
    const reqs = new Set();
    lineSkills(jobId).forEach((skill) => {
      if (!isHyperSkill(skill)) return;
      const req = skillReqLevel(skill);
      if (req > 0 && req <= lv) reqs.add(req);
    });
    return reqs.size * HYPER_SP_PER_MILESTONE;
  }

  function totalSpEarnedForRank(jobId, rank, characterLevel) {
    const rankKey = String(rank || '');
    let total = baseSpTotalForRank(rankKey, characterLevel);
    if (rankKey === 'hyper') total += hyperSpBonusAtLevel(jobId, characterLevel);
    return total;
  }

  function totalSpEarned(jobId, characterLevel) {
    return SP_RANK_ORDER.reduce(
      (sum, rank) => sum + totalSpEarnedForRank(jobId, rank, characterLevel),
      0,
    );
  }

  function spentSpForRank(levels, jobId, rank) {
    const map = levels || {};
    const rankKey = String(rank || '');
    let sum = 0;
    lineSkills(jobId).forEach((skill) => {
      if (String(skill.rank || '') !== rankKey) return;
      sum += Math.max(0, Number(map[String(skill.id)]) || 0);
    });
    return sum;
  }

  function spentSp(levels, jobId) {
    return SP_RANK_ORDER.reduce(
      (sum, rank) => sum + spentSpForRank(levels, jobId, rank),
      0,
    );
  }

  function remainingSpForRank(jobId, rank, characterLevel, levels) {
    return Math.max(
      0,
      totalSpEarnedForRank(jobId, rank, characterLevel) - spentSpForRank(levels, jobId, rank),
    );
  }

  function remainingSp(jobId, characterLevel, levels) {
    return SP_RANK_ORDER.reduce(
      (sum, rank) => sum + remainingSpForRank(jobId, rank, characterLevel, levels),
      0,
    );
  }

  return {
    SP_START_LEVEL,
    SP_FOURTH_JOB_MAX_LEVEL,
    SP_RANK_ORDER,
    HYPER_SP_PER_MILESTONE,
    spGainForLevel,
    spRanksForLevel,
    spRankForLevel,
    rankRequiredLevel,
    isRankUnlocked,
    highestUnlockedRank,
    skillReqLevel,
    isHyperSkill,
    isSkillUnlocked,
    baseSpTotalAtLevel,
    baseSpTotalForRank,
    hyperSpBonusAtLevel,
    totalSpEarnedForRank,
    totalSpEarned,
    spentSpForRank,
    spentSp,
    remainingSpForRank,
    remainingSp,
  };
})();

if (typeof window !== 'undefined') {
  window.SkillPoints = SkillPoints;
}
