/**
 * 怪物狀態：
 * - 傷痕之劍刺傷 Debuff + 伺機攻擊條件終傷
 * - 烈焰翔斬創傷：DoT + 所受傷害增加（不做隊員攻擊加傷）
 */
const SkillMobStatus = (() => {
  const SCAR_BUFF_ID = '1111003';
  const OPPORTUNITY_ID = '1110009';
  /** 烈焰翔斬／VI：命中後掛創傷 */
  const INCISING_SKILL_IDS = new Set(['1121015', '1141008']);

  /** @type {Map<string, { expiresAt: number, atkDownPct: number, fxId: number|null, timerId: any }>} */
  const scars = new Map();
  /**
   * @type {Map<string, {
   *   expiresAt: number,
   *   damageTakenPct: number,
   *   dotPct: number,
   *   intervalSec: number,
   *   dotAcc: number,
   *   fxId: number|null,
   *   timerId: any,
   *   skillId: string
   * }>}
   */
  const incising = new Map();

  function nowMs() {
    return (typeof performance !== 'undefined' && performance.now)
      ? performance.now()
      : Date.now();
  }

  /** 真實時間：跟隨 GM 遊戲倍速（與 scaled dt 的 DoT 對齊） */
  function scaleGameMs(ms) {
    const base = Math.max(0, Number(ms) || 0);
    if (typeof IdleHunt !== 'undefined' && typeof IdleHunt.scaleDelayMs === 'function') {
      return IdleHunt.scaleDelayMs(base);
    }
    return base;
  }

  function uidOf(mob) {
    if (!mob || mob.uid == null) return '';
    return String(mob.uid);
  }

  function stopStatusFx(row) {
    if (!row) return;
    if (row.timerId != null) {
      clearTimeout(row.timerId);
      row.timerId = null;
    }
    if (row.fxId != null && typeof SkillEffectPlayer !== 'undefined') {
      SkillEffectPlayer.stopFx?.(row.fxId);
    }
    row.fxId = null;
  }

  function resolveSkillMobFrames(skillId) {
    if (typeof SkillCatalog === 'undefined') return null;
    const skill = SkillCatalog.getSkill?.(skillId);
    const mobFx = skill?.fx?.mob;
    if (Array.isArray(mobFx) && mobFx.length) return mobFx;
    if (Array.isArray(mobFx?.frames) && mobFx.frames.length) return mobFx.frames;
    return null;
  }

  function startMobStatusFx(mob, row, skillId) {
    if (!mob || !row) return;
    const frames = resolveSkillMobFrames(skillId);
    if (!frames?.length || typeof SkillEffectPlayer === 'undefined') return;
    if (typeof SkillEffectPlayer.playOnMob !== 'function') return;
    if (row.fxId != null) return;
    const fxId = SkillEffectPlayer.playOnMob(mob, frames, {
      loop: true,
      className: 'idle-skill-fx-stage idle-skill-fx-stage--mob-status',
    });
    row.fxId = fxId != null ? fxId : null;
  }

  function scheduleMapExpiry(map, uid, row) {
    if (!row) return;
    if (row.timerId != null) {
      clearTimeout(row.timerId);
      row.timerId = null;
    }
    const remain = Math.max(0, Number(row.expiresAt) - nowMs());
    row.timerId = setTimeout(() => {
      const cur = map.get(uid);
      if (!cur || cur !== row) return;
      if (cur.expiresAt > nowMs()) {
        scheduleMapExpiry(map, uid, cur);
        return;
      }
      stopStatusFx(cur);
      map.delete(uid);
    }, remain);
  }

  function pruneMap(map, t = nowMs()) {
    map.forEach((row, uid) => {
      if (!row || !(row.expiresAt > t)) {
        stopStatusFx(row);
        map.delete(uid);
      }
    });
  }

  function getMapRow(map, mob, t = nowMs()) {
    const uid = uidOf(mob);
    if (!uid) return null;
    pruneMap(map, t);
    const row = map.get(uid);
    if (!row || !(row.expiresAt > t)) {
      if (row) {
        stopStatusFx(row);
        map.delete(uid);
      }
      return null;
    }
    return row;
  }

  function prune(t = nowMs()) {
    pruneMap(scars, t);
    pruneMap(incising, t);
  }

  function hasScar(mob, t = nowMs()) {
    return !!getMapRow(scars, mob, t);
  }

  function hasIncising(mob, t = nowMs()) {
    return !!getMapRow(incising, mob, t);
  }

  /** 無法行動（暈／冰凍等）— 尚無狀態系統，先保留介面 */
  function isImmobile(_mob) {
    return false;
  }

  function shouldBoostFinalDamage(mob, t = nowMs()) {
    return hasScar(mob, t) || isImmobile(mob);
  }

  function getScarAtkDownPct(mob, t = nowMs()) {
    const row = getMapRow(scars, mob, t);
    return Math.max(0, Number(row?.atkDownPct) || 0);
  }

  function getIncisingDamageTakenPct(mob, t = nowMs()) {
    const row = getMapRow(incising, mob, t);
    return Math.max(0, Number(row?.damageTakenPct) || 0);
  }

  function clearScar(mobOrUid) {
    const uid = typeof mobOrUid === 'string' || typeof mobOrUid === 'number'
      ? String(mobOrUid)
      : uidOf(mobOrUid);
    if (!uid) return;
    const row = scars.get(uid);
    stopStatusFx(row);
    scars.delete(uid);
  }

  function clearIncising(mobOrUid) {
    const uid = typeof mobOrUid === 'string' || typeof mobOrUid === 'number'
      ? String(mobOrUid)
      : uidOf(mobOrUid);
    if (!uid) return;
    const row = incising.get(uid);
    stopStatusFx(row);
    incising.delete(uid);
  }

  function clearAll() {
    scars.forEach((row) => stopStatusFx(row));
    scars.clear();
    incising.forEach((row) => stopStatusFx(row));
    incising.clear();
  }

  function clearMob(mobOrUid) {
    clearScar(mobOrUid);
    clearIncising(mobOrUid);
  }

  function readSkillLevel(skillId) {
    if (typeof CharacterSkills === 'undefined') return 0;
    return Math.max(0, Number(CharacterSkills.getLevel?.(skillId)) || 0);
  }

  function evalSkillStat(skillId) {
    const level = readSkillLevel(skillId);
    if (!(level > 0) || typeof SkillCatalog === 'undefined' || typeof SkillFormula === 'undefined') {
      return null;
    }
    const skill = SkillCatalog.getSkill?.(skillId);
    if (!skill?.common) return null;
    return {
      level,
      skill,
      stat: SkillFormula.evalStatCommon(skill.common, level),
    };
  }

  function applyScar(mob, opts = {}) {
    const uid = uidOf(mob);
    if (!uid) return false;
    const durationMs = scaleGameMs(Math.max(0, Number(opts.durationMs) || 0));
    if (!(durationMs > 0)) return false;
    const atkDownPct = Math.max(0, Number(opts.atkDownPct) || 0);
    const existing = scars.get(uid);
    const row = {
      expiresAt: nowMs() + durationMs,
      atkDownPct,
      fxId: existing?.fxId ?? null,
      timerId: existing?.timerId ?? null,
    };
    scars.set(uid, row);
    startMobStatusFx(mob, row, SCAR_BUFF_ID);
    scheduleMapExpiry(scars, uid, row);
    return true;
  }

  function applyIncising(mob, opts = {}) {
    const uid = uidOf(mob);
    if (!uid) return false;
    const durationMs = scaleGameMs(Math.max(0, Number(opts.durationMs) || 0));
    if (!(durationMs > 0)) return false;
    const damageTakenPct = Math.max(0, Number(opts.damageTakenPct) || 0);
    const dotPct = Math.max(0, Number(opts.dotPct) || 0);
    const intervalSec = Math.max(0.2, Number(opts.intervalSec) || 2);
    if (!(damageTakenPct > 0) && !(dotPct > 0)) return false;
    const skillId = String(opts.skillId || '1121015');
    const existing = incising.get(uid);
    const row = {
      expiresAt: nowMs() + durationMs,
      damageTakenPct,
      dotPct,
      intervalSec,
      dotAcc: existing?.dotAcc ?? 0,
      skillId,
      fxId: existing?.fxId ?? null,
      timerId: existing?.timerId ?? null,
    };
    incising.set(uid, row);
    startMobStatusFx(mob, row, skillId);
    scheduleMapExpiry(incising, uid, row);
    return true;
  }

  /**
   * 傷痕之劍 Buff 作用中：命中時以 prop% 機率掛刺傷（攻擊力 ↓w%，持續 v 秒）
   */
  function tryApplyScarOnHit(mob) {
    if (!mob) return false;
    if (typeof SkillModifiers === 'undefined' || !SkillModifiers.hasBuff?.(SCAR_BUFF_ID)) {
      return false;
    }
    const info = evalSkillStat(SCAR_BUFF_ID);
    if (!info?.stat) return false;
    const prop = Math.max(0, Number(info.stat.prop) || 0);
    if (!(prop > 0) || Math.random() * 100 >= prop) return false;
    const durationMs = Math.max(0, Number(info.stat.v) || 0) * 1000;
    const atkDownPct = Math.max(0, Number(info.stat.w) || 0);
    return applyScar(mob, { durationMs, atkDownPct });
  }

  /**
   * 烈焰翔斬命中：prop% 掛創傷
   * - 持續 dotTime／time 秒
   * - 每 dotInterval 秒造成 dot% 持續傷害
   * - 所受傷害 +x%
   */
  function tryApplyIncisingOnHit(mob, skillId) {
    if (!mob) return false;
    const sid = String(skillId || '');
    if (!INCISING_SKILL_IDS.has(sid)) return false;
    const info = evalSkillStat(sid);
    if (!info?.stat) return false;
    const prop = Math.max(0, Number(info.stat.prop) || 0);
    if (!(prop > 0) || Math.random() * 100 >= prop) return false;
    const durationSec = Math.max(
      0,
      Number(info.stat.dotTimeSec) || Number(info.stat.timeSec) || 0,
    );
    const durationMs = durationSec * 1000;
    const damageTakenPct = Math.max(0, Number(info.stat.xVal) || 0);
    const dotPct = Math.max(0, Number(info.stat.dotPct) || 0);
    const intervalSec = Math.max(0.2, Number(info.stat.dotIntervalSec) || 2);
    return applyIncising(mob, {
      durationMs,
      damageTakenPct,
      dotPct,
      intervalSec,
      skillId: sid,
    });
  }

  /** 伺機攻擊：條件終傷 %（common.x → xVal） */
  function opportunityFinalDamR() {
    const info = evalSkillStat(OPPORTUNITY_ID);
    if (!info?.stat) return 0;
    return Math.max(0, Number(info.stat.xVal) || 0);
  }

  /** 玩家對該怪輸出傷害：創傷所受傷害↑ + 刺傷／無法行動伺機終傷 */
  function applyOutgoingDamageMods(mob, dmg) {
    let out = Math.max(0, Math.floor(Number(dmg) || 0));
    if (!(out > 0) || !mob) return out;
    const amp = getIncisingDamageTakenPct(mob);
    if (amp > 0) {
      out = Math.max(0, Math.floor(out * (1 + amp / 100)));
    }
    if (shouldBoostFinalDamage(mob)) {
      const fd = opportunityFinalDamR();
      if (fd > 0) out = Math.max(0, Math.floor(out * (1 + fd / 100)));
    }
    return out;
  }

  /** 怪物打玩家：刺傷時攻擊力下降 */
  function applyIncomingMobDamageMods(mob, dmg) {
    let out = Math.max(0, Math.floor(Number(dmg) || 0));
    if (!(out > 0) || !mob) return out;
    const pct = getScarAtkDownPct(mob);
    if (!(pct > 0)) return out;
    return Math.max(0, Math.floor(out * (1 - Math.min(100, pct) / 100)));
  }

  function resolveLiveMob(uid, ctx) {
    if (!uid || !ctx) return null;
    const mobs = typeof ctx.getMobs === 'function'
      ? (ctx.getMobs() || [])
      : (ctx.mobs || []);
    return (mobs || []).find((m) => m && String(m.uid) === String(uid)) || null;
  }

  /** DoT：不爆擊，依 hunting 基礎傷 × dot% ，再套所受傷害↑ */
  function rollDotDamage(mob, dotPct) {
    const pct = Math.max(0, Number(dotPct) || 0);
    if (!(pct > 0) || !mob) return 0;
    let base = 0;
    if (typeof UiCharacterInfo !== 'undefined'
      && typeof UiCharacterInfo.getHuntHitDamage === 'function') {
      base = UiCharacterInfo.getHuntHitDamage(!!mob.isBoss);
    }
    let dmg = Math.max(0, Math.floor(base * pct / 100));
    if (!(dmg > 0)) return 0;
    dmg = applyOutgoingDamageMods(mob, dmg);
    return Math.max(0, dmg);
  }

  function dealIncisingDot(uid, row, ctx) {
    if (!row || !ctx) return null;
    const mob = resolveLiveMob(uid, ctx);
    if (!mob || !(Number(mob.hp) > 0)) {
      clearIncising(uid);
      return null;
    }
    const dmg = rollDotDamage(mob, row.dotPct);
    if (!(dmg > 0)) return null;

    if (typeof ctx.showMobDamage === 'function') {
      ctx.showMobDamage(mob, dmg, false);
    }
    if (typeof ctx.onDamage === 'function') ctx.onDamage(dmg);

    const finalDmg = (typeof IdleHunt !== 'undefined'
      && typeof IdleHunt.resolveMobHitDamage === 'function')
      ? IdleHunt.resolveMobHitDamage(mob, dmg)
      : dmg;
    mob.hp -= finalDmg;

    if (mob.hp <= 0) {
      if (typeof ctx.flashDie === 'function') ctx.flashDie(mob.uid, mob);
      clearIncising(uid);
      return mob;
    }
    if (typeof ctx.flashHit === 'function') ctx.flashHit(mob.uid);
    return null;
  }

  function tickIncisingDots(ctx, dtSec) {
    const dt = Math.max(0, Number(dtSec) || 0);
    if (!(dt > 0) || !ctx) return [];
    const kills = [];
    const t = nowMs();
    [...incising.entries()].forEach(([uid, row]) => {
      if (!row || !(row.expiresAt > t)) {
        stopStatusFx(row);
        incising.delete(uid);
        return;
      }
      if (!(Number(row.dotPct) > 0) || !(Number(row.intervalSec) > 0)) return;
      row.dotAcc = (Number(row.dotAcc) || 0) + dt;
      const interval = Math.max(0.2, Number(row.intervalSec) || 2);
      let guard = 0;
      while (row.dotAcc >= interval && guard < 8) {
        row.dotAcc -= interval;
        guard += 1;
        if (!incising.has(uid)) break;
        const dead = dealIncisingDot(uid, row, ctx);
        if (dead) {
          kills.push(dead);
          break;
        }
      }
    });
    return kills;
  }

  /**
   * @param {number} [t]
   * @param {object} [ctx] huntCombatCtx／combatCtx
   * @param {number} [dtSec] 狩獵遊戲時間 dt（已套倍速）
   */
  function tick(t = nowMs(), ctx = null, dtSec = 0) {
    prune(t);
    const kills = tickIncisingDots(ctx, dtSec);
    if (kills.length) {
      if (typeof ctx?.onMobStateSync === 'function') ctx.onMobStateSync(kills);
      else if (typeof ctx?.onProjectileResolve === 'function') ctx.onProjectileResolve(kills);
    }
    return kills;
  }

  /**
   * 一次命中結算後呼叫：先可已套終傷／所受傷害↑，再嘗試掛狀態
   */
  function afterPlayerDamagedMob(mob, didHit, opts = {}) {
    if (!didHit || !mob) return;
    tryApplyScarOnHit(mob);
    tryApplyIncisingOnHit(mob, opts.skillId);
  }

  return {
    SCAR_BUFF_ID,
    OPPORTUNITY_ID,
    INCISING_SKILL_IDS,
    hasScar,
    hasIncising,
    isImmobile,
    shouldBoostFinalDamage,
    getScarAtkDownPct,
    getIncisingDamageTakenPct,
    applyScar,
    applyIncising,
    tryApplyScarOnHit,
    tryApplyIncisingOnHit,
    opportunityFinalDamR,
    applyOutgoingDamageMods,
    applyIncomingMobDamageMods,
    afterPlayerDamagedMob,
    clearScar,
    clearIncising,
    clearMob,
    clearAll,
    prune,
    tick,
  };
})();

if (typeof window !== 'undefined') {
  window.SkillMobStatus = SkillMobStatus;
}
