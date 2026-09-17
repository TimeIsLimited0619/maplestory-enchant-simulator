/**
 * 區域施放（冰川之牆等）：
 * 同時播 effect / effect0 / special / special0，於 hitFrame 結算傷害。
 */
const SkillAreaCast = (() => {
  function scaleRealMs(ms) {
    if (typeof IdleHunt !== 'undefined' && typeof IdleHunt.scaleDelayMs === 'function') {
      return IdleHunt.scaleDelayMs(ms);
    }
    return Math.max(0, Number(ms) || 0);
  }

  function framesDurationMs(frames, untilIdx) {
    const list = frames || [];
    const end = untilIdx != null ? Math.min(untilIdx, list.length) : list.length;
    let sum = 0;
    for (let i = 0; i < end; i += 1) {
      sum += Math.max(1, Number(list[i]?.delay) || 60);
    }
    return sum;
  }

  function buildPlan(skill, fx) {
    if (skill?.areaCast) return skill.areaCast;
    if (!fx) return null;
    if (fx.ball) return null;
    const hasSpecial0 = Array.isArray(fx.special0) && fx.special0.length > 0;
    const hasSpecial = !!(fx.special?.frames?.length);
    const hasEffect = Array.isArray(fx.effect) && fx.effect.length > 0;
    const hasScreen = Array.isArray(fx.screen) && fx.screen.length > 0;
    if (!(hasSpecial0 && hasSpecial && hasEffect)
      && !(skill?.areaAttack && hasSpecial && hasEffect)
      && !(skill?.areaAttack && hasEffect)) {
      return null;
    }
    const hitFrame = 8;
    let hitMs = framesDurationMs(fx.effect, hitFrame);
    if (!(hitMs > 0)) hitMs = hitFrame * 60;
    return {
      hitFrame,
      hitMs,
      fieldFx: !!(skill?.areaAttack && !hasSpecial0),
      layers: hasScreen
        ? ['effect', 'effect0', 'special', 'special0', 'screen']
        : ['effect', 'effect0', 'special', 'special0'],
    };
  }

  function isAreaCastSkill(skill, fx) {
    return !!buildPlan(skill, fx);
  }

  function playLayer(playerEl, frames, opts = {}) {
    if (!frames?.length || typeof SkillEffectPlayer === 'undefined') return;
    SkillEffectPlayer.playOnPlayer(frames, {
      playerEl,
      className: opts.className || 'idle-skill-fx-stage idle-skill-fx-stage--cast',
      loop: !!opts.loop,
    });
  }

  function playerFacingRight(playerEl) {
    if (typeof SkillEffectPlayer !== 'undefined' && SkillEffectPlayer.playerFacingRight) {
      return SkillEffectPlayer.playerFacingRight(playerEl);
    }
    return !playerEl?.classList?.contains('is-flip-x');
  }

  /**
   * @returns {boolean}
   */
  function playAreaCast(opts = {}) {
    const {
      playerEl,
      fieldEl,
      fx = {},
      plan,
      skill,
      targets,
      onHit,
      onDone,
    } = opts;

    const finish = () => {
      if (typeof onDone === 'function') onDone();
    };

    if (!plan || !fx) {
      finish();
      return false;
    }

    if (typeof document !== 'undefined' && document.hidden) {
      if (typeof onHit === 'function') onHit();
      finish();
      return true;
    }

    const field = fieldEl
      || playerEl?.closest?.('.idle-hunt-field')
      || (typeof document !== 'undefined' ? document.getElementById('idleHuntField') : null);
    const facingRight = playerFacingRight(playerEl);
    const shell = field?.closest?.('.idle-hunt-shell') || null;
    const shellLayer = (shell && typeof SkillEffectPlayer.getShellFxLayer === 'function')
      ? SkillEffectPlayer.getShellFxLayer(shell)
      : null;
    const fieldCenter = () => {
      const fr = field?.getBoundingClientRect?.();
      if (!fr) return { x: 400, y: 250 };
      return { x: Math.round(fr.width * 0.5), y: Math.round(fr.height * 0.5) };
    };
    const shellCenter = () => {
      if (!shell) return fieldCenter();
      return {
        x: Math.round((shell.clientWidth || 860) * 0.5),
        y: Math.round((shell.clientHeight || 820) * 0.5),
      };
    };

    if (fx.screen?.length && field && typeof SkillEffectPlayer.playAtField === 'function') {
      const mid = shell ? shellCenter() : fieldCenter();
      const host = shell || field;
      SkillEffectPlayer.playAtField({
        fieldEl: host,
        layerEl: shellLayer,
        frames: fx.screen,
        x: mid.x,
        y: mid.y,
        loop: false,
        className: 'idle-skill-fx-stage idle-skill-fx-stage--screen',
        zIndex: 72,
        // 客戶端 screen：WZ origin、蓋滿 IdleZone 外框；與角色面向同向翻轉
        mirrorX: facingRight,
        coverField: true,
        coverW: host.clientWidth || 860,
        coverH: host.clientHeight || 820,
        forcePlay: true,
      });
    }

    const mapCutLayers = [0, 1, 2, 3]
      .map((i) => fx.layers?.[`special/${i}`])
      .filter((frames) => Array.isArray(frames) && frames.length);
    if (mapCutLayers.length && field) {
      let cutDelay = 0;
      const screenFrames = fx.screen || [];
      for (let i = 0; i < screenFrames.length; i += 1) {
        const o = screenFrames[i]?.origin || [];
        if (Number(o[0]) === 0 && Number(o[1]) === 0) {
          cutDelay += Math.max(1, Number(screenFrames[i]?.delay) || 60);
        } else break;
      }
      const startCut = () => {
        if (typeof SkillEffectPlayer.playFieldMapCut === 'function') {
          SkillEffectPlayer.playFieldMapCut(field, {
            forcePlay: true,
            mirrorX: facingRight,
          });
        }
        const mid = shell ? shellCenter() : fieldCenter();
        const host = shell || field;
        mapCutLayers.forEach((frames, idx) => {
          SkillEffectPlayer.playAtField({
            fieldEl: host,
            layerEl: shellLayer,
            frames,
            x: mid.x,
            y: mid.y,
            loop: false,
            className: 'idle-skill-fx-stage idle-skill-fx-stage--map-cut-special',
            zIndex: 74 + idx,
            mirrorX: facingRight,
            forcePlay: true,
          });
        });
      };
      const waitMs = scaleRealMs(Math.max(0, Number(plan.mapCutDelayMs) || cutDelay || 0));
      if (waitMs > 0) setTimeout(startCut, waitMs);
      else startCut();
    }

    // 1) 四層同時開始
    const castAt = String(skill?.castFxAt || opts.castFxAt || '');
    const headMob = (Array.isArray(targets) ? targets : [])
      .find((m) => m && Number(m.hp) > 0) || null;
    if (fx.effect?.length) {
      if (castAt === 'targetHead' && headMob
        && typeof SkillEffectPlayer.playOnMobHead === 'function') {
        SkillEffectPlayer.playOnMobHead(headMob, fx.effect, {
          fieldEl: field,
          forcePlay: true,
          mirrorX: facingRight,
        });
      } else if (plan.fieldFx && field && typeof SkillEffectPlayer.playAtField === 'function') {
        const pt = (typeof SkillBuffRuntime !== 'undefined'
          && typeof SkillBuffRuntime.summonFieldPoint === 'function')
          ? SkillBuffRuntime.summonFieldPoint(field, playerEl, { slot: 'player-feet' }, {})
          : { x: Math.round((field.getBoundingClientRect().width || 320) * 0.5), y: 220 };
        SkillEffectPlayer.playAtField({
          fieldEl: field,
          frames: fx.effect,
          x: pt.x,
          y: pt.y,
          loop: false,
          className: 'idle-skill-fx-stage idle-skill-fx-stage--cast idle-skill-fx-stage--area-effect',
          zIndex: 58,
          playerEl,
          mirrorX: facingRight,
        });
      } else {
        playLayer(playerEl, fx.effect, {
          className: 'idle-skill-fx-stage idle-skill-fx-stage--cast idle-skill-fx-stage--area-effect',
        });
      }
    }
    if (fx.effect0?.length) {
      if (castAt === 'targetHead' && headMob
        && typeof SkillEffectPlayer.playOnMobHead === 'function') {
        SkillEffectPlayer.playOnMobHead(headMob, fx.effect0, {
          fieldEl: field,
          forcePlay: true,
          mirrorX: facingRight,
        });
      } else {
        playLayer(playerEl, fx.effect0, {
          className: 'idle-skill-fx-stage idle-skill-fx-stage--cast idle-skill-fx-stage--area-effect0',
        });
      }
    }
    const specialFrames = fx.special?.frames || [];
    if (specialFrames.length && !mapCutLayers.length) {
      playLayer(playerEl, specialFrames, {
        className: 'idle-skill-fx-stage idle-skill-fx-stage--cast idle-skill-fx-stage--area-special',
        loop: Number(fx.special?.repeat) === 1,
      });
    }
    if (fx.special0?.length) {
      playLayer(playerEl, fx.special0, {
        className: 'idle-skill-fx-stage idle-skill-fx-stage--cast idle-skill-fx-stage--area-special0',
      });
    }

    // 2) 第 hitFrame 幀結算傷害（以 effect 幀 delay 累加）
    const hitMs = scaleRealMs(Math.max(0, Number(plan.hitMs) || 480));
    setTimeout(() => {
      if (typeof onHit === 'function') onHit();
      finish();
    }, hitMs);

    return true;
  }

  return {
    buildPlan,
    isAreaCastSkill,
    playAreaCast,
    framesDurationMs,
  };
})();

if (typeof window !== 'undefined') {
  window.SkillAreaCast = SkillAreaCast;
}
