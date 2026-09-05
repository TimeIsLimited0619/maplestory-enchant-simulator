/**
 * AP 分配側欄：對齊 vector:apDistributionLT (461, 38)
 */
const UiApDistribution = (() => {
  let inited = false;
  let open = false;

  function $(id) {
    return document.getElementById(id);
  }

  function ensureDom(host) {
    if ($('uciApRoot')) {
      $('uciApRoot')?.querySelector('.uci-ap-level')?.remove();
      return;
    }
    const root = document.createElement('div');
    root.id = 'uciApRoot';
    root.className = 'uci-ap is-hidden';
    root.setAttribute('aria-label', 'ABILITY POINT');
    root.innerHTML = `
      <div class="uci-ap-points" id="uciApPoints">0</div>
      <button type="button" class="uci-ap-auto" id="uciApAuto" aria-label="自動配點"></button>
      <button type="button" class="uci-ap-instant" id="uciApInstant" aria-pressed="false" title="升級時立即分配"></button>
    `;
    (host || document.body).appendChild(root);
  }

  function refresh() {
    if (!inited) return;
    const remain = CharacterProgression.remainAp();
    const pts = $('uciApPoints');
    if (pts) pts.textContent = String(remain);
    const auto = $('uciApAuto');
    if (auto) {
      auto.disabled = remain <= 0;
      auto.classList.toggle('is-disabled', remain <= 0);
    }
    const instant = $('uciApInstant');
    if (instant) {
      const on = !!CharacterProgression.getState().apInstant;
      instant.classList.toggle('is-on', on);
      instant.setAttribute('aria-pressed', on ? 'true' : 'false');
    }
    document.querySelectorAll('.uci-lvup-live').forEach((btn) => {
      btn.disabled = remain <= 0;
      btn.classList.toggle('is-disabled', remain <= 0);
    });
  }

  function setOpen(next) {
    open = !!next;
    $('uciApRoot')?.classList.toggle('is-hidden', !open);
    $('uciApBtn')?.classList.toggle('is-active', open);
    if (open) refresh();
  }

  function bind() {
    $('uciApAuto')?.addEventListener('click', (e) => {
      e.preventDefault();
      CharacterProgression.autoAssignAp();
    });
    $('uciApInstant')?.addEventListener('click', (e) => {
      e.preventDefault();
      CharacterProgression.setApInstant(!CharacterProgression.getState().apInstant);
    });
  }

  function init(host) {
    if (inited) return;
    ensureDom(host);
    inited = true;
    bind();
    refresh();
    setOpen(false);
  }

  return { init, refresh, setOpen, toggle() { setOpen(!open); }, isOpen: () => open };
})();

if (typeof window !== 'undefined') window.UiApDistribution = UiApDistribution;
