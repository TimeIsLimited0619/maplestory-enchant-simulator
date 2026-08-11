/**
 * 潛能／附加潛能詞條查詢（debug 用）
 */
const POTENTIAL_INSPECT_OFFICIAL_LABELS = {
  special: '特殊',
  rare: '稀有',
  unique: '罕見',
  legendary: '傳說'
};

const PotentialInspectModule = {
  isOpen: false,
  mode: 'potential',
  rateKey: 'equal',

  init() {
    const btn = document.getElementById('ptInspectBtn');
    const closeBtn = document.getElementById('ptInspectClose');
    const backdrop = document.getElementById('ptInspectOverlay');
    const cubeSelect = document.getElementById('ptInspectCubeSelect');

    if (btn) btn.addEventListener('click', () => this.open());
    if (closeBtn) closeBtn.addEventListener('click', () => this.close());
    if (backdrop) {
      backdrop.addEventListener('click', (event) => {
        if (event.target === backdrop) this.close();
      });
    }
    if (cubeSelect) {
      cubeSelect.addEventListener('change', () => {
        this.rateKey = cubeSelect.value;
        this.render();
      });
    }

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && this.isOpen) this.close();
    });

    this.updateVisibility();
  },

  getActiveCategory() {
    const select = document.getElementById('actionCategory');
    const cat = select?.value || 'star';
    return cat === 'potential' || cat === 'additionalPotential' ? cat : null;
  },

  updateVisibility() {
    const btn = document.getElementById('ptInspectBtn');
    if (!btn) return;

    const cat = this.getActiveCategory();
    btn.classList.toggle('hidden', !cat);

    if (!cat && this.isOpen) this.close();
    if (cat) this.mode = cat;
  },

  getConfig() {
    if (this.mode === 'additionalPotential') {
      return {
        title: '附加潛能詞條一覽',
        eventId: 8422,
        defaultRateKey: 'precious',
        cubes: ADDPOT_CUBE_TYPES.map((cube) => ({
          id: cube.id,
          name: cube.name,
          rateKey: cube.rateKey || (cube.hexaPick ? 'dazzling' : null)
        })).filter((cube) => cube.rateKey)
      };
    }

    return {
      title: '主潛能詞條一覽',
      eventId: 8421,
      defaultRateKey: 'equal',
      cubes: POTENTIAL_CUBE_TYPES.map((cube) => ({
        id: cube.id,
        name: cube.name,
        rateKey: cube.rateKey || (cube.hexaPick ? 'dazzling' : null)
      })).filter((cube) => cube.rateKey)
    };
  },

  getSelectedRateKey(config) {
    if (config.cubes.some((cube) => cube.rateKey === this.rateKey)) {
      return this.rateKey;
    }
    return config.defaultRateKey;
  },

  getCurrentItem() {
    if (this.mode === 'additionalPotential') {
      return typeof AddPotentialModule !== 'undefined' ? AddPotentialModule.itemData : null;
    }
    return typeof PotentialModule !== 'undefined' ? PotentialModule.itemData : null;
  },

  getSelectedCubeRateKey(config) {
    let selectedCube = null;
    if (this.mode === 'potential' && typeof PotentialModule !== 'undefined') {
      selectedCube = PotentialModule.getSelectedCube?.();
    } else if (this.mode === 'additionalPotential' && typeof AddPotentialModule !== 'undefined') {
      selectedCube = AddPotentialModule.getSelectedCube?.();
    }

    if (selectedCube?.rateKey) return selectedCube.rateKey;
    if (selectedCube?.hexaPick) {
      return this.mode === 'additionalPotential' ? 'restoreAdd' : 'dazzling';
    }
    return config.defaultRateKey;
  },

  buildInspectData(item, mode, rateKey) {
    const config = mode === 'additionalPotential'
      ? { eventId: 8422 }
      : { eventId: 8421 };
    const eventId = config.eventId;
    const cubeRates = getPotentialCubeRates(rateKey, eventId);
    const category = getEquipPotentialCategory(item);
    const sections = [];
    let matchedGroupKey = null;

    if (!cubeRates?.statRates) {
      return { category, matchedGroupKey, sections: [], rateKey, eventId };
    }

    OFFICIAL_RANK_ORDER.forEach((officialRank) => {
      const internalRank = OFFICIAL_TO_INTERNAL_RANK[officialRank] || 'rare';
      const potContext = { eventId, rateKey };
      const group = findStatRateGroup(cubeRates.statRates, officialRank, category, item, potContext);
      if (!group?.entries?.length) return;

      if (!matchedGroupKey) {
        matchedGroupKey = `${group.major}::${group.minor}`;
      }

      const rows = [];
      let rateSum = 0;

      group.entries.forEach((entry, entryIndex) => {
        const rate = entry.rates?.[rateKey];
        if (rate == null || rate <= 0) return;

        rateSum += rate;
        const parsed = parsePotentialStat(entry.stat, internalRank, {
          group,
          entryIndex,
          item,
          eventId,
          rateKey
        });

        rows.push({
          statRaw: entry.stat,
          scope: entry.scope || '',
          rate,
          rateText: `${(rate * 100).toFixed(4)}%`,
          label: parsed.label,
          value: parsed.value,
          display: typeof formatPotentialLineDisplay === 'function'
            ? formatPotentialLineDisplay(parsed)
            : (parsed.value ? `${parsed.label} +${parsed.value}` : parsed.label),
        });
      });

      if (rows.length) {
        rows.sort((a, b) => b.rate - a.rate);
        sections.push({
          officialRank,
          rankLabel: POTENTIAL_INSPECT_OFFICIAL_LABELS[officialRank] || officialRank,
          internalRank,
          rateSum,
          rateSumText: `${(rateSum * 100).toFixed(4)}%`,
          rows
        });
      }
    });

    return { category, matchedGroupKey, sections, rateKey, eventId };
  },

  populateCubeSelect(config) {
    const cubeSelect = document.getElementById('ptInspectCubeSelect');
    if (!cubeSelect) return;

    const activeRateKey = this.getSelectedRateKey(config);
    this.rateKey = activeRateKey;

    cubeSelect.innerHTML = config.cubes.map((cube) => `
      <option value="${cube.rateKey}" ${cube.rateKey === activeRateKey ? 'selected' : ''}>
        ${cube.name}
      </option>
    `).join('');
  },

  render() {
    const config = this.getConfig();
    const item = this.getCurrentItem();
    const titleEl = document.getElementById('ptInspectTitle');
    const metaEl = document.getElementById('ptInspectMeta');
    const bodyEl = document.getElementById('ptInspectBody');

    if (!bodyEl) return;

    this.populateCubeSelect(config);

    if (titleEl) titleEl.textContent = config.title;

    if (!item) {
      if (metaEl) metaEl.textContent = '請先放置裝備';
      bodyEl.innerHTML = '<div class="pt-inspect-empty">尚未載入裝備，無法查詢詞條池。</div>';
      return;
    }

    const rateKey = this.getSelectedRateKey(config);
    const data = this.buildInspectData(item, this.mode, rateKey);
    const cubeName = config.cubes.find((cube) => cube.rateKey === rateKey)?.name || rateKey;
    const tierNote = item.weaponTier === 'destiny' ? ' · 命運武器' : '';

    if (metaEl) {
      metaEl.textContent = [
        `裝備：Lv.${item.reqLevel} ${item.name}${tierNote}`,
        `分類：${data.category.major} / ${data.category.minor}`,
        `對應表：${data.matchedGroupKey || '未找到'}`,
        `方塊：${cubeName} · Event ${data.eventId}`
      ].join('\n');
    }

    if (!data.sections.length) {
      bodyEl.innerHTML = '<div class="pt-inspect-empty">此裝備在目前方塊設定下找不到可洗詞條。</div>';
      return;
    }

    bodyEl.innerHTML = data.sections.map((section) => `
      <section class="pt-inspect-section">
        <div class="pt-inspect-section-head">
          <span class="pt-inspect-rank pt-inspect-rank-${section.internalRank}">${section.rankLabel}</span>
          <span class="pt-inspect-sum">機率合計 ${section.rateSumText}</span>
        </div>
        <table class="pt-inspect-table">
          <thead>
            <tr>
              <th>官方 stat</th>
              <th>顯示</th>
              <th>機率</th>
              <th>範圍</th>
            </tr>
          </thead>
          <tbody>
            ${section.rows.map((row) => `
              <tr>
                <td class="pt-inspect-stat">${escapeInspectHtml(row.statRaw)}</td>
                <td class="pt-inspect-display">${escapeInspectHtml(row.display)}</td>
                <td class="pt-inspect-rate">${row.rateText}</td>
                <td class="pt-inspect-scope">${escapeInspectHtml(row.scope)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </section>
    `).join('');
  },

  open() {
    const cat = this.getActiveCategory();
    if (!cat) return;

    this.mode = cat;
    const config = this.getConfig();
    this.rateKey = this.getSelectedCubeRateKey(config);

    const overlay = document.getElementById('ptInspectOverlay');
    if (overlay) overlay.classList.remove('hidden');

    this.isOpen = true;
    this.render();
  },

  close() {
    const overlay = document.getElementById('ptInspectOverlay');
    if (overlay) overlay.classList.add('hidden');
    this.isOpen = false;
  }
};

function escapeInspectHtml(text) {
  return String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
