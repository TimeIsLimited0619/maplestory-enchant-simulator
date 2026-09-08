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
    if (!opts.keepCooldowns) lastNoCdAttackSlot = -1;
    chainReservations.clear();
    nextChainReservationId = 1;
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

  /** 無 CD buff：持續時間內視為仍生效，不重複施放 */
  function isBuffDurationActive(skillId, t = nowMs()) {
    if (typeof SkillModifiers !== 'undefined' && typeof SkillModifiers.hasBuff === 'function') {
      return !!SkillModifiers.hasBuff(skillId, t);
    }
    return false;
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

  function spendSkillHpCost(common) {
    const cost = resolveSkillHpCost(common);
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
    if (typeof SkillModifiers !== 'undefined'
      && typeof SkillModifiers.resolveCastCommon === 'function') {
      return SkillModifiers.resolveCastCommon(skill, level);
    }
    if (typeof SkillFormula === 'undefined') return null;
    return SkillFormula.evalCommon(skill?.common || {}, level);
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
      fx,
      plan,
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
        fxHit: fireBallOnTick ? undefined : null,
      });
      if (hit) pushUniqueMob(hitMobs, live);
      if (live.hp <= 0) {
        pushUniqueMob(kills, live);
        syncMobStateAfterDamage([live], ctx);
      }
    };

    let stopChannel = null;
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
        const maxTargets = Math.max(1, atkCommon.mobCount || 1);
        const list = () => liveMobTargets(resolveCastMobs(ctx), maxTargets, ctx, skill.id);
        const targets = list();

        // 持續引導：無攻擊目標（王死亡／轉階段無敵／清場）立刻中斷，避免空放鎖死
        if (sustain && !targets.length) {
          castLockUntil = nowMs();
          if (typeof Paperdoll !== 'undefined') Paperdoll.stopHuntSwingLoop?.();
          if (activeSustainChannel && activeSustainChannel.asyncId === asyncId) {
            activeSustainChannel = null;
          }
          if (typeof stopChannel === 'function') stopChannel();
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
        // 連鎖 2–4：每個 tick 都追加，避免整段引導只放一次
        if (opts.mergeLink && picked?.isSkillLink) {
          runWithDamageStackSession(ctx, tickSession, () => {
            mergeLinkFollowers(picked, ctx, []);
          });
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
        releaseAsyncCast(asyncId);
        syncMobStateAfterDamage(kills, ctx);
        finishAfterDamage(kills, hitMobs);
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
   */
  function usesBallVisualDamage(skill, plan) {
    if (!skill) return false;
    if (skill.ballVisualDamage === false) return false;
    if (plan?.chain || plan?.ballMode === 'orb' || plan?.instantBeam) return false;
    if (skill.ballVisualDamage === true) return true;
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

  function tryBallCastAttack(skill, skillForFx, atkCommon, fx, ctx, form, picked, finishAfterDamage, opts = {}) {
    if (typeof SkillBallCast === 'undefined' || !SkillBallCast.isBallCastSkill(skill, fx)) {
      return null;
    }
    const fieldEl = ctx.fieldEl || document.getElementById('idleHuntField');
    const plan = skill.ballCast || SkillBallCast.buildPlan(skill, fx);
    if (!plan) return null;
    const level = picked?.level || 1;
    const volleys = typeof SkillBallCast.resolveBulletVolleys === 'function'
      ? SkillBallCast.resolveBulletVolleys(skill, plan, level)
      : null;
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
    const headStackHits = volleys
      ? Math.max(1, Number(volleys.count) || 1)
      : Math.max(1, hitCommon.attackCount || 1);
    // 主技能層數先佔位，讓同步的連鎖接在上方（飛彈／多箭稍後命中仍用同層）
    const headStack = damageStackSlotsForSkill(ctx, skill.id, headStackHits, {
      forceReserve: true,
      session: stackSession,
    });

    // 飛箭純動畫：依目標數即時結算（技能連鎖分攤仍用 resolveSkillTargets）
    if (usesBallVisualDamage(skill, plan)) {
      const targets = (ballMobList() || [])
        .filter((m) => m && Number(m.hp) > 0)
        .slice(0, maxTargets);
      const dmgCommon = volleys
        ? { ...atkCommon, attackCount: Math.max(1, Number(volleys.count) || 1) }
        : hitCommon;

      runWithDamageStackSession(ctx, stackSession, () => {
        targets.forEach((mob) => {
          const live = resolveLiveMob(mob, ctx) || mob;
          if (!live || !(Number(live.hp) > 0)) {
            if (mob && mob.hp <= 0) {
              pushUniqueMob(kills, mob);
              syncMobStateAfterDamage([mob], ctx);
            }
            return;
          }
          const hit = dealHitsOnMob(skillForFx, dmgCommon, live, ctx, {
            segmentGapSec: opts.segmentGapSec,
            normalMobBonusPct: opts.normalMobBonusPct,
            forceCritTail: form.forceCritTail || 0,
            stackGroup: headStack.stackGroup,
            stackStartIndex: headStack.startIndex,
            stackSession,
          });
          if (hit) pushUniqueMob(hitMobs, live);
          if (live.hp <= 0) {
            pushUniqueMob(kills, live);
            syncMobStateAfterDamage([live], ctx);
          }
        });
      });

      if (!(ctx.quietFx || (typeof document !== 'undefined' && document.hidden))) {
        SkillBallCast.playBallCast({
          fieldEl,
          playerEl: ctx.playerEl,
          fx,
          plan,
          skill,
          level,
          mobs: targets,
          getMobs: () => targets.filter((m) => m && Number(m.hp) > 0),
          maxTargets,
          facingRight: ctxFacingRight(ctx),
          visualOnly: true,
          onDone: () => {},
        });
      }

      if (opts.mergeLink && picked) {
        runWithDamageStackSession(ctx, stackSession, () => {
          mergeLinkFollowers(picked, ctx, []);
        });
      }

      releaseAsyncCast(asyncId);
      if (kills.length) syncMobStateAfterDamage(kills, ctx);
      finishAfterDamage(kills, hitMobs);
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
            syncMobStateAfterDamage([live], ctx);
          }
        });
      },
      onDone: () => {
        if (chainReservationId != null) {
          releaseChainReservation(chainReservationId);
          chainReservationId = null;
        }
        if (!isAsyncCastLive(asyncId)) return;
        releaseAsyncCast(asyncId);
        // 掃殘留；已同步過的擊殺不會重複發獎（不在佇列內）
        syncMobStateAfterDamage(kills, ctx);
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

  function resolveCastMobs(ctx) {
    if (typeof ctx.getMobs === 'function') return ctx.getMobs() || [];
    return ctx.mobs || [];
  }

  function syncMobStateAfterDamage(kills, ctx) {
    if (typeof ctx.onMobStateSync === 'function') {
      ctx.onMobStateSync(kills || []);
      return;
    }
    if (typeof ctx.onProjectileResolve === 'function') {
      ctx.onProjectileResolve(kills || []);
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

  /** 套用超技能被動（傷害／怪物數／段數）與全域戰鬥規則後的施放 common */
  function combatCommonFor(skill, common) {
    let out = common;
    if (typeof SkillModifiers !== 'undefined') {
      if (typeof SkillModifiers.applySkillEnhance === 'function') {
        out = SkillModifiers.applySkillEnhance(skill?.id, out);
      }
      if (typeof SkillModifiers.applyGlobalCombatRules === 'function') {
        out = SkillModifiers.applyGlobalCombatRules(skill, out);
      }
    }
    return out;
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
      const pierce = !!skill.fx?.shootobj?.pierce;
      return pierce ? Math.max(1, atkCommon?.mobCount || 1) : 1;
    }
    return Math.max(1, atkCommon?.mobCount || 1);
  }

  function readCritMultiplier() {
    try {
      if (typeof CombatPower !== 'undefined' && typeof CombatPower.resolveCurrentInputs === 'function') {
        let snapshot = null;
        if (typeof EquipStatPanel !== 'undefined' && typeof EquipStatPanel.buildSnapshot === 'function') {
          snapshot = EquipStatPanel.buildSnapshot();
        }
        const combat = CombatPower.resolveCurrentInputs(snapshot);
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
    const base = UiCharacterInfo.getHuntHitDamage(!!mob.isBoss);
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
        hitDmg = SkillMobStatus.applyOutgoingDamageMods(mob, hitDmg);
      }
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

    // 2) 無 CD 的 buff／開關技（持續時間內不重複；開關技開啟後維持）
    const noCdBuff = candidates.find((c) => (
      c.isBuff && !c.hasCd && c.ready && !isBuffDurationActive(c.skill.id, t)
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
      });
    }
    return { dmg: 0, isCritical: false };
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
    } = opts;
    if (!mob) return false;
    const pct = (Number(damagePct) || 0) + (Number(damagePctBonus) || 0);
    const n = Math.max(1, Number(attackCount) || 1);
    const critTail = Math.max(0, Math.min(n, Math.floor(Number(forceCritTail) || 0)));
    const hitFx = fxHitOpt !== undefined ? fxHitOpt : null;
    if (hitFx?.length && typeof SkillEffectPlayer !== 'undefined') {
      SkillEffectPlayer.playOnMob(mob, hitFx);
    }

    let stackGroup = stackGroupOpt;
    let startIndex = Number.isFinite(stackStartOpt) ? Math.max(0, Math.floor(stackStartOpt)) : null;
    if (stackGroup == null || startIndex == null) {
      const slots = damageStackSlotsForSkill(ctx, skillId, n, { isolateStack });
      if (stackGroup == null) stackGroup = slots.stackGroup;
      if (startIndex == null) startIndex = slots.startIndex;
    }

    let any = false;
    for (let i = 0; i < n; i += 1) {
      const forceCritical = critTail > 0 && i >= n - critTail;
      const hit = rollSkillHit(!!mob.isBoss, pct, { forceCritical, critRateBonus });
      let dmg = hit.dmg;
      if (!(dmg > 0)) continue;
      // 技能專屬超技：B傷／無視防禦（以乘算近似，與結凍粉碎 IED 同路徑）
      const skillEn = (skillId && typeof SkillModifiers !== 'undefined'
        && typeof SkillModifiers.getSkillEnhance === 'function')
        ? SkillModifiers.getSkillEnhance(skillId)
        : null;
      if (skillEn) {
        if (mob.isBoss && (Number(skillEn.bdR) || 0) > 0) {
          dmg = Math.max(0, Math.floor(dmg * (1 + Number(skillEn.bdR) / 100)));
        }
        if ((Number(skillEn.ied) || 0) > 0) {
          dmg = Math.max(0, Math.floor(dmg * (1 + Number(skillEn.ied) / 100)));
        }
      }
      if (typeof SkillMobStatus !== 'undefined'
        && typeof SkillMobStatus.applyOutgoingDamageMods === 'function') {
        dmg = SkillMobStatus.applyOutgoingDamageMods(mob, dmg, {
          isCritical: !!hit.isCritical,
          skillId,
        });
      }
      if (!(dmg > 0)) continue;
      any = true;
      const dmgOpts = {
        multiHit: true,
        stackIndex: startIndex + i,
        stackGroup,
        ...(segmentGapSec != null
          ? { delay: i * segmentGapSec }
          : {}),
      };
      if (typeof showMobDamage === 'function') {
        showMobDamage(mob, dmg, hit.isCritical, dmgOpts);
      }
      if (typeof onDamage === 'function') onDamage(dmg);
      const finalDmg = (typeof IdleHunt !== 'undefined' && typeof IdleHunt.resolveMobHitDamage === 'function')
        ? IdleHunt.resolveMobHitDamage(mob, dmg)
        : dmg;
      mob.hp -= finalDmg;
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

  function notifyComboAndSync() {
    if (typeof SkillComboOrbs !== 'undefined') SkillComboOrbs.onAttackHit?.();
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
    cast(picked, { ...ctx, addAttackDepth: depth, skipAddAttack: false });
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
    });
    return mob.hp <= 0 ? [mob] : [];
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
        fxHit: fx.hit,
        multiHit,
        segmentGapSec,
        showMobDamage: ctx.showMobDamage,
        onDamage: ctx.onDamage,
        flashHit: ctx.flashHit,
        flashDie: ctx.flashDie,
        forceCritTail: opts.forceCritTail || 0,
        critRateBonus,
        skillId: skill?.id,
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
    spendSkillHpCost(baseCommon);
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
    if (shootFrames.length && typeof SkillEffectPlayer !== 'undefined'
      && typeof SkillEffectPlayer.playShootObj === 'function') {
      if (playCastFx) {
        if (fx.effect?.length) {
          SkillEffectPlayer.playOnPlayer(fx.effect, { playerEl: ctx.playerEl });
        }
        if (fx.effect0?.length) {
          SkillEffectPlayer.playOnPlayer(fx.effect0, { playerEl: ctx.playerEl });
        }
      }
      const fieldEl = ctx.fieldEl || document.getElementById('idleHuntField');
      const pierce = !!shootMeta.pierce;
      const maxTargets = pierce ? Math.max(1, atkCommon.mobCount || 1) : 1;
      const targets = resolveSkillTargets(ctx, skillId, maxTargets);
      const kills = [];
      const hitMobs = [];
      SkillEffectPlayer.playShootObj({
        fieldEl,
        playerEl: ctx.playerEl,
        mobs: targets,
        frames: shootFrames,
        startOffset: shootMeta.start || [-80, -60],
        startDelayMs: shootMeta.startDelayMs || 0,
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
          if (hit) pushUniqueMob(hitMobs, mob);
          if (mob.hp <= 0) pushUniqueMob(kills, mob);
        },
        onDone: () => {
          finishAfterDamage(kills, hitMobs);
          if (typeof ctx.onProjectileResolve === 'function') {
            ctx.onProjectileResolve(kills);
          }
        },
      });
      return { kills: [], deferredKills: true };
    }

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
    if (typeof UiCharacterInfo !== 'undefined') {
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
    const instructionNaturalMs = (typeof Paperdoll !== 'undefined'
      && typeof Paperdoll.getInstructionDurationMs === 'function')
      ? (Paperdoll.getInstructionDurationMs(skillAction) || 0)
      : 0;
    const instructionMs = scaleDurationByAttackSpeed(instructionNaturalMs, wzForDelay);
    const effectMs = scaleDurationByAttackSpeed(skillFxDurationMs(fx), wzForDelay);
    // 施放鎖定＝攻速後 delay／身體 instruction／施放特效 三者取長（含前搖後搖）
    const lockMs = scaleGameDelayMs(Math.max(actionDelayMs, instructionMs, effectMs, 30));
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

    if (!(ctx.quietFx || (typeof document !== 'undefined' && document.hidden))
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
    spendSkillHpCost(baseCommon);

    const timedBuff = typeof SkillBuffRuntime !== 'undefined'
      && SkillBuffRuntime.isTimedBuffSkill?.(skill, baseCommon);

    if (timedBuff) {
      if (typeof SkillEffectPlayer !== 'undefined') {
        if (fx.effect?.length) SkillEffectPlayer.playOnPlayer(fx.effect, { playerEl: ctx.playerEl });
        if (fx.effect0?.length) SkillEffectPlayer.playOnPlayer(fx.effect0, { playerEl: ctx.playerEl });
      }
      SkillBuffRuntime.activateTimedBuff(skill, level, baseCommon, ctx);
      if (typeof CharacterCombatPanel !== 'undefined') {
        CharacterCombatPanel.syncToCombatPower?.();
      }
      return {
        cast: true,
        skillId: skill.id,
        level,
        actionDelayMs,
        lockMs,
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
      notifyComboAndSync();
      const faKills = tryFinalAttack(ctx, skill.id, hitMobs);
      faKills.forEach((m) => pushUniqueMob(kills, m));
      const bzKills = tryBlizzardFinalAttack(ctx, skill.id, hitMobs);
      bzKills.forEach((m) => pushUniqueMob(kills, m));
      if (typeof SkillBuffRuntime !== 'undefined'
        && typeof SkillBuffRuntime.onSwordSkillCast === 'function') {
        const extra = SkillBuffRuntime.onSwordSkillCast(skill, ctx);
        if (extra?.kills?.length) {
          extra.kills.forEach((m) => pushUniqueMob(kills, m));
        }
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
    if (shootFrames.length && typeof SkillEffectPlayer !== 'undefined'
      && typeof SkillEffectPlayer.playShootObj === 'function') {
      if (fx.effect?.length) {
        SkillEffectPlayer.playOnPlayer(fx.effect, { playerEl: ctx.playerEl });
      }
      if (fx.effect0?.length) {
        SkillEffectPlayer.playOnPlayer(fx.effect0, { playerEl: ctx.playerEl });
      }

      const fieldEl = ctx.fieldEl || document.getElementById('idleHuntField');
      const pierce = !!shootMeta.pierce;
      const maxTargets = pierce
        ? Math.max(1, atkCommon.mobCount || 1)
        : 1;
      const targets = resolveSkillTargets(ctx, skill.id, maxTargets);
      const kills = [];
      const hitMobs = [];
      const asyncId = registerAsyncCast();

      SkillEffectPlayer.playShootObj({
        fieldEl,
        playerEl: ctx.playerEl,
        mobs: targets,
        frames: shootFrames,
        startOffset: shootMeta.start || [-80, -60],
        startDelayMs: shootMeta.startDelayMs || 0,
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
          if (hit) pushUniqueMob(hitMobs, mob);
          if (mob.hp <= 0) pushUniqueMob(kills, mob);
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
        if (!(ctx.quietFx || (typeof document !== 'undefined' && document.hidden))
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
  };
})();

if (typeof window !== 'undefined') {
  window.SkillCombat = SkillCombat;
}
