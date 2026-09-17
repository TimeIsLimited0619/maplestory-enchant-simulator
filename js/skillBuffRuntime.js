/**
 * 時限 Buff／劍士意念 afterimage／法師召喚物 autotick
 */
const SkillBuffRuntime = (() => {
  /** @type {null | object} 劍士意念（單一） */
  let afterimage = null;
  /** @type {object[]} 法師召喚物（可同時多個） */
  let summons = [];

  /** 召喚物場上定位（依技能 id） */
  const SUMMON_PLACEMENT = {
    2221005: { slot: 'feet-behind', classSuffix: 'summon-ice', zIndex: 38, behindExtra: -42 },
    2211011: { slot: 'head', classSuffix: 'summon-orbit', zIndex: 52, headLift: -48 },
    4111007: { slot: 'target-feet', classSuffix: 'nl-flare', zIndex: 36, behind: true },
    65121052: {
      slot: 'player-feet',
      classSuffix: 'ab-supernova',
      zIndex: 28,
      behind: true,
      loopFrom: 6,
      endFx: 'special',
      skipAttackAnim: true,
    },
    400051018: {
      slot: 'player-feet',
      classSuffix: 'ab-spotlight',
      zIndex: 40,
      followPlayer: true,
      attachToPlayer: false,
      behind: true,
      skipAttackAnim: true,
    },
    400001064: { slot: 'player-feet', classSuffix: 'erda-fountain', zIndex: 34, behind: true },
    400001039: { slot: 'target-feet', classSuffix: 'spider-mirror', zIndex: 36, behind: true },
    400001040: { slot: 'target-feet', classSuffix: 'spider-mirror', zIndex: 36, behind: true },
    400001010: { slot: 'player-feet', classSuffix: 'blitz-shield', zIndex: 48, followPlayer: true, attachToPlayer: true },
    400011001: { slot: 'feet-behind', classSuffix: 'burning-soul', zIndex: 44, followPlayer: true, behindExtra: -52 },
    400011000: { slot: 'player-feet', classSuffix: 'aura-weapon', zIndex: 46, followPlayer: true, attachToPlayer: true },
    400011073: { slot: 'player-feet', classSuffix: 'combo-instinct', zIndex: 50 },
    400041038: { slot: 'target-feet', classSuffix: 'nl-secret-book', zIndex: 36, behind: true, skipAttackAnim: true },
    400041020: { slot: 'target-feet', classSuffix: 'nl-wind-shuriken', zIndex: 38, behind: true },
    400031007: { slot: 'player-feet', classSuffix: 'elemental-ghost', zIndex: 42, followPlayer: true, attachToPlayer: true },
    400031044: {
      slot: 'player-feet',
      classSuffix: 'royal-knights',
      zIndex: 41,
      followPlayer: true,
      attachToPlayer: false,
      behind: true,
    },
    400021002: {
      slot: 'player-feet',
      classSuffix: 'ice-age',
      zIndex: 30,
      behind: true,
      loopFrom: 11,
      skipAttackAnim: true,
    },
    400021067: {
      slot: 'feet-behind',
      classSuffix: 'spirit-snow',
      zIndex: 38,
      behindExtra: -36,
    },
  };

  const ERDA_FOUNTAIN_ID = '400001064';
  const SPIDER_MIRROR_ID = '400001039';
  const SPIDER_SUMMON_ID = '400001040';
  const BLITZ_SHIELD_ID = '400001010';
  const BLITZ_SHIELD_BOOM_ID = '400001011';
  const AURA_WEAPON_ID = '400011000';
  const AURA_WEAPON_BALL_ID = '400010000';
  const BURNING_SOUL_ID = '400011001';
  const COMBO_INSTINCT_ID = '400011073';
  const COMBO_INSTINCT_CRACK_ID = '400011074';
  /** 空間傷痕三道：074 → 075 → 076（s=3） */
  const COMBO_INSTINCT_CRACK_IDS = ['400011074', '400011075', '400011076'];
  const RAGING_BLOW_IDS = ['1121008', '1120017', '1141000', '1141001'];
  const SWORD_ILLUSION_ID = '400011124';
  const SECRET_BOOK_ID = '400041038';
  const WIND_SHURIKEN_ID = '400041020';
  const SPREAD_THROW_ID = '400041001';
  const THROW_BLASTING_ID = '400041061';
  const READY_TO_DIE_ID = '400041032';
  const ULTIMATE_DARKSIGHT_ID = '400001023';
  const ELEMENTAL_GHOST_ID = '400031007';
  const ELEMENTAL_BLOSSOM_ID = '400031011';
  const ROYAL_KNIGHTS_ID = '400031044';
  const ROYAL_KNIGHTS_HIT_ID = '400031045';
  const CRITICAL_REINFORCE_ID = '400031023';
  const FREUD_BLESSING_ID = '400001024';
  const FREUD_BLESSING_STAT_ID = '400001029';
  const FREUD_BLESSING_FX_IDS = [
    '400001025', '400001026', '400001027', '400001028', '400001029', '400001030',
  ];
  const SPOTLIGHT_ID = '400051018';
  const SPOTLIGHT_STAT_ID = '400051027';
  const GRANDIS_GODDESS_ID = '400001047';
  const ICE_AGE_ID = '400021002';
  const SPIRIT_OF_SNOW_ID = '400021067';
  const ARCANA_OVERRIDE_ID = '400001021';
  const ICE_AGE_LIGHTNING_TRIGGER_IDS = [
    '2201005', '2211011', '2221006', '2221052',
    '400021030', '400021031', '400021040', '400021094',
  ];

  /** 噴泉爆發中：自身擊殺不回填累積擊殺 */
  let suppressFountainKillGain = 0;

  const V_FORCE_TIMED_IDS = new Set([
    ERDA_FOUNTAIN_ID, BLITZ_SHIELD_ID, BURNING_SOUL_ID, COMBO_INSTINCT_ID, AURA_WEAPON_ID,
    SPREAD_THROW_ID, THROW_BLASTING_ID, SECRET_BOOK_ID, READY_TO_DIE_ID, ULTIMATE_DARKSIGHT_ID,
    ELEMENTAL_GHOST_ID, ROYAL_KNIGHTS_ID, CRITICAL_REINFORCE_ID, FREUD_BLESSING_ID,
    SPOTLIGHT_ID, GRANDIS_GODDESS_ID, ICE_AGE_ID, SPIRIT_OF_SNOW_ID, ARCANA_OVERRIDE_ID,
  ]);
  const V_NEVER_TIMED_IDS = new Set([SWORD_ILLUSION_ID, SPIDER_MIRROR_ID, WIND_SHURIKEN_ID, '400031000']);

  function nowMs() {
    return (typeof performance !== 'undefined' && performance.now)
      ? performance.now()
      : Date.now();
  }

  /** 真實時間：跟隨 GM 遊戲倍速（與 CD／castLock／DoT 遊戲時間對齊） */
  function scaleGameMs(ms) {
    const base = Math.max(0, Number(ms) || 0);
    if (typeof IdleHunt !== 'undefined' && typeof IdleHunt.scaleDelayMs === 'function') {
      return IdleHunt.scaleDelayMs(base);
    }
    return base;
  }

  function summonClassName(placement) {
    const suffix = placement?.classSuffix;
    return suffix
      ? `idle-skill-fx-stage idle-skill-fx-stage--summon idle-skill-fx-stage--${suffix}`
      : 'idle-skill-fx-stage idle-skill-fx-stage--summon';
  }

  function clearSummonVisualState(state) {
    if (!state) return;
    if (typeof state.stopFlyer === 'function') {
      try { state.stopFlyer(); } catch (_) { /* ignore */ }
      state.stopFlyer = null;
    }
    if (state.standFxId != null && typeof SkillEffectPlayer !== 'undefined') {
      SkillEffectPlayer.stopFx?.(state.standFxId);
    }
    (state.extraStandFxIds || []).forEach((id) => {
      if (id != null && typeof SkillEffectPlayer !== 'undefined') {
        SkillEffectPlayer.stopFx?.(id);
      }
    });
    state.standFxId = null;
    state.extraStandFxIds = [];
  }

  function clearSummonBySkillId(skillId) {
    const id = String(skillId || '');
    if (!id) return;
    summons = summons.filter((s) => {
      if (String(s.parentSkillId) === id) {
        clearSummonVisualState(s);
        return false;
      }
      return true;
    });
  }

  function clearAllSummons() {
    summons.forEach(clearSummonVisualState);
    summons = [];
  }

  function reset() {
    clearAllSummons();
    clearAfterimage();
    if (typeof SkillModifiers !== 'undefined') SkillModifiers.reset?.();
    if (typeof SkillMobStatus !== 'undefined') SkillMobStatus.clearAll?.();
  }

  function clearAfterimage() {
    afterimage = null;
  }

  function resolveSummonAttacks(skill, summon, opts = {}) {
    const names = Array.isArray(opts.onlyNames) ? opts.onlyNames : null;
    const fromParent = (skill?.fx?.summonAttacks || [])
      .filter((a) => !names || names.includes(String(a?.name || '')))
      .map((a) => a?.frames)
      .filter((f) => Array.isArray(f) && f.length);
    if (fromParent.length) return fromParent;
    return (summon?.fx?.summonAttacks || [])
      .filter((a) => !names || names.includes(String(a?.name || '')))
      .map((a) => a?.frames)
      .filter((f) => Array.isArray(f) && f.length);
  }

  function resolveSummonVisual(skill, summon) {
    return skill?.fx?.summonVisual || summon?.fx?.summonVisual || null;
  }

  function resolveSummonPlacement(skill, stat) {
    const cfg = SUMMON_PLACEMENT[String(skill?.id)] || null;
    return {
      slot: cfg?.slot || 'default',
      classSuffix: cfg?.classSuffix || '',
      zIndex: cfg?.zIndex ?? 40,
      behind: !!cfg?.behind,
      followPlayer: !!cfg?.followPlayer,
      attachToPlayer: cfg?.attachToPlayer != null ? !!cfg.attachToPlayer : false,
      behindExtra: cfg?.behindExtra ?? 0,
      headLift: cfg?.headLift ?? 0,
      offsetX: Number(stat?.s) || 0,
      offsetY: Number(stat?.v) || 0,
      loopFrom: Number.isFinite(Number(cfg?.loopFrom)) ? Math.floor(Number(cfg.loopFrom)) : 0,
      endFx: cfg?.endFx || '',
      skipAttackAnim: !!cfg?.skipAttackAnim,
    };
  }

  function summonFieldPoint(fieldEl, playerEl, placement, ctx) {
    if (!fieldEl || !playerEl) return { x: 160, y: 220 };
    const fr = fieldEl.getBoundingClientRect();
    const pr = playerEl.getBoundingClientRect();
    const toField = (localX, localY) => ({
      x: Math.round(pr.left - fr.left + localX),
      y: Math.round(pr.top - fr.top + localY),
    });
    const facingRight = (typeof SkillEffectPlayer !== 'undefined'
      && SkillEffectPlayer.playerFacingRight)
      ? SkillEffectPlayer.playerFacingRight(playerEl)
      : !playerEl.classList?.contains('is-flip-x');

    let feet = { x: pr.width * 0.5, y: pr.height * 0.78 };
    if (typeof Paperdoll !== 'undefined' && typeof Paperdoll.getHuntFeetAnchor === 'function') {
      const a = Paperdoll.getHuntFeetAnchor(playerEl);
      if (a && Number.isFinite(a.x) && Number.isFinite(a.y)) {
        feet = { x: a.x, y: a.y };
      }
    }

    if (placement.slot === 'target-feet') {
      const mobs = resolveSummonTargets(ctx, 1);
      const mob = mobs[0];
      if (mob && fieldEl) {
        const uid = mob.uid != null ? String(mob.uid) : '';
        const actor = uid ? fieldEl.querySelector(`.idle-actor--mob[data-uid="${uid}"]`) : null;
        if (actor) {
          const fr = fieldEl.getBoundingClientRect();
          const ar = actor.getBoundingClientRect();
          return {
            x: Math.round(ar.left - fr.left + ar.width * 0.5),
            y: Math.round(ar.top - fr.top + ar.height * 0.92),
          };
        }
        if (typeof SkillEffectPlayer !== 'undefined'
          && typeof SkillEffectPlayer.fieldPointFromMob === 'function') {
          const mp = SkillEffectPlayer.fieldPointFromMob(fieldEl, mob);
          if (mp && Number.isFinite(mp.x) && Number.isFinite(mp.y)) {
            return { x: mp.x, y: mp.y + 28 };
          }
        }
      }
      const ox = 90;
      return toField(feet.x + (facingRight ? ox : -ox), feet.y);
    }

    if (placement.slot === 'player-feet') {
      return toField(feet.x, feet.y);
    }

    if (placement.slot === 'feet-behind') {
      // 身後：朝右時偏左、朝左時偏右
      const ox = Number(placement.offsetX) || 0;
      const extra = Number(placement.behindExtra) || 0;
      const dx = ox + extra;
      return toField(feet.x + (facingRight ? dx : -dx), feet.y);
    }

    if (placement.slot === 'head') {
      let head = { x: feet.x, y: feet.y - 90 };
      if (typeof Paperdoll !== 'undefined' && typeof Paperdoll.getHuntHitAnchor === 'function') {
        const hit = Paperdoll.getHuntHitAnchor(playerEl);
        if (hit && Number.isFinite(hit.x) && Number.isFinite(hit.y)) {
          head = {
            x: hit.x,
            y: hit.y + (Number(placement.headLift) || -48),
          };
        }
      }
      const ox = Number(placement.offsetX) || 0;
      return toField(head.x - (facingRight ? ox : -ox), head.y);
    }

    const ox = Number(placement.offsetX) || 80;
    const oy = Number(placement.offsetY) || -40;
    return {
      x: Math.round(pr.left - fr.left + pr.width * 0.5 - (facingRight ? ox : -ox)),
      y: Math.round(pr.top - fr.top + pr.height * 0.85 + oy),
    };
  }

  function placeSummonVisual(visual, fieldEl, playerEl, placement, ctx) {
    if (!visual || !fieldEl || typeof SkillEffectPlayer === 'undefined') return null;
    const pt = summonFieldPoint(fieldEl, playerEl, placement, ctx);
    const className = summonClassName(placement);
    const stand = visual.stand || visual.move || null;
    const summoned = visual.summoned || null;
    const parentSkillId = placement.parentSkillId || '';
    const facingRight = (typeof SkillEffectPlayer !== 'undefined'
      && SkillEffectPlayer.playerFacingRight)
      ? SkillEffectPlayer.playerFacingRight(playerEl)
      : !playerEl?.classList?.contains('is-flip-x');

    const isLiveSummonVisual = (state) => {
      if (!state) return false;
      return state.mode === 'summon'
        || state.mode === 'killBurst'
        || state.mode === 'onCast'
        || state.mode === 'ground-fx';
    };

    const attachToPlayer = !!(placement.followPlayer && placement.attachToPlayer);
    const followOnField = !!(placement.followPlayer && !placement.attachToPlayer && playerEl);
    const resolveFollow = followOnField
      ? () => summonFieldPoint(fieldEl, playerEl, placement, ctx)
      : null;

    if (attachToPlayer && playerEl && typeof SkillEffectPlayer.playOnPlayer === 'function') {
      const startStand = () => {
        const frames = stand;
        if (!frames?.length) return null;
        return SkillEffectPlayer.playOnPlayer(frames, {
          fieldEl,
          playerEl,
          loop: true,
          className,
          zIndex: placement.zIndex,
          behind: !!placement.behind,
        });
      };
      if (summoned?.length) {
        SkillEffectPlayer.playOnPlayer(summoned, {
          fieldEl,
          playerEl,
          loop: false,
          className,
          zIndex: placement.zIndex,
          behind: !!placement.behind,
        });
        const dur = SkillEffectPlayer.framesDurationMs?.(summoned) || 400;
        setTimeout(() => {
          const state = summons.find((s) => String(s.parentSkillId) === String(parentSkillId));
          if (!isLiveSummonVisual(state)) return;
          state.standFxId = startStand();
        }, Math.max(60, dur));
        return { x: pt.x, y: pt.y, standFxId: null, facingRight, followPlayer: true };
      }
      return { x: pt.x, y: pt.y, standFxId: startStand(), facingRight, followPlayer: true };
    }

    const startStand = () => {
      if (!stand?.length) return null;
      return SkillEffectPlayer.playAtField({
        fieldEl,
        frames: stand,
        x: pt.x,
        y: pt.y,
        loop: true,
        loopFrom: Number.isFinite(Number(placement.loopFrom))
          ? Math.max(0, Math.floor(Number(placement.loopFrom)))
          : 0,
        className,
        mirrorX: facingRight,
        zIndex: placement.zIndex,
        behind: !!placement.behind,
        resolveAnchor: resolveFollow,
      });
    };

    if (summoned?.length) {
      SkillEffectPlayer.playAtField({
        fieldEl,
        frames: summoned,
        x: pt.x,
        y: pt.y,
        loop: false,
        className,
        mirrorX: facingRight,
        zIndex: placement.zIndex,
        behind: !!placement.behind,
        resolveAnchor: resolveFollow,
        onDone: () => {},
      });
      const dur = SkillEffectPlayer.framesDurationMs?.(summoned) || 400;
      setTimeout(() => {
        const state = summons.find((s) => String(s.parentSkillId) === String(parentSkillId));
        if (!state || (
          state.mode !== 'summon'
          && state.mode !== 'killBurst'
          && state.mode !== 'onCast'
          && state.mode !== 'ground-fx'
        )) return;
        state.standFxId = startStand();
      }, Math.max(60, dur));
      return { x: pt.x, y: pt.y, standFxId: null, facingRight };
    }

    const standFxId = startStand();
    return { x: pt.x, y: pt.y, standFxId, facingRight };
  }

  function skillFxFrames(skill, key) {
    if (!skill?.fx || !key) return null;
    if (key === 'effect') return skill.fx.effect || null;
    if (key === 'special') return skill.fx.special?.frames || skill.fx.special || null;
    if (key === 'hit') return skill.fx.hit || null;
    return null;
  }

  function skipLeadDummyFrames(frames) {
    const list = Array.isArray(frames) ? frames.slice() : [];
    while (list.length
      && Number(list[0]?.origin?.[0]) === 0
      && Number(list[0]?.origin?.[1]) === 0) {
      list.shift();
    }
    return list;
  }

  function playCoverScreen(fieldEl, frames, opts = {}) {
    const list = skipLeadDummyFrames(frames);
    if (!fieldEl || !list.length || typeof SkillEffectPlayer === 'undefined') return null;
    const mid = {
      x: Math.round((fieldEl.clientWidth || 800) * 0.5),
      y: Math.round((fieldEl.clientHeight || 500) * 0.5),
    };
    return SkillEffectPlayer.playAtField({
      fieldEl,
      frames: list,
      x: mid.x,
      y: mid.y,
      loop: !!opts.loop,
      loopFrom: Number.isFinite(Number(opts.loopFrom)) ? Math.max(0, Math.floor(Number(opts.loopFrom))) : 0,
      coverField: true,
      coverW: fieldEl.clientWidth || 800,
      coverH: fieldEl.clientHeight || 500,
      className: opts.className
        || 'idle-skill-fx-stage idle-skill-fx-stage--screen idle-skill-fx-stage--royal-knights',
      zIndex: opts.zIndex ?? 16,
      behind: opts.behind !== false,
      forcePlay: true,
    });
  }

  function playSummonEndFx(state) {
    const frames = state?.endFrames;
    const fieldEl = state?.fieldEl;
    if (!frames?.length || !fieldEl || typeof SkillEffectPlayer === 'undefined') return;
    if (typeof SkillEffectPlayer.playAtField !== 'function') return;
    if (state.coverField) {
      playCoverScreen(fieldEl, frames, {
        loop: false,
        className: 'idle-skill-fx-stage idle-skill-fx-stage--screen idle-skill-fx-stage--royal-knights',
        zIndex: 16,
        behind: true,
      });
      return;
    }
    const suffix = state.placement?.classSuffix;
    const className = suffix
      ? `idle-skill-fx-stage idle-skill-fx-stage--summon idle-skill-fx-stage--${suffix}`
      : 'idle-skill-fx-stage idle-skill-fx-stage--summon';
    const secretBook = String(state.parentSkillId || '') === SECRET_BOOK_ID;
    let x = Number(state.anchorX);
    let y = Number(state.anchorY);
    if (state.followPlayer && fieldEl) {
      const pt = summonFieldPoint(fieldEl, state.playerEl || null, state.placement || { slot: 'player-feet' }, {});
      if (pt && Number.isFinite(pt.x)) {
        x = pt.x;
        y = pt.y;
      }
    }
    SkillEffectPlayer.playAtField({
      fieldEl,
      frames,
      x,
      y,
      loop: false,
      className,
      mirrorX: state.facingRight != null ? !!state.facingRight : true,
      zIndex: secretBook ? 56 : state.placement?.zIndex,
      behind: secretBook ? false : !!state.placement?.behind,
      forcePlay: true,
    });
  }

  function detonateSummon(state, ctx, t = nowMs()) {
    if (!state) return null;
    const result = (state.explodeOnExpire && ctx)
      ? explodeSummon(state, ctx, t)
      : null;
    clearSummonVisualState(state);
    playSummonEndFx(state);
    return result;
  }

  function expireSummons(t = nowMs(), ctx = null) {
    summons = summons.filter((s) => {
      if (t >= s.expiresAt) {
        detonateSummon(s, ctx, t);
        return false;
      }
      return true;
    });
  }

  function tick(t = nowMs(), ctx = null) {
    expireSummons(t, ctx);

    if (afterimage) {
      if (t >= afterimage.expiresAt
        || (afterimage.maxProcs > 0 && afterimage.procCount >= afterimage.maxProcs)) {
        afterimage = null;
      }
    }

    if (!ctx || !summons.length) return null;

    let lastResult = null;
    summons.forEach((state) => {
      if (state.mode !== 'summon') return;
      if (state.maxProcs > 0 && state.procCount >= state.maxProcs) return;
      if (state.lastProcAt > 0 && (t - state.lastProcAt) < state.intervalMs) return;
      if (String(state.parentSkillId) === SECRET_BOOK_ID) {
        lastResult = procSecretBookStars(state, ctx, t);
        return;
      }
      if (String(state.parentSkillId) === SPOTLIGHT_ID) {
        lastResult = procSpotlight(state, ctx, t);
        return;
      }
      lastResult = procSummonAttack(state, ctx, t);
    });
    return lastResult;
  }

  function isToggleBuffSkill(skill) {
    if (!skill) return false;
    if (skill.toggle) return true;
    const text = `${skill.desc || ''}${skill.h || ''}`;
    return /開關技能|ON\/OFF技能/.test(text);
  }

  function isTimedBuffSkill(skill, common) {
    if (!skill || !common) return false;
    const id = String(skill.id || '');
    if (V_NEVER_TIMED_IDS.has(id)) return false;
    // 開關技：即使 time 很短也走 buff 管線（activate 內會拉長持續）
    if (isToggleBuffSkill(skill)) return skill.type === 'buff' || skill.type === 'active';
    if (!(common.timeSec > 0)) return false;
    if (V_FORCE_TIMED_IDS.has(id)) return true;
    if (skill.summonSkillId || skill.fx?.summonAttacks?.length || skill.fx?.summonVisual) {
      return true;
    }
    if (typeof SkillFormula !== 'undefined' && SkillFormula.evalStatCommon) {
      const st = SkillFormula.evalStatCommon(skill.common, 1);
      if (st.indiePad > 0 || st.indieCr > 0 || st.indieMad > 0 || st.madX > 0) return true;
      if ((Number(st.indiePadR) || 0) > 0 || (Number(st.indieDamR) || 0) > 0) return true;
      if ((Number(st.indiePMdR) || 0) > 0 || (Number(st.indieBDR) || 0) > 0) return true;
      if ((Number(st.indieIgnoreMobpdpR) || 0) > 0 || (Number(st.criticaldamage) || 0) > 0) return true;
      if ((Number(st.emhp) || 0) > 0) return true;
      if ((Number(st.damAbsorbShieldR) || 0) > 0) return true;
    }
    return skill.type === 'buff';
  }

  function pushSummonState(partial) {
    summons.push({
      mode: 'summon',
      parentSkillId: '',
      summonSkillId: '',
      expiresAt: nowMs(),
      intervalMs: 999999,
      maxProcs: 0,
      swordsPerProc: 1,
      damagePct: 0,
      attackCount: 1,
      mobCount: 1,
      procCount: 0,
      lastProcAt: 0,
      summonAttacks: [],
      attackIdx: 0,
      fieldEl: null,
      anchorX: 160,
      anchorY: 220,
      facingRight: true,
      standFxId: null,
      hitFrames: null,
      placement: {},
      endFrames: null,
      killCount: 0,
      killThreshold: 0,
      explodeOnExpire: false,
      explodeDamagePct: 0,
      explodeAttackCount: 0,
      explodeMobCount: 0,
      explodeHitFrames: null,
      followPlayer: false,
      ignoreOwnKills: false,
      attackOnSelfOnly: false,
      hitAfterMs: 0,
      extraAttackLayers: [],
      standFrames: null,
      pauseStandOnAttack: false,
      bursting: false,
      attacking: false,
      triggerSkillIds: null,
      extraStandFxIds: [],
      laterLightFdCut: 0,
      lightCount: 0,
      freezeOnSingle: 0,
      ...partial,
    });
  }

  function activateErdaFountain(skill, level, stat, ctx, durationMs) {
    const visual = resolveSummonVisual(skill, null);
    clearSummonBySkillId(skill.id);
    const placement = resolveSummonPlacement(skill, stat);
    placement.parentSkillId = String(skill.id);
    const placed = placeSummonVisual(visual, ctx.fieldEl || null, ctx.playerEl || null, placement, ctx);
    const die = visual?.die || null;
    const attack1 = resolveSummonAttacks(skill, null, { onlyNames: ['attack1'] });
    pushSummonState({
      mode: 'killBurst',
      parentSkillId: String(skill.id),
      expiresAt: nowMs() + durationMs,
      intervalMs: 999999,
      damagePct: Number(stat?.damagePct) || 0,
      attackCount: Math.max(1, Math.floor(Number(stat?.attackCount) || Number(stat?.w) || 4)),
      mobCount: Math.max(1, Math.floor(Number(stat?.mobCount) || 10)),
      summonAttacks: attack1,
      fieldEl: ctx.fieldEl || null,
      anchorX: placed?.x ?? 160,
      anchorY: placed?.y ?? 220,
      facingRight: placed?.facingRight != null ? !!placed.facingRight : true,
      standFxId: placed?.standFxId ?? null,
      hitFrames: skill.fx?.hit || null,
      placement,
      endFrames: die,
      killCount: 0,
      killThreshold: Math.max(1, Math.floor(Number(stat?.u) || 12)),
      ignoreOwnKills: true,
      attackOnSelfOnly: true,
      standFrames: visual?.stand || visual?.move || null,
      pauseStandOnAttack: true,
      bursting: false,
      // WZ summon/attack1/info attackAfter
      hitAfterMs: 630,
    });
    return true;
  }

  function activateBlitzShield(skill, level, stat, ctx, durationMs) {
    const repeat = Array.isArray(skill.fx?.repeat) ? skill.fx.repeat : [];
    const visual = {
      summoned: skill.fx?.effect || [],
      stand: repeat.length ? repeat : (skill.fx?.effect || []),
    };
    clearSummonBySkillId(skill.id);
    const placement = resolveSummonPlacement(skill, stat);
    placement.parentSkillId = String(skill.id);
    placement.followPlayer = true;
    placement.attachToPlayer = true;
    const placed = placeSummonVisual(visual, ctx.fieldEl || null, ctx.playerEl || null, placement, ctx);
    const boom = typeof SkillCatalog !== 'undefined'
      ? SkillCatalog.getSkill(BLITZ_SHIELD_BOOM_ID)
      : null;
    const boomEffect = boom?.fx?.effect || [];
    const boomEffect0 = boom?.fx?.effect0 || [];
    pushSummonState({
      mode: 'ground-fx',
      parentSkillId: String(skill.id),
      expiresAt: nowMs() + durationMs,
      damagePct: Number(stat?.damagePct) || 0,
      attackCount: Math.max(1, Math.floor(Number(stat?.attackCount) || 5)),
      mobCount: Math.max(1, Math.floor(Number(stat?.mobCount) || 12)),
      summonAttacks: boomEffect.length ? [boomEffect] : [],
      extraAttackLayers: boomEffect0.length ? [boomEffect0] : [],
      fieldEl: ctx.fieldEl || null,
      anchorX: placed?.x ?? 160,
      anchorY: placed?.y ?? 220,
      facingRight: placed?.facingRight != null ? !!placed.facingRight : true,
      standFxId: placed?.standFxId ?? null,
      hitFrames: boom?.fx?.hit || skill.fx?.hit || null,
      placement,
      explodeOnExpire: true,
      followPlayer: true,
      // WZ 400001011 hit/0 delayedTime
      hitAfterMs: 180,
    });
    return true;
  }

  function activateBurningSoul(skill, level, stat, ctx, durationMs) {
    if (typeof SkillComboOrbs !== 'undefined' && typeof SkillComboOrbs.fillToMax === 'function') {
      SkillComboOrbs.fillToMax();
    }
    const visual = resolveSummonVisual(skill, null);
    const attacks = resolveSummonAttacks(skill, null);
    clearSummonBySkillId(skill.id);
    const placement = resolveSummonPlacement(skill, stat);
    placement.parentSkillId = String(skill.id);
    placement.followPlayer = true;
    placement.attachToPlayer = false;
    const placed = placeSummonVisual(visual, ctx.fieldEl || null, ctx.playerEl || null, placement, ctx);
    const intervalMs = scaleGameMs(Math.max(120, Math.floor(Number(stat?.w) || 420)));
    pushSummonState({
      mode: 'onCast',
      parentSkillId: String(skill.id),
      expiresAt: nowMs() + durationMs,
      intervalMs,
      damagePct: Number(stat?.damagePct) || 0,
      attackCount: Math.max(1, Math.floor(Number(stat?.attackCount) || 12)),
      mobCount: Math.max(1, Math.floor(Number(stat?.mobCount) || 8)),
      summonAttacks: attacks,
      fieldEl: ctx.fieldEl || null,
      anchorX: placed?.x ?? 160,
      anchorY: placed?.y ?? 220,
      facingRight: placed?.facingRight != null ? !!placed.facingRight : true,
      standFxId: placed?.standFxId ?? null,
      hitFrames: skill.fx?.hit
        || skill.fx?.layers?.['summon/attack1/info/hit']
        || null,
      placement,
      endFrames: visual?.die || null,
      followPlayer: true,
      attackOnSelfOnly: true,
      standFrames: visual?.stand || visual?.move || null,
      pauseStandOnAttack: true,
      attacking: false,
      // WZ summon/attack1/info attackAfter
      hitAfterMs: 270,
    });
    return true;
  }

  function activateComboInstinct(skill, level, stat, ctx, durationMs) {
    const crack = typeof SkillCatalog !== 'undefined'
      ? SkillCatalog.getSkill(COMBO_INSTINCT_CRACK_ID)
      : null;
    const crackFrames = crack?.fx?.effect || skill.fx?.effect || [];
    clearSummonBySkillId(skill.id);
    const placement = resolveSummonPlacement(skill, stat);
    placement.parentSkillId = String(skill.id);
    if (skill.fx?.effect?.length && ctx.playerEl && typeof SkillEffectPlayer !== 'undefined') {
      SkillEffectPlayer.playOnPlayer(skill.fx.effect, { playerEl: ctx.playerEl, fieldEl: ctx.fieldEl });
    }
    const tPct = Math.max(0, Number(stat?.t) || 0);
    if (tPct > 0 && typeof SkillModifiers !== 'undefined' && typeof SkillComboOrbs !== 'undefined') {
      const combo = SkillComboOrbs.getModifierBonus?.() || {};
      SkillModifiers.applyBuff({
        id: `${skill.id}-comboBoost`,
        name: skill.name || '',
        icon: skill.icon || '',
        durationMs,
        finalDamR: (Number(combo.finalDamR) || 0) * tPct / 100,
        bdR: (Number(combo.bdR) || 0) * tPct / 100,
        flatPad: (Number(combo.flatPad) || 0) * tPct / 100,
      });
    }
    const placed = { x: 160, y: 220 };
    if (ctx.fieldEl && ctx.playerEl) {
      const pt = summonFieldPoint(ctx.fieldEl, ctx.playerEl, placement, ctx);
      placed.x = pt.x;
      placed.y = pt.y;
    }
    pushSummonState({
      mode: 'onCast',
      parentSkillId: String(skill.id),
      summonSkillId: COMBO_INSTINCT_CRACK_ID,
      expiresAt: nowMs() + durationMs,
      intervalMs: 0,
      maxProcs: 0,
      damagePct: Number(stat?.damagePct) || 0,
      attackCount: Math.max(1, Math.floor(Number(stat?.attackCount) || 6)),
      mobCount: Math.max(1, Math.floor(Number(stat?.mobCount) || 6)),
      summonAttacks: crackFrames.length ? [crackFrames] : [],
      fieldEl: ctx.fieldEl || null,
      anchorX: placed.x,
      anchorY: placed.y,
      lastProcAt: 0,
      hitFrames: crack?.fx?.hit || null,
      placement,
      triggerSkillIds: RAGING_BLOW_IDS,
      crackSkillIds: COMBO_INSTINCT_CRACK_IDS.slice(),
      // WZ 400011074 hit/0 delayedTime；075／076 用 effect/0 delay + 同差值
      hitAfterMs: 480,
    });
    return true;
  }

  function parseWzPoint(raw) {
    const m = String(raw || '').match(/(-?\d+)\s*,\s*(-?\d+)/);
    if (!m) return null;
    return { x: Number(m[1]), y: Number(m[2]) };
  }

  /** WZ lt2「0, -315」：Y 向上為負，場上 Y 向下故直接當 lift。 */
  function secretBookLaunchLiftY(skill) {
    const lt2 = parseWzPoint(skill?.common?.lt2);
    if (lt2 && Number.isFinite(lt2.y) && lt2.y !== 0) return lt2.y;
    return 0;
  }

  function secretBookLaunchPoint(state, ctx) {
    if (typeof SkillEffectPlayer !== 'undefined'
      && typeof SkillEffectPlayer.fieldPointFromFxVisual === 'function'
      && state?.standFxId != null) {
      const live = SkillEffectPlayer.fieldPointFromFxVisual(state.standFxId);
      if (live && Number.isFinite(live.x) && Number.isFinite(live.y)) return live;
    }
    const base = liveSummonPoint(state, ctx);
    const lift = Number(state?.launchLiftY) || 0;
    return { x: base.x, y: base.y + lift };
  }

  function secretBookDieHitFrames(skill) {
    const die = skill?.fx?.summonVisual?.die;
    if (Array.isArray(die) && die.length) return die;
    const nested = skill?.fx?.summonVisual?.['summon/die/info/hit'];
    if (Array.isArray(nested) && nested.length) return nested;
    return skill?.fx?.hit || null;
  }

  function activateSecretBook(skill, level, stat, ctx, durationMs) {
    const existing = summons.find((s) => String(s.parentSkillId) === SECRET_BOOK_ID);
    if (existing) {
      detonateSummon(existing, ctx);
      summons = summons.filter((s) => s !== existing);
    }
    const visual = resolveSummonVisual(skill, null);
    clearSummonBySkillId(skill.id);
    const placement = resolveSummonPlacement(skill, stat);
    placement.parentSkillId = String(skill.id);
    const placed = placeSummonVisual(visual, ctx.fieldEl || null, ctx.playerEl || null, placement, ctx);
    const intervalMs = scaleGameMs(Math.max(120, Math.floor(Number(stat?.subTimeMs) || 990)));
    const extraStars = Math.max(0, Math.floor((Number(stat?.xVal) || 0) / 2));
    const starsPerMob = Math.max(1, Math.floor((Number(stat?.bulletCount) || Number(stat?.attackCount) || 1) / 2));
    let explodeAtk = Math.max(1, Math.floor(Number(stat?.w) || 12));
    let explodeDmg = Number(stat?.selfDestruction) || 0;
    if (explodeAtk > 4) {
      explodeDmg *= explodeAtk / 4;
      explodeAtk = 4;
    }
    pushSummonState({
      mode: 'summon',
      parentSkillId: String(skill.id),
      expiresAt: nowMs() + durationMs,
      intervalMs,
      damagePct: (Number(stat?.damagePct) || 0) * 2,
      attackCount: 1,
      starsPerMob,
      extraStars,
      mobCount: Math.max(1, Math.floor(Number(stat?.mobCount) || 7)),
      summonAttacks: [],
      fieldEl: ctx.fieldEl || null,
      anchorX: placed?.x ?? 160,
      anchorY: placed?.y ?? 220,
      facingRight: placed?.facingRight != null ? !!placed.facingRight : true,
      standFxId: placed?.standFxId ?? null,
      hitFrames: skill.fx?.hit || null,
      placement,
      endFrames: visual?.die || null,
      explodeOnExpire: true,
      explodeDamagePct: explodeDmg,
      explodeAttackCount: explodeAtk,
      explodeMobCount: Math.max(1, Math.floor(Number(stat?.z) || 12)),
      explodeHitFrames: secretBookDieHitFrames(skill),
      lastProcAt: 0,
      skillBdR: Number(stat?.bdR) || 0,
      launchLiftY: secretBookLaunchLiftY(skill),
    });
    return true;
  }

  function activateWindShurikenLinger(skill, level, stat, ctx, anchor) {
    if (!skill || !stat) return false;
    const durationMs = scaleGameMs(Math.max(0, Number(stat.z) || 0) * 1000);
    if (!(durationMs > 0)) return false;
    const visual = {
      stand: skill.fx?.shootobj?.layers?.[0]?.frames || skill.fx?.effect0 || skill.fx?.effect || [],
    };
    clearSummonBySkillId(skill.id);
    const placement = resolveSummonPlacement(skill, stat);
    placement.parentSkillId = String(skill.id);
    if (anchor && Number.isFinite(anchor.x) && Number.isFinite(anchor.y)) {
      placement.slot = 'target-feet';
    }
    const placed = placeSummonVisual(visual, ctx.fieldEl || null, ctx.playerEl || null, placement, ctx);
    const intervalMs = scaleGameMs(Math.max(60, Math.floor(Number(stat.subTimeMs) || 180)));
    let lingerAtk = Math.max(1, Math.floor(Number(stat.attackCount) || 7));
    let lingerDmg = Number(stat.damagePct) || 0;
    if (lingerAtk > 1) {
      lingerDmg *= lingerAtk;
      lingerAtk = 1;
    }
    pushSummonState({
      mode: 'summon',
      parentSkillId: String(skill.id),
      expiresAt: nowMs() + durationMs,
      intervalMs,
      damagePct: lingerDmg,
      attackCount: lingerAtk,
      mobCount: Math.max(1, Math.floor(Number(stat.mobCount) || 6)),
      summonAttacks: visual.stand?.length ? [visual.stand] : [],
      fieldEl: ctx.fieldEl || null,
      anchorX: Number.isFinite(anchor?.x) ? anchor.x : (placed?.x ?? 160),
      anchorY: Number.isFinite(anchor?.y) ? anchor.y : (placed?.y ?? 220),
      facingRight: placed?.facingRight != null ? !!placed.facingRight : true,
      standFxId: placed?.standFxId ?? null,
      hitFrames: skill.fx?.hit || null,
      placement,
      lastProcAt: 0,
      // WZ attackDelay
      hitAfterMs: Math.max(0, Number(stat.attackDelayBaseMs) || 100),
    });
    return true;
  }

  function summonCombatStats(skillId, damagePct, attackCount, mobCount) {
    let dmg = Number(damagePct) || 0;
    let atk = Math.max(1, Math.floor(Number(attackCount) || 1));
    let mobs = Math.max(1, Math.floor(Number(mobCount) || 1));
    if (typeof SkillModifiers !== 'undefined'
      && typeof SkillModifiers.applySkillEnhance === 'function') {
      const row = SkillModifiers.applySkillEnhance(String(skillId || ''), {
        damagePct: dmg,
        attackCount: atk,
        mobCount: mobs,
      });
      dmg = Number(row.damagePct) || dmg;
      atk = Math.max(1, Math.floor(Number(row.attackCount) || atk));
      mobs = Math.max(1, Math.floor(Number(row.mobCount) || mobs));
    }
    return { damagePct: dmg, attackCount: atk, mobCount: mobs };
  }

  function notifyIceAgeFromLightningId(skillId, ctx) {
    const id = String(skillId || '');
    if (!id || !ICE_AGE_LIGHTNING_TRIGGER_IDS.includes(id)) return null;
    return procOnCastFollowers({ id }, ctx);
  }

  function activateIceAge(skill, level, stat, ctx, durationMs) {
    const visual = {
      stand: skill.fx?.special?.frames || [],
    };
    clearSummonBySkillId(skill.id);
    const placement = resolveSummonPlacement(skill, stat);
    placement.parentSkillId = String(skill.id);
    placement.offsetX = 0;
    placement.offsetY = 0;
    const loopFrom = Number.isFinite(Number(skill.fx?.special?.repeat))
      ? Math.floor(Number(skill.fx.special.repeat))
      : 11;
    placement.loopFrom = loopFrom;
    const placed = placeSummonVisual(visual, ctx.fieldEl || null, ctx.playerEl || null, placement, ctx);
    const tSec = Number(stat?.t);
    const pulseSec = (Number.isFinite(tSec) && tSec > 0) ? tSec : 0.1;
    const intervalMs = scaleGameMs(Math.max(50, Math.round(pulseSec * 1000)));
    const combat = summonCombatStats(
      skill.id,
      Number(stat?.damagePct) || 0,
      Math.max(1, Math.floor(Number(stat?.attackCount) || 5)),
      Math.max(1, Math.floor(Number(stat?.mobCount) || 15)),
    );
    pushSummonState({
      mode: 'onCast',
      parentSkillId: String(skill.id),
      expiresAt: nowMs() + durationMs,
      intervalMs,
      damagePct: combat.damagePct,
      attackCount: combat.attackCount,
      mobCount: combat.mobCount,
      summonAttacks: [],
      fieldEl: ctx.fieldEl || null,
      anchorX: placed?.x ?? 160,
      anchorY: placed?.y ?? 220,
      facingRight: placed?.facingRight != null ? !!placed.facingRight : true,
      standFxId: placed?.standFxId ?? null,
      hitFrames: skill.fx?.hit || null,
      placement,
      triggerSkillIds: ICE_AGE_LIGHTNING_TRIGGER_IDS.slice(),
      lastProcAt: 0,
    });
    return true;
  }

  function activateSpiritOfSnow(skill, level, stat, ctx, durationMs) {
    const visual = resolveSummonVisual(skill, null);
    const attacks = resolveSummonAttacks(skill, null);
    clearSummonBySkillId(skill.id);
    const placement = resolveSummonPlacement(skill, stat);
    placement.parentSkillId = String(skill.id);
    placement.offsetX = 0;
    placement.offsetY = 0;
    const placed = placeSummonVisual(visual, ctx.fieldEl || null, ctx.playerEl || null, placement, ctx);
    const intervalMs = scaleGameMs(Math.max(120, Math.floor(Number(stat?.subTimeMs) || 900)));
    const combat = summonCombatStats(
      skill.id,
      Number(stat?.damagePct) || 0,
      Math.max(1, Math.floor(Number(stat?.attackCount) || 12)),
      Math.max(1, Math.floor(Number(stat?.mobCount) || 10)),
    );
    pushSummonState({
      mode: 'summon',
      parentSkillId: String(skill.id),
      expiresAt: nowMs() + durationMs,
      intervalMs,
      damagePct: combat.damagePct,
      attackCount: combat.attackCount,
      mobCount: combat.mobCount,
      summonAttacks: attacks,
      fieldEl: ctx.fieldEl || null,
      anchorX: placed?.x ?? 160,
      anchorY: placed?.y ?? 220,
      facingRight: placed?.facingRight != null ? !!placed.facingRight : true,
      standFxId: placed?.standFxId ?? null,
      hitFrames: skill.fx?.hit || null,
      placement,
      endFrames: visual?.die || null,
      standFrames: visual?.stand || visual?.move || null,
      pauseStandOnAttack: true,
      freezeOnSingle: Math.max(0, Math.floor(Number(stat?.z) || 0)),
      lastProcAt: 0,
    });
    return true;
  }

  function activateArcanaOverride(skill, level, stat, ctx, durationMs) {
    if (typeof SkillModifiers !== 'undefined'
      && typeof SkillModifiers.applyArcanaOverride === 'function') {
      const ySec = Math.max(1, Number(stat?.y) || 10);
      SkillModifiers.applyArcanaOverride({
        skillId: String(skill.id),
        durationMs,
        stacks: Math.max(1, Math.floor(Number(stat?.xVal) || 3)),
        perStackFinalDamR: Math.max(0, Number(stat?.z) || 0),
        dropMs: scaleGameMs(ySec * 1000),
      });
    }
    return true;
  }

  function activateVSkill(skill, level, stat, ctx, durationMs) {
    const id = String(skill.id || '');
    if (id === ERDA_FOUNTAIN_ID) return activateErdaFountain(skill, level, stat, ctx, durationMs);
    if (id === BLITZ_SHIELD_ID) return activateBlitzShield(skill, level, stat, ctx, durationMs);
    if (id === BURNING_SOUL_ID) return activateBurningSoul(skill, level, stat, ctx, durationMs);
    if (id === COMBO_INSTINCT_ID) return activateComboInstinct(skill, level, stat, ctx, durationMs);
    if (id === AURA_WEAPON_ID) return activateAuraWeaponFollow(skill, level, stat, ctx, durationMs);
    if (id === SECRET_BOOK_ID) return activateSecretBook(skill, level, stat, ctx, durationMs);
    if (id === ELEMENTAL_GHOST_ID) return activateElementalGhost(skill, level, stat, ctx, durationMs);
    if (id === ROYAL_KNIGHTS_ID) return activateRoyalKnights(skill, level, stat, ctx, durationMs);
    if (id === FREUD_BLESSING_ID) return activateFreudBlessing(skill, level, stat, ctx, durationMs);
    if (id === SPOTLIGHT_ID) return activateSpotlight(skill, level, stat, ctx, durationMs);
    if (id === ICE_AGE_ID) return activateIceAge(skill, level, stat, ctx, durationMs);
    if (id === SPIRIT_OF_SNOW_ID) return activateSpiritOfSnow(skill, level, stat, ctx, durationMs);
    if (id === ARCANA_OVERRIDE_ID) return activateArcanaOverride(skill, level, stat, ctx, durationMs);
    return false;
  }

  /**
   * 施放時限 Buff：上數值 +（可選）意念 afterimage／召喚物 autotick
   */
  function activateTimedBuff(skill, level, common, ctx = {}) {
    if (!skill || !common) return false;
    const toggle = isToggleBuffSkill(skill);
    if (toggle && typeof SkillModifiers !== 'undefined' && SkillModifiers.hasBuff?.(skill.id)) {
      SkillModifiers.clearBuff?.(String(skill.id));
      clearSummonBySkillId(skill.id);
      if (typeof CharacterCombatPanel !== 'undefined') {
        CharacterCombatPanel.syncToCombatPower?.();
      }
      if (typeof Paperdoll !== 'undefined' && typeof Paperdoll.syncShadowPartnerClone === 'function') {
        Paperdoll.syncShadowPartnerClone();
      }
      return { toggledOff: true };
    }

    const stat = (typeof SkillFormula !== 'undefined' && SkillFormula.evalStatCommon)
      ? SkillFormula.evalStatCommon(skill.common, level)
      : null;
    let durationBaseMs = Math.max(0, (common.timeSec || stat?.timeSec || 0) * 1000);
    // 開關技：維持到再次施放／重置（自動選招不會在持續中重放）
    if (toggle) {
      durationBaseMs = Math.max(durationBaseMs, 24 * 60 * 60 * 1000);
    }
    const skillId = String(skill.id || '');
    const skipBuffTimeR = skillId === FREUD_BLESSING_ID || skillId === SPOTLIGHT_ID;
    const durationMult = skipBuffTimeR
      ? 1
      : ((typeof SkillModifiers !== 'undefined'
        && typeof SkillModifiers.getBuffDurationMultiplier === 'function')
        ? SkillModifiers.getBuffDurationMultiplier()
        : 1);
    const durationMs = scaleGameMs(Math.round(durationBaseMs * durationMult));
    if (!(durationMs > 0)) return false;

    if (typeof SkillModifiers !== 'undefined') {
      let applyStat = stat;
      let applyCommon = skill.common;
      let applyMeta = skill;
      if (skillId === FREUD_BLESSING_ID && typeof SkillCatalog !== 'undefined') {
        const layer = SkillCatalog.getSkill(FREUD_BLESSING_STAT_ID);
        if (layer?.common && typeof SkillFormula !== 'undefined') {
          applyCommon = layer.common;
          applyMeta = layer;
          applyStat = SkillFormula.evalStatCommon(layer.common, level);
        }
      }
      if (skillId === SPOTLIGHT_ID && typeof SkillCatalog !== 'undefined') {
        const layer = SkillCatalog.getSkill(SPOTLIGHT_STAT_ID);
        if (layer?.common && typeof SkillFormula !== 'undefined') {
          applyCommon = layer.common;
          applyMeta = layer;
          applyStat = SkillFormula.evalStatCommon(layer.common, level);
        }
      }
      const mods = (typeof SkillModifiers.modsFromStat === 'function' && applyStat)
        ? SkillModifiers.modsFromStat(applyStat, skill.id, applyCommon, level, applyMeta)
        : {};
      if (skillId === FREUD_BLESSING_ID) {
        applyFreudBlessingCombatMods(mods, applyStat, stat);
      }
      const id = skillId;
      if (id === READY_TO_DIE_ID) {
        mods.flatPad = 0;
        mods.finalDamR = Number(stat?.y) || 0;
      }
      if (id === ULTIMATE_DARKSIGHT_ID) {
        mods.finalDamR = Number(stat?.y) || 0;
      }
      if (id === ARCANA_OVERRIDE_ID) {
        mods.finalDamR = 0;
        mods.indiePMdR = 0;
      }
      SkillModifiers.applyBuff({
        id: String(skill.id),
        name: skill.name || '',
        icon: skill.icon || '',
        durationMs,
        ...mods,
      });
      if (typeof Paperdoll !== 'undefined' && typeof Paperdoll.syncShadowPartnerClone === 'function') {
        Paperdoll.syncShadowPartnerClone();
      }
    }

    if (activateVSkill(skill, level, stat, ctx, durationMs)) {
      return true;
    }

    const summonId = skill.summonSkillId ? String(skill.summonSkillId) : '';
    const summon = summonId && typeof SkillCatalog !== 'undefined'
      ? SkillCatalog.getSkill(summonId)
      : null;
    const summonStat = summon && typeof SkillFormula !== 'undefined'
      ? SkillFormula.evalStatCommon(summon.common, level)
      : null;

    const maxProcs = Math.max(0, Math.floor(stat?.u2 || 0));
    const swordsPerProc = Math.max(1, Math.floor(stat?.w || 1));
    const intervalMs = scaleGameMs(Math.max(
      0,
      Math.floor(summonStat?.subTimeMs || stat?.subTimeMs || 0),
    ) || 480);
    const attacks = resolveSummonAttacks(skill, summon);
    let visual = resolveSummonVisual(skill, summon);
    const hasIndie = ((stat?.indiePad || 0) + (stat?.padX || 0)) > 0;
    const fieldDmg = Number(stat?.damagePct) || Number(common.damagePct) || 0;
    const fieldInterval = Number(stat?.subTimeMs) || 0;
    const placementPreview = resolveSummonPlacement(skill, stat);
    if (!(attacks.length) && fieldDmg > 0 && fieldInterval > 0) {
      if (!placementPreview.skipAttackAnim && skill.fx?.effect?.length) {
        attacks.push(skill.fx.effect);
      }
    }
    if (!visual && fieldDmg > 0 && fieldInterval > 0) {
      if (placementPreview.skipAttackAnim) {
        const tile = skill.fx?.tiles?.[0];
        if (tile?.frames?.length) {
          visual = { stand: tile.frames };
          const fromIdx = Number.isFinite(Number(tile.repeatIdx)) && Number(tile.repeatIdx) >= 0
            ? Math.floor(Number(tile.repeatIdx))
            : (Number(tile.repeat) > 1 ? Math.floor(Number(tile.repeat)) : NaN);
          if (Number.isFinite(fromIdx)) {
            placementPreview.loopFrom = fromIdx;
          }
        } else if (skill.fx?.effect?.length) {
          visual = { stand: skill.fx.effect };
        }
      } else if (skill.fx?.special?.frames?.length) {
        visual = { stand: skill.fx.special.frames };
      }
    }
    const wantsAutotick = (attacks.length > 0 || !!visual)
      && (stat?.subTimeMs > 0 || summonStat?.subTimeMs > 0 || !!visual)
      && !hasIndie;

    if (wantsAutotick) {
      clearSummonBySkillId(skill.id);
      const placement = resolveSummonPlacement(skill, stat);
      if (Number.isFinite(Number(placementPreview.loopFrom))) {
        placement.loopFrom = Math.floor(Number(placementPreview.loopFrom));
      }
      placement.parentSkillId = String(skill.id);
      const placed = placeSummonVisual(
        visual,
        ctx.fieldEl || null,
        ctx.playerEl || null,
        placement,
        ctx,
      );
      summons.push({
        mode: 'summon',
        parentSkillId: String(skill.id),
        summonSkillId: summonId,
        expiresAt: nowMs() + durationMs,
        intervalMs,
        maxProcs: 0,
        swordsPerProc: 1,
        damagePct: Number(stat?.damagePct) || Number(common.damagePct) || 0,
        attackCount: Math.max(1, Math.floor(stat?.attackCount || common.attackCount || 1)),
        mobCount: Math.max(1, Math.floor(stat?.mobCount || common.mobCount || 1)),
        procCount: 0,
        lastProcAt: 0,
        summonAttacks: attacks,
        attackIdx: 0,
        fieldEl: ctx.fieldEl || null,
        anchorX: placed?.x ?? 160,
        anchorY: placed?.y ?? 220,
        facingRight: placed?.facingRight != null ? !!placed.facingRight : true,
        standFxId: placed?.standFxId ?? null,
        hitFrames: summon?.fx?.hit || skill.fx?.hit || null,
        placement,
        endFrames: skillFxFrames(skill, placement.endFx),
      });
      return true;
    }

    clearAfterimage();

    if (summonId && maxProcs > 0 && attacks.length) {
      afterimage = {
        mode: 'afterimage',
        parentSkillId: String(skill.id),
        summonSkillId: summonId,
        expiresAt: nowMs() + durationMs,
        intervalMs,
        maxProcs,
        swordsPerProc,
        damagePct: Number(stat?.damagePct) || Number(common.damagePct) || 0,
        attackCount: Math.max(1, Math.floor(stat?.attackCount || common.attackCount || 1)),
        mobCount: Math.max(1, Math.floor(stat?.mobCount || common.mobCount || 1)),
        procCount: 0,
        lastProcAt: 0,
        summonAttacks: attacks,
        attackIdx: 0,
        fieldEl: null,
        anchorX: 0,
        anchorY: 0,
        standFxId: null,
        hitFrames: null,
      };
    }

    startBuffGroundTiles(skill, ctx, durationMs);
    return true;
  }

  function startBuffGroundTiles(skill, ctx, durationMs) {
    const tiles = skill?.fx?.tiles;
    if (!Array.isArray(tiles) || !tiles.length) return;
    if (skill.blizzardCast !== false && skill.blizzardCast) return;
    const frames = tiles[0]?.frames;
    if (!Array.isArray(frames) || !frames.length) return;
    const fieldEl = ctx?.fieldEl || document.getElementById('idleHuntField');
    const playerEl = ctx?.playerEl;
    if (!fieldEl || typeof SkillEffectPlayer === 'undefined'
      || typeof SkillEffectPlayer.playAtField !== 'function') {
      return;
    }
    const pt = summonFieldPoint(fieldEl, playerEl, { slot: 'player-feet' }, ctx);
    clearSummonBySkillId(skill.id);
    const loopFromRaw = tiles[0]?.repeatIdx != null
      ? Number(tiles[0].repeatIdx)
      : Number(skill?.tileRepeatIdx);
    const loopFrom = Number.isFinite(loopFromRaw) && loopFromRaw >= 0
      ? Math.floor(loopFromRaw)
      : 0;
    const fxId = SkillEffectPlayer.playAtField({
      fieldEl,
      frames,
      x: pt.x,
      y: pt.y,
      loop: true,
      loopFrom,
      className: 'idle-skill-fx-stage idle-skill-fx-stage--summon idle-skill-fx-stage--nl-domain',
      zIndex: 28,
      behind: true,
      forcePlay: true,
    });
    summons.push({
      mode: 'ground-fx',
      parentSkillId: String(skill.id),
      expiresAt: nowMs() + Math.max(0, Number(durationMs) || 0),
      standFxId: fxId,
      fieldEl,
    });
  }

  function canProcSwordSkill(skillId, t = nowMs()) {
    tick(t);
    if (!afterimage || afterimage.mode !== 'afterimage') return false;
    if (String(skillId) === afterimage.parentSkillId) return false;
    if (String(skillId).startsWith('4000')) return false;
    if (afterimage.procCount >= afterimage.maxProcs) return false;
    if (afterimage.lastProcAt > 0 && (t - afterimage.lastProcAt) < afterimage.intervalMs) {
      return false;
    }
    return true;
  }

  function liveSummonPoint(state, ctx) {
    if (state?.followPlayer && !state.placement?.attachToPlayer && ctx?.fieldEl && ctx?.playerEl) {
      return summonFieldPoint(ctx.fieldEl, ctx.playerEl, state.placement || {}, ctx);
    }
    return { x: state?.anchorX ?? 160, y: state?.anchorY ?? 220 };
  }

  function playSummonAttackVisual(state, frames, ctx) {
    if (!frames?.length || typeof SkillEffectPlayer === 'undefined') return;
    const playField = state.mode === 'summon' || state.mode === 'killBurst' || state.mode === 'onCast';
    if (!playField) return;
    const suffix = state.placement?.classSuffix;
    const attackClass = suffix
      ? `idle-skill-fx-stage idle-skill-fx-stage--summon-attack idle-skill-fx-stage--${suffix}`
      : 'idle-skill-fx-stage idle-skill-fx-stage--summon-attack';
    const attach = !!(state.placement?.attachToPlayer || (state.followPlayer && state.placement?.attachToPlayer));
    if (attach && typeof SkillEffectPlayer.playOnPlayer === 'function') {
      SkillEffectPlayer.playOnPlayer(frames, {
        fieldEl: state.fieldEl,
        playerEl: ctx?.playerEl,
        className: attackClass,
        zIndex: state.placement?.zIndex,
      });
      return;
    }
    if (!state.fieldEl || typeof SkillEffectPlayer.playAtField !== 'function') return;
    const pt = liveSummonPoint(state, ctx);
    if (state.pauseStandOnAttack && state.standFxId != null) {
      SkillEffectPlayer.setFxVisible?.(state.standFxId, false);
      const dur = SkillEffectPlayer.framesDurationMs?.(frames) || 400;
      const parentId = String(state.parentSkillId || '');
      state.attacking = true;
      setTimeout(() => {
        const live = summons.find((s) => String(s.parentSkillId) === parentId);
        if (!live) return;
        live.attacking = false;
        if (live.standFxId != null) {
          SkillEffectPlayer.setFxVisible?.(live.standFxId, true);
        }
      }, Math.max(60, dur));
    }
    SkillEffectPlayer.playAtField({
      fieldEl: state.fieldEl,
      frames,
      x: pt.x,
      y: pt.y,
      loop: false,
      className: attackClass,
      mirrorX: state.facingRight != null ? !!state.facingRight : true,
      zIndex: state.placement?.zIndex,
      behind: !!state.placement?.behind,
      resolveAnchor: (state.followPlayer && !state.placement?.attachToPlayer)
        ? () => liveSummonPoint(state, ctx)
        : null,
    });
  }

  function dealSummonHits(state, mobs, ctx, opts = {}) {
    const kills = [];
    const skipVisual = !!opts.skipVisual;
    let frames = opts.frames;
    if (!skipVisual && !Object.prototype.hasOwnProperty.call(opts, 'frames')) {
      frames = state.summonAttacks.length
        ? state.summonAttacks[state.attackIdx % state.summonAttacks.length]
        : null;
      if (state.summonAttacks.length) state.attackIdx += 1;
    }

    if (!skipVisual && frames) {
      playSummonAttackVisual(state, frames, ctx);
      (state.extraAttackLayers || []).forEach((layer) => playSummonAttackVisual(state, layer, ctx));
    }

    mobs.forEach((mob) => {
      if (!mob) return;
      if (!mob.isBoss && !(Number(mob.hp) > 0)) return;
      if (!skipVisual && frames && typeof SkillEffectPlayer !== 'undefined'
        && state.mode !== 'summon'
        && !state.attackOnSelfOnly) {
        SkillEffectPlayer.playOnMob(mob, frames, {
          className: 'idle-skill-fx-stage idle-skill-fx-stage--summon',
        });
      }
      if (state.hitFrames?.length && !opts.skipHitFx && typeof SkillEffectPlayer !== 'undefined') {
        SkillEffectPlayer.playOnMob(mob, state.hitFrames);
      }
      let any = false;
      const hitRows = [];
      const foldToOne = !mob.isBoss && Number(mob.hp) > 0;
      const swords = Math.max(1, Number(state.swordsPerProc) || 1);
      const atkN = Math.max(1, Number(state.attackCount) || 1);
      const settleLoops = foldToOne ? 1 : (swords * atkN);
      const settlePct = foldToOne
        ? (Number(state.damagePct) || 0) * swords * atkN
        : (Number(state.damagePct) || 0);
      for (let i = 0; i < settleLoops; i += 1) {
        let hit = { dmg: 0, isCritical: false };
        if (typeof UiCharacterInfo !== 'undefined' && UiCharacterInfo.rollHuntHit) {
          hit = UiCharacterInfo.rollHuntHit(!!mob.isBoss, {
            damagePct: settlePct,
            skillBdR: Number(state.skillBdR) || 0,
          });
        }
        let dmg = hit.dmg;
        if (!(dmg > 0)) continue;
        if (typeof SkillMobStatus !== 'undefined'
          && typeof SkillMobStatus.applyOutgoingDamageMods === 'function') {
          dmg = SkillMobStatus.applyOutgoingDamageMods(mob, dmg, {
            isCritical: !!hit.isCritical,
            skillId: state.parentSkillId || state.summonSkillId || null,
          });
        }
        const fdMult = Number(opts.outgoingMult);
        if (Number.isFinite(fdMult) && fdMult !== 1) {
          dmg = Math.max(0, Math.round(dmg * fdMult));
        }
        if (!(dmg > 0)) continue;
        any = true;
        hitRows.push({
          dmg,
          isCritical: !!hit.isCritical,
          dmgOpts: {
            multiHit: !foldToOne && settleLoops > 1,
            stackIndex: i,
          },
        });
      }
      if (hitRows.length) {
        if (typeof IdleHunt !== 'undefined' && typeof IdleHunt.applyPlayerHitsToMob === 'function') {
          IdleHunt.applyPlayerHitsToMob(mob, hitRows, {
            isCritical: false,
            showMobDamage: ctx.showMobDamage,
            onDamage: ctx.onDamage,
          });
        } else {
          for (let h = 0; h < hitRows.length; h += 1) {
            const row = hitRows[h];
            if (typeof IdleHunt !== 'undefined' && typeof IdleHunt.applyPlayerHitToMob === 'function') {
              IdleHunt.applyPlayerHitToMob(mob, row.dmg, {
                isCritical: !!row.isCritical,
                showMobDamage: ctx.showMobDamage,
                onDamage: ctx.onDamage,
                dmgOpts: row.dmgOpts,
              });
            } else {
              if (typeof ctx.showMobDamage === 'function') {
                ctx.showMobDamage(mob, row.dmg, row.isCritical, row.dmgOpts);
              }
              if (typeof ctx.onDamage === 'function') ctx.onDamage(row.dmg);
              const finalDmg = (typeof IdleHunt !== 'undefined' && typeof IdleHunt.resolveMobHitDamage === 'function')
                ? IdleHunt.resolveMobHitDamage(mob, row.dmg)
                : row.dmg;
              mob.hp -= finalDmg;
            }
          }
        }
      }
      if (typeof SkillMobStatus !== 'undefined'
        && typeof SkillMobStatus.afterPlayerDamagedMob === 'function') {
        SkillMobStatus.afterPlayerDamagedMob(mob, any, {
          skillId: state.parentSkillId || state.summonSkillId || null,
        });
      }
      if (any
        && Number(state.freezeOnSingle) > 1
        && (mobs || []).length === 1
        && typeof SkillMobStatus !== 'undefined'
        && typeof SkillMobStatus.applyFreeze === 'function') {
        SkillMobStatus.applyFreeze(mob, {
          skillId: state.parentSkillId || state.summonSkillId || null,
          stacks: Math.max(0, Math.floor(Number(state.freezeOnSingle) || 0) - 1),
        });
      }
      if (mob.hp <= 0) {
        kills.push(mob);
        if (typeof ctx.flashDie === 'function') ctx.flashDie(mob.uid, mob);
      } else if (any && typeof ctx.flashHit === 'function') {
        ctx.flashHit(mob.uid);
      }
    });
    return kills;
  }

  function resolveSummonTargets(ctx, mobCount) {
    let mobs = typeof ctx?.getMobs === 'function'
      ? (ctx.getMobs() || [])
      : (ctx?.mobs || []);
    if (typeof SkillCombat !== 'undefined' && typeof SkillCombat.filterChainAvailableMobs === 'function') {
      mobs = SkillCombat.filterChainAvailableMobs(mobs);
    }
    return (mobs || [])
      .filter((m) => m && Number(m.hp) > 0)
      .slice(0, Math.max(1, Math.floor(Number(mobCount) || 1)));
  }

  function explodeSummon(state, ctx, t = nowMs()) {
    if (!state) return null;
    const boom = { ...state, mode: 'summon' };
    if (Number(state.explodeDamagePct) > 0) boom.damagePct = Number(state.explodeDamagePct);
    if (Number(state.explodeAttackCount) > 0) {
      boom.attackCount = Math.max(1, Math.floor(Number(state.explodeAttackCount)));
    }
    if (Number(state.explodeMobCount) > 0) {
      boom.mobCount = Math.max(1, Math.floor(Number(state.explodeMobCount)));
    }
    if (state.explodeHitFrames) boom.hitFrames = state.explodeHitFrames;
    return procSummonAttack(boom, ctx, t);
  }

  /** 鬥氣本能裂縫：074 之後接 075、076。特效第一幀 delay 當入場等待，命中＝等待 + 180（074：300+180=480）。 */
  function procComboInstinctCracks(state, ctx, t = nowMs()) {
    if (!state) return null;
    state.lastProcAt = t;
    state.procCount += 1;
    const ids = Array.isArray(state.crackSkillIds) && state.crackSkillIds.length
      ? state.crackSkillIds
      : COMBO_INSTINCT_CRACK_IDS;
    const hitPadMs = 180;
    ids.forEach((sid) => {
      const sk = typeof SkillCatalog !== 'undefined' ? SkillCatalog.getSkill(sid) : null;
      const frames = sk?.fx?.effect || [];
      const startMs = Math.max(0, Number(frames[0]?.delay) || 0);
      const hitMs = startMs > 0 ? startMs + hitPadMs : (Number(state.hitAfterMs) || 0);
      const waveState = {
        ...state,
        summonSkillId: String(sid),
        summonAttacks: frames.length ? [frames] : [],
        extraAttackLayers: [],
        hitFrames: sk?.fx?.hit || state.hitFrames,
        hitAfterMs: 0,
      };
      if (frames.length) playSummonAttackVisual(waveState, frames, ctx);
      const runHits = () => {
        const mobs = resolveSummonTargets(ctx, state.mobCount);
        const kills = dealSummonHits(waveState, mobs, ctx, { skipVisual: true, frames: null });
        if (typeof ctx.onProjectileResolve === 'function' && kills.length) {
          ctx.onProjectileResolve(kills);
        }
      };
      const delayMs = scaleGameMs(hitMs);
      if (delayMs > 0) setTimeout(runHits, delayMs);
      else runHits();
    });
    return { kills: [], procs: 1, deferred: true };
  }

  function secretBookStarFrames() {
    if (typeof ThrowingStarBullet !== 'undefined'
      && typeof ThrowingStarBullet.framesFor === 'function') {
      const itemId = (typeof ThrowingStarStore !== 'undefined'
        && typeof ThrowingStarStore.frontItemId === 'function')
        ? ThrowingStarStore.frontItemId()
        : '';
      const frames = ThrowingStarBullet.framesFor(itemId);
      if (frames?.length) return frames;
    }
    return [];
  }

  function buildSecretBookShots(mobs, starsPerMob, extraStars) {
    const live = (mobs || []).filter((m) => m && Number(m.hp) > 0);
    const shots = [];
    const perMob = Math.max(1, Math.floor(Number(starsPerMob) || 1));
    const extra = Math.max(0, Math.floor(Number(extraStars) || 0));
    live.forEach((mob) => {
      for (let b = 0; b < perMob; b += 1) {
        shots.push({ mob, delayMs: b * 90 });
      }
    });
    if (live.length && extra > 0) {
      for (let e = 0; e < extra; e += 1) {
        const wave = Math.floor(e / live.length);
        shots.push({
          mob: live[e % live.length],
          delayMs: perMob * 90 + wave * 90,
        });
      }
    }
    return shots;
  }

  function procSecretBookStars(state, ctx, t = nowMs()) {
    if (!state) return null;
    state.lastProcAt = t;
    state.procCount += 1;
    const mobs = resolveSummonTargets(ctx, state.mobCount);
    const starsPerMob = Math.max(1, Math.floor(Number(state.starsPerMob) || 1));
    const extraStars = Math.max(0, Math.floor(Number(state.extraStars) || 0));
    const shots = buildSecretBookShots(mobs, starsPerMob, extraStars);
    const hitState = {
      ...state,
      attackCount: 1,
      swordsPerProc: 1,
      summonAttacks: [],
      attackOnSelfOnly: true,
    };
    const applyHit = (mob) => {
      if (!mob || !(Number(mob.hp) > 0)) return [];
      return dealSummonHits(hitState, [mob], ctx, { skipVisual: true, frames: null });
    };
    const collectKills = (src, dest) => {
      (src || []).forEach((k) => {
        if (k && !dest.includes(k)) dest.push(k);
      });
    };

    if (!shots.length) return { kills: [], procs: 1 };

    const frames = secretBookStarFrames();
    const spawn = secretBookLaunchPoint(state, ctx);
    const fieldEl = ctx.fieldEl || state.fieldEl;
    const bossInstant = String(fieldEl?.id || '') === 'idleBossField';
    const canFly = !bossInstant
      && !!(frames.length
        && fieldEl
        && Number.isFinite(spawn?.x)
        && Number.isFinite(spawn?.y)
        && typeof SkillBallCast !== 'undefined'
        && typeof SkillBallCast.playShotsFromPoint === 'function');

    if (!canFly) {
      const kills = [];
      shots.forEach((shot) => collectKills(applyHit(shot.mob), kills));
      if (kills.length && typeof ctx.onProjectileResolve === 'function') {
        ctx.onProjectileResolve(kills);
      }
      return { kills, procs: 1 };
    }

    const kills = [];
    SkillBallCast.playShotsFromPoint({
      fieldEl,
      frames,
      fromX: spawn.x,
      fromY: spawn.y,
      shots,
      speedPxPerMs: 0.7,
      home: true,
      getMobs: typeof ctx.getMobs === 'function' ? ctx.getMobs : (() => ctx.mobs || []),
      onHit: (mob) => collectKills(applyHit(mob), kills),
      onDone: () => {
        if (typeof ctx.onProjectileResolve === 'function' && kills.length) {
          ctx.onProjectileResolve(kills);
        }
      },
    });
    return { kills, procs: 1, deferred: true };
  }

  function procSummonAttack(state, ctx, t = nowMs()) {
    if (!state) return null;
    if (state.mode !== 'summon' && state.mode !== 'killBurst' && state.mode !== 'onCast') return null;
    state.lastProcAt = t;
    state.procCount += 1;
    const mobs = resolveSummonTargets(ctx, state.mobCount);
    const frames = state.summonAttacks.length
      ? state.summonAttacks[state.attackIdx % state.summonAttacks.length]
      : null;
    if (state.summonAttacks.length) state.attackIdx += 1;
    playSummonAttackVisual(state, frames, ctx);
    (state.extraAttackLayers || []).forEach((layer) => playSummonAttackVisual(state, layer, ctx));
    const delayMs = scaleGameMs(Math.max(0, Number(state.hitAfterMs) || 0));
    const runHits = () => {
      if (state.ignoreOwnKills) suppressFountainKillGain += 1;
      try {
        const kills = dealSummonHits(state, mobs, ctx, { skipVisual: true, frames: null });
        notifyIceAgeFromLightningId(state.parentSkillId, ctx);
        if (typeof ctx.onProjectileResolve === 'function' && kills.length) {
          ctx.onProjectileResolve(kills);
        }
        return { kills, procs: 1 };
      } finally {
        if (state.ignoreOwnKills) suppressFountainKillGain = Math.max(0, suppressFountainKillGain - 1);
      }
    };
    if (delayMs > 0) {
      setTimeout(runHits, delayMs);
      return { kills: [], procs: 1, deferred: true };
    }
    return runHits();
  }

  function onHuntKill(mob, ctx = {}) {
    if (!summons.length) return null;
    if (suppressFountainKillGain > 0) return null;
    const t = nowMs();
    let last = null;
    summons.forEach((state) => {
      if (state.mode !== 'killBurst') return;
      if (t >= state.expiresAt) return;
      if (state.bursting) return;
      state.killCount = (Number(state.killCount) || 0) + 1;
      if (state.killCount < state.killThreshold) return;
      state.killCount = 0;
      state.bursting = true;
      const lockFrames = state.summonAttacks.length
        ? state.summonAttacks[state.attackIdx % state.summonAttacks.length]
        : null;
      last = procSummonAttack(state, ctx, t);
      const lockMs = Math.max(
        800,
        (typeof SkillEffectPlayer !== 'undefined'
          ? SkillEffectPlayer.framesDurationMs?.(lockFrames)
          : 0) || 1400,
      );
      const parentId = String(state.parentSkillId || '');
      setTimeout(() => {
        const live = summons.find((s) => String(s.parentSkillId) === parentId);
        if (live) live.bursting = false;
      }, lockMs);
    });
    return last;
  }

  function activateSpiderMirror(skill, level, ctx = {}) {
    const summon = typeof SkillCatalog !== 'undefined'
      ? SkillCatalog.getSkill(SPIDER_SUMMON_ID)
      : null;
    if (!skill) return false;
    const st = (typeof SkillFormula !== 'undefined' && SkillFormula.evalStatCommon)
      ? SkillFormula.evalStatCommon(skill.common, level)
      : {};
    const summonStat = summon && typeof SkillFormula !== 'undefined'
      ? SkillFormula.evalStatCommon(summon.common, level)
      : {};
    const durationMs = scaleGameMs(Math.max(1000, (Number(st.s) || Number(summonStat.timeSec) || 50) * 1000));
    const intervalMs = scaleGameMs(Math.max(400, Number(summonStat.xVal) || 2700));
    const visual = resolveSummonVisual(skill, summon);
    const attacks = resolveSummonAttacks(skill, summon);
    const extraAttackLayers = ['special/0', 'special/1', 'special/2']
      .map((key) => summon?.fx?.layers?.[key] || summon?.fx?.[key])
      .filter((frames) => Array.isArray(frames) && frames.length);
    clearSummonBySkillId(skill.id);
    clearSummonBySkillId(SPIDER_SUMMON_ID);
    if (typeof SkillModifiers !== 'undefined' && typeof SkillModifiers.applyBuff === 'function') {
      SkillModifiers.applyBuff({
        id: String(skill.id),
        name: skill.name || '',
        icon: skill.icon || summon?.icon || '',
        durationMs,
      });
    }
    const placement = resolveSummonPlacement(summon || skill, st);
    placement.parentSkillId = String(skill.id);
    const placed = placeSummonVisual(
      visual,
      ctx.fieldEl || null,
      ctx.playerEl || null,
      placement,
      ctx,
    );
    const hitAfterMs = 1800;
    pushSummonState({
      mode: 'summon',
      parentSkillId: String(skill.id),
      summonSkillId: SPIDER_SUMMON_ID,
      expiresAt: nowMs() + durationMs,
      intervalMs,
      maxProcs: Math.max(1, Math.floor(Number(st.w) || 10)),
      damagePct: Number(summonStat.damagePct) || Number(st.xVal) || 0,
      attackCount: Math.max(1, Math.floor(Number(st.y) || 8)),
      mobCount: Math.max(1, Math.floor(Number(st.mobCount) || 15)),
      summonAttacks: (summon?.fx?.hit?.length ? [summon.fx.hit] : attacks),
      extraAttackLayers,
      fieldEl: ctx.fieldEl || null,
      anchorX: placed?.x ?? 160,
      anchorY: placed?.y ?? 220,
      facingRight: placed?.facingRight != null ? !!placed.facingRight : true,
      standFxId: placed?.standFxId ?? null,
      hitFrames: null,
      hitAfterMs,
      attackOnSelfOnly: true,
      placement,
      endFrames: visual?.die || null,
      standFrames: visual?.stand || visual?.move || null,
      lastProcAt: nowMs() - intervalMs + scaleGameMs(1800),
    });
    return true;
  }

  function activateAuraWeaponFollow(skill, level, stat, ctx, durationMs) {
    const intervalMs = scaleGameMs(Math.max(1000, (Number(stat?.q) || 5) * 1000));
    clearSummonBySkillId(skill.id);
    const special = skill.fx?.special?.frames || skill.fx?.special || [];
    const placement = resolveSummonPlacement(skill, stat);
    placement.parentSkillId = String(skill.id);
    placement.followPlayer = true;
    placement.attachToPlayer = true;
    if (ctx.playerEl && typeof SkillEffectPlayer !== 'undefined') {
      if (skill.fx?.effect?.length) {
        SkillEffectPlayer.playOnPlayer(skill.fx.effect, {
          playerEl: ctx.playerEl,
          fieldEl: ctx.fieldEl,
          className: 'idle-skill-fx-stage idle-skill-fx-stage--cast idle-skill-fx-stage--aura-weapon',
        });
      }
      if (skill.fx?.effect0?.length) {
        SkillEffectPlayer.playOnPlayer(skill.fx.effect0, {
          playerEl: ctx.playerEl,
          fieldEl: ctx.fieldEl,
          className: 'idle-skill-fx-stage idle-skill-fx-stage--cast idle-skill-fx-stage--aura-weapon',
        });
      }
    }
    const placed = placeSummonVisual(
      { stand: Array.isArray(special) ? special : [] },
      ctx.fieldEl || null,
      ctx.playerEl || null,
      placement,
      ctx,
    );
    pushSummonState({
      mode: 'onCast',
      parentSkillId: String(skill.id),
      expiresAt: nowMs() + durationMs,
      intervalMs,
      damagePct: Number(stat?.xVal) || 0,
      attackCount: Math.max(1, Math.floor(Number(stat?.w) || 6)),
      mobCount: Math.max(1, Math.floor(Number(stat?.mobCount) || 10)),
      summonAttacks: [],
      fieldEl: ctx.fieldEl || null,
      standFxId: placed?.standFxId ?? null,
      hitFrames: skill.fx?.hit || null,
      placement,
      followPlayer: true,
      lastProcAt: nowMs(),
    });
    return true;
  }

  function playFollowCastFx(skill, ctx, classSuffix) {
    if (!ctx.playerEl || typeof SkillEffectPlayer === 'undefined') return;
    const cls = `idle-skill-fx-stage idle-skill-fx-stage--cast idle-skill-fx-stage--${classSuffix}`;
    if (skill.fx?.effect?.length) {
      SkillEffectPlayer.playOnPlayer(skill.fx.effect, {
        playerEl: ctx.playerEl,
        fieldEl: ctx.fieldEl,
        className: cls,
      });
    }
    if (skill.fx?.effect0?.length) {
      SkillEffectPlayer.playOnPlayer(skill.fx.effect0, {
        playerEl: ctx.playerEl,
        fieldEl: ctx.fieldEl,
        className: cls,
      });
    }
  }

  /**
   * 普力特 1～5 層：優先 400001029 indie 欄；缺層時退回 024 的 w/q/u/v。
   * 冷卻縮短固定 10%（WZ w／indieCooltimeReduce）。
   */
  function applyFreudBlessingCombatMods(mods, layerStat, parentStat) {
    if (!mods) return;
    const reduce = Number(layerStat?.indieCooltimeReduce) || Number(parentStat?.w) || 0;
    mods.coolTimeR = reduce > 0 ? reduce : 10;
    if ((Number(mods.flatPad) || 0) > 0) return;
    const all = Number(parentStat?.q) || 0;
    const pad = Number(parentStat?.u) || 0;
    const bd = Number(parentStat?.v) || 0;
    if (all > 0) {
      mods.flatStr = (Number(mods.flatStr) || 0) + all;
      mods.flatDex = (Number(mods.flatDex) || 0) + all;
      mods.flatInt = (Number(mods.flatInt) || 0) + all;
      mods.flatLuk = (Number(mods.flatLuk) || 0) + all;
    }
    if (pad > 0) {
      mods.flatPad = (Number(mods.flatPad) || 0) + pad;
      mods.flatMad = (Number(mods.flatMad) || 0) + pad;
    }
    if (bd > 0) mods.bdR = (Number(mods.bdR) || 0) + bd;
  }

  function playFreudBlessingFx(ctx = {}) {
    if (typeof SkillEffectPlayer === 'undefined' || typeof SkillCatalog === 'undefined') return;
    let delay = 0;
    FREUD_BLESSING_FX_IDS.forEach((sid) => {
      const frames = SkillCatalog.getSkill(sid)?.fx?.effect || [];
      if (!frames.length) return;
      const dur = (typeof SkillEffectPlayer.framesDurationMs === 'function')
        ? SkillEffectPlayer.framesDurationMs(frames)
        : frames.reduce((sum, f) => sum + (Number(f?.delay) || 70), 0);
      const startAt = delay;
      setTimeout(() => {
        SkillEffectPlayer.playOnPlayer(frames, {
          playerEl: ctx.playerEl,
          fieldEl: ctx.fieldEl,
          forcePlay: true,
          className: 'idle-skill-fx-stage idle-skill-fx-stage--cast idle-skill-fx-stage--freud-blessing',
        });
      }, Math.max(0, startAt));
      delay += Math.max(30, dur);
    });
  }

  function activateFreudBlessing(skill, level, stat, ctx, durationMs) {
    playFreudBlessingFx(ctx);
    return true;
  }

  function evalCommonKey(common, key, level, fallback = 0) {
    if (!common || common[key] == null || String(common[key]) === '') return fallback;
    if (typeof SkillFormula !== 'undefined' && SkillFormula.evalExpr) {
      const n = SkillFormula.evalExpr(common[key], { x: Math.max(0, Number(level) || 0) });
      return Number.isFinite(n) ? n : fallback;
    }
    const n = Number(common[key]);
    return Number.isFinite(n) ? n : fallback;
  }

  function procSpotlight(state, ctx, t = nowMs()) {
    if (!state) return null;
    state.lastProcAt = t;
    state.procCount += 1;
    const mobs = resolveSummonTargets(ctx, state.mobCount);
    const cut = Math.max(0, Number(state.laterLightFdCut) || 75);
    const laterMult = Math.max(0, (100 - cut) / 100);
    const lights = Math.max(1, Math.floor(Number(state.lightCount) || 3));
    const kills = [];
    for (let i = 0; i < lights; i += 1) {
      dealSummonHits(state, mobs, ctx, {
        skipVisual: true,
        frames: null,
        outgoingMult: i === 0 ? 1 : laterMult,
        skipHitFx: i > 0,
      }).forEach((m) => {
        if (m && !kills.includes(m)) kills.push(m);
      });
    }
    if (typeof SkillModifiers !== 'undefined' && typeof SkillModifiers.tryProcAffinityHeart === 'function') {
      SkillModifiers.tryProcAffinityHeart(SPOTLIGHT_ID);
    }
    if (typeof ctx.onProjectileResolve === 'function' && kills.length) {
      ctx.onProjectileResolve(kills);
    }
    return { kills, procs: 1 };
  }

  function spotlightLampPose(playerPt, angleFromVerticalDeg, dist) {
    const rad = (Number(angleFromVerticalDeg) || 0) * Math.PI / 180;
    const d = Math.max(400, Number(dist) || 990);
    const lx = playerPt.x + Math.sin(rad) * d;
    const ly = playerPt.y - Math.cos(rad) * d;
    const dx = playerPt.x - lx;
    const dy = playerPt.y - ly;
    const aimDeg = Math.atan2(dy, dx) * (180 / Math.PI);
    return { x: lx, y: ly, rotateDeg: aimDeg - 180 };
  }

  function activateSpotlight(skill, level, stat, ctx, durationMs) {
    clearSummonBySkillId(skill.id);
    const placement = resolveSummonPlacement(skill, stat);
    placement.parentSkillId = String(skill.id);
    placement.followPlayer = true;
    placement.attachToPlayer = false;
    placement.behind = true;
    placement.skipAttackAnim = true;
    const fieldEl = ctx.fieldEl || document.getElementById('idleHuntField');
    const playerEl = ctx.playerEl || null;
    const lightSkill = typeof SkillCatalog !== 'undefined'
      ? SkillCatalog.getSkill(SPOTLIGHT_STAT_ID)
      : null;
    const glow = lightSkill?.fx?.layers?.repeat || lightSkill?.fx?.repeat || [];
    const tileFrames = skill.fx?.tiles?.[0]?.frames
      || skill.fx?.layers?.tile
      || [];
    const extraStandFxIds = [];
    let tileFxId = null;
    const spreadDeg = evalCommonKey(skill.common, 'q', level, 35);
    const lampDist = Math.max(720, Number(stat?.z) || evalCommonKey(skill.common, 'z', level, 990));
    const lightAngles = [-spreadDeg, 0, spreadDeg];
    if (tileFrames.length && fieldEl && typeof SkillEffectPlayer !== 'undefined'
      && typeof SkillEffectPlayer.playAtField === 'function') {
      lightAngles.forEach((ang, idx) => {
        const id = SkillEffectPlayer.playAtField({
          fieldEl,
          frames: tileFrames,
          x: 160,
          y: 80,
          loop: true,
          className: `${summonClassName(placement)} idle-skill-fx-stage--ab-spotlight-tile`,
          zIndex: 26 + idx,
          behind: true,
          playerEl,
          mirrorX: false,
          forcePlay: true,
          rotateDeg: spotlightLampPose({ x: 160, y: 220 }, ang, lampDist).rotateDeg,
          resolveAnchor: () => {
            const pt = summonFieldPoint(fieldEl, playerEl, { slot: 'player-feet' }, ctx);
            const pose = spotlightLampPose(pt, ang, lampDist);
            return { x: pose.x, y: pose.y, rotateDeg: pose.rotateDeg };
          },
        });
        if (id != null) {
          extraStandFxIds.push(id);
          if (tileFxId == null) tileFxId = id;
        }
      });
    }
    if (glow.length && fieldEl && playerEl && typeof SkillEffectPlayer !== 'undefined'
      && typeof SkillEffectPlayer.playOnPlayer === 'function') {
      const glowId = SkillEffectPlayer.playOnPlayer(glow, {
        fieldEl,
        playerEl,
        loop: true,
        className: `${summonClassName(placement)} idle-skill-fx-stage--ab-spotlight-glow`,
        zIndex: 42,
        behind: false,
        forcePlay: true,
      });
      if (glowId != null) extraStandFxIds.push(glowId);
    }
    const intervalMs = scaleGameMs(Math.max(200, Number(stat?.subTimeMs) || 720));
    const standFxId = tileFxId != null
      ? tileFxId
      : (extraStandFxIds[0] || null);
    pushSummonState({
      mode: 'summon',
      parentSkillId: String(skill.id),
      expiresAt: nowMs() + durationMs,
      intervalMs,
      damagePct: Number(stat?.damagePct) || 0,
      attackCount: Math.max(1, Math.floor(Number(stat?.attackCount) || 3)),
      mobCount: Math.max(1, Math.floor(Number(stat?.mobCount) || 15)),
      fieldEl,
      playerEl,
      standFxId,
      extraStandFxIds: extraStandFxIds.filter((id) => id !== standFxId),
      hitFrames: skill.fx?.hit || null,
      placement,
      followPlayer: true,
      lightCount: 3,
      laterLightFdCut: evalCommonKey(skill.common, 'u3', level, 75),
      lastProcAt: 0,
    });
    return true;
  }

  function activateElementalGhost(skill, level, stat, ctx, durationMs) {
    clearSummonBySkillId(skill.id);
    const placement = resolveSummonPlacement(skill, stat);
    placement.parentSkillId = String(skill.id);
    if (skill.fx?.effect?.length && ctx.playerEl && typeof SkillEffectPlayer !== 'undefined') {
      SkillEffectPlayer.playOnPlayer(skill.fx.effect, {
        playerEl: ctx.playerEl,
        fieldEl: ctx.fieldEl,
        className: 'idle-skill-fx-stage idle-skill-fx-stage--cast idle-skill-fx-stage--elemental-ghost',
      });
    }
    pushSummonState({
      mode: 'summon',
      parentSkillId: String(skill.id),
      expiresAt: nowMs() + durationMs,
      intervalMs: 999999,
      damagePct: 0,
      attackCount: 1,
      mobCount: 1,
      fieldEl: ctx.fieldEl || null,
      standFxId: null,
      placement,
      followPlayer: false,
      lastProcAt: nowMs(),
    });
    if (typeof Paperdoll !== 'undefined' && typeof Paperdoll.syncShadowPartnerClone === 'function') {
      Paperdoll.syncShadowPartnerClone();
    }
    return true;
  }

  function activateRoyalKnights(skill, level, stat, ctx, durationMs) {
    clearSummonBySkillId(skill.id);
    const placement = resolveSummonPlacement(skill, stat);
    placement.parentSkillId = String(skill.id);
    placement.followPlayer = false;
    placement.attachToPlayer = false;
    placement.behind = true;
    const layers = skill.fx?.layers || {};
    const start = layers['special/start'] || [];
    const loop = skipLeadDummyFrames(layers['special/loop'] || []);
    const fieldEl = ctx.fieldEl || null;
    if (start.length) playCoverScreen(fieldEl, start, { loop: false, zIndex: 16 });
    const startDur = (typeof SkillEffectPlayer !== 'undefined'
      && typeof SkillEffectPlayer.framesDurationMs === 'function')
      ? SkillEffectPlayer.framesDurationMs(skipLeadDummyFrames(start))
      : 400;
    setTimeout(() => {
      const state = summons.find((s) => String(s.parentSkillId) === ROYAL_KNIGHTS_ID);
      if (!state || nowMs() >= state.expiresAt) return;
      state.standFxId = playCoverScreen(fieldEl, loop, { loop: true, zIndex: 16 });
    }, Math.max(60, startDur || 400));
    const hitSkill = typeof SkillCatalog !== 'undefined'
      ? SkillCatalog.getSkill(ROYAL_KNIGHTS_HIT_ID)
      : null;
    const hitStat = hitSkill && typeof SkillFormula !== 'undefined'
      ? SkillFormula.evalStatCommon(hitSkill.common, level)
      : null;
    const intervalSec = Number(stat?.t);
    const intervalMs = Number(hitStat?.cooltimeMS) > 0
      ? Number(hitStat.cooltimeMS)
      : ((Number.isFinite(intervalSec) && intervalSec > 0) ? intervalSec * 1000 : 1400);
    pushSummonState({
      mode: 'onCast',
      parentSkillId: String(skill.id),
      summonSkillId: ROYAL_KNIGHTS_HIT_ID,
      expiresAt: nowMs() + durationMs,
      intervalMs: scaleGameMs(Math.max(400, intervalMs)),
      damagePct: Number(hitStat?.damagePct) || Number(stat?.u) || 0,
      attackCount: Math.max(1, Math.floor(Number(hitStat?.attackCount) || Number(stat?.v) || 4)),
      swordsPerProc: Math.max(1, Math.floor(Number(hitStat?.bulletCount) || Number(stat?.s) || 4)),
      mobCount: Math.max(1, Math.floor(Number(hitStat?.mobCount) || 1)),
      summonAttacks: [],
      knightHitLayers: listRoyalKnightHitLayers(hitSkill),
      fieldEl: ctx.fieldEl || null,
      playerEl: ctx.playerEl || null,
      standFxId: null,
      hitFrames: null,
      endFrames: layers['special/end'] || null,
      coverField: true,
      placement,
      followPlayer: false,
      lastProcAt: 0,
    });
    return true;
  }

  function listRoyalKnightHitLayers(hitSkill) {
    const layers = hitSkill?.fx?.layers || {};
    const out = [];
    for (let i = 0; i < 8; i += 1) {
      const frames = layers[`hit/${i}`];
      if (frames?.length) out.push(frames);
    }
    if (!out.length && hitSkill?.fx?.hit?.length) out.push(hitSkill.fx.hit);
    return out;
  }

  function procRoyalKnights(state, ctx, t = nowMs()) {
    state.lastProcAt = t;
    state.procCount += 1;
    const knightCount = Math.max(1, state.swordsPerProc || 4);
    const mobs = resolveSummonTargets(ctx, Math.max(1, state.mobCount || 1));
    const hitLayers = (state.knightHitLayers && state.knightHitLayers.length)
      ? state.knightHitLayers
      : listRoyalKnightHitLayers(
        typeof SkillCatalog !== 'undefined' ? SkillCatalog.getSkill(ROYAL_KNIGHTS_HIT_ID) : null,
      );
    const fieldEl = ctx.fieldEl || state.fieldEl;
    const primary = mobs[0];
    if (typeof SkillEffectPlayer !== 'undefined' && typeof SkillEffectPlayer.playOnMob === 'function') {
      for (let i = 0; i < knightCount; i += 1) {
        const mob = mobs[i % Math.max(1, mobs.length)] || primary;
        const frames = hitLayers[i % Math.max(1, hitLayers.length)];
        if (!mob || !frames?.length) continue;
        const play = () => {
          if (!(Number(mob.hp) > 0)) return;
          SkillEffectPlayer.playOnMob(mob, frames, {
            fieldEl,
            forcePlay: true,
            forceHitFx: true,
            className: 'idle-skill-fx-stage idle-skill-fx-stage--royal-knights-hit',
          });
        };
        if (i === 0) play();
        else setTimeout(play, i * 40);
      }
    }
    return {
      kills: dealSummonHits({
        ...state,
        hitFrames: null,
        summonAttacks: [],
      }, mobs, ctx, { skipVisual: true }),
      procs: 1,
    };
  }

  function procAuraWeaponBall(state, ctx, t = nowMs()) {
    const ballSkill = typeof SkillCatalog !== 'undefined'
      ? SkillCatalog.getSkill(AURA_WEAPON_BALL_ID)
      : null;
    const ballFx = ballSkill?.fx || {};
    const ballFrames = ballFx.ball?.frames || [];
    const plan = ballSkill?.ballCast || null;
    state.lastProcAt = t;
    state.procCount += 1;
    const mobs = resolveSummonTargets(ctx, state.mobCount);
    const facingRight = (typeof SkillEffectPlayer !== 'undefined'
      && SkillEffectPlayer.playerFacingRight)
      ? SkillEffectPlayer.playerFacingRight(ctx.playerEl)
      : true;
    const hitState = {
      ...state,
      summonAttacks: [],
      hitFrames: ballFx.hit || state.hitFrames,
      attackOnSelfOnly: true,
    };
    if (ballFrames.length && typeof SkillEffectPlayer !== 'undefined'
      && typeof SkillEffectPlayer.playShootObj === 'function') {
      const kills = [];
      SkillEffectPlayer.playShootObj({
        fieldEl: ctx.fieldEl || state.fieldEl,
        playerEl: ctx.playerEl,
        mobs,
        frames: ballFrames,
        startOffset: [12, -48],
        pierce: true,
        maxTargets: Math.max(1, state.mobCount),
        facingRight,
        speedPxPerMs: (50 / 30) * 0.7,
        maxRange: Math.max(850, Number(ballSkill?.common?.range) || 0),
        onHit: (mob) => {
          if (!mob || !(Number(mob.hp) > 0)) return;
          dealSummonHits(hitState, [mob], ctx).forEach((k) => {
            if (k && !kills.includes(k)) kills.push(k);
          });
        },
        onDone: () => {
          if (typeof ctx.onProjectileResolve === 'function' && kills.length) {
            ctx.onProjectileResolve(kills);
          }
        },
      });
      return { kills, procs: 1, deferred: true };
    }
    if (ballFrames.length && typeof SkillBallCast !== 'undefined'
      && typeof SkillBallCast.playBallCast === 'function' && plan) {
      const kills = [];
      SkillBallCast.playBallCast({
        fieldEl: ctx.fieldEl || state.fieldEl,
        playerEl: ctx.playerEl,
        fx: ballFx,
        plan: { ...plan, launchMs: 0 },
        skill: ballSkill,
        mobs,
        maxTargets: state.mobCount,
        facingRight,
        omitPlayerEffect: true,
        onHit: (mob) => {
          if (!mob || !(Number(mob.hp) > 0)) return;
          dealSummonHits(hitState, [mob], ctx).forEach((k) => {
            if (k && !kills.includes(k)) kills.push(k);
          });
        },
        onDone: () => {
          if (typeof ctx.onProjectileResolve === 'function' && kills.length) {
            ctx.onProjectileResolve(kills);
          }
        },
      });
      return { kills, procs: 1, deferred: true };
    }
    return procSummonAttack(state, ctx, t);
  }

  function afterActiveCast(skill, level, ctx = {}) {
    const id = String(skill?.id || '');
    if (id === SPIDER_MIRROR_ID) {
      activateSpiderMirror(skill, level, ctx);
    }
  }

  function procOnCastFollowers(triggerSkill, ctx = {}) {
    const t = nowMs();
    expireSummons(t, ctx);
    const tid = String(triggerSkill?.id || '');
    let last = null;
    summons.forEach((state) => {
      if (state.mode !== 'onCast') return;
      if (t >= state.expiresAt) return;
      if (String(state.parentSkillId) === tid) return;
      if (state.pauseStandOnAttack && state.attacking) return;
      if (Array.isArray(state.triggerSkillIds) && state.triggerSkillIds.length) {
        if (!state.triggerSkillIds.includes(tid)) return;
      }
      if (state.lastProcAt > 0 && (t - state.lastProcAt) < state.intervalMs) return;
      if (String(state.parentSkillId) === AURA_WEAPON_ID) {
        last = procAuraWeaponBall(state, ctx, t);
        return;
      }
      if (String(state.parentSkillId) === COMBO_INSTINCT_ID) {
        last = procComboInstinctCracks(state, ctx, t);
        return;
      }
      if (String(state.parentSkillId) === ROYAL_KNIGHTS_ID) {
        last = procRoyalKnights(state, ctx, t);
        return;
      }
      last = procSummonAttack(state, ctx, t);
    });
    return last;
  }

  /**
   * 劍術主動技施放成功後：可能觸發一波劍擊
   * @returns {{ kills: object[], procs: number } | null}
   */
  function onSwordSkillCast(skill, ctx = {}) {
    const t = nowMs();
    const follow = procOnCastFollowers(skill, ctx);
    if (!skill || !canProcSwordSkill(skill.id, t)) return follow;
    const state = afterimage;
    if (!state) return follow;

    state.lastProcAt = t;
    state.procCount += 1;

    const mobs = resolveSummonTargets(ctx, state.mobCount);
    const kills = dealSummonHits(state, mobs, ctx);

    if (state.procCount >= state.maxProcs) afterimage = null;
    const result = { kills, procs: 1 };
    if (follow?.kills?.length) {
      follow.kills.forEach((m) => {
        if (m && !kills.includes(m)) kills.push(m);
      });
    }
    return result;
  }

  function getAfterimageState() {
    tick();
    return afterimage;
  }

  return {
    reset,
    tick,
    isTimedBuffSkill,
    isToggleBuffSkill,
    activateTimedBuff,
    onSwordSkillCast,
    onHuntKill,
    afterActiveCast,
    activateWindShurikenLinger,
    summonFieldPoint,
    ICE_AGE_ID,
    ICE_AGE_LIGHTNING_TRIGGER_IDS,
    getAfterimageState,
    clearAfterimage,
  };
})();

if (typeof window !== 'undefined') {
  window.SkillBuffRuntime = SkillBuffRuntime;
}
