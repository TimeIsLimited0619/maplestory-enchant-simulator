/**
 * 裝備製作側欄面板
 */
const EquipCraftPanel = (() => {
  let inited = false;
  let open = false;
  /**
   * hub | make-home | advance-line | make-series | make-category | detail | recover
   * @type {string}
   */
  let view = 'hub';
  let lineId = '';
  let seriesId = '';
  let categoryId = '';
  /**
   * @type {null
   *   | { kind: 'advance', lineId: string, recipeId: string }
   *   | { kind: 'make', recipeId: string }
   *   | { kind: 'make-variant', seriesId: string, categoryId: string, variantId: string }
   * }
   */
  let detail = null;

  function $(id) {
    return document.getElementById(id);
  }

  function store() {
    return typeof EquipCraftStore !== 'undefined' ? EquipCraftStore : null;
  }

  function formatMeso(n) {
    const v = Math.max(0, Math.floor(Number(n) || 0));
    if (typeof formatMesoAmount === 'function') {
      return formatMesoAmount(v).replace(/\s*楓幣\s*$/, '');
    }
    return v.toLocaleString('zh-TW');
  }

  function tipAttr(kind, itemId) {
    const id = String(itemId || '').trim();
    if (!kind || !id) return '';
    return ` data-craft-tip="${kind}" data-item-id="${id}"`;
  }

  function hideCraftTips() {
    if (typeof EquipTooltipModule !== 'undefined') EquipTooltipModule.hide?.();
    if (typeof InventoryModule !== 'undefined') {
      InventoryModule.hideEtcTooltip?.();
      InventoryModule.hideConsumeTooltip?.();
    }
  }

  function showCraftTip(anchorEl, kind, itemId) {
    const id = String(itemId || '').trim();
    if (!anchorEl || !kind || !id) return;
    if (typeof EquipTooltipModule !== 'undefined'
      && (EquipTooltipModule.pinned || EquipTooltipModule.dragging)) return;

    hideCraftTips();

    if (kind === 'equip') {
      if (typeof ITEM_DATABASE === 'undefined' || !ITEM_DATABASE[id]) return;
      if (typeof EquipTooltipModule !== 'undefined') {
        EquipTooltipModule.show(anchorEl, id, -1);
      }
      return;
    }

    if (kind === 'etc' && typeof InventoryModule !== 'undefined') {
      const catalog = typeof IdleEtcStore !== 'undefined' ? IdleEtcStore.get(id) : null;
      InventoryModule.showEtcTooltip?.(
        anchorEl,
        catalog?.name || id,
        catalog?.desc || '',
        catalog?.icon || '',
      );
      return;
    }

    if ((kind === 'potion' || kind === 'consume') && typeof InventoryModule !== 'undefined') {
      const potion = typeof IdlePotionStore !== 'undefined' ? IdlePotionStore.get(id) : null;
      if (potion) {
        InventoryModule.showPotionTooltip?.(anchorEl, potion);
        return;
      }
      const catalog = typeof IdleEtcStore !== 'undefined' ? IdleEtcStore.get(id) : null;
      InventoryModule.showEtcTooltip?.(
        anchorEl,
        catalog?.name || id,
        catalog?.desc || '',
        catalog?.icon || '',
      );
    }
  }

  function bindCraftTooltips() {
    const body = $('equipCraftBody');
    if (!body || body.dataset.craftTooltipReady) return;
    body.addEventListener('mouseover', (event) => {
      const tipEl = event.target.closest?.('[data-craft-tip][data-item-id]');
      if (!tipEl || !body.contains(tipEl)) return;
      if (body._craftTipEl === tipEl) return;
      body._craftTipEl = tipEl;
      showCraftTip(
        tipEl,
        tipEl.getAttribute('data-craft-tip') || '',
        tipEl.getAttribute('data-item-id') || '',
      );
    });
    body.addEventListener('mouseout', (event) => {
      const tipEl = event.target.closest?.('[data-craft-tip][data-item-id]');
      if (!tipEl || body._craftTipEl !== tipEl) return;
      const related = event.relatedTarget;
      if (related instanceof Node && tipEl.contains(related)) return;
      body._craftTipEl = null;
      hideCraftTips();
    });
    body.dataset.craftTooltipReady = '1';
  }

  function panelMarkup() {
    return `<div id="equipCraftPanel" class="equip-craft-panel" role="dialog" aria-labelledby="equipCraftTitle" aria-hidden="true">
      <div class="equip-craft-head">
        <button type="button" id="equipCraftBack" class="equip-craft-nav" hidden>← 返回</button>
        <span id="equipCraftTitle">裝備加工</span>
        <button type="button" id="equipCraftClose" class="equip-craft-nav">關閉</button>
      </div>
      <div id="equipCraftBody" class="equip-craft-body"></div>
    </div>`;
  }

  function ensureDom() {
    let panel = $('equipCraftPanel');
    const nav = $('appNavSidebar');
    if (!panel) {
      if (nav) nav.insertAdjacentHTML('afterend', panelMarkup());
      else document.body.insertAdjacentHTML('beforeend', panelMarkup());
      panel = $('equipCraftPanel');
    } else {
      const inField = panel.closest('.idle-hunt-field-wrap');
      if (inField || (nav && panel.previousElementSibling !== nav)) {
        panel.remove();
        if (nav) nav.insertAdjacentElement('afterend', panel);
        else document.body.appendChild(panel);
      }
    }
    return panel;
  }

  function syncChrome() {
    const panel = $('equipCraftPanel');
    panel?.classList.toggle('is-open', open);
    panel?.setAttribute('aria-hidden', open ? 'false' : 'true');
    $('btnViewEquipCraft')?.classList.toggle('is-active', open);
    const back = $('equipCraftBack');
    if (back) back.hidden = view === 'hub';
  }

  function setView(next, opts = {}) {
    view = next;
    lineId = opts.lineId || '';
    seriesId = opts.seriesId || '';
    categoryId = opts.categoryId || '';
    detail = opts.detail || null;
    render();
  }

  function hubMarkup() {
    return `<div class="equip-craft-list">
      <button type="button" class="equip-craft-row" data-action="open-make">
        <span class="equip-craft-row__text">
          <span class="equip-craft-row__name">裝備製作</span>
          <span class="equip-craft-row__meta">製作／進階裝備</span>
        </span>
      </button>
      <button type="button" class="equip-craft-row" data-action="open-disassemble">
        <span class="equip-craft-row__text">
          <span class="equip-craft-row__name">裝備分解</span>
          <span class="equip-craft-row__meta">分解裝備／卷軸為素材</span>
        </span>
      </button>
      <button type="button" class="equip-craft-row" data-action="open-recover">
        <span class="equip-craft-row__text">
          <span class="equip-craft-row__name">裝備恢復</span>
          <span class="equip-craft-row__meta">星力損壞裝備：同裝 ×4 + 等級⁴ 楓幣（最高 ★22）</span>
        </span>
      </button>
    </div>`;
  }

  function recoverMarkup() {
    const s = store();
    if (!s?.listBrokenEquips) return '<div class="equip-craft-empty">恢復功能尚未載入。</div>';
    const rows = s.listBrokenEquips();
    if (!rows.length) {
      return '<div class="equip-craft-empty">背包中沒有已損壞的裝備。</div>';
    }
    return `<div class="equip-craft-list">${rows.map((row) => {
      const starTxt = row.star > 0 ? `★${row.star}` : '★0';
      const recoverTxt = row.recoverStar !== row.star
        ? ` → 恢復後 ★${row.recoverStar}`
        : '';
      const mesoTxt = formatMeso(row.meso);
      const ready = row.canRecover ? '可恢復' : `材料 ${row.fodderHave}/4${row.canAffordMeso ? '' : '／楓幣不足'}`;
      return `<button type="button" class="equip-craft-row" data-action="recover-equip" data-slot="${row.slotIndex}" ${row.canRecover ? '' : 'disabled'}>
        <img class="equip-craft-row__icon" src="${row.icon}" alt="" draggable="false"${tipAttr('equip', row.itemId)} onerror="this.style.opacity='0.3'">
        <span class="equip-craft-row__text">
          <span class="equip-craft-row__name" style="color:#ff5555">${starTxt}${recoverTxt} ${row.name}(已損壞)</span>
          <span class="equip-craft-row__meta">Lv.${row.reqLevel}　同裝×4　${mesoTxt} 楓幣　${ready}</span>
        </span>
      </button>`;
    }).join('')}</div>
    <p class="equip-craft-hint">恢復消耗 4 件相同未損壞裝備 + 等級⁴ 楓幣；捲／潛能等進度保留，星力最高恢復到 ★22。</p>`;
  }

  function homeMarkup() {
    const s = store();
    if (!s) return '<div class="equip-craft-empty">配方資料尚未載入。</div>';

    const advanceLines = s.listAdvanceLines();
    const makeEntries = s.listMakeEntries();

    const advanceRows = advanceLines.map((line) => {
      const icon = s.equipIcon(line.iconItemId);
      const count = (line.recipes || []).length;
      return `<button type="button" class="equip-craft-row" data-action="open-line" data-line-id="${line.id}">
        <img class="equip-craft-row__icon" src="${icon}" alt="" draggable="false"${tipAttr('equip', line.iconItemId)} onerror="this.style.opacity='0.3'">
        <span class="equip-craft-row__text">
          <span class="equip-craft-row__name">${line.name}</span>
          <span class="equip-craft-row__meta">${count} 個進階配方</span>
        </span>
      </button>`;
    }).join('');

    const makeRows = makeEntries.map((entry) => {
      if (s.isMakeSeries(entry)) {
        const icon = s.equipIcon(entry.iconItemId);
        const count = (entry.categories || []).length;
        return `<button type="button" class="equip-craft-row" data-action="open-series" data-series-id="${entry.id}">
          <img class="equip-craft-row__icon" src="${icon}" alt="" draggable="false"${tipAttr('equip', entry.iconItemId)} onerror="this.style.opacity='0.3'">
          <span class="equip-craft-row__text">
            <span class="equip-craft-row__name">${entry.name}</span>
            <span class="equip-craft-row__meta">${count} 個部位大分類</span>
          </span>
        </button>`;
      }
      const icon = s.equipIcon(entry.output);
      return `<button type="button" class="equip-craft-row" data-action="open-make" data-recipe-id="${entry.id}">
        <img class="equip-craft-row__icon" src="${icon}" alt="" draggable="false"${tipAttr('equip', entry.output)} onerror="this.style.opacity='0.3'">
        <span class="equip-craft-row__text">
          <span class="equip-craft-row__name">${entry.label || s.equipName(entry.output)}</span>
          <span class="equip-craft-row__meta">裝備製作</span>
        </span>
      </button>`;
    }).join('');

    let html = '';
    if (advanceRows) {
      html += `<h3 class="equip-craft-section-title">裝備進階</h3><div class="equip-craft-list">${advanceRows}</div>`;
    }
    if (makeRows) {
      html += `<h3 class="equip-craft-section-title">裝備製作</h3><div class="equip-craft-list">${makeRows}</div>`;
    }
    if (!html) {
      html = '<div class="equip-craft-empty">尚無配方，請編輯 js/equipCraftData.js</div>';
    }
    return html;
  }

  function lineMarkup(id) {
    const s = store();
    const line = s?.getAdvanceLine(id);
    if (!line) return '<div class="equip-craft-empty">找不到進階線。</div>';

    const rows = (line.recipes || []).map((recipe) => {
      const icon = s.equipIcon(recipe.output);
      return `<button type="button" class="equip-craft-row" data-action="open-advance" data-line-id="${line.id}" data-recipe-id="${recipe.id}">
        <img class="equip-craft-row__icon" src="${icon}" alt="" draggable="false"${tipAttr('equip', recipe.output)} onerror="this.style.opacity='0.3'">
        <span class="equip-craft-row__text">
          <span class="equip-craft-row__name">${recipe.label || s.equipName(recipe.output)}</span>
          <span class="equip-craft-row__meta">${s.equipName(recipe.baseEquip)} → ${s.equipName(recipe.output)}</span>
        </span>
      </button>`;
    }).join('');

    return rows
      ? `<div class="equip-craft-list">${rows}</div>`
      : '<div class="equip-craft-empty">此進階線尚無配方。</div>';
  }

  function seriesMarkup(id) {
    const s = store();
    const series = s?.getMakeSeries(id);
    if (!series) return '<div class="equip-craft-empty">找不到製作系列。</div>';

    const rows = (series.categories || []).map((cat) => {
      const iconId = cat.iconItemId || cat.variants?.[0]?.output;
      const icon = s.equipIcon(iconId);
      const count = (cat.variants || []).length;
      return `<button type="button" class="equip-craft-row" data-action="open-category" data-series-id="${series.id}" data-category-id="${cat.id}">
        <img class="equip-craft-row__icon" src="${icon}" alt="" draggable="false"${tipAttr('equip', iconId)} onerror="this.style.opacity='0.3'">
        <span class="equip-craft-row__text">
          <span class="equip-craft-row__name">${cat.name}</span>
          <span class="equip-craft-row__meta">${count} 個職業變體 · 共用材料</span>
        </span>
      </button>`;
    }).join('');

    return rows
      ? `<div class="equip-craft-list">${rows}</div>`
      : '<div class="equip-craft-empty">此系列尚無大分類。</div>';
  }

  function materialsPreviewMarkup(category) {
    const s = store();
    if (!s || !category) return '';
    const mats = s.materialsMap(category);
    const chips = Object.entries(mats).map(([id, amt]) => {
      const icon = s.etcIcon(id);
      const name = s.etcName(id);
      return `<span class="equip-craft-mat-chip"${tipAttr('etc', id)} title="">
        <img class="equip-craft-mat-chip__icon" src="${icon}" alt="${name}" draggable="false" onerror="this.style.opacity='0.3'">
        <span class="equip-craft-mat-chip__qty">×${amt}</span>
      </span>`;
    });
    const meso = Math.max(0, Math.floor(Number(category.meso) || 0));
    if (meso > 0) {
      chips.push(`<span class="equip-craft-mat-chip equip-craft-mat-chip--meso">
        <img class="equip-craft-mat-chip__icon" src="images/npcshop/PointInfo__Meso__iconShop.png" alt="楓幣" draggable="false">
        <span class="equip-craft-mat-chip__qty">×${formatMeso(meso)}</span>
      </span>`);
    }
    if (!chips.length) return '';
    return `<div class="equip-craft-shared-mats"><span class="equip-craft-shared-mats__label">共用材料</span>${chips.join('')}</div>`;
  }

  function categoryMarkup(sid, cid) {
    const s = store();
    const category = s?.getMakeCategory(sid, cid);
    if (!category) return '<div class="equip-craft-empty">找不到大分類。</div>';

    const rows = (category.variants || []).map((variant) => {
      const icon = s.equipIcon(variant.output);
      const name = variant.label
        ? `${variant.label} · ${s.equipName(variant.output)}`
        : s.equipName(variant.output);
      return `<button type="button" class="equip-craft-row" data-action="open-variant" data-series-id="${sid}" data-category-id="${cid}" data-variant-id="${variant.id}">
        <img class="equip-craft-row__icon" src="${icon}" alt="" draggable="false"${tipAttr('equip', variant.output)} onerror="this.style.opacity='0.3'">
        <span class="equip-craft-row__text">
          <span class="equip-craft-row__name">${name}</span>
          <span class="equip-craft-row__meta">點擊製作</span>
        </span>
      </button>`;
    }).join('');

    return `${materialsPreviewMarkup(category)}${rows
      ? `<div class="equip-craft-list">${rows}</div>`
      : '<div class="equip-craft-empty">此大分類尚無職業變體。</div>'}`;
  }

  function reqItemMarkup(icon, label, have, need, tipKind, tipId) {
    const ok = have >= need;
    return `<li class="equip-craft-req-item ${ok ? 'is-ok' : 'is-short'}">
      <img class="equip-craft-req-item__icon equip-craft-req-item__icon--native" src="${icon}" alt="" draggable="false"${tipAttr(tipKind, tipId)} onerror="this.style.opacity='0.3'">
      <span class="equip-craft-req-item__label">${label}</span>
      <span class="equip-craft-req-item__qty">${have.toLocaleString('zh-TW')} / ${need.toLocaleString('zh-TW')}</span>
    </li>`;
  }

  function resolveDetailRecipe() {
    const s = store();
    if (!s || !detail) return null;
    if (detail.kind === 'advance') {
      return s.findAdvanceRecipe(detail.lineId, detail.recipeId);
    }
    if (detail.kind === 'make-variant') {
      return s.resolveMakeVariant(detail.seriesId, detail.categoryId, detail.variantId);
    }
    return s.findMakeFlatRecipe(detail.recipeId) || s.findMakeRecipe(detail.recipeId);
  }

  function detailMarkup() {
    const s = store();
    if (!s || !detail) return '';

    const recipe = resolveDetailRecipe();
    if (!recipe) return '<div class="equip-craft-empty">找不到配方。</div>';

    const title = recipe.label || s.equipName(recipe.output);
    const canCraft = detail.kind === 'advance'
      ? s.canCraftAdvance(recipe)
      : s.canCraftMake(recipe);
    const craftKind = detail.kind;

    const reqs = [];

    if (recipe.baseEquip) {
      const need = Math.max(1, Math.floor(Number(recipe.baseCount) || 1));
      const have = s.countEquipInBag(recipe.baseEquip, { includeLocked: false });
      reqs.push(reqItemMarkup(
        s.equipIcon(recipe.baseEquip),
        s.equipName(recipe.baseEquip),
        have,
        need,
        'equip',
        recipe.baseEquip,
      ));
    }

    const materials = s.materialsMap(recipe);
    Object.entries(materials).forEach(([id, amt]) => {
      const have = typeof InventoryModule !== 'undefined' ? InventoryModule.countEtc(id) : 0;
      reqs.push(reqItemMarkup(s.etcIcon(id), s.etcName(id), have, amt, 'etc', id));
    });

    const meso = Math.max(0, Math.floor(Number(recipe.meso) || 0));
    if (meso > 0) {
      const have = s.heldMeso();
      reqs.push(`<li class="equip-craft-req-item ${have >= meso ? 'is-ok' : 'is-short'}">
        <img class="equip-craft-req-item__icon" src="images/npcshop/PointInfo__Meso__iconShop.png" alt="" draggable="false">
        <span class="equip-craft-req-item__label">楓幣</span>
        <span class="equip-craft-req-item__qty">${formatMeso(have)} / ${formatMeso(meso)}</span>
      </li>`);
    }

    return `<div class="equip-craft-detail" data-craft-kind="${craftKind}">
      <div class="equip-craft-output">
        <img class="equip-craft-output__icon" src="${s.equipIcon(recipe.output)}" alt="" draggable="false"${tipAttr('equip', recipe.output)} onerror="this.style.opacity='0.3'">
        <span class="equip-craft-output__name">${title}</span>
      </div>
      ${detail.kind === 'advance'
        ? '<p class="equip-craft-inherit-hint">進階時會消耗背包中的基底裝備，並將星力／卷軸／潛能等強化繼承至成品（優先使用強化進度較高的那一件）。</p>'
        : ''}
      <p class="equip-craft-req-title">所需材料</p>
      <ul class="equip-craft-req-list">${reqs.join('')}</ul>
      <button type="button" id="equipCraftDo" class="equip-craft-btn" ${canCraft ? '' : 'disabled'}>${detail.kind === 'advance' ? '進階' : '製作'}</button>
    </div>`;
  }

  function render() {
    ensureDom();
    syncChrome();
    hideCraftTips();

    const title = $('equipCraftTitle');
    const body = $('equipCraftBody');
    if (!title || !body) return;

    if (view === 'hub') {
      title.textContent = '裝備加工';
      body.innerHTML = hubMarkup();
      return;
    }

    if (view === 'recover') {
      title.textContent = '裝備恢復';
      body.innerHTML = recoverMarkup();
      return;
    }

    if (view === 'make-home' || view === 'home') {
      title.textContent = '裝備製作';
      body.innerHTML = homeMarkup();
      return;
    }

    if (view === 'advance-line') {
      const line = store()?.getAdvanceLine(lineId);
      title.textContent = line?.name || '裝備進階';
      body.innerHTML = lineMarkup(lineId);
      return;
    }

    if (view === 'make-series') {
      const series = store()?.getMakeSeries(seriesId);
      title.textContent = series?.name || '裝備製作';
      body.innerHTML = seriesMarkup(seriesId);
      return;
    }

    if (view === 'make-category') {
      const category = store()?.getMakeCategory(seriesId, categoryId);
      title.textContent = category?.name || '大分類';
      body.innerHTML = categoryMarkup(seriesId, categoryId);
      return;
    }

    if (view === 'detail' && detail) {
      const recipe = resolveDetailRecipe();
      title.textContent = recipe?.label || store()?.equipName(recipe?.output) || '製作';
      body.innerHTML = detailMarkup();
    }
  }

  function setOpen(next) {
    open = !!next;
    if (open) {
      view = 'hub';
      lineId = '';
      seriesId = '';
      categoryId = '';
      detail = null;
      if (typeof DisassemblePanel !== 'undefined') DisassemblePanel.setOpen?.(false);
      if (typeof JobChangePanel !== 'undefined') JobChangePanel.setOpen?.(false);
      if (typeof IdleHunt !== 'undefined' && typeof IdleHunt.setPickerOpen === 'function') {
        IdleHunt.setPickerOpen(false);
      }
      if (typeof IdleDungeon !== 'undefined') IdleDungeon.setOpen?.(false);
      if (typeof IdleBoss !== 'undefined') IdleBoss.closeAll?.();
    } else {
      hideCraftTips();
    }
    render();
  }

  function toggle() {
    setOpen(!open);
  }

  function goBack() {
    if (view === 'detail') {
      if (detail?.kind === 'advance') {
        setView('advance-line', { lineId: detail.lineId });
      } else if (detail?.kind === 'make-variant') {
        setView('make-category', {
          seriesId: detail.seriesId,
          categoryId: detail.categoryId,
        });
      } else {
        setView('make-home');
      }
      return;
    }
    if (view === 'make-category') {
      setView('make-series', { seriesId });
      return;
    }
    if (view === 'make-series' || view === 'advance-line') {
      setView('make-home');
      return;
    }
    if (view === 'make-home' || view === 'recover' || view === 'home') {
      setView('hub');
    }
  }

  function onCraftClick() {
    const s = store();
    if (!s || !detail) return;

    const recipe = resolveDetailRecipe();
    let ok = false;
    if (detail.kind === 'advance') {
      ok = recipe ? s.craftAdvance(recipe) : false;
    } else {
      ok = recipe ? s.craftMake(recipe) : false;
    }

    if (!ok && typeof addLog === 'function') {
      addLog('[裝備製作] 材料不足、楓幣不足或背包已滿。', 'log-fail');
    }
    render();
  }

  function bindEvents() {
    $('btnViewEquipCraft')?.addEventListener('click', (e) => {
      e.preventDefault();
      toggle();
    });

    $('equipCraftClose')?.addEventListener('click', (e) => {
      e.preventDefault();
      setOpen(false);
    });

    $('equipCraftBack')?.addEventListener('click', (e) => {
      e.preventDefault();
      goBack();
    });

    $('equipCraftBody')?.addEventListener('click', (e) => {
      if (e.target.closest('#equipCraftDo')) {
        e.preventDefault();
        onCraftClick();
        return;
      }

      const row = e.target.closest('[data-action]');
      if (!row) return;
      const action = row.getAttribute('data-action');

      if (action === 'open-make') {
        e.preventDefault();
        setView('make-home');
        return;
      }
      if (action === 'open-disassemble') {
        e.preventDefault();
        setOpen(false);
        if (typeof DisassemblePanel !== 'undefined') DisassemblePanel.setOpen?.(true);
        return;
      }
      if (action === 'open-recover') {
        e.preventDefault();
        setView('recover');
        return;
      }
      if (action === 'recover-equip') {
        e.preventDefault();
        if (row.disabled) return;
        const slot = Number(row.getAttribute('data-slot'));
        const ok = store()?.recoverEquip?.(slot);
        if (!ok && typeof addLog === 'function') {
          addLog('[裝備恢復] 無法恢復（材料或楓幣不足）。', 'log-fail');
        }
        render();
        return;
      }

      if (action === 'open-line') {
        e.preventDefault();
        setView('advance-line', { lineId: row.getAttribute('data-line-id') || '' });
        return;
      }
      if (action === 'open-advance') {
        e.preventDefault();
        setView('detail', {
          detail: {
            kind: 'advance',
            lineId: row.getAttribute('data-line-id') || '',
            recipeId: row.getAttribute('data-recipe-id') || '',
          },
        });
        return;
      }
      if (action === 'open-series') {
        e.preventDefault();
        setView('make-series', { seriesId: row.getAttribute('data-series-id') || '' });
        return;
      }
      if (action === 'open-category') {
        e.preventDefault();
        setView('make-category', {
          seriesId: row.getAttribute('data-series-id') || '',
          categoryId: row.getAttribute('data-category-id') || '',
        });
        return;
      }
      if (action === 'open-variant') {
        e.preventDefault();
        setView('detail', {
          detail: {
            kind: 'make-variant',
            seriesId: row.getAttribute('data-series-id') || '',
            categoryId: row.getAttribute('data-category-id') || '',
            variantId: row.getAttribute('data-variant-id') || '',
          },
        });
        return;
      }
      if (action === 'open-make') {
        e.preventDefault();
        setView('detail', {
          detail: {
            kind: 'make',
            recipeId: row.getAttribute('data-recipe-id') || '',
          },
        });
      }
    });
  }

  function init() {
    if (inited) return;
    inited = true;
    ensureDom();
    bindEvents();
    bindCraftTooltips();
    render();
  }

  return {
    init,
    setOpen,
    toggle,
    isOpen: () => open,
    refresh: render,
  };
})();

if (typeof window !== 'undefined') {
  window.EquipCraftPanel = EquipCraftPanel;
  window.addEventListener('DOMContentLoaded', () => EquipCraftPanel.init());
}
