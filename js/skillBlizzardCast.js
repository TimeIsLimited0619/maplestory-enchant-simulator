/**
 * 暴風雪／火流星類時間軸（對齊遊戲手感）：
 * 1. 詠唱：同時播 effect + effect0
 * 2. 落冰：effect0 約第 15 幀，錨在怪物腳底生成 tile（origin 高大，視覺上從天砸下）
 * 3. 出傷：tile 開始後 delayShowDamage（WZ 2220014，約 960ms）播 hit + 結算
 */
const SkillBlizzardCast = (() => {
  // WZ 2220014/hit/N/delayShowDamage：840／960／1020，取中位
  const DEFAULT_DELAY_SHOW_DAMAGE_MS = 960;
  const DEFAULT_TILE_FRAME = 15;

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

  function resolveDelayShowDamageMs(plan, opts = {}) {
    const fromOpt = Number(opts.delayShowDamage);
    if (fromOpt > 0) return Math.floor(fromOpt);
    const fromPlan = Number(plan?.delayShowDamage);
    if (fromPlan > 0) return Math.floor(fromPlan);
    return DEFAULT_DELAY_SHOW_DAMAGE_MS;
  }

  function normalizePlan(raw, fx = {}) {
    const hasFx = !!(fx?.effect0?.length || fx?.effect?.length || fx?.tiles?.length);
    if (!raw && !hasFx) return null;

    const timingFx = fx.effect0?.length ? fx.effect0 : fx.effect;
    const tileFrame = Math.max(0, Number(raw?.tileFrame) || DEFAULT_TILE_FRAME);
    let tileMs = Number(raw?.tileMs);
    if (!(tileMs > 0)) {
      tileMs = framesDurationMs(timingFx, tileFrame) || tileFrame * 60;
    }
    const delayShowDamage = resolveDelayShowDamageMs(raw);
    return {
      tileFrame,
      tileMs,
      delayShowDamage,
      hitMs: tileMs + delayShowDamage,
      maxTileTargets: Math.max(1, Number(raw?.maxTileTargets) || 15),
    };
  }

  function buildPlan(skill, fx) {
    // skillOverrides 可設 blizzardCast: false 關掉誤判（落葉旋風／傳說之槍等有 tiles）
    if (skill?.blizzardCast === false) return null;
    const useFx = fx || skill?.fx || {};
    const raw = skill?.blizzardCast || null;
    if (raw) return normalizePlan(raw, useFx);
    if (!useFx.tiles?.length) return null;
    if (!(useFx.effect?.length || useFx.effect0?.length)) return null;
    return normalizePlan({ tileFrame: DEFAULT_TILE_FRAME }, useFx);
  }

  function isBlizzardCastSkill(skill, fx) {
    return !!buildPlan(skill, fx);
  }

  function pickRandomTile(tiles) {
    const list = tiles || [];
    if (!list.length) return null;
    const hit = list[Math.floor(Math.random() * list.length)];
    return hit?.frames || null;
  }

  /**
   * 冰塊錨點：怪物腳底（WZ tile origin 大，精靈會往上畫出「從天砸下」）。
   */
  function resolveTileSpawnPoint(fieldEl, mob) {
    if (!mob) return null;
    const uid = mob?.uid != null ? String(mob.uid) : '';
    const actor = uid && fieldEl
      ? fieldEl.querySelector(`.idle-actor--mob[data-uid="${uid}"]`)
      : null;
    if (actor && fieldEl) {
      const fr = fieldEl.getBoundingClientRect();
      const ar = actor.getBoundingClientRect();
      // idle-actor--mob 的 left/top 即 WZ 腳底原點
      return {
        x: ar.left - fr.left,
        y: ar.top - fr.top,
        mob,
      };
    }
    if (typeof IdleHunt !== 'undefined' && typeof IdleHunt.mobFieldPoint === 'function') {
      const pt = IdleHunt.mobFieldPoint(mob);
      if (pt && Number.isFinite(pt.x) && Number.isFinite(pt.y)) {
        return { x: pt.x, y: pt.y, mob };
      }
    }
    const mx = Number(mob.x);
    const my = Number(mob.y);
    if (Number.isFinite(mx) && Number.isFinite(my)) {
      return { x: mx, y: my, mob };
    }
    return null;
  }

  function spawnTileAtMob(fieldEl, mob, fx, className) {
    if (!fieldEl || !mob || typeof SkillEffectPlayer === 'undefined') return false;
    if (typeof SkillEffectPlayer.playAtField !== 'function') return false;
    const frames = pickRandomTile(fx?.tiles);
    const pt = resolveTileSpawnPoint(fieldEl, mob);
    if (!frames?.length || !pt) return false;
    SkillEffectPlayer.playAtField({
      fieldEl,
      frames,
      x: pt.x + (Math.random() - 0.5) * 20,
      y: pt.y + (Math.random() - 0.5) * 4,
      className: className
        || 'idle-skill-fx-stage idle-skill-fx-stage--blizzard-tile',
      mirrorX: false,
      forcePlay: true,
      zIndex: 50,
    });
    return true;
  }

  function playImpactHit(fieldEl, mob, fx) {
    if (!mob || typeof SkillEffectPlayer === 'undefined') return;
    const hitFx = Array.isArray(fx?.hit) && fx.hit.length
      ? fx.hit
      : null;
    if (!hitFx?.length) return;
    const hid = typeof SkillEffectPlayer.playOnMob === 'function'
      ? SkillEffectPlayer.playOnMob(mob, hitFx, {
        fieldEl,
        className: 'idle-skill-fx-stage idle-skill-fx-stage--hit idle-skill-fx-stage--blizzard-fa-hit',
        forcePlay: true,
      })
      : null;
    if (hid != null) return;
    const pt = resolveTileSpawnPoint(fieldEl, mob);
    if (pt && typeof SkillEffectPlayer.playAtField === 'function') {
      SkillEffectPlayer.playAtField({
        fieldEl,
        frames: hitFx,
        x: pt.x,
        y: pt.y,
        className: 'idle-skill-fx-stage idle-skill-fx-stage--hit idle-skill-fx-stage--blizzard-fa-hit',
        forcePlay: true,
      });
    }
  }

  /**
   * FA：腳底錨點落冰 → delayShowDamage 後 hit + onHit
   */
  function playFinalAttackFx(opts = {}) {
    const { mob, fx = {}, fieldEl: fieldOpt, playerEl, onHit, delayShowDamage } = opts;
    if (!mob || typeof SkillEffectPlayer === 'undefined') {
      if (typeof onHit === 'function') onHit(mob);
      return false;
    }
    const fieldEl = fieldOpt
      || document.getElementById('idleBossField')
      || document.getElementById('idleHuntField');

    const finishHit = () => {
      playImpactHit(fieldEl, mob, fx);
      if (typeof onHit === 'function') onHit(mob);
    };

    const spawned = spawnTileAtMob(
      fieldEl,
      mob,
      fx,
      'idle-skill-fx-stage idle-skill-fx-stage--blizzard-tile idle-skill-fx-stage--blizzard-fa',
    );
    if (spawned) {
      const delayMs = scaleRealMs(resolveDelayShowDamageMs(null, { delayShowDamage }));
      if (delayMs > 0) window.setTimeout(finishHit, delayMs);
      else finishHit();
      return true;
    }

    // 無 tile 時至少播 hit
    if (fx.effect0?.length && typeof SkillEffectPlayer.playOnPlayer === 'function') {
      SkillEffectPlayer.playOnPlayer(fx.effect0.slice(0, 8), {
        playerEl,
        fieldEl,
        className: 'idle-skill-fx-stage idle-skill-fx-stage--blizzard-fa-fallback',
        forcePlay: true,
      });
    }
    finishHit();
    return true;
  }

  function playBlizzardCast(opts = {}) {
    const {
      playerEl,
      fieldEl,
      fx = {},
      plan: rawPlan,
      mobs = [],
      getMobs,
      onHit,
      onDone,
    } = opts;

    const finish = () => {
      if (typeof onDone === 'function') onDone();
    };

    const plan = normalizePlan(rawPlan, fx);
    if (!plan || !fx || typeof SkillEffectPlayer === 'undefined') {
      finish();
      return false;
    }

    if (typeof document !== 'undefined' && document.hidden) {
      if (typeof onHit === 'function') onHit();
      finish();
      return true;
    }

    // 1) 詠唱
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
    const hitMs = scaleRealMs(Math.max(
      tileMs,
      Number(plan.hitMs) || (tileMs + DEFAULT_DELAY_SHOW_DAMAGE_MS),
    ));
    const maxTiles = Math.max(1, Number(plan.maxTileTargets) || 15);

    const resolveTargets = () => {
      const live = typeof getMobs === 'function' ? (getMobs() || []) : (mobs || []);
      return (live || [])
        .filter((m) => m && Number(m.hp) > 0)
        .slice(0, maxTiles);
    };

    // 2) 腳底錨點落冰（視覺由 tile origin 呈現從天砸下）
    setTimeout(() => {
      resolveTargets().forEach((mob) => {
        spawnTileAtMob(fieldEl, mob, fx);
      });
    }, tileMs);

    // 3) 砸中出傷（delayShowDamage 對齊 2220014）
    setTimeout(() => {
      if (typeof onHit === 'function') onHit();
      finish();
    }, hitMs);

    return true;
  }

  return {
    DEFAULT_DELAY_SHOW_DAMAGE_MS,
    buildPlan,
    normalizePlan,
    isBlizzardCastSkill,
    playBlizzardCast,
    playFinalAttackFx,
    framesDurationMs,
    resolveDelayShowDamageMs,
    resolveTileSpawnPoint,
  };
})();

if (typeof window !== 'undefined') {
  window.SkillBlizzardCast = SkillBlizzardCast;
}
