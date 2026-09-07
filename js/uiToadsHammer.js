/**
 * 蟾蜍鐵鎚／裝備繼承（UIWindow4 ToadsHammer）
 * Phase1+2：主面板 + 圖1抽取 → 圖2繼承 → 圖3確認前（無 popup／特效）
 */
const UiToadsHammer = (() => {
  const A = 'images/toadshammer/ToadsHammer__main__';
  const ASSET = {
    backgrnd: `${A}backgrnd.png`,
    cover: `${A}cover.png`,
    guide1: `${A}layer_guide1.png`,
    guide2: `${A}layer_guide2.png`,
    guide3: `${A}layer_guide3.png`,
    noExtraction: `${A}layer_NoExtraction.png`,
    noTransfer: `${A}layer_NoTransfer.png`,
    extractionChoice: `${A}layer_ExtractionChoice.png`,
    transferChoice: `${A}layer_TransferChoice.png`,
    banner1: `${A}layer_banner1.png`,
    banner2: `${A}layer_banner2.png`,
    banner3: `${A}layer_banner3.png`,
    banner4: `${A}layer_banner4.png`,
    banner5: `${A}layer_banner5.png`,
    banner6: `${A}layer_banner6.png`,
    banner7: `${A}layer_banner7.png`,
    disable: `${A}disable.png`,
  };

  const BANNER_POS = {
    banner1: { left: 159, top: 437 },
    banner2: { left: 87, top: 437 },
    banner3: { left: 79, top: 437 },
    banner4: { left: 114, top: 437 },
    banner5: { left: 93, top: 437 },
    banner6: { left: 91, top: 437 },
    banner7: { left: 160, top: 437 },
  };

  const TRANSFER_KEYS = [
    'star', 'starConsecutiveDrops',
    'scrollUsed', 'scrollFailUses', 'scrollSlotResults',
    'scrollStat', 'scrollAtk', 'scrollMatk',
    'scrollStr', 'scrollDex', 'scrollInt', 'scrollLuk',
    'scrollDef', 'scrollHp', 'scrollMp', 'scrollSpeed', 'scrollJump',
    'scrollDamR', 'scrollBdR', 'scrollImdR', 'scrollAllStatR',
    'catValleyLevel', 'medalEnhanceLevel', 'medalEnhanceStarted',
    'catValleyTotemStarted', 'catValleyJackpotMain', 'catValleyJackpotAdd',
    'goldenHammerUsed', 'platinumHammerUsed',
    'potential', 'additionalPotential', 'bonusStat',
    'soul', 'soulEnchanterApplied', 'soulGrade', 'soulName', 'soulOption', 'soulStats',
    'exceptional',
  ];

  const GRADE_RANK = { rare: 1, epic: 2, unique: 3, legendary: 4, mythic: 5 };
  const GRID_COLS = 4;
  const GRID_ROWS = 3;
  const GRID_PAGE = GRID_COLS * GRID_ROWS;

  let inited = false;
  let open = false;
  let onlyExtractable = false;
  let sourceSlot = -1;
  let targetSlot = -1;
  let sourcePage = 0;
  let targetPage = 0;

  function $(id) {
    return document.getElementById(id);
  }

  function isWearSlotKey(slot) {
    return typeof slot === 'string' && slot.startsWith('body:');
  }

  function wearSlotKey(slotId) {
    return `body:${String(slotId)}`;
  }

  function isSlotUnset(slot) {
    return slot == null || slot === -1 || slot === '';
  }

  function parseSlotKey(raw) {
    const text = String(raw ?? '');
    if (!text) return -1;
    if (text.startsWith('body:')) return text;
    const n = Number(text);
    return Number.isInteger(n) && n >= 0 ? n : -1;
  }

  function canUseToadsHammer(itemId) {
    const data = typeof ITEM_DATABASE !== 'undefined' ? ITEM_DATABASE[itemId] : null;
    if (!data) return false;
    if (data.exceptToadsHammer) return false;
    // 尊貴裝備（Superior／暴君等）不可使用蟾蜍鐵鎚
    if (typeof isSuperiorStarForceItem === 'function' && isSuperiorStarForceItem(data)) return false;
    if (data.superiorEqp || data.superiorStarForce) return false;
    if (typeof isEnhancementLockedItem === 'function' && isEnhancementLockedItem(data)) return false;
    return true;
  }

  function loadSlotState(slotIndex) {
    if (isWearSlotKey(slotIndex)) {
      const uiSlot = slotIndex.slice(5);
      const entry = typeof UiEquipModule !== 'undefined'
        ? UiEquipModule.getWornEntry?.(uiSlot)
        : null;
      if (!entry?.itemId) return null;
      const template = ITEM_DATABASE?.[entry.itemId];
      if (!template) return null;
      let state = entry.state;
      if (!state && typeof createEnchantState === 'function') {
        state = createEnchantState(template, slotIndex);
      }
      if (!state) return null;
      const merged = typeof cloneEnchantState === 'function'
        ? { ...cloneEnchantState(state), slotIndex, itemId: entry.itemId, id: entry.itemId }
        : { ...JSON.parse(JSON.stringify(state)), slotIndex, itemId: entry.itemId, id: entry.itemId };
      return {
        ...template,
        ...merged,
        name: template.name,
        icon: template.icon,
        islot: template.islot,
        reqLevel: template.reqLevel,
      };
    }
    const itemId = typeof playerInventoryEquip !== 'undefined' ? playerInventoryEquip[slotIndex] : null;
    if (!itemId) return null;
    if (typeof loadEnchantStateForSlot === 'function') {
      return loadEnchantStateForSlot(itemId, slotIndex);
    }
    const template = ITEM_DATABASE?.[itemId];
    if (!template) return null;
    const saved = playerInventoryState?.[slotIndex];
    return saved && saved.itemId === itemId
      ? { ...template, ...JSON.parse(JSON.stringify(saved)), slotIndex, itemId }
      : (typeof createEnchantState === 'function' ? createEnchantState(template, slotIndex) : null);
  }

  function hasExtractableProgress(state) {
    if (!state) return false;
    if ((state.star || 0) > 0) return true;
    if ((state.scrollUsed || 0) > 0) return true;
    if ((state.goldenHammerUsed || 0) > 0 || (state.platinumHammerUsed || 0) > 0) return true;
    if ((state.catValleyLevel || 0) > 0 || (state.medalEnhanceLevel || 0) > 0) return true;
    if ((state.exceptional?.level || 0) > 0) return true;
    const lines = state.potential?.lines || state.potential?.options;
    if (Array.isArray(lines) && lines.some((l) => l && (l.id || l.stat || l.value))) return true;
    const add = state.additionalPotential?.lines || state.additionalPotential?.options;
    if (Array.isArray(add) && add.some((l) => l && (l.id || l.stat || l.value))) return true;
    if (state.bonusStat && Object.keys(state.bonusStat).length) {
      const vals = Object.values(state.bonusStat);
      if (vals.some((v) => v && typeof v === 'object' ? Object.values(v).some(Boolean) : Number(v) > 0)) return true;
    }
    if (state.soul?.option || state.soulOption) return true;
    return false;
  }

  function reqLevelOf(entryOrState) {
    return Number(entryOrState?.reqLevel ?? entryOrState?.state?.reqLevel ?? 0) || 0;
  }

  /** 同部位；≤119 可傳給高 1～20 等；>119 需同等級以上同部位 */
  function canInheritTo(src, dst) {
    if (!src || !dst) return false;
    if (String(src.islot || '') !== String(dst.islot || '')) return false;
    const sl = reqLevelOf(src);
    const dl = reqLevelOf(dst);
    if (sl <= 119) return dl >= sl && dl <= sl + 20;
    return dl >= sl;
  }

  function buildEquipEntry(slotIndex, itemId, state, { worn = false } = {}) {
    return {
      slotIndex,
      itemId,
      state,
      name: state.name || ITEM_DATABASE?.[itemId]?.name || itemId,
      icon: state.icon || ITEM_DATABASE?.[itemId]?.icon || `images/equip/${itemId}.png`,
      islot: state.islot || ITEM_DATABASE?.[itemId]?.islot || '',
      reqLevel: state.reqLevel || ITEM_DATABASE?.[itemId]?.reqLevel || 0,
      extractable: hasExtractableProgress(state),
      worn: !!worn,
    };
  }

  function listWornEquipEntries() {
    if (typeof UiEquipModule === 'undefined' || typeof UiEquipModule.getActiveWearEntries !== 'function') {
      return [];
    }
    const out = [];
    UiEquipModule.getActiveWearEntries().forEach((entry) => {
      const itemId = entry?.itemId;
      if (!itemId || !canUseToadsHammer(itemId)) return;
      const slotIndex = wearSlotKey(entry.slotId);
      const state = loadSlotState(slotIndex);
      if (!state) return;
      out.push(buildEquipEntry(slotIndex, itemId, state, { worn: true }));
    });
    return out;
  }

  function listBagEquipEntries() {
    const out = [];
    if (typeof playerInventoryEquip === 'undefined') return out;
    playerInventoryEquip.forEach((itemId, slotIndex) => {
      if (!itemId || !canUseToadsHammer(itemId)) return;
      const state = loadSlotState(slotIndex);
      if (!state) return;
      out.push(buildEquipEntry(slotIndex, itemId, state, { worn: false }));
    });
    return out;
  }

  function listEquipEntries() {
    return [...listWornEquipEntries(), ...listBagEquipEntries()];
  }

  function clampPotentialGrade(pot, maxGrade = 'unique') {
    if (!pot || typeof pot !== 'object') return pot;
    const maxRank = GRADE_RANK[maxGrade] || 3;
    const copy = JSON.parse(JSON.stringify(pot));
    const g = String(copy.grade || '').toLowerCase();
    if (g && (GRADE_RANK[g] || 0) > maxRank) copy.grade = maxGrade;
    return copy;
  }

  function ensureDom() {
    if ($('toadsHammerRoot')) return;
    const root = document.createElement('div');
    root.id = 'toadsHammerRoot';
    root.className = 'toads-hammer hidden';
    root.innerHTML = `
      <div class="toads-hammer-backdrop" data-th-close></div>
      <div class="toads-hammer-panel" id="toadsHammerPanel">
        <div class="toads-hammer-drag" id="toadsHammerDrag" title="拖曳裝備繼承"></div>
        <img class="th-backgrnd" src="${ASSET.backgrnd}" alt="">
        <img class="th-cover" src="${ASSET.cover}" alt="" aria-hidden="true">
        <img class="th-guide th-guide1" id="thGuide1" src="${ASSET.guide1}" alt="" aria-hidden="true">
        <img class="th-guide th-guide2" id="thGuide2" src="${ASSET.guide2}" alt="" aria-hidden="true">
        <img class="th-guide th-guide3" id="thGuide3" src="${ASSET.guide3}" alt="" aria-hidden="true">
        <img class="th-banner" id="thBanner" src="${ASSET.banner1}" alt="" aria-hidden="true">

        <button type="button" class="th-btn th-exit" id="thExit" aria-label="關閉" title="關閉"></button>
        <button type="button" class="th-btn th-help" id="thHelp" aria-label="說明" title="裝備繼承說明"></button>

        <div class="th-formula-slot th-formula-source" id="thFormulaSource"></div>
        <div class="th-formula-slot th-formula-target" id="thFormulaTarget"></div>
        <div class="th-formula-slot th-formula-result" id="thFormulaResult"></div>

        <img class="th-layer th-no-extract" id="thNoExtract" src="${ASSET.noExtraction}" alt="" aria-hidden="true">
        <img class="th-layer th-no-transfer" id="thNoTransfer" src="${ASSET.noTransfer}" alt="" aria-hidden="true">
        <img class="th-layer th-extract-choice hidden" id="thExtractChoice" src="${ASSET.extractionChoice}" alt="" aria-hidden="true">
        <img class="th-layer th-transfer-choice hidden" id="thTransferChoice" src="${ASSET.transferChoice}" alt="" aria-hidden="true">

        <div class="th-grid th-grid-source" id="thListSource"></div>
        <div class="th-grid th-grid-target" id="thListTarget"></div>
        <div class="th-scroll th-scroll-source" aria-hidden="true"></div>
        <div class="th-scroll th-scroll-target" aria-hidden="true"></div>

        <button type="button" class="th-check" id="thOnlyExtractable" aria-pressed="false" title="確認時只能查看可萃取的道具。" aria-label="僅查看可萃取的裝備"></button>

        <button type="button" class="th-btn th-confirm" id="thConfirm" aria-label="傳授" title="傳授"></button>
        <button type="button" class="th-btn th-cancel" id="thCancel" aria-label="取消" title="取消"></button>
      </div>
    `;
    document.body.appendChild(root);

    $('thExit')?.addEventListener('click', () => setOpen(false));
    root.querySelector('[data-th-close]')?.addEventListener('click', () => setOpen(false));
    $('thCancel')?.addEventListener('click', () => {
      if (!isSlotUnset(sourceSlot) || !isSlotUnset(targetSlot)) {
        sourceSlot = -1;
        targetSlot = -1;
        sourcePage = 0;
        targetPage = 0;
        render();
        return;
      }
      setOpen(false);
    });
    $('thHelp')?.addEventListener('click', () => {
      if (typeof addLog === 'function') {
        addLog('[裝備繼承] ① 左欄選抽取裝備 → ② 右欄選繼承裝備 → ③ 確認傳授。傳授後來源裝備會消失。', 'log-info');
      }
    });
    $('thOnlyExtractable')?.addEventListener('click', () => {
      onlyExtractable = !onlyExtractable;
      sourcePage = 0;
      render();
    });
    $('thConfirm')?.addEventListener('click', confirmTransfer);

    $('thListSource')?.addEventListener('wheel', (e) => {
      if (!isSlotUnset(sourceSlot)) return;
      e.preventDefault();
      sourcePage += e.deltaY > 0 ? 1 : -1;
      render();
    }, { passive: false });
    $('thListTarget')?.addEventListener('wheel', (e) => {
      if (isSlotUnset(sourceSlot)) return;
      e.preventDefault();
      targetPage += e.deltaY > 0 ? 1 : -1;
      render();
    }, { passive: false });

    bindTooltipHover($('thListSource'));
    bindTooltipHover($('thListTarget'));
    bindFormulaTooltip($('thFormulaSource'), () => ({ slotIndex: sourceSlot }));
    bindFormulaTooltip($('thFormulaTarget'), () => ({ slotIndex: targetSlot }));
    bindFormulaTooltip($('thFormulaResult'), () => {
      if (isSlotUnset(sourceSlot) || isSlotUnset(targetSlot)) return { slotIndex: -1 };
      const preview = buildInheritedPreview(loadSlotState(sourceSlot), loadSlotState(targetSlot));
      if (!preview) return { slotIndex: -1 };
      return { slotIndex: -1, itemId: preview.itemId, stateOverride: preview };
    });

    if (typeof PanelDrag !== 'undefined') {
      PanelDrag.enable($('toadsHammerPanel'), {
        handle: '#toadsHammerDrag',
        ignoreSelector: 'button, input, label, .th-grid, .th-check',
        storageKey: 'ui.drag.toadsHammer',
        title: '拖曳裝備繼承',
      });
    }
  }

  function clearTooltips() {
    const src = $('thListSource');
    const dst = $('thListTarget');
    if (src) src._eqTooltipSlot = null;
    if (dst) dst._eqTooltipSlot = null;
    ['thFormulaSource', 'thFormulaTarget', 'thFormulaResult'].forEach((id) => {
      const el = $(id);
      if (el) el._eqTooltipActive = false;
    });
    if (typeof EquipTooltipModule !== 'undefined') EquipTooltipModule.hide();
  }

  function bindTooltipHover(grid) {
    if (!grid || grid.dataset.eqTooltipReady) return;
    grid.addEventListener('mouseover', (event) => {
      if (typeof EquipTooltipModule === 'undefined') return;
      if (EquipTooltipModule.pinned || EquipTooltipModule.dragging) return;
      const cell = event.target.closest?.('.th-cell[data-slot]');
      if (!cell || grid._eqTooltipSlot === cell) return;
      const slotKey = parseSlotKey(cell.getAttribute('data-slot'));
      if (isSlotUnset(slotKey)) return;
      let itemId = '';
      if (isWearSlotKey(slotKey)) {
        itemId = UiEquipModule?.getWornEntry?.(slotKey.slice(5))?.itemId || '';
      } else {
        itemId = playerInventoryEquip?.[slotKey] || '';
      }
      if (!itemId || !ITEM_DATABASE?.[itemId]) return;
      grid._eqTooltipSlot = cell;
      EquipTooltipModule.show(cell, itemId, slotKey);
    });
    grid.addEventListener('mouseout', (event) => {
      if (typeof EquipTooltipModule === 'undefined') return;
      if (EquipTooltipModule.pinned) return;
      const cell = event.target.closest?.('.th-cell[data-slot]');
      if (!cell) return;
      const related = event.relatedTarget;
      if (related instanceof Node && cell.contains(related)) return;
      if (grid._eqTooltipSlot === cell) {
        grid._eqTooltipSlot = null;
        EquipTooltipModule.hide();
      }
    });
    grid.dataset.eqTooltipReady = '1';
  }

  function bindFormulaTooltip(el, getPayload) {
    if (!el || el.dataset.eqTooltipReady) return;
    el.style.pointerEvents = 'auto';
    el.addEventListener('mouseenter', () => {
      if (typeof EquipTooltipModule === 'undefined') return;
      if (EquipTooltipModule.pinned || EquipTooltipModule.dragging) return;
      const payload = typeof getPayload === 'function' ? getPayload() : null;
      if (!payload) return;
      const { slotIndex, stateOverride = null } = payload;
      const itemId = payload.itemId
        || (isWearSlotKey(slotIndex)
          ? UiEquipModule?.getWornEntry?.(slotIndex.slice(5))?.itemId
          : (Number.isInteger(slotIndex) && slotIndex >= 0 ? playerInventoryEquip?.[slotIndex] : null));
      if (!itemId || !ITEM_DATABASE?.[itemId]) return;
      if (!stateOverride && isSlotUnset(slotIndex)) return;
      el._eqTooltipActive = true;
      EquipTooltipModule.show(el, itemId, stateOverride ? -1 : slotIndex, stateOverride);
    });
    el.addEventListener('mouseleave', () => {
      if (typeof EquipTooltipModule === 'undefined') return;
      if (EquipTooltipModule.pinned) return;
      if (!el._eqTooltipActive) return;
      el._eqTooltipActive = false;
      EquipTooltipModule.hide();
    });
    el.dataset.eqTooltipReady = '1';
  }

  function destBaseUpgradeSlots(dst) {
    const n = Number(dst?.baseMaxUpgradeSlots ?? dst?.maxUpgradeSlots);
    return Number.isFinite(n) && n > 0 ? n : Math.max(0, Number(dst?.upgradeSlots) || 0);
  }

  /** 保留目標裝備本身的可強化次數，再加上繼承過來的鐵鎚額外次數 */
  function applyInheritedUpgradeSlots(nextDst, dst) {
    const destBase = destBaseUpgradeSlots(dst);
    const hammerBonus = (Number(nextDst.goldenHammerUsed) || 0)
      + (Number(nextDst.platinumHammerUsed) || 0);
    nextDst.baseMaxUpgradeSlots = destBase;
    nextDst.maxUpgradeSlots = destBase;
    nextDst.upgradeSlots = destBase + hammerBonus;
  }

  /** 預覽／實際繼承用：目標基底 + 來源強化 */
  function buildInheritedState(src, dst, { clampPotential = true } = {}) {
    if (!src || !dst) return null;
    const nextDst = typeof cloneEnchantState === 'function' ? cloneEnchantState(dst) : JSON.parse(JSON.stringify(dst));
    const srcClone = typeof cloneEnchantState === 'function' ? cloneEnchantState(src) : JSON.parse(JSON.stringify(src));
    TRANSFER_KEYS.forEach((k) => {
      if (Object.prototype.hasOwnProperty.call(srcClone, k)) {
        nextDst[k] = srcClone[k];
      }
    });
    applyInheritedUpgradeSlots(nextDst, dst);
    if (clampPotential) {
      if (nextDst.potential) nextDst.potential = clampPotentialGrade(nextDst.potential, 'unique');
      if (nextDst.additionalPotential) {
        nextDst.additionalPotential = clampPotentialGrade(nextDst.additionalPotential, 'unique');
      }
    }
    nextDst.itemId = dst.itemId;
    nextDst.slotIndex = dst.slotIndex;
    nextDst.name = dst.name;
    nextDst.icon = dst.icon;
    nextDst.islot = dst.islot;
    return nextDst;
  }

  /** 蟾蜍鐵鎚：潛能上限罕見 */
  function buildInheritedPreview(src, dst) {
    return buildInheritedState(src, dst, { clampPotential: true });
  }

  /**
   * 裝備進階：以成品目錄為基底，繼承來源強化（潛能完整保留）。
   * @param {object|null} srcState 來源強化狀態（可為 loadEnchantStateForSlot 結果）
   * @param {string} outputItemId 成品 itemId
   * @param {number} [slotIndex=-1]
   */
  function buildAdvanceInheritedState(srcState, outputItemId, slotIndex = -1) {
    const id = String(outputItemId || '');
    const template = typeof ITEM_DATABASE !== 'undefined' ? ITEM_DATABASE[id] : null;
    if (!template || typeof createEnchantState !== 'function') return null;

    const dst = createEnchantState(template, slotIndex);
    dst.itemId = id;
    dst.id = id;
    dst.name = template.name;
    dst.icon = template.icon;
    dst.islot = template.islot;
    dst.slotIndex = slotIndex;

    if (!srcState) return dst;
    return buildInheritedState(srcState, dst, { clampPotential: false });
  }

  function escapeHtml(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function pageSlice(entries, page) {
    const maxPage = Math.max(0, Math.ceil(entries.length / GRID_PAGE) - 1);
    const p = Math.max(0, Math.min(page, maxPage));
    return { page: p, maxPage, items: entries.slice(p * GRID_PAGE, p * GRID_PAGE + GRID_PAGE) };
  }

  function cellHtml(entry, selected, side) {
    if (!entry) {
      return '<div class="th-cell th-cell-empty" aria-hidden="true"></div>';
    }
    const star = entry.state?.star || 0;
    const blocked = side === 'source' && !entry.extractable;
    const cls = [
      'th-cell',
      selected ? 'is-on' : '',
      blocked ? 'is-disabled' : '',
    ].filter(Boolean).join(' ');
    return `
      <button type="button" class="${cls}" data-th-side="${side}" data-slot="${entry.slotIndex}" data-blocked="${blocked ? '1' : '0'}" title="${escapeHtml(entry.name)}"${blocked ? ' disabled' : ''}>
        ${blocked ? `<span class="th-disable" aria-hidden="true"></span>` : ''}
        <img src="${escapeHtml(entry.icon)}" alt="" draggable="false">
        ${entry.worn ? '<span class="th-e">E</span>' : ''}
        ${star > 0 ? `<span class="th-star">★${star}</span>` : ''}
      </button>
    `;
  }

  function fillGrid(listEl, entries, page, selectedSlot, side, interactive) {
    if (!listEl) return 0;
    const sliced = pageSlice(entries, page);
    const cells = [];
    for (let i = 0; i < GRID_PAGE; i += 1) {
      const entry = sliced.items[i] || null;
      cells.push(cellHtml(entry, entry && entry.slotIndex === selectedSlot, side));
    }
    listEl.innerHTML = cells.join('');
    listEl.classList.toggle('is-locked', !interactive);
    if (interactive) {
      listEl.querySelectorAll('[data-slot]').forEach((btn) => {
        btn.addEventListener('click', () => {
          if (btn.getAttribute('data-blocked') === '1' || btn.disabled) return;
          const slot = parseSlotKey(btn.getAttribute('data-slot'));
          if (isSlotUnset(slot)) return;
          const sideName = btn.getAttribute('data-th-side');
          if (sideName === 'source') {
            sourceSlot = slot;
            targetSlot = -1;
            targetPage = 0;
          } else {
            if (slot === sourceSlot) return;
            targetSlot = slot;
          }
          render();
        });
      });
    }
    return sliced.page;
  }

  function formulaIcon(slot) {
    if (isSlotUnset(slot)) return '';
    const state = loadSlotState(slot);
    if (!state) return '';
    const icon = state.icon || `images/equip/${state.itemId}.png`;
    return `<img src="${escapeHtml(icon)}" alt="">`;
  }

  function setBanner(key) {
    const el = $('thBanner');
    if (!el || !ASSET[key]) return;
    el.src = ASSET[key];
    const pos = BANNER_POS[key] || BANNER_POS.banner1;
    el.style.left = `${pos.left}px`;
    el.style.top = `${pos.top}px`;
  }

  function render() {
    if (!open) return;
    ensureDom();
    // 選取後會重建格子，mouseout 不會觸發 → 先清掉卡住的 tooltip
    clearTooltips();
    const entries = listEquipEntries();
    const sourceEntries = onlyExtractable ? entries.filter((e) => e.extractable) : entries;
    const srcState = !isSlotUnset(sourceSlot) ? loadSlotState(sourceSlot) : null;
    const targetEntries = srcState
      ? entries.filter((e) => e.slotIndex !== sourceSlot && canInheritTo(srcState, e))
      : [];

    // 圖1：左可選；圖2 起左鎖右開
    const pickingSource = isSlotUnset(sourceSlot);
    const pickingTarget = !isSlotUnset(sourceSlot) && isSlotUnset(targetSlot);
    const ready = !isSlotUnset(sourceSlot) && !isSlotUnset(targetSlot);

    sourcePage = fillGrid($('thListSource'), sourceEntries, sourcePage, sourceSlot, 'source', pickingSource);
    targetPage = fillGrid($('thListTarget'), targetEntries, targetPage, targetSlot, 'target', !pickingSource);

    // 疊圖：圖1 右 NoTransfer；圖2/3 左 TransferChoice（右欄保持可點選／可見）
    $('thNoExtract')?.classList.toggle('hidden', sourceEntries.length > 0 || !isSlotUnset(sourceSlot));
    $('thNoTransfer')?.classList.toggle('hidden', !pickingSource);
    $('thTransferChoice')?.classList.toggle('hidden', pickingSource);
    $('thExtractChoice')?.classList.add('hidden');

    // 選好抽取／繼承後，對應 guide 消失
    $('thGuide1')?.classList.toggle('hidden', !isSlotUnset(sourceSlot));
    $('thGuide2')?.classList.toggle('hidden', !isSlotUnset(targetSlot));
    $('thGuide3')?.classList.toggle('hidden', ready);

    const fs = $('thFormulaSource');
    const ft = $('thFormulaTarget');
    const fr = $('thFormulaResult');
    if (fs) fs.innerHTML = formulaIcon(sourceSlot);
    if (ft) ft.innerHTML = formulaIcon(targetSlot);
    if (fr) fr.innerHTML = ready ? formulaIcon(targetSlot) : '';

    // 橫幅：圖1 消失警告；圖2 等級規則；圖3 潛能上限
    if (ready) setBanner('banner3');
    else if (pickingTarget) setBanner('banner2');
    else setBanner('banner1');

    const canConfirm = ready && hasExtractableProgress(srcState);
    const confirm = $('thConfirm');
    if (confirm) {
      confirm.disabled = !canConfirm;
      confirm.classList.toggle('is-disabled', !canConfirm);
    }

    const checkBtn = $('thOnlyExtractable');
    if (checkBtn) {
      checkBtn.classList.toggle('is-on', onlyExtractable);
      checkBtn.setAttribute('aria-pressed', onlyExtractable ? 'true' : 'false');
    }
  }

  function applyInheritedStateToTarget(dstSlot, nextDst) {
    if (isWearSlotKey(dstSlot)) {
      const uiSlot = dstSlot.slice(5);
      if (typeof UiEquipModule !== 'undefined' && UiEquipModule.saveWornEntryState) {
        UiEquipModule.saveWornEntryState(uiSlot, nextDst);
        UiEquipModule.refresh?.();
      }
      return;
    }
    if (typeof saveInventoryItemState === 'function') {
      saveInventoryItemState(dstSlot, nextDst);
    } else {
      playerInventoryState[dstSlot] = nextDst;
    }
  }

  function discardSourceEquipment(srcSlot, srcItemId) {
    if (isWearSlotKey(srcSlot)) {
      if (typeof UiEquipModule !== 'undefined') {
        UiEquipModule.destroyWornItem?.(srcItemId, { refreshUi: true });
      }
      return;
    }
    if (typeof UiEquipModule !== 'undefined' && UiEquipModule.isItemWorn?.(srcItemId)) {
      UiEquipModule.unequipItemId?.(srcItemId, { refreshUi: false });
    }
    if (typeof InventoryModule !== 'undefined' && InventoryModule.removeEquipToCatalog) {
      InventoryModule.removeEquipToCatalog(srcSlot);
    } else {
      playerInventoryEquip[srcSlot] = null;
      playerInventoryState[srcSlot] = null;
    }
  }

  function confirmTransfer() {
    if (isSlotUnset(sourceSlot) || isSlotUnset(targetSlot) || sourceSlot === targetSlot) return;
    const src = loadSlotState(sourceSlot);
    const dst = loadSlotState(targetSlot);
    if (!src || !dst) return;
    if (!canInheritTo(src, dst)) {
      if (typeof addLog === 'function') addLog('[裝備繼承] 來源與目標不符合繼承條件（部位／等級）。', 'log-fail');
      return;
    }
    if (!hasExtractableProgress(src)) {
      if (typeof addLog === 'function') addLog('[裝備繼承] 來源沒有可繼承進度。', 'log-fail');
      return;
    }

    const srcSlot = sourceSlot;
    const dstSlot = targetSlot;
    const srcName = src.name;
    const dstName = dst.name;
    const srcItemId = src.itemId;

    if (typeof currentEnchantItem !== 'undefined' && currentEnchantItem
      && (currentEnchantItem.slotIndex === srcSlot || currentEnchantItem.slotIndex === dstSlot)
      && typeof saveInventoryItemState === 'function') {
      saveInventoryItemState(currentEnchantItem.slotIndex, currentEnchantItem);
    }

    const nextDst = buildInheritedPreview(src, dst);
    if (!nextDst) return;
    nextDst.slotIndex = dstSlot;

    applyInheritedStateToTarget(dstSlot, nextDst);

    // 遊戲規則：傳授能力的裝備會消失
    discardSourceEquipment(srcSlot, srcItemId);

    if (typeof currentEnchantItem !== 'undefined' && currentEnchantItem?.slotIndex === srcSlot) {
      currentEnchantItem = null;
      if (typeof updateUI === 'function') updateUI();
    }

    if (typeof currentEnchantItem !== 'undefined' && currentEnchantItem?.slotIndex === dstSlot) {
      const reloaded = loadSlotState(dstSlot);
      if (reloaded) {
        Object.assign(currentEnchantItem, reloaded);
        if (typeof syncEnchantStateToModules === 'function') syncEnchantStateToModules(currentEnchantItem);
        if (typeof updateUI === 'function') updateUI();
      }
    }

    if (typeof InventoryModule !== 'undefined') InventoryModule.render?.();
    if (typeof addLog === 'function') {
      addLog(`[裝備繼承] 已將【${srcName}】能力傳授至【${dstName}】，來源裝備已消失。`, 'log-success');
    }

    sourceSlot = -1;
    targetSlot = -1;
    sourcePage = 0;
    targetPage = 0;
    render();
  }

  function setOpen(next) {
    ensureDom();
    open = !!next;
    $('toadsHammerRoot')?.classList.toggle('hidden', !open);
    if (open) {
      sourceSlot = -1;
      targetSlot = -1;
      sourcePage = 0;
      targetPage = 0;
      render();
      if (typeof PanelDrag !== 'undefined') PanelDrag.bringFront($('toadsHammerPanel'));
    } else {
      clearTooltips();
    }
    if (typeof IdleHunt !== 'undefined') IdleHunt.syncBlockingPanelPause?.();
  }

  function toggle() {
    setOpen(!open);
  }

  function closeByEsc() {
    if (!open) return false;
    setOpen(false);
    return true;
  }

  function init() {
    if (inited) return;
    inited = true;
    ensureDom();
  }

  return {
    init,
    setOpen,
    toggle,
    isOpen: () => open,
    closeByEsc,
    render,
    buildAdvanceInheritedState,
    hasExtractableProgress,
  };
})();

if (typeof window !== 'undefined') {
  window.UiToadsHammer = UiToadsHammer;
  window.addEventListener('DOMContentLoaded', () => UiToadsHammer.init());
}
