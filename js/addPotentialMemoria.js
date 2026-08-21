/**
 * 恢復附加方塊 — BEFORE / AFTER 選擇介面
 */
const AP_MEMORIA_UI = {
  infoTop: fpPotentialImg('canvas_infoTop'),
  infoBtm: fpPotentialImg('canvas_infoBtm'),
  infoAutoBtm: fpPotentialImg('canvas_infoAutoBtm'),
  choiceBefore: fpPotentialImg('choiceBox_canvas_baseBefore'),
  choiceAfter: fpPotentialImg('choiceBox_canvas_baseAfter'),
  choiceHover: fpPotentialImg('choiceBox_layer_mouseOver'),
  confirmBg: fpPotentialImg('confirmBox_mesoConfirm_layer_bg'),
  confirmAutoBg: fpPotentialImg('confirmBox_itemConfirmAutoEnchantBenefit_layer_bg'),
  btnReset: {
    normal: fpPotentialImg('confirmBox_mesoConfirm_button_Confirm_normal_0'),
    hover: fpPotentialImg('confirmBox_mesoConfirm_button_Confirm_mouseOver_0'),
    pressed: fpPotentialImg('confirmBox_mesoConfirm_button_Confirm_pressed_0'),
    disabled: fpPotentialImg('confirmBox_mesoConfirm_button_Confirm_disabled_0'),
  },
  btnAutoRestart: {
    normal: fpPotentialImg('confirmBox_itemConfirmAutoEnchantBenefit_button_ConfirmBenefit_normal_0'),
    hover: fpPotentialImg('confirmBox_itemConfirmAutoEnchantBenefit_button_ConfirmBenefit_mouseOver_0'),
    pressed: fpPotentialImg('confirmBox_itemConfirmAutoEnchantBenefit_button_ConfirmBenefit_pressed_0'),
    disabled: fpPotentialImg('confirmBox_itemConfirmAutoEnchantBenefit_button_ConfirmBenefit_disabled_0'),
  },
  btnAutoCancel: {
    normal: fpPotentialImg('confirmBox_itemConfirmAutoEnchantBenefit_button_Cancel_normal_0'),
    hover: fpPotentialImg('confirmBox_itemConfirmAutoEnchantBenefit_button_Cancel_mouseOver_0'),
    pressed: fpPotentialImg('confirmBox_itemConfirmAutoEnchantBenefit_button_Cancel_pressed_0'),
    disabled: fpPotentialImg('confirmBox_itemConfirmAutoEnchantBenefit_button_Cancel_disabled_0'),
  },
  title: {
    rare: fpPotentialImg('choiceBox_title_canvas_title_rare'),
    epic: fpPotentialImg('choiceBox_title_canvas_title_epic'),
    unique: fpPotentialImg('choiceBox_title_canvas_title_unique'),
    legendary: fpPotentialImg('choiceBox_title_canvas_title_legendary'),
  },
  icon: {
    rare: fpPotentialImg('choiceBox_detail_icon_canvas_icon_rare'),
    epic: fpPotentialImg('choiceBox_detail_icon_canvas_icon_epic'),
    unique: fpPotentialImg('choiceBox_detail_icon_canvas_icon_unique'),
    legendary: fpPotentialImg('choiceBox_detail_icon_canvas_icon_legendary'),
  },
};

const AP_MEMORIA_HELD_MESO_TEXT = '9999億9999萬9999';

Object.assign(AddPotentialModule, {
  memoriaCubeId: null,
  memoriaBefore: null,
  memoriaAfter: null,
  memoriaBaseAtk: null,
  memoriaRankUp: false,
  memoriaClosing: false,
  memoriaSelectedSide: null,
  memoriaCloseTimer: null,

  formatMemoriaCubeCount(count) {
    return count >= DEFAULT_CUBE_COUNT ? '999+' : count.toLocaleString();
  },

  isMemoriaOverlayOpen() {
    return !document.getElementById('apMemoriaOverlay')?.classList.contains('hidden');
  },

  isAutoRolling() {
    return typeof AutoEnchantAddPotentialModule !== 'undefined'
      && AutoEnchantAddPotentialModule.isRunning
      && AutoEnchantAddPotentialModule.isMemoriaAutoMode?.();
  },

  isAutoPickPending() {
    return typeof AutoEnchantAddPotentialModule !== 'undefined'
      && AutoEnchantAddPotentialModule.choiceAutoSessionActive;
  },

  isMemorialAutoChoiceUi() {
    return typeof AutoEnchantAddPotentialModule !== 'undefined'
      && AutoEnchantAddPotentialModule.memorialAutoOverlayActive;
  },

  getMemoriaResetButtonMode() {
    if (!this.isMemorialAutoChoiceUi()) return 'manual';
    if (this.isAutoRolling()) return 'cancel';
    return 'restart';
  },

  getMemoriaResetButtonAssets() {
    const mode = this.getMemoriaResetButtonMode();
    if (mode === 'cancel') return AP_MEMORIA_UI.btnAutoCancel;
    if (mode === 'restart') return AP_MEMORIA_UI.btnAutoRestart;
    return AP_MEMORIA_UI.btnReset;
  },

  paintMemoriaResetButton(btn, state = 'normal') {
    if (!btn) return;
    const assets = this.getMemoriaResetButtonAssets();
    const mode = this.getMemoriaResetButtonMode();
    let key = state;
    if (btn.disabled && mode !== 'cancel') key = 'disabled';
    const src = assets[key] || assets.normal;
    if (src) btn.style.backgroundImage = `url('${src}')`;
  },

  applyMemoriaResetButtonSkin(btn) {
    if (!btn || btn.dataset.apMemoriaResetSkinBound === '1') return;
    btn.dataset.apMemoriaResetSkinBound = '1';

    btn.addEventListener('mouseenter', () => {
      if (!btn.disabled) this.paintMemoriaResetButton(btn, 'hover');
    });
    btn.addEventListener('mouseleave', () => {
      if (!btn.disabled) this.paintMemoriaResetButton(btn, 'normal');
    });
    btn.addEventListener('mousedown', () => {
      if (!btn.disabled) this.paintMemoriaResetButton(btn, 'pressed');
    });
    btn.addEventListener('mouseup', () => {
      if (!btn.disabled) this.paintMemoriaResetButton(btn, 'hover');
    });
  },

  onMemoriaResetButtonClick() {
    const mode = this.getMemoriaResetButtonMode();
    if (mode === 'cancel') {
      AutoEnchantAddPotentialModule.cancel(true);
      return;
    }
    if (mode === 'restart') {
      AutoEnchantAddPotentialModule.restartMemorialAutoFromChoice?.();
      return;
    }
    this.resetMemoriaAfter();
  },

  syncMemoriaAutoEnchantLayout() {
    if (typeof aePotSyncMemoriaAutoEnchantLayout === 'function') {
      aePotSyncMemoriaAutoEnchantLayout();
    }
  },

  cloneMemoriaPotential(potential) {
    if (!potential) return null;
    return {
      rank: potential.rank,
      lines: potential.lines.map((line) => ({ ...line })),
      atkPow: potential.atkPow
    };
  },

  compareMemoriaRank(rankA, rankB) {
    return POTENTIAL_RANK_ORDER.indexOf(rankA) - POTENTIAL_RANK_ORDER.indexOf(rankB);
  },

  isMemoriaRankUp(before, after) {
    if (!before || !after) return false;
    return this.compareMemoriaRank(after.rank, before.rank) > 0;
  },

  rollMemoriaAfter(fromBefore = this.memoriaBefore) {
    const cube = getAddPotCubeById(this.memoriaCubeId);
    if (!cube || !fromBefore) return null;

    const rolled = rerollAddPotential(cube, fromBefore, this.itemData);
    return this.cloneMemoriaPotential(rolled);
  },

  openMemoriaAutoSession(before, after, cube, { fadeIn = true } = {}) {
    if (!this.itemData?.additionalPotential) return;

    this.clearMemoriaCloseTimer();
    this.memoriaCubeId = cube?.id || this.memoriaCubeId;
    this.memoriaBefore = this.cloneMemoriaPotential(before);
    this.memoriaAfter = this.cloneMemoriaPotential(after);
    this.memoriaBaseAtk = this.memoriaBefore?.atkPow ?? 0;
    this.memoriaRankUp = this.isMemoriaRankUp(this.memoriaBefore, this.memoriaAfter);
    this.memoriaClosing = false;
    this.memoriaSelectedSide = null;

    const overlay = document.getElementById('apMemoriaOverlay');
    if (overlay) {
      if (fadeIn && overlay.classList.contains('hidden') && typeof beginModalFadeIn === 'function') {
        beginModalFadeIn(overlay);
      } else {
        overlay.classList.remove('hidden');
        overlay.setAttribute('aria-hidden', 'false');
      }
    }

    this.updateUI();
    this.updateResetButtonState();
    this.renderMemoriaOverlay();
    this.syncMemoriaAutoEnchantLayout();
  },

  updateMemoriaAutoSession(before, after) {
    this.memoriaBefore = this.cloneMemoriaPotential(before);
    this.memoriaAfter = this.cloneMemoriaPotential(after);
    this.memoriaRankUp = this.isMemoriaRankUp(this.memoriaBefore, this.memoriaAfter);
    this.memoriaClosing = false;
    this.memoriaSelectedSide = null;
    this.renderMemoriaOverlay();
    if (typeof aePotIsAnyAutoEnchantRunning !== 'function' || !aePotIsAnyAutoEnchantRunning()) {
      if (typeof updateStatusPanel === 'function') updateStatusPanel();
    }
    this.syncMemoriaAutoEnchantLayout();
  },

  openMemoriaOverlay(cube) {
    if (!this.itemData?.additionalPotential) {
      return addLog('⚠️ 裝備附加潛能資料異常。', 'log-fail');
    }

    this.clearMemoriaCloseTimer();
    this.memoriaCubeId = cube.id;
    this.memoriaBefore = this.cloneMemoriaPotential(this.itemData.additionalPotential);
    this.memoriaBaseAtk = this.memoriaBefore.atkPow;
    this.memoriaAfter = this.rollMemoriaAfter();
    if (!this.memoriaAfter) {
      return addLog('⚠️ 恢復附加方塊機率資料載入失敗。', 'log-fail');
    }

    this.memoriaRankUp = this.isMemoriaRankUp(this.memoriaBefore, this.memoriaAfter);
    this.memoriaClosing = false;
    this.memoriaSelectedSide = null;

    const overlay = document.getElementById('apMemoriaOverlay');
    if (overlay) {
      beginModalFadeIn(overlay);
    }

    this.updateUI();
    this.updateResetButtonState();
    this.renderMemoriaOverlay();
  },

  closeMemoriaOverlay() {
    this.clearMemoriaCloseTimer();
    this.memoriaCubeId = null;
    this.memoriaBefore = null;
    this.memoriaAfter = null;
    this.memoriaBaseAtk = null;
    this.memoriaRankUp = false;
    this.memoriaClosing = false;
    this.memoriaSelectedSide = null;

    const overlay = document.getElementById('apMemoriaOverlay');
    if (overlay) {
      overlay.classList.add('hidden');
      if (typeof clearModalFadeState === 'function') clearModalFadeState(overlay);
      overlay.setAttribute('aria-hidden', 'true');
      overlay.classList.remove('is-closing', 'is-auto-rolling', 'is-auto-pick-pending', 'is-auto-restart-ready');
    }

    document.getElementById('apMemoriaBefore')?.classList.remove('is-selected');
    document.getElementById('apMemoriaAfter')?.classList.remove('is-selected');

    this.syncAddPotOverallRank();
    this.updateUI();
    this.updateResetButtonState();
    if (typeof updateStatusPanel === 'function') updateStatusPanel();

    if (typeof AutoEnchantAddPotentialModule !== 'undefined') {
      AutoEnchantAddPotentialModule.onMemoriaOverlayClosed?.();
    }
    this.syncMemoriaAutoEnchantLayout();
  },

  clearMemoriaCloseTimer() {
    if (this.memoriaCloseTimer) {
      clearTimeout(this.memoriaCloseTimer);
      this.memoriaCloseTimer = null;
    }
  },

  resetMemoriaAfter() {
    if (!this.isMemoriaOverlayOpen() || this.memoriaClosing || this.memoriaRankUp) return;
    if (this.isAutoRolling()) return;

    const cube = getAddPotCubeById(this.memoriaCubeId);
    if (!cube) return;

    consumePlayerAddPotCube(cube.id);
    addLog(`🟢 使用 ${cube.name} 重新設定附加潛在能力。`, 'log-success');

    const rolled = this.rollMemoriaAfter();
    if (!rolled) {
      return addLog('⚠️ 恢復附加方塊機率資料載入失敗。', 'log-fail');
    }

    this.memoriaAfter = rolled;
    this.memoriaRankUp = this.isMemoriaRankUp(this.memoriaBefore, this.memoriaAfter);
    this.renderMemoriaOverlay();
  },

  selectMemoriaSide(side) {
    if (!this.isMemoriaOverlayOpen() || this.memoriaClosing || !this.memoriaBefore || !this.memoriaAfter) return;
    if (this.isAutoRolling()) return;
    if (side !== 'before' && side !== 'after') return;

    this.memoriaSelectedSide = side;
    this.memoriaClosing = true;

    const overlay = document.getElementById('apMemoriaOverlay');
    overlay?.classList.add('is-closing');

    const beforeBox = document.getElementById('apMemoriaBefore');
    const afterBox = document.getElementById('apMemoriaAfter');
    beforeBox?.classList.toggle('is-selected', side === 'before');
    afterBox?.classList.toggle('is-selected', side === 'after');

    const btn = document.getElementById('apMemoriaBtnReset');
    if (btn) btn.disabled = true;

    this.memoriaCloseTimer = setTimeout(() => {
      this.applyMemoriaChoice(side);
      this.closeMemoriaOverlay();
    }, 500);
  },

  applyMemoriaChoice(side) {
    const chosen = side === 'after' ? this.memoriaAfter : this.memoriaBefore;
    if (!chosen) return;

    this.lastAtkPow = this.memoriaBaseAtk;
    this.itemData.additionalPotential = this.cloneMemoriaPotential(chosen);
    this.syncAddPotOverallRank();

    addLog(
      `🟢 恢復附加方塊：已套用${side === 'after' ? ' AFTER' : ' BEFORE'} 附加潛在能力。`,
      'log-success'
    );
  },

  renderMemoriaLine(line) {
    const rank = POTENTIAL_RANKS[line.rank] || POTENTIAL_RANKS.rare;
    const text = formatPotentialLineDisplay(line);
    const icon = AP_MEMORIA_UI.icon[line.rank] || rank.statIcon;

    return (
      `<div class="pt-memoria-line pt-memoria-line--${line.rank}">`
      + `<img class="pt-memoria-line-icon" src="${icon}" alt="${rank.prefix}">`
      + `<span class="pt-memoria-line-text">${text}</span>`
      + `</div>`
    );
  },

  renderMemoriaChoiceSide(side, potential) {
    const title = document.getElementById(`apMemoriaTitle${side === 'before' ? 'Before' : 'After'}`);
    const lineList = document.getElementById(`apMemoriaLines${side === 'before' ? 'Before' : 'After'}`);
    const atkDisplay = document.getElementById(`apMemoriaAtk${side === 'before' ? 'Before' : 'After'}`);

    if (!potential) return;

    const rankId = potential.rank || 'rare';
    if (title) {
      title.style.backgroundImage = `url('${AP_MEMORIA_UI.title[rankId] || AP_MEMORIA_UI.title.rare}')`;
    }

    if (lineList) {
      lineList.innerHTML = potential.lines.map((line) => this.renderMemoriaLine(line)).join('');
    }

    if (atkDisplay) {
      const baseAtk = this.memoriaBaseAtk ?? potential.atkPow;
      const delta = (potential.atkPow || 0) - baseAtk;
      atkDisplay.textContent = formatPotentialAtkPow(delta);
      atkDisplay.classList.toggle('pt-atk-up', delta > 0);
      atkDisplay.classList.toggle('pt-atk-down', delta < 0);
    }
  },

  renderMemoriaAutoState() {
    const overlay = document.getElementById('apMemoriaOverlay');
    if (!overlay) return;
    const autoUi = this.isMemorialAutoChoiceUi();
    const rolling = this.isAutoRolling();
    overlay.classList.toggle('is-auto-rolling', rolling);
    overlay.classList.toggle('is-auto-pick-pending', this.isAutoPickPending());
    overlay.classList.toggle('is-auto-restart-ready', autoUi && !rolling);

    const infoBtmImg = overlay.querySelector('.pt-memoria-info-btm-img');
    if (infoBtmImg) {
      infoBtmImg.src = autoUi
        ? AP_MEMORIA_UI.infoAutoBtm
        : AP_MEMORIA_UI.infoBtm;
    }

    const confirmBg = overlay.querySelector('.pt-memoria-confirm-bg');
    if (confirmBg) {
      confirmBg.style.backgroundImage = `url('${autoUi ? AP_MEMORIA_UI.confirmAutoBg : AP_MEMORIA_UI.confirmBg}')`;
    }
  },

  renderMemoriaOverlay() {
    if (!this.isMemoriaOverlayOpen()) return;

    const equipIcon = document.getElementById('apMemoriaEquipIcon');
    if (equipIcon && this.itemData?.icon) {
      equipIcon.src = this.itemData.icon;
      equipIcon.alt = this.itemData.name || '';
    }

    this.renderMemoriaChoiceSide('before', this.memoriaBefore);
    this.renderMemoriaChoiceSide('after', this.memoriaAfter);
    this.renderMemoriaAutoState();

    const countDisplay = document.getElementById('apMemoriaCubeCount');
    if (countDisplay && this.memoriaCubeId) {
      countDisplay.textContent = this.formatMemoriaCubeCount(getPlayerAddPotCubeCount(this.memoriaCubeId));
    }

    const mesoDisplay = document.getElementById('apMemoriaHeldMeso');
    if (mesoDisplay) {
      mesoDisplay.textContent = AP_MEMORIA_HELD_MESO_TEXT;
    }

    const btn = document.getElementById('apMemoriaBtnReset');
    if (btn) {
      this.applyMemoriaResetButtonSkin(btn);
      const mode = this.getMemoriaResetButtonMode();
      const disabled = mode === 'cancel'
        ? Boolean(this.memoriaClosing)
        : Boolean(this.memoriaRankUp || this.memoriaClosing);
      btn.disabled = disabled;
      btn.classList.toggle('is-disabled', disabled);
      this.paintMemoriaResetButton(btn, disabled ? 'disabled' : 'normal');
    }
  }
});
