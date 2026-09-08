/**
 * 技能 effect／hit／shootobj／循環特效播放
 */
const SkillEffectPlayer = (() => {
  const instances = new Set();
  /** @type {Set<{ cancel: (settleHits?: boolean) => void }>} */
  const projectiles = new Set();
  const preloadCache = new Map();
  let nextId = 1;

  function scaleRealMs(ms) {
    if (typeof IdleHunt !== 'undefined' && typeof IdleHunt.scaleDelayMs === 'function') {
      return IdleHunt.scaleDelayMs(ms);
    }
    return Math.max(0, Number(ms) || 0);
  }

  function gameSpeedMult() {
    if (typeof IdleHunt !== 'undefined' && typeof IdleHunt.getGameSpeed === 'function') {
      return Math.max(0.01, Number(IdleHunt.getGameSpeed()) || 1);
    }
    return 1;
  }

  function decodedImage(src) {
    if (!src) return null;
    if (typeof EnchantImagePreload !== 'undefined') {
      return EnchantImagePreload.getImage(src);
    }
    return null;
  }

  function ensurePreloaded(frames) {
    const urls = (frames || []).map((f) => f?.src).filter(Boolean);
    if (!urls.length) return Promise.resolve();
    if (typeof EnchantImagePreload !== 'undefined') {
      return EnchantImagePreload.preloadMany(urls, preloadCache).catch(() => {});
    }
    return Promise.all(urls.map((url) => new Promise((resolve) => {
      const img = new Image();
      img.decoding = 'async';
      const done = () => resolve();
      img.onload = done;
      img.onerror = done;
      img.src = url;
    }))).then(() => {});
  }

  function applyFrame(inst) {
    const frames = inst.frames;
    const frame = frames[inst.frameIdx];
    const img = inst.img;
    if (!frame || !img) return false;
    if (!frame.src) {
      img.hidden = true;
      img.removeAttribute('src');
      img.dataset.src = '';
      return true;
    }
    const loaded = decodedImage(frame.src);
    if (!loaded && typeof EnchantImagePreload !== 'undefined') return false;
    const ox = frame.origin?.[0] ?? 0;
    const oy = frame.origin?.[1] ?? 0;
    img.style.setProperty('--ox', `${ox}px`);
    img.style.setProperty('--oy', `${oy}px`);
    if (img.dataset.src !== frame.src) {
      img.dataset.src = frame.src;
      img.src = frame.src;
    }
    img.hidden = false;
    return true;
  }

  function destroy(inst) {
    if (!inst) return;
    if (inst.rafId != null) {
      cancelAnimationFrame(inst.rafId);
      inst.rafId = null;
    }
    inst.stage?.remove();
    instances.delete(inst);
  }

  function facingTransform(inst) {
    return inst.mirrorX ? 'scaleX(-1)' : 'none';
  }

  function syncAnchor(inst) {
    if (!inst?.stage) return true;
    if (typeof inst.resolveAnchor === 'function') {
      const a = inst.resolveAnchor();
      if (a && Number.isFinite(a.x) && Number.isFinite(a.y)) {
        inst.stage.style.left = `${a.x}px`;
        inst.stage.style.top = `${a.y}px`;
        inst.stage.style.transform = facingTransform(inst);
        return true;
      }
      // 循環掛怪特效：錨點消失（死亡／移除）立刻停，勿等時間到
      if (inst.loop && inst.stopWhenAnchorLost) {
        destroy(inst);
        return false;
      }
    }
    if (Number.isFinite(inst.fixedX) && Number.isFinite(inst.fixedY)) {
      inst.stage.style.left = `${inst.fixedX}px`;
      inst.stage.style.top = `${inst.fixedY}px`;
      inst.stage.style.transform = facingTransform(inst);
    }
    return true;
  }

  function tick(inst, ts) {
    if (!instances.has(inst)) return;
    if (!inst.lastTs) inst.lastTs = ts;
    const dt = Math.max(0, ts - inst.lastTs);
    inst.lastTs = ts;
    inst.acc += dt;
    if (!syncAnchor(inst)) return;

    const frames = inst.frames;
    while (frames.length > 0) {
      const frame = frames[inst.frameIdx];
      const delay = Math.max(1, Number(frame?.delay) || 90);
      if (inst.acc < delay) break;
      inst.acc -= delay;
      inst.frameIdx += 1;
      if (inst.frameIdx >= frames.length) {
        if (inst.loop) {
          inst.frameIdx = 0;
        } else {
          destroy(inst);
          return;
        }
      }
      const shown = applyFrame(inst);
      if (frames[inst.frameIdx]?.src && !shown) break;
    }

    inst.rafId = requestAnimationFrame((t) => tick(inst, t));
  }

  function startInstance(inst) {
    if (!instances.has(inst)) return;
    syncAnchor(inst);
    applyFrame(inst);
    inst.rafId = requestAnimationFrame((t) => tick(inst, t));
  }

  function createInstance(parentEl, frames, opts = {}) {
    if (!parentEl || !frames?.length) return null;
    const stage = document.createElement('div');
    stage.className = opts.className || 'idle-skill-fx-stage';
    stage.dataset.skillFxId = String(nextId);
    const img = document.createElement('img');
    img.className = 'idle-skill-fx-sprite';
    img.alt = '';
    img.draggable = false;
    img.hidden = true;
    img.decoding = 'sync';
    stage.appendChild(img);
    parentEl.appendChild(stage);
    const z = Number(opts.zIndex);
    if (Number.isFinite(z)) stage.style.zIndex = String(Math.round(z));

    const inst = {
      id: nextId++,
      parent: parentEl,
      stage,
      img,
      frames,
      frameIdx: 0,
      acc: 0,
      lastTs: 0,
      rafId: null,
      resolveAnchor: opts.resolveAnchor || null,
      fixedX: opts.x,
      fixedY: opts.y,
      mirrorX: !!opts.mirrorX,
      loop: !!opts.loop,
      stopWhenAnchorLost: !!opts.stopWhenAnchorLost,
    };
    instances.add(inst);
    return inst;
  }

  function playFrames(parentEl, frames, opts = {}) {
    if (typeof document !== 'undefined' && document.hidden && !opts.forcePlay) {
      return null;
    }
    const list = (frames || []).filter((f) => f && (f.src || f.delay));
    if (!parentEl || !list.length) return null;
    const inst = createInstance(parentEl, list, opts);
    if (!inst) return null;
    ensurePreloaded(list).then(() => startInstance(inst));
    return inst.id;
  }

  function framesDurationMs(frames) {
    return (frames || []).reduce((sum, f) => sum + (Number(f?.delay) || 90), 0);
  }

  function resolveMobCenterLocal(actor) {
    if (!actor) return { x: 0, y: -32 };
    const oy = parseFloat(actor.style.getPropertyValue('--oy'));
    const ox = parseFloat(actor.style.getPropertyValue('--ox'));
    const originY = Number.isFinite(oy) && oy > 0 ? oy : 64;
    const originX = Number.isFinite(ox) ? ox : 0;
    const scale = actor.classList.contains('is-boss-scale-sprite')
      ? (parseFloat(getComputedStyle(actor).getPropertyValue('--boss-sprite-scale')) || 2)
      : 1;

    const img = actor.querySelector(
      ':scope .idle-actor-sprite:not(.idle-actor-sprite--effect):not(.idle-actor-sprite--hit)',
    );
    const w = img?.naturalWidth || 0;
    const h = img?.naturalHeight || 0;
    if (w > 0 && h > 0) {
      return {
        x: Math.round((-originX + w / 2) * scale),
        y: Math.round((-originY + h / 2) * scale),
      };
    }
    return { x: 0, y: Math.round(-originY * 0.5 * scale) };
  }

  function activeCombatField() {
    const arena = document.getElementById('idleBossArena');
    if (arena?.classList.contains('is-open')) {
      return document.getElementById('idleBossField') || document.getElementById('idleHuntField');
    }
    return document.getElementById('idleHuntField');
  }

  function getSkillFxLayer(fieldEl) {
    const field = fieldEl || activeCombatField();
    if (!field) return null;
    let layer = field.querySelector('.idle-hunt-skill-fx');
    if (!layer) {
      layer = document.createElement('div');
      layer.className = 'idle-hunt-skill-fx';
      layer.setAttribute('aria-hidden', 'true');
      const stage = field.querySelector('.idle-hunt-stage');
      if (stage) stage.insertAdjacentElement('afterend', layer);
      else field.appendChild(layer);
    }
    return layer;
  }

  function localAnchorToField(fieldEl, parentEl, local) {
    if (!fieldEl || !parentEl || !local) return null;
    if (!Number.isFinite(local.x) || !Number.isFinite(local.y)) return null;
    const pr = parentEl.getBoundingClientRect();
    const fr = fieldEl.getBoundingClientRect();
    return {
      x: pr.left - fr.left + local.x,
      y: pr.top - fr.top + local.y,
    };
  }

  function playOnPlayer(frames, opts = {}) {
    const fieldEl = opts.fieldEl || activeCombatField();
    const player = opts.playerEl
      || fieldEl?.querySelector('.idle-actor--player');
    if (!player || !fieldEl) return null;
    const layer = getSkillFxLayer(fieldEl);
    if (!layer) return null;
    const facingRight = opts.mirrorX != null ? !!opts.mirrorX : playerFacingRight(player);
    return playFrames(layer, frames, {
      className: opts.className || 'idle-skill-fx-stage idle-skill-fx-stage--cast',
      mirrorX: facingRight,
      loop: !!opts.loop,
      resolveAnchor: () => {
        if (typeof opts.resolveAnchor === 'function') {
          const local = opts.resolveAnchor();
          const pt = localAnchorToField(fieldEl, player, local);
          if (pt) return pt;
        }
        if (typeof Paperdoll !== 'undefined' && typeof Paperdoll.getHuntFeetAnchor === 'function') {
          const local = Paperdoll.getHuntFeetAnchor(player);
          const pt = localAnchorToField(fieldEl, player, local);
          if (pt) return pt;
        }
        const pt = fieldPointFromPlayer(fieldEl, player, [0, 0], facingRight);
        return { x: pt.x, y: pt.y };
      },
    });
  }

  /** 狩獵預設朝右；Boss 場 is-flip-x＝朝左 */
  function playerFacingRight(playerEl) {
    if (!playerEl || !playerEl.classList) return true;
    return !playerEl.classList.contains('is-flip-x');
  }

  function playOnMob(mob, frames, opts = {}) {
    if (!mob || !frames?.length) return null;
    const fieldEl = opts.fieldEl || activeCombatField();
    if (fieldEl?.id === 'idleHuntField'
      && typeof IdleHunt !== 'undefined'
      && typeof IdleHunt.isMobVisibleInField === 'function') {
      if (!IdleHunt.isMobVisibleInField(mob)) return null;
    }
    const uid = mob.uid != null ? String(mob.uid) : '';
    const actor = uid
      ? fieldEl?.querySelector(`.idle-actor--mob[data-uid="${uid}"]`)
      : null;
    if (!fieldEl || !actor) return null;
    const layer = getSkillFxLayer(fieldEl);
    if (!layer) return null;
    const loop = !!opts.loop;
    return playFrames(layer, frames, {
      ...opts,
      loop,
      // 循環掛怪特效預設：怪消失就停
      stopWhenAnchorLost: opts.stopWhenAnchorLost != null ? !!opts.stopWhenAnchorLost : loop,
      className: opts.className || 'idle-skill-fx-stage idle-skill-fx-stage--hit',
      mirrorX: false,
      resolveAnchor: () => {
        const live = uid
          ? fieldEl.querySelector(`.idle-actor--mob[data-uid="${uid}"]`)
          : actor;
        if (!live || !live.isConnected) return null;
        if (live.style.display === 'none' || live.classList.contains('is-hidden-slot')
          || live.classList.contains('is-dead')) {
          return null;
        }
        if (typeof opts.resolveAnchor === 'function') {
          const local = opts.resolveAnchor(live);
          const pt = localAnchorToField(fieldEl, live, local);
          if (pt) return pt;
        }
        const pt = fieldPointFromMob(fieldEl, mob);
        if (!pt) return null;
        return { x: pt.x, y: pt.y };
      },
    });
  }

  /** 掛在怪物頭頂上方（落葉旋風等騰空技特效） */
  function playOnMobHead(mob, frames, opts = {}) {
    if (!mob || !frames?.length) return null;
    const fieldEl = opts.fieldEl || activeCombatField();
    const pt = fieldPointFromMob(fieldEl, mob);
    if (!pt) {
      return playOnMob(mob, frames, {
        ...opts,
        className: opts.className || 'idle-skill-fx-stage idle-skill-fx-stage--cast',
      });
    }
    const actorH = pt.actor?.clientHeight || pt.actor?.offsetHeight || 96;
    const headGap = Number.isFinite(opts.headGapPx) ? Number(opts.headGapPx) : 20;
    // 自怪身中心上移到頭頂，再往上 headGap px
    const y = pt.y - Math.round(actorH * 0.5) - headGap;
    return playAtField({
      fieldEl,
      frames,
      x: pt.x,
      y,
      className: opts.className || 'idle-skill-fx-stage idle-skill-fx-stage--cast',
      mirrorX: !!opts.mirrorX,
      forcePlay: !!opts.forcePlay,
    });
  }

  function fieldPointFromPlayer(fieldEl, playerEl, localOffset, facingRight = true) {
    const fr = fieldEl?.getBoundingClientRect?.();
    const pr = playerEl?.getBoundingClientRect?.();
    if (!fr || !pr) return { x: 80, y: 120 };

    let feetX = pr.left - fr.left + pr.width * 0.5;
    let feetY = pr.top - fr.top + pr.height * 0.78;
    if (typeof Paperdoll !== 'undefined' && playerEl && Paperdoll.getHuntFeetAnchor) {
      const a = Paperdoll.getHuntFeetAnchor(playerEl);
      if (a && Number.isFinite(a.x) && Number.isFinite(a.y)) {
        // getHuntFeetAnchor 回傳相對 playerEl 的腳底；再轉成 field 座標
        feetX = pr.left - fr.left + a.x;
        feetY = pr.top - fr.top + a.y;
      }
    }

    // WZ shootobj.start 以「朝左」為準；螢幕 Y+ 向下，故 oy 負值＝往上
    // 紙娃娃狩獵朝右 → X 取反
    const ox = Number(localOffset?.[0]) || 0;
    const oy = Number(localOffset?.[1]) || 0;
    const x = facingRight ? (feetX - ox) : (feetX + ox);
    const y = feetY + oy;
    return { x, y, feetX, feetY };
  }

  function fieldPointFromMob(fieldEl, mob) {
    const uid = mob?.uid != null ? String(mob.uid) : '';
    const actor = uid
      ? fieldEl.querySelector(`.idle-actor--mob[data-uid="${uid}"]`)
      : null;
    if (actor) {
      const fr = fieldEl.getBoundingClientRect();
      const ar = actor.getBoundingClientRect();
      const local = resolveMobCenterLocal(actor);
      return {
        x: ar.left - fr.left + local.x,
        y: ar.top - fr.top + local.y,
        mob,
        actor,
      };
    }
    if (typeof IdleHunt !== 'undefined' && typeof IdleHunt.mobFieldPoint === 'function') {
      const pt = IdleHunt.mobFieldPoint(mob);
      if (pt && Number.isFinite(pt.x) && Number.isFinite(pt.y)) {
        return { x: pt.x, y: pt.y, mob, actor: null };
      }
    }
    return null;
  }

  /**
   * shootobj：從 start 以等速直線飛出（不對齊怪物 Y，避免往下掉再飛）。
   * 速度取自 moveList.v（視為每 30ms 移動 v px）；方向取水平朝向。
   */
  function playShootObj(opts = {}) {
    const {
      fieldEl,
      playerEl,
      mobs = [],
      frames,
      startOffset = [-80, -60],
      startDelayMs = 0,
      pierce = false,
      maxTargets = 1,
      moveList = null,
      bodyWH = [300, 300],
      facingRight = true,
      onHit,
      onDone,
    } = opts;
    const list = (frames || []).filter((f) => f && f.src);
    const targets = (mobs || []).filter(Boolean).slice(0, Math.max(1, maxTargets));

    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      if (typeof onDone === 'function') onDone();
    };

    if (!fieldEl || !list.length || !targets.length) {
      finish();
      return null;
    }

    // 背景分頁：略過飛行動畫，立刻結算命中（否則 rAF／timeout 被節流會卡傷害）
    if (typeof document !== 'undefined' && document.hidden) {
      targets.forEach((mob, i) => {
        if (typeof onHit === 'function') onHit(mob, i);
      });
      finish();
      return null;
    }
    const fxLayer = getSkillFxLayer(fieldEl);
    if (!fxLayer) {
      finish();
      return null;
    }

    // 朝左用 p2（-560,0）；狩獵紙娃娃朝右 → 水平 +X
    const step = (moveList && (facingRight ? moveList.p2 : moveList.p2)?.[0])
      || (moveList && (moveList.p1 || Object.values(moveList)[0])?.[0])
      || { v: 50, pos: [-560, 0], delay: 0 };
    const v = Math.max(1, Number(step.v) || 50);
    // WZ：v ≈ 每 30ms 移動的距離 → px/ms
    const speedPxPerMs = (v / 30) * gameSpeedMult();
    const maxRange = Math.max(200, Math.hypot(step.pos?.[0] || 560, step.pos?.[1] || 0));
    const hitHalfW = Math.max(40, (Number(bodyWH?.[0]) || 300) * 0.15);

    /** @type {{ cancel: (settleHits?: boolean) => void, stage: HTMLElement|null, rafId: number|null, launchTimer: ReturnType<typeof setTimeout>|null, done: boolean, hitSet: Set<any>, targetIdx: number }} */
    const proj = {
      stage: null,
      rafId: null,
      launchTimer: null,
      done: false,
      hitSet: new Set(),
      targetIdx: 0,
      cancel(settleHits) {
        if (proj.done) return;
        proj.done = true;
        if (proj.launchTimer != null) {
          clearTimeout(proj.launchTimer);
          proj.launchTimer = null;
        }
        if (proj.rafId != null) {
          cancelAnimationFrame(proj.rafId);
          proj.rafId = null;
        }
        if (settleHits && typeof onHit === 'function') {
          for (let i = proj.targetIdx; i < targets.length; i += 1) {
            const mob = targets[i];
            if (!mob || proj.hitSet.has(mob)) continue;
            proj.hitSet.add(mob);
            onHit(mob, i);
            if (!pierce) break;
          }
        }
        proj.stage?.remove();
        proj.stage = null;
        projectiles.delete(proj);
        finish();
      },
    };
    projectiles.add(proj);

    const launch = () => {
      if (proj.done) return;
      const stage = document.createElement('div');
      stage.className = 'idle-skill-fx-stage idle-skill-fx-stage--shootobj';
      const img = document.createElement('img');
      img.className = 'idle-skill-fx-sprite';
      img.alt = '';
      img.draggable = false;
      img.decoding = 'sync';
      stage.appendChild(img);
      fxLayer.appendChild(stage);
      proj.stage = stage;

      const spawn = fieldPointFromPlayer(fieldEl, playerEl, startOffset, facingRight);
      // 固定高度：只沿 X 飛，Y 鎖在初始 start
      let x = spawn.x;
      const y = spawn.y;
      const dirX = facingRight ? 1 : -1;
      stage.style.left = `${x}px`;
      stage.style.top = `${y}px`;
      stage.style.transform = facingRight ? 'scaleX(-1)' : 'none';

      let frameIdx = 0;
      let frameAcc = 0;
      let lastTs = 0;
      let traveled = 0;

      const applyProjFrame = () => {
        const frame = list[frameIdx % list.length];
        if (!frame?.src) return;
        img.style.setProperty('--ox', `${frame.origin?.[0] ?? 0}px`);
        img.style.setProperty('--oy', `${frame.origin?.[1] ?? 0}px`);
        if (img.dataset.src !== frame.src) {
          img.dataset.src = frame.src;
          img.src = frame.src;
        }
        img.hidden = false;
      };

      const endFlight = () => {
        if (proj.done) return;
        proj.done = true;
        if (proj.rafId != null) {
          cancelAnimationFrame(proj.rafId);
          proj.rafId = null;
        }
        stage.remove();
        proj.stage = null;
        projectiles.delete(proj);
        finish();
      };

      const tryHit = () => {
        while (proj.targetIdx < targets.length) {
          const mob = targets[proj.targetIdx];
          if (!mob || proj.hitSet.has(mob)) {
            proj.targetIdx += 1;
            continue;
          }
          const mp = fieldPointFromMob(fieldEl, mob);
          if (!mp) {
            proj.targetIdx += 1;
            continue;
          }
          // 水平飛近怪物 X 才命中（不要求 Y 對齊）
          const reached = facingRight ? (x >= mp.x - hitHalfW) : (x <= mp.x + hitHalfW);
          if (!reached) break;
          proj.hitSet.add(mob);
          if (typeof onHit === 'function') onHit(mob, proj.targetIdx);
          proj.targetIdx += 1;
          if (!pierce) {
            endFlight();
            return true;
          }
        }
        return false;
      };

      ensurePreloaded(list).then(() => {
        if (proj.done) return;
        applyProjFrame();
        const stepFrame = (ts) => {
          if (proj.done) return;
          if (!lastTs) lastTs = ts;
          const dt = Math.min(50, Math.max(0, ts - lastTs));
          lastTs = ts;
          frameAcc += dt;

          const frameDelay = Math.max(1, Number(list[frameIdx % list.length]?.delay) || 60);
          if (frameAcc >= frameDelay) {
            frameAcc -= frameDelay;
            frameIdx += 1;
            applyProjFrame();
          }

          const dx = dirX * speedPxPerMs * dt;
          x += dx;
          traveled += Math.abs(dx);
          stage.style.left = `${x}px`;
          stage.style.top = `${y}px`;

          if (tryHit()) return;

          if (traveled >= maxRange || proj.targetIdx >= targets.length) {
            endFlight();
            return;
          }
          proj.rafId = requestAnimationFrame(stepFrame);
        };
        proj.rafId = requestAnimationFrame(stepFrame);
      });
    };

    const delay = scaleRealMs(Math.max(0, Number(startDelayMs) || 0));
    if (delay > 0) proj.launchTimer = setTimeout(launch, delay);
    else launch();
    return true;
  }

  /**
   * ball：自玩家飛向目標（可穿透多隻），命中後播 hit。
   * 速度預設約每 30ms 移動 18px；可用 speedPxPerMs 覆寫。
   */
  function playBall(opts = {}) {
    const {
      fieldEl,
      playerEl,
      mobs = [],
      frames,
      startOffset = [-40, -70],
      startDelayMs = 0,
      pierce = false,
      maxTargets = 1,
      speedPxPerMs = 18 / 30,
      facingRight = true,
      onHit,
      onDone,
    } = opts;
    const list = (frames || []).filter((f) => f && f.src);
    const targets = (mobs || []).filter(Boolean).slice(0, Math.max(1, maxTargets));
    const flySpeed = (Number(speedPxPerMs) || 18 / 30) * gameSpeedMult();

    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      if (typeof onDone === 'function') onDone();
    };

    if (!fieldEl || !list.length || !targets.length) {
      finish();
      return null;
    }
    const fxLayer = getSkillFxLayer(fieldEl);
    if (!fxLayer) {
      finish();
      return null;
    }

    /** @type {{ cancel: (settleHits?: boolean) => void, stage: HTMLElement|null, rafId: number|null, launchTimer: ReturnType<typeof setTimeout>|null, done: boolean, hitSet: Set<any>, targetIdx: number }} */
    const proj = {
      stage: null,
      rafId: null,
      launchTimer: null,
      done: false,
      hitSet: new Set(),
      targetIdx: 0,
      cancel(settleHits) {
        if (proj.done) return;
        proj.done = true;
        if (proj.launchTimer != null) {
          clearTimeout(proj.launchTimer);
          proj.launchTimer = null;
        }
        if (proj.rafId != null) {
          cancelAnimationFrame(proj.rafId);
          proj.rafId = null;
        }
        if (settleHits && typeof onHit === 'function') {
          for (let i = proj.targetIdx; i < targets.length; i += 1) {
            const mob = targets[i];
            if (!mob || proj.hitSet.has(mob) || !(mob.hp > 0)) continue;
            proj.hitSet.add(mob);
            onHit(mob, i);
            if (!pierce) break;
          }
        }
        proj.stage?.remove();
        proj.stage = null;
        projectiles.delete(proj);
        finish();
      },
    };
    projectiles.add(proj);

    const launch = () => {
      if (proj.done) return;
      const stage = document.createElement('div');
      stage.className = 'idle-skill-fx-stage idle-skill-fx-stage--ball';
      const img = document.createElement('img');
      img.className = 'idle-skill-fx-sprite';
      img.alt = '';
      img.draggable = false;
      img.decoding = 'sync';
      stage.appendChild(img);
      fxLayer.appendChild(stage);
      proj.stage = stage;

      const spawn = fieldPointFromPlayer(fieldEl, playerEl, startOffset, facingRight);
      let x = spawn.x;
      let y = spawn.y;
      stage.style.left = `${x}px`;
      stage.style.top = `${y}px`;
      stage.style.transform = facingRight ? 'scaleX(-1)' : 'none';

      let frameIdx = 0;
      let frameAcc = 0;
      let lastTs = 0;
      const hitRadius = 36;

      const applyProjFrame = () => {
        const frame = list[frameIdx % list.length];
        if (!frame?.src) return;
        img.style.setProperty('--ox', `${frame.origin?.[0] ?? 0}px`);
        img.style.setProperty('--oy', `${frame.origin?.[1] ?? 0}px`);
        if (img.dataset.src !== frame.src) {
          img.dataset.src = frame.src;
          img.src = frame.src;
        }
        img.hidden = false;
      };

      const endFlight = () => {
        if (proj.done) return;
        proj.done = true;
        if (proj.rafId != null) {
          cancelAnimationFrame(proj.rafId);
          proj.rafId = null;
        }
        stage.remove();
        proj.stage = null;
        projectiles.delete(proj);
        finish();
      };

      const currentTargetPoint = () => {
        while (proj.targetIdx < targets.length) {
          const mob = targets[proj.targetIdx];
          if (!mob || proj.hitSet.has(mob) || !(mob.hp > 0)) {
            proj.targetIdx += 1;
            continue;
          }
          const mp = fieldPointFromMob(fieldEl, mob);
          if (!mp) {
            proj.targetIdx += 1;
            continue;
          }
          return { mob, mp };
        }
        return null;
      };

      ensurePreloaded(list).then(() => {
        if (proj.done) return;
        applyProjFrame();
        const stepFrame = (ts) => {
          if (proj.done) return;
          if (!lastTs) lastTs = ts;
          const dt = Math.min(50, Math.max(0, ts - lastTs));
          lastTs = ts;
          frameAcc += dt;

          const frameDelay = Math.max(1, Number(list[frameIdx % list.length]?.delay) || 60);
          if (frameAcc >= frameDelay) {
            frameAcc -= frameDelay;
            frameIdx += 1;
            applyProjFrame();
          }

          const cur = currentTargetPoint();
          if (!cur) {
            endFlight();
            return;
          }

          const dx = cur.mp.x - x;
          const dy = cur.mp.y - y;
          const dist = Math.hypot(dx, dy) || 1;
          const step = Math.min(dist, flySpeed * dt);
          x += (dx / dist) * step;
          y += (dy / dist) * step;
          stage.style.left = `${x}px`;
          stage.style.top = `${y}px`;

          if (dist <= hitRadius) {
            proj.hitSet.add(cur.mob);
            if (typeof onHit === 'function') onHit(cur.mob, proj.targetIdx);
            proj.targetIdx += 1;
            if (!pierce) {
              endFlight();
              return;
            }
          }

          proj.rafId = requestAnimationFrame(stepFrame);
        };
        proj.rafId = requestAnimationFrame(stepFrame);
      });
    };

    const delay = scaleRealMs(Math.max(0, Number(startDelayMs) || 0));
    if (delay > 0) proj.launchTimer = setTimeout(launch, delay);
    else launch();
    return true;
  }

  /**
   * 召喚物：固定錨點播放（可 loop stand）；回傳 instance id，可用 stopSummon 清掉。
   */
  function playAtField(opts = {}) {
    const {
      fieldEl,
      frames,
      x = 0,
      y = 0,
      loop = false,
      className = 'idle-skill-fx-stage idle-skill-fx-stage--summon',
      mirrorX = false,
      zIndex,
      onDone,
    } = opts;
    const list = (frames || []).filter((f) => f && f.src);
    if (!fieldEl || !list.length) {
      if (typeof onDone === 'function') onDone();
      return null;
    }
    const fxLayer = getSkillFxLayer(fieldEl);
    if (!fxLayer) {
      if (typeof onDone === 'function') onDone();
      return null;
    }
    const id = playFrames(fxLayer, list, {
      x,
      y,
      loop,
      className,
      mirrorX,
      zIndex,
      forcePlay: !!opts.forcePlay,
    });
    if (!loop && id != null && typeof onDone === 'function') {
      const dur = framesDurationMs(list);
      setTimeout(onDone, scaleRealMs(Math.max(30, dur)));
    }
    return id;
  }

  function stopFx(id) {
    if (id == null) return;
    for (const inst of instances) {
      if (inst.id === id) {
        destroy(inst);
        return;
      }
    }
  }

  /** @deprecated 舊名 → playShootObj */
  function playProjectile(opts = {}) {
    return playShootObj({
      ...opts,
      mobs: opts.mob ? [opts.mob] : (opts.mobs || []),
      frames: opts.frames,
      onHit: () => {
        if (typeof opts.onArrive === 'function') opts.onArrive();
      },
      onDone: opts.onDone,
      pierce: false,
      maxTargets: 1,
    });
  }

  function stopAll() {
    [...instances].forEach(destroy);
    [...projectiles].forEach((p) => {
      try { p.cancel(false); } catch (_) { /* ignore */ }
    });
    projectiles.clear();
    scrubTransientFxDom({ includeLoop: true });
  }

  /**
   * 掛機軟釋放：清投射物／單次特效，保留 loop（召喚／掛怪狀態）。
   * settleHits=true 時未命中目標會立刻結算，避免 GC 吃掉傷害。
   */
  function stopTransientFx(opts = {}) {
    const settleHits = opts.settleHits !== false;
    [...projectiles].forEach((p) => {
      try { p.cancel(settleHits); } catch (_) { /* ignore */ }
    });
    projectiles.clear();
    [...instances].forEach((inst) => {
      if (inst.loop) return;
      destroy(inst);
    });
    scrubTransientFxDom({ includeLoop: false });
  }

  function scrubTransientFxDom({ includeLoop = false } = {}) {
    const sel = includeLoop
      ? '.idle-hunt-skill-fx'
      : [
        '.idle-skill-fx-stage--shootobj',
        '.idle-skill-fx-stage--ball',
        '.idle-skill-fx-stage--hit',
        '.idle-skill-fx-stage--cast',
        '.idle-skill-fx-stage--blizzard-tile',
        '.idle-skill-fx-stage--blizzard-fa',
        '.idle-skill-fx-stage--blizzard-fa-hit',
        '.idle-skill-fx-stage--blizzard-fa-fallback',
      ].join(',');
    try {
      document.querySelectorAll(sel).forEach((el) => {
        if (includeLoop) {
          el.replaceChildren();
          return;
        }
        // 保留仍在 instances 的 loop stage
        if (el.classList?.contains('idle-skill-fx-stage--summon')) return;
        const keep = [...instances].some((inst) => inst.stage === el);
        if (keep) return;
        el.remove();
      });
    } catch (_) { /* ignore */ }
  }

  function clearLocalPreloadCache() {
    preloadCache.clear();
  }

  function activeInstanceCount() {
    return instances.size + projectiles.size;
  }

  function collectFrameUrls(frames, into) {
    const out = into || new Set();
    (frames || []).forEach((f) => {
      if (f?.src) out.add(String(f.src));
    });
    return out;
  }

  /** 收集技能 fx 內所有會播的圖（含 shootobj／召喚／掛怪） */
  function collectFxUrls(fx, into) {
    const out = into || new Set();
    if (!fx || typeof fx !== 'object') return out;
    const frameLists = [
      fx.effect, fx.effect0, fx.hit, fx.ball, fx.special,
      fx.tile, fx.prepare, fx.keydown, fx.keydown0, fx.keydownend,
    ];
    frameLists.forEach((list) => collectFrameUrls(list, out));
    (fx.shootobj?.layers || []).forEach((layer) => collectFrameUrls(layer?.frames, out));
    (fx.summonAttacks || []).forEach((list) => collectFrameUrls(list, out));
    if (fx.summonVisual) {
      collectFrameUrls(fx.summonVisual.summoned, out);
      collectFrameUrls(fx.summonVisual.stand, out);
      collectFrameUrls(fx.summonVisual.attack, out);
    }
    if (fx.mob) {
      Object.keys(fx.mob).forEach((k) => collectFrameUrls(fx.mob[k], out));
    }
    return out;
  }

  function collectSkillUrls(skill, into) {
    const out = into || new Set();
    if (!skill) return out;
    collectFxUrls(skill.fx, out);
    if (typeof SkillCatalog !== 'undefined') {
      if (skill.enhancedSkillId) {
        collectFxUrls(SkillCatalog.getSkill?.(String(skill.enhancedSkillId))?.fx, out);
      }
      if (skill.summonSkillId) {
        collectFxUrls(SkillCatalog.getSkill?.(String(skill.summonSkillId))?.fx, out);
      }
    }
    return out;
  }

  /**
   * 預熱指定技能圖集（decode 完成後再進戰鬥，避免 github.io 邊播邊載造成抽搐／晚跳）
   * @returns {Promise<void>}
   */
  function warmUpSkills(skillsOrIds) {
    const urls = new Set();
    (skillsOrIds || []).forEach((item) => {
      if (!item) return;
      if (typeof item === 'object' && item.fx) {
        collectSkillUrls(item, urls);
        return;
      }
      const id = String(item);
      const skill = typeof SkillCatalog !== 'undefined' ? SkillCatalog.getSkill?.(id) : null;
      if (skill) collectSkillUrls(skill, urls);
    });
    if (!urls.size) return Promise.resolve();
    return ensurePreloaded([...urls].map((src) => ({ src }))).then(() => {});
  }

  /** 預熱技能欄 + 連鎖 +（可選）清單 */
  function warmUpCombatLoadout(extraIds = []) {
    const ids = new Set();
    if (typeof CharacterSkills !== 'undefined') {
      (CharacterSkills.currentLoadout?.() || []).forEach((id) => {
        if (id) ids.add(String(id));
      });
      (CharacterSkills.currentSkillLink?.() || []).forEach((id) => {
        if (id) ids.add(String(id));
      });
    }
    (extraIds || []).forEach((id) => {
      if (id) ids.add(String(id));
    });
    // 終極攻擊被動常掛在戰鬥裡
    if (typeof SkillCatalog !== 'undefined') {
      ['1120003', '1110000', '1220010'].forEach((id) => {
        if (SkillCatalog.getSkill?.(id) && CharacterSkills?.getLevel?.(id) > 0) {
          ids.add(id);
        }
      });
    }
    return warmUpSkills([...ids]);
  }

  return {
    playFrames,
    playOnPlayer,
    playOnMob,
    playOnMobHead,
    playShootObj,
    playBall,
    playAtField,
    playProjectile,
    framesDurationMs,
    stopFx,
    stopAll,
    stopTransientFx,
    clearLocalPreloadCache,
    activeInstanceCount,
    ensurePreloaded,
    collectFxUrls,
    collectSkillUrls,
    warmUpSkills,
    warmUpCombatLoadout,
    resolveMobCenterLocal,
    fieldPointFromPlayer,
    fieldPointFromMob,
    playerFacingRight,
    activeCombatField,
    getSkillFxLayer,
  };
})();

if (typeof window !== 'undefined') {
  window.SkillEffectPlayer = SkillEffectPlayer;
}
