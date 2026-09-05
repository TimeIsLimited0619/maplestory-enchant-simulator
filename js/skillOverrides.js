/**
 * 技能覆寫 — WZ 原資料與本專案玩法不一致時使用。
 * - import-skill-wz.mjs 寫入 skillJobData 前會 merge
 * - SkillCatalog 讀取時也會套用（避免漏跑匯入）
 */
const SkillOverrides = (() => {
  /** @type {Record<string, { h?: string, desc?: string, common?: Record<string, string>, commonRemove?: string[] }>} */
  const PATCHES = {
    // 烈焰翔斬：不做隊員攻擊加傷；說明與實作對齊（DoT + 所受傷害↑）
    '1121015': {
      h: '消耗MP#mpCon，對#mobCount名敵人以#damage%的傷害攻擊#attackCount次，攻擊一般怪物時傷害#nbdR%增加\\n被攻擊的敵人以#prop%機率在#dotTime秒內每#dotInterval秒承受#dot%的持續傷害，且所受傷害增加#x%',
      commonRemove: ['u'],
    },
    '1141008': {
      h: '消耗MP#mpCon，對最多#mobCount名敵人以#damage%的傷害攻擊#attackCount次，攻擊一般怪物時傷害#nbdR%增加\\n被攻擊的敵人以#prop%機率在#dotTime秒內每#dotInterval秒承受#dot%的持續傷害，且所受傷害增加#x%',
      commonRemove: ['u'],
    },
  };

  function apply(skill) {
    if (!skill?.id) return skill;
    const patch = PATCHES[String(skill.id)];
    if (!patch) return skill;

    const out = { ...skill };
    Object.keys(patch).forEach((key) => {
      if (key === 'common' || key === 'commonRemove') return;
      out[key] = patch[key];
    });

    if (patch.common || patch.commonRemove) {
      out.common = { ...(skill.common || {}) };
      if (patch.common) Object.assign(out.common, patch.common);
      (patch.commonRemove || []).forEach((k) => { delete out.common[k]; });
    }

    return out;
  }

  return { apply, PATCHES };
})();

if (typeof window !== 'undefined') {
  window.SkillOverrides = SkillOverrides;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SkillOverrides;
}
