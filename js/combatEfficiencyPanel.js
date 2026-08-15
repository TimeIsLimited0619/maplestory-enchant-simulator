/**
 * 數值換算表（依 MapleCombat src/core/efficiency.ts 的換算方式）
 * 以目前角色欄位與身上裝備為基準，比較各數值增加指定單位後的戰鬥力增量。
 */
const CombatEfficiencyPanel = (() => {
  const STORAGE_KEY = 'combat.efficiency.v2';
  const DEFAULT_UNIT = 1;

  let inited = false;
  let open = false;
  const state = {
    selectedKey: 'percentMain',
    unit: DEFAULT_UNIT,
  };

  function $(id) {
    return document.getElementById(id);
  }

  function normalizeUnit(value) {
    const n = Number(value);
    return Number.isFinite(n) && n > 0 ? n : DEFAULT_UNIT;
  }

  function load() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      if (typeof saved.selectedKey === 'string') state.selectedKey = saved.selectedKey;
      if (saved.unit != null) state.unit = normalizeUnit(saved.unit);
    } catch (_) { /* ignore invalid saved state */ }
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (_) { /* ignore storage errors */ }
  }

  function buildMetrics(ctx, labels, unit) {
    const category = ctx?.jobCategory || 'normal';
    const includeSecondSub = category === 'xenon' || category === 'dual';
    const isDa = category === 'da';
    const allStatFields = isDa
      ? ['baseSub']
      : includeSecondSub
        ? ['baseMain', 'baseSub', 'baseSubtwo']
        : ['baseMain', 'baseSub'];
    const allStatPercentFields = isDa
      ? ['percentSub']
      : includeSecondSub
        ? ['percentMain', 'percentSub', 'percentSubtwo']
        : ['percentMain', 'percentSub'];
    const metric = (key, label, fieldIds, suffix) => ({
      key,
      label,
      fieldIds,
      suffix: suffix || '',
      unit: normalizeUnit(unit),
    });
    const result = [
      metric('baseMain', labels.main, ['baseMain']),
      metric('percentMain', `${labels.main}%`, ['percentMain'], '%'),
      metric('noApplyMain', `未套用%${labels.main}`, ['noApplyMain']),
      metric('baseSub', labels.sub, ['baseSub']),
      metric('percentSub', `${labels.sub}%`, ['percentSub'], '%'),
      metric('noApplySub', `未套用%${labels.sub}`, ['noApplySub']),
    ];
    if (includeSecondSub) {
      const second = labels.secondSub || '副屬2';
      result.push(
        metric('baseSubtwo', second, ['baseSubtwo']),
        metric('percentSubtwo', `${second}%`, ['percentSubtwo'], '%'),
        metric('noApplySubtwo', `未套用%${second}`, ['noApplySubtwo']),
      );
    }
    result.push(
      metric('allStat', '全屬', allStatFields),
      metric('allStatPercent', '全屬%', allStatPercentFields, '%'),
      metric('atk', labels.main === 'INT' ? '魔法攻擊力' : '攻擊力', ['atk']),
      metric('percentAtk', labels.main === 'INT' ? '魔法攻擊力%' : '攻擊力%', ['percentAtk'], '%'),
      metric('dmg', '傷害', ['dmg'], '%'),
      metric('bossDmg', 'BOSS傷害', ['bossDmg'], '%'),
      metric('critDmg', '爆擊傷害', ['critDmg'], '%'),
    );
    return result;
  }

  function addMetricDelta(baseDelta, metric, amount) {
    const delta = { ...(baseDelta || {}) };
    const add = normalizeUnit(amount);
    metric.fieldIds.forEach((fieldId) => {
      delta[fieldId] = (Number(delta[fieldId]) || 0) + add;
    });
    return delta;
  }

  function calculateResults(pack, metrics, basisUnit) {
    if (!pack || typeof CombatPower === 'undefined') {
      return { basePower: 0, results: metrics.map((metric) => ({ ...metric, gain: 0 })) };
    }
    const basePower = CombatPower.powerValue(
      CombatPower.calculatePower(pack.fields, pack.ctx, pack.delta, {}),
    );
    const results = metrics.map((metric) => {
      const amount = metric.key === state.selectedKey ? basisUnit : 1;
      const changed = CombatPower.powerValue(
        CombatPower.calculatePower(
          pack.fields,
          pack.ctx,
          addMetricDelta(pack.delta, metric, amount),
          {},
        ),
      );
      return { ...metric, probeAmount: amount, gain: changed - basePower };
    });
    return { basePower, results };
  }

  function currentPack() {
    if (typeof CombatPower === 'undefined' || typeof CombatPower.resolveCurrentInputs !== 'function') {
      return null;
    }
    let snapshot = null;
    try {
      if (typeof EquipStatPanel !== 'undefined' && EquipStatPanel.buildSnapshot) {
        snapshot = EquipStatPanel.buildSnapshot();
      }
      if (typeof CharacterCombatPanel !== 'undefined') {
        CharacterCombatPanel.syncToCombatPower?.();
      }
      return CombatPower.resolveCurrentInputs(snapshot);
    } catch (err) {
      console.error('[CombatEfficiencyPanel] resolve', err);
      return null;
    }
  }

  function formatEquivalent(value, suffix) {
    if (!Number.isFinite(value)) return '—';
    const abs = Math.abs(value);
    if (abs > 0 && abs < 0.001) return `${value < 0 ? '>' : '<'}${value < 0 ? '-' : ''}0.001${suffix}`;
    return `${value.toFixed(3)}${suffix}`;
  }

  function formatInteger(value) {
    return Math.floor(Number(value) || 0).toLocaleString('en-US');
  }

  function render() {
    const body = $('cepBody');
    if (!body) return;
    const pack = currentPack();
    const labels = pack?.labels || { main: 'STR', sub: 'DEX', secondSub: '' };
    const basisUnit = normalizeUnit(state.unit);
    const metrics = buildMetrics(pack?.ctx, labels, basisUnit);
    if (!metrics.some((metric) => metric.key === state.selectedKey)) {
      state.selectedKey = metrics[0]?.key || 'baseMain';
    }
    const calculated = calculateResults(pack, metrics, basisUnit);
    const selected = calculated.results.find((metric) => metric.key === state.selectedKey);
    const selectedGain = selected?.gain || 0;
    const options = metrics
      .map((metric) => `<option value="${metric.key}" ${metric.key === state.selectedKey ? 'selected' : ''}>${metric.label}</option>`)
      .join('');

    const rows = calculated.results.map((metric) => {
      const equivalent = metric.key === state.selectedKey
        ? '基準'
        : metric.gain > 0 && selectedGain > 0
          ? formatEquivalent((metric.probeAmount * selectedGain) / metric.gain, metric.suffix)
          : '—';
      const gainText = metric.key === state.selectedKey
        ? (selectedGain > 0 ? `+${formatInteger(selectedGain)}` : '—')
        : (metric.gain > 0 ? `+${formatInteger(metric.gain)}` : '—');
      return `
        <tr>
          <th>${metric.label}</th>
          <td class="${metric.key === state.selectedKey ? 'is-basis' : ''}">${equivalent}</td>
          <td>${gainText}</td>
        </tr>`;
    }).join('');

    body.innerHTML = `
      <div class="cep-controls">
        <label class="cep-basis-label">
          <span class="cep-basis-text">換算基準</span>
          <select id="cepBasis" class="cep-select">${options}</select>
        </label>
        <span class="cep-job">${pack?.ctx?.jobName || '未選擇職業'}</span>
      </div>
      <div class="cep-summary">
        <span class="cep-summary-power">目前戰鬥力：<strong>${calculated.basePower > 0 ? formatInteger(calculated.basePower) : '—'}</strong></span>
        ${selected ? `
          <span class="cep-summary-eq">
            <input id="cepUnit" class="cep-unit" type="number" min="0.001" step="any"
              value="${basisUnit}" aria-label="換算基準計算單位">
            ${selected.label} 等效於：
          </span>` : ''}
      </div>
      ${calculated.basePower > 0
        ? `<div class="cep-table-wrap">
            <table class="cep-table">
              <thead><tr><th>數值</th><th>等效數值</th><th>戰力增加</th></tr></thead>
              <tbody>${rows}</tbody>
            </table>
          </div>`
        : '<p class="cep-empty">請先到「戰力」填入角色基底數值；戰鬥力大於 0 後才會顯示換算結果。</p>'}
      <p class="cep-hint">依戰鬥力公式計算；上方計算單位可調大，避免遊戲向下取整造成單位增量為 0。</p>
    `;
    bindBodyEvents();
  }

  function bindBodyEvents() {
    $('cepBasis')?.addEventListener('change', (event) => {
      state.selectedKey = event.target.value;
      save();
      render();
    });
    const unitInput = $('cepUnit');
    if (!unitInput) return;
    const applyUnit = () => {
      state.unit = normalizeUnit(unitInput.value);
      unitInput.value = String(state.unit);
      save();
      render();
    };
    unitInput.addEventListener('change', applyUnit);
    unitInput.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        applyUnit();
      }
    });
  }

  function ensureDom() {
    if ($('cepRoot')) return;
    const root = document.createElement('div');
    root.id = 'cepRoot';
    root.className = 'cep-root is-hidden';
    root.setAttribute('aria-label', '數值換算表');
    root.innerHTML = `
      <div class="cep-header">
        <span>效益計算機</span>
        <button type="button" id="cepClose" class="panel-wb-close panel-wb-close--inline"
          aria-label="關閉數值換算表" title="關閉"><span aria-hidden="true">×</span></button>
      </div>
      <div id="cepBody" class="cep-body"></div>
    `;
    document.body.appendChild(root);
  }

  function syncMenuButton() {
    $('btnViewEfficiency')?.classList.toggle('is-active', open);
  }

  function setOpen(next) {
    open = !!next;
    const root = $('cepRoot');
    root?.classList.toggle('is-hidden', !open);
    if (open) {
      render();
      if (typeof PanelDrag !== 'undefined') PanelDrag.bringFront(root);
    }
    syncMenuButton();
  }

  function init() {
    if (inited) return;
    load();
    ensureDom();
    inited = true;
    $('btnViewEfficiency')?.addEventListener('click', (event) => {
      event.preventDefault();
      setOpen(!open);
    });
    $('cepClose')?.addEventListener('click', (event) => {
      event.preventDefault();
      setOpen(false);
    });
    if (typeof PanelDrag !== 'undefined') {
      PanelDrag.enable($('cepRoot'), {
        handle: '.cep-header',
        ignoreSelector: '.panel-wb-close, #cepClose, input, select, .cep-table-wrap',
        storageKey: 'ui.drag.efficiencyPanel',
        title: '拖曳數值換算表',
      });
    }
    render();
  }

  return {
    init,
    refresh() {
      if (inited) render();
    },
    setOpen,
    toggle() { setOpen(!open); },
    isOpen: () => open,
    buildMetrics,
    calculateResults,
  };
})();

if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => CombatEfficiencyPanel.init());
}
