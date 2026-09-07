/**
 * 升級特效：BasicEff LevelUp，錨在紙娃娃腳底，可多實例同時播放。
 */
const LevelUpEffect = (() => {
  const instances = new Set();
  const preloadCache = new Map();
  let nextId = 1;
  let preloadPromise = null;

  function data() {
    return (typeof LEVEL_UP_EFFECT !== 'undefined') ? LEVEL_UP_EFFECT : null;
  }

  function frameUrls() {
    const effect = data();
    if (!effect?.frames?.length) return [];
    return effect.frames.map((f) => f?.src).filter(Boolean);
  }

  function ensurePreloaded() {
    const urls = frameUrls();
    if (!urls.length) return Promise.resolve();
    if (preloadPromise) return preloadPromise;
    if (typeof EnchantImagePreload !== 'undefined') {
      preloadPromise = EnchantImagePreload.preloadMany(urls, preloadCache).catch(() => {});
      return preloadPromise;
    }
    preloadPromise = Promise.all(urls.map((url) => new Promise((resolve) => {
      const img = new Image();
      img.decoding = 'async';
      const done = () => resolve(img);
      img.onload = () => {
        if (typeof img.decode === 'function') {
          img.decode().then(done).catch(done);
        } else {
          done();
        }
      };
      img.onerror = done;
      img.src = url;
    }))).then(() => {});
    return preloadPromise;
  }

  function resolveFeetAnchor(playerEl) {
    if (typeof Paperdoll !== 'undefined' && typeof Paperdoll.getHuntFeetAnchor === 'function') {
      return Paperdoll.getHuntFeetAnchor(playerEl);
    }
    return null;
  }

  function syncAnchor(inst) {
    if (!inst?.stage || !inst.player) return;
    const anchor = resolveFeetAnchor(inst.player);
    if (anchor && Number.isFinite(anchor.x) && Number.isFinite(anchor.y)) {
      inst.stage.style.left = `${anchor.x}px`;
      inst.stage.style.top = `${anchor.y}px`;
      inst.stage.style.transform = 'none';
      return;
    }
    inst.stage.style.left = '50%';
    inst.stage.style.top = '78%';
    inst.stage.style.transform = 'translate(-50%, -50%)';
  }

  function decodedImage(src) {
    if (!src) return null;
    if (typeof EnchantImagePreload !== 'undefined') {
      return EnchantImagePreload.getImage(src);
    }
    return null;
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
    if (!loaded) return false;
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

  function tick(inst, ts) {
    if (!instances.has(inst)) return;
    if (!inst.lastTs) inst.lastTs = ts;
    const dt = Math.max(0, ts - inst.lastTs);
    inst.lastTs = ts;
    inst.acc += dt;
    syncAnchor(inst);

    const frames = inst.frames;
    while (inst.frameIdx < frames.length) {
      const frame = frames[inst.frameIdx];
      const delay = Math.max(1, Number(frame?.delay) || 90);
      if (inst.acc < delay) break;
      inst.acc -= delay;
      const shown = applyFrame(inst);
      if (frame?.src && !shown) break;
      inst.frameIdx += 1;
      if (inst.frameIdx >= frames.length) {
        destroy(inst);
        return;
      }
    }

    inst.rafId = requestAnimationFrame((t) => tick(inst, t));
  }

  function startInstance(inst) {
    if (!instances.has(inst)) return;
    syncAnchor(inst);
    inst.rafId = requestAnimationFrame((t) => tick(inst, t));
  }

  function createInstance(playerEl) {
    const effect = data();
    if (!effect?.frames?.length || !playerEl) return null;

    const stage = document.createElement('div');
    stage.className = 'idle-levelup-stage';
    stage.dataset.levelupId = String(nextId);
    const img = document.createElement('img');
    img.className = 'idle-levelup-sprite';
    img.alt = '';
    img.draggable = false;
    img.hidden = true;
    img.decoding = 'sync';
    stage.appendChild(img);
    playerEl.appendChild(stage);

    const inst = {
      id: nextId++,
      player: playerEl,
      stage,
      img,
      frames: effect.frames,
      frameIdx: 0,
      acc: 0,
      lastTs: 0,
      rafId: null,
    };
    instances.add(inst);
    return inst;
  }

  function play(playerEl) {
    const inst = createInstance(playerEl);
    if (!inst) return null;
    ensurePreloaded().then(() => startInstance(inst));
    return inst.id;
  }

  function playOnHuntPlayer(count = 1) {
    const n = Math.max(1, Math.floor(Number(count) || 1));
    const player = document.querySelector('#idleHuntField .idle-actor--player');
    if (!player) return Promise.resolve([]);
    return ensurePreloaded().then(() => {
      const ids = [];
      for (let i = 0; i < n; i += 1) {
        const inst = createInstance(player);
        if (!inst) continue;
        startInstance(inst);
        ids.push(inst.id);
      }
      return ids;
    });
  }

  function stopAll() {
    [...instances].forEach((inst) => destroy(inst));
  }

  function warmUp() {
    ensurePreloaded();
  }

  function collectPreloadUrls() {
    return frameUrls();
  }

  // 進頁後背景預載，降低首次升級閃爍（開頁 boot 也會納入 critical 清單）
  warmUp();

  return {
    play,
    playOnHuntPlayer,
    stopAll,
    warmUp,
    collectPreloadUrls,
  };
})();

if (typeof window !== 'undefined') {
  window.LevelUpEffect = LevelUpEffect;
}
