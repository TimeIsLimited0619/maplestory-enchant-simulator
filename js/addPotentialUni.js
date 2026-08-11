/**
 * 結合附加方塊 — 選排重骰介面
 */
const AP_UNI_UI = {
  infoTop: 'images/potential/uniUI/fullScreen_uni.canvas_infoTop.png',
  infoBtm: 'images/potential/uniUI/fullScreen_uni.canvas_infoBtm.png',
  choiceBox: 'images/potential/uniUI/fullScreen_uni.choiceBox.canvas_baseUni.png',
  atkOutline: 'images/potential/uniUI/fullScreen_uni.choiceBox.atkPow.highlight.layer_outline.png',
  title: {
    rare: 'images/potential/uniUI/fullScreen_uni.choiceBox.title.canvas_title_rare.png',
    epic: 'images/potential/uniUI/fullScreen_uni.choiceBox.title.canvas_title_epic.png',
    unique: 'images/potential/uniUI/fullScreen_uni.choiceBox.title.canvas_title_unique.png',
    legendary: 'images/potential/uniUI/fullScreen_uni.choiceBox.title.canvas_title_legendary.png'
  },
  icon: {
    rare: 'images/potential/uniUI/fullScreen_uni.choiceBox.detail.icon.canvas_icon_rare.png',
    epic: 'images/potential/uniUI/fullScreen_uni.choiceBox.detail.icon.canvas_icon_epic.png',
    unique: 'images/potential/uniUI/fullScreen_uni.choiceBox.detail.icon.canvas_icon_unique.png',
    legendary: 'images/potential/uniUI/fullScreen_uni.choiceBox.detail.icon.canvas_icon_legendary.png'
  },
  confirmBefore: 'images/potential/uniUI/fullScreen_uni.confirmBox.beforeConfirm.layer_bg.png',
  confirmAfter: 'images/potential/uniUI/fullScreen_uni.confirmBox.afterConfirm.layer_bg.png',
  btnReselectBefore: {
    normal: 'images/potential/uniUI/fullScreen_uni.confirmBox.beforeConfirm.button_Reselct.normal.0.png',
    hover: 'images/potential/uniUI/fullScreen_uni.confirmBox.beforeConfirm.button_Reselct.mouseOver.0.png',
    pressed: 'images/potential/uniUI/fullScreen_uni.confirmBox.beforeConfirm.button_Reselct.pressed.0.png',
    disabled: 'images/potential/uniUI/fullScreen_uni.confirmBox.beforeConfirm.button_Reselct.disabled.0.png'
  },
  btnReset: {
    normal: 'images/potential/uniUI/fullScreen_uni.confirmBox.beforeConfirm.button_Reset.normal.0.png',
    hover: 'images/potential/uniUI/fullScreen_uni.confirmBox.beforeConfirm.button_Reset.mouseOver.0.png',
    pressed: 'images/potential/uniUI/fullScreen_uni.confirmBox.beforeConfirm.button_Reset.pressed.0.png',
    disabled: 'images/potential/uniUI/fullScreen_uni.confirmBox.beforeConfirm.button_Reset.disabled.0.png'
  },
  btnExitBefore: {
    normal: 'images/potential/uniUI/fullScreen_uni.confirmBox.beforeConfirm.button_Exit.normal.0.png',
    hover: 'images/potential/uniUI/fullScreen_uni.confirmBox.beforeConfirm.button_Exit.mouseOver.0.png',
    pressed: 'images/potential/uniUI/fullScreen_uni.confirmBox.beforeConfirm.button_Exit.pressed.0.png',
    disabled: 'images/potential/uniUI/fullScreen_uni.confirmBox.beforeConfirm.button_Exit.disabled.0.png'
  },
  btnReselectAfter: {
    normal: 'images/potential/uniUI/fullScreen_uni.confirmBox.afterConfirm.button_Reselect.normal.0.png',
    hover: 'images/potential/uniUI/fullScreen_uni.confirmBox.afterConfirm.button_Reselect.mouseOver.0.png',
    pressed: 'images/potential/uniUI/fullScreen_uni.confirmBox.afterConfirm.button_Reselect.pressed.0.png',
    disabled: 'images/potential/uniUI/fullScreen_uni.confirmBox.afterConfirm.button_Reselect.disabled.0.png'
  },
  btnExitAfter: {
    normal: 'images/potential/uniUI/fullScreen_uni.confirmBox.afterConfirm.button_Exit.normal.0.png',
    hover: 'images/potential/uniUI/fullScreen_uni.confirmBox.afterConfirm.button_Exit.mouseOver.0.png',
    pressed: 'images/potential/uniUI/fullScreen_uni.confirmBox.afterConfirm.button_Exit.pressed.0.png',
    disabled: 'images/potential/uniUI/fullScreen_uni.confirmBox.afterConfirm.button_Exit.disabled.0.png'
  }
};

Object.assign(AddPotentialModule, {
  uniCubeId: null,
  uniPhase: null,
  uniSelectedLineIndex: null,
  uniPreviewLine: null,
  uniPreviewAtkPow: null,
  uniBaseLines: null,

  formatUniCubeCount(count) {
    return count >= DEFAULT_CUBE_COUNT ? '999+' : count.toLocaleString();
  },

  isUniOverlayOpen() {
    return !document.getElementById('apUniOverlay')?.classList.contains('hidden');
  },

  openUniOverlay(cube) {
    const lines = this.itemData?.additionalPotential?.lines;
    if (!lines?.length) {
      return addLog('⚠️ 裝備附加潛能資料異常。', 'log-fail');
    }

    this.uniCubeId = cube.id;
    this.uniPhase = 'select';
    this.uniSelectedLineIndex = pickRandomUnionLineIndex();
    this.uniPreviewLine = null;
    this.uniPreviewAtkPow = null;
    this.uniBaseLines = lines.map((line) => ({ ...line }));
    this.lastAtkPow = this.itemData.additionalPotential.atkPow;

    const overlay = document.getElementById('apUniOverlay');
    if (overlay) {
      this.uniClosing = false;
      beginModalFadeIn(overlay);
    }

    this.updateUI();
    this.updateResetButtonState();
    this.renderUniOverlay();
  },

  closeUniOverlay() {
    this.uniCubeId = null;
    this.uniPhase = null;
    this.uniSelectedLineIndex = null;
    this.uniPreviewLine = null;
    this.uniPreviewAtkPow = null;
    this.uniBaseLines = null;

    const overlay = document.getElementById('apUniOverlay');
    if (overlay) {
      overlay.classList.add('hidden');
      overlay.setAttribute('aria-hidden', 'true');
    }

    this.updateUI();
    this.updateResetButtonState();
  },

  resetUniLine() {
    if (this.uniPhase !== 'select' || this.uniSelectedLineIndex == null) return;

    const rankBeforeRoll = this.itemData.additionalPotential.rank;
    const rolled = rollUnionAddLine(this.itemData, this.itemData.additionalPotential, this.uniSelectedLineIndex);
    if (!rolled) {
      return addLog('⚠️ 結合附加方塊機率資料載入失敗。', 'log-fail');
    }

    const lines = (this.uniBaseLines || this.itemData.additionalPotential.lines).map((line) => ({ ...line }));
    lines[this.uniSelectedLineIndex] = { ...rolled };
    const previewAtk = rollUnionPreviewAtkPow(this.itemData.additionalPotential);

    this.uniPreviewLine = rolled;
    this.uniPreviewAtkPow = previewAtk;
    this.uniPhase = 'preview';

    this.itemData.additionalPotential = {
      ...this.itemData.additionalPotential,
      lines,
      atkPow: previewAtk
    };
    syncUnionCubeOverallRank(
      this.itemData.additionalPotential,
      this.uniSelectedLineIndex,
      rankBeforeRoll
    );
    this.uniBaseLines = lines.map((line) => ({ ...line }));
    this.updateUI();
    this.renderUniOverlay();
    addLog('🟢 結合附加方塊已重新設定選擇的附加潛在能力。', 'log-success');
    if (typeof updateStatusPanel === 'function') updateStatusPanel();
  },

  applyUniPreview() {
    if (this.uniPhase !== 'preview') return;
    this.closeUniOverlay();
  },

  exitUniOverlay() {
    this.closeUniOverlay();
  },

  reselectUniLine() {
    if (!this.uniPhase || !this.uniCubeId) return;

    const cube = getAddPotCubeById(this.uniCubeId);
    if (!cube) return;

    consumePlayerAddPotCube(this.uniCubeId);
    addLog(`🟢 使用 ${cube.name} 重新選擇附加潛在能力。`, 'log-success');

    if (this.uniPhase === 'preview') {
      this.uniPhase = 'select';
      this.uniPreviewLine = null;
      this.uniPreviewAtkPow = null;
    }

    this.uniSelectedLineIndex = pickRandomUnionLineIndex();
    this.updateUI();
    this.renderUniOverlay();
  },

  getUniDisplayLines() {
    if (this.uniPhase === 'preview') {
      return (this.itemData?.additionalPotential?.lines || []).map((line) => ({ ...line }));
    }

    const base = this.uniBaseLines || this.itemData?.additionalPotential?.lines || [];
    return base.map((line) => ({ ...line }));
  },

  renderUniLineRow(line, index, { selected, preview }) {
    const rank = POTENTIAL_RANKS[line.rank] || POTENTIAL_RANKS.rare;
    const text = formatPotentialLineDisplay(line);
    const icon = AP_UNI_UI.icon[line.rank] || rank.statIcon;
    const classes = [
      'pt-uni-line',
      `pt-uni-line--${line.rank}`,
      selected ? 'selected' : '',
      preview ? 'pt-uni-line--preview' : ''
    ].filter(Boolean).join(' ');

    return (
      `<div class="${classes}" data-uni-line="${index}">`
      + `<img class="pt-uni-line-icon" src="${icon}" alt="${rank.prefix}">`
      + `<span class="pt-uni-line-text">${text}</span>`
      + `</div>`
    );
  },

  renderUniOverlay() {
    if (!this.uniPhase) return;

    const title = document.getElementById('apUniTitle');
    const lineList = document.getElementById('apUniLineList');
    const atkDisplay = document.getElementById('apUniAtkPow');
    const countDisplay = document.getElementById('apUniCubeCount');
    const confirmBox = document.getElementById('apUniConfirmBox');
    const actionsBefore = document.getElementById('apUniActionsBefore');
    const actionsAfter = document.getElementById('apUniActionsAfter');
    const atkOutline = document.getElementById('apUniAtkOutline');
    const choiceBox = document.querySelector('#apUniOverlay .pt-uni-choice-box');

    const rankId = this.itemData?.additionalPotential?.rank || 'rare';
    if (title) {
      title.style.backgroundImage = `url('${AP_UNI_UI.title[rankId] || AP_UNI_UI.title.rare}')`;
    }

    if (choiceBox) {
      choiceBox.classList.toggle('pt-uni-choice-box--preview', this.uniPhase === 'preview');
    }

    if (lineList) {
      const lines = this.getUniDisplayLines();
      lineList.innerHTML = lines.map((line, index) => (
        this.renderUniLineRow(line, index, {
          selected: this.uniPhase === 'select' && index === this.uniSelectedLineIndex,
          preview: this.uniPhase === 'preview' && index === this.uniSelectedLineIndex
        })
      )).join('');
    }

    if (atkDisplay && atkOutline) {
      if (this.uniPhase === 'preview') {
        const previewAtk = this.uniPreviewAtkPow ?? this.itemData?.additionalPotential?.atkPow ?? 0;
        const baseAtk = this.lastAtkPow ?? previewAtk;
        const delta = previewAtk - baseAtk;
        atkDisplay.textContent = formatPotentialAtkPow(delta);
        atkDisplay.classList.toggle('pt-atk-up', delta > 0);
        atkDisplay.classList.toggle('pt-atk-down', delta < 0);
        atkOutline.classList.remove('hidden');
      } else {
        atkDisplay.textContent = '-';
        atkDisplay.classList.remove('pt-atk-up', 'pt-atk-down');
        atkOutline.classList.add('hidden');
      }
    }

    if (countDisplay && this.uniCubeId) {
      countDisplay.textContent = this.formatUniCubeCount(getPlayerAddPotCubeCount(this.uniCubeId));
    }

    if (confirmBox) {
      confirmBox.classList.toggle('pt-uni-confirm-box--preview', this.uniPhase === 'preview');
    }

    if (actionsBefore) actionsBefore.classList.toggle('hidden', this.uniPhase !== 'select');
    if (actionsAfter) actionsAfter.classList.toggle('hidden', this.uniPhase !== 'preview');
  }
});
