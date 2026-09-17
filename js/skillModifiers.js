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
  /** 精靈遊俠技能減傷（damAbsorb／耐性近似）模擬倍率 */
  const MERCEDES_DAM_ABSORB_SCALE = 0.5;
  /** @type {Array<Record<string, number> & { id: string, expiresAt: number }>} */
  let buffs = [];
  /** 神祕狙擊層數 */
  let arcaneAim = { stacks: 0, expiresAt: 0, perStackDamR: 0, maxStacks: 5, skillId: '' };
  /** 依古尼斯咆嘯層數（連接技疊終傷） */
  let ignisRoar = {
    stacks: 0,
    expiresAt: 0,
    perStackFinalDamR: 0,
    maxStacks: 5,
    speedMod: 0,
    skillId: '23110004',
  };
  const SHOW_STACK_BUFFS_KEY = 'skill.buff.showStacks.v1';
  let showStackBuffCounts = true;

  function loadShowStackBuffCounts() {
    try {
      const raw = localStorage.getItem(SHOW_STACK_BUFFS_KEY);
      if (raw == null) return true;
      return raw === '1' || raw === 'true';
    } catch (_) {
      return true;
    }
  }

  /** 精靈遊俠技能 id（2300–2312） */
  function isMercedesSkillId(skillId) {
    const s = String(skillId || '');
    return /^23(00|10|11|12)\d*/.test(s);
  }

  function scaleMercedesDamAbsorb(skillId, pct) {
    const v = Math.max(0, Number(pct) || 0);
    if (!(v > 0)) return 0;
    if (!isMercedesSkillId(skillId)) return v;
    return v * MERCEDES_DAM_ABSORB_SCALE;
  }

  function saveShowStackBuffCounts() {
    try {
      localStorage.setItem(SHOW_STACK_BUFFS_KEY, showStackBuffCounts ? '1' : '0');
    } catch (_) { /* ignore */ }
  }

  showStackBuffCounts = loadShowStackBuffCounts();

  function getShowStackBuffCounts() {
    return !!showStackBuffCounts;
  }

  function setShowStackBuffCounts(next) {
    showStackBuffCounts = !!next;
    saveShowStackBuffCounts();
    return showStackBuffCounts;
  }

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
      /** 攻擊力％（indiePadR 等） */
      padR: 0,
      damR: 0,
      bdR: 0,
      /** pdR／mdR 同類相加（技能終傷一桶） */
      finalDamR: 0,
      /** indiePMdR：每個來源獨立相乘，不進 finalDamR */
      indiePMdR: 0,
      critDmg: 0,
      critRate: 0,
      ied: 0,
      flatPdd: 0,
      /** 角色每等級固定防禦（lv2pdd） */
      flatPddPerLevel: 0,
      mhpR: 0,
      flatHpPerLevel: 0,
      /** 固定 HP（emhp 等） */
      flatHp: 0,
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
      /** 武器／魔法熟練度 %（傷害下限） */
      mastery: 0,
      /** 技能冷卻縮短 %（indieCooltimeReduce） */
      coolTimeR: 0,
    };
  }

  /** 咒語精通：WZ 用 x 表示魔力 */
  const SPELL_MASTERY_MAD_IDS = new Set(['2100006', '2200006']);
  /** 進階雙弩槍精通：WZ 用 x 表示攻擊力 */
  const WEAPON_MASTERY_PAD_IDS = new Set(['23120009']);
  /** Buff／主動技上的永久被動列（不吃迴避 prop） */
  const BUFF_LEARNED_PASSIVE_IDS = new Set([
    '23121004', '23121054', '4121015', '400041032', '400051072',
  ]);
  /**
   * 技能連結 damPlus（%p）：學了 carrier 後，對 target 施放傷害％加算
   * key = carrier skillId → target skillIds
   */
  const DAM_PLUS_LINKS = {
    '23110006': ['23101001'],
    '23121000': ['23111002'],
    '23121002': ['23111001'],
    '23121003': ['23111003'],
    '23121011': ['23101001', '23110006'],
    '4121052': ['4120018', '4120019'],
    // 四飛閃：被動強化三飛閃傷害（%p）
    '4121013': ['4111010'],
  };
  /**
   * 超技名稱綁定在 carrier，但數值應加成到另一招的 damPlus
   * （傳說之槍-追加強化加農 → 落葉旋風射擊）
   * value: { targetId, requireCarrierId }
   */
  const HYPER_DAM_PLUS_REDIRECT = {
    '23120051': { targetId: '23111001', requireCarrierId: '23121002' },
  };
  /** 召喚魔神：學習後永久熟練度（取代／提高咒語精通） */
  const SUMMON_MASTERY_IDS = ['2121005', '2221005'];
  /** 神祕狙擊（火毒／冰雷） */
  const ARCANE_AIM_IDS = ['2120010', '2220010'];
  /** 依古尼斯咆嘯 */
  const IGNIS_ROAR_ID = '23110004';
  const ISHTAR_RING_ID = '23121000';
  const IRKALLA_ID = '400031024';
  const CRITICAL_REINFORCE_ID = '400031023';
  const IGNIS_EXTEND_ON_ISHTAR_SEC = 0.1;
  const TRINITY_ID = '65121101';
  const TRINITY_FUSION_ID = '400051072';
  const AFFINITY_IV_ID = '65120006';
  /** 名稱綁技能、但說明是「習得後永久」的超技 IED（不進該招 skillIed） */
  const HYPER_GLOBAL_IED_IDS = new Set(['65120047']);
  /** 親和力 IV 除外：索魂精通／聚光燈 companion／吉祥物結束段 */
  const AFFINITY_IV_EXCLUDE_IDS = new Set([
    '65120011', '400051019', '400051020', '400051027', '400051097',
  ]);
  const OVERDRIVE_ID = '400051033';
  const GRANDIS_GODDESS_ID = '400001047';
  const MANA_OVERLOAD_ID = '400021000';
  const ARCANA_OVERRIDE_ID = '400001021';
  /** 三位一體疊層：傷害／IED */
  let trinity = {
    stacks: 0,
    expiresAt: 0,
    perStackDamR: 0,
    perStackIed: 0,
    maxStacks: 2,
    skillId: TRINITY_ID,
  };
  /** 祕術超越：施放滿層後每 y 秒掉 1 階 */
  let arcanaOverride = {
    stacks: 0,
    expiresAt: 0,
    nextDropAt: 0,
    dropMs: 10000,
    perStackFinalDamR: 0,
    maxStacks: 3,
    skillId: ARCANA_OVERRIDE_ID,
  };
  /** 自然力重置：u% 屬性耐性削弱 → 放置以終傷近似 */
  const ELEMENTAL_RESET_IDS = new Set(['2110015', '2210016']);
  /** 元素適應／水盾：永久異常／屬性抗性 → 放置以減傷近似 */
  const ELEMENTAL_ADAPT_IDS = ['2111011', '2211012', '23111005', '23120047', '23120048'];

  function emptySkillEnhance() {
    return {
      damR: 0,
      targetPlus: 0,
      attackCount: 0,
      prop: 0,
      cr: 0,
      ied: 0,
      bdR: 0,
      coolTimeR: 0,
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

  /** 五轉 1～4 轉強化核心（psdSkill + damR_5th；超技能也是 infoType 50，不可混用） */
  function isVBoostPassive(skill) {
    if (!skill) return false;
    if (Number(skill.hyper) === 1 || Number(skill.hyper) === 2) return false;
    if (skill.common?.damR_5th == null || String(skill.common.damR_5th) === '') return false;
    if (Number(skill.infoType) === 50) return true;
    const psd = skill.psdSkill || skill.wz?.psdSkill;
    return Array.isArray(psd) && psd.length > 0;
  }

  function vBoostTargetIds(skill) {
    const psd = skill?.psdSkill || skill?.wz?.psdSkill;
    if (!Array.isArray(psd)) return [];
    return psd.map((id) => String(id || '')).filter(Boolean);
  }

  /** 楓之谷／格蘭蒂斯女神祝福：額外加上對應勇士祝福已加成能力值的 x% */
  function goddessWarriorExtraFlats(stat, warriorName) {
    const extra = { flatStr: 0, flatDex: 0, flatInt: 0, flatLuk: 0 };
    const ratio = Math.max(0, Number(stat?.xVal) || 0) / 100;
    const name = String(warriorName || '').trim();
    if (!(ratio > 0) || !name || typeof CharacterProgression === 'undefined'
      || typeof SkillCatalog === 'undefined' || typeof SkillFormula === 'undefined') {
      return extra;
    }
    const jobId = (typeof CharacterSkills !== 'undefined')
      ? CharacterSkills.currentJobId?.()
      : null;
    const skills = SkillCatalog.listSkills?.(jobId, { includeHidden: true }) || [];
    const mw = skills.find((s) => String(s?.name || '').trim() === name);
    if (!mw) return extra;
    const lv = evalLevel(mw.id) || 0;
    if (!(lv > 0)) return extra;
    const st = SkillFormula.evalStatCommon(mw.common, lv);
    const mwPct = Math.max(0, Number(st.basicStatUp) || 0);
    if (!(mwPct > 0)) return extra;
    const ap = CharacterProgression.getState?.()?.ap || {};
    [
      ['str', 'flatStr'],
      ['dex', 'flatDex'],
      ['int', 'flatInt'],
      ['luk', 'flatLuk'],
    ].forEach(([apKey, flatKey]) => {
      const invested = Math.max(0, Number(ap[apKey]) || 0);
      extra[flatKey] = Math.floor(Math.floor((invested * mwPct) / 100) * ratio);
    });
    return extra;
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

  /** 身上武器主屬攻擊力（底功＋星力＋卷軸＋星火），不含潛能／靈魂／套裝 */
  function getWornWeaponPureAtk() {
    if (typeof UiEquipModule === 'undefined' || typeof EquipTooltipModule === 'undefined') {
      return 0;
    }
    const mainEntry = UiEquipModule.getWornEntry?.('11');
    const zeroEntry = UiEquipModule.getWornEntry?.('37');
    const slotId = mainEntry?.itemId ? '11' : (zeroEntry?.itemId ? '37' : '');
    const entry = slotId === '11' ? mainEntry : zeroEntry;
    if (!slotId || !entry?.itemId) return 0;
    const item = EquipTooltipModule.resolveItemState(
      entry.itemId,
      `body:${slotId}`,
      entry.state,
    );
    if (!item) return 0;
    const segments = EquipTooltipModule.buildStatSegments?.(item) || [];
    const row = segments.find((seg) => seg && seg.label === '攻擊力');
    return Math.max(0, Number(row?.total) || 0);
  }

  function modsFromStat(stat, skillId, rawCommon, level, skillMeta) {
    if (!stat) return emptyTotals();
    const id = String(skillId || '');
    const isComboBody = COMBO_SKILL_IDS.has(id);
    const isHyperPas = isHyperSkillPassive(skillMeta)
      || (skillMeta == null && typeof SkillCatalog !== 'undefined'
        && isHyperSkillPassive(SkillCatalog.getSkill?.(id)));
    const isVBoostPas = isVBoostPassive(skillMeta)
      || (skillMeta == null && typeof SkillCatalog !== 'undefined'
        && isVBoostPassive(SkillCatalog.getSkill?.(id)));
    const isSkillBoundPas = isHyperPas || isVBoostPas;
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
    damAbsorbPct = scaleMercedesDamAbsorb(id, damAbsorbPct);
    const reflectPct = powerGuard > 0 ? (Number(stat.y) || 0) : 0;
    let flatMad = (Number(stat.madX) || 0) + (Number(stat.indieMad) || 0);
    // 咒語精通：WZ 的 x＝魔力
    if (SPELL_MASTERY_MAD_IDS.has(id)) {
      flatMad += Number(stat.xVal) || 0;
    }
    const allStat = Number(stat.indieAllStat) || 0;
    let flatPad = (Number(stat.padX) || 0) + (Number(stat.indiePad) || 0);
    // 進階雙弩槍精通：WZ 的 x＝攻擊力
    if (WEAPON_MASTERY_PAD_IDS.has(id)) {
      flatPad += Number(stat.xVal) || 0;
    }
    // 超速動能：武器純攻擊力 × x%（滿等 80%）加到攻擊力，不是總攻 padR
    if (id === OVERDRIVE_ID) {
      const pct = Math.max(0, Number(stat.xVal) || 0);
      if (pct > 0) {
        flatPad += Math.floor(getWornWeaponPureAtk() * pct / 100);
      }
    }
    // pdR／mdR 進同一桶相加；indiePMdR 另存，由終傷來源獨立相乘
    let finalDamR = isComboBody ? 0 : ((Number(stat.pdR) || 0) + (Number(stat.mdR) || 0));
    // 自然力重置：屬性耐性削弱在放置以終傷近似
    if (ELEMENTAL_RESET_IDS.has(id)) {
      finalDamR += Math.max(0, Number(stat.u) || 0);
    }
    if (id === MANA_OVERLOAD_ID) {
      finalDamR += Math.max(0, Number(stat.z) || 0);
    }
    const indiePMdR = isComboBody ? 0 : (Number(stat.indiePMdR) || 0);
    const damRBase = (Number(stat.damR) || 0) + (Number(stat.indieDamR) || 0);
    const extraMw = (id === '400001042')
      ? goddessWarriorExtraFlats(stat, '楓葉祝福')
      : ((id === GRANDIS_GODDESS_ID) ? goddessWarriorExtraFlats(stat, '超新星之勇士') : null);
    const padR = Number(stat.indiePadR) || 0;
    return {
      flatPad,
      flatStr: (Number(stat.strX) || 0) + allStat + (extraMw?.flatStr || 0),
      flatDex: (Number(stat.dexX) || 0) + allStat + (extraMw?.flatDex || 0),
      flatInt: (Number(stat.intX) || 0) + allStat + (extraMw?.flatInt || 0),
      flatLuk: (Number(stat.lukX) || 0) + allStat + (extraMw?.flatLuk || 0),
      coolTimeR: (Number(stat.coolTimeR) || 0) + (Number(stat.indieCooltimeReduce) || 0),
      padR,
      damR: (isComboBody || isSkillBoundPas) ? 0 : damRBase,
      bdR: (isComboBody || isSkillBoundPas)
        ? 0
        : ((Number(stat.bdR) || 0) + (Number(stat.indieBDR) || 0)),
      finalDamR,
      indiePMdR,
      critDmg: isComboBody ? 0 : (Number(stat.criticaldamage) || 0),
      critRate: isVBoostPas ? 0 : ((Number(stat.indieCr) || 0) + (Number(stat.cr) || 0)),
      ied: (isComboBody || isSkillBoundPas)
        ? 0
        : ((Number(stat.ignoreMobpdpR) || 0) + (Number(stat.indieIgnoreMobpdpR) || 0)),
      flatPdd: Number(stat.pddX) || 0,
      flatPddPerLevel: Number(stat.lv2pdd) || 0,
      flatMad,
      mhpR: Number(stat.mhpR) || 0,
      flatHpPerLevel: Number(stat.lv2mhp) || 0,
      flatHp: Number(stat.emhp) || 0,
      speedStages,
      speedModifiers,
      damAbsorbPct: Number(damAbsorbPct) || 0,
      reflectPct: Number(reflectPct) || 0,
      buffTimeR: Number(stat.bufftimeR) || 0,
      blockPct: Number(stat.stanceProp) || 0,
      basicStatUp: Number(stat.basicStatUp) || 0,
      mastery: Math.max(0, Number(stat.mastery) || 0),
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
    const cloneId = (id) => id === '4111002' || id === '400031007';
    const hadClone = buffs.some((b) => cloneId(String(b.id)));
    buffs = buffs.filter((b) => b.expiresAt > t);
    if (hadClone && !buffs.some((b) => cloneId(String(b.id)))) {
      notifyShadowPartnerClone();
    }
  }

  function notifyShadowPartnerClone() {
    if (typeof Paperdoll !== 'undefined' && typeof Paperdoll.syncShadowPartnerClone === 'function') {
      Paperdoll.syncShadowPartnerClone();
    }
  }

  /** 含實用的戰鬥命令加等；未學則 0 */
  function evalLevel(skillId) {
    if (typeof CharacterSkills === 'undefined') return 0;
    if (typeof CharacterSkills.getEffectiveLevel === 'function') {
      return Math.max(0, Number(CharacterSkills.getEffectiveLevel(skillId)) || 0);
    }
    return Math.max(0, Number(CharacterSkills.getLevel?.(skillId)) || 0);
  }

  const HOLY_SYMBOL_ID = '400001020';
  const LOADED_DICE_ID = '400051000';
  const HUNT_EXP_SKILL_IDS = [HOLY_SYMBOL_ID, LOADED_DICE_ID];

  function getHuntExpSources() {
    if (typeof SkillCatalog === 'undefined' || typeof SkillFormula === 'undefined') return [];
    if (typeof SkillFormula.evalStatCommon !== 'function') return [];
    const sources = [];
    HUNT_EXP_SKILL_IDS.forEach((id) => {
      const level = evalLevel(id);
      if (!(level > 0)) return;
      const skill = SkillCatalog.getSkill?.(id);
      if (!skill) return;
      const st = SkillFormula.evalStatCommon(skill.common, level);
      const value = Math.max(0, Number(st.huntExpR) || 0);
      if (!(value > 0)) return;
      sources.push({ id: String(id), name: String(skill.name || id), value });
    });
    return sources;
  }

  function getHuntExpR() {
    return getHuntExpSources().reduce((sum, row) => sum + (Number(row.value) || 0), 0);
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
    let masteryCap = 0;
    skills.forEach((skill) => {
      if (!skill || skill.skipPanel) return;
      const level = evalLevel(skill.id) || 0;
      if (!(level > 0)) return;
      const isPassiveLike = skill.type === 'passive' || skill.hyper === 1;
      // 五轉強化核心只綁 psdSkill，不可當全域終傷／無視／BOSS
      if (isVBoostPassive(skill)) return;
      const hasBasicStatUp = skill.common?.basicStatUp != null
        && String(skill.common.basicStatUp) !== '';
      const isBuffLearnedPassive = BUFF_LEARNED_PASSIVE_IDS.has(String(skill.id));
      if (!isPassiveLike && !hasBasicStatUp && !isBuffLearnedPassive) return;
      const st = SkillFormula.evalStatCommon(skill.common, level);
      if (isBuffLearnedPassive) {
        // 遠古意志：只吃永久格擋（迴避 prop 不套用）
        if (String(skill.id) === '23121004') {
          out.blockPct += Number(st.stanceProp) || 0;
        }
        // 精靈祝福：永久終傷
        if (String(skill.id) === '23121054') {
          out.finalDamR += Number(st.pdR) || 0;
        }
        if (String(skill.id) === '4121015') {
          const en = getSkillEnhance('4121015');
          out.bdR += (Number(st.bdR) || 0) + (Number(en?.bdR) || 0);
        }
        if (String(skill.id) === '400041032') {
          out.flatPad += Number(st.padX) || 0;
        }
        // 三位一體融合：永久 DEX
        if (String(skill.id) === TRINITY_FUSION_ID) {
          out.flatDex += Number(st.dexX) || 0;
        }
        if (!isPassiveLike && !hasBasicStatUp) return;
      }
      if (isPassiveLike) {
        const row = modsFromStat(st, skill.id, skill.common, level, skill);
        addInto(out, row);
        masteryCap = Math.max(masteryCap, Number(row.mastery) || 0);
        return;
      }
      out.basicStatUp += Number(st.basicStatUp) || 0;
    });

    // 召喚冰／火魔神：學習後永久熟練度（取較高）
    SUMMON_MASTERY_IDS.forEach((id) => {
      const level = evalLevel(id) || 0;
      if (!(level > 0)) return;
      const skill = SkillCatalog.getSkill?.(id);
      if (!skill?.common?.mastery) return;
      const st = SkillFormula.evalStatCommon(skill.common, level);
      masteryCap = Math.max(masteryCap, Number(st.mastery) || 0);
    });

    // 元素適應／水盾：被動 asrR／terR 以減傷近似（精靈遊俠再 ×0.5）
    ELEMENTAL_ADAPT_IDS.forEach((id) => {
      const level = evalLevel(id) || 0;
      if (!(level > 0)) return;
      const skill = SkillCatalog.getSkill?.(id);
      if (!skill?.common) return;
      const st = SkillFormula.evalStatCommon(skill.common, level);
      const asr = Math.max(0, Number(st.asrR) || 0);
      const ter = Math.max(0, Number(st.terR) || 0);
      out.damAbsorbPct += scaleMercedesDamAbsorb(id, asr);
      out.damAbsorbPct += scaleMercedesDamAbsorb(id, ter);
    });

    // 魔力彩帶-減輕盔甲：習得後永久 IED（超技名稱會誤綁技能，不走 getSkillEnhance）
    HYPER_GLOBAL_IED_IDS.forEach((id) => {
      const level = evalLevel(id) || 0;
      if (!(level > 0)) return;
      const skill = SkillCatalog.getSkill?.(id);
      if (!skill?.common) return;
      const st = SkillFormula.evalStatCommon(skill.common, level);
      out.ied += Number(st.ignoreMobpdpR) || 0;
    });

    out.mastery = Math.max(0, masteryCap);
    return out;
  }

  function pruneArcaneAim(t = nowMs()) {
    if (arcaneAim.stacks > 0 && !(arcaneAim.expiresAt > t)) {
      arcaneAim = { stacks: 0, expiresAt: 0, perStackDamR: 0, maxStacks: 5, skillId: '' };
    }
  }

  function getArcaneAimDamR(t = nowMs()) {
    pruneArcaneAim(t);
    if (!(arcaneAim.stacks > 0)) return 0;
    return Math.max(0, arcaneAim.stacks * (Number(arcaneAim.perStackDamR) || 0));
  }

  /** 神祕狙擊：非召喚命中時機率疊傷害層 */
  function tryProcArcaneAim(opts = {}) {
    if (opts.fromSummon) return false;
    if (typeof CharacterSkills === 'undefined' || typeof SkillCatalog === 'undefined') return false;
    if (typeof SkillFormula === 'undefined') return false;
    let info = null;
    for (let i = 0; i < ARCANE_AIM_IDS.length; i += 1) {
      const id = ARCANE_AIM_IDS[i];
      const level = evalLevel(id) || 0;
      if (!(level > 0)) continue;
      const skill = SkillCatalog.getSkill?.(id);
      if (!skill?.common) continue;
      info = { id, level, skill, st: SkillFormula.evalStatCommon(skill.common, level) };
      break;
    }
    if (!info?.st) return false;
    const prop = Math.max(0, Number(info.st.prop) || 0);
    if (!(prop > 0) || Math.random() * 100 >= prop) return false;
    const per = Math.max(0, Number(info.st.xVal) || 0);
    const maxStacks = Math.max(1, Math.floor(Number(info.st.y) || 5));
    const timeSec = Math.max(1, Number(info.st.timeSec) || 5);
    const t = nowMs();
    pruneArcaneAim(t);
    arcaneAim.skillId = info.id;
    arcaneAim.perStackDamR = per;
    arcaneAim.maxStacks = maxStacks;
    arcaneAim.stacks = Math.min(maxStacks, (Number(arcaneAim.stacks) || 0) + 1);
    arcaneAim.expiresAt = t + timeSec * 1000;
    if (typeof IdleHunt !== 'undefined') IdleHunt.syncHuntOverlayBars?.();
    if (typeof IdleBoss !== 'undefined') IdleBoss.syncBossOverlayBars?.();
    return true;
  }

  function pruneIgnisRoar(t = nowMs()) {
    if (ignisRoar.stacks > 0 && !(ignisRoar.expiresAt > t)) {
      ignisRoar = {
        stacks: 0,
        expiresAt: 0,
        perStackFinalDamR: 0,
        maxStacks: 5,
        speedMod: 0,
        skillId: IGNIS_ROAR_ID,
      };
    }
  }

  function getIgnisRoarFinalDamR(t = nowMs()) {
    pruneIgnisRoar(t);
    if (!(ignisRoar.stacks > 0)) return 0;
    return Math.max(0, ignisRoar.stacks * (Number(ignisRoar.perStackFinalDamR) || 0));
  }

  function getIgnisRoarSpeedMod(t = nowMs()) {
    pruneIgnisRoar(t);
    if (!(ignisRoar.stacks > 0)) return 0;
    return Number(ignisRoar.speedMod) || 0;
  }

  /**
   * 依古尼斯咆嘯：使用連接技能時疊終傷（加總），並維持攻速加成。
   * opts.fromLink — 技能連鎖／接技／可連接主動技／精靈攻擊技
   */
  function tryProcIgnisRoar(opts = {}) {
    if (!opts.fromLink) return false;
    if (typeof CharacterSkills === 'undefined' || typeof SkillCatalog === 'undefined') return false;
    if (typeof SkillFormula === 'undefined') return false;
    const level = evalLevel(IGNIS_ROAR_ID) || 0;
    if (!(level > 0)) return false;
    const skill = SkillCatalog.getSkill?.(IGNIS_ROAR_ID);
    if (!skill?.common) return false;
    const st = SkillFormula.evalStatCommon(skill.common, level);
    // x＝每層終傷%；勿與 padX 公式裡的 x 混淆（eval 後 xVal 已是常數）
    const per = Math.max(0, Number(st.xVal) || 0);
    if (!(per > 0)) return false;
    const maxStacks = Math.max(1, Math.floor(Number(st.y) || 5));
    // WZ subTime＝秒（固定 45）；evalStatCommon 的 subTimeMs 啟發式不適用
    let timeSec = 45;
    if (skill.common.subTime != null && String(skill.common.subTime) !== '') {
      const raw = SkillFormula.evalExpr(skill.common.subTime, { x: level });
      if (Number.isFinite(raw) && raw > 0) timeSec = raw;
    }
    const speedRaw = Number(st.u);
    const speedMod = Number.isFinite(speedRaw) ? speedRaw : 0;
    const t = nowMs();
    pruneIgnisRoar(t);
    ignisRoar.skillId = IGNIS_ROAR_ID;
    ignisRoar.perStackFinalDamR = per;
    ignisRoar.maxStacks = maxStacks;
    ignisRoar.speedMod = speedMod;
    ignisRoar.stacks = Math.min(maxStacks, (Number(ignisRoar.stacks) || 0) + 1);
    ignisRoar.expiresAt = t + timeSec * 1000;
    if (typeof IdleHunt !== 'undefined') IdleHunt.syncHuntOverlayBars?.();
    if (typeof IdleBoss !== 'undefined') IdleBoss.syncBossOverlayBars?.();
    return true;
  }

  /** 伊修塔爾／伊里加爾命中：延長依古尼斯持續時間 */
  function extendIgnisRoarFromHit(skillId) {
    const id = String(skillId || '');
    let addSec = 0;
    if (id === ISHTAR_RING_ID) addSec = IGNIS_EXTEND_ON_ISHTAR_SEC;
    else if (id === IRKALLA_ID) {
      addSec = 0.3;
      const skill = typeof SkillCatalog !== 'undefined' ? SkillCatalog.getSkill?.(IRKALLA_ID) : null;
      const lv = evalLevel(IRKALLA_ID) || 1;
      if (skill?.common?.t != null && typeof SkillFormula !== 'undefined') {
        const raw = SkillFormula.evalExpr(skill.common.t, { x: lv });
        if (Number.isFinite(raw) && raw > 0) addSec = raw;
      }
    }
    if (!(addSec > 0)) return false;
    const t = nowMs();
    pruneIgnisRoar(t);
    if (!(ignisRoar.stacks > 0)) return false;
    ignisRoar.expiresAt = Math.max(ignisRoar.expiresAt, t) + addSec * 1000;
    return true;
  }

  function getCriticalReinforceX() {
    if (!hasBuff(CRITICAL_REINFORCE_ID)) return 0;
    const skill = typeof SkillCatalog !== 'undefined' ? SkillCatalog.getSkill?.(CRITICAL_REINFORCE_ID) : null;
    const lv = evalLevel(CRITICAL_REINFORCE_ID) || 0;
    if (!skill || !(lv > 0) || typeof SkillFormula === 'undefined') return 0;
    const st = SkillFormula.evalStatCommon(skill.common, lv);
    return Math.max(0, Number(st.xVal) || 0);
  }

  function pruneTrinity(t = nowMs()) {
    if (trinity.stacks > 0 && !(trinity.expiresAt > t)) {
      trinity = {
        stacks: 0,
        expiresAt: 0,
        perStackDamR: 0,
        perStackIed: 0,
        maxStacks: 2,
        skillId: TRINITY_ID,
      };
    }
  }

  function getTrinityDamR(t = nowMs()) {
    pruneTrinity(t);
    if (!(trinity.stacks > 0)) return 0;
    return Math.max(0, trinity.stacks * (Number(trinity.perStackDamR) || 0));
  }

  function getTrinityIed(t = nowMs()) {
    pruneTrinity(t);
    if (!(trinity.stacks > 0)) return 0;
    return Math.max(0, trinity.stacks * (Number(trinity.perStackIed) || 0));
  }

  function emptyArcanaOverride() {
    return {
      stacks: 0,
      expiresAt: 0,
      nextDropAt: 0,
      dropMs: 10000,
      perStackFinalDamR: 0,
      maxStacks: 3,
      skillId: ARCANA_OVERRIDE_ID,
    };
  }

  function pruneArcanaOverride(t = nowMs()) {
    if (!(arcanaOverride.stacks > 0)) return;
    if (!(arcanaOverride.expiresAt > t)) {
      arcanaOverride = emptyArcanaOverride();
      return;
    }
    const dropMs = Math.max(1000, Number(arcanaOverride.dropMs) || 10000);
    while (arcanaOverride.stacks > 1 && arcanaOverride.nextDropAt <= t) {
      arcanaOverride.stacks -= 1;
      arcanaOverride.nextDropAt += dropMs;
    }
  }

  function getArcanaOverrideFinalDamR(t = nowMs()) {
    pruneArcanaOverride(t);
    if (!(arcanaOverride.stacks > 0)) return 0;
    return Math.max(0, arcanaOverride.stacks * (Number(arcanaOverride.perStackFinalDamR) || 0));
  }

  function applyArcanaOverride(opts = {}) {
    const t = nowMs();
    const durationMs = Math.max(0, Number(opts.durationMs) || 0);
    const stacks = Math.max(1, Math.floor(Number(opts.stacks) || 3));
    const per = Math.max(0, Number(opts.perStackFinalDamR) || 0);
    const dropMs = Math.max(1000, Number(opts.dropMs) || 10000);
    arcanaOverride = {
      stacks,
      expiresAt: t + durationMs,
      nextDropAt: t + dropMs,
      dropMs,
      perStackFinalDamR: per,
      maxStacks: stacks,
      skillId: String(opts.skillId || ARCANA_OVERRIDE_ID),
    };
    if (typeof IdleHunt !== 'undefined') IdleHunt.syncHuntOverlayBars?.();
    if (typeof IdleBoss !== 'undefined') IdleBoss.syncBossOverlayBars?.();
    return true;
  }

  /** 三位一體命中：疊傷害／IED（最多 y 層、維持 time 秒）；融合也可疊 */
  function tryProcTrinity(skillId) {
    const sid = String(skillId || '');
    if (sid !== TRINITY_ID && sid !== TRINITY_FUSION_ID) return false;
    if (typeof CharacterSkills === 'undefined' || typeof SkillCatalog === 'undefined') return false;
    if (typeof SkillFormula === 'undefined') return false;
    const level = evalLevel(TRINITY_ID) || 0;
    if (!(level > 0)) return false;
    const skill = SkillCatalog.getSkill?.(TRINITY_ID);
    if (!skill?.common) return false;
    const st = SkillFormula.evalStatCommon(skill.common, level);
    const per = Math.max(0, Number(st.xVal) || 0);
    if (!(per > 0)) return false;
    const maxStacks = Math.max(1, Math.floor(Number(st.y) || 2));
    const timeSec = Math.max(1, Number(st.timeSec) || 30);
    const t = nowMs();
    pruneTrinity(t);
    trinity.skillId = TRINITY_ID;
    trinity.perStackDamR = per;
    trinity.perStackIed = per;
    trinity.maxStacks = maxStacks;
    trinity.stacks = Math.min(maxStacks, (Number(trinity.stacks) || 0) + 1);
    trinity.expiresAt = t + timeSec * 1000;
    if (typeof IdleHunt !== 'undefined') IdleHunt.syncHuntOverlayBars?.();
    if (typeof IdleBoss !== 'undefined') IdleBoss.syncBossOverlayBars?.();
    return true;
  }

  /** 親和力 IV：本職攻擊觸發技能傷害 buff */
  function tryProcAffinityHeart(skillId) {
    if (typeof CharacterSkills === 'undefined' || typeof SkillCatalog === 'undefined') return false;
    if (typeof SkillFormula === 'undefined') return false;
    const sid = String(skillId || '');
    if (!/^65(00|10|11|12)\d+$/.test(sid) && !/^400051/.test(sid)) return false;
    if (AFFINITY_IV_EXCLUDE_IDS.has(sid)) return false;
    const level = evalLevel(AFFINITY_IV_ID) || 0;
    if (!(level > 0)) return false;
    const skill = SkillCatalog.getSkill?.(AFFINITY_IV_ID);
    if (!skill?.common) return false;
    const st = SkillFormula.evalStatCommon(skill.common, level);
    const damR = Math.max(0, Number(st.y) || 0);
    if (!(damR > 0)) return false;
    const timeSec = Math.max(1, Number(st.timeSec) || 30);
    const durationMs = Math.round(timeSec * 1000 * getBuffDurationMultiplier());
    applyBuff({
      id: AFFINITY_IV_ID,
      name: skill.name || '',
      icon: skill.icon || '',
      durationMs,
      damR,
    });
    if (typeof IdleHunt !== 'undefined') IdleHunt.syncHuntOverlayBars?.();
    if (typeof IdleBoss !== 'undefined') IdleBoss.syncBossOverlayBars?.();
    return true;
  }

  /** 魔力激發等：攻擊技能耗血倍率用的 costmpR% 加總 */
  function getPassiveCostMpR() {
    if (typeof CharacterSkills === 'undefined' || typeof SkillCatalog === 'undefined') return 0;
    if (typeof SkillFormula === 'undefined' || typeof SkillFormula.evalStatCommon !== 'function') {
      return 0;
    }
    // 直接查技能 id，避免職業線 list 漏本
    const ids = ['2110001', '2210001'];
    let total = 0;
    ids.forEach((id) => {
      const level = evalLevel(id) || 0;
      if (!(level > 0)) return;
      const skill = SkillCatalog.getSkill?.(id);
      if (!skill?.common || skill.common.costmpR == null) return;
      const st = SkillFormula.evalStatCommon(skill.common, level);
      total += Number(st.costmpR) || 0;
    });
    return Math.max(0, total);
  }

  /** 魔力吸收：2100000／2200000 */
  function getManaAbsorbPassive() {
    if (typeof CharacterSkills === 'undefined' || typeof SkillCatalog === 'undefined') return null;
    if (typeof SkillFormula === 'undefined' || typeof SkillFormula.evalStatCommon !== 'function') {
      return null;
    }
    const ids = ['2100000', '2200000'];
    for (let i = 0; i < ids.length; i += 1) {
      const id = ids[i];
      const level = evalLevel(id) || 0;
      if (!(level > 0)) continue;
      const skill = SkillCatalog.getSkill?.(id);
      if (!skill?.common) continue;
      const st = SkillFormula.evalStatCommon(skill.common, level);
      return { id, level, skill, stat: st };
    }
    return null;
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
   * 雙型態技能：本體與滿鬥氣 companion（如 1121008／1120017）共用同一組強化。
   */
  function enhanceAliasIds(skillId, skills) {
    const tid = String(skillId || '');
    const ids = new Set();
    if (!tid) return ids;
    ids.add(tid);
    const self = typeof SkillCatalog !== 'undefined' ? SkillCatalog.getSkill?.(tid) : null;
    if (self?.enhancedSkillId) ids.add(String(self.enhancedSkillId));
    (skills || []).forEach((s) => {
      if (String(s?.enhancedSkillId || '') === tid) ids.add(String(s.id));
    });
    return ids;
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
    const aliases = enhanceAliasIds(tid, skills);
    skills.forEach((skill) => {
      if (isVBoostPassive(skill)) {
        const level = evalLevel(skill.id) || 0;
        if (!(level > 0)) return;
        const targets = vBoostTargetIds(skill);
        if (!targets.some((id) => aliases.has(id))) return;
        const st = SkillFormula.evalStatCommon(skill.common, level);
        out.damR += Number(st.damR_5th) || 0;
        out.targetPlus += Number(st.targetPlus_5th) || 0;
        out.ied += Number(st.ignoreMobpdpR) || 0;
        out.bdR += Number(st.bdR) || 0;
        out.cr += Number(st.cr) || 0;
        return;
      }
      if (!isHyperSkillPassive(skill)) return;
      // 鬥氣超技由 SkillComboOrbs 處理，不進技能專屬傷害／機率
      if (COMBO_SKILL_IDS.has(String(skill.id))) return;
      const level = evalLevel(skill.id) || 0;
      if (!(level > 0)) return;
      const hyperTid = resolveHyperTargetId(skill);
      if (!hyperTid || !aliases.has(hyperTid)) return;
      // 追加強化加農：damR 改走落葉 damPlus，不加成傳說之槍本體
      if (HYPER_DAM_PLUS_REDIRECT[String(skill.id)]) return;
      const st = SkillFormula.evalStatCommon(skill.common, level);
      out.damR += Number(st.damR) || 0;
      out.targetPlus += Number(st.targetPlus) || 0;
      // attackCount 在超技 common 是「追加段數」，不是絕對值
      if (skill.common?.attackCount != null && String(skill.common.attackCount) !== '') {
        const bonusAtk = typeof SkillFormula.evalExpr === 'function'
          ? SkillFormula.evalExpr(skill.common.attackCount, { x: level })
          : Number(st.attackCount);
        out.attackCount += Math.max(0, Number(bonusAtk) || 0);
      } else if (skill.common?.bulletCount != null && String(skill.common.bulletCount) !== '') {
        const bonusBullet = typeof SkillFormula.evalExpr === 'function'
          ? SkillFormula.evalExpr(skill.common.bulletCount, { x: level })
          : Number(st.bulletCount);
        out.attackCount += Math.max(0, Number(bonusBullet) || 0);
      }
      out.prop += Number(st.prop) || 0;
      out.cr += Number(st.cr) || 0;
      if (!HYPER_GLOBAL_IED_IDS.has(String(skill.id))) {
        out.ied += Number(st.ignoreMobpdpR) || 0;
      }
      out.bdR += Number(st.bdR) || 0;
      out.coolTimeR += Number(st.coolTimeR) || 0;
    });
    if (aliases.has(TRINITY_ID)) {
      out.damR += getTrinityDamR();
      out.ied += getTrinityIed();
    }
    return out;
  }

  /**
   * 技能連結被動 damPlus（%p）：學了 carrier 後加算到 target 技能傷害％
   */
  function getSkillDamPlusBonus(targetSkillId) {
    const tid = String(targetSkillId || '');
    if (!tid || typeof CharacterSkills === 'undefined' || typeof SkillCatalog === 'undefined') {
      return 0;
    }
    if (typeof SkillFormula === 'undefined' || typeof SkillFormula.evalStatCommon !== 'function') {
      return 0;
    }
    let sum = 0;
    Object.keys(DAM_PLUS_LINKS).forEach((carrierId) => {
      const targets = DAM_PLUS_LINKS[carrierId] || [];
      if (!targets.includes(tid)) return;
      const level = evalLevel(carrierId) || 0;
      if (!(level > 0)) return;
      const skill = SkillCatalog.getSkill?.(carrierId);
      if (!skill?.common) return;
      const st = SkillFormula.evalStatCommon(skill.common, level);
      sum += Math.max(0, Number(st.damPlus) || 0);
    });
    Object.keys(HYPER_DAM_PLUS_REDIRECT).forEach((hyperId) => {
      const spec = HYPER_DAM_PLUS_REDIRECT[hyperId];
      if (!spec || String(spec.targetId) !== tid) return;
      if (spec.requireCarrierId
        && !(evalLevel(spec.requireCarrierId) > 0)) return;
      const level = evalLevel(hyperId) || 0;
      if (!(level > 0)) return;
      const skill = SkillCatalog.getSkill?.(hyperId);
      if (!skill?.common) return;
      const st = SkillFormula.evalStatCommon(skill.common, level);
      // WZ 用 damR 表示「追加 %p」
      sum += Math.max(0, Number(st.damR) || 0);
    });
    return sum;
  }

  /** 施放用 common 的全域標記（過去曾對 CD 主動攻擊 ×mobCount，已取消） */
  function applyGlobalCombatRules(skill, common) {
    const base = common && typeof common === 'object' ? { ...common } : {};
    if (base._globalCombatRules) return base;
    base._globalCombatRules = true;
    return base;
  }

  /**
   * 普力特等 indieCooltimeReduce：WZ「不受冷卻時間初始化影響的技能」不吃。
   * 五轉 rank 200 幾乎都有 notCooltimeReset，匯入未帶旗標時以 rank 代替。
   */
  function ignoresBuffCooltimeReduce(skillId) {
    if (typeof SkillCatalog === 'undefined' || !skillId) return false;
    const skill = SkillCatalog.getSkill?.(String(skillId));
    if (!skill) return false;
    if (skill.notCooltimeReset === true || Number(skill.notCooltimeReset) === 1) return true;
    if (Number(skill.wz?.notCooltimeReset) === 1) return true;
    return String(skill.rank) === '200';
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
    const damPlus = getSkillDamPlusBonus(skillId);
    base.damagePct = (damR > 0 ? dmg * (1 + damR / 100) : dmg) + damPlus;
    base.attackCount = Math.max(1, (Number(base.attackCount) || 1) + (Number(en.attackCount) || 0));
    base.mobCount = Math.max(1, (Number(base.mobCount) || 1) + (Number(en.targetPlus) || 0));
    const buffCool = ignoresBuffCooltimeReduce(skillId)
      ? 0
      : Math.max(0, Number(getBuffTotals().coolTimeR) || 0);
    const coolCut = Math.max(0, Number(en.coolTimeR) || 0) + buffCool;
    if (coolCut > 0 && Number(base.cooltimeSec) > 0) {
      base.cooltimeSec = Math.max(0, Number(base.cooltimeSec) * (1 - coolCut / 100));
    }
    base._hyperEnhance = en;
    base._damPlus = damPlus;
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

  /** 技能面板／Tooltip：占位符用 common（同步實際傷害％含 damPlus、mobCount、CD） */
  function resolvePanelCommon(skill, level) {
    const raw = skill?.common && typeof skill.common === 'object' ? { ...skill.common } : {};
    const stats = resolveCastCommon(skill, level);
    if (!stats) return raw;
    raw.mobCount = String(Math.max(1, Math.floor(Number(stats.mobCount) || 1)));
    if (stats.cooltimeSec > 0) raw.cooltime = String(stats.cooltimeSec);
    // 顯示實際施放傷害％（含連結 damPlus／超技）；固定數字避免再被公式重算
    if ((Number(stats.damagePct) || 0) > 0) {
      raw.damage = String(Math.round(Number(stats.damagePct)));
    }
    // 狂暴攻擊等雙型態：#x／#y 是滿鬥氣傷害／段數，同樣套超技＋五轉核心
    if (skill.enhancedSkillId && typeof SkillFormula !== 'undefined') {
      const lv = Math.max(1, Math.floor(Number(level) || 0));
      const enh = typeof SkillCatalog !== 'undefined'
        ? SkillCatalog.getSkill?.(String(skill.enhancedSkillId))
        : null;
      let enhDmg = 0;
      let enhAtk = 0;
      if (enh?.common && typeof SkillFormula.evalCommon === 'function') {
        const ev = SkillFormula.evalCommon(enh.common, lv);
        enhDmg = Number(ev.damagePct) || 0;
        enhAtk = Number(ev.attackCount) || 0;
      }
      if (!(enhDmg > 0) && raw.x != null && String(raw.x) !== ''
        && typeof SkillFormula.evalExpr === 'function') {
        enhDmg = SkillFormula.evalExpr(raw.x, { x: lv }) || 0;
      }
      if (!(enhAtk > 0) && raw.y != null && String(raw.y) !== ''
        && typeof SkillFormula.evalExpr === 'function') {
        enhAtk = Math.floor(SkillFormula.evalExpr(raw.y, { x: lv })) || 0;
      }
      const en = getSkillEnhance(String(skill.id));
      const damR = Number(en.damR) || 0;
      const damPlus = getSkillDamPlusBonus(String(skill.id));
      if (enhDmg > 0 && raw.x != null && String(raw.x) !== '') {
        raw.x = String(Math.round((damR > 0 ? enhDmg * (1 + damR / 100) : enhDmg) + damPlus));
      }
      if (enhAtk > 0 && raw.y != null && String(raw.y) !== '') {
        raw.y = String(Math.max(1, enhAtk + (Number(en.attackCount) || 0)));
      }
    }
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

  /**
   * 技能終傷來源（每筆獨立 ×(1+x/100)，不把多招 pdR 加總成一桶）。
   * — 被動／超技：pdR、mdR、indiePMdR
   * — 時限 buff：同上（如靈魂深造 indiePMdR）
   * — 精靈祝福等「習得即永久」終傷
   */
  function getSkillFinalDamageSources(t = nowMs()) {
    const sources = [];
    const seen = new Set();
    const push = (id, name, value, tag) => {
      const n = Number(value) || 0;
      if (!(n > 0)) return;
      const key = `${String(id || name || '')}:${tag || 'fd'}`;
      if (seen.has(key)) return;
      seen.add(key);
      sources.push({ id: String(id || ''), name: name || '技能終傷', value: n });
    };

    pruneBuffs(t);
    buffs.forEach((b) => {
      const pd = (Number(b.finalDamR) || 0);
      const indie = Number(b.indiePMdR) || 0;
      if (pd > 0) push(b.id, b.name, pd, 'pd');
      if (indie > 0) push(b.id, b.name, indie, 'indie');
    });
    const arcanaFd = getArcanaOverrideFinalDamR(t);
    if (arcanaFd > 0) {
      const skill = typeof SkillCatalog !== 'undefined'
        ? SkillCatalog.getSkill?.(ARCANA_OVERRIDE_ID)
        : null;
      push(ARCANA_OVERRIDE_ID, skill?.name || '祕術超越', arcanaFd, 'stack');
    }

    if (typeof CharacterSkills === 'undefined' || typeof SkillCatalog === 'undefined') {
      return sources;
    }
    if (typeof SkillFormula === 'undefined' || typeof SkillFormula.evalStatCommon !== 'function') {
      return sources;
    }
    const jobId = CharacterSkills.currentJobId?.();
    const skills = SkillCatalog.listSkills?.(jobId, { includeHidden: true }) || [];
    skills.forEach((skill) => {
      if (!skill || skill.skipPanel) return;
      const level = evalLevel(skill.id) || 0;
      if (!(level > 0)) return;
      const id = String(skill.id);
      // 鬥氣本體終傷由 SkillComboOrbs 層數處理
      if (COMBO_SKILL_IDS.has(id)) return;
      const isPassiveLike = skill.type === 'passive' || skill.hyper === 1;
      const isBuffLearned = BUFF_LEARNED_PASSIVE_IDS.has(id);
      if (!isPassiveLike && !isBuffLearned) return;
      if (isVBoostPassive(skill)) return;
      const st = SkillFormula.evalStatCommon(skill.common, level);
      if (isBuffLearned && id === '23121054') {
        push(id, skill.name, st.pdR, 'pd');
        return;
      }
      if (!isPassiveLike) return;
      // hyper=1 的 damR 是技能強化，不是角色終傷
      if (isHyperSkillPassive(skill)) return;
      const row = modsFromStat(st, skill.id, skill.common, level, skill);
      if ((Number(row.finalDamR) || 0) > 0) push(id, skill.name, row.finalDamR, 'pd');
      if ((Number(row.indiePMdR) || 0) > 0) push(id, skill.name, row.indiePMdR, 'indie');
    });
    return sources;
  }

  function getTotals(t = nowMs()) {
    const out = addInto(addInto(getPassiveTotals(), getBuffTotals(t)), getComboTotals());
    out.damR = (Number(out.damR) || 0) + getArcaneAimDamR(t);
    // 依古尼斯層數終傷不進 pdR 桶（層間加總，再與其他終傷來源相乘）
    out.speedModifiers = (Number(out.speedModifiers) || 0) + getIgnisRoarSpeedMod(t);
    if (out.speedModifiers < 0) {
      out.speedStages = Math.max(Number(out.speedStages) || 0, Math.abs(out.speedModifiers));
    }
    if (typeof ThrowingStarStore !== 'undefined' && typeof ThrowingStarStore.frontIncPad === 'function') {
      out.flatPad = (Number(out.flatPad) || 0) + (ThrowingStarStore.frontIncPad() || 0);
    }
    const reinforceX = getCriticalReinforceX();
    if (reinforceX > 0) {
      let cr = Number(out.critRate) || 0;
      if (typeof CharacterProgression !== 'undefined' && CharacterProgression.getCombatBonus) {
        cr += Number(CharacterProgression.getCombatBonus()?.critRate) || 0;
      }
      out.critDmg = (Number(out.critDmg) || 0) + cr * (reinforceX / 100);
    }
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
      const hadPartner = buffs.some((b) => String(b.id) === '4111002');
      buffs = [];
      if (hadPartner) notifyShadowPartnerClone();
      return;
    }
    const key = String(id);
    const hadPartner = key === '4111002' && buffs.some((b) => b.id === key);
    buffs = buffs.filter((b) => b.id !== key);
    if (hadPartner) notifyShadowPartnerClone();
  }

  function reset() {
    const hadPartner = buffs.some((b) => String(b.id) === '4111002');
    buffs = [];
    arcaneAim = { stacks: 0, expiresAt: 0, perStackDamR: 0, maxStacks: 5, skillId: '' };
    ignisRoar = {
      stacks: 0,
      expiresAt: 0,
      perStackFinalDamR: 0,
      maxStacks: 5,
      speedMod: 0,
      skillId: IGNIS_ROAR_ID,
    };
    trinity = {
      stacks: 0,
      expiresAt: 0,
      perStackDamR: 0,
      perStackIed: 0,
      maxStacks: 2,
      skillId: TRINITY_ID,
    };
    arcanaOverride = emptyArcanaOverride();
    if (hadPartner) notifyShadowPartnerClone();
  }

  function hasBuff(id, t = nowMs()) {
    pruneBuffs(t);
    const key = String(id);
    if (buffs.some((b) => b.id === key)) return true;
    pruneArcaneAim(t);
    if (arcaneAim.stacks > 0 && String(arcaneAim.skillId || ARCANE_AIM_IDS[0]) === key) return true;
    pruneIgnisRoar(t);
    if (ignisRoar.stacks > 0 && String(ignisRoar.skillId || IGNIS_ROAR_ID) === key) return true;
    pruneTrinity(t);
    if (trinity.stacks > 0 && String(trinity.skillId || TRINITY_ID) === key) return true;
    pruneArcanaOverride(t);
    if (arcanaOverride.stacks > 0 && String(arcanaOverride.skillId || ARCANA_OVERRIDE_ID) === key) return true;
    return false;
  }

  /** 時限 buff 剩餘毫秒（未生效／非表列堆疊 buff 回 0） */
  function getBuffRemainMs(id, t = nowMs()) {
    pruneBuffs(t);
    const key = String(id || '');
    if (!key) return 0;
    const row = buffs.find((b) => b.id === key);
    if (!row || !(row.expiresAt > t)) return 0;
    return Math.max(0, row.expiresAt - t);
  }

  /** 影分身：最終傷害追加段 %（WZ x，override 為 shadowPartnerR） */
  const SHADOW_PARTNER_ID = '4111002';
  function getShadowPartnerRate() {
    if (!hasBuff(SHADOW_PARTNER_ID)) return 0;
    const level = (typeof CharacterSkills !== 'undefined')
      ? (evalLevel(SHADOW_PARTNER_ID) || 0)
      : 0;
    if (!(level > 0) || typeof SkillCatalog === 'undefined' || typeof SkillFormula === 'undefined') {
      return 0;
    }
    const skill = SkillCatalog.getSkill?.(SHADOW_PARTNER_ID);
    if (!skill?.common) return 0;
    const st = SkillFormula.evalStatCommon(skill.common, level);
    return Math.max(0, Number(st.shadowPartnerR) || Number(st.xVal) || 0);
  }

  function pushStackBuff(list, t, row, fallbackId, nameHint) {
    if (!(row?.stacks > 0) || !(row.expiresAt > t)) return;
    const id = String(row.skillId || fallbackId);
    const skill = typeof SkillCatalog !== 'undefined' ? SkillCatalog.getSkill?.(id) : null;
    const stacks = Math.max(0, Math.floor(Number(row.stacks) || 0));
    list.push({
      id,
      name: skill?.name || nameHint || id,
      icon: skill?.icon || '',
      expiresAt: row.expiresAt,
      remainMs: Math.max(0, row.expiresAt - t),
      durationMs: Math.max(0, row.expiresAt - t),
      stacks,
      maxStacks: Math.max(1, Math.floor(Number(row.maxStacks) || 1)),
      isStackBuff: true,
      hideTimer: false,
    });
  }

  function pushComboOrbBuff(list, t) {
    if (typeof SkillComboOrbs === 'undefined' || !SkillComboOrbs.isEnabled?.()) return;
    const stacks = Math.max(0, Math.floor(Number(SkillComboOrbs.getStacks?.()) || 0));
    if (!(stacks > 0)) return;
    const cfg = SkillComboOrbs.getConfig?.() || null;
    const id = String(cfg?.id || SkillComboOrbs.IDS?.adv || '1120003');
    const skill = typeof SkillCatalog !== 'undefined' ? SkillCatalog.getSkill?.(id) : null;
    list.push({
      id: `combo:${id}`,
      name: skill?.name || '鬥氣',
      icon: skill?.icon || '',
      expiresAt: t + 24 * 60 * 60 * 1000,
      remainMs: 0,
      durationMs: 0,
      stacks,
      maxStacks: Math.max(1, Math.floor(Number(cfg?.max) || 5)),
      isStackBuff: true,
      hideTimer: true,
    });
  }

  /** 作用中時限 buff（含神祕狙擊／依古尼斯／鬥氣等堆疊） */
  function listActiveBuffs(t = nowMs()) {
    pruneBuffs(t);
    pruneArcaneAim(t);
    pruneIgnisRoar(t);
    pruneTrinity(t);
    pruneArcanaOverride(t);
    const list = buffs.map((b) => ({
      id: b.id,
      name: b.name || b.id,
      icon: b.icon || '',
      expiresAt: b.expiresAt,
      remainMs: Math.max(0, b.expiresAt - t),
      durationMs: Number(b.durationMs) || 0,
      stacks: 0,
      maxStacks: 0,
      isStackBuff: false,
      hideTimer: false,
    }));
    list.forEach((row) => {
      if (String(row.id) !== ARCANA_OVERRIDE_ID) return;
      if (!(arcanaOverride.stacks > 0)) return;
      row.stacks = Math.max(0, Math.floor(Number(arcanaOverride.stacks) || 0));
      row.maxStacks = Math.max(1, Math.floor(Number(arcanaOverride.maxStacks) || 3));
      row.isStackBuff = true;
    });
    pushStackBuff(list, t, arcaneAim, ARCANE_AIM_IDS[0], '神祕狙擊');
    pushStackBuff(list, t, ignisRoar, IGNIS_ROAR_ID, '依古尼斯咆嘯');
    pushStackBuff(list, t, trinity, TRINITY_ID, '三位一體');
    pushComboOrbBuff(list, t);
    return list;
  }

  return {
    emptyTotals,
    emptySkillEnhance,
    getPassiveTotals,
    getHuntExpR,
    getHuntExpSources,
    getPassiveCostMpR,
    getManaAbsorbPassive,
    getBuffTotals,
    getComboTotals,
    getTotals,
    getSkillEnhance,
    getSkillDamPlusBonus,
    applySkillEnhance,
    applyGlobalCombatRules,
    resolveCastCommon,
    resolvePanelCommon,
    getBuffDurationMultiplier,
    resolveHyperTargetId,
    applyBuff,
    clearBuff,
    reset,
    hasBuff,
    getBuffRemainMs,
    listActiveBuffs,
    modsFromStat,
    flatStatKey,
    tryProcArcaneAim,
    getArcaneAimDamR,
    tryProcIgnisRoar,
    extendIgnisRoarFromHit,
    getCriticalReinforceX,
    getIgnisRoarFinalDamR,
    getSkillFinalDamageSources,
    tryProcTrinity,
    tryProcAffinityHeart,
    getTrinityDamR,
    applyArcanaOverride,
    getArcanaOverrideFinalDamR,
    getShowStackBuffCounts,
    setShowStackBuffCounts,
    getShadowPartnerRate,
    IGNIS_ROAR_ID,
    COMBO_SKILL_IDS,
  };
})();

if (typeof window !== 'undefined') {
  window.SkillModifiers = SkillModifiers;
}
