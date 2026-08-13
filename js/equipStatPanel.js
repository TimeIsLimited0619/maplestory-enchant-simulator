/**
 * 身上裝備屬性統計面板（陽春驗證版）
 * 沿用 EquipTooltipModule.buildStatSegments，另列卓越／靈魂／潛能
 */
const EquipStatPanel = (() => {
  const MAIN_KEYS = [
    { key: 'str', label: 'STR' },
    { key: 'dex', label: 'DEX' },
    { key: 'int', label: 'INT' },
    { key: 'luk', label: 'LUK' },
    { key: 'hp', label: '最大HP' },
    { key: 'mp', label: '最大MP' },
    { key: 'atk', label: '攻擊力' },
    { key: 'matk', label: '魔法攻擊力' },
    { key: 'def', label: '防禦力' },
    { key: 'mdef', label: '魔法防禦力' },
  ];

  const MAIN_LABEL_SET = new Set(MAIN_KEYS.map((x) => x.label));

  const IED_LABEL_RE = /無視.*防禦/;

  const EXCEPTIONAL_TO_MAIN = {
    str: 'STR',
    dex: 'DEX',
    int: 'INT',
    luk: 'LUK',
    pad: '攻擊力',
    mad: '魔法攻擊力',
    mhp: '最大HP',
    mmp: '最大MP',
    bdR: 'BOSS怪物傷害',
  };

  let inited = false;
  let open = false;

  function $(id) {
    return document.getElementById(id);
  }

  function addNum(map, key, value) {
    const n = Number(value) || 0;
    if (!n) return;
    map[key] = (map[key] || 0) + n;
  }

  /** 無視防禦率：1 - ∏(1 - x_i)，x 為 0–100 的百分比；結果上限 100 */
  function combineIgnoreDefense(ratesPct) {
    let remain = 1;
    (ratesPct || []).forEach((raw) => {
      const x = Number(raw) || 0;
      if (x <= 0) return;
      remain *= (1 - Math.min(x, 100) / 100);
    });
    const total = (1 - remain) * 100;
    if (!Number.isFinite(total) || total <= 0) return 0;
    return Math.min(100, total);
  }

  function isIedLabel(label) {
    return IED_LABEL_RE.test(String(label || ''));
  }

  function parsePotentialValue(raw) {
    if (raw == null || raw === '') return { num: 0, suffix: '' };
    const text = String(raw).trim();
    const m = text.match(/([+-]?\d+(?:\.\d+)?)\s*(%?)/);
    if (!m) return { num: 0, suffix: '', text };
    return { num: Number(m[1]) || 0, suffix: m[2] || '', text };
  }

  function formatSigned(n, isPercent) {
    const v = Number(n) || 0;
    const sign = v > 0 ? '+' : '';
    return `${sign}${v}${isPercent ? '%' : ''}`;
  }

  function resolveWornItem(entry) {
    if (!entry?.itemId || typeof EquipTooltipModule === 'undefined') return null;
    return EquipTooltipModule.resolveItemState(
      entry.itemId,
      `body:${entry.slotId}`,
      entry.state,
    );
  }

  function normalizePotKey(label, valueText) {
    const raw = String(label || '').trim() || '(未知潛能)';
    // 「無視怪物防禦力：+40%」→ key=無視怪物防禦力
    const fromLabel = raw.match(/^(.+?)[：:]\s*\+?-?\d/);
    if (fromLabel) return fromLabel[1].trim();
    if (valueText) return raw;
    const fromInline = raw.match(/^(.+?)\s*\+?-?\d/);
    if (fromInline) return fromInline[1].trim();
    return raw;
  }

  function collectPotentialAgg(pot, dest) {
    const lines = pot?.lines;
    if (!Array.isArray(lines) || !lines.length) return;
    lines.forEach((line) => {
      if (!line) return;
      const labelRaw = formatPotentialDisplayLabel
        ? formatPotentialDisplayLabel(String(line.label || '').trim() || '(未知潛能)')
        : (String(line.label || '').trim() || '(未知潛能)');
      const valueRaw = line.value != null ? String(line.value) : '';
      let parsed = parsePotentialValue(valueRaw);
      if (!parsed.num) parsed = parsePotentialValue(labelRaw);
      const key = normalizePotKey(labelRaw, valueRaw);
      if (!dest[key]) {
        dest[key] = { value: 0, suffix: parsed.suffix, count: 0, texts: [] };
      }
      dest[key].count += 1;
      if (parsed.num) {
        dest[key].value += parsed.num;
        if (parsed.suffix) dest[key].suffix = parsed.suffix;
      } else {
        dest[key].texts.push(labelRaw);
      }
    });
  }

  function collectSoulAgg(item, totals) {
    if (typeof EquipTooltipModule === 'undefined') return;
    const soul = EquipTooltipModule.getSoulWeaponState?.(item);
    if (!soul) return;

    const charge = EquipTooltipModule.getSoulWeaponChargeBonus?.(item) || { atk: 0, mad: 0 };
    addNum(totals.soulFlat, '攻擊力', charge.atk);
    addNum(totals.soulFlat, '魔法攻擊力', charge.mad);

    const option = soul.option || soul.stats || null;
    if (!option) return;
    let text = '';
    if (typeof EquipTooltipModule.formatSoulWeaponOption === 'function') {
      text = EquipTooltipModule.formatSoulWeaponOption(soul);
    }
    if (!text && typeof SoulWeaponModule !== 'undefined') {
      text = SoulWeaponModule.formatSoulOption?.(option) || '';
    }
    if (!text) {
      const name = String(option.label || '').replace(/%$/, '');
      const unit = option.unit || '';
      if (unit === 'lv' || unit === 'text') text = String(option.label || name);
      else if (unit === '%') text = `${name} +${option.value}%`;
      else text = `${name} +${option.value}`;
    }
    if (!text) return;

    const m = text.match(/^(.+?)\s*\+(-?\d+(?:\.\d+)?)(%?)$/);
    if (m) {
      const key = m[1].trim();
      const val = Number(m[2]) || 0;
      addNum(totals.soulOptions, key, val);
      totals.soulOptionMeta[key] = m[3] || '';
      if (isIedLabel(key) && val) totals.iedSources.push(val);
    } else {
      addNum(totals.soulTexts, text, 1);
    }
  }

  /** 逐條蒐集無視防禦（不可先加總再乘） */
  function collectIedFromPot(pot, iedSources) {
    const lines = pot?.lines;
    if (!Array.isArray(lines) || !lines.length) return;
    lines.forEach((line) => {
      if (!line) return;
      const labelRaw = formatPotentialDisplayLabel
        ? formatPotentialDisplayLabel(String(line.label || '').trim() || '(未知潛能)')
        : (String(line.label || '').trim() || '(未知潛能)');
      const valueRaw = line.value != null ? String(line.value) : '';
      let parsed = parsePotentialValue(valueRaw);
      if (!parsed.num) parsed = parsePotentialValue(labelRaw);
      const key = normalizePotKey(labelRaw, valueRaw);
      if (!isIedLabel(key) && !isIedLabel(labelRaw)) return;
      if (parsed.num) iedSources.push(parsed.num);
    });
  }

  function buildSnapshot() {
    const entries = (typeof UiEquipModule !== 'undefined'
      && typeof UiEquipModule.getActiveWearEntries === 'function')
      ? UiEquipModule.getActiveWearEntries()
      : [];

    const mainTotals = {};
    MAIN_KEYS.forEach(({ label }) => { mainTotals[label] = { base: 0, star: 0, scroll: 0, bonus: 0, total: 0 }; });

    const extraTotals = {}; // label -> { total, isPercent }
    const exceptionalTotals = {};
    const soulFlat = {};
    const soulOptions = {};
    const soulOptionMeta = {};
    const soulTexts = {};
    const potMain = {};
    const potAdd = {};
    const sets = {};
    const slots = [];
    const iedSources = [];

    let pieceCount = 0;
    let starSum = 0;
    let upgradeRemain = 0;

    entries.forEach((entry) => {
      const item = resolveWornItem(entry);
      if (!item) return;
      pieceCount += 1;
      starSum += Number(item.star) || 0;
      upgradeRemain += Number(item.upgradeSlots) || 0;

      const setId = Number(item.wz?.setItemID) || 0;
      if (setId) {
        sets[setId] = (sets[setId] || 0) + 1;
      }

      const segments = (typeof EquipTooltipModule !== 'undefined'
        && typeof EquipTooltipModule.buildStatSegments === 'function')
        ? EquipTooltipModule.buildStatSegments(item)
        : [];

      const slotMain = {};
      MAIN_KEYS.forEach(({ label }) => {
        slotMain[label] = { base: 0, star: 0, scroll: 0, bonus: 0, total: 0 };
      });
      const slotExtra = [];

      segments.forEach((seg) => {
        if (!seg) return;
        const label = seg.label;
        if (MAIN_LABEL_SET.has(label)) {
          const row = mainTotals[label];
          row.base += Number(seg.base) || 0;
          row.star += Number(seg.star) || 0;
          row.scroll += Number(seg.scroll) || 0;
          row.bonus += Number(seg.bonus) || 0;
          row.total += Number(seg.total) || 0;

          const srow = slotMain[label];
          srow.base += Number(seg.base) || 0;
          srow.star += Number(seg.star) || 0;
          srow.scroll += Number(seg.scroll) || 0;
          srow.bonus += Number(seg.bonus) || 0;
          srow.total += Number(seg.total) || 0;
        } else {
          const t = Number(seg.total) || 0;
          if (!extraTotals[label]) {
            extraTotals[label] = { total: 0, isPercent: !!seg.isPercent };
          }
          extraTotals[label].total += t;
          if (seg.isPercent) extraTotals[label].isPercent = true;
          if (isIedLabel(label) && t) iedSources.push(t);
          if (t) {
            slotExtra.push({
              label,
              base: Number(seg.base) || 0,
              star: Number(seg.star) || 0,
              scroll: Number(seg.scroll) || 0,
              bonus: Number(seg.bonus) || 0,
              total: t,
              isPercent: !!seg.isPercent,
            });
          }
        }
      });

      if (typeof getExceptionalTotalStats === 'function') {
        const ex = getExceptionalTotalStats(item) || {};
        Object.entries(ex).forEach(([k, v]) => {
          const label = EXCEPTIONAL_TO_MAIN[k] || k;
          addNum(exceptionalTotals, label, v);
        });
      }

      collectSoulAgg(item, {
        soulFlat,
        soulOptions,
        soulOptionMeta,
        soulTexts,
        iedSources,
      });

      collectPotentialAgg(item.potential, potMain);
      collectPotentialAgg(item.additionalPotential, potAdd);
      collectIedFromPot(item.potential, iedSources);
      collectIedFromPot(item.additionalPotential, iedSources);

      slots.push({
        slotId: entry.slotId,
        slotLabel: entry.label,
        name: item.name || entry.itemId,
        itemId: entry.itemId,
        star: Number(item.star) || 0,
        upgradeSlots: Number(item.upgradeSlots) || 0,
        main: slotMain,
        extra: slotExtra,
        exceptionalLevel: typeof getExceptionalLevel === 'function'
          ? getExceptionalLevel(item)
          : (item.exceptional?.level || 0),
        potRank: item.potential?.rank || '',
        addPotRank: item.additionalPotential?.rank || '',
      });
    });

    const iedTotal = combineIgnoreDefense(iedSources);

    return {
      preset: typeof UiEquipModule !== 'undefined'
        ? UiEquipModule.getActivePreset?.()
        : 1,
      pieceCount,
      starSum,
      upgradeRemain,
      mainTotals,
      extraTotals,
      exceptionalTotals,
      soulFlat,
      soulOptions,
      soulOptionMeta,
      soulTexts,
      potMain,
      potAdd,
      sets,
      slots,
      iedSources,
      iedTotal,
    };
  }

  function esc(text) {
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function renderKvRows(pairs, { always = false, isPercentMap = null } = {}) {
    const rows = [];
    pairs.forEach(([label, value]) => {
      const n = typeof value === 'object' ? Number(value.total) || 0 : Number(value) || 0;
      if (!always && !n) return;
      const pct = isPercentMap
        ? !!isPercentMap[label]
        : (typeof value === 'object' && value.isPercent);
      rows.push(`<div class="esp-row"><span class="esp-k">${esc(label)}</span><span class="esp-v">${esc(formatSigned(n, pct))}</span></div>`);
    });
    return rows.length ? rows.join('') : '<div class="esp-empty">（無）</div>';
  }

  function renderMainBreakdown(mainTotals) {
    return MAIN_KEYS.map(({ label }) => {
      const row = mainTotals[label] || { base: 0, star: 0, scroll: 0, bonus: 0, total: 0 };
      return `<div class="esp-row esp-row-main">
        <span class="esp-k">${esc(label)}</span>
        <span class="esp-v">${esc(formatSigned(row.total, false))}</span>
        <span class="esp-break">b${row.base}/sf${row.star}/sc${row.scroll}/fl${row.bonus}</span>
      </div>`;
    }).join('');
  }

  function renderPotentialBlock(title, agg) {
    const keys = Object.keys(agg);
    if (!keys.length) {
      return `<div class="esp-section"><h4>${esc(title)}</h4><div class="esp-empty">（無）</div></div>`;
    }
    const rows = keys.map((label) => {
      const info = agg[label];
      let text;
      if (info.value) {
        text = `${label} ${formatSigned(info.value, !!info.suffix)}`;
      } else if (info.texts?.length) {
        text = info.texts[0] + (info.count > 1 ? ` ×${info.count}` : '');
      } else {
        text = `${label} ×${info.count}`;
      }
      return `<div class="esp-row"><span class="esp-k">${esc(text)}</span></div>`;
    }).join('');
    return `<div class="esp-section"><h4>${esc(title)}</h4>${rows}</div>`;
  }

  function renderSlotDetail(slot) {
    const mainLines = MAIN_KEYS
      .filter(({ label }) => (slot.main[label]?.total || 0) !== 0
        || (slot.main[label]?.base || 0) !== 0)
      .map(({ label }) => {
        const r = slot.main[label];
        return `<div class="esp-row esp-row-main">
          <span class="esp-k">${esc(label)}</span>
          <span class="esp-v">${esc(formatSigned(r.total, false))}</span>
          <span class="esp-break">b${r.base}/sf${r.star}/sc${r.scroll}/fl${r.bonus}</span>
        </div>`;
      }).join('');

    const extraLines = (slot.extra || []).map((seg) => (
      `<div class="esp-row">
        <span class="esp-k">${esc(seg.label)}</span>
        <span class="esp-v">${esc(formatSigned(seg.total, seg.isPercent))}</span>
        <span class="esp-break">b${seg.base}/sf${seg.star}/sc${seg.scroll}/fl${seg.bonus}</span>
      </div>`
    )).join('');

    return `<details class="esp-slot">
      <summary>${esc(slot.slotLabel)} · ${esc(slot.name)} ★${slot.star}</summary>
      <div class="esp-slot-body">
        <div class="esp-meta-line">剩餘捲 ${slot.upgradeSlots} · 卓越 ${slot.exceptionalLevel} · 潛能 ${esc(slot.potRank || '-')} / 附潛 ${esc(slot.addPotRank || '-')}</div>
        ${mainLines || '<div class="esp-empty">（主屬性 0）</div>'}
        ${extraLines}
      </div>
    </details>`;
  }

  function render(snapshot) {
    const body = $('equipStatPanelBody');
    if (!body || !snapshot) return;

    const extraPairs = Object.entries(snapshot.extraTotals).map(([label, info]) => [label, info]);
    const exPairs = Object.entries(snapshot.exceptionalTotals);
    const soulFlatPairs = Object.entries(snapshot.soulFlat);
    const soulOptPairs = Object.entries(snapshot.soulOptions).map(([label, v]) => {
      const pct = !!snapshot.soulOptionMeta[label];
      return [label, { total: v, isPercent: pct }];
    });
    const soulTextPairs = Object.entries(snapshot.soulTexts).map(([text, count]) => (
      `<div class="esp-row"><span class="esp-k">${esc(text)}${count > 1 ? ` ×${count}` : ''}</span></div>`
    )).join('');

    const setLines = Object.entries(snapshot.sets).map(([id, count]) => {
      const name = (typeof EQUIP_SET_LABELS !== 'undefined' && EQUIP_SET_LABELS[id])
        ? EQUIP_SET_LABELS[id]
        : `套裝#${id}`;
      return `<div class="esp-row"><span class="esp-k">${esc(name)}</span><span class="esp-v">${count}件</span></div>`;
    }).join('') || '<div class="esp-empty">（無）</div>';

    body.innerHTML = `
      <div class="esp-meta">
        預設 ${snapshot.preset} · 穿著 ${snapshot.pieceCount} · 總星 ${snapshot.starSum} · 剩餘捲合計 ${snapshot.upgradeRemain}
      </div>
      <div class="esp-section">
        <h4>無視防禦率（乘算 1−∏(1−x)）</h4>
        <div class="esp-row">
          <span class="esp-k">合計</span>
          <span class="esp-v">${esc(formatSigned(snapshot.iedTotal || 0, true))}</span>
          <span class="esp-break">${(snapshot.iedSources || []).length} 來源</span>
        </div>
      </div>
      <div class="esp-section">
        <h4>主屬性（base+sf+scroll+flame）</h4>
        ${renderMainBreakdown(snapshot.mainTotals)}
      </div>
      <div class="esp-section">
        <h4>百分比／特殊／火焰額外</h4>
        ${renderKvRows(extraPairs)}
      </div>
      <div class="esp-section">
        <h4>卓越合計</h4>
        ${renderKvRows(exPairs, { isPercentMap: { BOSS怪物傷害: true } })}
      </div>
      <div class="esp-section">
        <h4>靈魂合計</h4>
        ${
          soulFlatPairs.length || soulOptPairs.length || soulTextPairs
            ? `${soulFlatPairs.length ? renderKvRows(soulFlatPairs) : ''}
               ${soulOptPairs.length ? renderKvRows(soulOptPairs) : ''}
               ${soulTextPairs || ''}`
            : '<div class="esp-empty">（無）</div>'
        }
      </div>
      ${renderPotentialBlock('主潛能合計', snapshot.potMain)}
      ${renderPotentialBlock('附加潛能合計', snapshot.potAdd)}
      <div class="esp-section">
        <h4>套裝件數</h4>
        ${setLines}
      </div>
      <div class="esp-section">
        <h4>分槽明細</h4>
        ${snapshot.slots.length
          ? snapshot.slots.map(renderSlotDetail).join('')
          : '<div class="esp-empty">（尚未穿著）</div>'}
      </div>
    `;
  }

  function refresh() {
    if (!inited) return;
    try {
      render(buildSnapshot());
    } catch (err) {
      const body = $('equipStatPanelBody');
      if (body) {
        body.innerHTML = `<div class="esp-empty">統計錯誤：${esc(err?.message || err)}</div>`;
      }
      console.error('[EquipStatPanel]', err);
    }
  }

  function setOpen(next) {
    open = !!next;
    const panel = $('equipStatPanel');
    if (panel) panel.classList.toggle('is-hidden', !open);
    if (open && typeof PanelDrag !== 'undefined') {
      PanelDrag.bringFront(panel);
    }
    $('btnViewDetail')?.classList.toggle('is-active', open);
    $('btnViewDetail')?.setAttribute('aria-pressed', open ? 'true' : 'false');
  }

  function toggle() {
    setOpen(!open);
  }

  function bind() {
    $('btnViewDetail')?.addEventListener('click', (e) => {
      e.preventDefault();
      toggle();
      if (open) refresh();
    });
    $('equipStatPanelClose')?.addEventListener('click', (e) => {
      e.preventDefault();
      setOpen(false);
    });
  }

  function init() {
    if (inited) return;
    inited = true;
    bind();
    setOpen(false);
    refresh();
  }

  return {
    init,
    refresh,
    toggle,
    setOpen,
    isOpen: () => !!open,
    buildSnapshot,
    combineIgnoreDefense,
    MAIN_KEYS,
  };
})();

if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    // main.js 也會 init；重複呼叫無害
    if (document.getElementById('equipStatPanel')) {
      EquipStatPanel.init();
    }
  });
}
