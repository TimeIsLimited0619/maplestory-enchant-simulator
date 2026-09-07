/**
 * 技能覆寫 — WZ 原資料與本專案玩法不一致時使用。
 * - import-skill-wz.mjs 寫入 skillJobData 前會 merge
 * - SkillCatalog 讀取時也會套用（避免漏跑匯入）
 */
const SkillOverrides = (() => {
  /**
   * @type {Record<string, {
   *   h?: string,
   *   desc?: string,
   *   toggle?: boolean,
   *   skipPanel?: boolean,
   *   common?: Record<string, string>,
   *   commonRemove?: string[]
   * }>}
   */
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

    // —— 法師：本專案無 MP，MP 相關改 HP ——
    // 1轉 魔力增幅：最大 HP% + 每等 HP + 攻速
    '2000006': {
      h: '最大HP增加#mhpR%，攻擊速度提升1階段，角色每等級額外增加HP #lv2mhp\\n裝備短杖時，爆擊機率額外增加5%',
      desc: '強化魔力循環改為強化生命力：提高最大HP與攻擊速度。',
      common: {
        mhpR: 'x',
        lv2mhp: '20+5*x',
      },
      commonRemove: ['mmpR', 'lv2mmp'],
    },
    // 1轉 魔力之盾
    '2000010': {
      h: '防禦力增加#pddX',
      desc: '將魔力凝聚在盔甲上，使防禦力提升。',
    },
    // 2轉 魔力吸收（火毒／冰雷）：命中時吸 HP
    '2100000': {
      h: '使用技能命中敵人時，以#prop%機率恢復自身最大HP的#x%\\n命中BOSS時改為恢復最大HP的#y%',
      desc: '魔法攻擊命中時，有機會吸收敵人體力轉為自身HP。對Boss效果較差。',
    },
    '2200000': {
      h: '使用技能命中敵人時，以#prop%機率恢復自身最大HP的#x%\\n命中BOSS時改為恢復最大HP的#y%',
      desc: '魔法攻擊命中時，有機會吸收敵人體力轉為自身HP。對Boss效果較差。',
    },
    // 2轉 精神強化：indieMad → 魔力（flatMad）
    '2101001': {
      h: '消耗HP #mpCon，#time秒內魔力（魔法攻擊力）增加#indieMad',
      desc: '短暫冥想以提升魔力。',
    },
    '2201001': {
      h: '消耗HP #mpCon，#time秒內魔力（魔法攻擊力）增加#indieMad',
      desc: '短暫冥想以提升魔力。',
    },
    // 2轉 冰雪結界：開關技＋所受傷害減少（勿每 8 秒重放）
    '2201009': {
      toggle: true,
      h: '【開關技能】開啟後持續生效，再次施放可關閉\\n所受傷害減少#y%',
      desc: '以寒氣護罩保護自身。開關技能；開啟期間減少受到的傷害。',
      common: {
        damAbsorbShieldR: '2*x',
        time: '86400',
      },
    },
    // 3轉 魔力激發：耗血% + 傷害（說明由 formatSkillText 把 MP 改成 HP／耗血）
    '2110001': {
      h: '額外提高耗血#costmpR%，增加攻擊魔法的傷害#damR%',
      desc: '消耗更多的HP，但相對的除了火靈結界以外的攻擊魔法的傷害增加威力。',
    },
    '2210001': {
      h: '額外提高耗血#costmpR%，增加攻擊魔法的傷害#damR%',
      desc: '消耗更多的HP，然而所有攻擊魔法的傷害增加威力。',
    },
    // 四轉 魔力無限：只回 HP（無 MP）
    '2120004': {
      h: '每#x秒恢復最大HP的#s%\\n最終傷害增加#mdR%',
      desc: '引出無限魔力以恢復生命並強化魔法最終傷害。',
    },
    '2220004': {
      h: '每#x秒恢復最大HP的#s%\\n最終傷害增加#mdR%',
      desc: '引出無限魔力以恢復生命並強化魔法最終傷害。',
    },
    // 劍士自身強化：法師亦可學習
    '1000003': {
      h: '增加#pddX防禦力，最大HP#mhpR%。被敵人攻擊時，傷害減少#damAbsorbShieldR%',
      desc: '強化自身防禦與最大HP，並減少受到的傷害。',
    },

    // —— 法師一轉：隱藏瞬移／魔力波動 ——
    '2001009': { skipPanel: true }, // 瞬間移動
    '2001011': { skipPanel: true }, // 魔力波動
    // 三轉瞬移精通：只保留格擋被動
    '2111007': {
      h: '永久增加格擋機率#stanceProp%',
      desc: '永久增加格擋機率。',
    },
    '2211007': {
      h: '永久增加格擋機率#stanceProp%',
      desc: '永久增加格擋機率。',
    },

    // —— 三轉被動說明 ——
    '2110009': {
      h: '增加爆擊機率#cr%、爆擊傷害#criticaldamage%。',
      desc: '永久性的增加爆擊機率及爆擊傷害。',
    },
    '2110015': {
      h: '最終傷害增加#mdR%',
      desc: '永久增加最終傷害。',
    },
    '2210009': {
      h: '增加爆擊機率#cr%、爆擊傷害#criticaldamage%。',
      desc: '永久性的增加爆擊機率及爆擊傷害。',
    },
    '2210013': {
      h: '攻擊結冰狀態敵人時，每層結冰有#subProp%機率無視防禦#prop%',
      desc: '攻擊結冰狀態敵人時，有機會依結冰層數無視防禦。',
    },
    '2210016': {
      h: '最終傷害增加#mdR%',
      desc: '永久增加最終傷害。',
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
