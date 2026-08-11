/**
 * AddPotentialModule - 附加潛在能力（方塊）邏輯與 UI
 */
const AddPotentialModule = {
  itemData: null,
  selectedCubeId: null,
  lastAtkPow: null,

  loadEquip(item) {
    const itemChanged = this.itemData !== item;
    if (itemChanged && typeof AutoEnchantAddPotentialModule !== 'undefined') {
      AutoEnchantAddPotentialModule.onEquipChanged();
    }
    this.itemData = item;
    if (!this.itemData.additionalPotential) {
      this.itemData.additionalPotential = (typeof shouldStartWithoutPotential === 'function'
        && shouldStartWithoutPotential(this.itemData)
        && typeof getEmptyAddPotentialState === 'function')
        ? getEmptyAddPotentialState()
        : getDefaultAddPotentialState(this.itemData.reqLevel);
    }
    this.selectedCubeId = null;
    this.lastAtkPow = this.itemData.additionalPotential.atkPow;
    this.updateUI();
  },

  resetState() {
    if (typeof AutoEnchantAddPotentialModule !== 'undefined') {
      AutoEnchantAddPotentialModule.onEquipChanged();
    }
    this.itemData = null;
    this.selectedCubeId = null;
    this.lastAtkPow = null;
    this.updateUI();
    this.updateResetButtonState();
  },

  setIdleMode(isIdle) {
    const idlePanel = document.getElementById('apIdlePanel');
    const activePanel = document.getElementById('apActivePanel');
    const bottomOptions = document.getElementById('apBottomOptions');

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

    const cube = getAddPotCubeById(cubeId);
    if (!cube) return;

    const blockReason = getAddPotCubeBlockReason(cube, this.itemData);
    if (blockReason) {
      addLog(`⚠️ ${blockReason}`, 'log-fail');
      return;
    }

    getPlayerAddPotCubeCount(cube.id);
    this.selectedCubeId = this.selectedCubeId === cubeId ? null : cubeId;
    this.updateUI();
  },

  getSelectedCube() {
    if (!this.selectedCubeId) return null;
    return getAddPotCubeById(this.selectedCubeId);
  },

  isHexaOverlayOpen() {
    return !document.getElementById('apHexaOverlay')?.classList.contains('hidden');
  },

  isAddPotOverlayOpen() {
    return this.isHexaOverlayOpen()
      || (typeof this.isUniOverlayOpen === 'function' && this.isUniOverlayOpen())
      || (typeof this.isMemoriaOverlayOpen === 'function' && this.isMemoriaOverlayOpen())
      || (typeof AutoEnchantAddPotentialModule !== 'undefined' && AutoEnchantAddPotentialModule.isOpen);
  },

  syncAddPotOverallRank(potential = this.itemData?.additionalPotential) {
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

  getAddPotDisplayRank() {
    if (this.isHexaOverlayOpen() && this.hexaTitleRank) {
      return this.hexaTitleRank;
    }

    const potential = this.itemData?.additionalPotential;
    if (!potential) return 'rare';
    return this.syncAddPotOverallRank(potential);
  },

  renderRankBox() {
    const rankBox = document.getElementById('apRankBox');
    if (!rankBox || !this.itemData?.additionalPotential) return;

    const rankId = this.getAddPotDisplayRank();
    const rank = POTENTIAL_RANKS[rankId] || POTENTIAL_RANKS.rare;
    rankBox.style.backgroundImage = `url('${rank.summaryBg}')`;
  },

  renderStatList() {
    const statList = document.getElementById('apStatList');
    if (!statList || !this.itemData?.additionalPotential) return;

    statList.innerHTML = this.itemData.additionalPotential.lines.map((line) => {
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
    const display = document.getElementById('apAtkPowChange');
    if (!display || !this.itemData?.additionalPotential) return;

    const current = this.itemData.additionalPotential.atkPow || 0;
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
    const grid = document.getElementById('apCubeGrid');
    if (!grid) return;

    grid.querySelectorAll('.pt-cube-slot').forEach((slot) => {
      const slotIndex = Number(slot.dataset.slotIndex);
      const cube = getAddPotCubeBySlot(slotIndex);
      const hasEquip = Boolean(this.itemData);

      slot.classList.toggle('has-item', Boolean(cube));
      slot.classList.toggle('selected', Boolean(cube && this.selectedCubeId === cube.id));
      slot.innerHTML = '';

      if (!cube) return;

      slot.dataset.cubeId = cube.id;
      const blockReason = getAddPotCubeBlockReason(cube, this.itemData);
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
    const hint = document.getElementById('apCubeHint');
    const selectedName = document.getElementById('apSelectedName');
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

  renderMesoCost() {
    const row = document.getElementById('apMesoCostRow');
    const valueEl = document.getElementById('apMesoCost');
    if (!row || !valueEl) return;

    // 常駐顯示；未裝備顯示 -，有裝備顯示正確金額
    row.classList.remove('hidden');
    row.setAttribute('aria-hidden', 'false');
    if (!this.itemData) {
      valueEl.textContent = '-';
      return;
    }

    const meso = typeof getAddPotentialCubeMesoCost === 'function'
      ? getAddPotentialCubeMesoCost(this.itemData)
      : 800000;
    valueEl.textContent = typeof formatMesoAmount === 'function'
      ? formatMesoAmount(meso).replace(/\s*楓幣\s*$/, '')
      : String(meso.toLocaleString());
  },

  renderCubeHelp() {
    const area = document.getElementById('apHelpArea');
    const img = document.getElementById('apHelpImage');
    const cube = this.getSelectedCube();
    const show = Boolean(cube && this.itemData);

    if (area) {
      area.classList.toggle('hidden', !show);
      area.setAttribute('aria-hidden', show ? 'false' : 'true');
    }

    if (!img || !show) return;

    const src = getAddPotCubeHelpImage(cube.id);
    if (src) {
      img.src = src;
      img.alt = cube.name;
    }
  },

  updateResetButtonState() {
    const btn = document.getElementById('btnAddPotentialReset');
    const overlayOpen = this.isAddPotOverlayOpen();
    const ae = typeof AutoEnchantAddPotentialModule !== 'undefined' ? AutoEnchantAddPotentialModule : null;
    const autoUiActive = Boolean(
      ae && (ae.isOpen || ae.isRunning || ae.memorialAutoOverlayActive)
    );
    const animating = typeof PotentialEffectModule !== 'undefined' && PotentialEffectModule.isPlaying();
    const cube = this.getSelectedCube();
    const blockReason = getAddPotCubeBlockReason(cube, this.itemData);
    if (!btn) return;
    const hide = overlayOpen || autoUiActive;
    btn.disabled = !(this.itemData && this.selectedCubeId && !blockReason) || hide || animating;
    btn.classList.toggle('hidden', hide);
    this.renderMesoCost();
  },

  applyRollResult(rolled, cube) {
    const { mirrorCopied, ...potential } = rolled;
    this.itemData.additionalPotential = potential;

    addLog(
      mirrorCopied
        ? `🟢 使用 ${cube.name} 重新設定附加潛在能力。（鏡射：第二排複製第一排）`
        : `🟢 使用 ${cube.name} 重新設定附加潛在能力。`,
      'log-success'
    );
    this.updateUI();
    if (typeof updateStatusPanel === 'function') updateStatusPanel();
  },

  updateUI() {
    const isIdle = !this.itemData;
    this.setIdleMode(isIdle);
    this.renderCubeGrid();
    this.renderCostAndHint();

    if (this.selectedCubeId) {
      const selected = this.getSelectedCube();
      if (getAddPotCubeBlockReason(selected, this.itemData)) {
        this.selectedCubeId = null;
        this.renderCubeGrid();
        this.renderCostAndHint();
      }
    }

    if (isIdle) {
      this.renderCubeHelp();
      return;
    }

    this.renderRankBox();
    this.renderStatList();
    this.renderAtkPow();
    this.updateResetButtonState();

    if (typeof PotentialEffectModule !== 'undefined') {
      PotentialEffectModule.updateTestBarVisible();
    }

    if (typeof AutoEnchantAddPotentialModule !== 'undefined') {
      AutoEnchantAddPotentialModule.syncAutoCheckbox();
      if (AutoEnchantAddPotentialModule.isOpen) {
        AutoEnchantAddPotentialModule.render();
      }
    }
  },

  handleResetClick() {
    if (!this.itemData) return;
    if (typeof PotentialEffectModule !== 'undefined' && PotentialEffectModule.isPlaying()) return;

    const cube = this.getSelectedCube();
    if (!cube) {
      return addLog('⚠️ 請先選擇要使用的方塊！', 'log-fail');
    }

    const blockReason = getAddPotCubeBlockReason(cube, this.itemData);
    if (blockReason) {
      return addLog(`⚠️ ${blockReason}`, 'log-fail');
    }

    if (cube.hexaPick) {
      consumePlayerAddPotCube(cube.id);
      addLog(`🟢 使用 ${cube.name} 重新設定附加潛在能力。`, 'log-success');
      if (typeof PotentialEffectModule !== 'undefined') {
        PotentialEffectModule.runWithTryAnim({
          rank: this.getAddPotDisplayRank(),
          fn: () => this.openHexaOverlay(cube),
        });
      } else {
        this.openHexaOverlay(cube);
      }
      return;
    }

    if (cube.uniPick) {
      consumePlayerAddPotCube(cube.id);
      addLog(`🟢 使用 ${cube.name} 選擇附加潛在能力。`, 'log-success');
      if (typeof PotentialEffectModule !== 'undefined') {
        PotentialEffectModule.runWithTryAnim({
          rank: this.getAddPotDisplayRank(),
          fn: () => this.openUniOverlay(cube),
        });
      } else {
        this.openUniOverlay(cube);
      }
      return;
    }

    if (cube.memoriaPick) {
      consumePlayerAddPotCube(cube.id);
      addLog(`🟢 使用 ${cube.name} 重新設定附加潛在能力。`, 'log-success');
      if (typeof PotentialEffectModule !== 'undefined') {
        PotentialEffectModule.runWithTryAnim({
          rank: this.getAddPotDisplayRank(),
          fn: () => this.openMemoriaOverlay(cube),
        });
      } else {
        this.openMemoriaOverlay(cube);
      }
      return;
    }

    const doRoll = () => {
      consumePlayerAddPotCube(cube.id);
      this.lastAtkPow = this.itemData.additionalPotential.atkPow;
      return rerollAddPotential(cube, this.itemData.additionalPotential, this.itemData);
    };

    const effectRank = this.getAddPotDisplayRank();
    const oldRank = this.syncAddPotOverallRank(this.itemData.additionalPotential);
    const skipAnim = typeof PotentialEffectModule !== 'undefined'
      ? !PotentialEffectModule.isAnimEnabled()
      : true;

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
};
