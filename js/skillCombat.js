/**
 * 狩獵技能選招／施放：
 * 優先度＝有 CD buff → 無 CD buff（持續中不重放）→ 有 CD 攻擊 → 無 CD 攻擊（依技能欄順序輪流）
 * 另含攻速、紙娃娃、特效／投擲物、多段傷害、終極攻擊、鬥氣
 */
const SkillCombat = (() => {
  /** @type {Record<string, number>} skillId → cooldownUntil (performance.now ms) */
  const cooldowns = Object.create(null);
  let castLockUntil = 0;
  /** 無 CD 攻擊上次施放的 loadout slot（輪流用） */
  let lastNoCdAttackSlot = -1;
  /** 閃電連擊：動畫進行中預約路徑目標，避免搶怪／連續施放無目標 */
  let nextChainReservationId = 1;
  /** @type {Map<number, { uids: Set<string>, expiresAt: number }>} */
  const chainReservations = new Map();
  /** 非同步施放世代：關閉／重置狩獵時作廢進行中的 setTimeout 結算 */
  let asyncCastEpoch = 1;
  /** @type {Set<{ epoch: number }>} */
  const activeAsyncCasts = new Set();
  /** 持續引導（伊修塔爾等）：{ skillId, stop, asyncId } */
  let activeSustainChannel = null;
  /** 傷害數字施放組序號（一次 cast／一波 channel tick） */
  let damageStackSeq = 1;
  /** 精靈遊俠技能連鎖 2–4：下次可觸發時間（最低間隔＝光速雙擊節奏） */
  let mercedesLinkFollowerReadyAt = 0;

  function nowMs() {
    return (typeof performance !== 'undefined' && performance.now)
      ? performance.now()
      : Date.now();
  }

  /** 真實時間延遲：跟隨 GM 遊戲倍速 */
  function scaleGameDelayMs(ms) {
    if (typeof IdleHunt !== 'undefined' && typeof IdleHunt.scaleDelayMs === 'function') {
      return IdleHunt.scaleDelayMs(ms);
    }
    return Math.max(0, Number(ms) || 0);
  }

  function scheduleAfterPaint(fn) {
    if (typeof fn !== 'function') return;
    const kick = () => {
      try { fn(); } catch (_) { /* ignore */ }
    };
    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(kick);
      return;
    }
    setTimeout(kick, 0);
  }

  function stopActiveSustainChannel() {
    const cur = activeSustainChannel;
    activeSustainChannel = null;
    castLockUntil = Math.min(castLockUntil, nowMs());
    if (typeof Paperdoll !== 'undefined') Paperdoll.stopHuntSwingLoop?.();
    if (typeof cur?.stop === 'function') {
      try { cur.stop(); } catch (_) { /* ignore */ }
    }
  }

  /**
   * 開新一輪傷害數字堆疊組。技能連鎖共用同一組；引導每一 tick 開一組。
   * 不影響目標分攤（_skillLinkTargetPlan）。
   */
  function beginDamageStackSession(ctx) {
    if (!ctx || typeof ctx !== 'object') return null;
    const session = {
      id: damageStackSeq++,
      nextIndex: 0,
      bySkill: Object.create(null),
    };
    ctx._damageStack = session;
    return session;
  }

  /** 非同步命中時暫時掛回該波施放組，避免被下一 tick／下一招覆寫 */
  function runWithDamageStackSession(ctx, session, fn) {
    if (typeof fn !== 'function') return undefined;
    if (!ctx || !session) return fn();
    const prev = ctx._damageStack;
    ctx._damageStack = session;
    try {
      return fn();
    } finally {
      ctx._damageStack = prev;
    }
  }

  /**
   * 為某個技能在本施放組內分配連續 stackIndex。
   * 多段招（attackCount>1）：同技能打多隻怪共用同一段 index。
   * 單段招：每次命中往上加一層（多箭等）。
   */
  function damageStackSlotsForSkill(ctx, skillId, attackCount, opts = {}) {
    const n = Math.max(1, Math.floor(Number(attackCount) || 1));
    if (opts.isolateStack) {
      return { stackGroup: damageStackSeq++, startIndex: 0, count: n };
    }
    let session = opts.session || (ctx && ctx._damageStack);
    if (!session) session = beginDamageStackSession(ctx);
    if (!session) {
      return { stackGroup: damageStackSeq++, startIndex: 0, count: n };
    }
    const key = skillId != null ? String(skillId) : `_anon:${session.nextIndex}`;
    const reuse = opts.forceReserve || n > 1;
    if (reuse && session.bySkill[key]) return session.bySkill[key];
    const startIndex = session.nextIndex;
    session.nextIndex += n;
    const slots = { stackGroup: session.id, startIndex, count: n };
    if (reuse) session.bySkill[key] = slots;
    return slots;
  }

  function invalidateAsyncCasts() {
    stopActiveSustainChannel();
    asyncCastEpoch += 1;
    activeAsyncCasts.clear();
  }

  function registerAsyncCast() {
    const handle = { epoch: asyncCastEpoch };
    activeAsyncCasts.add(handle);
    return handle;
  }

  function isAsyncCastLive(handle) {
    return !!(handle && handle.epoch === asyncCastEpoch && activeAsyncCasts.has(handle));
  }

  function releaseAsyncCast(handle) {
    if (handle) activeAsyncCasts.delete(handle);
  }

  function isCastLocked(t = nowMs()) {
    return t < castLockUntil;
  }

  function pruneChainReservations(t = nowMs()) {
    chainReservations.forEach((entry, id) => {
      if (entry.expiresAt <= t) chainReservations.delete(id);
    });
  }

  function isMobChainReserved(mob, exceptReservationId, opts = {}) {
    if (!mob) return false;
    if (!opts.skipPrune) pruneChainReservations();
    const uid = String(mob.uid);
    for (const [id, entry] of chainReservations) {
      if (exceptReservationId != null && id === exceptReservationId) continue;
      if (entry.uids.has(uid)) return true;
    }
    return false;
  }

  function filterChainAvailableMobs(mobs, exceptReservationId) {
    pruneChainReservations();
    return (mobs || []).filter((m) => m && !isMobChainReserved(m, exceptReservationId, { skipPrune: true }));
  }

  function reserveChainMobs(mobs, ttlMs) {
    pruneChainReservations();
    const id = nextChainReservationId++;
    const uids = new Set();
    (mobs || []).forEach((m) => {
      if (m && m.uid != null) uids.add(String(m.uid));
    });
    chainReservations.set(id, {
      uids,
      expiresAt: nowMs() + Math.max(200, Number(ttlMs) || 2000),
    });
    return id;
  }

  function releaseChainReservation(id) {
    if (id != null) chainReservations.delete(id);
  }

  function releaseMobFromChainReservation(reservationId, mob) {
    if (reservationId == null || mob?.uid == null) return;
    const entry = chainReservations.get(reservationId);
    if (!entry) return;
    entry.uids.delete(String(mob.uid));
    if (entry.uids.size === 0) chainReservations.delete(reservationId);
  }

  function reset(opts = {}) {
    invalidateAsyncCasts();
    if (typeof Paperdoll !== 'undefined') Paperdoll.setComboMoveHold?.(false);
    if (!opts.keepCooldowns) {
      Object.keys(cooldowns).forEach((k) => { delete cooldowns[k]; });
    }
    castLockUntil = 0;
    mercedesLinkFollowerReadyAt = 0;
    mercedesGhostBlossomAt = 0;
    if (!opts.keepCooldowns) lastNoCdAttackSlot = -1;
    chainReservations.clear();
    nextChainReservationId = 1;
    nlBlastingPassiveAt = 0;
    // 預設保留時限 buff／CD（換圖、進 BOSS、暫停再開）；完整重置才清
    if (!opts.keepBuffs && typeof SkillBuffRuntime !== 'undefined') {
      SkillBuffRuntime.reset?.();
    }
    if (!opts.keepCombo && typeof SkillComboOrbs !== 'undefined') {
      SkillComboOrbs.reset?.();
    }
  }

  /** 尚在冷卻的技能（剩餘時間） */
  function listActiveCooldowns(t = nowMs()) {
    const out = [];
    Object.keys(cooldowns).forEach((id) => {
      const until = Number(cooldowns[id]) || 0;
      if (!(until > t)) {
        delete cooldowns[id];
        return;
      }
      const skill = (typeof SkillCatalog !== 'undefined')
        ? SkillCatalog.getSkill?.(id)
        : null;
      out.push({
        id,
        name: skill?.name || id,
        icon: skill?.icon || '',
        expiresAt: until,
        remainMs: until - t,
      });
    });
    return out;
  }

  function isBuffSkill(skill, common) {
    if (!skill) return false;
    // 僅「有持續時間」的戰鬥 buff；楓葉祝福等純 AP% 被動不進自動施放
    if (typeof SkillBuffRuntime !== 'undefined'
      && typeof SkillBuffRuntime.isTimedBuffSkill === 'function') {
      return !!SkillBuffRuntime.isTimedBuffSkill(skill, common);
    }
    return skill.type === 'buff' && Number(common?.timeSec) > 0;
  }

  /** 無 CD buff：剩餘 ≤2 秒（含已結束）時可再補；開關技仍僅在未開啟時施放 */
  const NO_CD_BUFF_REFRESH_REMAIN_MS = 2000;

  function isBuffDurationActive(skillId, t = nowMs()) {
    if (typeof SkillModifiers !== 'undefined' && typeof SkillModifiers.hasBuff === 'function') {
      return !!SkillModifiers.hasBuff(skillId, t);
    }
    return false;
  }

  function shouldCastNoCdBuff(candidate, t = nowMs()) {
    if (!candidate?.skill) return false;
    if (typeof SkillBuffRuntime !== 'undefined'
      && SkillBuffRuntime.isToggleBuffSkill?.(candidate.skill)) {
      return !isBuffDurationActive(candidate.skill.id, t);
    }
    if (typeof SkillModifiers !== 'undefined'
      && typeof SkillModifiers.getBuffRemainMs === 'function') {
      return SkillModifiers.getBuffRemainMs(candidate.skill.id, t) <= NO_CD_BUFF_REFRESH_REMAIN_MS;
    }
    return !isBuffDurationActive(candidate.skill.id, t);
  }

  /**
   * 本專案無 MP：技能 mpCon 改扣 HP（僅法師）。
   * HP = floor(mpCon × 5 × (1 + costmpR/100))；魔力激發再加碼。
   */
  let manaAbsorbCastGen = 0;
  let manaAbsorbUsedGen = -1;

  function beginSkillResourceCast() {
    manaAbsorbCastGen += 1;
  }

  /** 技能耗血僅法師線（冰雷／火毒）；劍士等不扣 */
  function isMageJobForHpCost() {
    const jobId = (typeof CharacterSkills !== 'undefined')
      ? CharacterSkills.currentJobId?.()
      : null;
    if (jobId == null) return false;
    if (typeof SkillCatalog !== 'undefined' && typeof SkillCatalog.getJobLine === 'function') {
      const lineId = String(SkillCatalog.getJobLine(jobId)?.id || '');
      return lineId === 'mage' || lineId === 'magef';
    }
    const id = String(jobId);
    return /^(200|210|211|212|220|221|222)$/.test(id);
  }

  function isMercedesJob() {
    const jobId = (typeof CharacterSkills !== 'undefined')
      ? CharacterSkills.currentJobId?.()
      : null;
    if (jobId == null) return false;
    if (typeof SkillCatalog !== 'undefined' && typeof SkillCatalog.getJobLine === 'function') {
      const lineId = String(SkillCatalog.getJobLine(jobId)?.id || '');
      if (lineId === 'mercedes') return true;
    }
    return /^231/.test(String(jobId));
  }

  function isNightLordJob() {
    const jobId = (typeof CharacterSkills !== 'undefined')
      ? CharacterSkills.currentJobId?.()
      : null;
    if (jobId == null) return false;
    if (typeof SkillCatalog !== 'undefined' && typeof SkillCatalog.getJobLine === 'function') {
      const lineId = String(SkillCatalog.getJobLine(jobId)?.id || '');
      if (lineId === 'nightlord') return true;
    }
    const id = Number(jobId) || 0;
    return id === 400 || id === 410 || id === 411 || id === 412;
  }

  function isAngelicBusterJob() {
    const jobId = (typeof CharacterSkills !== 'undefined')
      ? CharacterSkills.currentJobId?.()
      : null;
    if (jobId == null) return false;
    if (typeof SkillCatalog !== 'undefined' && typeof SkillCatalog.getJobLine === 'function') {
      const lineId = String(SkillCatalog.getJobLine(jobId)?.id || '');
      if (lineId === 'angelicbuster') return true;
    }
    const id = Number(jobId) || 0;
    return id === 6500 || id === 6510 || id === 6511 || id === 6512;
  }

  /**
   * 精靈技能連鎖 2–4 最低間隔：對齊光速雙擊／進階的施放節奏（攻速＋動作＋特效）。
   * 不改 1 號頭技（如伊修塔爾）本身射速。
   */
  function resolveMercedesLinkFollowerGapMs(ctx = {}) {
    const dualId = (typeof CharacterSkills !== 'undefined'
      && typeof CharacterSkills.resolveCombatSkillId === 'function')
      ? CharacterSkills.resolveCombatSkillId('23111000')
      : '23111000';
    const skill = (typeof SkillCatalog !== 'undefined')
      ? SkillCatalog.getSkill(dualId)
      : null;
    if (!skill) {
      return scaleGameDelayMs(360);
    }
    const level = Math.max(
      1,
      (typeof CharacterSkills !== 'undefined'
        ? CharacterSkills.getLevel?.(dualId)
        : 0) || 1,
    );
    const common = evalSkill(skill, level) || {};
    const wzForDelay = ctx.wzAttackSpeed ?? ctx.attackSpeedStage;
    const actionDelayMs = resolveActionDelayMs(common.attackDelayBaseMs, wzForDelay);
    const skillAction = (typeof Paperdoll !== 'undefined'
      && typeof Paperdoll.resolveSkillActionName === 'function')
      ? Paperdoll.resolveSkillActionName(skill.actions)
      : (Array.isArray(skill.actions) ? skill.actions[0] : '');
    const instructionNaturalMs = (typeof Paperdoll !== 'undefined'
      && typeof Paperdoll.getInstructionDurationMs === 'function')
      ? (Paperdoll.getInstructionDurationMs(skillAction) || 0)
      : 0;
    const instructionMs = scaleDurationByAttackSpeed(instructionNaturalMs, wzForDelay);
    const effectMs = scaleDurationByAttackSpeed(skillFxDurationMs(skill.fx || {}), wzForDelay);
    return scaleGameDelayMs(Math.max(actionDelayMs, instructionMs, effectMs, 30));
  }

  function resolveSkillHpCost(common) {
    if (!isMageJobForHpCost()) return 0;
    const mpCon = Math.max(0, Number(common?.mpCon) || 0);
    if (!(mpCon > 0)) return 0;
    const costR = (typeof SkillModifiers !== 'undefined'
      && typeof SkillModifiers.getPassiveCostMpR === 'function')
      ? SkillModifiers.getPassiveCostMpR()
      : 0;
    return Math.max(1, Math.floor(mpCon * 5 * (1 + Math.max(0, costR) / 100)));
  }

  function resolveManaOverloadExtraHpCost() {
    if (!isMageJobForHpCost()) return 0;
    const lv = (typeof CharacterSkills !== 'undefined'
      ? Number(CharacterSkills.getLevel?.('400021000')) || 0
      : 0);
    if (!(lv > 0)) return 0;
    const skill = typeof SkillCatalog !== 'undefined'
      ? SkillCatalog.getSkill('400021000')
      : null;
    if (!skill?.common) return 0;
    const st = (typeof SkillFormula !== 'undefined' && SkillFormula.evalStatCommon)
      ? SkillFormula.evalStatCommon(skill.common, lv)
      : {};
    const pct = Math.max(0, Number(st.xVal) || 0);
    if (!(pct > 0)) return 0;
    const maxHp = (typeof IdleHunt !== 'undefined' && typeof IdleHunt.getPlayerHp === 'function')
      ? Number(IdleHunt.getPlayerHp()?.maxHp) || 0
      : 0;
    if (!(maxHp > 0)) return 0;
    return Math.max(1, Math.floor(maxHp * pct / 100));
  }

  function spendSkillHpCost(common, opts = {}) {
    let cost = resolveSkillHpCost(common);
    if (opts.includeOverload) cost += resolveManaOverloadExtraHpCost();
    if (!(cost > 0)) return 0;
    if (typeof IdleHunt !== 'undefined' && typeof IdleHunt.spendHuntHp === 'function') {
      return IdleHunt.spendHuntHp(cost, { keepAlive: true });
    }
    return 0;
  }

  /** 魔力吸收：每次施放最多觸發一次（避免 AoE 多怪回血蓋過耗血） */
  function tryManaAbsorbOnHit(mob) {
    if (!mob) return;
    if (manaAbsorbUsedGen === manaAbsorbCastGen) return;
    if (typeof SkillModifiers === 'undefined'
      || typeof SkillModifiers.getManaAbsorbPassive !== 'function') {
      return;
    }
    const info = SkillModifiers.getManaAbsorbPassive();
    if (!info?.stat) return;
    const prop = Math.max(0, Number(info.stat.prop) || 0);
    if (!(prop > 0) || Math.random() * 100 >= prop) return;
    const pct = mob.isBoss
      ? Math.max(0, Number(info.stat.y) || 0)
      : Math.max(0, Number(info.stat.xVal) || 0);
    if (!(pct > 0)) return;
    manaAbsorbUsedGen = manaAbsorbCastGen;
    if (typeof IdleHunt !== 'undefined' && typeof IdleHunt.healPlayerFromMaxHpPct === 'function') {
      IdleHunt.healPlayerFromMaxHpPct(pct);
    }
    if (info.skill?.fx?.effect?.length && typeof SkillEffectPlayer !== 'undefined') {
      const playerEl = document.querySelector('.idle-actor--player');
      if (playerEl) {
        SkillEffectPlayer.playOnPlayer(info.skill.fx.effect, { playerEl });
      }
    }
  }

  function evalSkill(skill, level) {
    const invested = Math.max(0, Number(level) || 0);
    const bonus = (typeof CharacterSkills !== 'undefined'
      && typeof CharacterSkills.getCombatOrdersBonus === 'function'
      && invested > 0)
      ? (Number(CharacterSkills.getCombatOrdersBonus(skill?.id)) || 0)
      : 0;
    const lv = invested + bonus;
    if (typeof SkillModifiers !== 'undefined'
      && typeof SkillModifiers.resolveCastCommon === 'function') {
      return SkillModifiers.resolveCastCommon(skill, lv);
    }
    if (typeof SkillFormula === 'undefined') return null;
    return SkillFormula.evalCommon(skill?.common || {}, lv);
  }

  function resolveWzAttackSpeed(explicitWz) {
    if (Number.isFinite(explicitWz) && explicitWz > 0) return explicitWz;
    if (typeof WeaponTypeMap === 'undefined'
      || typeof WeaponTypeMap.getEquippedWzAttackSpeed !== 'function') {
      return WeaponTypeMap?.DEFAULT_WZ_ATTACK_SPEED || 6;
    }
    const jobName = typeof CharacterCombatPanel !== 'undefined'
      ? CharacterCombatPanel.getState?.()?.jobName
      : '';
    const getWorn = typeof UiEquipModule !== 'undefined'
      ? (slot) => UiEquipModule.getWornEntry?.(slot)
      : null;
    return WeaponTypeMap.getEquippedWzAttackSpeed(getWorn, jobName) || 6;
  }

  function resolveActionDelayMs(attackDelayBaseMs, wzAttackSpeed) {
    const baseFallback = (typeof WeaponTypeMap !== 'undefined'
      && Number(WeaponTypeMap.BASIC_ATTACK_BASE_DELAY_MS) > 0)
      ? Number(WeaponTypeMap.BASIC_ATTACK_BASE_DELAY_MS)
      : 360;
    const base = Number.isFinite(attackDelayBaseMs) && attackDelayBaseMs > 0
      ? attackDelayBaseMs
      : baseFallback;
    if (typeof WeaponTypeMap === 'undefined'
      || typeof WeaponTypeMap.calculateActionDelayMs !== 'function') {
      return base;
    }
    const wz = resolveWzAttackSpeed(wzAttackSpeed);
    const mod = WeaponTypeMap.getSpeedModifiers?.() || 0;
    return Number(WeaponTypeMap.calculateActionDelayMs(base, wz, mod)) || base;
  }

  /** 與 delay 公式相同的攻速倍率：(10 + finalWz) / 16 */
  function attackSpeedDelayRatio(wzAttackSpeed) {
    if (typeof WeaponTypeMap === 'undefined'
      || typeof WeaponTypeMap.getFinalWzAttackSpeed !== 'function') {
      return 1;
    }
    const wz = resolveWzAttackSpeed(wzAttackSpeed);
    const mod = WeaponTypeMap.getSpeedModifiers?.() || 0;
    const finalWz = WeaponTypeMap.getFinalWzAttackSpeed(wz, mod);
    if (!Number.isFinite(finalWz)) return 1;
    return (10 + finalWz) / 16;
  }

  /** 將 instruction／特效自然時長依攻速縮放，並對齊 30ms 幀 */
  function scaleDurationByAttackSpeed(naturalMs, wzAttackSpeed) {
    const n = Number(naturalMs) || 0;
    if (!(n > 0)) return 0;
    const ratio = attackSpeedDelayRatio(wzAttackSpeed);
    const scaled = n * ratio;
    const frame = (typeof WeaponTypeMap !== 'undefined'
      && Number(WeaponTypeMap.DELAY_FRAME_MS) > 0)
      ? Number(WeaponTypeMap.DELAY_FRAME_MS)
      : 30;
    return frame * Math.ceil(scaled / frame);
  }

  function skillFxDurationMs(fx) {
    if (!fx || typeof SkillEffectPlayer === 'undefined'
      || typeof SkillEffectPlayer.framesDurationMs !== 'function') {
      return 0;
    }
    return Math.max(
      SkillEffectPlayer.framesDurationMs(fx.effect) || 0,
      SkillEffectPlayer.framesDurationMs(fx.effect0) || 0,
    );
  }

  function isProjectileSkill(skill) {
    if (!skill) return false;
    if (skill.blizzardCast === false) {
      /* keep checking other paths */
    } else if (skill.channelCast || skill.blizzardCast) {
      return false;
    }
    if (typeof SkillChannelCast !== 'undefined' && SkillChannelCast.isChannelCastSkill(skill, skill.fx)) {
      return false;
    }
    if (skill.blizzardCast !== false
      && typeof SkillBlizzardCast !== 'undefined'
      && SkillBlizzardCast.isBlizzardCastSkill(skill, skill.fx)) {
      return false;
    }
    if (skill.areaCast || skill.areaAttack) return false;
    if (typeof SkillAreaCast !== 'undefined' && SkillAreaCast.isAreaCastSkill(skill, skill.fx)) {
      return false;
    }
    if (skill.fx?.shootobj?.layers?.length) return true;
    if (typeof SkillBallCast !== 'undefined' && SkillBallCast.isBallCastSkill(skill, skill.fx)) {
      return true;
    }
    if (skill.projectile) return true;
    if (Number(skill.infoType) === 1) return true;
    const actions = skill.actions || [];
    return actions.some((a) => /auraBlade|blade|Wave|wave|Throw|throw|Spear/i.test(String(a)));
  }

  function shootObjFrames(fx) {
    const layers = fx?.shootobj?.layers;
    if (!Array.isArray(layers) || !layers.length) return [];
    return layers[0]?.frames || [];
  }

  function tryAreaCastAttack(skill, skillForFx, formCommon, fx, ctx, form, picked, finishAfterDamage, opts = {}) {
    if (typeof SkillAreaCast === 'undefined' || !SkillAreaCast.isAreaCastSkill(skill, fx)) {
      return null;
    }
    const plan = skill.areaCast || SkillAreaCast.buildPlan(skill, fx);
    if (!plan) return null;
    const kills = [];
    const hitMobs = [];
    const asyncId = registerAsyncCast();
    SkillAreaCast.playAreaCast({
      playerEl: ctx.playerEl,
      fieldEl: ctx.fieldEl || document.getElementById('idleHuntField'),
      fx,
      plan,
      skill,
      targets: resolveSkillTargets(ctx, skill.id, Math.max(1, formCommon.mobCount || 8)),
      onHit: () => {
        if (!isAsyncCastLive(asyncId)) return;
        const result = dealSkillDamage(skill, formCommon, ctx, {
          segmentGapSec: opts.segmentGapSec,
          normalMobBonusPct: opts.normalMobBonusPct,
          skillForFx,
          forceCritTail: form.forceCritTail || 0,
        });
        (result.kills || []).forEach((m) => pushUniqueMob(kills, m));
        (result.hitMobs || []).forEach((m) => pushUniqueMob(hitMobs, m));
      },
      onDone: () => {
        if (!isAsyncCastLive(asyncId)) return;
        releaseAsyncCast(asyncId);
        finishAfterDamage(kills, hitMobs);
        if (typeof ctx.onProjectileResolve === 'function') {
          ctx.onProjectileResolve(kills);
        }
      },
    });
    if (opts.mergeLink && picked) mergeLinkFollowers(picked, ctx, []);
    return { kills: [], deferredKills: true };
  }

  function readWzMultiAttackTimes(skillId) {
    const sk = typeof SkillCatalog !== 'undefined' ? SkillCatalog.getSkill(skillId) : null;
    const info = sk?.wz?.multiAttackInfo;
    if (!info || typeof info !== 'object') return [];
    return Object.keys(info)
      .sort((a, b) => Number(a) - Number(b))
      .map((key) => Math.max(0, Number(info[key]?.attackTime) || 0));
  }

  function illusionWaveStarts(times, count, firstMs, gapMs) {
    const n = Math.max(1, count);
    const starts = [];
    if (times.length) {
      let t = 0;
      for (let i = 0; i < n; i += 1) {
        const dt = i < times.length
          ? times[i]
          : (times[times.length - 1] || gapMs);
        t = i === 0 ? dt : t + dt;
        starts.push(t);
      }
      return starts;
    }
    for (let i = 0; i < n; i += 1) starts.push(firstMs + i * gapMs);
    return starts;
  }

  function trySwordIllusionCast(skill, skillForFx, formCommon, fx, ctx, form, picked, finishAfterDamage, opts = {}) {
    if (String(skill?.id) !== '400011124') return null;
    const st = (typeof SkillFormula !== 'undefined' && SkillFormula.evalStatCommon)
      ? SkillFormula.evalStatCommon(skill.common, picked.level || 1)
      : {};
    const slashWaves = Math.max(1, Math.floor(Number(st.xVal) || 12));
    const slashPer = Math.max(1, Math.floor(Number(st.attackCount) || 4));
    const boomWaves = Math.max(1, Math.floor(Number(st.z) || 5));
    const boomPer = Math.max(1, Math.floor(Number(st.y) || 5));
    const boomPct = Math.max(0, Number(st.w) || 0);
    const slashPct = Number(formCommon.damagePct) || 0;
    const fieldEl = ctx.fieldEl || document.getElementById('idleHuntField');
    const kills = [];
    const hitMobs = [];
    const asyncId = registerAsyncCast();

    const play = (frames) => {
      if (!frames?.length || typeof SkillEffectPlayer === 'undefined') return;
      if (fieldEl && ctx.playerEl && typeof SkillEffectPlayer.playAtField === 'function') {
        const pt = (typeof SkillBuffRuntime !== 'undefined' && SkillBuffRuntime.summonFieldPoint)
          ? SkillBuffRuntime.summonFieldPoint(fieldEl, ctx.playerEl, { slot: 'player-feet' }, ctx)
          : { x: 160, y: 220 };
        SkillEffectPlayer.playAtField({
          fieldEl,
          frames,
          x: pt.x,
          y: pt.y,
          loop: false,
          className: 'idle-skill-fx-stage idle-skill-fx-stage--cast',
          zIndex: 58,
          playerEl: ctx.playerEl,
          mirrorX: ctxFacingRight(ctx),
        });
      } else {
        SkillEffectPlayer.playOnPlayer(frames, { playerEl: ctx.playerEl });
      }
    };

    const slashHit = (typeof SkillCatalog !== 'undefined'
      ? SkillCatalog.getSkill('400011125')?.fx?.hit
      : null) || fx.hit;
    const boomHit = (typeof SkillCatalog !== 'undefined'
      ? SkillCatalog.getSkill('400011126')?.fx?.hit
      : null) || slashHit;

    // 400011125/126 multiAttackInfo：間隔累加。第一刀斬擊 1320、爆炸 2790
    const slashStarts = illusionWaveStarts(readWzMultiAttackTimes('400011125'), slashWaves, 1320, 120);
    const boomStarts = illusionWaveStarts(readWzMultiAttackTimes('400011126'), boomWaves, 2790, 60);

    play(fx.effect);
    play(fx.effect0);

    const collect = (result) => {
      (result?.kills || []).forEach((m) => pushUniqueMob(kills, m));
      (result?.hitMobs || []).forEach((m) => pushUniqueMob(hitMobs, m));
    };
    const dealAt = (startMs, perHit, pct, fxHit, isLast, onDone) => {
      setTimeout(() => {
        if (!isAsyncCastLive(asyncId)) return;
        collect(dealSkillDamage(skill, { ...formCommon, attackCount: perHit, damagePct: pct }, ctx, {
          isolateStack: true,
          segmentGapSec: null,
          normalMobBonusPct: opts.normalMobBonusPct,
          skillForFx,
          forceCritTail: isLast ? (form.forceCritTail || 0) : 0,
          fxHit,
        }));
        if (typeof onDone === 'function') onDone();
      }, Math.max(0, startMs));
    };

    slashStarts.forEach((startMs) => {
      dealAt(startMs, slashPer, slashPct, slashHit, false);
    });

    const comboOrbs = (typeof SkillComboOrbs !== 'undefined') ? SkillComboOrbs : null;
    const per = Number(comboOrbs?.getPerStackFinalDamR?.()) || 0;
    if (per > 0 && typeof SkillModifiers !== 'undefined') {
      const orbCount = Math.max(1, Math.floor(Number(st.u) || 6));
      const buffMs = scaleGameDelayMs(Math.max(1000, (Number(st.timeSec) || 8) * 1000));
      SkillModifiers.applyBuff({
        id: `${skill.id}-comboFd`,
        name: skill.name || '',
        icon: skill.icon || '',
        durationMs: buffMs,
        finalDamR: per * orbCount,
      });
    }

    boomStarts.forEach((startMs, w) => {
      const last = w === boomStarts.length - 1;
      dealAt(startMs, boomPer, boomPct, boomHit, last, last ? () => {
        if (!isAsyncCastLive(asyncId)) return;
        releaseAsyncCast(asyncId);
        finishAfterDamage(kills, hitMobs);
        if (typeof ctx.onProjectileResolve === 'function') ctx.onProjectileResolve(kills);
      } : null);
    });

    if (opts.mergeLink && picked) mergeLinkFollowers(picked, ctx, []);
    return { kills: [], deferredKills: true };
  }

  function fxSpecialFrames(fx) {
    if (!fx) return null;
    if (Array.isArray(fx.special?.frames) && fx.special.frames.length) return fx.special.frames;
    if (Array.isArray(fx.special) && fx.special.length) return fx.special;
    if (Array.isArray(fx.layers?.special) && fx.layers.special.length) return fx.layers.special;
    return null;
  }

  function fxScreenFrames(fx) {
    if (!fx) return null;
    if (Array.isArray(fx.screen) && fx.screen.length) return fx.screen;
    if (Array.isArray(fx.screen?.frames) && fx.screen.frames.length) return fx.screen.frames;
    if (Array.isArray(fx.layers?.screen) && fx.layers.screen.length) return fx.layers.screen;
    return null;
  }

  function playAbFieldCover(fieldEl, frames) {
    if (!fieldEl || !frames?.length || typeof SkillEffectPlayer === 'undefined') return;
    if (typeof SkillEffectPlayer.playAtField !== 'function') return;
    SkillEffectPlayer.playAtField({
      fieldEl,
      frames,
      x: Math.round((fieldEl.clientWidth || 800) * 0.5),
      y: Math.round((fieldEl.clientHeight || 500) * 0.5),
      coverField: true,
      coverW: fieldEl.clientWidth || 800,
      coverH: fieldEl.clientHeight || 500,
      className: 'idle-skill-fx-stage idle-skill-fx-stage--screen idle-skill-fx-stage--ab-v',
      zIndex: 18,
      behind: true,
      forcePlay: true,
    });
  }

  function playAbWaveCastFx(skill, fx, ctx, flags = {}) {
    const fieldEl = ctx.fieldEl || document.getElementById('idleHuntField');
    playSkillCastFx(skill, fx, ctx);
    const special = fxSpecialFrames(fx);
    if (flags.playSpecial && special?.length && typeof SkillEffectPlayer !== 'undefined') {
      SkillEffectPlayer.playOnPlayer(special, {
        playerEl: ctx.playerEl,
        fieldEl,
        className: 'idle-skill-fx-stage idle-skill-fx-stage--cast idle-skill-fx-stage--ab-special',
        forcePlay: true,
      });
    }
    if (flags.playScreen) playAbFieldCover(fieldEl, fxScreenFrames(fx));
  }

  function scheduleAbWaveHits(skill, skillForFx, formCommon, ctx, form, opts = {}) {
    const waves = Math.max(1, Math.floor(Number(opts.waves) || 1));
    const perHit = Math.max(1, Math.floor(Number(opts.perHit) || 1));
    const pct = Number(opts.damagePct);
    const damagePct = Number.isFinite(pct) ? pct : (Number(formCommon.damagePct) || 0);
    const mobCount = Math.max(1, Math.floor(Number(opts.mobCount) || formCommon.mobCount || 1));
    const starts = Array.isArray(opts.starts) && opts.starts.length
      ? opts.starts
      : illusionWaveStarts([], waves, Number(opts.firstMs) || 0, Number(opts.gapMs) || 90);
    const kills = opts.kills || [];
    const hitMobs = opts.hitMobs || [];
    const asyncId = opts.asyncId || registerAsyncCast();
    const fxHit = Object.prototype.hasOwnProperty.call(opts, 'fxHit')
      ? opts.fxHit
      : (skillForFx?.fx?.hit || skill?.fx?.hit || null);
    const collect = (result) => {
      (result?.kills || []).forEach((m) => pushUniqueMob(kills, m));
      (result?.hitMobs || []).forEach((m) => pushUniqueMob(hitMobs, m));
    };
    starts.forEach((startMs, w) => {
      const last = w === starts.length - 1;
      setTimeout(() => {
        if (!isAsyncCastLive(asyncId)) return;
        collect(dealSkillDamage(skill, {
          ...formCommon,
          attackCount: perHit,
          damagePct,
          mobCount,
        }, ctx, {
          isolateStack: true,
          segmentGapSec: null,
          normalMobBonusPct: opts.normalMobBonusPct,
          skillForFx,
          forceCritTail: last ? (form.forceCritTail || 0) : 0,
          fxHit,
        }));
        if (last && typeof opts.onComplete === 'function') opts.onComplete(kills, hitMobs);
      }, Math.max(0, startMs));
    });
    return { kills, hitMobs, asyncId, deferredKills: true };
  }

  function tryAbVWaveCast(skill, skillForFx, formCommon, fx, ctx, form, picked, finishAfterDamage, opts = {}) {
    const id = String(skill?.id || '');
    if (id !== AB_SPARKLE_BURST_ID && id !== AB_TRINITY_FUSION_ID) return null;
    const st = (typeof SkillFormula !== 'undefined' && SkillFormula.evalStatCommon)
      ? SkillFormula.evalStatCommon(skill.common, picked?.level || 1)
      : {};
    const spec = id === AB_SPARKLE_BURST_ID
      ? {
        waves: Math.max(1, Math.floor(Number(st.v) || 15)),
        perHit: Math.max(1, Math.floor(Number(formCommon.attackCount) || 15)),
        damagePct: Number(formCommon.damagePct) || 0,
        firstMs: 720,
        gapMs: 90,
        playSpecial: true,
        playScreen: true,
      }
      : {
        waves: Math.max(1, Math.floor(Number(st.y) || 9)),
        perHit: Math.max(1, Math.floor(Number(formCommon.attackCount) || 3)),
        damagePct: Number(formCommon.damagePct) || 0,
        firstMs: 900,
        gapMs: 90,
        playSpecial: false,
        playScreen: false,
      };
    const asyncId = registerAsyncCast();
    playAbWaveCastFx(skillForFx || skill, fx, ctx, spec);
    scheduleAbWaveHits(skill, skillForFx, formCommon, ctx, form, {
      ...spec,
      starts: illusionWaveStarts(readWzMultiAttackTimes(id), spec.waves, spec.firstMs, spec.gapMs),
      asyncId,
      normalMobBonusPct: opts.normalMobBonusPct,
      onComplete: (kills, hitMobs) => {
        if (!isAsyncCastLive(asyncId)) return;
        releaseAsyncCast(asyncId);
        finishAfterDamage(kills, hitMobs);
        if (typeof ctx.onProjectileResolve === 'function') ctx.onProjectileResolve(kills);
      },
    });
    if (opts.mergeLink && picked) mergeLinkFollowers(picked, ctx, []);
    return { kills: [], deferredKills: true };
  }

  const IL_THUNDERBREAK_ID = '400021030';
  const IL_THUNDERBREAK_BOLT_IDS = ['400021031', '400021040'];
  const IL_JUPITER_THUNDER_ID = '400021094';

  function tryIlThunderbreakCast(skill, skillForFx, formCommon, fx, ctx, form, picked, finishAfterDamage, opts = {}) {
    if (String(skill?.id || '') !== IL_THUNDERBREAK_ID) return null;
    const st = (typeof SkillFormula !== 'undefined' && SkillFormula.evalStatCommon)
      ? SkillFormula.evalStatCommon(skill.common, picked?.level || 1)
      : {};
    const waves = Math.max(1, Math.floor(Number(st.w) || 8));
    const perHit = Math.max(1, Math.floor(Number(st.s) || 15));
    const damagePct = Number(st.v) || Number(formCommon.damagePct) || 0;
    const mobCount = Math.max(1, Math.floor(Number(st.q) || 12));
    const firstMs = Math.max(0, Math.floor(Number(st.u) || 290));
    const boltA = typeof SkillCatalog !== 'undefined' ? SkillCatalog.getSkill(IL_THUNDERBREAK_BOLT_IDS[0]) : null;
    const boltB = typeof SkillCatalog !== 'undefined' ? SkillCatalog.getSkill(IL_THUNDERBREAK_BOLT_IDS[1]) : null;
    const gapMs = Math.max(
      60,
      Math.floor(Number(
        (typeof SkillFormula !== 'undefined' && boltA?.common && SkillFormula.evalStatCommon)
          ? SkillFormula.evalStatCommon(boltA.common, picked?.level || 1).subTimeMs
          : 210,
      ) || 210),
    );
    const asyncId = registerAsyncCast();
    const fieldEl = ctx.fieldEl || document.getElementById('idleHuntField');
    playSkillCastFx(skillForFx || skill, fx, ctx);
    const facingRight = ctxFacingRight(ctx);
    let origin = { x: 160, y: 280 };
    if (typeof SkillBuffRuntime !== 'undefined'
      && typeof SkillBuffRuntime.summonFieldPoint === 'function'
      && fieldEl
      && ctx.playerEl) {
      origin = SkillBuffRuntime.summonFieldPoint(
        fieldEl,
        ctx.playerEl,
        { slot: 'player-feet' },
        ctx,
      ) || origin;
    }
    const step = 90;
    const starts = illusionWaveStarts([], waves, firstMs, gapMs);
    const kills = [];
    const hitMobs = [];
    starts.forEach((startMs, w) => {
      const last = w === starts.length - 1;
      setTimeout(() => {
        if (!isAsyncCastLive(asyncId)) return;
        const bolt = (w % 2 === 0 ? boltA : boltB) || boltA || boltB || skillForFx || skill;
        const x = origin.x + (facingRight ? 1 : -1) * (70 + w * step);
        const y = origin.y;
        if (fieldEl && bolt?.fx?.effect?.length && typeof SkillEffectPlayer !== 'undefined') {
          SkillEffectPlayer.playAtField({
            fieldEl,
            frames: bolt.fx.effect,
            x,
            y,
            loop: false,
            className: 'idle-skill-fx-stage idle-skill-fx-stage--thunderbreak',
            mirrorX: facingRight,
            zIndex: 48,
          });
        }
        const result = dealSkillDamage(skill, {
          ...formCommon,
          attackCount: perHit,
          damagePct,
          mobCount,
        }, ctx, {
          isolateStack: true,
          segmentGapSec: null,
          normalMobBonusPct: opts.normalMobBonusPct,
          skillForFx: bolt,
          forceCritTail: last ? (form.forceCritTail || 0) : 0,
          fxHit: bolt?.fx?.hit || null,
        });
        (result?.kills || []).forEach((m) => pushUniqueMob(kills, m));
        (result?.hitMobs || []).forEach((m) => pushUniqueMob(hitMobs, m));
        if (typeof SkillBuffRuntime !== 'undefined'
          && typeof SkillBuffRuntime.onSwordSkillCast === 'function') {
          SkillBuffRuntime.onSwordSkillCast(skill, ctx);
        }
        if (!last) {
          tryBlizzardFinalAttack(ctx, skill.id, result?.hitMobs || []);
        }
        if (last) {
          releaseAsyncCast(asyncId);
          finishAfterDamage(kills, hitMobs);
          if (typeof ctx.onProjectileResolve === 'function') ctx.onProjectileResolve(kills);
        }
      }, Math.max(0, startMs));
    });
    if (opts.mergeLink && picked) mergeLinkFollowers(picked, ctx, []);
    return { kills: [], deferredKills: true };
  }

  function jupiterBallFrames(fx) {
    if (Array.isArray(fx?.ball?.frames) && fx.ball.frames.length) return fx.ball.frames;
    const layers = fx?.ball?.layers || [];
    const numeric = layers.find((l) => /^\d+$/.test(String(l.name)));
    return (numeric || layers[0])?.frames || [];
  }

  function tryJupiterThunderCast(skill, skillForFx, formCommon, fx, ctx, form, picked, finishAfterDamage, opts = {}) {
    if (String(skill?.id || '') !== IL_JUPITER_THUNDER_ID) return null;
    const st = (typeof SkillFormula !== 'undefined' && SkillFormula.evalStatCommon)
      ? SkillFormula.evalStatCommon(skill.common, picked?.level || 1)
      : {};
    const shocks = Math.max(1, Math.floor(Number(st.xVal) || 30));
    const gapMs = Math.max(60, Math.floor(Number(st.subTimeMs) || 330));
    const freezeEvery = Math.max(1, Math.floor(Number(st.v) || 5));
    const splashCount = Math.max(0, Math.floor(Number(st.prop) || 2));
    const splashPct = Number(st.s) || 0;
    const splashHits = Math.max(1, Math.floor(Number(st.dotPct) || 4));
    const asyncId = registerAsyncCast();
    playSkillCastFx(skillForFx || skill, fx, ctx);
    const ballFrames = jupiterBallFrames(fx);
    const fieldEl = ctx.fieldEl || document.getElementById('idleHuntField');
    const facingRight = ctxFacingRight(ctx);
    const behindPlace = { slot: 'feet-behind', behindExtra: -48 };
    const resolveBehind = () => {
      if (typeof SkillBuffRuntime !== 'undefined'
        && typeof SkillBuffRuntime.summonFieldPoint === 'function'
        && fieldEl
        && ctx.playerEl) {
        return SkillBuffRuntime.summonFieldPoint(fieldEl, ctx.playerEl, behindPlace, ctx);
      }
      return { x: 120, y: 280 };
    };
    let ballFxId = null;
    if (fieldEl && ballFrames.length && typeof SkillEffectPlayer !== 'undefined'
      && typeof SkillEffectPlayer.playAtField === 'function') {
      const pt = resolveBehind();
      ballFxId = SkillEffectPlayer.playAtField({
        fieldEl,
        frames: ballFrames,
        x: pt.x,
        y: pt.y,
        loop: true,
        className: 'idle-skill-fx-stage idle-skill-fx-stage--jupiter-ball',
        mirrorX: facingRight,
        zIndex: 46,
        resolveAnchor: resolveBehind,
      });
    }
    const kills = [];
    const hitMobs = [];
    let shockIdx = 0;

    const stopBall = () => {
      if (ballFxId != null && typeof SkillEffectPlayer !== 'undefined') {
        SkillEffectPlayer.stopFx?.(ballFxId);
      }
      ballFxId = null;
    };

    const finish = () => {
      stopBall();
      if (!isAsyncCastLive(asyncId)) return;
      releaseAsyncCast(asyncId);
      finishAfterDamage(kills, hitMobs);
      if (typeof ctx.onProjectileResolve === 'function') ctx.onProjectileResolve(kills);
    };

    const runShock = () => {
      if (!isAsyncCastLive(asyncId)) {
        stopBall();
        return;
      }
      const take = 1 + splashCount;
      const alive = resolveSkillTargets(ctx, skill.id, take)
        .filter((m) => m && Number(m.hp) > 0);
      const primary = alive[0] || null;
      if (primary) {
        const hit = dealHitsOnMob(skill, {
          ...formCommon,
          attackCount: Math.max(1, Math.floor(Number(formCommon.attackCount) || 8)),
          damagePct: Number(formCommon.damagePct) || 0,
        }, primary, ctx, {
          isolateStack: true,
          segmentGapSec: null,
          normalMobBonusPct: opts.normalMobBonusPct,
          forceCritTail: 0,
          fxHit: skillForFx?.fx?.hit || fx?.hit || null,
        });
        if (hit) pushUniqueMob(hitMobs, primary);
        if (primary.hp <= 0) pushUniqueMob(kills, primary);
        if (typeof SkillMobStatus !== 'undefined') {
          SkillMobStatus.applyJupiterShock?.(primary, Math.max(gapMs + 80, (shocks - shockIdx) * gapMs));
          if ((shockIdx + 1) % freezeEvery === 0 && SkillMobStatus.hasFreeze?.(primary)) {
            SkillMobStatus.consumeFreeze?.(primary, 1);
          }
        }
      }
      if (primary && splashCount > 0 && splashPct > 0) {
        alive.slice(1, 1 + splashCount).forEach((mob) => {
          const hit = dealHitsOnMob(skill, {
            ...formCommon,
            attackCount: splashHits,
            damagePct: splashPct,
          }, mob, ctx, {
            segmentGapSec: null,
            normalMobBonusPct: opts.normalMobBonusPct,
            forceCritTail: 0,
            fxHit: skillForFx?.fx?.hit || fx?.hit || null,
          });
          if (hit) pushUniqueMob(hitMobs, mob);
          if (mob.hp <= 0) pushUniqueMob(kills, mob);
        });
      }
      if (typeof SkillBuffRuntime !== 'undefined'
        && typeof SkillBuffRuntime.onSwordSkillCast === 'function') {
        SkillBuffRuntime.onSwordSkillCast(skill, ctx);
      }
      shockIdx += 1;
      if (shockIdx >= shocks) {
        finish();
        return;
      }
      setTimeout(runShock, scaleGameDelayMs(gapMs));
    };

    setTimeout(runShock, scaleGameDelayMs(Math.max(90, Number(st.w2) || 180)));
    if (opts.mergeLink && picked) mergeLinkFollowers(picked, ctx, []);
    return { kills: [], deferredKills: true };
  }

  function playAbMascotExplosion(skill, skillForFx, formCommon, ctx, form, picked, onComplete) {
    const level = picked?.level || 1;
    const st = (typeof SkillFormula !== 'undefined' && SkillFormula.evalStatCommon)
      ? SkillFormula.evalStatCommon(skill.common, level)
      : {};
    const endSkill = typeof SkillCatalog !== 'undefined'
      ? SkillCatalog.getSkill(AB_MASCOT_END_ID)
      : null;
    const endFx = endSkill?.fx || {};
    const waves = Math.max(1, Math.floor(Number(st.u2) || 7));
    const perHit = Math.max(1, Math.floor(Number(st.y) || 10));
    const damagePct = Number(st.xVal) || Number(formCommon.damagePct) || 0;
    const mobCount = Math.max(1, Math.floor(Number(st.z) || 15));
    const asyncId = registerAsyncCast();
    if (endFx.effect?.length && typeof SkillEffectPlayer !== 'undefined') {
      SkillEffectPlayer.playOnPlayer(endFx.effect, {
        playerEl: ctx.playerEl,
        fieldEl: ctx.fieldEl,
        className: 'idle-skill-fx-stage idle-skill-fx-stage--cast idle-skill-fx-stage--ab-mascot-end',
        forcePlay: true,
      });
    }
    scheduleAbWaveHits(skill, endSkill || skillForFx, formCommon, ctx, form, {
      waves,
      perHit,
      damagePct,
      mobCount,
      starts: illusionWaveStarts(
        readWzMultiAttackTimes(AB_MASCOT_END_ID),
        waves,
        600,
        60,
      ),
      asyncId,
      fxHit: skillForFx?.fx?.hit || skill?.fx?.hit || null,
      onComplete: (kills, hitMobs) => {
        if (!isAsyncCastLive(asyncId)) return;
        releaseAsyncCast(asyncId);
        if (typeof onComplete === 'function') onComplete(kills, hitMobs);
      },
    });
  }

  function tryChannelCastAttack(skill, skillForFx, atkCommon, fx, ctx, form, picked, finishAfterDamage, opts = {}) {
    if (typeof SkillChannelCast === 'undefined' || !SkillChannelCast.isChannelCastSkill(skill, fx)) {
      return null;
    }
    const fieldEl = ctx.fieldEl || document.getElementById('idleHuntField');
    const plan = skill.channelCast || SkillChannelCast.buildPlan(skill, fx);
    if (!plan) return null;
    const level = picked?.level || 1;
    const timing = typeof SkillChannelCast.evalPlanMs === 'function'
      ? SkillChannelCast.evalPlanMs(skill, plan, level)
      : { prepareMs: 240, channelMs: 2000, tickMs: 240 };
    const sustain = !!(plan.sustain || timing.sustain);

    // 同一持續引導已在跑：勿重播 prepare
    if (sustain && activeSustainChannel
      && String(activeSustainChannel.skillId) === String(skill.id)) {
      return {
        kills: [],
        deferredKills: true,
        channel: true,
        sustain: true,
        alreadyActive: true,
        channelLockMs: Math.max(80, Number(timing.tickMs) || 120),
      };
    }

    const kills = [];
    const hitMobs = [];
    let tickDamagedMobs = [];
    let stopChannel = null;
    const abortSustainTick = () => {
      castLockUntil = nowMs();
      if (typeof Paperdoll !== 'undefined') Paperdoll.stopHuntSwingLoop?.();
      if (activeSustainChannel && activeSustainChannel.asyncId === asyncId) {
        activeSustainChannel = null;
      }
      if (typeof stopChannel === 'function') stopChannel();
    };
    const asyncId = registerAsyncCast();
    const endFxMs = (() => {
      const frames = skillForFx?.fx?.keydownend || skill?.fx?.keydownend || [];
      if (!frames.length) return 120;
      if (typeof SkillChannelCast.framesDurationMs === 'function') {
        return SkillChannelCast.framesDurationMs(frames) || 120;
      }
      return 120;
    })();
    // 持續引導：鎖＝prepare+一 tick（之後每 tick 延長）；有限引導：整段時長
    const channelLockMs = sustain
      ? Math.max(300, (Number(timing.prepareMs) || 0) + (Number(timing.tickMs) || 120))
      : Math.max(
        300,
        (Number(timing.prepareMs) || 0)
          + (Number(timing.channelMs) || 0)
          + Math.max(60, endFxMs),
      );

    const ballPlan = (typeof SkillBallCast !== 'undefined' && SkillBallCast.isBallCastSkill?.(skill, fx))
      ? (skill.ballCast || SkillBallCast.buildPlan(skill, fx))
      : null;
    const fireBallOnTick = !!(ballPlan && fx?.ball);

    const applyChannelHit = (mob) => {
      const live = resolveLiveMob(mob, ctx) || (mob && Number(mob.hp) > 0 ? mob : null);
      if (!live) {
        if (mob && mob.hp <= 0) {
          pushUniqueMob(kills, mob);
          syncMobStateAfterDamage([mob], ctx);
        }
        return;
      }
      const hit = dealHitsOnMob(skillForFx, atkCommon, live, ctx, {
        segmentGapSec: opts.segmentGapSec,
        normalMobBonusPct: opts.normalMobBonusPct,
        forceCritTail: form.forceCritTail || 0,
        // 飛箭 tick 由 ball 自己播 hit；其餘引導（伊里加爾等）用技能 hit
        fxHit: fireBallOnTick ? undefined : (skillForFx?.fx?.hit || fx?.hit || null),
      });
      if (hit) {
        pushUniqueMob(hitMobs, live);
        pushUniqueMob(tickDamagedMobs, live);
      }
      if (live.hp <= 0) {
        pushUniqueMob(kills, live);
        syncMobStateAfterDamage([live], ctx);
      }
    };

    const handle = SkillChannelCast.playChannelCast({
      fieldEl,
      playerEl: ctx.playerEl,
      fx,
      plan,
      skill,
      level,
      mobs: ctx.mobs,
      maxTargets: Math.max(1, atkCommon.mobCount || 1),
      onTick: () => {
        if (!isAsyncCastLive(asyncId)) return;
        tickDamagedMobs = [];
        // 角色死亡：立刻中斷引導，避免副本／狩獵死後仍持續結算
        if (typeof IdleHunt !== 'undefined' && IdleHunt.isPlayerDead?.()) {
          abortSustainTick();
          return;
        }
        // BOSS 轉階段 busy：中斷持續引導
        if (sustain && typeof IdleBossFight !== 'undefined' && IdleBossFight.isBusy?.()) {
          abortSustainTick();
          return;
        }
        const maxTargets = Math.max(1, atkCommon.mobCount || 1);
        const list = () => liveMobTargets(resolveCastMobs(ctx), maxTargets, ctx, skill.id);
        const targets = list();

        // 持續引導：無攻擊目標（王死亡／轉階段無敵／清場）立刻中斷，避免空放鎖死
        if (sustain && !targets.length) {
          abortSustainTick();
          return;
        }

        // 每一波引導結算＝一組傷害數字（含同 tick 的連鎖）
        const tickSession = beginDamageStackSession(ctx);
        // 先佔主技能層數，避免連鎖先結算時搶到 0 起跳
        damageStackSlotsForSkill(ctx, skill.id, Math.max(1, atkCommon.attackCount || 1), {
          forceReserve: true,
          session: tickSession,
        });
        if (sustain) {
          const extend = scaleGameDelayMs((Number(timing.tickMs) || 120) + 40);
          castLockUntil = Math.max(castLockUntil, nowMs() + extend);
        }
        const visualBall = fireBallOnTick && usesBallVisualDamage(skill, ballPlan);

        // 伊修塔爾等：傷害先依目標數即時結算；投射物可改純動畫
        if (visualBall && typeof SkillBallCast.playBallCast === 'function') {
          runWithDamageStackSession(ctx, tickSession, () => {
            targets.forEach((mob) => applyChannelHit(mob));
          });
          if (!(ctx.quietFx || (typeof document !== 'undefined' && document.hidden))) {
            SkillBallCast.playBallCast({
              fieldEl,
              playerEl: ctx.playerEl,
              fx: { ball: fx.ball, hit: fx.hit },
              plan: { ...ballPlan, launchMs: 0 },
              skill,
              level,
              mobs: targets,
              getMobs: () => targets.filter((m) => m && Number(m.hp) > 0),
              maxTargets,
              facingRight: ctxFacingRight(ctx),
              omitPlayerEffect: true,
              visualOnly: true,
              onDone: () => {},
            });
          }
        } else if (fireBallOnTick && typeof SkillBallCast.playBallCast === 'function') {
          SkillBallCast.playBallCast({
            fieldEl,
            playerEl: ctx.playerEl,
            fx: { ball: fx.ball, hit: fx.hit },
            plan: { ...ballPlan, launchMs: 0 },
            skill,
            level,
            mobs: targets,
            getMobs: list,
            maxTargets,
            facingRight: ctxFacingRight(ctx),
            omitPlayerEffect: true,
            onHit: (mob) => {
              if (!isAsyncCastLive(asyncId)) return;
              runWithDamageStackSession(ctx, tickSession, () => applyChannelHit(mob));
            },
            onDone: () => {},
          });
        } else {
          runWithDamageStackSession(ctx, tickSession, () => {
            targets.forEach((mob) => applyChannelHit(mob));
          });
        }
        if (tickDamagedMobs.length) {
          tryAngelicBusterFollowups(ctx, skill.id, tickDamagedMobs);
        }
        if (isMercedesJob() && !ctx?.skipMercedesExtras) {
          tryMercedesFollowups(ctx, skill.id, tickDamagedMobs.length ? tickDamagedMobs : targets);
          if (tickDamagedMobs.length
            && typeof SkillBuffRuntime !== 'undefined'
            && typeof SkillBuffRuntime.onSwordSkillCast === 'function') {
            SkillBuffRuntime.onSwordSkillCast(skill, ctx);
          }
        }
        const lightningIds = (typeof SkillBuffRuntime !== 'undefined'
          && Array.isArray(SkillBuffRuntime.ICE_AGE_LIGHTNING_TRIGGER_IDS))
          ? SkillBuffRuntime.ICE_AGE_LIGHTNING_TRIGGER_IDS
          : null;
        if (lightningIds
          && lightningIds.includes(String(skill.id || ''))
          && typeof SkillBuffRuntime !== 'undefined'
          && typeof SkillBuffRuntime.onSwordSkillCast === 'function') {
          SkillBuffRuntime.onSwordSkillCast(skill, ctx);
        }
        // 連鎖 2–4：每個 tick 都追加，避免整段引導只放一次
        if (opts.mergeLink && picked?.isSkillLink) {
          runWithDamageStackSession(ctx, tickSession, () => {
            mergeLinkFollowers(picked, ctx, []);
          });
        }
        // 持續引導：有死者才掃狩獵佇列；BOSS 另做轉階檢查（避免每 tick 全隊 sync）
        if (sustain) {
          const touched = tickDamagedMobs.length ? tickDamagedMobs : targets;
          const deadTouched = touched.filter((m) => m && !(Number(m.hp) > 0));
          const inBoss = typeof IdleBoss !== 'undefined' && IdleBoss.isRunning?.();
          if (deadTouched.length) {
            syncMobStateAfterDamage(deadTouched, ctx);
          } else if (inBoss) {
            if (typeof IdleBossFight !== 'undefined'
              && typeof IdleBossFight.tryPhaseCheck === 'function') {
              IdleBossFight.tryPhaseCheck(touched);
            } else {
              syncMobStateAfterDamage(touched, ctx);
            }
          }
          if (typeof IdleBossFight !== 'undefined' && IdleBossFight.isBusy?.()) {
            abortSustainTick();
            return;
          }
          if (inBoss && typeof IdleBossFight !== 'undefined' && IdleBossFight.capIncomingDamage) {
            const canDeal = targets.some((m) => m && IdleBossFight.capIncomingDamage(m, 1) > 0);
            if (!canDeal) abortSustainTick();
          }
        }
      },
      onDone: () => {
        if (activeSustainChannel && activeSustainChannel.asyncId === asyncId) {
          activeSustainChannel = null;
        }
        if (sustain && typeof Paperdoll !== 'undefined') {
          Paperdoll.stopHuntSwingLoop?.();
        }
        if (!isAsyncCastLive(asyncId)) return;
        const wrapFinish = (extraKills, extraHits) => {
          if (!isAsyncCastLive(asyncId)) return;
          (extraKills || []).forEach((m) => pushUniqueMob(kills, m));
          (extraHits || []).forEach((m) => pushUniqueMob(hitMobs, m));
          releaseAsyncCast(asyncId);
          if (kills.length) {
            syncMobStateAfterDamage(kills, ctx);
          } else if (typeof IdleBoss !== 'undefined' && IdleBoss.isRunning?.()) {
            if (typeof IdleBossFight !== 'undefined'
              && typeof IdleBossFight.tryPhaseCheck === 'function') {
              IdleBossFight.tryPhaseCheck(hitMobs);
            } else {
              syncMobStateAfterDamage(hitMobs, ctx);
            }
          }
          const prevSkipAb = ctx.skipAbExtras;
          const prevSkipMer = ctx.skipMercedesExtras;
          ctx.skipAbExtras = true;
          ctx.skipMercedesExtras = true;
          try {
            finishAfterDamage(kills, hitMobs);
          } finally {
            ctx.skipAbExtras = prevSkipAb;
            ctx.skipMercedesExtras = prevSkipMer;
          }
        };
        if (String(skill.id) === AB_MASCOT_ID) {
          playAbMascotExplosion(skill, skillForFx, atkCommon, ctx, form, picked, wrapFinish);
          return;
        }
        wrapFinish();
      },
    });

    stopChannel = (handle && typeof handle.stop === 'function') ? handle.stop : null;
    if (sustain && stopChannel) {
      activeSustainChannel = {
        skillId: String(skill.id),
        stop: stopChannel,
        asyncId,
      };
    }

    // 引導技不在開頭 merge 連鎖（改由每 tick），一般有 CD 引導仍開頭帶一次
    if (opts.mergeLink && picked && !picked.isSkillLink) {
      mergeLinkFollowers(picked, ctx, []);
    }
    return {
      kills: [],
      deferredKills: true,
      channel: true,
      sustain,
      channelLockMs,
    };
  }

  function tryBlizzardCastAttack(skill, skillForFx, formCommon, fx, ctx, form, picked, finishAfterDamage, opts = {}) {
    if (typeof SkillBlizzardCast === 'undefined' || !SkillBlizzardCast.isBlizzardCastSkill(skill, fx)) {
      return null;
    }
    const fieldEl = ctx.fieldEl || document.getElementById('idleHuntField');
    const plan = skill.blizzardCast || SkillBlizzardCast.buildPlan(skill, fx);
    if (!plan) return null;
    const kills = [];
    const hitMobs = [];
    const asyncId = registerAsyncCast();
    const stackSession = ctx._damageStack || beginDamageStackSession(ctx);
    SkillBlizzardCast.playBlizzardCast({
      playerEl: ctx.playerEl,
      fieldEl,
      fx,
      plan,
      mobs: ctx.mobs,
      getMobs: typeof ctx.getMobs === 'function' ? ctx.getMobs : (() => ctx.mobs || []),
      onHit: () => {
        if (!isAsyncCastLive(asyncId)) return;
        runWithDamageStackSession(ctx, stackSession, () => {
          const result = dealSkillDamage(skill, formCommon, ctx, {
            segmentGapSec: opts.segmentGapSec,
            normalMobBonusPct: opts.normalMobBonusPct,
            skillForFx,
            forceCritTail: form.forceCritTail || 0,
          });
          (result.kills || []).forEach((m) => pushUniqueMob(kills, m));
          (result.hitMobs || []).forEach((m) => pushUniqueMob(hitMobs, m));
        });
      },
      onDone: () => {
        if (!isAsyncCastLive(asyncId)) return;
        releaseAsyncCast(asyncId);
        finishAfterDamage(kills, hitMobs);
        if (typeof ctx.onProjectileResolve === 'function') {
          ctx.onProjectileResolve(kills);
        }
      },
    });
    if (opts.mergeLink && picked) {
      runWithDamageStackSession(ctx, stackSession, () => {
        mergeLinkFollowers(picked, ctx, []);
      });
    }
    return { kills: [], deferredKills: true };
  }

  function resolveLiveMob(mob, ctx) {
    if (!mob) return null;
    const mobs = resolveCastMobs(ctx);
    const live = (mobs || []).find((m) => m && String(m.uid) === String(mob.uid));
    if (!live || live.hp <= 0) return null;
    return live;
  }

  function ctxFacingRight(ctx) {
    if (ctx && ctx.facingRight != null) return !!ctx.facingRight;
    if (typeof SkillEffectPlayer !== 'undefined' && SkillEffectPlayer.playerFacingRight) {
      return SkillEffectPlayer.playerFacingRight(ctx?.playerEl);
    }
    const el = ctx?.playerEl;
    if (el?.classList?.contains('is-flip-x')) return false;
    return true;
  }

  /**
   * 飛箭改純動畫：傷害依 mobCount 即時結算（無視飛行距離）。
   * 連鎖／orb／instantBeam 仍走投射物判定。
   * 夜使者三／四飛閃亦走此路：飛鏢照樣扇形飛出，命中改一次結算，避免打王時每發 onHit。
   */
  function usesBallVisualDamage(skill, plan) {
    if (!skill) return false;
    if (skill.ballVisualDamage === false) return false;
    if (plan?.chain || plan?.ballMode === 'orb' || plan?.instantBeam) return false;
    if (skill.ballVisualDamage === true) return true;
    if (THROW_STAR_SKILL_IDS.has(String(skill.id || ''))) return true;
    // 精靈遊俠一般 sprite 飛箭：預設即時結算，避免清怪被飛行拖慢
    return isMercedesJob();
  }

  /** 施放特效：預設掛玩家；castFxAt=targetHead 掛第一個目標頭頂 */
  function playSkillCastFx(skill, fx, ctx, opts = {}) {
    if (!fx || ctx?.quietFx || (typeof document !== 'undefined' && document.hidden)) return;
    if (typeof SkillEffectPlayer === 'undefined') return;
    const mode = String(skill?.castFxAt || '');
    if (mode === 'targetHead') {
      const list = Array.isArray(opts.targets) && opts.targets.length
        ? opts.targets
        : resolveSkillTargets(ctx, skill?.id, 1);
      const mob = (list || []).find((m) => m && Number(m.hp) > 0) || null;
      if (mob) {
        const fieldEl = ctx.fieldEl || document.getElementById('idleHuntField');
        if (fx.effect?.length && typeof SkillEffectPlayer.playOnMobHead === 'function') {
          SkillEffectPlayer.playOnMobHead(mob, fx.effect, { fieldEl });
        }
        if (fx.effect0?.length && typeof SkillEffectPlayer.playOnMobHead === 'function') {
          SkillEffectPlayer.playOnMobHead(mob, fx.effect0, { fieldEl });
        }
        return;
      }
    }
    if (fx.effect?.length) {
      SkillEffectPlayer.playOnPlayer(fx.effect, { playerEl: ctx.playerEl });
    }
    if (fx.effect0?.length) {
      SkillEffectPlayer.playOnPlayer(fx.effect0, { playerEl: ctx.playerEl });
    }
  }

  const THROW_STAR_SKILL_IDS = new Set(['4111010', '4121013']);
  const THROW_BLASTING_TRIGGER_IDS = new Set([
    '4111010', '4121013', '4101013', '4111015', '4121052',
  ]);
  const SPREAD_THROW_ID = '400041001';
  const THROW_BLASTING_ID = '400041061';
  const THROW_BLASTING_EXTRA_IDS = ['400041062', '400041079'];
  const WIND_SHURIKEN_ID = '400041020';
  let nlBlastingPassiveAt = 0;

  /** 三／四飛閃：補上消耗品 0207 手裡劍 ball 幀（背包最前格） */
  function resolveSkillFx(skill, fxOpt) {
    const base = fxOpt || skill?.fx || {};
    if (!THROW_STAR_SKILL_IDS.has(String(skill?.id || ''))) return base;
    if (base.ball?.frames?.length) return base;
    if (typeof ThrowingStarBullet === 'undefined'
      || typeof ThrowingStarBullet.attachToFx !== 'function') {
      return base;
    }
    const itemId = (typeof ThrowingStarStore !== 'undefined'
      && typeof ThrowingStarStore.frontItemId === 'function')
      ? ThrowingStarStore.frontItemId()
      : '';
    return ThrowingStarBullet.attachToFx(base, itemId);
  }

  function throwStarPartnerRate(skill) {
    if (!THROW_STAR_SKILL_IDS.has(String(skill?.id || ''))) return 0;
    if (typeof SkillModifiers === 'undefined'
      || typeof SkillModifiers.getShadowPartnerRate !== 'function') {
      return 0;
    }
    return Math.max(0, Number(SkillModifiers.getShadowPartnerRate()) || 0);
  }

  function getSpreadThrowSpec(skill) {
    const id = String(skill?.id || '');
    if (!THROW_STAR_SKILL_IDS.has(id)) return null;
    if (typeof SkillModifiers === 'undefined' || !SkillModifiers.hasBuff?.(SPREAD_THROW_ID)) {
      return null;
    }
    const spread = typeof SkillCatalog !== 'undefined'
      ? SkillCatalog.getSkill(SPREAD_THROW_ID)
      : null;
    if (!spread) return null;
    const lv = Math.max(
      1,
      (typeof CharacterSkills !== 'undefined' ? CharacterSkills.getLevel?.(SPREAD_THROW_ID) : 0) || 1,
    );
    const st = (typeof SkillFormula !== 'undefined' && SkillFormula.evalStatCommon)
      ? SkillFormula.evalStatCommon(spread.common, lv)
      : null;
    if (!st) return null;
    const isTriple = id === '4111010';
    const extraDirs = isTriple ? 4 : 3;
    const extraPct = isTriple ? Number(st.u) : Number(st.damagePct);
    if (!(extraPct > 0)) return null;
    const dummyKey = isTriple ? 'dummyStr' : 'dummyStr2';
    let splash = 4;
    if (typeof SkillFormula !== 'undefined' && typeof SkillFormula.evalExpr === 'function') {
      const n = SkillFormula.evalExpr(spread.common?.[dummyKey], { x: lv });
      if (Number.isFinite(n) && n > 0) splash = n;
    }
    const fanAngles = (typeof SkillBallCast !== 'undefined'
      && typeof SkillBallCast.extraFanAngles === 'function')
      ? SkillBallCast.extraFanAngles(extraDirs)
      : [];
    return {
      extraDirs,
      extraPct,
      splash: Math.max(1, Math.floor(splash)),
      fanAngles,
      hitCommon: { damagePct: extraPct, attackCount: 1 },
      spreadSkill: spread,
    };
  }

  function throwStarClonePlayerEl(ctx) {
    const playerEl = ctx?.playerEl;
    const field = ctx?.fieldEl;
    const clone = playerEl?.querySelector?.('[data-paperdoll="hunt-clone"]:not(.is-hidden)')
      || field?.querySelector?.('[data-paperdoll="hunt-clone"]:not(.is-hidden)');
    if (!clone) return playerEl;
    const r = clone.getBoundingClientRect?.();
    if (!r || !(r.width > 1 && r.height > 1)) return playerEl;
    return clone;
  }

  function usesOrbBallCast(skill, fx) {
    if (typeof SkillBallCast === 'undefined') return false;
    const plan = skill?.ballCast || SkillBallCast.buildPlan?.(skill, fx || skill?.fx);
    return plan?.ballMode === 'orb';
  }

  function throwStarExtraVolleys(skill, atkCommon) {
    if (!THROW_STAR_SKILL_IDS.has(String(skill?.id || ''))) return 0;
    return Math.max(0, Math.floor(Number(atkCommon?._hyperEnhance?.attackCount) || 0));
  }

  function isWindShuriken(skill) {
    return String(skill?.id || '') === WIND_SHURIKEN_ID;
  }

  function windShurikenShootFlags(skill, atkCommon, shootMeta) {
    if (!isWindShuriken(skill)) {
      const pierce = !!shootMeta?.pierce;
      return {
        pierce,
        maxTargets: pierce ? Math.max(1, atkCommon?.mobCount || 1) : 1,
        startDelayMs: shootMeta?.startDelayMs || 0,
      };
    }
    return {
      pierce: true,
      maxTargets: Math.max(1, atkCommon?.mobCount || 1),
      startDelayMs: Number(atkCommon?.attackDelayBaseMs) || Number(shootMeta?.startDelayMs) || 0,
    };
  }

  function mobFieldAnchor(ctx, mob) {
    const fieldEl = ctx?.fieldEl || document.getElementById('idleHuntField');
    if (mob && typeof SkillEffectPlayer !== 'undefined'
      && typeof SkillEffectPlayer.fieldPointFromMob === 'function') {
      const pt = SkillEffectPlayer.fieldPointFromMob(fieldEl, mob);
      if (pt && Number.isFinite(pt.x) && Number.isFinite(pt.y)) return pt;
    }
    return null;
  }

  function startWindShurikenLinger(skill, level, atkCommon, ctx, anchor) {
    if (!isWindShuriken(skill)) return;
    if (typeof SkillBuffRuntime === 'undefined'
      || typeof SkillBuffRuntime.activateWindShurikenLinger !== 'function') {
      return;
    }
    const timing = (typeof SkillFormula !== 'undefined' && SkillFormula.evalStatCommon)
      ? SkillFormula.evalStatCommon(skill.common, level)
      : null;
    const stat = {
      ...(timing || {}),
      damagePct: Number(atkCommon?.damagePct) || Number(timing?.damagePct) || 0,
      attackCount: Number(atkCommon?.attackCount) || Number(timing?.attackCount) || 7,
      mobCount: Number(atkCommon?.mobCount) || Number(timing?.mobCount) || 6,
    };
    SkillBuffRuntime.activateWindShurikenLinger(skill, level, stat, ctx, anchor);
  }

  function tryBallCastAttack(skill, skillForFx, atkCommon, fx, ctx, form, picked, finishAfterDamage, opts = {}) {
    fx = resolveSkillFx(skillForFx || skill, fx);
    if (typeof SkillBallCast === 'undefined' || !SkillBallCast.isBallCastSkill(skill, fx)) {
      return null;
    }
    const fieldEl = ctx.fieldEl || document.getElementById('idleHuntField');
    const plan = skill.ballCast || SkillBallCast.buildPlan(skill, fx);
    if (!plan) return null;
    const level = picked?.level || 1;
    const extraVolleys = throwStarExtraVolleys(skill, atkCommon);
    const volleys = typeof SkillBallCast.resolveBulletVolleys === 'function'
      ? SkillBallCast.resolveBulletVolleys(skill, plan, level, extraVolleys)
      : null;
    const spreadSpec = getSpreadThrowSpec(skill);
    // 多箭 volley：每發只結算 1 段，總段數＝bulletCount（避免 attackCount×volley 翻倍）
    const hitCommon = volleys
      ? { ...atkCommon, attackCount: 1 }
      : atkCommon;
    const targetBudget = getSkillTargetBudget(skill, atkCommon);
    const maxTargets = plan.instantBeam
      ? Math.max(1, Number(plan.instantTargets) || targetBudget)
      : Math.max(1, atkCommon.mobCount || 1);
    const ballMobList = () => (
      ctx._skillLinkTargetPlan
        ? resolveSkillTargets(ctx, skill.id, targetBudget)
        : resolveCastMobs(ctx)
    );
    const kills = [];
    const hitMobs = [];
    const asyncId = registerAsyncCast();
    const stackSession = ctx._damageStack || beginDamageStackSession(ctx);
    const partnerR = throwStarPartnerRate(skill);
    const volleyCount = volleys ? Math.max(1, Number(volleys.count) || 1) : 0;
    const partnerVisual = partnerR > 0 && THROW_STAR_SKILL_IDS.has(String(skill.id));
    const partnerSets = partnerVisual ? 2 : 1;
    const spreadSettleHits = spreadSpec ? 1 : 0;
    const fanLines = spreadSpec ? (1 + spreadSpec.extraDirs) : 1;
    const settleVolleyCap = (THROW_STAR_SKILL_IDS.has(String(skill.id || '')) && volleyCount > NL_HIT_CAP)
      ? NL_HIT_CAP
      : (volleys ? volleyCount : 0);
    const headStackHits = volleys
      ? settleVolleyCap + spreadSettleHits + (partnerVisual ? 1 : 0)
      : Math.max(1, hitCommon.attackCount || 1) + (partnerVisual ? 1 : 0);
    // 主技能層數先佔位，讓同步的連鎖接在上方（飛彈／多箭稍後命中仍用同層）
    const headStack = damageStackSlotsForSkill(ctx, skill.id, headStackHits, {
      forceReserve: true,
      session: stackSession,
    });

    // 飛箭純動畫：依目標數即時結算（技能連鎖分攤仍用 resolveSkillTargets）
    if (usesBallVisualDamage(skill, plan)) {
      const isThrowStar = THROW_STAR_SKILL_IDS.has(String(skill.id || ''));
      const targets = (ballMobList() || [])
        .filter((m) => m && Number(m.hp) > 0)
        .slice(0, maxTargets);
      const rawVolleys = Math.max(1, volleyCount || Number(volleys?.count) || 1);
      const volleyFold = (isThrowStar && rawVolleys > NL_HIT_CAP)
        ? foldAttackSegments(rawVolleys, 1, NL_HIT_CAP)
        : { attackCount: rawVolleys, damagePct: 1 };
      const settleVolleys = volleyFold.attackCount;
      const dmgCommon = volleys
        ? {
          ...atkCommon,
          attackCount: settleVolleys,
          damagePct: (Number(atkCommon.damagePct) || 0) * volleyFold.damagePct,
        }
        : hitCommon;

      const applySettledHit = (common, mob, stackStart, hitFx) => {
        const live = resolveLiveMob(mob, ctx) || mob;
        if (!live || !(Number(live.hp) > 0)) {
          if (mob && mob.hp <= 0) {
            pushUniqueMob(kills, mob);
            syncMobStateAfterDamage([mob], ctx);
          }
          return;
        }
        const hitOpts = {
          segmentGapSec: opts.segmentGapSec,
          normalMobBonusPct: opts.normalMobBonusPct,
          forceCritTail: form.forceCritTail || 0,
          stackGroup: headStack.stackGroup,
          stackStartIndex: stackStart,
          stackSession,
        };
        if (hitFx !== undefined) hitOpts.fxHit = hitFx;
        const hit = dealHitsOnMob(skillForFx, common, live, ctx, hitOpts);
        if (hit) pushUniqueMob(hitMobs, live);
        if (live.hp <= 0) {
          pushUniqueMob(kills, live);
          syncMobStateAfterDamage([live], ctx);
        }
      };

      const settleHits = () => {
        runWithDamageStackSession(ctx, stackSession, () => {
          targets.forEach((mob) => {
            applySettledHit(dmgCommon, mob, headStack.startIndex, isThrowStar ? null : undefined);
          });
          if (isThrowStar && spreadSpec) {
            const extraCommon = {
              ...spreadSpec.hitCommon,
              damagePct: (Number(spreadSpec.extraPct) || 0) * spreadSpec.extraDirs * settleVolleys,
              attackCount: 1,
            };
            const extraPool = liveMobTargets(ballMobList(), spreadSpec.splash, ctx, skill.id);
            const extraList = extraPool.length ? extraPool : targets;
            extraList.forEach((m) => {
              applySettledHit(extraCommon, m, headStack.startIndex + settleVolleys, null);
            });
          }
          if (isThrowStar && partnerR > 0) {
            const partnerCoef = new Map();
            const addCoef = (mob, coef) => {
              if (!mob || !(coef > 0)) return;
              const key = mob.uid != null ? String(mob.uid) : '';
              if (!key) return;
              const row = partnerCoef.get(key);
              if (row) row.coef += coef;
              else partnerCoef.set(key, { mob, coef });
            };
            const mainCoef = (Number(dmgCommon.damagePct) || 0)
              * Math.max(1, Number(dmgCommon.attackCount) || 1);
            targets.forEach((m) => addCoef(m, mainCoef));
            if (spreadSpec) {
              const spreadCoef = (Number(spreadSpec.extraPct) || 0)
                * spreadSpec.extraDirs
                * settleVolleys;
              const extraPool = liveMobTargets(ballMobList(), spreadSpec.splash, ctx, skill.id);
              const extraList = extraPool.length ? extraPool : targets;
              extraList.forEach((m) => addCoef(m, spreadCoef));
            }
            const partnerStack = headStack.startIndex + settleVolleys + spreadSettleHits;
            partnerCoef.forEach((row) => {
              const pct = row.coef * (partnerR / 100);
              if (!(pct > 0)) return;
              applySettledHit(
                { damagePct: pct, attackCount: 1 },
                row.mob,
                partnerStack,
                null,
              );
            });
          }
        });
      };

      const playVisuals = (onLaunch) => {
        if (ctx.quietFx || (typeof document !== 'undefined' && document.hidden)) return;
        const playVisualBalls = (playerEl, omitPlayerEffect, onDone) => {
          SkillBallCast.playBallCast({
            fieldEl,
            playerEl,
            fx,
            plan,
            skill,
            level,
            extraBulletCount: extraVolleys,
            fanAngles: (isThrowStar && spreadSpec?.fanAngles) ? spreadSpec.fanAngles : null,
            mobs: targets,
            getMobs: () => (ballMobList() || []).filter((m) => m && Number(m.hp) > 0),
            maxTargets,
            facingRight: ctxFacingRight(ctx),
            omitPlayerEffect: !!omitPlayerEffect,
            visualOnly: true,
            onLaunch: (!omitPlayerEffect && typeof onLaunch === 'function') ? onLaunch : null,
            onDone: typeof onDone === 'function' ? onDone : () => {},
          });
        };
        playVisualBalls(ctx.playerEl, false, () => {
          if (!isThrowStar || partnerSets <= 1) return;
          if (spreadSpec) return;
          const gap = typeof scaleGameDelayMs === 'function' ? scaleGameDelayMs(90) : 90;
          const runPartner = () => {
            playVisualBalls(throwStarClonePlayerEl(ctx), true, () => {});
          };
          if (gap > 0) setTimeout(runPartner, gap);
          else runPartner();
        });
      };

      const finishVisualCast = () => {
        if (!isAsyncCastLive(asyncId)) return;
        if (opts.mergeLink && picked) {
          runWithDamageStackSession(ctx, stackSession, () => {
            mergeLinkFollowers(picked, ctx, []);
          });
        }
        releaseAsyncCast(asyncId);
        if (kills.length) syncMobStateAfterDamage(kills, ctx);
        finishAfterDamage(kills, hitMobs);
      };

      if (isThrowStar) {
        let settled = false;
        const settleOnce = () => {
          if (settled) return;
          settled = true;
          scheduleAfterPaint(() => {
            settleHits();
            finishVisualCast();
          });
        };
        if (ctx.quietFx || (typeof document !== 'undefined' && document.hidden)) {
          settleHits();
          finishVisualCast();
        } else {
          playVisuals(settleOnce);
          if (!targets.length) settleOnce();
          else setTimeout(settleOnce, scaleGameDelayMs(420));
        }
      } else {
        settleHits();
        playVisuals();
        finishVisualCast();
      }
      return { kills: [], deferredKills: true };
    }

    if (plan.ballMode === 'orb') {
      // 傷害與落點視覺同一時間軸（到達後 tick）
      SkillBallCast.playBallCast({
        fieldEl,
        playerEl: ctx.playerEl,
        fx,
        plan,
        skill,
        level,
        mobs: ballMobList(),
        getMobs: ballMobList,
        maxTargets,
        facingRight: ctxFacingRight(ctx),
        visualOnly: false,
        onHit: (mob, _hitIndex, _pt, meta) => {
          if (!isAsyncCastLive(asyncId)) return;
          runWithDamageStackSession(ctx, stackSession, () => {
            const live = resolveLiveMob(mob, ctx);
            if (!live) {
              // 可能已在先前箭矢被擊殺：仍清出佇列，避免屍體占槽
              if (mob && mob.hp <= 0) {
                pushUniqueMob(kills, mob);
                syncMobStateAfterDamage([mob], ctx);
              }
              return;
            }
            const volleyIndex = meta && Number.isFinite(meta.volleyIndex)
              ? Math.max(0, Math.floor(meta.volleyIndex))
              : null;
            const stackStartIndex = (volleys && volleyIndex != null)
              ? headStack.startIndex + volleyIndex
              : headStack.startIndex;
            const hit = dealHitsOnMob(skillForFx, hitCommon, live, ctx, {
              segmentGapSec: opts.segmentGapSec,
              normalMobBonusPct: opts.normalMobBonusPct,
              forceCritTail: form.forceCritTail || 0,
              stackGroup: headStack.stackGroup,
              stackStartIndex,
              stackSession,
            });
            if (hit) pushUniqueMob(hitMobs, live);
            if (live.hp <= 0) {
              pushUniqueMob(kills, live);
              // 多箭／多目標：擊殺當下移出佇列，否則占滿 QUEUE 無法刷新
              syncMobStateAfterDamage([live], ctx);
            }
          });
        },
        onDone: () => {
          if (!isAsyncCastLive(asyncId)) return;
          releaseAsyncCast(asyncId);
          // 掃一次佇列殘留 hp<=0（保險）
          if (kills.length) syncMobStateAfterDamage(kills, ctx);
          else syncMobStateAfterDamage([], ctx);
          finishAfterDamage(kills, hitMobs);
        },
      });
      if (opts.mergeLink && picked) {
        runWithDamageStackSession(ctx, stackSession, () => {
          mergeLinkFollowers(picked, ctx, []);
        });
      }
      return { kills: [], deferredKills: true };
    }

    let chainReservationId = null;
    const applyBallHit = (mob, meta, common, stackOffset) => {
      if (!isAsyncCastLive(asyncId)) return;
      runWithDamageStackSession(ctx, stackSession, () => {
        if (plan.chain) releaseMobFromChainReservation(chainReservationId, mob);
        const live = resolveLiveMob(mob, ctx);
        if (!live) {
          if (mob && mob.hp <= 0) {
            pushUniqueMob(kills, mob);
            syncMobStateAfterDamage([mob], ctx);
          }
          return;
        }
        const volleyIndex = meta && Number.isFinite(meta.volleyIndex)
          ? Math.max(0, Math.floor(meta.volleyIndex))
          : null;
        const stackStartIndex = (volleys && volleyIndex != null)
          ? headStack.startIndex + stackOffset + volleyIndex
          : headStack.startIndex + stackOffset;
        const hit = dealHitsOnMob(skillForFx, common, live, ctx, {
          segmentGapSec: opts.segmentGapSec,
          normalMobBonusPct: opts.normalMobBonusPct,
          forceCritTail: form.forceCritTail || 0,
          stackGroup: headStack.stackGroup,
          stackStartIndex,
          stackSession,
        });
        if (hit) pushUniqueMob(hitMobs, live);
        if (live.hp <= 0) {
          pushUniqueMob(kills, live);
          syncMobStateAfterDamage([live], ctx);
        }
        const lightningIds = (typeof SkillBuffRuntime !== 'undefined'
          && Array.isArray(SkillBuffRuntime.ICE_AGE_LIGHTNING_TRIGGER_IDS))
          ? SkillBuffRuntime.ICE_AGE_LIGHTNING_TRIGGER_IDS
          : null;
        if (hit && lightningIds && lightningIds.includes(String(skill.id || ''))
          && typeof SkillBuffRuntime.onSwordSkillCast === 'function') {
          SkillBuffRuntime.onSwordSkillCast(skill, ctx);
        }
      });
    };

    const finishBall = () => {
      if (chainReservationId != null) {
        releaseChainReservation(chainReservationId);
        chainReservationId = null;
      }
      if (!isAsyncCastLive(asyncId)) return;
      releaseAsyncCast(asyncId);
      // 掃殘留；已同步過的擊殺不會重複發獎（不在佇列內）
      syncMobStateAfterDamage(kills, ctx);
      finishAfterDamage(kills, hitMobs);
    };

    const playThrowStarSet = (playerEl, common, stackOffset, omitPlayerEffect, onDone) => {
      const castSkill = omitPlayerEffect
        ? { ...skill, common: { ...(skill.common || {}), ballDelay: '90' } }
        : skill;
      SkillBallCast.playBallCast({
        fieldEl,
        playerEl,
        fx,
        plan,
        skill: castSkill,
        level,
        extraBulletCount: extraVolleys,
        fanAngles: spreadSpec?.fanAngles || null,
        mobs: ballMobList(),
        getMobs: ballMobList,
        maxTargets,
        facingRight: ctxFacingRight(ctx),
        omitPlayerEffect,
        onChainBegin: plan.chain
          ? (path) => {
            if (!isAsyncCastLive(asyncId)) return;
            if (chainReservationId != null) {
              releaseChainReservation(chainReservationId);
              chainReservationId = null;
            }
            const segMs = 120;
            const ttl = path.length * segMs + 600;
            chainReservationId = reserveChainMobs(path.map((p) => p.mob), ttl);
          }
          : undefined,
        onHit: (mob, _hitIndex, _pt, meta) => {
          if (meta && meta.fanExtra && spreadSpec) {
            const fanIndex = Math.max(0, Math.floor(Number(meta.fanIndex) || 0));
            const extraOffset = stackOffset + volleyCount * (1 + fanIndex);
            const extraPct = (omitPlayerEffect && partnerR > 0)
              ? (Number(spreadSpec.extraPct) || 0) * (partnerR / 100)
              : (Number(spreadSpec.extraPct) || 0);
            const extraCommon = { ...spreadSpec.hitCommon, damagePct: extraPct };
            const pool = liveMobTargets(ballMobList(), spreadSpec.splash, ctx, skill.id);
            const list = pool.length ? pool : (mob ? [mob] : []);
            list.forEach((m) => applyBallHit(m, meta, extraCommon, extraOffset));
            return;
          }
          applyBallHit(mob, meta, common, stackOffset);
        },
        onDone,
      });
    };

    const runPartnerVolley = () => {
      if (!isAsyncCastLive(asyncId)) return;
      const partnerCommon = {
        ...hitCommon,
        damagePct: (Number(hitCommon.damagePct) || 0) * (partnerR / 100),
      };
      if (!(partnerCommon.damagePct > 0)) {
        finishBall();
        return;
      }
      playThrowStarSet(
        throwStarClonePlayerEl(ctx),
        partnerCommon,
        volleyCount * fanLines,
        true,
        finishBall,
      );
    };

    playThrowStarSet(ctx.playerEl, hitCommon, 0, false, () => {
      if (partnerSets > 1 && isAsyncCastLive(asyncId)) {
        const gap = typeof scaleGameDelayMs === 'function' ? scaleGameDelayMs(90) : 90;
        if (gap > 0) setTimeout(runPartnerVolley, gap);
        else runPartnerVolley();
        return;
      }
      finishBall();
    });
    if (opts.mergeLink && picked) {
      runWithDamageStackSession(ctx, stackSession, () => {
        mergeLinkFollowers(picked, ctx, []);
      });
    }
    return { kills: [], deferredKills: true };
  }

  function resolveCastMobs(ctx) {
    if (typeof ctx.getMobs === 'function') return ctx.getMobs() || [];
    return ctx.mobs || [];
  }

  /**
   * 傷害後請場景同步狀態。
   * touched：本次碰過的 mob（可含未死者）；場景端必須依實際 hp 判定擊殺／轉階段，
   * 不可把清單當成「必殺」（狩獵／BOSS 共用此契約）。
   */
  function syncMobStateAfterDamage(touched, ctx) {
    if (typeof ctx.onMobStateSync === 'function') {
      ctx.onMobStateSync(touched || []);
      return;
    }
    if (typeof ctx.onProjectileResolve === 'function') {
      ctx.onProjectileResolve(touched || []);
    }
  }

  function resolveImmediateKills(kills, ctx) {
    syncMobStateAfterDamage(kills, ctx);
  }

  function liveMobTargets(mobs, maxCount, ctx, skillId) {
    if (ctx?._skillLinkTargetPlan && skillId) {
      return resolveSkillTargets(ctx, skillId, maxCount);
    }
    return filterChainAvailableMobs(mobs)
      .filter((m) => m && m.hp > 0)
      .slice(0, Math.max(1, maxCount || 1));
  }

  function dealHitsOnMob(skill, common, mob, ctx, opts = {}) {
    if (!mob) return false;
    const attackCount = Math.max(1, common.attackCount || 1);
    const multiHit = attackCount > 1;
    const normalBonus = Number(opts.normalMobBonusPct) || 0;
    const bonus = (!mob.isBoss && normalBonus > 0) ? normalBonus : 0;
    const critRateBonus = resolveCritRateBonus(skill, common, opts.critRateBonus);
    const stackSlots = (opts.stackGroup != null && Number.isFinite(opts.stackStartIndex))
      ? {
        stackGroup: opts.stackGroup,
        startIndex: Math.max(0, Math.floor(opts.stackStartIndex)),
      }
      : damageStackSlotsForSkill(ctx, skill?.id, attackCount, {
        isolateStack: !!opts.isolateStack,
        session: opts.stackSession,
      });
    return applyHitsToMob(mob, {
      damagePct: common.damagePct,
      damagePctBonus: bonus,
      attackCount,
      fxHit: opts.fxHit !== undefined ? opts.fxHit : skill.fx?.hit,
      multiHit,
      segmentGapSec: opts.segmentGapSec,
      showMobDamage: ctx.showMobDamage,
      onDamage: ctx.onDamage,
      flashHit: ctx.flashHit,
      flashDie: ctx.flashDie,
      forceCritTail: opts.forceCritTail || 0,
      critRateBonus,
      skillId: skill?.id,
      stackGroup: stackSlots.stackGroup,
      stackStartIndex: stackSlots.startIndex,
      ctx,
    });
  }

  /** 技能／超技爆擊率加成（dealHitsOnMob／dealSkillDamage 共用；結果可快取於 common） */
  function resolveCritRateBonus(skill, common, extra = 0) {
    let critRateBonus = Number(extra) || 0;
    if (common && common._critRateBonusCached != null && !(Number(extra) > 0)) {
      return Number(common._critRateBonusCached) || 0;
    }
    critRateBonus += Number(common?._hyperEnhance?.cr) || 0;
    if (typeof SkillFormula !== 'undefined' && skill?.common) {
      const lv = (typeof CharacterSkills !== 'undefined')
        ? (CharacterSkills.getLevel?.(skill.id) || 0)
        : 0;
      if (lv > 0) {
        const st = SkillFormula.evalStatCommon(skill.common, lv);
        critRateBonus += Number(st.cr) || 0;
      }
    }
    if (common && typeof common === 'object' && !(Number(extra) > 0)) {
      common._critRateBonusCached = critRateBonus;
    }
    return critRateBonus;
  }

  /** 夜使者壓段：指定技折成 1 段；其餘最多 4 段，多餘段數折進傷害係數 */
  const NL_HIT_CAP = 4;
  const NL_HIT_FOLD_TO_ONE_IDS = new Set([
    '4111015', // 手裏劍挑戰
    '4121017', // 挑釁契約本體
    '4121020', // 挑釁追擊手裏劍
    '400041062', // 飛閃起爆符爆炸
    '400041079',
  ]);

  function foldAttackSegments(attackCount, damagePct, cap) {
    const n = Math.max(1, Math.floor(Number(attackCount) || 1));
    const keep = Math.max(1, Math.floor(Number(cap) || NL_HIT_CAP));
    const dmg = Number(damagePct) || 0;
    if (n <= keep) return { attackCount: n, damagePct: dmg };
    return {
      attackCount: keep,
      damagePct: dmg * (n / keep),
    };
  }

  function foldNlHitSegments(skill, common) {
    if (!common || !isNightLordJob()) return common;
    const id = String(skill?.id || '');
    const cap = NL_HIT_FOLD_TO_ONE_IDS.has(id) ? 1 : NL_HIT_CAP;
    const folded = foldAttackSegments(common.attackCount, common.damagePct, cap);
    if (folded.attackCount === Math.max(1, Math.floor(Number(common.attackCount) || 1))
      && folded.damagePct === (Number(common.damagePct) || 0)) {
      return common;
    }
    return {
      ...common,
      attackCount: folded.attackCount,
      damagePct: folded.damagePct,
    };
  }

  /** 套用超技能被動（傷害／怪物數／段數）與全域戰鬥規則後的施放 common */
  function combatCommonFor(skill, common, opts = {}) {
    let out = common;
    if (typeof SkillModifiers !== 'undefined') {
      if (typeof SkillModifiers.applySkillEnhance === 'function') {
        out = SkillModifiers.applySkillEnhance(skill?.id, out);
      }
      if (typeof SkillModifiers.applyGlobalCombatRules === 'function') {
        out = SkillModifiers.applyGlobalCombatRules(skill, out);
      }
    }
    if (opts.skipHitFold) return out;
    return foldNlHitSegments(skill, out);
  }

  /** 單次施放佔用的佇列目標數（技能連鎖依此錯開） */
  function getSkillTargetBudget(skill, atkCommon) {
    if (!skill) return Math.max(1, atkCommon?.mobCount || 1);
    const ballPlan = skill.ballCast
      || (typeof SkillBallCast !== 'undefined' ? SkillBallCast.buildPlan?.(skill, skill.fx) : null);
    if (ballPlan?.instantBeam) {
      return Math.max(1, Number(ballPlan.instantTargets) || atkCommon?.mobCount || 1);
    }
    const shootLayers = skill.fx?.shootobj?.layers;
    if (Array.isArray(shootLayers) && shootLayers.length) {
      if (String(skill.id) === WIND_SHURIKEN_ID) {
        return Math.max(1, atkCommon?.mobCount || 1);
      }
      const pierce = !!skill.fx?.shootobj?.pierce;
      return pierce ? Math.max(1, atkCommon?.mobCount || 1) : 1;
    }
    return Math.max(1, atkCommon?.mobCount || 1);
  }

  function readCritMultiplier() {
    try {
      if (typeof UiCharacterInfo !== 'undefined'
        && typeof UiCharacterInfo.getHuntCritMultiplier === 'function') {
        const n = Number(UiCharacterInfo.getHuntCritMultiplier());
        if (Number.isFinite(n) && n > 0) return n;
      }
      if (typeof CombatPower !== 'undefined' && typeof CombatPower.resolveCurrentInputs === 'function') {
        let snapshot = null;
        if (typeof EquipStatPanel !== 'undefined' && typeof EquipStatPanel.buildSnapshot === 'function') {
          snapshot = EquipStatPanel.buildSnapshot();
        }
        const combat = CombatPower.resolveCurrentInputs(snapshot);
        const panelCritDmg = Number(combat?.resolved?.critDamageDetail?.panel);
        if (Number.isFinite(panelCritDmg)) return 1.35 + panelCritDmg / 100;
        return Number(combat?.resolved?.rawCritSum) || 1.35;
      }
    } catch (_) { /* ignore */ }
    return 1.35;
  }

  /** 估算單次施放對單怪總傷（非隨機；含保證爆擊段） */
  function estimateSkillTotalDamage(skill, atkCommon, mob, form = null) {
    if (!mob || mob.hp <= 0) return 0;
    if (typeof UiCharacterInfo === 'undefined' || typeof UiCharacterInfo.getHuntHitDamage !== 'function') {
      return 0;
    }
    let pct = Number(atkCommon?.damagePct) || 0;
    if (!mob.isBoss && typeof SkillFormula !== 'undefined') {
      const level = CharacterSkills.getLevel?.(skill?.id) || 0;
      pct += SkillFormula.resolveNormalMobBonusPct?.(skill, level) || 0;
    }
    const skillEn = (skill?.id && typeof SkillModifiers !== 'undefined'
      && typeof SkillModifiers.getSkillEnhance === 'function')
      ? SkillModifiers.getSkillEnhance(skill.id)
      : null;
    const skillBdR = (mob.isBoss && skillEn) ? (Number(skillEn.bdR) || 0) : 0;
    const base = UiCharacterInfo.getHuntHitDamage(!!mob.isBoss, { skillBdR });
    const perHit = Math.max(0, Math.floor(base * pct / 100));
    const hits = Math.max(1, Number(atkCommon?.attackCount) || 1);
    const critTail = Math.max(0, Math.min(hits, Number(form?.forceCritTail) || 0));
    const critMult = readCritMultiplier();
    let total = 0;
    for (let i = 0; i < hits; i += 1) {
      const useCrit = critTail > 0 && i >= hits - critTail;
      let hitDmg = useCrit ? Math.floor(perHit * critMult) : perHit;
      if (typeof SkillMobStatus !== 'undefined'
        && typeof SkillMobStatus.applyOutgoingDamageMods === 'function') {
        hitDmg = SkillMobStatus.applyOutgoingDamageMods(mob, hitDmg, {
          isCritical: useCrit,
          skillId: skill?.id,
        });
      }
      // 怪物防禦暫不套用（與 resolveMobHitDamage 一致）
      total += hitDmg;
    }
    return total;
  }

  function canSkillOneShotMob(skill, level, mob) {
    if (!skill || !mob || mob.hp <= 0) return false;
    const baseCommon = evalSkill(skill, level);
    if (!baseCommon) return false;
    const form = resolveComboEnhancedForm(skill, level, baseCommon);
    const atkCommon = combatCommonFor(skill, form.common || baseCommon);
    const dmg = estimateSkillTotalDamage(skill, atkCommon, mob, form);
    return dmg >= Math.max(1, Math.floor(Number(mob.hp) || 0));
  }

  function skillLinkEntry(skillId) {
    let id = String(skillId || '');
    if (!id || typeof SkillCatalog === 'undefined') return null;
    if (typeof CharacterSkills.resolveCombatSkillId === 'function') {
      id = CharacterSkills.resolveCombatSkillId(id);
    }
    const skill = SkillCatalog.getSkill(id);
    if (!skill) return null;
    const level = CharacterSkills.getLevel?.(id) || 0;
    if (!(level > 0)) return null;
    const baseCommon = evalSkill(skill, level);
    if (!baseCommon) return null;
    const form = resolveComboEnhancedForm(skill, level, baseCommon);
    const atkCommon = combatCommonFor(skill, form.common || baseCommon);
    return {
      id,
      skill,
      level,
      count: getSkillTargetBudget(skill, atkCommon),
    };
  }

  function buildSkillLinkTargetPlan(picked, ctx) {
    if (!picked?.isSkillLink || !picked.skill) return null;
    const ids = [
      String(picked.skill.id),
      ...(picked.skillLinkFollowers || []).map((id) => String(id)),
    ].filter(Boolean);
    const alive = filterChainAvailableMobs(resolveCastMobs(ctx))
      .filter((m) => m && m.hp > 0);
    if (!alive.length) return null;

    const entries = ids.map((id) => skillLinkEntry(id)).filter(Boolean);
    if (!entries.length) return null;

    const head = entries[0];
    const spread = !!(head && canSkillOneShotMob(head.skill, head.level, alive[0]));

    const plan = Object.create(null);
    plan._spread = spread;
    plan._queueOrder = alive.map((m) => String(m.uid));

    let offset = 0;
    entries.forEach((entry) => {
      if (spread) {
        plan[entry.id] = { offset, count: entry.count };
        offset += entry.count;
      } else {
        plan[entry.id] = { offset: 0, count: entry.count };
      }
    });
    return plan;
  }

  function initSkillLinkTargeting(ctx, picked) {
    if (!picked?.isSkillLink) {
      delete ctx._skillLinkTargetPlan;
      return;
    }
    ctx._skillLinkTargetPlan = buildSkillLinkTargetPlan(picked, ctx);
  }

  /** 依佇列取目標；技能連鎖可秒殺時依 mobCount 錯開 slice（以施放當下佇列 uid 快照） */
  function resolveSkillTargets(ctx, skillId, requestedCount) {
    const alive = filterChainAvailableMobs(resolveCastMobs(ctx))
      .filter((m) => m && m.hp > 0);
    const sid = skillId != null ? String(skillId) : '';
    const plan = ctx._skillLinkTargetPlan;
    const entry = sid && plan ? plan[sid] : null;
    if (entry && Array.isArray(plan._queueOrder) && plan._queueOrder.length) {
      const take = Math.max(1, entry.count || requestedCount || 1);
      const offset = plan._spread ? Math.max(0, Number(entry.offset) || 0) : 0;
      const byUid = new Map(alive.map((m) => [String(m.uid), m]));
      const out = [];
      for (let i = offset; i < plan._queueOrder.length && out.length < take; i += 1) {
        const mob = byUid.get(plan._queueOrder[i]);
        if (mob && mob.hp > 0) out.push(mob);
      }
      if (out.length) return out;
    }
    const n = Math.max(1, requestedCount || 1);
    return alive.slice(0, n);
  }

  function pickNextCast(opts = {}) {
    if (typeof CharacterSkills === 'undefined' || typeof SkillCatalog === 'undefined') {
      return null;
    }
    const t = nowMs();
    const sustainActive = !!activeSustainChannel;
    // 持續引導中：仍可挑有 CD 的招來打斷；其餘維持引導
    if (isCastLocked(t) && !sustainActive) return null;

    const loadout = CharacterSkills.currentLoadout?.() || [];
    const linkIds = (typeof CharacterSkills.currentSkillLink === 'function'
      ? CharacterSkills.currentSkillLink()
      : [])
      .map((id) => (id ? String(id) : null));
    const linkSet = new Set(linkIds.filter(Boolean));

    function makeCandidate(id, slot) {
      if (!id) return null;
      const resolvedId = typeof CharacterSkills.resolveCombatSkillId === 'function'
        ? CharacterSkills.resolveCombatSkillId(id)
        : String(id);
      const skill = SkillCatalog.getSkill(resolvedId);
      if (!skill || skill.skipPanel) return null;
      if ((skill.type !== 'active' && skill.type !== 'buff') || !skill.equipable) return null;
      if (typeof CharacterSkills.isSkillSuperseded === 'function'
        && CharacterSkills.isSkillSuperseded(resolvedId)) return null;
      const level = CharacterSkills.getLevel(resolvedId);
      if (!(level > 0)) return null;
      if (String(resolvedId) === '400011073') {
        const stacks = (typeof SkillComboOrbs !== 'undefined' && SkillComboOrbs.getStacks)
          ? Number(SkillComboOrbs.getStacks()) || 0
          : 0;
        if (stacks < 1) return null;
      }
      const common = evalSkill(skill, level);
      if (!common) return null;
      const buff = isBuffSkill(skill, common);
      return {
        slot,
        skill,
        level,
        common,
        isBuff: buff,
        hasCd: common.cooltimeSec > 0,
        ready: common.cooltimeSec <= 0 || (cooldowns[String(skill.id)] || 0) <= t,
      };
    }

    const candidates = [];
    for (let i = 0; i < loadout.length; i += 1) {
      const c = makeCandidate(loadout[i], i);
      if (c) candidates.push(c);
    }

    function pickReadyCdCast() {
      const cdBuff = candidates.find((c) => (
        c.isBuff && c.hasCd && c.ready
        && !(typeof SkillBuffRuntime !== 'undefined' && SkillBuffRuntime.isToggleBuffSkill?.(c.skill))
      ));
      if (cdBuff) return cdBuff;
      const toggleCdBuff = candidates.find((c) => (
        c.isBuff && c.hasCd && c.ready
        && typeof SkillBuffRuntime !== 'undefined'
        && SkillBuffRuntime.isToggleBuffSkill?.(c.skill)
        && !isBuffDurationActive(c.skill.id, t)
      ));
      if (toggleCdBuff) return toggleCdBuff;
      const cdAtk = candidates.find((c) => !c.isBuff && c.hasCd && c.ready);
      if (cdAtk) return cdAtk;
      return null;
    }

    // 持續引導中：只允許有 CD 的招打斷，其餘維持射擊
    if (sustainActive) {
      return pickReadyCdCast();
    }

    // 1) 有 CD 的 buff（不含開關技：開關技走下方「未啟用才放」）
    const cdBuff = candidates.find((c) => (
      c.isBuff && c.hasCd && c.ready
      && !(typeof SkillBuffRuntime !== 'undefined' && SkillBuffRuntime.isToggleBuffSkill?.(c.skill))
    ));
    if (cdBuff) return cdBuff;

    // 2) 無 CD 的 buff／開關技（一般 buff：剩 ≤2 秒提前補；開關技：未開啟才放）
    const noCdBuff = candidates.find((c) => (
      c.isBuff && !c.hasCd && c.ready && shouldCastNoCdBuff(c, t)
    ));
    if (noCdBuff) return noCdBuff;

    // 2b) 有 CD 的開關技：僅在未開啟時施放
    const toggleCdBuff = candidates.find((c) => (
      c.isBuff && c.hasCd && c.ready
      && typeof SkillBuffRuntime !== 'undefined'
      && SkillBuffRuntime.isToggleBuffSkill?.(c.skill)
      && !isBuffDurationActive(c.skill.id, t)
    ));
    if (toggleCdBuff) return toggleCdBuff;

    // 3) 有 CD 的攻擊
    const cdAtk = candidates.find((c) => !c.isBuff && c.hasCd && c.ready);
    if (cdAtk) return cdAtk;

    // 4) 技能連鎖：1 號主導延遲；2–4 於 cast 時無後搖追加
    if (linkIds[0]) {
      const head = makeCandidate(linkIds[0], -1);
      if (head && !head.isBuff && !head.hasCd && head.ready) {
        return {
          ...head,
          isSkillLink: true,
          skillLinkFollowers: linkIds.slice(1).filter(Boolean),
        };
      }
    }

    // 5) 無 CD 的攻擊：依技能欄順序輪流（已在連鎖內者不重複單放）
    const noCdAtks = candidates.filter((c) => (
      !c.isBuff && !c.hasCd && c.ready && !linkSet.has(String(c.skill.id))
    ));
    if (!noCdAtks.length) return null;
    const next = noCdAtks.find((c) => c.slot > lastNoCdAttackSlot);
    return next || noCdAtks[0];
  }

  function rollSkillHit(isBoss, damagePct, opts = {}) {
    if (typeof UiCharacterInfo !== 'undefined' && typeof UiCharacterInfo.rollHuntHit === 'function') {
      return UiCharacterInfo.rollHuntHit(!!isBoss, {
        damagePct,
        forceCritical: !!opts.forceCritical,
        critRateBonus: opts.critRateBonus,
        skillBdR: opts.skillBdR,
      });
    }
    return { dmg: 0, isCritical: false };
  }

  /** 章節／副本小怪：多餘段數只是超殺，顯示與結算都壓到剛好擊殺（全職業；BOSS 仍打滿段） */
  function shouldFoldOverkillHits(mob) {
    return !!(mob && !mob.isBoss && Number(mob.hp) > 0);
  }

  function previewHitDamage(mob, rawDmg, skillIed) {
    if (typeof IdleHunt !== 'undefined' && typeof IdleHunt.resolveMobHitDamage === 'function') {
      return IdleHunt.resolveMobHitDamage(mob, rawDmg, { skillIed });
    }
    return Math.max(0, Math.floor(Number(rawDmg) || 0));
  }

  function applyHitsToMob(mob, opts = {}) {
    const {
      damagePct,
      attackCount = 1,
      fxHit: fxHitOpt,
      multiHit,
      segmentGapSec,
      showMobDamage,
      onDamage,
      flashHit,
      flashDie,
      damagePctBonus = 0,
      forceCritTail = 0,
      critRateBonus = 0,
      skillId = null,
      stackGroup: stackGroupOpt,
      stackStartIndex: stackStartOpt,
      isolateStack = false,
      ctx = null,
      outgoingMult = 1,
    } = opts;
    if (!mob) return false;
    if (!mob.isBoss && !(Number(mob.hp) > 0)) return false;
    const pct = (Number(damagePct) || 0) + (Number(damagePctBonus) || 0);
    const n = Math.max(1, Number(attackCount) || 1);
    const critTail = Math.max(0, Math.min(n, Math.floor(Number(forceCritTail) || 0)));
    const hitFx = fxHitOpt !== undefined ? fxHitOpt : null;
    if (hitFx?.length && typeof SkillEffectPlayer !== 'undefined') {
      SkillEffectPlayer.playOnMob(mob, hitFx);
    }

    const skillEn = (skillId && typeof SkillModifiers !== 'undefined'
      && typeof SkillModifiers.getSkillEnhance === 'function')
      ? SkillModifiers.getSkillEnhance(skillId)
      : null;
    let skillBdR = (mob.isBoss && skillEn) ? (Number(skillEn.bdR) || 0) : 0;
    if (mob.isBoss && skillId && typeof SkillCatalog !== 'undefined'
      && typeof SkillFormula !== 'undefined') {
      const sk = SkillCatalog.getSkill(skillId);
      if (sk?.common?.bdR != null && String(sk.common.bdR) !== '') {
        const lv = (typeof CharacterSkills !== 'undefined'
          ? CharacterSkills.getLevel?.(skillId)
          : 0) || 1;
        const st = SkillFormula.evalStatCommon(sk.common, lv);
        skillBdR += Number(st.bdR) || 0;
      }
    }
    const skillIed = skillEn ? (Number(skillEn.ied) || 0) : 0;

    let stackGroup = stackGroupOpt;
    let startIndex = Number.isFinite(stackStartOpt) ? Math.max(0, Math.floor(stackStartOpt)) : null;
    if (stackGroup == null || startIndex == null) {
      const slots = damageStackSlotsForSkill(ctx, skillId, n, { isolateStack });
      if (stackGroup == null) stackGroup = slots.stackGroup;
      if (startIndex == null) startIndex = slots.startIndex;
    }

    let any = false;
    const hitRows = [];
    const foldOverkill = shouldFoldOverkillHits(mob);
    let hpLeft = foldOverkill ? Number(mob.hp) : 0;
    for (let i = 0; i < n; i += 1) {
      const forceCritical = critTail > 0 && i >= n - critTail;
      const hit = rollSkillHit(!!mob.isBoss, pct, {
        forceCritical,
        critRateBonus,
        skillBdR,
      });
      let dmg = hit.dmg;
      if (!(dmg > 0)) continue;
      if (typeof SkillMobStatus !== 'undefined'
        && typeof SkillMobStatus.applyOutgoingDamageMods === 'function') {
        dmg = SkillMobStatus.applyOutgoingDamageMods(mob, dmg, {
          isCritical: !!hit.isCritical,
          skillId,
        });
      }
      const fdMult = Number(outgoingMult);
      if (Number.isFinite(fdMult) && fdMult !== 1) {
        dmg = Math.max(0, Math.round(dmg * fdMult));
      }
      if (!(dmg > 0)) continue;
      any = true;
      hitRows.push({
        dmg,
        isCritical: !!hit.isCritical,
        dmgOpts: {
          multiHit: true,
          stackIndex: startIndex + i,
          stackGroup,
          ...(segmentGapSec != null
            ? { delay: i * segmentGapSec }
            : {}),
        },
      });
      if (foldOverkill) {
        hpLeft -= previewHitDamage(mob, dmg, skillIed);
        if (!(hpLeft > 0)) break;
      }
    }
    if (hitRows.length) {
      if (typeof IdleHunt !== 'undefined' && typeof IdleHunt.applyPlayerHitsToMob === 'function') {
        IdleHunt.applyPlayerHitsToMob(mob, hitRows, {
          skillIed,
          showMobDamage,
          onDamage,
        });
      } else {
        for (let i = 0; i < hitRows.length; i += 1) {
          const row = hitRows[i];
          if (typeof IdleHunt !== 'undefined' && typeof IdleHunt.applyPlayerHitToMob === 'function') {
            IdleHunt.applyPlayerHitToMob(mob, row.dmg, {
              skillIed,
              isCritical: !!row.isCritical,
              showMobDamage,
              onDamage,
              dmgOpts: row.dmgOpts,
            });
          } else {
            const finalDmg = (typeof IdleHunt !== 'undefined' && typeof IdleHunt.resolveMobHitDamage === 'function')
              ? IdleHunt.resolveMobHitDamage(mob, row.dmg, { skillIed })
              : row.dmg;
            if (typeof showMobDamage === 'function') {
              showMobDamage(mob, finalDmg, row.isCritical, row.dmgOpts);
            }
            if (typeof onDamage === 'function') onDamage(finalDmg);
            mob.hp -= finalDmg;
          }
        }
      }
    }
    if (typeof SkillMobStatus !== 'undefined'
      && typeof SkillMobStatus.afterPlayerDamagedMob === 'function') {
      SkillMobStatus.afterPlayerDamagedMob(mob, any, { skillId });
    }
    if (any) tryManaAbsorbOnHit(mob);
    if (mob.hp > 0 && any && typeof flashHit === 'function') {
      flashHit(mob.uid);
    } else if (mob.hp <= 0 && any && typeof flashDie === 'function') {
      flashDie(mob.uid, mob);
    }
    return any;
  }

  /**
   * 滿鬥氣強化形態（狂暴攻擊 1121008 → 1120017）。
   * 係數／動作／特效切換；超技加乘仍掛在本體 skill id。
   */
  function resolveComboEnhancedForm(skill, level, common) {
    const base = {
      skillForFx: skill,
      actions: skill?.actions || [],
      common: common && typeof common === 'object' ? { ...common } : {},
      forceCritTail: String(skill?.id) === '1121008' ? 1 : 0,
      enhanced: false,
    };
    const enhId = skill?.enhancedSkillId ? String(skill.enhancedSkillId) : '';
    if (!enhId) return base;
    if (typeof SkillComboOrbs === 'undefined' || !SkillComboOrbs.isMaxed?.()) return base;
    if (typeof SkillCatalog === 'undefined') return base;
    const enh = SkillCatalog.getSkill(enhId);
    if (!enh) return base;

    // 形態本體用 raw eval；超技強化稍後由 combatCommonFor 依「原技能 id」套用
    const enhEval = (typeof SkillFormula !== 'undefined')
      ? (SkillFormula.evalCommon(enh.common || {}, level) || {})
      : {};
    let damagePct = Number(enhEval.damagePct) || 0;
    let attackCount = Math.max(1, Number(enhEval.attackCount) || 0);
    if (!(damagePct > 0) && skill.common?.x != null && typeof SkillFormula !== 'undefined') {
      damagePct = SkillFormula.evalExpr(skill.common.x, { x: level }) || 0;
    }
    if (!(attackCount > 0) && skill.common?.y != null && typeof SkillFormula !== 'undefined') {
      attackCount = Math.max(1, Math.floor(SkillFormula.evalExpr(skill.common.y, { x: level })) || 1);
    }
    const nextCommon = {
      ...base.common,
      damagePct: damagePct > 0 ? damagePct : base.common.damagePct,
      attackCount: attackCount > 0 ? attackCount : base.common.attackCount,
      mobCount: Number(enhEval.mobCount) > 0 ? enhEval.mobCount : base.common.mobCount,
    };
    // 形態數值換新後重套超技／全域規則（勿沿用本體已標記的 _hyperEnhance）
    delete nextCommon._hyperEnhance;
    delete nextCommon._globalCombatRules;
    delete nextCommon._critRateBonusCached;
    return {
      skillForFx: enh,
      actions: (enh.actions && enh.actions.length) ? enh.actions : base.actions,
      common: nextCommon,
      forceCritTail: 2,
      enhanced: true,
    };
  }

  function notifyComboAndSync(opts = {}) {
    if (typeof SkillComboOrbs !== 'undefined') SkillComboOrbs.onAttackHit?.();
    if (opts.skipPanel) return;
    if (typeof CharacterCombatPanel !== 'undefined') {
      CharacterCombatPanel.syncToCombatPower?.();
    }
  }

  /**
   * 接技 addAttack：依優先序選下一段；CD 中跳過，改走下一條路線。
   * 優先序：skill.addAttackPrefer（覆寫）→ skillPlus 高階優先 → base skill。
   */
  function isAddAttackCandidateReady(skillId, common, t) {
    const cdSec = Number(common?.cooltimeSec) || 0;
    if (!(cdSec > 0)) return true;
    return (cooldowns[String(skillId)] || 0) <= t;
  }

  function resolveAddAttackFollowupOrder(fromSkill) {
    const aa = fromSkill?.addAttack;
    if (!aa?.skill) return [];
    const prefer = Array.isArray(fromSkill.addAttackPrefer) && fromSkill.addAttackPrefer.length
      ? fromSkill.addAttackPrefer.map(String)
      : null;
    if (prefer) {
      const rest = [];
      const plus = Array.isArray(aa.skillPlus) ? aa.skillPlus.map(String) : [];
      const base = String(aa.skill);
      [...plus].reverse().concat([base]).forEach((id) => {
        if (!prefer.includes(id) && !rest.includes(id)) rest.push(id);
      });
      return prefer.concat(rest);
    }
    const plus = Array.isArray(aa.skillPlus) ? aa.skillPlus : [];
    return [...plus].reverse().map(String).concat([String(aa.skill)]);
  }

  function resolveAddAttackFollowup(fromSkill) {
    const aa = fromSkill?.addAttack;
    if (!aa?.skill || typeof SkillCatalog === 'undefined') return null;
    const ordered = resolveAddAttackFollowupOrder(fromSkill);
    const fromLevel = CharacterSkills.getLevel?.(fromSkill.id) || 0;
    const t = nowMs();
    for (const id of ordered) {
      const skill = SkillCatalog.getSkill(id);
      if (!skill) continue;
      let level = CharacterSkills.getLevel?.(id) || 0;
      if (!(level > 0) && skill.skipPanel) {
        level = fromLevel || 1;
      }
      if (!(level > 0)) continue;
      const common = evalSkill(skill, level);
      if (common && !isAddAttackCandidateReady(id, common, t)) continue;
      return { skill, level, meta: aa };
    }
    return null;
  }

  function scheduleAddAttackFollowup(fromSkill, ctx, depth = 0) {
    if (depth > 5 || !fromSkill?.addAttack?.skill) {
      if (typeof Paperdoll !== 'undefined') Paperdoll.setComboMoveHold?.(false);
      return;
    }
    // 技能連鎖同幀多段時不另開接技，避免兩套連段互相搶節奏
    if (ctx?.skipAddAttack) {
      if (typeof Paperdoll !== 'undefined') Paperdoll.setComboMoveHold?.(false);
      return;
    }
    const aa = fromSkill.addAttack;
    // 首段僅 isAuto／type=1；鏈上後續一律接
    if (depth === 0 && !aa.isAuto && Number(aa.type) !== 1) {
      if (typeof Paperdoll !== 'undefined') Paperdoll.setComboMoveHold?.(false);
      return;
    }
    const next = resolveAddAttackFollowup(fromSkill);
    if (!next) {
      if (typeof Paperdoll !== 'undefined') Paperdoll.setComboMoveHold?.(false);
      return;
    }
    let delayMs = Number(aa.activeTime) || 0;
    if (delayMs > 0 && delayMs <= 60) delayMs *= 30;
    if (!(delayMs > 0)) delayMs = 120;
    // idle 自動接技：不必等完整 permit 窗口
    delayMs = Math.max(90, Math.min(delayMs, 450));
    // 精靈遊俠：接技間隔 ×0.25（相對原設定約快 4 倍）
    if (isMercedesJob()) {
      delayMs = Math.max(20, delayMs * 0.25);
    }
    // 接技期間鎖住選招，避免連鎖／飛箭插入連段中間
    castLockUntil = Math.max(castLockUntil, nowMs() + scaleGameDelayMs(delayMs + 80));
    // 頭技開始接技鏈：保留紙娃娃 move 直到整段結束
    if (typeof Paperdoll !== 'undefined') Paperdoll.setComboMoveHold?.(true);
    window.setTimeout(() => {
      castAddAttackFollowup(next, ctx, depth + 1);
    }, scaleGameDelayMs(delayMs));
  }

  function castAddAttackFollowup(next, ctx, depth) {
    if (!next?.skill) {
      if (typeof Paperdoll !== 'undefined') Paperdoll.setComboMoveHold?.(false);
      return;
    }
    const baseCommon = evalSkill(next.skill, next.level);
    if (!baseCommon || isBuffSkill(next.skill, baseCommon)) {
      if (typeof Paperdoll !== 'undefined') Paperdoll.setComboMoveHold?.(false);
      return;
    }
    const picked = {
      skill: next.skill,
      level: next.level,
      common: baseCommon,
      slot: -1,
      isAddAttack: true,
    };
    // 接技略過選招鎖但仍保持短鎖，讓連段特效銜接且不被其他招插入
    castLockUntil = 0;
    if (typeof Paperdoll !== 'undefined') Paperdoll.setComboMoveHold?.(true);
    const liveCtx = {
      ...ctx,
      addAttackDepth: depth,
      skipAddAttack: false,
    };
    const result = cast(picked, liveCtx);
    // 接技由 setTimeout 觸發，回傳值不會回到 IdleHunt.tick；
    // 同步路徑必須在此結算擊殺，否則副本殺怪數不累加。
    // area／projectile 等 deferred 路徑已在 onDone → onProjectileResolve 處理。
    if (result?.cast && !result.deferredKills) {
      syncMobStateAfterDamage(result.kills || [], liveCtx);
    }
  }

  const FINAL_ATTACK_BASIC_ID = '1100002';
  const FINAL_ATTACK_ADV_ID = '1120013';
  const FINAL_ATTACK_MERCEDES_BASIC_ID = '23100006';
  const FINAL_ATTACK_MERCEDES_ADV_ID = '23120012';
  const FINAL_ATTACK_WEAPON_TYPES = new Set(['單手劍', '單手斧', '雙手劍', '雙手斧']);
  const FINAL_ATTACK_MERCEDES_WEAPON_TYPES = new Set(['雙弩槍']);
  /** WZ finalAttack→1100002 的英雄直接攻擊技（110／111／112.img） */
  const FINAL_ATTACK_TRIGGER_IDS = new Set([
    '1101011', '1101014',
    '1111010', '1111012', '1111016',
    '1121008', '1121052',
  ]);
  const FINAL_ATTACK_SELF_IDS = new Set([
    FINAL_ATTACK_BASIC_ID,
    FINAL_ATTACK_ADV_ID,
    FINAL_ATTACK_MERCEDES_BASIC_ID,
    FINAL_ATTACK_MERCEDES_ADV_ID,
  ]);

  function resolveEquippedWeaponType() {
    if (typeof WeaponTypeMap === 'undefined') return '';
    const getWorn = typeof UiEquipModule !== 'undefined'
      ? (slot) => UiEquipModule.getWornEntry?.(slot)
      : null;
    const info = WeaponTypeMap.resolveFromEquippedSlots?.(getWorn);
    if (info?.weaponType) return String(info.weaponType);
    const jobName = typeof CharacterCombatPanel !== 'undefined'
      ? CharacterCombatPanel.getState?.()?.jobName
      : '';
    return WeaponTypeMap.JOB_DEFAULT_WEAPON_TYPE?.[jobName] || '';
  }

  function resolveFinalAttackPassive() {
    if (typeof CharacterSkills === 'undefined' || typeof SkillCatalog === 'undefined') {
      return null;
    }
    const pick = (id) => {
      const level = CharacterSkills.getLevel(id) || 0;
      if (!(level > 0)) return null;
      const skill = SkillCatalog.getSkill(id);
      return skill ? { skill, level } : null;
    };
    return pick(FINAL_ATTACK_MERCEDES_ADV_ID)
      || pick(FINAL_ATTACK_MERCEDES_BASIC_ID)
      || pick(FINAL_ATTACK_ADV_ID)
      || pick(FINAL_ATTACK_BASIC_ID);
  }

  function isMercedesFinalAttackPassive(passive) {
    const id = String(passive?.skill?.id || '');
    return id === FINAL_ATTACK_MERCEDES_BASIC_ID || id === FINAL_ATTACK_MERCEDES_ADV_ID;
  }

  function isFinalAttackWeaponEquipped() {
    const wt = resolveEquippedWeaponType();
    const passive = resolveFinalAttackPassive();
    if (isMercedesFinalAttackPassive(passive)) {
      return FINAL_ATTACK_MERCEDES_WEAPON_TYPES.has(wt);
    }
    return FINAL_ATTACK_WEAPON_TYPES.has(wt);
  }

  function skillTriggersFinalAttack(triggerSkillId) {
    const id = String(triggerSkillId || '');
    if (!id || FINAL_ATTACK_SELF_IDS.has(id)) return false;
    const skill = typeof SkillCatalog !== 'undefined' ? SkillCatalog.getSkill(id) : null;
    if (skill?.finalAttackId) return true;
    const passive = resolveFinalAttackPassive();
    if (!passive) return false;
    if (isMercedesFinalAttackPassive(passive)) {
      if (!skill || skill.type === 'passive') return false;
      if (skill.skipPanel) return false;
      // 有傷害的主動／召喚技可觸發
      const lv = typeof CharacterSkills !== 'undefined'
        ? (CharacterSkills.getLevel?.(id) || 0)
        : 0;
      if (!(lv > 0) && skill.type !== 'active') return false;
      const common = typeof SkillFormula !== 'undefined'
        ? SkillFormula.evalStatCommon(skill.common || {}, Math.max(1, lv || 1))
        : null;
      return (Number(common?.damagePct) || 0) > 0
        || (skill.common?.damage != null && String(skill.common.damage) !== '');
    }
    return FINAL_ATTACK_TRIGGER_IDS.has(id);
  }

  /** 優先最大 HP 的 Boss；無 Boss 時取最大 HP 的一般怪（無命中清單時的後備） */
  function resolveFinalAttackTarget(ctx) {
    const alive = filterChainAvailableMobs(resolveCastMobs(ctx))
      .filter((m) => m && m.hp > 0);
    if (!alive.length) return null;
    const pool = alive.some((m) => m.isBoss)
      ? alive.filter((m) => m.isBoss)
      : alive;
    return pool.reduce((best, mob) => {
      if (!best) return mob;
      const hpA = Math.max(Number(mob.maxHp) || 0, Number(mob.hp) || 0);
      const hpB = Math.max(Number(best.maxHp) || 0, Number(best.hp) || 0);
      return hpA > hpB ? mob : best;
    }, null);
  }

  function pushUniqueMob(list, mob) {
    if (!mob || !list) return list;
    if (!list.includes(mob)) list.push(mob);
    return list;
  }

  /**
   * 終極攻擊類目標池：優先本次技能命中且仍存活的怪；
   * 無命中清單時才退回場上優先目標。
   */
  function resolveFinalAttackTargets(ctx, hitMobs) {
    const fromHits = (Array.isArray(hitMobs) ? hitMobs : [])
      .filter((m) => m && Number(m.hp) > 0);
    if (fromHits.length) return fromHits;
    const one = resolveFinalAttackTarget(ctx);
    return one ? [one] : [];
  }

  /** 英雄終極攻擊：在命中池中挑一隻（優先最大 HP Boss），再以 prop% 判定一次 */
  function pickHeroFinalAttackTarget(ctx, hitMobs) {
    const pool = resolveFinalAttackTargets(ctx, hitMobs);
    if (!pool.length) return null;
    const prefer = pool.some((m) => m.isBoss)
      ? pool.filter((m) => m.isBoss)
      : pool;
    return prefer.reduce((best, mob) => {
      if (!best) return mob;
      const hpA = Math.max(Number(mob.maxHp) || 0, Number(mob.hp) || 0);
      const hpB = Math.max(Number(best.maxHp) || 0, Number(best.hp) || 0);
      return hpA > hpB ? mob : best;
    }, null);
  }

  /** 終極攻擊／進階終極攻擊追擊：單目標 prop%（武器門檻＋觸發技白名單） */
  function tryFinalAttack(ctx, triggerSkillId, hitMobs) {
    if (typeof SkillFormula === 'undefined') return [];
    if (!skillTriggersFinalAttack(triggerSkillId)) return [];
    if (!isFinalAttackWeaponEquipped()) return [];
    const passive = resolveFinalAttackPassive();
    if (!passive?.skill || !(passive.level > 0)) return [];

    const { skill, level } = passive;
    const st = SkillFormula.evalStatCommon(skill.common, level);
    const en = (typeof SkillModifiers !== 'undefined' && SkillModifiers.getSkillEnhance)
      ? SkillModifiers.getSkillEnhance(skill.id)
      : { damR: 0, prop: 0, attackCount: 0 };
    const prop = (Number(st.prop) || 0) + (Number(en.prop) || 0);
    if (!(prop > 0)) return [];
    if (Math.random() * 100 >= prop) return [];

    const mob = pickHeroFinalAttackTarget(ctx, hitMobs);
    if (!mob || !(Number(mob.hp) > 0)) return [];

    const attackCount = Math.max(1, (Number(st.attackCount) || 1) + (Number(en.attackCount) || 0));
    const damagePct = (Number(st.damagePct) || 0) * (1 + (Number(en.damR) || 0) / 100);
    applyHitsToMob(mob, {
      damagePct,
      attackCount,
      fxHit: skill.fx?.hit,
      multiHit: attackCount > 1,
      showMobDamage: (m, dmg, crit, dmgOpts) => {
        showFinalAttackDamage(ctx, m, dmg, crit, dmgOpts);
      },
      onDamage: ctx.onDamage,
      flashHit: ctx.flashHit,
      flashDie: ctx.flashDie,
      isolateStack: true,
      skillId: skill?.id,
      skipNightLordExtras: true,
    });
    return mob.hp <= 0 ? [mob] : [];
  }

  function nlShootFramesFrom(skill) {
    const layers = skill?.fx?.shootobj?.layers;
    if (Array.isArray(layers) && layers[0]?.frames?.length) return layers[0].frames;
    if (Array.isArray(skill?.fx?.hit) && skill.fx.hit.length) return null;
    return null;
  }

  function dealNlExtraHits(ctx, skill, damagePct, attackCount, targets, opts = {}) {
    const kills = [];
    const hitMobs = [];
    const list = (Array.isArray(targets) ? targets : []).filter((m) => m && Number(m.hp) > 0);
    if (!list.length || !(Number(damagePct) > 0)) return { kills, hitMobs };
    const n = Math.max(1, Number(attackCount) || 1);
    const isolateStack = opts.isolateStack !== false;
    const stackSkillId = opts.stackKey || skill?.id;
    const fxHit = Object.prototype.hasOwnProperty.call(opts, 'fxHit') ? opts.fxHit : skill?.fx?.hit;
    list.forEach((mob) => {
      const hit = applyHitsToMob(mob, {
        damagePct,
        attackCount: n,
        fxHit,
        multiHit: n > 1,
        showMobDamage: ctx.showMobDamage,
        onDamage: ctx.onDamage,
        flashHit: ctx.flashHit,
        flashDie: ctx.flashDie,
        isolateStack,
        skillId: stackSkillId,
        ctx,
        skipNightLordExtras: true,
      });
      if (hit) hitMobs.push(mob);
      if (mob.hp <= 0) kills.push(mob);
    });
    return { kills, hitMobs };
  }

  function nlMarkStarFrames() {
    if (typeof ThrowingStarBullet !== 'undefined' && typeof ThrowingStarBullet.framesFor === 'function') {
      const itemId = (typeof ThrowingStarStore !== 'undefined'
        && typeof ThrowingStarStore.frontItemId === 'function')
        ? ThrowingStarStore.frontItemId()
        : '';
      const frames = ThrowingStarBullet.framesFor(itemId);
      if (frames?.length) return frames;
    }
    return nlShootFramesFrom(typeof SkillCatalog !== 'undefined'
      ? SkillCatalog.getSkill('4101013')
      : null);
  }

  /**
   * 刻印飛鏢鎖敵：與天使破壞者靈魂探索者相同（BOSS／低血優先、預留 HP 分散、死亡改鎖）。
   * 引爆源怪優先排除，改追周圍活怪。
   */
  function pickNlMarkStarTargets(ctx, count, pending, estDmg, excludeMob) {
    const n = Math.max(1, Math.floor(Number(count) || 1));
    const alive = abSeekerAlivePool(ctx);
    if (!alive.length) return [];
    const excludeUid = excludeMob && excludeMob.uid != null ? String(excludeMob.uid) : '';
    const others = excludeUid
      ? alive.filter((m) => String(m.uid) !== excludeUid)
      : alive;
    const pool = rankAbSeekerPool(others.length ? others : alive);
    if (!pool.length) return [];
    const est = Math.max(1, Number(estDmg) || 1);
    const out = [];
    for (let i = 0; i < n; i += 1) {
      let pick = pool.find((m) => abSeekerPendingHp(m, pending) > 0);
      if (!pick) pick = pool[0];
      out.push(pick);
      abSeekerReserve(pending, pick, est);
    }
    return out;
  }

  /** 刻印飛鏢：裝備飛鏢圖 + 探求者鎖敵／追蹤 */
  function playNlMarkArcVolley(ctx, frames, starCount, damagePct, onHit, onDone, excludeMob) {
    const n = Math.max(1, Math.floor(Number(starCount) || 1));
    const hpPending = new Map();
    const estHit = estimateAbSeekerHitDmg(Number(damagePct) || 0, 1);
    const list = pickNlMarkStarTargets(ctx, n, hpPending, estHit, excludeMob);
    if (!list.length) {
      if (typeof onDone === 'function') onDone();
      return;
    }
    const retargetInFlight = (fromMob) => {
      abSeekerReleaseReserve(hpPending, fromMob, estHit);
      return pickAbSeekerNextTarget(ctx, fromMob, hpPending, estHit);
    };
    if (typeof SkillEffectPlayer === 'undefined'
      || typeof SkillEffectPlayer.playHomingVolley !== 'function'
      || !frames?.length) {
      list.forEach((mob) => {
        if (typeof onHit === 'function') onHit(mob);
      });
      if (typeof onDone === 'function') onDone();
      return;
    }
    SkillEffectPlayer.playHomingVolley({
      fieldEl: ctx.fieldEl || document.getElementById('idleHuntField'),
      playerEl: ctx.playerEl,
      mobs: list,
      frames,
      anchorAt: 'player',
      facingRight: ctxFacingRight(ctx),
      startOffset: [-48, -36],
      staggerMs: 28,
      holdMs: 50,
      speedPxPerMs: 0.78,
      spriteScale: 1,
      centerOrigin: false,
      kickOutPx: 0,
      retarget: retargetInFlight,
      onMiss: (mob) => abSeekerReleaseReserve(hpPending, mob, estHit),
      onHit: (mob) => {
        abSeekerReleaseReserve(hpPending, mob, estHit);
        if (typeof onHit === 'function') onHit(mob);
      },
      onDone,
    });
  }

  /** 消耗刻印並射出飛鏢（再攻擊／死亡共用） */
  function fireNlMarkBurst(ctx, sourceSkillId, fromMob, killSink) {
    const kills = Array.isArray(killSink) ? killSink : [];
    const spec = typeof SkillMobStatus !== 'undefined'
      ? SkillMobStatus.resolveNlMarkBurstSpec?.(sourceSkillId)
      : null;
    if (!spec || !(spec.damagePct > 0)) return kills;
    const frames = nlMarkStarFrames();
    const starCount = Math.max(1, Number(spec.bulletCount) || 1);
    const applyBurst = (mob) => {
      if (!mob || !(Number(mob.hp) > 0)) return;
      const res = dealNlExtraHits(ctx, spec.burstSkill, spec.damagePct, spec.attackCount, [mob]);
      res.kills.forEach((m) => pushUniqueMob(kills, m));
    };
    const notify = () => {
      if (kills.length && typeof ctx.onProjectileResolve === 'function') {
        ctx.onProjectileResolve(kills);
      }
    };
    if (frames?.length) {
      playNlMarkArcVolley(ctx, frames, starCount, spec.damagePct, applyBurst, notify, fromMob);
    } else {
      const hpPending = new Map();
      const estHit = estimateAbSeekerHitDmg(spec.damagePct, 1);
      const pool = pickNlMarkStarTargets(ctx, starCount, hpPending, estHit, fromMob);
      for (let i = 0; i < starCount; i += 1) {
        applyBurst(pool[i % Math.max(1, pool.length)]);
      }
      notify();
    }
    return kills;
  }

  /** 怪物死亡時若仍有刻印 → 立刻飛出飛鏢（DoT／非 NL followup 擊殺） */
  function tryNlMarkBurstOnDeath(ctx, mob) {
    if (!ctx || !mob || !isNightLordJob()) return [];
    if (ctx.skipNightLordExtras) return [];
    if (typeof SkillMobStatus === 'undefined' || !SkillMobStatus.hasNlMark?.(mob)) return [];
    const src = SkillMobStatus.consumeNlMark(mob);
    if (!src) return [];
    return fireNlMarkBurst(ctx, src, mob, []);
  }

  function playNlStarVolley(ctx, frames, targets, onHit, onDone) {
    if (typeof SkillEffectPlayer === 'undefined'
      || typeof SkillEffectPlayer.playShootObj !== 'function'
      || !frames?.length) {
      (targets || []).forEach((mob) => { if (typeof onHit === 'function') onHit(mob); });
      if (typeof onDone === 'function') onDone();
      return;
    }
    SkillEffectPlayer.playShootObj({
      fieldEl: ctx.fieldEl || document.getElementById('idleHuntField'),
      playerEl: ctx.playerEl,
      mobs: targets,
      frames,
      startOffset: [-80, -60],
      pierce: true,
      maxTargets: Math.max(1, (targets || []).length),
      facingRight: ctxFacingRight(ctx),
      onHit,
      onDone,
    });
  }

  /** 爆破鏢爆炸、刻印星星、影分身額外段、挑釁追擊、飛閃起爆符 */
  function fireThrowBlastingExtras(ctx, hitMobs, kills) {
    const delayMs = scaleGameDelayMs(540);
    const lvParent = Math.max(
      1,
      (typeof CharacterSkills !== 'undefined' ? CharacterSkills.getLevel?.(THROW_BLASTING_ID) : 0) || 1,
    );
    let playedFx = false;
    THROW_BLASTING_EXTRA_IDS.forEach((eid) => {
      const extra = typeof SkillCatalog !== 'undefined' ? SkillCatalog.getSkill(eid) : null;
      if (!extra) return;
      const lv = Math.max(
        1,
        (typeof CharacterSkills !== 'undefined' ? CharacterSkills.getLevel?.(eid) : 0) || lvParent,
      );
      const common = evalSkill(extra, lv);
      if (!common || !(Number(common.damagePct) > 0)) return;
      const atkCommon = combatCommonFor(extra, common);
      const run = () => {
        const splash = resolveSkillTargets(ctx, eid, Math.max(1, atkCommon.mobCount || 6));
        const pool = splash.length
          ? splash
          : (Array.isArray(hitMobs) ? hitMobs : []).filter((m) => m && Number(m.hp) > 0);
        const boomMob = pool[0] || (Array.isArray(hitMobs) ? hitMobs[0] : null);
        if (!playedFx && extra.fx?.effect?.length
          && boomMob
          && typeof SkillEffectPlayer !== 'undefined'
          && typeof SkillEffectPlayer.playAtField === 'function') {
          const fieldEl = ctx.fieldEl || document.getElementById('idleHuntField');
          const pt = typeof SkillEffectPlayer.fieldPointFromMob === 'function'
            ? SkillEffectPlayer.fieldPointFromMob(fieldEl, boomMob)
            : null;
          if (pt && Number.isFinite(pt.x) && Number.isFinite(pt.y)) {
            playedFx = true;
            SkillEffectPlayer.playAtField({
              fieldEl,
              frames: extra.fx.effect,
              x: pt.x,
              y: pt.y,
              zIndex: 56,
              forcePlay: true,
              playerEl: ctx.playerEl,
              mirrorX: ctxFacingRight(ctx),
            });
          }
        }
        const res = dealNlExtraHits(ctx, extra, atkCommon.damagePct, atkCommon.attackCount, pool);
        res.kills.forEach((m) => pushUniqueMob(kills, m));
        if (res.kills.length && typeof ctx.onProjectileResolve === 'function') {
          ctx.onProjectileResolve(res.kills);
        }
      };
      if (delayMs > 30) setTimeout(run, delayMs);
      else run();
    });
  }

  function tryThrowBlasting(ctx, trigger, hitMobs, kills) {
    if (!THROW_BLASTING_TRIGGER_IDS.has(trigger)) return;
    const lv = (typeof CharacterSkills !== 'undefined'
      ? CharacterSkills.getLevel?.(THROW_BLASTING_ID)
      : 0) || 0;
    if (!(lv > 0)) return;
    const blasting = typeof SkillCatalog !== 'undefined'
      ? SkillCatalog.getSkill(THROW_BLASTING_ID)
      : null;
    if (!blasting) return;
    const active = typeof SkillModifiers !== 'undefined'
      && SkillModifiers.hasBuff?.(THROW_BLASTING_ID);
    let fire = false;
    if (active) {
      fire = true;
    } else if (typeof SkillFormula !== 'undefined' && SkillFormula.evalStatCommon) {
      const st = SkillFormula.evalStatCommon(blasting.common, lv);
      const intervalMs = scaleGameDelayMs(Math.max(1, Number(st.u) || 10) * 1000);
      const t = nowMs();
      if (!nlBlastingPassiveAt) nlBlastingPassiveAt = t;
      if (t - nlBlastingPassiveAt >= intervalMs) {
        fire = true;
        nlBlastingPassiveAt = t;
      }
    }
    if (fire) fireThrowBlastingExtras(ctx, hitMobs, kills);
  }

  const ELEMENTAL_GHOST_ID = '400031007';
  const ELEMENTAL_BLOSSOM_ID = '400031011';
  const SYLVIDIA_ID = '400031017';
  const SYLVIDIA_AFTER_ID = '400031018';
  const IRKALLA_ID = '400031024';
  const ISHTAR_RING_ID = '23121000';
  const MERCEDES_GHOST_SKIP_IDS = new Set([
    ELEMENTAL_GHOST_ID, '400031008', '400031009', ELEMENTAL_BLOSSOM_ID,
    SYLVIDIA_ID, SYLVIDIA_AFTER_ID, '400031045',
  ]);
  let mercedesGhostBlossomAt = 0;

  function rollPercent(p) {
    const n = Number(p) || 0;
    if (!(n > 0)) return false;
    if (n >= 100) return true;
    return Math.random() * 100 < n;
  }

  function dealMercedesExtraHits(ctx, skill, damagePct, attackCount, mobs) {
    const kills = [];
    const list = (Array.isArray(mobs) ? mobs : []).filter((m) => m && Number(m.hp) > 0);
    if (!skill || !list.length || !(Number(damagePct) > 0)) return { kills };
    const common = {
      damagePct: Number(damagePct) || 0,
      attackCount: Math.max(1, Math.floor(Number(attackCount) || 1)),
      mobCount: list.length,
    };
    list.forEach((mob) => {
      const hit = dealHitsOnMob(skill, common, mob, {
        ...ctx,
        skipMercedesExtras: true,
        skipNightLordExtras: true,
      }, {
        isolateStack: true,
        segmentGapSec: null,
        fxHit: skill.fx?.hit || null,
      });
      if (hit && Number(mob.hp) <= 0) pushUniqueMob(kills, mob);
    });
    return { kills };
  }

  function listElementalGhostClones(ctx) {
    if (typeof Paperdoll === 'undefined' || typeof Paperdoll.listHuntClones !== 'function') {
      return [];
    }
    return Paperdoll.listHuntClones(ctx?.playerEl || ctx?.fieldEl)
      .filter((el) => el.classList.contains('paperdoll-stage--elemental-ghost')
        && !el.classList.contains('is-hidden'));
  }

  /** 分身重做同一招：特效＋飛箭／投擲物，傷害另由殘像 FD 結算 */
  function playGhostCloneSkillVisual(skill, cloneEl, ctx) {
    if (!skill || !cloneEl) return;
    if (ctx?.quietFx || (typeof document !== 'undefined' && document.hidden)) return;
    if (typeof SkillEffectPlayer === 'undefined') return;
    const fx = resolveSkillFx(skill, skill.fx) || skill.fx || {};
    const fieldEl = ctx.fieldEl || document.getElementById('idleHuntField');
    if (!fieldEl) return;
    const facingRight = ctxFacingRight(ctx);
    const fxClass = 'idle-skill-fx-stage idle-skill-fx-stage--elemental-ghost';
    const maxTargets = Math.max(1, Number(skill.common?.mobCount) || 1);
    const targets = liveMobTargets(resolveCastMobs(ctx), maxTargets, ctx, skill.id);
    if (String(skill.castFxAt) === 'targetHead'
      && typeof SkillEffectPlayer.playOnMobHead === 'function') {
      const mob = targets[0];
      if (mob) {
        if (fx.effect?.length) {
          SkillEffectPlayer.playOnMobHead(mob, fx.effect, {
            fieldEl,
            forcePlay: true,
            mirrorX: facingRight,
          });
        }
        if (fx.effect0?.length) {
          SkillEffectPlayer.playOnMobHead(mob, fx.effect0, {
            fieldEl,
            forcePlay: true,
            mirrorX: facingRight,
          });
        }
      }
    } else {
      const pose = fx.effect?.length
        ? fx.effect
        : (fx.keydown?.length ? fx.keydown : (fx.prepare || null));
      if (pose?.length) {
        SkillEffectPlayer.playOnPlayer(pose, {
          playerEl: cloneEl,
          fieldEl,
          className: fxClass,
          mirrorX: facingRight,
          forcePlay: true,
        });
      }
      if (fx.effect0?.length) {
        SkillEffectPlayer.playOnPlayer(fx.effect0, {
          playerEl: cloneEl,
          fieldEl,
          className: fxClass,
          mirrorX: facingRight,
          forcePlay: true,
        });
      }
    }
    const ballPlan = (typeof SkillBallCast !== 'undefined' && SkillBallCast.isBallCastSkill?.(skill, fx))
      ? (skill.ballCast || SkillBallCast.buildPlan(skill, fx))
      : null;
    if (ballPlan && fx.ball && typeof SkillBallCast.playBallCast === 'function') {
      SkillBallCast.playBallCast({
        fieldEl,
        playerEl: cloneEl,
        fx: { ball: fx.ball, hit: fx.hit },
        plan: { ...ballPlan, launchMs: 0 },
        skill,
        level: 1,
        mobs: targets,
        getMobs: () => targets.filter((m) => m && Number(m.hp) > 0),
        maxTargets,
        facingRight,
        omitPlayerEffect: true,
        visualOnly: true,
        onDone: () => {},
      });
      return;
    }
    const shootFrames = shootObjFrames(fx);
    if (shootFrames.length && typeof SkillEffectPlayer.playShootObj === 'function') {
      SkillEffectPlayer.playShootObj({
        fieldEl,
        playerEl: cloneEl,
        mobs: targets,
        frames: shootFrames,
        startOffset: fx.shootobj?.start || [-80, -60],
        pierce: !!fx.shootobj?.pierce,
        maxTargets: Math.max(1, targets.length),
        moveList: fx.shootobj?.moveList || null,
        bodyWH: fx.shootobj?.bodyWH || [300, 300],
        facingRight,
        onHit: () => {},
        onDone: () => {},
      });
    }
  }

  function tryMercedesFollowups(ctx, triggerSkillId, hitMobs) {
    const kills = [];
    if (!isMercedesJob()) return kills;
    if (ctx?.skipMercedesExtras) return kills;
    const trigger = String(triggerSkillId || '');
    if (!trigger || MERCEDES_GHOST_SKIP_IDS.has(trigger)) return kills;
    if (typeof SkillModifiers === 'undefined' || !SkillModifiers.hasBuff?.(ELEMENTAL_GHOST_ID)) {
      return kills;
    }
    const ghost = typeof SkillCatalog !== 'undefined'
      ? SkillCatalog.getSkill(ELEMENTAL_GHOST_ID)
      : null;
    const lv = Math.max(
      1,
      (typeof CharacterSkills !== 'undefined' ? CharacterSkills.getLevel?.(ELEMENTAL_GHOST_ID) : 0) || 1,
    );
    const st = ghost && typeof SkillFormula !== 'undefined'
      ? SkillFormula.evalStatCommon(ghost.common, lv)
      : null;
    if (!st) return kills;

    const triggerSkill = typeof SkillCatalog !== 'undefined'
      ? SkillCatalog.getSkill(trigger)
      : null;
    const liveHits = (Array.isArray(hitMobs) ? hitMobs : [])
      .filter((m) => m && Number(m.hp) > 0);
    const trigLv = Math.max(
      1,
      (typeof CharacterSkills !== 'undefined' ? CharacterSkills.getLevel?.(trigger) : 0) || 1,
    );
    const trigCommon = triggerSkill ? evalSkill(triggerSkill, trigLv) : null;
    const trigAtk = trigCommon ? combatCommonFor(triggerSkill, trigCommon) : null;
    const specialFd = trigger === ISHTAR_RING_ID || trigger === IRKALLA_ID;
    const fd = specialFd ? (Number(st.q) || 0) : (Number(st.xVal) || 0);
    const chance0 = Number(st.z) || 100;
    const step = Number(st.u) || 10;
    const delays = [300, 600, 900];

    if (triggerSkill && trigAtk && Number(trigAtk.damagePct) > 0 && fd > 0) {
      const clones = listElementalGhostClones(ctx);
      delays.forEach((delay, i) => {
        if (!rollPercent(chance0 - step * i)) return;
        const wait = scaleGameDelayMs(delay);
        const run = () => {
          if (ctx?.skipMercedesExtras) return;
          const clone = clones[i] || clones[0] || null;
          if (clone) playGhostCloneSkillVisual(triggerSkill, clone, ctx);
          const pool = liveMobTargets(
            resolveCastMobs(ctx),
            Math.max(1, trigAtk.mobCount || liveHits.length || 1),
            ctx,
            trigger,
          );
          const list = pool.length ? pool : liveHits;
          const res = dealMercedesExtraHits(
            ctx,
            triggerSkill,
            (Number(trigAtk.damagePct) || 0) * (fd / 100),
            trigAtk.attackCount,
            list,
          );
          res.kills.forEach((m) => pushUniqueMob(kills, m));
          if (res.kills.length && typeof ctx.onProjectileResolve === 'function') {
            ctx.onProjectileResolve(res.kills);
          }
        };
        if (wait > 30) setTimeout(run, wait);
        else run();
      });
    }

    const blossomGap = scaleGameDelayMs(Math.max(1000, (Number(st.s2) || 10) * 1000));
    const now = nowMs();
    if (now - mercedesGhostBlossomAt >= blossomGap) {
      mercedesGhostBlossomAt = now;
      const blossom = typeof SkillCatalog !== 'undefined'
        ? SkillCatalog.getSkill(ELEMENTAL_BLOSSOM_ID)
        : null;
      const bCommon = blossom ? evalSkill(blossom, lv) : null;
      const bAtk = bCommon ? combatCommonFor(blossom, bCommon) : null;
      if (blossom && bAtk && Number(bAtk.damagePct) > 0) {
        const pool = liveMobTargets(
          resolveCastMobs(ctx),
          Math.max(1, bAtk.mobCount || 10),
          ctx,
          ELEMENTAL_BLOSSOM_ID,
        );
        if (blossom.fx?.effect?.length && typeof SkillEffectPlayer !== 'undefined') {
          const fieldEl = ctx.fieldEl || document.getElementById('idleHuntField');
          const tree = (blossom.fx.effect || []).filter((f, i) => !(
            i === 0
            && Number(f?.origin?.[0]) === 0
            && Number(f?.origin?.[1]) === 0
          ));
          const pt = (typeof SkillBuffRuntime !== 'undefined' && SkillBuffRuntime.summonFieldPoint)
            ? SkillBuffRuntime.summonFieldPoint(fieldEl, ctx.playerEl, { slot: 'player-feet' }, ctx)
            : (SkillEffectPlayer.fieldPointFromPlayer
              ? SkillEffectPlayer.fieldPointFromPlayer(fieldEl, ctx.playerEl, [0, 0], true)
              : { x: 220, y: 280 });
          if (fieldEl && tree.length) {
            SkillEffectPlayer.playAtField({
              fieldEl,
              frames: tree,
              x: pt.x,
              y: pt.y,
              className: 'idle-skill-fx-stage idle-skill-fx-stage--elemental-ghost idle-skill-fx-stage--elemental-blossom',
              zIndex: 32,
              behind: true,
              forcePlay: true,
              playerEl: ctx.playerEl,
            });
          }
        }
        const res = dealMercedesExtraHits(ctx, blossom, bAtk.damagePct, bAtk.attackCount, pool);
        res.kills.forEach((m) => pushUniqueMob(kills, m));
        if (res.kills.length && typeof ctx.onProjectileResolve === 'function') {
          ctx.onProjectileResolve(res.kills);
        }
      }
    }
    return kills;
  }

  function trySylvidiaCast(skill, skillForFx, formCommon, fx, ctx, form, picked, finishAfterDamage, opts = {}) {
    if (String(skill?.id) !== SYLVIDIA_ID) return null;
    const st = (typeof SkillFormula !== 'undefined' && SkillFormula.evalStatCommon)
      ? SkillFormula.evalStatCommon(skill.common, picked.level || 1)
      : {};
    const chargeWaves = Math.max(1, Math.floor(Number(st.u) || 9));
    const chargePer = Math.max(1, Math.floor(Number(st.attackCount) || 13));
    const chargePct = Number(formCommon.damagePct) || Number(st.damagePct) || 0;
    const afterSkill = typeof SkillCatalog !== 'undefined'
      ? SkillCatalog.getSkill(SYLVIDIA_AFTER_ID)
      : null;
    const afterSt = afterSkill && typeof SkillFormula !== 'undefined'
      ? SkillFormula.evalStatCommon(afterSkill.common, picked.level || 1)
      : {};
    const afterWaves = Math.max(1, Math.floor(Number(st.s2) || 14));
    const afterPer = Math.max(1, Math.floor(Number(afterSt.attackCount) || Number(st.s) || 4));
    const afterPct = Number(afterSt.damagePct) || Number(st.y) || 0;
    const fieldEl = ctx.fieldEl || document.getElementById('idleHuntField');
    const kills = [];
    const hitMobs = [];
    const asyncId = registerAsyncCast();

    const playOnPlayer = (frames) => {
      if (!frames?.length || typeof SkillEffectPlayer === 'undefined') return;
      SkillEffectPlayer.playOnPlayer(frames, {
        playerEl: ctx.playerEl,
        fieldEl,
        className: 'idle-skill-fx-stage idle-skill-fx-stage--cast',
        zIndex: 58,
      });
    };
    const playAtPlayer = (frames, zIndex = 46, behind = false) => {
      if (!frames?.length || typeof SkillEffectPlayer === 'undefined' || !fieldEl) return;
      const pt = (typeof SkillBuffRuntime !== 'undefined' && SkillBuffRuntime.summonFieldPoint)
        ? SkillBuffRuntime.summonFieldPoint(fieldEl, ctx.playerEl, { slot: 'player-feet' }, ctx)
        : { x: 200, y: 280 };
      SkillEffectPlayer.playAtField({
        fieldEl,
        frames,
        x: pt.x,
        y: pt.y,
        className: 'idle-skill-fx-stage idle-skill-fx-stage--cast idle-skill-fx-stage--sylvidia',
        zIndex,
        behind,
        forcePlay: true,
        playerEl: ctx.playerEl,
        mirrorX: ctxFacingRight(ctx),
      });
    };
    const playOverlay = (frames, zIndex = 18) => {
      if (!frames?.length || typeof SkillEffectPlayer === 'undefined' || !fieldEl) return;
      const mid = {
        x: Math.round((fieldEl.clientWidth || 800) * 0.5),
        y: Math.round((fieldEl.clientHeight || 500) * 0.5),
      };
      SkillEffectPlayer.playAtField({
        fieldEl,
        frames,
        x: mid.x,
        y: mid.y,
        className: 'idle-skill-fx-stage idle-skill-fx-stage--sylvidia-screen',
        zIndex,
        behind: true,
        forcePlay: true,
      });
    };

    const layers = fx.layers || {};
    const chargeSpecial = fx.special?.frames || (Array.isArray(fx.special) ? fx.special : layers.special) || [];
    // WZ multiAttack 第一下 attackTime=0、之後 +30；這是相對攻擊起點，不是按下技能。
    // 起點對齊 common.q＝600（與 special1／special2 入場空幀 delay 相同）：獨角獸先飛，飛到再出 9 下。
    const chargeLeadMs = Math.max(0, Number(st.q) || 0);
    const chargeStarts = illusionWaveStarts(
      readWzMultiAttackTimes(SYLVIDIA_ID),
      chargeWaves,
      0,
      30,
    ).map((t) => t + chargeLeadMs);
    const firstUnicornMs = (() => {
      const waitFrame = (fx.special1 || layers.special1 || [])[0];
      const leadWait = (Number(waitFrame?.origin?.[0]) === 0 && Number(waitFrame?.origin?.[1]) === 0)
        ? (Number(waitFrame?.delay) || 0)
        : 0;
      const flyMs = (typeof SkillEffectPlayer !== 'undefined'
        && typeof SkillEffectPlayer.framesDurationMs === 'function')
        ? SkillEffectPlayer.framesDurationMs(chargeSpecial)
        : chargeSpecial.reduce((sum, f) => sum + (Number(f?.delay) || 60), 0);
      const lastChargeMs = chargeStarts[chargeStarts.length - 1] || chargeLeadMs;
      return Math.max(leadWait, flyMs, lastChargeMs, chargeLeadMs);
    })();
    const afterGapMs = 120;
    const afterStarts = illusionWaveStarts(
      readWzMultiAttackTimes(SYLVIDIA_AFTER_ID),
      afterWaves,
      firstUnicornMs,
      afterGapMs,
    );
    const afterLayers = afterSkill?.fx?.layers || {};
    const afterFront = afterLayers['special/front'] || [];
    const afterMiddle = afterLayers['special/middle'] || [];
    const afterBack = afterLayers['special/back'] || [];
    playOnPlayer(fx.effect);
    playAtPlayer(fx.special?.frames || (Array.isArray(fx.special) ? fx.special : layers.special), 52);
    playAtPlayer(fx.special1 || layers.special1, 51);
    playAtPlayer(fx.special2 || layers.special2, 50);
    playOverlay(fx.screen || layers.screen, 16);
    playOverlay(fx.screen0 || layers.screen0, 17);

    const afterTiltRad = (index, total) => {
      const maxTilt = 0.7;
      if (total <= 1) return (Math.random() * 2 - 1) * maxTilt;
      const base = -maxTilt + (maxTilt * 2) * (index / Math.max(1, total - 1));
      return base + (Math.random() * 2 - 1) * 0.08;
    };
    const playAfterBeam = (waveIdx) => {
      if (!fieldEl || typeof SkillEffectPlayer === 'undefined') return;
      if (!afterFront.length && !afterMiddle.length && !afterBack.length) return;
      const afterMobCount = Math.max(1, Number(afterSt.mobCount || st.w) || 8);
      const targets = resolveSkillTargets(ctx, SYLVIDIA_AFTER_ID, afterMobCount);
      const throughMob = (targets || []).find((m) => m && m.isBoss && Number(m.hp) > 0)
        || (targets || []).find((m) => m && Number(m.hp) > 0)
        || null;
      const mobPt = throughMob && typeof SkillEffectPlayer.fieldPointFromMob === 'function'
        ? SkillEffectPlayer.fieldPointFromMob(fieldEl, throughMob)
        : null;
      if (!mobPt || !Number.isFinite(mobPt.x) || !Number.isFinite(mobPt.y)) return;
      const facingRight = ctxFacingRight(ctx);
      const rot = (facingRight ? 0 : Math.PI) + afterTiltRad(waveIdx, afterWaves);
      const reach = 220;
      const ux = Math.cos(rot);
      const uy = Math.sin(rot);
      const from = { x: mobPt.x - ux * reach, y: mobPt.y - uy * reach };
      const to = { x: mobPt.x + ux * reach, y: mobPt.y + uy * reach };
      if (typeof SkillEffectPlayer.playPierceStreak === 'function') {
        SkillEffectPlayer.playPierceStreak({
          fieldEl,
          from,
          to,
          front: afterFront,
          middle: afterMiddle,
          back: afterBack,
          forcePlay: true,
        });
      }
    };

    const collect = (result) => {
      (result?.kills || []).forEach((m) => pushUniqueMob(kills, m));
      (result?.hitMobs || []).forEach((m) => pushUniqueMob(hitMobs, m));
    };
    const dealAt = (startMs, perHit, pct, fxHit, useSkill, isLast) => {
      setTimeout(() => {
        if (!isAsyncCastLive(asyncId)) return;
        collect(dealSkillDamage(useSkill, {
          ...formCommon,
          attackCount: perHit,
          damagePct: pct,
          mobCount: Number(useSkill === afterSkill ? (afterSt.mobCount || st.w) : st.mobCount) || formCommon.mobCount,
        }, {
          ...ctx,
          skipMercedesExtras: true,
        }, {
          isolateStack: true,
          segmentGapSec: null,
          normalMobBonusPct: opts.normalMobBonusPct,
          skillForFx: useSkill,
          forceCritTail: isLast ? (form.forceCritTail || 0) : 0,
          fxHit,
        }));
        if (isLast) {
          releaseAsyncCast(asyncId);
          finishAfterDamage(kills, hitMobs);
          if (typeof ctx.onProjectileResolve === 'function') ctx.onProjectileResolve(kills);
        }
      }, Math.max(0, startMs));
    };

    chargeStarts.forEach((startMs) => {
      dealAt(startMs, chargePer, chargePct, fx.hit, skill, false);
    });
    afterStarts.forEach((startMs, w) => {
      setTimeout(() => {
        if (!isAsyncCastLive(asyncId)) return;
        playAfterBeam(w);
      }, Math.max(0, startMs));
      dealAt(
        startMs + 60,
        afterPer,
        afterPct,
        afterSkill?.fx?.hit || fx.hit,
        afterSkill || skill,
        w === afterStarts.length - 1,
      );
    });
    if (opts.mergeLink && picked) mergeLinkFollowers(picked, ctx, []);
    return { kills: [], deferredKills: true };
  }

  function tryNightLordFollowups(ctx, triggerSkillId, hitMobs) {
    const kills = [];
    if (!isNightLordJob()) return kills;
    if (ctx?.skipNightLordExtras) return kills;
    const trigger = String(triggerSkillId || '');
    if (!trigger) return kills;
    const triggerSkill = typeof SkillCatalog !== 'undefined'
      ? SkillCatalog.getSkill(trigger)
      : null;
    const liveHits = (Array.isArray(hitMobs) ? hitMobs : [])
      .filter((m) => m && Number(m.hp) > 0);

    const extraList = Array.isArray(triggerSkill?.extraSkill) ? triggerSkill.extraSkill : [];
    extraList.forEach((entry) => {
      const extraId = String(entry?.skill || '');
      if (!extraId) return;
      const extra = SkillCatalog.getSkill(extraId);
      if (!extra) return;
      const lv = Math.max(
        1,
        (typeof CharacterSkills !== 'undefined' ? CharacterSkills.getLevel?.(trigger) : 0) || 1,
      );
      const common = evalSkill(extra, lv);
      if (!common || !(Number(common.damagePct) > 0)) return;
      const delayMs = scaleGameDelayMs(Number(entry.delay) || 180);
      const atkCommon = combatCommonFor(extra, common);
      const run = () => {
        const splash = resolveSkillTargets(ctx, extraId, Math.max(1, atkCommon.mobCount || 6));
        const pool = splash.length ? splash : liveHits;
        const boomMob = pool[0] || liveHits[0];
        if (extra.fx?.effect?.length
          && boomMob
          && typeof SkillEffectPlayer !== 'undefined'
          && typeof SkillEffectPlayer.playAtField === 'function') {
          const fieldEl = ctx.fieldEl || document.getElementById('idleHuntField');
          const pt = typeof SkillEffectPlayer.fieldPointFromMob === 'function'
            ? SkillEffectPlayer.fieldPointFromMob(fieldEl, boomMob)
            : null;
          if (pt && Number.isFinite(pt.x) && Number.isFinite(pt.y)) {
            SkillEffectPlayer.playAtField({
              fieldEl,
              frames: extra.fx.effect,
              x: pt.x,
              y: pt.y,
              zIndex: 56,
              forcePlay: true,
            });
          }
        }
        const res = dealNlExtraHits(ctx, extra, atkCommon.damagePct, atkCommon.attackCount, pool);
        res.kills.forEach((m) => pushUniqueMob(kills, m));
        if (res.kills.length && typeof ctx.onProjectileResolve === 'function') {
          ctx.onProjectileResolve(res.kills);
        }
      };
      if (delayMs > 30) setTimeout(run, delayMs);
      else run();
    });

    if (typeof SkillMobStatus !== 'undefined') {
      // 再攻擊（活）與擊殺（死）都會引爆刻印；勿只看 liveHits
      const allHits = Array.isArray(hitMobs) ? hitMobs : [];
      const burstMobs = [];
      allHits.forEach((mob) => {
        if (!mob || !SkillMobStatus.hasNlMark?.(mob)) return;
        const src = SkillMobStatus.consumeNlMark(mob);
        if (src) burstMobs.push({ mob, src });
      });
      burstMobs.forEach((row) => {
        fireNlMarkBurst(ctx, row.src, row.mob, kills);
      });
      liveHits.forEach((mob) => {
        SkillMobStatus.tryApplyNlMarkOnHit?.(mob, trigger);
      });
    }

    const partnerR = (typeof SkillModifiers !== 'undefined'
      && typeof SkillModifiers.getShadowPartnerRate === 'function')
      ? SkillModifiers.getShadowPartnerRate()
      : 0;
    // 影分身：本體技能總傷害 × 係數，只追加 1 段（三／四飛閃在飛鏢結算）
    if (partnerR > 0 && triggerSkill && triggerSkill.type === 'active'
      && !THROW_STAR_SKILL_IDS.has(trigger)) {
      const lv = (typeof CharacterSkills !== 'undefined'
        ? CharacterSkills.getLevel?.(trigger)
        : 0) || 1;
      const common = evalSkill(triggerSkill, lv);
      const atk = common ? combatCommonFor(triggerSkill, common) : null;
      const n = Math.max(1, Number(atk?.attackCount) || 1);
      const pct = (Number(atk?.damagePct) || 0) * n * (partnerR / 100);
      if (pct > 0) {
        const res = dealNlExtraHits(
          ctx,
          triggerSkill,
          pct,
          1,
          liveHits,
          {
            isolateStack: false,
            stackKey: `${trigger}:sp`,
            fxHit: null,
          },
        );
        res.kills.forEach((m) => pushUniqueMob(kills, m));
      }
    }

    if (trigger === '4121017') {
      const SHOWDOWN_ATOM_CD_KEY = '4121020';
      const SHOWDOWN_ATOM_CD_MS = 2000;
      const tNow = nowMs();
      if ((Number(cooldowns[SHOWDOWN_ATOM_CD_KEY]) || 0) > tNow) {
        // 追擊冷卻中：本體仍可打，只跳過飛劍追擊
      } else {
      const mainSkill = typeof SkillCatalog !== 'undefined' ? SkillCatalog.getSkill('4121017') : null;
      const atom = typeof SkillCatalog !== 'undefined' ? SkillCatalog.getSkill('4121020') : null;
      const lv = Math.max(
        1,
        (typeof CharacterSkills !== 'undefined' ? CharacterSkills.getLevel?.('4121017') : 0) || 1,
      );
      if (mainSkill && atom) {
        const mainCommon = evalSkill(mainSkill, lv);
        const atomCommon = evalSkill(atom, lv);
        const mainAtk = mainCommon ? combatCommonFor(mainSkill, mainCommon, { skipHitFold: true }) : null;
        const atomAtk = atomCommon ? combatCommonFor(atom, atomCommon) : null;
        const mainPct = Number(mainAtk?.damagePct) || 0;
        // WZ／atom 的 damage（滿等 24）改為「主傷害 × 該％」：605% × 24% ≈ 145%
        const ratioPct = Number(atomAtk?.damagePct) || 0;
        const extraPct = mainPct > 0 && ratioPct > 0 ? (mainPct * ratioPct) / 100 : 0;
        const swordCount = Math.max(
          1,
          Number(atomAtk?.attackCount) || Number(mainAtk?.attackCount) || 6,
        );
        if (extraPct > 0 && liveHits.length) {
          cooldowns[SHOWDOWN_ATOM_CD_KEY] = tNow + scaleGameDelayMs(SHOWDOWN_ATOM_CD_MS);
          const frames = nlMarkStarFrames();
          const applySword = (mob) => {
            if (!mob || !(Number(mob.hp) > 0)) return;
            const res = dealNlExtraHits(ctx, atom, extraPct, 1, [mob]);
            res.kills.forEach((m) => pushUniqueMob(kills, m));
          };
          const atomLayout = (() => {
            const n = Math.max(1, swordCount);
            const r = n <= 1 ? 120 : 160;
            const out = [];
            for (let i = 0; i < n; i += 1) {
              const deg = -90 + (i * 360) / n;
              const ang = deg * (Math.PI / 180);
              out.push({
                pos: [Math.round(Math.cos(ang) * r), Math.round(Math.sin(ang) * r)],
                rotate: (i * 360) / n,
                enableDelay: 480,
              });
            }
            return out;
          })();
          if (frames?.length
            && typeof SkillEffectPlayer !== 'undefined'
            && typeof SkillEffectPlayer.playStationarySeekVolley === 'function') {
            SkillEffectPlayer.playStationarySeekVolley({
              fieldEl: ctx.fieldEl || document.getElementById('idleHuntField'),
              playerEl: ctx.playerEl,
              mobs: liveHits,
              frames,
              atoms: atomLayout,
              anchorAt: 'player',
              facingRight: ctxFacingRight(ctx),
              posScale: 1,
              holdMs: 520,
              onHit: (mob) => applySword(mob),
              onDone: () => {
                if (kills.length && typeof ctx.onProjectileResolve === 'function') {
                  ctx.onProjectileResolve(kills);
                }
              },
            });
          } else {
            for (let i = 0; i < swordCount; i += 1) {
              applySword(liveHits[i % liveHits.length]);
            }
          }
        }
      }
      }
    }

    tryThrowBlasting(ctx, trigger, liveHits, kills);

    return kills;
  }

  const AB_SEEKER_ID = '65111100';
  const AB_SEEKER_EXTRA_ID = '65111007';
  const AB_SEEKER_EXPERT_ID = '65120011';
  const AB_EXALT_ID = '65121054';
  const AB_SPARKLE_BURST_ID = '400051011';
  const AB_MASCOT_ID = '400051046';
  const AB_MASCOT_END_ID = '400051097';
  const AB_TRINITY_FUSION_ID = '400051072';
  const AB_SUPERNOVA_ID = '65121052';
  const AB_EXPERT_BONUS_IDS = new Set(['65121101', '65121100']);

  /** 探求者飛行球：CharacterEff forceAtom/3/atom/1（勿用 skill effect 0–3） */
  const AB_SEEKER_ORB_DIR = 'images/skills/6511/65111100/forceAtom';
  const AB_SEEKER_ORB_FRAMES = [
    { src: `${AB_SEEKER_ORB_DIR}/parentAtom/0.png`, delay: 60, origin: [41, 39] },
    { src: `${AB_SEEKER_ORB_DIR}/parentAtom/1.png`, delay: 60, origin: [42, 40] },
    { src: `${AB_SEEKER_ORB_DIR}/parentAtom/2.png`, delay: 60, origin: [42, 40] },
    { src: `${AB_SEEKER_ORB_DIR}/parentAtom/3.png`, delay: 60, origin: [41, 39] },
  ];
  const AB_SEEKER_HIT_FRAMES = [
    { src: `${AB_SEEKER_ORB_DIR}/endEff/0.png`, delay: 60, origin: [45, 57] },
    { src: `${AB_SEEKER_ORB_DIR}/endEff/1.png`, delay: 60, origin: [57, 74] },
    { src: `${AB_SEEKER_ORB_DIR}/endEff/2.png`, delay: 60, origin: [72, 76] },
    { src: `${AB_SEEKER_ORB_DIR}/endEff/3.png`, delay: 60, origin: [69, 73] },
    { src: `${AB_SEEKER_ORB_DIR}/endEff/4.png`, delay: 60, origin: [72, 74] },
    { src: `${AB_SEEKER_ORB_DIR}/endEff/5.png`, delay: 60, origin: [73, 75] },
    { src: `${AB_SEEKER_ORB_DIR}/endEff/6.png`, delay: 60, origin: [73, 76] },
    { src: `${AB_SEEKER_ORB_DIR}/endEff/7.png`, delay: 60, origin: [75, 76] },
  ];

  function abSeekerOrbFrames() {
    return AB_SEEKER_ORB_FRAMES;
  }

  function abSeekerCastSpawnDelay(skill) {
    const list = Array.isArray(skill?.fx?.effect) ? skill.fx.effect : [];
    if (list.length < 4) return 180;
    return (Number(list[0]?.delay) || 60)
      + (Number(list[1]?.delay) || 60)
      + (Number(list[2]?.delay) || 60);
  }

  function abSeekerAlivePool(ctx) {
    return filterChainAvailableMobs(resolveCastMobs(ctx))
      .filter((m) => m && Number(m.hp) > 0);
  }

  function rankAbSeekerPool(alive) {
    const bosses = alive.filter((m) => m.isBoss)
      .sort((a, b) => (Number(b.maxHp) || 0) - (Number(a.maxHp) || 0));
    // 一般怪：低血優先，方便清場；避免全堆同一隻
    const rest = alive.filter((m) => !m.isBoss)
      .sort((a, b) => (Number(a.hp) || 0) - (Number(b.hp) || 0));
    return bosses.length ? bosses.concat(rest) : rest;
  }

  function abSeekerPendingHp(mob, pending) {
    if (!mob || mob.uid == null || !pending) return Math.max(0, Number(mob?.hp) || 0);
    const reserved = Number(pending.get(String(mob.uid))) || 0;
    return Math.max(0, (Number(mob.hp) || 0) - reserved);
  }

  function abSeekerReserve(pending, mob, amount) {
    if (!pending || !mob || mob.uid == null) return;
    const uid = String(mob.uid);
    const add = Math.max(0, Number(amount) || 0);
    pending.set(uid, (Number(pending.get(uid)) || 0) + add);
  }

  function abSeekerReleaseReserve(pending, mob, amount) {
    if (!pending || !mob || mob.uid == null) return;
    const uid = String(mob.uid);
    const next = Math.max(0, (Number(pending.get(uid)) || 0) - Math.max(0, Number(amount) || 0));
    if (next > 0) pending.set(uid, next);
    else pending.delete(uid);
  }

  /** 預估單球傷害（略偏高 → 寧可少疊、多分散） */
  function estimateAbSeekerHitDmg(damagePct, outgoingMult) {
    const sample = rollSkillHit(false, Number(damagePct) || 0, { forceCritical: true });
    const raw = Math.max(0, Number(sample?.dmg) || 0);
    const mult = Number(outgoingMult);
    const scaled = Number.isFinite(mult) && mult > 0 ? raw * mult : raw;
    return Math.max(1, Math.round(scaled * 1.05));
  }

  /**
   * 依「尚未被飛行中預留傷害蓋滿」的怪分散鎖敵。
   * 優先 BOSS／低血；額度已夠秒殺的怪最後才再疊。
   */
  function pickAbSeekerTargets(ctx, count, pending, estDmg) {
    const n = Math.max(1, Math.floor(Number(count) || 1));
    const pool = rankAbSeekerPool(abSeekerAlivePool(ctx));
    if (!pool.length) return [];
    const est = Math.max(1, Number(estDmg) || 1);
    const out = [];
    for (let i = 0; i < n; i += 1) {
      let pick = pool.find((m) => abSeekerPendingHp(m, pending) > 0);
      if (!pick) pick = pool[0];
      out.push(pick);
      abSeekerReserve(pending, pick, est);
    }
    return out;
  }

  /** 重生球：避開剛打到的怪，優先尚未被預留秒殺的活怪（BOSS／低血） */
  function pickAbSeekerNextTarget(ctx, excludeMob, pending, estDmg) {
    const alive = abSeekerAlivePool(ctx);
    if (!alive.length) return null;
    const excludeUid = excludeMob && excludeMob.uid != null ? String(excludeMob.uid) : '';
    const others = excludeUid
      ? alive.filter((m) => String(m.uid) !== excludeUid)
      : alive;
    const pool = rankAbSeekerPool(others.length ? others : alive);
    if (!pool.length) return null;
    let pick = pool.find((m) => abSeekerPendingHp(m, pending) > 0);
    if (!pick) pick = pool[0];
    abSeekerReserve(pending, pick, Math.max(1, Number(estDmg) || 1));
    return pick || null;
  }

  /** 探求者本體傷害、重生機率、灌注球數／終傷乘算 */
  function getAbSeekerRuntime() {
    if (typeof SkillCatalog === 'undefined' || typeof SkillFormula === 'undefined') return null;
    const skill = SkillCatalog.getSkill(AB_SEEKER_ID);
    if (!skill) return null;
    const seekerLv = Math.max(
      1,
      (typeof CharacterSkills !== 'undefined'
        ? CharacterSkills.getLevel?.(AB_SEEKER_ID)
        : 0) || 1,
    );
    const common = evalSkill(skill, seekerLv);
    const atk = common ? combatCommonFor(skill, common) : null;
    const damagePct = Number(atk?.damagePct) || 0;
    if (!(damagePct > 0)) return null;
    const st = skill.common ? SkillFormula.evalStatCommon(skill.common, seekerLv) : null;
    let respawnProp = Math.max(0, Number(st?.s) || 0);
    if (typeof SkillModifiers !== 'undefined'
      && typeof SkillModifiers.getSkillEnhance === 'function') {
      respawnProp += Number(SkillModifiers.getSkillEnhance(AB_SEEKER_ID)?.prop) || 0;
    }
    const maxZ = Math.max(0, Math.floor(Number(st?.z) || 7));
    let bulletCount = Math.max(1, Number(st?.bulletCount) || Number(atk?.bulletCount) || 2);
    let extraBullets = 0;
    let expertPropPlus = 0;
    let seekerFdMult = 1;
    if (typeof SkillModifiers !== 'undefined' && SkillModifiers.hasBuff?.(AB_EXALT_ID)) {
      const exalt = SkillCatalog.getSkill(AB_EXALT_ID);
      const exaltLv = (typeof CharacterSkills !== 'undefined'
        ? CharacterSkills.getLevel?.(AB_EXALT_ID)
        : 0) || 1;
      const est = exalt?.common ? SkillFormula.evalStatCommon(exalt.common, exaltLv) : null;
      if (est) {
        extraBullets = Math.max(0, Math.floor(Number(est.y) || 0));
        expertPropPlus = Math.max(0, Number(est.xVal) || 0);
        respawnProp += Math.max(0, Number(est.z) || 0);
        const cut = Math.max(0, Number(est.u) || 0);
        if (cut > 0) seekerFdMult *= Math.max(0, 1 - (cut / 100));
      }
    }
    let expertProp = 0;
    let expertBullets = 2;
    let expertDmgRatio = 1;
    let expertBonusW = 0;
    const expertLv = (typeof CharacterSkills !== 'undefined'
      ? CharacterSkills.getLevel?.(AB_SEEKER_EXPERT_ID)
      : 0) || 0;
    if (expertLv > 0) {
      const expert = SkillCatalog.getSkill(AB_SEEKER_EXPERT_ID);
      const est = expert?.common ? SkillFormula.evalStatCommon(expert.common, expertLv) : null;
      if (est) {
        expertProp = Math.max(0, Number(est.prop) || 0);
        expertBullets = Math.max(1, Number(est.bulletCount) || 2);
        expertDmgRatio = Math.max(0, Number(est.xVal) || 75) / 100;
        expertBonusW = Math.max(0, Number(est.w) || 0);
      }
    }
    expertProp += expertPropPlus;
    return {
      skill,
      damagePct,
      bulletCount: bulletCount + extraBullets,
      respawnProp,
      maxZ,
      seekerFdMult,
      expertProp,
      expertBullets: expertBullets + extraBullets,
      expertDmgRatio,
      expertBonusW,
    };
  }

  /**
   * 發射探求者追蹤球：圓弧飛向目標。命中後依 s% 從怪身上先甩出再弧線追下一隻活怪
   *（沒有下一隻才繞回當前）。每顆最多 z 次。精通生球同一條鏈。
   * 鎖敵會依預估傷害預留 HP，避免多球全疊在已夠秒殺的同一隻。
   */
  function fireAbSeekerChain(ctx, opts = {}) {
    const rt = getAbSeekerRuntime();
    const kills = [];
    const hitMobs = [];
    const finish = () => {
      if (typeof opts.onDone === 'function') opts.onDone(kills, hitMobs);
    };
    if (!rt) {
      finish();
      return kills;
    }
    const isExpert = !!opts.isExpert;
    const count = Math.max(1, Math.floor(Number(
      isExpert ? rt.expertBullets : (opts.count || rt.bulletCount),
    ) || 1));
    let outgoingMult = Number(rt.seekerFdMult);
    if (!Number.isFinite(outgoingMult) || outgoingMult <= 0) outgoingMult = 1;
    if (isExpert) outgoingMult *= rt.expertDmgRatio;
    if (!(outgoingMult > 0) || !(rt.damagePct > 0)) {
      finish();
      return kills;
    }
    const maxSpawns = Math.min(40, count * (1 + rt.maxZ));
    const asyncId = opts.asyncId || registerAsyncCast();
    const ownsAsync = !opts.asyncId;
    let spawned = 0;
    let pending = 0;
    let settled = false;
    /** @type {Map<string, number>} uid → 飛行中預留傷害 */
    const hpPending = new Map();
    const estHit = estimateAbSeekerHitDmg(rt.damagePct, outgoingMult);
    const settle = () => {
      if (settled) return;
      settled = true;
      if (ownsAsync) releaseAsyncCast(asyncId);
      finish();
    };
    const beginWave = () => { pending += 1; };
    const endWave = () => {
      pending -= 1;
      if (pending <= 0) settle();
    };

    const dealOne = (mob) => {
      if (!isAsyncCastLive(asyncId)) return null;
      const live = resolveLiveMob(mob, ctx) || (mob && Number(mob.hp) > 0 ? mob : null);
      if (!live || !(Number(live.hp) > 0)) return null;
      const hit = applyHitsToMob(live, {
        damagePct: rt.damagePct,
        attackCount: 1,
        fxHit: AB_SEEKER_HIT_FRAMES,
        outgoingMult,
        isolateStack: true,
        skillId: AB_SEEKER_ID,
        showMobDamage: ctx.showMobDamage,
        onDamage: ctx.onDamage,
        flashHit: ctx.flashHit,
        flashDie: ctx.flashDie,
        ctx,
      });
      if (hit) pushUniqueMob(hitMobs, live);
      if (live.hp <= 0) pushUniqueMob(kills, live);
      if (typeof opts.onHitMob === 'function') opts.onHitMob(live);
      return live;
    };

    const retargetInFlight = (fromMob) => {
      abSeekerReleaseReserve(hpPending, fromMob, estHit);
      return pickAbSeekerNextTarget(ctx, fromMob, hpPending, estHit);
    };

    const launch = (n, bounceLeft, fromMob, lockTarget) => {
      if (settled || !isAsyncCastLive(asyncId)) return;
      const remain = maxSpawns - spawned;
      if (!(remain > 0) || !(n > 0)) return;
      const actual = Math.min(Math.floor(n), remain);
      let targets;
      if (lockTarget) {
        const locked = resolveLiveMob(lockTarget, ctx)
          || (lockTarget && Number(lockTarget.hp) > 0 ? lockTarget : null);
        targets = locked ? [locked] : [];
      } else {
        targets = pickAbSeekerTargets(ctx, actual, hpPending, estHit);
      }
      if (!targets.length) return;
      spawned += targets.length;
      beginWave();
      const frames = abSeekerOrbFrames();
      const onHit = (mob) => {
        abSeekerReleaseReserve(hpPending, mob, estHit);
        const live = dealOne(mob);
        if (bounceLeft > 0 && rt.respawnProp > 0 && Math.random() * 100 < rt.respawnProp) {
          const next = pickAbSeekerNextTarget(ctx, live || mob, hpPending, estHit);
          if (next) launch(1, bounceLeft - 1, live || mob, next);
        }
      };
      const onDone = () => endWave();
      if (frames.length
        && typeof SkillEffectPlayer !== 'undefined'
        && typeof SkillEffectPlayer.playHomingVolley === 'function') {
        SkillEffectPlayer.playHomingVolley({
          fieldEl: ctx.fieldEl || document.getElementById('idleHuntField'),
          playerEl: ctx.playerEl,
          mobs: targets,
          frames,
          anchorAt: fromMob ? 'mob' : 'player',
          anchorMob: fromMob || null,
          facingRight: ctxFacingRight(ctx),
          startOffset: [-40, -48],
          inPlace: false,
          staggerMs: fromMob ? 0 : 36,
          holdMs: 70,
          speedPxPerMs: 0.72,
          spriteScale: 1,
          centerOrigin: false,
          kickOutPx: fromMob ? 62 : 0,
          spawnFrame: fromMob ? null : (rt.skill?.fx?.effect?.[3] || null),
          spawnDelayMs: fromMob ? 0 : abSeekerCastSpawnDelay(rt.skill),
          retarget: retargetInFlight,
          onMiss: (mob) => abSeekerReleaseReserve(hpPending, mob, estHit),
          onHit,
          onDone,
        });
        return;
      }
      targets.forEach((mob) => onHit(mob));
      onDone();
    };

    launch(count, rt.maxZ, opts.fromMob || null, null);
    if (pending <= 0) settle();
    return kills;
  }

  function tryAbSeekerCastAttack(skill, skillForFx, formCommon, fx, ctx, form, picked, finishAfterDamage, opts = {}) {
    if (String(skill?.id) !== AB_SEEKER_ID) return null;
    if (!isAngelicBusterJob()) return null;
    playSkillCastFx(skillForFx || skill, fx, ctx, {
      targets: resolveSkillTargets(ctx, skill.id, Math.max(1, formCommon?.mobCount || 1)),
    });
    const kills = [];
    const hitMobs = [];
    const asyncId = registerAsyncCast();
    fireAbSeekerChain(ctx, {
      asyncId,
      isExpert: false,
      onDone: (chainKills, chainHits) => {
        if (!isAsyncCastLive(asyncId)) return;
        releaseAsyncCast(asyncId);
        (chainKills || []).forEach((m) => pushUniqueMob(kills, m));
        (chainHits || []).forEach((m) => pushUniqueMob(hitMobs, m));
        finishAfterDamage(kills, hitMobs);
        if (typeof ctx.onProjectileResolve === 'function') {
          ctx.onProjectileResolve(kills);
        }
      },
    });
    if (opts.mergeLink && picked) {
      mergeLinkFollowers(picked, ctx, []);
    }
    return { kills: [], deferredKills: true };
  }

  /** 精通自動生球（追蹤重生鏈）＋三位一體／親和力 IV */
  function tryAngelicBusterFollowups(ctx, triggerSkillId, hitMobs) {
    const kills = [];
    if (!isAngelicBusterJob()) return kills;
    if (ctx?.skipAbExtras) return kills;
    const trigger = String(triggerSkillId || '');
    if (!trigger || trigger === AB_SEEKER_EXTRA_ID) return kills;
    const hitList = (Array.isArray(hitMobs) ? hitMobs : []).filter(Boolean);
    if (typeof SkillModifiers !== 'undefined') {
      SkillModifiers.tryProcTrinity?.(trigger);
      SkillModifiers.tryProcAffinityHeart?.(trigger);
    }
    if (!hitList.length) return kills;
    if (trigger === AB_SEEKER_ID || trigger === AB_SUPERNOVA_ID) return kills;

    const rt = getAbSeekerRuntime();
    if (!rt || !(rt.expertProp > 0)) return kills;
    let prop = rt.expertProp;
    if (AB_EXPERT_BONUS_IDS.has(trigger)) prop += rt.expertBonusW;
    if (!(prop > 0) || Math.random() * 100 >= prop) return kills;
    const fromMob = hitList.find((m) => Number(m.hp) > 0) || hitList[0];
    fireAbSeekerChain(ctx, {
      isExpert: true,
      fromMob,
      onDone: (chainKills) => {
        if (!chainKills?.length) return;
        if (typeof ctx.onProjectileResolve === 'function') {
          ctx.onProjectileResolve(chainKills);
        } else {
          syncMobStateAfterDamage(chainKills, ctx);
        }
      },
    });
    return kills;
  }

  /** FA／暴風雪追加：安靜 tick 仍要跳出傷害數字（特效已 forcePlay） */
  function showFinalAttackDamage(ctx, mob, dmg, isCritical, opts) {
    if (!(dmg > 0) || !mob) return;
    if (ctx?.quietFx && typeof DamageNumber !== 'undefined') {
      DamageNumber.spawnOnMob(mob, dmg, !!isCritical, opts || {});
      return;
    }
    if (typeof ctx?.showMobDamage === 'function') {
      ctx.showMobDamage(mob, dmg, !!isCritical, opts);
    } else if (typeof DamageNumber !== 'undefined') {
      DamageNumber.spawnOnMob(mob, dmg, !!isCritical, opts || {});
    }
  }

  const BLIZZARD_SKILL_ID = '2221007';

  /** 暴風雪被動［終極攻擊類］：對命中的每隻怪各自 prop%；落地時才結算傷害＋數字 */
  function tryBlizzardFinalAttack(ctx, triggerSkillId, hitMobs) {
    if (typeof SkillFormula === 'undefined' || typeof SkillCatalog === 'undefined') return [];
    const trigger = String(triggerSkillId || '');
    if (!trigger || trigger === BLIZZARD_SKILL_ID) return [];
    const triggerSkill = SkillCatalog.getSkill?.(trigger);
    if (!triggerSkill || triggerSkill.type === 'passive') return [];
    if (triggerSkill.type === 'buff') {
      const lv = CharacterSkills.getLevel?.(trigger) || 0;
      const common = lv > 0 ? evalSkill(triggerSkill, lv) : null;
      if (!common || !(Number(common.damagePct) > 0)) return [];
    }

    const level = CharacterSkills.getLevel?.(BLIZZARD_SKILL_ID) || 0;
    if (!(level > 0)) return [];
    const skill = SkillCatalog.getSkill(BLIZZARD_SKILL_ID);
    if (!skill?.common) return [];
    const st = SkillFormula.evalStatCommon(skill.common, level);
    const prop = Math.max(0, Number(st.prop) || 0);
    if (!(prop > 0)) return [];

    let damagePct = Math.max(0, Number(st.xVal) || 0);
    if (!(damagePct > 0) && skill.common.x != null) {
      damagePct = Math.max(0, SkillFormula.evalExpr(skill.common.x, { x: level }) || 0);
    }
    if (!(damagePct > 0)) return [];

    const targets = resolveFinalAttackTargets(ctx, hitMobs);
    if (!targets.length) return [];

    const chosen = targets.filter((mob) => mob && Number(mob.hp) > 0 && Math.random() * 100 < prop);
    if (!chosen.length) return [];

    const asyncId = registerAsyncCast();
    const applyFaHit = (mobRef) => {
      if (!isAsyncCastLive(asyncId)) return;
      const live = resolveLiveMob(mobRef, ctx) || (
        mobRef && Number(mobRef.hp) > 0 ? mobRef : null
      );
      if (!live || !(Number(live.hp) > 0)) return;

      applyHitsToMob(live, {
        damagePct,
        attackCount: 1,
        fxHit: null,
        multiHit: false,
        showMobDamage: (m, dmg, crit, dmgOpts) => {
          showFinalAttackDamage(ctx, m, dmg, crit, dmgOpts);
        },
        onDamage: ctx.onDamage,
        flashHit: ctx.flashHit,
        flashDie: ctx.flashDie,
        skillId: BLIZZARD_SKILL_ID,
        isolateStack: true,
      });
      if (live.hp <= 0) {
        syncMobStateAfterDamage([live], ctx);
      }
    };

    chosen.forEach((mob) => {
      if (typeof SkillBlizzardCast !== 'undefined'
        && typeof SkillBlizzardCast.playFinalAttackFx === 'function') {
        const delayShowDamage = Number(skill.blizzardCast?.delayShowDamage)
          || Number(SkillBlizzardCast.DEFAULT_DELAY_SHOW_DAMAGE_MS)
          || 960;
        SkillBlizzardCast.playFinalAttackFx({
          mob,
          fx: skill.fx || {},
          fieldEl: ctx.fieldEl,
          playerEl: ctx.playerEl,
          delayShowDamage,
          onHit: applyFaHit,
        });
      } else {
        if (typeof SkillEffectPlayer !== 'undefined' && skill.fx?.hit?.length) {
          SkillEffectPlayer.playOnMob(mob, skill.fx.hit, { forcePlay: true });
        }
        applyFaHit(mob);
      }
    });

    // 傷害延遲到 delayShowDamage；擊殺由 onHit 內 sync
    window.setTimeout(() => {
      if (isAsyncCastLive(asyncId)) releaseAsyncCast(asyncId);
    }, scaleGameDelayMs(2200));
    return [];
  }

  function dealSkillDamage(skill, common, ctx, opts = {}) {
    const atkCommon = combatCommonFor(skill, common);
    const attackCount = Math.max(1, atkCommon.attackCount || 1);
    const mobCount = Math.max(1, atkCommon.mobCount || 1);
    const mobs = resolveSkillTargets(ctx, skill?.id, mobCount);
    const multiHit = attackCount > 1;
    const segmentGapSec = opts.segmentGapSec != null ? opts.segmentGapSec : null;
    const fxSkill = opts.skillForFx || skill;
    const fx = fxSkill.fx || {};
    const normalBonus = Number(opts.normalMobBonusPct) || 0;
    const critRateBonus = resolveCritRateBonus(skill, atkCommon, opts.critRateBonus);
    const kills = [];
    const hitMobs = [];

    mobs.forEach((mob) => {
      if (!mob) return;
      const bonus = (!mob.isBoss && normalBonus > 0) ? normalBonus : 0;
      const hit = applyHitsToMob(mob, {
        damagePct: atkCommon.damagePct,
        damagePctBonus: bonus,
        attackCount,
        fxHit: Object.prototype.hasOwnProperty.call(opts, 'fxHit') ? opts.fxHit : fx.hit,
        multiHit,
        segmentGapSec,
        showMobDamage: ctx.showMobDamage,
        onDamage: ctx.onDamage,
        flashHit: ctx.flashHit,
        flashDie: ctx.flashDie,
        forceCritTail: opts.forceCritTail || 0,
        critRateBonus,
        skillId: skill?.id,
        isolateStack: !!opts.isolateStack,
        ctx,
      });
      if (hit) pushUniqueMob(hitMobs, mob);
      if (mob.hp <= 0) pushUniqueMob(kills, mob);
    });
    return { kills, hitMobs };
  }

  /**
   * 技能連鎖 2–4 號：無角色動作、不延長 castLock，只播命中特效並結算傷害。
   * silentCombo：不重複播施放特效／不觸發意念（避免同幀 3～4 套 cast FX 卡頓）
   */
  function castLinkFollower(skillId, ctx = {}, linkOpts = {}) {
    if (!skillId || typeof SkillCatalog === 'undefined') return { kills: [] };
    const skill = SkillCatalog.getSkill(skillId);
    if (!skill) return { kills: [] };
    const level = CharacterSkills.getLevel?.(skillId) || 0;
    if (!(level > 0)) return { kills: [] };
    const baseCommon = evalSkill(skill, level);
    if (!baseCommon) return { kills: [] };
    if (isBuffSkill(skill, baseCommon)) return { kills: [] };
    if (baseCommon.cooltimeSec > 0) return { kills: [] };

    if (typeof SkillModifiers !== 'undefined'
      && typeof SkillModifiers.tryProcIgnisRoar === 'function') {
      SkillModifiers.tryProcIgnisRoar({ fromLink: true });
    }

    const form = resolveComboEnhancedForm(skill, level, baseCommon);
    const skillForFx = form.skillForFx || skill;
    const formCommon = form.common || baseCommon;
    const fx = skillForFx.fx || {};
    const atkCommon = combatCommonFor(skill, formCommon);
    beginSkillResourceCast();
    spendSkillHpCost(baseCommon, { includeOverload: true });
    const attackCount = Math.max(1, atkCommon.attackCount || 1);
    const multiHit = attackCount > 1;
    // 跟隨技：傷害一次結清，數字用 stackIndex 疊；不再依攻速排段延遲（減少 timer／卡頓）
    const segmentGapSec = (linkOpts.silentCombo || !multiHit)
      ? null
      : (() => {
        const actionDelayMs = resolveActionDelayMs(
          formCommon.attackDelayBaseMs ?? baseCommon.attackDelayBaseMs,
          ctx.wzAttackSpeed ?? ctx.attackSpeedStage,
        );
        const scaledActionDelayMs = scaleGameDelayMs(actionDelayMs);
        return ((formCommon.attackDelayBaseMs ?? baseCommon.attackDelayBaseMs) != null
          ? (scaledActionDelayMs / attackCount) / 1000
          : null);
      })();
    const normalMobBonusPct = typeof SkillFormula !== 'undefined'
      ? (SkillFormula.resolveNormalMobBonusPct?.(skill, level) || 0)
      : 0;
    // 跟隨技仍播施放／命中特效（帥度）；效能靠狩獵傷害快取與 render 合併
    const playCastFx = linkOpts.playCastFx !== false;

    const finishAfterDamage = (kills, hitMobs) => {
      if (!Array.isArray(kills)) kills = [];
      if (!linkOpts.silentCombo) notifyComboAndSync();
      const faKills = tryFinalAttack(ctx, skillId, hitMobs);
      faKills.forEach((m) => pushUniqueMob(kills, m));
      const bzKills = tryBlizzardFinalAttack(ctx, skillId, hitMobs);
      bzKills.forEach((m) => pushUniqueMob(kills, m));
      const nlKills = tryNightLordFollowups(ctx, skillId, hitMobs);
      nlKills.forEach((m) => pushUniqueMob(kills, m));
      const merKills = tryMercedesFollowups(ctx, skillId, hitMobs);
      merKills.forEach((m) => pushUniqueMob(kills, m));
      const abKills = tryAngelicBusterFollowups(ctx, skillId, hitMobs);
      abKills.forEach((m) => pushUniqueMob(kills, m));
      // 意念只由主技能／非 silent 路徑觸發，避免連鎖同幀連續 proc
      if (!linkOpts.silentCombo
        && typeof SkillBuffRuntime !== 'undefined'
        && typeof SkillBuffRuntime.onSwordSkillCast === 'function') {
        const extra = SkillBuffRuntime.onSwordSkillCast(skill, ctx);
        if (extra?.kills?.length) {
          extra.kills.forEach((m) => pushUniqueMob(kills, m));
        }
      }
      return kills;
    };

    const shootFrames = shootObjFrames(fx);
    const shootMeta = fx.shootobj;
    if (!usesOrbBallCast(skill, fx)
      && shootFrames.length && typeof SkillEffectPlayer !== 'undefined'
      && typeof SkillEffectPlayer.playShootObj === 'function') {
      const shootFlags = windShurikenShootFlags(skill, atkCommon, shootMeta);
      const pierce = shootFlags.pierce;
      const maxTargets = shootFlags.maxTargets;
      const targets = resolveSkillTargets(ctx, skillId, maxTargets);
      if (playCastFx) {
        playSkillCastFx(skillForFx || skill, fx, ctx, { targets });
      }
      const fieldEl = ctx.fieldEl || document.getElementById('idleHuntField');
      const kills = [];
      const hitMobs = [];
      let lingerAt = null;
      SkillEffectPlayer.playShootObj({
        fieldEl,
        playerEl: ctx.playerEl,
        mobs: targets,
        frames: shootFrames,
        startOffset: shootMeta.start || [-80, -60],
        startDelayMs: shootFlags.startDelayMs,
        pierce,
        maxTargets,
        moveList: shootMeta.moveList || null,
        bodyWH: shootMeta.bodyWH || [300, 300],
        facingRight: ctxFacingRight(ctx),
        onHit: (mob) => {
          if (!mob || mob.hp <= 0) return;
          const hit = dealHitsOnMob(skillForFx, atkCommon, mob, ctx, {
            segmentGapSec,
            normalMobBonusPct,
            forceCritTail: form.forceCritTail || 0,
          });
          if (hit) {
            pushUniqueMob(hitMobs, mob);
            lingerAt = mobFieldAnchor(ctx, mob) || lingerAt;
          }
          if (mob.hp <= 0) pushUniqueMob(kills, mob);
        },
        onDone: () => {
          startWindShurikenLinger(skill, level, atkCommon, ctx, lingerAt);
          finishAfterDamage(kills, hitMobs);
          if (typeof ctx.onProjectileResolve === 'function') {
            ctx.onProjectileResolve(kills);
          }
        },
      });
      return { kills: [], deferredKills: true };
    }

    const seekerResult = tryAbSeekerCastAttack(
      skill,
      skillForFx,
      formCommon,
      fx,
      ctx,
      form,
      null,
      finishAfterDamage,
      { mergeLink: false },
    );
    if (seekerResult) return seekerResult;

    const areaResult = tryAreaCastAttack(
      skill,
      skillForFx,
      formCommon,
      fx,
      ctx,
      form,
      null,
      finishAfterDamage,
      { segmentGapSec, normalMobBonusPct, forceCritTail: form.forceCritTail || 0 },
    );
    if (areaResult) return areaResult;

    const blizzardResult = tryBlizzardCastAttack(
      skill,
      skillForFx,
      formCommon,
      fx,
      ctx,
      form,
      null,
      finishAfterDamage,
      { segmentGapSec, normalMobBonusPct, forceCritTail: form.forceCritTail || 0 },
    );
    if (blizzardResult) return blizzardResult;

    const ballResult = tryBallCastAttack(
      skill,
      skillForFx,
      atkCommon,
      fx,
      ctx,
      form,
      null,
      finishAfterDamage,
      { segmentGapSec, normalMobBonusPct, forceCritTail: form.forceCritTail || 0 },
    );
    if (ballResult) return ballResult;

    if (playCastFx && typeof SkillEffectPlayer !== 'undefined') {
      playSkillCastFx(skillForFx || skill, fx, ctx, {
        targets: resolveSkillTargets(ctx, skill.id, Math.max(1, atkCommon.mobCount || 1)),
      });
    }
    const dmgResult = dealSkillDamage(skill, formCommon, ctx, {
      segmentGapSec,
      normalMobBonusPct,
      skillForFx,
      forceCritTail: form.forceCritTail || 0,
    });
    const kills = finishAfterDamage(dmgResult.kills, dmgResult.hitMobs);
    // 即時傷害跟隨技：各自結算死亡
    if (kills.length) syncMobStateAfterDamage(kills, ctx);
    return { kills };
  }

  function mergeLinkFollowers(picked, ctx, intoKills) {
    const followers = picked?.skillLinkFollowers;
    if (!picked?.isSkillLink || !Array.isArray(followers) || !followers.length) return intoKills;

    // 精靈遊俠：2–4 號最低延遲跟光速雙擊，避免伊修塔爾等高頻頭技每 tick 狂放連鎖
    if (isMercedesJob()) {
      const t = nowMs();
      if (t < mercedesLinkFollowerReadyAt) return intoKills;
      mercedesLinkFollowerReadyAt = t + resolveMercedesLinkFollowerGapMs(ctx);
    }

    const kills = Array.isArray(intoKills) ? intoKills : [];
    let anyFollower = false;
    followers.forEach((id) => {
      anyFollower = true;
      const extra = castLinkFollower(id, ctx, { silentCombo: true });
      const fk = Array.isArray(extra?.kills) ? extra.kills : [];
      // castLinkFollower 同步路徑已各自 sync；此處只彙總供呼叫端參考
      fk.forEach((m) => {
        if (m && !kills.includes(m)) kills.push(m);
      });
    });
    if (anyFollower) notifyComboAndSync();
    return kills;
  }

  function cast(picked, ctx = {}) {
    if (!picked?.skill || !picked.common) return { cast: false };
    const t = nowMs();
    const interruptSustain = !!(activeSustainChannel
      && String(activeSustainChannel.skillId) !== String(picked.skill.id));
    if (isCastLocked(t) && !interruptSustain) return { cast: false };
    if (interruptSustain) stopActiveSustainChannel();

    // 一次施放（含技能連鎖）共用一組傷害數字堆疊
    beginDamageStackSession(ctx);

    // 連鎖／多段同一施放週期共用傷害公式快取
    if (typeof UiCharacterInfo !== 'undefined'
      && !THROW_STAR_SKILL_IDS.has(String(picked?.skill?.id || ''))) {
      UiCharacterInfo.invalidateHuntCombatCache?.();
    }

    initSkillLinkTargeting(ctx, picked);

    const { skill, level, common: baseCommon } = picked;
    const form = resolveComboEnhancedForm(skill, level, baseCommon);
    const skillForFx = form.skillForFx || skill;
    const formCommon = form.common || baseCommon;

    // 依古尼斯：連接技／接技／可連接主動／精靈攻擊技皆可疊層
    if (typeof SkillModifiers !== 'undefined'
      && typeof SkillModifiers.tryProcIgnisRoar === 'function') {
      const jobId = typeof CharacterSkills !== 'undefined'
        ? Number(CharacterSkills.currentJobId?.()) || 0
        : 0;
      const isMercedes = jobId === 2300 || jobId === 2310 || jobId === 2311 || jobId === 2312
        || (jobId >= 2300 && jobId < 2400);
      const fromLink = !!(picked.isSkillLink
        || (Number(ctx.addAttackDepth) || 0) > 0
        || skill.addAttack
        || (isMercedes && skill.type === 'active'
          && ((Number(formCommon?.damagePct) || 0) > 0
            || (skill.common?.damage != null && String(skill.common.damage) !== ''))));
      if (fromLink) SkillModifiers.tryProcIgnisRoar({ fromLink: true });
    }

    const wzForDelay = ctx.wzAttackSpeed ?? ctx.attackSpeedStage;
    const actionDelayMs = resolveActionDelayMs(
      formCommon.attackDelayBaseMs ?? baseCommon.attackDelayBaseMs,
      wzForDelay,
    );
    const skillAction = (typeof Paperdoll !== 'undefined'
      && typeof Paperdoll.resolveSkillActionName === 'function')
      ? Paperdoll.resolveSkillActionName(form.actions)
      : (Array.isArray(form.actions) ? form.actions[0] : '');

    const fx = skillForFx.fx || {};
    const timedBuff = typeof SkillBuffRuntime !== 'undefined'
      && SkillBuffRuntime.isTimedBuffSkill?.(skill, baseCommon);
    const buffOnly = !!timedBuff || isBuffSkill(skill, baseCommon);
    // 有 CD 主動／Buff：不播角色出手動作（紙娃娃揮砍）、不鎖選招
    const hasSkillCd = Number(baseCommon.cooltimeSec) > 0;
    const skipBodyAction = buffOnly || hasSkillCd;

    // Buff／有 CD 攻擊：施放無延遲（特效背景播，不中斷普攻／下一招）
    // 無 CD 攻擊：依攻速 delay／身體 instruction／施放特效鎖選招
    let lockMs = 0;
    let instructionMs = 0;
    let effectMs = 0;
    if (!buffOnly && !hasSkillCd) {
      if (!skipBodyAction) {
        const instructionNaturalMs = (typeof Paperdoll !== 'undefined'
          && typeof Paperdoll.getInstructionDurationMs === 'function')
          ? (Paperdoll.getInstructionDurationMs(skillAction) || 0)
          : 0;
        instructionMs = scaleDurationByAttackSpeed(instructionNaturalMs, wzForDelay);
      }
      effectMs = scaleDurationByAttackSpeed(skillFxDurationMs(fx), wzForDelay);
      // 施放鎖定＝攻速後 delay／身體 instruction／施放特效 三者取長（含前搖後搖）
      lockMs = scaleGameDelayMs(Math.max(actionDelayMs, instructionMs, effectMs, 30));
    }
    castLockUntil = t + lockMs;

    if (baseCommon.cooltimeSec > 0) {
      cooldowns[String(skill.id)] = t + scaleGameDelayMs(baseCommon.cooltimeSec * 1000);
    } else if (!isBuffSkill(skill, baseCommon)) {
      lastNoCdAttackSlot = Number.isFinite(picked.slot) ? picked.slot : lastNoCdAttackSlot;
    }

    const willSustainChannel = !!(skill.channelCast?.sustain)
      && !(baseCommon.cooltimeSec > 0)
      && typeof SkillChannelCast !== 'undefined'
      && SkillChannelCast.isChannelCastSkill?.(skill, fx);

    if (!skipBodyAction
      && !(ctx.quietFx || (typeof document !== 'undefined' && document.hidden))
      && typeof Paperdoll !== 'undefined' && typeof Paperdoll.playHuntSwing === 'function'
      && !willSustainChannel
      && skill.castFxAt !== 'targetHead') {
      // 接技頭／鏈上：先鎖住 move，避免 instruction 結束瞬間歸位
      const aa = skill?.addAttack;
      const willComboMove = !ctx.skipAddAttack && aa?.skill && (
        picked?.isAddAttack
        || aa.isAuto
        || Number(aa.type) === 1
        || (Number(ctx.addAttackDepth) || 0) > 0
      );
      if (willComboMove) Paperdoll.setComboMoveHold?.(true);
      // 揮砍時長對齊鎖定，避免動作被壓短後下一招搶跑
      Paperdoll.playHuntSwing(lockMs, skillAction);
    }

    // 無 MP：凡有 mpCon 的技能（含 buff）都扣 HP；依最大 HP 比例換算，魔力激發再加碼
    beginSkillResourceCast();
    spendSkillHpCost(baseCommon, { includeOverload: !timedBuff });

    if (timedBuff) {
      const sid = String(skill.id || '');
      const skipGenericBuffFx = sid === '400031007' || sid === '400031044' || sid === '400001024';
      if (!skipGenericBuffFx && typeof SkillEffectPlayer !== 'undefined') {
        if (fx.effect?.length) SkillEffectPlayer.playOnPlayer(fx.effect, { playerEl: ctx.playerEl });
        if (fx.effect0?.length) SkillEffectPlayer.playOnPlayer(fx.effect0, { playerEl: ctx.playerEl });
      }
      SkillBuffRuntime.activateTimedBuff(skill, level, baseCommon, ctx);
      if (typeof CharacterCombatPanel !== 'undefined') {
        CharacterCombatPanel.syncToCombatPower?.();
      }
      if (typeof UiCharacterInfo !== 'undefined') {
        UiCharacterInfo.invalidateHuntCombatCache?.();
        UiCharacterInfo.refresh?.();
      }
      return {
        cast: true,
        skillId: skill.id,
        level,
        actionDelayMs: 0,
        lockMs: 0,
        kills: [],
        buffOnly: true,
      };
    }

    // 超技加乘掛本體 id；滿鬥氣係數已寫進 formCommon
    const atkCommon = combatCommonFor(skill, formCommon);
    const attackCount = Math.max(1, atkCommon.attackCount || 1);
    const multiHit = attackCount > 1;
    const segmentGapSec = multiHit
      ? ((formCommon.attackDelayBaseMs ?? baseCommon.attackDelayBaseMs) != null
        ? (scaleGameDelayMs(actionDelayMs) / attackCount) / 1000
        : null)
      : null;

    const normalMobBonusPct = typeof SkillFormula !== 'undefined'
      ? (SkillFormula.resolveNormalMobBonusPct?.(skill, level) || 0)
      : 0;

    const finishAfterDamage = (kills, hitMobs) => {
      if (!Array.isArray(kills)) kills = [];
      notifyComboAndSync({ skipPanel: isNightLordJob() });
      const runFaAndNl = () => {
        const faKills = tryFinalAttack(ctx, skill.id, hitMobs);
        faKills.forEach((m) => pushUniqueMob(kills, m));
        const bzKills = tryBlizzardFinalAttack(ctx, skill.id, hitMobs);
        bzKills.forEach((m) => pushUniqueMob(kills, m));
        const nlKills = tryNightLordFollowups(ctx, skill.id, hitMobs);
        nlKills.forEach((m) => pushUniqueMob(kills, m));
      };
      if (isNightLordJob()) scheduleAfterPaint(runFaAndNl);
      else runFaAndNl();
      const merKills = tryMercedesFollowups(ctx, skill.id, hitMobs);
      merKills.forEach((m) => pushUniqueMob(kills, m));
      const abKills = tryAngelicBusterFollowups(ctx, skill.id, hitMobs);
      abKills.forEach((m) => pushUniqueMob(kills, m));
      if (typeof SkillBuffRuntime !== 'undefined'
        && typeof SkillBuffRuntime.onSwordSkillCast === 'function') {
        const extra = SkillBuffRuntime.onSwordSkillCast(skill, ctx);
        if (extra?.kills?.length) {
          extra.kills.forEach((m) => pushUniqueMob(kills, m));
        }
      }
      if (typeof SkillBuffRuntime !== 'undefined'
        && typeof SkillBuffRuntime.afterActiveCast === 'function') {
        SkillBuffRuntime.afterActiveCast(skill, level, ctx);
      }
      scheduleAddAttackFollowup(
        skill,
        {
          ...ctx,
          // 技能連鎖與接技互斥：連鎖同幀多段時不另跑 addAttack
          skipAddAttack: !!(picked?.isSkillLink || ctx.skipAddAttack),
        },
        Number(ctx.addAttackDepth) || 0,
      );
      return kills;
    };

    const finishDamage = () => {
      const dmgResult = dealSkillDamage(skill, formCommon, ctx, {
        segmentGapSec,
        normalMobBonusPct,
        skillForFx,
        forceCritTail: form.forceCritTail || 0,
      });
      return finishAfterDamage(dmgResult.kills, dmgResult.hitMobs);
    };

    // 投擲物：自身 effect → shootobj 飛出 → 命中目標 hit（可穿透）
    const shootFrames = shootObjFrames(fx);
    const shootMeta = fx.shootobj;
    if (!usesOrbBallCast(skill, fx)
      && shootFrames.length && typeof SkillEffectPlayer !== 'undefined'
      && typeof SkillEffectPlayer.playShootObj === 'function') {
      const shootFlags = windShurikenShootFlags(skill, atkCommon, shootMeta);
      const pierce = shootFlags.pierce;
      const maxTargets = shootFlags.maxTargets;
      const targets = resolveSkillTargets(ctx, skill.id, maxTargets);
      playSkillCastFx(skillForFx, fx, ctx, { targets });

      const fieldEl = ctx.fieldEl || document.getElementById('idleHuntField');
      const kills = [];
      const hitMobs = [];
      const asyncId = registerAsyncCast();
      let lingerAt = null;

      SkillEffectPlayer.playShootObj({
        fieldEl,
        playerEl: ctx.playerEl,
        mobs: targets,
        frames: shootFrames,
        startOffset: shootMeta.start || [-80, -60],
        startDelayMs: shootFlags.startDelayMs,
        pierce,
        maxTargets,
        moveList: shootMeta.moveList || null,
        bodyWH: shootMeta.bodyWH || [300, 300],
        facingRight: ctxFacingRight(ctx),
        onHit: (mob) => {
          if (!isAsyncCastLive(asyncId)) return;
          if (!mob || mob.hp <= 0) return;
          const hit = dealHitsOnMob(skillForFx, atkCommon, mob, ctx, {
            segmentGapSec,
            normalMobBonusPct,
            forceCritTail: form.forceCritTail || 0,
          });
          if (hit) {
            pushUniqueMob(hitMobs, mob);
            lingerAt = mobFieldAnchor(ctx, mob) || lingerAt;
          }
          if (mob.hp <= 0) pushUniqueMob(kills, mob);
        },
        onDone: () => {
          if (!isAsyncCastLive(asyncId)) return;
          releaseAsyncCast(asyncId);
          startWindShurikenLinger(skill, level, atkCommon, ctx, lingerAt);
          finishAfterDamage(kills, hitMobs);
          if (typeof ctx.onProjectileResolve === 'function') {
            ctx.onProjectileResolve(kills);
          }
        },
      });

      // 連鎖 2–4：與 1 號同時出手（投擲物本體延遲結算，跟隨技立即打）
      mergeLinkFollowers(picked, ctx, []);

      return {
        cast: true,
        skillId: skill.id,
        level,
        actionDelayMs,
        lockMs,
        kills: [],
        projectile: true,
        deferredKills: true,
        enhanced: !!form.enhanced,
        skillLink: !!picked.isSkillLink,
      };
    }

    const seekerResult = tryAbSeekerCastAttack(
      skill,
      skillForFx,
      formCommon,
      fx,
      ctx,
      form,
      picked,
      finishAfterDamage,
      { mergeLink: true },
    );
    if (seekerResult) {
      return {
        cast: true,
        skillId: skill.id,
        level,
        actionDelayMs,
        lockMs,
        kills: [],
        projectile: true,
        deferredKills: true,
        enhanced: !!form.enhanced,
        skillLink: !!picked.isSkillLink,
      };
    }

    const abVResult = tryAbVWaveCast(
      skill,
      skillForFx,
      formCommon,
      fx,
      ctx,
      form,
      picked,
      finishAfterDamage,
      {
        segmentGapSec,
        normalMobBonusPct,
        mergeLink: true,
        forceCritTail: form.forceCritTail || 0,
      },
    );
    if (abVResult) {
      return {
        cast: true,
        skillId: skill.id,
        level,
        actionDelayMs,
        lockMs,
        kills: [],
        deferredKills: true,
        enhanced: !!form.enhanced,
        skillLink: !!picked.isSkillLink,
      };
    }

    const ilVOpts = {
      segmentGapSec,
      normalMobBonusPct,
      mergeLink: true,
      forceCritTail: form.forceCritTail || 0,
    };
    const thunderbreakResult = tryIlThunderbreakCast(
      skill,
      skillForFx,
      formCommon,
      fx,
      ctx,
      form,
      picked,
      finishAfterDamage,
      ilVOpts,
    );
    if (thunderbreakResult) {
      return {
        cast: true,
        skillId: skill.id,
        level,
        actionDelayMs,
        lockMs,
        kills: [],
        deferredKills: true,
        enhanced: !!form.enhanced,
        skillLink: !!picked.isSkillLink,
      };
    }
    const jupiterResult = tryJupiterThunderCast(
      skill,
      skillForFx,
      formCommon,
      fx,
      ctx,
      form,
      picked,
      finishAfterDamage,
      ilVOpts,
    );
    if (jupiterResult) {
      return {
        cast: true,
        skillId: skill.id,
        level,
        actionDelayMs,
        lockMs,
        kills: [],
        deferredKills: true,
        enhanced: !!form.enhanced,
        skillLink: !!picked.isSkillLink,
      };
    }

    const areaResult = tryAreaCastAttack(
      skill,
      skillForFx,
      formCommon,
      fx,
      ctx,
      form,
      picked,
      finishAfterDamage,
      {
        segmentGapSec,
        normalMobBonusPct,
        mergeLink: true,
        forceCritTail: form.forceCritTail || 0,
      },
    );
    if (areaResult) {
      return {
        cast: true,
        skillId: skill.id,
        level,
        actionDelayMs,
        lockMs,
        kills: [],
        deferredKills: true,
        enhanced: !!form.enhanced,
        skillLink: !!picked.isSkillLink,
      };
    }

    const sylvidiaResult = trySylvidiaCast(
      skill,
      skillForFx,
      formCommon,
      fx,
      ctx,
      form,
      picked,
      finishAfterDamage,
      {
        segmentGapSec,
        normalMobBonusPct,
        mergeLink: true,
        forceCritTail: form.forceCritTail || 0,
      },
    );
    if (sylvidiaResult) {
      return {
        cast: true,
        skillId: skill.id,
        level,
        actionDelayMs,
        lockMs,
        kills: [],
        deferredKills: true,
        enhanced: !!form.enhanced,
        skillLink: !!picked.isSkillLink,
      };
    }

    const illusionResult = trySwordIllusionCast(
      skill,
      skillForFx,
      formCommon,
      fx,
      ctx,
      form,
      picked,
      finishAfterDamage,
      {
        segmentGapSec,
        normalMobBonusPct,
        mergeLink: true,
        forceCritTail: form.forceCritTail || 0,
      },
    );
    if (illusionResult) {
      return {
        cast: true,
        skillId: skill.id,
        level,
        actionDelayMs,
        lockMs,
        kills: [],
        deferredKills: true,
        enhanced: !!form.enhanced,
        skillLink: !!picked.isSkillLink,
      };
    }

    const blizzardResult = tryBlizzardCastAttack(
      skill,
      skillForFx,
      formCommon,
      fx,
      ctx,
      form,
      picked,
      finishAfterDamage,
      {
        segmentGapSec,
        normalMobBonusPct,
        mergeLink: true,
        forceCritTail: form.forceCritTail || 0,
      },
    );
    if (blizzardResult) {
      return {
        cast: true,
        skillId: skill.id,
        level,
        actionDelayMs,
        lockMs,
        kills: [],
        deferredKills: true,
        enhanced: !!form.enhanced,
        skillLink: !!picked.isSkillLink,
      };
    }

    const channelResult = tryChannelCastAttack(
      skill,
      skillForFx,
      atkCommon,
      fx,
      ctx,
      form,
      picked,
      finishAfterDamage,
      {
        segmentGapSec,
        normalMobBonusPct,
        mergeLink: true,
        forceCritTail: form.forceCritTail || 0,
      },
    );
    if (channelResult) {
      if (channelResult.alreadyActive) {
        return {
          cast: true,
          skillId: skill.id,
          level,
          actionDelayMs,
          lockMs: Number(channelResult.channelLockMs) || lockMs,
          kills: [],
          deferredKills: true,
          channel: true,
          sustain: true,
          enhanced: !!form.enhanced,
          skillLink: !!picked.isSkillLink,
        };
      }
      if (channelResult.sustain) {
        const channelLock = scaleGameDelayMs(channelResult.channelLockMs);
        castLockUntil = Math.max(castLockUntil, t + channelLock);
        if (!(ctx.quietFx || (typeof document !== 'undefined' && document.hidden))
          && typeof Paperdoll !== 'undefined') {
          if (typeof Paperdoll.playHuntSwingLoop === 'function') {
            Paperdoll.playHuntSwingLoop(skillAction);
          } else {
            Paperdoll.playHuntSwing?.(channelLock, skillAction);
          }
        }
      } else if (!(baseCommon.cooltimeSec > 0) && Number(channelResult.channelLockMs) > 0) {
        // 無 CD 有限引導：延長施放鎖，避免一直重播 prepare
        const channelLock = scaleGameDelayMs(channelResult.channelLockMs);
        castLockUntil = Math.max(castLockUntil, t + channelLock);
        if (!skipBodyAction
          && !(ctx.quietFx || (typeof document !== 'undefined' && document.hidden))
          && typeof Paperdoll !== 'undefined' && typeof Paperdoll.playHuntSwing === 'function') {
          Paperdoll.playHuntSwing(channelLock, skillAction);
        }
      }
      return {
        cast: true,
        skillId: skill.id,
        level,
        actionDelayMs,
        lockMs: Math.max(lockMs, Number(channelResult.channelLockMs) || 0),
        kills: [],
        deferredKills: true,
        channel: true,
        sustain: !!channelResult.sustain,
        enhanced: !!form.enhanced,
        skillLink: !!picked.isSkillLink,
      };
    }

    const ballResult = tryBallCastAttack(
      skill,
      skillForFx,
      atkCommon,
      fx,
      ctx,
      form,
      picked,
      finishAfterDamage,
      {
        segmentGapSec,
        normalMobBonusPct,
        mergeLink: true,
        forceCritTail: form.forceCritTail || 0,
      },
    );
    if (ballResult) {
      return {
        cast: true,
        skillId: skill.id,
        level,
        actionDelayMs,
        lockMs,
        kills: [],
        projectile: true,
        deferredKills: true,
        enhanced: !!form.enhanced,
        skillLink: !!picked.isSkillLink,
      };
    }

    if (typeof SkillEffectPlayer !== 'undefined') {
      playSkillCastFx(skillForFx, fx, ctx, {
        targets: resolveSkillTargets(ctx, skill.id, Math.max(1, atkCommon.mobCount || 1)),
      });
    }

    let kills = finishDamage();
    // 連接技：主技能先結算，跟隨技在 castLinkFollower 內各自結算；勿把 kills 交回 idleHunt 重套
    if (picked.isSkillLink) {
      if (kills.length) syncMobStateAfterDamage(kills, ctx);
      mergeLinkFollowers(picked, ctx, []);
      kills = [];
    } else {
      kills = mergeLinkFollowers(picked, ctx, kills);
    }
    return {
      cast: true,
      skillId: skill.id,
      level,
      actionDelayMs,
      lockMs,
      kills,
      enhanced: !!form.enhanced,
      skillLink: !!picked.isSkillLink,
    };
  }

  return {
    reset,
    invalidateAsyncCasts,
    stopSustainChannel: stopActiveSustainChannel,
    hasActiveSustain: () => !!activeSustainChannel,
    isCastLocked,
    pickNextCast,
    cast,
    resolveActionDelayMs,
    getCastLockUntil: () => castLockUntil,
    isProjectileSkill,
    listActiveCooldowns,
    isMobChainReserved,
    filterChainAvailableMobs,
    reserveChainMobs,
    releaseChainReservation,
    releaseMobFromChainReservation,
    tryNlMarkBurstOnDeath,
    foldAttackSegments,
  };
})();

if (typeof window !== 'undefined') {
  window.SkillCombat = SkillCombat;
}
