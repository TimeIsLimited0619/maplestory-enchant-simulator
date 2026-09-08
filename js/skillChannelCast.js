/**
 * 引導技（冰龍吐息／雷霆萬鈞）：
 * prepare → keydown（loop + 持續傷害）+ 右側 keydown0/special（loop）→ keydownend
 */
const SkillChannelCast = (() => {
  function scaleRealMs(ms) {
    if (typeof IdleHunt !== 'undefined' && typeof IdleHunt.scaleDelayMs === 'function') {
      return IdleHunt.scaleDelayMs(ms);
    }
    return Math.max(0, Number(ms) || 0);
  }

  function framesDurationMs(frames) {
    return (frames || []).reduce((sum, f) => sum + (Number(f?.delay) || 60), 0);
  }

  function buildPlan(skill, fx) {
    if (skill?.channelCast) return skill.channelCast;
    if (!fx?.prepare?.length || !fx?.keydown?.length) return null;
    let prepareMs = fx.prepareMeta?.timeMs || framesDurationMs(fx.prepare);
    let keydownLoopMs = fx.keydownMeta?.timeMs || framesDurationMs(fx.keydown);
    const sideFx = fx.keydown0?.length
      ? 'keydown0'
      : (fx.special?.frames?.length ? 'special' : null);
    return {
      prepareMs,
      keydownLoopMs,
      channelSecKey: 'q',
      tickMsKey: 's',
      sideFx,
      sideOffset: [150, -50],
    };
  }

  function isChannelCastSkill(skill, fx) {
    if (skill?.channelCast === false) return false;
    return !!buildPlan(skill, fx);
  }

  function evalPlanMs(skill, plan, level) {
    const x = Math.max(0, Number(level) || 0);
    const c = skill?.common || {};
    const expr = (key, fallback = 0) => {
      if (c[key] == null || String(c[key]) === '') return fallback;
      if (typeof SkillFormula !== 'undefined' && SkillFormula.evalExpr) {
        return SkillFormula.evalExpr(c[key], { x });
      }
      return Number(c[key]) || fallback;
    };
    let tickMs = Number(plan.tickMs);
    if (!(tickMs > 0)) {
      tickMs = expr(plan.tickMsKey || 's', 0);
      if (!(tickMs > 0)) {
        tickMs = Math.max(240, Math.round((plan.keydownLoopMs || 600) / 2));
      } else if (tickMs <= 30) {
        tickMs = Math.round(tickMs * 1000);
      }
    }
    const prepareMs = Math.max(60, Number(plan.prepareMs) || 240);
    const tick = Math.max(50, Math.round(tickMs));
    // sustain：按住持續射，不依 channelSec 自動結束（伊修塔爾等）
    if (plan.sustain) {
      return {
        prepareMs,
        channelMs: Number.POSITIVE_INFINITY,
        tickMs: tick,
        sustain: true,
      };
    }
    const channelSec = Number(plan.channelSec) > 0
      ? Number(plan.channelSec)
      : Math.max(0.5, expr(plan.channelSecKey || 'q', 2));
    return {
      prepareMs,
      channelMs: Math.round(channelSec * 1000),
      tickMs: tick,
      sustain: false,
    };
  }

  function sidePointFromPlayer(fieldEl, playerEl, offset) {
    const facingRight = (typeof SkillEffectPlayer !== 'undefined'
      && SkillEffectPlayer.playerFacingRight)
      ? SkillEffectPlayer.playerFacingRight(playerEl)
      : !playerEl?.classList?.contains('is-flip-x');
    if (typeof SkillEffectPlayer !== 'undefined'
      && SkillEffectPlayer.fieldPointFromPlayer) {
      return SkillEffectPlayer.fieldPointFromPlayer(
        fieldEl,
        playerEl,
        offset || [150, -50],
        facingRight,
      );
    }
    return { x: 220, y: 180 };
  }

  function sideFrames(fx, plan) {
    if (plan.sideFx === 'keydown0' && fx.keydown0?.length) return fx.keydown0;
    if (plan.sideFx === 'special' && fx.special?.frames?.length) return fx.special.frames;
    return null;
  }

  function playChannelCast(opts = {}) {
    const {
      fieldEl,
      playerEl,
      fx = {},
      plan,
      skill,
      level = 1,
      mobs = [],
      maxTargets = 8,
      onTick,
      onDone,
    } = opts;

    const finish = () => {
      if (typeof onDone === 'function') onDone();
    };

    if (!fieldEl || !playerEl || !plan || !fx.prepare?.length || !fx.keydown?.length) {
      finish();
      return false;
    }
    if (typeof SkillEffectPlayer === 'undefined') {
      finish();
      return false;
    }

    const timing = evalPlanMs(skill, plan, level);
    const sustain = !!(plan.sustain || timing.sustain);

    // 背景：引導改為一次結算數波，避免長 timeout 鏈被節流
    if (typeof document !== 'undefined' && document.hidden) {
      const batchMs = Number.isFinite(timing.channelMs) ? timing.channelMs : 2000;
      const waves = Math.max(1, Math.min(8, Math.round((batchMs || 1000) / Math.max(120, timing.tickMs || 240))));
      for (let i = 0; i < waves; i += 1) {
        if (typeof onTick === 'function') onTick(mobs.slice(0, maxTargets), []);
      }
      finish();
      return { ok: true, stop: () => {}, sustain };
    }

    const prepareMs = scaleRealMs(timing.prepareMs);
    const channelMs = Number.isFinite(timing.channelMs)
      ? scaleRealMs(timing.channelMs)
      : Number.POSITIVE_INFINITY;
    const tickMs = scaleRealMs(timing.tickMs);
    const kills = [];
    let keydownId = null;
    let sideId = null;
    let ended = false;

    const cleanup = () => {
      if (keydownId != null) SkillEffectPlayer.stopFx(keydownId);
      if (sideId != null) SkillEffectPlayer.stopFx(sideId);
      keydownId = null;
      sideId = null;
    };

    const endChannel = () => {
      if (ended) return;
      ended = true;
      cleanup();
      if (fx.keydownend?.length) {
        SkillEffectPlayer.playOnPlayer(fx.keydownend, {
          playerEl,
          className: 'idle-skill-fx-stage idle-skill-fx-stage--channel-end',
        });
        const endMs = scaleRealMs(fx.keydownendMeta?.timeMs || framesDurationMs(fx.keydownend));
        setTimeout(finish, Math.max(60, endMs));
      } else {
        finish();
      }
    };

    SkillEffectPlayer.playOnPlayer(fx.prepare, {
      playerEl,
      className: 'idle-skill-fx-stage idle-skill-fx-stage--channel-prepare',
    });

    setTimeout(() => {
      if (ended) return;

      keydownId = SkillEffectPlayer.playOnPlayer(fx.keydown, {
        playerEl,
        className: 'idle-skill-fx-stage idle-skill-fx-stage--channel-keydown',
        loop: true,
      });

      const sideList = sideFrames(fx, plan);
      if (sideList?.length) {
        const facingRight = (typeof SkillEffectPlayer !== 'undefined'
          && SkillEffectPlayer.playerFacingRight)
          ? SkillEffectPlayer.playerFacingRight(playerEl)
          : !playerEl?.classList?.contains('is-flip-x');
        const pt = sidePointFromPlayer(fieldEl, playerEl, plan.sideOffset);
        sideId = SkillEffectPlayer.playAtField({
          fieldEl,
          frames: sideList,
          x: pt.x,
          y: pt.y,
          loop: true,
          className: 'idle-skill-fx-stage idle-skill-fx-stage--channel-side',
          mirrorX: facingRight,
        });
      }

      const channelEnd = Number.isFinite(channelMs)
        ? performance.now() + channelMs
        : Number.POSITIVE_INFINITY;
      const runTick = () => {
        if (ended) return;
        if (Number.isFinite(channelEnd) && performance.now() >= channelEnd) {
          endChannel();
          return;
        }
        if (typeof onTick === 'function') {
          onTick(mobs.slice(0, maxTargets), kills);
        }
        setTimeout(runTick, tickMs);
      };
      runTick();
    }, prepareMs);

    return { ok: true, stop: endChannel, sustain };
  }

  return {
    buildPlan,
    isChannelCastSkill,
    playChannelCast,
    evalPlanMs,
    framesDurationMs,
  };
})();

if (typeof window !== 'undefined') {
  window.SkillChannelCast = SkillChannelCast;
}
