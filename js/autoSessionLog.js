/**
 * 自動洗裝／強化結構化紀錄
 */
const AUTO_SESSION_LOG_KEY = 'mss-auto-session-log-v1';
const AUTO_SESSION_LOG_MAX = 200;

const AutoSessionLogModule = {
  entries: [],
  _active: null,
  inited: false,

  init() {
    if (this.inited) return;
    this.inited = true;
    this.load();
  },

  load() {
    try {
      const raw = localStorage.getItem(AUTO_SESSION_LOG_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      this.entries = Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      console.warn('[AutoSessionLog]', err);
      this.entries = [];
    }
  },

  save() {
    try {
      localStorage.setItem(AUTO_SESSION_LOG_KEY, JSON.stringify(this.entries.slice(0, AUTO_SESSION_LOG_MAX)));
    } catch (err) {
      console.warn('[AutoSessionLog] save', err);
    }
  },

  cloneUsageSnapshot() {
    if (typeof CostTrackerModule === 'undefined') {
      return { usage: {}, starStats: {} };
    }
    const payload = CostTrackerModule.getSavePayload?.() || {};
    return {
      usage: JSON.parse(JSON.stringify(payload.usage || {})),
      starStats: JSON.parse(JSON.stringify(payload.starStats || {})),
    };
  },

  diffUsage(before, after) {
    const delta = { cube: {}, addCube: {}, bonusStatItems: {}, exceptional: {}, scalar: {} };
    const bU = before?.usage || {};
    const aU = after?.usage || {};
    const bS = before?.starStats || {};
    const aS = after?.starStats || {};

    Object.keys(aU).forEach((key) => {
      if (key === 'cube' || key === 'addCube' || key === 'bonusStatItems' || key === 'exceptional') return;
      const diff = (Number(aU[key]) || 0) - (Number(bU[key]) || 0);
      if (diff) delta.scalar[key] = diff;
    });

    ['cube', 'addCube', 'bonusStatItems', 'exceptional'].forEach((mapKey) => {
      const dest = delta[mapKey];
      const allKeys = new Set([
        ...Object.keys(bU[mapKey] || {}),
        ...Object.keys(aU[mapKey] || {}),
      ]);
      allKeys.forEach((id) => {
        const diff = (Number(aU[mapKey]?.[id]) || 0) - (Number(bU[mapKey]?.[id]) || 0);
        if (diff) dest[id] = diff;
      });
    });

    Object.keys(aS).forEach((key) => {
      const diff = (Number(aS[key]) || 0) - (Number(bS[key]) || 0);
      if (diff) delta.scalar[`star:${key}`] = diff;
    });

    return delta;
  },

  estimateCostFromDelta(delta) {
    if (!delta || typeof CostTrackerModule === 'undefined') return 0;
    let total = 0;

    Object.entries(delta.scalar || {}).forEach(([key, count]) => {
      if (key === 'star:mesoSpent' || key === 'bonusStatMeso' || key === 'addPotentialMeso') {
        total += Number(count) || 0;
        return;
      }
      if (key === 'star:starNormal') {
        total += CostTrackerModule.getLineSubtotal('starNormal', count, CostTrackerModule.prices?.starNormal);
      }
    });

    Object.entries(delta.cube || {}).forEach(([id, count]) => {
      total += CostTrackerModule.getLineSubtotal(`cube:${id}`, count, CostTrackerModule.prices?.[`cube:${id}`]);
    });
    Object.entries(delta.addCube || {}).forEach(([id, count]) => {
      total += CostTrackerModule.getLineSubtotal(`addCube:${id}`, count, CostTrackerModule.prices?.[`addCube:${id}`]);
    });
    Object.entries(delta.bonusStatItems || {}).forEach(([id, count]) => {
      total += CostTrackerModule.getLineSubtotal(`bonusStatItem:${id}`, count, CostTrackerModule.prices?.[`bonusStatItem:${id}`]);
    });
    Object.entries(delta.exceptional || {}).forEach(([id, count]) => {
      total += CostTrackerModule.getLineSubtotal(`exceptional:${id}`, count, CostTrackerModule.prices?.[`exceptional:${id}`]);
    });

    return total;
  },

  beginSession(meta) {
    this.init();
    this._active = {
      ...meta,
      startedAt: Date.now(),
      usageBefore: this.cloneUsageSnapshot(),
    };
  },

  endSession(result) {
    if (!this._active) return;
    const usageAfter = this.cloneUsageSnapshot();
    const costDelta = this.diffUsage(this._active.usageBefore, usageAfter);
    const estimatedCost = this.estimateCostFromDelta(costDelta);

    const entry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      ts: new Date().toISOString(),
      durationMs: Date.now() - (this._active.startedAt || Date.now()),
      module: this._active.module || 'unknown',
      itemId: this._active.itemId || '',
      itemName: this._active.itemName || '',
      outcome: result?.outcome || 'unknown',
      attempts: Number(result?.attempts) || 0,
      targetHit: !!result?.targetHit,
      cancelled: !!result?.cancelled,
      detail: { ...(this._active.detail || {}), ...(result?.detail || {}) },
      costDelta,
      estimatedCost,
    };

    this.entries.unshift(entry);
    if (this.entries.length > AUTO_SESSION_LOG_MAX) {
      this.entries.length = AUTO_SESSION_LOG_MAX;
    }
    this.save();
    this._active = null;

    if (typeof EnchantToolsPanel !== 'undefined') {
      EnchantToolsPanel.refreshLog?.();
    }
  },

  clear() {
    this.entries = [];
    this.save();
    if (typeof EnchantToolsPanel !== 'undefined') EnchantToolsPanel.refreshLog?.();
  },

  formatOutcome(outcome) {
    const map = {
      success: '達標',
      manual: '待選擇',
      cancel: '取消',
      fail: '未達標',
    };
    return map[outcome] || outcome;
  },

  formatEntryLine(entry) {
    const time = entry.ts ? new Date(entry.ts).toLocaleString() : '';
    const cost = entry.estimatedCost > 0
      ? (typeof formatMesoParts === 'function' ? formatMesoParts(entry.estimatedCost) : entry.estimatedCost)
      : '0';
    return `[${time}] ${entry.itemName || entry.itemId} · ${entry.module} · ${this.formatOutcome(entry.outcome)} · ${entry.attempts}次 · 成本${cost}`;
  },

  toCsv() {
    const header = ['時間', '模組', '裝備', '結果', '次數', '達標', '取消', '估算成本', '備註'];
    const rows = this.entries.map((e) => [
      e.ts,
      e.module,
      e.itemName || e.itemId,
      this.formatOutcome(e.outcome),
      e.attempts,
      e.targetHit ? 'Y' : 'N',
      e.cancelled ? 'Y' : 'N',
      Math.round(e.estimatedCost || 0),
      JSON.stringify(e.detail || {}),
    ]);
    return [header, ...rows].map((row) => row.map((cell) => {
      const s = String(cell ?? '');
      return s.includes(',') || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s;
    }).join(',')).join('\n');
  },

  async copyText() {
    const text = this.entries.map((e) => this.formatEntryLine(e)).join('\n');
    if (!text) return false;
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    return false;
  },

  exportCsvFile() {
    const csv = this.toCsv();
    const blob = new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mss-session-log-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  },
};

function aeSessionLogBegin(meta) {
  AutoSessionLogModule?.beginSession?.(meta);
}

function aeSessionLogEnd(result) {
  AutoSessionLogModule?.endSession?.(result);
}

function aeSessionLogItemMeta(item) {
  if (!item) return { itemId: '', itemName: '' };
  return {
    itemId: item.itemId || item.id || '',
    itemName: item.name || item.itemId || '',
  };
}

function aeSessionLogResolveOutcome(ctx) {
  if (ctx.cancelled) return 'cancel';
  if (ctx.targetHit) return 'success';
  if (ctx.stoppedForManualPick || ctx.stoppedForRankUp || ctx.hexaReady) return 'manual';
  return 'fail';
}
