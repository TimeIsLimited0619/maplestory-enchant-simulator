/**
 * BOSS 戰鬥狀態機。
 * - 巴洛古（kind 省略）：四階段 body + handL/handR + chest
 * - 殘暴炎魔（kind: 'zakum'）：先八臂 → 本體三態；無 chest 則直接掉落
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

  function isZakum(f = fight) {
    return !!(f && (f.kind === 'zakum' || isZakumScript(f.script)));
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
      const timeout = scaleDelayMs(dur + 250);
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
    const cap = scaleDelayMs((IdleMobAnim.SKILL_MAX_MS || 5000) + 200);
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

  function applyActorLayout(bossPos, opts = {}) {
    if (!fight) return;
    const b = bossPos || { x: 620, y: 605 };
    const skipBind = !!opts.skipBind;
    const order = [];
    if (isZakum()) {
      // 先掛手臂再掛本體：z 較低的手臂在後方
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
      if (isZakum() && findArm(row.key)) {
        el.classList.toggle('is-dead', !!row.unit.dead);
        el.classList.toggle('is-sealed', false);
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

  async function enterZakumBodyForm(formIndex) {
    if (!fight) return;
    const forms = fight.script.bodyForms || [];
    if (formIndex < 0 || formIndex >= forms.length) return;
    busy = true;
    fight.bodyFormIndex = formIndex;
    fight.phase = 2 + formIndex;
    hooks?.onPhase?.(fight.phase);

    if (formIndex === 0) {
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

  async function onBodyDead() {
    if (!fight || fight.mode !== 'fight') return;
    busy = true;
    fight.mode = 'clear';
    hooks?.onPhase?.('clear');
    // 死亡動畫開始前就移除手臂／封印雙手（勿等 die1 播完）
    if (isZakum()) {
      armList().forEach((arm) => {
        removeSlot(arm.key);
        arm.dead = true;
        arm.targetable = false;
        arm.active = false;
      });
    } else {
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
    const bodyVisual = isZakum()
      ? (currentBodyForm()?.visualMob || currentBodyForm()?.statMob || fight.body.visualId)
      : fight.script.bodyStatMob;
    await playAnim('body', bodyVisual, 'die1');
    hideSlot('body');

    const chestId = fight.script.chestMob ? pad(fight.script.chestMob) : '';
    if (!chestId) {
      // 無寶箱：直接掉落並進入離場倒數
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
    syncHud();

    if (target.kind === 'chest' && target.unit.hp <= 0) {
      onChestDead();
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
    const list = Array.isArray(mobs) ? mobs : (mobs ? [mobs] : getCombatMobs());
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
    DamageNumber.spawnOnMob(mob, shown > 0 ? shown : 0, !!isCritical, opts || {});
  }

  function combatCtx(extra = {}) {
    const fieldEl = document.getElementById('idleBossField');
    const playerEl = fieldEl?.querySelector('.idle-actor--player')
      || document.getElementById('idleBossStagePlayer')?.querySelector('.idle-actor--player');
    return {
      mobs: getCombatMobs(),
      getMobs: () => getCombatMobs(),
      playerEl,
      fieldEl,
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
      if (typeof SkillCombat !== 'undefined' && SkillCombat.isCastLocked?.()) break;

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
    if (part?.attacks?.length) return part.attacks;
    // skill-only 部位（炎魔部分手臂只有 skill1–4）
    if (part?.skills?.length) {
      const seen = new Set();
      const out = [];
      part.skills.forEach((sk) => {
        const n = Math.max(1, Math.floor(Number(sk.action) || 1));
        const actionKey = `skill${n}`;
        if (seen.has(actionKey)) return;
        seen.add(actionKey);
        const animMs = Number(part.skillAnimMs?.[actionKey]) || 2000;
        const dmg = Math.max(0, Number(part.MADamage) || Number(part.PADamage) || 0);
        out.push({ actionKey, dmg, animMs, magic: true });
      });
      if (out.length) return out;
    }
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

  function tickUnitAttack(slotKey, unit, attackList, dt) {
    if (!unit || unit.dead || unit.hp <= 0) return;
    if (slotKey !== 'body' && !unit.active) return;
    if (slotKey === 'body' && fight.body.hp <= 0) return;
    if (typeof IdleMobAnim !== 'undefined' && IdleMobAnim.isActorCasting?.(slotEl(slotKey))) return;

    const playerEl = getBossPlayerEl();
    const awActive = !!(playerEl && typeof IdleMobAnim !== 'undefined'
      && IdleMobAnim.isAreaWarningActive?.(playerEl));

    if (!atkAcc[slotKey]) atkAcc[slotKey] = Object.create(null);
    const accMap = atkAcc[slotKey];
    const cdM = cdMult(fight.listId);
    const dM = dmgMult(fight.listId);

    for (let i = 0; i < attackList.length; i += 1) {
      const atk = attackList[i];
      const key = atk.actionKey || `attack${atk.action}`;
      const cdSec = Math.max(0.4, ((Number(atk.animMs) || 1200) / 1000) * cdM);
      accMap[key] = (Number(accMap[key]) || 0) + dt;
      if (accMap[key] < cdSec) continue;
      const dmg = Math.max(0, Math.floor((Number(atk.dmg) || 0) * dM));
      if (!(dmg > 0)) continue;

      const iconId = pad(unit.visualId);
      const isAreaWarn = typeof IdleMobAnim !== 'undefined'
        && IdleMobAnim.hasAreaWarningAttack?.(iconId, key);
      // 預警進行中：略過其他 areaWarning，但一般攻擊仍可出傷／hit
      if (isAreaWarn && awActive) continue;

      if (!flashAttack(slotKey, iconId, key)) continue;
      accMap[key] = 0;

      const hasEffect0 = typeof IdleMobAnim !== 'undefined'
        && (IdleMobAnim.effect0ActionKeys?.(iconId, key) || []).length > 0;

      const applyHitAndDamage = (immediateHit) => {
        // 只播 attack#|skill#/info/hit；沒有就不出 hit（絕不用 hit1＝怪物受擊）
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
          break;
        }
        // playAreaWarning 失敗 → 走一般出傷＋info/hit
      }

      // 一般技：info/hit 依 attackAfter 延遲；出傷同一時間點
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
      break;
    }
  }

  function tickBoss(dt) {
    if (!fight || busy || fight.mode !== 'fight') return;
    if (typeof IdleHunt !== 'undefined' && IdleHunt.isPlayerDead?.()) return;

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
    if (isZakum() && fight.phase === 1) {
      const arms = armList();
      const hp = arms.reduce((sum, a) => sum + Math.max(0, a.dead ? 0 : (Number(a.hp) || 0)), 0);
      const maxHp = arms.reduce((sum, a) => sum + Math.max(1, Number(a.maxHp) || 1), 0);
      return { hp, maxHp, phase: fight.phase, mode: fight.mode };
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
    if (fight.mode === 'done') return;
    tickPlayer(dt);
    tickBoss(dt);
    if (typeof IdlePotionPanel !== 'undefined') IdlePotionPanel.tryAutoDrink?.();
    hooks?.syncPlayerHp?.();
    if (typeof IdleHunt !== 'undefined' && IdleHunt.isPlayerDead?.() && fight.mode === 'fight') {
      fight.mode = 'done';
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
  };
})();

if (typeof window !== 'undefined') {
  window.IdleBossFight = IdleBossFight;
}
