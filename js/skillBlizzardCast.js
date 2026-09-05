/**
 * 暴風雪：同時播 effect + effect0，第 15 幀 tile、第 18 幀傷害+hit
 */
const SkillBlizzardCast = (() => {
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
    if (skill?.blizzardCast) return skill.blizzardCast;
    if (!fx?.effect?.length || !fx?.effect0?.length || !fx?.tiles?.length) return null;
    const tileFrame = 15;
    const hitFrame = 18;
    const timingFx = fx.effect0?.length ? fx.effect0 : fx.effect;
    return {
      tileFrame,
      hitFrame,
      tileMs: framesDurationMs(timingFx, tileFrame) || tileFrame * 60,
      hitMs: framesDurationMs(timingFx, hitFrame) || hitFrame * 60,
      maxTileTargets: 15,
    };
  }

  function isBlizzardCastSkill(skill, fx) {
    return !!buildPlan(skill, fx);
  }

  function mobHeadPoint(fieldEl, mob) {
    const base = SkillEffectPlayer?.fieldPointFromMob?.(fieldEl, mob);
    if (!base) return null;
    return { x: base.x, y: base.y - 28, mob };
  }

  function pickRandomTile(tiles) {
    const list = tiles || [];
    if (!list.length) return null;
    const hit = list[Math.floor(Math.random() * list.length)];
    return hit?.frames || null;
  }

  function playBlizzardCast(opts = {}) {
    const {
      playerEl,
      fieldEl,
      fx = {},
      plan,
      mobs = [],
      onHit,
      onDone,
    } = opts;

    const finish = () => {
      if (typeof onDone === 'function') onDone();
    };

    if (!plan || !fx || typeof SkillEffectPlayer === 'undefined') {
      finish();
      return false;
    }

    if (fx.effect?.length) {
      SkillEffectPlayer.playOnPlayer(fx.effect, {
        playerEl,
        className: 'idle-skill-fx-stage idle-skill-fx-stage--cast idle-skill-fx-stage--blizzard-effect',
      });
    }
    if (fx.effect0?.length) {
      SkillEffectPlayer.playOnPlayer(fx.effect0, {
        playerEl,
        className: 'idle-skill-fx-stage idle-skill-fx-stage--cast idle-skill-fx-stage--blizzard-effect0',
      });
    }

    const tileMs = scaleRealMs(Math.max(0, Number(plan.tileMs) || 900));
    const hitMs = scaleRealMs(Math.max(tileMs, Number(plan.hitMs) || 1080));
    const maxTiles = Math.max(1, Number(plan.maxTileTargets) || 15);
    const targets = (mobs || []).slice(0, maxTiles);

    setTimeout(() => {
      targets.forEach((mob) => {
        if (!mob) return;
        const pt = mobHeadPoint(fieldEl, mob);
        const frames = pickRandomTile(fx.tiles);
        if (!pt || !frames?.length) return;
        SkillEffectPlayer.playAtField({
          fieldEl,
          frames,
          x: pt.x + (Math.random() - 0.5) * 16,
          y: pt.y + (Math.random() - 0.5) * 8,
          className: 'idle-skill-fx-stage idle-skill-fx-stage--blizzard-tile',
          mirrorX: false,
        });
      });
    }, tileMs);

    setTimeout(() => {
      if (typeof onHit === 'function') onHit();
      finish();
    }, hitMs);

    return true;
  }

  return {
    buildPlan,
    isBlizzardCastSkill,
    playBlizzardCast,
    framesDurationMs,
  };
})();

if (typeof window !== 'undefined') {
  window.SkillBlizzardCast = SkillBlizzardCast;
}
