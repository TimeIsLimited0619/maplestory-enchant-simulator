/**
 * 存檔備份側欄：綁定本機檔、匯出／匯入（清瀏覽器後可還原）
 */
const SaveBackupPanel = (() => {
  let inited = false;
  let open = false;
  let status = {
    supports: false,
    bound: false,
    hasHandle: false,
    fileName: '',
    lastWriteAt: 0,
    profile: 'sim',
  };

  function $(id) {
    return document.getElementById(id);
  }

  function escapeHtml(text) {
    return String(text || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function formatTime(ts) {
    const n = Number(ts) || 0;
    if (!n) return '尚未寫入';
    try {
      return new Date(n).toLocaleString('zh-TW', { hour12: false });
    } catch (_) {
      return String(n);
    }
  }

  function profileLabel(profile) {
    return profile === 'idle' ? '放置' : '模擬器';
  }

  function panelMarkup() {
    return `<div id="saveBackupPanel" class="save-backup-panel" role="dialog" aria-labelledby="saveBackupTitle" aria-hidden="true">
      <div class="save-backup-head">
        <span id="saveBackupTitle">存檔備份</span>
        <button type="button" id="saveBackupClose" class="save-backup-nav">關閉</button>
      </div>
      <div id="saveBackupBody" class="save-backup-body"></div>
      <input type="file" id="saveBackupImportFile" accept=".mss,.json,application/json" hidden>
    </div>`;
  }

  function ensureDom() {
    let panel = $('saveBackupPanel');
    const nav = $('appNavSidebar');
    if (!panel) {
      if (nav) nav.insertAdjacentHTML('afterend', panelMarkup());
      else document.body.insertAdjacentHTML('beforeend', panelMarkup());
      panel = $('saveBackupPanel');
    } else if (nav && panel.previousElementSibling !== nav && panel.nextElementSibling !== nav) {
      // keep near nav; jobChange may sit between — leave as-is if already in body
    }
    return panel;
  }

  function syncChrome() {
    const panel = $('saveBackupPanel');
    panel?.classList.toggle('is-open', open);
    panel?.setAttribute('aria-hidden', open ? 'false' : 'true');
    $('btnViewSaveBackup')?.classList.toggle('is-active', open);
  }

  async function refreshStatus() {
    if (typeof SessionPersistenceModule === 'undefined'
      || typeof SessionPersistenceModule.getBackupStatus !== 'function') {
      status = {
        supports: false,
        bound: false,
        hasHandle: false,
        fileName: '',
        lastWriteAt: 0,
        profile: 'sim',
      };
      return status;
    }
    status = await SessionPersistenceModule.getBackupStatus();
    return status;
  }

  function bodyMarkup() {
    const s = status;
    const boundLine = s.bound
      ? `已綁定：${escapeHtml(s.fileName || '（未知名稱）')}`
      : '尚未綁定本機備份檔';
    const writeLine = `上次寫入：${escapeHtml(formatTime(s.lastWriteAt))}`;
    const modeLine = `目前模式：${escapeHtml(profileLabel(s.profile))}`;

    let bindSection = '';
    if (s.supports) {
      bindSection = `
        <section class="save-backup-section" aria-label="本機自動備份">
          <h3 class="save-backup-section-title">本機自動備份</h3>
          <p class="save-backup-hint">綁定後會定期覆寫備份（.mss）。檔案不含楓幣；消耗欄只保留藥水（方塊／卷軸等不進檔）。清瀏覽器後可用此檔還原。</p>
          <div class="save-backup-actions">
            <button type="button" class="save-backup-btn" data-action="bind">${s.bound ? '重新綁定' : '綁定本機備份檔'}</button>
            <button type="button" class="save-backup-btn" data-action="unbind" ${s.bound ? '' : 'disabled'}>解除綁定</button>
            <button type="button" class="save-backup-btn save-backup-btn--primary" data-action="flush" ${s.bound ? '' : 'disabled'}>立即寫入備份</button>
            <button type="button" class="save-backup-btn" data-action="load-bound" ${s.bound ? '' : 'disabled'}>從綁定檔讀回</button>
          </div>
        </section>`;
    } else {
      bindSection = `
        <section class="save-backup-section" aria-label="本機自動備份">
          <h3 class="save-backup-section-title">本機自動備份</h3>
          <p class="save-backup-hint">此瀏覽器不支援自動寫入本機檔（建議 Chrome／Edge）。請改用下方「匯出存檔」定期下載備份。</p>
        </section>`;
    }

    return `
      <section class="save-backup-section" aria-label="狀態">
        <h3 class="save-backup-section-title">狀態</h3>
        <ul class="save-backup-status">
          <li>${modeLine}</li>
          <li>${boundLine}</li>
          <li>${writeLine}</li>
        </ul>
        ${s.bound ? '' : '<p class="save-backup-warn">未綁定時，清理瀏覽器／網站資料可能遺失進度。</p>'}
      </section>
      ${bindSection}
      <section class="save-backup-section" aria-label="匯出匯入">
        <h3 class="save-backup-section-title">匯出／匯入</h3>
        <p class="save-backup-hint">匯出為 .mss（不會被自動備份覆蓋）。不含楓幣；消耗欄僅藥水。匯入會覆蓋裝備／進度等；新檔不含的楓幣與非藥水消耗不會從檔案還原。</p>
        <div class="save-backup-actions">
          <button type="button" class="save-backup-btn save-backup-btn--primary" data-action="export">匯出存檔</button>
          <button type="button" class="save-backup-btn" data-action="import">匯入存檔</button>
        </div>
      </section>`;
  }

  async function render() {
    ensureDom();
    syncChrome();
    if (!open) return;
    await refreshStatus();
    const body = $('saveBackupBody');
    if (body) body.innerHTML = bodyMarkup();
  }

  async function confirmImport() {
    const confirmFn = typeof showAppConfirm === 'function'
      ? showAppConfirm
      : ({ message }) => Promise.resolve(window.confirm(message));
    return confirmFn({
      title: '匯入存檔',
      message: '匯入存檔會覆蓋目前的背包、強化進度與成本統計，以及清除消耗欄藥水以外的所有道具，確定要繼續嗎？',
      confirmText: '確定匯入',
      cancelText: '取消',
    });
  }

  async function onAction(action) {
    const SPM = typeof SessionPersistenceModule !== 'undefined' ? SessionPersistenceModule : null;
    if (!SPM) {
      if (typeof addLog === 'function') addLog('[存檔] 存檔模組尚未載入。', 'log-fail');
      return;
    }

    try {
      if (action === 'bind') {
        await SPM.bindBackupFile();
        if (typeof addLog === 'function') addLog('[存檔] 已綁定本機備份檔並寫入一次。', 'log-success');
      } else if (action === 'unbind') {
        await SPM.unbindBackupFile();
        if (typeof addLog === 'function') addLog('[存檔] 已解除本機備份綁定。', 'log-info');
      } else if (action === 'flush') {
        SPM.saveToStorage();
        const ok = await SPM.writeBackupFileNow({ force: true });
        if (typeof addLog === 'function') {
          addLog(ok ? '[存檔] 已立即寫入本機備份。' : '[存檔] 寫入失敗或尚未綁定。', ok ? 'log-success' : 'log-fail');
        }
      } else if (action === 'load-bound') {
        const ok = await confirmImport();
        if (!ok) return;
        await SPM.loadFromBoundBackupFile();
        if (typeof addLog === 'function') addLog('[存檔] 已從綁定備份檔讀回。', 'log-success');
      } else if (action === 'export') {
        SPM.exportSaveToFile();
      } else if (action === 'import') {
        $('saveBackupImportFile')?.click();
        return;
      }
    } catch (err) {
      if (err?.name === 'AbortError') return;
      console.warn('[SaveBackupPanel]', err);
      if (typeof addLog === 'function') {
        addLog(`[存檔] ${err?.message || '操作失敗'}`, 'log-fail');
      }
    }
    await render();
  }

  async function onImportFile(event) {
    const input = event.target;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    const ok = await confirmImport();
    if (!ok) return;
    try {
      if (typeof SessionPersistenceModule === 'undefined') {
        throw new Error('存檔模組未載入');
      }
      await SessionPersistenceModule.importSaveFromFile(file);
      if (typeof addLog === 'function') addLog('[存檔] 已匯入存檔。', 'log-success');
      await render();
    } catch (err) {
      console.warn('[SaveBackupPanel] 匯入失敗:', err);
      if (typeof addLog === 'function') {
        addLog(`[存檔] 匯入失敗：${err?.message || '無法讀取檔案'}`, 'log-fail');
      }
    }
  }

  function setOpen(next) {
    open = !!next;
    if (open) {
      if (typeof JobChangePanel !== 'undefined') JobChangePanel.setOpen?.(false);
      if (typeof EquipCraftPanel !== 'undefined') EquipCraftPanel.setOpen?.(false);
      if (typeof DisassemblePanel !== 'undefined') DisassemblePanel.setOpen?.(false);
      if (typeof IdleSessionRefresh !== 'undefined') IdleSessionRefresh.setPanelOpen?.(false);
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
    $('btnViewSaveBackup')?.addEventListener('click', (e) => {
      e.preventDefault();
      toggle();
    });
    $('saveBackupClose')?.addEventListener('click', (e) => {
      e.preventDefault();
      setOpen(false);
    });
    $('saveBackupBody')?.addEventListener('click', (e) => {
      const btn = e.target.closest?.('[data-action]');
      if (!btn || btn.disabled) return;
      e.preventDefault();
      onAction(btn.getAttribute('data-action') || '');
    });
    $('saveBackupImportFile')?.addEventListener('change', onImportFile);
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
  window.SaveBackupPanel = SaveBackupPanel;
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => SaveBackupPanel.init());
  } else {
    SaveBackupPanel.init();
  }
}
