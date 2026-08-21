/**
 * 閃亮附加方塊 — 六選三全螢幕介面
 */
const AP_HEXA_UI = {
  infoTop: 'images/potential/hexaUI/fullScreen_hexa.canvas_infoTop.png',
  choiceBox: 'images/potential/hexaUI/fullScreen_hexa.choiceBox.canvas_baseHexa.png',
  atkOutline: 'images/potential/hexaUI/fullScreen_hexa.choiceBox.atkPow.highlight.layer_outline.png',
  title: {
    rare: 'images/potential/hexaUI/fullScreen_hexa.choiceBox.title.canvas_title_rare.png',
    epic: 'images/potential/hexaUI/fullScreen_hexa.choiceBox.title.canvas_title_epic.png',
    unique: 'images/potential/hexaUI/fullScreen_hexa.choiceBox.title.canvas_title_unique.png',
    legendary: 'images/potential/hexaUI/fullScreen_hexa.choiceBox.title.canvas_title_legendary.png'
  },
  icon: {
    rare: 'images/potential/hexaUI/fullScreen_hexa.choiceBox.detail.icon.canvas_icon_rare.png',
    epic: 'images/potential/hexaUI/fullScreen_hexa.choiceBox.detail.icon.canvas_icon_epic.png',
    unique: 'images/potential/hexaUI/fullScreen_hexa.choiceBox.detail.icon.canvas_icon_unique.png',
    legendary: 'images/potential/hexaUI/fullScreen_hexa.choiceBox.detail.icon.canvas_icon_legendary.png'
  },
  confirmBefore: 'images/potential/hexaUI/fullScreen_hexa.confirmBox.beforeConfirm.layer_bg.png',
  confirmAfter: 'images/potential/hexaUI/fullScreen_hexa.confirmBox.afterConfirm.layer_bg.png',
  btnOk: {
    normal: 'images/potential/hexaUI/fullScreen_hexa.confirmBox.beforeConfirm.button_OK.normal.0.png',
    hover: 'images/potential/hexaUI/fullScreen_hexa.confirmBox.beforeConfirm.button_OK.mouseOver.0.png',
    pressed: 'images/potential/hexaUI/fullScreen_hexa.confirmBox.beforeConfirm.button_OK.pressed.0.png',
    disabled: 'images/potential/hexaUI/fullScreen_hexa.confirmBox.beforeConfirm.button_OK.disabled.0.png'
  },
  btnUse: {
    normal: 'images/potential/hexaUI/fullScreen_hexa.confirmBox.afterConfirm.button_Use.normal.0.png',
    hover: 'images/potential/hexaUI/fullScreen_hexa.confirmBox.afterConfirm.button_Use.mouseOver.0.png',
    pressed: 'images/potential/hexaUI/fullScreen_hexa.confirmBox.afterConfirm.button_Use.pressed.0.png',
    disabled: 'images/potential/hexaUI/fullScreen_hexa.confirmBox.afterConfirm.button_Use.disabled.0.png'
  },
  btnExit: {
    normal: 'images/potential/hexaUI/fullScreen_hexa.confirmBox.afterConfirm.button_Exit.normal.0.png',
    hover: 'images/potential/hexaUI/fullScreen_hexa.confirmBox.afterConfirm.button_Exit.mouseOver.0.png',
    pressed: 'images/potential/hexaUI/fullScreen_hexa.confirmBox.afterConfirm.button_Exit.pressed.0.png',
    disabled: 'images/potential/hexaUI/fullScreen_hexa.confirmBox.afterConfirm.button_Exit.disabled.0.png'
  }
};

const AP_HEXA_PICK_COUNT = 3;

Object.assign(AddPotentialModule, {
  hexaCubeId: null,
  hexaPhase: null,
  hexaSession: null,
  hexaSelected: null,
  hexaPreviewPotential: null,
  /** 本輪標題階級：開局 rankUp 骰完後的 headerRank，不隨六選三勾選改變 */
  hexaTitleRank: null,

  applyHexaSessionTitle(session) {
    this.hexaTitleRank = session?.headerRank || this.itemData?.additionalPotential?.rank || 'rare';
  },

  formatHexaCubeCount(count) {
    return count >= DEFAULT_CUBE_COUNT ? '999+' : count.toLocaleString();
  },

  openHexaOverlayWithSession(cube, session, { fadeIn = true } = {}) {
    if (!session) return false;

    this.hexaCubeId = cube.id;
    this.hexaPhase = 'select';
    this.hexaSession = session;
    this.hexaSelected = new Set();
    this.hexaPreviewPotential = null;
    this.applyHexaSessionTitle(session);

    const overlay = document.getElementById('apHexaOverlay');
    if (overlay) {
      this.hexaClosing = false;
      if (fadeIn && overlay.classList.contains('hidden')) {
        beginModalFadeIn(overlay);
      } else {
        overlay.classList.remove('hidden');
        overlay.setAttribute('aria-hidden', 'false');
      }
    }

    this.updateUI();
    this.updateResetButtonState();
    this.renderHexaOverlay();
    aePotSyncHexaAutoEnchantLayout?.();
    return true;
  },

  updateHexaAutoSession(session) {
    if (!session) return false;

    this.hexaSession = session;
    this.hexaPhase = 'select';
    this.hexaSelected = new Set();
    this.hexaPreviewPotential = null;
    this.applyHexaSessionTitle(session);
    this.renderHexaOverlay();
    if (typeof aePotIsAnyAutoEnchantRunning !== 'function' || !aePotIsAnyAutoEnchantRunning()) {
      if (typeof updateStatusPanel === 'function') updateStatusPanel();
    }
    aePotSyncHexaAutoEnchantLayout?.();
    return true;
  },

  openHexaOverlay(cube) {
    const session = rollBrightAddHexaChoices(this.itemData, this.itemData.additionalPotential);
    if (!session) {
      return addLog('⚠️ 閃亮附加方塊機率資料載入失敗。', 'log-fail');
    }

    this.hexaCubeId = cube.id;
    this.hexaPhase = 'select';
    this.hexaSession = session;
    this.hexaSelected = new Set();
    this.hexaPreviewPotential = null;
    this.applyHexaSessionTitle(session);

    const overlay = document.getElementById('apHexaOverlay');
    if (overlay) {
      this.hexaClosing = false;
      beginModalFadeIn(overlay);
    }

    this.updateUI();
    this.updateResetButtonState();
    this.renderHexaOverlay();
    aePotSyncHexaAutoEnchantLayout?.();
  },

  closeHexaOverlay() {
    this.hexaCubeId = null;
    this.hexaPhase = null;
    this.hexaSession = null;
    this.hexaSelected = null;
    this.hexaPreviewPotential = null;
    this.hexaTitleRank = null;
    this.syncAddPotOverallRank();

    const overlay = document.getElementById('apHexaOverlay');
    if (overlay) {
      overlay.classList.add('hidden');
      overlay.setAttribute('aria-hidden', 'true');
    }

    if (typeof AutoEnchantAddPotentialModule !== 'undefined') {
      AutoEnchantAddPotentialModule.onHexaOverlayClosed?.();
    }

    this.updateUI();
    this.updateResetButtonState();
    aePotSyncHexaAutoEnchantLayout?.();
  },

  toggleHexaSelection(index) {
    if (this.hexaPhase !== 'select' || !this.hexaSelected) return;

    if (this.hexaSelected.has(index)) {
      this.hexaSelected.delete(index);
    } else if (this.hexaSelected.size < AP_HEXA_PICK_COUNT) {
      this.hexaSelected.add(index);
    }

    this.renderHexaOverlay();
  },

  confirmHexaSelection() {
    if (this.hexaPhase !== 'select' || this.hexaSelected?.size !== AP_HEXA_PICK_COUNT) return;

    const selectedIndexes = [...this.hexaSelected].sort((a, b) => a - b);
    this.hexaPreviewPotential = buildPotentialFromHexaSelection(this.hexaSession, selectedIndexes);
    this.syncAddPotOverallRank(this.hexaPreviewPotential);

    this.lastAtkPow = this.itemData.additionalPotential.atkPow;
    this.itemData.additionalPotential = {
      ...this.hexaPreviewPotential,
      lines: this.hexaPreviewPotential.lines.map((line) => ({ ...line }))
    };

    this.hexaPhase = 'preview';
    this.hexaSelected = new Set();
    this.updateUI();
    this.renderHexaOverlay();
    if (typeof updateStatusPanel === 'function') updateStatusPanel();
  },

  applyHexaSelection() {
    if (this.hexaPhase !== 'preview' || !this.hexaSession || !this.hexaCubeId) return;

    const cube = getAddPotCubeById(this.hexaCubeId);
    if (!cube) return;

    consumePlayerAddPotCube(cube.id);
    addLog(`🟢 使用 ${cube.name} 重新設定附加潛在能力。`, 'log-success');

    const session = rollBrightAddHexaChoices(this.itemData, this.itemData.additionalPotential);
    if (!session) {
      this.closeHexaOverlay();
      return;
    }

    this.hexaPhase = 'select';
    this.hexaSession = session;
    this.hexaSelected = new Set();
    this.hexaPreviewPotential = null;
    this.applyHexaSessionTitle(session);
    this.lastAtkPow = this.itemData.additionalPotential.atkPow;
    this.updateUI();
    this.renderHexaOverlay();
    if (typeof updateStatusPanel === 'function') updateStatusPanel();
  },

  exitHexaOverlay() {
    this.closeHexaOverlay();
  },

  renderHexaOptionLine(line, index, { selectable, selected, compact, result }) {
    const rank = POTENTIAL_RANKS[line.rank] || POTENTIAL_RANKS.rare;
    const text = formatPotentialLineDisplay(line);
    const icon = AP_HEXA_UI.icon[line.rank] || rank.statIcon;
    const classes = [
      'pt-hexa-option',
      `pt-hexa-option--${line.rank}`,
      selectable ? 'pt-hexa-option--selectable' : '',
      selected ? 'selected' : '',
      compact ? 'pt-hexa-option--compact' : '',
      result ? 'pt-hexa-option--result' : ''
    ].filter(Boolean).join(' ');

    const tag = selectable ? 'button' : 'div';
    const attrs = selectable
      ? ` type="button" data-hexa-index="${index}" onclick="AddPotentialModule.toggleHexaSelection(${index})"`
      : '';

    return (
      `<${tag} class="${classes}"${attrs}>`
      + `<img class="pt-hexa-option-icon" src="${icon}" alt="${rank.prefix}">`
      + `<span class="pt-hexa-option-text">${text}</span>`
      + `</${tag}>`
    );
  },

  renderHexaOverlay() {
    const session = this.hexaSession;
    if (!session) return;

    const title = document.getElementById('apHexaTitle');
    const optionList = document.getElementById('apHexaOptionList');
    const pickCount = document.getElementById('apHexaPickCount');
    const atkDisplay = document.getElementById('apHexaAtkPow');
    const countDisplay = document.getElementById('apHexaCubeCount');
    const confirmBox = document.getElementById('apHexaConfirmBox');
    const actionsBefore = document.getElementById('apHexaActionsBefore');
    const actionsAfter = document.getElementById('apHexaActionsAfter');
    const btnOk = document.getElementById('apHexaBtnOk');
    const atkOutline = document.getElementById('apHexaAtkOutline');

    const choiceBox = document.querySelector('#apHexaOverlay .pt-hexa-choice-box');
    const titleRank = this.hexaTitleRank || this.itemData?.additionalPotential?.rank || 'rare';
    if (title) {
      title.style.backgroundImage = `url('${AP_HEXA_UI.title[titleRank] || AP_HEXA_UI.title.rare}')`;
    }

    if (choiceBox) {
      choiceBox.classList.toggle('pt-hexa-choice-box--preview', this.hexaPhase === 'preview');
    }

    if (pickCount) {
      const picked = this.hexaPhase === 'preview' ? AP_HEXA_PICK_COUNT : (this.hexaSelected?.size || 0);
      pickCount.textContent = `${picked} / ${AP_HEXA_PICK_COUNT}`;
    }

    if (optionList) {
      if (this.hexaPhase === 'select') {
        optionList.innerHTML = session.options.map((line, index) => (
          this.renderHexaOptionLine(line, index, {
            selectable: true,
            selected: this.hexaSelected?.has(index),
            compact: false
          })
        )).join('');
      } else {
        const lines = this.hexaPreviewPotential?.lines || [];
        optionList.innerHTML = lines.map((line, index) => (
          this.renderHexaOptionLine(line, index, {
            selectable: false,
            selected: false,
            compact: true,
            result: true
          })
        )).join('');
      }
    }

    if (atkDisplay && atkOutline) {
      if (this.hexaPhase === 'preview') {
        const currentAtk = this.itemData?.additionalPotential?.atkPow || 0;
        const baseAtk = this.lastAtkPow ?? currentAtk;
        const delta = currentAtk - baseAtk;
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

    if (countDisplay && this.hexaCubeId) {
      countDisplay.textContent = this.formatHexaCubeCount(getPlayerAddPotCubeCount(this.hexaCubeId));
    }

    if (confirmBox) {
      confirmBox.classList.toggle('pt-hexa-confirm-box--preview', this.hexaPhase === 'preview');
    }

    const canConfirm = this.hexaPhase === 'select' && this.hexaSelected?.size === AP_HEXA_PICK_COUNT;
    if (actionsBefore) actionsBefore.classList.toggle('hidden', this.hexaPhase !== 'select');
    if (actionsAfter) actionsAfter.classList.toggle('hidden', this.hexaPhase !== 'preview');
    if (btnOk) btnOk.disabled = !canConfirm;
    aePotSyncHexaAutoEnchantLayout?.();
  }
});
