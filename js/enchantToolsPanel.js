/**
 * 工具面板：洗裝紀錄、期望試算、分享碼
 */
const EnchantToolsPanel = {
  isOpen: false,
  tab: 'log',
  inited: false,

  init() {
    if (this.inited) return;
    this.inited = true;
    AutoSessionLogModule?.init?.();

    document.getElementById('btnViewTools')?.addEventListener('click', (e) => {
      e.preventDefault();
      this.setOpen(!this.isOpen);
    });
    document.getElementById('enchantToolsClose')?.addEventListener('click', (e) => {
      e.preventDefault();
      this.setOpen(false);
    });

    document.querySelectorAll('[data-etp-tab]').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.tab = btn.getAttribute('data-etp-tab') || 'log';
        this.syncTabs();
        this.render();
      });
    });

    document.getElementById('etpLogClear')?.addEventListener('click', () => {
      if (window.confirm('確定清空所有洗裝紀錄？')) AutoSessionLogModule.clear();
    });
    document.getElementById('etpLogCopy')?.addEventListener('click', async () => {
      const ok = await AutoSessionLogModule.copyText();
      addLog(ok ? '📋 已複製洗裝紀錄' : '⚠️ 無紀錄可複製', ok ? 'log-success' : 'log-fail');
    });
    document.getElementById('etpLogExport')?.addEventListener('click', () => {
      AutoSessionLogModule.exportCsvFile();
    });

    document.getElementById('etpExpectRefresh')?.addEventListener('click', () => this.renderExpect());
    document.getElementById('etpShareGenerate')?.addEventListener('click', () => this.handleGenerateShare());
    document.getElementById('etpShareImport')?.addEventListener('click', () => this.handleImportShare());
    document.getElementById('etpShareCopy')?.addEventListener('click', () => this.handleCopyShare());

    if (typeof PanelDrag !== 'undefined') {
      PanelDrag.enable(document.getElementById('enchantToolsPanel'), {
        handle: '.enchant-tools-header',
        ignoreSelector: '.panel-wb-close, #enchantToolsClose, button, input, textarea, select',
        storageKey: 'ui.drag.enchantTools',
        title: '拖曳工具面板',
      });
    }

    this.setOpen(false);
  },

  syncMenuButton() {
    document.getElementById('btnViewTools')?.classList.toggle('is-active', this.isOpen);
  },

  syncTabs() {
    document.querySelectorAll('[data-etp-tab]').forEach((btn) => {
      btn.classList.toggle('is-active', btn.getAttribute('data-etp-tab') === this.tab);
    });
    document.querySelectorAll('[data-etp-pane]').forEach((pane) => {
      pane.classList.toggle('is-hidden', pane.getAttribute('data-etp-pane') !== this.tab);
    });
  },

  setOpen(next) {
    this.isOpen = !!next;
    const root = document.getElementById('enchantToolsPanel');
    root?.classList.toggle('is-hidden', !this.isOpen);
    root?.setAttribute('aria-hidden', this.isOpen ? 'false' : 'true');
    if (this.isOpen) {
      this.render();
      if (typeof PanelDrag !== 'undefined') PanelDrag.bringFront(root);
    }
    this.syncMenuButton();
  },

  render() {
    this.syncTabs();
    if (this.tab === 'log') this.renderLog();
    else if (this.tab === 'expect') this.renderExpect();
    else if (this.tab === 'share') this.renderShare();
  },

  refreshLog() {
    if (this.tab === 'log' && this.isOpen) this.renderLog();
  },

  renderLog() {
    const box = document.getElementById('etpLogList');
    if (!box) return;
    const entries = AutoSessionLogModule.entries || [];
    if (!entries.length) {
      box.innerHTML = '<p class="etp-muted">尚無自動洗裝紀錄。開啟自動重設／自動強化後，結束時會記錄於此。</p>';
      return;
    }
    box.innerHTML = entries.map((e) => {
      const cost = e.estimatedCost > 0 && typeof formatMesoParts === 'function'
        ? formatMesoParts(e.estimatedCost)
        : String(Math.round(e.estimatedCost || 0));
      const time = e.ts ? new Date(e.ts).toLocaleString() : '';
      const detail = e.detail?.cubeName || e.detail?.targetStar != null
        ? `<span class="etp-log-sub">${e.detail.cubeName || ''}${e.detail.targetStar != null ? ` → ★${e.detail.targetStar}` : ''}</span>`
        : '';
      return `
        <div class="etp-log-item">
          <div class="etp-log-head">
            <span class="etp-log-outcome etp-log-outcome--${e.outcome}">${AutoSessionLogModule.formatOutcome(e.outcome)}</span>
            <span class="etp-log-meta">${time}</span>
          </div>
          <div class="etp-log-body">
            <strong>${e.itemName || e.itemId || '（裝備）'}</strong>
            · ${e.module} · ${e.attempts} 次 · 成本 ${cost}
            ${detail}
          </div>
        </div>
      `;
    }).join('');
  },

  renderExpect() {
    const box = document.getElementById('etpExpectBody');
    if (!box || typeof ExpectedCostCalc === 'undefined') return;
    box.innerHTML = '<p class="etp-muted">計算中…</p>';
    window.setTimeout(() => {
      try {
        const result = ExpectedCostCalc.calcForCurrentContext();
        box.innerHTML = ExpectedCostCalc.renderResultHtml(result);
      } catch (err) {
        box.innerHTML = `<p class="etp-muted">試算失敗：${err?.message || err}</p>`;
      }
    }, 0);
  },

  renderShare() {
    const hint = document.getElementById('etpShareHint');
    if (!hint) return;
    const hasEquip = typeof currentEnchantItem !== 'undefined' && !!currentEnchantItem;
    hint.textContent = hasEquip
      ? `目前裝備：${currentEnchantItem.name || currentEnchantItem.itemId}`
      : '請先放置裝備後再產生分享碼。';
  },

  async handleGenerateShare() {
    const input = document.getElementById('etpShareCode');
    if (!input) return;
    const payload = buildEquipSharePayload({
      includeAuto: document.getElementById('etpShareIncludeAuto')?.checked !== false,
      includePrices: document.getElementById('etpShareIncludePrices')?.checked === true,
    });
    if (!payload) {
      addLog('⚠️ 請先放置裝備。', 'log-fail');
      return;
    }
    try {
      input.value = await encodeShareCode(payload);
      addLog('🔗 已產生分享碼', 'log-success');
    } catch (err) {
      addLog(`⚠️ 分享碼產生失敗：${err?.message || err}`, 'log-fail');
    }
  },

  async handleCopyShare() {
    const input = document.getElementById('etpShareCode');
    const code = input?.value?.trim();
    if (!code) {
      addLog('⚠️ 請先產生分享碼', 'log-fail');
      return;
    }
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(code);
      addLog('📋 已複製分享碼', 'log-success');
    }
  },

  async handleImportShare() {
    const input = document.getElementById('etpShareCode');
    const code = input?.value?.trim();
    if (!code) {
      addLog('⚠️ 請貼上分享碼', 'log-fail');
      return;
    }
    if (!window.confirm('匯入分享碼會載入該裝備狀態（並可選套用自動重設目標），確定繼續？')) return;

    try {
      const result = await importShareCode(code, {
        applyAuto: document.getElementById('etpShareApplyAuto')?.checked !== false,
      });
      addLog(`✅ 已匯入：${result.itemName}`, 'log-success');
      this.renderShare();
      this.renderExpect();
    } catch (err) {
      addLog(`⚠️ 分享碼匯入失敗：${err?.message || err}`, 'log-fail');
    }
  },
};

if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => EnchantToolsPanel.init());
}
