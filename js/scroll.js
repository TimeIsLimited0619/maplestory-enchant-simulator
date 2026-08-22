/**
 * ScrollModule - 卷軸強化邏輯與 UI
 */
function trackScrollGloryCost(amount = 1) {
  trackCostUsage('scrollGlory', null, amount);
}

function ensureScrollSlotResults(item) {
  if (!item) return [];
  if (!Array.isArray(item.scrollSlotResults)) item.scrollSlotResults = [];
  return item.scrollSlotResults;
}

function recordScrollSlotResult(item, success) {
  if (!item) return;
  ensureScrollSlotResults(item).push(success ? 'success' : 'fail');
}

function isScrollSlotFail(item, index, scrollUsed) {
  if (!item || index < 0 || index >= scrollUsed) return false;
  const results = item.scrollSlotResults;
  if (Array.isArray(results) && results.length > index) {
    return results[index] === 'fail';
  }
  const failUses = item.scrollFailUses || 0;
  return failUses > 0 && index >= scrollUsed - failUses;
}

function incrementScrollUsedCountOnly(item, success = true) {
  item.scrollUsed = (item.scrollUsed || 0) + 1;
  recordScrollSlotResult(item, success);
}

function incrementScrollUsedCount(item, success = true) {
  incrementScrollUsedCountOnly(item, success);
  trackScrollGloryCost();
}

const ScrollModule = {
  itemData: null,
  selectedTab: 'trace',
  selectedScrollId: null,
  selectedRestoreScrollId: null,
  selectedTraceId: null,
  pendingResult: null,
  recoveryCardChecked: false,
  autoRunning: false,
  autoCancelled: false,
  autoCancelHandler: null,
  AUTO_ENHANCE_DELAY_MS: 4,
  AUTO_ENHANCE_BATCH_SIZE: 10,
  RECOVERY_HIGHLIGHT: {
    frameCount: 12,
    frameMs: 80,
    basePath: 'images/scroll/returnhighlight/fullScreen_returnScroll.appearHighlight'
  },
  recoveryHighlightTimer: null,
  recoveryClosing: false,
  recoveryCloseTimer: null,
  scrollTop: 0,
  draggingScrollThumb: false,
  dragStartY: 0,
  dragStartScroll: 0,

  init() {
    const tabTrace = document.getElementById('scTabTrace');
    const tabSpecial = document.getElementById('scTabSpecial');
    if (tabTrace) tabTrace.addEventListener('click', () => this.selectTab('trace'));
    if (tabSpecial) tabSpecial.addEventListener('click', () => this.selectTab('special'));

    const recoveryCheck = document.getElementById('scRecoveryCheck');
    if (recoveryCheck) {
      recoveryCheck.addEventListener('change', () => {
        this.recoveryCardChecked = recoveryCheck.checked;
        this.updateUseButtonState();
      });
    }

    const autoCheck = document.getElementById('chkScrollAutoEnhance');
    if (autoCheck) {
      autoCheck.addEventListener('change', () => {
        this.updateAutoAtkTargetOptions();
        this.updateUseButtonState();
      });
    }

    const catValleyRatesCheck = document.getElementById('chkScrollCatValleyRates');
    if (catValleyRatesCheck) {
      if (typeof isScrollCatValleyRatesEnabled === 'function') {
        catValleyRatesCheck.checked = isScrollCatValleyRatesEnabled();
      }
      catValleyRatesCheck.addEventListener('change', () => {
        if (typeof setScrollCatValleyRatesEnabled === 'function') {
          setScrollCatValleyRatesEnabled(catValleyRatesCheck.checked);
        }
        this.updateUI();
      });
    }

    const btnRecoveryCancel = document.getElementById('btnRecoveryCancel');
    const btnRecoveryApply = document.getElementById('btnRecoveryApply');
    if (btnRecoveryCancel) {
      btnRecoveryCancel.addEventListener('click', () => {
        if (ScrollModule.recoveryClosing) return;
        ScrollModule.beginRecoveryClose(false);
      });
    }
    if (btnRecoveryApply) {
      btnRecoveryApply.addEventListener('click', () => {
        if (ScrollModule.recoveryClosing) return;
        ScrollModule.beginRecoveryClose(true);
      });
    }

    this.initScrollGrid();
    this.updateUI();
  },

  scrollRowStride() {
    const size = typeof SCROLL_SLOT_SIZE === 'number' ? SCROLL_SLOT_SIZE : 38;
    const gap = typeof SCROLL_SLOT_GAP === 'number' ? SCROLL_SLOT_GAP : 3;
    return size + gap;
  },

  scrollGridHeight(rows) {
    const size = typeof SCROLL_SLOT_SIZE === 'number' ? SCROLL_SLOT_SIZE : 38;
    const gap = typeof SCROLL_SLOT_GAP === 'number' ? SCROLL_SLOT_GAP : 3;
    return rows * size + Math.max(0, rows - 1) * gap;
  },

  getScrollContentHeight() {
    const rows = typeof SCROLL_GRID_ROWS === 'number' ? SCROLL_GRID_ROWS : 5;
    return this.scrollGridHeight(rows);
  },

  getScrollViewportHeight() {
    const rows = typeof SCROLL_VISIBLE_ROWS === 'number' ? SCROLL_VISIBLE_ROWS : 2;
    return this.scrollGridHeight(rows);
  },

  getScrollMaxScroll() {
    return Math.max(0, this.getScrollContentHeight() - this.getScrollViewportHeight());
  },

  snapScrollGrid(value) {
    const stride = this.scrollRowStride();
    const maxScroll = this.getScrollMaxScroll();
    const snapped = Math.round(value / stride) * stride;
    return Math.max(0, Math.min(maxScroll, snapped));
  },

  initScrollGrid() {
    const grid = document.getElementById('scScrollGrid');
    const viewport = document.getElementById('scScrollViewport');
    const track = document.getElementById('scScrollTrack');
    const thumb = document.getElementById('scScrollThumb');
    if (!grid || grid.dataset.ready === '1') return;

    const slotCount = typeof SCROLL_SLOT_COUNT === 'number' ? SCROLL_SLOT_COUNT : 45;
    grid.innerHTML = '';
    for (let i = 0; i < slotCount; i += 1) {
      const slot = document.createElement('button');
      slot.type = 'button';
      slot.className = 'sc-scroll-slot';
      slot.dataset.slotIndex = String(i);
      slot.addEventListener('click', () => {
        const item = getScrollItemBySlot(i);
        if (item) this.selectScroll(item.id);
      });
      grid.appendChild(slot);
    }

    grid.addEventListener('mouseover', (event) => {
      const slot = event.target.closest('.sc-scroll-slot.has-item');
      if (!slot || grid._tooltipSlot === slot) return;

      grid._tooltipSlot = slot;
      const item = getScrollItemBySlot(Number(slot.dataset.slotIndex));
      if (item) this.showScrollTooltip(slot, item);
    });

    grid.addEventListener('mouseout', (event) => {
      const slot = event.target.closest('.sc-scroll-slot.has-item');
      if (!slot) return;

      const related = event.relatedTarget;
      if (related instanceof Node && slot.contains(related)) return;

      if (grid._tooltipSlot === slot) {
        grid._tooltipSlot = null;
        this.hideScrollTooltip();
      }
    });

    viewport?.addEventListener('wheel', (e) => this.onScrollGridWheel(e), { passive: false });
    track?.addEventListener('mousedown', (e) => this.onScrollTrackMouseDown(e));
    thumb?.addEventListener('mousedown', (e) => this.onScrollThumbMouseDown(e));
    window.addEventListener('mousemove', (e) => this.onScrollThumbMouseMove(e));
    window.addEventListener('mouseup', () => this.onScrollThumbMouseUp());

    this.applyScrollSlotSelectedLayout();
    grid.dataset.ready = '1';
    this.updateScrollGridScroll();
  },

  applyScrollSlotSelectedLayout() {
    const sel = typeof SCROLL_SLOT_SELECTED !== 'undefined' ? SCROLL_SLOT_SELECTED : null;
    const panel = document.getElementById('scScrollPanel');
    if (!panel || !sel) return;
    panel.style.setProperty('--sc-slot-selected-x', `${sel.x}px`);
    panel.style.setProperty('--sc-slot-selected-y', `${sel.y}px`);
    panel.style.setProperty('--sc-slot-selected-w', `${sel.width}px`);
    panel.style.setProperty('--sc-slot-selected-h', `${sel.height}px`);
  },

  onScrollGridWheel(e) {
    const maxScroll = this.getScrollMaxScroll();
    if (maxScroll <= 0) return;
    e.preventDefault();
    const direction = e.deltaY > 0 ? 1 : e.deltaY < 0 ? -1 : 0;
    if (!direction) return;
    this.scrollTop = this.snapScrollGrid(this.scrollTop + direction * this.scrollRowStride());
    this.updateScrollGridScroll();
  },

  onScrollTrackMouseDown(e) {
    const track = document.getElementById('scScrollTrack');
    if (!track || e.target.id === 'scScrollThumb') return;

    const rect = track.getBoundingClientRect();
    const ratio = (e.clientY - rect.top) / rect.height;
    const maxScroll = this.getScrollMaxScroll();
    const maxRow = Math.round(maxScroll / this.scrollRowStride());
    const targetRow = Math.round(ratio * maxRow);
    this.scrollTop = this.snapScrollGrid(targetRow * this.scrollRowStride());
    this.updateScrollGridScroll();
  },

  onScrollThumbMouseDown(e) {
    e.preventDefault();
    this.draggingScrollThumb = true;
    this.dragStartY = e.clientY;
    this.dragStartScroll = this.scrollTop;
  },

  onScrollThumbMouseMove(e) {
    if (!this.draggingScrollThumb) return;

    const track = document.getElementById('scScrollTrack');
    const thumb = document.getElementById('scScrollThumb');
    if (!track || !thumb) return;

    const trackH = track.clientHeight;
    const thumbH = thumb.clientHeight;
    const maxScroll = this.getScrollMaxScroll();
    const scrollableTrack = Math.max(1, trackH - thumbH);
    const delta = e.clientY - this.dragStartY;
    const scrollDelta = (delta / scrollableTrack) * maxScroll;

    this.scrollTop = this.snapScrollGrid(this.dragStartScroll + scrollDelta);
    this.updateScrollGridScroll();
  },

  onScrollThumbMouseUp() {
    if (this.draggingScrollThumb) {
      this.scrollTop = this.snapScrollGrid(this.scrollTop);
      this.updateScrollGridScroll();
    }
    this.draggingScrollThumb = false;
  },

  updateScrollGridScroll() {
    const grid = document.getElementById('scScrollGrid');
    const thumb = document.getElementById('scScrollThumb');
    const track = document.getElementById('scScrollTrack');
    const scrollbar = document.getElementById('scScrollScrollbar');
    if (!grid) return;

    const maxScroll = this.getScrollMaxScroll();
    this.scrollTop = this.snapScrollGrid(this.scrollTop);
    grid.style.transform = maxScroll > 0 ? `translateY(-${this.scrollTop}px)` : '';
    scrollbar?.classList.toggle('is-disabled', maxScroll <= 0);

    if (!thumb || !track) return;

    const trackH = track.clientHeight || this.getScrollViewportHeight();
    const contentH = this.getScrollContentHeight();
    const viewportH = this.getScrollViewportHeight();
    const thumbH = Math.max(16, Math.round(trackH * (viewportH / contentH)));
    const maxThumbTop = Math.max(0, trackH - thumbH);
    const thumbTop = maxScroll > 0 ? (this.scrollTop / maxScroll) * maxThumbTop : 0;

    thumb.style.height = `${thumbH}px`;
    thumb.style.top = `${thumbTop}px`;
  },

  showScrollTooltip(slot, scroll) {
    const tooltip = document.getElementById('scScrollTooltip');
    const img = document.getElementById('scScrollTooltipImg');
    const detailPath = getScrollDetailImagePath(scroll);
    if (!tooltip || !img || !detailPath) return;

    img.src = detailPath;
    img.alt = scroll.name || '卷軸詳細資訊';
    tooltip.classList.remove('hidden');
    tooltip.setAttribute('aria-hidden', 'false');

    const positionTooltip = () => {
      const rect = slot.getBoundingClientRect();
      const gap = 8;
      let left = rect.left - tooltip.offsetWidth - gap;
      let top = rect.top;

      if (left < 8) {
        left = rect.right + gap;
      }

      const maxTop = window.innerHeight - tooltip.offsetHeight - 8;
      if (top > maxTop) top = Math.max(8, maxTop);
      if (top < 8) top = 8;

      tooltip.style.left = `${left}px`;
      tooltip.style.top = `${top}px`;
    };

    if (img.complete) {
      positionTooltip();
    } else {
      img.onload = () => {
        img.onload = null;
        positionTooltip();
      };
    }
  },

  hideScrollTooltip() {
    const tooltip = document.getElementById('scScrollTooltip');
    const img = document.getElementById('scScrollTooltipImg');
    const grid = document.getElementById('scScrollGrid');
    if (grid) grid._tooltipSlot = null;

    if (!tooltip) return;
    tooltip.classList.add('hidden');
    tooltip.setAttribute('aria-hidden', 'true');
    tooltip.style.removeProperty('left');
    tooltip.style.removeProperty('top');

    if (img) {
      img.onload = null;
      img.removeAttribute('src');
      img.alt = '';
    }
  },

  loadEquip(item) {
    this.itemData = item;
    this.selectedScrollId = null;
    this.selectedRestoreScrollId = null;
    this.selectedTraceId = null;
    this.updateUI();
  },

  resetState() {
    this.cancelAutoEnhance();
    this.itemData = null;
    this.selectedScrollId = null;
    this.selectedRestoreScrollId = null;
    this.selectedTraceId = null;
    this.pendingResult = null;
    this.hideRecoveryModal();
    this.updateUI();
    this.updateUseButtonState();
  },

  bindAutoCancelListener() {
    if (this.autoCancelHandler) return;

    this.autoCancelHandler = (event) => {
      if (!this.autoRunning) return;
      if (event.repeat) return;
      this.cancelAutoEnhance();
    };

    window.addEventListener('keydown', this.autoCancelHandler);
  },

  unbindAutoCancelListener() {
    if (!this.autoCancelHandler) return;
    window.removeEventListener('keydown', this.autoCancelHandler);
    this.autoCancelHandler = null;
  },

  cancelAutoEnhance() {
    if (!this.autoRunning) return;

    this.autoCancelled = true;
    this.autoRunning = false;
    this.unbindAutoCancelListener();
    this.updateUseButtonState();
    const btn = document.getElementById('btnScrollUse');
    if (btn) btn.removeAttribute('aria-busy');
  },

  canUseScrollAutoEnhance() {
    const scroll = this.getSelectedScroll();
    if (!scroll) return false;
    return Boolean(
      this.itemData
      && !this.isScrollUsesExhausted()
      && this.selectedTab === 'special'
      && (isChaosScroll(scroll) || isRandomRollScroll(scroll) || isMultiStatRollScroll(scroll))
      && !this.getScrollEquipError()
    );
  },

  getAutoTargetDefs(scroll) {
    if (isChaosScroll(scroll)) {
      return (typeof CHAOS_AUTO_TARGET_DEFS !== 'undefined' ? CHAOS_AUTO_TARGET_DEFS : [])
        .map((line) => ({ field: line.field, label: line.label }));
    }
    if (isMultiStatRollScroll(scroll)) {
      return (scroll.multiStatRoll.stats || []).map((line) => ({
        field: line.field,
        label: line.label
      }));
    }
    if (isRandomRollScroll(scroll)) {
      return [{
        field: scroll.randomRoll.statField || 'scrollAtk',
        label: scroll.randomRoll.statLabel || '屬性'
      }];
    }
    return [];
  },

  getAutoTargetRange(scroll) {
    if (isChaosScroll(scroll)) {
      return typeof getChaosStatRange === 'function' ? getChaosStatRange() : { min: 0, max: 7 };
    }
    if (isMultiStatRollScroll(scroll)) return getMultiStatRollRange(scroll);
    if (isRandomRollScroll(scroll)) return getRandomStatRange(scroll);
    return null;
  },

  readAutoTargetInputValues() {
    const values = {};
    document.querySelectorAll('#scAutoTargetList .sc-auto-target-input').forEach((input) => {
      values[input.dataset.autoField] = input.value;
    });
    return values;
  },

  clampAutoTargetInput(input, range) {
    if (!input || !range) return;
    const raw = String(input.value ?? '').trim();
    if (raw === '') {
      input.value = '';
      return;
    }
    let n = parseInt(raw, 10);
    if (Number.isNaN(n)) {
      input.value = '';
      return;
    }
    if (n < range.min) n = range.min;
    if (n > range.max) n = range.max;
    input.value = String(n);
  },

  bindAutoTargetInputs(range) {
    document.querySelectorAll('#scAutoTargetList .sc-auto-target-input').forEach((input) => {
      const clamp = () => this.clampAutoTargetInput(input, range);
      input.addEventListener('change', clamp);
      input.addEventListener('blur', clamp);
    });
  },

  updateAutoAtkTargetOptions() {
    const optionsWrap = document.getElementById('scBottomOptions');
    const optionsLeftWrap = document.getElementById('scBottomOptionsLeft');
    const targetsWrap = document.getElementById('scAutoTargets');
    const list = document.getElementById('scAutoTargetList');
    const autoCheck = document.getElementById('chkScrollAutoEnhance');
    const mainPanel = document.getElementById('mainContentPanel');

    const canAuto = this.canUseScrollAutoEnhance();
    const autoOn = Boolean(autoCheck?.checked);
    const showTargets = canAuto && autoOn;
    const hasEquip = Boolean(this.itemData);
    optionsWrap?.classList.toggle('hidden', !hasEquip);
    optionsLeftWrap?.classList.toggle('hidden', !hasEquip);
    targetsWrap?.classList.toggle('hidden', !showTargets);
    mainPanel?.classList.toggle('scroll-auto-open', showTargets);

    if (autoCheck) {
      autoCheck.disabled = !canAuto;
      if (!canAuto) autoCheck.checked = false;
    }

    if (!list) return;

    if (!showTargets) {
      if (!canAuto) {
        list.innerHTML = '';
        delete list.dataset.signature;
      }
      return;
    }

    const scroll = this.getSelectedScroll();
    const defs = this.getAutoTargetDefs(scroll);
    const range = this.getAutoTargetRange(scroll);
    if (!defs.length || !range) {
      list.innerHTML = '';
      return;
    }

    const prevValues = this.readAutoTargetInputValues();
    const signature = `${scroll.id}:${defs.map((d) => d.field).join(',')}`;
    if (list.dataset.signature === signature && list.children.length === defs.length) {
      list.querySelectorAll('.sc-auto-target-input').forEach((input) => {
        this.clampAutoTargetInput(input, range);
        input.min = String(range.min);
        input.max = String(range.max);
        input.placeholder = `${range.min}-${range.max}`;
      });
      return;
    }

    list.dataset.signature = signature;
    list.innerHTML = defs.map((def) => {
      const prev = prevValues[def.field];
      const valueAttr = prev != null && String(prev).trim() !== '' ? ` value="${String(prev).replace(/"/g, '')}"` : '';
      return `
        <label class="sc-auto-target-row">
          <span class="sc-auto-target-label">${def.label}</span>
          <input
            type="text"
            inputmode="numeric"
            class="sc-auto-target-input"
            data-auto-field="${def.field}"
            maxlength="3"
            placeholder="${range.min}-${range.max}"
            aria-label="${def.label}目標"${valueAttr}
          >
        </label>
      `;
    }).join('');

    list.querySelectorAll('.sc-auto-target-input').forEach((input) => {
      this.clampAutoTargetInput(input, range);
    });
    this.bindAutoTargetInputs(range);
  },

  getAutoTargets() {
    const scroll = this.getSelectedScroll();
    const range = this.getAutoTargetRange(scroll);
    if (!scroll || !range) return null;

    const targets = {};
    document.querySelectorAll('#scAutoTargetList .sc-auto-target-input').forEach((input) => {
      this.clampAutoTargetInput(input, range);
      const raw = String(input.value ?? '').trim();
      if (raw === '') return;
      const n = parseInt(raw, 10);
      if (Number.isNaN(n)) return;
      targets[input.dataset.autoField] = n;
    });

    return Object.keys(targets).length ? targets : null;
  },

  formatAutoTargetsText(targets) {
    if (!targets) return '';
    return Object.entries(targets)
      .map(([field, val]) => {
        const input = document.querySelector(`#scAutoTargetList .sc-auto-target-input[data-auto-field="${field}"]`);
        const label = input?.closest('.sc-auto-target-row')?.querySelector('.sc-auto-target-label')?.textContent || field;
        return `${label}≥${val}`;
      })
      .join('、');
  },

  meetsAutoTargets(scroll, payload, targets) {
    if (!targets) return false;
    if (isChaosScroll(scroll) || isMultiStatRollScroll(scroll)) {
      return Object.entries(targets).every(([field, min]) => {
        const change = (payload || []).find((row) => row.field === field);
        if (!change) return false;
        const amount = change.applied != null ? change.applied : change.val;
        return Number(amount) >= min;
      });
    }
    if (isRandomRollScroll(scroll)) {
      const field = scroll.randomRoll?.statField || 'scrollAtk';
      return targets[field] != null && Number(payload) >= targets[field];
    }
    return false;
  },

  async runAutoScrollEnhance() {
    if (this.autoRunning || !this.itemData) return;

    const scroll = this.getSelectedScroll();
    if (!this.canUseScrollAutoEnhance()) {
      return addLog('⚠️ 自動強化僅適用可骰數值的專用卷軸。', 'log-fail');
    }

    const targets = this.getAutoTargets();
    if (!targets) {
      return addLog('⚠️ 請至少填入一個目標數值。', 'log-fail');
    }

    if (!this.isRecoveryReady()) {
      return addLog('⚠️ 自動篩選目標需勾選恢復卡且持有至少 1 張。', 'log-fail');
    }

    if (this.getRemainingUses() <= 0) {
      return addLog('⚠️ 升級次數已用完！', 'log-fail');
    }

    this.autoRunning = true;
    this.autoCancelled = false;
    const btn = document.getElementById('btnScrollUse');
    if (btn) btn.setAttribute('aria-busy', 'true');
    this.updateUseButtonState();
    this.bindAutoCancelListener();

    let attempts = 0;
    let recoveryUsed = 0;
    let succeeded = false;
    const targetText = this.formatAutoTargetsText(targets);
    const isChaos = isChaosScroll(scroll);
    const isMulti = isMultiStatRollScroll(scroll);

    try {
      const batchSize = Math.max(1, Number(this.AUTO_ENHANCE_BATCH_SIZE) || 1);
      while (
        this.autoRunning
        && this.itemData
        && this.getRemainingUses() > 0
      ) {
        let stopBatch = false;

        for (let step = 0; step < batchSize; step++) {
          if (!this.autoRunning || !this.itemData || this.getRemainingUses() <= 0) {
            stopBatch = true;
            break;
          }

          attempts++;
          trackScrollGloryCost();
          const success = Math.random() * 100 < scroll.rate;

          // A：卷軸失敗 → 消耗恢復卡保次數 → 繼續
          if (!success) {
            if (this.tryConsumeRecoveryCardOnFail()) {
              recoveryUsed++;
            } else {
              incrementScrollUsedCountOnly(this.itemData, false);
              this.itemData.scrollFailUses = (this.itemData.scrollFailUses || 0) + 1;
              if (typeof trackScrollCatValleyCost === 'function') {
                trackScrollCatValleyCost('scrollUse', this.itemData, scroll, { usedRecovery: false });
              }
              stopBatch = true;
              break;
            }
            if (attempts > 10000) {
              stopBatch = true;
              break;
            }
            continue;
          }

          const rolled = isChaos
            ? rollChaosChanges(this.itemData)
            : isMulti
              ? rollMultiStatChanges(scroll)
              : rollRandomStatValue(scroll);

          // C：成功且達標 → 套用並結束
          if (this.meetsAutoTargets(scroll, rolled, targets)) {
            if (isChaos) applyChaosScrollBonus(this.itemData, rolled);
            else if (isMulti) applyMultiStatScrollBonus(this.itemData, rolled);
            else applyRandomScrollBonus(this.itemData, scroll, rolled);

            incrementScrollUsedCountOnly(this.itemData);
            consumeRecoveryCard();
            recoveryUsed++;
            succeeded = true;
            if (typeof trackScrollCatValleyCost === 'function') {
              trackScrollCatValleyCost('scrollApply', this.itemData, scroll, { usedRecovery: true });
            }

            this.renderRecoveryCard();
            this.updateUI();
            updateStatusPanel();

            const resultText = (isChaos || isMulti)
              ? (isChaos ? formatChaosChangeLog(rolled) : formatMultiStatChangeLog(rolled))
              : `${scroll.randomRoll?.statLabel || '屬性'} +${rolled}`;
            addLog(
              `⚡ 自動強化成功！${resultText}（目標 ${targetText}，共 ${attempts} 次，恢復卡 ${recoveryUsed} 張）`,
              'log-success'
            );
            stopBatch = true;
            break;
          }

          // B：成功未達標 → 消耗恢復卡、不套用 → 繼續
          consumeRecoveryCard();
          recoveryUsed++;
          if (typeof trackScrollCatValleyCost === 'function') {
            trackScrollCatValleyCost('recoveryDiscard', this.itemData, scroll);
          }
          if (attempts > 10000) {
            stopBatch = true;
            break;
          }
        }

        this.renderRecoveryCard();
        this.updateUI();
        updateStatusPanel();

        if (succeeded || stopBatch || !this.autoRunning || attempts > 10000) break;
        await new Promise((resolve) => setTimeout(resolve, this.AUTO_ENHANCE_DELAY_MS));
      }

      if (
        this.autoRunning
        && !succeeded
        && this.itemData
        && this.getRemainingUses() <= 0
      ) {
        addLog(`⚠️ 升級次數已用完，未達成目標（${targetText}）。`, 'log-fail');
      }
    } finally {
      this.unbindAutoCancelListener();
    }

    const wasCancelled = this.autoCancelled;
    this.autoRunning = false;
    this.autoCancelled = false;
    if (btn) btn.removeAttribute('aria-busy');
    this.updateUseButtonState();

    if (wasCancelled) {
      addLog(
        `⏹️ 已取消自動強化（任意鍵）：共 ${attempts} 次，恢復卡 ${recoveryUsed} 張`,
        'log-info'
      );
    }
  },

  selectTab(tab) {
    this.hideScrollTooltip();
    this.selectedTab = tab;
    if (tab === 'trace') {
      this.selectedScrollId = null;
    } else {
      this.selectedTraceId = null;
      this.selectedRestoreScrollId = null;
    }
    this.updateUI();
  },

  selectScroll(scrollId) {
    if (!this.itemData) return;
    if (this.isScrollUsesExhausted()) return;

    const scroll = getScrollById(scrollId);
    if (!scroll) return;
    if (getScrollEquipError(scroll, this.itemData)) return;

    this.selectedScrollId = this.selectedScrollId === scrollId ? null : scrollId;
    if (this.selectedScrollId) {
      this.selectedRestoreScrollId = null;
    }
    this.updateUI();
  },

  selectRestoreScroll(restoreId) {
    if (!this.itemData || this.selectedTab !== 'trace') return;
    this.selectedRestoreScrollId = this.selectedRestoreScrollId === restoreId ? null : restoreId;
    if (this.selectedRestoreScrollId) {
      this.selectedScrollId = null;
      this.selectedTraceId = null;
    }
    this.updateUI();
  },

  selectTrace(traceId) {
    if (!this.itemData) return;
    if (this.isScrollUsesExhausted()) return;

    this.selectedTraceId = this.selectedTraceId === traceId ? null : traceId;
    if (this.selectedTraceId) {
      this.selectedRestoreScrollId = null;
      this.selectedScrollId = null;
    }
    this.updateUI();
  },

  getBaseSlotCount() {
    if (!this.itemData) return 0;
    return this.itemData.baseMaxUpgradeSlots ?? this.itemData.maxUpgradeSlots ?? 0;
  },

  getTotalSlotCount() {
    if (!this.itemData) return 0;
    return this.itemData.upgradeSlots || 0;
  },

  getBonusSlotCount() {
    return Math.max(0, this.getTotalSlotCount() - this.getBaseSlotCount());
  },

  getPlatinumDisplayCount() {
    if (!this.itemData) return 0;

    const bonusCount = this.getBonusSlotCount();
    if (bonusCount <= 0) return 0;

    if (!this.shouldShowGoldenColumn()) {
      return bonusCount;
    }

    const goldenUsed = this.itemData.goldenHammerUsed || 0;
    return Math.max(0, bonusCount - goldenUsed);
  },

  getBonusSlotIndex(i) {
    const baseCount = this.getBaseSlotCount();
    const goldenUsed = this.itemData.goldenHammerUsed || 0;

    if (!this.shouldShowGoldenColumn()) {
      return baseCount + i;
    }

    return baseCount + goldenUsed + i;
  },

  shouldShowGoldenColumn() {
    if (!this.itemData) return false;

    const goldenMax = this.itemData.maxGoldenHammer ?? 1;
    if (goldenMax <= 0) return false;

    const goldenUsed = this.itemData.goldenHammerUsed || 0;
    return goldenUsed >= goldenMax;
  },

  getPlatinumHammerUsed() {
    if (!this.itemData) return 0;
    return this.itemData.platinumHammerUsed || 0;
  },

  getRemainingUses() {
    if (!this.itemData) return 0;
    return Math.max(0, this.getTotalSlotCount() - (this.itemData.scrollUsed || 0));
  },

  isScrollUsesExhausted() {
    return Boolean(this.itemData) && this.getRemainingUses() <= 0;
  },

  syncExhaustedScrollState() {
    if (this.selectedScrollId) {
      const selected = getScrollById(this.selectedScrollId);
      if (!selected || getScrollEquipError(selected, this.itemData)) {
        this.selectedScrollId = null;
      }
    }

    if (!this.isScrollUsesExhausted()) return;
    this.selectedScrollId = null;
    this.selectedTraceId = null;

    const autoCheck = document.getElementById('chkScrollAutoEnhance');
    if (autoCheck) autoCheck.checked = false;
  },

  rollGloryValue(scroll) {
    if (!scroll) return null;
    const val = rollRandomStatValue(scroll);
    return {
      val,
      label: scroll.randomRoll?.statLabel || '屬性',
      field: scroll.randomRoll?.statField || 'scrollStat'
    };
  },

  buildPendingScrollResult(scroll) {
    if (isChaosScroll(scroll)) {
      return {
        scrollId: scroll.id,
        scrollName: scroll.name,
        type: 'chaos',
        changes: rollChaosChanges(this.itemData)
      };
    }

    if (isMultiStatRollScroll(scroll)) {
      return {
        scrollId: scroll.id,
        scrollName: scroll.name,
        type: 'multi',
        changes: rollMultiStatChanges(scroll)
      };
    }

    if (isRandomRollScroll(scroll)) {
      const rolled = this.rollGloryValue(scroll);
      return {
        scrollId: scroll.id,
        scrollName: scroll.name,
        type: 'random',
        val: rolled.val,
        label: rolled.label,
        field: rolled.field
      };
    }

    return {
      scrollId: scroll.id,
      scrollName: scroll.name,
      type: 'fixed',
      stats: (scroll.stats || []).map((line) => ({ ...line }))
    };
  },

  renderRecoveryApplyStats(pending) {
    const el = document.getElementById('scRecoveryApplyStats');
    if (!el || !pending) return;

    if (pending.type === 'random') {
      el.innerHTML = `<div class="sc-recovery-stat-line">${pending.label} +${pending.val}</div>`;
      return;
    }

    if (pending.type === 'chaos' || pending.type === 'multi') {
      const lines = (pending.changes || [])
        .map((change) => {
          if (!change) return null;
          const amount = change.applied != null ? change.applied : change.val;
          if (amount == null || amount === 0) return null;
          const sign = amount > 0 ? '+' : '';
          return `<div class="sc-recovery-stat-line">${change.label} ${sign}${amount}</div>`;
        })
        .filter(Boolean);
      el.innerHTML = lines.length
        ? lines.join('')
        : '<div class="sc-recovery-stat-empty">沒有變更的屬性</div>';
      return;
    }

    if (pending.stats?.length) {
      el.innerHTML = pending.stats
        .map((line) => `<div class="sc-recovery-stat-line">${line.label} +${line.val}</div>`)
        .join('');
      return;
    }

    el.innerHTML = '<div class="sc-recovery-stat-empty">沒有變更的屬性</div>';
  },

  isPendingMaxRoll(pending) {
    if (!pending || pending.type !== 'random') return false;
    const scroll = getScrollById(pending.scrollId);
    return isMaxRandomRollValue(scroll, pending.val);
  },

  stopRecoveryHighlight() {
    if (this.recoveryHighlightTimer) {
      clearTimeout(this.recoveryHighlightTimer);
      this.recoveryHighlightTimer = null;
    }

    const el = document.getElementById('scRecoveryApplyHighlight');
    if (el) {
      el.classList.add('hidden');
      el.removeAttribute('src');
    }
  },

  playRecoveryHighlight() {
    const el = document.getElementById('scRecoveryApplyHighlight');
    if (!el) return;

    this.stopRecoveryHighlight();
    el.classList.remove('hidden');

    let frame = 0;
    const { frameCount, frameMs, basePath } = this.RECOVERY_HIGHLIGHT;

    const tick = () => {
      el.src = `${basePath}.${frame}.png`;
      frame += 1;
      if (frame >= frameCount) {
        this.stopRecoveryHighlight();
        return;
      }
      this.recoveryHighlightTimer = setTimeout(tick, frameMs);
    };

    tick();
  },

  showRecoveryModal(pending) {
    const modal = document.getElementById('scrollRecoveryModal');
    if (!modal) return;

    this.clearRecoveryCloseTimer();
    this.recoveryClosing = false;

    const cancelBtn = document.getElementById('btnRecoveryCancel');
    const applyBtn = document.getElementById('btnRecoveryApply');
    const applyWrap = document.querySelector('.sc-recovery-apply-wrap');
    beginModalFadeIn(modal);
    cancelBtn?.classList.remove('is-selected');
    applyBtn?.classList.remove('is-selected');
    applyWrap?.classList.remove('is-selected');
    if (cancelBtn) cancelBtn.disabled = false;
    if (applyBtn) applyBtn.disabled = false;

    const iconEl = document.getElementById('scRecoveryEquipIcon');
    if (iconEl) {
      if (this.itemData?.icon) {
        iconEl.src = this.itemData.icon;
        iconEl.alt = this.itemData.name || '裝備';
        iconEl.classList.remove('hidden');
      } else {
        iconEl.removeAttribute('src');
        iconEl.alt = '';
      }
    }

    this.renderRecoveryApplyStats(pending);

    if (this.isPendingMaxRoll(pending)) {
      this.playRecoveryHighlight();
    } else {
      this.stopRecoveryHighlight();
    }
  },

  clearRecoveryCloseTimer() {
    if (this.recoveryCloseTimer) {
      clearTimeout(this.recoveryCloseTimer);
      this.recoveryCloseTimer = null;
    }
  },

  beginRecoveryClose(apply) {
    const modal = document.getElementById('scrollRecoveryModal');
    if (!modal || modal.classList.contains('hidden') || this.recoveryClosing) return;

    this.recoveryClosing = true;
    this.stopRecoveryHighlight();
    modal.classList.add('is-closing');

    const cancelBtn = document.getElementById('btnRecoveryCancel');
    const applyBtn = document.getElementById('btnRecoveryApply');
    const applyWrap = document.querySelector('.sc-recovery-apply-wrap');

    cancelBtn?.classList.toggle('is-selected', !apply);
    applyBtn?.classList.toggle('is-selected', apply);
    applyWrap?.classList.toggle('is-selected', apply);
    if (cancelBtn) cancelBtn.disabled = true;
    if (applyBtn) applyBtn.disabled = true;

    this.recoveryCloseTimer = setTimeout(() => {
      confirmScrollResult(apply);
    }, 500);
  },

  closeRecoveryModal() {
    const modal = document.getElementById('scrollRecoveryModal');
    if (!modal) return;

    this.clearRecoveryCloseTimer();
    this.stopRecoveryHighlight();
    this.recoveryClosing = false;

    const cancelBtn = document.getElementById('btnRecoveryCancel');
    const applyBtn = document.getElementById('btnRecoveryApply');
    const applyWrap = document.querySelector('.sc-recovery-apply-wrap');

    modal.classList.add('hidden');
    clearModalFadeState(modal);
    modal.setAttribute('aria-hidden', 'true');
    cancelBtn?.classList.remove('is-selected');
    applyBtn?.classList.remove('is-selected');
    applyWrap?.classList.remove('is-selected');
  },

  hideRecoveryModal() {
    this.closeRecoveryModal();
  },

  needsRecoveryCardForUse() {
    if (this.selectedTab !== 'special') return false;
    const scroll = this.getSelectedScroll();
    return scrollRequiresRecoveryCard(scroll);
  },

  getScrollEquipError() {
    const scroll = this.getSelectedScroll();
    if (!scroll || !this.itemData) return null;
    return getScrollEquipError(scroll, this.itemData);
  },

  isScrollUsableOnEquip() {
    return !this.getScrollEquipError();
  },

  isRecoveryReady() {
    if (!this.needsRecoveryCardForUse()) return false;
    return this.recoveryCardChecked && playerRecoveryCardCount > 0;
  },

  tryConsumeRecoveryCardOnFail() {
    if (!this.needsRecoveryCardForUse()) return false;
    if (!this.recoveryCardChecked) return false;
    if (!consumeRecoveryCard()) return false;
    if (typeof trackScrollCatValleyCost === 'function') {
      trackScrollCatValleyCost('recoveryDiscard', this.itemData, this.getSelectedScroll());
    }
    return true;
  },

  getSelectedRestoreScroll() {
    if (!this.selectedRestoreScrollId) return null;
    return getRestoreScrollById(this.selectedRestoreScrollId);
  },

  getSelectedScroll() {
    if (!this.selectedScrollId) return null;
    return getScrollById(this.selectedScrollId);
  },

  getSelectedTrace() {
    if (!this.selectedTraceId) return null;
    return TRACE_TYPES.find(t => t.id === this.selectedTraceId) || null;
  },

  getPreviewStats() {
    const restore = this.getSelectedRestoreScroll();
    if (restore) {
      return {
        type: 'restore',
        rate: restore.rate,
        stats: [{ label: restore.effectLabel, val: '' }]
      };
    }

    if (this.selectedTab === 'special') {
      const scroll = this.getSelectedScroll();
      if (!scroll) return null;
      if (isChaosScroll(scroll)) {
        return { type: 'chaos', rate: scroll.rate, stats: scroll.stats || [] };
      }
      if (isMultiStatRollScroll(scroll)) {
        const range = getMultiStatRollRange(scroll);
        return {
          type: 'multi',
          rate: scroll.rate,
          min: range.min,
          max: range.max,
          stats: (scroll.multiStatRoll.stats || []).map((line) => ({ label: line.label }))
        };
      }
      if (isRandomRollScroll(scroll)) {
        const range = getRandomStatRange(scroll);
        return {
          type: 'random',
          rate: scroll.rate,
          label: scroll.randomRoll.statLabel || '屬性',
          min: range.min,
          max: range.max
        };
      }
      return { type: 'fixed', rate: scroll.rate, stats: scroll.stats || [] };
    }

    const trace = this.getSelectedTrace();
    if (!trace) return null;
    return {
      type: 'trace',
      rate: trace.rate,
      stats: [{ label: '咒文的痕跡', val: trace.cost }]
    };
  },

  setIdleMode(isIdle) {
    const idlePanel = document.getElementById('scIdlePanel');
    const activePanel = document.getElementById('scActivePanel');

    if (idlePanel) idlePanel.classList.toggle('hidden', !isIdle);
    if (activePanel) activePanel.classList.toggle('hidden', isIdle);

    if (typeof syncMainPanelIdleState === 'function') {
      syncMainPanelIdleState();
    }

    this.updateUseButtonState();
  },

  renderGoldenSlot() {
    const slot = document.getElementById('scGoldenSlot');
    if (!slot || !this.itemData) return;

    slot.innerHTML = '';

    if (!this.shouldShowGoldenColumn()) {
      slot.classList.add('hidden');
      return;
    }

    slot.classList.remove('hidden');

    const goldenMax = this.itemData.maxGoldenHammer ?? 1;
    if (goldenMax <= 0) return;

    const scrollUsed = this.itemData.scrollUsed || 0;
    const baseCount = this.getBaseSlotCount();

    slot.appendChild(this.createSlotIcon(baseCount, scrollUsed));
  },

  renderSummary() {
    const scrollRow = document.getElementById('scScrollRow');
    const bonusRow = document.getElementById('scBonusRow');
    const bonusSlots = document.getElementById('scBonusSlots');
    if (!scrollRow || !this.itemData) return;

    const scrollUsed = this.itemData.scrollUsed || 0;
    const baseCount = this.getBaseSlotCount();
    const bonusCount = this.getBonusSlotCount();
    const platinumSlotCount = this.getPlatinumDisplayCount();

    scrollRow.innerHTML = '';
    const groupCount = Math.ceil(baseCount / 5) || 0;
    for (let g = 0; g < groupCount; g++) {
      const group = document.createElement('div');
      group.className = 'sc-icon-group';

      const start = g * 5;
      const end = Math.min(start + 5, baseCount);
      for (let i = start; i < end; i++) {
        group.appendChild(this.createSlotIcon(i, scrollUsed));
      }

      scrollRow.appendChild(group);
    }

    if (bonusRow && bonusSlots) {
      if (bonusCount > 0) {
        bonusRow.classList.remove('hidden');
        this.renderGoldenSlot();
        bonusSlots.innerHTML = '';
        for (let i = 0; i < platinumSlotCount; i++) {
          const slotIndex = this.getBonusSlotIndex(i);
          bonusSlots.appendChild(this.createSlotIcon(slotIndex, scrollUsed));
        }
      } else {
        bonusRow.classList.add('hidden');
        bonusSlots.innerHTML = '';
        const goldenSlot = document.getElementById('scGoldenSlot');
        if (goldenSlot) {
          goldenSlot.innerHTML = '';
          goldenSlot.classList.add('hidden');
        }
      }
    }
  },

  createNextSlotAnimation(index) {
    const slot = document.createElement('span');
    slot.className = 'sc-scroll-slot';
    slot.dataset.scrollSlotIndex = String(index);

    const anim = document.createElement('span');
    anim.className = 'sc-scroll-icon next';
    anim.setAttribute('aria-hidden', 'true');

    slot.appendChild(anim);
    return slot;
  },

  shouldShowNextSlotAnimation() {
    if (!this.itemData || this.getRemainingUses() <= 0) return false;
    if (this.selectedRestoreScrollId) return false;

    if (this.selectedTab === 'special') {
      return Boolean(this.selectedScrollId) && this.isScrollUsableOnEquip();
    }

    return Boolean(this.selectedTraceId);
  },

  shouldShowRestoreSlotAnimationAt(index, scrollUsed) {
    if (!this.itemData || !this.selectedRestoreScrollId) return false;
    if (index >= scrollUsed || scrollUsed <= 0) return false;

    const restore = this.getSelectedRestoreScroll();
    if (!restore) return false;

    if (restore.restoreType === 'white') {
      return isScrollSlotFail(this.itemData, index, scrollUsed);
    }

    return true;
  },

  createSlotIcon(index, scrollUsed) {
    if (index < scrollUsed) {
      if (this.shouldShowRestoreSlotAnimationAt(index, scrollUsed)) {
        return this.createNextSlotAnimation(index);
      }

      const failed = isScrollSlotFail(this.itemData, index, scrollUsed);
      const img = document.createElement('img');
      img.className = 'sc-summary-icon';
      img.dataset.scrollSlotIndex = String(index);
      img.src = failed
        ? 'images/scroll/scroll.summaryIcon.0.fail.png'
        : 'images/scroll/scroll.summaryIcon.0.success.png';
      img.alt = failed ? '卷軸失敗' : '卷軸成功';
      return img;
    }

    if (index === scrollUsed && this.shouldShowNextSlotAnimation()) {
      return this.createNextSlotAnimation(index);
    }

    const img = document.createElement('img');
    img.className = 'sc-summary-icon';
    img.dataset.scrollSlotIndex = String(index);
    img.src = 'images/hammer/scroll.summaryIcon.0.empty.png';
    img.alt = '未使用';
    return img;
  },

  renderStatAndRate() {
    const statList = document.getElementById('scStatList');
    const rateSuccess = document.getElementById('scRateSuccess');
    const selectedName = document.getElementById('scSelectedName');
    const scrollHint = document.getElementById('scScrollHint');
    const traceHint = document.getElementById('scTraceHint');
    const preview = this.getPreviewStats();

    if (selectedName) {
      const scroll = this.getSelectedScroll();
      if (this.isScrollUsesExhausted() && this.selectedTab === 'special' && !this.getSelectedRestoreScroll()) {
        selectedName.textContent = '';
      } else {
        selectedName.textContent = scroll ? scroll.name : '';
      }
    }

    if (scrollHint) {
      const hideHint = this.selectedTab === 'special'
        && Boolean(this.getSelectedScroll())
        && !this.isScrollUsesExhausted();
      scrollHint.classList.toggle('hidden', hideHint);
    }

    if (traceHint) {
      const hideTraceHint = Boolean(this.itemData);
      traceHint.classList.toggle('hidden', hideTraceHint);
    }

    if (statList) {
      if (this.isScrollUsesExhausted() && !this.getSelectedRestoreScroll()) {
        statList.innerHTML = '<div class="sc-stat-empty">強化次數已達上限</div>';
      } else if (!preview) {
        statList.innerHTML = '';
      } else if (preview.type === 'random') {
        statList.innerHTML = `<div class="sc-stat-line">${preview.label} <span>+${preview.min} ~ +${preview.max}</span></div>`;
      } else if (preview.type === 'multi') {
        statList.innerHTML = (preview.stats || [])
          .map((line) => (
            `<div class="sc-stat-line">${line.label} <span>+${preview.min} ~ +${preview.max}</span></div>`
          ))
          .join('');
      } else if (preview.type === 'chaos' || preview.stats?.length) {
        statList.innerHTML = (preview.stats || [])
          .map((line) => {
            const valHtml = line.val === '' || line.val == null ? '' : ` <span>+${line.val}</span>`;
            return `<div class="sc-stat-line">${line.label}${valHtml}</div>`;
          })
          .join('');
      } else {
        statList.innerHTML = '';
      }
    }

    if (rateSuccess) {
      if (this.isScrollUsesExhausted() && !this.getSelectedRestoreScroll()) {
        rateSuccess.textContent = '0%';
      } else {
        rateSuccess.textContent = preview ? `${Number(preview.rate).toFixed(1)}%` : '0%';
      }
    }
  },

  renderScrollGrid() {
    this.hideScrollTooltip();
    const grid = document.getElementById('scScrollGrid');
    if (!grid) return;
    if (grid.dataset.ready !== '1') this.initScrollGrid();

    grid.querySelectorAll('.sc-scroll-slot').forEach((slot) => {
      const slotIndex = Number(slot.dataset.slotIndex);
      const item = getScrollItemBySlot(slotIndex);
      const exhausted = this.isScrollUsesExhausted();
      const equipUnusable = Boolean(
        item
        && this.itemData
        && getScrollEquipError(item, this.itemData)
      );
      const unusable = Boolean(item && (exhausted || equipUnusable));

      slot.classList.toggle('has-item', Boolean(item));
      slot.classList.toggle('uses-exhausted', Boolean(item && exhausted));
      slot.classList.toggle('equip-unusable', Boolean(item && equipUnusable && !exhausted));
      slot.classList.toggle('selected', Boolean(item && !unusable && this.selectedScrollId === item.id));
      slot.removeAttribute('data-scroll-id');
      slot.style.removeProperty('--sc-color');
      slot.innerHTML = '';

      if (!item) return;

      slot.dataset.scrollId = item.id;

      if (item.icon) {
        const size = typeof getScrollIconSize === 'function'
          ? getScrollIconSize(item)
          : { w: item.iconWidth || 34, h: item.iconHeight || 31 };
        slot.innerHTML = (
          `<img class="sc-scroll-icon" src="${item.icon}" alt="${item.name}"`
          + ` width="${size.w}" height="${size.h}">`
        );
      } else {
        slot.style.setProperty('--sc-color', item.color || '#555');
        slot.innerHTML = `<span class="sc-scroll-placeholder">${item.name.slice(0, 1)}</span>`;
      }
    });

    this.updateScrollGridScroll();
  },

  createTraceTypeBtn(trace) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'sc-trace-type';
    if (this.selectedTraceId === trace.id) btn.classList.add('selected');
    btn.innerHTML = `<span class="sc-trace-label">${trace.label}</span><span class="sc-trace-cost">${trace.cost}</span>`;
    btn.addEventListener('click', () => this.selectTrace(trace.id));
    return btn;
  },

  createTraceEmptyCell() {
    const cell = document.createElement('div');
    cell.className = 'sc-trace-cell-empty';
    cell.setAttribute('aria-hidden', 'true');
    return cell;
  },

  createRestoreScrollBtn(restore) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'sc-trace-restore';
    if (this.selectedRestoreScrollId === restore.id) btn.classList.add('selected');
    btn.title = restore.name;
    btn.innerHTML = `
      <img class="sc-trace-restore-icon" src="${restore.icon}" alt="">
      <span class="sc-trace-restore-label">${restore.name}</span>
    `;
    btn.addEventListener('click', () => this.selectRestoreScroll(restore.id));
    return btn;
  },

  renderTraceGrid() {
    const grid = document.getElementById('scTraceGrid');
    const hint = document.getElementById('scTraceHint');
    if (!grid) return;

    if (!this.itemData) {
      grid.classList.add('hidden');
      grid.innerHTML = '';
      if (hint) hint.classList.remove('hidden');
      return;
    }

    grid.classList.remove('hidden');
    if (hint) hint.classList.add('hidden');
    grid.innerHTML = '';

    for (let row = 0; row < 3; row++) {
      if (RESTORE_SCROLLS[row]) {
        grid.appendChild(this.createRestoreScrollBtn(RESTORE_SCROLLS[row]));
      }
    }
  },

  renderTraceTypes() {
    this.renderTraceGrid();
  },

  renderRecoveryCard() {
    const bar = document.getElementById('scRecoveryBar');
    const countEl = document.getElementById('scRecoveryCount');
    const checkEl = document.getElementById('scRecoveryCheck');
    const iconEl = document.getElementById('scRecoveryIcon');
    if (!bar) return;

    const show = Boolean(this.itemData)
      && this.selectedTab === 'special'
      && this.needsRecoveryCardForUse()
      && !this.isScrollUsesExhausted();
    bar.classList.toggle('hidden', !show);

    if (iconEl && RECOVERY_CARD.icon) {
      iconEl.src = RECOVERY_CARD.icon;
    }

    if (countEl) {
      countEl.textContent = `${playerRecoveryCardCount} 個`;
    }

    if (checkEl) {
      checkEl.checked = this.recoveryCardChecked;
      checkEl.disabled = playerRecoveryCardCount <= 0;
      if (playerRecoveryCardCount <= 0) {
        this.recoveryCardChecked = false;
        checkEl.checked = false;
      }
    }

    bar.classList.toggle('is-disabled', playerRecoveryCardCount <= 0);

    const cntRestore = document.getElementById('cntRestore');
    if (cntRestore) cntRestore.textContent = `${playerRecoveryCardCount}次`;
  },

  renderTabs() {
    const tabTrace = document.getElementById('scTabTrace');
    const tabSpecial = document.getElementById('scTabSpecial');
    const tracePanel = document.getElementById('scTracePanel');
    const scrollPanel = document.getElementById('scScrollPanel');
    const hasEquip = Boolean(this.itemData);
    const onSpecialTab = this.selectedTab === 'special';

    if (tabTrace) tabTrace.classList.toggle('selected', this.selectedTab === 'trace');
    if (tabSpecial) tabSpecial.classList.toggle('selected', onSpecialTab);

    // 咒文分頁：咒文痕跡區；專用分頁：9×5 卷軸欄（可視 2 排）
    if (tracePanel) {
      tracePanel.classList.toggle('hidden', onSpecialTab);
      tracePanel.classList.remove('mode-recover');
      tracePanel.classList.toggle('sc-idle-trace', !hasEquip && !onSpecialTab);
    }

    if (scrollPanel) scrollPanel.classList.toggle('hidden', !onSpecialTab);
  },

  updateUseButtonState() {
    const btn = document.getElementById('btnScrollUse');
    if (!btn) return;

    const hasEquip = Boolean(this.itemData);
    const hasSelection = this.selectedTab === 'special'
      ? Boolean(this.selectedScrollId)
      : Boolean(this.selectedTraceId || this.selectedRestoreScrollId);
    const equipOk = this.selectedTab !== 'special' || this.isScrollUsableOnEquip();
    const usesOk = this.selectedRestoreScrollId || this.getRemainingUses() > 0;

    btn.disabled = !(hasEquip && usesOk && hasSelection && equipOk)
      || this.autoRunning
      || (typeof ScrollEffectModule !== 'undefined' && ScrollEffectModule.isPlaying());
  },

  updateUI() {
    const isIdle = !this.itemData;
    this.syncExhaustedScrollState();
    this.setIdleMode(isIdle);
    this.renderTabs();
    this.renderScrollGrid();
    this.renderTraceTypes();
    this.renderStatAndRate();
    this.renderRecoveryCard();
    this.updateAutoAtkTargetOptions();
    this.updateUseButtonState();

    if (isIdle) return;
    this.renderSummary();
  },

  handleUseClick() {
    if (!this.itemData) return;

    if (this.selectedRestoreScrollId) {
      this.useRestoreScrollItem();
      return;
    }

    if (this.getRemainingUses() <= 0) {
      return addLog('⚠️ 升級次數已用完！', 'log-fail');
    }

    if (this.selectedTab === 'special') {
      const auto = document.getElementById('chkScrollAutoEnhance')?.checked;
      if (auto) {
        const scroll = this.getSelectedScroll();
        if (!this.canUseScrollAutoEnhance()) {
          return addLog('⚠️ 目前卷軸無法使用自動強化。', 'log-fail');
        }
        this.runAutoScrollEnhance();
        return;
      }
      this.useSpecialScroll();
    } else {
      this.useTraceScroll();
    }
  },

  useRestoreScrollItem() {
    const restore = this.getSelectedRestoreScroll();
    if (!restore) return;

    if (restore.restoreType === 'white' && !(this.itemData.scrollFailUses > 0)) {
      return addLog('⚠️ 沒有因卷軸失敗而消耗的次數可恢復。', 'log-fail');
    }

    const result = applyRestoreScroll(this.itemData, restore);

    if (result.resetStar && typeof StarForceModule !== 'undefined') {
      StarForceModule.currentStars = 0;
      StarForceModule.setStarConsecutiveDrops(0);
      this.itemData.star = 0;
      this.itemData.starConsecutiveDrops = 0;
      if (StarForceModule.itemData === this.itemData) {
        StarForceModule.updateUI();
      }
    }

    if (restore.restoreType === 'recover') {
      addLog('📜 回真卷軸：星力、卷軸強化已初始化。', 'log-success');
    } else if (restore.restoreType === 'white') {
      addLog(`📜 純白的卷軸：已恢復 ${result.restoredFailUses} 次失敗消耗的卷軸次數。`, 'log-success');
    } else if (restore.restoreType === 'ark') {
      addLog('📜 亞克回真卷軸：卷軸強化已初始化。', 'log-success');
    }

    this.selectedRestoreScrollId = null;
    this.updateUI();
    updateStatusPanel();
  },

  useSpecialScroll() {
    const scroll = this.getSelectedScroll();
    if (!scroll) return;

    const equipError = getScrollEquipError(scroll, this.itemData);
    if (equipError) {
      return addLog(`⚠️ ${equipError}`, 'log-fail');
    }

    const success = Math.random() * 100 < scroll.rate;
    const recoveryReady = success && scrollRequiresRecoveryCard(scroll) && this.isRecoveryReady();
    const applyResult = () => {
      if (!success) {
        if (this.tryConsumeRecoveryCardOnFail()) {
          trackScrollGloryCost();
          addLog(`📜 ${scroll.name} 失敗，恢復卡已消耗，升級次數保留。`, 'log-info');
        } else {
          incrementScrollUsedCount(this.itemData, false);
          this.itemData.scrollFailUses = (this.itemData.scrollFailUses || 0) + 1;
          if (typeof trackScrollCatValleyCost === 'function') {
            trackScrollCatValleyCost('scrollUse', this.itemData, scroll, { usedRecovery: false });
          }
          addLog(`📜 ${scroll.name} 失敗。`, 'log-fail');
        }
        this.renderRecoveryCard();
        this.updateUI();
        updateStatusPanel();
        return;
      }

      if (recoveryReady) {
        const pending = this.buildPendingScrollResult(scroll);
        this.pendingResult = pending;
        this.showRecoveryModal(pending);
        return;
      }

      if (isChaosScroll(scroll)) {
        const changes = rollChaosChanges(this.itemData);
        applyChaosScrollBonus(this.itemData, changes);
        addLog(`📜 ${scroll.name} 成功！${formatChaosChangeLog(changes)}`, 'log-success');
      } else if (isMultiStatRollScroll(scroll)) {
        const changes = rollMultiStatChanges(scroll);
        applyMultiStatScrollBonus(this.itemData, changes);
        addLog(`📜 ${scroll.name} 成功！${formatMultiStatChangeLog(changes)}`, 'log-success');
      } else if (isRandomRollScroll(scroll)) {
        const val = rollRandomStatValue(scroll);
        const label = scroll.randomRoll?.statLabel || '屬性';
        applyRandomScrollBonus(this.itemData, scroll, val);
        addLog(`📜 ${scroll.name} 成功！${label} +${val}`, 'log-success');
      } else {
        applyFixedScrollStats(this.itemData, scroll.stats);
        addLog(`📜 ${scroll.name} 成功！`, 'log-success');
      }

      incrementScrollUsedCount(this.itemData);
      if (typeof trackScrollCatValleyCost === 'function') {
        trackScrollCatValleyCost('scrollUse', this.itemData, scroll, { usedRecovery: false });
      }
      this.updateUI();
      updateStatusPanel();
    };

    if (typeof ScrollEffectModule !== 'undefined') {
      ScrollEffectModule.runWithAnim({
        success,
        tryOnly: recoveryReady,
        useRecoveryCard: recoveryReady,
        fn: applyResult,
      });
      return;
    }

    applyResult();
  },

  useTraceScroll() {
    const trace = this.getSelectedTrace();
    if (!trace) return;

    const success = Math.random() * 100 < trace.rate;
    const applyResult = () => {
      if (!success) {
        incrementScrollUsedCount(this.itemData, false);
        this.itemData.scrollFailUses = (this.itemData.scrollFailUses || 0) + 1;
        addLog(`📜 咒文的痕跡 (${trace.label}) 失敗。`, 'log-fail');
        this.updateUI();
        updateStatusPanel();
        return;
      }

      this.itemData.scrollStat = (this.itemData.scrollStat || 0) + 5;
      incrementScrollUsedCount(this.itemData);
      addLog(`📜 咒文的痕跡 (${trace.label}) 成功！全屬性 +5`, 'log-success');
      this.updateUI();
      updateStatusPanel();
    };

    if (typeof ScrollEffectModule !== 'undefined') {
      ScrollEffectModule.runWithAnim({ success, fn: applyResult });
      return;
    }

    applyResult();
  },

  useGloryScroll() {
    this.selectTab('special');
    const glory = getGloryScrollItem();
    if (glory) this.selectScroll(glory.id);
    this.handleUseClick();
  }
};

function confirmScrollResult(apply) {
  const pending = ScrollModule.pendingResult;
  ScrollModule.pendingResult = null;
  ScrollModule.closeRecoveryModal();

  if (!pending || !currentEnchantItem) return;

  const scroll = getScrollById(pending.scrollId);
  const scrollName = pending.scrollName || scroll?.name || '卷軸';

  if (!consumeRecoveryCard()) {
    addLog('⚠️ 恢復卡數量不足。', 'log-fail');
    ScrollModule.renderRecoveryCard();
    ScrollModule.updateUI();
    updateStatusPanel();
    return;
  }

  if (apply) {
    const applyScrollResult = () => {
      if (pending.type === 'chaos') {
        applyChaosScrollBonus(currentEnchantItem, pending.changes);
        addLog(`📜 ${scrollName} 成功！${formatChaosChangeLog(pending.changes)}`, 'log-success');
      } else if (pending.type === 'multi') {
        applyMultiStatScrollBonus(currentEnchantItem, pending.changes);
        addLog(`📜 ${scrollName} 成功！${formatMultiStatChangeLog(pending.changes)}`, 'log-success');
      } else if (pending.type === 'random') {
        applyRandomScrollBonus(currentEnchantItem, scroll, pending.val);
        addLog(`📜 ${scrollName} 成功！${pending.label} +${pending.val}`, 'log-success');
      } else {
        applyFixedScrollStats(currentEnchantItem, pending.stats);
        const statText = (pending.stats || []).map((line) => `${line.label} +${line.val}`).join('、');
        addLog(`📜 ${scrollName} 成功！${statText}`, 'log-success');
      }
      incrementScrollUsedCount(currentEnchantItem);
      if (typeof trackScrollCatValleyCost === 'function') {
        trackScrollCatValleyCost('scrollApply', currentEnchantItem, scroll, { usedRecovery: true });
      }
      ScrollModule.renderRecoveryCard();
      updateStatusPanel();
      ScrollModule.updateUI();
    };

    if (typeof ScrollEffectModule !== 'undefined') {
      ScrollEffectModule.playRecoveryApplySuccess({ onComplete: applyScrollResult });
    } else {
      applyScrollResult();
    }
  } else {
    trackScrollGloryCost();
    if (typeof trackScrollCatValleyCost === 'function') {
      trackScrollCatValleyCost('recoveryDiscard', currentEnchantItem, scroll);
    }
    addLog(`📜 ${scrollName}：已取消套用卷軸，升級次數保留。恢復卡已消耗。`, 'log-info');
    ScrollModule.renderRecoveryCard();
    updateStatusPanel();
    ScrollModule.updateUI();
  }
}

function useRestoreCard() {
  if (!currentEnchantItem) {
    alert('請先將裝備放入中間強化槽！');
    return;
  }

  const ark = getRestoreScrollById('scroll_ark_recover');
  if (ark) applyRestoreScroll(currentEnchantItem, ark);
  else {
    resetScrollBonusFields(currentEnchantItem);
    currentEnchantItem.scrollUsed = 0;
    currentEnchantItem.scrollFailUses = 0;
    currentEnchantItem.scrollSlotResults = [];
  }
  updateStatusPanel();
  ScrollModule.updateUI();
  addLog('🛡️ 亞克回真卷軸：卷軸強化已初始化。', 'log-success');
}

window.addEventListener('DOMContentLoaded', () => {
  ScrollModule.init();
});
