/**
 * 楓之谷風格傷害數字：三階段 easing。
 * 同目標同一次施放（stackGroup）：依 stackIndex 往上疊（技能連鎖共用一組）。
 * 無 stackGroup：短時間自動遞增；間隔過久從頭疊。
 */
const DamageNumber = (() => {
  const PHASE1_END = 0.15;
  const PHASE2_END = 0.6;
  const TOTAL_DUR = 0.8;

  const POP_Y = 30;
  const HOLD_DRIFT_PX_PER_SEC = 5;
  const FADE_Y = 10;
  const STACK_Y_STEP = 25;
  const STACK_DELAY_MIN = 0.05;
  const STACK_DELAY_MAX = 0.08;
  /** 同目標超過此間隔視為新一輪攻擊（從頭疊；僅無 stackGroup 時） */
  const STACK_BURST_GAP_MS = 280;
  /** 單輪視覺往上疊上限（技能連鎖多段可較高） */
  const STACK_Y_CAP = 48;

  /**
   * 場上同時存在的數字上限。
   * 需能覆蓋「可見隊列 × 多段」一波（約 10×8＋追擊），再高只會讓 RAF 寫 style 卡死。
   */
  const MAX_ON_FIELD = 200;
  /** 連鎖等同幀大量數字：每幀最多掛載幾個，避免主執行緒卡頓 */
  const SPAWN_PER_FRAME = 16;
  const STACK_PRUNE_EVERY_TICKS = 45;
  const PLAYER_STACK_KEY = 'player';

  let layerEl = null;
  let stageEl = null;
  const instances = new Set();
  /** @type {Map<string, { count: number, lastMs: number }>} */
  const targetStacks = new Map();
  /** @type {Array<object>} */
  const spawnQueue = [];
  let spawnFlushRaf = null;
  /** uid → 本幀快取的 actor／錨點／z */
  const mobViewCache = new Map();
  let mobViewCacheFrame = 0;
  let rafId = null;
  let lastTs = 0;
  let poseTicks = 0;

  function playerSkinId() {
    if (typeof DamageSkinCatalog === 'undefined') return '18';
    return DamageSkinCatalog.playerSkin?.() || DamageSkinCatalog.loadPlayerSkinId?.() || '18';
  }

  function mobSkinId() {
    if (typeof DamageSkinCatalog === 'undefined') return 'mob';
    return DamageSkinCatalog.MOB_SKIN_ID || 'mob';
  }

  function clamp01(t) {
    return Math.max(0, Math.min(1, t));
  }

  function easeOutBack(t, overshoot = 1.70158) {
    const u = clamp01(t) - 1;
    return 1 + (overshoot + 1) * u * u * u + overshoot * u * u;
  }

  function easeOutExpo(t) {
    const u = clamp01(t);
    return u >= 1 ? 1 : 1 - (2 ** (-10 * u));
  }

  function easeIn(t) {
    const u = clamp01(t);
    return u * u;
  }

  function activeCombatField() {
    const arena = document.getElementById('idleBossArena');
    if (arena?.classList.contains('is-open')) {
      return document.getElementById('idleBossField') || document.getElementById('idleHuntField');
    }
    return document.getElementById('idleHuntField') || document.getElementById('idleBossField');
  }

  function ensureLayer() {
    if (!stageEl) return null;

    const field = activeCombatField()
      || stageEl.closest('#idleBossField')
      || stageEl.closest('#idleHuntField');
    if (!field) return null;

    // 切換狩獵場／BOSS 場時不可沿用舊 layer
    if (layerEl && layerEl.isConnected && field.contains(layerEl)) return layerEl;
    layerEl = null;

    layerEl = field.querySelector('.idle-hunt-damage-fx .idle-damage-layer');
    if (!layerEl) {
      let container = field.querySelector('.idle-hunt-damage-fx');
      if (!container) {
        container = document.createElement('div');
        container.className = 'idle-hunt-damage-fx';
        container.setAttribute('aria-hidden', 'true');
        const skillFx = field.querySelector('.idle-hunt-skill-fx');
        if (skillFx) skillFx.insertAdjacentElement('afterend', container);
        else {
          const stage = field.querySelector('.idle-boss-stage--mobs')
            || field.querySelector('.idle-hunt-stage')
            || field.querySelector('.idle-boss-stage');
          if (stage) stage.insertAdjacentElement('afterend', container);
          else field.appendChild(container);
        }
      }
      layerEl = document.createElement('div');
      layerEl.className = 'idle-damage-layer';
      container.appendChild(layerEl);
    }

    // 舊版掛在 stage 內的 layer 移除，避免重複
    stageEl.querySelector('.idle-damage-layer')?.remove();

    return layerEl;
  }

  function trimOldestIfNeeded() {
    while (instances.size >= MAX_ON_FIELD) {
      // Set 插入序＝生成序：清最早已開始播放的，避免掃全體找 max age
      let victim = null;
      for (const inst of instances) {
        if (inst.age < inst.delay) continue;
        victim = inst;
        break;
      }
      if (!victim) victim = instances.values().next().value;
      if (!victim) break;
      destroy(victim);
    }
  }

  function destroy(inst) {
    if (!inst) return;
    inst.el?.remove();
    instances.delete(inst);
    if (!instances.size && rafId != null) {
      cancelAnimationFrame(rafId);
      rafId = null;
      lastTs = 0;
    }
  }

  /** 開新一輪堆疊（下一次技能／攻擊；無 stackGroup 路徑用） */
  function beginBurst(stackKey) {
    const key = String(stackKey || 'default');
    targetStacks.set(key, { count: 0, lastMs: performance.now() });
  }

  function randomStackDelay(stackIndex) {
    const idx = Math.max(0, Math.floor(Number(stackIndex) || 0));
    return idx * (STACK_DELAY_MIN + Math.random() * (STACK_DELAY_MAX - STACK_DELAY_MIN));
  }

  /**
   * 自動堆疊：同一輪內遞增；間隔過久或呼叫 beginBurst 後從 0 重來。
   * 有 forcedIndex 且無 stackGroup 時仍用時間窗接續（舊路徑）。
   */
  function nextStackForTarget(stackKey, forcedIndex) {
    const key = String(stackKey || 'default');
    const now = performance.now();
    let st = targetStacks.get(key);

    if (Number.isFinite(forcedIndex)) {
      const idx = Math.max(0, Math.floor(forcedIndex));
      if (!st || now - st.lastMs > STACK_BURST_GAP_MS) {
        st = { count: 0, base: 0, lastMs: now };
      } else if (idx === 0) {
        st.base = st.count;
      }
      const visualIndex = (Number(st.base) || 0) + idx;
      st.count = Math.max(st.count, visualIndex + 1);
      st.lastMs = now;
      targetStacks.set(key, st);
      return { stackIndex: visualIndex, delay: randomStackDelay(visualIndex) };
    }

    if (!st || now - st.lastMs > STACK_BURST_GAP_MS) {
      st = { count: 0, base: 0, lastMs: now };
    }
    const stackIndex = st.count;
    st.count += 1;
    st.lastMs = now;
    targetStacks.set(key, st);
    return { stackIndex, delay: randomStackDelay(stackIndex) };
  }

  /**
   * 施放組堆疊：stackIndex 即視覺層（同 mob + 同 stackGroup 內由戰鬥端分配）。
   * 不同 stackGroup 互不接續，避免高頻引導一直往天上疊。
   */
  function resolveGroupedStack(stackKey, opts) {
    const idx = Math.max(0, Math.floor(Number(opts.stackIndex) || 0));
    const now = performance.now();
    const prev = targetStacks.get(stackKey);
    targetStacks.set(stackKey, {
      count: Math.max(prev?.count || 0, idx + 1),
      lastMs: now,
    });
    const delay = Number.isFinite(opts.delay)
      ? Math.max(0, Number(opts.delay))
      : randomStackDelay(idx);
    return { stackIndex: idx, delay };
  }

  function poseAt(animAge, stackIndex) {
    const capped = Math.min(STACK_Y_CAP, Math.max(0, Math.floor(Number(stackIndex) || 0)));
    const stackYOffset = -capped * STACK_Y_STEP;

    if (animAge < 0) {
      return { yOff: stackYOffset, scale: 0.5, alpha: 0 };
    }
    if (animAge >= TOTAL_DUR) {
      return false;
    }

    if (animAge < PHASE1_END) {
      const t = animAge / PHASE1_END;
      const yEase = easeOutBack(t);
      const yOff = -POP_Y * yEase + stackYOffset;

      let scale;
      if (t < 0.62) {
        const ts = t / 0.62;
        scale = 0.5 + (1.3 - 0.5) * easeOutExpo(ts);
      } else {
        const ts = (t - 0.62) / 0.38;
        scale = 1.3 + (1.0 - 1.3) * easeOutBack(ts, 2.2);
      }

      const alpha = easeOutExpo(t);
      return { yOff, scale, alpha };
    }

    const holdDur = PHASE2_END - PHASE1_END;
    const holdDrift = HOLD_DRIFT_PX_PER_SEC * holdDur;
    const yAfterPop = -POP_Y + stackYOffset;

    if (animAge < PHASE2_END) {
      const t = animAge - PHASE1_END;
      const drift = HOLD_DRIFT_PX_PER_SEC * t;
      return {
        yOff: yAfterPop - drift,
        scale: 1,
        alpha: 1,
      };
    }

    const fadeDur = TOTAL_DUR - PHASE2_END;
    const t = (animAge - PHASE2_END) / fadeDur;
    const yEase = easeIn(t);
    const yOff = yAfterPop - holdDrift - FADE_Y * yEase;
    const scale = 1 + (0.9 - 1) * yEase;
    const alpha = 1 - easeIn(t);
    return { yOff, scale, alpha };
  }

  function applyPose(inst) {
    const animAge = inst.age - inst.delay;
    const pose = poseAt(animAge, inst.stackIndex);
    if (!pose) {
      destroy(inst);
      return false;
    }

    const { yOff, scale, alpha } = pose;
    inst.el.style.opacity = String(Math.max(0, Math.min(1, alpha)));
    inst.el.style.transform = `translate(-50%, -100%) translateY(${yOff}px) scale(${scale})`;
    return true;
  }

  function tick(ts) {
    rafId = requestAnimationFrame(tick);
    if (!lastTs) lastTs = ts;
    const dt = Math.min(0.05, Math.max(0, (ts - lastTs) / 1000));
    lastTs = ts;
    if (!instances.size) return;
    for (const inst of instances) {
      inst.age += dt;
      applyPose(inst);
    }
    poseTicks += 1;
    if (poseTicks >= STACK_PRUNE_EVERY_TICKS) {
      poseTicks = 0;
      pruneStaleStacks();
    }
  }

  function startLoop() {
    if (rafId != null) return;
    lastTs = 0;
    rafId = requestAnimationFrame(tick);
  }

  function buildPopEl(glyphs, skinId) {
    const pop = document.createElement('div');
    pop.className = 'idle-damage-pop';
    const overlap = DamageSkinCatalog.GLYPH_OVERLAP;
    const frag = document.createDocumentFragment();

    glyphs.forEach((g, i) => {
      let img = null;
      const cached = typeof DamageSkinCatalog.getImage === 'function'
        ? DamageSkinCatalog.getImage(skinId, g.folder, g.index)
        : null;
      if (cached && cached.complete && cached.naturalWidth > 0) {
        img = cached.cloneNode(false);
        img.className = 'idle-damage-glyph';
        img.alt = '';
        img.draggable = false;
        img.decoding = 'async';
      } else {
        img = document.createElement('img');
        img.className = 'idle-damage-glyph';
        img.alt = '';
        img.draggable = false;
        img.decoding = 'async';
        img.src = DamageSkinCatalog.glyphUrl(skinId, g.folder, g.index);
      }
      if (i > 0) img.style.marginLeft = `-${overlap}px`;
      frag.appendChild(img);
    });

    pop.appendChild(frag);
    return pop;
  }

  function enqueueSpawn(damageValue, targetX, targetY, isCritical, opts) {
    while (instances.size + spawnQueue.length >= MAX_ON_FIELD) {
      if (spawnQueue.length) {
        spawnQueue.shift();
        continue;
      }
      trimOldestIfNeeded();
      if (instances.size + spawnQueue.length >= MAX_ON_FIELD) break;
    }
    spawnQueue.push({
      damageValue,
      targetX,
      targetY,
      isCritical: !!isCritical,
      opts: opts || {},
      queuedAt: performance.now(),
    });
    scheduleSpawnFlush();
  }

  function scheduleSpawnFlush() {
    if (spawnFlushRaf != null) return;
    spawnFlushRaf = requestAnimationFrame(flushSpawnQueue);
  }

  function flushSpawnQueue() {
    spawnFlushRaf = null;
    const layer = ensureLayer();
    if (!layer || !spawnQueue.length) return;

    const frag = document.createDocumentFragment();
    const created = [];
    let n = 0;
    while (spawnQueue.length && n < SPAWN_PER_FRAME) {
      const item = spawnQueue.shift();
      const skinId = item.opts.skinId || playerSkinId();
      const glyphs = DamageSkinCatalog.buildGlyphs(skinId, item.damageValue, item.isCritical);
      if (!glyphs.length) continue;

      trimOldestIfNeeded();
      const el = buildPopEl(glyphs, skinId);
      const z = Number(item.opts.zIndex);
      if (Number.isFinite(z)) el.style.zIndex = String(Math.round(z));
      el.style.left = `${Math.round(Number(item.targetX) || 0)}px`;
      el.style.top = `${Math.round(Number(item.targetY) || 0)}px`;
      frag.appendChild(el);

      const waited = Math.max(0, (performance.now() - item.queuedAt) / 1000);
      const inst = {
        el,
        baseX: Math.round(Number(item.targetX) || 0),
        baseY: Math.round(Number(item.targetY) || 0),
        age: waited,
        delay: Math.max(0, Number(item.opts.delay) || 0),
        stackIndex: Math.max(0, Math.floor(Number(item.opts.stackIndex) || 0)),
        skinId,
      };
      instances.add(inst);
      created.push(inst);
      n += 1;
    }

    if (frag.childNodes.length) layer.appendChild(frag);
    created.forEach((inst) => applyPose(inst));
    if (created.length) startLoop();
    if (spawnQueue.length) scheduleSpawnFlush();
  }

  function spawn(damageValue, targetX, targetY, isCritical = false, opts = {}) {
    if (typeof DamageSkinCatalog === 'undefined') return null;
    const skinId = opts.skinId || playerSkinId();
    const payload = { ...opts, skinId };
    const run = () => {
      enqueueSpawn(damageValue, targetX, targetY, isCritical, payload);
    };
    const pending = DamageSkinCatalog.ensurePreloaded(skinId);
    if (pending && typeof pending.then === 'function') {
      pending.then(run);
      return null;
    }
    run();
    return null;
  }

  function spawnNow(damageValue, targetX, targetY, isCritical = false, opts = {}) {
    enqueueSpawn(damageValue, targetX, targetY, isCritical, opts);
    return null;
  }

  function resolveBossHitSpawnPoint(actor) {
    const field = actor.closest?.('#idleBossField') || document.getElementById('idleBossField');
    if (!field || !actor) return null;
    const fr = field.getBoundingClientRect();
    const ar = actor.getBoundingClientRect();
    let local = { x: 0, y: -32 };
    if (typeof SkillEffectPlayer !== 'undefined' && SkillEffectPlayer.resolveMobCenterLocal) {
      local = SkillEffectPlayer.resolveMobCenterLocal(actor) || local;
    } else {
      const oy = parseFloat(actor.style.getPropertyValue('--oy')) || 64;
      local = { x: 0, y: Math.round(-oy * 0.35) };
    }
    const x = ar.left - fr.left + (Number(local.x) || 0);
    const y = ar.top - fr.top + (Number(local.y) || 0);
    if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
    // 對齊 hit 特效中心，再略往上，避免蓋住特效、也不跟大體型頂端飛出畫面
    return {
      x: Math.round(x),
      y: Math.round(y - 28),
    };
  }

  function resolveSpawnPoint(actor) {
    const stage = stageEl
      || actor?.closest?.('.idle-boss-stage')
      || actor?.closest?.('.idle-hunt-stage');
    if (!stage || !actor) return null;

    if (actor.classList.contains('idle-actor--mob')) {
      if (actor.closest?.('#idleBossField') || actor.classList.contains('idle-boss-part')) {
        const hitPt = resolveBossHitSpawnPoint(actor);
        if (hitPt) return hitPt;
      }
      const x = parseFloat(actor.style.left);
      const y = parseFloat(actor.style.top);
      const oy = parseFloat(actor.style.getPropertyValue('--oy')) || 64;
      if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
      // BOSS 精靈放大時，傷害數字錨點同步上移（對齊 --boss-sprite-scale）
      let spriteScale = 1;
      if (actor.classList.contains('is-boss-scale-sprite')) {
        const raw = parseFloat(actor.style.getPropertyValue('--boss-sprite-scale'));
        const cssRaw = (!Number.isFinite(raw) || raw <= 0) && typeof window !== 'undefined'
          ? parseFloat(window.getComputedStyle(actor).getPropertyValue('--boss-sprite-scale'))
          : raw;
        spriteScale = Number.isFinite(cssRaw) && cssRaw > 0 ? cssRaw : 2;
      }
      // 對齊血條底（精靈頂 − gap）再往上略留空隙，避免擋頭頂血條
      const hudClearance = 5;
      return {
        x: Math.round(x),
        y: Math.round(y - oy * spriteScale - hudClearance),
      };
    }

    if (actor.classList.contains('idle-actor--player')) {
      const sr = stage.getBoundingClientRect();
      const pr = actor.getBoundingClientRect();
      if (typeof Paperdoll !== 'undefined' && typeof Paperdoll.getHuntHitAnchor === 'function') {
        const anchor = Paperdoll.getHuntHitAnchor(actor);
        if (anchor && Number.isFinite(anchor.x) && Number.isFinite(anchor.y)) {
          return {
            x: Math.round(pr.left + anchor.x - sr.left),
            y: Math.round(pr.top + anchor.y - sr.top),
          };
        }
      }
      const fx = parseFloat(actor.style.left);
      const fy = parseFloat(actor.style.top);
      if (Number.isFinite(fx) && Number.isFinite(fy)) {
        return { x: Math.round(fx), y: Math.round(fy - 72) };
      }
      return {
        x: Math.round(pr.left + pr.width / 2 - sr.left),
        y: Math.round(pr.top + pr.height * 0.42 - sr.top),
      };
    }

    const sr = stage.getBoundingClientRect();
    const ar = actor.getBoundingClientRect();
    return {
      x: Math.round(ar.left + ar.width / 2 - sr.left),
      y: Math.round(ar.top + ar.height * 0.4 - sr.top),
    };
  }

  /**
   * 有 stackGroup：一次施放／一波 tick 內的絕對層數。
   * 無 stackGroup：沿用時間窗自動／多段接續。
   */
  function resolveStackOpts(opts = {}, baseKey) {
    const group = opts.stackGroup != null && String(opts.stackGroup) !== ''
      ? String(opts.stackGroup)
      : '';
    const stackKey = group ? `${baseKey}:g:${group}` : baseKey;

    if (group && Number.isFinite(opts.stackIndex)) {
      return resolveGroupedStack(stackKey, opts);
    }

    if (!opts.multiHit) {
      return nextStackForTarget(stackKey);
    }

    if (Number.isFinite(opts.stackIndex)) {
      const idx = Math.max(0, Math.floor(opts.stackIndex));
      const auto = nextStackForTarget(stackKey, idx);
      const delay = Number.isFinite(opts.delay)
        ? Math.max(0, Number(opts.delay))
        : auto.delay;
      return { stackIndex: auto.stackIndex, delay };
    }

    return nextStackForTarget(stackKey);
  }

  function resolveActorStackZ(actor, fallback = 3) {
    const inline = parseInt(actor?.style?.zIndex, 10);
    if (Number.isFinite(inline)) return inline;
    return fallback;
  }

  function getMobView(uid) {
    const key = String(uid || '');
    if (!key) return null;
    const frame = Math.floor(performance.now() / 16);
    if (frame !== mobViewCacheFrame) {
      mobViewCache.clear();
      mobViewCacheFrame = frame;
    }
    let hit = mobViewCache.get(key);
    if (hit) return hit;
    const actor = document.querySelector(`#idleBossField .idle-actor--mob[data-uid="${key}"]`)
      || document.querySelector(`#idleHuntField .idle-actor--mob[data-uid="${key}"]`);
    if (!actor) return null;
    const point = resolveSpawnPoint(actor);
    if (!point) return null;
    hit = {
      actor,
      point,
      zIndex: resolveActorStackZ(actor) + 1,
    };
    mobViewCache.set(key, hit);
    return hit;
  }

  function spawnOnMob(mob, damageValue, isCritical = false, opts = {}) {
    if (!mob) return null;
    const uid = mob.uid != null ? String(mob.uid) : '';
    let view = getMobView(uid);
    if (!view) {
      // actor 已被清掉時：退回場上座標，避免有傷無字
      let pt = null;
      if (typeof IdleHunt !== 'undefined' && typeof IdleHunt.mobFieldPoint === 'function') {
        pt = IdleHunt.mobFieldPoint(mob);
      }
      if ((!pt || !Number.isFinite(pt.x) || !Number.isFinite(pt.y))
        && Number.isFinite(Number(mob.x)) && Number.isFinite(Number(mob.y))) {
        pt = { x: Number(mob.x), y: Number(mob.y) - 64 };
      }
      if (!pt || !Number.isFinite(pt.x) || !Number.isFinite(pt.y)) return null;
      const jitter = (Math.random() - 0.5) * 8;
      const { stackIndex, delay } = resolveStackOpts(opts, uid ? `mob:${uid}` : 'mob:orphan');
      return spawn(
        damageValue,
        pt.x + jitter,
        pt.y,
        isCritical,
        { skinId: playerSkinId(), stackIndex, delay, zIndex: 6 },
      );
    }
    const jitter = (Math.random() - 0.5) * 8;
    const { stackIndex, delay } = resolveStackOpts(opts, `mob:${uid}`);
    return spawn(
      damageValue,
      view.point.x + jitter,
      view.point.y,
      isCritical,
      { skinId: playerSkinId(), stackIndex, delay, zIndex: view.zIndex },
    );
  }

  function huntOrBossPlayer() {
    const field = activeCombatField();
    if (field) {
      const local = field.querySelector('.idle-actor--player');
      if (local) return local;
    }
    return document.querySelector('#idleBossField .idle-actor--player')
      || document.querySelector('#idleHuntField .idle-actor--player');
  }

  function spawnOnPlayer(damageValue, opts = {}) {
    const player = huntOrBossPlayer();
    if (!player) return null;
    const point = resolveSpawnPoint(player);
    if (!point) return null;
    const jitter = (Math.random() - 0.5) * 8;
    const { stackIndex, delay } = resolveStackOpts(opts, PLAYER_STACK_KEY);
    const zIndex = resolveActorStackZ(player, 3) + 1;
    return spawn(
      damageValue,
      point.x + jitter,
      point.y,
      false,
      { skinId: mobSkinId(), stackIndex, delay, zIndex },
    );
  }

  /** 玩家受擊狀態字：Miss / guard（mob 傷害皮膚 NoRed/Miss.png、guard.png） */
  function spawnPlayerStatusLabel(label, opts = {}) {
    const kind = /^miss$/i.test(String(label || '').trim()) ? 'miss' : 'guard';
    if (typeof DamageSkinCatalog === 'undefined') return null;
    const skinId = mobSkinId();
    const url = DamageSkinCatalog.statusGlyphUrl?.(skinId, kind);
    if (!url) return null;

    const player = huntOrBossPlayer();
    if (!player) return null;
    const point = resolveSpawnPoint(player);
    if (!point) return null;

    const run = () => {
      const layer = ensureLayer();
      if (!layer) return;
      trimOldestIfNeeded();

      const pop = document.createElement('div');
      pop.className = `idle-damage-pop idle-damage-pop--status idle-damage-pop--${kind}`;
      const img = document.createElement('img');
      img.className = 'idle-damage-glyph';
      img.alt = kind === 'miss' ? 'Miss' : 'guard';
      img.draggable = false;
      img.decoding = 'async';
      const cached = typeof DamageSkinCatalog.getStatusImage === 'function'
        ? DamageSkinCatalog.getStatusImage(skinId, kind)
        : null;
      if (cached && cached.complete && cached.naturalWidth > 0) {
        img.src = cached.src || url;
      } else {
        img.src = url;
      }
      pop.appendChild(img);

      const jitter = (Math.random() - 0.5) * 8;
      const { stackIndex, delay } = resolveStackOpts(opts, PLAYER_STACK_KEY);
      const zIndex = resolveActorStackZ(player, 3) + 1;
      pop.style.zIndex = String(zIndex);
      pop.style.left = `${Math.round(point.x + jitter)}px`;
      pop.style.top = `${Math.round(point.y)}px`;
      layer.appendChild(pop);

      const inst = {
        el: pop,
        baseX: Math.round(point.x + jitter),
        baseY: Math.round(point.y),
        age: 0,
        delay: Number.isFinite(opts.delay) ? Math.max(0, Number(opts.delay)) : delay,
        stackIndex,
        skinId,
      };
      instances.add(inst);
      applyPose(inst);
      startLoop();
    };

    const pending = DamageSkinCatalog.ensurePreloaded(skinId);
    if (pending && typeof pending.then === 'function') {
      pending.then(run);
      return null;
    }
    run();
    return null;
  }

  function init(stage) {
    if (stageEl !== stage) layerEl = null;
    stageEl = stage || null;
    ensureLayer();
    warmUp();
  }

  function warmUp() {
    if (typeof DamageSkinCatalog !== 'undefined') {
      DamageSkinCatalog.warmUpAll?.();
    }
  }

  function clear() {
    if (spawnFlushRaf != null) {
      cancelAnimationFrame(spawnFlushRaf);
      spawnFlushRaf = null;
    }
    spawnQueue.length = 0;
    mobViewCache.clear();
    [...instances].forEach((inst) => destroy(inst));
    targetStacks.clear();
    layerEl?.replaceChildren?.();
  }

  /** 清掉過久未用的堆疊鍵（掛機擊殺 uid 會無限增長） */
  function pruneStaleStacks(maxAgeMs = 8000) {
    const maxAge = Math.max(1000, Number(maxAgeMs) || 8000);
    const now = performance.now();
    for (const [key, st] of targetStacks) {
      if (!st || now - (Number(st.lastMs) || 0) > maxAge) {
        targetStacks.delete(key);
      }
    }
    if (mobViewCache.size > 64) mobViewCache.clear();
  }

  warmUp();

  return {
    init,
    spawn,
    spawnOnMob,
    spawnOnPlayer,
    spawnPlayerStatusLabel,
    beginBurst,
    warmUp,
    clear,
    pruneStaleStacks,
    activeCount: () => instances.size,
  };
})();

if (typeof window !== 'undefined') {
  window.DamageNumber = DamageNumber;
}
