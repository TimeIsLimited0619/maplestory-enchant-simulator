/**
 * 技能 effect／hit／shootobj／循環特效播放
 */
const SkillEffectPlayer = (() => {
  const instances = new Set();
  /** @type {Set<{ cancel: (settleHits?: boolean) => void }>} */
  const projectiles = new Set();
  const preloadCache = new Map();
  let nextId = 1;
  let sharedRaf = null;
  const fieldPtCache = new Map();
  let fieldPtCacheFrame = 0;

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
    inst.stage?.remove();
    instances.delete(inst);
    if (!instances.size) stopSharedLoop();
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

  function tickInstance(inst, ts) {
    if (!instances.has(inst)) return;
    if (!inst.lastTs) inst.lastTs = ts;
    const dt = Math.max(0, ts - inst.lastTs);
    inst.lastTs = ts;
    inst.acc += dt;
    if (inst.loop || inst.resolveAnchor) {
      if (!syncAnchor(inst)) return;
    }

    const frames = inst.frames;
    while (frames.length > 0) {
      const frame = frames[inst.frameIdx];
      const delay = Math.max(1, Number(frame?.delay) || 90);
      if (inst.acc < delay) break;
      inst.acc -= delay;
      inst.frameIdx += 1;
      if (inst.frameIdx >= frames.length) {
        if (inst.loop) {
          const from = Math.max(0, Math.min(inst.loopFrom || 0, frames.length - 1));
          inst.frameIdx = from;
        } else {
          destroy(inst);
          return;
        }
      }
      const shown = applyFrame(inst);
      if (frames[inst.frameIdx]?.src && !shown) break;
    }
  }

  function startSharedLoop() {
    if (sharedRaf != null) return;
    sharedRaf = requestAnimationFrame(sharedTick);
  }

  function stopSharedLoop() {
    if (sharedRaf == null) return;
    cancelAnimationFrame(sharedRaf);
    sharedRaf = null;
  }

  function sharedTick(ts) {
    sharedRaf = requestAnimationFrame(sharedTick);
    instances.forEach((inst) => tickInstance(inst, ts));
    if (!instances.size) stopSharedLoop();
  }

  function startInstance(inst) {
    if (!instances.has(inst)) return;
    if (typeof inst.resolveAnchor === 'function' && !inst.loop) {
      const a = inst.resolveAnchor();
      if (a && Number.isFinite(a.x) && Number.isFinite(a.y)) {
        inst.fixedX = a.x;
        inst.fixedY = a.y;
        inst.resolveAnchor = null;
      }
    }
    syncAnchor(inst);
    applyFrame(inst);
    startSharedLoop();
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
    img.decoding = 'async';
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
      loopFrom: Math.max(0, Math.floor(Number(opts.loopFrom) || 0)),
      stopWhenAnchorLost: !!opts.stopWhenAnchorLost,
    };
    instances.add(inst);
    return inst;
  }

  function framesAreReady(list) {
    return list.every((f) => !f.src || decodedImage(f.src));
  }

  function playFrames(parentEl, frames, opts = {}) {
    if (typeof document !== 'undefined' && document.hidden && !opts.forcePlay) {
      return null;
    }
    const list = (frames || []).filter((f) => f && (f.src || f.delay));
    if (!parentEl || !list.length) return null;
    const inst = createInstance(parentEl, list, opts);
    if (!inst) return null;
    if (framesAreReady(list)) startInstance(inst);
    else ensurePreloaded(list).then(() => startInstance(inst));
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
      ? (parseFloat(actor.style.getPropertyValue('--boss-sprite-scale'))
        || parseFloat(getComputedStyle(actor).getPropertyValue('--boss-sprite-scale'))
        || 2)
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
      const stage = field.querySelector('.idle-hunt-stage')
        || field.querySelector('.idle-boss-stage--player')
        || field.querySelector('.idle-boss-stage--mobs');
      if (stage) stage.insertAdjacentElement('afterend', layer);
      else field.appendChild(layer);
    }
    return layer;
  }

  /** 地面領域等：插在怪物 stage 之前，整層畫在怪物後面 */
  function getSkillFxBehindLayer(fieldEl) {
    const field = fieldEl || activeCombatField();
    if (!field) return null;
    let layer = field.querySelector('.idle-hunt-skill-fx-behind');
    if (!layer) {
      layer = document.createElement('div');
      layer.className = 'idle-hunt-skill-fx-behind';
      layer.setAttribute('aria-hidden', 'true');
      const mobStage = field.querySelector('.idle-hunt-stage')
        || field.querySelector('.idle-boss-stage--mobs');
      if (mobStage) mobStage.insertAdjacentElement('beforebegin', layer);
      else {
        const front = field.querySelector('.idle-hunt-skill-fx');
        if (front) front.insertAdjacentElement('beforebegin', layer);
        else field.appendChild(layer);
      }
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
    const layer = opts.behind
      ? getSkillFxBehindLayer(fieldEl)
      : getSkillFxLayer(fieldEl);
    if (!layer) return null;
    const facingRight = opts.mirrorX != null ? !!opts.mirrorX : playerFacingRight(player);
    return playFrames(layer, frames, {
      className: opts.className || 'idle-skill-fx-stage idle-skill-fx-stage--cast',
      mirrorX: facingRight,
      loop: !!opts.loop,
      zIndex: opts.zIndex,
      forcePlay: !!opts.forcePlay,
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
    let actor = uid
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
        let live = actor;
        if (!live?.isConnected) {
          live = uid
            ? fieldEl.querySelector(`.idle-actor--mob[data-uid="${uid}"]`)
            : null;
          actor = live;
        }
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
        const pt = fieldPointFromMob(fieldEl, mob, live);
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

  /**
   * 與 playOnPlayer 同一腳底錨，再對到指定 effect 幀圖心
   *（朝右時與施法特效一樣 scaleX(-1)）。
   */
  function fieldPointFromPlayerEffect(fieldEl, playerEl, frame, facingRight = true) {
    let feet = null;
    if (typeof Paperdoll !== 'undefined' && playerEl
      && typeof Paperdoll.getHuntFeetAnchor === 'function') {
      feet = localAnchorToField(fieldEl, playerEl, Paperdoll.getHuntFeetAnchor(playerEl));
    }
    if (!feet) feet = fieldPointFromPlayer(fieldEl, playerEl, [0, 0], facingRight);
    const ox = Number(frame?.origin?.[0]) || 0;
    const oy = Number(frame?.origin?.[1]) || 0;
    const loaded = decodedImage(frame?.src);
    const w = loaded?.naturalWidth || 0;
    const h = loaded?.naturalHeight || 0;
    const cx = w > 0 ? w / 2 : ox;
    const cy = h > 0 ? h / 2 : Math.max(0, oy * 0.4);
    const lx = cx - ox;
    const ly = cy - oy;
    return {
      x: facingRight ? (feet.x - lx) : (feet.x + lx),
      y: feet.y + ly,
    };
  }

  function fieldPointFromMob(fieldEl, mob, actorHint) {
    const uid = mob?.uid != null ? String(mob.uid) : '';
    const frame = Math.floor(performance.now() / 16);
    if (frame !== fieldPtCacheFrame) {
      fieldPtCache.clear();
      fieldPtCacheFrame = frame;
    }
    const cacheKey = `${fieldEl?.id || ''}:${uid}`;
    if (uid && fieldPtCache.has(cacheKey)) return fieldPtCache.get(cacheKey);

    const actor = actorHint?.isConnected
      ? actorHint
      : (uid ? fieldEl?.querySelector(`.idle-actor--mob[data-uid="${uid}"]`) : null);
    let result = null;
    if (actor) {
      const local = resolveMobCenterLocal(actor);
      const sx = parseFloat(actor.style.left);
      const sy = parseFloat(actor.style.top);
      if (Number.isFinite(sx) && Number.isFinite(sy)) {
        result = {
          x: sx + (Number(local.x) || 0),
          y: sy + (Number(local.y) || 0),
          mob,
          actor,
        };
      } else if (fieldEl) {
        const fr = fieldEl.getBoundingClientRect();
        const ar = actor.getBoundingClientRect();
        result = {
          x: ar.left - fr.left + (Number(local.x) || 0),
          y: ar.top - fr.top + (Number(local.y) || 0),
          mob,
          actor,
        };
      }
    } else if (typeof IdleHunt !== 'undefined' && typeof IdleHunt.mobFieldPoint === 'function') {
      const pt = IdleHunt.mobFieldPoint(mob);
      if (pt && Number.isFinite(pt.x) && Number.isFinite(pt.y)) {
        result = { x: pt.x, y: pt.y, mob, actor: null };
      }
    }
    if (uid && result) fieldPtCache.set(cacheKey, result);
    return result;
  }

  function listShootMovePaths(moveList) {
    if (!moveList || typeof moveList !== 'object') return [];
    return Object.keys(moveList)
      .filter((k) => /^p\d+$/i.test(k))
      .sort((a, b) => (Number(a.slice(1)) || 0) - (Number(b.slice(1)) || 0))
      .map((k) => (Array.isArray(moveList[k]) ? moveList[k][0] : null))
      .filter(Boolean);
  }

  /**
   * 同時散射（爆破鏢）：每條都有明顯水平分量、Y 只是小幅錯位。
   * 八方位選向（靈氣之刃等）的 p1/p3 幾乎純垂直，不可當成散射一起打。
   */
  function isHorizontalScatterPaths(paths) {
    if (!Array.isArray(paths) || paths.length < 2) return false;
    return paths.every((p) => {
      const x = Math.abs(Number(p?.pos?.[0]) || 0);
      const y = Math.abs(Number(p?.pos?.[1]) || 0);
      return x > 100 && y < 150;
    });
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

    // moveList.p1／p2／p3：僅水平散射（爆破鏢）同時多彈；八方位選向只走單一路徑
    if (!opts._singlePath) {
      const paths = listShootMovePaths(moveList);
      if (isHorizontalScatterPaths(paths)) {
        let left = paths.length;
        let claimed = false;
        paths.forEach((path, i) => {
          playShootObj({
            ...opts,
            _singlePath: true,
            moveList: { p1: [path] },
            startOffset: [
              Number(startOffset?.[0]) || 0,
              (Number(startOffset?.[1]) || 0) + (Number(path?.pos?.[1]) || 0),
            ],
            startDelayMs: (Number(startDelayMs) || 0) + i * 40,
            onHit: (mob, idx) => {
              if (!pierce && claimed) return;
              claimed = true;
              if (typeof onHit === 'function') onHit(mob, idx);
            },
            onDone: () => {
              left -= 1;
              if (left <= 0) finish();
            },
          });
        });
        return true;
      }
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

  function bezier2(p0, p1, p2, t) {
    const u = 1 - t;
    return {
      x: u * u * p0.x + 2 * u * t * p1.x + t * t * p2.x,
      y: u * u * p0.y + 2 * u * t * p1.y + t * t * p2.y,
    };
  }

  /** 圓弧控制點：中點旁側凸出，讓追蹤球走弧線而不是直線 */
  function seekerArcCtrl(from, to, sign) {
    const dx = (to?.x || 0) - (from?.x || 0);
    const dy = (to?.y || 0) - (from?.y || 0);
    const len = Math.hypot(dx, dy) || 1;
    const mx = (from?.x || 0) + dx * 0.42;
    const my = (from?.y || 0) + dy * 0.42;
    const nx = -dy / len;
    const ny = dx / len;
    const bulge = Math.min(120, Math.max(36, len * 0.32));
    const s = sign < 0 ? -1 : 1;
    return {
      x: mx + nx * s * bulge,
      y: my + ny * s * bulge - bulge * 0.18,
    };
  }

  /**
   * 刻印飛鏢：從玩家以隨機角度／弧線飛向目標（非水平 shootobj）。
   */
  function playRandomArcVolley(opts = {}) {
    const {
      fieldEl,
      playerEl,
      mobs = [],
      frames,
      count = 1,
      startOffset = [-48, -36],
      facingRight = true,
      onHit,
      onDone,
    } = opts;
    const list = (frames || []).filter((f) => f && f.src);
    const targets = (mobs || []).filter((m) => m && Number(m.hp) > 0);
    const starCount = Math.max(1, Math.floor(Number(count) || 1));

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

    if (typeof document !== 'undefined' && document.hidden) {
      for (let i = 0; i < starCount; i += 1) {
        const mob = targets[i % targets.length];
        if (typeof onHit === 'function') onHit(mob, i);
      }
      finish();
      return true;
    }

    const fxLayer = getSkillFxLayer(fieldEl);
    if (!fxLayer) {
      finish();
      return null;
    }

    const spawn = (typeof fieldPointFromPlayer === 'function')
      ? fieldPointFromPlayer(fieldEl, playerEl, startOffset, facingRight)
      : { x: 80, y: 120 };
    const speed = (0.72 + Math.random() * 0.28) * gameSpeedMult();
    let left = starCount;
    const kids = [];
    const group = {
      cancel(settleHits) {
        kids.forEach((k) => {
          try { k.cancel(settleHits); } catch (_) { /* ignore */ }
        });
      },
    };

    const markStarDone = () => {
      left -= 1;
      if (left <= 0) {
        projectiles.delete(group);
        finish();
      }
    };

    const launchOne = (starIndex, delayMs) => {
      const mob = targets[starIndex % targets.length];
      const end0 = fieldPointFromMob(fieldEl, mob) || { x: spawn.x + 180, y: spawn.y };
      const dx = end0.x - spawn.x;
      const dy = end0.y - spawn.y;
      const base = Math.atan2(dy, dx);
      const sign = Math.random() < 0.5 ? -1 : 1;
      const offset = (38 + Math.random() * 78) * (Math.PI / 180);
      const ang = base + sign * offset;
      const dist = 64 + Math.random() * 120;
      const ctrl = {
        x: spawn.x + Math.cos(ang) * dist,
        y: spawn.y + Math.sin(ang) * dist - (20 + Math.random() * 70),
      };
      const rough = Math.hypot(ctrl.x - spawn.x, ctrl.y - spawn.y)
        + Math.hypot(end0.x - ctrl.x, end0.y - ctrl.y);
      const duration = Math.max(260, Math.min(640, rough / Math.max(0.35, speed)));

      const kid = {
        stage: null,
        rafId: null,
        launchTimer: null,
        done: false,
        hit: false,
        cancel(settleHits) {
          if (kid.done) return;
          kid.done = true;
          if (kid.launchTimer != null) {
            clearTimeout(kid.launchTimer);
            kid.launchTimer = null;
          }
          if (kid.rafId != null) {
            cancelAnimationFrame(kid.rafId);
            kid.rafId = null;
          }
          if (settleHits && !kid.hit && typeof onHit === 'function' && Number(mob?.hp) > 0) {
            kid.hit = true;
            onHit(mob, starIndex);
          }
          kid.stage?.remove();
          kid.stage = null;
          markStarDone();
        },
      };

      const fly = () => {
        if (kid.done) return;
        const stage = document.createElement('div');
        stage.className = 'idle-skill-fx-stage idle-skill-fx-stage--shootobj';
        const img = document.createElement('img');
        img.className = 'idle-skill-fx-sprite';
        img.alt = '';
        img.draggable = false;
        img.decoding = 'sync';
        stage.appendChild(img);
        fxLayer.appendChild(stage);
        kid.stage = stage;
        stage.style.transform = facingRight ? 'scaleX(-1)' : 'none';

        let frameIdx = 0;
        let frameAcc = 0;
        let lastTs = 0;
        let elapsed = 0;

        const applyFrame = () => {
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

        const liveEnd = () => {
          if (mob && Number(mob.hp) > 0) {
            const mp = fieldPointFromMob(fieldEl, mob);
            if (mp && Number.isFinite(mp.x)) return mp;
          }
          return end0;
        };

        ensurePreloaded(list).then(() => {
          if (kid.done) return;
          applyFrame();
          const stepFrame = (ts) => {
            if (kid.done) return;
            if (!lastTs) lastTs = ts;
            const dt = Math.min(50, Math.max(0, ts - lastTs));
            lastTs = ts;
            elapsed += dt;
            frameAcc += dt;
            const frameDelay = Math.max(1, Number(list[frameIdx % list.length]?.delay) || 60);
            if (frameAcc >= frameDelay) {
              frameAcc -= frameDelay;
              frameIdx += 1;
              applyFrame();
            }
            const u = Math.min(1, elapsed / duration);
            const t = 1 - (1 - u) * (1 - u);
            const pt = bezier2(spawn, ctrl, liveEnd(), t);
            stage.style.left = `${pt.x}px`;
            stage.style.top = `${pt.y}px`;
            if (u >= 1) {
              if (!kid.hit && typeof onHit === 'function' && Number(mob?.hp) > 0) {
                kid.hit = true;
                onHit(mob, starIndex);
              }
              kid.cancel(false);
              return;
            }
            kid.rafId = requestAnimationFrame(stepFrame);
          };
          kid.rafId = requestAnimationFrame(stepFrame);
        });
      };

      const wait = scaleRealMs(Math.max(0, Number(delayMs) || 0));
      if (wait > 0) kid.launchTimer = setTimeout(fly, wait);
      else fly();
      return kid;
    };

    for (let i = 0; i < starCount; i += 1) {
      kids.push(launchOne(i, i * (28 + Math.random() * 42)));
    }
    projectiles.add(group);
    return true;
  }

  /**
   * 挑釁契約 SecondAtom 近似：在玩家周圍圓圈留下飛鏢，稍候再飛向目標。
   * 圖幀用裝備飛鏢 bullet（不依賴 Atom dataIndex）。
   * opts.anchorAt: 'player'（預設）| 'mob'
   */
  function playStationarySeekVolley(opts = {}) {
    const {
      fieldEl,
      playerEl,
      mobs = [],
      frames,
      atoms = null,
      anchorMob = null,
      anchorAt = 'player',
      facingRight = true,
      posScale = 1,
      holdMs = 520,
      inPlace = false,
      spriteScale = 1,
      onHit,
      onDone,
    } = opts;
    const list = (frames || []).filter((f) => f && f.src);
    const targets = (mobs || []).filter((m) => m && Number(m.hp) > 0);
    // 玩家周圍均勻 6 點；半徑約介於初版與過大版之間
    const atomList = Array.isArray(atoms) && atoms.length
      ? atoms
      : (() => {
        const r = 160;
        const out = [];
        for (let i = 0; i < 6; i += 1) {
          const ang = (-90 + i * 60) * (Math.PI / 180);
          out.push({
            pos: [Math.round(Math.cos(ang) * r), Math.round(Math.sin(ang) * r)],
            rotate: i * 60,
            enableDelay: 480,
          });
        }
        return out;
      })();
    const starCount = atomList.length;

    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      if (typeof onDone === 'function') onDone();
    };

    if (!fieldEl || !list.length || !targets.length || !(starCount > 0)) {
      finish();
      return null;
    }

    if (typeof document !== 'undefined' && document.hidden) {
      for (let i = 0; i < starCount; i += 1) {
        const mob = targets[i % targets.length];
        if (typeof onHit === 'function') onHit(mob, i);
      }
      finish();
      return true;
    }

    const fxLayer = getSkillFxLayer(fieldEl);
    if (!fxLayer) {
      finish();
      return null;
    }

    const scale = Math.max(0.15, Number(posScale) || 1);
    let anchor = null;
    if (String(anchorAt) === 'mob') {
      anchor = (anchorMob && fieldPointFromMob(fieldEl, anchorMob))
        || fieldPointFromMob(fieldEl, targets[0]);
    }
    if (!anchor) {
      anchor = fieldPointFromPlayer(fieldEl, playerEl, [0, -48], facingRight)
        || { x: 120, y: 140 };
    }

    const speed = (0.78 + Math.random() * 0.22) * gameSpeedMult();
    let left = starCount;
    const kids = [];
    const group = {
      cancel(settleHits) {
        kids.forEach((k) => {
          try { k.cancel(settleHits); } catch (_) { /* ignore */ }
        });
      },
    };

    const markStarDone = () => {
      left -= 1;
      if (left <= 0) {
        projectiles.delete(group);
        finish();
      }
    };

    const spawnAt = (atom) => {
      const ox = (Number(atom?.pos?.[0]) || 0) * scale;
      const oy = (Number(atom?.pos?.[1]) || 0) * scale;
      // 以錨點為圓心，不依朝向翻轉，維持完整圓
      return {
        x: anchor.x + ox,
        y: anchor.y + oy,
      };
    };

    const launchOne = (starIndex) => {
      const atom = atomList[starIndex] || {};
      const mob = targets[starIndex % targets.length];
      const spawn = spawnAt(atom);
      const hold = scaleRealMs(Math.max(
        80,
        Number(holdMs) || Number(atom.enableDelay) || 480,
      ));
      const rotateDeg = Number(atom.rotate) || 0;

      const kid = {
        stage: null,
        rafId: null,
        holdTimer: null,
        done: false,
        hit: false,
        cancel(settleHits) {
          if (kid.done) return;
          kid.done = true;
          if (kid.holdTimer != null) {
            clearTimeout(kid.holdTimer);
            kid.holdTimer = null;
          }
          if (kid.rafId != null) {
            cancelAnimationFrame(kid.rafId);
            kid.rafId = null;
          }
          if (settleHits && !kid.hit && typeof onHit === 'function' && Number(mob?.hp) > 0) {
            kid.hit = true;
            onHit(mob, starIndex);
          }
          kid.stage?.remove();
          kid.stage = null;
          markStarDone();
        },
      };

      const placeStage = () => {
        const stage = document.createElement('div');
        stage.className = 'idle-skill-fx-stage idle-skill-fx-stage--shootobj idle-skill-fx-stage--showdown-atom';
        const img = document.createElement('img');
        img.className = 'idle-skill-fx-sprite';
        img.alt = '';
        img.draggable = false;
        img.decoding = 'sync';
        stage.appendChild(img);
        fxLayer.appendChild(stage);
        kid.stage = stage;
        stage.style.left = `${spawn.x}px`;
        stage.style.top = `${spawn.y}px`;
        const scaleAbs = Math.max(0.12, Number(spriteScale) || 1);
        const parts = [
          `scale(${facingRight ? -scaleAbs : scaleAbs}, ${scaleAbs})`,
        ];
        if (rotateDeg) parts.push(`rotate(${rotateDeg}deg)`);
        stage.style.transform = parts.join(' ');

        let frameIdx = 0;
        let frameAcc = 0;
        const applyFrame = () => {
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
        applyFrame();

        return { img, applyFrame, getFrameIdx: () => frameIdx, setFrameIdx: (n) => { frameIdx = n; }, getFrameAcc: () => frameAcc, setFrameAcc: (n) => { frameAcc = n; }, bumpFrame: (dt) => {
          frameAcc += dt;
          const frameDelay = Math.max(1, Number(list[frameIdx % list.length]?.delay) || 60);
          if (frameAcc >= frameDelay) {
            frameAcc -= frameDelay;
            frameIdx += 1;
            applyFrame();
          }
        } };
      };

      const startFly = (anim) => {
        if (kid.done || !kid.stage) return;
        const end0 = fieldPointFromMob(fieldEl, mob) || { x: spawn.x, y: spawn.y };
        const dist = Math.hypot(end0.x - spawn.x, end0.y - spawn.y) || 40;
        const duration = Math.max(180, Math.min(520, dist / Math.max(0.35, speed)));
        let lastTs = 0;
        let elapsed = 0;

        const liveEnd = () => {
          if (mob && Number(mob.hp) > 0) {
            const mp = fieldPointFromMob(fieldEl, mob);
            if (mp && Number.isFinite(mp.x)) return mp;
          }
          return end0;
        };

        const stepFrame = (ts) => {
          if (kid.done) return;
          if (!lastTs) lastTs = ts;
          const dt = Math.min(50, Math.max(0, ts - lastTs));
          lastTs = ts;
          elapsed += dt;
          anim.bumpFrame(dt);
          const u = Math.min(1, elapsed / duration);
          const t = 1 - (1 - u) * (1 - u);
          const pt = {
            x: spawn.x + (liveEnd().x - spawn.x) * t,
            y: spawn.y + (liveEnd().y - spawn.y) * t,
          };
          kid.stage.style.left = `${pt.x}px`;
          kid.stage.style.top = `${pt.y}px`;
          if (u >= 1) {
            if (!kid.hit && typeof onHit === 'function' && Number(mob?.hp) > 0) {
              kid.hit = true;
              onHit(mob, starIndex);
            }
            kid.cancel(false);
            return;
          }
          kid.rafId = requestAnimationFrame(stepFrame);
        };
        kid.rafId = requestAnimationFrame(stepFrame);
      };

      ensurePreloaded(list).then(() => {
        if (kid.done) return;
        const anim = placeStage();
        const beginFly = () => {
          if (kid.done) return;
          if (kid.rafId != null) {
            cancelAnimationFrame(kid.rafId);
            kid.rafId = null;
          }
          if (inPlace) {
            if (!kid.hit && typeof onHit === 'function' && Number(mob?.hp) > 0) {
              kid.hit = true;
              onHit(mob, starIndex);
            }
            kid.cancel(false);
            return;
          }
          startFly(anim);
        };
        if (hold > 0) {
          let lastHold = 0;
          const holdSpin = (ts) => {
            if (kid.done) return;
            if (!lastHold) lastHold = ts;
            const dt = Math.min(50, Math.max(0, ts - lastHold));
            lastHold = ts;
            anim.bumpFrame(dt);
            kid.rafId = requestAnimationFrame(holdSpin);
          };
          kid.rafId = requestAnimationFrame(holdSpin);
          kid.holdTimer = setTimeout(() => {
            kid.holdTimer = null;
            beginFly();
          }, hold);
        } else {
          beginFly();
        }
      });

      return kid;
    };

    for (let i = 0; i < starCount; i += 1) {
      kids.push(launchOne(i));
    }
    projectiles.add(group);
    return true;
  }

  /**
   * 探求者追蹤彈：圓弧飛向目標。
   * kickOutPx＞0 時先從錨點往外甩一小段，再弧線追活怪（重生用，避免原地立刻再命中）。
   * centerOrigin：true 時用圖心當錨（裁切後 PNG 對不上 WZ origin 才開）。
   */
  function playHomingVolley(opts = {}) {
    const {
      fieldEl,
      playerEl,
      mobs = [],
      frames,
      anchorAt = 'player',
      anchorMob = null,
      startOffset = [-40, -48],
      facingRight = true,
      inPlace = false,
      staggerMs = 36,
      speedPxPerMs = 0.72,
      spriteScale = 0.85,
      hitRadius = 32,
      holdMs = 70,
      centerOrigin = false,
      kickOutPx = 0,
      spawnFrame = null,
      spawnDelayMs = 0,
      onHit,
      onDone,
    } = opts;
    const list = (frames || []).filter((f) => f && f.src);
    const targets = (mobs || []).filter((m) => m && Number(m.hp) > 0);

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

    if (typeof document !== 'undefined' && document.hidden) {
      targets.forEach((mob, i) => {
        if (typeof onHit === 'function') onHit(mob, i);
      });
      finish();
      return true;
    }

    const fxLayer = getSkillFxLayer(fieldEl);
    if (!fxLayer) {
      finish();
      return null;
    }

    const speed = Math.max(0.2, Number(speedPxPerMs) || 0.72) * gameSpeedMult();
    const scaleAbs = Math.max(0.12, Number(spriteScale) || 1);
    const radius = Math.max(12, Number(hitRadius) || 32);
    let left = targets.length;
    const kids = [];
    const group = {
      cancel(settleHits) {
        kids.forEach((k) => {
          try { k.cancel(settleHits); } catch (_) { /* ignore */ }
        });
      },
    };

    const markDone = () => {
      left -= 1;
      if (left <= 0) {
        projectiles.delete(group);
        finish();
      }
    };

    const applyCenteredFrame = (img, frame) => {
      if (!frame?.src) return;
      const setOrigin = () => {
        if (centerOrigin) {
          const w = img.naturalWidth || 0;
          const h = img.naturalHeight || 0;
          if (w > 0 && h > 0) {
            img.style.setProperty('--ox', `${Math.round(w / 2)}px`);
            img.style.setProperty('--oy', `${Math.round(h / 2)}px`);
            return;
          }
        }
        img.style.setProperty('--ox', `${frame.origin?.[0] ?? 0}px`);
        img.style.setProperty('--oy', `${frame.origin?.[1] ?? 0}px`);
      };
      if (img.dataset.src !== frame.src) {
        img.dataset.src = frame.src;
        img.onload = setOrigin;
        img.src = frame.src;
      }
      setOrigin();
      img.hidden = false;
    };

    const spawnPointFor = (starIndex, mob) => {
      if (String(anchorAt) === 'mob') {
        const pt = (anchorMob && fieldPointFromMob(fieldEl, anchorMob))
          || fieldPointFromMob(fieldEl, mob);
        if (pt) return { x: pt.x, y: pt.y };
      }
      if (spawnFrame?.src) {
        const pt = fieldPointFromPlayerEffect(fieldEl, playerEl, spawnFrame, facingRight);
        if (pt && Number.isFinite(pt.x)) return { x: pt.x, y: pt.y };
      }
      const spread = (starIndex - (targets.length - 1) / 2) * 14;
      return fieldPointFromPlayer(
        fieldEl,
        playerEl,
        [(Number(startOffset?.[0]) || 0) + spread, Number(startOffset?.[1]) || 0],
        facingRight,
      ) || { x: 80, y: 120 };
    };

    const launchOne = (starIndex) => {
      const mob = targets[starIndex];
      const kid = {
        stage: null,
        rafId: null,
        holdTimer: null,
        launchTimer: null,
        done: false,
        hit: false,
        cancel(settleHits) {
          if (kid.done) return;
          kid.done = true;
          if (kid.holdTimer != null) {
            clearTimeout(kid.holdTimer);
            kid.holdTimer = null;
          }
          if (kid.launchTimer != null) {
            clearTimeout(kid.launchTimer);
            kid.launchTimer = null;
          }
          if (kid.rafId != null) {
            cancelAnimationFrame(kid.rafId);
            kid.rafId = null;
          }
          if (settleHits && !kid.hit && typeof onHit === 'function' && Number(mob?.hp) > 0) {
            kid.hit = true;
            onHit(mob, starIndex);
          }
          kid.stage?.remove();
          kid.stage = null;
          markDone();
        },
      };

      const start = () => {
        if (kid.done) return;
        let spawn = spawnPointFor(starIndex, mob);
        const stage = document.createElement('div');
        stage.className = 'idle-skill-fx-stage idle-skill-fx-stage--shootobj';
        const img = document.createElement('img');
        img.className = 'idle-skill-fx-sprite';
        img.alt = '';
        img.draggable = false;
        img.decoding = 'sync';
        stage.appendChild(img);
        fxLayer.appendChild(stage);
        kid.stage = stage;
        let x = spawn.x;
        let y = spawn.y;
        stage.style.left = `${x}px`;
        stage.style.top = `${y}px`;
        stage.style.transform = `scale(${scaleAbs})`;
        stage.style.transformOrigin = '0 0';

        let frameIdx = 0;
        let frameAcc = 0;
        const applyFrame = () => applyCenteredFrame(img, list[frameIdx % list.length]);
        const liveEnd = () => {
          if (mob && Number(mob.hp) > 0) {
            const mp = fieldPointFromMob(fieldEl, mob);
            if (mp && Number.isFinite(mp.x)) return mp;
          }
          return spawn;
        };
        const strike = () => {
          if (kid.hit || kid.done) return;
          if (typeof onHit === 'function') {
            kid.hit = true;
            onHit(mob, starIndex);
          }
          kid.cancel(false);
        };
        const kickDist = Math.max(0, Number(kickOutPx) || 0);
        const flyArc = () => {
          if (kid.done) return;
          const sign = starIndex % 2 === 0 ? -1 : 1;
          const ang = kickDist > 0
            ? (Math.PI * 2 * ((starIndex * 0.37 + Math.random()) % 1))
            : (facingRight ? -0.55 : 0.55) + sign * 0.35;
          const kickPt = {
            x: spawn.x + Math.cos(ang) * kickDist,
            y: spawn.y + Math.sin(ang) * (kickDist * 0.85) - 8,
          };
          const kickCtrl = {
            x: spawn.x + Math.cos(ang + sign * 0.55) * kickDist * 0.58,
            y: spawn.y + Math.sin(ang + sign * 0.55) * kickDist * 0.58 - 10,
          };
          const outDur = Math.max(100, Math.min(200, kickDist / Math.max(0.28, speed)));
          let phase = kickDist > 0 ? 'out' : 'home';
          let elapsed = 0;
          let lastTs = 0;
          let homeP0 = spawn;
          let homeCtrl = spawn;
          let homeDur = 400;
          const armHome = (from) => {
            homeP0 = { x: from.x, y: from.y };
            const end = liveEnd();
            homeCtrl = seekerArcCtrl(homeP0, end, sign);
            const rough = Math.hypot(homeCtrl.x - homeP0.x, homeCtrl.y - homeP0.y)
              + Math.hypot(end.x - homeCtrl.x, end.y - homeCtrl.y);
            homeDur = Math.max(240, Math.min(760, rough / Math.max(0.32, speed)));
          };
          if (phase === 'home') armHome(spawn);

          const stepFrame = (ts) => {
            if (kid.done) return;
            if (!lastTs) lastTs = ts;
            const dt = Math.min(50, Math.max(0, ts - lastTs));
            lastTs = ts;
            frameAcc += dt;
            const frameDelay = Math.max(1, Number(list[frameIdx % list.length]?.delay) || 60);
            if (frameAcc >= frameDelay) {
              frameAcc -= frameDelay;
              frameIdx += 1;
              applyFrame();
            }
            elapsed += dt;
            let pt;
            if (phase === 'out') {
              const u = Math.min(1, elapsed / Math.max(1, outDur));
              pt = bezier2(spawn, kickCtrl, kickPt, u);
              if (u >= 1) {
                phase = 'home';
                elapsed = 0;
                armHome(kickPt);
              }
            } else {
              const u = Math.min(1, elapsed / Math.max(1, homeDur));
              const t = 1 - (1 - u) * (1 - u);
              pt = bezier2(homeP0, homeCtrl, liveEnd(), t);
              const end = liveEnd();
              const dist = Math.hypot(end.x - pt.x, end.y - pt.y);
              if (u >= 1 || (u > 0.78 && dist <= radius)) {
                x = pt.x;
                y = pt.y;
                stage.style.left = `${x}px`;
                stage.style.top = `${y}px`;
                strike();
                return;
              }
            }
            x = pt.x;
            y = pt.y;
            stage.style.left = `${x}px`;
            stage.style.top = `${y}px`;
            kid.rafId = requestAnimationFrame(stepFrame);
          };
          kid.rafId = requestAnimationFrame(stepFrame);
        };

        ensurePreloaded(spawnFrame?.src ? list.concat(spawnFrame) : list).then(() => {
          if (kid.done) return;
          spawn = spawnPointFor(starIndex, mob);
          x = spawn.x;
          y = spawn.y;
          stage.style.left = `${x}px`;
          stage.style.top = `${y}px`;
          applyFrame();
          if (inPlace && !(kickDist > 0)) {
            const wait = scaleRealMs(Math.max(40, Number(holdMs) || 70));
            let lastHold = 0;
            const holdSpin = (ts) => {
              if (kid.done) return;
              if (!lastHold) lastHold = ts;
              const dt = Math.min(50, Math.max(0, ts - lastHold));
              lastHold = ts;
              frameAcc += dt;
              const frameDelay = Math.max(1, Number(list[frameIdx % list.length]?.delay) || 60);
              if (frameAcc >= frameDelay) {
                frameAcc -= frameDelay;
                frameIdx += 1;
                applyFrame();
              }
              kid.rafId = requestAnimationFrame(holdSpin);
            };
            kid.rafId = requestAnimationFrame(holdSpin);
            kid.holdTimer = setTimeout(() => {
              kid.holdTimer = null;
              strike();
            }, wait);
            return;
          }
          flyArc();
        });
      };

      const wait = scaleRealMs(
        Math.max(0, starIndex * (Number(staggerMs) || 0)) + Math.max(0, Number(spawnDelayMs) || 0),
      );
      if (wait > 0) kid.launchTimer = setTimeout(start, wait);
      else start();
      return kid;
    };

    for (let i = 0; i < targets.length; i += 1) {
      kids.push(launchOne(i));
    }
    projectiles.add(group);
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
      loopFrom = 0,
      className = 'idle-skill-fx-stage idle-skill-fx-stage--summon',
      mirrorX = false,
      zIndex,
      behind = false,
      onDone,
    } = opts;
    const list = (frames || []).filter((f) => f && f.src);
    if (!fieldEl || !list.length) {
      if (typeof onDone === 'function') onDone();
      return null;
    }
    const fxLayer = behind
      ? getSkillFxBehindLayer(fieldEl)
      : getSkillFxLayer(fieldEl);
    if (!fxLayer) {
      if (typeof onDone === 'function') onDone();
      return null;
    }
    const id = playFrames(fxLayer, list, {
      x,
      y,
      loop,
      loopFrom,
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
    stopSharedLoop();
    fieldPtCache.clear();
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
      ? '.idle-hunt-skill-fx, .idle-hunt-skill-fx-behind'
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
    playRandomArcVolley,
    playStationarySeekVolley,
    playHomingVolley,
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
    getSkillFxBehindLayer,
  };
})();

if (typeof window !== 'undefined') {
  window.SkillEffectPlayer = SkillEffectPlayer;
}
