/**
 * 地圖 ARC／AUT 不足時，怪物受擊播放 MobEff Arcbarrier/0 或 Autbarrier/0。
 */
const MobEffBarrier = (() => {
  const lastAt = new Map();

  function framesOf(kind) {
    const pack = (typeof MOB_EFF_BARRIER !== 'undefined') ? MOB_EFF_BARRIER[kind] : null;
    return (pack?.frames || []).filter((f) => f && f.src);
  }

  function playIfNeeded(mob, opts = {}) {
    if (!mob || opts.skipVisual) return null;
    if (typeof SymbolForce === 'undefined' || typeof SymbolForce.barrierKind !== 'function') {
      return null;
    }
    const kind = SymbolForce.barrierKind({
      isBoss: !!mob.isBoss || !!opts.isBoss,
      zone: opts.zone,
    });
    if (!kind) return null;
    const frames = framesOf(kind);
    if (!frames.length || typeof SkillEffectPlayer === 'undefined'
      || typeof SkillEffectPlayer.playOnMob !== 'function') {
      return null;
    }
    const uid = mob.uid != null ? String(mob.uid) : (mob.key != null ? String(mob.key) : '');
    const now = (typeof performance !== 'undefined' ? performance.now() : Date.now());
    const dur = typeof SkillEffectPlayer.framesDurationMs === 'function'
      ? SkillEffectPlayer.framesDurationMs(frames)
      : 450;
    if (uid && lastAt.has(uid) && (now - lastAt.get(uid)) < Math.max(80, dur * 0.7)) {
      return null;
    }
    if (uid) lastAt.set(uid, now);
    const hitMob = mob.uid != null ? mob : { ...mob, uid };
    return SkillEffectPlayer.playOnMob(hitMob, frames, {
      className: 'idle-skill-fx-stage idle-skill-fx-stage--hit idle-skill-fx-stage--force-barrier',
    });
  }

  return { playIfNeeded };
})();

if (typeof window !== 'undefined') window.MobEffBarrier = MobEffBarrier;
