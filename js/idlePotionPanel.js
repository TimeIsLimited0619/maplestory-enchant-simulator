/**
 * 放置模式：自動喝藥快捷欄（左下角）
 * UI：images/UIpotion（原始尺寸）
 * 從背包消耗欄拖曳藥水至格子；HP 低於設定 % 時每 300ms 自動使用直到達標。
 */
const IdlePotionPanel = (() => {
  const STORAGE_KEY = 'idle.potionQuick.v2';
  const AUTO_DRINK_INTERVAL_MS = 300;
  const ASSET = 'images/UIpotion';
  const UI_VER = '4';
  const BG = {
    compact: { w: 50, h: 52, file: 'potion_backgrnd.png' },
    full: { w: 100, h: 52, file: 'potion_fullbackgrnd.png' },
  };
  /** full 模式座標（相對 fullbackgrnd） */
  const LAYOUT = {
    slot: { x: 4, y: 5, w: 42, h: 42 },
    pctBox: { x: 49, y: 0, w: 28, h: 20 },
    down: { x: 53, y: 27 },
    up: { x: 74, y: 27 },
    toggleY: 17,
  };

  const state = {
    itemId: '',
    thresholdPct: 50,
    expanded: true,
  };

  let inited = false;
  let tooltipToken = 0;
  let drinkTimerId = null;
  let fieldHostId = 'idleHuntField';

  function $(id) {
    return document.getElementById(id);
  }

  function clampThreshold(n) {
    const v = Math.floor(Number(n) || 0);
    return Math.min(99, Math.max(1, v));
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
        || localStorage.getItem('idle.potionQuick.v1');
      if (!raw) return;
      const data = JSON.parse(raw);
      if (data.itemId != null) state.itemId = String(data.itemId || '');
      const pct = Number(data.thresholdPct);
      if (Number.isFinite(pct)) state.thresholdPct = clampThreshold(pct);
      if (typeof data.expanded === 'boolean') state.expanded = data.expanded;
    } catch (_) { /* ignore */ }
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        itemId: state.itemId,
        thresholdPct: state.thresholdPct,
        expanded: !!state.expanded,
      }));
    } catch (_) { /* ignore */ }
  }

  function isIdleVisible() {
    return typeof AppMode !== 'undefined' && AppMode.isIdle?.();
  }

  function fieldHost() {
    return $(fieldHostId) || $('idleHuntField');
  }

  function setFieldHost(id) {
    fieldHostId = String(id || 'idleHuntField').trim() || 'idleHuntField';
    mountToField();
    syncVisible();
  }

  function mountToField() {
    const panel = $('idlePotionPanel');
    const field = fieldHost();
    if (!panel || !field) return false;
    if (panel.parentElement !== field) field.appendChild(panel);
    return true;
  }

  function syncVisible() {
    mountToField();
    const visible = isIdleVisible() && !!fieldHost();
    $('idlePotionPanel')?.classList.toggle('is-hidden', !visible);
  }

  function btnUrl(kind, phase) {
    const folder = kind === 'up' ? 'UP' : 'Down';
    return `${ASSET}/button/${folder}/${phase}/0.png`;
  }

  function ensureTooltip() {
    if ($('idlePotionTooltip')) return;
    const tip = document.createElement('div');
    tip.id = 'idlePotionTooltip';
    tip.className = 'eq-tooltip hidden';
    tip.setAttribute('aria-hidden', 'true');
    document.body.appendChild(tip);
  }

  function placeTooltip(anchorEl) {
    const tip = $('idlePotionTooltip');
    if (!tip || !anchorEl?.isConnected) return;
    const rect = anchorEl.getBoundingClientRect();
    const tipW = tip.offsetWidth || 261;
    const tipH = tip.offsetHeight || 120;
    let left = rect.right + 8;
    let top = rect.top;
    if (left + tipW > window.innerWidth - 8) left = Math.max(8, rect.left - tipW - 8);
    if (top + tipH > window.innerHeight - 8) top = Math.max(8, window.innerHeight - tipH - 8);
    if (top < 8) top = 8;
    tip.style.left = `${left}px`;
    tip.style.top = `${top}px`;
  }

  function hideTooltip() {
    if (typeof HoverTooltipGuard !== 'undefined') HoverTooltipGuard.unwatch('idle-potion');
    tooltipToken += 1;
    const tip = $('idlePotionTooltip');
    if (!tip) return;
    tip.classList.add('hidden');
    tip.setAttribute('aria-hidden', 'true');
  }

  function showTooltip(anchorEl, potion) {
    if (!potion || !anchorEl) return;
    ensureTooltip();
    const tip = $('idlePotionTooltip');
    if (!tip) return;
    tooltipToken += 1;
    const token = tooltipToken;
    if (typeof HoverTooltipGuard !== 'undefined') {
      HoverTooltipGuard.watch('idle-potion', anchorEl, { hide: hideTooltip });
    }
    tip.innerHTML = IdlePotionStore.buildTooltipHtml(potion);
    tip.classList.remove('hidden');
    tip.setAttribute('aria-hidden', 'false');
    placeTooltip(anchorEl);
    const iconEl = tip.querySelector('.eq-tip-icon');
    if (iconEl) {
      const applyScale = () => {
        if (token !== tooltipToken) return;
        if (!iconEl.naturalWidth) return;
        iconEl.style.width = `${Math.round(iconEl.naturalWidth * 2)}px`;
        iconEl.style.height = `${Math.round(iconEl.naturalHeight * 2)}px`;
        placeTooltip(anchorEl);
      };
      if (iconEl.complete) applyScale();
      else iconEl.addEventListener('load', applyScale, { once: true });
    }
    requestAnimationFrame(() => {
      if (token !== tooltipToken) return;
      placeTooltip(anchorEl);
    });
  }

  function bagCount(itemId) {
    if (typeof getPlayerPotionCount === 'function') {
      return getPlayerPotionCount(itemId);
    }
    return 0;
  }

  function syncShell() {
    const panel = $('idlePotionPanel');
    const shell = $('idlePotionShell');
    const toggle = $('idlePotionToggle');
    if (!panel || !shell) return;
    const mode = state.expanded ? 'full' : 'compact';
    const bg = BG[mode];
    panel.classList.toggle('is-expanded', state.expanded);
    panel.classList.toggle('is-compact', !state.expanded);
    shell.style.width = `${bg.w}px`;
    shell.style.height = `${bg.h}px`;
    shell.style.backgroundImage = `url("${ASSET}/${bg.file}")`;
    if (toggle) {
      toggle.src = state.expanded ? `${ASSET}/button/close.png` : `${ASSET}/button/Open.png`;
      toggle.alt = state.expanded ? '收合' : '展開';
      toggle.title = state.expanded ? '收合設定' : '展開設定';
      toggle.style.left = `${bg.w}px`;
      toggle.style.top = `${LAYOUT.toggleY}px`;
    }
    const controls = $('idlePotionControls');
    if (controls) controls.hidden = !state.expanded;
  }

  function setStepPhase(el, kind, phase) {
    if (!el) return;
    if (el.classList.contains('is-disabled') && phase !== 'disabled') {
      el.src = btnUrl(kind, 'disabled');
      return;
    }
    el.src = btnUrl(kind, phase);
  }

  function syncThresholdUi() {
    const pct = state.thresholdPct;
    const input = $('idlePotionThreshold');
    if (input && document.activeElement !== input) input.value = String(pct);

    const down = $('idlePotionDown');
    const up = $('idlePotionUp');
    if (down) {
      const dis = pct <= 1;
      down.classList.toggle('is-disabled', dis);
      down.setAttribute('aria-disabled', dis ? 'true' : 'false');
      if (!down.matches(':hover') && !down.matches(':active')) {
        setStepPhase(down, 'down', dis ? 'disabled' : 'normal');
      } else if (dis) {
        setStepPhase(down, 'down', 'disabled');
      }
    }
    if (up) {
      const dis = pct >= 99;
      up.classList.toggle('is-disabled', dis);
      up.setAttribute('aria-disabled', dis ? 'true' : 'false');
      if (!up.matches(':hover') && !up.matches(':active')) {
        setStepPhase(up, 'up', dis ? 'disabled' : 'normal');
      } else if (dis) {
        setStepPhase(up, 'up', 'disabled');
      }
    }
  }

  function setThreshold(next) {
    state.thresholdPct = clampThreshold(next);
    save();
    syncThresholdUi();
  }

  function nudgeThreshold(delta) {
    setThreshold(state.thresholdPct + delta);
  }

  function renderQuickSlot() {
    const slot = $('idlePotionQuickSlot');
    if (!slot) return;
    slot.replaceChildren();
    slot.classList.remove('inv-drag-over');

    const itemId = String(state.itemId || '').trim();
    const potion = itemId && typeof IdlePotionStore !== 'undefined'
      ? IdlePotionStore.get(itemId)
      : null;

    if (!potion) return;

    const frame = document.createElement('div');
    frame.className = 'inv-item-frame inv-consume-frame idle-potion-icon-frame';

    const img = document.createElement('img');
    img.src = IdlePotionStore.resolveIcon(potion.icon);
    img.alt = potion.name;
    img.draggable = false;
    img.onerror = () => { img.style.visibility = 'hidden'; };
    img.addEventListener('mouseenter', () => showTooltip(img, potion));
    img.addEventListener('mouseleave', hideTooltip);
    frame.appendChild(img);

    const count = bagCount(itemId);
    if (count > 1) {
      const qty = document.createElement('span');
      qty.className = 'inv-item-count';
      qty.textContent = String(count);
      frame.appendChild(qty);
    }

    slot.appendChild(frame);
  }

  function setQuickPotion(itemId) {
    const id = String(itemId || '').trim();
    if (!id || !IdlePotionStore.isPotionId(id)) return false;
    state.itemId = id;
    save();
    renderQuickSlot();
    return true;
  }

  function clearQuickPotion() {
    state.itemId = '';
    save();
    renderQuickSlot();
  }

  function parseDragPayload(e) {
    try {
      const raw = e.dataTransfer?.getData('text/plain');
      if (raw) return JSON.parse(raw);
    } catch (_) { /* ignore */ }
    if (typeof InventoryModule !== 'undefined' && InventoryModule._activeDragPayload) {
      return InventoryModule._activeDragPayload;
    }
    return null;
  }

  function itemIdFromDrag(parsed) {
    if (!parsed || parsed.tab !== 'consume') return '';
    const directId = String(parsed.itemId || '').trim();
    if (directId && IdlePotionStore.isPotionId(directId)) return directId;
    if (parsed.consumeType === 'potion' && directId) return directId;
    const idx = Number(parsed.slotIndex);
    if (!Number.isInteger(idx) || idx < 0) return '';
    if (typeof playerInventoryConsume === 'undefined') return '';
    const entry = playerInventoryConsume[idx];
    if (!entry) return '';
    const T = typeof CONSUME_ITEM_TYPE !== 'undefined' ? CONSUME_ITEM_TYPE.POTION : 'potion';
    if (entry.type !== T && entry.type !== 'potion') return '';
    return String(entry.itemId || '');
  }

  function isPotionDrag(e) {
    const parsed = parseDragPayload(e);
    if (parsed) {
      const itemId = itemIdFromDrag(parsed);
      return !!(itemId && IdlePotionStore.isPotionId(itemId));
    }
    const active = typeof InventoryModule !== 'undefined' ? InventoryModule._activeDragPayload : null;
    if (active?.tab === 'consume') {
      const itemId = itemIdFromDrag(active);
      return !!(itemId && IdlePotionStore.isPotionId(itemId));
    }
    return e.type === 'dragover' && e.dataTransfer?.types?.includes('text/plain');
  }

  function bindStepBtn(el, kind) {
    if (!el || el.dataset.stateBound === '1') return;
    el.dataset.stateBound = '1';
    el.addEventListener('mouseenter', () => setStepPhase(el, kind, 'mouseOver'));
    el.addEventListener('mouseleave', () => setStepPhase(el, kind, 'normal'));
    el.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;
      setStepPhase(el, kind, 'pressed');
    });
    el.addEventListener('mouseup', () => {
      setStepPhase(el, kind, el.matches(':hover') ? 'mouseOver' : 'normal');
    });
    el.addEventListener('click', (e) => {
      e.preventDefault();
      if (el.classList.contains('is-disabled')) return;
      nudgeThreshold(kind === 'up' ? 1 : -1);
    });
    el.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      e.preventDefault();
      if (el.classList.contains('is-disabled')) return;
      nudgeThreshold(kind === 'up' ? 1 : -1);
    });
  }

  function bindQuickSlot() {
    const slot = $('idlePotionQuickSlot');
    if (!slot || slot.dataset.bound === '1') return;
    slot.dataset.bound = '1';

    slot.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (!isPotionDrag(e)) {
        e.dataTransfer.dropEffect = 'none';
        slot.classList.remove('inv-drag-over');
        return;
      }
      e.dataTransfer.dropEffect = 'copy';
      slot.classList.add('inv-drag-over');
    });

    slot.addEventListener('dragleave', (e) => {
      if (e.currentTarget.contains(e.relatedTarget)) return;
      slot.classList.remove('inv-drag-over');
    });

    slot.addEventListener('drop', (e) => {
      e.preventDefault();
      e.stopPropagation();
      slot.classList.remove('inv-drag-over');
      const parsed = parseDragPayload(e);
      const itemId = itemIdFromDrag(parsed);
      if (itemId && IdlePotionStore.isPotionId(itemId)) {
        setQuickPotion(itemId);
      }
    });

    slot.addEventListener('click', () => {
      if (state.itemId) clearQuickPotion();
    });
    slot.title = '拖曳藥水至此；點擊清除';
  }

  function bindControls() {
    const panel = $('idlePotionPanel');
    if (!panel || panel.dataset.ctrlBound === '1') return;
    panel.dataset.ctrlBound = '1';

    bindStepBtn($('idlePotionDown'), 'down');
    bindStepBtn($('idlePotionUp'), 'up');

    const toggle = $('idlePotionToggle');
    toggle?.addEventListener('click', (e) => {
      e.preventDefault();
      state.expanded = !state.expanded;
      save();
      syncShell();
      syncThresholdUi();
    });

    const input = $('idlePotionThreshold');
    if (input && input.dataset.bound !== '1') {
      input.dataset.bound = '1';
      input.addEventListener('change', () => setThreshold(input.value));
      input.addEventListener('blur', () => setThreshold(input.value));
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          setThreshold(input.value);
          input.blur();
        }
      });
    }
  }

  function ensureDom() {
    const existing = $('idlePotionPanel');
    if (existing && existing.dataset.uiVer === UI_VER) {
      mountToField();
      return;
    }
    existing?.remove();

    const panel = document.createElement('div');
    panel.id = 'idlePotionPanel';
    panel.className = 'idle-potion-panel is-hidden';
    panel.dataset.uiVer = UI_VER;
    panel.innerHTML = `
      <div id="idlePotionShell" class="idle-potion-shell" aria-label="藥水快捷欄">
        <div id="idlePotionQuickSlot" class="idle-potion-quick-slot" style="left:${LAYOUT.slot.x}px;top:${LAYOUT.slot.y}px;width:${LAYOUT.slot.w}px;height:${LAYOUT.slot.h}px" aria-label="藥水槽"></div>
        <div id="idlePotionControls" class="idle-potion-controls">
          <div class="idle-potion-pct" style="left:${LAYOUT.pctBox.x}px;top:${LAYOUT.pctBox.y}px;width:${LAYOUT.pctBox.w}px;height:${LAYOUT.pctBox.h}px">
            <input type="number" id="idlePotionThreshold" class="idle-potion-pct__input" min="1" max="99" step="1" value="50" aria-label="自動喝藥 HP 百分比">
          </div>
          <img id="idlePotionDown" class="idle-potion-step" src="${btnUrl('down', 'normal')}" alt="降低" draggable="false" width="21" height="23" role="button" tabindex="0" style="left:${LAYOUT.down.x}px;top:${LAYOUT.down.y}px">
          <img id="idlePotionUp" class="idle-potion-step" src="${btnUrl('up', 'normal')}" alt="提高" draggable="false" width="21" height="23" role="button" tabindex="0" style="left:${LAYOUT.up.x}px;top:${LAYOUT.up.y}px">
        </div>
        <img id="idlePotionToggle" class="idle-potion-toggle" src="${ASSET}/button/Open.png" alt="展開" draggable="false" width="5" height="17" role="button" tabindex="0">
      </div>
    `;
    const field = fieldHost();
    (field || document.body).appendChild(panel);
    if (field) mountToField();
  }

  function clearDrinkTimer() {
    if (drinkTimerId != null) {
      clearTimeout(drinkTimerId);
      drinkTimerId = null;
    }
  }

  function getPlayerHpPct() {
    if (typeof IdleHunt === 'undefined') return 100;
    const { hp, maxHp } = IdleHunt.getPlayerHp?.() || {};
    const max = Math.max(1, Math.floor(Number(maxHp) || 0));
    const cur = Math.max(0, Math.floor(Number(hp) || 0));
    if (cur <= 0) return 0;
    return (cur / max) * 100;
  }

  function shouldAutoDrink() {
    const itemId = String(state.itemId || '').trim();
    if (!itemId || typeof IdleHunt === 'undefined') return false;
    if (IdleHunt.isPlayerDead?.()) return false;
    if (getPlayerHpPct() >= state.thresholdPct) return false;
    if (bagCount(itemId) <= 0) {
      renderQuickSlot();
      return false;
    }
    return true;
  }

  function drinkOne() {
    const itemId = String(state.itemId || '').trim();
    if (!itemId) return false;
    const potion = IdlePotionStore.get(itemId);
    if (!potion) return false;
    if (typeof takePotion !== 'function' || !takePotion(itemId, 1)) {
      renderQuickSlot();
      return false;
    }
    if (typeof IdleHunt === 'undefined') return false;
    const maxHp = Number(IdleHunt.getPlayerHp?.().maxHp)
      || (typeof IdleHunt.getPlayerHp === 'function' ? IdleHunt.getPlayerHp().maxHp : 0);
    const heal = IdlePotionStore.calcHealAmount(potion, maxHp);
    if (!(heal > 0)) return false;
    IdleHunt.healPlayer?.(heal);
    renderQuickSlot();
    if (typeof InventoryModule !== 'undefined' && InventoryModule.tab === 'consume') {
      InventoryModule.render?.();
    }
    return true;
  }

  function runAutoDrinkStep() {
    drinkTimerId = null;
    if (!shouldAutoDrink()) return;
    drinkOne();
    if (shouldAutoDrink()) {
      const intervalMs = (typeof IdleHunt !== 'undefined' && typeof IdleHunt.scaleDelayMs === 'function')
        ? IdleHunt.scaleDelayMs(AUTO_DRINK_INTERVAL_MS)
        : AUTO_DRINK_INTERVAL_MS;
      drinkTimerId = setTimeout(runAutoDrinkStep, intervalMs);
    }
  }

  function tryAutoDrink() {
    if (!shouldAutoDrink()) {
      clearDrinkTimer();
      return false;
    }
    if (drinkTimerId != null) return true;
    runAutoDrinkStep();
    return true;
  }

  function stopAutoDrink() {
    clearDrinkTimer();
  }

  function onGameSpeedChanged() {
    if (drinkTimerId == null) return;
    clearDrinkTimer();
    tryAutoDrink();
  }

  function resetDefault() {
    clearDrinkTimer();
    state.itemId = '';
    state.thresholdPct = 50;
    state.expanded = true;
    save();
    syncShell();
    syncThresholdUi();
    renderQuickSlot();
  }

  function init() {
    if (inited) return;
    inited = true;
    load();
    ensureDom();
    bindQuickSlot();
    bindControls();
    syncShell();
    syncThresholdUi();
    renderQuickSlot();
    syncVisible();
  }

  function refresh() {
    if (!inited) init();
    // 舊版 DOM 無 uiVer 時重建
    if ($('idlePotionPanel')?.dataset.uiVer !== UI_VER) {
      inited = false;
      init();
      return;
    }
    mountToField();
    syncShell();
    syncThresholdUi();
    renderQuickSlot();
    syncVisible();
  }

  return {
    init,
    refresh,
    syncVisible,
    setFieldHost,
    setQuickPotion,
    clearQuickPotion,
    tryAutoDrink,
    stopAutoDrink,
    onGameSpeedChanged,
    drinkOne,
    resetDefault,
    getState: () => ({ ...state }),
  };
})();

if (typeof window !== 'undefined') {
  window.IdlePotionPanel = IdlePotionPanel;
  window.addEventListener('DOMContentLoaded', () => IdlePotionPanel.init());
}
