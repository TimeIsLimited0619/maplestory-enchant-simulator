/**
 * BOSS 戰鬥狀態機。
 * - 巴洛古（kind 省略）：四階段 body + handL/handR + chest
 * - 殘暴炎魔（kind: 'zakum'）：先八臂 → 本體三態；無 chest 則直接掉落
 * - 暗黑龍王（kind: 'horntail'）：左頭 → 右頭 → 本體八部位（死後佔位圖）
 * - 拉圖斯（kind: 'papulatus'）：時鐘 → 本體 → 二型（bodyForms）
 * - 簡單單本體（kind: 'simple'）：梅格耐斯等，近似一般怪物
 * - 粉紅豆豆（kind: 'pinkbean'）：過場 → 王座＋雕像殼漸進解鎖 → 本體
 * - 西格諾斯（kind: 'cygnus'）：本體＋守護獸；15%×5 鎖血召喚護衛後 sleep
 * 由 IdleBoss 呼叫；UI／紙娃娃仍在 IdleBoss。
 */
const IdleBossFight = (() => {
  const TICK_MS = 100;

  /** @type {null | object} */
  let fight = null;
  let busy = false;
  let playerAtkAcc = 0;
  /** @type {Record<string, Record<string, number>>} */
  let atkAcc = Object.create(null);
  let exitLeftSec = 0;
  let exitTimer = null;
  /** 取消延遲出傷／effect0（stop／reset 時遞增） */
  let atkFxSeq = 0;
  /** @type {null | object} */
  let hooks = null;
  /** @type {{ id: string, hpMult: number, dmgMult: number, rewards: any[] }} */
  let activeDiff = { id: 'easy', hpMult: 1, dmgMult: 1, rewards: [] };

  function pad(id) {
    return String(id || '').replace(/\D/g, '').padStart(7, '0').slice(-7);
  }

  function phaseScript(listId) {
    return (typeof IDLE_BOSS_PHASE !== 'undefined' ? IDLE_BOSS_PHASE : {})[String(listId)] || null;
  }

  function isZakumScript(script) {
    return !!(script && (script.kind === 'zakum' || (Array.isArray(script.arms) && script.arms.length)));
  }

  function isHorntailScript(script) {
    return !!(script && (script.kind === 'horntail' || (Array.isArray(script.stages) && script.stages.length)));
  }

  function isPapulatusScript(script) {
    return !!(script && script.kind === 'papulatus' && Array.isArray(script.bodyForms) && script.bodyForms.length);
  }

  function isSimpleScript(script) {
    return !!(script && script.kind === 'simple' && script.bodyStatMob);
  }

  function isPinkBeanScript(script) {
    return !!(script && script.kind === 'pinkbean'
      && Array.isArray(script.statues) && script.statues.length
      && Array.isArray(script.statuePhases) && script.statuePhases.length);
  }

  function isCygnusScript(script) {
    return !!(script && script.kind === 'cygnus' && script.bodyStatMob);
  }

  function isZakum(f = fight) {
    return !!(f && (f.kind === 'zakum' || isZakumScript(f.script)));
  }

  function isHorntail(f = fight) {
    return !!(f && (f.kind === 'horntail' || isHorntailScript(f.script)));
  }

  function isPapulatus(f = fight) {
    return !!(f && (f.kind === 'papulatus' || isPapulatusScript(f.script)));
  }

  function isSimple(f = fight) {
    return !!(f && (f.kind === 'simple' || isSimpleScript(f.script)));
  }

  function isPinkBean(f = fight) {
    return !!(f && (f.kind === 'pinkbean' || isPinkBeanScript(f.script)));
  }

  function isCygnus(f = fight) {
    return !!(f && (f.kind === 'cygnus' || isCygnusScript(f.script)));
  }

  function cygnusSleeping(f = fight) {
    return isCygnus(f) && !!f?.cygnusSleep;
  }

  /** 單本體（無手臂／多部位） */
  function isBodyOnly(f = fight) {
    return isPapulatus(f) || isSimple(f);
  }

  /** 炎魔／龍王／粉豆雕像：以 arms[] 當前可打部位列表 */
  function isArmStyle(f = fight) {
    return isZakum(f) || isHorntail(f) || isPinkBean(f);
  }

  function pinkBeanInBodyPhase(f = fight) {
    return isPinkBean(f) && !!f?.pinkbeanBody;
  }

  /** 炎魔本體態／拉圖斯：bodyForms 切換 */
  function isBodyFormStyle(f = fight) {
    return isZakum(f) || isPapulatus(f);
  }

  function armList(f = fight) {
    return Array.isArray(f?.arms) ? f.arms : [];
  }

  function findArm(key, f = fight) {
    const k = String(key || '');
    return armList(f).find((a) => a.key === k || a.uid === k) || null;
  }

  function allArmsDead(f = fight) {
    const arms = armList(f);
    return arms.length > 0 && arms.every((a) => a.dead || !(a.hp > 0));
  }

  function currentBodyForm(f = fight) {
    const forms = f?.script?.bodyForms || [];
    if (!forms.length) return null;
    const i = Math.max(0, Math.min(forms.length - 1, Math.floor(Number(f?.bodyFormIndex) || 0)));
    return forms[i];
  }

  function wzRow(listId) {
    return (typeof IDLE_BOSS_WZ !== 'undefined' ? IDLE_BOSS_WZ : {})[String(listId)] || null;
  }

  function wzPart(listId, mobId) {
    const id = pad(mobId);
    return (wzRow(listId)?.parts || []).find((p) => pad(p.mobId) === id) || null;
  }

  function wzExtraOrPart(listId, mobId) {
    return wzPart(listId, mobId);
  }

  function resolveDiff(listId, diffId) {
    if (typeof IdleBossDiff !== 'undefined' && IdleBossDiff.get) {
      return IdleBossDiff.get(listId, diffId) || { id: 'easy', hpMult: 1, dmgMult: 1, rewards: [] };
    }
    return { id: 'easy', hpMult: 1, dmgMult: 1, rewards: [] };
  }

  function hpMult(listId) {
    const n = Number(wzRow(listId)?.hpMult);
    const wz = n > 0 ? n : 1;
    const extra = Number(activeDiff?.hpMult) > 0 ? Number(activeDiff.hpMult) : 1;
    return wz * extra;
  }

  function dmgMult(listId) {
    const n = Number(wzRow(listId)?.dmgMult);
    const wz = n > 0 ? n : 1;
    const extra = Number(activeDiff?.dmgMult) > 0 ? Number(activeDiff.dmgMult) : 1;
    return wz * extra;
  }

  function cdMult(listId) {
    const n = Number(wzRow(listId)?.cdMult);
    return n > 0 ? n : 1;
  }

  function maxHpOf(listId, mobId) {
    const part = wzPart(listId, mobId);
    if (part) return Math.max(1, Math.floor((Number(part.maxHP) || 1) * hpMult(listId)));
    // chest / sealed：從動畫檔旁的 stats 不在 parts 時用預設
    if (pad(mobId) === '8830014') return Math.max(1, Math.floor(1000 * hpMult(listId)));
    return 1;
  }

  function sleep(ms) {
    const scale = typeof IdleHunt !== 'undefined' && IdleHunt.scaleDelayMs
      ? IdleHunt.scaleDelayMs(ms)
      : ms;
    return new Promise((resolve) => window.setTimeout(resolve, Math.max(0, scale)));
  }

  function stage() {
    return hooks?.getStage?.() || document.getElementById('idleBossStage');
  }

  function slotEl(key) {
    return stage()?.querySelector(`.idle-boss-part[data-slot="${key}"]`) || null;
  }

  function scaleDelayMs(ms) {
    if (typeof IdleHunt !== 'undefined' && IdleHunt.scaleDelayMs) {
      return IdleHunt.scaleDelayMs(ms);
    }
    return ms;
  }

  function bindVisual(key, mobId, action) {
    const el = slotEl(key);
    if (!el || typeof IdleMobAnim === 'undefined') return;
    const id = pad(mobId);
    // 粉豆本體階段禁止把 body 綁回王座
    if (isPinkBean() && pinkBeanInBodyPhase() && key === 'body' && id === '8820000') {
      return;
    }
    el.dataset.mobId = id;
    el.classList.remove('is-dying');
    el.classList.toggle('is-dead', false);
    el.classList.toggle('is-sealed', false);
    el.classList.toggle('is-hidden-slot', false);
    IdleMobAnim.clearActorCastFlags(el);
    el.dataset.dieDone = '0';
    delete el.dataset.introLock;
    const kind = action || 'stand';
    IdleMobAnim.bindActorSprite(el, id, kind);
    const img = IdleMobAnim.actorBodyImg(el);
    if (img) {
      img.dataset.frameAcc = '0';
      img.dataset.bodyDone = '0';
    }
  }

  function hideSlot(key) {
    clearUnitDebuff(key);
    const el = slotEl(key);
    if (!el) return;
    el.classList.add('is-hidden-slot');
    el.classList.add('is-dead');
    el.style.display = 'none';
  }

  function removeSlot(key) {
    clearUnitDebuff(key);
    const el = slotEl(key);
    if (!el) return;
    el.style.display = 'none';
    el.remove();
  }

  function clearUnitDebuff(keyOrUnit) {
    if (typeof SkillMobStatus === 'undefined') return;
    SkillMobStatus.clearScar?.(keyOrUnit);
  }

  async function playAnim(key, mobId, action) {
    const el = slotEl(key);
    const id = pad(mobId);
    if (!el || typeof IdleMobAnim === 'undefined') {
      await sleep(600);
      return;
    }
    el.dataset.mobId = id;
    const want = IdleMobAnim.actionForKind(action || 'stand');
    const resolved = IdleMobAnim.resolveAction(id, want) || want;

    // die：等完整 actionDuration（巴洛古 die1 可達數秒～十秒，不可用章節小怪 DIE_MAX）
    if (/^die/i.test(String(action || '')) || /^die/i.test(resolved)) {
      IdleMobAnim.beginActorDie(el, id);
      const dieAction = IdleMobAnim.resolveAction(id, 'die1') || resolved || 'die1';
      const dur = Math.max(
        400,
        Number(IdleMobAnim.actionDurationMs(id, dieAction, 'die')) || 1200,
      );
      const speed = Math.max(0.1, Number(el.dataset.animSpeed) || 1);
      const timeout = scaleDelayMs(dur + 250) / speed;
      const start = Date.now();
      while (Date.now() - start < timeout) {
        if (el.dataset.dieDone === '1') break;
        await sleep(TICK_MS);
      }
      return;
    }

    // regen 等 intro：與章節 waitMobIntroAnim 相同
    if (String(action) === 'regen' || resolved === 'regen') {
      const img = IdleMobAnim.actorBodyImg(el);
      el.dataset.introAction = 'regen';
      IdleMobAnim.bindActorSprite(el, id, 'regen');
      if (img) {
        img.dataset.frameAcc = '0';
        img.dataset.bodyDone = '0';
      }
      const timeout = (IdleMobAnim.actionDurationMs(id, 'regen', 'regen') || 1200) + 200;
      const start = Date.now();
      while (Date.now() - start < timeout) {
        if (img?.dataset.bodyDone === '1') break;
        await sleep(TICK_MS);
      }
      delete el.dataset.introAction;
      return;
    }

    // attack / skill：與章節 flashMobAttack 相同
    const ok = IdleMobAnim.flashActorAttack(el, resolved, {
      iconId: id,
      scaleDelayMs,
    });
    if (!ok) {
      await sleep(400);
      return;
    }
    const start = Date.now();
    const bodyMs = Number(IdleMobAnim.actionDurationMs?.(id, resolved, resolved)) || 0;
    const cap = scaleDelayMs(Math.min(
      (IdleMobAnim.SKILL_MAX_MS || 30000) + 200,
      Math.max(bodyMs + 250, 800),
    ));
    while (Date.now() - start < cap) {
      if (!IdleMobAnim.isActorCasting(el)) break;
      await sleep(TICK_MS);
    }
  }

  function syncHud() {
    hooks?.syncHud?.();
  }

  function createFight(listId) {
    const script = phaseScript(listId);
    if (!script) return null;
    if (isHorntailScript(script)) return createHorntailFight(listId, script);
    if (isPapulatusScript(script)) return createPapulatusFight(listId, script);
    if (isSimpleScript(script)) return createSimpleFight(listId, script);
    if (isCygnusScript(script)) return createCygnusFight(listId, script);
    if (isPinkBeanScript(script)) return createPinkBeanFight(listId, script);
    if (isZakumScript(script)) return createZakumFight(listId, script);

    const bodyMax = maxHpOf(listId, script.bodyStatMob);
    const lMax = maxHpOf(listId, script.handL.statMob);
    const rMax = maxHpOf(listId, script.handR.statMob);
    return {
      listId: String(listId),
      kind: 'balrog',
      script,
      phase: 1,
      body: {
        key: 'body',
        uid: 'body',
        isBoss: true,
        visualId: pad(script.bodyStatMob),
        hp: bodyMax,
        maxHp: bodyMax,
        targetable: true,
        invincible: false,
      },
      handL: {
        key: 'handL',
        uid: 'handL',
        isBoss: true,
        visualId: pad(script.handL.sealed || script.handL.active),
        hp: lMax,
        maxHp: lMax,
        targetable: false,
        active: false,
        dead: false,
      },
      handR: {
        key: 'handR',
        uid: 'handR',
        isBoss: true,
        visualId: pad(script.handR.active),
        hp: rMax,
        maxHp: rMax,
        targetable: false,
        active: false,
        dead: false,
      },
      arms: [],
      bodyFormIndex: 0,
      chest: null,
      mode: 'fight', // fight | clear | done
      rewardsGranted: false,
    };
  }

  function createZakumFight(listId, script) {
    const forms = Array.isArray(script.bodyForms) ? script.bodyForms : [];
    const form0 = forms[0] || { statMob: script.bodyStatMob, visualMob: script.bodyStatMob };
    const bodyMax = maxHpOf(listId, form0.statMob);
    const arms = (script.arms || []).map((a, i) => {
      const key = String(a.key || `arm${i}`);
      const stat = pad(a.statMob || a.active);
      const max = maxHpOf(listId, stat);
      const ox = Number(a.offset?.x) || 0;
      const oy = Number(a.offset?.y) || 0;
      return {
        key,
        uid: key,
        isBoss: true,
        role: 'hand',
        visualId: pad(a.active || a.statMob),
        hp: max,
        maxHp: max,
        targetable: true,
        active: true,
        dead: false,
        statMob: stat,
        z: Number.isFinite(Number(a.z)) ? Number(a.z) : (1 + i),
        flipX: !!a.flipX,
        offset: { x: ox, y: oy },
      };
    });
    const bodyZ = Number.isFinite(Number(script.bodyZ)) ? Number(script.bodyZ) : 20;
    return {
      listId: String(listId),
      kind: 'zakum',
      script,
      phase: 1,
      bodyFormIndex: 0,
      bodyZ,
      body: {
        key: 'body',
        uid: 'body',
        isBoss: true,
        visualId: pad(form0.visualMob || form0.statMob),
        hp: bodyMax,
        maxHp: bodyMax,
        targetable: false,
        invincible: true,
        dead: false,
      },
      handL: null,
      handR: null,
      arms,
      chest: null,
      mode: 'fight',
      rewardsGranted: false,
    };
  }

  function buildHorntailParts(listId, stageDef) {
    return (stageDef?.parts || []).map((a, i) => {
      const key = String(a.key || `part${i}`);
      const stat = pad(a.statMob || a.active);
      const max = maxHpOf(listId, stat);
      const ox = Number(a.offset?.x) || 0;
      const oy = Number(a.offset?.y) || 0;
      return {
        key,
        uid: key,
        isBoss: true,
        role: 'hand',
        visualId: pad(a.active || a.statMob),
        hp: max,
        maxHp: max,
        targetable: true,
        active: true,
        dead: false,
        sealed: false,
        statMob: stat,
        deadSealed: a.deadSealed ? pad(a.deadSealed) : '',
        z: Number.isFinite(Number(a.z)) ? Number(a.z) : (1 + i),
        flipX: !!a.flipX,
        offset: { x: ox, y: oy },
      };
    });
  }

  function createHorntailFight(listId, script) {
    const stages = Array.isArray(script.stages) ? script.stages : [];
    const stage0 = stages[0] || { parts: [] };
    const arms = buildHorntailParts(listId, stage0);
    return {
      listId: String(listId),
      kind: 'horntail',
      script,
      phase: 1,
      stageIndex: 0,
      bodyFormIndex: 0,
      bodyZ: 20,
      body: {
        key: 'body',
        uid: 'body',
        isBoss: true,
        visualId: '',
        hp: 1,
        maxHp: 1,
        targetable: false,
        invincible: true,
        dead: false,
      },
      handL: null,
      handR: null,
      arms,
      chest: null,
      mode: 'fight',
      rewardsGranted: false,
    };
  }

  function createPapulatusFight(listId, script) {
    const forms = Array.isArray(script.bodyForms) ? script.bodyForms : [];
    const form0 = forms[0] || { statMob: '8500000', visualMob: '8500000' };
    const bodyMax = maxHpOf(listId, form0.statMob);
    return {
      listId: String(listId),
      kind: 'papulatus',
      script,
      phase: 1,
      bodyFormIndex: 0,
      bodyZ: Number.isFinite(Number(script.bodyZ)) ? Number(script.bodyZ) : 20,
      body: {
        key: 'body',
        uid: 'body',
        isBoss: true,
        visualId: pad(form0.visualMob || form0.statMob),
        hp: bodyMax,
        maxHp: bodyMax,
        targetable: true,
        invincible: false,
        dead: false,
      },
      handL: null,
      handR: null,
      arms: [],
      chest: null,
      mode: 'fight',
      rewardsGranted: false,
    };
  }

  function createSimpleFight(listId, script) {
    const bodyMax = maxHpOf(listId, script.bodyStatMob);
    return {
      listId: String(listId),
      kind: 'simple',
      script,
      phase: 1,
      bodyZ: Number.isFinite(Number(script.bodyZ)) ? Number(script.bodyZ) : 20,
      body: {
        key: 'body',
        uid: 'body',
        isBoss: true,
        visualId: pad(script.bodyStatMob),
        hp: bodyMax,
        maxHp: bodyMax,
        targetable: true,
        invincible: false,
        dead: false,
      },
      handL: null,
      handR: null,
      arms: [],
      chest: null,
      mode: 'fight',
      rewardsGranted: false,
    };
  }

  function makeCygnusCompanion(listId, key, def, opts = {}) {
    const mob = pad(def?.mob || def?.statMob || def);
    const max = maxHpOf(listId, mob);
    return {
      key,
      uid: key,
      isBoss: true,
      role: 'hand',
      visualId: mob,
      statMob: mob,
      hp: max,
      maxHp: max,
      targetable: opts.targetable !== false,
      active: opts.active !== false,
      invincible: !!opts.invincible,
      dead: false,
      z: Number.isFinite(Number(def?.z)) ? Number(def.z) : 25,
      flipX: !!def?.flipX,
      offset: {
        x: Number(def?.offset?.x) || 0,
        y: Number(def?.offset?.y) || 0,
      },
    };
  }

  function createCygnusFight(listId, script) {
    const bodyMax = maxHpOf(listId, script.bodyStatMob);
    const guardian = script.guardian
      ? makeCygnusCompanion(listId, 'guardian', script.guardian)
      : null;
    return {
      listId: String(listId),
      kind: 'cygnus',
      script,
      phase: 1,
      bodyZ: Number.isFinite(Number(script.bodyZ)) ? Number(script.bodyZ) : 20,
      body: {
        key: 'body',
        uid: 'body',
        isBoss: true,
        visualId: pad(script.bodyStatMob),
        hp: bodyMax,
        maxHp: bodyMax,
        targetable: true,
        invincible: false,
        dead: false,
      },
      guardian,
      escort: null,
      lockIndex: 0,
      cygnusSleep: false,
      handL: null,
      handR: null,
      arms: [],
      chest: null,
      mode: 'fight',
      rewardsGranted: false,
    };
  }

  /** 西格諾斯轉階段（鎖血／覺醒）動畫倍率 */
  const CYGNUS_PHASE_ANIM_SPEED = 2;

  function setActorAnimSpeed(key, speed) {
    const el = slotEl(key);
    if (!el) return;
    const n = Number(speed);
    if (Number.isFinite(n) && n > 0 && n !== 1) el.dataset.animSpeed = String(n);
    else delete el.dataset.animSpeed;
  }

  async function playCygnusBodyAction(actionKey, fallbackMs = 1200) {
    if (!fight?.body) return false;
    const seq = atkFxSeq;
    const id = pad(fight.body.visualId);
    const key = String(actionKey || '');
    const el = slotEl('body');
    const speed = CYGNUS_PHASE_ANIM_SPEED;
    if (!key) {
      await sleep(fallbackMs / speed);
      return false;
    }
    const has = typeof IdleMobAnim !== 'undefined'
      && !!IdleMobAnim.resolveAction?.(id, key);
    if (!has || !el) {
      await sleep(scaleDelayMs(fallbackMs) / speed);
      return false;
    }
    setActorAnimSpeed('body', speed);
    // 清施法鎖再播，避免 flashAttack 因仍 casting 失敗
    IdleMobAnim.clearActorCastFlags?.(el);
    if (el.dataset.introAction) delete el.dataset.introAction;
    if (!flashAttack('body', id, key)) {
      const img = IdleMobAnim.actorBodyImg?.(el);
      const bodyMs = Math.max(80, Number(IdleMobAnim.actionDurationMs?.(id, key)) || fallbackMs);
      el.dataset.skillUntil = String(Date.now() + scaleDelayMs(bodyMs + 80) / speed);
      el.dataset.attackUntil = '0';
      if (img) {
        img.dataset.kindAction = key;
        img.dataset.frameAcc = '0';
        img.dataset.bodyDone = '0';
        IdleMobAnim.bind?.(img, id, key, 0);
      }
    }
    const cap = scaleDelayMs((IdleMobAnim.actionDurationMs?.(id, key) || fallbackMs) + 600) / speed;
    const startAt = Date.now();
    while (Date.now() - startAt < cap) {
      if (seq !== atkFxSeq || !fight) return false;
      const img = IdleMobAnim.actorBodyImg?.(el);
      if (img?.dataset.bodyDone === '1') return true;
      if (!IdleMobAnim.isActorCasting?.(el) && Date.now() - startAt > 120) return true;
      await sleep(TICK_MS);
    }
    return true;
  }

  function mountCygnusEscort(idx) {
    if (!fight || !isCygnus()) return null;
    const def = (fight.script.escorts || [])[idx];
    if (!def) return null;
    removeSlot('escort');
    const unit = makeCygnusCompanion(fight.listId, 'escort', def);
    fight.escort = unit;
    const bossPos = hooks?.getBossPos?.() || { x: 720, y: 580 };
    applyActorLayout(bossPos, { skipBind: true });
    const el = slotEl('escort');
    if (el) {
      el.classList.remove('is-hidden-slot', 'is-dead');
      el.style.display = '';
    }
    bindVisual('escort', unit.visualId, 'stand');
    return unit;
  }

  /** 護衛戰期間鎖住本體 sleep（spriteKind 否則會掉回 stand） */
  function holdCygnusBodySleep() {
    if (!fight || !isCygnus() || !cygnusSleeping()) return;
    const el = slotEl('body');
    const bodyId = pad(fight.body.visualId);
    if (!el || typeof IdleMobAnim === 'undefined') return;
    if (!IdleMobAnim.resolveAction?.(bodyId, 'sleep')) return;
    // holdAction：skillUntil 到期後仍播 sleep，不閃 stand
    el.dataset.holdAction = 'sleep';
    if (el.dataset.introAction) delete el.dataset.introAction;
    const img = IdleMobAnim.actorBodyImg?.(el);
    if (img) {
      const onSleep = img.dataset.kindAction === 'sleep'
        && (img.dataset.action === 'sleep'
          || IdleMobAnim.resolveAction?.(bodyId, 'sleep') === img.dataset.action);
      if (!onSleep) {
        img.dataset.kindAction = 'sleep';
        img.dataset.frameAcc = '0';
        img.dataset.bodyDone = '0';
        IdleMobAnim.bind?.(img, bodyId, 'sleep', 0);
      }
    }
  }

  function clearCygnusBodySleepHold() {
    const el = slotEl('body');
    if (!el) return;
    if (el.dataset.holdAction === 'sleep') delete el.dataset.holdAction;
    if (el.dataset.introAction === 'sleep') delete el.dataset.introAction;
  }

  function armCygnusSleepHold() {
    const el = slotEl('body');
    if (!el) return;
    el.dataset.holdAction = 'sleep';
  }

  function tryCygnusHpLock() {
    if (!fight || !isCygnus() || busy || fight.mode !== 'fight') return;
    if (cygnusSleeping() || fight.escort) return;
    if (fight.body?.invincible || fight.body?.dead) return;
    const ratios = fight.script.lockHpRatios || [];
    const idx = Math.max(0, Math.floor(Number(fight.lockIndex) || 0));
    if (idx >= ratios.length) return;
    const floor = Math.max(1, Math.ceil(fight.body.maxHp * Number(ratios[idx])));
    if (fight.body.hp > floor) return;
    runCygnusHpLock(idx, floor);
  }

  async function runCygnusHpLock(idx, floorHp) {
    if (!fight || !isCygnus() || busy) return;
    const seq = atkFxSeq;
    busy = true;
    fight.body.invincible = true;
    fight.body.hp = Math.max(1, Math.floor(Number(floorHp) || fight.body.hp));
    clearCygnusBodySleepHold();
    syncHud();
    hooks?.onTitle?.('騎士召喚');

    const skill6 = String(fight.script.lockSkill6 || 'skill6');
    const skill5 = String(fight.script.lockSkill5 || 'skill5');
    await playCygnusBodyAction(skill6, 2640);
    if (seq !== atkFxSeq || !fight) return;

    // skill6 完整播完後才出現護衛
    mountCygnusEscort(idx);
    syncHud();

    // 先掛 holdAction=sleep：skill5 結束時直接接 sleep，不閃 stand
    armCygnusSleepHold();
    await playCygnusBodyAction(skill5, 3120);
    if (seq !== atkFxSeq || !fight) return;

    // sleep 循環維持原速
    setActorAnimSpeed('body', 1);
    fight.cygnusSleep = true;
    holdCygnusBodySleep();
    hooks?.onTitle?.('沉睡');
    busy = false;
    syncHud();
  }

  async function killCygnusCompanion(kind) {
    if (!fight || !isCygnus()) return;
    const key = String(kind || '');
    if (key === 'escort') {
      await onCygnusEscortDead();
      return;
    }
    const unit = fight.guardian;
    if (!unit || unit.dead) return;
    unit.dead = true;
    unit.targetable = false;
    unit.active = false;
    unit.hp = 0;
    if (busy) {
      removeSlot('guardian');
      fight.guardian = null;
      syncHud();
      return;
    }
    const seq = atkFxSeq;
    busy = true;
    await playAnim('guardian', unit.visualId, 'die1');
    if (seq !== atkFxSeq || !fight) return;
    removeSlot('guardian');
    fight.guardian = null;
    busy = false;
    syncHud();
  }

  async function onCygnusEscortDead() {
    if (!fight || !isCygnus()) return;
    const escort = fight.escort;
    if (!escort || escort.dead) return;
    escort.dead = true;
    escort.targetable = false;
    escort.active = false;
    escort.hp = 0;

    // 鎖血施法中不該打死護衛；若發生則只清槽
    if (busy && !cygnusSleeping()) {
      removeSlot('escort');
      fight.escort = null;
      syncHud();
      return;
    }

    const seq = atkFxSeq;
    busy = true;
    hooks?.onTitle?.('覺醒');
    setActorAnimSpeed('escort', CYGNUS_PHASE_ANIM_SPEED);
    await playAnim('escort', escort.visualId, 'die1');
    setActorAnimSpeed('escort', 1);
    if (seq !== atkFxSeq || !fight) return;
    removeSlot('escort');
    fight.escort = null;
    syncHud();

    clearCygnusBodySleepHold();
    const bodyId = pad(fight.body.visualId);
    if (typeof IdleMobAnim !== 'undefined' && IdleMobAnim.resolveAction?.(bodyId, 'wakeup')) {
      await playCygnusBodyAction('wakeup', 1200);
    }
    if (seq !== atkFxSeq || !fight) return;

    setActorAnimSpeed('body', 1);
    fight.cygnusSleep = false;
    fight.body.invincible = false;
    fight.lockIndex = Math.max(0, Math.floor(Number(fight.lockIndex) || 0)) + 1;
    bindVisual('body', bodyId, 'stand');
    busy = false;
    hooks?.onPhase?.(1 + fight.lockIndex);
    syncHud();
  }

  function buildPinkBeanStatues(listId, script) {
    return (script.statues || []).map((a, i) => {
      const key = String(a.key || `statue${i}`);
      const stat = pad(a.mob || a.statMob || a.active);
      const max = maxHpOf(listId, stat);
      const ox = Number(a.offset?.x) || 0;
      const oy = Number(a.offset?.y) || 0;
      return {
        key,
        uid: key,
        isBoss: true,
        role: 'hand',
        visualId: stat,
        hp: max,
        maxHp: max,
        targetable: false,
        active: false,
        dead: false,
        unlocked: false,
        statMob: stat,
        z: Number.isFinite(Number(a.z)) ? Number(a.z) : (30 + i),
        flipX: !!a.flipX,
        offset: { x: ox, y: oy },
      };
    });
  }

  function buildPinkBeanScenery(script) {
    return (script.scenery || []).map((a, i) => {
      const key = String(a.key || `scenery${i}`);
      const id = pad(a.mob || a.visualMob);
      const ox = Number(a.offset?.x) || 0;
      const oy = Number(a.offset?.y) || 0;
      return {
        key,
        uid: key,
        isBoss: false,
        role: 'scenery',
        visualId: id,
        hp: 1,
        maxHp: 1,
        targetable: false,
        active: false,
        dead: false,
        invincible: true,
        z: Number.isFinite(Number(a.z)) ? Number(a.z) : (5 + i),
        flipX: !!a.flipX,
        offset: { x: ox, y: oy },
      };
    });
  }

  function sceneryList(f = fight) {
    return Array.isArray(f?.scenery) ? f.scenery : [];
  }

  function makePinkBeanShell(listId, shellMob) {
    const id = pad(shellMob);
    const max = maxHpOf(listId, id);
    return {
      key: 'shell',
      uid: 'shell',
      mobId: id,
      hp: max,
      maxHp: max,
    };
  }

  function createPinkBeanFight(listId, script) {
    const intro = script.intro || {};
    const throneId = pad(intro.throneMob || '8820000');
    const arms = buildPinkBeanStatues(listId, script);
    const scenery = buildPinkBeanScenery(script);
    const shell0 = (script.statuePhases || [])[0]?.shell || '8820010';
    return {
      listId: String(listId),
      kind: 'pinkbean',
      script,
      phase: 1,
      statuePhaseIndex: 0,
      pinkbeanBody: false,
      bodyFormIndex: 0,
      bodyZ: Number.isFinite(Number(script.bodyZ)) ? Number(script.bodyZ) : 20,
      body: {
        key: 'body',
        uid: 'body',
        isBoss: true,
        visualId: throneId,
        hp: 1,
        maxHp: 1,
        targetable: false,
        invincible: true,
        dead: false,
      },
      shell: makePinkBeanShell(listId, shell0),
      handL: null,
      handR: null,
      arms,
      scenery,
      chest: null,
      mode: 'fight',
      rewardsGranted: false,
    };
  }

  function applyActorLayout(bossPos, opts = {}) {
    if (!fight) return;
    const b = bossPos || { x: 620, y: 605 };
    const skipBind = !!opts.skipBind;
    const order = [];
    if (isArmStyle()) {
      // 粉豆場景裝飾在最後方
      if (isPinkBean()) {
        sceneryList().forEach((prop) => {
          order.push({
            key: prop.key,
            z: prop.z,
            unit: prop,
            flipX: !!prop.flipX,
            x: b.x + (prop.offset?.x || 0),
            y: b.y + (prop.offset?.y || 0),
            scenery: true,
          });
        });
      }
      // 先掛部位：z 較低在後方
      armList().forEach((arm) => {
        order.push({
          key: arm.key,
          z: arm.z,
          unit: arm,
          flipX: !!arm.flipX,
          x: b.x + (arm.offset?.x || 0),
          y: b.y + (arm.offset?.y || 0),
        });
      });
      // 炎魔／粉豆有本體；龍王各階段只有部位（無中央 body 圖）
      if ((isZakum() || isPinkBean()) && fight.body?.visualId) {
        order.push({
          key: 'body',
          z: fight.bodyZ || 20,
          unit: fight.body,
          x: b.x,
          y: b.y,
        });
      }
    } else if (isCygnus()) {
      if (fight.guardian && !fight.guardian.dead) {
        order.push({
          key: 'guardian',
          z: fight.guardian.z || 25,
          unit: fight.guardian,
          flipX: !!fight.guardian.flipX,
          x: b.x + (fight.guardian.offset?.x || 0),
          y: b.y + (fight.guardian.offset?.y || 0),
        });
      }
      if (fight.escort && !fight.escort.dead) {
        order.push({
          key: 'escort',
          z: fight.escort.z || 30,
          unit: fight.escort,
          flipX: !!fight.escort.flipX,
          x: b.x + (fight.escort.offset?.x || 0),
          y: b.y + (fight.escort.offset?.y || 0),
        });
      }
      order.push({
        key: 'body',
        z: fight.bodyZ || 20,
        unit: fight.body,
        x: b.x,
        y: b.y,
      });
    } else if (isBodyOnly()) {
      order.push({
        key: 'body',
        z: fight.bodyZ || 20,
        unit: fight.body,
        x: b.x,
        y: b.y,
      });
    } else {
      order.push(
        { key: 'body', z: 10, unit: fight.body, x: b.x, y: b.y },
        { key: 'handL', z: 30, unit: fight.handL, x: b.x, y: b.y },
        { key: 'handR', z: 31, unit: fight.handR, x: b.x, y: b.y },
      );
    }
    if (fight.chest) {
      order.push({ key: 'chest', z: 40, unit: fight.chest, x: b.x, y: b.y });
    }
    const st = stage();
    if (!st) return;
    order.forEach((row) => {
      if (!row.unit) return;
      let el = slotEl(row.key);
      if (!el) {
        st.insertAdjacentHTML('beforeend', `<div class="idle-actor idle-actor--mob idle-boss-part"
          data-slot="${row.key}" data-uid="${row.key}" data-mob-id="${row.unit.visualId}"
          style="left:${row.x}px;top:${row.y}px;z-index:${row.z}">
          <div class="idle-actor-sprite-stage">
            <img class="idle-actor-sprite" alt="" draggable="false">
          </div>
        </div>`);
        el = slotEl(row.key);
      } else {
        el.style.left = `${row.x}px`;
        el.style.top = `${row.y}px`;
        el.style.zIndex = String(row.z);
      }
      el.classList.toggle('is-flip-x', !!row.flipX);
      if (!skipBind) {
        bindVisual(row.key, row.unit.visualId, 'stand');
      }
      if (isArmStyle() && findArm(row.key)) {
        el.classList.toggle('is-sealed', !!row.unit.sealed);
        el.classList.toggle('is-dead', !!row.unit.dead && !row.unit.sealed);
        if (isPinkBean() && !row.unit.unlocked && !row.unit.dead) {
          el.classList.add('is-hidden-slot');
          el.style.display = 'none';
        }
      } else if (row.scenery) {
        el.classList.remove('is-hidden-slot', 'is-dead', 'is-sealed');
        el.style.display = '';
        el.style.pointerEvents = 'none';
      } else if (row.key === 'handL' || row.key === 'handR') {
        const sealed = !!row.unit.dead || (fight.phase === 1 && row.key === 'handL' && fight.script.handL.sealed);
        el.classList.toggle('is-sealed', sealed);
        el.classList.toggle('is-dead', false);
      } else if (row.key !== 'chest' && row.unit.dead) {
        el.classList.add('is-dead');
      }
    });
  }

  function mountInitialActors(bossPos, opts = {}) {
    const st = stage();
    if (!st || !fight) return;
    st.querySelectorAll('.idle-boss-part').forEach((n) => n.remove());
    applyActorLayout(bossPos, opts);
  }

  function mountChestOnly(bossPos) {
    const st = stage();
    if (!st || !fight?.chest) return;
    const b = bossPos || { x: 620, y: 605 };
    let el = slotEl('chest');
    if (!el) {
      st.insertAdjacentHTML('beforeend', `<div class="idle-actor idle-actor--mob idle-boss-part"
        data-slot="chest" data-uid="chest" data-mob-id="${fight.chest.visualId}"
        style="left:${b.x}px;top:${b.y}px;z-index:40">
        <div class="idle-actor-sprite-stage">
          <img class="idle-actor-sprite" alt="" draggable="false">
        </div>
      </div>`);
      el = slotEl('chest');
    } else {
      el.style.left = `${b.x}px`;
      el.style.top = `${b.y}px`;
      el.style.zIndex = '40';
    }
    el?.classList.remove('is-hidden-slot', 'is-dead', 'is-dying');
  }

  function pickTarget() {
    if (!fight || busy) return null;
    if (fight.mode === 'clear' && fight.chest && fight.chest.hp > 0) {
      return { kind: 'chest', unit: fight.chest };
    }
    if (fight.mode !== 'fight') return null;

    if (isHorntail()) {
      const arms = armList()
        .filter((a) => a.targetable && !a.dead && a.hp > 0)
        .map((a) => ({ kind: a.key, unit: a }));
      if (!arms.length) return null;
      arms.sort((a, b) => (a.unit.hp / Math.max(1, a.unit.maxHp)) - (b.unit.hp / Math.max(1, b.unit.maxHp)));
      return arms[0];
    }

    if (isPinkBean()) {
      if (pinkBeanInBodyPhase()) {
        if (fight.body.hp > 0 && !fight.body.invincible && fight.body.targetable) {
          return { kind: 'body', unit: fight.body };
        }
        return null;
      }
      const arms = armList()
        .filter((a) => a.unlocked && a.targetable && !a.dead && a.hp > 0)
        .map((a) => ({ kind: a.key, unit: a }));
      if (!arms.length) return null;
      arms.sort((a, b) => (a.unit.hp / Math.max(1, a.unit.maxHp)) - (b.unit.hp / Math.max(1, b.unit.maxHp)));
      return arms[0];
    }

    if (isCygnus()) {
      if (fight.escort && fight.escort.targetable && !fight.escort.dead && fight.escort.hp > 0) {
        return { kind: 'escort', unit: fight.escort };
      }
      if (fight.guardian && fight.guardian.targetable && !fight.guardian.dead && fight.guardian.hp > 0) {
        return { kind: 'guardian', unit: fight.guardian };
      }
      if (fight.body.hp > 0 && !fight.body.invincible && fight.body.targetable && !cygnusSleeping()) {
        return { kind: 'body', unit: fight.body };
      }
      return null;
    }

    if (isPapulatus()) {
      if (fight.body.hp > 0 && !fight.body.invincible && fight.body.targetable) {
        return { kind: 'body', unit: fight.body };
      }
      return null;
    }

    if (isSimple()) {
      if (fight.body.hp > 0 && !fight.body.invincible && fight.body.targetable) {
        return { kind: 'body', unit: fight.body };
      }
      return null;
    }

    if (isZakum()) {
      if (fight.phase === 1) {
        const arms = armList()
          .filter((a) => a.targetable && !a.dead && a.hp > 0)
          .map((a) => ({ kind: a.key, unit: a }));
        if (!arms.length) return null;
        arms.sort((a, b) => (a.unit.hp / Math.max(1, a.unit.maxHp)) - (b.unit.hp / Math.max(1, b.unit.maxHp)));
        return arms[0];
      }
      if (fight.body.hp > 0 && !fight.body.invincible && fight.body.targetable) {
        return { kind: 'body', unit: fight.body };
      }
      return null;
    }

    if (fight.phase === 1) {
      if (fight.body.targetable && fight.body.hp > 0) return { kind: 'body', unit: fight.body };
      return null;
    }
    if (fight.phase === 2) {
      const cands = [];
      if (fight.handL.targetable && !fight.handL.dead && fight.handL.hp > 0) {
        cands.push({ kind: 'handL', unit: fight.handL });
      }
      if (fight.handR.targetable && !fight.handR.dead && fight.handR.hp > 0) {
        cands.push({ kind: 'handR', unit: fight.handR });
      }
      if (fight.body.targetable && !fight.body.invincible && fight.body.hp > 0) {
        cands.push({ kind: 'body', unit: fight.body });
      }
      if (!cands.length) return null;
      cands.sort((a, b) => (a.unit.hp / Math.max(1, a.unit.maxHp)) - (b.unit.hp / Math.max(1, b.unit.maxHp)));
      return cands[0];
    }
    if (fight.phase === 3) {
      const hands = [fight.handL, fight.handR]
        .map((h, i) => ({ kind: i === 0 ? 'handL' : 'handR', unit: h }))
        .filter((x) => x.unit.targetable && !x.unit.dead && x.unit.hp > 0);
      if (!hands.length) return null;
      hands.sort((a, b) => (a.unit.hp / Math.max(1, a.unit.maxHp)) - (b.unit.hp / Math.max(1, b.unit.maxHp)));
      return hands[0];
    }
    if (fight.phase === 4) {
      if (fight.body.hp > 0 && !fight.body.invincible) return { kind: 'body', unit: fight.body };
      return null;
    }
    return null;
  }

  function showDmg(uid, dmg, crit) {
    if (typeof DamageNumber !== 'undefined') {
      DamageNumber.spawnOnMob({ uid, isBoss: true }, dmg, !!crit);
    }
  }

  function bodyRatio() {
    return fight.body.hp / Math.max(1, fight.body.maxHp);
  }

  function handsRatio() {
    const cur = fight.handL.hp + fight.handR.hp;
    const max = fight.handL.maxHp + fight.handR.maxHp;
    return cur / Math.max(1, max);
  }

  async function tryPhaseTransitions() {
    if (!fight || busy || fight.mode !== 'fight') return;
    if (isHorntail()) {
      await tryHorntailTransitions();
      return;
    }
    if (isPinkBean()) {
      await tryPinkBeanTransitions();
      return;
    }
    if (isPapulatus()) return;
    if (isSimple()) return;
    if (isZakum()) {
      await tryZakumTransitions();
      return;
    }
    const s = fight.script;

    if (fight.phase === 1 && bodyRatio() <= (s.phase2BodyHpRatio || 0.75)) {
      await enterPhase2();
      return;
    }
    if (fight.phase === 2) {
      const handsOk = handsRatio() <= (s.phase3HandsHpRatio || 0.5);
      const bodyOk = bodyRatio() <= (s.phase3BodyHpRatio || 0.5);
      if (handsOk || bodyOk) await enterPhase3();
      return;
    }
    if (fight.phase === 3) {
      if (fight.handL.dead && fight.handR.dead) await enterPhase4();
    }
  }

  async function tryZakumTransitions() {
    if (!fight || busy || fight.mode !== 'fight') return;
    if (fight.phase === 1 && allArmsDead()) {
      busy = true;
      await enterZakumBodyForm(0);
    }
  }

  function pinkBeanUnlockSet(phaseIndex) {
    const phases = fight?.script?.statuePhases || [];
    const def = phases[Math.max(0, Math.min(phases.length - 1, phaseIndex))] || {};
    return new Set((def.unlock || []).map((k) => String(k)));
  }

  function applyPinkBeanUnlock(phaseIndex) {
    if (!fight || !isPinkBean()) return [];
    const unlock = pinkBeanUnlockSet(phaseIndex);
    const newly = [];
    armList().forEach((arm) => {
      const was = !!arm.unlocked;
      const now = unlock.has(arm.key);
      arm.unlocked = now;
      if (now) {
        arm.dead = false;
        arm.targetable = true;
        arm.active = true;
        if (!was) {
          arm.hp = arm.maxHp;
          newly.push(arm);
        } else if (!(arm.hp > 0)) {
          arm.hp = arm.maxHp;
        }
        const el = slotEl(arm.key);
        if (el) {
          el.classList.remove('is-hidden-slot', 'is-dead', 'is-sealed');
          el.style.display = '';
        }
        // 已解鎖雕像維持 stand；新解鎖等 playPinkBeanStatueRegen 再播
        if (was) bindVisual(arm.key, arm.visualId, 'stand');
      } else {
        arm.targetable = false;
        arm.active = false;
        hideSlot(arm.key);
      }
    });
    return newly;
  }

  /** 只對「新解鎖」且真有多幀 regen 的雕像播一次復活 */
  async function playPinkBeanStatueRegen(arms) {
    const list = (arms || []).filter((arm) => {
      if (!arm) return false;
      if (typeof IdleMobAnim === 'undefined') return false;
      const id = pad(arm.visualId);
      if (!IdleMobAnim.resolveAction?.(id, 'regen')) return false;
      const frames = IdleMobAnim.getMobEntry?.(id)?.regen
        || (typeof IDLE_BOSS_MOB_DATA !== 'undefined' ? IDLE_BOSS_MOB_DATA[id]?.regen : null);
      // 單幀／空 regen 不當復活演出（避免與場景底座重複感）
      return Array.isArray(frames) ? frames.length > 1 : true;
    });
    if (!list.length) {
      (arms || []).forEach((arm) => bindVisual(arm.key, arm.visualId, 'stand'));
      return;
    }
    list.forEach((arm) => {
      const el = slotEl(arm.key);
      if (!el || typeof IdleMobAnim === 'undefined') return;
      el.dataset.mobId = pad(arm.visualId);
      el.dataset.introAction = 'regen';
      IdleMobAnim.bindActorSprite(el, pad(arm.visualId), 'regen');
      const img = IdleMobAnim.actorBodyImg?.(el);
      if (img) {
        img.dataset.frameAcc = '0';
        img.dataset.bodyDone = '0';
      }
    });
    await Promise.all(list.map((arm) => playAnim(arm.key, arm.visualId, 'regen')));
    list.forEach((arm) => bindVisual(arm.key, arm.visualId, 'stand'));
    (arms || []).forEach((arm) => {
      if (!list.includes(arm)) bindVisual(arm.key, arm.visualId, 'stand');
    });
  }

  function isPinkBeanFullStatuePhase(f = fight) {
    if (!isPinkBean(f)) return false;
    const keys = (f.script?.statues || []).map((s) => String(s.key || ''));
    if (!keys.length) return false;
    const unlock = pinkBeanUnlockSet(Math.floor(Number(f.statuePhaseIndex) || 0));
    return keys.every((k) => unlock.has(k));
  }

  /** 五尊齊全階段結束：並行播各雕像 die1 */
  async function playPinkBeanStatueDieAll() {
    if (!fight || !isPinkBean()) return;
    const seq = atkFxSeq;
    const statues = armList().filter((arm) => arm.unlocked && !arm.dead);
    const playable = statues.filter((arm) => {
      if (typeof IdleMobAnim === 'undefined') return false;
      return !!IdleMobAnim.resolveAction?.(pad(arm.visualId), 'die1');
    });
    if (!playable.length) {
      statues.forEach((arm) => {
        arm.dead = true;
        arm.targetable = false;
        arm.active = false;
        arm.hp = 0;
        hideSlot(arm.key);
      });
      return;
    }
    await Promise.all(playable.map((arm) => playAnim(arm.key, arm.visualId, 'die1')));
    if (seq !== atkFxSeq || !fight) return;
    statues.forEach((arm) => {
      arm.dead = true;
      arm.targetable = false;
      arm.active = false;
      arm.hp = 0;
      hideSlot(arm.key);
    });
  }

  function purgePinkBeanThrone() {
    if (!fight) return;
    // 取消進行中的王座 skill／channel，避免結束後又 bind 回 8820000
    atkFxSeq += 1;
    if (atkAcc.body) atkAcc.body = Object.create(null);
    const st = stage();
    if (!st) return;
    st.querySelectorAll('.idle-boss-part').forEach((el) => {
      const slot = el.getAttribute('data-slot') || '';
      const mobId = pad(el.getAttribute('data-mob-id') || el.dataset.mobId || '');
      if (slot === 'body' || mobId === '8820000') {
        el.style.display = 'none';
        el.remove();
      }
    });
    // 清場地上可能殘留的王座 skill effect0
    const field = getBossFieldEl?.() || document.getElementById('idleBossField');
    field?.querySelectorAll?.('.idle-skill-fx-stage--boss-effect0').forEach((n) => n.remove());
  }

  async function tryPinkBeanTransitions() {
    if (!fight || busy || fight.mode !== 'fight' || !isPinkBean()) return;
    if (pinkBeanInBodyPhase()) return;
    if (!(fight.shell && fight.shell.hp <= 0)) return;
    busy = true;
    await advancePinkBeanShell();
  }

  async function advancePinkBeanShell() {
    if (!fight || !isPinkBean()) return;
    let seq = atkFxSeq;
    const phases = fight.script.statuePhases || [];
    const cur = Math.max(0, Math.floor(Number(fight.statuePhaseIndex) || 0));
    const shellId = fight.shell?.mobId || pad(phases[cur]?.shell);
    const next = cur + 1;
    const goingToBody = next >= phases.length;
    hooks?.onTitle?.(goingToBody ? '粉豆' : '雕像解鎖');

    // 五尊齊全階段結束：先播各雕像 die1（勿先 purge，以免 atkFxSeq 打斷）
    if (goingToBody && isPinkBeanFullStatuePhase()) {
      await playPinkBeanStatueDieAll();
      if (seq !== atkFxSeq || !fight) return;
    }

    // 進本體前先下王座，避免殼 die 群體圖與 8820000 疊成兩隻粉豆
    if (goingToBody) {
      purgePinkBeanThrone();
      seq = atkFxSeq;
    }

    // 殼有 die1 就掛隱藏槽播一下（群體復活／解鎖演出）
    if (shellId && typeof IdleMobAnim !== 'undefined'
      && IdleMobAnim.resolveAction?.(shellId, 'die1')) {
      const bossPos = hooks?.getBossPos?.() || { x: 700, y: 580 };
      const st = stage();
      if (st && !slotEl('shellDie')) {
        st.insertAdjacentHTML('beforeend', `<div class="idle-actor idle-actor--mob idle-boss-part"
          data-slot="shellDie" data-uid="shellDie" data-mob-id="${shellId}"
          style="left:${bossPos.x}px;top:${bossPos.y}px;z-index:45">
          <div class="idle-actor-sprite-stage">
            <img class="idle-actor-sprite" alt="" draggable="false">
          </div>
        </div>`);
      }
      await playAnim('shellDie', shellId, 'die1');
      removeSlot('shellDie');
    }
    if (seq !== atkFxSeq || !fight) return;

    if (goingToBody) {
      await enterPinkBeanBody();
      return;
    }

    fight.statuePhaseIndex = next;
    fight.phase = 1 + next;
    fight.shell = makePinkBeanShell(fight.listId, phases[next].shell);
    const newly = applyPinkBeanUnlock(next);
    // 殼 die1 已是群體復活演出，新解鎖雕像直接 stand，不再播個人 regen
    newly.forEach((arm) => bindVisual(arm.key, arm.visualId, 'stand'));
    hooks?.onPhase?.(fight.phase);
    if (seq !== atkFxSeq || !fight) return;
    busy = false;
    syncHud();
  }

  async function enterPinkBeanBody() {
    if (!fight || !isPinkBean()) return;
    busy = true;
    hooks?.onTitle?.('粉豆');
    hooks?.onPhase?.('body');

    armList().forEach((arm) => {
      arm.dead = true;
      arm.targetable = false;
      arm.active = false;
      arm.unlocked = false;
      arm.hp = 0;
      removeSlot(arm.key);
    });

    // 再清一次王座／body，並作廢殘留 skill 回呼
    purgePinkBeanThrone();
    const seq = atkFxSeq;

    const forms = fight.script.bodyForms || [];
    const form = forms[0] || { statMob: '8820001', visualMob: '8820001' };
    const statId = pad(form.statMob);
    const visualId = pad(form.visualMob || form.statMob);
    const max = maxHpOf(fight.listId, statId);
    fight.pinkbeanBody = true;
    fight.statuePhaseIndex = (fight.script.statuePhases || []).length;
    fight.phase = 1 + fight.statuePhaseIndex;
    fight.bodyFormIndex = 0;
    fight.shell = null;
    fight.body.visualId = visualId;
    fight.body.maxHp = max;
    fight.body.hp = max;
    fight.body.invincible = false;
    fight.body.targetable = true;
    fight.body.dead = false;

    const bossPos = hooks?.getBossPos?.() || { x: 700, y: 580 };
    const st = stage();
    // 確保場上沒有舊 body 後再掛本體
    st?.querySelectorAll('.idle-boss-part[data-slot="body"]').forEach((n) => n.remove());
    if (st) {
      const z = fight.bodyZ || 20;
      st.insertAdjacentHTML('beforeend', `<div class="idle-actor idle-actor--mob idle-boss-part"
        data-slot="body" data-uid="body" data-mob-id="${visualId}"
        style="left:${bossPos.x}px;top:${bossPos.y}px;z-index:${z}">
        <div class="idle-actor-sprite-stage">
          <img class="idle-actor-sprite" alt="" draggable="false">
        </div>
      </div>`);
    }
    bindVisual('body', visualId, 'stand');
    if (seq !== atkFxSeq || !fight) return;
    busy = false;
    syncHud();
  }

  async function tryHorntailTransitions() {
    if (!fight || busy || fight.mode !== 'fight' || !isHorntail()) return;
    if (!allArmsDead()) return;
    const stages = fight.script.stages || [];
    const next = (Number(fight.stageIndex) || 0) + 1;
    if (next < stages.length) {
      await enterHorntailStage(next, { intro: true });
      return;
    }
    await onHorntailClear();
  }

  function resolveStageLayout(stageDef, fallbackBossPos) {
    const fb = fallbackBossPos || { x: 700, y: 560 };
    const bossPos = stageDef?.bossPos
      ? {
        x: Math.round(Number(stageDef.bossPos.x) || fb.x),
        y: Math.round(Number(stageDef.bossPos.y) || fb.y),
      }
      : { x: fb.x, y: fb.y };
    const playerPos = stageDef?.playerPos
      ? {
        x: Math.round(Number(stageDef.playerPos.x) || 300),
        y: Math.round(Number(stageDef.playerPos.y) || 620),
      }
      : null;
    return {
      bossPos,
      playerPos,
      playerFlipX: !!stageDef?.playerFlipX,
      mapOffset: {
        x: Math.round(Number(stageDef?.mapOffset?.x) || 0),
        y: Math.round(Number(stageDef?.mapOffset?.y) || 0),
      },
    };
  }

  function applyHorntailStageLayout(stageDef, fallbackBossPos) {
    const layout = resolveStageLayout(stageDef, fallbackBossPos);
    if (typeof hooks?.setStageLayout === 'function') {
      hooks.setStageLayout(layout);
    }
    return layout.bossPos;
  }

  async function enterHorntailStage(stageIndex, opts = {}) {
    if (!fight || !isHorntail()) return;
    const stages = fight.script.stages || [];
    if (stageIndex < 0 || stageIndex >= stages.length) return;
    const seq = atkFxSeq;
    busy = true;
    fight.stageIndex = stageIndex;
    fight.phase = stageIndex + 1;
    const stageDef = stages[stageIndex];

    if (typeof hooks?.fadeField === 'function') {
      await hooks.fadeField(1, 400);
    }
    if (seq !== atkFxSeq || !fight) return;

    armList().forEach((arm) => removeSlot(arm.key));
    removeSlot('body');

    if (stageDef.mapArt && typeof hooks?.setMapArt === 'function') {
      hooks.setMapArt(stageDef.mapArt);
    }

    fight.arms = buildHorntailParts(fight.listId, stageDef);
    hooks?.onPhase?.(fight.phase);

    const bossPos = applyHorntailStageLayout(stageDef, hooks?.getBossPos?.());
    mountInitialActors(bossPos, { skipBind: !!opts.intro });

    if (typeof hooks?.fadeField === 'function') {
      await hooks.fadeField(0, 400);
    }
    if (seq !== atkFxSeq || !fight) return;

    if (opts.intro) {
      await playHorntailIntroRegen();
      return;
    }
    busy = false;
    syncHud();
  }

  async function killHorntailPart(armKey) {
    const arm = findArm(armKey);
    if (!arm || arm.dead) return;
    arm.dead = true;
    arm.targetable = false;
    arm.active = false;
    arm.hp = 0;
    clearUnitDebuff(armKey);
    await playAnim(armKey, arm.visualId, 'die1');
    if (arm.deadSealed) {
      arm.sealed = true;
      arm.visualId = pad(arm.deadSealed);
      bindVisual(armKey, arm.visualId, 'stand');
      const el = slotEl(armKey);
      if (el) {
        el.classList.remove('is-dead', 'is-hidden-slot');
        el.style.display = '';
        el.classList.add('is-sealed');
      }
      return;
    }
    hideSlot(armKey);
  }

  function mountHorntailClearDie(bossPos, mobId) {
    const st = stage();
    if (!st || !fight) return;
    const b = bossPos || { x: 700, y: 560 };
    const id = pad(mobId);
    removeSlot('clearDie');
    st.insertAdjacentHTML('beforeend', `<div class="idle-actor idle-actor--mob idle-boss-part"
      data-slot="clearDie" data-uid="clearDie" data-mob-id="${id}"
      style="left:${b.x}px;top:${b.y}px;z-index:50">
      <div class="idle-actor-sprite-stage">
        <img class="idle-actor-sprite" alt="" draggable="false">
      </div>
    </div>`);
  }

  async function onHorntailClear() {
    if (!fight || fight.mode !== 'fight') return;
    const seq = atkFxSeq;
    busy = true;
    fight.mode = 'clear';
    hooks?.onPhase?.('clear');
    hooks?.onTitle?.('擊破');

    // 全部位清除，改播整隻死亡動畫
    armList().forEach((arm) => {
      arm.targetable = false;
      arm.active = false;
      removeSlot(arm.key);
    });
    removeSlot('body');

    const clearId = pad(fight.script.clearDieMob || '8810018');
    const bossPos = hooks?.getBossPos?.() || { x: 700, y: 560 };
    mountHorntailClearDie(bossPos, clearId);

    const hasDie = typeof IdleMobAnim !== 'undefined'
      && !!(IdleMobAnim.resolveAction?.(clearId, 'die1') || IdleMobAnim.resolveAction?.(clearId, 'die'));
    if (hasDie) {
      const dieAction = IdleMobAnim.resolveAction?.(clearId, 'die1') ? 'die1' : 'die';
      await playAnim('clearDie', clearId, dieAction);
    } else {
      await sleep(800);
    }
    if (seq !== atkFxSeq || !fight) return;
    removeSlot('clearDie');

    grantPlaceholderRewards();
    fight.mode = 'done';
    fight.rewardsGranted = true;
    busy = false;
    hooks?.onTitle?.('領獎完成');
    startExitCountdown();
    syncHud();
  }

  /** 龍王進場／換圖：各部位並行 regen（有則播） */
  async function playHorntailIntroRegen() {
    if (!fight || !isHorntail()) return;
    const seq = atkFxSeq;
    const parts = armList().map((arm) => ({
      key: arm.key,
      id: arm.visualId,
      flipX: !!arm.flipX,
    }));
    const playable = parts.filter((p) => {
      if (typeof IdleMobAnim === 'undefined') return false;
      return !!IdleMobAnim.resolveAction?.(pad(p.id), 'regen');
    });

    busy = true;
    hooks?.onTitle?.('登場');

    parts.forEach((p) => {
      const el = slotEl(p.key);
      if (!el) return;
      el.classList.remove('is-hidden-slot');
      el.style.display = '';
      el.classList.toggle('is-flip-x', !!p.flipX);
      if (playable.some((x) => x.key === p.key)) {
        if (typeof IdleMobAnim !== 'undefined') {
          el.dataset.mobId = pad(p.id);
          el.dataset.introAction = 'regen';
          IdleMobAnim.bindActorSprite(el, pad(p.id), 'regen');
          const img = IdleMobAnim.actorBodyImg?.(el);
          if (img) {
            img.dataset.frameAcc = '0';
            img.dataset.bodyDone = '0';
          }
        }
      } else {
        bindVisual(p.key, p.id, 'stand');
        el.classList.toggle('is-flip-x', !!p.flipX);
      }
    });

    if (playable.length) {
      await Promise.all(playable.map((p) => playAnim(p.key, p.id, 'regen')));
    }
    if (seq !== atkFxSeq || !fight) return;

    parts.forEach((p) => {
      bindVisual(p.key, p.id, 'stand');
      slotEl(p.key)?.classList.toggle('is-flip-x', !!p.flipX);
    });
    busy = false;
    hooks?.onPhase?.(fight.phase);
    syncHud();
  }

  async function enterZakumBodyForm(formIndex) {
    if (!fight) return;
    const forms = fight.script.bodyForms || [];
    if (formIndex < 0 || formIndex >= forms.length) return;
    busy = true;
    fight.bodyFormIndex = formIndex;
    fight.phase = isPapulatus() ? (1 + formIndex) : (2 + formIndex);
    hooks?.onPhase?.(fight.phase);

    if (formIndex === 0 && isZakum()) {
      for (const arm of armList()) {
        arm.dead = true;
        arm.targetable = false;
        arm.active = false;
        arm.hp = 0;
        removeSlot(arm.key);
      }
    }

    const form = forms[formIndex];
    const statId = pad(form.statMob);
    const visualId = pad(form.visualMob || form.statMob);
    fight.body.visualId = visualId;
    fight.body.maxHp = maxHpOf(fight.listId, statId);
    fight.body.hp = fight.body.maxHp;
    fight.body.invincible = false;
    fight.body.targetable = true;
    fight.body.dead = false;

    // 各 bodyForm 可帶 bossPos／playerPos（拉圖斯第三型等）
    let bossPos = hooks?.getBossPos?.() || { x: 720, y: 560 };
    if (form.bossPos || form.playerPos || form.playerFlipX != null || form.mapOffset) {
      bossPos = applyHorntailStageLayout(form, bossPos);
    }
    const el = slotEl('body');
    if (!el) {
      mountInitialActors(bossPos);
    } else {
      applyActorLayout(bossPos);
    }
    bindVisual('body', visualId, 'stand');
    // 換態可播 regen（有則播）
    if (typeof IdleMobAnim !== 'undefined' && IdleMobAnim.resolveAction?.(visualId, 'regen')) {
      await playAnim('body', visualId, 'regen');
      bindVisual('body', visualId, 'stand');
    }
    busy = false;
    syncHud();
  }

  async function killZakumArm(armKey) {
    const arm = findArm(armKey);
    if (!arm || arm.dead) return;
    arm.dead = true;
    arm.targetable = false;
    arm.active = false;
    arm.hp = 0;
    clearUnitDebuff(armKey);
    await playAnim(armKey, arm.visualId, 'die1');
    hideSlot(armKey);
  }

  async function onZakumBodyFormDown() {
    if (!fight || fight.mode !== 'fight' || busy) return;
    if (!(fight.body.hp <= 0)) return;
    if (!isBodyFormStyle()) return;
    const forms = fight.script.bodyForms || [];
    const next = (Number(fight.bodyFormIndex) || 0) + 1;
    busy = true;
    if (next < forms.length) {
      clearUnitDebuff('body');
      await playAnim('body', fight.body.visualId, 'die1');
      await enterZakumBodyForm(next);
      return;
    }
    // onBodyDead 會自行處理 busy
    busy = false;
    await onBodyDead();
  }

  async function enterPhase2() {
    if (!fight || busy) return;
    busy = true;
    fight.phase = 2;
    hooks?.onPhase?.(2);
    const s = fight.script;
    if (s.handL.sealed) {
      await playAnim('handL', s.handL.sealed, 'die1');
    }
    fight.handL.visualId = pad(s.handL.active);
    fight.handL.targetable = true;
    fight.handL.active = true;
    fight.handL.hp = fight.handL.maxHp;
    fight.handL.dead = false;
    bindVisual('handL', fight.handL.visualId, 'stand');

    fight.handR.targetable = true;
    fight.handR.active = true;
    fight.handR.dead = false;
    if (fight.handR.hp <= 0) fight.handR.hp = fight.handR.maxHp;
    bindVisual('handR', fight.handR.visualId, 'stand');
    busy = false;
    syncHud();
  }

  async function enterPhase3() {
    if (!fight || busy) return;
    busy = true;
    fight.phase = 3;
    hooks?.onPhase?.(3);
    const s = fight.script;
    fight.body.visualId = pad(s.headVisualMob);
    fight.body.invincible = true;
    bindVisual('body', fight.body.visualId, 'stand');
    await playAnim('body', fight.body.visualId, 'skill16');
    bindVisual('body', fight.body.visualId, 'stand');
    // 確保雙手可打
    fight.handL.targetable = !fight.handL.dead;
    fight.handR.targetable = !fight.handR.dead;
    fight.handL.active = !fight.handL.dead;
    fight.handR.active = !fight.handR.dead;
    busy = false;
    syncHud();
  }

  async function sealHand(handKey) {
    const hand = fight[handKey];
    const s = fight.script[handKey === 'handL' ? 'handL' : 'handR'];
    if (!hand || hand.dead) return;
    hand.dead = true;
    hand.targetable = false;
    hand.active = false;
    hand.hp = 0;
    clearUnitDebuff(handKey);
    await playAnim(handKey, hand.visualId, 'die1');
    hand.visualId = pad(s.deadSealed);
    bindVisual(handKey, hand.visualId, 'stand');
    const el = slotEl(handKey);
    if (el) {
      el.classList.remove('is-dead');
      el.classList.add('is-sealed');
    }
  }

  async function enterPhase4() {
    if (!fight || busy) return;
    busy = true;
    fight.phase = 4;
    hooks?.onPhase?.(4);
    const s = fight.script;
    fight.body.visualId = pad(s.bodyStatMob);
    fight.body.invincible = false;
    fight.body.targetable = true;
    bindVisual('body', fight.body.visualId, 'stand');
    await playAnim('body', fight.body.visualId, 'skill16');
    bindVisual('body', fight.body.visualId, 'stand');
    // 雙手封印殘骸不可打
    fight.handL.targetable = false;
    fight.handR.targetable = false;
    fight.handL.active = false;
    fight.handR.active = false;
    slotEl('handL')?.classList.add('is-sealed');
    slotEl('handR')?.classList.add('is-sealed');
    slotEl('handL')?.classList.remove('is-dead');
    slotEl('handR')?.classList.remove('is-dead');
    busy = false;
    syncHud();
  }

  function stopSustainCombat() {
    try { SkillCombat.stopSustainChannel?.(); } catch (_) { /* ignore */ }
  }

  async function onBodyDead() {
    if (!fight || fight.mode !== 'fight') return;
    busy = true;
    stopSustainCombat();
    fight.mode = 'clear';
    hooks?.onPhase?.('clear');
    // 死亡動畫開始前就移除手臂／封印雙手（勿等 die1 播完）
    if (isZakum() || isPinkBean()) {
      armList().forEach((arm) => {
        removeSlot(arm.key);
        arm.dead = true;
        arm.targetable = false;
        arm.active = false;
      });
      // 粉豆 0019–23：本體 die 期間仍常駐，轉場噴掉落時再清
    } else if (isCygnus()) {
      if (fight.guardian) {
        removeSlot('guardian');
        fight.guardian.dead = true;
        fight.guardian.targetable = false;
        fight.guardian.active = false;
      }
      if (fight.escort) {
        removeSlot('escort');
        fight.escort.dead = true;
        fight.escort.targetable = false;
        fight.escort.active = false;
        fight.escort = null;
      }
      clearCygnusBodySleepHold();
      fight.cygnusSleep = false;
    } else if (!isBodyOnly()) {
      removeSlot('handL');
      removeSlot('handR');
      if (fight.handL) {
        fight.handL.dead = true;
        fight.handL.targetable = false;
        fight.handL.active = false;
      }
      if (fight.handR) {
        fight.handR.dead = true;
        fight.handR.targetable = false;
        fight.handR.active = false;
      }
    }
    clearUnitDebuff('body');
    const bodyVisual = isBodyFormStyle()
      ? (currentBodyForm()?.visualMob || currentBodyForm()?.statMob || fight.body.visualId)
      : (fight.script.bodyStatMob || fight.body.visualId);
    await playAnim('body', bodyVisual, 'die1');
    hideSlot('body');

    const chestId = fight.script.chestMob ? pad(fight.script.chestMob) : '';
    if (!chestId) {
      // 無寶箱：轉場時清場景裝飾並噴掉落
      if (isPinkBean()) {
        sceneryList().forEach((prop) => removeSlot(prop.key));
        if (fight.scenery) fight.scenery = [];
      }
      if (typeof hooks?.fadeField === 'function') {
        await hooks.fadeField(1, 400);
        await hooks.fadeField(0, 400);
      }
      grantPlaceholderRewards();
      fight.mode = 'done';
      fight.rewardsGranted = true;
      busy = false;
      hooks?.onTitle?.('領獎完成');
      startExitCountdown();
      syncHud();
      return;
    }

    // 過圖黑屏：本體消失 → 換獎勵箱
    if (typeof hooks?.fadeField === 'function') {
      await hooks.fadeField(1, 500);
    } else {
      await sleep(500);
    }
    const chestHp = maxHpOf(fight.listId, chestId);
    fight.chest = {
      key: 'chest',
      uid: 'chest',
      isBoss: true,
      visualId: chestId,
      hp: chestHp,
      maxHp: chestHp,
      targetable: true,
      invincible: false,
    };
    const boss = hooks?.getBossPos?.() || { x: 620, y: 605 };
    // 不可 applyActorLayout：會把已 hide 的本體／手又 bind 出來
    mountChestOnly(boss);
    bindVisual('chest', fight.chest.visualId, 'regen');
    if (typeof hooks?.fadeField === 'function') {
      await hooks.fadeField(0, 500);
    }
    await sleep(IdleMobAnim?.actionDurationMs?.(fight.chest.visualId, 'regen') || 500);
    bindVisual('chest', fight.chest.visualId, 'stand');
    hideSlot('body');
    busy = false;
    syncHud();
    hooks?.onTitle?.('獎勵箱');
  }

  function grantPlaceholderRewards() {
    if (!fight || fight._dropSpawned) return;
    fight._dropSpawned = true;
    const rows = rewardDropRows();
    if (!rows.length) return;
    const origin = hooks?.getBossPos?.() || { x: 620, y: 605 };
    if (typeof ItemDropController !== 'undefined' && ItemDropController.spawnBatch) {
      hooks?.ensureDrops?.();
      ItemDropController.spawnBatch({
        origin: { x: origin.x, y: origin.y },
        groundY: origin.y,
        rows,
        lootDelaySec: 2.5,
      });
      return;
    }
    // fallback：無掉落控制器時直接入包
    rows.forEach((row) => {
      if (typeof InventoryModule === 'undefined') return;
      InventoryModule.applyIdleDrop?.(row, { silent: true, logTag: 'BOSS' });
    });
  }

  function rewardDropRows() {
    const rows = activeDiff?.rewards || fight?.script?.rewards || [];
    return rows.map((row) => {
      const amount = Math.max(1, Math.floor(Number(row.amount) || 1));
      const itemId = String(row.itemId || '').trim();
      const chanceRaw = Number(row.chance);
      const chance = Number.isFinite(chanceRaw) ? chanceRaw : 100;
      if (!(chance > 0) || Math.random() * 100 >= chance) return null;
      const out = {
        kind: row.kind,
        itemId,
        amount,
        name: row.name || itemId,
      };
      if (row.consumeType) out.consumeType = row.consumeType;
      // 藥水 id 補上 consumeType，icon／入包才吃得到
      if (out.kind === 'consume' && !out.consumeType
        && typeof IdlePotionStore !== 'undefined'
        && IdlePotionStore.isPotionId?.(itemId)) {
        out.consumeType = 'potion';
      }
      return out;
    }).filter((r) => r && r.itemId && r.kind);
  }

  function startExitCountdown() {
    stopExitCountdown();
    exitLeftSec = Math.max(1, Math.floor(Number(fight?.script?.exitSec) || 30));
    // 優先交給宿主用 IdleUiTimer 顯示／倒數並在歸零時關場
    if (typeof hooks?.onExitStart === 'function') {
      hooks.onExitStart(exitLeftSec);
      return;
    }
    hooks?.onExitTick?.(exitLeftSec);
    exitTimer = window.setInterval(() => {
      exitLeftSec -= 1;
      hooks?.onExitTick?.(exitLeftSec);
      if (exitLeftSec <= 0) {
        clearExitCountdown();
        hooks?.onFightEnd?.('timeout');
      }
    }, 1000);
  }

  function stopExitCountdown() {
    if (exitTimer != null) {
      window.clearInterval(exitTimer);
      exitTimer = null;
    }
  }

  function clearExitCountdown() {
    stopExitCountdown();
    exitLeftSec = 0;
    hooks?.onExitStop?.();
  }

  async function onChestDead() {
    // 防重入：die 動畫 await 期間 flashDie／onMobStateSync 可能再叫一次 → 獎勵翻倍
    if (!fight?.chest || fight.mode === 'done' || fight.rewardsGranted || busy) return;
    busy = true;
    fight.rewardsGranted = true;
    const chestVisual = fight.chest.visualId;
    fight.chest = null;
    await playAnim('chest', chestVisual, 'die');
    hideSlot('chest');
    grantPlaceholderRewards();
    fight.mode = 'done';
    busy = false;
    hooks?.onTitle?.('領獎完成');
    startExitCountdown();
    syncHud();
  }

  /**
   * 單次傷害上限：不超過「推到下一階段所需」的傷害，避免秒殺跳過轉場動畫。
   * busy（轉場中）時一律 0。
   */
  function maxDamageAllowed(unit) {
    if (!fight || !unit || busy) return 0;
    const kind = unit.uid || unit.key;
    const s = fight.script;
    const hp = Math.max(0, Math.floor(Number(unit.hp) || 0));
    if (!(hp > 0)) return 0;

    if (fight.mode === 'clear' && kind === 'chest') return hp;
    if (fight.mode !== 'fight') return 0;

    if (isHorntail()) {
      if (findArm(kind)) return hp;
      return 0;
    }

    if (isPinkBean()) {
      if (pinkBeanInBodyPhase()) {
        if (kind === 'body') return hp;
        return 0;
      }
      if (findArm(kind) && fight.shell) {
        // 可超過雕像當前血，實際鏡像打殼；雕像保底在 applyDamage／afterExternalHits
        const shellHp = Math.max(0, Math.floor(Number(fight.shell.hp) || 0));
        return Math.max(hp, shellHp);
      }
      return 0;
    }

    if (isPapulatus() || isSimple()) {
      if (kind === 'body') return hp;
      return 0;
    }

    if (isCygnus()) {
      if (kind === 'escort' || kind === 'guardian') return hp;
      if (kind === 'body') {
        if (cygnusSleeping() || fight.body.invincible) return 0;
        const ratios = fight.script.lockHpRatios || [];
        const idx = Math.max(0, Math.floor(Number(fight.lockIndex) || 0));
        if (idx < ratios.length) {
          const floor = Math.max(1, Math.ceil(unit.maxHp * Number(ratios[idx])));
          return Math.max(0, hp - floor);
        }
        return hp;
      }
      return 0;
    }

    if (isZakum()) {
      // 臂／本體各態都允許打到 0，轉場由死亡回呼處理
      if (kind === 'body' || findArm(kind)) return hp;
      return 0;
    }

    if (fight.phase === 1 && kind === 'body') {
      const floor = Math.max(1, Math.ceil(unit.maxHp * (s.phase2BodyHpRatio || 0.75)));
      return Math.max(0, hp - floor);
    }
    if (fight.phase === 2) {
      if (kind === 'body') {
        const floor = Math.max(1, Math.ceil(unit.maxHp * (s.phase3BodyHpRatio || 0.5)));
        return Math.max(0, hp - floor);
      }
      if (kind === 'handL' || kind === 'handR') {
        const maxSum = fight.handL.maxHp + fight.handR.maxHp;
        const curSum = fight.handL.hp + fight.handR.hp;
        const thresh = maxSum * (s.phase3HandsHpRatio || 0.5);
        return Math.max(0, Math.ceil(curSum - thresh));
      }
    }
    if (fight.phase === 3 && (kind === 'handL' || kind === 'handR')) {
      // 剛好打到 0，讓 sealHand die1 能播
      return hp;
    }
    if (fight.phase === 4 && kind === 'body') return hp;
    return hp;
  }

  function capIncomingDamage(mob, dmg) {
    const raw = Math.max(0, Math.floor(Number(dmg) || 0));
    if (!mob) return raw;
    return Math.min(raw, maxDamageAllowed(mob));
  }

  function applyDamage(target, rawDmg, isCritical) {
    if (!target?.unit || busy) return;
    let dmg = Math.floor(rawDmg);
    if (target.unit.invincible) dmg = 0;
    dmg = capIncomingDamage(target.unit, dmg);
    if (!(dmg > 0)) {
      showDmg(target.unit.key, 0, false);
      return;
    }
    target.unit.hp = Math.max(0, target.unit.hp - dmg);
    showDmg(target.unit.key, dmg, isCritical);

    if (isPinkBean() && !pinkBeanInBodyPhase() && findArm(target.kind) && fight.shell) {
      // 雕像階段：傷害鏡像扣殼；雕像自身血量保底 1，避免殼未空就全滅
      fight.shell.hp = Math.max(0, fight.shell.hp - dmg);
      if (fight.shell.hp > 0 && target.unit.hp <= 0) {
        target.unit.hp = 1;
      }
    }

    syncHud();

    if (target.kind === 'chest' && target.unit.hp <= 0) {
      onChestDead();
      return;
    }

    if (isPinkBean()) {
      if (pinkBeanInBodyPhase()) {
        if (target.kind === 'body' && target.unit.hp <= 0) {
          onBodyDead();
        }
        return;
      }
      if (fight.shell && fight.shell.hp <= 0) {
        tryPhaseTransitions();
      }
      return;
    }

    if (isHorntail()) {
      if (findArm(target.kind) && target.unit.hp <= 0) {
        killHorntailPart(target.kind).then(() => tryPhaseTransitions());
        return;
      }
      tryPhaseTransitions();
      return;
    }

    if (isPapulatus()) {
      if (target.kind === 'body' && target.unit.hp <= 0) {
        onZakumBodyFormDown();
        return;
      }
      return;
    }

    if (isSimple()) {
      if (target.kind === 'body' && target.unit.hp <= 0) {
        onBodyDead();
      }
      return;
    }

    if (isCygnus()) {
      if (target.kind === 'guardian' && target.unit.hp <= 0) {
        killCygnusCompanion('guardian');
        return;
      }
      if (target.kind === 'escort' && target.unit.hp <= 0) {
        onCygnusEscortDead();
        return;
      }
      if (target.kind === 'body' && target.unit.hp <= 0) {
        onBodyDead();
        return;
      }
      tryCygnusHpLock();
      return;
    }

    if (isZakum()) {
      if (findArm(target.kind) && target.unit.hp <= 0) {
        killZakumArm(target.kind).then(() => tryPhaseTransitions());
        return;
      }
      if (target.kind === 'body' && target.unit.hp <= 0) {
        onZakumBodyFormDown();
        return;
      }
      tryPhaseTransitions();
      return;
    }

    if (target.kind === 'handL' || target.kind === 'handR') {
      if (target.unit.hp <= 0 && fight.phase === 3) {
        sealHand(target.kind).then(() => tryPhaseTransitions());
        return;
      }
      if (target.unit.hp <= 0) {
        target.unit.dead = true;
        target.unit.targetable = false;
        target.unit.active = false;
        slotEl(target.kind)?.classList.add('is-dead');
      }
    }
    if (target.kind === 'body' && target.unit.hp <= 0) {
      if (fight.phase === 4) {
        onBodyDead();
        return;
      }
      // 一擊／過量傷害：鎖在 1 血並推進階段，避免跳過腳本
      target.unit.hp = 1;
    }
    tryPhaseTransitions();
  }

  function attackDelaySec() {
    if (typeof IdleHunt !== 'undefined' && IdleHunt.getAttackDelaySec) {
      return Math.max(0.03, Number(IdleHunt.getAttackDelaySec()) || 0.36);
    }
    return 0.36;
  }

  function rollHit() {
    if (typeof UiCharacterInfo !== 'undefined' && UiCharacterInfo.rollHuntHit) {
      return UiCharacterInfo.rollHuntHit(true);
    }
    return { dmg: 0, isCritical: false };
  }

  function getCombatMobs() {
    if (!fight) return [];
    if (fight.mode === 'clear' && fight.chest && fight.chest.hp > 0) {
      return [fight.chest];
    }
    if (fight.mode !== 'fight') return [];
    const out = [];
    const pushIf = (unit) => {
      if (!unit || unit.dead || unit.hp <= 0) return;
      if (!unit.targetable || unit.invincible) return;
      out.push(unit);
    };
    if (isHorntail()) {
      armList().forEach(pushIf);
      return out;
    }
    if (isPinkBean()) {
      if (pinkBeanInBodyPhase()) {
        pushIf(fight.body);
      } else {
        armList().filter((a) => a.unlocked).forEach(pushIf);
      }
      return out;
    }
    if (isCygnus()) {
      if (fight.escort) pushIf(fight.escort);
      if (fight.guardian) pushIf(fight.guardian);
      if (!cygnusSleeping()) pushIf(fight.body);
      return out;
    }
    if (isPapulatus() || isSimple()) {
      pushIf(fight.body);
      return out;
    }
    if (isZakum()) {
      if (fight.phase === 1) {
        armList().forEach(pushIf);
      } else {
        pushIf(fight.body);
      }
      return out;
    }
    if (fight.phase === 1) {
      pushIf(fight.body);
    } else if (fight.phase === 2) {
      pushIf(fight.handL);
      pushIf(fight.handR);
      pushIf(fight.body);
    } else if (fight.phase === 3) {
      pushIf(fight.handL);
      pushIf(fight.handR);
    } else if (fight.phase === 4) {
      pushIf(fight.body);
    }
    return out;
  }

  function afterExternalHits(mobs) {
    // 與狩獵 applySkillMobStateSync 同一契約：傳入為碰過的單位，生死／轉階依實際狀態判定
    const list = Array.isArray(mobs) ? mobs : (mobs ? [mobs] : getCombatMobs());
    if (isPinkBean()) {
      list.forEach((mob) => {
        if (!mob || !fight) return;
        const kind = mob.uid || mob.key;
        if (kind === 'chest' && mob.hp <= 0) {
          if (!busy && fight.chest && !fight.rewardsGranted) onChestDead();
          return;
        }
        if (pinkBeanInBodyPhase()) {
          if (kind === 'body' && mob.hp <= 0 && fight.mode === 'fight') {
            onBodyDead();
          }
          return;
        }
        // 技能／外部傷害：同樣鏡像扣殼並保底雕像 1 血
        if (findArm(kind) && fight.shell && !busy) {
          // 外部路徑已直接改 mob.hp；補齊殼損（以本次掉血難以追，改為若殼尚在則保底）
          if (fight.shell.hp > 0 && mob.hp <= 0) mob.hp = 1;
        }
      });
      if (!pinkBeanInBodyPhase() && fight.shell && fight.shell.hp <= 0) {
        tryPhaseTransitions();
      }
      syncHud();
      return;
    }
    if (isHorntail()) {
      list.forEach((mob) => {
        if (!mob || !fight) return;
        const kind = mob.uid || mob.key;
        if (kind === 'chest' && mob.hp <= 0) {
          if (!busy && fight.chest && !fight.rewardsGranted) onChestDead();
          return;
        }
        if (findArm(kind) && mob.hp <= 0 && !mob.dead) {
          killHorntailPart(kind).then(() => tryPhaseTransitions());
        }
      });
      tryPhaseTransitions();
      syncHud();
      return;
    }
    if (isPapulatus()) {
      list.forEach((mob) => {
        if (!mob || !fight) return;
        const kind = mob.uid || mob.key;
        if (kind === 'chest' && mob.hp <= 0) {
          if (!busy && fight.chest && !fight.rewardsGranted) onChestDead();
          return;
        }
        if (kind === 'body' && mob.hp <= 0 && fight.mode === 'fight') {
          onZakumBodyFormDown();
        }
      });
      syncHud();
      return;
    }
    if (isSimple()) {
      list.forEach((mob) => {
        if (!mob || !fight) return;
        const kind = mob.uid || mob.key;
        if (kind === 'chest' && mob.hp <= 0) {
          if (!busy && fight.chest && !fight.rewardsGranted) onChestDead();
          return;
        }
        if (kind === 'body' && mob.hp <= 0 && fight.mode === 'fight') {
          onBodyDead();
        }
      });
      syncHud();
      return;
    }
    if (isCygnus()) {
      list.forEach((mob) => {
        if (!mob || !fight) return;
        const kind = mob.uid || mob.key;
        if (kind === 'chest' && mob.hp <= 0) {
          if (!busy && fight.chest && !fight.rewardsGranted) onChestDead();
          return;
        }
        if (kind === 'guardian' && mob.hp <= 0 && !mob.dead) {
          killCygnusCompanion('guardian');
          return;
        }
        if (kind === 'escort' && mob.hp <= 0 && !mob.dead) {
          onCygnusEscortDead();
          return;
        }
        if (kind === 'body' && mob.hp <= 0 && fight.mode === 'fight') {
          onBodyDead();
        }
      });
      tryCygnusHpLock();
      syncHud();
      return;
    }
    if (isZakum()) {
      list.forEach((mob) => {
        if (!mob || !fight) return;
        const kind = mob.uid || mob.key;
        if (kind === 'chest' && mob.hp <= 0) {
          if (!busy && fight.chest && !fight.rewardsGranted) onChestDead();
          return;
        }
        if (findArm(kind) && mob.hp <= 0 && !mob.dead) {
          killZakumArm(kind).then(() => tryPhaseTransitions());
          return;
        }
        if (kind === 'body' && mob.hp <= 0 && fight.mode === 'fight') {
          onZakumBodyFormDown();
        }
      });
      tryPhaseTransitions();
      syncHud();
      return;
    }
    list.forEach((mob) => {
      if (!mob || !fight) return;
      const kind = mob.uid || mob.key;
      if (kind === 'body' && mob.hp <= 0 && fight.phase < 4 && fight.mode === 'fight') {
        mob.hp = 1;
      }
    });
    // 死亡／封印
    list.forEach((mob) => {
      if (!mob || !fight) return;
      const kind = mob.uid || mob.key;
      if (kind === 'chest' && mob.hp <= 0) {
        if (!busy && fight.chest && !fight.rewardsGranted) onChestDead();
        return;
      }
      if ((kind === 'handL' || kind === 'handR') && mob.hp <= 0 && fight.phase === 3 && !mob.dead) {
        sealHand(kind).then(() => tryPhaseTransitions());
        return;
      }
      if ((kind === 'handL' || kind === 'handR') && mob.hp <= 0 && fight.phase === 2) {
        mob.dead = true;
        mob.targetable = false;
        mob.active = false;
        clearUnitDebuff(kind);
        slotEl(kind)?.classList.add('is-dead');
      }
      if (kind === 'body' && mob.hp <= 0 && fight.phase === 4 && fight.mode === 'fight') {
        onBodyDead();
      }
    });
    tryPhaseTransitions();
    syncHud();
  }

  function showMobDamage(mob, dmg, isCritical, opts) {
    if (typeof DamageNumber === 'undefined') return;
    const shown = capIncomingDamage(mob, dmg);
    if (!(shown > 0) && !(Number(dmg) > 0)) return;
    if (isPinkBean() && !pinkBeanInBodyPhase() && fight?.shell && shown > 0) {
      const kind = mob?.uid || mob?.key;
      if (findArm(kind)) {
        fight.shell.hp = Math.max(0, fight.shell.hp - shown);
      }
    }
    DamageNumber.spawnOnMob(mob, shown > 0 ? shown : 0, !!isCritical, opts || {});
  }

  function combatCtx(extra = {}) {
    const fieldEl = document.getElementById('idleBossField');
    const playerEl = fieldEl?.querySelector('.idle-actor--player')
      || document.getElementById('idleBossStagePlayer')?.querySelector('.idle-actor--player');
    const facingRight = playerEl ? !playerEl.classList.contains('is-flip-x') : true;
    return {
      mobs: getCombatMobs(),
      getMobs: () => getCombatMobs(),
      playerEl,
      fieldEl,
      facingRight,
      showMobDamage,
      flashHit: () => {},
      flashDie: (_uid, mob) => afterExternalHits(mob),
      onMobStateSync: (kills) => afterExternalHits(kills),
      onProjectileResolve: (kills) => afterExternalHits(kills),
      ...extra,
    };
  }

  function wzAttackSpeed() {
    if (typeof IdleHunt !== 'undefined' && IdleHunt.getWzAttackSpeed) {
      return IdleHunt.getWzAttackSpeed();
    }
    return 5;
  }

  function tickPlayer(dt) {
    if (!fight || busy) return;
    if (fight.mode === 'done') return;
    if (typeof SkillBuffRuntime !== 'undefined') {
      SkillBuffRuntime.tick?.(undefined, combatCtx());
    }
    if (typeof SkillMobStatus !== 'undefined') {
      SkillMobStatus.tick?.(undefined, combatCtx(), dt);
    }

    playerAtkAcc += dt;
    const delay = attackDelaySec();
    let hits = 0;
    while (playerAtkAcc >= delay && hits < 10) {
      if (typeof IdleHunt !== 'undefined' && IdleHunt.isPlayerDead?.()) break;

      // 先選招：持續引導期間仍可挑有 CD 的昇龍等打斷
      const picked = typeof SkillCombat !== 'undefined'
        ? SkillCombat.pickNextCast?.({ wzAttackSpeed: wzAttackSpeed() })
        : null;

      if (picked) {
        hits += 1;
        const result = SkillCombat.cast(picked, combatCtx({
          wzAttackSpeed: wzAttackSpeed(),
          attackSpeedStage: wzAttackSpeed(),
        }));
        playerAtkAcc = 0;
        if (result?.cast) afterExternalHits(getCombatMobs());
        hooks?.syncOverlay?.();
        break;
      }

      if (typeof SkillCombat !== 'undefined'
        && (SkillCombat.isCastLocked?.() || SkillCombat.hasActiveSustain?.())) {
        break;
      }

      const target = pickTarget();
      if (!target) break;
      playerAtkAcc -= delay;
      hits += 1;
      if (typeof Paperdoll !== 'undefined') Paperdoll.playHuntSwing?.(delay * 1000);
      const hit = rollHit();
      let dmg = Number(hit.dmg) || 0;
      if (typeof SkillMobStatus !== 'undefined'
        && typeof SkillMobStatus.applyOutgoingDamageMods === 'function') {
        dmg = SkillMobStatus.applyOutgoingDamageMods(target.unit, dmg);
      }
      if (typeof IdleHunt !== 'undefined' && IdleHunt.resolveMobHitDamage) {
        dmg = IdleHunt.resolveMobHitDamage(target.unit, dmg);
      } else if (typeof IdleHunt !== 'undefined' && IdleHunt.isOneHitKill?.()) {
        dmg = Math.max(dmg, target.unit.hp);
        dmg = capIncomingDamage(target.unit, dmg);
      }
      if (!(dmg > 0) && !target.unit.invincible) break;
      applyDamage(target, dmg, !!hit.isCritical);
      if (typeof SkillMobStatus !== 'undefined'
        && typeof SkillMobStatus.afterPlayerDamagedMob === 'function') {
        SkillMobStatus.afterPlayerDamagedMob(target.unit, true);
      }
      if (busy) break;
    }
    hooks?.syncOverlay?.();
  }

  function unitAttacks(listId, visualOrStatMob) {
    const part = wzPart(listId, visualOrStatMob);
    const mobId = pad(visualOrStatMob);
    const out = [];
    const seen = new Set();
    const pushUnique = (row) => {
      const key = row?.actionKey;
      if (!key || seen.has(key)) return;
      seen.add(key);
      out.push(row);
    };

    // 引導技：有 repeatFrameTime 的 skillN → skillN+1 為收招
    // 拉圖斯鬧鐘改為休眠失敗懲罰，不進一般輪轉
    const channelByAction = Object.create(null);
    const endActionKeys = new Set();
    const failChannelKeys = new Set();
    const mobEntry = (typeof IDLE_BOSS_MOB_DATA !== 'undefined' ? IDLE_BOSS_MOB_DATA : null)?.[mobId]
      || (typeof IdleMobAnim !== 'undefined' ? IdleMobAnim.getMobEntry?.(mobId) : null);
    const metaRoot = mobEntry?._meta || null;
    if (metaRoot) {
      Object.keys(metaRoot).forEach((actionKey) => {
        if (!/^skill\d+$/i.test(actionKey)) return;
        const repMs = Number(metaRoot[actionKey]?.repeatFrameTime) || 0;
        if (!(repMs > 0)) return;
        const n = Math.max(1, Math.floor(Number(String(actionKey).replace(/\D/g, '')) || 1));
        const endKey = `skill${n + 1}`;
        channelByAction[actionKey] = {
          actionKey,
          endActionKey: endKey,
          repeatFrameIdx: Math.max(0, Math.floor(Number(metaRoot[actionKey]?.repeatFrameIdx) || 0)),
          repeatFrameTimeMs: repMs,
          // 鬧鐘 DoT：提高頻率
          tickMs: 400,
          tickDmgRatio: 0.4,
        };
        endActionKeys.add(endKey);
      });
    }

    const sleepCfgRoot = fight?.script?.sleepSkills || phaseScript(listId)?.sleepSkills || {};
    Object.keys(sleepCfgRoot).forEach((id) => {
      const fc = sleepCfgRoot[id]?.failChannelKey;
      if (fc) failChannelKeys.add(String(fc));
    });
    const sleepCfg = sleepCfgRoot[mobId] || sleepCfgRoot[String(Number(mobId))] || null;

    (part?.attacks || []).forEach((a) => pushUnique(a));
    (part?.skills || []).forEach((sk) => {
      const n = Math.max(1, Math.floor(Number(sk.action) || 1));
      const actionKey = `skill${n}`;
      if (endActionKeys.has(actionKey)) return;
      // 懲罰用引導技：不進一般輪轉
      if (failChannelKeys.has(actionKey) || channelByAction[actionKey]) return;
      if (part?.skillAnimMs && !(Number(part.skillAnimMs[actionKey]) > 0)) {
        return;
      }
      const sleep = (sleepCfg && sleepCfg.actionKey === actionKey)
        ? {
          actionKey,
          cdSec: Math.max(1, Number(sleepCfg.cdSec) || 60),
          windowSec: Math.max(1, Number(sleepCfg.windowSec) || 10),
          breakHpRatio: Math.max(0.001, Number(sleepCfg.breakHpRatio) || 0.05),
          failHealRatio: Math.max(0, Number(sleepCfg.failHealRatio) || 0.1),
          failChannelKey: sleepCfg.failChannelKey ? String(sleepCfg.failChannelKey) : '',
        }
        : null;
      let animMs = Number(part?.skillAnimMs?.[actionKey]) || 2000;
      if (sleep) animMs = Math.max(animMs, sleep.cdSec * 1000);
      const dmg = Math.max(0, Number(part?.MADamage) || Number(part?.PADamage) || 0);
      pushUnique({
        actionKey,
        dmg,
        animMs,
        magic: true,
        sleep: sleep || undefined,
      });
    });
    const exclude = new Set(
      (fight?.script?.excludeActions || phaseScript(listId)?.excludeActions || [])
        .map((k) => String(k || '')),
    );
    if (exclude.size) {
      return out.filter((row) => !exclude.has(String(row?.actionKey || '')));
    }
    if (out.length) return out;

    // 8830003：用 skillAnimMs + MADamage 組 skill1
    if (pad(visualOrStatMob) === '8830003' || part?.skillAnimMs?.skill1) {
      const src = part || wzPart(listId, fight?.script?.bodyStatMob);
      const dmg = Math.max(0, Number(src?.MADamage) || Number(src?.PADamage) || 0);
      const animMs = Number(part?.skillAnimMs?.skill1) || 2280;
      return [{ actionKey: 'skill1', dmg, animMs, magic: true }];
    }
    return [];
  }

  function flashAttack(slotKey, mobId, action) {
    const el = slotEl(slotKey);
    if (!el || typeof IdleMobAnim === 'undefined') return false;
    const id = pad(mobId);
    el.dataset.mobId = id;
    return !!IdleMobAnim.flashActorAttack(el, action, {
      iconId: id,
      scaleDelayMs,
    });
  }

  function getBossPlayerEl() {
    const field = document.getElementById('idleBossField');
    return field?.querySelector?.('.idle-actor--player')
      || document.getElementById('idleBossStagePlayer')?.querySelector?.('.idle-actor--player')
      || null;
  }

  function getBossFieldEl() {
    return document.getElementById('idleBossField');
  }

  function hurtPlayerFromBoss(slotKey, dmg) {
    const amount = Math.max(0, Math.floor(Number(dmg) || 0));
    if (!(amount > 0)) return;
    if (typeof IdleHunt !== 'undefined' && IdleHunt.applyPlayerDamage) {
      IdleHunt.applyPlayerDamage(amount, {
        mobLevel: 70,
        isBoss: true,
        mob: { uid: slotKey, isBoss: true },
      });
    }
    hooks?.syncPlayerHp?.();
  }

  function scheduleBossAtkFx(delayMs, fn) {
    const seq = atkFxSeq;
    const run = () => {
      if (seq !== atkFxSeq || !fight || fight.mode !== 'fight') return;
      fn();
    };
    const ms = scaleDelayMs(Math.max(0, Number(delayMs) || 0));
    if (ms > 0) window.setTimeout(run, ms);
    else run();
  }

  function buildChannelAttack(listId, mobId, actionKey) {
    const id = pad(mobId);
    const key = String(actionKey || '');
    if (!key) return null;
    const part = wzPart(listId, id);
    const mobEntry = (typeof IDLE_BOSS_MOB_DATA !== 'undefined' ? IDLE_BOSS_MOB_DATA : null)?.[id]
      || (typeof IdleMobAnim !== 'undefined' ? IdleMobAnim.getMobEntry?.(id) : null);
    const meta = mobEntry?._meta?.[key];
    const repMs = Number(meta?.repeatFrameTime) || 0;
    if (!(repMs > 0)) return null;
    const n = Math.max(1, Math.floor(Number(String(key).replace(/\D/g, '')) || 1));
    const endKey = `skill${n + 1}`;
    const dmg = Math.max(0, Number(part?.MADamage) || Number(part?.PADamage) || 0);
    const endAnim = Number(part?.skillAnimMs?.[endKey]) || 0;
    return {
      actionKey: key,
      dmg,
      animMs: repMs + endAnim,
      magic: true,
      channel: {
        actionKey: key,
        endActionKey: endKey,
        repeatFrameIdx: Math.max(0, Math.floor(Number(meta?.repeatFrameIdx) || 0)),
        repeatFrameTimeMs: repMs,
        tickMs: 400,
        tickDmgRatio: 0.4,
      },
    };
  }

  /**
   * 休眠／裂縫判定：播招 →（sleep 或 stand）等待傷量；成功 wakeup；失敗回血＋鬧鐘引導。
   * 裂縫技 CD 整段（含失敗引導）結束後才開始累積。
   */
  async function runSleepMechanic(slotKey, unit, atk) {
    if (!fight || !unit || !atk?.sleep) return;
    const el = slotEl(slotKey);
    if (!el || typeof IdleMobAnim === 'undefined') return;
    const seq = atkFxSeq;
    const iconId = pad(unit.visualId);
    const cfg = atk.sleep;
    const sleepKey = atk.actionKey;
    const windowMs = scaleDelayMs(Math.max(1000, (Number(cfg.windowSec) || 10) * 1000));
    const need = Math.max(1, Math.floor((Number(unit.maxHp) || 1) * (Number(cfg.breakHpRatio) || 0.05)));
    const hasSleep = !!IdleMobAnim.resolveAction?.(iconId, 'sleep');
    const hasWakeup = !!IdleMobAnim.resolveAction?.(iconId, 'wakeup');

    // 鎖定裂縫技 CD：流程／引導結束前不累積
    fight.sleepCdHold = { slotKey, actionKey: sleepKey };
    if (atkAcc[slotKey]) atkAcc[slotKey][sleepKey] = 0;

    const releaseSleepCd = () => {
      if (!fight) return;
      if (fight.sleepCdHold?.slotKey === slotKey && fight.sleepCdHold?.actionKey === sleepKey) {
        fight.sleepCdHold = null;
      }
      if (atkAcc[slotKey]) atkAcc[slotKey][sleepKey] = 0;
    };

    hooks?.onTitle?.('時間裂縫');
    if (!flashAttack(slotKey, iconId, sleepKey)) {
      releaseSleepCd();
      return;
    }
    const castCap = scaleDelayMs((IdleMobAnim.actionDurationMs?.(iconId, sleepKey) || 2880) + 200);
    const castStart = Date.now();
    while (Date.now() - castStart < castCap) {
      if (seq !== atkFxSeq || !fight || fight.mode !== 'fight') {
        releaseSleepCd();
        return;
      }
      if (!IdleMobAnim.isActorCasting?.(el)) break;
      await sleep(TICK_MS);
    }
    if (seq !== atkFxSeq || !fight || fight.mode !== 'fight') {
      releaseSleepCd();
      return;
    }
    if (unit.hp <= 0 || unit.dead) {
      releaseSleepCd();
      return;
    }

    fight.sleepChallenge = {
      active: true,
      startHp: Number(unit.hp) || 0,
      need,
      failHealRatio: Number(cfg.failHealRatio) || 0.1,
      failChannelKey: cfg.failChannelKey || '',
      startedAt: Date.now(),
    };

    const img = IdleMobAnim.actorBodyImg?.(el);
    el.dataset.skillUntil = String(Date.now() + windowMs + 500);
    el.dataset.channelUntil = '0';
    const holdAction = hasSleep ? 'sleep' : 'stand';
    if (img) {
      img.dataset.kindAction = holdAction;
      img.dataset.frameAcc = '0';
      img.dataset.bodyDone = '0';
      IdleMobAnim.bind?.(img, iconId, holdAction, 0);
    } else {
      bindVisual(slotKey, iconId, holdAction);
    }
    hooks?.onTitle?.(`裂縫 ${Math.ceil(windowMs / 1000)}s｜需打 ${need.toLocaleString()}`);

    const started = Date.now();
    let broken = false;
    while (Date.now() - started < windowMs) {
      if (seq !== atkFxSeq || !fight || fight.mode !== 'fight') {
        fight.sleepChallenge = null;
        el.dataset.skillUntil = '0';
        releaseSleepCd();
        return;
      }
      if (unit.hp <= 0 || unit.dead) {
        fight.sleepChallenge = null;
        el.dataset.skillUntil = '0';
        releaseSleepCd();
        return;
      }
      const damaged = Math.max(0, (Number(fight.sleepChallenge.startHp) || 0) - (Number(unit.hp) || 0));
      if (damaged >= need) {
        broken = true;
        break;
      }
      await sleep(TICK_MS);
    }

    if (seq !== atkFxSeq || !fight) {
      releaseSleepCd();
      return;
    }
    const challenge = fight.sleepChallenge;
    fight.sleepChallenge = null;
    el.dataset.skillUntil = '0';

    let failed = false;
    if (!broken && challenge && unit.hp > 0 && !unit.dead) {
      failed = true;
      const heal = Math.max(0, Math.floor((Number(unit.maxHp) || 0) * (Number(challenge.failHealRatio) || 0.1)));
      if (heal > 0) {
        unit.hp = Math.min(unit.maxHp, unit.hp + heal);
        hooks?.onTitle?.(`裂縫失敗｜回血 ${heal.toLocaleString()}`);
        syncHud();
      } else {
        hooks?.onTitle?.('裂縫失敗');
      }
    } else if (broken) {
      hooks?.onTitle?.('裂縫破壞！');
    }

    if (hasWakeup) {
      const img2 = IdleMobAnim.actorBodyImg?.(el);
      const wakeMs = scaleDelayMs(IdleMobAnim.actionDurationMs?.(iconId, 'wakeup') || 2000);
      if (img2) {
        el.dataset.skillUntil = String(Date.now() + wakeMs + 200);
        img2.dataset.kindAction = 'wakeup';
        img2.dataset.frameAcc = '0';
        img2.dataset.bodyDone = '0';
        IdleMobAnim.bind?.(img2, iconId, 'wakeup', 0);
      } else {
        bindVisual(slotKey, iconId, 'wakeup');
      }
      const wakeStart = Date.now();
      while (Date.now() - wakeStart < wakeMs + 200) {
        if (seq !== atkFxSeq || !fight) {
          releaseSleepCd();
          return;
        }
        await sleep(TICK_MS);
      }
      el.dataset.skillUntil = '0';
    }

    if (seq !== atkFxSeq || !fight) {
      releaseSleepCd();
      return;
    }
    bindVisual(slotKey, iconId, 'stand');

    // 失敗懲罰：鬧鐘引導（本體 skill3／三型 skill5）— CD 仍鎖定至引導結束
    if (failed && challenge?.failChannelKey && unit.hp > 0 && !unit.dead) {
      const channelAtk = buildChannelAttack(fight.listId, iconId, challenge.failChannelKey);
      if (channelAtk) {
        hooks?.onTitle?.('鬧鐘模式');
        await runChannelAttack(slotKey, unit, channelAtk);
      }
    }

    // 整段結束（含引導）後才開始算裂縫技 CD
    releaseSleepCd();
    if (seq !== atkFxSeq || !fight) return;
    hooks?.onPhase?.(fight.phase);
    syncHud();
  }

  /**
   * 引導技：skillN 循環持續傷害，結束後播 skillN+1 收招。
   */
  async function runChannelAttack(slotKey, unit, atk) {
    if (!fight || !unit || !atk?.channel) return;
    const el = slotEl(slotKey);
    if (!el || typeof IdleMobAnim === 'undefined') return;
    const seq = atkFxSeq;
    const iconId = pad(unit.visualId);
    const ch = atk.channel;
    const dM = dmgMult(fight.listId);
    const tickRatio = Number(ch.tickDmgRatio) > 0 ? Number(ch.tickDmgRatio) : 0.45;
    const tickDmg = Math.max(1, Math.floor((Number(atk.dmg) || 0) * dM * tickRatio));
    const channelMs = scaleDelayMs(Math.max(1000, Number(ch.repeatFrameTimeMs) || 30000));
    const tickEvery = scaleDelayMs(Math.max(200, Number(ch.tickMs) || 400));
    const playerEl = getBossPlayerEl();

    const ok = IdleMobAnim.startActorChannel(el, {
      iconId,
      action: atk.actionKey,
      loopFrom: ch.repeatFrameIdx,
      untilMs: Number(ch.repeatFrameTimeMs) || 30000,
      scaleDelayMs,
    });
    if (!ok) return;

    const started = Date.now();
    let lastTick = started;
    while (Date.now() - started < channelMs) {
      if (seq !== atkFxSeq || !fight || fight.mode !== 'fight') {
        IdleMobAnim.endActorChannel?.(el);
        el.dataset.skillUntil = '0';
        if (atkAcc[slotKey]) atkAcc[slotKey][atk.actionKey] = 0;
        return;
      }
      if (unit.hp <= 0 || unit.dead) break;
      await sleep(TICK_MS);
      if (Date.now() - lastTick >= tickEvery) {
        lastTick = Date.now();
        if (playerEl && typeof IdleMobAnim.playPlayerHit === 'function') {
          IdleMobAnim.playPlayerHit(playerEl, iconId, atk.actionKey, { immediate: true });
        }
        hurtPlayerFromBoss(slotKey, tickDmg);
      }
    }

    if (seq !== atkFxSeq || !fight) return;
    IdleMobAnim.endActorChannel?.(el);
    el.dataset.skillUntil = '0';

    const endKey = ch.endActionKey;
    if (endKey && IdleMobAnim.resolveAction?.(iconId, endKey)) {
      if (!flashAttack(slotKey, iconId, endKey)) {
        bindVisual(slotKey, iconId, 'stand');
        // 引導結束後重置 CD，避免施法期間又攒满立刻再放
        if (atkAcc[slotKey]) atkAcc[slotKey][atk.actionKey] = 0;
        return;
      }
      const endCap = scaleDelayMs((IdleMobAnim.actionDurationMs?.(iconId, endKey) || 1400) + 200);
      const endStart = Date.now();
      while (Date.now() - endStart < endCap) {
        if (seq !== atkFxSeq || !fight) return;
        if (!IdleMobAnim.isActorCasting?.(el)) break;
        await sleep(TICK_MS);
      }
    }
    if (seq !== atkFxSeq || !fight) return;
    bindVisual(slotKey, iconId, 'stand');
    // 引導結束後重置 CD，避免施法期間又攒满立刻再放
    if (atkAcc[slotKey]) atkAcc[slotKey][atk.actionKey] = 0;
  }

  function tickUnitAttack(slotKey, unit, attackList, dt) {
    if (!unit || unit.dead || unit.hp <= 0) return;
    if (slotKey !== 'body' && !unit.active) return;
    if (slotKey === 'body' && fight.body.hp <= 0) return;

    if (!atkAcc[slotKey]) atkAcc[slotKey] = Object.create(null);
    const accMap = atkAcc[slotKey];
    const cdM = cdMult(fight.listId);
    const dM = dmgMult(fight.listId);
    const iconId = pad(unit.visualId);

    // CD 一律累積（含施法中）。裂縫技在 sleepCdHold 期間不累積，等引導結束再算。
    const hold = fight.sleepCdHold;
    for (let i = 0; i < attackList.length; i += 1) {
      const atk = attackList[i];
      const key = atk.actionKey || `attack${atk.action}`;
      if (hold && hold.slotKey === slotKey && hold.actionKey === key) {
        accMap[key] = 0;
        continue;
      }
      accMap[key] = (Number(accMap[key]) || 0) + dt;
    }

    if (typeof IdleMobAnim !== 'undefined' && IdleMobAnim.isActorCasting?.(slotEl(slotKey))) return;

    const playerEl = getBossPlayerEl();
    const awActive = !!(playerEl && typeof IdleMobAnim !== 'undefined'
      && IdleMobAnim.isAreaWarningActive?.(playerEl));

    const ready = [];
    for (let i = 0; i < attackList.length; i += 1) {
      const atk = attackList[i];
      const key = atk.actionKey || `attack${atk.action}`;
      const cdSec = Math.max(0.4, ((Number(atk.animMs) || 1200) / 1000) * cdM);
      if ((Number(accMap[key]) || 0) < cdSec) continue;
      const dmg = Math.max(0, Math.floor((Number(atk.dmg) || 0) * dM));
      if (!(dmg > 0)) continue;
      const isAreaWarn = !atk.channel
        && typeof IdleMobAnim !== 'undefined'
        && IdleMobAnim.hasAreaWarningAttack?.(iconId, key);
      if (isAreaWarn && awActive) continue;
      ready.push({ atk, key, dmg, isAreaWarn: !!isAreaWarn });
    }
    if (!ready.length) return;

    const last = String(accMap._lastAction || '');
    let pool = ready.filter((r) => r.key !== last);
    if (!pool.length) pool = ready;
    // 引導技就緒時優先，否則會被短 CD 普攻永遠擠掉
    const specialReady = pool.filter((r) => r.atk.channel || r.atk.sleep);
    if (specialReady.length) pool = specialReady;
    const pick = pool[Math.floor(Math.random() * pool.length)];
    if (!pick) return;

    const { atk, key, dmg, isAreaWarn } = pick;
    accMap[key] = 0;
    accMap._lastAction = key;

    if (atk.sleep) {
      runSleepMechanic(slotKey, unit, atk);
      return;
    }

    if (atk.channel) {
      runChannelAttack(slotKey, unit, atk);
      return;
    }

    if (!flashAttack(slotKey, iconId, key)) {
      // flash 失敗：把 CD 略推後，避免同招卡死輪轉
      accMap[key] = Math.max(0, ((Number(atk.animMs) || 1200) / 1000) * cdM * 0.5);
      return;
    }

    const hasEffect0 = typeof IdleMobAnim !== 'undefined'
      && (IdleMobAnim.effect0ActionKeys?.(iconId, key) || []).length > 0;

    const applyHitAndDamage = (immediateHit) => {
      if (playerEl && typeof IdleMobAnim?.playPlayerHit === 'function') {
        IdleMobAnim.playPlayerHit(playerEl, iconId, key, immediateHit ? { immediate: true } : undefined);
      }
      hurtPlayerFromBoss(slotKey, dmg);
    };

    if (isAreaWarn && playerEl && typeof IdleMobAnim.playAreaWarning === 'function') {
      const ok = IdleMobAnim.playAreaWarning(playerEl, iconId, key, {
        onDamage: () => {
          applyHitAndDamage(true);
          if (hasEffect0 && typeof IdleMobAnim.playEffect0Row === 'function') {
            IdleMobAnim.playEffect0Row({
              iconId,
              bodyAction: key,
              fieldEl: getBossFieldEl(),
              playerEl,
              tileWidth: 128,
            });
          }
        },
      });
      if (ok) {
        hooks?.syncPlayerHp?.();
        return;
      }
    }

    const delay = typeof IdleMobAnim !== 'undefined'
      ? (Number(IdleMobAnim.mobDamageDelayMs?.(iconId, key)) || 0)
      : 0;
    if (playerEl && typeof IdleMobAnim.playPlayerHit === 'function') {
      IdleMobAnim.playPlayerHit(playerEl, iconId, key, { delayMs: delay });
    }
    scheduleBossAtkFx(delay, () => {
      if (hasEffect0 && typeof IdleMobAnim.playEffect0Row === 'function') {
        IdleMobAnim.playEffect0Row({
          iconId,
          bodyAction: key,
          fieldEl: getBossFieldEl(),
          playerEl,
          tileWidth: 128,
        });
      }
      hurtPlayerFromBoss(slotKey, dmg);
    });
    hooks?.syncPlayerHp?.();
  }

  function tickBoss(dt) {
    if (!fight || busy || fight.mode !== 'fight') return;
    if (typeof IdleHunt !== 'undefined' && IdleHunt.isPlayerDead?.()) return;

    if (isHorntail()) {
      armList().forEach((arm) => {
        if (arm.dead || !(arm.hp > 0)) return;
        const attacks = unitAttacks(fight.listId, arm.statMob || arm.visualId);
        tickUnitAttack(arm.key, arm, attacks, dt);
      });
      return;
    }

    if (isPinkBean()) {
      if (!pinkBeanInBodyPhase()) {
        armList().forEach((arm) => {
          if (!arm.unlocked || arm.dead || !(arm.hp > 0)) return;
          const attacks = unitAttacks(fight.listId, arm.statMob || arm.visualId);
          tickUnitAttack(arm.key, arm, attacks, dt);
        });
        // 王座無敵但仍可 skill 輪轉
        const throneId = fight.script?.intro?.throneMob || fight.body.visualId;
        const bodyAtk = unitAttacks(fight.listId, throneId);
        tickUnitAttack('body', { ...fight.body, active: true }, bodyAtk, dt);
      } else {
        const form = (fight.script.bodyForms || [])[0];
        const statId = form?.statMob || fight.body.visualId;
        const attacks = unitAttacks(fight.listId, statId);
        tickUnitAttack('body', { ...fight.body, active: true }, attacks, dt);
      }
      return;
    }

    if (isPapulatus()) {
      const form = currentBodyForm() || (fight.script.bodyForms || [])[0];
      const statId = form?.statMob || fight.body.visualId;
      const attacks = unitAttacks(fight.listId, statId);
      tickUnitAttack('body', { ...fight.body, active: true }, attacks, dt);
      return;
    }

    if (isSimple()) {
      const attacks = unitAttacks(fight.listId, fight.script.bodyStatMob || fight.body.visualId);
      tickUnitAttack('body', { ...fight.body, active: true }, attacks, dt);
      return;
    }

    if (isCygnus()) {
      if (fight.escort && !fight.escort.dead && fight.escort.hp > 0) {
        const eAtk = unitAttacks(fight.listId, fight.escort.statMob || fight.escort.visualId);
        tickUnitAttack('escort', fight.escort, eAtk, dt);
      }
      if (fight.guardian && !fight.guardian.dead && fight.guardian.hp > 0) {
        const gAtk = unitAttacks(fight.listId, fight.guardian.statMob || fight.guardian.visualId);
        tickUnitAttack('guardian', fight.guardian, gAtk, dt);
      }
      if (cygnusSleeping()) {
        holdCygnusBodySleep();
      } else if (!fight.body.invincible) {
        const attacks = unitAttacks(fight.listId, fight.script.bodyStatMob || fight.body.visualId);
        tickUnitAttack('body', { ...fight.body, active: true }, attacks, dt);
      }
      return;
    }

    if (isZakum()) {
      if (fight.phase === 1) {
        // 一階段：手臂可打；本體無敵但仍會攻擊
        armList().forEach((arm) => {
          if (arm.dead || !(arm.hp > 0)) return;
          const attacks = unitAttacks(fight.listId, arm.statMob || arm.visualId);
          tickUnitAttack(arm.key, arm, attacks, dt);
        });
        const form = currentBodyForm() || (fight.script.bodyForms || [])[0];
        const statId = form?.statMob || fight.body.visualId;
        const bodyAtk = unitAttacks(fight.listId, statId);
        tickUnitAttack('body', { ...fight.body, active: true }, bodyAtk, dt);
      } else {
        const form = currentBodyForm();
        const statId = form?.statMob || fight.body.visualId;
        const attacks = unitAttacks(fight.listId, statId);
        tickUnitAttack('body', { ...fight.body, active: true }, attacks, dt);
      }
      return;
    }

    if (fight.phase === 1 || fight.phase === 2 || fight.phase === 4) {
      let attacks = unitAttacks(fight.listId, fight.script.bodyStatMob);
      if (fight.phase === 4) {
        attacks = attacks.filter((a) => /^(attack[123]|skill1)$/i.test(a.actionKey || ''));
      }
      tickUnitAttack('body', { ...fight.body, active: true }, attacks, dt);
    }
    if (fight.phase === 3) {
      let attacks = unitAttacks(fight.listId, fight.script.headVisualMob)
        .filter((a) => a.actionKey === 'skill1');
      if (!attacks.length) {
        const src = wzPart(fight.listId, fight.script.bodyStatMob);
        attacks = [{
          actionKey: 'skill1',
          dmg: Number(src?.MADamage) || 580,
          animMs: Number(wzPart(fight.listId, '8830003')?.skillAnimMs?.skill1) || 2880,
        }];
      }
      tickUnitAttack('body', { ...fight.body, active: true, visualId: fight.body.visualId }, attacks, dt);
    }
    if (fight.phase === 2 || fight.phase === 3) {
      const lAtk = unitAttacks(fight.listId, fight.script.handL.statMob);
      const rAtk = unitAttacks(fight.listId, fight.script.handR.statMob);
      tickUnitAttack('handL', fight.handL, lAtk, dt);
      tickUnitAttack('handR', fight.handR, rAtk, dt);
    }
  }

  function advanceSprites(dt) {
    if (typeof IdleMobAnim === 'undefined') return;
    IdleMobAnim.advanceActorsIn(stage(), dt);
    const playerEl = getBossPlayerEl();
    if (playerEl) {
      IdleMobAnim.tickAreaWarning?.(playerEl, dt);
      IdleMobAnim.tickPlayerHit?.(playerEl, dt);
    }
  }

  function getBodyHp() {
    if (!fight) return null;
    if (isPinkBean() && !pinkBeanInBodyPhase() && fight.shell) {
      return {
        hp: Math.max(0, Number(fight.shell.hp) || 0),
        maxHp: Math.max(1, Number(fight.shell.maxHp) || 1),
        phase: fight.phase,
        mode: fight.mode,
      };
    }
    if ((isZakum() && fight.phase === 1) || isHorntail()) {
      const arms = armList();
      const hp = arms.reduce((sum, a) => sum + Math.max(0, a.dead ? 0 : (Number(a.hp) || 0)), 0);
      const maxHp = arms.reduce((sum, a) => sum + Math.max(1, Number(a.maxHp) || 1), 0);
      return { hp, maxHp, phase: fight.phase, mode: fight.mode };
    }
    if (isCygnus() && fight.escort && !fight.escort.dead) {
      return {
        hp: Math.max(0, Number(fight.escort.hp) || 0),
        maxHp: Math.max(1, Number(fight.escort.maxHp) || 1),
        phase: fight.phase,
        mode: fight.mode,
      };
    }
    return { hp: fight.body.hp, maxHp: fight.body.maxHp, phase: fight.phase, mode: fight.mode };
  }

  function reset(listId, nextHooks, diffId) {
    clearExitCountdown();
    atkFxSeq += 1;
    busy = false;
    playerAtkAcc = 0;
    atkAcc = Object.create(null);
    exitLeftSec = 0;
    hooks = nextHooks || null;
    activeDiff = resolveDiff(listId, diffId);
    fight = createFight(listId);
    if (fight) fight.difficultyId = activeDiff.id;
    return !!fight;
  }

  const VISUAL_MOB_KEYS = new Set([
    'mobId', 'statMob', 'visualMob', 'active', 'sealed', 'deadSealed',
    'bodyStatMob', 'headVisualMob', 'chestMob', 'shell', 'throneMob',
    'fromMob', 'viaMob', 'mob', 'visualId',
  ]);

  /** 腳本／WZ 裡會上場的視覺 mobId（略過 rewards 道具 id） */
  function collectVisualMobIds(listId) {
    const ids = new Set();
    const add = (v) => {
      if (v == null || v === '') return;
      const raw = String(v).trim();
      if (!/^\d+$/.test(raw)) return;
      const id = pad(raw);
      if (id && id !== '0000000') ids.add(id);
    };
    const walk = (val, skipRewards) => {
      if (val == null) return;
      if (typeof val === 'string' || typeof val === 'number') return;
      if (Array.isArray(val)) {
        val.forEach((item) => walk(item, skipRewards));
        return;
      }
      if (typeof val !== 'object') return;
      Object.entries(val).forEach(([k, v]) => {
        if (k === 'rewards' || k === 'difficulties') {
          // difficulties 仍要往下走（不含 rewards）
          if (k === 'difficulties') walk(v, true);
          return;
        }
        if (skipRewards && k === 'rewards') return;
        if (VISUAL_MOB_KEYS.has(k) && (typeof v === 'string' || typeof v === 'number')) {
          add(v);
          return;
        }
        if (v && typeof v === 'object') walk(v, skipRewards);
      });
    };
    walk(phaseScript(listId), false);
    (wzRow(listId)?.parts || []).forEach((p) => add(p.mobId));
    return [...ids];
  }

  function collectMapArtIds(listId) {
    const arts = new Set();
    const script = phaseScript(listId);
    (script?.stages || []).forEach((st) => {
      if (st?.mapArt) arts.add(String(st.mapArt));
    });
    return [...arts];
  }

  /** 入場前預載本場會用到的 BOSS 動畫幀 */
  function warmAssets(listId) {
    if (typeof IdleMobAnim === 'undefined' || !IdleMobAnim.preloadMob) {
      return Promise.resolve();
    }
    const ids = collectVisualMobIds(listId);
    return Promise.all(ids.map((id) => IdleMobAnim.preloadMob(id))).then(() => {});
  }

  /** 拉圖斯進場：時鐘 stand／regen（有則播），結束後開戰 */
  async function playPapulatusIntro() {
    if (!fight || !isPapulatus()) return;
    const seq = atkFxSeq;
    const id = pad(fight.body.visualId);
    const hasRegen = typeof IdleMobAnim !== 'undefined'
      && !!IdleMobAnim.resolveAction?.(id, 'regen');

    busy = true;
    hooks?.onTitle?.('登場');

    const el = slotEl('body');
    if (el) {
      el.classList.remove('is-hidden-slot');
      el.style.display = '';
      if (hasRegen) {
        el.dataset.mobId = id;
        el.dataset.introAction = 'regen';
        IdleMobAnim.bindActorSprite(el, id, 'regen');
        const img = IdleMobAnim.actorBodyImg?.(el);
        if (img) {
          img.dataset.frameAcc = '0';
          img.dataset.bodyDone = '0';
        }
        await playAnim('body', id, 'regen');
      } else {
        bindVisual('body', id, 'stand');
      }
    }
    if (seq !== atkFxSeq || !fight) return;

    bindVisual('body', id, 'stand');
    fight.body.invincible = false;
    fight.body.targetable = true;
    busy = false;
    hooks?.onPhase?.(1);
    syncHud();
  }

  /** 簡單單本體進場（梅格耐斯等） */
  async function playSimpleIntro() {
    if (!fight || !isSimple()) return;
    const seq = atkFxSeq;
    const id = pad(fight.body.visualId);
    const hasRegen = typeof IdleMobAnim !== 'undefined'
      && !!IdleMobAnim.resolveAction?.(id, 'regen');

    busy = true;
    hooks?.onTitle?.('登場');

    const el = slotEl('body');
    if (el) {
      el.classList.remove('is-hidden-slot');
      el.style.display = '';
      if (hasRegen) {
        el.dataset.mobId = id;
        el.dataset.introAction = 'regen';
        IdleMobAnim.bindActorSprite(el, id, 'regen');
        const img = IdleMobAnim.actorBodyImg?.(el);
        if (img) {
          img.dataset.frameAcc = '0';
          img.dataset.bodyDone = '0';
        }
        await playAnim('body', id, 'regen');
      } else {
        bindVisual('body', id, 'stand');
      }
    }
    if (seq !== atkFxSeq || !fight) return;

    bindVisual('body', id, 'stand');
    fight.body.invincible = false;
    fight.body.targetable = true;
    busy = false;
    hooks?.onPhase?.(1);
    syncHud();
  }

  /** 粉豆進場：0019–23 先進場 → 8820008 die1 過場 → 王座＋首階雕像 */
  async function playPinkBeanIntro() {
    if (!fight || !isPinkBean()) return;
    const seq = atkFxSeq;
    const intro = fight.script.intro || {};
    const fromMob = pad(intro.fromMob || '8820008');
    const throneMob = pad(intro.throneMob || '8820000');
    const bossPos = hooks?.getBossPos?.() || { x: 700, y: 580 };
    const st = stage();

    busy = true;
    hooks?.onTitle?.('登場');

    fight.pinkbeanBody = false;
    fight.statuePhaseIndex = 0;
    fight.phase = 1;
    fight.shell = makePinkBeanShell(fight.listId, (fight.script.statuePhases || [])[0]?.shell || '8820010');
    fight.body.visualId = throneMob;
    fight.body.hp = 1;
    fight.body.maxHp = 1;
    fight.body.invincible = true;
    fight.body.targetable = false;
    fight.body.dead = false;
    armList().forEach((arm) => {
      arm.unlocked = false;
      arm.targetable = false;
      arm.active = false;
      arm.dead = false;
      arm.hp = arm.maxHp;
    });

    // 清場後立刻掛 0019–23（不等 0008 die 播完）
    st?.querySelectorAll('.idle-boss-part').forEach((n) => n.remove());
    sceneryList().forEach((prop) => {
      if (!st) return;
      const x = bossPos.x + (prop.offset?.x || 0);
      const y = bossPos.y + (prop.offset?.y || 0);
      st.insertAdjacentHTML('beforeend', `<div class="idle-actor idle-actor--mob idle-boss-part"
        data-slot="${prop.key}" data-uid="${prop.key}" data-mob-id="${prop.visualId}"
        style="left:${x}px;top:${y}px;z-index:${prop.z};pointer-events:none">
        <div class="idle-actor-sprite-stage">
          <img class="idle-actor-sprite" alt="" draggable="false">
        </div>
      </div>`);
      bindVisual(prop.key, prop.visualId, 'stand');
    });

    if (st) {
      st.insertAdjacentHTML('beforeend', `<div class="idle-actor idle-actor--mob idle-boss-part"
        data-slot="intro" data-uid="intro" data-mob-id="${fromMob}"
        style="left:${bossPos.x}px;top:${bossPos.y}px;z-index:40">
        <div class="idle-actor-sprite-stage">
          <img class="idle-actor-sprite" alt="" draggable="false">
        </div>
      </div>`);
    }

    const hasFromDie = typeof IdleMobAnim !== 'undefined'
      && !!IdleMobAnim.resolveAction?.(fromMob, 'die1');
    if (hasFromDie) {
      await playAnim('intro', fromMob, 'die1');
    } else {
      await sleep(600);
    }
    if (seq !== atkFxSeq || !fight) return;
    removeSlot('intro');

    // 保留場景裝飾，只補王座／雕像（勿 mountInitialActors 全清）
    stage()?.querySelectorAll('.idle-boss-part').forEach((n) => {
      const slot = n.getAttribute('data-slot') || '';
      if (sceneryList().some((p) => p.key === slot)) return;
      n.remove();
    });
    applyActorLayout(bossPos, { skipBind: true });
    bindVisual('body', throneMob, 'stand');
    sceneryList().forEach((prop) => {
      const el = slotEl(prop.key);
      if (el) {
        el.classList.remove('is-hidden-slot');
        el.style.display = '';
        el.style.pointerEvents = 'none';
      }
      bindVisual(prop.key, prop.visualId, 'stand');
    });
    const newly = applyPinkBeanUnlock(0);
    await playPinkBeanStatueRegen(newly);
    if (seq !== atkFxSeq || !fight) return;

    busy = false;
    hooks?.onPhase?.(1);
    syncHud();
  }

  /** 炎魔進場：本體＋各臂並行 regen，結束後才開戰 */
  async function playZakumIntroRegen() {
    if (!fight || !isZakum()) return;
    const seq = atkFxSeq;
    const parts = [{ key: 'body', id: fight.body.visualId, flipX: false }];
    armList().forEach((arm) => {
      parts.push({ key: arm.key, id: arm.visualId, flipX: !!arm.flipX });
    });
    const playable = parts.filter((p) => {
      if (typeof IdleMobAnim === 'undefined') return false;
      return !!IdleMobAnim.resolveAction?.(pad(p.id), 'regen');
    });

    busy = true;
    hooks?.onTitle?.('登場');

    // 有 regen：直接從 regen 起跳（不要先 stand）；沒有則 stand
    parts.forEach((p) => {
      const el = slotEl(p.key);
      if (!el) return;
      el.classList.remove('is-hidden-slot');
      el.style.display = '';
      el.classList.toggle('is-flip-x', !!p.flipX);
      if (playable.some((x) => x.key === p.key)) {
        if (typeof IdleMobAnim !== 'undefined') {
          el.dataset.mobId = pad(p.id);
          el.dataset.introAction = 'regen';
          IdleMobAnim.bindActorSprite(el, pad(p.id), 'regen');
          const img = IdleMobAnim.actorBodyImg?.(el);
          if (img) {
            img.dataset.frameAcc = '0';
            img.dataset.bodyDone = '0';
          }
        }
      } else {
        bindVisual(p.key, p.id, 'stand');
        el.classList.toggle('is-flip-x', !!p.flipX);
      }
    });

    if (playable.length) {
      await Promise.all(playable.map((p) => playAnim(p.key, p.id, 'regen')));
    }
    if (seq !== atkFxSeq || !fight) return;

    parts.forEach((p) => {
      bindVisual(p.key, p.id, 'stand');
      slotEl(p.key)?.classList.toggle('is-flip-x', !!p.flipX);
    });
    fight.body.invincible = true;
    fight.body.targetable = false;
    busy = false;
    hooks?.onPhase?.(1);
    syncHud();
  }

  /** 西格諾斯進場：本體＋守護獸並行 regen（有則播） */
  async function playCygnusIntro() {
    if (!fight || !isCygnus()) return;
    const seq = atkFxSeq;
    const parts = [{ key: 'body', id: fight.body.visualId, flipX: false }];
    if (fight.guardian && !fight.guardian.dead) {
      parts.push({
        key: 'guardian',
        id: fight.guardian.visualId,
        flipX: !!fight.guardian.flipX,
      });
    }
    const playable = parts.filter((p) => {
      if (typeof IdleMobAnim === 'undefined') return false;
      return !!IdleMobAnim.resolveAction?.(pad(p.id), 'regen');
    });

    busy = true;
    hooks?.onTitle?.('登場');

    parts.forEach((p) => {
      const el = slotEl(p.key);
      if (!el) return;
      el.classList.remove('is-hidden-slot');
      el.style.display = '';
      el.classList.toggle('is-flip-x', !!p.flipX);
      if (playable.some((x) => x.key === p.key)) {
        el.dataset.mobId = pad(p.id);
        el.dataset.introAction = 'regen';
        IdleMobAnim.bindActorSprite(el, pad(p.id), 'regen');
        const img = IdleMobAnim.actorBodyImg?.(el);
        if (img) {
          img.dataset.frameAcc = '0';
          img.dataset.bodyDone = '0';
        }
      } else {
        bindVisual(p.key, p.id, 'stand');
        el.classList.toggle('is-flip-x', !!p.flipX);
      }
    });

    if (playable.length) {
      await Promise.all(playable.map((p) => playAnim(p.key, p.id, 'regen')));
    }
    if (seq !== atkFxSeq || !fight) return;

    parts.forEach((p) => {
      bindVisual(p.key, p.id, 'stand');
      slotEl(p.key)?.classList.toggle('is-flip-x', !!p.flipX);
    });
    fight.body.invincible = false;
    fight.body.targetable = true;
    if (fight.guardian) {
      fight.guardian.invincible = false;
      fight.guardian.targetable = true;
      fight.guardian.active = true;
    }
    busy = false;
    hooks?.onPhase?.(1);
    syncHud();
  }

  function start(bossPos, opts = {}) {
    if (!fight) return false;
    atkFxSeq += 1;
    busy = false;
    playerAtkAcc = 0;
    atkAcc = Object.create(null);
    fight.mode = 'fight';
    fight.phase = 1;
    fight.chest = null;
    fight.rewardsGranted = false;
    fight._dropSpawned = false;
    fight.sleepChallenge = null;
    fight.sleepCdHold = null;

    if (isHorntail()) {
      fight.stageIndex = 0;
      fight.phase = 1;
      const stage0 = (fight.script.stages || [])[0] || { parts: [] };
      fight.arms = buildHorntailParts(fight.listId, stage0);
      fight.body.visualId = '';
      fight.body.invincible = true;
      fight.body.targetable = false;
      fight.body.dead = false;
      const layoutBossPos = applyHorntailStageLayout(stage0, bossPos);
      if (opts.playIntro) {
        if (stage0.mapArt && typeof hooks?.setMapArt === 'function') {
          hooks.setMapArt(stage0.mapArt);
        }
        mountInitialActors(layoutBossPos, { skipBind: true });
        syncHud();
        playHorntailIntroRegen();
      } else {
        stage()?.querySelectorAll('.idle-boss-part').forEach((n) => n.remove());
        syncHud();
      }
      return true;
    }

    if (isPapulatus()) {
      fight.bodyFormIndex = 0;
      fight.phase = 1;
      const form = currentBodyForm() || (fight.script.bodyForms || [])[0];
      const statId = pad(form?.statMob);
      const visualId = pad(form?.visualMob || form?.statMob);
      fight.body.visualId = visualId;
      fight.body.maxHp = maxHpOf(fight.listId, statId);
      fight.body.hp = fight.body.maxHp;
      fight.body.invincible = false;
      fight.body.targetable = true;
      fight.body.dead = false;
      if (opts.playIntro) {
        mountInitialActors(bossPos, { skipBind: true });
        syncHud();
        playPapulatusIntro();
      } else {
        stage()?.querySelectorAll('.idle-boss-part').forEach((n) => n.remove());
        syncHud();
      }
      return true;
    }

    if (isSimple()) {
      fight.phase = 1;
      const statId = pad(fight.script.bodyStatMob);
      fight.body.visualId = statId;
      fight.body.maxHp = maxHpOf(fight.listId, statId);
      fight.body.hp = fight.body.maxHp;
      fight.body.invincible = false;
      fight.body.targetable = true;
      fight.body.dead = false;
      if (opts.playIntro) {
        mountInitialActors(bossPos, { skipBind: true });
        syncHud();
        playSimpleIntro();
      } else {
        stage()?.querySelectorAll('.idle-boss-part').forEach((n) => n.remove());
        syncHud();
      }
      return true;
    }

    if (isPinkBean()) {
      fight.pinkbeanBody = false;
      fight.statuePhaseIndex = 0;
      fight.phase = 1;
      fight.bodyFormIndex = 0;
      const intro = fight.script.intro || {};
      const throneMob = pad(intro.throneMob || '8820000');
      fight.shell = makePinkBeanShell(fight.listId, (fight.script.statuePhases || [])[0]?.shell || '8820010');
      fight.body.visualId = throneMob;
      fight.body.hp = 1;
      fight.body.maxHp = 1;
      fight.body.invincible = true;
      fight.body.targetable = false;
      fight.body.dead = false;
      fight.arms = buildPinkBeanStatues(fight.listId, fight.script);
      fight.scenery = buildPinkBeanScenery(fight.script);
      if (opts.playIntro) {
        syncHud();
        playPinkBeanIntro();
      } else {
        stage()?.querySelectorAll('.idle-boss-part').forEach((n) => n.remove());
        syncHud();
      }
      return true;
    }

    if (isCygnus()) {
      fight.phase = 1;
      fight.lockIndex = 0;
      fight.cygnusSleep = false;
      fight.escort = null;
      removeSlot('escort');
      const bodyId = pad(fight.script.bodyStatMob);
      fight.body.visualId = bodyId;
      fight.body.maxHp = maxHpOf(fight.listId, bodyId);
      fight.body.hp = fight.body.maxHp;
      fight.body.invincible = true;
      fight.body.targetable = true;
      fight.body.dead = false;
      if (fight.script.guardian) {
        fight.guardian = makeCygnusCompanion(fight.listId, 'guardian', fight.script.guardian, {
          invincible: true,
        });
      } else {
        fight.guardian = null;
      }
      if (opts.playIntro) {
        mountInitialActors(bossPos, { skipBind: true });
        syncHud();
        playCygnusIntro();
      } else {
        stage()?.querySelectorAll('.idle-boss-part').forEach((n) => n.remove());
        syncHud();
      }
      return true;
    }

    if (isZakum()) {
      fight.bodyFormIndex = 0;
      const form = currentBodyForm() || (fight.script.bodyForms || [])[0];
      const statId = pad(form?.statMob);
      const visualId = pad(form?.visualMob || form?.statMob);
      fight.body.visualId = visualId;
      fight.body.maxHp = maxHpOf(fight.listId, statId);
      fight.body.hp = fight.body.maxHp;
      fight.body.invincible = true;
      fight.body.targetable = false;
      fight.body.dead = false;
      armList().forEach((arm) => {
        arm.hp = arm.maxHp;
        arm.dead = false;
        arm.targetable = true;
        arm.active = true;
        arm.visualId = pad(arm.visualId);
      });
      if (opts.playIntro) {
        // 按下開始才掛上，直接進 regen（skipBind 避免先閃 stand）
        mountInitialActors(bossPos, { skipBind: true });
        syncHud();
        playZakumIntroRegen();
      } else {
        // 場地預覽：不顯示 BOSS
        stage()?.querySelectorAll('.idle-boss-part').forEach((n) => n.remove());
        syncHud();
      }
      return true;
    }

    fight.body.hp = fight.body.maxHp;
    fight.body.invincible = false;
    fight.body.targetable = true;
    fight.body.visualId = pad(fight.script.bodyStatMob);
    fight.handL.visualId = pad(fight.script.handL.sealed || fight.script.handL.active);
    fight.handL.targetable = false;
    fight.handL.active = false;
    fight.handL.dead = false;
    fight.handL.hp = fight.handL.maxHp;
    fight.handR.visualId = pad(fight.script.handR.active);
    fight.handR.targetable = false;
    fight.handR.active = false;
    fight.handR.dead = false;
    fight.handR.hp = fight.handR.maxHp;
    mountInitialActors(bossPos);
    syncHud();
    return true;
  }

  function stop() {
    clearExitCountdown();
    atkFxSeq += 1;
    busy = false;
    try { SkillCombat.invalidateAsyncCasts?.(); } catch (_) { /* ignore */ }
    if (typeof SkillMobStatus !== 'undefined') SkillMobStatus.clearAll?.();
    const playerEl = getBossPlayerEl();
    if (playerEl && typeof IdleMobAnim !== 'undefined') {
      IdleMobAnim.clearAreaWarning?.(playerEl);
      IdleMobAnim.clearPlayerHit?.(playerEl);
    }
  }

  function tick(dt) {
    if (!fight) return;
    advanceSprites(dt);
    // 轉階段 busy／戰鬥結束：打斷伊修塔爾等持續引導，避免空放
    if (busy || fight.mode === 'done') {
      stopSustainCombat();
    }
    if (fight.mode === 'done') return;
    // 死亡先結算：勿再 tickPlayer（否則死後仍施法一幀／持續引導）
    if (typeof IdleHunt !== 'undefined' && IdleHunt.isPlayerDead?.() && fight.mode === 'fight') {
      fight.mode = 'done';
      stopSustainCombat();
      hooks?.onFightEnd?.('lose');
      return;
    }
    tickPlayer(dt);
    tickBoss(dt);
    if (typeof IdlePotionPanel !== 'undefined') IdlePotionPanel.tryAutoDrink?.();
    hooks?.syncPlayerHp?.();
    if (typeof IdleHunt !== 'undefined' && IdleHunt.isPlayerDead?.() && fight.mode === 'fight') {
      fight.mode = 'done';
      stopSustainCombat();
      hooks?.onFightEnd?.('lose');
    }
  }

  return {
    TICK_MS,
    reset,
    start,
    stop,
    tick,
    isBusy: () => busy,
    getBodyHp,
    getPhase: () => fight?.phase || 0,
    getMode: () => fight?.mode || '',
    getExitLeft: () => exitLeftSec,
    hasScript: (listId) => !!phaseScript(listId),
    getDifficulty: () => (activeDiff ? { ...activeDiff } : null),
    getCombatMobs,
    combatCtx,
    capIncomingDamage,
    collectVisualMobIds,
    collectMapArtIds,
    warmAssets,
  };
})();

if (typeof window !== 'undefined') {
  window.IdleBossFight = IdleBossFight;
}
