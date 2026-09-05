/**
 * 玩家死亡流程共用：自動復活條件、倒數控制器。
 * 視覺 FX 仍由 IdlePlayerDeathFx 負責。
 */
const IdlePlayerDeathFlow = (() => {
  const AUTO_REVIVE_SEC = 5;

  /**
   * 託管（off）／掛機（farm）才自動復活；自動推圖（push）僅手動按復活。
   * @param {{ dungeon?: boolean, afkMode?: string }} ctx
   */
  function shouldAutoRevive(ctx = {}) {
    if (ctx.dungeon) return false;
    const mode = ctx.afkMode || 'off';
    return mode === 'off' || mode === 'farm';
  }

  /**
   * 以時間戳倒數，避免 setInterval 漂移。
   * @param {{
   *   seconds?: number,
   *   onTick?: (leftSec: number) => void,
   *   onDone?: () => void,
   *   shouldContinue?: () => boolean,
   * }} opts
   */
  function createAutoReviveCountdown(opts = {}) {
    const seconds = Math.max(1, Math.floor(Number(opts.seconds) || AUTO_REVIVE_SEC));
    let timerId = null;
    let deadline = 0;
    let stopped = false;

    function leftSec() {
      if (!deadline) return 0;
      return Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
    }

    function clear() {
      if (timerId != null) {
        window.clearInterval(timerId);
        timerId = null;
      }
      deadline = 0;
    }

    function stop() {
      stopped = true;
      clear();
    }

    function tick() {
      if (stopped) return;
      if (typeof opts.shouldContinue === 'function' && !opts.shouldContinue()) {
        stop();
        return;
      }
      const left = leftSec();
      if (left <= 0) {
        clear();
        try {
          opts.onDone?.();
        } catch (_) { /* ignore */ }
        return;
      }
      try {
        opts.onTick?.(left);
      } catch (_) { /* ignore */ }
    }

    function start() {
      stop();
      stopped = false;
      deadline = Date.now() + seconds * 1000;
      opts.onTick?.(seconds);
      timerId = window.setInterval(tick, 250);
    }

    return {
      start,
      stop,
      clear,
      leftSec,
      isActive: () => timerId != null,
    };
  }

  return {
    AUTO_REVIVE_SEC,
    shouldAutoRevive,
    createAutoReviveCountdown,
  };
})();

if (typeof window !== 'undefined') {
  window.IdlePlayerDeathFlow = IdlePlayerDeathFlow;
}
