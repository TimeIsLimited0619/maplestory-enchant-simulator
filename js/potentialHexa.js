/**
 * 閃炫方塊 — 六選三全螢幕介面
 */
const HEXA_UI = {
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

const HEXA_PICK_COUNT = 3;

Object.assign(PotentialModule, {
  hexaCubeId: null,
  hexaPhase: null,
  hexaSession: null,
  hexaSelected: null,
  hexaPreviewPotential: null,
  /** 本輪標題階級：開局 rankUp 骰完後的 headerRank，不隨六選三勾選改變 */
  hexaTitleRank: null,
  hexaClosing: false,

  applyHexaSessionTitle(session) {
    this.hexaTitleRank = session?.headerRank || this.itemData?.potential?.rank || 'rare';
  },

  formatHexaCubeCount(count) {
    return count >= DEFAULT_CUBE_COUNT ? '999+' : count.toLocaleString();
  },

  /** 以指定 session 開啟／更新閃炫選項（自動重設用） */
  openHexaOverlayWithSession(cube, session, { fadeIn = true } = {}) {
    if (!session) return false;

    this.hexaCubeId = cube.id;
    this.hexaPhase = 'select';
    this.hexaSession = session;
    this.hexaSelected = new Set();
    this.hexaPreviewPotential = null;
    this.applyHexaSessionTitle(session);

    const overlay = document.getElementById('ptHexaOverlay');
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
    if (typeof updateStatusPanel === 'function') updateStatusPanel();
    aePotSyncHexaAutoEnchantLayout?.();
    return true;
  },

  openHexaOverlay(cube) {
    const session = rollDazzlingHexaChoices(this.itemData, this.itemData.potential);
    if (!session) {
      return addLog('⚠️ 閃炫方塊機率資料載入失敗。', 'log-fail');
    }

    this.hexaCubeId = cube.id;
    this.hexaPhase = 'select';
    this.hexaSession = session;
    this.hexaSelected = new Set();
    this.hexaPreviewPotential = null;
    this.applyHexaSessionTitle(session);

    const overlay = document.getElementById('ptHexaOverlay');
    if (overlay) {
      this.hexaClosing = false;
      beginModalFadeIn(overlay);
    }

    this.updateUI();
    this.updateResetButtonState();
    this.renderHexaOverlay();
    aePotSyncHexaAutoEnchantLayout?.();
  },

  resetHexaOverlayState() {
    this.hexaCubeId = null;
    this.hexaPhase = null;
    this.hexaSession = null;
    this.hexaSelected = null;
    this.hexaPreviewPotential = null;
    this.hexaTitleRank = null;
    this.syncPotentialOverallRank();
    if (typeof AutoEnchantPotentialModule !== 'undefined') {
      AutoEnchantPotentialModule.onHexaOverlayClosed?.();
    }
    aePotSyncHexaAutoEnchantLayout?.();
  },

  closeHexaOverlay() {
    const overlay = document.getElementById('ptHexaOverlay');
    if (!overlay || overlay.classList.contains('hidden')) {
      this.resetHexaOverlayState();
      this.hexaClosing = false;
      this.updateUI();
      this.updateResetButtonState();
      return;
    }
    if (this.hexaClosing) return;

    this.hexaClosing = true;
    beginModalFadeOut(overlay, () => {
      this.resetHexaOverlayState();
      this.hexaClosing = false;
      this.updateUI();
      this.updateResetButtonState();
    });
  },

  toggleHexaSelection(index) {
    if (this.hexaPhase !== 'select' || !this.hexaSelected) return;

    if (this.hexaSelected.has(index)) {
      this.hexaSelected.delete(index);
    } else if (this.hexaSelected.size < HEXA_PICK_COUNT) {
      this.hexaSelected.add(index);
    }

    this.renderHexaOverlay();
  },

  confirmHexaSelection() {
    if (this.hexaPhase !== 'select' || this.hexaSelected?.size !== HEXA_PICK_COUNT) return;

    const selectedIndexes = [...this.hexaSelected].sort((a, b) => a - b);
    this.hexaPreviewPotential = buildPotentialFromHexaSelection(this.hexaSession, selectedIndexes);
    this.syncPotentialOverallRank(this.hexaPreviewPotential);

    this.lastAtkPow = this.itemData.potential.atkPow;
    this.itemData.potential = {
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

    const cube = getPotentialCubeById(this.hexaCubeId);
    if (!cube) return;

    consumePlayerCube(cube.id);
    addLog(`🔮 使用 ${cube.name} 重新設定潛在能力。`, 'log-success');

    const session = rollDazzlingHexaChoices(this.itemData, this.itemData.potential);
    if (!session) {
      this.closeHexaOverlay();
      return;
    }

    this.hexaPhase = 'select';
    this.hexaSession = session;
    this.hexaSelected = new Set();
    this.hexaPreviewPotential = null;
    this.applyHexaSessionTitle(session);
    this.lastAtkPow = this.itemData.potential.atkPow;
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
    const icon = HEXA_UI.icon[line.rank] || rank.statIcon;
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
      ? ` type="button" data-hexa-index="${index}" onclick="PotentialModule.toggleHexaSelection(${index})"`
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

    const title = document.getElementById('ptHexaTitle');
    const optionList = document.getElementById('ptHexaOptionList');
    const pickCount = document.getElementById('ptHexaPickCount');
    const atkDisplay = document.getElementById('ptHexaAtkPow');
    const countDisplay = document.getElementById('ptHexaCubeCount');
    const confirmBox = document.getElementById('ptHexaConfirmBox');
    const actionsBefore = document.getElementById('ptHexaActionsBefore');
    const actionsAfter = document.getElementById('ptHexaActionsAfter');
    const btnOk = document.getElementById('ptHexaBtnOk');
    const atkOutline = document.getElementById('ptHexaAtkOutline');

    const choiceBox = document.querySelector('.pt-hexa-choice-box');
    const titleRank = this.hexaTitleRank || this.itemData?.potential?.rank || 'rare';
    if (title) {
      title.style.backgroundImage = `url('${HEXA_UI.title[titleRank] || HEXA_UI.title.rare}')`;
    }

    if (choiceBox) {
      choiceBox.classList.toggle('pt-hexa-choice-box--preview', this.hexaPhase === 'preview');
    }

    if (pickCount) {
      const picked = this.hexaPhase === 'preview' ? HEXA_PICK_COUNT : (this.hexaSelected?.size || 0);
      pickCount.textContent = `${picked} / ${HEXA_PICK_COUNT}`;
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
        const currentAtk = this.itemData?.potential?.atkPow || 0;
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
      countDisplay.textContent = this.formatHexaCubeCount(getPlayerCubeCount(this.hexaCubeId));
    }

    if (confirmBox) {
      confirmBox.classList.toggle('pt-hexa-confirm-box--preview', this.hexaPhase === 'preview');
    }

    const canConfirm = this.hexaPhase === 'select' && this.hexaSelected?.size === HEXA_PICK_COUNT;
    if (actionsBefore) actionsBefore.classList.toggle('hidden', this.hexaPhase !== 'select');
    if (actionsAfter) actionsAfter.classList.toggle('hidden', this.hexaPhase !== 'preview');
    if (btnOk) btnOk.disabled = !canConfirm;
    aePotSyncHexaAutoEnchantLayout?.();
  }
});
