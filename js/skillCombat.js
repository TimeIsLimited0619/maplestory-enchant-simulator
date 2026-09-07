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

  function invalidateAsyncCasts() {
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
    if (!opts.keepCooldowns) {
      Object.keys(cooldowns).forEach((k) => { delete cooldowns[k]; });
    }
    castLockUntil = 0;
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
    if (skill.channelCast || skill.blizzardCast) return false;
    if (typeof SkillChannelCast !== 'undefined' && SkillChannelCast.isChannelCastSkill(skill, skill.fx)) {
      return false;
    }
    if (typeof SkillBlizzardCast !== 'undefined' && SkillBlizzardCast.isBlizzardCastSkill(skill, skill.fx)) {
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
    const asyncId = registerAsyncCast();
    SkillAreaCast.playAreaCast({
      playerEl: ctx.playerEl,
      fx,
      plan,
      onHit: () => {
        if (!isAsyncCastLive(asyncId)) return;
        const hitKills = dealSkillDamage(skill, formCommon, ctx, {
          segmentGapSec: opts.segmentGapSec,
          normalMobBonusPct: opts.normalMobBonusPct,
          skillForFx,
          forceCritTail: form.forceCritTail || 0,
        });
        hitKills.forEach((m) => {
          if (m && !kills.includes(m)) kills.push(m);
        });
      },
      onDone: () => {
        if (!isAsyncCastLive(asyncId)) return;
        releaseAsyncCast(asyncId);
        finishAfterDamage(kills);
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
    const kills = [];
    // 引導持續傷害在背景跑；施放鎖只沿用 cast() 的 lockMs，不佔滿 channel 時間（刻意可並行下一招）
    const asyncId = registerAsyncCast();

    SkillChannelCast.playChannelCast({
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
        liveMobTargets(resolveCastMobs(ctx), maxTargets, ctx, skill.id).forEach((mob) => {
          dealHitsOnMob(skillForFx, atkCommon, mob, ctx, {
            segmentGapSec: opts.segmentGapSec,
            normalMobBonusPct: opts.normalMobBonusPct,
            forceCritTail: form.forceCritTail || 0,
            fxHit: null,
          });
          if (mob.hp <= 0 && !kills.includes(mob)) kills.push(mob);
        });
        syncMobStateAfterDamage(kills, ctx);
      },
      onDone: () => {
        if (!isAsyncCastLive(asyncId)) return;
        releaseAsyncCast(asyncId);
        finishAfterDamage(kills);
        if (typeof ctx.onProjectileResolve === 'function') {
          ctx.onProjectileResolve(kills);
        }
      },
    });
    if (opts.mergeLink && picked) mergeLinkFollowers(picked, ctx, []);
    return { kills: [], deferredKills: true, channel: true };
  }

  function tryBlizzardCastAttack(skill, skillForFx, formCommon, fx, ctx, form, picked, finishAfterDamage, opts = {}) {
    if (typeof SkillBlizzardCast === 'undefined' || !SkillBlizzardCast.isBlizzardCastSkill(skill, fx)) {
      return null;
    }
    const fieldEl = ctx.fieldEl || document.getElementById('idleHuntField');
    const plan = skill.blizzardCast || SkillBlizzardCast.buildPlan(skill, fx);
    if (!plan) return null;
    const kills = [];
    const asyncId = registerAsyncCast();
    SkillBlizzardCast.playBlizzardCast({
      playerEl: ctx.playerEl,
      fieldEl,
      fx,
      plan,
      mobs: ctx.mobs,
      onHit: () => {
        if (!isAsyncCastLive(asyncId)) return;
        const hitKills = dealSkillDamage(skill, formCommon, ctx, {
          segmentGapSec: opts.segmentGapSec,
          normalMobBonusPct: opts.normalMobBonusPct,
          skillForFx,
          forceCritTail: form.forceCritTail || 0,
        });
        hitKills.forEach((m) => {
          if (m && !kills.includes(m)) kills.push(m);
        });
      },
      onDone: () => {
        if (!isAsyncCastLive(asyncId)) return;
        releaseAsyncCast(asyncId);
        finishAfterDamage(kills);
        if (typeof ctx.onProjectileResolve === 'function') {
          ctx.onProjectileResolve(kills);
        }
      },
    });
    if (opts.mergeLink && picked) mergeLinkFollowers(picked, ctx, []);
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

  function tryBallCastAttack(skill, skillForFx, atkCommon, fx, ctx, form, picked, finishAfterDamage, opts = {}) {
    if (typeof SkillBallCast === 'undefined' || !SkillBallCast.isBallCastSkill(skill, fx)) {
      return null;
    }
    const fieldEl = ctx.fieldEl || document.getElementById('idleHuntField');
    const plan = skill.ballCast || SkillBallCast.buildPlan(skill, fx);
    if (!plan) return null;
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
    const asyncId = registerAsyncCast();

    if (plan.ballMode === 'orb') {
      // 傷害與落點視覺同一時間軸（到達後 tick）
      SkillBallCast.playBallCast({
        fieldEl,
        playerEl: ctx.playerEl,
        fx,
        plan,
        mobs: ballMobList(),
        getMobs: ballMobList,
        maxTargets,
        facingRight: ctxFacingRight(ctx),
        visualOnly: false,
        onHit: (mob) => {
          if (!isAsyncCastLive(asyncId)) return;
          const live = resolveLiveMob(mob, ctx);
          if (!live) return;
          dealHitsOnMob(skillForFx, atkCommon, live, ctx, {
            segmentGapSec: opts.segmentGapSec,
            normalMobBonusPct: opts.normalMobBonusPct,
            forceCritTail: form.forceCritTail || 0,
          });
          if (live.hp <= 0 && !kills.includes(live)) kills.push(live);
          syncMobStateAfterDamage(kills, ctx);
        },
        onDone: () => {
          if (!isAsyncCastLive(asyncId)) return;
          releaseAsyncCast(asyncId);
          finishAfterDamage(kills);
          if (typeof ctx.onProjectileResolve === 'function') {
            ctx.onProjectileResolve(kills);
          }
        },
      });
      if (opts.mergeLink && picked) mergeLinkFollowers(picked, ctx, []);
      return { kills: [], deferredKills: true };
    }

    let chainReservationId = null;
    SkillBallCast.playBallCast({
      fieldEl,
      playerEl: ctx.playerEl,
      fx,
      plan,
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
      onHit: (mob) => {
        if (!isAsyncCastLive(asyncId)) return;
        if (plan.chain) releaseMobFromChainReservation(chainReservationId, mob);
        const live = resolveLiveMob(mob, ctx);
        if (!live) {
          if (mob && mob.hp <= 0 && !kills.includes(mob)) kills.push(mob);
          return;
        }
        dealHitsOnMob(skillForFx, atkCommon, live, ctx, {
          segmentGapSec: opts.segmentGapSec,
          normalMobBonusPct: opts.normalMobBonusPct,
          forceCritTail: form.forceCritTail || 0,
        });
        if (live.hp <= 0 && !kills.includes(live)) kills.push(live);
      },
      onDone: () => {
        if (chainReservationId != null) {
          releaseChainReservation(chainReservationId);
          chainReservationId = null;
        }
        if (!isAsyncCastLive(asyncId)) return;
        releaseAsyncCast(asyncId);
        if (kills.length) syncMobStateAfterDamage(kills, ctx);
        finishAfterDamage(kills);
        if (!plan.chain && !plan.instantBeam && typeof ctx.onProjectileResolve === 'function') {
          ctx.onProjectileResolve(kills);
        }
      },
    });
    if (opts.mergeLink && picked) mergeLinkFollowers(picked, ctx, []);
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
    const id = String(skillId || '');
    if (!id || typeof SkillCatalog === 'undefined') return null;
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
    if (isCastLocked(t)) return null;

    const loadout = CharacterSkills.currentLoadout?.() || [];
    const linkIds = (typeof CharacterSkills.currentSkillLink === 'function'
      ? CharacterSkills.currentSkillLink()
      : [])
      .map((id) => (id ? String(id) : null));
    const linkSet = new Set(linkIds.filter(Boolean));

    function makeCandidate(id, slot) {
      if (!id) return null;
      const skill = SkillCatalog.getSkill(id);
      if (!skill || (skill.type !== 'active' && skill.type !== 'buff') || !skill.equipable) return null;
      const level = CharacterSkills.getLevel(id);
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

    // 1) 有 CD 的 buff
    const cdBuff = candidates.find((c) => c.isBuff && c.hasCd && c.ready);
    if (cdBuff) return cdBuff;

    // 2) 無 CD 的 buff（持續時間內不重複）
    const noCdBuff = candidates.find((c) => (
      c.isBuff && !c.hasCd && c.ready && !isBuffDurationActive(c.skill.id, t)
    ));
    if (noCdBuff) return noCdBuff;

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
    } = opts;
    if (!mob) return false;
    const pct = (Number(damagePct) || 0) + (Number(damagePctBonus) || 0);
    const n = Math.max(1, Number(attackCount) || 1);
    const critTail = Math.max(0, Math.min(n, Math.floor(Number(forceCritTail) || 0)));
    const hitFx = fxHitOpt !== undefined ? fxHitOpt : null;
    if (hitFx?.length && typeof SkillEffectPlayer !== 'undefined') {
      SkillEffectPlayer.playOnMob(mob, hitFx);
    }
    let any = false;
    for (let i = 0; i < n; i += 1) {
      const forceCritical = critTail > 0 && i >= n - critTail;
      const hit = rollSkillHit(!!mob.isBoss, pct, { forceCritical, critRateBonus });
      let dmg = hit.dmg;
      if (!(dmg > 0)) continue;
      if (typeof SkillMobStatus !== 'undefined'
        && typeof SkillMobStatus.applyOutgoingDamageMods === 'function') {
        dmg = SkillMobStatus.applyOutgoingDamageMods(mob, dmg);
      }
      if (!(dmg > 0)) continue;
      any = true;
      const dmgOpts = multiHit
        ? {
          multiHit: true,
          stackIndex: i,
          ...(segmentGapSec != null
            ? { delay: i * segmentGapSec }
            : {}),
        }
        : {};
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

  const FINAL_ATTACK_BASIC_ID = '1100002';
  const FINAL_ATTACK_ADV_ID = '1120013';
  const FINAL_ATTACK_WEAPON_TYPES = new Set(['單手劍', '單手斧', '雙手劍', '雙手斧']);
  /** WZ finalAttack→1100002 的英雄直接攻擊技（110／111／112.img） */
  const FINAL_ATTACK_TRIGGER_IDS = new Set([
    '1101011', '1101014',
    '1111010', '1111012', '1111016',
    '1121008', '1121052',
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

  function isFinalAttackWeaponEquipped() {
    return FINAL_ATTACK_WEAPON_TYPES.has(resolveEquippedWeaponType());
  }

  function skillTriggersFinalAttack(triggerSkillId) {
    const id = String(triggerSkillId || '');
    if (!id) return false;
    const skill = typeof SkillCatalog !== 'undefined' ? SkillCatalog.getSkill(id) : null;
    if (skill?.finalAttackId) return true;
    return FINAL_ATTACK_TRIGGER_IDS.has(id);
  }

  function resolveFinalAttackPassive() {
    if (typeof CharacterSkills === 'undefined' || typeof SkillCatalog === 'undefined') {
      return null;
    }
    if (CharacterSkills.getLevel(FINAL_ATTACK_ADV_ID) > 0) {
      return {
        skill: SkillCatalog.getSkill(FINAL_ATTACK_ADV_ID),
        level: CharacterSkills.getLevel(FINAL_ATTACK_ADV_ID),
      };
    }
    if (CharacterSkills.getLevel(FINAL_ATTACK_BASIC_ID) > 0) {
      return {
        skill: SkillCatalog.getSkill(FINAL_ATTACK_BASIC_ID),
        level: CharacterSkills.getLevel(FINAL_ATTACK_BASIC_ID),
      };
    }
    return null;
  }

  /** 優先最大 HP 的 Boss；無 Boss 時取最大 HP 的一般怪 */
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

  /** 終極攻擊／進階終極攻擊追擊 */
  function tryFinalAttack(ctx, triggerSkillId) {
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
    if (!(prop > 0) || Math.random() * 100 >= prop) return [];

    const mob = resolveFinalAttackTarget(ctx);
    if (!mob) return [];

    const attackCount = Math.max(1, (Number(st.attackCount) || 1) + (Number(en.attackCount) || 0));
    const damagePct = (Number(st.damagePct) || 0) * (1 + (Number(en.damR) || 0) / 100);
    const kills = [];
    applyHitsToMob(mob, {
      damagePct,
      attackCount,
      fxHit: skill.fx?.hit,
      multiHit: attackCount > 1,
      showMobDamage: ctx.showMobDamage,
      onDamage: ctx.onDamage,
      flashHit: ctx.flashHit,
      flashDie: ctx.flashDie,
    });
    if (mob.hp <= 0) kills.push(mob);
    return kills;
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

    mobs.forEach((mob) => {
      if (!mob) return;
      const bonus = (!mob.isBoss && normalBonus > 0) ? normalBonus : 0;
      applyHitsToMob(mob, {
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
      });
      if (mob.hp <= 0) kills.push(mob);
    });
    return kills;
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

    const form = resolveComboEnhancedForm(skill, level, baseCommon);
    const skillForFx = form.skillForFx || skill;
    const formCommon = form.common || baseCommon;
    const fx = skillForFx.fx || {};
    const atkCommon = combatCommonFor(skill, formCommon);
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

    const finishAfterDamage = (kills) => {
      if (!linkOpts.silentCombo) notifyComboAndSync();
      const faKills = tryFinalAttack(ctx, skillId);
      faKills.forEach((m) => {
        if (m && !kills.includes(m)) kills.push(m);
      });
      // 意念只由主技能／非 silent 路徑觸發，避免連鎖同幀連續 proc
      if (!linkOpts.silentCombo
        && typeof SkillBuffRuntime !== 'undefined'
        && typeof SkillBuffRuntime.onSwordSkillCast === 'function') {
        const extra = SkillBuffRuntime.onSwordSkillCast(skill, ctx);
        if (extra?.kills?.length) {
          extra.kills.forEach((m) => {
            if (m && !kills.includes(m)) kills.push(m);
          });
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
          dealHitsOnMob(skillForFx, atkCommon, mob, ctx, {
            segmentGapSec,
            normalMobBonusPct,
            forceCritTail: form.forceCritTail || 0,
          });
          if (mob.hp <= 0 && !kills.includes(mob)) kills.push(mob);
        },
        onDone: () => {
          finishAfterDamage(kills);
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
      if (fx.effect?.length) SkillEffectPlayer.playOnPlayer(fx.effect, { playerEl: ctx.playerEl });
      if (fx.effect0?.length) SkillEffectPlayer.playOnPlayer(fx.effect0, { playerEl: ctx.playerEl });
    }
    const kills = finishAfterDamage(dealSkillDamage(skill, formCommon, ctx, {
      segmentGapSec,
      normalMobBonusPct,
      skillForFx,
      forceCritTail: form.forceCritTail || 0,
    }));
    return { kills };
  }

  function mergeLinkFollowers(picked, ctx, intoKills) {
    const followers = picked?.skillLinkFollowers;
    if (!picked?.isSkillLink || !Array.isArray(followers) || !followers.length) return intoKills;
    const kills = Array.isArray(intoKills) ? intoKills : [];
    let anyFollower = false;
    followers.forEach((id) => {
      anyFollower = true;
      const extra = castLinkFollower(id, ctx, { silentCombo: true });
      (extra.kills || []).forEach((m) => {
        if (m && !kills.includes(m)) kills.push(m);
      });
    });
    if (anyFollower) notifyComboAndSync();
    // 延遲主技能路徑：follower 即時擊殺立刻清佇列，避免普攻打到屍體
    if (kills.length) syncMobStateAfterDamage(kills, ctx);
    return kills;
  }

  function cast(picked, ctx = {}) {
    if (!picked?.skill || !picked.common) return { cast: false };
    const t = nowMs();
    if (isCastLocked(t)) return { cast: false };

    // 連鎖／多段同一施放週期共用傷害公式快取
    if (typeof UiCharacterInfo !== 'undefined') {
      UiCharacterInfo.invalidateHuntCombatCache?.();
    }

    initSkillLinkTargeting(ctx, picked);

    const { skill, level, common: baseCommon } = picked;
    const form = resolveComboEnhancedForm(skill, level, baseCommon);
    const skillForFx = form.skillForFx || skill;
    const formCommon = form.common || baseCommon;

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

    if (!(ctx.quietFx || (typeof document !== 'undefined' && document.hidden))
      && typeof Paperdoll !== 'undefined' && typeof Paperdoll.playHuntSwing === 'function') {
      // 揮砍時長對齊鎖定，避免動作被壓短後下一招搶跑
      Paperdoll.playHuntSwing(lockMs, skillAction);
    }

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

    const finishAfterDamage = (kills) => {
      notifyComboAndSync();
      const faKills = tryFinalAttack(ctx, skill.id);
      faKills.forEach((m) => {
        if (m && !kills.includes(m)) kills.push(m);
      });
      if (typeof SkillBuffRuntime !== 'undefined'
        && typeof SkillBuffRuntime.onSwordSkillCast === 'function') {
        const extra = SkillBuffRuntime.onSwordSkillCast(skill, ctx);
        if (extra?.kills?.length) {
          extra.kills.forEach((m) => {
            if (m && !kills.includes(m)) kills.push(m);
          });
        }
      }
      return kills;
    };

    const finishDamage = () => {
      const kills = dealSkillDamage(skill, formCommon, ctx, {
        segmentGapSec,
        normalMobBonusPct,
        skillForFx,
        forceCritTail: form.forceCritTail || 0,
      });
      return finishAfterDamage(kills);
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
          dealHitsOnMob(skillForFx, atkCommon, mob, ctx, {
            segmentGapSec,
            normalMobBonusPct,
            forceCritTail: form.forceCritTail || 0,
          });
          if (mob.hp <= 0 && !kills.includes(mob)) kills.push(mob);
        },
        onDone: () => {
          if (!isAsyncCastLive(asyncId)) return;
          releaseAsyncCast(asyncId);
          finishAfterDamage(kills);
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
      return {
        cast: true,
        skillId: skill.id,
        level,
        actionDelayMs,
        lockMs,
        kills: [],
        deferredKills: true,
        channel: true,
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
      if (fx.effect?.length) SkillEffectPlayer.playOnPlayer(fx.effect, { playerEl: ctx.playerEl });
      if (fx.effect0?.length) SkillEffectPlayer.playOnPlayer(fx.effect0, { playerEl: ctx.playerEl });
    }

    let kills = finishDamage();
    kills = mergeLinkFollowers(picked, ctx, kills);
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
