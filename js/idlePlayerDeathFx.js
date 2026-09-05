/**
 * 玩家死亡演示：遊戲畫面凍結後，死亡圖疊上去淡入 1 秒 → 再顯示 2 秒後 resolve。
 * 預設持續顯示直到 cancel()（復活／關場才收起）。
 * boss：bossidlezone_death_*；野外／副本：idlezone_death_*（隨機 cao / death / noob）。
 */
const IdlePlayerDeathFx = (() => {
  const DIR = 'images/playerdeath';
  const VARIANTS = ['cao', 'death', 'noob'];
  const FADE_MS = 1000;
  const HOLD_MS = 2000;
  const ROOT_ID = 'idlePlayerDeathFx';

  let playing = false;
  let lingering = false;
  /** @type {Promise<boolean>|null} */
  let activePromise = null;
  let seq = 0;

  function $(id) {
    return document.getElementById(id);
  }

  function pickSrc(kind) {
    const prefix = kind === 'boss' ? 'bossidlezone_death' : 'idlezone_death';
    const v = VARIANTS[Math.floor(Math.random() * VARIANTS.length)] || 'death';
    return `${DIR}/${prefix}_${v}.png`;
  }

  function ensureDom(host) {
    let root = $(ROOT_ID);
    if (!root) {
      root = document.createElement('div');
      root.id = ROOT_ID;
      root.className = 'idle-player-death-fx';
      root.setAttribute('aria-hidden', 'true');
      root.innerHTML = '<img class="idle-player-death-fx__img" alt="" draggable="false">';
    }
    const parent = host && host.nodeType === 1 ? host : document.body;
    if (root.parentElement !== parent) {
      parent.appendChild(root);
    }
    return root;
  }

  function waitMs(ms) {
    return new Promise((resolve) => {
      window.setTimeout(resolve, Math.max(0, Number(ms) || 0));
    });
  }

  function hide(root) {
    if (!root) return;
    root.classList.remove('is-show', 'is-fade');
    root.setAttribute('aria-hidden', 'true');
    root.hidden = true;
    lingering = false;
    const img = root.querySelector('.idle-player-death-fx__img');
    if (img) {
      img.style.opacity = '0';
      img.style.transition = 'none';
      img.removeAttribute('src');
    }
  }

  /**
   * @param {'boss'|'field'} kind
   * @param {{ host?: HTMLElement|null, persist?: boolean }} [opts]
   * @returns {Promise<boolean>} true=淡入＋停留結束；false=被取消
   */
  function play(kind, opts = {}) {
    if (opts.force) {
      cancel();
    } else if (playing && activePromise) {
      return activePromise;
    }
    const persist = opts.persist !== false;
    const mySeq = ++seq;
    playing = true;
    lingering = false;

    activePromise = (async () => {
      const root = ensureDom(opts.host || null);
      const img = root.querySelector('.idle-player-death-fx__img');
      const src = pickSrc(kind === 'boss' ? 'boss' : 'field');
      if (img) {
        img.style.opacity = '0';
        img.style.transition = 'none';
        img.src = src;
      }
      root.hidden = false;
      root.classList.add('is-show');
      root.setAttribute('aria-hidden', 'false');
      void root.offsetWidth;
      if (img) {
        img.style.transition = `opacity ${FADE_MS}ms ease`;
        img.style.opacity = '1';
      }
      root.classList.add('is-fade');
      await waitMs(FADE_MS + HOLD_MS);
      if (mySeq !== seq) return false;
      if (persist) {
        lingering = true;
      } else {
        hide(root);
      }
      return true;
    })().catch(() => {
      hide($(ROOT_ID));
      return false;
    }).finally(() => {
      if (mySeq === seq) {
        playing = false;
        activePromise = null;
      }
    });

    return activePromise;
  }

  function cancel() {
    seq += 1;
    playing = false;
    activePromise = null;
    lingering = false;
    hide($(ROOT_ID));
  }

  return {
    play,
    cancel,
    isPlaying: () => playing,
    isVisible: () => playing || lingering,
    FADE_MS,
    HOLD_MS,
  };
})();

if (typeof window !== 'undefined') {
  window.IdlePlayerDeathFx = IdlePlayerDeathFx;
}
