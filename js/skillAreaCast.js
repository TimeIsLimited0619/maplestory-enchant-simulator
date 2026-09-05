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
    if (!(hasSpecial0 && hasSpecial && hasEffect) && !(skill?.areaAttack && hasSpecial && hasEffect)) {
      return null;
    }
    const hitFrame = 8;
    let hitMs = framesDurationMs(fx.effect, hitFrame);
    if (!(hitMs > 0)) hitMs = hitFrame * 60;
    return {
      hitFrame,
      hitMs,
      layers: ['effect', 'effect0', 'special', 'special0'],
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

  /**
   * @returns {boolean}
   */
  function playAreaCast(opts = {}) {
    const {
      playerEl,
      fx = {},
      plan,
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

    // 1) 四層同時開始
    if (fx.effect?.length) {
      playLayer(playerEl, fx.effect, {
        className: 'idle-skill-fx-stage idle-skill-fx-stage--cast idle-skill-fx-stage--area-effect',
      });
    }
    if (fx.effect0?.length) {
      playLayer(playerEl, fx.effect0, {
        className: 'idle-skill-fx-stage idle-skill-fx-stage--cast idle-skill-fx-stage--area-effect0',
      });
    }
    const specialFrames = fx.special?.frames || [];
    if (specialFrames.length) {
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
