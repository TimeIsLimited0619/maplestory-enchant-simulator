/**

 * Enchant.img/autoEnchant 版面常數（自動產生）

 * 來源：UI.Enchant.img.xml → scripts/parse-auto-enchant.mjs

 * 素材路徑：images/autoEnchant/…（待匯入 WZ _outlink）

 */



/** 啟用官方自動強化彈窗（false 時僅使用舊版 checkbox） */

const AUTO_ENCHANT_USE_OVERLAY = true;



const AUTO_ENCHANT_IMAGE_BASE = 'images/autoEnchant/';



const AUTO_ENCHANT_STAR_FORCE = {
  "backgrnd": "images/autoEnchant/autoEnchant_starForce_backgrnd.png",
  "diffBefore": {
    "x": 178,
    "y": 54
  },
  "progressAlertOffset": {
    "x": 0,
    "y": 8
  },
  "subWndMargin": {
    "x": 1,
    "y": 0
  },
  "diffBeforeFont": {
    "font": "MD摩利斯9",
    "color": "FFC7DFE0",
    "size": 12,
    "bold": true
  },
  "targetEdit": {
    "lt": {
      "x": 105,
      "y": 87
    },
    "rb": {
      "x": 153,
      "y": 102
    },
    "maxLen": 2
  },
  "buttons": {
    "ok": {
      "id": null,
      "toolTip": null,
      "toolTipDisabled": null,
      "states": {
        "normal": {
          "origin": {
            "x": -102,
            "y": -199
          },
          "src": "images/autoEnchant/autoEnchant_starForce_button_OK_normal_0.png"
        }
      }
    },
    "cancel": {
      "id": null,
      "toolTip": null,
      "toolTipDisabled": null,
      "states": {
        "normal": {
          "origin": {
            "x": -102,
            "y": -199
          },
          "src": "images/autoEnchant/autoEnchant_starForce_button_Cancel_normal_0.png"
        }
      }
    },
    "up": {
      "id": null,
      "toolTip": null,
      "toolTipDisabled": null,
      "states": {
        "normal": {
          "origin": {
            "x": -161,
            "y": -82
          },
          "src": "images/autoEnchant/autoEnchant_starForce_button_UP_normal_0.png"
        }
      }
    },
    "down": {
      "id": null,
      "toolTip": null,
      "toolTipDisabled": null,
      "states": {
        "normal": {
          "origin": {
            "x": -184,
            "y": -82
          },
          "src": "images/autoEnchant/autoEnchant_starForce_button_Down_normal_0.png"
        }
      }
    },
    "all": {
      "id": null,
      "toolTip": null,
      "toolTipDisabled": null,
      "states": {
        "normal": {
          "origin": {
            "x": -207,
            "y": -82
          },
          "src": "images/autoEnchant/autoEnchant_starForce_button_All_normal_0.png"
        }
      }
    }
  },
  "protectDestroy": {
    "15": {
      "id": 2500,
      "labelSrc": "images/autoEnchant/autoEnchant_starForce_button_protectDestroy15_button_normal_0.png"
    },
    "16": {
      "id": 2501,
      "labelSrc": "images/autoEnchant/autoEnchant_starForce_button_protectDestroy16_button_normal_0.png"
    },
    "17": {
      "id": 2502,
      "labelSrc": "images/autoEnchant/autoEnchant_starForce_button_protectDestroy17_button_normal_0.png"
    }
  },
  "progressAlert": [
    {
      "i": 0,
      "delay": 300,
      "src": "images/autoEnchant/autoEnchant_starForce_progressAlert_0.png"
    },
    {
      "i": 1,
      "delay": 300,
      "src": "images/autoEnchant/autoEnchant_starForce_progressAlert_1.png"
    },
    {
      "i": 2,
      "delay": 300,
      "src": "images/autoEnchant/autoEnchant_starForce_progressAlert_2.png"
    },
    {
      "i": 3,
      "delay": 300,
      "src": "images/autoEnchant/autoEnchant_starForce_progressAlert_3.png"
    }
  ]
};



const AUTO_ENCHANT_POTENTIAL = {
  "backgrnd": "images/autoEnchant/autoEnchant_potential_backgrnd.png",
  "sectionLT": {
    "x": 10,
    "y": 32
  },
  "sectionRB": {
    "x": 280,
    "y": 540
  },
  "progressAlertOffset": {
    "x": 0,
    "y": 8
  },
  "subWndMargin": {
    "x": 1,
    "y": 0
  },
  "potentialView": {
    "backgrnd": "images/autoEnchant/autoEnchant_potential_potentialView_backgrnd.png",
    "combos": {
      "opt1": {
        "id": 2000,
        "lt": {
          "x": 75,
          "y": 12
        },
        "rb": {
          "x": 255,
          "y": 38
        }
      },
      "opt2": {
        "id": 2001,
        "lt": {
          "x": 75,
          "y": 43
        },
        "rb": {
          "x": 255,
          "y": 69
        }
      },
      "opt3": {
        "id": 2002,
        "lt": {
          "x": 75,
          "y": 74
        },
        "rb": {
          "x": 255,
          "y": 100
        }
      }
    },
    "reset": {
      "id": null,
      "toolTip": null,
      "toolTipDisabled": null,
      "states": {
        "normal": {
          "origin": {
            "x": -9,
            "y": -78
          },
          "src": "images/autoEnchant/autoEnchant_potential_potentialView_button_reset_normal_0.png"
        }
      }
    },
    "titles": {
      "title1": {
        "origin": {
          "x": -26,
          "y": -33
        },
        "src": "images/autoEnchant/autoEnchant_potential_potentialView_layer_title1.png"
      },
      "title2": {
        "origin": {
          "x": -25,
          "y": -33
        },
        "src": "images/autoEnchant/autoEnchant_potential_potentialView_layer_title2.png"
      },
      "title3": {
        "origin": {
          "x": -25,
          "y": -33
        },
        "src": "images/autoEnchant/autoEnchant_potential_potentialView_layer_title3.png"
      },
      "title4": {
        "origin": {
          "x": -24,
          "y": -33
        },
        "src": "images/autoEnchant/autoEnchant_potential_potentialView_layer_title4.png"
      }
    }
  },
  "buttons": {
    "ok": {
      "id": null,
      "toolTip": null,
      "toolTipDisabled": null,
      "states": {
        "normal": {
          "origin": {
            "x": -102,
            "y": -527
          },
          "src": "images/autoEnchant/autoEnchant_starForce_button_OK_normal_0.png"
        }
      }
    },
    "cancel": {
      "id": null,
      "toolTip": null,
      "toolTipDisabled": null,
      "states": {
        "normal": {
          "origin": {
            "x": -102,
            "y": -527
          },
          "src": "images/autoEnchant/autoEnchant_starForce_button_Cancel_normal_0.png"
        }
      }
    }
  },
  "stopAttackPower": {
    "id": null,
    "labelSrc": "images/autoEnchant/autoEnchant_potential_button_stopAttackPower_button_normal_0.png",
    "checkedSrc": "images/starforce/starForce.button_protectDestroy.checkedAndDisabled.png",
    "uncheckedSrc": "images/starforce/starForce.button_protectDestroy.unchecked.png"
  },
  "progressAlert": [
    {
      "i": 0,
      "delay": 300,
      "src": "images/autoEnchant/fullScreen_potential.progressAlert.0.png"
    },
    {
      "i": 1,
      "delay": 300,
      "src": "images/autoEnchant/fullScreen_potential.progressAlert.1.png"
    },
    {
      "i": 2,
      "delay": 300,
      "src": "images/autoEnchant/fullScreen_potential.progressAlert.2.png"
    },
    {
      "i": 3,
      "delay": 300,
      "src": "images/autoEnchant/fullScreen_potential.progressAlert.3.png"
    }
  ]
};

const AUTO_ENCHANT_ADD_POTENTIAL = {
  "backgrnd": "images/autoEnchant/autoEnchant_potential_backgrnd.png",
  "sectionLT": {
    "x": 10,
    "y": 32
  },
  "sectionRB": {
    "x": 280,
    "y": 540
  },
  "progressAlertOffset": {
    "x": 0,
    "y": 8
  },
  "subWndMargin": {
    "x": 1,
    "y": 0
  },
  "potentialView": {
    "backgrnd": "images/autoEnchant/autoEnchant_potential_potentialView_backgrnd.png",
    "combos": {
      "opt1": {
        "id": 2000,
        "lt": {
          "x": 75,
          "y": 12
        },
        "rb": {
          "x": 255,
          "y": 38
        }
      },
      "opt2": {
        "id": 2001,
        "lt": {
          "x": 75,
          "y": 43
        },
        "rb": {
          "x": 255,
          "y": 69
        }
      },
      "opt3": {
        "id": 2002,
        "lt": {
          "x": 75,
          "y": 74
        },
        "rb": {
          "x": 255,
          "y": 100
        }
      }
    },
    "reset": {
      "id": null,
      "toolTip": null,
      "toolTipDisabled": null,
      "states": {
        "normal": {
          "origin": {
            "x": -9,
            "y": -78
          },
          "src": "images/autoEnchant/autoEnchant_potential_potentialView_button_reset_normal_0.png"
        }
      }
    },
    "titles": {
      "title1": {
        "origin": {
          "x": -26,
          "y": -33
        },
        "src": "images/autoEnchant/autoEnchant_potential_potentialView_layer_title1.png"
      },
      "title2": {
        "origin": {
          "x": -25,
          "y": -33
        },
        "src": "images/autoEnchant/autoEnchant_potential_potentialView_layer_title2.png"
      },
      "title3": {
        "origin": {
          "x": -25,
          "y": -33
        },
        "src": "images/autoEnchant/autoEnchant_potential_potentialView_layer_title3.png"
      },
      "title4": {
        "origin": {
          "x": -24,
          "y": -33
        },
        "src": "images/autoEnchant/autoEnchant_potential_potentialView_layer_title4.png"
      }
    }
  },
  "buttons": {
    "ok": {
      "id": null,
      "toolTip": null,
      "toolTipDisabled": null,
      "states": {
        "normal": {
          "origin": {
            "x": -102,
            "y": -527
          },
          "src": "images/autoEnchant/autoEnchant_starForce_button_OK_normal_0.png"
        }
      }
    },
    "cancel": {
      "id": null,
      "toolTip": null,
      "toolTipDisabled": null,
      "states": {
        "normal": {
          "origin": {
            "x": -102,
            "y": -527
          },
          "src": "images/autoEnchant/autoEnchant_starForce_button_Cancel_normal_0.png"
        }
      }
    }
  },
  "stopAttackPower": {
    "id": null,
    "labelSrc": "images/autoEnchant/autoEnchant_potential_button_stopAttackPower_button_normal_0.png",
    "checkedSrc": "images/starforce/starForce.button_protectDestroy.checkedAndDisabled.png",
    "uncheckedSrc": "images/starforce/starForce.button_protectDestroy.unchecked.png"
  },
  "progressAlert": [
    {
      "i": 0,
      "delay": 300,
      "src": "images/autoEnchant/fullScreen_potential.progressAlert.0.png"
    },
    {
      "i": 1,
      "delay": 300,
      "src": "images/autoEnchant/fullScreen_potential.progressAlert.1.png"
    },
    {
      "i": 2,
      "delay": 300,
      "src": "images/autoEnchant/fullScreen_potential.progressAlert.2.png"
    },
    {
      "i": 3,
      "delay": 300,
      "src": "images/autoEnchant/fullScreen_potential.progressAlert.3.png"
    }
  ]
};

const AUTO_ENCHANT_COMMON_BUTTON = {
  "id": null,
  "toolTip": null,
  "toolTipDisabled": null,
  "states": {
    "normal": {
      "origin": {
        "x": -337,
        "y": -677
      },
      "src": "images/autoEnchant/autoEnchant_common_commonButton_button_autoEnchant_button_normal_0.png"
    }
  }
};



function autoEnchantAssetPath(relativePath) {
  if (!relativePath) return null;
  const resolved = autoEnchantFlatPath(relativePath);
  if (resolved) return resolved;
  if (/^images\//.test(relativePath)) return relativePath;
  return AUTO_ENCHANT_IMAGE_BASE + relativePath;
}

const AUTO_ENCHANT_BONUS_STAT = {
  backgrnd: 'images/autoEnchant/autoEnchant_bonusStat_backgrnd.png',
  sectionLT: { x: 10, y: 32 },
  sectionRB: { x: 280, y: 178 },
  progressAlertOffset: { x: 0, y: 0 },
  subWndMargin: { x: 1, y: 0 },
  bonusStatView: {
    backgrnd: 'images/autoEnchant/autoEnchant_bonusStat_bonusStatView_backgrnd.png',
    reset: {
      states: {
        normal: {
          src: 'images/autoEnchant/autoEnchant_potential_potentialView_button_reset_normal_0.png',
        },
      },
    },
  },
  dropdownButton: {
    normal: 'images/autoEnchant/autoenchant_bonusStat_dropdownlist_button_normal.png',
    mouseOver: 'images/autoEnchant/autoenchant_bonusStat_dropdownlist_button_mouseOver.png',
    pressed: 'images/autoEnchant/autoenchant_bonusStat_dropdownlist_button_press.png',
  },
  buttons: {
    ok: {
      toolTip: '將連續進行自動重設至目標追加屬性。',
      toolTipDisabled: '無法進行自動重設。請確認目標追加屬性，或確認強化貨幣是否未選擇或不足。',
      states: {
        normal: { src: 'images/autoEnchant/autoEnchant_starForce_button_OK_normal_0.png' },
      },
    },
    cancel: {
      toolTip: '點擊SPACE、ESC鍵，即可中止自動重新設定。',
      states: {
        normal: { src: 'images/autoEnchant/autoEnchant_starForce_button_Cancel_normal_0.png' },
      },
    },
  },
  stopAttackPower: {
    labelSrc: 'images/autoEnchant/autoEnchant_potential_button_stopAttackPower_button_normal_0.png',
    checkedSrc: 'images/starforce/starForce.button_protectDestroy.checkedAndDisabled.png',
    uncheckedSrc: 'images/starforce/starForce.button_protectDestroy.unchecked.png',
  },
  progressAlert: [
    { i: 0, delay: 300, src: 'images/autoEnchant/autoEnchant_bonusStat_progressAlert_0.png' },
    { i: 1, delay: 300, src: 'images/autoEnchant/autoEnchant_bonusStat_progressAlert_1.png' },
    { i: 2, delay: 300, src: 'images/autoEnchant/autoEnchant_bonusStat_progressAlert_2.png' },
    { i: 3, delay: 300, src: 'images/autoEnchant/autoEnchant_bonusStat_progressAlert_3.png' },
  ],
};

function autoEnchantFlatPath(relativePath) {
  if (!relativePath) return null;
  if (/^images\/autoEnchant\/autoEnchant_/.test(relativePath)) return relativePath;
  if (/^images\/autoEnchant\/autoenchant_/.test(relativePath)) return relativePath;
  if (/^images\/autoEnchant\/fullScreen_potential\.progressAlert\.\d+\.png$/.test(relativePath)) {
    return relativePath;
  }

  const legacyPotential = relativePath.match(
    /^images\/autoEnchant\/autoEnchant_fullScreen_potential_progressAlert_(\d+)\.png$/
  );
  if (legacyPotential) {
    return `${AUTO_ENCHANT_IMAGE_BASE}fullScreen_potential.progressAlert.${legacyPotential[1]}.png`;
  }

  const legacyAddPotential = relativePath.match(
    /^images\/autoEnchant\/autoEnchant_fullScreen_additionalPotential_progressAlert_(\d+)\.png$/
  );
  if (legacyAddPotential) {
    return `${AUTO_ENCHANT_IMAGE_BASE}fullScreen_potential.progressAlert.${legacyAddPotential[1]}.png`;
  }

  const autoMatch = relativePath.match(/^images\/autoEnchant\/(.+)$/);
  if (autoMatch) {
    const tail = autoMatch[1].replace(/[/:]/g, '_');
    return `${AUTO_ENCHANT_IMAGE_BASE}autoEnchant_${tail}`;
  }

  const progressMatch = relativePath.match(
    /^images\/fullScreen_(potential|additionalPotential|bonusStat)\/progressAlert\/(\d+)\.png$/
  );
  if (progressMatch) {
    const [, kind, frame] = progressMatch;
    if (kind === 'potential' || kind === 'additionalPotential') {
      return `${AUTO_ENCHANT_IMAGE_BASE}fullScreen_potential.progressAlert.${frame}.png`;
    }
    if (kind === 'bonusStat') {
      return `images/fullScreenbonusStat/fullScreen_bonusStat_progressAlert_${frame}.png`;
    }
    return `${AUTO_ENCHANT_IMAGE_BASE}autoEnchant_starForce_progressAlert_${frame}.png`;
  }

  if (/BattleSimulationReplay/.test(relativePath)) {
    return /checked/.test(relativePath)
      ? 'images/starforce/starForce.button_protectDestroy.checkedAndDisabled.png'
      : 'images/starforce/starForce.button_protectDestroy.unchecked.png';
  }

  return relativePath;
}

function autoEnchantButtonSrc(relativePath, state = 'normal') {
  const flat = autoEnchantFlatPath(relativePath);
  if (!flat || state === 'normal') return flat;
  if (state === 'disabled') {
    return flat.replace(/_normal_/, '_disabled_');
  }
  if (state === 'mouseOver') {
    return flat.replace(/_normal_/, '_mouseOver_');
  }
  if (state === 'pressed') {
    return flat.replace(/_normal_/, '_pressed_');
  }
  return flat;
}

const AUTO_ENCHANT_NATIVE_SIZE = {
  starForce: { panel: { w: 290, h: 231 } },
  potential: {
    panel: { w: 290, h: 559 },
    view: { w: 270, h: 113 },
    combo: { w: 180, h: 26 },
    reset: { w: 56, h: 24 },
    stopLabel: { w: 270, h: 22 },
    stopCheck: { w: 25, h: 13 },
    stopCheckChecked: { w: 23, h: 11 },
    ok: { w: 86, h: 24 },
    cancel: { w: 86, h: 24 },
    progress: { w: 353, h: 48 },
    titles: {
      title1: { w: 23, h: 30 },
      title2: { w: 25, h: 31 },
      title3: { w: 25, h: 31 },
      title4: { w: 27, h: 30 },
    },
    rows: [
      { top: 38 },
      { top: 150 },
      { top: 262 },
      { top: 374 },
    ],
  },
  bonusStat: {
    panel: { w: 290, h: 242 },
    view: { w: 270, h: 144 },
    combo: { w: 190, h: 32 },
    value: { w: 45, h: 24 },
    valueRowGap: 7,
    reset: { w: 56, h: 24 },
    stopLabel: { w: 270, h: 22 },
    stopCheck: { w: 25, h: 13 },
    stopCheckChecked: { w: 23, h: 11 },
    ok: { w: 86, h: 24 },
    cancel: { w: 86, h: 24 },
    progress: { w: 353, h: 48 },
    rows: [
      { top: 38 },
      { top: 69 },
      { top: 100 },
      { top: 131 },
    ],
  },
  starForceButtons: {
    up: { w: 21, h: 22 },
    down: { w: 21, h: 22 },
    all: { w: 39, h: 22 },
    ok: { w: 86, h: 24 },
    cancel: { w: 86, h: 24 },
    protect: { w: 79, h: 23 },
    progress: { w: 353, h: 48 },
  },
};


// @manual-auto-enchant-logic — parse-auto-enchant.mjs 會保留此行之後的內容

function applyAutoEnchantImage(el, relativePath, state = 'normal', width, height) {
  if (!el) return;
  const src = autoEnchantButtonSrc(relativePath, state);
  if (!src) return;
  if (width) el.style.width = `${width}px`;
  if (height) el.style.height = `${height}px`;
  el.style.backgroundColor = 'transparent';
  el.style.backgroundImage = `url('${src}')`;
  el.style.backgroundRepeat = 'no-repeat';
  el.style.backgroundPosition = '0 0';
  el.style.backgroundSize = width && height ? `${width}px ${height}px` : 'auto';
}

/** 附加能力自動重設下拉按鈕（素材檔名非 _normal_0 格式） */
function applyAeBsDropdownButton(el, state = 'normal', width, height) {
  if (!el) return;
  const cfg = AUTO_ENCHANT_BONUS_STAT?.dropdownButton;
  if (!cfg) return;
  const key = state === 'mouseOver' ? 'mouseOver' : (state === 'pressed' ? 'pressed' : 'normal');
  const src = cfg[key];
  if (!src) return;
  if (width) el.style.width = `${width}px`;
  if (height) el.style.height = `${height}px`;
  el.style.backgroundColor = 'transparent';
  el.style.backgroundImage = `url('${src}')`;
  el.style.backgroundRepeat = 'no-repeat';
  el.style.backgroundPosition = '0 0';
  el.style.backgroundSize = width && height ? `${width}px ${height}px` : 'auto';
  el.style.imageRendering = 'pixelated';
}

function bindAeBsDropdownInteractions(wrapEl, triggerEl, w, h) {
  if (!wrapEl || !triggerEl || triggerEl.dataset.aeBsComboBound) return;
  triggerEl.dataset.aeBsComboBound = '1';

  const paint = (visualState) => {
    const disabled = Boolean(triggerEl.disabled);
    applyAeBsDropdownButton(wrapEl, disabled ? 'normal' : visualState, w, h);
    wrapEl.style.opacity = disabled ? '0.55' : '1';
  };

  paint('normal');

  triggerEl.addEventListener('mouseenter', () => {
    if (triggerEl.disabled || wrapEl.classList.contains('is-open')) return;
    paint('mouseOver');
  });
  triggerEl.addEventListener('mouseleave', () => {
    if (wrapEl.classList.contains('is-open')) return;
    paint('normal');
  });
  triggerEl.addEventListener('mousedown', (event) => {
    if (event.button !== 0 || triggerEl.disabled) return;
    paint('pressed');
  });
  triggerEl.addEventListener('mouseup', () => {
    if (triggerEl.disabled) return;
    if (wrapEl.classList.contains('is-open')) {
      paint('pressed');
      return;
    }
    paint(triggerEl.matches(':hover') ? 'mouseOver' : 'normal');
  });
  triggerEl.addEventListener('blur', () => {
    if (!wrapEl.classList.contains('is-open')) paint('normal');
  });

  triggerEl._aeBsComboPaint = paint;
}

/** 超速模式切換指示：固定 25×13 槽位，checked/unchecked 各用原生像素尺寸 */
function applyAutoEnchantOverspeedCheck(el, relativePath, isChecked, NS = AUTO_ENCHANT_NATIVE_SIZE.potential) {
  if (!el) return;
  const src = autoEnchantAssetPath(relativePath);
  if (!src) return;

  const slotW = NS.stopCheck.w;
  const slotH = NS.stopCheck.h;
  const size = isChecked ? NS.stopCheckChecked : NS.stopCheck;

  el.style.width = `${slotW}px`;
  el.style.height = `${slotH}px`;
  el.style.backgroundColor = 'transparent';
  el.style.backgroundImage = `url('${src}')`;
  el.style.backgroundRepeat = 'no-repeat';
  el.style.backgroundSize = `${size.w}px ${size.h}px`;
  el.style.backgroundPosition = `${slotW - size.w}px ${Math.round((slotH - size.h) / 2)}px`;
  el.style.imageRendering = 'pixelated';
}

/**
 * 綁定 autoEnchant 按鈕 normal / mouseOver / pressed 視覺。
 * 素材由 normal 路徑推導：*_normal_* → *_mouseOver_* / *_pressed_*
 */
function bindAutoEnchantButtonInteractions(el, getPaintArgs) {
  if (!el || el.dataset.aeBtnBound) return;
  el.dataset.aeBtnBound = '1';

  const paint = (visualState) => {
    const args = getPaintArgs();
    if (!args?.relativePath) return;
    const effectiveState = args.disabled ? 'disabled' : (visualState || 'normal');
    applyAutoEnchantImage(el, args.relativePath, effectiveState, args.w, args.h);
  };

  el.addEventListener('mouseenter', () => {
    const args = getPaintArgs();
    if (!args || args.disabled) return;
    paint('mouseOver');
  });
  el.addEventListener('mouseleave', () => paint('normal'));
  el.addEventListener('mousedown', (event) => {
    if (event.button !== 0) return;
    const args = getPaintArgs();
    if (!args || args.disabled) return;
    paint('pressed');
  });
  el.addEventListener('mouseup', () => {
    const args = getPaintArgs();
    if (!args || args.disabled) return;
    paint(el.matches(':hover') ? 'mouseOver' : 'normal');
  });

  el._aePaint = paint;
}

function setAutoEnchantImgSrc(imgEl, relativePath) {
  if (!imgEl) return;
  const src = autoEnchantAssetPath(relativePath);
  if (!src) return;
  imgEl.src = src;
  imgEl.removeAttribute('width');
  imgEl.removeAttribute('height');
}

/** 自動重設下拉：共用 stat 顯示順序 */
const AE_POT_COMMON_STAT_ORDER = ['STR%', 'DEX%', 'INT%', 'LUK%', '全屬性%', '最大HP%', '最大MP%'];

/** 單一主屬 % 池：設定 STR/DEX/INT/LUK 時，洗潛的全屬性% 也計入（同組另有全屬目標除外） */
const AE_POT_MAIN_ATTR_STATS = new Set(['STR%', 'DEX%', 'INT%', 'LUK%']);
const AE_POT_ALL_ATTR_STAT = '全屬性%';

const AE_POT_GENERIC_SCOPES = new Set(['防具專用', '武器專用', '飾品專用']);

function aePotPercentPoolKey(statRaw) {
  if (AE_POT_MAIN_ATTR_STATS.has(statRaw)) return statRaw;
  if (statRaw === AE_POT_ALL_ATTR_STAT) return 'allAttr';
  return statRaw;
}

function aePotLineCountsForPool(line, poolKey, hasAllAttrTarget) {
  const lineStat = aePotLineStatRaw(line);
  if (poolKey === 'allAttr') {
    return lineStat === AE_POT_ALL_ATTR_STAT;
  }
  if (AE_POT_MAIN_ATTR_STATS.has(poolKey)) {
    if (lineStat === poolKey) return true;
    // 同組另有全屬性目標時，全屬性% 只計全屬池，不計入主屬
    if (lineStat === AE_POT_ALL_ATTR_STAT && !hasAllAttrTarget) return true;
    return false;
  }
  return aePotPoolKeyMatchesLine(line, poolKey);
}

function aePotRanksForLine(lineIndex) {
  return lineIndex === 0 ? ['legendary'] : ['legendary', 'unique'];
}

function aePotIsCommonStat(statRaw) {
  return AE_POT_COMMON_STAT_ORDER.includes(statRaw);
}

/** 部位限定潛能：如 手套專用、帽子專用 */
function aePotIsSlotScoped(scope) {
  if (!scope || !scope.endsWith('專用')) return false;
  return !AE_POT_GENERIC_SCOPES.has(scope);
}

const AE_POT_FLAT_STAT_RAW = new Set([
  'STR', 'DEX', 'INT', 'LUK',
  '物理攻擊力', '魔法攻擊力', '攻擊力',
  '最大HP', '最大MP', '防禦力', '移動速度', '跳躍力', '全屬性',
]);

function aePotIsFlatValueStatRow(row) {
  const statRaw = row?.statRaw || '';
  if (!statRaw) return false;
  // 百分比詞條（含 物理攻擊力+13% 這類內嵌寫法）不算固定數值
  if (statRaw.endsWith('%') || /\+\d+(?:\.\d+)?%$/.test(statRaw)) return false;
  if ((row?.value || '').endsWith('%')) return false;

  // 一般寫法：statRaw 本身即固定屬性名（物理攻擊力、STR…）
  if (AE_POT_FLAT_STAT_RAW.has(statRaw)) return true;

  // 能源／徽章等：statRaw 內嵌固定數值（物理攻擊力+32、STR+13）
  const embeddedFlat = String(statRaw).match(/^(.+?)\+(\d+(?:\.\d+)?)$/);
  if (embeddedFlat && AE_POT_FLAT_STAT_RAW.has(embeddedFlat[1])) return true;

  // 已解析列：label 為固定屬性且 value 為純數字
  const label = row?.label || '';
  const value = String(row?.value ?? '');
  if (AE_POT_FLAT_STAT_RAW.has(label) && /^\d+(?:\.\d+)?$/.test(value)) return true;

  return false;
}

function aePotIsWeaponScoped(scope, item) {
  const isWeaponLike = typeof isWeaponPotentialEquip === 'function'
    ? isWeaponPotentialEquip(item)
    : item?.mainType === EQUIP_TYPE.WEAPON;
  return isWeaponLike
    && (scope === '武器專用' || scope === '只有武器可以');
}

function aePotWeaponStatSortIndex(row, originalIndex) {
  const statRaw = row.statRaw || '';
  if (statRaw === '物理攻擊力%') return 0;
  if (statRaw === '魔法攻擊力%') return 1;
  if (statRaw.includes('攻擊BOSS怪物時傷害增加')) return 2;
  if (statRaw.includes('無視怪物防禦力')) return 3;
  return 100 + originalIndex;
}

function aePotRowAllowed(row, item) {
  if (aePotIsFlatValueStatRow(row)) return false;
  if (aePotIsCommonStat(row.statRaw)) return true;
  if (aePotIsSlotScoped(row.scope)) return true;
  if (aePotIsWeaponScoped(row.scope, item)) return true;
  return false;
}

function aePotSortRows(rows, item = null) {
  const common = [];
  const weapon = [];
  const slot = [];

  rows.forEach((row, index) => {
    if (aePotIsCommonStat(row.statRaw)) {
      common.push({ row, index });
      return;
    }
    if (aePotIsWeaponScoped(row.scope, item)) {
      weapon.push({ row, index });
      return;
    }
    if (aePotIsSlotScoped(row.scope)) {
      slot.push({ row, index });
    }
  });

  common.sort(
    (a, b) => AE_POT_COMMON_STAT_ORDER.indexOf(a.row.statRaw) - AE_POT_COMMON_STAT_ORDER.indexOf(b.row.statRaw)
  );
  weapon.sort(
    (a, b) => aePotWeaponStatSortIndex(a.row, a.index) - aePotWeaponStatSortIndex(b.row, b.index)
  );

  const commonRows = common.map(({ row }) => row);
  const weaponRows = weapon.map(({ row }) => row);
  const slotRows = slot.map(({ row }) => row);

  if (typeof isWeaponPotentialEquip === 'function'
    ? isWeaponPotentialEquip(item)
    : item?.mainType === EQUIP_TYPE.WEAPON) {
    return weaponRows.concat(commonRows).concat(slotRows);
  }

  return commonRows.concat(weaponRows).concat(slotRows);
}

/**
 * 建立自動重設潛能下拉選項。
 * 第一排僅傳說；第二、三排先傳說再罕見。
 * 順序：武器專用（物攻%/魔攻% → BOSS → 無視防）→ 共用主屬% → 部位限定。
 */
function buildAutoEnchantStatOptions(inspectData, lineIndex, item = null) {
  if (!inspectData?.sections?.length) return [];

  const ranks = aePotRanksForLine(lineIndex);
  const seen = new Set();
  const options = [];

  ranks.forEach((officialRank) => {
    const section = inspectData.sections.find((s) => s.officialRank === officialRank);
    if (!section) return;

    const filtered = section.rows.filter((row) => aePotRowAllowed(row, item));
    aePotSortRows(filtered, item).forEach((row) => {
      const statRaw = row.statRaw || row.label;
      if (!statRaw) return;
      const pct = aePotParsePercentValue(row.value);
      const variant = pct == null ? aePotExtractLineVariant(row) : null;
      const key = aePotBuildTargetKey(officialRank, statRaw, pct, variant);
      if (seen.has(key)) return;
      seen.add(key);
      options.push({ key, label: row.display || row.label });
    });
  });

  return options;
}

function aePotParsePercentValue(value) {
  if (value == null || value === '') return null;
  const m = String(value).match(/^(\d+(?:\.\d+)?)%$/);
  return m ? Number(m[1]) : null;
}

/** 同一 statRaw 對應多種結果時提取變體（如冷卻 -2/-1、MP -17%/-35%、無視 20%/40%） */
function aePotExtractLineVariant(line) {
  const label = line?.label || '';
  const value = line?.value ?? '';

  let m = label.match(/-(\d+(?:\.\d+)?)秒?$/);
  if (m && value === '') return Number(m[1]);

  m = String(value).match(/^-(\d+(?:\.\d+)?)%$/);
  if (m) return Number(m[1]);

  m = label.match(/無視 (\d+(?:\.\d+)?)% 傷害/);
  if (m) return Number(m[1]);

  return null;
}

function aePotBuildTargetKey(officialRank, statRaw, pct, variant) {
  if (pct != null) return `${officialRank}:${statRaw}:${pct}`;
  if (variant != null) return `${officialRank}:${statRaw}:v${variant}`;
  return `${officialRank}:${statRaw}`;
}

function aePotParseTargetKey(targetKey) {
  if (!targetKey) return { officialRank: null, statRaw: '', pct: null, variant: null };

  const parts = targetKey.split(':');
  if (parts.length === 1) {
    return { officialRank: null, statRaw: parts[0], pct: null, variant: null };
  }

  const officialRank = parts[0];
  const last = parts[parts.length - 1];
  const variantMatch = /^v(\d+(?:\.\d+)?)$/.exec(last);
  if (parts.length >= 3 && variantMatch) {
    return {
      officialRank,
      statRaw: parts.slice(1, -1).join(':'),
      pct: null,
      variant: Number(variantMatch[1])
    };
  }

  const lastNum = Number(last);
  if (parts.length >= 3 && !Number.isNaN(lastNum) && String(lastNum) === last) {
    return {
      officialRank,
      statRaw: parts.slice(1, -1).join(':'),
      pct: lastNum,
      variant: null
    };
  }

  return {
    officialRank,
    statRaw: parts.slice(1).join(':'),
    pct: null,
    variant: null
  };
}

function aePotEmbeddedStatBase(statRaw) {
  const match = String(statRaw || '').match(/^(.+?)\+\d+(?:\.\d+)?%$/);
  return match ? match[1] : statRaw;
}

/** 顯示用 label 對應到與下拉 key 相同的 statRaw（百分比詞條） */
const AE_POT_LABEL_TO_PERCENT_STAT = {
  物理攻擊力: '物理攻擊力%',
  魔法攻擊力: '魔法攻擊力%',
  防禦力: '防禦力%',
  爆擊傷害: '爆擊傷害%',
  楓幣獲得量: '楓幣獲得量%',
  道具掉落率: '道具掉落率%',
  總傷害: '總傷害%',
  爆擊機率: '爆擊機率%',
};

function aePotCompactStatText(text) {
  return String(text || '').replace(/\s+/g, '');
}

function aePotLineHasPercentValue(line) {
  return (line?.value || '').endsWith('%');
}

function aePotTargetExpectsPercent(statRaw) {
  if (!statRaw) return false;
  if (statRaw.endsWith('%')) return true;
  return /\+\d+(?:\.\d+)?%$/.test(statRaw);
}

function aePotCanonicalStatBase(statRawOrLineStat) {
  let stat = String(statRawOrLineStat || '');
  if (stat === POTENTIAL_BOSS_DAMAGE_LABEL
    || (typeof POTENTIAL_BOSS_DAMAGE_OLD_DISPLAY_LABEL !== 'undefined'
      && stat === POTENTIAL_BOSS_DAMAGE_OLD_DISPLAY_LABEL)
    || stat === POTENTIAL_BOSS_DAMAGE_LEGACY_LABEL
    || stat === POTENTIAL_BOSS_DAMAGE_SOURCE_LABEL) {
    return POTENTIAL_BOSS_DAMAGE_SOURCE_LABEL;
  }
  const embedded = aePotEmbeddedStatBase(stat);
  if (embedded !== stat) return embedded;
  return aePotEmbeddedStatBase(stat.replace(/%$/, ''));
}

/** 洗出詞條的顯示 label 是否對應下拉選的 statRaw（實用技能、無視傷害等） */
function aePotStatDisplayMatchesTarget(line, targetStatRaw) {
  if (!targetStatRaw) return true;

  const label = line?.label || '';
  if (!label) return false;
  if (label === targetStatRaw) return true;
  if (label.startsWith(targetStatRaw)) return true;

  const compactLabel = aePotCompactStatText(label);
  const compactTarget = aePotCompactStatText(targetStatRaw);
  if (compactLabel === compactTarget) return true;
  if (compactLabel.includes(compactTarget)) return true;

  if (targetStatRaw === '被擊中時有一定機率無視傷害' && /無視.*%.*傷害/.test(label)) {
    return true;
  }
  if (targetStatRaw.startsWith('減少所有技能冷卻時間')
    && (label.startsWith('所有技能冷卻時間') || label.includes('冷卻時間'))) {
    return true;
  }
  if (targetStatRaw.startsWith('無視怪物防禦力')
    && (label.includes('無視') && label.includes('防禦'))) {
    return true;
  }
  if (targetStatRaw.startsWith('攻擊BOSS怪物時傷害增加')
    && (label === POTENTIAL_BOSS_DAMAGE_LABEL
      || (typeof POTENTIAL_BOSS_DAMAGE_OLD_DISPLAY_LABEL !== 'undefined'
        && label === POTENTIAL_BOSS_DAMAGE_OLD_DISPLAY_LABEL)
      || label === POTENTIAL_BOSS_DAMAGE_LEGACY_LABEL
      || label === POTENTIAL_BOSS_DAMAGE_SOURCE_LABEL
      || label.includes('BOSS')
      || label.includes('Boss'))) {
    return true;
  }
  const atkProcMatch = targetStatRaw.match(/^攻擊時有一定的機率(.+)$/);
  if (atkProcMatch && label.startsWith('攻擊時有') && label.includes(atkProcMatch[1])) {
    return true;
  }
  if (targetStatRaw === '被擊中時有一定機率在時間內無敵'
    && label.startsWith('被擊中時有') && label.includes('無敵')) {
    return true;
  }
  return false;
}

function aePotLineStatRaw(line) {
  if (line?.statRaw) return line.statRaw;

  const label = line?.label || '';
  if (label === POTENTIAL_BOSS_DAMAGE_LABEL
    || (typeof POTENTIAL_BOSS_DAMAGE_OLD_DISPLAY_LABEL !== 'undefined'
      && label === POTENTIAL_BOSS_DAMAGE_OLD_DISPLAY_LABEL)
    || label === POTENTIAL_BOSS_DAMAGE_LEGACY_LABEL
    || label === POTENTIAL_BOSS_DAMAGE_SOURCE_LABEL) {
    return POTENTIAL_BOSS_DAMAGE_SOURCE_LABEL;
  }
  if ((line?.value || '').endsWith('%')) {
    if (label === 'MaxHP') return '最大HP%';
    if (label === 'MaxMP') return '最大MP%';
    if (['STR', 'DEX', 'INT', 'LUK'].includes(label)) return `${label}%`;
    if (label === '全屬性') return '全屬性%';
    if (AE_POT_LABEL_TO_PERCENT_STAT[label]) return AE_POT_LABEL_TO_PERCENT_STAT[label];
  }
  if (label.endsWith('%')) return label;
  return label;
}

function aePotStatRawMatches(line, statRaw) {
  const lineStat = aePotLineStatRaw(line);
  if (lineStat === statRaw) return true;

  const lineBase = aePotCanonicalStatBase(lineStat);
  const targetBase = aePotCanonicalStatBase(statRaw);
  if (lineBase === targetBase) {
    if (aePotTargetExpectsPercent(statRaw)) {
      return aePotLineHasPercentValue(line) || lineStat.endsWith('%');
    }
    return !aePotLineHasPercentValue(line);
  }

  if (aePotStatDisplayMatchesTarget(line, statRaw)) {
    if (aePotTargetExpectsPercent(statRaw)) {
      return aePotLineHasPercentValue(line);
    }
    return true;
  }

  return false;
}

function aePotPoolKeyMatchesLine(line, poolKey) {
  const lineStat = aePotLineStatRaw(line);
  if (lineStat === poolKey) return true;

  const lineBase = aePotCanonicalStatBase(lineStat);
  const poolBase = aePotCanonicalStatBase(poolKey);
  if (lineBase === poolBase) {
    if (aePotTargetExpectsPercent(poolKey)) {
      return aePotLineHasPercentValue(line) || lineStat.endsWith('%');
    }
    return true;
  }

  return aePotStatDisplayMatchesTarget(line, poolKey);
}

function aePotLineMatchesTargetSpec(line, parsed, matchOptions = {}) {
  if (!parsed?.statRaw) return false;

  if (!matchOptions.ignoreRank) {
    const internalRank = parsed.officialRank && typeof OFFICIAL_TO_INTERNAL_RANK !== 'undefined'
      ? (OFFICIAL_TO_INTERNAL_RANK[parsed.officialRank] || parsed.officialRank)
      : null;
    if (internalRank && line.rank !== internalRank) return false;
  }

  if (!aePotStatRawMatches(line, parsed.statRaw)) return false;

  if (parsed.pct != null) {
    return aePotParsePercentValue(line.value) === parsed.pct;
  }
  if (parsed.variant != null) {
    return aePotExtractLineVariant(line) === parsed.variant;
  }
  return true;
}

/**
 * 結合方塊等「指定排」自動重設：第 N 排目標只與洗出的第 N 排比對（不跨排加總、不共用同一詞條）。
 */
function aePotLineIndexGroupMatches(potential, group) {
  const lines = potential?.lines || [];
  let hasTarget = false;

  for (let lineIndex = 0; lineIndex < group.length; lineIndex += 1) {
    const targetKey = group[lineIndex];
    if (!targetKey) continue;

    hasTarget = true;
    const line = lines[lineIndex];
    if (!line || !aePotLineMatchesTarget(line, targetKey)) {
      return false;
    }
  }

  return hasTarget;
}

function aePotLineMatchesTarget(line, targetKey, matchOptions = {}) {
  if (!targetKey) return true;
  return aePotLineMatchesTargetSpec(line, aePotParseTargetKey(targetKey), matchOptions);
}

function aePotSumPoolPercent(lines, poolKey, hasAllAttrTarget) {
  let sum = 0;
  lines.forEach((line) => {
    if (!aePotLineCountsForPool(line, poolKey, hasAllAttrTarget)) return;
    const pct = aePotParsePercentValue(line.value);
    if (pct != null) sum += pct;
  });
  return sum;
}

function aePotFlexiblePercentMatch(lines, targets, poolKey, hasAllAttrTarget) {
  const configuredSum = targets.reduce((sum, target) => sum + (target.pct || 0), 0);
  if (configuredSum <= 0) return false;

  return aePotSumPoolPercent(lines, poolKey, hasAllAttrTarget) >= configuredSum;
}

/** 非百分比目標：每個設定各需一條不同排的詞條（避免同一條重複滿足多個目標） */
function aePotAllTargetsAppearOnDistinctLines(lines, targets, matchOptions = {}) {
  const usedLineIndexes = new Set();

  for (const target of targets) {
    let matched = false;
    for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
      if (usedLineIndexes.has(lineIndex)) continue;
      if (aePotLineMatchesTargetSpec(lines[lineIndex], target, matchOptions)) {
        usedLineIndexes.add(lineIndex);
        matched = true;
        break;
      }
    }
    if (!matched) return false;
  }

  return true;
}

/**
 * 自動重設成功判定：
 * 1. 主屬 %：依 STR/DEX/INT/LUK 分開計算；僅主屬設定時全屬性% 可計入
 * 2. 全屬性 %：僅計全屬性% 詞條加總 >= 設定加總
 * 3. 非百分比詞條：每個設定詞條在任意排出現
 */
function aePotGroupMatches(potential, group, matchOptions = {}) {
  const lines = potential?.lines || [];
  const entries = group
    .map((targetKey) => ({
      targetKey,
      parsed: aePotParseTargetKey(targetKey)
    }))
    .filter((entry) => entry.targetKey);

  if (!entries.length) return false;

  const hasAllAttrTarget = entries.some(
    (entry) => entry.parsed.statRaw === AE_POT_ALL_ATTR_STAT
  );

  const byPool = new Map();
  entries.forEach((entry) => {
    const poolKey = aePotPercentPoolKey(entry.parsed.statRaw);
    if (!byPool.has(poolKey)) byPool.set(poolKey, []);
    byPool.get(poolKey).push(entry.parsed);
  });

  for (const [poolKey, targets] of byPool.entries()) {
    const hasPct = targets.some((target) => target.pct != null);
    if (hasPct) {
      if (!aePotFlexiblePercentMatch(lines, targets, poolKey, hasAllAttrTarget)) return false;
      continue;
    }

    const allAppear = aePotAllTargetsAppearOnDistinctLines(lines, targets, matchOptions);
    if (!allAppear) return false;
  }

  return true;
}

/** 閃炫六選：比對詞條與數值，不檢查選項階級（六選各格階級由骰出決定） */
function aePotHexaGroupMatches(potential, group) {
  return aePotGroupMatches(potential, group, { ignoreRank: true });
}

/** 第 N 排是否符合任一組在該排設定的目標（未設定則視為通過） */
function aePotLineIndexMatchesAnyTarget(line, lineIndex, groups) {
  const targetKeys = groups
    .map((group) => group[lineIndex])
    .filter(Boolean);
  if (!targetKeys.length) return true;
  return targetKeys.some((targetKey) => aePotLineMatchesTarget(line, targetKey));
}

/** 結合方塊自動重設：回傳第一條不符合目標的排索引，無則 -1 */
function aePotFindFirstMismatchedLineIndex(potential, groups) {
  const lines = potential?.lines || [];
  for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
    if (!aePotLineIndexMatchesAnyTarget(lines[lineIndex], lineIndex, groups)) {
      return lineIndex;
    }
  }
  return -1;
}

/** 閃炫方塊：從六選三組合中找出符合任一目標組的索引（升序三選，與手動確認一致） */
function aePotFindHexaSelectionIndexes(session, groups, groupMatchesFn) {
  const options = session?.options;
  if (!options?.length || options.length < 3) return null;
  const matchFn = typeof groupMatchesFn === 'function' ? groupMatchesFn : aePotHexaGroupMatches;
  if (typeof buildPotentialFromHexaSelection !== 'function') return null;

  const optionCount = options.length;
  for (let i0 = 0; i0 < optionCount - 2; i0 += 1) {
    for (let i1 = i0 + 1; i1 < optionCount - 1; i1 += 1) {
      for (let i2 = i1 + 1; i2 < optionCount; i2 += 1) {
        const selectedIndexes = [i0, i1, i2];
        const potential = buildPotentialFromHexaSelection(session, selectedIndexes);

        const matched = groups.some((group) => {
          if (!group?.some(Boolean)) return false;
          return matchFn(potential, group);
        });
        if (matched) return selectedIndexes;
      }
    }
  }
  return null;
}

function aePotApplyHexaSession(session, selectedIndexes) {
  if (!session || !selectedIndexes?.length) return null;
  if (typeof buildPotentialFromHexaSelection !== 'function') return null;
  const potential = buildPotentialFromHexaSelection(session, selectedIndexes);
  potential.atkPow = session.previewAtkPow ?? potential.atkPow;
  return potential;
}

/** 閃炫六選中是否存在任一目標組合（三選） */
function aePotHexaSessionHasTargetMatch(session, groups, groupMatchesFn = aePotHexaGroupMatches) {
  return aePotFindHexaSelectionIndexes(session, groups, groupMatchesFn) != null;
}

/**
 * 閃炫方塊自動重設：顯示閃炫 UI，持續重骰六選直到出現目標組合，再停讓玩家自行 6 選 3。
 */
async function aePotRunHexaAutoEnchant(ctx) {
  const {
    cube,
    rollSession,
    consumeCube,
    groups,
    groupMatchesFn,
    sessionReady,
    openOverlayWithSession,
    updateOverlaySession,
    isRunning,
    isCancelled,
    loopDelayMs = 8,
    batchSize = 1,
    onProgress,
    maxRolls = 50000,
  } = ctx;

  let attempts = 0;
  let overlayOpened = false;
  let stoppedForManualPick = false;
  const delay = () => new Promise((resolve) => window.setTimeout(resolve, loopDelayMs));
  const stepsPerTick = Math.max(1, Number(batchSize) || 1);

  while (isRunning() && !isCancelled() && attempts < maxRolls) {
    let hit = false;
    for (let i = 0; i < stepsPerTick && isRunning() && !isCancelled() && attempts < maxRolls; i += 1) {
      consumeCube();
      attempts += 1;

      const session = rollSession();
      if (!session) continue;

      if (!overlayOpened) {
        openOverlayWithSession(cube, session, { fadeIn: true });
        overlayOpened = true;
      } else {
        updateOverlaySession(session);
      }
      onProgress?.({ attempts, phase: 'roll' });
      aePotSyncHexaAutoEnchantLayout?.();

      if (sessionReady(session)) {
        stoppedForManualPick = true;
        hit = true;
        break;
      }
    }
    if (hit || stoppedForManualPick) break;

    await delay();
  }

  return { attempts, stoppedForManualPick, overlayOpened };
}

function aePotApplyUnionLineRoll(item, potential, lineIndex, rateKey, eventId) {
  if (typeof rollUnionLine !== 'function') return null;

  const rankBefore = potential.rank;
  const rolled = rollUnionLine(item, potential, lineIndex, rateKey, eventId);
  if (!rolled) return null;

  const lines = (potential.lines || []).map((line, index) => (
    index === lineIndex ? { ...rolled } : { ...line }
  ));
  const atkPow = typeof rollUnionPreviewAtkPow === 'function'
    ? rollUnionPreviewAtkPow(potential)
    : potential.atkPow;
  const next = { ...potential, lines, atkPow };
  if (typeof syncUnionCubeOverallRank === 'function') {
    syncUnionCubeOverallRank(next, lineIndex, rankBefore);
  }
  return next;
}

/** 結合方塊：隨機選一排（與手動 open / reselect 相同，各 1/3） */
function aePotPickUnionLineIndex() {
  return typeof pickRandomUnionLineIndex === 'function'
    ? pickRandomUnionLineIndex()
    : Math.floor(Math.random() * 3);
}

/** 結合方塊自動重設：須對應潛能整體等級為傳說（一般／閃炫方塊不受此限） */
const AUTO_ENCHANT_UNION_REQUIRES_LEGENDARY_RANK = true;

/** 自動重設視窗開啟時，仍可點擊方塊列切換方塊（不關閉視窗、不觸發背景關閉） */
const AUTO_ENCHANT_ALLOW_CUBE_SWITCH_WHILE_OPEN = true;

/** 一般自動重設每輪間隔（毫秒） */
const AUTO_ENCHANT_LOOP_DELAY_MS = 100;

/** 超速模式 : 調整速度（每輪間隔 + 每輪步數） */
const AUTO_ENCHANT_OVERSPEED_LOOP_DELAY_MS = 5;
const AUTO_ENCHANT_OVERSPEED_BATCH_SIZE = 50;

function aePotGetAutoEnchantLoopDelayMs(overspeedMode) {
  if (overspeedMode) {
    return typeof AUTO_ENCHANT_OVERSPEED_LOOP_DELAY_MS === 'number'
      ? AUTO_ENCHANT_OVERSPEED_LOOP_DELAY_MS
      : 10;
  }
  return typeof AUTO_ENCHANT_LOOP_DELAY_MS === 'number'
    ? AUTO_ENCHANT_LOOP_DELAY_MS
    : 100;
}

function aePotGetAutoEnchantBatchSize(overspeedMode) {
  if (overspeedMode) {
    return typeof AUTO_ENCHANT_OVERSPEED_BATCH_SIZE === 'number'
      ? Math.max(1, AUTO_ENCHANT_OVERSPEED_BATCH_SIZE)
      : 3;
  }
  return 1;
}

function aePotIsLegendaryRank(rank) {
  return rank === 'legendary';
}

/** 自動重設傳說限制；符合條件時回傳阻擋原因字串，否則 null */
function aePotGetAutoEnchantLegendaryBlockReason(cube, potential, { forAddPotential = false } = {}) {
  if (!cube || !potential) return null;
  if (aePotIsLegendaryRank(potential.rank)) return null;

  if (forAddPotential && cube?.hexaPick) {
    return '附加閃炫方塊自動重設僅限傳說等級附加潛可使用';
  }

  if (aePotIsUnionCube(cube)
    && typeof AUTO_ENCHANT_UNION_REQUIRES_LEGENDARY_RANK !== 'undefined'
    && AUTO_ENCHANT_UNION_REQUIRES_LEGENDARY_RANK) {
    return forAddPotential
      ? '結合方塊自動重設僅限傳說等級附加潛可使用'
      : '結合方塊自動重設僅限傳說等級潛在能力使用';
  }

  return null;
}

function aePotIsHexaCube(cube) {
  // restoreAdd 同時用於附加閃炫與恢復附加；紀念方塊以 memoriaPick 區分
  if (!cube || cube.memoriaPick) return false;
  return Boolean(cube.hexaPick || cube.rateKey === 'dazzling' || cube.rateKey === 'restoreAdd');
}

function aePotIsUnionCube(cube) {
  return Boolean(cube?.uniPick || cube?.rateKey === 'union' || cube?.rateKey === 'unionAdd');
}

/** 結合方塊：該排是否為「非目標潛能、值得重骰」的排（僅看該排自身目標） */
function aePotIsUnionLineResettable(potential, lineIndex, groups) {
  const line = potential?.lines?.[lineIndex];
  if (!line) return false;

  const hasTargetAtRow = groups.some((group) => Boolean(group[lineIndex]));
  if (!hasTargetAtRow) return false;

  return !aePotLineIndexMatchesAnyTarget(line, lineIndex, groups);
}

function aePotHasUnionResettableLine(potential, groups) {
  const lines = potential?.lines || [];
  for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
    if (aePotIsUnionLineResettable(potential, lineIndex, groups)) {
      return true;
    }
  }
  return false;
}

/** 結合方塊：找出下一條要洗的排（先比對各排目標，再從未達標組挑有設定的排） */
function aePotFindUnionWorkLineIndex(potential, groups, groupMatchesFn) {
  const byRow = aePotFindFirstMismatchedLineIndex(potential, groups);
  if (byRow >= 0) return byRow;

  if (typeof groupMatchesFn !== 'function') return -1;

  for (const group of groups) {
    if (!group?.some(Boolean)) continue;
    if (groupMatchesFn(potential, group)) continue;
    for (let lineIndex = 0; lineIndex < group.length; lineIndex += 1) {
      if (group[lineIndex]) return lineIndex;
    }
  }
  return -1;
}

/**
 * 結合方塊自動重設核心迴圈。
 * 每輪：重新選擇（扣方塊，隨機直到選中任一「非目標」排）→ 重新設定一次 → 再判斷。
 * 不必從第一排往下洗；選中任何不符目標的排即可重骰。
 */
async function aePotRunUnionAutoEnchant(ctx) {
  const {
    getItem,
    getPotential,
    setPotential,
    consumeCube,
    rateKey,
    eventId = (typeof POTENTIAL_CUBE_EVENT_ID !== 'undefined' ? POTENTIAL_CUBE_EVENT_ID : 8421),
    groups,
    shouldStop,
    isRunning,
    isCancelled,
    loopDelayMs = 8,
    batchSize = 1,
    onProgress,
    maxCubeUses = 50000,
  } = ctx;

  let cubeUses = 0;
  let reselectUses = 0;
  let resetUses = 0;
  const delay = () => new Promise((resolve) => window.setTimeout(resolve, loopDelayMs));
  const stepsPerTick = Math.max(1, Number(batchSize) || 1);

  while (isRunning() && !isCancelled()) {
    const item = getItem();
    if (!item) break;

    const potential = getPotential();
    if (!potential?.lines?.length) break;
    if (shouldStop(potential)) break;
    if (!aePotHasUnionResettableLine(potential, groups)) break;

    let workLineIndex = -1;
    let steps = 0;
    while (isRunning() && !isCancelled() && cubeUses < maxCubeUses && steps < stepsPerTick) {
      consumeCube();
      cubeUses += 1;
      reselectUses += 1;
      steps += 1;
      const selectedLine = aePotPickUnionLineIndex();
      onProgress?.({ cubeUses, reselectUses, resetUses, badLineIndex: selectedLine, phase: 'reselect' });
      const latest = getPotential();
      if (shouldStop(latest)) {
        workLineIndex = -1;
        break;
      }
      if (aePotIsUnionLineResettable(latest, selectedLine, groups)) {
        workLineIndex = selectedLine;
        break;
      }
    }
    if (workLineIndex < 0) {
      if (shouldStop(getPotential())) break;
      await delay();
      continue;
    }

    const next = aePotApplyUnionLineRoll(item, getPotential(), workLineIndex, rateKey, eventId);
    if (!next) break;

    resetUses += 1;
    setPotential(next);
    onProgress?.({ cubeUses, reselectUses, resetUses, badLineIndex: workLineIndex, phase: 'reset' });
    if (shouldStop(getPotential())) break;

    await delay();
  }

  return { attempts: cubeUses, reselectUses, resetUses };
}

/** 閃炫 + 自動重設同時開啟時：虛化挖洞露出右側自動強化面板，並調整層級 */
function aeClipOverlayBackdropForPanel(overlayEl, panelEl, enable) {
  const backdrop = overlayEl?.querySelector(
    '.pt-hexa-modal-backdrop, .pt-memoria-modal-backdrop, .bs-choice-modal-backdrop, .sc-recovery-modal-backdrop'
  );
  if (!backdrop) return;
  if (!enable || !panelEl) {
    backdrop.style.clipPath = '';
    return;
  }
  const r = panelEl.getBoundingClientRect();
  if (r.width < 1 || r.height < 1) {
    backdrop.style.clipPath = '';
    return;
  }
  const x = Math.round(r.left);
  const y = Math.round(r.top);
  const x2 = Math.round(r.right);
  const y2 = Math.round(r.bottom);
  // evenodd：全螢幕矩形挖掉自動強化面板區域，虛化不蓋住右側面板
  backdrop.style.clipPath =
    `polygon(evenodd, 0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%, ${x}px ${y}px, ${x2}px ${y}px, ${x2}px ${y2}px, ${x}px ${y2}px, ${x}px ${y}px)`;
}

function aePotSyncHexaAutoEnchantLayout() {
  const potHexaEl = document.getElementById('ptHexaOverlay');
  const apHexaEl = document.getElementById('apHexaOverlay');
  const potAeEl = document.getElementById('aePotOverlay');
  const apAeEl = document.getElementById('aeApOverlay');

  const potHexaOpen = potHexaEl && !potHexaEl.classList.contains('hidden');
  const apHexaOpen = apHexaEl && !apHexaEl.classList.contains('hidden');
  const potAeOpen = typeof AutoEnchantPotentialModule !== 'undefined' && AutoEnchantPotentialModule.isOpen;
  const apAeOpen = typeof AutoEnchantAddPotentialModule !== 'undefined' && AutoEnchantAddPotentialModule.isOpen;

  potHexaEl?.classList.toggle('pt-hexa-modal--with-auto-enchant', potHexaOpen && potAeOpen);
  apHexaEl?.classList.toggle('pt-hexa-modal--with-auto-enchant', apHexaOpen && apAeOpen);
  potAeEl?.classList.toggle('ae-pot-modal--hexa-active', potHexaOpen && potAeOpen);
  apAeEl?.classList.toggle('ae-pot-modal--hexa-active', apHexaOpen && apAeOpen);

  aeClipOverlayBackdropForPanel(
    potHexaEl,
    potAeEl?.querySelector('.ae-pot-modal-panel'),
    potHexaOpen && potAeOpen
  );
  aeClipOverlayBackdropForPanel(
    apHexaEl,
    apAeEl?.querySelector('.ae-pot-modal-panel'),
    apHexaOpen && apAeOpen
  );

  const allowCubeSwitch = typeof AUTO_ENCHANT_ALLOW_CUBE_SWITCH_WHILE_OPEN !== 'undefined'
    && AUTO_ENCHANT_ALLOW_CUBE_SWITCH_WHILE_OPEN;
  potAeEl?.classList.toggle(
    'ae-pot-modal--cube-switchable',
    allowCubeSwitch && potAeOpen && !potHexaOpen
  );
  apAeEl?.classList.toggle(
    'ae-pot-modal--cube-switchable',
    allowCubeSwitch && apAeOpen && !apHexaOpen
  );
}

function aeBsIsMemorialItem(item) {
  return Boolean(item?.memorial);
}

function aePotIsMemoriaCube(cube) {
  return Boolean(cube?.memoriaPick);
}

/** 恢復方塊自動重設：BEFORE/AFTER 彈窗使用 auto 專用素材 */
function aePotSyncMemoriaAutoEnchantLayout() {
  const memoriaEl = document.getElementById('ptMemoriaOverlay');
  const memoriaOpen = memoriaEl && !memoriaEl.classList.contains('hidden');
  const autoMode = typeof PotentialModule !== 'undefined'
    && PotentialModule.isMemorialAutoChoiceUi?.();
  memoriaEl?.classList.toggle('pt-memoria-modal--auto-enchant', memoriaOpen && autoMode);

  const apMemoriaEl = document.getElementById('apMemoriaOverlay');
  const apMemoriaOpen = apMemoriaEl && !apMemoriaEl.classList.contains('hidden');
  const apAutoMode = typeof AddPotentialModule !== 'undefined'
    && AddPotentialModule.isMemorialAutoChoiceUi?.();
  apMemoriaEl?.classList.toggle('pt-memoria-modal--auto-enchant', apMemoriaOpen && apAutoMode);
}

/** 暗黑輪迴星火自動重設：BEFORE/AFTER 彈窗使用 auto 專用素材 */
function aeBsSyncChoiceAutoEnchantLayout() {
  const choiceEl = document.getElementById('bsChoiceOverlay');
  const choiceOpen = choiceEl && !choiceEl.classList.contains('hidden');
  const autoMode = typeof BonusStatChoiceModule !== 'undefined'
    && BonusStatChoiceModule.isMemorialAutoChoiceUi?.();

  choiceEl?.classList.toggle('bs-choice-modal--auto-enchant', choiceOpen && autoMode);
}

/** 切換 enchant 工具列分頁時關閉所有自動強化視窗 */
function aeCloseAllAutoEnchantOverlays() {
  if (typeof AutoEnchantPotentialModule !== 'undefined' && AutoEnchantPotentialModule.isOpen) {
    AutoEnchantPotentialModule.close();
  }
  if (typeof AutoEnchantAddPotentialModule !== 'undefined' && AutoEnchantAddPotentialModule.isOpen) {
    AutoEnchantAddPotentialModule.close();
  }
  if (typeof AutoEnchantStarForceModule !== 'undefined' && AutoEnchantStarForceModule.isOpen) {
    AutoEnchantStarForceModule.close();
  }
  if (typeof AutoEnchantBonusStatModule !== 'undefined' && AutoEnchantBonusStatModule.isOpen) {
    AutoEnchantBonusStatModule.close();
  }
  aePotSyncHexaAutoEnchantLayout?.();
  aeBsSyncChoiceAutoEnchantLayout?.();
  aePotSyncMemoriaAutoEnchantLayout?.();
}
