/**
 * 技能被動／作用中 Buff → 狩獵／戰鬥力／角色面板 modifiers
 * 鬥氣「每層」數值由 SkillComboOrbs 另算，不計入此處 flat damR
 * hyper=1 技能強化（某某-傷害強化等）綁定特定技能，不進全域傷害%
 */
const SkillModifiers = (() => {
  /** 鬥氣本體／hyper：層數加成另算，避免把每層 damR／機率當永久全額 */
  const COMBO_SKILL_IDS = new Set([
    '1100013', '1110013', '1120003',
    '1120043', '1120044', '1120045',
  ]);
  /** 有 CD 的主動攻擊技：鎖定怪物數全域倍率 */
  const CD_ACTIVE_ATTACK_MOB_MULTIPLIER = 2;
  /** @type {Array<Record<string, number> & { id: string, expiresAt: number }>} */
  let buffs = [];

  function nowMs() {
    return (typeof performance !== 'undefined' && performance.now)
      ? performance.now()
      : Date.now();
  }

  function emptyTotals() {
    return {
      flatPad: 0,
      flatMad: 0,
      flatStr: 0,
      flatDex: 0,
      flatInt: 0,
      flatLuk: 0,
      damR: 0,
      bdR: 0,
      finalDamR: 0,
      critDmg: 0,
      critRate: 0,
      ied: 0,
      flatPdd: 0,
      mhpR: 0,
      flatHpPerLevel: 0,
      speedStages: 0,
      /** 對 WZ attackSpeed 的加减（加速為負，例 -2） */
      speedModifiers: 0,
      damAbsorbPct: 0,
      /** Power Guard 等：反射被擊傷害 % */
      reflectPct: 0,
      /** Buff 持續時間 +%（大師魔法等） */
      buffTimeR: 0,
      /** 格擋機率 %（stanceProp） */
      blockPct: 0,
      /** 直接投入 AP 能力值 +%（楓葉祝福等） */
      basicStatUp: 0,
    };
  }

  function emptySkillEnhance() {
    return {
      damR: 0,
      targetPlus: 0,
      attackCount: 0,
      prop: 0,
      cr: 0,
    };
  }

  function addInto(dst, src) {
    if (!src) return dst;
    Object.keys(emptyTotals()).forEach((k) => {
      dst[k] = (Number(dst[k]) || 0) + (Number(src[k]) || 0);
    });
    return dst;
  }

  /** 「狂暴攻擊-傷害強化」→ 基底名「狂暴攻擊」 */
  function hyperBaseName(skill) {
    const name = String(skill?.name || '').trim();
    const cut = name.search(/[-－—]/);
    if (cut <= 0) return '';
    return name.slice(0, cut).trim();
  }

  function isHyperSkillPassive(skill) {
    return !!skill && Number(skill.hyper) === 1;
  }

  /**
   * 依名稱對應被強化的技能（同職業線、名稱完全相符）。
   * 同名隱藏 companion（如狂暴攻擊滿鬥氣 1120017）略過，優先綁本體。
   * @returns {string|null} target skill id
   */
  function resolveHyperTargetId(hyperSkill) {
    if (!isHyperSkillPassive(hyperSkill)) return null;
    const base = hyperBaseName(hyperSkill);
    if (!base || typeof SkillCatalog === 'undefined') return null;
    const jobId = (typeof CharacterSkills !== 'undefined')
      ? CharacterSkills.currentJobId?.()
      : hyperSkill.skillBook;
    const list = SkillCatalog.listSkills?.(jobId, { includeHidden: true }) || [];
    const matches = list.filter((s) => s
      && String(s.id) !== String(hyperSkill.id)
      && String(s.name || '').trim() === base);
    if (!matches.length) return null;
    const visible = matches.find((s) => !s.skipPanel);
    return String((visible || matches[0]).id);
  }

  function passiveActionSpeedRaw(rawCommon, skillMeta) {
    if (rawCommon?.actionSpeed != null && String(rawCommon.actionSpeed) !== '') {
      return rawCommon.actionSpeed;
    }
    const psd = skillMeta?.psdWeaponBooster;
    if (psd?.actionSpeed != null && String(psd.actionSpeed) !== '') {
      return psd.actionSpeed;
    }
    return null;
  }

  function modsFromStat(stat, skillId, rawCommon, level, skillMeta) {
    if (!stat) return emptyTotals();
    const id = String(skillId || '');
    const isComboBody = COMBO_SKILL_IDS.has(id);
    const isHyperPas = isHyperSkillPassive(skillMeta)
      || (skillMeta == null && typeof SkillCatalog !== 'undefined'
        && isHyperSkillPassive(SkillCatalog.getSkill?.(id)));
    const lv = Math.max(0, Number(level) || 0);
    // actionSpeed：WZ 加减（負＝加速）。例 -1 → speedModifiers -1
    let speedModifiers = 0;
    const actionSpeedRaw = passiveActionSpeedRaw(rawCommon, skillMeta);
    if (actionSpeedRaw != null && typeof SkillFormula !== 'undefined') {
      const as = SkillFormula.evalExpr(actionSpeedRaw, { x: lv });
      if (Number.isFinite(as) && as !== 0) speedModifiers += as;
    } else if (Number(stat.actionSpeed) !== 0 && Number.isFinite(Number(stat.actionSpeed))) {
      speedModifiers += Number(stat.actionSpeed);
    }
    // 舊欄位 speedStages：正數＝加速階數（＝ −speedModifiers 的加速部分）
    const speedStages = speedModifiers < 0 ? Math.abs(speedModifiers) : 0;
    let damAbsorbPct = Number(stat.damAbsorbShieldR) || 0;
    if (!damAbsorbPct && rawCommon?.damAbsorbShieldR != null && typeof SkillFormula !== 'undefined') {
      damAbsorbPct = SkillFormula.evalExpr(rawCommon.damAbsorbShieldR, { x: lv }) || 0;
    }
    let powerGuard = Number(stat.indiePowerGuard) || 0;
    if (!powerGuard && rawCommon?.indiePowerGuard != null && typeof SkillFormula !== 'undefined') {
      powerGuard = SkillFormula.evalExpr(rawCommon.indiePowerGuard, { x: lv }) || 0;
    }
    if (powerGuard) damAbsorbPct += powerGuard;
    const reflectPct = powerGuard > 0 ? (Number(stat.y) || 0) : 0;
    return {
      flatPad: (Number(stat.padX) || 0) + (Number(stat.indiePad) || 0),
      flatStr: Number(stat.strX) || 0,
      flatDex: Number(stat.dexX) || 0,
      flatInt: Number(stat.intX) || 0,
      flatLuk: Number(stat.lukX) || 0,
      // 鬥氣每層／hyper 技能強化的 damR 不進全域
      damR: (isComboBody || isHyperPas) ? 0 : (Number(stat.damR) || 0),
      bdR: (isComboBody || isHyperPas) ? 0 : (Number(stat.bdR) || 0),
      finalDamR: isComboBody ? 0 : ((Number(stat.pdR) || 0) + (Number(stat.mdR) || 0)),
      critDmg: isComboBody ? 0 : (Number(stat.criticaldamage) || 0),
      critRate: (Number(stat.indieCr) || 0) + (Number(stat.cr) || 0),
      ied: Number(stat.ignoreMobpdpR) || 0,
      flatPdd: Number(stat.pddX) || 0,
      flatMad: Number(stat.madX) || 0,
      mhpR: Number(stat.mhpR) || 0,
      flatHpPerLevel: Number(stat.lv2mhp) || 0,
      speedStages,
      speedModifiers,
      damAbsorbPct: Number(damAbsorbPct) || 0,
      reflectPct: Number(reflectPct) || 0,
      buffTimeR: Number(stat.bufftimeR) || 0,
      blockPct: Number(stat.stanceProp) || 0,
      basicStatUp: Number(stat.basicStatUp) || 0,
    };
  }

  function flatStatKey(label) {
    const map = {
      STR: 'flatStr',
      DEX: 'flatDex',
      INT: 'flatInt',
      LUK: 'flatLuk',
    };
    return map[String(label || '').toUpperCase()] || null;
  }

  function pruneBuffs(t = nowMs()) {
    buffs = buffs.filter((b) => b.expiresAt > t);
  }

  function getPassiveTotals() {
    const out = emptyTotals();
    if (typeof CharacterSkills === 'undefined' || typeof SkillCatalog === 'undefined') {
      return out;
    }
    if (typeof SkillFormula === 'undefined' || typeof SkillFormula.evalStatCommon !== 'function') {
      return out;
    }
    const jobId = CharacterSkills.currentJobId?.();
    const skills = SkillCatalog.listSkills?.(jobId, { includeHidden: true }) || [];
    skills.forEach((skill) => {
      if (!skill || skill.skipPanel) return;
      const level = CharacterSkills.getLevel?.(skill.id) || 0;
      if (!(level > 0)) return;
      const isPassiveLike = skill.type === 'passive' || skill.hyper === 1;
      const hasBasicStatUp = skill.common?.basicStatUp != null
        && String(skill.common.basicStatUp) !== '';
      // 一般被動／超技；或 buff 上的 AP% 被動（楓葉祝福）
      if (!isPassiveLike && !hasBasicStatUp) return;
      const st = SkillFormula.evalStatCommon(skill.common, level);
      if (isPassiveLike) {
        addInto(out, modsFromStat(st, skill.id, skill.common, level, skill));
        return;
      }
      out.basicStatUp += Number(st.basicStatUp) || 0;
    });
    return out;
  }

  /**
   * 楓葉祝福等：floor(直接投入 AP × basicStatUp%)
   * 加到 STR/DEX/INT/LUK flat（不含基礎 5、不含極限／裝備）
   */
  function applyBasicStatUpBonus(totals) {
    const pct = Number(totals?.basicStatUp) || 0;
    if (!(pct > 0) || typeof CharacterProgression === 'undefined') return totals;
    const ap = CharacterProgression.getState?.()?.ap || {};
    const pairs = [
      ['str', 'flatStr'],
      ['dex', 'flatDex'],
      ['int', 'flatInt'],
      ['luk', 'flatLuk'],
    ];
    pairs.forEach(([apKey, flatKey]) => {
      const invested = Math.max(0, Number(ap[apKey]) || 0);
      if (!(invested > 0)) return;
      totals[flatKey] = (Number(totals[flatKey]) || 0)
        + Math.floor((invested * pct) / 100);
    });
    return totals;
  }

  /**
   * 彙總綁定到指定技能的超技能被動（傷害／怪物數／段數／機率）。
   */
  function getSkillEnhance(skillId) {
    const out = emptySkillEnhance();
    const tid = String(skillId || '');
    if (!tid || typeof CharacterSkills === 'undefined' || typeof SkillCatalog === 'undefined') {
      return out;
    }
    if (typeof SkillFormula === 'undefined' || typeof SkillFormula.evalStatCommon !== 'function') {
      return out;
    }
    const jobId = CharacterSkills.currentJobId?.();
    const skills = SkillCatalog.listSkills?.(jobId, { includeHidden: true }) || [];
    skills.forEach((skill) => {
      if (!isHyperSkillPassive(skill)) return;
      // 鬥氣超技由 SkillComboOrbs 處理，不進技能專屬傷害／機率
      if (COMBO_SKILL_IDS.has(String(skill.id))) return;
      const level = CharacterSkills.getLevel?.(skill.id) || 0;
      if (!(level > 0)) return;
      if (resolveHyperTargetId(skill) !== tid) return;
      const st = SkillFormula.evalStatCommon(skill.common, level);
      out.damR += Number(st.damR) || 0;
      out.targetPlus += Number(st.targetPlus) || 0;
      // attackCount 在超技 common 是「追加段數」，不是絕對值
      if (skill.common?.attackCount != null && String(skill.common.attackCount) !== '') {
        const bonusAtk = typeof SkillFormula.evalExpr === 'function'
          ? SkillFormula.evalExpr(skill.common.attackCount, { x: level })
          : Number(st.attackCount);
        out.attackCount += Math.max(0, Number(bonusAtk) || 0);
      }
      out.prop += Number(st.prop) || 0;
      out.cr += Number(st.cr) || 0;
    });
    return out;
  }

  /**
   * 有 CD 的主動攻擊技（非 Buff）：鎖定怪物數 × CD_ACTIVE_ATTACK_MOB_MULTIPLIER
   */
  function isCdActiveAttackSkill(skill, common) {
    if (!skill || String(skill.type) !== 'active') return false;
    if (!(Number(common?.cooltimeSec) > 0)) return false;
    if (typeof SkillBuffRuntime !== 'undefined'
      && typeof SkillBuffRuntime.isTimedBuffSkill === 'function'
      && SkillBuffRuntime.isTimedBuffSkill(skill, common)) {
      return false;
    }
    const damagePct = Number(common?.damagePct) || 0;
    const attackCount = Number(common?.attackCount) || 0;
    return damagePct > 0 && attackCount >= 1;
  }

  function applyGlobalCombatRules(skill, common) {
    const base = common && typeof common === 'object' ? { ...common } : {};
    if (base._globalCombatRules) return base;
    base._globalCombatRules = true;
    if (!isCdActiveAttackSkill(skill, base)) return base;
    const mult = CD_ACTIVE_ATTACK_MOB_MULTIPLIER;
    if (!(mult > 1)) return base;
    base.mobCount = Math.max(1, Math.floor((Number(base.mobCount) || 1) * mult));
    return base;
  }

  /**
   * 把超技強化套到施放用 common（傷害％×、怪物數＋、段數＋）。
   */
  function applySkillEnhance(skillId, common) {
    const base = common && typeof common === 'object' ? { ...common } : {};
    if (base._hyperEnhance) return base;
    const en = getSkillEnhance(skillId);
    const damR = Number(en.damR) || 0;
    const dmg = Number(base.damagePct) || 0;
    base.damagePct = damR > 0 ? dmg * (1 + damR / 100) : dmg;
    base.attackCount = Math.max(1, (Number(base.attackCount) || 1) + (Number(en.attackCount) || 0));
    base.mobCount = Math.max(1, (Number(base.mobCount) || 1) + (Number(en.targetPlus) || 0));
    base._hyperEnhance = en;
    return base;
  }

  /** 施放用 common（evalCommon → 超技強化 → 全域規則） */
  function resolveCastCommon(skill, level) {
    if (typeof SkillFormula === 'undefined' || !skill) return null;
    const lv = Math.max(1, Math.floor(Number(level) || 0));
    let stats = SkillFormula.evalCommon(skill.common || {}, lv);
    stats = applySkillEnhance(String(skill.id || ''), stats);
    stats = applyGlobalCombatRules(skill, stats);
    return stats;
  }

  /** 技能面板／Tooltip：占位符用 common（同步實際 mobCount、CD） */
  function resolvePanelCommon(skill, level) {
    const raw = skill?.common && typeof skill.common === 'object' ? { ...skill.common } : {};
    const stats = resolveCastCommon(skill, level);
    if (!stats) return raw;
    raw.mobCount = String(Math.max(1, Math.floor(Number(stats.mobCount) || 1)));
    if (stats.cooltimeSec > 0) raw.cooltime = String(stats.cooltimeSec);
    return raw;
  }

  function getBuffTotals(t = nowMs()) {
    pruneBuffs(t);
    const out = emptyTotals();
    buffs.forEach((b) => addInto(out, b));
    return out;
  }

  function getComboTotals() {
    if (typeof SkillComboOrbs !== 'undefined' && typeof SkillComboOrbs.getModifierBonus === 'function') {
      return SkillComboOrbs.getModifierBonus();
    }
    return emptyTotals();
  }

  function getBuffDurationMultiplier() {
    const pct = Number(getPassiveTotals().buffTimeR) || 0;
    return 1 + Math.max(0, pct) / 100;
  }

  function getTotals(t = nowMs()) {
    const out = addInto(addInto(getPassiveTotals(), getBuffTotals(t)), getComboTotals());
    return applyBasicStatUpBonus(out);
  }

  function applyBuff(opts = {}) {
    const id = String(opts.id || '');
    if (!id) return false;
    const durationMs = Math.max(0, Number(opts.durationMs) || 0);
    if (!(durationMs > 0)) return false;
    const t = nowMs();
    buffs = buffs.filter((b) => b.id !== id);
    const row = {
      id,
      expiresAt: t + durationMs,
      durationMs,
      name: opts.name != null ? String(opts.name) : '',
      icon: opts.icon != null ? String(opts.icon) : '',
      ...emptyTotals(),
    };
    Object.keys(emptyTotals()).forEach((k) => {
      if (opts[k] != null) row[k] = Number(opts[k]) || 0;
    });
    buffs.push(row);
    return true;
  }

  function clearBuff(id) {
    if (id == null) {
      buffs = [];
      return;
    }
    const key = String(id);
    buffs = buffs.filter((b) => b.id !== key);
  }

  function reset() {
    buffs = [];
  }

  function hasBuff(id, t = nowMs()) {
    pruneBuffs(t);
    return buffs.some((b) => b.id === String(id));
  }

  /** 作用中時限 buff（剩餘時間由短到長／先施放在左…UI 用右到左再反轉） */
  function listActiveBuffs(t = nowMs()) {
    pruneBuffs(t);
    return buffs.map((b) => ({
      id: b.id,
      name: b.name || b.id,
      icon: b.icon || '',
      expiresAt: b.expiresAt,
      remainMs: Math.max(0, b.expiresAt - t),
      durationMs: Number(b.durationMs) || 0,
    }));
  }

  return {
    emptyTotals,
    emptySkillEnhance,
    getPassiveTotals,
    getBuffTotals,
    getComboTotals,
    getTotals,
    getSkillEnhance,
    applySkillEnhance,
    applyGlobalCombatRules,
    isCdActiveAttackSkill,
    resolveCastCommon,
    resolvePanelCommon,
    CD_ACTIVE_ATTACK_MOB_MULTIPLIER,
    getBuffDurationMultiplier,
    resolveHyperTargetId,
    applyBuff,
    clearBuff,
    reset,
    hasBuff,
    listActiveBuffs,
    modsFromStat,
    flatStatKey,
    COMBO_SKILL_IDS,
  };
})();

if (typeof window !== 'undefined') {
  window.SkillModifiers = SkillModifiers;
}
