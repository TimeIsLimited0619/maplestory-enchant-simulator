/**
 * 追加屬性（輪迴星火）機率表
 */
const BONUS_STAT_INSPECT_STAR_FIRE_LABELS = {
  enhanced: '楓幣（強化星火）',
  eternal: '楓幣（永恆星火）',
  awakened: '覺醒的輪迴星火',
  blackAwakened: '覺醒的暗黑輪迴星火',
};

const BonusStatInspectModule = {
  isOpen: false,
  starFireType: 'enhanced',

  init() {
    const btn = document.getElementById('bsInspectBtn');
    const closeBtn = document.getElementById('bsInspectClose');
    const backdrop = document.getElementById('bsInspectOverlay');
    const typeSelect = document.getElementById('bsInspectTypeSelect');

    if (btn) btn.addEventListener('click', () => this.open());
    if (closeBtn) closeBtn.addEventListener('click', () => this.close());
    if (backdrop) {
      backdrop.addEventListener('click', (event) => {
        if (event.target === backdrop) this.close();
      });
    }
    if (typeSelect) {
      typeSelect.addEventListener('change', () => {
        this.starFireType = typeSelect.value;
        this.render();
      });
    }

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && this.isOpen) this.close();
    });

    this.updateVisibility();
  },

  getActiveCategory() {
    const cat = document.getElementById('actionCategory')?.value || 'star';
    return cat === 'bonusStat' ? cat : null;
  },

  updateVisibility() {
    const btn = document.getElementById('bsInspectBtn');
    if (!btn) return;

    const cat = this.getActiveCategory();
    btn.classList.toggle('hidden', !cat);

    if (!cat && this.isOpen) this.close();
  },

  getStarFireTypeOptions() {
    return Object.keys(BONUS_STAT_STAR_LEVEL_PROB || {}).map((key) => ({
      id: key,
      label: BONUS_STAT_INSPECT_STAR_FIRE_LABELS[key] || key,
    }));
  },

  getSelectedStarFireType() {
    const options = this.getStarFireTypeOptions();
    if (options.some((opt) => opt.id === this.starFireType)) {
      return this.starFireType;
    }
    return options[0]?.id || 'enhanced';
  },

  getCurrentStarFireTypeFromModule() {
    if (typeof BonusStatModule === 'undefined') return 'enhanced';

    if (BonusStatModule.costTab === 'item') {
      const item = BonusStatModule.getSelectedItem?.();
      if (item?.starFireType) return item.starFireType;
    }

    return BonusStatModule.itemData?.bonusStat?.starFireType
      || getBonusStatRollStarFireType?.(
        BonusStatModule.costTab,
        BonusStatModule.getSelectedItem?.(),
        BonusStatModule.itemData?.bonusStat
      )
      || 'enhanced';
  },

  getCurrentItem() {
    return typeof BonusStatModule !== 'undefined' ? BonusStatModule.itemData : null;
  },

  buildStarLevelRows(starFireType) {
    const prob = BONUS_STAT_STAR_LEVEL_PROB?.[starFireType]
      || BONUS_STAT_STAR_LEVEL_PROB?.enhanced
      || {};
    const rows = Object.entries(prob)
      .map(([level, rate]) => ({
        level,
        rate: bsParsePercentString(rate),
        rateText: `${bsParsePercentString(rate).toFixed(2)}%`,
      }))
      .filter((row) => row.rate > 0)
      .sort((a, b) => Number(a.level) - Number(b.level));

    const rateSum = rows.reduce((sum, row) => sum + row.rate, 0);
    return { rows, rateSum, rateSumText: `${rateSum.toFixed(2)}%` };
  },

  buildLineCountRows(item) {
    const isBoss = typeof bsIsBossGearItem === 'function' && bsIsBossGearItem(item);
    const prob = isBoss
      ? BONUS_STAT_LINE_COUNT_PROB?.boss
      : BONUS_STAT_LINE_COUNT_PROB?.general;
    const rows = (prob || [])
      .map((rate, index) => ({
        count: index + 1,
        rate: bsParsePercentString(rate),
        rateText: `${bsParsePercentString(rate).toFixed(2)}%`,
      }))
      .filter((row) => row.rate > 0);

    const rateSum = rows.reduce((sum, row) => sum + row.rate, 0);
    return {
      rows,
      rateSum,
      rateSumText: `${rateSum.toFixed(2)}%`,
      scope: isBoss ? 'BOSS 套裝' : '一般裝備',
    };
  },

  formatInspectStatValue(statName, value, line) {
    if (value == null || Number.isNaN(Number(value))) return '-';
    const isPercent = line?.isPercent ?? statName.includes('%');
    if (isPercent) return `+${value}%`;
    if (statName === '穿戴等級減少') return String(value);
    return `+${value}`;
  },

  getStatValueRangeText(statName, item) {
    const values = [];
    let sampleLine = null;

    for (let tier = 1; tier <= BONUS_STAT_STAR_LINE_TIERS; tier += 1) {
      const line = typeof bsResolveStatLine === 'function'
        ? bsResolveStatLine(statName, tier, item)
        : null;
      if (!line) continue;
      sampleLine = sampleLine || line;
      values.push(Number(line.value));
    }

    if (!values.length) return '-';

    const min = Math.min(...values);
    const max = Math.max(...values);
    const minText = this.formatInspectStatValue(statName, min, sampleLine);
    const maxText = this.formatInspectStatValue(statName, max, sampleLine);
    return min === max ? minText : `${minText} ~ ${maxText}`;
  },

  getStatDisplayText(statName, item) {
    const line = typeof bsResolveStatLine === 'function'
      ? bsResolveStatLine(statName, 5, item)
      : null;
    if (!line) return statName;

    if (typeof formatBonusStatLineDisplay === 'function') {
      const formatted = formatBonusStatLineDisplay(line, item);
      if (formatted?.label) {
        return formatted.value ? `${formatted.label} ${formatted.value}` : formatted.label;
      }
    }

    return line.label || statName;
  },

  buildStatPoolRows(item) {
    const pool = typeof bsGetStatPool === 'function'
      ? bsGetStatPool(item)
      : (BONUS_STAT_STAT_POOL?.weapon || []);
    const available = pool.filter(
      (name) => typeof bsCanRollStat !== 'function' || bsCanRollStat(name, item)
    );
    const rate = available.length ? 100 / available.length : 0;

    const rows = available.map((statName) => ({
      statName,
      display: this.getStatDisplayText(statName, item),
      valueRange: this.getStatValueRangeText(statName, item),
      rate: available.length ? 1 / available.length : 0,
      rateText: `${rate.toFixed(4)}%`,
    }));

    return {
      rows,
      rateSum: available.length ? 1 : 0,
      rateSumText: available.length ? '100.0000%' : '0%',
      poolType: typeof bsIsWeaponItem === 'function' && bsIsWeaponItem(item) ? '武器' : '防具',
    };
  },

  buildLineTierNote(starFireType) {
    const sampleLevels = Object.keys(BONUS_STAT_STAR_LEVEL_PROB?.[starFireType] || {})
      .map(Number)
      .filter((level) => level >= 2)
      .sort((a, b) => a - b);

    if (!sampleLevels.length) return '';

    const lines = sampleLevels.map((level) => {
      let effective = level;
      if (starFireType === 'awakened' || starFireType === 'blackAwakened') {
        effective = Math.min(7, Math.max(3, level + 2));
      }
      const maxTier = Math.min(
        BONUS_STAT_STAR_LINE_TIERS,
        Math.max(1, (effective - 1) * 2)
      );
      const each = maxTier ? (100 / maxTier).toFixed(4) : '0';
      const effectiveNote = effective !== level ? `（計算等級 ${effective}）` : '';
      return `星火${level}${effectiveNote}：每條詞條星火階 1~${maxTier}，各 ${each}%`;
    });

    if (starFireType === 'awakened' || starFireType === 'blackAwakened') {
      lines.unshift('覺醒星火：決定等級 +2 後作為 3~7 等計算詞條星火階');
    }

    return lines.join('\n');
  },

  populateTypeSelect() {
    const typeSelect = document.getElementById('bsInspectTypeSelect');
    if (!typeSelect) return;

    const activeType = this.getSelectedStarFireType();
    this.starFireType = activeType;

    typeSelect.innerHTML = this.getStarFireTypeOptions().map((opt) => `
      <option value="${opt.id}" ${opt.id === activeType ? 'selected' : ''}>
        ${opt.label}
      </option>
    `).join('');
  },

  render() {
    const item = this.getCurrentItem();
    const titleEl = document.getElementById('bsInspectTitle');
    const metaEl = document.getElementById('bsInspectMeta');
    const bodyEl = document.getElementById('bsInspectBody');

    if (!bodyEl) return;

    this.populateTypeSelect();

    if (titleEl) titleEl.textContent = '追加屬性機率一覽';

    if (!item) {
      if (metaEl) metaEl.textContent = '請先放置裝備';
      bodyEl.innerHTML = '<div class="pt-inspect-empty">尚未載入裝備，無法查詢機率表。</div>';
      return;
    }

    const starFireType = this.getSelectedStarFireType();
    const starLevel = this.buildStarLevelRows(starFireType);
    const lineCount = this.buildLineCountRows(item);
    const statPool = this.buildStatPoolRows(item);
    const typeLabel = BONUS_STAT_INSPECT_STAR_FIRE_LABELS[starFireType] || starFireType;
    const tierNote = this.buildLineTierNote(starFireType);

    if (metaEl) {
      metaEl.textContent = [
        `裝備：Lv.${item.reqLevel} ${item.name}${item.isBossGear ? ' · BOSS 套裝' : ''}`,
        `詞條池：${statPool.poolType}`,
        `星火：${typeLabel}`,
        tierNote,
      ].filter(Boolean).join('\n');
    }

    bodyEl.innerHTML = `
      <section class="pt-inspect-section">
        <div class="pt-inspect-section-head">
          <span class="pt-inspect-rank pt-inspect-rank-unique">星火等級機率</span>
          <span class="pt-inspect-sum">機率合計 ${starLevel.rateSumText}</span>
        </div>
        <table class="pt-inspect-table">
          <thead>
            <tr>
              <th>星火等級</th>
              <th>機率</th>
            </tr>
          </thead>
          <tbody>
            ${starLevel.rows.map((row) => `
              <tr>
                <td class="pt-inspect-display">星火 ${row.level}</td>
                <td class="pt-inspect-rate">${row.rateText}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </section>

      <section class="pt-inspect-section">
        <div class="pt-inspect-section-head">
          <span class="pt-inspect-rank pt-inspect-rank-rare">詞條數量機率</span>
          <span class="pt-inspect-sum">機率合計 ${lineCount.rateSumText} · ${lineCount.scope}</span>
        </div>
        <table class="pt-inspect-table">
          <thead>
            <tr>
              <th>詞條數</th>
              <th>機率</th>
            </tr>
          </thead>
          <tbody>
            ${lineCount.rows.map((row) => `
              <tr>
                <td class="pt-inspect-display">${row.count} 條</td>
                <td class="pt-inspect-rate">${row.rateText}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </section>

      <section class="pt-inspect-section">
        <div class="pt-inspect-section-head">
          <span class="pt-inspect-rank pt-inspect-rank-legendary">詞條種類（等機率）</span>
          <span class="pt-inspect-sum">機率合計 ${statPool.rateSumText}</span>
        </div>
        <table class="pt-inspect-table">
          <thead>
            <tr>
              <th>詞條</th>
              <th>顯示</th>
              <th>機率</th>
              <th>數值範圍（星火1~9）</th>
            </tr>
          </thead>
          <tbody>
            ${statPool.rows.map((row) => `
              <tr>
                <td class="pt-inspect-stat">${escapeInspectHtml(row.statName)}</td>
                <td class="pt-inspect-display">${escapeInspectHtml(row.display)}</td>
                <td class="pt-inspect-rate">${row.rateText}</td>
                <td class="pt-inspect-scope">${escapeInspectHtml(row.valueRange)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </section>
    `;
  },

  open() {
    if (!this.getActiveCategory()) return;

    this.starFireType = this.getCurrentStarFireTypeFromModule();

    const overlay = document.getElementById('bsInspectOverlay');
    if (overlay) overlay.classList.remove('hidden');

    this.isOpen = true;
    this.render();
  },

  close() {
    const overlay = document.getElementById('bsInspectOverlay');
    if (overlay) overlay.classList.add('hidden');
    this.isOpen = false;
  },
};
