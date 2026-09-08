/**
 * 自由轉職側欄：消耗顯示、職業清單、確認後安全轉職。
 */
const JobChangePanel = (() => {
  let inited = false;
  let open = false;

  const LINE_ICONS = {
    warrior: 'images/skills/112/1120003.png',
    mage: 'images/skills/222/2221005.png',
    magef: 'images/skills/212/2121005.png',
    mercedes: 'images/skills/2312/23121000.png',
  };

  const MESO_ICON = 'images/npcshop/PointInfo__Meso__iconShop.png';

  function $(id) {
    return document.getElementById(id);
  }

  function formatMeso(n) {
    const v = Math.max(0, Math.floor(Number(n) || 0));
    if (typeof formatMesoAmount === 'function') {
      return formatMesoAmount(v).replace(/\s*楓幣\s*$/, '');
    }
    return v.toLocaleString('zh-TW');
  }

  function escapeHtml(text) {
    return String(text || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function costMeta() {
    if (typeof CharacterSkills === 'undefined' || !CharacterSkills.getJobChangeCost) {
      return { meso: 0, etcId: '', etcAmount: 0 };
    }
    return CharacterSkills.getJobChangeCost();
  }

  function etcCatalog(id) {
    if (typeof IdleEtcStore !== 'undefined') return IdleEtcStore.get(id);
    return null;
  }

  function heldEtc(id) {
    if (!id || typeof InventoryModule === 'undefined') return 0;
    return Math.max(0, Math.floor(Number(InventoryModule.countEtc?.(id)) || 0));
  }

  function heldMeso() {
    if (typeof getIdleHeldMeso === 'function') return getIdleHeldMeso();
    return 0;
  }

  function panelMarkup() {
    return `<div id="jobChangePanel" class="job-change-panel" role="dialog" aria-labelledby="jobChangeTitle" aria-hidden="true">
      <div class="job-change-head">
        <span id="jobChangeTitle">自由轉職</span>
        <button type="button" id="jobChangeClose" class="job-change-nav">關閉</button>
      </div>
      <div id="jobChangeBody" class="job-change-body"></div>
    </div>`;
  }

  function ensureDom() {
    let panel = $('jobChangePanel');
    const nav = $('appNavSidebar');
    if (!panel) {
      if (nav) nav.insertAdjacentHTML('afterend', panelMarkup());
      else document.body.insertAdjacentHTML('beforeend', panelMarkup());
      panel = $('jobChangePanel');
    } else if (nav && panel.previousElementSibling !== nav) {
      panel.remove();
      nav.insertAdjacentElement('afterend', panel);
    }
    return panel;
  }

  function syncChrome() {
    const panel = $('jobChangePanel');
    panel?.classList.toggle('is-open', open);
    panel?.setAttribute('aria-hidden', open ? 'false' : 'true');
    $('btnViewJobChange')?.classList.toggle('is-active', open);
  }

  function costSectionMarkup() {
    const cost = costMeta();
    const etc = etcCatalog(cost.etcId);
    const etcName = etc?.name || cost.etcId || '轉職材料';
    const etcIcon = etc?.icon || 'images/menubtn/job/normal/0.png';
    const etcHave = heldEtc(cost.etcId);
    const etcNeed = cost.etcAmount;
    const mesoHave = heldMeso();
    const mesoNeed = cost.meso;
    const etcOk = etcHave >= etcNeed;
    const mesoOk = (typeof isIdlePlayMode === 'function' && !isIdlePlayMode())
      || mesoHave >= mesoNeed;

    return `<section class="job-change-cost" aria-label="轉職消耗">
      <h3 class="job-change-section-title">轉職消耗</h3>
      <ul class="job-change-cost-list">
        <li class="job-change-cost-item ${etcOk ? 'is-ok' : 'is-short'}">
          <img class="job-change-cost-item__icon" src="${etcIcon}" alt="" draggable="false" onerror="this.style.opacity='0.3'">
          <span class="job-change-cost-item__label">${escapeHtml(etcName)}</span>
          <span class="job-change-cost-item__qty">${etcHave.toLocaleString('zh-TW')} / ${etcNeed.toLocaleString('zh-TW')}</span>
        </li>
        <li class="job-change-cost-item ${mesoOk ? 'is-ok' : 'is-short'}">
          <img class="job-change-cost-item__icon" src="${MESO_ICON}" alt="" draggable="false" onerror="this.style.opacity='0.3'">
          <span class="job-change-cost-item__label">楓幣</span>
          <span class="job-change-cost-item__qty">${formatMeso(mesoHave)} / ${formatMeso(mesoNeed)}</span>
        </li>
      </ul>
      <p class="job-change-hint">轉職會清空技能點、快捷列與 AP，並依新職業主屬重配。等級、裝備與背包會保留。</p>
    </section>`;
  }

  function jobListMarkup() {
    const lines = typeof CharacterSkills !== 'undefined' && CharacterSkills.listJobLines
      ? CharacterSkills.listJobLines()
      : [];
    const current = typeof CharacterSkills !== 'undefined'
      ? CharacterSkills.getCurrentJobLineKey?.() || ''
      : '';

    if (!lines.length) {
      return `<section class="job-change-jobs">
        <h3 class="job-change-section-title">可選職業</h3>
        <div class="job-change-empty">尚無可轉職職業。</div>
      </section>`;
    }

    const rows = lines.map((line) => {
      const key = String(line.key || line.id || '');
      const isCurrent = key === current;
      const icon = LINE_ICONS[key] || 'images/menubtn/job/normal/0.png';
      const meta = isCurrent ? '目前職業' : '點擊選擇轉職';
      return `<button type="button" class="job-change-row${isCurrent ? ' is-current' : ''}" data-action="pick-job" data-job-line="${escapeHtml(key)}" ${isCurrent ? 'disabled' : ''}>
        <img class="job-change-row__icon" src="${icon}" alt="" draggable="false" onerror="this.style.opacity='0.3'">
        <span class="job-change-row__text">
          <span class="job-change-row__name">${escapeHtml(line.name || key)}</span>
          <span class="job-change-row__meta">${meta}</span>
        </span>
      </button>`;
    }).join('');

    return `<section class="job-change-jobs">
      <h3 class="job-change-section-title">可選職業</h3>
      <div class="job-change-list">${rows}</div>
    </section>`;
  }

  function render() {
    ensureDom();
    syncChrome();
    const body = $('jobChangeBody');
    if (!body) return;
    if (!open) return;
    body.innerHTML = `${costSectionMarkup()}${jobListMarkup()}`;
  }

  function failMessage(reason) {
    switch (reason) {
      case 'in_combat':
        return '戰鬥中無法轉職，請先停止狩獵／離開 BOSS 戰。';
      case 'cannot_afford':
      case 'spend_fail':
        return '材料或楓幣不足，無法轉職。';
      case 'need_first_pick':
        return '請先完成初次職業選擇後再使用自由轉職。';
      case 'same_job':
        return '已是此職業，無需轉職。';
      case 'invalid_job':
        return '無效的職業選項。';
      default:
        return '轉職失敗，請稍後再試。';
    }
  }

  function onPickJob(lineKey) {
    const key = String(lineKey || '').trim();
    if (!key || typeof CharacterSkills === 'undefined') return;

    if (CharacterSkills.isJobChangeCombatBusy?.()) {
      if (typeof addLog === 'function') addLog(`[自由轉職] ${failMessage('in_combat')}`, 'log-fail');
      return;
    }
    if (!CharacterSkills.canAffordJobChange?.()) {
      if (typeof addLog === 'function') addLog(`[自由轉職] ${failMessage('cannot_afford')}`, 'log-fail');
      render();
      return;
    }

    const lines = CharacterSkills.listJobLines?.() || [];
    const line = lines.find((row) => String(row.key || row.id) === key);
    const label = line?.name || key;

    const confirmFn = typeof showAppConfirm === 'function'
      ? showAppConfirm
      : ({ message }) => Promise.resolve(window.confirm(message));

    confirmFn({
      title: '確認自由轉職',
      message: `確定要轉職為【${label}】嗎？\n技能點、快捷列與 AP 將被重置，此操作無法復原。`,
      confirmText: '確定轉職',
      cancelText: '取消',
    }).then((ok) => {
      if (!ok) return;
      const result = CharacterSkills.changeJobLineSafely?.(key) || { ok: false, reason: 'apply_fail' };
      if (!result.ok) {
        if (typeof addLog === 'function') {
          addLog(`[自由轉職] ${failMessage(result.reason)}`, 'log-fail');
        }
        render();
        return;
      }
      if (typeof addLog === 'function') {
        addLog(`[自由轉職] 已轉職為【${label}】。`, 'log-success');
      }
      if (typeof IdleHunt !== 'undefined') IdleHunt.refreshDisplay?.();
      render();
    });
  }

  function setOpen(next) {
    open = !!next;
    if (open) {
      if (typeof EquipCraftPanel !== 'undefined') EquipCraftPanel.setOpen?.(false);
      if (typeof DisassemblePanel !== 'undefined') DisassemblePanel.setOpen?.(false);
      if (typeof IdleHunt !== 'undefined' && typeof IdleHunt.setPickerOpen === 'function') {
        IdleHunt.setPickerOpen(false);
      }
      if (typeof IdleDungeon !== 'undefined') IdleDungeon.setOpen?.(false);
      if (typeof IdleBoss !== 'undefined') IdleBoss.closeAll?.();
    }
    render();
  }

  function toggle() {
    setOpen(!open);
  }

  function bindEvents() {
    $('btnViewJobChange')?.addEventListener('click', (e) => {
      e.preventDefault();
      toggle();
    });

    $('jobChangeClose')?.addEventListener('click', (e) => {
      e.preventDefault();
      setOpen(false);
    });

    $('jobChangeBody')?.addEventListener('click', (e) => {
      const row = e.target.closest?.('[data-action="pick-job"]');
      if (!row || row.disabled) return;
      e.preventDefault();
      onPickJob(row.getAttribute('data-job-line') || '');
    });
  }

  function init() {
    if (inited) return;
    inited = true;
    ensureDom();
    bindEvents();
    syncChrome();
  }

  return {
    init,
    setOpen,
    toggle,
    isOpen: () => open,
    refresh: () => { if (open) render(); },
  };
})();

if (typeof window !== 'undefined') {
  window.JobChangePanel = JobChangePanel;
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => JobChangePanel.init());
  } else {
    JobChangePanel.init();
  }
}
