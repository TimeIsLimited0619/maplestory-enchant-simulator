/**
 * 怪物狀態：
 * - 傷痕之劍刺傷 Debuff + 伺機攻擊條件終傷
 * - 烈焰翔斬創傷：DoT + 所受傷害增加（不做隊員攻擊加傷）
 * - 冰雷結冰：2200011 結冰特效層數動畫／爆傷／雷屬終傷；2210013 結凍粉碎
 */
const SkillMobStatus = (() => {
  const SCAR_BUFF_ID = '1111003';
  const OPPORTUNITY_ID = '1110009';
  /** 烈焰翔斬／VI／獨角獸射擊：命中後掛所受傷害增加 */
  const INCISING_SKILL_IDS = new Set(['1121015', '1141008', '23111002']);
  /** 傳說之槍：命中後防禦率下降（以所受傷害增加近似） */
  const DEF_DOWN_SKILL_IDS = new Set(['23121002']);
  const SPEAR_DEF_DOWN_HYPER_ID = '23120050';

  const FREEZE_SHATTER_ID = '2210013';
  const FREEZE_FX_SKILL_ID = '2200011'; // 結冰特效（mob 層數動畫）
  const FROST_EFFECT_IDS = ['2220015', '2200011']; // 冰凍效果優先於結冰特效數值
  const ICE_BARRIER_ID = '2201009';
  const GLACIAL_FURY_ID = '2221054';
  const THUNDER_ORB_ID = '2211011';
  const ICE_GOLEM_ID = '2221005';
  const DEFAULT_FREEZE_MAX = 5;
  const DEFAULT_FREEZE_DURATION_MS = 8000;
  const ICE_BARRIER_TICK_SEC = 2;

  /** 雷屬技能：觸發結冰特效終傷並消耗層數（閃電球除外） */
  const LIGHTNING_SKILL_IDS = new Set([
    '2201005', // 電閃雷鳴
    '2211011', // 閃電球（命中不扣層，另判）
    '2221006', // 閃電連擊
    '2221052', // 雷霆萬鈞
  ]);

  /** 冰屬性命中：加結冰層（含召喚冰魔） */
  const FREEZE_APPLY_SKILL_IDS = new Set([
    '2201008', // 冰錐劍
    '2201009', // 冰雪結界（週期）
    '2211002', // 冰風暴
    '2211014', // 冰川之牆
    '2221005', // 召喚冰魔
    '2221007', // 暴風雪主動
    '2221012', // 冰鋒刃
  ]);

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
  /**
   * 防禦下降（傳說之槍等）：以所受傷害增加近似
   * @type {Map<string, { expiresAt: number, damageTakenPct: number, fxId: number|null, timerId: any, skillId: string }>}
   */
  const defDown = new Map();
  /**
   * @type {Map<string, {
   *   stacks: number,
   *   maxStacks: number,
   *   expiresAt: number,
   *   fxId: number|null,
   *   timerId: any,
   *   sourceSkillId: string
   * }>}
   */
  const freeze = new Map();

  let iceBarrierAcc = 0;

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
    stopStatusFxVisual(row);
  }

  function stopStatusFxVisual(row) {
    if (!row) return;
    if (row.fxId != null && typeof SkillEffectPlayer !== 'undefined') {
      SkillEffectPlayer.stopFx?.(row.fxId);
    }
    row.fxId = null;
    row.fxStacks = null;
  }

  function resolveSkillMobFrames(skillId) {
    if (typeof SkillCatalog === 'undefined') return null;
    const skill = SkillCatalog.getSkill?.(skillId);
    const mobFx = skill?.fx?.mob;
    if (Array.isArray(mobFx) && mobFx.length) return mobFx;
    if (Array.isArray(mobFx?.frames) && mobFx.frames.length) return mobFx.frames;
    return null;
  }

  /** 結冰特效：依層數取 mobStacks（1 層 → key 0） */
  function resolveFreezeStatusFrames(stacks) {
    if (typeof SkillCatalog === 'undefined') return null;
    const skill = SkillCatalog.getSkill?.(FREEZE_FX_SKILL_ID);
    const byStack = skill?.fx?.mobStacks;
    const n = Math.max(1, Math.floor(Number(stacks) || 1));
    if (byStack && typeof byStack === 'object') {
      const keys = Object.keys(byStack)
        .filter((k) => Array.isArray(byStack[k]) && byStack[k].length)
        .sort((a, b) => Number(a) - Number(b));
      if (keys.length) {
        const idx = Math.max(0, Math.min(n - 1, keys.length - 1));
        const key = keys[idx];
        const frames = byStack[key];
        if (frames?.length) return frames;
      }
    }
    return resolveSkillMobFrames(FREEZE_FX_SKILL_ID);
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

  /** 結冰層數：使用 2200011 結冰特效 mobStacks，層數變化時重播 */
  function startFreezeStatusFx(mob, row) {
    if (!mob || !row) return;
    if (typeof SkillEffectPlayer === 'undefined' || typeof SkillEffectPlayer.playOnMob !== 'function') {
      return;
    }
    const stacks = Math.max(1, Math.floor(Number(row.stacks) || 1));
    if (row.fxId != null && Number(row.fxStacks) === stacks) return;
    stopStatusFxVisual(row);
    const frames = resolveFreezeStatusFrames(stacks);
    if (!frames?.length) return;
    const fxId = SkillEffectPlayer.playOnMob(mob, frames, {
      loop: true,
      className: 'idle-skill-fx-stage idle-skill-fx-stage--mob-status idle-skill-fx-stage--freeze',
    });
    row.fxId = fxId != null ? fxId : null;
    row.fxStacks = stacks;
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
    pruneMap(defDown, t);
    pruneMap(freeze, t);
  }

  function hasScar(mob, t = nowMs()) {
    return !!getMapRow(scars, mob, t);
  }

  function hasIncising(mob, t = nowMs()) {
    return !!getMapRow(incising, mob, t);
  }

  function hasFreeze(mob, t = nowMs()) {
    return getFreezeStacks(mob, t) > 0;
  }

  function getFreezeStacks(mob, t = nowMs()) {
    const row = getMapRow(freeze, mob, t);
    return Math.max(0, Math.floor(Number(row?.stacks) || 0));
  }

  function isImmobile(mob) {
    return hasFreeze(mob);
  }

  function shouldBoostFinalDamage(mob, t = nowMs()) {
    return hasScar(mob, t) || isImmobile(mob);
  }

  function getScarAtkDownPct(mob, t = nowMs()) {
    const row = getMapRow(scars, mob, t);
    return Math.max(0, Number(row?.atkDownPct) || 0);
  }

  function getIncisingDamageTakenPct(mob, t = nowMs()) {
    const cut = getMapRow(incising, mob, t);
    const def = getMapRow(defDown, mob, t);
    return Math.max(0, Number(cut?.damageTakenPct) || 0)
      + Math.max(0, Number(def?.damageTakenPct) || 0);
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

  function clearDefDown(mobOrUid) {
    const uid = typeof mobOrUid === 'string' || typeof mobOrUid === 'number'
      ? String(mobOrUid)
      : uidOf(mobOrUid);
    if (!uid) return;
    const row = defDown.get(uid);
    stopStatusFx(row);
    defDown.delete(uid);
  }

  function clearFreeze(mobOrUid) {
    const uid = typeof mobOrUid === 'string' || typeof mobOrUid === 'number'
      ? String(mobOrUid)
      : uidOf(mobOrUid);
    if (!uid) return;
    const row = freeze.get(uid);
    stopStatusFx(row);
    freeze.delete(uid);
  }

  function clearAll() {
    scars.forEach((row) => stopStatusFx(row));
    scars.clear();
    incising.forEach((row) => stopStatusFx(row));
    incising.clear();
    defDown.forEach((row) => stopStatusFx(row));
    defDown.clear();
    freeze.forEach((row) => stopStatusFx(row));
    freeze.clear();
    iceBarrierAcc = 0;
  }

  function clearMob(mobOrUid) {
    clearScar(mobOrUid);
    clearIncising(mobOrUid);
    clearDefDown(mobOrUid);
    clearFreeze(mobOrUid);
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

  function resolveGlacialFuryMods() {
    if (typeof SkillModifiers === 'undefined' || !SkillModifiers.hasBuff?.(GLACIAL_FURY_ID)) {
      return { maxStacks: DEFAULT_FREEZE_MAX, addStacks: 1 };
    }
    const info = evalSkillStat(GLACIAL_FURY_ID);
    const maxStacks = Math.max(
      DEFAULT_FREEZE_MAX,
      Math.floor(Number(info?.stat?.xVal) || 8),
    );
    const addStacks = Math.max(1, Math.floor(Number(info?.stat?.y) || 5));
    return { maxStacks, addStacks };
  }

  function resolveFreezeDurationMs(skillId) {
    const info = evalSkillStat(skillId);
    const sec = Number(info?.stat?.timeSec) || 0;
    if (sec > 0) return sec * 1000;
    return DEFAULT_FREEZE_DURATION_MS;
  }

  function applyFreeze(mob, opts = {}) {
    const uid = uidOf(mob);
    if (!uid) return false;
    const fury = resolveGlacialFuryMods();
    const addStacks = Math.max(1, Math.floor(
      opts.stacks != null
        ? Number(opts.stacks) || 1
        : (SkillModifiers?.hasBuff?.(GLACIAL_FURY_ID) ? fury.addStacks : 1),
    ));
    const maxStacks = Math.max(
      1,
      Math.floor(Number(opts.maxStacks) || fury.maxStacks || DEFAULT_FREEZE_MAX),
    );
    const durationMs = scaleGameMs(
      Math.max(0, Number(opts.durationMs) || resolveFreezeDurationMs(opts.skillId) || DEFAULT_FREEZE_DURATION_MS),
    );
    if (!(durationMs > 0)) return false;
    const sourceSkillId = String(opts.skillId || '2201008');
    const existing = freeze.get(uid);
    const prev = Math.max(0, Math.floor(Number(existing?.stacks) || 0));
    const stacks = Math.min(maxStacks, prev + addStacks);
    const row = {
      stacks,
      maxStacks,
      expiresAt: nowMs() + durationMs,
      sourceSkillId,
      fxId: existing?.fxId ?? null,
      fxStacks: existing?.fxStacks ?? null,
      timerId: existing?.timerId ?? null,
    };
    freeze.set(uid, row);
    startFreezeStatusFx(mob, row);
    scheduleMapExpiry(freeze, uid, row);
    return true;
  }

  function consumeFreeze(mob, amount = 1) {
    const uid = uidOf(mob);
    if (!uid) return 0;
    const row = getMapRow(freeze, mob);
    if (!row) return 0;
    const n = Math.max(1, Math.floor(Number(amount) || 1));
    row.stacks = Math.max(0, Math.floor(Number(row.stacks) || 0) - n);
    if (!(row.stacks > 0)) {
      stopStatusFx(row);
      freeze.delete(uid);
      return n;
    }
    freeze.set(uid, row);
    startFreezeStatusFx(mob, row);
    return n;
  }

  function isLightningSkill(skillId) {
    return LIGHTNING_SKILL_IDS.has(String(skillId || ''));
  }

  /** 結冰特效／冰凍效果：每層爆傷 x%、雷屬終傷 y% */
  function resolveFrostEffectStat() {
    for (let i = 0; i < FROST_EFFECT_IDS.length; i += 1) {
      const info = evalSkillStat(FROST_EFFECT_IDS[i]);
      if (!info?.stat) continue;
      return {
        id: FROST_EFFECT_IDS[i],
        critDmgPerStack: Math.max(0, Number(info.stat.xVal) || 0),
        finalDamPerStack: Math.max(0, Number(info.stat.y) || 0),
      };
    }
    return null;
  }

  /**
   * 命中後結冰加／扣層（對齊 WZ 結冰特效）：
   * - 冰屬白名單／冰魔 → 加層
   * - 閃電球 → 不改層
   * - 雷屬 → 消耗全部層數（終傷已在傷害階段套用）
   * - 其餘 → 不改層
   */
  function applyOrConsumeFreeze(mob, skillId) {
    if (!mob) return;
    const sid = String(skillId || '');
    if (sid === THUNDER_ORB_ID) return;

    if (FREEZE_APPLY_SKILL_IDS.has(sid)) {
      const fury = resolveGlacialFuryMods();
      const stacks = SkillModifiers?.hasBuff?.(GLACIAL_FURY_ID) ? fury.addStacks : 1;
      applyFreeze(mob, {
        skillId: sid,
        stacks,
        maxStacks: fury.maxStacks,
        durationMs: resolveFreezeDurationMs(sid),
      });
      return;
    }

    if (isLightningSkill(sid) && hasFreeze(mob)) {
      const stacks = getFreezeStacks(mob);
      if (stacks > 0) consumeFreeze(mob, stacks);
    }
  }

  /** 結凍粉碎：每層 subProp% 機率疊 prop% IED（等效增傷） */
  function rollFrozenShatterIed(mob) {
    const stacks = getFreezeStacks(mob);
    if (!(stacks > 0)) return 0;
    const info = evalSkillStat(FREEZE_SHATTER_ID);
    if (!info?.stat) return 0;
    const subProp = Math.max(0, Number(info.stat.subProp) || 0);
    const prop = Math.max(0, Number(info.stat.prop) || 0);
    if (!(subProp > 0) || !(prop > 0)) return 0;
    let ied = 0;
    for (let i = 0; i < stacks; i += 1) {
      if (Math.random() * 100 < subProp) ied += prop;
    }
    return Math.min(100, ied);
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

  function applyDefDown(mob, opts = {}) {
    const uid = uidOf(mob);
    if (!uid) return false;
    const durationMs = scaleGameMs(Math.max(0, Number(opts.durationMs) || 0));
    if (!(durationMs > 0)) return false;
    const damageTakenPct = Math.max(0, Number(opts.damageTakenPct) || 0);
    if (!(damageTakenPct > 0)) return false;
    const skillId = String(opts.skillId || '23121002');
    const existing = defDown.get(uid);
    const row = {
      expiresAt: nowMs() + durationMs,
      damageTakenPct,
      skillId,
      fxId: existing?.fxId ?? null,
      timerId: existing?.timerId ?? null,
    };
    defDown.set(uid, row);
    startMobStatusFx(mob, row, skillId);
    scheduleMapExpiry(defDown, uid, row);
    return true;
  }

  function tryApplyDefDownOnHit(mob, skillId) {
    if (!mob) return false;
    const sid = String(skillId || '');
    if (!DEF_DOWN_SKILL_IDS.has(sid)) return false;
    const info = evalSkillStat(sid);
    if (!info?.stat) return false;
    let defDownPct = Math.max(0, Number(info.stat.y) || 0);
    const hyperLv = readSkillLevel(SPEAR_DEF_DOWN_HYPER_ID);
    if (hyperLv > 0 && typeof SkillFormula !== 'undefined') {
      const hyper = typeof SkillCatalog !== 'undefined'
        ? SkillCatalog.getSkill?.(SPEAR_DEF_DOWN_HYPER_ID)
        : null;
      if (hyper?.common?.y != null) {
        const hy = SkillFormula.evalExpr(hyper.common.y, { x: hyperLv });
        if (Number.isFinite(hy)) defDownPct += Math.max(0, hy);
      }
    }
    if (!(defDownPct > 0)) return false;
    const durationMs = Math.max(0, Number(info.stat.timeSec) || 0) * 1000;
    return applyDefDown(mob, {
      durationMs,
      damageTakenPct: defDownPct,
      skillId: sid,
    });
  }

  function opportunityFinalDamR() {
    const info = evalSkillStat(OPPORTUNITY_ID);
    if (!info?.stat) return 0;
    return Math.max(0, Number(info.stat.xVal) || 0);
  }

  /** 終極魔法(雷冰／火毒)：對異常／結冰等狀態敵人 +z% 終傷 */
  const ULTIMATE_MAGIC_IDS = ['2210000', '2110000'];
  function ultimateMagicFinalDamR(mob) {
    if (!mob) return 0;
    if (!hasFreeze(mob) && !hasScar(mob) && !hasIncising(mob)) return 0;
    for (let i = 0; i < ULTIMATE_MAGIC_IDS.length; i += 1) {
      const info = evalSkillStat(ULTIMATE_MAGIC_IDS[i]);
      if (!info?.stat) continue;
      const z = Math.max(0, Number(info.stat.z) || 0);
      if (z > 0) return z;
    }
    return 0;
  }

  /** 玩家對該怪輸出傷害：創傷↑ + 伺機終傷 + 終極魔法 + 結凍粉碎 + 結冰特效 */
  function applyOutgoingDamageMods(mob, dmg, opts = {}) {
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
    const ult = ultimateMagicFinalDamR(mob);
    if (ult > 0) {
      out = Math.max(0, Math.floor(out * (1 + ult / 100)));
    }
    const shatterIed = rollFrozenShatterIed(mob);
    if (shatterIed > 0) {
      out = Math.max(0, Math.floor(out * (1 + shatterIed / 100)));
    }
    const stacks = getFreezeStacks(mob);
    const frost = stacks > 0 ? resolveFrostEffectStat() : null;
    if (frost && stacks > 0) {
      if (opts.isCritical && frost.critDmgPerStack > 0) {
        out = Math.max(0, Math.floor(out * (1 + (stacks * frost.critDmgPerStack) / 100)));
      }
      const sid = String(opts.skillId || '');
      if (sid && sid !== THUNDER_ORB_ID && isLightningSkill(sid) && frost.finalDamPerStack > 0) {
        out = Math.max(0, Math.floor(out * (1 + (stacks * frost.finalDamPerStack) / 100)));
      }
    }
    return out;
  }

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

  /** 冰雪結界開啟時，週期對場上怪物疊結冰 */
  function tickIceBarrierFreeze(ctx, dtSec) {
    const dt = Math.max(0, Number(dtSec) || 0);
    if (!(dt > 0) || !ctx) return;
    if (typeof SkillModifiers === 'undefined' || !SkillModifiers.hasBuff?.(ICE_BARRIER_ID)) {
      iceBarrierAcc = 0;
      return;
    }
    if (!(readSkillLevel(ICE_BARRIER_ID) > 0)) {
      iceBarrierAcc = 0;
      return;
    }
    iceBarrierAcc += dt;
    if (iceBarrierAcc < ICE_BARRIER_TICK_SEC) return;
    iceBarrierAcc = 0;
    const mobs = typeof ctx.getMobs === 'function'
      ? (ctx.getMobs() || [])
      : (ctx.mobs || []);
    const info = evalSkillStat(ICE_BARRIER_ID);
    const mobCount = Math.max(1, Math.floor(Number(info?.stat?.mobCount) || 6));
    const fury = resolveGlacialFuryMods();
    const stacks = SkillModifiers.hasBuff?.(GLACIAL_FURY_ID) ? fury.addStacks : 1;
    (mobs || [])
      .filter((m) => m && Number(m.hp) > 0)
      .slice(0, mobCount)
      .forEach((mob) => {
        applyFreeze(mob, {
          skillId: ICE_BARRIER_ID,
          stacks,
          maxStacks: fury.maxStacks,
          durationMs: resolveFreezeDurationMs(ICE_BARRIER_ID),
        });
      });
  }

  function tick(t = nowMs(), ctx = null, dtSec = 0) {
    prune(t);
    const kills = tickIncisingDots(ctx, dtSec);
    tickIceBarrierFreeze(ctx, dtSec);
    if (kills.length) {
      if (typeof ctx?.onMobStateSync === 'function') ctx.onMobStateSync(kills);
      else if (typeof ctx?.onProjectileResolve === 'function') ctx.onProjectileResolve(kills);
    }
    return kills;
  }

  function afterPlayerDamagedMob(mob, didHit, opts = {}) {
    if (!didHit || !mob) return;
    tryApplyScarOnHit(mob);
    tryApplyIncisingOnHit(mob, opts.skillId);
    tryApplyDefDownOnHit(mob, opts.skillId);
    applyOrConsumeFreeze(mob, opts.skillId);
    if (typeof SkillModifiers !== 'undefined') {
      if (typeof SkillModifiers.extendIgnisRoarFromHit === 'function') {
        SkillModifiers.extendIgnisRoarFromHit(opts.skillId);
      }
      if (typeof SkillModifiers.tryProcArcaneAim === 'function') {
        SkillModifiers.tryProcArcaneAim({
          fromSummon: !!opts.fromSummon,
          skillId: opts.skillId,
        });
      }
    }
  }

  return {
    SCAR_BUFF_ID,
    OPPORTUNITY_ID,
    INCISING_SKILL_IDS,
    DEF_DOWN_SKILL_IDS,
    FREEZE_APPLY_SKILL_IDS,
    FREEZE_SHATTER_ID,
    FREEZE_FX_SKILL_ID,
    THUNDER_ORB_ID,
    ICE_GOLEM_ID,
    ICE_BARRIER_ID,
    GLACIAL_FURY_ID,
    LIGHTNING_SKILL_IDS,
    hasScar,
    hasIncising,
    hasFreeze,
    getFreezeStacks,
    isImmobile,
    shouldBoostFinalDamage,
    getScarAtkDownPct,
    getIncisingDamageTakenPct,
    applyScar,
    applyIncising,
    applyDefDown,
    applyFreeze,
    consumeFreeze,
    applyOrConsumeFreeze,
    tryApplyScarOnHit,
    tryApplyIncisingOnHit,
    tryApplyDefDownOnHit,
    opportunityFinalDamR,
    ultimateMagicFinalDamR,
    rollFrozenShatterIed,
    applyOutgoingDamageMods,
    applyIncomingMobDamageMods,
    afterPlayerDamagedMob,
    clearScar,
    clearIncising,
    clearDefDown,
    clearFreeze,
    clearMob,
    clearAll,
    prune,
    tick,
  };
})();

if (typeof window !== 'undefined') {
  window.SkillMobStatus = SkillMobStatus;
}
