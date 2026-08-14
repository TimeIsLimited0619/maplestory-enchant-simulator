/**
 * 戰鬥力公式（移植自 MapleCombat MIT）
 * 來源：
 *   https://github.com/centre173/MapleCombat
 *   src/core/percentFloor.ts
 *   src/core/float32.ts
 *   src/core/familiar.ts
 *   src/core/combatPower.ts
 *
 * 第 2 點：公式本體；角色基底輸入（第 3 點）接上前欄位多為 0。
 */
const CombatPower = (() => {
  const toFloat32 = Math.fround;

  /** 遊戲百分比取整：先以整數比例相乘，最後除以 100 並向下取整。 */
  function floorPercentOf(base, percent) {
    return Math.floor((base * percent) / 100);
  }

  /** 對 base 套用增減百分比後向下取整。 */
  function floorPercentApplied(base, percent) {
    return floorPercentOf(base, 100 + percent);
  }

  // ---- familiar（萌獸終傷）----
  function solveFamComposition(total) {
    const solve = (mainStep) => {
      for (let bond = 0; bond <= 4; bond++) {
        const rest = total - bond * 2;
        if (rest < 0) break;
        if (rest % mainStep === 0) return { main: rest / mainStep, step: mainStep, bond };
      }
      return null;
    };
    return solve(20) || solve(25);
  }

  function overseasFamMult(famFinalPct) {
    const total = Math.round(famFinalPct);
    if (total <= 0) return 1;
    const combo = solveFamComposition(total);
    if (!combo) return toFloat32(1 + total / 100);
    let acc = 1;
    const mainAdd = toFloat32(combo.step / 100);
    for (let i = 0; i < combo.main; i++) acc = toFloat32(acc + mainAdd);
    for (let i = 0; i < combo.bond; i++) acc = toFloat32(acc + toFloat32(0.02));
    return acc;
  }

  function famMultFromSources(sources) {
    let acc = 1;
    for (const s of [...sources].sort((a, b) => b - a)) {
      acc = toFloat32(acc + toFloat32(s / 100));
    }
    return acc;
  }

  function resolveFamMult(sources, resolvedPct) {
    if (!sources || sources.length === 0) return overseasFamMult(resolvedPct);
    const list = [...sources];
    const extra = resolvedPct - list.reduce((a, b) => a + b, 0);
    if (Math.abs(extra) > 1e-9) list.push(extra);
    return famMultFromSources(list);
  }

  /** 空字串回傳 1（未輸入 = 不調整），與 0 的語意不同 */
  function powerCoefficientFactor(rawValue, defaultValue) {
    const trimmed = String(rawValue ?? '').trim();
    if (trimmed === '') return 1;
    const value = Number(trimmed);
    return Number.isFinite(value) ? value / defaultValue : 1;
  }

  function panelStatValue(base, percent, noApply) {
    return floorPercentApplied(base, percent) + noApply;
  }

  function createDefaultContext(overrides) {
    return {
      jobCategory: 'normal',
      jobName: '',
      weaponSet: '',
      genesisFinalChecked: false,
      useBuff: false,
      combatCorrections: undefined,
      overseasGenesisAtkDelta: 0,
      xenonPowerCoefficientRaw: '',
      daPowerCoefficientRaw: '',
      famFinalSources: undefined,
      includeEquipDelta: true,
      ...overrides,
    };
  }

  /**
   * 戰鬥力公式實際採用的校正後數值，同時供數值預覽顯示。
   * fields/delta/buffDelta 三者為獨立加項。
   */
  function resolveCombatFormulaInputs(fields, ctx, delta, buffDelta) {
    fields = fields || {};
    delta = delta || {};
    buffDelta = buffDelta || {};
    const getVal = (id) => (fields[id] || 0) + (delta[id] || 0) + (buffDelta[id] || 0);
    const currentJob = ctx.jobCategory;

    const adjEventAtk = getVal('adjEventAtk');
    const adjEventAllStat = getVal('adjEventAllStat');
    const adjEventBossDmg = getVal('adjEventBossDmg');
    const adjEventCritDmg = getVal('adjEventCritDmg');
    const adjEventHP = getVal('adjEventHP');
    const adjBarrierMainStat = getVal('adjBarrierMainStat');
    const adjBarrierSubStat = getVal('adjBarrierSubStat');
    const adjBarrierAtk = getVal('adjBarrierAtk');
    const adjBarrierMainStatPercent = getVal('adjBarrierMainStatPercent');
    const applyMentorCorrection = ctx.useBuff && ctx.combatCorrections?.mentor === true;
    const adjMentorAtk = applyMentorCorrection ? 0 : getVal('adjMentorAtk');
    const adjMentorBossDmg = applyMentorCorrection ? 0 : getVal('adjMentorBossDmg');
    let adjWeaponAtk = getVal('adjWeaponAtk');
    const adjEmpressBless =
      currentJob === 'overseas'
        ? (ctx.useBuff && ctx.combatCorrections?.empress === true ? getVal('adjEmpressBless') : 0)
        : getVal('adjEmpressBless');
    const adjPetAtk = getVal('adjPetAtk');

    if (
      currentJob === 'overseas'
      && ctx.useBuff
      && ctx.combatCorrections?.genesis === true
      && ctx.weaponSet === 'genesis'
    ) {
      adjWeaponAtk += ctx.overseasGenesisAtkDelta;
    }

    const xenonStarBonus = currentJob === 'xenon' ? getVal('adjXenonStar') : 0;
    const daStarBonus = currentJob === 'da' ? getVal('adjDASpStar') : 0;
    const includeSecondSub = currentJob === 'xenon' || currentJob === 'dual';
    const barrierSubFlat =
      currentJob === 'xenon' ? adjBarrierMainStat : currentJob === 'dual' ? 0 : adjBarrierSubStat;
    const barrierSecondSubFlat =
      currentJob === 'xenon' ? adjBarrierMainStat : currentJob === 'dual' ? adjBarrierSubStat : 0;
    const barrierSubPercent = currentJob === 'xenon' ? adjBarrierMainStatPercent : 0;

    const mainPercent = getVal('percentMain') + adjBarrierMainStatPercent - getVal('skillPercentMain');
    const mainNoApply = getVal('noApplyMain');
    let mainBase = 0;
    let mainTotal = 0;
    let equivalentMain = 0;

    if (currentJob === 'da') {
      const effectiveBaseMain = getVal('baseMain') + adjEventHP + adjBarrierMainStat;
      mainBase = effectiveBaseMain - getVal('skillBaseMain') + daStarBonus;
      const roundedMain = floorPercentApplied(mainBase, mainPercent);
      mainTotal = roundedMain + mainNoApply;
      const baseHP = getVal('adjDAHP');
      equivalentMain = baseHP / 3.5 + ((mainTotal - baseHP) / 3.5) * 0.8;
    } else {
      mainBase =
        getVal('baseMain')
        + xenonStarBonus
        + adjEventAllStat
        + adjBarrierMainStat
        - getVal('skillBaseMain');
      mainTotal = floorPercentApplied(mainBase, mainPercent) + mainNoApply;
      equivalentMain = mainTotal;
    }

    const subBase =
      getVal('baseSub') + adjEventAllStat + barrierSubFlat - getVal('skillBaseSub') + xenonStarBonus;
    const subPercent = getVal('percentSub') + barrierSubPercent - getVal('skillPercentSub');
    const subNoApply = getVal('noApplySub');
    const subTotal = floorPercentApplied(subBase, subPercent) + subNoApply;

    let subtwo = null;
    if (includeSecondSub) {
      const base =
        getVal('baseSubtwo')
        + adjEventAllStat
        + barrierSecondSubFlat
        - getVal('skillBaseSubtwo')
        + xenonStarBonus;
      const percent = getVal('percentSubtwo') + barrierSubPercent - getVal('skillPercentSubtwo');
      const noApply = getVal('noApplySubtwo');
      subtwo = {
        base,
        percent,
        noApply,
        total: floorPercentApplied(base, percent) + noApply,
        panel: panelStatValue(getVal('baseSubtwo'), getVal('percentSubtwo'), noApply),
        skillBase: getVal('skillBaseSubtwo'),
        skillPercent: getVal('skillPercentSubtwo'),
      };
    }

    const attackBase =
      getVal('atk')
      + adjWeaponAtk
      + adjEmpressBless
      + adjPetAtk
      + adjEventAtk
      + adjBarrierAtk
      - getVal('skillAtk')
      - adjMentorAtk;
    const attackPercent = getVal('percentAtk') - getVal('skillPercentAtk');
    const attackNoApply = getVal('noApplyAtk');
    const attackTotal = floorPercentApplied(attackBase, attackPercent) + attackNoApply;

    const zeroBossDmgPenalty = ctx.jobName === '神之子' ? getVal('adjZeroWeaponFlameBossDmg') : 0;
    const damage = getVal('dmg') - getVal('skillDmg');
    const bossDamage =
      getVal('bossDmg')
      + adjEventBossDmg
      - adjMentorBossDmg
      - zeroBossDmgPenalty
      - getVal('skillBossDmg');
    const critDamage = getVal('critDmg') + adjEventCritDmg - getVal('skillCritDmg');
    const rawDmgSum = 1 + (damage + bossDamage) / 100;
    const rawCritSum = 1.35 + critDamage / 100;

    const genesisMult = ctx.genesisFinalChecked ? 1.1 : 1.0;
    const ruinMult =
      currentJob === 'da' || ctx.jobName === '惡魔殺手' ? 1 + getVal('ruinFinal') / 100 : 1;
    const equipmentFamMultiplierFactor = delta.__eqFamFinalMultiplierFactor ?? 1;
    const famMult =
      resolveFamMult(ctx.famFinalSources, getVal('famFinal')) * equipmentFamMultiplierFactor;

    return {
      main: {
        base: mainBase,
        percent: mainPercent,
        noApply: mainNoApply,
        total: mainTotal,
        panel: panelStatValue(getVal('baseMain'), getVal('percentMain'), mainNoApply),
        skillBase: getVal('skillBaseMain'),
        skillPercent: getVal('skillPercentMain'),
      },
      sub: {
        base: subBase,
        percent: subPercent,
        noApply: subNoApply,
        total: subTotal,
        panel: panelStatValue(getVal('baseSub'), getVal('percentSub'), subNoApply),
        skillBase: getVal('skillBaseSub'),
        skillPercent: getVal('skillPercentSub'),
      },
      subtwo,
      attack: {
        base: attackBase,
        percent: attackPercent,
        noApply: attackNoApply,
        total: attackTotal,
        panel: panelStatValue(getVal('atk'), getVal('percentAtk'), attackNoApply),
        skillBase: getVal('skillAtk'),
        skillPercent: getVal('skillPercentAtk'),
      },
      damage,
      bossDamage,
      critDamage,
      damageDetail: { value: damage, panel: getVal('dmg'), skill: getVal('skillDmg') },
      bossDamageDetail: {
        value: bossDamage,
        panel: getVal('bossDmg'),
        skill: getVal('skillBossDmg'),
      },
      critDamageDetail: {
        value: critDamage,
        panel: getVal('critDmg'),
        skill: getVal('skillCritDmg'),
      },
      rawDmgSum,
      rawCritSum,
      finalMult: genesisMult * famMult * ruinMult,
      equivalentMain,
    };
  }

  /**
   * 戰鬥力主公式。
   * fields/delta/buffDelta 三者為獨立加項（getVal = fields + delta + buffDelta）。
   */
  function calculatePower(fields, ctx, delta, buffDelta) {
    ctx = ctx || createDefaultContext();
    const currentJob = ctx.jobCategory;
    const resolved = resolveCombatFormulaInputs(fields, ctx, delta, buffDelta);
    const combatSubtwo = resolved.subtwo?.total || 0;
    const commonMultiplier =
      (resolved.attack.total * resolved.rawDmgSum * resolved.rawCritSum * resolved.finalMult) / 100;

    if (currentJob === 'xenon') {
      const baseStatSum = resolved.main.total + resolved.sub.total + combatSubtwo;
      const factor = powerCoefficientFactor(ctx.xenonPowerCoefficientRaw, 0.74375);
      const powerHigh = Math.floor(2.625 * baseStatSum * commonMultiplier * factor);
      const powerLow = Math.floor(2.975 * baseStatSum * commonMultiplier * factor);
      return { type: 'range', high: powerHigh, low: powerLow };
    }
    if (currentJob === 'da') {
      const factor = powerCoefficientFactor(ctx.daPowerCoefficientRaw, 0.75);
      const powerHigh = Math.floor(
        0.85 * (resolved.equivalentMain + resolved.sub.total + combatSubtwo) * commonMultiplier * factor,
      );
      const powerLow = Math.floor(
        0.75 * (resolved.equivalentMain + resolved.sub.total + combatSubtwo) * commonMultiplier * factor,
      );
      return { type: 'range', high: powerHigh, low: powerLow };
    }
    const powerNormal = Math.floor(
      (4 * resolved.main.total + resolved.sub.total + combatSubtwo) * commonMultiplier,
    );
    return { type: 'single', value: powerNormal };
  }

  /** 從戰鬥力結果取單一代表值（range 職業取低戰力） */
  function powerValue(result) {
    if (!result) return 0;
    return result.type === 'range' ? result.low : result.value;
  }

  /** 第 3 點前的暫存角色欄位（之後改由角色狀態面板寫入） */
  let characterFields = {};
  let characterContext = createDefaultContext();

  function setCharacterInputs(fields, ctxOverrides) {
    characterFields = { ...(fields || {}) };
    characterContext = createDefaultContext(ctxOverrides || {});
  }

  function getCharacterFields() {
    return { ...characterFields };
  }

  function getCharacterContext() {
    return { ...characterContext };
  }

  /**
   * 從裝備 snapshot 抽出公式 delta（對齊 MapleCombat equipmentDelta 的全屬分配邏輯）
   * @param {object} snapshot EquipStatPanel.buildSnapshot()
   * @param {{ jobCategory?: string, jobName?: string, includeEquipDelta?: boolean }} opts
   */
  function equipSnapshotToDelta(snapshot, opts) {
    opts = opts || {};
    if (opts.includeEquipDelta === false) return {};
    if (!snapshot) return {};

    const jobCategory = opts.jobCategory || 'normal';
    const jobName = opts.jobName || '';
    const labels = (typeof CombatJobs !== 'undefined' && CombatJobs.getJobStatLabelsByName)
      ? CombatJobs.getJobStatLabelsByName(jobName)
      : { main: 'STR', sub: 'DEX', secondSub: '' };

    const delta = {
      baseMain: 0,
      percentMain: 0,
      baseSub: 0,
      percentSub: 0,
      baseSubtwo: 0,
      percentSubtwo: 0,
      atk: 0,
      percentAtk: 0,
      dmg: 0,
      bossDmg: 0,
      critDmg: 0,
    };

    const main = snapshot.mainTotals || {};
    const extra = snapshot.extraTotals || {};
    const ex = snapshot.exceptionalTotals || {};
    const soulFlat = snapshot.soulFlat || {};
    const soulOpt = snapshot.soulOptions || {};
    const potMain = snapshot.potMain || {};
    const potAdd = snapshot.potAdd || {};

    const flatOf = (equipLabel) => (Number(main[equipLabel]?.total) || 0)
      + (Number(ex[equipLabel]) || 0)
      + (Number(soulFlat[equipLabel]) || 0);

    const pctOf = (label) => {
      let n = Number(extra[label]?.total) || 0;
      if (label === 'BOSS怪物傷害') n += Number(ex[label]) || 0;
      if (soulOpt[label] != null) n += Number(soulOpt[label]) || 0;
      [potMain[label], potAdd[label]].forEach((pot) => {
        if (pot?.value) n += Number(pot.value) || 0;
      });
      return n;
    };

    const addStatFlat = (statKey, amount) => {
      if (!amount) return;
      if (statKey === labels.main) delta.baseMain += amount;
      else if (statKey === labels.sub) delta.baseSub += amount;
      else if (labels.secondSub && statKey === labels.secondSub) delta.baseSubtwo += amount;
    };

    const addStatPercent = (statKey, amount) => {
      if (!amount) return;
      if (statKey === labels.main) delta.percentMain += amount;
      else if (statKey === labels.sub) delta.percentSub += amount;
      else if (labels.secondSub && statKey === labels.secondSub) delta.percentSubtwo += amount;
    };

    // 主六維 flat
    ['STR', 'DEX', 'INT', 'LUK'].forEach((k) => addStatFlat(k, flatOf(k)));
    addStatFlat('HP', flatOf('最大HP'));

    // 全屬／全屬%（惡復：全屬只進副屬；其餘進主+副[+副2]）— 抄 equipmentDelta.ts
    const extraAll = extra['全屬性'];
    const extraAllIsPct = !!(extraAll && extraAll.isPercent);
    const allStatFlat = flatOf('全屬性')
      + (!extraAllIsPct ? (Number(extraAll?.total) || 0) : 0);
    const allStatPct = pctOf('全屬性%')
      + (extraAllIsPct ? (Number(extraAll?.total) || 0) : 0);
    const isDA = jobCategory === 'da';
    const includeSecondSub = jobCategory === 'xenon' || jobCategory === 'dual';
    if (!isDA) {
      delta.baseMain += allStatFlat;
      delta.percentMain += allStatPct;
    }
    delta.baseSub += allStatFlat;
    delta.percentSub += allStatPct;
    if (includeSecondSub) {
      delta.baseSubtwo += allStatFlat;
      delta.percentSubtwo += allStatPct;
    }
    if (isDA) {
      delta.percentMain += pctOf('最大HP%');
    }

    // 單屬 %（潛能 label 多為 STR + value 12%，少數為 STR%）
    [
      ['STR', ['STR%', 'STR', '力量%', '力量']],
      ['DEX', ['DEX%', 'DEX', '敏捷%', '敏捷']],
      ['INT', ['INT%', 'INT', '智力%', '智力']],
      ['LUK', ['LUK%', 'LUK', '幸運%', '幸運']],
    ].forEach(([stat, keys]) => {
      keys.forEach((key) => {
        const pot = potMain[key] || potAdd[key];
        if (pot?.suffix === '%' && pot.value) addStatPercent(stat, Number(pot.value) || 0);
        else if (key.endsWith('%') && pot?.value) addStatPercent(stat, Number(pot.value) || 0);
        else if (extra[key]?.isPercent) addStatPercent(stat, Number(extra[key].total) || 0);
      });
    });

    // 攻擊：魔攻職業用魔法攻擊力
    const useMad = labels.main === 'INT';
    delta.atk = useMad ? flatOf('魔法攻擊力') : flatOf('攻擊力');
    if (!delta.atk && useMad) delta.atk = flatOf('攻擊力');

    delta.dmg = pctOf('傷害');
    delta.bossDmg = pctOf('BOSS怪物傷害');
    delta.critDmg = pctOf('爆擊傷害');

    // 攻擊力%：潛能多為「物理攻擊力／魔法攻擊力」+ suffix=%，少數為「攻擊力%」
    const atkPctKeys = useMad
      ? ['攻擊力%', '魔法攻擊力%', '攻擊力', '魔法攻擊力']
      : ['攻擊力%', '物理攻擊力%', '攻擊力', '物理攻擊力'];
    atkPctKeys.forEach((key) => {
      const row = extra[key];
      if (row && (key.endsWith('%') || row.isPercent)) {
        delta.percentAtk += Number(row.total) || 0;
      }
      if (soulOpt[key] != null) {
        const meta = snapshot.soulOptionMeta?.[key];
        if (key.endsWith('%') || meta === '%') {
          delta.percentAtk += Number(soulOpt[key]) || 0;
        }
      }
      [potMain[key], potAdd[key]].forEach((pot) => {
        if (!pot?.value) return;
        if (pot.suffix === '%' || key.endsWith('%')) {
          delta.percentAtk += Number(pot.value) || 0;
        }
      });
    });

    return delta;
  }

  /** 計算目前戰鬥力（角色欄位 + 可選裝備 delta） */
  function calculateCurrentPower(snapshot, opts) {
    opts = opts || {};
    const pack = resolveCurrentInputs(snapshot, opts);
    return calculatePower(pack.fields, pack.ctx, pack.delta, {});
  }

  /**
   * 角色面板欄位 + 裝備 delta 結算後的公式輸入（供 CharacterInfo 顯示）
   */
  function resolveCurrentInputs(snapshot, opts) {
    opts = opts || {};
    const fields = getCharacterFields();
    const ctx = getCharacterContext();
    const includeEquip = opts.includeEquipDelta !== false && ctx.includeEquipDelta !== false;
    const delta = equipSnapshotToDelta(snapshot, {
      jobCategory: ctx.jobCategory,
      jobName: ctx.jobName,
      includeEquipDelta: includeEquip,
    });
    const labels = (typeof CombatJobs !== 'undefined' && CombatJobs.getJobStatLabelsByName)
      ? CombatJobs.getJobStatLabelsByName(ctx.jobName || '')
      : { main: 'STR', sub: 'DEX', secondSub: '' };
    return {
      fields,
      ctx,
      delta,
      labels,
      includeEquip,
      resolved: resolveCombatFormulaInputs(fields, ctx, delta, {}),
    };
  }

  return {
    floorPercentOf,
    floorPercentApplied,
    powerCoefficientFactor,
    resolveCombatFormulaInputs,
    resolveCurrentInputs,
    calculatePower,
    powerValue,
    createDefaultContext,
    setCharacterInputs,
    getCharacterFields,
    getCharacterContext,
    equipSnapshotToDelta,
    calculateCurrentPower,
    resolveFamMult,
  };
})();

if (typeof window !== 'undefined') {
  window.CombatPower = CombatPower;
}
