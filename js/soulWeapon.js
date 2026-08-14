/**
 * 瑪麗西亞靈魂保珠可骰出詞條（機率均等）
 * value：數值；unit：'%' | 'text'
 * display：formatSoulOption →「標籤 +N%」或完整文案
 */
const MARISHIA_SOUL_GEM_OPTIONS = [
  { label: '全屬性', value: 7, unit: '%' },
  { label: '無視怪物防禦率', value: 30, unit: '%' },
  { label: '攻擊Boss怪物時傷害', value: 20, unit: '%' },
  { label: '傷害', value: 10, unit: '%' },
  { label: '物理攻擊力', value: 10, unit: '%' },
  { label: '魔法攻擊力', value: 10, unit: '%' },
  { label: '爆擊機率', value: 10, unit: '%' },
  { label: '4轉以下技能等級 +1 (只增加到最高等級)', value: 1, unit: 'text' },
  { label: '被擊中時有5% 機率無視 20% 傷害', value: 20, unit: 'text' },
  { label: '被擊時有2%機率在7秒間無敵', value: 7, unit: 'text' },
  { label: '全屬性', value: 4, unit: '%' },
  { label: '無視怪物防禦率', value: 15, unit: '%' },
  { label: '傷害', value: 7, unit: '%' },
  { label: '物理攻擊力', value: 7, unit: '%' },
  { label: '魔法攻擊力', value: 7, unit: '%' },
  { label: '爆擊機率', value: 8, unit: '%' },
  { label: 'STR', value: 9, unit: '%' },
  { label: 'MaxHP', value: 6, unit: '%' },
  { label: 'INT', value: 9, unit: '%' },
  { label: 'MaxMP', value: 6, unit: '%' },
  { label: 'STR', value: 10, unit: '%' },
  { label: 'DEX', value: 10, unit: '%' },
  { label: 'INT', value: 10, unit: '%' },
  { label: 'LUK', value: 10, unit: '%' },
  { label: 'STR', value: 7, unit: '%' },
  { label: 'DEX', value: 7, unit: '%' },
  { label: 'INT', value: 7, unit: '%' },
  { label: 'LUK', value: 7, unit: '%' },
];

/**
 * SoulWeaponModule - 靈魂武器頁面（靈魂卷軸 / 靈魂保珠）
 *
 * 模式：
 * - enchanter：武器尚未注入靈魂 → 使用靈魂卷軸
 * - soul：已注入 → 賦予瑪麗西亞靈魂保珠
 */
const SoulWeaponModule = {
  itemData: null,
  selectedMaterialId: null,
  busy: false,

  MATERIALS: {
    enchanter: [
      {
        id: 'soul_scroll',
        name: '靈魂卷軸',
        kind: 'enchanter',
        icon: 'images/SoulWeapon/SoulScroll.png',
      },
    ],
    soul: [
      {
        id: 'marishia_soulgem',
        name: '瑪麗西亞靈魂保珠',
        kind: 'soul',
        grade: 'magnificent',
        label: '瑪麗西亞靈魂寶珠',
        icon: 'images/SoulWeapon/MarishiaSoulgem.png',
        hover: 'images/SoulWeapon/MarishiaSoulgem_hover.png',
      },
    ],
  },

  loadEquip(item) {
    const sameSlot = this.itemData
      && item
      && this.itemData.slotIndex != null
      && this.itemData.slotIndex === item.slotIndex;
    this.itemData = item;
    // 同一件裝備刷新時保留選取，避免賦予後被清掉
    if (!sameSlot) this.selectedMaterialId = null;
    this.hideSoulGemHover();
    this.ensureSoulState(item);
    this.updateUI();
  },

  resetState() {
    this.itemData = null;
    this.selectedMaterialId = null;
    this.busy = false;
    this.hideSoulGemHover();
    this.hideSoulOptionsTooltip();
    this.updateUI();
  },

  ensureSoulState(item) {
    if (!item) return;
    if (!item.soul) {
      item.soul = {
        enchanterApplied: Boolean(item.soulEnchanterApplied),
        grade: item.soulGrade || null,
        name: item.soulName || '',
        option: item.soulOption || null,
        stats: item.soulStats || null,
      };
    } else if (!('option' in item.soul)) {
      item.soul.option = item.soulOption || null;
    }
  },

  rollSoulGemOption() {
    const pool = MARISHIA_SOUL_GEM_OPTIONS;
    if (!pool.length) return null;
    const idx = Math.floor(Math.random() * pool.length);
    const picked = pool[idx];
    return {
      index: idx,
      label: picked.label,
      value: picked.value,
      unit: picked.unit || '%',
    };
  },

  /** 以 index 對齊最新正名（相容舊存檔） */
  normalizeSoulOption(option) {
    if (!option) return null;
    const idx = Number(option.index);
    if (Number.isInteger(idx) && MARISHIA_SOUL_GEM_OPTIONS[idx]) {
      const canon = MARISHIA_SOUL_GEM_OPTIONS[idx];
      return {
        index: idx,
        label: canon.label,
        value: canon.value,
        unit: canon.unit || '%',
      };
    }
    return option;
  },

  formatSoulOption(option) {
    const opt = this.normalizeSoulOption(option);
    if (!opt) return '';
    const { label, value, unit } = opt;
    if (unit === 'text' || unit === 'lv') return String(label || '');
    const name = String(label || '').replace(/%$/, '');
    if (unit === '%') return `${name} +${value}%`;
    return `${name} +${value}`;
  },

  getSoulOptionDisplayList() {
    return MARISHIA_SOUL_GEM_OPTIONS.map((opt, index) => this.formatSoulOption({
      index,
      label: opt.label,
      value: opt.value,
      unit: opt.unit,
    }));
  },

  isSoulWeaponEligible(item = this.itemData) {
    if (!item) return false;
    if (typeof isEnhancementLockedItem === 'function' && isEnhancementLockedItem(item)) {
      return false;
    }
    if (typeof isAtlasOffHandWeapon === 'function' && isAtlasOffHandWeapon(item)) {
      return false;
    }
    return item.mainType === 'weapon' || item.islot === 'Wp' || item.islot === 'Wpsi';
  },

  getMode() {
    if (!this.itemData) return 'idle';
    if (!this.isSoulWeaponEligible()) return 'blocked';
    return this.itemData.soul?.enchanterApplied ? 'soul' : 'enchanter';
  },

  setPanelMode(mode) {
    const idlePanel = document.getElementById('swIdlePanel');
    const activePanel = document.getElementById('swActivePanel');
    const blockedMsg = document.getElementById('swBlockedMessage');
    const isIdle = mode === 'idle';
    const isBlocked = mode === 'blocked';

    if (idlePanel) idlePanel.classList.toggle('hidden', !isIdle && !isBlocked);
    if (activePanel) activePanel.classList.toggle('hidden', isIdle || isBlocked);
    if (blockedMsg) blockedMsg.classList.toggle('hidden', !isBlocked);

    if (typeof syncMainPanelIdleState === 'function') {
      syncMainPanelIdleState();
    }
    this.updateConfirmButtonState();
  },

  getSelectedMaterial() {
    const mode = this.getMode();
    if (mode !== 'enchanter' && mode !== 'soul') return null;
    const list = this.MATERIALS[mode] || [];
    return list.find((m) => m.id === this.selectedMaterialId) || null;
  },

  selectMaterial(id) {
    if (!this.itemData || this.busy) return;
    if (typeof SoulWeaponEffectModule !== 'undefined' && SoulWeaponEffectModule.isPlaying()) return;
    this.selectedMaterialId = id;
    this.renderMaterialGrid();
    this.renderDetail();
    this.updateConfirmButtonState();
  },

  initMaterialGridHover() {
    const grid = document.getElementById('swMaterialGrid');
    if (!grid || grid.dataset.tooltipReady === '1') return;

    grid.addEventListener('mouseover', (event) => {
      const slot = event.target.closest('.sw-mat-slot[data-material-id]');
      if (!slot || grid._tooltipSlot === slot) return;
      grid._tooltipSlot = slot;
      const mat = this.findMaterialById(slot.dataset.materialId);
      if (mat?.hover) this.showSoulGemHover(slot, mat);
      else this.hideSoulGemHover();
    });

    grid.addEventListener('mouseout', (event) => {
      const slot = event.target.closest('.sw-mat-slot[data-material-id]');
      if (!slot) return;
      const related = event.relatedTarget;
      if (related instanceof Node && slot.contains(related)) return;
      if (grid._tooltipSlot === slot) {
        grid._tooltipSlot = null;
        this.hideSoulGemHover();
      }
    });

    grid.addEventListener('mouseleave', () => {
      grid._tooltipSlot = null;
      this.hideSoulGemHover();
    });

    grid.dataset.tooltipReady = '1';
  },

  findMaterialById(id) {
    if (!id) return null;
    return [...this.MATERIALS.enchanter, ...this.MATERIALS.soul]
      .find((m) => m.id === id) || null;
  },

  showSoulGemHover(slot, mat) {
    const tooltip = document.getElementById('swSoulGemTooltip');
    const img = document.getElementById('swSoulGemTooltipImg');
    if (!tooltip || !img || !mat?.hover) return;

    img.src = mat.hover;
    img.alt = mat.name || '靈魂寶珠';
    tooltip.classList.remove('hidden');
    tooltip.setAttribute('aria-hidden', 'false');

    const positionTooltip = () => {
      const rect = slot.getBoundingClientRect();
      const gap = 8;
      let left = rect.left - tooltip.offsetWidth - gap;
      let top = rect.top;

      if (left < 8) left = rect.right + gap;

      const maxTop = window.innerHeight - tooltip.offsetHeight - 8;
      if (top > maxTop) top = Math.max(8, maxTop);
      if (top < 8) top = 8;

      tooltip.style.left = `${left}px`;
      tooltip.style.top = `${top}px`;
    };

    if (img.complete) positionTooltip();
    else {
      img.onload = () => {
        img.onload = null;
        positionTooltip();
      };
    }
  },

  hideSoulGemHover() {
    const tooltip = document.getElementById('swSoulGemTooltip');
    const img = document.getElementById('swSoulGemTooltipImg');
    if (img) {
      img.removeAttribute('src');
      img.alt = '';
    }
    if (!tooltip) return;
    tooltip.classList.add('hidden');
    tooltip.setAttribute('aria-hidden', 'true');
    tooltip.style.removeProperty('left');
    tooltip.style.removeProperty('top');
  },

  initSoulOptionsNotice() {
    const btn = document.getElementById('swSoulOptionsNotice');
    if (!btn || btn.dataset.bound === '1') return;
    btn.dataset.bound = '1';
    btn.addEventListener('mouseenter', () => this.showSoulOptionsTooltip(btn));
    btn.addEventListener('mouseleave', () => this.hideSoulOptionsTooltip());
    btn.addEventListener('focus', () => this.showSoulOptionsTooltip(btn));
    btn.addEventListener('blur', () => this.hideSoulOptionsTooltip());
  },

  showSoulOptionsTooltip(anchor) {
    const tip = document.getElementById('swSoulOptionsTooltip');
    const list = document.getElementById('swSoulOptionsTooltipList');
    if (!tip || !list || !anchor) return;

    const lines = this.getSoulOptionDisplayList();
    list.textContent = lines.join('\n');
    tip.classList.remove('hidden');
    tip.setAttribute('aria-hidden', 'false');

    const rect = anchor.getBoundingClientRect();
    const tipW = tip.offsetWidth || 280;
    const tipH = tip.offsetHeight || 420;
    let left = rect.right + 8;
    let top = rect.top - 8;
    if (left + tipW > window.innerWidth - 8) {
      left = Math.max(8, rect.left - tipW - 8);
    }
    if (top + tipH > window.innerHeight - 8) {
      top = Math.max(8, window.innerHeight - tipH - 8);
    }
    tip.style.left = `${Math.round(left)}px`;
    tip.style.top = `${Math.round(top)}px`;
  },

  hideSoulOptionsTooltip() {
    const tip = document.getElementById('swSoulOptionsTooltip');
    if (!tip) return;
    tip.classList.add('hidden');
    tip.setAttribute('aria-hidden', 'true');
    tip.style.removeProperty('left');
    tip.style.removeProperty('top');
  },

  updateUI() {
    if (!this.itemData) {
      this.setPanelMode('idle');
      this.renderIdle();
      return;
    }

    if (!this.isSoulWeaponEligible()) {
      this.setPanelMode('blocked');
      return;
    }

    this.setPanelMode('active');
    this.renderActive();
  },

  renderIdle() {
    // idle art handled by CSS
  },

  renderActive() {
    const mode = this.getMode();
    const root = document.getElementById('swActivePanel');
    if (root) {
      root.dataset.mode = mode;
      root.classList.toggle('sw-mode-enchanter', mode === 'enchanter');
      root.classList.toggle('sw-mode-soul', mode === 'soul');
    }

    this.renderSummary();
    this.renderDetail();
    this.renderMaterialGrid();
    this.updateConfirmButtons();
    this.updateConfirmButtonState();
  },

  renderSummary() {
    const notSoul = document.getElementById('swSummaryNotSoul');
    const soulBox = document.getElementById('swSummarySoul');
    const soulText = document.getElementById('swSummaryText');
    const mode = this.getMode();

    if (mode === 'enchanter') {
      notSoul?.classList.remove('hidden');
      soulBox?.classList.add('hidden');
      return;
    }

    notSoul?.classList.add('hidden');
    soulBox?.classList.remove('hidden');
    if (soulText) {
      const soul = this.itemData?.soul;
      let name = soul?.name || '尚未賦予靈魂';
      if (name === '瑪麗西亞靈魂') name = '瑪麗西亞靈魂寶珠';
      soulText.textContent = name;
      soulText.classList.toggle('sw-summary-magnificent', soul?.grade === 'magnificent');
      soulText.classList.toggle('sw-summary-normal', soul?.grade !== 'magnificent');
    }
  },

  renderDetail() {
    const mode = this.getMode();
    const enchanterDetail = document.getElementById('swDetailEnchanter');
    const soulDetail = document.getElementById('swDetailSoul');
    const waitItem = document.getElementById('swWaitItem');
    const selected = this.getSelectedMaterial();

    enchanterDetail?.classList.toggle('hidden', mode !== 'enchanter');
    soulDetail?.classList.toggle('hidden', mode !== 'soul');

    if (waitItem) {
      const hasMats = ((mode === 'enchanter' || mode === 'soul')
        ? (this.MATERIALS[mode] || [])
        : []).length > 0;
      // 有可選素材時顯示格子；無素材時顯示 waitItem 提示圖
      waitItem.classList.toggle('hidden', hasMats || Boolean(selected));
      waitItem.classList.toggle('sw-wait-enchanter', mode === 'enchanter');
      waitItem.classList.toggle('sw-wait-soul', mode === 'soul');
    }

    if (mode === 'enchanter') {
      const prob = document.getElementById('swEnchanterProb');
      if (prob) prob.textContent = selected ? '100%' : '-';
      return;
    }

    const beforeEl = document.getElementById('swSoulStatBefore');
    const afterEl = document.getElementById('swSoulStatAfter');
    const magText = document.getElementById('swMagnificentText');
    const current = this.itemData?.soul;
    let before = '無';
    if (current?.option) {
      before = this.formatSoulOption(current.option);
    } else if (current?.stats) {
      before = this.formatSoulStats(current.stats);
    }

    // 選擇寶珠時只顯示既有屬性，不預覽變更數值
    if (beforeEl) beforeEl.textContent = before;
    if (afterEl) {
      afterEl.textContent = '';
      afterEl.classList.add('hidden');
    }
    // 瑪麗西亞（偉大）說明圖含驚嘆號：靈魂模式皆顯示
    magText?.classList.toggle('hidden', mode !== 'soul');
    if (mode !== 'soul') this.hideSoulOptionsTooltip();
    this.initSoulOptionsNotice();
  },

  formatSoulStats(stats) {
    if (!stats) return '-';
    if (stats.label != null && stats.value != null) {
      return this.formatSoulOption(stats);
    }
    const parts = [];
    if (stats.pad) parts.push(`攻擊力 +${stats.pad}`);
    if (stats.mad) parts.push(`魔力 +${stats.mad}`);
    if (stats.bdR) parts.push(`BOSS傷害 +${stats.bdR}%`);
    return parts.join('\n') || '-';
  },

  renderMaterialGrid() {
    const grid = document.getElementById('swMaterialGrid');
    const nameEl = document.getElementById('swSelectedName');
    if (!grid) return;

    this.initMaterialGridHover();

    const mode = this.getMode();
    const list = (mode === 'enchanter' || mode === 'soul')
      ? (this.MATERIALS[mode] || [])
      : [];

    grid.innerHTML = '';
    const totalSlots = 18;
    for (let i = 0; i < totalSlots; i += 1) {
      const mat = list[i];
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'sw-mat-slot';
      btn.dataset.slotIndex = String(i);
      if (mat) {
        btn.dataset.materialId = mat.id;
        if (mat.id === this.selectedMaterialId) btn.classList.add('selected');
        const img = document.createElement('img');
        img.className = 'sw-mat-icon';
        img.src = mat.icon;
        img.alt = mat.name;
        img.draggable = false;
        btn.appendChild(img);
        btn.onclick = () => this.selectMaterial(mat.id);
      }
      grid.appendChild(btn);
    }

    if (nameEl) {
      nameEl.textContent = this.getSelectedMaterial()?.name || '';
    }
  },

  updateConfirmButtons() {
    const mode = this.getMode();
    const btnEnchanter = document.getElementById('btnSoulEnchanter');
    const btnSoul = document.getElementById('btnSoulApply');
    btnEnchanter?.classList.toggle('hidden', mode !== 'enchanter');
    btnSoul?.classList.toggle('hidden', mode !== 'soul');
  },

  updateConfirmButtonState() {
    const playing = typeof SoulWeaponEffectModule !== 'undefined'
      && SoulWeaponEffectModule.isPlaying();
    const selected = this.getSelectedMaterial();
    const can = Boolean(this.itemData)
      && this.isSoulWeaponEligible()
      && Boolean(selected)
      && !this.busy
      && !playing;

    const btnEnchanter = document.getElementById('btnSoulEnchanter');
    const btnSoul = document.getElementById('btnSoulApply');
    if (btnEnchanter) btnEnchanter.disabled = !can || this.getMode() !== 'enchanter';
    if (btnSoul) btnSoul.disabled = !can || this.getMode() !== 'soul';
  },

  handleConfirmClick() {
    const mode = this.getMode();
    if (mode === 'enchanter') this.applyEnchanter();
    else if (mode === 'soul') this.applySoul();
  },

  applyEnchanter() {
    const mat = this.getSelectedMaterial();
    if (!mat || mat.kind !== 'enchanter' || !this.itemData) return;
    if (this.busy) return;

    this.busy = true;
    this.updateConfirmButtonState();

    const apply = () => {
      this.ensureSoulState(this.itemData);
      this.itemData.soul.enchanterApplied = true;
      this.itemData.soulEnchanterApplied = true;
      this.selectedMaterialId = null;
      this.busy = false;
      this.hideSoulGemHover();
      addLog(`[靈魂武器] 【${this.itemData.name}】已使用靈魂卷軸！`, 'log-success');
      this.updateUI();
      if (typeof updateStatusPanel === 'function') updateStatusPanel();
      if (typeof saveInventoryItemState === 'function' && this.itemData.slotIndex != null) {
        saveInventoryItemState(this.itemData.slotIndex, this.itemData);
      }
    };

    if (typeof SoulWeaponEffectModule !== 'undefined') {
      SoulWeaponEffectModule.runWithAnim({
        branch: 'enchanter',
        success: true,
        fn: apply,
      });
    } else {
      apply();
    }
  },

  applySoul() {
    const mat = this.getSelectedMaterial();
    if (!mat || mat.kind !== 'soul' || !this.itemData) return;
    if (this.busy) return;

    this.busy = true;
    this.updateConfirmButtonState();

    const rolled = this.rollSoulGemOption();

    const apply = () => {
      this.ensureSoulState(this.itemData);
      this.itemData.soul.grade = mat.grade || 'magnificent';
      this.itemData.soul.name = mat.label || mat.name;
      this.itemData.soul.option = rolled;
      this.itemData.soul.stats = rolled
        ? { label: rolled.label, value: rolled.value, unit: rolled.unit }
        : null;
      this.itemData.soulGrade = this.itemData.soul.grade;
      this.itemData.soulName = this.itemData.soul.name;
      this.itemData.soulOption = this.itemData.soul.option;
      this.itemData.soulStats = this.itemData.soul.stats;
      // 保留選取，可連續賦予
      this.busy = false;
      this.hideSoulGemHover();
      if (typeof trackCostUsage === 'function') {
        trackCostUsage('marishiaSoulGem');
      }
      const optText = rolled ? this.formatSoulOption(rolled) : '';
      addLog(
        `[靈魂武器] 已賦予【${mat.name}】${optText ? `：${optText}` : ''}`,
        'log-success'
      );
      this.updateUI();
      if (typeof updateStatusPanel === 'function') updateStatusPanel();
      if (typeof saveInventoryItemState === 'function' && this.itemData.slotIndex != null) {
        saveInventoryItemState(this.itemData.slotIndex, this.itemData);
      }
    };

    if (typeof SoulWeaponEffectModule !== 'undefined') {
      SoulWeaponEffectModule.runWithAnim({
        branch: 'soul',
        success: true,
        soulGrade: mat.grade || 'magnificent',
        fn: apply,
      });
    } else {
      apply();
    }
  },
};

function canUseSoulWeapon(item) {
  return SoulWeaponModule.isSoulWeaponEligible(item);
}
