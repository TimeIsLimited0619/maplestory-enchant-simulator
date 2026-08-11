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

  SUB_ACTIONS: [
    { id: 'addMain', label: '增加潛能(主)', title: '增加一排主要潛能（傳說），消耗太初 100' },
    { id: 'clearMain', label: '清空潛能(主)', title: '清除全部主要潛能（免費）' },
    { id: 'addAdd', label: '增加潛能(副)', title: '增加一排附加潛能：第1排 100億，第2～3排太初 150' },
    { id: 'clearAdd', label: '清空潛能(副)', title: '清除附加潛能第2、3排（免費）' },
    { id: 'rerollAdd1', label: '重隨潛能(副)', title: '重骰附加潛能第1排，消耗 40億' },
  ],

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
    if (menu) return menu;

    menu = document.createElement('div');
    menu.id = this.SUBMENU_ID;
    menu.className = 'inv-cat-valley-submenu hidden';
    menu.setAttribute('role', 'group');
    menu.setAttribute('aria-label', '貓谷潛能操作');

    this.SUB_ACTIONS.forEach((action) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'inv-cat-valley-btn inv-cat-valley-sub-btn';
      btn.dataset.action = action.id;
      btn.title = action.title;
      btn.innerHTML = `<span class="inv-cat-valley-btn-label">${action.label}</span>`;
      menu.appendChild(btn);
    });

    panel.appendChild(menu);
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

    menu.querySelectorAll('[data-action]').forEach((btn) => {
      const action = btn.dataset.action;
      let enabled = false;
      if (state) {
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
      this.closeSubmenu();
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
  },

  handleSubAction(action) {
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
