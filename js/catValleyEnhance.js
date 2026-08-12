/**
 * 貓谷特殊強化 — 背包按鈕 UI
 * 按鈕常駐顯示；可用時 normal，不可用時 disabled。
 * 不朽的遺產／喵喵天使：點擊展開潛能操作子選單。
 */
const CatValleyEnhanceModule = {
  BUTTON_ID: 'invCatValleyBtn',
  SUBMENU_ID: 'invCatValleySubmenu',
  MASK_ID: 'invCatValleyMask',
  submenuOpen: false,
  autoRunning: false,
  autoTarget: null,
  autoTimer: null,
/**
   * 與貓谷自動相同節奏：delay + 每輪步數。
   */
  autoLoopDelayMs: 10,
  autoBatchSize: 3,

  SUB_ACTIONS: [
    { id: 'addMain', label: '增加潛能(主)', title: '增加一排主要潛能（傳說），消耗太初 100' },
    { id: 'autoSixPhys', label: '自動六排物', title: '自動骰到主＋副六排皆為物理攻擊力；再按一次可停止' },
    { id: 'clearMain', label: '清空潛能(主)', title: '清除全部主要潛能（免費）' },
    { id: 'autoSixMag', label: '自動六排魔', title: '自動骰到主＋副六排皆為魔法攻擊力；再按一次可停止' },
    { id: 'addAdd', label: '增加潛能(副)', title: '增加一排附加潛能：第1排 100億，第2～3排太初 150' },
    { id: 'clearAdd', label: '清空潛能(副)', title: '清除附加潛能第2、3排（免費）' },
    { id: 'rerollAdd1', label: '重隨潛能(副)', title: '重骰附加潛能第1排，消耗 40億' },
  ],

  AUTO_ACTIONS: new Set(['autoSixPhys', 'autoSixMag']),

  init() {
    this.ensureButton();
    this.ensureSubmenu();
    this.ensureMask();
    this.bindEvents();
    this.updateButton();
  },

  ensureButton() {
    const panel = document.getElementById('inventoryPanel');
    if (!panel) return null;

    let btn = document.getElementById(this.BUTTON_ID);
    if (btn) return btn;

    btn = document.createElement('button');
    btn.type = 'button';
    btn.id = this.BUTTON_ID;
    btn.className = 'inv-cat-valley-btn';
    btn.setAttribute('aria-label', '貓谷特殊強化');
    btn.innerHTML = '<span class="inv-cat-valley-btn-label">貓谷特殊強化</span>';
    panel.appendChild(btn);
    return btn;
  },

  ensureSubmenu() {
    const panel = document.getElementById('inventoryPanel');
    if (!panel) return null;

    let menu = document.getElementById(this.SUBMENU_ID);
    if (!menu) {
      menu = document.createElement('div');
      menu.id = this.SUBMENU_ID;
      menu.className = 'inv-cat-valley-submenu hidden';
      menu.setAttribute('role', 'group');
      menu.setAttribute('aria-label', '貓谷潛能操作');
      panel.appendChild(menu);
    }

    if (menu.dataset.layout !== 'autoSix') {
      menu.innerHTML = '';
      this.SUB_ACTIONS.forEach((action) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'inv-cat-valley-btn inv-cat-valley-sub-btn';
        if (this.AUTO_ACTIONS.has(action.id)) {
          btn.classList.add('inv-cat-valley-auto-btn');
        }
        if (action.id === 'addAdd' || action.id === 'clearAdd' || action.id === 'rerollAdd1') {
          btn.classList.add('inv-cat-valley-sub-wide');
        }
        btn.dataset.action = action.id;
        btn.title = action.title;
        btn.innerHTML = `<span class="inv-cat-valley-btn-label">${action.label}</span>`;
        menu.appendChild(btn);
      });
      menu.dataset.layout = 'autoSix';
    }

    return menu;
  },

  ensureMask() {
    const panel = document.getElementById('inventoryPanel');
    if (!panel) return null;

    let mask = document.getElementById(this.MASK_ID);
    if (mask) return mask;

    mask = document.createElement('div');
    mask.id = this.MASK_ID;
    mask.className = 'inv-cat-valley-mask hidden';
    mask.setAttribute('aria-hidden', 'true');
    panel.appendChild(mask);
    return mask;
  },

  bindEvents() {
    const btn = this.ensureButton();
    if (btn && btn.dataset.bound !== '1') {
      btn.dataset.bound = '1';
      btn.addEventListener('click', () => this.handleClick());
    }

    const menu = this.ensureSubmenu();
    if (menu && menu.dataset.bound !== '1') {
      menu.dataset.bound = '1';
      menu.addEventListener('click', (event) => {
        const subBtn = event.target.closest?.('[data-action]');
        if (!subBtn || subBtn.disabled) return;
        this.handleSubAction(subBtn.dataset.action);
      });
    }

    this.ensureMask();
    if (!this._outsideCloseBound) {
      this._outsideCloseBound = true;
      document.addEventListener('click', (event) => {
        if (!this.submenuOpen) return;
        if (this.autoRunning) return;
        const target = event.target;
        if (!(target instanceof Node)) return;
        if (target.closest?.(`#${this.BUTTON_ID}`)) return;
        if (target.closest?.(`#${this.SUBMENU_ID}`)) return;
        this.closeSubmenu();
      }, true);
    }
  },

  getActiveItem() {
    return typeof currentEnchantItem !== 'undefined' ? currentEnchantItem : null;
  },

  isUsable(item = this.getActiveItem()) {
    if (!item) return false;
    return typeof canUseCatValleyEnhance === 'function' && canUseCatValleyEnhance(item);
  },

  closeSubmenu() {
    if (this.autoRunning) this.stopAuto({ silent: true });
    this.submenuOpen = false;
    const menu = document.getElementById(this.SUBMENU_ID);
    if (menu) menu.classList.add('hidden');
    const mask = document.getElementById(this.MASK_ID);
    if (mask) {
      mask.classList.add('hidden');
      mask.setAttribute('aria-hidden', 'true');
    }
    if (typeof EquipTooltipModule !== 'undefined') {
      EquipTooltipModule.unpin?.({ hide: true });
    }
  },

  openSubmenu() {
    this.submenuOpen = true;
    const menu = this.ensureSubmenu();
    if (!menu) return;
    menu.classList.remove('hidden');
    const mask = this.ensureMask();
    if (mask) {
      mask.classList.remove('hidden');
      mask.setAttribute('aria-hidden', 'false');
    }
    this.updateSubmenuState();
    this.pinEquipTooltip();
  },

  pinEquipTooltip() {
    const item = this.getActiveItem();
    if (!item || typeof EquipTooltipModule === 'undefined') return;
    if (typeof isCatValleyPotentialItem !== 'function' || !isCatValleyPotentialItem(item)) return;

    const itemId = item.itemId || item.id;
    const dropZone = document.getElementById('equipDropZone');
    EquipTooltipModule.pin?.(dropZone, itemId, item.slotIndex);
  },

  toggleSubmenu() {
    if (this.submenuOpen) this.closeSubmenu();
    else this.openSubmenu();
  },

  updateSubmenuState() {
    const menu = document.getElementById(this.SUBMENU_ID);
    const item = this.getActiveItem();
    if (!menu) return;

    const state = typeof getCatValleyPotentialActionState === 'function' && item
      ? getCatValleyPotentialActionState(item)
      : null;
    const canAuto = !!(item
      && typeof canUseCatValleyPotentialMenu === 'function'
      && canUseCatValleyPotentialMenu(item));

    menu.querySelectorAll('[data-action]').forEach((btn) => {
      const action = btn.dataset.action;
      let enabled = false;

      if (this.AUTO_ACTIONS.has(action)) {
        enabled = canAuto;
        const target = action === 'autoSixPhys' ? '物理攻擊力' : '魔法攻擊力';
        const runningHere = this.autoRunning && this.autoTarget === target;
        btn.classList.toggle('is-running', runningHere);
        const base = this.SUB_ACTIONS.find((row) => row.id === action);
        const labelEl = btn.querySelector('.inv-cat-valley-btn-label');
        if (labelEl && base) {
          labelEl.textContent = runningHere ? '停止自動' : base.label;
        }
        btn.title = runningHere
          ? '再按一次停止自動'
          : (base?.title || '');
      } else if (this.autoRunning) {
        enabled = false;
      } else if (state) {
        if (action === 'addMain') enabled = state.canAddMain;
        else if (action === 'clearMain') enabled = state.canClearMain;
        else if (action === 'addAdd') enabled = state.canAddAdd;
        else if (action === 'clearAdd') enabled = state.canClearAdd;
        else if (action === 'rerollAdd1') enabled = state.canRerollAdd1;
      }

      btn.disabled = !enabled;
      btn.classList.toggle('is-disabled', !enabled);
      btn.classList.toggle('is-normal', enabled);
    });
  },

  updateButton() {
    const btn = this.ensureButton();
    if (!btn) return;

    const item = this.getActiveItem();
    const usable = this.isUsable(item);
    const isPotentialItem = typeof isCatValleyPotentialItem === 'function'
      && isCatValleyPotentialItem(item);

    btn.classList.remove('hidden');
    btn.disabled = !usable;
    btn.classList.toggle('is-disabled', !usable);
    btn.classList.toggle('is-normal', usable);

    if (!isPotentialItem || !usable) {
      this.closeSubmenu();
    } else if (!canUseCatValleyPotentialMenu?.(item)) {
      if (!this.autoRunning) this.closeSubmenu();
    } else if (this.submenuOpen) {
      this.updateSubmenuState();
    }

    if (!item) {
      btn.title = '請先將裝備放入中間強化槽';
      return;
    }

    if (isPotentialItem) {
      const medalLv = typeof getMedalEnhanceLevel === 'function'
        ? getMedalEnhanceLevel(item)
        : (Number(item.medalEnhanceLevel) || 0);
      const medalMax = typeof CAT_VALLEY_MEDAL_ENHANCE_MAX === 'number'
        ? CAT_VALLEY_MEDAL_ENHANCE_MAX
        : 10;
      if (medalLv < medalMax) {
        btn.title = `勳章強化（${medalLv}/${medalMax}）`;
        return;
      }
      btn.title = this.submenuOpen
        ? '再次點擊可收合子選單'
        : '點擊展開潛能操作（增加／清空／重骰）';
      return;
    }

    const meta = typeof getCatValleyEnhanceMeta === 'function'
      ? getCatValleyEnhanceMeta(item)
      : null;
    if (!meta) {
      btn.title = '此裝備無法使用貓谷特殊強化';
      return;
    }

    const level = getCatValleyLevel(item);
    const remain = getCatValleyRemainingUses(item);
    if (!usable) {
      btn.title = `${meta.label}已達上限（${level}/${meta.maxLevel}）`;
      return;
    }
    btn.title = `${meta.label}（${level}/${meta.maxLevel}，可再強化 ${remain} 次）`;
  },

  persistItem(item) {
    if (typeof saveInventoryItemState === 'function' && item.slotIndex != null) {
      saveInventoryItemState(item.slotIndex, item);
    }
    if (typeof updateStatusPanel === 'function') updateStatusPanel();
    if (typeof updateActiveModuleEquip === 'function') updateActiveModuleEquip();
    if (typeof syncInspectModules === 'function') syncInspectModules();
    if (typeof EquipTooltipModule !== 'undefined') {
      if (typeof isCatValleyPotentialItem === 'function' && isCatValleyPotentialItem(item)) {
        this.pinEquipTooltip();
      } else {
        EquipTooltipModule.refreshIfShowing?.();
      }
    }
    if (typeof SessionPersistenceModule !== 'undefined') {
      SessionPersistenceModule.scheduleSave?.();
    }
    if (typeof CostTrackerModule !== 'undefined') {
      CostTrackerModule.refreshCostDisplay?.();
      if (CostTrackerModule.isOpen) CostTrackerModule.render?.();
    }
  },

  applySilent(item, action) {
    if (typeof applyCatValleyPotentialAction !== 'function') {
      return { ok: false };
    }
    return applyCatValleyPotentialAction(item, action);
  },

  /**
   * 逐排推進：已有排皆為目標則繼續增加；任一排不是目標則清除（主清全部／副清 2～3 排）。
   * @returns {boolean} 是否有執行操作
   */
  autoStep(item, target) {
    if (typeof isCatValleySixAtkComplete === 'function' && isCatValleySixAtkComplete(item, target)) {
      return false;
    }

    const main = ensureCatValleyPotentialState(item, 'main');
    const add = ensureCatValleyPotentialState(item, 'add');
    const mainOk = main.lines.length === 3 && main.lines.every((line) => line.label === target);
    const addOk = add.lines.length === 3 && add.lines.every((line) => line.label === target);

    if (!mainOk) {
      // 任一排不是目標 → 清空重來；前排都對才往下加
      if (main.lines.some((line) => line.label !== target)) {
        return this.applySilent(item, 'clearMain').ok;
      }
      if (main.lines.length < 3) {
        return this.applySilent(item, 'addMain').ok;
      }
    }

    if (!addOk) {
      if (add.lines.length === 0) {
        return this.applySilent(item, 'addAdd').ok;
      }
      // 第 1 排不對 → 重骰第 1 排
      if (add.lines[0].label !== target) {
        return this.applySilent(item, 'rerollAdd1').ok;
      }
      // 第 2／3 排不對 → 清掉 2～3，保留第 1 排
      if (add.lines.slice(1).some((line) => line.label !== target)) {
        return this.applySilent(item, 'clearAdd').ok;
      }
      if (add.lines.length < 3) {
        return this.applySilent(item, 'addAdd').ok;
      }
    }

    return false;
  },

  stopAuto({ silent = false } = {}) {
    if (this.autoTimer != null) {
      clearTimeout(this.autoTimer);
      this.autoTimer = null;
    }
    const wasRunning = this.autoRunning;
    this.autoRunning = false;
    this.autoTarget = null;
    if (wasRunning && !silent && typeof addLog === 'function') {
      addLog('⏹ 已停止自動貓谷潛能', 'log-info');
    }
    const item = this.getActiveItem();
    if (item) this.persistItem(item);
    this.updateSubmenuState();
  },

  startAuto(targetLabel) {
    const item = this.getActiveItem();
    if (!item || typeof canUseCatValleyPotentialMenu !== 'function' || !canUseCatValleyPotentialMenu(item)) {
      if (typeof addLog === 'function') {
        addLog('⚠️ 目前無法使用自動貓谷潛能。', 'log-fail');
      }
      return;
    }

    if (this.autoRunning) {
      if (this.autoTarget === targetLabel) {
        this.stopAuto();
        return;
      }
      this.stopAuto({ silent: true });
    }

    if (typeof isCatValleySixAtkComplete === 'function' && isCatValleySixAtkComplete(item, targetLabel)) {
      if (typeof addLog === 'function') {
        addLog(`✨ 【${item.name}】已是六排${targetLabel === '物理攻擊力' ? '物' : '魔'}`, 'log-success');
      }
      return;
    }

    this.autoRunning = true;
    this.autoTarget = targetLabel;
    this.updateSubmenuState();

    const finishSuccess = (current) => {
      this.autoRunning = false;
      this.autoTarget = null;
      this.persistItem(current);
      this.updateSubmenuState();
      if (typeof addLog === 'function') {
        addLog(
          `✨ 【${current.name}】自動六排${targetLabel === '物理攻擊力' ? '物' : '魔'}完成`,
          'log-success'
        );
      }
    };

    const tick = () => {
      if (!this.autoRunning) return;
      const current = this.getActiveItem();
      if (!current || current !== item) {
        this.stopAuto();
        return;
      }
      if (typeof isCatValleySixAtkComplete === 'function' && isCatValleySixAtkComplete(current, targetLabel)) {
        finishSuccess(current);
        return;
      }

      let progressed = false;
      for (let i = 0; i < this.autoBatchSize && this.autoRunning; i += 1) {
        if (isCatValleySixAtkComplete(current, targetLabel)) break;
        if (!this.autoStep(current, targetLabel)) break;
        progressed = true;
      }

      if (!this.autoRunning) return;

      if (typeof isCatValleySixAtkComplete === 'function' && isCatValleySixAtkComplete(current, targetLabel)) {
        finishSuccess(current);
        return;
      }

      if (progressed) {
        if (typeof saveInventoryItemState === 'function' && current.slotIndex != null) {
          saveInventoryItemState(current.slotIndex, current);
        }
        this.pinEquipTooltip();
        this.updateSubmenuState();
      }

      this.autoTimer = window.setTimeout(tick, this.autoLoopDelayMs);
    };

    this.autoTimer = window.setTimeout(tick, 0);
  },

  handleSubAction(action) {
    if (action === 'autoSixPhys') {
      this.startAuto('物理攻擊力');
      return;
    }
    if (action === 'autoSixMag') {
      this.startAuto('魔法攻擊力');
      return;
    }

    if (this.autoRunning) return;

    const item = this.getActiveItem();
    if (!item || typeof applyCatValleyPotentialAction !== 'function') return;

    const result = applyCatValleyPotentialAction(item, action);
    if (!result.ok) {
      if (typeof addLog === 'function') {
        addLog(`⚠️ ${result.message || '操作失敗'}`, 'log-fail');
      }
      this.updateSubmenuState();
      return;
    }

    this.persistItem(item);
    if (typeof addLog === 'function') {
      addLog(`✨ 【${item.name}】${result.message}`, 'log-success');
    }
    this.updateSubmenuState();
    this.updateButton();
  },

  handleClick() {
    const item = this.getActiveItem();
    if (!item) {
      if (typeof addLog === 'function') {
        addLog('⚠️ 請先將裝備放入中間強化槽。', 'log-fail');
      }
      return;
    }

    if (!canUseCatValleyEnhance(item)) {
      if (typeof addLog === 'function') {
        addLog('⚠️ 此裝備無法使用貓谷特殊強化，或已達上限。', 'log-fail');
      }
      this.updateButton();
      return;
    }

    if (isCatValleyPotentialItem(item)) {
      if (typeof canUseCatValleyMedalEnhance === 'function' && canUseCatValleyMedalEnhance(item)) {
        this.closeSubmenu();
        const result = applyCatValleyMedalEnhanceOnce(item);
        if (!result.ok) {
          if (typeof addLog === 'function') {
            addLog(`⚠️ ${result.message || '勳章強化失敗'}`, 'log-fail');
          }
          this.updateButton();
          return;
        }
        this.persistItem(item);
        const summary = formatCatValleyChangeSummary(result.changes);
        if (typeof addLog === 'function') {
          addLog(
            `✨ 【${item.name}】${result.message}${summary ? ` → ${summary}` : ''}`,
            'log-success'
          );
        }
        this.updateButton();
        return;
      }

      if (typeof canUseCatValleyPotentialMenu === 'function' && canUseCatValleyPotentialMenu(item)) {
        if (this.autoRunning) return;
        this.toggleSubmenu();
        this.updateButton();
        return;
      }
    }

    this.closeSubmenu();

    const meta = getCatValleyEnhanceMeta(item);
    const result = applyCatValleyEnhanceOnce(item);
    if (!result.ok) {
      if (typeof addLog === 'function') {
        addLog('⚠️ 貓谷特殊強化套用失敗。', 'log-fail');
      }
      this.updateButton();
      return;
    }

    this.persistItem(item);

    if (typeof trackCatValleyEnhanceCost === 'function') {
      trackCatValleyEnhanceCost(result.type, result.level);
    }

    const summary = formatCatValleyChangeSummary(result.changes);
    const label = meta?.label || '貓谷特殊強化';
    const maxLevel = meta?.maxLevel || result.level;
    if (typeof addLog === 'function') {
      addLog(
        `✨ 【${item.name}】${label}：Lv.${result.level}/${maxLevel}`
          + `${summary ? ` → ${summary}` : ''}`,
        'log-success'
      );
    }

    this.updateButton();
  },
};

document.addEventListener('DOMContentLoaded', () => {
  CatValleyEnhanceModule.init();
});
