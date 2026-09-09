/**
 * 放置怪物動畫：一律吃 IDLE_MOB_DATA（npm run import:mob）。
 * 圖：images/idle-mobs/{id}/{actionPath}/{frame}.png
 * 攻擊／技能若有 {action}/info/effect 會疊在本體上播。
 * 未匯入的 icon 不顯示動畫。
 */
const IdleMobAnim = (() => {
  const VER = '10';
  const FRAME_MS = { stand: 180, fly: 180, move: 90, hit: 80, attack: 80, skill: 80, die: 100, regen: 100 };
  const DIE_MIN_MS = 800;
  const DIE_MAX_MS = 1600;
  const HIT_MS = 280;
  const SKILL_MS = 420;
  /** 鎖招上限（安全網）；實際鎖長以動畫總長為準，勿低於長技（如梅格耐斯 attack4 ~6s） */
  const SKILL_MAX_MS = 30000;
  const MOVE_MS = 320;

  function pad(iconId) {
    if (typeof IdleHuntProgressMaps !== 'undefined') {
      return IdleHuntProgressMaps.padIcon(iconId);
    }
    return String(iconId || '').replace(/\D/g, '').padStart(7, '0').slice(-7);
  }

  function mobDataRoot() {
    if (typeof IDLE_MOB_DATA !== 'undefined') return IDLE_MOB_DATA;
    if (typeof window !== 'undefined' && window.IDLE_MOB_DATA) return window.IDLE_MOB_DATA;
    return null;
  }

  function getMobEntry(iconId) {
    const id = pad(iconId);
    if (!id) return null;
    const bossRoot = typeof IDLE_BOSS_MOB_DATA !== 'undefined'
      ? IDLE_BOSS_MOB_DATA
      : (typeof window !== 'undefined' ? window.IDLE_BOSS_MOB_DATA : null);
    if (bossRoot && bossRoot[id]) return bossRoot[id];
    const root = mobDataRoot();
    if (!root) return null;
    return root[id] || null;
  }

  function getActionFrames(iconId, action) {
    const entry = getMobEntry(iconId);
    if (!entry || !action) return null;
    const frames = entry[action];
    return Array.isArray(frames) ? frames : null;
  }

  function frameMeta(iconId, action, frame) {
    const frames = getActionFrames(iconId, action);
    if (!frames) return null;
    const f = frames[Number(frame) || 0];
    return f && typeof f === 'object' ? f : null;
  }

  function frameOwnedByAction(iconId, action, meta) {
    if (!meta || !meta.src || !action) return false;
    const id = pad(iconId);
    return String(meta.src).includes(`/${id}/${action}/`);
  }

  function actionRange(iconId, action) {
    const frames = getActionFrames(iconId, action);
    if (!frames || !frames.length) return null;
    let min = -1;
    let max = -1;
    for (let i = 0; i < frames.length; i += 1) {
      if (!frames[i]) continue;
      if (min < 0) min = i;
      max = i;
    }
    if (min < 0) return null;
    // 攻擊／技能尾段常 uol 到 stand，播起來會閃；只播到最後一幀「屬於此動作」的圖
    if (/^(attack|skill)\d*$/i.test(action)) {
      while (max >= min && frames[max] && !frameOwnedByAction(iconId, action, frames[max])) {
        max -= 1;
      }
      if (max < min) return null;
    }
    return { min, max };
  }

  function hasAction(iconId, action) {
    return !!actionRange(iconId, action);
  }

  function frameUrl(iconId, action, frame) {
    const meta = frameMeta(iconId, action, frame);
    if (meta && meta.src) return `${meta.src}?v=${VER}`;
    return '';
  }

  function previewUrl(iconId) {
    const id = pad(iconId);
    if (!id || !getMobEntry(id)) return '';
    const idle = resolveStandOrFly(id);
    if (idle) {
      const range = actionRange(id, idle);
      if (range) return frameUrl(id, idle, range.min);
    }
    const entry = getMobEntry(id);
    const firstAction = Object.keys(entry).find((k) => actionRange(id, k));
    if (!firstAction) return '';
    const range = actionRange(id, firstAction);
    return frameUrl(id, firstAction, range.min);
  }

  function actionForKind(kind) {
    if (kind === 'move') return 'move';
    if (kind === 'hit') return 'hit1';
    // attack5+（梅格耐斯等）：不可只認 1–4，否則會落到 stand、動畫播不完／閃招失敗
    if (/^attack\d+$/i.test(kind)) return String(kind).toLowerCase();
    if (kind === 'attack') return 'attack1';
    // skill16 等：不可只認 skill1–4，否則會被落到 stand
    if (/^skill\d+$/i.test(kind)) return String(kind).toLowerCase();
    if (kind === 'skill') return 'skill1';
    if (/^die\d*$/i.test(kind)) return kind === 'die' ? 'die1' : String(kind).toLowerCase();
    if (kind === 'regen') return 'regen';
    if (kind === 'sleep') return 'sleep';
    if (kind === 'wakeup') return 'wakeup';
    if (kind === 'fly') return 'fly';
    return 'stand';
  }

  /** 待機：無 stand 的飛行怪改用 fly */
  function resolveStandOrFly(id) {
    if (hasAction(id, 'stand')) return 'stand';
    if (hasAction(id, 'fly')) return 'fly';
    return null;
  }

  function resolveAction(id, action) {
    id = pad(id);
    if (!getMobEntry(id)) return null;
    let a = action || 'stand';
    if (a === 'hit1' && !hasAction(id, 'hit1') && hasAction(id, 'hit')) a = 'hit';
    if (a === 'die1' && !hasAction(id, 'die1') && hasAction(id, 'die')) a = 'die';
    if (a === 'skill1' && !hasAction(id, 'skill1') && hasAction(id, 'skill')) a = 'skill';
    if (a === 'attack1' && !hasAction(id, 'attack1') && hasAction(id, 'attack')) a = 'attack';
    if (a === 'stand') return resolveStandOrFly(id);
    if (hasAction(id, a)) return a;
    // 缺圖時不要 fallback 成 stand（會造成「技能播到一半變站立」）
    if (/^attack([2-9]|\d{2,})$/i.test(a)) return null;
    if (/^skill([2-9]|\d{2,})$/i.test(a)) return null;
    if (a === 'attack1' || a === 'attack') return null;
    if (/^skill/i.test(a)) return null;
    return resolveStandOrFly(id);
  }

  /** 攻擊／技能本體對應的 effect 路徑，例如 attack1 → attack1/info/effect */
  function effectActionFor(iconId, bodyAction) {
    if (!bodyAction || !/^(attack|skill)\d*$/i.test(bodyAction)) return null;
    const key = `${bodyAction}/info/effect`;
    return hasAction(iconId, key) ? key : null;
  }

  /** 打在目標上的 hit 特效，例如 attack1 → attack1/info/hit（勿用 hit1：那是怪物本體受擊） */
  function hitActionFor(iconId, bodyAction) {
    if (!bodyAction || !/^(attack|skill)\d*$/i.test(bodyAction)) return null;
    const key = `${bodyAction}/info/hit`;
    return hasAction(iconId, key) ? key : null;
  }

  /** 腳下範圍預警，例如 attack1 → attack1/info/areaWarning */
  function areaWarningActionFor(iconId, bodyAction) {
    const id = pad(iconId);
    const resolved = resolveAction(id, bodyAction) || bodyAction;
    if (!resolved || !/^(attack|skill)\d+$/i.test(resolved)) return null;
    const key = `${resolved}/info/areaWarning`;
    return hasAction(id, key) ? key : null;
  }

  function hasAreaWarningAttack(iconId, bodyAction) {
    return !!areaWarningActionFor(iconId, bodyAction);
  }

  function nestedActionDurationMs(iconId, actionKey) {
    const id = pad(iconId);
    const range = actionRange(id, actionKey);
    if (!range) return 0;
    let total = 0;
    for (let f = range.min; f <= range.max; f += 1) {
      total += frameDelay(id, actionKey, f, 'attack');
    }
    return total;
  }

  /** 預警結束／出傷延遲：取 attackAfter 與預警動畫長的較短者，避免預警先結束卻還沒出傷／hit */
  function areaWarningDamageDelayMs(iconId, bodyAction) {
    const after = attackAfterMs(iconId, bodyAction);
    const key = areaWarningActionFor(iconId, bodyAction);
    const warnDur = key ? nestedActionDurationMs(iconId, key) : 0;
    if (after > 0 && warnDur > 0) return Math.min(after, warnDur);
    if (after > 0) return after;
    if (warnDur > 0) return warnDur;
    return 0;
  }

  function actionInfoMeta(iconId, bodyAction) {
    const entry = getMobEntry(iconId);
    const meta = entry && entry._meta;
    if (!meta || !bodyAction) return null;
    return meta[bodyAction] || null;
  }

  function attackAfterMs(iconId, bodyAction) {
    const n = Number(actionInfoMeta(iconId, bodyAction)?.attackAfter);
    return Number.isFinite(n) && n > 0 ? n : 0;
  }

  function effectAfterMs(iconId, bodyAction) {
    const n = Number(actionInfoMeta(iconId, bodyAction)?.effectAfter);
    return Number.isFinite(n) && n > 0 ? n : 0;
  }

  function realDelayMs(ms) {
    if (typeof IdleHunt !== 'undefined' && typeof IdleHunt.scaleDelayMs === 'function') {
      return IdleHunt.scaleDelayMs(ms);
    }
    return Math.max(0, Number(ms) || 0);
  }

  /** 怪物 hit／skill 出傷延遲：優先 attackAfter，技能再 fallback effectAfter */
  function mobDamageDelayMs(iconId, bodyAction) {
    const id = pad(iconId);
    const resolved = resolveAction(id, bodyAction) || bodyAction;
    const after = attackAfterMs(id, resolved);
    if (after > 0) return after;
    if (/^skill/i.test(String(resolved))) {
      const eff = effectAfterMs(id, resolved);
      if (eff > 0) return eff;
    }
    return 0;
  }

  function parseOrigin(raw) {
    if (Array.isArray(raw) && raw.length >= 2) return [Number(raw[0]) || 0, Number(raw[1]) || 0];
    if (raw && typeof raw === 'object') {
      const x = raw.x ?? raw[0];
      const y = raw.y ?? raw[1];
      if (x != null && y != null) return [Number(x) || 0, Number(y) || 0];
    }
    return null;
  }

  function lookupOrigin(id, action, frame) {
    const meta = frameMeta(id, action, frame);
    if (meta && Array.isArray(meta.origin)) return parseOrigin(meta.origin);
    return null;
  }

  function frameDelay(iconId, action, frame, kind) {
    const meta = frameMeta(iconId, action, frame);
    if (meta && Number.isFinite(meta.delay) && meta.delay > 0) return meta.delay;
    let k = kind || 'stand';
    if (/^attack/i.test(k)) k = 'attack';
    else if (/^skill/i.test(k)) k = 'skill';
    return FRAME_MS[k] || FRAME_MS.stand;
  }

  function applyOrigin(img, { updateActor = true } = {}) {
    if (!img) return;
    const actor = img.closest('.idle-actor--mob');
    const id = img.dataset.iconId || '';
    const action = img.dataset.action || 'stand';
    const frame = Number(img.dataset.frame) || 0;
    const fromWz = lookupOrigin(id, action, frame);
    const ox = fromWz ? fromWz[0] : Math.round((img.naturalWidth || 0) / 2);
    const oy = fromWz ? fromWz[1] : (img.naturalHeight || 0);
    img.style.setProperty('--ox', `${ox}px`);
    img.style.setProperty('--oy', `${oy}px`);
    if (updateActor && actor) {
      actor.style.setProperty('--ox', `${ox}px`);
      actor.style.setProperty('--oy', `${oy}px`);
    }
  }

  function applySrc(img, url) {
    if (!img) return;
    if (!url) {
      img.removeAttribute('src');
      img.dataset.src = '';
      return;
    }
    if (img.dataset.src === url) return;
    img.dataset.src = url;
    img.src = url;
  }

  /** 預載幀，減少 attack 換幀時 decode 空窗 */
  function preloadFrame(id, action, frame) {
    const url = frameUrl(id, action, frame);
    if (!url || !frameMeta(id, action, frame)) return Promise.resolve(null);
    if (typeof EnchantImagePreload !== 'undefined' && EnchantImagePreload.preload) {
      return EnchantImagePreload.preload(url);
    }
    return new Promise((resolve) => {
      const probe = new Image();
      const done = () => resolve(probe);
      probe.addEventListener('load', done, { once: true });
      probe.addEventListener('error', () => resolve(null), { once: true });
      probe.src = url;
    });
  }

  function clearSprite(img, id) {
    if (!img) return;
    img.dataset.mode = 'none';
    img.dataset.action = '';
    img.dataset.iconId = pad(id || img.dataset.iconId || '');
    img.dataset.frame = '0';
    img.dataset.bodyDone = '0';
    img.dataset.frameToken = '';
    applySrc(img, '');
    clearEffect(img);
  }

  function ensureStage(img) {
    if (!img || !img.parentElement) return null;
    if (img.parentElement.classList.contains('idle-actor-sprite-stage')) {
      return img.parentElement;
    }
    const actor = img.closest('.idle-actor--mob');
    if (!actor) return null;
    const stage = document.createElement('div');
    stage.className = 'idle-actor-sprite-stage';
    img.replaceWith(stage);
    stage.appendChild(img);
    return stage;
  }

  /** 清掉舊版雙緩衝殘留 */
  function removeLegacyBackBuffers(stage) {
    if (!stage) return;
    stage.querySelectorAll(':scope > .idle-actor-sprite--back').forEach((node) => node.remove());
  }

  function ensureEffectImg(bodyImg) {
    const stage = ensureStage(bodyImg);
    if (!stage) return null;
    let fx = stage.querySelector(':scope > .idle-actor-sprite--effect');
    if (!fx) {
      fx = document.createElement('img');
      fx.className = 'idle-actor-sprite idle-actor-sprite--effect';
      fx.alt = '';
      fx.hidden = true;
      stage.appendChild(fx);
      fx.addEventListener('load', () => applyOrigin(fx, { updateActor: false }));
    }
    return fx;
  }

  /** 僅 mob 本體換幀用預載；hit／effect 不用雙緩衝 */
  function layerUsesBackBuffer(img) {
    return !!img
      && !img.classList.contains('idle-actor-sprite--hit')
      && !img.classList.contains('idle-actor-sprite--effect');
  }

  function clearEffect(bodyImg) {
    const stage = bodyImg?.parentElement;
    if (!stage?.classList.contains('idle-actor-sprite-stage')) return;
    const fx = stage.querySelector(':scope > .idle-actor-sprite--effect');
    if (!fx) return;
    fx.hidden = true;
    fx.dataset.mode = 'none';
    fx.dataset.action = '';
    fx.dataset.frame = '0';
    fx.dataset.frameAcc = '0';
    fx.dataset.done = '1';
    fx.dataset.frameToken = '';
    applySrc(fx, '');
  }

  function bindLayer(img, iconId, action, frame, { updateActor = true } = {}) {
    const id = pad(iconId);
    const range = actionRange(id, action);
    if (!range) return false;
    let f = Math.max(0, Math.floor(Number(frame) || 0));
    if (f < range.min) f = range.min;
    if (f > range.max) f = range.max;
    if (!frameMeta(id, action, f)) return false;
    const url = frameUrl(id, action, f);
    if (!url) return false;

    img.dataset.mode = 'anim';
    img.dataset.iconId = id;
    img.dataset.action = action;
    img.dataset.frame = String(f);
    const token = `${id}|${action}|${f}|${url}`;
    img.dataset.frameToken = token;

    const wantActor = updateActor
      && !img.classList.contains('idle-actor-sprite--effect')
      && !img.classList.contains('idle-actor-sprite--hit');

    const commit = () => {
      if (img.dataset.frameToken !== token) return;
      if (img.dataset.src !== url) {
        img.dataset.src = url;
        img.src = url;
      }
      applyOrigin(img, { updateActor: wantActor });
    };

    // 已是目標圖或共用快取已有：只同步 origin／立刻 commit
    const cached = typeof EnchantImagePreload !== 'undefined'
      ? EnchantImagePreload.getImage?.(url)
      : null;
    if ((img.dataset.src === url && img.complete && img.naturalWidth) || cached) {
      commit();
    } else {
      // 解碼完再同時換 src＋origin，避免「舊圖＋新錨點」閃一下
      const probe = new Image();
      const finish = () => {
        if (img.dataset.frameToken !== token) return;
        commit();
      };
      probe.addEventListener('load', finish, { once: true });
      probe.addEventListener('error', finish, { once: true });
      probe.src = url;
      if (probe.complete && probe.naturalWidth) finish();
    }

    if (layerUsesBackBuffer(img)) {
      let next = f + 1;
      while (next <= range.max && !frameMeta(id, action, next)) next += 1;
      if (next <= range.max) preloadFrame(id, action, next);
    }
    return true;
  }

  function startEffect(bodyImg, iconId, bodyAction) {
    const fxAction = effectActionFor(iconId, bodyAction);
    const fx = ensureEffectImg(bodyImg);
    if (!fx) return;
    if (!fxAction) {
      clearEffect(bodyImg);
      return;
    }
    fx.hidden = false;
    fx.dataset.done = '0';
    fx.dataset.frameAcc = '0';
    bindLayer(fx, iconId, fxAction, 0, { updateActor: false });
  }

  function isEffectDone(bodyImg) {
    const stage = bodyImg?.parentElement;
    const fx = stage?.querySelector?.(':scope > .idle-actor-sprite--effect');
    if (!fx || fx.hidden || fx.dataset.mode !== 'anim') return true;
    return fx.dataset.done === '1';
  }

  /**
   * 推進 attack／skill 的 effect 層（與本體 delay 獨立）。
   * @returns {{ active: boolean, wrapped: boolean }}
   */
  function tickEffect(bodyImg, kind, dt) {
    if (!/^attack/i.test(kind) && !/^skill/i.test(kind)) {
      return { active: false, wrapped: true };
    }
    const fx = bodyImg?.parentElement?.querySelector?.(':scope > .idle-actor-sprite--effect');
    if (!fx || fx.hidden || fx.dataset.mode !== 'anim') {
      return { active: false, wrapped: true };
    }
    if (fx.dataset.done === '1') return { active: true, wrapped: true };

    const id = fx.dataset.iconId || bodyImg.dataset.iconId;
    let acc = (Number(fx.dataset.frameAcc) || 0) + (Number(dt) || 0) * 1000;
    let wrapped = false;
    // 戰鬥 tick（100ms）可能大於單幀 delay（如 60ms），需一次補多幀
    for (let guard = 0; guard < 32; guard += 1) {
      const action = fx.dataset.action;
      const frame = Number(fx.dataset.frame) || 0;
      const step = frameDelay(id, action, frame, kind);
      if (acc < step) {
        fx.dataset.frameAcc = String(acc);
        return { active: true, wrapped: false };
      }
      acc -= step;
      fx.dataset.frameAcc = String(acc);

      const range = actionRange(id, action);
      if (!range) {
        fx.dataset.done = '1';
        return { active: true, wrapped: true };
      }
      let next = frame + 1;
      while (next <= range.max && !frameMeta(id, action, next)) next += 1;
      if (next > range.max) {
        fx.dataset.done = '1';
        bindLayer(fx, id, action, range.max, { updateActor: false });
        return { active: true, wrapped: true };
      }
      bindLayer(fx, id, action, next, { updateActor: false });
      wrapped = false;
    }
    return { active: true, wrapped };
  }

  function syncPlayerHitAnchor(playerEl, stage) {
    if (!playerEl || !stage) return;
    // 掛在玩家上，不進紙娃娃，才不會被 scaleX(-1) 鏡像
    if (stage.parentElement !== playerEl) {
      playerEl.appendChild(stage);
    }
    const anchor = typeof Paperdoll !== 'undefined' && typeof Paperdoll.getHuntHitAnchor === 'function'
      ? Paperdoll.getHuntHitAnchor(playerEl)
      : (typeof Paperdoll !== 'undefined' && typeof Paperdoll.getHuntBodyOrigin === 'function'
        ? Paperdoll.getHuntBodyOrigin(playerEl)
        : null);
    if (anchor && Number.isFinite(anchor.x) && Number.isFinite(anchor.y)) {
      stage.style.left = `${anchor.x}px`;
      stage.style.top = `${anchor.y}px`;
      stage.style.right = 'auto';
      stage.style.bottom = 'auto';
      stage.style.transform = 'none';
      return;
    }
    stage.style.left = '50%';
    stage.style.top = '55%';
    stage.style.transform = 'translate(-50%, -50%)';
  }

  function ensurePlayerHitImg(playerEl) {
    if (!playerEl) return null;
    // 移除舊版掛在紙娃娃內的 hit stage，避免重複顯示
    playerEl.querySelectorAll('[data-paperdoll="hunt"] .idle-actor-hit-stage').forEach((node) => {
      node.remove();
    });
    let stage = playerEl.querySelector(':scope > .idle-actor-hit-stage');
    if (!stage) {
      stage = document.createElement('div');
      stage.className = 'idle-actor-sprite-stage idle-actor-hit-stage';
      playerEl.appendChild(stage);
    }
    syncPlayerHitAnchor(playerEl, stage);
    let img = stage.querySelector(':scope > .idle-actor-sprite--hit');
    if (!img) {
      img = document.createElement('img');
      img.className = 'idle-actor-sprite idle-actor-sprite--hit';
      img.alt = '';
      img.hidden = true;
      stage.appendChild(img);
      img.addEventListener('load', () => applyOrigin(img, { updateActor: false }));
    }
    return img;
  }

  function clearPlayerHit(playerEl) {
    const stage = playerEl?.querySelector?.(':scope > .idle-actor-hit-stage');
    const img = stage?.querySelector?.(':scope > .idle-actor-sprite--hit');
    if (!img) return;
    img.hidden = true;
    img.dataset.mode = 'none';
    img.dataset.action = '';
    img.dataset.frame = '0';
    img.dataset.frameAcc = '0';
    img.dataset.done = '1';
    img.dataset.frameToken = '';
    applySrc(img, '');
  }

  function syncAreaWarningAnchor(playerEl, stage) {
    if (!playerEl || !stage) return;
    if (stage.parentElement !== playerEl) playerEl.appendChild(stage);
    const anchor = typeof Paperdoll !== 'undefined' && typeof Paperdoll.getHuntFeetAnchor === 'function'
      ? Paperdoll.getHuntFeetAnchor(playerEl)
      : null;
    if (anchor && Number.isFinite(anchor.x) && Number.isFinite(anchor.y)) {
      stage.style.left = `${anchor.x}px`;
      stage.style.top = `${anchor.y}px`;
      stage.style.transform = 'none';
      return;
    }
    stage.style.left = '50%';
    stage.style.top = '78%';
    stage.style.transform = 'translate(-50%, -50%)';
  }

  function ensureAreaWarningImg(playerEl) {
    if (!playerEl) return null;
    let stage = playerEl.querySelector(':scope > .idle-actor-area-warning-stage');
    if (!stage) {
      stage = document.createElement('div');
      stage.className = 'idle-actor-sprite-stage idle-actor-area-warning-stage';
      playerEl.appendChild(stage);
    }
    syncAreaWarningAnchor(playerEl, stage);
    let img = stage.querySelector(':scope > .idle-actor-sprite--area-warning');
    if (!img) {
      img = document.createElement('img');
      img.className = 'idle-actor-sprite idle-actor-sprite--area-warning';
      img.alt = '';
      img.hidden = true;
      stage.appendChild(img);
      img.addEventListener('load', () => applyOrigin(img, { updateActor: false }));
    }
    return img;
  }

  function clearAreaWarning(playerEl, opts = {}) {
    if (!playerEl) return;
    const keepVisual = !!opts.keepVisual;
    const flushDamage = !!opts.flushDamage;
    const timerId = Number(playerEl.dataset.areaWarningTimer);
    if (timerId) window.clearTimeout(timerId);
    delete playerEl.dataset.areaWarningTimer;
    // 預警動畫先結束、但 attackAfter 尚未到：仍要補一次出傷，否則炎魔等會完全沒傷害
    if (flushDamage
      && playerEl.dataset.areaWarningToken
      && playerEl.dataset.areaWarningDamageDone !== '1'
      && typeof playerEl._areaWarningOnDamage === 'function') {
      playerEl.dataset.areaWarningDamageDone = '1';
      try {
        playerEl._areaWarningOnDamage();
      } catch (_) { /* ignore */ }
    }
    delete playerEl._areaWarningOnDamage;
    if (!keepVisual) {
      delete playerEl.dataset.areaWarningToken;
      delete playerEl.dataset.areaWarningDamageDone;
    }
    if (keepVisual) return;
    const stage = playerEl.querySelector(':scope > .idle-actor-area-warning-stage');
    const img = stage?.querySelector?.(':scope > .idle-actor-sprite--area-warning');
    if (!img) return;
    img.hidden = true;
    img.dataset.mode = 'none';
    img.dataset.action = '';
    img.dataset.frame = '0';
    img.dataset.frameAcc = '0';
    img.dataset.done = '1';
    img.dataset.frameToken = '';
    applySrc(img, '');
  }

  function isAreaWarningActive(playerEl) {
    const stage = playerEl?.querySelector?.(':scope > .idle-actor-area-warning-stage');
    const img = stage?.querySelector?.(':scope > .idle-actor-sprite--area-warning');
    if (playerEl?.dataset?.areaWarningToken) return true;
    return !!(img && !img.hidden && img.dataset.mode === 'anim' && img.dataset.done !== '1');
  }

  /**
   * 怪物 areaWarning 攻擊：在玩家腳下播預警，attackAfter 後 onDamage；動畫播完才清場。
   */
  function playAreaWarning(playerEl, iconId, bodyAction, opts = {}) {
    if (!playerEl) return false;
    const id = pad(iconId);
    const resolved = resolveAction(id, bodyAction) || bodyAction;
    const warningAction = areaWarningActionFor(id, resolved);
    if (!warningAction) return false;

    clearAreaWarning(playerEl, { flushDamage: true });
    const token = `${id}:${resolved}:${Date.now()}`;
    playerEl.dataset.areaWarningToken = token;
    playerEl.dataset.areaWarningDamageDone = '0';
    playerEl._areaWarningOnDamage = typeof opts.onDamage === 'function' ? opts.onDamage : null;
    const damageDelayMs = Math.max(1, areaWarningDamageDelayMs(id, resolved) || 1200);

    const img = ensureAreaWarningImg(playerEl);
    if (!img) {
      delete playerEl._areaWarningOnDamage;
      delete playerEl.dataset.areaWarningToken;
      delete playerEl.dataset.areaWarningDamageDone;
      return false;
    }
    img.hidden = false;
    img.dataset.done = '0';
    img.dataset.frameAcc = '0';
    bindLayer(img, id, warningAction, 0, { updateActor: false });

    const timerId = window.setTimeout(() => {
      if (playerEl.dataset.areaWarningToken !== token) return;
      if (playerEl.dataset.areaWarningDamageDone === '1') return;
      playerEl.dataset.areaWarningDamageDone = '1';
      const cb = playerEl._areaWarningOnDamage;
      if (typeof cb === 'function') cb();
    }, realDelayMs(damageDelayMs));
    playerEl.dataset.areaWarningTimer = String(timerId);
    return true;
  }

  function tickAreaWarning(playerEl, dt) {
    const stage = playerEl?.querySelector?.(':scope > .idle-actor-area-warning-stage');
    if (stage) syncAreaWarningAnchor(playerEl, stage);
    const img = stage?.querySelector?.(':scope > .idle-actor-sprite--area-warning');
    if (!img || img.hidden || img.dataset.mode !== 'anim') {
      return { active: false, wrapped: true };
    }
    if (img.dataset.done === '1') {
      img.hidden = true;
      return { active: false, wrapped: true };
    }
    const id = img.dataset.iconId;
    let acc = (Number(img.dataset.frameAcc) || 0) + (Number(dt) || 0) * 1000;
    for (let guard = 0; guard < 32; guard += 1) {
      const action = img.dataset.action;
      const frame = Number(img.dataset.frame) || 0;
      const step = frameDelay(id, action, frame, 'attack');
      if (acc < step) {
        img.dataset.frameAcc = String(acc);
        return { active: true, wrapped: false };
      }
      acc -= step;
      img.dataset.frameAcc = String(acc);
      const range = actionRange(id, action);
      if (!range) {
        img.dataset.done = '1';
        clearAreaWarning(playerEl, { flushDamage: true });
        return { active: false, wrapped: true };
      }
      let next = frame + 1;
      while (next <= range.max && !frameMeta(id, action, next)) next += 1;
      if (next > range.max) {
        img.dataset.done = '1';
        bindLayer(img, id, action, range.max, { updateActor: false });
        clearAreaWarning(playerEl, { flushDamage: true });
        return { active: false, wrapped: true };
      }
      bindLayer(img, id, action, next, { updateActor: false });
    }
    return { active: true, wrapped: false };
  }

  /**
   * 列出 {action}/info/effect0/{n} 圖塊動作鍵。
   */
  function effect0ActionKeys(iconId, bodyAction) {
    const id = pad(iconId);
    const resolved = resolveAction(id, bodyAction) || bodyAction;
    const entry = getMobEntry(id);
    if (!entry || !resolved) return [];
    const prefix = `${resolved}/info/effect0/`;
    return Object.keys(entry)
      .filter((k) => k.startsWith(prefix) && Array.isArray(entry[k]) && entry[k].some(Boolean))
      .sort((a, b) => (Number(a.slice(prefix.length)) || 0) - (Number(b.slice(prefix.length)) || 0));
  }

  function actionFrameList(iconId, actionKey) {
    const id = pad(iconId);
    const frames = getMobEntry(id)?.[actionKey];
    if (!Array.isArray(frames)) return [];
    return frames.filter((f) => f && f.src).map((f) => ({
      src: f.src,
      delay: Number(f.delay) || 90,
      origin: Array.isArray(f.origin) ? f.origin.slice(0, 2) : [0, 0],
    }));
  }

  /**
   * 在場地玩家高度鋪一整橫排 effect0（如巴洛古 attack2）。
   * 使用第一組 effect0/N 圖塊，依圖寬水平重複。
   */
  function playEffect0Row(opts = {}) {
    const fieldEl = opts.fieldEl;
    const playerEl = opts.playerEl;
    if (!fieldEl || typeof SkillEffectPlayer === 'undefined' || !SkillEffectPlayer.playFrames) {
      return false;
    }
    const keys = effect0ActionKeys(opts.iconId, opts.bodyAction);
    if (!keys.length) return false;
    const frames = actionFrameList(opts.iconId, keys[0]);
    if (!frames.length) return false;
    const layer = fieldEl.querySelector('.idle-hunt-skill-fx') || fieldEl;
    const fieldW = fieldEl.clientWidth
      || Number.parseFloat(fieldEl.style.width)
      || 1366;
    const playerY = Number.parseFloat(playerEl?.style?.top);
    const y = Number.isFinite(playerY)
      ? playerY
      : (fieldEl.clientHeight || 768) * 0.8;
    const originX = Number(frames[0].origin?.[0]) || 60;
    const tw = Math.max(64, Number(opts.tileWidth) || originX * 2 || 128);
    const count = Math.max(1, Math.ceil(fieldW / tw) + 1);
    for (let i = 0; i < count; i += 1) {
      const x = i * tw + tw * 0.5;
      SkillEffectPlayer.playFrames(layer, frames, {
        x,
        y,
        className: 'idle-skill-fx-stage idle-skill-fx-stage--boss-effect0',
        zIndex: 100016,
      });
    }
    return true;
  }

  /**
   * 在 stand1 肚臍（固定）播放 mob 的 info/hit；掛在玩家容器上不跟紙娃娃 swing 晃動。
   * 若有 attackAfter 會延遲到打擊點再播；areaWarning 出傷當下請傳 { immediate: true }。
   */
  function playPlayerHit(playerEl, iconId, bodyAction, opts = {}) {
    if (!playerEl) return;
    const id = pad(iconId);
    const resolved = resolveAction(id, bodyAction) || bodyAction;
    const hitAction = hitActionFor(id, resolved);
    const token = `${id}:${resolved}:${Date.now()}`;
    playerEl.dataset.hitFxToken = token;
    if (!hitAction) {
      clearPlayerHit(playerEl);
      return;
    }
    const delay = opts.immediate
      ? 0
      : (opts.delayMs != null
        ? Math.max(0, Number(opts.delayMs) || 0)
        : mobDamageDelayMs(id, resolved));
    const start = () => {
      if (playerEl.dataset.hitFxToken !== token) return;
      const img = ensurePlayerHitImg(playerEl);
      if (!img) return;
      img.hidden = false;
      img.dataset.done = '0';
      img.dataset.frameAcc = '0';
      bindLayer(img, id, hitAction, 0, { updateActor: false });
    };
    if (delay > 0) setTimeout(start, realDelayMs(delay));
    else start();
  }

  function tickPlayerHit(playerEl, dt) {
    const stage = playerEl?.querySelector?.(':scope > .idle-actor-hit-stage');
    if (stage) syncPlayerHitAnchor(playerEl, stage);
    const img = stage?.querySelector?.(':scope > .idle-actor-sprite--hit');
    if (!img || img.hidden || img.dataset.mode !== 'anim') {
      return { active: false, wrapped: true };
    }
    if (img.dataset.done === '1') {
      img.hidden = true;
      return { active: false, wrapped: true };
    }
    const id = img.dataset.iconId;
    let acc = (Number(img.dataset.frameAcc) || 0) + (Number(dt) || 0) * 1000;
    for (let guard = 0; guard < 32; guard += 1) {
      const action = img.dataset.action;
      const frame = Number(img.dataset.frame) || 0;
      const step = frameDelay(id, action, frame, 'attack');
      if (acc < step) {
        img.dataset.frameAcc = String(acc);
        return { active: true, wrapped: false };
      }
      acc -= step;
      img.dataset.frameAcc = String(acc);
      const range = actionRange(id, action);
      if (!range) {
        img.dataset.done = '1';
        img.hidden = true;
        return { active: false, wrapped: true };
      }
      let next = frame + 1;
      while (next <= range.max && !frameMeta(id, action, next)) next += 1;
      if (next > range.max) {
        img.dataset.done = '1';
        bindLayer(img, id, action, range.max, { updateActor: false });
        img.hidden = true;
        applySrc(img, '');
        return { active: false, wrapped: true };
      }
      bindLayer(img, id, action, next, { updateActor: false });
    }
    return { active: true, wrapped: false };
  }

  function bind(img, iconId, action, frame) {
    if (!img) return;
    const id = pad(iconId);
    if (!id) {
      clearSprite(img, '');
      return;
    }
    ensureStage(img);
    removeLegacyBackBuffers(img.parentElement);
    const a = resolveAction(id, action || 'stand');
    if (!a) {
      clearSprite(img, id);
      return;
    }
    img.dataset.bodyDone = '0';
    if (!bindLayer(img, id, a, frame, { updateActor: true })) {
      clearSprite(img, id);
      return;
    }
    startEffect(img, id, a);
  }

  function advance(img, kind) {
    if (!img) return { wrapped: false };
    const id = img.dataset.iconId;
    const oneShot = kind === 'hit' || kind === 'regen'
      || /^attack/i.test(kind)
      || /^skill/i.test(kind)
      || kind === 'die'
      || /^die/i.test(kind)
      || kind === 'wakeup';
    if (!id || img.dataset.mode !== 'anim' || !getMobEntry(id)) {
      return { wrapped: oneShot };
    }
    const action = actionForKind(kind);
    const resolved = resolveAction(id, action);
    if (!resolved) return { wrapped: oneShot };

    const range = actionRange(id, resolved);
    if (!range) return { wrapped: oneShot };
    let frame = Number(img.dataset.frame) || 0;
    const switched = img.dataset.action !== resolved;
    if (switched) {
      bind(img, id, resolved, range.min);
      return { wrapped: false };
    }
    frame += 1;
    while (frame <= range.max && !frameMeta(id, resolved, frame)) frame += 1;
    let bodyWrapped = false;
    if (frame > range.max) {
      bodyWrapped = true;
      frame = oneShot ? range.max : range.min;
    }
    // 引導技：repeatFrame 期間從 loopFrom 循環，不標記 bodyDone
    if (oneShot && bodyWrapped) {
      const actorEl = img.closest?.('.idle-actor');
      const channelUntil = Number(actorEl?.dataset?.channelUntil) || 0;
      const loopFrom = Number(actorEl?.dataset?.channelLoopFrom);
      if (
        actorEl
        && channelUntil > Date.now()
        && Number.isFinite(loopFrom)
        && loopFrom >= range.min
        && loopFrom <= range.max
      ) {
        bodyWrapped = false;
        frame = loopFrom;
        while (frame <= range.max && !frameMeta(id, resolved, frame)) frame += 1;
        if (frame > range.max) frame = loopFrom;
        img.dataset.bodyDone = '0';
        if (!bindLayer(img, id, resolved, frame, { updateActor: true })) {
          img.dataset.bodyDone = '1';
          bindLayer(img, id, resolved, range.max, { updateActor: true });
          bodyWrapped = true;
        }
        if (/^attack/i.test(kind) || /^skill/i.test(kind)) {
          return { wrapped: false };
        }
        return { wrapped: false };
      }
    }
    if (oneShot && bodyWrapped) {
      img.dataset.bodyDone = '1';
      bindLayer(img, id, resolved, range.max, { updateActor: true });
    } else {
      img.dataset.bodyDone = '0';
      if (!bindLayer(img, id, resolved, frame, { updateActor: true })) {
        img.dataset.bodyDone = '1';
        bindLayer(img, id, resolved, range.max, { updateActor: true });
        bodyWrapped = true;
      } else if (!/^(attack|skill)\d*$/i.test(resolved)) {
        clearEffect(img);
      }
    }

    if (/^attack/i.test(kind) || /^skill/i.test(kind)) {
      return { wrapped: (bodyWrapped || img.dataset.bodyDone === '1') && isEffectDone(img) };
    }
    return { wrapped: bodyWrapped };
  }

  function getRange(id, action) {
    return actionRange(id, action);
  }

  function actionDurationMs(iconId, action, kind) {
    const id = pad(iconId);
    const resolved = resolveAction(id, action || 'stand');
    if (!resolved) return 0;
    const range = actionRange(id, resolved);
    if (!range) return 0;
    let total = 0;
    const k = kind || resolved;
    for (let f = range.min; f <= range.max; f += 1) {
      total += frameDelay(id, resolved, f, k);
    }
    return total;
  }

  function preloadAction(iconId, action) {
    const id = pad(iconId);
    const resolved = resolveAction(id, action || 'stand');
    if (!resolved) return Promise.resolve();
    const range = actionRange(id, resolved);
    if (!range) return Promise.resolve();
    const tasks = [];
    for (let f = range.min; f <= range.max; f += 1) {
      tasks.push(preloadFrame(id, resolved, f));
    }
    const fx = effectActionFor(id, resolved);
    if (fx && fx !== resolved) {
      const fxRange = actionRange(id, fx);
      if (fxRange) {
        for (let f = fxRange.min; f <= fxRange.max; f += 1) {
          tasks.push(preloadFrame(id, fx, f));
        }
      }
    }
    return Promise.all(tasks);
  }

  /** 收集該 mob 資料裡所有有圖的幀 URL（含 attack/info/effect 等巢狀動作） */
  function collectFrameUrls(iconId) {
    const entry = getMobEntry(iconId);
    if (!entry) return [];
    const urls = [];
    Object.keys(entry).forEach((key) => {
      const frames = entry[key];
      if (!Array.isArray(frames)) return;
      frames.forEach((f) => {
        if (f?.src) urls.push(f.src);
      });
    });
    return [...new Set(urls)];
  }

  /** 預載整隻 mob 全部動作幀，避免入場後換幀卡住 */
  function preloadMob(iconId) {
    const urls = collectFrameUrls(iconId);
    if (!urls.length) return Promise.resolve();
    if (typeof EnchantImagePreload !== 'undefined' && EnchantImagePreload.preloadMany) {
      return EnchantImagePreload.preloadMany(urls).catch(() => {});
    }
    return Promise.all(urls.map((url) => new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = url;
    }))).then(() => {});
  }

  function isSticker() {
    return false;
  }

  function actorBodyImg(el) {
    return el?.querySelector('.idle-actor-sprite:not(.idle-actor-sprite--effect)') || null;
  }

  /** Same priority order as chapter IdleHunt.spriteKind */
  function spriteKind(el) {
    if (!el) return 'stand';
    if (el.classList.contains('is-dying')) return 'die';
    if (el.dataset.introAction) return el.dataset.introAction;
    const img = actorBodyImg(el);
    const skillUntil = Number(el.dataset.skillUntil) || 0;
    if (skillUntil > Date.now()) return img?.dataset?.kindAction || 'skill1';
    const attackUntil = Number(el.dataset.attackUntil) || 0;
    if (attackUntil > Date.now()) {
      return el.dataset.attackAction || img?.dataset?.kindAction || 'attack1';
    }
    const hitUntil = Number(el.dataset.hitUntil) || 0;
    if (hitUntil > Date.now()) return 'hit';
    const moveUntil = Number(el.dataset.moveUntil) || 0;
    if (el.classList.contains('is-moving') || moveUntil > Date.now()) return 'move';
    // 機制 hold（如西格諾斯 sleep）：避免 skillUntil 到期後閃一幀 stand
    if (el.dataset.holdAction) return el.dataset.holdAction;
    return 'stand';
  }

  function isActorCasting(el) {
    if (!el || el.classList.contains('is-dying')) return false;
    const skillUntil = Number(el.dataset.skillUntil) || 0;
    if (skillUntil > Date.now()) return true;
    const attackUntil = Number(el.dataset.attackUntil) || 0;
    return attackUntil > Date.now();
  }

  function clearActorCastFlags(el) {
    if (!el) return;
    el.dataset.hitUntil = '0';
    el.dataset.skillUntil = '0';
    el.dataset.attackUntil = '0';
    el.dataset.attackAction = '';
    el.dataset.moveUntil = '0';
    el.dataset.channelUntil = '0';
    el.dataset.channelLoopFrom = '';
    delete el.dataset.introAction;
  }

  /**
   * 引導技本體動畫：播放 action，並在 untilMs 內從 loopFrom 循環。
   * skillUntil 鎖到 untilMs，期間 isActorCasting 為 true。
   */
  function startActorChannel(el, opts = {}) {
    if (!el || el.classList.contains('is-dying')) return false;
    if (isActorCasting(el)) return false;
    const img = actorBodyImg(el);
    const iconId = pad(opts.iconId || img?.dataset.iconId || '');
    const want = actionForKind(opts.action || 'skill1');
    const resolved = iconId ? resolveAction(iconId, want) : null;
    if (!resolved || resolved === 'stand' || !img || !iconId) return false;
    const scaleDelayMs = typeof opts.scaleDelayMs === 'function' ? opts.scaleDelayMs : (ms) => ms;
    const untilMs = Math.max(200, scaleDelayMs(Number(opts.untilMs) || 0));
    const loopFrom = Math.max(0, Math.floor(Number(opts.loopFrom) || 0));
    const range = actionRange(iconId, resolved);
    if (!range) return false;

    el.dataset.hitUntil = '0';
    el.dataset.attackUntil = '0';
    el.dataset.attackAction = '';
    el.dataset.channelUntil = String(Date.now() + untilMs);
    el.dataset.channelLoopFrom = String(
      Number.isFinite(loopFrom) && loopFrom >= range.min && loopFrom <= range.max
        ? loopFrom
        : range.min,
    );
    el.dataset.skillUntil = String(Date.now() + untilMs);
    img.dataset.frameAcc = '0';
    img.dataset.bodyDone = '0';
    img.dataset.kindAction = resolved;
    bind(img, iconId, resolved, range.min);
    return true;
  }

  function endActorChannel(el) {
    if (!el) return;
    el.dataset.channelUntil = '0';
    el.dataset.channelLoopFrom = '';
  }

  function bindActorSprite(el, iconId, kind) {
    const img = actorBodyImg(el);
    if (!img) return;
    const k = kind || 'stand';
    const id = pad(iconId || img.dataset.iconId);
    img.dataset.kindAction = k;
    bind(img, id, actionForKind(k), 0);
  }

  /**
   * Same as chapter flashMobAttack: sets attackUntil / skillUntil, plays by frame delay.
   * @returns {boolean}
   */
  function flashActorAttack(el, actionName, opts = {}) {
    if (!el || el.classList.contains('is-dying')) return false;
    if (isActorCasting(el)) return false;
    const img = actorBodyImg(el);
    const iconId = pad(opts.iconId || img?.dataset.iconId || '');
    const want = actionForKind(actionName || 'attack1');
    const resolved = iconId ? resolveAction(iconId, want) : null;
    const hasAnim = !!(resolved && resolved !== 'stand');
    const scaleDelayMs = typeof opts.scaleDelayMs === 'function' ? opts.scaleDelayMs : (ms) => ms;

    if (!hasAnim) {
      if (!/^attack1$/i.test(String(want)) && String(want) !== 'attack') return false;
      el.dataset.hitUntil = '0';
      el.dataset.attackAction = '';
      el.dataset.attackUntil = String(Date.now() + 50);
      return true;
    }
    if (!img || !iconId) return false;

    const bodyMs = Math.max(
      80,
      Number(actionDurationMs(iconId, resolved, resolved)) || SKILL_MS,
    );
    // 鎖招至少涵蓋完整動畫；SKILL_MAX_MS 僅防異常超長
    const lockMs = scaleDelayMs(Math.min(SKILL_MAX_MS, bodyMs + 80));
    el.dataset.hitUntil = '0';
    img.dataset.frameAcc = '0';
    img.dataset.bodyDone = '0';
    if (/^skill/i.test(resolved)) {
      el.dataset.skillUntil = String(Date.now() + lockMs);
      el.dataset.attackUntil = '0';
      el.dataset.attackAction = '';
      img.dataset.kindAction = resolved;
      bind(img, iconId, resolved, 0);
    } else {
      el.dataset.attackUntil = String(Date.now() + lockMs);
      el.dataset.attackAction = resolved;
      el.dataset.skillUntil = '0';
      img.dataset.kindAction = resolved;
      bind(img, iconId, resolved, 0);
    }
    return true;
  }

  function beginActorDie(el, iconId) {
    if (!el) return false;
    if (!el.classList.contains('is-dying')) {
      el.classList.add('is-dying');
      clearActorCastFlags(el);
      el.dataset.dieDone = '0';
      delete el.dataset.introLock;
      const img = actorBodyImg(el);
      const id = pad(iconId || img?.dataset.iconId || '');
      if (img) {
        img.dataset.frameAcc = '0';
        img.dataset.bodyDone = '0';
        img.dataset.kindAction = 'die';
      }
      bindActorSprite(el, id, 'die');
    }
    return true;
  }

  /** Single-actor advance (chapter advanceAllSprites body) */
  function advanceActor(el, dt) {
    if (!el) return;
    const img = actorBodyImg(el);
    if (!img) return;
    const kind = spriteKind(el);
    if (img.dataset.kindAction !== kind) {
      img.dataset.kindAction = kind;
      bind(img, img.dataset.iconId, actionForKind(kind), 0);
      img.dataset.frameAcc = '0';
      return;
    }

    const fxTick = tickEffect(img, kind, dt);
    let acc = (Number(img.dataset.frameAcc) || 0) + (Number(dt) || 0) * 1000;
    let result = { wrapped: false };
    // 戰鬥 tick 100ms、幀 delay 60ms 時，若每 tick 只進 1 幀，鎖招會先到期 → 約第 16 幀被截斷
    for (let guard = 0; guard < 32; guard += 1) {
      const action = img.dataset.action || actionForKind(kind);
      const frame = Number(img.dataset.frame) || 0;
      const step = frameDelay(img.dataset.iconId, action, frame, kind);
      if (acc < step) {
        img.dataset.frameAcc = String(acc);
        if ((/^attack/i.test(kind) || /^skill/i.test(kind)) && img.dataset.bodyDone === '1' && fxTick.wrapped) {
          result = { wrapped: true };
        }
        break;
      }
      acc -= step;
      img.dataset.frameAcc = String(acc);
      result = advance(img, kind);
      if (result.wrapped) break;
      if (img.dataset.kindAction !== kind) break;
    }

    if (kind === 'hit' && result.wrapped) el.dataset.hitUntil = '0';
    if (/^attack/i.test(kind) && result.wrapped) {
      el.dataset.attackUntil = '0';
      el.dataset.attackAction = '';
    }
    if (/^skill/i.test(kind) && result.wrapped) {
      const channelUntil = Number(el.dataset.channelUntil) || 0;
      if (!(channelUntil > Date.now())) {
        el.dataset.skillUntil = '0';
        endActorChannel(el);
      }
    }
    if (kind === 'die' && result.wrapped) el.dataset.dieDone = '1';
  }

  function advanceActorsIn(root, dt) {
    if (!root) return;
    root.querySelectorAll('.idle-actor--mob').forEach((el) => {
      if (el.classList.contains('is-hidden-slot')) return;
      advanceActor(el, dt);
    });
  }

  return {
    VER,
    FRAME_MS,
    DIE_MIN_MS,
    DIE_MAX_MS,
    HIT_MS,
    SKILL_MS,
    SKILL_MAX_MS,
    MOVE_MS,
    pad,
    actionForKind,
    resolveAction,
    hasAction,
    effectActionFor,
    hitActionFor,
    areaWarningActionFor,
    hasAreaWarningAttack,
    areaWarningDamageDelayMs,
    attackAfterMs,
    effectAfterMs,
    mobDamageDelayMs,
    frameUrl,
    previewUrl,
    fallbackUrl: previewUrl,
    frameDelay,
    bind,
    advance,
    tickEffect,
    isEffectDone,
    playPlayerHit,
    playAreaWarning,
    tickAreaWarning,
    clearAreaWarning,
    isAreaWarningActive,
    effect0ActionKeys,
    actionFrameList,
    playEffect0Row,
    tickPlayerHit,
    clearPlayerHit,
    getRange,
    actionDurationMs,
    preloadAction,
    collectFrameUrls,
    preloadMob,
    isSticker,
    actorBodyImg,
    spriteKind,
    isActorCasting,
    clearActorCastFlags,
    startActorChannel,
    endActorChannel,
    bindActorSprite,
    flashActorAttack,
    beginActorDie,
    advanceActor,
    advanceActorsIn,
    applyOrigin,
    getMobEntry,
  };
})();

if (typeof window !== 'undefined') window.IdleMobAnim = IdleMobAnim;
