/**
 * 全螢幕彈窗淡入／淡出（新彈窗請沿用）
 */
const MODAL_FADE_MS = 450;

function beginModalFadeIn(modal) {
  if (!modal) return;

  modal.classList.remove('hidden', 'is-closing');
  modal.classList.add('is-opening');
  modal.setAttribute('aria-hidden', 'false');

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      modal.classList.add('is-opening-ready');
    });
  });

  setTimeout(() => {
    modal.classList.remove('is-opening', 'is-opening-ready');
  }, MODAL_FADE_MS);
}

function beginModalFadeOut(modal, onDone) {
  if (!modal || modal.classList.contains('hidden')) {
    onDone?.();
    return;
  }
  if (modal.classList.contains('is-closing')) return;

  modal.classList.add('is-closing');

  setTimeout(() => {
    modal.classList.add('hidden');
    modal.classList.remove('is-closing', 'is-opening', 'is-opening-ready');
    modal.setAttribute('aria-hidden', 'true');
    onDone?.();
  }, MODAL_FADE_MS);
}

function clearModalFadeState(modal) {
  modal?.classList.remove('is-opening', 'is-opening-ready', 'is-closing');
}
