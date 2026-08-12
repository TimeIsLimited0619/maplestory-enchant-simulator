/**
 * PotentialModule - 潛在能力（方塊）邏輯與 UI
 */
const PotentialModule = {
  itemData: null,
  selectedCubeId: null,
  lastAtkPow: null,

  loadEquip(item) {
    const itemChanged = this.itemData !== item;
    if (itemChanged && typeof AutoEnchantPotentialModule !== 'undefined') {
      AutoEnchantPotentialModule.onEquipChanged();
    }
    this.itemData = item;
    if (!this.itemData.potential) {
      this.itemData.potential = (typeof shouldStartWithoutPotential === 'function'
        && shouldStartWithoutPotential(this.itemData)
        && typeof getEmptyPotentialState === 'function')
        ? getEmptyPotentialState()
        : getDefaultPotentialState();
    }
    this.selectedCubeId = null;
    this.lastAtkPow = this.itemData.potential.atkPow;
    this.updateUI();
  },

  resetState() {
    if (typeof AutoEnchantPotentialModule !== 'undefined') {
      AutoEnchantPotentialModule.onEquipChanged();
    }
    this.itemData = null;
    this.selectedCubeId = null;
    this.lastAtkPow = null;
    this.updateUI();
    this.updateResetButtonState();
  },

  setIdleMode(isIdle) {
    const idlePanel = document.getElementById('ptIdlePanel');
    const activePanel = document.getElementById('ptActivePanel');
    const bottomOptions = document.getElementById('ptBottomOptions');

    if (idlePanel) idlePanel.classList.toggle('hidden', !isIdle);
    if (activePanel) activePanel.classList.toggle('hidden', isIdle);
    if (bottomOptions) bottomOptions.classList.toggle('hidden', isIdle);

    if (typeof syncMainPanelIdleState === 'function') {
      syncMainPanelIdleState();
    }

    this.updateResetButtonState();
  },

  selectCube(cubeId) {
    if (!this.itemData) return;

    const cube = getPotentialCubeById(cubeId);
    if (!cube) return;

    const blockReason = typeof getPotentialCubeBlockReason === 'function'
      ? getPotentialCubeBlockReason(cube, this.itemData)
      : null;
    if (blockReason) {
      addLog(`⚠️ ${blockReason}`, 'log-fail');
      return;
    }

    getPlayerCubeCount(cube.id);
    this.selectedCubeId = this.selectedCubeId === cubeId ? null : cubeId;
    this.updateUI();
  },

  getSelectedCube() {
    if (!this.selectedCubeId) return null;
    return getPotentialCubeById(this.selectedCubeId);
  },

  isHexaOverlayOpen() {
    return !document.getElementById('ptHexaOverlay')?.classList.contains('hidden');
  },

  isPotentialOverlayOpen() {
    return this.isHexaOverlayOpen()
      || (typeof this.isUniOverlayOpen === 'function' && this.isUniOverlayOpen())
      || (typeof this.isMemoriaOverlayOpen === 'function' && this.isMemoriaOverlayOpen())
      || (typeof AutoEnchantPotentialModule !== 'undefined' && AutoEnchantPotentialModule.isOpen);
  },

  /** 同步整體階級＝三排最高階（結合方塊第一排可低一階，不因此降階） */
  syncPotentialOverallRank(potential = this.itemData?.potential) {
    if (!potential?.lines?.length) return potential?.rank || 'rare';
    if (typeof rollPotentialRankFromLines !== 'function') return potential.rank || 'rare';

    const fromAll = rollPotentialRankFromLines(potential.lines);
    const fromRest = potential.lines.length > 1
      ? rollPotentialRankFromLines(potential.lines.slice(1))
      : fromAll;
    const stored = potential.rank || fromAll;
    potential.rank = maxInternalRank(stored, fromRest);
    return potential.rank;
  },

  /** 主面板階級條：Hexa 開啟中與選擇框 title 同源；關閉後依三排結果 */
  getPotentialDisplayRank() {
    if (this.isHexaOverlayOpen() && this.hexaTitleRank) {
      return this.hexaTitleRank;
    }

    const potential = this.itemData?.potential;
    if (!potential) return 'rare';
    return this.syncPotentialOverallRank(potential);
  },

  renderRankBox() {
    const rankBox = document.getElementById('ptRankBox');
    if (!rankBox || !this.itemData?.potential) return;

    const rankId = this.getPotentialDisplayRank();
    const rank = POTENTIAL_RANKS[rankId] || POTENTIAL_RANKS.rare;
    rankBox.style.backgroundImage = `url('${rank.summaryBg}')`;
  },

  renderStatList() {
    const statList = document.getElementById('ptStatList');
    if (!statList || !this.itemData?.potential) return;

    statList.innerHTML = this.itemData.potential.lines.map((line) => {
      const rank = POTENTIAL_RANKS[line.rank] || POTENTIAL_RANKS.rare;
      const parts = splitPotentialLineDisplay(line);

      if (parts.value && parts.alignGroup) {
        return (
          `<div class="pt-stat-line pt-stat-line--aligned pt-stat-line--aligned-${parts.alignGroup}">`
          + `<img class="pt-stat-rank-icon" src="${rank.statIcon}" alt="${rank.prefix}">`
          + `<span class="pt-stat-label">${parts.label}</span>`
          + `<span class="pt-stat-value">${parts.value}</span>`
          + `</div>`
        );
      }

      const text = parts.value ? `${parts.label} ${parts.value}` : parts.label;
      return (
        `<div class="pt-stat-line pt-stat-line--plain">`
        + `<img class="pt-stat-rank-icon" src="${rank.statIcon}" alt="${rank.prefix}">`
        + `<span class="pt-stat-text">${text}</span>`
        + `</div>`
      );
    }).join('');
  },

  renderAtkPow() {
    const display = document.getElementById('ptAtkPowChange');
    if (!display || !this.itemData?.potential) return;

    const current = this.itemData.potential.atkPow || 0;
    if (this.lastAtkPow == null) {
      display.textContent = '-';
      return;
    }

    const delta = current - this.lastAtkPow;
    if (delta === 0) {
      display.textContent = '-';
      return;
    }

    display.textContent = formatPotentialAtkPow(delta);
    display.classList.toggle('pt-atk-up', delta > 0);
    display.classList.toggle('pt-atk-down', delta < 0);
  },

  renderCubeGrid() {
    const grid = document.getElementById('ptCubeGrid');
    if (!grid) return;

    grid.querySelectorAll('.pt-cube-slot').forEach((slot) => {
      const slotIndex = Number(slot.dataset.slotIndex);
      const cube = getPotentialCubeBySlot(slotIndex);
      const hasEquip = Boolean(this.itemData);

      slot.classList.toggle('has-item', Boolean(cube));
      slot.classList.toggle('selected', Boolean(cube && this.selectedCubeId === cube.id));
      slot.innerHTML = '';

      if (!cube) return;

      slot.dataset.cubeId = cube.id;
      const blockReason = typeof getPotentialCubeBlockReason === 'function'
        ? getPotentialCubeBlockReason(cube, this.itemData)
        : null;
      const blocked = Boolean(blockReason);
      slot.disabled = !hasEquip || blocked;
      slot.classList.toggle('is-blocked', blocked);

      if (cube.icon) {
        const w = cube.iconWidth || 32;
        const h = cube.iconHeight || 32;
        slot.innerHTML = `
          <img class="pt-cube-icon" src="${cube.icon}" alt="${cube.name}" width="${w}" height="${h}">
        `;
      } else {
        slot.innerHTML = `
          <span class="pt-cube-placeholder" style="--pt-cube-color:${cube.color}"></span>
        `;
      }

      slot.onclick = () => this.selectCube(cube.id);
    });
  },

  renderCostAndHint() {
    const hint = document.getElementById('ptCubeHint');
    const selectedName = document.getElementById('ptSelectedName');
    const cube = this.getSelectedCube();

    if (selectedName) {
      selectedName.textContent = cube ? cube.name : '';
    }

    if (hint) {
      hint.classList.toggle('hidden', Boolean(cube && this.itemData));
    }

    this.renderMesoCost();
    this.renderCubeHelp();
  },

  /** 主潛方塊不耗楓幣，固定顯示 -；未裝備／已裝備皆常駐 */
  renderMesoCost() {
    const row = document.getElementById('ptMesoCostRow');
    const valueEl = document.getElementById('ptMesoCost');
    if (!row || !valueEl) return;

    row.classList.remove('hidden');
    row.setAttribute('aria-hidden', 'false');
    valueEl.textContent = '-';
  },

  renderCubeHelp() {
    const area = document.getElementById('ptHelpArea');
    const img = document.getElementById('ptHelpImage');
    const cube = this.getSelectedCube();
    const show = Boolean(cube && this.itemData);

    if (area) {
      area.classList.toggle('hidden', !show);
      area.setAttribute('aria-hidden', show ? 'false' : 'true');
    }

    if (!img || !show) return;

    const src = getPotentialCubeHelpImage(cube.id);
    if (src) {
      img.src = src;
      img.alt = cube.name;
    }
  },

  updateResetButtonState() {
    const btn = document.getElementById('btnPotentialReset');
    const overlayOpen = this.isPotentialOverlayOpen();
    const ae = typeof AutoEnchantPotentialModule !== 'undefined' ? AutoEnchantPotentialModule : null;
    const autoUiActive = Boolean(
      ae && (ae.isOpen || ae.isRunning || ae.memorialAutoOverlayActive)
    );
    const animating = typeof PotentialEffectModule !== 'undefined' && PotentialEffectModule.isPlaying();
    const cube = this.getSelectedCube();
    const blockReason = typeof getPotentialCubeBlockReason === 'function'
      ? getPotentialCubeBlockReason(cube, this.itemData)
      : null;
    if (!btn) return;
    const hide = overlayOpen || autoUiActive;
    btn.disabled = !(this.itemData && this.selectedCubeId && !blockReason) || hide || animating;
    btn.classList.toggle('hidden', hide);
    this.renderMesoCost();
  },

  getEquipIconSrc() {
    const dropImg = document.querySelector('#equipDropZone img');
    return dropImg?.getAttribute('src') || this.itemData?.icon || '';
  },

  applyRollResult(rolled, cube) {
    const { mirrorCopied, ...potential } = rolled;
    this.itemData.potential = potential;

    addLog(
      mirrorCopied
        ? `🔮 使用 ${cube.name} 重新設定潛在能力。（鏡射：第二排複製第一排）`
        : `🔮 使用 ${cube.name} 重新設定潛在能力。`,
      'log-success'
    );
    this.updateUI();
    if (typeof updateStatusPanel === 'function') updateStatusPanel();
  },

  handleResetClick() {
    if (!this.itemData) return;
    if (typeof PotentialEffectModule !== 'undefined' && PotentialEffectModule.isPlaying()) return;

    const cube = this.getSelectedCube();
    if (!cube) {
      return addLog('⚠️ 請先選擇要使用的方塊！', 'log-fail');
    }

    const blockReason = typeof getPotentialCubeBlockReason === 'function'
      ? getPotentialCubeBlockReason(cube, this.itemData)
      : null;
    if (blockReason) {
      return addLog(`⚠️ ${blockReason}`, 'log-fail');
    }

    if (cube.hexaPick) {
      consumePlayerCube(cube.id);
      addLog(`🔮 使用 ${cube.name} 重新設定潛在能力。`, 'log-success');
      if (typeof PotentialEffectModule !== 'undefined') {
        PotentialEffectModule.runWithTryAnim({
          rank: this.getPotentialDisplayRank(),
          fn: () => this.openHexaOverlay(cube),
        });
      } else {
        this.openHexaOverlay(cube);
      }
      return;
    }

    if (cube.uniPick) {
      consumePlayerCube(cube.id);
      addLog(`🔮 使用 ${cube.name} 選擇潛在能力。`, 'log-success');
      if (typeof PotentialEffectModule !== 'undefined') {
        PotentialEffectModule.runWithTryAnim({
          rank: this.getPotentialDisplayRank(),
          fn: () => this.openUniOverlay(cube),
        });
      } else {
        this.openUniOverlay(cube);
      }
      return;
    }

    if (cube.memoriaPick) {
      consumePlayerCube(cube.id);
      addLog(`🔮 使用 ${cube.name} 重新設定潛在能力。`, 'log-success');
      if (typeof PotentialEffectModule !== 'undefined') {
        PotentialEffectModule.runWithTryAnim({
          rank: this.getPotentialDisplayRank(),
          fn: () => this.openMemoriaOverlay(cube),
        });
      } else {
        this.openMemoriaOverlay(cube);
      }
      return;
    }

    const effectRank = this.getPotentialDisplayRank();
    const oldRank = this.syncPotentialOverallRank(this.itemData.potential);
    const skipAnim = typeof PotentialEffectModule !== 'undefined'
      ? !PotentialEffectModule.isAnimEnabled()
      : true;

    const doRoll = () => {
      consumePlayerCube(cube.id);
      this.lastAtkPow = this.itemData.potential.atkPow;
      return rerollPotential(cube, this.itemData.potential, this.itemData);
    };

    if (
      skipAnim
      || typeof PotentialEffectModule === 'undefined'
      || !PotentialEffectModule.hasAssetsForRank(effectRank)
    ) {
      const rolled = doRoll();
      this.applyRollResult(rolled, cube);
      return;
    }

    this.updateResetButtonState();
    PotentialEffectModule.playCubeRoll({
      rank: effectRank,
      oldRank,
      rollFn: doRoll,
      onComplete: (rolled) => this.applyRollResult(rolled, cube),
    });
  },

  updateUI() {
    const isIdle = !this.itemData;
    this.setIdleMode(isIdle);
    this.renderCubeGrid();
    this.renderCostAndHint();

    if (this.selectedCubeId) {
      const selected = this.getSelectedCube();
      if (typeof getPotentialCubeBlockReason === 'function'
        && getPotentialCubeBlockReason(selected, this.itemData)) {
        this.selectedCubeId = null;
        this.renderCubeGrid();
        this.renderCostAndHint();
      }
    }

    if (typeof PotentialEffectModule !== 'undefined') {
      PotentialEffectModule.updateTestBarVisible();
    }

    if (isIdle) {
      this.renderCubeHelp();
      return;
    }

    this.renderRankBox();
    this.renderStatList();
    this.renderAtkPow();
    this.updateResetButtonState();

    if (typeof AutoEnchantPotentialModule !== 'undefined') {
      AutoEnchantPotentialModule.syncAutoCheckbox();
      if (AutoEnchantPotentialModule.isOpen) {
        AutoEnchantPotentialModule.render();
      }
    }
  },
};
