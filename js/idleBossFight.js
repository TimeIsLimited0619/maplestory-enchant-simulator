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
 * - 史烏（kind: 'suu'）：三階分血原地；簡化過熱／護盾＋BossPattern 子集
 * - 戴米安（kind: 'damien'）：兩階分血；大劍亂飛換向＋鎖定連突；二階結晶跟隨；無印章
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

  function isSuuScript(script) {
    return !!(script && script.kind === 'suu'
      && Array.isArray(script.bodyForms) && script.bodyForms.length);
  }

  function isDamienScript(script) {
    return !!(script && script.kind === 'damien'
      && Array.isArray(script.bodyForms) && script.bodyForms.length);
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

  function isSuu(f = fight) {
    return !!(f && (f.kind === 'suu' || isSuuScript(f.script)));
  }

  function isDamien(f = fight) {
    return !!(f && (f.kind === 'damien' || isDamienScript(f.script)));
  }

  function cygnusSleeping(f = fight) {
    return isCygnus(f) && !!f?.cygnusSleep;
  }

  /** 單本體（無手臂／多部位） */
  function isBodyOnly(f = fight) {
    return isPapulatus(f) || isSimple(f) || isBloodyQueen(f) || isSuu(f) || isDamien(f);
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
    const seq = atkFxSeq;
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
        // 退場／reset 會 bump atkFxSeq：立刻中斷，避免 die 後接上舊戰鬥邏輯
        if (seq !== atkFxSeq || !fight) return;
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
      const speed = Math.max(0.1, Number(el.dataset.animSpeed) || 1);
      const timeout = scaleDelayMs(
        (IdleMobAnim.actionDurationMs(id, introAct, introAct) || 1200) + 200,
      ) / speed;
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

  let hudSyncRaf = null;
  function requestHudSync() {
    if (hudSyncRaf != null) return;
    hudSyncRaf = requestAnimationFrame(() => {
      hudSyncRaf = null;
      if (fight) syncHud();
    });
  }

  function cancelHudSync() {
    if (hudSyncRaf == null) return;
    cancelAnimationFrame(hudSyncRaf);
    hudSyncRaf = null;
  }

  function createFight(listId) {
    const script = phaseScript(listId);
    if (!script) return null;
    if (isHorntailScript(script)) return createHorntailFight(listId, script);
    if (isPierreScript(script)) return createPierreFight(listId, script);
    if (isBanbanScript(script)) return createBanbanFight(listId, script);
    if (isVellumScript(script)) return createVellumFight(listId, script);
    if (isDamienScript(script)) return createDamienFight(listId, script);
    if (isSuuScript(script)) return createSuuFight(listId, script);
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

  function createSuuFight(listId, script) {
    const forms = Array.isArray(script.bodyForms) ? script.bodyForms : [];
    const form0 = forms[0] || { statMob: '8881100', visualMob: '8881100' };
    const bodyMax = maxHpOfBodyForm(listId, form0);
    const kit = script.suuKit || {};
    const gaugeMax = Math.max(1, Number(kit.gauge?.max) || 100);
    return {
      listId: String(listId),
      kind: 'suu',
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
      suuGauge: 0,
      suuGaugeMax: gaugeMax,
      suuPurgeUntil: 0,
      suuPurgeDurationMs: 0,
      suuOverloadUntil: 0,
      suuShieldUntil: 0,
      suuNextShieldAt: 0,
      suuShieldActive: false,
      suuShieldHp: 0,
      suuShieldMax: 0,
      suuPatternAcc: Object.create(null),
      suuPatternBusyUntil: 0,
      suuNextPatternAt: 0,
      suuDebrisAlive: 0,
      suuDebrisNextAt: 0,
      suuDamageTowardCool: 0,
      suuAlertFrame: 0,
      suuAlertAcc: 0,
      suuUiBgFrame: 0,
      suuUiBg0Frame: 0,
      suuUiAnimAcc: 0,
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
  /** 粉豆轉階段（殼 die1 群體復活／雕像 regen）動畫倍率 */
  const PINKBEAN_PHASE_ANIM_SPEED = 2;

  function setActorAnimSpeed(key, speed) {
    const el = slotEl(key);
    if (!el) return;
    const n = Number(speed);
    if (Number.isFinite(n) && n > 0 && n !== 1) el.dataset.animSpeed = String(n);
    else delete el.dataset.animSpeed;
  }

  async function playAnimAtSpeed(key, mobId, action, speed) {
    const n = Number(speed);
    const use = (Number.isFinite(n) && n > 0) ? n : 1;
    setActorAnimSpeed(key, use);
    try {
      await playAnim(key, mobId, action);
    } finally {
      setActorAnimSpeed(key, 1);
    }
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

    if (isSimple() || isBloodyQueen() || isSuu() || isDamien()) {
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
    if (isSuu()) return;
    if (isDamien()) return;
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

  /** 只對「新解鎖」且真有多幀 regen 的雕像播一次復活（轉階／進場倍速） */
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
    const speed = PINKBEAN_PHASE_ANIM_SPEED;
    list.forEach((arm) => {
      const el = slotEl(arm.key);
      if (!el || typeof IdleMobAnim === 'undefined') return;
      el.dataset.mobId = pad(arm.visualId);
      el.dataset.introAction = 'regen';
      setActorAnimSpeed(arm.key, speed);
      IdleMobAnim.bindActorSprite(el, pad(arm.visualId), 'regen');
      const img = IdleMobAnim.actorBodyImg?.(el);
      if (img) {
        img.dataset.frameAcc = '0';
        img.dataset.bodyDone = '0';
      }
    });
    try {
      await Promise.all(list.map((arm) => playAnim(arm.key, arm.visualId, 'regen')));
    } finally {
      list.forEach((arm) => setActorAnimSpeed(arm.key, 1));
    }
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

  /** 五尊齊全階段結束：並行播各雕像 die1（轉階倍速） */
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
    const speed = PINKBEAN_PHASE_ANIM_SPEED;
    playable.forEach((arm) => setActorAnimSpeed(arm.key, speed));
    try {
      await Promise.all(playable.map((arm) => playAnim(arm.key, arm.visualId, 'die1')));
    } finally {
      playable.forEach((arm) => setActorAnimSpeed(arm.key, 1));
    }
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

    // 殼有 die1 就掛隱藏槽播一下（群體復活／解鎖演出；轉階倍速）
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
      await playAnimAtSpeed('shellDie', shellId, 'die1', PINKBEAN_PHASE_ANIM_SPEED);
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
    if (isSuu()) {
      clearSuuPatternsRuntime();
      fight.suuShieldActive = false;
      fight.suuShieldUntil = 0;
      fight.suuShieldHp = 0;
      fight.suuShieldMax = 0;
      fight.suuPurgeUntil = 0;
      fight.suuPurgeDurationMs = 0;
      fight.suuOverloadUntil = 0;
      clearSuuGaugeHud();
    }
    if (isDamien()) {
      clearDamienRuntime();
    }
    if (!fight || fight.mode !== 'fight') return;
    busy = true;
    stopSustainCombat();
    fight.mode = 'clear';
    hooks?.onPhase?.('clear');
    const clearSeq = atkFxSeq;
    const clearFight = fight;
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
    // 戴米安二階最終死亡：播 8880121 die1（非本體 8880101）
    let dieVisual = bodyVisual;
    if (isDamien() && (Number(fight.phase) || 1) >= 2) {
      const dieId = pad(fight.script.dieMob || '8880121');
      if (typeof IdleMobAnim !== 'undefined' && IdleMobAnim.resolveAction?.(dieId, 'die1')) {
        dieVisual = dieId;
      }
    }
    await playAnim('body', dieVisual, 'die1');
    if (clearSeq !== atkFxSeq || fight !== clearFight || !fight || fight.mode === 'done') return;
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

    // 過圖黑屏：本體消失 → 換獎勵箱（可選 chestMapArt）
    if (typeof hooks?.fadeField === 'function') {
      await hooks.fadeField(1, 500);
    } else {
      await sleep(500);
    }
    if (clearSeq !== atkFxSeq || fight !== clearFight || !fight || fight.mode === 'done') return;
    const chestArt = fight.script.chestMapArt;
    if (chestArt && typeof hooks?.setMapArt === 'function') {
      hooks.setMapArt(String(chestArt));
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
      const scrollId = String(row.scrollId || '').trim();
      const cubeId = String(row.cubeId || '').trim();
      const hammerId = String(row.hammerId || '').trim();
      const soulId = String(row.soulId || '').trim();
      const chanceRaw = Number(row.chance);
      const chance = Number.isFinite(chanceRaw) ? chanceRaw : 100;
      if (!(chance > 0) || Math.random() * 100 >= chance) return null;
      const out = {
        kind: row.kind,
        amount,
        name: row.name || itemId || scrollId || cubeId || hammerId || soulId || '',
      };
      if (itemId) out.itemId = itemId;
      if (scrollId) out.scrollId = scrollId;
      if (cubeId) out.cubeId = cubeId;
      if (hammerId) out.hammerId = hammerId;
      if (soulId) out.soulId = soulId;
      if (row.catalogId) out.catalogId = row.catalogId;
      if (row.consumeType) out.consumeType = row.consumeType;
      // 藥水 id 補上 consumeType，icon／入包才吃得到
      if (out.kind === 'consume' && !out.consumeType
        && typeof IdlePotionStore !== 'undefined'
        && IdlePotionStore.isPotionId?.(itemId)) {
        out.consumeType = 'potion';
      }
      // 星捲／榮耀捲等：靠 scrollId；一般道具靠 itemId
      const hasId = !!(out.itemId || out.scrollId || out.cubeId || out.hammerId || out.soulId);
      if (!hasId || !out.kind) return null;
      return out;
    }).filter(Boolean);
  }

  function startExitCountdown() {
    stopExitCountdown();
    exitLeftSec = Math.max(1, Math.floor(Number(fight?.script?.exitSec) || 5));
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
    const chestVisual = pad(fight.chest.visualId);
    fight.chest = null;
    const seq = atkFxSeq;
    const fightRef = fight;
    const el = slotEl('chest');
    const dieAction = (typeof IdleMobAnim !== 'undefined'
      && (IdleMobAnim.resolveAction?.(chestVisual, 'die1')
        || IdleMobAnim.resolveAction?.(chestVisual, 'die')))
      || 'die1';
    // chestRewardFrame：動畫進行中噴獎勵（如戴米安 8950111 die1 第 17 幀）；未設則播完再噴
    const rewardFr = Number(fight.script?.chestRewardFrame);
    const hasMidReward = Number.isFinite(rewardFr) && rewardFr >= 0;
    const rewardAt = hasMidReward
      ? scaleDelayMs(Math.max(
        0,
        Number(IdleMobAnim?.actionFrameOffsetMs?.(chestVisual, dieAction, rewardFr)) || 0,
      ))
      : -1;

    let rewarded = false;
    const doGrant = () => {
      if (rewarded) return;
      rewarded = true;
      grantPlaceholderRewards();
    };

    if (el && typeof IdleMobAnim !== 'undefined') {
      IdleMobAnim.beginActorDie(el, chestVisual);
      const dur = Math.max(
        400,
        Number(IdleMobAnim.actionDurationMs(chestVisual, dieAction, 'die')) || 1200,
      );
      const speed = Math.max(0.1, Number(el.dataset.animSpeed) || 1);
      const timeout = scaleDelayMs(dur + 250) / speed;
      const start = Date.now();
      while (Date.now() - start < timeout) {
        if (seq !== atkFxSeq || fight !== fightRef || !fight) {
          busy = false;
          return;
        }
        if (hasMidReward && Date.now() - start >= rewardAt) doGrant();
        if (el.dataset.dieDone === '1') break;
        await sleep(TICK_MS);
      }
    } else {
      await sleep(600);
    }
    if (!hasMidReward) doGrant();
    else doGrant(); // 保險：中途沒噴到也補噴
    hideSlot('chest');
    if (!fight || fight !== fightRef) {
      busy = false;
      return;
    }
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

    if (isDamien()) {
      if (kind === 'body') {
        // 共血：可打量＝當前階段實際池剩餘（血條 70／30 另映射）
        if (fight.phase === 1) {
          return Math.max(0, Math.floor(Number(fight.damienP1Remain) || 0));
        }
        return Math.max(0, Math.floor(Number(fight.damienP2Remain) || 0));
      }
      return 0;
    }

    if (isPapulatus() || isSimple() || isBloodyQueen() || isSuu()) {
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

  function capIncomingDamage(mob, dmg, opts = {}) {
    let raw = Math.max(0, Math.floor(Number(dmg) || 0));
    if (isBanban() && fight?.banbanPhase === 'weaken') {
      const kind = mob?.uid || mob?.key;
      if (kind === 'body') {
        const mult = Number(banbanKitCfg()?.weakenInMult) || 1.5;
        raw = Math.floor(raw * mult);
      }
    }
    if (isSuu()) {
      const kind = mob?.uid || mob?.key;
      if (kind === 'body') raw = applySuuShieldIncoming(raw, opts);
    }
    if (isDamien()) {
      const kind = mob?.uid || mob?.key;
      // 藍球只做接觸傷／圈顯示，不對王減傷
      if (kind === 'body') return raw;
    }
    if (!mob) return raw;
    return Math.min(raw, maxDamageAllowed(mob));
  }

  /** 實際扣血後：粉豆殼鏡像／雕像保底（勿掛在 showMobDamage） */
  function afterAppliedDamage(mob, appliedDmg) {
    const dmg = Math.max(0, Math.floor(Number(appliedDmg) || 0));
    if (!mob || !fight) return;
    if (isSuu()) {
      const kind = mob.uid || mob.key;
      if (kind === 'body') {
        if (dmg > 0) coolSuuGaugeByDamage(dmg);
        requestHudSync();
      }
      return;
    }
    if (isDamien() && dmg > 0) {
      const kind = mob.uid || mob.key;
      if (kind === 'body') {
        // IdleHunt／applyDamage 已對 body.hp 做線性扣血；改為實際池＋血條 70／30 映射
        const max = Math.max(1, Number(fight.body.maxHp) || 1);
        fight.body.hp = Math.min(max, Math.max(0, (Number(fight.body.hp) || 0) + dmg));
        applyDamienPoolDamage(dmg);
        noteDamienWorldTreeDamage(dmg);
        tryDamienSharedPhaseUp();
        requestHudSync();
      }
      return;
    }
    if (!(dmg > 0)) return;
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
      dmg = capIncomingDamage(target.unit, dmg, { commit: true });
    }
    if (!(dmg > 0)) {
      showDmg(target.unit.key, 0, false);
      // 史烏護盾可能吃掉整段傷害，仍要刷新白條
      if (isSuu()) syncHud();
      return;
    }
    target.unit.hp = Math.max(0, target.unit.hp - dmg);
    showDmg(target.unit.key, dmg, isCritical);
    if (typeof MobEffBarrier !== 'undefined') MobEffBarrier.playIfNeeded?.(target.unit, { isBoss: true });
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

    if (isSuu()) {
      if (target.kind === 'body' && target.unit.hp <= 0) {
        onSuuPhaseDown();
      }
      return;
    }

    if (isDamien()) {
      if (target.kind === 'body') {
        if (fight.phase === 1) tryDamienSharedPhaseUp();
        else if (target.unit.hp <= 0) onDamienPhaseDown();
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
    if (isPapulatus() || isSimple() || isBloodyQueen() || isSuu() || isDamien()) {
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
    // 刻印怪死亡：立刻飛鏢（戰鬥 followup 已引爆則無印）
    if (typeof SkillCombat !== 'undefined'
      && typeof SkillCombat.tryNlMarkBurstOnDeath === 'function'
      && typeof SkillMobStatus !== 'undefined') {
      list.forEach((mob) => {
        if (!mob || !(Number(mob.hp) <= 0)) return;
        if (!SkillMobStatus.hasNlMark?.(mob)) return;
        SkillCombat.tryNlMarkBurstOnDeath(combatCtx(), mob);
      });
    }
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
    if (isSuu()) {
      list.forEach((mob) => {
        if (!mob || !fight) return;
        const kind = mob.uid || mob.key;
        if (kind === 'chest' && mob.hp <= 0) {
          if (!busy && fight.chest && !fight.rewardsGranted) onChestDead();
          return;
        }
        if (kind === 'body' && mob.hp <= 0 && fight.mode === 'fight') {
          onSuuPhaseDown();
        }
      });
      syncHud();
      return;
    }
    if (isDamien()) {
      list.forEach((mob) => {
        if (!mob || !fight) return;
        const kind = mob.uid || mob.key;
        if (kind === 'chest' && mob.hp <= 0) {
          if (!busy && fight.chest && !fight.rewardsGranted) onChestDead();
          return;
        }
        if (kind === 'body' && fight.mode === 'fight') {
          if (fight.phase === 1) tryDamienSharedPhaseUp();
          else if (mob.hp <= 0) onDamienPhaseDown();
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
    // 戴米安 bind／QTE 替代：暫停玩家全部動作
    if (isDamien() && Date.now() < (Number(fight.damienActionStopUntil) || 0)) {
      hooks?.syncOverlay?.();
      return;
    }
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
        // 有 CD：不佔普攻節拍、不中斷連打；每幀最多 2 招，避免補幀一次倒出夜使者整串爆發
        if (picked.hasCd) {
          if (hits >= 2) break;
          continue;
        }
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
    if (isDamien()) {
      const built = buildDamienAttacks(listId, mobId);
      if (built && built.length) return built;
      return [];
    }
    if (isSuu()) {
      const built = buildSuuAttacks(listId, mobId);
      if (built && built.length) return built;
      return [];
    }
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

  function flashAttack(slotKey, mobId, action, opts = {}) {
    const el = slotEl(slotKey);
    if (!el || typeof IdleMobAnim === 'undefined') return false;
    const id = pad(mobId);
    el.dataset.mobId = id;
    return !!IdleMobAnim.flashActorAttack(el, action, {
      iconId: id,
      scaleDelayMs,
      startFrame: opts.startFrame,
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
        skipHurtIframe: !!opts.skipHurtIframe,
      });
    }
    if (isSuu() && opts.heatOnHit !== false) {
      const heat = Number(opts.heatOnHit);
      heatSuuGauge(Number.isFinite(heat) && heat > 0 ? heat : 6);
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

  /** skillN 播完接 afterKey；可在本體幀（castDamageFrame）或 after 幀（damageFrame）出傷 */
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
    const rawRatio = Number(atk.skillChain.dmgRatio);
    const ratio = Number.isFinite(rawRatio) ? rawRatio : 1;
    const hitDmg = Math.max(0, Math.floor((Number(atk.dmg) || 0) * dM * Math.max(0, ratio)));
    const playerEl = getBossPlayerEl();
    const castDmgFr = Number(atk.skillChain.castDamageFrame);
    const hasCastHit = Number.isFinite(castDmgFr) && castDmgFr >= 0 && hitDmg > 0;
    const afterDmgFr = Number(atk.skillChain.damageFrame);
    // 有 castDamageFrame 時只在本體出傷；否則沿用 after 的 damageFrame
    const hasAfterHit = !hasCastHit && Number.isFinite(afterDmgFr) && afterDmgFr >= 0 && hitDmg > 0;

    fight.bossActionLock = { slotKey, actionKey: key };
    const unlock = () => {
      if (fight?.bossActionLock?.slotKey === slotKey && fight.bossActionLock?.actionKey === key) {
        fight.bossActionLock = null;
      }
    };

    const applyHit = () => {
      if (playerEl && typeof IdleMobAnim.playPlayerHit === 'function') {
        IdleMobAnim.playPlayerHit(playerEl, castId, key, { immediate: true });
      }
      const heatOpts = (isSuu() && Number(atk.heatOnHit) > 0)
        ? { heatOnHit: Number(atk.heatOnHit) }
        : undefined;
      hurtPlayerFromBoss(slotKey, hitDmg, heatOpts);
    };

    if (!flashAttack(slotKey, castId, key)) {
      unlock();
      if (atkAcc[slotKey]) atkAcc[slotKey][key] = 0;
      return;
    }
    const castCap = scaleDelayMs(mobAnimMs(castId, key, 2000) + 200);
    const castHitAt = hasCastHit
      ? scaleDelayMs(IdleMobAnim.actionFrameOffsetMs?.(castId, key, castDmgFr) || 0)
      : -1;
    const castStart = Date.now();
    let castDamaged = false;
    while (Date.now() - castStart < castCap) {
      if (seq !== atkFxSeq || !fight || fight.mode !== 'fight') {
        if (!skipStandOnBossCancel()) bindVisual(slotKey, bodyId, 'stand');
        unlock();
        return;
      }
      if (hasCastHit && !castDamaged && Date.now() - castStart >= castHitAt) {
        castDamaged = true;
        applyHit();
      }
      if (!IdleMobAnim.isActorCasting?.(el)) break;
      await sleep(TICK_MS);
    }
    if (hasCastHit && !castDamaged && seq === atkFxSeq && fight) {
      castDamaged = true;
      applyHit();
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

    const dmgDelay = hasAfterHit
      ? scaleDelayMs(IdleMobAnim.actionFrameOffsetMs?.(castId, afterKey, afterDmgFr) || 0)
      : -1;
    const afterMs = scaleDelayMs(mobAnimMs(castId, afterKey, 1200) + 200);
    const afterStart = Date.now();
    let afterDamaged = false;
    while (Date.now() - afterStart < afterMs) {
      if (seq !== atkFxSeq || !fight || fight.mode !== 'fight') {
        if (!skipStandOnBossCancel()) bindVisual(slotKey, bodyId, 'stand');
        unlock();
        return;
      }
      if (hasAfterHit && !afterDamaged && Date.now() - afterStart >= dmgDelay) {
        afterDamaged = true;
        applyHit();
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
        && !atk.banbanSummon && !atk.suuSummonPattern && !atk.damienCast) {
        continue;
      }
      const castId = pad(atk.flashMob || iconId);
      const isAreaWarn = !atk.channel && !atk.castTicks && !atk.skillChain
        && !atk.bombAfter && !atk.damageChain && !atk.healSelfRatio && !atk.sealSkillsMs && !atk.dropToHpRatio
        && !atk.banbanSummon && !atk.suuSummonPattern && !atk.damienCast
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
      || r.atk.banbanSummon || r.atk.damienCast);
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

    if (atk.suuSummonPattern) {
      void runSuuBodySummonSkill(slotKey, unit, atk);
      return;
    }

    if (atk.damienCast) {
      void runDamienCast(slotKey, unit, atk);
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
      const heatOpts = (isSuu() && Number(atk.heatOnHit) > 0)
        ? { heatOnHit: Number(atk.heatOnHit) }
        : undefined;
      hurtPlayerFromBoss(slotKey, hitDmg, heatOpts);
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
      const heatOpts = (isSuu() && Number(atk.heatOnHit) > 0)
        ? { heatOnHit: Number(atk.heatOnHit) }
        : undefined;
      hurtPlayerFromBoss(slotKey, hitDmg, heatOpts);
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

    if (isSuu()) {
      tickSuu(dt);
      return;
    }

    if (isDamien()) {
      tickDamien(dt);
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
    if (isDamien()) {
      const p1m = Math.max(0, Number(fight.damienP1Max) || 0);
      const p2m = Math.max(0, Number(fight.damienP2Max) || 0);
      const p1r = Math.max(0, Number(fight.damienP1Remain) || 0);
      const p2r = Math.max(0, Number(fight.damienP2Remain) || 0);
      return {
        hp: p1r + p2r,
        maxHp: Math.max(1, p1m + p2m),
        barRatio: damienBarRatio(),
        phase: fight.phase,
        mode: fight.mode,
      };
    }
    return {
      hp: fight.body.hp,
      maxHp: fight.body.maxHp,
      phase: fight.phase,
      mode: fight.mode,
      shieldHp: isSuu() ? Math.max(0, Number(fight.suuShieldHp) || 0) : 0,
      shieldMax: isSuu() ? Math.max(0, Number(fight.suuShieldMax) || 0) : 0,
      shieldActive: isSuu() ? !!fight.suuShieldActive : false,
    };
  }

  function reset(listId, nextHooks, diffId) {
    cancelHudSync();
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
    'summonMob',
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
    if (script?.chestMapArt) arts.add(String(script.chestMapArt));
    (script?.stages || []).forEach((st) => {
      if (st?.mapArt) arts.add(String(st.mapArt));
    });
    (script?.bodyForms || []).forEach((form) => {
      if (form?.mapArt) arts.add(String(form.mapArt));
    });
    return [...arts];
  }

  /** 史烏 BossPattern／UI 幀 URL（入場 warmAssets 用） */
  function collectSuuPatternUrls(listId) {
    const script = phaseScript(listId);
    if (!script || script.kind !== 'suu') return [];
    const data = (typeof IDLE_BOSS_SUU_PATTERN_DATA !== 'undefined')
      ? IDLE_BOSS_SUU_PATTERN_DATA
      : null;
    if (!data || typeof data !== 'object') return [];
    const urls = [];
    Object.values(data).forEach((entry) => {
      if (!entry || typeof entry !== 'object') return;
      Object.values(entry).forEach((frames) => {
        if (!Array.isArray(frames)) return;
        frames.forEach((fr) => {
          if (fr?.src) urls.push(String(fr.src));
        });
      });
    });
    return [...new Set(urls)];
  }

  /** 入場前預載本場會用到的 BOSS 動畫幀（Pages 改必要幀，其餘邊打邊載） */
  function warmAssets(listId) {
    if (typeof IdleMobAnim === 'undefined') return Promise.resolve();
    const preload = IdleMobAnim.preloadMobEssential || IdleMobAnim.preloadMob;
    const tasks = [];
    if (preload) {
      const ids = collectVisualMobIds(listId);
      tasks.push(...ids.map((id) => preload.call(IdleMobAnim, id)));
    }
    const suuUrls = collectSuuPatternUrls(listId);
    if (suuUrls.length && typeof EnchantImagePreload !== 'undefined'
      && EnchantImagePreload.preloadMany) {
      tasks.push(EnchantImagePreload.preloadMany(suuUrls).catch(() => {}));
    }
    if (!tasks.length) return Promise.resolve();
    return Promise.all(tasks).then(() => {});
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

  /* ========== 史烏（suu）========== */
  function suuKitCfg() {
    return fight?.script?.suuKit || phaseScript(fight?.listId)?.suuKit || {};
  }

  function suuPhaseKit() {
    const kit = suuKitCfg();
    const id = pad(fight?.body?.visualId || '');
    return kit.phaseKits?.[id] || kit.phaseKits?.[String(Number(id))] || {};
  }

  function suuPatternData() {
    return (typeof IDLE_BOSS_SUU_PATTERN_DATA !== 'undefined')
      ? IDLE_BOSS_SUU_PATTERN_DATA
      : null;
  }

  function suuPatternMeta() {
    return (typeof IDLE_BOSS_SUU_PATTERN_META !== 'undefined')
      ? IDLE_BOSS_SUU_PATTERN_META
      : { uiPos: { x: 0, y: 100 } };
  }

  function suuPatternFrame(assetKey, action, frameIdx = 0) {
    const frames = suuPatternData()?.[assetKey]?.[action];
    if (!Array.isArray(frames) || !frames.length) return null;
    const i = Math.max(0, Math.min(frames.length - 1, Math.floor(Number(frameIdx) || 0)));
    return frames[i] || null;
  }

  function ensureSuuGaugeDom() {
    const field = getBossFieldEl();
    if (!field) return null;
    let root = field.querySelector(':scope > .idle-boss-suu-gauge');
    if (!root) {
      root = document.createElement('div');
      root.className = 'idle-boss-suu-gauge';
      // 疊層：backgrnd → backgrnd0（前）→ 條 → tip → label
      root.innerHTML = [
        '<img class="idle-boss-suu-gauge__bg" alt="" draggable="false">',
        '<img class="idle-boss-suu-gauge__bg0" alt="" draggable="false">',
        '<div class="idle-boss-suu-gauge__track" aria-hidden="true">',
        '  <div class="idle-boss-suu-gauge__fill-wrap">',
        '    <img class="idle-boss-suu-gauge__fill" alt="" draggable="false">',
        '  </div>',
        '</div>',
        '<img class="idle-boss-suu-gauge__tip" alt="" draggable="false" hidden>',
        '<div class="idle-boss-suu-gauge__label"></div>',
      ].join('');
      field.appendChild(root);
    }
    return root;
  }

  function ensureSuuAlertDom() {
    const field = getBossFieldEl();
    if (!field) return null;
    let root = field.querySelector(':scope > .idle-boss-suu-alert');
    if (!root) {
      root = document.createElement('div');
      root.className = 'idle-boss-suu-alert';
      root.hidden = true;
      root.innerHTML = '<img class="idle-boss-suu-alert__img" alt="" draggable="false">';
      field.appendChild(root);
    }
    return root;
  }

  function clearSuuGaugeHud() {
    const field = getBossFieldEl();
    field?.querySelector(':scope > .idle-boss-suu-gauge')?.remove();
    field?.querySelector(':scope > .idle-boss-suu-alert')?.remove();
    if (fight) {
      fight.suuAlertFrame = 0;
      fight.suuAlertAcc = 0;
      fight.suuUiBgFrame = 0;
      fight.suuUiBg0Frame = 0;
      fight.suuUiAnimAcc = 0;
    }
    hooks?.syncChallengeHud?.({ hide: true });
  }

  /** destruction＝滿表過熱；overload＝destruction 結束後短暫鎖升溫 */
  function suuInDestruction() {
    return !!(fight && isSuu() && (Number(fight.suuPurgeUntil) || 0) > Date.now());
  }

  function suuInOverload() {
    return !!(fight && isSuu() && (Number(fight.suuOverloadUntil) || 0) > Date.now());
  }

  function suuInPurge() {
    return suuInDestruction();
  }

  function suuGaugeSkin() {
    if (suuInDestruction()) return 'destruction';
    if (suuInOverload()) return 'overload';
    return 'default';
  }

  function suuPatternFrames(assetKey, action) {
    const frames = suuPatternData()?.[assetKey]?.[action];
    return Array.isArray(frames) && frames.length ? frames : null;
  }

  function syncSuuGaugeHud() {
    if (!fight || !isSuu()) return;
    const max = Math.max(1, Number(fight.suuGaugeMax) || 100);
    const cur = Math.max(0, Math.min(max, Number(fight.suuGauge) || 0));
    const destruction = suuInDestruction();
    const overload = suuInOverload();
    const shield = !!fight.suuShieldActive;
    const root = ensureSuuGaugeDom();
    if (!root) return;

    const skin = suuGaugeSkin();
    const bgFrames = suuPatternFrames(`common/UI/${skin}/backgrnd`, '0')
      || suuPatternFrames('common/UI/default/backgrnd', '0');
    const bg0Frames = suuPatternFrames(`common/UI/${skin}/backgrnd0`, '0')
      || suuPatternFrames('common/UI/default/backgrnd0', '0');
    const fillFr = suuPatternFrame(`common/UI/${skin}/gauge`, '0')
      || suuPatternFrame('common/UI/default/gauge', '0');
    const tipFr = suuPatternFrame(`common/UI/${skin}/gauge`, '1')
      || suuPatternFrame('common/UI/default/gauge', '1');
    const pos = suuPatternMeta()?.uiPos || { x: 0, y: 100 };

    // 常駐顯示（含 0）；靠畫面最左
    root.hidden = false;
    root.classList.toggle('is-destruction', destruction);
    root.classList.toggle('is-overload', overload);
    root.classList.toggle('is-shield', shield);
    root.style.left = '0px';
    root.style.top = `${Math.round(Number(pos.y) || 100)}px`;

    const bgEl = root.querySelector('.idle-boss-suu-gauge__bg');
    const bg0El = root.querySelector('.idle-boss-suu-gauge__bg0');
    const track = root.querySelector('.idle-boss-suu-gauge__track');
    const fillWrap = root.querySelector('.idle-boss-suu-gauge__fill-wrap');
    const fillEl = root.querySelector('.idle-boss-suu-gauge__fill');
    const tipEl = root.querySelector('.idle-boss-suu-gauge__tip');
    const label = root.querySelector('.idle-boss-suu-gauge__label');

    const bgFi = Math.floor(Number(fight.suuUiBgFrame) || 0);
    const bg0Fi = Math.floor(Number(fight.suuUiBg0Frame) || 0);
    const bg = bgFrames ? bgFrames[bgFi % bgFrames.length] : null;
    const bg0 = bg0Frames ? bg0Frames[bg0Fi % bg0Frames.length] : null;

    if (bgEl) {
      if (bg?.src) {
        bgEl.hidden = false;
        bgEl.src = bg.src;
      } else bgEl.hidden = true;
    }
    if (bg0El) {
      if (bg0?.src) {
        bg0El.hidden = false;
        bg0El.src = bg0.src;
      } else bg0El.hidden = true;
    }

    // overload：短暫不加過熱條 → 顯示容器但不漲 fill
    // destruction：依剩餘持續時間從滿慢慢清空
    let pct = 0;
    if (destruction) {
      const dur = Math.max(1, Number(fight.suuPurgeDurationMs) || 1);
      const left = Math.max(0, (Number(fight.suuPurgeUntil) || 0) - Date.now());
      pct = Math.max(0, Math.min(1, left / dur));
      fight.suuGauge = max * pct;
    } else if (!overload) {
      pct = cur / max;
    }
    const showFill = !overload;
    const fox = Number(fillFr?.origin?.[0]);
    const foy = Number(fillFr?.origin?.[1]);
    const fillLeft = Number.isFinite(fox) ? -fox : 86;
    const fillTop = Number.isFinite(foy) ? -foy : 74;
    if (track) {
      track.hidden = !showFill;
      track.style.left = `${Math.round(fillLeft)}px`;
      track.style.top = `${Math.round(fillTop)}px`;
    }
    if (fillEl && fillFr?.src) fillEl.src = fillFr.src;
    if (fillWrap) {
      fillWrap.style.height = `${Math.max(0, Math.min(100, pct * 100)).toFixed(2)}%`;
    }
    if (tipEl) {
      if (showFill && tipFr?.src && pct > 0.02) {
        tipEl.hidden = false;
        tipEl.src = tipFr.src;
        const tox = Number(tipFr.origin?.[0]) || 1;
        const toy = Number(tipFr.origin?.[1]) || 1;
        tipEl.style.left = `${Math.round(fillLeft + 4 - tox)}px`;
        tipEl.style.top = `${Math.round(fillTop + 102 * (1 - pct) - toy)}px`;
      } else {
        tipEl.hidden = true;
      }
    }
    if (label) {
      label.hidden = true;
      label.textContent = '';
    }

    if (destruction) showSuuAlertFrame();
    else hideSuuAlertFrame();

    hooks?.syncChallengeHud?.({ hide: true });
  }

  function showSuuAlertFrame() {
    const frames = suuPatternData()?.['common/alertFrameEffect/1366']?.['0'];
    const root = ensureSuuAlertDom();
    if (!root) return;
    if (!Array.isArray(frames) || !frames.length) {
      root.hidden = true;
      return;
    }
    root.hidden = false;
    if (!Number.isFinite(Number(fight.suuAlertFrame))) fight.suuAlertFrame = 0;
    if (!Number.isFinite(Number(fight.suuAlertAcc))) fight.suuAlertAcc = 0;
    const img = root.querySelector('.idle-boss-suu-alert__img');
    const fr = frames[Math.floor(Number(fight.suuAlertFrame) || 0) % frames.length];
    if (img && fr?.src) img.src = fr.src;
  }

  function hideSuuAlertFrame() {
    const root = getBossFieldEl()?.querySelector(':scope > .idle-boss-suu-alert');
    if (root) root.hidden = true;
    if (fight) {
      fight.suuAlertFrame = 0;
      fight.suuAlertAcc = 0;
    }
  }

  function tickSuuAlertFrame(dt) {
    if (!fight || !isSuu() || !suuInDestruction()) {
      if (!suuInDestruction()) hideSuuAlertFrame();
      return;
    }
    const frames = suuPatternData()?.['common/alertFrameEffect/1366']?.['0'];
    if (!Array.isArray(frames) || !frames.length) return;
    const root = ensureSuuAlertDom();
    if (!root) return;
    root.hidden = false;
    fight.suuAlertAcc = (Number(fight.suuAlertAcc) || 0) + Math.max(0, Number(dt) || 0) * 1000;
    let fi = Math.floor(Number(fight.suuAlertFrame) || 0) % frames.length;
    let guard = 0;
    while (guard < 16) {
      const delay = Math.max(30, Number(frames[fi]?.delay) || 60);
      if ((Number(fight.suuAlertAcc) || 0) < delay) break;
      fight.suuAlertAcc -= delay;
      fi = (fi + 1) % frames.length;
      guard += 1;
    }
    fight.suuAlertFrame = fi;
    const img = root.querySelector('.idle-boss-suu-alert__img');
    if (img && frames[fi]?.src) img.src = frames[fi].src;
  }

  function tickSuuGaugeUiAnim(dt) {
    if (!fight || !isSuu()) return;
    const skin = suuGaugeSkin();
    // 僅 destruction 的 backgrnd／backgrnd0 多幀需循環
    if (skin !== 'destruction') {
      fight.suuUiBgFrame = 0;
      fight.suuUiBg0Frame = 0;
      fight.suuUiAnimAcc = 0;
      return;
    }
    const bgFrames = suuPatternFrames('common/UI/destruction/backgrnd', '0');
    const bg0Frames = suuPatternFrames('common/UI/destruction/backgrnd0', '0');
    if (!bgFrames && !bg0Frames) return;
    fight.suuUiAnimAcc = (Number(fight.suuUiAnimAcc) || 0) + Math.max(0, Number(dt) || 0) * 1000;
    const step = 60;
    let guard = 0;
    while ((Number(fight.suuUiAnimAcc) || 0) >= step && guard < 16) {
      fight.suuUiAnimAcc -= step;
      if (bgFrames?.length) {
        fight.suuUiBgFrame = (Math.floor(Number(fight.suuUiBgFrame) || 0) + 1) % bgFrames.length;
      }
      if (bg0Frames?.length) {
        fight.suuUiBg0Frame = (Math.floor(Number(fight.suuUiBg0Frame) || 0) + 1) % bg0Frames.length;
      }
      guard += 1;
    }
  }

  function enterSuuDestruction() {
    if (!fight || !isSuu()) return;
    const sec = Math.max(3, Number(suuKitCfg().gauge?.purgeSec) || 18);
    const durMs = scaleDelayMs(sec * 1000);
    fight.suuPurgeDurationMs = durMs;
    fight.suuPurgeUntil = Date.now() + durMs;
    fight.suuOverloadUntil = 0;
    fight.suuUiBgFrame = 0;
    fight.suuUiBg0Frame = 0;
    fight.suuUiAnimAcc = 0;
    syncSuuGaugeHud();
  }

  function endSuuDestruction() {
    if (!fight || !isSuu()) return;
    fight.suuPurgeUntil = 0;
    fight.suuPurgeDurationMs = 0;
    fight.suuGauge = 0;
    fight.suuDamageTowardCool = 0;
    const overSec = Math.max(1, Number(suuKitCfg().gauge?.overloadSec) || 5);
    fight.suuOverloadUntil = Date.now() + scaleDelayMs(overSec * 1000);
    fight.suuUiBgFrame = 0;
    fight.suuUiBg0Frame = 0;
    hideSuuAlertFrame();
    syncSuuGaugeHud();
  }

  function heatSuuGauge(amount) {
    if (!fight || !isSuu() || !(amount > 0)) return;
    // destruction 期間鎖表；overload 短暫不加過熱
    if (suuInDestruction() || suuInOverload()) return;
    const max = Math.max(1, Number(fight.suuGaugeMax) || 100);
    fight.suuGauge = Math.min(max, (Number(fight.suuGauge) || 0) + amount);
    if (fight.suuGauge >= max && !suuInDestruction()) {
      enterSuuDestruction();
      return;
    }
    syncSuuGaugeHud();
  }

  function coolSuuGaugeByDamage(appliedDmg) {
    if (!fight || !isSuu() || !(appliedDmg > 0)) return;
    // destruction／overload 期間不靠輸出降溫（表已鎖或清空）
    if (suuInDestruction() || suuInOverload()) return;
    const maxHp = Math.max(1, Number(fight.body?.maxHp) || 1);
    const perPct = Number(suuKitCfg().gauge?.coolPerMaxHpPct);
    const coolPer = (Number.isFinite(perPct) && perPct > 0) ? perPct : 2;
    fight.suuDamageTowardCool = (Number(fight.suuDamageTowardCool) || 0) + appliedDmg;
    const chunk = maxHp * 0.01;
    if (!(chunk > 0)) return;
    while (fight.suuDamageTowardCool >= chunk) {
      fight.suuDamageTowardCool -= chunk;
      fight.suuGauge = Math.max(0, (Number(fight.suuGauge) || 0) - coolPer);
    }
    syncSuuGaugeHud();
  }

  function applySuuShieldIncoming(raw, opts = {}) {
    if (!fight?.suuShieldActive) return raw;
    const commit = !!opts.commit;
    let remain = Math.max(0, Math.floor(Number(raw) || 0));
    if (!(remain > 0)) return 0;

    // 護盾存在期間先吃減傷，再扣護盾池；溢傷進本體（同擊已減傷）
    const dr = Number(suuKitCfg().shield?.damageReduce);
    const reduce = (Number.isFinite(dr) && dr > 0) ? Math.min(0.95, dr) : 0.9;
    remain = Math.max(1, Math.floor(remain * (1 - reduce)));

    const shAtStart = Math.max(0, Math.floor(Number(fight.suuShieldHp) || 0));
    if (shAtStart > 0) {
      const absorbed = Math.min(shAtStart, remain);
      if (commit) {
        fight.suuShieldHp = shAtStart - absorbed;
        if (fight.suuShieldHp <= 0) {
          fight.suuShieldHp = 0;
          endSuuShield(false);
        }
      }
      remain -= absorbed;
    }
    if (!(remain > 0)) {
      // 全被護盾吃掉：實扣 0；預覽回 1 避免 canDeal 誤判
      return commit ? 0 : 1;
    }
    return remain;
  }

  function clearSuuShieldLoop() {
    const el = fight?.suuShieldLoopEl;
    if (el) {
      try { el.remove(); } catch (_) { /* ignore */ }
    }
    if (fight) fight.suuShieldLoopEl = null;
  }

  /** 腳底／王體 → field 座標（兩 stage 是兄弟，不可用 offsetParent 串） */
  function suuFieldPointFromPlayer() {
    const field = getBossFieldEl();
    const playerEl = getBossPlayerEl();
    if (!field || !playerEl) {
      const bossPos = hooks?.getBossPos?.() || { x: 720, y: 610 };
      return { x: bossPos.x - 160, y: bossPos.y };
    }
    const fr = field.getBoundingClientRect();
    const pr = playerEl.getBoundingClientRect();
    const feet = (typeof Paperdoll !== 'undefined'
      && typeof Paperdoll.getHuntFeetAnchor === 'function')
      ? Paperdoll.getHuntFeetAnchor(playerEl)
      : null;
    const lx = (feet && Number.isFinite(feet.x)) ? feet.x : Math.round((pr.width || 120) * 0.5);
    const ly = (feet && Number.isFinite(feet.y)) ? feet.y : Math.round((pr.height || 160) * 0.78);
    return {
      x: Math.round(pr.left - fr.left + lx),
      y: Math.round(pr.top - fr.top + ly),
    };
  }

  function suuFieldPointFromBoss() {
    const field = getBossFieldEl();
    const bodyEl = slotEl('body');
    const bossPos = hooks?.getBossPos?.() || { x: 720, y: 610 };
    if (!field) return { x: bossPos.x, y: bossPos.y };
    if (bodyEl) {
      const fr = field.getBoundingClientRect();
      const br = bodyEl.getBoundingClientRect();
      // body 的 left/top 即 origin（腳底）；用 style 優先（與舞台同座標）
      const sx = parseFloat(bodyEl.style.left);
      const sy = parseFloat(bodyEl.style.top);
      if (Number.isFinite(sx) && Number.isFinite(sy)) {
        return { x: Math.round(sx), y: Math.round(sy) };
      }
      return {
        x: Math.round(br.left - fr.left + (br.width || 0) * 0.5),
        y: Math.round(br.top - fr.top + (br.height || 0)),
      };
    }
    return { x: Math.round(bossPos.x), y: Math.round(bossPos.y) };
  }

  /** 場中央偏下（地板高度） */
  function suuFieldPointMapCenter() {
    const field = getBossFieldEl();
    const W = field?.clientWidth || 1366;
    const H = field?.clientHeight || 768;
    return { x: Math.round(W * 0.5), y: Math.round(H * 0.78) };
  }

  /** 場上方正中央 */
  function suuFieldPointMapTopCenter() {
    const field = getBossFieldEl();
    const W = field?.clientWidth || 1366;
    const H = field?.clientHeight || 768;
    return { x: Math.round(W * 0.5), y: Math.round(H * 0.14) };
  }

  /** P1 核心：地圖下方正中央（鋸刃 pre 等） */
  function suuFieldPointMapCore() {
    const cfg = suuKitCfg()?.corePos;
    if (cfg && Number.isFinite(cfg.x) && Number.isFinite(cfg.y)) {
      return { x: Math.round(cfg.x), y: Math.round(cfg.y) };
    }
    const field = getBossFieldEl();
    const W = field?.clientWidth || 1366;
    const H = field?.clientHeight || 768;
    return { x: Math.round(W * 0.5), y: Math.round(H * 0.92) };
  }

  function suuResolveFxAnchor(anchorMode, opts = {}) {
    if (anchorMode === 'boss') return suuFieldPointFromBoss();
    if (anchorMode === 'mapCenter') return suuFieldPointMapCenter();
    if (anchorMode === 'mapTopCenter' || anchorMode === 'topCenter') {
      return suuFieldPointMapTopCenter();
    }
    if (anchorMode === 'mapCore' || anchorMode === 'core') return suuFieldPointMapCore();
    if (anchorMode === 'map') {
      if (Number.isFinite(opts.mapX) && Number.isFinite(opts.mapY)) {
        return { x: opts.mapX, y: opts.mapY };
      }
      return suuFieldPointFromPlayer();
    }
    return suuFieldPointFromPlayer();
  }

  /** 只用 WZ origin；載入後重算，避免未預載時位移／閃爍 */
  function applySuuFxOrigin(img, origin, opts = {}) {
    if (!img) return;
    const ox = Number(origin?.[0]) || 0;
    const oy = Number(origin?.[1]) || 0;
    const paintOrigin = () => {
      const h = img.naturalHeight || 0;
      let useOy = oy;
      if (opts.alignOriginBottom && h > 0) {
        // 圖底對齊錨點（特效由上往下接到腳邊）
        useOy = h;
      } else if (opts.clampOriginToSprite && h > 0 && useOy > h) {
        useOy = h;
      }
      img.style.setProperty('--ox', `${ox}px`);
      img.style.setProperty('--oy', `${useOy}px`);
      img.style.left = `calc(-1 * var(--ox, 0px))`;
      img.style.top = `calc(-1 * var(--oy, 0px))`;
    };
    paintOrigin();
    if (!(img.complete && img.naturalHeight)) {
      img.addEventListener('load', paintOrigin, { once: true });
    }
  }

  function trySuuShield() {
    if (!fight || !isSuu() || busy || fight.mode !== 'fight') return;
    if ((Number(fight.bodyFormIndex) || 0) !== 0) return;
    const cfg = suuKitCfg().shield || {};
    const now = Date.now();
    if (fight.suuShieldActive) {
      if (now >= (Number(fight.suuShieldUntil) || 0)) {
        endSuuShield(true);
      }
      return;
    }
    if (now < (Number(fight.suuNextShieldAt) || 0)) return;
    const dur = Math.max(3, Number(cfg.durationSec) || 18);
    fight.suuShieldActive = true;
    fight.suuShieldUntil = now + scaleDelayMs(dur * 1000);
    const cdBase = Math.max(dur + 5, Number(cfg.cdSec) || 40);
    const cd = Math.max(dur + 5, cdBase * resolveSuuDiffPatternCdMult());
    fight.suuNextShieldAt = now + scaleDelayMs(cd * 1000);
    const hpRatio = Number(cfg.hpRatio);
    const ratio = (Number.isFinite(hpRatio) && hpRatio > 0) ? hpRatio : 0.05;
    const pool = Math.max(1, Math.floor((Number(fight.body?.maxHp) || 1) * ratio));
    fight.suuShieldMax = pool;
    fight.suuShieldHp = pool;
    clearSuuShieldLoop();
    // pre 詠唱 → 再掛 loop 直到破盾／逾時
    const preMs = playSuuPatternFx('1000/006', 'pre', { anchor: 'boss' }) || 800;
    window.setTimeout(() => {
      if (!fight || !fight.suuShieldActive) return;
      playSuuPatternFx('1000/006', 'loop', {
        anchor: 'boss',
        loop: 'shield',
        onCreate: (el) => { if (fight) fight.suuShieldLoopEl = el; },
      });
    }, scaleDelayMs(Math.min(preMs, 1600)));
    syncSuuGaugeHud();
    syncHud();
  }

  function endSuuShield(expired) {
    if (!fight || !isSuu()) return;
    const was = fight.suuShieldActive;
    const left = Math.max(0, Math.floor(Number(fight.suuShieldHp) || 0));
    const maxSh = Math.max(1, Math.floor(Number(fight.suuShieldMax) || 0));
    fight.suuShieldActive = false;
    fight.suuShieldUntil = 0;
    fight.suuShieldHp = 0;
    fight.suuShieldMax = 0;
    clearSuuShieldLoop();
    if (was && expired && fight.body && fight.body.hp > 0 && left > 0) {
      const ratio = Number(suuKitCfg().shield?.healRatioOnExpire);
      const healR = (Number.isFinite(ratio) && ratio > 0) ? ratio : 0.04;
      const frac = Math.min(1, left / maxSh);
      const heal = Math.max(1, Math.floor((Number(fight.body.maxHp) || 1) * healR * frac));
      fight.body.hp = Math.min(fight.body.maxHp, fight.body.hp + heal);
    }
    if (was) playSuuPatternFx('1000/006', 'end', { anchor: 'boss' });
    syncSuuGaugeHud();
    syncHud();
  }

  function playSuuPatternFx(assetKey, actionOrList, opts = {}) {
    if (!assetKey) return 0;
    const data = (typeof IDLE_BOSS_SUU_PATTERN_DATA !== 'undefined')
      ? IDLE_BOSS_SUU_PATTERN_DATA
      : null;
    const entry = data?.[assetKey];
    if (!entry || typeof entry !== 'object') return 0;

    const preferred = Array.isArray(actionOrList)
      ? actionOrList
      : (actionOrList ? [actionOrList] : []);
    const fallback = {
      pre: ['pre', 'effect', 'warning', 'lockOn', 'ball', 'areaWarning', 'summon', 'regen', 'special'],
      hit: ['hit', 'attack', 'end', 'special', 'destroyed', 'ball'],
      end: ['end', 'hit', 'die', 'die2'],
      loop: ['loop'],
    };
    const keys = preferred.length
      ? preferred
      : (fallback[String(actionOrList)] || ['pre', 'effect', 'hit']);

    let frames = null;
    let usedKey = null;
    for (let i = 0; i < keys.length; i += 1) {
      const cand = entry[keys[i]];
      if (Array.isArray(cand) && cand.length) {
        frames = cand;
        usedKey = keys[i];
        break;
      }
    }
    if (!frames) return 0;

    // 可選幀區間：frameStart 含、frameEnd 不含
    const f0 = Math.max(0, Math.floor(Number(opts.frameStart) || 0));
    const f1Raw = Number(opts.frameEnd);
    const f1 = Number.isFinite(f1Raw)
      ? Math.min(frames.length, Math.max(f0, Math.floor(f1Raw)))
      : frames.length;
    if (f0 > 0 || f1 < frames.length) {
      frames = frames.slice(f0, f1);
    }
    if (!frames.length) return 0;

    const anchorMode = opts.anchor || 'feet';
    const field = getBossFieldEl();
    const st = stage();
    const host = field || st;
    if (!host) return 0;

    const el = document.createElement('div');
    el.className = 'idle-boss-suu-fx-stage';
    el.dataset.slot = `suuFx_${Date.now()}_${usedKey || 'fx'}`;
    el.innerHTML = '<img class="idle-actor-sprite idle-boss-suu-fx-sprite" alt="" draggable="false">';

    let pos = suuResolveFxAnchor(anchorMode, opts);
    // 預設夾在場內；noPosClamp 允許掛在場外（天上加農砲等）
    const maxY = field ? (field.clientHeight || 768) : 768;
    const maxX = field ? (field.clientWidth || 1366) : 1366;
    if (opts.noPosClamp) {
      pos.x = Math.round(pos.x);
      pos.y = Math.round(pos.y);
    } else {
      pos.x = Math.max(0, Math.min(maxX, Math.round(pos.x)));
      pos.y = Math.max(0, Math.min(maxY, Math.round(pos.y)));
    }
    el.style.left = `${pos.x}px`;
    el.style.top = `${pos.y}px`;
    if (Number.isFinite(Number(opts.zIndex))) {
      el.style.zIndex = String(Math.floor(Number(opts.zIndex)));
    }
    if (Number.isFinite(opts.rotateRad) || opts.flipX || opts.flipY) {
      const parts = [];
      if (opts.flipX) parts.push('scaleX(-1)');
      if (opts.flipY) parts.push('scaleY(-1)');
      if (Number.isFinite(opts.rotateRad)) parts.push(`rotate(${opts.rotateRad}rad)`);
      el.style.transform = parts.join(' ');
      el.style.transformOrigin = '0 0';
    }
    host.appendChild(el);

    if (typeof opts.onCreate === 'function') opts.onCreate(el);

    const img = el.querySelector('img');
    let fi = 0;
    const paint = () => {
      const fr = frames[fi];
      if (!fr || !img) return;
      img.src = fr.src;
      applySuuFxOrigin(img, fr.origin, {
        clampOriginToSprite: !!opts.clampOriginToSprite,
        alignOriginBottom: !!opts.alignOriginBottom,
      });
    };
    paint();
    const keepLoop = () => !!(opts.loop && el.isConnected
      && (opts.loop === true || (opts.loop === 'shield' && fight?.suuShieldActive)));
    const step = () => {
      if (!el.isConnected) return;
      fi += 1;
      if (fi >= frames.length) {
        if (keepLoop()) {
          fi = 0;
          paint();
          window.setTimeout(step, Math.max(30, Number(frames[0]?.delay) || 60));
          return;
        }
        // WZ repeatIdx：播完後從該幀起循環（引爆預備等）
        const ri = Number(opts.repeatIdx);
        if (Number.isFinite(ri) && el.isConnected) {
          fi = Math.max(0, Math.min(frames.length - 1, Math.floor(ri)));
          paint();
          window.setTimeout(step, Math.max(30, Number(frames[fi]?.delay) || 60));
          return;
        }
        if (opts.holdLast && el.isConnected) {
          fi = frames.length - 1;
          paint();
          return;
        }
        el.remove();
        if (fight?.suuShieldLoopEl === el) fight.suuShieldLoopEl = null;
        return;
      }
      paint();
      window.setTimeout(step, Math.max(30, Number(frames[fi]?.delay) || 60));
    };
    window.setTimeout(step, Math.max(30, Number(frames[0]?.delay) || 60));
    let est = 0;
    for (let i = 0; i < frames.length; i += 1) est += Math.max(30, Number(frames[i]?.delay) || 60);
    return est;
  }

  function removeSuuFxEls(els) {
    if (!Array.isArray(els) || !els.length) return;
    for (let i = 0; i < els.length; i += 1) {
      try { els[i]?.remove(); } catch (_) { /* */ }
    }
    els.length = 0;
  }

  /**
   * 巢狀 0／1 壓成連續幀時：拆兩層同步播（後半＝1 在後、前半＝0 在前）
   * opts: mapX/mapY/anchor/loop/holdLast/zIndex/onCreate；stack:false 則整段單層
   */
  function playSuuStacked01Fx(assetKey, action, opts = {}) {
    const frames = suuPatternFrames(assetKey, action) || [];
    const out = { ms: 0, els: [] };
    if (!frames.length) return out;
    const track = (el) => {
      if (el) out.els.push(el);
      if (typeof opts.onCreate === 'function') opts.onCreate(el);
    };
    const framesDelay = (a, b) => {
      let t = 0;
      const end = Math.min(frames.length, b);
      for (let i = Math.max(0, a); i < end; i += 1) {
        t += Math.max(30, Number(frames[i]?.delay) || 60);
      }
      return t;
    };
    const half = Math.floor(frames.length / 2);
    const z0 = Math.max(1, Math.floor(Number(opts.zIndex) || 1));
    const base = {
      anchor: opts.anchor || 'map',
      mapX: opts.mapX,
      mapY: opts.mapY,
      loop: !!opts.loop,
      holdLast: opts.loop ? false : (opts.holdLast !== false),
    };
    if (half > 0 && opts.stack !== false) {
      playSuuPatternFx(assetKey, action, {
        ...base,
        frameStart: half,
        frameEnd: frames.length,
        zIndex: z0,
        onCreate: track,
      });
      playSuuPatternFx(assetKey, action, {
        ...base,
        frameStart: 0,
        frameEnd: half,
        zIndex: z0 + 1,
        onCreate: track,
      });
      out.ms = Math.max(framesDelay(0, half), framesDelay(half, frames.length));
      return out;
    }
    out.ms = playSuuPatternFx(assetKey, action, {
      ...base,
      zIndex: z0 + 1,
      onCreate: track,
    }) || 0;
    return out;
  }

  /** 同時播多層 action（各層可不同 anchor／loop／holdLast） */
  function playSuuPatternLayers(assetKey, layers) {
    const out = { maxEst: 0, els: [], clearEls: [] };
    if (!assetKey || !Array.isArray(layers) || !layers.length) return out;
    for (let i = 0; i < layers.length; i += 1) {
      const layer = layers[i];
      if (!layer?.action) continue;
      const needClear = !!(layer.loop || layer.holdLast || layer.clearOnHit);
      const est = playSuuPatternFx(assetKey, layer.action, {
        anchor: layer.anchor || 'feet',
        mapX: layer.mapX,
        mapY: layer.mapY,
        loop: !!layer.loop,
        holdLast: !!layer.holdLast,
        repeatIdx: layer.repeatIdx,
        frameStart: layer.frameStart,
        frameEnd: layer.frameEnd,
        zIndex: layer.zIndex,
        flipX: !!layer.flipX,
        rotateRad: layer.rotateRad,
        clampOriginToSprite: !!layer.clampOriginToSprite,
        onCreate: (el) => {
          if (el) {
            out.els.push(el);
            if (needClear) out.clearEls.push(el);
          }
          if (typeof layer.onCreate === 'function') layer.onCreate(el);
        },
      });
      if (est > out.maxEst) out.maxEst = est;
    }
    return out;
  }

  function normalizeSuuFxLayers(row, which) {
    const layers = row?.[which];
    if (Array.isArray(layers) && layers.length && typeof layers[0] === 'object') {
      return layers;
    }
    // 舊欄位相容
    const legacy = which === 'fxHitLayers' ? row?.fxHit : row?.fxPre;
    const anchor = row?.anchor || 'feet';
    if (Array.isArray(legacy) && legacy.length) {
      return legacy.map((action) => ({ action, anchor }));
    }
    return null;
  }

  /** 依目前階解析 pattern 資產；支援 assetKeyByPhase */
  function resolveSuuPatternAsset(row) {
    if (!row) return null;
    const phase = Math.max(1, Math.floor(Number(fight?.phase) || 1));
    const by = row.assetKeyByPhase;
    if (by && typeof by === 'object') {
      const k = by[phase] || by[String(phase)];
      if (k) return String(k);
    }
    return row.assetKey ? String(row.assetKey) : null;
  }

  function resolveSuuCountByDiff(mapOrNum, fallback = 1) {
    if (mapOrNum && typeof mapOrNum === 'object' && !Array.isArray(mapOrNum)) {
      const diffId = String(activeDiff?.id || fight?.difficultyId || 'hard');
      const n = Number(mapOrNum[diffId] ?? mapOrNum.hard);
      if (n > 0) return Math.floor(n);
    }
    const n = Number(mapOrNum);
    return n > 0 ? Math.floor(n) : fallback;
  }

  function clearSuuSummonSlots() {
    const st = stage();
    if (!st) return;
    st.querySelectorAll('.idle-boss-part[data-slot]').forEach((el) => {
      const key = el.getAttribute('data-slot') || '';
      if (/^suu(Mine|Robot)/.test(key)) {
        try { el.remove(); } catch (_) { /* */ }
      }
    });
  }

  function mountSuuSummonActor(key, mobId, x, y, z = 36) {
    const st = stage();
    if (!st || !key || !mobId) return null;
    const id = pad(mobId);
    let el = slotEl(key);
    if (!el) {
      st.insertAdjacentHTML('beforeend', `<div class="idle-actor idle-actor--mob idle-boss-part"
        data-slot="${key}" data-uid="${key}" data-mob-id="${id}"
        style="left:${Math.round(x)}px;top:${Math.round(y)}px;z-index:${z};pointer-events:none">
        <div class="idle-actor-sprite-stage">
          <img class="idle-actor-sprite" alt="" draggable="false">
        </div>
      </div>`);
      el = slotEl(key);
    } else {
      el.style.display = '';
      el.classList.remove('is-hidden-slot', 'is-dead', 'is-dying');
      el.style.pointerEvents = 'none';
      setActorStylePos(el, x, y);
      el.style.zIndex = String(z);
      el.dataset.mobId = id;
    }
    return el;
  }

  /**
   * 자폭 지뢰（8881107）：播一次 1000/007 effect → 同高度並排多顆（畫面多、出傷少）
   * 高度＝鋸刃 corePos（mapCore）；X 以玩家為中心左右錯開
   * stand／fly 待機 → attack1 自爆；僅 hitCount 顆出傷
   */
  async function fireSuuSuicideMine(row) {
    if (!fight || !isSuu() || !row) return;
    const mobId = pad(row.summonMob || '8881107');
    const hitDmg = suuPatternDmg(row);
    const heat = Number(row.heatOnHit) || 6;
    const visualN = Math.max(1, resolveSuuCountByDiff(row.visualCountByDiff ?? row.visualCount, 4));
    const hitN = Math.max(1, Math.min(visualN, resolveSuuCountByDiff(row.hitCountByDiff ?? row.hitCount, 2)));
    const fuseMs = scaleDelayMs(Math.max(600, Number(row.fuseMs) || 2800));
    const warnFx = String(row.warnFxKey || '1000/007');
    const field = getBossFieldEl();
    const maxX = field?.clientWidth || 1366;
    const feet = suuFieldPointFromPlayer();
    // 同鋸刃地板高度（corePos）；左右並排
    const coreY = suuFieldPointMapCore().y;
    const { xs, dmgIdx } = suuResolveVisualSpread(
      { visualCount: visualN, spreadPx: Number(row.spreadPx) || 160 },
      feet.x,
      maxX,
    );

    if (suuHasPatternAction(warnFx, 'effect')) {
      playSuuPatternFx(warnFx, 'effect', { anchor: 'boss' });
    }

    // 出傷：優先中間靠近玩家的 hitN 顆
    const dmgFlags = xs.map(() => false);
    const order = xs
      .map((x, i) => ({ i, dist: Math.abs(i - dmgIdx) }))
      .sort((a, b) => a.dist - b.dist || a.i - b.i);
    for (let k = 0; k < hitN && k < order.length; k += 1) {
      dmgFlags[order[k].i] = true;
    }
    const spots = xs.map((x, i) => ({ x, y: coreY, dmg: dmgFlags[i] }));

    const runOne = async (spot, idx) => {
      const key = `suuMine${Date.now()}_${idx}`;
      const el = mountSuuSummonActor(key, mobId, spot.x, spot.y, 34 + (idx % 5));
      if (!el) return;
      try {
        const hasRegen = !!IdleMobAnim?.resolveAction?.(mobId, 'regen');
        if (hasRegen) {
          bindVisual(key, mobId, 'regen');
          await playAnim(key, mobId, 'regen');
        }
        if (!fight || fight.mode !== 'fight' || !el.isConnected) return;
        const flyAct = IdleMobAnim?.resolveAction?.(mobId, 'fly') ? 'fly' : 'stand';
        bindVisual(key, mobId, flyAct);
        const t0 = Date.now();
        while (Date.now() - t0 < fuseMs) {
          if (!fight || fight.mode !== 'fight' || !el.isConnected) return;
          await sleep(TICK_MS);
        }
        if (!fight || fight.mode !== 'fight' || !el.isConnected) return;
        bindVisual(key, mobId, 'attack1');
        const atkAfter = scaleDelayMs(Math.max(200, Number(row.attackAfterMs) || 720));
        await sleep(atkAfter);
        if (!fight || fight.mode !== 'fight') return;
        if (spot.dmg) {
          suuApplyPatternHit(hitDmg, heat);
        }
        if (IdleMobAnim?.resolveAction?.(mobId, 'die1') && el.isConnected) {
          await playAnim(key, mobId, 'die1');
        }
      } finally {
        removeSlot(key);
      }
    };

    await Promise.all(spots.map((s, i) => runOne(s, i)));
  }

  /**
   * 제압용 로봇（8881108）：隨機點出現 → 飛向玩家 → attack1 自爆
   * 素材預設朝左；在玩家左側時翻轉朝右（面朝玩家）
   * 數量 N/H/E＝4/6/8
   */
  async function fireSuuSuicideRobot(row) {
    if (!fight || !isSuu() || !row) return;
    const mobId = pad(row.summonMob || '8881108');
    const hitDmg = suuPatternDmg(row);
    const heat = Number(row.heatOnHit) || 8;
    const count = Math.max(1, resolveSuuCountByDiff(row.countByDiff ?? row.hitCount, 4));
    const gapMs = scaleDelayMs(Math.max(40, Number(row.spawnGapMs) || 180));
    const flyMs = scaleDelayMs(Math.max(400, Number(row.flyMs) || 1600));
    const prepareMs = scaleDelayMs(Math.max(0, Number(row.prepareMs) || 500));
    const field = getBossFieldEl();
    const maxX = field?.clientWidth || 1366;
    const maxY = field?.clientHeight || 768;

    const randSpawn = () => {
      const edge = Math.floor(Math.random() * 4);
      if (edge === 0) return { x: 40 + Math.random() * (maxX - 80), y: 40 + Math.random() * 80 };
      if (edge === 1) return { x: 40 + Math.random() * (maxX - 80), y: maxY - 60 - Math.random() * 40 };
      if (edge === 2) return { x: 30 + Math.random() * 50, y: 80 + Math.random() * (maxY - 160) };
      return { x: maxX - 80 - Math.random() * 40, y: 80 + Math.random() * (maxY - 160) };
    };

    /** 素材朝左；在目標左側 → 翻轉朝右 */
    const faceToward = (el, fromX, toX) => {
      if (!el) return;
      el.classList.toggle('is-flip-x', fromX < toX);
    };

    const runOne = async (idx) => {
      if (idx > 0 && gapMs > 0) await sleep(gapMs * idx);
      if (!fight || fight.mode !== 'fight') return;
      const start = randSpawn();
      const key = `suuRobot${Date.now()}_${idx}`;
      const el = mountSuuSummonActor(key, mobId, start.x, start.y, 37 + (idx % 6));
      if (!el) return;
      let pos = { ...start };
      try {
        faceToward(el, start.x, suuFieldPointFromPlayer().x);
        if (IdleMobAnim?.resolveAction?.(mobId, 'regen')) {
          bindVisual(key, mobId, 'regen');
          await playAnim(key, mobId, 'regen');
        }
        if (!fight || fight.mode !== 'fight' || !el.isConnected) return;
        const moveAct = IdleMobAnim?.resolveAction?.(mobId, 'fly')
          ? 'fly'
          : (IdleMobAnim?.resolveAction?.(mobId, 'stand') ? 'stand' : 'attack1');
        bindVisual(key, mobId, moveAct);
        faceToward(el, pos.x, suuFieldPointFromPlayer().x);
        if (prepareMs > 0) {
          const tPrep = Date.now();
          while (Date.now() - tPrep < prepareMs) {
            if (!fight || fight.mode !== 'fight' || !el.isConnected) return;
            await sleep(TICK_MS);
          }
        }
        const tFly = Date.now();
        while (Date.now() - tFly < flyMs) {
          if (!fight || fight.mode !== 'fight' || !el.isConnected) return;
          const target = suuFieldPointFromPlayer();
          const t = Math.min(1, (Date.now() - tFly) / flyMs);
          // 加速貼近
          const ease = t * t;
          pos = {
            x: Math.round(start.x + (target.x - start.x) * ease),
            y: Math.round(start.y + (target.y - start.y) * ease),
          };
          setActorStylePos(el, pos.x, pos.y);
          faceToward(el, pos.x, target.x);
          await sleep(33);
        }
        if (!fight || fight.mode !== 'fight' || !el.isConnected) return;
        const impact = suuFieldPointFromPlayer();
        setActorStylePos(el, impact.x, impact.y);
        faceToward(el, pos.x, impact.x);
        bindVisual(key, mobId, 'attack1');
        faceToward(el, pos.x, impact.x);
        const atkAfter = scaleDelayMs(Math.max(200, Number(row.attackAfterMs) || 1500));
        await sleep(atkAfter);
        if (!fight || fight.mode !== 'fight') return;
        const p = suuFieldPointFromPlayer();
        const hitR = Math.max(48, Number(row.hitRadiusPx) || 120);
        if (Math.hypot(p.x - impact.x, p.y - impact.y) <= hitR) {
          suuApplyPatternHit(hitDmg, heat);
        }
        if (IdleMobAnim?.resolveAction?.(mobId, 'die1') && el.isConnected) {
          await playAnim(key, mobId, 'die1');
        }
      } finally {
        removeSlot(key);
      }
    };

    await Promise.all(Array.from({ length: count }, (_, i) => runOne(i)));
  }

  function resolveSuuPatternHitCount(row) {
    const phase = Math.max(1, Math.floor(Number(fight?.phase) || 1));
    const by = row?.hitCountByPhase;
    if (by && typeof by === 'object') {
      const n = Number(by[phase] || by[String(phase)]);
      if (n > 0) return Math.floor(n);
    }
    const n = Number(row?.hitCount);
    return n > 0 ? Math.floor(n) : 1;
  }

  function resolveSuuPatternHitGapMs(row) {
    const phase = Math.max(1, Math.floor(Number(fight?.phase) || 1));
    const by = row?.hitGapMsByPhase;
    if (by && typeof by === 'object') {
      const n = Number(by[phase] || by[String(phase)]);
      if (n > 0) return n;
    }
    const n = Number(row?.hitGapMs);
    return n > 0 ? n : 350;
  }

  /** 難度 CD 倍率：difficulty.patternCdMult（Hard＝1）；可選 kit.patternCdMultByDiff 後備 */
  function resolveSuuDiffPatternCdMult() {
    const fromDiff = Number(activeDiff?.patternCdMult);
    if (fromDiff > 0) return fromDiff;
    const map = suuKitCfg()?.patternCdMultByDiff;
    if (map && typeof map === 'object') {
      const diffId = String(activeDiff?.id || fight?.difficultyId || 'hard');
      const fromKit = Number(map[diffId] ?? map.hard);
      if (fromKit > 0) return fromKit;
    }
    return 1;
  }

  /** Pattern CD：cdSecByPhase／cdSec（Hard 基準）× 難度 patternCdMult；單招可另設 cdMultByDiff */
  function resolveSuuPatternCdSec(row) {
    if (!row) return 8;
    const phase = Math.max(1, Math.floor(Number(fight?.phase) || 1));
    let base = Number(row.cdSec) || 8;
    const byPhase = row.cdSecByPhase;
    if (byPhase && typeof byPhase === 'object') {
      const n = Number(byPhase[phase] || byPhase[String(phase)]);
      if (n > 0) base = n;
    }
    let mult = resolveSuuDiffPatternCdMult();
    const rowMult = row.cdMultByDiff;
    if (rowMult && typeof rowMult === 'object') {
      const diffId = String(activeDiff?.id || fight?.difficultyId || 'hard');
      const m = Number(rowMult[diffId]);
      if (m > 0) mult = m;
    }
    return Math.max(2, base * mult);
  }

  function buildSuuAttacks(listId, mobId) {
    const id = pad(mobId);
    const pkit = suuKitCfg().phaseKits?.[id] || {};
    const exclude = new Set((pkit.excludeActions || []).map(String));
    const ratioMap = pkit.attackHpRatio || {};
    const cdMap = pkit.attackCdSec || {};
    const heatMap = pkit.heatOnHit || {};
    const summonMap = pkit.summonPatternByAction || {};
    const chainMap = pkit.skillChain || {};
    const part = wzPart(listId, id);
    const basePa = Math.max(0, Number(part?.PADamage) || Number(part?.MADamage) || 22000);
    const out = [];
    const seen = new Set();
    const push = (row) => {
      if (!row?.actionKey || seen.has(row.actionKey) || exclude.has(row.actionKey)) return;
      seen.add(row.actionKey);
      out.push(row);
    };
    Object.keys(ratioMap).forEach((actionKey) => {
      if (exclude.has(actionKey)) return;
      if (typeof IdleMobAnim !== 'undefined' && !IdleMobAnim.resolveAction?.(id, actionKey)) return;
      const summonPattern = summonMap[actionKey] ? String(summonMap[actionKey]) : '';
      const chainCfg = chainMap[actionKey];
      const ratio = Number(ratioMap[actionKey]);
      const dmg = summonPattern
        ? 0
        : scaleWzByHpRatio(basePa, Number.isFinite(ratio) ? ratio : 1, 1);
      let cdSec = Number(cdMap[actionKey]);
      if (summonPattern) {
        if (summonPattern === 'debrisRain') {
          const rainCd = Number(suuKitCfg().debrisRain?.skillCdSec);
          cdSec = (rainCd > 0 ? rainCd : (cdSec > 0 ? cdSec : 8))
            * resolveSuuDiffPatternCdMult();
        } else {
          const prow = (Array.isArray(suuKitCfg().patterns) ? suuKitCfg().patterns : [])
            .find((p) => p?.id === summonPattern);
          cdSec = prow
            ? resolveSuuPatternCdSec(prow)
            : Math.max(2, (cdSec > 0 ? cdSec : 8) * resolveSuuDiffPatternCdMult());
        }
      }
      let animMs = Math.max(
        mobAnimMs(id, actionKey, 1600),
        (cdSec > 0 ? cdSec * 1000 : 0),
      );
      if (chainCfg?.afterKey) {
        animMs = Math.max(
          animMs,
          mobAnimMs(id, actionKey, 1600) + mobAnimMs(id, String(chainCfg.afterKey), 1000),
          (cdSec > 0 ? cdSec * 1000 : 0),
        );
      }
      const row = {
        actionKey,
        dmg,
        animMs,
        magic: /^skill/i.test(actionKey),
        heatOnHit: Number(heatMap[actionKey]) || 0,
        suuSummonPattern: summonPattern || undefined,
      };
      if (chainCfg?.afterKey) {
        row.skillChain = {
          afterKey: String(chainCfg.afterKey),
          damageFrame: Math.max(0, Math.floor(Number(chainCfg.damageFrame) || 0)),
          dmgRatio: Number(chainCfg.dmgRatio) > 0 ? Number(chainCfg.dmgRatio) : 1,
        };
      }
      push(row);
    });
    return out;
  }

  function suuPatternDmg(row) {
    const part = wzPart(fight.listId, fight.body.visualId);
    const basePa = Math.max(0, Number(part?.PADamage) || 22000);
    const diffId = String(activeDiff?.id || fight?.difficultyId || 'hard');
    const by = row?.attackHpRatioByDiff;
    let ratio = Number(row?.attackHpRatio);
    if (by && typeof by === 'object') {
      const n = Number(by[diffId] ?? by.hard);
      if (Number.isFinite(n) && n > 0) ratio = n;
    }
    return Math.max(1, Math.floor(
      scaleWzByHpRatio(basePa, Number.isFinite(ratio) && ratio > 0 ? ratio : 1, 1)
      * dmgMult(fight.listId),
    ));
  }

  /** 追蹤雷射砲口：左上／右上（三階再加正上） */
  function suuLaserCorners(count) {
    const field = getBossFieldEl();
    const W = field?.clientWidth || 1366;
    const corners = [
      { x: 36, y: 28 },
      { x: W - 36, y: 28 },
    ];
    if (count >= 3) corners.push({ x: Math.round(W * 0.5), y: 16 });
    return corners.slice(0, Math.max(1, count));
  }

  /**
   * 砲口 → 穿過 through 點 → 地圖邊界的遠端。
   * 雷射圖 origin 在「末端」，stage 放遠端才能讓光束穿過玩家而非停在玩家身上。
   */
  function suuLaserFarPoint(corner, through) {
    const field = getBossFieldEl();
    const W = field?.clientWidth || 1366;
    const H = field?.clientHeight || 768;
    const dx = through.x - corner.x;
    const dy = through.y - corner.y;
    const len = Math.hypot(dx, dy) || 1;
    const ux = dx / len;
    const uy = dy / len;
    const ts = [];
    if (Math.abs(ux) > 1e-6) {
      ts.push((0 - corner.x) / ux);
      ts.push((W - corner.x) / ux);
    }
    if (Math.abs(uy) > 1e-6) {
      ts.push((0 - corner.y) / uy);
      ts.push((H - corner.y) / uy);
    }
    // 取「穿過玩家之後」離開場地的最近正 t
    const past = ts.filter((t) => t > len + 8);
    let tExit = past.length ? Math.min(...past) : (len + Math.max(280, len * 0.8));
    if (!(tExit > len)) tExit = len + Math.max(280, len * 0.8);
    return {
      x: Math.round(corner.x + ux * tExit),
      y: Math.round(corner.y + uy * tExit),
    };
  }

  function suuLaserRotateRad(corner, tip) {
    const dx = corner.x - tip.x;
    const dy = corner.y - tip.y;
    return Math.atan2(dy, dx) - Math.PI;
  }

  /**
   * 雷射圖預設沿 -X（origin 在末端、長條往砲口）。
   * stage 放在「穿過玩家後的遠端」，旋轉使 -X 指向左上／右上砲口 → 斜向貫穿。
   */
  function playSuuLaserBeam(assetKey, action, corner, through, extra = {}) {
    if (!assetKey || !corner || !through) return 0;
    const tip = suuLaserFarPoint(corner, through);
    return playSuuPatternFx(assetKey, action, {
      anchor: 'map',
      mapX: tip.x,
      mapY: tip.y,
      rotateRad: suuLaserRotateRad(corner, tip),
      noOriginBias: true,
      ...extra,
    });
  }

  function updateSuuLaserBeamEl(el, corner, through) {
    if (!el || !corner || !through) return;
    const tip = suuLaserFarPoint(corner, through);
    el.style.left = `${Math.round(tip.x)}px`;
    el.style.top = `${Math.round(tip.y)}px`;
    el.style.transform = `rotate(${suuLaserRotateRad(corner, tip)}rad)`;
    el.style.transformOrigin = '0 0';
  }

  function suuHasPatternAction(assetKey, action) {
    const data = (typeof IDLE_BOSS_SUU_PATTERN_DATA !== 'undefined')
      ? IDLE_BOSS_SUU_PATTERN_DATA
      : null;
    const frames = data?.[assetKey]?.[action];
    return Array.isArray(frames) && frames.length > 0;
  }

  function suuApplyPatternHit(dmg, heat) {
    if (!fight || fight.mode !== 'fight') return;
    const playerEl = getBossPlayerEl();
    if (playerEl && typeof IdleMobAnim !== 'undefined') {
      IdleMobAnim.playPlayerHit?.(playerEl, pad(fight.body.visualId), 'stand', { immediate: true });
    }
    hurtPlayerFromBoss('body', dmg, { heatOnHit: heat });
    hooks?.syncPlayerHp?.();
  }

  /**
   * 나무위키：1·2階追蹤 1s／3階 1.42s → 鎖定後再隔 1s 開火。
   * 左上＋右上斜射（3階＋正上）；光束從砲口穿過玩家至對側；special／hit 仍在玩家。
   */
  async function fireSuuTrackingLaser(row, assetKey) {
    if (!fight || !isSuu() || !row || !assetKey) return;
    const phase = Math.max(1, Math.floor(Number(fight.phase) || 1));
    const by = row.beamCountByPhase;
    let beams = phase >= 3 ? 3 : 2;
    if (by && typeof by === 'object') {
      const n = Number(by[phase] || by[String(phase)]);
      if (n > 0) beams = Math.floor(n);
    }
    const corners = suuLaserCorners(beams);
    const trackBy = row.trackMsByPhase;
    let trackMs = phase >= 3 ? 1420 : 1000;
    if (trackBy && typeof trackBy === 'object') {
      const n = Number(trackBy[phase] || trackBy[String(phase)]);
      if (n > 0) trackMs = n;
    }
    trackMs = scaleDelayMs(trackMs);
    const lockMs = scaleDelayMs(Math.max(200, Number(row.lockMs) || 1000));
    const hitDmg = suuPatternDmg(row);
    const heat = Number(row.heatOnHit) || 10;
    const beamEls = [];

    let impact = suuFieldPointFromPlayer();
    for (let i = 0; i < corners.length; i += 1) {
      // pre 追蹤／鎖定期間循環，不要 holdLast 凍幀
      playSuuLaserBeam(assetKey, 'pre', corners[i], impact, {
        loop: true,
        onCreate: (el) => { beamEls.push(el); },
      });
    }

    const tTrack = Date.now();
    while (Date.now() - tTrack < trackMs) {
      if (!fight || fight.mode !== 'fight') {
        beamEls.forEach((el) => { try { el.remove(); } catch (_) { /* */ } });
        return;
      }
      impact = suuFieldPointFromPlayer();
      for (let i = 0; i < beamEls.length; i += 1) {
        updateSuuLaserBeamEl(beamEls[i], corners[i], impact);
      }
      await sleep(TICK_MS);
    }
    if (!fight || fight.mode !== 'fight') {
      beamEls.forEach((el) => { try { el.remove(); } catch (_) { /* */ } });
      return;
    }

    // 鎖定：預告線停在最後落點
    const locked = { ...impact };
    for (let i = 0; i < beamEls.length; i += 1) {
      updateSuuLaserBeamEl(beamEls[i], corners[i], locked);
    }
    const tLock = Date.now();
    while (Date.now() - tLock < lockMs) {
      if (!fight || fight.mode !== 'fight') {
        beamEls.forEach((el) => { try { el.remove(); } catch (_) { /* */ } });
        return;
      }
      await sleep(TICK_MS);
    }
    beamEls.forEach((el) => { try { el.remove(); } catch (_) { /* */ } });
    if (!fight || fight.mode !== 'fight') return;

    for (let i = 0; i < corners.length; i += 1) {
      playSuuLaserBeam(assetKey, 'end', corners[i], locked);
    }
    playSuuPatternFx(assetKey, 'special', {
      anchor: 'map',
      mapX: locked.x,
      mapY: locked.y,
      noOriginBias: true,
    });
    playSuuPatternFx(assetKey, 'hit', {
      anchor: 'map',
      mapX: locked.x,
      mapY: locked.y,
    });
    suuApplyPatternHit(hitDmg, heat);
  }

  /**
   * 大型機械臂組成（正服截圖確認）：
   * ball2＝頭（落點）；ball3＝身體段，沿臂軸往上重複堆疊；ball＝插下動畫
   * 靜態段 holdLast，撐到 ball 播完再清
   */
  function playSuuLargeArmCompose(assetKey, impact, tilt, row) {
    if (!assetKey || !impact) return 0;
    const segEls = [];
    const trackSeg = (el) => { if (el) segEls.push(el); };
    const b2 = suuPatternFrames(assetKey, 'ball2')?.[0];
    const b3 = suuPatternFrames(assetKey, 'ball3')?.[0];
    const headLen = Math.max(100, Number(b2?.origin?.[1]) || 280);
    const step = Math.max(
      70,
      Number(row?.largeArmBodyStepPx) || Math.round((Number(b3?.origin?.[1]) || 127) * 0.92),
    );
    const field = getBossFieldEl();
    const fieldH = field?.clientHeight || 768;
    // 從落點往螢幕上方能鋪的距離
    const reach = Math.max(220, Math.min(impact.y + 80, fieldH));
    let bodyCount = Math.floor(Number(row?.largeArmBodyCount) || 0);
    if (!(bodyCount > 0)) {
      bodyCount = Math.max(3, Math.min(14, Math.ceil((reach - headLen * 0.4) / step)));
    }
    // 身體段：遠→近（先畫遠的），距離＝頭頂附近起算
    if (suuHasPatternAction(assetKey, 'ball3')) {
      for (let n = bodyCount; n >= 1; n -= 1) {
        const dist = headLen * 0.55 + (n - 1) * step;
        const x = impact.x + dist * Math.sin(tilt);
        const y = impact.y - dist * Math.cos(tilt);
        playSuuPatternFx(assetKey, 'ball3', {
          anchor: 'map',
          mapX: x,
          mapY: y,
          rotateRad: tilt,
          holdLast: true,
          onCreate: trackSeg,
        });
      }
    }
    // 頭在落點
    if (suuHasPatternAction(assetKey, 'ball2')) {
      playSuuPatternFx(assetKey, 'ball2', {
        anchor: 'map',
        mapX: impact.x,
        mapY: impact.y,
        rotateRad: tilt,
        holdLast: true,
        onCreate: trackSeg,
      });
    }
    const ballMs = suuHasPatternAction(assetKey, 'ball')
      ? (playSuuPatternFx(assetKey, 'ball', {
        anchor: 'map',
        mapX: impact.x,
        mapY: impact.y,
        rotateRad: tilt,
      }) || 960)
      : 960;
    window.setTimeout(() => {
      segEls.forEach((el) => { try { el.remove(); } catch (_) { /* */ } });
    }, Math.max(200, ballMs));
    return ballMs;
  }

  /**
   * 소형／대형 기계팔（1001/001 系）
   * pre／pre2＝瞄準；end＝小臂（隨機傾角）；special＝hit
   * 大型（僅 Extreme）：소형 N → 大臂 1（ball+ball2+ball3）→ 소형 M
   */
  function isSuuExtremeDiff() {
    return String(activeDiff?.id || fight?.difficultyId || '') === 'extreme';
  }

  async function fireSuuArmSlam(row, assetKey) {
    if (!fight || !isSuu() || !row || !assetKey) return;
    const extreme = isSuuExtremeDiff() && row.largeArmExtreme !== false;
    const smallBefore = Math.max(0, Math.floor(Number(row.largeArmAfterSmall) || 10));
    const smallAfter = Math.max(0, Math.floor(Number(row.largeArmThenSmall) || 2));
    let hits = resolveSuuPatternHitCount(row);
    if (extreme) {
      const extN = Number(row.hitCountExtreme);
      hits = extN > 0 ? Math.floor(extN) : (smallBefore + 1 + smallAfter);
    }
    const aimMs = scaleDelayMs(Math.max(200, Number(row.aimMs) || 540));
    const largeAimMs = scaleDelayMs(Math.max(aimMs, Number(row.largeAimMs) || 1140));
    const gapMs = scaleDelayMs(Math.max(aimMs, resolveSuuPatternHitGapMs(row) || 800));
    const hitDmg = suuPatternDmg(row);
    const largeRatio = Number(row.largeAttackHpRatio);
    const largeDmg = (Number.isFinite(largeRatio) && largeRatio > 0)
      ? Math.max(1, Math.floor(suuPatternDmg({ ...row, attackHpRatio: largeRatio })))
      : hitDmg;
    const heat = Number(row.heatOnHit) || 8;
    const largeHeat = Number(row.largeHeatOnHit) || heat;
    const hasPre2 = suuHasPatternAction(assetKey, 'pre2');
    const maxTilt = Number.isFinite(Number(row.armMaxTiltRad))
      ? Number(row.armMaxTiltRad)
      : 0.7; // ≈40°

    for (let i = 0; i < hits; i += 1) {
      if (!fight || fight.mode !== 'fight') return;
      const useLarge = extreme
        && i === smallBefore
        && suuHasPatternAction(assetKey, 'ball');
      const thisAim = useLarge ? largeAimMs : aimMs;

      playSuuPatternFx(assetKey, 'pre', { anchor: 'feet' });
      if (hasPre2) {
        await sleep(Math.max(80, Math.floor(thisAim * 0.35)));
        if (!fight || fight.mode !== 'fight') return;
        playSuuPatternFx(assetKey, 'pre2', { anchor: 'feet' });
        await sleep(Math.max(80, thisAim - Math.floor(thisAim * 0.35)));
      } else {
        await sleep(thisAim);
      }
      if (!fight || fight.mode !== 'fight') return;

      const impact = suuFieldPointFromPlayer();
      const tilt = (Math.random() * 2 - 1) * maxTilt;

      if (useLarge) {
        playSuuLargeArmCompose(assetKey, impact, tilt, row);
      } else if (suuHasPatternAction(assetKey, 'end')) {
        playSuuPatternFx(assetKey, 'end', {
          anchor: 'map',
          mapX: impact.x,
          mapY: impact.y,
          rotateRad: tilt,
        });
      }

      // special 當 hit；沒有 special 才用 hit
      if (suuHasPatternAction(assetKey, 'special')) {
        playSuuPatternFx(assetKey, 'special', {
          anchor: 'map',
          mapX: impact.x,
          mapY: impact.y,
        });
      } else {
        playSuuPatternFx(assetKey, 'hit', {
          anchor: 'map',
          mapX: impact.x,
          mapY: impact.y,
        });
      }
      suuApplyPatternHit(useLarge ? largeDmg : hitDmg, useLarge ? largeHeat : heat);
      if (i < hits - 1) await sleep(Math.max(80, gapMs - Math.min(gapMs, thisAim)));
    }
  }

  /** 以中心 X 左右錯開多點；dmgIdx＝中間那顆（玩家身上） */
  function suuResolveVisualSpread(row, centerX, maxX) {
    const n = Math.max(
      1,
      Math.floor(Number(row.visualCount) || Number(row.hitCount) || 1),
    );
    const spread = Math.max(40, Number(row.spreadPx) || 170);
    const xs = [];
    for (let i = 0; i < n; i += 1) {
      const offset = (i - (n - 1) / 2) * spread;
      xs.push(Math.max(40, Math.min(maxX - 40, Math.round(centerX + offset))));
    }
    return { xs, dmgIdx: Math.floor((n - 1) / 2), count: n };
  }

  /**
   * 폭발물 낙하（1007/000）使用者確認：
   * regen 空中出現 → stand 從空中落到地上 → pre 地上引爆預備（repeatIdx 6）→ end 爆炸
   * 左右多顆僅視覺；傷害只算玩家身上那顆
   */
  async function fireSuuDropExplode(row, assetKey) {
    if (!fight || !isSuu() || !row || !assetKey) return;
    const fuseMs = scaleDelayMs(Math.max(800, Number(row.fuseMs) || 3000));
    const fallMs = scaleDelayMs(Math.max(200, Number(row.fallMs) || 420));
    const airPx = Math.max(80, Number(row.fallAirPx) || 280);
    const repeatIdx = Number.isFinite(Number(row.preRepeatIdx))
      ? Math.floor(Number(row.preRepeatIdx))
      : 6;
    const hitDmg = suuPatternDmg(row);
    const heat = Number(row.heatOnHit) || 8;
    const field = getBossFieldEl();
    const maxX = field?.clientWidth || 1366;
    const maxY = field?.clientHeight || 768;
    const floor = suuFieldPointFromPlayer();
    const airY = Math.max(40, floor.y - airPx);
    const { xs } = suuResolveVisualSpread(row, floor.x, maxX);
    const liveEls = [];
    const standByX = [];

    const clearLive = () => {
      liveEls.forEach((el) => { try { el.remove(); } catch (_) { /* */ } });
      liveEls.length = 0;
    };

    // 1) regen：左右多顆空中出現（僅視覺）
    let regenMs = 0;
    for (let i = 0; i < xs.length; i += 1) {
      const ms = playSuuPatternFx(assetKey, 'regen', {
        anchor: 'map',
        mapX: xs[i],
        mapY: airY,
      }) || 0;
      if (ms > regenMs) regenMs = ms;
    }
    await sleep(regenMs || scaleDelayMs(360));
    if (!fight || fight.mode !== 'fight') return;

    // 2) stand：同視覺從空中落到地上
    for (let i = 0; i < xs.length; i += 1) {
      const xi = xs[i];
      playSuuPatternFx(assetKey, 'stand', {
        anchor: 'map',
        mapX: xi,
        mapY: airY,
        loop: true,
        onCreate: (el) => {
          liveEls.push(el);
          standByX.push({ el, x: xi });
        },
      });
    }
    const tFall = Date.now();
    while (Date.now() - tFall < fallMs) {
      if (!fight || fight.mode !== 'fight') {
        clearLive();
        return;
      }
      const t = Math.min(1, (Date.now() - tFall) / fallMs);
      const y = Math.round(airY + (floor.y - airY) * t);
      for (let i = 0; i < standByX.length; i += 1) {
        const rowEl = standByX[i];
        if (!rowEl.el?.isConnected) continue;
        rowEl.el.style.top = `${Math.min(maxY - 8, y)}px`;
        rowEl.el.style.left = `${rowEl.x}px`;
      }
      await sleep(TICK_MS);
    }
    clearLive();
    standByX.length = 0;
    if (!fight || fight.mode !== 'fight') return;

    // 3) pre：地上引爆預備；WZ repeatIdx=6
    for (let i = 0; i < xs.length; i += 1) {
      playSuuPatternFx(assetKey, 'pre', {
        anchor: 'map',
        mapX: xs[i],
        mapY: floor.y,
        repeatIdx,
        onCreate: (el) => { liveEls.push(el); },
      });
    }
    const tFuse = Date.now();
    while (Date.now() - tFuse < fuseMs) {
      if (!fight || fight.mode !== 'fight') {
        clearLive();
        return;
      }
      await sleep(TICK_MS);
    }
    clearLive();
    if (!fight || fight.mode !== 'fight') return;

    // 4) end 全數爆炸；hit／傷害只算玩家那顆
    for (let i = 0; i < xs.length; i += 1) {
      playSuuPatternFx(assetKey, 'end', {
        anchor: 'map',
        mapX: xs[i],
        mapY: floor.y,
        clampOriginToSprite: true,
      });
    }
    playSuuPatternFx(assetKey, 'hit', { anchor: 'feet' });
    suuApplyPatternHit(hitDmg, heat);
  }

  /**
   * 칼날 톱니：pre 核心預警 → 1.32s 後鋸刃從地板升起。
   * 左右多顆僅視覺；傷害只算玩家身上那顆（升起後才出傷）
   */
  async function fireSuuSawRise(row, assetKey) {
    if (!fight || !isSuu() || !row || !assetKey) return;
    const warnMs = scaleDelayMs(Math.max(400, Number(row.warningMs) || 1320));
    const riseMs = scaleDelayMs(Math.max(120, Number(row.riseMs) || 480));
    const hitDmg = suuPatternDmg(row);
    const heat = Number(row.heatOnHit) || 5;
    const preEls = [];

    // 不 holdLast：播完自動移除，避免透明殘留；錨在核心
    playSuuPatternFx(assetKey, 'pre', {
      anchor: 'mapCore',
      onCreate: (el) => { preEls.push(el); },
    });
    const tWarn = Date.now();
    while (Date.now() - tWarn < warnMs) {
      if (!fight || fight.mode !== 'fight') {
        preEls.forEach((el) => { try { el.remove(); } catch (_) { /* */ } });
        return;
      }
      await sleep(TICK_MS);
    }
    preEls.forEach((el) => { try { el.remove(); } catch (_) { /* */ } });
    if (!fight || fight.mode !== 'fight') return;

    const base = suuFieldPointFromPlayer();
    const field = getBossFieldEl();
    const maxX = field?.clientWidth || 1366;
    const maxY = field?.clientHeight || 768;
    const { xs } = suuResolveVisualSpread(row, base.x, maxX);
    // effect 整體偏高：相對腳底再下移（pre 仍用 mapCore）
    const y = Math.max(40, Math.min(maxY - 8, Math.round(base.y + 15)));

    for (let i = 0; i < xs.length; i += 1) {
      if (!fight || fight.mode !== 'fight') return;
      playSuuPatternFx(assetKey, 'effect', {
        anchor: 'map',
        mapX: xs[i],
        mapY: y,
      });
    }

    const hitAt = Date.now() + riseMs;
    while (Date.now() < hitAt) {
      if (!fight || fight.mode !== 'fight') return;
      await sleep(TICK_MS);
    }
    if (!fight || fight.mode !== 'fight') return;
    // 傷害只算玩家那顆（中間視覺對齊玩家）
    playSuuPatternFx(assetKey, 'hit', { anchor: 'feet' });
    suuApplyPatternHit(hitDmg, heat);
  }

  /**
   * 전류 방출（1007/001）依幀讀圖：
   * pre／special3 錨點同鋸刃＝mapCore（suuKit.corePos）；勿用 mapCenter（會偏高）
   * effect＝錨同一地板高度一次播完（早期超大 oy 把槍抬高；28+ 雷柱）
   * special3＝發射瞬間橫向電弧（ox=0），單層鋪地板（不用 special／special2 避免重疊）
   * hit＝單發命中
   */
  async function fireSuuFloorCurrent(row, assetKey) {
    if (!fight || !isSuu() || !row || !assetKey) return;
    const hitDmg = suuPatternDmg(row);
    const heat = Number(row.heatOnHit) || 12;
    // 與鋸刃 pre 同一地板高度（corePos）；可選 floorYBias 再微調
    const core = suuFieldPointMapCore();
    const yBias = Math.floor(Number(row.floorYBias) || 0);
    const floorY = Math.round(core.y + yBias);
    const field = getBossFieldEl();
    const W = field?.clientWidth || 1366;
    // 나무 1.74s；effect 0~27 ≈ 28×60ms
    const warnMs = scaleDelayMs(Math.max(400, Number(row.warningMs) || 1740));
    // WZ pre 無 repeatIdx；預設從 0 循環（整段脈衝），避免 holdLast 凍在最後一幀
    const preRepeat = Number.isFinite(Number(row.preRepeatIdx))
      ? Number(row.preRepeatIdx)
      : 0;
    const preEls = [];

    // 1) 地板預警（寬條）— 循環播；Y＝corePos（同鋸刃）
    playSuuPatternFx(assetKey, 'pre', {
      anchor: 'map',
      mapX: core.x,
      mapY: floorY,
      repeatIdx: preRepeat,
      onCreate: (el) => { preEls.push(el); },
    });

    // 2) effect 一次播完：同地板高度、保留 WZ 超大 oy
    playSuuPatternFx(assetKey, 'effect', {
      anchor: 'map',
      mapX: core.x,
      mapY: floorY,
    });

    const t0 = Date.now();
    while (Date.now() - t0 < warnMs) {
      if (!fight || fight.mode !== 'fight') {
        preEls.forEach((el) => { try { el.remove(); } catch (_) { /* */ } });
        return;
      }
      await sleep(TICK_MS);
    }
    if (!fight || fight.mode !== 'fight') {
      preEls.forEach((el) => { try { el.remove(); } catch (_) { /* */ } });
      return;
    }
    preEls.forEach((el) => { try { el.remove(); } catch (_) { /* */ } });

    // 3) 只用 special3 橫向鋪地板（ox=0 往右；Y＝mapCore）
    const prefer = Array.isArray(row.specialActions) && row.specialActions.length
      ? row.specialActions.map(String)
      : ['special3'];
    const ballActions = prefer.filter((a) => suuHasPatternAction(assetKey, a));
    const step = Math.max(
      40,
      Math.floor(Number(row.specialStepPx) || 80),
    );
    const lineCount = Math.max(
      3,
      Math.floor(Number(row.specialLineCount) || 0) || (Math.ceil(W / step) + 1),
    );
    const action = ballActions[0] || null;
    if (action) {
      for (let i = 0; i < lineCount; i += 1) {
        const x = Math.round(i * step);
        if (x > W + step) break;
        playSuuPatternFx(assetKey, action, {
          anchor: 'map',
          mapX: x,
          mapY: floorY,
        });
      }
    }

    playSuuPatternFx(assetKey, 'hit', { anchor: 'feet' });
    suuApplyPatternHit(hitDmg, heat);
  }

  /** 상단 포격：每次重新鎖玩家 → pre → 開火 */
  async function fireSuuPinpointVolley(row, assetKey) {
    if (!fight || !isSuu() || !row || !assetKey) return;
    const hits = resolveSuuPatternHitCount(row);
    const warnMs = scaleDelayMs(Math.max(300, Number(row.warningMs) || 1000));
    const gapMs = scaleDelayMs(Math.max(400, resolveSuuPatternHitGapMs(row) || 1700));
    const hitDmg = suuPatternDmg(row);
    const heat = Number(row.heatOnHit) || 12;

    for (let i = 0; i < hits; i += 1) {
      if (!fight || fight.mode !== 'fight') return;
      const pos = suuFieldPointFromPlayer();
      playSuuPatternFx(assetKey, 'pre', {
        anchor: 'map',
        mapX: pos.x,
        mapY: pos.y,
        noOriginBias: true,
      });
      const t0 = Date.now();
      while (Date.now() - t0 < warnMs) {
        if (!fight || fight.mode !== 'fight') return;
        await sleep(TICK_MS);
      }
      if (!fight || fight.mode !== 'fight') return;
      const impact = suuFieldPointFromPlayer();
      playSuuPatternFx(assetKey, 'end', {
        anchor: 'map',
        mapX: impact.x,
        mapY: impact.y,
        noOriginBias: true,
      });
      playSuuPatternFx(assetKey, 'hit', {
        anchor: 'map',
        mapX: impact.x,
        mapY: impact.y,
      });
      suuApplyPatternHit(hitDmg, heat);
      if (i < hits - 1) await sleep(gapMs);
    }
  }

  /**
   * 가로 포격（1008/000・1009/000；僅 P2／P3）
   * 0＝發射器 attack(repeatIdx13)→loop→end
   * 1＝光波 pre→loop＋special(repeatIdx4)→special2→end＋hit
   * 高度＝mapCore（同鋸刃／電流）；發射器靠地圖右緣（玩家在左則鏡射靠左緣）
   */
  async function fireSuuHorizontalBarrage(row, baseKey) {
    if (!fight || !isSuu() || !row || !baseKey) return;
    const gunKey = `${baseKey}/0`;
    const waveKey = `${baseKey}/1`;
    const warnMs = scaleDelayMs(Math.max(400, Number(row.warningMs) || 1500));
    const fireMs = scaleDelayMs(Math.max(800, Number(row.fireMs) || 3000));
    const tickMs = scaleDelayMs(Math.max(200, Number(row.tickMs) || 500));
    const hitDmg = suuPatternDmg(row);
    const heat = Number(row.heatOnHit) || 16;
    const field = getBossFieldEl();
    const W = field?.clientWidth || 1366;
    const player = suuFieldPointFromPlayer();
    // 玩家在左 → 發射器靠左往右射；在右 → 靠右並 flip 往左射（預設資產朝右）
    const gunOnLeft = player.x < W * 0.5;
    const flipX = !gunOnLeft;
    const attackRepeat = Number.isFinite(Number(row.gunAttackRepeatIdx))
      ? Number(row.gunAttackRepeatIdx)
      : 13;
    const specialRepeat = Number.isFinite(Number(row.waveSpecialRepeatIdx))
      ? Number(row.waveSpecialRepeatIdx)
      : 4;

    // Y＝corePos（勿用 mapCenter）；X＝靠右／左地圖邊界
    const core = suuFieldPointMapCore();
    const edgePad = Math.max(8, Math.floor(Number(row.edgePadPx) || 36));
    const yBias = Number(row.mapYBias);
    const mapY = Math.round(core.y + (Number.isFinite(yBias) ? yBias : 0));
    const mapX = gunOnLeft ? edgePad : (W - edgePad);

    const warnLive = [];
    const fireLive = [];
    const trackWarn = (el) => { if (el) warnLive.push(el); };
    const trackFire = (el) => { if (el) fireLive.push(el); };
    const clear = (arr) => {
      arr.forEach((el) => { try { el.remove(); } catch (_) { /* */ } });
      arr.length = 0;
    };

    const fxBase = {
      anchor: 'map',
      mapX,
      mapY,
      flipX,
    };

    // 預警：attack 用 WZ repeatIdx 撐住，避免播完消失再切 loop 閃爍
    if (suuHasPatternAction(gunKey, 'attack')) {
      playSuuPatternFx(gunKey, 'attack', {
        ...fxBase,
        repeatIdx: attackRepeat,
        onCreate: trackWarn,
      });
    }
    if (suuHasPatternAction(waveKey, 'pre')) {
      playSuuPatternFx(waveKey, 'pre', {
        ...fxBase,
        loop: true,
        onCreate: trackWarn,
      });
    }
    await sleep(warnMs);
    if (!fight || fight.mode !== 'fight') {
      clear(warnLive);
      return;
    }

    // 先掛上發射 loop，再撤預警層，減少空窗閃爍
    if (suuHasPatternAction(gunKey, 'loop')) {
      playSuuPatternFx(gunKey, 'loop', {
        ...fxBase,
        loop: true,
        onCreate: trackFire,
      });
    }
    if (suuHasPatternAction(waveKey, 'loop')) {
      playSuuPatternFx(waveKey, 'loop', {
        ...fxBase,
        loop: true,
        onCreate: trackFire,
      });
    }
    if (suuHasPatternAction(waveKey, 'special')) {
      playSuuPatternFx(waveKey, 'special', {
        ...fxBase,
        repeatIdx: specialRepeat,
        onCreate: trackFire,
      });
    }
    clear(warnLive);

    const t0 = Date.now();
    let nextTick = t0;
    while (Date.now() - t0 < fireMs) {
      if (!fight || fight.mode !== 'fight') {
        clear(fireLive);
        return;
      }
      if (Date.now() >= nextTick) {
        playSuuPatternFx(waveKey, 'hit', { anchor: 'feet', flipX });
        suuApplyPatternHit(hitDmg, heat);
        nextTick += tickMs;
      }
      await sleep(TICK_MS);
    }
    clear(fireLive);
    if (!fight || fight.mode !== 'fight') return;

    if (suuHasPatternAction(waveKey, 'special2')) {
      playSuuPatternFx(waveKey, 'special2', { ...fxBase });
    }
    if (suuHasPatternAction(waveKey, 'end')) {
      playSuuPatternFx(waveKey, 'end', { ...fxBase });
    }
    if (suuHasPatternAction(gunKey, 'end')) {
      playSuuPatternFx(gunKey, 'end', { ...fxBase });
    }
  }

  /**
   * 전기장 드론（1006/002 系）
   * 0＝追蹤 pre→loop；1＝電場 pre→loop→end；hit＝tick
   */
  async function fireSuuFieldDrone(row, baseKey) {
    if (!fight || !isSuu() || !row || !baseKey) return;
    const chaseKey = `${baseKey}/0`;
    const fieldKey = `${baseKey}/1`;
    const chaseMs = scaleDelayMs(Math.max(600, Number(row.chaseMs) || Number(row.warningMs) || 3000));
    const phase = Math.max(1, Math.floor(Number(fight.phase) || 1));
    const fieldDefault = phase <= 1 ? 4000 : 3000;
    const fieldMs = scaleDelayMs(Math.max(600, Number(row.fieldMs) || fieldDefault));
    const tickMs = scaleDelayMs(Math.max(200, Number(row.hitGapMs) || 360));
    const hitDmg = suuPatternDmg(row);
    const heat = Number(row.heatOnHit) || 4;
    const live = [];
    const track = (el) => { if (el) live.push(el); };
    const clearLive = () => {
      live.forEach((el) => { try { el.remove(); } catch (_) { /* */ } });
      live.length = 0;
    };
    const pinToPlayer = () => {
      const p = suuFieldPointFromPlayer();
      for (let i = 0; i < live.length; i += 1) {
        const el = live[i];
        if (!el?.isConnected) continue;
        el.style.left = `${p.x}px`;
        el.style.top = `${p.y}px`;
      }
    };

    if (suuHasPatternAction(chaseKey, 'pre')) {
      playSuuPatternFx(chaseKey, 'pre', { anchor: 'feet', onCreate: track });
    }
    await sleep(Math.min(chaseMs, scaleDelayMs(400)));
    if (!fight || fight.mode !== 'fight') {
      clearLive();
      return;
    }
    clearLive();
    if (suuHasPatternAction(chaseKey, 'loop')) {
      playSuuPatternFx(chaseKey, 'loop', { anchor: 'feet', loop: true, onCreate: track });
    }
    const tChase = Date.now();
    while (Date.now() - tChase < chaseMs) {
      if (!fight || fight.mode !== 'fight') {
        clearLive();
        return;
      }
      pinToPlayer();
      await sleep(TICK_MS);
    }
    clearLive();
    if (!fight || fight.mode !== 'fight') return;

    const lock = suuFieldPointFromPlayer();
    if (suuHasPatternAction(fieldKey, 'pre')) {
      playSuuPatternFx(fieldKey, 'pre', {
        anchor: 'map',
        mapX: lock.x,
        mapY: lock.y,
        onCreate: track,
      });
    }
    await sleep(scaleDelayMs(360));
    if (!fight || fight.mode !== 'fight') {
      clearLive();
      return;
    }
    clearLive();
    if (suuHasPatternAction(fieldKey, 'loop')) {
      playSuuPatternFx(fieldKey, 'loop', {
        anchor: 'map',
        mapX: lock.x,
        mapY: lock.y,
        loop: true,
        onCreate: track,
      });
    }

    const tField = Date.now();
    let nextTick = tField;
    while (Date.now() - tField < fieldMs) {
      if (!fight || fight.mode !== 'fight') {
        clearLive();
        return;
      }
      if (Date.now() >= nextTick) {
        playSuuPatternFx(baseKey, 'hit', {
          anchor: 'map',
          mapX: lock.x,
          mapY: lock.y,
        });
        suuApplyPatternHit(hitDmg, heat);
        nextTick += tickMs;
      }
      await sleep(TICK_MS);
    }
    clearLive();
    if (!fight || fight.mode !== 'fight') return;
    if (suuHasPatternAction(fieldKey, 'end')) {
      playSuuPatternFx(fieldKey, 'end', {
        anchor: 'map',
        mapX: lock.x,
        mapY: lock.y,
      });
    }
  }

  /**
   * 포격 프로토콜（1002/005）：無人機停在王頭頂，持續對玩家射投射物
   * regen 召喚 → stand 待機 → attack 發射＋ball 飛向玩家 → hit 命中
   * 結束播 die（不用 die2／special／special2）
   */
  async function fireSuuHeadDrone(row, assetKey) {
    if (!fight || !isSuu() || !row || !assetKey) return;
    const headBias = Number(row.headYBias);
    const headOff = Number.isFinite(headBias) ? headBias : -300;
    const hits = Math.max(1, resolveSuuPatternHitCount(row));
    const gapMs = scaleDelayMs(Math.max(400, resolveSuuPatternHitGapMs(row) || 2000));
    const travelMs = scaleDelayMs(Math.max(200, Number(row.ballTravelMs) || 480));
    const hitDmg = suuPatternDmg(row);
    const heat = Number(row.heatOnHit) || 6;
    const field = getBossFieldEl();
    const maxY = field?.clientHeight || 768;
    const maxX = field?.clientWidth || 1366;

    const headPos = () => {
      const b = suuFieldPointFromBoss();
      return {
        x: Math.max(0, Math.min(maxX, Math.round(b.x))),
        y: Math.max(40, Math.min(maxY - 8, Math.round(b.y + headOff))),
      };
    };
    const pinEl = (el, pos) => {
      if (!el?.isConnected || !pos) return;
      el.style.left = `${pos.x}px`;
      el.style.top = `${pos.y}px`;
    };
    /** FX 錨點＝WZ origin；回傳精靈畫面中心場座標 */
    const spriteCenter = (el) => {
      if (!el?.isConnected) return null;
      const left = parseFloat(el.style.left);
      const top = parseFloat(el.style.top);
      if (!Number.isFinite(left) || !Number.isFinite(top)) return null;
      const img = el.querySelector('img');
      const w = img?.naturalWidth || img?.width || el.offsetWidth || 0;
      const h = img?.naturalHeight || img?.height || el.offsetHeight || 0;
      const ox = parseFloat(img?.style?.getPropertyValue?.('--ox')) || 0;
      const oy = parseFloat(img?.style?.getPropertyValue?.('--oy')) || 0;
      if (!(w > 0 && h > 0)) return { x: Math.round(left), y: Math.round(top) };
      return {
        x: Math.round(left + w * 0.5 - ox),
        y: Math.round(top + h * 0.5 - oy),
      };
    };
    const delayBeforeFrame = (action, frameIdx) => {
      const frames = suuPatternFrames(assetKey, action);
      if (!frames?.length) return 0;
      const n = Math.max(0, Math.min(frames.length, Math.floor(Number(frameIdx) || 0)));
      let t = 0;
      for (let i = 0; i < n; i += 1) {
        t += Math.max(30, Number(frames[i]?.delay) || 60);
      }
      return t;
    };

    let head = headPos();
    const live = [];
    const track = (el) => { if (el) live.push(el); };
    const clearLive = () => {
      live.forEach((el) => { try { el.remove(); } catch (_) { /* */ } });
      live.length = 0;
    };

    // 1) regen：召喚
    if (suuHasPatternAction(assetKey, 'regen')) {
      const regenMs = playSuuPatternFx(assetKey, 'regen', {
        anchor: 'map',
        mapX: head.x,
        mapY: head.y,
        onCreate: track,
      }) || scaleDelayMs(960);
      const tRegen = Date.now();
      while (Date.now() - tRegen < regenMs) {
        if (!fight || fight.mode !== 'fight') {
          clearLive();
          return;
        }
        head = headPos();
        for (let i = 0; i < live.length; i += 1) pinEl(live[i], head);
        await sleep(TICK_MS);
      }
      clearLive();
    }
    if (!fight || fight.mode !== 'fight') return;

    // 2) stand：頭頂待機（循環）
    head = headPos();
    let standEl = null;
    if (suuHasPatternAction(assetKey, 'stand')) {
      playSuuPatternFx(assetKey, 'stand', {
        anchor: 'map',
        mapX: head.x,
        mapY: head.y,
        loop: true,
        onCreate: (el) => {
          standEl = el;
          track(el);
        },
      });
    }

    // 3) 持續射擊（ball 在 attack 第 N 幀從無人機中心射出）
    const launchFrame = Number.isFinite(Number(row.ballLaunchFrame))
      ? Math.floor(Number(row.ballLaunchFrame))
      : 9;
    const launchWaitMs = scaleDelayMs(delayBeforeFrame('attack', launchFrame));

    for (let i = 0; i < hits; i += 1) {
      if (!fight || fight.mode !== 'fight') {
        clearLive();
        return;
      }
      head = headPos();
      pinEl(standEl, head);

      let attackEl = null;
      if (suuHasPatternAction(assetKey, 'attack')) {
        playSuuPatternFx(assetKey, 'attack', {
          anchor: 'map',
          mapX: head.x,
          mapY: head.y,
          onCreate: (el) => { attackEl = el; },
        });
      }

      // 等到 attack 第 launchFrame 幀再發射
      const tLaunch = Date.now();
      while (Date.now() - tLaunch < launchWaitMs) {
        if (!fight || fight.mode !== 'fight') {
          clearLive();
          return;
        }
        head = headPos();
        pinEl(standEl, head);
        pinEl(attackEl, head);
        await sleep(TICK_MS);
      }
      if (!fight || fight.mode !== 'fight') {
        clearLive();
        return;
      }

      head = headPos();
      pinEl(standEl, head);
      pinEl(attackEl, head);
      const fromCenter = spriteCenter(attackEl) || spriteCenter(standEl) || head;
      const start = {
        x: Math.max(0, Math.min(maxX, fromCenter.x)),
        y: Math.max(0, Math.min(maxY - 8, fromCenter.y)),
      };
      const target = suuFieldPointFromPlayer();
      let ballEl = null;
      if (suuHasPatternAction(assetKey, 'ball')) {
        playSuuPatternFx(assetKey, 'ball', {
          anchor: 'map',
          mapX: start.x,
          mapY: start.y,
          holdLast: true,
          onCreate: (el) => { ballEl = el; },
        });
      }
      const tFly = Date.now();
      while (Date.now() - tFly < travelMs) {
        if (!fight || fight.mode !== 'fight') {
          try { ballEl?.remove(); } catch (_) { /* */ }
          clearLive();
          return;
        }
        const t = Math.min(1, (Date.now() - tFly) / travelMs);
        const bx = Math.round(start.x + (target.x - start.x) * t);
        const by = Math.round(start.y + (target.y - start.y) * t);
        if (ballEl?.isConnected) {
          ballEl.style.left = `${bx}px`;
          ballEl.style.top = `${Math.min(maxY - 8, Math.max(0, by))}px`;
        }
        head = headPos();
        pinEl(standEl, head);
        await sleep(33);
      }
      try { ballEl?.remove(); } catch (_) { /* */ }

      if (suuHasPatternAction(assetKey, 'hit')) {
        playSuuPatternFx(assetKey, 'hit', { anchor: 'feet' });
      }
      suuApplyPatternHit(hitDmg, heat);

      if (i >= hits - 1) break;
      const tWait = Date.now();
      const waitMs = Math.max(80, gapMs - travelMs - launchWaitMs);
      while (Date.now() - tWait < waitMs) {
        if (!fight || fight.mode !== 'fight') {
          clearLive();
          return;
        }
        head = headPos();
        pinEl(standEl, head);
        await sleep(TICK_MS);
      }
    }

    // 4) die：持續結束
    clearLive();
    if (!fight || fight.mode !== 'fight') return;
    head = headPos();
    if (suuHasPatternAction(assetKey, 'die')) {
      playSuuPatternFx(assetKey, 'die', {
        anchor: 'map',
        mapX: head.x,
        mapY: head.y,
      });
    }
  }

  /**
   * 슬로우 방벽／爆炸罐（1002/006）：出現在玩家身上後爆炸
   * loop／warning 巢狀 0／1＝疊加（0 在前、1 在後）
   * warning＝爆炸前 pre → end＝爆炸 → hit＝命中
   */
  async function fireSuuJarBomb(row, assetKey) {
    if (!fight || !isSuu() || !row || !assetKey) return;
    const hitDmg = suuPatternDmg(row);
    const heat = Number(row.heatOnHit) || 7;
    const pos = suuFieldPointFromPlayer();
    const live = [];
    const track = (el) => { if (el) live.push(el); };
    const clearLive = () => {
      live.forEach((el) => { try { el.remove(); } catch (_) { /* */ } });
      live.length = 0;
    };
    const framesDelay = (frames, a, b) => {
      let t = 0;
      const end = Math.min(frames.length, b);
      for (let i = Math.max(0, a); i < end; i += 1) {
        t += Math.max(30, Number(frames[i]?.delay) || 60);
      }
      return t;
    };
    /** 巢狀 0／1 壓成連續幀時：前半＝0、後半＝1；1 在後、0 在前 */
    const playStacked01 = (action, zBase) => {
      const frames = suuPatternFrames(assetKey, action) || [];
      if (!frames.length) return 0;
      const half = Math.floor(frames.length / 2);
      const z0 = Math.max(1, Math.floor(Number(zBase) || 1));
      if (half > 0) {
        playSuuPatternFx(assetKey, action, {
          anchor: 'map',
          mapX: pos.x,
          mapY: pos.y,
          frameStart: half,
          frameEnd: frames.length,
          holdLast: true,
          zIndex: z0,
          onCreate: track,
        });
        playSuuPatternFx(assetKey, action, {
          anchor: 'map',
          mapX: pos.x,
          mapY: pos.y,
          frameStart: 0,
          frameEnd: half,
          holdLast: true,
          zIndex: z0 + 1,
          onCreate: track,
        });
        return Math.max(
          framesDelay(frames, 0, half),
          framesDelay(frames, half, frames.length),
        );
      }
      return playSuuPatternFx(assetKey, action, {
        anchor: 'map',
        mapX: pos.x,
        mapY: pos.y,
        holdLast: true,
        zIndex: z0 + 1,
        onCreate: track,
      }) || 0;
    };

    // 1) loop 0／1 疊加出現
    const appearMs = playStacked01('loop', 1);
    if (appearMs > 0) {
      const t0 = Date.now();
      while (Date.now() - t0 < appearMs) {
        if (!fight || fight.mode !== 'fight') {
          clearLive();
          return;
        }
        await sleep(TICK_MS);
      }
    }
    if (!fight || fight.mode !== 'fight') {
      clearLive();
      return;
    }

    // 2) warning 0／1 疊加＝爆炸前 pre；播完立刻爆炸
    const warnMs = playStacked01('warning', 3);
    if (warnMs > 0) {
      const t1 = Date.now();
      while (Date.now() - t1 < warnMs) {
        if (!fight || fight.mode !== 'fight') {
          clearLive();
          return;
        }
        await sleep(TICK_MS);
      }
    }
    clearLive();
    if (!fight || fight.mode !== 'fight') return;

    // 3) end 爆炸＋hit 命中
    if (suuHasPatternAction(assetKey, 'end')) {
      playSuuPatternFx(assetKey, 'end', {
        anchor: 'map',
        mapX: pos.x,
        mapY: pos.y,
      });
    }
    if (suuHasPatternAction(assetKey, 'hit')) {
      playSuuPatternFx(assetKey, 'hit', { anchor: 'feet' });
    }
    suuApplyPatternHit(hitDmg, heat);
  }

  /**
   * 발판 파괴（1004/005）：破地板 → lockOn → 三塊投射物斜插玩家
   * destroyed＝破地板（統一；不用 destroyed2）
   * lockOn＝鎖玩家 → ball／ball2／ball3 不同角度（同小臂）＋special 同播 → hit
   */
  async function fireSuuPlatformBreak(row, assetKey) {
    if (!fight || !isSuu() || !row || !assetKey) return;
    const hitDmg = suuPatternDmg(row);
    const heat = Number(row.heatOnHit) || 7;
    const hits = Math.max(1, Math.min(3, resolveSuuPatternHitCount(row)));
    const gapMs = scaleDelayMs(Math.max(80, resolveSuuPatternHitGapMs(row) || 280));
    const maxTilt = Number.isFinite(Number(row.armMaxTiltRad))
      ? Number(row.armMaxTiltRad)
      : 0.55;
    const ballActions = ['ball', 'ball2', 'ball3'];

    // 1) 破地板（地圖核心／平台帶）
    if (suuHasPatternAction(assetKey, 'destroyed')) {
      const destroyMs = playSuuPatternFx(assetKey, 'destroyed', {
        anchor: 'mapCore',
      }) || scaleDelayMs(1980);
      const t0 = Date.now();
      while (Date.now() - t0 < destroyMs) {
        if (!fight || fight.mode !== 'fight') return;
        await sleep(TICK_MS);
      }
    }
    if (!fight || fight.mode !== 'fight') return;

    // 2) lockOn 玩家位置
    let lockEls = [];
    const clearLock = () => {
      lockEls.forEach((el) => { try { el.remove(); } catch (_) { /* */ } });
      lockEls = [];
    };
    if (suuHasPatternAction(assetKey, 'lockOn')) {
      const lockEst = playSuuPatternFx(assetKey, 'lockOn', {
        anchor: 'feet',
        loop: true,
        onCreate: (el) => { if (el) lockEls.push(el); },
      }) || 0;
      const lockMs = scaleDelayMs(Math.max(
        400,
        Number(row.lockMs) || lockEst || 1080,
      ));
      const t1 = Date.now();
      while (Date.now() - t1 < lockMs) {
        if (!fight || fight.mode !== 'fight') {
          clearLock();
          return;
        }
        await sleep(TICK_MS);
      }
    }
    clearLock();
    if (!fight || fight.mode !== 'fight') return;

    // 3) 三塊：不同傾角插向玩家；special 與 ball 同播；hit＝命中
    for (let i = 0; i < hits; i += 1) {
      if (!fight || fight.mode !== 'fight') return;
      const impact = suuFieldPointFromPlayer();
      const tilt = hits === 1
        ? ((Math.random() * 2 - 1) * maxTilt)
        : (-maxTilt + (maxTilt * 2) * (i / Math.max(1, hits - 1)));
      let ballAction = ballActions[i] || 'ball';
      if (!suuHasPatternAction(assetKey, ballAction)) ballAction = 'ball';
      if (suuHasPatternAction(assetKey, ballAction)) {
        playSuuPatternFx(assetKey, ballAction, {
          anchor: 'map',
          mapX: impact.x,
          mapY: impact.y,
          rotateRad: tilt,
        });
      }
      if (suuHasPatternAction(assetKey, 'special')) {
        playSuuPatternFx(assetKey, 'special', {
          anchor: 'map',
          mapX: impact.x,
          mapY: impact.y,
        });
      }
      if (suuHasPatternAction(assetKey, 'hit')) {
        playSuuPatternFx(assetKey, 'hit', { anchor: 'feet' });
      }
      suuApplyPatternHit(hitDmg, heat);
      if (i < hits - 1) await sleep(gapMs);
    }
  }

  /**
   * 전 방향 중력구속（1004/003）：鐵線纏住 → 地板雷射攻擊 → 放開
   * pre＝地板雷射預警（map 廣域，與 regen 同時）
   * regen／loop／end＝鐵線 0／1 同步疊加（竄出／綁住／放開）
   * hit＝命中
   */
  async function fireSuuGravityBind(row, assetKey) {
    if (!fight || !isSuu() || !row || !assetKey) return;
    const hitDmg = suuPatternDmg(row);
    const heat = Number(row.heatOnHit) || 8;
    const bindMs = scaleDelayMs(Math.max(400, Number(row.warningMs) || 1320));
    const hit2Ms = scaleDelayMs(Math.max(0, Number(row.hit2Ms) || 0));
    const hit2Ratio = Number(row.hit2Ratio);
    const hit2Dmg = (Number.isFinite(hit2Ratio) && hit2Ratio > 0)
      ? Math.max(1, Math.floor(hitDmg * hit2Ratio))
      : hitDmg;

    const live = [];
    const track = (el) => { if (el) live.push(el); };
    const clearLive = () => {
      live.forEach((el) => { try { el.remove(); } catch (_) { /* */ } });
      live.length = 0;
    };
    const pinLiveToPlayer = () => {
      const p = suuFieldPointFromPlayer();
      for (let i = 0; i < live.length; i += 1) {
        const el = live[i];
        if (!el?.isConnected) continue;
        el.style.left = `${p.x}px`;
        el.style.top = `${p.y}px`;
      }
    };
    const waitMs = async (ms) => {
      const t0 = Date.now();
      while (Date.now() - t0 < ms) {
        if (!fight || fight.mode !== 'fight') return false;
        pinLiveToPlayer();
        await sleep(TICK_MS);
      }
      return !!(fight && fight.mode === 'fight');
    };

    let preEl = null;
    const feet = suuFieldPointFromPlayer();

    // 1) pre（地板雷射）＋ regen（鐵線竄出）同時
    // pre origin≈1022＝廣域圖，錨在 mapCenter；不拆 0／1（origin 連貫）
    if (suuHasPatternAction(assetKey, 'pre')) {
      playSuuPatternFx(assetKey, 'pre', {
        anchor: 'mapCenter',
        onCreate: (el) => { preEl = el; },
      });
    }
    playSuuStacked01Fx(assetKey, 'regen', {
      mapX: feet.x,
      mapY: feet.y,
      zIndex: 3,
      holdLast: true,
      onCreate: track,
    });
    const regenFrames = suuPatternFrames(assetKey, 'regen') || [];
    const regenMs = scaleDelayMs(Math.max(
      360,
      Math.ceil(regenFrames.length / 2) * 60,
    ));
    if (!(await waitMs(regenMs))) {
      clearLive();
      try { preEl?.remove(); } catch (_) { /* */ }
      return;
    }

    // 2) loop：綁住玩家（0／1 同步循環）
    clearLive();
    const bindPos = suuFieldPointFromPlayer();
    playSuuStacked01Fx(assetKey, 'loop', {
      mapX: bindPos.x,
      mapY: bindPos.y,
      zIndex: 3,
      loop: true,
      onCreate: track,
    });
    if (!(await waitMs(bindMs))) {
      clearLive();
      try { preEl?.remove(); } catch (_) { /* */ }
      return;
    }

    // 3) hit：雷射命中（仍綁著）
    if (suuHasPatternAction(assetKey, 'hit')) {
      playSuuPatternFx(assetKey, 'hit', { anchor: 'feet' });
    }
    suuApplyPatternHit(hitDmg, heat);

    // 4) end：攻擊完畢放開（0／1 同步）
    clearLive();
    try { preEl?.remove(); } catch (_) { /* */ }
    preEl = null;
    if (!fight || fight.mode !== 'fight') return;
    const endPos = suuFieldPointFromPlayer();
    const ended = playSuuStacked01Fx(assetKey, 'end', {
      mapX: endPos.x,
      mapY: endPos.y,
      zIndex: 3,
      holdLast: false,
      onCreate: track,
    });
    if (ended.ms > 0) {
      if (!(await waitMs(ended.ms))) {
        clearLive();
        return;
      }
    }
    clearLive();

    // 5) 後續暗闇（無獨立資產：延遲二段傷）
    if (hit2Ms > 0) {
      const t2 = Date.now();
      while (Date.now() - t2 < hit2Ms) {
        if (!fight || fight.mode !== 'fight') return;
        await sleep(TICK_MS);
      }
      if (!fight || fight.mode !== 'fight') return;
      if (suuHasPatternAction(assetKey, 'hit')) {
        playSuuPatternFx(assetKey, 'hit', { anchor: 'feet' });
      }
      suuApplyPatternHit(hit2Dmg, heat);
    }
  }

  /**
   * 함포（1004/008）：天上加農砲往下轟玩家
   * summon＝出現 → stand＝待機 →（areaWarning 範圍 → attack 發射 → ball 下落
   *   → summonSpecial 腳邊場地特效＋hit）×N
   * masking 用途未明，暫不用
   */
  async function fireSuuSkyCannons(row, assetKey) {
    if (!fight || !isSuu() || !row || !assetKey) return;
    const hitDmg = suuPatternDmg(row);
    const heat = Number(row.heatOnHit) || 8;
    const hits = Math.max(1, resolveSuuPatternHitCount(row));
    const gapMs = scaleDelayMs(Math.max(200, resolveSuuPatternHitGapMs(row) || 900));
    const warnMs = scaleDelayMs(Math.max(360, Number(row.warningMs) || 720));
    const travelMs = scaleDelayMs(Math.max(200, Number(row.ballTravelMs) || 520));
    const field = getBossFieldEl();
    const maxY = field?.clientHeight || 768;
    const maxX = field?.clientWidth || 1366;
    // 掛在場頂外，只露下半砲管；X 跟玩家
    const mapYRaw = Number(row.cannonMapY);
    const gunMapY = Number.isFinite(mapYRaw) ? Math.round(mapYRaw) : -150;

    const gunPos = () => {
      const p = suuFieldPointFromPlayer();
      return {
        x: Math.max(40, Math.min(maxX - 40, Math.round(p.x))),
        y: gunMapY,
      };
    };
    const pinEl = (el, pos) => {
      if (!el?.isConnected || !pos) return;
      el.style.left = `${pos.x}px`;
      el.style.top = `${pos.y}px`;
    };

    const live = [];
    const track = (el) => { if (el) live.push(el); };
    const clearLive = () => {
      live.forEach((el) => { try { el.remove(); } catch (_) { /* */ } });
      live.length = 0;
    };
    const playGunFx = (action, extra = {}) => playSuuPatternFx(assetKey, action, {
      anchor: 'map',
      mapX: gun.x,
      mapY: gun.y,
      noPosClamp: true,
      ...extra,
    });

    let gun = gunPos();

    // 1) summon：加農砲出現（場頂外）
    if (suuHasPatternAction(assetKey, 'summon')) {
      const summonMs = playGunFx('summon', { onCreate: track }) || scaleDelayMs(900);
      const t0 = Date.now();
      while (Date.now() - t0 < summonMs) {
        if (!fight || fight.mode !== 'fight') {
          clearLive();
          return;
        }
        gun = gunPos();
        for (let i = 0; i < live.length; i += 1) pinEl(live[i], gun);
        await sleep(TICK_MS);
      }
      clearLive();
    }
    if (!fight || fight.mode !== 'fight') return;

    // 2) stand：待機循環
    gun = gunPos();
    let standEl = null;
    if (suuHasPatternAction(assetKey, 'stand')) {
      playGunFx('stand', {
        loop: true,
        onCreate: (el) => {
          standEl = el;
          track(el);
        },
      });
    }

    for (let i = 0; i < hits; i += 1) {
      if (!fight || fight.mode !== 'fight') {
        clearLive();
        return;
      }
      // areaWarning：從砲管往下（origin 近頂，圖往下延伸）
      gun = gunPos();
      pinEl(standEl, gun);
      const warnEls = [];
      if (suuHasPatternAction(assetKey, 'areaWarning')) {
        playSuuPatternFx(assetKey, 'areaWarning', {
          anchor: 'map',
          mapX: gun.x,
          mapY: gun.y,
          noPosClamp: true,
          loop: true,
          onCreate: (el) => { if (el) warnEls.push(el); },
        });
      }
      const tWarn = Date.now();
      while (Date.now() - tWarn < warnMs) {
        if (!fight || fight.mode !== 'fight') {
          warnEls.forEach((el) => { try { el.remove(); } catch (_) { /* */ } });
          clearLive();
          return;
        }
        gun = gunPos();
        pinEl(standEl, gun);
        for (let w = 0; w < warnEls.length; w += 1) pinEl(warnEls[w], gun);
        await sleep(TICK_MS);
      }
      warnEls.forEach((el) => { try { el.remove(); } catch (_) { /* */ } });
      if (!fight || fight.mode !== 'fight') {
        clearLive();
        return;
      }

      // attack：發射
      gun = gunPos();
      pinEl(standEl, gun);
      let attackEl = null;
      if (suuHasPatternAction(assetKey, 'attack')) {
        playGunFx('attack', {
          onCreate: (el) => { attackEl = el; },
        });
      }
      // 略等砲口動作再出彈
      const launchWait = scaleDelayMs(Math.max(120, Number(row.ballLaunchMs) || 280));
      const tLaunch = Date.now();
      while (Date.now() - tLaunch < launchWait) {
        if (!fight || fight.mode !== 'fight') {
          try { attackEl?.remove(); } catch (_) { /* */ }
          clearLive();
          return;
        }
        gun = gunPos();
        pinEl(standEl, gun);
        pinEl(attackEl, gun);
        await sleep(TICK_MS);
      }

      gun = gunPos();
      pinEl(standEl, gun);
      pinEl(attackEl, gun);
      const impact = suuFieldPointFromPlayer();
      const start = { x: gun.x, y: Math.max(0, gun.y) };

      let ballEl = null;
      if (suuHasPatternAction(assetKey, 'ball')) {
        playSuuPatternFx(assetKey, 'ball', {
          anchor: 'map',
          mapX: start.x,
          mapY: start.y,
          holdLast: true,
          onCreate: (el) => { ballEl = el; },
        });
      }
      const tFly = Date.now();
      while (Date.now() - tFly < travelMs) {
        if (!fight || fight.mode !== 'fight') {
          try { ballEl?.remove(); } catch (_) { /* */ }
          clearLive();
          return;
        }
        const t = Math.min(1, (Date.now() - tFly) / travelMs);
        const bx = Math.round(start.x + (impact.x - start.x) * t);
        const by = Math.round(start.y + (impact.y - start.y) * t);
        if (ballEl?.isConnected) {
          ballEl.style.left = `${bx}px`;
          ballEl.style.top = `${Math.min(maxY - 8, Math.max(0, by))}px`;
        }
        gun = gunPos();
        pinEl(standEl, gun);
        await sleep(33);
      }
      try { ballEl?.remove(); } catch (_) { /* */ }

      // summonSpecial：上下翻轉後播在落點（可比腳底再抬高）
      if (suuHasPatternAction(assetKey, 'summonSpecial')) {
        const impactNow = suuFieldPointFromPlayer();
        const yBiasRaw = Number(row.summonSpecialYBias);
        const yBias = Number.isFinite(yBiasRaw) ? Math.round(yBiasRaw) : -80;
        playSuuPatternFx(assetKey, 'summonSpecial', {
          anchor: 'map',
          mapX: impactNow.x,
          mapY: Math.round(impactNow.y + yBias),
          flipY: true,
          clampOriginToSprite: true,
        });
      }
      if (suuHasPatternAction(assetKey, 'hit')) {
        playSuuPatternFx(assetKey, 'hit', { anchor: 'feet' });
      }
      suuApplyPatternHit(hitDmg, heat);

      if (i >= hits - 1) break;
      const tGap = Date.now();
      while (Date.now() - tGap < gapMs) {
        if (!fight || fight.mode !== 'fight') {
          clearLive();
          return;
        }
        gun = gunPos();
        pinEl(standEl, gun);
        await sleep(TICK_MS);
      }
    }

    clearLive();
  }

  /**
   * 유도탄（1005/001）：場外多角度直線飛向鎖定點，命中爆炸
   * pre＝鎖定；ball＝砲彈直線（四面八方）；end＝爆炸（不用 hit／mobHit）
   * 鎖定當下若玩家靠近王，則鎖王座標（正服可引）；飛行中不改道
   */
  async function fireSuuSideRocket(row, assetKey) {
    if (!fight || !isSuu() || !row || !assetKey) return;
    const hitDmg = suuPatternDmg(row);
    const heat = Number(row.heatOnHit) || 4;
    const hits = Math.max(1, resolveSuuPatternHitCount(row));
    const gapMs = scaleDelayMs(Math.max(120, resolveSuuPatternHitGapMs(row) || 420));
    const warnMs = scaleDelayMs(Math.max(280, Number(row.warningMs) || 720));
    const speedPx = Math.max(200, Number(row.ballSpeedPx) || 1000);
    const pad = Math.max(24, Math.floor(Number(row.edgePadPx) || 80));
    const lurePx = Math.max(40, Math.floor(Number(row.lureBossPx) || 140));
    const field = getBossFieldEl();
    const maxX = field?.clientWidth || 1366;
    const maxY = field?.clientHeight || 768;

    /** 鎖定當下取點：近王則鎖王，否則鎖玩家 */
    const lockAim = () => {
      const player = suuFieldPointFromPlayer();
      const boss = suuFieldPointFromBoss();
      const dist = Math.hypot(player.x - boss.x, player.y - boss.y);
      const src = dist <= lurePx ? boss : player;
      return {
        x: Math.max(0, Math.min(maxX, Math.round(src.x))),
        y: Math.max(0, Math.min(maxY - 8, Math.round(src.y))),
      };
    };
    const pinEl = (el, pos, rotateRad) => {
      if (!el?.isConnected || !pos) return;
      el.style.left = `${pos.x}px`;
      el.style.top = `${pos.y}px`;
      if (Number.isFinite(rotateRad)) {
        el.style.transform = `rotate(${rotateRad}rad)`;
        el.style.transformOrigin = '0 0';
      }
    };

    for (let i = 0; i < hits; i += 1) {
      if (!fight || fight.mode !== 'fight') return;

      // 1) pre：鎖定期間跟著玩家；結束時凍結落點
      let preEl = null;
      if (suuHasPatternAction(assetKey, 'pre')) {
        playSuuPatternFx(assetKey, 'pre', {
          anchor: 'feet',
          loop: true,
          onCreate: (el) => { preEl = el; },
        });
      }
      const tWarn = Date.now();
      while (Date.now() - tWarn < warnMs) {
        if (!fight || fight.mode !== 'fight') {
          try { preEl?.remove(); } catch (_) { /* */ }
          return;
        }
        pinEl(preEl, suuFieldPointFromPlayer());
        await sleep(TICK_MS);
      }
      try { preEl?.remove(); } catch (_) { /* */ }
      if (!fight || fight.mode !== 'fight') return;

      const locked = lockAim();

      // 2) ball：四面八方場外直線飛向鎖定點（不中途改道）
      const nDir = Math.max(4, Math.floor(Number(row.spawnDirCount) || 8));
      const jitter = (Math.random() - 0.5) * 0.4;
      const theta = ((i % nDir) / nDir) * Math.PI * 2 + jitter;
      const dist = Math.max(maxX, maxY) * 0.55 + pad;
      const start = {
        x: Math.round(locked.x - Math.cos(theta) * dist),
        y: Math.round(locked.y - Math.sin(theta) * dist),
      };
      const ang = Math.atan2(locked.y - start.y, locked.x - start.x) + Math.PI;
      const flightDist = Math.hypot(locked.x - start.x, locked.y - start.y) || 1;
      const travelMs = scaleDelayMs(Math.max(120, (flightDist / speedPx) * 1000));
      let ballEl = null;
      if (suuHasPatternAction(assetKey, 'ball')) {
        playSuuPatternFx(assetKey, 'ball', {
          anchor: 'map',
          mapX: start.x,
          mapY: start.y,
          noPosClamp: true,
          holdLast: true,
          rotateRad: ang,
          onCreate: (el) => { ballEl = el; },
        });
      }
      const tFly = Date.now();
      while (Date.now() - tFly < travelMs) {
        if (!fight || fight.mode !== 'fight') {
          try { ballEl?.remove(); } catch (_) { /* */ }
          return;
        }
        const t = Math.min(1, (Date.now() - tFly) / travelMs);
        const bx = Math.round(start.x + (locked.x - start.x) * t);
        const by = Math.round(start.y + (locked.y - start.y) * t);
        pinEl(ballEl, { x: bx, y: by }, ang);
        await sleep(33);
      }
      try { ballEl?.remove(); } catch (_) { /* */ }
      if (!fight || fight.mode !== 'fight') return;

      // 3) end：在鎖定點爆炸
      if (suuHasPatternAction(assetKey, 'end')) {
        playSuuPatternFx(assetKey, 'end', {
          anchor: 'map',
          mapX: locked.x,
          mapY: locked.y,
        });
      } else if (suuHasPatternAction(assetKey, 'hit')) {
        playSuuPatternFx(assetKey, 'hit', {
          anchor: 'map',
          mapX: locked.x,
          mapY: locked.y,
        });
      }
      suuApplyPatternHit(hitDmg, heat);

      if (i < hits - 1) await sleep(gapMs);
    }
  }

  /**
   * 무차별 폭격（1004/009）：地板紅警告 → 1.5s 後核心激光爆炸
   * pre＝警告（難度 6／8／9 格寬）；播完 effect＋玩家 hit
   * 每隔 4.5s 觸發，共 3 次；傷害用 attackHpRatio／attackHpRatioByDiff
   */
  async function fireSuuMapBarrage(row, assetKey) {
    if (!fight || !isSuu() || !row || !assetKey) return;
    const hitDmg = suuPatternDmg(row);
    const heat = Number(row.heatOnHit) || 8;
    const hits = Math.max(1, resolveSuuPatternHitCount(row));
    const warnMs = scaleDelayMs(Math.max(400, Number(row.warningMs) || 1500));
    const gapMs = scaleDelayMs(Math.max(warnMs, resolveSuuPatternHitGapMs(row) || 4500));
    const diffId = String(activeDiff?.id || fight?.difficultyId || 'hard');
    const gridBy = row.warnGridByDiff || {};
    let grids = Number(gridBy[diffId] ?? gridBy.hard);
    if (!(grids > 0)) grids = diffId === 'normal' ? 6 : (diffId === 'extreme' ? 9 : 8);
    const gridPx = Math.max(40, Math.floor(Number(row.gridPx) || 90));
    const stripW = grids * gridPx;
    const field = getBossFieldEl();
    const maxX = field?.clientWidth || 1366;
    const core = suuFieldPointMapCore();
    const floorY = Math.round(core.y + (Math.floor(Number(row.floorYBias) || 0)));
    const preStep = Math.max(40, Math.floor(Number(row.preStepPx) || 176));

    const clearEls = (els) => {
      (els || []).forEach((el) => { try { el.remove(); } catch (_) { /* */ } });
    };

    for (let i = 0; i < hits; i += 1) {
      if (!fight || fight.mode !== 'fight') return;
      const shotAt = Date.now();
      const player = suuFieldPointFromPlayer();
      const half = stripW * 0.5;
      let cx = player.x + (Math.random() - 0.5) * stripW * 0.35;
      cx = Math.max(half + 8, Math.min(maxX - half - 8, Math.round(cx)));
      const x0 = cx - half;
      const x1 = cx + half;

      // 1) pre：紅色警告橫條（鋪格寬）
      const preEls = [];
      if (suuHasPatternAction(assetKey, 'pre')) {
        for (let x = x0; x < x1 - 8; x += preStep) {
          playSuuPatternFx(assetKey, 'pre', {
            anchor: 'map',
            mapX: Math.round(x + preStep * 0.5),
            mapY: floorY,
            loop: true,
            onCreate: (el) => { if (el) preEls.push(el); },
          });
        }
      }
      const tWarn = Date.now();
      while (Date.now() - tWarn < warnMs) {
        if (!fight || fight.mode !== 'fight') {
          clearEls(preEls);
          return;
        }
        await sleep(TICK_MS);
      }
      clearEls(preEls);
      if (!fight || fight.mode !== 'fight') return;

      // 2) effect：該位置激光／爆炸；hit 在玩家
      if (suuHasPatternAction(assetKey, 'effect')) {
        playSuuPatternFx(assetKey, 'effect', {
          anchor: 'map',
          mapX: cx,
          mapY: floorY,
        });
      }
      const feet = suuFieldPointFromPlayer();
      const inStrip = feet.x >= x0 && feet.x <= x1;
      if (inStrip) {
        if (suuHasPatternAction(assetKey, 'hit')) {
          playSuuPatternFx(assetKey, 'hit', { anchor: 'feet' });
        }
        suuApplyPatternHit(hitDmg, heat);
      }

      if (i >= hits - 1) break;
      const wait = Math.max(0, gapMs - (Date.now() - shotAt));
      if (wait > 0) {
        const tGap = Date.now();
        while (Date.now() - tGap < wait) {
          if (!fight || fight.mode !== 'fight') return;
          await sleep(TICK_MS);
        }
      }
    }
  }

  function fireSuuPattern(row) {
    if (!fight || !isSuu() || !row) return;
    const assetKey = resolveSuuPatternAsset(row);
    if (row.castMode === 'suicideMine') {
      void fireSuuSuicideMine(row);
      return;
    }
    if (row.castMode === 'suicideRobot') {
      void fireSuuSuicideRobot(row);
      return;
    }
    if (row.castMode === 'trackingLaser' && assetKey) {
      void fireSuuTrackingLaser(row, assetKey);
      return;
    }
    if (row.castMode === 'armSlam' && assetKey) {
      void fireSuuArmSlam(row, assetKey);
      return;
    }
    if (row.castMode === 'dropExplode' && assetKey) {
      void fireSuuDropExplode(row, assetKey);
      return;
    }
    if (row.castMode === 'sawRise' && assetKey) {
      void fireSuuSawRise(row, assetKey);
      return;
    }
    if (row.castMode === 'floorCurrent' && assetKey) {
      void fireSuuFloorCurrent(row, assetKey);
      return;
    }
    if (row.castMode === 'pinpointVolley' && assetKey) {
      void fireSuuPinpointVolley(row, assetKey);
      return;
    }
    if (row.castMode === 'horizontalBarrage' && assetKey) {
      void fireSuuHorizontalBarrage(row, assetKey);
      return;
    }
    if (row.castMode === 'fieldDrone' && assetKey) {
      void fireSuuFieldDrone(row, assetKey);
      return;
    }
    if (row.castMode === 'headDrone' && assetKey) {
      void fireSuuHeadDrone(row, assetKey);
      return;
    }
    if (row.castMode === 'jarBomb' && assetKey) {
      void fireSuuJarBomb(row, assetKey);
      return;
    }
    if (row.castMode === 'platformBreak' && assetKey) {
      void fireSuuPlatformBreak(row, assetKey);
      return;
    }
    if (row.castMode === 'gravityBind' && assetKey) {
      void fireSuuGravityBind(row, assetKey);
      return;
    }
    if (row.castMode === 'skyCannons' && assetKey) {
      void fireSuuSkyCannons(row, assetKey);
      return;
    }
    if (row.castMode === 'sideRocket' && assetKey) {
      void fireSuuSideRocket(row, assetKey);
      return;
    }
    if (row.castMode === 'mapBarrage' && assetKey) {
      void fireSuuMapBarrage(row, assetKey);
      return;
    }
    const playerEl = getBossPlayerEl();
    const hitDmg = suuPatternDmg(row);
    const heat = Number(row.heatOnHit) || 8;
    const warnMs = scaleDelayMs(Math.max(400, Number(row.warningMs) || 1000));
    const aimMs = scaleDelayMs(Math.max(0, Number(row.aimMs) || 0));
    const hit2Ms = scaleDelayMs(Math.max(0, Number(row.hit2Ms) || 0));
    const warnLayers = normalizeSuuFxLayers(row, 'fxWarnLayers');
    const aimLayers = normalizeSuuFxLayers(row, 'fxAimLayers');
    const hitLayers = normalizeSuuFxLayers(row, 'fxHitLayers');
    const hit2Layers = normalizeSuuFxLayers(row, 'fxHit2Layers');
    const hits = resolveSuuPatternHitCount(row);
    const gapMs = scaleDelayMs(Math.max(120, resolveSuuPatternHitGapMs(row)));
    const hit2Ratio = Number(row.hit2Ratio);
    const hit2Dmg = (Number.isFinite(hit2Ratio) && hit2Ratio > 0)
      ? Math.max(1, Math.floor(hitDmg * hit2Ratio))
      : hitDmg;

    const applyOne = (layers, dmg) => {
      if (!fight || fight.mode !== 'fight') return;
      if (playerEl && typeof IdleMobAnim !== 'undefined') {
        IdleMobAnim.playPlayerHit?.(playerEl, pad(fight.body.visualId), 'stand', { immediate: true });
      }
      if (assetKey) {
        if (layers) playSuuPatternLayers(assetKey, layers);
        else playSuuPatternFx(assetKey, 'hit', { anchor: row.anchor || 'feet' });
      }
      hurtPlayerFromBoss('body', dmg, { heatOnHit: heat });
      hooks?.syncPlayerHp?.();
    };

    const runHits = async () => {
      for (let i = 0; i < hits; i += 1) {
        if (!fight || fight.mode !== 'fight') return;
        applyOne(hitLayers, hitDmg);
        if (i < hits - 1) await sleep(gapMs);
      }
      if (hit2Ms > 0) {
        const t1 = Date.now();
        while (Date.now() - t1 < hit2Ms) {
          if (!fight || fight.mode !== 'fight') return;
          await sleep(TICK_MS);
        }
        applyOne(hit2Layers || hitLayers, hit2Dmg);
      }
    };

    const start = async () => {
      // 只清 loop／holdLast（避免殘留）；單次長動畫如 bunker effect 播完自移除
      const clearEls = [];
      if (assetKey && warnLayers) {
        const played = playSuuPatternLayers(assetKey, warnLayers);
        for (let i = 0; i < played.clearEls.length; i += 1) clearEls.push(played.clearEls[i]);
      } else if (assetKey) {
        playSuuPatternFx(assetKey, 'pre', {
          anchor: row.anchor || 'feet',
        });
      }

      if (aimMs > 0 && assetKey && aimLayers) {
        const t0 = Date.now();
        while (Date.now() - t0 < aimMs) {
          if (!fight || fight.mode !== 'fight') {
            removeSuuFxEls(clearEls);
            return;
          }
          await sleep(TICK_MS);
        }
        const aimed = playSuuPatternLayers(assetKey, aimLayers);
        for (let i = 0; i < aimed.clearEls.length; i += 1) clearEls.push(aimed.clearEls[i]);
      }

      const started = Date.now();
      while (Date.now() - started < warnMs) {
        if (!fight || fight.mode !== 'fight') {
          removeSuuFxEls(clearEls);
          return;
        }
        await sleep(TICK_MS);
      }
      removeSuuFxEls(clearEls);
      await runHits();
    };
    void start();
  }

  /**
   * 二階常駐掉落物（1002/004）：同 1007/000 流程
   * regen 空中懸停 → loop（對應 stand）落到玩家腳底 → end 砸中／end2 沒砸中
   */
  async function spawnSuuDebrisDrop(cfg) {
    if (!fight || !isSuu() || !cfg) return;
    const field = getBossFieldEl();
    const maxX = field?.clientWidth || 1366;
    const maxY = field?.clientHeight || 768;
    const floor = suuFieldPointFromPlayer();
    const styles = Array.isArray(cfg.styles) && cfg.styles.length
      ? cfg.styles
      : [0, 1, 2];
    const style = styles[Math.floor(Math.random() * styles.length)];
    const baseKey = String(cfg.assetKey || '1002/004');
    const assetKey = `${baseKey}/${style}`;
    if (!suuHasPatternAction(assetKey, 'regen') && !suuHasPatternAction(assetKey, 'loop')) {
      return;
    }

    // 空中高度（相對腳底）；預設高於 scrap，避免「不夠高」
    const airPx = Math.max(80, Number(cfg.fallAirPx) || 520);
    const airY = Math.max(40, floor.y - airPx);
    // 落地錨點：腳底再上移，避免 end／end2 origin 看起來過低
    const landBias = Number(cfg.landYBias);
    const landY = Math.round(
      floor.y + (Number.isFinite(landBias) ? landBias : -55),
    );
    const x = Math.round(40 + Math.random() * Math.max(40, maxX - 80));

    // 下落時間：預設跟 WZ loop 總 delay（約 720），勿短於動畫造成循環閃爍
    const loopFrames = suuPatternFrames(assetKey, 'loop') || [];
    let loopDur = 0;
    for (let i = 0; i < loopFrames.length; i += 1) {
      loopDur += Math.max(30, Number(loopFrames[i]?.delay) || 60);
    }
    const fallMs = scaleDelayMs(
      Math.max(200, Number(cfg.fallMs) || loopDur || 720),
    );

    fight.suuDebrisAlive = (Number(fight.suuDebrisAlive) || 0) + 1;
    const release = () => {
      if (!fight) return;
      fight.suuDebrisAlive = Math.max(0, (Number(fight.suuDebrisAlive) || 0) - 1);
    };

    try {
      // 1) regen：空中出現／懸停
      const regenMs = playSuuPatternFx(assetKey, 'regen', {
        anchor: 'map',
        mapX: x,
        mapY: airY,
      }) || scaleDelayMs(360);
      await sleep(regenMs);
      if (!fight || fight.mode !== 'fight') return;

      // 2) loop：同 1007 stand 下落；holdLast 避免播完跳回第 0 幀閃爍
      let loopEl = null;
      playSuuPatternFx(assetKey, 'loop', {
        anchor: 'map',
        mapX: x,
        mapY: airY,
        holdLast: true,
        onCreate: (el) => { loopEl = el; },
      });
      const tFall = Date.now();
      const stepMs = 33;
      while (Date.now() - tFall < fallMs) {
        if (!fight || fight.mode !== 'fight') {
          try { loopEl?.remove(); } catch (_) { /* */ }
          return;
        }
        const t = Math.min(1, (Date.now() - tFall) / fallMs);
        const y = Math.round(airY + (landY - airY) * t);
        if (loopEl?.isConnected) {
          loopEl.style.top = `${Math.min(maxY - 8, Math.max(0, y))}px`;
          loopEl.style.left = `${x}px`;
        }
        await sleep(stepMs);
      }
      try { loopEl?.remove(); } catch (_) { /* */ }
      if (!fight || fight.mode !== 'fight') return;

      // 3) 砸中：用下落終點高度；近玩家則 end＋傷害，否則 end2
      const player = suuFieldPointFromPlayer();
      const hitR = Math.max(20, Number(cfg.hitRadiusPx) || 72);
      const hit = Math.abs((Number(player.x) || 0) - x) <= hitR;
      if (hit) {
        playSuuPatternFx(assetKey, 'end', {
          anchor: 'map',
          mapX: x,
          mapY: landY,
        });
        const dmg = suuPatternDmg({
          attackHpRatio: Number(cfg.attackHpRatio) || 1,
        });
        suuApplyPatternHit(dmg, Number(cfg.heatOnHit) || 7);
      } else {
        playSuuPatternFx(assetKey, 'end2', {
          anchor: 'map',
          mapX: x,
          mapY: landY,
        });
      }
    } finally {
      release();
    }
  }

  /** skill5：一次丟出數顆 1002/004 */
  async function fireSuuDebrisRainBurst() {
    if (!fight || !isSuu()) return;
    const cfg = suuKitCfg().debrisRain;
    if (!cfg || cfg.enabled === false) return;
    const phase = Math.max(1, Math.floor(Number(fight.phase) || 1));
    const phases = Array.isArray(cfg.phases) ? cfg.phases : [2];
    if (!phases.includes(phase)) return;
    const n = Math.max(1, Math.floor(Number(cfg.burstCount) || 4));
    const gap = scaleDelayMs(Math.max(60, Number(cfg.burstGapMs) || 420));
    for (let i = 0; i < n; i += 1) {
      if (!fight || fight.mode !== 'fight') return;
      void spawnSuuDebrisDrop(cfg);
      if (i < n - 1) await sleep(gap);
    }
  }

  /**
   * 本體 skill 召喚 pattern／掉落物：
   * 8881101 skill5＝debrisRain、skill6＝bombard、skill7＝slowWall
   * 8881102 skill3＝bunker、skill4＝gravityBind、skill6＝platformShot、skill9＝cannons
   */
  async function runSuuBodySummonSkill(slotKey, unit, atk) {
    if (!fight || !isSuu() || !unit || !atk?.suuSummonPattern) return;
    const bodyId = pad(unit.visualId);
    const actionKey = String(atk.actionKey || '');
    const summonId = String(atk.suuSummonPattern);
    if (!actionKey) return;
    if (!flashAttack(slotKey, bodyId, actionKey)) {
      if (!atkAcc[slotKey]) atkAcc[slotKey] = Object.create(null);
      atkAcc[slotKey][actionKey] = Math.max(
        0,
        ((Number(atk.animMs) || 1200) / 1000) * cdMult(fight.listId) * 0.5,
      );
      return;
    }
    // 略等本體招起手再出召喚物
    const delayMs = scaleDelayMs(Math.max(0, Number(atk.summonDelayMs) || 360));
    if (delayMs > 0) {
      const t0 = Date.now();
      while (Date.now() - t0 < delayMs) {
        if (!fight || fight.mode !== 'fight') return;
        await sleep(TICK_MS);
      }
    }
    if (!fight || fight.mode !== 'fight') return;
    if (summonId === 'debrisRain') {
      void fireSuuDebrisRainBurst();
      return;
    }
    const row = (Array.isArray(suuKitCfg().patterns) ? suuKitCfg().patterns : [])
      .find((p) => p?.id === summonId);
    if (row) fireSuuPattern(row);
  }

  /**
   * 史烏無施法動作：各招獨立 CD，動畫可同時在場重疊。
   * 開招之間另有 patternCastGapSec 全域間隔（預設 1s）。
   * bodySummonOnly（skill5／6／7）不進此池。
   */
  function tickSuuPatterns(dt) {
    if (!fight || !isSuu() || busy || fight.mode !== 'fight') return;
    const kit = suuKitCfg();
    const patterns = Array.isArray(kit.patterns) ? kit.patterns : [];
    const phase = Math.max(1, Math.floor(Number(fight.phase) || 1));
    const purge = suuInPurge();
    if (!fight.suuPatternAcc) fight.suuPatternAcc = Object.create(null);
    const acc = fight.suuPatternAcc;

    const collectReady = () => {
      const readyList = [];
      for (let i = 0; i < patterns.length; i += 1) {
        const row = patterns[i];
        if (!row?.id || row.bodySummonOnly) continue;
        const phases = Array.isArray(row.phases) ? row.phases : [1, 2, 3];
        if (!phases.includes(phase)) continue;
        if (row.requiresPurge && !purge) continue;
        const cdMul = (purge && !row.requiresPurge) ? 1.35 : 1;
        const cd = Math.max(2, resolveSuuPatternCdSec(row)) * cdMul;
        if ((Number(acc[row.id]) || 0) < cd) continue;
        readyList.push(row);
      }
      if (!readyList.length) return [];
      if (purge) {
        const purgeOnly = readyList.filter((r) => r.requiresPurge);
        if (purgeOnly.length) return purgeOnly;
      }
      return readyList;
    };

    for (let i = 0; i < patterns.length; i += 1) {
      const row = patterns[i];
      if (!row?.id || row.bodySummonOnly) continue;
      const phases = Array.isArray(row.phases) ? row.phases : [1, 2, 3];
      if (!phases.includes(phase)) continue;
      if (row.requiresPurge && !purge) continue;
      acc[row.id] = (Number(acc[row.id]) || 0) + Math.max(0, Number(dt) || 0);
    }

    const gapSec = Number(kit.patternCastGapSec);
    const gapMs = scaleDelayMs(Math.max(0, Number.isFinite(gapSec) ? gapSec : 1) * 1000);
    if (Date.now() < (Number(fight.suuNextPatternAt) || 0)) return;

    const pool = collectReady();
    if (!pool.length) return;
    const ready = pool[Math.floor(Math.random() * pool.length)];
    acc[ready.id] = 0;
    fight.suuNextPatternAt = Date.now() + gapMs;
    fireSuuPattern(ready);
  }

  function applySuuMapArt(form) {
    const art = form?.mapArt;
    if (art && typeof hooks?.setMapArt === 'function') {
      hooks.setMapArt(String(art));
    }
  }

  async function enterSuuPhase(formIndex) {
    if (!fight || !isSuu()) return;
    const forms = fight.script.bodyForms || [];
    if (formIndex < 0 || formIndex >= forms.length) return;
    busy = true;
    const seq = atkFxSeq;
    clearSuuPatternsRuntime();

    // 各階過場黑頻（換圖／換型）
    if (typeof hooks?.fadeField === 'function') {
      await hooks.fadeField(1, 400);
    }
    if (seq !== atkFxSeq || !fight || !isSuu()) return;

    fight.bodyFormIndex = formIndex;
    fight.phase = 1 + formIndex;
    hooks?.onPhase?.(fight.phase);
    const form = forms[formIndex];
    const visualId = pad(form.visualMob || form.statMob);
    fight.body.visualId = visualId;
    fight.body.maxHp = maxHpOfBodyForm(fight.listId, form);
    fight.body.hp = fight.body.maxHp;
    fight.body.invincible = false;
    fight.body.targetable = true;
    fight.body.dead = false;
    fight.suuShieldActive = false;
    fight.suuShieldUntil = 0;
    fight.suuShieldHp = 0;
    fight.suuShieldMax = 0;
    fight.suuNextShieldAt = Date.now() + scaleDelayMs(8000);
    fight.suuPurgeUntil = 0;
    fight.suuPurgeDurationMs = 0;
    fight.suuOverloadUntil = 0;
    fight.suuDamageTowardCool = 0;
    fight.suuPatternAcc = Object.create(null);
    fight.suuUiBgFrame = 0;
    fight.suuUiBg0Frame = 0;
    fight.suuUiAnimAcc = 0;
    hideSuuAlertFrame();
    if (formIndex >= 2) {
      const startG = Number(suuKitCfg().gauge?.p3Start);
      fight.suuGauge = Math.max(0, Number.isFinite(startG) ? startG : 55);
    } else {
      fight.suuGauge = Math.min(Number(fight.suuGauge) || 0, 40);
    }
    applySuuMapArt(form);
    let bossPos = hooks?.getBossPos?.() || { x: 720, y: 610 };
    if (form.bossPos || form.playerPos) {
      bossPos = applyHorntailStageLayout(form, bossPos);
    }
    const el = slotEl('body');
    if (!el) mountInitialActors(bossPos);
    else applyActorLayout(bossPos);
    bindVisual('body', visualId, 'stand');

    if (typeof hooks?.fadeField === 'function') {
      await hooks.fadeField(0, 400);
    }
    if (seq !== atkFxSeq || !fight || !isSuu()) return;

    busy = false;
    syncSuuGaugeHud();
    syncHud();
  }

  async function onSuuPhaseDown() {
    if (!fight || !isSuu() || busy || fight.mode !== 'fight') return;
    if (!(fight.body.hp <= 0)) return;
    const forms = fight.script.bodyForms || [];
    const next = (Number(fight.bodyFormIndex) || 0) + 1;
    busy = true;
    stopSustainCombat();
    clearSuuPatternsRuntime();
    atkFxSeq += 1;
    const seq = atkFxSeq;
    const fightRef = fight;
    if (next < forms.length) {
      clearUnitDebuff('body');
      const dieVisual = fight.body.visualId;
      await playAnim('body', dieVisual, 'die1');
      // 退場／換難度 reset 後不可再推進舊戰鬥的下一階（否則 Hard 會跳過一階）
      if (seq !== atkFxSeq || fight !== fightRef || !fight || !isSuu()) return;
      if (fight.mode !== 'fight') return;
      await enterSuuPhase(next);
      return;
    }
    if (seq !== atkFxSeq || fight !== fightRef) return;
    busy = false;
    await onBodyDead();
  }

  function clearSuuPatternsRuntime() {
    if (!fight) return;
    fight.suuPatternBusyUntil = 0;
    fight.suuNextPatternAt = 0;
    fight.suuDebrisAlive = 0;
    fight.suuDebrisNextAt = 0;
    clearSuuShieldLoop();
    clearSuuSummonSlots();
    const field = getBossFieldEl();
    field?.querySelectorAll?.('.idle-boss-suu-fx-stage, .idle-boss-suu-fx').forEach((n) => n.remove());
    stage()?.querySelectorAll('.idle-boss-suu-fx-stage, .idle-boss-suu-fx').forEach((n) => n.remove());
    getBossPlayerEl()?.querySelectorAll?.('.idle-boss-suu-fx-stage').forEach((n) => n.remove());
  }

  async function playSuuIntro() {
    if (!fight || !isSuu()) return;
    const seq = atkFxSeq;
    const form = (fight.script.bodyForms || [])[0];
    const id = pad(form?.visualMob || form?.statMob || '8881100');
    busy = true;
    applySuuMapArt(form);
    fight.suuNextShieldAt = Date.now() + scaleDelayMs(10000);
    const el = slotEl('body');
    if (el) {
      el.classList.remove('is-hidden-slot');
      el.style.display = '';
      bindVisual('body', id, 'stand');
    }
    await sleep(scaleDelayMs(400));
    if (seq !== atkFxSeq || !fight) return;
    fight.body.invincible = false;
    fight.body.targetable = true;
    busy = false;
    hooks?.onPhase?.(1);
    syncSuuGaugeHud();
    syncHud();
  }

  function damienKitCfg() {
    return fight?.script?.damienKit || phaseScript(fight?.listId)?.damienKit || {};
  }

  /** 共血池：各階實際可打血；血條顯示固定前 70%／後 30%（barP1Share／barP2Share） */
  function damienFormPoolHp(listId, form) {
    if (!form) return 0;
    const fixed = Number(form.maxHp);
    if (Number.isFinite(fixed) && fixed > 0) return Math.max(1, Math.floor(fixed));
    const mob = form.statMob || form.visualMob;
    const id = pad(mob);
    // formHpMult＝該階實際血（不乘 WZ maxHP，避免 P1=0／P2=1200億把比例打歪）
    if (activeDiff?.formHpMult && typeof activeDiff.formHpMult === 'object') {
      const hit = activeDiff.formHpMult[id]
        ?? activeDiff.formHpMult[String(mob)]
        ?? activeDiff.formHpMult[String(Number(id))];
      if (Number(hit) > 0) return Math.max(1, Math.floor(Number(hit)));
    }
    return Math.max(1, maxHpOfBodyForm(listId, form));
  }

  function damienPhasePools(listId, script) {
    const forms = Array.isArray(script?.bodyForms) ? script.bodyForms : [];
    const form0 = forms[0] || { statMob: '8880100', visualMob: '8880100' };
    const form1 = forms[1] || null;
    const p1 = Math.max(1, damienFormPoolHp(listId, form0));
    const p2 = form1 ? Math.max(1, damienFormPoolHp(listId, form1)) : 0;
    return { p1, p2, total: Math.max(1, p1 + p2), form0, form1 };
  }

  function damienBarShares() {
    const kit = damienKitCfg();
    let a = Number(kit.barP1Share);
    let b = Number(kit.barP2Share);
    if (!(a > 0)) a = 0.7;
    if (!(b > 0)) b = 0.3;
    const s = a + b;
    return { p1: a / Math.max(1e-9, s), p2: b / Math.max(1e-9, s) };
  }

  /** 血條比例 0～1：一階打完仍顯示 30%，與實際池大小無關 */
  function damienBarRatio() {
    if (!fight || !isDamien()) return 1;
    const { p1: s1, p2: s2 } = damienBarShares();
    if ((Number(fight.phase) || 1) <= 1) {
      const r = (Number(fight.damienP1Remain) || 0) / Math.max(1, Number(fight.damienP1Max) || 1);
      return s2 + s1 * Math.max(0, Math.min(1, r));
    }
    const r = (Number(fight.damienP2Remain) || 0) / Math.max(1, Number(fight.damienP2Max) || 1);
    return s2 * Math.max(0, Math.min(1, r));
  }

  function syncDamienDisplayHp() {
    if (!fight?.body || !isDamien()) return;
    const max = Math.max(1, Number(fight.body.maxHp) || 1);
    fight.body.hp = Math.max(0, Math.round(max * damienBarRatio()));
  }

  function applyDamienPoolDamage(actualDmg) {
    if (!fight || !isDamien()) return;
    const dmg = Math.max(0, Math.floor(Number(actualDmg) || 0));
    if ((Number(fight.phase) || 1) <= 1) {
      fight.damienP1Remain = Math.max(0, (Number(fight.damienP1Remain) || 0) - dmg);
    } else {
      fight.damienP2Remain = Math.max(0, (Number(fight.damienP2Remain) || 0) - dmg);
    }
    syncDamienDisplayHp();
  }

  function createDamienFight(listId, script) {
    const pools = damienPhasePools(listId, script);
    const form0 = pools.form0;
    // body.maxHp＝血條解析度；實際可打血在 damienP*Max／Remain
    const displayMax = 10000000;
    return {
      listId: String(listId),
      kind: 'damien',
      script,
      phase: 1,
      bodyFormIndex: 0,
      bodyZ: Number.isFinite(Number(script.bodyZ)) ? Number(script.bodyZ) : 20,
      body: {
        key: 'body',
        uid: 'body',
        isBoss: true,
        visualId: pad(form0.visualMob || form0.statMob),
        hp: displayMax,
        maxHp: displayMax,
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
      damienP1Max: pools.p1,
      damienP1Remain: pools.p1,
      damienP2Max: pools.p2,
      damienP2Remain: pools.p2,
      damienSword: null,
      damienSword2: null,
      damienCrystals: null,
      damienCrystal: null,
      damienFireballs: null,
      damienTornadoBalls: null,
      damienAwMarkers: null,
      damienWorldTree: null,
      damienNextWorldTreeAt: 0,
      damienBindUntil: 0,
      damienActionStopUntil: 0,
    };
  }

  function buildDamienAttacks(listId, mobId) {
    const id = pad(mobId);
    const pkit = damienKitCfg().phaseKits?.[id] || {};
    const exclude = new Set((pkit.excludeActions || []).map(String));
    const ratioMap = pkit.attackHpRatio || {};
    const cdMap = pkit.attackCdSec || {};
    const chainMap = pkit.skillChain || {};
    const castMap = pkit.damienCast || {};
    const part = wzPart(listId, id);
    const basePa = Math.max(0, Number(part?.PADamage) || Number(part?.MADamage) || 22000);
    const cdDiff = Number(activeDiff?.patternCdMult) > 0 ? Number(activeDiff.patternCdMult) : 1;
    const out = [];
    const seen = new Set();
    const push = (row) => {
      if (!row?.actionKey || seen.has(row.actionKey) || exclude.has(row.actionKey)) return;
      seen.add(row.actionKey);
      out.push(row);
    };
    Object.keys(ratioMap).forEach((actionKey) => {
      if (exclude.has(actionKey)) return;
      if (typeof IdleMobAnim !== 'undefined' && !IdleMobAnim.resolveAction?.(id, actionKey)) return;
      const ratio = Number(ratioMap[actionKey]);
      const dmg = scaleWzByHpRatio(basePa, Number.isFinite(ratio) && ratio > 0 ? ratio : 0.0001, 0.0001);
      const cdSec = Number(cdMap[actionKey]);
      const cdMs = cdSec > 0 ? cdSec * 1000 * cdDiff : 0;
      const chainCfg = chainMap[actionKey];
      const castKind = castMap[actionKey] ? String(castMap[actionKey]) : '';
      let animMs = Math.max(
        mobAnimMs(id, actionKey, 1600),
        cdMs,
      );
      if (chainCfg?.afterKey) {
        animMs = Math.max(
          animMs,
          mobAnimMs(id, actionKey, 1600) + mobAnimMs(id, String(chainCfg.afterKey), 1000),
          cdMs,
        );
      }
      const row = {
        actionKey,
        dmg: (Number.isFinite(ratio) && ratio > 0) ? dmg : 0,
        animMs,
        magic: /^skill/i.test(actionKey),
        damienCast: castKind || undefined,
      };
      if (chainCfg?.afterKey && !castKind) {
        const rowChain = {
          afterKey: String(chainCfg.afterKey),
          dmgRatio: Number.isFinite(Number(chainCfg.dmgRatio)) ? Number(chainCfg.dmgRatio) : 1,
        };
        if (Number.isFinite(Number(chainCfg.castDamageFrame))) {
          rowChain.castDamageFrame = Math.max(0, Math.floor(Number(chainCfg.castDamageFrame)));
        }
        if (Number.isFinite(Number(chainCfg.damageFrame))) {
          rowChain.damageFrame = Math.max(0, Math.floor(Number(chainCfg.damageFrame)));
        }
        row.skillChain = rowChain;
      }
      push(row);
    });
    return out;
  }

  function damienPatternFrames(assetKey, action) {
    const data = (typeof IDLE_BOSS_DAMIEN_PATTERN_DATA !== 'undefined')
      ? IDLE_BOSS_DAMIEN_PATTERN_DATA
      : {};
    const frames = data?.[assetKey]?.[action];
    return Array.isArray(frames) ? frames : [];
  }

  function damienFxHost() {
    return getBossFieldEl() || stage();
  }

  function mountDamienFx(slot, x, y, zIndex, opts = {}) {
    const host = damienFxHost();
    if (!host) return null;
    let el = host.querySelector(`.idle-boss-damien-fx-stage[data-slot="${slot}"]`);
    if (!el) {
      el = document.createElement('div');
      el.className = 'idle-actor idle-actor--mob idle-boss-damien-fx-stage';
      el.dataset.slot = slot;
      el.innerHTML = '<img class="idle-actor-sprite idle-boss-damien-fx-sprite" alt="" draggable="false">';
      host.appendChild(el);
    }
    if (opts.poseTransform) {
      // 飛劍：用 translate 小數座標，避免 left/top 取整造成斜向「下樓梯」
      el.style.left = '0px';
      el.style.top = '0px';
    } else {
      el.style.left = `${Number(x) || 0}px`;
      el.style.top = `${Number(y) || 0}px`;
      el.style.transform = 'none';
    }
    if (Number.isFinite(zIndex)) el.style.zIndex = String(zIndex);
    el.style.display = '';
    return el;
  }

  function damienPatternDurationMs(frames) {
    if (!Array.isArray(frames) || !frames.length) return 0;
    let total = 0;
    for (let i = 0; i < frames.length; i += 1) {
      total += Math.max(1, Number(frames[i]?.delay) || 90);
    }
    return total;
  }

  function paintDamienFx(el, frames, elapsedMs, opts = {}) {
    if (!el || !frames?.length) return 0;
    const img = el.querySelector('img');
    if (!img) return 0;
    const loop = opts.loop !== false;
    const total = damienPatternDurationMs(frames);
    if (!(total > 0)) return 0;

    let acc = Math.max(0, Number(elapsedMs) || 0);
    if (loop) acc %= total;
    else acc = Math.min(acc, Math.max(0, total - 0.01));
    let fr = frames[frames.length - 1];
    let frameIdx = frames.length - 1;
    for (let i = 0; i < frames.length; i += 1) {
      const delay = Math.max(1, Number(frames[i]?.delay) || 90);
      if (acc < delay) {
        fr = frames[i];
        frameIdx = i;
        break;
      }
      acc -= delay;
    }

    const src = fr?.src ? String(fr.src) : '';
    const pivotKey = opts.pivot === 'tip' ? 'tip' : 'origin';
    const paintKey = `${src}|${frameIdx}|${pivotKey}`;
    // 同幀不要重設 src／origin：RAF 每幀寫 img.src 會閃；換幀時 origin 先改、圖還沒解完也會閃
    if (img.dataset.damienPaintKey === paintKey) return elapsedMs;

    let ox = Number(fr?.origin?.[0]) || 0;
    let oy = Number(fr?.origin?.[1]) || 0;
    if (opts.pivot === 'tip') {
      // flyingSword 飛行：劍尖約在圖頂，用 tip 當定位／旋轉軸（出生／stand 勿用，否則錨點亂跳）
      oy = Math.min(8, Math.max(0, Math.round(oy * 0.04)));
    }

    const commit = () => {
      if (img.dataset.damienPaintKey !== paintKey && img.dataset.damienPendingKey !== paintKey) return;
      img.dataset.damienPaintKey = paintKey;
      img.dataset.damienPendingKey = '';
      if (src && img.dataset.src !== src) {
        img.dataset.src = src;
        img.src = src;
      }
      img.style.setProperty('--ox', `${ox}px`);
      img.style.setProperty('--oy', `${oy}px`);
    };

    img.dataset.damienPendingKey = paintKey;
    if (!src) {
      commit();
      return elapsedMs;
    }
    if (img.dataset.src === src && img.complete && img.naturalWidth) {
      commit();
      return elapsedMs;
    }
    const cached = typeof EnchantImagePreload !== 'undefined'
      ? EnchantImagePreload.getImage?.(src)
      : null;
    if (cached) {
      commit();
      return elapsedMs;
    }
    const probe = new Image();
    const finish = () => {
      if (img.dataset.damienPendingKey !== paintKey) return;
      commit();
    };
    probe.addEventListener('load', finish, { once: true });
    probe.addEventListener('error', finish, { once: true });
    probe.src = src;
    if (typeof EnchantImagePreload !== 'undefined' && EnchantImagePreload.preload) {
      EnchantImagePreload.preload(src).then(finish).catch(finish);
    }
    return elapsedMs;
  }

  function clearDamienRuntime() {
    if (!fight) return;
    if (fight._damienSwordRaf) {
      cancelAnimationFrame(fight._damienSwordRaf);
      fight._damienSwordRaf = 0;
    }
    if (fight._damienSword2Raf) {
      cancelAnimationFrame(fight._damienSword2Raf);
      fight._damienSword2Raf = 0;
    }
    if (fight._damienFireballRaf) {
      cancelAnimationFrame(fight._damienFireballRaf);
      fight._damienFireballRaf = 0;
    }
    if (fight._damienTornadoRaf) {
      cancelAnimationFrame(fight._damienTornadoRaf);
      fight._damienTornadoRaf = 0;
    }
    if (fight._damienAwRaf) {
      cancelAnimationFrame(fight._damienAwRaf);
      fight._damienAwRaf = 0;
    }
    fight.damienSword = null;
    fight.damienSword2 = null;
    fight.damienCrystals = null;
    fight.damienCrystal = null;
    fight.damienFireballs = null;
    fight.damienTornadoBalls = null;
    fight.damienAwMarkers = null;
    fight.damienBindUntil = 0;
    fight.damienActionStopUntil = 0;
    const field = getBossFieldEl();
    field?.querySelectorAll?.('.idle-boss-damien-fx-stage').forEach((n) => n.remove());
    stage()?.querySelectorAll(
      '.idle-boss-damien-fx-stage, [data-slot^="damienCrystal"], [data-slot="damienSword2"], [data-slot="damienSword2Lock"]',
    ).forEach((n) => n.remove());
    removeSlot('damienCrystal');
  }

  function damienPa() {
    const id = pad(fight?.body?.visualId || '8880100');
    return Math.max(0, Number(wzPart(fight.listId, id)?.PADamage) || 22000);
  }

  function damienHit(ratio, slotKey, opts = {}) {
    const dM = dmgMult(fight.listId);
    const dmg = Math.max(1, Math.floor(scaleWzByHpRatio(damienPa(), ratio, 1) * dM));
    const playerEl = getBossPlayerEl();
    if (playerEl && typeof IdleMobAnim?.playPlayerHit === 'function') {
      IdleMobAnim.playPlayerHit(playerEl, pad(fight.body.visualId), 'stand', { immediate: true });
    }
    hurtPlayerFromBoss(slotKey || 'body', dmg, opts);
  }

  function playerFeetPos() {
    const playerEl = getBossPlayerEl();
    if (!playerEl) return { x: 400, y: 640 };
    return actorStylePos(playerEl);
  }

  function clampDamienSwordPos(x, y, opts = {}) {
    const field = damienFxHost();
    const W = field?.clientWidth || 1366;
    const H = field?.clientHeight || 768;
    // allowOffscreen：突進穿過後可飛出畫面
    const m = opts.allowOffscreen
      ? Math.max(360, Number(opts.margin) || 560)
      : 0;
    return {
      x: Math.max(70 - m, Math.min(W - 70 + m, Number(x) || 0)),
      y: Math.max(110 - m, Math.min(H - 90 + m, Number(y) || 0)),
      W,
      H,
    };
  }

  function damienSwordHeadingDeg(dx, dy) {
    if (!(Math.hypot(dx, dy) > 0.5)) return 0;
    // 預設圖劍尖朝上；atan2(dx, -dy)=0 時朝上
    return Math.atan2(dx, -dy) * (180 / Math.PI);
  }

  function setDamienSwordHeading(el, deg) {
    // 舊介面保留；飛劍改走 syncDamienSwordPose
    if (!el) return;
    const n = Number(deg) || 0;
    el.style.transformOrigin = '0 0';
    el.style.transform = Math.abs(n) < 0.01 ? 'none' : `rotate(${n}deg)`;
  }

  function syncDamienSwordPose(el, x, y, deg) {
    if (!el) return;
    el.style.left = '0px';
    el.style.top = '0px';
    el.style.transformOrigin = '0 0';
    const d = Number(deg) || 0;
    el.style.transform = `translate(${Number(x) || 0}px, ${Number(y) || 0}px) rotate(${d}deg)`;
  }

  /** 飛劍用顯示幀推進（約 60fps），避免戰鬥 tick 100ms + 座標取整造成斜向階梯感 */
  function ensureDamienSwordLoop() {
    if (!fight || fight._damienSwordRaf) return;
    let lastTs = performance.now();
    const loop = (ts) => {
      if (!fight || !isDamien() || fight.phase !== 1 || fight.mode !== 'fight') {
        if (fight) fight._damienSwordRaf = 0;
        return;
      }
      fight._damienSwordRaf = requestAnimationFrame(loop);
      let dt = (ts - lastTs) / 1000;
      lastTs = ts;
      if (!(dt > 0)) return;
      if (dt > 0.05) dt = 0.05;
      tickDamienSword(dt);
    };
    fight._damienSwordRaf = requestAnimationFrame(loop);
  }

  /** 固定速度向量直線飛到 (tx,ty)；飛行中不改航向 */
  function setDamienSwordFlightLeg(sw, tx, ty, speedPx, opts = {}) {
    const end = clampDamienSwordPos(tx, ty, opts);
    const dx = end.x - sw.x;
    const dy = end.y - sw.y;
    const len = Math.hypot(dx, dy);
    if (!(len > 8)) {
      sw.vx = 0;
      sw.vy = 0;
      sw.wx = sw.x;
      sw.wy = sw.y;
      return false;
    }
    const spd = Math.max(40, Number(speedPx) || 240);
    sw.wx = end.x;
    sw.wy = end.y;
    sw.vx = (dx / len) * spd;
    sw.vy = (dy / len) * spd;
    sw.headingDeg = damienSwordHeadingDeg(dx, dy);
    return true;
  }

  function advanceDamienSwordFlight(sw, dtSec) {
    const vx = Number(sw.vx) || 0;
    const vy = Number(sw.vy) || 0;
    if (!(Math.hypot(vx, vy) > 1)) return true;
    const stepX = vx * dtSec;
    const stepY = vy * dtSec;
    const remX = sw.wx - sw.x;
    const remY = sw.wy - sw.y;
    const rem = Math.hypot(remX, remY);
    const step = Math.hypot(stepX, stepY);
    if (rem <= step + 1) {
      sw.x = sw.wx;
      sw.y = sw.wy;
      sw.vx = 0;
      sw.vy = 0;
      return true;
    }
    sw.x += stepX;
    sw.y += stepY;
    // 航向鎖在出發時的向量，直線感更穩
    sw.headingDeg = damienSwordHeadingDeg(vx, vy);
    return false;
  }

  function pickDamienSwordWanderTarget(sw, player, opts = {}) {
    const field = damienFxHost();
    const W = field?.clientWidth || 1366;
    const H = field?.clientHeight || 768;
    const away = !!opts.away;
    // 長直線段：橫跨場地，避免短距抖動
    for (let i = 0; i < 10; i += 1) {
      let ang;
      if (away) {
        ang = Math.atan2(sw.y - player.y, sw.x - player.x) + (Math.random() - 0.5) * 0.9;
      } else {
        ang = Math.random() * Math.PI * 2;
      }
      const dist = 280 + Math.random() * Math.max(200, Math.min(W, H) * 0.45);
      const tx = sw.x + Math.cos(ang) * dist;
      const ty = sw.y + Math.sin(ang) * dist;
      const end = clampDamienSwordPos(tx, ty);
      if (Math.hypot(end.x - sw.x, end.y - sw.y) >= 200) return end;
    }
    // fallback：往場地另一側
    return clampDamienSwordPos(
      player.x + (sw.x >= player.x ? -420 : 420),
      player.y - 80 - Math.random() * 120,
    );
  }

  function beginDamienSwordWanderLeg(sw, player, speedPx, opts) {
    const end = pickDamienSwordWanderTarget(sw, player, opts);
    setDamienSwordFlightLeg(sw, end.x, end.y, speedPx);
  }

  function beginDamienSwordLock(sw, player, cfg, now) {
    sw.mode = 'lock';
    sw.vx = 0;
    sw.vy = 0;
    sw.tx = player.x;
    sw.ty = player.y;
    sw.lockAcc = 0;
    sw.headingDeg = damienSwordHeadingDeg(sw.tx - sw.x, sw.ty - sw.y);
    sw.frameAcc = 0;
    sw.anim = '';
    sw.nextAt = now + scaleDelayMs(Number(cfg.lockMs) || 900);
  }

  function beginDamienSwordDash(sw, cfg) {
    let dx = sw.tx - sw.x;
    let dy = sw.ty - sw.y;
    let len = Math.hypot(dx, dy);
    if (!(len > 48)) {
      const ang = Math.random() * Math.PI * 2;
      const back = clampDamienSwordPos(sw.tx - Math.cos(ang) * 220, sw.ty - Math.sin(ang) * 140);
      sw.x = back.x;
      sw.y = back.y;
      dx = sw.tx - sw.x;
      dy = sw.ty - sw.y;
      len = Math.hypot(dx, dy) || 1;
    }
    const nx = dx / len;
    const ny = dy / len;
    const pierce = Math.max(400, Number(cfg.piercePx) || 560);
    const end = {
      x: sw.tx + nx * pierce,
      y: sw.ty + ny * pierce,
    };
    const dashSpeed = Math.max(120, Number(cfg.dashSpeedPx) || 640);
    setDamienSwordFlightLeg(sw, end.x, end.y, dashSpeed, { allowOffscreen: true, margin: pierce + 80 });
    sw.ex = sw.wx;
    sw.ey = sw.wy;
    sw.hitDone = false;
    sw.frameAcc = 0;
    sw.anim = '';
    sw.mode = 'dash';
  }

  function startDamienSword() {
    if (!fight || !isDamien()) return;
    const boss = hooks?.getBossPos?.() || { x: 720, y: 620 };
    const pos = clampDamienSwordPos(boss.x + 80, boss.y - 40);
    fight.damienSword = {
      mode: 'create',
      x: pos.x,
      y: pos.y,
      wx: pos.x,
      wy: pos.y,
      vx: 0,
      vy: 0,
      tx: pos.x,
      ty: pos.y,
      ex: pos.x,
      ey: pos.y,
      headingDeg: 0,
      frameAcc: 0,
      lockAcc: 0,
      contactAcc: 999,
      hitDone: false,
      dashesLeft: 0,
      nextAt: 0,
      anim: '',
    };
  }

  function tickDamienSword(dt) {
    if (!fight || !isDamien() || fight.phase !== 1 || fight.mode !== 'fight') return;
    if (!fight.damienSword) startDamienSword();
    const sw = fight.damienSword;
    if (!sw) return;
    const cfg = damienKitCfg().sword || {};
    const player = playerFeetPos();
    const now = Date.now();
    const dtSec = Math.max(0, Number(dt) || 0);
    const wanderSpeed = Math.max(120, Number(cfg.wanderSpeedPx) || Number(cfg.hoverSpeedPx) || 280);
    const radius = Math.max(36, Number(cfg.hitRadiusPx) || 68);
    const host = damienFxHost();

    if (!sw.nextAt) {
      const createMs = damienPatternDurationMs(damienPatternFrames('flyingSword', 'create')) || 1200;
      sw.nextAt = now + scaleDelayMs(createMs);
    }

    // —— 狀態轉移 ——
    if (sw.mode === 'create' && now >= sw.nextAt) {
      sw.mode = 'wander';
      sw.frameAcc = 0;
      sw.anim = '';
      sw.nextAt = now + scaleDelayMs((Number(cfg.wanderSec) || Number(cfg.hoverSec) || 6) * 1000);
      beginDamienSwordWanderLeg(sw, player, wanderSpeed);
    } else if (sw.mode === 'wander' && now >= sw.nextAt) {
      const minC = Math.max(1, Math.floor(Number(cfg.dashCountMin) || 3));
      const maxC = Math.max(minC, Math.floor(Number(cfg.dashCountMax) || 4));
      sw.dashesLeft = minC + Math.floor(Math.random() * (maxC - minC + 1));
      beginDamienSwordLock(sw, player, cfg, now);
    } else if (sw.mode === 'lock' && now >= sw.nextAt) {
      beginDamienSwordDash(sw, cfg);
    } else if (sw.mode === 'pause' && now >= sw.nextAt) {
      if ((Number(sw.dashesLeft) || 0) > 0) beginDamienSwordLock(sw, player, cfg, now);
      else {
        sw.mode = 'wander';
        sw.frameAcc = 0;
        sw.anim = '';
        sw.nextAt = now + scaleDelayMs((Number(cfg.wanderSec) || 6) * 1000);
        beginDamienSwordWanderLeg(sw, player, wanderSpeed);
      }
    }

    // —— 移動／攻擊 ——
    if (sw.mode === 'create') {
      sw.headingDeg = 0;
      sw.vx = 0;
      sw.vy = 0;
    } else if (sw.mode === 'wander') {
      const arrived = advanceDamienSwordFlight(sw, dtSec);
      if (arrived) beginDamienSwordWanderLeg(sw, player, wanderSpeed);
      sw.contactAcc = (Number(sw.contactAcc) || 0) + dtSec;
      const dist = Math.hypot(sw.x - player.x, sw.y - player.y);
      const cd = Math.max(0.4, Number(cfg.contactCdSec) || 0.9);
      if (dist <= radius && sw.contactAcc >= cd) {
        sw.contactAcc = 0;
        damienHit(Number(cfg.contactRatio) || 0.15, 'damienSword');
        beginDamienSwordWanderLeg(sw, player, wanderSpeed * 1.15, { away: true });
      }
    } else if (sw.mode === 'lock') {
      sw.vx = 0;
      sw.vy = 0;
      sw.headingDeg = damienSwordHeadingDeg(sw.tx - sw.x, sw.ty - sw.y);
    } else if (sw.mode === 'dash') {
      const arrived = advanceDamienSwordFlight(sw, dtSec);
      if (!sw.hitDone) {
        const dist = Math.hypot(sw.x - player.x, sw.y - player.y);
        const lockDist = Math.hypot(sw.x - sw.tx, sw.y - sw.ty);
        if (dist <= radius || lockDist <= radius * 0.65) {
          sw.hitDone = true;
          damienHit(Number(cfg.dashRatio) || Number(cfg.contactRatio) || 0.15, 'damienSword');
        }
      }
      if (arrived) {
        sw.dashesLeft = Math.max(0, (Number(sw.dashesLeft) || 1) - 1);
        sw.headingDeg = 0;
        sw.vx = 0;
        sw.vy = 0;
        sw.mode = 'pause';
        sw.frameAcc = 0;
        sw.anim = '';
        sw.nextAt = now + scaleDelayMs(Number(cfg.betweenDashMs) || 280);
      }
    } else if (sw.mode === 'pause') {
      sw.headingDeg = 0;
      sw.vx = 0;
      sw.vy = 0;
    }

    let action = 'move';
    if (sw.mode === 'create') action = 'create';
    else if (sw.mode === 'lock' || sw.mode === 'pause') action = 'stand';
    else action = 'move';

    const el = mountDamienFx('damienSword', sw.x, sw.y, 46, { poseTransform: true });
    if (sw.anim !== action) {
      sw.anim = action;
      sw.frameAcc = 0;
    }
    sw.frameAcc = (Number(sw.frameAcc) || 0) + dtSec * 1000;
    // tip pivot 只給飛行（move）；create／stand 用 WZ origin，避免出生／鎖定閃爍
    paintDamienFx(el, damienPatternFrames('flyingSword', action), sw.frameAcc, {
      loop: action !== 'create',
      pivot: action === 'move' ? 'tip' : 'origin',
    });
    syncDamienSwordPose(el, sw.x, sw.y, sw.headingDeg);

    if (sw.mode === 'lock' || sw.mode === 'dash') {
      const lockEl = mountDamienFx('damienSwordLock', sw.tx, sw.ty, 40);
      if (lockEl) lockEl.style.transform = 'none';
      sw.lockAcc = (Number(sw.lockAcc) || 0) + dtSec * 1000;
      const createLock = damienPatternFrames('flyingSword', 'lockon_create');
      const createLockMs = damienPatternDurationMs(createLock);
      const lockAction = (createLock.length && sw.lockAcc < createLockMs) ? 'lockon_create' : 'lockon_loop';
      paintDamienFx(
        lockEl,
        damienPatternFrames('flyingSword', lockAction),
        lockAction === 'lockon_create' ? sw.lockAcc : (sw.lockAcc - createLockMs),
        { loop: lockAction === 'lockon_loop' },
      );
    } else {
      host?.querySelector?.('[data-slot="damienSwordLock"]')?.remove();
    }
    host?.querySelector?.('[data-slot="damienZone"]')?.remove();
  }

  /** P2 小魔劍：同大劍狀態機，sprite＝flyingSword2（lockon 借大劍） */
  function ensureDamienSword2Loop() {
    if (!fight || fight._damienSword2Raf) return;
    let lastTs = performance.now();
    const loop = (ts) => {
      if (!fight || !isDamien() || fight.phase < 2 || fight.mode !== 'fight') {
        if (fight) fight._damienSword2Raf = 0;
        return;
      }
      fight._damienSword2Raf = requestAnimationFrame(loop);
      let dt = (ts - lastTs) / 1000;
      lastTs = ts;
      if (!(dt > 0)) return;
      if (dt > 0.05) dt = 0.05;
      tickDamienSword2(dt);
    };
    fight._damienSword2Raf = requestAnimationFrame(loop);
  }

  function startDamienSword2() {
    if (!fight || !isDamien()) return;
    const boss = hooks?.getBossPos?.() || { x: 720, y: 620 };
    const pos = clampDamienSwordPos(boss.x - 60, boss.y - 60);
    fight.damienSword2 = {
      mode: 'create',
      x: pos.x,
      y: pos.y,
      wx: pos.x,
      wy: pos.y,
      vx: 0,
      vy: 0,
      tx: pos.x,
      ty: pos.y,
      ex: pos.x,
      ey: pos.y,
      headingDeg: 0,
      frameAcc: 0,
      lockAcc: 0,
      contactAcc: 999,
      hitDone: false,
      dashesLeft: 0,
      nextAt: 0,
      anim: '',
    };
  }

  function tickDamienSword2(dt) {
    if (!fight || !isDamien() || fight.phase < 2 || fight.mode !== 'fight') return;
    if (!fight.damienSword2) startDamienSword2();
    const sw = fight.damienSword2;
    if (!sw) return;
    const cfg = damienKitCfg().sword2 || damienKitCfg().sword || {};
    const assetKey = String(cfg.assetKey || 'flyingSword2');
    const lockKey = String(cfg.lockAssetKey || 'flyingSword');
    const player = playerFeetPos();
    const now = Date.now();
    const dtSec = Math.max(0, Number(dt) || 0);
    const wanderSpeed = Math.max(120, Number(cfg.wanderSpeedPx) || 280);
    const radius = Math.max(28, Number(cfg.hitRadiusPx) || 52);
    const host = damienFxHost();

    if (!sw.nextAt) {
      const createMs = damienPatternDurationMs(damienPatternFrames(assetKey, 'create')) || 1200;
      sw.nextAt = now + scaleDelayMs(createMs);
    }

    if (sw.mode === 'create' && now >= sw.nextAt) {
      sw.mode = 'wander';
      sw.frameAcc = 0;
      sw.anim = '';
      sw.nextAt = now + scaleDelayMs((Number(cfg.wanderSec) || 5) * 1000);
      beginDamienSwordWanderLeg(sw, player, wanderSpeed);
    } else if (sw.mode === 'wander' && now >= sw.nextAt) {
      const minC = Math.max(1, Math.floor(Number(cfg.dashCountMin) || 2));
      const maxC = Math.max(minC, Math.floor(Number(cfg.dashCountMax) || 3));
      sw.dashesLeft = minC + Math.floor(Math.random() * (maxC - minC + 1));
      beginDamienSwordLock(sw, player, cfg, now);
    } else if (sw.mode === 'lock' && now >= sw.nextAt) {
      beginDamienSwordDash(sw, cfg);
    } else if (sw.mode === 'pause' && now >= sw.nextAt) {
      if ((Number(sw.dashesLeft) || 0) > 0) beginDamienSwordLock(sw, player, cfg, now);
      else {
        sw.mode = 'wander';
        sw.frameAcc = 0;
        sw.anim = '';
        sw.nextAt = now + scaleDelayMs((Number(cfg.wanderSec) || 5) * 1000);
        beginDamienSwordWanderLeg(sw, player, wanderSpeed);
      }
    }

    if (sw.mode === 'create') {
      sw.headingDeg = 0;
      sw.vx = 0;
      sw.vy = 0;
    } else if (sw.mode === 'wander') {
      const arrived = advanceDamienSwordFlight(sw, dtSec);
      if (arrived) beginDamienSwordWanderLeg(sw, player, wanderSpeed);
      sw.contactAcc = (Number(sw.contactAcc) || 0) + dtSec;
      const dist = Math.hypot(sw.x - player.x, sw.y - player.y);
      const cd = Math.max(0.4, Number(cfg.contactCdSec) || 0.85);
      if (dist <= radius && sw.contactAcc >= cd) {
        sw.contactAcc = 0;
        damienHit(Number(cfg.contactRatio) || 0.15, 'body');
        beginDamienSwordWanderLeg(sw, player, wanderSpeed * 1.15, { away: true });
      }
    } else if (sw.mode === 'lock') {
      sw.vx = 0;
      sw.vy = 0;
      sw.headingDeg = damienSwordHeadingDeg(sw.tx - sw.x, sw.ty - sw.y);
    } else if (sw.mode === 'dash') {
      const arrived = advanceDamienSwordFlight(sw, dtSec);
      if (!sw.hitDone) {
        const dist = Math.hypot(sw.x - player.x, sw.y - player.y);
        const lockDist = Math.hypot(sw.x - sw.tx, sw.y - sw.ty);
        if (dist <= radius || lockDist <= radius * 0.65) {
          sw.hitDone = true;
          damienHit(Number(cfg.dashRatio) || Number(cfg.contactRatio) || 0.15, 'body');
        }
      }
      if (arrived) {
        sw.dashesLeft = Math.max(0, (Number(sw.dashesLeft) || 1) - 1);
        sw.headingDeg = 0;
        sw.vx = 0;
        sw.vy = 0;
        sw.mode = 'pause';
        sw.frameAcc = 0;
        sw.anim = '';
        sw.nextAt = now + scaleDelayMs(Number(cfg.betweenDashMs) || 240);
      }
    } else if (sw.mode === 'pause') {
      sw.headingDeg = 0;
      sw.vx = 0;
      sw.vy = 0;
    }

    let action = 'move';
    if (sw.mode === 'create') action = 'create';
    else if (sw.mode === 'lock' || sw.mode === 'pause') action = 'stand';
    else action = 'move';

    const el = mountDamienFx('damienSword2', sw.x, sw.y, 44, { poseTransform: true });
    if (sw.anim !== action) {
      sw.anim = action;
      sw.frameAcc = 0;
    }
    sw.frameAcc = (Number(sw.frameAcc) || 0) + dtSec * 1000;
    const frames = damienPatternFrames(assetKey, action);
    paintDamienFx(el, frames.length ? frames : damienPatternFrames('flyingSword', action), sw.frameAcc, {
      loop: action !== 'create',
      pivot: action === 'move' ? 'tip' : 'origin',
    });
    syncDamienSwordPose(el, sw.x, sw.y, sw.headingDeg);

    if (sw.mode === 'lock' || sw.mode === 'dash') {
      const lockEl = mountDamienFx('damienSword2Lock', sw.tx, sw.ty, 40);
      if (lockEl) lockEl.style.transform = 'none';
      sw.lockAcc = (Number(sw.lockAcc) || 0) + dtSec * 1000;
      const createLock = damienPatternFrames(lockKey, 'lockon_create');
      const createLockMs = damienPatternDurationMs(createLock);
      const lockAction = (createLock.length && sw.lockAcc < createLockMs) ? 'lockon_create' : 'lockon_loop';
      paintDamienFx(
        lockEl,
        damienPatternFrames(lockKey, lockAction),
        lockAction === 'lockon_create' ? sw.lockAcc : (sw.lockAcc - createLockMs),
        { loop: lockAction === 'lockon_loop' },
      );
    } else {
      host?.querySelector?.('[data-slot="damienSword2Lock"]')?.remove();
    }
  }

  function damienCrystalDesiredCount() {
    const cfg = damienKitCfg().crystal || {};
    const hpR = damienBarRatio();
    let count = Math.max(1, Math.floor(Number(cfg.baseCount) || 1));
    const tiers = Array.isArray(cfg.countAtHpRatio) ? cfg.countAtHpRatio : [];
    tiers.forEach((row) => {
      const thr = Number(row?.hpRatio);
      const n = Math.floor(Number(row?.count) || 0);
      if (Number.isFinite(thr) && hpR <= thr + 1e-9 && n > count) count = n;
    });
    return Math.max(1, Math.min(3, count));
  }

  function damienCrystalRadius() {
    const cfg = damienKitCfg().crystal || {};
    return Math.max(80, Number(cfg.radiusPx) || 160);
  }

  function damienPlayerInCrystalZone() {
    if (!fight || !isDamien() || fight.phase < 2) return false;
    const list = fight.damienCrystals;
    if (!Array.isArray(list) || !list.length) return false;
    const player = playerFeetPos();
    const r = damienCrystalRadius();
    return list.some((c) => c && Math.hypot((c.x || 0) - player.x, (c.y || 0) - player.y) <= r);
  }

  function ensureDamienCrystals() {
    if (!fight || !isDamien() || fight.phase < 2) return;
    const cfg = damienKitCfg().crystal || {};
    const mobId = pad(cfg.mobId || '8880102');
    const want = damienCrystalDesiredCount();
    const player = playerFeetPos();
    const spread = Math.max(40, Number(cfg.spreadPx) || 70);
    if (!Array.isArray(fight.damienCrystals)) fight.damienCrystals = [];
    while (fight.damienCrystals.length < want) {
      const i = fight.damienCrystals.length;
      const ang = (i / Math.max(1, want)) * Math.PI * 2;
      fight.damienCrystals.push({
        id: `damienCrystal_${i}`,
        x: player.x + Math.cos(ang) * (80 + spread * i),
        y: player.y + Math.sin(ang) * 20,
        contactAcc: 0,
        zoneAcc: 0,
      });
    }
    while (fight.damienCrystals.length > want) {
      const dead = fight.damienCrystals.pop();
      if (dead) {
        removeSlot(dead.id);
        stage()?.querySelector(`[data-slot="${dead.id}"]`)?.remove();
        stage()?.querySelector(`[data-slot="${dead.id}_zone"]`)?.remove();
      }
    }
    const st = stage();
    if (!st) return;
    fight.damienCrystals.forEach((c, i) => {
      if (!c) return;
      c.id = `damienCrystal_${i}`;
      let el = slotEl(c.id);
      if (!el) {
        st.insertAdjacentHTML('beforeend', `<div class="idle-actor idle-actor--mob idle-boss-part"
          data-slot="${c.id}" data-uid="${c.id}" data-mob-id="${mobId}"
          style="left:${c.x}px;top:${c.y}px;z-index:18;pointer-events:none">
          <div class="idle-actor-sprite-stage">
            <img class="idle-actor-sprite" alt="" draggable="false">
          </div>
        </div>`);
        el = slotEl(c.id);
        if (el) {
          el.dataset.holdAction = 'move';
          bindVisual(c.id, mobId, 'move');
        }
      }
    });
    // 相容舊單一指標
    fight.damienCrystal = fight.damienCrystals[0] || null;
  }

  function tickDamienCrystal(dt) {
    if (!fight || !isDamien() || fight.phase < 2 || fight.mode !== 'fight') return;
    ensureDamienCrystals();
    const list = fight.damienCrystals;
    if (!Array.isArray(list) || !list.length) return;
    const cfg = damienKitCfg().crystal || {};
    const player = playerFeetPos();
    const hold = Math.max(8, Number(cfg.holdRange) || 50);
    const speed = Math.max(20, Number(cfg.followSpeedPx) || 110);
    const zoneR = damienCrystalRadius();
    const spread = Math.max(40, Number(cfg.spreadPx) || 70);
    list.forEach((c, i) => {
      if (!c) return;
      const el = slotEl(c.id);
      if (!el) return;
      const ang = (i / Math.max(1, list.length)) * Math.PI * 2;
      const tx = player.x + Math.cos(ang) * spread * (0.35 + i * 0.35);
      const ty = player.y + Math.sin(ang) * spread * 0.25;
      const dx = tx - c.x;
      const dy = ty - c.y;
      const dist = Math.hypot(dx, dy);
      if (dist > hold) {
        const step = speed * Math.max(0, Number(dt) || 0);
        const pull = Math.min(step, dist - hold);
        c.x += (dx / Math.max(1, dist)) * pull;
        c.y += (dy / Math.max(1, dist)) * pull;
      }
      setActorStylePos(el, c.x, c.y);
      const toPlayer = Math.hypot(c.x - player.x, c.y - player.y);
      const inZone = toPlayer <= zoneR;
      const zone = mountDamienFx(`${c.id}_zone`, c.x, c.y, 16);
      const zKey = list.length >= 3 ? 'mobZone/3' : (list.length >= 2 ? 'mobZone/2' : 'mobZone/1');
      c.zoneAcc = (Number(c.zoneAcc) || 0) + Math.max(0, Number(dt) || 0) * 1000;
      paintDamienFx(zone, damienPatternFrames(zKey, 'loop'), c.zoneAcc, { loop: true });
      if (inZone) {
        c.contactAcc = (Number(c.contactAcc) || 0) + Math.max(0, Number(dt) || 0);
        if (c.contactAcc >= (Number(cfg.contactCdSec) || 0.9)) {
          c.contactAcc = 0;
          // 藍球接觸：穿透／不給無敵幀，避免擋其他招式出傷
          damienHit(Number(cfg.contactRatio) || 0.15, 'body', {
            ignoreHurtIframe: true,
            skipHurtIframe: true,
          });
        }
      }
    });
  }

  function noteDamienWorldTreeDamage(dmg) {
    if (!fight?.damienWorldTree || !fight.damienWorldTree.active) return;
    // 破條以血條比例計：實際傷害換算成當前階段對應的血條份額
    const { p1: s1, p2: s2 } = damienBarShares();
    const max = Math.max(1, Number(fight.body.maxHp) || 1);
    const phaseMax = ((Number(fight.phase) || 1) <= 1)
      ? Math.max(1, Number(fight.damienP1Max) || 1)
      : Math.max(1, Number(fight.damienP2Max) || 1);
    const share = ((Number(fight.phase) || 1) <= 1) ? s1 : s2;
    const displayDmg = Math.max(0, Number(dmg) || 0) * (max * share) / phaseMax;
    fight.damienWorldTree.dealt = (Number(fight.damienWorldTree.dealt) || 0) + displayDmg;
  }

  async function waitDamienAction(slotKey, mobId, action, seq, fallbackMs = 1200) {
    const el = slotEl(slotKey);
    const id = pad(mobId);
    const cap = scaleDelayMs(mobAnimMs(id, action, fallbackMs) + 200);
    // 傳送／連段：至少撐滿大部分時長，避免 isActorCasting 提早清掉導致邊播邊換位
    const minHold = Math.max(200, Math.floor(cap * 0.88));
    const t0 = Date.now();
    while (Date.now() - t0 < cap) {
      if (seq !== atkFxSeq || !fight || fight.mode !== 'fight') return false;
      if (!IdleMobAnim.isActorCasting?.(el) && Date.now() - t0 >= minHold) break;
      await sleep(TICK_MS);
    }
    return seq === atkFxSeq && !!fight;
  }

  /**
   * 世界樹（P2）：HP≤hpRatio 且 CD 好時觸發。
   * skill8 引導 channelMs：期間玩家必須能打（不可 busy），累積傷害 ≥ breakHp＝成功。
   * 成功→skill9→skillAfter9（期間仍可打）；失敗→attack7＋failRatio 傷玩家。
   * 不可在位移／傳送招（bossActionLock／casting）進行中插入，否則會被 after 動畫打斷。
   */
  async function tryDamienWorldTree() {
    if (!fight || !isDamien() || fight.phase < 2 || busy || fight.mode !== 'fight') return;
    if (fight.damienWorldTree?.active) return;
    // 等位移／傳送／其他招完全結束再開檢定
    if (fight.bossActionLock) return;
    const el = slotEl('body');
    if (el && typeof IdleMobAnim !== 'undefined' && IdleMobAnim.isActorCasting?.(el)) return;

    const cfg = damienKitCfg().worldTree || {};
    const maxHp = Math.max(1, Number(fight.body.maxHp) || 1);
    const hpR = damienBarRatio();
    if (hpR > (Number(cfg.hpRatio) || 0.2)) return;
    if (Date.now() < (Number(fight.damienNextWorldTreeAt) || 0)) return;
    const id = pad(fight.body.visualId);
    if (typeof IdleMobAnim === 'undefined' || !IdleMobAnim.resolveAction?.(id, 'skill8')) return;

    const seq = atkFxSeq;
    // 引導期：只鎖王招，不設 busy（busy 會停 tickPlayer／傷害＝玩家無法破條）
    IdleMobAnim.clearActorCastFlags?.(el);
    fight.bossActionLock = { slotKey: 'body', actionKey: 'skill8' };
    const breakHp = Math.max(1, Math.floor(maxHp * (Number(cfg.breakHpRatio) || 0.08)));
    fight.damienWorldTree = { active: true, dealt: 0, breakHp };

    if (!flashAttack('body', id, 'skill8')) {
      fight.damienWorldTree = null;
      fight.bossActionLock = null;
      return;
    }

    const channelMs = scaleDelayMs(Number(cfg.channelMs) || 10000);
    const start = Date.now();
    while (Date.now() - start < channelMs) {
      if (seq !== atkFxSeq || !fight || fight.mode !== 'fight') {
        if (fight) {
          fight.damienWorldTree = null;
          fight.bossActionLock = null;
        }
        return;
      }
      // 若被其他邏輯清掉 lock／插招，中止檢定避免殘態
      if (!fight.damienWorldTree?.active) return;
      if ((Number(fight.damienWorldTree.dealt) || 0) >= breakHp) break;
      await sleep(TICK_MS);
    }
    if (seq !== atkFxSeq || !fight) {
      if (fight) {
        fight.damienWorldTree = null;
        fight.bossActionLock = null;
      }
      return;
    }

    const ok = (Number(fight.damienWorldTree.dealt) || 0) >= breakHp;
    fight.damienWorldTree.active = false;
    {
      const cdDiff = Number(activeDiff?.patternCdMult) > 0 ? Number(activeDiff.patternCdMult) : 1;
      fight.damienNextWorldTreeAt = Date.now()
        + scaleDelayMs((Number(cfg.cdSec) || 120) * 1000 * cdDiff);
    }

    damienHardStopCast('body');

    if (ok) {
      // 成功：skill9／after9 只鎖王招，不 busy（玩家可持續輸出）
      fight.bossActionLock = { slotKey: 'body', actionKey: 'skill9' };
      if (IdleMobAnim.resolveAction?.(id, 'skill9') && flashAttack('body', id, 'skill9')) {
        if (!(await waitDamienAction('body', id, 'skill9', seq, 5000))) {
          fight.damienWorldTree = null;
          fight.bossActionLock = null;
          return;
        }
      }
      if (seq !== atkFxSeq || !fight) {
        if (fight) {
          fight.damienWorldTree = null;
          fight.bossActionLock = null;
        }
        return;
      }
      damienHardStopCast('body');
      fight.bossActionLock = { slotKey: 'body', actionKey: 'skillAfter9' };
      if (IdleMobAnim.resolveAction?.(id, 'skillAfter9') && flashAttack('body', id, 'skillAfter9')) {
        await waitDamienAction('body', id, 'skillAfter9', seq, 1200);
      } else {
        await sleep(scaleDelayMs(Number(cfg.groggyMs) || 4400));
      }
    } else {
      // 失敗 attack7：busy 擋玩家攻擊／插招
      busy = true;
      fight.bossActionLock = { slotKey: 'body', actionKey: 'attack7' };
      if (IdleMobAnim.resolveAction?.(id, 'attack7') && flashAttack('body', id, 'attack7')) {
        const failDmgFr = Math.max(0, Math.floor(Number(cfg.failDamageFrame) || 11));
        const hitAt = scaleDelayMs(
          Number(IdleMobAnim.actionFrameOffsetMs?.(id, 'attack7', failDmgFr)) || 0,
        );
        const a0 = Date.now();
        let damaged = false;
        const attackMs = scaleDelayMs(mobAnimMs(id, 'attack7', 2200) + 100);
        while (Date.now() - a0 < attackMs) {
          if (seq !== atkFxSeq || !fight || fight.mode !== 'fight') {
            if (fight) {
              fight.damienWorldTree = null;
              fight.bossActionLock = null;
            }
            busy = false;
            return;
          }
          if (!damaged && Date.now() - a0 >= hitAt) {
            damaged = true;
            damienHit(Number(cfg.failRatio) || 2, 'body');
          }
          await sleep(TICK_MS);
        }
        if (!damaged && seq === atkFxSeq && fight) {
          damienHit(Number(cfg.failRatio) || 2, 'body');
        }
      } else {
        damienHit(Number(cfg.failRatio) || 2, 'body');
        await sleep(scaleDelayMs(800));
      }
    }

    if (seq !== atkFxSeq || !fight) {
      if (fight) {
        fight.damienWorldTree = null;
        fight.bossActionLock = null;
      }
      busy = false;
      return;
    }
    bindVisual('body', id, 'stand');
    fight.bossActionLock = null;
    fight.damienWorldTree = null;
    busy = false;
  }

  /** 放置：多點預警同一腳高度，只在 X 軸散開且不重疊；必含玩家腳下 */
  function pickDamienFieldPoints(count, minDist) {
    const field = damienFxHost();
    const W = field?.clientWidth || 1366;
    const player = playerFeetPos();
    const n = Math.max(1, Math.floor(Number(count) || 1));
    const gap = Math.max(80, Number(minDist) || 150);
    const y = player.y;
    const xs = [player.x];
    let guard = 0;
    while (xs.length < n && guard < n * 50) {
      guard += 1;
      const x = 100 + Math.random() * Math.max(80, W - 200);
      if (xs.some((px) => Math.abs(px - x) < gap)) continue;
      xs.push(x);
    }
    while (xs.length < n) {
      const i = xs.length;
      const x = Math.max(100, Math.min(W - 100, player.x + (i - (n - 1) / 2) * gap));
      xs.push(x);
    }
    return xs.slice(0, n).map((x) => ({ x, y }));
  }

  function clearDamienAwMarkers() {
    if (!fight) return;
    if (fight._damienAwRaf) {
      cancelAnimationFrame(fight._damienAwRaf);
      fight._damienAwRaf = 0;
    }
    const list = fight.damienAwMarkers || [];
    const host = damienFxHost();
    list.forEach((m) => {
      host?.querySelector?.(`[data-slot="${m.id}"]`)?.remove();
    });
    fight.damienAwMarkers = null;
  }

  function ensureDamienAwLoop() {
    if (!fight || fight._damienAwRaf) return;
    let lastTs = performance.now();
    const loop = (ts) => {
      if (!fight || !isDamien() || fight.mode !== 'fight') {
        if (fight) fight._damienAwRaf = 0;
        return;
      }
      const list = fight.damienAwMarkers;
      if (!Array.isArray(list) || !list.some((m) => m && !m.done)) {
        fight._damienAwRaf = 0;
        return;
      }
      fight._damienAwRaf = requestAnimationFrame(loop);
      let dt = (ts - lastTs) / 1000;
      lastTs = ts;
      if (!(dt > 0)) return;
      if (dt > 0.05) dt = 0.05;
      tickDamienAwMarkers(dt);
    };
    fight._damienAwRaf = requestAnimationFrame(loop);
  }

  function tickDamienAwMarkers(dtSec) {
    if (!fight || !Array.isArray(fight.damienAwMarkers)) return;
    const host = damienFxHost();
    for (let i = 0; i < fight.damienAwMarkers.length; i += 1) {
      const m = fight.damienAwMarkers[i];
      if (!m || m.done) continue;
      const frames = m.frames || [];
      if (!frames.length) {
        m.done = true;
        host?.querySelector?.(`[data-slot="${m.id}"]`)?.remove();
        continue;
      }
      m.frameAcc = (Number(m.frameAcc) || 0) + dtSec * 1000;
      const dur = damienPatternDurationMs(frames);
      const el = mountDamienFx(m.id, m.x, m.y, 42);
      paintDamienFx(el, frames, m.frameAcc, { loop: false });
      if (m.frameAcc >= dur) {
        m.done = true;
        host?.querySelector?.(`[data-slot="${m.id}"]`)?.remove();
      }
    }
  }

  function spawnDamienAwMarkers(mobId, actionKey, points) {
    if (!fight) return [];
    const frames = damienBossMobFrames(mobId, `${actionKey}/info/areaWarning`);
    if (!frames.length) return [];
    if (!Array.isArray(fight.damienAwMarkers)) fight.damienAwMarkers = [];
    const out = [];
    for (let i = 0; i < points.length; i += 1) {
      const p = points[i];
      const marker = {
        id: `daw_${Date.now()}_${i}_${Math.floor(Math.random() * 1e5)}`,
        x: Number(p.x) || 0,
        y: Number(p.y) || 0,
        frames,
        frameAcc: 0,
        done: false,
      };
      fight.damienAwMarkers.push(marker);
      out.push(marker);
    }
    ensureDamienAwLoop();
    return out;
  }

  function applyDamienActionStop(ms) {
    if (!fight) return;
    const stopMs = scaleDelayMs(Math.max(200, Number(ms) || 2000));
    fight.damienActionStopUntil = Date.now() + stopMs;
    fight.damienBindUntil = fight.damienActionStopUntil;
    try { SkillCombat.invalidateAsyncCasts?.(); } catch (_) { /* ignore */ }
  }

  /** 硬停本體招式狀態，讓下一招 flash 一定進得去 */
  function damienHardStopCast(slotKey) {
    const el = slotEl(slotKey);
    IdleMobAnim.clearActorCastFlags?.(el);
    const bodyImg = IdleMobAnim.actorBodyImg?.(el);
    if (bodyImg) {
      bodyImg.dataset.bodyDone = '1';
      bodyImg.dataset.kindAction = 'stand';
      IdleMobAnim.clearEffect?.(bodyImg);
    }
  }

  /** 隱形中就位；appear 第 0 幀綁好後才退出隱形（避免舊座標／舊圖殘幀） */
  async function damienPlayAppearAt(slotKey, castId, appearKey, dest, seq) {
    const el = slotEl(slotKey);
    const dx = Number(dest?.x) || 0;
    const dy = Number(dest?.y) || 0;
    if (el) {
      el.style.visibility = 'hidden';
      setActorStylePos(el, dx, dy);
    }
    damienHardStopCast(slotKey);
    if (!IdleMobAnim.resolveAction?.(castId, appearKey)) {
      if (el) {
        setActorStylePos(el, dx, dy);
        el.style.visibility = '';
      }
      return seq === atkFxSeq && !!fight;
    }
    fight.bossActionLock = { slotKey, actionKey: appearKey };
    let flashed = flashAttack(slotKey, castId, appearKey);
    if (!flashed) {
      damienHardStopCast(slotKey);
      flashed = flashAttack(slotKey, castId, appearKey);
    }
    if (el) setActorStylePos(el, dx, dy);
    // 仍隱形：等到 appear 圖真正綁上再顯示，避免 stand／skill4 殘幀
    const bodyImg = IdleMobAnim.actorBodyImg?.(el);
    if (flashed && bodyImg) {
      const tBind = Date.now();
      while (Date.now() - tBind < 240) {
        if (seq !== atkFxSeq || !fight) return false;
        if (
          bodyImg.dataset.action === appearKey
          && bodyImg.dataset.src
          && (bodyImg.complete || bodyImg.naturalWidth > 0)
        ) break;
        await sleep(16);
      }
    }
    if (el) {
      setActorStylePos(el, dx, dy);
      el.style.visibility = '';
    }
    if (flashed) {
      const ms = scaleDelayMs(mobAnimMs(castId, appearKey, 900) + 100);
      const t0 = Date.now();
      while (Date.now() - t0 < ms) {
        if (seq !== atkFxSeq || !fight || fight.mode !== 'fight') return false;
        await sleep(TICK_MS);
      }
    } else {
      await sleep(scaleDelayMs(200));
    }
    if (el) el.style.visibility = '';
    return seq === atkFxSeq && !!fight;
  }

  /**
   * skill4＝進隱形 → 隱形中瞬間就位 → after4＝退出隱形出現。
   * 消失本體一結束就隱形，禁止舊座標 stand 回閃一幀。
   */
  async function damienWarpWithSkill4(slotKey, castId, dest, seq) {
    const el = slotEl(slotKey);
    const vanishKey = 'skill4';
    const appearKey = 'skillAfter4';
    damienHardStopCast(slotKey);
    if (IdleMobAnim.resolveAction?.(castId, vanishKey)) {
      fight.bossActionLock = { slotKey, actionKey: vanishKey };
      if (flashAttack(slotKey, castId, vanishKey)) {
        const vanishMs = scaleDelayMs(mobAnimMs(castId, vanishKey, 900) + 100);
        const t0 = Date.now();
        while (Date.now() - t0 < vanishMs) {
          if (seq !== atkFxSeq || !fight || fight.mode !== 'fight') return false;
          const bodyImg = IdleMobAnim.actorBodyImg?.(el);
          // 消失播完／鎖招結束：立刻隱形，並延長 skillUntil 避免 advance 切 stand
          if (el && (bodyImg?.dataset?.bodyDone === '1' || !IdleMobAnim.isActorCasting?.(el))) {
            el.style.visibility = 'hidden';
            el.dataset.skillUntil = String(Date.now() + 400);
          }
          await sleep(TICK_MS);
        }
      } else {
        if (el) el.style.visibility = 'hidden';
        await sleep(scaleDelayMs(200));
      }
    } else {
      if (el) el.style.visibility = 'hidden';
      await sleep(scaleDelayMs(160));
    }
    if (seq !== atkFxSeq || !fight) return false;
    if (el) el.style.visibility = 'hidden';
    return damienPlayAppearAt(slotKey, castId, appearKey, dest, seq);
  }

  /** attack1/info/effect 拖尾全長（有圖寬用整寬；否則用 origin.x） */
  function damienEffectTrailLengthPx(castId, bodyAction) {
    const fxKey = (typeof IdleMobAnim !== 'undefined' && IdleMobAnim.effectActionFor)
      ? IdleMobAnim.effectActionFor(castId, bodyAction)
      : `${bodyAction}/info/effect`;
    if (!fxKey) return 640;
    const frames = damienBossMobFrames(castId, fxKey);
    let best = 0;
    for (let i = 0; i < frames.length; i += 1) {
      const fr = frames[i];
      if (!fr) continue;
      const ox = Math.max(0, Number(fr.origin?.[0]) || 0);
      let w = 0;
      const src = fr.src ? String(fr.src) : '';
      if (src && typeof EnchantImagePreload !== 'undefined') {
        const img = EnchantImagePreload.getImage?.(src);
        if (img?.naturalWidth) w = img.naturalWidth;
      }
      const len = w > 0 ? w : Math.max(ox, 480);
      if (len > best) best = len;
    }
    return Math.max(400, Math.round(best || 640));
  }

  async function runDamienCast(slotKey, unit, atk) {
    if (!fight || !unit || !atk?.damienCast) return;
    const kind = String(atk.damienCast);
    const kit = damienKitCfg();
    const dM = dmgMult(fight.listId);
    const seq = atkFxSeq;
    const castId = pad(atk.flashMob || unit.visualId);
    const key = atk.actionKey;
    const playerEl = getBossPlayerEl();
    // 僅 skill3：先瞬移到玩家再播本體；attack1 在原地蓄力／衝刺
    const needsWarpFirst = kind === 'diveAfterOnPlayer';
    fight.bossActionLock = { slotKey, actionKey: key };
    const unlock = () => {
      if (fight?.bossActionLock?.slotKey === slotKey) {
        fight.bossActionLock = null;
      }
    };
    // 需先 skill4 瞬移的招：不要先播本體技能
    if (!needsWarpFirst) {
      if (!flashAttack(slotKey, castId, key)) {
        unlock();
        return;
      }
    }
    const waitCast = async () => {
      const cap = scaleDelayMs(mobAnimMs(castId, key, 1800) + 200);
      const t0 = Date.now();
      const el = slotEl(slotKey);
      while (Date.now() - t0 < cap) {
        if (seq !== atkFxSeq || !fight || fight.mode !== 'fight') return false;
        if (!IdleMobAnim.isActorCasting?.(el)) break;
        await sleep(TICK_MS);
      }
      return seq === atkFxSeq && !!fight;
    };

    if (kind === 'meteor') {
      // skill5 自帶瞬移：0～appear-1 原地；appear 到玩家頭上；hide 離場；return 回原位
      const mCfg = kit.meteor || {};
      const el = slotEl(slotKey);
      const home = el ? actorStylePos(el) : (hooks?.getBossPos?.() || { x: 700, y: 600 });
      const appearFr = Math.max(0, Math.floor(Number(mCfg.appearFrame) || 10));
      const hideFr = Math.max(appearFr + 1, Math.floor(Number(mCfg.hideFrame) || 100));
      const returnFr = Math.max(hideFr + 1, Math.floor(Number(mCfg.returnFrame) || 101));
      const headOff = Number.isFinite(Number(mCfg.headYOffset)) ? Number(mCfg.headYOffset) : -140;
      const appearRaw = Math.max(0, Number(IdleMobAnim.actionFrameOffsetMs?.(castId, key, appearFr)) || 0);
      const hideRaw = Math.max(
        appearRaw + 400,
        Number(IdleMobAnim.actionFrameOffsetMs?.(castId, key, hideFr)) || appearRaw + 2000,
      );
      const returnRaw = Math.max(
        hideRaw + 40,
        Number(IdleMobAnim.actionFrameOffsetMs?.(castId, key, returnFr)) || hideRaw + 90,
      );
      const appearAt = scaleDelayMs(appearRaw);
      const hideAt = scaleDelayMs(hideRaw);
      const returnAt = scaleDelayMs(returnRaw);
      const castStart = Date.now();
      const restoreHome = () => {
        if (!el) return;
        el.style.visibility = '';
        setActorStylePos(el, home.x, home.y);
      };
      // 0～appear-1：原地
      while (Date.now() - castStart < appearAt) {
        if (seq !== atkFxSeq || !fight || fight.mode !== 'fight') {
          restoreHome();
          unlock();
          return;
        }
        await sleep(TICK_MS);
      }
      if (seq !== atkFxSeq || !fight || fight.mode !== 'fight') {
        restoreHome();
        unlock();
        return;
      }
      // 第 appear 幀：先就位到玩家頭上，再繼續播（禁止邊播邊滑）
      const player = playerFeetPos();
      if (el) {
        el.style.visibility = 'hidden';
        setActorStylePos(el, player.x, Math.max(80, player.y + headOff));
        el.style.visibility = '';
      }
      const aerialWin = {
        startMs: 0,
        endMs: Math.max(400, hideRaw - appearRaw),
        castMs: mobAnimMs(castId, key, 2000),
      };
      await runDamienMeteorBarrage(slotKey, seq, aerialWin, { skipWaitAlive: true });
      while (Date.now() - castStart < hideAt) {
        if (seq !== atkFxSeq || !fight || fight.mode !== 'fight') {
          restoreHome();
          unlock();
          return;
        }
        await sleep(TICK_MS);
      }
      // 第 hide 幀：離場
      if (el) el.style.visibility = 'hidden';
      while (Date.now() - castStart < returnAt) {
        if (seq !== atkFxSeq || !fight || fight.mode !== 'fight') {
          restoreHome();
          unlock();
          return;
        }
        await sleep(TICK_MS);
      }
      // 第 return 幀：已就位回原點再顯示
      if (el) {
        setActorStylePos(el, home.x, home.y);
        el.style.visibility = '';
      }
      const castMs = scaleDelayMs(mobAnimMs(castId, key, 2000) + 200);
      while (Date.now() - castStart < castMs) {
        if (seq !== atkFxSeq || !fight || fight.mode !== 'fight') break;
        if (!IdleMobAnim.isActorCasting?.(el) && Date.now() - castStart > returnAt) break;
        await sleep(TICK_MS);
      }
      if (seq === atkFxSeq && fight) {
        restoreHome();
        bindVisual(slotKey, castId, 'stand');
      }
      unlock();
      return;
    }

    if (kind === 'multiAreaWarn' || kind === 'bind') {
      const zoneCfg = kind === 'bind'
        ? (kit.bindZones || {})
        : (kit.multiAreaWarn || {});
      const count = Math.max(1, Math.floor(Number(zoneCfg.count) || 5));
      const minDist = Math.max(80, Number(zoneCfg.minDistPx) || 150);
      const points = pickDamienFieldPoints(count, minDist);
      const markers = spawnDamienAwMarkers(castId, key, points);
      const awAction = `${key}/info/areaWarning`;
      const awFrames = markers[0]?.frames || [];
      const awMs = damienPatternDurationMs(awFrames);
      const awDmgFr = Number(zoneCfg.awDamageFrame);
      let hitAt;
      if (Number.isFinite(awDmgFr) && awDmgFr >= 0) {
        const fromAnim = Number(IdleMobAnim.actionFrameOffsetMs?.(castId, awAction, awDmgFr));
        if (Number.isFinite(fromAnim) && fromAnim > 0) {
          hitAt = scaleDelayMs(fromAnim);
        } else {
          let acc = 0;
          const n = Math.min(awFrames.length, Math.floor(awDmgFr));
          for (let i = 0; i < n; i += 1) {
            acc += Math.max(1, Number(awFrames[i]?.delay) || 90);
          }
          hitAt = scaleDelayMs(Math.max(200, acc));
        }
      } else {
        hitAt = scaleDelayMs(Math.max(400, awMs || Number(IdleMobAnim.attackAfterMs?.(castId, key)) || 1200));
      }
      const bodyMs = scaleDelayMs(mobAnimMs(castId, key, 1200));
      const totalWait = Math.max(hitAt, scaleDelayMs(awMs), bodyMs);
      const t0 = Date.now();
      let damaged = false;
      while (Date.now() - t0 < totalWait + 80) {
        if (seq !== atkFxSeq || !fight || fight.mode !== 'fight') {
          clearDamienAwMarkers();
          unlock();
          return;
        }
        if (!damaged && Date.now() - t0 >= hitAt) {
          damaged = true;
          const hitDmg = Math.max(0, Math.floor((Number(atk.dmg) || 0) * dM));
          if (hitDmg > 0) {
            if (playerEl && typeof IdleMobAnim?.playPlayerHit === 'function') {
              IdleMobAnim.playPlayerHit(playerEl, castId, key, { immediate: true });
            }
            hurtPlayerFromBoss(slotKey, hitDmg);
          }
          if (kind === 'bind') {
            applyDamienActionStop(Number(zoneCfg.stopMs) || Number(kit.bindMs) || 2000);
          }
        }
        await sleep(TICK_MS);
      }
      clearDamienAwMarkers();
      if (seq === atkFxSeq && fight) bindVisual(slotKey, castId, 'stand');
      unlock();
      return;
    }

    // P2 attack1：0～4 抬手續力；5～8 衝刺（effect 與第 5 幀同步起播）；
    // 第 9 幀起已在終點收刀（9～13）；播完 skill4→瞬間回 home→after4
    if (kind === 'rushReturn') {
      const el = slotEl(slotKey);
      const bodyImg = (typeof IdleMobAnim !== 'undefined' && IdleMobAnim.actorBodyImg)
        ? IdleMobAnim.actorBodyImg(el)
        : el?.querySelector?.('img');
      const home = el ? actorStylePos(el) : (hooks?.getBossPos?.() || { x: 700, y: 600 });
      const player = playerFeetPos();
      const rushDir = (player.x < home.x) ? -1 : 1;
      if (el) el.classList.toggle('is-flip-x', rushDir > 0);
      const trailPx = damienEffectTrailLengthPx(castId, key);
      const field = damienFxHost();
      const W = field?.clientWidth || 1366;
      const endX = Math.max(80, Math.min(W - 80, home.x + rushDir * trailPx));
      const endY = home.y;
      const rushStartRaw = Math.max(
        0,
        Number(IdleMobAnim.actionFrameOffsetMs?.(castId, key, 5)) || 600,
      );
      const rushDoneRaw = Math.max(
        rushStartRaw + 1,
        Number(IdleMobAnim.actionFrameOffsetMs?.(castId, key, 9)) || (rushStartRaw + 480),
      );
      const castMs = scaleDelayMs(mobAnimMs(castId, key, 1650) + 200);
      const rushStartAt = scaleDelayMs(rushStartRaw);
      const rushDoneAt = scaleDelayMs(rushDoneRaw);
      const hitAt = scaleDelayMs(
        Number(IdleMobAnim.actionFrameOffsetMs?.(castId, key, 6))
          || (rushStartRaw + 120),
      );
      // bind 會立刻 startEffect；改為第 5 幀才跟衝刺同步起播
      IdleMobAnim.clearEffect?.(bodyImg);
      const t0 = Date.now();
      let damaged = false;
      let effectStarted = false;
      // 衝刺段用細步进，避免关掉 left transition 後每 100ms 跳格一卡一卡
      const RUSH_STEP_MS = 16;
      while (Date.now() - t0 < castMs) {
        if (seq !== atkFxSeq || !fight || fight.mode !== 'fight') {
          if (el) {
            el.classList.remove('is-flip-x');
            setActorStylePos(el, home.x, home.y);
          }
          unlock();
          return;
        }
        const elapsed = Date.now() - t0;
        if (!effectStarted && elapsed >= rushStartAt) {
          effectStarted = true;
          IdleMobAnim.startEffect?.(bodyImg, castId, key);
        }
        if (el) {
          if (elapsed < rushStartAt) {
            setActorStylePos(el, home.x, home.y);
          } else if (elapsed >= rushDoneAt) {
            setActorStylePos(el, endX, endY);
          } else {
            const span = Math.max(1, rushDoneAt - rushStartAt);
            const t = Math.min(1, (elapsed - rushStartAt) / span);
            setActorStylePos(
              el,
              home.x + (endX - home.x) * t,
              home.y + (endY - home.y) * t,
            );
          }
        }
        if (!damaged && elapsed >= hitAt) {
          damaged = true;
          const hitDmg = Math.max(0, Math.floor((Number(atk.dmg) || 0) * dM));
          if (hitDmg > 0) {
            if (playerEl && typeof IdleMobAnim?.playPlayerHit === 'function') {
              IdleMobAnim.playPlayerHit(playerEl, castId, key, { immediate: true });
            }
            hurtPlayerFromBoss(slotKey, hitDmg);
          }
        }
        const inRush = elapsed >= rushStartAt && elapsed < rushDoneAt;
        await sleep(inRush ? RUSH_STEP_MS : TICK_MS);
      }
      if (el) {
        el.classList.remove('is-flip-x');
        setActorStylePos(el, endX, endY);
      }
      // skill4 消失播滿 → 隱藏就位 home → 再播 after4（不邊播邊動）
      if (!(await damienWarpWithSkill4(slotKey, castId, home, seq))) {
        if (el) {
          setActorStylePos(el, home.x, home.y);
          el.style.visibility = '';
        }
      }
      if (el) {
        el.classList.remove('is-flip-x');
        el.style.visibility = '';
      }
      if (seq === atkFxSeq && fight) bindVisual(slotKey, castId, 'stand');
      unlock();
      return;
    }

    // P2 skill2：0～9 原地消失 → 隱藏就位到玩家旁 → 再播 11～47 斬擊結算
    // → 隱藏就位回 home → 再播 skillAfter2（禁止邊播邊動）
    if (kind === 'displaceAfterReturn') {
      const el = slotEl(slotKey);
      const home = el ? actorStylePos(el) : (hooks?.getBossPos?.() || { x: 700, y: 600 });
      const player = playerFeetPos();
      const dest = {
        x: player.x + (home.x >= player.x ? 90 : -90),
        y: player.y,
      };
      // 0～9 消失段結束（第 11 幀起為斬擊；第 10 幀缺圖）
      const vanishDoneRaw = Math.max(
        0,
        Number(IdleMobAnim.actionFrameOffsetMs?.(castId, key, 11)) || 900,
      );
      const settleDoneRaw = Math.max(
        vanishDoneRaw + 1,
        Number(IdleMobAnim.actionFrameOffsetMs?.(castId, key, 48)) || 4230,
      );
      const slashSegRaw = Math.max(200, settleDoneRaw - vanishDoneRaw);
      const vanishDoneAt = scaleDelayMs(vanishDoneRaw);
      const slashSegMs = scaleDelayMs(slashSegRaw);
      const hitAt = scaleDelayMs(90);
      // 1) 原地播消失至第 9 幀結束；到點立刻隱形，避免舊位殘一幀
      const tVanish = Date.now();
      while (Date.now() - tVanish < vanishDoneAt) {
        if (seq !== atkFxSeq || !fight || fight.mode !== 'fight') {
          if (el) {
            el.style.visibility = '';
            setActorStylePos(el, home.x, home.y);
          }
          unlock();
          return;
        }
        await sleep(TICK_MS);
      }
      if (el) el.style.visibility = 'hidden';
      // 2) 隱形中就位 → 綁斬擊第 11 幀 → 再顯示
      if (el) setActorStylePos(el, dest.x, dest.y);
      damienHardStopCast(slotKey);
      fight.bossActionLock = { slotKey, actionKey: key };
      let slashFlashed = flashAttack(slotKey, castId, key, { startFrame: 11 });
      if (!slashFlashed) {
        damienHardStopCast(slotKey);
        slashFlashed = flashAttack(slotKey, castId, key, { startFrame: 11 });
      }
      if (!slashFlashed) {
        if (el) {
          setActorStylePos(el, home.x, home.y);
          el.style.visibility = '';
        }
        unlock();
        return;
      }
      if (el) {
        setActorStylePos(el, dest.x, dest.y);
        const bodyImg = IdleMobAnim.actorBodyImg?.(el);
        const tBind = Date.now();
        while (bodyImg && Date.now() - tBind < 240) {
          if (seq !== atkFxSeq || !fight) {
            unlock();
            return;
          }
          if (
            bodyImg.dataset.action === key
            && Number(bodyImg.dataset.frame) >= 11
            && bodyImg.dataset.src
            && (bodyImg.complete || bodyImg.naturalWidth > 0)
          ) break;
          await sleep(16);
        }
        el.style.visibility = '';
      }
      const tSlash = Date.now();
      let damaged = false;
      while (Date.now() - tSlash < slashSegMs) {
        if (seq !== atkFxSeq || !fight || fight.mode !== 'fight') {
          if (el) {
            el.style.visibility = '';
            setActorStylePos(el, home.x, home.y);
          }
          unlock();
          return;
        }
        if (!damaged && Date.now() - tSlash >= hitAt) {
          damaged = true;
          const hitDmg = Math.max(0, Math.floor((Number(atk.dmg) || 0) * dM));
          if (hitDmg > 0) {
            if (playerEl && typeof IdleMobAnim?.playPlayerHit === 'function') {
              IdleMobAnim.playPlayerHit(playerEl, castId, key, { immediate: true });
            }
            hurtPlayerFromBoss(slotKey, hitDmg);
          }
        }
        await sleep(TICK_MS);
      }
      // 3) 隱形 → 就位 home → after2（避免斬擊點殘一幀）
      if (el) el.style.visibility = 'hidden';
      if (!(await damienPlayAppearAt(slotKey, castId, 'skillAfter2', home, seq))) {
        if (el) {
          setActorStylePos(el, home.x, home.y);
          el.style.visibility = '';
        }
      }
      if (el) {
        setActorStylePos(el, home.x, home.y);
        el.style.visibility = '';
      }
      if (seq === atkFxSeq && fight) bindVisual(slotKey, castId, 'stand');
      unlock();
      return;
    }

    // P2 skill3：skill4 瞬移到玩家（先就位再 after4）→ skill3 → skillAfter3（已在玩家身）→ skill4 回原位
    if (kind === 'diveAfterOnPlayer') {
      const el = slotEl(slotKey);
      const home = el ? actorStylePos(el) : (hooks?.getBossPos?.() || { x: 700, y: 600 });
      const player = playerFeetPos();
      const dest = { x: player.x, y: Math.max(120, player.y - 40) };
      const restore = () => {
        if (!el) return;
        el.style.visibility = '';
        el.classList.remove('is-flip-x');
        setActorStylePos(el, home.x, home.y);
      };
      if (!(await damienWarpWithSkill4(slotKey, castId, dest, seq))) {
        restore();
        unlock();
        return;
      }
      // 已在玩家身，再播 skill3
      damienHardStopCast(slotKey);
      fight.bossActionLock = { slotKey, actionKey: key };
      if (!flashAttack(slotKey, castId, key)) {
        await damienWarpWithSkill4(slotKey, castId, home, seq);
        restore();
        unlock();
        return;
      }
      const castOk = await waitCast();
      if (!castOk) {
        await damienWarpWithSkill4(slotKey, castId, home, seq);
        restore();
        unlock();
        return;
      }
      // after3：座標已在玩家身，禁止改位
      damienHardStopCast(slotKey);
      const after = 'skillAfter3';
      if (IdleMobAnim.resolveAction?.(castId, after) && flashAttack(slotKey, castId, after)) {
        const afterMs = scaleDelayMs(mobAnimMs(castId, after, 1200) + 120);
        const hitDmg = Math.max(0, Math.floor((Number(atk.dmg) || 0) * dM));
        const hitAt = scaleDelayMs(
          Number(IdleMobAnim.actionFrameOffsetMs?.(castId, after, 2)) || Math.floor(afterMs * 0.25),
        );
        const a0 = Date.now();
        let damaged = false;
        while (Date.now() - a0 < afterMs) {
          if (seq !== atkFxSeq || !fight || fight.mode !== 'fight') {
            restore();
            unlock();
            return;
          }
          if (!damaged && Date.now() - a0 >= hitAt && hitDmg > 0) {
            damaged = true;
            if (playerEl && typeof IdleMobAnim?.playPlayerHit === 'function') {
              IdleMobAnim.playPlayerHit(playerEl, castId, after, { immediate: true });
            }
            hurtPlayerFromBoss(slotKey, hitDmg);
          }
          await sleep(TICK_MS);
        }
      } else {
        const hitDmg = Math.max(0, Math.floor((Number(atk.dmg) || 0) * dM));
        if (hitDmg > 0) hurtPlayerFromBoss(slotKey, hitDmg);
      }
      if (!(await damienWarpWithSkill4(slotKey, castId, home, seq))) {
        restore();
      }
      if (el) {
        el.style.visibility = '';
        setActorStylePos(el, home.x, home.y);
      }
      if (seq === atkFxSeq && fight) bindVisual(slotKey, castId, 'stand');
      unlock();
      return;
    }

    // P2 attack3：本體龍捲期間持續發射火球（上下兩排×左右），不限固定波數
    if (kind === 'tornadoBall') {
      const tCfg = kit.tornadoBall || {};
      const startDelay = scaleDelayMs(Number(tCfg.startDelayMs) || 720);
      const gap = scaleDelayMs(Math.max(80, Number(tCfg.waveGapMs) || 420));
      const castMs = scaleDelayMs(mobAnimMs(castId, key, 3690) + 200);
      // 動畫結束前持續發；可選 waveEndMs／endPaddingMs 提早停
      const endPad = scaleDelayMs(Math.max(0, Number(tCfg.endPaddingMs) || 200));
      const fireUntil = Math.max(startDelay + gap, castMs - endPad);
      const t0 = Date.now();
      let wave = 0;
      while (Date.now() - t0 < castMs) {
        if (seq !== atkFxSeq || !fight || fight.mode !== 'fight') {
          unlock();
          return;
        }
        const elapsed = Date.now() - t0;
        while (startDelay + wave * gap < fireUntil && elapsed >= startDelay + wave * gap) {
          spawnDamienTornadoBall(slotKey, tCfg, { row: 0, goLeft: true });
          spawnDamienTornadoBall(slotKey, tCfg, { row: 0, goLeft: false });
          spawnDamienTornadoBall(slotKey, tCfg, { row: 1, goLeft: true });
          spawnDamienTornadoBall(slotKey, tCfg, { row: 1, goLeft: false });
          wave += 1;
        }
        await sleep(TICK_MS);
      }
      if (seq === atkFxSeq && fight) bindVisual(slotKey, castId, 'stand');
      unlock();
      return;
    }

    const ok = await waitCast();
    if (!ok) {
      unlock();
      return;
    }
    if (seq === atkFxSeq && fight) bindVisual(slotKey, castId, 'stand');
    unlock();
  }

  /**
   * 龍捲火球：以本體腳點為中心，上下兩排朝左右水平射出（不追玩家）。
   * row0＝上排、row1＝下排；goLeft＝向左飛。
   */
  function spawnDamienTornadoBall(slotKey, cfg, opts = {}) {
    if (!fight) return;
    const bodyEl = slotEl(slotKey) || slotEl('body');
    const feet = bodyEl ? actorStylePos(bodyEl) : (hooks?.getBossPos?.() || { x: 700, y: 600 });
    const field = damienFxHost();
    const W = field?.clientWidth || 1366;
    const speed = Math.max(80, Number(cfg.speedPx) || 520);
    const row = Math.max(0, Math.floor(Number(opts.row) || 0));
    const leftward = !!opts.goLeft;
    const topOff = Number.isFinite(Number(cfg.topYOffset)) ? Number(cfg.topYOffset) : -220;
    const botOff = Number.isFinite(Number(cfg.bottomYOffset)) ? Number(cfg.bottomYOffset) : -36;
    const y = row <= 0 ? feet.y + topOff : feet.y + botOff;
    const spawnGap = Math.max(0, Number(cfg.spawnGapPx) || 24);
    const x = feet.x + (leftward ? -spawnGap : spawnGap);
    const vx = leftward ? -speed : speed;
    if (!Array.isArray(fight.damienTornadoBalls)) fight.damienTornadoBalls = [];
    fight.damienTornadoBalls.push({
      id: `tb_${Date.now()}_${row}_${leftward ? 'L' : 'R'}_${Math.floor(Math.random() * 1e5)}`,
      slotKey,
      x,
      y,
      vx,
      vy: 0,
      frameAcc: 0,
      hitDone: false,
      done: false,
      hitRatio: Number(cfg.hitRatio) > 0 ? Number(cfg.hitRatio) : 0.6,
      hitRadiusPx: Math.max(24, Number(cfg.hitRadiusPx) || 56),
      fieldW: W,
    });
    ensureDamienTornadoLoop();
  }

  function ensureDamienTornadoLoop() {
    if (!fight || fight._damienTornadoRaf) return;
    let lastTs = performance.now();
    const loop = (ts) => {
      if (!fight || !isDamien() || fight.mode !== 'fight') {
        if (fight) fight._damienTornadoRaf = 0;
        return;
      }
      const list = fight.damienTornadoBalls;
      if (!Array.isArray(list) || !list.some((b) => b && !b.done)) {
        fight._damienTornadoRaf = 0;
        return;
      }
      fight._damienTornadoRaf = requestAnimationFrame(loop);
      let dt = (ts - lastTs) / 1000;
      lastTs = ts;
      if (!(dt > 0)) return;
      if (dt > 0.05) dt = 0.05;
      tickDamienTornadoBalls(dt);
    };
    fight._damienTornadoRaf = requestAnimationFrame(loop);
  }

  function tickDamienTornadoBalls(dtSec) {
    if (!fight || !Array.isArray(fight.damienTornadoBalls)) return;
    const player = playerFeetPos();
    const field = damienFxHost();
    const W = field?.clientWidth || 1366;
    const castId = pad(fight.body?.visualId || '8880101');
    const flyFrames = damienBossMobFrames(castId, 'attack3/info/ball');
    const hitFrames = damienBossMobFrames(castId, 'attack3/info/hit');

    for (let i = 0; i < fight.damienTornadoBalls.length; i += 1) {
      const ball = fight.damienTornadoBalls[i];
      if (!ball || ball.done) continue;
      // 一般 left/top 錨點（勿用飛劍 poseTransform，避免座標錯位）
      const el = mountDamienFx(ball.id, ball.x, ball.y, 46);
      if (ball.mode === 'hit') {
        ball.frameAcc = (Number(ball.frameAcc) || 0) + dtSec * 1000;
        paintDamienFx(el, hitFrames.length ? hitFrames : flyFrames, ball.frameAcc, { loop: false });
        if (el) {
          el.style.left = `${Math.round(ball.x)}px`;
          el.style.top = `${Math.round(ball.y)}px`;
          el.style.transform = 'none';
        }
        const dur = damienPatternDurationMs(hitFrames.length ? hitFrames : flyFrames) || 400;
        if (ball.frameAcc >= dur) {
          ball.done = true;
          el?.remove();
        }
        continue;
      }
      ball.x += (Number(ball.vx) || 0) * dtSec;
      ball.frameAcc = (Number(ball.frameAcc) || 0) + dtSec * 1000;
      paintDamienFx(el, flyFrames, ball.frameAcc, { loop: true });
      if (el) {
        el.style.left = `${Math.round(ball.x)}px`;
        el.style.top = `${Math.round(ball.y)}px`;
        el.style.transform = 'none';
      }
      const radius = Math.max(24, Number(ball.hitRadiusPx) || 56);
      // 放置玩家幾乎不動：水平靠近且同高帶即可出傷
      const nearX = Math.abs(ball.x - player.x) <= radius;
      const nearY = Math.abs(ball.y - player.y) <= Math.max(radius * 1.8, 90);
      if (!ball.hitDone && nearX && nearY) {
        ball.hitDone = true;
        damienHit(Number(ball.hitRatio) || 0.6, ball.slotKey || 'body');
        ball.mode = 'hit';
        ball.frameAcc = 0;
        continue;
      }
      if (ball.x < -120 || ball.x > W + 120) {
        ball.done = true;
        el?.remove();
      }
    }
    fight.damienTornadoBalls = fight.damienTornadoBalls.filter((b) => b && !b.done);
  }

  function damienBossMobFrames(mobId, action) {
    const id = pad(mobId);
    const root = typeof IDLE_BOSS_MOB_DATA !== 'undefined' ? IDLE_BOSS_MOB_DATA : {};
    const frames = root?.[id]?.[action];
    if (!Array.isArray(frames)) return [];
    return frames.filter((f) => f && f.src);
  }

  /** skill2 飛起後本體腳點不變，畫面位置靠 origin；回傳目前幀精靈中心場座標 */
  function damienBossVisualPos(slotKey) {
    const bodyEl = slotEl('body') || slotEl(slotKey);
    const feet = bodyEl ? actorStylePos(bodyEl) : (hooks?.getBossPos?.() || { x: 700, y: 600 });
    if (!bodyEl) return feet;
    const img = (typeof IdleMobAnim !== 'undefined' && IdleMobAnim.actorBodyImg)
      ? IdleMobAnim.actorBodyImg(bodyEl)
      : bodyEl.querySelector('img');
    if (!img) return feet;
    const w = img.naturalWidth || img.width || 0;
    const h = img.naturalHeight || img.height || 0;
    const ox = parseFloat(img.style.getPropertyValue('--ox')) || 0;
    const oy = parseFloat(img.style.getPropertyValue('--oy')) || 0;
    if (!(w > 0 && h > 0)) return feet;
    return {
      x: feet.x + w * 0.5 - ox,
      y: feet.y + h * 0.5 - oy,
    };
  }

  function spawnDamienMeteorWave(slotKey, cfg) {
    if (!fight) return;
    const perWave = Math.max(1, Math.floor(Number(cfg.perWave) || 5));
    const boss = damienBossVisualPos(slotKey);
    const field = damienFxHost();
    const H = field?.clientHeight || 768;
    // 本體可能瞬移在玩家腳點；地板仍用場地底部
    const floorY = H - 80;
    const fanDeg = Math.max(10, Number(cfg.fanDeg) || 100);
    const half = fanDeg / 2;
    const speed = Math.max(80, Number(cfg.speedPx) || 420);
    const mobId = pad(cfg.mobId || '9601026');
    const stackHold = scaleDelayMs(Number(cfg.stackHoldMs) || 320);
    const spread = Math.max(6, Number(cfg.stackSpreadPx) || 22);
    const bodyYOff = Number.isFinite(Number(cfg.bodyYOffset)) ? Number(cfg.bodyYOffset) : 0;
    const now = Date.now();
    if (!Array.isArray(fight.damienFireballs)) fight.damienFireballs = [];

    for (let i = 0; i < perWave; i += 1) {
      const t = perWave <= 1 ? 0.5 : i / (perWave - 1);
      const angDeg = -half + t * fanDeg;
      const ang = (angDeg * Math.PI) / 180;
      const vx = Math.sin(ang) * speed;
      const vy = Math.cos(ang) * speed;
      const ox = Math.sin(ang) * spread * (0.35 + t * 0.65);
      const oy = bodyYOff + Math.cos(ang) * spread * 0.35 - i * 3;
      fight.damienFireballs.push({
        id: `fb_${Date.now()}_${i}_${Math.floor(Math.random() * 1e5)}`,
        slotKey,
        mobId,
        x: boss.x + ox,
        y: boss.y + oy,
        ox,
        oy,
        vx,
        vy,
        floorY,
        mode: 'stack',
        launchAt: now + stackHold,
        frameAcc: 0,
        hitDone: false,
        done: false,
      });
    }
    ensureDamienFireballLoop();
  }

  /**
   * skill2／skill5：依本體動畫「空中段」（origin.y 偏高）決定開火起迄；
   * 波數＝空中時長 ÷ waveGapMs（至少 1）。
   */
  function damienMeteorAerialWindowMs(iconId, actionKey, cfg = {}) {
    const id = pad(iconId);
    const action = actionKey || 'skill2';
    const frames = damienBossMobFrames(id, action);
    const castMs = Math.max(800, Number(mobAnimMs(id, action, 2000)) || 2000);
    const yCut = Math.max(200, Number(cfg.aerialOriginY) || 400);
    let acc = 0;
    let aerialStart = -1;
    let aerialEnd = -1;
    for (let i = 0; i < frames.length; i += 1) {
      const fr = frames[i];
      const delay = Math.max(1, Number(fr?.delay) || 90);
      const oy = Number(fr?.origin?.[1]);
      if (Number.isFinite(oy) && oy >= yCut) {
        if (aerialStart < 0) aerialStart = acc;
        aerialEnd = acc + delay;
      }
      acc += delay;
    }
    if (aerialStart >= 0 && aerialEnd > aerialStart) {
      return { startMs: aerialStart, endMs: aerialEnd, castMs };
    }
    const startMs = Math.max(0, Number(cfg.startDelayMs) || 600);
    const endMs = Math.max(startMs + 800, castMs - 800);
    return { startMs, endMs, castMs };
  }

  async function runDamienMeteorBarrage(slotKey, seq, win = null, opts = {}) {
    const kit = damienKitCfg();
    const cfg = kit.meteor || {};
    const gap = scaleDelayMs(Number(cfg.waveGapMs) || Number(kit.meteorGapMs) || 320);
    const windowMs = win && win.endMs > win.startMs
      ? Math.max(gap, win.endMs - win.startMs)
      : scaleDelayMs(Math.max(gap, (Number(cfg.waves) || 5) * gap));
    const waves = Math.max(1, Math.floor(windowMs / Math.max(1, gap)));
    const fireUntil = Date.now() + scaleDelayMs(windowMs);
    for (let w = 0; w < waves; w += 1) {
      if (seq !== atkFxSeq || !fight || fight.mode !== 'fight') return;
      if (Date.now() > fireUntil + 50) break;
      spawnDamienMeteorWave(slotKey, cfg);
      if (w < waves - 1) await sleep(gap);
    }
    if (opts.skipWaitAlive) return;
    const deadline = Date.now() + scaleDelayMs(4500);
    while (Date.now() < deadline) {
      if (seq !== atkFxSeq || !fight || fight.mode !== 'fight') return;
      const alive = (fight.damienFireballs || []).some((b) => b && !b.done);
      if (!alive) return;
      await sleep(TICK_MS);
    }
  }

  function ensureDamienFireballLoop() {
    if (!fight || fight._damienFireballRaf) return;
    let lastTs = performance.now();
    const loop = (ts) => {
      if (!fight || !isDamien() || fight.mode !== 'fight') {
        if (fight) fight._damienFireballRaf = 0;
        return;
      }
      const list = fight.damienFireballs;
      if (!Array.isArray(list) || !list.some((b) => b && !b.done)) {
        fight._damienFireballRaf = 0;
        return;
      }
      fight._damienFireballRaf = requestAnimationFrame(loop);
      let dt = (ts - lastTs) / 1000;
      lastTs = ts;
      if (!(dt > 0)) return;
      if (dt > 0.05) dt = 0.05;
      tickDamienFireballs(dt);
    };
    fight._damienFireballRaf = requestAnimationFrame(loop);
  }

  function tickDamienFireballs(dtSec) {
    if (!fight || !Array.isArray(fight.damienFireballs)) return;
    const cfg = damienKitCfg().meteor || {};
    const radius = Math.max(24, Number(cfg.hitRadiusPx) || 56);
    const hitRatio = Number(cfg.hitRatio) > 0 ? Number(cfg.hitRatio) : 0.9;
    const player = playerFeetPos();
    const field = damienFxHost();
    const W = field?.clientWidth || 1366;
    const H = field?.clientHeight || 768;
    const now = Date.now();

    for (let i = 0; i < fight.damienFireballs.length; i += 1) {
      const ball = fight.damienFireballs[i];
      if (!ball || ball.done) continue;
      const flyFrames = damienBossMobFrames(ball.mobId, 'fly');
      const dieFrames = damienBossMobFrames(ball.mobId, 'die1');
      const el = mountDamienFx(ball.id, ball.x, ball.y, 48, { poseTransform: true });

      if (ball.mode === 'stack') {
        // 跟隨本體畫面位置堆疊，到點後扇形射出
        const boss = damienBossVisualPos(ball.slotKey || 'body');
        ball.x = boss.x + (Number(ball.ox) || 0);
        ball.y = boss.y + (Number(ball.oy) || 0);
        ball.floorY = H - 80;
        ball.frameAcc = (Number(ball.frameAcc) || 0) + dtSec * 1000;
        paintDamienFx(el, flyFrames.length ? flyFrames : dieFrames, ball.frameAcc, { loop: true });
        syncDamienSwordPose(el, ball.x, ball.y, 0);
        if (now >= (Number(ball.launchAt) || 0)) {
          ball.mode = 'fly';
          ball.frameAcc = 0;
        }
      } else if (ball.mode === 'fly') {
        ball.x += (Number(ball.vx) || 0) * dtSec;
        ball.y += (Number(ball.vy) || 0) * dtSec;
        ball.frameAcc = (Number(ball.frameAcc) || 0) + dtSec * 1000;
        paintDamienFx(el, flyFrames.length ? flyFrames : dieFrames, ball.frameAcc, { loop: true });
        syncDamienSwordPose(el, ball.x, ball.y, 0);

        if (!ball.hitDone) {
          const dist = Math.hypot(ball.x - player.x, ball.y - player.y);
          if (dist <= radius) {
            ball.hitDone = true;
            damienHit(hitRatio, ball.slotKey || 'body');
            ball.mode = 'die';
            ball.frameAcc = 0;
            continue;
          }
        }
        const off = ball.x < -80 || ball.x > W + 80 || ball.y > (Number(ball.floorY) || 9999);
        if (off) {
          ball.mode = 'die';
          ball.frameAcc = 0;
        }
      } else if (ball.mode === 'die') {
        ball.frameAcc = (Number(ball.frameAcc) || 0) + dtSec * 1000;
        const frames = dieFrames.length ? dieFrames : flyFrames;
        paintDamienFx(el, frames, ball.frameAcc, { loop: false });
        syncDamienSwordPose(el, ball.x, ball.y, 0);
        const dur = damienPatternDurationMs(frames) || 400;
        if (ball.frameAcc >= dur) {
          ball.done = true;
          el?.remove();
        }
      }
    }
    fight.damienFireballs = fight.damienFireballs.filter((b) => b && !b.done);
  }

  async function enterDamienPhase(formIndex) {
    if (!fight || !isDamien()) return;
    const forms = fight.script.bodyForms || [];
    if (formIndex < 0 || formIndex >= forms.length) return;
    busy = true;
    const seq = atkFxSeq;
    // 共血：保留各階實際池與血條 maxHp；只換視覺／招式
    const keepMax = Math.max(1, Number(fight.body.maxHp) || 10000000);
    const keepP1Max = Number(fight.damienP1Max) || 0;
    const keepP1Remain = Number(fight.damienP1Remain) || 0;
    const keepP2Max = Number(fight.damienP2Max) || 0;
    const keepP2Remain = Number(fight.damienP2Remain) || 0;
    clearDamienRuntime();
    if (typeof hooks?.fadeField === 'function') {
      await hooks.fadeField(1, 400);
    }
    if (seq !== atkFxSeq || !fight || !isDamien()) return;
    fight.bodyFormIndex = formIndex;
    fight.phase = 1 + formIndex;
    hooks?.onPhase?.(fight.phase);
    const form = forms[formIndex];
    const visualId = pad(form.visualMob || form.statMob);
    fight.body.visualId = visualId;
    fight.body.maxHp = keepMax;
    fight.damienP1Max = keepP1Max;
    fight.damienP1Remain = keepP1Remain;
    fight.damienP2Max = keepP2Max;
    fight.damienP2Remain = keepP2Remain;
    syncDamienDisplayHp();
    fight.body.invincible = false;
    fight.body.targetable = true;
    fight.body.dead = false;
    fight.damienWorldTree = null;
    fight.damienNextWorldTreeAt = 0;
    let bossPos = hooks?.getBossPos?.() || { x: 720, y: 620 };
    if (form.bossPos || form.playerPos) {
      bossPos = applyHorntailStageLayout(form, bossPos);
    }
    const el = slotEl('body');
    if (!el) mountInitialActors(bossPos);
    else applyActorLayout(bossPos);
    bindVisual('body', visualId, 'stand');
    if (formIndex >= 1) {
      ensureDamienCrystals();
      startDamienSword2();
      ensureDamienSword2Loop();
    }
    if (typeof hooks?.fadeField === 'function') {
      await hooks.fadeField(0, 400);
    }
    if (seq !== atkFxSeq || !fight || !isDamien()) return;
    busy = false;
    syncHud();
  }

  /** 共血：一階實際池打完 → 轉二階（血條此時應在 30%） */
  function tryDamienSharedPhaseUp() {
    if (!fight || !isDamien() || busy || fight.mode !== 'fight') return;
    if (fight.phase !== 1) return;
    if ((Number(fight.damienP1Remain) || 0) > 0) return;
    void onDamienPhaseDown();
  }

  async function onDamienPhaseDown() {
    if (!fight || !isDamien() || busy || fight.mode !== 'fight') return;
    const forms = fight.script.bodyForms || [];
    const next = (Number(fight.bodyFormIndex) || 0) + 1;
    const p1Done = (Number(fight.damienP1Remain) || 0) <= 0;
    if (next < forms.length) {
      if (!p1Done && !(fight.body.hp <= 0)) return;
      busy = true;
      stopSustainCombat();
      atkFxSeq += 1;
      const seq = atkFxSeq;
      const fightRef = fight;
      clearUnitDebuff('body');
      const visual = pad(fight.body.visualId);
      const el = slotEl('body');
      IdleMobAnim.clearActorCastFlags?.(el);
      el?.classList.remove('is-dying', 'is-dead', 'is-hidden-slot');
      if (el) el.style.display = '';
      // P1→P2：directionAct1 播到第 50 幀就過場（完整太長）
      const transAct = IdleMobAnim.resolveAction?.(visual, 'directionAct1')
        ? 'directionAct1'
        : 'die1';
      const cutFr = 50;
      const cutMs = scaleDelayMs(
        Math.max(
          400,
          Number(IdleMobAnim.actionFrameOffsetMs?.(visual, transAct, cutFr))
            || Number(IdleMobAnim.actionDurationMs?.(visual, transAct, transAct))
            || 1200,
        ),
      );
      if (!flashAttack('body', visual, transAct)) {
        IdleMobAnim.bindActorSprite?.(el, visual, transAct);
      }
      const t0 = Date.now();
      while (Date.now() - t0 < cutMs) {
        if (seq !== atkFxSeq || fight !== fightRef || !fight || !isDamien()) return;
        await sleep(TICK_MS);
      }
      if (seq !== atkFxSeq || fight !== fightRef || !fight || !isDamien()) return;
      if (fight.mode !== 'fight') return;
      await enterDamienPhase(next);
      return;
    }
    if ((Number(fight.damienP2Remain) || 0) > 0 && !(fight.body.hp <= 0)) return;
    busy = true;
    stopSustainCombat();
    atkFxSeq += 1;
    const seq = atkFxSeq;
    const fightRef = fight;
    if (seq !== atkFxSeq || fight !== fightRef) return;
    busy = false;
    await onBodyDead();
  }

  async function playDamienIntro() {
    if (!fight || !isDamien()) return;
    const seq = atkFxSeq;
    const form = (fight.script.bodyForms || [])[0];
    const id = pad(form?.visualMob || form?.statMob || '8880100');
    busy = true;
    const el = slotEl('body');
    if (el) {
      el.classList.remove('is-hidden-slot');
      el.style.display = '';
      bindVisual('body', id, 'stand');
    }
    startDamienSword();
    await sleep(scaleDelayMs(400));
    if (seq !== atkFxSeq || !fight) return;
    fight.body.invincible = false;
    fight.body.targetable = true;
    busy = false;
    hooks?.onPhase?.(1);
    syncHud();
  }

  function tickDamien(dt) {
    if (!fight || !isDamien() || busy || fight.mode !== 'fight') return;
    if (fight.phase === 1) ensureDamienSwordLoop();
    if (fight.phase >= 2) {
      tickDamienCrystal(dt);
      ensureDamienSword2Loop();
      // 位移／傳送招播完（無 lock、非 casting）才開世界樹，避免 skill8 被 after 打斷
      void tryDamienWorldTree();
      const player = playerFeetPos();
      const bodyEl = slotEl('body');
      if (bodyEl) {
        const bpos = actorStylePos(bodyEl);
        const dist = Math.abs(bpos.x - player.x);
        fight.damienBodyContactAcc = (Number(fight.damienBodyContactAcc) || 0) + Math.max(0, Number(dt) || 0);
        if (dist < 52 && fight.damienBodyContactAcc >= 0.8) {
          fight.damienBodyContactAcc = 0;
          damienHit(0.15, 'body');
        }
      }
    }
    fight.body.active = true;
    // 世界樹引導中仍可累 CD，但 tickUnitAttack 會被 bossActionLock 擋住開新招
    const attacks = unitAttacks(fight.listId, fight.body.visualId);
    tickUnitAttack('body', fight.body, attacks, dt);
  }

  function tickSuu(dt) {
    if (!fight || !isSuu() || busy || fight.mode !== 'fight') return;
    trySuuShield();
    // destruction → overload → default
    if ((Number(fight.suuPurgeUntil) || 0) > 0 && Date.now() >= fight.suuPurgeUntil) {
      endSuuDestruction();
    } else if ((Number(fight.suuOverloadUntil) || 0) > 0 && Date.now() >= fight.suuOverloadUntil) {
      fight.suuOverloadUntil = 0;
      syncSuuGaugeHud();
    }
    tickSuuGaugeUiAnim(dt);
    tickSuuAlertFrame(dt);
    if (suuInDestruction()) syncSuuGaugeHud();
    tickSuuPatterns(dt);
    fight.body.active = true;
    const attacks = unitAttacks(fight.listId, fight.body.visualId);
    tickUnitAttack('body', fight.body, attacks, dt);
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

    if (isSuu()) {
      fight.bodyFormIndex = 0;
      fight.phase = 1;
      const form = (fight.script.bodyForms || [])[0];
      const visualId = pad(form?.visualMob || form?.statMob || '8881100');
      const kit = suuKitCfg();
      fight.body.visualId = visualId;
      fight.body.maxHp = maxHpOfBodyForm(fight.listId, form);
      fight.body.hp = fight.body.maxHp;
      fight.body.invincible = false;
      fight.body.targetable = true;
      fight.body.dead = false;
      fight.suuGauge = 0;
      fight.suuGaugeMax = Math.max(1, Number(kit.gauge?.max) || 100);
      fight.suuPurgeUntil = 0;
      fight.suuPurgeDurationMs = 0;
      fight.suuOverloadUntil = 0;
      fight.suuShieldUntil = 0;
      fight.suuNextShieldAt = 0;
      fight.suuShieldActive = false;
      fight.suuShieldHp = 0;
      fight.suuShieldMax = 0;
      fight.suuPatternAcc = Object.create(null);
      fight.suuPatternBusyUntil = 0;
      fight.suuNextPatternAt = 0;
      fight.suuDamageTowardCool = 0;
      fight.suuAlertFrame = 0;
      fight.suuAlertAcc = 0;
      fight.suuUiBgFrame = 0;
      fight.suuUiBg0Frame = 0;
      fight.suuUiAnimAcc = 0;
      clearSuuPatternsRuntime();
      if (opts.playIntro) {
        mountInitialActors(bossPos, { skipBind: true });
        syncHud();
        playSuuIntro();
      } else {
        stage()?.querySelectorAll('.idle-boss-part').forEach((n) => n.remove());
        syncHud();
      }
      return true;
    }

    if (isDamien()) {
      fight.bodyFormIndex = 0;
      fight.phase = 1;
      const pools = damienPhasePools(fight.listId, fight.script);
      const form = pools.form0;
      const visualId = pad(form?.visualMob || form?.statMob || '8880100');
      fight.body.visualId = visualId;
      fight.damienP1Max = pools.p1;
      fight.damienP1Remain = pools.p1;
      fight.damienP2Max = pools.p2;
      fight.damienP2Remain = pools.p2;
      fight.body.maxHp = 10000000;
      syncDamienDisplayHp();
      fight.body.invincible = false;
      fight.body.targetable = true;
      fight.body.dead = false;
      fight.damienNextWorldTreeAt = 0;
      fight.damienBindUntil = 0;
      fight.damienActionStopUntil = 0;
      fight.damienWorldTree = null;
      clearDamienRuntime();
      if (opts.playIntro) {
        mountInitialActors(bossPos, { skipBind: true });
        syncHud();
        playDamienIntro();
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
    cancelHudSync();
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
      // 標記結束，阻斷尚未 await 完的轉階／die 回呼寫入新場
      if (fight.mode === 'fight' || fight.mode === 'clear') {
        fight.mode = 'done';
      }
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
      if (isSuu()) {
        clearSuuPatternsRuntime();
        clearSuuGaugeHud();
        fight.suuPurgeUntil = 0;
        fight.suuPurgeDurationMs = 0;
        fight.suuOverloadUntil = 0;
        fight.suuShieldActive = false;
        fight.suuShieldUntil = 0;
        fight.suuShieldHp = 0;
        fight.suuShieldMax = 0;
        fight.suuNextShieldAt = 0;
        fight.suuGauge = 0;
        fight.suuPatternAcc = Object.create(null);
        fight.suuPatternBusyUntil = 0;
        fight.suuNextPatternAt = 0;
        fight.suuDebrisAlive = 0;
        fight.suuDebrisNextAt = 0;
        fight.suuDamageTowardCool = 0;
        fight.suuAlertFrame = 0;
        fight.suuAlertAcc = 0;
        fight.suuUiBgFrame = 0;
        fight.suuUiBg0Frame = 0;
        fight.suuUiAnimAcc = 0;
        fight.bodyFormIndex = 0;
        fight.phase = 1;
      }
      if (isDamien()) {
        clearDamienRuntime();
        fight.damienWorldTree = null;
        fight.damienNextWorldTreeAt = 0;
        fight.damienBindUntil = 0;
        fight.damienActionStopUntil = 0;
        fight.bodyFormIndex = 0;
        fight.phase = 1;
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
    collectSuuPatternUrls,
    warmAssets,
  };
})();

if (typeof window !== 'undefined') {
  window.IdleBossFight = IdleBossFight;
}
