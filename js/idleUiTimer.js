/**
 * MapleStory UI.Timer 倒數（剩餘時間）
 * 素材：images/UItimer（原始尺寸）
 * 用法：const t = IdleUiTimer.create({ host }); t.reset(1800); t.start(); t.tick(dt);
 * 之後副本／章節 BOSS 限時可共用同一套。
 */
const IdleUiTimer = (() => {
  const ASSET_DIR = 'images/UItimer';
  const BG_W = 216;
  const BG_H = 56;
  /** 數字畫布原點（WZ 座標）→ CSS top = y - naturalHeight；整體再往左 14px */
  const DIGIT_POS = {
    m10: { x: 87, y: 41 },
    m1: { x: 107, y: 41 },
    s10: { x: 154, y: 41 },
    s1: { x: 174, y: 41 },
  };
  const SLOTS = ['m10', 'm1', 's10', 's1'];

  let seq = 0;

  function clampSec(sec) {
    const n = Math.floor(Number(sec) || 0);
    return n > 0 ? n : 0;
  }

  function placeDigit(img, slot, digit) {
    if (!img) return;
    const pos = DIGIT_POS[slot];
    if (!pos) return;
    const d = Math.max(0, Math.min(9, Math.floor(Number(digit) || 0)));
    const src = `${ASSET_DIR}/timerNum.${d}.png`;
    if (img.dataset.digit !== String(d) || !img.getAttribute('src')) {
      img.src = src;
      img.dataset.digit = String(d);
    }
    const applyPos = () => {
      const h = img.naturalHeight || 30;
      img.style.left = `${pos.x}px`;
      img.style.top = `${pos.y - h}px`;
    };
    if (img.complete && img.naturalHeight) applyPos();
    else img.onload = applyPos;
  }

  function renderDigits(root, leftSec) {
    if (!root) return;
    const total = Math.max(0, Math.floor(Number(leftSec) || 0));
    const mins = Math.min(99, Math.floor(total / 60));
    const secs = total % 60;
    placeDigit(root.querySelector('[data-uitimer-slot="m10"]'), 'm10', Math.floor(mins / 10));
    placeDigit(root.querySelector('[data-uitimer-slot="m1"]'), 'm1', mins % 10);
    placeDigit(root.querySelector('[data-uitimer-slot="s10"]'), 's10', Math.floor(secs / 10));
    placeDigit(root.querySelector('[data-uitimer-slot="s1"]'), 's1', secs % 10);
    root.setAttribute('aria-valuetext', `${mins} 分 ${secs} 秒`);
  }

  function buildRoot(opts) {
    const id = String(opts?.id || `idleUiTimer_${++seq}`);
    const extra = String(opts?.className || '').trim();
    const root = document.createElement('div');
    root.id = id;
    root.className = `idle-ui-timer${extra ? ` ${extra}` : ''}`;
    root.setAttribute('aria-label', opts?.label || '剩餘時間');
    root.hidden = true;
    root.innerHTML = `
      <img class="idle-ui-timer__bg" src="${ASSET_DIR}/backgrnd.png" alt="" draggable="false" width="${BG_W}" height="${BG_H}">
      ${SLOTS.map((slot) => `<img class="idle-ui-timer__digit" data-uitimer-slot="${slot}" alt="" draggable="false">`).join('')}
    `;
    return root;
  }

  /**
   * @param {object} [opts]
   * @param {string|HTMLElement} [opts.host] 掛載容器
   * @param {string} [opts.id]
   * @param {string} [opts.className] 額外 class
   * @param {string} [opts.label]
   * @param {() => void} [opts.onExpire]
   */
  function create(opts = {}) {
    let root = null;
    let leftMs = 0;
    let leftSec = 0;
    let running = false;
    let expired = false;
    let onExpire = typeof opts.onExpire === 'function' ? opts.onExpire : null;

    function resolveHost(host) {
      if (!host) return null;
      if (typeof host === 'string') return document.getElementById(host);
      return host.nodeType === 1 ? host : null;
    }

    function ensure(host) {
      const parent = resolveHost(host ?? opts.host);
      if (root && root.isConnected) {
        if (parent && root.parentElement !== parent) parent.appendChild(root);
        return root;
      }
      root = buildRoot(opts);
      if (parent) parent.appendChild(root);
      renderDigits(root, leftSec);
      return root;
    }

    function sync() {
      if (!root) return;
      renderDigits(root, leftSec);
    }

    function setVisible(show) {
      ensure();
      if (!root) return;
      root.hidden = !show;
      if (show) sync();
    }

    function reset(sec) {
      const s = clampSec(sec);
      leftSec = s;
      leftMs = s * 1000;
      expired = false;
      ensure();
      sync();
      return leftSec;
    }

    function start() {
      if (expired || leftMs <= 0) return false;
      running = true;
      return true;
    }

    function pause() {
      running = false;
    }

    function resume() {
      if (expired || leftMs <= 0) return false;
      running = true;
      return true;
    }

    function stop() {
      running = false;
    }

    /**
     * @param {number} dtSec
     * @returns {boolean} 本幀是否剛歸零
     */
    function tick(dtSec) {
      if (!running || expired) return false;
      if (!(leftMs > 0)) return false;
      leftMs = Math.max(0, leftMs - Math.max(0, Number(dtSec) || 0) * 1000);
      const nextSec = Math.ceil(leftMs / 1000);
      if (nextSec !== leftSec) {
        leftSec = nextSec;
        sync();
      }
      if (leftMs <= 0) {
        leftSec = 0;
        expired = true;
        running = false;
        sync();
        onExpire?.();
        return true;
      }
      return false;
    }

    function destroy() {
      running = false;
      onExpire = null;
      root?.remove();
      root = null;
    }

    ensure(opts.host);

    return {
      ensure,
      mount: ensure,
      reset,
      start,
      pause,
      resume,
      stop,
      tick,
      sync,
      setVisible,
      destroy,
      setOnExpire(fn) {
        onExpire = typeof fn === 'function' ? fn : null;
      },
      getRoot: () => root,
      getLeftSec: () => leftSec,
      getLeftMs: () => leftMs,
      isRunning: () => running,
      isExpired: () => expired,
    };
  }

  return {
    ASSET_DIR,
    BG_W,
    BG_H,
    DIGIT_POS,
    create,
  };
})();

if (typeof window !== 'undefined') {
  window.IdleUiTimer = IdleUiTimer;
}
