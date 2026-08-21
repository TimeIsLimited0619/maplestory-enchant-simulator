/**
 * 追加屬性（輪迴星火）機率表
 */
const BONUS_STAT_INSPECT_STAR_FIRE_LABELS = {
  enhanced: '強力的輪迴星火',
  eternal: '永遠的輪迴星火',
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

  isAwakenedStarFireType(starFireType) {
    return starFireType === 'awakened' || starFireType === 'blackAwakened';
  },

  usesAwakenedIndependentTiers() {
    return typeof bsUsesAwakenedIndependentTiers === 'function'
      ? bsUsesAwakenedIndependentTiers()
      : false;
  },

  getDisplayTierMax() {
    if (typeof bsGetBonusStatDisplayTierMax === 'function') {
      return bsGetBonusStatDisplayTierMax();
    }
    return this.usesAwakenedIndependentTiers() ? 9 : 7;
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

  normalizeProbRows(entries, labelFn) {
    const rows = entries
      .map(([key, rate]) => ({
        key,
        label: labelFn(key),
        rate: bsParsePercentString(rate),
        rateText: `${bsParsePercentString(rate).toFixed(2)}%`,
      }))
      .filter((row) => row.rate > 0)
      .sort((a, b) => Number(a.key) - Number(b.key));

    const rateSum = rows.reduce((sum, row) => sum + row.rate, 0);
    return {
      rows,
      rateSum,
      rateSumText: `${rateSum.toFixed(2)}%`,
    };
  },

  buildStarLevelRows(starFireType) {
    const prob = (typeof bsGetStarLevelProb === 'function'
      ? bsGetStarLevelProb(starFireType)
      : BONUS_STAT_STAR_LEVEL_PROB?.[starFireType])
      || BONUS_STAT_STAR_LEVEL_PROB?.enhanced
      || {};
    return this.normalizeProbRows(
      Object.entries(prob),
      (level) => `星火 ${level}`
    );
  },

  buildAwakenedBaseTierRows() {
    return this.normalizeProbRows(
      Object.entries(BONUS_STAT_AWAKENED_BASE_TIER_PROB || {}),
      (tier) => `T${tier}`
    );
  },

  buildAwakenedBonusRows() {
    return this.normalizeProbRows(
      Object.entries(BONUS_STAT_AWAKENED_TIER_BONUS_PROB || {}),
      (bonus) => `+${bonus}`
    );
  },

  /** 基礎階 × 加值 → 最終 1~9 階機率 */
  buildAwakenedFinalTierRows() {
    const baseProb = BONUS_STAT_AWAKENED_BASE_TIER_PROB || {};
    const bonusProb = BONUS_STAT_AWAKENED_TIER_BONUS_PROB || {};
    const maxTier = typeof BONUS_STAT_STAR_LINE_TIERS === 'number' ? BONUS_STAT_STAR_LINE_TIERS : 9;

    const baseEntries = Object.entries(baseProb)
      .map(([k, v]) => ({ tier: Number(k), weight: bsParsePercentString(v) }))
      .filter((e) => e.weight > 0 && Number.isFinite(e.tier));
    const bonusEntries = Object.entries(bonusProb)
      .map(([k, v]) => ({ bonus: Number(k), weight: bsParsePercentString(v) }))
      .filter((e) => e.weight > 0 && Number.isFinite(e.bonus));

    const baseSum = baseEntries.reduce((s, e) => s + e.weight, 0);
    const bonusSum = bonusEntries.reduce((s, e) => s + e.weight, 0);
    const finalWeights = {};

    if (baseSum > 0 && bonusSum > 0) {
      baseEntries.forEach((base) => {
        bonusEntries.forEach((bonus) => {
          const tier = Math.max(1, Math.min(maxTier, base.tier + bonus.bonus));
          const p = (base.weight / baseSum) * (bonus.weight / bonusSum) * 100;
          finalWeights[tier] = (finalWeights[tier] || 0) + p;
        });
      });
    }

    return this.normalizeProbRows(
      Object.entries(finalWeights),
      (tier) => `${tier} 階`
    );
  },

  buildLineCountRows(item) {
    const isBoss = typeof bsIsBossGearItem === 'function' && bsIsBossGearItem(item);
    const prob = typeof bsGetLineCountProb === 'function'
      ? bsGetLineCountProb(isBoss)
      : (isBoss
        ? BONUS_STAT_LINE_COUNT_PROB?.boss
        : BONUS_STAT_LINE_COUNT_PROB?.general);
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

    for (let tier = 1; tier <= this.getDisplayTierMax(); tier += 1) {
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
    const rateMap = typeof bsGetStatPickRates === 'function'
      ? bsGetStatPickRates(item)
      : null;

    const rows = available.map((statName) => {
      const rate = rateMap?.has(statName)
        ? rateMap.get(statName)
        : (available.length ? 100 / available.length : 0);
      return {
        statName,
        display: this.getStatDisplayText(statName, item),
        valueRange: this.getStatValueRangeText(statName, item),
        rate: rate / 100,
        rateText: `${Number(rate).toFixed(4)}%`,
      };
    });

    const rateSum = rows.reduce((sum, row) => sum + ((row.rate || 0) * 100), 0);
    const hasAllStatBias = available.includes('全屬性%') && available.length > 1;

    return {
      rows,
      rateSum: available.length ? 1 : 0,
      rateSumText: `${rateSum.toFixed(4)}%`,
      poolType: typeof bsIsWeaponItem === 'function' && bsIsWeaponItem(item) ? '武器' : '防具',
      sectionTitle: hasAllStatBias && typeof isBonusStatCatValleyRatesEnabled === 'function'
        && isBonusStatCatValleyRatesEnabled()
        ? `詞條種類（全屬性% ${BONUS_STAT_ALLSTAT_PICK_RATE ?? 3}%，其餘均分）`
        : '詞條種類（等機率）',
    };
  },

  buildLineTierNote(starFireType) {
    if (this.usesAwakenedIndependentTiers()) {
      if (this.isAwakenedStarFireType(starFireType)) {
        return '詞條階級：先抽基礎 T1~T5，再抽加值（覺醒／暗黑共用；最終 clamp 1~9）';
      }
      const sampleLevels = Object.keys(
        (typeof bsGetStarLevelProb === 'function'
          ? bsGetStarLevelProb(starFireType)
          : BONUS_STAT_STAR_LEVEL_PROB?.[starFireType]) || {}
      )
        .map(Number)
        .filter((level) => level >= 2)
        .sort((a, b) => a - b);
      if (!sampleLevels.length) return '';
      return sampleLevels.map((level) => {
        const maxTier = Math.min(
          BONUS_STAT_STAR_LINE_TIERS,
          Math.max(1, (level - 1) * 2)
        );
        const each = maxTier ? (100 / maxTier).toFixed(4) : '0';
        return `星火${level}：每條詞條星火階 1~${maxTier}，各 ${each}%`;
      }).join('\n');
    }

    if (this.isAwakenedStarFireType(starFireType)) {
      return 'BOSS 套裝星火等級 +2 後再決定附加屬性等級（最高 7）。';
    }
    return '';
  },

  renderProbTableSection(title, rankClass, summary, columns, rows, mapRow) {
    return `
      <section class="pt-inspect-section">
        <div class="pt-inspect-section-head">
          <span class="pt-inspect-rank ${rankClass}">${title}</span>
          <span class="pt-inspect-sum">${summary}</span>
        </div>
        <table class="pt-inspect-table">
          <thead>
            <tr>
              ${columns.map((col) => `<th>${col}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${rows.map(mapRow).join('')}
          </tbody>
        </table>
      </section>
    `;
  },

  renderStarTierSections(starFireType) {
    if (this.isAwakenedStarFireType(starFireType) && this.usesAwakenedIndependentTiers()) {
      const baseTier = this.buildAwakenedBaseTierRows();
      const bonus = this.buildAwakenedBonusRows();
      const finalTier = this.buildAwakenedFinalTierRows();

      return [
        this.renderProbTableSection(
          '基礎階級機率（共用）',
          'pt-inspect-rank-unique',
          `機率合計 ${baseTier.rateSumText}`,
          ['基礎階', '機率'],
          baseTier.rows,
          (row) => `
            <tr>
              <td class="pt-inspect-display">${escapeInspectHtml(row.label)}</td>
              <td class="pt-inspect-rate">${row.rateText}</td>
            </tr>
          `
        ),
        this.renderProbTableSection(
          '加值機率（共用）',
          'pt-inspect-rank-epic',
          `機率合計 ${bonus.rateSumText}`,
          ['加值', '機率'],
          bonus.rows,
          (row) => `
            <tr>
              <td class="pt-inspect-display">${escapeInspectHtml(row.label)}</td>
              <td class="pt-inspect-rate">${row.rateText}</td>
            </tr>
          `
        ),
        this.renderProbTableSection(
          '最終詞條階級機率',
          'pt-inspect-rank-legendary',
          `機率合計 ${finalTier.rateSumText}`,
          ['詞條階級', '機率'],
          finalTier.rows,
          (row) => `
            <tr>
              <td class="pt-inspect-display">${escapeInspectHtml(row.label)}</td>
              <td class="pt-inspect-rate">${row.rateText}</td>
            </tr>
          `
        ),
      ].join('');
    }

    const starLevel = this.buildStarLevelRows(starFireType);
    return this.renderProbTableSection(
      '星火等級機率',
      'pt-inspect-rank-unique',
      `機率合計 ${starLevel.rateSumText}`,
      ['星火等級', '機率'],
      starLevel.rows,
      (row) => `
        <tr>
          <td class="pt-inspect-display">${escapeInspectHtml(row.label)}</td>
          <td class="pt-inspect-rate">${row.rateText}</td>
        </tr>
      `
    );
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
    const lineCount = this.buildLineCountRows(item);
    const statPool = this.buildStatPoolRows(item);
    const typeLabel = BONUS_STAT_INSPECT_STAR_FIRE_LABELS[starFireType] || starFireType;
    const tierNote = this.buildLineTierNote(starFireType);

    if (metaEl) {
      metaEl.textContent = [
        `裝備：Lv.${item.reqLevel} ${item.name}${item.isBossGear ? ' · BOSS 套裝' : ''}`,
        `詞條池：${statPool.poolType}`,
        `星火：${typeLabel}`,
        typeof isBonusStatCatValleyRatesEnabled === 'function' && isBonusStatCatValleyRatesEnabled()
          ? '機率：貓谷'
          : '機率：正服',
        tierNote,
      ].filter(Boolean).join('\n');
    }

    bodyEl.innerHTML = `
      ${this.renderStarTierSections(starFireType)}

      ${this.renderProbTableSection(
        '詞條數量機率',
        'pt-inspect-rank-rare',
        `機率合計 ${lineCount.rateSumText} · ${lineCount.scope}`,
        ['詞條數', '機率'],
        lineCount.rows,
        (row) => `
          <tr>
            <td class="pt-inspect-display">${row.count} 條</td>
            <td class="pt-inspect-rate">${row.rateText}</td>
          </tr>
        `
      )}

      ${this.renderProbTableSection(
        statPool.sectionTitle || '詞條種類（等機率）',
        'pt-inspect-rank-legendary',
        `機率合計 ${statPool.rateSumText}`,
        ['詞條', '顯示', '機率', `數值範圍（星火1~${this.getDisplayTierMax()}）`],
        statPool.rows,
        (row) => `
          <tr>
            <td class="pt-inspect-stat">${escapeInspectHtml(row.statName)}</td>
            <td class="pt-inspect-display">${escapeInspectHtml(row.display)}</td>
            <td class="pt-inspect-rate">${row.rateText}</td>
            <td class="pt-inspect-scope">${escapeInspectHtml(row.valueRange)}</td>
          </tr>
        `
      )}
    `;
  },

  open() {
    if (!this.getActiveCategory()) return;

    this.starFireType = this.getCurrentStarFireTypeFromModule();

    const overlay = document.getElementById('bsInspectOverlay');
    if (overlay) {
      document.body.appendChild(overlay);
      overlay.style.zIndex = '30000';
      overlay.classList.remove('hidden');
    }
    document.body.classList.add('ms-inspect-open');

    this.isOpen = true;
    this.render();
  },

  close() {
    const overlay = document.getElementById('bsInspectOverlay');
    if (overlay) overlay.classList.add('hidden');
    this.isOpen = false;
    if (typeof PotentialInspectModule === 'undefined' || !PotentialInspectModule.isOpen) {
      document.body.classList.remove('ms-inspect-open');
    }
  },
};
