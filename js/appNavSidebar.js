/**
 * 全域左側導覽欄：面板開關、模式切換、放置功能、角色頭像與名稱。
 */
const AppNavSidebar = (() => {
  const COLLAPSE_KEY = 'app.nav.collapsed.v1';
  const NAME_KEY = 'character.displayName.v1';
  const ICON_BASE = 'images/menubtn';

  const MAIN_ITEMS_BEFORE_CRAFT = [
    { id: 'btnViewEnchant', label: '強化', icon: 'enchant', title: '開關強化台' },
    { id: 'btnViewEquip', label: '裝備欄', icon: 'Equip', title: '開關裝備欄' },
    { id: 'btnViewInventory', label: '物品欄', icon: 'inventory', title: '開關物品欄' },
  ];

  const MAIN_DRAWER_ITEMS = [
    { id: 'btnViewEquipCraft', label: '裝備製作', icon: 'equipcraft', title: '裝備製作' },
    { id: 'btnViewDisassemble', label: '分解中心', icon: 'enchanttoolspanel', title: '分解裝備／分解卷軸' },
  ];

  const MAIN_ITEMS_AFTER_CRAFT = [
    { id: 'btnViewCharacter', label: '角色', icon: 'characterinfo', title: '開關角色資訊' },
    { id: 'btnViewSkill', label: '技能', icon: 'skill', title: '開關技能面板' },
  ];

  const SIM_ITEMS = [
    { id: 'btnViewRequest', label: '清單', icon: 'itemrequest', title: '開關物品清單' },
    { id: 'btnViewLog', label: 'Log', icon: 'log', title: '開關 Log' },
    { id: 'btnViewCost', label: '成本', icon: 'logcostpanels', title: '開關成本統計' },
    { id: 'btnViewCombat', label: '數值', icon: 'charactercombatpanel', title: '開關戰鬥力數值' },
    { id: 'btnViewEfficiency', label: '效益', icon: 'combatefficiencypanel', title: '開關數值換算表' },
    { id: 'btnViewDetail', label: '明細', icon: 'equipstatpanel', title: '開關身上屬性明細' },
    { id: 'btnViewTools', label: '工具', icon: 'enchanttoolspanel', title: '洗裝紀錄、期望試算、分享碼' },
  ];

  const IDLE_ITEMS = [
    { id: 'idleHuntPickMap', label: '章節', icon: 'idlehuntpickmap', title: '章節' },
    { id: 'idleHuntNpcShop', label: '商店', icon: 'shop', title: '商店' },
    { id: 'idleHuntDungeon', label: '副本', icon: 'idelhuntdungon', title: '副本' },
    { id: 'idleHuntBoss', label: 'BOSS', icon: 'boss', title: 'BOSS' },
    { id: 'idleHuntGmDrops', label: 'GM 編輯器', icon: 'gm', title: 'GM 編輯器' },
  ];

  let inited = false;
  let buttonsLocked = false;

  function $(id) {
    return document.getElementById(id);
  }

  function iconUrl(folder, state) {
    return `${ICON_BASE}/${folder}/${state}/0.png`;
  }

  function itemButtonMarkup(item, extraClass) {
    const cls = ['app-nav-item', extraClass].filter(Boolean).join(' ');
    return `<li>
      <button type="button" class="${cls}" id="${item.id}" data-icon-dir="${item.icon}" title="${item.title || item.label}">
        <img class="app-nav-item-icon" src="${iconUrl(item.icon, 'normal')}" alt="" draggable="false" aria-hidden="true">
        <span class="app-nav-item-label">${item.label}</span>
      </button>
    </li>`;
  }

  function listMarkup(items, extraClass) {
    return items.map((item) => itemButtonMarkup(item, extraClass)).join('');
  }

  function readCollapsed() {
    try {
      return localStorage.getItem(COLLAPSE_KEY) === '1';
    } catch (_) {
      return false;
    }
  }

  function persistCollapsed(collapsed) {
    try {
      localStorage.setItem(COLLAPSE_KEY, collapsed ? '1' : '0');
    } catch (_) { /* ignore */ }
  }

  function readName() {
    try {
      const v = localStorage.getItem(NAME_KEY);
      return (v && v.trim()) ? v.trim() : '未命名';
    } catch (_) {
      return '未命名';
    }
  }

  function persistName(name) {
    try {
      localStorage.setItem(NAME_KEY, name);
    } catch (_) { /* ignore */ }
  }

  function applyCollapsed(collapsed) {
    document.documentElement.classList.toggle('app-nav-collapsed', !!collapsed);
    $('appNavCollapse')?.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
  }

  function setIconState(btn, state) {
    const img = btn?.querySelector('.app-nav-item-icon');
    const dir = btn?.dataset.iconDir;
    if (!img || !dir) return;
    img.src = iconUrl(dir, state);
  }

  function bindIconStates(btn) {
    if (!btn || btn.dataset.iconBound === '1') return;
    btn.dataset.iconBound = '1';
    btn.addEventListener('mouseenter', () => {
      if (btn.disabled || btn.classList.contains('is-active')) return;
      setIconState(btn, 'mouseOver');
    });
    btn.addEventListener('mouseleave', () => {
      if (btn.disabled) {
        setIconState(btn, 'disabled');
        return;
      }
      setIconState(btn, btn.classList.contains('is-active') ? 'pressed' : 'normal');
    });
    btn.addEventListener('mousedown', () => {
      if (!btn.disabled) setIconState(btn, 'pressed');
    });
    btn.addEventListener('mouseup', () => {
      if (btn.disabled) return;
      setIconState(btn, btn.matches(':hover') ? 'mouseOver' : (btn.classList.contains('is-active') ? 'pressed' : 'normal'));
    });
    const obs = new MutationObserver(() => {
      if (btn.disabled) {
        setIconState(btn, 'disabled');
        return;
      }
      setIconState(btn, btn.classList.contains('is-active') ? 'pressed' : 'normal');
    });
    obs.observe(btn, { attributes: true, attributeFilter: ['class', 'disabled'] });
  }

  function bindAllIconStates(root) {
    root.querySelectorAll('[data-icon-dir]').forEach(bindIconStates);
  }

  function syncJobName() {
    const el = $('appNavJob');
    if (!el) return;
    const job = typeof CharacterCombatPanel !== 'undefined'
      ? CharacterCombatPanel.getState?.()?.jobName
      : '';
    el.textContent = job || '—';
  }

  function syncDisplayName() {
    const el = $('appNavName');
    if (!el || el.tagName === 'INPUT') return;
    el.textContent = readName();
  }

  function startNameEdit() {
    if (buttonsLocked) return;
    const el = $('appNavName');
    if (!el || el.tagName === 'INPUT') return;
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'app-nav-name-input';
    input.id = 'appNavName';
    input.value = readName() === '未命名' ? '' : readName();
    input.maxLength = 12;
    input.setAttribute('aria-label', '角色名稱');
    el.replaceWith(input);
    input.focus();
    input.select();

    const commit = () => {
      const next = input.value.trim() || '未命名';
      persistName(next);
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'app-nav-name';
      btn.id = 'appNavName';
      btn.title = '點擊編輯角色名';
      btn.textContent = next;
      input.replaceWith(btn);
      bindNameEdit(btn);
    };

    input.addEventListener('blur', commit);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        input.blur();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        input.value = readName() === '未命名' ? '' : readName();
        input.blur();
      }
    });
  }

  function bindNameEdit(el) {
    el?.addEventListener('click', (e) => {
      e.preventDefault();
      startNameEdit();
    });
  }

  function buildDom() {
    if ($('appNavSidebar')) return;
    const nav = document.createElement('nav');
    nav.id = 'appNavSidebar';
    nav.className = 'app-nav';
    nav.setAttribute('aria-label', '主選單');
    nav.innerHTML = `
      <header class="app-nav-profile">
        <div class="app-nav-avatar-wrap">
          <div class="app-nav-avatar paperdoll-stage paperdoll-stage--nav" id="appNavAvatar" data-paperdoll="nav" aria-hidden="true"></div>
        </div>
        <div class="app-nav-profile-text">
          <span class="app-nav-job" id="appNavJob">—</span>
          <button type="button" class="app-nav-name" id="appNavName" title="點擊編輯角色名">未命名</button>
        </div>
      </header>
      <hr class="app-nav-divider">
      <div class="app-nav-mode" role="tablist" aria-label="應用模式">
        <button type="button" class="app-nav-mode-btn app-mode-btn" id="btnAppModeSim" role="tab" data-icon-dir="modeSim" aria-selected="true">
          <img class="app-nav-item-icon" src="${iconUrl('modeSim', 'normal')}" alt="" draggable="false" aria-hidden="true">
          <span class="app-nav-item-label">模擬器</span>
        </button>
        <button type="button" class="app-nav-mode-btn app-mode-btn" id="btnAppModeIdle" role="tab" data-icon-dir="modeIdle" aria-selected="false">
          <img class="app-nav-item-icon" src="${iconUrl('modeIdle', 'normal')}" alt="" draggable="false" aria-hidden="true">
          <span class="app-nav-item-label">放置</span>
        </button>
      </div>
      <hr class="app-nav-divider">
      <div class="app-nav-scroll">
        <section class="app-nav-section">
          <h2 class="app-nav-section-title">MAIN</h2>
          <ul class="app-nav-list" id="appNavMainList">
            ${listMarkup(MAIN_ITEMS_BEFORE_CRAFT, 'view-mode-btn')}
            ${listMarkup(MAIN_DRAWER_ITEMS)}
            ${listMarkup(MAIN_ITEMS_AFTER_CRAFT, 'view-mode-btn')}
          </ul>
        </section>
        <hr class="app-nav-divider app-nav-divider--section">
        <section class="app-nav-section" data-sim-only>
          <h2 class="app-nav-section-title">SIMULATOR</h2>
          <ul class="app-nav-list" id="appNavSimList">
            ${listMarkup(SIM_ITEMS, 'view-mode-btn')}
          </ul>
        </section>
        <section class="app-nav-section" data-idle-only>
          <h2 class="app-nav-section-title">MapleIdle</h2>
          <ul class="app-nav-list" id="appNavIdleList">
            ${listMarkup(IDLE_ITEMS)}
          </ul>
        </section>
      </div>
      <footer class="app-nav-footer" data-idle-only>
        <button type="button" class="app-nav-item app-nav-item--danger" id="idleHuntReset" data-icon-dir="idlehuntreset" title="重置放置數據">
          <img class="app-nav-item-icon" src="${iconUrl('idlehuntreset', 'normal')}" alt="" draggable="false" aria-hidden="true">
          <span class="app-nav-item-label">重置放置數據</span>
        </button>
        <div id="idleHuntResetConfirm" class="app-nav-reset-confirm is-hidden">
          <span>確定清除放置模式全部資料？（模擬器不受影響）</span>
          <div class="app-nav-reset-confirm-actions">
            <button type="button" id="idleHuntResetYes" class="idle-hunt-btn idle-hunt-btn--reset">確定重置</button>
            <button type="button" id="idleHuntResetNo" class="idle-hunt-btn idle-hunt-btn--ghost">取消</button>
          </div>
        </div>
      </footer>
      <button type="button" class="app-nav-collapse" id="appNavCollapse" aria-label="收合側欄" aria-expanded="true">‹</button>
    `;
    document.body.insertBefore(nav, document.body.firstChild);
  }

  function refreshProfile() {
    syncJobName();
    syncDisplayName();
  }

  /** BOSS 戰等場景：鎖定側欄可點按鈕（含模式切換／收合） */
  function setButtonsLocked(next) {
    buttonsLocked = !!next;
    const nav = $('appNavSidebar');
    if (!nav) return;
    nav.classList.toggle('is-locked', buttonsLocked);
    nav.setAttribute('aria-disabled', buttonsLocked ? 'true' : 'false');
    nav.querySelectorAll('button').forEach((btn) => {
      btn.disabled = buttonsLocked;
      if (buttonsLocked) {
        setIconState(btn, 'disabled');
      } else if (btn.dataset.iconDir) {
        setIconState(btn, btn.classList.contains('is-active') ? 'pressed' : 'normal');
      }
    });
  }

  function init() {
    if (inited) return;
    inited = true;
    bindAllIconStates($('appNavSidebar'));
    bindNameEdit($('appNavName'));
    syncDisplayName();
    syncJobName();
    applyCollapsed(readCollapsed());
    if (buttonsLocked) setButtonsLocked(true);

    $('appNavCollapse')?.addEventListener('click', (e) => {
      e.preventDefault();
      if (buttonsLocked) return;
      const next = !document.documentElement.classList.contains('app-nav-collapsed');
      applyCollapsed(next);
      persistCollapsed(next);
    });

    if (typeof Paperdoll !== 'undefined') Paperdoll.initNav?.();

    new MutationObserver(() => syncJobName()).observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
  }

  buildDom();

  return {
    init,
    refreshProfile,
    readName,
    setButtonsLocked,
    isButtonsLocked: () => buttonsLocked,
  };
})();

if (typeof window !== 'undefined') {
  window.AppNavSidebar = AppNavSidebar;
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => AppNavSidebar.init());
  } else {
    AppNavSidebar.init();
  }
}
