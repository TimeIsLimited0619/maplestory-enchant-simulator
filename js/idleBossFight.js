/**
 * BOSS 戰鬥狀態機。
 * - 巴洛古（kind 省略）：四階段 body + handL/handR + chest
 * - 殘暴炎魔（kind: 'zakum'）：先八臂 → 本體三態；無 chest 則直接掉落
 * - 暗黑龍王（kind: 'horntail'）：左頭 → 右頭 → 本體八部位（死後佔位圖）
 * - 拉圖斯（kind: 'papulatus'）：時鐘 → 本體 → 二型（bodyForms）
 * - 簡單單本體（kind: 'simple'）：梅格耐斯等，近似一般怪物
 * - 粉紅豆豆（kind: 'pinkbean'）：過場 → 王座＋雕像殼漸進解鎖 → 本體
 * - 西格諾斯（kind: 'cygnus'）：本體＋守護獸；15%×5 鎖血召喚護衛後 sleep
 * - 濃姬等（kind: 'forms'）：bodyForms 單槽換態（與拉圖斯同路徑）
 * - 血腥女皇（kind: 'bloodyQueen'）：三臉共血、固定 CD 輪替 regen；0000 skill1→腳邊愛心彈；見 .cursor/rules/idle-boss-handoff.mdc
 * - 比艾樂（kind: 'pierre'）：8900000 打到 50% → 分裂 8900001＋8900002 共血；0002 move 貼近接觸傷
 * - 班班（kind: 'banban'）：skill1 召喚香蕉 → skillAfter1 窗；擊殺→弱化／逾時→強化
 * - 貝倫（kind: 'vellum'）：本體＋尾巴共血；尾巴週期竄出攻擊
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
    // papulatus／forms：單槽 bodyForms 換態（拉圖斯、濃姬等）
    return !!(script && Array.isArray(script.bodyForms) && script.bodyForms.length
      && (script.kind === 'papulatus' || script.kind === 'forms'));
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

  function isBloodyQueenScript(script) {
    return !!(script && script.kind === 'bloodyQueen'
      && Array.isArray(script.bodyForms) && script.bodyForms.length);
  }

  function isPierreScript(script) {
    return !!(script && script.kind === 'pierre' && script.bodyStatMob);
  }

  function isBanbanScript(script) {
    return !!(script && script.kind === 'banban' && script.bodyStatMob);
  }

  function isVellumScript(script) {
    return !!(script && script.kind === 'vellum' && script.bodyStatMob);
  }

  function isZakum(f = fight) {
    return !!(f && (f.kind === 'zakum' || isZakumScript(f.script)));
  }

  function isHorntail(f = fight) {
    return !!(f && (f.kind === 'horntail' || isHorntailScript(f.script)));
  }

  function isPapulatus(f = fight) {
    return !!(f && (f.kind === 'papulatus' || f.kind === 'forms' || isPapulatusScript(f.script)));
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

  function isBloodyQueen(f = fight) {
    return !!(f && (f.kind === 'bloodyQueen' || isBloodyQueenScript(f.script)));
  }

  function isPierre(f = fight) {
    return !!(f && (f.kind === 'pierre' || isPierreScript(f.script)));
  }

  function isBanban(f = fight) {
    return !!(f && (f.kind === 'banban' || isBanbanScript(f.script)));
  }

  function isVellum(f = fight) {
    return !!(f && (f.kind === 'vellum' || isVellumScript(f.script)));
  }

  function cygnusSleeping(f = fight) {
    return isCygnus(f) && !!f?.cygnusSleep;
  }

  /** 單本體（無手臂／多部位） */
  function isBodyOnly(f = fight) {
    return isPapulatus(f) || isSimple(f) || isBloodyQueen(f);
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

  function hpMult(listId, mobId) {
    const n = Number(wzRow(listId)?.hpMult);
    const wz = n > 0 ? n : 1;
    let extra = Number(activeDiff?.hpMult) > 0 ? Number(activeDiff.hpMult) : 1;
    // 分態血量：difficulty.formHpMult[mobId] 覆寫該 mob 的 hpMult
    if (mobId != null && activeDiff?.formHpMult && typeof activeDiff.formHpMult === 'object') {
      const id = pad(mobId);
      const hit = activeDiff.formHpMult[id]
        ?? activeDiff.formHpMult[String(mobId)]
        ?? activeDiff.formHpMult[String(Number(id))];
      if (Number(hit) > 0) extra = Number(hit);
    }
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
    const mult = hpMult(listId, mobId);
    if (part) return Math.max(1, Math.floor((Number(part.maxHP) || 1) * mult));
    // chest / sealed：從動畫檔旁的 stats 不在 parts 時用預設
    if (pad(mobId) === '8830014') return Math.max(1, Math.floor(1000 * mult));
    return 1;
  }

  /** bodyForm 可另設 form.hpMult（乘在難度倍率上）或 form.maxHp（絕對血量） */
  function maxHpOfBodyForm(listId, form) {
    const fixed = Number(form?.maxHp);
    if (Number.isFinite(fixed) && fixed > 0) {
      return Math.max(1, Math.floor(fixed));
    }
    const mob = form?.statMob || form?.visualMob;
    const base = maxHpOf(listId, mob);
    const extra = Number(form?.hpMult);
    if (Number.isFinite(extra) && extra > 0 && extra !== 1) {
      return Math.max(1, Math.floor(base * extra));
    }
    return base;
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

    // regen／transform 等 intro：與章節 waitMobIntroAnim 相同
    const introAct = (String(action) === 'transform' || resolved === 'transform')
      ? 'transform'
      : ((String(action) === 'regen' || resolved === 'regen') ? 'regen' : '');
    if (introAct) {
      const img = IdleMobAnim.actorBodyImg(el);
      el.dataset.introAction = introAct;
      IdleMobAnim.bindActorSprite(el, id, introAct);
      if (img) {
        img.dataset.frameAcc = '0';
        img.dataset.bodyDone = '0';
      }
      const timeout = (IdleMobAnim.actionDurationMs(id, introAct, introAct) || 1200) + 200;
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
    if (isPierreScript(script)) return createPierreFight(listId, script);
    if (isBanbanScript(script)) return createBanbanFight(listId, script);
    if (isVellumScript(script)) return createVellumFight(listId, script);
    if (isBloodyQueenScript(script)) return createBloodyQueenFight(listId, script);
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
    const bodyMax = maxHpOfBodyForm(listId, form0);
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
    const bodyMax = maxHpOfBodyForm(listId, form0);
    return {
      listId: String(listId),
      kind: script.kind === 'forms' ? 'forms' : 'papulatus',
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
      nohimeThresholdDone: false,
      nohimeChallenge: null,
      nohimeThresholdRunning: false,
    };
  }

  function createBloodyQueenFight(listId, script) {
    const forms = Array.isArray(script.bodyForms) ? script.bodyForms : [];
    const form0 = forms[0] || { statMob: '8920000', visualMob: '8920000' };
    const bodyMax = maxHpOfBodyForm(listId, form0);
    const cdSec = Math.max(5, Number(script.faceSwitch?.cdSec) || 25);
    return {
      listId: String(listId),
      kind: 'bloodyQueen',
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
      bqNextSwitchAt: 0,
      bqSwitchCdMs: cdSec * 1000,
      bqSwitching: false,
    };
  }

  function pierreSplitCfg(script = fight?.script) {
    const s = script || {};
    const hat = s.split?.hat || {};
    const chase = s.split?.chase || {};
    return {
      hatId: pad(hat.visualMob || hat.statMob || '8900001'),
      chaseId: pad(chase.visualMob || chase.statMob || '8900002'),
      hatOff: {
        x: Number(hat.offset?.x) || -140,
        y: Number(hat.offset?.y) || 0,
      },
      chaseOff: {
        x: Number(chase.offset?.x) || 160,
        y: Number(chase.offset?.y) || 0,
      },
      splitRatio: Number(s.splitHpRatio) > 0 ? Number(s.splitHpRatio) : 0.5,
    };
  }

  function pierreChaseCfg(script = fight?.script) {
    const c = script?.chase || {};
    return {
      speedPx: Number(c.speedPx) > 0 ? Number(c.speedPx) : 100,
      orbitPx: Number(c.orbitPx) > 0 ? Number(c.orbitPx) : 90,
      contactPx: Number(c.contactPx) > 0 ? Number(c.contactPx) : 88,
      contactDamR: Number(c.contactDamR) > 0 ? Number(c.contactDamR) : 0.5,
      contactCdSec: Number(c.contactCdSec) > 0 ? Number(c.contactCdSec) : 1,
    };
  }

  function linkPierreSharedHp(chase, body) {
    if (!chase || !body) return chase;
    Object.defineProperty(chase, 'hp', {
      get() { return body.hp; },
      set(v) { body.hp = v; },
      configurable: true,
      enumerable: true,
    });
    Object.defineProperty(chase, 'maxHp', {
      get() { return body.maxHp; },
      set(v) { body.maxHp = v; },
      configurable: true,
      enumerable: true,
    });
    return chase;
  }

  function createPierreFight(listId, script) {
    const bodyId = pad(script.bodyStatMob || '8900000');
    const bodyMax = maxHpOf(listId, bodyId);
    const split = pierreSplitCfg(script);
    const body = {
      key: 'body',
      uid: 'body',
      isBoss: true,
      visualId: bodyId,
      hp: bodyMax,
      maxHp: bodyMax,
      targetable: true,
      invincible: false,
      dead: false,
    };
    const chase = linkPierreSharedHp({
      key: 'pierreChase',
      uid: 'pierreChase',
      isBoss: true,
      visualId: split.chaseId,
      targetable: false,
      invincible: false,
      dead: false,
      active: false,
      z: 21,
      pos: null,
      orbitDir: -1,
      contactAcc: 0,
    }, body);
    return {
      listId: String(listId),
      kind: 'pierre',
      script,
      phase: 1,
      bodyZ: Number.isFinite(Number(script.bodyZ)) ? Number(script.bodyZ) : 20,
      body,
      pierreChase: chase,
      pierreSplitting: false,
      handL: null,
      handR: null,
      arms: [],
      chest: null,
      mode: 'fight',
      rewardsGranted: false,
    };
  }

  function createBanbanFight(listId, script) {
    const bodyId = pad(script.bodyStatMob || '8910000');
    const bodyMax = maxHpOf(listId, bodyId);
    return {
      listId: String(listId),
      kind: 'banban',
      script,
      phase: 1,
      bodyZ: Number.isFinite(Number(script.bodyZ)) ? Number(script.bodyZ) : 20,
      body: {
        key: 'body',
        uid: 'body',
        isBoss: true,
        visualId: bodyId,
        hp: bodyMax,
        maxHp: bodyMax,
        targetable: true,
        invincible: false,
        dead: false,
      },
      banbanMinions: [],
      banbanPhase: null,
      banbanPhaseUntil: 0,
      banbanWindowUntil: 0,
      banbanResolving: false,
      handL: null,
      handR: null,
      arms: [],
      chest: null,
      mode: 'fight',
      rewardsGranted: false,
    };
  }

  function createVellumFight(listId, script) {
    const kit = script.vellumKit || {};
    const bodyId = pad(script.bodyStatMob || kit.bodyMob || '8930000');
    const tailId = pad(kit.tailMob || '8930001');
    const bodyMax = maxHpOf(listId, bodyId);
    const body = {
      key: 'body',
      uid: 'body',
      isBoss: true,
      visualId: bodyId,
      hp: bodyMax,
      maxHp: bodyMax,
      targetable: true,
      invincible: false,
      dead: false,
    };
    const tail = linkPierreSharedHp({
      key: 'vellumTail',
      uid: 'vellumTail',
      isBoss: true,
      visualId: tailId,
      targetable: false,
      invincible: false,
      dead: false,
      active: false,
      z: 22,
      pos: null,
      side: 1,
      nextAppearAt: 0,
      activeUntil: 0,
      emergeAt: 0,
      pendingDmgAt: 0,
      hitSeq: 0,
    }, body);
    return {
      listId: String(listId),
      kind: 'vellum',
      script,
      phase: 1,
      bodyZ: Number.isFinite(Number(script.bodyZ)) ? Number(script.bodyZ) : 20,
      body,
      vellumTail: tail,
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
    } else if (isPierre()) {
      const split = pierreSplitCfg();
      const bodyX = fight.phase >= 2 ? (b.x + split.hatOff.x) : b.x;
      const bodyY = fight.phase >= 2 ? (b.y + split.hatOff.y) : b.y;
      order.push({
        key: 'body',
        z: fight.bodyZ || 20,
        unit: fight.body,
        x: bodyX,
        y: bodyY,
      });
      const chase = fight.pierreChase;
      if (fight.phase >= 2 && chase && !chase.dead) {
        const cx = Number.isFinite(Number(chase.pos?.x)) ? chase.pos.x : (b.x + split.chaseOff.x);
        const cy = Number.isFinite(Number(chase.pos?.y)) ? chase.pos.y : (b.y + split.chaseOff.y);
        order.push({
          key: 'pierreChase',
          z: chase.z || 21,
          unit: chase,
          flipX: !!chase.flipX,
          x: cx,
          y: cy,
        });
      }
    } else if (isBanban()) {
      order.push({
        key: 'body',
        z: fight.bodyZ || 20,
        unit: fight.body,
        x: b.x,
        y: b.y,
      });
      (fight.banbanMinions || []).forEach((m) => {
        if (!m || m.dead) return;
        order.push({
          key: m.key,
          z: m.z || 22,
          unit: m,
          x: b.x + (m.offset?.x || 0),
          y: b.y + (m.offset?.y || 0),
        });
      });
    } else if (isVellum()) {
      order.push({
        key: 'body',
        z: fight.bodyZ || 20,
        unit: fight.body,
        x: b.x,
        y: b.y,
      });
      const tail = fight.vellumTail;
      if (tail && tail.active && !tail.dead) {
        const tx = Number.isFinite(Number(tail.pos?.x)) ? tail.pos.x : b.x;
        const ty = Number.isFinite(Number(tail.pos?.y)) ? tail.pos.y : b.y;
        order.push({
          key: 'vellumTail',
          z: tail.z || 22,
          unit: tail,
          flipX: !!tail.flipX,
          x: tx,
          y: ty,
        });
      }
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

    if (isSimple() || isBloodyQueen()) {
      if (fight.body.hp > 0 && !fight.body.invincible && fight.body.targetable) {
        return { kind: 'body', unit: fight.body };
      }
      return null;
    }

    if (isPierre()) {
      const cands = [];
      if (fight.body.hp > 0 && !fight.body.invincible && fight.body.targetable) {
        cands.push({ kind: 'body', unit: fight.body });
      }
      if (fight.phase >= 2 && fight.pierreChase && fight.pierreChase.targetable
        && !fight.pierreChase.dead && fight.body.hp > 0 && !fight.body.invincible) {
        cands.push({ kind: 'pierreChase', unit: fight.pierreChase });
      }
      if (!cands.length) return null;
      if (cands.length === 1) return cands[0];
      const playerEl = getBossPlayerEl();
      const px = parseFloat(playerEl?.style?.left) || 0;
      cands.sort((a, b) => {
        const ax = parseFloat(slotEl(a.kind)?.style?.left) || 0;
        const bx = parseFloat(slotEl(b.kind)?.style?.left) || 0;
        return Math.abs(ax - px) - Math.abs(bx - px);
      });
      return cands[0];
    }

    if (isBanban()) {
      const cands = [];
      if (fight.body.hp > 0 && !fight.body.invincible && fight.body.targetable) {
        cands.push({ kind: 'body', unit: fight.body });
      }
      (fight.banbanMinions || []).forEach((m) => {
        if (m && m.targetable && !m.dead && m.hp > 0) cands.push({ kind: m.key, unit: m });
      });
      if (!cands.length) return null;
      cands.sort((a, b) => (a.unit.hp / Math.max(1, a.unit.maxHp)) - (b.unit.hp / Math.max(1, b.unit.maxHp)));
      return cands[0];
    }

    if (isVellum()) {
      const cands = [];
      if (fight.body.hp > 0 && !fight.body.invincible && fight.body.targetable) {
        cands.push({ kind: 'body', unit: fight.body });
      }
      const tail = fight.vellumTail;
      if (tail && tail.active && tail.targetable && !tail.dead && fight.body.hp > 0) {
        cands.push({ kind: 'vellumTail', unit: tail });
      }
      if (!cands.length) return null;
      if (cands.length === 1) return cands[0];
      const playerEl = getBossPlayerEl();
      const px = parseFloat(playerEl?.style?.left) || 0;
      cands.sort((a, b) => {
        const ax = parseFloat(slotEl(a.kind)?.style?.left) || 0;
        const bx = parseFloat(slotEl(b.kind)?.style?.left) || 0;
        return Math.abs(ax - px) - Math.abs(bx - px);
      });
      return cands[0];
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
    if (isBloodyQueen()) return;
    if (isPierre()) {
      tryPierreSplit();
      return;
    }
    if (isBanban()) return;
    if (isVellum()) return;
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
    const max = maxHpOfBodyForm(fight.listId, form);
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
    fight.body.maxHp = maxHpOfBodyForm(fight.listId, form);
    fight.body.hp = fight.body.maxHp;
    fight.body.invincible = false;
    fight.body.targetable = true;
    fight.body.dead = false;
    if (pad(statId) === pad(fight.script?.nohimeKit?.bodyMob || '9450023')) {
      fight.nohimeThresholdDone = false;
      fight.nohimeChallenge = null;
      fight.nohimeThresholdRunning = false;
    }

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
    if (isPierre()) {
      await onPierreDead();
      return;
    }
    if (isBanban()) {
      clearBanbanMinions({ playDie: false });
      clearBanbanBodyHold();
      fight.banbanPhase = null;
      fight.banbanResolving = false;
    }
    if (isVellum()) {
      retractVellumTail({ force: true });
    }
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

    if (isPapulatus() || isSimple() || isBloodyQueen()) {
      if (kind === 'body') return hp;
      return 0;
    }

    if (isPierre()) {
      if (kind === 'body' || kind === 'pierreChase') {
        if (fight.body?.invincible || fight.pierreSplitting) return 0;
        if (fight.phase === 1) {
          const ratio = pierreSplitCfg().splitRatio;
          const floor = Math.max(1, Math.ceil(fight.body.maxHp * ratio));
          return Math.max(0, fight.body.hp - floor);
        }
        return fight.body.hp;
      }
      return 0;
    }

    if (isBanban()) {
      if (kind === 'body') {
        if (!fight.body?.targetable) return 0;
        return hp;
      }
      if (String(kind).startsWith('banban')) return hp;
      return 0;
    }

    if (isVellum()) {
      if (kind === 'body' || kind === 'vellumTail') {
        if (fight.body?.invincible) return 0;
        return fight.body.hp;
      }
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
    let raw = Math.max(0, Math.floor(Number(dmg) || 0));
    if (isBanban() && fight?.banbanPhase === 'weaken') {
      const kind = mob?.uid || mob?.key;
      if (kind === 'body') {
        const mult = Number(banbanKitCfg()?.weakenInMult) || 1.5;
        raw = Math.floor(raw * mult);
      }
    }
    if (!mob) return raw;
    return Math.min(raw, maxDamageAllowed(mob));
  }

  /** 實際扣血後：粉豆殼鏡像／雕像保底（勿掛在 showMobDamage） */
  function afterAppliedDamage(mob, appliedDmg) {
    const dmg = Math.max(0, Math.floor(Number(appliedDmg) || 0));
    if (!mob || !(dmg > 0) || !fight) return;
    if (!isPinkBean() || pinkBeanInBodyPhase() || !fight.shell) return;
    const kind = mob.uid || mob.key;
    if (!findArm(kind)) return;
    fight.shell.hp = Math.max(0, fight.shell.hp - dmg);
    if (fight.shell.hp > 0 && mob.hp <= 0) mob.hp = 1;
  }

  function getUnitPdRate(mob) {
    if (!fight || !mob) return null;
    const id = pad(mob.visualId || mob.statMob || mob.iconId || '');
    if (!id) return null;
    const part = wzPart(fight.listId, id);
    if (!part) return null;
    const n = Number(part.PDRate);
    return Number.isFinite(n) ? Math.max(0, n) : null;
  }

  /** 技能／引導碰過單位後：優先 touched，再跑轉階（讀 fight 全域狀態） */
  function tryPhaseCheck(mobs) {
    afterExternalHits(mobs || []);
  }

  function applyDamage(target, rawDmg, isCritical) {
    if (!target?.unit || busy) return;
    let dmg = Math.floor(rawDmg);
    if (target.unit.invincible) dmg = 0;
    // 統一 resolve（IED／OHK／血線）；勿再另 cap
    if (typeof IdleHunt !== 'undefined' && IdleHunt.resolveMobHitDamage) {
      dmg = IdleHunt.resolveMobHitDamage(target.unit, dmg);
    } else {
      dmg = capIncomingDamage(target.unit, dmg);
    }
    if (!(dmg > 0)) {
      showDmg(target.unit.key, 0, false);
      return;
    }
    target.unit.hp = Math.max(0, target.unit.hp - dmg);
    showDmg(target.unit.key, dmg, isCritical);
    afterAppliedDamage(target.unit, dmg);

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
      if (target.kind === 'body') {
        tryNohimeThreshold();
        if (fight.nohimeChallenge?.active || fight.nohimeThresholdRunning) {
          syncHud();
          return;
        }
        if (target.unit.hp <= 0) {
          onZakumBodyFormDown();
          return;
        }
      }
      return;
    }

    if (isSimple() || isBloodyQueen()) {
      if (target.kind === 'body' && target.unit.hp <= 0) {
        onBodyDead();
      }
      return;
    }

    if (isPierre()) {
      if (fight.phase === 1) {
        tryPierreSplit();
        return;
      }
      if (fight.body.hp <= 0) {
        onPierreDead();
      }
      return;
    }

    if (isBanban()) {
      if (String(target.kind).startsWith('banban') && target.unit.hp <= 0) {
        onBanbanMinionDead(target.unit);
        return;
      }
      if (target.kind === 'body' && target.unit.hp <= 0) {
        onBodyDead();
      }
      return;
    }

    if (isVellum()) {
      if ((target.kind === 'body' || target.kind === 'vellumTail') && fight.body.hp <= 0) {
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
    if (isPapulatus() || isSimple() || isBloodyQueen()) {
      pushIf(fight.body);
      return out;
    }
    if (isPierre()) {
      pushIf(fight.body);
      if (fight.phase >= 2 && fight.pierreChase) pushIf(fight.pierreChase);
      return out;
    }
    if (isBanban()) {
      pushIf(fight.body);
      (fight.banbanMinions || []).forEach(pushIf);
      return out;
    }
    if (isVellum()) {
      pushIf(fight.body);
      if (fight.vellumTail?.active && fight.vellumTail.targetable) pushIf(fight.vellumTail);
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
    // 契約：優先 touched；空陣列仍跑轉階（讀 fight 全域）。勿無故全掃 getCombatMobs。
    const list = Array.isArray(mobs) ? mobs : (mobs ? [mobs] : []);
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
        // 殼損已在 afterAppliedDamage；此處只保底雕像
        if (findArm(kind) && fight.shell && !busy) {
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
        }
      });
      // 技能／普攻都可能只走這裡：門檻必須在死亡判定前
      tryNohimeThreshold();
      if (fight.nohimeChallenge?.active || fight.nohimeThresholdRunning) {
        syncHud();
        return;
      }
      list.forEach((mob) => {
        if (!mob || !fight) return;
        const kind = mob.uid || mob.key;
        if (kind === 'body' && mob.hp <= 0 && fight.mode === 'fight') {
          onZakumBodyFormDown();
        }
      });
      syncHud();
      return;
    }
    if (isSimple() || isBloodyQueen()) {
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
    if (isPierre()) {
      list.forEach((mob) => {
        if (!mob || !fight) return;
        const kind = mob.uid || mob.key;
        if (kind === 'chest' && mob.hp <= 0) {
          if (!busy && fight.chest && !fight.rewardsGranted) onChestDead();
        }
      });
      if (fight.phase === 1) {
        tryPierreSplit();
      } else if (fight.body.hp <= 0 && fight.mode === 'fight') {
        onPierreDead();
      }
      syncHud();
      return;
    }
    if (isBanban()) {
      list.forEach((mob) => {
        if (!mob || !fight) return;
        const kind = mob.uid || mob.key;
        if (kind === 'chest' && mob.hp <= 0) {
          if (!busy && fight.chest && !fight.rewardsGranted) onChestDead();
          return;
        }
        if (String(kind).startsWith('banban') && mob.hp <= 0 && !mob.dead) {
          onBanbanMinionDead(mob);
        }
        if (kind === 'body' && mob.hp <= 0 && fight.mode === 'fight') {
          onBodyDead();
        }
      });
      syncHud();
      return;
    }
    if (isVellum()) {
      list.forEach((mob) => {
        if (!mob || !fight) return;
        const kind = mob.uid || mob.key;
        if (kind === 'chest' && mob.hp <= 0) {
          if (!busy && fight.chest && !fight.rewardsGranted) onChestDead();
        }
      });
      if (fight.body.hp <= 0 && fight.mode === 'fight') {
        onBodyDead();
      }
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

  /** 純顯示：呼叫端應傳入已 resolve／cap 的 finalDmg（殼血不在此扣） */
  function showMobDamage(mob, dmg, isCritical, opts) {
    if (typeof DamageNumber === 'undefined') return;
    const shown = Math.max(0, Math.floor(Number(dmg) || 0));
    if (!(shown > 0) && !(Number(dmg) > 0)) return;
    DamageNumber.spawnOnMob(mob, shown, !!isCritical, opts || {});
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
      // 血腥女皇 skill1 封印：只擋技能，普攻仍可
      const skillSealed = isBloodyQueen() && (Number(fight.bqSkillSealUntil) || 0) > Date.now();
      const picked = (!skillSealed && typeof SkillCombat !== 'undefined')
        ? SkillCombat.pickNextCast?.({ wzAttackSpeed: wzAttackSpeed() })
        : null;

      if (picked) {
        hits += 1;
        const result = SkillCombat.cast(picked, combatCtx({
          wzAttackSpeed: wzAttackSpeed(),
          attackSpeedStage: wzAttackSpeed(),
        }));
        // 優先 touched：同步施法若已在 skill 內 sync，這裡只補轉階
        if (result?.cast) {
          const touched = Array.isArray(result.kills) ? result.kills : [];
          afterExternalHits(touched);
        }
        hooks?.syncOverlay?.();
        // 有 CD：不佔普攻節拍、不中斷連打
        if (picked.hasCd) continue;
        playerAtkAcc = 0;
        break;
      }

      // 封印期間略過技能鎖，讓普攻仍能打
      if (!skillSealed && typeof SkillCombat !== 'undefined'
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
        dmg = SkillMobStatus.applyOutgoingDamageMods(target.unit, dmg, {
          isCritical: !!hit.isCritical,
          skillId: null,
        });
      }
      if (!(dmg > 0) && !target.unit.invincible) break;
      // applyDamage 內統一 resolve／顯示／殼血
      applyDamage(target, dmg, !!hit.isCritical);
      if (typeof SkillMobStatus !== 'undefined'
        && typeof SkillMobStatus.afterPlayerDamagedMob === 'function') {
        SkillMobStatus.afterPlayerDamagedMob(target.unit, true, { skillId: null });
      }
      if (busy) break;
    }
    hooks?.syncOverlay?.();
  }

  function unitAttacks(listId, visualOrStatMob) {
    const mobId = pad(visualOrStatMob);
    if (isBanban()) {
      const built = buildBanbanAttacks(listId, mobId);
      if (built && built.length) return built;
    }
    if (isVellum()) {
      const built = buildVellumAttacks(listId, mobId);
      if (built && built.length) return built;
    }
    if (isPierre()) {
      const built = buildPierreAttacks(listId, mobId);
      if (built && built.length) return built;
    }
    if (isBloodyQueen()) {
      const built = buildBloodyQueenAttacks(listId, mobId);
      if (built && built.length) return built;
    }
    const kit = nohimeKitCfg(listId);
    if (kit && mobId === pad(kit.bodyMob || '9450023')) {
      const merged = buildNohimeAttacks(listId);
      if (merged && merged.length) return merged;
    }

    const part = wzPart(listId, visualOrStatMob);
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

  function hurtPlayerFromBoss(slotKey, dmg, opts = {}) {
    let amount = Math.max(0, Math.floor(Number(dmg) || 0));
    if (isBanban() && slotKey === 'body' && fight?.banbanPhase === 'buff') {
      const mult = Number(banbanKitCfg()?.buffOutMult) || 1.2;
      amount = Math.floor(amount * mult);
    }
    if (typeof SkillMobStatus !== 'undefined'
      && typeof SkillMobStatus.applyIncomingMobDamageMods === 'function') {
      amount = SkillMobStatus.applyIncomingMobDamageMods(
        { uid: slotKey, isBoss: true },
        amount,
      );
    }
    if (!(amount > 0)) return;
    if (typeof IdleHunt !== 'undefined' && IdleHunt.applyPlayerDamage) {
      IdleHunt.applyPlayerDamage(amount, {
        mobLevel: 70,
        isBoss: true,
        mob: { uid: slotKey, isBoss: true },
        ignoreMitigation: !!opts.ignoreMitigation,
        trueDamage: !!opts.trueDamage,
        ignoreHurtIframe: !!opts.ignoreHurtIframe,
      });
    }
    hooks?.syncPlayerHp?.();
  }

  function nohimeKitCfg(listId) {
    return fight?.script?.nohimeKit || phaseScript(listId)?.nohimeKit || null;
  }

  function isNohimeBodyForm() {
    if (!fight || !isPapulatus()) return false;
    const kit = nohimeKitCfg(fight.listId);
    if (!kit) return false;
    const form = currentBodyForm();
    return pad(form?.statMob) === pad(kit.bodyMob || '9450023');
  }

  function mobAnimMs(mobId, actionKey, fallback = 2000) {
    if (typeof IdleMobAnim !== 'undefined' && IdleMobAnim.actionDurationMs) {
      const ms = Number(IdleMobAnim.actionDurationMs(pad(mobId), actionKey)) || 0;
      if (ms > 0) return ms;
    }
    return fallback;
  }

  function baseBossAtkDmg(listId, mobId) {
    const part = wzPart(listId, mobId);
    return Math.max(0, Number(part?.PADamage) || Number(part?.MADamage) || 0);
  }

  /** WZ基傷 × 對maxHP傷比例（tick 時再 × dmgMult） */
  function scaleWzByHpRatio(baseDmg, ratio, fallbackRatio = 1) {
    const raw = Math.max(0, Number(baseDmg) || 0);
    const r = Number(ratio);
    const mult = (Number.isFinite(r) && r > 0) ? r : fallbackRatio;
    return Math.max(1, Math.floor(raw * mult));
  }

  function attackHpRatioMap(kit) {
    if (!kit || typeof kit !== 'object') return {};
    return kit.attackHpRatio || kit.playerHpRatioAttacks || {};
  }

  function bloodyFaceKit(listId, mobId) {
    const kits = fight?.script?.faceKits || phaseScript(listId)?.faceKits || {};
    const id = pad(mobId);
    return kits[id] || kits[String(Number(id))] || null;
  }

  /** 血腥女皇：依當前臉組招（彈／回血／封技／連鎖傷／壓血） */
  function buildBloodyQueenAttacks(listId, mobId) {
    const id = pad(mobId);
    const kit = bloodyFaceKit(listId, id) || {};
    const exclude = new Set((kit.excludeActions || []).map((k) => String(k)));
    const part = wzPart(listId, id);
    const ratioMap = attackHpRatioMap(kit);
    const skillCfg = kit.skills || {};
    const out = [];
    const seen = new Set();
    const pushUnique = (row) => {
      const key = row?.actionKey;
      if (!key || seen.has(key) || exclude.has(key)) return;
      seen.add(key);
      out.push(row);
    };

    (part?.attacks || []).forEach((a) => {
      const actionKey = a.actionKey || `attack${a.action}`;
      if (exclude.has(actionKey)) return;
      if (kit.damageChain && actionKey === String(kit.damageChain.opener || 'attack2')) {
        const chain = Array.isArray(kit.damageChain.chain) && kit.damageChain.chain.length
          ? kit.damageChain.chain.map(String)
          : ['attack2', 'attack3', 'attack4', 'attack5', 'attack6'];
        let animMs = 0;
        const segmentDmg = Object.create(null);
        chain.forEach((ck) => {
          animMs += mobAnimMs(id, ck, 1200);
          const seg = (part?.attacks || []).find((x) => (x.actionKey || `attack${x.action}`) === ck);
          const base = Math.max(0, Number(seg?.dmg) || Number(a.dmg) || 0);
          const segR = Number(kit.damageChain.segmentHpRatio);
          segmentDmg[ck] = scaleWzByHpRatio(
            base,
            ratioMap[ck],
            (Number.isFinite(segR) && segR > 0) ? segR : 1,
          );
        });
        pushUnique({
          ...a,
          actionKey,
          animMs: Math.max(animMs, Number(a.animMs) || 0),
          dmg: scaleWzByHpRatio(a.dmg, ratioMap[actionKey], 1),
          damageChain: { chain, segmentDmg },
        });
        return;
      }
      pushUnique({
        ...a,
        actionKey,
        dmg: scaleWzByHpRatio(a.dmg, ratioMap[actionKey], 1),
      });
    });

    Object.keys(skillCfg).forEach((actionKey) => {
      if (exclude.has(actionKey)) return;
      if (typeof IdleMobAnim !== 'undefined' && !IdleMobAnim.resolveAction?.(id, actionKey)) return;
      const cfg = skillCfg[actionKey] || {};
      let animMs = Number(part?.skillAnimMs?.[actionKey]) || mobAnimMs(id, actionKey, 2000);
      if (cfg.bombAfter) {
        const bombId = pad(cfg.bombAfter.bombMob || '8920004');
        animMs += mobAnimMs(bombId, 'regen', 900) + mobAnimMs(bombId, 'attack1', 1200);
      }
      const cdSec = Number(cfg.cdSec);
      if (cdSec > 0) animMs = Math.max(animMs, cdSec * 1000);
      const row = {
        actionKey,
        dmg: 1,
        animMs,
        magic: true,
      };
      if (cfg.bombAfter) {
        row.bombAfter = {
          bombMob: pad(cfg.bombAfter.bombMob || '8920004'),
          bombCount: Math.max(1, Math.min(5, Math.floor(Number(cfg.bombAfter.bombCount) || 5))),
          bombDamR: Number(cfg.bombAfter.bombDamR) > 0 ? Number(cfg.bombAfter.bombDamR) : 0.45,
          bombBaseDmg: Number(cfg.bombAfter.bombBaseDmg) > 0
            ? Number(cfg.bombAfter.bombBaseDmg)
            : 30000,
        };
      }
      if (Number(cfg.healSelfRatio) > 0) {
        row.healSelfRatio = Number(cfg.healSelfRatio);
      }
      if (Number(cfg.sealSkillsMs) > 0) {
        row.sealSkillsMs = Math.max(100, Math.floor(Number(cfg.sealSkillsMs)));
      }
      if (Number(cfg.dropToHpRatio) > 0) {
        row.dropToHpRatio = Number(cfg.dropToHpRatio);
      }
      pushUnique(row);
    });

    return out;
  }

  /** 濃姬合成王 9450023：套用引導／鏈技／排除門檻技 */
  function buildNohimeAttacks(listId) {
    const kit = nohimeKitCfg(listId);
    if (!kit) return null;
    const bodyId = pad(kit.bodyMob || '9450023');
    const exclude = new Set((kit.excludeActions || []).map((k) => String(k)));
    const out = [];
    const seen = new Set();
    const pushUnique = (row) => {
      const key = row?.actionKey;
      if (!key || seen.has(key) || exclude.has(key)) return;
      seen.add(key);
      out.push(row);
    };

    const bodyPart = wzPart(listId, bodyId);
    (bodyPart?.attacks || []).forEach((a) => {
      const actionKey = a.actionKey || `attack${a.action}`;
      if (exclude.has(actionKey)) return;
      pushUnique({ ...a, actionKey, flashMob: bodyId, bodyMob: bodyId });
    });

    const baseDmg = baseBossAtkDmg(listId, bodyId);
    const castTicks = kit.castTicks || {};
    const skillChain = kit.skillChain || {};
    (bodyPart?.skills || []).forEach((sk) => {
      const n = Math.max(1, Math.floor(Number(sk.action) || 1));
      const actionKey = `skill${n}`;
      if (exclude.has(actionKey)) return;
      if (typeof IdleMobAnim !== 'undefined' && !IdleMobAnim.resolveAction?.(bodyId, actionKey)) return;
      const tickCfg = castTicks[actionKey];
      const chainCfg = skillChain[actionKey];
      let animMs = Number(bodyPart?.skillAnimMs?.[actionKey]) || mobAnimMs(bodyId, actionKey, 2000);
      if (chainCfg?.afterKey) {
        animMs += mobAnimMs(bodyId, chainCfg.afterKey, 1000);
      }
      const row = {
        actionKey,
        dmg: baseDmg,
        animMs,
        magic: true,
        flashMob: bodyId,
        bodyMob: bodyId,
      };
      if (tickCfg) {
        const frames = Array.isArray(tickCfg.damageFrames)
          ? tickCfg.damageFrames.map((n) => Math.max(0, Math.floor(Number(n) || 0)))
            .filter((n, i, arr) => Number.isFinite(n) && arr.indexOf(n) === i)
            .sort((a, b) => a - b)
          : null;
        row.castTicks = {
          fromFrame: Math.max(0, Math.floor(Number(tickCfg.fromFrame) || 0)),
          tickMs: Math.max(50, Number(tickCfg.tickMs) || 300),
          tickDmgRatio: Number(tickCfg.tickDmgRatio) > 0 ? Number(tickCfg.tickDmgRatio) : 0.3,
          // 有 damageFrames 時改依指定幀出傷（忽略 fromFrame／tickMs）
          damageFrames: frames && frames.length ? frames : undefined,
        };
      }
      if (chainCfg) {
        row.skillChain = {
          afterKey: String(chainCfg.afterKey || ''),
          damageFrame: Math.max(0, Math.floor(Number(chainCfg.damageFrame) || 0)),
          dmgRatio: Number(chainCfg.dmgRatio) > 0 ? Number(chainCfg.dmgRatio) : 1,
        };
      }
      pushUnique(row);
    });
    return out;
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

  function skipStandOnBossCancel() {
    return !!(fight?.nohimeThresholdRunning || fight?.nohimeChallenge?.active);
  }

  /** 單次施法內出傷：damageFrames 指定幀，或 fromFrame 起每 tickMs 一次 */
  async function runCastTickAttack(slotKey, unit, atk) {
    if (!fight || !unit || !atk?.castTicks) return;
    const el = slotEl(slotKey);
    if (!el || typeof IdleMobAnim === 'undefined') return;
    const seq = atkFxSeq;
    const castId = pad(atk.flashMob || unit.visualId);
    const bodyId = pad(atk.bodyMob || unit.visualId);
    const key = atk.actionKey;
    const dM = dmgMult(fight.listId);
    const tickRatio = Number(atk.castTicks.tickDmgRatio) > 0 ? Number(atk.castTicks.tickDmgRatio) : 0.3;
    const tickDmg = Math.max(1, Math.floor((Number(atk.dmg) || 0) * dM * tickRatio));
    const animMs = scaleDelayMs(mobAnimMs(castId, key, Number(atk.animMs) || 2000));
    const playerEl = getBossPlayerEl();

    const frameHits = Array.isArray(atk.castTicks.damageFrames) && atk.castTicks.damageFrames.length
      ? atk.castTicks.damageFrames.map((fr) => ({
        frame: fr,
        atMs: scaleDelayMs(IdleMobAnim.actionFrameOffsetMs?.(castId, key, fr) || 0),
        done: false,
      }))
      : null;
    const tickEvery = scaleDelayMs(Math.max(50, Number(atk.castTicks.tickMs) || 300));
    const startAt = scaleDelayMs(
      IdleMobAnim.actionFrameOffsetMs?.(castId, key, atk.castTicks.fromFrame) || 0,
    );

    fight.bossActionLock = { slotKey, actionKey: key };
    const unlock = () => {
      if (fight?.bossActionLock?.slotKey === slotKey && fight.bossActionLock?.actionKey === key) {
        fight.bossActionLock = null;
      }
    };

    if (!flashAttack(slotKey, castId, key)) {
      unlock();
      if (atkAcc[slotKey]) atkAcc[slotKey][key] = 0;
      return;
    }

    const applyHit = () => {
      if (playerEl && typeof IdleMobAnim.playPlayerHit === 'function') {
        IdleMobAnim.playPlayerHit(playerEl, castId, key, { immediate: true });
      }
      // 多段幀出傷會短於玩家受傷 iframe（500ms），必須略過否則只打得到 1～2 下
      hurtPlayerFromBoss(slotKey, tickDmg, { ignoreHurtIframe: true });
    };

    const started = Date.now();
    let lastTick = 0;
    let firstTickDone = false;
    while (Date.now() - started < animMs + 200) {
      if (seq !== atkFxSeq || !fight || fight.mode !== 'fight') {
        if (atkAcc[slotKey]) atkAcc[slotKey][key] = 0;
        if (!skipStandOnBossCancel()) bindVisual(slotKey, bodyId, 'stand');
        unlock();
        return;
      }
      if (unit.hp <= 0 || unit.dead) break;
      const elapsed = Date.now() - started;
      if (frameHits) {
        for (let i = 0; i < frameHits.length; i += 1) {
          const hit = frameHits[i];
          if (hit.done || elapsed < hit.atMs) continue;
          hit.done = true;
          applyHit();
        }
      } else if (elapsed >= startAt) {
        if (!firstTickDone || elapsed - lastTick >= tickEvery) {
          firstTickDone = true;
          lastTick = elapsed;
          applyHit();
        }
      }
      if (!IdleMobAnim.isActorCasting?.(el) && elapsed > 200) break;
      await sleep(TICK_MS);
    }

    if (seq !== atkFxSeq || !fight) {
      unlock();
      return;
    }
    bindVisual(slotKey, bodyId, 'stand');
    if (atkAcc[slotKey]) atkAcc[slotKey][key] = 0;
    unlock();
  }

  /** skillN 播完接 afterKey，在 after 指定幀出傷 */
  async function runSkillChainAttack(slotKey, unit, atk) {
    if (!fight || !unit || !atk?.skillChain) return;
    const el = slotEl(slotKey);
    if (!el || typeof IdleMobAnim === 'undefined') return;
    const seq = atkFxSeq;
    const castId = pad(atk.flashMob || unit.visualId);
    const bodyId = pad(atk.bodyMob || unit.visualId);
    const key = atk.actionKey;
    const afterKey = String(atk.skillChain.afterKey || '');
    const dM = dmgMult(fight.listId);
    const ratio = Number(atk.skillChain.dmgRatio) > 0 ? Number(atk.skillChain.dmgRatio) : 1;
    const hitDmg = Math.max(1, Math.floor((Number(atk.dmg) || 0) * dM * ratio));
    const playerEl = getBossPlayerEl();

    fight.bossActionLock = { slotKey, actionKey: key };
    const unlock = () => {
      if (fight?.bossActionLock?.slotKey === slotKey && fight.bossActionLock?.actionKey === key) {
        fight.bossActionLock = null;
      }
    };

    if (!flashAttack(slotKey, castId, key)) {
      unlock();
      if (atkAcc[slotKey]) atkAcc[slotKey][key] = 0;
      return;
    }
    const castCap = scaleDelayMs(mobAnimMs(castId, key, 2000) + 200);
    const castStart = Date.now();
    while (Date.now() - castStart < castCap) {
      if (seq !== atkFxSeq || !fight || fight.mode !== 'fight') {
        if (!skipStandOnBossCancel()) bindVisual(slotKey, bodyId, 'stand');
        unlock();
        return;
      }
      if (!IdleMobAnim.isActorCasting?.(el)) break;
      await sleep(TICK_MS);
    }
    if (seq !== atkFxSeq || !fight) {
      unlock();
      return;
    }
    if (unit.hp <= 0 || unit.dead) {
      if (!skipStandOnBossCancel()) bindVisual(slotKey, bodyId, 'stand');
      unlock();
      return;
    }

    if (!afterKey || !IdleMobAnim.resolveAction?.(castId, afterKey)) {
      if (!skipStandOnBossCancel()) bindVisual(slotKey, bodyId, 'stand');
      if (atkAcc[slotKey]) atkAcc[slotKey][key] = 0;
      unlock();
      return;
    }
    if (!flashAttack(slotKey, castId, afterKey)) {
      if (!skipStandOnBossCancel()) bindVisual(slotKey, bodyId, 'stand');
      if (atkAcc[slotKey]) atkAcc[slotKey][key] = 0;
      unlock();
      return;
    }

    const dmgDelay = scaleDelayMs(
      IdleMobAnim.actionFrameOffsetMs?.(castId, afterKey, atk.skillChain.damageFrame) || 0,
    );
    const afterMs = scaleDelayMs(mobAnimMs(castId, afterKey, 1200) + 200);
    const afterStart = Date.now();
    let damaged = false;
    while (Date.now() - afterStart < afterMs) {
      if (seq !== atkFxSeq || !fight || fight.mode !== 'fight') {
        if (!skipStandOnBossCancel()) bindVisual(slotKey, bodyId, 'stand');
        unlock();
        return;
      }
      if (!damaged && Date.now() - afterStart >= dmgDelay) {
        damaged = true;
        if (playerEl && typeof IdleMobAnim.playPlayerHit === 'function') {
          IdleMobAnim.playPlayerHit(playerEl, castId, key, { immediate: true });
        }
        hurtPlayerFromBoss(slotKey, hitDmg);
      }
      if (!IdleMobAnim.isActorCasting?.(el) && Date.now() - afterStart > 200) break;
      await sleep(TICK_MS);
    }

    if (seq !== atkFxSeq || !fight) {
      unlock();
      return;
    }
    bindVisual(slotKey, bodyId, 'stand');
    if (atkAcc[slotKey]) atkAcc[slotKey][key] = 0;
    unlock();
  }

  function tryNohimeThreshold() {
    if (!fight || !isNohimeBodyForm() || busy || fight.mode !== 'fight') return;
    if (fight.nohimeThresholdDone || fight.nohimeChallenge || fight.nohimeThresholdRunning) return;
    if (fight.body?.dead || fight.body?.invincible) return;
    const kit = nohimeKitCfg(fight.listId);
    const cfg = kit?.thresholdAttack;
    if (!cfg) return;
    const ratio = Number(cfg.hpRatio) > 0 ? Number(cfg.hpRatio) : 0.5;
    const floor = Math.max(1, Math.ceil(fight.body.maxHp * ratio));
    if (fight.body.hp > floor) return;
    // 鎖在門檻血量；實際施放由 run 處理（失敗可重試）
    fight.body.hp = Math.max(1, floor);
    syncHud();
    runNohimeThresholdAttack(cfg);
  }

  async function runNohimeThresholdAttack(cfg) {
    if (!fight || !isNohimeBodyForm()) return;
    if (fight.nohimeThresholdDone || fight.nohimeChallenge || fight.nohimeThresholdRunning) return;
    const slotKey = 'body';
    const unit = fight.body;
    const el = slotEl(slotKey);
    if (!el || typeof IdleMobAnim === 'undefined') return;
    const kit = nohimeKitCfg(fight.listId);
    const bodyId = pad(kit?.bodyMob || unit.visualId);
    const actionKey = String(cfg.actionKey || 'attack6');
    const need = Math.max(1, Math.floor((Number(unit.maxHp) || 1) * (Number(cfg.breakHpRatio) || 0.1)));
    const playerEl = getBossPlayerEl();
    const fieldEl = getBossFieldEl();

    fight.nohimeThresholdRunning = true;
    // 取消進行中的引導／鏈技，避免之後 bind stand 截斷門檻技
    atkFxSeq += 1;
    const seq = atkFxSeq;
    fight.bossActionLock = { slotKey, actionKey };
    IdleMobAnim.clearActorCastFlags?.(el);
    const img = IdleMobAnim.actorBodyImg?.(el);
    if (img) {
      img.dataset.bodyDone = '1';
      img.dataset.kindAction = '';
    }
    await sleep(TICK_MS);
    if (seq !== atkFxSeq || !fight || fight.mode !== 'fight') {
      fight.nohimeThresholdRunning = false;
      if (fight.bossActionLock?.slotKey === slotKey) fight.bossActionLock = null;
      return;
    }

    hooks?.onTitle?.('濃姬・必殺');
    fight.nohimeChallenge = {
      active: true,
      startHp: Number(unit.hp) || 0,
      need,
      startedAt: Date.now(),
    };
    // 檢定一開始就播 screenCenter，不等本體 attack6 開招
    if (cfg.screenCenter) {
      IdleMobAnim.playScreenCenter?.(fieldEl, bodyId, actionKey);
    }
    const challengeText = '濃姬正在準備強大的攻擊，需要造成足夠的傷害來打斷。';
    const unlock = () => {
      if (fight?.bossActionLock?.slotKey === slotKey && fight.bossActionLock?.actionKey === actionKey) {
        fight.bossActionLock = null;
      }
      if (fight) fight.nohimeThresholdRunning = false;
      hooks?.syncChallengeHud?.({ hide: true });
    };

    IdleMobAnim.clearActorCastFlags?.(el);
    let flashed = flashAttack(slotKey, bodyId, actionKey);
    if (!flashed) {
      await sleep(TICK_MS);
      IdleMobAnim.clearActorCastFlags?.(el);
      flashed = flashAttack(slotKey, bodyId, actionKey);
    }
    if (!flashed) {
      // 未成功施放：允許之後再觸發
      fight.nohimeChallenge = null;
      IdleMobAnim.clearScreenCenter?.(fieldEl);
      unlock();
      return;
    }
    fight.nohimeThresholdDone = true;

    const animMs = scaleDelayMs(mobAnimMs(bodyId, actionKey, 9120) + 200);
    const started = Date.now();
    const syncBreakHud = () => {
      const elapsed = Math.max(0, Date.now() - started);
      const remainMs = Math.max(0, animMs - elapsed);
      hooks?.syncChallengeHud?.({
        text: challengeText,
        remainMs,
        totalMs: animMs,
      });
    };
    syncBreakHud();
    let broken = false;
    while (Date.now() - started < animMs) {
      if (seq !== atkFxSeq || !fight || fight.mode !== 'fight') {
        fight.nohimeChallenge = null;
        IdleMobAnim.clearScreenCenter?.(fieldEl);
        unlock();
        return;
      }
      if (unit.hp <= 0 || unit.dead) {
        broken = true;
        break;
      }
      const damaged = Math.max(0, (Number(fight.nohimeChallenge.startHp) || 0) - (Number(unit.hp) || 0));
      syncBreakHud();
      if (damaged >= need) {
        broken = true;
        break;
      }
      if (!IdleMobAnim.isActorCasting?.(el) && Date.now() - started > 400) break;
      await sleep(TICK_MS);
    }

    if (seq !== atkFxSeq || !fight) {
      fight.nohimeChallenge = null;
      IdleMobAnim.clearScreenCenter?.(fieldEl);
      unlock();
      return;
    }

    const challenge = fight.nohimeChallenge;
    fight.nohimeChallenge = null;
    IdleMobAnim.clearScreenCenter?.(fieldEl);

    if (broken) {
      hooks?.onTitle?.('必殺打斷！');
      IdleMobAnim.clearActorCastFlags?.(el);
      hooks?.syncChallengeHud?.({ hide: true });
      if (unit.hp > 0 && !unit.dead) {
        // 打斷成功：維持 hit 約 2 秒（凍結末幀／hold），期間鎖招不輪轉
        const holdMs = scaleDelayMs(2000);
        const img = IdleMobAnim.actorBodyImg?.(el);
        el.dataset.holdAction = 'hit';
        el.dataset.hitUntil = String(Date.now() + holdMs);
        if (img) {
          img.dataset.kindAction = 'hit';
          img.dataset.frameAcc = '0';
          img.dataset.bodyDone = '0';
          IdleMobAnim.bind?.(img, bodyId, IdleMobAnim.actionForKind?.('hit') || 'hit1', 0);
        } else {
          bindVisual(slotKey, bodyId, 'hit');
          el.dataset.holdAction = 'hit';
          el.dataset.hitUntil = String(Date.now() + holdMs);
        }
        const hitStart = Date.now();
        while (Date.now() - hitStart < holdMs) {
          if (seq !== atkFxSeq || !fight || fight.mode !== 'fight') {
            if (el.dataset.holdAction === 'hit') delete el.dataset.holdAction;
            el.dataset.hitUntil = '0';
            unlock();
            return;
          }
          el.dataset.hitUntil = String(Date.now() + Math.max(50, holdMs - (Date.now() - hitStart)));
          await sleep(TICK_MS);
        }
        if (el.dataset.holdAction === 'hit') delete el.dataset.holdAction;
        el.dataset.hitUntil = '0';
        if (unit.hp > 0 && !unit.dead) bindVisual(slotKey, bodyId, 'stand');
      }
      unlock();
      if (unit.hp <= 0) onZakumBodyFormDown();
      syncHud();
      return;
    }

    const failRatio = Number(cfg.failPlayerHpRatio) > 0 ? Number(cfg.failPlayerHpRatio) : 1;
    const playerMax = Math.max(1, Number(IdleHunt?.getPlayerHp?.()?.maxHp) || 1);
    const killDmg = Math.max(1, Math.floor(playerMax * failRatio));
    hooks?.onTitle?.('必殺成功');
    if (playerEl && typeof IdleMobAnim.playPlayerHit === 'function') {
      IdleMobAnim.playPlayerHit(playerEl, bodyId, actionKey, { immediate: true });
    }
    hurtPlayerFromBoss(slotKey, killDmg, {
      ignoreMitigation: true,
      trueDamage: true,
      ignoreHurtIframe: true,
    });
    bindVisual(slotKey, bodyId, 'stand');
    unlock();
    syncHud();
    void challenge;
  }

  function clearBqBombs() {
    const playerEl = getBossPlayerEl();
    const row = playerEl?.querySelector?.(':scope > .idle-boss-bq-bombs');
    if (row) row.remove();
  }

  function syncBqBombRowAnchor(playerEl, row) {
    if (!playerEl || !row) return;
    if (row.parentElement !== playerEl) playerEl.appendChild(row);
    const anchor = typeof Paperdoll !== 'undefined' && typeof Paperdoll.getHuntFeetAnchor === 'function'
      ? Paperdoll.getHuntFeetAnchor(playerEl)
      : null;
    if (anchor && Number.isFinite(anchor.x) && Number.isFinite(anchor.y)) {
      row.style.left = `${anchor.x}px`;
      row.style.top = `${anchor.y}px`;
      row.style.transform = 'translateX(-50%)';
      return;
    }
    row.style.left = '50%';
    row.style.top = '78%';
    row.style.transform = 'translateX(-50%)';
  }

  function ensureBqBombRow(playerEl) {
    if (!playerEl) return null;
    let row = playerEl.querySelector(':scope > .idle-boss-bq-bombs');
    if (!row) {
      row = document.createElement('div');
      row.className = 'idle-boss-bq-bombs';
      playerEl.appendChild(row);
    }
    syncBqBombRowAnchor(playerEl, row);
    return row;
  }

  function tickBqBombs(dt) {
    const playerEl = getBossPlayerEl();
    const row = playerEl?.querySelector?.(':scope > .idle-boss-bq-bombs');
    if (!row || typeof IdleMobAnim === 'undefined') return;
    syncBqBombRowAnchor(playerEl, row);
    // 炸彈是 .idle-actor--mob；也直接 advance 保險
    row.querySelectorAll('.idle-boss-bq-bomb').forEach((el) => {
      IdleMobAnim.advanceActor?.(el, dt);
    });
  }

  /** 玩家腳邊 1 顆愛心彈：regen → attack1 爆炸出傷；玩家身上播 info/hit */
  async function playBqBombsOnce(cfg, seq) {
    const playerEl = getBossPlayerEl();
    if (!playerEl || typeof IdleMobAnim === 'undefined') return;
    const bombId = pad(cfg.bombMob || '8920004');
    const count = 1; // 固定一顆
    const damR = Number(cfg.bombDamR) > 0 ? Number(cfg.bombDamR) : 0.45;
    const row = ensureBqBombRow(playerEl);
    if (!row) return;
    row.innerHTML = '';

    const actor = document.createElement('div');
    // 需 idle-actor--mob 才會被 advanceActorsIn／sprite 管線推進
    actor.className = 'idle-actor idle-actor--mob idle-boss-bq-bomb';
    actor.dataset.mobId = bombId;
    actor.innerHTML = '<div class="idle-actor-sprite-stage"><img class="idle-actor-sprite" alt="" draggable="false"></div>';
    row.appendChild(actor);
    syncBqBombRowAnchor(playerEl, row);

    // regen：用 introAction 鎖住 kind，避免被 spriteKind 拉回 stand
    actor.dataset.introAction = 'regen';
    IdleMobAnim.clearActorCastFlags?.(actor);
    IdleMobAnim.bindActorSprite(actor, bombId, 'regen');
    const regenImg = IdleMobAnim.actorBodyImg?.(actor);
    if (regenImg) {
      regenImg.dataset.kindAction = 'regen';
      regenImg.dataset.frameAcc = '0';
      regenImg.dataset.bodyDone = '0';
    }

    const regenMs = scaleDelayMs(mobAnimMs(bombId, 'regen', 900) + 80);
    const regenStart = Date.now();
    while (Date.now() - regenStart < regenMs) {
      if (seq !== atkFxSeq || !fight || fight.mode !== 'fight') {
        clearBqBombs();
        return;
      }
      await sleep(TICK_MS);
    }

    // attack1：flashActorAttack 設 attackUntil，維持爆炸動畫
    delete actor.dataset.introAction;
    IdleMobAnim.clearActorCastFlags?.(actor);
    const flashed = IdleMobAnim.flashActorAttack?.(actor, 'attack1', {
      iconId: bombId,
      scaleDelayMs,
    });
    if (!flashed) {
      actor.dataset.holdAction = 'attack1';
      actor.dataset.attackUntil = String(Date.now() + scaleDelayMs(mobAnimMs(bombId, 'attack1', 1200) + 200));
      actor.dataset.attackAction = 'attack1';
      IdleMobAnim.bindActorSprite(actor, bombId, 'attack1');
      const img = IdleMobAnim.actorBodyImg?.(actor);
      if (img) {
        img.dataset.kindAction = 'attack1';
        img.dataset.frameAcc = '0';
        img.dataset.bodyDone = '0';
      }
    }

    const attackAfter = scaleDelayMs(
      (typeof IdleMobAnim.attackAfterMs === 'function'
        ? Number(IdleMobAnim.attackAfterMs(bombId, 'attack1')) || 600
        : 600),
    );
    const atkMs = scaleDelayMs(mobAnimMs(bombId, 'attack1', 1200) + 120);
    const atkStart = Date.now();
    let damaged = false;
    while (Date.now() - atkStart < atkMs) {
      if (seq !== atkFxSeq || !fight || fight.mode !== 'fight') {
        clearBqBombs();
        return;
      }
      if (!damaged && Date.now() - atkStart >= attackAfter) {
        damaged = true;
        const base = Number(cfg.bombBaseDmg) > 0
          ? Number(cfg.bombBaseDmg)
          : (baseBossAtkDmg(fight.listId, bombId) || 30000);
        const dmg = Math.max(1, Math.floor(base * damR * dmgMult(fight.listId)));
        if (typeof IdleMobAnim.playPlayerHit === 'function') {
          IdleMobAnim.playPlayerHit(playerEl, bombId, 'attack1', { immediate: true });
        }
        hurtPlayerFromBoss('bq-bomb', dmg, { ignoreHurtIframe: true });
        hooks?.syncPlayerHp?.();
      }
      await sleep(TICK_MS);
    }
    if (actor.dataset.holdAction === 'attack1') delete actor.dataset.holdAction;
    clearBqBombs();
    void count;
  }

  /** 播本體招直到結束（或超時） */
  async function playBqBodyAction(slotKey, bodyId, actionKey, seq) {
    const el = slotEl(slotKey);
    if (!el || typeof IdleMobAnim === 'undefined') return false;
    IdleMobAnim.clearActorCastFlags?.(el);
    if (!flashAttack(slotKey, bodyId, actionKey)) {
      await sleep(TICK_MS);
      IdleMobAnim.clearActorCastFlags?.(el);
      if (!flashAttack(slotKey, bodyId, actionKey)) return false;
    }
    const waitMs = scaleDelayMs(mobAnimMs(bodyId, actionKey, 1200) + 120);
    const started = Date.now();
    while (Date.now() - started < waitMs) {
      if (seq !== atkFxSeq || !fight || fight.mode !== 'fight') return false;
      if (!IdleMobAnim.isActorCasting?.(el) && Date.now() - started > 200) break;
      await sleep(TICK_MS);
    }
    return true;
  }

  /** 8920000 skill1：播完後出愛心彈 */
  async function runBqBombAfterSkill(slotKey, unit, atk) {
    if (!fight || !isBloodyQueen() || !atk?.bombAfter) return;
    const bodyId = pad(unit.visualId);
    const actionKey = atk.actionKey || 'skill1';
    atkFxSeq += 1;
    const seq = atkFxSeq;
    fight.bossActionLock = { slotKey, actionKey };
    const unlock = () => {
      if (fight?.bossActionLock?.slotKey === slotKey) fight.bossActionLock = null;
    };
    const ok = await playBqBodyAction(slotKey, bodyId, actionKey, seq);
    if (!ok || seq !== atkFxSeq || !fight) {
      clearBqBombs();
      unlock();
      return;
    }
    await playBqBombsOnce(atk.bombAfter, seq);
    if (seq !== atkFxSeq || !fight) {
      unlock();
      return;
    }
    if (unit.hp > 0 && !unit.dead) bindVisual(slotKey, bodyId, 'stand');
    unlock();
    syncHud();
  }

  /** 8920000 skill2：自補血 */
  async function runBqHealSkill(slotKey, unit, atk) {
    if (!fight || !isBloodyQueen()) return;
    const bodyId = pad(unit.visualId);
    const actionKey = atk.actionKey || 'skill2';
    const ratio = Number(atk.healSelfRatio) > 0 ? Number(atk.healSelfRatio) : 0.05;
    atkFxSeq += 1;
    const seq = atkFxSeq;
    fight.bossActionLock = { slotKey, actionKey };
    const unlock = () => {
      if (fight?.bossActionLock?.slotKey === slotKey) fight.bossActionLock = null;
    };
    await playBqBodyAction(slotKey, bodyId, actionKey, seq);
    if (seq !== atkFxSeq || !fight) {
      unlock();
      return;
    }
    // tickUnitAttack 可能傳入 body 淺拷貝：一定寫回 fight.body
    const target = (slotKey === 'body' && fight.body) ? fight.body : unit;
    if (target.hp > 0 && !target.dead) {
      const heal = Math.max(1, Math.floor((Number(target.maxHp) || 1) * ratio));
      target.hp = Math.min(Number(target.maxHp) || heal, (Number(target.hp) || 0) + heal);
      bindVisual(slotKey, bodyId, 'stand');
      syncHud();
    }
    unlock();
  }

  /** 8920001 skill1：封禁玩家技能（普攻仍可） */
  async function runBqSealSkill(slotKey, unit, atk) {
    if (!fight || !isBloodyQueen()) return;
    const bodyId = pad(unit.visualId);
    const actionKey = atk.actionKey || 'skill1';
    const sealMs = Math.max(100, Math.floor(Number(atk.sealSkillsMs) || 3000));
    atkFxSeq += 1;
    const seq = atkFxSeq;
    fight.bossActionLock = { slotKey, actionKey };
    const unlock = () => {
      if (fight?.bossActionLock?.slotKey === slotKey) fight.bossActionLock = null;
    };
    await playBqBodyAction(slotKey, bodyId, actionKey, seq);
    if (seq !== atkFxSeq || !fight) {
      unlock();
      return;
    }
    fight.bqSkillSealUntil = Date.now() + scaleDelayMs(sealMs);
    try { SkillCombat.invalidateAsyncCasts?.(); } catch (_) { /* ignore */ }
    if (unit.hp > 0 && !unit.dead) bindVisual(slotKey, bodyId, 'stand');
    unlock();
    syncHud();
  }

  /** 8920002 skill1：將玩家壓到最大 HP 的 dropToHpRatio（預設 1%） */
  async function runBqDropHpSkill(slotKey, unit, atk) {
    if (!fight || !isBloodyQueen()) return;
    const bodyId = pad(unit.visualId);
    const actionKey = atk.actionKey || 'skill1';
    const ratio = Number(atk.dropToHpRatio) > 0 ? Number(atk.dropToHpRatio) : 0.01;
    atkFxSeq += 1;
    const seq = atkFxSeq;
    fight.bossActionLock = { slotKey, actionKey };
    const unlock = () => {
      if (fight?.bossActionLock?.slotKey === slotKey) fight.bossActionLock = null;
    };
    await playBqBodyAction(slotKey, bodyId, actionKey, seq);
    if (seq !== atkFxSeq || !fight) {
      unlock();
      return;
    }
    const playerEl = getBossPlayerEl();
    const cur = IdleHunt?.getPlayerHp?.() || { hp: 0, maxHp: 1 };
    const maxHp = Math.max(1, Number(cur.maxHp) || 1);
    const floorHp = Math.max(1, Math.floor(maxHp * ratio));
    const nowHp = Math.max(0, Number(cur.hp) || 0);
    const dmg = Math.max(0, nowHp - floorHp);
    if (dmg > 0) {
      if (playerEl && typeof IdleMobAnim?.playPlayerHit === 'function') {
        IdleMobAnim.playPlayerHit(playerEl, bodyId, actionKey, { immediate: true });
      }
      hurtPlayerFromBoss(slotKey, dmg, {
        ignoreMitigation: true,
        trueDamage: true,
        ignoreHurtIframe: true,
      });
    }
    if (unit.hp > 0 && !unit.dead) bindVisual(slotKey, bodyId, 'stand');
    unlock();
    syncHud();
  }

  /** 8920001／班班／貝倫：完整播連鎖，每段跳一次 WZ 表定傷害；有 areaWarning 則在玩家腳邊 */
  async function runBqDamageChain(slotKey, unit, atk) {
    if (!fight || (!isBloodyQueen() && !isBanban() && !isVellum())) return;
    const cfg = atk.damageChain;
    if (!cfg) return;
    const bodyId = pad(unit.visualId);
    const chain = Array.isArray(cfg.chain) ? cfg.chain.map(String) : [];
    if (!chain.length) return;
    const el = slotEl(slotKey);
    if (!el || typeof IdleMobAnim === 'undefined') return;
    const dM = dmgMult(fight.listId);
    const playerEl = getBossPlayerEl();
    const segHpRatio = Number(cfg.segmentHpRatio);

    atkFxSeq += 1;
    const seq = atkFxSeq;
    fight.bossActionLock = { slotKey, actionKey: chain[0] };
    const unlock = () => {
      if (fight?.bossActionLock?.slotKey === slotKey) fight.bossActionLock = null;
    };

    for (let i = 0; i < chain.length; i += 1) {
      if (seq !== atkFxSeq || !fight || fight.mode !== 'fight') {
        if (playerEl) IdleMobAnim.clearAreaWarning?.(playerEl, { flushDamage: false });
        unlock();
        return;
      }
      if (unit.hp <= 0 || unit.dead) break;
      const actionKey = chain[i];
      fight.bossActionLock = { slotKey, actionKey };
      IdleMobAnim.clearActorCastFlags?.(el);
      if (!flashAttack(slotKey, bodyId, actionKey)) {
        await sleep(TICK_MS);
        IdleMobAnim.clearActorCastFlags?.(el);
        if (!flashAttack(slotKey, bodyId, actionKey)) continue;
      }

      let segDmg = Math.max(0, Math.floor((Number(cfg.segmentDmg?.[actionKey]) || Number(atk.dmg) || 0) * dM));
      if (Number.isFinite(segHpRatio) && segHpRatio > 0) {
        const playerMax = Math.max(1, Number(IdleHunt?.getPlayerHp?.()?.maxHp) || 1);
        segDmg = Math.max(1, Math.floor(playerMax * segHpRatio * dM));
      }

      const hasAw = !!(playerEl
        && typeof IdleMobAnim.hasAreaWarningAttack === 'function'
        && IdleMobAnim.hasAreaWarningAttack(bodyId, actionKey)
        && typeof IdleMobAnim.playAreaWarning === 'function');

      if (hasAw && segDmg > 0) {
        let damaged = false;
        const applySegHit = () => {
          if (damaged || seq !== atkFxSeq || !fight || fight.mode !== 'fight') return;
          damaged = true;
          if (playerEl && typeof IdleMobAnim.playPlayerHit === 'function') {
            IdleMobAnim.playPlayerHit(playerEl, bodyId, actionKey, { immediate: true });
          }
          hurtPlayerFromBoss(slotKey, segDmg);
          hooks?.syncPlayerHp?.();
        };
        IdleMobAnim.playAreaWarning(playerEl, bodyId, actionKey, { onDamage: applySegHit });
        const awDelay = Number(IdleMobAnim.areaWarningDamageDelayMs?.(bodyId, actionKey)) || 0;
        const waitMs = scaleDelayMs(Math.max(
          mobAnimMs(bodyId, actionKey, 1200),
          awDelay,
          1200,
        ) + 120);
        const started = Date.now();
        while (Date.now() - started < waitMs) {
          if (seq !== atkFxSeq || !fight || fight.mode !== 'fight') {
            IdleMobAnim.clearAreaWarning?.(playerEl, { flushDamage: false });
            unlock();
            return;
          }
          if (!IdleMobAnim.isActorCasting?.(el)
            && !IdleMobAnim.isAreaWarningActive?.(playerEl)
            && Date.now() - started > 200) {
            break;
          }
          await sleep(TICK_MS);
        }
        if (!damaged) applySegHit();
        continue;
      }

      const delay = typeof IdleMobAnim !== 'undefined'
        ? (Number(IdleMobAnim.mobDamageDelayMs?.(bodyId, actionKey)) || 0)
        : 0;
      if (segDmg > 0) {
        scheduleBossAtkFx(delay, () => {
          if (seq !== atkFxSeq || !fight || fight.mode !== 'fight') return;
          if (playerEl && typeof IdleMobAnim?.playPlayerHit === 'function') {
            IdleMobAnim.playPlayerHit(playerEl, bodyId, actionKey, { immediate: true });
          }
          hurtPlayerFromBoss(slotKey, segDmg);
          hooks?.syncPlayerHp?.();
        });
      }

      const waitMs = scaleDelayMs(mobAnimMs(bodyId, actionKey, 1200) + 120);
      const started = Date.now();
      while (Date.now() - started < waitMs) {
        if (seq !== atkFxSeq || !fight || fight.mode !== 'fight') {
          unlock();
          return;
        }
        if (!IdleMobAnim.isActorCasting?.(el) && Date.now() - started > 200) break;
        await sleep(TICK_MS);
      }
    }

    if (seq !== atkFxSeq || !fight) {
      unlock();
      return;
    }
    if (unit.hp > 0 && !unit.dead) bindVisual(slotKey, bodyId, 'stand');
    unlock();
    syncHud();
  }

  async function tryBloodyFaceSwitch() {
    if (!fight || !isBloodyQueen() || busy || fight.bqSwitching) return;
    if (fight.mode !== 'fight') return;
    if (fight.bossActionLock) return;
    if (fight.body?.hp <= 0 || fight.body?.dead) return;
    const el = slotEl('body');
    if (el && typeof IdleMobAnim !== 'undefined' && IdleMobAnim.isActorCasting?.(el)) return;
    const now = Date.now();
    if (!(fight.bqNextSwitchAt > 0) || now < fight.bqNextSwitchAt) return;

    const forms = fight.script.bodyForms || [];
    if (forms.length < 2) return;
    const next = ((Number(fight.bodyFormIndex) || 0) + 1) % forms.length;
    const form = forms[next];
    const visualId = pad(form?.visualMob || form?.statMob);
    if (!visualId) return;

    fight.bqSwitching = true;
    busy = true;
    atkFxSeq += 1;
    const seq = atkFxSeq;
    fight.bossActionLock = { slotKey: 'body', actionKey: 'regen' };
    fight.bodyFormIndex = next;
    fight.body.visualId = visualId;
    if (atkAcc.body) atkAcc.body = Object.create(null);

    if (typeof IdleMobAnim !== 'undefined' && IdleMobAnim.resolveAction?.(visualId, 'regen')) {
      await playAnim('body', visualId, 'regen');
    } else {
      bindVisual('body', visualId, 'stand');
    }
    if (seq !== atkFxSeq || !fight) {
      if (fight) {
        fight.bqSwitching = false;
        fight.bossActionLock = null;
      }
      busy = false;
      return;
    }
    bindVisual('body', visualId, 'stand');
    fight.bqNextSwitchAt = Date.now() + (Number(fight.bqSwitchCdMs) || 25000);
    fight.bqSwitching = false;
    fight.bossActionLock = null;
    busy = false;
    syncHud();
  }

  function tickUnitAttack(slotKey, unit, attackList, dt) {
    if (!unit || unit.dead || unit.hp <= 0) return;
    if (slotKey !== 'body' && !unit.active) return;
    if (slotKey === 'body' && fight.body.hp <= 0) return;
    if (slotKey === 'body' && fight.nohimeChallenge?.active) return;
    if (slotKey === 'body' && fight.bqSwitching) return;
    // 引導／鏈技／門檻等非同步招式進行中：禁止下一招插入截斷
    if (fight.bossActionLock?.slotKey === slotKey) return;

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
      if (!(dmg > 0)
        && !atk.castTicks && !atk.skillChain && !atk.bombAfter && !atk.damageChain
        && !atk.healSelfRatio && !atk.sealSkillsMs && !atk.dropToHpRatio && !atk.playerHpRatio
        && !atk.banbanSummon) {
        continue;
      }
      const castId = pad(atk.flashMob || iconId);
      const isAreaWarn = !atk.channel && !atk.castTicks && !atk.skillChain
        && !atk.bombAfter && !atk.damageChain && !atk.healSelfRatio && !atk.sealSkillsMs && !atk.dropToHpRatio
        && !atk.banbanSummon
        && typeof IdleMobAnim !== 'undefined'
        && IdleMobAnim.hasAreaWarningAttack?.(castId, key);
      if (isAreaWarn && awActive) continue;
      ready.push({ atk, key, dmg, isAreaWarn: !!isAreaWarn, castId });
    }
    if (!ready.length) return;

    const last = String(accMap._lastAction || '');
    let pool = ready.filter((r) => r.key !== last);
    if (!pool.length) pool = ready;
    // 引導／鏈技就緒時優先，否則會被短 CD 普攻永遠擠掉
    const specialReady = pool.filter((r) => r.atk.channel || r.atk.sleep || r.atk.castTicks || r.atk.skillChain
      || r.atk.bombAfter || r.atk.damageChain || r.atk.healSelfRatio || r.atk.sealSkillsMs || r.atk.dropToHpRatio
      || r.atk.banbanSummon);
    if (specialReady.length) pool = specialReady;
    const pick = pool[Math.floor(Math.random() * pool.length)];
    if (!pick) return;

    const { atk, key, dmg, isAreaWarn, castId } = pick;
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

    if (atk.castTicks) {
      runCastTickAttack(slotKey, unit, atk);
      return;
    }

    if (atk.skillChain) {
      runSkillChainAttack(slotKey, unit, atk);
      return;
    }

    if (atk.bombAfter) {
      runBqBombAfterSkill(slotKey, unit, atk);
      return;
    }

    if (atk.damageChain) {
      runBqDamageChain(slotKey, unit, atk);
      return;
    }

    if (atk.banbanSummon) {
      runBanbanSummonSkill(slotKey, unit, atk);
      return;
    }

    if (atk.healSelfRatio) {
      runBqHealSkill(slotKey, unit, atk);
      return;
    }

    if (atk.sealSkillsMs) {
      runBqSealSkill(slotKey, unit, atk);
      return;
    }

    if (atk.dropToHpRatio) {
      runBqDropHpSkill(slotKey, unit, atk);
      return;
    }

    let hitDmg = dmg;
    if (Number(atk.playerHpRatio) > 0) {
      const playerMax = Math.max(1, Number(IdleHunt?.getPlayerHp?.()?.maxHp) || 1);
      hitDmg = Math.max(1, Math.floor(playerMax * Number(atk.playerHpRatio) * dM));
    }

    if (!flashAttack(slotKey, castId, key)) {
      // flash 失敗：把 CD 略推後，避免同招卡死輪轉
      accMap[key] = Math.max(0, ((Number(atk.animMs) || 1200) / 1000) * cdM * 0.5);
      return;
    }

    const hasEffect0 = typeof IdleMobAnim !== 'undefined'
      && (IdleMobAnim.effect0ActionKeys?.(castId, key) || []).length > 0;

    const applyHitAndDamage = (immediateHit) => {
      if (playerEl && typeof IdleMobAnim?.playPlayerHit === 'function') {
        IdleMobAnim.playPlayerHit(playerEl, castId, key, immediateHit ? { immediate: true } : undefined);
      }
      hurtPlayerFromBoss(slotKey, hitDmg);
    };

    if (isAreaWarn && playerEl && typeof IdleMobAnim.playAreaWarning === 'function') {
      const ok = IdleMobAnim.playAreaWarning(playerEl, castId, key, {
        onDamage: () => {
          applyHitAndDamage(true);
          if (hasEffect0 && typeof IdleMobAnim.playEffect0Row === 'function') {
            IdleMobAnim.playEffect0Row({
              iconId: castId,
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
      ? (Number(IdleMobAnim.mobDamageDelayMs?.(castId, key)) || 0)
      : 0;
    if (playerEl && typeof IdleMobAnim.playPlayerHit === 'function') {
      IdleMobAnim.playPlayerHit(playerEl, castId, key, { delayMs: delay });
    }
    scheduleBossAtkFx(delay, () => {
      if (hasEffect0 && typeof IdleMobAnim.playEffect0Row === 'function') {
        IdleMobAnim.playEffect0Row({
          iconId: castId,
          bodyAction: key,
          fieldEl: getBossFieldEl(),
          playerEl,
          tileWidth: 128,
        });
      }
      hurtPlayerFromBoss(slotKey, hitDmg);
    });
    hooks?.syncPlayerHp?.();
  }

  function tickBoss(dt) {
    if (!fight || busy || fight.mode !== 'fight') return;
    if (typeof IdleHunt !== 'undefined' && IdleHunt.isPlayerDead?.()) return;

    if (isBloodyQueen()) {
      tryBloodyFaceSwitch();
      if (busy || fight.bqSwitching) return;
      const form = currentBodyForm() || (fight.script.bodyForms || [])[0];
      const statId = form?.statMob || fight.body.visualId;
      const attacks = unitAttacks(fight.listId, statId);
      // 直接傳 fight.body，避免 skill2 回血寫到淺拷貝
      fight.body.active = true;
      tickUnitAttack('body', fight.body, attacks, dt);
      return;
    }

    if (isPierre()) {
      if (fight.phase === 1) tryPierreSplit();
      if (busy || fight.pierreSplitting) return;
      fight.body.active = true;
      const attacks = unitAttacks(fight.listId, fight.body.visualId);
      tickUnitAttack('body', fight.body, attacks, dt);
      tickPierreChase(dt);
      return;
    }

    if (isBanban()) {
      tickBanbanPhases(dt);
      if (busy || fight.banbanResolving) return;
      (fight.banbanMinions || []).forEach((m) => {
        if (!m || m.dead || !(m.hp > 0)) return;
        m.active = true;
        const mAtk = unitAttacks(fight.listId, m.visualId);
        tickUnitAttack(m.key, m, mAtk, dt);
      });
      // window：本體鎖 skillAfter1 不普攻；weaken：鎖 skillFail 不普攻
      if (fight.banbanPhase === 'window' || fight.banbanPhase === 'weaken') return;
      fight.body.active = true;
      let attacks = unitAttacks(fight.listId, fight.body.visualId);
      if (fight.banbanPhase) {
        attacks = attacks.filter((a) => !a.banbanSummon);
      }
      tickUnitAttack('body', fight.body, attacks, dt);
      return;
    }

    if (isVellum()) {
      tickVellumTail(dt);
      if (busy) return;
      fight.body.active = true;
      const attacks = unitAttacks(fight.listId, fight.body.visualId);
      tickUnitAttack('body', fight.body, attacks, dt);
      return;
    }

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
      tryNohimeThreshold();
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
    IdleMobAnim.tickScreenCenter?.(getBossFieldEl(), dt);
    tickBqBombs(dt);
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
    // 班班：小怪存活期間 HUD 顯示小怪合計血（同西格諾斯護衛）
    if (isBanban()) {
      const minions = fight.banbanMinions || [];
      const alive = minions.filter((m) => m && !m.dead && m.hp > 0);
      if (alive.length) {
        const hp = minions.reduce((sum, m) => {
          if (!m || m.dead) return sum;
          return sum + Math.max(0, Number(m.hp) || 0);
        }, 0);
        const maxHp = minions.reduce((sum, m) => sum + Math.max(1, Number(m?.maxHp) || 1), 0);
        return { hp, maxHp: Math.max(1, maxHp), phase: fight.phase, mode: fight.mode };
      }
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
    'fromMob', 'viaMob', 'mob', 'visualId', 'bodyMob', 'skillMob', 'bombMob', 'minionMob', 'tailMob',
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
    (wzRow(listId)?.extraMobs || []).forEach((id) => add(id));
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

  function pierreKit(listId, mobId) {
    const kits = fight?.script?.pierreKits || phaseScript(listId)?.pierreKits || {};
    const id = pad(mobId);
    return kits[id] || kits[String(Number(id))] || {};
  }

  function buildPierreAttacks(listId, mobId) {
    const id = pad(mobId);
    const kit = pierreKit(listId, id);
    const exclude = new Set((kit.excludeActions || []).map((k) => String(k)));
    const ratioMap = attackHpRatioMap(kit);
    const cdMap = kit.attackCdSec || {};
    const part = wzPart(listId, id);
    const out = [];
    (part?.attacks || []).forEach((a) => {
      const actionKey = a.actionKey || `attack${a.action}`;
      if (!actionKey || exclude.has(actionKey)) return;
      const row = {
        ...a,
        actionKey,
        dmg: scaleWzByHpRatio(a.dmg, ratioMap[actionKey], 1),
      };
      const cdSec = Number(cdMap[actionKey]);
      if (cdSec > 0) {
        row.animMs = Math.max(Number(row.animMs) || 0, cdSec * 1000);
      }
      out.push(row);
    });
    return out;
  }

  function banbanKitCfg(listId = fight?.listId) {
    return fight?.script?.banbanKit || phaseScript(listId)?.banbanKit || {};
  }

  function banbanMinionKitCfg(listId = fight?.listId) {
    return fight?.script?.minionKit || phaseScript(listId)?.minionKit || {};
  }

  function buildBanbanAttacks(listId, mobId) {
    const id = pad(mobId);
    const kit = banbanKitCfg(listId);
    const minionId = pad(kit.minionMob || '8910001');
    const isMinion = id === minionId;
    const face = isMinion ? banbanMinionKitCfg(listId) : kit;
    const exclude = new Set(((!isMinion && kit.excludeActions) || []).map((k) => String(k)));
    const ratioMap = attackHpRatioMap(face);
    const cdMap = face.attackCdSec || kit.attackCdSec || {};
    const part = wzPart(listId, id);
    const out = [];
    const seen = new Set();
    const pushUnique = (row) => {
      const key = row?.actionKey;
      if (!key || seen.has(key) || exclude.has(key)) return;
      seen.add(key);
      out.push(row);
    };

    (part?.attacks || []).forEach((a) => {
      const actionKey = a.actionKey || `attack${a.action}`;
      if (!actionKey || exclude.has(actionKey)) return;
      // 出傷 = WZ基傷 × 對maxHP傷；tick 時再 × dmgMult
      if (!isMinion && kit.damageChain && actionKey === String(kit.damageChain.opener || 'attack4')) {
        const chain = Array.isArray(kit.damageChain.chain) && kit.damageChain.chain.length
          ? kit.damageChain.chain.map(String)
          : ['attack4', 'attack5', 'attack6', 'attack7', 'attack8'];
        const segR = Number(kit.damageChain.segmentHpRatio);
        const fallbackSegR = (Number.isFinite(segR) && segR > 0) ? segR : 1;
        let animMs = 0;
        const segmentDmg = Object.create(null);
        chain.forEach((ck) => {
          animMs += mobAnimMs(id, ck, 900);
          const seg = (part?.attacks || []).find((x) => (x.actionKey || `attack${x.action}`) === ck);
          const base = Math.max(0, Number(seg?.dmg) || Number(a.dmg) || 0);
          segmentDmg[ck] = scaleWzByHpRatio(base, ratioMap[ck], fallbackSegR);
        });
        const row = {
          ...a,
          actionKey,
          animMs: Math.max(animMs, Number(a.animMs) || 0),
          dmg: scaleWzByHpRatio(a.dmg, ratioMap[actionKey], fallbackSegR),
          damageChain: { chain, segmentDmg },
        };
        const cdSec = Number(cdMap[actionKey]);
        if (cdSec > 0) row.animMs = Math.max(row.animMs, cdSec * 1000);
        pushUnique(row);
        return;
      }
      const row = {
        ...a,
        actionKey,
        dmg: scaleWzByHpRatio(a.dmg, ratioMap[actionKey], 1),
      };
      const cdSec = Number(cdMap[actionKey]);
      if (cdSec > 0) row.animMs = Math.max(Number(row.animMs) || 0, cdSec * 1000);
      pushUnique(row);
    });

    if (!isMinion && !exclude.has('skill1')
      && (typeof IdleMobAnim === 'undefined' || IdleMobAnim.resolveAction?.(id, 'skill1'))) {
      const cdSec = Math.max(1, Number(kit.skillCdSec) || Number(cdMap.skill1) || 20);
      pushUnique({
        actionKey: 'skill1',
        dmg: 1,
        animMs: Math.max(mobAnimMs(id, 'skill1', 2000), cdSec * 1000),
        banbanSummon: true,
        magic: true,
      });
    }
    return out;
  }

  function clearBanbanBodyHold() {
    const el = slotEl('body');
    if (!el) return;
    if (el.dataset.holdAction) delete el.dataset.holdAction;
    IdleMobAnim?.endActorChannel?.(el);
    IdleMobAnim?.clearActorCastFlags?.(el);
  }

  /** 召喚窗／弱化：指定 action 從頭循環播到 untilMs */
  function holdBanbanBodyAction(actionKey, untilMs) {
    const el = slotEl('body');
    const id = pad(fight?.body?.visualId || '8910000');
    const action = String(actionKey || 'skillAfter1');
    if (!el || !fight || typeof IdleMobAnim === 'undefined') return;
    const remainMs = Math.max(200, Number(untilMs) - Date.now());
    el.dataset.holdAction = action;
    el.dataset.mobId = id;
    IdleMobAnim.clearActorCastFlags?.(el);
    const started = IdleMobAnim.startActorChannel?.(el, {
      iconId: id,
      action,
      untilMs: remainMs,
      loopFrom: 0,
      scaleDelayMs: (ms) => Math.max(200, Number(ms) || 0),
    });
    if (started) return;
    el.dataset.channelUntil = String(Date.now() + remainMs);
    el.dataset.channelLoopFrom = '0';
    el.dataset.skillUntil = String(Date.now() + remainMs);
    IdleMobAnim.bindActorSprite(el, id, action);
    const img = IdleMobAnim.actorBodyImg?.(el);
    if (img) {
      img.dataset.kindAction = action;
      img.dataset.frameAcc = '0';
      img.dataset.bodyDone = '0';
      IdleMobAnim.bind?.(img, id, action, 0);
    }
  }

  function holdBanbanSkillAfter1(untilMs) {
    holdBanbanBodyAction('skillAfter1', untilMs);
  }

  function holdBanbanSkillFail(untilMs) {
    holdBanbanBodyAction('skillFail', untilMs);
  }

  function livingBanbanMinions() {
    return (fight?.banbanMinions || []).filter((m) => m && !m.dead && m.hp > 0);
  }

  function allBanbanMinionsDead() {
    const list = fight?.banbanMinions || [];
    return list.length > 0 && list.every((m) => !m || m.dead || !(m.hp > 0));
  }

  /** 小怪存活期間本體不可鎖（仍可顯示／攻擊玩家） */
  function syncBanbanBodyTargetable() {
    if (!fight || !isBanban() || !fight.body) return;
    fight.body.targetable = livingBanbanMinions().length === 0;
  }

  function clearBanbanMinions(opts = {}) {
    const list = fight?.banbanMinions || [];
    list.forEach((m) => {
      if (!m) return;
      m.dead = true;
      m.targetable = false;
      m.active = false;
      m.hp = 0;
      if (opts.playDie) {
        // fire-and-forget die then remove
        const key = m.key;
        const id = pad(m.visualId);
        playAnim(key, id, 'die1').finally(() => removeSlot(key));
      } else {
        removeSlot(m.key);
      }
    });
    if (fight) fight.banbanMinions = [];
    syncBanbanBodyTargetable();
  }

  function mountBanbanMinion(unit, bossPos) {
    const st = stage();
    if (!st || !unit) return null;
    const b = bossPos || hooks?.getBossPos?.() || { x: 720, y: 620 };
    const x = b.x + (unit.offset?.x || 0);
    const y = b.y + (unit.offset?.y || 0);
    let el = slotEl(unit.key);
    if (!el) {
      st.insertAdjacentHTML('beforeend', `<div class="idle-actor idle-actor--mob idle-boss-part"
        data-slot="${unit.key}" data-uid="${unit.key}" data-mob-id="${unit.visualId}"
        style="left:${Math.round(x)}px;top:${Math.round(y)}px;z-index:${unit.z || 22}">
        <div class="idle-actor-sprite-stage">
          <img class="idle-actor-sprite" alt="" draggable="false">
        </div>
      </div>`);
      el = slotEl(unit.key);
    } else {
      el.style.display = '';
      el.classList.remove('is-hidden-slot', 'is-dead', 'is-dying');
      setActorStylePos(el, x, y);
    }
    bindVisual(unit.key, unit.visualId, 'stand');
    return el;
  }

  function spawnBanbanMinions() {
    if (!fight || !isBanban()) return;
    const kit = banbanKitCfg();
    const mobId = pad(kit.minionMob || '8910001');
    const count = Math.max(1, Math.min(
      Number(kit.maxMinions) || 2,
      Math.floor(Number(kit.summonCount) || 2),
    ));
    const offsets = Array.isArray(kit.minionOffsets) ? kit.minionOffsets : [
      { x: -150, y: 0 },
      { x: 150, y: 0 },
    ];
    clearBanbanMinions({ playDie: false });
    const bossPos = hooks?.getBossPos?.() || { x: 720, y: 620 };
    const max = maxHpOf(fight.listId, mobId);
    const spawned = [];
    for (let i = 0; i < count; i += 1) {
      const key = `banban${i}`;
      const off = offsets[i] || { x: (i % 2 === 0 ? -1 : 1) * (120 + i * 40), y: 0 };
      const unit = {
        key,
        uid: key,
        isBoss: true,
        role: 'minion',
        visualId: mobId,
        statMob: mobId,
        hp: max,
        maxHp: max,
        targetable: true,
        active: true,
        invincible: false,
        dead: false,
        z: 22 + i,
        offset: { x: Number(off.x) || 0, y: Number(off.y) || 0 },
      };
      spawned.push(unit);
      mountBanbanMinion(unit, bossPos);
      if (!atkAcc[key]) atkAcc[key] = Object.create(null);
    }
    fight.banbanMinions = spawned;
    syncBanbanBodyTargetable();
  }

  async function runBanbanSummonSkill(slotKey, unit, atk) {
    if (!fight || !isBanban() || fight.banbanPhase || fight.banbanResolving) return;
    if (livingBanbanMinions().length) return;
    const bodyId = pad(unit.visualId);
    const el = slotEl(slotKey);
    atkFxSeq += 1;
    const seq = atkFxSeq;
    fight.banbanResolving = true;
    fight.bossActionLock = { slotKey, actionKey: 'skill1' };
    IdleMobAnim?.clearActorCastFlags?.(el);
    if (!flashAttack(slotKey, bodyId, 'skill1')) {
      await playAnim(slotKey, bodyId, 'skill1');
    } else {
      const waitMs = scaleDelayMs(mobAnimMs(bodyId, 'skill1', 2000) + 200);
      const started = Date.now();
      while (Date.now() - started < waitMs) {
        if (seq !== atkFxSeq || !fight) break;
        if (!IdleMobAnim?.isActorCasting?.(el) && Date.now() - started > 200) break;
        await sleep(TICK_MS);
      }
    }
    if (seq !== atkFxSeq || !fight || fight.mode !== 'fight') {
      if (fight) {
        fight.banbanResolving = false;
        fight.bossActionLock = null;
      }
      return;
    }
    spawnBanbanMinions();
    const windowMs = Math.max(5000, (Number(banbanKitCfg().windowSec) || 60) * 1000);
    fight.banbanPhase = 'window';
    fight.banbanWindowUntil = Date.now() + windowMs;
    fight.banbanPhaseUntil = fight.banbanWindowUntil;
    holdBanbanSkillAfter1(fight.banbanWindowUntil);
    fight.bossActionLock = null;
    fight.banbanResolving = false;
    syncHud();
  }

  async function resolveBanbanWindow(outcome) {
    if (!fight || !isBanban() || fight.banbanPhase !== 'window' || fight.banbanResolving) return;
    fight.banbanResolving = true;
    clearBanbanBodyHold();
    const bodyId = pad(fight.body.visualId);
    const kit = banbanKitCfg();
    const action = outcome === 'weaken' ? 'skillFail' : 'skillUse';
    atkFxSeq += 1;
    const seq = atkFxSeq;
    fight.bossActionLock = { slotKey: 'body', actionKey: action };

    const durSec = outcome === 'weaken'
      ? (Number(kit.weakenSec) || 30)
      : (Number(kit.buffSec) || 30);
    const phaseUntil = Date.now() + Math.max(1000, durSec * 1000);

    if (outcome === 'weaken') {
      // 弱化全程循環 skillFail（不再回 stand／普攻）
      fight.banbanPhase = 'weaken';
      fight.banbanPhaseUntil = phaseUntil;
      clearBanbanMinions({ playDie: false });
      holdBanbanSkillFail(phaseUntil);
      fight.bossActionLock = null;
      fight.banbanResolving = false;
      if (!atkAcc.body) atkAcc.body = Object.create(null);
      atkAcc.body.skill1 = 0;
      syncHud();
      return;
    }

    // 強化：播完 skillUse 後恢復普攻
    if (typeof IdleMobAnim !== 'undefined' && IdleMobAnim.resolveAction?.(bodyId, action)) {
      await playAnim('body', bodyId, action);
    } else {
      await sleep(scaleDelayMs(800));
    }
    if (seq !== atkFxSeq || !fight) {
      if (fight) {
        fight.banbanResolving = false;
        fight.bossActionLock = null;
      }
      return;
    }
    bindVisual('body', bodyId, 'stand');
    fight.banbanPhase = 'buff';
    fight.banbanPhaseUntil = phaseUntil;
    fight.bossActionLock = null;
    fight.banbanResolving = false;
    syncBanbanBodyTargetable();
    if (!atkAcc.body) atkAcc.body = Object.create(null);
    atkAcc.body.skill1 = 0;
    syncHud();
  }

  function endBanbanPhaseEffect() {
    if (!fight || !isBanban()) return;
    clearBanbanBodyHold();
    fight.banbanPhase = null;
    fight.banbanPhaseUntil = 0;
    fight.banbanWindowUntil = 0;
    // 強化結束後清掉殘留小怪
    clearBanbanMinions({ playDie: true });
    if (fight.body?.hp > 0 && !fight.body.dead) {
      bindVisual('body', pad(fight.body.visualId), 'stand');
    }
    if (!atkAcc.body) atkAcc.body = Object.create(null);
    atkAcc.body.skill1 = 0;
    syncHud();
  }

  function tickBanbanPhases() {
    if (!fight || !isBanban() || busy || fight.banbanResolving) return;
    if (fight.mode !== 'fight') return;
    const now = Date.now();
    if (fight.banbanPhase === 'window') {
      if (allBanbanMinionsDead()) {
        resolveBanbanWindow('weaken');
        return;
      }
      if (now >= (Number(fight.banbanWindowUntil) || 0)) {
        resolveBanbanWindow('buff');
        return;
      }
      // 維持 skillAfter1 循環（channel 斷了就重開）
      const el = slotEl('body');
      if (el) {
        const chUntil = Number(el.dataset.channelUntil) || 0;
        if (el.dataset.holdAction !== 'skillAfter1' || !(chUntil > now + 100)) {
          holdBanbanSkillAfter1(fight.banbanWindowUntil);
        }
      }
      return;
    }
    if (fight.banbanPhase === 'weaken') {
      if (now >= (Number(fight.banbanPhaseUntil) || 0)) {
        endBanbanPhaseEffect();
        return;
      }
      const el = slotEl('body');
      if (el) {
        const chUntil = Number(el.dataset.channelUntil) || 0;
        if (el.dataset.holdAction !== 'skillFail' || !(chUntil > now + 100)) {
          holdBanbanSkillFail(fight.banbanPhaseUntil);
        }
      }
      return;
    }
    if (fight.banbanPhase === 'buff'
      && now >= (Number(fight.banbanPhaseUntil) || 0)) {
      endBanbanPhaseEffect();
    }
  }

  function onBanbanMinionDead(mob) {
    if (!fight || !isBanban() || !mob) return;
    const key = mob.key || mob.uid;
    mob.dead = true;
    mob.targetable = false;
    mob.active = false;
    mob.hp = 0;
    syncBanbanBodyTargetable();
    const id = pad(mob.visualId);
    playAnim(key, id, 'die1').finally(() => {
      removeSlot(key);
      if (fight?.banbanPhase === 'window' && allBanbanMinionsDead() && !fight.banbanResolving) {
        resolveBanbanWindow('weaken');
      }
    });
  }

  function actorStylePos(el) {
    return {
      x: parseFloat(el?.style?.left) || 0,
      y: parseFloat(el?.style?.top) || 0,
    };
  }

  function setActorStylePos(el, x, y) {
    if (!el) return;
    el.style.left = `${Math.round(x)}px`;
    el.style.top = `${Math.round(y)}px`;
  }

  function mountPierreChaseSlot(x, y) {
    const st = stage();
    const chase = fight?.pierreChase;
    if (!st || !chase) return null;
    let el = slotEl('pierreChase');
    if (!el) {
      st.insertAdjacentHTML('beforeend', `<div class="idle-actor idle-actor--mob idle-boss-part"
        data-slot="pierreChase" data-uid="pierreChase" data-mob-id="${chase.visualId}"
        style="left:${Math.round(x)}px;top:${Math.round(y)}px;z-index:${chase.z || 21}">
        <div class="idle-actor-sprite-stage">
          <img class="idle-actor-sprite" alt="" draggable="false">
        </div>
      </div>`);
      el = slotEl('pierreChase');
    } else {
      el.style.display = '';
      el.classList.remove('is-hidden-slot', 'is-dead', 'is-dying');
      setActorStylePos(el, x, y);
    }
    return el;
  }

  function startPierreChaseMove() {
    const chase = fight?.pierreChase;
    const el = slotEl('pierreChase');
    if (!chase || !el) return;
    el.dataset.holdAction = 'move';
    el.classList.add('is-moving');
    if (typeof IdleMobAnim !== 'undefined') {
      el.dataset.mobId = pad(chase.visualId);
      IdleMobAnim.bindActorSprite(el, pad(chase.visualId), 'move');
      const img = IdleMobAnim.actorBodyImg?.(el);
      if (img) {
        img.dataset.frameAcc = '0';
        img.dataset.bodyDone = '0';
      }
    }
  }

  function stopPierreChaseMove() {
    const el = slotEl('pierreChase');
    if (!el) return;
    el.classList.remove('is-moving');
    if (el.dataset.holdAction === 'move') delete el.dataset.holdAction;
  }

  function tickPierreChase(dt) {
    if (!fight || !isPierre() || fight.phase < 2 || busy) return;
    const chase = fight.pierreChase;
    if (!chase || chase.dead || !chase.active || fight.body.hp <= 0) return;
    const el = slotEl('pierreChase');
    const playerEl = getBossPlayerEl();
    if (!el || !playerEl) return;
    if (el.dataset.holdAction !== 'move') startPierreChaseMove();

    const cfg = pierreChaseCfg();
    const pos = actorStylePos(el);
    const player = actorStylePos(playerEl);
    const desiredX = player.x + (chase.orbitDir >= 0 ? 1 : -1) * cfg.orbitPx;
    const dx = desiredX - pos.x;
    const step = cfg.speedPx * Math.max(0, Number(dt) || 0);
    let nextX = pos.x;
    if (Math.abs(dx) <= step || step <= 0) {
      nextX = desiredX;
      chase.orbitDir = -(chase.orbitDir >= 0 ? 1 : -1);
    } else {
      nextX = pos.x + Math.sign(dx) * step;
    }
    const vx = nextX - pos.x;
    chase.flipX = vx > 0.5;
    el.classList.toggle('is-flip-x', !!chase.flipX);
    chase.pos = { x: nextX, y: pos.y };
    setActorStylePos(el, nextX, pos.y);

    const dist = Math.abs(nextX - player.x);
    chase.contactAcc = (Number(chase.contactAcc) || 0) + Math.max(0, Number(dt) || 0);
    if (dist <= cfg.contactPx && chase.contactAcc >= cfg.contactCdSec) {
      chase.contactAcc = 0;
      const dM = dmgMult(fight.listId);
      const base = baseBossAtkDmg(fight.listId, chase.visualId) || 35000;
      const hitDmg = Math.max(1, Math.floor(base * cfg.contactDamR * dM));
      if (typeof IdleMobAnim !== 'undefined' && typeof IdleMobAnim.playPlayerHit === 'function') {
        IdleMobAnim.playPlayerHit(playerEl, pad(chase.visualId), 'move', { immediate: true });
      }
      hurtPlayerFromBoss('pierreChase', hitDmg);
    }
  }

  function tryPierreSplit() {
    if (!fight || !isPierre() || busy || fight.mode !== 'fight') return;
    if (fight.phase !== 1 || fight.pierreSplitting) return;
    if (fight.body?.invincible || fight.body?.dead) return;
    const ratio = pierreSplitCfg().splitRatio;
    const floor = Math.max(1, Math.ceil(fight.body.maxHp * ratio));
    if (fight.body.hp > floor) return;
    runPierreSplit(floor);
  }

  async function runPierreSplit(floorHp) {
    if (!fight || !isPierre() || busy) return;
    const seq = atkFxSeq;
    busy = true;
    fight.pierreSplitting = true;
    fight.body.invincible = true;
    fight.body.hp = Math.max(1, Math.floor(Number(floorHp) || fight.body.hp));
    fight.body.targetable = false;
    stopSustainCombat();
    syncHud();

    const fromId = pad(fight.body.visualId || fight.script.bodyStatMob || '8900000');
    const hasTransform = typeof IdleMobAnim !== 'undefined'
      && !!IdleMobAnim.resolveAction?.(fromId, 'transform');
    if (hasTransform) {
      await playAnim('body', fromId, 'transform');
    } else {
      await sleep(400);
    }
    if (seq !== atkFxSeq || !fight) return;

    const split = pierreSplitCfg();
    const bossPos = hooks?.getBossPos?.() || { x: 720, y: 620 };
    const hatX = bossPos.x + split.hatOff.x;
    const hatY = bossPos.y + split.hatOff.y;
    const chaseX = bossPos.x + split.chaseOff.x;
    const chaseY = bossPos.y + split.chaseOff.y;

    fight.body.visualId = split.hatId;
    const bodyEl = slotEl('body');
    if (bodyEl) {
      bodyEl.classList.remove('is-hidden-slot', 'is-dead');
      bodyEl.style.display = '';
      setActorStylePos(bodyEl, hatX, hatY);
    }

    if (fight.pierreChase) {
      fight.pierreChase.visualId = split.chaseId;
      fight.pierreChase.dead = false;
      fight.pierreChase.invincible = true;
      fight.pierreChase.targetable = false;
      fight.pierreChase.active = false;
      fight.pierreChase.pos = { x: chaseX, y: chaseY };
      fight.pierreChase.orbitDir = -1;
      fight.pierreChase.contactAcc = 0;
      fight.pierreChase.flipX = false;
    }
    const chaseEl = mountPierreChaseSlot(chaseX, chaseY);

    const hatRegen = typeof IdleMobAnim !== 'undefined'
      && !!IdleMobAnim.resolveAction?.(split.hatId, 'regen');
    const chaseRegen = typeof IdleMobAnim !== 'undefined'
      && !!IdleMobAnim.resolveAction?.(split.chaseId, 'regen');
    const waits = [];
    if (hatRegen) waits.push(playAnim('body', split.hatId, 'regen'));
    else bindVisual('body', split.hatId, 'stand');
    if (chaseEl && chaseRegen) waits.push(playAnim('pierreChase', split.chaseId, 'regen'));
    else if (chaseEl) bindVisual('pierreChase', split.chaseId, 'stand');
    if (waits.length) await Promise.all(waits);
    if (seq !== atkFxSeq || !fight) return;

    bindVisual('body', split.hatId, 'stand');
    fight.phase = 2;
    fight.body.invincible = false;
    fight.body.targetable = true;
    if (fight.pierreChase) {
      fight.pierreChase.invincible = false;
      fight.pierreChase.targetable = true;
      fight.pierreChase.active = true;
    }
    startPierreChaseMove();
    fight.pierreSplitting = false;
    busy = false;
    syncHud();
  }

  async function onPierreDead() {
    if (!fight || !isPierre() || fight.mode !== 'fight') return;
    busy = true;
    stopSustainCombat();
    fight.mode = 'clear';
    hooks?.onPhase?.('clear');
    stopPierreChaseMove();
    const chase = fight.pierreChase;
    if (chase) {
      chase.dead = true;
      chase.targetable = false;
      chase.active = false;
    }
    fight.body.dead = true;
    fight.body.targetable = false;
    clearUnitDebuff('body');
    clearUnitDebuff('pierreChase');
    const bodyVisual = pad(fight.body.visualId);
    const chaseVisual = pad(chase?.visualId);
    await Promise.all([
      playAnim('body', bodyVisual, 'die1'),
      (chaseVisual && slotEl('pierreChase'))
        ? playAnim('pierreChase', chaseVisual, 'die1')
        : Promise.resolve(),
    ]);
    hideSlot('body');
    hideSlot('pierreChase');

    const chestId = fight.script.chestMob ? pad(fight.script.chestMob) : '';
    if (!chestId) {
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
    mountChestOnly(boss);
    bindVisual('chest', fight.chest.visualId, 'regen');
    if (typeof hooks?.fadeField === 'function') {
      await hooks.fadeField(0, 500);
    }
    await sleep(IdleMobAnim?.actionDurationMs?.(fight.chest.visualId, 'regen') || 500);
    bindVisual('chest', fight.chest.visualId, 'stand');
    hideSlot('body');
    hideSlot('pierreChase');
    busy = false;
    syncHud();
    hooks?.onTitle?.('獎勵箱');
  }

  async function playPierreIntro() {
    if (!fight || !isPierre()) return;
    const seq = atkFxSeq;
    const id = pad(fight.body.visualId || fight.script.bodyStatMob || '8900000');
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

  /** 班班進場：無 regen，直接 stand */
  async function playBanbanIntro() {
    if (!fight || !isBanban()) return;
    const seq = atkFxSeq;
    const id = pad(fight.body.visualId);
    busy = true;
    hooks?.onTitle?.('登場');
    const el = slotEl('body');
    if (el) {
      el.classList.remove('is-hidden-slot');
      el.style.display = '';
      bindVisual('body', id, 'stand');
    }
    await sleep(scaleDelayMs(400));
    if (seq !== atkFxSeq || !fight) return;
    bindVisual('body', id, 'stand');
    fight.body.invincible = false;
    fight.body.targetable = true;
    busy = false;
    hooks?.onPhase?.(1);
    syncHud();
  }

  /** 貝倫進場：無 regen，直接 stand；尾巴稍後竄出 */
  async function playVellumIntro() {
    if (!fight || !isVellum()) return;
    const seq = atkFxSeq;
    const id = pad(fight.body.visualId);
    busy = true;
    hooks?.onTitle?.('登場');
    const el = slotEl('body');
    if (el) {
      el.classList.remove('is-hidden-slot');
      el.style.display = '';
      bindVisual('body', id, 'stand');
    }
    await sleep(scaleDelayMs(400));
    if (seq !== atkFxSeq || !fight) return;
    bindVisual('body', id, 'stand');
    fight.body.invincible = false;
    fight.body.targetable = true;
    busy = false;
    hooks?.onPhase?.(1);
    syncHud();
  }

  function vellumKitCfg(listId = fight?.listId) {
    return fight?.script?.vellumKit || phaseScript(listId)?.vellumKit || {};
  }

  function buildVellumAttacks(listId, mobId) {
    const id = pad(mobId);
    const kit = vellumKitCfg(listId);
    const bodyId = pad(kit.bodyMob || '8930000');
    if (id !== bodyId) return [];
    const exclude = new Set((kit.excludeActions || []).map((k) => String(k)));
    const ratioMap = attackHpRatioMap(kit);
    const cdMap = kit.attackCdSec || {};
    const chains = Array.isArray(kit.damageChains) ? kit.damageChains : [];
    const chainByOpener = Object.create(null);
    chains.forEach((c) => {
      const opener = String(c?.opener || '');
      if (!opener) return;
      chainByOpener[opener] = Array.isArray(c.chain) && c.chain.length
        ? c.chain.map(String)
        : [opener];
    });
    const part = wzPart(listId, id);
    const out = [];
    const seen = new Set();
    const pushUnique = (row) => {
      const key = row?.actionKey;
      if (!key || seen.has(key) || exclude.has(key)) return;
      seen.add(key);
      out.push(row);
    };

    (part?.attacks || []).forEach((a) => {
      const actionKey = a.actionKey || `attack${a.action}`;
      if (!actionKey || exclude.has(actionKey)) return;
      const chain = chainByOpener[actionKey];
      if (chain) {
        let animMs = 0;
        const segmentDmg = Object.create(null);
        chain.forEach((ck) => {
          animMs += mobAnimMs(id, ck, 900);
          const seg = (part?.attacks || []).find((x) => (x.actionKey || `attack${x.action}`) === ck);
          const base = Math.max(0, Number(seg?.dmg) || Number(a.dmg) || 0);
          segmentDmg[ck] = scaleWzByHpRatio(base, ratioMap[ck], 1);
        });
        const row = {
          ...a,
          actionKey,
          animMs: Math.max(animMs, Number(a.animMs) || 0),
          dmg: scaleWzByHpRatio(a.dmg, ratioMap[actionKey], 1),
          damageChain: { chain, segmentDmg },
        };
        const cdSec = Number(cdMap[actionKey]);
        if (cdSec > 0) row.animMs = Math.max(row.animMs, cdSec * 1000);
        pushUnique(row);
        return;
      }
      const row = {
        ...a,
        actionKey,
        dmg: scaleWzByHpRatio(a.dmg, ratioMap[actionKey], 1),
      };
      const cdSec = Number(cdMap[actionKey]);
      if (cdSec > 0) {
        row.animMs = Math.max(Number(row.animMs) || 0, cdSec * 1000);
      }
      pushUnique(row);
    });
    return out;
  }

  function getBossPlayerPos() {
    const el = getBossPlayerEl();
    const bossPos = hooks?.getBossPos?.() || { x: 720, y: 628 };
    if (!el) return { x: bossPos.x - 200, y: bossPos.y };
    return {
      x: parseFloat(el.style.left) || bossPos.x - 200,
      y: parseFloat(el.style.top) || bossPos.y,
    };
  }

  function mountVellumTailSlot(x, y) {
    const st = stage();
    const tail = fight?.vellumTail;
    if (!st || !tail) return null;
    let el = slotEl('vellumTail');
    if (!el) {
      st.insertAdjacentHTML('beforeend', `<div class="idle-actor idle-actor--mob idle-boss-part"
        data-slot="vellumTail" data-uid="vellumTail" data-mob-id="${tail.visualId}"
        style="left:${Math.round(x)}px;top:${Math.round(y)}px;z-index:${tail.z || 22}">
        <div class="idle-actor-sprite-stage">
          <img class="idle-actor-sprite" alt="" draggable="false">
        </div>
      </div>`);
      el = slotEl('vellumTail');
    } else {
      el.style.display = '';
      el.classList.remove('is-hidden-slot', 'is-dead', 'is-dying');
      setActorStylePos(el, x, y);
    }
    el.classList.toggle('is-flip-x', !!tail.flipX);
    return el;
  }

  function retractVellumTail(opts = {}) {
    const tail = fight?.vellumTail;
    if (!tail) return;
    tail.active = false;
    tail.targetable = false;
    tail.pendingDmgAt = 0;
    tail.activeUntil = 0;
    tail.emergeAt = 0;
    if (!opts.keepNext && Number(tail.nextAppearAt) < Date.now()) {
      const kit = vellumKitCfg();
      const cdMs = Math.max(1000, (Number(kit.tailCdSec) || 7) * 1000);
      tail.nextAppearAt = Date.now() + cdMs;
    }
    hideSlot('vellumTail');
  }

  function fireVellumTailHit(seq) {
    if (!fight || !isVellum() || !fight.vellumTail?.active) return;
    if (seq != null && seq !== fight.vellumTail.hitSeq) return;
    const kit = vellumKitCfg();
    const tailId = pad(fight.vellumTail.visualId || kit.tailMob || '8930001');
    const part = wzPart(fight.listId, tailId);
    const atk = (part?.attacks || []).find((a) => (a.actionKey || `attack${a.action}`) === 'attack1')
      || (part?.attacks || [])[0];
    const base = Math.max(0, Number(atk?.dmg) || 0)
      || Math.floor((Number(part?.PADamage) || 46000) * ((Number(atk?.attackRatio) || 100) / 100));
    const ratio = Number(kit.tailAttackHpRatio);
    const hitDmg = Math.max(1, Math.floor(
      scaleWzByHpRatio(base, Number.isFinite(ratio) && ratio > 0 ? ratio : 1, 1)
      * dmgMult(fight.listId),
    ));
    // 竄出當下開始可打
    if (fight.vellumTail) fight.vellumTail.targetable = true;
    const playerEl = getBossPlayerEl();
    if (playerEl && typeof IdleMobAnim !== 'undefined') {
      IdleMobAnim.playPlayerHit(playerEl, tailId, 'attack1', { immediate: true });
    }
    hurtPlayerFromBoss('vellumTail', hitDmg);
    syncHud();
  }

  function vellumTailEmergeMs(_mobId) {
    const kit = vellumKitCfg();
    const forced = Number(kit.tailAttackLeadMs);
    // WZ attackAfter≈2070：對齊竄出／出傷
    if (Number.isFinite(forced) && forced >= 0) return forced;
    return 2100;
  }

  function appearVellumTail() {
    if (!fight || !isVellum() || fight.mode !== 'fight' || busy) return;
    if (!(fight.body.hp > 0)) return;
    const kit = vellumKitCfg();
    const tail = fight.vellumTail;
    if (!tail) return;
    const orbit = Math.max(40, Number(kit.tailOrbitPx) || 140);
    const cdMs = Math.max(1000, (Number(kit.tailCdSec) || 7) * 1000);
    const player = getBossPlayerPos();
    const side = Math.random() < 0.5 ? -1 : 1;
    const x = player.x + side * orbit;
    const y = player.y;
    const now = Date.now();
    const id = pad(tail.visualId || kit.tailMob || '8930001');
    const emergeMs = vellumTailEmergeMs(id);
    const animMs = Math.max(
      emergeMs + 500,
      Number(IdleMobAnim?.actionDurationMs?.(id, 'attack1', 'attack1')) || 4000,
    );

    tail.side = side;
    tail.flipX = side > 0;
    tail.pos = { x, y };
    tail.active = true;
    // 前段空幀／潛地：不可打；出傷（竄出）起可打直到播完
    tail.targetable = false;
    tail.dead = false;
    tail.emergeAt = now + emergeMs;
    tail.activeUntil = now + animMs;
    tail.nextAppearAt = now + Math.max(cdMs, animMs + 500);
    tail.hitSeq = (Number(tail.hitSeq) || 0) + 1;
    const hitSeq = tail.hitSeq;
    tail.pendingDmgAt = now + emergeMs;

    const el = mountVellumTailSlot(x, y);
    if (el && typeof IdleMobAnim !== 'undefined') {
      el.dataset.mobId = id;
      el.classList.remove('is-dying', 'is-dead', 'is-hidden-slot');
      el.style.display = '';
      IdleMobAnim.clearActorCastFlags(el);
      IdleMobAnim.flashActorAttack(el, 'attack1', {
        iconId: id,
        scaleDelayMs,
      });
    }
    window.setTimeout(() => fireVellumTailHit(hitSeq), Math.max(0, emergeMs));
  }

  function tickVellumTail(_dt) {
    if (!fight || !isVellum() || fight.mode !== 'fight') return;
    const tail = fight.vellumTail;
    if (!tail || !(fight.body.hp > 0)) {
      if (tail?.active) retractVellumTail({ force: true });
      return;
    }
    const now = Date.now();
    if (tail.active) {
      if (!tail.targetable && now >= (Number(tail.emergeAt) || 0)) {
        tail.targetable = true;
      }
      if (now >= (Number(tail.activeUntil) || 0)) {
        retractVellumTail();
      }
      return;
    }
    if (now >= (Number(tail.nextAppearAt) || 0)) {
      appearVellumTail();
    }
  }

  /** 血腥女皇進場：固定 8920000 regen，之後開始切臉計時 */
  async function playBloodyQueenIntro() {
    if (!fight || !isBloodyQueen()) return;
    const seq = atkFxSeq;
    const form = (fight.script.bodyForms || [])[0] || currentBodyForm();
    const id = pad(form?.visualMob || form?.statMob || fight.body.visualId || '8920000');
    fight.bodyFormIndex = 0;
    fight.body.visualId = id;
    const hasRegen = typeof IdleMobAnim !== 'undefined'
      && !!IdleMobAnim.resolveAction?.(id, 'regen');

    busy = true;

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
    fight.bqNextSwitchAt = Date.now() + (Number(fight.bqSwitchCdMs) || 25000);
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
      const visualId = pad(form?.visualMob || form?.statMob);
      fight.body.visualId = visualId;
      fight.body.maxHp = maxHpOfBodyForm(fight.listId, form);
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

    if (isBloodyQueen()) {
      fight.bodyFormIndex = 0;
      fight.phase = 1;
      const form = (fight.script.bodyForms || [])[0] || currentBodyForm();
      const visualId = pad(form?.visualMob || form?.statMob || '8920000');
      fight.body.visualId = visualId;
      fight.body.maxHp = maxHpOfBodyForm(fight.listId, form);
      fight.body.hp = fight.body.maxHp;
      fight.body.invincible = false;
      fight.body.targetable = true;
      fight.body.dead = false;
      fight.bqSwitching = false;
      fight.bqNextSwitchAt = 0;
      fight.bqSwitchCdMs = Math.max(5000, (Number(fight.script.faceSwitch?.cdSec) || 25) * 1000);
      fight.bqSkillSealUntil = 0;
      clearBqBombs();
      if (opts.playIntro) {
        mountInitialActors(bossPos, { skipBind: true });
        syncHud();
        playBloodyQueenIntro();
      } else {
        stage()?.querySelectorAll('.idle-boss-part').forEach((n) => n.remove());
        syncHud();
      }
      return true;
    }

    if (isPierre()) {
      fight.phase = 1;
      fight.pierreSplitting = false;
      const bodyId = pad(fight.script.bodyStatMob || '8900000');
      fight.body.visualId = bodyId;
      fight.body.maxHp = maxHpOf(fight.listId, bodyId);
      fight.body.hp = fight.body.maxHp;
      fight.body.invincible = true;
      fight.body.targetable = true;
      fight.body.dead = false;
      stopPierreChaseMove();
      removeSlot('pierreChase');
      if (fight.pierreChase) {
        linkPierreSharedHp(fight.pierreChase, fight.body);
        fight.pierreChase.visualId = pierreSplitCfg().chaseId;
        fight.pierreChase.targetable = false;
        fight.pierreChase.invincible = false;
        fight.pierreChase.dead = false;
        fight.pierreChase.active = false;
        fight.pierreChase.pos = null;
        fight.pierreChase.orbitDir = -1;
        fight.pierreChase.contactAcc = 0;
        fight.pierreChase.flipX = false;
      }
      if (opts.playIntro) {
        mountInitialActors(bossPos, { skipBind: true });
        syncHud();
        playPierreIntro();
      } else {
        stage()?.querySelectorAll('.idle-boss-part').forEach((n) => n.remove());
        syncHud();
      }
      return true;
    }

    if (isBanban()) {
      fight.phase = 1;
      fight.banbanPhase = null;
      fight.banbanPhaseUntil = 0;
      fight.banbanWindowUntil = 0;
      fight.banbanResolving = false;
      clearBanbanBodyHold();
      clearBanbanMinions({ playDie: false });
      const bodyId = pad(fight.script.bodyStatMob || '8910000');
      fight.body.visualId = bodyId;
      fight.body.maxHp = maxHpOf(fight.listId, bodyId);
      fight.body.hp = fight.body.maxHp;
      fight.body.invincible = false;
      fight.body.targetable = true;
      fight.body.dead = false;
      if (opts.playIntro) {
        mountInitialActors(bossPos, { skipBind: true });
        syncHud();
        playBanbanIntro();
      } else {
        stage()?.querySelectorAll('.idle-boss-part').forEach((n) => n.remove());
        syncHud();
      }
      return true;
    }

    if (isVellum()) {
      fight.phase = 1;
      const kit = vellumKitCfg();
      const bodyId = pad(fight.script.bodyStatMob || kit.bodyMob || '8930000');
      const tailId = pad(kit.tailMob || '8930001');
      const cdMs = Math.max(1000, (Number(kit.tailCdSec) || 7) * 1000);
      fight.body.visualId = bodyId;
      fight.body.maxHp = maxHpOf(fight.listId, bodyId);
      fight.body.hp = fight.body.maxHp;
      fight.body.invincible = false;
      fight.body.targetable = true;
      fight.body.dead = false;
      retractVellumTail({ force: true });
      if (fight.vellumTail) {
        linkPierreSharedHp(fight.vellumTail, fight.body);
        fight.vellumTail.visualId = tailId;
        fight.vellumTail.nextAppearAt = Date.now() + cdMs;
        fight.vellumTail.hitSeq = 0;
      }
      if (opts.playIntro) {
        mountInitialActors(bossPos, { skipBind: true });
        syncHud();
        playVellumIntro();
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
      const visualId = pad(form?.visualMob || form?.statMob);
      fight.body.visualId = visualId;
      fight.body.maxHp = maxHpOfBodyForm(fight.listId, form);
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
    clearBqBombs();
    if (typeof IdleMobAnim !== 'undefined') {
      IdleMobAnim.clearScreenCenter?.(getBossFieldEl());
    }
    if (fight) {
      fight.nohimeChallenge = null;
      fight.bossActionLock = null;
      fight.nohimeThresholdRunning = false;
      fight.bqSwitching = false;
      fight.bqSkillSealUntil = 0;
      fight.pierreSplitting = false;
      stopPierreChaseMove();
      if (isBanban()) {
        clearBanbanBodyHold();
        clearBanbanMinions({ playDie: false });
        fight.banbanPhase = null;
        fight.banbanResolving = false;
      }
      if (isVellum()) {
        retractVellumTail({ force: true });
      }
    }
    hooks?.syncChallengeHud?.({ hide: true });
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
    afterAppliedDamage,
    tryPhaseCheck,
    getUnitPdRate,
    collectVisualMobIds,
    collectMapArtIds,
    warmAssets,
  };
})();

if (typeof window !== 'undefined') {
  window.IdleBossFight = IdleBossFight;
}
