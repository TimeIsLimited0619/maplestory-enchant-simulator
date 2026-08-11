/**
 * StarForceModule - 星力獨立邏輯與 UI 渲染
 */
const StarForceModule = {
  currentStars: 0,
  itemData: null,
  autoRunning: false,
  autoCancelled: false,
  autoCancelHandler: null,
  AUTO_ENHANCE_DELAY_MS: 8,

  /** 星力強化統計改由 CostTrackerModule 保存，避免切換分頁時被 resetState 清空 */
  getStatsCount() {
    if (typeof CostTrackerModule !== 'undefined') {
      return CostTrackerModule.getStarStats();
    }
    if (!this._fallbackStatsCount) {
      this._fallbackStatsCount = {
        starNormal: 0,
        mesoSpent: 0,
        scrollSet20: 0,
        scroll23_100: 0,
        scroll23_30: 0,
        scroll24: 0,
        scroll25: 0
      };
    }
    return this._fallbackStatsCount;
  },

  /** 背包消耗欄選中的星力卷（null = 一般楓幣強化） */
  selectedScrollId: null,
  costItemEventsBound: false,

  loadEquip(item) {
    this.currentStars = item.star ?? 0;
    this.itemData = item;
    this.setStarConsecutiveDrops(item.starConsecutiveDrops ?? 0);
    this.updateUI();
  },

  getStarConsecutiveDrops() {
    return this.itemData?.starConsecutiveDrops || 0;
  },

  setStarConsecutiveDrops(count) {
    const next = Math.max(0, count || 0);
    if (this.itemData) {
      this.itemData.starConsecutiveDrops = next;
    }
    if (currentEnchantItem && currentEnchantItem === this.itemData) {
      currentEnchantItem.starConsecutiveDrops = next;
    }
  },

  resetState() {
    this.cancelAutoEnhance();
    this.currentStars = 0;
    this.itemData = null;
    this.selectedScrollId = null;
    this.updateUI();
    this.updateStatsUI();
    this.resetEnhanceButton();
  },

  /** 卸下裝備時保留已選卷軸 */
  clearEquipState() {
    this.cancelAutoEnhance();
    this.currentStars = 0;
    this.itemData = null;
    this.updateUI();
    this.resetEnhanceButton();
  },

  resetEnhanceButton() {
    this.updateEnhanceButtonState();
  },

  updateEnhanceButtonState() {
    const btn = document.getElementById('btnStarEnhance');
    if (!btn) return;

    const maxStar = this.itemData ? (this.itemData.maxStar || 30) : 30;
    const canEnhance = Boolean(this.itemData && canUseStarForce(this.itemData));
    const effectPlaying = typeof StarForceEffectModule !== 'undefined'
      && StarForceEffectModule.isPlaying();
    const shouldDisable = !canEnhance
      || this.autoRunning
      || effectPlaying
      || this.currentStars >= maxStar
      || !this.ensureSelectedScrollAvailable(true);
    btn.disabled = shouldDisable;
    if (!shouldDisable) {
      btn.removeAttribute('aria-busy');
    }

    const autoCheck = document.getElementById('chkAutoEnhance');
    const overlayOn = typeof AUTO_ENCHANT_USE_OVERLAY !== 'undefined' && AUTO_ENCHANT_USE_OVERLAY;
    if (autoCheck) {
      if (overlayOn && typeof AutoEnchantStarForceModule !== 'undefined') {
        AutoEnchantStarForceModule.syncAutoCheckbox();
      } else {
        autoCheck.disabled = !canEnhance || Boolean(this.selectedScrollId);
      }
    }
  },

  setPanelMode(mode) {
    const idlePanel = document.getElementById('sfIdlePanel');
    const activePanel = document.getElementById('sfActivePanel');
    const costArea = document.getElementById('sfCostArea');
    const blockedMsg = document.getElementById('sfBlockedMessage');
    const isIdle = mode === 'idle' || mode === 'idle-scroll';
    const isIdleScroll = mode === 'idle-scroll';
    const isBlocked = mode === 'blocked';

    if (idlePanel) {
      idlePanel.classList.toggle('hidden', !isIdle && !isBlocked);
      idlePanel.classList.toggle('sf-idle-scroll-mode', isIdleScroll);
    }
    if (activePanel) activePanel.classList.toggle('hidden', isIdle || isBlocked);
    if (blockedMsg) blockedMsg.classList.toggle('hidden', !isBlocked);
    if (costArea) {
      costArea.classList.toggle('sf-cost-idle-scroll', isIdleScroll);
      costArea.classList.toggle('hidden', mode === 'idle');
      costArea.setAttribute('aria-hidden', mode === 'idle' ? 'true' : 'false');
    }

    if (typeof syncMainPanelIdleState === 'function') {
      syncMainPanelIdleState();
    }

    this.updateEnhanceButtonState();
  },

  setIdleMode(isIdle) {
    this.setPanelMode(isIdle ? 'idle' : 'active');
  },

  bindAutoCancelListener() {
    if (this.autoCancelHandler) return;

    this.autoCancelHandler = (event) => {
      if (!this.autoRunning) return;
      if (event.repeat) return;
      this.cancelAutoEnhance();
    };

    window.addEventListener('keydown', this.autoCancelHandler);
  },

  unbindAutoCancelListener() {
    if (!this.autoCancelHandler) return;
    window.removeEventListener('keydown', this.autoCancelHandler);
    this.autoCancelHandler = null;
  },

  cancelAutoEnhance() {
    if (!this.autoRunning) return;

    this.autoCancelled = true;
    this.autoRunning = false;
    this.unbindAutoCancelListener();
    this.resetEnhanceButton();
  },

  handleEnhanceClick() {
    if (!this.itemData) {
      alert('請先將裝備放入中間強化槽！');
      return;
    }

    if (!canUseStarForce(this.itemData)) {
      return addLog('⚠️ 此裝備無法進行星力強化。', 'log-fail');
    }

    const auto = document.getElementById('chkAutoEnhance')?.checked;
    const overlayOn = typeof AUTO_ENCHANT_USE_OVERLAY !== 'undefined' && AUTO_ENCHANT_USE_OVERLAY;
    if (auto && !overlayOn) {
      this.runAutoEnhance();
    } else {
      this.enhanceStarWithAnim();
    }
  },

  async runAutoEnhance() {
    if (this.autoRunning || !this.itemData) return;

    const target = typeof AutoEnchantStarForceModule !== 'undefined'
      ? AutoEnchantStarForceModule.targetStar
      : parseInt(document.getElementById('autoStarTarget')?.value, 10);
    const maxStar = this.itemData.maxStar || 30;

    if (!target || target <= this.currentStars) {
      return addLog('⚠️ 目標星數必須高於目前星力！', 'log-fail');
    }
    if (this.currentStars >= maxStar) {
      return addLog(`已達最高 ★ ${maxStar} 星！`, 'log-success');
    }

    this.autoRunning = true;
    this.autoCancelled = false;
    const btn = document.getElementById('btnStarEnhance');
    if (btn) btn.setAttribute('aria-busy', 'true');
    this.updateEnhanceButtonState();
    this.bindAutoCancelListener();

    const startStars = this.currentStars;
    let attempts = 0;

    try {
      while (
        this.autoRunning &&
        this.itemData &&
        this.currentStars < target &&
        this.currentStars < maxStar
      ) {
        const prev = this.currentStars;
        this.enhanceStar({ silent: true });
        attempts++;

        if (this.currentStars !== prev) {
          await new Promise((resolve) => setTimeout(resolve, this.AUTO_ENHANCE_DELAY_MS * 2));
        } else {
          await new Promise((resolve) => setTimeout(resolve, this.AUTO_ENHANCE_DELAY_MS));
        }

        if (attempts > 10000) break;
      }
    } finally {
      this.unbindAutoCancelListener();
    }

    const wasCancelled = this.autoCancelled;
    this.autoRunning = false;
    this.autoCancelled = false;
    this.resetEnhanceButton();

    if (typeof AutoEnchantStarForceModule !== 'undefined') {
      AutoEnchantStarForceModule.syncAutoCheckbox();
    }

    if (wasCancelled) {
      addLog(
        `⏹️ 已取消自動強化（任意鍵）：★ ${startStars} → ★ ${this.currentStars}（共 ${attempts} 次）`,
        'log-info'
      );
    } else {
      addLog(
        `⚡ 自動強化完成：★ ${startStars} → ★ ${this.currentStars}（共 ${attempts} 次）`,
        'log-success'
      );
    }
  },

  getRates(star) {
    return (typeof starRates !== 'undefined' && starRates[star])
      ? starRates[star]
      : { success: 30, keep: 70, drop: 0 };
  },

  getMesoCost(star) {
    const reqLevel = this.itemData?.reqLevel || 200;
    const table = typeof starMesoCosts !== 'undefined' ? starMesoCosts[reqLevel] : null;
    if (!table || star < 0 || star >= table.length) return 0;
    return table[star];
  },

  formatMeso(amount) {
    return typeof formatMesoAmount === 'function'
      ? formatMesoAmount(amount)
      : `${Number(amount).toLocaleString()} 楓幣`;
  },

  getStatGain(fromStar, toStar) {
    if (typeof getStarForceGain === 'function' && this.itemData) {
      return getStarForceGain(fromStar, toStar, this.itemData);
    }

    const table = typeof resolveStarStatsTable === 'function'
      ? resolveStarStatsTable(this.itemData?.reqLevel)
      : null;
    if (!table) return { statDiff: 0, atkDiff: 0, matkDiff: 0, defDiff: 0 };

    const cur = table[fromStar] || [0, 0];
    const next = table[toStar] || cur;
    const statDiff = next[0] - cur[0];
    const atkDiff = next[1] - cur[1];

    return {
      statDiff,
      atkDiff,
      matkDiff: atkDiff,
      defDiff: this.itemData?.mainType === EQUIP_TYPE.ARMOR && typeof getStarDefBonusAtStar === 'function'
        ? getStarDefBonusAtStar(toStar, this.itemData) - getStarDefBonusAtStar(fromStar, this.itemData)
        : 0,
    };
  },

  getSelectedScroll() {
    if (!this.selectedScrollId || typeof getStarForceScrollById !== 'function') return null;
    return getStarForceScrollById(this.selectedScrollId);
  },

  setSelectedScroll(scrollId) {
    const nextId = scrollId || null;
    if (nextId && typeof getStarForceScrollById === 'function' && !getStarForceScrollById(nextId)) {
      return;
    }
    this.selectedScrollId = nextId;
    this.updateUI();
    if (typeof InventoryModule !== 'undefined') {
      InventoryModule.render();
    }
  },

  clearSelectedScroll() {
    this.setSelectedScroll(null);
  },

  bindCostItemEvents() {
    if (this.costItemEventsBound) return;

    const iconEl = document.getElementById('sfCostItemIcon');
    iconEl?.addEventListener('dblclick', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.handleCostItemDblClick();
    });

    this.costItemEventsBound = true;
  },

  handleCostItemDblClick() {
    if (!this.selectedScrollId) return;

    const scroll = this.getSelectedScroll();
    this.clearSelectedScroll();

    if (scroll && typeof addLog === 'function') {
      addLog(`[星力] 已取下【${scroll.name}】。`, 'log-info');
    }
  },

  getSelectedMethod() {
    return this.getSelectedScroll()?.method || 'normal';
  },

  ensureSelectedScrollAvailable(silent = false) {
    const scroll = this.getSelectedScroll();
    if (!scroll) return true;
    const count = typeof getPlayerStarForceScrollCount === 'function'
      ? getPlayerStarForceScrollCount(scroll.id)
      : 0;
    if (count > 0) return true;
    if (!silent) addLog(`⚠️ ${scroll.name} 數量不足！`, 'log-fail');
    return false;
  },

  consumeSelectedScroll() {
    const scroll = this.getSelectedScroll();
    if (!scroll || typeof consumeStarForceScroll !== 'function') return false;
    return consumeStarForceScroll(scroll.id, 1);
  },

  /** 星力20卷預覽：受影響星數上限（null = 非此模式） */
  getScrollSet20PreviewTarget() {
    const scroll = this.getSelectedScroll();
    if (!scroll || scroll.method !== 'scroll_set20_100') return null;
    if (!this.itemData || this.currentStars >= 20) return null;
    return scroll.previewTargetStar ?? 20;
  },

  shouldBlinkStarIndex(starIndex, maxStars) {
    const set20Target = this.getScrollSet20PreviewTarget();
    if (set20Target != null) {
      return starIndex > this.currentStars && starIndex <= set20Target;
    }
    return starIndex === this.currentStars + 1 && this.currentStars < maxStars;
  },

  createBlinkStarSlot(starIndex) {
    const starSlot = document.createElement('span');
    starSlot.className = 'ms-star-slot';
    starSlot.dataset.starIndex = String(starIndex);
    const starNext = document.createElement('span');
    starNext.className = 'ms-star-icon next';
    starNext.dataset.starIndex = String(starIndex);
    starNext.setAttribute('aria-hidden', 'true');
    starSlot.appendChild(starNext);
    return starSlot;
  },

  renderCostArea() {
    const costArea = document.getElementById('sfCostArea');
    const mesoEl = document.getElementById('sfCostMeso');
    const itemEl = document.getElementById('sfCostItem');
    const scroll = this.getSelectedScroll();
    const useScroll = Boolean(scroll);
    const hasEquip = Boolean(this.itemData);
    const showCostArea = hasEquip || useScroll;

    if (costArea) {
      costArea.classList.toggle('hidden', !showCostArea);
      costArea.setAttribute('aria-hidden', showCostArea ? 'false' : 'true');
    }

    mesoEl?.classList.toggle('hidden', useScroll);
    itemEl?.classList.toggle('hidden', !useScroll);
    itemEl?.setAttribute('aria-hidden', useScroll ? 'false' : 'true');

    document.querySelector('#sfIdlePanel .sf-idle-lower')
      ?.classList.toggle('sf-idle-lower-item', useScroll && !hasEquip);

    if (!useScroll) {
      if (hasEquip && mesoEl) mesoEl.classList.remove('hidden');
      return;
    }

    const nameEl = document.getElementById('sfCostItemName');
    const iconEl = document.getElementById('sfCostItemIcon');

    if (nameEl) nameEl.textContent = scroll.name;
    if (iconEl) {
      iconEl.src = scroll.icon || '';
      iconEl.alt = scroll.name;
      iconEl.title = '雙擊取下';
      iconEl.onerror = () => {
        iconEl.style.visibility = 'hidden';
      };
      iconEl.onload = () => {
        iconEl.style.visibility = 'visible';
      };
    }

    this.bindCostItemEvents();
  },

  renderStarsGrid() {
    const starImgContainer = document.getElementById('starImgContainer');
    if (!starImgContainer) return;

    const maxStars = this.itemData ? (this.itemData.maxStar || 30) : 30;
    starImgContainer.innerHTML = '';

    const groupCount = Math.ceil(maxStars / 5);
    const rowPattern = groupCount <= 5
      ? [groupCount]
      : groupCount <= 6
        ? [3, groupCount - 3]
        : [3, 2, groupCount - 5];

    const rowsWrap = document.createElement('div');
    rowsWrap.className = 'sf-stars-rows';

    let groupIndex = 0;
    rowPattern.forEach((groupsInRow) => {
      const row = document.createElement('div');
      row.className = 'sf-stars-row';

      for (let g = 0; g < groupsInRow; g++) {
        const group = document.createElement('div');
        group.className = 'sf-star-group';

        for (let i = 0; i < 5; i++) {
          const starIndex = groupIndex * 5 + i + 1;
          if (starIndex > maxStars) break;

          if (this.shouldBlinkStarIndex(starIndex, maxStars)) {
            group.appendChild(this.createBlinkStarSlot(starIndex));
            continue;
          }

          const starImg = document.createElement('img');
          starImg.alt = '★';
          starImg.dataset.starIndex = String(starIndex);

          if (starIndex <= this.currentStars) {
            starImg.src = 'images/starforce/summaryStar.png';
            starImg.className = 'ms-star-icon active';
          } else {
            starImg.src = 'images/starforce/summaryStar.empty.png';
            starImg.className = 'ms-star-icon empty';
          }

          group.appendChild(starImg);
        }

        row.appendChild(group);
        groupIndex++;
      }

      rowsWrap.appendChild(row);
    });

    starImgContainer.appendChild(rowsWrap);
  },

  renderStatDiff() {
    const statsDiffPanel = document.getElementById('statsDiffPanel');
    const starBeforeImg = document.getElementById('starBeforeImg');
    const starAfterImg = document.getElementById('starAfterImg');
    const statsDiffList = document.getElementById('statsDiffList');

    if (!this.itemData) {
      if (statsDiffPanel) statsDiffPanel.classList.add('hidden');
      if (statsDiffList) statsDiffList.innerHTML = '';
      return;
    }

    const maxStars = this.itemData.maxStar || 30;

    if (starBeforeImg && starAfterImg) {
      const diffPanel = document.getElementById('statsDiffPanel');
      const diffArrow = diffPanel?.querySelector('.sf-diff-arrow');
      const after30Src =
        'images/starforce/starforcediffafter/Enchant_starForce _ diff _ normal _ after_30.png';

      if (this.currentStars >= maxStars) {
        if (diffPanel) diffPanel.classList.add('sf-diff-max');
        starBeforeImg.innerHTML = '';
        starAfterImg.innerHTML =
          `<img src="${after30Src}" alt="★30" class="star-diff-num star-diff-max">`;
        if (diffArrow) diffArrow.hidden = true;
      } else {
        if (diffPanel) diffPanel.classList.remove('sf-diff-max');
        const fromStar = Number(this.currentStars) || 0;
        const set20Target = this.getScrollSet20PreviewTarget();
        const toStar = set20Target ?? (fromStar + 1);
        starBeforeImg.innerHTML =
          `<img src="images/starforce/starforcediffbefore/Enchant_starForce _ diff _ normal _ before_${fromStar}.png" alt="${fromStar}星" class="star-diff-num">`;
        starAfterImg.innerHTML =
          `<img src="images/starforce/starforcediffafter/Enchant_starForce _ diff _ normal _ after_${toStar}.png" alt="${toStar}星" class="star-diff-num">`;
        if (diffArrow) diffArrow.hidden = false;
      }
    }

    if (statsDiffList) {
      if (this.currentStars >= maxStars) {
        statsDiffList.innerHTML = '<div class="sf-stat-empty">已達最高星級</div>';
      } else {
        const gain = this.getStatGain(this.currentStars, this.currentStars + 1);
        const lines = this.buildBoostLines(gain);
        statsDiffList.innerHTML = lines.length
          ? lines.map((line) => (
            `<div class="sf-stat-line">`
            + `<span class="sf-stat-label">${line.label}</span>`
            + `<span class="sf-stat-val">+${line.val}</span>`
            + `</div>`
          )).join('')
          : '<div class="sf-stat-empty">下一星級無額外屬性提升</div>';
      }
    }

    if (statsDiffPanel) statsDiffPanel.classList.remove('hidden');
  },

  buildBoostLines(gain) {
    const classStatGains = gain.classStatGains || {};
    const hasClassGain = typeof STAR_CLASS_STAT_KEYS !== 'undefined'
      ? STAR_CLASS_STAT_KEYS.some((key) => (classStatGains[key] || 0) > 0)
      : gain.statDiff > 0;
    if (!this.itemData || (!hasClassGain && gain.atkDiff <= 0 && gain.matkDiff <= 0 && (gain.defDiff || 0) <= 0)) {
      return [];
    }

    const lines = [];
    const type = this.itemData.mainType;

    const weaponSf = typeof usesWeaponStarForce === 'function'
      ? usesWeaponStarForce(this.itemData)
      : type === EQUIP_TYPE.WEAPON;

    if (weaponSf) {
      if (typeof appendStarClassStatBoostLines === 'function') {
        appendStarClassStatBoostLines(lines, this.itemData, classStatGains, {
          str: 'STR',
          dex: 'DEX',
          int: 'INT',
          luk: 'LUK',
        });
      }
      if ((this.itemData.baseStats?.atk || 0) > 0 && gain.atkDiff > 0) {
        lines.push({ label: '物理攻擊力', val: gain.atkDiff });
      }
      if ((this.itemData.baseStats?.matk || 0) > 0 && gain.matkDiff > 0) {
        lines.push({ label: '魔法攻擊力', val: gain.matkDiff });
      }
    } else {
      if (typeof appendStarClassStatBoostLines === 'function') {
        appendStarClassStatBoostLines(lines, this.itemData, classStatGains);
      }
      if ((this.itemData.baseStats?.atk || 0) > 0 && gain.atkDiff > 0) {
        lines.push({ label: '攻擊力', val: gain.atkDiff });
      }
      if ((this.itemData.baseStats?.matk || 0) > 0 && gain.matkDiff > 0) {
        lines.push({ label: '魔法攻擊力', val: gain.matkDiff });
      }
      if (gain.defDiff > 0 && type === EQUIP_TYPE.ARMOR) {
        lines.push({ label: '防禦力', val: gain.defDiff });
      }
    }

    return lines;
  },

  enhanceStarWithAnim() {
    const rolled = this.rollEnhanceStar({ silent: false });
    if (!rolled) return null;

    if (!rolled.animate || typeof StarForceEffectModule === 'undefined') {
      rolled.apply();
      return rolled.outcome;
    }

    StarForceEffectModule.runWithAnim({
      outcome: rolled.outcome,
      fn: rolled.apply,
      scrollAnim: rolled.scrollAnim,
    });
    return rolled.outcome;
  },

  enhanceStar(options = {}) {
    const rolled = this.rollEnhanceStar(options);
    if (!rolled) return null;
    rolled.apply();
    return rolled.outcome;
  },

  rollEnhanceStar(options = {}) {
    const silent = options.silent === true;
    const protectDestroyStars = options.protectDestroyStars;
    if (!this.itemData) return null;

    if (!canUseStarForce(this.itemData)) {
      if (!silent) addLog('⚠️ 此裝備無法進行星力強化。', 'log-fail');
      return null;
    }

    const maxStar = this.itemData.maxStar || 30;
    if (this.currentStars >= maxStar) {
      if (!silent) addLog(`已達到最高 ★ ${maxStar} 星！`, 'log-success');
      return null;
    }

    const method = this.getSelectedMethod();

    if (method !== 'normal' && !this.ensureSelectedScrollAvailable(silent)) {
      return null;
    }

    const isSpecialRequire =
      (this.itemData.reqLevel === 200
        && (this.itemData.mainType === EQUIP_TYPE.WEAPON
          || (typeof isAtlasOffHandWeapon === 'function' && isAtlasOffHandWeapon(this.itemData)))) ||
      (this.itemData.reqLevel === 250 &&
        (this.itemData.mainType === EQUIP_TYPE.ARMOR || this.itemData.mainType === EQUIP_TYPE.ACCESSORY));

    if (method === 'scroll_set20_100') {
      if (this.currentStars >= 20) {
        if (!silent) addLog('⚠️ 當前星力已達到或超過 ★ 20！', 'log-fail');
        return null;
      }
      const fromStars = this.currentStars;
      const toStars = 20;
      return {
        outcome: 'success',
        animate: true,
        scrollAnim: { summaryStars: this.buildSummaryStarRange(fromStars, toStars) },
        apply: () => {
          this.consumeSelectedScroll();
          this.currentStars = toStars;
          this.getStatsCount().scrollSet20++;
          if (!silent) addLog('🔥 [星力20卷] 成功！裝備直升至 ★ 20！', 'log-success');
          this.afterEnhanceUpdate();
        },
      };
    }

    if (method === 'scroll_under23_100' || method === 'scroll_under23_30') {
      if (this.currentStars >= 23) {
        if (!silent) addLog('⚠️ 僅限 ★ 23 以下裝備使用！', 'log-fail');
        return null;
      }
      const fromStars = this.currentStars;
      const chance = method === 'scroll_under23_100' ? 100 : 30;
      const success = Math.random() * 100 < chance;
      return {
        outcome: success ? 'success' : 'keep',
        animate: true,
        scrollAnim: success
          ? { summaryStars: this.buildSummaryStarRange(fromStars, fromStars + 1) }
          : null,
        apply: () => {
          this.consumeSelectedScroll();
          if (method === 'scroll_under23_100') this.getStatsCount().scroll23_100++;
          else this.getStatsCount().scroll23_30++;
          if (success) {
            this.currentStars++;
            if (!silent) addLog(`✨ [追加一星卷] 成功升至 ★ ${this.currentStars}！`, 'log-success');
          } else if (!silent) {
            addLog(`[追加一星卷] 失敗，星力維持在 ★ ${this.currentStars}。`, 'log-fail');
          }
          this.afterEnhanceUpdate();
        },
      };
    }

    if (method === 'scroll_24_100') {
      if (this.currentStars !== 23) {
        if (!silent) addLog('⚠️ 僅限 ★ 23 專用！', 'log-fail');
        return null;
      }
      return {
        outcome: 'success',
        animate: true,
        scrollAnim: { summaryStars: [24] },
        apply: () => {
          this.consumeSelectedScroll();
          this.getStatsCount().scroll24++;
          if (isSpecialRequire) this.getStatsCount().scroll23_100 += 4;
          this.currentStars = 24;
          if (!silent) addLog('✨ [★ 24卷] 成功升至 ★ 24！', 'log-success');
          this.afterEnhanceUpdate();
        },
      };
    }

    if (method === 'scroll_25_30') {
      if (this.currentStars !== 24) {
        if (!silent) addLog('⚠️ 僅限 ★ 24 專用！', 'log-fail');
        return null;
      }
      const success = Math.random() * 100 < 30;
      return {
        outcome: success ? 'success' : 'keep',
        animate: true,
        scrollAnim: success ? { summaryStars: [25] } : null,
        apply: () => {
          this.consumeSelectedScroll();
          this.getStatsCount().scroll25++;
          if (isSpecialRequire) this.getStatsCount().scroll23_100 += 4;
          if (success) {
            this.currentStars = 25;
            if (!silent) addLog('✨ [★ 25卷] 成功升至 ★ 25！', 'log-success');
          } else if (!silent) {
            addLog(`[★ 25卷] 失敗，星力維持在 ★ ${this.currentStars}。`, 'log-fail');
          }
          this.afterEnhanceUpdate();
        },
      };
    }

    this.getStatsCount().starNormal++;
    const mesoCost = this.getMesoCost(this.currentStars);
    this.getStatsCount().mesoSpent += mesoCost;

    const rates = this.getRates(this.currentStars);
    const roll = Math.random() * 100;
    const isSafeCheckpoint = [10, 15, 20, 25].includes(this.currentStars);
    const preventDrop = document.getElementById('chkPreventDrop')?.checked;
    const consecutiveDrops = this.getStarConsecutiveDrops();
    const guaranteedSuccess = consecutiveDrops >= 2;

    let outcome = 'keep';
    if (guaranteedSuccess) outcome = 'success';
    else if (roll < rates.success) outcome = 'success';
    else if (roll < rates.success + rates.keep || isSafeCheckpoint) outcome = 'keep';
    else if (preventDrop) outcome = 'keep';
    else outcome = 'drop';

    if (outcome === 'drop' && Array.isArray(protectDestroyStars) && protectDestroyStars.length) {
      const nextStar = this.currentStars + 1;
      if (protectDestroyStars.includes(nextStar)) outcome = 'keep';
    }

    return {
      outcome,
      animate: method === 'normal',
      guaranteedSuccess,
      apply: () => {
        if (outcome === 'success') {
          this.currentStars++;
          this.setStarConsecutiveDrops(0);
          if (!silent) {
            const msg = guaranteedSuccess
              ? `✨ 星力成功升至 ★ ${this.currentStars}！（連續下滑保底）`
              : `✨ 星力成功升至 ★ ${this.currentStars}！`;
            addLog(msg, 'log-success');
          }
        } else if (outcome === 'keep') {
          if (!silent) addLog(`星力失敗，維持在 ★ ${this.currentStars}。`, 'log-fail');
        } else {
          this.currentStars = Math.max(0, this.currentStars - 1);
          this.setStarConsecutiveDrops(consecutiveDrops + 1);
          if (!silent) addLog(`星力失敗！下降至 ★ ${this.currentStars}。`, 'log-fail');
        }
        this.afterEnhanceUpdate();
      },
    };
  },

  /** 卷軸成功時需播 summaryIcon 的星數（from+1 … to） */
  buildSummaryStarRange(fromStars, toStars) {
    const stars = [];
    for (let i = fromStars + 1; i <= toStars; i += 1) {
      stars.push(i);
    }
    return stars;
  },

  afterEnhanceUpdate() {
    if (currentEnchantItem) {
      currentEnchantItem.star = this.currentStars;
    }
    this.updateUI();
    this.updateStatsUI();
    if (typeof updateStatusPanel === 'function') updateStatusPanel();
    if (typeof calculateCost === 'function') calculateCost();
  },

  updateAutoTargetOptions() {
    const select = document.getElementById('autoStarTarget');
    if (!select) return;

    if (this.autoRunning) return;

    const maxStars = this.itemData ? (this.itemData.maxStar || 30) : 30;
    const minTarget = Math.min(this.currentStars + 1, maxStars);
    const prevTarget = select.value;

    select.innerHTML = '';
    for (let i = minTarget; i <= maxStars; i++) {
      const opt = document.createElement('option');
      opt.value = String(i);
      opt.textContent = String(i);
      select.appendChild(opt);
    }

    if (!select.options.length) {
      const opt = document.createElement('option');
      opt.value = String(maxStars);
      opt.textContent = String(maxStars);
      select.appendChild(opt);
    }

    const prevNum = parseInt(prevTarget, 10);
    if (prevNum > this.currentStars && prevNum <= maxStars) {
      select.value = String(prevNum);
    }
  },

  updateUI() {
    if (!this.itemData) {
      this.setPanelMode(this.selectedScrollId ? 'idle-scroll' : 'idle');
      this.renderCostArea();
      return;
    }

    if (!canUseStarForce(this.itemData)) {
      this.setPanelMode('blocked');
      this.renderCostArea();
      return;
    }

    this.setPanelMode('active');

    const maxStars = this.itemData ? (this.itemData.maxStar || 30) : 30;

    this.renderStarsGrid();
    this.renderStatDiff();
    this.renderCostArea();

    if (typeof AutoEnchantStarForceModule !== 'undefined') {
      AutoEnchantStarForceModule.syncAutoCheckbox();
      if (AutoEnchantStarForceModule.isOpen) {
        AutoEnchantStarForceModule.syncTargetDefault();
        AutoEnchantStarForceModule.render();
      }
    }

    const reqLevel = this.itemData ? this.itemData.reqLevel : 200;

    const method = this.getSelectedMethod();
    const mesoDisplay = document.getElementById('mesoCostDisplay');
    if (mesoDisplay) {
      if (this.currentStars >= maxStars || method !== 'normal') {
        mesoDisplay.textContent = '0 楓幣';
      } else {
        mesoDisplay.textContent = this.formatMeso(this.getMesoCost(this.currentStars));
      }
    }

    if (this.currentStars >= maxStars) {
      this.setRateDisplay(0, 100);
    } else if (method === 'normal') {
      const rates = this.getRates(this.currentStars);
      const failRate = 100 - rates.success;
      this.setRateDisplay(rates.success, failRate);
    } else if (method === 'scroll_set20_100' || method === 'scroll_under23_100' || method === 'scroll_24_100') {
      this.setRateDisplay(100, 0);
    } else if (method === 'scroll_under23_30' || method === 'scroll_25_30') {
      this.setRateDisplay(30, 70);
    }

    this.updateEnhanceButtonState();
    if (typeof StarForceEffectModule !== 'undefined') {
      StarForceEffectModule.updateTestBarVisible();
    }
  },

  setRateDisplay(successRate, failRate) {
    const rs = document.getElementById('rateSuccess');
    const rf = document.getElementById('rateFail');
    const fmt = (n) => `${Number(n).toFixed(Number(n) % 1 === 0 ? 0 : 2)}%`;
    if (rs) rs.textContent = fmt(successRate);
    if (rf) rf.textContent = fmt(failRate);
  },

  syncMethodSelectWidth() {
    const select = document.getElementById('starMethodSelect');
    if (!select) return;

    const style = getComputedStyle(select);
    const probe = document.createElement('span');
    probe.style.cssText = 'position:absolute;visibility:hidden;white-space:nowrap;pointer-events:none;';
    probe.style.font = style.font;
    document.body.appendChild(probe);

    let maxText = 0;
    for (const opt of select.options) {
      probe.textContent = opt.text;
      maxText = Math.max(maxText, probe.offsetWidth);
    }
    document.body.removeChild(probe);

    const pad =
      (parseFloat(style.paddingLeft) || 0) +
      (parseFloat(style.paddingRight) || 0) +
      (parseFloat(style.borderLeftWidth) || 0) +
      (parseFloat(style.borderRightWidth) || 0) +
      16;
    select.style.width = `${Math.ceil(maxText + pad)}px`;
  },

  updateStatsUI() {
    const elNormal = document.getElementById('cntStarNormal');
    const elSet20 = document.getElementById('cntScrollSet20');
    const el23_100 = document.getElementById('cntScroll23_100');
    const el23_30 = document.getElementById('cntScroll23_30');
    const el24 = document.getElementById('cntScroll24');
    const el25 = document.getElementById('cntScroll25');

    if (elNormal) elNormal.innerText = `${this.getStatsCount().starNormal}次`;
    if (elSet20) elSet20.innerText = `${this.getStatsCount().scrollSet20}張`;
    if (el23_100) el23_100.innerText = `${this.getStatsCount().scroll23_100}張`;
    if (el23_30) el23_30.innerText = `${this.getStatsCount().scroll23_30}張`;
    if (el24) el24.innerText = `${this.getStatsCount().scroll24}張`;
    if (el25) el25.innerText = `${this.getStatsCount().scroll25}張`;
  }
};
