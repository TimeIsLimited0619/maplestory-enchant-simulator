/**
 * EquipTooltipModule - 背包裝備 hover 說明卡（仿 UIToolTip.img）
 */
const EquipTooltipModule = {
  hoverSlot: null,
  starEffectTimer: null,
  starEffectFrame: 0,
  /** @type {HTMLImageElement[]} */
  starEffectImgs: [],
  /** 貓谷潛能操作期間強制持續顯示 */
  pinned: false,
  pinAnchor: null,
  /** 拖曳裝備期間隱藏 tooltip */
  dragging: false,
  /** 物品欄 hover：按住右鍵時側欄改顯示套裝效果 */
  rmbHeld: false,
  _rmbGuardsBound: false,

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
    this.bindInventoryCompareRmb();
    this._ready = true;
  },

  ensureElement() {
    if (!document.getElementById('equipTooltip')) {
      const el = document.createElement('div');
      el.id = 'equipTooltip';
      el.className = 'eq-tooltip hidden';
      el.setAttribute('aria-hidden', 'true');
      document.body.appendChild(el);
    }
    if (!document.getElementById('equipSetTooltip')) {
      const setEl = document.createElement('div');
      setEl.id = 'equipSetTooltip';
      setEl.className = 'eq-set-tooltip hidden';
      setEl.setAttribute('aria-hidden', 'true');
      document.body.appendChild(setEl);
    }
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

  /** 物品欄：按住右鍵切換側欄（比較裝備 ↔ 套裝效果） */
  bindInventoryCompareRmb() {
    if (this._rmbGuardsBound) return;
    this._rmbGuardsBound = true;

    const isInvEquipHover = () => {
      if (typeof InventoryModule !== 'undefined' && InventoryModule.tab !== 'equip') return false;
      const slotIndex = this.hoverSlot?.slotIndex;
      return Number.isInteger(slotIndex) && slotIndex >= 0;
    };

    document.addEventListener('mousedown', (event) => {
      if (event.button !== 2) return;
      if (!isInvEquipHover()) return;
      this.rmbHeld = true;
      this.refreshSidePanel();
    });

    document.addEventListener('mouseup', (event) => {
      if (event.button !== 2) return;
      if (!this.rmbHeld) return;
      this.rmbHeld = false;
      if (isInvEquipHover()) this.refreshSidePanel();
    });

    document.addEventListener('contextmenu', (event) => {
      if (!isInvEquipHover()) return;
      const slot = event.target.closest?.('.ms-inv-slot');
      if (!slot) return;
      event.preventDefault();
    });
  },

  isInventoryEquipSlotIndex(slotIndex) {
    return Number.isInteger(slotIndex) && slotIndex >= 0;
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
    this.bindUiEquipHost('uiEquipSlots');
    this.bindUiEquipHost('uiEquipTotemSlots');
  },

  bindUiEquipHost(hostId) {
    const host = document.getElementById(hostId);
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

  getWeaponTooltipLabels(item) {
    if (typeof WeaponTypeMap === 'undefined' || typeof WeaponTypeMap.getTooltipLabels !== 'function') {
      return null;
    }
    return WeaponTypeMap.getTooltipLabels(item?.itemId || item?.id) || null;
  },

  getEquipJobLabel(item) {
    const mapped = this.getWeaponTooltipLabels(item);
    if (mapped?.job) return mapped.job;
    return formatEquipReqJobs(item.reqJob, item.reqJob2);
  },

  getCategoryTags(item) {
    const tags = [];
    const hideMainCategory = EQUIP_SUBTYPE_HIDE_MAIN_CATEGORY.has(item.subType);
    const main = EQUIP_MAIN_TYPE_LABEL[item.mainType];
    if (main && !hideMainCategory) tags.push(main);

    const mapped = this.getWeaponTooltipLabels(item);
    if (mapped?.category) {
      if (mapped.category !== main) tags.push(mapped.category);
      return tags.slice(0, 3);
    }

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

  /** 名稱下方限制文字：tradeBlock / equipTradeBlock / accountSharable */
  getRestrictionLines(item) {
    const wz = item?.wz || {};
    const lines = [];

    if (wz.tradeBlock || wz.equipTradeBlock) {
      lines.push('無法交換');
    } else if (Number(wz.accountSharable) === 1) {
      lines.push('只能在同帳號內移動');
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
    const canBonus = typeof canUseBonusStat !== 'function' || canUseBonusStat(item);
    const flameAllStat = (!canBonus || typeof getBonusStatStatTotal !== 'function')
      ? 0
      : (getBonusStatStatTotal(bonusLines, 'allStat', item) || 0);
    const flameBoss = (!canBonus || typeof getBonusStatStatTotal !== 'function')
      ? 0
      : (getBonusStatStatTotal(bonusLines, 'bossDmg', item) || 0);
    const flameDmg = (!canBonus || typeof getBonusStatStatTotal !== 'function')
      ? 0
      : (getBonusStatStatTotal(bonusLines, 'dmg', item) || 0);

    const pushWzLine = (label, value, isPercent = false, scrollVal = 0, bonusVal = 0) => {
      const baseVal = Number(value) || 0;
      const scroll = Number(scrollVal) || 0;
      const bonus = Number(bonusVal) || 0;
      const total = baseVal + scroll + bonus;
      if (!(total > 0) && scroll === 0 && bonus === 0) return;
      lines.push({
        label,
        base: baseVal,
        star: 0,
        scroll,
        bonus,
        total,
        isPercent,
      });
    };

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
      if (!(total <= 0 && baseVal <= 0 && scrollVal === 0)) {
        lines.push({
          label,
          base: baseVal,
          star: starVal,
          scroll: scrollVal,
          bonus: bonusVal,
          total,
        });
      }

      // 全屬性緊接 LUK 下方（捲軸／永恆 + 星火合併）
      if (key === 'luk') {
        pushWzLine('全屬性', 0, true, item.scrollAllStatR || 0, flameAllStat);
      }
    }

    const wz = item.wz || {};
    // 傷害 → BOSS怪物傷害 → 無視怪物防禦率
    pushWzLine('傷害', wz.damR, true, item.scrollDamR || 0, flameDmg);
    pushWzLine('BOSS怪物傷害', wz.bdR, true, item.scrollBdR || 0, flameBoss);
    pushWzLine('無視怪物防禦率', wz.imdR, true, item.scrollImdR || 0);
    pushWzLine('跳躍力', wz.incJump, false, item.scrollJump || 0);
    pushWzLine('移動速度', wz.incSpeed, false, item.scrollSpeed || 0);

    if (bonusLines.length && typeof aggregateBonusStatLines === 'function') {
      const covered = new Set(Object.values(EQUIP_BONUS_STAT_KEY_MAP));
      covered.add('bossDmg');
      covered.add('allStat');
      covered.add('dmg');
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
    const src = EQUIP_TOOLTIP_ASSETS.equipFrame?.line || EQUIP_TOOLTIP_ASSETS.frame.dotline;
    if (src) line.style.backgroundImage = `url('${src}')`;
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

  createEnhanceLine(iconSrc, text, options = {}) {
    const row = document.createElement('div');
    row.className = 'eq-tip-enhance-row';

    const icon = document.createElement('img');
    icon.className = 'eq-tip-text-icon';
    icon.src = iconSrc;
    icon.alt = '';
    row.appendChild(icon);

    const span = document.createElement('span');
    span.className = 'eq-tip-enhance-text';
    if (options.muted) span.classList.add('is-muted');
    span.textContent = text;
    row.appendChild(span);

    return row;
  },

  /** textIcon 資源：支援 {normal,enhanced} 或舊字串 */
  getEnhanceTextIcon(key, enhanced = false) {
    const entry = EQUIP_TOOLTIP_ASSETS.textIcon?.[key];
    if (!entry) return '';
    if (typeof entry === 'string') return entry;
    return enhanced ? (entry.enhanced || entry.normal) : (entry.normal || entry.enhanced);
  },

  canUseScrollEnhance(item) {
    if (typeof canUseScrollEnhancement === 'function') return canUseScrollEnhancement(item);
    if (typeof isEnhancementLockedItem === 'function' && isEnhancementLockedItem(item)) return false;
    if (typeof hasBaseUpgradeSlots === 'function') return hasBaseUpgradeSlots(item);
    return this.getBaseSlotCount(item) > 0;
  },

  canUseHammerEnhance(item) {
    if (typeof canUseHammerEnhancement === 'function') return canUseHammerEnhancement(item);
    if (typeof isEnhancementLockedItem === 'function' && isEnhancementLockedItem(item)) return false;
    if (typeof isAtlasOffHandWeapon === 'function' && isAtlasOffHandWeapon(item)) return false;
    if (!this.canUseScrollEnhance(item)) return false;
    return this.getPlatinumHammerMax(item) > 0;
  },

  /** 裝備類型是否可擁有主潛能（尚未賦予也算「可」→顯示「無」） */
  itemCanHaveMainPotential(item) {
    if (typeof canHaveMainPotential === 'function') return canHaveMainPotential(item);
    if (!item) return false;
    if (typeof isEnhancementLockedItem === 'function' && isEnhancementLockedItem(item)) return false;
    if (typeof isMedalItem === 'function' && isMedalItem(item)) return false;
    if (typeof isTotemItem === 'function' && isTotemItem(item)) return false;
    if (typeof isPocketItem === 'function' && isPocketItem(item)) return false;
    return true;
  },

  /** 裝備類型是否可擁有附加潛能 */
  itemCanHaveAdditionalPotential(item) {
    if (typeof canHaveAdditionalPotential === 'function') return canHaveAdditionalPotential(item);
    if (!this.itemCanHaveMainPotential(item)) return false;
    if (typeof isPinItem === 'function' && isPinItem(item)) return false;
    return true;
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
    this.starEffectImgs = [];
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
    this.startStarEffects(effectImg ? [effectImg] : []);
  },

  startStarEffects(effectImgs) {
    this.stopStarEffect();
    if (typeof EQUIP_TOOLTIP_STAR_EFFECT === 'undefined') return;

    const list = (Array.isArray(effectImgs) ? effectImgs : [effectImgs])
      .filter((img) => img instanceof HTMLElement);
    if (!list.length) return;

    this.starEffectImgs = list;
    list.forEach((img) => {
      this.applyStarEffectPosition(img);
      this.applyStarEffectFrame(img, 0);
    });
    this.starEffectFrame = 1;
    this.starEffectTimer = window.setInterval(() => {
      if (!this.starEffectImgs.length) return;
      this.starEffectImgs.forEach((img) => {
        this.applyStarEffectFrame(img, this.starEffectFrame);
      });
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

  /**
   * 潛能空狀態列（無／無法強化）；有詞條時仍走 renderPotentialBlock
   */
  renderPotentialStatusLine(title, iconKey, canHave, hasLines) {
    if (hasLines) return null;
    if (!canHave) {
      return this.createEnhanceLine(
        this.getEnhanceTextIcon(iconKey, false),
        `${title} : 無法強化`,
        { muted: true },
      );
    }
    return this.createEnhanceLine(
      this.getEnhanceTextIcon(iconKey, false),
      `${title} : 無`,
      { muted: true },
    );
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
    // 強化列一律顯示（無法強化／無／已強化三種狀態）
    return Boolean(item);
  },

  getBonusStatTooltipIconIndex(line) {
    if (typeof getBonusStatLineIconIndex === 'function') {
      return getBonusStatLineIconIndex(line);
    }
    const tier = Math.floor(Number(line?.starTier) || 1);
    return Math.max(0, Math.min(9, tier));
  },

  renderBonusStatDetail(item) {
    const canBonus = typeof canUseBonusStat === 'function'
      ? canUseBonusStat(item)
      : true;
    const lines = item?.bonusStat?.lines || [];
    const hasLines = lines.length > 0;

    const block = document.createElement('div');
    block.className = 'eq-tip-bonus-block';

    if (!canBonus) {
      block.appendChild(this.createEnhanceLine(
        this.getEnhanceTextIcon('bonusStat', false),
        '追加屬性 : 無法強化',
        { muted: true },
      ));
      return block;
    }

    if (!hasLines) {
      block.appendChild(this.createEnhanceLine(
        this.getEnhanceTextIcon('bonusStat', false),
        '追加屬性 : 無',
        { muted: true },
      ));
      return block;
    }

    block.appendChild(this.createEnhanceLine(
      this.getEnhanceTextIcon('bonusStat', true),
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

    // 星力
    const canStar = typeof canUseStarForce === 'function'
      ? canUseStarForce(item)
      : true;
    if (!canStar) {
      enhanceBlock.appendChild(this.createEnhanceLine(
        this.getEnhanceTextIcon('starForce', false),
        '星力 : 無法強化',
        { muted: true },
      ));
    } else if (!(starCount > 0)) {
      enhanceBlock.appendChild(this.createEnhanceLine(
        this.getEnhanceTextIcon('starForce', false),
        `星力 : 無 (最多${maxStar}星)`,
        { muted: true },
      ));
    } else {
      enhanceBlock.appendChild(this.createEnhanceLine(
        this.getEnhanceTextIcon('starForce', true),
        `星力 : ${starCount}星 (最多${maxStar}星)`,
      ));
    }

    // 卷軸
    const canScroll = this.canUseScrollEnhance(item);
    if (!canScroll) {
      enhanceBlock.appendChild(this.createEnhanceLine(
        this.getEnhanceTextIcon('scroll', false),
        '卷軸 : 無法強化',
        { muted: true },
      ));
    } else {
      const scrollUsed = item.scrollUsed || 0;
      const scrollRemain = this.getScrollRemain(item);
      const scrollRecover = this.getScrollRecoverable(item);
      const slotInfo = `(剩餘${scrollRemain}次, 可恢復${scrollRecover}次)`;
      if (scrollUsed <= 0) {
        enhanceBlock.appendChild(this.createEnhanceLine(
          this.getEnhanceTextIcon('scroll', false),
          `卷軸 : 無 ${slotInfo}`,
          { muted: true },
        ));
      } else {
        enhanceBlock.appendChild(this.createEnhanceLine(
          this.getEnhanceTextIcon('scroll', true),
          `卷軸 : ${scrollUsed}次 ${slotInfo}`,
        ));
      }
    }

    // 白金鐵鎚
    const canHammer = this.canUseHammerEnhance(item);
    if (!canHammer) {
      enhanceBlock.appendChild(this.createEnhanceLine(
        this.getEnhanceTextIcon('hammer', false),
        '白金鐵鎚 : 無法強化',
        { muted: true },
      ));
    } else {
      const hammerUsed = this.getHammerUsedCount(item);
      const platinumMax = this.getPlatinumHammerMax(item);
      const hammerEnhanced = hammerUsed > 0;
      enhanceBlock.appendChild(this.createEnhanceLine(
        this.getEnhanceTextIcon('hammer', hammerEnhanced),
        `白金鐵鎚 : 提煉 ${hammerUsed}/${platinumMax}`,
        { muted: !hammerEnhanced },
      ));
    }

    // 追加屬性（無／無法強化／已有詞條）
    const bonusDetail = this.renderBonusStatDetail(item);
    if (bonusDetail) enhanceBlock.appendChild(bonusDetail);

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
      this.getEnhanceTextIcon('exceptional', true),
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
      this.getEnhanceTextIcon('soulWeapon', false),
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

  formatAtkPowGlyphs(delta) {
    const glyphs = ['sign'];
    const abs = Math.abs(Math.round(Number(delta) || 0));
    if (abs === 0) {
      glyphs.push('0');
      return glyphs;
    }
    const yi = Math.floor(abs / 100000000);
    const wan = Math.floor((abs % 100000000) / 10000);
    const rest = abs % 10000;
    if (yi > 0) {
      glyphs.push(...String(yi).split(''), 'b');
    }
    if (wan > 0) {
      glyphs.push(...String(wan).split(''), 'a');
    }
    if (rest > 0 || (yi === 0 && wan === 0)) {
      glyphs.push(...String(rest).split(''));
    }
    return glyphs;
  },

  computeAtkPowDelta(item) {
    if (typeof EquipStatPanel === 'undefined' || typeof CombatPower === 'undefined') return 0;
    if (typeof CharacterCombatPanel !== 'undefined') {
      CharacterCombatPanel.syncToCombatPower?.();
    }
    const powerOf = (snapshot) => CombatPower.powerValue(CombatPower.calculateCurrentPower(snapshot));
    let current = 0;
    let next = 0;
    try {
      current = powerOf(EquipStatPanel.buildSnapshot());
      const previewEntries = (typeof UiEquipModule !== 'undefined'
        && typeof UiEquipModule.previewWearEntries === 'function')
        ? UiEquipModule.previewWearEntries(item, item)
        : null;
      next = previewEntries
        ? powerOf(EquipStatPanel.buildSnapshot(previewEntries))
        : current;
    } catch (err) {
      console.error('[EquipTooltip] atkPow delta', err);
      return 0;
    }
    return next - current;
  },

  renderAtkPowDelta(item) {
    const wrap = document.createElement('div');
    wrap.className = 'eq-tip-atkpow';
    const delta = this.computeAtkPowDelta(item);
    const tone = delta < 0 ? 'minus' : 'plus';
    const glyphFn = EQUIP_TOOLTIP_ASSETS.atkPow?.glyph;
    this.formatAtkPowGlyphs(delta).forEach((name) => {
      const img = document.createElement('img');
      img.className = 'eq-tip-atkpow-glyph';
      img.src = glyphFn ? glyphFn(tone, name) : '';
      img.alt = '';
      wrap.appendChild(img);
    });
    wrap.dataset.delta = String(delta);
    return wrap;
  },

  /**
   * 機器人 tooltip 下半：外型圖 + 等級 + 說明
   */
  renderAndroidTooltipBody(root, item) {
    const lookSrc = item.androidLook
      || `images/Android/${item.itemId || item.id}A.png`;
    const shortName = item.androidShortName
      || String(item.name || '').replace(/機器人$/, '')
      || item.name
      || '機器人';
    const grade = Number(item.androidGrade) || 1;

    const lookBlock = document.createElement('div');
    lookBlock.className = 'eq-tip-android-look-block';

    const lookLabel = document.createElement('div');
    lookLabel.className = 'eq-tip-android-look-label';
    lookLabel.textContent = '外型:';
    lookBlock.appendChild(lookLabel);

    const lookImg = document.createElement('img');
    lookImg.className = 'eq-tip-android-look';
    lookImg.src = lookSrc;
    lookImg.alt = `${shortName}外型`;
    lookImg.draggable = false;
    lookBlock.appendChild(lookImg);
    root.appendChild(lookBlock);

    const gradeEl = document.createElement('div');
    gradeEl.className = 'eq-tip-android-grade';
    gradeEl.textContent = `等級：${grade}`;
    root.appendChild(gradeEl);

    const descEl = document.createElement('div');
    descEl.className = 'eq-tip-android-desc';
    const shopEnabled = item.androidShop !== false;
    const parts = [
      `外型與${shortName}相仿的機器人，`,
    ];
    if (shopEnabled) {
      parts.push('在機器人裝備視窗按下');
      parts.push({ em: '前往商店' });
      parts.push('按鈕就可以使用雜貨商店功能。');
    }
    parts.push('需要同時裝置');
    parts.push({ em: '機器人心臟' });
    parts.push('才能運作。機器人等級需要等於或高過於機器人心臟才可裝置。');

    parts.forEach((part) => {
      if (typeof part === 'string') {
        descEl.appendChild(document.createTextNode(part));
        return;
      }
      const em = document.createElement('span');
      em.className = 'eq-tip-android-em';
      em.textContent = part.em;
      descEl.appendChild(em);
    });
    root.appendChild(descEl);

    if (item.androidNonHuman) {
      const note = document.createElement('div');
      note.className = 'eq-tip-android-note';
      note.textContent = '不可變更髮型與臉型，是即使穿戴現金道具也無法變更外型的非人類類型機器人。';
      root.appendChild(note);
    }
  },

  renderContent(root, item, slotIndex) {
    root.innerHTML = '';

    const isEquipped = typeof slotIndex === 'string' && slotIndex.startsWith('body:');
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
    const showCatValleyPlus = typeof isCatValleyPotentialItem === 'function'
      && isCatValleyPotentialItem(item)
      ? (typeof isCatValleyMedalEnhanceStarted === 'function'
        ? isCatValleyMedalEnhanceStarted(item)
        : catValleyLevel > 0)
      : (typeof isCatValleyTotemItem === 'function'
        && isCatValleyTotemItem(item)
        && typeof isCatValleyTotemStarted === 'function'
        ? isCatValleyTotemStarted(item)
        : catValleyLevel > 0);
    if (showCatValleyPlus) {
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

    if (isEquipped) {
      const imgEl = document.createElement('img');
      imgEl.src = EQUIP_TOOLTIP_ASSETS.atkPow?.equipped
        || 'images/UIToolTip/UIToolTip_Item_Equip_imgFont_atkPow_equipped.png';
      imgEl.className = 'eq-tip-equipped-img';
      imgEl.alt = '目前穿戴中的裝備';
      headMeta.appendChild(imgEl);
    } else {
      headMeta.appendChild(this.renderAtkPowDelta(item));
    }

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
      this.getEquipJobLabel(item),
    ));
    const reqLevel = Number(item.reqLevel) || 0;
    if (reqLevel > 0) {
      reqBlock.appendChild(this.createInfoLine(
        '要求等級',
        `Lv. ${reqLevel}`,
      ));
    }
    root.appendChild(reqBlock);

    root.appendChild(this.createDotline());

    // 機器人：上半與一般相同，下半改為外型／說明（不顯示屬性與強化列）
    if (typeof isAndroidItem === 'function' ? isAndroidItem(item) : item.subType === 'android') {
      this.renderAndroidTooltipBody(root, item);
      return starEffectImg;
    }

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

      const itemName = String(item.name || '');
      const isDestinyWeapon = item.weaponTier === 'destiny' && itemName.includes('命運');
      const isGenesisWeapon = item.weaponTier === 'destiny' && itemName.includes('創世');
      if (isDestinyWeapon) {
        setBlock.appendChild(this.createInfoLine(
          '可使用技能',
          '超越: 決戰意志, 超越: 不屈決意',
          { valueTone: 'label' },
        ));
      }
      if (isGenesisWeapon) {
        setBlock.appendChild(this.createInfoLine(
          '可使用技能',
          '破壞的雅達巴特, 創造的伊恩',
          { valueTone: 'label' },
        ));
      }
      if (isDestinyWeapon || isGenesisWeapon) {
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

    const hasMainPotential = !!(item.potential?.lines?.length);
    const hasAddPotential = !!(item.additionalPotential?.lines?.length);
    const canMainPot = this.itemCanHaveMainPotential(item);
    const canAddPot = this.itemCanHaveAdditionalPotential(item);

    // 潛能區一律顯示（無／無法強化／詞條明細）
    root.appendChild(this.createDotline());

    if (hasMainPotential) {
      this.renderPotentialBlock(root, '潛在能力', item.potential);
    } else {
      const mainStatus = this.renderPotentialStatusLine(
        '潛在能力',
        'potential',
        canMainPot,
        false,
      );
      if (mainStatus) root.appendChild(mainStatus);
    }

    if (hasAddPotential) {
      this.renderPotentialBlock(root, '附加潛在能力', item.additionalPotential);
    } else {
      const addStatus = this.renderPotentialStatusLine(
        '附加潛在能力',
        'additionalPotential',
        canAddPot,
        false,
      );
      if (addStatus) root.appendChild(addStatus);
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
    const assets = EQUIP_TOOLTIP_ASSETS.equipFrame || {};
    const frame = document.createElement('div');
    frame.className = 'eq-tooltip-frame';

    const top = document.createElement('div');
    top.className = 'eq-tooltip-frame-top';
    if (assets.top) top.style.backgroundImage = `url('${assets.top}')`;

    const midWrap = document.createElement('div');
    midWrap.className = 'eq-tooltip-mid-wrap';
    const mid = document.createElement('div');
    mid.className = 'eq-tooltip-frame-mid';
    if (assets.mid) mid.style.backgroundImage = `url('${assets.mid}')`;
    midWrap.appendChild(mid);

    const btm = document.createElement('div');
    btm.className = 'eq-tooltip-frame-btm';
    if (assets.btm) btm.style.backgroundImage = `url('${assets.btm}')`;

    const body = document.createElement('div');
    body.className = 'eq-tooltip-body';
    body.appendChild(contentNode);
    midWrap.appendChild(body);

    frame.appendChild(top);
    frame.appendChild(midWrap);
    frame.appendChild(btm);
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
    this.hoverSlot = { itemId, slotIndex };
    const compareStarEffectImg = this.updateSidePanel(item, slotIndex);
    this.positionSet(tooltip);
    window.requestAnimationFrame(() => this.positionSet(tooltip));
    window.requestAnimationFrame(() => {
      this.startStarEffects([starEffectImg, compareStarEffectImg]);
    });
  },

  /**
   * 側欄：物品欄 hover 預設顯示身上同部位裝備；按住右鍵改顯示套裝效果。
   * 強化槽／裝備欄 hover 維持只顯示套裝效果。
   * @returns {HTMLImageElement|null} 比對裝備的星力特效圖（若有）
   */
  updateSidePanel(item, slotIndex) {
    if (this.isInventoryEquipSlotIndex(slotIndex) && !this.rmbHeld) {
      return this.renderCompareTooltip(item);
    }
    this.renderSetTooltip(item);
    return null;
  },

  refreshSidePanel() {
    if (!this.hoverSlot) return;
    const { itemId, slotIndex } = this.hoverSlot;
    const item = this.resolveItemState(itemId, slotIndex);
    if (!item) return;
    const mainStar = document.querySelector('#equipTooltip .eq-tip-star-effect');
    const compareStar = this.updateSidePanel(item, slotIndex);
    this.positionSet(document.getElementById('equipTooltip'));
    this.startStarEffects([mainStar, compareStar]);
  },

  /** 在套裝提示位置顯示身上同部位裝備的 UIToolTip */
  renderCompareTooltip(bagItem) {
    const el = document.getElementById('equipSetTooltip');
    if (!el) return null;

    const worn = typeof UiEquipModule !== 'undefined'
      ? UiEquipModule.findWornCompareEntry?.(bagItem)
      : null;
    if (!worn?.itemId) {
      this.hideSetTooltip();
      return null;
    }

    const bodySlotKey = `body:${worn.slotId}`;
    const wornItem = this.resolveItemState(worn.itemId, bodySlotKey, worn.state);
    if (!wornItem) {
      this.hideSetTooltip();
      return null;
    }

    const content = document.createElement('div');
    content.className = 'eq-tooltip-content';
    const starEffectImg = this.renderContent(content, wornItem, bodySlotKey);

    el.innerHTML = '';
    el.appendChild(this.buildFrame(content));
    el.classList.remove('hidden');
    el.setAttribute('aria-hidden', 'false');
    return starEffectImg || null;
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

  hideSetTooltip() {
    const el = document.getElementById('equipSetTooltip');
    if (!el) return;
    el.classList.add('hidden');
    el.setAttribute('aria-hidden', 'true');
    el.style.removeProperty('left');
    el.style.removeProperty('top');
    el.innerHTML = '';
  },

  renderSetTooltip(item) {
    const el = document.getElementById('equipSetTooltip');
    if (!el) return;
    const setId = Number(item?.wz?.setItemID) || 0;
    const snap = typeof getEquipSetSnapshot === 'function' ? getEquipSetSnapshot(setId) : null;
    if (!snap) {
      this.hideSetTooltip();
      return;
    }

    const assets = typeof EQUIP_SET_TOOLTIP_ASSETS !== 'undefined' ? EQUIP_SET_TOOLTIP_ASSETS : {};
    const frame = document.createElement('div');
    frame.className = 'eq-set-frame';

    const top = document.createElement('div');
    top.className = 'eq-set-frame-top';
    if (assets.frame?.top) top.style.backgroundImage = `url('${assets.frame.top}')`;

    const midWrap = document.createElement('div');
    midWrap.className = 'eq-set-mid-wrap';
    const mid = document.createElement('div');
    mid.className = 'eq-set-frame-mid';
    if (assets.frame?.mid) mid.style.backgroundImage = `url('${assets.frame.mid}')`;
    midWrap.appendChild(mid);

    const btm = document.createElement('div');
    btm.className = 'eq-set-frame-btm';
    if (assets.frame?.btm) btm.style.backgroundImage = `url('${assets.frame.btm}')`;

    const body = document.createElement('div');
    body.className = 'eq-set-body';

    const head = document.createElement('div');
    head.className = 'eq-set-head';
    const icon = document.createElement('img');
    icon.className = 'eq-set-icon';
    icon.src = assets.icon || '';
    icon.alt = '';
    const title = document.createElement('div');
    title.className = 'eq-set-title';
    title.textContent = snap.name;
    const count = document.createElement('div');
    count.className = 'eq-set-count';
    count.textContent = `${snap.wornCount} / ${snap.total}`;
    head.appendChild(icon);
    head.appendChild(title);
    head.appendChild(count);
    body.appendChild(head);

    const lineTop = document.createElement('div');
    lineTop.className = 'eq-set-line';
    if (assets.frame?.line) lineTop.style.backgroundImage = `url('${assets.frame.line}')`;
    body.appendChild(lineTop);

    const list = document.createElement('div');
    list.className = 'eq-set-list';
    snap.rows.forEach((row) => {
      const rowEl = document.createElement('div');
      rowEl.className = 'eq-set-row';
      if (row.equipped) rowEl.classList.add('is-equipped');

      const slotEl = document.createElement('span');
      slotEl.className = 'eq-set-slot';
      slotEl.textContent = row.slot;

      const nameWrap = document.createElement('span');
      nameWrap.className = 'eq-set-name';
      if (row.lucky) {
        nameWrap.classList.add('is-lucky');
        nameWrap.classList.add(row.luckyKind === 'genesis' ? 'is-genesis' : 'is-destiny');
        const luckyIcon = document.createElement('img');
        luckyIcon.className = 'eq-set-lucky-icon';
        luckyIcon.src = assets.luckyIcon || '';
        luckyIcon.alt = '';
        const text = document.createElement('span');
        text.className = 'eq-set-lucky-text';
        text.textContent = row.displayName;
        nameWrap.appendChild(text);
        nameWrap.appendChild(luckyIcon);
      } else {
        nameWrap.textContent = row.displayName;
      }

      rowEl.appendChild(slotEl);
      rowEl.appendChild(nameWrap);
      list.appendChild(rowEl);
    });
    body.appendChild(list);

    const lineMid = document.createElement('div');
    lineMid.className = 'eq-set-line';
    if (assets.frame?.line) lineMid.style.backgroundImage = `url('${assets.frame.line}')`;
    body.appendChild(lineMid);

    const effects = document.createElement('div');
    effects.className = 'eq-set-effects';
    snap.effects.forEach((block) => {
      const group = document.createElement('div');
      group.className = `eq-set-effect${block.active ? ' is-active' : ''}`;
      const label = document.createElement('div');
      label.className = 'eq-set-effect-label';
      label.textContent = `${block.count}套裝效果`;
      const linesWrap = document.createElement('div');
      linesWrap.className = 'eq-set-effect-lines';
      block.lines.forEach((line) => {
        const lineEl = document.createElement('div');
        lineEl.className = 'eq-set-effect-line';
        lineEl.textContent = line;
        linesWrap.appendChild(lineEl);
      });
      group.appendChild(label);
      group.appendChild(linesWrap);
      effects.appendChild(group);
    });
    body.appendChild(effects);
    midWrap.appendChild(body);

    frame.appendChild(top);
    frame.appendChild(midWrap);
    frame.appendChild(btm);
    el.innerHTML = '';
    el.appendChild(frame);
    el.classList.remove('hidden');
    el.setAttribute('aria-hidden', 'false');
  },

  positionSet(itemTooltip) {
    const el = document.getElementById('equipSetTooltip');
    if (!el || el.classList.contains('hidden') || !itemTooltip) return;

    const gap = 1;
    const rect = itemTooltip.getBoundingClientRect();
    let left = rect.right + gap;
    let top = rect.top;
    if (left + el.offsetWidth > window.innerWidth - 8) {
      left = rect.left - el.offsetWidth - gap;
    }
    if (left < 8) left = 8;
    const maxTop = window.innerHeight - el.offsetHeight - 8;
    top = Math.max(8, Math.min(top, maxTop));
    el.style.left = `${left}px`;
    el.style.top = `${top}px`;

    // 側欄因視窗底部被上推時，裝備 tooltip 上緣跟著對齊
    if (top < rect.top - 0.5) {
      itemTooltip.style.top = `${top}px`;
    }
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
      const uiSlot = slotIndex.slice(5);
      const hosts = [
        document.getElementById('uiEquipSlots'),
        document.getElementById('uiEquipTotemSlots'),
      ];
      for (const host of hosts) {
        const slot = host?.querySelector(`.uiequip-slot[data-slot="${uiSlot}"]`);
        if (slot && host?._eqTooltipSlot === slot) {
          this.show(slot, itemId, slotIndex);
          return;
        }
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
    const totemHost = document.getElementById('uiEquipTotemSlots');
    if (grid) grid._eqTooltipSlot = null;
    if (dropZone) dropZone._eqTooltipActive = false;
    if (bodyHost) bodyHost._eqTooltipSlot = null;
    if (totemHost) totemHost._eqTooltipSlot = null;

    this.pinned = false;
    this.pinAnchor = null;
    this.rmbHeld = false;
    this.stopStarEffect();
    this.hideSetTooltip();
    if (!tooltip) return;
    tooltip.classList.add('hidden');
    tooltip.setAttribute('aria-hidden', 'true');
    tooltip.style.removeProperty('left');
    tooltip.style.removeProperty('top');
    tooltip.innerHTML = '';
    this.hoverSlot = null;
  },
};

