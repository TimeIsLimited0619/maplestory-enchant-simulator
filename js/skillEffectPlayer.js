/**
 * 技能 effect／hit／shootobj／循環特效播放
 */
const SkillEffectPlayer = (() => {
  const FX_OPACITY_KEY = 'idle.display.fxOpacity.v1';
  const DEFAULT_FX_OPACITY = { skill: 1, hit: 1 };
  let fxOpacity = { ...DEFAULT_FX_OPACITY };

  function clampOpacity(raw, fallback = 1) {
    const n = Number(raw);
    if (!Number.isFinite(n)) return fallback;
    return Math.max(0, Math.min(1, n));
  }

  function readFxOpacity() {
    try {
      const raw = localStorage.getItem(FX_OPACITY_KEY);
      if (!raw) return { ...DEFAULT_FX_OPACITY };
      const data = JSON.parse(raw);
      return {
        skill: clampOpacity(data?.skill, 1),
        hit: clampOpacity(data?.hit, 1),
      };
    } catch (_) {
      return { ...DEFAULT_FX_OPACITY };
    }
  }

  function writeFxOpacity(next) {
    fxOpacity = {
      skill: clampOpacity(next?.skill, fxOpacity.skill),
      hit: clampOpacity(next?.hit, fxOpacity.hit),
    };
    try {
      localStorage.setItem(FX_OPACITY_KEY, JSON.stringify(fxOpacity));
    } catch (_) { /* ignore */ }
    return { ...fxOpacity };
  }

  function applyFxOpacityToDom() {
    const root = document.documentElement;
    if (!root?.style) return;
    root.style.setProperty('--idle-skill-fx-opacity', String(fxOpacity.skill));
    root.style.setProperty('--idle-mob-hit-fx-opacity', String(fxOpacity.hit));
  }

  function getFxOpacity() {
    return { ...fxOpacity };
  }

  function setFxOpacity(partial = {}) {
    writeFxOpacity({
      skill: partial.skill != null ? partial.skill : fxOpacity.skill,
      hit: partial.hit != null ? partial.hit : fxOpacity.hit,
    });
    applyFxOpacityToDom();
    return getFxOpacity();
  }

  function initFxOpacity() {
    fxOpacity = readFxOpacity();
    applyFxOpacityToDom();
  }

  initFxOpacity();
  const instances = new Set();
  /** @type {Set<{ cancel: (settleHits?: boolean) => void }>} */
  const projectiles = new Set();
  const preloadCache = new Map();
  let nextId = 1;
  let sharedRaf = null;
  const fieldPtCache = new Map();
  let fieldPtCacheFrame = 0;

  /** 探求者等追蹤球同時上限；超過刪最舊 */
  const HOMING_ORB_CAP = 20;
  /** 單次特效 stage 上限（不含召喚 loop） */
  const MAX_FX_INSTANCES = 48;
  /** 飛行體／volley 同時上限 */
  const MAX_PROJECTILES = 36;
  /** @type {Array<{ done?: boolean, cancel: (settleHits?: boolean) => void, _culled?: boolean }>} */
  const activeHomingOrbs = [];
  /** 受擊 overlay：全場同時只播一隻（技能本體／飛行體不限） */
  const HIT_FX_GAP_MS = 70;
  let lastHitFxAt = 0;
  /** 飛行體／球體共用 tick，避免每顆一條 rAF */
  const movers = new Set();
  let lastSharedTs = 0;

  function registerMover(mover) {
    if (!mover || typeof mover.tick !== 'function') return mover;
    movers.add(mover);
    startSharedLoop();
    return mover;
  }

  function unregisterMover(mover) {
    if (!mover) return;
    mover.done = true;
    movers.delete(mover);
  }

  function stopHostMover(host) {
    if (!host) return;
    if (host.mover) {
      host.mover.done = true;
      movers.delete(host.mover);
      host.mover = null;
    }
    if (host.rafId != null) {
      cancelAnimationFrame(host.rafId);
      host.rafId = null;
    }
  }

  function startHostLoop(host, stepFrame) {
    if (!host || typeof stepFrame !== 'function') return;
    stopHostMover(host);
    const mover = {
      done: false,
      tick(_dt, ts) {
        if (mover.done || host.done) {
          unregisterMover(mover);
          if (host.mover === mover) host.mover = null;
          return;
        }
        stepFrame(ts);
      },
    };
    host.mover = mover;
    registerMover(mover);
  }

  function cullOldestFx() {
    while (instances.size >= MAX_FX_INSTANCES) {
      let victim = null;
      for (const inst of instances) {
        if (inst.loop) continue;
        victim = inst;
        break;
      }
      if (!victim) break;
      destroy(victim);
    }
  }

  function rememberProjectile(proj) {
    while (projectiles.size >= MAX_PROJECTILES) {
      const oldest = projectiles.values().next().value;
      if (!oldest) break;
      try {
        oldest.cancel(true);
      } catch (_) {
        projectiles.delete(oldest);
      }
      if (projectiles.has(oldest)) projectiles.delete(oldest);
    }
    projectiles.add(proj);
  }

  function unregisterHomingOrb(kid) {
    const i = activeHomingOrbs.indexOf(kid);
    if (i >= 0) activeHomingOrbs.splice(i, 1);
  }

  function registerHomingOrb(kid) {
    while (activeHomingOrbs.length >= HOMING_ORB_CAP) {
      const oldest = activeHomingOrbs[0];
      if (!oldest) {
        activeHomingOrbs.shift();
        continue;
      }
      if (oldest.done) {
        unregisterHomingOrb(oldest);
        continue;
      }
      oldest._culled = true;
      try {
        oldest.cancel(false);
      } catch (_) {
        unregisterHomingOrb(oldest);
      }
    }
    activeHomingOrbs.push(kid);
  }

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
    const ox = Number(frame.origin?.[0]) || 0;
    const oy = Number(frame.origin?.[1]) || 0;
    const applyOrigin = () => {
      const w = img.naturalWidth || loaded?.naturalWidth || 0;
      const h = img.naturalHeight || loaded?.naturalHeight || 0;
      // WZ 1×1 是純延遲幀，不要當成可見特效
      if (w > 0 && h > 0 && w <= 2 && h <= 2) {
        img.hidden = true;
        return;
      }
      if (inst.nativeCenter && w > 0 && h > 0) {
        img.style.setProperty('--ox', `${Math.round(w / 2)}px`);
        img.style.setProperty('--oy', `${Math.round(h / 2)}px`);
      } else {
        img.style.setProperty('--ox', `${ox}px`);
        img.style.setProperty('--oy', `${oy}px`);
      }
      if ((inst.coverField || inst.fitField) && w > 2 && h > 2) {
        const fw = Number(inst.coverW) || inst.parent?.clientWidth || 800;
        const fh = Number(inst.coverH) || inst.parent?.clientHeight || 500;
        const sx = fw / w;
        const sy = fh / h;
        // cover：蓋滿（可能溢出）；fit：整張放進 IdleZone（800×500）
        inst.coverScale = inst.fitField ? Math.min(sx, sy) : Math.max(sx, sy);
        if (inst.stage) {
          const px = Number.isFinite(inst.stage._gpuX) ? inst.stage._gpuX : inst.fixedX;
          const py = Number.isFinite(inst.stage._gpuY) ? inst.stage._gpuY : inst.fixedY;
          if (Number.isFinite(px) && Number.isFinite(py)) {
            setGpuPos(inst.stage, px, py, facingTransform(inst));
          }
        }
      }
      img.hidden = false;
    };
    if (img.dataset.src !== frame.src) {
      img.dataset.src = frame.src;
      img.src = frame.src;
    }
    img.onload = applyOrigin;
    applyOrigin();
    return true;
  }

  function destroy(inst) {
    if (!inst) return;
    inst.stage?.remove();
    instances.delete(inst);
    if (!instances.size) stopSharedLoop();
  }

  function facingTransform(inst) {
    const parts = [];
    if (inst.mirrorX) parts.push('scaleX(-1)');
    const rot = Number(inst.rotateDeg);
    if (Number.isFinite(rot) && Math.abs(rot) > 0.01) parts.push(`rotate(${rot}deg)`);
    const s = Number(inst.coverScale);
    if (s > 0 && Math.abs(s - 1) > 0.001) parts.push(`scale(${s})`);
    return parts.length ? parts.join(' ') : '';
  }

  /** 位移走 translate3d，其餘 rotate／scale 接在後面，只觸發合成層 */
  function setGpuPos(el, x, y, extra) {
    if (!el) return;
    const nx = Number(x);
    const ny = Number(y);
    if (!Number.isFinite(nx) || !Number.isFinite(ny)) return;
    let extraStr = extra === undefined ? (el._gpuExtra || '') : String(extra || '');
    if (extraStr === 'none') extraStr = '';
    extraStr = extraStr.trim();
    el._gpuExtra = extraStr;
    el._gpuX = nx;
    el._gpuY = ny;
    const next = extraStr
      ? `translate3d(${nx}px, ${ny}px, 0) ${extraStr}`
      : `translate3d(${nx}px, ${ny}px, 0)`;
    if (el.style.transform !== next) el.style.transform = next;
  }

  function syncAnchor(inst) {
    if (!inst?.stage) return true;
    if (typeof inst.resolveAnchor === 'function') {
      const a = inst.resolveAnchor();
      if (a && Number.isFinite(a.x) && Number.isFinite(a.y)) {
        setGpuPos(inst.stage, a.x, a.y, facingTransform(inst));
        return true;
      }
      // 循環掛怪特效：錨點消失（死亡／移除）立刻停，勿等時間到
      if (inst.loop && inst.stopWhenAnchorLost) {
        destroy(inst);
        return false;
      }
    }
    if (Number.isFinite(inst.fixedX) && Number.isFinite(inst.fixedY)) {
      setGpuPos(inst.stage, inst.fixedX, inst.fixedY, facingTransform(inst));
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
    lastSharedTs = 0;
  }

  function sharedTick(ts) {
    sharedRaf = requestAnimationFrame(sharedTick);
    if (!lastSharedTs) lastSharedTs = ts;
    const dt = Math.min(50, Math.max(0, ts - lastSharedTs));
    lastSharedTs = ts;
    instances.forEach((inst) => {
      if (inst?.stage && !inst.stage.isConnected) {
        destroy(inst);
        return;
      }
      tickInstance(inst, ts);
    });
    if (movers.size) {
      movers.forEach((mover) => {
        if (!mover || mover.done) {
          movers.delete(mover);
          return;
        }
        try {
          mover.tick(dt, ts);
        } catch (_) {
          mover.done = true;
          movers.delete(mover);
        }
      });
    }
    if (!instances.size && !movers.size) stopSharedLoop();
  }

  function startInstance(inst) {
    if (!instances.has(inst)) return;
    // 循環跟隨（燃靈劍 move）要持續 resolveAnchor；單次攻擊可在開頭定錨
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
    cullOldestFx();
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
      rotateDeg: Number.isFinite(Number(opts.rotateDeg))
        ? Number(opts.rotateDeg)
        : (Number.isFinite(Number(opts.rotateRad))
          ? Number(opts.rotateRad) * (180 / Math.PI)
          : 0),
      loop: !!opts.loop,
      loopFrom: Math.max(0, Math.floor(Number(opts.loopFrom) || 0)),
      stopWhenAnchorLost: !!opts.stopWhenAnchorLost,
      nativeCenter: !!opts.nativeCenter,
      coverField: !!opts.coverField,
      fitField: !!opts.fitField,
      coverW: Number(opts.coverW) || 0,
      coverH: Number(opts.coverH) || 0,
      coverScale: 1,
    };
    stage.style.transformOrigin = '0 0';
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

  function isHitOverlayClass(opts) {
    const cls = String(opts?.className || 'idle-skill-fx-stage idle-skill-fx-stage--hit');
    return /\bidle-skill-fx-stage--hit\b/.test(cls);
  }

  function shouldSkipHitOverlay(opts) {
    if (opts?.loop || opts?.forceHitFx) return false;
    if (!isHitOverlayClass(opts)) return false;
    return (performance.now() - lastHitFxAt) < HIT_FX_GAP_MS;
  }

  function markHitOverlayPlayed() {
    lastHitFxAt = performance.now();
  }

  function playOnMob(mob, frames, opts = {}) {
    if (!mob || !frames?.length) return null;
    const uid = mob.uid != null ? String(mob.uid) : '';
    if (shouldSkipHitOverlay(opts)) return null;
    const fieldEl = opts.fieldEl || activeCombatField();
    if (fieldEl?.id === 'idleHuntField'
      && typeof IdleHunt !== 'undefined'
      && typeof IdleHunt.isMobVisibleInField === 'function') {
      if (!IdleHunt.isMobVisibleInField(mob)) return null;
    }
    let actor = uid
      ? fieldEl?.querySelector(`.idle-actor--mob[data-uid="${uid}"]`)
      : null;
    if (!fieldEl || !actor) return null;
    const layer = getSkillFxLayer(fieldEl);
    if (!layer) return null;
    const loop = !!opts.loop;
    const id = playFrames(layer, frames, {
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
    if (id != null && isHitOverlayClass(opts) && !opts.loop && !opts.forceHitFx) {
      markHitOverlayPlayed();
    }
    return id;
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
    // WZ：v ≈ 每 30ms 移動的距離 → px/ms；opts.speedPxPerMs 可覆寫（幻靈武具比靈氣之刃慢）
    const baseSpeed = Number(opts.speedPxPerMs) > 0 ? Number(opts.speedPxPerMs) : (v / 30);
    const speedPxPerMs = baseSpeed * gameSpeedMult();
    const fieldW = fieldEl.clientWidth || 800;
    let maxRange = Number(opts.maxRange) > 0
      ? Number(opts.maxRange)
      : Math.max(200, Math.hypot(step.pos?.[0] || 560, step.pos?.[1] || 0));
    if (pierce) maxRange = Math.max(maxRange, fieldW + 80);
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
        stopHostMover(proj);
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
    rememberProjectile(proj);

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
      setGpuPos(stage, x, y, facingRight ? 'scaleX(-1)' : '');

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
        stopHostMover(proj);
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
          setGpuPos(stage, x, y);

          if (tryHit()) return;

          if (traveled >= maxRange) {
            endFlight();
            return;
          }
          if (!pierce && proj.targetIdx >= targets.length) {
            endFlight();
          }
        };
        startHostLoop(proj, stepFrame);
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
          stopHostMover(kid);
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
        setGpuPos(stage, spawn.x, spawn.y, facingRight ? 'scaleX(-1)' : '');

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
            setGpuPos(stage, pt.x, pt.y);
            if (u >= 1) {
              if (!kid.hit && typeof onHit === 'function' && Number(mob?.hp) > 0) {
                kid.hit = true;
                onHit(mob, starIndex);
              }
              kid.cancel(false);
              return;
            }
          };
          startHostLoop(kid, stepFrame);
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
    rememberProjectile(group);
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
          stopHostMover(kid);
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
        const scaleAbs = Math.max(0.12, Number(spriteScale) || 1);
        const parts = [
          `scale(${facingRight ? -scaleAbs : scaleAbs}, ${scaleAbs})`,
        ];
        if (rotateDeg) parts.push(`rotate(${rotateDeg}deg)`);
        setGpuPos(stage, spawn.x, spawn.y, parts.join(' '));

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
          setGpuPos(kid.stage, pt.x, pt.y);
          if (u >= 1) {
            if (!kid.hit && typeof onHit === 'function' && Number(mob?.hp) > 0) {
              kid.hit = true;
              onHit(mob, starIndex);
            }
            kid.cancel(false);
            return;
          }
        };
        startHostLoop(kid, stepFrame);
      };

      ensurePreloaded(list).then(() => {
        if (kid.done) return;
        const anim = placeStage();
        const beginFly = () => {
          if (kid.done) return;
          stopHostMover(kid);
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
          };
          startHostLoop(kid, holdSpin);
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
    rememberProjectile(group);
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
      /** 原目標已死時改追下一隻（回傳新 mob 或 null） */
      retarget,
      /** 飛行結束卻無有效目標時回呼（釋放預留等） */
      onMiss,
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
      let mob = targets[starIndex];
      const kid = {
        stage: null,
        rafId: null,
        holdTimer: null,
        launchTimer: null,
        done: false,
        hit: false,
        _culled: false,
        cancel(settleHits) {
          if (kid.done) return;
          kid.done = true;
          unregisterHomingOrb(kid);
          if (kid.holdTimer != null) {
            clearTimeout(kid.holdTimer);
            kid.holdTimer = null;
          }
          if (kid.launchTimer != null) {
            clearTimeout(kid.launchTimer);
            kid.launchTimer = null;
          }
          stopHostMover(kid);
          if (settleHits && !kid.hit && typeof onHit === 'function' && Number(mob?.hp) > 0) {
            kid.hit = true;
            onHit(mob, starIndex);
          } else if (kid._culled && !kid.hit && typeof onMiss === 'function') {
            // 超上限刪球：釋放 HP 預留，不結算傷害
            onMiss(mob, starIndex);
          }
          kid.stage?.remove();
          kid.stage = null;
          markDone();
        },
      };
      registerHomingOrb(kid);

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
        stage.style.transformOrigin = '0 0';
        setGpuPos(stage, x, y, `scale(${scaleAbs})`);

        let frameIdx = 0;
        let frameAcc = 0;
        const applyFrame = () => applyCenteredFrame(img, list[frameIdx % list.length]);
        const resolveTarget = () => {
          if (mob && Number(mob.hp) > 0) return mob;
          if (typeof retarget === 'function') {
            const next = retarget(mob, starIndex);
            if (next && Number(next.hp) > 0) {
              mob = next;
              return mob;
            }
          }
          return null;
        };
        const liveEnd = () => {
          const live = resolveTarget();
          if (live) {
            const mp = fieldPointFromMob(fieldEl, live);
            if (mp && Number.isFinite(mp.x)) return mp;
          }
          return spawn;
        };
        const strike = () => {
          if (kid.hit || kid.done) return;
          const live = resolveTarget();
          if (typeof onHit === 'function' && live) {
            kid.hit = true;
            onHit(live, starIndex);
          } else {
            kid.hit = true;
            if (typeof onMiss === 'function') onMiss(mob, starIndex);
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
                setGpuPos(stage, x, y);
                strike();
                return;
              }
            }
            x = pt.x;
            y = pt.y;
            setGpuPos(stage, x, y);
          };
          startHostLoop(kid, stepFrame);
        };

        ensurePreloaded(spawnFrame?.src ? list.concat(spawnFrame) : list).then(() => {
          if (kid.done) return;
          spawn = spawnPointFor(starIndex, mob);
          x = spawn.x;
          y = spawn.y;
          setGpuPos(stage, x, y);
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
            };
            startHostLoop(kid, holdSpin);
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
    rememberProjectile(group);
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
        stopHostMover(proj);
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
    rememberProjectile(proj);

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
      setGpuPos(stage, x, y, facingRight ? 'scaleX(-1)' : '');

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
        stopHostMover(proj);
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
          setGpuPos(stage, x, y);

          if (dist <= hitRadius) {
            proj.hitSet.add(cur.mob);
            if (typeof onHit === 'function') onHit(cur.mob, proj.targetIdx);
            proj.targetIdx += 1;
            if (!pierce) {
              endFlight();
              return;
            }
          }
        };
        startHostLoop(proj, stepFrame);
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
      zIndex,
      behind = false,
      onDone,
      playerEl,
    } = opts;
    let mirrorX = opts.mirrorX;
    if (mirrorX == null && playerEl) {
      mirrorX = playerFacingRight(playerEl);
    }
    mirrorX = !!mirrorX;
    const list = (frames || []).filter((f) => f && f.src);
    if (!fieldEl || !list.length) {
      if (typeof onDone === 'function') onDone();
      return null;
    }
    const fxLayer = opts.layerEl
      || (behind ? getSkillFxBehindLayer(fieldEl) : getSkillFxLayer(fieldEl));
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
      rotateDeg: opts.rotateDeg,
      rotateRad: opts.rotateRad,
      zIndex,
      forcePlay: !!opts.forcePlay,
      nativeCenter: !!opts.nativeCenter,
      coverField: !!opts.coverField,
      fitField: !!opts.fitField,
      coverW: Number(opts.coverW) || fieldEl.clientWidth || 0,
      coverH: Number(opts.coverH) || fieldEl.clientHeight || 0,
      resolveAnchor: opts.resolveAnchor || null,
    });
    if (!loop && id != null && typeof onDone === 'function') {
      const dur = framesDurationMs(list);
      setTimeout(onDone, scaleRealMs(Math.max(30, dur)));
    }
    return id;
  }

  /**
   * 貫穿殘影：front 頭 + middle 中段拼接 + back 尾，沿 from→to 拉成一條。
   * 西皮迪亞 400031018 special 三層是同一條綠光束的頭／身／尾，不是三張疊在同一點。
   */
  function playPierceStreak(opts = {}) {
    const {
      fieldEl,
      from,
      to,
      onDone,
    } = opts;
    const fxLayer = getSkillFxLayer(fieldEl);
    const x0 = Number(from?.x);
    const y0 = Number(from?.y);
    const x1 = Number(to?.x);
    const y1 = Number(to?.y);
    const front = (opts.front || []).filter((f) => f && f.src);
    const middle = (opts.middle || []).filter((f) => f && f.src);
    const back = (opts.back || []).filter((f) => f && f.src);
    if (!fxLayer || !Number.isFinite(x0) || !Number.isFinite(y0)
      || !Number.isFinite(x1) || !Number.isFinite(y1)
      || (!front.length && !middle.length && !back.length)) {
      if (typeof onDone === 'function') onDone();
      return null;
    }
    if (typeof document !== 'undefined' && document.hidden && !opts.forcePlay) {
      if (typeof onDone === 'function') onDone();
      return null;
    }

    const len = Math.max(24, Math.hypot(x1 - x0, y1 - y0));
    const deg = (Math.atan2(y1 - y0, x1 - x0) * 180) / Math.PI;
    const stage = document.createElement('div');
    stage.className = 'idle-skill-fx-stage idle-skill-fx-stage--sylvidia-after';
    stage.style.width = `${Math.round(len)}px`;
    stage.style.height = '0';
    stage.style.transformOrigin = '0 50%';
    stage.style.zIndex = '50';
    setGpuPos(stage, x0, y0, `rotate(${deg}deg)`);
    fxLayer.appendChild(stage);

    const parts = [];
    const addPart = (frames) => {
      if (!frames?.length) return;
      const img = document.createElement('img');
      img.className = 'idle-skill-fx-sprite idle-skill-fx-sprite--beam';
      img.alt = '';
      img.draggable = false;
      img.decoding = 'sync';
      stage.appendChild(img);
      parts.push({
        img,
        frames,
        frameIdx: 0,
        frameAcc: 0,
        done: false,
      });
    };

    const applyPartFrame = (part) => {
      if (part.done || part.frameIdx >= part.frames.length) {
        part.done = true;
        part.img.hidden = true;
        return;
      }
      const frame = part.frames[part.frameIdx];
      if (!frame?.src) {
        part.done = true;
        part.img.hidden = true;
        return;
      }
      part.img.style.setProperty('--ox', '0px');
      part.img.style.setProperty('--oy', '0px');
      if (part.img.dataset.src !== frame.src) {
        part.img.dataset.src = frame.src;
        part.img.src = frame.src;
      }
      part.img.hidden = false;
    };

    const proj = {
      done: false,
      cancel() {
        if (proj.done) return;
        proj.done = true;
        stopHostMover(proj);
        stage.remove();
        projectiles.delete(proj);
        if (typeof onDone === 'function') onDone();
      },
    };
    rememberProjectile(proj);

    const allFrames = [...front, ...middle, ...back];
    const animMs = Math.max(
      framesDurationMs(front),
      framesDurationMs(middle),
      framesDurationMs(back),
      Number(opts.durationMs) || 0,
      180,
    );
    const dur = animMs / Math.max(0.1, gameSpeedMult());

    ensurePreloaded(allFrames).then(() => {
      if (proj.done) return;
      const fw = decodedImage(front[0]?.src)?.naturalWidth || 80;
      const mw = decodedImage(middle[0]?.src)?.naturalWidth || 48;
      const bw = decodedImage(back[0]?.src)?.naturalWidth || 80;
      addPart(front);
      const fill = Math.max(0, len - fw - bw);
      const tiles = middle.length
        ? Math.max(1, Math.round(fill / Math.max(16, mw)))
        : 0;
      for (let i = 0; i < tiles; i += 1) addPart(middle);
      addPart(back);
      parts.forEach(applyPartFrame);

      let lastTs = 0;
      let elapsed = 0;
      startHostLoop(proj, (ts) => {
        if (proj.done) return;
        if (!lastTs) lastTs = ts;
        const dt = Math.min(50, Math.max(0, ts - lastTs));
        lastTs = ts;
        elapsed += dt;
        parts.forEach((part) => {
          if (part.done) return;
          part.frameAcc += dt;
          const delay = Math.max(1, Number(part.frames[part.frameIdx]?.delay) || 60);
          if (part.frameAcc >= delay) {
            part.frameAcc -= delay;
            part.frameIdx += 1;
            applyPartFrame(part);
          }
        });
        if (parts.every((p) => p.done) || elapsed >= dur + 80) proj.cancel();
      });
    });
    setTimeout(() => {
      if (!proj.done) proj.cancel();
    }, Math.max(240, dur + 160));
    return true;
  }

  function resolveHuntShell(fieldEl) {
    return fieldEl?.closest?.('.idle-hunt-shell')
      || (typeof document !== 'undefined'
        ? document.querySelector('#idleHuntRoot .idle-hunt-shell')
        : null)
      || null;
  }

  function getShellFxLayer(shellEl) {
    const shell = shellEl || resolveHuntShell(activeCombatField());
    if (!shell) return null;
    let layer = shell.querySelector(':scope > .idle-hunt-shell-fx');
    if (!layer) {
      layer = document.createElement('div');
      layer.className = 'idle-hunt-shell-fx';
      layer.setAttribute('aria-hidden', 'true');
      shell.appendChild(layer);
    }
    return layer;
  }

  function cutSkipEl(el) {
    return !!(el?.closest && el.closest(
      '.idle-hunt-zone-cut, .idle-hunt-map-cut, .idle-hunt-shell-fx, .idle-hunt-damage-fx',
    ));
  }

  function parseCssUrl(bg) {
    const m = String(bg || '').match(/url\(["']?([^"')]+)["']?\)/);
    return m ? m[1] : '';
  }

  function syncLoadedImage(url) {
    if (!url) return null;
    const pre = decodedImage(url);
    if (pre?.naturalWidth) return pre;
    try {
      const abs = new URL(url, document.baseURI).href;
      const pre2 = decodedImage(abs);
      if (pre2?.naturalWidth) return pre2;
      const found = typeof document !== 'undefined'
        ? document.querySelector(`img[src="${url}"], img[src="${abs}"]`)
        : null;
      if (found?.naturalWidth) return found;
      const img = new Image();
      img.src = abs;
      if (img.complete && img.naturalWidth) return img;
    } catch (_) { /* ignore */ }
    return null;
  }

  function snapshotSurface(rootEl) {
    const w = Math.max(1, Math.round(rootEl.clientWidth || 0));
    const h = Math.max(1, Math.round(rootEl.clientHeight || 0));
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx2d = canvas.getContext('2d');
    if (!ctx2d) return '';
    const origin = rootEl.getBoundingClientRect();

    const vis = (el) => {
      if (!el || el.nodeType !== 1 || el.hidden) return false;
      if (cutSkipEl(el)) return false;
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden') return false;
      if (Number(cs.opacity) === 0) return false;
      return true;
    };

    const paintImg = (el) => {
      if (!vis(el)) return;
      const r = el.getBoundingClientRect();
      if (!(r.width > 1 && r.height > 1)) return;
      try {
        ctx2d.drawImage(el, r.left - origin.left, r.top - origin.top, r.width, r.height);
      } catch (_) { /* tainted / 空 canvas */ }
    };

    const paintFillBar = (el) => {
      if (!vis(el)) return;
      const r = el.getBoundingClientRect();
      if (!(r.width > 0 && r.height > 0)) return;
      const x = r.left - origin.left;
      const y = r.top - origin.top;
      const before = getComputedStyle(el, '::before');
      const url = parseCssUrl(before.backgroundImage)
        || parseCssUrl(getComputedStyle(el).backgroundImage);
      const img = syncLoadedImage(url);
      ctx2d.save();
      ctx2d.beginPath();
      ctx2d.rect(x, y, r.width, r.height);
      ctx2d.clip();
      if (img) {
        const trackW = parseFloat(before.width)
          || parseFloat(getComputedStyle(el).getPropertyValue('--hp-track-w'))
          || parseFloat(getComputedStyle(el).getPropertyValue('--exp-track-w'))
          || r.width;
        const trackH = parseFloat(before.height) || r.height;
        try {
          ctx2d.drawImage(img, x, y, trackW, trackH);
        } catch (_) { /* ignore */ }
      } else {
        const bg = getComputedStyle(el).backgroundColor;
        if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') {
          ctx2d.fillStyle = bg;
          ctx2d.fillRect(x, y, r.width, r.height);
        }
      }
      ctx2d.restore();
    };

    const paintText = (el) => {
      if (!vis(el)) return;
      const text = (el.textContent || '').replace(/\s+/g, ' ').trim();
      if (!text) return;
      const r = el.getBoundingClientRect();
      if (!(r.width > 0 && r.height > 0)) return;
      const cs = getComputedStyle(el);
      ctx2d.save();
      ctx2d.font = cs.font;
      ctx2d.fillStyle = cs.color || '#fff';
      ctx2d.strokeStyle = '#000';
      ctx2d.lineWidth = 3;
      ctx2d.lineJoin = 'round';
      ctx2d.textBaseline = 'middle';
      const y = r.top - origin.top + r.height / 2;
      let x = r.left - origin.left;
      const centered = cs.textAlign === 'center'
        || el.classList.contains('idle-hunt-hp-bar__text')
        || el.classList.contains('idle-hunt-exp-bar__text')
        || el.classList.contains('idle-hunt-actbtn__label');
      const righted = cs.textAlign === 'right'
        || el.classList.contains('idle-hunt-stat__slot-value')
        || el.classList.contains('idle-hunt-current-map');
      if (centered) {
        ctx2d.textAlign = 'center';
        x += r.width / 2;
      } else if (righted) {
        ctx2d.textAlign = 'right';
        x += r.width;
      } else {
        ctx2d.textAlign = 'left';
      }
      ctx2d.strokeText(text, x, y);
      ctx2d.fillText(text, x, y);
      ctx2d.restore();
    };

    const walk = (node) => {
      if (!node || node.nodeType !== 1) return;
      if (cutSkipEl(node)) return;
      if (node.hidden) return;
      if (node.matches('img, canvas')) paintImg(node);
      else if (node.matches(
        '.idle-hunt-hp-bar__fill, .idle-hunt-exp-bar__fill, .idle-boss-hp__fill, .idle-actor-hp span',
      )) {
        paintFillBar(node);
      }
      const kids = node.children;
      for (let i = 0; i < kids.length; i += 1) walk(kids[i]);
      if (node.matches(
        '.idle-hunt-current-map, .idle-hunt-stat__slot-value, .idle-hunt-stat__value, .idle-hunt-stat__label, .idle-hunt-hp-bar__text, .idle-hunt-exp-bar__text, .idle-hunt-actbtn__label, .idle-hunt-force-hud__text, .idle-boss-hp__pct, .idle-boss-hp__text',
      )) {
        paintText(node);
      }
    };
    walk(rootEl);
    try {
      return canvas.toDataURL('image/png');
    } catch (_) {
      return '';
    }
  }

  /**
   * Effect.SlicerEffect.img／400011027（空間斬）。
   * IdleZone 800×500 用 _s；origin／alpha 照 WZ。
   * angle 在 playFieldMapCut 會依 DOM y 向下變號，並隨面向翻轉。
   */
  const DEATHFAULT_SLICER = {
    ratioL: 0.1667,
    ratioR: 0.8138,
    angle: -25,
    frameDelay: 60,
    frames: [
      { alpha: 100, origin: [-1, 0] },
      { alpha: 100, origin: [-4, 0] },
      { alpha: 100, origin: [-6, 0] },
      { alpha: 100, origin: [-7, 0] },
      { alpha: 100, origin: [-8, 0] },
      { alpha: 100, origin: [-8, 0] },
      { alpha: 100, origin: [-8, 0] },
      { alpha: 100, origin: [-8, 0] },
      { alpha: 100, origin: [-8, 0] },
      { alpha: 100, origin: [-8, 0] },
      { alpha: 100, origin: [-8, 0] },
      { alpha: 100, origin: [-13, 6] },
      { alpha: 100, origin: [-15, 9] },
      { alpha: 70, origin: [-17, 12] },
      { alpha: 30, origin: [-19, 15] },
      { alpha: 10, origin: [-20, 16] },
    ],
  };

  function slicerClipPolygons(w, h, angleDeg, ratioL, ratioR) {
    const cx = ((Number(ratioL) + Number(ratioR)) / 2) * w;
    const cy = h * 0.5;
    const rad = (Number(angleDeg) || 0) * Math.PI / 180;
    const nx = -Math.sin(rad);
    const ny = Math.cos(rad);
    const corners = [[0, 0], [w, 0], [w, h], [0, h]];
    const sideOf = (p) => (p[0] - cx) * nx + (p[1] - cy) * ny;
    const intersect = (a, b) => {
      const sa = sideOf(a);
      const sb = sideOf(b);
      const den = sa - sb;
      const t = Math.abs(den) < 1e-6 ? 0 : sa / den;
      return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
    };
    const half = (wantPos) => {
      const poly = [];
      for (let i = 0; i < 4; i += 1) {
        const a = corners[i];
        const b = corners[(i + 1) % 4];
        const aIn = wantPos ? sideOf(a) >= 0 : sideOf(a) <= 0;
        const bIn = wantPos ? sideOf(b) >= 0 : sideOf(b) <= 0;
        if (aIn) poly.push(a);
        if (aIn !== bIn) poly.push(intersect(a, b));
      }
      return poly;
    };
    const toClip = (poly) => {
      if (!poly.length) return 'none';
      return `polygon(${poly.map((p) => `${p[0].toFixed(1)}px ${p[1].toFixed(1)}px`).join(', ')})`;
    };
    return { a: toClip(half(true)), b: toClip(half(false)) };
  }

  /**
   * 空間斬：依 SlicerEffect 把 IdleZone 外框（shell）整塊切開。
   */
  function playFieldMapCut(fieldEl, opts = {}) {
    if (!fieldEl || typeof document === 'undefined') return false;
    if (document.hidden && !opts.forcePlay) return false;
    const shell = resolveHuntShell(fieldEl);
    const surface = shell || fieldEl;
    const useShell = !!shell;
    surface.querySelectorAll('.idle-hunt-zone-cut, .idle-hunt-map-cut').forEach((el) => el.remove());
    shell?.classList.remove('is-zone-cut');
    fieldEl.classList.remove('is-map-cut');

    const w = surface.clientWidth || (useShell ? 860 : 800);
    const h = surface.clientHeight || (useShell ? 820 : 500);
    const url = snapshotSurface(surface);
    if (!url) return false;

    const slicer = opts.slicer || DEATHFAULT_SLICER;
    const frames = Array.isArray(slicer.frames) && slicer.frames.length
      ? slicer.frames
      : DEATHFAULT_SLICER.frames;
    const mirrorX = !!opts.mirrorX;
    // WZ angle 為 y 向上；DOM y 向下要變號，切口才會跟 screen PNG／實機的 \ 一致
    const angle = -(Number(slicer.angle) || -25) * (mirrorX ? -1 : 1);
    const clips = slicerClipPolygons(
      w,
      h,
      angle,
      slicer.ratioL != null ? slicer.ratioL : 0.1667,
      slicer.ratioR != null ? slicer.ratioR : 0.8138,
    );

    const host = document.createElement('div');
    host.className = useShell ? 'idle-hunt-zone-cut' : 'idle-hunt-map-cut';
    host.setAttribute('aria-hidden', 'true');
    host.style.width = `${w}px`;
    host.style.height = `${h}px`;
    const sliceA = document.createElement('img');
    const sliceB = document.createElement('img');
    const sliceClass = useShell ? 'idle-hunt-zone-cut__slice' : 'idle-hunt-map-cut__slice';
    [sliceA, sliceB].forEach((img, idx) => {
      img.src = url;
      img.alt = '';
      img.draggable = false;
      img.className = `${sliceClass} ${sliceClass}--${idx === 0 ? 'a' : 'b'}`;
      img.style.width = `${w}px`;
      img.style.height = `${h}px`;
      img.style.clipPath = idx === 0 ? clips.a : clips.b;
      host.appendChild(img);
    });
    surface.appendChild(host);
    if (useShell) shell.classList.add('is-zone-cut');
    else fieldEl.classList.add('is-map-cut');

    const clearCutClass = () => {
      shell?.classList.remove('is-zone-cut');
      fieldEl.classList.remove('is-map-cut');
    };

    const applyFrame = (frame) => {
      const ox = (Number(frame?.origin?.[0]) || 0) * (mirrorX ? -1 : 1);
      const oy = Number(frame?.origin?.[1]) || 0;
      const alpha = Math.max(0, Math.min(100, Number(frame?.alpha) || 100));
      sliceA.style.transform = `translate3d(${ox}px, ${oy}px, 0)`;
      sliceB.style.transform = `translate3d(${-ox}px, ${-oy}px, 0)`;
      sliceA.style.opacity = String(alpha / 100);
      sliceB.style.opacity = String(alpha / 100);
      if (alpha < 100) clearCutClass();
    };

    const finish = () => {
      host.remove();
      clearCutClass();
    };

    let idx = 0;
    applyFrame(frames[0]);
    const tick = () => {
      if (!host.isConnected) {
        clearCutClass();
        return;
      }
      idx += 1;
      if (idx >= frames.length) {
        finish();
        return;
      }
      applyFrame(frames[idx]);
      setTimeout(tick, scaleRealMs(slicer.frameDelay || 60));
    };
    setTimeout(tick, scaleRealMs(slicer.frameDelay || 60));
    return true;
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

  function setFxVisible(id, visible) {
    if (id == null) return;
    for (const inst of instances) {
      if (inst.id === id && inst.stage) {
        inst.stage.style.visibility = visible ? '' : 'hidden';
        inst.stage.style.opacity = visible ? '' : '0';
        return;
      }
    }
  }

  /**
   * 場上循環特效的可見中心：X 對 origin（WZ 錨），Y 取圖幀垂直中點。
   * 密傳 stand origin 在圖下方，卷軸本體在半空。
   */
  function fieldPointFromFxVisual(id) {
    if (id == null) return null;
    for (const inst of instances) {
      if (inst.id !== id || !inst.stage) continue;
      const x = Number.isFinite(inst.stage._gpuX)
        ? inst.stage._gpuX
        : parseFloat(inst.stage.style.left);
      const y = Number.isFinite(inst.stage._gpuY)
        ? inst.stage._gpuY
        : parseFloat(inst.stage.style.top);
      if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
      const frame = inst.frames?.[inst.frameIdx] || inst.frames?.[0];
      const oy = Number(frame?.origin?.[1])
        || parseFloat(inst.img?.style.getPropertyValue('--oy'))
        || 0;
      const h = Number(inst.img?.naturalHeight) || 0;
      const visualY = (oy > 0 && h > 0) ? (y - oy + h * 0.5) : y;
      return { x: Math.round(x), y: Math.round(visualY) };
    }
    return null;
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
    activeHomingOrbs.length = 0;
    movers.forEach((m) => { if (m) m.done = true; });
    movers.clear();
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
    activeHomingOrbs.length = 0;
    movers.forEach((m) => { if (m) m.done = true; });
    movers.clear();
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

  function pruneStaleFx() {
    instances.forEach((inst) => {
      if (inst?.stage && !inst.stage.isConnected) destroy(inst);
    });
    movers.forEach((mover) => {
      if (!mover || mover.done) movers.delete(mover);
    });
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
      fx.screen, fx.screen0, fx.special1, fx.special2,
    ];
    frameLists.forEach((list) => collectFrameUrls(list, out));
    if (fx.special?.frames) collectFrameUrls(fx.special.frames, out);
    (fx.shootobj?.layers || []).forEach((layer) => collectFrameUrls(layer?.frames, out));
    (fx.summonAttacks || []).forEach((list) => collectFrameUrls(list?.frames || list, out));
    if (fx.summonVisual) {
      collectFrameUrls(fx.summonVisual.summoned, out);
      collectFrameUrls(fx.summonVisual.stand, out);
      collectFrameUrls(fx.summonVisual.move, out);
      collectFrameUrls(fx.summonVisual.die, out);
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
    playPierceStreak,
    playFieldMapCut,
    playProjectile,
    framesDurationMs,
    stopFx,
    setFxVisible,
    stopAll,
    stopTransientFx,
    clearLocalPreloadCache,
    activeInstanceCount,
    pruneStaleFx,
    ensurePreloaded,
    collectFxUrls,
    collectSkillUrls,
    warmUpSkills,
    warmUpCombatLoadout,
    resolveMobCenterLocal,
    fieldPointFromPlayer,
    fieldPointFromMob,
    fieldPointFromFxVisual,
    setGpuPos,
    playerFacingRight,
    activeCombatField,
    getSkillFxLayer,
    getSkillFxBehindLayer,
    getShellFxLayer,
    registerMover,
    unregisterMover,
    getFxOpacity,
    setFxOpacity,
    initFxOpacity,
  };
})();

if (typeof window !== 'undefined') {
  window.SkillEffectPlayer = SkillEffectPlayer;
}
