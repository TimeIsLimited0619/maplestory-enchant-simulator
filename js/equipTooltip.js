/**
 * EquipTooltipModule - 背包裝備 hover 說明卡（仿 UIToolTip.img）
 */
const EquipTooltipModule = {
  hoverSlot: null,
  starEffectTimer: null,
  starEffectFrame: 0,
  starEffectImg: null,
  /** 貓谷潛能操作期間強制持續顯示 */
  pinned: false,
  pinAnchor: null,
  /** 拖曳裝備期間隱藏 tooltip */
  dragging: false,

  beginDrag() {
    this.dragging = true;
    this.hide(true);
  },

  endDrag() {
    this.dragging = false;
  },

  init() {
    if (this._ready) return;
    this.ensureElement();
    this.bindInventoryHover();
    this.bindDropZoneHover();
    this.bindUiEquipHover();
    this._ready = true;
  },

  ensureElement() {
    if (document.getElementById('equipTooltip')) return;

    const el = document.createElement('div');
    el.id = 'equipTooltip';
    el.className = 'eq-tooltip hidden';
    el.setAttribute('aria-hidden', 'true');
    document.body.appendChild(el);
  },

  bindInventoryHover() {
    const grid = document.getElementById('inventoryGrid');
    if (!grid || grid.dataset.eqTooltipReady) return;

    grid.addEventListener('mouseover', (event) => {
      if (this.pinned || this.dragging) return;
      if (InventoryModule.tab !== 'equip') return;
      const slot = event.target.closest('.ms-inv-slot');
      if (!slot || grid._eqTooltipSlot === slot) return;

      const slotIndex = Number(slot.dataset.slotIndex);
      const itemId = playerInventoryEquip[slotIndex];
      if (!itemId || !ITEM_DATABASE[itemId]) return;

      grid._eqTooltipSlot = slot;
      this.show(slot, itemId, slotIndex);
    });

    grid.addEventListener('mouseout', (event) => {
      if (this.pinned) return;
      const slot = event.target.closest('.ms-inv-slot');
      if (!slot) return;

      const related = event.relatedTarget;
      if (related instanceof Node && slot.contains(related)) return;

      if (grid._eqTooltipSlot === slot) {
        grid._eqTooltipSlot = null;
        this.hide();
      }
    });

    grid.dataset.eqTooltipReady = '1';
  },

  bindDropZoneHover() {
    const dropZone = document.getElementById('equipDropZone');
    if (!dropZone || dropZone.dataset.eqTooltipReady) return;

    dropZone.addEventListener('mouseover', (event) => {
      if (this.dragging) return;
      if (!currentEnchantItem) return;
      const target = event.target.closest('#equipDropZone, #enchantedEquipImg');
      if (!target || dropZone._eqTooltipActive) return;

      dropZone._eqTooltipActive = true;
      const itemId = currentEnchantItem.itemId || currentEnchantItem.id;
      this.show(dropZone, itemId, -1, currentEnchantItem);
    });

    dropZone.addEventListener('mouseout', (event) => {
      if (this.pinned) return;
      const related = event.relatedTarget;
      if (related instanceof Node && dropZone.contains(related)) return;

      if (dropZone._eqTooltipActive) {
        dropZone._eqTooltipActive = false;
        this.hide();
      }
    });

    dropZone.dataset.eqTooltipReady = '1';
  },

  bindUiEquipHover() {
    const host = document.getElementById('uiEquipSlots');
    if (!host || host.dataset.eqTooltipReady) return;

    host.addEventListener('mouseover', (event) => {
      if (this.pinned || this.dragging) return;
      const slot = event.target.closest('.uiequip-slot');
      if (!slot || !slot.classList.contains('is-filled')) return;
      if (host._eqTooltipSlot === slot) return;

      const uiSlot = slot.getAttribute('data-slot');
      const entry = typeof UiEquipModule !== 'undefined'
        ? UiEquipModule.getWornEntry?.(uiSlot)
        : null;
      if (!entry?.itemId || !ITEM_DATABASE[entry.itemId]) return;

      host._eqTooltipSlot = slot;
      this.show(slot, entry.itemId, `body:${uiSlot}`, entry.state);
    });

    host.addEventListener('mouseout', (event) => {
      if (this.pinned) return;
      const slot = event.target.closest('.uiequip-slot');
      if (!slot) return;
      const related = event.relatedTarget;
      if (related instanceof Node && slot.contains(related)) return;

      if (host._eqTooltipSlot === slot) {
        host._eqTooltipSlot = null;
        this.hide();
      }
    });

    host.dataset.eqTooltipReady = '1';
  },

  resolveItemState(itemId, slotIndex, stateOverride = null) {
    if (stateOverride && typeof stateOverride === 'object') {
      const template = ITEM_DATABASE[itemId];
      if (!template) return null;
      const base = typeof createEnchantState === 'function'
        ? createEnchantState(template, -1)
        : { ...template, slotIndex: -1 };
      const saved = typeof cloneEnchantState === 'function'
        ? cloneEnchantState(stateOverride)
        : { ...stateOverride };
      delete saved.slotIndex;
      return {
        ...base,
        ...saved,
        slotIndex: typeof slotIndex === 'number' ? slotIndex : -1,
        itemId,
        id: itemId,
        name: template.name,
        icon: template.icon,
        mainType: template.mainType,
        subType: template.subType,
        islot: template.islot,
        vslot: template.vslot,
        baseStats: template.baseStats,
      };
    }

    if (typeof currentEnchantItem !== 'undefined' && currentEnchantItem) {
      const curId = currentEnchantItem.itemId || currentEnchantItem.id;
      if (curId === itemId && (slotIndex === -1 || slotIndex === currentEnchantItem.slotIndex)) {
        return typeof cloneEnchantState === 'function'
          ? { ...cloneEnchantState(currentEnchantItem), slotIndex: -1 }
          : { ...currentEnchantItem, slotIndex: -1 };
      }
    }

    if (typeof slotIndex === 'string' && slotIndex.startsWith('body:')
      && typeof UiEquipModule !== 'undefined') {
      const entry = UiEquipModule.getWornEntry?.(slotIndex.slice(5));
      if (entry?.itemId === itemId) {
        return this.resolveItemState(itemId, -1, entry.state);
      }
    }

    if (typeof loadEnchantStateForSlot === 'function' && Number.isInteger(slotIndex) && slotIndex >= 0) {
      return loadEnchantStateForSlot(itemId, slotIndex);
    }

    const template = ITEM_DATABASE[itemId];
    if (!template) return null;
    return typeof createEnchantState === 'function'
      ? createEnchantState(template, typeof slotIndex === 'number' ? slotIndex : -1)
      : { ...template, slotIndex };
  },

  getStarForceBonus(item) {
    if (typeof getStarForceBonusAtStar === 'function') {
      return getStarForceBonusAtStar(item.star || 0, item);
    }

    const table = typeof resolveStarStatsTable === 'function'
      ? resolveStarStatsTable(item.reqLevel)
      : null;
    if (!table) return { stat: 0, atk: 0, matk: 0, def: 0, hp: 0 };

    const star = item.star || 0;
    const row = table[star] || [0, 0];
    const stat = row[0] || 0;
    const atk = row[1] || 0;
    const def = typeof getStarDefBonusAtStar === 'function'
      ? getStarDefBonusAtStar(star, item)
      : 0;
    const hp = typeof isStarHpEligible === 'function' && isStarHpEligible(item)
      ? getStarHpBonus(star)
      : 0;

    return { stat, atk, matk: atk, def, hp };
  },

  getCategoryTags(item) {
    const tags = [];
    const hideMainCategory = EQUIP_SUBTYPE_HIDE_MAIN_CATEGORY.has(item.subType);
    const main = EQUIP_MAIN_TYPE_LABEL[item.mainType];
    if (main && !hideMainCategory) tags.push(main);

    const sub = EQUIP_SUBTYPE_LABEL[item.subType] || EQUIP_SUBTYPE_LABEL.unknown;
    if (sub && (hideMainCategory || sub !== main)) tags.push(sub);

    // 必須先確保有 islot
    if (item.islot) {
      const job2Id = item.reqJob2 || item.job2;

      if (job2Id) {
        // 判定是否為副武器
        const isSubWeapon = item.mainType === EQUIP_TYPE.offHandWeapon || item.islot === 'Op';
        
        // 判定是否為主武器
        const isMainWeapon = item.mainType === EQUIP_TYPE.WEAPON && !isSubWeapon;

        // 1. 主武器匹配邏輯
        if (isMainWeapon && EQUIP_REQ_JOB2_WEAPON_LABELS[job2Id]) {
          tags.push(EQUIP_REQ_JOB2_WEAPON_LABELS[job2Id]);
        } 
        // 2. 副武器匹配邏輯
        else if (isSubWeapon && EQUIP_REQ_JOB2_SUBWEAPON_LABELS[job2Id]) {
          tags.push(EQUIP_REQ_JOB2_SUBWEAPON_LABELS[job2Id]);
        }
      }
    }

    return tags.slice(0, 3);
  },

  /** 名稱下方限制文字：tradeBlock / equipTradeBlock */
  getRestrictionLines(item) {
    const wz = item?.wz || {};
    const lines = [];

    if (wz.tradeBlock || wz.equipTradeBlock) {
      lines.push('無法交換');
    }

    return lines;
  },

  /** 底部限制文字：onlyEquip / unsyntesizable */
  getOnlyEquipFooterText(item) {
    const wz = item?.wz || {};
    if (!wz.onlyEquip) return '';
    if (wz.unsyntesizable || wz.unsynthesizable) {
      return '不可重複持有, 不可重複裝備';
    }
    return '不可重複裝備';
  },

  getBonusStatContribution(item, equipKey) {
    if (typeof canUseBonusStat === 'function' && !canUseBonusStat(item)) return 0;
    const lines = item?.bonusStat?.lines;
    if (!lines?.length || typeof getBonusStatStatTotal !== 'function') return 0;
    const bonusId = EQUIP_BONUS_STAT_KEY_MAP[equipKey];
    if (!bonusId) return 0;
    return getBonusStatStatTotal(lines, bonusId, item) || 0;
  },

  buildStatSegments(item) {
    const base = item.baseStats || {};
    const scrollStat = item.scrollStat || 0;
    const scrollAtk = item.scrollAtk || 0;
    const scrollMatk = item.scrollMatk || 0;
    const scrollByMain = {
      str: item.scrollStr || 0,
      dex: item.scrollDex || 0,
      int: item.scrollInt || 0,
      luk: item.scrollLuk || 0,
      def: item.scrollDef || 0,
      hp: item.scrollHp || 0,
      mp: item.scrollMp || 0,
    };
    const starBonus = this.getStarForceBonus(item);
    const bonusLines = item?.bonusStat?.lines || [];

    const lines = [];
    for (const { key, label } of EQUIP_STAT_LABELS) {
      const baseVal = base[key] || 0;
      let scrollVal = 0;
      let starVal = 0;
      const bonusVal = this.getBonusStatContribution(item, key);

      if (key === 'atk' || key === 'matk') {
        scrollVal = key === 'atk' ? scrollAtk : scrollMatk;
        starVal = key === 'atk' ? starBonus.atk : starBonus.matk;
      } else if (['str', 'dex', 'int', 'luk'].includes(key)) {
        scrollVal = scrollStat + (scrollByMain[key] || 0);
        starVal = typeof getStarClassStatBonusAtStar === 'function'
          ? getStarClassStatBonusAtStar(item.star || 0, item, key)
          : (typeof getStarClassStatBonus === 'function'
            ? getStarClassStatBonus(starBonus.stat, item, key)
            : starBonus.stat);
      } else if (key === 'def') {
        scrollVal = scrollByMain.def || 0;
        starVal = starBonus.def;
      } else if (key === 'hp') {
        scrollVal = scrollByMain.hp || 0;
        starVal = starBonus.hp;
      } else if (key === 'mp') {
        scrollVal = scrollByMain.mp || 0;
      }

      const total = baseVal + starVal + scrollVal + bonusVal;
      if (total <= 0 && baseVal <= 0 && scrollVal === 0) continue;

      lines.push({
        label,
        base: baseVal,
        star: starVal,
        scroll: scrollVal,
        bonus: bonusVal,
        total,
      });
    }

    const wz = item.wz || {};
    const pushWzLine = (label, value, isPercent = false, scrollVal = 0) => {
      const total = (Number(value) || 0) + (Number(scrollVal) || 0);
      if (!(total > 0) && !(scrollVal !== 0)) return;
      lines.push({
        label,
        base: Number(value) || 0,
        star: 0,
        scroll: Number(scrollVal) || 0,
        bonus: 0,
        total,
        isPercent,
      });
    };

    pushWzLine('無視怪物防禦率', wz.imdR, true, item.scrollImdR || 0);
    pushWzLine('總傷害', wz.damR, true, item.scrollDamR || 0);
    pushWzLine('BOSS怪物傷害', wz.bdR, true, item.scrollBdR || 0);
    pushWzLine('全屬性', 0, true, item.scrollAllStatR || 0);
    pushWzLine('跳躍力', wz.incJump, false, item.scrollJump || 0);
    pushWzLine('移動速度', wz.incSpeed, false, item.scrollSpeed || 0);

    if (bonusLines.length && typeof aggregateBonusStatLines === 'function') {
      const covered = new Set(Object.values(EQUIP_BONUS_STAT_KEY_MAP));
      aggregateBonusStatLines(bonusLines, item).forEach((row) => {
        if (!row || covered.has(row.statId)) return;
        const value = Number(row.value) || 0;
        if (!value) return;
        lines.push({
          label: row.label || row.statId,
          base: 0,
          star: 0,
          scroll: 0,
          bonus: value,
          total: value,
          isPercent: Boolean(row.isPercent),
        });
      });
    }

    return lines;
  },

  createDotline(className = 'eq-tip-dotline') {
    const line = document.createElement('div');
    line.className = className;
    line.style.backgroundImage = `url('${EQUIP_TOOLTIP_ASSETS.frame.dotline}')`;
    return line;
  },

  scaleEquipIcon(img) {
    const apply = () => {
      if (!img.naturalWidth) return;
      img.style.width = `${Math.round(img.naturalWidth * 2)}px`;
      img.style.height = `${Math.round(img.naturalHeight * 2)}px`;
    };
    if (img.complete) apply();
    else img.addEventListener('load', apply, { once: true });
  },

  syncItemIconBaseMetrics(root, baseImg) {
    const apply = () => {
      if (!baseImg.naturalWidth) return;
      root.style.setProperty('--eq-tip-icon-base-w', `${baseImg.naturalWidth}px`);
      root.style.setProperty('--eq-tip-icon-base-h', `${baseImg.naturalHeight}px`);
    };
    if (baseImg.complete) apply();
    else baseImg.addEventListener('load', apply, { once: true });
  },

  createInfoLine(label, value, options = {}) {
    const row = document.createElement('div');
    row.className = 'eq-tip-info-row';

    if (options.labelIcon) {
      const labelIcon = document.createElement('img');
      labelIcon.className = 'eq-tip-text-icon eq-tip-info-label-icon';
      labelIcon.src = options.labelIcon;
      labelIcon.alt = label || '';
      row.appendChild(labelIcon);
    } else {
      const labelEl = document.createElement('span');
      labelEl.className = 'eq-tip-info-label';
      labelEl.textContent = label;
      row.appendChild(labelEl);
    }

    const valueEl = document.createElement('span');
    valueEl.className = 'eq-tip-info-value';
    if (options.valueTone === 'label') {
      valueEl.classList.add('eq-tip-info-label');
    }
    valueEl.textContent = value;
    row.appendChild(valueEl);

    return row;
  },

  createEnhanceLine(iconSrc, text) {
    const row = document.createElement('div');
    row.className = 'eq-tip-enhance-row';

    const icon = document.createElement('img');
    icon.className = 'eq-tip-text-icon';
    icon.src = iconSrc;
    icon.alt = '';
    row.appendChild(icon);

    const span = document.createElement('span');
    span.className = 'eq-tip-enhance-text';
    span.textContent = text;
    row.appendChild(span);

    return row;
  },

  renderStatValue(totalCell, breakdownCell, line) {
    const suffix = line.isPercent ? '%' : '';
    const star = line.star || 0;
    const scroll = line.scroll || 0;
    const bonus = line.bonus || 0;
    const hasBreakdown = star > 0 || scroll !== 0 || bonus > 0;

    totalCell.textContent = `+${line.total}${suffix}`;
    breakdownCell.textContent = '';

    if (!hasBreakdown) return;

    breakdownCell.appendChild(document.createTextNode(' ('));

    const base = document.createElement('span');
    base.className = 'eq-tip-stat-part eq-tip-stat-base';
    base.textContent = `${line.base}${suffix}`;
    breakdownCell.appendChild(base);

    if (star > 0) {
      const starEl = document.createElement('span');
      starEl.className = 'eq-tip-stat-part eq-tip-stat-star';
      starEl.textContent = ` +${star}${suffix}`;
      breakdownCell.appendChild(starEl);
    }

    if (scroll !== 0) {
      const scrollEl = document.createElement('span');
      scrollEl.className = 'eq-tip-stat-part eq-tip-stat-scroll';
      scrollEl.textContent = ` ${scroll > 0 ? '+' : ''}${scroll}${suffix}`;
      breakdownCell.appendChild(scrollEl);
    }

    if (bonus > 0) {
      const bonusEl = document.createElement('span');
      bonusEl.className = 'eq-tip-stat-part eq-tip-stat-bonus';
      bonusEl.textContent = ` +${bonus}${suffix}`;
      breakdownCell.appendChild(bonusEl);
    }

    breakdownCell.appendChild(document.createTextNode(')'));
  },

  stopStarEffect() {
    if (this.starEffectTimer) {
      window.clearInterval(this.starEffectTimer);
      this.starEffectTimer = null;
    }
    this.starEffectFrame = 0;
    this.starEffectImg = null;
  },

  applyStarEffectPosition(effectImg) {
    const cfg = typeof EQUIP_TOOLTIP_STAR_EFFECT !== 'undefined' ? EQUIP_TOOLTIP_STAR_EFFECT : null;
    if (!effectImg || !cfg?.anchor) return;

    effectImg.style.left = `calc(50% + ${cfg.offset.x - cfg.anchor.x}px)`;
    effectImg.style.top = `${cfg.offset.y - cfg.anchor.y}px`;
  },

  applyStarEffectFrame(effectImg, frameIndex) {
    const cfg = typeof EQUIP_TOOLTIP_STAR_EFFECT !== 'undefined' ? EQUIP_TOOLTIP_STAR_EFFECT : null;
    if (!effectImg || !cfg?.frames?.length) return;

    effectImg.src = cfg.frames[frameIndex % cfg.frames.length];
  },

  startStarEffect(effectImg) {
    this.stopStarEffect();
    if (!effectImg || typeof EQUIP_TOOLTIP_STAR_EFFECT === 'undefined') return;

    this.starEffectImg = effectImg;
    this.applyStarEffectPosition(effectImg);
    this.applyStarEffectFrame(effectImg, 0);
    this.starEffectFrame = 1;
    this.starEffectTimer = window.setInterval(() => {
      if (!this.starEffectImg) return;
      this.applyStarEffectFrame(this.starEffectImg, this.starEffectFrame);
      this.starEffectFrame += 1;
    }, EQUIP_TOOLTIP_STAR_EFFECT.frameDelayMs);
  },

  renderStars(container, starCount, maxStars = 30) {
    container.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.className = 'eq-tip-stars';

    const starsPerRow = 15;
    const groupSize = 5;
    const showStarEffect = typeof shouldShowEquipTooltipStarEffect === 'function'
      ? shouldShowEquipTooltipStarEffect(starCount)
      : starCount >= 24;
    let effectImg = null;

    for (let rowStart = 0; rowStart < maxStars; rowStart += starsPerRow) {
      const row = document.createElement('div');
      row.className = 'eq-tip-star-row';
      const rowEnd = Math.min(rowStart + starsPerRow, maxStars);

      for (let i = rowStart; i < rowEnd; i += 1) {
        const starIndex = i + 1;
        const inRow = i - rowStart;

        if (inRow > 0 && inRow % groupSize === 0) {
          const gap = document.createElement('span');
          gap.className = 'eq-tip-star-gap';
          row.appendChild(gap);
        }

        const starWrap = document.createElement('span');
        starWrap.className = 'eq-tip-star-wrap';

        const img = document.createElement('img');
        img.className = 'eq-tip-star';
        img.alt = '';
        img.draggable = false;
        img.src = starIndex <= starCount
          ? EQUIP_TOOLTIP_ASSETS.star.filled
          : EQUIP_TOOLTIP_ASSETS.star.empty;
        starWrap.appendChild(img);
        row.appendChild(starWrap);
      }

      if (showStarEffect && rowStart === 0) {
        row.classList.add('eq-tip-star-row-effect');
        const sparkle = document.createElement('img');
        sparkle.className = 'eq-tip-star-effect';
        sparkle.alt = '';
        sparkle.draggable = false;
        row.appendChild(sparkle);
        effectImg = sparkle;
      }

      wrap.appendChild(row);
    }

    container.appendChild(wrap);
    return effectImg;
  },

  renderCategoryTag(text) {
    const tag = document.createElement('span');
    tag.className = 'eq-tip-category';

    const left = document.createElement('span');
    left.className = 'eq-tip-category-edge eq-tip-category-w';
    left.style.backgroundImage = `url('${EQUIP_TOOLTIP_ASSETS.equipFrame.categoryW}')`;
    tag.appendChild(left);

    const center = document.createElement('span');
    center.className = 'eq-tip-category-edge eq-tip-category-c';
    center.style.backgroundImage = `url('${EQUIP_TOOLTIP_ASSETS.equipFrame.categoryC}')`;
    center.textContent = text;
    tag.appendChild(center);

    const right = document.createElement('span');
    right.className = 'eq-tip-category-edge eq-tip-category-e';
    right.style.backgroundImage = `url('${EQUIP_TOOLTIP_ASSETS.equipFrame.categoryE}')`;
    tag.appendChild(right);

    return tag;
  },

  renderCategoryTags(container, tags) {
    container.innerHTML = '';
    tags.forEach((text) => {
      container.appendChild(this.renderCategoryTag(text));
    });
  },

  renderPotentialBlock(container, title, potState) {
    if (!potState?.lines?.length) return;

    const rankId = potState.rank || potState.lines[0]?.rank || 'rare';
    const rankMeta = typeof POTENTIAL_RANKS !== 'undefined' ? POTENTIAL_RANKS[rankId] : null;
    const rankLabel = rankMeta?.label || rankId;

    const block = document.createElement('section');
    block.className = 'eq-tip-block eq-tip-block-potential';

    const head = document.createElement('div');
    head.className = 'eq-tip-block-head';

    if (rankMeta?.statIcon) {
      const rankIcon = document.createElement('img');
      rankIcon.className = 'eq-tip-potential-rank';
      rankIcon.src = rankMeta.statIcon;
      rankIcon.alt = '';
      head.appendChild(rankIcon);
    }

    const titleEl = document.createElement('span');
    titleEl.className = 'eq-tip-potential-title';
    titleEl.textContent = `${title}：${rankLabel}`;
    head.appendChild(titleEl);

    block.appendChild(head);

    const body = document.createElement('div');
    body.className = 'eq-tip-block-body eq-tip-potential-lines';
    potState.lines.forEach((line) => {
      const row = document.createElement('div');
      row.className = 'eq-tip-line eq-tip-potential-line';

      const lineRank = line.rank || rankId;
      const prefix = document.createElement('img');
      prefix.className = 'eq-tip-potential-line-icon';
      prefix.src = EQUIP_TOOLTIP_ASSETS.textIcon.potentialDetail[lineRank]
        || EQUIP_TOOLTIP_ASSETS.textIcon.potentialDetail.rare;
      prefix.alt = '';
      row.appendChild(prefix);

      const text = document.createElement('span');
      text.className = 'eq-tip-potential-line-text';
      text.textContent = typeof formatPotentialLineDisplay === 'function'
        ? formatPotentialLineDisplay(line)
        : `${line.label} ${line.value}`.trim();
      row.appendChild(text);

      body.appendChild(row);
    });

    block.appendChild(body);
    container.appendChild(block);
  },

  getBaseSlotCount(item) {
    return item.baseMaxUpgradeSlots ?? item.maxUpgradeSlots ?? 0;
  },

  getTotalSlotCount(item) {
    return item.upgradeSlots ?? this.getBaseSlotCount(item);
  },

  getScrollRemain(item) {
    return Math.max(0, this.getTotalSlotCount(item) - (item.scrollUsed || 0));
  },

  getScrollRecoverable(item) {
    return Math.max(0, item.scrollFailUses || 0);
  },

  getHammerUsedCount(item) {
    return (item.goldenHammerUsed || 0) + (item.platinumHammerUsed || 0);
  },

  getPlatinumHammerMax(item) {
    return item.maxPlatinumHammer ?? 5;
  },

  canShowEnhancementUi(item) {
    if (typeof canUseStarForce === 'function' && canUseStarForce(item)) return true;
    if (typeof hasBaseUpgradeSlots === 'function') {
      return hasBaseUpgradeSlots(item);
    }
    return (item.baseMaxUpgradeSlots ?? item.maxUpgradeSlots ?? 0) > 0;
  },

  getBonusStatTooltipIconIndex(line) {
    if (typeof getBonusStatLineIconIndex === 'function') {
      return getBonusStatLineIconIndex(line);
    }
    const tier = Math.floor(Number(line?.starTier) || 1);
    return Math.max(0, Math.min(9, tier));
  },

  renderBonusStatDetail(item) {
    if (typeof canUseBonusStat === 'function' && !canUseBonusStat(item)) return null;
    const lines = item?.bonusStat?.lines || [];
    if (!lines.length) return null;

    const block = document.createElement('div');
    block.className = 'eq-tip-bonus-block';

    block.appendChild(this.createEnhanceLine(
      EQUIP_TOOLTIP_ASSETS.textIcon.bonusStat,
      '追加屬性',
    ));

    const grid = document.createElement('div');
    grid.className = 'eq-tip-bonus-grid';
    const colSpace = EQUIP_TOOLTIP_SPACE.bonusStatColSpaceX || 153;
    grid.style.setProperty('--eq-tip-bonus-col', `${colSpace}px`);

    lines.forEach((line) => {
      const cell = document.createElement('div');
      cell.className = 'eq-tip-bonus-cell';

      const icon = document.createElement('img');
      icon.className = 'eq-tip-bonus-number';
      icon.src = EQUIP_TOOLTIP_ASSETS.textIcon.bonusStatNumber(this.getBonusStatTooltipIconIndex(line));
      icon.alt = '';
      cell.appendChild(icon);

      const parts = typeof formatBonusStatLineDisplay === 'function'
        ? formatBonusStatLineDisplay(line, item)
        : { label: line?.label || '', value: `+${line?.value ?? 0}` };

      if (parts.label) {
        const label = document.createElement('span');
        label.className = 'eq-tip-bonus-label';
        label.textContent = parts.label;
        cell.appendChild(label);
      }

      const text = document.createElement('span');
      text.className = 'eq-tip-bonus-value';
      text.textContent = parts.value || '';
      cell.appendChild(text);

      grid.appendChild(cell);
    });

    block.appendChild(grid);
    return block;
  },

  renderEnhanceBlock(item, starCount, maxStar) {
    const enhanceBlock = document.createElement('section');
    enhanceBlock.className = 'eq-tip-block eq-tip-enhance-block';

    const showStarForce = typeof canUseStarForce === 'function'
      ? canUseStarForce(item)
      : true;
    if (showStarForce) {
      enhanceBlock.appendChild(this.createEnhanceLine(
        EQUIP_TOOLTIP_ASSETS.textIcon.starForce,
        `星力：${starCount}星 (最多${maxStar}星)`,
      ));
    }

    const totalSlots = this.getTotalSlotCount(item);
    if (totalSlots > 0) {
      const scrollUsed = item.scrollUsed || 0;
      const scrollRemain = this.getScrollRemain(item);
      const scrollRecover = this.getScrollRecoverable(item);
      const scrollText = `卷軸：${scrollUsed}次 (剩餘${scrollRemain}次, 可恢復${scrollRecover}次)`;

      enhanceBlock.appendChild(this.createEnhanceLine(
        EQUIP_TOOLTIP_ASSETS.textIcon.scroll,
        scrollText,
      ));
    }

    const isAtlas = typeof isAtlasOffHandWeapon === 'function' && isAtlasOffHandWeapon(item);
    const platinumMax = this.getPlatinumHammerMax(item);
    if (!isAtlas && platinumMax > 0) {
      const hammerUsed = this.getHammerUsedCount(item);
      enhanceBlock.appendChild(this.createEnhanceLine(
        EQUIP_TOOLTIP_ASSETS.textIcon.hammer,
        `白金鐵鎚：提煉 ${hammerUsed}/${platinumMax}`,
      ));
    }

    return enhanceBlock;
  },

  /** 無魔攻 → 攻擊力 +120 / 魔力 +0；有魔攻則反之 */
  getSoulWeaponChargeBonus(item) {
    const hasMatk = (Number(item?.baseStats?.matk) || 0) > 0;
    return hasMatk
      ? { atk: 0, mad: 120 }
      : { atk: 120, mad: 0 };
  },

  getSoulWeaponDisplayName(item, soul) {
    const raw = soul?.name || item?.soulName || '';
    if (raw === '瑪麗西亞靈魂') return '瑪麗西亞靈魂寶珠';
    return raw;
  },

  getSoulWeaponState(item) {
    if (!item) return null;
    if (typeof SoulWeaponModule !== 'undefined' && typeof SoulWeaponModule.ensureSoulState === 'function') {
      SoulWeaponModule.ensureSoulState(item);
    }
    const soul = item.soul;
    if (!soul?.enchanterApplied) return null;
    const name = this.getSoulWeaponDisplayName(item, soul);
    if (!name) return null;
    return soul;
  },

  formatSoulWeaponOption(soul) {
    const option = soul?.option || soul?.stats || null;
    if (!option) return '';
    if (typeof SoulWeaponModule !== 'undefined' && typeof SoulWeaponModule.formatSoulOption === 'function') {
      return SoulWeaponModule.formatSoulOption(option);
    }
    const label = String(option.label || '').replace(/%$/, '');
    const value = option.value;
    const unit = option.unit || '';
    if (unit === 'lv') return String(option.label || label);
    if (unit === '%') return `${label} +${value}%`;
    return `${label} +${value}`;
  },

  /**
   * 卓越強化區塊（與武器靈魂寶珠相同位置：附加潛能下方、剪刀上方）
   * [icon] 卓越強化: #次
   * 全屬性 +#
   * 最大 HP/最大 MP +#
   * 攻擊力/魔力 +#
   */
  renderExceptionalBlock(container, item) {
    if (typeof getExceptionalLevel !== 'function') return false;
    const level = getExceptionalLevel(item);
    if (level <= 0) return false;

    const block = document.createElement('section');
    block.className = 'eq-tip-block eq-tip-exceptional-block';

    const color = EQUIP_TOOLTIP_FONT.exceptional || '#ff3333';
    const head = this.createEnhanceLine(
      EQUIP_TOOLTIP_ASSETS.textIcon.exceptional,
      `卓越強化:  ${level}次`,
    );
    const headText = head.querySelector('.eq-tip-enhance-text');
    if (headText) headText.style.color = color;
    block.appendChild(head);

    const stats = typeof getExceptionalTotalStats === 'function'
      ? getExceptionalTotalStats(item)
      : {};
    const lines = typeof formatExceptionalTooltipLines === 'function'
      ? formatExceptionalTooltipLines(stats)
      : [];
    lines.forEach((text) => {
      const line = document.createElement('div');
      line.className = 'eq-tip-line eq-tip-exceptional-line';
      line.textContent = text;
      block.appendChild(line);
    });

    container.appendChild(block);
    return true;
  },

  /**
   * 靈魂武器區塊（附加潛能下方、剪刀上方）
   * [icon] 靈魂名稱
   * 靈魂球: 1000/1000 (攻擊力 : +#, 魔力 : +#)
   * 保珠詞條
   * [惡意]技能可使用
   */
  renderSoulWeaponBlock(container, item) {
    const soul = this.getSoulWeaponState(item);
    if (!soul) return false;

    const block = document.createElement('section');
    block.className = 'eq-tip-block eq-tip-soul-block';

    const head = this.createEnhanceLine(
      EQUIP_TOOLTIP_ASSETS.textIcon.soulWeapon,
      this.getSoulWeaponDisplayName(item, soul),
    );
    const headText = head.querySelector('.eq-tip-enhance-text');
    if (headText) headText.style.color = EQUIP_TOOLTIP_FONT.soulWeapon || '#ffffff';
    block.appendChild(head);

    const { atk, mad } = this.getSoulWeaponChargeBonus(item);
    const chargeLine = document.createElement('div');
    chargeLine.className = 'eq-tip-line eq-tip-soul-line';
    chargeLine.textContent = `靈魂球: 1000/1000 (攻擊力 +${atk}, 魔力 +${mad})`;
    block.appendChild(chargeLine);

    const optionText = this.formatSoulWeaponOption(soul);
    if (optionText) {
      const optLine = document.createElement('div');
      optLine.className = 'eq-tip-line eq-tip-soul-line';
      optLine.textContent = optionText;
      block.appendChild(optLine);
    }

    const skillLine = document.createElement('div');
    skillLine.className = 'eq-tip-line eq-tip-soul-line';
    skillLine.textContent = '[惡意]技能可使用';
    block.appendChild(skillLine);

    container.appendChild(block);
    return true;
  },

  renderContent(root, item, slotIndex) {
    root.innerHTML = '';

    const isEquipped = currentEnchantItem?.slotIndex === slotIndex;
    const tags = this.getCategoryTags(item);
    const statLines = this.buildStatSegments(item);
    const maxStar = item.maxStar || 30;
    const starCount = item.star || 0;
    const setId = item.wz?.setItemID || 0;
    const setLabel = EQUIP_SET_LABELS[setId];
    const showEnhancement = this.canShowEnhancementUi(item);

    let starEffectImg = null;
    const showStarGrid = typeof canUseStarForce === 'function'
      ? canUseStarForce(item)
      : showEnhancement;
    if (showStarGrid) {
      const starsHost = document.createElement('div');
      starsHost.className = 'eq-tip-stars-host';
      starEffectImg = this.renderStars(starsHost, starCount, maxStar);
      root.appendChild(starsHost);
    }

    const nameRow = document.createElement('div');
    nameRow.className = 'eq-tip-name-row';

    const catValleyLevel = typeof isCatValleyPotentialItem === 'function'
      && isCatValleyPotentialItem(item)
      ? (typeof getMedalEnhanceLevel === 'function'
        ? getMedalEnhanceLevel(item)
        : (Number(item.medalEnhanceLevel) || 0))
      : (typeof getCatValleyLevel === 'function'
        ? getCatValleyLevel(item)
        : (Number(item.catValleyLevel) || 0));
    if (catValleyLevel > 0) {
      const enhanceEl = document.createElement('div');
      enhanceEl.className = 'eq-tip-cat-valley-enhance';
      enhanceEl.textContent = `強化+${catValleyLevel}的`;
      nameRow.appendChild(enhanceEl);
    }

    const nameEl = document.createElement('div');
    nameEl.className = 'eq-tip-name';
    nameEl.textContent = item.name;
    nameRow.appendChild(nameEl);
    root.appendChild(nameRow);

    this.getRestrictionLines(item).forEach((text) => {
      const lineEl = document.createElement('div');
      lineEl.className = 'eq-tip-trade';
      lineEl.textContent = text;
      root.appendChild(lineEl);
    });

    root.appendChild(this.createDotline('eq-tip-dotline eq-tip-name-dotline'));

    const headRow = document.createElement('div');
    headRow.className = 'eq-tip-head-row';

    const iconWrap = document.createElement('div');
    iconWrap.className = 'eq-tip-icon-wrap';

    const iconBase = document.createElement('img');
    iconBase.className = 'eq-tip-icon-base';
    iconBase.src = EQUIP_TOOLTIP_ASSETS.itemIcon.base;
    iconBase.alt = '';
    iconWrap.appendChild(iconBase);
    this.syncItemIconBaseMetrics(root, iconBase);

    const iconShade = document.createElement('img');
    iconShade.className = 'eq-tip-icon-shade';
    iconShade.src = EQUIP_TOOLTIP_ASSETS.itemIcon.shade;
    iconShade.alt = '';
    iconWrap.appendChild(iconShade);

    const iconImg = document.createElement('img');
    iconImg.className = 'eq-tip-icon';
    iconImg.src = item.icon;
    iconImg.alt = item.name;
    this.scaleEquipIcon(iconImg);
    iconWrap.appendChild(iconImg);
    headRow.appendChild(iconWrap);

    const headMeta = document.createElement('div');
    headMeta.className = 'eq-tip-head-meta';

   
    const equippedEl = document.createElement('div');
    equippedEl.className = 'eq-tip-equipped';
    equippedEl.textContent = '戰鬥力提升量';
    headMeta.appendChild(equippedEl);
    
    const imgEl = document.createElement('img');
    imgEl.src = 'images/UIToolTip/UIToolTip_Item_Equip_imgFont_atkPow_equipped.png'; 
    imgEl.className = 'eq-tip-equipped-img';
    headMeta.appendChild(imgEl);

    const tagRow = document.createElement('div');
    tagRow.className = 'eq-tip-tags';
    this.renderCategoryTags(tagRow, tags);
    headMeta.appendChild(tagRow);

    headRow.appendChild(headMeta);
    root.appendChild(headRow);

    const reqBlock = document.createElement('div');
    reqBlock.className = 'eq-tip-req-block';
    reqBlock.appendChild(this.createInfoLine(
      '裝備職業',
      formatEquipReqJobs(item.reqJob, item.reqJob2),
    ));
    reqBlock.appendChild(this.createInfoLine(
      '要求等級',
      `Lv. ${item.reqLevel || 0}`,
    ));
    root.appendChild(reqBlock);

    root.appendChild(this.createDotline());

    if (setLabel) {
      const setBlock = document.createElement('div');
      setBlock.className = 'eq-tip-req-block eq-tip-set-block';
      const setDisplay = item.wz?.jokerToSetItem
        ? `${setLabel},幸運道具`
        : setLabel;
      setBlock.appendChild(this.createInfoLine('套組效果', setDisplay, {
        valueTone: 'label',
        labelIcon: EQUIP_TOOLTIP_ASSETS.textIcon.setGuide,
      }));

      const isDestinyWeapon = item.weaponTier === 'destiny'
        && String(item.name || '').includes('命運');
      if (isDestinyWeapon) {
        setBlock.appendChild(this.createInfoLine(
          '可使用技能',
          '超越: 決戰意志, 超越: 不屈決意',
          { valueTone: 'label' },
        ));
        const attackSpeed = Number(item.wz?.attackSpeed) || 0;
        if (attackSpeed > 0) {
          setBlock.appendChild(this.createInfoLine(
            '攻擊速度',
            `${attackSpeed}階段`,
            { valueTone: 'label' },
          ));
        }
      }

      root.appendChild(setBlock);
    }

    if (statLines.length) {
      const statBlock = document.createElement('section');
      statBlock.className = 'eq-tip-block eq-tip-stat-block';

      statLines.forEach((line) => {
        const row = document.createElement('div');
        row.className = 'eq-tip-stat-row';

        const label = document.createElement('span');
        label.className = 'eq-tip-stat-label';
        label.textContent = line.label;
        row.appendChild(label);

        const totalCell = document.createElement('span');
        totalCell.className = 'eq-tip-stat-total-cell';
        const breakdownCell = document.createElement('span');
        breakdownCell.className = 'eq-tip-stat-breakdown-cell';
        this.renderStatValue(totalCell, breakdownCell, line);
        row.appendChild(totalCell);
        row.appendChild(breakdownCell);
        statBlock.appendChild(row);
      });

      root.appendChild(statBlock);
    }

    if (showEnhancement) {
      root.appendChild(this.renderEnhanceBlock(item, starCount, maxStar));
    }

    const bonusDetail = this.renderBonusStatDetail(item);
    if (bonusDetail) {
      const bonusWrap = document.createElement('section');
      bonusWrap.className = 'eq-tip-block eq-tip-enhance-block eq-tip-bonus-wrap';
      bonusWrap.appendChild(bonusDetail);
      root.appendChild(bonusWrap);
    }

    const hasMainPotential = !!(item.potential?.lines?.length);
    const hasAddPotential = !!(item.additionalPotential?.lines?.length);
    if (hasMainPotential || hasAddPotential) {
      root.appendChild(this.createDotline());
    }
    if (hasMainPotential) {
      this.renderPotentialBlock(root, '潛在能力', item.potential);
    }
    if (hasAddPotential) {
      this.renderPotentialBlock(root, '附加潛在能力', item.additionalPotential);
    }

    const hasExceptional = typeof getExceptionalLevel === 'function' && getExceptionalLevel(item) > 0;
    const hasSoul = !!this.getSoulWeaponState(item);
    if (hasExceptional || hasSoul) {
      root.appendChild(this.createDotline());
      if (hasExceptional) this.renderExceptionalBlock(root, item);
      if (hasSoul) this.renderSoulWeaponBlock(root, item);
    }

    const showScissorTip = !!(item.wz?.equipTradeBlock || item.wz?.tradeAvailable);
    if (showScissorTip) {
      root.appendChild(this.createDotline());
      const footer = document.createElement('div');
      footer.className = 'eq-tip-footer';
      footer.textContent = '若使用白金神奇剪刀，該道具可進行一次交易！';
      footer.style.color = '#B7BFC5';
      root.appendChild(footer);
    }

    const onlyEquipText = this.getOnlyEquipFooterText(item);
    if (onlyEquipText) {
      if (!showScissorTip) root.appendChild(this.createDotline());
      const onlyFooter = document.createElement('div');
      onlyFooter.className = 'eq-tip-footer';
      onlyFooter.textContent = onlyEquipText;
      onlyFooter.style.color = '#FF8A18';
      root.appendChild(onlyFooter);
    }

    return starEffectImg;
  },

  buildFrame(contentNode) {
    const frame = document.createElement('div');
    frame.className = 'eq-tooltip-frame';

    const slices = ['nw', 'n', 'ne', 'w', 'c', 'e', 'sw', 's', 'se'];
    slices.forEach((key) => {
      const slice = document.createElement('div');
      slice.className = `eq-tooltip-slice eq-tooltip-slice-${key}`;
      const asset = EQUIP_TOOLTIP_ASSETS.frame[key];
      if (asset) slice.style.backgroundImage = `url('${asset}')`;
      frame.appendChild(slice);
    });

    const body = document.createElement('div');
    body.className = 'eq-tooltip-body';
    body.appendChild(contentNode);
    frame.appendChild(body);

    return frame;
  },

  show(anchorEl, itemId, slotIndex, stateOverride = null) {
    if (this.dragging) return;

    const tooltip = document.getElementById('equipTooltip');
    if (!tooltip) return;

    const item = this.resolveItemState(itemId, slotIndex, stateOverride);
    if (!item) return;

    if (
      currentEnchantItem?.slotIndex === slotIndex
      && typeof StarForceModule !== 'undefined'
      && StarForceModule.itemData === currentEnchantItem
    ) {
      item.star = StarForceModule.currentStars;
    }

    const content = document.createElement('div');
    content.className = 'eq-tooltip-content';
    const starEffectImg = this.renderContent(content, item, slotIndex);

    this.stopStarEffect();
    tooltip.innerHTML = '';
    tooltip.appendChild(this.buildFrame(content));
    tooltip.classList.remove('hidden');
    tooltip.setAttribute('aria-hidden', 'false');

    this.position(tooltip, anchorEl);
    if (starEffectImg) {
      window.requestAnimationFrame(() => this.startStarEffect(starEffectImg));
    }
    this.hoverSlot = { itemId, slotIndex };
  },

  position(tooltip, anchorEl) {
    const rect = anchorEl.getBoundingClientRect();
    const gap = 8;
    let left = rect.left - tooltip.offsetWidth - gap;
    let top = rect.top;

    if (left < 8) {
      left = rect.right + gap;
    }

    const maxTop = window.innerHeight - tooltip.offsetHeight - 8;
    top = Math.max(8, Math.min(top, maxTop));

    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
  },

  refreshIfShowing() {
    if (!this.hoverSlot) return;

    const { itemId, slotIndex } = this.hoverSlot;
    if (this.pinned) {
      const anchor = this.pinAnchor
        || document.getElementById('equipDropZone')
        || document.getElementById('inventoryPanel');
      if (anchor) this.show(anchor, itemId, slotIndex);
      return;
    }

    const dropZone = document.getElementById('equipDropZone');
    if (dropZone?._eqTooltipActive && currentEnchantItem) {
      const curId = currentEnchantItem.itemId || currentEnchantItem.id;
      if (curId === itemId) {
        this.show(dropZone, itemId, -1, currentEnchantItem);
        return;
      }
    }

    if (typeof slotIndex === 'string' && slotIndex.startsWith('body:')) {
      const host = document.getElementById('uiEquipSlots');
      const uiSlot = slotIndex.slice(5);
      const slot = host?.querySelector(`.uiequip-slot[data-slot="${uiSlot}"]`);
      if (slot && host?._eqTooltipSlot === slot) {
        this.show(slot, itemId, slotIndex);
      }
      return;
    }

    const grid = document.getElementById('inventoryGrid');
    const slot = grid?.querySelector(`.ms-inv-slot[data-slot-index="${slotIndex}"]`);
    if (slot && grid?._eqTooltipSlot === slot) {
      this.show(slot, itemId, slotIndex);
    }
  },

  /**
   * 釘選 tooltip：持續顯示指定裝備，不受 mouseout 關閉。
   * @param {HTMLElement} [anchorEl]
   * @param {string} itemId
   * @param {number} slotIndex
   */
  pin(anchorEl, itemId, slotIndex) {
    this.pinned = true;
    this.pinAnchor = anchorEl || document.getElementById('equipDropZone') || null;
    const dropZone = document.getElementById('equipDropZone');
    if (dropZone) dropZone._eqTooltipActive = true;
    this.show(this.pinAnchor || dropZone, itemId, slotIndex);
  },

  unpin({ hide = true } = {}) {
    if (!this.pinned && !hide) return;
    this.pinned = false;
    this.pinAnchor = null;
    if (hide) this.hide();
  },

  hide(force = false) {
    if (this.pinned && !force) return;

    const tooltip = document.getElementById('equipTooltip');
    const grid = document.getElementById('inventoryGrid');
    const dropZone = document.getElementById('equipDropZone');
    const bodyHost = document.getElementById('uiEquipSlots');
    if (grid) grid._eqTooltipSlot = null;
    if (dropZone) dropZone._eqTooltipActive = false;
    if (bodyHost) bodyHost._eqTooltipSlot = null;

    this.pinned = false;
    this.pinAnchor = null;
    this.stopStarEffect();
    if (!tooltip) return;
    tooltip.classList.add('hidden');
    tooltip.setAttribute('aria-hidden', 'true');
    tooltip.style.removeProperty('left');
    tooltip.style.removeProperty('top');
    tooltip.innerHTML = '';
    this.hoverSlot = null;
  },
};

