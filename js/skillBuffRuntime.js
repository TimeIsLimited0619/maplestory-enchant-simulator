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
  };

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
    if (state.standFxId != null && typeof SkillEffectPlayer !== 'undefined') {
      SkillEffectPlayer.stopFx?.(state.standFxId);
    }
    state.standFxId = null;
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

  function resolveSummonAttacks(skill, summon) {
    const fromParent = (skill?.fx?.summonAttacks || [])
      .map((a) => a?.frames)
      .filter((f) => Array.isArray(f) && f.length);
    if (fromParent.length) return fromParent;
    return (summon?.fx?.summonAttacks || [])
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
      behindExtra: cfg?.behindExtra ?? 0,
      headLift: cfg?.headLift ?? 0,
      offsetX: Number(stat?.s) || 0,
      offsetY: Number(stat?.v) || 0,
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

    const startStand = () => {
      if (!stand?.length) return null;
      return SkillEffectPlayer.playAtField({
        fieldEl,
        frames: stand,
        x: pt.x,
        y: pt.y,
        loop: true,
        className,
        mirrorX: facingRight,
        zIndex: placement.zIndex,
        behind: !!placement.behind,
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
        onDone: () => {},
      });
      const dur = SkillEffectPlayer.framesDurationMs?.(summoned) || 400;
      setTimeout(() => {
        const state = summons.find((s) => String(s.parentSkillId) === String(parentSkillId));
        if (!state || state.mode !== 'summon') return;
        state.standFxId = startStand();
      }, Math.max(60, dur));
      return { x: pt.x, y: pt.y, standFxId: null, facingRight };
    }

    const standFxId = startStand();
    return { x: pt.x, y: pt.y, standFxId, facingRight };
  }

  function expireSummons(t = nowMs()) {
    summons = summons.filter((s) => {
      if (t >= s.expiresAt) {
        clearSummonVisualState(s);
        return false;
      }
      return true;
    });
  }

  function tick(t = nowMs(), ctx = null) {
    expireSummons(t);

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
      if (state.lastProcAt > 0 && (t - state.lastProcAt) < state.intervalMs) return;
      lastResult = procSummonAttack(state, ctx, t);
    });
    return lastResult;
  }

  function isToggleBuffSkill(skill) {
    if (!skill) return false;
    if (skill.toggle) return true;
    const text = `${skill.desc || ''}${skill.h || ''}`;
    return /開關技能/.test(text);
  }

  function isTimedBuffSkill(skill, common) {
    if (!skill || !common) return false;
    // 開關技：即使 time 很短也走 buff 管線（activate 內會拉長持續）
    if (isToggleBuffSkill(skill)) return skill.type === 'buff' || skill.type === 'active';
    if (!(common.timeSec > 0)) return false;
    if (skill.summonSkillId || skill.fx?.summonAttacks?.length || skill.fx?.summonVisual) {
      return true;
    }
    if (typeof SkillFormula !== 'undefined' && SkillFormula.evalStatCommon) {
      const st = SkillFormula.evalStatCommon(skill.common, 1);
      if (st.indiePad > 0 || st.indieCr > 0 || st.indieMad > 0 || st.madX > 0) return true;
      if ((Number(st.indiePadR) || 0) > 0 || (Number(st.indieDamR) || 0) > 0) return true;
      if ((Number(st.emhp) || 0) > 0) return true;
      if ((Number(st.damAbsorbShieldR) || 0) > 0) return true;
    }
    return skill.type === 'buff';
  }

  /**
   * 施放時限 Buff：上數值 +（可選）意念 afterimage／召喚物 autotick
   */
  function activateTimedBuff(skill, level, common, ctx = {}) {
    if (!skill || !common) return false;
    const toggle = isToggleBuffSkill(skill);
    if (toggle && typeof SkillModifiers !== 'undefined' && SkillModifiers.hasBuff?.(skill.id)) {
      SkillModifiers.clearBuff?.(String(skill.id));
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
    const durationMult = (typeof SkillModifiers !== 'undefined'
      && typeof SkillModifiers.getBuffDurationMultiplier === 'function')
      ? SkillModifiers.getBuffDurationMultiplier()
      : 1;
    const durationMs = scaleGameMs(Math.round(durationBaseMs * durationMult));
    if (!(durationMs > 0)) return false;

    if (typeof SkillModifiers !== 'undefined') {
      const mods = (typeof SkillModifiers.modsFromStat === 'function' && stat)
        ? SkillModifiers.modsFromStat(stat, skill.id, skill.common, level, skill)
        : {};
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
    const visual = resolveSummonVisual(skill, summon);
    const hasIndie = ((stat?.indiePad || 0) + (stat?.padX || 0)) > 0;
    const wantsAutotick = attacks.length > 0
      && (stat?.subTimeMs > 0 || summonStat?.subTimeMs > 0 || !!visual)
      && !hasIndie;

    if (wantsAutotick) {
      clearSummonBySkillId(skill.id);
      const placement = resolveSummonPlacement(skill, stat);
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

  function dealSummonHits(state, mobs, ctx) {
    const kills = [];
    const frames = state.summonAttacks.length
      ? state.summonAttacks[state.attackIdx % state.summonAttacks.length]
      : null;
    state.attackIdx += 1;

    if (frames && typeof SkillEffectPlayer !== 'undefined') {
      if (state.mode === 'summon' && state.fieldEl && typeof SkillEffectPlayer.playAtField === 'function') {
        const suffix = state.placement?.classSuffix;
        const attackClass = suffix
          ? `idle-skill-fx-stage idle-skill-fx-stage--summon-attack idle-skill-fx-stage--${suffix}`
          : 'idle-skill-fx-stage idle-skill-fx-stage--summon-attack';
        SkillEffectPlayer.playAtField({
          fieldEl: state.fieldEl,
          frames,
          x: state.anchorX,
          y: state.anchorY,
          loop: false,
          className: attackClass,
          mirrorX: state.facingRight != null ? !!state.facingRight : true,
          zIndex: state.placement?.zIndex,
          behind: !!state.placement?.behind,
        });
      }
    }

    mobs.forEach((mob) => {
      if (!mob) return;
      if (frames && typeof SkillEffectPlayer !== 'undefined' && state.mode !== 'summon') {
        SkillEffectPlayer.playOnMob(mob, frames, {
          className: 'idle-skill-fx-stage idle-skill-fx-stage--summon',
        });
      }
      if (state.hitFrames?.length && typeof SkillEffectPlayer !== 'undefined') {
        SkillEffectPlayer.playOnMob(mob, state.hitFrames);
      }
      let any = false;
      for (let s = 0; s < state.swordsPerProc; s += 1) {
        for (let i = 0; i < state.attackCount; i += 1) {
          let hit = { dmg: 0, isCritical: false };
          if (typeof UiCharacterInfo !== 'undefined' && UiCharacterInfo.rollHuntHit) {
            hit = UiCharacterInfo.rollHuntHit(!!mob.isBoss, { damagePct: state.damagePct });
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
          if (!(dmg > 0)) continue;
          any = true;
          const dmgOpts = {
            multiHit: true,
            stackIndex: s * state.attackCount + i,
          };
          if (typeof IdleHunt !== 'undefined' && typeof IdleHunt.applyPlayerHitToMob === 'function') {
            IdleHunt.applyPlayerHitToMob(mob, dmg, {
              isCritical: !!hit.isCritical,
              showMobDamage: ctx.showMobDamage,
              onDamage: ctx.onDamage,
              dmgOpts,
            });
          } else {
            if (typeof ctx.showMobDamage === 'function') {
              ctx.showMobDamage(mob, dmg, hit.isCritical, dmgOpts);
            }
            if (typeof ctx.onDamage === 'function') ctx.onDamage(dmg);
            const finalDmg = (typeof IdleHunt !== 'undefined' && typeof IdleHunt.resolveMobHitDamage === 'function')
              ? IdleHunt.resolveMobHitDamage(mob, dmg)
              : dmg;
            mob.hp -= finalDmg;
          }
        }
      }
      if (typeof SkillMobStatus !== 'undefined'
        && typeof SkillMobStatus.afterPlayerDamagedMob === 'function') {
        SkillMobStatus.afterPlayerDamagedMob(mob, any, {
          skillId: state.parentSkillId || state.summonSkillId || null,
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

  function procSummonAttack(state, ctx, t = nowMs()) {
    if (!state || state.mode !== 'summon') return null;
    state.lastProcAt = t;
    state.procCount += 1;
    const mobs = resolveSummonTargets(ctx, state.mobCount);
    const kills = dealSummonHits(state, mobs, ctx);
    if (typeof ctx.onProjectileResolve === 'function' && kills.length) {
      ctx.onProjectileResolve(kills);
    }
    return { kills, procs: 1 };
  }

  /**
   * 劍術主動技施放成功後：可能觸發一波劍擊
   * @returns {{ kills: object[], procs: number } | null}
   */
  function onSwordSkillCast(skill, ctx = {}) {
    const t = nowMs();
    if (!skill || !canProcSwordSkill(skill.id, t)) return null;
    const state = afterimage;
    if (!state) return null;

    state.lastProcAt = t;
    state.procCount += 1;

    const mobs = resolveSummonTargets(ctx, state.mobCount);
    const kills = dealSummonHits(state, mobs, ctx);

    if (state.procCount >= state.maxProcs) afterimage = null;
    return { kills, procs: 1 };
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
    getAfterimageState,
    clearAfterimage,
  };
})();

if (typeof window !== 'undefined') {
  window.SkillBuffRuntime = SkillBuffRuntime;
}
